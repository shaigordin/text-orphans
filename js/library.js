// Every TLHdig text of five or more words as a vector of the main model, for the closest
// manuscripts, the closest compositions (CTH numbers) and the join checks.
// Mirrors orphans/run_join_candidates.py: the pool is every text with at least 5 words except the
// query itself, in the main model's space (word forms + sign n-grams, vocabulary and idf fitted
// on the reference), compared by cosine. Word forms come from TLHdig's own analyses
// (data/forms.json), so the vectors are those of the Python pipeline, not a re-parse.
import * as V from "./data.js";
import * as Q from "./model.js";

const MIN_WORDS = 5;
const SKIP = /^(\d+|~.*|x)$/;                                  // numbers, clitic pieces, "x"
const normSp = t => t.replace(/[\[\]⸢⸣()?!<>«»#*]/g, "").trim(); // spelling as written
const json = p => fetch(p).then(r => r.json());

let LIB = null;
export async function loadLibrary(model, corpus, base = V.DIR) {
  if (LIB) return LIB;
  const [t1, t2, F] = await Promise.all([json(`${base}/texts.json`), json(`${base}/texts_more.json`), json(`${base}/forms.json`)]);
  const texts = Object.assign({}, t1, t2);
  const meta = new Map(corpus.map(c => [c.id, c]));
  const docs = [];
  for (const [id, fi] of Object.entries(F.texts)) {
    const c = meta.get(id), text = texts[id];
    if (!c || text === undefined) continue;
    const words = fi.map(i => F.forms[i]), translits = text.split(" ").filter(Boolean);  // as forms.json, without empty words
    const d = { id, cth: c.cth, n: c.n, c, text, words, translits };
    if (c.n >= MIN_WORDS && !c.short) {
      const tf = new Map();
      const add = t => { const j = model.index.get(t); if (j !== undefined) tf.set(j, (tf.get(j) || 0) + 1); };
      for (const w of words) add(w);
      for (const t of translits) {
        const sg = Q.signs(t);
        for (let k = 1; k <= 3; k++) for (let i = 0; i + k <= sg.length; i++) add("§" + sg.slice(i, i + k).join("·"));
      }
      d.idx = Int32Array.from(tf.keys());
      d.w = Float32Array.from(d.idx, j => (1 + Math.log(tf.get(j))) * model.idf[j]);  // unnormalised tf-idf
    }
    docs.push(d);
  }
  const byId = new Map(docs.map(d => [d.id, d]));
  LIB = { docs, pool: docs.filter(d => d.idx), byId, texts, norms: new Map(), cthNorms: new Map() };
  return LIB;
}

// A TLHdig text as the model's parser would read it, but with TLHdig's own word forms.
export function parsedOf(id, model) {
  const d = LIB.byId.get(id);
  return { dropped: [], words: d.translits.map((t, i) => ({ raw: t, translit: t, signs: Q.signs(t),
    word: model.index.has(d.words[i]) ? d.words[i] : null, form: d.words[i] })) };
}

// Norm of each pool text over the features a filter keeps.
function norms(filter) {
  if (!LIB.norms.has(filter.key)) {
    const m = filter.mask;
    LIB.norms.set(filter.key, Float32Array.from(LIB.pool, d => {
      let s = 0;
      for (let k = 0; k < d.idx.length; k++) if (!m || m[d.idx[k]]) s += d.w[k] * d.w[k];
      return Math.sqrt(s);
    }));
  }
  return LIB.norms.get(filter.key);
}

// Cosine of the query vector (Q.scoreParsed().vec, already filtered and normalised) with every pool text.
export function similarities(vec, filter, V) {
  const q = new Float32Array(V);
  for (const [j, x] of vec) q[j] = x;
  const N = norms(filter);
  return Float32Array.from(LIB.pool, (d, i) => {
    let s = 0;
    for (let k = 0; k < d.idx.length; k++) s += q[d.idx[k]] * d.w[k];
    return N[i] ? s / N[i] : 0;
  });
}

// Closest manuscripts, best first, leaving out the query text itself.
export function closestManuscripts(sims, { exclude = null, top = 20 } = {}) {
  const order = [...sims.keys()].filter(i => LIB.pool[i].id !== exclude).sort((a, b) => sims[b] - sims[a]);
  return order.slice(0, top).map((i, r) => ({ rank: r + 1, doc: LIB.pool[i], sim: sims[i] }));
}

// Compositions are CTH numbers; their members are the pool texts filed under them, except the
// orphans (CTH 470 and EBo) and the Laroche bins, which are bins rather than compositions
// (as in orphans/make_release.py, the Zenodo dataset).
export const BINS = new Set(["470", "500", "670", "832"]);
const member = d => d.cth !== "470" && !d.id.startsWith("EBo") && !BINS.has(d.cth);

// Sum of the normalised vectors of one CTH's member texts, as a sparse Map.
function cthSum(cth, filter, leaveOut = null) {
  const N = norms(filter), m = filter.mask, S = new Map();
  LIB.pool.forEach((d, i) => {
    if (d.cth !== cth || d.id === leaveOut || !N[i] || !member(d)) return;
    for (let k = 0; k < d.idx.length; k++) {
      const j = d.idx[k];
      if (!m || m[j]) S.set(j, (S.get(j) || 0) + d.w[k] / N[i]);
    }
  });
  return S;
}
const norm2 = S => Math.sqrt([...S.values()].reduce((a, x) => a + x * x, 0));

// Closest compositions: cosine with the centroid of each CTH number (its member texts of 5+ words).
// The query text is left out of its own CTH's centroid.
export function closestCompositions(sims, filter, { exclude = null, top = 20 } = {}) {
  if (!LIB.cthNorms.has(filter.key)) {
    const cths = [...new Set(LIB.pool.filter(member).map(d => d.cth))];
    LIB.cthNorms.set(filter.key, new Map(cths.map(c => [c, norm2(cthSum(c, filter))])));
  }
  const cn = LIB.cthNorms.get(filter.key), N = norms(filter);
  const dot = new Map(), count = new Map();
  LIB.pool.forEach((d, i) => {
    if (d.id === exclude || !N[i] || !member(d)) return;
    dot.set(d.cth, (dot.get(d.cth) || 0) + sims[i]);
    count.set(d.cth, (count.get(d.cth) || 0) + 1);
  });
  const own = exclude && LIB.byId.get(exclude)?.cth;
  const out = [...dot.keys()].map(c => {
    const n = c === own ? norm2(cthSum(c, filter, exclude)) : cn.get(c);
    return { cth: c, sim: n ? dot.get(c) / n : 0, texts: count.get(c) };
  });
  return out.sort((a, b) => b.sim - a.sim).slice(0, top).map((x, r) => ({ rank: r + 1, ...x }));
}

// Join checks of run_join_candidates.py for one candidate: the fragment's content words (first
// occurrence, in line order) are found in the candidate with the same spelling (S), another
// spelling (W) or not at all (.); its two-word phrases are looked up among the candidate's.
// Flagged when (a) at least half the words are shared, (b) all shared words are spelled the same,
// (c) at least one phrase is shared.
// Spellings agree on every sign both pieces preserve (∅ = not on the tablet; run_join_candidates.same_spelling).
export function sameSpelling(a, b) {
  if (!(a + b).includes("∅")) return a === b;
  const sa = a.split(/[-.\s{}]+/), sb = b.split(/[-.\s{}]+/);
  return sa.length === sb.length && sa.every((x, i) => x === sb[i] || x.includes("∅") || sb[i].includes("∅"));
}
const lost = t => (t.match(/∅/g) || []).length;

export function fragmentColumns(words, translits) {
  const fw = words.map((w, i) => [w, normSp(translits[i])]).filter(([w]) => w && !SKIP.test(w));
  const cols = [], seen = new Set(), first = new Map();
  fw.forEach(([w], i) => { if (!first.has(w)) first.set(w, i); });
  // each word once, with its most complete spelling (fewest signs off the tablet), in text order
  for (const [w, t] of [...fw].sort((a, b) => lost(a[1]) - lost(b[1]))) if (!seen.has(w)) { seen.add(w); cols.push([w, t]); }
  cols.sort((a, b) => first.get(a[0]) - first.get(b[0]));
  const pairs = new Map();
  for (let i = 0; i + 1 < fw.length; i++) if (fw[i][0] !== fw[i + 1][0]) pairs.set(fw[i][0] + "\u0000" + fw[i + 1][0], [fw[i][0], fw[i + 1][0]]);
  return { cols, pairs: [...pairs.values()] };
}
export function joinChecks(frag, doc) {
  const spell = new Map();
  doc.words.forEach((w, i) => { if (!spell.has(w)) spell.set(w, new Set()); spell.get(w).add(normSp(doc.translits[i])); });
  const cells = frag.cols.map(([w, t]) => spell.has(w) ? ([...spell.get(w)].some(u => sameSpelling(t, u)) ? "S" : "W") : ".").join("");
  const bigr = new Set(doc.words.slice(1).map((w, i) => doc.words[i] + "\u0000" + w));
  const phrases = frag.pairs.filter(([a, b]) => bigr.has(a + "\u0000" + b));
  const shared = [...cells].filter(c => c !== ".").length;
  const checks = { half: shared >= frag.cols.length / 2, spelling: shared > 0 && !cells.includes("W"), phrase: phrases.length > 0 };
  return { cells, shared, phrases, checks, flagged: checks.half && checks.spelling && checks.phrase,
    different: frag.cols.filter((_, k) => cells[k] === "W").map(([w, t]) => ({ word: w, fragment: t, candidate: [...spell.get(w)] })) };
}

// Words of a pasted text: TLHdig's form where the model knows it, else the cleaned spelling.
export const formsOf = parsed => parsed.words.map(w => w.form ?? w.word ?? normSp(w.translit));
export { normSp };

// TLHdig's word forms of one text without loading the whole library (place.html).
let FORMS = null;
export async function parsedById(id, text, model, base = V.DIR) {
  FORMS ??= await json(`${base}/forms.json`);
  const fi = FORMS.texts[id];
  if (!fi) return null;
  return { dropped: [], words: text.split(" ").map((t, i) => {
    const f = FORMS.forms[fi[i]];
    return { raw: t, translit: t, signs: Q.signs(t), word: model.index.has(f) ? f : null, form: f };
  }) };
}

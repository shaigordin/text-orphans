// One text, every result: the placement among the ten traditions, the closest compositions and
// manuscripts, and the join checks. Used by the quick check on the opening page and by
// "Closest texts and joins".
import * as V from "./data.js";
import * as Q from "./model.js";
import * as T from "./translit.js";
import * as L from "./library.js";
import * as P from "./portal.js";
import { verdictOf } from "./verdict.js";

let S = null;
export async function setup() {
  if (S) return S;
  const model = await Q.loadModel();
  const corpus = await (await fetch(V.url("corpus.json"))).json();
  const titles = await (await fetch(V.url("cth_titles.json"))).json();
  S = { model, corpus, titles, byId: new Map(corpus.map(c => [c.id, c])) };
  return S;
}
export const library = () => L.loadLibrary(S.model, S.corpus);

// What the user typed: a TLHdig text (siglum, or a TLHdig or Konkordanz link), a CTH number, or
// a transliteration.
export function resolve(input) {
  const s = input.trim();
  if (!s) return null;
  const cth = s.match(/^CTH\s*(\d+)/i);
  if (cth) return { cth: cth[1] };
  const id = (s.length < 80 || /^https?:/.test(s)) && P.findId(s, [...S.byId.keys()]);
  return id ? { id } : { text: s };
}

// Placement in words, as on "Place a fragment": [headline, explanation, placed?]
export function verdict(r, model, { hideCommon = false } = {}) {
  const fmt = x => x.toFixed(3);
  if (!r.vec.size) return ["Nothing in this text matches the model's vocabulary.", "", false];
  const o = r.open;
  if (!o) return [`Nearest tradition: <b>${r.top}</b>`, `Exploratory setting (${describe(r.filter)}): the threshold for placing a fragment was calibrated on the full model only, so this shows the nearest tradition without a verdict. Margin over ${r.runnerUp}: ${fmt(r.gap)}.`, false];
  if (o.outside) return [`Outside the reference traditions <span class="muted">(closest genre: ${o.outside})</span>`,
    `With other genres added as classes, the nearest class is ${o.outside}.`, false];
  if (o.lowFit) return [`Fits no known tradition <span class="muted">(nearest: ${r.top})</span>`,
    `Its best similarity, ${fmt(r.topScore)}, is below ${fmt(o.floor)}, which 95% of reference fragments of this size reach.`, false];
  if (!r.assigned) return [`Too close to call <span class="muted">(nearest: ${r.top})</span>`,
    `${r.top} beats ${r.runnerUp} by ${fmt(r.gap)}, less than the ${model.margin} needed to place a fragment.`, false];
  const at = Q.attribute(r, Q.decisionWeights(r, model), model), common = at.sum > 0 ? at.common / at.sum : 0;
  if (common > 0.5 && hideCommon) return [`Not placed: rests mostly on common words <span class="muted">(nearest: ${r.top})</span>`,
    `${Math.round(100 * common)}% of the margin comes from features every tradition shares, such as nu. You chose to treat such placements as unplaced.`, false];
  return [`Placed in <b>${r.assigned}</b>`, `It beats ${r.runnerUp} by ${fmt(r.gap)} (needed: ${model.margin}).` +
    (common > 0.5 ? ` Caution: ${Math.round(100 * common)}% of that margin comes from common words such as nu; such placements are right much less often.` : ""), true];
}
export const describe = f => ({ both: "words and spellings", words: "words only", signs: "spellings only" }[f.features]) +
  (f.writing === "all" ? "" : f.writing === "logo" ? ", logograms only" : ", phonetic renderings only");

// Everything about one text. `q` is {id} or {text}; `set` the settings (settings.js).
export async function analyse(q, set, { joins = 20 } = {}) {
  const { model } = S;
  const lib = await library();
  const filter = Q.featureFilter(model, set);
  const parsed = q.id && lib.byId.has(q.id) ? L.parsedOf(q.id, model) : Q.parse(q.text ?? "", model);
  const r = Q.scoreParsed(parsed, model, { filter });
  const order = r.s.map((s, i) => i).sort((a, b) => r.s[b] - r.s[a]);
  const traditions = order.map(i => ({ tradition: model.traditions[i], sim: r.s[i] }));
  if (!r.vec.size) return { q, r, traditions, manuscripts: [], compositions: [], frag: null };
  const sims = L.similarities(r.vec, filter, model.vocab.length);
  const top = Math.max(set.top, joins);
  const manuscripts = L.closestManuscripts(sims, { exclude: q.id, top });
  const compositions = L.closestCompositions(sims, filter, { exclude: q.id, top: set.top })
    .map(c => ({ ...c, title: S.titles[c.cth] ?? "" }));
  const d = q.id && lib.byId.get(q.id);
  const frag = d ? L.fragmentColumns(d.words, d.translits) : L.fragmentColumns(L.formsOf(parsed), parsed.words.map(w => w.translit));
  for (const m of manuscripts) {
    m.join = L.joinChecks(frag, m.doc);
    m.verdict = verdictOf(m.doc.c, model);
  }
  return { q, r, traditions, manuscripts, compositions, frag, words: d ? d.words : L.formsOf(parsed),
           translits: d ? d.translits : parsed.words.map(w => w.translit) };
}

// Two transliterations side by side, shared words marked: same word and spelling (solid), same
// word in another spelling (outlined). Returns [htmlA, htmlB].
// The editors' text of one TLHdig text with the status of each sign (data versions with
// edition/ files, i.e. built from a token table with sign status): [[translit, status, counted]].
const SHARDS = 64, shards = new Map();
export async function edition(id) {
  if (!id || !V.INFO.versions[V.KEY].edition) return null;
  let k = 0;
  for (let i = 0; i < id.length; i++) k += id.charCodeAt(i);
  k %= SHARDS;
  if (!shards.has(k)) shards.set(k, fetch(V.url(`edition/${String(k).padStart(2, "0")}.json`)).then(r => r.json()).catch(() => ({})));
  return (await shards.get(k))[id] ?? null;
}

const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// Why a word of the edition does not count: most of it is not on the tablet (version C), or
// TLHdig gives it no word form (both versions).
const whyNot = st => st && [...st].filter(c => c === "P" || c === "D").length / st.length < 0.5
  ? "not counted: mostly restored, and not preserved elsewhere in this text"
  : "not counted: TLHdig gives no word form for it";

// The two texts of a window, shared words marked. With `ed` (from edition()), the editors' full
// text is shown: restored signs in grey, damaged signs underlined, words that do not count
// (mostly restored) struck through; the marks come from the counted words, as before.
export function sharedHTML(a, b) {
  const spell = (words, tr) => {
    const m = new Map();
    words.forEach((w, i) => { if (!m.has(w)) m.set(w, new Set()); m.get(w).add(L.normSp(tr[i])); });
    return m;
  };
  const SKIP = /^(\d+|~.*|x)$/;
  const sa = spell(a.words, a.translits), sb = spell(b.words, b.translits);
  const markOne = (w, t, other, html) => {
    if (SKIP.test(w) || !other.has(w)) return `<span>${html}</span>`;
    return [...other.get(w)].some(u => L.sameSpelling(L.normSp(t), u)) ? `<mark class="same" title="${w}: same word, same spelling">${html}</mark>`
      : `<mark class="other" title="${w}: same word, spelled ${[...other.get(w)].join(", ")} in the other text">${html}</mark>`;
  };
  const mark = (x, other) => {
    const n = x.words.length;
    if (x.ed && x.ed.filter(e => e[2]).length === n) {
      let i = 0;
      return x.ed.map(([t, st, counted, ly, fl]) => counted
        ? markOne(x.words[i], x.translits[i++], other, T.word(t, st, ly, fl))
        : `<span class="uncounted" title="${whyNot(st)}">${T.word(t, st, ly, fl)}</span>`).join(" ");
    }
    return x.words.map((w, i) => markOne(w, x.translits[i], other, T.word(x.translits[i]))).join(" ");
  };
  return [mark(a, sb), mark(b, sa)];
}

// Rows for the export buttons.
export function exportRows(res, set) {
  const meta = { query: res.q.id ?? "pasted text", settings: describe(res.r.filter), data: "TLHdig Beta 0.3 (doi:10.5281/zenodo.20328284)" };
  return {
    traditions: res.traditions.map((t, i) => ({ ...meta, rank: i + 1, tradition: t.tradition, similarity: +t.sim.toFixed(4) })),
    compositions: res.compositions.map(c => ({ ...meta, rank: c.rank, cth: c.cth, title: c.title, texts: c.texts, similarity: +c.sim.toFixed(4) })),
    // column names as in the Zenodo dataset's nearest_manuscripts.csv where they mean the same
    manuscripts: res.manuscripts.slice(0, set.top).map(m => ({ ...meta, rank: m.rank, candidate_txtid: m.doc.id, candidate_cth: m.doc.cth,
      candidate_n_words: m.doc.n, candidate_model_verdict: m.verdict, similarity: +m.sim.toFixed(4), match_barcode: m.join.cells,
      shared_words: m.join.shared, shared_phrases: m.join.phrases.map(p => p.join(" ")).join("; "),
      check_half_the_words: m.join.checks.half, check_same_spellings: m.join.checks.spelling, check_shared_phrase: m.join.checks.phrase,
      passes_match_checks: m.join.flagged })),
  };
}

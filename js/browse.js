// Genres and compositions: the corpus by the genres of the Catalogue of Hittite Texts (its main
// sections and lettered subsections), the compositions in each, and where the method places their
// manuscripts; Laroche's residual bins and the EBo fragments as their own table; a search for any
// CTH number, title or siglum. CTH numbers are labels here, not the way in.
import * as V from "./data.js";
import { loadModel } from "./model.js";
import { SHORT } from "./draw.js";
import { CATEGORIES, UNPLACED, KINDS, verdictOf, verdictColor } from "./verdict.js";
import * as P from "./portal.js";
import * as T from "./settings.js";
import * as X from "./export.js";
import * as G from "./genres.js";

const $ = id => document.getElementById(id);
const [model, corpus, titles] = await Promise.all([
  loadModel(),
  fetch(V.url("corpus.json")).then(r => r.json()),
  fetch(V.url("cth_titles.json")).then(r => r.json()),
]);
// "Treat as unplaced" (settings): a placement resting mostly on common words counts as undecided
let set = T.bar($("settings"), ["reading", "common"], s => { set = s; judge(); matrix(); genres(); if (state.cell) showCell(...state.cell.split("|")); if (state.comp) showComp(state.comp); });
function judge() {
  for (const c of corpus) {
    c.verdict = verdictOf(c, model);
    if (set.common === "hide" && c.kind !== "ref" && c.common > 0.5 && !UNPLACED.includes(c.verdict)) c.verdict = "Undecided";
  }
}
judge();

const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
const label = v => SHORT[v] ?? v;
const isPlaced = v => !UNPLACED.includes(v);
const pct = (a, b) => (b ? Math.round((100 * a) / b) + "%" : "–");

// rows: the residual bins as Laroche left them, the EBo fragments apart, and the reference
// manuscripts (held out) as the test of the method
const ROWS = [
  ["CTH 470", "fragments of rituals", c => c.cth === "470" && !c.id.startsWith("EBo")],
  ["CTH 500", "fragments of Kizzuwatna rituals", c => c.cth === "500" && !c.id.startsWith("EBo")],
  ["CTH 670", "fragments of festivals", c => c.cth === "670" && !c.id.startsWith("EBo")],
  ["CTH 832", "fragments of various content", c => c.cth === "832" && !c.id.startsWith("EBo")],
  ["EBo", "EBo fragments, any CTH number", c => c.id.startsWith("EBo")],
  ["Reference", "manuscripts of 17+ words that build the profiles, each held out (test)", c => c.kind === "ref"],
];
// columns: the ten traditions, then the unplaced; "outside" joins the two open-set verdicts
const OUT = ["Fits no known tradition", "Outside the reference genres"];
const HEAD = { "Palaic festivals": "Palaic", "Luwian festivals (Ištanuwa, Lallupiya)": "Luwian festivals", "Kizzuwatna rituals": "Kizzuwatna rituals",
  "Luwian rituals (Puriyanni, Kuwattalla)": "Luwian rituals", "Arzawa / western rituals": "Arzawa, western", "Mixed (Hurrian, Syrian, Luwian)": "Mixed Hurrian" };
const COLS = [...CATEGORIES.filter(v => isPlaced(v)).map(v => [v, HEAD[v] ?? label(v), x => x === v]),
  ["Undecided", "Undecided", x => x === "Undecided"],
  ["Outside", "Outside the ten", x => OUT.includes(x)],
  ["Under 5 words", "Under 5 words", x => x === "Under 5 words"]];
const colColour = k => k === "Outside" ? verdictColor(OUT[0]) : verdictColor(k);

const state = Object.assign({ cell: "", q: "", comp: "", t: "", open: "" }, Object.fromEntries(new URLSearchParams(location.hash.slice(1))));
const save = () => history.replaceState(null, "", "#" + new URLSearchParams(Object.entries(state).filter(([, v]) => v)));
if (/^\d+$/.test(state.open)) { state.q = "CTH " + state.open; state.open = ""; }   // old links: browse.html#open=701

function matrix() {
  const head = `<thead><tr><th></th><th class="placed">Placed</th>${COLS.map(([k, l]) => `<th title="${esc(k)}"><span class="swatch sq" style="background:${colColour(k)}"></span>${esc(l)}</th>`).join("")}</tr></thead>`;
  const body = ROWS.map(([name, desc, f]) => {
    const texts = corpus.filter(f), n = COLS.map(([, , g]) => texts.filter(c => g(c.verdict)).length);
    const judged = texts.length - n[n.length - 1], placed = n.slice(0, 10).reduce((a, b) => a + b, 0);
    const max = Math.max(...n.slice(0, 10), 1);
    return `<tr${name === "Reference" ? ' class="ref"' : ""}><th scope="row"><b>${esc(name)} <span class="muted small">${texts.length.toLocaleString()}</span></b><span class="small muted">${esc(desc)}</span></th>` +
      `<td class="placed"><b>${pct(placed, judged)}</b><br><span class="small muted">${placed.toLocaleString()} of ${judged.toLocaleString()}</span></td>` +
      n.map((v, i) => {
        const [k] = COLS[i], trad = i < 10;
        const bg = trad && v ? `background:color-mix(in srgb, ${colColour(k)} ${Math.round(12 + 70 * v / max)}%, transparent)` : "";
        return `<td class="num${v ? " hit" : ""}${state.cell === name + "|" + k ? " on" : ""}" style="${bg}" ${v ? `data-cell="${esc(name)}|${esc(k)}" tabindex="0" title="${esc(name)}: ${v} placed in ${esc(k)}"` : ""}>${v ? v.toLocaleString() : "·"}</td>`;
      }).join("") + `</tr>`;
  }).join("");
  $("matrix").innerHTML = head + `<tbody>${body}</tbody>`;
  for (const td of $("matrix").querySelectorAll("td[data-cell]")) {
    const go = () => { showCell(...td.dataset.cell.split("|")); $("listCard").scrollIntoView({ behavior: "smooth", block: "start" }); };
    td.onclick = go; td.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } };
  }
  $("mnote").innerHTML = `Placed: the nearest tradition leads the runner-up by at least ${model.margin}, and the manuscript is not outside the ten traditions. Manuscripts under 5 words are not tested. Reference manuscripts are tested held out, so their row shows how often the method gets a known manuscript right.`;
}


// ---------- genres and compositions ----------
// the ten traditions, then the three unplaced groups, in the order of the bars
const PARTS = [...COLS.slice(0, 10), COLS[10], COLS[11], COLS[12]];
const counts = texts => PARTS.map(([, , g]) => texts.filter(c => g(c.verdict)).length);
function bar(n) {
  const all = n.reduce((a, b) => a + b, 0) || 1;
  return `<span class="gbar" aria-hidden="true">${n.map((v, i) => v ? `<span style="width:${(100 * v) / all}%;background:${colColour(PARTS[i][0])}" title="${esc(PARTS[i][1])}: ${v}"></span>` : "").join("")}</span>`;
}
function lead(n) {   // the tradition most of the placed manuscripts go to, and its share of the placed
  const placed = n.slice(0, 10), sum = placed.reduce((a, b) => a + b, 0);
  if (!sum) return `<span class="muted">none placed</span>`;
  const i = placed.indexOf(Math.max(...placed)), k = PARTS[i][0];
  const others = placed.filter(v => v).length - 1;
  return `<span class="swatch sq" style="background:${colColour(k)}"></span>${esc(label(k))} <span class="muted" title="${placed[i]} of the ${sum} placed manuscripts">${pct(placed[i], sum)} of ${sum.toLocaleString()} placed${others ? ` · +${others} other${others > 1 ? "s" : ""}` : ""}</span>`;
}
const byCth = new Map();
for (const c of corpus) { const k = +c.cth; byCth.has(k) || byCth.set(k, []); byCth.get(k).push(c); }
const inRange = x => [...byCth.keys()].filter(k => k >= x.from && k <= x.to).sort((a, b) => a - b);
const tFilter = () => state.t ? COLS.find(x => x[0] === state.t) : null;

function compRow(k) {
  const texts = byCth.get(k), n = counts(texts), f = tFilter();
  const hit = f ? texts.filter(c => f[2](c.verdict)).length : texts.length;
  if (f && !hit) return "";
  const bin = G.BINS[k] ? ` <span class="tag">residual bin</span>` : "";
  return `<tr class="comp${state.comp === String(k) ? " on" : ""}" data-comp="${k}" tabindex="0"><td>${esc(titles[k] ?? "untitled")}${bin}</td><td><span class="tag cth">CTH ${k}</span></td>` +
    `<td class="num">${f ? `<b>${hit}</b> <span class="muted">of</span> ` : ""}${texts.length.toLocaleString()}</td><td>${bar(n)}</td><td class="small">${lead(n)}</td></tr>`;
}
function genres() {
  const f = tFilter(), open = new Set(state.open.split(",").filter(Boolean));
  $("genres").innerHTML = G.GENRES.map(g => {
    const ks = inRange(g), texts = ks.flatMap(k => byCth.get(k)), n = counts(texts);
    const hit = f ? texts.filter(c => f[2](c.verdict)).length : 0;
    const subs = g.subs.length ? g.subs : [{ n: "", name: "", from: g.from, to: g.to }];
    const inner = subs.map(s => {
      const rows = inRange(s).map(compRow).join("");
      if (!rows) return "";
      const st = inRange(s).flatMap(k => byCth.get(k));
      return (s.name ? `<h4>${esc(s.n)}. ${esc(s.name)} <span class="tag cth">${G.range(s)}</span> <span class="muted small">${st.length.toLocaleString()} manuscripts</span></h4>` : "") +
        `<table class="comps"><tr><th>Composition</th><th>CTH</th><th class="num">Manuscripts</th><th>Where they are placed</th><th>Most of the placed go to</th></tr>${rows}</table>`;
    }).join("");
    return `<details class="genre" data-g="${g.n}"${open.has(g.n) ? " open" : ""}><summary>` +
      `<span class="gname"><span class="roman">${g.n}</span> ${esc(g.name)} <span class="tag cth">${G.range(g)}</span></span>` +
      `<span class="num">${f ? `<b>${hit.toLocaleString()}</b> <span class="muted">of</span> ` : ""}${texts.length.toLocaleString()}</span>${bar(n)}<span class="small">${lead(n)}</span></summary>` +
      `<div class="gbody">${inner || `<p class="muted small">No manuscripts placed in ${esc(label(state.t))}.</p>`}</div></details>`;
  }).join("");
  for (const d of $("genres").querySelectorAll("details")) d.ontoggle = () => {
    const o = new Set(state.open.split(",").filter(Boolean)); d.open ? o.add(d.dataset.g) : o.delete(d.dataset.g);
    state.open = [...o].join(","); save();
  };
  for (const tr of $("genres").querySelectorAll("tr.comp")) {
    const go = () => { showComp(tr.dataset.comp); $("listCard").scrollIntoView({ behavior: "smooth", block: "start" }); };
    tr.onclick = go; tr.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } };
  }
  $("legend").innerHTML = PARTS.map(([k, l]) => `<span><span class="swatch sq" style="background:${colColour(k)}"></span>${esc(l)}</span>`).join("");
}
function filterBar() {
  const opts = [["", "All"], ...COLS.slice(0, 10).map(([k, l]) => [k, l])];
  $("tfilter").innerHTML = `<span class="small muted">Show only manuscripts placed in:</span> ` + opts.map(([k, l]) =>
    `<button type="button" class="chip${state.t === k ? " on" : ""}" data-t="${esc(k)}">${k ? `<span class="swatch sq" style="background:${colColour(k)}"></span>` : ""}${esc(l)}</button>`).join("");
  for (const b of $("tfilter").querySelectorAll("button")) b.onclick = () => {
    state.t = b.dataset.t; save(); filterBar(); genres();
  };
}
// ---------- the manuscripts of one cell, or of a search ----------
const LIMIT = 200;
function table(texts, all = false) {
  texts = texts.slice().sort((a, b) => (isPlaced(b.verdict) - isPlaced(a.verdict)) || (b.gap ?? 0) - (a.gap ?? 0) || b.n - a.n);
  const shown = all ? texts : texts.slice(0, LIMIT);
  return `<table class="texts"><tr><th>Manuscript</th><th>CTH</th><th class="num">Words</th><th>Placement</th><th class="num">Lead</th><th>Open</th></tr>` +
    shown.map(c => `<tr><td>${esc(c.id)}</td><td>${esc(c.cth)}</td><td class="num">${c.n}</td>
      <td><span class="swatch sq" style="background:${verdictColor(c.verdict)}"></span>${esc(c.verdict)}${c.kind === "ref" && c.verdict !== c.label && isPlaced(c.verdict) ? ` <span class="muted">(reference of ${esc(label(c.label))})</span>` : ""}${isPlaced(c.verdict) && c.common > 0.5 ? ` <span class="warn" title="More than half of the lead comes from words every tradition shares, such as nu.">common words</span>` : ""}</td>
      <td class="num">${c.gap === undefined ? "" : c.gap.toFixed(3)}</td>
      <td class="small">${c.short ? "" : `<a href="place.html#id=${encodeURIComponent(c.id)}">place</a> · <a href="closest.html#id=${encodeURIComponent(c.id)}">closest</a> · `}${P.portalLinks(c.id, c.cth)}</td></tr>`).join("") +
    `</table>` + (shown.length < texts.length ? `<button type="button" class="more">Show all ${texts.length.toLocaleString()}</button>` : "");
}
function fill(box, texts) {
  box.innerHTML = table(texts);
  box.querySelector(".more")?.addEventListener("click", () => { box.innerHTML = table(texts, true); });
}
let listed = [];
function showCell(row, col) {
  const r = ROWS.find(x => x[0] === row), c = COLS.find(x => x[0] === col);
  if (!r || !c) return;
  state.cell = row + "|" + col; state.comp = ""; save();
  for (const tr of $("genres").querySelectorAll("tr.on")) tr.classList.remove("on");
  listed = corpus.filter(r[2]).filter(x => c[2](x.verdict));
  $("listCard").hidden = false;
  $("listTitle").innerHTML = `${esc(row)} <span class="muted">→</span> <span class="swatch sq" style="background:${colColour(col)}"></span>${esc(c[1])}: ${listed.length.toLocaleString()} manuscripts`;
  fill($("list"), listed);
  for (const td of $("matrix").querySelectorAll("td.on")) td.classList.remove("on");
  $("matrix").querySelector(`td[data-cell="${CSS.escape(state.cell)}"]`)?.classList.add("on");
}
function showComp(k) {
  const texts = byCth.get(+k);
  if (!texts) return;
  state.comp = String(k); state.cell = ""; save();
  const f = tFilter();
  listed = f ? texts.filter(c => f[2](c.verdict)) : texts;
  const g = G.genreOf(+k), s = G.subOf(g, +k);
  $("listCard").hidden = false;
  $("listTitle").innerHTML = `${esc(titles[k] ?? "untitled")} <span class="tag cth">CTH ${esc(k)}</span>` +
    `<span class="small muted" style="display:block;font-weight:400">${esc(g.n)}. ${esc(g.name)}${s ? ` › ${esc(s.n)}. ${esc(s.name)}` : ""} · ${listed.length.toLocaleString()} manuscripts${f ? ` placed in ${esc(label(state.t))}` : ""} · ` +
    `<a href="${P.tlhdigCth(k)}" target="_blank" rel="noopener">in TLH<sup>dig</sup></a> · <a href="${P.konkordanzCth(k)}" target="_blank" rel="noopener">in the Konkordanz</a></span>`;
  fill($("list"), listed);
  for (const tr of $("genres").querySelectorAll("tr.on")) tr.classList.remove("on");
  $("genres").querySelector(`tr[data-comp="${CSS.escape(String(k))}"]`)?.classList.add("on");
  for (const td of $("matrix").querySelectorAll("td.on")) td.classList.remove("on");
}
$("listClose").onclick = () => { $("listCard").hidden = true; state.cell = ""; state.comp = ""; save(); for (const tr of $("genres").querySelectorAll("tr.on")) tr.classList.remove("on"); for (const td of $("matrix").querySelectorAll("td.on")) td.classList.remove("on"); };

// ---------- search: a CTH number, a title, or a siglum ----------
let found = [];
function find(q) {
  state.q = q.trim(); save();
  const s = state.q.toLowerCase();
  if (!s) { $("count").textContent = ""; $("found").innerHTML = ""; found = []; return; }
  const cth = s.match(/^(?:cth\s*)?(\d+(?:\.\w+)?)$/);
  let head;
  if (cth) {
    found = corpus.filter(c => c.cth === cth[1] || c.cth.startsWith(cth[1] + "."));
    head = `CTH ${esc(cth[1])}${titles[cth[1]] ? ": " + esc(titles[cth[1]]) : ""}. ${found.length.toLocaleString()} manuscripts` +
      (found.length ? ` · <a href="${P.tlhdigCth(cth[1])}" target="_blank" rel="noopener">in TLH<sup>dig</sup></a> · <a href="${P.konkordanzCth(cth[1])}" target="_blank" rel="noopener">in the Konkordanz</a>` : "");
  } else {
    const byTitle = s.length > 2 ? new Set(Object.entries(titles).filter(([, t]) => t.toLowerCase().includes(s)).map(([k]) => k)) : new Set();
    found = corpus.filter(c => c.id.toLowerCase().includes(s) || byTitle.has(c.cth));
    head = `${found.length.toLocaleString()} manuscripts match “${esc(state.q)}”` + (byTitle.size ? ` (titles: ${[...byTitle].slice(0, 6).map(k => "CTH " + esc(k)).join(", ")}${byTitle.size > 6 ? " …" : ""})` : "");
  }
  $("count").innerHTML = head;
  fill($("found"), found);
}
$("findForm").onsubmit = e => { e.preventDefault(); find($("q").value); };

// ---------- export ----------
const rowsOut = texts => texts.map(c => ({ txtid: c.id, cth: c.cth, words: c.n, kind: KINDS[c.kind], placement: c.verdict,
  reference_tradition: c.label ?? "", lead: c.gap ?? "", lead_mostly_common_words: c.common > 0.5,
  tlhdig: P.tlhdigText(c.id, c.cth), konkordanz: P.konkordanzText(c.id) }));
const matrixOut = () => ROWS.map(([name, desc, f]) => {
  const texts = corpus.filter(f);
  return { bin: name, description: desc, manuscripts: texts.length, ...Object.fromEntries(COLS.map(([k, , g]) => [k, texts.filter(c => g(c.verdict)).length])) };
});
const genresOut = () => G.GENRES.flatMap(g => (g.subs.length ? g.subs : [{ n: "", name: "", from: g.from, to: g.to }]).flatMap(s => inRange(s).map(k => {
  const texts = byCth.get(k);
  return { genre: `${g.n}. ${g.name}`, subgenre: s.name ? `${s.n}. ${s.name}` : "", cth: k, composition: titles[k] ?? "", manuscripts: texts.length,
    ...Object.fromEntries(COLS.map(([c, , f]) => [c, texts.filter(x => f(x.verdict)).length])) };
})));
X.menu($("gexport"), [
  ["Compositions by genre and tradition (CSV)", () => X.downloadCSV(genresOut(), "compositions_by_genre")],
  ["Manuscripts of the open composition (CSV)", () => state.comp && X.downloadCSV(rowsOut(listed), "CTH_" + state.comp)],
  ["Everything (JSON)", () => X.downloadJSON({ settings: set, genres_source: G.SOURCE, filter: state.t, compositions: genresOut() }, "genres")],
]);
X.cite($("gexport"), () => ({
  title: state.comp ? `CTH ${state.comp}, ${titles[state.comp] ?? ""}: where its manuscripts are placed` : `Compositions by genre and where their manuscripts are placed${state.t ? ", " + state.t : ""}`,
  result: state.comp ? `${listed.length} manuscripts` : `${G.GENRES.length} genres (after the CTH catalogue)`,
  path: "browse.html" + (state.comp || state.t ? "#" + new URLSearchParams(Object.entries({ comp: state.comp, t: state.t }).filter(([, v]) => v)) : ""),
}));
X.menu($("export"), [
  ["The table (CSV)", () => X.downloadCSV(matrixOut(), "bins_by_tradition")],
  ["Manuscripts of the open cell (CSV)", () => listed.length && X.downloadCSV(rowsOut(listed), state.cell.replace("|", "_to_"))],
  ["Manuscripts found by the search (CSV)", () => found.length && X.downloadCSV(rowsOut(found), "search_" + state.q)],
  ["Everything shown (JSON)", () => X.downloadJSON({ settings: set, table: matrixOut(), cell: state.cell, cell_manuscripts: rowsOut(listed), search: state.q, found: rowsOut(found) }, "browse")],
]);
X.cite($("export"), () => ({
  title: state.cell ? `${state.cell.replace("|", " placed in ")}: manuscripts` : "Laroche's residual bins by reference tradition",
  result: state.cell ? `${listed.length} manuscripts` : `CTH 470: ${matrixOut()[0].manuscripts} manuscripts`,
  path: "browse.html" + (state.cell ? "#" + new URLSearchParams({ cell: state.cell }) : ""),
}));

filterBar();
genres();
matrix();
if (state.comp) showComp(state.comp);
if (state.cell) showCell(...state.cell.split("|"));
if (state.q) { $("q").value = state.q; find(state.q); }

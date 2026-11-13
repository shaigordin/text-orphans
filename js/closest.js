// Closest texts and joins: traditions, compositions and manuscripts for one text, with the
// duplicate/join checks of orphans/run_join_candidates.py and both texts side by side.
import * as A from "./analyse.js";
import * as D from "./draw.js";
import * as P from "./portal.js";
import * as T from "./settings.js";
import * as X from "./export.js";

const $ = id => document.getElementById(id);
const S = await A.setup();
const fmt = x => x.toFixed(3);
let res = null, query = null;
let set = T.bar($("settings"), ["reading", "top", "features", "writing", "common"], s => { set = s; if (query) run(); });

async function run() {
  $("msg").textContent = "Reading the corpus (about 5 MB, once per visit)…";
  await new Promise(r => setTimeout(r, 20));
  res = await A.analyse(query, set, { joins: set.top });
  $("msg").textContent = "";
  draw();
}

function draw() {
  const { r, q } = res, m = S.model;
  $("out").hidden = false;
  const [head, why] = A.verdict(r, m, { hideCommon: set.common === "hide" });
  const c = q.id && S.byId.get(q.id);
  $("verdict").innerHTML = (q.id ? `${q.id}: ` : "") + head;
  $("why").innerHTML = why + (c ? ` Filed under CTH ${c.cth}${S.titles[c.cth] ? " (" + S.titles[c.cth] + ")" : ""}, ${c.n} words. ${P.portalLinks(q.id, c.cth)} · <a href="place.html#id=${encodeURIComponent(q.id)}">why this tradition</a>` : "");
  if (!r.vec.size) { $("msCard").hidden = $("winCard").hidden = true; return; }
  const mx = res.traditions[0].sim || 1;
  $("trad").innerHTML = res.traditions.slice(0, Math.min(set.top, 10)).map(t => `<span><span class="swatch" style="background:${D.colorVar(t.tradition)}"></span>${D.SHORT[t.tradition]}</span>
    <span class="track"><span class="fill" style="width:${(100 * Math.max(t.sim, 0)) / mx}%;background:${D.colorVar(t.tradition)}"></span></span><span class="val">${fmt(t.sim)}</span>`).join("");
  $("comp").innerHTML = res.compositions.map(c => `<li><a href="browse.html#open=${c.cth}">CTH ${c.cth}</a> <span class="muted small">${c.title}</span>
    <span class="val">${fmt(c.sim)}</span> <span class="muted small">${c.texts} ms.</span></li>`).join("");
  $("msCard").hidden = false;
  $("ms").tBodies[0].innerHTML = res.manuscripts.slice(0, set.top).map((x, k) => {
    const j = x.join, ck = (ok, t) => `<span class="ck ${ok ? "ok" : ""}" title="${t}">${ok ? "✓" : "·"}</span>`;
    return `<tr data-k="${k}"><td class="num">${x.rank}</td><td>${x.doc.id}<br><span class="small">${P.portalLinks(x.doc.id, x.doc.cth)}</span></td>
      <td><a href="browse.html#open=${x.doc.cth}">${x.doc.cth}</a></td><td class="num">${x.doc.n}</td><td class="small">${x.verdict}</td><td class="num">${fmt(x.sim)}</td>
      <td><span class="barcode-line">${[...j.cells].map((ch, i) => `<span class="bc ${ch === "." ? "o" : ch}" title="${res.frag.cols[i][1]}"></span>`).join("")}</span></td>
      <td>${ck(j.checks.half, "at least half of the words")}${ck(j.checks.spelling, "all shared words spelled the same")}${ck(j.checks.phrase, "a shared two-word phrase" + (j.phrases.length ? ": " + j.phrases.map(p => p.join(" ")).join("; ") : ""))}
        ${j.flagged ? '<span class="badge">passes</span>' : ""}</td></tr>`;
  }).join("");
  for (const tr of $("ms").tBodies[0].rows) tr.onclick = e => { if (e.target.tagName !== "A") win(+tr.dataset.k); };
  win(0);
  const name = q.id ?? "pasted_text";
  X.menu($("export"), [
    ["Closest manuscripts (CSV)", () => X.downloadCSV(A.exportRows(res, set).manuscripts, `${name}_closest_manuscripts`)],
    ["Closest compositions (CSV)", () => X.downloadCSV(A.exportRows(res, set).compositions, `${name}_closest_compositions`)],
    ["Traditions (CSV)", () => X.downloadCSV(A.exportRows(res, set).traditions, `${name}_traditions`)],
    ["Everything (JSON)", () => X.downloadJSON({ query: q, settings: set, ...A.exportRows(res, set) }, `${name}_closest`)],
  ]);
}

async function win(k) {
  const x = res.manuscripts[k];
  if (!x) return;
  $("winCard").hidden = false;
  const [ea, eb] = await Promise.all([A.edition(res.q.id), A.edition(x.doc.id)]);
  if (res.manuscripts[k] !== x) return;
  const legend = ea || eb ? `<span class="small muted edlegend"><span class="translit">[ ]</span> restored by the editor (grey), <span class="translit">⸢ ⸣</span> damaged, <span class="translit">?</span> uncertain, <span class="translit">!</span> emended · <span class="uncounted">pale: not counted (mostly restored, or without a word form in TLHdig)</span> · <i>italic</i>: Hittite and Akkadian, upright: Sumerograms</span>` : "";
  const [a, b] = A.sharedHTML({ words: res.words, translits: res.translits, ed: ea }, { words: x.doc.words, translits: x.doc.translits, ed: eb });
  $("winTitle").innerHTML = `${res.q.id ?? "Your text"} and ${x.doc.id} <span class="muted">(rank ${x.rank})</span>${legend}`;
  $("win").innerHTML = `<div><h4>${res.q.id ?? "Your text"}</h4><p class="translit">${a}</p></div><div><h4>${x.doc.id} <span class="muted small">CTH ${x.doc.cth}</span></h4><p class="translit">${b}</p></div>`;
  for (const tr of $("ms").tBodies[0].rows) tr.classList.toggle("sel", +tr.dataset.k === k);
}

function submit(input) {
  const q = A.resolve(input);
  if (!q) return;
  if (q.cth) { location.href = `browse.html#open=${q.cth}`; return; }
  query = q;
  history.replaceState(null, "", "#" + (q.id ? "id=" : "text=") + encodeURIComponent(q.id ?? q.text));
  run();
}
$("form").onsubmit = e => { e.preventDefault(); submit($("inp").value); };
$("inp").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit($("inp").value); } });
const h = new URLSearchParams(location.hash.slice(1));
const start = h.get("id") ?? h.get("text") ?? "KBo 44.52";
$("inp").value = start;
submit(start);

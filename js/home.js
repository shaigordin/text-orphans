// The quick check of the opening page: one box, the main results at once, links to the full tools.
import * as A from "./analyse.js";
import * as D from "./draw.js";
import * as P from "./portal.js";
import * as T from "./settings.js";

const $ = id => document.getElementById(id);
const S = await A.setup();
const fmt = x => x.toFixed(3);
let res = null;

async function check(input) {
  const q = A.resolve(input);
  $("qMsg").textContent = "";
  if (!q) return;
  if (q.cth) { location.href = `browse.html#open=${q.cth}`; return; }
  if (q.text && q.text.split(/\s+/).length < 3 && /^[A-Za-z]+\s*\d/.test(q.text)) {
    $("qMsg").textContent = `"${q.text}" is not a text of TLHdig Beta 0.3. Try a siglum like KBo 41.22, or paste a transliteration.`;
    return;
  }
  $("qMsg").textContent = "Reading the corpus (about 5 MB, once per visit)…";
  await new Promise(r => setTimeout(r, 20));
  const set = { ...T.load(), top: 5 };
  res = await A.analyse(q, set, { joins: 20 });
  $("qMsg").textContent = "";
  history.replaceState(null, "", "#q=" + encodeURIComponent(q.id ?? q.text));
  draw(set);
}

function draw(set) {
  const { r, q } = res, m = S.model;
  $("qOut").hidden = false;
  const [head, why, placed] = A.verdict(r, m, { hideCommon: set.common === "hide" });
  const c = q.id && S.byId.get(q.id);
  $("qVerdict").innerHTML = (q.id ? `${q.id}: ` : "") + head;
  $("qWhy").innerHTML = why + (c ? ` Filed under CTH ${c.cth}${S.titles[c.cth] ? " (" + S.titles[c.cth] + ")" : ""}, ${c.n} words. ${P.portalLinks(q.id, c.cth)}` :
    ` ${r.all.words.length} words read.`) + (T.calibrated(set) ? "" : ` <span class="muted">Settings: ${A.describe(r.filter)}.</span>`);
  $("qRose").innerHTML = r.vec.size ? D.roseSVG(r.s, m.traditions, { size: 110, assigned: placed }) : "";
  if (!r.vec.size) { for (const id of ["qTrad", "qComp", "qMs", "qWin"]) $(id).replaceChildren(); return; }
  const mx = res.traditions[0].sim || 1;
  $("qTrad").innerHTML = res.traditions.slice(0, 5).map(t => `<span><span class="swatch" style="background:${D.colorVar(t.tradition)}"></span>${D.SHORT[t.tradition]}</span>
    <span class="track"><span class="fill" style="width:${(100 * Math.max(t.sim, 0)) / mx}%;background:${D.colorVar(t.tradition)}"></span></span><span class="val">${fmt(t.sim)}</span>`).join("");
  $("qComp").innerHTML = res.compositions.map(c => `<li><a href="browse.html#open=${c.cth}">CTH ${c.cth}</a> <span class="muted small">${c.title}</span> <span class="val">${fmt(c.sim)}</span></li>`).join("");
  $("qMs").innerHTML = res.manuscripts.slice(0, 5).map((x, k) => `<li><button class="link" data-k="${k}">${x.doc.id}</button>
    <span class="muted small">CTH ${x.doc.cth}</span>${x.join.flagged ? ` <span class="badge" title="Shares at least half the words, all spelled the same, and a two-word phrase: a candidate duplicate or join">duplicate/join check ✓</span>` : ""} <span class="val">${fmt(x.sim)}</span></li>`).join("");
  for (const b of $("qMs").querySelectorAll("button")) b.onclick = () => win(+b.dataset.k);
  win(0);
  const flagged = res.manuscripts.filter(x => x.join.flagged);
  const enc = encodeURIComponent(q.id ?? "");
  $("qMore").innerHTML = (flagged.length ? `<b>${flagged.length}</b> of the 20 closest manuscripts pass all three duplicate/join checks (${flagged.slice(0, 4).map(x => x.doc.id).join(", ")}${flagged.length > 4 ? " …" : ""}). ` : "None of the 20 closest manuscripts passes all three duplicate/join checks. ") +
    (q.id ? `<a href="closest.html#id=${enc}">All closest texts and joins →</a> · <a href="place.html#id=${enc}">Why this tradition →</a>`
      : `<a href="closest.html">Open the full tools</a> and paste the text there.`);
}

function win(k) {
  const x = res.manuscripts[k];
  if (!x) return;
  const [a, b] = A.sharedHTML({ words: res.words, translits: res.translits }, { words: x.doc.words, translits: x.doc.translits });
  $("qWinTitle").innerHTML = `${res.q.id ?? "Your text"} and ${x.doc.id} (rank ${x.rank}, similarity ${fmt(x.sim)})`;
  $("qWin").innerHTML = `<div><h4>${res.q.id ?? "Your text"}</h4><p class="translit">${a}</p></div>
    <div><h4>${x.doc.id} <span class="muted small">CTH ${x.doc.cth} · ${P.portalLinks(x.doc.id, x.doc.cth)}</span></h4><p class="translit">${b}</p></div>`;
  for (const btn of $("qMs").querySelectorAll("button")) btn.classList.toggle("sel", +btn.dataset.k === k);
}

$("qForm").onsubmit = e => { e.preventDefault(); check($("qIn").value); };
$("qIn").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); check($("qIn").value); } });
for (const a of document.querySelectorAll("[data-try]")) a.onclick = e => { e.preventDefault(); $("qIn").value = a.dataset.try; check(a.dataset.try); };
const asked = new URLSearchParams(location.hash.slice(1)).get("q");
if (asked) { $("qIn").value = asked; check(asked); }

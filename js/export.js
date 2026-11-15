// Export buttons: tables as CSV or JSON, figures (SVG elements) as SVG or PNG.
// Every file says where its numbers come from (TLHdig Beta 0.3, this site's version).
import * as V from "./data.js";
import { VERSION, DATA } from "./site.js";
const SOURCE = "Adoptio: a quantitative tool for placing Hittite fragments (github.com/shaigordin/text-orphans); data TLHdig Beta 0.3, doi:10.5281/zenodo.20328284";

function save(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
const slug = s => String(s).replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_|_$/g, "") + `_version${V.KEY}`;

export function csv(rows) {
  if (!rows.length) return "";
  const cols = [...new Set(rows.flatMap(Object.keys))];
  const cell = v => v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
  return [cols.join(","), ...rows.map(r => cols.map(c => cell(r[c])).join(","))].join("\n") + "\n";
}
export function downloadCSV(rows, name) { save(new Blob(["﻿" + csv(rows)], { type: "text/csv;charset=utf-8" }), slug(name) + ".csv"); }
export function downloadJSON(obj, name) {
  save(new Blob([JSON.stringify({ source: SOURCE, data_version: V.LABEL, exported: new Date().toISOString(), ...obj }, null, 1)], { type: "application/json" }), slug(name) + ".json");
}

// Inline the page's colours (CSS variables) so the file looks the same outside the page.
function standalone(svg) {
  const clone = svg.cloneNode(true), cs = getComputedStyle(document.documentElement);
  const vb = svg.viewBox.baseVal, box = svg.getBoundingClientRect();
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", Math.round(box.width));
  clone.setAttribute("height", Math.round(box.height));
  let s = new XMLSerializer().serializeToString(clone).replace(/var\((--[\w-]+)\)/g, (_, v) => cs.getPropertyValue(v).trim() || "#888");
  const bg = cs.getPropertyValue("--surface-1").trim(), fg = cs.getPropertyValue("--text-secondary").trim();
  s = s.replace(/^<svg([^>]*)>/, `<svg$1><style>text{font:12px system-ui,sans-serif;fill:${fg}}</style>` +
    `<rect x="${vb?.x ?? 0}" y="${vb?.y ?? 0}" width="${vb?.width || box.width}" height="${vb?.height || box.height}" fill="${bg}"/>`);
  return { s, w: box.width, h: box.height };
}
export function downloadSVG(svg, name) { save(new Blob([standalone(svg).s], { type: "image/svg+xml" }), slug(name) + ".svg"); }
export function downloadPNG(svg, name, scale = 2) {
  const { s, w, h } = standalone(svg);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = w * scale; c.height = h * scale;
    const g = c.getContext("2d");
    g.scale(scale, scale);
    g.drawImage(img, 0, 0, w, h);
    c.toBlob(b => save(b, slug(name) + ".png"));
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
}

// A small "Export" menu: items = [[label, fn], ...]
export function menu(el, items) {
  el.classList.add("export");
  el.innerHTML = `<details><summary>Export</summary><div>${items.map(([l], i) => `<button type="button" data-i="${i}">${l}</button>`).join("")}</div></details>`;
  for (const b of el.querySelectorAll("button")) b.onclick = () => { items[+b.dataset.i][1](); b.closest("details").open = false; };
}

// "Cite" button: a citation of one result, in plain text and BibTeX, with a link that reopens
// the same result with the same data version (?data=…). `get()` returns { title, result, path },
// or null while nothing is shown. path: the page and its #fragment, e.g. "place.html#id=KBo%2044.52".
const SITE = "https://shaigordin.github.io/text-orphans/";
export function citation({ title, result, path }) {
  const today = new Date(), iso = today.toISOString().slice(0, 10);
  const day = today.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const link = path ? SITE + path.replace(/^([^#?]*)/, `$1?data=${V.KEY}`) : SITE;
  const tool = `Adoptio: A Quantitative Tool for Placing Hittite Fragments, version ${VERSION}, data version ${V.KEY} (${DATA.name}, doi:${DATA.doi})`;
  const plain = `Gordin, Shai. 2026. “${title}.” In ${tool}. ${result ? result.replace(/\.?$/, ".") + " " : ""}${link}. Accessed ${day}.`;
  const key = ("gordin2026" + title).replace(/[^A-Za-z0-9]+/g, "").slice(0, 40);
  const bib = `@misc{${key},
  author = {Gordin, Shai},
  title = {{${title}}},
  howpublished = {${tool}},
  year = {2026},
  url = {${link}},
  note = {${result ? result.replace(/\.$/, "") + ". " : ""}Accessed ${iso}}
}`;
  return { plain, bib, link };
}
export function cite(el, get) {
  const box = document.createElement("div");
  box.className = "export cite";
  box.innerHTML = `<details><summary>Cite</summary><div class="citebox"></div></details>`;
  el.classList.contains("export") ? el.after(box) : el.append(box);
  const d = box.querySelector("details"), out = box.querySelector(".citebox");
  d.addEventListener("toggle", () => {
    if (!d.open) return;
    const r = get();
    if (!r) { out.innerHTML = `<p class="small muted">Load a text first.</p>`; return; }
    const c = citation(r), e = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    out.innerHTML = `<p class="small muted">Cite this result. The link reopens it with the same data version; the tool version is named so the result can be checked against that release.</p>
      <p class="citetext" data-k="plain">${e(c.plain)}</p><button type="button" data-k="plain">Copy citation</button>
      <pre class="citetext" data-k="bib">${e(c.bib)}</pre><button type="button" data-k="bib">Copy BibTeX</button>`;
    for (const b of out.querySelectorAll("button")) b.onclick = async () => {
      try { await navigator.clipboard.writeText(c[b.dataset.k]); b.textContent = "Copied"; } catch { b.textContent = "Select the text and copy it"; }
    };
  });
}

// Export buttons: tables as CSV or JSON, figures (SVG elements) as SVG or PNG.
// Every file says where its numbers come from (TLHdig Beta 0.3, this site's version).
import * as V from "./data.js";
const SOURCE = "Orphans and Archetypes tool (github.com/shaigordin/text-orphans); data TLHdig Beta 0.3, doi:10.5281/zenodo.20328284";

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

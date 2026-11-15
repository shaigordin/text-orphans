// The opening page's carousel: the method in one picture, then one slide per step, all on the
// orphan KBo 44.52 (CTH 470), counting only what is visible on the tablet (data version C).
// Every number is computed here by the site's own code (js/analyse.js, js/model.js), so the
// slides always match what "Place a fragment" shows; colours come from css/style.css.
//
// The photographs are not part of this repository (Hethitologie-Archiv Mainz, fotarch). Fetch
// them with orphans/fotarch/fetch_photos.js of measuring-scribal-literacy:
//   node fetch_photos.js <dir> "KBo 44.52" "KBo 59.165"
// then, from this repository:
//   PHOTOS=<dir> node build/make_steps.mjs     -> img/carousel/step_*.jpg and img/carousel/slides.json
import fs from "fs";
import http from "http";
import path from "path";
import { createRequire } from "module";
const { chromium } = createRequire(import.meta.url)("playwright");

const root = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const PHOTOS = process.env.PHOTOS ?? path.join(root, "..", "photos");
const ID = "KBo 44.52";
// file, fotarch number, excavation number, size in px, crop [x0, y0, x1, y1] (fractions; drops the archive's label strip)
const PHOTO = {
  "KBo 44.52": ["KBo_44_52_N06460.jpg", "N06460", "181/n", [1907, 1838], [0.02, 0.03, 1, 1]],
  "KBo 59.165": ["KBo_59_165_B1358b.jpg", "B1358b", "909/z", [5151, 5646], [0.04, 0.27, 1, 0.97]],
};
const photo = id => `data:image/jpeg;base64,${fs.readFileSync(path.join(PHOTOS, PHOTO[id][0])).toString("base64")}`;
const font = f => `url(data:font/woff2;base64,${fs.readFileSync(path.join(root, "fonts", f)).toString("base64")})`;
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

// a static server for the site, so the page can import the site's modules
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2" };
const server = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { "content-type": TYPES[path.extname(f)] ?? "application/octet-stream" });
  fs.createReadStream(f).pipe(r);
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto(`${base}/about.html`);
// everything the slides need, from the site's own code
const D = await p.evaluate(async id => {
  const A = await import("/js/analyse.js"), Q = await import("/js/model.js"), T = await import("/js/translit.js"), Dr = await import("/js/draw.js");
  const st = await A.setup(), m = st.model;
  const res = await A.analyse({ id }, { top: 10, features: "both", writing: "all" });
  const r = res.r, at = Q.attribute(r, Q.decisionWeights(r, m), m);
  const css = getComputedStyle(document.documentElement), v = k => css.getPropertyValue(k).trim();
  const colour = t => v(`--series-${Dr.RING.indexOf(t) + 1}`);
  const ed = await A.edition(id);
  // decisive words: share of the margin per word form, summed over its occurrences
  const share = new Map();
  for (const w of at.perWord) {
    const k = w.word.word ?? w.word.translit;
    const o = share.get(k) ?? { t: w.word.translit, v: 0, cls: w.cls };
    o.v += w.total; share.set(k, o);
  }
  const idf = f => { const j = m.index.get(f); return j === undefined ? null : m.idf[j]; };
  return {
    accent: v("--accent"), bg0: v("--surface-0"), bg1: v("--surface-1"), text: v("--text-primary"), muted: v("--text-secondary"),
    words: ed.map(([t, s, c, l, f]) => ({ html: T.word(t, s, l, f ?? ""), counted: !!c })),
    nCounted: ed.filter(e => e[2]).length, nEdition: ed.length,
    trad: res.traditions.map(t => ({ t: t.tradition, short: Dr.SHORT?.[t.tradition] ?? t.tradition, s: t.sim, c: colour(t.tradition) })),
    top: r.top, ru: r.runnerUp, gap: r.gap, margin: m.margin, topColour: colour(r.top), ruColour: colour(r.runnerUp),
    decisive: [...share.values()].sort((a, b) => b.v - a.v).slice(0, 7).map(o => ({ html: T.word(o.t), v: o.v, cls: o.cls })),
    weights: [["{LÚ}SIMUG", "SIMUG", "smith"], ["{LÚ}AZU", "AZU", "AZU priest"], ["zi-ik-ke-ez-zi", "zikkezi", "keeps putting"],
              ["EN", "EN", "lord, patron"], ["{GIŠ}BANŠUR", "BANŠUR", "table"], ["nu", "§nu", "the sign nu"]]
      .map(([t, f, gl]) => ({ html: T.word(t), idf: idf(f) ?? idf("§" + f), gloss: gl })).sort((a, b) => b.idf - a.idf),
    ms: res.manuscripts.slice(0, 1).map(x => ({ id: x.doc.id, cth: x.doc.cth, sim: x.sim, shared: x.join.shared, phrases: x.join.phrases.length })),
    comp: res.compositions[0],
  };
}, ID);

const CSS = `
@font-face { font-family: CG; font-weight: 600; src: ${font("cg-600-latin.woff2")}; }
@font-face { font-family: CG; font-weight: 600; src: ${font("cg-600-latinext.woff2")}; unicode-range: U+0100-02BA, U+1E00-1EFF, U+2000-206F; }
* { box-sizing: border-box; margin: 0; }
body { width: 1600px; height: 900px; overflow: hidden; background: ${D.bg0}; font-family: Inter, "Liberation Sans", sans-serif; color: ${D.text}; position: relative; }
h1 { font-family: CG, serif; font-size: 72px; font-weight: 600; line-height: 1; }
.step { font: 600 24px Inter, sans-serif; letter-spacing: .12em; text-transform: uppercase; color: ${D.accent}; margin-bottom: 10px; }
.lede { font-size: 30px; line-height: 1.3; color: ${D.muted}; margin-top: 16px; max-width: 30ch; }
.ph { border-radius: 14px; overflow: hidden; box-shadow: 0 14px 40px rgb(0 0 0 / .22); background: #ddd; }
.ph img { display: block; width: 100%; height: 100%; object-fit: cover; }
.cap { font-size: 25px; color: ${D.muted}; margin-top: 10px; }
.foot { position: absolute; left: 70px; right: 70px; bottom: 24px; font-size: 19px; color: ${D.muted}; }
.tl { font-family: "DejaVu Serif", "FreeSerif", serif; }
.L-H { font-style: italic; } .L-A { font-style: italic; font-size: 1.1em; } .L-S, .L-d, .L-x, .br { font-style: normal; }
.gap { color: #a59a8e; } .br { color: #8b7d70; } sup.br { font-size: .6em; }
.left { position: absolute; left: 70px; top: 70px; width: 600px; }
.right { position: absolute; left: 730px; top: 70px; right: 70px; bottom: 80px; }
`;
const credit = (...ids) => `Photograph${ids.length > 1 ? "s" : ""}: Hethitologie-Archiv Mainz, hethiter.net/: ${ids.map(i => `fotarch ${PHOTO[i][1]} (${i})`).join(", ")}. Text: TLHdig Beta 0.3.`;
// a photograph cropped to PHOTO's box, `w` px wide (height follows the crop)
function pic(id, w) {
  const [, , , [W, H], [x0, y0, x1, y1]] = PHOTO[id], fw = x1 - x0, fh = y1 - y0, h = Math.round((w * fh * H) / (fw * W));
  const pos = (a, f) => (f >= 1 ? 0 : (100 * a) / (1 - f));
  return `<div class="ph" style="width:${w}px;height:${h}px;background:url(${photo(id)}) ${pos(x0, fw)}% ${pos(y0, fh)}% / ${100 / fw}% ${100 / fh}% no-repeat"></div>`;
}
const frag = w => pic(ID, w);
const fmt = x => x.toFixed(3);

const slides = [];
const add = (name, title, alt, caption, body, link) => slides.push({ name, title, alt, caption, body, link });

// 0. the whole method in one picture
{
  const steps = [["Read", "what is visible on the tablet"], ["Count", "rare words weigh more"], ["Compare", "with ten traditions"], ["Decide", "only with a clear lead"], ["Explain", "the words it rests on"]];
  add("step_0_pipeline.jpg", "From fragment to tradition", "KBo 44.52 and the five steps of the method, ending in its placement with the Syro-Mesopotamian (Hurrian) rituals",
    `The method in five steps, on the orphan ${ID} (CTH 470).`, `
  <div style="position:absolute;left:70px;top:64px"><h1>From fragment to tradition</h1></div>
  <div style="position:absolute;left:70px;top:190px">${frag(470)}<p class="cap">${ID}, filed under CTH 470</p></div>
  <div style="position:absolute;left:560px;top:250px;right:60px;display:flex;align-items:flex-start;gap:12px">
    ${steps.map(([s, x], i) => `<div style="flex:1;text-align:center">
      <div style="width:108px;height:108px;margin:0 auto;border-radius:50%;background:${D.accent};color:#fff;font:600 54px CG,serif;display:grid;place-items:center">${i + 1}</div>
      <p style="font:600 40px CG,serif;margin-top:16px">${s}</p><p style="font-size:28px;color:${D.muted};margin-top:6px;line-height:1.2">${x}</p></div>
      ${i < steps.length - 1 ? `<div style="font-size:60px;color:${D.accent};margin-top:18px">›</div>` : ""}`).join("")}
  </div>
  <div style="position:absolute;left:560px;right:60px;top:590px;text-align:center">
    <div style="display:inline-block;padding:20px 36px;border-radius:16px;background:${D.topColour};color:#fff">
      <p style="font-size:22px;opacity:.9">placed in</p><p style="font:600 46px CG,serif">${esc(D.top)}</p></div>
  </div>
  <p class="foot">${credit(ID)}</p>`, "place.html#id=KBo%2044.52");
}
// 1. Read
add("step_1_read.jpg", "1 · Read", `${ID}: the photograph and its transliteration; restored signs grey`,
  `Only what is visible on the tablet counts: ${D.nCounted} of the ${D.nEdition} words of the edition. A word counts if at least half its signs are preserved, or if it is preserved elsewhere on the same tablet.`, `
  <div class="left"><p class="step">Step 1</p><h1>Read</h1><p class="lede">Count only what is visible on the tablet.</p>
    <div style="margin-top:34px">${frag(500)}</div></div>
  <div class="right" style="top:110px">
    <p class="tl" style="font-size:31px;line-height:1.72">${D.words.map(w => `<span style="${w.counted ? "" : "opacity:.35"}">${w.html}</span>`).join(" ")}</p>
    <p class="cap" style="margin-top:22px;font-size:22px"><b style="color:${D.text}">${D.nCounted} words count.</b> Restored signs in [ ] are grey; pale words are mostly restored and do not count.</p>
  </div>
  <p class="foot">${credit(ID)}</p>`, "closest.html#id=KBo%2044.52");
// 2. Count
{
  const max = Math.max(...D.weights.map(w => w.idf));
  add("step_2_count.jpg", "2 · Count", "Weights of words in KBo 44.52: rare words such as LÚSIMUG weigh much, the common sign nu little",
    "Every word form and every sign sequence inside a word gets a weight: high if it is rare in the other manuscripts, low if every text has it.", `
  <div class="left"><p class="step">Step 2</p><h1>Count</h1><p class="lede">A word weighs more the rarer it is in the other manuscripts.</p>
    <div style="margin-top:34px">${frag(380)}</div></div>
  <div class="right" style="top:130px">
    ${D.weights.map(w => `<div style="display:grid;grid-template-columns:330px 1fr 80px;align-items:center;gap:18px;margin-bottom:30px">
      <div><span class="tl" style="font-size:38px">${w.html}</span><br><span style="font-size:24px;color:${D.muted}">${esc(w.gloss)}</span></div>
      <div style="height:34px;border-radius:0 8px 8px 0;background:${D.accent};opacity:${0.35 + 0.65 * w.idf / max};width:${(100 * w.idf) / max}%"></div>
      <div style="font-size:28px;font-variant-numeric:tabular-nums">${w.idf.toFixed(1)}</div></div>`).join("")}
    <p class="cap" style="font-size:22px">weight of the word (inverse document frequency)</p>
  </div>
  <p class="foot">${credit(ID)}</p>`, "place.html#id=KBo%2044.52");
}
// 3. Compare
{
  const max = D.trad[0].s;
  add("step_3_compare.jpg", "3 · Compare", "Similarity of KBo 44.52 to the ten traditions; Syro-Mesopotamian (Hurrian) is nearest",
    "Each tradition is the average profile of its manuscripts. The fragment is compared with each of the ten: 1 means identical, 0 nothing shared.", `
  <div class="left"><p class="step">Step 3</p><h1>Compare</h1><p class="lede">Measure the fragment against the ten traditions defined in the literature.</p>
    <div style="margin-top:34px">${frag(380)}</div></div>
  <div class="right" style="top:90px">
    ${D.trad.map(t => `<div style="display:grid;grid-template-columns:330px 1fr 80px;align-items:center;gap:16px;margin-bottom:12px">
      <div style="font-size:26px;line-height:1.1">${esc(t.t)}</div>
      <div style="height:30px;border-radius:0 8px 8px 0;background:${t.c};width:${(100 * t.s) / max}%"></div>
      <div style="font-size:24px;font-variant-numeric:tabular-nums">${fmt(t.s)}</div></div>`).join("")}
    <p class="cap" style="font-size:22px">similarity, 0 to 1</p>
  </div>
  <p class="foot">${credit(ID)}</p>`, "place.html#id=KBo%2044.52");
}
// 4. Decide
{
  const W = 760, sc = W / D.trad[0].s;
  add("step_4_decide.jpg", "4 · Decide", `The lead of Syro-Mesopotamian (Hurrian) over the Kizzuwatna rituals, ${fmt(D.gap)}, against the ${D.margin} needed`,
    `A fragment is placed only when the nearest tradition leads the runner-up by at least ${D.margin}, the margin at which 8 of 10 test fragments of known tradition land correctly. Below it the answer is "undecided".`, `
  <div class="left"><p class="step">Step 4</p><h1>Decide</h1><p class="lede">Place the fragment only when the nearest tradition leads clearly. Otherwise: undecided.</p></div>
  <div class="right" style="left:110px;top:400px">
    <div style="display:grid;grid-template-columns:420px ${W}px 1fr;align-items:center;row-gap:26px;column-gap:20px">
      <div style="font-size:28px">${esc(D.top)}</div><div style="height:56px;border-radius:0 10px 10px 0;background:${D.topColour};width:${D.trad[0].s * sc}px"></div><div style="font-size:30px">${fmt(D.trad[0].s)}</div>
      <div style="font-size:28px">${esc(D.ru)}</div><div style="height:56px;border-radius:0 10px 10px 0;background:${D.ruColour};width:${D.trad[1].s * sc}px"></div><div style="font-size:30px">${fmt(D.trad[1].s)}</div>
      <div></div>
      <div style="position:relative;height:120px">
        <div style="position:absolute;left:${D.trad[1].s * sc}px;width:${D.gap * sc}px;top:0;height:46px;border:4px solid ${D.text};border-top:0;border-radius:0 0 8px 8px"></div>
        <p style="position:absolute;left:${D.trad[1].s * sc - 120}px;top:56px;width:${D.gap * sc + 240}px;text-align:center;font:600 34px Inter,sans-serif">lead ${fmt(D.gap)}</p>
      </div><div></div>
      <div style="font-size:26px;color:${D.muted}">needed to place</div>
      <div style="height:28px;background:${D.muted};opacity:.6;width:${D.margin * sc}px;border-radius:4px"></div><div style="font-size:28px">${D.margin}</div>
    </div>
    <p style="font:600 44px CG,serif;color:${D.topColour};margin-top:44px">→ placed in ${esc(D.top)}</p>
  </div>
  <p class="foot">Text: TLHdig Beta 0.3.</p>`, "place.html#id=KBo%2044.52");
}
// 5. Explain
{
  const m = D.ms[0], max = D.decisive[0].v;
  add("step_5_explain.jpg", "5 · Explain", `The words that decide the placement of KBo 44.52, and its closest manuscript ${m.id} (CTH ${m.cth}), side by side`,
    `Every placement comes with the words it rests on, and with the closest manuscripts and compositions to read next to it. Here: ${m.id} (CTH ${m.cth}), ${m.shared} shared words, ${m.phrases} shared phrases; closest composition CTH ${D.comp.cth}, ${esc(D.comp.title)}.`, `
  <div class="left"><p class="step">Step 5</p><h1>Explain</h1><p class="lede">Show the words the placement rests on, and the closest manuscripts to read next to it.</p>
    <div class="tl" style="margin-top:40px;display:flex;flex-wrap:wrap;gap:14px 16px;align-items:baseline">
      ${D.decisive.map(d => `<span style="font-size:${26 + 30 * d.v / max}px;background:${D.bg1};border:2px solid ${D.topColour};border-radius:10px;padding:2px 12px">${d.html}</span>`).join("")}</div>
    <p class="cap" style="font-size:20px">larger = more of the lead</p></div>
  <div style="position:absolute;left:740px;top:90px;display:flex;gap:30px;align-items:flex-start">
    <div>${frag(330)}<p class="cap" style="font-size:22px"><b style="color:${D.text}">${ID}</b><br>CTH 470, the orphan</p></div>
    <div>${pic(m.id, 470)}
      <p class="cap" style="font-size:22px"><b style="color:${D.text}">${m.id}</b>, its closest manuscript<br>CTH ${m.cth}, ${esc(D.comp.title)}</p></div>
  </div>
  <p style="position:absolute;left:740px;top:600px;font-size:30px;font-weight:600">${m.shared} shared words, ${m.phrases} shared phrases</p>
  <p class="foot">${credit(ID, m.id)}</p>`, "closest.html#id=KBo%2044.52");
}

for (const s of slides) {
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${s.body}</body></html>`, { waitUntil: "load" });
  await p.waitForTimeout(200);
  const over = await p.evaluate(() => [...document.querySelectorAll("body *")].filter(e => { const r = e.getBoundingClientRect(); return r.right > 1601 || r.bottom > 901; }).map(e => e.tagName + "." + e.className).slice(0, 5));
  if (over.length) console.warn(s.name, "overflows:", over.join(" "));
  await p.screenshot({ path: path.join(root, "img", "carousel", s.name), type: "jpeg", quality: 85 });
}
await b.close();
server.close();

fs.writeFileSync(path.join(root, "img", "carousel", "slides.json"), JSON.stringify(slides.map(s => ({
  src: s.name, alt: s.alt, title: s.title, caption: s.caption,
  credit: s.name.includes("decide") ? "Text: TLHdig Beta 0.3." : credit(...(s.name.includes("explain") ? [ID, D.ms[0].id] : [ID]))
    .replace(/fotarch (\w+) \(([^)]+)\)/g, (_, n, id) => `<a href="https://hethport.net/hetkonk/bildpraep.php?fundnr=${encodeURIComponent(PHOTO[id][2])}">fotarch ${n}</a> (${id})`),
  link: s.link,
})), null, 1) + "\n");
console.log(slides.map(s => "img/carousel/" + s.name).join("\n"));

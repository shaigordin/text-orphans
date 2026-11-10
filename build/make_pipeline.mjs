// The "Method pipeline" slide of the opening page's carousel: the method in five steps, with
// KBo 41.22 as the running example (numbers from the worked example of the paper and the tool).
// node build/make_pipeline.mjs  (Playwright) -> img/carousel/method_pipeline.jpg
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const { chromium } = createRequire(import.meta.url)("playwright");

const root = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const font = f => `url(data:font/woff2;base64,${fs.readFileSync(path.join(root, "fonts", f)).toString("base64")})`;
const bar = (label, v, max, col, d = 3) => `<div class="b"><span>${label}</span><i style="width:${(100 * v) / max}%;background:${col}"></i><em>${v.toFixed(d)}</em></div>`;
const STEPS = [
  ["Read", "Take the fragment's words as TLHdig edits them.",
    `<div class="tl"><span>i-da-a-lu-un</span> <span>DINGIR<sup>MEŠ</sup>-aš</span> <span>kar-pí-in</span> <b>pa-an-ga-u-wa-aš</b> <b>EME-an</b> <span>na-aš-ta</span> <span>EN</span> <span>SÍSKUR</span> …</div><p class="n">33 words</p>`],
  ["Weigh", "Count each word and its spelling. Rare ones count for much, common ones for little.",
    `${bar("the word pankawaš", 6.8, 7, "#8a4b1f", 1)}${bar("the sign na", 1.2, 7, "#c9b9a6", 1)}<p class="n">rarity of the word (idf)</p>`],
  ["Compare", "Measure the fragment against ten traditions defined in the scholarly literature.",
    `${bar("Luwian rituals", 0.389, 0.4, "#a3368f")}${bar("Kizzuwatna rituals", 0.245, 0.4, "#6250d6")}${bar("Hattian cult layer", 0.204, 0.4, "#2a78d6")}<p class="n">similarity, 0 to 1</p>`],
  ["Decide", "Place it only when the nearest tradition leads clearly; otherwise say so.",
    `<p class="big">0.389 − 0.245<br>= 0.144</p><p class="n">lead needed: 0.018</p><p class="res">→ Luwian rituals</p>`],
  ["Check", "Show the evidence: the deciding words, the closest manuscripts and compositions, duplicates and joins.",
    `<p class="tl"><b>pa-an-ga-u-wa-aš</b> <b>EME-an</b><br>decides it</p><p class="n">closest composition: CTH 409, the ritual of Tunnawiya</p>`],
];
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: CG; font-weight: 600; src: ${font("cg-600-latin.woff2")}; }
@font-face { font-family: CG; font-weight: 600; src: ${font("cg-600-latinext.woff2")}; unicode-range: U+0100-02BA, U+1E00-1EFF, U+2000-206F; }
* { box-sizing: border-box; margin: 0; }
body { width: 1600px; height: 900px; background: radial-gradient(ellipse at 25% 15%, #fbf8f1, #ece5d6); font-family: "Noto Sans", system-ui, sans-serif; color: #1d1b18; padding: 56px 64px; }
h1 { font-family: CG, serif; font-size: 64px; font-weight: 600; line-height: 1; }
.sub { font-size: 24px; color: #5a554b; margin: 10px 0 34px; }
.row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 34px; position: relative; }
.st { background: #fffdf8; border-radius: 16px; box-shadow: 0 10px 30px rgb(60 40 20 / .14); padding: 26px 22px 22px; position: relative; height: 600px; display: flex; flex-direction: column; }
.st:not(:last-child)::after { content: "›"; position: absolute; right: -28px; top: 120px; font-size: 54px; color: #8a4b1f; font-weight: 300; }
.num { width: 54px; height: 54px; border-radius: 50%; background: #8a4b1f; color: #fff; font: 600 30px CG, serif; display: grid; place-items: center; flex-shrink: 0; font-family: "Noto Sans", sans-serif; font-size: 26px; }
h2 { font: 600 42px CG, serif; margin: 16px 0 10px; }
.ex { font-size: 21px; color: #3c382f; line-height: 1.35; min-height: 150px; }
.box { margin-top: auto; border-top: 2px solid #ece5d6; padding-top: 18px; }
.tl { font-family: "Noto Sans Mono", ui-monospace, monospace; font-size: 19px; line-height: 1.6; }
.tl span, .tl b { white-space: nowrap; }
.tl b { background: #f0dcc6; border-radius: 4px; padding: 0 3px; }
.n { font-size: 17px; color: #6c665a; margin-top: 8px; }
.b { display: grid; grid-template-columns: 1fr; margin-bottom: 6px; font-size: 18px; }
.b i { display: block; height: 16px; border-radius: 0 4px 4px 0; margin: 4px 0 0; }
.b em { font-style: normal; font-size: 16px; color: #6c665a; }
.big { font-size: 30px; font-weight: 650; }
.res { font: 600 34px CG, serif; color: #a3368f; margin-top: 10px; }
.foot { position: absolute; left: 64px; bottom: 34px; font-size: 18px; color: #6c665a; }
</style></head><body>
<h1>Method pipeline</h1>
<p class="sub">How the tool places a fragment, step by step, with the orphan KBo 41.22 (CTH 470) as the example.</p>
<div class="row">${STEPS.map(([t, ex, box], i) => `<div class="st"><div class="num">${i + 1}</div><h2>${t}</h2><p class="ex">${ex}</p><div class="box">${box}</div></div>`).join("")}</div>
<p class="foot">Text: TLHdig Beta 0.3. Method: S. Gordin, Orphans and Archetypes (2026).</p>
</body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.setContent(html, { waitUntil: "load" });
await p.waitForTimeout(300);
await p.screenshot({ path: path.join(root, "img", "carousel", "method_pipeline.jpg"), type: "jpeg", quality: 85 });
await b.close();
console.log("img/carousel/method_pipeline.jpg");

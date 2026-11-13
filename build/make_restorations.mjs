// The "Restored words" slide of the opening page's carousel: KBo 41.22 counted two ways, with the
// editors' restorations (data version A) and with the signs on the tablet only (version C).
// Numbers from data/A/corpus.json, data/C/corpus.json and data/C/edition (TLHdig Beta 0.3).
// node build/make_restorations.mjs  (Playwright) -> img/carousel/restorations_KBo41.22.jpg
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const { chromium } = createRequire(import.meta.url)("playwright");

const root = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const font = f => `url(data:font/woff2;base64,${fs.readFileSync(path.join(root, "fonts", f)).toString("base64")})`;
const bar = (label, v, max, col) => `<div class="b"><span>${label}</span><i style="width:${(100 * v) / max}%;background:${col}"></i><em>${v.toFixed(3)}</em></div>`;
const R = s => `<span class="r">${s}</span>`;  // restored by the editor
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: CG; font-weight: 600; src: ${font("cg-600-latin.woff2")}; }
@font-face { font-family: CG; font-weight: 600; src: ${font("cg-600-latinext.woff2")}; unicode-range: U+0100-02BA, U+1E00-1EFF, U+2000-206F; }
* { box-sizing: border-box; margin: 0; }
body { width: 1600px; height: 900px; background: radial-gradient(ellipse at 25% 15%, #fbf8f1, #ece5d6); font-family: "Noto Sans", system-ui, sans-serif; color: #1d1b18; padding: 56px 64px; position: relative; }
h1 { font-family: CG, serif; font-size: 60px; font-weight: 600; line-height: 1; }
.sub { font-size: 24px; color: #5a554b; margin: 10px 0 30px; }
.row { display: grid; grid-template-columns: 1fr 1.25fr 1fr; gap: 34px; }
.st { background: #fffdf8; border-radius: 16px; box-shadow: 0 10px 30px rgb(60 40 20 / .14); padding: 26px 26px 22px; height: 590px; display: flex; flex-direction: column; }
h2 { font: 600 36px CG, serif; margin-bottom: 4px; }
.k { font-size: 18px; color: #6c665a; margin-bottom: 18px; }
.b { margin-bottom: 10px; font-size: 19px; }
.b i { display: block; height: 16px; border-radius: 0 4px 4px 0; margin: 4px 0 0; }
.b em { font-style: normal; font-size: 16px; color: #6c665a; }
.v { margin-top: auto; border-top: 2px solid #ece5d6; padding-top: 16px; font-size: 21px; line-height: 1.4; }
.v b { font: 600 30px CG, serif; display: block; }
.tl { font-family: "Noto Sans Mono", ui-monospace, monospace; font-size: 17px; line-height: 1.9; }
.tl p { white-space: nowrap; }
.tl .ln { color: #8a8378; font-family: "Noto Sans", sans-serif; font-size: 15px; display: inline-block; width: 46px; }
.tl .r { color: #b0a597; }
.tl .r.key { background: #f3e3e0; color: #a07a74; border-radius: 4px; padding: 0 3px; }
.leg { font-size: 16px; color: #6c665a; margin-top: 14px; }
.foot { position: absolute; left: 64px; bottom: 30px; right: 64px; font-size: 18px; color: #6c665a; }
</style></head><body>
<h1>When the editor's restorations decide</h1>
<p class="sub">The orphan KBo 41.22 (CTH 470), counted two ways. Its most telling words are not on the tablet.</p>
<div class="row">
 <div class="st"><h2>With restorations</h2><p class="k">version A · 33 words</p>
  ${bar("Luwian rituals", 0.389, 0.4, "#a3368f")}${bar("Kizzuwatna rituals", 0.245, 0.4, "#6250d6")}${bar("Hattian cult layer", 0.204, 0.4, "#2a78d6")}
  <div class="v"><b style="color:#a3368f">Placed: Luwian rituals</b>lead 0.144, decided by pa-an-ga-u-wa-aš EME-an, "the tongue of the multitude"</div></div>
 <div class="st"><h2>What the tablet preserves</h2><p class="k">reverse, lines 3′–6′ and 11′–13′ (editors' text)</p>
  <div class="tl">
   <p><span class="ln">3′</span>${R("i-")}da-a-lu-un UD-an ma-</p>
   <p><span class="ln">4′</span>${R("DINGIR<sup>MEŠ</sup>-aš kar-pí-in")} <span class="r key">pa-an-ga-u-wa-aš EME-an</span></p>
   <p><span class="ln">5′</span>ša-me-ed-du-wa-ra-at-kán</p>
   <p><span class="ln">6′</span>${R("na-aš-ta EN SÍSKUR ŠUM-ŠU")}</p>
   <p><span class="ln">11′</span>${R("DINGIR<sup>MEŠ</sup>-aš kar-pí-in")} <span class="r key">pa-an-ga-u-wa-aš</span></p>
   <p><span class="ln">12′</span>${R("<sup>LÚ</sup>A.ZU-ma-aš-ši-iš-ša-an")}</p>
   <p><span class="ln">13′</span>na-aš ša-ra-a ti-</p>
  </div>
  <p class="leg"><span style="color:#b0a597">grey</span>: restored by the editor; the rest is on the tablet</p></div>
 <div class="st"><h2>Tablet only</h2><p class="k">version C · 13 words</p>
  ${bar("Kizzuwatna rituals", 0.180, 0.4, "#6250d6")}${bar("Syro-Mesopotamia", 0.167, 0.4, "#008300")}${bar("Hattian cult layer", 0.165, 0.4, "#2a78d6")}
  <div class="v"><b style="color:#5a554b">Too close to call</b>lead 0.014, needed 0.028: the preserved words do not tell the traditions apart</div></div>
</div>
<p class="foot">The site's main results (version C) count only the signs on the tablet, plus restorations the same text supports. Text: TLHdig Beta 0.3.</p>
</body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.setContent(html, { waitUntil: "load" });
await p.waitForTimeout(300);
await p.screenshot({ path: path.join(root, "img", "carousel", "restorations_KBo41.22.jpg"), type: "jpeg", quality: 85 });
await b.close();
console.log("img/carousel/restorations_KBo41.22.jpg");

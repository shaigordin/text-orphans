// Collages for the opening page's carousel: two fragment photographs from the Mainz photo archive
// (Hethitologie-Archiv, hethiter.net/: fotarch), the Konkordanz statement that ties them, and how
// the method ranks the partner among the fragment's closest manuscripts.
//
// The photographs are not part of this repository. Fetch them with fotarch/fetch_photos.js of the
// experiments repository (github.com/shaigordin/measuring-scribal-literacy, folder orphans/), then:
//   PHOTOS=<folder with the photos> KNOWN=<orphans/results/tlhdig03_literature/known_joins/known_joins.csv> \
//     node build/make_collages.mjs
// Writes img/carousel/collage_*.jpg as listed in build/collages.json.
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const { chromium } = createRequire(import.meta.url)("playwright");  // npm i playwright, or a global install with NODE_PATH

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, "..");
const PHOTOS = process.env.PHOTOS ?? path.join(root, "..", "measuring-scribal-literacy", "orphans", "data", "collage");
const KNOWN = process.env.KNOWN ?? path.join(root, "..", "measuring-scribal-literacy", "orphans", "results", "tlhdig03_literature", "known_joins", "known_joins.csv");
const pairs = JSON.parse(fs.readFileSync(path.join(here, "collages.json"), "utf8"));

// known_joins.csv (one quoted field at most per line is enough for this file's simple quoting)
function readCSV(f) {
  const [head, ...lines] = fs.readFileSync(f, "utf8").trim().split("\n");
  const split = l => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(x => x.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
  const cols = split(head);
  return lines.map(l => Object.fromEntries(split(l).map((v, i) => [cols[i], v])));
}
const known = readCSV(KNOWN);

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const img = (p, [x0, y0, x1, y1], fit) => {
  const b64 = fs.readFileSync(path.join(PHOTOS, p)).toString("base64");
  // crop by placing the photo in a clipped box
  return `<div class="ph${fit === "contain" ? " contain" : ""}" style="--x0:${x0};--y0:${y0};--w:${x1 - x0};--h:${y1 - y0}"><img src="data:image/jpeg;base64,${b64}"></div>`;
};

function page(p, k) {
  const pool = (+k.pool).toLocaleString("en");
  const cw = Math.min(14, Math.floor(300 / k.barcode.length) - 3);
  const cells = [...k.barcode].map(c => `<i class="${c === "." ? "o" : c}" style="width:${cw}px"></i>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1600px; height: 900px; background: radial-gradient(ellipse at 30% 20%, #fbf8f1, #ece5d6); font-family: "Noto Sans", system-ui, sans-serif; color: #1d1b18; position: relative; overflow: hidden; }
  h1 { position: absolute; left: 70px; top: 50px; font-size: 46px; font-weight: 650; letter-spacing: -0.01em; }
  .rel { position: absolute; left: 72px; top: 118px; font-size: 22px; color: #8a4b1f; text-transform: uppercase; letter-spacing: .12em; }
  .frag { position: absolute; top: 175px; width: 560px; height: 520px; display: flex; flex-direction: column; align-items: center; }
  .frag.a { left: 90px; transform: rotate(-2deg); } .frag.b { right: 90px; transform: rotate(1.6deg); }
  .print { background: #fff; padding: 14px 14px 0; box-shadow: 0 18px 40px rgb(60 40 20 / .28), 0 2px 6px rgb(0 0 0 / .15); }
  .ph { width: 500px; height: 400px; overflow: hidden; position: relative; background: #f4f1ea; }
  .ph img { position: absolute; filter: grayscale(1) sepia(.28) contrast(1.08); }
  .lab { padding: 10px 2px 14px; font-size: 26px; font-weight: 650; text-align: center; }
  .lab small { display: block; font-size: 17px; font-weight: 400; color: #5a554b; }
  .mid { position: absolute; left: 650px; width: 300px; top: 300px; text-align: center; }
  .rank { font-size: 74px; font-weight: 700; line-height: 1; color: #8a4b1f; }
  .rank small { font-size: 26px; }
  .mid p { font-size: 19px; color: #3c382f; margin-top: 10px; line-height: 1.35; }
  .bar { margin: 18px auto 0; display: flex; gap: 3px; justify-content: center; }
  .bar i { width: 14px; height: 30px; border-radius: 2px; } .bar .S { background: #1d1b18; } .bar .W { background: #fff; border: 2px solid #1d1b18; } .bar .o { background: #d9d2c3; }
  .bar + p { font-size: 15px; color: #5a554b; }
  .konk { position: absolute; left: 70px; right: 70px; bottom: 74px; font-size: 21px; text-align: center; color: #3c382f; font-style: italic; }
  .credit { position: absolute; left: 70px; right: 70px; bottom: 30px; font-size: 15px; text-align: center; color: #6c665a; }
  </style></head><body>
  <h1>${esc(p.title)}</h1><div class="rel">${esc(p.relation)}</div>
  ${["a", "b"].map(s => `<div class="frag ${s}"><div class="print">${img(p[s].photo, p[s].crop, p[s].fit)}
     <div class="lab">${esc(p[s].siglum)}<small>${esc(p[s].note)}</small></div></div></div>`).join("")}
  <div class="mid"><div class="rank">${k.rank === "1" ? "1<small>st</small>" : k.rank === "2" ? "2<small>nd</small>" : k.rank + "<small>th</small>"}</div>
    <p>closest of ${pool} TLHdig texts to ${esc(p.a.siglum)}, found by the method alone</p>
    <div class="bar">${cells}</div><p>${esc(p.a.siglum)}'s words in ${esc(p.b.siglum)}: ■ same spelling □ other spelling</p></div>
  <div class="konk">${esc(p.konkordanz)}</div>
  <div class="credit">Photographs: Hethitologie-Archiv Mainz, hethiter.net/: fotarch ${["a", "b"].map(s => `${esc(p[s].fotarch)} (${esc(p[s].siglum)}${p[s].rights ? ", " + esc(p[s].rights) : ""})`).join(", ")}. Text: TLHdig Beta 0.3.</div>
  <script>
    for (const d of document.querySelectorAll(".ph")) {
      const im = d.querySelector("img"), s = getComputedStyle(d);
      const x0 = +s.getPropertyValue("--x0"), y0 = +s.getPropertyValue("--y0"), w = +s.getPropertyValue("--w"), h = +s.getPropertyValue("--h");
      im.onload = () => {
        const cw = im.naturalWidth * w, ch = im.naturalHeight * h, sc = (d.classList.contains("contain") ? Math.min : Math.max)(500 / cw, 400 / ch);
        im.style.width = im.naturalWidth * sc + "px";
        im.style.left = (500 - cw * sc) / 2 - x0 * im.naturalWidth * sc + "px";
        im.style.top = (400 - ch * sc) / 2 - y0 * im.naturalHeight * sc + "px";
      };
      if (im.complete) im.onload();
    }
  </script></body></html>`;
}

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1600, height: 900 } });
for (const p of pairs) {
  const k = known.find(r => r.fragment === p.a.siglum && r.partner === p.b.siglum);
  if (!k) throw new Error(`no known_joins row for ${p.a.siglum} / ${p.b.siglum}`);
  await tab.setContent(page(p, k), { waitUntil: "load" });
  await tab.waitForTimeout(300);
  await tab.screenshot({ path: path.join(root, "img", "carousel", p.out), type: "jpeg", quality: 82 });
  console.log(p.out, "rank", k.rank, "of", k.pool);
}
await browser.close();

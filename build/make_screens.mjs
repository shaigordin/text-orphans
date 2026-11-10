// Screenshots of the tool for the opening page's carousel. Serve the site first
// (python3 -m http.server 8765), then: node build/make_screens.mjs [http://localhost:8765]
import path from "path";
import { createRequire } from "module";
const { chromium } = createRequire(import.meta.url)("playwright");

const base = process.argv[2] ?? "http://localhost:8765";
const out = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "img", "carousel");
const SHOTS = [
  // [file, page, element to wait for, element to capture, setup]
  ["screen_wheel.png", "place.html#id=KBo%2041.22", "#bars span", "#hex", async p => { await p.check("#showOrph"); }],
  ["screen_browse.png", "browse.html#group=cth&kind=orphan&sort=size", ".bin", "main", null],
  ["screen_closest.png", "closest.html#id=HT%2049", "#ms tbody tr", "#msCard", null],
  ["screen_window.png", "closest.html#id=HT%2049", "#win p", "#winCard", null],
  ["screen_gallery.png", "place.html#id=KBo%2041.22", ".gallery .tile", ".gallery", null],
];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
await p.emulateMedia({ colorScheme: "light" });
for (const [file, page, wait, sel, setup] of SHOTS) {
  await p.goto(`${base}/${page}`);
  await p.waitForSelector(wait, { timeout: 60000 });
  if (setup) await setup(p);
  await p.waitForTimeout(500);
  await p.locator(sel).first().screenshot({ path: path.join(out, file) });
  console.log(file);
}
await b.close();

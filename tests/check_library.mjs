// Check the closest manuscripts and join checks of js/library.js against the Python case study
// (measuring-scribal-literacy, orphans/run_join_candidates.py; copied to tests/fixtures/joins_EBo_133.json).
// Run `node tests/check_library.mjs` in playground/.
import fs from "fs";

const root = new URL("../", import.meta.url);
globalThis.fetch = async p => ({ json: async () => JSON.parse(fs.readFileSync(new URL(p, root))) });
const V = await import("../js/data.js");
const Q = await import("../js/model.js");
const L = await import("../js/library.js");
// the fixture comes from the version A run (results/tlhdig03_literature); VERSION=C with a C fixture
const VER = process.env.VERSION || "A", base = `data/${VER}`;
console.log(`data version ${VER}`);
const model = await Q.loadModel(base);
const corpus = await (await fetch(`${base}/corpus.json`)).json();
const lib = await L.loadLibrary(model, corpus, base);
const py = JSON.parse(fs.readFileSync(new URL(VER === "A" ? "tests/fixtures/joins_EBo_133.json" : `tests/fixtures/joins_EBo_133_${VER}.json`, root)));

const id = py.txtid, filter = Q.featureFilter(model);
const r = Q.scoreParsed(L.parsedOf(id, model), model, { filter });
const sims = L.similarities(r.vec, filter, model.vocab.length);
const top = L.closestManuscripts(sims, { exclude: id, top: py.candidates.length });
const frag = L.fragmentColumns(lib.byId.get(id).words, lib.byId.get(id).translits);
let same = 0, simErr = 0, barcodes = 0, flags = 0;
top.forEach((t, k) => {
  const p = py.candidates[k], j = L.joinChecks(frag, t.doc);
  same += t.doc.id === p.txtid;
  simErr = Math.max(simErr, Math.abs(t.sim - p.similarity));
  barcodes += j.cells === p.barcode;
  flags += j.flagged === p.flagged;
});
const n = py.candidates.length;
console.log(`pool: browser ${lib.pool.length - 1}, Python ${py.pool_size}`);
console.log(`same candidate at each rank: ${same} of ${n}; largest similarity difference ${simErr.toFixed(5)}`);
console.log(`same join barcode: ${barcodes} of ${n}; same flag: ${flags} of ${n}`);
if (same < n || simErr > 1e-3 || barcodes < n || flags < n) process.exit(1);

// Which version of the data the pages read. Each version is a folder data/<key>/ written by
// build/build_data.py from one reading of TLHdig; data/versions.json lists the versions built and
// the default one. The reader picks a version in the settings bar (kept between visits).
//   C  preserved signs, plus restorations supported by the same text (damaged and "?" signs count
//      as preserved but are flagged); the main results of the paper
//   A  the editor's full text, restorations included; for comparison
import { load, addGroup } from "./settings.js";

export const INFO = await (await fetch("data/versions.json")).json();
const want = load().reading;
export const KEY = INFO.versions[want] ? want : INFO.default;
export const DIR = `data/${KEY}`;
export const LABEL = `version ${KEY} (${INFO.versions[KEY].label})`;
export const url = name => `${DIR}/${name}`;

const ORDER = ["C", "B", "A"];
addGroup("reading", "Broken and restored signs",
  Object.keys(INFO.versions).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
    .map(k => [k, `${k}: ${INFO.versions[k].label}${k === INFO.default ? " (main results)" : ""}`]),
  Object.entries(INFO.versions).map(([k, v]) => `${k}: ${v.long}`).join(" "), INFO.default);

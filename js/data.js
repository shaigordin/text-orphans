// Which version of the data the pages read. Each version is a folder data/<key>/ written by
// build/build_data.py from one reading of TLHdig; data/versions.json lists the versions built and
// the default one. The reader picks a version in the settings bar (kept between visits).
//   C  without restorations: signs visible on the tablet, plus restorations supported by the same
//      text (damaged and "?" signs count); the default
//   A  with restorations: the editor's full text
import { load, addGroup } from "./settings.js";

export const INFO = await (await fetch("data/versions.json")).json();
// ?data=C in the address (as in a citation's link) overrides the saved choice, without saving it
const want = (typeof location !== "undefined" && new URLSearchParams(location.search).get("data")) || load().reading;
export const KEY = INFO.versions[want] ? want : INFO.default;
export const DIR = `data/${KEY}`;
export const LABEL = INFO.versions[KEY].label;
export const url = name => `${DIR}/${name}`;

const ORDER = ["C", "B", "A"];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
addGroup("reading", "Restorations",
  Object.keys(INFO.versions).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
    .map(k => [k, `${cap(INFO.versions[k].label)}${k === INFO.default ? " (default)" : ""}`]),
  Object.entries(INFO.versions).map(([k, v]) => `${cap(v.label)}: ${v.long}`).join(" "), INFO.default);

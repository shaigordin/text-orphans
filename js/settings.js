// The settings bar: radio buttons shared by every tool page and kept between visits.
//   top       how many results to list
//   features  words and spellings (the paper's model), words only, or spellings (signs) only
//   writing   all, logograms (Sumero-/Akkadograms) only, or phonetic (syllabic) renderings only
//   common    show or treat as unplaced the placements that rest mostly on words every tradition shares
//   reading   which version of the data (how broken and restored signs count); its options are those
//             listed in data/versions.json, added by js/data.js. Changing it reloads the page.
const KEY = "text-orphans-settings";
export const DEFAULTS = { top: 10, features: "both", writing: "all", common: "show" };
const GROUPS = {
  top: ["Show", [[5, "top 5"], [10, "top 10"], [20, "top 20"]]],
  features: ["Compare by", [["both", "words and spellings (as in the paper)"], ["words", "words only"], ["signs", "spellings only (signs)"]]],
  writing: ["Writing", [["all", "everything"], ["logo", "logograms only"], ["phon", "phonetic renderings only"]]],
  common: ["Placements resting mostly on common words (nu, -ma, the sign a …)", [["show", "show as placed"], ["hide", "treat as unplaced"]]],
};
const HELP = {
  features: "Words are TLHdig's word forms; spellings are the signs of each word and their sequences of two and three.",
  writing: "Logograms are words and signs written in Sumerian or Akkadian (upper case, e.g. NINDA, DINGIR); phonetic renderings are written syllable by syllable.",
};

// Add a group whose options are only known at run time (js/data.js adds "reading").
export function addGroup(key, label, opts, help, dflt) {
  GROUPS[key] = [label, opts];
  if (help) HELP[key] = help;
  DEFAULTS[key] ??= dflt;
}

export function load() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { /* private mode */ }
  const out = { ...DEFAULTS, ...s };
  out.top = +out.top;
  return out;
}
const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ } };
export const calibrated = s => s.features === "both" && s.writing === "all";

// Draw the bar into `el` with the groups named in `keys`; `onChange(settings)` after each click.
export function bar(el, keys, onChange) {
  const s = load();
  el.classList.add("settings");
  keys = keys.filter(k => GROUPS[k] && !(k === "reading" && GROUPS[k][1].length < 2));
  el.innerHTML = keys.map(k => {
    const [label, opts] = GROUPS[k];
    return `<fieldset><legend>${label}${HELP[k] ? ` <span class="help" title="${HELP[k]}">?</span>` : ""}</legend>` +
      opts.map(([v, t]) => `<label><input type="radio" name="set-${k}" value="${v}" ${String(s[k]) === String(v) ? "checked" : ""}> ${t}</label>`).join("") +
      `</fieldset>`;
  }).join("") +
    `<p class="small note" hidden></p>`;
  const note = el.querySelector(".note");
  const show = st => {
    note.hidden = calibrated(st) || !keys.includes("features");
    note.innerHTML = "<b>Exploratory setting.</b> The paper's thresholds (when to place a fragment, when it fits no tradition) were calibrated on words and spellings together, so here the page shows what is nearest without a verdict.";
  };
  show(s);
  for (const inp of el.querySelectorAll("input")) inp.onchange = () => {
    const st = load();
    st[inp.name.slice(4)] = inp.name === "set-top" ? +inp.value : inp.value;
    save(st);
    if (inp.name === "set-reading") { location.reload(); return; }
    show(st);
    onChange(st);
  };
  return s;
}

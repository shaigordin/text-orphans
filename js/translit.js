// Transliteration in the conventions of the paper and talk: phonetic Hittite in italics,
// Akkadograms in italics and set larger, Sumerograms in upright capitals, determinatives in { },
// and the editors' marks rebuilt from each sign's status: [ ] around restored or lost signs,
// ⸢ ⸣ around damaged ones, ⟨ ⟩ around signs the scribe omitted, ? and ! after uncertain and
// emended signs. Sign status, layer and flags come from data/<version>/edition (qtm.tlhdig);
// without them (pasted text, data without an edition) only the case of each sign is used.
import * as Q from "./model.js";

const SPLIT = /([-.\s{}+˽]+)/;   // as qtm.variants: separators sit at the odd places of split()
const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const GAP = new Set(["R", "L"]);
const FLAG = { u: "?", e: "!" };
const TITLE = { u: "uncertain reading", e: "emended by the editor", r: "written over an erasure", a: "added by the scribe", s: "superfluous" };

// The layer of a sign when TLHdig's tag is not at hand: upper case is a logogram (Sumerogram,
// since Akkadograms cannot be told apart by case), inside braces a determinative.
const guessLayer = (sign, inBraces) => inBraces ? "d" : /^\p{Lu}/u.test(sign) ? "S" : "H";

// One word. `st`, `ly`, `fl`: one letter per sign (status, layer) and flags joined by ".".
export function word(t, st = "", ly = "", fl = "") {
  const n = Q.signs(t).length;
  const known = st && st.length === n;
  const layers = ly && ly.length === n ? ly : "";
  const flags = fl ? fl.split(".") : [];
  let i = 0, braces = 0;
  const toks = [];   // [kind, html]: "sep" separators, "open"/"close" marks, "sign"
  const parts = t.split(SPLIT);
  parts.forEach((part, j) => {
    if (j % 2) { braces += (part.match(/\{/g) || []).length - (part.match(/\}/g) || []).length; toks.push(["sep", part.replace(/\s+/g, "")]); return; }
    if (!part) return;
    const k = Q.signs(part).length;
    if (!k) { toks.push(["sign", `<span class="L-x">${esc(part)}</span>`]); return; }   // x, numbers
    if (part === "∅" && !known) { toks.push(["sign", `<span class="br gap" title="not on the tablet">[…]</span>`]); i += k; return; }  // version C, model text
    const s = known ? st[i] : "P", prev = known && i > 0 ? st[i - 1] : "", next = known && i + k < n ? st[i + k] : "";
    const lay = layers ? layers[i] : guessLayer(part, braces > 0);
    const f = flags[i] ?? "";
    let open = "", close = "";
    if (GAP.has(s)) { if (!GAP.has(prev)) open = "["; if (!GAP.has(next)) close = "]"; }
    else if (s === "D") { if (prev !== "D") open = "⸢"; if (next !== "D") close = "⸣"; }
    else if (s === "O") { open = "⟨"; close = "⟩"; }
    const marks = [...f].filter(c => FLAG[c]).map(c => FLAG[c]).join("");
    const title = [...f].map(c => TITLE[c]).filter(Boolean).join(", ");
    if (open) toks.push(["open", open]);
    toks.push(["sign", `<span class="L-${lay}${GAP.has(s) ? " gap" : ""}"${title ? ` title="${title}"` : ""}>${esc(part)}</span>` + (marks ? `<sup class="br">${marks}</sup>` : "")]);
    if (close) toks.push(["close", close]);
    i += k;
  });
  // A bracket that opens on a determinative goes before its "{", one that closes on it after its "}":
  // [{NINDA}ta-kar-mu]-un, not {[NINDA}ta-kar-mu]-un.
  for (let a = 0; a < toks.length; a++) {
    const [kind, v] = toks[a];
    if (kind === "open" && a > 0 && toks[a - 1][0] === "sep" && toks[a - 1][1].endsWith("{")) {
      const sep = toks[a - 1][1];
      toks.splice(a - 1, 2, ["sep", sep.slice(0, -1)], ["open", v], ["sep", "{"]);
      a++;
    } else if (kind === "close" && toks[a + 1]?.[0] === "sep" && toks[a + 1][1].startsWith("}")) {
      const sep = toks[a + 1][1];
      toks.splice(a, 2, ["sep", "}"], ["close", v], ["sep", sep.slice(1)]);
      a++;
    }
  }
  const out = toks.map(([kind, v]) => kind === "sign" ? v : kind === "sep" ? esc(v) : `<span class="br">${v}</span>`).join("");
  return out;
}

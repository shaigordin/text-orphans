// A short tour of each page, shown on the first visit, and a "What does this do?" mode that labels
// the parts of the page. The texts are below, one list per page: [selector, title, text].
const STEPS = {
  "index.html": [
    ["#nav", "The tools", "Each tab is one tool. Start here on the opening page, or go straight to a tool."],
    ["#carousel", "Examples from the research", "Fragments whose known duplicate the method finds, and how the method works, step by step."],
    ["#qForm", "Check a text", "Type a text number such as KBo 44.52, paste a TLHdig or Konkordanz link, or paste a transliteration, and press Check."],
    ["#qVer", "Which data", "Results count only the signs on the tablet (version C). The tool pages let you switch to the editors' full text (version A) to compare."],
    [".intro", "Go deeper", "Each card opens a tool with more detail, settings and exports."],
  ],
  "browse.html": [
    ["#settings", "Settings", "Choose the version of the data and whether placements that rest on common words count."],
    ["#tiles", "The orphan bins at a glance", "How many fragments of each bin (CTH 470, 500, 670, 832, EBo) the method places, and where."],
    ["#group", "Filter and sort", "Narrow the list by bin, by what the method says, or by a text number."],
    ["#bins", "Every CTH number", "Open a CTH number to see its texts, where each is placed, and links to place, closest texts and the portal."],
    ["#export", "Export", "Download the bins or the texts as CSV or JSON, with the data version named."],
  ],
  "place.html": [
    ["#fetchForm", "Load a text", "Type a TLHdig text number or paste a link; or paste a transliteration in the box below."],
    ["#settings", "Settings", "Data version, what to compare (words, signs or both) and which writing (logograms or phonetic). Only the default is the calibrated model of the paper."],
    ["#verdict", "The verdict", "Where the fragment is placed, or why not: too close to call, too short, or outside the ten traditions."],
    ["#chips", "The words", "Each word of the fragment, coloured by the tradition it pulls toward; the tag gives its word class."],
    ["#contrib", "Why this tradition", "Which kinds of words decide between the nearest tradition and the runner-up."],
    ["#hex", "Tradition wheel", "The fragment among all manuscripts: each corner is a tradition defined in the scholarly literature."],
    ["#export", "Export", "Scores, words and figures as CSV, SVG or PNG."],
  ],
  "closest.html": [
    ["#form", "Choose a text", "A text number, a link, or a transliteration."],
    ["#settings", "Settings", "Data version, how many results, what to compare, and how to treat common words."],
    ["#trad", "Closest traditions", "Similarity to each of the ten traditions: 1 is identical, 0 nothing shared."],
    ["#comp", "Closest compositions", "CTH numbers, each as the average of its manuscripts."],
    ["#ms", "Closest manuscripts", "The texts most like this one in all of TLHdig, with three checks for a duplicate or join: half the words, the same spellings, a shared phrase. Click a row to read both texts."],
    ["#win", "Both texts side by side", "Shared words are marked; restored signs are grey in [ ], damaged ones in ⸢ ⸣."],
    ["#export", "Export", "Download the lists as CSV or JSON."],
  ],
  "compare.html": [
    ["#ids", "Two texts", "Load two witnesses by text number, or paste two transliterations."],
    ["#cos", "Overall similarity", "One number for how alike the two texts are, word by word."],
    ["#fly", "Word butterfly", "Words of one text on the left, of the other on the right; shared words in the middle. Click a word for its spellings."],
    ["#export", "Export", "Download all words as CSV, or the figure's data."],
  ],
  "join.html": [
    ["#steps", "How it works", "Five steps: load two photos, scale each by its ruler, cut out the pieces, measure line spacing, then arrange them."],
    ["#pieceA", "One piece", "Load a photo, click two points along the ruler's blocks, draw a box around the fragment if needed, and press Cut out."],
    ["#tools", "Arrange", "Move and rotate the pieces, align their edges, or move one until they touch."],
    ["#ws", "True-scale workspace", "Both pieces at the same scale. The coloured ticks show each piece's line spacing."],
    ["#compareOut", "Measurements", "Scale, size and line spacing of each piece, and the difference in spacing."],
    ["#export", "Export", "The picture as PNG and the measurements as JSON."],
  ],
  "about.html": [
    ["main", "About", "How the method works, how far to trust it, the data versions, how to cite the tool, and how to rebuild it."],
  ],
};

const page = location.pathname.split("/").pop() || "index.html";
const steps = () => (STEPS[page] || []).map(([sel, t, x]) => [document.querySelector(sel), t, x]).filter(([el]) => el && el.offsetParent !== null);
const KEY = "text-orphans-tour-" + page;
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// ---------- the tour ----------
let layer = null;
function endTour() { layer?.remove(); layer = null; document.removeEventListener("keydown", keys); try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ } }
function keys(e) { if (e.key === "Escape") endTour(); }
export function tour(k = 0) {
  const S = steps();
  if (!S.length) return;
  layer?.remove();
  const [el, title, text] = S[k];
  el.scrollIntoView({ block: "center", behavior: "instant" });
  const r = el.getBoundingClientRect(), pad = 6;
  layer = document.createElement("div");
  layer.className = "tour";
  layer.innerHTML = `<div class="tour-hole" style="left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + 2 * pad}px;height:${r.height + 2 * pad}px"></div>
    <div class="tour-box" role="dialog" aria-label="${esc(title)}"><p class="tour-n">${k + 1} of ${S.length}</p><h3>${esc(title)}</h3><p>${esc(text)}</p>
    <div class="tour-btns"><button type="button" data-a="skip">Skip</button>${k ? '<button type="button" data-a="back">Back</button>' : ""}
    <button type="button" class="primary" data-a="next">${k + 1 < S.length ? "Next" : "Done"}</button></div></div>`;
  document.body.append(layer);
  const box = layer.querySelector(".tour-box"), bw = box.offsetWidth, bh = box.offsetHeight;
  const below = r.bottom + pad + 12 + bh < innerHeight;
  box.style.top = (below ? r.bottom + pad + 12 : Math.max(12, r.top - pad - 12 - bh)) + "px";
  box.style.left = Math.min(innerWidth - bw - 12, Math.max(12, r.left)) + "px";
  layer.querySelector("[data-a=next]").focus();
  layer.onclick = e => {
    const a = e.target.dataset?.a;
    if (a === "next") k + 1 < S.length ? tour(k + 1) : endTour();
    else if (a === "back") tour(k - 1);
    else if (a === "skip") endTour();
  };
  document.addEventListener("keydown", keys);
}

// ---------- "What does this do?" ----------
let labels = null;
function help(on) {
  labels?.forEach(l => l.remove()); labels = null;
  document.body.classList.toggle("helping", on);
  $btn.setAttribute("aria-pressed", on);
  if (!on) return;
  labels = steps().map(([el, title, text]) => {
    el.classList.add("help-target");
    const b = document.createElement("div");
    b.className = "help-label";
    b.innerHTML = `<b>${esc(title)}</b> ${esc(text)}`;
    const r = el.getBoundingClientRect();
    b.style.top = r.top + scrollY + 4 + "px";
    b.style.left = r.left + scrollX + 4 + "px";
    b.style.maxWidth = Math.max(220, Math.min(380, r.width - 8)) + "px";
    document.body.append(b);
    return b;
  });
}

// the two buttons, top right of the page header
const bar = document.createElement("div");
bar.className = "tour-bar";
bar.innerHTML = `<button type="button" id="helpBtn" aria-pressed="false" title="Label the parts of this page">What does this do?</button>
  <button type="button" id="tourBtn" title="A short tour of this page">Tour</button>`;
(document.querySelector("header .hero-in") || document.querySelector("header"))?.prepend(bar);
const $btn = bar.querySelector("#helpBtn");
$btn.onclick = () => help(!document.body.classList.contains("helping"));
bar.querySelector("#tourBtn").onclick = () => { help(false); tour(0); };
addEventListener("resize", () => { if (document.body.classList.contains("helping")) help(true); });

let seen = false;
try { seen = !!localStorage.getItem(KEY); } catch { seen = true; }
// first visit: wait until the page has drawn its parts, then start
if (!seen && !navigator.webdriver) setTimeout(() => tour(0), 1200);

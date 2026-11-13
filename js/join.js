// Check a join from photos: two pieces, each scaled by its own ruler, cut out, measured for line
// spacing (js/joinfit.js), then arranged by hand on a true-scale workspace.
import * as J from "./joinfit.js";
import * as X from "./export.js";

const $ = id => document.getElementById(id);
const WORK = 1400;          // longest side of the working copy of a photo, px
const fmt = (x, d = 2) => (x == null || isNaN(x) ? "–" : x.toFixed(d));

const pieces = { A: newPiece("A"), B: newPiece("B") };
function newPiece(key) {
  return { key, name: "", credit: "", img: null, w: 0, h: 0, data: null, g: null,
    tool: "ruler", clicks: [], ruler: null, rulerCm: null, box: null, dark: true, thr: 40,
    mask: null, bb: null, cut: null, pitch: null, lines: null, linesN: 5,
    pos: { x: key === "A" ? 2 : 2, y: key === "A" ? 2 : 9 }, rot: 0 };
}
const pxPerCm = p => p.rulerCm ? p.rulerCm.pxPerCm : p.ruler ? p.ruler.pxPerCm : null;

// ---------- one piece: load, scale, cut out, line spacing ----------
function card(p) {
  const el = $("piece" + p.key);
  el.innerHTML = `<h2>Piece ${p.key}</h2>
    <div class="row" style="margin:0 0 6px"><input class="nm" placeholder="Siglum, e.g. ${p.key === "A" ? "KBo 44.140" : "EBo 133"}" style="flex:1">
      <input class="cr" placeholder="Photo credit" style="flex:1"></div>
    <label class="file"><input type="file" accept="image/*"> Load a photograph</label>
    <div class="settings joinbar"><fieldset><legend>Click on the photo to</legend>
      <label><input type="radio" name="tool${p.key}" value="ruler" checked> mark the ruler</label>
      <label><input type="radio" name="tool${p.key}" value="box"> draw a box around the piece</label>
      <label><input type="radio" name="tool${p.key}" value="lines"> mark two lines</label></fieldset></div>
    <canvas class="prev" width="10" height="10"></canvas>
    <div class="settings joinbar">
      <fieldset><legend>Ruler</legend><span class="small rr">Click the start and end of several black and white blocks.</span>
        <label class="small">or the clicks are <input type="number" class="cm" min="0.1" step="0.1" style="width:5em"> cm apart</label></fieldset>
      <fieldset><legend>Background</legend>
        <label><input type="radio" name="bg${p.key}" value="dark" checked> dark</label>
        <label><input type="radio" name="bg${p.key}" value="light"> light</label>
        <label class="small">threshold <input type="range" class="thr" min="2" max="250" value="40" style="width:8em"> <output class="thrOut">40</output></label>
        <button type="button" class="cut primary">Cut out</button></fieldset>
      <fieldset><legend>Line spacing</legend><span class="small ls">Cut out first.</span>
        <label class="small">lines between the two marks <input type="number" class="ln" min="1" step="1" value="5" style="width:4em"></label></fieldset>
    </div>`;
  const cv = el.querySelector(".prev");
  el.querySelector(".nm").oninput = e => { p.name = e.target.value.trim(); compare(); draw(); };
  el.querySelector(".cr").oninput = e => { p.credit = e.target.value.trim(); };
  el.querySelector("input[type=file]").onchange = e => load(p, e.target.files[0]);
  for (const r of el.querySelectorAll(`input[name=tool${p.key}]`)) r.onchange = () => { p.tool = r.value; p.clicks = []; preview(p); };
  for (const r of el.querySelectorAll(`input[name=bg${p.key}]`)) r.onchange = () => {
    p.dark = r.value === "dark"; p.thr = p.dark ? 40 : 205;
    el.querySelector(".thr").value = p.thr; el.querySelector(".thrOut").value = p.thr;
  };
  el.querySelector(".thr").oninput = e => { p.thr = +e.target.value; el.querySelector(".thrOut").value = p.thr; };
  el.querySelector(".cm").oninput = e => { const v = +e.target.value; setCm(p, v > 0 ? v : null); };
  el.querySelector(".ln").oninput = e => { p.linesN = Math.max(1, +e.target.value || 1); measureLines(p); };
  el.querySelector(".cut").onclick = () => cut(p);
  // clicks on the preview, in working-copy pixels
  let drag = null;
  const at = e => { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * p.w, y: ((e.clientY - r.top) / r.height) * p.h }; };
  cv.onpointerdown = e => {
    if (!p.img) return;
    const q = at(e);
    if (p.tool === "box") { drag = q; p.box = { x0: q.x, y0: q.y, x1: q.x, y1: q.y }; cv.setPointerCapture(e.pointerId); return; }
    p.clicks.push(q);
    if (p.clicks.length === 2) {
      if (p.tool === "ruler") { p.ruler = J.rulerScale(p.g, p.w, p.h, p.clicks[0], p.clicks[1]); p.rulerLine = p.clicks; p.rulerCm = null; el.querySelector(".cm").value = ""; }
      else { p.lines = [p.clicks[0], p.clicks[1]]; measureLines(p); }
      p.clicks = [];
      readout(p); compare(); draw();
    }
    preview(p);
  };
  cv.onpointermove = e => { if (drag) { const q = at(e); p.box = { x0: Math.min(drag.x, q.x), y0: Math.min(drag.y, q.y), x1: Math.max(drag.x, q.x), y1: Math.max(drag.y, q.y) }; preview(p); } };
  cv.onpointerup = () => { drag = null; };
}

function setCm(p, cm) {
  if (!cm || !p.rulerLine) { p.rulerCm = null; readout(p); return; }
  const [a, b] = p.rulerLine;
  p.rulerCm = { pxPerCm: Math.hypot(b.x - a.x, b.y - a.y) / cm, cm };
  readout(p); measureAuto(p); compare(); draw();
}

async function load(p, file) {
  if (!file) return;
  const url = URL.createObjectURL(file), img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const s = Math.min(1, WORK / Math.max(img.naturalWidth, img.naturalHeight));
  p.w = Math.round(img.naturalWidth * s); p.h = Math.round(img.naturalHeight * s); p.down = s;
  const c = new OffscreenCanvas(p.w, p.h), x = c.getContext("2d");
  x.drawImage(img, 0, 0, p.w, p.h);
  p.img = c; p.data = x.getImageData(0, 0, p.w, p.h); p.g = J.grey(p.data);
  p.file = file.name; if (!p.name) { p.name = file.name.replace(/\.[^.]+$/, ""); $("piece" + p.key).querySelector(".nm").value = p.name; }
  Object.assign(p, { ruler: null, rulerCm: null, rulerLine: null, box: null, mask: null, cut: null, pitch: null, lines: null, clicks: [] });
  preview(p); readout(p); compare(); draw();
}

function cut(p) {
  if (!p.img) return;
  const b = p.box && p.box.x1 - p.box.x0 > 10 ? p.box : { x0: 0, y0: 0, x1: p.w, y1: p.h };
  const x0 = Math.round(b.x0), y0 = Math.round(b.y0), w = Math.round(b.x1 - b.x0), h = Math.round(b.y1 - b.y0);
  const sub = p.img.getContext("2d").getImageData(x0, y0, w, h);
  const k = Math.max(1, p.w / 1000);   // iterations as run_joinfit at its photo sizes
  const m = J.cutout(sub, { dark: p.dark, thr: p.thr, open: Math.round(3 / k) || 1, close: Math.round(12 / k) || 2 });
  const bb = J.bbox(m, w, h);
  if (!bb) { $("piece" + p.key).querySelector(".ls").textContent = "Nothing found: change the threshold or the background."; return; }
  // the cut-out as an RGBA canvas cropped to its bounding box (working-copy px)
  const W = bb.x1 - bb.x0 + 1, H = bb.y1 - bb.y0 + 1, out = new ImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y + bb.y0) * w + x + bb.x0, o = 4 * (y * W + x);
    out.data[o] = sub.data[4 * i]; out.data[o + 1] = sub.data[4 * i + 1]; out.data[o + 2] = sub.data[4 * i + 2]; out.data[o + 3] = m[i] ? 255 : 0;
  }
  const c = new OffscreenCanvas(W, H); c.getContext("2d").putImageData(out, 0, 0);
  p.cut = c; p.origin = { x: x0 + bb.x0, y: y0 + bb.y0 }; p.mask = { m, w, h, x0, y0, bb };
  measureAuto(p); preview(p); readout(p); compare(); draw();
}

// Automatic line spacing on the middle of the cut-out (as the text band of run_joinfit).
function measureAuto(p) {
  const s = pxPerCm(p);
  if (!p.cut || !s) { p.pitch = null; return; }
  const { x, y } = p.origin, W = p.cut.width, H = p.cut.height;
  const band = { x0: Math.round(x + 0.2 * W), x1: Math.round(x + 0.8 * W), y0: Math.round(y + 0.08 * H), y1: Math.round(y + 0.92 * H) };
  p.pitch = J.linePitch(p.g, p.w, band, s);
  if (p.pitch) p.pitch.band = band;
  readout(p);
}
function measureLines(p) {
  if (!p.lines) return;
  const [a, b] = p.lines;
  p.manual = { distPx: Math.abs(b.y - a.y), n: p.linesN, y0: Math.min(a.y, b.y) };
  readout(p); compare(); draw();
}
// The line spacing used on the workspace: the marked one if any, else the automatic one.
function spacing(p) {
  const s = pxPerCm(p);
  if (!s) return null;
  if (p.manual) return { cm: p.manual.distPx / p.manual.n / s, how: `${p.manual.n} lines between two marks`, y0: p.manual.y0, px: p.manual.distPx / p.manual.n };
  if (p.pitch) return { cm: p.pitch.pitchPx / s, how: "automatic estimate, not checked", y0: p.pitch.band.y0 + p.pitch.phasePx, px: p.pitch.pitchPx, auto: true };
  return null;
}

function readout(p) {
  const el = $("piece" + p.key), s = pxPerCm(p);
  el.querySelector(".rr").innerHTML = !p.rulerLine ? "Click the start and end of several black and white blocks."
    : p.rulerCm ? `<b>${fmt(s / p.down, 1)} px/cm</b> in the photo, from the ${p.rulerCm.cm} cm you gave.`
    : p.ruler ? `<b>${fmt(s / p.down, 1)} px/cm</b> in the photo, from ${p.ruler.blocks.length} blocks (${p.ruler.blocks.map(b => Math.round(b / p.down)).join(", ")} px).`
    : "No blocks found along the line: click again along the blocks, or give the distance in cm.";
  const sp = spacing(p);
  el.querySelector(".ls").innerHTML = !p.cut ? "Cut out first." : !s ? "Mark the ruler first." :
    (p.pitch ? `Automatic estimate: <b>${fmt(p.pitch.pitchPx / s)} cm/line</b>. Check that the blue lines on the photo fall on the lines of text; if they do not (old prints, worn surfaces), mark two lines and count the lines between them. ` : "") +
    (p.manual ? `Marked: <b>${fmt(sp.cm)} cm/line</b> (${p.manual.n} lines over ${fmt(p.manual.distPx / s)} cm).` : " Or mark two lines and give the number of lines between them.") +
    ` Size ${fmt(p.cut.width / s, 1)} × ${fmt(p.cut.height / s, 1)} cm.`;
}

function preview(p) {
  const cv = $("piece" + p.key).querySelector(".prev");
  if (!p.img) { cv.width = 10; cv.height = 10; return; }
  const W = Math.min(cv.parentElement.clientWidth - 4, 640), sc = W / p.w;
  cv.width = W * devicePixelRatio; cv.height = p.h * sc * devicePixelRatio;
  cv.style.width = W + "px"; cv.style.height = p.h * sc + "px";
  const x = cv.getContext("2d");
  x.setTransform(sc * devicePixelRatio, 0, 0, sc * devicePixelRatio, 0, 0);
  x.drawImage(p.img, 0, 0);
  const lw = 2 / sc;
  if (p.mask) {   // outline of the cut-out
    const { m, w, h, x0, y0 } = p.mask;
    x.fillStyle = "rgba(227, 73, 72, .9)";
    for (let y = 1; y < h - 1; y += 1) for (let i = 1; i < w - 1; i++) {
      const k = y * w + i;
      if (m[k] && (!m[k - 1] || !m[k + 1] || !m[k - w] || !m[k + w])) x.fillRect(x0 + i, y0 + y, lw, lw);
    }
  }
  if (p.box) { x.strokeStyle = "#eda100"; x.lineWidth = lw; x.setLineDash([6 / sc, 4 / sc]); x.strokeRect(p.box.x0, p.box.y0, p.box.x1 - p.box.x0, p.box.y1 - p.box.y0); x.setLineDash([]); }
  if (p.rulerLine) { x.strokeStyle = "#1baf7a"; x.lineWidth = 2 * lw; x.beginPath(); x.moveTo(p.rulerLine[0].x, p.rulerLine[0].y); x.lineTo(p.rulerLine[1].x, p.rulerLine[1].y); x.stroke(); }
  if (p.lines) { x.strokeStyle = "#2a78d6"; x.lineWidth = lw; for (const q of p.lines) { x.beginPath(); x.moveTo(0, q.y); x.lineTo(p.w, q.y); x.stroke(); } }
  const sp = spacing(p);
  if (sp && p.origin) {   // the line spacing in use, over the cut-out, to check by eye
    x.strokeStyle = sp.auto ? "rgba(42, 120, 214, .55)" : "rgba(42, 120, 214, .85)"; x.lineWidth = lw;
    for (let y = sp.y0; y < p.origin.y + p.cut.height; y += sp.px) {
      if (y < p.origin.y) continue;
      x.beginPath(); x.moveTo(p.origin.x, y); x.lineTo(p.origin.x + p.cut.width, y); x.stroke();
    }
  }
  x.fillStyle = "#2a78d6";
  for (const q of p.clicks) { x.beginPath(); x.arc(q.x, q.y, 5 / sc, 0, 7); x.fill(); }
}

// ---------- the workspace ----------
const ws = $("ws"), ctx = ws.getContext("2d");
let S = 40, sel = "A";   // display px per cm
const ready = p => p.cut && pxPerCm(p);

function fitScale() {
  const ps = Object.values(pieces).filter(ready);
  if (!ps.length) return;
  const wcm = ps.reduce((a, p) => a + p.cut.width / pxPerCm(p), 0), hcm = ps.reduce((a, p) => a + p.cut.height / pxPerCm(p), 0);
  S = Math.max(12, Math.min(80, Math.floor(Math.min((ws.width - 60) / (wcm + 4), (ws.height - 60) / (hcm + 4)))));
  $("wsScale").textContent = `${S} screen px per cm`;
}

// A piece's corners → workspace transform: position (cm) of the cut-out's top left before rotation,
// rotation about its centre.
function place(x, p, scale) {
  const s = scale / pxPerCm(p), W = p.cut.width * s, H = p.cut.height * s;
  x.translate(p.pos.x * scale + W / 2, p.pos.y * scale + H / 2);
  x.rotate((p.rot * Math.PI) / 180);
  x.translate(-W / 2, -H / 2);
  x.scale(s, s);
}

function draw(target = ctx, scale = S, opts = {}) {
  if (target === ctx) fitScale();
  const c = target.canvas;
  target.setTransform(1, 0, 0, 1, 0, 0);
  target.fillStyle = "#f3eee4"; target.fillRect(0, 0, c.width, c.height);
  if ($("showGrid").checked) {
    target.strokeStyle = "rgba(90, 80, 60, .12)"; target.lineWidth = 1;
    for (let x = 0; x < c.width; x += scale) { target.beginPath(); target.moveTo(x + .5, 0); target.lineTo(x + .5, c.height); target.stroke(); }
    for (let y = 0; y < c.height; y += scale) { target.beginPath(); target.moveTo(0, y + .5); target.lineTo(c.width, y + .5); target.stroke(); }
  }
  for (const p of [pieces.A, pieces.B]) {
    if (!ready(p)) continue;
    target.save();
    place(target, p, scale);
    target.globalAlpha = p.key === "B" ? +$("opB").value : 1;
    target.drawImage(p.cut, 0, 0);
    target.globalAlpha = 1;
    const sp = spacing(p);
    if ($("showLines").checked && sp) {
      const k = pxPerCm(p) / scale;
      target.strokeStyle = p.key === "A" ? "rgba(42, 120, 214, .75)" : "rgba(235, 104, 52, .8)";
      target.lineWidth = 1.5 * k;
      for (let y = sp.y0 - p.origin.y; y < p.cut.height; y += sp.px) {
        if (y < 0) continue;
        target.beginPath(); target.moveTo(-0.6 * scale * k, y); target.lineTo(0.15 * p.cut.width, y); target.stroke();
      }
    }
    target.restore();
    if (!opts.bare) {   // label
      target.font = `600 ${Math.max(12, scale * 0.32)}px system-ui, sans-serif`;
      target.fillStyle = p.key === sel && !opts.export ? "#8a4b1f" : "#3c382f";
      target.fillText(`${p.key}: ${p.name || "piece " + p.key}`, p.pos.x * scale, p.pos.y * scale - 6);
    }
  }
  if (!opts.bare) {   // scale bar
    target.fillStyle = "#3c382f";
    for (let i = 0; i < 2; i++) { target.fillStyle = i % 2 ? "#f3eee4" : "#3c382f"; target.fillRect(20 + i * scale, c.height - 24, scale, 8); }
    target.strokeStyle = "#3c382f"; target.strokeRect(20, c.height - 24, 2 * scale, 8);
    target.fillStyle = "#3c382f"; target.font = "13px system-ui, sans-serif"; target.fillText("2 cm", 26 + 2 * scale, c.height - 16);
  }
}

// The opaque pixels of one piece on a coarse grid (10 px per cm), for touching and edges.
function raster(p, R = 10) {
  const W = Math.ceil(ws.width / S * 1.5) * R / 10 * 10, H = Math.ceil(ws.height / S * 1.5) * R / 10 * 10;
  const c = new OffscreenCanvas(Math.max(10, W), Math.max(10, H)), x = c.getContext("2d");
  x.save(); place(x, p, R); x.drawImage(p.cut, 0, 0); x.restore();
  const d = x.getImageData(0, 0, c.width, c.height).data, m = new Uint8Array(c.width * c.height);
  for (let i = 0; i < m.length; i++) m[i] = d[4 * i + 3] > 128 ? 1 : 0;
  return { m, w: c.width, h: c.height, R };
}
const extent = r => J.bbox(r.m, r.w, r.h);
function overlap(a, b) { let n = 0; for (let i = 0; i < a.m.length; i++) if (a.m[i] && b.m[i]) n++; return n; }

function alignEdge(side) {
  if (!ready(pieces.A) || !ready(pieces.B)) return;
  const a = extent(raster(pieces.A)), b = extent(raster(pieces.B));
  pieces.B.pos.x += side === "right" ? (a.x1 - b.x1) / 10 : (a.x0 - b.x0) / 10;
  draw(); compare();
}
// Move B toward A (from below: up; from the right: left) until the cut-outs touch
// (overlap above 0.04 cm², as run_joinfit's touch_overlap at its scale).
function touch(dir) {
  const A = pieces.A, B = pieces.B;
  if (!ready(A) || !ready(B)) return;
  const ra = raster(A), ea = extent(ra), eb = extent(raster(B));
  if (dir === "below") B.pos.y += (ea.y1 - eb.y0) / 10 + 0.5;
  else B.pos.x += (ea.x1 - eb.x0) / 10 + 0.5;
  for (let k = 0; k < 600; k++) {
    if (overlap(ra, raster(B)) > 4) { if (dir === "below") B.pos.y += 0.05; else B.pos.x += 0.05; break; }
    if (dir === "below") B.pos.y -= 0.05; else B.pos.x -= 0.05;
  }
  draw(); compare();
}

function compare() {
  const ok = ready(pieces.A) && ready(pieces.B);
  $("tableMsg").textContent = ok ? "Both pieces at the same scale, each measured by its own ruler." : "Load, scale and cut out both pieces first.";
  const row = p => {
    const s = pxPerCm(p), sp = spacing(p);
    return `<div><h3>${p.key}: ${p.name || "–"}</h3><p class="small">${s ? `scale ${fmt(s / p.down, 1)} px/cm in the photo` : "no scale yet"}${p.cut && s ? `; ${fmt(p.cut.width / s, 1)} × ${fmt(p.cut.height / s, 1)} cm` : ""}<br>
      ${sp ? `line spacing <b>${fmt(sp.cm)} cm</b> (${sp.how})` : "line spacing not measured"}</p></div>`;
  };
  const a = spacing(pieces.A), b = spacing(pieces.B);
  $("compareOut").innerHTML = row(pieces.A) + row(pieces.B) +
    (a && b ? `<div><h3>Line spacing</h3><p class="small">Difference <b>${fmt(Math.abs(a.cm - b.cm))} cm</b> (${fmt((100 * Math.abs(a.cm - b.cm)) / ((a.cm + b.cm) / 2), 0)}%).
      ${a.auto || b.auto ? "At least one value is an automatic estimate: check it on the photo, or mark two lines. " : ""}Line spacing also varies within one tablet and between columns, so compare the difference with the spread you see on each piece.</p></div>` : "");
}

// ---------- interaction ----------
let dragging = null;
const wsAt = e => { const r = ws.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * ws.width / S, y: ((e.clientY - r.top) / r.height) * ws.height / S }; };
ws.onpointerdown = e => {
  const q = wsAt(e);
  for (const k of ["B", "A"]) {   // the piece under the pointer, B drawn on top
    const p = pieces[k];
    if (!ready(p)) continue;
    const r = raster(p), i = Math.floor(q.y * 10) * r.w + Math.floor(q.x * 10);
    if (r.m[i]) { sel = k; document.querySelector(`input[name=sel][value=${k}]`).checked = true; $("rot").value = p.rot; $("rotOut").value = p.rot + "°"; break; }
  }
  dragging = { q, pos: { ...pieces[sel].pos } };
  ws.setPointerCapture(e.pointerId); ws.focus(); draw();
};
ws.onpointermove = e => {
  if (!dragging) return;
  const q = wsAt(e), p = pieces[sel];
  p.pos.x = dragging.pos.x + q.x - dragging.q.x; p.pos.y = dragging.pos.y + q.y - dragging.q.y;
  draw();
};
ws.onpointerup = () => { dragging = null; };
ws.onkeydown = e => {
  const d = e.shiftKey ? 1 : 0.1, p = pieces[sel], k = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[e.key];
  if (!k) return;
  e.preventDefault(); p.pos.x += k[0]; p.pos.y += k[1]; draw();
};
for (const r of document.querySelectorAll("input[name=sel]")) r.onchange = () => { sel = r.value; $("rot").value = pieces[sel].rot; $("rotOut").value = pieces[sel].rot + "°"; draw(); };
$("rot").oninput = e => { pieces[sel].rot = +e.target.value; $("rotOut").value = e.target.value + "°"; draw(); };
$("alignR").onclick = () => alignEdge("right");
$("alignL").onclick = () => alignEdge("left");
$("touchBelow").onclick = () => touch("below");
$("touchRight").onclick = () => touch("right");
for (const id of ["showLines", "showGrid", "opB"]) $(id).oninput = () => draw();

// ---------- export ----------
function measurements() {
  const one = p => {
    const s = pxPerCm(p), sp = spacing(p);
    return { siglum: p.name, photo_file: p.file ?? null, photo_credit: p.credit,
      px_per_cm_in_photo: s ? +(s / p.down).toFixed(2) : null,
      scale_from: p.rulerCm ? `${p.rulerCm.cm} cm given` : p.ruler ? `${p.ruler.blocks.length} ruler blocks` : null,
      size_cm: p.cut && s ? [+(p.cut.width / s).toFixed(2), +(p.cut.height / s).toFixed(2)] : null,
      line_spacing_cm: sp ? +sp.cm.toFixed(3) : null, line_spacing_from: sp ? sp.how : null,
      line_spacing_auto_cm: p.pitch && s ? +(p.pitch.pitchPx / s).toFixed(3) : null,
      position_cm: [+p.pos.x.toFixed(2), +p.pos.y.toFixed(2)], rotation_deg: p.rot };
  };
  return { A: one(pieces.A), B: one(pieces.B),
    note: "A visual aid, not evidence of a join: photos show neither break surfaces nor thickness; edges may be breaks; the gap between the pieces is unknown." };
}
function exportPNG() {
  const R = 60, c = document.createElement("canvas");
  c.width = Math.round(ws.width / S * R); c.height = Math.round(ws.height / S * R) + 150;
  const x = c.getContext("2d");
  draw(x, R, { export: true });
  const m = measurements(), y = c.height - 140;
  x.fillStyle = "#fffdf8"; x.fillRect(0, y - 10, c.width, 150);
  x.fillStyle = "#3c382f"; x.font = "18px system-ui, sans-serif";
  const line = (k, v) => `${k}: ${v.siglum || "–"}, ${v.size_cm ? v.size_cm.join(" × ") + " cm" : ""}, line spacing ${v.line_spacing_cm ?? "–"} cm (${v.line_spacing_from ?? "–"})${v.photo_credit ? "; photo: " + v.photo_credit : ""}`;
  x.fillText(line("A", m.A), 20, y + 18); x.fillText(line("B", m.B), 20, y + 44);
  x.fillStyle = "#6c665a"; x.font = "15px system-ui, sans-serif";
  x.fillText("Each piece scaled by the ruler in its own photograph. A visual aid, not proof of a join: photos show neither the break surfaces nor the thickness.", 20, y + 76);
  x.fillText("Orphans & Archetypes, Check a join from photos (github.com/shaigordin/text-orphans)", 20, y + 100);
  draw();
  c.toBlob(b => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `join_check_${(m.A.siglum || "A").replace(/\W+/g, "_")}_${(m.B.siglum || "B").replace(/\W+/g, "_")}.png`; a.click(); });
}
X.menu($("export"), [
  ["Picture (PNG)", exportPNG],
  ["Measurements (JSON)", () => X.downloadJSON(measurements(), "join_check")],
]);

card(pieces.A); card(pieces.B);
new ResizeObserver(() => { preview(pieces.A); preview(pieces.B); }).observe($("pieceA"));
compare(); draw();

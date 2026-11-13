// Image measurements for the photo join check (join.html): a port of the steps of
// measuring-scribal-literacy/orphans/run_joinfit.py that run in the browser.
//   rulerScale   the ruler's alternating 1 cm blocks, read along a line the user draws (px per cm)
//   cutout       fragment and background apart: threshold, opening and closing, largest
//                component, holes filled (light backgrounds are flooded from the borders)
//   linePitch    line spacing: row profile of vertical gradient energy, strongest period
//                between 0.3 and 0.9 cm (as spectrum_pitch)
// All functions take plain arrays, so they run in Node for the tests as well.

// Grey values (0..255) of RGBA pixel data.
export function grey({ data, width, height }) {
  const g = new Float32Array(width * height);
  for (let i = 0; i < g.length; i++) g[i] = 0.299 * data[4 * i] + 0.587 * data[4 * i + 1] + 0.114 * data[4 * i + 2];
  return g;
}

const median = a => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; };
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))]; };

// px per cm from the ruler between points p0 and p1 (in image px), averaging `half` px on each
// side of the line. As ruler_px_per_cm: black/white changes, block lengths, the fine mm ticks
// dropped, median of the rest. The threshold is the middle of the strip's dark and light values.
export function rulerScale(g, width, height, p0, p1, half = 4) {
  const dx = p1.x - p0.x, dy = p1.y - p0.y, len = Math.hypot(dx, dy);
  if (len < 20) return null;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const prof = [];
  for (let t = 0; t <= len; t++) {
    let s = 0, n = 0;
    for (let k = -half; k <= half; k++) {
      const x = Math.round(p0.x + ux * t + nx * k), y = Math.round(p0.y + uy * t + ny * k);
      if (x >= 0 && y >= 0 && x < width && y < height) { s += g[y * width + x]; n++; }
    }
    prof.push(n ? s / n : 0);
  }
  const thr = (pct(prof, 0.1) + pct(prof, 0.9)) / 2;
  const b = prof.map(v => v > thr ? 1 : 0);
  const ch = [];
  for (let i = 1; i < b.length; i++) if (b[i] !== b[i - 1]) ch.push(i);
  const d = ch.slice(1).map((c, i) => c - ch[i]);
  if (d.length < 2) return null;
  const upper = d.filter(v => v > pct(d, 0.5));
  const ref = median(upper.length ? upper : d);
  const big = d.filter(v => v > 0.5 * ref);
  if (big.length < 2) return null;
  return { pxPerCm: median(big), blocks: big, threshold: thr };
}

// ---------- binary morphology on a w×h Uint8Array (cross-shaped 3×3, as scipy's default) ----------
function erode(m, w, h) {
  const o = new Uint8Array(m.length);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    o[i] = m[i] && m[i - 1] && m[i + 1] && m[i - w] && m[i + w] ? 1 : 0;
  }
  return o;
}
function dilate(m, w, h) {
  const o = new Uint8Array(m.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    o[i] = m[i] || (x > 0 && m[i - 1]) || (x < w - 1 && m[i + 1]) || (y > 0 && m[i - w]) || (y < h - 1 && m[i + w]) ? 1 : 0;
  }
  return o;
}
const times = (f, m, w, h, n) => { for (let k = 0; k < n; k++) m = f(m, w, h); return m; };
// scipy's binary_closing pads with background, so the border is not eroded away: pad first
function closing(m, w, h, n) {
  const W = w + 2 * n, H = h + 2 * n, p = new Uint8Array(W * H);
  for (let y = 0; y < h; y++) p.set(m.subarray(y * w, (y + 1) * w), (y + n) * W + n);
  const c = times(erode, times(dilate, p, W, H, n), W, H, n), o = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) o.set(c.subarray((y + n) * W + n, (y + n) * W + n + w), y * w);
  return o;
}
const opening = (m, w, h, n) => times(dilate, times(erode, m, w, h, n), w, h, n);

// Connected components (4-neighbour); returns labels and sizes (index 0 unused).
function label(m, w, h) {
  const lab = new Int32Array(m.length), sizes = [0], stack = new Int32Array(m.length);
  let next = 0;
  for (let i = 0; i < m.length; i++) {
    if (!m[i] || lab[i]) continue;
    next++; let top = 0, n = 0;
    stack[top++] = i; lab[i] = next;
    while (top) {
      const j = stack[--top]; n++;
      const x = j % w, y = (j - x) / w;
      for (const k of [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, y > 0 ? j - w : -1, y < h - 1 ? j + w : -1])
        if (k >= 0 && m[k] && !lab[k]) { lab[k] = next; stack[top++] = k; }
    }
    sizes.push(n);
  }
  return { lab, sizes };
}

// Fragment mask (1 = fragment). `dark`: dark background (photo on black), else light background
// flooded from the borders. `thr`: grey threshold (python: max channel for dark, mean for light).
// `open`, `close`: iterations, as run_joinfit.cutout (3 and 12 at its photo sizes).
export function cutout({ data, width: w, height: h }, { dark, thr, open = 3, close = 12 }) {
  let m = new Uint8Array(w * h);
  if (dark) for (let i = 0; i < m.length; i++) m[i] = Math.max(data[4 * i], data[4 * i + 1], data[4 * i + 2]) > thr ? 1 : 0;
  else {
    const bg = new Uint8Array(w * h);
    for (let i = 0; i < bg.length; i++) bg[i] = (data[4 * i] + data[4 * i + 1] + data[4 * i + 2]) / 3 > thr ? 1 : 0;
    const { lab } = label(bg, w, h), border = new Set();
    for (let x = 0; x < w; x++) { border.add(lab[x]); border.add(lab[(h - 1) * w + x]); }
    for (let y = 0; y < h; y++) { border.add(lab[y * w]); border.add(lab[y * w + w - 1]); }
    border.delete(0);
    for (let i = 0; i < m.length; i++) m[i] = border.has(lab[i]) ? 0 : 1;
  }
  m = closing(opening(m, w, h, open), w, h, close);
  const { lab, sizes } = label(m, w, h);
  let best = 0;
  for (let k = 1; k < sizes.length; k++) if (sizes[k] > (sizes[best] || 0)) best = k;
  if (!best) return m;
  for (let i = 0; i < m.length; i++) m[i] = lab[i] === best ? 1 : 0;
  // fill holes: background not reached from the border
  const inv = m.map(v => 1 - v), L = label(inv, w, h), outside = new Set();
  for (let x = 0; x < w; x++) { outside.add(L.lab[x]); outside.add(L.lab[(h - 1) * w + x]); }
  for (let y = 0; y < h; y++) { outside.add(L.lab[y * w]); outside.add(L.lab[y * w + w - 1]); }
  for (let i = 0; i < m.length; i++) if (!m[i] && !outside.has(L.lab[i])) m[i] = 1;
  return m;
}

// Bounding box of a mask.
export function bbox(m, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

function gauss1d(a, sigma) {
  if (sigma < 0.5) return Float32Array.from(a);
  const r = Math.ceil(3 * sigma), k = [];
  for (let i = -r; i <= r; i++) k.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
  const s = k.reduce((x, y) => x + y), o = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) {
    let v = 0;
    for (let j = -r; j <= r; j++) v += k[j + r] * a[Math.min(a.length - 1, Math.max(0, i + j))];
    o[i] = v / s;
  }
  return o;
}

// Line spacing in the band {x0,y0,x1,y1} of a grey image: as row_profile + spectrum_pitch.
// Returns { pitchPx, phasePx, strength } (strength: the peak over the mean amplitude in the
// 0.3–0.9 cm range; low values mean the lines are too irregular to measure, as on old prints).
export function linePitch(g, width, band, pxPerCm, lo = 0.3, hi = 0.9) {
  const { x0, y0, x1, y1 } = band, W = x1 - x0, H = y1 - y0;
  if (W < 5 || H < 2 * hi * pxPerCm) return null;
  // smooth (σ = 0.03 cm), vertical Sobel magnitude, mean per row
  const sig = Math.max(0.5, 0.03 * pxPerCm), rows = [];
  const sm = new Float32Array(W * H);
  for (let x = 0; x < W; x++) {
    const col = new Float32Array(H);
    for (let y = 0; y < H; y++) col[y] = g[(y0 + y) * width + x0 + x];
    const c = gauss1d(col, sig);
    for (let y = 0; y < H; y++) sm[y * W + x] = c[y];
  }
  for (let y = 0; y < H; y++) {
    const r = new Float32Array(W);
    for (let x = 0; x < W; x++) r[x] = sm[y * W + x];
    const rs = gauss1d(r, sig);
    for (let x = 0; x < W; x++) sm[y * W + x] = rs[x];
  }
  for (let y = 0; y < H; y++) {
    let s = 0;
    for (let x = 1; x < W - 1; x++) {
      const up = y > 0 ? y - 1 : 0, dn = y < H - 1 ? y + 1 : H - 1;
      const gy = (sm[dn * W + x - 1] + 2 * sm[dn * W + x] + sm[dn * W + x + 1]) - (sm[up * W + x - 1] + 2 * sm[up * W + x] + sm[up * W + x + 1]);
      s += Math.abs(gy);
    }
    rows.push(s / W);
  }
  const trend = gauss1d(rows, 1.2 * pxPerCm);
  const p = rows.map((v, i) => (v - trend[i]) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (rows.length - 1))));
  let best = { amp: -1 }, total = 0, count = 0;
  for (let P = lo * pxPerCm; P <= hi * pxPerCm; P += 0.25) {
    let c = 0, s = 0;
    for (let y = 0; y < p.length; y++) { c += p[y] * Math.cos((2 * Math.PI * y) / P); s += p[y] * Math.sin((2 * Math.PI * y) / P); }
    const amp = Math.hypot(c, s);
    total += amp; count++;
    if (amp > best.amp) best = { amp, P, ph: Math.atan2(s, c) };
  }
  return { pitchPx: best.P, phasePx: (((best.ph / (2 * Math.PI)) * best.P) % best.P + best.P) % best.P, strength: best.amp / (total / count) };
}

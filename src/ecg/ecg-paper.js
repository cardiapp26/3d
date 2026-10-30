/**
 * ECG paper for the chapter labs: a millimetre grid (1 mm and 5 mm lines), a calibration pulse,
 * and traces placed by paper speed (mm/s) and gain (mm/mV), so every setting reads like a real
 * printout. Shared plotting helpers for small charts sit here too.
 */
export const PAPER = Object.freeze({ bg: '#fff6f4', minor: 'rgba(232, 120, 120, .22)', major: 'rgba(214, 72, 72, .42)', ink: '#14181f', grey: 'rgba(30, 40, 52, .32)', label: '#7a2e2e' });

/** Size the canvas to its CSS box (device pixel ratio aware) and return a 2D context in CSS px. */
export function fitCanvas(canvas) {
  const w = canvas?.clientWidth, h = canvas?.clientHeight;
  if (!(w >= 2) || !(h >= 2)) return null;
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(w * dpr)) canvas.width = Math.round(w * dpr);
  if (canvas.height !== Math.round(h * dpr)) canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext?.('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/** Pink paper with 1 mm minor and 5 mm major lines at pxPerMm. */
export function drawPaper(ctx, w, h, pxPerMm) {
  ctx.fillStyle = PAPER.bg; ctx.fillRect(0, 0, w, h);
  const lines = (step, color, width) => {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
    for (let x = 0; x <= w; x += step) { ctx.moveTo(Math.round(x) + .5, 0); ctx.lineTo(Math.round(x) + .5, h); }
    for (let y = 0; y <= h; y += step) { ctx.moveTo(0, Math.round(y) + .5); ctx.lineTo(w, Math.round(y) + .5); }
    ctx.stroke();
  };
  if (pxPerMm >= 2.2) lines(pxPerMm, PAPER.minor, 1);
  lines(pxPerMm * 5, PAPER.major, 1);
}

/** A 1 mV calibration pulse 200 ms wide (5 mm at 25 mm/s), standing on the baseline at x. */
export function drawCalibration(ctx, x, baseline, { pxPerMm, speed, gain }) {
  const width = .2 * speed * pxPerMm, height = gain * pxPerMm;
  ctx.strokeStyle = PAPER.ink; ctx.lineWidth = 1.4; ctx.beginPath();
  ctx.moveTo(x, baseline); ctx.lineTo(x + 3, baseline); ctx.lineTo(x + 3, baseline - height); ctx.lineTo(x + 3 + width, baseline - height);
  ctx.lineTo(x + 3 + width, baseline); ctx.lineTo(x + 6 + width, baseline); ctx.stroke();
  return x + 8 + width;
}

/**
 * Draw samples (1 kHz, mV) from fromMs for durMs, starting at x, around a baseline y.
 * @param {{ pxPerMm: number, speed: number, gain: number, color?: string, width?: number, offset?: number }} opts
 */
export function drawTrace(ctx, data, fromMs, durMs, x, y, { pxPerMm, speed, gain, color = PAPER.ink, width = 1.3, offset = 0 }) {
  const pxPerMs = (speed * pxPerMm) / 1000, pxPerMv = gain * pxPerMm;
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.beginPath();
  // One column per pixel: draw each column's lowest and highest sample, so 1 ms pacing spikes survive.
  const step = Math.max(1, Math.floor(1 / pxPerMs));
  const yOf = v => y - (v - offset) * pxPerMv;
  for (let ms = 0; ms <= durMs; ms += step) {
    let lo = Infinity, hi = -Infinity, first = null, last = 0;
    for (let k = 0; k < step && ms + k <= durMs; k++) { const v = data[Math.round(fromMs + ms + k)] ?? 0; if (first == null) first = v; last = v; if (v < lo) lo = v; if (v > hi) hi = v; }
    const px = x + ms * pxPerMs;
    if (ms === 0) ctx.moveTo(px, yOf(first));
    if (step > 1) { ctx.lineTo(px, yOf(hi)); ctx.lineTo(px, yOf(lo)); ctx.lineTo(px, yOf(last)); } else ctx.lineTo(px, yOf(first));
  }
  ctx.stroke();
}

export function label(ctx, text, x, y, { color = PAPER.label, font = '600 11px ui-monospace, monospace', align = 'left' } = {}) {
  ctx.fillStyle = color; ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, x, y); ctx.textAlign = 'left';
}

/** A small line chart frame: axes, ticks and a mapper from data to pixels. */
export function chartFrame(ctx, w, h, { x: [x0, x1], y: [y0, y1], pad = { l: 46, r: 12, t: 14, b: 28 }, xTicks = [], yTicks = [], xLabel = '', yLabel = '', dark = true }) {
  const fg = dark ? '#9fb2c8' : '#5a6474', grid = dark ? 'rgba(148, 163, 184, .14)' : 'rgba(90, 100, 116, .18)';
  ctx.fillStyle = dark ? '#0b1220' : '#ffffff'; ctx.fillRect(0, 0, w, h);
  const L = pad.l, R = w - pad.r, T = pad.t, B = h - pad.b;
  const px = v => L + ((v - x0) / (x1 - x0)) * (R - L), py = v => B - ((v - y0) / (y1 - y0)) * (B - T);
  ctx.font = '10px ui-monospace, monospace'; ctx.fillStyle = fg; ctx.strokeStyle = grid; ctx.lineWidth = 1;
  for (const t of xTicks) { ctx.beginPath(); ctx.moveTo(px(t), T); ctx.lineTo(px(t), B); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(String(t), px(t), B + 13); }
  for (const t of yTicks) { ctx.beginPath(); ctx.moveTo(L, py(t)); ctx.lineTo(R, py(t)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(String(t), L - 5, py(t) + 3); }
  ctx.textAlign = 'center'; ctx.fillText(xLabel, (L + R) / 2, h - 3);
  ctx.save(); ctx.translate(11, (T + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yLabel, 0, 0); ctx.restore();
  ctx.textAlign = 'left';
  return { px, py, L, R, T, B };
}

export function polyline(ctx, pts, color, width = 1.6, dash = []) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke(); ctx.setLineDash([]);
}

/** Small DOM helpers shared by the labs. */
export function el(tag, cls = '', attrs = {}) {
  const n = document.createElement(tag); if (cls) n.className = cls;
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
}
/** A segmented control: options [{ id, label }]; returns the group node. */
export function segmented(name, options, current, onPick) {
  const g = el('div', 'ecgc-seg', { role: 'group', 'aria-label': name });
  for (const o of options) {
    const b = el('button', '', { type: 'button', 'aria-pressed': String(o.id === current), [`data-${name}`]: o.id });
    b.textContent = o.label; b.addEventListener('click', () => onPick(o.id)); g.append(b);
  }
  return g;
}

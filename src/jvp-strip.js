import { CM_H2O_PER_MMHG } from './jvp-timeline.js';

/*
 * Canvas drawing of a jugular venous pulse time strip (jvp-timeline.js):
 * the pressure on the fixed mmHg axis, tricuspid-open bands, maneuver or
 * ventilator shading, atrial event labels, the ECG and, when the strip has
 * one, its extra channel (abdominal or airway pressure), with one cursor at
 * strip time t. Samples are taken once per strip and reused every frame.
 */
const SAMPLES = 900;
const BAND_MAX_SECONDS = 12;   // longer strips (maneuver, ventilator) skip the per-beat valve bands
const COLOR = { curve: '#b83b5e', grid: '#e6ece6', axis: '#8a988e', ecg: '#2f6f5e', band: 'rgba(84,160,200,0.13)', maneuver: 'rgba(212,160,23,0.16)', extra: '#8a5a1f', cursor: '#d4a017', label: '#3a2530', threshold: '#a0522d', level: '#6d1f3a' };
const cache = new WeakMap();

function samples(strip) {
  if (cache.has(strip)) return cache.get(strip);
  const t = [], pressure = [], ecg = [], open = [], extra = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const x = (i / SAMPLES) * strip.duration;
    t.push(x); pressure.push(strip.pressure(x)); ecg.push(strip.ecg(x)); open.push(strip.tricuspidOpenAt(x));
    extra.push(strip.extra ? strip.extra.value(x) : 0);
  }
  // Beat-averaged level (one RR window) for the maneuver and ventilator strips: the quantity they are read by.
  const level = strip.rr ? t.map((_, i) => {
    const from = Math.max(0, i - Math.round((strip.rr / strip.duration) * SAMPLES));
    let sum = 0;
    for (let k = from; k <= i; k++) sum += pressure[k];
    return i - from > 5 ? sum / (i - from + 1) : null;
  }) : null;
  const s = { t, pressure, ecg, open, extra, level };
  cache.set(strip, s);
  return s;
}

/** Sampled rows for the CSV export: t, pressure, ECG and the extra channel. */
export function stripRows(strip) {
  const s = samples(strip);
  return s.t.map((t, i) => (strip.extra ? [t, s.pressure[i], s.ecg[i], s.extra[i]] : [t, s.pressure[i], s.ecg[i]]));
}

// Contiguous runs of a boolean series as [from, to] sample indices.
function runs(flags) {
  const out = [];
  let from = -1;
  flags.forEach((on, i) => {
    if (on && from < 0) from = i;
    if ((!on || i === flags.length - 1) && from >= 0) { out.push([from, on ? i : i - 1]); from = -1; }
  });
  return out;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ width: number, height: number, axisMax: number }} box
 * @param {object} strip from jvp-timeline.js
 * @param {{ t: number, labels: boolean, text: object }} view text: tvOpen, ecg, seconds, and the mode's band/extra/threshold labels
 */
export function drawStrip(ctx, box, strip, view) {
  const { width, height, axisMax } = box, text = view.text;
  const left = 34, right = width - 8, top = 16;
  const plotBottom = Math.round(height * (strip.extra ? 0.58 : 0.66));
  const extraTop = plotBottom + 16, extraBottom = strip.extra ? extraTop + Math.round(height * 0.1) : extraTop;
  const ecgTop = strip.extra ? extraBottom + 14 : plotBottom + 18, bottom = height - 14;
  const x = t => left + (t / strip.duration) * (right - left);
  const y = p => plotBottom - (Math.max(-2, Math.min(axisMax, p)) / axisMax) * (plotBottom - top);
  const s = samples(strip);
  const ix = i => left + (i / SAMPLES) * (right - left);

  // Tricuspid-open bands and the maneuver / inspiration shading.
  ctx.fillStyle = COLOR.band;
  if (strip.duration <= BAND_MAX_SECONDS) for (const [a, b] of runs(s.open)) ctx.fillRect(ix(a), top, ix(b) - ix(a), bottom - top);
  const shaded = strip.id === 'ajr' ? s.extra.map(v => v > 0) : strip.id === 'ppv' ? s.t.map(t => strip.breathAt(t) === 'insp') : null;
  if (shaded) {
    ctx.fillStyle = COLOR.maneuver;
    for (const [a, b] of runs(shaded)) ctx.fillRect(ix(a), top, ix(b) - ix(a), plotBottom - top);
  }
  ctx.font = '9px system-ui, sans-serif'; ctx.fillStyle = '#4f86a3'; ctx.textAlign = 'left';
  if (strip.duration <= BAND_MAX_SECONDS) ctx.fillText(text.tvOpen, left + 3, top + 9);
  if (text.band) { ctx.fillStyle = COLOR.extra; ctx.textAlign = 'right'; ctx.fillText(text.band, right - 2, top + 9); ctx.textAlign = 'left'; }

  // Fixed mmHg grid.
  ctx.strokeStyle = COLOR.grid; ctx.fillStyle = COLOR.axis; ctx.lineWidth = 1; ctx.textAlign = 'right';
  for (let p = 0; p <= axisMax; p += 10) { const yy = y(p); ctx.beginPath(); ctx.moveTo(left, yy); ctx.lineTo(right, yy); ctx.stroke(); ctx.fillText(String(p), left - 4, yy + 3); }
  ctx.textAlign = 'left';
  ctx.fillText('mmHg', 2, top - 4);

  // Abdominojugular test: baseline and the protocol threshold (cm converted to mmHg).
  if (strip.id === 'ajr' && view.baseline != null) {
    const threshold = view.baseline + strip.protocol.thresholdCm / CM_H2O_PER_MMHG;
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    for (const [p, color] of [[view.baseline, COLOR.axis], [threshold, COLOR.threshold]]) { ctx.strokeStyle = color; ctx.beginPath(); ctx.moveTo(left, y(p)); ctx.lineTo(right, y(p)); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.fillStyle = COLOR.threshold; ctx.textAlign = 'right'; ctx.fillText(text.threshold, right - 2, y(threshold) - 3); ctx.textAlign = 'left';
  }

  // Pressure; on long strips thinner, with the beat-averaged level drawn over it.
  ctx.strokeStyle = COLOR.curve; ctx.lineWidth = s.level ? 1 : 1.8; ctx.globalAlpha = s.level ? 0.55 : 1; ctx.beginPath();
  s.pressure.forEach((p, i) => (i ? ctx.lineTo(ix(i), y(p)) : ctx.moveTo(ix(i), y(p))));
  ctx.stroke(); ctx.globalAlpha = 1;
  if (s.level) {
    ctx.strokeStyle = COLOR.level; ctx.lineWidth = 2.2; ctx.beginPath();
    let started = false;
    s.level.forEach((p, i) => { if (p == null) return; if (started) ctx.lineTo(ix(i), y(p)); else { ctx.moveTo(ix(i), y(p)); started = true; } });
    ctx.stroke();
  }

  // Atrial events (AV dissociation): ordinary a or cannon a.
  if (view.labels && strip.atrial.length) {
    ctx.font = 'bold 9px system-ui, sans-serif'; ctx.textAlign = 'center';
    for (const e of strip.atrial) {
      ctx.fillStyle = e.kind === 'cannon' ? COLOR.curve : COLOR.label;
      const lx = Math.max(left + 16, Math.min(right - 16, x(e.t)));
      ctx.fillText(e.kind === 'cannon' ? text.cannon : 'a', lx, y(strip.pressure(e.t)) - 5);
    }
    ctx.textAlign = 'left';
  }

  // Extra channel: abdominal compression or airway pressure.
  if (strip.extra) {
    const ey = v => extraBottom - (Math.max(0, v) / strip.extra.max) * (extraBottom - extraTop);
    ctx.strokeStyle = COLOR.extra; ctx.lineWidth = 1.3; ctx.beginPath();
    s.extra.forEach((v, i) => (i ? ctx.lineTo(ix(i), ey(v)) : ctx.moveTo(ix(i), ey(v))));
    ctx.stroke();
    ctx.font = '9px system-ui, sans-serif'; ctx.fillStyle = COLOR.extra;
    ctx.fillText(text.extra, left + 2, extraTop - 3);
  }

  // ECG with atrial P waves or fibrillatory waves from the same timeline.
  const mid = (ecgTop + bottom) / 2, amp = (bottom - ecgTop) * 0.45;
  ctx.strokeStyle = COLOR.ecg; ctx.lineWidth = 1.1; ctx.beginPath();
  s.ecg.forEach((v, i) => (i ? ctx.lineTo(ix(i), mid - v * amp) : ctx.moveTo(ix(i), mid - v * amp)));
  ctx.stroke();
  ctx.font = '9px system-ui, sans-serif'; ctx.fillStyle = COLOR.axis;
  ctx.fillText(text.ecg, left + 2, ecgTop - 4);

  // Seconds along the bottom.
  const step = strip.duration > 14 ? 5 : 1;
  ctx.textAlign = 'center';
  for (let t = 0; t < strip.duration - step * 0.4; t += step) ctx.fillText(`${t}`, x(t), bottom + 10);
  ctx.textAlign = 'right'; ctx.fillText(text.seconds, right, bottom + 10); ctx.textAlign = 'left';

  // Cursor at strip time t.
  const cx = x(((view.t % strip.duration) + strip.duration) % strip.duration);
  ctx.strokeStyle = COLOR.cursor; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, bottom); ctx.stroke();
}

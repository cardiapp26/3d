import { EP_CHANNELS } from './ep-cases.js';

/*
 * Atrial activation sequence map of one beat (report section 15, focal AT:
 * "atriyal aktivasyon haritası"). Local atrial activation time of every
 * intracardiac channel relative to the earliest one, drawn as bars in
 * recorder order. A schematic channel map from the synthetic events, not an
 * electroanatomical map.
 */

const ATRIAL_CHANNELS = EP_CHANNELS.filter((ch) => !ch.surface && !ch.unipolar && ch.id !== 'rv').map((ch) => ch.id);

/**
 * Local A times of the given beat (occurrence index on each channel).
 * @returns {{ ch: string, label: string, t: number, rel: number }[]} sorted by recorder order; rel is ms after the earliest
 */
export function activationSequence(recording, occ = 1) {
  const rows = [];
  for (const ch of ATRIAL_CHANNELS) {
    const list = (recording.events[ch] || []).filter((e) => e.type === 'A');
    const e = list[occ] || null;
    if (e) rows.push({ ch, label: EP_CHANNELS.find((c) => c.id === ch).label, t: e.t });
  }
  if (!rows.length) return [];
  const earliest = Math.min(...rows.map((r) => r.t));
  return rows.map((r) => ({ ...r, rel: Math.round(r.t - earliest) }));
}

/** The earliest channel(s) of a sequence. */
export function earliestChannels(sequence) {
  return sequence.filter((r) => r.rel === 0).map((r) => r.ch);
}

/**
 * Draw the sequence as horizontal bars (short bar = early).
 * @param {HTMLCanvasElement} canvas
 * @param {{ ch: string, label: string, rel: number }[]} sequence
 * @param {{ lang?: string }} [options]
 */
export function drawActivationMap(canvas, sequence, { lang = 'tr' } = {}) {
  const width = canvas?.clientWidth, height = canvas?.clientHeight;
  if (!sequence.length || !(width >= 2) || !(height >= 2)) return;
  const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  if (!ctx) return;
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0e1815';
  ctx.fillRect(0, 0, width, height);
  const left = 64, right = width - 44, top = 18, rowH = (height - top - 6) / sequence.length;
  const max = Math.max(10, ...sequence.map((r) => r.rel));
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillStyle = '#9fc7b6';
  ctx.fillText(lang === 'en' ? 'Local A after the earliest (ms)' : 'En erkene göre lokal A (ms)', left, 12);
  sequence.forEach((r, i) => {
    const y = top + i * rowH;
    const w = Math.max(2, (r.rel / max) * (right - left));
    // Early (red) to late (blue), the usual isochronal colours.
    const hue = 0 + (r.rel / max) * 230;
    ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
    ctx.fillRect(left, y + rowH * 0.2, w, rowH * 0.6);
    ctx.fillStyle = '#d7f5e4';
    ctx.textBaseline = 'middle';
    ctx.fillText(r.label, 6, y + rowH / 2);
    ctx.fillText(String(r.rel), left + w + 4, y + rowH / 2);
    ctx.textBaseline = 'alphabetic';
  });
}

// Synthetic intracardiac electrogram renderer for the electrophysiological
// anatomy module. It draws a recording from ep-cases.js: a teaching schematic
// built from Gaussian-derivative spikes, never a clinical recording and never
// a decision rule. Calipers are measured from the events at draw time.

import { EP_CHANNELS, measure, resolveRef } from './ep-cases.js';

// Colours match the 3D catheters: His magenta, CS blue, ABL purple; surface leads green.
const COLORS = {
  'ecg-ii': '#8fdc9f', 'ecg-v1': '#6fc48b', hra: '#c9d6cf', 'his-p': '#f0abfc', 'his-d': '#e879f9',
  'cs-910': '#7fb2ff', 'cs-78': '#74a6f2', 'cs-56': '#699ae6', 'cs-34': '#6090dd', 'cs-12': '#5b8cff',
  rv: '#ffd28a', 'abl-d': '#b99bff', 'abl-uni': '#d8c7ff',
  rb: '#fca5a5', 'lv-sep-b': '#fcd34d', 'lv-sep-a': '#fbbf24', pv: '#c084fc',
  'halo-910': '#86efac', 'halo-78': '#6ee7a0', 'halo-56': '#4ade80', 'halo-34': '#34d17a', 'halo-12': '#22c55e'
};

/**
 * Channels a recording can show: its default list plus any channel that
 * carries events, in recorder order (the channel chooser offers all of them).
 */
export function selectableChannels(recording) {
  if (!recording) return [];
  const withEvents = new Set([...recording.channels, ...Object.keys(recording.events)]);
  return EP_CHANNELS.map((ch) => ch.id).filter((id) => withEvents.has(id));
}

/**
 * Visible time window for a zoom factor and a pan fraction (0 = start,
 * 1 = end): the zoom keeps the time scale uniform across channels.
 */
export function timeWindow(recording, zoom = 1, pan = 0) {
  const span = recording.windowMs / Math.max(1, zoom);
  const from = Math.max(0, Math.min(recording.windowMs - span, pan * (recording.windowMs - span)));
  return { from, to: from + span };
}

const CHANNEL_BY_ID = new Map(EP_CHANNELS.map((ch) => [ch.id, ch]));
const LABEL_W = 58;
const HEADER_H = 18;
const FOOTER_H = 16;
const FONT = '10px ui-monospace, monospace';

// Derivative-of-Gaussian spike, normalised so the peak equals amp; mono events
// (P wave, delta) are plain Gaussian bumps.
function spike(t, e) {
  const x = (t - e.t) / e.sigma;
  if (Math.abs(x) > 6) return 0;
  if (e.mono) return e.amp * Math.exp(-0.5 * x * x);
  return -e.amp * x * Math.exp(0.5 - 0.5 * x * x);
}

// Deterministic baseline: sums of sines, seeded by channel index.
function baseline(t, seed, rf) {
  let n = 0.012 * Math.sin(t * 0.169 + seed * 1.7)
    + 0.007 * Math.sin(t * 0.531 + seed * 0.9)
    + 0.01 * Math.sin(t * 0.0123 + seed);
  if (rf) n += 0.03 * Math.sin(t * 2.03 + seed) * Math.sin(t * 0.047);
  return n;
}

/**
 * Synthetic value of one channel at tMs within the recording window.
 * @returns {number} finite, roughly -1..1; 0 for unknown channels
 */
export function egmSample(recording, channelId, tMs) {
  const list = recording?.events?.[channelId];
  const t = Number(tMs);
  const index = EP_CHANNELS.findIndex((ch) => ch.id === channelId);
  if (index < 0 || !Number.isFinite(t)) return 0;
  // RF artifact rides only on the ablation channel.
  const rf = Boolean(recording.rf) && channelId === 'abl-d';
  let value = baseline(t, index, rf);
  for (const e of list || []) value += spike(t, e);
  return value;
}

const pick = (obj, lang) => (obj && typeof obj === 'object' ? (lang === 'en' ? obj.en : obj.tr) : obj);

function tag(ctx, text, x, y, color) {
  const w = ctx.measureText(text)?.width || text.length * 6;
  ctx.fillStyle = 'rgba(14, 24, 21, 0.85)';
  ctx.fillRect(x - 2, y - 9, w + 4, 11);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function polyline(ctx, points, color, lineWidth = 1, dash = []) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dash);
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();
  ctx.setLineDash([]);
}

function bracket(ctx, x0, x1, y, label, color) {
  const [a, b] = x0 <= x1 ? [x0, x1] : [x1, x0];
  polyline(ctx, [[a, y - 4], [a, y], [b, y], [b, y - 4]], color);
  const w = ctx.measureText(label)?.width || label.length * 6;
  tag(ctx, label, Math.max(LABEL_W, (a + b - w) / 2), y + 11, color);
}

function drawCalipers(ctx, recording, geo, rows) {
  const inside = (t) => t >= geo.from - 1 && t <= geo.to + 1;
  ctx.font = '9px ui-monospace, monospace';
  const used = new Map();   // stagger calipers sharing a row so labels never overlap
  for (const caliper of recording.calipers) {
    const a = resolveRef(recording, caliper.a);
    const b = resolveRef(recording, caliper.b);
    const rowIndex = rows.get(caliper.row);
    if (!a || !b || rowIndex === undefined || !inside(a.t) || !inside(b.t)) continue;
    const level = used.get(rowIndex) || 0;
    used.set(rowIndex, level + 1);
    const y = geo.rowTop(rowIndex) + geo.rowH - 6 - level * 15;
    bracket(ctx, geo.x(a.t), geo.x(b.t), y, `${caliper.label} ${measure(recording, caliper)}`, '#ffeca8');
  }
}

function drawMarkers(ctx, recording, geo, lang, height) {
  ctx.font = '9px ui-monospace, monospace';
  for (const marker of recording.markers) {
    if (marker.t < geo.from || marker.t > geo.to) continue;
    const x = geo.x(marker.t);
    polyline(ctx, [[x, HEADER_H], [x, height - FOOTER_H]], 'rgba(255, 178, 120, 0.55)', 1, [4, 4]);
    const label = pick(marker.label, lang);
    const w = ctx.measureText(label)?.width || label.length * 6;
    tag(ctx, label, Math.max(LABEL_W, Math.min(x + 3, geo.x(geo.to) - w - 4)), HEADER_H + 10, '#ffb278');
  }
}

function drawFrame(ctx, width, height, recording, lang, geo, channels, title) {
  ctx.fillStyle = '#0e1815';
  ctx.fillRect(0, 0, width, height);
  // Faint grid: one vertical line every 100 ms.
  ctx.strokeStyle = 'rgba(120, 170, 150, 0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let t = Math.ceil(geo.from / 100) * 100; t <= geo.to; t += 100) {
    const x = Math.round(geo.x(t)) + 0.5;
    ctx.moveTo(x, HEADER_H);
    ctx.lineTo(x, height - FOOTER_H);
  }
  ctx.stroke();
  ctx.font = FONT;
  ctx.textBaseline = 'middle';
  channels.forEach((ch, i) => {
    ctx.fillStyle = COLORS[ch.id] || '#c9d6cf';
    ctx.fillText(ch.label, 6, geo.rowTop(i) + geo.rowH / 2);
  });
  ctx.textBaseline = 'alphabetic';
  if (width >= 520 && title) {
    ctx.fillStyle = '#9fc7b6';
    ctx.fillText(title, LABEL_W, 13);
  }
  ctx.font = 'bold 13px ui-monospace, monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255, 214, 120, 0.6)';
  ctx.fillText(lang === 'en' ? 'SYNTHETIC · not a clinical recording' : 'SENTETİK · klinik kayıt değil', width - 6, 14);
  ctx.textAlign = 'left';
  // Scale bar: 100 ms, bottom left.
  const y = height - 5;
  polyline(ctx, [[geo.x(geo.from), y], [geo.x(geo.from + 100), y]], '#d7f5e4', 1.5);
  ctx.font = FONT;
  ctx.fillStyle = '#d7f5e4';
  ctx.fillText('100 ms', geo.x(geo.from + 100) + 6, y + 3);
  if (geo.to - geo.from < recording.windowMs - 1) {
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(geo.from)}–${Math.round(geo.to)} ms`, width - 6, y + 3);
    ctx.textAlign = 'left';
  }
}

/**
 * Draw a synthetic recording on a canvas (DPR aware, dark recorder look).
 * @param {HTMLCanvasElement} canvas
 * @param {object} recording from ep-cases.js (epRecording(id)) or ep-maneuver-sim.js
 * @param {{ lang?: string, cursor?: number|null, cursorMs?: number|null, title?: string,
 *   channels?: string[], zoom?: number, pan?: number }} [options]
 *   cursor: 0..1 fraction of the window; cursorMs: inspection time in ms;
 *   channels: the rows to draw (default: the recording's list); zoom/pan: time window
 * @returns {{ from: number, to: number, plotLeft: number, plotW: number }|undefined} the drawn time window
 */
export function drawEgm(canvas, recording, { lang = 'tr', cursor = null, cursorMs = null, title = '', channels: only = null, zoom = 1, pan = 0 } = {}) {
  const width = canvas?.clientWidth;
  const height = canvas?.clientHeight;
  if (!recording || !(width >= 2) || !(height >= 2)) return;
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.floor(width * dpr)) canvas.width = Math.floor(width * dpr);
  if (canvas.height !== Math.floor(height * dpr)) canvas.height = Math.floor(height * dpr);
  const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  if (!ctx) return;
  const channels = (only || recording.channels).map((id) => CHANNEL_BY_ID.get(id)).filter(Boolean);
  if (!channels.length) return;
  const rows = new Map(channels.map((ch, i) => [ch.id, i]));
  const plotW = Math.max(1, width - LABEL_W - 6);
  const rowH = (height - HEADER_H - FOOTER_H) / channels.length;
  const { from, to } = timeWindow(recording, zoom, pan);
  const geo = { rowH, from, to, rowTop: (i) => HEADER_H + i * rowH, x: (t) => LABEL_W + ((t - from) / (to - from)) * plotW };
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  drawFrame(ctx, width, height, recording, lang, geo, channels, title);
  drawMarkers(ctx, recording, geo, lang, height);

  const gain = rowH * 0.42;
  const steps = Math.max(120, Math.floor(plotW));
  ctx.lineWidth = 1.3;
  ctx.lineJoin = 'round';
  channels.forEach((ch, i) => {
    const mid = geo.rowTop(i) + rowH / 2;
    ctx.strokeStyle = COLORS[ch.id] || '#c9d6cf';
    ctx.beginPath();
    for (let s = 0; s <= steps; s++) {
      const t = from + (s / steps) * (to - from);
      const y = mid - egmSample(recording, ch.id, t) * gain;
      if (s === 0) ctx.moveTo(geo.x(t), y);
      else ctx.lineTo(geo.x(t), y);
    }
    ctx.stroke();
  });
  drawCalipers(ctx, recording, geo, rows);

  const cursorAt = Number.isFinite(cursorMs) ? cursorMs
    : typeof cursor === 'number' && Number.isFinite(cursor) ? Math.min(1, Math.max(0, cursor)) * recording.windowMs : null;
  if (cursorAt != null && cursorAt >= from && cursorAt <= to) {
    const x = geo.x(cursorAt);
    polyline(ctx, [[x, HEADER_H], [x, height - FOOTER_H]], 'rgba(255, 236, 168, 0.85)', 1.2);
  }
  return { from, to, plotLeft: LABEL_W, plotW };
}

/** Time (ms) under a canvas x coordinate for the drawn window, or null outside the plot. */
export function timeAtX(x, drawn) {
  if (!drawn || x < drawn.plotLeft || x > drawn.plotLeft + drawn.plotW) return null;
  return drawn.from + ((x - drawn.plotLeft) / drawn.plotW) * (drawn.to - drawn.from);
}

/** Events within `radius` ms of t on each channel (the inspection readout). */
export function eventsNear(recording, t, channels, radius = 25) {
  const out = [];
  for (const ch of channels) {
    for (const e of recording.events[ch] || []) if (Math.abs(e.t - t) <= radius) out.push({ ch, type: e.type, t: e.t });
  }
  return out.sort((a, b) => a.t - b.t);
}

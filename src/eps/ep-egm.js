// Synthetic intracardiac electrogram renderer for the electrophysiological
// anatomy module. It draws a recording from ep-cases.js: a teaching schematic
// built from Gaussian-derivative spikes, never a clinical recording and never
// a decision rule. Calipers are measured from the events at draw time.

import { EP_CHANNELS, measure, resolveRef } from './ep-cases.js';

// Channel colours: His magenta, CS blue, ABL purple; surface leads green.
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
  // t0: absolute time of the window start (live monitor), so the baseline noise stays put while the strip sweeps.
  let value = baseline(t + (recording.t0 || 0), index, rf);
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

function bracket(ctx, x0, x1, y, label, color, beside = false) {
  const [a, b] = x0 <= x1 ? [x0, x1] : [x1, x0];
  polyline(ctx, [[a, y - 4], [a, y], [b, y], [b, y - 4]], color);
  const w = ctx.measureText(label)?.width || label.length * 6;
  // A stacked caliper's label goes beside its bracket, off the lower one's ends.
  if (beside) tag(ctx, label, b + 5, y + 3, color);
  else tag(ctx, label, Math.max(LABEL_W, (a + b - w) / 2), y + 11, color);
}

function drawCalipers(ctx, recording, geo, rows) {
  const inside = (t) => t >= geo.from - 1 && t <= geo.to + 1;
  ctx.font = '9px ui-monospace, monospace';
  const used = new Map();   // stagger calipers sharing a row so labels never overlap
  const ends = [];
  for (const caliper of recording.calipers) {
    const a = resolveRef(recording, caliper.a);
    const b = resolveRef(recording, caliper.b);
    const rowIndex = rows.get(caliper.row);
    if (!a || !b || rowIndex === undefined || !inside(a.t) || !inside(b.t)) continue;
    const level = used.get(rowIndex) || 0;
    used.set(rowIndex, level + 1);
    const y = geo.rowTop(rowIndex) + geo.rowH - 6 - level * 15;
    bracket(ctx, geo.x(a.t), geo.x(b.t), y, `${caliper.label} ${measure(recording, caliper)}`, '#ffeca8', level > 0);
    ends.push(...[a.t, b.t].map((t) => ({ x: geo.x(t), rowIndex, y })));
  }
  // Both measured events marked on the trace (deflection center) with a guide
  // down to the bracket, drawn last so no label hides an end.
  for (const { x, rowIndex, y } of ends) {
    const top = geo.rowTop(rowIndex);
    polyline(ctx, [[x, top + 2], [x, y]], 'rgba(255, 236, 168, 0.45)', 1, [2, 2]);
    ctx.fillStyle = '#ffeca8';
    ctx.beginPath(); ctx.arc(x, top + geo.rowH / 2, 2, 0, Math.PI * 2); ctx.fill();
  }
}

// User calipers: full-height vertical lines; the interval sits between them at the top.
function drawUserCaliper(ctx, geo, { a, b }, height) {
  const color = '#7fe3ff';
  const inside = (t) => t != null && t >= geo.from && t <= geo.to;
  for (const t of [a, b]) {
    if (inside(t)) polyline(ctx, [[geo.x(t), HEADER_H], [geo.x(t), height - FOOTER_H]], color, 1.2);
  }
  if (a == null || b == null) return;
  const x0 = geo.x(Math.max(geo.from, Math.min(a, b))), x1 = geo.x(Math.min(geo.to, Math.max(a, b)));
  const y = HEADER_H + 6;
  polyline(ctx, [[x0, y], [x1, y]], color, 1);
  ctx.font = '600 10px ui-monospace, monospace';
  const label = `${Math.abs(b - a)} ms`;
  const w = ctx.measureText(label)?.width || label.length * 6;
  tag(ctx, label, Math.max(LABEL_W, (x0 + x1 - w) / 2), y + 12, color);
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
  // The teaching-data notice lives once, at the foot of the site.
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
 * Wave name of an event for the optional labels: surface P / QRS / delta /
 * flutter F; intracardiac A, H, V, stimulus S and named potentials. Far-field
 * signals are lower case (a, v); fibrillatory f waves are not named.
 */
export function waveLabel(e, surface) {
  if (surface) return { P: 'P', V: 'QRS', delta: 'δ', F: 'F' }[e.type] || null;
  if (e.type === 'f') return null;
  const name = { A: 'A', H: 'H', V: 'V', S: 'S', PV: 'PV', RB: 'RB', P1: 'P1', P2: 'P2', Pk: 'Pk', U: 'U' }[e.type] || null;
  return name && e.far ? name.toLowerCase() : name;
}

// Wave names above each deflection. Near-field names are placed first and
// far-field ones only where they do not overlap a placed name; on a dense
// strip a name that would overlap is left out.
function drawWaveLabels(ctx, recording, geo, channels, gain) {
  ctx.font = '9px ui-monospace, monospace';
  ctx.textAlign = 'center';
  channels.forEach((ch, i) => {
    const mid = geo.rowTop(i) + geo.rowH / 2;
    const placed = [];   // [left, right] of the names written on this row
    const named = (recording.events[ch.id] || [])
      .filter((e) => e.t >= geo.from && e.t <= geo.to)
      .map((e) => ({ e, name: waveLabel(e, ch.surface) }))
      .filter((x) => x.name)
      .sort((a, b) => Number(Boolean(a.e.far)) - Number(Boolean(b.e.far)) || a.e.t - b.e.t);
    for (const { e, name } of named) {
      const x = geo.x(e.t);
      const half = (ctx.measureText(name)?.width || name.length * 5.5) / 2;
      if (placed.some(([l, r]) => x - half < r + 1 && x + half > l - 1)) continue;
      placed.push([x - half, x + half]);
      const y = Math.max(geo.rowTop(i) + 8, mid - Math.abs(e.amp) * gain - 3);
      ctx.fillStyle = e.far ? 'rgba(201, 214, 207, 0.55)' : 'rgba(236, 246, 241, 0.92)';
      ctx.fillText(name, x, y);
    }
  });
  ctx.textAlign = 'left';
}

// Ladder on the channels (ep-strip-links.js): each activation's deflections
// joined row to row through their centres, the His potentials, and the
// conduction lines between them in the ladder's colours.
const GROUP_COLORS = { A: 'rgba(96, 165, 250, 0.85)', V: 'rgba(248, 113, 113, 0.8)' };
function drawStripLinks(ctx, geo, rows, links, styles) {
  const y = (ch) => geo.rowTop(rows.get(ch)) + geo.rowH / 2;
  const shown = (p) => rows.has(p.ch) && p.t >= geo.from - 200 && p.t <= geo.to + 200;
  ctx.save();
  ctx.beginPath(); ctx.rect(geo.x(geo.from), HEADER_H, geo.x(geo.to) - geo.x(geo.from), rows.size * geo.rowH); ctx.clip();
  for (const g of links.groups) {
    const pts = g.points.filter(shown).sort((a, b) => rows.get(a.ch) - rows.get(b.ch));
    if (!pts.length) continue;
    ctx.fillStyle = GROUP_COLORS[g.kind];
    if (pts.length > 1) polyline(ctx, pts.map((p) => [geo.x(p.t), y(p.ch)]), GROUP_COLORS[g.kind], 1.4);
    for (const p of pts) { ctx.beginPath(); ctx.arc(geo.x(p.t), y(p.ch), 2.6, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.fillStyle = '#facc15';
  for (const h of links.his.filter(shown)) { ctx.beginPath(); ctx.arc(geo.x(h.t), y(h.ch), 3, 0, Math.PI * 2); ctx.fill(); }
  for (const c of links.conduction || []) {
    if (!shown(c.from) && !shown(c.to)) continue;
    if (!rows.has(c.from.ch) || !rows.has(c.to.ch)) continue;
    const style = styles[c.kind];
    const [x0, y0, x1, y1] = [geo.x(c.from.t), y(c.from.ch), geo.x(c.to.t), y(c.to.ch)];
    // On one channel (A to H on the His catheter) the line bridges over the signal.
    const lift = geo.rowH * 0.38;
    const path = c.from.ch === c.to.ch && !c.block ? [[x0, y0], [x0, y0 - lift], [x1, y1 - lift], [x1, y1]] : [[x0, y0], [x1, y1]];
    polyline(ctx, path, style.color, 1.8, style.dash);
    if (c.block) polyline(ctx, [[x1 - 6, y1 - 4], [x1 + 6, y1 + 4]], style.color, 2);
  }
  ctx.restore();
}

/**
 * Times at which a channel is sampled for drawing: about one per pixel, on a
 * grid fixed to absolute time (recording.t0), plus each event's peaks (centre
 * and, for a biphasic spike, centre +/- sigma). Spikes narrower than a pixel
 * then keep their true height whatever the window position, so a sweeping
 * strip does not flicker.
 */
export function sampleTimes(recording, channelId, from, to, plotW) {
  const steps = Math.max(120, Math.floor(plotW));
  const step = (to - from) / steps;
  const t0 = recording?.t0 || 0;
  const first = from + ((((-(from + t0)) % step) + step) % step);
  const times = [from];
  for (let t = first; t < to; t += step) times.push(t);
  times.push(to);
  for (const e of recording?.events?.[channelId] || []) {
    for (const t of e.mono ? [e.t] : [e.t - e.sigma, e.t, e.t + e.sigma]) if (t > from && t < to) times.push(t);
  }
  return times.sort((a, b) => a - b);
}

/**
 * Draw a synthetic recording on a canvas (DPR aware, dark recorder look).
 * @param {HTMLCanvasElement} canvas
 * @param {object} recording from ep-cases.js (epRecording(id)) or ep-maneuver-sim.js
 * @param {{ lang?: string, cursor?: number|null, cursorMs?: number|null, title?: string,
 *   channels?: string[], zoom?: number, pan?: number, caliper?: { a: number|null, b: number|null }|null, waves?: boolean,
 *   links?: { groups, his, conduction }|null, linkStyles?: object }} [options]
 *   cursor: 0..1 fraction of the window; cursorMs: inspection time in ms;
 *   caliper: user caliper lines (ms) drawn across every channel; waves: wave names (A, H, V, P, QRS ...);
 *   channels: the rows to draw (default: the recording's list); zoom/pan: time window;
 *   links: the ladder on the channels (stripLinks), drawn in linkStyles (LADDER_STYLE)
 * @returns {{ from: number, to: number, plotLeft: number, plotW: number, rowTop: number, rowH: number, rows: string[] }|undefined}
 *   the drawn time window and channel rows
 */
export function drawEgm(canvas, recording, { lang = 'tr', cursor = null, cursorMs = null, title = '', channels: only = null, zoom = 1, pan = 0, caliper = null, waves = false, links = null, linkStyles = null } = {}) {
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
  ctx.lineWidth = 1.3;
  ctx.lineJoin = 'round';
  channels.forEach((ch, i) => {
    const mid = geo.rowTop(i) + rowH / 2;
    ctx.strokeStyle = COLORS[ch.id] || '#c9d6cf';
    ctx.beginPath();
    sampleTimes(recording, ch.id, from, to, plotW).forEach((t, s) => {
      const y = mid - egmSample(recording, ch.id, t) * gain;
      if (s === 0) ctx.moveTo(geo.x(t), y);
      else ctx.lineTo(geo.x(t), y);
    });
    ctx.stroke();
  });
  if (links && linkStyles) drawStripLinks(ctx, geo, rows, links, linkStyles);
  if (waves) drawWaveLabels(ctx, recording, geo, channels, gain);
  drawCalipers(ctx, recording, geo, rows);

  const cursorAt = Number.isFinite(cursorMs) ? cursorMs
    : typeof cursor === 'number' && Number.isFinite(cursor) ? Math.min(1, Math.max(0, cursor)) * recording.windowMs : null;
  if (cursorAt != null && cursorAt >= from && cursorAt <= to) {
    const x = geo.x(cursorAt);
    polyline(ctx, [[x, HEADER_H], [x, height - FOOTER_H]], 'rgba(255, 236, 168, 0.85)', 1.2);
  }
  if (caliper) drawUserCaliper(ctx, geo, caliper, height);
  return { from, to, plotLeft: LABEL_W, plotW, rowTop: HEADER_H, rowH, rows: channels.map((ch) => ch.id) };
}

/** Time (ms) under a canvas x coordinate for the drawn window, or null outside the plot. */
export function timeAtX(x, drawn) {
  if (!drawn || x < drawn.plotLeft || x > drawn.plotLeft + drawn.plotW) return null;
  return drawn.from + ((x - drawn.plotLeft) / drawn.plotW) * (drawn.to - drawn.from);
}

/** Channel id of the row under a canvas y coordinate, or null. */
export function channelAtY(y, drawn) {
  if (!drawn?.rows) return null;
  const i = Math.floor((y - drawn.rowTop) / drawn.rowH);
  return i >= 0 && i < drawn.rows.length ? drawn.rows[i] : null;
}

/** Events within `radius` ms of t on each channel (the inspection readout). */
export function eventsNear(recording, t, channels, radius = 25) {
  const out = [];
  for (const ch of channels) {
    for (const e of recording.events[ch] || []) if (Math.abs(e.t - t) <= radius) out.push({ ch, type: e.type, t: e.t });
  }
  return out.sort((a, b) => a.t - b.t);
}

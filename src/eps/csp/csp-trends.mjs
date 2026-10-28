/** Per-turn trends for the CSP implant console: impedance, current of injury, Stim-V6RWPT and
 * QRS duration after every turn of the helix, drawn as four small charts. Pure data plus one
 * drawing function. All values are the synthetic model's metrics.
 */
export const TREND_KEYS = Object.freeze(['impedance', 'coi', 'v6Rwpt', 'qrsDuration']);
const UNITS = Object.freeze({ impedance: 'Ω', coi: 'mV', v6Rwpt: 'ms', qrsDuration: 'ms' });
const COLORS = Object.freeze({ impedance: '#9fd7ff', coi: '#65c9bb', v6Rwpt: '#f4cb75', qrsDuration: '#d3dae3' });
const MAX_POINTS = 24;

/** One point for the trend after a turn. */
export function trendPoint(proc, result) {
  const m = result.metrics;
  return { turn: proc.turns, depthMm: Math.round(proc.depthMm * 10) / 10, impedance: m.impedance, coi: m.coi, v6Rwpt: m.v6Rwpt, qrsDuration: m.qrsDuration };
}

/** Append a point; the list keeps the last MAX_POINTS turns. */
export const pushTrend = (points, point) => [...points, point].slice(-MAX_POINTS);

/** Last change of one metric: { from, to, delta } or null. */
export function trendDelta(points, key) {
  const valid = points.filter(p => Number.isFinite(p[key]));
  if (valid.length < 2) return null;
  const from = valid.at(-2)[key], to = valid.at(-1)[key];
  return { from, to, delta: to - from };
}

/**
 * Draw the four charts in a 2 x 2 grid. `labels` maps the metric keys to their names.
 * Each chart shows the series, its last value and the change from the previous turn.
 */
export function drawTrends(ctx, w, h, points, { labels = {}, emptyText = '' } = {}) {
  ctx.fillStyle = '#0b0e12'; ctx.fillRect(0, 0, w, h);
  const cols = 2, rows = 2, pad = 6, cw = (w - pad * (cols + 1)) / cols, ch = (h - pad * (rows + 1)) / rows;
  TREND_KEYS.forEach((key, i) => {
    const x0 = pad + (i % cols) * (cw + pad), y0 = pad + Math.floor(i / cols) * (ch + pad);
    ctx.fillStyle = '#151a21'; ctx.fillRect(x0, y0, cw, ch);
    ctx.fillStyle = '#8d99a8'; ctx.font = '600 10px system-ui, sans-serif';
    ctx.fillText(labels[key] || key, x0 + 6, y0 + 12);
    const series = points.map(p => p[key]);
    const valid = series.filter(Number.isFinite);
    if (!valid.length) { ctx.fillStyle = '#6b7787'; ctx.font = '10px system-ui, sans-serif'; ctx.fillText(emptyText, x0 + 6, y0 + ch - 8); return; }
    const lo = Math.min(...valid), hi = Math.max(...valid), span = Math.max(hi - lo, key === 'coi' ? 2 : 20);
    const left = x0 + 6, right = x0 + cw - 6, top = y0 + 18, bottom = y0 + ch - 16;
    const n = Math.max(points.length - 1, 1);
    const xAt = j => left + (points.length === 1 ? .5 : j / n) * (right - left);
    const yAt = v => bottom - ((v - lo) / span) * (bottom - top);
    ctx.strokeStyle = COLORS[key]; ctx.lineWidth = 1.5; ctx.beginPath();
    let drawing = false;
    series.forEach((v, j) => { if (!Number.isFinite(v)) { drawing = false; return; } if (drawing) ctx.lineTo(xAt(j), yAt(v)); else { ctx.moveTo(xAt(j), yAt(v)); drawing = true; } });
    ctx.stroke();
    ctx.fillStyle = COLORS[key];
    series.forEach((v, j) => { if (Number.isFinite(v)) { ctx.beginPath(); ctx.arc(xAt(j), yAt(v), 2, 0, Math.PI * 2); ctx.fill(); } });
    const d = trendDelta(points, key), last = valid.at(-1);
    ctx.font = '600 11px ui-monospace, monospace'; ctx.fillStyle = '#f2f5f9';
    const text = `${key === 'coi' ? last.toFixed(1) : Math.round(last)} ${UNITS[key]}`;
    ctx.fillText(text, x0 + cw - 6 - ctx.measureText(text).width, y0 + 12);
    if (d) {
      const sign = d.delta > 0 ? '+' : '', dt = `${sign}${key === 'coi' ? d.delta.toFixed(1) : Math.round(d.delta)}`;
      ctx.font = '10px ui-monospace, monospace'; ctx.fillStyle = d.delta === 0 ? '#8d99a8' : d.delta > 0 ? '#7fd8aa' : '#f1a85c';
      ctx.fillText(dt, x0 + 6, y0 + ch - 5);
    }
  });
}

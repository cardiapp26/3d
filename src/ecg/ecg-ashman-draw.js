/**
 * Canvas drawing for the Ashman lab (ecg-ashman-lab.js): the ECG strip with cycle brackets, the
 * refractory bars of the AV node and the bundles, the outcome map (preceding cycle against
 * coupling) and the AF tachogram. The heart section lives in ecg-ashman-heart.js.
 */
import { fitCanvas, drawPaper, drawTrace, label, chartFrame, polyline, PAPER } from './ecg-paper.js';
import { renderBeats } from './ecg-ashman-model.js';

export const PATTERN_COLOR = Object.freeze({
  normal: '#34d399', rbbb: '#60a5fa', 'rbbb-incomplete': '#93c5fd', 'rbbb-lafb': '#a78bfa', lafb: '#c4b5fd',
  lbbb: '#f472b6', 'lbbb-incomplete': '#f9a8d4', 'blocked-avn': '#64748b', 'blocked-hps': '#ef4444', sinus: '#1e293b'
});
const STATE_COLOR = Object.freeze({ refractory: '#0f172a', relative: '#f59e0b', ready: '#facc15' });
const SHORT = Object.freeze({ normal: 'N', rbbb: 'RBBB', 'rbbb-incomplete': 'iRBBB', 'rbbb-lafb': 'RBBB+LAFB', lafb: 'LAFB', lbbb: 'LBBB', 'lbbb-incomplete': 'iLBBB', 'blocked-avn': '', 'blocked-hps': '' });

/** ECG strip (25 mm/s) of the beats from `from` to `to`, with cycle brackets and pattern tags. */
export function drawStrip(canvas, beats, { from, to, maxTo = to, leads = ['II', 'V1'], brackets = [], tags = [], fib = false }) {
  const k = fitCanvas(canvas); if (!k) return;
  const { ctx, w, h } = k;
  const pxPerMm = Math.min((w - 16) / ((to - from) * 25 / 1000), (h - 34) / (leads.length * 18));
  // When the height limits the scale, show more of the recording instead of leaving the right side empty.
  const span = Math.min(maxTo, from + (w - 16) / (pxPerMm * .025)) - from;
  const data = renderBeats(beats, from + span + 50, leads, { fib });
  drawPaper(ctx, w, h, pxPerMm);
  const opts = { pxPerMm, speed: 25, gain: 10 }, x0 = 8, top = 30, rowH = (h - top) / leads.length;
  const xOf = t => x0 + (t - from) * 25 / 1000 * pxPerMm;
  leads.forEach((l, i) => {
    drawTrace(ctx, data[l], from, span, x0, top + rowH * (i + .55), opts);
    label(ctx, l, x0 + 2, top + rowH * i + 12);
  });
  for (const b of brackets) {
    const a = xOf(b.from), z = xOf(b.to), y = 8 + (b.row || 0) * 12;
    polyline(ctx, [[a, y + 4], [a, y], [z, y], [z, y + 4]], b.color || PAPER.label, 1.2);
    label(ctx, b.text, (a + z) / 2, y + 10, { align: 'center', color: b.color || PAPER.label, font: '600 10px ui-monospace, monospace' });
  }
  for (const t of tags) {
    const x = xOf(t.t);
    if (t.line) { ctx.strokeStyle = t.color; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, h - 4); ctx.stroke(); ctx.setLineDash([]); }
    label(ctx, t.text, x, top + 10 + (t.row || 0) * 11, { align: 'center', color: t.color, font: '700 10px system-ui, sans-serif' });
  }
}

/** Pattern labels above every aberrant or blocked beat. */
export function stripTags(beats) {
  return beats.filter(b => b.v != null && b.pattern !== 'normal').map(b => ({ t: b.v + 40, text: SHORT[b.pattern], color: shade(b.pattern) }));
}
const shade = p => ({ rbbb: '#1d4ed8', 'rbbb-incomplete': '#2563eb', 'rbbb-lafb': '#6d28d9', lafb: '#7c3aed', lbbb: '#be185d', 'lbbb-incomplete': '#db2777', 'blocked-hps': '#b91c1c', 'blocked-avn': '#475569' }[p] || PAPER.label);
export { shade as patternInk };

/**
 * Refractory bars: one row per structure, from its last activation before the early beat; black
 * is effective refractory, amber relative, yellow recovered. The early impulse is the red line.
 */
export function drawBars(canvas, rows, { from, to, cursor = null, text }) {
  const k = fitCanvas(canvas); if (!k) return;
  const { ctx, w, h } = k, L = 74, R = w - 10, T = 16, rowH = Math.min(30, (h - T - 26) / rows.length);
  ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, w, h);
  const px = t => L + (t - from) / (to - from) * (R - L);
  rows.forEach((r, i) => {
    const y = T + i * rowH + 4, bh = rowH - 10;
    label(ctx, r.name, 8, y + bh / 2 + 4, { color: '#cbd5e1', font: '600 11px system-ui, sans-serif' });
    const seg = (a, b, c) => { const x1 = Math.max(L, px(a)), x2 = Math.min(R, px(b)); if (x2 > x1) { ctx.fillStyle = c; ctx.fillRect(x1, y, x2 - x1, bh); } };
    seg(from, r.start, '#334155');
    seg(r.start, r.start + r.erp, STATE_COLOR.refractory);
    seg(r.start + r.erp, r.start + r.erp + (r.rrp || 0), STATE_COLOR.relative);
    seg(r.start + r.erp + (r.rrp || 0), to, STATE_COLOR.ready);
    ctx.strokeStyle = 'rgba(148,163,184,.5)'; ctx.lineWidth = 1; ctx.strokeRect(L + .5, y + .5, R - L - 1, bh - 1);
    if (r.arrive != null) {
      const x = px(r.arrive);
      ctx.fillStyle = r.blocked ? '#ef4444' : '#f8fafc'; ctx.fillRect(x - 1.5, y - 3, 3, bh + 6);
      ctx.beginPath(); ctx.arc(x, y - 4, 3.5, 0, Math.PI * 2); ctx.fill();
    }
  });
  const yAxis = T + rows.length * rowH + 4;
  ctx.fillStyle = '#94a3b8'; ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'center';
  for (let t = Math.ceil(from / 200) * 200; t <= to; t += 200) ctx.fillText(`${Math.round(t - rows[0].start)}`, px(t), yAxis + 10);
  ctx.textAlign = 'left';
  const key = [[STATE_COLOR.refractory, text.erp], [STATE_COLOR.relative, text.rrp], [STATE_COLOR.ready, text.ready]];
  let kx = R; ctx.font = '10px system-ui, sans-serif';
  for (const [c, s] of key.reverse()) { const tw = ctx.measureText(s).width; kx -= tw + 22; ctx.fillStyle = c; ctx.fillRect(kx, h - 13, 10, 9); ctx.strokeStyle = '#64748b'; ctx.strokeRect(kx + .5, h - 12.5, 9, 8); label(ctx, s, kx + 14, h - 5, { color: '#cbd5e1', font: '10px system-ui, sans-serif' }); }
  if (cursor != null && cursor >= from && cursor <= to) polyline(ctx, [[px(cursor), T - 4], [px(cursor), yAxis]], 'rgba(56,189,248,.9)', 1.4, [3, 2]);
}

/** Outcome map: rows of preceding cycles against couplings, coloured by pattern, with a crosshair. */
export function drawMap(canvas, map, { cycle, coupling, text }) {
  const k = fitCanvas(canvas); if (!k) return;
  const { ctx, w, h } = k;
  const [c0, c1] = map.cycles, [k0, k1, kStep] = map.couplings, cStep = map.cycles[2];
  const f = chartFrame(ctx, w, h, { x: [k0, k1], y: [c0, c1], xTicks: [300, 500, 700, 900], yTicks: [400, 700, 1000, 1300], xLabel: text.x, yLabel: text.y });
  const cw = Math.abs(f.px(k0 + kStep) - f.px(k0)) + .6, ch = Math.abs(f.py(c0 + cStep) - f.py(c0)) + .6;
  for (const row of map.rows) row.cells.forEach((p, i) => { ctx.fillStyle = PATTERN_COLOR[p]; ctx.fillRect(f.px(k0 + i * kStep), f.py(row.cycle) - ch, cw, ch); });
  polyline(ctx, [[f.px(k0), f.py(k0)], [f.px(Math.min(k1, c1)), f.py(Math.min(k1, c1))]], 'rgba(226,232,240,.5)', 1, [3, 3]);
  if (coupling <= k1) {
    const x = f.px(coupling), y = f.py(cycle);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.stroke();
    polyline(ctx, [[x, f.T], [x, f.B]], 'rgba(255,255,255,.35)', 1, [2, 3]); polyline(ctx, [[f.L, y], [f.R, y]], 'rgba(255,255,255,.35)', 1, [2, 3]);
  }
}

/** AF tachogram: each RR as a bar coloured by the beat's pattern; long-short pairs flagged. */
export function drawTachogram(canvas, beats, text) {
  const k = fitCanvas(canvas); if (!k) return;
  const { ctx, w, h } = k;
  const f = chartFrame(ctx, w, h, { x: [0, beats.length], y: [200, 1500], yTicks: [300, 600, 900, 1200, 1500], xLabel: text.x, yLabel: 'RR (ms)' });
  const bw = (f.R - f.L) / beats.length;
  beats.forEach((b, i) => {
    const x = f.L + i * bw + 1, y = f.py(Math.min(1500, b.cycle));
    ctx.fillStyle = PATTERN_COLOR[b.pattern]; ctx.fillRect(x, y, Math.max(2, bw - 2), f.B - y);
    if (b.aberrant && b.longShort) label(ctx, '↓', x + bw / 2 - 1, y - 3, { align: 'center', color: '#fbbf24', font: '700 12px system-ui, sans-serif' });
    if (b.linked) label(ctx, 'L', x + bw / 2 - 1, y - 3, { align: 'center', color: '#f472b6', font: '700 10px system-ui, sans-serif' });
  });
}

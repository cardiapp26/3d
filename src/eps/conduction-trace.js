/**
 * Lead II and V1 traces of one conduction-lesson beat on ECG paper (25 mm/s look, 1 mV = 10 mm
 * scaled to the canvas), the P, PR and QRS brackets of the first conducted beat and a playback
 * cursor; the trace is drawn up to the cursor while a beat plays, then in full.
 */
import { leadVoltage } from './conduction-model.js';

const LEADS = ['II', 'V1'];
const COLORS = Object.freeze({ paper: '#0d1733', minor: 'rgba(130,160,230,.10)', major: 'rgba(130,160,230,.24)', trace: '#e3ecff', faint: 'rgba(227,236,255,.22)', cursor: '#f4c66e', p: '#7fc8f8', pr: '#9be3b5', qrs: '#f2a488', label: '#93a6cc' });

/** Canvas backing size for its CSS size and the device pixel ratio; returns the 2D context. */
function fit(canvas) {
  const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(canvas.clientWidth * ratio)), h = Math.max(1, Math.round(canvas.clientHeight * ratio));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, w: canvas.clientWidth, h: canvas.clientHeight };
}

function grid(ctx, w, h, msPerPx) {
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, w, h);
  const small = 40 / msPerPx;            // one small square = 40 ms
  for (let i = 0, x = 0; x <= w; i++, x = i * small) {
    ctx.strokeStyle = i % 5 ? COLORS.minor : COLORS.major;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let i = 0, y = 0; y <= h; i++, y = i * small) {
    ctx.strokeStyle = i % 5 ? COLORS.minor : COLORS.major;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  return small;
}

function bracket(ctx, x0, x1, y, color, text) {
  if (!(x1 > x0)) return;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x0, y - 4); ctx.lineTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1, y - 4); ctx.stroke();
  ctx.font = '600 10px ui-monospace, Menlo, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(text, (x0 + x1) / 2, y + 2);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} beat beatTimeline() result
 * @param {{ t: number|null, labels: { II: string, V1: string }, marks: { p: string, pr: string, qrs: string } }} opts
 *   t: playback time (ms) or null when idle (whole trace drawn, no cursor)
 */
export function drawConductionTrace(canvas, beat, { t = null, labels, marks }) {
  if (!canvas?.getContext || !canvas.clientWidth) return null;
  const { ctx, w, h } = fit(canvas);
  const left = 30, span = beat.duration + 40;
  const msPerPx = span / (w - left - 6);
  const small = grid(ctx, w, h, msPerPx);
  const x = (ms) => left + ms / msPerPx;
  const rowH = (h - 18) / LEADS.length;
  const gain = Math.min(10 * small, rowH * 0.36);   // px per mV: 10 mm per mV, capped to the row
  LEADS.forEach((lead, row) => {
    const base = row * rowH + rowH * 0.62;
    ctx.fillStyle = COLORS.label; ctx.font = '600 11px ui-monospace, Menlo, monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(labels[lead], 4, base - rowH * 0.3);
    const until = t === null ? beat.duration : Math.min(t, beat.duration);
    for (const [end, color] of [[beat.duration, COLORS.faint], [until, COLORS.trace]]) {
      ctx.strokeStyle = color; ctx.lineWidth = color === COLORS.trace ? 1.6 : 1; ctx.beginPath();
      for (let ms = 0; ms <= end; ms += 2) {
        const y = base - leadVoltage(beat, lead, ms) * gain;
        if (ms === 0) ctx.moveTo(x(ms), y); else ctx.lineTo(x(ms), y);
      }
      ctx.stroke();
    }
  });
  // Brackets under lead II: P, PR (P onset to QRS onset) and QRS of the first conducted beat.
  const y = rowH - 12;
  const p = beat.pOnsets[0];
  if (p !== undefined) bracket(ctx, x(p), x(p + beat.pDuration), y, COLORS.p, `${marks.p} ${beat.pDuration}`);
  if (beat.intervals.pr !== null) bracket(ctx, x(p), x(beat.qrsOnset), y + 16, COLORS.pr, `${marks.pr} ${beat.intervals.pr}`);
  bracket(ctx, x(beat.qrsOnset), x(beat.qrsOnset + beat.qrsDuration), y, COLORS.qrs, `${marks.qrs} ${beat.qrsDuration}`);
  if (t !== null) {
    ctx.strokeStyle = COLORS.cursor; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x(t), 0); ctx.lineTo(x(t), h); ctx.stroke();
  }
  return { msPerPx, left };
}

// Schematic lead II shape locked to CYCLE_SYNC, the same clock as the valve pose.
// It is a teaching trace, not a recorded or diagnostic electrocardiogram.

import { CYCLE_SYNC as SYNC, phaseToTime, timeToPhase } from './cardiac-cycle.js';

function wrapPhase(phase) {
  const p = Number(phase);
  if (!Number.isFinite(p)) return 0;
  return ((p % 1) + 1) % 1;
}

function bump(phase, center, width, amplitude) {
  const distance = Math.abs(phase - center);
  return amplitude * Math.exp(-0.5 * (distance / width) ** 2);
}

export function ecgSample(phase, rhythm = 'sinus') {
  const p = wrapPhase(phase);
  // Q at QRS onset, R at the peak, S just before the QRS ends; S1 (mitral
  // closure) follows the QRS onset by ~35 ms.
  const qrs = bump(p, SYNC.qrsOnset + 0.004, 0.008, -0.12)
    + bump(p, SYNC.qrsPeak, 0.011, 1)
    + bump(p, SYNC.qrsEnd - 0.02, 0.009, -0.22);
  // T peaks as the semilunar valves start to close and is back on the baseline at S2,
  // when isovolumetric relaxation begins and both valves are shut.
  const tWave = bump(p, SYNC.tPeak, 0.02, 0.32);
  if (rhythm === 'afib') {
    return 0.045 * Math.sin(p * Math.PI * 36) + qrs + tWave;
  }
  return bump(p, SYNC.pPeak, 0.02, 0.2) + qrs + tWave;
}

export function formatValveSync(interval, language) {
  if (!interval) return '';
  const tr = language !== 'en';
  const av = interval.avValves === 'open'
    ? (tr ? 'AV açık' : 'AV open')
    : (tr ? 'AV kapalı' : 'AV closed');
  const semilunar = interval.semilunarValves === 'open'
    ? (tr ? 'semilunar açık' : 'semilunar open')
    : (tr ? 'semilunar kapalı' : 'semilunar closed');
  return `${av} · ${semilunar}`;
}

const MARKS = [
  { phase: SYNC.pPeak, label: 'P', rhythms: new Set(['sinus', 'bradycardia', 'tachycardia']) },
  { phase: SYNC.qrsPeak, label: 'QRS' },
  { phase: SYNC.tPeak, label: 'T' },
  { phase: SYNC.ivcStart, label: 'S1' },
  { phase: SYNC.ejectionStart, label: 'Ao' },
  { phase: SYNC.ivrStart, label: 'S2' }
];

/** Cycle phase under a pointer on the ECG strip (the trace spans one RR interval). */
export function ecgPhaseAt(canvas, clientX, bpm) {
  const rect = canvas.getBoundingClientRect();
  const tau = Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(1, rect.width)));
  return timeToPhase(tau, bpm);
}

/**
 * @param {{ reserveLeft?: number, reserveRight?: number }} [layout] widths (px)
 *   taken by the caption overlays at the bottom corners; baseline marks there
 *   are lifted above the baseline so they do not collide with the captions.
 */
export function drawEcgTrace(canvas, state, layout = {}) {
  if (!canvas || !state) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width < 2 || height < 2) return;
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  const pixelWidth = Math.floor(width * dpr);
  const pixelHeight = Math.floor(height * dpr);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#10241c';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(88, 168, 132, 0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= width; x += 12) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
  }
  for (let y = 0; y <= height; y += 12) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
  }
  ctx.stroke();

  const rhythm = state.rhythm || 'sinus';
  const phase = wrapPhase(state.phase);
  const mid = height * 0.62;
  const gain = height * 0.34;
  ctx.beginPath();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#3ee08f';
  ctx.lineJoin = 'round';
  // x axis is real time over one RR interval (same warp as the Wiggers strip).
  const bpm = state.bpm || 72;
  const steps = Math.max(80, Math.floor(width / 2));
  for (let i = 0; i <= steps; i++) {
    const tau = i / steps;
    const y = mid - ecgSample(timeToPhase(tau, bpm), rhythm) * gain;
    if (i === 0) ctx.moveTo(tau * width, y);
    else ctx.lineTo(tau * width, y);
  }
  ctx.stroke();

  // The cursor is draggable: a line with a grip at the top.
  const cursor = phaseToTime(phase, bpm) * width;
  ctx.strokeStyle = 'rgba(255, 236, 168, 0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cursor, 2);
  ctx.lineTo(cursor, height - 2);
  ctx.stroke();
  ctx.fillStyle = '#ffeca8';
  ctx.beginPath();
  ctx.moveTo(cursor - 5, 0);
  ctx.lineTo(cursor + 5, 0);
  ctx.lineTo(cursor, 7);
  ctx.closePath();
  ctx.fill();

  if (width >= 520) {
    ctx.fillStyle = '#d7f5e4';
    ctx.font = '10px ui-monospace, monospace';
    for (const mark of MARKS) {
      if (mark.rhythms && !mark.rhythms.has(rhythm)) continue;
      const onBaseline = mark.label === 'S1' || mark.label === 'Ao' || mark.label === 'S2';
      const x = phaseToTime(mark.phase, bpm) * width + 3;
      const underCaption = x < (layout.reserveLeft || 0) || x + 16 > width - (layout.reserveRight || 0);
      ctx.fillText(mark.label, x, !onBaseline ? 12 : underCaption ? mid - 6 : height - 6);
    }
  }
}

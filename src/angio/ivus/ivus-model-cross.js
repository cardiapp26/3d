// Coronary IVUS Lab · B-mode frame of the interactive vessel/stent model (Canvas 2D).
// Draws the frame under the transducer: speckle, adventitia, media, plaque, calcium with its
// acoustic shadow and reverberations, side-branch ostium, vein, pericardium, myocardium, stent
// struts coloured by strut-to-wall distance and the caliper of the largest gap.

import { sliceLayout, MALAPPOSITION_MM } from './ivus-stent-model.js';
import { drawAcquiredIvus, strutLayout } from './ivus-acquire.js';

const pick = (o, lang) => (o && typeof o === 'object' ? o[lang === 'en' ? 'en' : 'tr'] : String(o ?? ''));
const TAU = Math.PI * 2;
function setup(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = Math.max(200, Math.round(canvas.clientWidth || 360));
  if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
    canvas.width = size * dpr;
    canvas.height = size * dpr;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, size };
}

/** Screen point of an in-plane (x right, y up) mm coordinate. */
const toScreen = (cx, cy, k) => (x, y) => [cx + x * k, cy - y * k];
const dir = (phi) => [Math.sin(phi), Math.cos(phi)];
const clockPhi = (clock) => ((clock % 12) / 12) * TAU;
// Canvas arc angles start at 3 o'clock and run clockwise (y down): φ (12 o'clock, clockwise) → φ - π/2.
const arcAngle = (phi) => phi - Math.PI / 2;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} f frame from modelSlice()
 * @param {{ lang?: string, mhz?: number, borders?: boolean, segmentLabel?: string }} opts
 * @returns {{ maxGapMm: number, struts: number, malapposedStruts: number }}
 */
export function renderModelCross(canvas, f, opts = {}) {
  if (!canvas || !f) return null;
  const { ctx, size } = setup(canvas);
  const lang = opts.lang || 'tr';
  const isTr = lang !== 'en';
  const mhz = opts.mhz || 60;
  const L = sliceLayout(f);
  const fovMm = Math.max(4.2, L.eemR + 2.6);
  const cx = size / 2;
  const cy = size / 2;
  const k = (size * 0.47) / fovMm;
  const P = toScreen(cx, cy, k);
  // Catheter at the lumen centre: vessel (EEM) centre sits at minus the lumen offset.
  const ex = -L.lumenX;
  const ey = -L.lumenY;
  const [ecx, ecy] = P(ex, ey);
  const [lcx, lcy] = P(0, 0);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  // Acquired-looking frame (ultrasound-sim.js); its field of view matches the overlay scale.
  drawAcquiredIvus(ctx, f, { size, fovMm: (size * 0.485) / k, mhz, time: opts.time });

  // Side-branch window (borders are interrupted across the ostium).
  const branchWin = f.branch ? { phi: clockPhi(f.branch.clock), half: Math.asin(Math.min(0.9, (f.branch.diamMm / 2) / (L.lumenR + f.branch.diamMm / 2))) } : null;

  // Stent struts: strut-to-wall distance per strut; markers only with the borders on.
  let maxGap = 0;
  let maxStrut = null;
  let malapposed = 0;
  const strutList = strutLayout(f, L);
  const struts = strutList.length;
  for (const st of strutList) {
    const { phi, sx, sy } = st;
    const gap = branchWin && Math.abs(Math.atan2(Math.sin(phi - branchWin.phi), Math.cos(phi - branchWin.phi))) < 0.7 ? -1 : L.gapAt(phi);
    if (gap > maxGap) { maxGap = gap; maxStrut = { phi, sx, sy, gap }; }
    if (gap > MALAPPOSITION_MM) malapposed += 1;
    if (opts.borders !== false && gap !== 0) {
      const [px, py] = P(sx, sy);
      ctx.beginPath();
      ctx.arc(px, py, Math.max(4, 0.2 * k), 0, TAU);
      ctx.strokeStyle = gap < 0 ? '#38bdf8' : gap > MALAPPOSITION_MM ? '#ff4d4f' : gap > 0.1 ? '#f5b041' : 'rgba(0,0,0,0)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Measurement overlays.
  if (opts.borders !== false) {
    ctx.save();
    ctx.lineWidth = 1.6;
    ctx.setLineDash([]);
    // Borders are interrupted across a side-branch ostium (no EEM there).
    const ring = (x, y, r, color) => {
      ctx.strokeStyle = color;
      ctx.beginPath();
      if (branchWin) ctx.arc(x, y, r, arcAngle(branchWin.phi + branchWin.half), arcAngle(branchWin.phi - branchWin.half) + TAU);
      else ctx.arc(x, y, r, 0, TAU);
      ctx.stroke();
    };
    ring(ecx, ecy, L.eemR * k, '#facc15');
    ring(lcx, lcy, L.lumenR * k, '#22c55e');
    if (f.inStent) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#60a5fa';
      const [scx, scy] = P(L.stentX, L.stentY);
      ctx.beginPath();
      ctx.arc(scx, scy, L.stentR * k, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (maxStrut && maxStrut.gap > 0.05) {
      const [px, py] = P(maxStrut.sx, maxStrut.sy);
      const vx = maxStrut.sx - 0;
      const vy = maxStrut.sy - 0;
      const len = Math.hypot(vx, vy) || 1;
      const [wx2, wy2] = P((vx / len) * L.lumenR, (vy / len) * L.lumenR);
      ctx.strokeStyle = maxStrut.gap > MALAPPOSITION_MM ? '#ff4d4f' : '#f5b041';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(wx2, wy2);
      ctx.stroke();
      ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText(`${maxStrut.gap.toFixed(2)} mm`, (px + wx2) / 2 + 8, (py + wy2) / 2 - 6);
    }
    ctx.restore();
  }

  // Labels and scale bar.
  ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(`${mhz} MHz · ${f.sMm.toFixed(1)} mm · ${opts.segmentLabel || ''}`, 12, 20);
  if (f.branch) {
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText(`${isTr ? 'Yan dal ağzı' : 'Side-branch ostium'}: ${f.branch.label}`, 12, 38);
  }
  const lmText = (f.landmarks || []).map((l) => pick(l.label, lang)).join(' · ');
  if (lmText) {
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(lmText.slice(0, 54), 12, size - 46);
  }
  ctx.fillStyle = '#22c55e';
  ctx.fillText(`${isTr ? 'Lümen' : 'Lumen'} ${f.lumenAreaMm2.toFixed(2)} mm²`, 12, size - 28);
  ctx.fillStyle = '#facc15';
  ctx.fillText(`EEM ${f.eemAreaMm2.toFixed(2)} mm² · PB %${f.plaqueBurdenPct.toFixed(0)}`, 12, size - 12);
  if (f.inStent) {
    ctx.fillStyle = '#60a5fa';
    const t = `${isTr ? 'Stent' : 'Stent'} ${f.stentAreaMm2.toFixed(2)} mm²`;
    ctx.fillText(t, size - ctx.measureText(t).width - 12, size - 12);
  }
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(size - 12 - k, 18);
  ctx.lineTo(size - 12, 18);
  ctx.stroke();
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('1 mm', size - 12 - k, 34);
  return { maxGapMm: Math.max(0, maxGap), struts, malapposedStruts: malapposed };
}

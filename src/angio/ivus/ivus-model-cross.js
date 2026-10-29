// Coronary IVUS Lab · B-mode frame of the interactive vessel/stent model (Canvas 2D).
// Draws the frame under the transducer: speckle, adventitia, media, plaque, calcium with its
// acoustic shadow and reverberations, side-branch ostium, vein, pericardium, myocardium, stent
// struts coloured by strut-to-wall distance and the caliper of the largest gap.

import { sliceLayout, MALAPPOSITION_MM } from './ivus-stent-model.js';

const pick = (o, lang) => (o && typeof o === 'object' ? o[lang === 'en' ? 'en' : 'tr'] : String(o ?? ''));
const TAU = Math.PI * 2;
let noiseCanvas = null;

function speckle(ctx) {
  if (!noiseCanvas) {
    noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = noiseCanvas.height = 192;
    const c = noiseCanvas.getContext('2d');
    const img = c.createImageData(192, 192);
    let seed = 11;
    for (let i = 0; i < 192 * 192; i++) {
      seed = (seed * 16807) % 2147483647;
      const v = (seed % 10000) / 10000;
      const s = v > 0.5 ? Math.round(255 * ((v - 0.5) / 0.5) ** 1.7) : 0;
      img.data.set([s, s, s, s ? 255 : 0], i * 4);
    }
    c.putImageData(img, 0, 0);
  }
  return ctx.createPattern(noiseCanvas, 'repeat');
}

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

function fillTextured(ctx, pathFn, base, alpha, pattern) {
  ctx.save();
  pathFn();
  ctx.fillStyle = base;
  ctx.fill('evenodd');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = pattern;
  ctx.fill('evenodd');
  ctx.restore();
}

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
  const pattern = speckle(ctx);
  // Catheter at the lumen centre: vessel (EEM) centre sits at minus the lumen offset.
  const ex = -L.lumenX;
  const ey = -L.lumenY;
  const [ecx, ecy] = P(ex, ey);
  const [lcx, lcy] = P(0, 0);
  const depthFade = mhz >= 50 ? 0.82 : mhz >= 40 ? 0.9 : 1;

  ctx.fillStyle = '#020305';
  ctx.fillRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.485, 0, TAU);
  ctx.clip();

  // Perivascular tissue (fades with depth; higher frequency penetrates less).
  const grad = ctx.createRadialGradient(ecx, ecy, L.eemR * k, ecx, ecy, size * 0.5);
  grad.addColorStop(0, `rgba(120,128,138,${0.5 * depthFade})`);
  grad.addColorStop(1, 'rgba(18,20,24,0.25)');
  fillTextured(ctx, () => { ctx.beginPath(); ctx.rect(0, 0, size, size); }, grad, 0.55 * depthFade, pattern);

  // Landmarks outside the adventitia.
  for (const lm of f.landmarks || []) {
    const phi = clockPhi(lm.clock);
    const [dx, dy] = dir(phi);
    if (lm.kind === 'myocardium') {
      fillTextured(ctx, () => {
        ctx.beginPath();
        ctx.arc(ecx, ecy, size, arcAngle(phi - 0.85), arcAngle(phi + 0.85));
        ctx.arc(ecx, ecy, (L.eemR + 0.5) * k, arcAngle(phi + 0.85), arcAngle(phi - 0.85), true);
        ctx.closePath();
      }, 'rgba(92,96,104,0.55)', 0.75 * depthFade, pattern);
    } else if (lm.kind === 'pericardium') {
      ctx.save();
      ctx.strokeStyle = `rgba(235,238,242,${0.75 * depthFade})`;
      ctx.lineWidth = Math.max(3, 0.35 * k);
      ctx.beginPath();
      ctx.arc(ecx, ecy, (L.eemR + 1.9) * k, arcAngle(phi - 0.6), arcAngle(phi + 0.6));
      ctx.stroke();
      ctx.restore();
    } else if (lm.kind === 'vein') {
      const [vx, vy] = P(ex + dx * (L.eemR + 1.5), ey + dy * (L.eemR + 1.5));
      ctx.save();
      ctx.translate(vx, vy);
      ctx.rotate(arcAngle(phi) + Math.PI / 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.3 * k, 0.75 * k, 0, 0, TAU);
      ctx.fillStyle = 'rgba(6,8,12,0.95)';
      ctx.fill();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = pattern;
      ctx.fill();
      ctx.restore();
    }
  }

  // Adventitia (bright) and media (dark) rings.
  fillTextured(ctx, () => {
    ctx.beginPath();
    ctx.arc(ecx, ecy, (L.eemR + 0.45) * k, 0, TAU);
    ctx.arc(ecx, ecy, L.eemR * k, 0, TAU, true);
  }, 'rgba(176,182,190,0.85)', 0.9, pattern);
  const mediaMm = Math.max(0.1, L.eemR * 0.06);
  ctx.beginPath();
  ctx.arc(ecx, ecy, L.eemR * k, 0, TAU);
  ctx.arc(ecx, ecy, (L.eemR - mediaMm) * k, 0, TAU, true);
  ctx.fillStyle = '#07080b';
  ctx.fill('evenodd');

  // Plaque / intima between the media and the lumen (lumen circle is offset).
  const plaqueBase = f.plaqueType === 'normal' ? 'rgba(120,124,130,0.7)' : 'rgba(150,154,160,0.82)';
  fillTextured(ctx, () => {
    ctx.beginPath();
    ctx.arc(ecx, ecy, (L.eemR - mediaMm) * k, 0, TAU);
    ctx.arc(lcx, lcy, L.lumenR * k, 0, TAU, true);
  }, plaqueBase, 0.85, pattern);

  // Calcium: bright arc on the lumen surface, shadow behind it, reverberations.
  if (L.halfCa > 0) {
    const a0 = arcAngle(L.phiCa - L.halfCa);
    const a1 = arcAngle(L.phiCa + L.halfCa);
    ctx.beginPath();
    ctx.moveTo(lcx, lcy);
    ctx.arc(lcx, lcy, size, a0, a1);
    ctx.closePath();
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.arc(lcx, lcy, size, 0, TAU);
    ctx.arc(lcx, lcy, (L.lumenR + 0.32) * k, 0, TAU, true);
    ctx.fillStyle = '#010102';
    ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(210,214,220,0.32)';
    ctx.lineWidth = 2;
    [2, 3].forEach((m) => {
      ctx.beginPath();
      ctx.arc(lcx, lcy, (L.lumenR + 0.16) * m * k * 0.62 + L.lumenR * k * 0.38, a0, a1);
      ctx.stroke();
    });
    ctx.restore();
    ctx.strokeStyle = '#f6f7f9';
    ctx.lineWidth = Math.max(3, 0.24 * k);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(lcx, lcy, (L.lumenR + 0.14) * k, a0, a1);
    ctx.stroke();
  }

  // Lumen with blood speckle (stronger at higher frequency).
  fillTextured(ctx, () => { ctx.beginPath(); ctx.arc(lcx, lcy, L.lumenR * k, 0, TAU); }, '#030406', mhz >= 50 ? 0.34 : 0.16, pattern);

  // Side-branch ostium: the lumen opens through the wall into the branch (keyhole shape).
  let branchWin = null;
  if (f.branch) {
    const phi = clockPhi(f.branch.clock);
    const rb = f.branch.diamMm / 2;
    const half = Math.asin(Math.min(0.9, rb / (L.lumenR + rb)));
    branchWin = { phi, half };
    const [dx, dy] = dir(phi);
    const reach = L.lumenR + rb * 1.15;
    const [bx, by] = P(dx * reach, dy * reach);
    // Branch wall (adventitia) first, then its lumen and the opening into the main lumen.
    ctx.save();
    ctx.beginPath();
    ctx.arc(bx, by, (rb + 0.3) * k, 0, TAU);
    ctx.fillStyle = 'rgba(176,182,190,0.85)';
    ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = pattern;
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(lcx, lcy);
    ctx.arc(lcx, lcy, reach * k, arcAngle(phi - half), arcAngle(phi + half));
    ctx.closePath();
    ctx.moveTo(bx + rb * k, by);
    ctx.arc(bx, by, rb * k, 0, TAU);
    ctx.fillStyle = '#030406';
    ctx.fill('nonzero');
    ctx.globalAlpha = mhz >= 50 ? 0.3 : 0.14;
    ctx.fillStyle = pattern;
    ctx.fill('nonzero');
    ctx.restore();
  }

  // Guidewire with its shadow (outside the stent at about 8 o'clock).
  const wPhi = clockPhi(8.2);
  const [wdx, wdy] = dir(wPhi);
  const [wx, wy] = P(wdx * L.lumenR * 0.55, wdy * L.lumenR * 0.55);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(wx, wy);
  ctx.arc(lcx, lcy, size, arcAngle(wPhi - 0.07), arcAngle(wPhi + 0.07));
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(wx, wy, Math.max(2.2, 0.09 * k), 0, TAU);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Stent struts.
  let maxGap = 0;
  let maxStrut = null;
  let malapposed = 0;
  const struts = f.inStent ? Math.max(8, Math.round(f.stentD * 3)) : 0;
  for (let i = 0; i < struts; i++) {
    const phi = (i / struts) * TAU + 0.17;
    const [dx, dy] = dir(phi);
    const sx = L.stentX + dx * L.stentR;
    const sy = L.stentY + dy * L.stentR;
    const gap = f.branch && Math.abs(Math.atan2(Math.sin(phi - clockPhi(f.branch.clock)), Math.cos(phi - clockPhi(f.branch.clock)))) < 0.7 ? -1 : L.gapAt(phi);
    if (gap > maxGap) { maxGap = gap; maxStrut = { phi, sx, sy, gap }; }
    if (gap > MALAPPOSITION_MM) malapposed += 1;
    const [px, py] = P(sx, sy);
    // Strut shadow.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(lcx, lcy, size, arcAngle(phi - 0.05), arcAngle(phi + 0.05));
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(arcAngle(phi) + Math.PI / 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.fillRect(-Math.max(2.5, 0.13 * k), -Math.max(1.2, 0.04 * k), Math.max(5, 0.26 * k), Math.max(2.4, 0.08 * k));
    ctx.restore();
    if (opts.borders !== false && gap !== 0) {
      ctx.beginPath();
      ctx.arc(px, py, Math.max(4, 0.2 * k), 0, TAU);
      ctx.strokeStyle = gap < 0 ? '#38bdf8' : gap > MALAPPOSITION_MM ? '#ff4d4f' : gap > 0.1 ? '#f5b041' : 'rgba(0,0,0,0)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Catheter with ring-down.
  ctx.beginPath();
  ctx.arc(lcx, lcy, 0.5 * k, 0, TAU);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.strokeStyle = 'rgba(230,236,244,0.85)';
  ctx.lineWidth = Math.max(2, 0.1 * k);
  ctx.stroke();
  ctx.restore();

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

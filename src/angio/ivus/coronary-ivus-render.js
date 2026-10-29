// Coronary IVUS Lab · Polar B-Mode Cross-Section, Longitudinal L-Mode & Co-Registration Renderers
// Pure Canvas 2D and SVG rendering functions for intravascular ultrasound simulation.

import { clamp, findTransducerMode } from './coronary-ivus-sim.js';
import { drawAcquiredConsole, drawAcquiredFeature } from './ivus-acquire.js';

const pick = (obj, lang) => (obj && typeof obj === 'object' ? (obj[lang === 'en' ? 'en' : 'tr'] ?? obj.tr ?? '') : String(obj ?? ''));

function setupCanvas(canvas, logicalW, logicalH) {
  if (!canvas) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetW = Math.round(logicalW * dpr);
  const targetH = Math.round(logicalH * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

// Deterministic pseudo-random speckle helper
function hashNoise(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Renders the Co-Registered Coronary Angiogram SVG with pullback path and transducer cursor.
 */
export function renderIvusAngioCoRegSvg(caseObj, state = {}, lang = 'tr') {
  const isTr = lang === 'tr';
  const len = caseObj?.pullbackLengthMm || 40;
  const posMm = clamp(state.posMm ?? 20, 0, len);
  const stentActive = Boolean(state.stentDeployed || caseObj?.lesion?.preStented);

  // Map pullback posMm (0 = distal right, 40 = proximal left) to SVG x [470 .. 90]
  const xFromMm = mm => Math.round(470 - (clamp(mm, 0, len) / len) * 380);
  const probeX = xFromMm(posMm);
  const distRefX = xFromMm(caseObj?.distalRefMm ?? 6);
  const mlaX = xFromMm(caseObj?.mlaMm ?? 20);
  const proxRefX = xFromMm(caseObj?.proxRefMm ?? 34);

  const les = caseObj?.lesion || {};
  const lesLeftX = xFromMm((les.centerMm ?? 20) + (les.lengthMm ?? 10) * 0.55);
  const lesRightX = xFromMm((les.centerMm ?? 20) - (les.lengthMm ?? 10) * 0.55);
  const lesCenterX = xFromMm(les.centerMm ?? 20);

  const lumenPinch = clamp((1 - (les.minLumenDiamMm ?? 2.2) / 3.5) * 13, 0, 12);

  return `
    <svg viewBox="0 0 540 128" class="ivus-coreg-svg" role="img" aria-label="${isTr ? 'Anjiyografik Ko-Rejistrasyon ve IVUS Kateter Konumu' : 'Angiographic Co-Registration and IVUS Catheter Position'}">
      <defs>
        <linearGradient id="ivus-vessel-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#334155" />
          <stop offset="50%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#334155" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="540" height="128" rx="8" fill="#090d14" />

      <!-- Proximal Ostium / Guide Catheter -->
      <path d="M 16 48 L 76 48 L 76 80 L 16 80 Z" fill="#1e293b" stroke="#64748b" stroke-width="1.5" />
      <text x="46" y="68" fill="#cbd5e1" font-size="10" font-weight="700" text-anchor="middle">6F GUIDE</text>

      <!-- Outer Vessel EEM Tube -->
      <path d="M 76 42 L 492 47 L 492 81 L 76 86 Z" fill="url(#ivus-vessel-wall)" stroke="#475569" stroke-width="1.2" />

      <!-- Contrast-Filled Lumen with Stenosis Pinch -->
      <path d="
        M 76 47
        L ${lesLeftX} 49
        Q ${lesCenterX} ${49 + lumenPinch} ${lesRightX} 50
        L 492 52
        L 492 76
        L ${lesRightX} 78
        Q ${lesCenterX} ${79 - lumenPinch} ${lesLeftX} 79
        L 76 81 Z
      " fill="#1e3a5f" stroke="#38bdf8" stroke-width="1" opacity="0.85" />

      <!-- Plaque Shoulder Fill -->
      ${lumenPinch > 1.5 ? `
        <path d="M ${lesLeftX} 45 Q ${lesCenterX} ${49 + lumenPinch} ${lesRightX} 46 L ${lesLeftX} 45 Z" fill="${les.calciumArcDeg >= 90 ? '#e2e8f0' : '#eab308'}" opacity="0.85" />
        <path d="M ${lesLeftX} 83 Q ${lesCenterX} ${79 - lumenPinch} ${lesRightX} 82 L ${lesLeftX} 83 Z" fill="${les.calciumArcDeg >= 90 ? '#cbd5e1' : '#ca8a04'}" opacity="0.85" />
      ` : ''}

      <!-- Side Branches -->
      ${(caseObj?.sideBranches || []).map(sb => {
        const sbX = xFromMm(sb.posMm);
        return `
          <path d="M ${sbX - 5} 45 L ${sbX + 14} 16 L ${sbX + 22} 16 L ${sbX + 4} 45 Z" fill="#1e3a5f" stroke="#38bdf8" stroke-width="0.9" />
          <text x="${sbX + 18}" y="13" fill="#7dd3fc" font-size="9.5" font-weight="600" text-anchor="middle">${pick(sb.name, lang)}</text>
        `;
      }).join('')}

      <!-- Deployed Stent Mesh -->
      ${stentActive ? `
        <rect x="${lesLeftX - 10}" y="47" width="${Math.max(24, lesRightX - lesLeftX + 20)}" height="34" rx="3" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 3" />
      ` : ''}

      <!-- Bookmark Reference Lines -->
      <line x1="${proxRefX}" y1="30" x2="${proxRefX}" y2="98" stroke="#22c55e" stroke-width="1" stroke-dasharray="3 2" />
      <text x="${proxRefX}" y="25" fill="#4ade80" font-size="9.5" font-weight="700" text-anchor="middle">${isTr ? 'Proks Ref' : 'Prox Ref'}</text>

      <line x1="${mlaX}" y1="30" x2="${mlaX}" y2="98" stroke="#f43f5e" stroke-width="1" stroke-dasharray="3 2" />
      <text x="${mlaX}" y="25" fill="#fb7185" font-size="9.5" font-weight="700" text-anchor="middle">MLA</text>

      <line x1="${distRefX}" y1="30" x2="${distRefX}" y2="98" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3 2" />
      <text x="${distRefX}" y="25" fill="#38bdf8" font-size="9.5" font-weight="700" text-anchor="middle">${isTr ? 'Distal Ref' : 'Distal Ref'}</text>

      <!-- 0.014" Guidewire + IVUS Catheter Transducer -->
      <line x1="76" y1="64" x2="512" y2="64" stroke="#94a3b8" stroke-width="1.3" />
      <line x1="${probeX}" y1="22" x2="${probeX}" y2="106" stroke="#facc15" stroke-width="2" />
      <circle cx="${probeX}" cy="64" r="5.5" fill="#facc15" stroke="#090d14" stroke-width="1.8" />
      <rect x="${clamp(probeX - 34, 80, 445)}" y="103" width="68" height="18" rx="4" fill="#facc15" />
      <text x="${clamp(probeX, 114, 479)}" y="115" fill="#090d14" font-size="10" font-weight="700" text-anchor="middle">${posMm.toFixed(1)} mm</text>

      <text x="84" y="116" fill="#94a3b8" font-size="9.5">${isTr ? '← Proksimal (40 mm)' : '← Proximal (40 mm)'}</text>
      <text x="526" y="116" fill="#94a3b8" font-size="9.5" text-anchor="end">${isTr ? 'Distal (0 mm) →' : 'Distal (0 mm) →'}</text>
    </svg>
  `;
}

/**
 * Renders the 2D Polar B-Mode Intravascular Ultrasound Cross-Section Canvas.
 */
export function renderIvusCrossSectionCanvas(canvas, slice, caseObj, state = {}, lang = 'tr') {
  const W = 440;
  const H = 440;
  const ctx = setupCanvas(canvas, W, H);
  if (!ctx || !slice) return;

  const isTr = lang === 'tr';
  const cx = W / 2;
  const cy = H / 2;
  const pxPerMm = 58; // 3.5 mm radius = 203 px (7 mm diameter full FOV)
  const txMode = findTransducerMode(state.transducerMode);
  const phase = Number(state.phaseOffset) || 0;

  // 1. Dark ultrasound background
  ctx.fillStyle = '#05070b';
  ctx.fillRect(0, 0, W, H);

  // Circular ultrasound field mask
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 204, 0, Math.PI * 2);
  ctx.clip();

  const radialGradient = ctx.createRadialGradient(cx, cy, 12, cx, cy, 204);
  radialGradient.addColorStop(0, '#131922');
  radialGradient.addColorStop(0.65, '#19212c');
  radialGradient.addColorStop(1, '#090d13');
  ctx.fillStyle = radialGradient;
  ctx.fillRect(0, 0, W, H);

  // Acquired-looking frame by default (ivus-acquire.js); state.renderStyle 'vector' keeps the drawing.
  const acquired = state.renderStyle !== 'vector';
  if (!acquired) {
  // 2. Surrounding perivascular / adventitial speckle texture
  const numSpeckles = txMode.freqMhz >= 60 ? 520 : 380;
  for (let i = 0; i < numSpeckles; i += 1) {
    const ang = hashNoise(i * 1.7 + Math.floor(slice.posMm * 2)) * Math.PI * 2;
    const distMm = 0.9 + hashNoise(i * 3.1 + 19) * 2.55;
    const rPx = distMm * pxPerMm;
    const sx = cx + Math.cos(ang) * rPx;
    const sy = cy + Math.sin(ang) * rPx;
    const lum = Math.round(70 + hashNoise(i * 5.3) * 95);
    ctx.fillStyle = `rgba(${lum}, ${lum + 6}, ${lum + 14}, 0.34)`;
    ctx.fillRect(sx, sy, 2.2, 2.2);
  }

  }
  // Compute EEM and Lumen contours across 96 polar angles
  const N = 96;
  const eemRx = (slice.eemDiamMm / 2) * pxPerMm;
  const eemRy = (slice.eemDiamMm / 2) * pxPerMm * (state.obliqueSlice ? 1.22 : 1.0);
  const lumRx = (slice.dMax / 2) * pxPerMm;
  const lumRy = (slice.dMin / 2) * pxPerMm;

  // Eccentricity shifts lumen slightly toward 7 o'clock (away from plaque center at 1 o'clock)
  const plaqueCenterAng = -Math.PI * 0.28; // ~1:30 o'clock
  const eccShiftPx = (slice.eccentricityOffset || 0) * 26;
  const lumCx = cx - Math.cos(plaqueCenterAng) * eccShiftPx;
  const lumCy = cy - Math.sin(plaqueCenterAng) * eccShiftPx;

  const eemPts = [];
  const mediaInnerPts = [];
  const lumPts = [];

  for (let i = 0; i < N; i += 1) {
    const a = (i / N) * Math.PI * 2;
    const nurdWarp = state.nurdActive ? Math.sin(a * 2) * 8 : 0;
    const erx = eemRx + nurdWarp;
    const ery = eemRy - nurdWarp * 0.5;
    const ex = cx + Math.cos(a) * erx;
    const ey = cy + Math.sin(a) * ery;
    eemPts.push({ x: ex, y: ey, a });

    // Media thickness ~ 7 px inside EEM
    mediaInnerPts.push({
      x: cx + Math.cos(a) * (erx - 7),
      y: cy + Math.sin(a) * (ery - 7),
      a
    });

    // Calcium nodule protrusion into lumen around plaqueCenterAng
    let noduleIndent = 0;
    if (slice.calcifiedNodule) {
      const dAng = Math.atan2(Math.sin(a - plaqueCenterAng), Math.cos(a - plaqueCenterAng));
      if (Math.abs(dAng) < 0.45) {
        noduleIndent = Math.cos((dAng / 0.45) * (Math.PI / 2)) * 18;
      }
    }

    const lx = lumCx + Math.cos(a) * Math.max(20, lumRx - noduleIndent);
    const ly = lumCy + Math.sin(a) * Math.max(20, lumRy - noduleIndent);
    lumPts.push({ x: lx, y: ly, a });
  }

  if (acquired) {
    drawAcquiredConsole(ctx, { cx, cy, pxPerMm, size: W, fovPx: 204, slice, state, mhz: txMode.freqMhz, eemPts, mediaInnerPts, lumPts, lumCx, lumCy, plaqueCenterAng, time: (globalThis.performance?.now?.() ?? 0) });
  } else {
  // 3. Optional Myocardial Bridge "Half-Moon" echolucent halo outside adventitia
  if (slice.halfMoonBridge) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, eemRx + 24, -Math.PI * 0.85, Math.PI * 0.15);
    ctx.arc(cx, cy, eemRx + 5, Math.PI * 0.15, -Math.PI * 0.85, true);
    ctx.closePath();
    ctx.fillStyle = 'rgba(4, 7, 12, 0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // 4. Outer Bright Adventitia Onion-Skin Ring
  ctx.beginPath();
  eemPts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.62)';
  ctx.lineWidth = 9;
  ctx.stroke();

  // 5. Dark Echolucent Media Ring (EEM interface)
  ctx.beginPath();
  eemPts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = '#0c1118';
  ctx.fill();

  // 6. Plaque + Intima Compartment
  ctx.beginPath();
  mediaInnerPts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  if (slice.plaqueType === 'attenuated') {
    ctx.fillStyle = '#334155';
  } else if (slice.plaqueType === 'normal') {
    ctx.fillStyle = '#64748b';
  } else {
    ctx.fillStyle = '#526071';
  }
  ctx.fill();

  // Add fibrous / soft plaque internal speckle
  ctx.save();
  ctx.beginPath();
  mediaInnerPts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < 260; i += 1) {
    const ang = hashNoise(i * 2.3 + 7) * Math.PI * 2;
    const r = (0.3 + hashNoise(i * 4.1 + 3) * 0.7) * eemRx;
    const px = cx + Math.cos(ang) * r;
    const py = cy + Math.sin(ang) * r;
    const b = slice.plaqueType === 'attenuated' ? 95 : 145;
    ctx.fillStyle = `rgba(${b}, ${b + 10}, ${b + 18}, 0.38)`;
    ctx.fillRect(px, py, 2.5, 2.5);
  }

  // Dissection / Intramural Hematoma crescent inside media
  if (slice.dissectionArcDeg > 0) {
    const halfDis = ((slice.dissectionArcDeg / 2) * Math.PI) / 180;
    ctx.beginPath();
    ctx.arc(cx, cy, eemRx - 3, plaqueCenterAng - halfDis, plaqueCenterAng + halfDis);
    ctx.arc(lumCx, lumCy, lumRx + 4, plaqueCenterAng + halfDis, plaqueCenterAng - halfDis, true);
    ctx.closePath();
    ctx.fillStyle = '#111827';
    ctx.fill();
  }
  ctx.restore();

  // 7. Side Branch Takeoff Gap (if present at this slice)
  if (slice.activeSideBranch) {
    const sbAng = (((slice.activeSideBranch.clockHour || 2) - 3) / 12) * Math.PI * 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(lumCx, lumCy);
    ctx.arc(cx, cy, 204, sbAng - 0.24, sbAng + 0.24);
    ctx.closePath();
    ctx.fillStyle = '#0b1017';
    ctx.fill();
    ctx.restore();
  }

  // 8. Acoustic Shadowing & Bright Leading Calcium / Attenuated Plaque
  if (slice.calciumArcDeg > 0 || slice.attenuationArcDeg > 0) {
    const arcDeg = slice.calciumArcDeg > 0 ? slice.calciumArcDeg : slice.attenuationArcDeg;
    const halfArc = ((arcDeg / 2) * Math.PI) / 180;
    const aStart = plaqueCenterAng - halfArc;
    const aEnd = plaqueCenterAng + halfArc;
    const caRadius = slice.calciumSuperficial ? lumRx + 7 : (lumRx + eemRx) * 0.52;

    // Dorsal dark acoustic shadow behind calcium or attenuated lipid core
    ctx.save();
    ctx.beginPath();
    ctx.arc(lumCx, lumCy, caRadius + 3, aStart, aEnd);
    ctx.arc(cx, cy, 204, aEnd, aStart, true);
    ctx.closePath();
    ctx.fillStyle = slice.calciumArcDeg > 0 ? 'rgba(3, 5, 9, 0.93)' : 'rgba(6, 9, 15, 0.85)';
    ctx.fill();

    // Ivory-white leading calcium arc + reverberation ghost arcs
    if (slice.calciumArcDeg > 0) {
      ctx.beginPath();
      ctx.arc(lumCx, lumCy, caRadius, aStart, aEnd);
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = slice.calcifiedNodule ? 9 : 6.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Reverberation arcs at 1.45x and 1.85x radius inside shadow
      for (const mult of [1.42, 1.78]) {
        const revR = caRadius * mult;
        if (revR < 198) {
          ctx.beginPath();
          ctx.arc(lumCx, lumCy, revR, aStart + 0.08, aEnd - 0.08);
          ctx.strokeStyle = mult < 1.6 ? 'rgba(226, 232, 240, 0.42)' : 'rgba(226, 232, 240, 0.22)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  // 9. Vessel Lumen & Blood Speckle / ChromaFlo / Saline Flush
  ctx.beginPath();
  lumPts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = state.salineFlush ? '#05070c' : '#0b1018';
  ctx.fill();

  // Bright Intimal Leading Edge (when normal or fibrous)
  ctx.beginPath();
  lumPts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Intraluminal Thrombus lobulated mass (for ACS case)
  if (slice.thrombus) {
    ctx.save();
    ctx.beginPath();
    const thX = lumCx + Math.cos(plaqueCenterAng) * (lumRx * 0.55);
    const thY = lumCy + Math.sin(plaqueCenterAng) * (lumRy * 0.55);
    ctx.arc(thX, thY, 18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.58)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  // Intraluminal Dissection Flap
  if (slice.dissectionArcDeg > 0) {
    const fStart = plaqueCenterAng - 0.45;
    const fEnd = plaqueCenterAng + 0.35;
    ctx.beginPath();
    ctx.arc(lumCx, lumCy, lumRx - 6, fStart, fEnd);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.8;
    ctx.stroke();
  }

  // Animated blood speckle or ChromaFlo inside lumen
  if (!state.salineFlush) {
    ctx.save();
    ctx.beginPath();
    lumPts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.clip();

    if (state.chromaFlo) {
      const cfGrad = ctx.createRadialGradient(lumCx, lumCy, 14, lumCx, lumCy, Math.max(lumRx, lumRy));
      cfGrad.addColorStop(0, 'rgba(250, 204, 21, 0.72)');
      cfGrad.addColorStop(0.6, 'rgba(239, 68, 68, 0.65)');
      cfGrad.addColorStop(1, 'rgba(153, 27, 27, 0.25)');
      ctx.fillStyle = cfGrad;
      ctx.fillRect(0, 0, W, H);
    } else {
      const speckleCount = state.stasisActive ? 220 : 95;
      for (let i = 0; i < speckleCount; i += 1) {
        const ang = (hashNoise(i * 1.9) * Math.PI * 2 + phase * 2.4) % (Math.PI * 2);
        const rad = (0.25 + hashNoise(i * 3.7) * 0.72) * Math.max(lumRx, lumRy);
        const bx = lumCx + Math.cos(ang) * rad;
        const by = lumCy + Math.sin(ang) * rad;
        ctx.fillStyle = state.stasisActive ? 'rgba(203, 213, 225, 0.52)' : 'rgba(148, 163, 184, 0.24)';
        ctx.fillRect(bx, by, 2, 2);
      }
    }
    ctx.restore();
  }

  // 10. Deployed Metallic Stent Struts (bright punctate reflections around stent circumference)
  if (slice.inStentZone && slice.stentDiamMm > 0) {
    const stentR = (slice.stentDiamMm / 2) * pxPerMm;
    const strutCount = 12;
    for (let s = 0; s < strutCount; s += 1) {
      const sa = (s / strutCount) * Math.PI * 2;
      const sx = lumCx + Math.cos(sa) * stentR;
      const sy = lumCy + Math.sin(sa) * stentR;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(sa + Math.PI / 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3.5, -1.8, 7, 3.6);
      ctx.restore();
    }
    if (state.showLumenOverlay) {
      ctx.beginPath();
      ctx.arc(lumCx, lumCy, stentR, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // 11. Guidewire Echo & Narrow 18° Acoustic Shadow (Mechanical Rotational 40/60 MHz)
  if (txMode.hasWireShadow) {
    const wireAng = Math.PI * 0.68; // ~5 o'clock
    const wireDist = 26;
    const wx = cx + Math.cos(wireAng) * wireDist;
    const wy = cy + Math.sin(wireAng) * wireDist;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.arc(cx, cy, 204, wireAng - 0.13, wireAng + 0.13);
    ctx.closePath();
    ctx.fillStyle = 'rgba(3, 5, 9, 0.86)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(wx, wy, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.restore();
  }

  }
  // 12. Calibration Millimeter Grid Rings (1 mm intervals)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 0.8;
  for (let mm = 1; mm <= 3; mm += 1) {
    ctx.beginPath();
    ctx.arc(cx, cy, mm * pxPerMm, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 13. Central IVUS Catheter & Ring-Down Zone (the acquired frame has its own)
  if (!acquired) {
  if (state.stasisActive || txMode.id === 'phased-20') {
    ctx.beginPath();
    ctx.arc(cx, cy, state.stasisActive ? 22 : 16, 0, Math.PI * 2);
    ctx.strokeStyle = state.stasisActive ? 'rgba(248, 250, 252, 0.75)' : 'rgba(226, 232, 240, 0.35)';
    ctx.lineWidth = state.stasisActive ? 4 : 2;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0, Math.PI * 2);
  ctx.fillStyle = '#020408';
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  }
  // 14. Planimetry Overlays (EEM Trace, Lumen Trace, Diameters, Calcium Arc)
  if (state.showEemOverlay) {
    ctx.beginPath();
    eemPts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (state.showLumenOverlay) {
    ctx.beginPath();
    lumPts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (state.showCalipers) {
    // Dmax horizontal & Dmin vertical across lumen
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(lumCx - lumRx, lumCy);
    ctx.lineTo(lumCx + lumRx, lumCy);
    ctx.moveTo(lumCx, lumCy - lumRy);
    ctx.lineTo(lumCx, lumCy + lumRy);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (state.showCalciumArc && slice.calciumArcDeg > 0) {
    const halfArc = ((slice.calciumArcDeg / 2) * Math.PI) / 180;
    ctx.beginPath();
    ctx.arc(lumCx, lumCy, eemRx + 14, plaqueCenterAng - halfArc, plaqueCenterAng + halfArc);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.restore(); // end circular clip

  // Outer Bezel Ring
  ctx.beginPath();
  ctx.arc(cx, cy, 204, 0, Math.PI * 2);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.stroke();

  // HUD Corner Annotations
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 11.5px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(`${txMode.freqMhz} MHz · x=${slice.posMm.toFixed(1)} mm`, 12, 20);

  ctx.fillStyle = '#22c55e';
  ctx.fillText(`${isTr ? 'Lümen' : 'Lumen'}: ${slice.lumenAreaMm2.toFixed(2)} mm² (${slice.dMin.toFixed(2)}×${slice.dMax.toFixed(2)} mm)`, 12, H - 28);
  ctx.fillStyle = '#facc15';
  ctx.fillText(`EEM: ${slice.eemAreaMm2.toFixed(2)} mm² · PB: %${slice.plaqueBurdenPct.toFixed(1)}`, 12, H - 12);

  if (slice.calciumArcDeg > 0) {
    ctx.fillStyle = '#fb7185';
    ctx.textAlign = 'right';
    ctx.fillText(`Ca Ark: ${slice.calciumArcDeg}°`, W - 12, 20);
    ctx.textAlign = 'left';
  }
}

/**
 * Renders the Longitudinal IVUS Reconstruction (L-Mode / LongView) Canvas across 0..40 mm.
 */
export function renderIvusLongitudinalCanvas(canvas, profile, caseObj, state = {}, lang = 'tr') {
  const W = 620;
  const H = 195;
  const ctx = setupCanvas(canvas, W, H);
  if (!ctx || !profile?.frames?.length) return;

  const isTr = lang === 'tr';
  const len = caseObj?.pullbackLengthMm || 40;
  const padL = 44;
  const padR = 20;
  const plotW = W - padL - padR;
  const midY = 96;
  const pxPerMmY = 15.5; // radius scaling

  // Map pullback posMm (40 = left proximal, 0 = right distal) to match angiogram orientation
  const xForMm = mm => padL + ((len - clamp(mm, 0, len)) / len) * plotW;

  ctx.fillStyle = '#070a10';
  ctx.fillRect(0, 0, W, H);

  // Adventitial background bands
  ctx.fillStyle = '#141c27';
  ctx.fillRect(padL, 18, plotW, H - 42);

  const frames = profile.frames;

  // 1. EEM Contour Fill (Dark Media / Plaque)
  ctx.beginPath();
  frames.forEach((f, idx) => {
    const x = xForMm(f.posMm);
    const y = midY - (f.eemDiamMm / 2) * pxPerMmY;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  for (let i = frames.length - 1; i >= 0; i -= 1) {
    const f = frames[i];
    const x = xForMm(f.posMm);
    const y = midY + (f.eemDiamMm / 2) * pxPerMmY;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#475569';
  ctx.fill();

  // 2. Lumen Contour Fill
  ctx.beginPath();
  frames.forEach((f, idx) => {
    const x = xForMm(f.posMm);
    const y = midY - (f.dMin / 2) * pxPerMmY;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  for (let i = frames.length - 1; i >= 0; i -= 1) {
    const f = frames[i];
    const x = xForMm(f.posMm);
    const y = midY + (f.dMax / 2) * pxPerMmY;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = state.chromaFlo ? 'rgba(185, 28, 28, 0.55)' : '#090d14';
  ctx.fill();

  // 3. Calcium bright top/bottom bars & dorsal shadow in L-mode
  frames.forEach(f => {
    if (f.calciumArcDeg >= 60) {
      const x = xForMm(f.posMm);
      const yTop = midY - (f.dMin / 2) * pxPerMmY - 3;
      ctx.fillStyle = 'rgba(3, 5, 9, 0.85)';
      ctx.fillRect(x - 4, 18, 8, Math.max(0, yTop - 18));
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x - 4, yTop, 8, 4);
    }
  });

  // 4. Stent Strut dashes along stented zone
  frames.forEach((f, idx) => {
    if (f.inStentZone && idx % 2 === 0) {
      const x = xForMm(f.posMm);
      const rPx = (f.stentDiamMm / 2) * pxPerMmY;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x - 2, midY - rPx - 1.5, 4, 3);
      ctx.fillRect(x - 2, midY + rPx - 1.5, 4, 3);
    }
  });

  // 5. EEM & Lumen Overlay Lines
  if (state.showEemOverlay) {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    frames.forEach((f, idx) => {
      const x = xForMm(f.posMm);
      const y = midY - (f.eemDiamMm / 2) * pxPerMmY;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.beginPath();
    frames.forEach((f, idx) => {
      const x = xForMm(f.posMm);
      const y = midY + (f.eemDiamMm / 2) * pxPerMmY;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  if (state.showLumenOverlay) {
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    frames.forEach((f, idx) => {
      const x = xForMm(f.posMm);
      const y = midY - (f.dMin / 2) * pxPerMmY;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.beginPath();
    frames.forEach((f, idx) => {
      const x = xForMm(f.posMm);
      const y = midY + (f.dMax / 2) * pxPerMmY;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  // Central Catheter Axis Line
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(padL, midY);
  ctx.lineTo(padL + plotW, midY);
  ctx.stroke();

  // Bookmark vertical lines (Prox Ref, MLA, Distal Ref)
  const bookmarks = [
    { mm: caseObj?.proxRefMm ?? 34, color: '#22c55e', label: isTr ? 'Proks Ref' : 'Prox Ref' },
    { mm: caseObj?.mlaMm ?? 20, color: '#f43f5e', label: 'MLA' },
    { mm: caseObj?.distalRefMm ?? 6, color: '#38bdf8', label: isTr ? 'Distal Ref' : 'Dist Ref' }
  ];
  ctx.font = '700 10px ui-monospace, SFMono-Regular, Menlo, monospace';
  bookmarks.forEach(bm => {
    const bx = xForMm(bm.mm);
    ctx.strokeStyle = bm.color;
    ctx.lineWidth = 1.1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(bx, 18);
    ctx.lineTo(bx, H - 24);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = bm.color;
    ctx.fillText(bm.label, bx - 16, 13);
  });

  // Active Transducer Cursor Line
  const curX = xForMm(state.posMm ?? 20);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(curX, 16);
  ctx.lineTo(curX, H - 22);
  ctx.stroke();

  // Distance Ruler along bottom
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
  for (let mm = 0; mm <= len; mm += 10) {
    const rx = xForMm(mm);
    ctx.fillText(`${mm} mm`, rx - 14, H - 7);
  }
}

/**
 * Renders a standalone preview canvas for the Plaque Morphology Atlas or Artifact QA cards.
 */
export function renderIvusFeaturePreviewCanvas(canvas, featureId, isFixed = false, lang = 'tr') {
  const W = 280;
  const H = 200;
  const ctx = setupCanvas(canvas, W, H);
  if (!ctx) return;

  const cx = W / 2;
  const cy = H / 2;
  // Acquired-looking card image (ivus-acquire.js); the label stays on top.
  if (globalThis.__ivusVectorPreview !== true) {
    drawAcquiredFeature(ctx, W, H, featureId, isFixed, globalThis.performance?.now?.() ?? 0);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 10.5px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(isFixed ? (lang === 'tr' ? 'DÜZELTİLDİ' : 'CORRECTED') : featureId.toUpperCase(), 10, 18);
    return;
  }
  ctx.fillStyle = '#06090f';
  ctx.fillRect(0, 0, W, H);

  // Outer EEM ring
  const rx = featureId === 'oblique-slicing' && !isFixed ? 84 : 68;
  const ry = featureId === 'oblique-slicing' && !isFixed ? 52 : 68;

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx + 6, ry + 6, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.55)';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#475569';
  ctx.fill();

  // Feature-specific pathology or artifact
  if (featureId === 'superficial-calcium' || featureId === 'reverberation') {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 92, -Math.PI * 0.75, -Math.PI * 0.15);
    ctx.closePath();
    ctx.fillStyle = '#030509';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 44, -Math.PI * 0.72, -Math.PI * 0.18);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Reverberation arcs
    ctx.beginPath();
    ctx.arc(cx, cy, 64, -Math.PI * 0.68, -Math.PI * 0.22);
    ctx.strokeStyle = 'rgba(241, 245, 249, 0.45)';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (featureId === 'soft-attenuated') {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 92, -Math.PI * 0.7, -Math.PI * 0.2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(5, 8, 14, 0.88)';
    ctx.fill();
  } else if (featureId === 'nurd' && !isFixed) {
    for (let a = -0.6; a <= 0.6; a += 0.08) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 86, cy + Math.sin(a) * 86);
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Inner Lumen
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.58, ry * 0.58, 0, 0, Math.PI * 2);
  ctx.fillStyle = featureId === 'ringdown-stasis' && !isFixed ? '#334155' : '#090d14';
  ctx.fill();

  if (featureId === 'calcified-nodule') {
    ctx.beginPath();
    ctx.arc(cx + 18, cy - 18, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
  } else if (featureId === 'dissection-hematoma') {
    ctx.beginPath();
    ctx.arc(cx, cy, 38, -0.8, 0.5);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  } else if (featureId === 'wire-shadow') {
    const wa = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(wa) * 18, cy + Math.sin(wa) * 18);
    ctx.arc(cx, cy, 92, wa - 0.14, wa + 0.14);
    ctx.closePath();
    ctx.fillStyle = '#030509';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + Math.cos(wa) * 18, cy + Math.sin(wa) * 18, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  // Central Catheter & Ring-down
  if (featureId === 'ringdown-stasis' && !isFixed) {
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#020408';
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 10.5px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(isFixed ? (lang === 'tr' ? 'DÜZELTİLDİ' : 'CORRECTED') : featureId.toUpperCase(), 10, 18);
}

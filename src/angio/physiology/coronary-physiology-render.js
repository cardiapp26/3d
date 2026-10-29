// Coronary Physiology Lab · HTML5 Canvas & SVG Renderers
// Renders live pressure waveforms, open-vessel cutaway SVG, pullback/PPG charts,
// bolus & continuous thermodilution traces, and spectral Doppler envelopes.

import {
  clamp,
  samplePullbackRatio,
  computePullbackAnalysis,
  samplePressureBeat,
  computeBolusThermodilution,
  sampleBolusCurve,
  computeContinuousThermodilution,
  computeDopplerAssessment
} from './coronary-physiology-sim.js';

function setupHiDpiCanvas(canvas, logicalW, logicalH) {
  const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
  const w = Math.max(200, Math.round(logicalW));
  const h = Math.max(120, Math.round(logicalH));
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  canvas.dataset.logicalW = String(w);
  canvas.dataset.logicalH = String(h);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/**
 * Generates the interactive open-vessel cutaway SVG (with plaques, stent, guide catheter,
 * microcatheter, pressure/Doppler wire, sensor tip, and optional Pd/Pa pullback map).
 */
export function renderVesselCutawaySvg(caseObj, state = {}, lang = 'tr') {
  const isTr = lang === 'tr';
  const sensorMm = clamp(state.sensorMm ?? 75, 0, 80);
  const stentedSet = new Set(state.stentedIds || []);
  const lesions = caseObj?.lesions || [];
  const modality = state.modality || 'epicardial';

  // Map vessel 0..80 mm to x = 76..496 in viewBox 540x250
  const xOfMm = mm => 76 + (clamp(mm, 0, 80) / 80) * 420;
  const centerY = mm => 78 + Math.sin((mm / 80) * Math.PI * 1.15) * 12;

  // Dynamic spasm constriction in Doppler mode when ACh is active
  let spasmFactor = 0;
  if (modality === 'doppler' && state.achStep > 0 && !state.ntgGiven) {
    const dop = computeDopplerAssessment(caseObj, state);
    const diamDelta = dop.activeAch?.diamDeltaPct || 0;
    if (diamDelta < 0) spasmFactor = clamp(Math.abs(diamDelta) / 100, 0, 0.86);
  }

  const halfRadiusAt = mm => {
    const baseR = 22 - (mm / 80) * 6.5; // Taper from 22px proximal to 15.5px distal
    const diffuseNarrow = (caseObj?.diffuseLoss || 0.03) > 0.12 ? 0.22 * clamp((mm - 8) / 65, 0, 1) : 0;
    let plaqueNarrow = 0;
    for (const lesion of lesions) {
      const dist = Math.abs(mm - lesion.posMm);
      const span = Math.max(4, lesion.lengthMm || 7);
      if (dist < span * 1.3) {
        const g = Math.exp(-((dist / (span * 0.55)) ** 2));
        if (stentedSet.has(lesion.id)) {
          plaqueNarrow += (state.underexpanded ? 0.24 : 0.03) * g;
        } else {
          plaqueNarrow += ((lesion.stenosisPct || 70) / 100) * 0.78 * g;
        }
      }
    }
    const totalNarrow = clamp(diffuseNarrow + plaqueNarrow + spasmFactor * 0.82, 0, 0.88);
    return {
      outerR: baseR + 5,
      lumenR: Math.max(2.4, baseR * (1 - totalNarrow)),
      baseR
    };
  };

  const topOuter = [];
  const botOuter = [];
  const topLumen = [];
  const botLumen = [];
  const topAdventitia = [];
  const botAdventitia = [];

  for (let mm = 0; mm <= 80; mm += 2) {
    const x = xOfMm(mm);
    const cy = centerY(mm);
    const { outerR, lumenR, baseR } = halfRadiusAt(mm);
    topOuter.push(`${x.toFixed(1)},${(cy - outerR).toFixed(1)}`);
    botOuter.push(`${x.toFixed(1)},${(cy + outerR).toFixed(1)}`);
    topAdventitia.push(`${x.toFixed(1)},${(cy - baseR).toFixed(1)}`);
    botAdventitia.push(`${x.toFixed(1)},${(cy + baseR).toFixed(1)}`);
    topLumen.push(`${x.toFixed(1)},${(cy - lumenR).toFixed(1)}`);
    botLumen.push(`${x.toFixed(1)},${(cy + lumenR).toFixed(1)}`);
  }

  const outerPolygon = [...topOuter, ...botOuter.reverse()].join(' ');
  const mediaPolygon = [...topAdventitia, ...botAdventitia.reverse()].join(' ');
  const lumenPolygon = [...topLumen, ...botLumen.reverse()].join(' ');

  // Wire centerline path from guide catheter to distal tip
  const wirePts = [];
  for (let mm = 0; mm <= 80; mm += 4) {
    wirePts.push(`${mm === 0 ? 'M' : 'L'}${xOfMm(mm).toFixed(1)} ${(centerY(mm) + 1.5).toFixed(1)}`);
  }

  const sensorX = xOfMm(sensorMm);
  const sensorY = centerY(sensorMm) + 1.5;
  const currentRatio = samplePullbackRatio(caseObj, sensorMm, {
    hyperemia: state.hyperemia,
    stentedIds: state.stentedIds || [],
    underexpanded: state.underexpanded || false,
    microcatheter: state.device === 'mc'
  });

  // Stent struts for stented lesions
  const stentSvg = lesions.filter(l => stentedSet.has(l.id)).map(l => {
    const x1 = xOfMm(l.posMm - l.lengthMm);
    const x2 = xOfMm(l.posMm + l.lengthMm);
    const cy = centerY(l.posMm);
    const r = state.underexpanded ? 11 : 15;
    const struts = [];
    for (let sx = x1; sx <= x2; sx += 6) {
      struts.push(`<line x1="${sx.toFixed(1)}" y1="${(cy - r).toFixed(1)}" x2="${(sx + 3).toFixed(1)}" y2="${(cy + r).toFixed(1)}" stroke="#93c5fd" stroke-width="1.3" opacity="0.85"/>`);
      struts.push(`<line x1="${(sx + 3).toFixed(1)}" y1="${(cy - r).toFixed(1)}" x2="${sx.toFixed(1)}" y2="${(cy + r).toFixed(1)}" stroke="#93c5fd" stroke-width="1.3" opacity="0.85"/>`);
    }
    return `<g class="stent-mesh">
      <rect x="${x1.toFixed(1)}" y="${(cy - r).toFixed(1)}" width="${(x2 - x1).toFixed(1)}" height="${(r * 2).toFixed(1)}" fill="none" stroke="#60a5fa" stroke-width="1.5" stroke-dasharray="3 2" rx="2"/>
      ${struts.join('')}
    </g>`;
  }).join('');

  // Lesion labels
  const labelsSvg = state.showLesionLabels ? lesions.map(l => {
    const lx = xOfMm(l.posMm);
    const ly = centerY(l.posMm) - 34;
    const txt = l.label?.[isTr ? 'tr' : 'en'] || l.id;
    return `<g class="vessel-lesion-tag">
      <line x1="${lx.toFixed(1)}" y1="${(ly + 6).toFixed(1)}" x2="${lx.toFixed(1)}" y2="${(centerY(l.posMm) - 18).toFixed(1)}" stroke="#fbbf24" stroke-width="1.2" stroke-dasharray="2 2"/>
      <rect x="${(lx - 58).toFixed(1)}" y="${(ly - 12).toFixed(1)}" width="116" height="18" rx="4" fill="#18202c" stroke="#fbbf24" stroke-width="1"/>
      <text x="${lx.toFixed(1)}" y="${(ly + 1).toFixed(1)}" text-anchor="middle" fill="#fde68a" font-size="10" font-weight="600">${txt} (-%${l.stenosisPct})</text>
    </g>`;
  }).join('') : '';

  // Microcatheter visual when in continuous thermodilution or Doppler mode or pressure microcatheter selected
  const showMc = (modality === 'continuous' && state.mcPositioned) ||
    (modality === 'doppler' && state.achMcPositioned) ||
    state.device === 'mc';
  const mcEndMm = state.device === 'mc' ? sensorMm : 18;
  const mcEndX = xOfMm(mcEndMm);
  const mcEndY = centerY(mcEndMm);
  const mcSvg = showMc ? `<g class="infusion-mc">
    <path d="M 55 ${centerY(0) - 2} L ${mcEndX.toFixed(1)} ${(mcEndY - 2).toFixed(1)}" stroke="#38bdf8" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
    <circle cx="${(mcEndX - 3).toFixed(1)}" cy="${(mcEndY - 2).toFixed(1)}" r="2.2" fill="#e0f2fe"/>
    ${modality === 'continuous' && state.infusing ? `
      <path d="M ${mcEndX.toFixed(1)} ${(mcEndY - 6).toFixed(1)} Q ${(mcEndX + 28).toFixed(1)} ${(mcEndY - 12).toFixed(1)} ${(mcEndX + 54).toFixed(1)} ${(mcEndY - 4).toFixed(1)}" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="4 3" fill="none" class="phys-saline-jet"/>
      <path d="M ${mcEndX.toFixed(1)} ${(mcEndY + 2).toFixed(1)} Q ${(mcEndX + 28).toFixed(1)} ${(mcEndY + 10).toFixed(1)} ${(mcEndX + 54).toFixed(1)} ${(mcEndY + 3).toFixed(1)}" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="4 3" fill="none" class="phys-saline-jet"/>
    ` : ''}
  </g>` : '';

  // Sensor callout text based on modality
  let sensorCallout = `Pd/Pa ${currentRatio.toFixed(2)}`;
  if (modality === 'continuous' && state.infusing) {
    const cont = computeContinuousThermodilution(caseObj, {
      territory: state.vessel,
      qiRest: state.infusionRate <= 12 ? state.infusionRate : 10,
      qiHyp: state.infusionRate > 12 ? state.infusionRate : 20
    });
    const tempVal = sensorMm <= 20
      ? (state.infusionRate > 12 ? cont.tiHyp : cont.tiRest)
      : (state.infusionRate > 12 ? cont.tHyp : cont.tRest);
    sensorCallout = `${tempVal.toFixed(2)} °C`;
  } else if (modality === 'doppler') {
    const dop = computeDopplerAssessment(caseObj, state);
    const apvNow = state.hyperemia ? dop.apvHyp : (dop.activeAch ? dop.activeAch.apv : dop.apvRest);
    sensorCallout = `APV ${apvNow} cm/s`;
  }

  // Mini Pullback Pd/Pa map at bottom of SVG (y = 152..236)
  const pb = computePullbackAnalysis(caseObj, {
    stentedIds: state.stentedIds || [],
    underexpanded: state.underexpanded || false,
    microcatheter: state.device === 'mc'
  });
  const mapTop = 158;
  const mapBot = 228;
  const yOfFfr = ffr => mapBot - ((clamp(ffr, 0.4, 1.05) - 0.4) / 0.65) * (mapBot - mapTop);
  const pbPath = pb.points
    .filter(pt => pt.xMm >= (state.pullbackDone ? 0 : sensorMm))
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'}${xOfMm(pt.xMm).toFixed(1)} ${yOfFfr(pt.ffr).toFixed(1)}`)
    .join(' ');
  const y80 = yOfFfr(0.80);

  return `<svg class="phys-vessel-svg" viewBox="0 0 540 245" role="img" aria-label="${isTr ? 'Koroner damar kesiti, basınç teli sensörü ve geri çekme haritası' : 'Coronary vessel cross-section, pressure wire sensor, and pullback map'}">
    <defs>
      <linearGradient id="physWallGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7f1d2d"/>
        <stop offset="50%" stop-color="#4c111b"/>
        <stop offset="100%" stop-color="#7f1d2d"/>
      </linearGradient>
      <linearGradient id="physLumenGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#b91c1c"/>
        <stop offset="50%" stop-color="#ef4444"/>
        <stop offset="100%" stop-color="#991b1b"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect x="0" y="0" width="540" height="245" rx="8" fill="#070a0f"/>

    <!-- Header label inside vessel view -->
    <text x="14" y="20" fill="#94a3b8" font-size="11" font-weight="600">${state.vessel || 'LAD'} · ${isTr ? 'Açık Damar Kesiti & Sensör Konumu' : 'Open-Vessel Cutaway & Sensor Position'} (${Math.round(sensorMm)} mm)</text>

    <!-- Outer adventitia & plaque yellow fill -->
    <polygon points="${outerPolygon}" fill="url(#physWallGrad)" stroke="#9f1239" stroke-width="1"/>
    <polygon points="${mediaPolygon}" fill="#d97706" opacity="0.65"/>

    <!-- Patent red blood lumen -->
    <polygon points="${lumenPolygon}" fill="url(#physLumenGrad)"/>

    <!-- Animated blood flow erythrocytes -->
    <path d="${wirePts.join(' ')}" fill="none" stroke="#fca5a5" stroke-width="2.2" stroke-dasharray="4 14" opacity="0.65" class="phys-blood-stream"/>

    <!-- Stent overlay if Virtual PCI active -->
    ${stentSvg}

    <!-- Guide catheter at ostium (left) -->
    <path d="M 8 ${centerY(0) - 9} L 76 ${centerY(0) - 7} L 76 ${centerY(0) + 7} L 8 ${centerY(0) + 9} Z" fill="#475569" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="14" y="${centerY(0) - 14}" fill="#cbd5e1" font-size="9.5" font-weight="600">6F Guide</text>

    <!-- Optional Microcatheter -->
    ${mcSvg}

    <!-- Intracoronary wire -->
    <path d="${wirePts.join(' ')}" fill="none" stroke="#e2e8f0" stroke-width="1.6" opacity="0.9"/>

    <!-- Glowing sensor marker (clickable / draggable target) -->
    <g class="phys-sensor-marker" data-sensor-mm="${Math.round(sensorMm)}">
      <circle cx="${sensorX.toFixed(1)}" cy="${sensorY.toFixed(1)}" r="6.5" fill="#fbbf24" stroke="#070a0f" stroke-width="2"/>
      <rect x="${clamp(sensorX - 44, 72, 444).toFixed(1)}" y="${(sensorY - 31).toFixed(1)}" width="88" height="19" rx="4" fill="#0f172a" stroke="#fbbf24" stroke-width="1"/>
      <text x="${clamp(sensorX, 116, 488).toFixed(1)}" y="${(sensorY - 18).toFixed(1)}" text-anchor="middle" fill="#fde68a" font-size="10.5" font-weight="700">${sensorCallout}</text>
    </g>

    ${labelsSvg}

    <!-- Embedded Hyperemic Pullback Pd/Pa Map -->
    <rect x="64" y="146" width="446" height="90" rx="6" fill="#0b1018" stroke="#1e293b" stroke-width="1"/>
    <text x="74" y="160" fill="#94a3b8" font-size="9.5" font-weight="600">${isTr ? 'HİPEREMİK PULLBACK HARİTASI (Pd/Pa · 0–80 mm)' : 'HYPEREMIC PULLBACK MAP (Pd/Pa · 0–80 mm)'}</text>
    <line x1="76" y1="${y80.toFixed(1)}" x2="496" y2="${y80.toFixed(1)}" stroke="#f87171" stroke-width="1" stroke-dasharray="4 3" opacity="0.7"/>
    <text x="500" y="${(y80 + 3).toFixed(1)}" fill="#f87171" font-size="9" font-weight="600">0.80</text>
    <path d="${pbPath}" fill="none" stroke="#f59e0b" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="${sensorX.toFixed(1)}" cy="${yOfFfr(pb.points[Math.round(sensorMm)]?.ffr ?? 0.95).toFixed(1)}" r="4.5" fill="#38bdf8" stroke="#070a0f" stroke-width="1.5"/>
  </svg>`;
}

/**
 * Renders the live scrolling Pa / Pd / Pd-Pa pressure console canvas.
 */
export function renderPressureConsoleCanvas(canvas, caseObj, state = {}, lang = 'tr') {
  if (!canvas) return;
  const { ctx, w, h } = setupHiDpiCanvas(canvas, canvas.clientWidth || 680, canvas.clientHeight || 250);
  const isTr = lang === 'tr';

  ctx.fillStyle = '#05080d';
  ctx.fillRect(0, 0, w, h);

  const padL = 44;
  const padR = 46;
  const padT = 22;
  const padB = 26;
  const plotW = Math.max(100, w - padL - padR);
  const plotH = Math.max(80, h - padT - padB);

  const yOfP = p => padT + plotH - (clamp(p, 0, 160) / 160) * plotH;
  const yOfR = r => padT + plotH - (clamp(r, 0, 1.2) / 1.2) * plotH;

  // Grid lines
  ctx.strokeStyle = '#141c27';
  ctx.lineWidth = 1;
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
  for (const pVal of [0, 40, 80, 120, 160]) {
    const y = yOfP(pVal);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + plotW, y);
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText(String(pVal), padL - 6, y + 3);
  }

  for (const rVal of [0.4, 0.8, 1.0]) {
    const y = yOfR(rVal);
    ctx.fillStyle = rVal === 0.8 ? '#f59e0b' : '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText(rVal.toFixed(1), padL + plotW + 6, y + 3);
  }

  // Dashed 0.80 threshold line
  const y080 = yOfR(0.80);
  ctx.save();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(padL, y080);
  ctx.lineTo(padL + plotW, y080);
  ctx.stroke();
  ctx.restore();

  // Sample 8 seconds of waveform across plotW
  const totalSec = 7.5;
  const bpm = caseObj?.heartRate ?? 68;
  const beatsPerSec = bpm / 60;
  const phaseOffset = Number(state.phaseOffset) || 0;
  const samples = 240;

  const paPts = [];
  const pdPts = [];
  const ratioPts = [];

  for (let i = 0; i <= samples; i += 1) {
    const frac = i / samples;
    const tSec = frac * totalSec;
    // During active pullback, older samples on the left were more distal, newer on the right approach sensorMm
    const sampleMm = state.pullingBack
      ? clamp(state.sensorMm + (1 - frac) * 32, 0, 80)
      : clamp(state.sensorMm ?? 75, 0, 80);

    const trueRatio = samplePullbackRatio(caseObj, sampleMm, {
      hyperemia: state.hyperemia,
      stentedIds: state.stentedIds || [],
      underexpanded: state.underexpanded || false,
      microcatheter: state.device === 'mc'
    });

    const beatPhase = (tSec * beatsPerSec + phaseOffset) % 1;
    const beat = samplePressureBeat(beatPhase, {
      sys: caseObj?.cuff?.[0] ?? 134,
      dia: caseObj?.cuff?.[1] ?? 76,
      trueRatio,
      hyperemia: state.hyperemia,
      artifact: caseObj?.artifact || 'none',
      artifactFixed: state.artifactFixed
    });

    const x = padL + frac * plotW;
    paPts.push([x, yOfP(beat.pa)]);
    pdPts.push([x, yOfP(beat.pd + (state.equalized ? 0 : 3.5))]);
    ratioPts.push([x, yOfR(trueRatio)]);
  }

  const strokeCurve = (pts, color, width = 1.8) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    pts.forEach(([x, y], idx) => {
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  strokeCurve(paPts, '#f1f5f9', 1.8);
  strokeCurve(pdPts, '#38bdf8', 2.0);
  strokeCurve(ratioPts, '#f59e0b', 2.0);

  // Legend top-left
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f1f5f9';
  ctx.fillText('● Pa (mmHg)', padL + 8, 15);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('● Pd (mmHg)', padL + 95, 15);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('● Pd/Pa', padL + 185, 15);

  if (state.hyperemia) {
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'right';
    ctx.fillText(isTr ? '● MAKSİMAL HİPEREMİ AKTİF' : '● MAXIMAL HYPEREMIA ACTIVE', padL + plotW - 6, 15);
  }
}

/**
 * Renders the modality-specific secondary analysis canvas:
 * - epicardial: Pullback curve + PPG + Virtual PCI overlay
 * - bolus: Bolus thermodilution curves
 * - continuous: Continuous thermodilution T & Ti temperature trace
 * - doppler: Baseline & Hyperemia/ACh spectral Doppler envelope + ECG
 */
export function renderModalityDetailCanvas(canvas, modality, caseObj, state = {}, lang = 'tr') {
  if (!canvas) return;
  const { ctx, w, h } = setupHiDpiCanvas(canvas, canvas.clientWidth || 640, canvas.clientHeight || 220);
  const isTr = lang === 'tr';

  ctx.fillStyle = '#060a10';
  ctx.fillRect(0, 0, w, h);

  const padL = 46;
  const padR = 24;
  const padT = 26;
  const padB = 28;
  const plotW = Math.max(100, w - padL - padR);
  const plotH = Math.max(80, h - padT - padB);

  if (modality === 'epicardial') {
    const basePb = computePullbackAnalysis(caseObj, {
      stentedIds: [],
      underexpanded: false,
      microcatheter: state.device === 'mc'
    });
    const currentPb = computePullbackAnalysis(caseObj, {
      stentedIds: state.stentedIds || [],
      underexpanded: state.underexpanded || false,
      microcatheter: state.device === 'mc'
    });

    const xOfMm = mm => padL + (mm / 80) * plotW;
    const yOfFfr = ffr => padT + plotH - ((clamp(ffr, 0.4, 1.02) - 0.4) / 0.62) * plotH;

    // Highlight 20mm max drop window
    const winX1 = xOfMm(currentPb.maxWindowStart);
    const winX2 = xOfMm(currentPb.maxWindowStart + 20);
    ctx.fillStyle = 'rgba(52, 211, 153, 0.09)';
    ctx.fillRect(winX1, padT, winX2 - winX1, plotH);

    // Grid
    ctx.strokeStyle = '#16202e';
    ctx.lineWidth = 1;
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    for (const fVal of [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]) {
      const y = yOfFfr(fVal);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillStyle = fVal === 0.8 ? '#f87171' : '#64748b';
      ctx.textAlign = 'right';
      ctx.fillText(fVal.toFixed(2), padL - 6, y + 3);
    }

    // Per-mm drop histogram bars at bottom
    currentPb.dropsPerMm.forEach(item => {
      const bx = xOfMm(item.xMm);
      const barH = clamp(item.dFfr * 1400, 0, plotH * 0.45);
      ctx.fillStyle = item.dFfr >= 0.0015 ? 'rgba(244, 114, 182, 0.42)' : 'rgba(148, 163, 184, 0.18)';
      ctx.fillRect(bx - 1.5, padT + plotH - barH, 3, barH);
    });

    // If stented, draw pre-PCI curve dashed
    if ((state.stentedIds || []).length > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      basePb.points.forEach((pt, idx) => {
        const x = xOfMm(pt.xMm);
        const y = yOfFfr(pt.ffr);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    }

    // Active hyperemic pullback curve
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    currentPb.points.forEach((pt, idx) => {
      const x = xOfMm(pt.xMm);
      const y = yOfFfr(pt.ffr);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'left';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillText(
      isTr
        ? `Pullback Eğrisi · PPG ${currentPb.ppg.toFixed(2)} (${currentPb.ppg >= 0.62 ? 'Fokal' : 'Diffüz'})`
        : `Pullback Curve · PPG ${currentPb.ppg.toFixed(2)} (${currentPb.ppg >= 0.62 ? 'Focal' : 'Diffuse'})`,
      padL + 6,
      16
    );
    return;
  }

  if (modality === 'bolus') {
    const bolus = computeBolusThermodilution(caseObj, { territory: state.vessel });
    const xOfT = t => padL + (t / 5.0) * plotW;
    const yOfTemp = deg => padT + 14 - (clamp(deg, -2.4, 0.2) / 2.6) * (plotH - 18);

    ctx.strokeStyle = '#16202e';
    ctx.lineWidth = 1;
    for (const deg of [0, -0.5, -1.0, -1.5, -2.0]) {
      const y = yOfTemp(deg);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${deg.toFixed(1)}°C`, padL - 5, y + 3);
    }

    const drawDilutionSet = (trials, color, amp) => {
      trials.forEach((tmn, idx) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = idx === 0 ? 2.2 : 1.4;
        ctx.beginPath();
        for (let i = 0; i <= 120; i += 1) {
          const t = (i / 120) * 5.0;
          const deg = sampleBolusCurve(t, tmn, amp * (1 - idx * 0.05));
          const x = xOfT(t);
          const y = yOfTemp(deg);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
    };

    drawDilutionSet(bolus.restTrials, '#38bdf8', -1.45);
    drawDilutionSet(bolus.hypTrials, '#f472b6', -1.95);

    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${isTr ? '● İstirahat Tmn' : '● Rest Tmn'}: ${bolus.tmnRest.toFixed(2)} s`, padL + 6, 16);
    ctx.fillStyle = '#f472b6';
    ctx.fillText(`${isTr ? '● Hiperemi Tmn' : '● Hyperemia Tmn'}: ${bolus.tmnHyp.toFixed(2)} s`, padL + 175, 16);
    return;
  }

  if (modality === 'continuous') {
    const cont = computeContinuousThermodilution(caseObj, {
      territory: state.vessel,
      qiRest: 10,
      qiHyp: 20
    });
    const yOfTemp = deg => padT + 12 - (clamp(deg, -4.0, 0.2) / 4.2) * (plotH - 16);

    ctx.strokeStyle = '#16202e';
    ctx.lineWidth = 1;
    for (const deg of [0, -1, -2, -3, -4]) {
      const y = yOfTemp(deg);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${deg.toFixed(1)}°C`, padL - 5, y + 3);
    }

    // Continuous thermodilution dual-step temperature curve (0..100% width)
    // Segment 1 (0..0.38): distal T at 10 mL/min; Segment 2 (0.38..0.68): distal T at 20 mL/min; Segment 3 (0.68..0.92): pullback Ti at tip
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i <= 160; i += 1) {
      const u = i / 160;
      let targetT = 0;
      if (u > 0.06 && u <= 0.38) targetT = cont.tRest;
      else if (u > 0.38 && u <= 0.68) targetT = cont.tHyp;
      else if (u > 0.68 && u <= 0.84) targetT = state.sensorMm <= 20 ? cont.tiHyp : cont.tHyp;
      else if (u > 0.84 && u <= 0.95) targetT = state.sensorMm <= 20 ? cont.tiRest : cont.tRest;

      const ripple = Math.sin(i * 0.45) * 0.03;
      const x = padL + u * plotW;
      const y = yOfTemp(targetT + ripple);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(
      `T (10 mL/min): ${cont.tRest.toFixed(2)}°C  ·  T (20 mL/min): ${cont.tHyp.toFixed(2)}°C  ·  Ti (tip): ${cont.tiHyp.toFixed(2)}°C`,
      padL + 6,
      16
    );
    return;
  }

  if (modality === 'doppler') {
    const dop = computeDopplerAssessment(caseObj, state);
    const halfW = (plotW - 18) / 2;

    const drawSpectrumBox = (x0, boxW, title, apvVal, ecgMode) => {
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(x0, padT, boxW, plotH);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 10.5px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${title} · APV ${apvVal} cm/s`, x0 + 8, padT + 14);

      const baseLineY = padT + plotH - 12;
      const maxVel = 150;
      const yOfVel = v => baseLineY - (clamp(v, 0, maxVel) / maxVel) * (plotH - 42);

      // Draw spectral envelope & speckle fill over 3 cardiac cycles
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 90; i += 1) {
        const u = i / 90;
        const beatP = (u * 3) % 1;
        // Coronary flow is diastolic-predominant
        const sysComp = 0.35 * Math.exp(-(((beatP - 0.18) / 0.08) ** 2));
        const diaComp = 1.05 * Math.exp(-(((beatP - 0.58) / 0.22) ** 2));
        const vInst = apvVal * (0.35 + sysComp + diaComp);
        const x = x0 + 4 + u * (boxW - 8);
        const y = yOfVel(vInst);

        ctx.fillStyle = 'rgba(226, 232, 240, 0.22)';
        ctx.fillRect(x, y, 2, baseLineY - y);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Mini ECG trace at top of spectrum
      ctx.strokeStyle = ecgMode === 'st-elevation' ? '#f87171' : ecgMode === 'st-depression' ? '#fbbf24' : '#34d399';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i <= 90; i += 1) {
        const u = i / 90;
        const bp = (u * 3) % 1;
        const qrs = Math.exp(-(((bp - 0.12) / 0.018) ** 2)) * 12;
        const stShift = (bp > 0.16 && bp < 0.42)
          ? (ecgMode === 'st-elevation' ? 5.5 : ecgMode === 'st-depression' ? -4.5 : 0)
          : 0;
        const tWave = Math.exp(-(((bp - 0.36) / 0.06) ** 2)) * 4;
        const x = x0 + 4 + u * (boxW - 8);
        const y = padT + 30 - qrs - stShift - tWave;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    drawSpectrumBox(padL, halfW, isTr ? 'Bazal İstirahat' : 'Baseline Rest', dop.apvRest, 'normal');

    const rightTitle = dop.activeAch && !state.ntgGiven
      ? `ACh (${dop.activeAch.dose.toUpperCase()})`
      : (isTr ? 'Pik Hiperemi (Adenozin)' : 'Peak Hyperemia (Adenosine)');
    const rightApv = dop.activeAch && !state.ntgGiven ? dop.activeAch.apv : dop.apvHyp;
    const rightEcg = dop.activeAch && !state.ntgGiven ? dop.activeAch.ecg : 'normal';

    drawSpectrumBox(padL + halfW + 18, halfW, rightTitle, rightApv, rightEcg);
  }
}

/**
 * Renders the Simulator Canvas (Autoregulation Pressure-Flow curve or Live Hemodynamic Circuit).
 */
export function renderSimulatorCanvas(canvas, simResult, figMode = 'pq', stateMode = 'hyp', lang = 'tr') {
  if (!canvas || !simResult) return;
  const { ctx, w, h } = setupHiDpiCanvas(canvas, canvas.clientWidth || 640, canvas.clientHeight || 280);
  const isTr = lang === 'tr';

  ctx.fillStyle = '#060a10';
  ctx.fillRect(0, 0, w, h);

  const padL = 52;
  const padR = 26;
  const padT = 28;
  const padB = 34;
  const plotW = Math.max(120, w - padL - padR);
  const plotH = Math.max(90, h - padT - padB);

  const xOfP = p => padL + ((clamp(p, 20, 140) - 20) / 120) * plotW;
  const yOfQ = q => padT + plotH - (clamp(q, 0, 380) / 380) * plotH;

  // Grid
  ctx.strokeStyle = '#16202e';
  ctx.lineWidth = 1;
  ctx.font = '10px ui-monospace, monospace';
  for (const qVal of [0, 100, 200, 300]) {
    const y = yOfQ(qVal);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + plotW, y);
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText(`${qVal}`, padL - 6, y + 3);
  }
  for (const pVal of [40, 60, 80, 100, 120, 140]) {
    const x = xOfP(pVal);
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText(`${pVal} mmHg`, x, padT + plotH + 18);
  }

  // Normal maximal hyperemic line (dashed)
  ctx.save();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  simResult.pqCurve.forEach((pt, idx) => {
    const x = xOfP(pt.pressure);
    const y = yOfQ(pt.qMaxNormal);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();

  // Current hyperemic pressure-flow line
  ctx.strokeStyle = '#f472b6';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  simResult.pqCurve.forEach((pt, idx) => {
    const x = xOfP(pt.pressure);
    const y = yOfQ(pt.qMaxCurrent);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Resting autoregulation plateau curve
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  simResult.pqCurve.forEach((pt, idx) => {
    const x = xOfP(pt.pressure);
    const y = yOfQ(pt.qRest);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Operating points: Rest (Pd_rest, Q_rest) & Hyperemia (Pd_hyp, Q_hyp)
  const rx = xOfP(simResult.pdRest);
  const ry = yOfQ(simResult.qRest);
  const hx = xOfP(simResult.pdHyp);
  const hy = yOfQ(simResult.qHyp);

  // Vertical CFR connector
  ctx.save();
  ctx.strokeStyle = '#fbbf24';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(hx, ry);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.restore();

  // Draw dots
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(rx, ry, stateMode === 'rest' ? 6.5 : 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.arc(hx, hy, stateMode === 'hyp' ? 6.5 : 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '600 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(
    isTr
      ? `Basınç–Akım Otoregülasyon Eğrisi · FFR ${simResult.ffr.toFixed(2)} · CFR ${simResult.cfr.toFixed(2)} · MRR ${simResult.mrr.toFixed(2)}`
      : `Pressure–Flow Autoregulation Curve · FFR ${simResult.ffr.toFixed(2)} · CFR ${simResult.cfr.toFixed(2)} · MRR ${simResult.mrr.toFixed(2)}`,
    padL + 4,
    17
  );
}

/**
 * Renders an artifact waveform preview canvas for the Pitfalls tab and Spot-the-Artifact quiz.
 */
export function renderArtifactPreviewCanvas(canvas, artifactId, showFixed = false, lang = 'tr') {
  if (!canvas) return;
  const { ctx, w, h } = setupHiDpiCanvas(canvas, canvas.clientWidth || 420, canvas.clientHeight || 150);
  const isTr = lang === 'tr';

  ctx.fillStyle = '#05080d';
  ctx.fillRect(0, 0, w, h);

  const padL = 36;
  const padR = 14;
  const padT = 22;
  const padB = 18;
  const plotW = Math.max(80, w - padL - padR);
  const plotH = Math.max(60, h - padT - padB);
  const yOfP = p => padT + plotH - (clamp(p, 0, 155) / 155) * plotH;

  ctx.strokeStyle = '#141c27';
  for (const pVal of [40, 80, 120]) {
    const y = yOfP(pVal);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + plotW, y);
    ctx.stroke();
  }

  const drawTrace = (isPd, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= 140; i += 1) {
      const u = i / 140;
      const beatPhase = (u * 3.5) % 1;
      const sample = samplePressureBeat(beatPhase, {
        sys: 136,
        dia: 76,
        trueRatio: artifactId === 'drift' ? 1.0 : 0.82,
        hyperemia: true,
        artifact: artifactId,
        artifactFixed: showFixed
      });
      const x = padL + u * plotW;
      const y = yOfP(isPd ? sample.pd : sample.pa);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  drawTrace(false, '#f1f5f9');
  drawTrace(true, '#38bdf8');

  ctx.font = '600 10.5px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = showFixed ? '#34d399' : '#fbbf24';
  ctx.fillText(
    showFixed
      ? (isTr ? '✓ Düzeltme Sonrası Normal Dalga' : '✓ Normal Waveform After Fix')
      : (isTr ? '⚠ Artefaktlı Dalga Kaydı' : '⚠ Artifact Waveform Recording'),
    padL + 4,
    14
  );
}

// Fluoroscopic Coronary Projection Engine & Canvas Renderer
// Simulates C-arm X-ray geometry, contrast dye injection, thoracic shadows, and foreshortening

import { CORONARY_VESSEL_TREES, distance3D } from './angio-data.js';

/**
 * Projects a 3D anatomical point [x, y, z] to 2D fluoroscopic coordinates (u, v, depth)
 * @param {Array<number>} pt - [x, y, z] in anatomical coordinates (+X: Left, +Y: Cranial, +Z: Anterior)
 * @param {number} alpha - RAO / LAO rotation in degrees (>0 LAO, <0 RAO, 0 AP)
 * @param {number} beta - Cranial / Caudal angulation in degrees (>0 Cranial, <0 Caudal, 0 Straight)
 * @param {number} beatPhase - 0..1 cardiac cycle phase for pulsatile coronary motion
 */
export function projectPoint(pt, alpha, beta, beatPhase = 0) {
  // Cardiac contraction-relaxation displacement
  // Heart contracts towards apical centroid during systole (phase 0.25..0.45)
  const pulseScale = 1.0 - 0.045 * Math.sin(beatPhase * Math.PI * 2);
  const px = pt[0] * pulseScale;
  const py = pt[1] * pulseScale;
  const pz = pt[2] * pulseScale;

  const radAlpha = (alpha * Math.PI) / 180;
  const radBeta = (beta * Math.PI) / 180;

  // 1. Rotation around Cranial-Caudal Y-axis by alpha (LAO/RAO)
  // Positive alpha is LAO (detector to patient's left)
  const cosA = Math.cos(radAlpha);
  const sinA = Math.sin(radAlpha);
  const x1 = px * cosA - pz * sinA;
  const y1 = py;
  const z1 = px * sinA + pz * cosA;

  // 2. Angulation around Transverse X-axis by beta (Cranial/Caudal)
  // Positive beta is Cranial (detector tilted towards head)
  const cosB = Math.cos(radBeta);
  const sinB = Math.sin(radBeta);
  const x2 = x1;
  const y2 = y1 * cosB - z1 * sinB;
  const z2 = y1 * sinB + z1 * cosB;

  // 3. Fluoroscopic Screen Projection (Standard Cath Lab Display):
  // Screen X: Radiological view (Patient Left is on Screen Right in AP)
  // Screen Y: Cranial is UP on screen (so negative Y in canvas coordinates)
  // Perspective projection from X-ray source (SOD = 700 mm, SID = 1000 mm)
  const focalDist = 8.5; // Virtual isocenter distance
  const perspective = focalDist / (focalDist + z2 * 0.42);

  return {
    u: -x2 * perspective, // Canvas horizontal (inverted radiological view)
    v: -y2 * perspective, // Canvas vertical (cranial is up)
    depth: z2,            // Distance along beam axis for z-sorting
    perspective
  };
}

/**
 * Calculates real-time foreshortening and elongation index for each vessel segment
 * @param {string} system - 'left' | 'right' | 'lima' | 'svg-om' | 'svg-pda'
 * @param {number} alpha
 * @param {number} beta
 */
export function computeVesselForeshortening(system, alpha, beta) {
  const vessels = CORONARY_VESSEL_TREES[system] || [];
  const metrics = {};

  for (const v of vessels) {
    if (!v.points || v.points.length < 2) continue;
    let total3D = 0;
    let total2D = 0;

    for (let i = 0; i < v.points.length - 1; i++) {
      const p1 = v.points[i];
      const p2 = v.points[i + 1];
      const proj1 = projectPoint(p1, alpha, beta);
      const proj2 = projectPoint(p2, alpha, beta);

      const d3 = distance3D(p1, p2);
      const du = proj2.u - proj1.u;
      const dv = proj2.v - proj1.v;
      const d2 = Math.sqrt(du * du + dv * dv);

      total3D += d3;
      total2D += d2;
    }

    // Elongation index: ratio of projected 2D length to true 3D length (normalized)
    const elongation = total3D > 0 ? Math.min(1.0, Math.max(0.1, total2D / (total3D * 0.95))) : 1.0;
    const foreshorteningPct = Math.round((1.0 - elongation) * 100);

    metrics[v.id] = {
      id: v.id,
      nameTr: v.nameTr,
      nameEn: v.nameEn,
      elongation: Number(elongation.toFixed(2)),
      foreshorteningPct,
      rating: elongation >= 0.82 ? 'excellent' : elongation >= 0.62 ? 'moderate' : 'severe'
    };
  }

  return metrics;
}

/**
 * Renders the simulated coronary angiogram onto an HTML5 Canvas
 */
export function renderFluoroscopyCanvas(canvas, state) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);

  const W = Number(canvas.dataset.logicalW || canvas.getAttribute('width') || 560);
  const H = Number(canvas.dataset.logicalH || canvas.getAttribute('height') || 520);

  if (!canvas.dataset.logicalW) {
    canvas.dataset.logicalW = String(W);
    canvas.dataset.logicalH = String(H);
  }
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const {
    alpha = 0,
    beta = 0,
    system = 'left',
    activeLesion = null,
    beatPhase = 0,
    contrastOpacity = 1.0,
    showLabels = true,
    showSpine = true,
    showDiaphragm = true,
    showCatheter = true,
    showForeshortening = false,
    hoveredVesselId = null,
    selectedVesselId = null,
    isTr = true
  } = state;

  const cx = W / 2;
  const cy = H / 2 + 10;
  // Fit the whole tree at rest; keep this frame stable so cine motion survives.
  const reference = (CORONARY_VESSEL_TREES[system] || [])
    .flatMap(v => v.points.map(pt => projectPoint(pt, alpha, beta)));
  const centerU = reference.length ? (Math.min(...reference.map(p => p.u)) + Math.max(...reference.map(p => p.u))) / 2 : 0;
  const centerV = reference.length ? (Math.min(...reference.map(p => p.v)) + Math.max(...reference.map(p => p.v))) / 2 : 0;
  const radius = Math.max(0.1, ...reference.map(p => Math.hypot(p.u - centerU, p.v - centerV)));
  const scale = Math.min(W, H) * 0.38 / radius;
  const originX = cx - centerU * scale;
  const originY = cy - centerV * scale;

  // 1. High-Contrast Cath Lab Screen Background (Inverted X-Ray Appearance)
  const bgGrad = ctx.createRadialGradient(cx, cy, scale * 0.3, cx, cy, scale * 2.2);
  bgGrad.addColorStop(0, '#f1f5f9'); // Whitish-gray center (bright X-ray exposure)
  bgGrad.addColorStop(0.7, '#cbd5e1');
  bgGrad.addColorStop(1, '#94a3b8'); // Darkened edge vignette
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle circular fluoroscopy intensifier mask
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, Math.min(W, H) * 0.47, 0, Math.PI * 2);
  ctx.clip();

  // 2. Thoracic Landmark #1: Vertebral Spine Shadow
  // In RAO: spine is projected to the RIGHT of the heart
  // In LAO: spine is projected to the LEFT of the heart
  if (showSpine) {
    ctx.save();
    // Spine offset depends directly on alpha (rotation)
    const spineOffset = cx + (alpha / 90) * (W * 0.36);
    const spineWidth = W * 0.16;

    ctx.fillStyle = 'rgba(100, 116, 139, 0.22)';
    ctx.fillRect(spineOffset - spineWidth / 2, 0, spineWidth, H);

    // Vertebral body pedicles and intervertebral disk spaces
    ctx.fillStyle = 'rgba(71, 85, 105, 0.28)';
    const vertStep = 44;
    for (let y = 10; y < H; y += vertStep) {
      ctx.fillRect(spineOffset - spineWidth / 2 + 4, y, spineWidth - 8, vertStep - 12);
      // Pedicle shadows (dark oval densities)
      ctx.fillStyle = 'rgba(51, 65, 85, 0.35)';
      ctx.beginPath();
      ctx.ellipse(spineOffset - spineWidth / 3, y + 16, 4, 7, 0, 0, Math.PI * 2);
      ctx.ellipse(spineOffset + spineWidth / 3, y + 16, 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. Thoracic Landmark #2: Diaphragm Dome
  // In Cranial (beta > 0): diaphragm moves UP into view
  // In Caudal (beta < 0): diaphragm drops down out of view
  if (showDiaphragm) {
    ctx.save();
    const diaphY = H * 0.82 - (beta / 45) * (H * 0.14);
    ctx.fillStyle = 'rgba(71, 85, 105, 0.38)';
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.bezierCurveTo(W * 0.25, diaphY - 25, W * 0.75, diaphY - 15, W, diaphY + 30);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 4. Guiding Catheter Engagement
  // Renders the French 6F guiding catheter in aortic root ostium
  const vessels = CORONARY_VESSEL_TREES[system] || [];
  const rootVessel = vessels[0];

  if (showCatheter && rootVessel && rootVessel.points.length > 0) {
    const ostiumPt = rootVessel.points[0];
    const ostiumProj = projectPoint(ostiumPt, alpha, beta, beatPhase);
    const ox = originX + ostiumProj.u * scale;
    const oy = originY + ostiumProj.v * scale;

    ctx.save();
    ctx.strokeStyle = '#0f172a'; // Opaque catheter shadow
    ctx.lineWidth = 4.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // Catheter curves into the ostium from the aortic arch above
    const archX = cx - (alpha > 0 ? 90 : -90);
    const archY = -20;
    ctx.moveTo(archX, archY);
    ctx.bezierCurveTo(archX, oy - 70, ox + (system === 'left' ? 40 : -40), oy - 30, ox, oy);
    ctx.stroke();

    // Metallic radiopaque catheter tip marker
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(ox, oy, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 5. Projected Coronary Arterial Branches
  const foreshorteningMetrics = computeVesselForeshortening(system, alpha, beta);
  const clickRegions = [];

  // Sort vessels by depth (render deeper background vessels first)
  const sortedVessels = [...vessels].sort((a, b) => {
    const pA = projectPoint(a.points[0], alpha, beta, beatPhase);
    const pB = projectPoint(b.points[0], alpha, beta, beatPhase);
    return pA.depth - pB.depth;
  });

  for (const v of sortedVessels) {
    if (!v.points || v.points.length < 2) continue;

    const isHovered = hoveredVesselId === v.id;
    const isSelected = selectedVesselId === v.id;
    const metric = foreshorteningMetrics[v.id];

    // Build projected 2D coordinates for all control points
    const projPts = v.points.map(pt => {
      const pr = projectPoint(pt, alpha, beta, beatPhase);
      return { x: originX + pr.u * scale, y: originY + pr.v * scale, raw: pr };
    });

    // Check if this vessel has an active clinical lesion
    const hasLesion = activeLesion && activeLesion.vesselId === v.id && activeLesion.pct > 0;
    const lesionFraction = hasLesion ? (activeLesion.posFraction || 0.5) : -1;

    // Base vessel stroke width calibrated from millimeter caliber
    const baseWidth = Math.max(1.8, (v.caliberMm || 3.0) * 1.55);

    // Color: Fluoroscopic contrast dye is black/dark charcoal, modulated by contrastOpacity
    let strokeCol = `rgba(15, 23, 42, ${Math.max(0.15, contrastOpacity)})`;
    if (showForeshortening && metric) {
      if (metric.rating === 'excellent') strokeCol = 'rgba(16, 185, 129, 0.92)'; // Green = Optimal
      else if (metric.rating === 'moderate') strokeCol = 'rgba(234, 179, 8, 0.92)'; // Yellow = Fair
      else strokeCol = 'rgba(239, 68, 68, 0.92)'; // Red = Foreshortened
    }

    if (isSelected) {
      strokeCol = '#2563eb'; // Bright blue for selected branch
    } else if (isHovered) {
      strokeCol = '#0284c7';
    }

    // Draw vessel outline & filled lumen
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Highlight halo if hovered/selected
    if (isHovered || isSelected) {
      ctx.strokeStyle = isSelected ? 'rgba(59, 130, 246, 0.45)' : 'rgba(14, 165, 233, 0.35)';
      ctx.lineWidth = baseWidth + 8;
      ctx.beginPath();
      ctx.moveTo(projPts[0].x, projPts[0].y);
      for (let i = 1; i < projPts.length; i++) {
        ctx.lineTo(projPts[i].x, projPts[i].y);
      }
      ctx.stroke();
    }

    // Main vessel body
    if (v.dashed) ctx.setLineDash([5, 4]);

    if (!hasLesion) {
      // Normal continuous vessel
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = baseWidth;
      ctx.beginPath();
      ctx.moveTo(projPts[0].x, projPts[0].y);
      for (let i = 1; i < projPts.length; i++) {
        ctx.lineTo(projPts[i].x, projPts[i].y);
      }
      ctx.stroke();
    } else {
      // Vessel with focal stenosis (pinched lumen at lesionFraction)
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = baseWidth;
      ctx.beginPath();
      ctx.moveTo(projPts[0].x, projPts[0].y);

      // Find segment where lesion sits
      const totalSegs = projPts.length - 1;
      const targetSeg = Math.min(totalSegs - 1, Math.floor(lesionFraction * totalSegs));
      const segT = (lesionFraction * totalSegs) - targetSeg;

      for (let i = 1; i <= targetSeg; i++) {
        ctx.lineTo(projPts[i].x, projPts[i].y);
      }

      // Lesion pinch point
      const pA = projPts[targetSeg];
      const pB = projPts[targetSeg + 1];
      const lx = pA.x + (pB.x - pA.x) * segT;
      const ly = pA.y + (pB.y - pA.y) * segT;

      ctx.lineTo(lx - 2, ly - 2);
      ctx.stroke();

      // Draw the narrowed lesion lumen (pinched down by percentage)
      const stenosedWidth = Math.max(0.8, baseWidth * (1.0 - activeLesion.pct / 100));
      ctx.strokeStyle = '#dc2626'; // Red stenosis marker
      ctx.lineWidth = stenosedWidth;
      ctx.beginPath();
      ctx.moveTo(lx - 4, ly - 4);
      ctx.lineTo(lx + 4, ly + 4);
      ctx.stroke();

      // Remainder of vessel
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = baseWidth * 0.92; // Slightly reduced distal caliber
      ctx.beginPath();
      ctx.moveTo(lx + 4, ly + 4);
      for (let i = targetSeg + 1; i < projPts.length; i++) {
        ctx.lineTo(projPts[i].x, projPts[i].y);
      }
      ctx.stroke();

      // Stenosis callout pill
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1;
      const stenText = `-%${activeLesion.pct}`;
      ctx.font = 'bold 10px ui-monospace, monospace';
      const tw = ctx.measureText(stenText).width;
      ctx.strokeText(stenText, lx + 8, ly - 4);
      ctx.fillText(stenText, lx + 8, ly - 4);
    }

    ctx.restore();

    // Store projected path points for click/hover hit-testing
    clickRegions.push({
      id: v.id,
      points: projPts,
      midPoint: projPts[Math.floor(projPts.length / 2)],
      vessel: v
    });
  }

  // 6. Anatomical Text Labels on Vessels
  if (showLabels) {
    ctx.save();
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const region of clickRegions) {
      const v = region.vessel;
      const pt = region.midPoint;
      const isAct = v.id === selectedVesselId || v.id === hoveredVesselId;

      const labelText = v.id;
      const tw = ctx.measureText(labelText).width;
      const pw = tw + 8;
      const ph = 16;

      ctx.fillStyle = isAct ? 'rgba(30, 58, 138, 0.88)' : 'rgba(15, 23, 42, 0.75)';
      ctx.strokeStyle = isAct ? '#60a5fa' : 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;

      // Rounded badge behind text
      const rx = pt.x + 10;
      const ry = pt.y - 10;
      ctx.beginPath();
      ctx.roundRect(rx - pw / 2, ry - ph / 2, pw, ph, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isAct ? '#93c5fd' : '#ffffff';
      ctx.fillText(labelText, rx, ry);
    }
    ctx.restore();
  }

  // Restore clipping
  ctx.restore();

  // 7. Cath Lab Frame Overlays: Calibrated Reticle Grid, Angle Stamp & Telemetry
  ctx.save();
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
  ctx.lineWidth = 1;
  // Center crosshair
  ctx.beginPath();
  ctx.moveTo(cx - 15, cy);
  ctx.lineTo(cx + 15, cy);
  ctx.moveTo(cx, cy - 15);
  ctx.lineTo(cx, cy + 15);
  ctx.stroke();

  // Intensifier circle rim
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.min(W, H) * 0.47, 0, Math.PI * 2);
  ctx.stroke();

  // Angle HUD Stamp (Top Left)
  const laoRaoStr = Math.abs(alpha) < 0.5 ? 'AP' : `${alpha > 0 ? 'LAO' : 'RAO'} ${Math.abs(Math.round(alpha))}°`;
  const craCauStr = Math.abs(beta) < 0.5 ? '0°' : `${beta > 0 ? 'CRA' : 'CAU'} ${Math.abs(Math.round(beta))}°`;
  const stampText = `${laoRaoStr} · ${craCauStr}`;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(14, 14, 150, 42, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px ui-monospace, SFMono-Regular, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(stampText, 24, 32);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText(isTr ? 'C-ARM FLOROSKOPİ' : 'C-ARM FLUOROSCOPY', 24, 46);

  // FPS & Frame Rate HUD Stamp (Top Right)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.beginPath();
  ctx.roundRect(W - 120, 14, 106, 42, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 12px ui-monospace, monospace';
  ctx.fillText(state.cinePlaying === false ? (isTr ? 'DONDURULDU' : 'FROZEN') : 'CINE · 72 BPM', W - 110, 32);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText('SID 100 cm', W - 110, 46);

  ctx.restore();

  return clickRegions;
}

/**
 * Finds the nearest vessel segment to mouse coordinates (x, y)
 */
export function hitTestVessel(clickRegions, x, y, maxDist = 20) {
  let nearest = null;
  let minDist = maxDist;

  for (const region of clickRegions) {
    for (let i = 0; i < region.points.length - 1; i++) {
      const p1 = region.points[i];
      const p2 = region.points[i + 1];

      // Distance from point to line segment
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const l2 = dx * dx + dy * dy;
      if (l2 === 0) continue;

      const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (y - p1.y) * dy) / l2));
      const projX = p1.x + t * dx;
      const projY = p1.y + t * dy;
      const dist = Math.sqrt((x - projX) * (x - projX) + (y - projY) * (y - projY));

      if (dist < minDist) {
        minDist = dist;
        nearest = region.id;
      }
    }
  }

  return nearest;
}

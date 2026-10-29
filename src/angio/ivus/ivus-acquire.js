// Coronary IVUS Lab · acquired-looking IVUS frame (ultrasound-sim.js) from a model frame.
// The tissue of every ray (clockwise from 12 o'clock, from the catheter outward, mm) comes from
// the frame geometry (ivus-stent-model.js sliceLayout): blood, intima/plaque, media, adventitia,
// perivascular tissue and landmarks, calcium, stent struts and the guidewire. The ultrasound
// steps (speckle, attenuation and shadowing, reverberation, PSF, log compression, polar scan
// conversion) make it look like a recorded frame rather than a drawing.

import { formPolarImage, scanConvert, circularGeometry } from '../../ultrasound-sim.js';
import { sliceLayout } from './ivus-stent-model.js';

const TAU = Math.PI * 2;
const CATHETER_MM = 0.5;
const clockPhi = (clock) => ((clock % 12) / 12) * TAU;
const angleGap = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

/** Smooth value noise in (angle, radius) for tissue texture (deterministic). */
function textureNoise(seed) {
  const h = (i, j) => { const x = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453; return x - Math.floor(x); };
  return (u, v) => {
    const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
    const a = h(i, j), b = h(i + 1, j), c = h(i, j + 1), d = h(i + 1, j + 1);
    const su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };
}

/** Strut angles (as seen from the catheter) and ranges of a stented frame. */
export function strutLayout(f, L) {
  if (!f.inStent) return [];
  const n = Math.max(8, Math.round(f.stentD * 3));
  return Array.from({ length: n }, (_, i) => {
    const phi = (i / n) * TAU + 0.17;
    const sx = L.stentX + Math.sin(phi) * L.stentR, sy = L.stentY + Math.cos(phi) * L.stentR;
    return { phi, sx, sy, seen: Math.atan2(sx, sy), range: Math.hypot(sx, sy) };
  });
}

/**
 * Tissue of the frame along the rays.
 * @returns {{ tissue: Function, bloodMask: Function, fovMm: number }}
 */
export function ivusTissue(f, { mhz = 60, rays, samples, fovMm }) {
  const L = sliceLayout(f);
  const mmPerSample = fovMm / samples;
  const ex = -L.lumenX, ey = -L.lumenY;            // vessel (EEM) centre; the catheter sits at the lumen centre
  const media = Math.max(0.1, L.eemR * 0.06);
  const advEnd = L.eemR + 0.55;
  const tex = textureNoise(3), tex2 = textureNoise(11);
  // Backscatter relative to the adventitia (linear); blood speckle rises with frequency.
  const blood = mhz >= 50 ? 0.016 : mhz >= 40 ? 0.009 : 0.005;
  const atten = (mhz >= 50 ? 0.022 : mhz >= 40 ? 0.016 : 0.011) * mmPerSample * 40;   // per sample, tissue (higher frequency: less depth)
  const struts = strutLayout(f, L);
  const strutHalf = (mm) => Math.atan2(0.09, Math.max(0.3, mm));   // strut half-width seen from the catheter
  const wire = { phi: clockPhi(8.2), range: L.lumenR * 0.55 };
  const branch = f.branch ? { phi: clockPhi(f.branch.clock), half: Math.asin(Math.min(0.9, (f.branch.diamMm / 2) / (L.lumenR + f.branch.diamMm / 2))), reach: L.lumenR + f.branch.diamMm * 1.15 } : null;
  const marks = (f.landmarks || []).map((l) => ({ ...l, phi: clockPhi(l.clock) }));
  const kind = f.plaqueType || 'normal';
  const plaqueLevel = kind === 'lipid' || kind === 'attenuated' ? 0.05 : kind === 'normal' ? 0.11 : 0.16;

  function tissue(ray, s, out) {
    const phi = (ray / rays) * TAU;
    const r = (s + 0.5) * mmPerSample;
    const x = Math.sin(phi) * r, y = Math.cos(phi) * r;
    // Catheter and its ring-down.
    if (r < CATHETER_MM) { out[0] = 0; return; }
    if (r < CATHETER_MM + 0.35) {
      const t = (r - CATHETER_MM) / 0.35;
      out[0] = 0.45 * (1 - t) ** 1.5 * (0.55 + 0.45 * Math.cos(t * 22));
      out[1] = 0.002;
      return;
    }
    // Guidewire: a bright point and its shadow.
    if (angleGap(phi, wire.phi) < Math.atan2(0.11, wire.range) && Math.abs(r - wire.range) < 0.08) { out[2] = 1; return; }
    // Stent struts.
    for (const st of struts) {
      if (Math.abs(r - st.range) < 0.06 && angleGap(phi, st.seen) < strutHalf(st.range)) { out[2] = f.branch && branch && angleGap(st.phi, branch.phi) < branch.half ? 0.85 : 1; return; }
    }
    const inLumen = r < L.lumenR;
    const inBranch = branch && angleGap(phi, branch.phi) < branch.half && r < branch.reach;
    if (inLumen || inBranch) { out[0] = blood; out[1] = 0.0005; return; }
    const dE = Math.hypot(x - ex, y - ey);
    const t1 = tex(phi * 18, r * 6), t2 = tex2(phi * 60, r * 14);
    // Calcium on the lumen surface: a specular reflector (shadow and reverberations behind).
    if (L.halfCa > 0 && angleGap(phi, L.phiCa) <= L.halfCa && r < L.lumenR + 0.32) { out[2] = 0.95; out[0] = 0.2; return; }
    // Leading edge of the intima: a thin brighter interface.
    if (r < L.lumenR + 0.05) { out[0] = 0.32 * (0.7 + 0.6 * t2); out[1] = atten; return; }
    if (dE < L.eemR - media) {
      out[0] = plaqueLevel * (0.6 + 0.8 * t1) * (0.8 + 0.4 * t2);
      out[1] = atten * (kind === 'attenuated' ? 5 : 1);
      return;
    }
    if (dE < L.eemR) { out[0] = 0.012; out[1] = atten * 0.6; return; }                     // media: dark band
    if (dE < advEnd) { out[0] = 0.5 * (0.6 + 0.8 * t1) * (0.7 + 0.6 * t2); out[1] = atten * 1.6; return; }   // adventitia: bright, irregular
    // Perivascular tissue and landmarks.
    const t3 = tex(phi * 7, r * 2.2);   // coarse blotches of fat and connective tissue
    let level = 0.07 * (0.35 + 1.3 * t3) * (0.6 + 0.8 * t2);
    for (const m of marks) {
      const gap = angleGap(phi, m.phi);
      if (m.kind === 'myocardium' && gap < 0.85) level = 0.1 * (0.7 + 0.6 * t2);
      else if (m.kind === 'pericardium' && gap < 0.6 && Math.abs(dE - (L.eemR + 1.9)) < 0.22) { out[2] = 0.35; level = 0.6; }
      else if (m.kind === 'vein' && gap < 0.42 && Math.abs(dE - (L.eemR + 1.5)) < 0.7) level = 0.004;
    }
    out[0] = level;
    out[1] = atten;
  }
  const bloodMask = (ray, s) => {
    const r = (s + 0.5) * mmPerSample;
    return r > CATHETER_MM + 0.35 && r < L.lumenR ? 1 : 0;
  };
  return { tissue, bloodMask, L, struts };
}

const work = new WeakMap();

/**
 * Draws the acquired IVUS frame into a square area of the canvas context (CSS pixels).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} f model frame (modelSlice)
 * @param {{ size: number, fovMm: number, mhz?: number, time?: number, gainDb?: number }} o
 */
export function drawAcquiredIvus(ctx, f, o) {
  const mhz = o.mhz || 60;
  const rays = mhz >= 50 ? 400 : 320;
  const samples = mhz >= 50 ? 300 : 240;
  const { tissue, bloodMask } = ivusTissue(f, { mhz, rays, samples, fovMm: o.fovMm });
  const mmPerSample = o.fovMm / samples;
  const polar = formPolarImage({
    rays, samples, tissue, wrap: true,
    axialSigma: mhz >= 50 ? 1.5 : 2.0,
    // Beam about 0.2-0.3 mm wide: in angle it is wide near the catheter, narrow far out.
    lateralSigma: (s) => Math.min(2.6, 1.3 + (0.22 / Math.max(0.6, (s + 0.5) * mmPerSample)) * (rays / TAU) * 0.12),
    dynamicRangeDb: 54,
    gainDb: (o.gainDb || 0) + 2,
    tgc: (s) => 1 + 0.35 * (s / samples),
    seed: 7,
    flicker: 0.5 + 0.5 * Math.sin((o.time || 0) / 140),
    flickerMask: bloodMask
  });
  const size = Math.round(o.size);
  const canvas = ctx.canvas;
  let buf = work.get(canvas);
  if (!buf || buf.width !== size) {
    buf = canvas.ownerDocument.createElement('canvas');
    buf.width = buf.height = size;
    work.set(canvas, buf);
  }
  const bctx = buf.getContext('2d');
  const image = bctx.createImageData(size, size);
  scanConvert(polar, circularGeometry({ rays, samples, width: size, height: size, radiusPx: size * 0.485 }), image, { gamma: 1.25, tint: [0.97, 0.98, 1] });
  bctx.putImageData(image, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(buf, 0, 0, size, size);
  ctx.restore();
}

/** Distance from (cx, cy) along a screen direction to a closed polygon ({x, y}[]), or null. */
function rayPolygon(cx, cy, dx, dy, pts) {
  let best = null;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const ex = b.x - a.x, ey = b.y - a.y;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((a.x - cx) * ey - (a.y - cy) * ex) / den;
    const u = ((a.x - cx) * dy - (a.y - cy) * dx) / den;
    if (t > 0 && u >= 0 && u <= 1 && (best === null || t < best)) best = t;
  }
  return best;
}

const consoleCache = new WeakMap();

/**
 * Console cross-section (coronary-ivus-render.js): the acquired-looking frame from the
 * renderer's own contours (EEM, media, lumen polygons in canvas pixels around the catheter at
 * cx, cy) and the case slice (calcium, attenuation, side branch, stent, thrombus, dissection).
 * Cached per frame content; the blood speckle refreshes about 8 times a second.
 */
export function drawAcquiredConsole(ctx, o) {
  const { cx, cy, pxPerMm, size, fovPx, slice, state, mhz, eemPts, mediaInnerPts, lumPts, lumCx, lumCy, plaqueCenterAng, time = 0 } = o;
  const key = JSON.stringify([slice, state.salineFlush, state.stasisActive, state.chromaFlo, state.obliqueSlice, mhz, size, o.ringdownMm, o.wire, o.featureKey]);
  const tick = Math.floor(time / 120);
  const cached = consoleCache.get(ctx.canvas);
  if (cached && cached.key === key && cached.tick === tick) { ctx.drawImage(cached.buf, 0, 0, size, size); return; }
  const rays = mhz >= 50 ? 400 : 320, samples = mhz >= 50 ? 280 : 220;
  const fovMm = fovPx / pxPerMm, mmPerSample = fovMm / samples;
  const radii = (pts) => Float32Array.from({ length: rays }, (_, k) => {
    const phi = (k / rays) * TAU;
    return (rayPolygon(cx, cy, Math.sin(phi), -Math.cos(phi), pts) ?? 0) / pxPerMm;
  });
  const rEem = radii(eemPts), rMed = radii(mediaInnerPts), rLum = radii(lumPts);
  const phiOf = (canvasAngle) => canvasAngle + Math.PI / 2;      // canvas angle (from +x, y down) to clock angle
  const phiPlaque = phiOf(plaqueCenterAng);
  const caHalf = ((slice.calciumArcDeg || 0) / 2) * (Math.PI / 180);
  const atHalf = ((slice.attenuationArcDeg || 0) / 2) * (Math.PI / 180);
  const branchPhi = slice.activeSideBranch ? phiOf((((slice.activeSideBranch.clockHour || 2) - 3) / 12) * TAU) : null;
  const struts = slice.inStentZone && slice.stentDiamMm > 0 ? Array.from({ length: 12 }, (_, s) => {
    const sa = (s / 12) * TAU, R = (slice.stentDiamMm / 2) * pxPerMm;
    const x = lumCx + Math.cos(sa) * R - cx, y = lumCy + Math.sin(sa) * R - cy;
    return { seen: Math.atan2(x, -y), range: Math.hypot(x, y) / pxPerMm };
  }) : [];
  const wire = (o.wire ?? mhz >= 30) ? { phi: phiOf(Math.PI * 0.68), range: (o.wireRangePx ?? 26) / pxPerMm } : null;
  const ringdown = o.ringdownMm ?? 0.3;
  const thrombus = slice.thrombus ? { x: (lumCx + Math.cos(plaqueCenterAng) * (lumPts.length ? 0.55 : 0) * ((slice.dMax / 2) * pxPerMm) - cx) / pxPerMm, y: (lumCy + Math.sin(plaqueCenterAng) * 0.55 * ((slice.dMin / 2) * pxPerMm) - cy) / pxPerMm, r: 18 / pxPerMm } : null;
  const tex = textureNoise(5), tex2 = textureNoise(13);
  const kind = slice.plaqueType || 'normal';
  const plaqueLevel = kind === 'attenuated' || kind === 'lipid' ? 0.05 : kind === 'normal' ? 0.11 : 0.16;
  const blood = state.salineFlush ? 0.0006 : state.stasisActive ? 0.06 : mhz >= 50 ? 0.016 : mhz >= 40 ? 0.009 : 0.005;
  const atten = (mhz >= 50 ? 0.022 : mhz >= 40 ? 0.016 : 0.011) * mmPerSample * 40;
  const tissue = (ray, s, out) => {
    const phi = (ray / rays) * TAU, r = (s + 0.5) * mmPerSample;
    if (r < CATHETER_MM * 0.38) { out[0] = 0; return; }   // the console draws a smaller catheter (11 px)
    if (r < CATHETER_MM * 0.38 + ringdown) { const t = (r - CATHETER_MM * 0.38) / ringdown; out[0] = (ringdown > 0.4 ? 0.8 : 0.45) * (1 - t) ** 1.5 * (0.55 + 0.45 * Math.cos(t * 22)); return; }
    if (wire && angleGap(phi, wire.phi) < Math.atan2(0.11, wire.range) && Math.abs(r - wire.range) < 0.08) { out[2] = 1; return; }
    for (const st of struts) if (Math.abs(r - st.range) < 0.06 && angleGap(phi, st.seen) < Math.atan2(0.09, st.range)) { out[2] = 1; return; }
    const lum = rLum[ray], med = rMed[ray], eem = rEem[ray];
    const inBranch = branchPhi !== null && angleGap(phi, branchPhi) < 0.24 && r > lum * 0.5;
    if (r < lum || inBranch) {
      if (thrombus) {
        const x = Math.sin(phi) * r, y = -Math.cos(phi) * r;
        if (Math.hypot(x - thrombus.x, y - thrombus.y) < thrombus.r) { out[0] = 0.06 * (0.6 + 0.8 * tex(phi * 30, r * 9)); out[1] = atten; return; }
      }
      if (slice.dissectionArcDeg && angleGap(phi, phiPlaque) < (slice.dissectionArcDeg * Math.PI) / 360 && Math.abs(r - lum * 0.9) < 0.04) { out[2] = 0.35; return; }
      out[0] = blood; out[1] = 0.0005; return;
    }
    const t1 = tex(phi * 18, r * 6), t2 = tex2(phi * 60, r * 14);
    const gap = angleGap(phi, phiPlaque);
    if (caHalf > 0 && gap <= caHalf) {
      const front = slice.calciumSuperficial ? lum + 0.06 : (lum + eem) / 2;
      if (r >= front && r < front + 0.32) { out[2] = 0.95; out[0] = 0.2; return; }
    }
    if (r < lum + 0.05) { out[0] = 0.32 * (0.7 + 0.6 * t2); out[1] = atten; return; }
    if (r < med) { out[0] = plaqueLevel * (0.6 + 0.8 * t1) * (0.8 + 0.4 * t2); out[1] = atten * (atHalf > 0 && gap <= atHalf ? 9 : 1); return; }
    if (r < eem) { out[0] = 0.012; out[1] = atten * 0.6; return; }
    if (slice.halfMoonBridge && gap < 1.3 && r > eem + 0.05 && r < eem + 0.7) { out[0] = 0.006; out[1] = atten; return; }   // myocardial bridge: echolucent half moon
    if (r < eem + 0.55) { out[0] = 0.5 * (0.6 + 0.8 * t1) * (0.7 + 0.6 * t2); out[1] = atten * 1.6; return; }
    const t3 = tex(phi * 7, r * 2.2);
    out[0] = 0.07 * (0.35 + 1.3 * t3) * (0.6 + 0.8 * t2);
    out[1] = atten;
  };
  const polar = formPolarImage({
    rays, samples, tissue, wrap: true,
    axialSigma: mhz >= 50 ? 1.5 : 2.0,
    lateralSigma: (s) => Math.min(2.6, 1.3 + (0.22 / Math.max(0.6, (s + 0.5) * mmPerSample)) * (rays / TAU) * 0.12),
    dynamicRangeDb: 54, gainDb: 2,
    tgc: (s) => 1 + 0.35 * (s / samples),
    seed: 9,
    flicker: 0.5 + 0.5 * Math.sin(time / 140),
    flickerMask: (ray, s) => ((s + 0.5) * mmPerSample < rLum[ray] ? 1 : 0)
  });
  let buf = cached?.buf;
  if (!buf || buf.width !== size) { buf = ctx.canvas.ownerDocument.createElement('canvas'); buf.width = buf.height = size; }
  const bctx = buf.getContext('2d');
  const image = bctx.createImageData(size, size);
  const geometry = circularGeometry({ rays, samples, width: size, height: size, cx, cy, radiusPx: fovPx });
  if (o.warp) {
    // NURD: the catheter turns unevenly, so the image is stretched and squeezed in angle.
    const map = geometry.map;
    geometry.map = (x, y) => { const m = map(x, y); if (m) m[0] = o.warp(m[0] / rays) * rays; return m; };
  }
  scanConvert(polar, geometry, image, { gamma: 1.25, tint: [0.97, 0.98, 1] });
  bctx.putImageData(image, 0, 0);
  // ChromaFlo: blood flow coded red over the lumen.
  if (state.chromaFlo && !state.salineFlush) {
    bctx.save();
    bctx.beginPath();
    lumPts.forEach((p, i) => (i ? bctx.lineTo(p.x, p.y) : bctx.moveTo(p.x, p.y)));
    bctx.closePath();
    bctx.globalAlpha = 0.45;
    bctx.fillStyle = '#d4343b';
    bctx.fill();
    bctx.restore();
  }
  consoleCache.set(ctx.canvas, { key, tick, buf });
  ctx.drawImage(buf, 0, 0, size, size);
}

const ellipse = (cx, cy, rx, ry, n = 72) => Array.from({ length: n }, (_, k) => {
  const a = (k / n) * TAU;
  return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, a };
});

/** Morphology and artifact cards: a schematic case drawn through the same acquisition. */
const FEATURES = {
  'normal-trilaminar': { plaqueType: 'normal', lumen: 54 },
  'fibrous-plaque': { plaqueType: 'fibrous', lumen: 32, ecc: 14 },
  'soft-attenuated': { plaqueType: 'attenuated', lumen: 30, ecc: 14, attenuationArcDeg: 150 },
  'superficial-calcium': { plaqueType: 'fibrocalcific', lumen: 34, ecc: 10, calciumArcDeg: 120, calciumSuperficial: true },
  'calcified-nodule': { plaqueType: 'fibrocalcific', lumen: 32, ecc: 10, calciumArcDeg: 55, calciumSuperficial: true, calcifiedNodule: true },
  'dissection-hematoma': { plaqueType: 'fibrous', lumen: 40, ecc: 6, dissectionArcDeg: 90 },
  nurd: { plaqueType: 'fibrous', lumen: 38, ecc: 8 },
  'ringdown-stasis': { plaqueType: 'fibrous', lumen: 40, ecc: 8 },
  'wire-shadow': { plaqueType: 'fibrous', lumen: 40, ecc: 8 },
  reverberation: { plaqueType: 'fibrocalcific', lumen: 36, ecc: 8, calciumArcDeg: 110, calciumSuperficial: true },
  'oblique-slicing': { plaqueType: 'fibrous', lumen: 38, ecc: 6 }
};

/**
 * Small acquired-looking IVUS frame for a morphology or artifact card (CSS pixels w x h,
 * the circular image centred). `fixed`: the artifact's fix is applied.
 */
export function drawAcquiredFeature(ctx, w, h, featureId, fixed = false, time = 0) {
  const f = FEATURES[featureId] || FEATURES['fibrous-plaque'];
  const size = Math.min(w, h);
  const cx = w / 2, cy = h / 2;
  const pxPerMm = 30;
  const oblique = featureId === 'oblique-slicing' && !fixed;
  const erx = oblique ? 84 : 66, ery = oblique ? 52 : 66;
  const plaqueAng = -Math.PI * 0.28;
  const shift = f.ecc || 0;
  const lumCx = cx - Math.cos(plaqueAng) * shift, lumCy = cy - Math.sin(plaqueAng) * shift;
  const lr = f.lumen * (oblique ? 1.12 : 1), lry = f.lumen * (oblique ? 0.8 : 1);
  const slice = {
    plaqueType: f.plaqueType, calciumArcDeg: f.calciumArcDeg || 0, attenuationArcDeg: f.attenuationArcDeg || 0,
    calciumSuperficial: Boolean(f.calciumSuperficial), calcifiedNodule: Boolean(f.calcifiedNodule),
    dissectionArcDeg: f.dissectionArcDeg || 0, dMax: (lr * 2) / pxPerMm, dMin: (lry * 2) / pxPerMm, inStentZone: false
  };
  const warp = featureId === 'nurd' && !fixed
    ? (u) => { const v = u + 0.06 * Math.sin(u * TAU * 2) + 0.035 * Math.sin(u * TAU * 5); return ((v % 1) + 1) % 1; }
    : null;
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  // drawAcquiredConsole draws a square image at the origin: shift so the circle is centred.
  ctx.translate((w - size) / 2, (h - size) / 2);
  drawAcquiredConsole(ctx, {
    cx: size / 2, cy: size / 2, pxPerMm, size, fovPx: size * 0.48, slice,
    state: { stasisActive: featureId === 'ringdown-stasis' && !fixed, salineFlush: featureId === 'ringdown-stasis' && fixed },
    mhz: featureId === 'nurd' ? 40 : 60,
    eemPts: ellipse(size / 2, size / 2, erx * (size / 200), ery * (size / 200)),
    mediaInnerPts: ellipse(size / 2, size / 2, (erx - 6) * (size / 200), (ery - 6) * (size / 200)),
    lumPts: ellipse(lumCx - (w - size) / 2, lumCy - (h - size) / 2, lr * (size / 200), lry * (size / 200)),
    lumCx: lumCx - (w - size) / 2, lumCy: lumCy - (h - size) / 2, plaqueCenterAng: plaqueAng,
    ringdownMm: featureId === 'ringdown-stasis' && !fixed ? 0.75 : 0.3,
    wire: true,
    wireRangePx: featureId === 'wire-shadow' && fixed ? 30 : 20,
    warp, featureKey: `${featureId}:${fixed}`, time
  });
  ctx.restore();
}

/*
 * Point-by-point RF ablation on the 3D map (pure, no DOM). Each lesion sits on
 * one of the predefined lines (EAM3D_ABLATION_LINES) at a position along it in
 * mm, with a small sideways drift that grows when contact is poor.
 *
 * Teaching approximations, not device data:
 * - lesion index from contact force, power and time, with the exponents of the
 *   published force-power-time index: 10.4 * (sum CF^0.68 * P^1.63 * dt)^0.35;
 * - depth about index / 95 mm, wider and shallower at 50 W short applications;
 * - a line blocks when the gaps between lesions that reach the wall are all
 *   <= 6 mm and the first and last lesions sit within 3 mm of its ends;
 *   a lesion reaching 75% of the wall blocks while fresh (oedema) but only a
 *   full-thickness lesion still blocks after the 20-minute wait;
 * - safety: oesophageal temperature on the posterior LA wall, the compact AV
 *   node above the slow pathway, steam pop at high force and power.
 */
import { EAM3D_ABLATION_LINES } from './eam3d-model.js';

export const RF_POWERS = Object.freeze([30, 35, 40, 50]);
export const RF_SPACINGS_MM = Object.freeze([4, 5, 6, 8]);
export const RF_FORCE_RANGE = Object.freeze({ min: 0, max: 40, low: 10, high: 30 });
export const RF_MAX_GAP_MM = 6;
export const RF_END_TOLERANCE_MM = 3;
export const RF_LINE_RADIUS_MM = 3;
export const RF_ACUTE_FRACTION = 0.75;
export const RF_MAX_SECONDS = 60;
export const RF_HPSD_MAX_SECONDS = 20;
export const RF_BASE_TEMP_C = 36.8;
export const RF_ESOPHAGUS_LIMIT_C = 39;

/** Tissue along each line: wall thickness (mm), lesion index target, nearby structure at risk. */
export const RF_LINE_TISSUE = Object.freeze({
  'slow-pathway': { wallMm: 3, target: [350, 450], hazard: 'avnode' },
  'cti-line': { wallMm: 4.5, target: [450, 550], hazard: 'none' },
  'la-anterior-roof': { wallMm: 3.5, target: [400, 500], hazard: 'none' },
  'mitral-isthmus': { wallMm: 4.5, target: [450, 550], hazard: 'circumflex' },
  'posterior-box': { wallMm: 2.5, target: [300, 400], hazard: 'esophagus' },
  'vt-isthmus-dechannel': { wallMm: 6, target: [500, 600], hazard: 'none' },
  'rvot-focus': { wallMm: 4, target: [400, 500], hazard: 'none' }
});

const INDEX_SCALE = 10.4;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round1 = (v) => Math.round(v * 10) / 10;

export const lineTissue = (lineId) => RF_LINE_TISSUE[lineId] || RF_LINE_TISSUE['cti-line'];

/** First line that ends the scenario, or the CTI line. */
export function defaultLineFor(scenarioId) {
  const hit = Object.values(EAM3D_ABLATION_LINES).find((line) => line.terminates.includes(scenarioId));
  return hit ? hit.id : 'cti-line';
}

/** Dose rate of one second of RF at this contact force (g) and power (W). */
export const doseRate = (forceG, powerW) => Math.pow(Math.max(0, forceG), 0.68) * Math.pow(Math.max(0, powerW), 1.63);
export const indexFromDose = (dose) => (dose > 0 ? INDEX_SCALE * Math.pow(dose, 0.35) : 0);

/** Seconds of steady contact needed to reach an index. */
export function secondsToIndex(index, forceG, powerW) {
  const rate = doseRate(forceG, powerW);
  return rate > 0 ? Math.pow(index / INDEX_SCALE, 1 / 0.35) / rate : Infinity;
}

/** Lesion depth and width (mm) for an index; 50 W short lesions are wider for their depth. */
export function lesionGeometry(index, powerW) {
  const depthMm = index / 95;
  return { depthMm: round1(depthMm), diameterMm: round1(depthMm * (powerW >= 50 ? 2 : 1.6) + 1) };
}

/** Contact force with breathing (4 s) and heartbeat (0.8 s) around the set value. */
export function liveForce(targetG, tSec) {
  const swing = 1 + 0.22 * Math.sin((2 * Math.PI * tSec) / 0.8) + 0.12 * Math.sin((2 * Math.PI * tSec) / 4);
  return Math.max(0, targetG * swing);
}

/** Deterministic pseudo-random number in [0, 1) for a seed. */
function seeded(seed) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Sideways drift (mm) of the tip during one application: larger with poor contact. */
export function driftMm(forceG, seed) {
  const sigma = forceG < 5 ? 2.5 : forceG < RF_FORCE_RANGE.low ? 1.2 : forceG <= RF_FORCE_RANGE.high ? 0.5 : 0.4;
  const u1 = Math.max(1e-6, seeded(seed * 2 + 1));
  const u2 = seeded(seed * 2 + 2);
  const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return round1(clamp(normal * sigma, -5, 5));
}

// ---- Geometry on the 3D atlas ------------------------------------------------

function polyline(lineId) {
  const pts = EAM3D_ABLATION_LINES[lineId].points;
  const lengths = [0];
  for (let i = 1; i < pts.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  }
  return { pts, lengths, total: lengths[lengths.length - 1] };
}

/** Atlas units per mm along a line. */
export const unitsPerMm = (lineId) => polyline(lineId).total / EAM3D_ABLATION_LINES[lineId].lengthMm;

/** Atlas point at sMm along the line, offsetMm to its side. */
export function pointOnLine(lineId, sMm, offsetMm = 0) {
  const { pts, lengths, total } = polyline(lineId);
  const upm = total / EAM3D_ABLATION_LINES[lineId].lengthMm;
  const u = clamp(sMm * upm, 0, total);
  let i = 1;
  while (i < pts.length - 1 && lengths[i] < u) i++;
  const a = pts[i - 1], b = pts[i];
  const seg = lengths[i] - lengths[i - 1] || 1;
  const f = (u - lengths[i - 1]) / seg;
  const p = [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * f);
  const tan = [0, 1, 2].map((k) => (b[k] - a[k]) / seg);
  // Side direction: tangent x view axis (z), or x y when the line runs along z.
  let side = [tan[1], -tan[0], 0];
  if (Math.hypot(...side) < 0.2) side = [0, tan[2], -tan[1]];
  const n = Math.hypot(...side) || 1;
  return p.map((v, k) => Number((v + (side[k] / n) * offsetMm * upm).toFixed(4)));
}

// ---- One application ---------------------------------------------------------

/**
 * Start an application at sMm on the line.
 * @returns {object} delivery state for stepDelivery()
 */
export function startDelivery({ lineId, sMm, powerW, forceG, seed = 1, autoStop = true, esophagusC = RF_BASE_TEMP_C, maxSeconds = null }) {
  const line = EAM3D_ABLATION_LINES[lineId];
  return Object.freeze({
    lineId,
    sMm: clamp(sMm, 0, line.lengthMm),
    offsetMm: driftMm(forceG, seed),
    powerW,
    forceG,
    autoStop,
    maxSeconds: maxSeconds ?? (powerW >= 50 ? RF_HPSD_MAX_SECONDS : RF_MAX_SECONDS),
    seed,
    t: 0,
    dose: 0,
    forceSum: 0,
    cf: forceG,
    index: 0,
    baseZ: Math.round(112 + 8 * Math.sin(seed * 1.7 + sMm)),
    esophagusC,
    junctional: false,
    stopReason: null
  });
}

/** Advance an application by dtSec of RF; returns the next state (stopped once stopReason is set). */
export function stepDelivery(d, dtSec) {
  if (d.stopReason || !(dtSec > 0)) return d;
  const tissue = lineTissue(d.lineId);
  const t = d.t + dtSec;
  const cf = liveForce(d.forceG, t);
  const dose = d.dose + doseRate(cf, d.powerW) * dtSec;
  const index = indexFromDose(dose);
  const length = EAM3D_ABLATION_LINES[d.lineId].lengthMm;
  const nearNode = tissue.hazard === 'avnode' && d.sMm > 0.75 * length;
  const esophagusC = tissue.hazard === 'esophagus' ? d.esophagusC + 0.0022 * d.powerW * dtSec : d.esophagusC;
  const junctional = tissue.hazard === 'avnode' && t >= 3 && d.sMm >= 0.2 * length;
  let stopReason = null;
  if ((d.forceG >= 30 && d.powerW >= 40 && t >= 15) || index >= tissue.target[1] + 300) stopReason = 'pop';
  else if (esophagusC >= RF_ESOPHAGUS_LIMIT_C) stopReason = 'esophagus';
  else if (nearNode && t >= 3) stopReason = 'avblock';
  else if (d.autoStop && index >= tissue.target[0] + (tissue.target[1] - tissue.target[0]) / 2) stopReason = 'target';
  else if (t >= d.maxSeconds) stopReason = 'max';
  return Object.freeze({ ...d, t, cf, dose, forceSum: d.forceSum + cf * dtSec, index, esophagusC, junctional, stopReason });
}

export const stopDelivery = (d) => (d.stopReason ? d : Object.freeze({ ...d, stopReason: 'user' }));

/** Live readouts of an application: impedance fall, tip temperature, lesion size. */
export function deliveryReadout(d) {
  const dZ = d.stopReason === 'pop' ? -25 : Math.min(18, d.index / 32);
  const geo = lesionGeometry(d.index, d.powerW);
  return {
    t: round1(d.t),
    cf: Math.round(d.cf),
    z: Math.round(d.baseZ - dZ),
    dZ: Math.round(dZ),
    tipC: round1(33.5 + 0.09 * d.powerW + 2 * (1 - Math.exp(-d.t / 5))),
    index: Math.round(d.index),
    ...geo,
    esophagusC: round1(d.esophagusC)
  };
}

/** The lesion an application leaves. */
export function finishDelivery(d, id) {
  const r = deliveryReadout(d);
  return Object.freeze({
    id,
    lineId: d.lineId,
    sMm: round1(d.sMm),
    offsetMm: d.offsetMm,
    powerW: d.powerW,
    forceG: d.t > 0 ? Math.round(d.forceSum / d.t) : d.forceG,
    seconds: r.t,
    index: r.index,
    depthMm: r.depthMm,
    diameterMm: r.diameterMm,
    dZ: r.dZ,
    pop: d.stopReason === 'pop',
    stopReason: d.stopReason,
    aged: false,
    pos: pointOnLine(d.lineId, d.sMm, d.offsetMm)
  });
}

/** Run a whole application at once (tests, demo lines). */
export function deliverAtOnce(opts, id, dtSec = 0.1) {
  let d = startDelivery(opts);
  while (!d.stopReason) d = stepDelivery(d, dtSec);
  return { lesion: finishDelivery(d, id), delivery: d };
}

// ---- Line continuity ---------------------------------------------------------

/** Depth (mm) a lesion needs on its line: 75% of the wall while fresh, the full wall after the wait. */
export const depthNeeded = (lesion) => lineTissue(lesion.lineId).wallMm * (lesion.aged ? 1 : RF_ACUTE_FRACTION);

/** 'durable' | 'acute' | 'weak' for a lesion's depth against its wall. */
export function lesionGrade(lesion) {
  const wall = lineTissue(lesion.lineId).wallMm;
  if (lesion.depthMm >= wall) return 'durable';
  if (!lesion.aged && lesion.depthMm >= wall * RF_ACUTE_FRACTION) return 'acute';
  return 'weak';
}

/** Gaps, coverage and block of one line from its lesions. */
export function evaluateLine(lineId, lesions) {
  const length = EAM3D_ABLATION_LINES[lineId].lengthMm;
  const onLine = lesions.filter((l) => l.lineId === lineId && Math.abs(l.offsetMm) <= RF_LINE_RADIUS_MM);
  const good = onLine.filter((l) => l.depthMm >= depthNeeded(l)).sort((a, b) => a.sMm - b.sMm);
  // A gap is the stretch no lesion covers (each covers half the allowed spacing on either side).
  const half = RF_MAX_GAP_MM / 2;
  const gaps = [];
  if (!good.length) {
    gaps.push({ fromMm: 0, toMm: length });
  } else {
    if (good[0].sMm > RF_END_TOLERANCE_MM) gaps.push({ fromMm: 0, toMm: Math.max(0, good[0].sMm - half) });
    for (let i = 1; i < good.length; i++) {
      const a = good[i - 1], b = good[i];
      if (Math.hypot(b.sMm - a.sMm, b.offsetMm - a.offsetMm) > RF_MAX_GAP_MM) {
        const mid = (a.sMm + b.sMm) / 2;
        gaps.push({ fromMm: Math.min(a.sMm + half, mid), toMm: Math.max(b.sMm - half, mid) });
      }
    }
    const last = good[good.length - 1];
    if (length - last.sMm > RF_END_TOLERANCE_MM) gaps.push({ fromMm: Math.min(length, last.sMm + half), toMm: length });
  }
  let covered = 0, reach = 0;
  for (const l of good) {
    const from = Math.max(reach, l.sMm - RF_MAX_GAP_MM / 2, 0);
    const to = Math.min(length, l.sMm + RF_MAX_GAP_MM / 2);
    if (to > from) covered += to - from;
    reach = Math.max(reach, to);
  }
  return {
    lineId,
    lengthMm: length,
    complete: gaps.length === 0,
    gaps: gaps.map((g) => ({ fromMm: round1(g.fromMm), toMm: round1(g.toMm) })),
    coveragePct: Math.round((100 * covered) / length),
    lesions: onLine.length,
    good: good.length,
    weak: onLine.length - good.length,
    missed: lesions.filter((l) => l.lineId === lineId).length - onLine.length
  };
}

/** Lines whose lesions block conduction now. */
export function blockedLines(lesions) {
  const ids = [...new Set(lesions.map((l) => l.lineId))];
  return new Set(ids.filter((id) => evaluateLine(id, lesions).complete));
}

/** The 20-minute wait: oedema settles, every lesion is judged on full thickness. */
export const ageLesions = (lesions) => lesions.map((l) => (l.aged ? l : Object.freeze({ ...l, aged: true })));

/** Lesions every 5 mm at the middle of the target index (the demo "complete line"). */
export function idealLesions(lineId, firstId = 1) {
  const { lengthMm } = EAM3D_ABLATION_LINES[lineId];
  const tissue = lineTissue(lineId);
  const index = (tissue.target[0] + tissue.target[1]) / 2;
  const powerW = tissue.hazard === 'esophagus' ? 50 : 35;
  const forceG = 15;
  const positions = [];
  for (let s = Math.min(2, lengthMm / 2); s < lengthMm - 2; s += 5) positions.push(s);
  positions.push(Math.max(positions[positions.length - 1] ?? 0, lengthMm - 2));
  const seconds = round1(secondsToIndex(index, forceG, powerW));
  const geo = lesionGeometry(index, powerW);
  return [...new Set(positions)].map((s, k) => Object.freeze({
    id: firstId + k, lineId, sMm: round1(s), offsetMm: 0, powerW, forceG, seconds,
    index: Math.round(index), ...geo, dZ: Math.round(Math.min(18, index / 32)), pop: false, stopReason: 'target', aged: false,
    pos: pointOnLine(lineId, s, 0)
  }));
}

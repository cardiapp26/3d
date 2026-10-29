// Coronary IVUS Lab · native coronary anatomy and normal lumen / MLA reference values.
// Pure data and math (no DOM): segment table, schematic 3D centerlines (mm), vessel-size
// MLA cut-offs (FIRST, LITRO, Asian LM studies) and the Finet bifurcation law.

const w = (tr, en) => Object.freeze({ tr, en });
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

export const areaFromDiameter = (d) => Math.PI * (d / 2) ** 2;
export const diameterFromArea = (a) => 2 * Math.sqrt(Math.max(0, a) / Math.PI);

/**
 * Normal lumen diameters (angiographic, right-dominant men). LM, proximal and distal LAD are the
 * published means of Dodge 1992; the other segments are rounded approximations of the same
 * series (`approx: true`). Women are about 0.2–0.3 mm smaller.
 */
export const NORMAL_SEGMENTS = Object.freeze([
  { id: 'lm', vessel: 'LM', name: w('Sol ana koroner (LMCA)', 'Left main (LMCA)'), diamMm: 4.5, sd: 0.5, approx: false, leftMain: true },
  { id: 'plad', vessel: 'LAD', name: w('Proksimal LAD', 'Proximal LAD'), diamMm: 3.7, sd: 0.4, approx: false },
  { id: 'mlad', vessel: 'LAD', name: w('Orta LAD', 'Mid LAD'), diamMm: 2.8, sd: 0.5, approx: true },
  { id: 'dlad', vessel: 'LAD', name: w('Distal LAD', 'Distal LAD'), diamMm: 1.9, sd: 0.4, approx: false },
  { id: 'd1', vessel: 'D1', name: w('Birinci diyagonal (D1)', 'First diagonal (D1)'), diamMm: 2.4, sd: 0.5, approx: true },
  { id: 'plcx', vessel: 'LCX', name: w('Proksimal LCx', 'Proximal LCx'), diamMm: 3.4, sd: 0.5, approx: true },
  { id: 'dlcx', vessel: 'LCX', name: w('Distal LCx', 'Distal LCx'), diamMm: 2.5, sd: 0.5, approx: true },
  { id: 'om1', vessel: 'OM1', name: w('Birinci obtus marjinal (OM1)', 'First obtuse marginal (OM1)'), diamMm: 2.4, sd: 0.5, approx: true },
  { id: 'prca', vessel: 'RCA', name: w('Proksimal RCA', 'Proximal RCA'), diamMm: 3.9, sd: 0.6, approx: true },
  { id: 'mrca', vessel: 'RCA', name: w('Orta RCA', 'Mid RCA'), diamMm: 3.5, sd: 0.6, approx: true },
  { id: 'drca', vessel: 'RCA', name: w('Distal RCA', 'Distal RCA'), diamMm: 3.1, sd: 0.5, approx: true },
  { id: 'pda', vessel: 'PDA', name: w('Arka inen arter (PDA)', 'Posterior descending (PDA)'), diamMm: 2.0, sd: 0.4, approx: true }
]);

export function findSegment(id) {
  return NORMAL_SEGMENTS.find((s) => s.id === id) || NORMAL_SEGMENTS[0];
}

/** Non-LM MLA cut-off for FFR ≤0.80 by reference vessel diameter (FIRST, Waksman 2013). */
export function firstMlaCutoff(refDiamMm) {
  if (refDiamMm < 3.0) return { cutoffMm2: 2.4, band: '<3.0 mm', auc: 0.66 };
  if (refDiamMm <= 3.5) return { cutoffMm2: 2.7, band: '3.0–3.5 mm', auc: 0.71 };
  return { cutoffMm2: 3.6, band: '>3.5 mm', auc: 0.68 };
}

/** LM cut-offs: Western 6.0 mm² (Jasti 2004 5.9, LITRO 6.0); Asian 4.5 mm² (Park 2014; Kang 2011 4.8). */
export const LM_CUTOFFS = Object.freeze({
  western: { cutoffMm2: 6.0, source: 'LITRO (de la Torre 2011) · Jasti 2004' },
  asian: { cutoffMm2: 4.5, source: 'Park 2014 (4.5) · Kang 2011 (4.8)' }
});

/** Finet law: mother (LM) diameter = 0.678 × (LAD + LCx). */
export const finetLmDiameter = (dLad, dLcx) => round(0.678 * (dLad + dLcx), 2);

/**
 * Compares a measured MLA with the normal lumen of the segment and the ischemic cut-off.
 * Returns normal lumen area, area stenosis and a verdict: 'below' (likely ischemic, confirm
 * with physiology for non-LM), 'grey' (within 0.5 mm² above the cut-off) or 'above'.
 */
export function assessMla({ segmentId = 'plad', refDiamMm, mlaMm2, population = 'western' } = {}) {
  const seg = findSegment(segmentId);
  const refD = Number.isFinite(refDiamMm) && refDiamMm > 0 ? refDiamMm : seg.diamMm;
  const normalAreaMm2 = round(areaFromDiameter(refD), 2);
  const mla = Math.max(0, Number(mlaMm2) || 0);
  const areaStenosisPct = round(Math.max(0, (1 - mla / normalAreaMm2) * 100), 1);
  const lm = Boolean(seg.leftMain);
  const cut = lm ? LM_CUTOFFS[population === 'asian' ? 'asian' : 'western'] : firstMlaCutoff(refD);
  const cutoffMm2 = cut.cutoffMm2;
  const verdict = mla < cutoffMm2 ? 'below' : mla < cutoffMm2 + 0.5 ? 'grey' : 'above';
  return {
    segment: seg,
    refDiamMm: round(refD, 2),
    normalAreaMm2,
    mlaMm2: round(mla, 2),
    mldMm: round(diameterFromArea(mla), 2),
    areaStenosisPct,
    cutoffMm2,
    cutoffSource: lm ? cut.source : `FIRST (Waksman 2013) · RVD ${cut.band}`,
    smallVessel: !lm && refD < 2.5,
    leftMain: lm,
    verdict
  };
}

// Schematic coronary tree, mm, heart frame: +x patient left, +y superior, +z anterior.
// Origin at the aortic root. A child starts on its parent at `atMm` (arc length along the parent,
// 'end' = parent's last point), so ostia line up with the pullback routes below
// (LM ≈10 mm: LAD and LCx leave at route position 10 mm).
export const CORONARY_TREE = Object.freeze([
  { id: 'lm', label: 'LM', parent: null, d0: 4.5, d1: 4.3, pts: [[6, 2, 3], [10.5, 0.5, 1.5], [15, -1, 0]] },
  { id: 'lad', label: 'LAD', parent: 'lm', atMm: 'end', d0: 3.7, d1: 1.4, pts: [[15, -1, 0], [21, -7, 10], [25, -22, 20], [24, -42, 26], [19, -64, 26], [11, -86, 19], [4, -102, 8]] },
  { id: 's1', label: 'S1', parent: 'lad', atMm: 6, d0: 1.6, d1: 0.8, pts: [[18, -4, 5], [17, -22, 4], [14, -38, -3]] },
  { id: 'd1', label: 'D1', parent: 'lad', atMm: 12, d0: 2.4, d1: 1.3, pts: [[21, -8, 11], [36, -28, 21], [47, -48, 17], [54, -66, 8]] },
  { id: 'lcx', label: 'LCx', parent: 'lm', atMm: 'end', d0: 3.4, d1: 2.0, pts: [[15, -1, 0], [28, -5, -9], [40, -13, -25], [45, -26, -43], [40, -40, -58]] },
  { id: 'om1', label: 'OM1', parent: 'lcx', atMm: 20, d0: 2.4, d1: 1.3, pts: [[33, -8, -16], [50, -30, -26], [57, -54, -22]] },
  { id: 'rca', label: 'RCA', parent: null, d0: 3.9, d1: 2.8, pts: [[-5, 2, 4], [-16, -4, 10], [-30, -18, 11], [-39, -40, 2], [-36, -62, -20], [-22, -74, -42], [-8, -78, -50]] },
  { id: 'rv', label: 'RV', parent: 'rca', atMm: 34, d0: 1.8, d1: 0.9, pts: [[-32, -22, 10], [-30, -44, 22], [-22, -62, 28]] },
  { id: 'pda', label: 'PDA', parent: 'rca', atMm: 'end', d0: 2.0, d1: 1.1, pts: [[-8, -78, -50], [-2, -92, -40], [2, -104, -22]] },
  { id: 'plv', label: 'PLV', parent: 'rca', atMm: 'end', d0: 1.8, d1: 1.0, pts: [[-8, -78, -50], [8, -74, -58], [22, -74, -60]] }
]);

/** Normal-segment id for a point of a tree branch (u = 0 ostium .. 1 distal end). */
export function segmentForBranch(branchId, u = 0) {
  if (branchId === 'lm') return 'lm';
  if (branchId === 'lad') return u < 0.2 ? 'plad' : u < 0.55 ? 'mlad' : 'dlad';
  if (branchId === 'lcx') return u < 0.4 ? 'plcx' : 'dlcx';
  if (branchId === 'rca') return u < 0.3 ? 'prca' : u < 0.65 ? 'mrca' : 'drca';
  return ['d1', 'om1', 'pda'].includes(branchId) ? branchId : null;
}

/**
 * IVUS pullback routes (ostium to distal). `segments` maps arc length (mm from the ostium) to a
 * normal-segment id; `branches` are side-branch take-offs met by the catheter (clock = position
 * on the IVUS screen); `landmarks` are perivascular structures seen in that stretch.
 */
export const PULLBACK_ROUTES = Object.freeze({
  LAD: {
    chain: ['lm', 'lad'],
    lengthMm: 70,
    segments: [[0, 'lm'], [10, 'plad'], [32, 'mlad'], [62, 'dlad']],
    branches: [
      { id: 'lcx', at: 10, clock: 4, label: 'LCx', diamMm: 3.4 },
      { id: 's1', at: 16, clock: 8, label: 'S1', diamMm: 1.6 },
      { id: 'd1', at: 22, clock: 1, label: 'D1', diamMm: 2.4 }
    ],
    landmarks: [
      { kind: 'vein', from: 4, to: 30, clock: 11, label: w('Büyük kardiyak ven', 'Great cardiac vein') },
      { kind: 'myocardium', from: 10, to: 70, clock: 7, label: w('Septum / miyokard', 'Septum / myocardium') },
      { kind: 'pericardium', from: 0, to: 12, clock: 2, label: w('Perikard', 'Pericardium') }
    ]
  },
  LCX: {
    chain: ['lm', 'lcx'],
    lengthMm: 60,
    segments: [[0, 'lm'], [10, 'plcx'], [30, 'dlcx']],
    branches: [
      { id: 'lad', at: 10, clock: 10, label: 'LAD', diamMm: 3.7 },
      { id: 'om1', at: 30, clock: 2, label: 'OM1', diamMm: 2.4 }
    ],
    landmarks: [
      { kind: 'vein', from: 12, to: 60, clock: 5, label: w('Koroner sinüs / büyük kardiyak ven', 'Coronary sinus / great cardiac vein') },
      { kind: 'pericardium', from: 10, to: 60, clock: 1, label: w('Perikard', 'Pericardium') },
      { kind: 'myocardium', from: 10, to: 60, clock: 8, label: w('Sol ventrikül miyokardı', 'LV myocardium') }
    ]
  },
  RCA: {
    chain: ['rca'],
    lengthMm: 80,
    segments: [[0, 'prca'], [26, 'mrca'], [54, 'drca']],
    branches: [
      { id: 'rv', at: 34, clock: 2, label: 'RV', diamMm: 1.8 }
    ],
    landmarks: [
      { kind: 'pericardium', from: 0, to: 80, clock: 12, label: w('Perikard', 'Pericardium') },
      { kind: 'myocardium', from: 0, to: 80, clock: 6, label: w('Sağ ventrikül miyokardı', 'RV myocardium') },
      { kind: 'vein', from: 46, to: 80, clock: 9, label: w('Küçük kardiyak ven', 'Small cardiac vein') }
    ]
  }
});

/** Normal segment id at an arc position of a pullback route. */
export function segmentAtRoute(vessel, sMm) {
  const route = PULLBACK_ROUTES[vessel] || PULLBACK_ROUTES.LAD;
  let id = route.segments[0][1];
  for (const [from, segId] of route.segments) if (sMm >= from) id = segId;
  return findSegment(id);
}

/**
 * Normal lumen diameter along a route: piecewise-linear between segment midpoints, so the
 * vessel tapers smoothly (LM 4.5 → proximal LAD 3.7 → mid 2.8 → distal 1.9 mm).
 */
export function normalLumenDiameterAt(vessel, sMm) {
  const route = PULLBACK_ROUTES[vessel] || PULLBACK_ROUTES.LAD;
  const knots = route.segments.map(([from, id], i) => {
    const to = route.segments[i + 1]?.[0] ?? route.lengthMm;
    return [(from + to) / 2, findSegment(id).diamMm];
  });
  if (sMm <= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i++) {
    const [s0, d0] = knots[i - 1];
    const [s1, d1] = knots[i];
    if (sMm <= s1) return round(d0 + ((d1 - d0) * (sMm - s0)) / (s1 - s0), 3);
  }
  return knots.at(-1)[1];
}

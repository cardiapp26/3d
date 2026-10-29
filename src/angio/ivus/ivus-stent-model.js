// Coronary IVUS Lab · interactive vessel and stent model (pure math, no DOM).
// A pullback route of the native coronary tree (ivus-anatomy.js) gets an optional lesion and an
// optional stent. Stent mechanics: delivery-balloon compliance, NC post-dilation, POT, plaque
// compressibility, vessel stretch and the platform's maximal expansion. Every slice reports EEM,
// native lumen, stent diameter and strut-to-wall distance, so the 3D view, the cross-section and
// the metrics read the same numbers.

import {
  PULLBACK_ROUTES,
  normalLumenDiameterAt,
  segmentAtRoute,
  assessMla,
  areaFromDiameter,
  diameterFromArea
} from './ivus-anatomy.js';

const w = (tr, en) => Object.freeze({ tr, en });
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const STENT_DIAMETERS = Object.freeze([2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0, 4.5]);
export const STENT_LENGTHS = Object.freeze([12, 15, 18, 20, 24, 28, 32, 38]);
export const BALLOON_DIAMETERS = Object.freeze([2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0, 4.5, 5.0]);

const NOMINAL_ATM = 12;
const STENT_COMPLIANCE = 0.012; // relative diameter gain per atm (semi-compliant delivery balloon)
const NC_COMPLIANCE = 0.004; // relative diameter gain per atm (non-compliant balloon)
const RECOIL = 0.03;
const WALL_FRACTION = 0.055; // normal intima + media thickness per side, as a fraction of the lumen diameter (plaque burden ≈18%)
const STRUT_MM = 0.08;
export const MALAPPOSITION_MM = 0.4; // OCT-derived: >0.4 mm axial and >1 mm long

/** Maximal diameter a platform tolerates on post-dilation (illustrative; check the device IFU). */
export function platformLimitMm(nominalMm) {
  if (nominalMm <= 2.75) return 3.5;
  if (nominalMm <= 3.25) return 4.25;
  return 5.5;
}

/** Scenario presets. Positions are mm from the ostium of the route. */
export const MODEL_SCENARIOS = Object.freeze([
  {
    id: 'native',
    label: w('Doğal koroner anatomi', 'Native coronary anatomy'),
    brief: w(
      'Hastalıksız koroner ağaç. Kateteri damar boyunca sürükleyin: üç tabakalı duvar, LM-LAD-LCx bifurkasyonu, septal ve diyagonal dal ağızları, büyük kardiyak ven ve perikard IVUS kesitinde görünür. Her segmentin normal lümen alanı ve iskemik MLA eşiği altta.',
      'Disease-free coronary tree. Drag the catheter along the vessel: trilaminar wall, the LM-LAD-LCx bifurcation, septal and diagonal ostia, great cardiac vein and pericardium appear on the IVUS frame. Each segment\'s normal lumen area and ischemic MLA cut-off are below.'
    ),
    vessel: 'LAD',
    lesion: null,
    stent: null
  },
  {
    id: 'undersize',
    label: w('Küçük seçilmiş stent', 'Undersized stent'),
    brief: w(
      'Orta LAD lezyonuna 2.50 mm stent nominal basınçta açıldı. Distal referans lümen ≈2.9 mm olduğundan stent küçük: MSA düşük, açılım %90 altında ve proksimal kenarda strutlar duvara değmiyor. Daha büyük stent seçin veya NC balonla post-dilatasyon ve POT yapın; küçük platformun azami açılma sınırına dikkat.',
      'A 2.50 mm stent was deployed at nominal pressure in a mid-LAD lesion. Distal reference lumen is ≈2.9 mm, so the stent is undersized: low MSA, expansion below 90% and the proximal struts do not touch the wall. Choose a larger stent or post-dilate with an NC balloon and POT; watch the maximal expansion of a small platform.'
    ),
    vessel: 'LAD',
    lesion: { centerMm: 34, lengthMm: 14, pbMax: 0.74, eccClock: 7, ecc: 0.45, calciumArcDeg: 90, calciumClock: 6, type: 'fibrous' },
    stent: { diamMm: 2.5, lengthMm: 20, startMm: 24, atm: 12, post: null, pot: null }
  },
  {
    id: 'apposition',
    label: w('Stent sonrası apozisyon (LM-LAD)', 'Post-stent apposition (LM-LAD)'),
    brief: w(
      'Proksimal LAD lezyonu için 3.50 mm stent LM içinden LAD\'ye (crossover) yerleştirildi. LM lümeni ≈4.5 mm olduğundan LM içindeki strutlar duvardan 0.4 mm\'den uzak: malapozisyon. LCx ağzının proksimaline kadar 4.50 mm NC balonla POT yapın ve apozisyonu kontrol edin (Kang: distal LM >8, POC >7, LAD ostiumu >6 mm²).',
      'A 3.50 mm stent crosses from the LM into the LAD for a proximal LAD lesion. The LM lumen is ≈4.5 mm, so the LM struts sit more than 0.4 mm off the wall: malapposition. Perform POT with a 4.50 mm NC balloon up to the LCx carina and check apposition (Kang: distal LM >8, POC >7, LAD ostium >6 mm²).'
    ),
    vessel: 'LAD',
    lesion: { centerMm: 18, lengthMm: 12, pbMax: 0.7, eccClock: 8, ecc: 0.4, calciumArcDeg: 0, calciumClock: 0, type: 'fibrous' },
    stent: { diamMm: 3.5, lengthMm: 24, startMm: 2, atm: 14, post: null, pot: null }
  }
]);

export function findScenario(id) {
  return MODEL_SCENARIOS.find((s) => s.id === id) || MODEL_SCENARIOS[0];
}

/** Fresh mutable model state for a scenario (the panel owns and edits it). */
export function createModelState(scenarioId = 'native') {
  const sc = findScenario(scenarioId);
  return {
    scenarioId: sc.id,
    vessel: sc.vessel,
    lesion: sc.lesion ? { ...sc.lesion } : null,
    stent: sc.stent ? { ...sc.stent, post: null, pot: null } : null,
    plaqueModified: false
  };
}

const gauss = (x, c, len) => Math.exp(-(((x - c) / Math.max(1.5, len / 2.6)) ** 2));

/** Native (pre-stent) vessel at arc position s: EEM, lumen, plaque, eccentricity, calcium. */
export function nativeSlice(model, sMm) {
  const route = PULLBACK_ROUTES[model.vessel] || PULLBACK_ROUTES.LAD;
  const s = clamp(sMm, 0, route.lengthMm);
  const refLumenD = normalLumenDiameterAt(model.vessel, s);
  const eemRefD = refLumenD * (1 + 2 * WALL_FRACTION);
  const les = model.lesion;
  const g = les ? gauss(s, les.centerMm, les.lengthMm) : 0;
  // Mild positive remodeling at the lesion (Glagov): EEM grows up to 8%.
  const eemD = eemRefD * (1 + 0.08 * g);
  const eemArea = areaFromDiameter(eemD);
  const refPb = 1 - (refLumenD / eemRefD) ** 2;
  const pb = les ? refPb + (les.pbMax - refPb) * g : refPb;
  const lumenArea = eemArea * (1 - pb);
  const lumenD = diameterFromArea(lumenArea);
  const ecc = les ? les.ecc * g : 0;
  const calciumArcDeg = les && g > 0.35 ? Math.round(les.calciumArcDeg * Math.min(1, g * 1.3)) : 0;
  const branch = route.branches.find((b) => Math.abs(b.at - s) <= Math.max(1.2, b.diamMm * 0.45)) || null;
  const landmarks = route.landmarks.filter((l) => s >= l.from && s <= l.to);
  return {
    sMm: round(s, 1),
    segment: segmentAtRoute(model.vessel, s),
    refLumenD: round(refLumenD, 3),
    eemD: round(eemD, 3),
    eemAreaMm2: round(eemArea, 2),
    lumenD: round(lumenD, 3),
    lumenAreaMm2: round(lumenArea, 2),
    plaqueBurdenPct: round(pb * 100, 1),
    ecc: round(ecc, 3),
    eccClock: les?.eccClock ?? 6,
    calciumArcDeg,
    calciumClock: les?.calciumClock ?? 6,
    plaqueType: les && g > 0.3 ? les.type : 'normal',
    lesionWeight: round(g, 3),
    branch,
    landmarks
  };
}

function stentRange(model) {
  const st = model.stent;
  if (!st) return null;
  const route = PULLBACK_ROUTES[model.vessel] || PULLBACK_ROUTES.LAD;
  const start = clamp(st.startMm, 0, route.lengthMm - 4);
  return { start, end: clamp(start + st.lengthMm, start + 4, route.lengthMm) };
}

/** POT stretch: proximal stent segment up to the first side branch inside the stent (or 40%). */
export function potRange(model) {
  const range = stentRange(model);
  if (!range) return null;
  const route = PULLBACK_ROUTES[model.vessel] || PULLBACK_ROUTES.LAD;
  const carina = route.branches.find((b) => b.at > range.start + 2 && b.at < range.end - 2);
  return { start: range.start, end: carina ? carina.at - 0.5 : range.start + 0.4 * (range.end - range.start) };
}

/** Largest lumen diameter the segment can be dilated to (plaque compression + vessel stretch). */
function achievableDiameter(model, nat) {
  const calcFrac = nat.calciumArcDeg / 360;
  const comp = model.plaqueModified ? 0.32 : 0.32 - 0.27 * Math.min(1, calcFrac * 1.6);
  const plaqueArea = nat.eemAreaMm2 - nat.lumenAreaMm2;
  const maxArea = nat.eemAreaMm2 * 1.06 ** 2 - plaqueArea * (1 - comp);
  return diameterFromArea(maxArea);
}

/** Device diameter acting at s (largest of delivery balloon, NC post-dilation, POT). */
function deviceDiameter(model, sMm) {
  const st = model.stent;
  const delivery = st.diamMm * (1 + STENT_COMPLIANCE * (st.atm - NOMINAL_ATM));
  let d = delivery;
  if (st.post) d = Math.max(d, st.post.diamMm * (1 + NC_COMPLIANCE * (st.post.atm - NOMINAL_ATM)));
  const pr = potRange(model);
  if (st.pot && pr && sMm >= pr.start && sMm <= pr.end) d = Math.max(d, st.pot.diamMm * (1 + NC_COMPLIANCE * (st.pot.atm - NOMINAL_ATM)));
  return d;
}

/**
 * One IVUS frame of the model. Stent fields are zero outside the stent. `gapMm` is the mean
 * strut-to-wall distance; the stent sits against the wall on the plaque side, so the far side
 * gap is about twice the mean (`maxGapMm`).
 */
export function modelSlice(model, sMm) {
  const nat = nativeSlice(model, sMm);
  const range = stentRange(model);
  const inStent = Boolean(range && nat.sMm >= range.start && nat.sMm <= range.end);
  let stentD = 0;
  let gapMm = 0;
  let lumenD = nat.lumenD;
  let overLimit = false;
  if (inStent) {
    const limit = platformLimitMm(model.stent.diamMm);
    const dev = deviceDiameter(model, nat.sMm);
    overLimit = dev > limit + 0.01;
    const ach = achievableDiameter(model, nat);
    stentD = Math.min(dev, limit) * (1 - RECOIL);
    if (stentD > ach) stentD = ach * (1 - RECOIL * 0.5);
    if (nat.branch) {
      // Struts across a side-branch ostium float by design: not malapposition.
      gapMm = 0;
    } else if (stentD + 0.02 < nat.lumenD) {
      gapMm = (nat.lumenD - stentD) / 2;
    }
    lumenD = Math.max(nat.lumenD, stentD);
  }
  const lumenArea = areaFromDiameter(lumenD);
  const stentArea = inStent ? areaFromDiameter(stentD) : 0;
  return {
    ...nat,
    inStent,
    stentD: round(stentD, 3),
    stentAreaMm2: round(stentArea, 2),
    gapMm: round(gapMm, 3),
    maxGapMm: round(gapMm * 1.8, 3),
    overLimit,
    lumenD: round(lumenD, 3),
    lumenAreaMm2: round(lumenArea, 2),
    plaqueBurdenPct: round((1 - lumenArea / nat.eemAreaMm2) * 100, 1),
    strutMm: STRUT_MM
  };
}

/** Whole-route profile at 0.5 mm steps. */
export function modelProfile(model, stepMm = 0.5) {
  const route = PULLBACK_ROUTES[model.vessel] || PULLBACK_ROUTES.LAD;
  const frames = [];
  for (let s = 0; s <= route.lengthMm + 1e-6; s += stepMm) frames.push(modelSlice(model, s));
  return frames;
}

const KANG_TARGETS = Object.freeze({ lm: 8.0, pocLm: 7.0, ladOstium: 6.0 });

/**
 * Stent metrics: MSA, expansion vs distal reference lumen (ULTIMATE >90% or >5.0 mm²;
 * EAPCI >80%), malapposition (OCT-derived >0.4 mm over >1 mm), undersizing and the edges.
 */
export function stentMetrics(model, frames = modelProfile(model)) {
  const range = stentRange(model);
  if (!range) return null;
  const inside = frames.filter((f) => f.inStent);
  const msaFrame = inside.reduce((m, f) => (!m || f.stentAreaMm2 < m.stentAreaMm2 ? f : m), null);
  const route = PULLBACK_ROUTES[model.vessel] || PULLBACK_ROUTES.LAD;
  const distRef = nativeSlice(model, Math.min(route.lengthMm, range.end + 3));
  const proxRef = nativeSlice(model, Math.max(0, range.start - 3));
  const distRefArea = distRef.lumenAreaMm2;
  const expansionPct = round((msaFrame.stentAreaMm2 / distRefArea) * 100, 1);
  // Longest run of slices with a gap above the threshold.
  let run = 0;
  let longest = 0;
  for (const f of inside) {
    run = f.maxGapMm > MALAPPOSITION_MM ? run + 0.5 : 0;
    longest = Math.max(longest, run);
  }
  const maxGapMm = Math.max(0, ...inside.map((f) => f.maxGapMm));
  const malapposed = maxGapMm > MALAPPOSITION_MM && longest > 1;
  const eapciNominalMm = Math.floor(distRef.eemD * 4) / 4;
  const undersized = model.stent.diamMm < Math.min(eapciNominalMm, distRef.lumenD) - 0.24;
  const edgeProx = nativeSlice(model, Math.max(0, range.start - 5));
  const edgeDist = nativeSlice(model, Math.min(route.lengthMm, range.end + 5));
  const leftMain = model.vessel !== 'RCA' && range.start < 10;
  let kang = null;
  if (leftMain) {
    const areaAt = (lo, hi) => Math.min(...inside.filter((f) => f.sMm >= lo && f.sMm <= hi).map((f) => f.stentAreaMm2));
    const lmMsa = areaAt(range.start, 8);
    const pocMsa = areaAt(8, 11.5);
    const ladMsa = areaAt(11.5, Math.min(range.end, 16));
    kang = {
      lmMsa: round(lmMsa, 2),
      pocMsa: round(pocMsa, 2),
      ladMsa: round(ladMsa, 2),
      ok: lmMsa >= KANG_TARGETS.lm && pocMsa >= KANG_TARGETS.pocLm && ladMsa >= KANG_TARGETS.ladOstium
    };
  }
  const ultimateExpansion = expansionPct >= 90 || msaFrame.stentAreaMm2 > 5.0;
  const ultimateEdges = edgeProx.plaqueBurdenPct < 50 && edgeDist.plaqueBurdenPct < 50;
  return {
    range,
    msaMm2: msaFrame.stentAreaMm2,
    msaAtMm: msaFrame.sMm,
    distRefLumenAreaMm2: distRefArea,
    distRefLumenD: distRef.lumenD,
    distRefEemD: distRef.eemD,
    proxRefLumenD: proxRef.lumenD,
    expansionPct,
    eapciExpansion: expansionPct >= 80,
    ultimateExpansion,
    ultimateEdges,
    ultimateOptimal: ultimateExpansion && ultimateEdges && (!kang || kang.ok),
    maxGapMm: round(maxGapMm, 2),
    malappositionLengthMm: round(longest, 1),
    malapposed,
    eapciNominalMm,
    undersized,
    overLimit: inside.some((f) => f.overLimit),
    platformLimitMm: platformLimitMm(model.stent.diamMm),
    edgePbProx: edgeProx.plaqueBurdenPct,
    edgePbDist: edgeDist.plaqueBurdenPct,
    kang
  };
}

/** MLA reading for the frame under the transducer (uses ivus-anatomy cut-offs). */
export function frameMlaAssessment(slice, population = 'western') {
  return assessMla({ segmentId: slice.segment.id, refDiamMm: slice.refLumenD, mlaMm2: slice.lumenAreaMm2, population });
}

const clockPhi = (clock) => ((clock % 12) / 12) * Math.PI * 2;
const angleDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

/**
 * In-plane geometry of a frame (mm). Screen convention shared with the 3D view: x right,
 * y up, clock angle φ from 12 o'clock clockwise, direction (sin φ, cos φ). The lumen sits away
 * from the plaque; a malapposed stent rests near the plaque-side wall (near gap ≈0.2×, far ≈1.8×).
 */
export function sliceLayout(f) {
  const eemR = f.eemD / 2;
  const lumenR = f.lumenD / 2;
  const phiPlaque = clockPhi(f.eccClock ?? 6);
  const px = Math.sin(phiPlaque);
  const py = Math.cos(phiPlaque);
  const shift = -(f.ecc || 0) * Math.max(0, eemR - lumenR);
  const lumenX = px * shift;
  const lumenY = py * shift;
  const stentR = f.inStent ? f.stentD / 2 : 0;
  const lift = f.inStent && f.gapMm > 0 ? 0.8 * (lumenR - stentR) : 0;
  const stentX = lumenX + px * lift;
  const stentY = lumenY + py * lift;
  const phiCa = clockPhi(f.calciumClock ?? 6);
  const halfCa = ((f.calciumArcDeg || 0) / 2) * (Math.PI / 180);
  return {
    eemR,
    lumenR,
    lumenX,
    lumenY,
    stentR,
    stentX,
    stentY,
    phiPlaque,
    phiCa,
    halfCa,
    calciumAt: (phi) => halfCa > 0 && angleDiff(phi, phiCa) <= halfCa,
    gapAt(phi) {
      if (!stentR) return 0;
      const sx = stentX + Math.sin(phi) * stentR - lumenX;
      const sy = stentY + Math.cos(phi) * stentR - lumenY;
      return Math.max(0, lumenR - Math.hypot(sx, sy));
    }
  };
}

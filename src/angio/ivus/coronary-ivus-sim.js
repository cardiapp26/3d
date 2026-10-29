// Coronary IVUS Lab · Deterministic Cross-Sectional Planimetry, Pullback & PCI Optimization Engine
// Pure functions for EEM/Lumen contour generation, calcium scoring, virtual stenting, and calculators.

import { CLINICAL_CASES, TRANSDUCER_MODES } from './coronary-ivus-data.js';
import { NORMAL_SEGMENTS, assessMla } from './ivus-anatomy.js';

export const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || 0));
const round = (v, digits = 2) => {
  const f = 10 ** digits;
  return Math.round((Number(v) || 0) * f) / f;
};
const areaFromDiam = d => Math.PI * ((d / 2) ** 2);
const EPS = 1e-9;
const floorQuarter = d => Math.floor(d * 4 + EPS) / 4;
const ceilQuarter = d => Math.ceil(d * 4 - EPS) / 4;
const roundQuarter = d => Math.round(d * 4) / 4;

// Stent sizes available in 0.25 mm steps
const STENT_MIN_MM = 2.25;
const STENT_MAX_MM = 5.0;
// Recommended stent is the EEM-based size capped at distal mean lumen + this margin
const LUMEN_CAP_MARGIN_MM = 0.5;

// ULTIMATE (Zhang 2018) expansion: MSA >5.0 mm² or >90% of distal reference lumen area
const ULTIMATE_MSA_MM2 = 5.0;
const ULTIMATE_EXPANSION_PCT = 90;
// ULTIMATE edge criterion: no media-involving edge dissection longer than 3 mm
const ULTIMATE_DISSECTION_MM = 3.0;
// OCT-derived malapposition thresholds (axial distance, longitudinal extent); not part of ULTIMATE
const MALAPP_AXIAL_MM = 0.4;
const MALAPP_LENGTH_MM = 1.0;
// Kang 2011 left main MSA targets (mm²)
const KANG_TARGETS = Object.freeze({ lcxOstium: 5.0, ladOstium: 6.0, poc: 7.0, distalLm: 8.0 });
const FRAME_STEP_MM = 0.5;

export function findIvusCase(caseId) {
  return CLINICAL_CASES.find(c => c.id === caseId) || CLINICAL_CASES[0];
}

export function findTransducerMode(modeId) {
  return TRANSDUCER_MODES.find(m => m.id === modeId) || TRANSDUCER_MODES[0];
}

/**
 * IVUS calcium score (Zhang 2021, Circ Cardiovasc Interv): 1 point each for superficial calcium
 * arc >270° over >5 mm, 360° superficial calcium, calcified nodule, and vessel diameter <3.5 mm.
 * A higher score predicts worse stent expansion; score ≥2 favours plaque modification, score 4
 * carries the highest underexpansion risk. The score was derived in lesions with >270° calcium,
 * so for arc ≤270° it is returned with `applicable: false` (standard NC balloon preparation
 * usually suffices; a calcified nodule on its own still flags modification).
 */
export function computeCalciumScore(params = {}) {
  const arcDeg = Number(params.calciumArcDeg ?? params.caArcDeg) || 0;
  const lengthMm = Number(params.calciumLengthMm ?? params.caLenMm) || 0;
  const hasNodule = Boolean(params.calcifiedNodule ?? params.hasNodule);
  const vesselEemMm = Number(params.eemDiamMm ?? params.vesselEemMm) || 3.6;

  const ptArc270Len5 = arcDeg > 270 && lengthMm > 5 ? 1 : 0;
  const ptCa360 = arcDeg >= 360 ? 1 : 0;
  const ptNodule = hasNodule ? 1 : 0;
  const ptSmallVessel = vesselEemMm < 3.5 ? 1 : 0;

  const score = ptArc270Len5 + ptCa360 + ptNodule + ptSmallVessel;
  const applicable = arcDeg > 270;
  const needsModification = applicable ? score >= 2 : hasNodule;

  return {
    score,
    applicable,
    ptArc270Len5,
    ptCa360,
    ptNodule,
    ptSmallVessel,
    needsModification,
    highestRisk: applicable && score === 4
  };
}

/**
 * Stent sizing (EAPCI 2018): EEM-based = mean distal EEM rounded down to the nearest 0.25 mm;
 * lumen-based = mean distal lumen + 0–0.25 mm (next available size). The recommended stent is the
 * EEM-based size capped at distal mean lumen + 0.5 mm. POT = proximal mean lumen, nearest 0.25 mm.
 */
export function recommendStentSize({ distEemD, distLumD, proxLumD }) {
  const eemBasedMm = clamp(floorQuarter(distEemD), STENT_MIN_MM, STENT_MAX_MM);
  const lumenBasedMm = clamp(ceilQuarter(distLumD), STENT_MIN_MM, STENT_MAX_MM);
  const lumenCapMm = floorQuarter(distLumD + LUMEN_CAP_MARGIN_MM);
  const stentMm = clamp(Math.min(eemBasedMm, lumenCapMm), STENT_MIN_MM, STENT_MAX_MM);
  const potMm = proxLumD > 0 ? clamp(roundQuarter(proxLumD), stentMm, STENT_MAX_MM + 0.5) : stentMm;
  return { eemBasedMm, lumenBasedMm, lumenCapMm, stentMm, potMm };
}

/**
 * Native (pre-PCI) geometry at pullback position x: tapered reference plus the lesion profile.
 */
function nativeGeometry(c, x) {
  const len = c.pullbackLengthMm || 40;
  const t = x / len; // 0 = distal, 1 = proximal

  const distEem = c.distalRef?.eemDiamMm ?? 3.5;
  const proxEem = c.proxRef?.eemDiamMm ?? 4.1;
  const distLum = c.distalRef?.lumenDiamMm ?? 3.05;
  const proxLum = c.proxRef?.lumenDiamMm ?? 3.6;

  const baseEemD = distEem + (proxEem - distEem) * t;
  const baseLumD = distLum + (proxLum - distLum) * t;

  const les = c.lesion || {};
  const center = les.centerMm ?? 20;
  const halfSpan = Math.max(2.5, (les.lengthMm ?? 10) * 0.55);
  const gauss = Math.exp(-(((x - center) / halfSpan) ** 2));

  const targetLesionEem = les.eemDiamMm ?? baseEemD;
  const eemDiamMm = round(baseEemD + (targetLesionEem - baseEemD) * gauss, 2);
  const targetMinLum = les.minLumenDiamMm ?? baseLumD;
  const targetMaxLum = les.maxLumenDiamMm ?? baseLumD;
  const dMin = baseLumD + (targetMinLum - baseLumD) * gauss;
  const dMax = baseLumD + (targetMaxLum - baseLumD) * gauss;

  const dMinC = clamp(dMin, 0.9, eemDiamMm - 0.25);
  const dMaxC = clamp(Math.max(dMinC, dMax), dMinC, eemDiamMm - 0.2);

  return {
    distEem, proxEem, baseLumD, center, gauss, eemDiamMm, dMin, dMax, targetMaxLum,
    meanLumenDiamMm: round((round(dMinC, 2) + round(dMaxC, 2)) / 2, 2)
  };
}

/** Pre-PCI stent and POT sizing from the native distal and proximal reference frames. */
function caseStentSizing(c) {
  const len = c.pullbackLengthMm || 40;
  const dist = nativeGeometry(c, clamp(c.distalRefMm ?? 6, 0, len));
  const prox = nativeGeometry(c, clamp(c.proxRefMm ?? 34, 0, len));
  return recommendStentSize({
    distEemD: dist.eemDiamMm,
    distLumD: dist.meanLumenDiamMm,
    proxLumD: prox.meanLumenDiamMm
  });
}

/**
 * Samples cross-sectional IVUS geometry at pullback position `posMm` (0 = distal, 40 = proximal).
 */
export function sampleIvusSlice(caseObj, posMm, options = {}) {
  const c = caseObj || CLINICAL_CASES[0];
  const len = c.pullbackLengthMm || 40;
  const x = clamp(posMm, 0, len);
  const nat = nativeGeometry(c, x);
  const { distEem, proxEem, baseLumD, center, gauss, eemDiamMm, targetMaxLum } = nat;
  const les = c.lesion || {};

  // Unstented lumen diameters at slice
  let dMin = nat.dMin;
  let dMax = nat.dMax;

  // Virtual PCI stenting or pre-existing stent effect
  const stentActive = Boolean(options.stentDeployed || les.preStented);
  const plaqueModified = Boolean(options.plaqueModified);
  const potPerformed = Boolean(options.potPerformed);

  const caInfo = computeCalciumScore({
    calciumArcDeg: les.calciumArcDeg,
    calciumLengthMm: les.calciumLengthMm,
    calcifiedNodule: les.calcifiedNodule,
    eemDiamMm: distEem
  });

  // Stent covers [center - length/2 - 3, center + length/2 + 3]
  const stentStart = clamp(center - (les.lengthMm ?? 10) * 0.6 - 2, 3, len - 3);
  const stentEnd = clamp(center + (les.lengthMm ?? 10) * 0.6 + 2, 3, len - 3);
  const inStentZone = stentActive && x >= stentStart && x <= stentEnd;

  let stentDiamMm = 0;
  let malappositionMm = 0;

  if (inStentZone) {
    // A new virtual stent uses the recommended EAPCI size; a prior stent keeps its implanted size
    // (`preStentDiamMm`, else distal lumen + 0.15 mm). POT dilates the proximal part to the POT size.
    const sizing = caseStentSizing(c);
    const priorStentOnly = les.preStented && !options.stentDeployed;
    const nominalStentD = priorStentOnly
      ? clamp(les.preStentDiamMm ?? round((c.distalRef?.lumenDiamMm ?? 3.05) + 0.15, 2), 2.25, 4.5)
      : sizing.stentMm;
    const proxTargetD = potPerformed ? clamp(sizing.potMm, nominalStentD, 5.0) : nominalStentD;
    const desiredStentD = x >= center ? nominalStentD + ((proxTargetD - nominalStentD) * clamp((x - center) / Math.max(4, stentEnd - center), 0, 1)) : nominalStentD;

    // If heavy calcium (score >= 2) or preStented underexpansion without modification/POT
    let expansionFactor = 0.94;
    if (les.preStented && !options.stentDeployed && !potPerformed && !plaqueModified) {
      expansionFactor = les.preStentExpansionRatio ?? 0.72;
    } else if (caInfo.needsModification && !plaqueModified) {
      expansionFactor = 0.68;
    } else if (potPerformed) {
      expansionFactor = 0.98;
    }

    const lesionResist = gauss * (1 - expansionFactor);
    stentDiamMm = round(desiredStentD * (1 - lesionResist), 2);

    // Lumen inside stent follows stent contour
    dMin = Math.max(dMin, stentDiamMm * (1 - 0.04 * gauss));
    dMax = Math.max(dMax, stentDiamMm * (1 + 0.03 * gauss));

    // Proximal malapposition when stent is smaller than native lumen. Prior stents carry their
    // own measured gap (an underexpanded stent over calcium is constrained, hence apposed).
    const nativeLumAtX = baseLumD + (targetMaxLum - baseLumD) * gauss * 0.3;
    if (les.preStented && les.preStentMalappositionMm && !potPerformed && x > center + 2) {
      malappositionMm = round(les.preStentMalappositionMm * clamp((x - center) / 10, 0.3, 1), 2);
      stentDiamMm = round(Math.max(2.5, nativeLumAtX - malappositionMm * 1.4), 2);
      dMin = stentDiamMm;
      dMax = stentDiamMm + 0.1;
    } else if (!les.preStented && !potPerformed && nativeLumAtX - stentDiamMm > 0.35 && x > center + 3) {
      malappositionMm = round((nativeLumAtX - stentDiamMm) * 0.65, 2);
    }
  }

  dMin = round(clamp(dMin, 0.9, eemDiamMm - 0.25), 2);
  dMax = round(clamp(Math.max(dMin, dMax), dMin, eemDiamMm - 0.2), 2);

  const eemAreaMm2 = round(areaFromDiam(eemDiamMm), 2);
  const lumenAreaMm2 = round(Math.PI * (dMin / 2) * (dMax / 2), 2);
  const plaqueAreaMm2 = round(Math.max(0.2, eemAreaMm2 - lumenAreaMm2), 2);
  const plaqueBurdenPct = round((plaqueAreaMm2 / Math.max(1, eemAreaMm2)) * 100, 1);
  const eccentricityIndex = round((dMax - dMin) / Math.max(0.5, dMax), 2);

  // Remodeling index (area ratio): lesion EEM area / mean of proximal and distal reference EEM areas
  const meanRefEemArea = (areaFromDiam(distEem) + areaFromDiam(proxEem)) / 2;
  const remodelingIndex = round(eemAreaMm2 / Math.max(1, meanRefEemArea), 2);

  // Local calcium & pathology features weighted by proximity to lesion center
  const localWeight = gauss > 0.22 ? gauss : 0;
  const calciumArcDeg = Math.round((les.calciumArcDeg || 0) * (gauss > 0.35 ? Math.min(1, gauss * 1.25) : 0));
  const attenuationArcDeg = Math.round((les.attenuationArcDeg || 0) * (gauss > 0.35 ? Math.min(1, gauss * 1.25) : 0));
  const dissectionArcDeg = (options.bailoutStent ? 0 : (les.dissectionArcDeg || 0)) * (gauss > 0.4 ? 1 : 0);

  // Side branch at current position
  const activeSideBranch = (c.sideBranches || []).find(sb => Math.abs(sb.posMm - x) <= 1.8) || null;

  return {
    posMm: round(x, 1),
    eemDiamMm,
    dMin,
    dMax,
    meanLumenDiamMm: round((dMin + dMax) / 2, 2),
    eemAreaMm2,
    lumenAreaMm2,
    plaqueAreaMm2,
    plaqueBurdenPct,
    eccentricityIndex,
    remodelingIndex,
    eccentricityOffset: round((les.eccentricity || 0.2) * localWeight, 2),
    plaqueType: localWeight > 0.3 ? (les.plaqueType || 'fibrous') : 'normal',
    calciumArcDeg,
    calciumSuperficial: Boolean(les.calciumSuperficial),
    calcifiedNodule: Boolean(les.calcifiedNodule && gauss > 0.5),
    attenuationArcDeg,
    thrombus: Boolean(les.thrombus && gauss > 0.45),
    dissectionArcDeg: Math.round(dissectionArcDeg),
    halfMoonBridge: Boolean(les.halfMoonBridge && gauss > 0.35),
    inStentZone,
    stentDiamMm,
    stentAreaMm2: inStentZone ? round(areaFromDiam(stentDiamMm), 2) : 0,
    malappositionMm,
    activeSideBranch
  };
}

/** LCx ostium (carina / POC) position on a LM-to-LAD pullback, if the case defines one. */
function findCarinaMm(c) {
  if (Number.isFinite(c.carinaMm)) return c.carinaMm;
  const sb = (c.sideBranches || []).find(b => /LCx/i.test(b.name?.en || ''));
  return sb ? sb.posMm : null;
}

/**
 * Kang 2011 left main MSA targets evaluated per segment of a LAD-to-LM pullback: frames distal to
 * the LCx ostium are the LAD ostium (>6.0), the carina window is the POC (>7.0) and frames
 * proximal to it are the distal LM (>8.0). The LCx ostium (>5.0) needs a separate LCx pullback.
 */
function evaluateKangSegments(c, stentFrames) {
  const carina = findCarinaMm(c);
  const halfWindow = 1.8;
  const segOf = x => {
    if (carina == null) return 'ladOstium';
    if (x < carina - halfWindow) return 'ladOstium';
    if (x <= carina + halfWindow) return 'poc';
    return 'distalLm';
  };
  const minArea = { ladOstium: null, poc: null, distalLm: null };
  stentFrames.forEach(f => {
    const id = segOf(f.posMm);
    if (minArea[id] == null || f.stentAreaMm2 < minArea[id]) minArea[id] = f.stentAreaMm2;
  });
  const segments = ['ladOstium', 'poc', 'distalLm'].map(id => ({
    id,
    targetMm2: KANG_TARGETS[id],
    msaMm2: minArea[id],
    measured: minArea[id] != null,
    pass: minArea[id] != null ? minArea[id] > KANG_TARGETS[id] : null
  }));
  segments.push({ id: 'lcxOstium', targetMm2: KANG_TARGETS.lcxOstium, msaMm2: null, measured: false, pass: null });
  return segments;
}

/** Edge / lesion dissection summary from the pullback frames (ULTIMATE and EAPCI 2018 rules). */
function summarizeDissection(c, frames) {
  const les = c.lesion || {};
  const dissected = frames.filter(f => f.dissectionArcDeg > 0);
  const present = dissected.length > 0;
  const lengthMm = present ? round(Number(les.dissectionLengthMm) || dissected.length * FRAME_STEP_MM, 1) : 0;
  const arcDeg = present ? Math.max(...dissected.map(f => f.dissectionArcDeg)) : 0;
  const mediaInvolved = present && (les.dissectionMedia ?? true);
  const residualLumenMm2 = present ? Math.min(...dissected.map(f => f.lumenAreaMm2)) : null;
  const eapciMajor = present && (arcDeg >= 60 || lengthMm >= 3 || mediaInvolved || residualLumenMm2 < 4.0);
  const ultimateFail = mediaInvolved && lengthMm > ULTIMATE_DISSECTION_MM;
  return { present, lengthMm, arcDeg, mediaInvolved, residualLumenMm2, eapciMajor, ultimateFail };
}

/**
 * Computes full longitudinal pullback profile (0..40 mm), bookmarks, sizing recommendations, and ULTIMATE PCI status.
 * ULTIMATE optimal = expansion && landing-zone plaque burden <50% && no media-involving dissection >3 mm.
 * Malapposition is reported separately (`criterionApposition`, OCT-derived 0.4 mm axial over >1 mm).
 */
export function computePullbackProfile(caseObj, options = {}) {
  const c = caseObj || CLINICAL_CASES[0];
  const len = c.pullbackLengthMm || 40;
  const frames = [];

  let minLumenFrame = null;
  let minStentFrame = null;
  let maxMalappMm = 0;
  let malappFrames = 0;

  for (let x = 0; x <= len; x += FRAME_STEP_MM) {
    const slice = sampleIvusSlice(c, x, options);
    frames.push(slice);
    if (!minLumenFrame || slice.lumenAreaMm2 < minLumenFrame.lumenAreaMm2) {
      minLumenFrame = slice;
    }
    if (slice.inStentZone) {
      if (!minStentFrame || slice.stentAreaMm2 < minStentFrame.stentAreaMm2) {
        minStentFrame = slice;
      }
      if (slice.malappositionMm > maxMalappMm) {
        maxMalappMm = slice.malappositionMm;
      }
      if (slice.malappositionMm >= MALAPP_AXIAL_MM) malappFrames += 1;
    }
  }

  const distalRefSlice = sampleIvusSlice(c, c.distalRefMm ?? 6, options);
  const proxRefSlice = sampleIvusSlice(c, c.proxRefMm ?? 34, options);
  const mlaSlice = sampleIvusSlice(c, c.mlaMm ?? 20, options);

  const caScore = computeCalciumScore({
    calciumArcDeg: c.lesion?.calciumArcDeg,
    calciumLengthMm: c.lesion?.calciumLengthMm,
    calcifiedNodule: c.lesion?.calcifiedNodule,
    eemDiamMm: distalRefSlice.eemDiamMm
  });

  // EAPCI sizing from the native (pre-PCI) reference frames: distal EEM rounded down to 0.25 mm,
  // capped at distal mean lumen + 0.5 mm; POT = proximal mean lumen rounded to 0.25 mm.
  const sizing = caseStentSizing(c);
  const recommendedStentDiamMm = sizing.stentMm;
  const recommendedPotDiamMm = sizing.potMm;
  const recommendedStentLengthMm = Math.round((c.proxRefMm ?? 34) - (c.distalRefMm ?? 6));

  // Post-PCI optimization evaluation
  const msaMm2 = minStentFrame ? minStentFrame.stentAreaMm2 : 0;
  const expansionPct = msaMm2 > 0
    ? round((msaMm2 / Math.max(1.5, distalRefSlice.lumenAreaMm2)) * 100, 1)
    : 0;
  const isLeftMain = c.vessel === 'LMCA-LAD';
  const lmSegments = isLeftMain && minStentFrame
    ? evaluateKangSegments(c, frames.filter(f => f.inStentZone))
    : null;
  const targetMsaMm2 = isLeftMain ? KANG_TARGETS.ladOstium : ULTIMATE_MSA_MM2;

  const criterionExpansion = lmSegments
    ? lmSegments.filter(s => s.measured).every(s => s.pass)
    : msaMm2 > ULTIMATE_MSA_MM2 || expansionPct > ULTIMATE_EXPANSION_PCT;
  const criterionIvusXpl = msaMm2 > 0 && msaMm2 > distalRefSlice.lumenAreaMm2;
  const criterionLandingPb = distalRefSlice.plaqueBurdenPct < 50 && proxRefSlice.plaqueBurdenPct < 50;
  const dissection = summarizeDissection(c, frames);
  const criterionNoDissection = !dissection.ultimateFail;
  const malappLengthMm = round(malappFrames * FRAME_STEP_MM, 1);
  const criterionApposition = !(maxMalappMm >= MALAPP_AXIAL_MM && malappLengthMm > MALAPP_LENGTH_MM);
  const ultimateOptimal = Boolean(minStentFrame && criterionExpansion && criterionLandingPb && criterionNoDissection);

  return {
    frames,
    distalRefSlice,
    proxRefSlice,
    mlaSlice,
    minLumenFrame,
    minStentFrame,
    caScore,
    recommendedStentDiamMm,
    recommendedPotDiamMm,
    recommendedStentLengthMm,
    stentSizing: sizing,
    msaMm2,
    expansionPct,
    targetMsaMm2,
    lmSegments,
    maxMalappMm,
    malappLengthMm,
    dissection,
    criterionExpansion,
    criterionIvusXpl,
    criterionLandingPb,
    criterionNoDissection,
    criterionApposition,
    ultimateOptimal
  };
}

const MLA_VERDICT_TEXT = Object.freeze({
  small: { tr: 'MLA eşiği bu çapta güvenilir değil', en: 'MLA cut-off is not reliable at this vessel size' },
  belowLm: { tr: 'Revaskülarizasyon düşün', en: 'Consider revascularization' },
  belowNonLm: { tr: 'FFR/iFR ile doğrula (IVUS MLA tek başına özgüllüğü düşük)', en: 'Confirm with FFR/iFR (IVUS MLA alone has low specificity)' },
  grey: { tr: 'Gri zon (eşiğin 0.5 mm² üstü): FFR/iFR veya klinik bulgularla değerlendir', en: 'Grey zone (within 0.5 mm² above cut-off): assess with FFR/iFR or clinical findings' },
  above: { tr: 'Erteleme makul (klinikle birlikte)', en: 'Deferral reasonable (together with clinical context)' }
});

function evaluateNormalMla(v, isTr) {
  const idx = clamp(Math.round(v('segment')), 0, NORMAL_SEGMENTS.length - 1);
  const seg = NORMAL_SEGMENTS[idx];
  const refDiam = v('refDiam');
  const res = assessMla({
    segmentId: seg.id,
    refDiamMm: refDiam > 0 ? refDiam : undefined,
    mlaMm2: v('mla'),
    population: seg.leftMain && v('asian') >= 1 ? 'asian' : 'western'
  });
  const pick = t => (isTr ? t.tr : t.en);
  const normalD = `${seg.approx ? '≈' : ''}${seg.diamMm.toFixed(1)} mm`;
  const usedRef = refDiam > 0
    ? (isTr ? ` · referans ${res.refDiamMm.toFixed(2)} mm` : ` · reference ${res.refDiamMm.toFixed(2)} mm`)
    : '';

  let verdictText;
  let verdictStatus;
  if (res.smallVessel) {
    verdictText = pick(MLA_VERDICT_TEXT.small);
    verdictStatus = 'warn';
  } else if (res.verdict === 'below') {
    verdictText = pick(res.leftMain ? MLA_VERDICT_TEXT.belowLm : MLA_VERDICT_TEXT.belowNonLm);
    verdictStatus = 'bad';
  } else if (res.verdict === 'grey') {
    verdictText = pick(MLA_VERDICT_TEXT.grey);
    verdictStatus = 'warn';
  } else {
    verdictText = pick(MLA_VERDICT_TEXT.above);
    verdictStatus = 'ok';
  }

  return {
    assessment: res,
    rows: [
      {
        label: isTr ? 'Segment & Normal Çap (Dodge 1992)' : 'Segment & Normal Diameter (Dodge 1992)',
        value: `${pick(seg.name)} · ${normalD}${usedRef}`,
        status: 'ok'
      },
      {
        label: isTr ? 'Normal Lümen Alanı' : 'Normal Lumen Area',
        value: `${res.normalAreaMm2.toFixed(2)} mm²`,
        status: 'ok'
      },
      {
        label: isTr ? 'MLA’dan MLD (Eşdeğer Çap)' : 'MLD from MLA (Equivalent Diameter)',
        value: `${res.mldMm.toFixed(2)} mm`,
        status: 'ok'
      },
      {
        label: isTr ? 'Alan Darlığı' : 'Area Stenosis',
        value: `%${res.areaStenosisPct.toFixed(1)}`,
        status: res.areaStenosisPct >= 70 ? 'bad' : res.areaStenosisPct >= 50 ? 'warn' : 'ok'
      },
      {
        label: isTr ? 'İskemik MLA Eşiği' : 'Ischemic MLA Cut-off',
        value: `${res.cutoffMm2.toFixed(1)} mm² · ${res.cutoffSource}`,
        status: 'ok'
      },
      {
        label: isTr ? 'Karar' : 'Verdict',
        value: verdictText,
        status: verdictStatus
      }
    ]
  };
}

function evaluateCalciumScoreCard(v, isTr) {
  const res = computeCalciumScore({
    caArcDeg: v('caArcDeg'),
    caLenMm: v('caLenMm'),
    hasNodule: v('hasNodule') >= 1,
    vesselEemMm: v('vesselEemMm')
  });

  const scoreStatus = !res.applicable
    ? (res.ptNodule ? 'warn' : 'ok')
    : res.score >= 2 ? 'bad' : res.score === 1 ? 'warn' : 'ok';
  const scoreValue = res.applicable
    ? `${res.score} / 4`
    : (isTr ? `${res.score} / 4 (uygulanamaz: ark ≤270°)` : `${res.score} / 4 (not applicable: arc ≤270°)`);

  let strategy;
  if (!res.applicable) {
    strategy = isTr
      ? 'Skor uygulanamaz; standart NC balon hazırlığı genellikle yeterli'
      : 'Score not applicable; standard NC balloon preparation usually suffices';
    if (res.ptNodule) {
      strategy += isTr ? ' (kalsifiye nodül: IVL / aterektomi düşün)' : ' (calcified nodule: consider IVL / atherectomy)';
    }
  } else if (res.needsModification) {
    strategy = isTr
      ? `Plak modifikasyonu önerilir (IVL / Rotablasyon)${res.highestRisk ? ' · skor 4: en yüksek az açılım riski' : ''}`
      : `Plaque modification recommended (IVL / Atherectomy)${res.highestRisk ? ' · score 4: highest underexpansion risk' : ''}`;
  } else {
    strategy = isTr ? 'Yüksek basınçlı NC / Cutting balon' : 'High-pressure NC / Cutting balloon';
  }

  return {
    score: res,
    rows: [
      {
        label: isTr ? 'IVUS Kalsiyum Skoru (0–4)' : 'IVUS Calcium Score (0–4)',
        value: scoreValue,
        status: scoreStatus
      },
      {
        label: isTr ? 'Kriter Dağılımı' : 'Criteria Breakdown',
        value: `>270° & >5 mm:${res.ptArc270Len5} · 360°:${res.ptCa360} · CN:${res.ptNodule} · <3.5 mm:${res.ptSmallVessel}`,
        status: res.applicable && res.score >= 2 ? 'warn' : 'ok'
      },
      {
        label: isTr ? 'Klinik Strateji Önerisi' : 'Recommended Strategy',
        value: strategy,
        status: res.needsModification ? 'bad' : 'ok'
      }
    ]
  };
}

function evaluateStentSizingCard(v, isTr) {
  const distEemD = Math.max(2.0, v('distEemD'));
  const distLumD = Math.max(1.5, v('distLumD'));
  const proxEemD = Math.max(distEemD, v('proxEemD'));
  const proxLumD = Math.max(distLumD, v('proxLumD'));
  const len = Math.max(8, v('lesionLen'));

  const size = recommendStentSize({ distEemD, distLumD, proxLumD });
  const targetMsa = round(areaFromDiam(distLumD) * (ULTIMATE_EXPANSION_PCT / 100), 2);

  return {
    sizing: size,
    rows: [
      {
        label: isTr ? 'Distal EEM Bazlı (0.25 mm aşağı yuvarla)' : 'Distal EEM-Based (round down to 0.25 mm)',
        value: `${size.eemBasedMm.toFixed(2)} mm`,
        status: 'ok'
      },
      {
        label: isTr ? 'Distal Lümen Bazlı (lümen + 0–0.25 mm)' : 'Distal Lumen-Based (lumen + 0–0.25 mm)',
        value: `${size.lumenBasedMm.toFixed(2)} mm`,
        status: 'ok'
      },
      {
        label: isTr ? 'Önerilen Stent (EEM bazlı, ≤ lümen + 0.5 mm)' : 'Recommended Stent (EEM-based, ≤ lumen + 0.5 mm)',
        value: `${size.stentMm.toFixed(2)} mm`,
        status: 'ok'
      },
      {
        label: isTr ? 'Önerilen Proksimal POT NC Balon' : 'Recommended Proximal POT NC Balloon',
        value: `${size.potMm.toFixed(2)} mm (EEM ${proxEemD.toFixed(1)} mm)`,
        status: 'ok'
      },
      {
        label: isTr ? 'Stent Uzunluğu & Hedef MSA (ULTIMATE >%90)' : 'Stent Length & Target MSA (ULTIMATE >90%)',
        value: `${len} mm · MSA > ${targetMsa.toFixed(1)} mm² | > ${ULTIMATE_MSA_MM2.toFixed(1)} mm²`,
        status: 'ok'
      }
    ]
  };
}

function evaluateUltimateCard(v, isTr) {
  const msa = v('msaMm2');
  const distLum = Math.max(1.5, v('distRefLumMm2'));
  const edgePb = v('edgePbPct');
  const dissectMm = v('edgeDissectMm');
  const malappMm = v('malappMm');

  const expPct = round((msa / distLum) * 100, 1);
  const c1 = msa > ULTIMATE_MSA_MM2 || expPct > ULTIMATE_EXPANSION_PCT;
  const c2 = edgePb < 50;
  const c3 = dissectMm <= ULTIMATE_DISSECTION_MM;
  const allOptimal = c1 && c2 && c3;
  const xpl = msa > distLum;
  const apposed = malappMm < MALAPP_AXIAL_MM;

  return {
    rows: [
      {
        label: isTr ? '1. Stent Açılımı (MSA >5.0 mm² veya >%90 distal lümen)' : '1. Stent Expansion (MSA >5.0 mm² or >90% distal lumen)',
        value: `${msa.toFixed(1)} mm² (%${expPct})`,
        status: c1 ? 'ok' : 'bad'
      },
      {
        label: isTr ? '2. Kenar Plak Yükü (<%50 Hedef)' : '2. Landing Edge Plaque Burden (<50%)',
        value: `%${edgePb.toFixed(0)}`,
        status: c2 ? 'ok' : 'warn'
      },
      {
        label: isTr ? '3. Media Tutulumlu Kenar Diseksiyonu (>3 mm yok)' : '3. Media-Involving Edge Dissection (none >3 mm)',
        value: `${dissectMm.toFixed(1)} mm`,
        status: c3 ? 'ok' : 'bad'
      },
      {
        label: isTr ? 'ULTIMATE Sonucu' : 'ULTIMATE Verdict',
        value: allOptimal
          ? (isTr ? 'OPTİMAL IVUS-Rehberli PCI' : 'OPTIMAL IVUS-Guided PCI')
          : (isTr ? 'SUBOPTİMAL (Post-dilatasyon / Ek Stent)' : 'SUBOPTIMAL (Needs Post-dilatation / Bailout)'),
        status: allOptimal ? 'ok' : 'bad'
      },
      {
        label: isTr ? 'IVUS-XPL: MSA > Distal Referans Lümen Alanı' : 'IVUS-XPL: MSA > Distal Reference Lumen Area',
        value: `${msa.toFixed(1)} / ${distLum.toFixed(1)} mm²`,
        status: xpl ? 'ok' : 'warn'
      },
      {
        label: isTr ? 'Apozisyon Kontrolü (OCT kaynaklı eşik: aksiyel <0.4 mm)' : 'Apposition Check (OCT-derived threshold: axial <0.4 mm)',
        value: `${malappMm.toFixed(2)} mm`,
        status: apposed ? 'ok' : 'warn'
      }
    ]
  };
}

/**
 * Evaluates an interactive IVUS calculator card.
 */
export function evaluateIvusCalculator(cardId, values = {}, lang = 'tr') {
  const isTr = lang === 'tr';
  const v = key => Number(values[key]) || 0;

  switch (cardId) {
    case 'normal-mla':
      return evaluateNormalMla(v, isTr);

    case 'plaque-remodeling': {
      const eem = Math.max(2, v('eemArea'));
      const lum = clamp(v('lumenArea'), 0.5, eem - 0.1);
      const refEem = Math.max(2, v('refEemArea'));
      const dMin = Math.max(0.5, v('dMin'));
      const dMax = Math.max(dMin, v('dMax'));

      const pb = round(((eem - lum) / eem) * 100, 1);
      // RI is an area ratio: lesion EEM area / mean reference EEM area
      const ri = round(eem / refEem, 2);
      const ei = round((dMax - dMin) / dMax, 2);

      const riLabel = ri > 1.05
        ? (isTr ? `${ri.toFixed(2)} (Pozitif / Glagov)` : `${ri.toFixed(2)} (Positive / Glagov)`)
        : ri < 0.95
          ? (isTr ? `${ri.toFixed(2)} (Negatif / Konstriktif)` : `${ri.toFixed(2)} (Negative / Constrictive)`)
          : (isTr ? `${ri.toFixed(2)} (Ara / Dengeli)` : `${ri.toFixed(2)} (Intermediate)`);

      return {
        rows: [
          {
            label: isTr ? 'Plak + Media Alanı' : 'Plaque + Media Area',
            value: `${(eem - lum).toFixed(2)} mm²`,
            status: 'ok'
          },
          {
            label: isTr ? 'Plak Yükü (Plaque Burden)' : 'Plaque Burden (PB)',
            value: `%${pb.toFixed(1)}`,
            status: pb >= 70 ? 'bad' : pb >= 50 ? 'warn' : 'ok'
          },
          {
            label: isTr ? 'Remodeling İndeksi (RI, alan oranı)' : 'Remodeling Index (RI, area ratio)',
            value: riLabel,
            status: ri > 1.05 ? 'warn' : 'ok'
          },
          {
            label: isTr ? 'Lümen Eksantrisite İndeksi' : 'Lumen Eccentricity Index',
            value: ei.toFixed(2),
            status: ei >= 0.3 ? 'warn' : 'ok'
          }
        ]
      };
    }

    case 'stent-sizing':
      return evaluateStentSizingCard(v, isTr);

    case 'calcium-score':
      return evaluateCalciumScoreCard(v, isTr);

    case 'ultimate-pci':
      return evaluateUltimateCard(v, isTr);

    case 'lmca-kang': {
      const preMla = v('preLmMla');
      const lcx = v('lcxOstMsa');
      const lad = v('ladOstMsa');
      const poc = v('pocMsa');
      const distLm = v('distLmMsa');

      const preStatus = preMla < 4.5 ? 'bad' : preMla < 6.0 ? 'warn' : 'ok';
      const preText = preMla < 4.5
        ? (isTr ? `${preMla.toFixed(1)} mm² (<4.5 · Revaskülarize Et)` : `${preMla.toFixed(1)} mm² (<4.5 · Revascularize)`)
        : preMla < 6.0
          ? (isTr ? `${preMla.toFixed(1)} mm² (4.5–6.0 · Gri Zon / FFR)` : `${preMla.toFixed(1)} mm² (4.5–6.0 · Gray Zone / FFR)`)
          : (isTr ? `${preMla.toFixed(1)} mm² (≥6.0 · Güvenli Erteleme)` : `${preMla.toFixed(1)} mm² (≥6.0 · Safe to Defer)`);

      const kangPass = lcx >= 5 && lad >= 6 && poc >= 7 && distLm >= 8;

      return {
        rows: [
          {
            label: isTr ? 'Pre-PCI LMCA MLA Değerlendirmesi' : 'Pre-PCI LMCA MLA Assessment',
            value: preText,
            status: preStatus
          },
          {
            label: isTr ? 'LCx (>5) & LAD (>6) Ostial MSA' : 'LCx (>5) & LAD (>6) Ostial MSA',
            value: `LCx ${lcx.toFixed(1)} · LAD ${lad.toFixed(1)} mm²`,
            status: lcx >= 5 && lad >= 6 ? 'ok' : 'bad'
          },
          {
            label: isTr ? 'POC (>7) & Distal LMCA (>8) MSA' : 'POC (>7) & Distal LMCA (>8) MSA',
            value: `POC ${poc.toFixed(1)} · LM ${distLm.toFixed(1)} mm²`,
            status: poc >= 7 && distLm >= 8 ? 'ok' : 'bad'
          },
          {
            label: isTr ? 'Kang 5-6-7-8 Bifurkasyon Kuralı' : 'Kang 5-6-7-8 Bifurcation Rule',
            value: kangPass
              ? (isTr ? 'TAMAMI SAĞLANDI (Düşük Restenoz Riski)' : 'ALL MET (Low ISR Risk)')
              : (isTr ? 'ALTINDA KALDI (Kissing / POT Optimize Et)' : 'UNDERSIZED (Optimize Kissing / POT)'),
            status: kangPass ? 'ok' : 'bad'
          }
        ]
      };
    }

    default:
      return { rows: [] };
  }
}

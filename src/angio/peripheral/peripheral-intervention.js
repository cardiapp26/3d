/*
 * Endovascular procedure on the selected peripheral lesion (pure, no DOM):
 * access and wire, translesional pullback gradient, lesion preparation,
 * balloon angioplasty, stent and the completion angiogram, with QCA
 * (reference diameter, MLD, % diameter stenosis) and flow after each step.
 *
 * Teaching heuristics, not device instructions for use: balloon compliance,
 * the calcium "waist", elastic recoil, dissection and rupture risk, stent
 * expansion and the pressure gradient are simplified to show the direction of
 * each effect. Not for procedural planning or device selection.
 */

/** Per lesion: reference diameter and length (mm), calcium 0-3, vascular bed, access ratings, wires, stent types that fit. */
export const PERI_PROCEDURE_SPECS = Object.freeze({
  'leriche-tasc-d': {
    refMm: 8, lengthMm: 60, calcium: 2, bed: 'aortoiliac',
    access: { 'femoral-bilat': 'best', radial: 'ok', 'femoral-contra': 'avoid', 'femoral-ante': 'avoid' },
    wires: ['0.035'], stents: ['covered', 'be']
  },
  'right-cia-ostial': {
    refMm: 8, lengthMm: 25, calcium: 1, bed: 'iliac',
    access: { 'femoral-retro': 'best', 'femoral-contra': 'ok', radial: 'ok', 'femoral-ante': 'avoid' },
    wires: ['0.035'], stents: ['be', 'covered']
  },
  'cfa-bifurcation-plaque': {
    refMm: 7, lengthMm: 30, calcium: 3, bed: 'cfa',
    access: { 'femoral-contra': 'best', radial: 'ok', 'femoral-retro': 'avoid', 'femoral-ante': 'avoid' },
    wires: ['0.035', '0.018'], stents: []
  },
  'profunda-ostial-stenosis': {
    refMm: 5, lengthMm: 15, calcium: 2, bed: 'femoral',
    access: { 'femoral-contra': 'best', 'femoral-ante': 'ok', 'femoral-retro': 'avoid' },
    wires: ['0.018', '0.014'], stents: []
  },
  'sfa-hunter-cto': {
    refMm: 5.5, lengthMm: 120, calcium: 2, bed: 'femoropopliteal',
    access: { 'femoral-contra': 'best', 'femoral-ante': 'best', pedal: 'ok', radial: 'avoid' },
    wires: ['0.035', '0.018'], stents: ['se']
  },
  'btk-at-clti': {
    refMm: 3, lengthMm: 20, calcium: 3, bed: 'tibial',
    access: { 'femoral-ante': 'best', 'femoral-contra': 'ok', pedal: 'ok', radial: 'avoid' },
    wires: ['0.014'], stents: []
  },
  'renal-ostial-ras': {
    refMm: 6, lengthMm: 10, calcium: 1, bed: 'renal',
    access: { 'femoral-retro': 'best', radial: 'ok' },
    wires: ['0.014', '0.018'], stents: ['be']
  },
  'celiac-sma-mesenteric': {
    refMm: 7, lengthMm: 12, calcium: 2, bed: 'mesenteric',
    access: { radial: 'best', 'femoral-retro': 'ok' },
    wires: ['0.014', '0.018'], stents: ['be', 'covered']
  },
  'subclavian-steal': {
    refMm: 8, lengthMm: 20, calcium: 1, bed: 'subclavian',
    access: { 'femoral-retro': 'best', radial: 'best' },
    wires: ['0.035'], stents: ['be']
  }
});

export const PERI_WIRES = Object.freeze(['0.035', '0.018', '0.014']);
export const PERI_PREP_DEVICES = Object.freeze(['predil', 'scoring', 'ivl', 'orbital', 'directional']);
export const PERI_IVL_CYCLES = Object.freeze([4, 6, 8, 10]);
export const PERI_ORBITAL_CROWNS = Object.freeze([1.25, 1.5, 2.0]);
export const PERI_SEVERITIES = Object.freeze([50, 70, 90, 100]);

/** Balloons: nominal and rated burst pressure (atm), diameter growth per atm as a fraction of nominal. */
export const PERI_BALLOONS = Object.freeze({
  semi: { nominal: 8, rbp: 14, compliance: 0.012 },
  nc: { nominal: 12, rbp: 20, compliance: 0.004 },
  dcb: { nominal: 7, rbp: 12, compliance: 0.012 }
});
export const PERI_STENTS = Object.freeze(['se', 'be', 'covered']);
const BALLOON_SIZES = [2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 12];
const LENGTHS = [20, 40, 60, 80, 100, 120, 150, 200];
const ATHERECTOMY = new Set(['orbital', 'directional']);
const ATHERECTOMY_BEDS = new Set(['cfa', 'femoral', 'femoropopliteal', 'tibial']);
const OSTIAL_BEDS = new Set(['iliac', 'aortoiliac', 'renal', 'mesenteric', 'subclavian']);
const AORTIC_SYSTOLIC = 130;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round1 = (v) => Math.round(v * 10) / 10;

export const specFor = (lesionId) => PERI_PROCEDURE_SPECS[lesionId] || null;

/** Balloon and stent diameters offered for a lesion (reference -2 .. +2 mm). */
export const diameterOptions = (spec) => [...new Set([...BALLOON_SIZES.filter((d) => d >= spec.refMm - 2 && d <= spec.refMm + 2), spec.refMm, spec.refMm + 1])].sort((a, b) => a - b);
/** Lengths offered: up to the first one that covers the lesion with 10 mm margins, plus one longer. */
export function lengthOptions(spec) {
  const enough = LENGTHS.findIndex((l) => l >= spec.lengthMm + 20);
  return LENGTHS.slice(0, enough < 0 ? LENGTHS.length : Math.min(LENGTHS.length, enough + 2));
}

/** Peak systolic translesional gradient (mmHg) at rest or after intra-arterial nitroglycerin. */
export function translesionalGradient(pct, { ntg = false } = {}) {
  const rest = pct >= 99 ? 60 : pct < 50 ? Math.round(pct / 12) : Math.round(4 + 66 * ((pct - 50) / 49) ** 2);
  // Capped so distal pressure never reads below ~40 mmHg with the catheter across.
  const value = Math.min(90, ntg ? Math.round(rest * 1.5 + (pct >= 50 ? 4 : 1)) : rest);
  return { gradient: value, pdPa: Math.round(((AORTIC_SYSTOLIC - value) / AORTIC_SYSTOLIC) * 100) / 100, significant: ntg ? value >= 20 : value >= 10 };
}

/** Flow on the angiogram: 'brisk' | 'slow' | 'none' | 'extravasation'. */
export function flowOf(state) {
  if (state.perforation && !state.perforationSealed) return 'extravasation';
  if (state.pct >= 99) return 'none';
  if (state.dissection === 'flow-limiting' || state.embolization || state.pct >= 85) return 'slow';
  return 'brisk';
}

/** Reference diameter, minimal lumen diameter, % diameter stenosis and flow now. */
export function qca(state) {
  return { refMm: state.spec.refMm, mldMm: round1(state.spec.refMm * (1 - state.pct / 100)), pct: state.pct, flow: flowOf(state) };
}

const log = (state, step, code, data = {}) => [...state.log, Object.freeze({ step, code, data })];

/** A fresh procedure for a lesion at a chosen severity (% diameter stenosis, 100 = occluded). */
export function createProcedure(lesion, severity = lesion?.pct ?? 70) {
  const spec = specFor(lesion?.id);
  if (!spec) return null;
  const pct = clamp(Math.round(severity), 30, 100);
  const accessIds = Object.keys(spec.access);
  return Object.freeze({
    lesionId: lesion.id,
    spec,
    baselinePct: pct,
    pct,
    access: accessIds.find((id) => spec.access[id] === 'best') || accessIds[0],
    wire: spec.wires[0],
    crossed: false,
    wasCto: pct >= 99,
    crossingFailed: null,
    catheterBeyond: false,
    gradient: null,
    prep: { device: spec.calcium >= 2 ? 'ivl' : 'predil', cycles: 6, crown: 1.5, filter: false, done: [] },
    calcium: spec.calcium,
    balloon: { type: spec.calcium >= 3 ? 'nc' : 'semi', diameter: spec.refMm, length: lengthOptions(spec).find((l) => l >= spec.lengthMm + 20) || 200, offset: 0, positioned: false, pressure: 0, maxPressure: 0, waistBroken: false, inflations: 0 },
    stent: { type: spec.stents[0] || 'se', diameter: spec.refMm + (spec.stents[0] === 'se' ? 1 : 0), length: lengthOptions(spec).find((l) => l >= spec.lengthMm + 20) || 200, offset: 0, deployed: null },
    dissection: 'none',
    perforation: false,
    perforationSealed: false,
    embolization: false,
    dcbResult: null,
    completion: null,
    log: Object.freeze([])
  });
}

const patch = (state, changes) => Object.freeze({ ...state, ...changes });

// ---- Step 1: access and wire --------------------------------------------------

export const chooseAccess = (state, access) => (state.crossed || !state.spec.access[access] ? state : patch(state, { access, crossingFailed: null }));
export const chooseWire = (state, wire) => (state.crossed || !PERI_WIRES.includes(wire) ? state : patch(state, { wire, crossingFailed: null }));

/** Advance the wire across the lesion from the chosen access. */
export function advanceWire(state) {
  if (state.crossed) return state;
  const rating = state.spec.access[state.access];
  if (rating === 'avoid') {
    return patch(state, { crossingFailed: 'access', log: log(state, 1, 'wireFailAccess', { access: state.access }) });
  }
  if (state.spec.bed === 'tibial' && state.wire === '0.035') {
    return patch(state, { crossingFailed: 'wire', log: log(state, 1, 'wireFailSize', { wire: state.wire }) });
  }
  const occluded = state.pct >= 99;
  const wireFit = state.spec.wires.includes(state.wire) ? 'fit' : 'off';
  return patch(state, {
    crossed: true,
    crossingFailed: null,
    // A crossed occlusion leaves a channel the size of the wire and support catheter.
    pct: occluded ? 95 : state.pct,
    log: log(state, 1, occluded ? 'wireCrossCto' : 'wireCross', { access: state.access, rating, wire: state.wire, wireFit })
  });
}

// ---- Step 2: pullback gradient -------------------------------------------------

export function advanceCatheter(state) {
  if (!state.crossed || state.catheterBeyond) return state;
  return patch(state, { catheterBeyond: true, log: log(state, 2, 'catheterBeyond') });
}

export function pullback(state, { ntg = false } = {}) {
  if (!state.catheterBeyond) return state;
  const g = translesionalGradient(state.pct, { ntg });
  return patch(state, { gradient: { ...g, ntg, pct: state.pct }, log: log(state, 2, ntg ? 'gradientNtg' : 'gradientRest', g) });
}

// ---- Step 3: lesion preparation -------------------------------------------------

export function setPrep(state, changes) {
  const prep = { ...state.prep, ...changes };
  if (!PERI_PREP_DEVICES.includes(prep.device)) return state;
  return patch(state, { prep: Object.freeze(prep) });
}

/** Calcium removed and lumen gained by one preparation device. */
export function prepEffect(prep) {
  switch (prep.device) {
    case 'ivl': return { calcium: Math.min(2.5, 0.3 * prep.cycles), gain: 15 };
    case 'orbital': return { calcium: prep.crown >= 2 ? 1.6 : prep.crown >= 1.5 ? 1.3 : 1.0, gain: 15 };
    case 'directional': return { calcium: 1.0, gain: 25 };
    case 'scoring': return { calcium: 0.7, gain: 20 };
    default: return { calcium: 0.3, gain: 20 };
  }
}

export function treatLesion(state) {
  if (!state.crossed) return state;
  const { device } = state.prep;
  const effect = prepEffect(state.prep);
  const calcium = round1(Math.max(0, state.calcium - effect.calcium));
  const pct = Math.max(40, state.pct - effect.gain);
  const atherectomy = ATHERECTOMY.has(device);
  const embolization = state.embolization || (atherectomy && !state.prep.filter && state.spec.calcium >= 2);
  const notes = [];
  if (device === 'ivl' && state.spec.calcium <= 1) notes.push('ivlLowCalcium');
  if (atherectomy && !ATHERECTOMY_BEDS.has(state.spec.bed)) notes.push('atherectomyBed');
  if (atherectomy && !state.prep.filter) notes.push('noFilter');
  return patch(state, {
    calcium,
    pct,
    embolization,
    prep: Object.freeze({ ...state.prep, done: [...state.prep.done, device] }),
    log: log(state, 3, 'prepDone', { device, cycles: state.prep.cycles, crown: state.prep.crown, calcium, pct, notes })
  });
}

// ---- Step 4: balloon ---------------------------------------------------------------

export function setBalloon(state, changes) {
  if (state.balloon.pressure > 0) return state;
  const balloon = { ...state.balloon, ...changes };
  if (!PERI_BALLOONS[balloon.type]) return state;
  // Changing the balloon withdraws it: it has to be positioned again.
  const repositioned = ['type', 'diameter', 'length'].some((k) => k in changes) ? { positioned: false, maxPressure: 0, waistBroken: false } : {};
  return patch(state, { balloon: Object.freeze({ ...balloon, ...repositioned }) });
}

/** Lesion length (mm) a device of this length and offset leaves uncovered. */
export const uncoveredMm = (spec, lengthMm, offsetMm) => Math.max(0, Math.abs(offsetMm) + spec.lengthMm / 2 - lengthMm / 2);

export function positionBalloon(state) {
  if (!state.crossed || state.balloon.pressure > 0) return state;
  const miss = uncoveredMm(state.spec, state.balloon.length, state.balloon.offset);
  return patch(state, {
    balloon: Object.freeze({ ...state.balloon, positioned: true, maxPressure: 0, waistBroken: false }),
    log: log(state, 4, 'balloonPositioned', { type: state.balloon.type, diameter: state.balloon.diameter, length: state.balloon.length, miss })
  });
}

/** Pressure (atm) at which the calcium waist gives way: 2 atm with no calcium, 16 atm for untreated severe calcium. */
export const waistPressure = (calcium) => round1(2 * 2 ** calcium);

/** Balloon diameter (mm) at a pressure. */
export function balloonDiameter(balloon, pressure) {
  const spec = PERI_BALLOONS[balloon.type];
  return round1(balloon.diameter * (1 + spec.compliance * (pressure - spec.nominal)));
}

/** Lumen (mm) the inflated balloon holds open now, and whether a waist still shows. */
export function balloonLumen(state) {
  const { balloon } = state;
  if (balloon.pressure <= 0) return { lumenMm: 0, waist: false };
  const dia = balloonDiameter(balloon, balloon.pressure);
  const mld = state.spec.refMm * (1 - state.pct / 100);
  const broken = balloon.waistBroken || balloon.pressure >= waistPressure(state.calcium);
  return broken ? { lumenMm: dia, waist: false } : { lumenMm: round1(mld + (dia - mld) * 0.35 * (balloon.pressure / waistPressure(state.calcium))), waist: true };
}

export function setPressure(state, pressure) {
  if (!state.balloon.positioned) return state;
  const spec = PERI_BALLOONS[state.balloon.type];
  const p = clamp(Math.round(pressure), 0, spec.rbp);
  const waistBroken = state.balloon.waistBroken || p >= waistPressure(state.calcium);
  return patch(state, { balloon: Object.freeze({ ...state.balloon, pressure: p, maxPressure: Math.max(state.balloon.maxPressure, p), waistBroken }) });
}

/** Dissection grade after an inflation: 'none' | 'minor' (types A-B) | 'major' (C) | 'flow-limiting' (D-F). */
export function dissectionAfter(ratio, calcium, abruptWaist, crossedOcclusion = false) {
  // A crossed occlusion is often subintimal: the channel itself is a controlled dissection.
  const score = Math.max(0, ratio - 1) * 12 + calcium * 0.6 + (abruptWaist ? 1 : 0) + (crossedOcclusion ? 1.5 : 0);
  if (score < 1) return 'none';
  if (score < 2) return 'minor';
  if (score < 3) return 'major';
  return 'flow-limiting';
}

const DISSECTION_ORDER = ['none', 'minor', 'major', 'flow-limiting'];
const worse = (a, b) => (DISSECTION_ORDER.indexOf(a) >= DISSECTION_ORDER.indexOf(b) ? a : b);

/** Deflate: elastic recoil, residual stenosis, dissection and rupture from the inflation just done. */
export function deflate(state) {
  const { balloon, spec } = state;
  if (!balloon.positioned || balloon.maxPressure <= 0) return state;
  const bSpec = PERI_BALLOONS[balloon.type];
  const dMax = balloonDiameter(balloon, balloon.maxPressure);
  const mld = spec.refMm * (1 - state.pct / 100);
  const achieved = balloon.waistBroken ? dMax : mld + (dMax - mld) * 0.35;
  // Elastic recoil grows with calcium and with long lesions.
  const recoil = 0.12 + 0.07 * state.calcium + (spec.lengthMm >= 100 ? 0.08 : 0);
  const lumen = Math.max(mld, achieved * (1 - recoil));
  let pct = clamp(Math.round(100 * (1 - lumen / spec.refMm)), 0, 100);
  const miss = uncoveredMm(spec, balloon.length, balloon.offset);
  if (miss > 0) pct = Math.max(pct, Math.round(state.pct * Math.min(1, miss / spec.lengthMm) + pct * 0.5));
  pct = Math.min(state.pct, pct);
  const ratio = dMax / spec.refMm;
  const abrupt = balloon.waistBroken && waistPressure(state.calcium) >= 10;
  const dissection = worse(state.dissection, dissectionAfter(ratio, state.calcium, abrupt, state.wasCto));
  const rupture = !state.perforation && ratio >= 1.2 && state.calcium >= 2 && balloon.maxPressure >= bSpec.rbp * 0.9;
  const dcbResult = balloon.type === 'dcb' ? (pct <= 30 && dissection !== 'flow-limiting' && !rupture ? 'ok' : 'needs-stent') : state.dcbResult;
  return patch(state, {
    pct,
    dissection,
    perforation: state.perforation || rupture,
    dcbResult,
    balloon: Object.freeze({ ...balloon, pressure: 0, maxPressure: 0, waistBroken: false, inflations: balloon.inflations + 1 }),
    log: log(state, 4, 'balloonDeflated', { type: balloon.type, pressure: balloon.maxPressure, dMax, waist: !balloon.waistBroken, recoil: Math.round(recoil * 100), pct, miss, dissection, rupture, dcbResult })
  });
}

// ---- Step 5: stent -------------------------------------------------------------------

export function setStent(state, changes) {
  if (state.stent.deployed) return state;
  const stent = { ...state.stent, ...changes };
  if (!PERI_STENTS.includes(stent.type)) return state;
  return patch(state, { stent: Object.freeze(stent) });
}

/** Warnings for a stent type in this bed and size. */
export function stentWarnings(state) {
  const { spec } = state;
  const { type, diameter } = state.stent;
  const notes = [];
  if (spec.bed === 'cfa') notes.push('cfaNoStent');
  if (spec.bed === 'tibial') notes.push('tibialBailout');
  if (spec.bed === 'femoral') notes.push('profundaStent');
  if (type === 'be' && spec.bed === 'femoropopliteal') notes.push('beCrush');
  if (type === 'se' && OSTIAL_BEDS.has(spec.bed)) notes.push('seOstial');
  const ideal = type === 'se' ? spec.refMm + 1 : spec.refMm;
  if (diameter < spec.refMm - 0.25) notes.push('undersized');
  if (diameter > ideal + 1) notes.push('oversized');
  if (uncoveredMm(spec, state.stent.length, state.stent.offset) > 0) notes.push('geographicMiss');
  return notes;
}

export function deployStent(state) {
  if (!state.crossed || state.stent.deployed) return state;
  const { spec, stent } = state;
  const notes = stentWarnings(state);
  const calcPenalty = state.calcium * (stent.type === 'se' ? 6 : 5);
  let pct = stent.type === 'se' ? Math.max(8, state.pct * 0.35) : Math.max(5, state.pct * 0.2);
  pct += calcPenalty;
  if (notes.includes('undersized')) pct += 15;
  const miss = uncoveredMm(spec, stent.length, stent.offset);
  if (miss > 0) pct = Math.max(pct, state.pct * Math.min(1, miss / spec.lengthMm));
  pct = clamp(Math.round(Math.min(pct, state.pct)), 0, 100);
  const overRatio = stent.diameter / spec.refMm;
  const rupture = !state.perforation && stent.type !== 'se' && overRatio > 1.15 && state.calcium >= 2;
  const sealsDissection = miss === 0;
  const perforation = state.perforation || rupture;
  return patch(state, {
    pct,
    dissection: sealsDissection ? 'none' : state.dissection,
    perforation,
    perforationSealed: perforation && stent.type === 'covered' && miss === 0,
    stent: Object.freeze({ ...stent, deployed: true }),
    // The balloon is withdrawn before the stent goes in.
    balloon: Object.freeze({ ...state.balloon, positioned: false, pressure: 0, maxPressure: 0 }),
    log: log(state, 5, 'stentDeployed', { type: stent.type, diameter: stent.diameter, length: stent.length, pct, notes, rupture })
  });
}

// ---- Step 6: completion angiogram -----------------------------------------------------

/** Final angiogram: residual stenosis, flow, complications and teaching feedback. */
export function runCompletion(state) {
  if (!state.crossed || (state.log.every((e) => e.code !== 'balloonDeflated' && e.code !== 'stentDeployed'))) return state;
  const flow = flowOf(state);
  const g = translesionalGradient(state.pct);
  const feedback = [];
  const accessRating = state.spec.access[state.access];
  feedback.push(accessRating === 'best' ? 'fbAccessBest' : 'fbAccessOk');
  if (!state.spec.wires.includes(state.wire)) feedback.push('fbWireOff');
  if (state.spec.calcium >= 3 && !state.prep.done.some((d) => d !== 'predil')) feedback.push('fbNoCalciumPrep');
  if (state.gradient == null) feedback.push('fbNoGradient');
  if (state.stent.deployed && state.spec.bed === 'cfa') feedback.push('fbCfaStent');
  if (state.dcbResult === 'ok' && !state.stent.deployed) feedback.push('fbDcbOk');
  if (state.embolization) feedback.push('fbEmbolization');
  if (state.perforation) feedback.push(state.perforationSealed ? 'fbPerforationSealed' : 'fbPerforationOpen');
  if (state.dissection === 'flow-limiting') feedback.push('fbDissection');
  const complication = (state.perforation && !state.perforationSealed) || state.dissection === 'flow-limiting';
  const outcome = complication ? 'complication' : state.pct < 30 && flow === 'brisk' ? 'success' : 'suboptimal';
  const completion = Object.freeze({ pct: state.pct, flow, gradient: g.gradient, outcome, feedback });
  return patch(state, { completion, log: log(state, 6, 'completion', { pct: state.pct, flow, gradient: g.gradient, outcome }) });
}

/** What the fluoroscopy image shows: the lesion now and the devices in place. */
export function procedureOverlay(state) {
  if (!state) return null;
  const lumen = balloonLumen(state);
  return Object.freeze({
    pct: state.pct,
    isCto: state.pct >= 99,
    refMm: state.spec.refMm,
    lengthMm: state.spec.lengthMm,
    wire: state.crossed,
    catheter: state.catheterBeyond && !state.gradient,
    balloon: state.balloon.positioned ? { offsetMm: state.balloon.offset, lengthMm: state.balloon.length, inflated: state.balloon.pressure > 0, lumenRatio: lumen.lumenMm / state.spec.refMm, waist: lumen.waist } : null,
    stent: state.stent.deployed ? { offsetMm: state.stent.offset, lengthMm: state.stent.length, type: state.stent.type } : null,
    dissection: state.dissection,
    perforation: state.perforation && !state.perforationSealed,
    embolization: state.embolization
  });
}

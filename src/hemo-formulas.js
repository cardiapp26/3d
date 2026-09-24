// Invasive hemodynamic formulas used by the hemodynamics module and its
// calculators. Pure functions; units are stated per function. Teaching
// arithmetic on typical values, not a diagnostic device.

export const O2_CAPACITY_ML_PER_G = 1.36;   // mL O2 carried per g hemoglobin
export const ASSUMED_VO2_ML_MIN_M2 = 125;   // assumed oxygen consumption per m2
export const WOOD_TO_DYN = 80;              // Wood units -> dyn·s·cm-5
export const GORLIN_AORTIC = 44.3;
export const GORLIN_MITRAL = 37.7;

const finite = value => Number.isFinite(value) ? value : NaN;

/** Oxygen content, mL O2 per 100 mL blood (dissolved O2 ignored). */
export function oxygenContent(hb, saturationPercent) {
  return finite(hb) * O2_CAPACITY_ML_PER_G * finite(saturationPercent) / 100;
}

/**
 * Fick cardiac output, L/min.
 * @param {{ vo2: number, hb: number, satArterial: number, satVenous: number }} p
 *   vo2 in mL/min (absolute), hb g/dL, saturations in percent.
 */
export function fickOutput({ vo2, hb, satArterial, satVenous }) {
  const avDifference = oxygenContent(hb, satArterial) - oxygenContent(hb, satVenous); // mL/100 mL
  if (!(avDifference > 0)) return NaN;
  return finite(vo2) / (avDifference * 10);
}

/** Assumed VO2 in mL/min from body surface area (m2). */
export function assumedVo2(bsa, perM2 = ASSUMED_VO2_ML_MIN_M2) {
  return finite(bsa) * perM2;
}

/** Mosteller body surface area, m2. */
export function bodySurfaceArea(heightCm, weightKg) {
  return Math.sqrt(finite(heightCm) * finite(weightKg) / 3600);
}

export function cardiacIndex(co, bsa) {
  return finite(co) / finite(bsa);
}

/** Stroke volume, mL. */
export function strokeVolume(co, hr) {
  return finite(co) * 1000 / finite(hr);
}

/** Systemic vascular resistance, dyn·s·cm-5 (MAP and RA in mmHg, CO L/min). */
export function svrDyn(map, ra, co) {
  return (finite(map) - finite(ra)) / finite(co) * WOOD_TO_DYN;
}

/** Pulmonary vascular resistance, Wood units. */
export function pvrWood(mpap, pcwp, co) {
  return (finite(mpap) - finite(pcwp)) / finite(co);
}

export function pvrDyn(mpap, pcwp, co) {
  return pvrWood(mpap, pcwp, co) * WOOD_TO_DYN;
}

/** Transpulmonary gradient, mmHg. */
export function transpulmonaryGradient(mpap, pcwp) {
  return finite(mpap) - finite(pcwp);
}

/** Diastolic pulmonary gradient, mmHg. */
export function diastolicPulmonaryGradient(paDiastolic, pcwp) {
  return finite(paDiastolic) - finite(pcwp);
}

/**
 * Gorlin valve area, cm2.
 * @param {{ flow: number, hr: number, period: number, meanGradient: number, constant?: number }} p
 *   flow L/min through the valve, hr beats/min, period seconds per beat the
 *   valve is open (SEP for aortic, DFP for mitral), gradient mmHg.
 */
export function gorlinArea({ flow, hr, period, meanGradient, constant = GORLIN_AORTIC }) {
  const flowPerBeat = finite(flow) * 1000 / (finite(hr) * finite(period)); // mL/s while open
  if (!(meanGradient > 0)) return NaN;
  return flowPerBeat / (constant * Math.sqrt(meanGradient));
}

/** Hakki simplification: area = CO / sqrt(gradient). */
export function hakkiArea(co, gradient) {
  if (!(gradient > 0)) return NaN;
  return finite(co) / Math.sqrt(gradient);
}

/** Mixed venous saturation from caval samples, percent: (3 SVC + 1 IVC) / 4. */
export function mixedVenousSaturation(svc, ivc) {
  return (3 * finite(svc) + finite(ivc)) / 4;
}

/**
 * Shunt ratio Qp/Qs from saturations (percent).
 * @param {{ arterial: number, mixedVenous: number, pulmonaryVein: number, pulmonaryArtery: number }} s
 */
export function qpQs({ arterial, mixedVenous, pulmonaryVein, pulmonaryArtery }) {
  const systemic = finite(arterial) - finite(mixedVenous);
  const pulmonary = finite(pulmonaryVein) - finite(pulmonaryArtery);
  if (!(pulmonary > 0)) return Infinity;
  return systemic / pulmonary;
}

/**
 * Oximetry step-up screen. Returns the level of the first significant rise
 * in saturation along the right heart, or null.
 * @param {{ svc: number, ivc: number, ra: number, rv: number, pa: number }} sats percent
 */
export function oximetryStepUp(sats) {
  const mixedVenous = mixedVenousSaturation(sats.svc, sats.ivc);
  if (finite(sats.ra) - mixedVenous >= 7) return { level: 'atrial', rise: sats.ra - mixedVenous };
  if (finite(sats.rv) - finite(sats.ra) >= 5) return { level: 'ventricular', rise: sats.rv - sats.ra };
  if (finite(sats.pa) - finite(sats.rv) >= 5) return { level: 'great-artery', rise: sats.pa - sats.rv };
  return null;
}

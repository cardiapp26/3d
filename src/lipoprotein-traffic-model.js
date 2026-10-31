// Pure teaching model for the lipoprotein traffic lab. Values in mg/dL, Lp(a) and particle counts
// in nmol/L. Lever effects combine multiplicatively. Particle numbers are schematic estimates:
// - LDL particles: ~13 nmol/L per mg/dL LDL-C, rising up to 30% as TG climbs (small dense LDL
//   carries less cholesterol per particle).
// - Remnant (VLDL + IDL) particles: ~1 nmol/L per mg/dL TG.
// - Lp(a) is already a particle concentration in nmol/L.
// ApoB mass ≈ particles × 0.055 mg/dL per nmol/L (one apoB-100 of ~550 kDa per particle).
// Not a clinical calculator: measured apoB replaces this estimate.
import { LIPID_LEVERS } from './lipoprotein-traffic-data.js';

const LIMITS = { ldl: [10, 600], tg: [20, 2000], hdl: [5, 200], lpa: [0, 1000] };
export const LDL_P_PER_MG = 13;
export const APOB_MG_PER_NMOL = 0.055;
const clamp01 = x => Math.max(0, Math.min(1, x));

/** @param {{ldl:number, tg:number, hdl:number, lpa:number}} profile */
export function validateProfile(profile) {
  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    const value = profile?.[key];
    if (!Number.isFinite(value) || value < min || value > max) return { ok: false, field: key, min, max };
  }
  return { ok: true };
}

/** Profile after the selected levers: each value × Π(1 + effect). */
export function applyLevers(profile, leverIds = []) {
  const factors = { ldl: 1, tg: 1, hdl: 1, lpa: 1 };
  for (const id of leverIds) {
    const lever = LIPID_LEVERS.find(item => item.id === id);
    if (!lever) continue;
    for (const [key, change] of Object.entries(lever.effect)) factors[key] *= 1 + change;
  }
  return Object.fromEntries(Object.keys(factors).map(key => [key, profile[key] * factors[key]]));
}

/** Schematic apoB particle counts (nmol/L) and estimated apoB mass (mg/dL). */
export function apoBParticles({ ldl, tg, lpa }) {
  const smallDense = 1 + 0.3 * clamp01((tg - 100) / 300);
  const ldlP = ldl * LDL_P_PER_MG * smallDense;
  const remnantP = tg;
  const total = ldlP + remnantP + lpa;
  return { ldl: ldlP, remnant: remnantP, lpa, total, apoB: total * APOB_MG_PER_NMOL };
}

/** Derived lab values and teaching flags for one profile. */
export function lipidPanel(profile) {
  const check = validateProfile(profile);
  if (!check.ok) return { error: check };
  const { ldl, tg, hdl, lpa } = profile;
  const remnantC = tg / 5;
  const particles = apoBParticles(profile);
  const flags = [];
  if (tg >= 400) flags.push('tg-estimate');
  if (tg >= 150) flags.push('tg-high');
  if (lpa >= 125) flags.push('lpa-high');
  if (ldl >= 190) flags.push('ldl-severe');
  if (hdl >= 90) flags.push('hdl-very-high');
  if (hdl < 40) flags.push('hdl-low');
  // Discordance: more particles than LDL-C alone predicts (small dense LDL, remnants).
  if (particles.apoB - ldl * LDL_P_PER_MG * APOB_MG_PER_NMOL > 15) flags.push('apob-discordant');
  return {
    values: { ldl, tg, hdl, lpa, remnantC, nonHdl: ldl + remnantC, total: ldl + remnantC + hdl, tgHdl: tg / hdl },
    particles,
    flags
  };
}

/** Before/after panels for a profile and lever set. */
export function lipidScenario(profile, leverIds = []) {
  const before = lipidPanel(profile);
  if (before.error) return before;
  const after = lipidPanel(applyLevers(profile, leverIds));
  const change = key => (after.values[key] - before.values[key]) / before.values[key];
  return { before, after, change: { ldl: change('ldl'), tg: change('tg'), hdl: change('hdl'), lpa: before.values.lpa ? change('lpa') : 0, apoB: (after.particles.apoB - before.particles.apoB) / before.particles.apoB } };
}

/**
 * Animation spawn rates (particles per second) from one panel. Scaled for visibility: Lp(a),
 * remnants and HDL are enlarged relative to LDL. Intimal entry follows apoB concentration;
 * Lp(a) is retained more readily per particle.
 */
export function trafficRates(panel) {
  const { particles, values } = panel;
  return {
    ldl: particles.ldl / 420,
    vldl: values.tg / 130,
    chylomicron: 0.35,
    lpa: values.lpa / 90,
    hdl: values.hdl / 28,
    wallLdl: clamp01(0.06 + particles.total / 26000),
    wallLpa: clamp01(0.25 + particles.total / 26000)
  };
}

// Vessel wall mechanics: thin-walled cylinder Laplace stresses and Hagen-Poiseuille wall shear.
// Pure functions, SI inside, clinical units at the edges (mmHg, mm, m/s, cP).
//
// Thin-walled closed cylinder (valid roughly when r/h > 10; the aorta, r/h ~ 6, is an approximation):
//   circumferential (hoop)  sigma_c = Pt * r / h
//   longitudinal (axial)    sigma_L = Pt * r / (2h)
//   radial                  sigma_r runs from -Pint at the intima to -Pext at the adventitia (compressive)
// with Pt = Pint - Pext (transmural pressure).
// Poiseuille wall shear: tau_w = 8 * mu * Vm / D, velocity profile v(rho) = 2 * Vm * (1 - (rho/R)^2).

export const MMHG_TO_KPA = 0.133322;
export const BLOOD_DENSITY = 1060;             // kg/m3
export const SHEAR_LOW_PA = 0.4;               // < 4 dyn/cm2: atheroprone (Malek 1999)
export const SHEAR_PROTECTIVE_PA = 1.5;        // >= 15 dyn/cm2: atheroprotective (Malek 1999)
export const SHEAR_HIGH_PA = 7;                // > 70 dyn/cm2: stenosis throat, platelet activation
export const AORTA_REFERENCE = Object.freeze({ diameter: 32, wall: 2.2 }); // mm, ascending aorta

const finite = (value, fallback) => (Number.isFinite(value) ? value : fallback);

/** Laplace stresses (kPa) of a thin-walled cylinder. Pressures in mmHg, radius and wall in mm. */
export function laplaceStresses({ pInt, pExt = 0, r, h }) {
  const inner = finite(pInt, 0), outer = finite(pExt, 0);
  const radius = Math.max(0.1, finite(r, 1)), wall = Math.max(0.05, finite(h, 1));
  const transmural = inner - outer;
  const hoop = (transmural * radius / wall) * MMHG_TO_KPA;
  return {
    transmural,
    hoop,
    axial: hoop / 2,
    radialInner: -inner * MMHG_TO_KPA,
    radialOuter: -outer * MMHG_TO_KPA,
    rOverH: radius / wall,
    thinWall: radius / wall >= 10
  };
}

/**
 * Aortic dilation at a constant wall mass: the wall thins as the lumen widens (h = h0 * d0 / d),
 * so hoop stress grows with the square of the diameter.
 */
export function dilatedAorta({ diameter, pressure, reference = AORTA_REFERENCE }) {
  const d = Math.max(10, finite(diameter, reference.diameter));
  const wall = (reference.wall * reference.diameter) / d;
  const stress = laplaceStresses({ pInt: pressure, r: d / 2, h: wall });
  const base = laplaceStresses({ pInt: pressure, r: reference.diameter / 2, h: reference.wall });
  return { diameter: d, wall, hoop: stress.hoop, ratio: stress.hoop / base.hoop, zone: aortaZone(d) };
}

/** Ascending aorta size band (ESC 2024: repair at >= 55 mm, >= 50 mm with risk factors). */
export function aortaZone(diameter) {
  if (diameter >= 55) return 'surgery';
  if (diameter >= 50) return 'high-risk';
  if (diameter >= 40) return 'dilated';
  return 'normal';
}

/** Hagen-Poiseuille wall shear (Pa) and Reynolds number. Velocity m/s, diameter mm, viscosity cP. */
export function wallShear({ vMean, diameter, viscosity = 3.5 }) {
  const v = finite(vMean, 0), d = Math.max(0.1, finite(diameter, 1)) / 1000;
  const mu = Math.max(0.5, finite(viscosity, 3.5)) / 1000;
  const tau = (8 * mu * v) / d;
  const reynolds = (BLOOD_DENSITY * Math.abs(v) * d) / mu;
  return { tau, dyn: tau * 10, reynolds, vMax: 2 * v, zone: shearZone(Math.abs(tau)), turbulent: reynolds > 2000 };
}

/** Endothelial shear band. */
export function shearZone(tau) {
  if (tau > SHEAR_HIGH_PA) return 'high';
  if (tau >= SHEAR_PROTECTIVE_PA) return 'protective';
  if (tau >= SHEAR_LOW_PA) return 'intermediate';
  return 'low';
}

/** Parabolic velocity at radial position rho in [-1, 1] (fraction of the radius). */
export function poiseuilleVelocity(vMean, rho) {
  const x = Math.max(-1, Math.min(1, rho));
  return 2 * vMean * (1 - x * x);
}

/**
 * Pressure over one beat, phase in [0, 1): systolic upstroke and decay to diastolic.
 * Returns mmHg between dbp and sbp.
 */
export function pulsePressureAt(phase, sbp, dbp) {
  const p = ((phase % 1) + 1) % 1;
  const shape = p < 0.35 ? Math.sin((p / 0.35) * (Math.PI / 2)) : Math.exp(-(p - 0.35) * 3.2);
  return dbp + (sbp - dbp) * shape;
}

/**
 * Near-wall velocity factor over one beat. Laminar: always forward. Oscillatory (outer wall of a
 * bifurcation): brief reversal in diastole, which gives a high oscillatory shear index.
 */
export function flowFactorAt(phase, oscillatory) {
  const p = ((phase % 1) + 1) % 1;
  const systole = p < 0.35 ? Math.sin((p / 0.35) * Math.PI) : 0;
  if (!oscillatory) return 0.55 + 0.9 * systole;
  return 0.25 + 1.3 * systole - (p > 0.4 && p < 0.75 ? 0.9 * Math.sin(((p - 0.4) / 0.35) * Math.PI) : 0);
}

/** Oscillatory shear index over one beat for a flow factor function: 0 laminar, 0.5 pure reversal. */
export function oscillatoryShearIndex(oscillatory, samples = 200) {
  let net = 0, total = 0;
  for (let i = 0; i < samples; i++) {
    const f = flowFactorAt(i / samples, oscillatory);
    net += f;
    total += Math.abs(f);
  }
  return total ? 0.5 * (1 - Math.abs(net) / total) : 0;
}

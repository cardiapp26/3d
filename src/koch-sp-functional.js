// Functional layers of the triangle of Koch in typical slow-fast AVNRT, after
// the 3-dimensional high-resolution mapping study of Sakamoto et al. (Heart
// Rhythm O2 2026;7:1398): high peak frequency (PF) in the posterior septum
// where the successful ablation sites lay, activation vectors converging at
// that region (the electrophysiological entrance of the right inferior
// extension, RIE), the highest relative wave speed there, a pivot point about
// 10 mm from the ablation site, and the local electrograms a-e. A teaching
// layer over the same (u, v) site frame as koch-sp-model.js; not patient data.
import { DEFAULT_SITE, clampSite } from './koch-sp-model.js';

export const LAYERS = Object.freeze(['pf', 'vectors', 'speed', 'landmarks']);
/** Entrance of the RIE: where PF is high, vectors converge and the wave is fastest. */
export const ENTRANCE = Object.freeze({ ...DEFAULT_SITE });
/** Pivot point during sinus rhythm (60 % of patients, about 10 mm from the ablation site). */
export const PIVOT = Object.freeze({ u: 0.3, v: 0.7 });
/** Local electrograms (a) to (e) of the study, placed on the site frame. */
export const LANDMARKS = Object.freeze([
  { id: 'a', u: 0.84, v: 0.55 },   // His bundle potential
  { id: 'b', u: 0.62, v: 0.6 },    // reduced His: nodal-His transition; the RIE lies below this level
  { id: 'c', ...ENTRANCE },        // high PF, vector convergence, Jackman potential
  { id: 'd', u: 0.2, v: 0.5 },     // same height outside the low-voltage bridge: sharper electrogram
  { id: 'e', u: 0.58, v: 0.4 }     // descending vector with sharp atrial potentials: bystander atrial activation
].map(Object.freeze));

const gauss = (u, v, cu, cv, su, sv) => Math.exp(-(((u - cu) / su) ** 2) - (((v - cv) / sv) ** 2));

/** Relative PF, wave speed and fractionation (all 0..1) at a site. */
export function functionalAt(site) {
  const { u, v } = clampSite(site);
  const entrance = gauss(u, v, ENTRANCE.u, ENTRANCE.v, 0.2, 0.22);
  // Fractionated slow pathway tail toward the Todaro side: the signal there has a lower peak frequency.
  const fractionation = gauss(u, v, 0.3, 0.55, 0.16, 0.14);
  // Where the RIE runs deeper, near-field and high-frequency components are attenuated.
  const depth = gauss(u, v, 0.55, 0.65, 0.18, 0.25);
  const pf = Math.max(0.05, (0.15 + 0.85 * entrance) * (1 - 0.45 * fractionation) * (1 - 0.35 * depth));
  const speed = 0.2 + 0.8 * gauss(u, v, ENTRANCE.u, ENTRANCE.v, 0.17, 0.2);
  return { pf, speed, fractionation, depth };
}

const unit = (du, dv) => { const n = Math.hypot(du, dv) || 1; return { du: du / n, dv: dv / n }; };

/**
 * Activation vector in sinus rhythm (direction in site space; du up toward the His):
 * converging on the entrance around it, ascending and descending above it,
 * and a descending bystander atrial vector near landmark (e).
 */
export function vectorAt(site) {
  const { u, v } = clampSite(site);
  const e = LANDMARKS.find((l) => l.id === 'e');
  if (Math.hypot(u - e.u, v - e.v) < 0.16) return { ...unit(-1, 0.1), kind: 'bystander' };
  if (u > 0.5) return { ...unit(v < 0.55 ? 1 : -0.5, 0.2), kind: v < 0.55 ? 'ascending' : 'descending' };
  const d = Math.hypot(ENTRANCE.u - u, ENTRANCE.v - v);
  if (d < 0.04) return { du: 0, dv: 0, kind: 'convergence' };
  return { ...unit(ENTRANCE.u - u, ENTRANCE.v - v), kind: 'converging' };
}

/** Landmark nearest to a site within `radius`, or null. */
export function landmarkNear(site, radius = 0.12) {
  const { u, v } = clampSite(site);
  let best = null, bd = radius;
  for (const l of LANDMARKS) { const d = Math.hypot(u - l.u, v - l.v); if (d <= bd) { best = l; bd = d; } }
  return best;
}

// Slow pathway mapping in the triangle of Koch: a teaching model of what the
// ablation catheter records where its tip sits (koch-sp-panel.js draws it,
// ep-landmarks.js moves the 3D tip). Not a clinical algorithm.
//
// Site coordinates (both 0..1), shared with the 3D triangle:
//   u: height from the base (CS ostium level, 0) to the apex (compact AV node and His, 1)
//   v: across the base from the tendon of Todaro side (0) through the CS ostium (0.5)
//      to the septal tricuspid hinge (1)
// Rules (classic anatomic slow pathway approach, Kardiyopedi AVNRT lecture;
// Jackman et al. 1992; Haissaguerre et al. 1992): the target lies low in the
// septal isthmus between the CS ostium and the tricuspid annulus, where the
// distal bipole records a small, often fractionated atrial signal and a
// large ventricular one (A:V about 1:2 to 1:5) without a His potential.
// Moving up toward the apex brings the compact node, the fast pathway input
// and a His potential (AV block risk); moving toward the annulus loses the A,
// toward the Todaro side the A grows.

export const DEFAULT_SITE = Object.freeze({ u: 0.18, v: 0.775 });
export const ZONES = Object.freeze(['target', 'atrial', 'ventricular', 'cs', 'mid', 'fast', 'his']);
export const DANGER_ZONES = Object.freeze(['fast', 'his']);
const CS_OS = Object.freeze({ u: 0.04, v: 0.5 });
const RATIO_ATRIAL = 0.5;
const RATIO_VENTRICULAR = 0.15;

const clamp01 = x => Math.min(1, Math.max(0, x));

export function clampSite({ u, v }) {
  if (!Number.isFinite(u) || !Number.isFinite(v)) throw new RangeError('Site needs finite u and v');
  return { u: clamp01(u), v: clamp01(v) };
}

/** Signal amplitudes (0..1, relative) recorded by the distal ablation bipole at a site. */
export function siteSignals(site) {
  const { u, v } = clampSite(site);
  // Higher in the triangle the bipole sees more atrial septum (fast pathway side).
  const atrial = Math.min(1, 1 - 0.95 * v + 0.3 * u);
  const ventricular = 0.1 + 0.9 * v ** 0.7;
  const his = clamp01((u - 0.5) / 0.35) ** 1.5 * clamp01(0.3 + v);
  // Fractionated slow pathway potential: strongest over the isthmus target.
  const slowPotential = Math.exp(-(((u - DEFAULT_SITE.u) / 0.15) ** 2) - (((v - DEFAULT_SITE.v) / 0.2) ** 2));
  return { atrial, ventricular, his, slowPotential, ratio: atrial / ventricular };
}

export function siteZone(site) {
  const { u, v } = clampSite(site);
  const { ratio } = siteSignals({ u, v });
  if (u >= 0.68) return 'his';
  if (u >= 0.5 && v < 0.5) return 'fast';
  if (u >= 0.45) return 'mid';
  if (Math.hypot(u - CS_OS.u, v - CS_OS.v) < 0.1) return 'cs';
  if (ratio > RATIO_ATRIAL) return 'atrial';
  if (ratio < RATIO_VENTRICULAR) return 'ventricular';
  return 'target';
}

/** A:V as "1:n" (n rounded to one decimal), the way the ratio is read at the bedside. */
export function ratioLabel(ratio) {
  if (!(ratio > 0)) return '0';
  return ratio >= 1 ? `${(ratio).toFixed(1)}:1` : `1:${(1 / ratio).toFixed(1)}`;
}

export function assessSite(site) {
  const s = clampSite(site);
  const signals = siteSignals(s);
  const zone = siteZone(s);
  return { site: s, zone, danger: DANGER_ZONES.includes(zone), ...signals, ratioText: ratioLabel(signals.ratio) };
}

/** Bilinear map onto a triangle: base from the Todaro corner through the CS ostium to the hinge corner, then up to the apex. */
export function sitePoint(site, { todaro, csOs, hinge, apex }, lerp) {
  const { u, v } = clampSite(site);
  const base = v <= 0.5 ? lerp(todaro, csOs, v * 2) : lerp(csOs, hinge, v * 2 - 1);
  return lerp(base, apex, u);
}

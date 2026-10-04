// Deterministic teaching curves, designed from the supplied textbook figures.
// These are not digitized observations, patient responses or normal limits.
export const smooth = x => { const v = Math.max(0, Math.min(1, x)); return v * v * (3 - 2 * v); };
export function ventricularSample(ms) {
  const t = Math.max(0, Math.min(360, Number(ms) || 0));
  const anchors = [[0, -90], [8, 20], [35, 8], [150, 5], [200, -15], [260, -75], [310, -90], [360, -90]];
  let voltage = -90;
  for (let i = 1; i < anchors.length; i++) if (t <= anchors[i][0]) {
    const [a, va] = anchors[i - 1], [b, vb] = anchors[i];
    voltage = va + (vb - va) * smooth((t - a) / (b - a)); break;
  }
  const phase = t < 8 ? 0 : t < 35 ? 1 : t < 180 ? 2 : t < 310 ? 3 : 4;
  const gauss = (center, width) => Math.exp(-(((t - center) / width) ** 2));
  const ca = t >= 15 && t <= 250 ? -0.32 * smooth((t - 15) / 20) * (1 - smooth((t - 80) / 170)) : 0;
  return { voltage, phase, na: t <= 22 ? -gauss(5, 3) : 0,
    ca,
    k: -ca + 0.3 * gauss(19, 10) + (t >= 120 && t <= 310 ? 0.5 * smooth((t - 120) / 80) * (1 - smooth((t - 250) / 60)) : 0) };
}
export const AUTONOMIC = Object.freeze({ sympathetic: 23, normal: 13, zero: 10.5, parasympathetic: 8 });
export function pumpOutput(pressure, { side = 'right', tone = 'normal' } = {}) {
  if (!Number.isFinite(pressure)) throw new RangeError('Filling pressure must be finite');
  const capacity = AUTONOMIC[tone];
  if (!capacity || !['right', 'left'].includes(side)) throw new RangeError('Unknown pump curve');
  const span = side === 'right' ? 7 : 15;
  return capacity * smooth((pressure + 2) / span);
}
export function pressureLoadFactor(pressure) {
  if (!Number.isFinite(pressure)) throw new RangeError('Arterial pressure must be finite');
  return 1 - smooth((pressure - 140) / 110);
}
// Closed P-V polygon integral in mmHg·ml. Independent of orientation.
export function loopWork(points) {
  let area = 0;
  points.forEach((a, i) => { const b = points[(i + 1) % points.length]; area += (a.v * b.p - b.v * a.p) / 2; });
  return Math.abs(area);
}
export const MMHG_ML_TO_J = 0.000133322;

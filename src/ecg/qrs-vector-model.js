// Continuous QRS vector from the five instantaneous vectors of the
// depolarization sequence (Guyton & Hall fig. 12-7; guyton-data.js steps).
// Keyframes are joined with a Catmull-Rom spline in Cartesian form, so the
// frontal loop is smooth and never wraps around ±180°. Leads are projections
// of that one vector (Einthoven holds at every instant); V1/V6 follow the
// horizontal-plane teaching values of the same steps. Teaching model only.

export const QRS_MS = 80;
const FRONTAL_LEADS = Object.freeze({ I: 0, II: 60, III: 120, aVR: -150, aVL: -30, aVF: 90 });

const stepMs = step => Math.round(parseFloat(step.time) * 1000);

function spline(points, t) {
  // points: [{t, v}] sorted; Catmull-Rom on the knot sequence, value at time t.
  if (t <= points[0].t) return points[0].v;
  const last = points[points.length - 1];
  if (t >= last.t) return last.v;
  let i = 0;
  while (points[i + 1].t < t) i += 1;
  const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
  const u = (t - p1.t) / (p2.t - p1.t);
  // Tangents scaled to the local interval (non-uniform knots).
  const m1 = ((p2.v - p0.v) / (p2.t - p0.t || 1)) * (p2.t - p1.t);
  const m2 = ((p3.v - p1.v) / (p3.t - p1.t || 1)) * (p2.t - p1.t);
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p1.v + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2.v + (u3 - u2) * m2;
}

/** Build the continuous model from the topic steps. */
export function createQrsModel(steps) {
  if (!Array.isArray(steps) || steps.length < 2) throw new RangeError('Need the depolarization steps');
  const knots = [{ t: 0, x: 0, y: 0, v1: 0, v6: 0 }, ...steps.map(s => ({
    t: stepMs(s),
    x: s.magnitude * Math.cos((s.vectorAngle * Math.PI) / 180),
    y: s.magnitude * Math.sin((s.vectorAngle * Math.PI) / 180),
    v1: s.waves.v1, v6: s.waves.v6
  }))];
  const series = key => knots.map(k => ({ t: k.t, v: k[key] }));
  const sx = series('x'), sy = series('y'), s1 = series('v1'), s6 = series('v6');
  const clampT = t => Math.min(QRS_MS, Math.max(0, t));

  function frontal(t) {
    const tt = clampT(t), x = spline(sx, tt), y = spline(sy, tt);
    return { x, y, magnitude: Math.hypot(x, y), angle: (Math.atan2(y, x) * 180) / Math.PI };
  }
  /** Lead voltage (mV) during the QRS at time t (ms after onset). */
  function lead(id, t) {
    if (t < 0 || t > QRS_MS) return 0;
    if (id === 'V1') return spline(s1, t);
    if (id === 'V6') return spline(s6, t);
    const angle = FRONTAL_LEADS[id];
    if (angle === undefined) throw new RangeError(`Unknown lead ${id}`);
    const f = frontal(t);
    return f.x * Math.cos((angle * Math.PI) / 180) + f.y * Math.sin((angle * Math.PI) / 180);
  }
  /** Index of the step a time belongs to (nearest keyframe at or after it). */
  function stepAt(t) {
    const times = steps.map(stepMs);
    const i = times.findIndex(ms => t <= ms + 1e-9);
    return i < 0 ? steps.length - 1 : i;
  }
  /** Mean QRS axis: the direction of the summed (time-integrated) frontal vector. */
  function meanAxis() {
    let x = 0, y = 0;
    for (let t = 0; t <= QRS_MS; t += 1) { const f = frontal(t); x += f.x; y += f.y; }
    return (Math.atan2(y, x) * 180) / Math.PI;
  }
  return { frontal, lead, stepAt, meanAxis, stepTimes: steps.map(stepMs) };
}

/**
 * Teaching activation time (ms) of a myocardial site described by region,
 * depth (0 endocardium .. 1 epicardium) and apical position (0 base .. 1 apex).
 * Order follows the classic sequence: left septum first, then apex and
 * endocardium, the free walls endo to epi, the posterobasal LV and RV outflow last.
 */
export function activationTime(region, depth, apical) {
  const d = Math.min(1, Math.max(0, depth)), a = Math.min(1, Math.max(0, apical));
  if (region === 'septum') return 3 + 16 * d + 26 * (1 - a) ** 2;      // d: left (0) to right (1) surface
  if (region === 'rv') return 16 + 8 * d + 26 * (1 - a) ** 1.5;
  return 14 + 20 * d + 34 * (1 - a) ** 1.5;                            // lv free wall and apex
}

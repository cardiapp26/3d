import { imageFrame, cross, normalize } from './echo-section.js';

/*
 * Probe kinematics for the echo module (report sections 4, 5 and 9). Patient
 * coordinates of the atlas: +x patient left, +y superior, +z anterior.
 *
 * TTE: a window gives a base frame (transducer point, beam, screen-right
 * axis); the student moves the probe from it within limits: rotation about
 * the beam, tilt (fan through the elevation), rock (angle within the plane)
 * and a short slide on the chest. There is no chest surface model yet, so
 * the windows are preset points, not free surface scanning.
 *
 * TEE: the transducer rides a schematic oesophagus-stomach path. Advance or
 * withdraw, shaft rotation, ante/retroflexion, left/right flexion and the
 * electronic multiplane angle are separate motions. Screen convention: at 0
 * degrees the patient's left is on the right of the image, at 90 degrees the
 * cephalad side, at 180 degrees the mirror of 0 (ASE/SCA 2013).
 */

/** Rodrigues rotation of v about a unit axis by `deg` degrees. */
export function rotate(v, axis, deg) {
  const a = normalize(axis), t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  const k = cross(a, v), d = a[0] * v[0] + a[1] * v[1] + a[2] * v[2];
  return [0, 1, 2].map(i => v[i] * c + k[i] * s + a[i] * d * (1 - c));
}

const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];

/**
 * Schematic chest surface for TTE contact: an ellipsoid { center, radii }
 * around the heart. No ribs, intercostal spaces or acoustic windows.
 */
const ellipsoidScale = (v, surface) => Math.hypot(...v.map((x, i) => x / surface.radii[i]));

/** Where the ray from `from` along `dir` leaves the ellipsoid (from inside), or null. */
export function surfaceHit(from, dir, surface) {
  const o = from.map((x, i) => (x - surface.center[i]) / surface.radii[i]);
  const d = dir.map((x, i) => x / surface.radii[i]);
  const a = d[0] ** 2 + d[1] ** 2 + d[2] ** 2, b = 2 * (o[0] * d[0] + o[1] * d[1] + o[2] * d[2]), c = o[0] ** 2 + o[1] ** 2 + o[2] ** 2 - 1;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const s = (-b + Math.sqrt(disc)) / (2 * a);
  return s > 0 ? add(from, dir, s) : null;
}

/** A point put back on the ellipsoid along the line from its centre (contact kept while sliding). */
export function ontoSurface(point, surface) {
  const rel = point.map((x, i) => x - surface.center[i]);
  const k = ellipsoidScale(rel, surface) || 1;
  return rel.map((x, i) => surface.center[i] + x / k);
}

/** Limits of the TTE adjustments (degrees and atlas units). */
export const TTE_LIMITS = Object.freeze({ rotation: 90, tilt: 35, rock: 30, slide: 0.4 });

/**
 * TTE image frame from a window's base frame and the student's adjustments.
 * @param {{ origin: number[], beam: number[], lateral: number[], surface?: { center: number[], radii: number[] } }} base
 *   with `surface`, the transducer stays on the schematic chest surface while it slides
 * @param {{ rotation?: number, tilt?: number, rock?: number, slideLateral?: number, slideElevation?: number }} adj
 */
export function tteFrame(base, adj = {}) {
  const clamp = (v, lim) => Math.max(-lim, Math.min(lim, Number(v) || 0));
  const start = imageFrame(base.origin, base.beam, base.lateral);
  // Rotation about the beam turns the marker and the plane first; tilt, rock
  // and slide then act on the turned plane, so their names stay true at any rotation.
  let lateral = rotate(start.lateral, start.beam, clamp(adj.rotation, TTE_LIMITS.rotation));
  const normal = cross(start.beam, lateral);
  const slid = add(add(start.origin, lateral, clamp(adj.slideLateral, TTE_LIMITS.slide)), normal, clamp(adj.slideElevation, TTE_LIMITS.slide));
  const origin = base.surface ? ontoSurface(slid, base.surface) : slid;
  // Rock: within the plane (about its normal).
  let beam = rotate(start.beam, normal, clamp(adj.rock, TTE_LIMITS.rock));
  lateral = rotate(lateral, normal, clamp(adj.rock, TTE_LIMITS.rock));
  // Tilt: across the plane (about its lateral axis), sweeping the fan through the elevation.
  beam = rotate(beam, lateral, clamp(adj.tilt, TTE_LIMITS.tilt));
  return imageFrame(origin, beam, lateral);
}

/** Limits of the TEE motions (degrees; advance 0..1 along the path). */
export const TEE_LIMITS = Object.freeze({ rotation: 90, flexion: [-30, 100], lateralFlexion: 30, omega: [0, 180] });

/**
 * A path through points (smoothed polyline) with arc-length parameter s in 0..1,
 * carrying the transducer face (`face`: its direction at the start).
 * @param {number[][]} points
 */
export function createProbePath(points, { smoothing = 3, face = [0, 0, 1], wideFrom } = {}) {
  let pts = points.map(p => [...p]);
  // Chaikin corner cutting keeps the ends and rounds the bends.
  for (let pass = 0; pass < smoothing; pass++) {
    const next = [pts[0]];
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1];
      next.push(add(a, add(b, a, -1), 0.25), add(a, add(b, a, -1), 0.75));
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }
  const cumulative = [0];
  for (let i = 1; i < pts.length; i++) cumulative.push(cumulative[i - 1] + Math.hypot(...add(pts[i], pts[i - 1], -1)));
  const length = cumulative[cumulative.length - 1];
  // The transducer face is carried along the bends (parallel transport): an
  // anterior face in the oesophagus turns cephalad where the path turns
  // forward into the stomach, as the scope's own shaft does.
  const tangents = pts.slice(1).map((p, i) => normalize(add(p, pts[i], -1)));
  const faces = [];
  tangents.forEach((t, i) => {
    let f = i === 0 ? face : faces[i - 1];
    if (i > 0) {
      const axis = cross(tangents[i - 1], t), sin = Math.hypot(...axis);
      if (sin > 1e-9) f = rotate(f, axis, (Math.atan2(sin, tangents[i - 1][0] * t[0] + tangents[i - 1][1] * t[1] + tangents[i - 1][2] * t[2]) * 180) / Math.PI);
    }
    const along = f[0] * t[0] + f[1] * t[1] + f[2] * t[2];
    faces.push(normalize(add(f, t, -along)));
  });
  function at(s) {
    const target = Math.max(0, Math.min(1, Number(s) || 0)) * length;
    let i = 1;
    while (i < pts.length - 1 && cumulative[i] < target) i++;
    const span = cumulative[i] - cumulative[i - 1] || 1;
    const f = (target - cumulative[i - 1]) / span;
    return { point: add(pts[i - 1], add(pts[i], pts[i - 1], -1), f), tangent: tangents[i - 1], face: faces[i - 1] };
  }
  /** Advance (0..1) at which the path is nearest a height, within [from, to] of the path. */
  function levelAt(y, from = 0, to = 1) {
    let best = from, bestD = Infinity;
    for (let k = 0; k <= 200; k++) {
      const s = from + (to - from) * (k / 200);
      const d = Math.abs(at(s).point[1] - y);
      if (d < bestD) { bestD = d; best = s; }
    }
    return best;
  }
  return { points: pts, length, at, levelAt, wideFrom };
}

// Distal bending section of the TEE scope (atlas units, 1 unit about 34 mm):
// flexion bends this length of the tip into an arc, so the transducer moves,
// not only turns. The oesophagus lets the tip swing only as far as its lumen;
// the stomach allows more. Schematic: no wall contact force is modelled.
export const BEND_LENGTH = 0.6;
export const LUMEN = Object.freeze({ oesophagus: 0.3, stomach: 1.2 });

/** Sideways travel of the tip for a bend of `theta` radians over BEND_LENGTH. */
const sway = theta => (theta < 1e-6 ? 0 : (BEND_LENGTH * (1 - Math.cos(theta))) / theta);

/**
 * TEE image frame on a probe path.
 * @param {{ at: (s: number) => { point: number[], tangent: number[], face: number[] }, length: number, wideFrom?: number }} path
 * @param {{ advance?: number, rotation?: number, flexion?: number, lateralFlexion?: number, omega?: number }} state
 *   rotation: + turns the shaft (transducer) toward the patient's right; flexion: + ante, - retro;
 *   lateralFlexion: + toward the patient's left (both bend the distal section: the tip moves);
 *   omega: electronic multiplane angle 0..180 (turns the image plane about the beam; the tip does not move).
 * @returns image frame plus tip (transducer position), shaft (tip direction), bend (applied, radians) and limited (lumen reached)
 */
export function teeFrame(path, state = {}) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
  const advance = clamp(state.advance ?? 0.5, 0, 1);
  // The bending section starts BEND_LENGTH before the advance point: unbent, the tip is at the advance point.
  const baseAt = path.at(Math.max(0, advance - BEND_LENGTH / path.length));
  let t = baseAt.tangent;
  let face = rotate(baseAt.face, t, clamp(state.rotation, -TEE_LIMITS.rotation, TEE_LIMITS.rotation));
  const left = cross(face, t);
  const ante = (clamp(state.flexion, ...TEE_LIMITS.flexion) * Math.PI) / 180;
  const side = (clamp(state.lateralFlexion, -TEE_LIMITS.lateralFlexion, TEE_LIMITS.lateralFlexion) * Math.PI) / 180;
  let theta = Math.hypot(ante, side);
  const lumen = path.wideFrom !== undefined && advance >= path.wideFrom ? LUMEN.stomach : LUMEN.oesophagus;
  // The wall stops the tip: the largest bend whose sideways travel fits the lumen.
  let limited = false;
  if (sway(theta) > lumen) {
    let lo = 0, hi = theta;
    for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (sway(mid) > lumen) hi = mid; else lo = mid; }
    theta = lo; limited = true;
  }
  let tip = add(baseAt.point, t, BEND_LENGTH);
  if (theta > 1e-6) {
    const bend = normalize(add(face.map(v => v * ante), left, side));    // bend direction, across the shaft
    tip = add(add(baseAt.point, t, (BEND_LENGTH * Math.sin(theta)) / theta), bend, sway(theta));
    const hinge = normalize(cross(t, bend));
    const deg = (theta * 180) / Math.PI;
    t = rotate(t, hinge, deg);
    face = rotate(face, hinge, deg);
  }
  const omega = clamp(state.omega, ...TEE_LIMITS.omega);
  const imageLeft = cross(face, t);            // patient left at 0 degrees, shaft unturned
  const up = [-t[0], -t[1], -t[2]];            // cephalad at 90 degrees
  const w = (omega * Math.PI) / 180;
  const lateral = add(imageLeft.map(v => v * Math.cos(w)), up, Math.sin(w));
  return { ...imageFrame(add(tip, face, 0.03), face, lateral), tip, shaft: t, bend: theta, limited };
}

/** Limits of the ICE motions (degrees; advance 0..1 from the IVC orifice to the upper RA). */
export const ICE_LIMITS = Object.freeze({ rotation: [-60, 270], anteroposterior: 45, leftRight: 45 });
/** Length of the deflectable distal segment (atlas units; schematic, not a physical length). */
export const ICE_DISTAL = 0.5;

/**
 * ICE catheter pose and its (phased-array, side-looking) image frame, from
 * one model. The shaft runs along the RA axis from the IVC; handle rotation
 * turns the transducer face about the shaft; the distal segment (ICE_DISTAL
 * long, from a knuckle below the undeflected tip) bends with the two knobs,
 * and the transducer sits at its end, facing the beam. The catheter's distal
 * direction lies in the image plane (longitudinal imaging; screen right).
 *
 * Knob convention (as on the catheter, named for the neutral home position,
 * transducer facing anteriorly): anteroposterior + bends the tip toward the
 * transducer face (anterior at home), - away from it (posterior);
 * leftRight + bends it out of the image plane toward the patient's left at
 * home, - toward the right. The knobs act on the catheter, so after a
 * rotation they keep their catheter meaning, not a fixed patient direction.
 * @param {{ base: number[], top: number[], home: number[], clockwise: number }} path
 *   base/top: catheter axis ends (IVC orifice, upper RA); home: home-view beam
 *   direction (toward the tricuspid valve); clockwise: +1 or -1, so that a
 *   positive rotation turns the beam the way clockwise handle rotation does
 *   (from the tricuspid toward the aortic root, LA and septum).
 * @param {{ advance?: number, rotation?: number, anteroposterior?: number, leftRight?: number }} state
 * @returns {object} image frame (origin, beam, lateral, normal) plus tip, shaft (axis),
 *   knuckle, distal (unit direction of the distal segment) and catheter (centreline points)
 */
export function iceFrame(path, state = {}) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
  const advance = clamp(state.advance ?? 0.5, 0, 1);
  const axis = normalize([0, 1, 2].map(i => path.top[i] - path.base[i]));
  const straightTip = [0, 1, 2].map(i => path.base[i] + (path.top[i] - path.base[i]) * advance);
  let beam = rotate(path.home, axis, path.clockwise * clamp(state.rotation, ...ICE_LIMITS.rotation));
  let distal = axis;                                    // the catheter direction: screen right of the image
  // A positive turn about across = beam x axis carries the distal direction away from the
  // beam; the knob value is negated so that anterior (+) bends the tip toward the face.
  const across = cross(beam, distal);
  const ap = -clamp(state.anteroposterior, -ICE_LIMITS.anteroposterior, ICE_LIMITS.anteroposterior);
  beam = rotate(beam, across, ap); distal = rotate(distal, across, ap);
  // Left (+) bends it out of the plane toward the patient's left at home: about the beam.
  const lr = -clamp(state.leftRight, -ICE_LIMITS.leftRight, ICE_LIMITS.leftRight);
  distal = rotate(distal, beam, lr);
  // Centreline: straight shaft up to the knuckle, then the distal segment curving onto `distal`.
  const knuckle = add(straightTip, axis, -ICE_DISTAL);
  const catheter = [knuckle];
  const STEPS = 8;
  let point = knuckle;
  for (let k = 1; k <= STEPS; k++) {
    const f = (k - 0.5) / STEPS;
    const dir = normalize([0, 1, 2].map(i => axis[i] * (1 - f) + distal[i] * f));
    point = add(point, dir, ICE_DISTAL / STEPS);
    catheter.push(point);
  }
  const tip = point;
  return { ...imageFrame(add(tip, beam, 0.04), beam, distal), tip, shaft: axis, knuckle, distal, catheter };
}

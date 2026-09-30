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

/** Limits of the TTE adjustments (degrees and atlas units). */
export const TTE_LIMITS = Object.freeze({ rotation: 90, tilt: 35, rock: 30, slide: 0.4 });

/**
 * TTE image frame from a window's base frame and the student's adjustments.
 * @param {{ origin: number[], beam: number[], lateral: number[] }} base
 * @param {{ rotation?: number, tilt?: number, rock?: number, slideLateral?: number, slideElevation?: number }} adj
 */
export function tteFrame(base, adj = {}) {
  const clamp = (v, lim) => Math.max(-lim, Math.min(lim, Number(v) || 0));
  const start = imageFrame(base.origin, base.beam, base.lateral);
  const origin = add(add(start.origin, start.lateral, clamp(adj.slideLateral, TTE_LIMITS.slide)), start.normal, clamp(adj.slideElevation, TTE_LIMITS.slide));
  // Rock: within the plane (about the elevation axis).
  let beam = rotate(start.beam, start.normal, clamp(adj.rock, TTE_LIMITS.rock));
  let lateral = rotate(start.lateral, start.normal, clamp(adj.rock, TTE_LIMITS.rock));
  // Tilt: across the plane (about the lateral axis), sweeping the fan through the elevation.
  beam = rotate(beam, lateral, clamp(adj.tilt, TTE_LIMITS.tilt));
  // Rotation: about the beam (the index marker turns).
  lateral = rotate(lateral, beam, clamp(adj.rotation, TTE_LIMITS.rotation));
  return imageFrame(origin, beam, lateral);
}

/** Limits of the TEE motions (degrees; advance 0..1 along the path). */
export const TEE_LIMITS = Object.freeze({ rotation: 90, flexion: [-30, 100], lateralFlexion: 30, omega: [0, 180] });

/**
 * A path through points (smoothed polyline) with arc-length parameter s in 0..1,
 * carrying the transducer face (`face`: its direction at the start).
 * @param {number[][]} points
 */
export function createProbePath(points, { smoothing = 3, face = [0, 0, 1] } = {}) {
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
  return { points: pts, length, at, levelAt };
}

/**
 * TEE image frame on a probe path.
 * @param {{ at: (s: number) => { point: number[], tangent: number[] } }} path
 * @param {{ advance?: number, rotation?: number, flexion?: number, lateralFlexion?: number, omega?: number }} state
 *   rotation: + turns the transducer toward the patient's right; flexion: + ante, - retro;
 *   lateralFlexion: + toward the patient's left; omega: multiplane angle 0..180.
 */
export function teeFrame(path, state = {}) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
  const { point, tangent, face: restFace } = path.at(state.advance ?? 0.5);
  let t = tangent;
  let face = restFace;
  face = rotate(face, t, clamp(state.rotation, -TEE_LIMITS.rotation, TEE_LIMITS.rotation));
  // Flexion bends the tip (and the transducer face with it) toward the face.
  const hinge = normalize(cross(t, face));
  const flexion = clamp(state.flexion, ...TEE_LIMITS.flexion);
  t = rotate(t, hinge, flexion);
  face = rotate(face, hinge, flexion);
  // Lateral flexion: the tip swings about the face direction.
  t = rotate(t, face, clamp(state.lateralFlexion, -TEE_LIMITS.lateralFlexion, TEE_LIMITS.lateralFlexion));
  const omega = clamp(state.omega, ...TEE_LIMITS.omega);
  const left = cross(face, t);                 // patient left at 0 degrees, shaft unturned
  const up = [-t[0], -t[1], -t[2]];            // cephalad at 90 degrees
  const w = (omega * Math.PI) / 180;
  const lateral = add(left.map(v => v * Math.cos(w)), up, Math.sin(w));
  return { ...imageFrame(add(point, face, 0.03), face, lateral), tip: point, shaft: t };
}

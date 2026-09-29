/**
 * Cardia Animation Channels Controller
 * Deterministic, channel-based anatomical motion synchronized with CardiacCycle.
 * Chamber motion is a schematic volume change. Vertices on the valve plane stay
 * put so leaflet hinges are not pulled off the atlas orifice.
 */

import { CYCLE_SYNC as SYNC, CARDIAC_INTERVALS } from './cardiac-cycle.js';

/**
 * Computes normalized channel weights (0..1) for any phase in [0, 1).
 * Valve open/close times are the same marks as the ECG (P, QRS, T/S2).
 */
export function computeChannelWeights(phase, options = {}) {
  const p = ((phase % 1) + 1) % 1;

  // P wave / atrial systole. Contraction ends as the AV valves finish closing.
  let atrialContraction = 0;
  if (p >= SYNC.atrialStart && p < SYNC.atrialEnd) {
    const t = (p - SYNC.atrialStart) / (SYNC.atrialEnd - SYNC.atrialStart);
    atrialContraction = Math.sin(Math.PI * t);
  }

  // QRS starts isovolumetric contraction. Pressure falls back to baseline at S2,
  // the start of isovolumetric relaxation, so the ventricle is relaxed while both valves are shut.
  let ventricularContraction = 0;
  if (p >= SYNC.ivcStart && p < SYNC.ivrStart) {
    if (p < SYNC.ejectionPeak) {
      const t = (p - SYNC.ivcStart) / (SYNC.ejectionPeak - SYNC.ivcStart);
      ventricularContraction = Math.sin((Math.PI / 2) * t);
    } else {
      const t = (p - SYNC.ejectionPeak) / (SYNC.ivrStart - SYNC.ejectionPeak);
      ventricularContraction = Math.cos((Math.PI / 2) * t);
    }
  }

  // AV valves stay shut through isovolumetric contraction, ejection, and isovolumetric relaxation.
  // They reopen only with the next rapid filling, after the cycle wraps.
  let avValveOpening = 0;
  if (p < SYNC.avCloseStart) {
    if (p < SYNC.fillingOpenEnd) {
      avValveOpening = Math.sin((Math.PI / 2) * (p / SYNC.fillingOpenEnd));
    } else {
      avValveOpening = 1;
    }
  } else if (p < SYNC.avClosed) {
    const t = (p - SYNC.avCloseStart) / (SYNC.avClosed - SYNC.avCloseStart);
    avValveOpening = Math.cos((Math.PI / 2) * t);
  }

  // Semilunar valves open after QRS, at ejection, and finish closing at S2 / isovolumetric relaxation.
  let semilunarValveOpening = 0;
  if (p >= SYNC.ejectionStart && p < SYNC.ivrStart) {
    if (p < SYNC.semilunarOpen) {
      const t = (p - SYNC.ejectionStart) / (SYNC.semilunarOpen - SYNC.ejectionStart);
      semilunarValveOpening = Math.sin((Math.PI / 2) * t);
    } else if (p < SYNC.semilunarCloseStart) {
      semilunarValveOpening = 1;
    } else {
      const t = (p - SYNC.semilunarCloseStart) / (SYNC.ivrStart - SYNC.semilunarCloseStart);
      semilunarValveOpening = Math.cos((Math.PI / 2) * t);
    }
  }

  let chordaeTension = 0;
  if (p >= SYNC.avClosed && p < SYNC.ivrStart) {
    chordaeTension = ventricularContraction;
  }

  return {
    phase: p,
    atrialContraction,
    ventricularContraction,
    avValveOpening,
    semilunarValveOpening,
    chordaeTension,
    ...shapeChannels(p, options.rhythm)
  };
}

function rememberRest(mesh) {
  const attr = mesh.geometry?.attributes?.position;
  if (!attr) return null;
  if (!mesh.userData.restPosition) {
    mesh.userData.restPosition = new Float32Array(attr.array);
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    mesh.userData.motion = {
      minY: box.min.y,
      maxY: box.max.y,
      cx: (box.min.x + box.max.x) / 2,
      cz: (box.min.z + box.max.z) / 2
    };
  }
  return attr;
}

export function leafletOffset(x, y, z, opening, center, maxR, kind) {
  const amount = Math.max(0, Math.min(1, opening));
  const dx = x - center.x;
  const dz = z - center.z;
  const radial = Math.hypot(dx, dz);
  const safeR = Math.max(maxR, 1e-4);
  const fromHinge = Math.max(0, 1 - radial / safeR);
  const k = amount * fromHinge * fromHinge;
  const nx = radial > 1e-6 ? dx / radial : 0;
  const nz = radial > 1e-6 ? dz / radial : 0;
  const flare = safeR * (kind === 'semilunar' ? 0.22 : 0.16) * k;
  const yShift = safeR * (kind === 'semilunar' ? 0.06 : -0.1) * k;
  return [x + nx * flare, y + yShift, z + nz * flare];
}

function writeLeaflet(mesh, opening, center, maxR, kind) {
  const attr = rememberRest(mesh);
  if (!attr) return;
  const rest = mesh.userData.restPosition;
  const out = attr.array;
  for (let i = 0; i < rest.length; i += 3) {
    const next = leafletOffset(rest[i], rest[i + 1], rest[i + 2], opening, center, maxR, kind);
    out[i] = next[0];
    out[i + 1] = next[1];
    out[i + 2] = next[2];
  }
  attr.needsUpdate = true;
}

// AV leaflets swing about their measured annular hinge, in the annulus frame
// (valves are tilted, so world axes do not describe their motion). Lengths
// are fractions of the measured annulus radius.
const AV_SWING = 0.8;         // open vertex moves toward its hinge side by this fraction of its hinge distance
const AV_DROP = 0.45;         // ...and this fraction deeper into the ventricle
const AV_REACH = 1;           // hinge distance is capped at this (the free edge of a long leaflet)
const AV_BODY_DEPTH = 0.8;    // deeper vertices are chordae, tethered to the papillary tips
const AV_HINGE_DEPTH = 0.25;  // vertices this shallow define a leaflet's hinge side

const clamp01 = value => Math.max(0, Math.min(1, value));

/**
 * How far a leaflet vertex swings open, in annulus radii. Like a leaflet
 * rotating on its hinge, the swing grows with distance from the annulus, so
 * the hinge stays put and short leaflets do not swing past the ring. Along the chordae
 * it fades back to none at the papillary tips (the deepest valve vertices).
 */
export function avLeafletWeight(hingeDistance, depth, radius, maxDepth) {
  const reach = Math.min(hingeDistance / radius, AV_REACH);
  const bodyDepth = AV_BODY_DEPTH * radius;
  if (depth <= bodyDepth || maxDepth <= bodyDepth) return reach;
  return reach * (1 - clamp01((depth - bodyDepth) / (maxDepth - bodyDepth)));
}

/** Open pose of one AV leaflet vertex: toward the leaflet's hinge side and into the ventricle. */
export function avLeafletOffset(x, y, z, opening, weight, outward, normal, radius) {
  const k = clamp01(opening) * weight;
  const swing = AV_SWING * radius * k;
  const drop = AV_DROP * radius * k;
  return [
    x + outward.x * swing + normal.x * drop,
    y + outward.y * swing + normal.y * drop,
    z + outward.z * swing + normal.z * drop
  ];
}

/**
 * Per-mesh AV pose: the in-plane direction of the leaflet's hinge side and a
 * swing weight per vertex, measured against the annulus rim and frame.
 */
function avPose(mesh, frame, rim, maxDepth) {
  const rest = mesh.userData.restPosition;
  const { center, normal, radius } = frame;
  const outward = { x: 0, y: 0, z: 0 };
  const depths = new Float32Array(rest.length / 3);
  const hinge = new Float32Array(rest.length / 3);
  for (let i = 0, v = 0; i < rest.length; i += 3, v++) {
    const dx = rest[i] - center.x;
    const dy = rest[i + 1] - center.y;
    const dz = rest[i + 2] - center.z;
    const d = dx * normal.x + dy * normal.y + dz * normal.z;
    depths[v] = d;
    if (d < AV_HINGE_DEPTH * radius) {
      outward.x += dx - d * normal.x;
      outward.y += dy - d * normal.y;
      outward.z += dz - d * normal.z;
    }
    let best = Infinity;
    for (const point of rim) {
      const q = (rest[i] - point.x) ** 2 + (rest[i + 1] - point.y) ** 2 + (rest[i + 2] - point.z) ** 2;
      if (q < best) best = q;
    }
    hinge[v] = Math.sqrt(best);
  }
  const length = Math.hypot(outward.x, outward.y, outward.z);
  if (length > 1e-6) {
    outward.x /= length;
    outward.y /= length;
    outward.z /= length;
  }
  const weights = new Float32Array(depths.length);
  for (let v = 0; v < depths.length; v++) {
    weights[v] = avLeafletWeight(hinge[v], depths[v], radius, maxDepth);
  }
  return { outward, weights };
}

function writeAvLeaflet(mesh, opening, frame) {
  const attr = mesh.geometry.attributes.position;
  const rest = mesh.userData.restPosition;
  const { outward, weights } = mesh.userData.avPose;
  const out = attr.array;
  for (let i = 0, v = 0; i < rest.length; i += 3, v++) {
    const next = avLeafletOffset(rest[i], rest[i + 1], rest[i + 2], opening, weights[v], outward, frame.normal, frame.radius);
    out[i] = next[0];
    out[i + 1] = next[1];
    out[i + 2] = next[2];
  }
  attr.needsUpdate = true;
}

/*
 * Phase C (report section 12). Geometry follows a schematic chamber size
 * proxy, separate from tension: `ventricularContraction` / `atrialContraction`
 * keep their meaning (tension, flow narrative); the shape channels below move
 * the walls. See research/BEAT_MOTION.md for the phase-motion table.
 */
const clamp01s = t => Math.max(0, Math.min(1, t));
const smooth01 = t => { const u = clamp01s(t); return u * u * (3 - 2 * u); };
const fastThenSlow = t => { const u = clamp01s(t); return 1 - (1 - u) * (1 - u); };
const lerp = (a, b, t) => a + (b - a) * t;
const RAPID_FILLING_END = CARDIAC_INTERVALS.find(i => i.id === 'rapid-filling')?.end ?? 0.18;
const CONDUIT_SHAPE = 0.35;   // atrial size fraction lost by passive emptying
const DIASTASIS_SHAPE = 0.18; // ventricular size still to fill before the atrial kick

/**
 * Chamber size channels, 0 = largest, 1 = smallest. Ventricles: fill in
 * rapid filling and diastasis, atrial kick to end-diastole, unchanged in the
 * isovolumetric intervals, shrink through ejection. Atria: conduit emptying,
 * booster contraction, reservoir filling during ventricular systole. In
 * atrial fibrillation there is no booster and no atrial kick.
 */
export function shapeChannels(phase, rhythm = 'sinus') {
  const p = ((phase % 1) + 1) % 1;
  const af = rhythm === 'afib';
  let v;
  if (p < RAPID_FILLING_END) v = lerp(1, 0.25, fastThenSlow(p / RAPID_FILLING_END));
  else if (p < SYNC.avClosed) {
    if (af) v = lerp(0.25, 0, (p - RAPID_FILLING_END) / (SYNC.avClosed - RAPID_FILLING_END));
    else if (p < SYNC.atrialStart) v = lerp(0.25, DIASTASIS_SHAPE, (p - RAPID_FILLING_END) / (SYNC.atrialStart - RAPID_FILLING_END));
    else v = lerp(DIASTASIS_SHAPE, 0, smooth01((p - SYNC.atrialStart) / (SYNC.avClosed - SYNC.atrialStart)));
  } else if (p < SYNC.ejectionStart) v = 0;
  else if (p < SYNC.ivrStart) v = fastThenSlow((p - SYNC.ejectionStart) / (SYNC.ivrStart - SYNC.ejectionStart));
  else v = 1;
  let a;
  if (p < RAPID_FILLING_END) a = lerp(0, CONDUIT_SHAPE, fastThenSlow(p / RAPID_FILLING_END));
  else if (p < SYNC.atrialStart) a = CONDUIT_SHAPE;
  else if (p < SYNC.avClosed) a = af ? CONDUIT_SHAPE : lerp(CONDUIT_SHAPE, 1, smooth01((p - SYNC.atrialStart) / (SYNC.avClosed - SYNC.atrialStart)));
  else a = lerp(af ? CONDUIT_SHAPE : 1, 0, smooth01((p - SYNC.avClosed) / (1 - SYNC.avClosed)));
  return { ventricularShape: v, atrialShape: a };
}

/** Deformation law per chamber: fractions at the far end of the long axis. */
export const CHAMBER_LAW = {
  lv: { radial: 0.11, axial: 0.07, torsion: 0.10, shape: 'ventricularShape', ventricle: true },
  rv: { radial: 0.11, axial: 0.07, torsion: 0, shape: 'ventricularShape', ventricle: true },
  la: { radial: 0.08, axial: 0.05, torsion: 0, shape: 'atrialShape', ventricle: false },
  ra: { radial: 0.08, axial: 0.05, torsion: 0, shape: 'atrialShape', ventricle: false },
};

/** Fallback frame from bounding bounds (world Y): the pre-phase-C law. */
export function frameFromMotion(motion, ventricle) {
  return { base: [motion.cx, ventricle ? motion.maxY : motion.minY, motion.cz], axis: [0, ventricle ? -1 : 1, 0], length: Math.max(1e-4, motion.maxY - motion.minY) };
}

/**
 * Measured chamber frame: from the valve orifice centre along the long axis,
 * to the apex (ventricles: farthest vertex) or into the chamber body (atria:
 * toward the centroid, as far as the chamber reaches).
 */
export function measureChamberFrame(rest, base, ventricle) {
  let ax = 0, ay = 0, az = 0;
  if (ventricle) {
    let best = -1;
    for (let i = 0; i < rest.length; i += 3) {
      const d = (rest[i] - base[0]) ** 2 + (rest[i + 1] - base[1]) ** 2 + (rest[i + 2] - base[2]) ** 2;
      if (d > best) { best = d; ax = rest[i] - base[0]; ay = rest[i + 1] - base[1]; az = rest[i + 2] - base[2]; }
    }
  } else {
    const n = rest.length / 3;
    for (let i = 0; i < rest.length; i += 3) { ax += rest[i] / n; ay += rest[i + 1] / n; az += rest[i + 2] / n; }
    ax -= base[0]; ay -= base[1]; az -= base[2];
  }
  const len = Math.hypot(ax, ay, az) || 1;
  const axis = [ax / len, ay / len, az / len];
  let length = 1e-4;
  for (let i = 0; i < rest.length; i += 3) length = Math.max(length, (rest[i] - base[0]) * axis[0] + (rest[i + 1] - base[1]) * axis[1] + (rest[i + 2] - base[2]) * axis[2]);
  return { base: [...base], axis, length };
}

/**
 * Displacement of a point by a chamber of the given frame, size `shape` and
 * law: radial toward the long axis, longitudinal toward the valve plane,
 * optional torsion about the axis. Grows with (distance from the valve)^2,
 * clamped to the chamber, so the valve plane stays put. Writes into `out`.
 */
export function frameDisplacement(x, y, z, frame, shape, law, out = [0, 0, 0]) {
  const [bx, by, bz] = frame.base, [ax, ay, az] = frame.axis;
  const dx = x - bx, dy = y - by, dz = z - bz;
  const proj = dx * ax + dy * ay + dz * az;
  const t = clamp01s(proj / frame.length);
  const tc = Math.max(0, Math.min(frame.length, proj));
  const rx = dx - proj * ax, ry = dy - proj * ay, rz = dz - proj * az;
  const k = clamp01s(shape) * t * t;
  out[0] = -rx * law.radial * k - ax * tc * law.axial * k;
  out[1] = -ry * law.radial * k - ay * tc * law.axial * k;
  out[2] = -rz * law.radial * k - az * tc * law.axial * k;
  if (law.torsion) {
    // Rotate the already squeezed radial vector, so twist does not change
    // the radius the squeeze produced.
    const q = 1 - law.radial * k;
    const th = law.torsion * k, c = (Math.cos(th) - 1) * q, sn = Math.sin(th) * q;
    out[0] += c * rx + sn * (ay * rz - az * ry);
    out[1] += c * ry + sn * (az * rx - ax * rz);
    out[2] += c * rz + sn * (ax * ry - ay * rx);
  }
  return out;
}

/** The pre-phase-C field (bounding-box frame), kept for callers and tests. */
export function chamberFieldOffset(x, y, z, motion, weight, lockAtMaxY) {
  const law = lockAtMaxY ? { radial: 0.11, axial: 0.07, torsion: 0 } : { radial: 0.08, axial: 0.05, torsion: 0 };
  return frameDisplacement(x, y, z, frameFromMotion(motion, lockAtMaxY), weight, law);
}

/** Write a mesh displaced by one chamber field (used for the LAA marker). */
function writeWithFrame(mesh, frame, shape, law) {
  const attr = rememberRest(mesh);
  if (!attr) return;
  const rest = mesh.userData.restPosition, out = attr.array, d = [0, 0, 0];
  for (let i = 0; i < rest.length; i += 3) {
    frameDisplacement(rest[i], rest[i + 1], rest[i + 2], frame, shape, law, d);
    out[i] = rest[i] + d[0]; out[i + 1] = rest[i + 1] + d[1]; out[i + 2] = rest[i + 2] + d[2];
  }
  attr.needsUpdate = true;
}

export const SEAM_BAND = 0.25;
/** Share of the neighbouring chamber's field at distance d from it (half at contact). */
export function seamWeight(d) {
  return d >= SEAM_BAND ? 0 : 0.5 * (1 - smooth01(d / SEAM_BAND));
}

/*
 * Surface followers (report section 12, phase B). Structures lying on or near
 * a chamber (coronary arteries and veins, great-vessel roots, papillary
 * muscles, annuli, conduction markers) are bound once, at rest, to the
 * nearest vertex of up to two chambers. Every frame they take that vertex's
 * current displacement, weighted by distance, starting again from the rest
 * pose so nothing drifts. Within FOLLOW_CONTACT they move fully with the
 * wall; the weight fades to zero at FOLLOW_FADE, so the far aortic arch or a
 * distant pulmonary vein stays still.
 */
export const FOLLOW_CONTACT = 0.15;
export const FOLLOW_FADE = 0.45;
const FOLLOW_CELL = 0.15;
const OWNER_IDS = ['lv', 'rv', 'la', 'ra'];
const FOLLOWER_IDS = new Set(['mitral-annulus', 'tricuspid-annulus', 'lv-papillary', 'rv-papillary']);
// Anatomical owners: a papillary muscle belongs to its ventricle, an annulus
// to its atrium and ventricle. Others may bind to any chamber.
export const FOLLOWER_OWNERS = {
  'lv-papillary': ['lv'], 'rv-papillary': ['rv'],
  'mitral-annulus': ['la', 'lv'], 'tricuspid-annulus': ['ra', 'rv'],
};

/** Which meshes follow the chamber walls. Leaflets keep their own opening motion. */
export function isSurfaceFollower(userData = {}) {
  if (userData.micro || OWNER_IDS.includes(userData.id) || userData.id === 'laa') return false;
  return FOLLOWER_IDS.has(userData.id) || ['coronaries', 'vessels', 'conduction'].includes(userData.layer);
}

/** Full weight in contact, smooth fade to zero at FOLLOW_FADE. */
export function followWeight(distance) {
  if (distance <= FOLLOW_CONTACT) return 1;
  if (distance >= FOLLOW_FADE) return 0;
  const t = (distance - FOLLOW_CONTACT) / (FOLLOW_FADE - FOLLOW_CONTACT);
  return 1 - t * t * (3 - 2 * t);
}

const worldPoint = (e, x, y, z, out, o) => {
  out[o] = e[0] * x + e[4] * y + e[8] * z + e[12];
  out[o + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
  out[o + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
};

const FOLLOW_SMOOTH_STEPS = 6;

/**
 * Bind follower vertices to owner vertices. `owners` are { rest (local),
 * matrix (world elements) }, `follower` is { rest, matrix, index? }. Each
 * vertex keeps, per owner, its nearest owner vertex within FOLLOW_FADE; the
 * owner mix is then smoothed over the follower's own edges (coincident seam
 * vertices welded) so a vessel lying in a groove between two chambers moves
 * as one tube instead of tearing along the groove. Returns flat arrays of
 * length count * owners.length: owner vertex index (-1 unbound) and weight.
 */
export function bindFollower(owners, follower) {
  const n = owners.length;
  const ownerWorld = owners.map(o => { const w = new Float32Array(o.rest.length); for (let i = 0; i < o.rest.length; i += 3) worldPoint(o.matrix, o.rest[i], o.rest[i + 1], o.rest[i + 2], w, i); return w; });
  const grid = new Map();
  // Numeric cell key (cells within +-1024 of the origin; the heart spans ~30).
  const key = (x, y, z) => ((x + 1024) * 2048 + (y + 1024)) * 2048 + (z + 1024);
  ownerWorld.forEach((w, c) => {
    for (let i = 0; i < w.length; i += 3) {
      const k = key(Math.floor(w[i] / FOLLOW_CELL), Math.floor(w[i + 1] / FOLLOW_CELL), Math.floor(w[i + 2] / FOLLOW_CELL));
      let list = grid.get(k); if (!list) grid.set(k, list = []);
      list.push(c, i);
    }
  });
  const count = follower.rest.length / 3;
  const index = new Int32Array(count * n).fill(-1);
  const dist = new Float32Array(count * n).fill(Infinity); // squared while scanning
  const p = new Float32Array(3);
  const reach = Math.ceil(FOLLOW_FADE / FOLLOW_CELL);
  const scan = (v, cx, cy, cz, r) => {
    for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) {
      const list = grid.get(key(cx + dx, cy + dy, cz + dz)); if (!list) continue;
      for (let j = 0; j < list.length; j += 2) {
        const c = list[j], i = list[j + 1], w = ownerWorld[c];
        const dx = w[i] - p[0], dy = w[i + 1] - p[1], dz = w[i + 2] - p[2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < dist[v * n + c]) { dist[v * n + c] = d; index[v * n + c] = i; }
      }
    }
  };
  for (let v = 0; v < count; v++) {
    worldPoint(follower.matrix, follower.rest[v * 3], follower.rest[v * 3 + 1], follower.rest[v * 3 + 2], p, 0);
    const cx = Math.floor(p[0] / FOLLOW_CELL), cy = Math.floor(p[1] / FOLLOW_CELL), cz = Math.floor(p[2] / FOLLOW_CELL);
    scan(v, cx, cy, cz, 1);
    // Widen only when no allowed owner is in contact: the fade zone. A second
    // owner beyond the first ring would carry a negligible fourth-power share.
    let found = false;
    for (let c = 0; c < n; c++) if (dist[v * n + c] <= FOLLOW_CONTACT * FOLLOW_CONTACT && (!follower.allowed || follower.allowed.includes(c))) found = true;
    if (!found) scan(v, cx, cy, cz, reach);
    for (let c = 0; c < n; c++) {
      const d = Math.sqrt(dist[v * n + c]);
      if (d > FOLLOW_FADE || (follower.allowed && !follower.allowed.includes(c))) { dist[v * n + c] = Infinity; index[v * n + c] = -1; } else dist[v * n + c] = d;
    }
  }
  // Owner mix per vertex (inverse fourth power: the nearer wall dominates),
  // and the overall attachment.
  const mix = new Float32Array(count * n);
  const attach = new Float32Array(count);
  for (let v = 0; v < count; v++) {
    let sum = 0, nearest = Infinity;
    for (let c = 0; c < n; c++) { const d = dist[v * n + c]; if (d === Infinity) continue; const f = 1 / (d ** 4 + 1e-10); mix[v * n + c] = f; sum += f; nearest = Math.min(nearest, d); }
    if (sum > 0) for (let c = 0; c < n; c++) mix[v * n + c] /= sum;
    // Papillary muscles ride their ventricle's field over their whole length.
    attach[v] = nearest === Infinity ? 0 : follower.fullAttach ? 1 : followWeight(nearest);
  }
  // Smooth the mix over the follower's edges (welded by position). Only thin
  // tubes that can lie in a groove need it; great vessels and muscles do not.
  if (follower.smooth && follower.index && follower.index.length) {
    const weld = new Int32Array(count);
    const seen = new Map();
    for (let v = 0; v < count; v++) {
      const k = `${Math.round(follower.rest[v * 3] * 1e4)},${Math.round(follower.rest[v * 3 + 1] * 1e4)},${Math.round(follower.rest[v * 3 + 2] * 1e4)}`;
      if (!seen.has(k)) seen.set(k, v);
      weld[v] = seen.get(k);
    }
    const neighbors = Array.from({ length: count }, () => new Set());
    const tri = follower.index;
    for (let t = 0; t + 2 < tri.length; t += 3) {
      const a = weld[tri[t]], b = weld[tri[t + 1]], c = weld[tri[t + 2]];
      neighbors[a].add(b).add(c); neighbors[b].add(a).add(c); neighbors[c].add(a).add(b);
    }
    const next = new Float32Array(mix.length);
    for (let step = 0; step < FOLLOW_SMOOTH_STEPS; step++) {
      for (let v = 0; v < count; v++) {
        const root = weld[v];
        if (root !== v) continue;
        const list = neighbors[v];
        for (let c = 0; c < n; c++) {
          let acc = 0;
          for (const u of list) acc += mix[u * n + c];
          next[v * n + c] = list.size ? 0.5 * mix[v * n + c] + 0.5 * acc / list.size : mix[v * n + c];
        }
      }
      for (let v = 0; v < count; v++) { const root = weld[v]; for (let c = 0; c < n; c++) mix[v * n + c] = next[root * n + c]; }
    }
  }
  // An owner without a bound vertex cannot contribute; renormalize the rest.
  const weight = new Float32Array(count * n);
  for (let v = 0; v < count; v++) {
    let sum = 0;
    for (let c = 0; c < n; c++) if (index[v * n + c] >= 0) sum += mix[v * n + c];
    if (sum <= 0) continue;
    for (let c = 0; c < n; c++) if (index[v * n + c] >= 0) weight[v * n + c] = attach[v] * mix[v * n + c] / sum;
  }
  // Compact form: only non-zero (owner, vertex, weight) entries per vertex.
  const offsets = new Uint32Array(count + 1);
  let nnz = 0;
  for (let v = 0; v < count; v++) { for (let c = 0; c < n; c++) if (weight[v * n + c] > 0) nnz++; offsets[v + 1] = nnz; }
  const cOwner = new Uint8Array(nnz), cIndex = new Int32Array(nnz), cWeight = new Float32Array(nnz);
  for (let v = 0, k = 0; v < count; v++) for (let c = 0; c < n; c++) if (weight[v * n + c] > 0) { cOwner[k] = c; cIndex[k] = index[v * n + c]; cWeight[k] = weight[v * n + c]; k++; }
  // Vertices with no owner never move; only the others are written per frame.
  const active = new Uint32Array(count);
  let na = 0;
  for (let v = 0; v < count; v++) if (offsets[v + 1] > offsets[v]) active[na++] = v;
  return { index, weight, owners: n, offsets, cOwner, cIndex, cWeight, active: active.subarray(0, na) };
}

/** Invert the linear part of a column-major 4x4 matrix (rigid or uniform-scale use). */
function inverseLinear(e) {
  const a = e[0], b = e[4], c = e[8], d = e[1], f = e[5], g = e[9], h = e[2], i = e[6], j = e[10];
  const det = a * (f * j - g * i) - b * (d * j - g * h) + c * (d * i - f * h) || 1;
  return [(f * j - g * i) / det, (c * i - b * j) / det, (b * g - c * f) / det,
    (g * h - d * j) / det, (a * j - c * h) / det, (c * d - a * g) / det,
    (d * i - f * h) / det, (b * h - a * i) / det, (a * f - b * d) / det];
}

/**
 * Write one follower frame: rest + sum of weighted owner displacements, the
 * displacement taken in world space and brought back to the follower frame.
 */
export function writeFollower(follower, binding, owners) {
  const { rest, out, matrixInverse: m } = follower;
  if (follower.field) {
    // Inside a cavity: evaluate the owner's field at the vertex itself.
    const { frame, law, weight } = follower.field;
    const shape = weight(), d = [0, 0, 0];
    for (let o = 0; o < rest.length; o += 3) {
      frameDisplacement(rest[o], rest[o + 1], rest[o + 2], frame, shape, law, d);
      out[o] = rest[o] + d[0]; out[o + 1] = rest[o + 1] + d[1]; out[o + 2] = rest[o + 2] + d[2];
    }
    return;
  }
  const { offsets, cOwner, cIndex, cWeight, active } = binding;
  // World displacement of every owner vertex, computed once per frame by the
  // caller (owner.disp) or here when called on its own.
  for (const o of owners) if (owners.stamp === undefined || !o.disp || o.dispStamp !== owners.stamp) ownerDisplacement(o, owners.stamp);
  const identity = follower.identityInverse ??= isIdentityLinear(m);
  const disps = owners.map(o => o.disp);
  for (let a = 0; a < active.length; a++) {
    const v = active[a];
    let wx = 0, wy = 0, wz = 0;
    for (let k = offsets[v], end = offsets[v + 1]; k < end; k++) {
      const d = disps[cOwner[k]], i = cIndex[k], wt = cWeight[k];
      wx += wt * d[i]; wy += wt * d[i + 1]; wz += wt * d[i + 2];
    }
    const o = v * 3;
    if (identity) { out[o] = rest[o] + wx; out[o + 1] = rest[o + 1] + wy; out[o + 2] = rest[o + 2] + wz; continue; }
    out[o] = rest[o] + m[0] * wx + m[1] * wy + m[2] * wz;
    out[o + 1] = rest[o + 1] + m[3] * wx + m[4] * wy + m[5] * wz;
    out[o + 2] = rest[o + 2] + m[6] * wx + m[7] * wy + m[8] * wz;
  }
}

const isIdentityLinear = m => [1, 0, 0, 0, 1, 0, 0, 0, 1].every((x, i) => Math.abs(m[i] - x) < 1e-12);

/** Owner vertex displacement in world space (current - rest through the matrix). */
function ownerDisplacement(o, stamp) {
  const n = o.rest.length;
  if (!o.disp || o.disp.length !== n) o.disp = new Float32Array(n);
  const e = o.matrix, identity = e[0] === 1 && e[5] === 1 && e[10] === 1 && !e[1] && !e[2] && !e[4] && !e[6] && !e[8] && !e[9];
  for (let i = 0; i < n; i += 3) {
    const lx = o.current[i] - o.rest[i], ly = o.current[i + 1] - o.rest[i + 1], lz = o.current[i + 2] - o.rest[i + 2];
    if (identity) { o.disp[i] = lx; o.disp[i + 1] = ly; o.disp[i + 2] = lz; continue; }
    o.disp[i] = e[0] * lx + e[4] * ly + e[8] * lz;
    o.disp[i + 1] = e[1] * lx + e[5] * ly + e[9] * lz;
    o.disp[i + 2] = e[2] * lx + e[6] * ly + e[10] * lz;
  }
  o.dispStamp = stamp;
}

/**
 * Creates an anatomical animation channel controller attached to a Heart instance.
 */
const VALVE_GROUPS = [
  { ids: ['lcc', 'rcc', 'ncc'], kind: 'semilunar', channel: 'semilunarValveOpening' },
  { ids: ['pulmonary-valve'], kind: 'semilunar', channel: 'semilunarValveOpening' },
  { ids: ['mitral'], kind: 'av', channel: 'avValveOpening' },
  { ids: ['tricuspid'], kind: 'av', channel: 'avValveOpening' }
];

export function createAnimationChannels({ meshMap, sourceCenter = null }) {
  const valveCache = new Map();
  let followers = null;
  let lastWeights = {};
  const isIdentity = e => e.every((v, i) => Math.abs(v - (i % 5 === 0 ? 1 : 0)) < 1e-9);

  // Bound lazily on the first frame, when every mesh (including conduction
  // tracts built after the atlas) exists.
  function followerSetup() {
    if (followers) return followers;
    const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const matrixOf = mesh => { mesh.updateWorldMatrix?.(true, false); return mesh.matrixWorld?.elements?.slice() || IDENTITY.slice(); };
    const owners = [];
    for (const id of OWNER_IDS) {
      const mesh = (meshMap.get(id) || [])[0];
      const attr = mesh && rememberRest(mesh);
      if (attr) owners.push({ mesh, rest: mesh.userData.restPosition, current: attr.array, matrix: matrixOf(mesh) });
    }
    const seen = new Set();
    const ownerIndex = new Map(owners.map((o, i) => [o.mesh.userData.id, i]));
    followers = [];
    for (const list of meshMap.values()) for (const mesh of list) {
      if (!owners.length || seen.has(mesh) || !isSurfaceFollower(mesh.userData) || !mesh.geometry?.attributes?.position) continue;
      seen.add(mesh);
      const attr = rememberRest(mesh);
      const matrix = matrixOf(mesh);
      const follower = { mesh, attr, rest: mesh.userData.restPosition, out: attr.array, matrix, matrixInverse: inverseLinear(matrix), index: mesh.geometry.index?.array, smooth: ['coronaries', 'conduction'].includes(mesh.userData.layer) || !!FOLLOWER_OWNERS[mesh.userData.id], fullAttach: /papillary/.test(mesh.userData.id),
        allowed: FOLLOWER_OWNERS[mesh.userData.id]?.map(id => ownerIndex.get(id)).filter(i => i !== undefined) };
      const ownerId = FOLLOWER_OWNERS[mesh.userData.id]?.[0];
      const owner = follower.fullAttach && owners[ownerIndex.get(ownerId)];
      const ownerChamber = owner && chamberSetup().find(ch => ch.mesh === owner.mesh);
      if (owner && ownerChamber && isIdentity(matrix) && isIdentity(owner.matrix)) {
        follower.field = { frame: ownerChamber.frame, law: ownerChamber.law, weight: () => lastWeights[ownerChamber.law.shape] || 0 };
        followers.push({ follower, binding: null });
        continue;
      }
      const binding = bindFollower(owners, follower);
      if (binding.weight.some(w => w > 0)) followers.push({ follower, binding });
    }
    followers.owners = owners;
    return followers;
  }

  function applyFollowers() {
    const setup = followerSetup();
    setup.owners.stamp = (setup.owners.stamp || 0) + 1;
    for (const { follower, binding } of setup) {
      writeFollower(follower, binding, setup.owners);
      follower.attr.needsUpdate = true;
    }
  }

  // Chambers: every positioned mesh of LV, RV, LA, RA gets its frame (the
  // measured valve-to-apex axis when the annulus centre is known, else the
  // bounding-box frame), its rest normals, and seam links to the nearest
  // other chamber so shared walls move together.
  let chambers = null;
  function chamberSetup() {
    if (chambers) return chambers;
    chambers = [];
    const baseOf = id => {
      // Left heart axes start at the mitral orifice, right heart at the tricuspid.
      const center = sourceCenter?.(id === 'lv' || id === 'la' ? 'mitral-annulus' : 'tricuspid-annulus');
      return center ? [center.x, center.y, center.z] : null;
    };
    for (const id of OWNER_IDS) {
      const law = CHAMBER_LAW[id];
      let primary = true;
      for (const mesh of meshMap.get(id) || []) {
        const attr = rememberRest(mesh);
        if (!attr) continue;
        const rest = mesh.userData.restPosition;
        // The measured frame belongs to the chamber's first positioned mesh.
        const base = primary ? baseOf(id) : null;
        primary = false;
        const frame = base ? measureChamberFrame(rest, base, law.ventricle) : frameFromMotion(mesh.userData.motion, law.ventricle);
        const normal = mesh.geometry.attributes.normal;
        chambers.push({ id, mesh, attr, rest, law, frame, normal, restNormal: normal ? Float32Array.from(normal.array) : null, seamOther: null, seamWeight: null });
      }
    }
    // Seam links: nearest vertex of another chamber within SEAM_BAND.
    const cell = SEAM_BAND, grid = new Map();
    const key = (x, y, z) => ((x + 1024) * 2048 + (y + 1024)) * 2048 + (z + 1024);
    chambers.forEach((ch, c) => { for (let i = 0; i < ch.rest.length; i += 3) { const k = key(Math.floor(ch.rest[i] / cell), Math.floor(ch.rest[i + 1] / cell), Math.floor(ch.rest[i + 2] / cell)); let l = grid.get(k); if (!l) grid.set(k, l = []); l.push(c, i); } });
    chambers.forEach((ch, c) => {
      const n = ch.rest.length / 3;
      const other = new Int8Array(n).fill(-1), weight = new Float32Array(n);
      for (let v = 0; v < n; v++) {
        const x = ch.rest[v * 3], y = ch.rest[v * 3 + 1], z = ch.rest[v * 3 + 2];
        const cx = Math.floor(x / cell), cy = Math.floor(y / cell), cz = Math.floor(z / cell);
        let best = SEAM_BAND * SEAM_BAND, bc = -1;
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
          const l = grid.get(key(cx + dx, cy + dy, cz + dz)); if (!l) continue;
          for (let j = 0; j < l.length; j += 2) {
            const o = l[j]; if (o === c || chambers[o].id === ch.id) continue;
            const r = chambers[o].rest, i = l[j + 1];
            const d = (r[i] - x) ** 2 + (r[i + 1] - y) ** 2 + (r[i + 2] - z) ** 2;
            if (d < best) { best = d; bc = o; }
          }
        }
        if (bc >= 0) { other[v] = bc; weight[v] = seamWeight(Math.sqrt(best)); }
      }
      ch.seamOther = other; ch.seamWeight = weight;
    });
    // Per-vertex frame terms are constant: cache them so a frame is only
    // multiply-adds (own frame, and the seam neighbour's frame where blended).
    const terms = (rest, frame, only) => {
      const n = rest.length / 3, r = new Float32Array(n * 3), t2 = new Float32Array(n), tc = new Float32Array(n);
      const [bx, by, bz] = frame.base, [ax, ay, az] = frame.axis;
      for (let v = 0; v < n; v++) {
        if (only && !only(v)) continue;
        const i = v * 3, dx = rest[i] - bx, dy = rest[i + 1] - by, dz = rest[i + 2] - bz;
        const proj = dx * ax + dy * ay + dz * az, t = clamp01s(proj / frame.length);
        r[i] = dx - proj * ax; r[i + 1] = dy - proj * ay; r[i + 2] = dz - proj * az;
        t2[v] = t * t; tc[v] = Math.max(0, Math.min(frame.length, proj));
      }
      return { r, t2, tc };
    };
    for (const ch of chambers) {
      ch.own = terms(ch.rest, ch.frame);
      // Seam neighbour terms aligned to this chamber's vertices (each vertex
      // has at most one neighbour), merged from one pass per neighbour.
      const n = ch.rest.length / 3;
      const merged = { r: new Float32Array(n * 3), t2: new Float32Array(n), tc: new Float32Array(n) };
      for (const o of new Set(ch.seamOther)) {
        if (o < 0) continue;
        const part = terms(ch.rest, chambers[o].frame, u => ch.seamOther[u] === o && ch.seamWeight[u] > 0);
        for (let v = 0; v < n; v++) if (ch.seamOther[v] === o) { merged.r[v * 3] = part.r[v * 3]; merged.r[v * 3 + 1] = part.r[v * 3 + 1]; merged.r[v * 3 + 2] = part.r[v * 3 + 2]; merged.t2[v] = part.t2[v]; merged.tc[v] = part.tc[v]; }
      }
      ch.neighbourTerms = merged;
    }
    return chambers;
  }

  // Deform every chamber from its rest pose by its own field, blended with
  // the neighbour's field near a shared wall; rotate normals with torsion.
  // Same law as frameDisplacement, from cached per-vertex terms, written
  // inline for speed. Torsion uses the small-angle expansion (angle <= 0.1
  // rad, error below 1e-4).
  function deformChambers(weights) {
    const list = chamberSetup();
    for (const ch of list) {
      const shape = weights[ch.law.shape] || 0;
      const { rest, attr } = ch;
      const out = attr.array;
      const own = fieldCoefficients(ch, shape);
      const seamOther = ch.seamOther, seamWeight = ch.seamWeight;
      const others = list.map(o => (o === ch ? null : fieldCoefficients(o, weights[o.law.shape] || 0)));
      const nr = ch.neighbourTerms.r, nt2 = ch.neighbourTerms.t2, ntc = ch.neighbourTerms.tc;
      const r = ch.own.r, t2 = ch.own.t2, tc = ch.own.tc;
      for (let v = 0, i = 0; i < rest.length; v++, i += 3) {
        let dx, dy, dz;
        {
          const k = own.s * t2[v], rx = r[i], ry = r[i + 1], rz = r[i + 2], a = tc[v] * own.axial * k, q = own.radial * k;
          dx = -rx * q - own.ax * a; dy = -ry * q - own.ay * a; dz = -rz * q - own.az * a;
          if (own.torsion) {
            const th = own.torsion * k, qq = 1 - q, c = -0.5 * th * th * qq, sn = th * (1 - th * th / 6) * qq;
            dx += c * rx + sn * (own.ay * rz - own.az * ry);
            dy += c * ry + sn * (own.az * rx - own.ax * rz);
            dz += c * rz + sn * (own.ax * ry - own.ay * rx);
          }
        }
        const b = seamWeight[v];
        if (b > 0) {
          const f = others[seamOther[v]];
          const k = f.s * nt2[v], rx = nr[i], ry = nr[i + 1], rz = nr[i + 2], a = ntc[v] * f.axial * k, q = f.radial * k;
          let ox = -rx * q - f.ax * a, oy = -ry * q - f.ay * a, oz = -rz * q - f.az * a;
          if (f.torsion) {
            const th = f.torsion * k, qq = 1 - q, c = -0.5 * th * th * qq, sn = th * (1 - th * th / 6) * qq;
            ox += c * rx + sn * (f.ay * rz - f.az * ry);
            oy += c * ry + sn * (f.az * rx - f.ax * rz);
            oz += c * rz + sn * (f.ax * ry - f.ay * rx);
          }
          dx += (ox - dx) * b; dy += (oy - dy) * b; dz += (oz - dz) * b;
        }
        out[i] = rest[i] + dx; out[i + 1] = rest[i + 1] + dy; out[i + 2] = rest[i + 2] + dz;
      }
      attr.needsUpdate = true;
      if (ch.law.torsion && ch.restNormal) rotateNormals(ch, shape);
    }
  }

  // Per-frame scalars of a chamber's field.
  function fieldCoefficients(ch, shape) {
    const [ax, ay, az] = ch.frame.axis;
    return { s: clamp01s(shape), radial: ch.law.radial, axial: ch.law.axial, torsion: ch.law.torsion, ax, ay, az };
  }

  // Normals follow the twist: rotate each rest normal about the long axis by
  // the vertex's torsion angle (the squeeze tilt is small and ignored).
  function rotateNormals(ch, shape) {
    const { restNormal, normal, frame, law } = ch;
    const [ax, ay, az] = frame.axis;
    const out = normal.array, t2 = ch.own.t2;
    for (let v = 0, i = 0; i < restNormal.length; v++, i += 3) {
      const th = law.torsion * clamp01s(shape) * t2[v];
      const nx = restNormal[i], ny = restNormal[i + 1], nz = restNormal[i + 2];
      if (!th) { out[i] = nx; out[i + 1] = ny; out[i + 2] = nz; continue; }
      const c = 1 - th * th / 2, sn = th * (1 - th * th / 6), dot = nx * ax + ny * ay + nz * az;
      out[i] = nx * c + (ay * nz - az * ny) * sn + ax * dot * (1 - c);
      out[i + 1] = ny * c + (az * nx - ax * nz) * sn + ay * dot * (1 - c);
      out[i + 2] = nz * c + (ax * ny - ay * nx) * sn + az * dot * (1 - c);
    }
    normal.needsUpdate = true;
  }

  function valveGroup(ids) {
    const key = ids.join('|');
    if (valveCache.has(key)) return valveCache.get(key);
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;
    const meshes = [];
    for (const id of ids) {
      for (const mesh of meshMap.get(id) || []) {
        if (!rememberRest(mesh)) continue;
        meshes.push(mesh);
        const box = mesh.geometry.boundingBox;
        minX = Math.min(minX, box.min.x);
        minY = Math.min(minY, box.min.y);
        minZ = Math.min(minZ, box.min.z);
        maxX = Math.max(maxX, box.max.x);
        maxY = Math.max(maxY, box.max.y);
        maxZ = Math.max(maxZ, box.max.z);
      }
    }
    if (!meshes.length) {
      valveCache.set(key, null);
      return null;
    }
    const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: (minZ + maxZ) / 2 };
    let maxR = 1e-4;
    for (const mesh of meshes) {
      const rest = mesh.userData.restPosition;
      for (let i = 0; i < rest.length; i += 3) {
        const radial = Math.hypot(rest[i] - center.x, rest[i + 2] - center.z);
        if (radial > maxR) maxR = radial;
      }
    }
    const group = { meshes, center, maxR, frame: null };
    // AV valves move in their measured annulus frame when the ring is known.
    const ring = ids.length === 1 ? (meshMap.get(`${ids[0]}-annulus`) || [])[0]?.userData : null;
    if (ring?.frame && ring.rim) {
      const { center: c, normal } = ring.frame;
      let maxDepth = 0;
      for (const mesh of meshes) {
        const rest = mesh.userData.restPosition;
        for (let i = 0; i < rest.length; i += 3) {
          const d = (rest[i] - c.x) * normal.x + (rest[i + 1] - c.y) * normal.y + (rest[i + 2] - c.z) * normal.z;
          if (d > maxDepth) maxDepth = d;
        }
      }
      for (const mesh of meshes) mesh.userData.avPose = avPose(mesh, ring.frame, ring.rim, maxDepth);
      group.frame = ring.frame;
    }
    valveCache.set(key, group);
    return group;
  }

  function applyValves(weights) {
    for (const group of VALVE_GROUPS) {
      const pose = valveGroup(group.ids);
      if (!pose) continue;
      const opening = weights[group.channel];
      for (const mesh of pose.meshes) {
        if (group.kind === 'av' && pose.frame) writeAvLeaflet(mesh, opening, pose.frame);
        else writeLeaflet(mesh, opening, pose.center, pose.maxR, group.kind);
      }
    }
  }

  /**
   * Chamber volume and leaflet pose share computeChannelWeights with the ECG.
   */
  function applyChannels(cycleState) {
    if (!cycleState || cycleState.reducedMotion) {
      reset();
      return;
    }
    const weights = computeChannelWeights(cycleState.phase, { rhythm: cycleState.rhythm });
    lastWeights = weights;
    deformChambers(weights);
    // The LAA marker rides the LA field (it has no wall of its own here).
    const la = chamberSetup().find(ch => ch.id === 'la');
    if (la) for (const marker of meshMap.get('laa') || []) writeWithFrame(marker, la.frame, weights.atrialShape, la.law);
    applyFollowers();
    applyValves(weights);
    return weights;
  }

  function restoreMesh(mesh) {
    const attr = mesh.geometry?.attributes?.position;
    const rest = mesh.userData.restPosition;
    if (attr && rest) {
      attr.array.set(rest);
      attr.needsUpdate = true;
    }
    mesh.scale.set(1, 1, 1);
    mesh.position.set(0, 0, 0);
  }

  function reset() {
    for (const id of ['lv', 'rv', 'la', 'laa', 'ra', 'lcc', 'rcc', 'ncc', 'pulmonary-valve', 'mitral', 'tricuspid', 'lv-papillary', 'rv-papillary']) {
      for (const mesh of meshMap.get(id) || []) restoreMesh(mesh);
    }
    for (const { follower } of followers || []) {
      follower.out.set(follower.rest);
      follower.attr.needsUpdate = true;
    }
    for (const ch of chambers || []) if (ch.restNormal) { ch.normal.array.set(ch.restNormal); ch.normal.needsUpdate = true; }
  }

  return {
    applyChannels,
    computeChannelWeights,
    reset,
    // Bind the surface followers ahead of the first beat (idle time).
    prepare: () => { chamberSetup(); followerSetup(); },
    followerCount: () => followerSetup().length
  };
}

/**
 * Lesson overlays, devices and flow follow the beating heart (report section
 * 12, phase D). These objects live outside meshMap (EP lines and lesions,
 * pacemaker leads, transseptal and cath catheters, flow particles) and are
 * built once from the rest anatomy. Each point gets two motions from the
 * chamber controller (`channels.fieldContext()`):
 * - on or near a wall: the displacement of its nearest wall vertices, the
 *   same binding the phase B surface followers use (exact at the wall, fading
 *   to still 0.45 units away);
 * - inside a cavity: the chamber's own continuous deformation field, so a
 *   catheter crossing a cavity does not jump between opposite walls.
 * A smooth "inside" weight from a per-chamber radius profile blends the two.
 * Everything is computed from rest every frame (no drift); reset returns rest.
 */
import { bindFollower } from './surface-followers.js';
import { fieldTerms, fieldAt, FIELD_TERMS } from './chamber-field.js';

const PROFILE_BINS = 16;
const PROFILE_SECTORS = 12;
const INSIDE_MARGIN = 0.08;
// Objects smaller than this move rigidly with the field at their centre
// (lesion dots, electrode rings, lead tips): no shape change, cheap.
const RIGID_RADIUS = 0.08;
// Marker shapes (rings, spheres, electrode cylinders) stay rigid up to this size.
const MARKER_RADIUS = 0.2;
const MARKER_TYPES = new Set(['TorusGeometry', 'SphereGeometry', 'CylinderGeometry']);
// Tubes: ring displacements are smoothed along the tube (binomial passes over
// about this length, as a standard deviation), so a change of nearest wall
// vertex from one ring to the next does not kink it.
const TUBE_SMOOTH_LENGTH = 0.12;
const TUBE_SMOOTH_MAX_PASSES = 200;
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/**
 * Ring layout of a three.js TubeGeometry: (tubularSegments + 1) rings of
 * (radialSegments + 1) vertices. A tube moves ring by ring with the field at
 * the ring centre, so its thin cross-section keeps its shape (binding each
 * vertex would shear it: the field differs across even a thin tube).
 */
function tubeRings(geometry) {
  const p = geometry.parameters;
  if (geometry.type !== 'TubeGeometry' || !p) return null;
  const size = p.radialSegments + 1, rings = p.tubularSegments + 1;
  return rings * size === geometry.attributes.position.count ? { size, rings } : null;
}

const smoothStep = x => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };

function basis(axis) {
  const [ax, ay, az] = axis;
  const ref = Math.abs(ay) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = ay * ref[2] - az * ref[1], uy = az * ref[0] - ax * ref[2], uz = ax * ref[1] - ay * ref[0];
  const l = Math.hypot(ux, uy, uz) || 1; ux /= l; uy /= l; uz /= l;
  return { u: [ux, uy, uz], w: [ay * uz - az * uy, az * ux - ax * uz, ax * uy - ay * ux] };
}

/**
 * Radius profile of a chamber around its long axis: the largest rest-vertex
 * distance from the axis per (axial bin, angular sector). A point is inside
 * when it lies within that radius and the chamber's axial extent.
 */
export function chamberProfile(rest, frame) {
  const [bx, by, bz] = frame.base, [ax, ay, az] = frame.axis;
  const { u, w } = basis(frame.axis);
  let pmin = Infinity, pmax = -Infinity;
  for (let i = 0; i < rest.length; i += 3) {
    const p = (rest[i] - bx) * ax + (rest[i + 1] - by) * ay + (rest[i + 2] - bz) * az;
    if (p < pmin) pmin = p; if (p > pmax) pmax = p;
  }
  const rmax = new Float32Array(PROFILE_BINS * PROFILE_SECTORS);
  const span = Math.max(1e-6, pmax - pmin);
  for (let i = 0; i < rest.length; i += 3) {
    const dx = rest[i] - bx, dy = rest[i + 1] - by, dz = rest[i + 2] - bz;
    const p = dx * ax + dy * ay + dz * az;
    const rx = dx - p * ax, ry = dy - p * ay, rz = dz - p * az;
    const a = rx * u[0] + ry * u[1] + rz * u[2], b = rx * w[0] + ry * w[1] + rz * w[2];
    const bin = Math.min(PROFILE_BINS - 1, Math.floor((p - pmin) / span * PROFILE_BINS));
    const sector = Math.min(PROFILE_SECTORS - 1, Math.floor((Math.atan2(b, a) + Math.PI) / (2 * Math.PI) * PROFILE_SECTORS));
    const r = Math.hypot(a, b), k = bin * PROFILE_SECTORS + sector;
    if (r > rmax[k]) rmax[k] = r;
  }
  return { frame, u, w, pmin, pmax, rmax };
}

/** Smooth 0..1 "inside this chamber" weight (bilinear over bins and sectors). */
export function insideWeight(profile, x, y, z) {
  const { frame, u, w, pmin, pmax, rmax } = profile;
  const [bx, by, bz] = frame.base, [ax, ay, az] = frame.axis;
  const dx = x - bx, dy = y - by, dz = z - bz;
  const p = dx * ax + dy * ay + dz * az;
  const ends = smoothStep((p - pmin) / INSIDE_MARGIN) * smoothStep((pmax - p) / INSIDE_MARGIN);
  if (!ends) return 0;
  const rx = dx - p * ax, ry = dy - p * ay, rz = dz - p * az;
  const a = rx * u[0] + ry * u[1] + rz * u[2], b = rx * w[0] + ry * w[1] + rz * w[2];
  const fb = Math.max(0, Math.min(PROFILE_BINS - 1, (p - pmin) / (pmax - pmin) * PROFILE_BINS - 0.5));
  const fs = (Math.atan2(b, a) + Math.PI) / (2 * Math.PI) * PROFILE_SECTORS - 0.5;
  const b0 = Math.floor(fb), b1 = Math.min(PROFILE_BINS - 1, b0 + 1), tb = fb - b0;
  const s0 = ((Math.floor(fs) % PROFILE_SECTORS) + PROFILE_SECTORS) % PROFILE_SECTORS, s1 = (s0 + 1) % PROFILE_SECTORS, ts = fs - Math.floor(fs);
  const at = (bin, s) => rmax[bin * PROFILE_SECTORS + s];
  const limit = (1 - tb) * ((1 - ts) * at(b0, s0) + ts * at(b0, s1)) + tb * ((1 - ts) * at(b1, s0) + ts * at(b1, s1));
  return ends * smoothStep((limit - Math.hypot(a, b)) / INSIDE_MARGIN);
}

/**
 * Bind world points (Float32Array x,y,z...) to the field. `index` (triangle
 * indices) lets thin tubes smooth their wall mix along their own edges.
 */
export function bindPoints(ctx, points, { index = null, smooth = false } = {}) {
  const count = points.length / 3, n = ctx.chambers.length;
  ctx.profiles ??= ctx.chambers.map(ch => ch && chamberProfile(ch.rest, ch.frame));
  const wall = bindFollower(ctx.owners, { rest: points, matrix: IDENTITY, index, smooth }, ctx.grid);
  // Field part: inside weight per chamber, mixed by nearness to that chamber.
  const inside = new Float32Array(count);
  const mix = new Float32Array(count * n);
  const terms = new Float32Array(count * n * FIELD_TERMS);
  for (let v = 0; v < count; v++) {
    const x = points[v * 3], y = points[v * 3 + 1], z = points[v * 3 + 2];
    let sum = 0, best = 0;
    for (let c = 0; c < n; c++) {
      const profile = ctx.profiles[c];
      const s = profile ? insideWeight(profile, x, y, z) : 0;
      if (!s) continue;
      const d = wall.distance[v * n + c];
      const m = s / ((Number.isFinite(d) ? d : 0.45) ** 4 + 1e-6);
      mix[v * n + c] = m; sum += m; best = Math.max(best, s);
      fieldTerms(x, y, z, profile.frame, terms, (v * n + c) * FIELD_TERMS, ctx.plane);
    }
    if (sum > 0) for (let c = 0; c < n; c++) mix[v * n + c] /= sum;
    inside[v] = best;
  }
  return { count, n, wall, inside, mix, terms };
}

/** World displacement of bound points for the current heart pose. */
export function displacePoints(ctx, binding, out) {
  const { count, n, wall, inside, mix, terms } = binding;
  out.fill(0);
  if (!ctx.coefficients) return out;
  const disps = ctx.owners.map(o => o.disp);
  const coef = ctx.coefficients, d = new Float64Array(3);
  const { offsets, cOwner, cIndex, cWeight } = wall;
  for (let v = 0; v < count; v++) {
    let wx = 0, wy = 0, wz = 0;
    for (let k = offsets[v], end = offsets[v + 1]; k < end; k++) {
      const d = disps[cOwner[k]], i = cIndex[k], wt = cWeight[k];
      wx += wt * d[i]; wy += wt * d[i + 1]; wz += wt * d[i + 2];
    }
    const f = inside[v];
    let fx = 0, fy = 0, fz = 0;
    if (f > 0) {
      for (let c = 0; c < n; c++) {
        const m = mix[v * n + c];
        if (!m || !coef[c]) continue;
        fieldAt(terms, (v * n + c) * FIELD_TERMS, coef[c], d);
        fx += m * d[0]; fy += m * d[1]; fz += m * d[2];
      }
    }
    out[v * 3] = f * fx + (1 - f) * wx;
    out[v * 3 + 1] = f * fy + (1 - f) * wy;
    out[v * 3 + 2] = f * fz + (1 - f) * wz;
  }
  return out;
}

/** Binomial smoothing of per-ring displacements along a tube (ends held unless closed). */
export function smoothAlong(d, closed, passes) {
  const n = d.length / 3;
  if (n < 3) return d;
  const tmp = new Float32Array(d.length);
  for (let p = 0; p < passes; p++) {
    for (let i = 0; i < n; i++) {
      const a = closed ? (i - 1 + n) % n : Math.max(0, i - 1), b = closed ? (i + 1) % n : Math.min(n - 1, i + 1);
      for (let k = 0; k < 3; k++) tmp[i * 3 + k] = 0.25 * d[a * 3 + k] + 0.5 * d[i * 3 + k] + 0.25 * d[b * 3 + k];
    }
    d.set(tmp);
  }
  return d;
}

const sameMatrix = (a, b) => { for (let i = 0; i < 16; i++) if (Math.abs(a[i] - b[i]) > 1e-9) return false; return true; };

function shownInScene(object) {
  for (let o = object; o; o = o.parent) if (!o.visible) return false;
  return true;
}

/**
 * Keep every visible mesh or line under `roots` on the moving heart.
 * `getContext()` returns `channels.fieldContext()` (or null before the model).
 * `sync()` is cheap when neither the heart pose nor the overlays changed; it
 * rebinds an object when its geometry or transform was rebuilt (lesson
 * progress, advancing leads) and restores it when it is hidden.
 */
export function createOverlayFollow({ getContext, roots }) {
  const restGeometry = new WeakMap(); // geometry -> local rest positions
  const records = new Map(); // object -> binding record
  let lastStamp = -1;
  // Lesson code rebuilds identical tubes (same curve, same progress) on every
  // step or mode entry: bindings are cached by their world points, and
  // prepare() fills the cache at idle time so entering a lesson while the
  // heart beats does not stall.
  const CACHE_LIMIT = 400;
  const cache = new Map();
  function cachedBind(ctx, world, options = {}) {
    let h1 = 0x811c9dc5, h2 = 0;
    for (let i = 0; i < world.length; i++) { const q = Math.round(world[i] * 1e5); h1 = Math.imul(h1 ^ q, 16777619); h2 = (h2 + q * (i % 13 + 1)) | 0; }
    const key = `${world.length}:${h1}:${h2}:${options.index?.length || 0}:${options.smooth ? 1 : 0}`;
    let binding = cache.get(key);
    if (binding) { cache.delete(key); cache.set(key, binding); return binding; }
    binding = bindPoints(ctx, world, options);
    cache.set(key, binding);
    if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
    return binding;
  }

  const localRest = geometry => {
    let rest = restGeometry.get(geometry);
    if (!rest) { rest = new Float32Array(geometry.attributes.position.array); restGeometry.set(geometry, rest); }
    return rest;
  };

  function collect(all = false) {
    const found = [];
    // A geometry shared by several objects cannot take per-vertex writes.
    const uses = new Map();
    for (const root of roots()) root?.traverse(o => { if (o.geometry) uses.set(o.geometry, (uses.get(o.geometry) || 0) + 1); });
    const walk = (object, underRigid) => {
      if (!object.visible && !all) return;
      let rigid = underRigid;
      const pos = object.geometry?.attributes?.position;
      if (!underRigid && pos && !object.isInstancedMesh && !object.isSprite && (object.isMesh || object.isLine)) {
        object.geometry.boundingSphere || object.geometry.computeBoundingSphere();
        const size = object.geometry.boundingSphere.radius * Math.max(object.scale.x, object.scale.y, object.scale.z);
        const small = uses.get(object.geometry) > 1 || size < RIGID_RADIUS || (MARKER_TYPES.has(object.geometry.type) && size < MARKER_RADIUS);
        found.push({ object, rigid: small });
        rigid = small;
      }
      for (const child of object.children) walk(child, rigid);
    };
    for (const root of roots()) if (root && (all || shownInScene(root))) walk(root, false);
    return found;
  }

  function meshWorld(object) {
    const rest = localRest(object.geometry);
    object.updateWorldMatrix(true, false);
    const e = object.matrixWorld.elements;
    const world = new Float32Array(rest.length);
    for (let i = 0; i < rest.length; i += 3) {
      const x = rest[i], y = rest[i + 1], z = rest[i + 2];
      world[i] = e[0] * x + e[4] * y + e[8] * z + e[12]; world[i + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; world[i + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
    }
    return world;
  }

  function bindMesh(ctx, object) {
    const geometry = object.geometry, rest = localRest(geometry);
    object.updateWorldMatrix(true, false);
    const e = object.matrixWorld.elements.slice();
    const inv = object.matrixWorld.clone().invert().elements;
    const world = meshWorld(object), tube = tubeRings(geometry);
    let binding, points = world;
    if (tube) {
      // Ring centres (the duplicated seam vertex left out).
      points = new Float32Array(tube.rings * 3);
      for (let r = 0; r < tube.rings; r++) for (let k = 0; k < tube.size - 1; k++) for (let a = 0; a < 3; a++) points[r * 3 + a] += world[(r * tube.size + k) * 3 + a] / (tube.size - 1);
      binding = cachedBind(ctx, points);
      let length = 0;
      for (let r = 1; r < tube.rings; r++) length += Math.hypot(points[r * 3] - points[r * 3 - 3], points[r * 3 + 1] - points[r * 3 - 2], points[r * 3 + 2] - points[r * 3 - 1]);
      const spacing = Math.max(1e-4, length / Math.max(1, tube.rings - 1));
      // n binomial passes spread over sqrt(n / 2) rings.
      tube.passes = Math.min(TUBE_SMOOTH_MAX_PASSES, Math.round(2 * (TUBE_SMOOTH_LENGTH / spacing) ** 2));
    } else {
      // Other meshes bind per vertex; the wall mix is smoothed along their edges, like the vessels.
      binding = cachedBind(ctx, world, { index: geometry.index?.array, smooth: !!geometry.index });
    }
    if (!geometry.userData.followPadded) {
      geometry.computeBoundingSphere();
      geometry.boundingSphere.radius += 0.2;
      geometry.userData.followPadded = true;
    }
    return { kind: 'mesh', geometry, rest, matrix: e, inv, binding, ringSize: tube ? tube.size : 1, closed: !!geometry.parameters?.closed, tube: !!tube, passes: tube?.passes || 0, disp: new Float32Array(points.length) };
  }

  // Object centre (bounding-sphere centre) in world space, from its rest position.
  function rigidWorld(object, restPos) {
    object.parent?.updateWorldMatrix(true, false);
    const parent = object.parent?.matrixWorld.elements || IDENTITY;
    const c = object.geometry.boundingSphere.center, e = object.matrix.elements;
    const lx = e[0] * c.x + e[4] * c.y + e[8] * c.z + restPos.x, ly = e[1] * c.x + e[5] * c.y + e[9] * c.z + restPos.y, lz = e[2] * c.x + e[6] * c.y + e[10] * c.z + restPos.z;
    return new Float32Array([parent[0] * lx + parent[4] * ly + parent[8] * lz + parent[12], parent[1] * lx + parent[5] * ly + parent[9] * lz + parent[13], parent[2] * lx + parent[6] * ly + parent[10] * lz + parent[14]]);
  }

  function bindRigid(ctx, object) {
    const restPos = object.position.clone();
    const world = rigidWorld(object, restPos);
    const parent = object.parent?.matrixWorld.elements || IDENTITY;
    const inv = object.parent ? object.parent.matrixWorld.clone().invert().elements : IDENTITY;
    return { kind: 'rigid', restPos, written: restPos.clone(), parentMatrix: parent.slice(), inv, binding: cachedBind(ctx, world), disp: new Float32Array(3) };
  }

  /**
   * Bind every overlay (shown or not) ahead of use, within `budgetMs`.
   * Returns true when done; call again (next idle slice) until it is.
   */
  let pending = null;
  function prepare(ctx, budgetMs = 12) {
    if (!ctx) return true;
    pending ??= collect(true);
    const start = performance.now();
    while (pending.length && performance.now() - start < budgetMs) {
      const { object, rigid } = pending.pop();
      if (records.has(object)) continue;
      if (rigid) cachedBind(ctx, rigidWorld(object, object.position));
      else bindMesh(ctx, object);
    }
    return pending.length === 0;
  }

  function stale(record, object, rigid) {
    if (!record || (record.kind === 'rigid') !== rigid) return true;
    if (record.kind === 'mesh') {
      if (record.geometry !== object.geometry) return true;
      object.updateWorldMatrix(true, false);
      return !sameMatrix(record.matrix, object.matrixWorld.elements);
    }
    // Someone else moved the object (lesson code): take that as the new rest.
    if (!object.position.equals(record.written)) return true;
    object.parent?.updateWorldMatrix(true, false);
    return !sameMatrix(record.parentMatrix, object.parent?.matrixWorld.elements || IDENTITY);
  }

  function write(ctx, object, record) {
    displacePoints(ctx, record.binding, record.disp);
    const d = record.disp, m = record.inv;
    if (record.kind === 'rigid') {
      const p = record.restPos;
      object.position.set(p.x + m[0] * d[0] + m[4] * d[1] + m[8] * d[2], p.y + m[1] * d[0] + m[5] * d[1] + m[9] * d[2], p.z + m[2] * d[0] + m[6] * d[1] + m[10] * d[2]);
      record.written.copy(object.position);
      return;
    }
    if (record.tube) smoothAlong(d, record.closed, record.passes);
    const attr = object.geometry.attributes.position, out = attr.array, rest = record.rest, ring = record.ringSize;
    for (let i = 0, v = 0; i < rest.length; i += 3, v++) {
      const j = Math.floor(v / ring) * 3; // this vertex's point (its ring centre for tubes)
      out[i] = rest[i] + m[0] * d[j] + m[4] * d[j + 1] + m[8] * d[j + 2];
      out[i + 1] = rest[i + 1] + m[1] * d[j] + m[5] * d[j + 1] + m[9] * d[j + 2];
      out[i + 2] = rest[i + 2] + m[2] * d[j] + m[6] * d[j + 1] + m[10] * d[j + 2];
    }
    attr.needsUpdate = true;
  }

  function restore(object, record) {
    if (record.kind === 'rigid') { if (object.position.equals(record.written)) object.position.copy(record.restPos); return; }
    // Also a geometry the lesson code has since replaced: it may be reused.
    const attr = record.geometry.attributes.position;
    if (attr.array.length === record.rest.length) { attr.array.set(record.rest); attr.needsUpdate = true; }
  }

  /** Bring visible overlays to the current heart pose. Returns true if anything was written. */
  function sync() {
    const ctx = getContext();
    if (!ctx) { if (records.size) reset(); return false; }
    const poseChanged = ctx.stamp !== lastStamp;
    lastStamp = ctx.stamp;
    const seen = new Set();
    let wrote = false;
    for (const { object, rigid } of collect()) {
      seen.add(object);
      let record = records.get(object);
      if (stale(record, object, rigid)) {
        if (record) restore(object, record);
        record = rigid ? bindRigid(ctx, object) : bindMesh(ctx, object);
        records.set(object, record);
      } else if (!poseChanged) continue;
      write(ctx, object, record);
      wrote = true;
    }
    // Hidden overlays go back to rest and are rebound when shown again.
    for (const [object, record] of records) if (!seen.has(object)) { restore(object, record); records.delete(object); }
    return wrote;
  }

  function reset() {
    for (const [object, record] of records) restore(object, record);
    records.clear();
    lastStamp = -1;
  }

  /** A point field for other modules (flow particles): bind once, displace per frame. */
  const points = {
    bind: worldPoints => { const ctx = getContext(); return ctx ? bindPoints(ctx, worldPoints) : null; },
    displace: (binding, out) => { const ctx = getContext(); if (!ctx || !binding) return out.fill(0); return displacePoints(ctx, binding, out); },
    stamp: () => getContext()?.stamp ?? -1,
  };

  return { sync, reset, prepare, points, recordCount: () => records.size };
}

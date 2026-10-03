/**
 * Cardia Animation Channels Controller
 * Deterministic, channel-based anatomical motion synchronized with CardiacCycle:
 * chambers deform by their fields (chamber-field.js), attached structures
 * follow the walls (surface-followers.js), leaflets open (valve-motion.js).
 * This module keeps the per-heart state and re-exports the pieces.
 */
import { computeChannelWeights } from './cycle-channels.js';
import { clamp01s, rememberRest, CHAMBER_LAW, frameFromMotion, measureChamberFrame, writeWithFrame, SEAM_BAND, seamWeight, baseDescent, fieldCoefficients, fieldTerms, fieldAt, FIELD_TERMS, measureAvPlane } from './chamber-field.js';
import { OWNER_IDS, FOLLOWER_OWNERS, isSurfaceFollower, bindFollower, buildOwnerGrid, writeFollower, inverseLinear, ownerDisplacement } from './surface-followers.js';
import { createValveMotion } from './valve-motion.js';

export * from './cycle-channels.js';
export * from './chamber-field.js';
export * from './surface-followers.js';
export { semilunarOffset, smallestAxis, avLeafletWeight, avLeafletOffset } from './valve-motion.js';

export function createAnimationChannels({ meshMap, sourceCenter = null }) {
  const valves = createValveMotion(meshMap);
  let followers = null;
  let lastWeights = {};
  let deformed = false;
  let lastCoefficients = null;
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
        const index = chamberSetup().indexOf(ownerChamber);
        follower.field = { frame: ownerChamber.frame, plane: avPlane, coefficients: () => lastCoefficients?.[index] || fieldCoefficients(ownerChamber.frame, ownerChamber.law, 0) };
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
  let chambers = null, avPlane = null;
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
    // The AV plane shared by all chambers, from the measured primary frames.
    const primaries = OWNER_IDS.map(id => chambers.find(ch => ch.id === id)).filter(Boolean);
    const ventricles = primaries.filter(ch => ch.law.ventricle).map(ch => ch.frame), atria = primaries.filter(ch => !ch.law.ventricle).map(ch => ch.frame);
    avPlane = ventricles.length ? measureAvPlane(ventricles, atria) : null;
    // Per-vertex frame terms are constant: cache them (packed FIELD_TERMS per
    // vertex) for the own frame and, where blended, the seam neighbour's frame.
    for (const ch of chambers) {
      const n = ch.rest.length / 3;
      ch.own = new Float32Array(n * FIELD_TERMS);
      ch.neighbourTerms = new Float32Array(n * FIELD_TERMS);
      for (let v = 0; v < n; v++) {
        const i = v * 3;
        fieldTerms(ch.rest[i], ch.rest[i + 1], ch.rest[i + 2], ch.frame, ch.own, v * FIELD_TERMS, avPlane);
        const o = ch.seamOther[v];
        if (o >= 0 && ch.seamWeight[v] > 0) fieldTerms(ch.rest[i], ch.rest[i + 1], ch.rest[i + 2], chambers[o].frame, ch.neighbourTerms, v * FIELD_TERMS, avPlane);
      }
    }
    return chambers;
  }

  // Per-frame coefficients of every chamber mesh. The AV plane (fibrous
  // skeleton) descends as one: the mean of the two ventricles' descents,
  // shared by all four chambers, so the septa and the AV junction stay
  // together at the base.
  function chamberCoefficients(weights) {
    const list = chamberSetup();
    const descents = ['lv', 'rv'].map(id => list.find(ch => ch.id === id)).filter(Boolean).map(v => baseDescent(v.frame, v.law, weights[v.law.shape] || 0));
    const shared = descents.length ? [0, 1, 2].map(i => descents.reduce((sum, d) => sum + d[i], 0) / descents.length) : null;
    return list.map(ch => fieldCoefficients(ch.frame, ch.law, weights[ch.law.shape] || 0, shared));
  }

  // Deform every chamber from its rest pose by its own field, blended with
  // the neighbour's field near a shared wall; rotate normals with torsion.
  function deformChambers(coefs) {
    const list = chamberSetup();
    const self = new Float64Array(3), other = new Float64Array(3);
    list.forEach((ch, c) => {
      const { rest, attr, own, neighbourTerms, seamOther, seamWeight } = ch;
      const out = attr.array, co = coefs[c];
      for (let v = 0, i = 0; i < rest.length; v++, i += 3) {
        fieldAt(own, v * FIELD_TERMS, co, self);
        const b = seamWeight[v];
        if (b > 0) {
          fieldAt(neighbourTerms, v * FIELD_TERMS, coefs[seamOther[v]], other);
          self[0] += (other[0] - self[0]) * b; self[1] += (other[1] - self[1]) * b; self[2] += (other[2] - self[2]) * b;
        }
        out[i] = rest[i] + self[0]; out[i + 1] = rest[i + 1] + self[1]; out[i + 2] = rest[i + 2] + self[2];
      }
      attr.needsUpdate = true;
      if (ch.law.torsion && ch.restNormal) rotateNormals(ch, co.s);
    });
  }

  // Normals follow the twist: rotate each rest normal about the long axis by
  // the vertex's torsion angle (the squeeze tilt is small and ignored).
  function rotateNormals(ch, shape) {
    const { restNormal, normal, frame, law, own } = ch;
    const [ax, ay, az] = frame.axis;
    const out = normal.array;
    for (let v = 0, i = 0; i < restNormal.length; v++, i += 3) {
      const t = own[v * FIELD_TERMS + 3], th = law.torsion * shape * t * t;
      const nx = restNormal[i], ny = restNormal[i + 1], nz = restNormal[i + 2];
      if (!th) { out[i] = nx; out[i + 1] = ny; out[i + 2] = nz; continue; }
      const c = 1 - th * th / 2, sn = th * (1 - th * th / 6), dot = nx * ax + ny * ay + nz * az;
      out[i] = nx * c + (ay * nz - az * ny) * sn + ax * dot * (1 - c);
      out[i + 1] = ny * c + (az * nx - ax * nz) * sn + ay * dot * (1 - c);
      out[i + 2] = nz * c + (ax * ny - ay * nx) * sn + az * dot * (1 - c);
    }
    normal.needsUpdate = true;
  }

  // Leaflets open in their annulus or root frame (valve-motion.js), then are
  // carried with the heart at their opened position. AV leaflets take their
  // ventricle's field, so hinges stay on the moving annulus and chordal tips
  // on the papillary heads (which ride the same field). Semilunar cusps take
  // the motion of their own root wall (bound once, like a follower).
  const AV_LEAFLET_OWNER = { mitral: 'lv', tricuspid: 'rv' };
  const CUSP_ROOT = { lcc: 'aorta', rcc: 'aorta', ncc: 'aorta', 'pulmonary-valve': 'pa' };
  let cuspBindings = null;
  function carryLeaflets(coefs) {
    const list = chamberSetup();
    const terms = new Float32Array(FIELD_TERMS), d = new Float64Array(3);
    for (const [id, ownerId] of Object.entries(AV_LEAFLET_OWNER)) {
      const c = list.findIndex(ch => ch.id === ownerId);
      if (c < 0) continue;
      const { frame } = list[c], co = coefs[c];
      for (const mesh of meshMap.get(id) || []) {
        const attr = mesh.geometry?.attributes?.position;
        if (!attr || !mesh.userData.restPosition) continue;
        const out = attr.array;
        for (let i = 0; i < out.length; i += 3) {
          fieldAt(fieldTerms(out[i], out[i + 1], out[i + 2], frame, terms, 0, avPlane), 0, co, d);
          out[i] += d[0]; out[i + 1] += d[1]; out[i + 2] += d[2];
        }
        attr.needsUpdate = true;
      }
    }
    cuspBindings ??= bindCusps();
    for (const { mesh, binding, roots } of cuspBindings) {
      const out = mesh.geometry.attributes.position.array;
      const { offsets, cOwner, cIndex, cWeight, active } = binding;
      for (const root of roots) if (root.dispStamp !== lastStamp) ownerDisplacement(root, lastStamp);
      for (let a = 0; a < active.length; a++) {
        const v = active[a], o = v * 3;
        for (let k = offsets[v], end = offsets[v + 1]; k < end; k++) {
          const disp = roots[cOwner[k]].disp, i = cIndex[k], w = cWeight[k];
          out[o] += w * disp[i]; out[o + 1] += w * disp[i + 1]; out[o + 2] += w * disp[i + 2];
        }
      }
      mesh.geometry.attributes.position.needsUpdate = true;
    }
  }
  let lastStamp = 0;
  function bindCusps() {
    const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const result = [];
    for (const [id, rootId] of Object.entries(CUSP_ROOT)) {
      const roots = (meshMap.get(rootId) || []).filter(m => rememberRest(m) && isIdentity(m.matrixWorld.elements)).map(m => ({ mesh: m, rest: m.userData.restPosition, current: m.geometry.attributes.position.array, matrix: IDENTITY }));
      if (!roots.length) continue;
      for (const mesh of meshMap.get(id) || []) {
        if (!rememberRest(mesh) || !isIdentity(mesh.matrixWorld.elements)) continue;
        const binding = bindFollower(roots, { rest: mesh.userData.restPosition, matrix: IDENTITY, fullAttach: true });
        result.push({ mesh, binding, roots });
      }
    }
    return result;
  }

  /**
   * Chamber volume and leaflet pose share computeChannelWeights with the ECG.
   */
  function applyChannels(cycleState) {
    if (!cycleState || cycleState.reducedMotion) {
      reset();
      return;
    }
    const weights = computeChannelWeights(cycleState.phase, { rhythm: cycleState.rhythm, atrialPhase: cycleState.atrialPhase });
    lastWeights = weights;
    deformed = true;
    const coefs = chamberCoefficients(weights);
    lastCoefficients = coefs;
    deformChambers(coefs);
    // The LAA marker rides the LA field (it has no wall of its own here).
    const la = chamberSetup().findIndex(ch => ch.id === 'la');
    if (la >= 0) for (const marker of meshMap.get('laa') || []) writeWithFrame(marker, chamberSetup()[la].frame, coefs[la], avPlane);
    applyFollowers();
    valves.apply(weights);
    lastStamp += 1;
    carryLeaflets(coefs);
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
    lastWeights = {};
    lastCoefficients = null;
    deformed = false;
    // Owner displacements are now zero: invalidate this frame's cache.
    if (followers) followers.owners.stamp = (followers.owners.stamp || 0) + 1;
  }

  // The deformation field for objects outside meshMap (lesson overlays,
  // devices, flow): owners with this frame's world displacement, the reusable
  // owner grid, each owner's chamber frame and law, and the shape weights
  // (null at rest). `stamp` changes whenever the heart pose changes.
  let fieldBase = null;
  function fieldContext() {
    const setup = followerSetup();
    const owners = setup.owners;
    if (!owners.length) return null;
    if (!fieldBase) {
      const primary = new Map();
      for (const ch of chamberSetup()) if (!primary.has(ch.mesh)) primary.set(ch.mesh, ch);
      const all = chamberSetup();
      fieldBase = { owners, grid: buildOwnerGrid(owners), chambers: owners.map(o => primary.get(o.mesh)).map(ch => ch && { id: ch.id, rest: ch.rest, frame: ch.frame, law: ch.law, index: all.indexOf(ch) }) };
    }
    owners.stamp ??= 0;
    for (const o of owners) if (!o.disp || o.dispStamp !== owners.stamp) ownerDisplacement(o, owners.stamp);
    const coefficients = deformed && lastCoefficients ? fieldBase.chambers.map(ch => ch && lastCoefficients[ch.index]) : null;
    return { ...fieldBase, plane: avPlane, weights: deformed ? lastWeights : null, coefficients, stamp: owners.stamp };
  }

  return {
    applyChannels,
    computeChannelWeights,
    reset,
    // Bind the surface followers ahead of the first beat (idle time).
    prepare: () => { chamberSetup(); followerSetup(); },
    followerCount: () => followerSetup().length,
    fieldContext,
    isDeformed: () => deformed
  };
}

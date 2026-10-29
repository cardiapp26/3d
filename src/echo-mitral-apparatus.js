import * as THREE from 'three';

/*
 * Mitral subvalvular apparatus for the echo module. The atlas has the leaflets
 * and the annulus ring, but its single LV papillary mesh runs along the lateral
 * wall to the apex and the atlas has no chordae tendineae. So the echo section
 * uses two schematic papillary muscles: each arises from the LV endocardium at
 * the junction of the middle and apical thirds, the anterolateral one at the
 * lateral wall (inferolateral-anterolateral junction) and the posteromedial one on
 * the inferior wall near the inferoseptal junction (PSAX about 3-4 and 7-8
 * o'clock), and tapers toward the annulus. Their base
 * follows an LV vertex, so they move with the beat. The leaflet free edge is
 * found per angular bin around the annulus (within the leaflet body depth) and
 * tied to the head on its side by chordae: a triangle fan per head (cut by the
 * imaging plane it gives the chordal line) and line strands for the 3D view.
 */

const BINS = 28;                 // angular bins of the free edge around the annulus
const BODY_MAX = 0.65;           // leaflet body depth, annulus radii (deeper atlas vertices are chordae stubs)
const HEAD_LEVEL = 0.72;         // papillary base: fraction of the annulus-to-apex depth (toward the apical third)
const TIP_LEVEL = 0.38;          // papillary tip depth, same fraction
const TIP_INSET = 0.55;          // tip radial position, fraction of the base radius from the LV axis
const SECTOR = (14 * Math.PI) / 180;
const AL_OFFSET = (15 * Math.PI) / 180;   // from the lateral wall toward anterior (PSAX about 3-4 o'clock)
const PM_OFFSET = (110 * Math.PI) / 180;  // from the lateral wall toward inferior (PSAX about 7-8 o'clock)
const BASE_R = 0.15, TIP_R = 0.07;        // muscle radii in atlas units (about 5.5 and 2.6 mm)
const RINGS = 6, SIDES = 12;

export const APPARATUS_PARTS = Object.freeze({
  al: { tr: 'Anterolateral papiller kas (ALPM)', en: 'Anterolateral papillary muscle (ALPM)', abbr: 'ALPM', color: '#f4cccc', key: 'pm-al' },
  pm: { tr: 'Posteromedial papiller kas (PMPM)', en: 'Posteromedial papillary muscle (PMPM)', abbr: 'PMPM', color: '#ea9999', key: 'pm-pm' }
});
export const CHORDAE_PARTS = Object.freeze({
  al: { tr: 'Korda tendinea (ALPM)', en: 'Chordae tendineae (ALPM)', abbr: 'CT-AL', color: '#fff7e0', key: 'ct-al' },
  pm: { tr: 'Korda tendinea (PMPM)', en: 'Chordae tendineae (PMPM)', abbr: 'CT-PM', color: '#fff7e0', key: 'ct-pm' }
});

const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const worldOf = (mesh, i, out = new THREE.Vector3()) => out.fromBufferAttribute(mesh.geometry.attributes.position, i).applyMatrix4(mesh.matrixWorld);
const local = (frame, p) => {
  const v = p.clone().sub(frame.center);
  return { x: v.dot(frame.u), y: v.dot(frame.w), d: v.dot(frame.normal) };
};
const angleOf = (frame, p) => { const q = local(frame, p); return Math.atan2(q.y, q.x); };

function vertices(meshes) {
  const out = [];
  for (const mesh of meshes) {
    mesh.updateWorldMatrix(true, false);
    const count = mesh.geometry.attributes.position.count;
    for (let i = 0; i < count; i++) out.push({ mesh, i, p: worldOf(mesh, i) });
  }
  return out;
}

/** Endocardial LV vertex at a depth and angle (the one nearest the LV axis in that patch). */
function wallPoint(lvVerts, frame, depth, angle, tolerance) {
  let best = null;
  for (const v of lvVerts) {
    const q = local(frame, v.p);
    if (Math.abs(q.d - depth) > tolerance || Math.abs(wrap(Math.atan2(q.y, q.x) - angle)) > SECTOR) continue;
    const r = Math.hypot(q.x, q.y);
    if (!best || r < best.r) best = { ...v, r };
  }
  return best;
}

/**
 * Rest-pose measurement, or null when a part cannot be placed.
 * @param {{ leaflets: THREE.Mesh[], lv: THREE.Mesh[], frame: object, septum: THREE.Vector3 }} deps
 *   frame: mitral annulus frame (center, u, w, normal toward the LV, radius); septum: a point on the RV side.
 */
export function measureMitralApparatus({ leaflets, lv, frame, septum }) {
  if (!leaflets.length || !lv.length || !frame) return null;
  const lvVerts = vertices(lv);
  const apexDepth = Math.max(...lvVerts.map(v => local(frame, v.p).d));
  if (!(apexDepth > frame.radius)) return null;
  // Lateral wall: opposite the septum; anterior: the world anterior (+z) in the annulus plane.
  const lateral = angleOf(frame, septum) + Math.PI;
  const ant = new THREE.Vector3(0, 0, 1);
  const antAngle = Math.atan2(ant.dot(frame.w), ant.dot(frame.u));
  const toward = Math.sign(wrap(antAngle - lateral)) || 1;
  const heads = {};
  for (const [id, angle] of [['al', lateral + toward * AL_OFFSET], ['pm', lateral - toward * PM_OFFSET]]) {
    const base = wallPoint(lvVerts, frame, apexDepth * HEAD_LEVEL, wrap(angle), apexDepth * 0.06);
    if (!base) return null;
    const q = local(frame, base.p);
    const tipR = Math.hypot(q.x, q.y) * TIP_INSET;
    const a = Math.atan2(q.y, q.x);
    const tip = frame.center.clone()
      .addScaledVector(frame.u, Math.cos(a) * tipR)
      .addScaledVector(frame.w, Math.sin(a) * tipR)
      .addScaledVector(frame.normal, apexDepth * TIP_LEVEL);
    heads[id] = { angle: a, base: { mesh: base.mesh, i: base.i }, offset: tip.sub(base.p) };
  }
  // Leaflet free edge: deepest body vertex per angular bin.
  const best = new Array(BINS).fill(null);
  for (const v of vertices(leaflets)) {
    const q = local(frame, v.p);
    const depth = q.d / frame.radius;
    if (depth > BODY_MAX || depth < 0) continue;
    const a = Math.atan2(q.y, q.x);
    const bin = Math.min(BINS - 1, Math.floor(((a + Math.PI) / (2 * Math.PI)) * BINS));
    if (!best[bin] || depth > best[bin].depth) best[bin] = { mesh: v.mesh, i: v.i, depth, angle: a };
  }
  const edge = best.filter(Boolean);
  if (edge.length < 6) return null;
  // Each edge point is tied to the head on its side, ordered around that head.
  const fans = {};
  for (const id of ['al', 'pm']) {
    const head = heads[id], other = heads[id === 'al' ? 'pm' : 'al'];
    const own = edge.filter(e => Math.abs(wrap(e.angle - head.angle)) <= Math.abs(wrap(e.angle - other.angle)));
    own.sort((a, b) => wrap(a.angle - head.angle) - wrap(b.angle - head.angle));
    // No chordal sheet across an empty stretch of the edge (more than two bins apart).
    const joined = own.map((e, k) => k + 1 < own.length && Math.abs(wrap(own[k + 1].angle - e.angle)) <= (2.5 * 2 * Math.PI) / BINS);
    fans[id] = { edge: own.map(({ mesh, i }) => ({ mesh, i })), joined };
  }
  return { heads, fans };
}

/** Tapered muscle from base to tip, written into `positions` at vertex `start`. */
function writeMuscle(positions, start, base, tip) {
  const axis = tip.clone().sub(base);
  const len = axis.length() || 1;
  axis.divideScalar(len);
  const n1 = new THREE.Vector3(1, 0, 0);
  if (Math.abs(n1.dot(axis)) > 0.9) n1.set(0, 1, 0);
  n1.sub(axis.clone().multiplyScalar(n1.dot(axis))).normalize();
  const n2 = new THREE.Vector3().crossVectors(axis, n1);
  let k = start;
  const put = v => { positions[3 * k] = v.x; positions[3 * k + 1] = v.y; positions[3 * k + 2] = v.z; k++; };
  for (let r = 0; r < RINGS; r++) {
    const t = r / (RINGS - 1);
    const radius = BASE_R + (TIP_R - BASE_R) * t + 0.03 * Math.sin(Math.PI * t);   // slight belly
    const c = base.clone().addScaledVector(axis, len * t);
    for (let s = 0; s < SIDES; s++) {
      const a = (s / SIDES) * Math.PI * 2;
      put(c.clone().addScaledVector(n1, Math.cos(a) * radius).addScaledVector(n2, Math.sin(a) * radius));
    }
  }
  put(tip.clone().addScaledVector(axis, TIP_R));   // rounded tip
  put(base.clone().addScaledVector(axis, -0.02));  // base cap, just inside the wall
}

const MUSCLE_VERTS = RINGS * SIDES + 2;

function muscleIndex(start) {
  const idx = [];
  for (let r = 0; r + 1 < RINGS; r++) {
    for (let s = 0; s < SIDES; s++) {
      const a = start + r * SIDES + s, b = start + r * SIDES + ((s + 1) % SIDES);
      idx.push(a, b, a + SIDES, b, b + SIDES, a + SIDES);
    }
  }
  const tip = start + RINGS * SIDES, cap = tip + 1, last = start + (RINGS - 1) * SIDES;
  for (let s = 0; s < SIDES; s++) {
    idx.push(last + s, last + ((s + 1) % SIDES), tip);
    idx.push(start + ((s + 1) % SIDES), start + s, cap);
  }
  return idx;
}

/**
 * Live apparatus: echo section items (papillary muscles with AL/PM parts as
 * 'lv-papillary', chordae fans as 'mitral-chordae') and 3D objects. Call
 * update() before every section and render.
 */
export function createMitralApparatus(apparatus) {
  const ids = ['al', 'pm'];
  const identity = new THREE.Matrix4().elements;
  const tmp = new THREE.Vector3();
  // Papillary muscles.
  const pmPositions = new Float32Array(MUSCLE_VERTS * 2 * 3);
  const pmByVertex = new Int16Array(MUSCLE_VERTS * 2);
  const pmIndex = [];
  ids.forEach((_, k) => { pmByVertex.fill(k, k * MUSCLE_VERTS, (k + 1) * MUSCLE_VERTS); pmIndex.push(...muscleIndex(k * MUSCLE_VERTS)); });
  const pmGeometry = new THREE.BufferGeometry();
  pmGeometry.setAttribute('position', new THREE.BufferAttribute(pmPositions, 3));
  pmGeometry.setIndex(pmIndex);
  const muscles = new THREE.Mesh(pmGeometry, new THREE.MeshStandardMaterial({ color: 0xd98f8f, roughness: 0.7 }));
  muscles.name = 'LV papillary muscles (schematic)';
  muscles.frustumCulled = false;
  muscles.userData.parts = { names: [APPARATUS_PARTS.al, APPARATUS_PARTS.pm], byVertex: pmByVertex };
  // Chordae: per head, the tip then its edge points.
  const fans = ids.map(id => apparatus.fans[id]);
  const chordCount = fans.reduce((n, f) => n + 1 + f.edge.length, 0);
  const ctPositions = new Float32Array(chordCount * 3);
  const ctByVertex = new Int16Array(chordCount);
  const fanIndex = [], lineIndex = [];
  let base = 0;
  fans.forEach((f, k) => {
    ctByVertex.fill(k, base, base + 1 + f.edge.length);
    for (let e = 0; e + 1 < f.edge.length; e++) if (f.joined[e]) fanIndex.push(base, base + 1 + e, base + 2 + e);
    for (let e = 0; e < f.edge.length; e++) lineIndex.push(base, base + 1 + e);
    base += 1 + f.edge.length;
  });
  const fanGeometry = new THREE.BufferGeometry();
  fanGeometry.setAttribute('position', new THREE.BufferAttribute(ctPositions, 3));
  fanGeometry.setIndex(fanIndex);
  const fanMesh = new THREE.Mesh(fanGeometry, new THREE.MeshBasicMaterial({ visible: false }));
  fanMesh.userData.parts = { names: [CHORDAE_PARTS.al, CHORDAE_PARTS.pm], byVertex: ctByVertex };
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(ctPositions, 3));
  lineGeometry.setIndex(lineIndex);
  const strands = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ color: 0xfff3d6 }));
  strands.name = 'Mitral chordae tendineae (schematic)';
  strands.frustumCulled = false;
  const group = new THREE.Group();
  group.name = 'Mitral subvalvular apparatus (schematic)';
  group.add(muscles, strands);

  const tips = ids.map(() => new THREE.Vector3());
  function update() {
    ids.forEach((id, k) => {
      const head = apparatus.heads[id];
      head.base.mesh.updateWorldMatrix(true, false);
      const b = worldOf(head.base.mesh, head.base.i, new THREE.Vector3());
      tips[k].copy(b).add(head.offset);
      writeMuscle(pmPositions, k * MUSCLE_VERTS, b, tips[k]);
    });
    let slot = 0;
    const put = v => { ctPositions[3 * slot] = v.x; ctPositions[3 * slot + 1] = v.y; ctPositions[3 * slot + 2] = v.z; slot++; };
    fans.forEach((f, k) => {
      put(tips[k]);
      for (const ref of f.edge) { ref.mesh.updateWorldMatrix(true, false); put(worldOf(ref.mesh, ref.i, tmp)); }
    });
    for (const g of [pmGeometry, fanGeometry, lineGeometry]) g.attributes.position.needsUpdate = true;
    pmGeometry.computeVertexNormals();
  }
  update();
  const items = [
    { id: 'lv-papillary', mesh: muscles, positions: pmPositions, index: pmGeometry.index.array, matrix: identity, key: pmGeometry },
    { id: 'mitral-chordae', mesh: fanMesh, positions: ctPositions, index: fanGeometry.index.array, matrix: identity, key: fanGeometry }
  ];
  return {
    items,
    group,
    update,
    dispose() {
      for (const g of [pmGeometry, fanGeometry, lineGeometry]) g.dispose();
      for (const m of [muscles.material, fanMesh.material, strands.material]) m.dispose();
    }
  };
}

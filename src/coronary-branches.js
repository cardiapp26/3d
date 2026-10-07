import * as THREE from 'three';

/*
 * Named side branches of the atlas coronary arteries. Each atlas artery mesh
 * is a set of tubes (12 vertices per ring); a branch is one connected tube
 * whose end meets its parent. The trunk is the longest tube; takeoffs are
 * measured along it from the ostium. Names follow the takeoff order:
 * - LAD: diagonals (toward the LV) D1, D2...; branches toward the RV are
 *   right ventricular branches. The septal mesh gives S1, S2...
 * - LCX: obtuse marginals OM1, OM2...
 * - RCA: conus branch (first, proximal third), acute marginal (the branch
 *   running lowest, along the acute margin) and right ventricular branches.
 * A branch of a branch is named after its parent. Geometry: local (baked)
 * coordinates of the atlas meshes, which share one frame.
 */
const RING = 12;
const WELD = 1000;              // vertex weld precision (1/1000 unit)
const MAX_PARENT_GAP = 0.35;    // a tube end farther than this from every other tube is a root
const CONUS_FRACTION = 0.3;     // the conus branch leaves in the proximal third of the RCA
// Proximal branch placement, as fractions of the trunk length. The atlas
// branches leave late (D1 at 43% of the LAD, OM1 at 52% of the LCX). The
// proximal LAD runs from its origin to D1 / S1 and the proximal LCX to OM1
// (SCCT/AHA segments); in 100 cadaver hearts S1 left between 26 mm proximal
// and 12 mm distal to D1 (Muresian). Teaching placement, not measurements.
const LAD_D1_FRACTION = 0.25;
const LCX_OM1_FRACTION = 0.33;
const S1_BEFORE_D1 = 0.04;      // S1 just proximal to D1
const SEPTAL_END_FRACTION = 0.6; // last septal by the mid LAD

const v3 = (pos, i) => new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));

/** Connected tubes of a mesh: vertex lists (sorted by first index) with their ring centres. */
export function tubeComponents(geometry) {
  const pos = geometry.attributes.position, n = pos.count;
  const weld = new Map(), wid = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    const key = `${Math.round(pos.getX(i) * WELD)},${Math.round(pos.getY(i) * WELD)},${Math.round(pos.getZ(i) * WELD)}`;
    if (!weld.has(key)) weld.set(key, weld.size);
    wid[i] = weld.get(key);
  }
  const parent = Int32Array.from({ length: weld.size }, (_, i) => i);
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const index = geometry.index ? geometry.index.array : Array.from({ length: n }, (_, i) => i);
  for (let t = 0; t < index.length; t += 3) {
    const a = find(wid[index[t]]);
    parent[find(wid[index[t + 1]])] = a;
    parent[find(wid[index[t + 2]])] = a;
  }
  const groups = new Map();
  for (let i = 0; i < n; i++) {
    const root = find(wid[i]);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(i);
  }
  return [...groups.values()].sort((a, b) => a[0] - b[0]).map((vertices) => {
    const rings = [];
    for (let i = 0; i + RING <= vertices.length; i += RING) {
      const c = new THREE.Vector3();
      for (let k = 0; k < RING; k++) c.add(v3(pos, vertices[i + k]));
      rings.push(c.divideScalar(RING));
    }
    return { vertices, rings, length: pathLength(rings) };
  });
}

function pathLength(points) {
  let s = 0;
  for (let i = 1; i < points.length; i++) s += points[i].distanceTo(points[i - 1]);
  return s;
}

/** Nearest ring of `rings` to `point`: { index, distance }. */
function nearestRing(rings, point) {
  let best = { index: -1, distance: Infinity };
  rings.forEach((r, index) => { const d = r.distanceTo(point); if (d < best.distance) best = { index, distance: d }; });
  return best;
}

/**
 * Tree of one artery mesh: the trunk (longest tube, oriented from the end
 * nearest `ostium`) and, for every other tube, its parent tube, the parent
 * ring it leaves from, its takeoff point and its far tip.
 */
export function arteryTree(components, ostium) {
  const trunkIndex = components.reduce((best, c, i) => (c.length > components[best].length ? i : best), 0);
  const trunk = components[trunkIndex];
  if (trunk.rings[0].distanceTo(ostium) > trunk.rings.at(-1).distanceTo(ostium)) trunk.rings.reverse();
  const arc = [0];
  for (let i = 1; i < trunk.rings.length; i++) arc.push(arc[i - 1] + trunk.rings[i].distanceTo(trunk.rings[i - 1]));
  const nodes = components.map((c, i) => ({ index: i, component: c, parent: null, takeoff: null, tip: null, arc: null }));
  nodes.forEach((node, i) => {
    if (i === trunkIndex) return;
    const ends = [node.component.rings[0], node.component.rings.at(-1)];
    let best = null;
    components.forEach((other, j) => {
      if (j === i) return;
      ends.forEach((end, e) => {
        const near = nearestRing(other.rings, end);
        if (!best || near.distance < best.distance) best = { parent: j, ring: near.index, distance: near.distance, end: e };
      });
    });
    if (!best || best.distance > MAX_PARENT_GAP) return;
    node.parent = best.parent;
    node.takeoff = ends[best.end];
    node.tip = ends[1 - best.end];
    node.parentRing = best.ring;
  });
  // Takeoff along the trunk: a branch's own ring on the trunk, or its ancestor's.
  const trunkArc = (node) => {
    let n = node;
    while (n.parent !== null && n.parent !== trunkIndex) n = nodes[n.parent];
    return n.parent === trunkIndex ? arc[n.parentRing] : null;
  };
  nodes.forEach((node) => { node.arc = node.index === trunkIndex ? 0 : trunkArc(node); });
  return { trunkIndex, trunk, arc, nodes };
}

/** Takeoff of a tube from another mesh (septal perforators): trunk arc at its end nearer the trunk. */
export function takeoffOnTrunk(tree, component) {
  const near = [component.rings[0], component.rings.at(-1)].map((e) => nearestRing(tree.trunk.rings, e));
  return tree.arc[(near[0].distance < near[1].distance ? near[0] : near[1]).index];
}

/** Point on the trunk centreline at arc length `s`. */
export function trunkPoint(tree, s) {
  const { arc, trunk } = tree;
  if (s >= arc.at(-1)) return trunk.rings.at(-1).clone();
  if (s <= 0) return trunk.rings[0].clone();
  const k = arc.findIndex((a) => a >= s);
  const t = (s - arc[k - 1]) / Math.max(1e-9, arc[k] - arc[k - 1]);
  return trunk.rings[k - 1].clone().lerp(trunk.rings[k], t);
}

const directChildren = (tree) => tree.nodes.filter((n) => n.parent === tree.trunkIndex).sort((a, b) => a.arc - b.arc);

/** LAD branches toward the LV are diagonals; toward the RV, right ventricular branches. */
export function ladBranchKinds(tree, towardLv) {
  return directChildren(tree).map((node) => ({ node, kind: node.tip.clone().sub(node.takeoff).dot(towardLv) > 0 ? 'diagonal' : 'rv' }));
}

// Rigid shift of a set of vertices along the trunk from arc `from` to arc `to`.
function shiftAlongTrunk(pos, vertices, tree, from, to) {
  const d = trunkPoint(tree, to).sub(trunkPoint(tree, from));
  for (const i of vertices) pos.setXYZ(i, pos.getX(i) + d.x, pos.getY(i) + d.y, pos.getZ(i) + d.z);
}
/**
 * Ventricular surface for seating moved branches: positions and normals of
 * the given meshes (same baked frame as the arteries).
 */
export function surfaceOf(meshes) {
  const points = [], normals = [];
  for (const m of meshes.filter(Boolean)) {
    const g = m.geometry;
    if (!g.attributes.normal) g.computeVertexNormals();
    const p = g.attributes.position, nrm = g.attributes.normal;
    for (let i = 0; i < p.count; i++) { points.push(v3(p, i)); normals.push(v3(nrm, i).normalize()); }
  }
  return points.length ? { points, normals } : null;
}
// Signed height of `c` above the nearest surface vertex, along its normal.
function heightAbove(surface, c) {
  let best = -1, bestD = Infinity;
  for (let i = 0; i < surface.points.length; i++) { const d = surface.points[i].distanceToSquared(c); if (d < bestD) { bestD = d; best = i; } }
  const n = surface.normals[best];
  return { h: c.clone().sub(surface.points[best]).dot(n), n };
}
// Ring centres of a component's 12-vertex rings, read from the live positions.
function ringCentres(pos, vertices) {
  const out = [];
  for (let i = 0; i + RING <= vertices.length; i += RING) {
    const c = new THREE.Vector3();
    for (let k = 0; k < RING; k++) c.add(v3(pos, vertices[i + k]));
    out.push(c.divideScalar(RING));
  }
  return out;
}
// Shift a component along the trunk, then put every ring back at the height
// above the ventricular surface it had before, so it lies on the epicardium.
function shiftOnSurface(pos, vertices, tree, from, to, surface) {
  const before = surface ? ringCentres(pos, vertices).map((c) => heightAbove(surface, c).h) : null;
  shiftAlongTrunk(pos, vertices, tree, from, to);
  if (!surface) return;
  ringCentres(pos, vertices).forEach((c, r) => {
    const { h, n } = heightAbove(surface, c);
    const d = n.clone().multiplyScalar(before[r] - h);
    for (let k = 0; k < RING; k++) { const i = vertices[r * RING + k]; pos.setXYZ(i, pos.getX(i) + d.x, pos.getY(i) + d.y, pos.getZ(i) + d.z); }
  });
}
function refresh(geometry) {
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

/**
 * Move the direct side branches of an artery (with their own sub-branches)
 * proximally along the trunk: the anchor branch (D1 on the LAD, the first
 * branch on the LCX) lands at `fraction` of the trunk length, branches before
 * it scale toward the ostium, the last branch keeps its place and the ones
 * between follow linearly. Each branch shifts rigidly; with a `surface`
 * (surfaceOf) every ring then returns to its former height above the
 * ventricles, so it lies on the epicardium instead of sinking into the wider
 * base. None moves distally.
 * Mutates the geometry; returns the moves { from, to } in trunk arc length.
 */
export function moveBranchesProximal(geometry, components, tree, fraction, isAnchor = () => true, surface = null) {
  const children = directChildren(tree);
  const anchor = children.find(isAnchor);
  if (!anchor) return [];
  const total = tree.arc.at(-1), first = anchor.arc, last = children.at(-1).arc;
  const target = fraction * total;
  if (first <= target) return [];
  const map = (s) => (s <= first ? s * target / first : last > first ? target + (s - first) * (last - target) / (last - first) : target);
  const subtree = (root) => tree.nodes.filter((n) => { let k = n; while (k && k.index !== root.index) k = k.parent === null ? null : tree.nodes[k.parent]; return Boolean(k); });
  const pos = geometry.attributes.position;
  const moves = [];
  for (const child of children) {
    const to = Math.min(child.arc, map(child.arc));
    if (to >= child.arc - 1e-6) continue;
    for (const node of subtree(child)) shiftOnSurface(pos, components[node.index].vertices, tree, child.arc, to, surface);
    moves.push({ from: +child.arc.toFixed(3), to: +to.toFixed(3) });
  }
  refresh(geometry);
  return moves;
}

/**
 * Place the septal perforators (a separate mesh) along the proximal and mid
 * LAD: S1 just proximal to D1, the last by the mid LAD, order kept.
 * Mutates the septal geometry; returns the moves { from, to }.
 */
export function placeSeptals(septalGeometry, ladTree, d1Arc) {
  const septals = tubeComponents(septalGeometry);
  if (!septals.length) return [];
  const total = ladTree.arc.at(-1);
  const takeoffs = septals.map((c) => takeoffOnTrunk(ladTree, c));
  const lo = Math.min(...takeoffs), hi = Math.max(...takeoffs);
  const start = Math.max(0, d1Arc - S1_BEFORE_D1 * total), end = Math.max(start, SEPTAL_END_FRACTION * total);
  const map = (s) => (hi > lo ? start + (s - lo) * (end - start) / (hi - lo) : start);
  const pos = septalGeometry.attributes.position;
  const moves = septals.map((c, i) => {
    const to = map(takeoffs[i]);
    shiftAlongTrunk(pos, c.vertices, ladTree, takeoffs[i], to);
    return { from: +takeoffs[i].toFixed(3), to: +to.toFixed(3) };
  });
  refresh(septalGeometry);
  return moves;
}

const NAMES = {
  diagonal: (n) => ({ tr: `${n}. diagonal dal (D${n})`, en: `Diagonal branch ${n} (D${n})`, abbr: `D${n}` }),
  septal: (n) => ({ tr: `${n}. septal perforatör (S${n})`, en: `Septal perforator ${n} (S${n})`, abbr: `S${n}` }),
  om: (n) => ({ tr: `${n}. obtus marjinal dal (OM${n})`, en: `Obtuse marginal branch ${n} (OM${n})`, abbr: `OM${n}` }),
  ladRv: () => ({ tr: 'LAD sağ ventrikül dalı', en: 'Right ventricular branch of the LAD', abbr: 'LAD-RV' }),
  conus: () => ({ tr: 'Konus dalı', en: 'Conus branch', abbr: 'Konus' }),
  am: () => ({ tr: 'Akut marjinal dal (AM)', en: 'Acute marginal branch (AM)', abbr: 'AM' }),
  rcaRv: (n) => ({ tr: `${n}. RV dalı (RCA)`, en: `Right ventricular branch ${n} (RCA)`, abbr: `RV${n}` }),
  side: (parent) => ({ tr: `${parent.abbr} yan dalı`, en: `Side branch of ${parent.abbr}`, abbr: parent.abbr })
};

/** Names of every non-trunk tube: Map(component index -> name); sub-branches take their parent's. */
function nameTree(tree, direct) {
  const names = new Map(direct);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of tree.nodes) {
      if (names.has(node.index) || node.parent === null || node.index === tree.trunkIndex) continue;
      if (names.has(node.parent)) { names.set(node.index, NAMES.side(names.get(node.parent))); changed = true; }
    }
  }
  return names;
}

/** Branch names of one mesh and, per vertex, the index of its name (-1: the trunk). */
function table(components, names) {
  const rows = [], byVertex = new Int16Array(components.reduce((n, c) => n + c.vertices.length, 0)).fill(-1);
  components.forEach((c, i) => {
    if (!names.has(i)) return;
    rows.push(names.get(i));
    for (const v of c.vertices) byVertex[v] = rows.length - 1;
  });
  return { names: rows, byVertex };
}

export function ladNames(tree, towardLv) {
  const direct = new Map();
  let d = 0;
  for (const { node, kind } of ladBranchKinds(tree, towardLv)) direct.set(node.index, kind === 'diagonal' ? NAMES.diagonal(++d) : NAMES.ladRv());
  return nameTree(tree, direct);
}

export function lcxNames(tree) {
  return nameTree(tree, new Map(directChildren(tree).map((node, i) => [node.index, NAMES.om(i + 1)])));
}

export function rcaNames(tree) {
  const children = directChildren(tree);
  const direct = new Map();
  const total = tree.arc.at(-1);
  const conus = children[0] && children[0].arc < total * CONUS_FRACTION ? children[0] : null;
  if (conus) direct.set(conus.index, NAMES.conus());
  const rest = children.filter((n) => n !== conus);
  // The acute marginal runs lowest, along the inferior (acute) margin of the RV.
  const meanY = (node) => node.component.rings.reduce((s, p) => s + p.y, 0) / node.component.rings.length;
  const am = rest.reduce((best, n) => (!best || meanY(n) < meanY(best) ? n : best), null);
  if (am) direct.set(am.index, NAMES.am());
  rest.filter((n) => n !== am).forEach((n, i) => direct.set(n.index, NAMES.rcaRv(i + 1)));
  return nameTree(tree, direct);
}

/**
 * Move the LAD and LCX side branches to proximal positions, place the
 * septal perforators around D1, then build the branch tables.
 * Meshes: { lad, septal, lcx, rca, lm, rcc, lv, rv }.
 * Returns { tables: { lad, septal, lcx, rca }, septalMoves, branchMoves: { lad, lcx } }.
 */
export function buildCoronaryBranches(meshes) {
  const centre = (m) => { m.geometry.computeBoundingBox(); return m.geometry.boundingBox.getCenter(new THREE.Vector3()); };
  const tables = {};
  let septalMoves = [];
  const branchMoves = {};
  const surface = surfaceOf([meshes.lv, meshes.rv]);
  const towardLv = meshes.lv && meshes.rv ? centre(meshes.lv).sub(centre(meshes.rv)).normalize() : new THREE.Vector3(1, 0, -1).normalize();
  const leftOstium = meshes.lm ? centre(meshes.lm) : null;
  if (meshes.lad && leftOstium) {
    const raw = tubeComponents(meshes.lad.geometry);
    const rawTree = arteryTree(raw, leftOstium);
    const diagonals = new Set(ladBranchKinds(rawTree, towardLv).filter((b) => b.kind === 'diagonal').map((b) => b.node));
    branchMoves.lad = moveBranchesProximal(meshes.lad.geometry, raw, rawTree, LAD_D1_FRACTION, (node) => diagonals.has(node), surface);
    const comps = tubeComponents(meshes.lad.geometry);
    const tree = arteryTree(comps, leftOstium);
    tables.lad = table(comps, ladNames(tree, towardLv));
    const d1 = ladBranchKinds(tree, towardLv).find((b) => b.kind === 'diagonal');
    if (meshes.septal) {
      if (d1) septalMoves = placeSeptals(meshes.septal.geometry, tree, d1.node.arc);
      const septals = tubeComponents(meshes.septal.geometry);
      const order = septals.map((c, i) => ({ i, s: takeoffOnTrunk(tree, c) })).sort((a, b) => a.s - b.s);
      tables.septal = table(septals, new Map(order.map(({ i }, k) => [i, NAMES.septal(k + 1)])));
    }
  }
  if (meshes.lcx && leftOstium) {
    const raw = tubeComponents(meshes.lcx.geometry);
    branchMoves.lcx = moveBranchesProximal(meshes.lcx.geometry, raw, arteryTree(raw, leftOstium), LCX_OM1_FRACTION, () => true, surface);
    const comps = tubeComponents(meshes.lcx.geometry);
    tables.lcx = table(comps, lcxNames(arteryTree(comps, leftOstium)));
  }
  if (meshes.rca && meshes.rcc) {
    const comps = tubeComponents(meshes.rca.geometry);
    tables.rca = table(comps, rcaNames(arteryTree(comps, centre(meshes.rcc))));
  }
  return { tables, septalMoves, branchMoves };
}

/** Name of the branch holding vertex `vertex` in a mesh's table, or null (trunk or no table). */
export function branchAt(branchTable, vertex) {
  const k = branchTable?.byVertex[vertex] ?? -1;
  return k >= 0 ? branchTable.names[k] : null;
}

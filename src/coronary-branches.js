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
// Septal perforators moved distal to D1 start this far beyond it and keep this spacing.
const SEPTAL_AFTER_D1 = 0.04;
const SEPTAL_SPACING = 0.12;

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

/**
 * Move septal perforators that leave the LAD proximal to D1 to just distal to
 * it, keeping their order and shape (a rigid shift along the trunk). Mutates
 * the septal geometry; returns the moves { from, to } in trunk arc length.
 */
export function moveSeptalsDistalToD1(septalGeometry, ladTree, d1Arc) {
  const septals = tubeComponents(septalGeometry);
  const takeoffs = septals.map((c) => takeoffOnTrunk(ladTree, c));
  const early = septals.map((c, i) => ({ c, s: takeoffs[i] })).filter((x) => x.s < d1Arc).sort((a, b) => a.s - b.s);
  if (!early.length) return [];
  const taken = takeoffs.filter((s) => s >= d1Arc);
  const pos = septalGeometry.attributes.position;
  const moves = [];
  let next = d1Arc + SEPTAL_AFTER_D1;
  for (const { c, s } of early) {
    while (taken.some((t) => Math.abs(t - next) < SEPTAL_SPACING / 2)) next += SEPTAL_SPACING / 4;
    const shift = trunkPoint(ladTree, next).sub(trunkPoint(ladTree, s));
    for (const i of c.vertices) pos.setXYZ(i, pos.getX(i) + shift.x, pos.getY(i) + shift.y, pos.getZ(i) + shift.z);
    moves.push({ from: +s.toFixed(3), to: +next.toFixed(3) });
    taken.push(next);
    next += SEPTAL_SPACING;
  }
  pos.needsUpdate = true;
  septalGeometry.computeVertexNormals();
  septalGeometry.computeBoundingBox();
  septalGeometry.computeBoundingSphere();
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
 * Build the branch tables for the atlas coronaries and apply the septal
 * reorder (D1 proximal to S1). Meshes: { lad, septal, lcx, rca, lm, rcc, lv, rv }.
 * Returns { tables: { lad, septal, lcx, rca }, septalMoves }.
 */
export function buildCoronaryBranches(meshes) {
  const centre = (m) => { m.geometry.computeBoundingBox(); return m.geometry.boundingBox.getCenter(new THREE.Vector3()); };
  const tables = {};
  let septalMoves = [];
  const towardLv = meshes.lv && meshes.rv ? centre(meshes.lv).sub(centre(meshes.rv)).normalize() : new THREE.Vector3(1, 0, -1).normalize();
  const leftOstium = meshes.lm ? centre(meshes.lm) : null;
  if (meshes.lad && leftOstium) {
    const comps = tubeComponents(meshes.lad.geometry);
    const tree = arteryTree(comps, leftOstium);
    tables.lad = table(comps, ladNames(tree, towardLv));
    const d1 = ladBranchKinds(tree, towardLv).find((b) => b.kind === 'diagonal');
    if (meshes.septal) {
      if (d1) septalMoves = moveSeptalsDistalToD1(meshes.septal.geometry, tree, d1.node.arc);
      const septals = tubeComponents(meshes.septal.geometry);
      const order = septals.map((c, i) => ({ i, s: takeoffOnTrunk(tree, c) })).sort((a, b) => a.s - b.s);
      tables.septal = table(septals, new Map(order.map(({ i }, k) => [i, NAMES.septal(k + 1)])));
    }
  }
  if (meshes.lcx && leftOstium) {
    const comps = tubeComponents(meshes.lcx.geometry);
    tables.lcx = table(comps, lcxNames(arteryTree(comps, leftOstium)));
  }
  if (meshes.rca && meshes.rcc) {
    const comps = tubeComponents(meshes.rca.geometry);
    tables.rca = table(comps, rcaNames(arteryTree(comps, centre(meshes.rcc))));
  }
  return { tables, septalMoves };
}

/** Name of the branch holding vertex `vertex` in a mesh's table, or null (trunk or no table). */
export function branchAt(branchTable, vertex) {
  const k = branchTable?.byVertex[vertex] ?? -1;
  return k >= 0 ? branchTable.names[k] : null;
}

import assert from 'node:assert/strict';
import * as THREE from 'three';
import { tubeComponents, arteryTree, ladNames, lcxNames, rcaNames, ladBranchKinds, moveSeptalsDistalToD1, takeoffOnTrunk, branchAt } from '../src/coronary-branches.js';

// Synthetic tubes: 12-vertex rings around each centre point, joined by quads.
function tubes(paths) {
  const positions = [], indices = [];
  for (const path of paths) {
    const base = positions.length / 3;
    path.forEach(([x, y, z]) => {
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        positions.push(x + Math.cos(a) * 0.02, y, z + Math.sin(a) * 0.02);
      }
    });
    for (let i = 0; i + 1 < path.length; i++) for (let k = 0; k < 12; k++) {
      const a = base + i * 12 + k, b = base + i * 12 + ((k + 1) % 12), c = a + 12, d = b + 12;
      indices.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  return g;
}
const line = (from, to, n = 20) => Array.from({ length: n + 1 }, (_, i) => from.map((v, k) => v + (to[k] - v) * (i / n)));

// LAD: trunk down the y axis from the ostium (y = 1); the LV lies toward +x.
const ostium = new THREE.Vector3(0, 1.1, 0);
const towardLv = new THREE.Vector3(1, 0, 0);
const lad = tubes([
  line([0, 1, 0], [0, -2, 0], 60),
  line([-0.03, 0, 0.01], [-0.6, -0.3, 0]),          // toward the RV: right ventricular branch
  line([0.03, -0.5, 0.01], [0.7, -0.9, 0]),        // first branch toward the LV: D1
  line([0.03, -1.2, 0.01], [0.6, -1.6, 0]),        // D2
  line([0.35, -0.7, 0], [0.5, -0.5, 0.2])    // a branch of D1
]);
const ladComps = tubeComponents(lad);
assert.equal(ladComps.length, 5, 'one component per tube');
const ladTree = arteryTree(ladComps, ostium);
assert.equal(ladTree.trunkIndex, 0, 'the longest tube is the trunk');
assert.ok(ladTree.trunk.rings[0].distanceTo(ostium) < 0.2, 'the trunk runs from the ostium');
const kinds = ladBranchKinds(ladTree, towardLv).map(b => b.kind);
assert.deepEqual(kinds, ['rv', 'diagonal', 'diagonal'], 'side of each direct branch, in takeoff order');
const names = ladNames(ladTree, towardLv);
assert.equal(names.get(1).abbr, 'LAD-RV');
assert.equal(names.get(2).abbr, 'D1');
assert.equal(names.get(3).abbr, 'D2');
assert.equal(names.get(4).tr, 'D1 yan dalı', 'a branch of a branch is named after its parent');
assert.equal(names.has(0), false, 'the trunk has no branch name');

// Septal perforators: one proximal to D1 (arc 1.2 < 1.5) moves just distal to it; one distal stays.
const septal = tubes([line([0, -0.2, -0.03], [0, -0.3, -0.5]), line([0, -1.4, -0.03], [0, -1.5, -0.5])]);
const d1Arc = ladBranchKinds(ladTree, towardLv).find(b => b.kind === 'diagonal').node.arc;
assert.ok(Math.abs(d1Arc - 1.5) < 0.06, `D1 takeoff measured along the trunk (${d1Arc})`);
const before = tubeComponents(septal).map(c => takeoffOnTrunk(ladTree, c));
assert.ok(before[0] < d1Arc && before[1] > d1Arc);
const moves = moveSeptalsDistalToD1(septal, ladTree, d1Arc);
assert.equal(moves.length, 1, 'only the septal proximal to D1 moves');
const after = tubeComponents(septal).map(c => takeoffOnTrunk(ladTree, c));
assert.ok(after[0] > d1Arc && after[0] < d1Arc + 0.1, `S1 now leaves just distal to D1 (${after[0]})`);
assert.ok(Math.abs(after[1] - before[1]) < 1e-6, 'the distal septal is untouched');
const shifted = tubeComponents(septal)[0];
assert.ok(Math.abs(shifted.length - tubeComponents(tubes([line([0, -0.2, -0.03], [0, -0.3, -0.5])]))[0].length) < 1e-6, 'a rigid shift keeps the branch shape');
assert.deepEqual(moveSeptalsDistalToD1(septal, ladTree, d1Arc), [], 'nothing left to move');

// LCX: obtuse marginals in takeoff order.
const lcx = tubes([line([0, 1, 0], [2, 0, 0], 40), line([1.5, 0.22, 0.01], [1.6, -0.5, 0]), line([0.5, 0.72, 0.01], [0.6, 0, 0])]);
const lcxComps = tubeComponents(lcx);
const lcxN = lcxNames(arteryTree(lcxComps, ostium));
assert.equal(lcxN.get(2).abbr, 'OM1', 'the proximal marginal is OM1');
assert.equal(lcxN.get(1).abbr, 'OM2');

// RCA: conus first (proximal third), the lowest branch is the acute marginal, the rest RV branches.
const rcaOstium = new THREE.Vector3(0, 1.1, 0);
const rca = tubes([
  line([0, 1, 0], [0, -2, -1], 60),
  line([0.03, 0.8, -0.06], [0.5, 1.0, 0.3]),          // conus: leaves early, runs up and forward
  line([0.03, -0.2, -0.39], [0.8, -0.4, 0.2]),         // RV branch
  line([0.03, -1.0, -0.66], [1.2, -1.8, 0.2])         // acute marginal: the lowest
]);
const rcaComps = tubeComponents(rca);
const rcaN = rcaNames(arteryTree(rcaComps, rcaOstium));
assert.equal(rcaN.get(1).abbr, 'Konus');
assert.equal(rcaN.get(2).abbr, 'RV1');
assert.equal(rcaN.get(3).abbr, 'AM');

// Picking: the vertex range of each named tube.
const table = { names: [{ tr: 'x', en: 'x', abbr: 'D1' }], byVertex: Int16Array.from([-1, 0, 0]) };
assert.equal(branchAt(table, 0), null, 'trunk vertex');
assert.equal(branchAt(table, 2).abbr, 'D1');
assert.equal(branchAt(undefined, 2), null, 'a mesh without a table');

console.log('PASS: coronary side branches: tree, takeoff order, D/S/OM/conus/AM/RV names, septals moved distal to D1');

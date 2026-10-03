// Chiari network strand layout (src/ra-valves.js): a few strands from the
// lateral Eustachian valve edge to the lower crista that run side by side
// (no crossing, none longer than the cavity is wide), joined by short cross links.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { chiariStrandPaths, eustachianHeight } from '../src/ra-valves.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
// Crista from the SVC end (top) down to the IVC end; valve edge from its lateral end to the CS mouth (atlas-like numbers).
const crista = Array.from({ length: 72 }, (_, i) => V(-1.0 - 0.45 * (i / 71), 1.44 - 2.3 * (i / 71), 0.08 - 0.23 * (i / 71)));
const edge = Array.from({ length: 30 }, (_, i) => V(-1.01 + 0.38 * (i / 29), -0.66 + 0.54 * (i / 29), -0.09 - 0.47 * (i / 29)));
const centre = V(-0.7, 0.2, 0);
const strands = chiariStrandPaths({ valveEdge: edge, cristaPath: crista, centre });
assert.equal(strands.length, 9, 'five strands plus four cross links');
const main = strands.slice(0, 5), links = strands.slice(5);
const len = s => s[0].distanceTo(s[2]);
assert.ok(main.every(s => len(s) > 0.2 && len(s) < 1.0), `strand lengths ${main.map(s => len(s).toFixed(2))}`);
assert.ok(main.every(s => s[0].y < 0 && s[2].y < 0), 'strands stay in the lower atrium, near the caval orifice and the lower crista');
// Same order on both ends: the neighbours do not cross.
for (let k = 0; k + 1 < main.length; k++) {
  assert.ok(main[k + 1][0].y > main[k][0].y && main[k + 1][2].y > main[k][2].y, `strand ${k + 1} follows strand ${k} on both ends`);
  const gap = Math.min(...[0, 0.25, 0.5, 0.75, 1].map(f => main[k][0].clone().lerp(main[k][2], f).distanceTo(main[k + 1][0].clone().lerp(main[k + 1][2], f))));
  assert.ok(gap > 0.05, `strands ${k} and ${k + 1} keep apart (${gap.toFixed(3)})`);
}
// Cross links are short and join neighbours.
assert.ok(links.every((s, k) => len(s) < 0.6 * Math.min(len(main[k]), len(main[k + 1])) && len(s) > 0.02), 'cross links are short');
assert.ok(strands.flat().every(p => [p.x, p.y, p.z].every(Number.isFinite)), 'finite points');
// The Eustachian crescent is highest in the middle and flat at its ends.
assert.ok(eustachianHeight(0.5) > eustachianHeight(0.1) && eustachianHeight(0) < 1e-6 && eustachianHeight(1) < 0.01);
console.log('PASS: Chiari strands run side by side from the lateral valve edge to the lower crista, joined by short cross links');

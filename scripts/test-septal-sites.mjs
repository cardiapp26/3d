import assert from 'node:assert/strict';
import * as THREE from 'three';
import { hisBundleEnd, septalPairs, septalSiteNear } from '../src/mesh-utils.js';

// Septum as two parallel cavity surfaces: RV side at x = 0, LV side at x = 0.25.
const grid = x => {
  const out = [];
  for (let y = -2; y <= 0; y += 0.05) for (let z = -0.5; z <= 0.5; z += 0.05) out.push(new THREE.Vector3(x, y, z));
  return out;
};
const rv = grid(0);
const lv = grid(0.25);
const far = [new THREE.Vector3(-1, -1, 0)];

const pairs = septalPairs([...rv, ...far], lv);
assert.ok(pairs.length > 100, 'RV vertices facing the LV form the septum');
// LV vertices are sampled (every third), so the partner may sit one grid step off.
assert.ok(pairs.every(p => p.d >= 0.25 - 1e-6 && p.d < 0.27), 'pair span is the septal thickness');
assert.ok(!pairs.some(p => p.rvSide.x === -1), 'RV vertices far from the LV are free wall, not septum');

const site = septalSiteNear(pairs, new THREE.Vector3(-0.3, -1, 0.2));
assert.ok(Math.abs(site.rvSide.y + 1) < 0.051 && Math.abs(site.rvSide.z - 0.2) < 0.051, 'nearest septal site is found');

// AV node above the septal crest, commissure above and in front of it.
const avNode = new THREE.Vector3(0.125, 0.3, 0);
const commissure = new THREE.Vector3(0.125, 0.2, 0.4);
const his = hisBundleEnd(pairs, avNode, commissure);
assert.ok(his, 'a His end is found on the muscular septum');
assert.ok(Math.abs(his.x - 0.125) < 1e-6, 'the His end lies mid-septum');
const reach = his.distanceTo(avNode);
assert.ok(reach >= 0.27 && reach <= 0.54, 'the His end is 1-2 cm from the AV node');
assert.equal(hisBundleEnd(pairs, avNode, commissure, { minThickness: 0.3 }), null, 'a thin (membranous) septum carries no His end');

console.log('PASS: septal sites and the distal His are measured on the septum');

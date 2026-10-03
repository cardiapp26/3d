import assert from 'node:assert/strict';
import * as THREE from 'three';
import { TS_SITES, septalAnterior, siteAt } from '../src/transseptal-sites.js';

const normal = new THREE.Vector3(0.2, 0, -1).normalize();
const up = new THREE.Vector3(0, 1, 0);
const anterior = septalAnterior(normal, up);
assert.ok(Math.abs(anterior.dot(normal)) < 1e-9 && Math.abs(anterior.dot(up)) < 1e-9 && Math.abs(anterior.length() - 1) < 1e-9, 'anterior lies in the septal plane, perpendicular to up');
assert.ok(anterior.z > 0, 'anterior points toward the tricuspid side (+z)');

const frame = { fossa: new THREE.Vector3(0, 0, 0), up, anterior, radius: 1 };
const at = Object.fromEntries(Object.keys(TS_SITES).map(k => [k, siteAt(k, frame)]));

// Figure 2: PVI central; LV ablation anterior-inferior to mid; LAAC posterior-inferior;
// mitral posterior and high; PFO superior and anterior.
assert.ok(at.pvi.length() < 0.3, 'PVI site is central');
assert.ok(at.lv.dot(anterior) > 0 && at.lv.y < 0, 'LV ablation: anterior and below the centre');
assert.ok(at.laac.dot(anterior) < 0 && at.laac.y < 0, 'LAAC: posterior and inferior');
assert.ok(at.mitral.dot(anterior) < 0 && at.mitral.y > 0, 'mitral intervention: posterior and superior');
assert.ok(at.pfo.dot(anterior) > 0 && at.pfo.y > 0, 'PFO: superior and anterior');
assert.ok(at.mitral.y > at.pvi.y && at.laac.y < at.pvi.y, 'mitral sits above the PVI site, LAAC below');
assert.ok(Object.values(TS_SITES).every(s => Math.hypot(s.anterior, s.superior) <= 1.1), 'every site stays on the fossa');
assert.throws(() => siteAt('nope', frame), /Unknown/);

console.log('PASS: transseptal puncture sites follow the consensus figure');

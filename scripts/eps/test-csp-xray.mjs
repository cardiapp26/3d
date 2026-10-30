// CSP lead on the atlas fluoroscopy (src/eps/csp/csp-xray.mjs, csp-atlas-geometry.mjs): projection,
// septal sites, sheath turning in LAO, depth into the wall, RAO drag back to a level.
import assert from 'node:assert/strict';
import { project, septalSite, leadPose, levelAtImage, landmarksOn, VIEWS } from '../../src/eps/csp/csp-xray.mjs';
import { ATLAS_GEOMETRY, ATLAS_MM_PER_UNIT } from '../../src/eps/csp/csp-atlas-geometry.mjs';
import * as ct from '../../src/eps/csp/csp-ct-xray.mjs';
import { CT_GEOMETRY } from '../../src/eps/csp/csp-ct-geometry.mjs';

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };
const inside = ([x, y]) => x > 0 && x < 1 && y > 0 && y < 1;
const angleOnImage = (view, a, b) => { const p = project(view, a), q = project(view, b); return (Math.atan2(-(q[1] - p[1]), q[0] - p[0]) * 180) / Math.PI; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

test('the generated geometry has both views and a His-to-apex septum of plausible size', () => {
  assert.deepEqual(VIEWS, ['rao', 'lao']);
  const L = ATLAS_GEOMETRY.landmarks;
  const hisApexMm = dist(L.his, L.apex) * ATLAS_MM_PER_UNIT;
  assert.ok(hisApexMm > 55 && hisApexMm < 100, `${hisApexMm} mm`);
  for (const s of L.septum) { const mm = dist(s.rv, s.lv) * ATLAS_MM_PER_UNIT; assert.ok(mm > 3 && mm < 16, `${mm} mm`); }
  for (const view of VIEWS) for (const key of ['his', 'apex', 'tv', 'svc', 'ra']) assert.ok(inside(project(view, L[key])), `${key} on the ${view} image`);
});
test('RAO 30: His above and left of the apex; LAO 40: the septal normal points to screen right (LV)', () => {
  const L = landmarksOn('rao');
  assert.ok(L.his[0] < L.apex[0] && L.his[1] < L.apex[1]);
  const site = septalSite(.3);
  assert.ok(project('lao', site.lv)[0] > project('lao', site.rv)[0]);
});
test('the sheath angle turns the lead in LAO: clockwise (negative) steeper, counter-clockwise flatter', () => {
  const angles = [-50, -25, 0, 25, 50].map(rel => { const p = leadPose({ level: .3, rel, depthRatio: 0 }); return angleOnImage('lao', p.approach, p.tip); });
  for (let i = 1; i < angles.length; i++) assert.ok(angles[i] < angles[i - 1], angles.join(' '));
  assert.ok(Math.abs(angles[2] - (angles[1] + angles[3]) / 2) < 6, 'about symmetric around the perpendicular');
});
test('depth moves the tip from the RV side toward the LV side along the sheath', () => {
  const at = d => leadPose({ level: .3, rel: 0, depthRatio: d });
  const s = septalSite(.3);
  assert.ok(dist(at(0).tip, s.rv) < .02, 'a perpendicular sheath meets the wall at the RV side');
  assert.ok(Math.abs(dist(at(1).tip, s.lv)) < .02, 'full depth reaches the LV side');
  assert.ok(dist(at(.5).ring, at(.5).tip) > .1, 'ring electrode proximal of the tip');
  assert.equal(at(0).path.length, 5);
});
test('dragging on RAO: a projected septal site maps back to its level', () => {
  for (const level of [.1, .3, .55, .8]) {
    const [x, y] = project('rao', septalSite(level).rv);
    assert.ok(Math.abs(levelAtImage('rao', x, y) - level) < .02, `${level}`);
  }
});

// Real CT fluoroscopy (csp-ct-xray.mjs, csp-ct-geometry.mjs from public/ct-data/s0019).
test('CT geometry: His-apex about 70 mm, septum 8-16 mm, landmarks inside every C-arm view', () => {
  const L = CT_GEOMETRY.landmarks;
  const hisApex = dist(L.his, L.apex);
  assert.ok(hisApex > 55 && hisApex < 90, `${hisApex} mm`);
  for (const s of L.septum) { const mm = dist(s.rv, s.lv); assert.ok(mm > 7 && mm < 17, `${mm} mm`); }
  for (const angle of [-45, -30, 0, 40, 60]) for (const key of ['his', 'apex', 'tv', 'ra', 'raTop']) assert.ok(inside(ct.project(angle, L[key])), `${key} at ${angle}`);
  assert.ok(L.apex[0] > L.his[0] && L.apex[2] > L.his[2], 'apex left and caudal of the His');
});
test('CT C-arm: AP puts patient left on screen right; RAO 30 apex right-lower of His; LAO 40 RV left of LV; spine moves', () => {
  const L = CT_GEOMETRY.landmarks;
  assert.ok(ct.project(0, [L.iso[0] + 50, L.iso[1], L.iso[2]])[0] > .5, 'AP: patient left on the screen right');
  const rao = ct.landmarksOn(-30);
  assert.ok(rao.his[0] < rao.apex[0] && rao.his[1] < rao.apex[1]);
  const site = ct.septalSite(.3);
  assert.ok(ct.project(40, site.lv)[0] > ct.project(40, site.rv)[0]);
  const posterior = [L.iso[0], L.iso[1] + 80, L.iso[2]];   // toward the spine
  assert.ok(ct.project(-30, posterior)[0] < .5 && ct.project(40, posterior)[0] > .5, 'spine left in RAO, right in LAO');
  assert.equal(ct.carmLabel(-30), 'RAO 30°'); assert.equal(ct.carmLabel(0), 'AP'); assert.equal(ct.clampCarm(90), 60); assert.equal(ct.clampCarm(-70), -45);
});
test('CT lead: sheath torque turns the lead in LAO, depth reaches the LV side, drag maps back to the level', () => {
  const angles = [-50, -25, 0, 25, 50].map(rel => { const p = ct.leadPose({ level: .3, rel, depthRatio: 0 }); const a = ct.project(40, p.approach), b = ct.project(40, p.tip); return Math.atan2(-(b[1] - a[1]), b[0] - a[0]) * 180 / Math.PI; });
  for (let i = 1; i < angles.length; i++) assert.ok(angles[i] < angles[i - 1], angles.join(' '));
  const s = ct.septalSite(.3);
  assert.ok(dist(ct.leadPose({ level: .3, rel: 0, depthRatio: 0 }).tip, s.rv) < .5);
  assert.ok(dist(ct.leadPose({ level: .3, rel: 0, depthRatio: 1 }).tip, s.lv) < .5);
  for (const level of [.1, .3, .55, .8]) for (const angle of [-30, 0]) {
    const [x, y] = ct.project(angle, ct.septalSite(level).rv);
    assert.ok(Math.abs(ct.levelAtImage(angle, x, y) - level) < .02, `${level} at ${angle}`);
  }
});
test('CT attenuation volume: contrast removed from blood pools, RA/RV flagged for the puff, body continued caudally', () => {
  const keys = ['lv', 'rv', 'la', 'ra', 'myocardium', 'aorta', 'pulmonary-artery', 'ivc', 'ribs', 'vertebrae', 'clavicles', 'scapulae'];
  const meta = { dims: { x: 2, y: 2, z: 1 }, spacingMm: { x: 1.5, y: 1.5, z: 1.5 }, labels: keys.map((key, i) => ({ key, id: i + 1 })) };
  const hu = Float32Array.from({ length: 256 }, (_, b) => b * 10 - 1000);      // byte b -> HU
  const byte = h => (h + 1000) / 10;
  const volume = Uint8Array.from([byte(400), byte(400), byte(1200), byte(-900)]); // RV blood, unlabelled contrast, rib, lung
  const labels = Uint8Array.from([2, 0, 9, 0]);
  const v = ct.attenuationVolume({ meta, volume, labels, hu });
  assert.equal(v.dims.z, 51);
  const mu = i => v.data[i * 2] / 255 * 3.2;
  assert.ok(Math.abs(mu(0) - 1.04) < .02, 'RV blood as soft tissue'); assert.equal(v.data[1], 255, 'RV flagged for the puff');
  assert.ok(Math.abs(mu(1) - 1.045) < .02, 'unlabelled contrast removed'); assert.equal(v.data[3], 0);
  assert.ok(mu(2) > 2.5, 'bone kept dense'); assert.ok(mu(3) < .15, 'lung light');
  assert.ok(v.data[4 * 2] > 0, 'caudal extension filled');
});
test('CT image: window maps more attenuation to darker pixels; contrast darkens opacified blood', () => {
  const size = 16, integrals = new Float32Array(size * size * 2);
  for (let i = 0; i < size * size; i++) { integrals[i * 2] = i < 128 ? 3 : 5.5; integrals[i * 2 + 1] = 40; }
  const a = ct.fluoroPixels(integrals, size, 0), b = ct.fluoroPixels(integrals, size, 1);
  assert.ok(a[0] > a[200 * 4], 'thin body bright, thick dark');
  assert.ok(b[60 * 4] < a[60 * 4], 'contrast puff darker');
  assert.equal(a[3], 255);
});
console.log(`${passed} x-ray tests passed`);

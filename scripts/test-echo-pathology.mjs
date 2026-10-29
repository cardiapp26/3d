// Echo valve pathology overlay (echo-pathology-overlay.js) and colour Doppler geometry
// (echo-color-doppler.js): RR timing from the heart phase, jet windows per lesion, the jet
// origin at the annulus, direction rules and the chamber clip.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { rrFraction, windowStrength, pathologyOverlay } from '../src/echo-pathology-overlay.js';
import { jetGeometry } from '../src/echo-color-doppler.js';
import { CYCLE_SYNC } from '../src/cardiac-cycle.js';
import { VALVE_LESIONS } from '../src/echo-valve-disease.js';

// Heart phase -> RR fraction: QRS onset is 0.
assert.ok(Math.abs(rrFraction(CYCLE_SYNC.qrsOnset)) < 1e-9, 'QRS is RR 0');
assert.ok(rrFraction(0) > 0.5, 'rapid filling lies late in the RR interval');
assert.equal(windowStrength(0.2, [0.1, 0.3]), 1, 'inside a window (plateau)');
assert.equal(windowStrength(0.5, [0.1, 0.3]), 0, 'outside a window');
assert.ok(windowStrength(0.02, [0.5, 1.05]) > 0, 'a window past 1 wraps into the next beat');

const systole = (CYCLE_SYNC.ejectionStart + CYCLE_SYNC.ejectionPeak) / 2;   // heart phase in ejection
const diastole = 0.12;                                                       // heart phase in filling
const jetAt = (id, phase) => pathologyOverlay(id, phase, { color: true }).jets[0]?.strength || 0;
assert.ok(jetAt('as-severe', systole) > 0.5 && jetAt('as-severe', diastole) === 0, 'AS jet in systole only');
assert.ok(jetAt('mr-severe-primary', systole) > 0.5 && jetAt('mr-severe-primary', diastole) === 0, 'MR jet in systole only');
assert.ok(jetAt('ar-severe', diastole) > 0.5 && jetAt('ar-severe', systole) === 0, 'AR jet in diastole only');
assert.ok(jetAt('ms-severe', diastole) > 0.5 && jetAt('ms-severe', systole) === 0, 'MS jet in diastole only');
for (const l of VALVE_LESIONS.filter((x) => x.id !== 'normal')) {
  const o = pathologyOverlay(l.id, systole, { color: false });
  assert.deepEqual(o.valveStyle.ids, [l.valve], `${l.id}: the diseased valve is styled`);
  assert.equal(o.jets.length, 0, `${l.id}: colour off draws no jet`);
}
const normal = pathologyOverlay('normal', diastole, { color: true });
assert.equal(normal.valveStyle, null);
assert.equal(normal.jets[0].valve, 'mitral', 'normal heart: laminar mitral inflow in diastole');
assert.equal(normal.jets[0].mosaic, false);
assert.equal(pathologyOverlay('mr-severe-primary', systole).jets[0].originId, 'mitral-annulus', 'mitral jets start at the annulus');

// Jet geometry on synthetic contours (image units: x lateral, y depth).
const box = (id, x0, y0, x1, y1) => ({ id, points: [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]] });
const contours = [
  box('lv', -1, 0.5, 1, 2.5),
  box('la', -0.8, 3, 0.8, 4.5),
  { id: 'mitral', points: [[-0.6, 2.5], [-0.1, 2.9], [0.1, 2.9], [0.6, 2.5]] },
  { id: 'mitral-annulus', points: [[-0.6, 2.7], [0.6, 2.7]] },
  box('aortic-valve', 1.4, 2.4, 1.6, 2.6)
];
const mr = jetGeometry(contours, { valve: 'mitral', originId: 'mitral-annulus', to: 'la' });
assert.ok(Math.abs(mr.origin[0]) < 1e-9 && Math.abs(mr.origin[1] - 2.7) < 1e-9, 'origin at the annulus centre');
assert.ok(mr.dir[1] > 0.9, 'central MR jet points into the LA');
assert.ok(mr.chamber.length >= 3, 'receiving chamber hull for the clip');
const ecc = jetGeometry(contours, { valve: 'mitral', originId: 'mitral-annulus', to: 'la', eccentric: 0.6, towardId: ['aortic-valve'] });
assert.ok(ecc.dir[0] > 0.3, 'eccentric jet turns toward the landmark side');
const ms = jetGeometry(contours, { valve: 'mitral', originId: 'mitral-annulus', to: 'lv', from: 'la', antegrade: true });
assert.ok(ms.dir[1] < -0.9, 'antegrade jet leaves along the inflow axis (LA through the valve into the LV)');
assert.equal(jetGeometry(contours, { valve: 'tricuspid', to: 'ra' }), null, 'no jet when the valve is not in the cut');

for (const file of ['echo-pathology-overlay.js', 'echo-color-doppler.js', 'echo-mitral-apparatus.js', 'echo/echo-pathology-panel.js']) {
  assert.ok(!fs.readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8').includes('\u2014'), `${file} has no em dash`);
}
console.log('PASS echo pathology: RR timing, jet windows per lesion, annulus origin, eccentric and antegrade directions, chamber clip');

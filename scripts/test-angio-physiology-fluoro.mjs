// Angiographic view of the coronary physiology lab (coronary-physiology-fluoro.js): projection
// convention, measured-vessel arc length, lesion lumen, stent, sensor hit testing.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CLINICAL_CASES } from '../src/angio/physiology/coronary-physiology-data.js';
import { FLUORO_PROJECTIONS, projectPoint, sampleCenterline, lumenFactor, nearestPathMm, ratioColor } from '../src/angio/physiology/coronary-physiology-fluoro.js';

// C-arm convention (same as the carotid skopi): AP keeps patient left on screen right; LAO moves
// posterior structures (spine) to the screen right; cranial lifts posterior structures.
const spine = [0, 0, -4];
assert.ok(projectPoint([1, 0, 0], 0, 0).u > 0, 'AP: patient left on the screen right');
assert.ok(projectPoint(spine, 40, 0).u > 0, 'LAO: spine on the screen right');
assert.ok(projectPoint(spine, -30, 0).u < 0, 'RAO: spine on the screen left');
assert.ok(projectPoint([0, 1, 0], 0, 0).v < 0, 'superior is up on screen');

// Arc length: 1 cm = 10 mm, increasing along the samples.
const line = sampleCenterline([[0, 0, 0], [1, 0, 0], [2, 0, 0]]);
assert.ok(Math.abs(line.at(-1).mm - 20) < 0.5, `straight 2 cm line is 20 mm (${line.at(-1).mm.toFixed(2)})`);
assert.ok(line.every((s, i) => !i || s.mm >= line[i - 1].mm), 'arc length is monotone');

// Lumen: the narrowest point of a lesion is 1 - stenosis; a stent restores it; underexpansion leaves a waist.
const focal = CLINICAL_CASES.find(c => c.id === 'focal-lad');
const lesion = focal.lesions[0];
assert.ok(Math.abs(lumenFactor(focal, lesion.posMm) - (1 - lesion.stenosisPct / 100)) < 0.01, 'lesion lumen equals 1 - stenosis');
assert.equal(lumenFactor(focal, 5), 1, 'reference lumen away from the lesion');
assert.equal(lumenFactor(focal, lesion.posMm, { stentedIds: [lesion.id] }), 1, 'stent restores the lumen');
assert.ok(lumenFactor(focal, lesion.posMm, { stentedIds: [lesion.id], underexpanded: true }) < 0.85, 'underexpanded stent keeps a waist');
const serial = CLINICAL_CASES.find(c => c.id === 'serial-lad');
for (const l of serial.lesions) assert.ok(lumenFactor(serial, l.posMm) < 0.5, `serial lesion ${l.id} narrows the lumen`);
const diffuse = CLINICAL_CASES.find(c => c.id === 'diffuse-lad');
const diffuseMin = Math.min(...Array.from({ length: 60 }, (_, i) => lumenFactor(diffuse, 15 + i)));
assert.ok(diffuseMin < 0.75 && diffuseMin > 0.3, `diffuse disease narrows the lumen irregularly (${diffuseMin.toFixed(2)})`);

// Hit testing: nearest mm on a projected path, null away from it.
const path = Array.from({ length: 81 }, (_, mm) => ({ x: 10 + mm * 4, y: 50, mm }));
assert.equal(nearestPathMm(path, 10 + 38 * 4, 58), 38, 'tap next to the vessel picks the nearest mm');
assert.equal(nearestPathMm(path, 10 + 38 * 4, 120), null, 'tap far from the vessel is ignored');
assert.equal(nearestPathMm(path, 1000, 50, 2000), 80, 'clamped to the 0-80 mm pullback axis');

// Map colours follow the FFR / Pd-Pa bands.
assert.equal(ratioColor(0.95), ratioColor(0.91));
assert.notEqual(ratioColor(0.85), ratioColor(0.95));
assert.notEqual(ratioColor(0.78), ratioColor(0.85));

// Standard projections exist for every territory.
for (const vessel of ['LAD', 'LCX', 'RCA']) assert.ok(FLUORO_PROJECTIONS[vessel]?.length >= 2, `${vessel} projections`);
for (const file of ['../src/angio/physiology/coronary-physiology-fluoro.js', '../src/angio/physiology/coronary-physiology-fluoro-view.js']) {
  assert.ok(!fs.readFileSync(new URL(file, import.meta.url), 'utf8').includes('\u2014'), `${file} has no em dash`);
}
console.log('PASS coronary physiology angiography: C-arm convention, arc length, lesion/stent/diffuse lumen, sensor hit test, map bands');

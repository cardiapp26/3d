import assert from 'node:assert/strict';
import { wallStress, LOAD_BASE, LOAD_CASES } from '../src/hemo-loads.js';
for (const mode of ['preload', 'afterload']) {
  const b = LOAD_BASE[mode], s = wallStress(b);
  assert.equal(wallStress({ ...b, p: b.p * 2 }), s * 2, 'pressure doubles stress');
  assert.equal(wallStress({ ...b, r: b.r * 2 }), s * 2, 'radius doubles stress');
  assert.equal(wallStress({ ...b, h: b.h * 2 }), s / 2, 'thickness halves stress');
  assert.equal(wallStress({ p: b.p, r: b.r * 10, h: b.h * 10 }), s, 'length units cancel');
  assert.ok(wallStress(LOAD_CASES.dilation[mode]) > s, 'dilation raises stress without pressure increase');
  assert.ok(wallStress(LOAD_CASES.thickening[mode]) < s, 'thickening lowers stress at fixed pressure and radius');
  assert.ok(wallStress(LOAD_CASES.pressure[mode]) > s, 'pressure preset raises stress');
}
assert.equal(wallStress(LOAD_BASE.preload), 15);
assert.equal(wallStress(LOAD_BASE.afterload), 125);
assert.equal(wallStress({ p: 0, r: 3, h: 1 }), 0);
for (const bad of [{ p: NaN }, { r: Infinity }, { h: 0 }, { p: -1 }, { r: -1 }, { h: -1 }]) {
  assert.throws(() => wallStress({ ...LOAD_BASE.preload, ...bad }), RangeError);
}
console.log('PASS: preload/afterload baseline, proportionality, unit invariance, presets and invalid inputs');

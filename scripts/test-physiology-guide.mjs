import assert from 'node:assert/strict';
import { ventricularSample, pumpOutput, pressureLoadFactor, AUTONOMIC, loopWork, MMHG_ML_TO_J } from '../src/physiology-model.js';
import { PHYSIOLOGY_TEXT } from '../src/physiology-text.js';
import { pvParams, pvModelLoop } from '../src/hemo-pv-model.js';
const rows = Array.from({ length: 361 }, (_, t) => ventricularSample(t));
assert.ok(rows.every(r => Object.values(r).every(Number.isFinite)));
assert.equal(rows[0].voltage, -90); assert.equal(rows[8].voltage, 20); assert.equal(rows[360].voltage, -90);
assert.ok(rows[5].na < -.99, 'inward Na peak');
assert.ok(rows[70].ca < 0 && rows[200].k > 0, 'inward calcium and outward K');
assert.ok(rows[70].k > 0 && Math.abs(rows[70].ca + rows[70].k) < 1e-8, 'plateau inward calcium balances outward potassium');
assert.deepEqual([rows[5].phase,rows[20].phase,rows[80].phase,rows[200].phase,rows[330].phase], [0,1,2,3,4]);
for (const tone of Object.keys(AUTONOMIC)) {
  const values = Array.from({ length: 21 }, (_, i) => pumpOutput(i-4,{ tone }));
  assert.ok(values.every((v,i) => v >= 0 && v <= AUTONOMIC[tone] && (!i || v >= values[i-1])));
}
assert.ok(pumpOutput(2,{side:'right'}) > pumpOutput(2,{side:'left'}), 'separate curves saturate at different atrial pressures');
assert.ok(pumpOutput(2,{tone:'sympathetic'}) > pumpOutput(2) && pumpOutput(2) > pumpOutput(2,{tone:'parasympathetic'}));
assert.equal(pressureLoadFactor(100), 1); assert.equal(pressureLoadFactor(250), 0);
assert.ok(pressureLoadFactor(180) > pressureLoadFactor(220));
assert.throws(()=>pumpOutput(NaN),RangeError); assert.throws(()=>pressureLoadFactor(Infinity),RangeError);
const rectangle = [{v:0,p:0},{v:80,p:0},{v:80,p:100},{v:0,p:100}];
assert.equal(loopWork(rectangle),8000); assert.equal(loopWork(rectangle.toReversed()),8000);
assert.ok(Math.abs(8000*MMHG_ML_TO_J - 1.066576) < 1e-8, 'pressure-volume work SI conversion');
const loop=pvModelLoop(pvParams()); assert.ok(Math.abs(loopWork(loop.points)-loop.strokeWork)<1e-8);
function checkText(value) { if (value && 'tr' in value && 'en' in value) { assert.ok(value.tr && value.en); } else if(value && typeof value==='object') Object.values(value).forEach(checkText); }
checkText(PHYSIOLOGY_TEXT);
console.log('PASS physiology: AP phases/current signs, bounded monotone pump curves, autonomic order, work integral/orientation/SI units, TR/EN');

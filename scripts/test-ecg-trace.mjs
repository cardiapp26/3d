import assert from 'node:assert/strict';
import { getIntervalForPhase } from '../src/cardiac-cycle.js';
import { computeChannelWeights } from '../src/animation-channels.js';
import { ecgSample, formatValveSync } from '../src/ecg-trace.js';

let peak = -Infinity;
let peakPhase = 0;
for (let i = 0; i <= 1000; i++) {
  const phase = i / 1000;
  const value = ecgSample(phase, 'sinus');
  assert.ok(Number.isFinite(value), 'sinus sample stays finite');
  if (value > peak) {
    peak = value;
    peakPhase = phase;
  }
}

assert.ok(ecgSample(0.38, 'sinus') > 0.12, 'P wave is present in sinus rhythm');
assert.ok(Math.abs(ecgSample(0.38, 'afib')) < 0.08, 'AFib concept has no P wave');
assert.ok(peak > 0.8, 'QRS is the dominant deflection');
assert.ok(peakPhase > 0.46 && peakPhase < 0.49, 'R peak sits at ventricular activation');
assert.ok(Math.abs(ecgSample(0.1, 'sinus')) < 0.05, 'early filling is near the baseline');
assert.ok(Math.abs(ecgSample(0.70, 'sinus')) < 0.08, 'mid-ejection is the ST segment, not the T wave');
assert.ok(ecgSample(0.835, 'sinus') > 0.2, 'T wave peaks as semilunar closure starts');
assert.ok(Math.abs(ecgSample(0.90, 'sinus')) < 0.05, 'isovolumetric relaxation is isoelectric after S2');

const ivr = computeChannelWeights(0.90);
assert.equal(ivr.avValveOpening, 0);
assert.equal(ivr.semilunarValveOpening, 0);
assert.ok(ivr.ventricularContraction < 0.02, 'ventricle has relaxed once both valves are shut');
assert.equal(getIntervalForPhase(0.90).id, 'isovolumetric-relaxation');
assert.equal(formatValveSync(getIntervalForPhase(0.90), 'tr'), 'AV kapalı · semilunar kapalı');

const ejection = computeChannelWeights(0.70);
assert.equal(ejection.avValveOpening, 0);
assert.equal(ejection.semilunarValveOpening, 1);
assert.equal(formatValveSync(getIntervalForPhase(0.70), 'en'), 'AV closed · semilunar open');

const filling = computeChannelWeights(0.20);
assert.ok(filling.avValveOpening > 0.9);
assert.equal(filling.semilunarValveOpening, 0);

console.log('PASS: schematic ECG follows atrial and ventricular timing');

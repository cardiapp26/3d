import assert from 'node:assert/strict';
import { CASES, DEFAULTS, normalize, simulate, thresholdSweep, programmedSweep, evidence } from '../../src/eps/csp/csp-model.mjs';

let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
const near = (a, b, tolerance = 1e-10) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
const mean = xs => xs.reduce((sum, x) => sum + x, 0) / xs.length;

test('normalization bounds malformed and nonfinite inputs without throwing', () => {
  assert.deepEqual(normalize(null), DEFAULTS);
  const s = normalize({ entry: Infinity, depth: 90, angle: -40, output: '7.5', pulseWidth: '', rate: NaN, s2: 'bad', caseId: '__proto__' });
  assert.equal(s.entry, DEFAULTS.entry); assert.equal(s.depth, 1.2); assert.equal(s.angle, 0);
  assert.equal(s.output, 7.5); assert.equal(s.pulseWidth, DEFAULTS.pulseWidth); assert.equal(s.rate, DEFAULTS.rate);
  assert.equal(s.s2, null); assert.equal(s.caseId, DEFAULTS.caseId);
  assert.equal(normalize({ couplingMs: 200 }).s2, 200);
  assert.equal(normalize({ s2: null, couplingMs: 200 }).s2, null);
});
test('all four examples produce deterministic finite sampled arrays', () => {
  assert.equal(CASES.length, 4);
  for (const { id } of CASES) {
    const a = simulate({ caseId: id });
    assert.deepEqual(a, simulate({ caseId: id }));
    assert.equal(a.times.length, 501); assert.equal(a.times[0], 0); assert.equal(a.times.at(-1), 500);
    assert.equal(Object.keys(a.leads).length, 12);
    for (const values of [...Object.values(a.leads), ...Object.values(a.egm)]) {
      assert.equal(values.length, 501); assert.ok(values.every(Number.isFinite));
    }
  }
});
test('independent thresholds allow reversible nonselective-selective-loss transitions', () => {
  const both = simulate(), cs = simulate({ output: .7 }), none = simulate({ output: .1 });
  assert.equal(both.capture.type, 'nonselective'); assert.equal(cs.capture.type, 'selective'); assert.equal(none.capture.type, 'none');
  assert.ok(cs.metrics.conductionThreshold < .7 && cs.metrics.muscleThreshold > .7);
  assert.equal(cs.capture.muscle, false); assert.equal(cs.capture.conduction, true);
  assert.deepEqual(simulate(), both);
});
test('strength-duration relation changes both capture thresholds at fixed geometry', () => {
  const short = simulate({ pulseWidth: .2, output: .6 }), long = simulate({ pulseWidth: 1, output: .6 });
  assert.ok(short.metrics.muscleThreshold > long.metrics.muscleThreshold);
  assert.ok(short.metrics.conductionThreshold > long.metrics.conductionThreshold);
  assert.equal(short.capture.type, 'none'); assert.equal(long.capture.type, 'selective');
});
test('geometry distinguishes RV, deep, LV septal and unavailable conduction', () => {
  assert.equal(simulate({ depth: .2 }).capture.type, 'rv');
  assert.equal(simulate({ depth: .6 }).capture.type, 'deep');
  assert.equal(simulate({ depth: .8 }).capture.type, 'lvsp');
  const misaligned = simulate({ angle: 60, output: 8 });
  assert.equal(misaligned.capture.conduction, false); assert.equal(misaligned.metrics.conductionThreshold, null);
  assert.equal(simulate({ entry: 0, output: 8 }).capture.conduction, false);
});
test('S2 refractoriness acts independently of voltage and tissue thresholds', () => {
  assert.equal(simulate({ s2: 300 }).capture.type, 'nonselective');
  assert.equal(simulate({ s2: 250 }).capture.type, 'lvsp');
  assert.equal(simulate({ s2: 200, output: 8 }).capture.type, 'none');
  assert.equal(simulate({ caseId: 'slow', s2: 300 }).capture.type, 'lvsp');
  assert.equal(simulate({ caseId: 'slow', s2: 350 }).capture.type, 'nonselective');
});
test('anodal capture requires bipolar high output and retains captured tissue flags', () => {
  const uni = simulate({ output: 6 }), bi = simulate({ output: 6, polarity: 'bi' });
  assert.equal(uni.capture.anodal, false); assert.equal(bi.capture.type, 'anodal');
  assert.equal(bi.capture.conduction, uni.capture.conduction); assert.equal(bi.capture.muscle, uni.capture.muscle);
  assert.notDeepEqual(bi.leads.V1.slice(55), uni.leads.V1.slice(55));
  assert.equal(simulate({ output: 6, polarity: 'bi', depth: .3 }).capture.anodal, false);
});
test('equal thresholds and scar do not manufacture selective capture', () => {
  assert.ok(thresholdSweep({ caseId: 'equal' }).every(row => row.capture.type !== 'selective'));
  assert.equal(evidence(thresholdSweep({ caseId: 'equal' })).hasTransition, false);
  const scar = simulate({ caseId: 'scar', output: 2 });
  assert.equal(scar.capture.type, 'none'); assert.equal(scar.metrics.conductionThreshold, null);
  assert.equal(simulate({ caseId: 'scar', output: 4 }).capture.type, 'lvsp');
});
test('perforation suppresses paced ventricular response at any output', () => {
  for (const depth of [1, 1.1, 1.2]) {
    const r = simulate({ depth, output: 8, polarity: 'bi' });
    assert.equal(r.capture.type, 'perforation'); assert.equal(r.capture.muscle, false); assert.equal(r.capture.conduction, false);
    assert.equal(r.metrics.qrsDuration, null); assert.equal(r.explanation.warning, 'perforation');
    assert.ok(r.leads.V6.slice(55).every(x => x === 0));
  }
});
test('limb lead algebra holds at every sample including stimulus', () => {
  for (const options of [{}, { depth: .2 }, { polarity: 'bi', output: 7 }, { pacing: false }]) {
    const { leads } = simulate(options);
    for (let i = 0; i < 501; i++) {
      near(leads.II[i], leads.I[i] + leads.III[i]);
      near(leads.aVR[i], -(leads.I[i] + leads.II[i]) / 2);
      near(leads.aVL[i], leads.I[i] - leads.II[i] / 2);
      near(leads.aVF[i], leads.II[i] - leads.I[i] / 2);
    }
  }
});
test('reported peak times and QRS duration reproduce from actual samples', () => {
  const r = simulate();
  const peak = values => values.indexOf(Math.max(...values.slice(55, 251)));
  assert.equal(r.metrics.v6Rwpt, peak(r.leads.V6) - 50);
  assert.equal(r.metrics.v1Rwpt, peak(r.leads.V1) - 50);
  assert.equal(r.metrics.interpeak, r.metrics.v1Rwpt - r.metrics.v6Rwpt);
  const env = r.leads.I.map((x, i) => Math.hypot(x, (r.leads.II[i] - .5 * x) * 2 / Math.sqrt(3), r.leads.V1[i] + .3 * x));
  const peakEnvelope = Math.max(...env.slice(55, 167));
  const active = env.map((v, i) => ({ v, i })).filter(({ v, i }) => i >= 55 && i <= 166 && v >= peakEnvelope * .03);
  assert.equal(r.metrics.qrsDuration, active.at(-1).i - active[0].i);
  const slow = simulate({ caseId: 'slow' }); assert.ok(slow.metrics.v6Rwpt > r.metrics.v6Rwpt);
});
test('causal EGM filter attenuates sustained injury component', () => {
  const r = simulate();
  assert.ok(Math.abs(mean(r.egm.filtered.slice(130, 200))) < Math.abs(mean(r.egm.unfiltered.slice(130, 200))) * .15);
  assert.notDeepEqual(r.egm.filtered, r.egm.unfiltered);
});
test('impedance rises as the helix engages and drops by over 200 ohm on perforation; COI on a mV scale', () => {
  const at = depth => simulate({ depth, angle: 0, entry: .5 }).metrics;
  assert.ok(at(.3).impedance > at(0).impedance && at(.8).impedance > at(.3).impedance && at(.95).impedance > at(.8).impedance);
  assert.ok(at(.95).impedance - at(1).impedance > 200); assert.ok(at(1).impedance < 450);
  assert.ok(at(.85).coi > 9 && at(.85).coi <= 15); assert.ok(at(.1).coi < 3); assert.equal(at(1).coi, 0);
  assert.ok(at(.85).coi > at(.5).coi && at(.5).coi > at(.2).coi);
});
test('latency to the local EGM separates selective from nonselective capture', () => {
  const ns = simulate({ output: 2 }).metrics, s = simulate({ output: .7 }).metrics, muscle = simulate({ depth: .6 }).metrics;
  assert.ok(ns.latency != null && s.latency - ns.latency >= 12);
  assert.ok(Math.abs(muscle.latency - ns.latency) < 8);
  assert.equal(simulate({ pacing: false }).metrics.latency, null); assert.equal(simulate({ output: 0 }).metrics.latency, null);
});
test('pacing off and noncapture have distinct signal behavior', () => {
  const intrinsic = simulate({ pacing: false });
  assert.equal(intrinsic.capture.type, 'off'); assert.equal(intrinsic.metrics.v6Rwpt, null);
  assert.ok(intrinsic.metrics.qrsDuration > 0); assert.ok(intrinsic.leads.V6.some(x => Math.abs(x) > .1));
  const noCapture = simulate({ output: 0 });
  assert.equal(noCapture.metrics.v6Rwpt, null); assert.ok(noCapture.leads.V6.every(x => x === 0));
});
test('evidence observes waveforms without trusting ground-truth capture labels', () => {
  const sweep = thresholdSweep(); const e = evidence(sweep);
  assert.ok(e.hasTransition); assert.equal(e.diagnostic, false);
  const masked = sweep.map(row => ({ ...row, capture: { type: 'rv' } }));
  assert.deepEqual(evidence(masked), e);
  assert.equal(evidence([]).hasTransition, false);
  const s2 = programmedSweep({ caseId: 'slow' });
  assert.equal(s2[0].s2, 450); assert.equal(s2.at(-1).s2, 180);
  assert.ok(evidence(s2).hasTransition);
});
console.log(`${passed} model tests passed`);

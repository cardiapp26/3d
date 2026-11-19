import assert from 'node:assert/strict';
import {
  PH_MODERATE_PASP_RATIO, PH_MODERATE_PVR_RATIO, PH_SEVERE_RATIO, SIGNIFICANT_QPQS,
  pulmonaryVenousSaturation, shuntClosureClass
} from '../src/hemo-formulas.js';
import { createHemodynamics } from '../src/hemodynamics.js';
import { RUN_SITES, captureSample, shuntRunReport } from '../src/hemo-shunt-run.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: expected ${b} ± ${tol}, got ${a}`);

// Closure classes follow the thresholds of the adult ASD guidance: Qp/Qs 1.5,
// PA systolic 50% and two-thirds of systemic, PVR one-third and two-thirds of SVR.
assert.equal(SIGNIFICANT_QPQS, 1.5);
assert.equal(PH_MODERATE_PASP_RATIO, 0.5);
near(PH_MODERATE_PVR_RATIO, 1 / 3, 1e-12, 'moderate PVR/SVR');
near(PH_SEVERE_RATIO, 2 / 3, 1e-12, 'severe ratio');
assert.equal(shuntClosureClass({ qpQs: 2.1, paspRatio: 0.3, pvrSvrRatio: 0.07 }), 'closure');
assert.equal(shuntClosureClass({ qpQs: 1.5, paspRatio: 0.49, pvrSvrRatio: 0.3 }), 'closure');
assert.equal(shuntClosureClass({ qpQs: 1.7, paspRatio: 0.58, pvrSvrRatio: 0.2 }), 'case_by_case');
assert.equal(shuntClosureClass({ qpQs: 1.7, paspRatio: 0.4, pvrSvrRatio: 0.4 }), 'case_by_case');
assert.equal(shuntClosureClass({ qpQs: 1.6, paspRatio: 0.7, pvrSvrRatio: 0.5 }), 'contraindicated');
assert.equal(shuntClosureClass({ qpQs: 0.7, paspRatio: 0.95, pvrSvrRatio: 1.1 }), 'contraindicated');
assert.equal(shuntClosureClass({ qpQs: 0.8, paspRatio: 0.3, pvrSvrRatio: 0.1 }), 'right_to_left');
assert.equal(shuntClosureClass({ qpQs: 1.2, paspRatio: 0.3, pvrSvrRatio: 0.1 }), 'not_significant');
// Pulmonary hypertension without a shunt is not an ASD closure question.
assert.equal(shuntClosureClass({ qpQs: 1.04, paspRatio: 0.8, pvrSvrRatio: 0.5 }), 'not_significant');
assert.equal(shuntClosureClass({ qpQs: NaN, paspRatio: 0.3, pvrSvrRatio: 0.1 }), null);

// Pulmonary venous saturation: measured if sampled; otherwise the arterial
// value when it is at least 95%, else an assumed 98%.
assert.deepEqual(pulmonaryVenousSaturation({ pulmonaryVein: 97, arterial: 90 }), { value: 97, source: 'measured' });
assert.deepEqual(pulmonaryVenousSaturation({ arterial: 96 }), { value: 96, source: 'arterial' });
assert.deepEqual(pulmonaryVenousSaturation({ arterial: 86 }), { value: 98, source: 'assumed' });

// Sites: the run goes cavae, right heart, wedge, across the defect, artery.
assert.deepEqual(RUN_SITES.map(s => s.id), ['svc', 'ivc', 'ra', 'rv', 'pa', 'pcwp', 'pv', 'ao']);

function run(id, siteIds = RUN_SITES.map(s => s.id)) {
  const hemo = createHemodynamics(id);
  const samples = {};
  for (const site of siteIds) {
    const sample = captureSample(hemo, site);
    if (sample) samples[site] = sample;
  }
  return { hemo, samples, report: shuntRunReport({ samples }) };
}
const step = (report, id) => report.steps.find(s => s.id === id);

// Nothing sampled: every step is locked and names what it still needs.
{
  const report = shuntRunReport({ samples: {} });
  assert.ok(report.steps.every(s => !s.ready), 'all steps locked');
  assert.deepEqual(step(report, 'mv').missing, ['svc', 'ivc']);
  assert.equal(report.verdict, null);
}

// Steps unlock in the order the catheter collects the data.
{
  const { report } = run('asd_left_to_right', ['svc', 'ivc']);
  assert.ok(step(report, 'mv').ready);
  near(step(report, 'mv').value, 67.75, 1e-9, 'ASD mixed venous');
  assert.ok(!step(report, 'stepUp').ready);
  assert.deepEqual(step(report, 'stepUp').missing, ['ra', 'rv', 'pa']);
  assert.deepEqual(step(report, 'ratio').missing, ['pa', 'ao']);
}

// Secundum ASD without pulmonary hypertension: closure.
{
  const { hemo, report, samples } = run('asd_left_to_right');
  assert.ok(report.steps.every(s => s.ready), 'full run unlocks every step');
  assert.equal(step(report, 'stepUp').value.level, 'atrial');
  near(step(report, 'ratio').value, 2.16, 0.01, 'ASD Qp/Qs');
  assert.equal(step(report, 'ratio').pulmonaryVein.source, 'measured');
  const flows = step(report, 'flows');
  near(flows.qs, hemo.getScenario().co, 0.15, 'Fick Qs matches the scenario systemic flow');
  near(flows.qp / flows.qs, 2.16, 0.01, 'Qp/Qs from the two Fick flows');
  near(flows.shunt, flows.qp - flows.qs, 1e-9, 'shunt flow');
  const res = step(report, 'resistance');
  near(res.pvr, (samples.pa.pressure.mean - samples.pcwp.pressure.mean) / flows.qp, 1e-9, 'PVR uses pulmonary flow');
  assert.ok(res.pvr < 2.5, `ASD PVR low, got ${res.pvr.toFixed(2)}`);
  assert.ok(res.pvrSvrRatio < 1 / 3 && res.paspRatio < 0.5);
  assert.equal(report.verdict.class, 'closure');
  assert.equal(report.verdict.pvrAbove5, false);
}

// The pulmonary veins are reachable only across an atrial communication.
{
  assert.ok(captureSample(createHemodynamics('asd_left_to_right'), 'pv'), 'ASD: PV sampled across the defect');
  assert.equal(captureSample(createHemodynamics('normal'), 'pv'), null, 'intact septum: PV not reachable');
  const { report } = run('normal');
  assert.equal(step(report, 'ratio').pulmonaryVein.source, 'arterial');
  assert.equal(step(report, 'stepUp').value, null);
  assert.equal(report.verdict.class, 'not_significant');
}

// ASD with moderate pulmonary hypertension: individual decision.
{
  const { report } = run('asd_moderate_ph');
  assert.equal(step(report, 'stepUp').value.level, 'atrial');
  assert.ok(step(report, 'ratio').value >= 1.5, 'still a significant left-to-right shunt');
  const res = step(report, 'resistance');
  assert.ok(res.paspRatio >= 0.5 && res.paspRatio <= 2 / 3, `PASP ratio moderate, got ${res.paspRatio.toFixed(2)}`);
  assert.ok(res.pvrSvrRatio <= 2 / 3);
  assert.equal(report.verdict.class, 'case_by_case');
}

// Eisenmenger ASD: net right-to-left, systemic-level pulmonary pressure.
{
  const { hemo, report } = run('asd_eisenmenger');
  assert.ok(step(report, 'ratio').value < 1, 'net right-to-left');
  assert.equal(step(report, 'ratio').pulmonaryVein.source, 'measured');
  const flows = step(report, 'flows');
  assert.ok(flows.qp < flows.qs && flows.shunt < 0);
  near(flows.qs, hemo.getScenario().co, 0.15, 'Fick Qs matches the scenario systemic flow');
  const res = step(report, 'resistance');
  assert.ok(res.paspRatio > 2 / 3 && res.pvrSvrRatio > 2 / 3);
  assert.equal(report.verdict.class, 'contraindicated');
  assert.equal(report.verdict.pvrAbove5, true);
  // The scenario metrics use the same pulmonary flow, so the grid and the run agree.
  near(hemo.metrics().pvrWood, res.pvr, 0.6, 'metrics PVR agrees with the run');
}

// Without a pulmonary vein sample a desaturated arterial sample is not used as PV.
{
  const { report } = run('asd_eisenmenger', ['svc', 'ivc', 'ra', 'rv', 'pa', 'pcwp', 'ao']);
  assert.deepEqual(step(report, 'ratio').pulmonaryVein, { value: 98, source: 'assumed' });
}

console.log('PASS: shunt run gating, Fick flows, resistance ratios and ASD closure classes');

import assert from 'node:assert/strict';
import { CYCLE_SYNC as S } from '../src/cardiac-cycle.js';
import { createHemodynamics, realTimeMean, STATIONS } from '../src/hemodynamics.js';
import { SCENARIOS, SCENARIO_IDS, WAVEFORM_FLAGS } from '../src/hemo-scenarios.js';
import {
  fickOutput, gorlinArea, hakkiArea, mixedVenousSaturation, oximetryStepUp, pvrWood, qpQs, svrDyn
} from '../src/hemo-formulas.js';

// Formulas on textbook examples
const co = fickOutput({ vo2: 250, hb: 14, satArterial: 97, satVenous: 72 });
assert.ok(Math.abs(co - 5.25) < 0.1, `Fick output 5.2 L/min, got ${co.toFixed(2)}`);
assert.ok(Number.isNaN(fickOutput({ vo2: 250, hb: 14, satArterial: 70, satVenous: 75 })), 'negative AV difference is not an output');
assert.ok(Math.abs(mixedVenousSaturation(70, 78) - 72) < 1e-9, '(3 SVC + IVC) / 4');
assert.ok(Math.abs(qpQs({ arterial: 97, mixedVenous: 71.25, pulmonaryVein: 98, pulmonaryArtery: 85 }) - 1.98) < 0.02, 'Qp/Qs ~2 for an ASD run');
assert.equal(oximetryStepUp({ svc: 70, ivc: 75, ra: 85, rv: 85, pa: 85 }).level, 'atrial');
assert.equal(oximetryStepUp({ svc: 72, ivc: 78, ra: 75, rv: 87, pa: 87 }).level, 'ventricular');
assert.equal(oximetryStepUp({ svc: 72, ivc: 78, ra: 75, rv: 75, pa: 75 }), null);
const ava = gorlinArea({ flow: 4.0, hr: 72, period: 0.3, meanGradient: 50 });
assert.ok(ava > 0.5 && ava < 0.7, `Gorlin AVA ~0.6 cm2, got ${ava.toFixed(2)}`);
assert.ok(Math.abs(hakkiArea(4, 50) - 0.566) < 0.01, 'Hakki AVA');
assert.ok(Math.abs(pvrWood(48, 9, 4) - 9.75) < 1e-9, 'PVR Wood units');
assert.ok(Math.abs(svrDyn(93, 3, 5) - 1440) < 1e-9, 'SVR dyn');

// Every scenario builds and stays finite and physiologic
for (const id of SCENARIO_IDS) {
  const sc = SCENARIOS[id];
  for (const flag of sc.flags) assert.ok(WAVEFORM_FLAGS.includes(flag), `${id}: unknown flag ${flag}`);
  const hemo = createHemodynamics(id);
  for (const station of STATIONS) {
    for (let i = 0; i < 200; i++) {
      const p = hemo.pressure(station, i / 200, { insp: (i % 3) - 1 });
      assert.ok(Number.isFinite(p) && p > -5 && p < 300, `${id} ${station} finite`);
    }
  }
  const m = hemo.metrics();
  // A giant v wave (acute MR, acute LV failure) dominates the mean; the fit
  // keeps a and v at their targets and lands within ~2 mmHg of the mean.
  assert.ok(Math.abs(m.means.ra - sc.stations.ra.mean) < 0.6, `${id}: RA mean fitted (${m.means.ra.toFixed(1)} vs ${sc.stations.ra.mean})`);
  assert.ok(Math.abs(m.means.pcwp - sc.stations.pcwp.mean) < 2, `${id}: PCWP mean fitted (${m.means.pcwp.toFixed(1)} vs ${sc.stations.pcwp.mean})`);
  const lvMax = Math.max(...Array.from({ length: 200 }, (_, i) => hemo.pressure('lv', i / 200)));
  assert.ok(Math.abs(lvMax - sc.stations.lv.systolic) < 1.5, `${id}: LV systolic target (${lvMax.toFixed(1)})`);
  assert.ok(Math.abs(hemo.pressure('lv', S.ivcStart) - sc.stations.lv.edp) < 0.8, `${id}: LVEDP at mitral closure`);
  const aoMin = Math.min(...Array.from({ length: 200 }, (_, i) => hemo.pressure('ao', i / 200)));
  assert.ok(Math.abs(aoMin - sc.stations.ao.diastolic) < 1.5, `${id}: aortic diastolic target`);
}

// Normal: no gradients, normal resistances
{
  const m = createHemodynamics('normal').metrics();
  assert.ok(Math.abs(m.gradients.lvAoMean) < 3, 'no LV-Ao gradient');
  assert.equal(m.areas.aortic, null);
  assert.ok(m.pvrWood > 0.8 && m.pvrWood < 2, `normal PVR ${m.pvrWood.toFixed(2)} WU`);
  assert.ok(m.svrDyn > 900 && m.svrDyn < 1500, `normal SVR ${m.svrDyn.toFixed(0)}`);
  assert.ok(m.qpQs > 0.9 && m.qpQs < 1.1, 'no shunt');
}

// Aortic stenosis: gradient during ejection, small Gorlin area, late aortic peak
{
  const hemo = createHemodynamics('aortic_stenosis_severe');
  const m = hemo.metrics();
  assert.ok(m.gradients.lvAoMean > 40, `AS mean gradient ${m.gradients.lvAoMean.toFixed(0)}`);
  assert.ok(m.areas.aortic < 1.0, `AS valve area ${m.areas.aortic.toFixed(2)}`);
  const peakU = fn => Array.from({ length: 400 }, (_, i) => i / 400).reduce((b, u) => fn(u) > fn(b) ? u : b, 0);
  assert.ok(peakU(u => hemo.pressure('ao', u)) > peakU(u => createHemodynamics('normal').pressure('ao', u)), 'parvus et tardus: aortic peak is delayed');
  // Post-PVC beat: fixed obstruction, aortic pulse pressure rises
  const pp = (opts) => Math.max(...Array.from({ length: 200 }, (_, i) => hemo.pressure('ao', i / 200, opts))) - Math.min(...Array.from({ length: 200 }, (_, i) => hemo.pressure('ao', i / 200, opts)));
  assert.ok(pp({ postPvc: true }) > pp({}), 'fixed AS: post-PVC pulse pressure rises');
}

// HCM: spike-and-dome and Brockenbrough sign
{
  const hemo = createHemodynamics('hocm');
  const ao = u => hemo.pressure('ao', u);
  assert.ok(ao(0.565) > ao(0.66), 'spike then mid-systolic dip');
  assert.ok(ao(0.78) > ao(0.66), 'dome after the dip');
  const pp = (opts) => Math.max(...Array.from({ length: 200 }, (_, i) => hemo.pressure('ao', i / 200, opts))) - Math.min(...Array.from({ length: 200 }, (_, i) => hemo.pressure('ao', i / 200, opts)));
  assert.ok(pp({ postPvc: true }) < pp({}), 'Brockenbrough: post-PVC pulse pressure falls');
  const gradient = (opts) => realTimeMean(u => hemo.pressure('lv', u, opts) - hemo.pressure('ao', u, opts), 72, S.ejectionStart, S.ivrStart);
  assert.ok(gradient({ postPvc: true }) > gradient({}), 'post-PVC gradient increases');
}

// Mitral stenosis and regurgitation
{
  assert.equal(createHemodynamics('aortic_stenosis_severe').metrics().areas.mitral, null, 'no mitral area without mitral obstruction');
  assert.equal(createHemodynamics('hocm').metrics().areas.aortic, null, 'HOCM gradient is subvalvular: no Gorlin aortic valve area');
  assert.equal(createHemodynamics('mitral_stenosis_severe').metrics().areas.aortic, null, 'no aortic area without aortic obstruction');
  const ms = createHemodynamics('mitral_stenosis_severe').metrics();
  assert.ok(ms.gradients.lvPcwpMean > 10, `MS diastolic gradient ${ms.gradients.lvPcwpMean.toFixed(0)}`);
  assert.ok(ms.areas.mitral < 1.5, `MS valve area ${ms.areas.mitral.toFixed(2)}`);
  const mr = createHemodynamics('mitral_regurgitation_severe');
  const v = mr.pressure('pcwp', 0.97 + 0.06), a = mr.pressure('pcwp', 0.405 + 0.06);
  assert.ok(v > a + 15, 'MR: v wave dominates the wedge');
}

// Constriction vs restriction vs tamponade
{
  const cp = createHemodynamics('constrictive_pericarditis');
  const rv = u => cp.pressure('rv', u), lv = u => cp.pressure('lv', u);
  assert.ok(rv(0.045) < rv(0.25) - 5 && Math.abs(rv(0.25) - rv(0.40)) < 2, 'RV dip and plateau');
  assert.ok(Math.abs(lv(S.ivcStart) - rv(S.ivcStart)) <= 5, 'equalized end-diastolic pressures');
  assert.ok(cp.pressure('lv', 0.65, { insp: 1 }) < cp.pressure('lv', 0.65) && cp.pressure('rv', 0.65, { insp: 1 }) > cp.pressure('rv', 0.65), 'discordant LV/RV systolic change with inspiration');
  assert.ok(cp.pressure('ra', 0.30, { insp: 1 }) > cp.pressure('ra', 0.30), 'Kussmaul: RA rises on inspiration');
  const rcm = createHemodynamics('restrictive_cardiomyopathy').metrics();
  assert.ok(rcm.lvedpMinusRvedp > 5, 'restriction: LVEDP exceeds RVEDP by more than 5');
  const tp = createHemodynamics('tamponade');
  const y = tp.pressure('ra', 0.10), vWave = tp.pressure('ra', 0.97);
  assert.ok(vWave - y < 3, 'tamponade: blunted y descent');
  assert.ok(tp.pressure('ao', 0.65, { insp: 1 }) < tp.pressure('ao', 0.65) - 8, 'pulsus paradoxus');
}

// Pulmonary hypertension classification numbers
{
  const pre = createHemodynamics('precapillary_ph').metrics();
  assert.ok(pre.means.pa > 20 && pre.means.pcwp <= 15 && pre.pvrWood > 2, 'pre-capillary PH criteria');
  assert.ok(pre.dpg >= 7 && pre.tpg > 12, 'pre-capillary: high TPG and DPG');
  const post = createHemodynamics('postcapillary_ph').metrics();
  assert.ok(post.means.pa > 20 && post.means.pcwp > 15, 'post-capillary PH criteria');
  assert.ok(post.dpg < 7, 'isolated post-capillary: DPG below 7');
}

// Shunts and RV infarct
{
  assert.equal(createHemodynamics('asd_left_to_right').metrics().stepUp.level, 'atrial');
  assert.ok(createHemodynamics('asd_left_to_right').metrics().qpQs > 1.5, 'ASD Qp/Qs > 1.5');
  assert.equal(createHemodynamics('vsd_left_to_right').metrics().stepUp.level, 'ventricular');
  const rvi = createHemodynamics('rv_infarct').metrics();
  assert.ok(rvi.raPcwpRatio > 0.8, 'RV infarct: RA/PCWP ratio above 0.8');
}

console.log('PASS: hemodynamic scenarios, waveforms and formulas behave like the textbook cases');

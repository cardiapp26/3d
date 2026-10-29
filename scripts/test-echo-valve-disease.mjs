// Unit test for the severe valve disease data, quantification math and Doppler envelope model.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  VALVE_LESIONS, bernoulliGradient, meanGradientFromEnvelope, aorticValveAreaContinuity, dimensionlessIndex,
  mitralAreaPht, pisa, regurgitantFraction, phtFromDecel, evaluateLesion, dopplerVelocity, lesionColorJet,
} from '../src/echo-valve-disease.js';
import { renderSpectralDoppler } from '../src/echo-doppler.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const STATUSES = new Set(['severe', 'moderate', 'mild', 'normal']);
const bi = (o, what) => {
  assert.ok(o && typeof o.tr === 'string' && o.tr.length && typeof o.en === 'string' && o.en.length, `${what} bilingual`);
};

// Catalogue shape and bilingual text
const ids = VALVE_LESIONS.map((l) => l.id);
assert.deepEqual(ids, ['normal', 'as-severe', 'ar-severe', 'ms-severe', 'mr-severe-primary', 'mr-severe-secondary']);
for (const l of VALVE_LESIONS) {
  bi(l.label, `${l.id}.label`);
  bi(l.short, `${l.id}.short`);
  bi(l.teaching, `${l.id}.teaching`);
  bi(l.doppler.window, `${l.id}.doppler.window`);
  assert.ok(l.references.length > 0 && l.references.every((r) => typeof r === 'string' && r.length > 20), `${l.id} references`);
  assert.ok(l.measurements.length > 0, `${l.id} measurements`);
  for (const r of l.measurements) {
    bi(r.label, `${l.id}.${r.key}.label`);
    bi(r.threshold, `${l.id}.${r.key}.threshold`);
    assert.ok(Number.isFinite(r.value), `${l.id}.${r.key} value`);
    assert.ok(STATUSES.has(r.status), `${l.id}.${r.key} status`);
  }
  if (l.id !== 'normal') {
    assert.ok(['aortic-valve', 'mitral'].includes(l.valve), `${l.id} valve`);
    assert.ok(['stenosis', 'regurgitation'].includes(l.kind), `${l.id} kind`);
    assert.ok(l.jet && ['systole', 'diastole'].includes(l.jet.phase), `${l.id} jet`);
    assert.ok(lesionColorJet(l.id).active && lesionColorJet(l.id).phaseWindow.length === 2, `${l.id} colour jet`);
  }
}
assert.equal(lesionColorJet('normal').active, false);
assert.ok(VALVE_LESIONS.find((l) => l.id === 'mr-severe-primary').jet.eccentric > 0, 'flail P2 jet anterior');
assert.equal(VALVE_LESIONS.find((l) => l.id === 'mr-severe-secondary').jet.eccentric, 0, 'secondary MR central');

// Severe examples meet the severe criteria
const m = (id) => Object.fromEntries(evaluateLesion(id).measurements.map((r) => [r.key, r]));
const as = m('as-severe');
assert.ok(as.vmax.value >= 4 && as.meanPg.value >= 40 && as.ava.value < 1 && as.avai.value < 0.6 && as.dvi.value < 0.25, 'AS severe');
const ar = m('ar-severe');
assert.ok(ar.pht.value < 200 && ar.vc.value > 6 && ar.edv.value > 20 && ar.rvol.value >= 60 && ar.rf.value >= 50 && ar.eroa.value >= 0.3, 'AR severe');
const ms = m('ms-severe');
assert.ok(ms.mva.value <= 1.5 && mitralAreaPht(ms.pht.value) <= 1.5 && ms.pht.value >= 150 && ms.meanPg.value > 10, 'MS severe');
const mrp = m('mr-severe-primary');
assert.ok(mrp.eroa.value >= 0.4 && mrp.rvol.value >= 60 && mrp.rf.value >= 50 && mrp.vc.value >= 7 && mrp.pvS.value < 0, 'primary MR severe');
const mrs = m('mr-severe-secondary');
assert.ok(mrs.eroa.value >= 0.3 && mrs.rvol.value >= 45 && mrs.rf.value >= 50, 'secondary MR severe (ESC)');
for (const id of ids.slice(1)) {
  const main = evaluateLesion(id).measurements.filter((r) => ['vmax', 'ava', 'pht', 'mva', 'eroa'].includes(r.key));
  assert.ok(main.every((r) => r.status === 'severe'), `${id} key rows graded severe`);
}

// Math
assert.equal(bernoulliGradient(4), 64);
assert.equal(bernoulliGradient(4.6), 84.6);
const cont = aorticValveAreaContinuity({ lvotDiamCm: 2.1, lvotVtiCm: 20, avVtiCm: 100 });
assert.equal(cont.lvotAreaCm2, 3.46);
assert.equal(cont.avaCm2, 0.69);
assert.equal(dimensionlessIndex({ lvotVti: 20, avVti: 100 }), 0.2);
assert.equal(mitralAreaPht(220), 1);
assert.equal(mitralAreaPht(200), 1.1);
const p = pisa({ radiusCm: 1, aliasingCms: 40, peakVelCms: 500, vtiCm: 150 });
assert.equal(p.eroaCm2, 0.5);
assert.equal(p.rvolMl, 75);
assert.equal(regurgitantFraction(60, 120), 50);
assert.equal(phtFromDecel({ peakVelMs: 2.4, decelSlopeMs2: 2.4 }).decelTimeMs, 1000);
assert.equal(phtFromDecel({ peakVelMs: 2.4, decelSlopeMs2: 2.4 }).phtMs, 293);
const env = [1, 2, 3, 4, 5, 4, 3, 2, 1];
const meanV = env.reduce((a, b) => a + b, 0) / env.length;
assert.notEqual(meanGradientFromEnvelope(env), Math.round(4 * meanV * meanV * 10) / 10, 'mean of 4v² differs from 4·(mean v)²');
assert.ok(meanGradientFromEnvelope(env) > 4 * meanV * meanV);
assert.equal(meanGradientFromEnvelope([]), 0);

// Envelope signs and timing (apical window, positive toward transducer)
const v = (id, f, ch) => dopplerVelocity(id, f, ch);
assert.ok(v('as-severe', 0.25) <= -4, 'AS systolic jet away from apex');
assert.ok(Math.abs(v('as-severe', 0.02)) < 1, 'AS jet absent at QRS');
assert.ok(v('ar-severe', 0.6) > 3 && v('ar-severe', 0.9) > 0, 'AR diastolic jet toward apex');
assert.ok(v('ar-severe', 0.25) < 0, 'AR antegrade LVOT flow in systole');
assert.ok(v('ms-severe', 0.6) > 2 && v('ms-severe', 0.9) > 1, 'MS diastolic flow');
assert.ok(v('ms-severe', 0.95, 'cw') > dopplerVelocity('ms-severe', 0.95, 'cw', { af: true }), 'MS A wave lost in AF');
assert.ok(v('mr-severe-primary', 0.25) <= -5 && v('mr-severe-primary', 0.06) < -1, 'primary MR holosystolic');
assert.ok(v('mr-severe-secondary', 0.25) < -3.5, 'secondary MR systolic');
assert.ok(v('normal', 0.6, 'pw-mitral') > 0.6 && v('normal', 0.2, 'pw-lvot') < -0.7, 'normal inflow/LVOT');
assert.ok(v('ar-severe', 0.95, 'pw-desc-aorta') > 0.2, 'AR holodiastolic reversal');
assert.ok(Math.abs(v('normal', 0.95, 'pw-desc-aorta')) < 0.05, 'no late diastolic reversal normally');
assert.ok(v('mr-severe-primary', 0.25, 'pw-pulm-vein') < 0, 'primary MR pulmonary vein systolic reversal');
assert.ok(v('normal', 0.25, 'pw-pulm-vein') > 0.3, 'normal pulmonary vein S wave');
const sSec = v('mr-severe-secondary', 0.25, 'pw-pulm-vein');
assert.ok(sSec > 0 && sSec < v('normal', 0.25, 'pw-pulm-vein'), 'secondary MR blunted S');

// Renderer module loads in node and is a function
assert.equal(typeof renderSpectralDoppler, 'function');

// No em dash in sources
for (const f of ['src/echo-valve-disease.js', 'src/echo-doppler.js', 'scripts/test-echo-valve-disease.mjs']) {
  assert.ok(!readFileSync(root + f, 'utf8').includes(String.fromCharCode(0x2014)), `${f} contains U+2014`);
}

console.log(`PASS test-echo-valve-disease (${VALVE_LESIONS.length} lesions, AVA ${as.ava.value} cm², MVA ${ms.mva.value} cm², primary MR EROA ${mrp.eroa.value} cm², AR PHT ${ar.pht.value} ms)`);

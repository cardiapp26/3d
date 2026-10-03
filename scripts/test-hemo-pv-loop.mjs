// LV pressure-volume loop (src/hemo-pv-loop.js): the loop closes and runs
// counterclockwise, its vertical edges are isovolumetric (volume constant
// while pressure changes), its width is the scenario's stroke volume, the
// reference relations pass through the loop corners, and every scenario
// gives finite, physiologic numbers. Teaching checks, not validation.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CYCLE_SYNC as S } from '../src/cardiac-cycle.js';
import { createHemodynamics } from '../src/hemodynamics.js';
import { SCENARIO_IDS } from '../src/hemo-scenarios.js';
import { samplePvLoop, drawPvLoop, summaryLines, SCENARIO_EDV, REGURGITANT, VENTRICULAR_SHUNT } from '../src/hemo-pv-loop.js';
import { pvParams, pvModelLoop, PV_PRESETS } from '../src/hemo-pv-model.js';

const hemo = createHemodynamics('normal');
const loop = samplePvLoop(hemo, 240);
const sc = hemo.getScenario();
const sv = (sc.co * 1000) / sc.hr;
assert.ok(Math.abs(loop.sv - sv) < 1e-9, 'stroke volume = CO / HR');
assert.equal(loop.edv, SCENARIO_EDV.normal);
assert.ok(loop.ef > 0.55 && loop.ef < 0.7, `normal EF ${loop.ef.toFixed(2)}`);
assert.ok(loop.counterclockwise, 'loop runs counterclockwise in P-V coordinates');
assert.ok(loop.strokeWork > 5000 && loop.strokeWork < 12000, `stroke work ${Math.round(loop.strokeWork)} mmHg·ml`);

// Isovolumetric edges: volume constant during IVC and IVR while pressure moves.
const within = (a, b) => loop.points.filter(p => p.u >= a && p.u < b);
for (const [name, [a, b]] of Object.entries({ ivc: loop.phases.ivc, ivr: loop.phases.ivr })) {
  const seg = within(a, b);
  const vs = seg.map(p => p.v), ps = seg.map(p => p.p);
  assert.ok(Math.max(...vs) - Math.min(...vs) < 0.5, `${name}: volume constant`);
  assert.ok(Math.max(...ps) - Math.min(...ps) > 40, `${name}: pressure changes`);
}
// Width of the loop equals the stroke volume; ejection reduces the volume monotonically.
const vols = loop.points.map(p => p.v);
assert.ok(Math.abs(Math.max(...vols) - Math.min(...vols) - loop.sv) < 0.5, 'loop width = SV');
const eject = within(S.ejectionStart, S.ivrStart);
for (let i = 1; i < eject.length; i++) assert.ok(eject[i].v <= eject[i - 1].v + 1e-6, 'ejection: volume falls');
// Reference relations pass through the end-systolic and end-diastolic corners.
assert.ok(Math.abs(loop.espvr(loop.esv) - loop.esp) < 1e-6, 'ESPVR through the ES point');
assert.ok(Math.abs(loop.edpvr(loop.edv) - loop.edp) < 1e-6, 'EDPVR through the ED point');
assert.ok(loop.ees > 0 && loop.ea > 0);
assert.ok(loop.ea / loop.ees > 0.3 && loop.ea / loop.ees < 1.5, `normal coupling Ea/Ees ${(loop.ea / loop.ees).toFixed(2)}`);

// Every scenario: finite values, ESV positive, EF in (0, 1); AS taller, acute LV failure lower EF.
const byId = {};
for (const id of SCENARIO_IDS) {
  const h = createHemodynamics(id);
  const l = samplePvLoop(h, 120);
  byId[id] = l;
  assert.ok(l.esv >= 10 && l.edv > l.esv && l.ef > 0.1 && l.ef < 0.9, `${id}: volumes (EDV ${l.edv}, ESV ${l.esv.toFixed(0)})`);
  assert.ok(l.points.every(p => Number.isFinite(p.v) && Number.isFinite(p.p)), `${id}: finite`);
  assert.ok(l.counterclockwise, `${id}: counterclockwise`);
  assert.equal(l.forwardOnly, REGURGITANT.includes(id));
}
assert.ok(byId.aortic_stenosis_severe.esp > byId.normal.esp + 30, 'aortic stenosis: taller loop');
assert.ok(byId.acute_lv_failure.ef < byId.normal.ef - 0.2, 'acute LV failure: lower EF, loop shifted right');
assert.ok(byId.acute_lv_failure.edv > byId.normal.edv);

// Drawing: a canvas stub records the pixel size; the function returns the plot frame.
const calls = [];
const ctx = new Proxy({}, { get: (_, key) => (key === 'measureText' ? () => ({ width: 10 }) : (...args) => { calls.push(key); return undefined; }), set: () => true });
const canvas = { clientWidth: 320, clientHeight: 220, width: 0, height: 0, getContext: () => ctx };
const frame = drawPvLoop(canvas, loop, { phase: 0.6, lang: 'en', dpr: 2 });
assert.equal(canvas.width, 640);
assert.ok(frame && frame.right > frame.left && frame.bottom > frame.top);
assert.ok(calls.includes('arc') && calls.includes('fillText'), 'cursor and labels drawn');

// The two sources agree on the normal heart, so switching the source does not change the story.
const model = pvModelLoop(pvParams({}, 'normal'));
assert.ok(Math.abs(model.edv - loop.edv) < 1e-9 && Math.abs(model.sv - loop.sv) < 0.5 && Math.abs(model.ef - loop.ef) < 0.01, 'normal: EDV, SV and EF match across the sources');
assert.ok(Math.abs(model.esp - loop.esp) < 1 && Math.abs(model.ees - loop.ees) < 0.1 && Math.abs(model.ea - loop.ea) < 0.05, 'normal: ESP, Ees and Ea match across the sources');
assert.ok(Math.abs(model.peak - Math.max(...loop.points.map(q => q.p))) < 5, 'normal: peak LV pressure matches within 5 mmHg');
assert.equal(PV_PRESETS.normal.edv, SCENARIO_EDV.normal);

// A ventricular shunt adds its flow to the LV stroke volume (systemic SV x Qp/Qs); an atrial shunt does not.
const vsdHemo = createHemodynamics('vsd_left_to_right');
const vsd = samplePvLoop(vsdHemo, 240);
const qpqs = vsdHemo.metrics().qpQs, sysSv = (vsdHemo.getScenario().co * 1000) / vsdHemo.getScenario().hr;
assert.ok(VENTRICULAR_SHUNT.includes('vsd_left_to_right') && !VENTRICULAR_SHUNT.includes('asd_left_to_right'));
assert.ok(Math.abs(vsd.sv - sysSv * qpqs) < 1e-9 && vsd.sv > 1.8 * sysSv, `VSD: LV stroke volume ${vsd.sv.toFixed(0)} ml = ${sysSv.toFixed(0)} x ${qpqs.toFixed(2)}`);
assert.ok(Math.abs(Math.max(...vsd.points.map(p => p.v)) - Math.min(...vsd.points.map(p => p.v)) - vsd.sv) < 0.5, 'VSD: loop width = total LV stroke volume');
assert.ok(vsd.ef > 0.5 && vsd.ef < 0.75 && vsd.shunt && Math.abs(vsd.shunt.systemicSv - sysSv) < 1e-9, 'VSD: EF stays physiologic, systemic volume kept');
const asdHemo = createHemodynamics('asd_left_to_right');
assert.ok(Math.abs(samplePvLoop(asdHemo).sv - (asdHemo.getScenario().co * 1000) / asdHemo.getScenario().hr) < 1e-9, 'ASD: the LV ejects the systemic flow only');

// Rhythm: atrial fibrillation drops the late-diastolic atrial filling; the corners and width stay the scenario\'s.
const af = samplePvLoop(hemo, 240, { rhythm: 'afib' });
const at = (l, u) => l.points[Math.floor(u * l.points.length)].v;
assert.ok(Math.abs(af.sv - loop.sv) < 1e-9 && Math.abs(af.edv - loop.edv) < 1e-9, 'AF: same SV and EDV');
assert.ok(at(af, 0.38) !== at(loop, 0.38) && Math.abs(at(af, 0.38) - at(loop, 0.38)) > 1, 'AF: the filling curve differs from sinus');
// Closed loop in every scenario: the seam is one sample step.
for (const id of SCENARIO_IDS) {
  const l = samplePvLoop(createHemodynamics(id), 240), a = l.points[0], b = l.points.at(-1);
  assert.ok(Math.abs(a.v - b.v) < 3 && Math.abs(a.p - b.p) < 10, `${id}: closes within one sample`);
}

// Canvas text: forward values are labelled forward, leaks and shunts are named, and nothing is drawn outside the canvas.
const mrLines = summaryLines(samplePvLoop(createHemodynamics('mitral_regurgitation_severe')), 'en');
assert.ok(/^forward SV \d+ ml · forward EF \d+%$/.test(mrLines[0]) && !/Ees|Ea /.test(mrLines[0]) && /not modeled/.test(mrLines[1]), `scenario MR header: ${mrLines[0]}`);
assert.ok(summaryLines(model, 'en').length === 1 && /^SV 81 ml · EF 63%/.test(summaryLines(model, 'en')[0]), 'normal header');
const mrModel = summaryLines(pvModelLoop(pvParams({}, 'mitral-regurgitation-acute')), 'en');
assert.ok(/^SV 110 ml/.test(mrModel[0]) && /forward SV 83 ml · regurgitant 28 ml/.test(mrModel[1]), `model MR header: ${mrModel.join(' | ')}`);
assert.ok(/systemic SV 65 ml × Qp\/Qs 1\.9/.test(summaryLines(vsd, 'en').join(' ')), 'VSD header names the systemic volume and Qp/Qs');
for (const lang of ['tr', 'en']) for (const l of [loop, vsd, mrLines && samplePvLoop(createHemodynamics('aortic_regurgitation_severe')), pvModelLoop(pvParams({}, 'aortic-regurgitation'))]) {
  assert.ok(summaryLines(l, lang).every(t => t && !t.includes('NaN') && !t.includes('undefined') && !t.includes('\u2014')), `${lang}: header text is clean`);
}
// Layout at the smallest CSS size (360 x 260): record the text and rectangles.
for (const [id, data, ghost] of [['hypovolemia', pvModelLoop(pvParams({}, 'hypovolemia')), pvModelLoop(pvParams({}, 'normal'))], ['AR', pvModelLoop(pvParams({}, 'aortic-regurgitation')), pvModelLoop(pvParams({}, 'normal'))], ['AS scenario', samplePvLoop(createHemodynamics('aortic_stenosis_severe')), null], ['VSD', vsd, null]]) {
  const texts = [], rects = [];
  const rec = new Proxy({}, { get: (_, key) => (key === 'measureText' ? t => ({ width: String(t).length * 4.4 }) : key === 'fillText' || key === 'strokeText' ? (t, x, y) => { texts.push({ t, x, y }); } : key === 'fillRect' ? (x, y, w, h) => { rects.push({ x, y, w, h }); } : () => undefined), set: () => true });
  const cv = { clientWidth: 360, clientHeight: 260, width: 0, height: 0, getContext: () => rec };
  const frame = drawPvLoop(cv, data, { phase: 0.3, lang: 'en', dpr: 1, ghost });
  const edvLabel = texts.find(q => q.t.startsWith('EDV')), esvLabel = texts.find(q => q.t.startsWith('ESV'));
  assert.ok(texts.every(q => q.y > 0 && q.y <= 260 && q.x >= 0 && q.x <= 360), `${id}: every label is on the canvas`);
  assert.ok(edvLabel.y <= frame.bottom, `${id}: the EDV label stays inside the plot, not on the axis numbers`);
  assert.ok(esvLabel.y >= frame.top, `${id}: the ESV label stays under the header lines`);
  const legend = rects.filter(q => q.h === 3);
  assert.ok(legend.length === 4 && legend.every(q => q.y > frame.bottom), `${id}: the phase legend sits under the plot, off the filling limb`);
  const axisNumbers = texts.filter(q => /^\d+$/.test(q.t) && Math.abs(q.y - (frame.bottom + 10)) < 0.01);
  assert.ok(axisNumbers.length > 3 && texts.filter(q => q.y === frame.bottom + 21).length === 4, `${id}: axis numbers and legend labels on separate rows`);
}

for (const file of ['../src/hemo-pv-loop.js']) assert.ok(!readFileSync(new URL(file, import.meta.url), 'utf8').includes('\u2014'), 'no em dash');
console.log('PASS hemo-pv-loop: counterclockwise closed loop, isovolumetric edges, width = SV, ESPVR/EDPVR through the corners, every scenario physiologic, drawing frame');

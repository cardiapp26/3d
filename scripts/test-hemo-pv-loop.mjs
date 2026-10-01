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
import { samplePvLoop, drawPvLoop, SCENARIO_EDV, REGURGITANT } from '../src/hemo-pv-loop.js';

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

for (const file of ['../src/hemo-pv-loop.js']) assert.ok(!readFileSync(new URL(file, import.meta.url), 'utf8').includes('\u2014'), 'no em dash');
console.log('PASS hemo-pv-loop: counterclockwise closed loop, isovolumetric edges, width = SV, ESPVR/EDPVR through the corners, every scenario physiologic, drawing frame');

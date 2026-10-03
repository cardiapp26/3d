// Interactive P-V model (src/hemo-pv-model.js): coupling gives the end-systolic
// point, each control moves the loop the textbook way, and every condition
// preset reproduces its characteristic shape. Teaching checks, not validation.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PV_PRESETS, PV_LIMITS, PV_V0, pvParams, pvModelLoop } from '../src/hemo-pv-model.js';

const loop = (id, over = {}) => pvModelLoop(pvParams(over, id));
const normal = loop('normal');

// Coupling: ESV = (Ees·V0 + Ea·EDV)/(Ees + Ea); the ES point sits on the ESPVR; Ea = ESP / SV.
const p = pvParams({}, 'normal');
assert.ok(Math.abs(normal.esv - (p.ees * PV_V0 + p.ea * p.edv) / (p.ees + p.ea)) < 1e-9, 'coupling formula');
assert.ok(Math.abs(normal.espvr(normal.esv) - normal.esp) < 1e-9, 'ES point on the ESPVR');
assert.ok(Math.abs(normal.esp / normal.sv - p.ea) < 1e-9, 'Ea = ESP / SV');
assert.ok(normal.ef > 0.5 && normal.ef < 0.65, `normal EF ${normal.ef.toFixed(2)}`);
assert.ok(normal.counterclockwise, 'counterclockwise');

// Controls: preload raises SV along the same ESPVR; contractility lowers ESV; afterload raises ESP and lowers SV; stiffness raises EDP.
assert.ok(loop('normal', { edv: 150 }).sv > normal.sv, 'preload up: SV up');
assert.ok(loop('normal', { ees: 4 }).esv < normal.esv, 'contractility up: ESV down');
const highEa = loop('normal', { ea: 3 });
assert.ok(highEa.esp > normal.esp && highEa.sv < normal.sv, 'afterload up: ESP up, SV down');
assert.ok(loop('normal', { stiffness: 0.045 }).edp > normal.edp, 'stiffer EDPVR: EDP up');
// Out-of-range inputs are clamped.
assert.equal(pvParams({ edv: 9999 }, 'normal').edv, PV_LIMITS.edv[1]);
assert.equal(pvParams({}, 'unknown').edv, PV_PRESETS.normal.edv);

// Conditions.
const hfref = loop('hfref-decompensated');
assert.ok(hfref.ef < 0.3 && hfref.edv > normal.edv && hfref.edp > 20, `decompensated HFrEF: EF ${hfref.ef.toFixed(2)}, EDP ${hfref.edp.toFixed(0)}`);
assert.ok(hfref.ea / hfref.ees > 2, 'decompensated HFrEF: uncoupled (Ea/Ees > 2)');
const hfpef = loop('hfpef');
assert.ok(hfpef.ef > 0.5 && hfpef.edp > 20 && hfpef.edv < normal.edv + 5, 'HFpEF: preserved EF, high EDP at a normal EDV');
const as = loop('aortic-stenosis');
assert.ok(Math.max(...as.points.map(q => q.p)) > 180, 'aortic stenosis: tall loop');
const ar = loop('aortic-regurgitation');
assert.ok(ar.edv > 200 && ar.sv > 1.5 * normal.sv, 'aortic regurgitation: wide loop shifted right');
const seg = (l, [a, b]) => l.points.filter(q => q.u >= a && q.u < b).map(q => q.v);
const span = vs => Math.max(...vs) - Math.min(...vs);
assert.ok(span(seg(ar, ar.phases.ivr)) > 10, 'aortic regurgitation: no true isovolumic relaxation');
const mr = loop('mitral-regurgitation-acute');
assert.ok(span(seg(mr, mr.phases.ivc)) > 10, 'acute MR: no true isovolumic contraction');
assert.ok(span(seg(normal, normal.phases.ivc)) < 0.5 && span(seg(normal, normal.phases.ivr)) < 0.5, 'normal: both isovolumic edges vertical');
const hypo = loop('hypovolemia');
assert.ok(hypo.sv < normal.sv && Math.abs(hypo.ees - normal.ees) < 1e-9, 'hypovolaemia: lower SV on the same ESPVR');
assert.ok(loop('inotrope').ef > normal.ef + 0.05, 'inotrope: higher EF');

// Every loop closes: the last sample is one sample step from the first (AR refills during relaxation, so filling starts from that volume).
for (const id of Object.keys(PV_PRESETS)) {
  const l = loop(id), a = l.points[0], b = l.points.at(-1);
  assert.ok(Math.abs(a.v - b.v) < 1.5 && Math.abs(a.p - b.p) < 2, `${id}: the loop closes (dV ${(a.v - b.v).toFixed(2)}, dP ${(a.p - b.p).toFixed(2)})`);
}
const arSegments = [seg(ar, ar.phases.ivr), seg(ar, [0, ar.phases.ivc[0]])];
assert.ok(Math.abs(arSegments[0].at(-1) - arSegments[1][0]) < 1.5, 'AR: filling starts where the relaxation refill ended');
assert.ok(Math.abs(ar.regurgVolume - 0.18 * ar.sv) < 1e-9 && Math.abs(ar.forwardSv - 0.82 * ar.sv) < 1e-9, 'AR: refill volume = regurgitant volume');
assert.ok(Math.abs(mr.regurgVolume - 0.25 * mr.sv) < 1e-9 && mr.forwardSv < mr.sv, 'acute MR: forward SV is below the total SV');
assert.equal(normal.regurgVolume, 0, 'no leak in a normal loop');

// Stiffness slider sweep on every condition: EDP follows the slider upward, stays in a filling-pressure range, and the systolic arch does not move.
for (const id of Object.keys(PV_PRESETS)) {
  let last = -1;
  const base = loop(id);
  for (let k = PV_LIMITS.stiffness[0]; k <= PV_LIMITS.stiffness[1] + 1e-9; k += 0.005) {
    const l = loop(id, { stiffness: k });
    assert.ok(l.edp >= last - 1e-9, `${id}: EDP rises with stiffness (${k.toFixed(3)})`);
    assert.ok(l.edp <= 36, `${id}: EDP ${l.edp.toFixed(1)} stays below 36 mmHg at stiffness ${k.toFixed(3)}`);
    assert.ok(Math.abs(l.peak - base.peak) < 0.5 && Math.abs(l.ef - base.ef) < 1e-9, `${id}: stiffness leaves the systolic arch and EF alone`);
    last = l.edp;
  }
  assert.ok(Math.abs(loop(id, { stiffness: PV_PRESETS[id].stiffness }).edp - PV_PRESETS[id].edp) < 1e-9, `${id}: the preset stiffness gives the preset EDP`);
}
assert.ok(Math.abs(loop('hfpef').edp - 25) < 1e-9 && loop('normal', { stiffness: 0.045 }).edp < 25, 'HFpEF stays above a normal ventricle at the same exponent');

// Normal matches the catheter scenario's normal (EDV 130, SV 81, EF 63%, ESP 90, Ees 2.3, Ea 1.1).
assert.ok(Math.abs(normal.edv - 130) < 1e-9 && Math.abs(normal.sv - 81.4) < 0.5 && Math.abs(normal.ef - 0.626) < 0.005 && Math.abs(normal.esp - 90) < 1, 'model normal = scenario normal');
assert.ok(normal.peak > normal.esp * 1.2 && normal.peak < 125, 'ESP sits below the peak systolic pressure');
// Corner of the sliders: the ESV floor binds, and the labelled Ea is the drawn loop\'s ESP / SV.
const corner = loop('normal', { edv: 60, ees: 5, ea: 0.5 });
assert.ok(Math.abs(corner.ea - corner.esp / corner.sv) < 1e-9 && corner.ea > 0.5, 'floor-bound corner reports the drawn Ea');
for (const id of Object.keys(PV_PRESETS)) {
  const l = loop(id);
  assert.ok(l.points.every(q => Number.isFinite(q.v) && Number.isFinite(q.p) && q.p >= 0), `${id}: finite`);
  assert.ok(l.counterclockwise && l.esv > PV_V0, `${id}: counterclockwise, ESV above V0`);
}

assert.ok(!readFileSync(new URL('../src/hemo-pv-model.js', import.meta.url), 'utf8').includes('\u2014'), 'no em dash');
console.log('PASS hemo-pv-model: coupling, preload/contractility/afterload/stiffness responses, HFrEF/HFpEF/AS/AR/acute MR/hypovolaemia/inotrope shapes');

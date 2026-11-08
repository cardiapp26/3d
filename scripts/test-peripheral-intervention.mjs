// Endovascular procedure model (src/angio/peripheral/peripheral-intervention.js) and its text.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  PERI_PROCEDURE_SPECS, advanceCatheter, advanceWire, chooseAccess, chooseWire, createProcedure, deflate, deployStent,
  diameterOptions, positionBalloon, procedureOverlay, pullback, qca, runCompletion, setBalloon, setPrep, setPressure,
  setStent, stentWarnings, translesionalGradient, treatLesion, uncoveredMm
} from '../src/angio/peripheral/peripheral-intervention.js';
import { PERI_INTERVENTION_TEXT as TEXT } from '../src/angio/peripheral/peripheral-intervention-text.js';
import { PERIPHERAL_LESIONS } from '../src/angio/peripheral/peripheral-sim.js';

const lesion = (id) => PERIPHERAL_LESIONS.find((l) => l.id === id);
const inflate = (s, p) => deflate(setPressure(positionBalloon(s), p));

// Every scenario except "none" has a procedure spec, and the spec's access options are rated.
for (const l of PERIPHERAL_LESIONS.filter((x) => x.id !== 'none')) {
  const spec = PERI_PROCEDURE_SPECS[l.id];
  assert.ok(spec, `spec for ${l.id}`);
  assert.ok(Object.values(spec.access).includes('best'), `${l.id} has a recommended access`);
  assert.ok(diameterOptions(spec).includes(spec.refMm), `${l.id} offers its reference diameter`);
}
assert.equal(createProcedure(lesion('none')), null, 'no procedure without a lesion');

// Gradient: iliac criterion, rest >= 10 or vasodilator >= 20 mmHg.
assert.equal(translesionalGradient(50).significant, false);
assert.equal(translesionalGradient(50, { ntg: true }).significant, false);
assert.equal(translesionalGradient(70).significant, true);
assert.ok(translesionalGradient(80, { ntg: true }).gradient > translesionalGradient(80).gradient, 'NTG raises the gradient');
assert.ok(translesionalGradient(99, { ntg: true }).gradient <= 90, 'gradient is capped');

// Immutability: actions return new states.
const base = createProcedure(lesion('right-cia-ostial'));
const crossed = advanceWire(base);
assert.notEqual(crossed, base);
assert.equal(base.crossed, false);
assert.equal(crossed.crossed, true);
assert.equal(Object.isFrozen(crossed), true);

// Access and wire: the diseased CFA is not punctured, 0.035" does not go below the knee.
const cfaRetro = advanceWire(chooseAccess(createProcedure(lesion('cfa-bifurcation-plaque')), 'femoral-retro'));
assert.equal(cfaRetro.crossed, false);
assert.equal(cfaRetro.crossingFailed, 'access');
const btkThick = advanceWire(chooseWire(createProcedure(lesion('btk-at-clti')), '0.035'));
assert.equal(btkThick.crossingFailed, 'wire');
assert.equal(advanceWire(createProcedure(lesion('btk-at-clti'))).crossed, true);

// Occlusion: no flow until crossed, then a wire channel.
const cto = createProcedure(lesion('sfa-hunter-cto'));
assert.equal(qca(cto).flow, 'none');
assert.equal(advanceWire(cto).pct, 95);

// Pullback needs the catheter beyond the lesion.
assert.equal(pullback(crossed).gradient, null);
const measured = pullback(advanceCatheter(crossed));
assert.equal(measured.gradient.gradient, translesionalGradient(80).gradient);
assert.equal(measured.gradient.significant, true);

// Severe calcium, no preparation, semi-compliant balloon at RBP: the waist holds, residual stays high.
let cfa = setBalloon(advanceWire(createProcedure(lesion('cfa-bifurcation-plaque'))), { type: 'semi' });
cfa = inflate(cfa, 14);
assert.ok(cfa.pct >= 50, `waist holds: residual ${cfa.pct}%`);
// After IVL, a DCB meets the no-stent criteria (residual <= 30%, no flow-limiting dissection).
let dcb = treatLesion(setPrep(advanceWire(createProcedure(lesion('cfa-bifurcation-plaque'))), { device: 'ivl', cycles: 6 }));
assert.ok(dcb.calcium < 1.5, `IVL modifies calcium (${dcb.calcium})`);
dcb = inflate(setBalloon(dcb, { type: 'dcb' }), 8);
assert.ok(dcb.pct <= 30, `DCB residual ${dcb.pct}%`);
assert.equal(dcb.dcbResult, 'ok');
dcb = runCompletion(dcb);
assert.equal(dcb.completion.outcome, 'success');
assert.ok(dcb.completion.feedback.includes('fbDcbOk'));
assert.ok(dcb.completion.feedback.includes('fbNoGradient'), 'missing gradient is flagged');

// Oversized balloon at RBP in a calcified aortoiliac lesion ruptures; a covered stent seals it.
let rupture = inflate(setBalloon(advanceWire(createProcedure(lesion('leriche-tasc-d'))), { diameter: 10 }), 14);
assert.equal(rupture.perforation, true);
assert.equal(qca(rupture).flow, 'extravasation');
rupture = deployStent(setStent(rupture, { type: 'covered', diameter: 8 }));
assert.equal(rupture.perforationSealed, true);
assert.notEqual(qca(rupture).flow, 'extravasation');

// Geographic miss: an off-centre balloon leaves more residual than a centred one.
const centred = inflate(advanceWire(createProcedure(lesion('right-cia-ostial'))), 8);
const offset = inflate(setBalloon(advanceWire(createProcedure(lesion('right-cia-ostial'))), { length: 20, offset: 25 }), 8);
assert.ok(uncoveredMm(PERI_PROCEDURE_SPECS['right-cia-ostial'], 20, 25) > 0);
assert.ok(offset.pct > centred.pct, `miss ${offset.pct}% > centred ${centred.pct}%`);

// Stent warnings by bed and type.
assert.ok(stentWarnings(advanceWire(createProcedure(lesion('cfa-bifurcation-plaque')))).includes('cfaNoStent'));
assert.ok(stentWarnings(setStent(createProcedure(lesion('sfa-hunter-cto')), { type: 'be' })).includes('beCrush'));
assert.ok(stentWarnings(setStent(createProcedure(lesion('renal-ostial-ras')), { type: 'se' })).includes('seOstial'));

// Full iliac case: balloon then balloon-expandable stent gives a good result; the balloon is withdrawn.
let iliac = inflate(advanceWire(createProcedure(lesion('right-cia-ostial'))), 8);
iliac = deployStent(iliac);
assert.equal(iliac.balloon.positioned, false);
assert.ok(iliac.pct < 20);
iliac = runCompletion(iliac);
assert.equal(iliac.completion.outcome, 'success');
const overlay = procedureOverlay(iliac);
assert.equal(overlay.wire, true);
assert.equal(overlay.stent.type, 'be');
assert.equal(overlay.balloon, null);

// Severity restarts at the chosen narrowing.
assert.equal(createProcedure(lesion('right-cia-ostial'), 50).pct, 50);
assert.equal(createProcedure(lesion('right-cia-ostial'), 100).pct, 100);

// Text: both languages carry the same keys; every log code has a line; no em dash.
const keys = (o) => Object.keys(o).sort();
for (const group of ['accessNames', 'rating', 'wireNames', 'prepNames', 'balloonNames', 'stentNames', 'notes', 'feedback', 'log', 'flow', 'outcome', 'dissection']) {
  assert.deepEqual(keys(TEXT.tr[group]), keys(TEXT.en[group]), `same ${group} keys`);
}
const codes = ['wireFailAccess', 'wireFailSize', 'wireCross', 'wireCrossCto', 'catheterBeyond', 'gradientRest', 'gradientNtg', 'prepDone', 'balloonPositioned', 'balloonDeflated', 'stentDeployed', 'completion'];
for (const code of codes) assert.equal(typeof TEXT.tr.log[code], 'function', `log ${code}`);
for (const entry of [...dcb.log, ...rupture.log, ...iliac.log, ...cfaRetro.log]) {
  for (const lang of ['tr', 'en']) assert.ok(TEXT[lang].log[entry.code](entry.data).length > 10, `${lang} ${entry.code}`);
}
for (const file of ['peripheral-intervention.js', 'peripheral-intervention-text.js', 'peripheral-intervention-panel.js', 'peripheral-intervention.css']) {
  assert.ok(!fs.readFileSync(new URL(`../src/angio/peripheral/${file}`, import.meta.url), 'utf8').includes('—'), `no em dash in ${file}`);
}

console.log('PASS peripheral intervention model: access, gradient, calcium waist, IVL + DCB, rupture + covered stent, geographic miss, stent zones, text');

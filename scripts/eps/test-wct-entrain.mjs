import assert from 'node:assert/strict';
import { WCT_EXAMPLES, WCT_TEXT, WCT_SOURCE, wctRecording, wctMeasurements } from '../../src/eps/wct-entrain-recordings.js';
import { resolveRef } from '../../src/eps/ep-caliper.js';
import { buildLadder, inferLadderEvents } from '../../src/eps/ep-ladder.js';

for (const [id] of WCT_EXAMPLES) {
  const recording = wctRecording(id);
  assert.equal(recording.id, id);
  assert.ok(Array.isArray(recording.markers), `${id}: marker list`);
  for (const channel of recording.channels) assert.ok(recording.events[channel]?.length, `${id} channel ${channel}`);
  for (const events of Object.values(recording.events)) {
    for (const event of events) assert.ok(event.t >= 0 && event.t <= recording.windowMs, `${id}: ${event.t} in window`);
  }
  for (const c of recording.calipers) {
    assert.ok(resolveRef(recording, c.a), `${id}: ${c.label} start`);
    assert.ok(resolveRef(recording, c.b), `${id}: ${c.label} end`);
  }
  assert.ok(buildLadder(inferLadderEvents(recording.events, { mechanism: recording.mechanism }),
    { until: recording.windowMs }).links.length > 0, `${id}: conduction ladder`);
  for (const lang of ['tr', 'en']) assert.ok(WCT_TEXT[id][lang].length > 100, `${id} ${lang} text`);
}

// 1. WCT: sinus HV as reference, VT with retrograde His, AV dissociation and an early narrow capture beat (Ho figs 17-10, 17-17).
const wct = wctRecording('wct-vt-vs-svt');
const wctM = wctMeasurements(wct);
assert.equal(wct.mechanism, 'vt-scar');
assert.equal(wctM['HV (sinüs)'], 50, 'conducted sinus beat: HV 50 ms');
assert.equal(wctM['TCL (VT)'], 380, 'VT cycle length 380 ms');
assert.equal(wctM['V-H (VT retrograd)'], 40, 'VT: His after the V onset');
assert.equal(wctM['P-P (sinüs)'], 640, 'sinus P waves at their own rate');
assert.equal(wctM['HV (capture)'], 50, 'capture beat: normal HV');
const qrs = wct.events['ecg-ii'].filter((e) => e.type === 'V');
const capture = qrs.at(-1), lastVt = qrs.at(-2);
assert.ok(capture.t - lastVt.t < wctM['TCL (VT)'], 'capture beat comes early');
assert.ok(capture.sigma < lastVt.sigma, 'capture beat is narrower than the VT');
const sinusA = wct.events.hra.filter((e) => e.type === 'A').map((e) => e.t);
assert.ok(sinusA.every((t, i) => i === 0 || t - sinusA[i - 1] === wctM['P-P (sinüs)']), 'sinus A at a constant rate (the capture A included)');

// 2. Scar VT: a central isthmus site (Ho fig 20-11; Stevenson 1993).
const scar = wctRecording('scar-vt-entrain');
const scarM = wctMeasurements(scar);
assert.equal(scar.mechanism, 'vt-scar');
assert.equal(scarM.TCL, 400);
assert.equal(scarM.PCL, 370);
assert.equal(scarM['PPI−TCL'], 10, 'PPI - TCL <= 30 ms: in the circuit');
assert.ok(Math.abs(scarM['S-QRS − MDP-QRS']) <= 20, 'S-QRS matches EGM-QRS: not a bystander');
const ratio = scarM['S-QRS'] / scarM.TCL;
assert.ok(ratio >= 0.3 && ratio <= 0.5, `S-QRS / TCL ${ratio}: central isthmus`);
for (const id of ['wct-vt-vs-svt', 'scar-vt-entrain']) for (const lang of ['tr', 'en']) assert.ok(!/gizli/i.test(WCT_TEXT[id][lang]), `${id} ${lang}: "concealed", not "gizli"`);

console.log(`PASS wct-entrain: ${WCT_EXAMPLES.length} recordings verified with event-derived calipers and ladder`);

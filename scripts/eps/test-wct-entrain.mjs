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

// 1. Check WCT vs SVT measurements (HV interval)
const wct = wctRecording('wct-vt-vs-svt');
const wctM = wctMeasurements(wct);
assert.equal(wctM['HV (Aberrans)'], 50, 'Aberrant SVT HV is normal (50 ms)');
assert.equal(wctM['TCL (VT)'], 380, 'VT cycle length is 380 ms');
assert.equal(wctM['V-H (VT retrograd)'], 40, 'Retrograde His occurs after ventricular onset');

// 2. Check Scar VT entrainment measurements (Ho Ch 20 / Stevenson 1993)
const scar = wctRecording('scar-vt-entrain');
const scarM = wctMeasurements(scar);
assert.equal(scarM.TCL, 400, 'VT TCL is 400 ms');
assert.equal(scarM.PCL, 370, 'Overdrive pacing PCL is 370 ms');
assert.equal(scarM.PPI, 410, 'PPI from ABL is 410 ms');
assert.equal(scarM['PPI−TCL'], 10, 'PPI - TCL is 10 ms (<= 30 ms proves isthmus site)');
assert.equal(scarM['S-QRS'], 110, 'Stimulus to QRS is 110 ms');
assert.equal(scarM['MDP-QRS'], 110, 'Mid-diastolic potential to QRS is 110 ms (S-QRS == MDP-QRS)');

console.log(`PASS wct-entrain: ${WCT_EXAMPLES.length} recordings verified with event-derived calipers and ladder`);

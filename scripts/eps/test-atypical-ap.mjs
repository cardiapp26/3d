import assert from 'node:assert/strict';
import { ATYPICAL_PHENOMENA_EXAMPLES, ATYPICAL_PHENOMENA_TEXT, atypicalPhenomenaRecording, atypicalPhenomenaMeasurements } from '../../src/eps/atypical-ap-phenomena.js';
import { resolveRef } from '../../src/eps/ep-caliper.js';
import { buildLadder, inferLadderEvents } from '../../src/eps/ep-ladder.js';

for (const [id] of ATYPICAL_PHENOMENA_EXAMPLES) {
  const recording = atypicalPhenomenaRecording(id);
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
  for (const lang of ['tr', 'en']) assert.ok(ATYPICAL_PHENOMENA_TEXT[id][lang].length > 100, `${id} ${lang} text`);
}

// 1. Verify Mahaim fiber measurements (Ho Ch 11 / Sternick 2003)
const mahaim = atypicalPhenomenaRecording('ap-mahaim');
const mM = atypicalPhenomenaMeasurements(mahaim);
assert.equal(mM.TCL, 340, 'Mahaim antidromic TCL is 340 ms');
assert.equal(mM['M-V'], 40, 'M-potential precedes local V by 40 ms on lateral tricuspid annulus');
assert.equal(mM['V-A (retrograd)'], 120, 'Retrograde nodal V-A interval is 120 ms');

// 2. Verify Supernormal conduction measurements (Ho Ch 22)
const sn = atypicalPhenomenaRecording('ep-supernormality');
const snM = atypicalPhenomenaMeasurements(sn);
assert.equal(snM['P-P (Sinüs)'], 800, 'Baseline sinus cycle length is 800 ms');
assert.equal(snM['P1-P2 (PAC)'], 380, 'Premature coupling interval is 380 ms');
assert.equal(snM.HV, 45, 'HV interval remains normal (45 ms)');

console.log(`PASS atypical-ap: ${ATYPICAL_PHENOMENA_EXAMPLES.length} recordings verified with event-derived calipers and ladder`);

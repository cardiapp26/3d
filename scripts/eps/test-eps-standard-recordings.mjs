import assert from 'node:assert/strict';
import { STANDARD_EPS_EXAMPLES, STANDARD_EPS_TEXT, standardEpsRecording,
  standardEpsMeasurements } from '../../src/eps/eps-standard-recordings.js';
import { resolveRef } from '../../src/eps/ep-caliper.js';
import { buildLadder, inferLadderEvents } from '../../src/eps/ep-ladder.js';

for (const [id] of STANDARD_EPS_EXAMPLES) {
  const recording = standardEpsRecording(id);
  assert.equal(recording.id, id);
  assert.ok(Array.isArray(recording.markers), `${id}: recorder marker list`);
  for (const channel of recording.channels) assert.ok(recording.events[channel]?.length, `${id} ${channel}`);
  for (const events of Object.values(recording.events)) {
    for (const event of events) assert.ok(event.t >= 0 && event.t < recording.windowMs, `${id}: ${event.t} in window`);
    assert.deepEqual(events.map((e) => e.t), events.map((e) => e.t).sort((a, b) => a - b));
  }
  for (const c of recording.calipers) {
    assert.ok(resolveRef(recording, c.a), `${id}: ${c.label} start`);
    assert.ok(resolveRef(recording, c.b), `${id}: ${c.label} end`);
  }
  assert.ok(buildLadder(inferLadderEvents(recording.events, { mechanism: recording.mechanism }),
    { until: recording.windowMs }).links.length > 0, `${id}: conduction ladder`);
  for (const lang of ['tr', 'en']) assert.ok(STANDARD_EPS_TEXT[id][lang].length > 100);
  assert.match(STANDARD_EPS_TEXT[id].source, /^https:\/\/(pubmed|pmc)\.ncbi\.nlm\.nih\.gov\//);
}
const baseline = standardEpsMeasurements(standardEpsRecording('eps-baseline'));
assert.deepEqual(baseline, { PA: 35, AH: 80, HV: 45, PR: 160, 'P-P': 800 });
assert.equal(baseline.PR, baseline.PA + baseline.AH + baseline.HV);
const snrt = standardEpsRecording('eps-snrt');
assert.deepEqual(standardEpsMeasurements(snrt), { 'Sinus CL': 800, PCL: 500, SNRT: 1200, cSNRT: 400 });
const snrtCaliper = snrt.calipers.find((c) => c.label === 'SNRT');
assert.equal(resolveRef(snrt, snrtCaliper.a).type, 'S');
assert.equal(resolveRef(snrt, snrtCaliper.a).t, snrt.events.hra.filter((e) => e.type === 'S').at(-1).t);
assert.equal(resolveRef(snrt, snrtCaliper.b).t, 3800);
resolveRef(snrt, snrtCaliper.b).t += 25;
assert.equal(standardEpsMeasurements(snrt).cSNRT, 425, 'cSNRT follows returned atrial event');
snrt.events.hra = snrt.events.hra.filter((e) => e.t < 3800);
assert.equal(standardEpsMeasurements(snrt).cSNRT, null, 'missing return never yields fabricated measurement');
assert.deepEqual(standardEpsMeasurements(standardEpsRecording('eps-ppi')),
  { TCL: 360, PCL: 320, PPI: 510, 'PPI−TCL': 150 });
const corrected = standardEpsRecording('eps-cppi');
assert.deepEqual(standardEpsMeasurements(corrected),
  { TCL: 400, PPI: 550, 'AH tachy': 225, 'AH return': 305, 'PPI−TCL': 150, 'ΔAH': 80, 'cPPI−TCL': 70 });
resolveRef(corrected, corrected.calipers.find((c) => c.label === 'AH return').b).t += 20;
assert.equal(standardEpsMeasurements(corrected)['cPPI−TCL'], 50, 'correction follows first-return H');
assert.equal(standardEpsMeasurements(standardEpsRecording('eps-cppi'))['cPPI−TCL'], 70, 'fresh copy isolates edits');
assert.equal(standardEpsRecording('unknown'), null);
console.log(`PASS standard EPS recordings: ${STANDARD_EPS_EXAMPLES.length} worked examples; event-derived intervals and corrections; ladder and missing-data checks`);

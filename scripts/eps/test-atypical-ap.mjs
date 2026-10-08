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

// 1. Mahaim (atriofascicular) antidromic tachycardia (Ho figs 11-20, 12-22).
const mahaim = atypicalPhenomenaRecording('ap-mahaim');
const mM = atypicalPhenomenaMeasurements(mahaim);
assert.equal(mahaim.mechanism, 'mahaim-antidromic');
assert.equal(mM.TCL, 340);
assert.equal(mM['M-V'], 40, 'M potential 40 ms before the local V');
assert.equal(mM['V-A (retrograd)'], 120, 'retrograde nodal V-A 120 ms');
// The local A on the annulus belongs to the retrograde atrial activation (not between the HRA A and the M at random).
const abl = mahaim.events['abl-d'], hraA = mahaim.events.hra.filter((e) => e.type === 'A').map((e) => e.t);
for (const m of abl.filter((e) => e.type === 'M')) {
  const a = abl.filter((e) => e.type === 'A' && e.t < m.t).at(-1);
  if (a && a.t >= hraA[0] - 30) assert.ok(hraA.some((t) => Math.abs(t - a.t) <= 30), `annulus A at ${a.t} is part of an atrial activation`);
}
const ladder = buildLadder(inferLadderEvents(mahaim.events, { mechanism: mahaim.mechanism }), { until: mahaim.windowMs });
assert.ok(ladder.links.some((l) => (l.kind || l.type) === 'ap'), 'ladder: down the pathway');
assert.ok(!ladder.links.some((l) => (l.kind || l.type) === 'ap-retro'), 'ladder: not up a pathway (antegrade only)');

// 2. Supernormal conduction (Ho figs 22-1, 22-2): the premature beat conducts narrow, HV unchanged.
const sn = atypicalPhenomenaRecording('ep-supernormality');
const snM = atypicalPhenomenaMeasurements(sn);
assert.equal(snM['P-P (Sinüs)'], 800);
assert.equal(snM['P1-P2 (PAC)'], 380);
assert.equal(snM.HV, 45, 'HV unchanged in the narrow beat');
const widths = sn.events['ecg-ii'].filter((e) => e.type === 'V').map((e) => e.sigma);
assert.ok(widths[2] < widths[1] && widths[2] < widths[3], 'only the premature beat is narrow');
assert.ok(!/daha negatif/.test(ATYPICAL_PHENOMENA_TEXT['ep-supernormality'].tr), 'supernormal period: closer to threshold, not a threshold below rest');

console.log(`PASS atypical-ap: ${ATYPICAL_PHENOMENA_EXAMPLES.length} recordings verified with event-derived calipers and ladder`);

import assert from 'node:assert/strict';
import { AT_EXAMPLES, atRecording } from '../../src/eps/at-markowitz-recordings.js';
import { standardEpsMeasurements } from '../../src/eps/eps-standard-recordings.js';
import { inferLadderEvents, buildLadder } from '../../src/eps/ep-ladder.js';
const times = (r, ch, type) => r.events[ch].filter((e) => e.type === type).map((e) => e.t);
for (const [id] of AT_EXAMPLES) {
  const r = atRecording(id);
  for (const [ch, events] of Object.entries(r.events)) {
    assert.ok(r.channels.includes(ch));
    for (const e of events) assert.ok(Number.isFinite(e.t) && e.t >= 0 && e.t < r.windowMs, `${id}/${ch} event in window`);
  }
  assert.ok(Object.values(standardEpsMeasurements(r)).every(Number.isFinite));
}
assert.deepEqual(standardEpsMeasurements(atRecording('at-map-focal')), { 'A–A': 300, 'A local→P': 35, AH: 80, HV: 45 });
const triggered = atRecording('at-adenosine-triggered');
assert.ok(times(triggered, 'hra', 'A').every((t) => t < 1250));
const automatic = atRecording('at-adenosine-automatic');
assert.deepEqual(times(automatic, 'hra', 'A'), [162, 462, 762, 1062, 2062, 2362, 2662]);
const micro = atRecording('at-microreentry-block');
assert.deepEqual(standardEpsMeasurements(micro), { 'A–A': 300, 'A–A post': 300, 'V–V post': 600, 'Fragment span': 270 });
const ladder = buildLadder(inferLadderEvents(micro.events, { mechanism: micro.mechanism }), { until: micro.windowMs });
assert.equal(ladder.atria.length, 8, 'fragments are not separate atrial beats');
assert.ok(!ladder.links.some((l) => ['ap-retro', 'retro-fast', 'retro-slow'].includes(l.kind)), 'independent atrial source, no retrograde dependency');
assert.equal(ladder.links.filter((l) => l.kind === 'block').length, 2);
const entrained = atRecording('at-atrial-entrainment');
assert.deepEqual(standardEpsMeasurements(entrained), { TCL: 300, PCL: 240, PPI: 320, 'PPI−TCL': 20 });
for (const s of times(entrained, 'hra', 'S')) {
  assert.ok(times(entrained, 'hra', 'A').includes(s + 5), 'atrial capture after stimulus');
  assert.ok(entrained.events['abl-d'].some((e) => e.type === 'A' && e.t === s + 25), 'remote atrial activation after capture');
}
console.log('PASS AT Markowitz: focal timing, termination/suppression, continued A with 2:1 AV block, fractionation, atrial capture/PPI');

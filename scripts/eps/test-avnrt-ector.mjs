import assert from 'node:assert/strict';
import { ECTOR_EXAMPLE, ECTOR_TEXT, ectorRecording } from '../../src/eps/avnrt-ector-recording.js';
import { standardEpsMeasurements } from '../../src/eps/eps-standard-recordings.js';
import { inferLadderEvents, buildLadder } from '../../src/eps/ep-ladder.js';
import { EP_CHANNELS } from '../../src/eps/ep-cases.js';
const r = ectorRecording(ECTOR_EXAMPLE[0]);
assert.equal(r.channels.length, 15);
assert.ok(!r.events.rv);
assert.equal(r.channelLabels.hra, 'RAA');
const channelIds = new Set(EP_CHANNELS.map((c) => c.id));
for (const ch of r.channels) assert.ok(channelIds.has(ch) && r.events[ch]?.length, ch);
for (const events of Object.values(r.events)) {
  assert.ok(events.every((e) => e.t >= 0 && e.t <= r.windowMs));
  for (let i = 1; i < events.length; i++) assert.ok(events[i].t >= events[i - 1].t);
  for (const type of ['A', 'H', 'V', 'S']) {
    const times = events.filter((e) => e.type === type).map((e) => e.t);
    assert.equal(new Set(times).size, times.length, `no duplicate ${type}`);
  }
}
const stims = r.events.hra.filter((e) => e.type === 'S');
assert.equal(stims.length, 4, 'exactly four paced beats');
const hisA = r.events['his-d'].filter((e) => e.type === 'A');
const hisH = r.events['his-d'].filter((e) => e.type === 'H');
assert.deepEqual(hisH.slice(0, 4).map((h, i) => h.t - hisA[i].t), [80, 90, 240, 250]);
assert.deepEqual(standardEpsMeasurements(r), { 'AH FP': 90, 'AH SP': 240, HV: 45, VA: 30, TCL: 320, 'ΔAH FP→SP': 150 });
assert.ok(hisA[4].t > r.events['his-d'].filter((e) => e.type === 'V')[3].t);
assert.ok(r.events['his-d'].filter((e) => e.type === 'V' && e.t > hisA[4].t).length >= 4, 'sustained tachycardia after stimulus-free echo');
const inferred = inferLadderEvents(r.events, { mechanism: r.mechanism });
const ladder = buildLadder(inferred, { until: r.windowMs });
assert.deepEqual(ladder.links.filter((l) => l.kind === 'fast' || l.kind === 'slow').slice(0, 4).map((l) => l.kind), ['fast', 'fast', 'slow', 'slow']);
assert.ok(ladder.links.filter((l) => l.kind === 'retro-fast').length >= 4);
for (const lang of ['tr', 'en']) {
  assert.ok(ECTOR_TEXT[lang].description && ECTOR_TEXT[lang].legend);
  assert.equal(ECTOR_TEXT[lang].stages.length, 3);
}
assert.equal(ectorRecording('unknown'), null);
console.log('PASS Ector AVNRT: 15 source channels, FP→SP transition, four paced beats, unstimulated echo, sustained tachycardia, event measurements and ladder');

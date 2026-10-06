import assert from 'node:assert/strict';
import { AP_ABLATION_EXAMPLES, apAblationRecording } from '../../src/eps/ap-ablation-recordings.js';
import { standardEpsMeasurements } from '../../src/eps/eps-standard-recordings.js';
import { waveLabel } from '../../src/eps/ep-egm.js';
import { buildLadder, inferLadderEvents } from '../../src/eps/ep-ladder.js';
for (const [id] of AP_ABLATION_EXAMPLES) {
  const r = apAblationRecording(id);
  for (const [ch, events] of Object.entries(r.events)) {
    assert.ok(r.channels.includes(ch));
    for (const e of events) assert.ok(e.t >= 0 && e.t < r.windowMs && Number.isFinite(e.t));
  }
}
const ante = apAblationRecording('ap-map-antegrade');
assert.deepEqual(standardEpsMeasurements(ante), { 'V local→delta': 40, 'AH post': 80, 'HV post': 45 });
assert.equal(ante.events['ecg-ii'].filter((e) => e.type === 'delta').length, 3);
assert.equal(ante.events['ecg-ii'].filter((e) => e.type === 'V').length, 6);
assert.ok(!ante.events['abl-d'].some((e) => e.type === 'AP'));
const potential = apAblationRecording('ap-map-potential');
assert.deepEqual(standardEpsMeasurements(potential), { 'AP→delta': 40, 'A→AP local': 32 });
assert.equal(waveLabel({ type: 'AP' }, false), 'AP');
assert.deepEqual(standardEpsMeasurements(apAblationRecording('ap-map-retrograde')), {
  'VA local pre': 65, 'S–A pre': 145, 'S–V local': 80, 'S–A His post': 200
});
const retro = apAblationRecording('ap-map-retrograde');
const firstA = (occ) => Object.entries(retro.events).flatMap(([ch, list]) => list.filter((e) => e.type === 'A').slice(occ, occ + 1).map((e) => ({ ch, t: e.t }))).sort((a, b) => a.t - b.t)[0].ch;
assert.equal(firstA(0), 'abl-d');
assert.equal(firstA(3), 'his-p');
const ladder = buildLadder(inferLadderEvents(retro.events, { mechanism: retro.mechanism }), { until: retro.windowMs });
assert.equal(ladder.links.filter((l) => l.kind === 'ap-retro').length, 3);
assert.ok(!ladder.links.some((l) => l.kind === 'ap-retro' && l.to[1] > 1700));
assert.equal(ladder.links.filter((l) => l.kind === 'retro-fast' && l.to[1] > 1700).length, 3);
console.log('PASS AP ablation: early V/delta, preserved AH/HV, AP label, local VA vs S–A, post-ablation sequence');

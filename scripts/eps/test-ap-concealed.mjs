// Concealed versus manifest pathway recording and the concealed labels of the worked recordings.
import assert from 'node:assert/strict';
import { CONCEALED_EXAMPLE, CONCEALED_TEXT, concealedRecording } from '../../src/eps/ap-concealed-recording.js';
import { SVT_EXAMPLE_GROUPS, svtExampleRecording } from '../../src/eps/svt-dx-recordings.js';
import { standardEpsMeasurements } from '../../src/eps/eps-standard-recordings.js';
import { buildLadder, inferLadderEvents } from '../../src/eps/ep-ladder.js';

const id = CONCEALED_EXAMPLE[0];
const r = concealedRecording(id);
assert.ok(r && svtExampleRecording(id), 'reachable from the worked recordings');
assert.equal(concealedRecording('unknown'), null);
const of = (ch, type) => r.events[ch].filter((e) => e.type === type).map((e) => e.t);

// Manifest sinus beat has a delta; the concealed sinus beat has none.
const deltas = of('ecg-ii', 'delta');
assert.equal(deltas.length, 1, 'only the manifest beat is preexcited');
assert.ok(deltas[0] < 1050, 'the delta belongs to the first (manifest) beat');
const m = standardEpsMeasurements(r);
assert.equal(m['H-delta'], 25, 'manifest: short H-delta');
assert.equal(m.HV, 45, 'concealed: normal HV');
// RV pacing in the concealed case: eccentric retrograde A, earliest on distal CS, before the His A.
assert.equal(m['S-A CS 1-2'], 140);
assert.ok(m['S-A His'] - m['S-A CS 1-2'] >= 40, 'eccentric: His A clearly after distal CS');
for (const s of of('rv', 'S')) {
  const atria = Object.entries(r.events).filter(([ch]) => ch !== 'abl-d')
    .flatMap(([ch, list]) => list.filter((e) => e.type === 'A' && e.t > s && e.t < s + 260).map((e) => ({ ch, t: e.t })))
    .sort((a, b) => a.t - b.t);
  assert.equal(atria[0].ch, 'cs-12', `paced beat at ${s}: earliest catheter A on distal CS`);
}
// Ladder: antegrade pathway on the manifest beat, normal conduction on the concealed sinus beat,
// retrograde pathway on every paced beat.
const kinds = buildLadder(inferLadderEvents(r.events, { mechanism: r.mechanism }), { until: r.windowMs }).links.map((l) => l.kind);
assert.equal(kinds.filter((k) => k === 'ap').length, 1);
assert.equal(kinds.filter((k) => k === 'hps').length, 1);
assert.equal(kinds.filter((k) => k === 'ap-retro').length, 3);
for (const lang of ['tr', 'en']) assert.match(CONCEALED_TEXT[lang], lang === 'tr' ? /eksantrik.*septal/s : /eccentric.*septal/s);

// The worked-recording names say which pathways are concealed.
const items = SVT_EXAMPLE_GROUPS.flatMap((g) => g.items);
const name = (exampleId, lang) => items.find((x) => x[0] === exampleId)[lang === 'tr' ? 1 : 2];
for (const exampleId of ['ap-ll-svt', 'ap-ips-svt', 'ph-svt', 'pjrt-svt', 'ap-map-retrograde']) {
  assert.match(name(exampleId, 'tr'), /gizli/, exampleId);
  assert.match(name(exampleId, 'en'), /concealed/, exampleId);
}
assert.equal(SVT_EXAMPLE_GROUPS.find((g) => g.en === 'AVRT').items[0][0], id, 'comparison opens the AVRT group');
console.log('PASS ap-concealed: manifest delta vs concealed normal HV, eccentric retrograde A on RV pacing, ladder AP/HPS/AP-retro, concealed labels in the worked recordings');

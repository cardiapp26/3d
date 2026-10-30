// Surface completion and waveform shapes (ep-waveform.js): every QRS gets a T wave, P waves
// follow where atrial activation starts, flutter is a sawtooth in II and upright in V1,
// fibrillation leaves small f waves on the surface, and the catalogue is never mutated.
import assert from 'node:assert/strict';
import { channelEvents, completeSurface, atrialClusters, waveValue, qtAt } from '../../src/eps/ep-waveform.js';
import { egmSample, drawEgm, channelAtY } from '../../src/eps/ep-egm.js';
import { EP_RECORDING_IDS, epRecording } from '../../src/eps/ep-cases.js';
import { SVT_EXAMPLES, svtExampleRecording } from '../../src/eps/svt-dx-recordings.js';

const derived = (r, ch, type) => channelEvents(r, ch).filter((e) => e.derived && e.type === type);
const near = (list, t, ms) => list.find((e) => Math.abs(e.t - t) <= ms);

// QT shortens with the rate and stays physiological.
assert.ok(qtAt(1000) > 380 && qtAt(1000) < 420);
assert.ok(qtAt(400) < qtAt(1000));

// Every surface QRS of every recording has one T wave after it.
const all = [...EP_RECORDING_IDS.map(epRecording), ...SVT_EXAMPLES.map((e) => svtExampleRecording(e.id))].filter(Boolean);
for (const r of all) {
  for (const ch of ['ecg-ii', 'ecg-v1']) {
    const qrs = (r.events[ch] || []).filter((e) => e.type === 'V' && !e.mono).sort((a, b) => a.t - b.t);
    const own = qrs.filter((q, i) => !qrs[i + 1] || qrs[i + 1].t - q.t >= 200);   // a merged complex has no T of its own
    const ts = derived(r, ch, 'T');
    assert.equal(ts.length, own.length, `${r.id} ${ch}: one T per QRS`);
    for (const q of own) assert.ok(ts.some((t) => t.t > q.t + 100 && t.t < q.t + 420), `${r.id} ${ch}: T after QRS at ${q.t}`);
  }
}

// Sinus: upright P in II, biphasic P in V1, concordant T.
const sinus = epRecording('sinus');
const v1p = derived(sinus, 'ecg-v1', 'P');
assert.ok(v1p.some((p) => p.amp > 0) && v1p.some((p) => p.amp < 0), 'sinus V1 P is biphasic');
assert.ok(derived(sinus, 'ecg-ii', 'T').every((t) => t.amp > 0), 'sinus T upright in II');

// Typical AVNRT: retrograde P negative in II at the end of the QRS (pseudo-S), upright in V1 (pseudo-r').
const avnrt = svtExampleRecording('avnrt-typ-svt');
const qrs = avnrt.events['ecg-ii'].find((e) => e.type === 'V');
const retroII = near(derived(avnrt, 'ecg-ii', 'P'), qrs.t + 50, 40);
const retroV1 = near(derived(avnrt, 'ecg-v1', 'P'), qrs.t + 50, 40);
assert.ok(retroII && retroII.amp < 0, 'AVNRT retrograde P negative in II');
assert.ok(retroV1 && retroV1.amp > 0, 'AVNRT retrograde P upright in V1');
assert.equal(atrialClusters(avnrt.events)[0].origin, 'septal');

// Wide QRS (ventricular origin) gets a discordant T wave.
for (const r of all) {
  for (const q of (r.events['ecg-ii'] || []).filter((e) => e.type === 'V' && !e.mono && (e.sigma || 8) >= 12)) {
    const t = derived(r, 'ecg-ii', 'T').find((x) => x.t > q.t);
    assert.ok(t && Math.sign(t.amp) === -Math.sign(q.amp), `${r.id}: discordant T after a wide QRS`);
  }
}

// Flutter: sawtooth with no isoelectric baseline in II, F waves upright in V1, no P waves.
const flutter = svtExampleRecording('flutter-svt');
const fII = channelEvents(flutter, 'ecg-ii').filter((e) => e.type === 'F');
assert.ok(fII.every((f) => f.saw >= 150), 'II F waves carry their cycle length');
assert.ok(derived(flutter, 'ecg-v1', 'F').every((f) => f.amp > 0), 'V1 F waves upright');
assert.equal(derived(flutter, 'ecg-ii', 'P').length, 0, 'no P waves in flutter');
const between = [];
for (let t = fII[0].t; t < fII[1].t; t += 5) between.push(fII.reduce((v, f) => v + waveValue(t, f, 'ecg-ii'), 0));
assert.ok(between.filter((v) => Math.abs(v) < 0.01).length < between.length * 0.2, 'sawtooth: little isoelectric time');
assert.ok(flutter.events['ecg-ii'].filter((e) => e.type === 'F').every((f) => f.saw === undefined), 'catalogue F events untouched');

// Fibrillation: f waves on the surface from the atrial f electrograms, and no P waves.
const af = epRecording('af-pvi-baseline');
assert.ok(derived(af, 'ecg-v1', 'f').length >= 5, 'AF f waves in V1');
assert.equal(derived(af, 'ecg-ii', 'P').length, 0, 'no P waves in AF');

// Catalogue events are never mutated and samples stay finite.
for (const r of all.slice(0, 20)) {
  const before = JSON.stringify(r.events);
  completeSurface(r, 'ecg-ii'); completeSurface(r, 'ecg-v1');
  assert.equal(JSON.stringify(r.events), before, `${r.id}: catalogue unchanged`);
  for (let t = 0; t < r.windowMs; t += 37) assert.ok(Number.isFinite(egmSample(r, 'ecg-ii', t)));
}

// Surface rows are taller than intracardiac rows, and channelAtY follows the weighted rows.
const canvas = { clientWidth: 900, clientHeight: 500, width: 0, height: 0, getContext: () => new Proxy({}, { get: (_, k) => (k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true }) };
const drawn = drawEgm(canvas, avnrt, {});
assert.ok(drawn.heights[0] > drawn.heights[2] * 1.4, 'surface rows taller');
drawn.rows.forEach((id, i) => assert.equal(channelAtY(drawn.tops[i] + drawn.heights[i] / 2, drawn), id));
assert.equal(channelAtY(drawn.tops[0] - 2, drawn), null);

console.log('PASS ep-waveform: T after every QRS, sinus/retrograde P axes, discordant T, flutter sawtooth + V1 F, AF f waves, catalogue untouched, weighted surface rows');

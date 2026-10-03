// Ladder diagram (src/eps/ep-ladder.js) built from the live model's events:
// sinus over the fast pathway, typical AVNRT (slow down, fast up), orthodromic
// AVRT (accessory pathway up), pre-excitation, 2:1 AV nodal block with fast
// atrial pacing, retrograde conduction with RV pacing; activations close to
// the window end are not called blocked yet.
import assert from 'node:assert/strict';
import { createLiveHeart, planTrain } from '../../src/eps/ep-live-model.js';
import { buildLadder, drawLadder, LADDER_STYLE, inferLadderEvents } from '../../src/eps/ep-ladder.js';
import { epRecording, EP_CASES, EP_RECORDING_IDS } from '../../src/eps/ep-cases.js';

const kinds = (ladder) => ladder.links.reduce((acc, l) => ({ ...acc, [l.kind]: (acc[l.kind] || 0) + 1 }), {});
const run = (caseId, train, from, to) => {
  const h = createLiveHeart(caseId);
  if (train) h.stimulate(train);
  h.advanceTo(to);
  return buildLadder(h.events(from, to), { until: to });
};

const sinus = run('normal', null, 0, 6000);
assert.deepEqual(kinds(sinus), { fast: sinus.his.length, hps: sinus.his.length }, 'sinus: fast pathway and His-Purkinje every beat');
for (const l of sinus.links.filter((x) => x.kind === 'fast')) assert.ok(l.to[1] - l.from[1] > 30 && l.to[1] - l.from[1] < 200, 'AH-sized nodal line');

const avnrt = run('avnrt-typical', planTrain({ site: 'hra', start: 1000, s1: 600, n: 8, extras: [370] }), 7000, 10000);
const k = kinds(avnrt);
assert.ok(k.slow >= 6 && k['retro-fast'] >= 6 && !k.fast && !k.block, `AVNRT: slow down, fast up ${JSON.stringify(k)}`);

const ort = kinds(run('ort-left', planTrain({ site: 'rv', start: 1000, s1: 600, n: 8, extras: [250] }), 7000, 10000));
assert.ok(ort.fast >= 6 && ort['ap-retro'] >= 6 && !ort['retro-fast'], `ORT: node down, pathway up ${JSON.stringify(ort)}`);

const wpw = kinds(run('wpw-left', null, 0, 5000));
assert.ok(wpw.ap >= 4, `pre-excitation over the pathway ${JSON.stringify(wpw)}`);

const twoToOne = run('normal', planTrain({ site: 'hra', start: 1000, s1: 270, n: 20 }), 1000, 7000);
const blocked = kinds(twoToOne);
assert.ok(blocked.block >= 8 && Math.abs(blocked.block - blocked.fast) <= 1, `2:1 block at 270 ms ${JSON.stringify(blocked)}`);
for (const l of twoToOne.links.filter((x) => x.kind === 'block')) assert.deepEqual([l.from[0], l.to[0]], ['A', 'AV'], 'block ends in the node');

const rv = kinds(run('normal', planTrain({ site: 'rv', start: 1000, s1: 600, n: 6 }), 1500, 5000));
assert.ok(rv['retro-fast'] >= 5, `RV pacing: retrograde over the node ${JSON.stringify(rv)}`);

// An activation still on its way down at the window end is not a block.
const h = createLiveHeart('normal');
h.advanceTo(2000);
const edge = h.events(0, 2000);
const lastA = Math.max(...edge['his-d'].filter((e) => e.type === 'A').map((e) => e.t));
const cut = buildLadder(h.events(0, lastA + 20), { until: lastA + 20 });
assert.equal(kinds(cut).block, undefined, 'pending activation not read as blocked');

// Lesson clips: origins inferred from the events and the case mechanism.
const clip = (id) => {
  const r = epRecording(id);
  const mechanism = EP_CASES.find((c) => c.id === r.caseId).mechanism;
  return kinds(buildLadder(inferLadderEvents(r.events, { mechanism }), { until: r.windowMs }));
};
const expect = {
  'avnrt-typ-svt': { slow: 3, 'retro-fast': 4, hps: 4 },        // slow down, fast up
  'avnrt-atyp-svt': { fast: 3, 'retro-slow': 4, hps: 4 },       // fast down, slow up
  'ap-ll-svt': { fast: 3, 'ap-retro': 4, hps: 4 },              // orthodromic: node down, pathway up
  'ap-ips-svt': { fast: 3, 'ap-retro': 4, hps: 4 },             // septal pathway, no slow pathway read
  'ap-lm-antidromic': { ap: 3, 'retro-fast': 4 },               // antidromic: pathway down, node up
  'avnrt-ah-jump': { fast: 5, slow: 1, hps: 6 },                // one jump on the slow pathway
  'af-preexcited': { ap: 6 },                                   // AF: no retrograde reading of f waves
  'bbr-vt': { fast: 2, hps: 5 }                                 // His from the bundle branch circuit
};
for (const [id, want] of Object.entries(expect)) assert.deepEqual(clip(id), want, id);
assert.ok(!clip('flutter-svt')['retro-fast'] && !clip('flutter-svt').slow, 'flutter: atrial origin only');
assert.ok(clip('junctional-rf')['retro-fast'] >= 2, 'junctional beats conduct up the node');
// Every clip builds; the input recording is not changed.
for (const id of EP_RECORDING_IDS) {
  const r = epRecording(id), before = JSON.stringify(r.events);
  assert.doesNotThrow(() => buildLadder(inferLadderEvents(r.events, { mechanism: EP_CASES.find((c) => c.id === r.caseId)?.mechanism }), { until: r.windowMs }), id);
  assert.equal(JSON.stringify(r.events), before, `${id}: events unchanged`);
}

// Every link kind has a style; drawing tolerates a missing canvas.
for (const l of [...sinus.links, ...avnrt.links, ...twoToOne.links]) assert.ok(LADDER_STYLE[l.kind], l.kind);
assert.doesNotThrow(() => drawLadder(null, sinus, { from: 0, to: 6000, plotLeft: 58, plotW: 800 }));

console.log('PASS ep-ladder: sinus fast pathway, AVNRT slow-down fast-up, ORT pathway-up, pre-excitation, 2:1 nodal block, RV retrograde, pending activations at the window end; lesson clips inferred (AVNRT typical/atypical, ORT, antidromic, AH jump, pre-excited AF, BBR-VT, flutter, junctional)');

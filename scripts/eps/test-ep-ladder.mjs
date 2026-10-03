// Ladder diagram (src/eps/ep-ladder.js) built from the live model's events:
// sinus over the fast pathway, typical AVNRT (slow down, fast up), orthodromic
// AVRT (accessory pathway up), pre-excitation, 2:1 AV nodal block with fast
// atrial pacing, retrograde conduction with RV pacing; activations close to
// the window end are not called blocked yet.
import assert from 'node:assert/strict';
import { createLiveHeart, planTrain } from '../../src/eps/ep-live-model.js';
import { buildLadder, drawLadder, LADDER_STYLE } from '../../src/eps/ep-ladder.js';

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

// Every link kind has a style; drawing tolerates a missing canvas.
for (const l of [...sinus.links, ...avnrt.links, ...twoToOne.links]) assert.ok(LADDER_STYLE[l.kind], l.kind);
assert.doesNotThrow(() => drawLadder(null, sinus, { from: 0, to: 6000, plotLeft: 58, plotW: 800 }));

console.log('PASS ep-ladder: sinus fast pathway, AVNRT slow-down fast-up, ORT pathway-up, pre-excitation, 2:1 nodal block, RV retrograde, pending activations at the window end');

// Ladder on the channels (src/eps/ep-strip-links.js): each activation's
// deflections are joined across HRA, His, CS and RV, and every conduction
// line of the ladder lands on a deflection. Sinus: HRA first, His A to H
// (fast), H to V. Orthodromic left lateral pathway: the retrograde A runs
// from CS 1-2 to HRA and the pathway line leaves the RV for CS distal.
// Typical AVNRT: slow pathway from the His A to its H. Live model too.
import assert from 'node:assert/strict';
import { epRecording, EP_CASES, EP_RECORDING_IDS } from '../../src/eps/ep-cases.js';
import { buildLadder, inferLadderEvents, LADDER_STYLE } from '../../src/eps/ep-ladder.js';
import { stripLinks, shiftLinks } from '../../src/eps/ep-strip-links.js';
import { createLiveHeart } from '../../src/eps/ep-live-model.js';

const linksOf = (id) => {
  const r = epRecording(id);
  const mechanism = EP_CASES.find((c) => c.id === r.caseId)?.mechanism;
  const ladder = buildLadder(inferLadderEvents(r.events, { mechanism }), { until: r.windowMs });
  return { r, ladder, links: stripLinks(r.events, ladder) };
};
const order = (g) => g.points.map((p) => p.ch);

// Every clip: one deflection per channel and activation, every ladder line placed on a recorded channel.
for (const id of EP_RECORDING_IDS) {
  const { r, ladder, links } = linksOf(id);
  for (const g of links.groups) assert.equal(new Set(order(g)).size, g.points.length, `${id}: one point per channel`);
  assert.equal(links.conduction.length, ladder.links.length, `${id}: every conduction line placed`);
  for (const c of links.conduction) {
    assert.ok(LADDER_STYLE[c.kind], c.kind);
    for (const end of [c.from, c.to]) assert.ok(r.events[end.ch], `${id}: ${c.kind} on a recorded channel (${end.ch})`);
  }
}

// Sinus: high right atrium first; nodal line from the His A to the H; H to V on the His catheter (no RV recorded).
const sinus = linksOf('sinus').links;
const sinusA = sinus.groups.filter((g) => g.kind === 'A');
assert.ok(sinusA.length >= 2 && sinusA.every((g) => g.points[0].ch === 'hra'), 'sinus: HRA earliest');
assert.ok(sinus.conduction.filter((c) => c.kind === 'fast').every((c) => c.from.ch === 'his-d' && c.to.ch === 'his-d' && c.to.t > c.from.t), 'fast pathway: His A to H');

// Orthodromic AVRT over a left lateral pathway: CS 1-2 to HRA eccentric sequence; pathway line from the RV to CS distal.
const ort = linksOf('ap-ll-svt').links;
const retro = ort.groups.filter((g) => g.kind === 'A' && g.points.length > 5);
assert.ok(retro.length >= 3, 'retrograde atrial activations grouped across the channels');
for (const g of retro) {
  const cs = order(g).filter((ch) => ch.startsWith('cs-'));
  assert.deepEqual(cs, ['cs-12', 'cs-34', 'cs-56', 'cs-78', 'cs-910'], 'distal to proximal CS');
  assert.equal(order(g).at(-1), 'hra', 'HRA last');
}
const apRetro = ort.conduction.filter((c) => c.kind === 'ap-retro');
assert.ok(apRetro.length >= 3 && apRetro.every((c) => c.from.ch === 'rv' && ['cs-12', 'abl-d'].includes(c.to.ch)), 'pathway up: RV to the earliest A');

// Typical AVNRT: slow pathway down from the His A, His to RV, fast pathway up.
const avnrt = linksOf('avnrt-typ-svt').links;
assert.ok(avnrt.conduction.some((c) => c.kind === 'slow' && c.from.ch === 'his-d' && c.to.ch === 'his-d' && c.to.t - c.from.t > 200), 'slow pathway: long AH on the His catheter');
assert.ok(avnrt.conduction.some((c) => c.kind === 'hps' && c.to.ch === 'rv'), 'His to RV');

// Live model: the same reading on its events; shifting keeps the shape.
const heart = createLiveHeart('normal');
heart.advanceTo(4000);
const raw = heart.events(0, 4000);
const live = stripLinks(raw, buildLadder(raw, { until: 4000 }));
assert.ok(live.groups.some((g) => g.kind === 'A' && g.points.length > 3), 'live: atrial activations joined');
const shifted = shiftLinks(live, -1000);
assert.equal(shifted.groups[0].points[0].t, live.groups[0].points[0].t - 1000);
// Antidromic AVRT over a left lateral pathway: the antegrade pathway line joins CS 1-2 A to ABL V (its insertions),
// not the nodal A on the His catheter to the RV.
{
  const anti = epRecording('ap-lm-antidromic');
  const L = stripLinks(anti.events, buildLadder(inferLadderEvents(anti.events, { mechanism: EP_CASES.find((c) => c.id === anti.caseId)?.mechanism }), { until: anti.windowMs }));
  const ap = L.conduction.filter((c) => c.kind === 'ap');
  assert.ok(ap.length >= 2, 'antegrade pathway lines drawn');
  for (const c of ap) { assert.equal(c.from.ch, 'cs-12', 'atrial insertion on distal CS'); assert.equal(c.to.ch, 'abl-d', 'ventricular insertion on ABL'); }
}
console.log('PASS ep-strip-links: one point per channel, every ladder line on a recorded channel (all clips), sinus HRA first and His A to H, ORT CS 1-2 to HRA with RV to CS distal, AVNRT slow AH on the His, live model, shift');

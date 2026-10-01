// Pulmonary vein isolation exercise (pvi-model.js; sources R29-R31 in the EP
// report). Entrance block is read from the events: near-field PV potentials
// disappear only when the sampled ring is complete; sinus returns only when
// every ring is complete, and the texts state the simplification.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PVI_VEINS, PVI_DOTS, PVI_CHANNELS, createPviState, burnDot, burnedCount, isolated, allIsolated, pviRecording
} from '../src/pvi-model.js';
import { resolveRef, measure, epRecording } from '../src/ep-cases.js';
import { EP_CASE_TEXT, EP_CLIP_TEXT, EP_ZONE_TEXT } from '../src/ep-case-text.js';

// State is immutable and counts are read back.
let state = createPviState();
assert.equal(PVI_VEINS.length, 4);
const first = createPviState();
state = burnDot(state, 'lspv', 0);
assert.equal(burnedCount(first, 'lspv'), 0, 'burn returns a new state');
assert.equal(burnedCount(state, 'lspv'), 1);
assert.equal(burnDot(state, 'lspv', 0), state, 'burning the same dot changes nothing');
assert.equal(burnDot(state, 'nope', 0), state);

// PV potentials persist until the sampled ring completes; the far field stays.
const rec0 = pviRecording(state, 'lspv');
assert.equal(rec0.lab, 'pvi');
assert.ok(rec0.events.pv.some((e) => e.type === 'PV'), 'near-field PV potentials while conducting');
assert.ok(rec0.events.pv.some((e) => e.type === 'f'), 'far-field atrial signal on the lasso');
for (const c of rec0.calipers) assert.ok(Number.isFinite(measure(rec0, c)), `${c.label} measured`);
// Irregular AF: successive RR differ.
assert.notEqual(measure(rec0, rec0.calipers[0]), measure(rec0, rec0.calipers[1]), 'irregular RR');

for (let i = 1; i < PVI_DOTS; i++) state = burnDot(state, 'lspv', i);
assert.ok(isolated(state, 'lspv'));
const rec1 = pviRecording(state, 'lspv');
assert.ok(!rec1.events.pv.some((e) => e.type === 'PV'), 'entrance block: PV potentials gone');
assert.ok(rec1.events.pv.some((e) => e.type === 'f'), 'far field remains during AF');
assert.ok(!rec1.sinus, 'one vein is not enough for sinus');
// Another vein still conducts.
assert.ok(pviRecording(state, 'ripv').events.pv.some((e) => e.type === 'PV'));

for (const vein of ['lipv', 'rspv', 'ripv']) for (let i = 0; i < PVI_DOTS; i++) state = burnDot(state, vein, i);
assert.ok(allIsolated(state));
const done = pviRecording(state, 'rspv');
assert.ok(done.sinus);
assert.ok(done.events['ecg-ii'].some((e) => e.type === 'P'), 'sinus P after the exercise completes');
assert.ok(!done.events.pv.some((e) => e.type === 'PV'));
assert.ok(resolveRef(done, done.calipers[0].a), 'PP caliper resolves');

// Events stay inside the window on every strip.
for (const r of [rec0, rec1, done]) {
  assert.deepEqual(r.channels, PVI_CHANNELS);
  for (const [ch, list] of Object.entries(r.events)) for (const e of list) assert.ok(e.t >= 0 && e.t <= r.windowMs, `${r.id} ${ch} inside window`);
}

// The catalog baseline clip matches the untouched exercise.
const base = epRecording('af-pvi-baseline');
assert.ok(base && base.section === 'diagnosis');
assert.ok(base.events.pv.some((e) => e.type === 'PV'));

// Texts: the simplification and the risk layers are stated; no success percentage.
assert.match(EP_CASE_TEXT['af-pvi'].tr.endpoint, /garanti değildir/);
assert.match(EP_ZONE_TEXT['pv-antrum'].tr.risk, /stenoz/);
for (const lang of ['tr', 'en']) {
  const texts = [EP_CASE_TEXT['af-pvi'][lang].endpoint, EP_CLIP_TEXT['af-pvi-baseline'][lang].evidence];
  for (const text of texts) assert.ok(!/%\s?\d|\d+\s?%/.test(text), `${lang}: no success percentage`);
}

for (const file of ['../src/pvi-model.js', '../src/pvi-lab.js', '../src/ep-pvi-panel.js']) {
  assert.ok(!readFileSync(new URL(file, import.meta.url), 'utf8').includes('\u2014'), `${file}: no em dash`);
}
console.log('PASS ep-pvi: immutable lesion state, entrance block read from events per vein, sinus only after all four rings, baseline clip and texts consistent');

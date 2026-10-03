// Pulmonary vein isolation exercise (pvi-model.js; sources R29-R31 in the EP
// report). Entrance block is read from the events: near-field PV potentials
// disappear only when the sampled ring is complete; sinus returns only when
// every ring is complete, and the texts state the simplification. The 2D
// lesion map (pvi-map.js) takes clicks only while active and drives the
// panel's strip.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PVI_VEINS, PVI_DOTS, PVI_CHANNELS, createPviState, burnDot, burnedCount, isolated, allIsolated, pviRecording
} from '../../src/eps/pvi-model.js';
import { resolveRef, measure, epRecording } from '../../src/eps/ep-cases.js';
import { EP_CASE_TEXT, EP_CLIP_TEXT, EP_ZONE_TEXT } from '../../src/eps/ep-case-text.js';
import { pviMapLayout, createPviMap, MAP_VIEW } from '../../src/eps/pvi-map.js';
import { createPviPanel } from '../../src/eps/ep-pvi-panel.js';

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

// 2D lesion map: four veins, PVI_DOTS points each, all inside the view and apart.
const layout = pviMapLayout();
assert.deepEqual(layout.map((v) => v.id), PVI_VEINS.map((v) => v.id));
for (const v of layout) {
  assert.equal(v.dots.length, PVI_DOTS);
  for (const d of v.dots) {
    assert.ok(d.x > 0 && d.x < MAP_VIEW.w && d.y > 0 && d.y < MAP_VIEW.h, `${v.id} ${d.index} inside`);
    assert.ok(Math.abs(Math.hypot(d.x - v.cx, d.y - v.cy) - v.ring) < 0.2, 'on the antral ring');
  }
}
const allDots = layout.flatMap((v) => v.dots);
for (let i = 0; i < allDots.length; i++) for (let k = i + 1; k < allDots.length; k++) {
  assert.ok(Math.hypot(allDots[i].x - allDots[k].x, allDots[i].y - allDots[k].y) > 11, 'points do not overlap');
}

// Map and panel against a minimal fake DOM.
function fake(tag) {
  const n = { tag, children: [], attributes: {}, listeners: {}, dataset: {}, textContent: '', hidden: false, className: '', open: false,
    setAttribute(k, v) { n.attributes[k] = String(v); if (k.startsWith('data-')) n.dataset[k.slice(5).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = String(v); },
    getAttribute(k) { return n.attributes[k] ?? null; },
    addEventListener(t, fn) { n.listeners[t] = fn; },
    append(...k) { n.children.push(...k); }, replaceChildren(...k) { n.children = k; } };
  return n;
}
const doc = { createElement: fake, createElementNS: (ns, tag) => fake(tag) };
const map = createPviMap(doc);
const svg = map.element.children[0];
const dotNode = (key) => svg.children.find((c) => c.attributes['data-pvi-dot'] === key);
assert.equal(svg.children.filter((c) => c.attributes['data-pvi-dot']).length, map.dotCount());
assert.equal(map.dotCount(), 4 * PVI_DOTS);
svg.listeners.click({ target: dotNode('lspv:0') });
assert.equal(map.burnedCount('lspv'), 0, 'inactive map ignores clicks');
map.setActive(true);
svg.listeners.click({ target: dotNode('lspv:0') });
assert.equal(map.burnedCount('lspv'), 1, 'click ablates');
svg.listeners.keydown({ type: 'keydown', target: dotNode('lspv:1'), key: 'Enter', preventDefault() {} });
svg.listeners.keydown({ type: 'keydown', target: dotNode('lspv:2'), key: 'a' });
assert.equal(map.burnedCount('lspv'), 2, 'Enter ablates, other keys do not');
assert.equal(dotNode('lspv:0').attributes['aria-pressed'], 'true');
assert.equal(dotNode('lspv:0').attributes.tabindex, '-1', 'an ablated point leaves the tab order');
let changes = 0;
const off = map.onChange(() => { changes++; });
map.reset();
assert.equal(map.burnedCount('lspv'), 0);
assert.equal(changes, 1);
off();

const strips = [];
const panel = createPviPanel(doc, { getLang: () => 'tr', onRecording: (r) => strips.push(r) });
panel.setVisible(true);
assert.equal(strips.length, 1, 'opening sends the strip');
assert.ok(strips[0].events.pv.some((e) => e.type === 'PV'));
for (let i = 0; i < PVI_DOTS; i++) panel.map.burn('lspv', i);
assert.ok(!strips.at(-1).events.pv.some((e) => e.type === 'PV'), 'completing the sampled ring sends the entrance-block strip');
for (const vein of ['lipv', 'rspv', 'ripv']) for (let i = 0; i < PVI_DOTS; i++) panel.map.burn(vein, i);
assert.ok(strips.at(-1).sinus, 'all rings: sinus strip');
const intro = panel.element.children.find((c) => c.className === 'ep-pace-note');
assert.match(intro.textContent, /Şemada/);
assert.ok(!/3B|3D/.test(intro.textContent), 'no 3D wording left');
panel.setVisible(false);
assert.equal(panel.map.isActive(), false, 'hidden panel stops taking clicks');

console.log('PASS ep-pvi: immutable lesion state, entrance block read from events per vein, sinus only after all four rings, baseline clip and texts consistent, 2D lesion map (layout, clicks only while active, keyboard, reset), panel strips follow the map');

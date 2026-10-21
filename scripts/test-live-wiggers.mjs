import assert from 'node:assert/strict';
import { leftHeartFrame, pressureColor, pressureRGB, PRESSURE_MIN, PRESSURE_MAX } from '../src/left-heart-pressures.js';
import { EVENTS, DEFAULT_PROFILE, atrialPressure, ventricularPressure, aorticPressure, ventricularVolume } from '../src/wiggers.js';
import { CARDIAC_INTERVALS, phaseToTime, createCardiacCycle } from '../src/cardiac-cycle.js';
import { createLiveWiggersPanel, laStripSamples, rightStripSamples } from '../src/live-wiggers-panel.js';
import { rightHeartFrame, RIGHT_EVENTS, RIGHT_TARGETS } from '../src/right-heart-pressures.js';

const near = (a, b, label, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${label}: ${a} vs ${b}`);
for (const rhythm of ['sinus', 'afib']) for (const bpm of [40, 72, 140]) for (let i = 0; i < 1000; i++) {
  const phase = i / 1000;
  const f = leftHeartFrame({ phase, rhythm, bpm });
  near(f.la, atrialPressure(phase, rhythm, DEFAULT_PROFILE), 'LA from true atrial function');
  near(f.lv, ventricularPressure(phase, rhythm, DEFAULT_PROFILE), 'LV matches chart');
  near(f.ao, aorticPressure(phase, rhythm, DEFAULT_PROFILE), 'Ao matches chart');
  near(f.volume, ventricularVolume(phase, rhythm), 'volume matches chart');
  near(f.elapsedMs, phaseToTime(f.phase, bpm) * f.cycleMs, 'physiologic phase mapped to real time');
  assert.ok([f.la, f.lv, f.ao, f.volume, f.elapsedMs, f.cycleMs].every(Number.isFinite));
  assert.ok(f.elapsedMs >= 0 && f.elapsedMs < f.cycleMs);
}
for (const phase of [-1.25, -.25, 0, 1, 2, 3.75]) {
  const f = leftHeartFrame({ phase });
  const equivalent = leftHeartFrame({ phase: phase - Math.floor(phase) });
  near(f.la, equivalent.la, 'wrapped pressure');
  assert.ok(f.phase >= 0 && f.phase < 1);
}
for (const value of [NaN, Infinity, -Infinity, undefined]) {
  const frame = leftHeartFrame({ phase: value, bpm: value });
  assert.ok([frame.phase, frame.bpm, frame.la, frame.lv, frame.ao, frame.cycleMs].every(Number.isFinite));
}
for (const [key, before, at] of [
  ['mitralClose', [true, false], [false, false]],
  ['aorticOpen', [false, false], [false, true]],
  ['aorticClose', [false, true], [false, false]]
]) {
  const a = leftHeartFrame({ phase: EVENTS[key] - 1e-7 });
  const b = leftHeartFrame({ phase: EVENTS[key] });
  assert.deepEqual([a.mitralOpen, a.aorticOpen], before, `${key}: before`);
  assert.deepEqual([b.mitralOpen, b.aorticOpen], at, `${key}: event boundary`);
}
assert.deepEqual([leftHeartFrame({ phase: 1 }).mitralOpen, leftHeartFrame({ phase: 1 }).aorticOpen], [true, false], 'mitral opens at wrap');
for (const interval of CARDIAC_INTERVALS) {
  assert.equal(leftHeartFrame({ phase: interval.start }).intervalId, interval.id, 'boundary belongs to next interval');
}
for (const [start, end, expectedVolume] of [[EVENTS.mitralClose, EVENTS.aorticOpen, 120], [EVENTS.aorticClose, 1, 50]]) {
  const samples = Array.from({ length: 100 }, (_, i) => leftHeartFrame({ phase: start + (end - start) * i / 100 }));
  assert.ok(samples.every(f => !f.mitralOpen && !f.aorticOpen), 'isovolumetric: both valves closed');
  assert.ok(samples.every(f => Math.abs(f.volume - expectedVolume) < 1e-9), 'isovolumetric: volume constant');
  assert.ok(Math.max(...samples.map(f => f.lv)) - Math.min(...samples.map(f => f.lv)) > 40, 'isovolumetric pressure changes');
}
for (const phase of [EVENTS.aorticOpen, EVENTS.aorticClose]) {
  const f = leftHeartFrame({ phase });
  near(f.lv, f.ao, 'LV-Ao pressure crossing', 0.0001);
}
const mitralOpen = leftHeartFrame({ phase: 0 });
near(mitralOpen.la, mitralOpen.lv, 'LA-LV crossing at mitral opening');
const late = leftHeartFrame({ phase: 0.8 });
assert.ok(late.ao > late.lv && late.aorticOpen, 'late ejection: instantaneous pressure gradient alone does not close valve');
assert.notEqual(pressureColor(12), pressureColor(120));
assert.deepEqual(pressureRGB(-50), pressureRGB(PRESSURE_MIN));
assert.deepEqual(pressureRGB(1000), pressureRGB(PRESSURE_MAX));
for (let p = 0; p <= 140; p++) {
  assert.equal(pressureColor(p), pressureColor(Number(String(p))), 'equal absolute pressures, equal colors');
  assert.match(pressureColor(p), /^#[0-9a-f]{6}$/);
}

class Node {
  constructor(tag, doc) {
    this.tagName = tag; this.ownerDocument = doc; this.children = []; this.attributes = {}; this.listeners = {}; this.value = ''; this.textContent = '';
    this.style = { setProperty: (key, value) => { this.style[key] = value; } };
  }
  appendChild(node) { this.children.push(node); return node; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(key, handler) { this.listeners[key] = handler; }
  getContext() { return null; }
}
const doc = { createElement: tag => new Node(tag, doc) };
const mount = new Node('div', doc);
const clock = createCardiacCycle({ playing: true, phase: .6 });
const mutations = [];
const ui = createLiveWiggersPanel(mount, {
  getCycleState: clock.getCycleState,
  onSeek: p => { mutations.push(['seek', p]); clock.seekCycle(p); },
  onPlaying: p => { mutations.push(['playing', p]); clock.setPlaying(p); },
  onBpm: clock.setBpm, onSpeed: clock.setSpeed
});
assert.equal(mutations.length, 0, 'mount does not mutate clock');
assert.equal(ui.element.hidden, true);
ui.setActive(true);
ui.tick(clock.getCycleState());
near(ui.getState().frame.phase, .6, 'panel uses engine clock');
ui.setLanguage('en');
assert.equal(ui.getState().lang, 'en');
assert.equal(clock.getCycleState().playing, true, 'language does not freeze');
const collect = node => [node, ...node.children.flatMap(collect)];
const nodes = collect(ui.element);
const phaseInput = nodes.find(node => node.tagName === 'input' && node.attributes['aria-label'] === 'Scrub cycle');
phaseInput.value = '0.7'; phaseInput.listeners.input();
near(clock.getCycleState().phase, .7, 'seek callback drives shared clock');
assert.equal(clock.getCycleState().playing, false, 'scrub freezes native clock');
ui.setActive(false);
const frozen = ui.getState().frame.phase;
clock.seekCycle(.2); ui.tick(clock.getCycleState());
near(ui.getState().frame.phase, frozen, 'inactive tick does not redraw');
phaseInput.value = '.3'; phaseInput.listeners.input();
near(clock.getCycleState().phase, .2, 'inactive controls do not mutate heart');
ui.setActive(true);
near(ui.getState().frame.phase, .2, 'activation reads actual clock');
assert.equal(ui.getState().playing, false);
// Peak LV is never below peak aortic pressure; aorta exceeds LV only late in ejection.
{
  let lvPeak = 0, aoPeak = 0;
  for (let i = 0; i <= 4000; i++) { const f = leftHeartFrame({ phase: i / 4000 }); lvPeak = Math.max(lvPeak, f.lv); aoPeak = Math.max(aoPeak, f.ao); }
  assert.ok(aoPeak <= lvPeak + 1e-9, `peak aortic ${aoPeak} <= peak LV ${lvPeak}`);
  const early = leftHeartFrame({ phase: EVENTS.aorticOpen + 0.03 });
  assert.ok(early.lv > early.ao, 'early ejection: LV above aorta');
}
// LA strip: a, c and v peaks in order on the shared time axis.
{
  const strip = laStripSamples(leftHeartFrame({ phase: .3, bpm: 72 }));
  assert.deepEqual(strip.peaks.map(p => p.name), ['a', 'c', 'v']);
  assert.ok(strip.peaks[0].tau < strip.peaks[1].tau && strip.peaks[1].tau < strip.peaks[2].tau, 'a before c before v');
  assert.ok(strip.samples.every(s => s.la >= 0 && s.la <= 20), 'LA fits the 0-20 mmHg strip');
}
// Right heart: normal targets, valve order around the aortic events, valve logic consistent with pressures.
{
  assert.ok(RIGHT_EVENTS.pulmonaryOpen < EVENTS.aorticOpen, 'pulmonary valve opens before aortic');
  assert.ok(RIGHT_EVENTS.pulmonaryClose > EVENTS.aorticClose, 'P2 after A2');
  let rvMax = -Infinity, rvMin = Infinity, paMax = -Infinity, paMin = Infinity, prev = null;
  for (let i = 0; i <= 4000; i++) {
    const f = rightHeartFrame({ phase: i / 4000, bpm: 72 });
    rvMax = Math.max(rvMax, f.rv); rvMin = Math.min(rvMin, f.rv); paMax = Math.max(paMax, f.pa); paMin = Math.min(paMin, f.pa);
    assert.ok(!(f.tricuspidOpen && f.pulmonaryOpen), 'tricuspid and pulmonary never open together');
    if (f.tricuspidOpen) assert.ok(f.rv <= f.ra + 0.25, 'tricuspid open only when RV <= RA');
    if (!f.pulmonaryOpen) assert.ok(f.pa >= f.rv - 0.5, 'closed pulmonary valve: PA not below RV');
    if (prev !== null && i < 4000) assert.ok(Math.abs(f.pa - prev) < 1.5, `PA continuous at ${i / 4000}`);
    prev = f.pa;
  }
  near(rvMax, RIGHT_TARGETS.rv.systolic, 'RV systolic target', 1.5);
  assert.ok(paMax <= rvMax + 1 && paMax > 22, `PA systolic ~25 (${paMax})`);
  assert.ok(paMin >= RIGHT_TARGETS.pa.diastolic - 1.5, `PA diastolic ~10 (${paMin})`);
  assert.ok(rvMin >= 0 && rvMin < 6, `RV diastolic low (${rvMin})`);
  const strip = rightStripSamples({ bpm: 72 });
  assert.ok(strip.every(s => s.ra >= 0 && s.pa <= 30 && s.rv <= 30), 'right strip fits 0-30 mmHg');
}
console.log('PASS live-wiggers: shared Wiggers pressures, event boundaries, time warp, isovolumetric volume, absolute colors, callback controls and inactive lifecycle');

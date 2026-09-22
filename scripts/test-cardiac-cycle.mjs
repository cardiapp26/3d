import assert from 'node:assert/strict';
import {
  createCardiacCycle,
  CARDIAC_INTERVALS,
  RHYTHM_PRESETS,
  getIntervalForPhase
} from '../src/cardiac-cycle.js';

console.log('Running Cardiac-Cycle State Engine Unit Tests...\n');

// 1. Initialization and defaults
const cycle = createCardiacCycle();
const s0 = cycle.getCycleState();
assert.equal(s0.bpm, 72, 'Default BPM is 72');
assert.equal(s0.phase, 0.0, 'Default phase is 0.0');
assert.equal(s0.playing, false, 'Default playing is false');
assert.equal(s0.rhythm, 'sinus', 'Default rhythm is sinus');
assert.equal(s0.speed, 1, 'Default speed is 1');
assert.equal(s0.reducedMotion, false, 'Default reducedMotion is false');
assert.equal(s0.interval.id, 'rapid-filling', 'Phase 0.0 is rapid-filling');
console.log('PASS: Defaults and initialization');

// 2. BPM clamping and update
cycle.setBpm(15);
assert.equal(cycle.getCycleState().bpm, 30, 'BPM clamped to minimum 30');
cycle.setBpm(250);
assert.equal(cycle.getCycleState().bpm, 200, 'BPM clamped to maximum 200');
cycle.setBpm(80);
assert.equal(cycle.getCycleState().bpm, 80, 'BPM updated to 80');
assert.equal(cycle.getCycleState().cycleDurationMs, 750, 'Cycle duration at 80 BPM is 750ms');
console.log('PASS: BPM clamping and duration');

// 3. Interval mapping across all 6 phases
assert.equal(getIntervalForPhase(0.05).id, 'rapid-filling');
assert.equal(getIntervalForPhase(0.25).id, 'diastasis');
assert.equal(getIntervalForPhase(0.40).id, 'atrial-systole');
assert.equal(getIntervalForPhase(0.50).id, 'isovolumetric-contraction');
assert.equal(getIntervalForPhase(0.70).id, 'ventricular-ejection');
assert.equal(getIntervalForPhase(0.95).id, 'isovolumetric-relaxation');
console.log('PASS: All 6 interval mappings verified');

// 4. Seek and wrap
cycle.seekCycle(0.65);
assert.equal(+cycle.getCycleState().phase.toFixed(2), 0.65, 'Seek to 0.65');
assert.equal(cycle.getCycleState().interval.id, 'ventricular-ejection');
cycle.seekCycle(1.25);
assert.equal(+cycle.getCycleState().phase.toFixed(2), 0.25, 'Seek wraps > 1.0 to 0.25');
cycle.seekCycle(-0.1);
assert.equal(+cycle.getCycleState().phase.toFixed(2), 0.90, 'Seek wraps < 0.0 to 0.90');
console.log('PASS: Seek and modulo phase wrapping');

// 5. Deterministic stepping (tick)
cycle.seekCycle(0.0);
cycle.setBpm(60); // 60 BPM -> 1000ms per cycle
cycle.setPlaying(false);
cycle.tick(250);
assert.equal(cycle.getCycleState().phase, 0.0, 'Paused cycle does not advance on tick');

cycle.setPlaying(true);
cycle.tick(250);
assert.equal(+cycle.getCycleState().phase.toFixed(2), 0.25, '250ms tick at 60 BPM advances phase by 0.25');
cycle.tick(750);
assert.equal(+cycle.getCycleState().phase.toFixed(2), 0.00, 'Full cycle wrap to 0.00');

// Deterministic repeat check: same steps yield exact same phase
const cycleA = createCardiacCycle({ bpm: 120, playing: true });
const cycleB = createCardiacCycle({ bpm: 120, playing: true });
for (let step = 0; step < 10; step++) {
  cycleA.tick(33.33);
  cycleB.tick(33.33);
}
assert.equal(cycleA.getCycleState().phase, cycleB.getCycleState().phase, 'Deterministic reproducibility identical');
console.log('PASS: Deterministic tick and pause behavior');

// 6. Subscription lifecycle
let eventCount = 0;
let lastSeenPhase = -1;
const unsubscribe = cycle.subscribeCycle(state => {
  eventCount++;
  lastSeenPhase = state.phase;
});
assert.equal(eventCount, 1, 'Immediate event on subscribe');
cycle.seekCycle(0.42);
assert.equal(eventCount, 2, 'Event dispatched on seek');
assert.equal(+lastSeenPhase.toFixed(2), 0.42);
unsubscribe();
cycle.seekCycle(0.88);
assert.equal(eventCount, 2, 'No further events after unsubscribe');
console.log('PASS: Subscription and listener lifecycle');

// 7. Rhythm presets
cycle.setRhythm('bradycardia');
assert.equal(cycle.getCycleState().rhythm, 'bradycardia');
assert.equal(cycle.getCycleState().bpm, 48);
cycle.setRhythm('tachycardia');
assert.equal(cycle.getCycleState().rhythm, 'tachycardia');
assert.equal(cycle.getCycleState().bpm, 130);
console.log('PASS: Rhythm presets');

console.log('\nALL 7 CARDIAC CYCLE TESTS PASSED!');

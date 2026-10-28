// Animated lead rotation (src/eps/csp/csp-spin.mjs): duration, eased depth, phase, pacing pause.
import assert from 'node:assert/strict';
import { createSpin, advanceSpin, displayDepth, phaseOf, progressOf, pacingPaused, TURN_MS, RAPID_TURN_MS } from '../../src/eps/csp/csp-spin.mjs';

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };

test('a turn lasts TURN_MS, a rapid triple three short turns; the drawn depth is eased from old to new', () => {
  let s = createSpin({ fromDepth: 2, toDepth: 3.4, turns: 1, lead: 'lumenless' });
  assert.equal(s.duration, TURN_MS);
  assert.equal(createSpin({ fromDepth: 0, toDepth: 4.2, turns: 3, lead: 'lumenless' }).duration, 3 * RAPID_TURN_MS);
  assert.equal(displayDepth(s), 2);
  s = advanceSpin(s, TURN_MS / 2);
  assert.ok(Math.abs(displayDepth(s) - 2.7) < 1e-9, 'half way at half time (symmetric easing)');
  assert.ok(Math.abs(phaseOf(s) - .5) < 1e-9);
  const early = displayDepth(advanceSpin(createSpin({ fromDepth: 2, toDepth: 3.4, turns: 1, lead: 'x' }), TURN_MS / 10));
  assert.ok(early - 2 < .14 * .5, 'slow start');
  assert.equal(advanceSpin(s, TURN_MS), null, 'finished');
  assert.equal(progressOf(null), 1); assert.equal(advanceSpin(null, 10), null);
  assert.equal(advanceSpin(createSpin({ fromDepth: 0, toDepth: 1, turns: 1, lead: 'x' }), -50).elapsed, 0, 'time never runs backward');
});
test('only a lumenless lead pauses pacing while it turns', () => {
  assert.equal(pacingPaused(createSpin({ fromDepth: 0, toDepth: 1, turns: 1, lead: 'lumenless' })), true);
  assert.equal(pacingPaused(createSpin({ fromDepth: 0, toDepth: 1, turns: 1, lead: 'stylet' })), false);
  assert.equal(pacingPaused(null), false);
});
console.log(`${passed} spin tests passed`);

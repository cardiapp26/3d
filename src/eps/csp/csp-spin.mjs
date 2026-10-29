/** Animated lead rotation for the CSP implant console. A turn is applied to the procedure at
 * once (so fixation beats can fall while the helix works), then shown over time: the drawn tip
 * slides from the old to the new depth and the helix mark spins. A lumenless lead is turned off
 * the pacing clips, so pacing pauses until the turn ends; a stylet-driven lead keeps pacing.
 * Pure data; the console owns the clock.
 */
export const TURN_MS = 900;          // one full turn
export const RAPID_TURN_MS = 500;    // each turn of a rapid triple
const ease = x => (x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

/**
 * @param {{ fromDepth: number, toDepth: number, turns: number, lead: string }} turn
 */
export function createSpin({ fromDepth, toDepth, turns, lead }) {
  const n = Math.max(1, turns | 0);
  return { fromDepth, toDepth, turns: n, lead, elapsed: 0, duration: n * (n > 1 ? RAPID_TURN_MS : TURN_MS) };
}

/** Advance by dt ms; returns the next spin, or null once the turn has finished. */
export function advanceSpin(spin, dt) {
  if (!spin) return null;
  const elapsed = spin.elapsed + Math.max(0, dt);
  return elapsed >= spin.duration ? null : { ...spin, elapsed };
}

export const progressOf = spin => (spin ? Math.min(1, spin.elapsed / spin.duration) : 1);
/** Depth to draw (mm): eased from the old to the new depth. */
export const displayDepth = spin => spin.fromDepth + (spin.toDepth - spin.fromDepth) * ease(progressOf(spin));
/** Helix phase in turns (0..turns), for the spinning mark. */
export const phaseOf = spin => progressOf(spin) * spin.turns;
/** Pacing is paused while a lumenless lead is turned. */
export const pacingPaused = spin => Boolean(spin) && spin.lead === 'lumenless';

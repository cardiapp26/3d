/*
 * Rhythm timeline of the 3D EAM workstation (pure).
 *
 * A segment says what the heart does from `fromMs` on: { fromMs, scenarioId, ablated, stim }.
 * The polygraph and the 3D map replay the segments, so a pacing train or a terminated
 * tachycardia stays on the trace instead of the whole window being redrawn as the new rhythm.
 */

const MAX_SEGMENTS = 12;

const makeSegment = (fromMs, { scenarioId, ablated = [], stim = null }) =>
  Object.freeze({ fromMs, scenarioId, ablated: Object.freeze([...ablated]), stim });

/**
 * @param {{ scenarioId: string, ablated?: string[], stim?: object | null }} initial rhythm at time 0
 */
export function createRhythmTimeline(initial) {
  let segments = [makeSegment(0, initial)];

  /** Segment running at `timeMs` (the first one for times before the timeline starts). */
  function at(timeMs) {
    let found = segments[0];
    for (const seg of segments) if (seg.fromMs <= timeMs) found = seg;
    return found;
  }

  return {
    at,
    /**
     * Put a rhythm on the timeline from `fromMs` on (now, or later for the rhythm that follows a
     * pacing train). Drops anything already scheduled from then on.
     */
    startAt(fromMs, rhythm) {
      segments = [...segments.filter((seg) => seg.fromMs < fromMs), makeSegment(fromMs, rhythm)].slice(-MAX_SEGMENTS);
    },
    /** True while the stimulus train of the segment running at `nowMs` is still being delivered. */
    isPacingAt(nowMs) {
      const seg = at(nowMs);
      return Boolean(seg.stim) && nowMs < seg.fromMs + seg.stim.durationMs;
    },
    /** Rhythm, active stimulus train and segment-relative time at `nowMs`, for the 3D map. */
    rhythmAt(nowMs) {
      const seg = at(nowMs);
      const pacing = Boolean(seg.stim) && nowMs < seg.fromMs + seg.stim.durationMs;
      return { scenario: seg.scenarioId, stim: pacing ? seg.stim : null, timeMs: nowMs - seg.fromMs };
    },
    list: () => [...segments],
  };
}

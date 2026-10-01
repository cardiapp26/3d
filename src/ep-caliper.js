/*
 * Caliper references of the electrophysiological anatomy recordings. A
 * caliper names two events (channel, event type, occurrence) and its value
 * is measured from the events at read time: no interval is ever stored next
 * to the recording. Shared by the case catalogs (ep-cases.js,
 * ep-cases-advanced.js), the maneuver model and the renderer.
 */

/** Event reference: the occ-th event of `type` on channel `ch`. */
export const ref = (ch, type, occ = 0) => ({ ch, type, occ });

/** Caliper from event a to event b, drawn on `row` (default: b's channel). */
export const cal = (label, a, b, row = null) => ({ label, a, b, row: row || b.ch });

/** Resolve one caliper reference to its event, or null. */
export function resolveRef(recording, { ch, type, occ }) {
  const list = (recording.events[ch] || []).filter((e) => e.type === type);
  return list[occ] || null;
}

/** Measured caliper value in ms (from the events, not a stored number), or null. */
export function measure(recording, caliper) {
  const a = resolveRef(recording, caliper.a);
  const b = resolveRef(recording, caliper.b);
  return a && b ? Math.round(b.t - a.t) : null;
}

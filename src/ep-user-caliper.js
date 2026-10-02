// User calipers on the EGM strip: two vertical lines across every channel,
// placed by clicking the strip (and dragged afterwards), as on a recording
// system. A line snaps to the nearest event of the clicked row within a few
// milliseconds so a click on a deflection lands on its center. Pure helpers; the panel owns
// the state and the canvas (ep-egm.js draws the lines).

export const CALIPER_SNAP_MS = 8;

/** Empty caliper. */
export const noCaliper = () => ({ a: null, b: null });

/** t moved onto the nearest event of the shown channels within `radius` ms. */
export function snapTime(recording, t, channels, radius = CALIPER_SNAP_MS) {
  if (!Number.isFinite(t)) return null;
  let best = null;
  for (const ch of channels) {
    for (const e of recording?.events?.[ch] || []) {
      const d = Math.abs(e.t - t);
      if (d <= radius && (!best || d < best.d)) best = { d, t: e.t };
    }
  }
  return Math.round(best ? best.t : t);
}

/** Next caliper after a click: first line, then second; a third click starts over. */
export function placeCaliper(caliper, t) {
  if (!Number.isFinite(t)) return caliper;
  return caliper.a == null || caliper.b != null ? { a: t, b: null } : { a: caliper.a, b: t };
}

/** Move one line ('a' or 'b') to t. */
export const moveCaliper = (caliper, end, t) => (Number.isFinite(t) ? { ...caliper, [end]: t } : caliper);

/** Interval between the lines in ms, or null. */
export const caliperSpan = (caliper) => (caliper.a != null && caliper.b != null ? Math.abs(caliper.b - caliper.a) : null);

/** Readout under the strip. */
export function caliperText(caliper, lang) {
  const en = lang === 'en';
  if (caliper.a == null) return en ? 'Calipers: click the strip for the first line.' : 'Kaliper: ilk çizgi için şeride tıklayın.';
  const span = caliperSpan(caliper);
  if (span == null) return en ? 'Calipers: click for the second line.' : 'Kaliper: ikinci çizgi için tıklayın.';
  const rate = span > 0 ? Math.round(60000 / span) : null;
  const perMin = en ? 'bpm' : '/dk';
  return `${en ? 'Calipers' : 'Kaliper'}: ${span} ms${rate ? ` · ${rate} ${perMin}` : ''}${en ? ' (drag a line to adjust)' : ' (çizgiyi sürükleyerek ayarlayın)'}`;
}

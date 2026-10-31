// User calipers on the EGM strip: two vertical lines across every channel,
// placed by clicking the strip (and dragged afterwards), as on a recording
// system. A line snaps to the nearest event of the clicked row within a few
// milliseconds so a click on a deflection lands on its center. Pure helpers; the panel owns
// the state and the canvas (ep-egm.js draws the lines).

import { egmSample } from './ep-egm.js';
import { channelEvents, wavePeaks } from './ep-waveform.js';

export const CALIPER_SNAP_MS = 8;
export const SATURATION_MV = 5;   // a peak-to-peak reading this large is the amplifier at its rail (pacing artifact)

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

/**
 * Peak-to-peak amplitude (model mV) of one channel between two times, sampled every 0.5 ms
 * and at each event's peaks; independent of the display gain. Null without a valid window.
 */
export function peakToPeak(recording, channelId, a, b) {
  const lo = Math.min(a, b), hi = Math.max(a, b);
  if (!recording || !Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return null;
  const step = Math.max(0.5, (hi - lo) / 8000);
  const times = [];
  for (let t = lo; t <= hi; t += step) times.push(t);
  for (const e of channelEvents(recording, channelId)) for (const t of wavePeaks(e)) if (t >= lo && t <= hi) times.push(t);
  let min = Infinity, max = -Infinity;
  for (const t of times) { const v = egmSample(recording, channelId, t); if (v < min) min = v; if (v > max) max = v; }
  return Math.round((max - min) * 100) / 100;
}

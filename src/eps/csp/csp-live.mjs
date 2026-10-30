/** Live recording for the CSP implant console: a sweep (erase bar) of the twelve leads and the
 * tip EGM, beat after beat at the pacing rate. Each beat comes from `nextBeat(time)`, which
 * reads the current lead position, so a turn of the helix shows in the next beat. Pure data
 * plus one drawing function; the caller owns the animation frame.
 */
import { paramsOf, P_LEAD_GAINS, pWaveAt, DISSOCIATED_RHYTHMS, ATRIAL_RATE } from './csp-model.mjs';

export const CHANNELS = Object.freeze(['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'TIP', 'COI']);
export const LAYOUTS = Object.freeze({ all: CHANNELS, focus: ['II', 'III', 'V1', 'V6', 'TIP', 'COI'] });
export const SPEEDS = Object.freeze({ 25: 6000, 50: 3000, 100: 1500 });   // mm/s -> window (ms)
const ERASE_MS = 50;
const STIM_MS = 50;              // the model's stimulus sits 50 ms into its 0-500 ms beat
const ATRIAL_MS = 60000 / ATRIAL_RATE;
const P_CENTRE_MS = 40;          // P wave centre within each atrial cycle

/** Complete heart block: the sinus node keeps firing, so P waves march through at their own rate. */
const dissociated = beat => Boolean(beat?.result?.state) && DISSOCIATED_RHYTHMS.includes(paramsOf(beat.result.state).rhythm);
/** Dissociated atrial P wave in a channel at recorder time t (ms); 0 for the EGM rows. */
export function atrialAt(id, t) {
  const gain = P_LEAD_GAINS[id];
  return gain ? gain * pWaveAt((t % ATRIAL_MS) - P_CENTRE_MS) : 0;
}

/**
 * Beat as sampled channels (1 kHz) from a csp-model result. `stimulus: false` removes the
 * pacing artefact (fixation and intrinsic beats).
 */
export function beatFromResult(result, intervalMs, { stimulus = true, kind = 'paced' } = {}) {
  const length = Math.max(200, Math.round(intervalMs));
  const channels = {};
  const source = { ...result.leads, TIP: result.egm.filtered, COI: result.egm.unfiltered };
  for (const id of CHANNELS) {
    const data = new Float32Array(length);
    const values = source[id];
    for (let i = 0; i < length && i < values.length; i++) data[i] = values[i];
    if (!stimulus) for (let i = STIM_MS - 3; i <= STIM_MS + 3; i++) data[i] = i > 0 ? data[STIM_MS - 4] : 0;
    channels[id] = data;
  }
  return { length, channels, kind, result };
}

export function createRecorder(speed = 50) {
  return { speed, window: SPEEDS[speed] || SPEEDS[50], time: 0, buffers: Object.fromEntries(CHANNELS.map(id => [id, new Float32Array(SPEEDS[speed] || SPEEDS[50])])), beat: null, beatStart: 0, beats: 0, last: null };
}

/** Advance the sweep by `dt` ms; `nextBeat(time)` returns the beat starting at that time. */
export function advance(recorder, dt, nextBeat) {
  const end = recorder.time + Math.min(dt, 250);
  for (let t = Math.floor(recorder.time) + 1; t <= end; t++) {
    if (!recorder.beat || t - recorder.beatStart >= recorder.beat.length) {
      recorder.beat = nextBeat(t);
      recorder.beatStart = t;
      recorder.beats++;
      if (recorder.beat.kind === 'paced') recorder.last = recorder.beat;
    }
    const i = t - recorder.beatStart, slot = t % recorder.window, atria = dissociated(recorder.beat);
    for (const id of CHANNELS) recorder.buffers[id][slot] = (recorder.beat.channels[id][i] || 0) + (atria ? atrialAt(id, t) : 0);
  }
  recorder.time = end;
  return recorder;
}

/**
 * Draw the sweep. `rows` are channel ids; gains scale the ECG and the EGM rows.
 * @returns {{ head: number }} write head position (0..1)
 */
export function drawSweep(ctx, w, h, recorder, { rows = CHANNELS, ecgGain = 1, egmGain = 1, labels = {}, colors = {} } = {}) {
  const left = 46, right = w - 8, top = 8, bottom = h - 18, span = right - left;
  const row = (bottom - top) / rows.length;
  ctx.fillStyle = '#07090c';
  ctx.fillRect(0, 0, w, h);
  // Grid: 200 ms major, 40 ms minor.
  for (let ms = 0; ms <= recorder.window; ms += 40) {
    const x = left + (ms / recorder.window) * span;
    ctx.strokeStyle = ms % 200 === 0 ? '#1c2430' : '#11161d';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
  }
  const head = (recorder.time % recorder.window) / recorder.window;
  rows.forEach((id, r) => {
    const mid = top + (r + .5) * row;
    const egm = id === 'TIP' || id === 'COI';
    const scale = (row * .42) * (egm ? egmGain : ecgGain);
    ctx.fillStyle = colors[id] || '#a9b4c2';
    ctx.font = '600 10px ui-monospace, monospace';
    ctx.fillText(labels[id] || id, 6, mid + 3);
    ctx.save();
    ctx.beginPath(); ctx.rect(left, top + r * row, span, row); ctx.clip();
    ctx.strokeStyle = colors[id] || '#d3dae3';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const buffer = recorder.buffers[id];
    const headSlot = Math.floor(recorder.time) % recorder.window;
    let drawing = false;
    // One point per pixel column (the peak of its samples keeps narrow spikes visible).
    const perPx = recorder.window / span;
    for (let px = 0; px < span; px++) {
      const from = Math.floor(px * perPx), to = Math.max(from + 1, Math.floor((px + 1) * perPx));
      const ahead = (from - headSlot + recorder.window) % recorder.window;
      if (ahead > 0 && ahead < ERASE_MS) { drawing = false; continue; }
      let v = buffer[from];
      for (let k = from + 1; k < to; k++) if (Math.abs(buffer[k]) > Math.abs(v)) v = buffer[k];
      const y = mid - v * scale;
      if (drawing) ctx.lineTo(left + px, y); else { ctx.moveTo(left + px, y); drawing = true; }
    }
    ctx.stroke();
    ctx.restore();
  });
  // Erase bar.
  ctx.fillStyle = 'rgba(90, 169, 230, .18)';
  ctx.fillRect(left + head * span, top, Math.max(2, (ERASE_MS / recorder.window) * span), bottom - top);
  ctx.fillStyle = '#6b7787';
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillText(`${recorder.speed} mm/s`, right - 60, h - 5);
  return { head };
}

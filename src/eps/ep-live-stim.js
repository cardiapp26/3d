/*
 * Programmed stimulation of the live EP laboratory: drive trains (S1 x N)
 * followed by up to three extrastimuli, the last one shortened by a fixed
 * step on every drive until it reaches a lower limit, fails to capture
 * (refractory) or induces a tachycardia. Each drive is read from the
 * recorded events: capture, A-H (atrial site) or V-A (ventricular site),
 * an AH jump, an echo beat and a sustained tachycardia. Pure functions on
 * designed model timings (ms); not a clinical stimulator.
 */
import { SITE_CHANNEL } from './ep-live-model.js';

export const STIM_DEFAULTS = Object.freeze({ s1: 600, n: 8, extras: [400, 0, 0], step: 10, limit: 200, rest: 2 });
export const STIM_RANGE = Object.freeze({ s1: [200, 1500], n: [1, 20], extra: [0, 1000], step: [1, 50], limit: [150, 600], rest: [1, 10] });
export const JUMP_MS = 50;           // AH (or VA) prolongation for one step that reads as a jump
const CAPTURE_MS = 40;               // paced activation within this time after the stimulus
const RETRO = new Set(['avn-fast', 'avn-slow', 'ap-left', 'ap-ps']);
const SUSTAINED_CL = 500;            // at least four beats faster than this after the drive
const DRIVE_GAP_MS = 1000;           // shortest pause between drives (the readout window)

const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));
const of = (events, ch, type) => (events[ch] || []).filter((e) => e.type === type);

/** Settings clamped to the stimulator ranges; extrastimuli after a 0 are dropped. */
export function normalizeStim(input = {}) {
  const num = (v, fallback) => (Number.isFinite(Number(v)) && v !== '' && v != null ? Number(v) : fallback);
  const extras = [];
  for (const x of input.extras ?? STIM_DEFAULTS.extras) {
    const v = clamp(Math.round(num(x, 0)), STIM_RANGE.extra);
    if (!(v > 0)) break;
    extras.push(v);
  }
  return {
    site: SITE_CHANNEL[input.site] ? input.site : 'hra',
    s1: clamp(Math.round(num(input.s1, STIM_DEFAULTS.s1)), STIM_RANGE.s1),
    n: clamp(Math.round(num(input.n, STIM_DEFAULTS.n)), STIM_RANGE.n),
    extras,
    step: clamp(Math.round(num(input.step, STIM_DEFAULTS.step)), STIM_RANGE.step),
    limit: clamp(Math.round(num(input.limit, STIM_DEFAULTS.limit)), STIM_RANGE.limit),
    rest: clamp(num(input.rest, STIM_DEFAULTS.rest), STIM_RANGE.rest)
  };
}

/**
 * Drives of a decremental extrastimulus run, timed from their own start
 * (place each with placeDrive): every drive repeats the S1 train and the
 * extrastimuli, the last extrastimulus `step` ms shorter than on the drive
 * before, down to `limit`. A drive's readout lasts `rest` seconds after
 * its last stimulus.
 */
export function planProgrammed(input) {
  const s = normalizeStim(input);
  if (!s.extras.length) return [];
  const fixed = s.extras.slice(0, -1), first = s.extras[s.extras.length - 1];
  const gap = Math.max(DRIVE_GAP_MS, s.rest * 1000);
  const drives = [];
  for (let last = first; last >= s.limit; last -= s.step) {
    const couplings = [...fixed, last];
    const stims = Array.from({ length: s.n }, (_, i) => ({ t: i * s.s1, site: s.site }));
    let at = stims[stims.length - 1].t;
    for (const c of couplings) { at += c; stims.push({ t: at, site: s.site }); }
    drives.push({ index: drives.length, site: s.site, s1: s.s1, couplings, stims, end: at + gap - 50 });
  }
  return drives;
}

/** A planned drive moved to start at `start` (absolute ms). */
export const placeDrive = (drive, start) => ({ ...drive, start, stims: drive.stims.map((x) => ({ ...x, t: x.t + start })), end: drive.end + start });

/**
 * Start of the next drive: not before `now`, and the first S1 one drive
 * cycle after the last spontaneous activation at the paced chamber, so the
 * train does not begin with a premature beat of its own.
 */
export function driveStart(events, now, site, s1) {
  const list = site === 'rv' ? of(events, 'rv', 'V') : of(events, SITE_CHANNEL[site], 'A');
  const lastT = list.filter((e) => e.t <= now).map((e) => e.t).pop();
  return Math.round(Math.max(now + 100, lastT == null ? now + 100 : lastT + s1));
}

/** Four or more ventricular beats after t, the last three cycles shorter than SUSTAINED_CL. */
function sustainedAfter(events, t, end) {
  const vs = of(events, 'rv', 'V').map((e) => e.t).filter((v) => v > t + 60 && v < end);
  if (vs.length < 4) return false;
  const cl = vs.slice(1).map((v, i) => v - vs[i]);
  return cl.slice(-3).every((c) => c < SUSTAINED_CL);
}

/** One drive's readout from the events recorded during it (absolute times). */
export function analyzeDrive(events, drive) {
  const last = drive.stims[drive.stims.length - 1];
  const coupling = drive.couplings[drive.couplings.length - 1];
  const base = { index: drive.index, site: drive.site, label: `S${drive.couplings.length + 1}`, coupling, sustained: sustainedAfter(events, last.t, drive.end) };
  if (drive.site === 'rv') {
    const v = of(events, 'rv', 'V').find((e) => e.origin === 'rv' && e.t >= last.t && e.t <= last.t + CAPTURE_MS);
    const a = v ? of(events, 'his-d', 'A').find((e) => RETRO.has(e.origin) && e.t > v.t && e.t < v.t + 450) : null;
    return { ...base, ventricular: true, capture: Boolean(v), va: a ? Math.round(a.t - v.t) : null, retro: a?.origin ?? null };
  }
  const ch = SITE_CHANNEL[drive.site];
  const capture = of(events, ch, 'A').some((e) => e.origin === drive.site && e.t >= last.t && e.t <= last.t + CAPTURE_MS);
  // The His this extrastimulus produced: H events carry the time its wavefront entered the AV junction (aj).
  const aj = capture ? of(events, 'his-d', 'A').find((e) => e.origin === drive.site && e.t >= last.t && e.t <= last.t + 120) : null;
  const h = aj ? of(events, 'his-d', 'H').find((e) => e.aj != null && e.aj >= last.t && e.aj <= last.t + 120) : null;
  const echo = h ? of(events, 'his-d', 'A').find((e) => RETRO.has(e.origin) && e.t > h.t && e.t < h.t + 400) : null;
  return { ...base, ventricular: false, capture, ah: h ? Math.round(h.t - aj.t) : null, path: h?.path ?? null, echo: Boolean(echo), echoOrigin: echo?.origin ?? null };
}

/** Readouts with the jump (one step prolonging the conduction time by JUMP_MS or more) marked. */
export function markJumps(rows) {
  const key = (r) => (r.ventricular ? r.va : r.ah);
  return rows.map((r, i) => {
    const prev = rows[i - 1];
    return { ...r, jump: Boolean(prev && key(r) != null && key(prev) != null && key(r) - key(prev) >= JUMP_MS) };
  });
}

/** True when the run should stop after this readout: refractory, or a tachycardia started. */
export const driveEnds = (row) => !row.capture || row.sustained;

/** Summary of a run: refractory periods, jump, echo, induction and why it ended. */
export function summarizeProgrammed(rows, { reason = null } = {}) {
  const marked = markJumps(rows);
  const first = (test) => marked.find(test)?.coupling ?? null;
  const ventricular = Boolean(marked[0]?.ventricular);
  const lastRow = marked[marked.length - 1];
  return {
    ventricular,
    label: marked[0]?.label ?? 'S2',
    erp: first((r) => !r.capture && !r.sustained),   // a running tachycardia, not refractoriness, explains that loss of capture
    nodeErp: ventricular ? null : first((r) => r.capture && r.ah == null),
    vaBlock: ventricular ? first((r) => r.capture && r.va == null) : null,
    jump: first((r) => r.jump),
    echo: ventricular ? null : first((r) => r.echo),
    induced: first((r) => r.sustained),
    reason: reason ?? (!lastRow ? null : lastRow.sustained ? 'induced' : !lastRow.capture ? 'erp' : 'limit'),
    drives: marked.length
  };
}

import { CYCLE_SYNC as S, timeToPhase, phaseToTime } from './cardiac-cycle.js';
import { ecgSample } from './ecg-trace.js';
import { jvpCurve, targetMean, tricuspidOpen } from './jvp-physiology.js';
import { SCENARIOS as HEMO } from './hemo-scenarios.js';

/*
 * Time strips of the jugular venous pulse module (research/
 * VENOZ_BASINC_FIZIK_MUAYENE_MODUL_RAPORU.md, JVP-01 to JVP-04). Where the
 * single-beat view lives on the template phase, a strip lives on seconds: one
 * event list (ventricular cycles, atrial contractions, maneuver or ventilator
 * phases) from which the pressure, the ECG, the valve state, the heart pose
 * and the cursor are all read, so pausing, slow motion or a restart cannot
 * pull the channels apart. Ventricular cycles start at tricuspid opening
 * (template phase 0), like the shared cardiac clock. DOM free; every number
 * is a teaching parameter recorded in jvp-parameters.js.
 */

export const CM_H2O_PER_MMHG = 1.36;
const SINUS_RR = 60 / 72;
const SAMPLE = 0.01;               // s, numerical means and evaluation

const wrapTime = (t, duration) => ((t % duration) + duration) % duration;
const bell = (dt, width) => Math.exp(-0.5 * (dt / width) ** 2);

/** Deterministic pseudo-random numbers in [0, 1) (mulberry32). */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Ventricular clock from a list of cycle lengths (s). Each cycle runs the
 * template phase 0..1 with the rate warp of cardiac-cycle.js, so systole
 * keeps its length and diastole absorbs a short or long RR.
 */
export function ventricularClock(rrs) {
  const starts = [];
  let duration = 0;
  for (const rr of rrs) { starts.push(duration); duration += rr; }
  const locate = t => {
    const w = wrapTime(t, duration);
    let i = starts.length - 1;
    while (i > 0 && starts[i] > w) i--;
    return { index: i, local: w - starts[i], rr: rrs[i] };
  };
  return Object.freeze({
    rrs: Object.freeze([...rrs]), starts: Object.freeze(starts), duration,
    locate,
    phaseAt(t) { const { local, rr } = locate(t); return timeToPhase(local / rr, 60 / rr); },
    /** Time (s) of template phase u inside cycle i. */
    timeOf(i, u) { return starts[i] + phaseToTime(u, 60 / rrs[i]) * rrs[i]; }
  });
}

function numericMean(fn, duration) {
  let sum = 0, n = 0;
  for (let t = 0; t < duration; t += SAMPLE) { sum += fn(t); n++; }
  return sum / n;
}

// Per-cycle event times the strip draws: QRS, S1, S2, tricuspid closure and opening.
function cycleEvents(clock) {
  return clock.rrs.map((rr, i) => ({
    start: clock.starts[i], rr,
    qrs: clock.timeOf(i, S.qrsPeak), s1: clock.timeOf(i, S.ivcStart), s2: clock.timeOf(i, S.ivrStart),
    tvClose: clock.timeOf(i, S.avClosed)
  }));
}

function strip(base) {
  const mean = numericMean(base.pressure, base.duration);
  return Object.freeze({
    ...base, mean,
    tricuspidOpenAt: t => tricuspidOpen(base.phaseAt(t)),
    cycles: cycleEvents(base.clock)
  });
}

// Relative beat shape of a single-beat scenario (its own mean removed).
const beatShape = id => { const c = jvpCurve(id); return u => c.pressure(u) - c.mean; };

// ---------------------------------------------------------------------------
// JVP-01: atrial fibrillation. Irregular ventricular response from a fixed
// seed; no organized atrial contraction (no a wave, no x descent).
// ---------------------------------------------------------------------------
export const AF_RHYTHM = Object.freeze({ seed: 7, beats: 12, rrMin: 0.45, rrMax: 1.1, fibrillation: 6.5 });

export function afStrip({ seed = AF_RHYTHM.seed, beats = AF_RHYTHM.beats, rrMin = AF_RHYTHM.rrMin, rrMax = AF_RHYTHM.rrMax } = {}) {
  const random = seededRandom(seed);
  const clock = ventricularClock(Array.from({ length: beats }, () => rrMin + (rrMax - rrMin) * random()));
  const shape = beatShape('af'), level = targetMean('af');
  // Fibrillatory waves: a whole number of cycles over the strip so the loop is seamless.
  const f = Math.round(AF_RHYTHM.fibrillation * clock.duration) / clock.duration;
  return strip({
    id: 'af', seed, clock, duration: clock.duration, scopes: ['af', 'rhythm-af'],
    phaseAt: clock.phaseAt,
    pressure: t => level + shape(clock.phaseAt(t)),
    ecg: t => ecgSample(clock.phaseAt(t), 'ventricular') + 0.04 * Math.sin(2 * Math.PI * f * t) + 0.02 * Math.sin(2 * Math.PI * 1.37 * f * t),
    atrial: []
  });
}

// ---------------------------------------------------------------------------
// JVP-02: AV dissociation (complete AV block). Separate atrial and
// ventricular clocks; each atrial contraction is a normal a wave when the
// tricuspid valve is open and a cannon a when it meets the closed valve.
// ---------------------------------------------------------------------------
export const AVD_RHYTHM = Object.freeze({ ventricularRate: 40, ventricularBeats: 7, atrialRate: 75, atrialOffset: 0.3, aAmplitude: 2.5, cannonAmplitude: 10, width: 0.06 });
// Atrial contraction peak on the template (middle of atrial systole): the
// schematic electromechanical delay from the P wave is the template interval
// pPeak to this phase at the atrial rate, the same for the 3D atria and the JVP.
const ATRIAL_PEAK = (S.atrialStart + S.atrialEnd) / 2;

export function avdStrip({ ventricularRate = AVD_RHYTHM.ventricularRate, atrialRate = AVD_RHYTHM.atrialRate, atrialOffset = AVD_RHYTHM.atrialOffset } = {}) {
  const rr = 60 / ventricularRate;
  const clock = ventricularClock(Array(AVD_RHYTHM.ventricularBeats).fill(rr));
  const duration = clock.duration;
  // Whole number of atrial beats in the strip (seamless loop); the rate actually used is reported.
  const atrialBeats = Math.max(1, Math.round(atrialRate * duration / 60));
  const pp = duration / atrialBeats;
  const atrialBpm = 60 / pp;
  const contractionDelay = (phaseToTime(ATRIAL_PEAK, atrialBpm) - phaseToTime(S.pPeak, atrialBpm)) * pp;
  // Atrial clock: the template phase of the atria, with its P wave on each P event.
  const atrialStart = atrialOffset - phaseToTime(S.pPeak, atrialBpm) * pp;
  const atrialPhaseAt = t => timeToPhase(wrapTime(t - atrialStart, pp) / pp, atrialBpm);
  const atrial = Array.from({ length: atrialBeats }, (_, k) => {
    const p = atrialOffset + k * pp;
    const contraction = p + contractionDelay;
    const open = tricuspidOpen(clock.phaseAt(contraction));
    return Object.freeze({ p, t: contraction, kind: open ? 'a' : 'cannon', valveOpen: open });
  });
  const shape = beatShape('af');   // the ventricular part: no coupled a wave
  const atrialWave = t => atrial.reduce((sum, e) => {
    const amp = e.kind === 'cannon' ? AVD_RHYTHM.cannonAmplitude : AVD_RHYTHM.aAmplitude;
    let acc = 0;
    for (const shift of [-duration, 0, duration]) {
      const dt = t - e.t - shift;
      acc += amp * bell(dt, AVD_RHYTHM.width) - 0.3 * amp * bell(dt - 0.14, AVD_RHYTHM.width);
    }
    return sum + acc;
  }, 0);
  const raw = t => shape(clock.phaseAt(t)) + atrialWave(t);
  const offset = targetMean('cannon') - numericMean(raw, duration);
  const pWave = t => atrial.reduce((sum, e) => sum + [-duration, 0, duration].reduce((a, s) => a + 0.2 * bell(t - e.p - s, 0.035), 0), 0);
  return strip({
    id: 'avd', clock, duration, scopes: ['cannon', 'rhythm-avd'],
    atrialRate: atrialBeats * 60 / duration, ventricularRate, contractionDelay,
    phaseAt: clock.phaseAt,
    /** Template phase of the separate atrial clock (drives the 3D atria). */
    atrialPhaseAt,
    pressure: t => offset + raw(wrapTime(t, duration)),
    ecg: t => ecgSample(clock.phaseAt(t), 'ventricular') + pWave(wrapTime(t, duration)),
    atrial
  });
}

// Regular sinus beats for the maneuver and ventilator strips.
function sinusStrip(beats, id, level, scopes, extra) {
  const clock = ventricularClock(Array(beats).fill(SINUS_RR));
  const shape = beatShape('normal');
  return strip({
    id, clock, duration: clock.duration, scopes,
    phaseAt: clock.phaseAt,
    pressure: t => level + shape(clock.phaseAt(t)) + extra.offset(wrapTime(t, clock.duration)),
    ecg: t => ecgSample(clock.phaseAt(t), 'sinus'),
    atrial: [],
    ...extra.fields
  });
}

// ---------------------------------------------------------------------------
// JVP-03: abdominojugular test. Baseline, compression, sustained pressure and
// release on one time axis; the judgement follows the protocol's timing, so a
// brief early rise is not a positive test.
// ---------------------------------------------------------------------------
export const AJR_PROTOCOL = Object.freeze({
  id: 'ajr-teaching-v1', source: 'wiese2000',
  baseline: 5,            // s before compression
  compression: 10,        // s of firm periumbilical pressure
  abdominalPressure: 25,  // mmHg, inside the protocol's 20–35 mmHg
  thresholdCm: 4,         // sustained rise and fall on release
  sustainFrom: 5,         // s after onset: the rise must still hold from here to release
  releaseWindow: 3,       // s after release for the fall
  beats: 27               // 22.5 s at 72 bpm
});

export const AJR_RESPONSES = Object.freeze({
  transient: { hemo: 'normal', peak: 4, rise: 0.5, fade: 2.2 },
  sustained: { hemo: 'acute_lv_failure', peak: 5, rise: 0.8, fade: Infinity }
});

function ajrOffset(response, protocol) {
  const r = AJR_RESPONSES[response];
  const start = protocol.baseline, end = start + protocol.compression;
  const shape = dt => (1 - Math.exp(-dt / r.rise)) * (Number.isFinite(r.fade) ? Math.exp(-dt / r.fade) : 1);
  // Normalize the transient so its peak equals r.peak.
  let top = 0;
  for (let dt = 0; dt <= protocol.compression; dt += SAMPLE) top = Math.max(top, shape(dt));
  const during = dt => r.peak * shape(dt) / top;
  const atRelease = during(protocol.compression);
  return t => {
    if (t < start) return 0;
    if (t <= end) return during(t - start);
    return atRelease * Math.exp(-(t - end) / 0.4);
  };
}

export function ajrStrip(response = 'transient', protocol = AJR_PROTOCOL) {
  const r = AJR_RESPONSES[response] || AJR_RESPONSES.transient;
  const level = HEMO[r.hemo].stations.ra.mean;
  const start = protocol.baseline, end = start + protocol.compression;
  return sinusStrip(protocol.beats, 'ajr', level, ['ajr'], {
    offset: ajrOffset(response, protocol),
    fields: {
      response, protocol, rr: SINUS_RR,
      extra: { id: 'abdomen', unit: 'mmHg', max: 40, value: t => (t >= start && t <= end ? protocol.abdominalPressure : 0) },
      stageAt: t => (t < start ? 'baseline' : t <= end ? 'compression' : t <= end + protocol.releaseWindow ? 'release' : 'done')
    }
  });
}

/** Mean pressure over the one RR interval ending at t (wave-free level). */
function beatMean(s, t) {
  let sum = 0, n = 0;
  for (let x = t - s.rr; x < t; x += SAMPLE) { sum += s.pressure(x); n++; }
  return sum / n;
}

/**
 * Protocol judgement of an abdominojugular strip, read from the pressure
 * signal itself (beat-averaged), not from the hidden response shape.
 */
export function evaluateAjr(s) {
  const p = s.protocol, start = p.baseline, end = start + p.compression;
  const base = beatMean(s, start);
  const riseCm = t => (beatMean(s, t) - base) * CM_H2O_PER_MMHG;
  let peakRiseCm = -Infinity, sustainedMinCm = Infinity;
  for (let t = start + s.rr; t <= end; t += 0.25) {
    const r = riseCm(t);
    peakRiseCm = Math.max(peakRiseCm, r);
    if (t >= start + p.sustainFrom) sustainedMinCm = Math.min(sustainedMinCm, r);
  }
  const endRiseCm = riseCm(end);
  const fallCm = endRiseCm - riseCm(end + p.releaseWindow);
  const sustained = sustainedMinCm >= p.thresholdCm;
  const fall = fallCm >= p.thresholdCm;
  return Object.freeze({ baselineMmHg: base, peakRiseCm, sustainedMinCm, endRiseCm, fallCm, sustained, fall, positive: sustained && fall, transientOnly: peakRiseCm >= p.thresholdCm && !sustained });
}

// ---------------------------------------------------------------------------
// JVP-04: positive pressure ventilation. Its own parameters and airway
// pressure timeline: inspiration raises the intrathoracic and so the right
// atrial pressure (relative to atmosphere), the opposite of spontaneous
// breathing; PEEP raises the end-expiratory level. Read at end expiration.
// ---------------------------------------------------------------------------
export const VENTILATION = Object.freeze({ rate: 12, inspiratoryFraction: 1 / 3, peep: 5, plateau: 20, transmission: 0.35, riseTau: 0.25, fallTau: 0.35, breaths: 3 });

export function airwayPressure(t, { peep = VENTILATION.peep, plateau = VENTILATION.plateau } = {}) {
  const cycle = 60 / VENTILATION.rate, ti = cycle * VENTILATION.inspiratoryFraction;
  const x = wrapTime(t, cycle);
  const insp = x2 => peep + (plateau - peep) * (1 - Math.exp(-x2 / VENTILATION.riseTau));
  if (x < ti) return insp(x);
  return peep + (insp(ti) - peep) * Math.exp(-(x - ti) / VENTILATION.fallTau);
}

export function ppvStrip({ peep = VENTILATION.peep, plateau = VENTILATION.plateau } = {}) {
  const cycle = 60 / VENTILATION.rate;
  const beats = Math.round(VENTILATION.breaths * cycle / SINUS_RR);   // 18 beats = 3 breaths
  const settings = { peep, plateau };
  const pleural = t => VENTILATION.transmission * airwayPressure(t, settings) / CM_H2O_PER_MMHG;
  return sinusStrip(beats, 'ppv', targetMean('normal'), ['normal', 'ppv'], {
    offset: pleural,
    fields: {
      settings, rr: SINUS_RR,
      extra: { id: 'airway', unit: 'cmH2O', max: 30, value: t => airwayPressure(t, settings) },
      breathAt: t => (wrapTime(t, cycle) < cycle * VENTILATION.inspiratoryFraction ? 'insp' : 'exp'),
      /** End-expiratory beat-mean pressure: the reading point on the ventilator. */
      endExpiratory: () => beatMeanAt(pleural, cycle - 0.01) + targetMean('normal')
    }
  });
}

const beatMeanAt = (fn, t) => { let sum = 0, n = 0; for (let x = t - SINUS_RR; x < t; x += SAMPLE) { sum += fn(x); n++; } return sum / n; };

export const STRIP_MODES = Object.freeze(['af', 'avd', 'ajr', 'ppv']);

/** Build the strip of a panel mode with its options. */
export function buildStrip(mode, options = {}) {
  if (mode === 'af') return afStrip(options);
  if (mode === 'avd') return avdStrip(options);
  if (mode === 'ajr') return ajrStrip(options.response);
  if (mode === 'ppv') return ppvStrip(options);
  return null;
}

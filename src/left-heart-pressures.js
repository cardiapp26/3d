import { CARDIAC_INTERVALS, phaseToTime, cycleSeconds } from './cardiac-cycle.js';
import {
  DEFAULT_PROFILE, EVENTS, atrialPressure, ventricularPressure,
  aorticPressure, ventricularVolume
} from './wiggers.js';

export const PRESSURE_MIN = 0;
export const PRESSURE_MAX = 140;
export const PRESSURE_TICKS = Object.freeze([0, 20, 40, 60, 80, 100, 120, 140]);
const COLOR_STOPS = Object.freeze([
  [0, [77, 111, 186]],
  [35, [48, 160, 169]],
  [70, [226, 184, 80]],
  [105, [225, 113, 70]],
  [140, [178, 44, 69]]
]);

/** Shared absolute pressure scale; equal pressures always have equal colors. */
export function pressureRGB(pressure) {
  const p = Math.max(PRESSURE_MIN, Math.min(PRESSURE_MAX, Number(pressure) || 0));
  const upper = COLOR_STOPS.findIndex(stop => stop[0] >= p);
  if (upper <= 0) return [...COLOR_STOPS[0][1]];
  const [p0, c0] = COLOR_STOPS[upper - 1];
  const [p1, c1] = COLOR_STOPS[upper];
  const f = (p - p0) / (p1 - p0);
  return c0.map((v, i) => Math.round(v + (c1[i] - v) * f));
}

export function pressureColor(pressure) {
  return `#${pressureRGB(pressure).map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Snapshot only: no timer, independent phase, PCWP proxy or scenario profile. */
export function leftHeartFrame(state = {}) {
  const raw = Number(state.phase);
  let phase = Number.isFinite(raw) ? raw - Math.floor(raw) : 0;
  // The cycle engine's modulo can move exact event boundaries by one ULP.
  for (const interval of CARDIAC_INTERVALS) {
    if (Math.abs(phase - interval.start) < 1e-12) phase = interval.start;
  }
  const bpmInput = Number(state.bpm);
  const bpm = Number.isFinite(bpmInput) && bpmInput > 0 ? Math.max(30, Math.min(200, bpmInput)) : 72;
  const rhythm = state.rhythm || 'sinus';
  const interval = CARDIAC_INTERVALS.find(iv => phase >= iv.start && phase < iv.end) || CARDIAC_INTERVALS[0];
  const cycleMs = cycleSeconds(bpm).cycleSec * 1000;
  return {
    phase, bpm, rhythm,
    la: atrialPressure(phase, rhythm, DEFAULT_PROFILE),
    lv: ventricularPressure(phase, rhythm, DEFAULT_PROFILE),
    ao: aorticPressure(phase, rhythm, DEFAULT_PROFILE),
    volume: ventricularVolume(phase, rhythm),
    mitralOpen: phase < EVENTS.mitralClose,
    aorticOpen: phase >= EVENTS.aorticOpen && phase < EVENTS.aorticClose,
    intervalId: interval.id,
    interval,
    elapsedMs: phaseToTime(phase, bpm) * cycleMs,
    cycleMs
  };
}

import { CARDIAC_INTERVALS, phaseToTime, cycleSeconds } from './cardiac-cycle.js';
import { EVENTS, ventricularVolume } from './wiggers.js';
import { ventricularWave, atrialWaveFactory } from './hemodynamics.js';
import { SCENARIOS } from './hemo-scenarios.js';

/*
 * Right-heart pressures on the shared cycle clock (Live Wiggers, right side).
 * RA, RV and PA come from the hemodynamics normal scenario (RA a 6 / v 4 /
 * mean 5, RV 25/5, PA 25/10 mmHg), shaped from the same Wiggers base curves
 * and phase as the left heart. The valve events come from the pressure
 * crossings: the pulmonary valve opens when RV reaches the PA diastolic
 * pressure (before the aortic valve) and closes when RV falls below the
 * incisura level (P2 after A2); the tricuspid valve follows RA versus RV.
 * The 3D leaflets still move on the left-heart valve channels, a few
 * milliseconds apart. Teaching model, not a patient recording.
 */
const NORMAL = SCENARIOS.normal.stations;
const FLAGS = new Set(SCENARIOS.normal.flags);
const atrialCache = new Map();
const raWave = bpm => {
  const key = Math.round(bpm);
  if (!atrialCache.has(key)) atrialCache.set(key, atrialWaveFactory(NORMAL.ra, FLAGS, key));
  return atrialCache.get(key);
};

export const RIGHT_TARGETS = Object.freeze({ ra: NORMAL.ra, rv: NORMAL.rv, pa: NORMAL.pa });
const PA_INCISURA = NORMAL.pa.diastolic + 0.6 * (NORMAL.pa.systolic - NORMAL.pa.diastolic);   // ~19 mmHg
const rvAt = phase => ventricularWave(phase, NORMAL.rv, FLAGS);

/** Pulmonary valve window and RV peak from the RV curve (phase-based, rate independent). */
export const RIGHT_EVENTS = (() => {
  const step = 1 / 4000;
  let peak = EVENTS.aorticOpen, peakValue = -Infinity;
  for (let u = EVENTS.mitralClose; u < 1; u += step) { const v = rvAt(u); if (v > peakValue) { peakValue = v; peak = u; } }
  let open = EVENTS.mitralClose;
  while (open < peak && rvAt(open) < NORMAL.pa.diastolic) open += step;
  let close = peak;
  while (close < 1 && rvAt(close) > PA_INCISURA) close += step;
  return Object.freeze({ pulmonaryOpen: open, rvPeak: peak, pulmonaryClose: close });
})();
const wrap = u => ((u % 1) + 1) % 1;

/** PA: follows RV while the pulmonary valve is open, runs off from the incisura to the diastolic level. */
function paAt(phase, rv) {
  const { pulmonaryOpen: po, rvPeak, pulmonaryClose: pc } = RIGHT_EVENTS;
  if (phase >= po && phase < pc) {
    // RV a little above PA early in ejection, PA a little above the falling RV late (hang-out).
    const early = phase < rvPeak ? -0.6 * Math.sin(Math.PI * (phase - po) / (rvPeak - po)) : 0;
    const late = phase >= rvPeak ? Math.min(0.8 * Math.sin(Math.PI * (phase - rvPeak) / (pc - rvPeak)), 0.8 * Math.max(0, NORMAL.rv.systolic - rv)) : 0;
    return rv + early + late;
  }
  const span = 1 - (pc - po);
  const s = wrap(phase - pc) / span;
  const notch = 1.2 * Math.exp(-(((s - 0.02) / 0.015) ** 2));
  return PA_INCISURA - (PA_INCISURA - NORMAL.pa.diastolic) * Math.pow(s, 0.85) - notch;
}

/** Snapshot of the right heart at a cycle state. */
export function rightHeartFrame(state = {}) {
  const raw = Number(state.phase);
  let phase = Number.isFinite(raw) ? raw - Math.floor(raw) : 0;
  for (const interval of CARDIAC_INTERVALS) if (Math.abs(phase - interval.start) < 1e-12) phase = interval.start;
  const bpmInput = Number(state.bpm);
  const bpm = Number.isFinite(bpmInput) && bpmInput > 0 ? Math.max(30, Math.min(200, bpmInput)) : 72;
  const interval = CARDIAC_INTERVALS.find(iv => phase >= iv.start && phase < iv.end) || CARDIAC_INTERVALS[0];
  const cycleMs = cycleSeconds(bpm).cycleSec * 1000;
  const rv = rvAt(phase), ra = raWave(bpm)(phase);
  return {
    phase, bpm,
    ra, rv, pa: paAt(phase, rv),
    // RV volume follows the LV curve in this teaching model (equal stroke volumes).
    volume: ventricularVolume(phase),
    // Tricuspid open while RA is at or above RV outside the pulmonary ejection window.
    tricuspidOpen: !(phase >= RIGHT_EVENTS.pulmonaryOpen && phase < RIGHT_EVENTS.pulmonaryClose) && rv <= ra + 0.25,
    pulmonaryOpen: phase >= RIGHT_EVENTS.pulmonaryOpen && phase < RIGHT_EVENTS.pulmonaryClose,
    intervalId: interval.id,
    interval,
    elapsedMs: phaseToTime(phase, bpm) * cycleMs,
    cycleMs
  };
}

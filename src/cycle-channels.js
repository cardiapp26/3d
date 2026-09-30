/**
 * Cycle channels: the weights every beat module reads from the shared
 * cardiac clock. Tension channels (atrial and ventricular contraction, valve
 * opening, chordal tension) drive the narrative and flow gating; the shape
 * channels drive chamber geometry (report section 12, phase C).
 */
import { CYCLE_SYNC as SYNC, CARDIAC_INTERVALS } from './cardiac-cycle.js';

/**
 * Computes normalized channel weights (0..1) for any phase in [0, 1).
 * Valve open/close times are the same marks as the ECG (P, QRS, T/S2).
 */
export function computeChannelWeights(phase, options = {}) {
  const p = ((phase % 1) + 1) % 1;
  // AV dissociation: the atria can run on their own clock (options.atrialPhase,
  // the same template phase, aligned so its P wave sits on the atrial event).
  // Without it atria and ventricles share one phase, as in sinus rhythm.
  const dissociated = Number.isFinite(options.atrialPhase);
  const pa = dissociated ? ((options.atrialPhase % 1) + 1) % 1 : p;

  // P wave / atrial systole. Contraction ends as the AV valves finish closing.
  let atrialContraction = 0;
  if (pa >= SYNC.atrialStart && pa < SYNC.atrialEnd) {
    const t = (pa - SYNC.atrialStart) / (SYNC.atrialEnd - SYNC.atrialStart);
    atrialContraction = Math.sin(Math.PI * t);
  }

  // QRS starts isovolumetric contraction. Pressure falls back to baseline at S2,
  // the start of isovolumetric relaxation, so the ventricle is relaxed while both valves are shut.
  let ventricularContraction = 0;
  if (p >= SYNC.ivcStart && p < SYNC.ivrStart) {
    if (p < SYNC.ejectionPeak) {
      const t = (p - SYNC.ivcStart) / (SYNC.ejectionPeak - SYNC.ivcStart);
      ventricularContraction = Math.sin((Math.PI / 2) * t);
    } else {
      const t = (p - SYNC.ejectionPeak) / (SYNC.ivrStart - SYNC.ejectionPeak);
      ventricularContraction = Math.cos((Math.PI / 2) * t);
    }
  }

  // AV valves stay shut through isovolumetric contraction, ejection, and isovolumetric relaxation.
  // They reopen only with the next rapid filling, after the cycle wraps.
  let avValveOpening = 0;
  if (p < SYNC.avCloseStart) {
    if (p < SYNC.fillingOpenEnd) {
      avValveOpening = Math.sin((Math.PI / 2) * (p / SYNC.fillingOpenEnd));
    } else {
      avValveOpening = 1;
    }
  } else if (p < SYNC.avClosed) {
    const t = (p - SYNC.avCloseStart) / (SYNC.avClosed - SYNC.avCloseStart);
    avValveOpening = Math.cos((Math.PI / 2) * t);
  }

  // Semilunar valves open after QRS, at ejection, and finish closing at S2 / isovolumetric relaxation.
  let semilunarValveOpening = 0;
  if (p >= SYNC.ejectionStart && p < SYNC.ivrStart) {
    if (p < SYNC.semilunarOpen) {
      const t = (p - SYNC.ejectionStart) / (SYNC.semilunarOpen - SYNC.ejectionStart);
      semilunarValveOpening = Math.sin((Math.PI / 2) * t);
    } else if (p < SYNC.semilunarCloseStart) {
      semilunarValveOpening = 1;
    } else {
      const t = (p - SYNC.semilunarCloseStart) / (SYNC.ivrStart - SYNC.semilunarCloseStart);
      semilunarValveOpening = Math.cos((Math.PI / 2) * t);
    }
  }

  let chordaeTension = 0;
  if (p >= SYNC.avClosed && p < SYNC.ivrStart) {
    chordaeTension = ventricularContraction;
  }

  return {
    phase: p,
    atrialContraction,
    ventricularContraction,
    avValveOpening,
    semilunarValveOpening,
    chordaeTension,
    ...shapeChannels(p, options.rhythm),
    // Separate atrial clock: the atrial size follows its own phase.
    ...(dissociated ? { atrialShape: shapeChannels(pa, options.rhythm).atrialShape, atrialPhase: pa } : {})
  };
}

/*
 * Phase C (report section 12). Geometry follows a schematic chamber size
 * proxy, separate from tension: `ventricularContraction` / `atrialContraction`
 * keep their meaning (tension, flow narrative); the shape channels below move
 * the walls. See research/BEAT_MOTION.md for the phase-motion table.
 */
const clamp01s = t => Math.max(0, Math.min(1, t));
const smooth01 = t => { const u = clamp01s(t); return u * u * (3 - 2 * u); };
const fastThenSlow = t => { const u = clamp01s(t); return 1 - (1 - u) * (1 - u); };
const lerp = (a, b, t) => a + (b - a) * t;
const RAPID_FILLING_END = CARDIAC_INTERVALS.find(i => i.id === 'rapid-filling')?.end ?? 0.18;
const CONDUIT_SHAPE = 0.35;   // atrial size fraction lost by passive emptying
const DIASTASIS_SHAPE = 0.18; // ventricular size still to fill before the atrial kick

/**
 * Chamber size channels, 0 = largest, 1 = smallest. Ventricles: fill in
 * rapid filling and diastasis, atrial kick to end-diastole, unchanged in the
 * isovolumetric intervals, shrink through ejection. Atria: conduit emptying,
 * booster contraction, reservoir filling during ventricular systole. In
 * atrial fibrillation there is no booster and no atrial kick.
 */
export function shapeChannels(phase, rhythm = 'sinus') {
  const p = ((phase % 1) + 1) % 1;
  const af = rhythm === 'afib';
  let v;
  if (p < RAPID_FILLING_END) v = lerp(1, 0.25, fastThenSlow(p / RAPID_FILLING_END));
  else if (p < SYNC.avClosed) {
    if (af) v = lerp(0.25, 0, (p - RAPID_FILLING_END) / (SYNC.avClosed - RAPID_FILLING_END));
    else if (p < SYNC.atrialStart) v = lerp(0.25, DIASTASIS_SHAPE, (p - RAPID_FILLING_END) / (SYNC.atrialStart - RAPID_FILLING_END));
    else v = lerp(DIASTASIS_SHAPE, 0, smooth01((p - SYNC.atrialStart) / (SYNC.avClosed - SYNC.atrialStart)));
  } else if (p < SYNC.ejectionStart) v = 0;
  else if (p < SYNC.ivrStart) v = fastThenSlow((p - SYNC.ejectionStart) / (SYNC.ivrStart - SYNC.ejectionStart));
  else v = 1;
  let a;
  if (p < RAPID_FILLING_END) a = lerp(0, CONDUIT_SHAPE, fastThenSlow(p / RAPID_FILLING_END));
  else if (p < SYNC.atrialStart) a = CONDUIT_SHAPE;
  else if (p < SYNC.avClosed) a = af ? CONDUIT_SHAPE : lerp(CONDUIT_SHAPE, 1, smooth01((p - SYNC.atrialStart) / (SYNC.avClosed - SYNC.atrialStart)));
  else a = lerp(af ? CONDUIT_SHAPE : 1, 0, smooth01((p - SYNC.avClosed) / (1 - SYNC.avClosed)));
  return { ventricularShape: v, atrialShape: a };
}

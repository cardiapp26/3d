/**
 * Cardia Cardiac-Cycle State Engine
 * Deterministic, normalized 0..1 cardiac timeline independent of DOM and Three.js.
 * Implements Phase 1 of GEMINI_DEVELOPMENT_PLAN.md.
 */

export const CARDIAC_INTERVALS = [
  {
    id: 'rapid-filling',
    name: 'Rapid ventricular filling',
    nameTr: 'Hızlı ventriküler doluş',
    start: 0.0,
    end: 0.18,
    avValves: 'open',
    semilunarValves: 'closed',
    ventricles: 'filling',
    atria: 'passive'
  },
  {
    id: 'diastasis',
    name: 'Diastasis (slow filling)',
    nameTr: 'Diyastaz (yavaş doluş)',
    start: 0.18,
    end: 0.32,
    avValves: 'open',
    semilunarValves: 'closed',
    ventricles: 'filling',
    atria: 'passive'
  },
  {
    id: 'atrial-systole',
    name: 'Atrial systole',
    nameTr: 'Atriyal sistol',
    start: 0.32,
    end: 0.45,
    avValves: 'open',
    semilunarValves: 'closed',
    ventricles: 'end-diastole',
    atria: 'contracting'
  },
  {
    id: 'isovolumetric-contraction',
    name: 'Isovolumetric ventricular contraction',
    nameTr: 'İzovolümetrik ventrikül kasılması',
    start: 0.45,
    end: 0.53,
    avValves: 'closed',
    semilunarValves: 'closed',
    ventricles: 'tensing',
    atria: 'relaxing'
  },
  {
    id: 'ventricular-ejection',
    name: 'Ventricular ejection',
    nameTr: 'Ventriküler ejeksiyon',
    start: 0.53,
    end: 0.88,
    avValves: 'closed',
    semilunarValves: 'open',
    ventricles: 'ejecting',
    atria: 'filling'
  },
  {
    id: 'isovolumetric-relaxation',
    name: 'Isovolumetric relaxation',
    nameTr: 'İzovolümetrik gevşeme',
    start: 0.88,
    end: 1.0,
    avValves: 'closed',
    semilunarValves: 'closed',
    ventricles: 'relaxing',
    atria: 'filling'
  }
];

// One clock for the ECG trace, valve motion, and interval names.
// Electrical events lead the mechanical ones: the P wave ends ~40 ms before
// atrial contraction starts, QRS onset precedes mitral closure (S1) by
// ~35 ms and aortic opening by ~100 ms (at 72 bpm one unit is 833 ms).
export const CYCLE_SYNC = Object.freeze({
  fillingOpenEnd: 0.08,
  pPeak: 0.27,
  atrialStart: 0.32,
  qrsOnset: 0.41,
  qrsPeak: 0.43,
  avCloseStart: 0.43,
  atrialEnd: 0.45,
  avClosed: 0.45,
  ivcStart: 0.45,
  qrsEnd: 0.49,
  ejectionStart: 0.53,
  semilunarOpen: 0.60,
  ejectionPeak: 0.65,
  semilunarCloseStart: 0.84,
  tPeak: 0.835,
  ivrStart: 0.88
});

export const RHYTHM_PRESETS = {
  sinus: { name: 'Normal Sinus Rhythm', bpm: 72, labelTr: 'Normal Sinüs Ritmi' },
  bradycardia: { name: 'Sinus Bradycardia', bpm: 48, labelTr: 'Sinüs Bradikardisi' },
  tachycardia: { name: 'Sinus Tachycardia', bpm: 130, labelTr: 'Sinüs Taşikardisi' },
  afib: { name: 'Atrial Fibrillation Concept', bpm: 110, labelTr: 'Atriyal Fibrilasyon Konsepti' }
};

// ---------------------------------------------------------------------------
// Heart-rate time warp. The engine phase is the physiologic (template) phase
// u, whose interval boundaries above are fixed. Real time within one RR
// interval (tau) maps onto u piecewise: systole shortens slowly with rate,
// the diastolic filling time absorbs the rest, and diastasis is consumed
// first. At ~72 bpm the warp is close to identity.
// ---------------------------------------------------------------------------
const BASE_RR = 60 / 72;
const BASE_SEC = {
  'rapid-filling': 0.18 * BASE_RR,
  'atrial-systole': 0.13 * BASE_RR,
  'isovolumetric-relaxation': 0.12 * BASE_RR
};
const TEMPLATE_SYSTOLE_U = 0.08 + 0.35; // isovolumetric contraction + ejection

/** Seconds spent in each template interval at a given rate. */
export function intervalDurations(bpm) {
  const rr = 60 / Math.max(30, Math.min(200, Number(bpm) || 72));
  const systole = Math.min(Math.max(0.0475 + 0.375 * rr, 0.12), rr * 0.7);
  const systoleScale = systole / (TEMPLATE_SYSTOLE_U * BASE_RR);
  const ivr = BASE_SEC['isovolumetric-relaxation'] * Math.min(1.25, systoleScale);
  const filling = Math.max(rr - systole - ivr, 0.02);
  let rapid = BASE_SEC['rapid-filling'];
  let atrial = BASE_SEC['atrial-systole'];
  let diastasis = filling - rapid - atrial;
  if (diastasis < 0) {
    const k = filling / (rapid + atrial);
    rapid *= k;
    atrial *= k;
    diastasis = 0;
  }
  const sec = {
    'rapid-filling': rapid,
    diastasis: Math.max(diastasis, 1e-5),
    'atrial-systole': atrial,
    'isovolumetric-contraction': systole * (0.08 / TEMPLATE_SYSTOLE_U),
    'ventricular-ejection': systole * (0.35 / TEMPLATE_SYSTOLE_U),
    'isovolumetric-relaxation': ivr
  };
  return CARDIAC_INTERVALS.map(iv => ({ id: iv.id, u0: iv.start, u1: iv.end, sec: sec[iv.id] }));
}

/** Systole / diastole seconds at a rate (systole = isovolumetric contraction + ejection). */
export function cycleSeconds(bpm) {
  const d = intervalDurations(bpm);
  const total = d.reduce((acc, iv) => acc + iv.sec, 0);
  const systole = d.filter(iv => iv.id === 'isovolumetric-contraction' || iv.id === 'ventricular-ejection')
    .reduce((acc, iv) => acc + iv.sec, 0);
  return { cycleSec: total, systoleSec: systole, diastoleSec: total - systole };
}

/** Template phase u -> real-time fraction tau of the RR interval. */
export function phaseToTime(u, bpm) {
  const d = intervalDurations(bpm);
  const total = d.reduce((acc, iv) => acc + iv.sec, 0);
  const uu = ((u % 1) + 1) % 1;
  let acc = 0;
  for (const iv of d) {
    if (uu <= iv.u1 || iv === d[d.length - 1]) {
      const f = (uu - iv.u0) / (iv.u1 - iv.u0);
      return (acc + Math.min(1, Math.max(0, f)) * iv.sec) / total;
    }
    acc += iv.sec;
  }
  return 1;
}

/** Real-time fraction tau -> template phase u. */
export function timeToPhase(tau, bpm) {
  const d = intervalDurations(bpm);
  const total = d.reduce((acc, iv) => acc + iv.sec, 0);
  const target = (((tau % 1) + 1) % 1) * total;
  let acc = 0;
  for (const iv of d) {
    if (target <= acc + iv.sec || iv === d[d.length - 1]) {
      const f = iv.sec > 0 ? (target - acc) / iv.sec : 0;
      return iv.u0 + Math.min(1, Math.max(0, f)) * (iv.u1 - iv.u0);
    }
    acc += iv.sec;
  }
  return 0;
}

export function getIntervalForPhase(phase) {
  const normPhase = ((phase % 1) + 1) % 1;
  for (let i = CARDIAC_INTERVALS.length - 1; i >= 0; i--) {
    if (normPhase >= CARDIAC_INTERVALS[i].start) {
      return CARDIAC_INTERVALS[i];
    }
  }
  return CARDIAC_INTERVALS[0];
}

export function createCardiacCycle(initialOptions = {}) {
  let bpm = Number(initialOptions.bpm) || 72;
  bpm = Math.max(30, Math.min(200, bpm));

  let phase = Number(initialOptions.phase) || 0.0;
  phase = ((phase % 1) + 1) % 1;

  let playing = Boolean(initialOptions.playing);
  let rhythm = initialOptions.rhythm in RHYTHM_PRESETS ? initialOptions.rhythm : 'sinus';
  let speed = typeof initialOptions.speed === 'number' ? Math.max(0.1, Math.min(5, initialOptions.speed)) : 1;
  let reducedMotion = Boolean(initialOptions.reducedMotion);

  const listeners = new Set();

  function getState() {
    return {
      bpm,
      phase,
      playing,
      rhythm,
      speed,
      reducedMotion,
      interval: getIntervalForPhase(phase),
      cycleDurationMs: 60000 / bpm
    };
  }

  function notify() {
    const currentState = getState();
    for (const listener of listeners) {
      try {
        listener(currentState);
      } catch (err) {
        console.error('CardiacCycle listener error:', err);
      }
    }
  }

  function setBpm(value) {
    const nextBpm = Math.max(30, Math.min(200, Math.round(Number(value) || 72)));
    if (nextBpm === bpm) return;
    bpm = nextBpm;
    notify();
  }

  function setPlaying(value) {
    const nextPlaying = Boolean(value);
    if (nextPlaying === playing) return;
    playing = nextPlaying;
    notify();
  }

  function setRhythm(name) {
    if (!(name in RHYTHM_PRESETS)) return;
    rhythm = name;
    if (RHYTHM_PRESETS[name].bpm) {
      bpm = RHYTHM_PRESETS[name].bpm;
    }
    notify();
  }

  function setSpeed(value) {
    const nextSpeed = Math.max(0.1, Math.min(5, Number(value) || 1));
    if (Math.abs(nextSpeed - speed) < 1e-4) return;
    speed = nextSpeed;
    notify();
  }

  function setReducedMotion(value) {
    const nextVal = Boolean(value);
    if (nextVal === reducedMotion) return;
    reducedMotion = nextVal;
    notify();
  }

  function seekCycle(targetPhase) {
    const num = Number(targetPhase);
    if (Number.isNaN(num)) return;
    phase = ((num % 1) + 1) % 1;
    notify();
  }

  function tick(dtMs) {
    if (!playing || reducedMotion || dtMs <= 0) return getState();
    const cycleDurationMs = (60000 / bpm) / speed;
    // Advance in real time, then map back onto the physiologic phase.
    const tau = phaseToTime(phase, bpm) + dtMs / cycleDurationMs;
    phase = timeToPhase(tau, bpm);
    notify();
    return getState();
  }

  function subscribeCycle(listener) {
    if (typeof listener === 'function') {
      listeners.add(listener);
      // Immediately emit current state upon subscription
      listener(getState());
    }
    return () => listeners.delete(listener);
  }

  return {
    getCycleState: getState,
    setBpm,
    setPlaying,
    setRhythm,
    setSpeed,
    setReducedMotion,
    seekCycle,
    tick,
    subscribeCycle
  };
}

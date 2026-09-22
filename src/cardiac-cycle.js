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
export const CYCLE_SYNC = Object.freeze({
  fillingOpenEnd: 0.08,
  atrialStart: 0.32,
  pPeak: 0.38,
  avCloseStart: 0.44,
  atrialEnd: 0.45,
  ivcStart: 0.45,
  qrsPeak: 0.47,
  avClosed: 0.48,
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
    phase = ((phase + (dtMs / cycleDurationMs)) % 1 + 1) % 1;
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

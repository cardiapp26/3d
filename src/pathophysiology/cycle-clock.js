// Shared cardiac cycle clock for the Pathophysiology stations: one phase
// (0..1, same timing as the P-V model in hemo-pv-model.js), play/pause,
// speed and scrubbing, plus the motion bar that drives it and a small tween
// helper for smooth parameter changes.
import { pvModelLoop, pvParams } from '../hemo-pv-model.js';

const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const wrap = x => ((x % 1) + 1) % 1;
const clamp01 = x => Math.min(1, Math.max(0, x));

/** Phase of the cycle at u for a P-V loop's phase windows (pvModelLoop().phases). */
export function cyclePhaseAt(u, phases) {
  if (u < phases.ivc[0]) return 'filling';
  if (u < phases.ivc[1]) return 'ivc';
  if (u < phases.ejection[1]) return 'ejection';
  return 'ivr';
}

export const PHASE_TEXT = Object.freeze({
  filling: { tr: 'Diyastolik doluş', en: 'Diastolic filling' },
  ivc: { tr: 'İzovolümik kasılma', en: 'Isovolumic contraction' },
  ejection: { tr: 'Ejeksiyon', en: 'Ejection' },
  ivr: { tr: 'İzovolümik gevşeme', en: 'Isovolumic relaxation' }
});

// Normal loop as the reference shape for stations without their own loop:
// pressure as a fraction of peak, contraction as the fraction of stroke volume ejected.
const REFERENCE = pvModelLoop(pvParams({}, 'normal'));

/** Normalised LV pressure (0..1) and contraction (0..1) at cycle phase u. */
export function cycleShape(u) {
  const pts = REFERENCE.points, n = pts.length;
  const x = wrap(u) * n, i = Math.floor(x) % n, f = x - Math.floor(x);
  const a = pts[i], b = pts[(i + 1) % n];
  const p = a.p + (b.p - a.p) * f, v = a.v + (b.v - a.v) * f;
  return {
    pressure: clamp01(p / REFERENCE.peak),
    contraction: clamp01((REFERENCE.edv - v) / REFERENCE.sv),
    phase: cyclePhaseAt(wrap(u), REFERENCE.phases)
  };
}

/** Point on a sampled loop at phase u (linear between samples). */
export function loopPointAt(points, u) {
  const n = points.length, x = wrap(u) * n, i = Math.floor(x) % n, f = x - Math.floor(x);
  const a = points[i], b = points[(i + 1) % n];
  return { v: a.v + (b.v - a.v) * f, p: a.p + (b.p - a.p) * f };
}

/**
 * Cycle clock. Listeners get { phase, playing, speed, bpm } every animation
 * frame while playing, and once after any change while paused.
 */
export function createCycleClock({ bpm = 75, speed = 0.5 } = {}) {
  let state = { phase: 0, playing: !REDUCED, speed, bpm };
  const listeners = new Set();
  let raf = null, last = null, destroyed = false;
  const emit = () => listeners.forEach(fn => fn(state));
  const frame = ts => {
    raf = null;
    if (destroyed) return;
    if (state.playing && last != null) {
      const dt = Math.min(0.1, (ts - last) / 1000);
      state = { ...state, phase: wrap(state.phase + (dt * state.speed * state.bpm) / 60) };
    }
    last = ts;
    emit();
    if (state.playing) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (raf == null && !destroyed) { last = null; raf = requestAnimationFrame(frame); } };
  const set = patch => { state = { ...state, ...patch }; kick(); };
  return {
    getState: () => state,
    subscribe(fn) { listeners.add(fn); fn(state); kick(); return () => listeners.delete(fn); },
    setPlaying: playing => set({ playing: Boolean(playing) }),
    toggle: () => set({ playing: !state.playing }),
    setSpeed: value => set({ speed: Number(value) > 0 ? Number(value) : state.speed }),
    seek: phase => set({ phase: wrap(Number(phase) || 0), playing: false }),
    /** Request one emit (e.g. after the station redrew its static layer). */
    refresh: kick,
    destroy() { destroyed = true; listeners.clear(); if (raf != null) cancelAnimationFrame(raf); }
  };
}

const BAR_TEXT = {
  play: { tr: '▷ Oynat', en: '▷ Play' },
  pause: { tr: 'Ⅱ Duraklat', en: 'Ⅱ Pause' },
  speed: { tr: 'Hız', en: 'Speed' },
  scrub: { tr: 'Döngüde gezin', en: 'Scrub the cycle' }
};

/** Play/pause, speed and a scrub slider bound to a clock; label is { tr, en }. */
export function createMotionBar(clock, { getLang, label }) {
  const el = document.createElement('div');
  el.className = 'preset-pill-group pathophys-motion-bar pathophys-cycle-bar';
  el.innerHTML = `
    <span class="preset-label" data-cycle-label></span>
    <button type="button" class="preset-pill" data-motion-toggle></button>
    <label class="motion-speed-label"><span data-cycle-speed-label></span>
      <select data-motion-speed>
        <option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option>
      </select>
    </label>
    <label class="pathophys-cycle-scrub"><span data-cycle-scrub-label></span>
      <input type="range" min="0" max="1" step="0.005" data-cycle-scrub>
    </label>
    <strong class="pathophys-cycle-phase" data-cycle-phase aria-live="off"></strong>`;
  const q = s => el.querySelector(s);
  const toggle = q('[data-motion-toggle]'), speedSel = q('[data-motion-speed]'), scrub = q('[data-cycle-scrub]');
  toggle.addEventListener('click', () => clock.toggle());
  speedSel.addEventListener('change', () => clock.setSpeed(speedSel.value));
  scrub.addEventListener('input', () => clock.seek(scrub.value));
  const t = o => o[getLang() === 'en' ? 'en' : 'tr'];
  let shownPlaying = null;
  function render(state = clock.getState(), phaseKey = null) {
    if (state.playing !== shownPlaying || phaseKey === 'lang') {
      shownPlaying = state.playing;
      toggle.textContent = t(state.playing ? BAR_TEXT.pause : BAR_TEXT.play);
      toggle.classList.toggle('active', state.playing);
      toggle.setAttribute('aria-pressed', String(state.playing));
    }
    if (document.activeElement !== scrub) scrub.value = String(state.phase);
    speedSel.value = String(state.speed);
    if (phaseKey && phaseKey !== 'lang') q('[data-cycle-phase]').textContent = t(PHASE_TEXT[phaseKey]);
  }
  function setLanguage() {
    q('[data-cycle-label]').textContent = t(label);
    q('[data-cycle-speed-label]').textContent = t(BAR_TEXT.speed);
    q('[data-cycle-scrub-label]').textContent = t(BAR_TEXT.scrub);
    scrub.setAttribute('aria-label', t(BAR_TEXT.scrub));
    render(clock.getState(), 'lang');
  }
  setLanguage();
  return { element: el, render, setLanguage };
}

/**
 * Tween numeric fields of `from` toward `to` over ms; calls onFrame(values)
 * each frame. Returns a cancel function. Reduced motion jumps at once.
 */
export function tweenValues(from, to, onFrame, ms = 420) {
  if (REDUCED || ms <= 0) { onFrame({ ...to }); return () => {}; }
  let raf = null, start = null, cancelled = false;
  const ease = x => 1 - Math.pow(1 - x, 3);
  const step = ts => {
    if (cancelled) return;
    start ??= ts;
    const k = ease(Math.min(1, (ts - start) / ms));
    const out = { ...to };
    for (const key of Object.keys(to)) {
      if (typeof to[key] === 'number' && typeof from[key] === 'number') out[key] = from[key] + (to[key] - from[key]) * k;
    }
    onFrame(out);
    if (k < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => { cancelled = true; if (raf != null) cancelAnimationFrame(raf); };
}

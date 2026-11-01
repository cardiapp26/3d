// Live Wiggers station: left and right heart pressures, LV volume and ECG on
// one cardiac cycle. The page has no 3D heart, so the station runs its own
// cycle clock (phase 0..1, heart rate, playback speed) for the panel.
import { createLiveWiggersPanel } from '../live-wiggers-panel.js';
import '../live-wiggers.css';

const DEFAULT_CLOCK = Object.freeze({ phase: 0, bpm: 72, speed: 0.5, playing: true, rhythm: 'sinus' });
const MIN_BPM = 30, MAX_BPM = 200;

/** Advance a cycle clock by dt seconds; returns a new clock. */
export function advanceClock(clock, dt) {
  if (!clock.playing || !(dt > 0)) return clock;
  const cycles = (dt * clock.speed * clock.bpm) / 60;
  return { ...clock, phase: (((clock.phase + cycles) % 1) + 1) % 1 };
}

export function createWiggersLab(opts = {}) {
  const mount = opts.mount || opts.container;
  let lang = opts.lang === 'en' ? 'en' : 'tr';
  let clock = { ...DEFAULT_CLOCK };
  let raf = null, last = null, disposed = false;
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-wiggers-lab';
  mount?.append(root);
  const update = patch => { clock = { ...clock, ...patch }; };
  const panel = createLiveWiggersPanel(root, {
    getLang: () => lang,
    getCycleState: () => clock,
    onSeek: phase => update({ phase: ((Number(phase) % 1) + 1) % 1 }),
    onPlaying: playing => update({ playing: Boolean(playing) }),
    onBpm: bpm => update({ bpm: Math.min(MAX_BPM, Math.max(MIN_BPM, Number(bpm) || DEFAULT_CLOCK.bpm)) }),
    onSpeed: speed => update({ speed: Number(speed) > 0 ? Number(speed) : DEFAULT_CLOCK.speed })
  });
  panel.setActive(true);
  const frame = ts => {
    raf = null;
    if (disposed) return;
    if (last != null) clock = advanceClock(clock, Math.min(0.1, (ts - last) / 1000));
    last = ts;
    panel.tick(clock);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return {
    updateLanguage(next) { lang = next === 'en' ? 'en' : 'tr'; panel.setLanguage(lang); },
    getState: () => ({ clock: { ...clock }, panel: panel.getState() }),
    destroy() { disposed = true; if (raf != null) cancelAnimationFrame(raf); root.remove(); }
  };
}

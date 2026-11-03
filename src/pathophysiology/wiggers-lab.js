// Live Wiggers station: left and right heart pressures, LV volume and ECG on
// one cardiac cycle, next to a 3D heart cut open along the inflow-outflow
// plane whose chambers are coloured by their live pressure. The station owns
// its own 3D heart; the heart's cardiac clock drives both the panel and the
// cutaway. Without WebGL the panel runs on a local clock.
import { createHeart } from '../heart.js';
import { createHeartWiggersView } from '../left-heart-wiggers-view.js';
import { createLiveWiggersPanel } from '../live-wiggers-panel.js';
import '../live-wiggers.css';

const DEFAULT_CLOCK = Object.freeze({ phase: 0, bpm: 72, speed: 0.5, playing: true, rhythm: 'sinus' });
const MIN_BPM = 30, MAX_BPM = 200;
const SIDES = ['left', 'right', 'both'];
const clampBpm = bpm => Math.min(MAX_BPM, Math.max(MIN_BPM, Number(bpm) || DEFAULT_CLOCK.bpm));

/** Advance a cycle clock by dt seconds; returns a new clock. */
export function advanceClock(clock, dt) {
  if (!clock.playing || !(dt > 0)) return clock;
  const cycles = (dt * clock.speed * clock.bpm) / 60;
  return { ...clock, phase: (((clock.phase + cycles) % 1) + 1) % 1 };
}

/** Local clock used when the 3D heart is unavailable. */
function createLocalClock() {
  let clock = { ...DEFAULT_CLOCK };
  const update = patch => { clock = { ...clock, ...patch }; };
  return {
    get: () => clock,
    step: dt => { clock = advanceClock(clock, dt); },
    seek: phase => update({ phase: ((Number(phase) % 1) + 1) % 1 }),
    setPlaying: playing => update({ playing: Boolean(playing) }),
    setBpm: bpm => update({ bpm: clampBpm(bpm) }),
    setSpeed: speed => update({ speed: Number(speed) > 0 ? Number(speed) : DEFAULT_CLOCK.speed })
  };
}

/** Clock backed by the 3D heart's cardiac cycle. */
function createHeartClock(heart) {
  heart.setBpm(DEFAULT_CLOCK.bpm);
  heart.setCycleSpeed(DEFAULT_CLOCK.speed);
  heart.setBeating(true);
  return {
    get: () => heart.getCycleState(),
    step: () => {},
    seek: phase => heart.seekCycle(((Number(phase) % 1) + 1) % 1),
    setPlaying: playing => heart.setBeating(Boolean(playing)),
    setBpm: bpm => heart.setBpm(clampBpm(bpm)),
    setSpeed: speed => heart.setCycleSpeed(Number(speed) > 0 ? Number(speed) : DEFAULT_CLOCK.speed)
  };
}

function tryCreateHeart(viewport) {
  try {
    return createHeart(viewport, () => {}, () => {}, () => {}, { pixelRatioCap: 1.5 });
  } catch (error) {
    viewport.innerHTML = '<div class="pathophys-wiggers-3d__error">3D WebGL unavailable.</div>';
    console.error('Live Wiggers 3D heart:', error);
    return null;
  }
}

export function createWiggersLab(opts = {}) {
  const mount = opts.mount || opts.container;
  let lang = opts.lang === 'en' ? 'en' : 'tr';
  let raf = null, last = null, disposed = false, side = 'left';
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-wiggers-lab';
  const viewport = document.createElement('div');
  viewport.className = 'pathophys-wiggers-3d';
  viewport.setAttribute('data-wiggers-3d', '');
  const panelHost = document.createElement('div');
  panelHost.className = 'pathophys-wiggers-panel';
  root.append(viewport, panelHost);
  mount?.append(root);

  const heart = tryCreateHeart(viewport);
  const clock = heart ? createHeartClock(heart) : createLocalClock();
  const cutaway = heart ? createHeartWiggersView({ heart, getLang: () => lang }) : null;
  const enterCutaway = () => cutaway?.enter(side).catch(error => console.error('Live Wiggers cutaway:', error));

  const panel = createLiveWiggersPanel(panelHost, {
    getLang: () => lang,
    getCycleState: () => clock.get(),
    onSeek: phase => clock.seek(phase),
    onPlaying: playing => clock.setPlaying(playing),
    onBpm: bpm => clock.setBpm(bpm),
    onSpeed: speed => clock.setSpeed(speed),
    onSide(next) {
      side = SIDES.includes(next) ? next : 'left';
      cutaway?.setSide(side).catch(error => console.error('Live Wiggers side:', error));
    }
  });
  panel.setActive(true);
  enterCutaway();

  const frame = ts => {
    raf = null;
    if (disposed) return;
    if (last != null) clock.step(Math.min(0.1, (ts - last) / 1000));
    last = ts;
    const state = clock.get();
    panel.tick(state);
    cutaway?.tick(state);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    updateLanguage(next) {
      lang = next === 'en' ? 'en' : 'tr';
      panel.setLanguage(lang);
      cutaway?.setLanguage(lang);
    },
    getState: () => ({ clock: { ...clock.get() }, panel: panel.getState(), cutaway: cutaway?.getState() ?? null, has3d: Boolean(heart) }),
    destroy() {
      disposed = true;
      if (raf != null) cancelAnimationFrame(raf);
      cutaway?.destroy();
      heart?.dispose?.();
      root.remove();
    }
  };
}

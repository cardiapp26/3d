// 3D viewport controls of the echo studio, the same as on the 3D page
// (.myo-control and .viewport-hud-controls in style.css): the myocardium
// toggle with its opacity slider (M), and fullscreen, zoom in / out and view
// reset. The reset returns the camera only; the beat and the probe stay.

const MIN_OPACITY = 15;
const RESTORE_OPACITY = 30;
const HOLD_DELAY = 280;
const HOLD_REPEAT = 60;
const ICON = {
  expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
  compress: '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>'
};
const svg = (paths, cls = '') => `<svg ${cls ? `class="${cls}" ` : ''}viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.3" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const WORDS = Object.freeze({
  tr: { myo: 'Miyokard', myoTitle: 'Dış miyokardı saydamlaştır (M)', opacity: 'Miyokard opaklığı', controls: 'Görünüm ve yakınlaştırma kontrolleri', full: 'Tam ekran', exitFull: 'Tam ekrandan çık', zoomIn: 'Yakınlaştır (+)', zoomOut: 'Uzaklaştır (−)', reset: 'Görünümü sıfırla' },
  en: { myo: 'Myocardium', myoTitle: 'Make the outer myocardium transparent (M)', opacity: 'Myocardium opacity', controls: 'View and zoom controls', full: 'Fullscreen', exitFull: 'Exit fullscreen', zoomIn: 'Zoom in (+)', zoomOut: 'Zoom out (−)', reset: 'Reset view' }
});

/** Press-and-hold repeats the action (zoom), like the 3D page. */
function holdAction(button, action) {
  let timer = 0;
  let repeat = 0;
  const stop = () => { clearTimeout(timer); clearInterval(repeat); };
  button.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    action();
    timer = setTimeout(() => { repeat = setInterval(action, HOLD_REPEAT); }, HOLD_DELAY);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => button.addEventListener(type, stop));
  button.addEventListener('click', e => { if (e.detail === 0) action(); });
}

/**
 * @param {{ container: HTMLElement|null, heart: object|null, getLang: () => string, defaultView?: string }} options
 * @returns {{ setLanguage: (lang: string) => void }}
 */
export function createEchoViewControls({ container, heart, getLang, defaultView = 'anterior' }) {
  if (!container || !heart) return { setLanguage() {} };

  container.insertAdjacentHTML('beforeend', `
    <div class="myo-control" data-echo-myo>
      <button type="button" class="myo-btn" data-echo-myo-toggle aria-pressed="false"><span>◐</span> <span data-echo-myo-label></span> <kbd>M</kbd></button>
      <input type="range" min="${MIN_OPACITY}" max="100" value="100" data-echo-myo-opacity>
      <output data-echo-myo-value>100%</output>
    </div>
    <div class="viewport-hud-controls" data-echo-hud-bar>
      <button type="button" class="hud-btn" data-echo-hud="fullscreen" aria-pressed="false">${svg(ICON.expand, 'icon-expand')}${svg(ICON.compress, 'icon-compress')}</button>
      <button type="button" class="hud-btn" data-echo-hud="zoom-in">${svg(ICON.plus)}</button>
      <button type="button" class="hud-btn" data-echo-hud="zoom-out">${svg(ICON.minus)}</button>
      <button type="button" class="hud-btn" data-echo-hud="reset">↺</button>
    </div>`);

  const $ = selector => container.querySelector(selector);
  const toggle = $('[data-echo-myo-toggle]');
  const slider = $('[data-echo-myo-opacity]');
  const readout = $('[data-echo-myo-value]');
  const fullscreen = $('[data-echo-hud="fullscreen"]');
  let restore = RESTORE_OPACITY;

  function setOpacity(percent) {
    const value = Math.round(Math.min(100, Math.max(MIN_OPACITY, Number(percent) || 100)));
    heart.setOpacity(value / 100);
    slider.value = String(value);
    readout.textContent = `${value}%`;
    toggle.classList.toggle('active', value < 100);
    toggle.setAttribute('aria-pressed', String(value < 100));
  }
  function toggleMyocardium() {
    const current = Number(slider.value);
    if (current < 100) { restore = current; setOpacity(100); } else setOpacity(restore);
  }
  slider.addEventListener('input', () => setOpacity(slider.value));
  toggle.addEventListener('click', toggleMyocardium);
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (e.key === 'm' || e.key === 'M') toggleMyocardium();
  });

  const isFullscreen = () => document.fullscreenElement === container || container.classList.contains('is-fullscreen-fallback');
  function syncFullscreen() {
    const active = isFullscreen();
    const w = WORDS[getLang() === 'en' ? 'en' : 'tr'];
    fullscreen.setAttribute('aria-pressed', String(active));
    fullscreen.title = active ? w.exitFull : w.full;
    fullscreen.setAttribute('aria-label', fullscreen.title);
    fullscreen.querySelector('.icon-expand').style.display = active ? 'none' : 'block';
    fullscreen.querySelector('.icon-compress').style.display = active ? 'block' : 'none';
    // The renderer follows its container size.
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
  }
  fullscreen.addEventListener('click', async () => {
    if (isFullscreen()) {
      if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* already left */ } }
      container.classList.remove('is-fullscreen-fallback');
    } else {
      try { await container.requestFullscreen(); } catch { container.classList.add('is-fullscreen-fallback'); }
    }
    syncFullscreen();
  });
  document.addEventListener('fullscreenchange', syncFullscreen);

  holdAction($('[data-echo-hud="zoom-in"]'), () => heart.zoomIn());
  holdAction($('[data-echo-hud="zoom-out"]'), () => heart.zoomOut());
  $('[data-echo-hud="reset"]').addEventListener('click', () => heart.setView(defaultView, true));

  function setLanguage(lang) {
    const w = WORDS[lang === 'en' ? 'en' : 'tr'];
    $('[data-echo-myo-label]').textContent = w.myo;
    toggle.title = w.myoTitle;
    slider.setAttribute('aria-label', w.opacity);
    $('[data-echo-hud-bar]').setAttribute('aria-label', w.controls);
    for (const [id, label] of [['zoom-in', w.zoomIn], ['zoom-out', w.zoomOut], ['reset', w.reset]]) {
      const button = $(`[data-echo-hud="${id}"]`);
      button.title = label;
      button.setAttribute('aria-label', label);
    }
    syncFullscreen();
  }
  setLanguage(getLang());
  return { setLanguage };
}

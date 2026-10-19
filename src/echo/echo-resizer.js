// Draggable divider between the 3D viewport and the echo console, styled like
// the 3D page's panel resizer (.panel-resizer in style.css). Drag or use the
// arrow keys to resize the console; double-click, Enter or Space resets it.
// The width lives in --echo-panel-w on the workspace and is remembered.

const STORAGE_KEY = 'cardia_echo_panel_w';
const MIN_WIDTH = 340;
const MIN_VIEWPORT = 360;
const KEY_STEP = 15;
const KEY_STEP_LARGE = 40;
const WORDS = Object.freeze({
  tr: { title: 'Konsolu genişletmek için sürükleyin · Sıfırlamak için çift tıklayın', aria: 'Eko konsolunu genişlet veya daralt' },
  en: { title: 'Drag to resize the console · Double-click to reset', aria: 'Resize the echo console' }
});

const readStored = () => {
  try {
    const value = parseInt(localStorage.getItem(STORAGE_KEY) || '', 10);
    return Number.isFinite(value) && value >= MIN_WIDTH ? value : null;
  } catch {
    return null;
  }
};
const store = (width) => {
  try {
    if (width === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, String(width));
  } catch {
    /* private storage: the width is a convenience only */
  }
};

/**
 * @param {{ workspace: HTMLElement|null, resizer: HTMLElement|null, panel: HTMLElement|null }} parts
 * @returns {{ setLanguage: (lang: string) => void }}
 */
export function initEchoResizer({ workspace, resizer, panel }) {
  if (!workspace || !resizer || !panel) return { setLanguage() {} };

  const maxWidth = () => Math.max(MIN_WIDTH, workspace.clientWidth - MIN_VIEWPORT - resizer.offsetWidth);
  const clamp = (width) => Math.round(Math.min(maxWidth(), Math.max(MIN_WIDTH, width)));
  const apply = (width) => {
    workspace.style.setProperty('--echo-panel-w', `${width}px`);
    resizer.setAttribute('aria-valuenow', String(width));
  };
  const reset = () => {
    workspace.style.removeProperty('--echo-panel-w');
    resizer.removeAttribute('aria-valuenow');
    store(null);
  };

  const stored = readStored();
  if (stored) apply(stored);
  resizer.setAttribute('aria-valuemin', String(MIN_WIDTH));

  let drag = null;
  let frame = 0;
  resizer.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, width: panel.getBoundingClientRect().width };
    resizer.classList.add('is-dragging');
    resizer.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  resizer.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const width = clamp(drag.width - (e.clientX - drag.x));
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => apply(width));
  });
  const end = (e) => {
    if (!drag) return;
    drag = null;
    cancelAnimationFrame(frame);
    resizer.classList.remove('is-dragging');
    try { resizer.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    store(clamp(panel.getBoundingClientRect().width));
  };
  resizer.addEventListener('pointerup', end);
  resizer.addEventListener('pointercancel', end);
  resizer.addEventListener('dblclick', reset);
  resizer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const step = e.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
      const width = clamp(panel.getBoundingClientRect().width + (e.key === 'ArrowLeft' ? step : -step));
      apply(width);
      store(width);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      reset();
    }
  });

  return {
    setLanguage(lang) {
      const words = WORDS[lang === 'en' ? 'en' : 'tr'];
      resizer.title = words.title;
      resizer.setAttribute('aria-label', words.aria);
    }
  };
}

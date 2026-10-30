// On/off view choices of the strips (wave names, ladder diagram, ladder on
// the channels), shared by
// the live monitor and the lesson strips and remembered in this browser.

const KEYS = Object.freeze({ waves: 'eps-wave-labels', ladder: 'eps-ladder', links: 'eps-strip-links', impulse: 'eps-impulse' });

/** Remembered choice; `fallback` when nothing is stored yet. */
export function readFlag(name, storage = globalThis.localStorage, fallback = false) {
  try {
    const value = storage?.getItem(KEYS[name]);
    return value == null ? fallback : value === '1';
  } catch { return fallback; }
}

export function writeFlag(name, on, storage = globalThis.localStorage) {
  try { storage?.setItem(KEYS[name], on ? '1' : '0'); } catch { /* private storage: the choice lasts this page only */ }
}

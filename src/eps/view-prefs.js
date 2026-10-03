// On/off view choices of the strips (wave names, ladder diagram, ladder on
// the channels), shared by
// the live monitor and the lesson strips and remembered in this browser.

const KEYS = Object.freeze({ waves: 'eps-wave-labels', ladder: 'eps-ladder', links: 'eps-strip-links' });

export function readFlag(name, storage = globalThis.localStorage) {
  try { return storage?.getItem(KEYS[name]) === '1'; } catch { return false; }
}

export function writeFlag(name, on, storage = globalThis.localStorage) {
  try { storage?.setItem(KEYS[name], on ? '1' : '0'); } catch { /* private storage: the choice lasts this page only */ }
}

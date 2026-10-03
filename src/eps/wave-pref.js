// Wave-name labels on the strips: one on/off choice shared by the live
// monitor and the lesson strips, remembered in this browser.

const KEY = 'eps-wave-labels';

export function readWaveLabels(storage = globalThis.localStorage) {
  try { return storage?.getItem(KEY) === '1'; } catch { return false; }
}

export function writeWaveLabels(on, storage = globalThis.localStorage) {
  try { storage?.setItem(KEY, on ? '1' : '0'); } catch { /* private storage: the choice lasts this page only */ }
}

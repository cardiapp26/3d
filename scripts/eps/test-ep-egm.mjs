// Synthetic EGM renderer: finite deterministic samples for every recording,
// DPR-aware drawing with watermark, calipers, markers and scale bar, and the
// view helpers (channels, zoom, inspection). The lesson panel part moves in
// with ep-panel.js (phase 2).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { egmSample, drawEgm, selectableChannels, timeWindow, timeAtX, eventsNear, sampleTimes, waveLabel } from '../../src/eps/ep-egm.js';
import { EP_RECORDING_IDS, epRecording } from '../../src/eps/ep-cases.js';
import { readFlag, writeFlag } from '../../src/eps/view-prefs.js';

const source = readFileSync(new URL('../../src/eps/ep-egm.js', import.meta.url), 'utf8');
assert.ok(!source.includes(String.fromCharCode(0x2014)), 'no em dash in the renderer source');
assert.ok(source.split('\n').length < 400, 'renderer stays under 400 lines');

// Finite, bounded, deterministic samples on a 2 ms grid for every recording.
for (const id of EP_RECORDING_IDS) {
  const r = epRecording(id);
  for (const ch of r.channels) {
    let peak = 0;
    for (let t = 0; t <= r.windowMs; t += 2) {
      const v = egmSample(r, ch, t);
      assert.ok(Number.isFinite(v), `${id} ${ch} finite at ${t}`);
      assert.ok(Math.abs(v) < 3, `${id} ${ch} bounded at ${t}`);
      peak = Math.max(peak, Math.abs(v));
    }
    assert.ok(peak > 0.08, `${id} ${ch} has deflections`);
    assert.equal(egmSample(r, ch, 333.5), egmSample(r, ch, 333.5), 'deterministic');
  }
}
assert.equal(egmSample(epRecording('sinus'), 'nope', 10), 0, 'unknown channel samples to 0');

// drawEgm on a fake canvas: every context property is a no-op function, setters are accepted.
globalThis.devicePixelRatio = 2;
const calls = { fillText: [] };
const ctxStub = new Proxy({}, {
  get(target, prop) {
    if (prop === 'measureText') return () => ({ width: 10 });
    if (prop === 'fillText') return (text) => { calls.fillText.push(String(text)); };
    if (prop in target) return target[prop];
    return () => {};
  },
  set(target, prop, value) { target[prop] = value; return true; }
});
const fakeCanvas = () => ({
  clientWidth: 600, clientHeight: 240, width: 0, height: 0, style: {}, getContext: () => ctxStub,
  setAttribute() {}, getAttribute() { return null; }
});
for (const id of EP_RECORDING_IDS) {
  for (const lang of ['tr', 'en']) {
    const canvas = fakeCanvas();
    assert.doesNotThrow(() => drawEgm(canvas, epRecording(id), { lang, title: 'x' }));
    assert.equal(canvas.width, 1200, 'DPR-aware width');
    assert.equal(canvas.height, 480, 'DPR-aware height');
  }
}
// The teaching-data notice is shown once at the foot of the site, not stamped on every strip.
assert.ok(!calls.fillText.some((t) => /SENTETİK|SYNTHETIC/.test(t)), 'no per-strip watermark');
assert.ok(calls.fillText.includes('100 ms'), 'scale bar label drawn');
assert.ok(calls.fillText.includes('AH 80') && calls.fillText.includes('HV 45'), 'AH/HV calipers measured from the events');
assert.ok(calls.fillText.includes('PPI 510'), 'PPI caliper drawn');
assert.ok(calls.fillText.some((t) => t.includes('His-refrakter PVC')) && calls.fillText.some((t) => t.includes('His-refractory PVC')), 'stimulus markers drawn in both languages');
assert.ok(calls.fillText.some((t) => t.includes('retrograd A yok')), 'VA block beat labelled');
assert.doesNotThrow(() => drawEgm({ ...fakeCanvas(), getContext: () => null }, epRecording('sinus')));
assert.doesNotThrow(() => drawEgm({ ...fakeCanvas(), clientWidth: 0, clientHeight: 0 }, epRecording('sinus')));
assert.doesNotThrow(() => drawEgm(null, epRecording('sinus')));
assert.doesNotThrow(() => drawEgm(fakeCanvas(), null));

// View helpers: selectable channels include event-bearing extras; the zoomed
// window keeps one uniform time scale; inspection maps x back to time.
const typ = epRecording('avnrt-typ-svt');
assert.ok(selectableChannels(typ).includes('cs-78') && !typ.channels.includes('cs-78'), 'extra channels with events are selectable');
assert.deepEqual(timeWindow(typ, 1, 0), { from: 0, to: typ.windowMs });
const w2 = timeWindow(typ, 2, 1);
assert.ok(Math.abs(w2.to - typ.windowMs) < 1e-9 && Math.abs(w2.to - w2.from - typ.windowMs / 2) < 1e-9, 'zoom 2x, panned to the end');
const drawn = drawEgm(fakeCanvas(), typ, { zoom: 2, pan: 0.5, channels: ['his-d', 'cs-910'] });
assert.ok(drawn && drawn.to - drawn.from === typ.windowMs / 2, 'drawEgm returns its time window');
assert.equal(Math.round(timeAtX(drawn.plotLeft + drawn.plotW / 2, drawn)), Math.round((drawn.from + drawn.to) / 2));
assert.equal(timeAtX(1, drawn), null, 'outside the plot');
const hA = typ.events['his-d'].find((e) => e.type === 'A');
assert.ok(eventsNear(typ, hA.t + 3, ['his-d']).some((e) => e.type === 'A'), 'inspection finds the nearby event');


// Sweeping monitor: a spike narrower than a pixel keeps its drawn height and
// the baseline stays put whatever the window position (no flicker).
{
  const spikeAt = 5000.37, span = 6000, plotW = 600;   // 10 ms per pixel, sigma 4 ms
  const peaks = [], base = [];
  for (let k = 0; k < 25; k++) {
    const from = 1000 + k * 3.7;                      // the window moves by a fraction of a pixel per frame
    const rec = { t0: from, events: { 'his-d': [{ type: 'H', t: spikeAt - from, amp: 0.7, sigma: 4 }] } };
    const times = sampleTimes(rec, 'his-d', 0, span, plotW);
    peaks.push(Math.max(...times.map((t) => egmSample(rec, 'his-d', t))));
    const quiet = { t0: from, events: { 'his-d': [] } };
    const at = 3000 - from;                           // the same absolute moment
    base.push(egmSample(quiet, 'his-d', at));
  }
  assert.ok(Math.max(...peaks) - Math.min(...peaks) < 1e-9, `spike height stable ${Math.min(...peaks)}..${Math.max(...peaks)}`);
  assert.ok(Math.abs(peaks[0] - 0.7) < 0.05, 'true peak drawn');
  assert.ok(Math.max(...base) - Math.min(...base) < 1e-9, 'baseline fixed to absolute time');
  const grid = sampleTimes({ t0: 1003.7, events: {} }, 'his-d', 0, span, plotW).slice(1, -1);
  assert.ok(grid.every((t) => Math.abs(((t + 1003.7) / 10) - Math.round((t + 1003.7) / 10)) < 1e-6), 'grid on absolute multiples of the sample step');
}

// Wave names: surface P / QRS, intracardiac A H V and the stimulus; far field in lower case; no names for f waves.
assert.equal(waveLabel({ type: 'V' }, true), 'QRS');
assert.equal(waveLabel({ type: 'P', mono: true }, true), 'P');
assert.equal(waveLabel({ type: 'H' }, false), 'H');
assert.equal(waveLabel({ type: 'V', far: true }, false), 'v', 'far-field V in lower case');
assert.equal(waveLabel({ type: 'S' }, false), 'S');
assert.equal(waveLabel({ type: 'f', mono: true }, false), null);
// Drawn only when asked; on a row the names follow the events.
calls.fillText.length = 0;
drawEgm(fakeCanvas(), epRecording('sinus'), { channels: ['ecg-ii', 'his-d'] });
assert.ok(!calls.fillText.includes('H'), 'no wave names by default');
calls.fillText.length = 0;
drawEgm(fakeCanvas(), epRecording('sinus'), { channels: ['ecg-ii', 'his-d'], waves: true });
for (const name of ['P', 'QRS', 'A', 'H']) assert.ok(calls.fillText.includes(name), `wave name ${name} drawn`);
const named = calls.fillText.filter((t) => t === 'H').length;
assert.equal(named, epRecording('sinus').events['his-d'].filter((e) => e.type === 'H').length, 'one H name per His deflection');
// The on/off choice is remembered; private storage falls back to off without throwing.
const mem = new Map();
const store = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
assert.equal(readFlag('waves', store), false);
writeFlag('waves', true, store);
assert.equal(readFlag('waves', store), true);
const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
assert.equal(readFlag('waves', broken), false);
assert.doesNotThrow(() => writeFlag('waves', true, broken));

console.log('PASS ep-egm: samples for all recordings, view helpers (channels, zoom, inspection), DPR drawing with watermark/calipers/markers, flicker-free sweep sampling, wave names on demand');

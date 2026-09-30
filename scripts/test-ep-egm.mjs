// Synthetic EGM renderer and the electrophysiological anatomy panel:
// finite deterministic samples for every recording, DPR-aware drawing with
// watermark, calipers, markers and scale bar, and the panel's section /
// case / clip / evidence flow against a minimal fake DOM.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { egmSample, drawEgm, selectableChannels, timeWindow, timeAtX, eventsNear } from '../src/ep-egm.js';
import { EP_RECORDING_IDS, epRecording } from '../src/ep-cases.js';
import { createEpPanel } from '../src/ep-panel.js';

const source = readFileSync(new URL('../src/ep-egm.js', import.meta.url), 'utf8');
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
assert.ok(calls.fillText.includes('SENTETİK · klinik kayıt değil'), 'tr watermark drawn');
assert.ok(calls.fillText.includes('SYNTHETIC · not a clinical recording'), 'en watermark drawn');
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

// createEpPanel against a minimal fake DOM.
function fakeElement(tagName) {
  const node = {
    tagName, children: [], attributes: {}, listeners: {}, dataset: {}, className: '', textContent: '', hidden: false,
    value: '', clientWidth: tagName === 'canvas' ? 600 : 0, clientHeight: tagName === 'canvas' ? 240 : 0, width: 0, height: 0,
    style: {}, getContext: () => ctxStub,
    appendChild(child) { node.children.push(child); return child; },
    append(...kids) { node.children.push(...kids); },
    replaceChildren(...kids) { node.children = kids; },
    setAttribute(k, v) { node.attributes[k] = String(v); if (k.startsWith('data-')) node.dataset[k.slice(5).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = String(v); },
    getAttribute(k) { return node.attributes[k] ?? null; },
    addEventListener(type, fn) { node.listeners[type] = fn; }
  };
  return node;
}
const fakeDoc = { createElement: fakeElement };
const mount = { ...fakeElement('div'), ownerDocument: fakeDoc };
mount.appendChild = (child) => { mount.children.push(child); return child; };
const picked = [];
const panel = createEpPanel(mount, { getLang: () => 'tr', onScenario: (id) => picked.push(id) });
assert.ok(panel && panel.element.className === 'egm-panel', 'panel root class');
const byClass = (name) => panel.element.children.find((c) => (c.className || '').split(' ').includes(name));
const eyebrow = byClass('eyebrow');
const tabs = byClass('ep-sections');
const row = byClass('egm-scenarios');
const text = byClass('egm-text');
const title = byClass('egm-title');
assert.equal(eyebrow.textContent, 'ELEKTROFİZYOLOJİK ANATOMİ · SENTETİK KAYIT');
assert.equal(tabs.children.length, 3, 'three sections');

// Lesson entry: the legacy scenario ids open the treatment clips.
panel.openLesson('sinus');
assert.deepEqual(panel.getState(), { section: 'treatment', caseId: 'avnrt-typical', clipId: 'sinus', evidence: false, large: false });
assert.deepEqual(row.children.map((b) => b.attributes['data-egm-scenario']), ['sinus', 'slow-target', 'junctional-rf', 'junctional-va-block'], 'legacy treatment clips in order');
assert.equal(row.children[0].attributes['aria-pressed'], 'true');
row.children[2].listeners.click();
assert.deepEqual(picked, ['junctional-rf'], 'onScenario called on click');
assert.ok(text.textContent.includes('tek başına'), 'junctional text warns');
assert.ok(byClass('ep-endpoint').textContent.includes('indüklenememesi'), 'endpoint shown in treatment');

// Diagnosis: numbered cases, neutral title, evidence toggle.
tabs.children[0].listeners.click();
assert.equal(panel.getState().section, 'diagnosis');
assert.equal(title.textContent, 'Taşikardi kaydı (mekanizma gizli)', 'mechanism hidden');
const caseSelect = byClass('ep-case').children[1];
assert.ok(caseSelect.children.every((o) => /^Olgu \d\d$/.test(o.textContent)), 'diagnosis cases are numbered, not named');
assert.ok(text.textContent.includes('Kanıtı göster'), 'neutral prompt');
const evidence = byClass('ep-evidence');
assert.equal(evidence.hidden, false);
evidence.listeners.click();
assert.equal(panel.getState().evidence, true);
assert.ok(title.textContent.includes('AVNRT'), 'evidence reveals the mechanism');
assert.ok(byClass('ep-compare').textContent.includes('CS ağzı karşılaştırması'), 'CS ostium comparison note');
evidence.listeners.click();
assert.equal(panel.getState().evidence, false, 'evidence toggles back');

// Maneuvers: card fields and validity state.
tabs.children[1].listeners.click();
panel.setScenario('avnrt-typ-vop-noncapture');
assert.equal(byClass('ep-result').dataset.result, 'invalidCapture');
assert.ok(byClass('ep-result').textContent.includes('yakalama yok'));
const card = byClass('ep-card');
assert.equal(card.children.length, 10, 'five dt/dd pairs on the maneuver card');
assert.ok(byClass('ep-measures').textContent.includes('TCL 360 ms'), 'measurements from the events');

// Language switch and unknown ids.
panel.setLanguage('en');
assert.equal(eyebrow.textContent, 'ELECTROPHYSIOLOGICAL ANATOMY · SYNTHETIC RECORDING');
assert.ok(byClass('ep-result').textContent.includes('no capture'));
panel.setScenario('bogus');
assert.equal(panel.getScenario(), 'avnrt-typ-vop-noncapture', 'unknown scenario ignored');
assert.doesNotThrow(() => panel.draw({ phase: 0.3 }));
assert.doesNotThrow(() => panel.draw(null));
panel.hide();
assert.equal(panel.element.hidden, true);
panel.show();
assert.equal(panel.element.hidden, false);

console.log('PASS ep-egm: samples for all recordings, view helpers (channels, zoom, inspection), DPR drawing with watermark/calipers/markers, panel sections, neutral diagnosis with evidence toggle, maneuver cards and validity, TR/EN');

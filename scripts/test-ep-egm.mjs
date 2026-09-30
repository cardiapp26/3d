import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  EGM_CHANNELS, EGM_SCENARIOS, egmScenario, egmSample, drawEgm, createEgmPanel
} from '../src/ep-egm.js';

const source = readFileSync(new URL('../src/ep-egm.js', import.meta.url), 'utf8');
assert.ok(!source.includes(String.fromCharCode(0x2014)), 'no em dash in the module source');
assert.ok(source.split('\n').length < 400, 'module stays under 400 lines');

assert.deepEqual(EGM_CHANNELS.map((c) => c.id), ['hra', 'his-p', 'his-d', 'cs-p', 'cs-d', 'abl-d']);
assert.deepEqual([...EGM_SCENARIOS], ['sinus', 'slow-target', 'junctional-rf', 'junctional-va-block']);
assert.equal(egmScenario('nope'), null, 'unknown scenario resolves to null');
assert.equal(egmSample('nope', 'hra', 10), 0, 'unknown scenario samples to 0');

// Every scenario resolves, is frozen and carries the synthetic disclaimer in both languages.
for (const id of EGM_SCENARIOS) {
  const s = egmScenario(id);
  assert.ok(s, `${id} resolves`);
  assert.equal(s.id, id);
  assert.ok(Object.isFrozen(s) && Object.isFrozen(s.beats), `${id} is frozen`);
  assert.ok(s.windowMs > 0 && s.beats.length >= 2 && s.beats.length <= 3, `${id} has 2-3 beats`);
  for (const lang of ['tr', 'en']) {
    assert.ok(s.title[lang]?.length > 3, `${id} title ${lang}`);
    assert.ok(s.text[lang]?.length > 40, `${id} text ${lang}`);
  }
  assert.ok(/sentetik/i.test(s.text.tr), `${id} tr text says Sentetik`);
  assert.ok(s.text.en.includes('ynthetic'), `${id} en text says synthetic`);
  assert.ok(/klinik kayıt değil/.test(s.text.tr) && /not a clinical recording/.test(s.text.en), `${id} not clinical`);
  assert.ok(/karar kuralı değil/.test(s.text.tr) && /not a decision rule/.test(s.text.en), `${id} not a decision rule`);
  for (const beat of s.beats) {
    for (const ch of EGM_CHANNELS) {
      for (const e of beat.events[ch.id]) {
        assert.ok(e.t >= 0 && e.t <= s.windowMs, `${id} ${ch.id} event inside window`);
      }
    }
  }
}

// Sinus teaching intervals and activation sequence.
const sinus = egmScenario('sinus');
assert.ok(sinus.intervals.ah >= 60 && sinus.intervals.ah <= 120, 'AH within 60–120 ms');
assert.ok(sinus.intervals.hv >= 35 && sinus.intervals.hv <= 55, 'HV within 35–55 ms');
for (const beat of sinus.beats) {
  const first = (ch, type) => beat.events[ch].find((e) => e.type === type).t;
  assert.ok(first('hra', 'A') < first('his-d', 'A'), 'HRA before His A');
  assert.ok(first('his-d', 'A') < first('cs-p', 'A'), 'His A before CS proximal');
  assert.ok(first('cs-p', 'A') < first('cs-d', 'A'), 'CS proximal before distal');
  assert.equal(first('his-d', 'H') - first('his-d', 'A'), sinus.intervals.ah, 'His d AH matches intervals');
  assert.equal(first('his-d', 'V') - first('his-d', 'H'), sinus.intervals.hv, 'His d HV matches intervals');
  assert.ok(!beat.events['abl-d'].some((e) => e.type === 'H'), 'no H on ABL d in sinus');
}

// Finite, bounded and deterministic samples on a 1 ms grid.
for (const id of EGM_SCENARIOS) {
  const s = egmScenario(id);
  for (const ch of EGM_CHANNELS) {
    let peak = 0;
    for (let t = 0; t <= s.windowMs; t++) {
      const v = egmSample(id, ch.id, t);
      assert.ok(Number.isFinite(v), `${id} ${ch.id} finite at ${t}`);
      assert.ok(Math.abs(v) < 3, `${id} ${ch.id} bounded at ${t}`);
      peak = Math.max(peak, Math.abs(v));
    }
    assert.ok(peak > 0.1, `${id} ${ch.id} has deflections`);
    assert.equal(egmSample(id, ch.id, 333.5), egmSample(id, ch.id, 333.5), 'deterministic');
  }
}

function peakAbs(id, ch, from, to) {
  let peak = 0;
  for (let t = from; t <= to; t += 0.5) peak = Math.max(peak, Math.abs(egmSample(id, ch, t)));
  return peak;
}

// Slow pathway target: small A, large V, no His potential on ABL d.
const slow = egmScenario('slow-target');
for (const beat of slow.beats) {
  const abl = beat.events['abl-d'];
  assert.ok(!abl.some((e) => e.type === 'H'), 'no H event on ABL d at the slow pathway');
  const as = abl.filter((e) => e.type === 'A');
  const v = abl.find((e) => e.type === 'V');
  const aPeak = peakAbs('slow-target', 'abl-d', as[0].t - 20, as[as.length - 1].t + 20);
  const vPeak = peakAbs('slow-target', 'abl-d', v.t - 20, v.t + 20);
  assert.ok(vPeak >= 2.5 * aPeak, `ABL d V (${vPeak.toFixed(2)}) at least 2.5x A (${aPeak.toFixed(2)})`);
}

// Junctional rhythm during RF: H, V, then retrograde A with 1:1 VA.
const jrf = egmScenario('junctional-rf');
for (const beat of jrf.beats) {
  const his = beat.events['his-d'];
  const h = his.find((e) => e.type === 'H');
  const v = his.find((e) => e.type === 'V');
  const a = his.find((e) => e.type === 'A');
  assert.ok(h && v && a, 'junctional beat has H, V and retrograde A on His');
  assert.ok(h.t < v.t && v.t < a.t, 'H precedes V precedes retrograde A');
  assert.ok(a.t - v.t >= 40 && a.t - v.t <= 120, `VA ${a.t - v.t} ms within 40–120`);
  const earliestA = (ch) => beat.events[ch].find((e) => e.type === 'A').t;
  assert.ok(Math.min(earliestA('his-p'), earliestA('cs-p')) < earliestA('hra'), 'retrograde A is concentric');
}
assert.ok(jrf.intervals.cl >= 700 && jrf.intervals.cl <= 800, 'junctional CL 700–800 ms');
assert.ok(jrf.text.tr.includes('tek başına'), 'tr: junctional alone is not success');
assert.ok(jrf.text.en.includes('alone'), 'en: junctional alone is not success');
assert.ok(jrf.text.en.includes('noninducib'), 'en names noninducibility');
assert.ok(jrf.text.tr.includes('indüklenememesi'), 'tr names noninducibility');

// Junctional rhythm with VA block: the warning scenario.
const jvb = egmScenario('junctional-va-block');
const blocked = jvb.beats.filter((b) => {
  const his = b.events['his-d'];
  return his.some((e) => e.type === 'V') && !his.some((e) => e.type === 'A');
});
assert.ok(blocked.length >= 1, 'at least one beat has V without retrograde A');
assert.ok(blocked.every((b) => b.vaBlock), 'blocked beats are flagged');
assert.ok(jvb.intervals.cl < 550, 'fast junctional cycle below 550 ms');
assert.ok(jvb.beats[1].events.hra.every((e) => e.type !== 'A'), 'no atrial activation on the VA block beat');
assert.ok(/durdurma uyarısı/.test(jvb.text.tr) && /stop energy delivery/.test(jvb.text.en), 'stop-energy warning');

// drawEgm on a fake canvas: every context property is a no-op function, setters are accepted.
globalThis.devicePixelRatio = 2;
const calls = { fillText: [], count: 0 };
const ctxStub = new Proxy({}, {
  get(target, prop) {
    if (prop === 'measureText') return () => ({ width: 10 });
    if (prop === 'fillText') return (text) => { calls.fillText.push(String(text)); };
    if (prop in target) return target[prop];
    return () => { calls.count++; };
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  }
});
const fakeCanvas = () => ({ clientWidth: 600, clientHeight: 240, width: 0, height: 0, style: {}, getContext: () => ctxStub });
for (const id of EGM_SCENARIOS) {
  for (const lang of ['tr', 'en']) {
    const canvas = fakeCanvas();
    assert.doesNotThrow(() => drawEgm(canvas, id, { lang, cursor: 0.4 }));
    assert.equal(canvas.width, 1200, 'DPR-aware width');
    assert.equal(canvas.height, 480, 'DPR-aware height');
  }
}
assert.ok(calls.fillText.includes('SENTETİK · klinik kayıt değil'), 'tr watermark drawn');
assert.ok(calls.fillText.includes('SYNTHETIC · not a clinical recording'), 'en watermark drawn');
assert.ok(calls.fillText.includes('100 ms'), 'scale bar label drawn');
assert.ok(calls.fillText.includes(`AH ${sinus.intervals.ah}`) && calls.fillText.includes(`HV ${sinus.intervals.hv}`), 'AH/HV calipers drawn');
assert.ok(calls.fillText.includes('VA blok') && calls.fillText.includes('VA block'), 'VA block beat labelled');
assert.doesNotThrow(() => drawEgm({ ...fakeCanvas(), getContext: () => null }, 'sinus'));
assert.doesNotThrow(() => drawEgm({ ...fakeCanvas(), clientWidth: 0, clientHeight: 0 }, 'sinus'));
assert.doesNotThrow(() => drawEgm(null, 'sinus'));
assert.doesNotThrow(() => drawEgm(fakeCanvas(), 'unknown', { cursor: Number.NaN }));

// createEgmPanel against a minimal fake DOM.
function fakeElement(tagName) {
  const node = {
    tagName, children: [], attributes: {}, listeners: {}, className: '', textContent: '', hidden: false,
    clientWidth: tagName === 'canvas' ? 600 : 0, clientHeight: tagName === 'canvas' ? 240 : 0, width: 0, height: 0,
    style: {}, getContext: () => ctxStub,
    appendChild(child) { node.children.push(child); return child; },
    append(...kids) { node.children.push(...kids); },
    setAttribute(k, v) { node.attributes[k] = String(v); },
    getAttribute(k) { return node.attributes[k] ?? null; },
    addEventListener(type, fn) { node.listeners[type] = fn; }
  };
  return node;
}
const fakeDoc = { createElement: fakeElement };
const mount = { ...fakeElement('div'), ownerDocument: fakeDoc };
mount.appendChild = (child) => { mount.children.push(child); return child; };
const picked = [];
const panel = createEgmPanel(mount, { getLang: () => 'tr', onScenario: (id) => picked.push(id) });
assert.ok(panel && panel.element.className === 'egm-panel', 'panel root class');
const [eyebrow, , row, canvas, text] = panel.element.children;
assert.equal(eyebrow.className, 'eyebrow');
assert.equal(eyebrow.textContent, 'SENTETİK ELEKTROGRAM');
assert.equal(canvas.className, 'egm-canvas');
assert.ok(canvas.attributes['aria-label'].includes('Sentetik'));
assert.equal(text.className, 'egm-text');
assert.equal(row.children.length, EGM_SCENARIOS.length);
assert.equal(row.children[0].attributes['aria-pressed'], 'true');
row.children[3].listeners.click();
assert.deepEqual(picked, ['junctional-va-block'], 'onScenario called on click');
assert.equal(panel.getScenario(), 'junctional-va-block');
assert.equal(row.children[3].attributes['aria-pressed'], 'true');
assert.equal(row.children[0].attributes['aria-pressed'], 'false');
panel.setLanguage('en');
assert.equal(eyebrow.textContent, 'SYNTHETIC ELECTROGRAM');
assert.equal(text.textContent, egmScenario('junctional-va-block').text.en);
panel.setScenario('bogus');
assert.equal(panel.getScenario(), 'junctional-va-block', 'unknown scenario ignored');
assert.doesNotThrow(() => panel.draw({ phase: 0.3 }));
assert.doesNotThrow(() => panel.draw(null));
panel.hide();
assert.equal(panel.element.hidden, true);
panel.show();
assert.equal(panel.element.hidden, false);

console.log('PASS ep-egm: 4 scenarios, 6 channels, intervals, synthetic disclaimers, drawEgm and panel');

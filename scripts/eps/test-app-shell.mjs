// App shell: language choice order, the view named in the hash, both
// languages carry every shell text, the site notice states teaching use, and
// the live panel builds its workstation layout (monitor + console) against a
// minimal fake DOM.
import assert from 'node:assert/strict';
import { APP_TEXT, LANGS, resolveLang, viewFromHash } from '../../src/eps/app-text.js';
import { createLivePanel } from '../../src/eps/ep-live-panel.js';

assert.equal(resolveLang('', null), 'tr', 'default Turkish');
assert.equal(resolveLang('', 'en'), 'en', 'stored choice');
assert.equal(resolveLang('?lang=en', 'tr'), 'en', 'query wins over storage');
assert.equal(resolveLang('?lang=de', 'xx'), 'tr', 'unknown values ignored');
const views = ['diagnosis', 'maneuver', 'treatment', 'live'];
assert.equal(viewFromHash('', views), 'live', 'live by default');
assert.equal(viewFromHash('#/maneuver', views), 'maneuver');
assert.equal(viewFromHash('#treatment', views), 'treatment');
assert.equal(viewFromHash('#/nope', views), 'live', 'unknown view falls back');

const keys = Object.keys(APP_TEXT.tr).sort();
for (const lang of LANGS) {
  assert.deepEqual(Object.keys(APP_TEXT[lang]).sort(), keys, `${lang}: same keys`);
  for (const key of keys) assert.ok(APP_TEXT[lang][key].length > 0, `${lang}.${key} filled`);
}
assert.match(APP_TEXT.tr.disclaimer, /eğitim amaçlıdır/);
assert.match(APP_TEXT.en.disclaimer, /teaching only/);

function fakeElement(tagName) {
  const node = {
    tagName, children: [], attributes: {}, listeners: {}, dataset: {}, className: '', textContent: '', hidden: false,
    value: '', disabled: false, clientWidth: tagName === 'canvas' ? 900 : 0, clientHeight: tagName === 'canvas' ? 500 : 0, width: 0, height: 0,
    style: {}, getContext: () => null,
    appendChild(child) { node.children.push(child); return child; },
    append(...kids) { node.children.push(...kids); },
    replaceChildren(...kids) { node.children = kids; },
    setAttribute(k, v) { node.attributes[k] = String(v); },
    getAttribute(k) { return node.attributes[k] ?? null; },
    addEventListener(type, fn) { node.listeners[type] = fn; }
  };
  return node;
}
const panel = createLivePanel({ createElement: fakeElement }, { getLang: () => 'tr' });
const classes = panel.element.children.map((c) => c.className);
assert.deepEqual(classes, ['ep-live-monitor', 'ep-live-console'], 'monitor and console columns');
const monitor = panel.element.children[0];
assert.ok(monitor.children.some((c) => c.tagName === 'canvas'), 'canvas in the monitor');
const deck = panel.element.children[1];
for (const cls of ['ep-live-stim', 'ep-live-maneuvers', 'ep-live-protocols', 'ep-live-ablation']) {
  assert.ok(deck.children.some((c) => c.className.split(' ').includes(cls)), `${cls} in the console`);
}
panel.advance(3000);
assert.equal(panel.intervals().rr, 800, 'sinus rhythm in the default case after stepping');

console.log('PASS app-shell: language order, TR/EN shell texts, teaching notice, monitor + console layout');

// App shell: language choice order, the view named in the hash, both
// languages carry every shell text, the site notice states teaching use, and
// the live panel builds its workstation layout (monitor + console) against a
// minimal fake DOM.
import assert from 'node:assert/strict';
import { APP_TEXT, LANGS, resolveLang, viewFromHash, clipFromHash } from '../../src/eps/app-text.js';
import { createLivePanel } from '../../src/eps/ep-live-panel.js';
import { registerOffline, WORKER_URL, WORKER_SCOPE } from '../../src/eps/offline.js';

assert.equal(resolveLang('', null), 'tr', 'default Turkish');
assert.equal(resolveLang('', 'en'), 'en', 'shared choice');
assert.equal(resolveLang('?lang=en', 'tr'), 'en', 'query wins over the shared choice');
assert.equal(resolveLang('?lang=de', 'xx'), 'tr', 'unknown values ignored');
const views = ['diagnosis', 'maneuver', 'treatment', 'live'];
assert.equal(viewFromHash('', views), 'live', 'live by default');
assert.equal(viewFromHash('#/maneuver', views), 'maneuver');
assert.equal(viewFromHash('#treatment', views), 'treatment');
assert.equal(viewFromHash('#/nope', views), 'live', 'unknown view falls back');
assert.equal(clipFromHash('#/clip/af-pvi-baseline'), 'af-pvi-baseline', 'recording link');
assert.equal(clipFromHash('#/clip/'), null);
assert.equal(clipFromHash('#/clip/a b'), null, 'ids only');
assert.equal(clipFromHash('#/live'), null);

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

// Incremental pacing runs as one train and is cut at the first block: sinus returns.
const nodesOf = (n, out = []) => { out.push(n); for (const c of n.children || []) nodesOf(c, out); return out; };
const byAttr = (name) => nodesOf(panel.element).find((n) => n.attributes[name] === '');
panel.setCase('avnrt-typical');
byAttr('data-ep-live-protocol').value = 'avbcl';
byAttr('data-ep-live-protocol').listeners.change();
byAttr('data-ep-live-protocol-run').listeners.click();
panel.advance(120000);
assert.equal(panel.protocol().running, false, 'protocol ended at the block');
assert.match(panel.protocol().summary, /AH sıçraması 370 ms'de.*PR, PP'yi 350 ms'de aştı/);
panel.advance(6000);
assert.equal(panel.intervals().rr, 800, 'pacing train cut at the block');

// Offline: the shared worker at the site root, scope the whole site; no support or a failure resolves to null.
const calls = [];
assert.equal(await registerOffline({ serviceWorker: { register: async (url, options) => { calls.push([url, options]); return 'reg'; } } }), 'reg');
assert.deepEqual(calls, [['../sw.js', { scope: '../', updateViaCache: 'none' }]]);
assert.equal(new URL(WORKER_URL, 'https://3d.drtr.uk/eps/').pathname, '/sw.js', 'worker at the site root');
assert.equal(new URL(WORKER_SCOPE, 'https://3d.drtr.uk/eps/').pathname, '/', 'scope covers both pages');
assert.equal(await registerOffline({}), null, 'no service worker support');
const warn = console.warn;
console.warn = () => {};
assert.equal(await registerOffline({ serviceWorker: { register: async () => { throw new Error('denied'); } } }), null, 'registration failure');
console.warn = warn;

console.log('PASS app-shell: language order, offline worker registration, TR/EN shell texts, teaching notice, monitor + console layout, incremental pacing train cut at the block');

// Last 3D route shared with the EPS, pharmacology and ECG pages: only mode
// routes are stored or turned into links; storage failures fall back to "../".
import assert from 'node:assert/strict';
import { rememberRoute, simulatorHref, linkToLastRoute } from '../src/entry-route.js';

const memory = () => {
  const data = new Map();
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), data };
};

const s = memory();
assert.equal(simulatorHref('../', s), '../', 'nothing stored');
rememberRoute('#/mode/ablation?structure=cti-line', s);
assert.equal(simulatorHref('../', s), '../#/mode/ablation?structure=cti-line');
rememberRoute('#/mode/tee', s);
assert.equal(simulatorHref('../', s), '../#/mode/tee', 'route without a structure');
for (const bad of ['javascript:alert(1)', '#/mode/x"onmouseover=1', 'https://example.com/#/mode/anatomy', '#/structure/lv', '', null]) {
  rememberRoute(bad, s);
  assert.equal(simulatorHref('../', s), '../#/mode/tee', `ignored: ${bad}`);
}
s.data.set('cardia_last_route', 'javascript:alert(1)');
assert.equal(simulatorHref('../', s), '../', 'a tampered value is not used');

const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
assert.doesNotThrow(() => rememberRoute('#/mode/anatomy', broken));
assert.equal(simulatorHref('../', broken), '../');

// Links: every href="../" and, on a re-render, the already rewritten ones.
const link = (href) => ({ dataset: {}, attrs: { href }, setAttribute(k, v) { this.attrs[k] = v; } });
const links = [link('../'), link('../')];
const doc = { querySelectorAll: () => links };
const r = memory();
rememberRoute('#/mode/defects?structure=asd-secundum', r);
linkToLastRoute(doc, r);
assert.deepEqual(links.map((l) => l.attrs.href), ['../#/mode/defects?structure=asd-secundum', '../#/mode/defects?structure=asd-secundum']);
assert.ok(links.every((l) => 'simulatorLink' in l.dataset));
assert.doesNotThrow(() => linkToLastRoute(null));

console.log('PASS entry route: mode routes only, tampered or failing storage falls back to ../, links rewritten');

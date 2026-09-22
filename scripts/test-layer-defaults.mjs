import assert from 'node:assert/strict';
import { applyLayerDefaults, LAYER_DEFAULTS, VEIN_VISIBILITY_IDS } from '../src/layer-defaults.js';

const visibility = applyLayerDefaults({
  phrenic: true,
  'pa-faint': true,
  svc: false,
  ivc: false,
  'mitral-posterior': false,
  'tricuspid-septal': false,
  'tricuspid-inferior': false,
  stray: false
});

assert.equal(visibility.phrenic, false);
assert.equal(visibility['pa-faint'], false);
assert.equal(visibility.svc, true);
assert.equal(visibility.ivc, true);
assert.equal(visibility['mitral-posterior'], true);
assert.equal(visibility['tricuspid-septal'], true);
assert.equal(visibility['tricuspid-inferior'], true);
assert.equal(visibility.flow, true);
assert.equal(visibility.chambers, true);
assert.equal('stray' in visibility, false);
assert.ok(VEIN_VISIBILITY_IDS.includes('svc') && VEIN_VISIBILITY_IDS.includes('ivc'));
assert.equal(Object.keys(visibility).length, Object.keys(LAYER_DEFAULTS).length);

console.log('PASS: layer reset restores default-off scenery and previously hidden vein or leaflet ids');

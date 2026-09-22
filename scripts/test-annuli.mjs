import assert from 'node:assert/strict';
import { createAnnuli } from '../src/annuli.js';

const registered = [];
const annuli = createAnnuli({
  getMeshes() {
    return [];
  },
  register(mesh, id) {
    registered.push({ mesh, id });
  }
});

annuli.build();

assert.deepEqual(
  registered.map(({ id }) => id),
  [],
  'Missing atlas rims must not produce guessed annulus geometry'
);
assert.equal(annuli.meshes.length, 0);
assert.ok(!registered.some(({ id }) => ['amc', 'mitral', 'tricuspid'].includes(id)));

console.log('PASS: annuli generator omits anatomy when registered atlas rims are unavailable');

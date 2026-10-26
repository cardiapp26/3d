// Echo studio summary (src/echo-image-summary.js): the "In this image" list and the orientation words.
import assert from 'node:assert/strict';
import { imageStructures, directionWords, planeOrientation, CM_PER_UNIT } from '../src/echo-image-summary.js';

const ring = (cx, cy, r, n = 24) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * 2 * Math.PI), cy + r * Math.sin((i / n) * 2 * Math.PI)]);
const section = {
  contours: [
    { id: 'ra', closed: true, points: ring(0, 1, 0.4) },          // centre, 0.6-1.4 units deep
    { id: 'rv', closed: true, points: ring(1.2, 2.5, 0.5) },      // screen right
    { id: 'la', closed: true, points: ring(-1.3, 3.0, 0.4) },     // screen left, deeper
    { id: 'pa', closed: true, points: ring(0, 9, 0.4) },          // beyond the depth
    { id: 'cs', closed: false, points: [[0, 0.5], [0.02, 0.52]] } // too short to list
  ]
};
const list = imageStructures(section, (90 * Math.PI) / 180, 4);
assert.deepEqual(list.map(r => r.id), ['ra', 'rv', 'la'], 'listed nearest first; out of depth and slivers left out');
const ra = list.find(r => r.id === 'ra');
assert.equal(ra.side, 'centre');
assert.ok(Math.abs(ra.near - 0.6 * CM_PER_UNIT) < 0.05 && Math.abs(ra.far - 1.4 * CM_PER_UNIT) < 0.05, `RA depth in cm (${ra.near}-${ra.far})`);
assert.equal(list.find(r => r.id === 'rv').side, 'right');
assert.equal(list.find(r => r.id === 'la').side, 'left');
assert.deepEqual(imageStructures({ contours: [] }, 1.3, 4), []);

// World axes: +x patient left, +y superior, +z anterior.
assert.deepEqual(directionWords([0, 0, 1]), ['anterior']);
assert.deepEqual(directionWords([0.3, -0.5, 0.8]), ['anterior', 'caudal']);
assert.deepEqual(directionWords([-1, 0, 0]), ['right']);
assert.deepEqual(planeOrientation({ lateral: [0, 1, 0], beam: [0.6, 0, 0.8] }), { right: ['cranial'], down: ['anterior', 'left'] });

console.log('PASS echo image summary: structures by depth and side in cm, orientation words');

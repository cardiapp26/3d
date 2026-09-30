// Echo section engine on synthetic phantoms (report TTE/TEE stage 1): an
// asymmetric scene catches mirrored screen axes, a split-vertex box checks
// welding (closed contour), an open tube and a single sheet give open contours.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sectionMeshes, imageFrame, summarize } from '../src/echo-section.js';

// Box with 24 split vertices (per-face, like a mesh with hard normals).
function box([cx, cy, cz], [sx, sy, sz]) {
  const faces = [
    [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]], [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]],
    [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]], [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]],
    [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]]
  ];
  const positions = [], index = [];
  faces.forEach((quad, f) => {
    quad.forEach(([x, y, z]) => positions.push(cx + x * sx / 2, cy + y * sy / 2, cz + z * sz / 2));
    index.push(4 * f, 4 * f + 1, 4 * f + 2, 4 * f, 4 * f + 2, 4 * f + 3);
  });
  return { positions: Float32Array.from(positions), index: Uint32Array.from(index) };
}

// Open cylinder along y (no caps).
function tube([cx, cy, cz], radius, height, segments = 32) {
  const positions = [], index = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions.push(cx + Math.cos(a) * radius, cy - height / 2, cz + Math.sin(a) * radius);
    positions.push(cx + Math.cos(a) * radius, cy + height / 2, cz + Math.sin(a) * radius);
  }
  for (let i = 0; i < segments; i++) {
    const j = (i + 1) % segments;
    index.push(2 * i, 2 * j, 2 * i + 1, 2 * j, 2 * j + 1, 2 * i + 1);
  }
  return { positions: Float32Array.from(positions), index: Uint32Array.from(index) };
}

// Probe at the origin looking along +z; plane y = 0; screen right = +x.
const frame = imageFrame([0, 0, 0], [0, 0, 1], [1, 0, 0]);
assert.ok(Math.abs(frame.normal[1] - 1) < 1e-12 && Math.abs(frame.normal[0]) + Math.abs(frame.normal[2]) < 1e-12, 'normal = beam x lateral');

const scene = [
  { id: 'box', ...box([1, 0, 3], [1, 1, 1]) },          // right of the beam, depth 2.5-3.5
  { id: 'tube', ...tube([-1.2, 0, 2], 0.3, 2) },         // left, cut across its axis: a circle
  { id: 'sheet', positions: Float32Array.from([-0.5, -1, 5, 0.5, -1, 5, 0, 1, 5]), index: null }, // one triangle
  { id: 'far', ...box([0, 3, 3], [1, 1, 1]) }            // above the plane: not cut
];
const cut = sectionMeshes(scene, frame);
const byId = id => cut.contours.filter(c => c.id === id);

// Box: one closed square, 4 units long, on the right (positive x), at the right depth.
assert.equal(byId('box').length, 1);
assert.equal(byId('box')[0].closed, true, 'split vertices are welded into a closed contour');
assert.ok(Math.abs(byId('box')[0].length - 4) < 1e-4);
const c = cut.structures.box.centroid;
assert.ok(Math.abs(c[0] - 1) < 0.1 && Math.abs(c[1] - 3) < 0.1, `box centroid ${c}`);
// Tube across its axis: a closed circle on the left.
assert.equal(byId('tube').length, 1);
assert.equal(byId('tube')[0].closed, true);
assert.ok(cut.structures.tube.centroid[0] < -1, 'tube on the left of the image');
assert.ok(Math.abs(byId('tube')[0].length - 2 * Math.PI * 0.3) < 0.02);
// A single sheet gives an open segment; a structure off the plane gives nothing.
assert.equal(byId('sheet').length, 1);
assert.equal(byId('sheet')[0].closed, false);
assert.equal(byId('far').length, 0);
assert.equal(cut.stats.closed, 2); assert.equal(cut.stats.open, 1);

// Mirror check: the same scene with the lateral axis reversed puts the box on the left.
const mirrored = sectionMeshes(scene, imageFrame([0, 0, 0], [0, 0, 1], [-1, 0, 0]));
assert.ok(mirrored.structures.box.centroid[0] < -0.9, 'reversed lateral axis mirrors the image');

// Tube cut along its axis (vertical plane x = -1.2 through its centre): two open lines.
const along = sectionMeshes([{ id: 'tube', ...tube([-1.2, 0, 2], 0.3, 2) }], imageFrame([-1.2, -2, 2], [0, 1, 0], [0, 0, 1]));
assert.equal(along.contours.length, 2);
assert.ok(along.contours.every(k => !k.closed && Math.abs(k.length - 2) < 1e-3), 'open tube cut lengthwise: two open lines');

// World matrix: translating the box by +2 in x moves its contour right.
const moved = sectionMeshes([{ id: 'box', ...box([1, 0, 3], [1, 1, 1]), matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 0, 0, 1] }], frame);
assert.ok(Math.abs(moved.structures.box.centroid[0] - 3) < 0.1);

// Deformation: moving the vertices (same geometry arrays) changes the section at once.
const live = { id: 'box', ...box([1, 0, 3], [1, 1, 1]) };
const before = sectionMeshes([live], frame).structures.box.centroid[1];
for (let i = 2; i < live.positions.length; i += 3) live.positions[i] += 0.5;
const after = sectionMeshes([live], frame).structures.box.centroid[1];
assert.ok(Math.abs(after - before - 0.5) < 1e-4, 'section follows the current vertex positions');

assert.deepEqual(summarize([]), {});
assert.ok(!readFileSync(new URL('../src/echo-section.js', import.meta.url), 'utf8').includes('\u2014'));
console.log('PASS echo-section: closed/open contours, welding, orientation (mirror), world matrix, live positions');

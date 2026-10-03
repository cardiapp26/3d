import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ahaSegment, anchoredAngles, segmentWall, lvRegions, LV_SEGMENTS } from '../src/ventricle-regions.js';
import { pulmonaryCusp, wholeMesh, TRICUSPID_LEAFLETS } from '../src/valve-parts.js';
import { partPieces } from '../src/echo-renderer-parts.js';
import { moderatorRadius, createModeratorBand } from '../src/moderator-band.js';
import { missingParts } from '../src/echo-training.js';

// AHA 16 segments: levels by thirds, six 60° basal/mid sectors, four 90° apical sectors.
assert.equal(ahaSegment(0.1, 30), 2, 'basal anteroseptal');
assert.equal(ahaSegment(0.1, -30), 3, 'basal inferoseptal');
assert.equal(ahaSegment(0.1, 90), 1, 'basal anterior');
assert.equal(ahaSegment(0.1, -90), 4, 'basal inferior');
assert.equal(ahaSegment(0.1, -150), 5, 'basal inferolateral');
assert.equal(ahaSegment(0.1, 150), 6, 'basal anterolateral');
assert.equal(ahaSegment(0.5, 30), 8, 'mid anteroseptal');
assert.equal(ahaSegment(0.5, 170), 12, 'mid anterolateral');
assert.equal(ahaSegment(0.8, 0), 14, 'apical septal');
assert.equal(ahaSegment(0.8, 90), 13, 'apical anterior');
assert.equal(ahaSegment(0.8, -90), 15, 'apical inferior');
assert.equal(ahaSegment(1, 180), 16, 'apical lateral (the cap joins the apical ring)');
assert.deepEqual(segmentWall(9), { level: 1, wall: 'inferoseptal' });
assert.equal(LV_SEGMENTS[17], undefined, '16-segment model');

// Anchors: the anterior anchor maps to +30, the inferior to -30, the ring stays continuous.
const map = anchoredAngles(66, 9, 30);
assert.ok(Math.abs(map(66) - 30) < 1e-9 && Math.abs(map(9) + 30) < 1e-9);
assert.ok(Math.abs(map(37.5)) < 1e-9, 'midway between the anchors is the septal centre');
assert.ok(map(70) > 30 && map(-20) < -30, 'beyond the anchors: free wall');
assert.ok(Math.abs(Math.abs(map(66 + 151.5)) - 180) < 1e-6, 'the opposite point is the lateral centre');

// A cylinder LV along -y: base at y = 0, apex at y = -3; the valves sit on the +x (septal) side.
const lv = new THREE.CylinderGeometry(1, 1, 3, 24, 12, true).translate(0, -1.5, 0);
lv.setAttribute('position', new THREE.Float32BufferAttribute([...lv.attributes.position.array, 0, -3.2, 0], 3));
const regions = lvRegions({
  lvGeometry: lv, mitralCenter: new THREE.Vector3(0, 0, 0),
  aorticCenter: new THREE.Vector3(Math.cos(Math.PI / 6) * 1.2, 0.2, Math.sin(Math.PI / 6) * 1.2),
  tricuspidCenter: new THREE.Vector3(Math.cos(-Math.PI / 6) * 1.5, -0.1, Math.sin(-Math.PI / 6) * 1.5)
});
const segAt = (x, y, z) => {
  const pos = lv.attributes.position;
  let best = 0, bd = Infinity;
  for (let i = 0; i < pos.count; i++) { const d = (pos.getX(i) - x) ** 2 + (pos.getY(i) - y) ** 2 + (pos.getZ(i) - z) ** 2; if (d < bd) { bd = d; best = i; } }
  return regions.names[regions.byVertex[best]];
};
assert.equal(segAt(1, -1.5, 0).abbr, '8', 'between the two valve directions, mid level: mid anteroseptal/inferoseptal border region');
assert.equal(segAt(-1, -1.5, 0).segment, 11, 'opposite the septum, mid level: lateral wall');
assert.equal(segAt(0.87, -0.05, 0.5).abbr, 'LVOT', 'next to the aortic annulus: outflow tract');
assert.equal(segAt(-1, -2.9, 0).segment, 16, 'apical lateral');
assert.ok(regions.names.every(n => n.color && n.tr && n.en && n.short), 'every region has a colour, names and a short label');

// Valve parts.
assert.equal(pulmonaryCusp('Left semilunar leaflet of pulmonary valve').abbr, 'LPC');
assert.equal(pulmonaryCusp('something else'), null);
const box = new THREE.Mesh(new THREE.BoxGeometry());
const whole = wholeMesh(box, TRICUSPID_LEAFLETS.septal);
assert.equal(whole.byVertex.length, box.geometry.attributes.position.count);
assert.ok(whole.byVertex.every(k => k === 0) && whole.names[0].abbr === 'STL');

// Contour pieces by part, and the view criteria on part lengths.
const A = { key: 'a', abbr: 'A2' }, P = { key: 'p', abbr: 'P2' };
const pieces = partPieces({ points: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], parts: [A, A, null, P, P], closed: false });
assert.deepEqual(pieces.map(p => [p.part.abbr, p.points.length]), [['A2', 3], ['P2', 2]], 'runs of one part; unlabelled stretches skipped');
const view = { parts: { lv: ['3', '9'], mitral: [['A2', 'A3'], 'P2'] } };
assert.deepEqual(missingParts(view, { 'lv:3': 1, 'lv:9': 1, 'mitral:A3': 1, 'mitral:P2': 1 }), [], 'any-of groups and required parts met');
assert.deepEqual(missingParts(view, { 'lv:3': 1, 'mitral:A2': 0.01 }).map(m => m.text), ['9', 'A2/A3', 'P2']);

// Moderator band: flared at both insertions, between the measured end points.
assert.ok(moderatorRadius(0) > moderatorRadius(0.5) && moderatorRadius(1) > moderatorRadius(0.5));
const mb = createModeratorBand({ septal: new THREE.Vector3(0, 0, 0), papillary: new THREE.Vector3(1, 0, 0), rvCenter: new THREE.Vector3(0.5, 1, 0) });
assert.ok(mb.path[0].distanceTo(new THREE.Vector3(0, 0, 0)) < 1e-6 && mb.path.at(-1).distanceTo(new THREE.Vector3(1, 0, 0)) < 1e-6, 'band runs between its insertions');
assert.ok(mb.path[8].y > 0, 'and sags toward the cavity centre');

console.log('PASS: moderator band; ventricle regions (AHA 16 segments, valve-plane anchors, LVOT), valve parts, part pieces and part criteria');

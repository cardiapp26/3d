// Fluoroscopic anatomy contours (src/fluoro-contours.js): a projected mesh is
// rasterised and its outer silhouette traced; the outline follows the
// camera; an annulus rim is projected as a ring; structures without meshes
// are skipped. Pure geometry with an orthographic camera.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { rasterise, traceOutline, computeContours, FLUORO_CONTOURS } from '../src/fluoro-contours.js';

const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 10);
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld();

// A 2 x 1 rectangle in front of the camera covers half the width and a quarter of the height.
const rect = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), new THREE.MeshBasicMaterial());
const mask = rasterise([rect], camera, 100, 100);
const filled = mask.reduce((a, v) => a + v, 0);
assert.ok(Math.abs(filled - 50 * 25) < 120, `filled ${filled} cells ~ 1250`);
const outline = traceOutline(mask, 100, 100);
const xs = outline.points.map((p) => p[0]), ys = outline.points.map((p) => p[1]);
assert.ok(Math.abs(Math.min(...xs) - 25) <= 1 && Math.abs(Math.max(...xs) - 74) <= 1, 'outline spans the rectangle width');
assert.ok(Math.abs(Math.min(...ys) - 37) <= 1 && Math.abs(Math.max(...ys) - 62) <= 1, 'outline spans the rectangle height');
// Largest region only: a small separate square is ignored.
const speck = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial());
speck.position.set(1.6, 1.6, 0); speck.updateMatrixWorld();
assert.equal(traceOutline(rasterise([rect, speck], camera, 100, 100), 100, 100).size, outline.size);
assert.equal(traceOutline(new Uint8Array(100), 10, 10), null, 'empty mask: no outline');

// computeContours: canvas pixels, the outline follows the camera, rings from the measured rim.
const ring = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial());
ring.userData.rim = Array.from({ length: 24 }, (_, k) => new THREE.Vector3(Math.cos((k / 24) * Math.PI * 2) * 0.5, Math.sin((k / 24) * Math.PI * 2) * 0.5, 0));
const meshes = { lv: [rect], 'mitral-annulus': [ring] };
const get = (id) => meshes[id] || [];
const c1 = computeContours(get, camera, 400, 400);
assert.deepEqual(c1.map((c) => c.id), ['lv', 'mitral-annulus'], 'only structures with meshes');
const lv = c1.find((c) => c.id === 'lv');
assert.ok(Math.abs(lv.centroid[0] - 200) < 6 && Math.abs(lv.centroid[1] - 200) < 6, 'centred rectangle');
const mitral = c1.find((c) => c.id === 'mitral-annulus');
assert.equal(mitral.points.length, 24);
assert.ok(mitral.points.every(([x, y]) => Math.abs(Math.hypot(x - 200, y - 200) - 50) < 1), 'ring radius 0.5 -> 50 px');
camera.position.set(1, 0, 5); camera.lookAt(1, 0, 0); camera.updateMatrixWorld();
const c2 = computeContours(get, camera, 400, 400);
assert.ok(c2.find((c) => c.id === 'lv').centroid[0] < lv.centroid[0] - 80, 'outline moves with the camera');
// Styles: LA and aorta dashed (not seen directly), ventricles hatched, annuli as rings.
const style = Object.fromEntries(FLUORO_CONTOURS.map((s) => [s.id, s]));
assert.ok(style.la.dashed && style.aorta.dashed && !style.ra.dashed && style.lv.hatch && style.rv.hatch && style['tricuspid-annulus'].ring);

assert.ok(!readFileSync(new URL('../src/fluoro-contours.js', import.meta.url), 'utf8').includes('\u2014'), 'no em dash');
console.log('PASS fluoro-contours: rasterised silhouette spans the mesh, largest region only, follows the camera, annulus rim as a ring, styles');

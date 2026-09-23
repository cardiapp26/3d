import assert from 'node:assert/strict';
import * as THREE from 'three';
import { measuredFlowRoutes } from '../src/flow-routes.js';
import { createBloodFlow } from '../src/blood-flow.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { annulusFrame, vesselPath } from '../src/mesh-utils.js';

// Synthetic tube wall: rings of radius r around a polyline axis.
function tube(axis, r = 0.2) {
  const verts = [];
  for (let i = 0; i < axis.length - 1; i++) {
    const a = axis[i];
    const b = axis[i + 1];
    const dir = b.clone().sub(a).normalize();
    const side = new THREE.Vector3(0, 0, 1).cross(dir);
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
    side.normalize();
    const up = dir.clone().cross(side);
    for (let s = 0; s < 10; s++) {
      const center = a.clone().lerp(b, s / 10);
      for (let k = 0; k < 16; k++) {
        const angle = (k / 16) * Math.PI * 2;
        verts.push(center.clone().addScaledVector(side, Math.cos(angle) * r).addScaledVector(up, Math.sin(angle) * r));
      }
    }
  }
  return verts;
}

const ascAxis = [new THREE.Vector3(0, 0.8, 0), new THREE.Vector3(0, 2.0, 0)];
const archAxis = [new THREE.Vector3(0, 2.0, 0), new THREE.Vector3(0, 2.5, -0.5), new THREE.Vector3(0, 2.0, -1.2)];
const walls = { ascending: tube(ascAxis), arch: tube(archAxis) };
const centers = {
  lcc: new THREE.Vector3(0.05, 0.75, 0),
  rcc: new THREE.Vector3(-0.05, 0.75, 0.05),
  ncc: new THREE.Vector3(0, 0.75, -0.05)
};
// Mitral annulus below the aortic valve; its ventricular side (-Y) is the LV.
const mitralRim = [];
for (let i = 0; i < 32; i++) {
  const a = (i / 32) * Math.PI * 2;
  mitralRim.push(new THREE.Vector3(0.6 + 0.3 * Math.cos(a), 0.2, 0.3 * Math.sin(a)));
}
const mitralAnnulus = new THREE.Mesh();
mitralAnnulus.userData = { rim: mitralRim, frame: annulusFrame(mitralRim, new THREE.Vector3(0.6, -1, 0)) };
const helpers = {
  getMeshes: id => (id === 'mitral-annulus' ? [mitralAnnulus] : []),
  sourceCenter: id => centers[id]?.clone() || null,
  meshVertices: (id, pattern) => {
    if (id !== 'aorta') return [];
    if (pattern.test('Ascending aorta')) return walls.ascending;
    if (pattern.test('Aortic arch')) return walls.arch;
    return [];
  }
};

const routes = measuredFlowRoutes(helpers);
assert.ok(routes['lv-aorta'], 'the aortic route is measured from the ascending aorta and arch');
assert.ok(!routes['rv-pa-left'] && !routes['rv-pa-right'], 'unmeasurable pulmonary routes are left out');

const axisDistance = point => {
  let best = Infinity;
  for (const axis of [ascAxis, archAxis]) {
    for (let i = 0; i < axis.length - 1; i++) {
      const line = new THREE.Line3(axis[i], axis[i + 1]);
      best = Math.min(best, line.closestPointToPoint(point, true, new THREE.Vector3()).distanceTo(point));
    }
  }
  return best;
};
const curve = new THREE.CatmullRomCurve3(routes['lv-aorta'], false, 'centripetal', 0.5);
const pastValve = curve.getSpacedPoints(80).filter(point => point.y > 0.9);
assert.ok(pastValve.length > 20);
assert.ok(pastValve.every(point => axisDistance(point) < 0.2), 'ejected blood stays inside the aortic lumen');

assert.deepEqual(measuredFlowRoutes({ sourceCenter: () => null, meshVertices: () => [] }), {},
  'without atlas vessels no route is guessed');

// vesselPath follows a curved tube (a U, where straight-line shells fail)
// and stays on the piece of a split vessel that the start lies on.
// Tubes are welded (no UV seam), like the atlas vessels.
const weld = geometry => {
  geometry.deleteAttribute('normal');
  geometry.deleteAttribute('uv');
  return mergeVertices(geometry);
};
{
  const u = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.6, 1.4, 0),
    new THREE.Vector3(1.2, 1, 0), new THREE.Vector3(1.2, 0, 0)
  ]);
  const mesh = new THREE.Mesh(weld(new THREE.TubeGeometry(u, 80, 0.04, 12, false)));
  const path = vesselPath(mesh, new THREE.Vector3(0, -0.1, 0));
  assert.ok(path.length > 20, 'the path runs the length of the vessel');
  const axis = u.getSpacedPoints(400);
  const offAxis = point => Math.min(...axis.map(a => a.distanceTo(point)));
  assert.ok(path.every(point => offAxis(point) < 0.03), 'every path point sits on the lumen axis');
  assert.ok(path[path.length - 1].distanceTo(new THREE.Vector3(1.2, 0, 0)) < 0.1, 'the path reaches the far end of the U');

  const pieceA = weld(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)), 20, 0.04, 12, false));
  const pieceB = weld(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 1, 0)), 20, 0.04, 12, false));
  const split = new THREE.Mesh(mergeTubes(pieceA, pieceB));
  const toward = vesselPath(split, new THREE.Vector3(-0.1, 0, 0), new THREE.Vector3(1, 0.9, 0));
  assert.ok(toward.length > 5 && toward.every(point => Math.abs(point.y) < 0.03),
    'a target on a disconnected piece ends the path at the nearest reachable point');
}

function mergeTubes(a, b) {
  const positions = [...a.attributes.position.array, ...b.attributes.position.array];
  const offset = a.attributes.position.count;
  const indices = [...a.index.array, ...Array.from(b.index.array, i => i + offset)];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
}

const flow = createBloodFlow({ routes });
assert.ok(flow.group.children.length === 2, 'flow particles build with measured routes');
flow.dispose();

// Lazily measured routes are applied the first time flow is shown.
let resolved = 0;
const lazy = createBloodFlow({ resolveRoutes: () => { resolved += 1; return routes; } });
assert.equal(resolved, 0, 'routes are not measured while flow is hidden');
lazy.setVisible(true);
lazy.setVisible(false);
lazy.setVisible(true);
assert.equal(resolved, 1, 'routes are measured once, when flow is first shown');
lazy.dispose();

console.log('PASS: flow routes follow measured chambers and vessel lumens');

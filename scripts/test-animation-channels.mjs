import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  avLeafletOffset,
  avLeafletWeight,
  computeChannelWeights,
  createAnimationChannels,
  leafletOffset
} from '../src/animation-channels.js';
import { annulusFrame } from '../src/mesh-utils.js';

console.log('Running Animation Channels Unit Tests...\n');

// 1. Test phase boundary calculations
{
  // Rapid filling (phase 0.10)
  const wFilling = computeChannelWeights(0.10);
  assert.ok(wFilling.avValveOpening > 0.8, 'AV valves should be wide open during rapid filling');
  assert.equal(wFilling.semilunarValveOpening, 0, 'Semilunar valves should be closed during filling');
  assert.equal(wFilling.ventricularContraction, 0, 'Ventricles should not be contracting in early filling');

  // Atrial systole (phase 0.38)
  const wAtrial = computeChannelWeights(0.38);
  assert.ok(wAtrial.atrialContraction > 0.8, 'Atria should be contracting during atrial systole');
  assert.ok(wAtrial.avValveOpening > 0.8, 'AV valves still open during atrial kick');
  assert.equal(wAtrial.semilunarValveOpening, 0, 'Semilunar valves closed in atrial systole');

  // Isovolumetric contraction (phase 0.49)
  const wIsoV = computeChannelWeights(0.49);
  assert.equal(wIsoV.avValveOpening, 0, 'AV valves closed in isovolumetric contraction');
  assert.equal(wIsoV.semilunarValveOpening, 0, 'Semilunar valves closed in isovolumetric contraction');
  assert.ok(wIsoV.ventricularContraction > 0, 'Ventricular tension rising in isovolumetric contraction');

  // Ventricular ejection (phase 0.65)
  const wEjection = computeChannelWeights(0.65);
  assert.ok(wEjection.ventricularContraction > 0.9, 'Ventricular contraction peak during ejection');
  assert.ok(wEjection.semilunarValveOpening > 0.9, 'Semilunar valves wide open during ejection');
  assert.equal(wEjection.avValveOpening, 0, 'AV valves firmly closed during ejection');

  // Isovolumetric relaxation (phase 0.90)
  const wRelax = computeChannelWeights(0.90);
  assert.equal(wRelax.semilunarValveOpening, 0, 'Semilunar valves snapped shut in relaxation');
  assert.equal(wRelax.avValveOpening, 0, 'AV valves still closed in early relaxation');
  assert.ok(wRelax.ventricularContraction < 0.02, 'Ventricular contraction has ended at S2');
  assert.equal(computeChannelWeights(0.97).avValveOpening, 0, 'AV valves stay shut through the rest of isovolumetric relaxation');

  console.log('PASS: All 5 physiological phases verified for channel weights');
}

// 2. Test bounds and cycle closure
{
  for (let p = 0; p <= 1.0; p += 0.01) {
    const w = computeChannelWeights(p);
    for (const [k, v] of Object.entries(w)) {
      if (k === 'phase') continue;
      assert.ok(v >= 0 && v <= 1.000001, `Weight ${k} at phase ${p} should be in [0, 1], got ${v}`);
      assert.ok(!Number.isNaN(v), `Weight ${k} should not be NaN`);
    }
  }

  // Check smooth closure between 0.999 and 0.001
  const wStart = computeChannelWeights(0.0);
  const wEnd = computeChannelWeights(0.999);
  assert.ok(Math.abs(wStart.ventricularContraction - wEnd.ventricularContraction) < 0.05, 'Ventricular cycle closure');
  assert.ok(Math.abs(wStart.semilunarValveOpening - wEnd.semilunarValveOpening) < 0.01, 'Semilunar cycle closure');

  console.log('PASS: Bounded values and smooth cycle closure verified');
}

// 3. Test Mock Mesh deformation and reset
{
  const meshMap = new Map();
  function makeMockMesh(id) {
    const m = new THREE.Mesh();
    m.userData = { id };
    if (!meshMap.has(id)) meshMap.set(id, []);
    meshMap.get(id).push(m);
    return m;
  }

  const lvMesh = makeMockMesh('lv');
  const laMesh = makeMockMesh('la');
  const lccMesh = makeMockMesh('lcc');
  const mitralMesh = makeMockMesh('mitral');

  const chamber = new THREE.BufferGeometry();
  chamber.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 1, 0,
    0, -1, 0,
    1, 0, 0
  ], 3));
  const chamberMesh = new THREE.Mesh(chamber);
  chamberMesh.userData = { id: 'lv' };
  meshMap.get('lv').push(chamberMesh);

  const channels = createAnimationChannels({ meshMap });

  channels.applyChannels({ phase: 0.65, reducedMotion: false });
  assert.equal(lvMesh.scale.x, 1.0, 'Meshes without positions stay unscaled');
  assert.equal(lccMesh.position.length(), 0, 'Aortic cusp hinge remains attached');
  const baseY = chamberMesh.geometry.attributes.position.getY(0);
  const apexY = chamberMesh.geometry.attributes.position.getY(1);
  const sideX = chamberMesh.geometry.attributes.position.getX(2);
  assert.ok(Math.abs(baseY - 1) < 1e-6, 'Valve-plane vertex stays fixed in systole');
  assert.ok(apexY > -1, 'Apex shortens toward the base during ejection');
  assert.ok(sideX < 1, 'Free wall moves inward during ejection');

  channels.applyChannels({ phase: 0.12, reducedMotion: false });
  assert.equal(mitralMesh.position.length(), 0, 'Partial mitral atlas mesh stays attached');
  assert.equal(chamberMesh.geometry.attributes.position.getY(1), -1, 'Ventricle is relaxed during filling');

  // Apply reduced motion -> should immediately reset
  channels.applyChannels({ phase: 0.65, reducedMotion: true });
  assert.equal(lvMesh.scale.x, 1.0, 'LV scale reset under reduced motion');
  assert.equal(lccMesh.position.length(), 0, 'LCC position reset under reduced motion');

  // Explicit reset
  channels.reset();
  assert.equal(laMesh.scale.x, 1.0, 'LA reset');
  assert.equal(mitralMesh.position.y, 0, 'Mitral reset');

  const center = { x: 0, y: 0, z: 0 };
  const closed = leafletOffset(0.2, 0, 0, 0, center, 2, 'semilunar');
  const opened = leafletOffset(0.2, 0, 0, 1, center, 2, 'semilunar');
  const hinge = leafletOffset(2, 0, 0, 1, center, 2, 'semilunar');
  assert.deepEqual(closed, [0.2, 0, 0]);
  assert.ok(opened[0] > 0.2, 'Semilunar free edge moves off the coaptation line when open');
  assert.equal(hinge[0], 2, 'Annular hinge stays fixed');
  const ivrPose = leafletOffset(0.2, 0, 0, computeChannelWeights(0.90).semilunarValveOpening, center, 2, 'semilunar');
  assert.deepEqual(ivrPose, [0.2, 0, 0], 'Semilunar leaflet is shut during isovolumetric relaxation');

  console.log('PASS: Mock mesh deformation and reset verified');
}

// 4. AV leaflets swing about their measured annulus, not about world Y
{
  assert.equal(avLeafletWeight(0, 0, 1, 2), 0, 'Annular hinge does not swing');
  assert.ok(avLeafletWeight(0.8, 0.3, 1, 2) > avLeafletWeight(0.3, 0.1, 1, 2), 'Swing grows away from the hinge');
  assert.equal(avLeafletWeight(1.5, 2, 1, 2), 0, 'Chordae stay tethered at the papillary tips');
  const outward = new THREE.Vector3(1, 0, 0);
  const normal = new THREE.Vector3(0, 0, 1);
  assert.deepEqual(avLeafletOffset(0.1, 0, 0.3, 0, 1, outward, normal, 1), [0.1, 0, 0.3], 'Closed pose is the rest pose');
  const open = avLeafletOffset(0.1, 0, 0.3, 1, 1, outward, normal, 1);
  assert.ok(open[0] > 0.1 && open[2] > 0.3, 'Open leaflet moves to its hinge side and into the ventricle');

  // Tilted annulus: ring in a plane whose normal is not world Y.
  const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 1.0);
  const rim = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    rim.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).applyQuaternion(tilt));
  }
  const ventricle = new THREE.Vector3(0, 1, 0).applyQuaternion(tilt);
  const frame = annulusFrame(rim, ventricle);
  // A leaflet hinged at +X whose free edge reaches the axis 0.3 below the ring.
  const local = [[1, 0, 0], [0.6, 0.15, 0], [0.05, 0.3, 0]];
  const positions = local.flatMap(([x, y, z]) => new THREE.Vector3(x, y, z).applyQuaternion(tilt).toArray());
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const leaflet = new THREE.Mesh(geometry);
  const annulus = new THREE.Mesh();
  annulus.userData = { id: 'mitral-annulus', rim, frame };
  const avMap = new Map([['mitral', [leaflet]], ['mitral-annulus', [annulus]]]);
  const avChannels = createAnimationChannels({ meshMap: avMap });
  const vertex = i => new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, i);
  avChannels.applyChannels({ phase: 0.2, reducedMotion: false });
  assert.ok(vertex(0).distanceTo(new THREE.Vector3(...positions.slice(0, 3))) < 1e-6, 'Hinge vertex stays on the tilted annulus');
  const edge = vertex(2).sub(frame.center);
  assert.ok(edge.dot(new THREE.Vector3(1, 0, 0)) > 0.25, 'Free edge swings toward its hinge side in the annulus plane');
  assert.ok(edge.dot(frame.normal) > 0.3, 'Free edge drops along the tilted annulus normal');
  avChannels.applyChannels({ phase: 0.7, reducedMotion: false });
  assert.ok(vertex(2).distanceTo(new THREE.Vector3(...positions.slice(6, 9))) < 1e-6, 'AV leaflet is shut in systole');

  console.log('PASS: AV leaflets open about their measured, tilted annulus');
}

console.log('\nALL ANIMATION CHANNEL TESTS PASSED!');

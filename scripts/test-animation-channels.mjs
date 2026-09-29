import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  avLeafletOffset,
  avLeafletWeight,
  bindFollower,
  chamberFieldOffset,
  CHAMBER_LAW,
  computeChannelWeights,
  createAnimationChannels,
  frameDisplacement,
  measureChamberFrame,
  SEAM_BAND,
  seamWeight,
  shapeChannels,
  FOLLOW_CONTACT,
  FOLLOW_FADE,
  followWeight,
  isSurfaceFollower,
  leafletOffset,
  writeFollower
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

  // Phase C: size follows the volume proxy, not tension. The ventricle is
  // smallest at aortic closure, keeps that size through isovolumetric
  // relaxation, refills in rapid filling and is fully relaxed at end-diastole.
  const apexAt = phase => { channels.applyChannels({ phase, reducedMotion: false }); return chamberMesh.geometry.attributes.position.getY(1); };
  const endSystole = apexAt(0.879), relaxation = apexAt(0.885), lateRelaxation = apexAt(0.99), filling = apexAt(0.12), endDiastole = apexAt(0.45);
  assert.equal(relaxation, lateRelaxation, 'Isovolumetric relaxation keeps one size throughout');
  assert.ok(Math.abs(endSystole - relaxation) < 1e-4, 'That size is the end-systolic one');
  assert.ok(filling < relaxation && filling > -1, 'Rapid filling is re-expanding the ventricle');
  assert.equal(endDiastole, -1, 'Ventricle is fully relaxed at end-diastole');
  assert.equal(apexAt(0.5), -1, 'Isovolumetric contraction keeps the end-diastolic size');
  channels.applyChannels({ phase: 0.12, reducedMotion: false });
  assert.equal(mitralMesh.position.length(), 0, 'Partial mitral atlas mesh stays attached');

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

// LAA marker follows the parent LA deformation, rather than its own tiny bounds.
{
  const la = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 2));
  const marker = new THREE.Mesh(new THREE.SphereGeometry(.2, 8, 6));
  marker.geometry.translate(.6, .8, .3);
  const channels = createAnimationChannels({ meshMap: new Map([['la', [la]], ['laa', [marker]]]) });
  const rest = marker.geometry.attributes.position.array.slice();
  channels.applyChannels({ phase: .38 });
  const weight = computeChannelWeights(.38).atrialShape;
  const { minY, maxY, cx, cz } = la.userData.motion;
  const next = marker.geometry.attributes.position.array;
  for (let i = 0; i < rest.length; i += 3) {
    const k = weight * ((rest[i + 1] - minY) / (maxY - minY)) ** 2;
    assert.ok(Math.abs(next[i] - (rest[i] - (rest[i] - cx) * .08 * k)) < 1e-6);
    assert.ok(Math.abs(next[i + 1] - (rest[i + 1] + (minY - rest[i + 1]) * .05 * k)) < 1e-6);
    assert.ok(Math.abs(next[i + 2] - (rest[i + 2] - (rest[i + 2] - cz) * .08 * k)) < 1e-6);
  }
  assert.notDeepEqual(next, rest);
  channels.reset();
  assert.deepEqual(next, rest, 'LAA rest pose is restored exactly');
  console.log('PASS: LAA marker follows LA motion and resets');
}

// Surface followers (report section 12, phase B).
{
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  assert.equal(followWeight(0), 1);
  assert.equal(followWeight(FOLLOW_CONTACT), 1);
  assert.equal(followWeight(FOLLOW_FADE), 0);
  const mid = followWeight((FOLLOW_CONTACT + FOLLOW_FADE) / 2);
  assert.ok(mid > 0.4 && mid < 0.6, 'smooth fade between contact and fade distance');
  assert.equal(isSurfaceFollower({ layer: 'coronaries', id: 'lad' }), true);
  assert.equal(isSurfaceFollower({ layer: 'valves', id: 'lv-papillary' }), true);
  assert.equal(isSurfaceFollower({ layer: 'valves', id: 'mitral' }), false, 'leaflets keep their own motion');
  assert.equal(isSurfaceFollower({ layer: 'chambers', id: 'lv' }), false, 'owners do not follow');
  assert.equal(isSurfaceFollower({ layer: 'thorax', id: 'vertebrae' }), false, 'surroundings stay still');

  // Two walls: A at x = 0, B at x = 1 (planes of vertices).
  const plane = x => { const a = []; for (let y = -1; y <= 1; y += 0.05) for (let z = -1; z <= 1; z += 0.05) a.push(x, y, z); return new Float32Array(a); };
  const ownerA = { rest: plane(0), matrix: I }, ownerB = { rest: plane(1), matrix: I };
  ownerA.current = new Float32Array(ownerA.rest); ownerB.current = new Float32Array(ownerB.rest);
  // Follower: one vertex on A, one in the fade zone, one far away.
  const rest = new Float32Array([0.02, 0, 0, 0.3, 0, 0, 0.5, 0.5, 0.5]);
  // (the third vertex is beyond FOLLOW_FADE of both walls)
  const follower = { rest, out: new Float32Array(rest), matrix: I, matrixInverse: [1, 0, 0, 0, 1, 0, 0, 0, 1] };
  const binding = bindFollower([ownerA, ownerB], follower);
  // Move wall A by +0.1 in y everywhere, wall B stays.
  for (let i = 1; i < ownerA.current.length; i += 3) ownerA.current[i] = ownerA.rest[i] + 0.1;
  writeFollower(follower, binding, [ownerA, ownerB]);
  assert.ok(Math.abs(follower.out[1] - 0.1) < 1e-6, 'vertex in contact moves exactly with its wall');
  assert.ok(follower.out[4] > 0 && follower.out[4] < 0.1, 'fade-zone vertex moves partly');
  assert.equal(follower.out[7], 0.5, 'vertex beyond the fade distance stays still');
  // A second wall close to A (x = 0.2) for the groove cases.
  const near = { rest: plane(0.2), matrix: I }; near.current = new Float32Array(near.rest);
  {
    // Midway between the two close walls: half of each.
    const midway = { rest: new Float32Array([0.1, 0, 0]), out: new Float32Array(3), matrix: I, matrixInverse: [1, 0, 0, 0, 1, 0, 0, 0, 1] };
    const bindMid = bindFollower([ownerA, near], midway);
    for (let i = 1; i < ownerA.current.length; i += 3) ownerA.current[i] = ownerA.rest[i] + 0.1;
    writeFollower(midway, bindMid, [ownerA, near]);
    assert.ok(Math.abs(midway.out[1] - 0.05) < 0.005, 'vertex midway between two walls takes half of each');
  }
  // Back to rest: the follower returns exactly (computed from rest, no drift).
  ownerA.current.set(ownerA.rest);
  writeFollower(follower, binding, [ownerA, ownerB]);
  assert.deepEqual([...follower.out], [...rest]);

  // A tube in the groove between the walls: without smoothing its two sides
  // follow different walls; smoothing over its edges moves it as one piece.
  const ring = []; const tri = [];
  for (let k = 0; k < 2; k++) for (let a = 0; a < 8; a++) ring.push(0.1 + 0.04 * Math.cos(a / 8 * 2 * Math.PI), k * 0.1, 0.04 * Math.sin(a / 8 * 2 * Math.PI));
  for (let a = 0; a < 8; a++) { const b = (a + 1) % 8; tri.push(a, b, 8 + a, b, 8 + b, 8 + a); }
  const tubeRest = new Float32Array(ring);
  const spread = smooth => {
    const tube = { rest: tubeRest, out: new Float32Array(tubeRest), matrix: I, matrixInverse: [1, 0, 0, 0, 1, 0, 0, 0, 1], index: new Uint16Array(tri), smooth };
    const bind = bindFollower([ownerA, near], tube);
    for (let i = 1; i < ownerA.current.length; i += 3) ownerA.current[i] = ownerA.rest[i] + 0.1;
    writeFollower(tube, bind, [ownerA, near]);
    ownerA.current.set(ownerA.rest);
    const ys = []; for (let v = 0; v < 8; v++) ys.push(tube.out[v * 3 + 1] - tubeRest[v * 3 + 1]);
    return Math.max(...ys) - Math.min(...ys);
  };
  // Six smoothing steps: enough to pull the cross-section together (about
  // 40% less spread here) without smearing owners far along the vessel.
  assert.ok(spread(true) < spread(false) * 0.67, 'smoothing pulls the tube cross-section together');

  // Cavity field: continuous, zero at the valve plane, clamped outside.
  const motion = { minY: -1, maxY: 1, cx: 0, cz: 0 };
  assert.ok(chamberFieldOffset(0.5, 1, 0.5, motion, 1, true).every(v => Math.abs(v) < 1e-12), 'valve plane stays put');
  const apex = chamberFieldOffset(0.5, -1, 0, motion, 1, true);
  assert.ok(apex[0] < 0 && apex[1] > 0, 'apex moves inward and toward the base');
  assert.deepEqual(chamberFieldOffset(0.5, -3, 0, motion, 1, true), apex, 'below the apex it is clamped, not overdriven');
  const a = chamberFieldOffset(0.3, 0, 0.2, motion, 1, true), b = chamberFieldOffset(0.3001, 0, 0.2, motion, 1, true);
  assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-4, 'field is continuous');
  console.log('PASS: surface followers bind, fade, blend two walls, smooth grooves, return to rest; cavity field continuous and clamped');
}

// Phase C: size channels, chamber frames, torsion, seams.
{
  const v = p => shapeChannels(p).ventricularShape, a = p => shapeChannels(p).atrialShape;
  assert.equal(v(0.46), 0); assert.equal(v(0.52), 0, 'isovolumetric contraction: end-diastolic size');
  assert.equal(v(0.89), 1); assert.equal(v(0.99), 1, 'isovolumetric relaxation: end-systolic size');
  for (let p = 0.53; p < 0.88; p += 0.01) assert.ok(v(p + 0.01) >= v(p), 'ejection only shrinks');
  for (let p = 0; p < 0.44; p += 0.01) assert.ok(v(p + 0.01) <= v(p) + 1e-12, 'filling only enlarges');
  assert.ok(v(0.09) - v(0.17) > v(0.20) - v(0.30), 'rapid filling is faster than diastasis');
  assert.ok(v(0.33) - v(0.44) > 0.1, 'atrial kick completes ventricular filling (sinus)');
  assert.ok(Math.abs(v(0) - v(0.9999)) < 1e-3 && Math.abs(a(0) - a(0.9999)) < 1e-3, 'cycle closes without a jump');
  assert.ok(a(0.44) > 0.95 && a(0.44) > a(0.3), 'atrial booster contraction at end of atrial systole');
  for (let p = 0.46; p < 0.99; p += 0.01) assert.ok(a(p + 0.01) <= a(p) + 1e-12, 'atria refill during ventricular systole');
  const af = p => shapeChannels(p, 'afib');
  assert.equal(af(0.40).atrialShape, af(0.30).atrialShape, 'AF: no atrial booster');
  assert.ok(Math.abs((af(0.33).ventricularShape - af(0.44).ventricularShape) - (af(0.20).ventricularShape - af(0.31).ventricularShape)) < 0.02, 'AF: no atrial kick, filling runs on evenly');
  for (let p = 0; p <= 1; p += 0.01) { const w = computeChannelWeights(p); assert.ok(w.ventricularShape >= 0 && w.ventricularShape <= 1 && w.atrialShape >= 0 && w.atrialShape <= 1); }

  // Measured frame: a tilted ventricle whose apex is not below its base.
  const base = [0, 0, 0];
  const tiltedAxis = [Math.SQRT1_2, -Math.SQRT1_2, 0];
  const rest = [];
  for (let t = 0; t <= 1.0001; t += 0.1) for (let k = 0; k < 8; k++) {
    const ang = k / 8 * 2 * Math.PI, r = 0.4 * (1 - 0.6 * t);
    rest.push(tiltedAxis[0] * 2 * t + r * Math.cos(ang) * Math.SQRT1_2, tiltedAxis[1] * 2 * t + r * Math.cos(ang) * Math.SQRT1_2, r * Math.sin(ang));
  }
  const frame = measureChamberFrame(new Float32Array(rest), base, true);
  assert.ok(Math.abs(frame.axis[0] - tiltedAxis[0]) < 0.05 && Math.abs(frame.axis[1] - tiltedAxis[1]) < 0.05, 'axis runs from the orifice to the apex, not along world Y');
  const law = CHAMBER_LAW.lv;
  const d0 = frameDisplacement(0.2, 0, 0.3, frame, 1, law);
  assert.ok(Math.hypot(...d0) < 1e-3, 'the valve plane stays put');
  const apex = [tiltedAxis[0] * 2, tiltedAxis[1] * 2, 0];
  const dA = frameDisplacement(...apex, frame, 1, law);
  const along = dA[0] * frame.axis[0] + dA[1] * frame.axis[1] + dA[2] * frame.axis[2];
  assert.ok(along < -0.1, 'the apex moves back along the long axis toward the base');
  // Torsion keeps the distance to the axis apart from the radial squeeze.
  const p = [apex[0], apex[1], 0.3];
  const noTwist = frameDisplacement(...p, frame, 1, { ...law, torsion: 0 });
  const twist = frameDisplacement(...p, frame, 1, law);
  const moved = (d) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
  const radiusOf = q => { const dx = q[0] - frame.base[0], dy = q[1] - frame.base[1], dz = q[2] - frame.base[2]; const pr = dx * frame.axis[0] + dy * frame.axis[1] + dz * frame.axis[2]; return Math.hypot(dx - pr * frame.axis[0], dy - pr * frame.axis[1], dz - pr * frame.axis[2]); };
  assert.ok(Math.abs(radiusOf(moved(twist)) - radiusOf(moved(noTwist))) < 1e-6, 'torsion rotates without changing the radius');
  assert.ok(Math.hypot(twist[0] - noTwist[0], twist[1] - noTwist[1], twist[2] - noTwist[2]) > 1e-3, 'LV torsion is present');
  const twistAngle = law.torsion * 180 / Math.PI;
  assert.ok(twistAngle > 3 && twistAngle < 10, 'low-amplitude apical torsion');
  assert.equal(CHAMBER_LAW.rv.torsion, 0, 'no RV torsion');
  // Seams: half of each wall's field at contact, none beyond the band.
  assert.equal(seamWeight(0), 0.5);
  assert.equal(seamWeight(SEAM_BAND), 0);
  assert.ok(seamWeight(SEAM_BAND / 2) > 0 && seamWeight(SEAM_BAND / 2) < 0.5);
  console.log('PASS: phase C size channels (isovolumetric, ejection, filling, kick, AF), measured tilted frames, torsion, seam weights');
}


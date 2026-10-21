import * as THREE from 'three';

/*
 * Transthoracic phased-array probe (schematic): a wide, flat, rounded head with
 * a dark acoustic lens at the face, a waisted grip, a strain relief and the
 * cable. Local frame: +y from the face toward the cable, +x along the array
 * (the imaging plane's lateral direction, index side positive), +z across the
 * footprint (elevation). The face is at y = 0. Teaching shape, not to scale.
 */
const LENGTH = 1.1;
// Half-width (along the array) and half-depth (elevation) along the body, t = 0 face, 1 top.
const PROFILE = [
  [0, 0.17, 0.095], [0.03, 0.195, 0.115], [0.08, 0.2, 0.12], [0.3, 0.2, 0.12],
  [0.42, 0.14, 0.1], [0.6, 0.135, 0.098], [0.82, 0.14, 0.1], [0.93, 0.1, 0.085], [1, 0.055, 0.055]
];
const SEGMENTS = 40;
const RINGS = 48;
const EXPONENT = 4;   // superellipse: rounded rectangle cross-section

function at(t) {
  for (let i = 1; i < PROFILE.length; i++) {
    const [t1, w1, d1] = PROFILE[i], [t0, w0, d0] = PROFILE[i - 1];
    if (t <= t1) { const k = (t - t0) / (t1 - t0), s = k * k * (3 - 2 * k); return [w0 + (w1 - w0) * s, d0 + (d1 - d0) * s]; }
  }
  const last = PROFILE[PROFILE.length - 1];
  return [last[1], last[2]];
}

/** Point on a superellipse of half-axes w, d at angle a. */
function superellipse(a, w, d) {
  const c = Math.cos(a), s = Math.sin(a), p = 2 / EXPONENT;
  return [w * Math.sign(c) * Math.abs(c) ** p, d * Math.sign(s) * Math.abs(s) ** p];
}

function bodyGeometry() {
  const position = [], index = [];
  for (let j = 0; j <= RINGS; j++) {
    const t = j / RINGS, [w, d] = at(t);
    for (let i = 0; i < SEGMENTS; i++) {
      const [x, z] = superellipse((i / SEGMENTS) * Math.PI * 2, w, d);
      position.push(x, t * LENGTH, z);
    }
  }
  for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEGMENTS; i++) {
    const a = j * SEGMENTS + i, b = j * SEGMENTS + (i + 1) % SEGMENTS, c = a + SEGMENTS, e = b + SEGMENTS;
    index.push(a, c, b, b, c, e);
  }
  // Top cap (the face is covered by the lens).
  const top = position.length / 3;
  position.push(0, LENGTH, 0);
  for (let i = 0; i < SEGMENTS; i++) index.push(RINGS * SEGMENTS + i, top, RINGS * SEGMENTS + (i + 1) % SEGMENTS);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

/** Slightly convex lens over the face, the footprint that touches the skin. */
function lensGeometry() {
  const [w, d] = at(0.02), rings = 8, position = [0, -0.018, 0], index = [];
  for (let r = 1; r <= rings; r++) {
    const k = r / rings;
    for (let i = 0; i < SEGMENTS; i++) {
      const [x, z] = superellipse((i / SEGMENTS) * Math.PI * 2, w * 0.98 * k, d * 0.95 * k);
      position.push(x, -0.018 * (1 - k * k) + 0.004, z);
    }
  }
  for (let i = 0; i < SEGMENTS; i++) index.push(0, 1 + (i + 1) % SEGMENTS, 1 + i);
  for (let r = 1; r < rings; r++) for (let i = 0; i < SEGMENTS; i++) {
    const a = 1 + (r - 1) * SEGMENTS + i, b = 1 + (r - 1) * SEGMENTS + (i + 1) % SEGMENTS;
    index.push(a, b, a + SEGMENTS, b, b + SEGMENTS, a + SEGMENTS);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

/** @returns {THREE.Group} probe in its local frame (see the header). */
export function createTteProbe() {
  const group = new THREE.Group();
  group.name = 'TTE probe (schematic)';
  const shell = new THREE.MeshStandardMaterial({ color: 0xe4e8e6, roughness: 0.42, metalness: 0.05 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b3130, roughness: 0.6 });
  const body = new THREE.Mesh(bodyGeometry(), shell);
  body.name = 'Probe housing';
  const lens = new THREE.Mesh(lensGeometry(), dark);
  lens.name = 'Probe acoustic lens';
  // Grip band between head and handle.
  const band = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 8, 40), new THREE.MeshStandardMaterial({ color: 0x8fa39b, roughness: 0.5 }));
  const [bw, bd] = at(0.36);
  band.scale.set(bw, bd, 1); band.rotation.x = Math.PI / 2; band.position.y = 0.36 * LENGTH;
  // Index notch on the array's positive (lateral) side, near the face.
  const notch = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.09, 0.05), new THREE.MeshBasicMaterial({ color: 0x39e8ad }));
  notch.name = 'Probe index notch';
  notch.position.set(at(0.12)[0] + 0.01, 0.12 * LENGTH, 0);
  const relief = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.2, 16), dark);
  relief.position.y = LENGTH + 0.09;
  const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, LENGTH + 0.18, 0), new THREE.Vector3(0, LENGTH + 0.55, 0.05),
    new THREE.Vector3(0.12, LENGTH + 0.9, 0.25), new THREE.Vector3(0.3, LENGTH + 1.1, 0.6)
  ]), 30, 0.025, 8, false), dark);
  cable.name = 'Probe cable';
  group.add(body, lens, band, notch, relief, cable);
  return group;
}

/** Place the probe: face at origin, cable away from the beam, array along the lateral axis. */
export function placeTteProbe(probe, origin, beam, lateral) {
  const up = beam.clone().negate().normalize();
  const x = lateral.clone().addScaledVector(up, -lateral.dot(up)).normalize();
  const z = new THREE.Vector3().crossVectors(x, up).normalize();
  probe.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, up, z));
  probe.position.copy(origin).addScaledVector(up, 0.01);
}

/*
 * 3D side of the pulmonary vein isolation exercise (pvi-model.js): a ring of
 * candidate lesion dots around each pulmonary vein ostium, measured from the
 * vein meshes at activation time. Clicking a dot sets a lesion (orange);
 * heart.js routes viewport clicks here while the exercise is active. The
 * rings are schematic antral teaching positions, not a mapped lesion set.
 */
import * as THREE from 'three';
import { PVI_VEINS, PVI_DOTS, createPviState, burnDot, isolated, allIsolated, burnedCount } from './pvi-model.js';

const IDLE = { color: 0xb6c2cc, opacity: 0.55 };
const BURNED = { color: 0xf97316, opacity: 0.95 };

/** Fit ostial plane at the atrial end of a vein, rather than selecting one side of its wall. */
export function veinOstiumRing(verts, atrium) {
  if (verts.length < 12) return null;
  const center = verts.reduce((sum, p) => sum.add(p), new THREE.Vector3()).divideScalar(verts.length);
  let axis = new THREE.Vector3(1, 1, 1).normalize();
  for (let iteration = 0; iteration < 24; iteration++) {
    const next = new THREE.Vector3();
    for (const p of verts) {
      const d = p.clone().sub(center);
      next.addScaledVector(d, d.dot(axis));
    }
    if (next.lengthSq() < 1e-12) return null;
    axis = next.normalize();
  }
  const projections = verts.map((p) => p.clone().sub(center).dot(axis));
  const lo = projections.reduce((min, value) => Math.min(min, value), Infinity);
  const hi = projections.reduce((max, value) => Math.max(max, value), -Infinity);
  if (hi - lo < 1e-5) return null;
  const lowEnd = center.clone().addScaledVector(axis, lo);
  const highEnd = center.clone().addScaledVector(axis, hi);
  if (highEnd.distanceToSquared(atrium) < lowEnd.distanceToSquared(atrium)) axis.negate();
  const along = verts.map((p) => p.clone().sub(center).dot(axis));
  const start = along.reduce((min, value) => Math.min(min, value), Infinity);
  const end = along.reduce((max, value) => Math.max(max, value), -Infinity);
  const section = start + (end - start) * 0.12;
  const width = Math.max((end - start) * 0.08, 0.015);
  const slice = verts.filter((_, i) => Math.abs(along[i] - section) <= width);
  if (slice.length < 6) return null;
  const ostium = slice.reduce((sum, p) => sum.add(p), new THREE.Vector3()).divideScalar(slice.length);
  const u = new THREE.Vector3(0, 1, 0).cross(axis);
  if (u.lengthSq() < 1e-4) u.set(1, 0, 0).cross(axis);
  u.normalize();
  const v = axis.clone().cross(u).normalize();
  const radii = slice.map((p) => p.clone().sub(ostium).projectOnPlane(axis).length()).sort((a, b) => a - b);
  const radius = Math.min(0.34, Math.max(0.09, radii[Math.floor(radii.length / 2)] * 1.2));
  return { ostium, normal: axis, radius, u, v };
}

/**
 * @param {{ sourceCenter: (id: string) => import('three').Vector3|null,
 *   meshVertices: (id: string) => import('three').Vector3[],
 *   isReady: () => boolean, camera: import('three').Camera,
 *   dom: HTMLElement, requestRender: () => void }} deps
 */
export function createPviLab({ sourceCenter, meshVertices, isReady, camera, dom, requestRender }) {
  const group = new THREE.Group();
  group.name = 'PVI lesion rings (schematic)';
  group.visible = false;

  let state = createPviState();
  const dots = [];          // { mesh, vein, index }
  const listeners = new Set();
  let initialized = false;
  let active = false;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function ringOf(veinId, la) {
    return veinOstiumRing(meshVertices(veinId), la);
  }

  function init() {
    if (initialized || !isReady()) return;
    const la = sourceCenter('la');
    if (!la) return;
    for (const vein of PVI_VEINS) {
      const ring = ringOf(vein.id, la);
      if (!ring) continue;
      // Faint guide circle through the candidate dots.
      const guidePts = Array.from({ length: 49 }, (_, k) => {
        const a = (k / 48) * Math.PI * 2;
        return ring.ostium.clone()
          .addScaledVector(ring.u, Math.cos(a) * ring.radius)
          .addScaledVector(ring.v, Math.sin(a) * ring.radius)
          .addScaledVector(ring.normal, -0.02);
      });
      const guide = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(guidePts),
        Object.assign(new THREE.LineBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.5 }), { depthTest: false, depthWrite: false })
      );
      guide.renderOrder = 23;
      guide.name = `PVI ring guide: ${vein.id}`;
      guide.raycast = () => {};
      group.add(guide);
      for (let i = 0; i < PVI_DOTS; i++) {
        const a = (i / PVI_DOTS) * Math.PI * 2;
        const position = ring.ostium.clone()
          .addScaledVector(ring.u, Math.cos(a) * ring.radius)
          .addScaledVector(ring.v, Math.sin(a) * ring.radius)
          // Antral: a step back from the ostium toward the atrium.
          .addScaledVector(ring.normal, -0.02);
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.042, 14, 14),
          Object.assign(new THREE.MeshBasicMaterial({ color: IDLE.color, transparent: true, opacity: IDLE.opacity }), { depthTest: false, depthWrite: false })
        );
        mesh.renderOrder = 24;
        mesh.position.copy(position);
        mesh.name = `PVI lesion dot: ${vein.id} ${i}`;
        mesh.userData = { vein: vein.id, index: i, provenance: 'schematic' };
        group.add(mesh);
        dots.push({ mesh, vein: vein.id, index: i });
      }
    }
    initialized = dots.length > 0;
    paint();
  }

  function paint() {
    for (const dot of dots) {
      const burned = state[dot.vein]?.[dot.index];
      const look = burned ? BURNED : IDLE;
      dot.mesh.material.color.setHex(look.color);
      dot.mesh.material.opacity = look.opacity;
      const scale = burned ? 1.25 : 1;
      dot.mesh.scale.setScalar(scale);
    }
  }

  function emit() {
    for (const listener of listeners) listener(state);
  }

  function burn(veinId, index) {
    const next = burnDot(state, veinId, index);
    if (next === state) return false;
    state = next;
    init();
    paint();
    requestRender();
    emit();
    return true;
  }

  /** Viewport click while active: true when a candidate dot was hit (and ablated). */
  function handleClick(event) {
    if (!active || !initialized) return false;
    const rect = dom.getBoundingClientRect?.();
    if (!rect || !rect.width || !rect.height) return false;
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(dots.map((d) => d.mesh), false);
    const hit = hits[0]?.object;
    if (!hit) return false;
    burn(hit.userData.vein, hit.userData.index);
    return true;
  }

  return {
    group,
    /** Show the rings and route viewport clicks here. */
    setActive(flag) {
      active = Boolean(flag);
      if (active) init();
      group.visible = active && initialized;
      requestRender();
    },
    isActive: () => active,
    handleClick,
    burn,
    reset() { state = createPviState(); paint(); requestRender(); emit(); },
    getState: () => state,
    burnedCount: (veinId) => burnedCount(state, veinId),
    isolated: (veinId) => isolated(state, veinId),
    allIsolated: () => allIsolated(state),
    dotCount: () => dots.length,
    onChange(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  };
}

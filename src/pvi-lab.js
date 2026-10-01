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
    const verts = meshVertices(veinId);
    if (verts.length < 12) return null;
    // Ostium cluster: the fifth of the vein mesh closest to the left atrium.
    const byLa = [...verts].sort((a, b) => a.distanceTo(la) - b.distanceTo(la));
    const near = byLa.slice(0, Math.max(8, Math.floor(verts.length / 5)));
    const farHalf = byLa.slice(-Math.max(8, Math.floor(verts.length / 5)));
    const centroid = (list) => list.reduce((acc, v) => acc.add(v), new THREE.Vector3()).multiplyScalar(1 / list.length);
    const ostium = centroid(near);
    const normal = centroid(farHalf).sub(ostium).normalize();
    const radius = Math.min(0.3, Math.max(0.09, near.reduce((acc, v) => acc + v.distanceTo(ostium), 0) / near.length * 1.15));
    const u = new THREE.Vector3(0, 1, 0).cross(normal);
    if (u.lengthSq() < 1e-4) u.set(1, 0, 0).cross(normal);
    u.normalize();
    const v = normal.clone().cross(u).normalize();
    return { ostium, normal, radius, u, v };
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

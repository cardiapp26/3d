import * as THREE from 'three';

/**
 * Identity labels for teaching markers that are easy to confuse (report
 * section 13): the LAA orifice ring, the epicardial Bachmann band and the
 * right atrial endocardial pacing target. Each label is anchored to a vertex
 * of its mesh and re-projected every render from the current (beating)
 * position, so it cannot drift from the structure.
 *
 * Labels are shown on demand (mode 'hover', the default): only while the
 * pointer is near a label's anchor or over its structure, or while that
 * structure is selected (tap on touch screens), so the scene stays readable.
 * Mode 'all' shows every applicable label (used by checks and teaching
 * screenshots).
 */
const WORLD = new THREE.Vector3();
const NEAR_PX = 40;   // pointer distance to an anchor that reveals its label

// Structure ids a label answers to: pickId / id of the mesh and its parents.
function idsOf(mesh) {
  const ids = new Set();
  for (let o = mesh; o; o = o.parent) {
    if (o.userData?.pickId) ids.add(o.userData.pickId);
    if (o.userData?.id) ids.add(o.userData.id);
  }
  return ids;
}

export function createSceneLabels(container) {
  const overlay = document.createElement('div');
  overlay.className = 'scene-labels';
  container.append(overlay);
  const entries = [];
  let mode = 'hover';
  let pointer = null;           // [x, y] in overlay pixels, or null
  let focus = new Set();        // hovered and selected structure ids
  container.addEventListener('pointermove', (event) => {
    const rect = overlay.getBoundingClientRect();
    pointer = [event.clientX - rect.left, event.clientY - rect.top];
  });
  container.addEventListener('pointerleave', () => { pointer = null; });

  /**
   * @param {{ mesh: THREE.Mesh, index?: number, text: { tr: string, en: string }, tone: string, when: () => boolean }} entry
   *   `index`: anchor vertex (default: the vertex nearest the mesh centre).
   */
  function add({ mesh, index = null, text, tone, when }) {
    if (!mesh?.geometry?.attributes?.position) return;
    const pos = mesh.geometry.attributes.position;
    if (index === null) {
      mesh.geometry.computeBoundingBox();
      const centre = mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
      let best = Infinity;
      for (let i = 0; i < pos.count; i++) {
        const d = WORLD.fromBufferAttribute(pos, i).distanceToSquared(centre);
        if (d < best) { best = d; index = i; }
      }
    }
    const label = document.createElement('span');
    label.className = 'scene-label';
    label.dataset.tone = tone;
    overlay.append(label);
    entries.push({ mesh, index, text, label, when, ids: idsOf(mesh) });
  }

  function shown(mesh) {
    for (let o = mesh; o; o = o.parent) if (!o.visible) return false;
    return true;
  }

  function update(camera) {
    const lang = document.documentElement.lang === 'en' ? 'en' : 'tr';
    const width = overlay.clientWidth, height = overlay.clientHeight;
    const placed = [];
    for (const { mesh, index, text, label, when, ids } of entries) {
      if (!when() || !shown(mesh)) { label.hidden = true; continue; }
      mesh.updateWorldMatrix(true, false);
      const p = WORLD.fromBufferAttribute(mesh.geometry.attributes.position, index).applyMatrix4(mesh.matrixWorld).project(camera);
      label.hidden = p.z < -1 || p.z > 1 || Math.abs(p.x) > 1 || Math.abs(p.y) > 1;
      if (label.hidden) continue;
      const x = (p.x + 1) / 2 * width, y = (1 - p.y) / 2 * height;
      const near = pointer && Math.hypot(pointer[0] - x, pointer[1] - y) < NEAR_PX;
      const focused = [...ids].some(id => focus.has(id));
      label.hidden = mode === 'hover' && !near && !focused;
      if (label.hidden) continue;
      label.textContent = text[lang];
      // Anchors of nearby markers can be close: lift a label clear of the
      // ones already placed (its leader line grows with the lift).
      const w = label.offsetWidth, h = label.offsetHeight;
      let lift = 0;
      const hits = () => placed.some(r => Math.abs(r.x - x) < (r.w + w) / 2 + 4 && Math.abs((r.y - r.lift) - (y - lift)) < h + 4);
      for (let k = 0; k < 6 && hits(); k++) lift += h + 6;
      placed.push({ x, y, w, lift });
      label.style.left = `${x}px`;
      label.style.top = `${y - lift}px`;
      label.style.setProperty('--lift', `${lift}px`);
    }
  }

  return {
    add, update,
    /** 'hover' (default: on demand) or 'all'. */
    setMode(next) { mode = next === 'all' ? 'all' : 'hover'; },
    getMode: () => mode,
    /** Hovered and selected structure ids (their labels show in 'hover' mode). */
    setFocus(...list) { focus = new Set(list.filter(Boolean)); },
    labels: () => entries.map(e => ({ tone: e.label.dataset.tone, text: e.label.textContent, hidden: e.label.hidden })), dispose() { overlay.remove(); } };
}

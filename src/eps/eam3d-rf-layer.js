// RF layer of the 3D map (eam3d-atlas.js): lesion tags coloured by depth
// grade, the ablation catheter tip and a faint guide along the target line.
import * as THREE from 'three';
import { EAM3D_ABLATION_LINES } from './eam3d-model.js';

const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const overlay = (params) => new THREE.MeshStandardMaterial({ depthTest: false, roughness: 0.35, ...params });

/** @returns {{ group: THREE.Group, setState: (s: { rfLesions?: object[], rfTip?: number[]|null, rfTarget?: string|null }) => boolean, dispose: () => void }} */
export function createRfLayer() {
  const group = new THREE.Group();
  const tags = new THREE.Group();
  const guide = new THREE.Group();
  group.add(guide, tags);

  const tip = new THREE.Group();
  const tipCore = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), overlay({ color: '#e0f2fe', emissive: '#38bdf8', emissiveIntensity: 0.9 }));
  const tipRing = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 8, 32), overlay({ color: '#38bdf8', emissive: '#0ea5e9', emissiveIntensity: 0.8, transparent: true, opacity: 0.85 }));
  tip.add(tipCore, tipRing);
  tip.visible = false;
  tip.renderOrder = 14;
  tipCore.renderOrder = 14;
  tipRing.renderOrder = 14;
  group.add(tip);

  let tagsKey = '';
  let targetId = null;

  const clearGroup = (g) => {
    g.traverse((o) => { o.geometry?.dispose(); for (const m of [o.material].flat().filter(Boolean)) m.dispose(); });
    g.clear();
  };

  function buildTags(list) {
    clearGroup(tags);
    for (const { pos, color, radius } of list) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 10), overlay({ color, emissive: color, emissiveIntensity: 0.55, transparent: true, opacity: 0.92 }));
      mesh.position.copy(V(pos));
      mesh.renderOrder = 12;
      tags.add(mesh);
    }
  }

  function buildGuide(lineId) {
    clearGroup(guide);
    const line = EAM3D_ABLATION_LINES[lineId];
    if (!line) return;
    const curve = new THREE.CatmullRomCurve3(line.points.map(V));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.01, 6, false), overlay({ color: '#f8fafc', emissive: '#94a3b8', emissiveIntensity: 0.4, transparent: true, opacity: 0.45 }));
    tube.renderOrder = 9;
    guide.add(tube);
    for (const end of [line.points[0], line.points[line.points.length - 1]]) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), overlay({ color: '#f8fafc', transparent: true, opacity: 0.7 }));
      cap.position.copy(V(end));
      cap.renderOrder = 9;
      guide.add(cap);
    }
  }

  /** Apply the RF fields of an atlas state patch; true when something changed. */
  function setState({ rfLesions, rfTip, rfTarget }) {
    let changed = false;
    if (rfLesions) {
      const key = rfLesions.map((l) => `${l.pos.join(',')}|${l.color}|${l.radius.toFixed(3)}`).join(';');
      if (key !== tagsKey) { tagsKey = key; buildTags(rfLesions); changed = true; }
    }
    if (rfTarget !== undefined && rfTarget !== targetId) {
      targetId = rfTarget;
      if (targetId) buildGuide(targetId);
      else clearGroup(guide);
      changed = true;
    }
    if (rfTip !== undefined) {
      tip.visible = Boolean(rfTip);
      if (rfTip) tip.position.copy(V(rfTip));
      changed = true;
    }
    return changed;
  }

  return { group, setState, dispose: () => clearGroup(group) };
}

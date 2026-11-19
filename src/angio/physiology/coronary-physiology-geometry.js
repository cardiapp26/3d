import * as THREE from 'three';
import { tubeComponents } from '../../coronary-branches.js';
import { lumenFactor, ratioColor } from './coronary-physiology-fluoro.js';
import { samplePullbackRatio } from './coronary-physiology-sim.js';

// Atlas tubes contain ordered twelve-vertex cross-section rings. Centimetres
// match tubeComponents' weld precision; exercise distances use actual arc mm.
export function prepareArtery(geometry, origin) {
  const components = tubeComponents(geometry).filter(c => c.rings.length > 1);
  if (!components.length) throw new Error('Atlas artery has no tube rings');
  const trunk = components.reduce((a, b) => a.length > b.length ? a : b);
  const position = geometry.attributes.position, original = position.array.slice();
  const flow = new Float32Array(position.count), ink = new Float32Array(position.count * 3);
  const rings = [];
  for (const component of components) {
    let mm = 0;
    const section = component.rings.map((center, i) => {
      const vertices = component.vertices.slice(i * 12, (i + 1) * 12);
      const radius = vertices.reduce((sum, v) => sum + new THREE.Vector3().fromBufferAttribute(position, v).distanceTo(center), 0) / vertices.length;
      return { center: center.clone(), vertices, radius, mm: 0, trunk: component === trunk };
    });
    if (section[0].center.distanceTo(origin) > section.at(-1).center.distanceTo(origin)) section.reverse();
    section.forEach((r, i) => { if (i) mm += r.center.distanceTo(section[i - 1].center) * 10; r.mm = mm; });
    component.sections = section;
    if (component === trunk) rings.push(...section);
  }
  for (const c of components) {
    const nearest = rings.reduce((best, r) => r.center.distanceTo(c.sections[0].center) < best.center.distanceTo(c.sections[0].center) ? r : best);
    for (const r of c.sections) for (const v of r.vertices) flow[v] = r.mm + (c === trunk ? 0 : nearest.mm);
  }
  geometry.setAttribute('flowMm', new THREE.BufferAttribute(flow, 1));
  geometry.setAttribute('ratioInk', new THREE.BufferAttribute(ink, 3));
  return { geometry, original, components, rings, lengthMm: rings.at(-1).mm };
}

export function pointAtMm(artery, mm) {
  const m = THREE.MathUtils.clamp(mm, 0, artery.lengthMm);
  const i = Math.max(1, artery.rings.findIndex(r => r.mm >= m));
  const a = artery.rings[i - 1], b = artery.rings[i];
  return a.center.clone().lerp(b.center, (m - a.mm) / (b.mm - a.mm || 1));
}

export function updateLumen(artery, caseObj, state) {
  const position = artery.geometry.attributes.position;
  position.array.set(artery.original);
  const colors = artery.geometry.attributes.ratioInk, color = new THREE.Color();
  for (const component of artery.components) for (const ring of component.sections) {
    const factor = ring.trunk ? lumenFactor(caseObj, ring.mm, state) : 1;
    const ratio = ring.trunk ? samplePullbackRatio(caseObj, ring.mm, { hyperemia: true, stentedIds: state.stentedIds || [], underexpanded: state.underexpanded }) : 1;
    color.set(ratioColor(ratio));
    for (const i of ring.vertices) {
      const p = new THREE.Vector3().fromBufferAttribute(position, i).sub(ring.center).multiplyScalar(factor).add(ring.center);
      position.setXYZ(i, p.x, p.y, p.z); colors.setXYZ(i, color.r, color.g, color.b);
    }
  }
  position.needsUpdate = true; colors.needsUpdate = true; artery.geometry.computeVertexNormals();
}

import * as THREE from 'three';
import { toFrame } from './mesh-utils.js';
import { scallopLayout, SCALLOP_COLORS } from './mitral-scallops.js';

/*
 * Leaflet identity per vertex for the echo section: mitral scallops/segments
 * (A1-A3 on the schematic anterior leaflet, P1-P3 on the atlas posterior
 * leaflet; the same approximate regions as the Mitral view), tricuspid
 * leaflets (septal, posterior, anterior) and the aortic and pulmonary cusps.
 * Each table is { names: [{ tr, en, abbr, color, key }], byVertex } like the
 * ventricle regions; -1 marks vertices without a leaflet label (chordae).
 */
const MITRAL_BODY = [-0.15, 0.65];    // leaflet body depth range, in annulus radii (deeper: chordae)

/** One label for every vertex of a mesh. */
export function wholeMesh(mesh, name) {
  return { names: [name], byVertex: new Int16Array(mesh.geometry.attributes.position.count) };
}

/** Mitral A1-A3 / P1-P3 per vertex, or null when the scallop layout cannot be measured. */
export function mitralParts(mesh, ring, posterior) {
  const layout = ring?.frame && posterior ? scallopLayout(ring, posterior) : null;
  if (!layout) return null;
  const side = mesh.userData.leaflet === 'anterior' ? 'A' : 'P';
  const names = [1, 2, 3].map((n) => ({
    tr: `${side}${n} (${side === 'A' ? 'anterior' : 'posterior'} yaprakçık)`,
    en: `${side}${n} (${side === 'A' ? 'anterior' : 'posterior'} leaflet)`,
    abbr: `${side}${n}`, color: SCALLOP_COLORS[n - 1], key: `mv-${side}${n}`
  }));
  const pos = mesh.geometry.attributes.position, byVertex = new Int16Array(pos.count);
  mesh.updateWorldMatrix(true, false);
  for (let i = 0; i < pos.count; i++) {
    const point = new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
    const depth = toFrame(ring.frame, point).d / ring.frame.radius;
    byVertex[i] = depth >= MITRAL_BODY[0] && depth < MITRAL_BODY[1] ? layout.region(point) : -1;
  }
  return { names, byVertex };
}

export const TRICUSPID_LEAFLETS = Object.freeze({
  septal: { tr: 'Septal yaprakçık (STL)', en: 'Septal leaflet (STL)', abbr: 'STL', color: '#b4a7d6', key: 'tv-septal' },
  inferior: { tr: 'Posterior yaprakçık (PTL)', en: 'Posterior leaflet (PTL)', abbr: 'PTL', color: '#93c47d', key: 'tv-posterior' },
  anterior: { tr: 'Anterior yaprakçık (ATL)', en: 'Anterior leaflet (ATL)', abbr: 'ATL', color: '#f6b26b', key: 'tv-anterior' }
});

export const AORTIC_CUSPS = Object.freeze({
  lcc: { tr: 'Sol koroner kapakçık (LCC)', en: 'Left coronary cusp (LCC)', abbr: 'LCC', color: '#6aa84f', key: 'av-lcc' },
  rcc: { tr: 'Sağ koroner kapakçık (RCC)', en: 'Right coronary cusp (RCC)', abbr: 'RCC', color: '#e69138', key: 'av-rcc' },
  ncc: { tr: 'Non-koroner kapakçık (NCC)', en: 'Non-coronary cusp (NCC)', abbr: 'NCC', color: '#45818e', key: 'av-ncc' }
});

/** Pulmonary cusp from the atlas node name (anterior, left or right semilunar leaflet). */
export function pulmonaryCusp(sourceName = '') {
  const which = /anterior/i.test(sourceName) ? 'anterior' : /left/i.test(sourceName) ? 'left' : /right/i.test(sourceName) ? 'right' : null;
  if (!which) return null;
  const tr = { anterior: 'Anterior', left: 'Sol', right: 'Sağ' }[which];
  const en = { anterior: 'Anterior', left: 'Left', right: 'Right' }[which];
  return { tr: `${tr} pulmoner kapakçık`, en: `${en} pulmonary cusp`, abbr: `${en[0]}PC`, color: { anterior: '#c27ba0', left: '#8e7cc3', right: '#6fa8dc' }[which], key: `pv-${which}` };
}

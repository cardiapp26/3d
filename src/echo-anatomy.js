import * as THREE from 'three';
import { centroid, inferiorCavalOstium, surfaceExit } from './mesh-utils.js';
import { appendageLobe } from './la-appendage.js';

/*
 * Anatomy the echo module needs from the atlas (report section 9): the
 * structures it sections, landmarks for the view presets and the schematic
 * oesophagus-stomach path of the TEE probe. Measured once from the rest pose.
 * The atlas has no oesophagus, stomach, chest wall or ribs: the path is
 * placed behind the measured left atrium and below the left ventricle, and
 * the TTE windows are points outside the measured heart surface.
 */

/** Structures cut by the imaging plane: section id, atlas ids, 2D colour and label. */
export const ECHO_STRUCTURES = Object.freeze([
  { id: 'lv', ids: ['lv'], color: '#e06666', label: { tr: 'LV', en: 'LV' } },
  { id: 'rv', ids: ['rv'], color: '#c27ba0', label: { tr: 'RV', en: 'RV' } },
  { id: 'la', ids: ['la'], color: '#f6b26b', label: { tr: 'LA', en: 'LA' } },
  { id: 'laa', ids: [], color: '#ffd966', label: { tr: 'LAA', en: 'LAA' } },
  { id: 'ra', ids: ['ra'], color: '#6fa8dc', label: { tr: 'RA', en: 'RA' } },
  { id: 'aorta', ids: ['aorta'], color: '#ea9999', label: { tr: 'Ao', en: 'Ao' } },
  { id: 'pa', ids: ['pa'], color: '#8e7cc3', label: { tr: 'PA', en: 'PA' } },
  { id: 'svc', ids: ['svc'], color: '#76a5af', label: { tr: 'SVC', en: 'SVC' } },
  // Pulmonary veins keep their identity (left / right, superior / inferior); 'pv' is their group.
  { id: 'lspv', ids: ['lspv'], color: '#b4a7d6', label: { tr: 'LSPV', en: 'LSPV' } },
  { id: 'lipv', ids: ['lipv'], color: '#9e8fd0', label: { tr: 'LIPV', en: 'LIPV' } },
  { id: 'rspv', ids: ['rspv'], color: '#a4c2f4', label: { tr: 'RSPV', en: 'RSPV' } },
  { id: 'ripv', ids: ['ripv'], color: '#8aaee8', label: { tr: 'RIPV', en: 'RIPV' } },
  { id: 'cs', ids: ['cs'], color: '#93c47d', label: { tr: 'CS', en: 'CS' } },
  { id: 'mitral', ids: ['mitral'], color: '#fff2cc', label: { tr: 'MV', en: 'MV' } },
  { id: 'tricuspid', ids: ['tricuspid'], color: '#d9ead3', label: { tr: 'TV', en: 'TV' } },
  { id: 'aortic-valve', ids: ['lcc', 'rcc', 'ncc'], color: '#fce5cd', label: { tr: 'AV', en: 'AV' } },
  { id: 'pulmonary-valve', ids: ['pulmonary-valve'], color: '#d9d2e9', label: { tr: 'PuV', en: 'PV (pulm.)' } },
  { id: 'lv-papillary', ids: ['lv-papillary'], color: '#f4cccc', label: { tr: 'PM', en: 'PM' } },
  { id: 'rv-papillary', ids: ['rv-papillary'], color: '#ead1dc', label: { tr: 'RV PM', en: 'RV PM' } },
  { id: 'moderator-band', ids: ['moderator-band'], color: '#e69138', label: { tr: 'MB', en: 'MB' } }
]);

const vec = v => v.toArray();

function worldPoints(meshes) {
  const out = [];
  for (const mesh of meshes) {
    mesh.updateWorldMatrix(true, false);
    const pos = mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) out.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld));
  }
  return out;
}

/**
 * Section items: live position arrays of the current (beating) geometry.
 * The LA is split into body and appendage lobe (same positions, two indices).
 * @param {(id: string) => THREE.Mesh[]} getMeshes
 */
export function echoItems(getMeshes) {
  const items = [];
  const push = (id, mesh, index = mesh.geometry.index?.array ?? null) => {
    mesh.updateWorldMatrix(true, false);
    items.push({ id, mesh, positions: mesh.geometry.attributes.position.array, index, matrix: mesh.matrixWorld.elements, key: mesh.geometry });
  };
  for (const s of ECHO_STRUCTURES) {
    for (const atlasId of s.ids) for (const mesh of getMeshes(atlasId)) {
      if (!mesh.geometry?.attributes?.position || mesh.userData.micro) continue;
      if (atlasId === 'la') {
        const split = splitAppendage(mesh);
        if (split) { push('la', mesh, split.body); push('laa', mesh, split.lobe); continue; }
      }
      push(s.id, mesh);
    }
  }
  return items;
}

function splitAppendage(mesh) {
  if (mesh.userData.echoSplit) return mesh.userData.echoSplit;
  const found = appendageLobe(mesh);
  const index = mesh.geometry.index?.array;
  if (!found || !index) return null;
  const body = [], lobe = [];
  for (let t = 0; t < index.length; t += 3) {
    const inLobe = [0, 1, 2].every(k => found.lobe.has(found.root[index[t + k]]));
    (inLobe ? lobe : body).push(index[t], index[t + 1], index[t + 2]);
  }
  mesh.userData.echoSplit = { body: Uint32Array.from(body), lobe: Uint32Array.from(lobe) };
  return mesh.userData.echoSplit;
}

/**
 * Landmarks for the view presets, in atlas coordinates (plain arrays).
 * @param {{ getMeshes: (id: string) => THREE.Mesh[] }} deps
 */
export function measureEchoAnatomy({ getMeshes }) {
  const box = id => { const b = new THREE.Box3(); getMeshes(id).forEach(m => b.expandByObject(m)); return b; };
  const centreOf = id => box(id).getCenter(new THREE.Vector3());
  const frameOf = id => getMeshes(id)[0]?.userData.frame;
  const lvPoints = worldPoints(getMeshes('lv'));
  const lv = centroid(lvPoints.map(p => p.clone()));
  const mvFrame = frameOf('mitral-annulus'), tvFrame = frameOf('tricuspid-annulus');
  if (!mvFrame || !tvFrame || !lvPoints.length) throw new Error('Echo presets need the LV and both annulus frames');
  // The mitral normal, turned toward the LV; the apex is the LV point farthest along it.
  const mvNormal = mvFrame.normal.clone();
  if (mvNormal.dot(lv.clone().sub(mvFrame.center)) < 0) mvNormal.negate();
  const apex = lvPoints.reduce((best, p) => p.clone().sub(mvFrame.center).dot(mvNormal) > best.clone().sub(mvFrame.center).dot(mvNormal) ? p : best).clone();
  const cusps = ['lcc', 'rcc', 'ncc'].map(centreOf);
  const avCentre = centroid(cusps.map(c => c.clone()));
  const avNormal = new THREE.Vector3().crossVectors(cusps[1].clone().sub(cusps[0]), cusps[2].clone().sub(cusps[0])).normalize();
  if (avNormal.dot(new THREE.Vector3(0, 1, 0)) < 0) avNormal.negate();       // toward the ascending aorta
  const laPoints = worldPoints(getMeshes('la'));
  const la = centroid(laPoints.map(p => p.clone()));
  const laaOrifice = getMeshes('la')[0]?.userData.laaOrifice || null;
  // Oesophagus: behind the posterior LA wall at the level of the LA centre.
  const behind = laPoints.filter(p => Math.abs(p.y - la.y) < 0.15 && Math.abs(p.x - la.x) < 0.3);
  const posteriorWall = Math.min(...(behind.length ? behind : laPoints).map(p => p.z));
  const oesophagus = { x: la.x, z: posteriorWall - OESOPHAGUS_GAP };
  // Stomach: below the inferior LV wall at the papillary level, a little posterior.
  const lvMid = mvFrame.center.clone().lerp(apex, STOMACH_LEVEL);
  const under = lvPoints.filter(p => Math.hypot(p.x - lvMid.x, p.z - lvMid.z) < 0.35);
  const inferiorWall = Math.min(...(under.length ? under : lvPoints).map(p => p.y));
  const stomach = new THREE.Vector3(lvMid.x, inferiorWall - STOMACH_GAP, lvMid.z - 0.15);
  const top = la.y + 1.7;
  const oesophagusPath = [
    [oesophagus.x, top, oesophagus.z],
    [oesophagus.x, la.y + 0.8, oesophagus.z],
    [oesophagus.x, la.y, oesophagus.z],
    [oesophagus.x, mvFrame.center.y - 0.45, oesophagus.z + 0.03],
    [(oesophagus.x + stomach.x) / 2, stomach.y + 0.3, (oesophagus.z + stomach.z) / 2],
    vec(stomach)
  ];
  return {
    mv: { center: vec(mvFrame.center), normal: vec(mvNormal), radius: mvFrame.radius },
    tv: { center: vec(tvFrame.center), radius: tvFrame.radius },
    av: { center: vec(avCentre), normal: vec(avNormal) },
    apex: vec(apex), lv: vec(lv), la: vec(la),
    rv: vec(centreOf('rv')), ra: vec(centreOf('ra')), pa: vec(centreOf('pa')),
    papillary: vec(centreOf('lv-papillary')),
    svc: vec(centreOf('svc')), ivc: vec(inferiorCavalOstium(getMeshes('ra')[0]) || centreOf('ra')),
    laa: laaOrifice ? { center: vec(laaOrifice.center), axis: vec(laaOrifice.axis) } : null,
    lvLength: apex.distanceTo(mvFrame.center),
    oesophagusPath, stomach: vec(stomach)
  };
}

// Oesophagus lumen centre behind the LA wall (wall, pericardium, oesophageal wall):
// about 12 mm at 1 unit = 34 mm (research/LAA_BACHMANN.md section 2).
const OESOPHAGUS_GAP = 0.35;
const STOMACH_GAP = 0.3;
const STOMACH_LEVEL = 0.6;      // fraction of the mitral-to-apex axis (mid-papillary)

/**
 * Schematic chest surface for TTE contact: the ellipsoid around the heart's
 * chambers and great vessels, CHEST_MARGIN beyond them (chest wall; about 12 mm).
 */
export const CHEST_MARGIN = 0.35;
export function chestSurface(meshes) {
  const box = new THREE.Box3();
  meshes.forEach(m => box.expandByObject(m));
  const size = box.getSize(new THREE.Vector3());
  return { center: box.getCenter(new THREE.Vector3()).toArray(), radii: size.toArray().map(v => v / 2 * Math.SQRT2 + CHEST_MARGIN) };
}

// Heart-surface exit distance (TTE windows): shared with the Koch close-up camera.
export { surfaceExit };

import * as THREE from 'three';
import { surface, resample, placeOnSurface } from './atrial-surface.js';

/*
 * Embryonic valve remnants in the right atrium, placed from measured
 * landmarks of the atlas (the atlas has neither); teaching geometry.
 * - Eustachian valve: a crescentic fold of the anterior rim of the inferior
 *   caval orifice. It runs from the end of the crista terminalis around the
 *   front of the orifice toward the coronary sinus mouth, where it meets the
 *   Thebesian valve; the tendon of Todaro runs on from this commissure.
 * - Chiari network: a fenestrated net of fine strands from the Eustachian
 *   (and Thebesian) valve region to the crista terminalis and the RA wall;
 *   a variant (about 2-3% at autopsy), drawn here as a few strands and
 *   shown in the RA mode only.
 * Ho and Sánchez-Quintana, PMC4668306.
 */
const BASE_OFFSET = 0.015;      // valve base this far into the cavity from the wall
const VALVE_HEIGHT = 0.16;      // free edge height at the middle of the crescent
const STRAND_RADIUS = 0.005;
const STRAND_COUNT = 5;
const STRAND_SAG = 0.03;

/** Crescent height along the valve base (t from the lateral end to the CS end). */
export function eustachianHeight(t) {
  return VALVE_HEIGHT * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), 0.7);
}

/**
 * @param {{ raMeshes: THREE.Mesh[], ivcOstium: THREE.Vector3, csOstium: THREE.Vector3 }} input
 * @returns {{ geometry: THREE.BufferGeometry, base: THREE.Vector3[], edge: THREE.Vector3[] }}
 */
export function createEustachianValve({ raMeshes, ivcOstium, csOstium }) {
  const ra = surface(raMeshes);
  if (!ra.inner.length || !ivcOstium || !csOstium) throw new Error('Eustachian valve needs the RA inner wall, the IVC and CS ostia');
  // Atlas axes: +x patient left (septal for the RA), +z anterior, +y up.
  // From the anterolateral rim of the caval orifice, across its front, to the CS mouth.
  // The atlas RA is closed at the caval mouth (no IVC mesh): the rim is taken around the measured ostium.
  const lateral = ivcOstium.clone().add(new THREE.Vector3(-0.04, 0.03, 0.18));
  const anterior = ivcOstium.clone().add(new THREE.Vector3(0.12, 0.08, 0.16));
  const samples = resample([lateral, anterior, csOstium.clone()]);
  const base = placeOnSurface(samples, () => ra.inner, BASE_OFFSET);
  // The free edge rises into the cavity and a little upward, like the fold
  // that directs caval blood toward the oval fossa in the fetus.
  const up = new THREE.Vector3(0, 1, 0);
  const edge = base.map((s, i) => {
    const lift = s.n.clone().multiplyScalar(0.75).addScaledVector(up, 0.45).normalize();
    return s.p.clone().addScaledVector(lift, eustachianHeight(i / (base.length - 1)));
  });
  return { geometry: ribbon(base.map(s => s.p), edge), base: base.map(s => s.p), edge };
}

/**
 * Strand paths of the Chiari network. The crista path runs from the SVC end
 * down to the IVC end, the valve edge from its lateral end to the coronary
 * sinus mouth. The strands start on the lateral part of the valve edge and
 * end on the lower crista, both in the same order, so neighbours run side by
 * side without crossing; short cross links between neighbours make the net.
 * @param {{ valveEdge: THREE.Vector3[], cristaPath: THREE.Vector3[], centre: THREE.Vector3 }} input
 * @returns {THREE.Vector3[][]} each strand is [from, mid, to]
 */
export function chiariStrandPaths({ valveEdge, cristaPath, centre }) {
  const strands = [];
  for (let k = 0; k < STRAND_COUNT; k++) {
    const u = k / (STRAND_COUNT - 1);
    const from = valveEdge[Math.round((0.08 + 0.54 * u) * (valveEdge.length - 1))];
    const to = cristaPath[Math.round((0.97 - 0.22 * u) * (cristaPath.length - 1))];
    // Strands hang slightly into the cavity and sag, not along the wall.
    const mid = from.clone().lerp(to, 0.5).lerp(centre, 0.12);
    mid.y -= STRAND_SAG;
    strands.push([from.clone(), mid, to.clone()]);
  }
  const at = (strand, f) => strand[0].clone().lerp(strand[2], f).lerp(centre, 0.12 * (1 - Math.abs(2 * f - 1)));
  for (let k = 0; k + 1 < STRAND_COUNT; k++) {
    const f = k % 2 ? 0.62 : 0.38;
    const a = at(strands[k], f), b = at(strands[k + 1], f);
    strands.push([a, a.clone().lerp(b, 0.5), b]);
  }
  return strands;
}

/**
 * @param {{ raMeshes: THREE.Mesh[], valveEdge: THREE.Vector3[], cristaPath: THREE.Vector3[] }} input
 * @returns {{ geometry: THREE.BufferGeometry, strands: THREE.Vector3[][] }}
 */
export function createChiariNetwork({ raMeshes, valveEdge, cristaPath }) {
  const ra = surface(raMeshes);
  if (!valveEdge?.length || !cristaPath?.length) throw new Error('Chiari network needs the Eustachian valve edge and the crista terminalis');
  const strands = chiariStrandPaths({ valveEdge, cristaPath, centre: ra.centre });
  const parts = strands.map(points => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, STRAND_RADIUS, 6, false));
  const geometry = mergeTubes(parts);
  parts.forEach(g => g.dispose());
  return { geometry, strands };
}

/** Two-row strip between the base and the free edge. */
function ribbon(base, edge) {
  const positions = [], indices = [];
  base.forEach((p, i) => positions.push(...p.toArray(), ...edge[i].toArray()));
  for (let i = 0; i + 1 < base.length; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    indices.push(a, c, b, b, c, d);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function mergeTubes(parts) {
  const positions = [], indices = [];
  let offset = 0;
  for (const g of parts) {
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    const idx = g.index.array;
    for (let i = 0; i < idx.length; i++) indices.push(idx[i] + offset);
    offset += pos.count;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

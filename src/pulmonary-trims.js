import * as THREE from 'three';
import { vesselTrimPlane } from './mesh-utils.js';

/*
 * Hilar length of the pulmonary artery branches. The atlas LPA sweeps far
 * posteroinferiorly along the lower lobe artery; both branches are trimmed
 * on a plane across their measured centerline at an arc length from the
 * bifurcation. The trunk and the bifurcation stay intact. The LPA arches
 * over the left main bronchus for about 3-4 cm (1.0 unit, 3.7 cm); the longer RPA runs about
 * 4-5 cm behind the ascending aorta and SVC to the right hilum (Gray's
 * Anatomy, 42nd ed.). About 3.7 cm per atlas unit.
 */
export const PA_BRANCH_KEEP = Object.freeze({
  'Left pulmonary artery': 1.0,
  'Right pulmonary artery': 1.25
});
/**
 * Largest allowed distance (atlas units, about 6.5 cm) from the bifurcation
 * centre to the farthest kept wall point of a branch. It includes the half
 * width of the trunk and the branch radius; the untrimmed atlas LPA reaches
 * about 3 units (11 cm).
 */
export const PA_BRANCH_MAX_REACH = 1.75;

const centroid = list => list.reduce((a, v) => a.add(v), new THREE.Vector3()).multiplyScalar(1 / list.length);

/**
 * @param {(name: string) => THREE.Vector3[]} verts vertices of an atlas mesh by its source name
 * @param {THREE.Vector3} [fallback] bifurcation centre when the bifurcation mesh is missing
 * @returns {{ bifurcation: THREE.Vector3, planes: Map<string, THREE.Plane> }}
 */
export function pulmonaryBranchTrims(verts, fallback = new THREE.Vector3(0.07, 1.5, -0.42)) {
  const bif = verts('Bifurcation of pulmonary trunk');
  const bifurcation = bif.length ? centroid(bif) : fallback.clone();
  const planes = new Map();
  for (const [name, keep] of Object.entries(PA_BRANCH_KEEP)) {
    const plane = vesselTrimPlane(verts(name), bifurcation, keep);
    if (plane) planes.set(name, plane);
  }
  return { bifurcation, planes };
}

/** Farthest kept vertex of `list` from `origin` on the positive side of `plane` (the trimmed branch end). */
export function trimmedReach(list, plane, origin) {
  let reach = 0;
  for (const v of list) if (!plane || plane.distanceToPoint(v) >= 0) reach = Math.max(reach, v.distanceTo(origin));
  return reach;
}

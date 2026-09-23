import * as THREE from 'three';
import { annulusFrame, sharedRim } from './mesh-utils.js';

/**
 * Builds schematic AV annulus rings from atlas chamber boundary loops.
 * Each ring keeps its measured rim and annulus frame (normal toward the
 * ventricle) in userData, so leaflets and valve motion share one geometry.
 *
 * Anterior mitral and anterior tricuspid leaflets are not atlas nodes.
 * schematic-leaflets.js spans only the measured annular arc the existing
 * leaflets leave empty, and marks those sails schematic.
 */
export function createAnnuli(helpers) {
  const { register = () => {}, getMeshes = () => [] } = helpers;
  const group = new THREE.Group();
  group.name = 'Valve Annuli';
  const meshes = [];

  const material = new THREE.MeshStandardMaterial({
    color: 0xf5f3ea,
    roughness: 0.35,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  function ventricleCenter(id) {
    const mesh = getMeshes(id)[0];
    return mesh ? new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3()) : null;
  }

  function addRing(points, id, name, sourceName, ventricleId) {
    const curve = new THREE.CatmullRomCurve3(points, true);
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 96, 0.032, 12, true),
      material.clone()
    );
    mesh.name = name;
    mesh.userData = {
      id,
      layer: 'valves',
      sourceName,
      provenance: 'schematic'
    };
    const toward = ventricleCenter(ventricleId);
    if (toward) {
      mesh.userData.rim = points.map(point => point.clone());
      mesh.userData.frame = annulusFrame(points, toward);
    }
    group.add(mesh);
    meshes.push(mesh);
    register(mesh, id);
  }

  function build() {
    const mitralRim = sharedRim(getMeshes('la')[0], getMeshes('lv')[0]);
    const tricuspidRim = sharedRim(getMeshes('ra')[0], getMeshes('rv')[0]);

    if (mitralRim) {
      addRing(mitralRim, 'mitral-annulus', 'Mitral annulus', 'Mitral valve fibrous annulus', 'lv');
    }
    if (tricuspidRim) {
      addRing(tricuspidRim, 'tricuspid-annulus', 'Tricuspid annulus', 'Tricuspid valve fibrous annulus', 'rv');
    }
  }

  return { group, build, meshes };
}

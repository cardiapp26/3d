import * as THREE from 'three';
import { sharedRim } from './mesh-utils.js';

/**
 * Builds schematic AV annulus rings from atlas chamber boundary loops.
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

  function addRing(points, id, name, sourceName) {
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
    group.add(mesh);
    meshes.push(mesh);
    register(mesh, id);
  }

  function build() {
    const mitralRim = sharedRim(getMeshes('la')[0], getMeshes('lv')[0]);
    const tricuspidRim = sharedRim(getMeshes('ra')[0], getMeshes('rv')[0]);

    if (mitralRim) {
      addRing(mitralRim, 'mitral-annulus', 'Mitral annulus', 'Mitral valve fibrous annulus');
    }
    if (tricuspidRim) {
      addRing(tricuspidRim, 'tricuspid-annulus', 'Tricuspid annulus', 'Tricuspid valve fibrous annulus');
    }
  }

  return { group, build, meshes };
}

import * as THREE from 'three';

/**
 * Procedural 3D Anatomical Valve Annuli (Mitral & Tricuspid Fibröz Halkaları).
 * Mitral Annulus: D-shaped saddle fibrous ring between LA and LV (anterior fibrous aorto-mitral curtain & posterior muscular saddle).
 * Tricuspid Annulus: Non-planar elliptical fibrous ring between RA and RV.
 */
export function createAnnuli(helpers) {
  const { sourceCenter } = helpers;
  const group = new THREE.Group();
  group.name = 'Valve Annuli';

  const matAnnulus = new THREE.MeshStandardMaterial({
    color: 0xf5f3ea,
    roughness: 0.35,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  const meshes = [];

  function build() {
    const mitralCenter = sourceCenter('mitral') || new THREE.Vector3(0.48, -0.31, -0.50);
    const tricuspidCenter = sourceCenter('tricuspid') || new THREE.Vector3(-0.45, -0.35, 0.15);

    // -------------------------------------------------------------
    // 1. Mitral Annulus (D-shaped saddle ring)
    // -------------------------------------------------------------
    // Saddle shape: high points anteriorly and posteriorly, low points at commissures.
    // D-shape: straight anterior border (aorto-mitral continuity) and curved posterior border.
    const maPoints = [];
    const numPoints = 32;
    const rX = 0.52;
    const rZ = 0.44;

    for (let i = 0; i < numPoints; i++) {
      const theta = (i / numPoints) * Math.PI * 2;
      let x = Math.sin(theta) * rX;
      let z = Math.cos(theta) * rZ;

      // Flatten anterior portion to create the anatomical 'D' shape
      if (z > 0.12) {
        z = 0.12 + (z - 0.12) * 0.35;
      }

      // Saddle height modulation (peaks anterior and posterior, troughs laterally/commissural)
      const saddleY = Math.cos(theta * 2) * 0.08;

      maPoints.push(new THREE.Vector3(
        mitralCenter.x + x,
        mitralCenter.y + 0.10 + saddleY,
        mitralCenter.z + z
      ));
    }

    const maCurve = new THREE.CatmullRomCurve3(maPoints, true);
    const maTubeGeom = new THREE.TubeGeometry(maCurve, 48, 0.038, 12, true);
    const maMesh = new THREE.Mesh(maTubeGeom, matAnnulus.clone());
    maMesh.name = 'Mitral annulus';
    maMesh.userData = {
      id: 'mitral-annulus',
      layer: 'valves',
      sourceName: 'Mitral valve fibrous annulus',
      provenance: 'schematic'
    };
    group.add(maMesh);
    meshes.push(maMesh);

    // -------------------------------------------------------------
    // 2. Tricuspid Annulus (Non-planar elliptical ring)
    // -------------------------------------------------------------
    const taPoints = [];
    const taNumPoints = 32;
    const taRadiusX = 0.58;
    const taRadiusZ = 0.48;

    for (let i = 0; i < taNumPoints; i++) {
      const theta = (i / taNumPoints) * Math.PI * 2;
      const x = Math.sin(theta) * taRadiusX;
      const z = Math.cos(theta) * taRadiusZ;

      // Anteroseptal and posteroseptal contour
      const taSaddleY = Math.sin(theta + 0.4) * 0.12;

      // Rotate slightly to align with right AV groove tilt
      const tiltedX = x * 0.92 - z * 0.25;
      const tiltedZ = x * 0.25 + z * 0.92;

      taPoints.push(new THREE.Vector3(
        tricuspidCenter.x + tiltedX,
        tricuspidCenter.y + 0.08 + taSaddleY,
        tricuspidCenter.z + tiltedZ
      ));
    }

    const taCurve = new THREE.CatmullRomCurve3(taPoints, true);
    const taTubeGeom = new THREE.TubeGeometry(taCurve, 48, 0.038, 12, true);
    const taMesh = new THREE.Mesh(taTubeGeom, matAnnulus.clone());
    taMesh.name = 'Tricuspid annulus';
    taMesh.userData = {
      id: 'tricuspid-annulus',
      layer: 'valves',
      sourceName: 'Tricuspid valve fibrous annulus',
      provenance: 'schematic'
    };
    group.add(taMesh);
    meshes.push(taMesh);
  }

  return {
    group,
    build,
    meshes
  };
}

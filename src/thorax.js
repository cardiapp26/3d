import * as THREE from 'three';

/**
 * Schematic mediastinal context: diaphragm dome, phrenic nerve courses and a
 * faint vertebral column behind the heart. All geometry is schematic scenery
 * anchored to atlas chamber bounds; none of it is segmented atlas anatomy.
 */
export function createThorax(helpers) {
  const { sourceCenter, register } = helpers;
  const group = new THREE.Group();
  group.name = 'Thoracic context';

  let initialized = false;

  function build() {
    if (initialized) return;

    const ra = sourceCenter('ra') || new THREE.Vector3(-1.03, 0.13, 0.12);
    const la = sourceCenter('la') || new THREE.Vector3(-0.05, 0.27, -0.37);
    const svc = sourceCenter('svc') || new THREE.Vector3(-1.08, 1.89, -0.16);
    const lv = sourceCenter('lv') || new THREE.Vector3(0.65, -0.75, 0.05);

    // -------------------------------------------------------------
    // 1. Diaphragm: flattened dome below the cardiac silhouette,
    //    right hemidome (patient right = -x) slightly higher (liver).
    // -------------------------------------------------------------
    const matDiaphragm = new THREE.MeshStandardMaterial({
      color: 0xc98f76,
      roughness: 0.7,
      metalness: 0.02,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const diaphragmGroup = new THREE.Group();
    diaphragmGroup.name = 'Diaphragm';

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1, 40, 22, 0, Math.PI * 2, 0, Math.PI / 2),
      matDiaphragm
    );
    dome.scale.set(2.7, 0.85, 2.3);
    dome.position.set(-0.1, -2.05, -0.45);
    dome.rotation.z = -0.09; // right hemidiaphragm rides higher
    dome.name = 'Diaphragm (schematic dome)';
    dome.userData = { id: 'diaphragm', layer: 'thorax', sourceName: 'Diaphragm', provenance: 'schematic' };
    diaphragmGroup.add(dome);
    register(dome, 'diaphragm');

    group.add(diaphragmGroup);

    // -------------------------------------------------------------
    // 2. Phrenic nerves (optional layer, default off).
    //    Right: lateral to the SVC, along the lateral RA wall (in front of the
    //    right pulmonary veins) down to the diaphragm. Left: over the aortic
    //    arch and the LAA / lateral LV wall to the diaphragm.
    // -------------------------------------------------------------
    const matNerve = new THREE.MeshStandardMaterial({
      color: 0xe8e29a,
      emissive: 0x8f8a3f,
      emissiveIntensity: 0.5,
      roughness: 0.45,
      metalness: 0.05,
      toneMapped: false
    });

    function nerve(points, name) {
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, 0.017, 8, false),
        matNerve.clone()
      );
      mesh.name = name;
      mesh.userData = { id: 'phrenic', layer: 'thorax', sourceName: name, provenance: 'schematic' };
      register(mesh, 'phrenic');
      return mesh;
    }

    const phrenicGroup = new THREE.Group();
    phrenicGroup.name = 'Phrenic nerves';

    phrenicGroup.add(nerve([
      new THREE.Vector3(svc.x - 0.28, svc.y + 1.0, svc.z - 0.15),
      new THREE.Vector3(svc.x - 0.32, svc.y + 0.2, svc.z - 0.05),
      new THREE.Vector3(ra.x - 0.55, ra.y + 0.55, ra.z - 0.15),
      new THREE.Vector3(ra.x - 0.62, ra.y - 0.15, ra.z - 0.25),
      new THREE.Vector3(ra.x - 0.55, ra.y - 0.85, ra.z - 0.30),
      new THREE.Vector3(ra.x - 0.35, -1.75, ra.z - 0.30)
    ], 'Right phrenic nerve'));

    phrenicGroup.add(nerve([
      new THREE.Vector3(-0.35, 2.75, -0.85),
      new THREE.Vector3(-0.05, 2.30, -0.75),
      new THREE.Vector3(la.x + 0.95, la.y + 0.85, la.z + 0.25),
      new THREE.Vector3(lv.x + 0.85, lv.y + 0.55, lv.z - 0.15),
      new THREE.Vector3(lv.x + 0.75, lv.y - 0.35, lv.z - 0.25),
      new THREE.Vector3(lv.x + 0.45, -1.70, lv.z - 0.35)
    ], 'Left phrenic nerve'));

    group.add(phrenicGroup);

    // -------------------------------------------------------------
    // 3. Vertebral column: very faint bodies behind the heart.
    // -------------------------------------------------------------
    const matBone = new THREE.MeshStandardMaterial({
      color: 0xbdb7ac,
      roughness: 0.85,
      metalness: 0,
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    });

    const vertebraeGroup = new THREE.Group();
    vertebraeGroup.name = 'Vertebral column';

    const bodyGeom = new THREE.CylinderGeometry(0.34, 0.34, 0.3, 18);
    const processGeom = new THREE.CylinderGeometry(0.09, 0.06, 0.5, 8);
    processGeom.rotateX(Math.PI / 2);
    for (let i = 0; i < 13; i++) {
      const y = 2.9 - i * 0.46;
      const body = new THREE.Mesh(bodyGeom, matBone.clone());
      body.position.set(-0.25, y, -2.35);
      body.name = 'Vertebral body (schematic)';
      body.userData = { id: 'vertebrae', layer: 'thorax', sourceName: 'Vertebral column', provenance: 'schematic' };
      vertebraeGroup.add(body);
      register(body, 'vertebrae');

      const spinous = new THREE.Mesh(processGeom, matBone.clone());
      spinous.position.set(-0.25, y, -2.75);
      spinous.name = 'Spinous process (schematic)';
      spinous.userData = { id: 'vertebrae', layer: 'thorax', sourceName: 'Vertebral column', provenance: 'schematic' };
      vertebraeGroup.add(spinous);
      register(spinous, 'vertebrae');
    }

    group.add(vertebraeGroup);

    initialized = true;
  }

  return { group, build };
}

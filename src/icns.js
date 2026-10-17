import * as THREE from 'three';

/**
 * Intrinsic Cardiac Autonomic Nervous System (ICNS) & Epicardiac Ganglionated Subplexuses (sGPs)
 *
 * Anatomical and Electrophysiological reference:
 * Aksu T, Gupta D, Pauza DH. "Anatomy and Physiology of Intrinsic Cardiac Autonomic Nervous System."
 * JACC: Case Reports 2021;3(4):625–629 (Da Vinci Anatomy Card #2).
 * Pauza DH et al., Anat Rec 2000;259:353–382.
 *
 * Pauza 7 Human Epicardiac Ganglionated Subplexuses (sGPs):
 * 1. VRAsGP (Ventral right atrial sGP - Blue, 0x3b82f6)
 * 2. VLAsGP (Ventral left atrial sGP - Green, 0x22c55e)
 * 3. LDsGP (Left dorsal sGP - Red, 0xef4444)
 * 4. MDsGP (Middle dorsal sGP - Orange, 0xf97316)
 * 5. DRAsGP (Dorsal right atrial sGP - Pink, 0xec4899)
 * 6. RCsGP (Right coronary sGP - Magenta, 0xd946ef)
 * 7. LCsGP (Left coronary sGP - Brown, 0xb45309)
 *
 * Clinical Electrophysiology Cardioneuroablation (CNA) Targets:
 * - RSGP / SVC-Ao fat pad: selective negative chronotropic effect on the SA node.
 * - P-IS GP / Crux cordis / IVC-LA fat pad: selective negative dromotropic effect on the AV node.
 */
export function createIcns(helpers) {
  const { sourceCenter, register, isReady = () => true } = helpers;
  const group = new THREE.Group();
  group.name = 'Intrinsic Cardiac Autonomic Nervous System (ICNS)';

  let initialized = false;

  function init() {
    if (initialized || !isReady()) return;

    // Anchor points from atlas or anatomically calibrated coordinates
    const ra = sourceCenter('ra') || new THREE.Vector3(-1.03, 0.13, 0.12);
    const la = sourceCenter('la') || new THREE.Vector3(-0.05, 0.27, -0.37);
    const svc = sourceCenter('svc') || new THREE.Vector3(-1.08, 1.89, -0.16);
    const sa = sourceCenter('sa') || new THREE.Vector3(-1.045, 1.39, 0.115);
    const av = sourceCenter('av') || new THREE.Vector3(-0.45, 0.05, -0.05);

    function createMaterial(colorHex, emissiveIntensity = 0.6) {
      return new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity,
        roughness: 0.35,
        metalness: 0.08,
        toneMapped: false
      });
    }

    function addNerveTract(points, colorHex, id, name, radius = 0.016) {
      const curve = new THREE.CatmullRomCurve3(points);
      const geom = new THREE.TubeGeometry(curve, 32, radius, 8, false);
      const mat = createMaterial(colorHex, 0.5);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = name;
      mesh.userData = { id, layer: 'icns', sublayer: id, sourceName: name, provenance: 'schematic' };
      group.add(mesh);
      register(mesh, id);
      return mesh;
    }

    function addGanglionCluster(center, colorHex, id, name, radius = 0.045) {
      const geom = new THREE.SphereGeometry(radius, 20, 20);
      const mat = createMaterial(colorHex, 0.8);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(center);
      mesh.name = name;
      mesh.userData = { id, layer: 'icns', sublayer: id, sourceName: name, provenance: 'schematic' };
      group.add(mesh);
      register(mesh, id);

      // Add a subtle pulsating ganglion aura ring
      const haloGeom = new THREE.RingGeometry(radius * 1.25, radius * 1.85, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
        depthWrite: false
      });
      const halo = new THREE.Mesh(haloGeom, haloMat);
      halo.position.copy(center);
      halo.lookAt(center.clone().add(new THREE.Vector3(0, 0, 1)));
      halo.name = `${name} (Aura)`;
      halo.userData = { id, layer: 'icns', sublayer: id, sourceName: `${name} aura`, provenance: 'schematic' };
      group.add(halo);
      register(halo, id);

      return mesh;
    }

    // -------------------------------------------------------------
    // 1. VRAsGP (Ventral Right Atrial Subplexus - Blue: 0x3b82f6)
    // -------------------------------------------------------------
    const vrasgpColor = 0x3b82f6;
    addNerveTract([
      new THREE.Vector3(sa.x + 0.08, sa.y + 0.12, sa.z + 0.08),
      new THREE.Vector3(ra.x - 0.05, ra.y + 0.75, ra.z + 0.32),
      new THREE.Vector3(ra.x + 0.15, ra.y + 0.45, ra.z + 0.35),
      new THREE.Vector3(-0.65, 0.42, 0.32),
      new THREE.Vector3(-0.42, 0.50, 0.26)
    ], vrasgpColor, 'vrasgp', 'VRAsGP · Ventral Right Atrial Subplexus');

    addGanglionCluster(
      new THREE.Vector3(ra.x + 0.05, ra.y + 0.60, ra.z + 0.34),
      vrasgpColor, 'vrasgp', 'VRAsGP Anterior Ganglion Cluster'
    );

    // -------------------------------------------------------------
    // 2. VLAsGP (Ventral Left Atrial Subplexus - Green: 0x22c55e)
    // -------------------------------------------------------------
    const vlasgpColor = 0x22c55e;
    addNerveTract([
      new THREE.Vector3(-0.42, 0.50, 0.26), // junction with VRAsGP across ventral crest
      new THREE.Vector3(-0.20, 0.52, 0.22),
      new THREE.Vector3(0.08, 0.46, 0.18),
      new THREE.Vector3(0.32, 0.38, 0.14),
      new THREE.Vector3(0.55, 0.22, 0.08)
    ], vlasgpColor, 'vlasgp', 'VLAsGP · Ventral Left Atrial Subplexus');

    addGanglionCluster(
      new THREE.Vector3(0.02, 0.50, 0.20),
      vlasgpColor, 'vlasgp', 'VLAsGP Ventral Roof Ganglion Cluster'
    );

    // -------------------------------------------------------------
    // 3. LDsGP (Left Dorsal Subplexus - Red: 0xef4444)
    // -------------------------------------------------------------
    const ldsgpColor = 0xef4444;
    addNerveTract([
      new THREE.Vector3(0.62, 0.58, -0.28), // LSPV antrum / Marshall ligament
      new THREE.Vector3(0.58, 0.32, -0.42),
      new THREE.Vector3(0.52, 0.05, -0.46), // between LSPV and LIPV
      new THREE.Vector3(0.44, -0.28, -0.40),
      new THREE.Vector3(0.36, -0.58, -0.28) // toward dorsal LV
    ], ldsgpColor, 'ldsgp', 'LDsGP · Left Dorsal Subplexus');

    // Clinical target: LSGP / Marshall ligament fat pad
    addGanglionCluster(
      new THREE.Vector3(0.60, 0.54, -0.32),
      ldsgpColor, 'ldsgp', 'LDsGP Superior Cluster / LSGP (Ligament of Marshall)'
    );
    addGanglionCluster(
      new THREE.Vector3(0.50, 0.02, -0.47),
      ldsgpColor, 'ldsgp', 'LDsGP Inferior Cluster (LIPV Fat Pad)'
    );

    // -------------------------------------------------------------
    // 4. MDsGP (Middle Dorsal Subplexus - Orange: 0xf97316)
    // -------------------------------------------------------------
    const mdsgpColor = 0xf97316;
    addNerveTract([
      new THREE.Vector3(-0.10, 0.70, -0.38), // dorsal superior LA
      new THREE.Vector3(-0.22, 0.35, -0.48), // Waterston groove
      new THREE.Vector3(-0.35, -0.05, -0.52),
      new THREE.Vector3(-0.46, -0.42, -0.54), // approaching crux cordis
      new THREE.Vector3(-0.52, -0.66, -0.48)  // crux cordis
    ], mdsgpColor, 'mdsgp', 'MDsGP · Middle Dorsal Subplexus');

    addGanglionCluster(
      new THREE.Vector3(-0.20, 0.45, -0.45),
      mdsgpColor, 'mdsgp', 'MDsGP Posterosuperior Interatrial Cluster'
    );
    // Crux cordis / P-IS GP cluster
    addGanglionCluster(
      new THREE.Vector3(-0.48, -0.58, -0.52),
      mdsgpColor, 'pisgp', 'P-IS GP / Crux Cordis Ganglion Cluster (AV Node Target)'
    );

    // -------------------------------------------------------------
    // 5. DRAsGP (Dorsal Right Atrial Subplexus - Pink: 0xec4899)
    // -------------------------------------------------------------
    const drasgpColor = 0xec4899;
    addNerveTract([
      new THREE.Vector3(svc.x + 0.12, svc.y - 0.20, svc.z - 0.05),
      new THREE.Vector3(sa.x + 0.10, sa.y + 0.08, sa.z - 0.08), // dorsal to SA node
      new THREE.Vector3(ra.x - 0.08, ra.y + 0.65, ra.z - 0.20),
      new THREE.Vector3(ra.x + 0.10, ra.y + 0.35, ra.z - 0.30),
      new THREE.Vector3(-0.35, 0.22, -0.44) // communicating with MDsGP
    ], drasgpColor, 'drasgp', 'DRAsGP · Dorsal Right Atrial Subplexus');

    // Clinical target: RSGP / SVC-Ao fat pad
    addGanglionCluster(
      new THREE.Vector3(sa.x + 0.16, sa.y + 0.15, sa.z + 0.02),
      drasgpColor, 'rsgp', 'RSGP / SVC-Ao Fat Pad Ganglion Cluster (SA Node Target)'
    );
    addGanglionCluster(
      new THREE.Vector3(ra.x - 0.02, ra.y + 0.50, ra.z - 0.24),
      drasgpColor, 'drasgp', 'DRAsGP Posterosuperior RA Cluster'
    );

    // -------------------------------------------------------------
    // 6. RCsGP (Right Coronary Subplexus - Magenta: 0xd946ef)
    // -------------------------------------------------------------
    const rcsgpColor = 0xd946ef;
    addNerveTract([
      new THREE.Vector3(-0.62, 0.32, 0.40),
      new THREE.Vector3(-0.92, -0.05, 0.32),
      new THREE.Vector3(-0.90, -0.48, 0.12),
      new THREE.Vector3(-0.76, -0.68, -0.18),
      new THREE.Vector3(-0.55, -0.68, -0.44) // joins crux cordis
    ], rcsgpColor, 'rcsgp', 'RCsGP · Right Coronary Subplexus');

    addGanglionCluster(
      new THREE.Vector3(-0.88, -0.15, 0.28),
      rcsgpColor, 'rcsgp', 'RCsGP Lateral Right AV Sulcus Cluster'
    );

    // -------------------------------------------------------------
    // 7. LCsGP (Left Coronary Subplexus - Brown/Amber: 0xb45309)
    // -------------------------------------------------------------
    const lcsgpColor = 0xb45309;
    addNerveTract([
      new THREE.Vector3(0.22, 0.28, 0.12),
      new THREE.Vector3(0.52, -0.02, 0.06),
      new THREE.Vector3(0.48, -0.42, -0.18),
      new THREE.Vector3(0.18, -0.56, -0.38),
      new THREE.Vector3(-0.40, -0.62, -0.46) // joins crux cordis
    ], lcsgpColor, 'lcsgp', 'LCsGP · Left Coronary Subplexus');

    addGanglionCluster(
      new THREE.Vector3(0.48, -0.12, 0.04),
      lcsgpColor, 'lcsgp', 'LCsGP Lateral Left AV Sulcus Cluster'
    );

    initialized = true;
  }

  init();

  return {
    group,
    init,
    isReady
  };
}

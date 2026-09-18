import * as THREE from 'three';

/**
 * Procedural 3D Clinical Electrophysiology (EP) Landmarks and Ablation Targets.
 * Grounded in standard clinical EP practice (CTI line, Triangle of Koch, WACA/PVI rings).
 * Anchor points are measured from the atlas meshes (vein ostia, leaflet hinges,
 * CS ostium) instead of hand-tuned constants.
 */
export function createEPLandmarks(helpers) {
  const { sourceCenter, meshVertices = () => [] } = helpers;
  const group = new THREE.Group();
  group.name = 'EP Landmarks';
  group.visible = false;

  const targets = {};

  // Materials
  const matLesion = new THREE.MeshStandardMaterial({
    color: 0xff3b30,
    emissive: 0xff453a,
    emissiveIntensity: 0.9,
    roughness: 0.3,
    metalness: 0.1
  });

  const matLesionGlow = new THREE.MeshBasicMaterial({
    color: 0xff6961,
    transparent: true,
    opacity: 0.75,
    wireframe: true
  });

  const matDanger = new THREE.MeshStandardMaterial({
    color: 0xff2d55,
    emissive: 0xff2d55,
    emissiveIntensity: 1.0,
    roughness: 0.2
  });

  const matSafeTarget = new THREE.MeshStandardMaterial({
    color: 0x30d158,
    emissive: 0x30d158,
    emissiveIntensity: 0.85,
    roughness: 0.3
  });

  const matBoundary = new THREE.LineBasicMaterial({
    color: 0xffd60a,
    linewidth: 2,
    transparent: true,
    opacity: 0.85
  });

  let initialized = false;

  // Centroid of the vertices of `verts` nearest to `ref` (ostium finder).
  function nearEndCentroid(verts, ref, keepFraction = 0.15) {
    if (!verts.length) return null;
    const sorted = [...verts].sort((a, b) => a.distanceTo(ref) - b.distanceTo(ref));
    const keep = sorted.slice(0, Math.max(6, Math.floor(sorted.length * keepFraction)));
    return keep.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / keep.length);
  }

  function init() {
    if (initialized) return;

    const ra = sourceCenter('ra') || new THREE.Vector3(-1.03, 0.13, 0.12);
    const la = sourceCenter('la') || new THREE.Vector3(-0.05, 0.27, -0.37);
    const av = new THREE.Vector3(-0.28, -0.20, -0.10); // matches the conduction system AV node

    const tvVerts = meshVertices('tricuspid');
    const ivcVerts = meshVertices('ivc');
    const csVerts = meshVertices('cs');
    const septalVerts = meshVertices('tricuspid', /septal/i);

    // Measured anchors -------------------------------------------------
    // IVC ostium: IVC vertices nearest the RA centroid.
    const ivcOs = nearEndCentroid(ivcVerts, ra) || new THREE.Vector3(-0.85, -0.65, -0.35);
    // CS ostium: CS vertices nearest the RA centroid.
    const csOs = nearEndCentroid(csVerts, ra) || new THREE.Vector3(-0.70, -0.41, -0.30);
    // Inferior tricuspid hinge: lowest band of tricuspid vertices closest to the IVC ostium.
    let tvInferior = new THREE.Vector3(-0.75, -0.75, 0.0);
    if (tvVerts.length) {
      const lowBand = [...tvVerts].sort((a, b) => a.y - b.y).slice(0, Math.floor(tvVerts.length * 0.2));
      tvInferior = nearEndCentroid(lowBand, ivcOs, 0.35) || tvInferior;
    }
    // Septal tricuspid hinge: upper (annular) band of the septal leaflet.
    let septalHinge = new THREE.Vector3(-0.45, -0.20, 0.05);
    if (septalVerts.length) {
      const highBand = [...septalVerts].sort((a, b) => b.y - a.y).slice(0, Math.floor(septalVerts.length * 0.25));
      septalHinge = highBand.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / highBand.length);
    }

    // -------------------------------------------------------------
    // 1. CTI (Cavotricuspid Isthmus) Ablation Line (Atrial Flutter)
    // -------------------------------------------------------------
    const ctiGroup = new THREE.Group();
    ctiGroup.name = 'CTI Ablation Line';

    const ctiMid = ivcOs.clone().lerp(tvInferior, 0.5).add(new THREE.Vector3(0, -0.04, 0.06));
    const ctiCurve = new THREE.CatmullRomCurve3([
      ivcOs.clone().lerp(tvInferior, 0.08),
      ctiMid,
      tvInferior.clone().lerp(ivcOs, 0.05)
    ]);
    ctiGroup.add(new THREE.Mesh(new THREE.TubeGeometry(ctiCurve, 20, 0.022, 10, false), matLesion.clone()));

    ctiCurve.getPoints(9).forEach(pt => {
      const burn = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 16), matLesion.clone());
      burn.position.copy(pt);
      ctiGroup.add(burn);
    });

    group.add(ctiGroup);
    targets.cti = ctiGroup;

    // -------------------------------------------------------------
    // 2. Triangle of Koch & Slow Pathway Area (AVNRT)
    // -------------------------------------------------------------
    const kochGroup = new THREE.Group();
    kochGroup.name = 'Triangle of Koch';

    const apexPt = av.clone();
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      apexPt, septalHinge,
      septalHinge, csOs,
      csOs, apexPt
    ]);
    kochGroup.add(new THREE.LineSegments(lineGeom, matBoundary));

    // Compact AV node marker (Apex - High risk of AV block)
    const avDanger = new THREE.Mesh(new THREE.SphereGeometry(0.055, 18, 18), matDanger);
    avDanger.position.copy(apexPt);
    kochGroup.add(avDanger);

    // Slow pathway target zone: base of the triangle, just anterior to the CS ostium.
    const slowPathwayCenter = csOs.clone().lerp(septalHinge, 0.3);
    const slowTarget = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 18), matSafeTarget);
    slowTarget.position.copy(slowPathwayCenter);
    kochGroup.add(slowTarget);

    // RF lesion cluster in the slow pathway area, spread along the CS-hinge axis.
    const axis = septalHinge.clone().sub(csOs).normalize();
    const side = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 1, 0)).normalize();
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const rf = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 12), matLesion.clone());
      rf.position.copy(slowPathwayCenter)
        .addScaledVector(axis, Math.cos(angle) * 0.045)
        .addScaledVector(side, Math.sin(angle) * 0.045);
      kochGroup.add(rf);
    }

    group.add(kochGroup);
    targets.koch = kochGroup;

    // -------------------------------------------------------------
    // 3. Wide Area Circumferential Ablation (WACA / PVI Rings) - AF
    // -------------------------------------------------------------
    const pviGroup = new THREE.Group();
    pviGroup.name = 'PVI / WACA Rings';

    // Measured PV ostia: for each vein, the vertex band nearest the LA centroid.
    const ostium = pattern => {
      const verts = meshVertices('pv', pattern);
      return verts.length ? nearEndCentroid(verts, la) : null;
    };
    const lspv = ostium(/Left superior/i);
    const lipv = ostium(/Left inferior/i);
    const rspv = ostium(/Right superior/i);
    const ripv = ostium(/Right inferior/i);

    function antralRing(osA, osB, fallbackCenter) {
      const center = osA && osB ? osA.clone().add(osB).multiplyScalar(0.5) : fallbackCenter;
      // Ring plane faces outward from the LA body through the vein pair.
      const normal = center.clone().sub(la).normalize();
      const spread = osA && osB ? osA.distanceTo(osB) : 0.55;
      const radius = spread * 0.5 + 0.16;
      const u = new THREE.Vector3(0, 1, 0).cross(normal).normalize();
      if (u.lengthSq() < 0.01) u.set(1, 0, 0);
      const v = new THREE.Vector3().crossVectors(normal, u).normalize();
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        pts.push(center.clone()
          .addScaledVector(u, Math.cos(a) * radius)
          .addScaledVector(v, Math.sin(a) * radius * 1.25)); // taller than wide (superior+inferior veins)
      }
      const spline = new THREE.CatmullRomCurve3(pts, true);
      const ringMesh = new THREE.Mesh(new THREE.TubeGeometry(spline, 40, 0.025, 8, true), matLesion.clone());
      spline.getPoints(14).forEach(pt => {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), matLesion.clone());
        dot.position.copy(pt);
        ringMesh.add(dot);
        dot.position.sub(ringMesh.position);
      });
      return { ringMesh, center };
    }

    const leftRing = antralRing(lspv, lipv, new THREE.Vector3(la.x + 0.6, la.y + 0.1, la.z - 0.2));
    const rightRing = antralRing(rspv, ripv, new THREE.Vector3(la.x - 0.6, la.y + 0.1, la.z - 0.2));
    pviGroup.add(leftRing.ringMesh);
    pviGroup.add(rightRing.ringMesh);

    // Roof line joining the superior aspects of the two antral rings.
    const roofA = (lspv || leftRing.center).clone();
    const roofB = (rspv || rightRing.center).clone();
    const roofMid = roofA.clone().add(roofB).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.18, 0));
    const roofLine = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([roofA, roofMid, roofB]), 16, 0.018, 8, false
    );
    pviGroup.add(new THREE.Mesh(roofLine, matLesionGlow));

    group.add(pviGroup);
    targets.pvi = pviGroup;

    initialized = true;
  }

  function setStep(stepIndex) {
    init();
    // stepIndex: 0: CTI, 1: Koch/AVNRT, 2: PVI/AF, 3: Full Overview
    if (targets.cti) targets.cti.visible = (stepIndex === 0 || stepIndex === 3);
    if (targets.koch) targets.koch.visible = (stepIndex === 1 || stepIndex === 3);
    if (targets.pvi) targets.pvi.visible = (stepIndex === 2 || stepIndex === 3);
  }

  function setVisible(visible) {
    if (visible) init();
    group.visible = Boolean(visible);
  }

  return {
    group,
    init,
    setVisible,
    setStep,
    targets
  };
}

import * as THREE from 'three';

/**
 * Procedural 3D Clinical Electrophysiology (EP) Landmarks and Ablation Targets.
 * Grounded in standard clinical EP practice (CTI line, Triangle of Koch, WACA/PVI rings).
 */
export function createEPLandmarks(helpers) {
  const { sourceCenter } = helpers;
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

  function init() {
    if (initialized) return;

    const ivc = sourceCenter('ivc') || new THREE.Vector3(-0.85, -0.65, -0.35);
    const tv = sourceCenter('tricuspid') || new THREE.Vector3(-0.45, -0.45, 0.15);
    const av = sourceCenter('av') || new THREE.Vector3(-0.28, -0.20, -0.10);
    const cs = sourceCenter('cs') || new THREE.Vector3(-0.55, -0.38, -0.20);
    const la = sourceCenter('la') || new THREE.Vector3(0.05, 0.45, -0.55);

    // -------------------------------------------------------------
    // 1. CTI (Cavotricuspid Isthmus) Ablation Line (Atrial Flutter)
    // -------------------------------------------------------------
    const ctiGroup = new THREE.Group();
    ctiGroup.name = 'CTI Ablation Line';

    // Curve between IVC edge and tricuspid annulus
    const ctiStart = new THREE.Vector3(ivc.x * 0.9 + tv.x * 0.1, ivc.y + 0.12, ivc.z * 0.9 + tv.z * 0.1);
    const ctiMid = new THREE.Vector3((ivc.x + tv.x) * 0.5, (ivc.y + tv.y) * 0.5 - 0.05, (ivc.z + tv.z) * 0.5 - 0.04);
    const ctiEnd = new THREE.Vector3(tv.x * 0.85 + ivc.x * 0.15, tv.y + 0.05, tv.z * 0.85 + ivc.z * 0.15);

    const ctiCurve = new THREE.CatmullRomCurve3([ctiStart, ctiMid, ctiEnd]);
    const ctiTube = new THREE.TubeGeometry(ctiCurve, 20, 0.022, 10, false);
    const ctiMesh = new THREE.Mesh(ctiTube, matLesion.clone());
    ctiGroup.add(ctiMesh);

    // Discrete RF ablation burn points along the line
    const ctiPoints = ctiCurve.getPoints(9);
    ctiPoints.forEach((pt, i) => {
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

    // Apex: Compact AV node
    const apexPt = av.clone();
    // Base 1: CS ostium
    const csPt = new THREE.Vector3(cs.x * 0.85 + av.x * 0.15, cs.y + 0.05, cs.z);
    // Base 2: Septal tricuspid hinge point
    const hingePt = new THREE.Vector3(tv.x * 0.7 + av.x * 0.3, tv.y + 0.08, tv.z * 0.7 + av.z * 0.3);

    // Triangle boundary lines (Tendon of Todaro, Septal Hinge, CS Base)
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      apexPt, hingePt,
      hingePt, csPt,
      csPt, apexPt
    ]);
    const boundaryLines = new THREE.LineSegments(lineGeom, matBoundary);
    kochGroup.add(boundaryLines);

    // Compact AV node marker (Apex - High risk of AV block)
    const avDanger = new THREE.Mesh(new THREE.SphereGeometry(0.055, 18, 18), matDanger);
    avDanger.position.copy(apexPt);
    kochGroup.add(avDanger);

    // Slow pathway ablation target zone (near CS ostium at base of triangle)
    const slowPathwayCenter = new THREE.Vector3(
      csPt.x * 0.65 + hingePt.x * 0.25 + apexPt.x * 0.1,
      csPt.y * 0.65 + hingePt.y * 0.25 + apexPt.y * 0.1,
      csPt.z * 0.65 + hingePt.z * 0.25 + apexPt.z * 0.1
    );
    const slowTarget = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 18), matSafeTarget);
    slowTarget.position.copy(slowPathwayCenter);
    kochGroup.add(slowTarget);

    // RF lesion cluster in slow pathway area
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const r = 0.045;
      const rf = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 12), matLesion.clone());
      rf.position.set(
        slowPathwayCenter.x + Math.cos(angle) * r,
        slowPathwayCenter.y + Math.sin(angle) * r,
        slowPathwayCenter.z + (Math.random() - 0.5) * 0.02
      );
      kochGroup.add(rf);
    }

    group.add(kochGroup);
    targets.koch = kochGroup;

    // -------------------------------------------------------------
    // 3. Wide Area Circumferential Ablation (WACA / PVI Rings) - AF
    // -------------------------------------------------------------
    const pviGroup = new THREE.Group();
    pviGroup.name = 'PVI / WACA Rings';

    function createPviRing(center, radiusX, radiusY, tiltY, tiltX) {
      const curve = new THREE.EllipseCurve(0, 0, radiusX, radiusY, 0, Math.PI * 2, false, 0);
      const points2D = curve.getPoints(36);
      const points3D = points2D.map(p => new THREE.Vector3(p.x, p.y, 0));
      const spline = new THREE.CatmullRomCurve3(points3D, true);
      const tubeGeom = new THREE.TubeGeometry(spline, 36, 0.025, 8, true);
      const ringMesh = new THREE.Mesh(tubeGeom, matLesion.clone());

      ringMesh.position.copy(center);
      ringMesh.rotation.y = tiltY;
      ringMesh.rotation.x = tiltX;

      // Burn dots along the ring
      points3D.filter((_, idx) => idx % 3 === 0).forEach(pt => {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), matLesion.clone());
        dot.position.copy(pt);
        ringMesh.add(dot);
      });

      return ringMesh;
    }

    // Left Pulmonary Veins WACA Ring (LSPV + LIPV on posterior-left LA antrum)
    const leftPvCenter = new THREE.Vector3(la.x + 0.55, la.y + 0.15, la.z - 0.15);
    const leftRing = createPviRing(leftPvCenter, 0.28, 0.38, -0.4, 0.2);
    pviGroup.add(leftRing);

    // Right Pulmonary Veins WACA Ring (RSPV + RIPV on posterior-right LA antrum)
    const rightPvCenter = new THREE.Vector3(la.x - 0.55, la.y + 0.15, la.z - 0.12);
    const rightRing = createPviRing(rightPvCenter, 0.28, 0.38, 0.4, 0.2);
    pviGroup.add(rightRing);

    // Roof and Floor lines (optional linear ablation)
    const roofLine = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(leftPvCenter.x - 0.12, leftPvCenter.y + 0.32, leftPvCenter.z),
        new THREE.Vector3(la.x, la.y + 0.38, la.z - 0.12),
        new THREE.Vector3(rightPvCenter.x + 0.12, rightPvCenter.y + 0.32, rightPvCenter.z)
      ]),
      16, 0.018, 8, false
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

import * as THREE from 'three';

/**
 * Procedural 3D Transseptal Puncture & Balloon Atrial Septostomy simulation.
 * Models:
 * - Interatrial septum (IAS) with fossa ovalis membrane and muscular limbus
 * - Percutaneous access route: femoral vein -> IVC -> RA -> SVC catheter positioning
 * - Transseptal system drag-down from SVC with needle tenting on the fossa
 * - Needle crossing into the LA with guidewire advanced toward the LSPV
 * - Static balloon atrial septostomy (Rashkind-type) inflating across the IAS
 * Danger zones (aortic root / NCC, posterior LA wall) are marked in red.
 * All geometry is schematic and anchored to atlas mesh centers via sourceCenter().
 */
export function createTransseptal(helpers) {
  const { sourceCenter } = helpers;
  const group = new THREE.Group();
  group.name = 'Transseptal & Septostomy';
  group.visible = false;

  const matSeptum = new THREE.MeshStandardMaterial({
    color: 0xc98d7f,
    roughness: 0.6,
    metalness: 0.05,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide
  });

  const matFossa = new THREE.MeshStandardMaterial({
    color: 0xe7c3ae,
    roughness: 0.45,
    metalness: 0.05,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
  });

  const matLimbus = new THREE.MeshStandardMaterial({
    color: 0xa9564e,
    roughness: 0.55,
    metalness: 0.05
  });

  const matSheath = new THREE.MeshStandardMaterial({
    color: 0x2f6fed,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.55,
    roughness: 0.3,
    metalness: 0.55,
    toneMapped: false
  });

  const matNeedle = new THREE.MeshStandardMaterial({
    color: 0xe8eaed,
    emissive: 0x9aa3ad,
    emissiveIntensity: 0.4,
    roughness: 0.15,
    metalness: 0.95,
    toneMapped: false
  });

  const matWire = new THREE.MeshStandardMaterial({
    color: 0x30d158,
    emissive: 0x30d158,
    emissiveIntensity: 0.55,
    roughness: 0.3
  });

  const matTarget = new THREE.MeshBasicMaterial({
    color: 0x00f2fe,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide
  });

  const matDanger = new THREE.MeshStandardMaterial({
    color: 0xff2d55,
    emissive: 0xff2d55,
    emissiveIntensity: 0.95,
    roughness: 0.2
  });

  const matBalloon = new THREE.MeshStandardMaterial({
    color: 0x7bd5f5,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.68
  });

  let initialized = false;
  let currentProgress = 1.0;
  const stages = {};
  const progressive = {};
  let balloonState = null;

  function makeTube(curve, radius, material, segments = 48) {
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 8, false), material.clone());
    return mesh;
  }

  function makeProgressiveTube(key, curve, radius, material) {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material.clone());
    progressive[key] = { curve, radius, mesh, tip: null };
    return mesh;
  }

  function init() {
    if (initialized) return;

    const ra = sourceCenter('ra') || new THREE.Vector3(-1.03, 0.13, 0.12);
    const la = sourceCenter('la') || new THREE.Vector3(-0.05, 0.27, -0.37);
    const svc = sourceCenter('svc') || new THREE.Vector3(-1.08, 1.89, -0.16);
    const ivc = sourceCenter('ivc') || new THREE.Vector3(-0.85, -0.65, -0.35);
    const aorta = sourceCenter('aorta') || new THREE.Vector3(-0.32, 1.71, -0.67);

    // Septal plane: normal points RA -> LA
    const septalNormal = la.clone().sub(ra).normalize();
    // Fossa ovalis: posteroinferior septum, biased toward RA side of the midline
    const fossa = ra.clone().lerp(la, 0.42).add(new THREE.Vector3(0, -0.12, -0.10));
    const facing = fossa.clone().add(septalNormal);

    // -------------------------------------------------------------
    // 0. Interatrial septum + fossa ovalis (shared by all steps)
    // -------------------------------------------------------------
    const iasGroup = new THREE.Group();
    iasGroup.name = 'Interatrial septum';

    const septumDisc = new THREE.Mesh(new THREE.CircleGeometry(0.52, 40), matSeptum);
    septumDisc.position.copy(fossa);
    septumDisc.lookAt(facing);
    septumDisc.name = 'Interatrial septum (schematic)';
    iasGroup.add(septumDisc);

    const fossaDisc = new THREE.Mesh(new THREE.CircleGeometry(0.17, 32), matFossa);
    fossaDisc.position.copy(fossa).addScaledVector(septalNormal, 0.004);
    fossaDisc.lookAt(facing);
    fossaDisc.name = 'Fossa ovalis';
    iasGroup.add(fossaDisc);

    const limbus = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.028, 10, 40), matLimbus);
    limbus.position.copy(fossa).addScaledVector(septalNormal, 0.006);
    limbus.lookAt(facing);
    limbus.name = 'Limbus fossae ovalis';
    iasGroup.add(limbus);

    group.add(iasGroup);
    stages.ias = iasGroup;

    // -------------------------------------------------------------
    // 1. Percutaneous access route: femoral vein -> IVC -> RA -> SVC
    // -------------------------------------------------------------
    const accessGroup = new THREE.Group();
    accessGroup.name = 'Femoral venous access route';

    const femoralEntry = new THREE.Vector3(ivc.x - 0.05, ivc.y - 1.05, ivc.z - 0.10);
    const midRa = new THREE.Vector3(ra.x, ra.y + 0.35, ra.z - 0.05);
    const highSvc = new THREE.Vector3(svc.x, svc.y - 0.15, svc.z);
    const accessCurve = new THREE.CatmullRomCurve3([
      femoralEntry,
      new THREE.Vector3(ivc.x, ivc.y - 0.35, ivc.z),
      new THREE.Vector3(ivc.x + 0.02, ivc.y + 0.25, ivc.z + 0.12),
      midRa,
      highSvc
    ]);
    accessGroup.add(makeProgressiveTube('access', accessCurve, 0.022, matSheath));

    // Femoral entry marker (percutaneous access site)
    const entryMarker = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), matTarget.clone());
    entryMarker.position.copy(femoralEntry);
    entryMarker.name = 'Femoral vein entry (access site)';
    accessGroup.add(entryMarker);

    const entryRing = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.012, 8, 28), matTarget.clone());
    entryRing.position.copy(femoralEntry);
    entryRing.rotation.x = Math.PI / 2;
    accessGroup.add(entryRing);

    group.add(accessGroup);
    stages.access = accessGroup;

    // -------------------------------------------------------------
    // 2. Transseptal positioning: drag-down from SVC, tenting on fossa
    // -------------------------------------------------------------
    const punctureGroup = new THREE.Group();
    punctureGroup.name = 'Transseptal positioning & tenting';

    const raSideStandoff = fossa.clone().addScaledVector(septalNormal, -0.10);
    const dragCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(ivc.x + 0.02, ivc.y + 0.25, ivc.z + 0.12),
      midRa.clone(),
      highSvc.clone(),
      new THREE.Vector3(ra.x + 0.10, ra.y + 0.55, ra.z - 0.10),
      raSideStandoff
    ]);
    punctureGroup.add(makeProgressiveTube('drag', dragCurve, 0.024, matSheath));

    // Needle tip + fossa tenting cone (pointing along septal normal)
    const tentTip = new THREE.Group();
    const needleShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.16, 10), matNeedle);
    needleShaft.rotation.x = Math.PI / 2;
    needleShaft.position.z = -0.05;
    tentTip.add(needleShaft);
    const tentCone = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.10, 24, 1, true), matFossa.clone());
    tentCone.material.opacity = 0.55;
    tentCone.rotation.x = -Math.PI / 2;
    tentCone.position.z = 0.05;
    tentTip.add(tentCone);
    tentTip.position.copy(fossa).addScaledVector(septalNormal, -0.02);
    tentTip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), septalNormal);
    tentTip.name = 'Needle tenting on fossa ovalis';
    punctureGroup.add(tentTip);

    // Puncture target ring on the fossa
    const targetRing = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 28), matTarget.clone());
    targetRing.position.copy(fossa).addScaledVector(septalNormal, 0.01);
    targetRing.lookAt(facing);
    targetRing.name = 'Puncture target';
    punctureGroup.add(targetRing);

    // Danger zones: aortic root (NCC) anterosuperior, posterior LA wall
    const aorticDanger = new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 18), matDanger.clone());
    aorticDanger.position.set(aorta.x, aorta.y - 1.05, aorta.z + 0.45);
    aorticDanger.name = 'Danger: aortic root / NCC';
    punctureGroup.add(aorticDanger);

    const posteriorDanger = new THREE.Mesh(new THREE.SphereGeometry(0.07, 18, 18), matDanger.clone());
    posteriorDanger.position.copy(fossa).add(new THREE.Vector3(0.12, 0.02, -0.42));
    posteriorDanger.name = 'Danger: posterior LA wall';
    punctureGroup.add(posteriorDanger);

    group.add(punctureGroup);
    stages.puncture = punctureGroup;

    // -------------------------------------------------------------
    // 2b. Fluoroscopic landmark catheters: aortic pigtail (NCC) + CS decapolar
    // -------------------------------------------------------------
    const landmarkGroup = new THREE.Group();
    landmarkGroup.name = 'Fluoroscopic landmark catheters';

    const lcc = sourceCenter('lcc') || new THREE.Vector3(-0.06, 0.74, -0.08);
    const rcc = sourceCenter('rcc') || new THREE.Vector3(-0.30, 0.67, 0.18);
    const ncc = sourceCenter('ncc') || new THREE.Vector3(-0.36, 0.65, -0.14);
    const cs = sourceCenter('cs') || new THREE.Vector3(-0.03, -0.51, -0.68);

    const matPigtail = new THREE.MeshStandardMaterial({
      color: 0xffd60a,
      emissive: 0xd9a400,
      emissiveIntensity: 0.7,
      roughness: 0.25,
      metalness: 0.6,
      toneMapped: false
    });

    // Retrograde pigtail: descending aorta -> arch -> root, loop seated in the NCC.
    // The NCC abuts the interatrial septum; the pigtail marks the aortic root so the
    // transseptal needle stays posteroinferior to it.
    const archTop = new THREE.Vector3(aorta.x, aorta.y + 0.85, aorta.z);
    const rootAbove = new THREE.Vector3(ncc.x + 0.05, ncc.y + 0.55, ncc.z - 0.12);
    const pigtailPts = [
      new THREE.Vector3(aorta.x - 0.15, aorta.y + 1.10, aorta.z - 0.25),
      archTop,
      rootAbove
    ];
    // Pigtail loop: 1.25 turns of radius 0.085 in a plane just above the NCC
    const loopCenter = new THREE.Vector3(ncc.x, ncc.y + 0.10, ncc.z);
    const loopU = new THREE.Vector3(1, 0, 0);
    const loopV = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i <= 14; i++) {
      const a = -Math.PI / 2 + (i / 14) * Math.PI * 2.5;
      const r = 0.085;
      pigtailPts.push(
        loopCenter.clone()
          .addScaledVector(loopU, Math.cos(a) * r)
          .addScaledVector(loopV, Math.sin(a) * r)
          .add(new THREE.Vector3(0, -i * 0.004, 0))
      );
    }
    const pigtailCurve = new THREE.CatmullRomCurve3(pigtailPts);
    const pigtailMesh = makeTube(pigtailCurve, 0.020, matPigtail, 72);
    pigtailMesh.name = 'Pigtail catheter (seated in NCC)';
    landmarkGroup.add(pigtailMesh);

    // CS decapolar diagnostic catheter: IVC -> RA -> CS ostium -> distal CS
    const csOstium = new THREE.Vector3(-0.68, -0.45, -0.45);
    const csCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(ivc.x, ivc.y - 0.35, ivc.z),
      new THREE.Vector3(ivc.x + 0.02, ivc.y + 0.20, ivc.z + 0.05),
      new THREE.Vector3(ra.x + 0.15, ra.y - 0.35, ra.z - 0.15),
      csOstium,
      new THREE.Vector3(cs.x - 0.25, cs.y - 0.02, cs.z - 0.10),
      new THREE.Vector3(cs.x + 0.35, cs.y + 0.05, cs.z - 0.20)
    ]);
    const csMesh = makeTube(csCurve, 0.018, matSheath, 64);
    csMesh.name = 'CS decapolar diagnostic catheter';
    landmarkGroup.add(csMesh);

    // Decapolar electrode rings along the distal CS segment
    for (let i = 0; i < 10; i++) {
      const u = 0.62 + (i / 9) * 0.36;
      const pt = csCurve.getPointAt(u);
      const tangent = csCurve.getTangentAt(u).normalize();
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.018, 10), matNeedle.clone());
      ring.position.copy(pt);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
      landmarkGroup.add(ring);
    }

    // Cusp identification markers: color-coded rings above each aortic cusp
    const cuspDefs = [
      { center: lcc, color: 0x30d158, name: 'LCC marker (green)' },
      { center: rcc, color: 0xff9f0a, name: 'RCC marker (orange)' },
      { center: ncc, color: 0x00f2fe, name: 'NCC marker (cyan, pigtail seat)' }
    ];
    for (const def of cuspDefs) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.075, 0.011, 8, 28),
        new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.9 })
      );
      ring.position.copy(def.center).add(new THREE.Vector3(0, 0.05, 0));
      ring.rotation.x = Math.PI / 2;
      ring.name = def.name;
      landmarkGroup.add(ring);
    }

    group.add(landmarkGroup);
    stages.landmarks = landmarkGroup;

    // -------------------------------------------------------------
    // 3. Crossing: needle through fossa, guidewire toward LSPV
    // -------------------------------------------------------------
    const crossGroup = new THREE.Group();
    crossGroup.name = 'Transseptal crossing';

    const laDepth = fossa.clone().addScaledVector(septalNormal, 0.30);
    const lspv = new THREE.Vector3(la.x + 0.62, la.y + 0.28, la.z - 0.10);
    const crossCurve = new THREE.CatmullRomCurve3([
      raSideStandoff.clone(),
      fossa.clone(),
      laDepth,
      new THREE.Vector3((laDepth.x + lspv.x) / 2, (laDepth.y + lspv.y) / 2 + 0.08, (laDepth.z + lspv.z) / 2),
      lspv
    ]);
    crossGroup.add(makeProgressiveTube('cross', crossCurve, 0.013, matWire));

    const punctureDot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 14, 14), matTarget.clone());
    punctureDot.position.copy(fossa);
    punctureDot.name = 'Septal puncture point';
    crossGroup.add(punctureDot);

    group.add(crossGroup);
    stages.cross = crossGroup;

    // -------------------------------------------------------------
    // 4. Balloon atrial septostomy (static balloon across the IAS)
    // -------------------------------------------------------------
    const balloonGroup = new THREE.Group();
    balloonGroup.name = 'Balloon atrial septostomy';

    const shaftCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(ivc.x + 0.02, ivc.y + 0.25, ivc.z + 0.12),
      midRa.clone(),
      raSideStandoff.clone(),
      fossa.clone().addScaledVector(septalNormal, 0.16)
    ]);
    balloonGroup.add(makeTube(shaftCurve, 0.018, matSheath, 40));

    const balloonMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 22), matBalloon);
    balloonMesh.position.copy(fossa).addScaledVector(septalNormal, 0.02);
    balloonMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), septalNormal);
    balloonMesh.name = 'Septostomy balloon';
    balloonGroup.add(balloonMesh);

    // Waist ring where the septum grips the inflating balloon
    const waist = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.016, 10, 30), matLimbus.clone());
    waist.position.copy(fossa).addScaledVector(septalNormal, 0.02);
    waist.lookAt(facing);
    waist.name = 'Balloon waist at IAS';
    balloonGroup.add(waist);

    balloonState = { mesh: balloonMesh, waist };

    group.add(balloonGroup);
    stages.balloon = balloonGroup;

    // Schematic overlay must stay legible through the translucent chamber walls:
    // draw after the atlas meshes and skip depth writes on transparent parts.
    group.traverse(obj => {
      if (!obj.isMesh) return;
      obj.renderOrder = 4;
      if (obj.material.transparent) obj.material.depthWrite = false;
    });

    initialized = true;
    updateGeometry();
  }

  function updateGeometry() {
    if (!initialized) return;
    const t = Math.max(0.05, Math.min(1.0, currentProgress));

    for (const record of Object.values(progressive)) {
      const totalPoints = 56;
      const numPoints = Math.max(4, Math.floor(totalPoints * t));
      const sampled = [];
      for (let i = 0; i <= numPoints; i++) {
        sampled.push(record.curve.getPointAt((i / numPoints) * t));
      }
      const subCurve = new THREE.CatmullRomCurve3(sampled);
      record.mesh.geometry.dispose();
      record.mesh.geometry = new THREE.TubeGeometry(subCurve, numPoints * 2, record.radius, 8, false);
    }

    if (balloonState) {
      // Inflation: radius grows with progress, waist stays pinched at the septum
      const inflate = 0.05 + 0.20 * t;
      balloonState.mesh.scale.set(inflate, inflate, inflate * 1.5);
      balloonState.waist.scale.setScalar(0.4 + 0.6 * t);
    }
  }

  function setProgress(progress) {
    init();
    currentProgress = Number(progress);
    updateGeometry();
  }

  function setStep(stepIndex) {
    init();
    const idx = Number(stepIndex);
    // 0: femoral access route, 1: positioning & tenting, 2: crossing, 3: septostomy
    const visibilityMap = {
      0: { ias: true, access: true, puncture: false, cross: false, balloon: false, landmarks: false },
      1: { ias: true, access: false, puncture: true, cross: false, balloon: false, landmarks: true },
      2: { ias: true, access: false, puncture: false, cross: true, balloon: false, landmarks: true },
      3: { ias: true, access: false, puncture: false, cross: false, balloon: true, landmarks: false }
    };
    const config = visibilityMap[idx] || visibilityMap[0];
    for (const [key, stageGroup] of Object.entries(stages)) {
      stageGroup.visible = Boolean(config[key]);
    }
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
    setProgress,
    stages
  };
}

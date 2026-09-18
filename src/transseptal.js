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
  const { sourceCenter, meshVertices = () => [] } = helpers;
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
  let activeStep = 0;
  const catheterToggles = { pigtail: true, cs: true };

  function makeTube(curve, radius, material, segments = 48) {
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 8, false), material.clone());
    return mesh;
  }

  function makeProgressiveTube(key, curve, radius, material) {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material.clone());
    progressive[key] = { curve, radius, mesh, tip: null };
    return mesh;
  }

  // Slice vertices along one axis and average each slice; drops sparse end slices.
  function meshCenterline(points, axisValue, step, minCount = 15) {
    const bins = new Map();
    for (const v of points) {
      const key = Math.round(axisValue(v) / step);
      if (!bins.has(key)) bins.set(key, []);
      bins.get(key).push(v);
    }
    return [...bins.values()]
      .filter(list => list.length >= minCount)
      .map(list => list.reduce((sum, v) => sum.add(v), new THREE.Vector3()).multiplyScalar(1 / list.length));
  }

  function init() {
    if (initialized) return;

    const ra = sourceCenter('ra') || new THREE.Vector3(-1.03, 0.13, 0.12);
    const la = sourceCenter('la') || new THREE.Vector3(-0.05, 0.27, -0.37);
    const svc = sourceCenter('svc') || new THREE.Vector3(-1.08, 1.89, -0.16);
    const ivc = sourceCenter('ivc') || new THREE.Vector3(-0.85, -0.65, -0.35);

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
    iasGroup.userData.projectionTissue = true;

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
    // Aortic mound: RA-side septal wall between the NCC and the fossa (anterosuperior puncture risk)
    const nccCenter = sourceCenter('ncc') || new THREE.Vector3(-0.36, 0.65, -0.14);
    const aorticDanger = new THREE.Mesh(new THREE.SphereGeometry(0.06, 18, 18), matDanger.clone());
    aorticDanger.position.copy(nccCenter).lerp(fossa, 0.45);
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
    const pigtailGroup = new THREE.Group();
    pigtailGroup.name = 'Aortic pigtail catheter';
    pigtailGroup.userData.fluoroTint = 0x8a6a00; // dark amber under multiply projection
    const csGroup = new THREE.Group();
    csGroup.name = 'CS diagnostic catheter';
    csGroup.userData.fluoroTint = 0x1c3f8f; // dark blue under multiply projection

    const lcc = sourceCenter('lcc') || new THREE.Vector3(-0.06, 0.74, -0.08);
    const rcc = sourceCenter('rcc') || new THREE.Vector3(-0.30, 0.67, 0.18);
    const ncc = sourceCenter('ncc') || new THREE.Vector3(-0.36, 0.65, -0.14);

    const matPigtail = new THREE.MeshStandardMaterial({
      color: 0xffd60a,
      emissive: 0xd9a400,
      emissiveIntensity: 0.7,
      roughness: 0.25,
      metalness: 0.6,
      toneMapped: false
    });

    // Catheter paths follow centerlines extracted from the atlas vessel meshes, so the
    // pigtail stays inside the aortic lumen and the decapolar sits inside the CS.
    // Fallback centerlines are the same values measured once from the loaded atlas.
    const archLine = meshCenterline(meshVertices('aorta', /arch/i), v => v.z, 0.2)
      .sort((a, b) => a.z - b.z);
    const ascLine = meshCenterline(meshVertices('aorta', /ascending/i), v => v.y, 0.2)
      .sort((a, b) => b.y - a.y);
    const csLine = meshCenterline(meshVertices('cs'), v => v.x, 0.1)
      .sort((a, b) => a.x - b.x);

    const arch = archLine.length >= 4 ? archLine : [
      [-0.09, 2.13, -1.79], [-0.11, 2.28, -1.59], [-0.07, 2.23, -1.39], [-0.11, 2.33, -1.19],
      [-0.10, 2.44, -1.00], [-0.15, 2.50, -0.80], [-0.19, 2.52, -0.59], [-0.32, 2.35, -0.39],
      [-0.32, 2.27, -0.21], [-0.32, 2.33, 0.00], [-0.39, 2.28, 0.20], [-0.43, 2.13, 0.39]
    ].map(a => new THREE.Vector3(...a));
    const ascending = (ascLine.length >= 4 ? ascLine : [
      [-0.49, 1.79, 0.08], [-0.47, 1.59, 0.08], [-0.42, 1.41, 0.10], [-0.31, 1.21, -0.03],
      [-0.26, 1.00, -0.02], [-0.32, 0.80, 0.01]
    ].map(a => new THREE.Vector3(...a)));
    const csCenter = csLine.length >= 4 ? csLine : [
      [-0.76, -0.36, -0.27], [-0.70, -0.41, -0.30], [-0.61, -0.47, -0.32], [-0.50, -0.60, -0.37],
      [-0.40, -0.70, -0.48], [-0.31, -0.74, -0.58], [-0.21, -0.76, -0.71], [-0.10, -0.76, -0.82],
      [0.00, -0.74, -0.90], [0.10, -0.71, -0.97], [0.20, -0.65, -1.03], [0.30, -0.60, -1.07],
      [0.40, -0.52, -1.10], [0.50, -0.42, -1.10], [0.59, -0.32, -1.09]
    ].map(a => new THREE.Vector3(...a));

    // Retrograde pigtail: femoral artery -> descending aorta (below the atlas cut)
    // -> arch -> ascending aorta -> loop seated in the non-coronary sinus.
    // The NCC abuts the interatrial septum; the pigtail marks the aortic root so the
    // transseptal needle stays posteroinferior to it.
    const rootCenter = lcc.clone().add(rcc).add(ncc).multiplyScalar(1 / 3);
    const toNcc = ncc.clone().sub(rootCenter).setY(0).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const loopSide = new THREE.Vector3().crossVectors(up, toNcc).normalize();
    const loopRadius = 0.085;
    const loopCenter = rootCenter.clone().addScaledVector(toNcc, 0.13).setY(ncc.y);

    const descendingEnd = arch[0];
    const pigtailPts = [
      descendingEnd.clone().add(new THREE.Vector3(0, -0.9, -0.05)),
      descendingEnd.clone().add(new THREE.Vector3(0, -0.4, -0.02)),
      ...arch.map(v => v.clone()),
      ...ascending.filter(v => v.y > loopCenter.y + 0.25).map(v => v.clone()),
      loopCenter.clone().addScaledVector(up, loopRadius + 0.08)
    ];
    // 1.3 turns in a vertical plane facing the NCC (en face in LAO, edge-on in RAO), curling at the sinus floor
    for (let i = 0; i <= 18; i++) {
      const a = Math.PI / 2 + (i / 18) * Math.PI * 2.6;
      const r = loopRadius * (1 - i * 0.012);
      pigtailPts.push(
        loopCenter.clone()
          .addScaledVector(loopSide, Math.cos(a) * r)
          .addScaledVector(up, Math.sin(a) * r)
      );
    }
    const pigtailCurve = new THREE.CatmullRomCurve3(pigtailPts);
    const pigtailMesh = makeTube(pigtailCurve, 0.018, matPigtail, 140);
    pigtailMesh.name = 'Pigtail catheter (seated in NCC)';
    pigtailGroup.add(pigtailMesh);

    // CS decapolar diagnostic catheter (femoral approach): IVC -> low RA ->
    // posteroinferior turn into the CS ostium -> along the CS centerline.
    const csOstium = csCenter[0];
    const csInward = csCenter[Math.min(2, csCenter.length - 1)].clone().sub(csOstium).normalize();
    const raLow = new THREE.Vector3(ra.x + 0.08, csOstium.y - 0.30, csOstium.z + 0.10);
    const csApproach = [
      new THREE.Vector3(raLow.x, raLow.y - 1.20, raLow.z - 0.10),
      new THREE.Vector3(raLow.x, raLow.y - 0.55, raLow.z - 0.05),
      raLow,
      csOstium.clone().addScaledVector(csInward, -0.12).add(new THREE.Vector3(0, 0.02, 0.03))
    ];
    const csCurve = new THREE.CatmullRomCurve3([...csApproach, ...csCenter.map(v => v.clone())]);
    const csMesh = makeTube(csCurve, 0.016, matSheath, 120);
    csMesh.name = 'CS decapolar diagnostic catheter';
    csGroup.add(csMesh);

    // Decapolar electrode rings (5 bipoles) on the portion inside the CS
    const csOnly = new THREE.CatmullRomCurve3(csCenter.map(v => v.clone()));
    for (let i = 0; i < 10; i++) {
      const u = 0.25 + Math.floor(i / 2) * 0.16 + (i % 2) * 0.04;
      const pt = csOnly.getPointAt(Math.min(u, 0.99));
      const tangent = csOnly.getTangentAt(Math.min(u, 0.99)).normalize();
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.016, 10), matNeedle.clone());
      ring.position.copy(pt);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
      csGroup.add(ring);
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
      pigtailGroup.add(ring);
    }

    group.add(pigtailGroup);
    stages.pigtail = pigtailGroup;
    group.add(csGroup);
    stages.cs = csGroup;

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

    // Dumbbell profile: RA and LA lobes with the waist pinched by the septal rim.
    // Lathe axis is +Y; the mesh is rotated so the axis runs along the septal normal.
    const profile = [];
    const balloonHalfLen = 0.24;
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      const lobe = Math.sin(u * Math.PI) ** 0.8;
      const pinch = 1 - 0.72 * Math.exp(-((u - 0.5) ** 2) / 0.012);
      const radius = Math.max(0.012, 0.17 * lobe * pinch);
      profile.push(new THREE.Vector2(radius, (u - 0.5) * 2 * balloonHalfLen));
    }
    const balloonMesh = new THREE.Mesh(new THREE.LatheGeometry(profile, 30), matBalloon);
    balloonMesh.position.copy(fossa).addScaledVector(septalNormal, 0.02);
    balloonMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), septalNormal);
    balloonMesh.name = 'Septostomy balloon (dumbbell, waist at IAS)';
    balloonGroup.add(balloonMesh);

    // Catheter shaft continuing through the balloon to a soft distal tip in the LA
    const throughShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, balloonHalfLen * 2 + 0.22, 10),
      matSheath.clone()
    );
    throughShaft.position.copy(balloonMesh.position);
    throughShaft.quaternion.copy(balloonMesh.quaternion);
    balloonGroup.add(throughShaft);

    balloonState = { mesh: balloonMesh };

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
      // Inflation: lobes grow radially with progress, length changes little;
      // the waist stays pinched because it is part of the lathe profile.
      const radial = 0.15 + 0.85 * t;
      const axial = 0.6 + 0.4 * t;
      balloonState.mesh.scale.set(radial, axial, radial);
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
      0: { ias: true, access: true, puncture: false, cross: false, balloon: false, pigtail: false, cs: false },
      1: { ias: true, access: false, puncture: true, cross: false, balloon: false, pigtail: true, cs: true },
      2: { ias: true, access: false, puncture: false, cross: true, balloon: false, pigtail: true, cs: true },
      3: { ias: true, access: false, puncture: false, cross: false, balloon: true, pigtail: false, cs: false }
    };
    activeStep = idx;
    const config = visibilityMap[idx] || visibilityMap[0];
    for (const [key, stageGroup] of Object.entries(stages)) {
      const userAllows = key in catheterToggles ? catheterToggles[key] : true;
      stageGroup.visible = Boolean(config[key]) && userAllows;
    }
  }

  // User overrides for the landmark catheters; ANDed with the step visibility.
  function setCatheterVisible(key, visible) {
    if (!(key in catheterToggles)) return;
    catheterToggles[key] = Boolean(visible);
    if (initialized) setStep(activeStep);
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
    setCatheterVisible,
    stages
  };
}

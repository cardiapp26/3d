import * as THREE from 'three';
import { sharedRim, nearestLoop } from './mesh-utils.js';

/**
 * Procedural 3D Clinical Electrophysiology (EP) Landmarks and Ablation Targets.
 * Grounded in standard clinical EP practice (CTI line, Triangle of Koch, WACA/PVI rings).
 * Anchor points are measured from the atlas meshes (vein ostia, leaflet hinges,
 * CS ostium) instead of hand-tuned constants.
 */
export function createEPLandmarks(helpers) {
  const { sourceCenter, meshVertices = () => [], getMeshes = () => [] } = helpers;
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
    // Compact AV node, measured at the Koch apex by the conduction system.
    const av = sourceCenter('av') || new THREE.Vector3(-0.72, 0.25, -0.02);

    // Measured anchors -------------------------------------------------
    // Ostia come from mesh boundary loops (the actual open rims), the
    // tricuspid ring from the RA/RV shared orifice rim.
    const ivcLoop = nearestLoop(getMeshes('ivc')[0], ra);
    const ivcOs = ivcLoop ? ivcLoop.center.clone() : (nearEndCentroid(meshVertices('ivc'), ra) || new THREE.Vector3(-0.85, -0.65, -0.35));
    const csLoop = nearestLoop(getMeshes('cs')[0], ra);
    const csOs = csLoop ? csLoop.center.clone() : (nearEndCentroid(meshVertices('cs'), ra) || new THREE.Vector3(-0.70, -0.41, -0.30));

    const tvRim = sharedRim(getMeshes('ra')[0], getMeshes('rv')[0]);
    // Inferior tricuspid hinge: rim point nearest the IVC ostium.
    let tvInferior = new THREE.Vector3(-0.75, -0.75, 0.0);
    // Septal tricuspid hinge: rim point nearest the left heart (septal side).
    let septalHinge = new THREE.Vector3(-0.45, -0.20, 0.05);
    if (tvRim) {
      tvInferior = tvRim.reduce((best, v) => v.distanceTo(ivcOs) < best.distanceTo(ivcOs) ? v : best).clone();
      septalHinge = tvRim.reduce((best, v) => v.distanceTo(la) < best.distanceTo(la) ? v : best).clone();
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
    // 2. Triangle of Koch (AVNRT)
    //    Base: CS ostium. Posterosuperior side: tendon of Todaro (continuation
    //    of the Eustachian ridge). Anterior side: hinge of the septal tricuspid
    //    leaflet. Apex: compact AV node. Fast pathway: superior, next to
    //    Todaro near the apex (danger). Slow pathway: inferior, between the CS
    //    ostium and the septal leaflet (target).
    // -------------------------------------------------------------
    const kochGroup = new THREE.Group();
    kochGroup.name = 'Triangle of Koch';

    const tag = (mesh, pickId, name) => {
      mesh.name = name;
      mesh.userData = { pickId, provenance: 'schematic', sourceName: name };
      return mesh;
    };
    // Lift points off the wall toward the RA cavity so the overlay stays visible.
    const lift = v => v.clone().lerp(ra, 0.05);

    const apexPt = av.clone();
    // Septal hinge = orifice-rim arc from the CS-ostium end to the apex.
    let hingeArc = [septalHinge.clone(), apexPt.clone()];
    let baseAnterior = septalHinge.clone();
    if (tvRim && tvRim.length > 8) {
      const nearest = target => tvRim.reduce((bi, v, i) => v.distanceTo(target) < tvRim[bi].distanceTo(target) ? i : bi, 0);
      const iBase = nearest(csOs);
      const iApex = nearest(apexPt);
      const n = tvRim.length;
      const forward = (iApex - iBase + n) % n;
      const backward = (iBase - iApex + n) % n;
      const step = forward <= backward ? 1 : -1;
      const count = Math.min(forward, backward);
      hingeArc = [];
      for (let k = 0; k <= count; k++) hingeArc.push(tvRim[(iBase + step * k + n) % n].clone());
      hingeArc[hingeArc.length - 1] = apexPt.clone();
      baseAnterior = hingeArc[0].clone();
    }
    // Posterior base corner: CS-ostium rim point farthest from the tricuspid
    // annulus (the lip the Eustachian ridge / Todaro rises from).
    const csRim = csLoop ? csLoop.pts : [csOs.clone()];
    const basePosterior = csRim.reduce((best, v) => {
      const d = Math.min(...(tvRim || [septalHinge]).map(r => r.distanceTo(v)));
      return d > best.d ? { v, d } : best;
    }, { v: csOs.clone(), d: -1 }).v.clone();

    // Todaro: from the posterior base corner up to the apex, bowed away from
    // the hinge side (posterosuperior border of the triangle).
    const hingeMid = hingeArc[Math.floor(hingeArc.length / 2)];
    const todaroMid = basePosterior.clone().lerp(apexPt, 0.5);
    todaroMid.add(todaroMid.clone().sub(hingeMid).setLength(0.05));
    const todaroCurve = new THREE.CatmullRomCurve3([basePosterior, todaroMid, apexPt].map(lift));
    const hingeCurve = new THREE.CatmullRomCurve3(hingeArc.map(lift));
    const baseCurve = new THREE.CatmullRomCurve3([baseAnterior, csOs, basePosterior].map(lift));

    const matTodaro = new THREE.MeshStandardMaterial({ color: 0xf1ede2, emissive: 0x6b6450, emissiveIntensity: 0.35, roughness: 0.5 });
    const matHinge = new THREE.MeshStandardMaterial({ color: 0x61d6e8, emissive: 0x1b8fa3, emissiveIntensity: 0.5, roughness: 0.4 });
    const matBase = new THREE.MeshStandardMaterial({ color: 0x4bd18a, emissive: 0x1d8a52, emissiveIntensity: 0.5, roughness: 0.4 });
    kochGroup.add(tag(new THREE.Mesh(new THREE.TubeGeometry(todaroCurve, 32, 0.017, 8, false), matTodaro), 'koch-todaro', 'Tendon of Todaro'));
    kochGroup.add(tag(new THREE.Mesh(new THREE.TubeGeometry(hingeCurve, 40, 0.015, 8, false), matHinge), 'tricuspid-septal', 'Septal tricuspid hinge (Koch side)'));
    kochGroup.add(tag(new THREE.Mesh(new THREE.TubeGeometry(baseCurve, 20, 0.014, 8, false), matBase), 'koch-base', 'CS ostium (Koch base)'));

    // Translucent triangle fill: fan from the apex over hinge + base + Todaro.
    const outline = [
      ...hingeCurve.getPoints(24),
      ...baseCurve.getPoints(12).slice(1),
      ...todaroCurve.getPoints(24).slice(1)
    ];
    const fillPos = [];
    const apexLift = lift(apexPt);
    for (let i = 0; i < outline.length - 1; i++) {
      fillPos.push(...apexLift.toArray(), ...outline[i].toArray(), ...outline[i + 1].toArray());
    }
    const fillGeom = new THREE.BufferGeometry();
    fillGeom.setAttribute('position', new THREE.Float32BufferAttribute(fillPos, 3));
    fillGeom.computeVertexNormals();
    const fill = new THREE.Mesh(fillGeom, new THREE.MeshBasicMaterial({
      color: 0x7fe3ee, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false
    }));
    kochGroup.add(tag(fill, 'koch-triangle', 'Triangle of Koch'));

    // Compact AV node at the apex (do not ablate: complete heart block).
    const avDanger = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 18), matDanger);
    avDanger.position.copy(apexLift);
    kochGroup.add(tag(avDanger, 'koch-avnode', 'Compact AV node (Koch apex)'));

    // Fast pathway: superior zone along Todaro just below the apex (danger).
    const fastCenter = lift(todaroCurve.getPointAt(0.78).lerp(hingeCurve.getPointAt(0.85), 0.25));
    const fastZone = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), new THREE.MeshStandardMaterial({
      color: 0xff9f0a, emissive: 0xff7a00, emissiveIntensity: 0.8, roughness: 0.3, transparent: true, opacity: 0.9
    }));
    fastZone.position.copy(fastCenter);
    kochGroup.add(tag(fastZone, 'koch-fast', 'Fast pathway (danger zone)'));

    // Slow pathway: inferior zone between the CS ostium and the septal
    // leaflet, just above the base (ablation target).
    const slowPathwayCenter = lift(baseAnterior.clone().lerp(csOs, 0.45).lerp(apexPt, 0.18));
    const slowTarget = new THREE.Mesh(new THREE.SphereGeometry(0.045, 18, 18), matSafeTarget);
    slowTarget.position.copy(slowPathwayCenter);
    kochGroup.add(tag(slowTarget, 'koch-slow', 'Slow pathway (ablation target)'));

    // RF lesion cluster at the slow pathway, spread along the hinge direction.
    const axis = apexPt.clone().sub(baseAnterior).normalize();
    const side = new THREE.Vector3().crossVectors(axis, csOs.clone().sub(baseAnterior)).cross(axis).normalize();
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const rf = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 12), matLesion.clone());
      rf.position.copy(slowPathwayCenter)
        .addScaledVector(axis, Math.cos(angle) * 0.04)
        .addScaledVector(side, Math.sin(angle) * 0.04);
      kochGroup.add(tag(rf, 'koch-slow', 'Slow pathway RF lesion'));
    }

    group.add(kochGroup);
    targets.koch = kochGroup;

    // -------------------------------------------------------------
    // 3. Wide Area Circumferential Ablation (WACA / PVI Rings) - AF
    // -------------------------------------------------------------
    const pviGroup = new THREE.Group();
    pviGroup.name = 'PVI / WACA Rings';

    // Measured PV ostia: each vein's boundary loop nearest the LA centroid.
    const ostium = pattern => {
      const mesh = getMeshes('pv').find(m => pattern.test(m.name));
      const loop = mesh ? nearestLoop(mesh, la) : null;
      if (loop) return loop.center.clone();
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

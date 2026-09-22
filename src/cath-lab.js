import * as THREE from 'three';
import { centroid, sharedRim, nearestLoop, inferiorCavalOstium } from './mesh-utils.js';

/**
 * Procedural 3D cardiac catheterization lab (Netter-style teaching module).
 * Right heart catheter (Swan-Ganz): femoral vein -> IVC -> RA -> RV -> PA,
 * with a wedge balloon at full advancement. Left heart catheter: retrograde
 * femoral artery -> aorta -> across the aortic valve into the LV.
 * Measurement stations carry pickIds that open pressure/saturation content.
 */
export function createCathLab(helpers) {
  const { sourceCenter, meshVertices = () => [], getMeshes = () => [], isReady = () => true } = helpers;
  const group = new THREE.Group();
  group.name = 'Catheterization Lab';
  group.visible = false;

  const matRight = new THREE.MeshStandardMaterial({
    color: 0xf2b93b,
    emissive: 0xb07f10,
    emissiveIntensity: 0.55,
    roughness: 0.3,
    metalness: 0.4,
    toneMapped: false
  });

  const matLeft = new THREE.MeshStandardMaterial({
    color: 0xe25f6b,
    emissive: 0xa42837,
    emissiveIntensity: 0.55,
    roughness: 0.3,
    metalness: 0.4,
    toneMapped: false
  });

  const matBalloon = new THREE.MeshStandardMaterial({
    color: 0xf7e6a1,
    roughness: 0.25,
    transparent: true,
    opacity: 0.85
  });

  const stages = {};
  const progressive = {};
  let initialized = false;
  let currentProgress = 1;
  let activeStep = 0;
  let wedgeBalloon = null;
  let rightStepStops = { ra: 1, rv: 1 };

  function meshCenterline(points, axisValue, step, minCount = 15) {
    const bins = new Map();
    for (const v of points) {
      const key = Math.round(axisValue(v) / step);
      if (!bins.has(key)) bins.set(key, []);
      bins.get(key).push(v);
    }
    return [...bins.values()]
      .filter(list => list.length >= minCount)
      .map(list => list.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / list.length));
  }

  function smoothPolyline(points, passes = 3) {
    let pts = points;
    for (let pass = 0; pass < passes; pass++) {
      pts = pts.map((pt, i) => {
        if (i === 0 || i === pts.length - 1) return pt.clone();
        return pt.clone().multiplyScalar(2).add(pts[i - 1]).add(pts[i + 1]).multiplyScalar(0.25);
      });
    }
    return pts;
  }

  function progressiveTube(key, curve, radius, material) {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material.clone());
    progressive[key] = { curve, radius, mesh };
    return mesh;
  }

  function namedVesselCenter(id, name, fallback) {
    const mesh = getMeshes(id).find(item => item.name === name);
    return mesh ? new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3()) : fallback;
  }

  function station(pos, pickId, name, side) {
    const holder = new THREE.Group();
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 16, 16),
      new THREE.MeshBasicMaterial({ color: side === 'right' ? 0x2e86c8 : 0xd8404f })
    );
    dot.position.copy(pos);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.085, 0.011, 8, 26),
      new THREE.MeshBasicMaterial({ color: side === 'right' ? 0x7cc0ea : 0xef8f99, transparent: true, opacity: 0.85 })
    );
    ring.position.copy(pos);
    ring.rotation.x = Math.PI / 2;
    for (const m of [dot, ring]) {
      m.name = name;
      m.userData = { pickId, provenance: 'schematic', sourceName: name };
      holder.add(m);
    }
    return holder;
  }

  function init() {
    // Anchors are measured from atlas meshes: never build before the atlas
    // loads, or every anchor freezes on its fallback constant.
    if (initialized || !isReady()) return;

    const ra = sourceCenter('ra') || new THREE.Vector3(-1.03, 0.13, 0.12);
    const rv = sourceCenter('rv') || new THREE.Vector3(-0.4, -0.9, 0.5);
    const lv = sourceCenter('lv') || new THREE.Vector3(0.65, -0.75, 0.05);
    const pv = sourceCenter('pulmonary-valve') || new THREE.Vector3(0.1, 0.55, 0.55);
    const lcc = sourceCenter('lcc') || new THREE.Vector3(-0.06, 0.74, -0.08);
    const ncc = sourceCenter('ncc') || new THREE.Vector3(-0.36, 0.65, -0.14);
    const ivcLoop = nearestLoop(getMeshes('ivc')[0], ra);
    const ivcOs = ivcLoop ? ivcLoop.center.clone()
      : (inferiorCavalOstium(getMeshes('ra')[0]) || new THREE.Vector3(-1.05, -0.93, -0.39));
    const tvRim = sharedRim(getMeshes('ra')[0], getMeshes('rv')[0]);
    const tvCenter = tvRim ? centroid(tvRim) : new THREE.Vector3(-0.92, -0.18, 0.14);
    // The PA atlas id spans trunk and both branches; its combined box center is not in the trunk.
    const paTrunk = namedVesselCenter('pa', 'Pulmonary trunk', new THREE.Vector3(0.14, 1.38, 0.54));
    const paBifurcation = namedVesselCenter('pa', 'Bifurcation of pulmonary trunk',
      new THREE.Vector3(0.07, 1.51, -0.31));
    const lpaVerts = meshVertices('pa', /Left pulmonary/i);
    const lpaLine = meshCenterline(lpaVerts, v => v.x, 0.2).sort((a, b) => a.x - b.x);
    const distalBranchIndex = Math.min(Math.round(lpaLine.length * 0.7), lpaLine.length - 1);
    const branchPath = lpaLine.length
      ? lpaLine.slice(0, distalBranchIndex + 1).map(point => point.clone())
      : [new THREE.Vector3(1.25, 0.55, -1.55)];
    const paTarget = branchPath[branchPath.length - 1].clone();

    // -------------------------------------------------------------
    // Right heart catheter: femoral vein -> IVC -> RA -> TV -> RV -> PA.
    // -------------------------------------------------------------
    const rhcGroup = new THREE.Group();
    rhcGroup.name = 'Right heart catheter (Swan-Ganz)';
    rhcGroup.userData.fluoroTint = 0x8a6a00;

    const rvBody = rv.clone().add(new THREE.Vector3(0.10, -0.5, 0.10));
    const rvOutflow = rv.clone().lerp(pv, 0.55);
    const rhcPts = [
      ivcOs.clone().add(new THREE.Vector3(0, -1.2, -0.05)),
      ivcOs.clone().add(new THREE.Vector3(0, -0.5, 0)),
      ivcOs.clone(),
      ra.clone(),
      tvCenter.clone(),
      rvBody,
      rvOutflow,
      pv.clone(),
      paTrunk.clone(),
      paBifurcation.clone(),
      ...branchPath
    ];
    const rhcCurve = new THREE.CatmullRomCurve3(rhcPts, false, 'centripetal');
    const fractionAt = target => {
      let best = { fraction: 0, distance: Infinity };
      for (let i = 0; i <= 256; i++) {
        const fraction = i / 256;
        const distance = rhcCurve.getPointAt(fraction).distanceToSquared(target);
        if (distance < best.distance) best = { fraction, distance };
      }
      return best.fraction;
    };
    rightStepStops = { ra: fractionAt(ra), rv: fractionAt(rvBody) };
    const rightCatheter = progressiveTube('rhc', rhcCurve, 0.02, matRight);
    rightCatheter.name = 'Swan-Ganz catheter route';
    rhcGroup.add(rightCatheter);

    // Wedge balloon at the catheter tip (shown when fully advanced).
    wedgeBalloon = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 18), matBalloon);
    wedgeBalloon.position.copy(paTarget);
    wedgeBalloon.name = 'Distal PA balloon target (schematic)';
    wedgeBalloon.userData = { pickId: 'cath-wedge', provenance: 'schematic', sourceName: 'Distal PA balloon target' };
    wedgeBalloon.visible = false;
    rhcGroup.add(wedgeBalloon);

    rhcGroup.add(station(ra.clone().add(new THREE.Vector3(0.1, 0, 0)), 'cath-ra', 'RA measurement station', 'right'));
    rhcGroup.add(station(rvBody.clone(), 'cath-rv', 'RV measurement station', 'right'));
    rhcGroup.add(station(paTrunk.clone(), 'cath-pa', 'PA measurement station', 'right'));
    rhcGroup.add(station(paTarget.clone(), 'cath-wedge', 'Distal PA balloon target', 'right'));

    group.add(rhcGroup);
    stages.rhc = rhcGroup;

    // -------------------------------------------------------------
    // Left heart catheter: retrograde aorta -> across the valve -> LV.
    // -------------------------------------------------------------
    const lhcGroup = new THREE.Group();
    lhcGroup.name = 'Left heart catheter (retrograde)';
    lhcGroup.userData.fluoroTint = 0x7a1f2c;

    const archLine = meshCenterline(meshVertices('aorta', /arch/i), v => v.z, 0.2).sort((a, b) => a.z - b.z);
    const ascLine = meshCenterline(meshVertices('aorta', /ascending/i), v => v.y, 0.2).sort((a, b) => b.y - a.y);
    const valveCenter = lcc.clone().add(ncc).multiplyScalar(0.5);
    const arch = archLine.length >= 4 ? archLine : [new THREE.Vector3(-0.1, 2.3, -1.6), new THREE.Vector3(-0.3, 2.3, -0.2)];
    const asc = ascLine.length >= 3 ? ascLine.filter(v => v.y > valveCenter.y + 0.2) : [new THREE.Vector3(-0.45, 1.6, 0.08)];
    const lhcPts = smoothPolyline([
      arch[0].clone().add(new THREE.Vector3(0, -0.9, -0.05)),
      arch[0].clone().add(new THREE.Vector3(0, -0.4, -0.02)),
      ...arch.map(v => v.clone()),
      ...asc.map(v => v.clone()),
      valveCenter.clone(),
      valveCenter.clone().lerp(lv, 0.45)
    ], 2);
    const lhcCurve = new THREE.CatmullRomCurve3(lhcPts);
    lhcGroup.add(progressiveTube('lhc', lhcCurve, 0.018, matLeft));

    lhcGroup.add(station(valveCenter.clone().add(new THREE.Vector3(0, 0.35, 0)), 'cath-ao', 'Aortic measurement station', 'left'));
    lhcGroup.add(station(valveCenter.clone().lerp(lv, 0.45), 'cath-lv', 'LV measurement station', 'left'));

    group.add(lhcGroup);
    stages.lhc = lhcGroup;

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
    const progress = Math.max(0.05, Math.min(1, currentProgress));
    for (const [key, record] of Object.entries(progressive)) {
      const stageStop = key === 'rhc'
        ? activeStep === 0 ? rightStepStops.ra : activeStep === 1 ? rightStepStops.rv : 1
        : 1;
      const t = progress * stageStop;
      const totalPoints = 64;
      const numPoints = Math.max(4, Math.floor(totalPoints * t));
      const sampled = [];
      for (let i = 0; i <= numPoints; i++) sampled.push(record.curve.getPointAt((i / numPoints) * t));
      record.mesh.geometry.dispose();
      record.mesh.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sampled), numPoints * 2, record.radius, 8, false);
    }
    // Wedge balloon inflates only when the RHC is fully advanced on the wedge step.
    if (wedgeBalloon) wedgeBalloon.visible = activeStep === 2 && currentProgress >= 0.99;
  }

  function setProgress(progress) {
    init();
    currentProgress = Number(progress);
    updateGeometry();
  }

  // Steps: 0 RA, 1 RV, 2 PA + wedge, 3 left heart (LV/aorta), 4 oximetry overview.
  function setStep(stepIndex) {
    init();
    activeStep = Number(stepIndex);
    if (!initialized) return;
    const rightVisible = activeStep !== 3;
    const leftVisible = activeStep === 3 || activeStep === 4;
    stages.rhc.visible = rightVisible;
    stages.lhc.visible = leftVisible;
    updateGeometry();
  }

  function setVisible(visible) {
    if (visible) init();
    group.visible = Boolean(visible);
  }

  return { group, init, setVisible, setStep, setProgress, stages };
}

import * as THREE from 'three';
import { boundaryLoops, septalPairs, septalSiteNear as nearestSeptalSite, sharedRim } from './mesh-utils.js';

/**
 * Procedural 3D Pacemaker and Defibrillator Lead Models for Cardiac EP/CIED education.
 * Accurately models:
 * - RA lead (SVC -> Right Atrial Appendage)
 * - RV lead (SVC -> RA -> Tricuspid Valve -> RV Septum/Apex)
 * - CSP / LBBAP lead (His bundle / deep septal Left Bundle Branch Area Pacing)
 * - CRT CS LV lead (Coronary Sinus ostium, along the sinus, into the posterior LV vein)
 * Includes active-fixation helical tips, radiopaque bipolar/quadripolar electrodes,
 * and animated advancement progress (0..1).
 */
function axisOf(points) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const v of points) {
    minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
    minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
    minZ = Math.min(minZ, v.z); maxZ = Math.max(maxZ, v.z);
  }
  const sx = maxX - minX, sy = maxY - minY, sz = maxZ - minZ;
  if (sy >= sx && sy >= sz) return v => v.y;
  if (sz >= sx) return v => v.z;
  return v => v.x;
}

function meshCenterline(points, step = 0.12, minCount = 8) {
  if (!points || points.length < minCount) return [];
  const axisValue = axisOf(points);
  const bins = new Map();
  for (const v of points) {
    const key = Math.round(axisValue(v) / step);
    if (!bins.has(key)) bins.set(key, []);
    bins.get(key).push(v);
  }
  return [...bins.entries()]
    .filter(([, list]) => list.length >= minCount)
    .sort((a, b) => a[0] - b[0])
    .map(([, list]) => list.reduce((sum, v) => sum.add(v), new THREE.Vector3()).multiplyScalar(1 / list.length));
}

function closestDistance(point, cloud) {
  let best = Infinity;
  for (const other of cloud) best = Math.min(best, point.distanceTo(other));
  return best;
}

const FALLBACK_CS = [
  [-0.76, -0.36, -0.27], [-0.61, -0.47, -0.32], [-0.40, -0.70, -0.48],
  [-0.21, -0.76, -0.71], [0.00, -0.74, -0.90], [0.20, -0.65, -1.03], [0.40, -0.52, -1.10]
].map(v => new THREE.Vector3(...v));

const FALLBACK_PIV = [
  [-0.03, -0.51, -0.68], [0.40, -0.58, -0.58], [0.75, -0.68, -0.42]
].map(v => new THREE.Vector3(...v));

/** SVC to CS ostium, along the sinus only as far as the posterior LV vein, then into that vein. */
export function buildCrtPath({ entry, highSvc, ra, csPoints, pivPoints }) {
  const cs = (csPoints && csPoints.length >= 4 ? csPoints : FALLBACK_CS).map(p => p.clone());
  if (cs[cs.length - 1].distanceTo(ra) < cs[0].distanceTo(ra)) cs.reverse();
  let piv = (pivPoints && pivPoints.length >= 3 ? pivPoints : FALLBACK_PIV).map(p => p.clone());
  if (closestDistance(piv[piv.length - 1], cs) < closestDistance(piv[0], cs)) piv.reverse();
  const keep = Math.max(2, Math.round((piv.length - 1) * 0.72) + 1);
  piv = piv.slice(0, keep);

  let join = 0;
  let joinDist = Infinity;
  cs.forEach((point, index) => {
    const dist = point.distanceTo(piv[0]);
    if (dist < joinDist) {
      joinDist = dist;
      join = index;
    }
  });
  const csUsed = cs.slice(0, Math.max(join, 1) + 1);
  const ostium = csUsed[0];
  const approach = new THREE.Vector3(
    ostium.x + (ra.x - ostium.x) * 0.28,
    ostium.y + 0.22,
    ostium.z + (ra.z - ostium.z) * 0.35
  );
  const midSvc = new THREE.Vector3(
    (highSvc.x + ra.x) * 0.5,
    (highSvc.y + approach.y) * 0.5,
    (highSvc.z + ra.z) * 0.5
  );
  const raw = [entry, highSvc, midSvc, approach, ...csUsed, ...piv.slice(1)];
  const spaced = [];
  for (const point of raw) {
    if (!spaced.length || spaced[spaced.length - 1].distanceTo(point) > 0.05) spaced.push(point.clone());
  }
  return spaced;
}

export function createPacemakerLeads(helpers) {
  const { sourceCenter, meshVertices = () => [], getMeshes = () => [], getBachmannTarget, isReady = () => true } = helpers;
  const group = new THREE.Group();
  group.name = 'Pacemaker Leads';
  group.visible = false;

  // High-fidelity lead materials
  const matLeadBody = new THREE.MeshStandardMaterial({
    color: 0x26282c,
    roughness: 0.35,
    metalness: 0.75
  });

  const matElectrode = new THREE.MeshStandardMaterial({
    color: 0xe8eaed,
    roughness: 0.15,
    metalness: 0.95
  });

  const matTipHelix = new THREE.MeshStandardMaterial({
    color: 0xffd60a,
    roughness: 0.2,
    metalness: 0.9
  });

  const matIndicatorGlow = new THREE.MeshBasicMaterial({
    color: 0x00f2fe,
    transparent: true,
    opacity: 0.85
  });

  let initialized = false;
  let currentProgress = 1.0;
  let activeStep = 0;
  let activeLesson = 'pacemaker';

  // Definitions for lead trajectories
  let leadCurves = {};
  let leadMeshes = {};

  function init() {
    // Anchors are measured from atlas meshes: never build before the atlas
    // loads, or every anchor freezes on its fallback constant.
    if (initialized || !isReady()) return;

    // Anchor points from cardiac atlas mesh
    const svc = sourceCenter('svc') || new THREE.Vector3(-0.85, 1.25, -0.30);
    const ra = sourceCenter('ra') || new THREE.Vector3(-0.95, 0.35, 0.10);
    const rv = sourceCenter('rv') || new THREE.Vector3(0.05, -0.95, 0.50);

    const centroidOf = pts => pts.reduce((acc, v) => acc.add(v.clone()), new THREE.Vector3()).multiplyScalar(1 / pts.length);
    const raVerts = meshVertices('ra');
    const rvVerts = meshVertices('rv');
    const lvVerts = meshVertices('lv');
    const raCenter = raVerts.length ? centroidOf(raVerts) : ra.clone();
    const rvCenter = rvVerts.length ? centroidOf(rvVerts) : rv.clone();

    // Venous route: through the measured SVC openings into the RA.
    const svcLoops = getMeshes('svc')[0] ? boundaryLoops(getMeshes('svc')[0]) : [];
    const svcTop = svcLoops.length ? svcLoops.reduce((b, l) => l.center.y > b.center.y ? l : b).center.clone() : new THREE.Vector3(svc.x, svc.y + 0.4, svc.z);
    const svcOs = svcLoops.length ? svcLoops.reduce((b, l) => l.center.y < b.center.y ? l : b).center.clone() : new THREE.Vector3(svc.x, svc.y - 0.4, svc.z);
    const entryPt = svcTop.clone().add(new THREE.Vector3(0, 0.3, 0));
    const highSvc = svcOs.clone().lerp(svcTop, 0.35);
    const midRa = raCenter.clone().lerp(svcOs, 0.2);

    // Tricuspid crossing: centroid of the measured RA/RV orifice rim.
    const tvRim = sharedRim(getMeshes('ra')[0], getMeshes('rv')[0]);
    const tvCenter = tvRim ? centroidOf(tvRim) : (sourceCenter('tricuspid') || new THREE.Vector3(-0.45, -0.45, 0.15));

    // Interventricular septum: RV endocardial vertices with an LV vertex
    // within septal thickness; each pair spans the septum RV side -> LV side.
    const septum = septalPairs(rvVerts, lvVerts);
    const septalSiteNear = target => nearestSeptalSite(septum, target);
    // Active-fixation tips meet the septum head-on: the last approach point
    // sits ~1 cm back into the RV cavity along the septal normal.
    const septalApproach = site => site.rvSide.clone().add(site.rvSide.clone().sub(site.lvSide).setLength(0.27));
    const rvApex = rvVerts.length ? rvVerts.reduce((b, v) => v.y < b.y ? v : b).clone() : new THREE.Vector3(rv.x, rv.y - 0.5, rv.z);

    // His bundle distal end (on the septal crest), measured from its tract.
    let hisDistal = new THREE.Vector3(-0.10, -0.32, 0.06);
    const hisMesh = getMeshes('his').find(m => m.name === 'Bundle of His');
    if (hisMesh && hisMesh.geometry.parameters?.path) hisDistal = hisMesh.geometry.parameters.path.getPointAt(1).clone();

    // -------------------------------------------------------------
    // 1. Right Atrial (RA) Lead: active fixation in the right atrial appendage
    //    (anterosuperior RA pouch, pectinate muscles).
    // -------------------------------------------------------------
    let raaTip = new THREE.Vector3(ra.x + 0.25, ra.y + 0.38, ra.z + 0.42);
    if (raVerts.length) {
      const ys = raVerts.map(v => v.y).sort((a, b) => a - b);
      const upper = raVerts.filter(v => v.y >= ys[Math.floor(ys.length * 0.55)]);
      const zs = upper.map(v => v.z).sort((a, b) => b - a);
      const pouch = upper.filter(v => v.z >= zs[Math.floor(zs.length * 0.08)]);
      if (pouch.length) raaTip = centroidOf(pouch);
    }
    const raCurve = new THREE.CatmullRomCurve3([
      entryPt.clone(),
      highSvc.clone(),
      svcOs.clone(),
      raCenter.clone().lerp(raaTip, 0.45),
      raaTip.clone()
    ]);

    // -------------------------------------------------------------
    // 2. Right Ventricular (RV) Septal Lead: tip on the RV side of the mid
    //    interventricular septum (not the thin apex), halfway from the His
    //    to the apex, facing the septum (toward the spine in LAO).
    // -------------------------------------------------------------
    const midSeptalSite = septalSiteNear(hisDistal.clone().lerp(rvApex, 0.5));
    const rvSeptalTip = midSeptalSite
      ? midSeptalSite.rvSide.clone().lerp(rvCenter, 0.03)
      : new THREE.Vector3(rv.x * 0.85 + 0.05, rv.y + 0.12, rv.z * 0.85);
    const rvApproach = midSeptalSite ? septalApproach(midSeptalSite) : tvCenter.clone().lerp(rvSeptalTip, 0.5).lerp(rvCenter, 0.35);
    const rvCurve = new THREE.CatmullRomCurve3([
      entryPt.clone(),
      highSvc.clone(),
      midRa.clone(),
      tvCenter.clone(),
      rvApproach,
      rvSeptalTip.clone()
    ]);

    // -------------------------------------------------------------
    // 3. Left Bundle Branch Area Pacing (LBBAP): the lead enters the RV
    //    septum ~1.3 cm distal to the His along the His-apex line (the site
    //    where the LBB trunk in heart.js ends) and is screwed transseptally,
    //    perpendicular to the septum, until the tip sits in LV subendocardium.
    // -------------------------------------------------------------
    const lbbSite = septalSiteNear(hisDistal.clone().add(rvApex.clone().sub(hisDistal).setLength(0.35)));
    const lbbEntry = lbbSite ? lbbSite.rvSide.clone() : hisDistal.clone().add(new THREE.Vector3(0.06, -0.08, 0.04));
    const lbbapTip = lbbSite ? lbbSite.rvSide.clone().lerp(lbbSite.lvSide, 0.8) : lbbEntry.clone();
    const cspCurve = new THREE.CatmullRomCurve3([
      entryPt.clone(),
      highSvc.clone(),
      midRa.clone(),
      tvCenter.clone(),
      lbbSite ? septalApproach(lbbSite) : lbbEntry.clone().lerp(rvCenter, 0.25),
      lbbEntry.clone(),
      lbbapTip.clone()
    ]);

    // -------------------------------------------------------------
    // 4. CRT Coronary Sinus (CS) LV Lead
    // -------------------------------------------------------------
    // Subclavian/SVC to the CS ostium, along the sinus, then into the
    // posterior vein of the LV. The tip stays on the posterolateral free wall.
    // The anterior course of the great cardiac vein is not the target.
    const csCurve = new THREE.CatmullRomCurve3(buildCrtPath({
      entry: entryPt,
      highSvc,
      ra: raCenter,
      csPoints: meshCenterline(meshVertices('cs')),
      pivPoints: meshCenterline(meshVertices('piv'))
    }));

    const bbTarget = getBachmannTarget?.();
    if (!bbTarget) return; // The shared atlas-anchored target is built after model loading.
    const bbCurve = new THREE.CatmullRomCurve3([
      entryPt.clone(), highSvc.clone(), svcOs.clone(),
      new THREE.Vector3(bbTarget.x - .25, bbTarget.y - .2, bbTarget.z + .25),
      bbTarget.clone()
    ]);
    leadCurves = {
      bachmann: { curve: bbCurve, color: 0xf6b64b, name: 'Bachmann area atrial lead (schematic)' },
      ra: { curve: raCurve, color: 0x00f2fe, name: 'RA Lead (Appendage)' },
      rv: { curve: rvCurve, color: 0x30d158, name: 'RV Septal Lead' },
      csp: { curve: cspCurve, color: 0xffd60a, name: 'CSP / LBBAP Physiological Lead' },
      cs_lv: { curve: csCurve, color: 0xff3b30, name: 'CRT LV Coronary Sinus Lead' }
    };

    // Construct meshes for each lead
    for (const [key, def] of Object.entries(leadCurves)) {
      const leadGroup = new THREE.Group();
      leadGroup.name = def.name;

      // Tube body placeholder mesh (rebuilt on progress)
      const bodyMesh = new THREE.Mesh(new THREE.BufferGeometry(), matLeadBody.clone());
      leadGroup.add(bodyMesh);

      // Tip assembly (screw-in helix + ring electrodes + glowing indicator)
      const tipGroup = new THREE.Group();

      // Active fixation helix (screw)
      const screwGeom = new THREE.CylinderGeometry(0.008, 0.002, 0.035, 8);
      screwGeom.rotateX(Math.PI / 2);
      const screwMesh = new THREE.Mesh(screwGeom, matTipHelix.clone());
      tipGroup.add(screwMesh);

      // Distal ring electrode (cathode/anode)
      const ring1Geom = new THREE.CylinderGeometry(0.022, 0.022, 0.025, 12);
      ring1Geom.rotateX(Math.PI / 2);
      const ring1Mesh = new THREE.Mesh(ring1Geom, matElectrode.clone());
      ring1Mesh.position.z = -0.02;
      tipGroup.add(ring1Mesh);

      const ring2Mesh = new THREE.Mesh(ring1Geom.clone(), matElectrode.clone());
      ring2Mesh.position.z = -0.06;
      tipGroup.add(ring2Mesh);

      // Glowing fixation beacon
      const glowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), matIndicatorGlow.clone());
      glowMesh.material.color.setHex(def.color);
      tipGroup.add(glowMesh);

      leadGroup.add(tipGroup);

      group.add(leadGroup);
      leadMeshes[key] = {
        group: leadGroup,
        bodyMesh,
        tipGroup
      };
    }

    initialized = true;
    updateGeometry();
    applyLeadVisibility();
  }

  function updateGeometry() {
    if (!initialized) return;

    const t = Math.max(0.05, Math.min(1.0, currentProgress));

    for (const [key, def] of Object.entries(leadCurves)) {
      const meshData = leadMeshes[key];
      if (!meshData) continue;

      const curve = def.curve;
      const totalPoints = 64;
      const numPoints = Math.max(4, Math.floor(totalPoints * t));
      const sampledPoints = [];

      for (let i = 0; i <= numPoints; i++) {
        const u = (i / numPoints) * t;
        sampledPoints.push(curve.getPointAt(u));
      }

      const subCurve = new THREE.CatmullRomCurve3(sampledPoints);
      meshData.bodyMesh.geometry.dispose();
      meshData.bodyMesh.geometry = new THREE.TubeGeometry(subCurve, numPoints * 2, 0.016, 8, false);

      const tipPt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();

      meshData.tipGroup.position.copy(tipPt);
      meshData.tipGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    }
  }

  function setProgress(progress) {
    init();
    currentProgress = Number(progress);
    updateGeometry();
  }

  function setStep(stepIndex) {
    activeStep = Number(stepIndex);
    activeLesson = 'pacemaker';
    init();
    applyLeadVisibility();
  }

  function applyLeadVisibility() {
    if (activeLesson === 'bachmann') {
      const key = activeStep === 1 ? 'ra' : activeStep >= 2 ? 'bachmann' : null;
      for (const [id, lead] of Object.entries(leadMeshes)) lead.group.visible = id === key;
      return;
    }

    // Indices match the four pacemaker lesson steps.
    const visibilityMap = {
      0: { ra: true },
      1: { rv: true },
      2: { csp: true },
      3: { cs_lv: true }
    };

    const config = visibilityMap[activeStep] || visibilityMap[0];
    for (const [key, meshData] of Object.entries(leadMeshes)) {
      if (meshData && meshData.group) {
        meshData.group.visible = Boolean(config[key]);
      }
    }
  }

  function setVisible(visible) {
    if (visible) init();
    group.visible = Boolean(visible);
  }

  function setBachmannStep(step) {
    activeLesson = 'bachmann';
    activeStep = Number(step);
    init();
    applyLeadVisibility();
  }

  return {
    group,
    init,
    setVisible,
    setProgress,
    setStep,
    setBachmannStep,
    get leadCurves() { return leadCurves; },
    get leadMeshes() { return leadMeshes; }
  };
}

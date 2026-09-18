import * as THREE from 'three';

/**
 * Procedural 3D Pacemaker and Defibrillator Lead Models for Cardiac EP/CIED education.
 * Accurately models:
 * - RA lead (SVC -> Right Atrial Appendage)
 * - RV lead (SVC -> RA -> Tricuspid Valve -> RV Septum/Apex)
 * - CSP / LBBAP lead (His bundle / deep septal Left Bundle Branch Area Pacing)
 * - CRT CS LV lead (Coronary Sinus ostium -> Posterolateral branch over LV free wall)
 * Includes active-fixation helical tips, radiopaque bipolar/quadripolar electrodes,
 * and animated advancement progress (0..1).
 */
export function createPacemakerLeads(helpers) {
  const { sourceCenter, getBachmannTarget } = helpers;
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
    if (initialized) return;

    // Anchor points from cardiac atlas mesh
    const svc = sourceCenter('svc') || new THREE.Vector3(-0.85, 1.25, -0.30);
    const ra = sourceCenter('ra') || new THREE.Vector3(-0.95, 0.35, 0.10);
    const tv = sourceCenter('tricuspid') || new THREE.Vector3(-0.45, -0.45, 0.15);
    const rv = sourceCenter('rv') || new THREE.Vector3(0.05, -0.95, 0.50);
    const cs = sourceCenter('cs') || new THREE.Vector3(-0.55, -0.38, -0.20);
    const his = sourceCenter('his') || new THREE.Vector3(-0.10, -0.32, 0.06);
    const lv = sourceCenter('lv') || new THREE.Vector3(0.65, -0.75, 0.05);

    // Entry point: Superior Vena Cava access (subclavian/cephalic approach)
    const entryPt = new THREE.Vector3(svc.x * 0.95, svc.y + 0.35, svc.z * 0.95);
    const highSvc = new THREE.Vector3(svc.x, svc.y + 0.10, svc.z);
    const midRa = new THREE.Vector3(ra.x * 0.85, ra.y * 0.9, ra.z * 0.8);

    // -------------------------------------------------------------
    // 1. Right Atrial (RA) Lead (J-shape or active fixation in RAA)
    // -------------------------------------------------------------
    const raaTip = new THREE.Vector3(ra.x + 0.25, ra.y + 0.38, ra.z + 0.42);
    const raCurve = new THREE.CatmullRomCurve3([
      entryPt.clone(),
      highSvc.clone(),
      new THREE.Vector3(ra.x * 0.7, ra.y + 0.45, ra.z * 0.4),
      new THREE.Vector3(ra.x * 0.85 + 0.1, ra.y + 0.25, ra.z + 0.25),
      raaTip.clone()
    ]);

    // -------------------------------------------------------------
    // 2. Right Ventricular (RV) Septal/Apical Lead
    // -------------------------------------------------------------
    const rvSeptumMid = new THREE.Vector3((tv.x + rv.x) * 0.5 - 0.05, (tv.y + rv.y) * 0.5 - 0.05, (tv.z + rv.z) * 0.5 + 0.08);
    const rvApexTip = new THREE.Vector3(rv.x * 0.85 + 0.05, rv.y + 0.12, rv.z * 0.85);
    const rvCurve = new THREE.CatmullRomCurve3([
      entryPt.clone(),
      highSvc.clone(),
      midRa.clone(),
      new THREE.Vector3(tv.x * 0.9, tv.y + 0.05, tv.z * 0.9),
      rvSeptumMid.clone(),
      rvApexTip.clone()
    ]);

    // -------------------------------------------------------------
    // 3. Conduction System Pacing (CSP / LBBAP / His) Lead
    // -------------------------------------------------------------
    // Enters through TV and screws into basal interventricular septum to capture LBB
    const lbbapTip = new THREE.Vector3(his.x + 0.06, his.y - 0.08, his.z + 0.04);
    const cspCurve = new THREE.CatmullRomCurve3([
      entryPt.clone(),
      highSvc.clone(),
      midRa.clone(),
      new THREE.Vector3(tv.x * 0.95, tv.y + 0.12, tv.z * 0.85),
      new THREE.Vector3(his.x - 0.08, his.y + 0.05, his.z - 0.02),
      lbbapTip.clone()
    ]);

    // -------------------------------------------------------------
    // 4. CRT Coronary Sinus (CS) LV Lead
    // -------------------------------------------------------------
    // Enters CS ostium -> Great Cardiac Vein -> Posterolateral LV vein
    const csOstium = new THREE.Vector3(cs.x * 0.95, cs.y + 0.02, cs.z * 0.95);
    const csMid = new THREE.Vector3(cs.x * 0.6 + lv.x * 0.4, cs.y - 0.12, cs.z * 0.7 - 0.15);
    const csLvTip = new THREE.Vector3(lv.x * 0.82, lv.y + 0.15, lv.z - 0.35);
    const csCurve = new THREE.CatmullRomCurve3([
      entryPt.clone(),
      highSvc.clone(),
      new THREE.Vector3(midRa.x, midRa.y - 0.15, midRa.z - 0.08),
      csOstium.clone(),
      csMid.clone(),
      csLvTip.clone()
    ]);

    const bbTarget = getBachmannTarget?.();
    if (!bbTarget) return; // The shared atlas-anchored target is built after model loading.
    const bbCurve = new THREE.CatmullRomCurve3([
      entryPt.clone(), highSvc.clone(),
      new THREE.Vector3(ra.x, ra.y + .1, ra.z + .1),
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

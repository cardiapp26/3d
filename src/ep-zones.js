import * as THREE from 'three';
import { sharedRim, nearestLoop, coronarySinusOstium, vesselCenterline, centroid, inferiorCavalOstium } from './mesh-utils.js';
import { EP_ZONE_TEXT } from './eps/ep-zone-text.js';

/*
 * Accessory pathway zones on the atlas annuli
 * (research/ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md, section 5).
 * Each zone is an arc of the measured mitral or tricuspid annulus rim (the
 * LA/LV and RA/RV shared orifice rims), plus the CS/MCV course for venous
 * connections. Zones are teaching regions on the atlas: schematic, never a
 * localization rule, never a clinical map. One zone shows at a time (the
 * ablation lesson step) together with an RV pacing reference
 * marker. Zone names and risk text live in eps/ep-zone-text.js (shared with
 * the EPS laboratory page, which draws the same zones on a 2D schematic).
 */

// Arc span as a fraction of the annulus circumference, per side.
const SPAN = 0.09;
const NARROW = 0.06;

const COLORS = {
  'left-free-wall': 0x8b5cf6, 'left-anterolateral': 0x6366f1, 'left-posterolateral': 0x7c3aed,
  'right-lateral': 0x0ea5e9, 'right-posterior-inferior': 0x0891b2,
  'superior-paraseptal': 0xff2d55, 'mid-paraseptal': 0xff9f0a, 'inferior-paraseptal': 0x30d158,
  'koch-slow-pathway': 0x30d158, 'koch-inferior-extensions': 0x9be15d, 'cs-mcv': 0xd97706,
  'cavotricuspid-isthmus': 0xff453a, 'crista-terminalis': 0xf472b6,
  'lv-posterior-septum': 0xfbbf24, 'right-bundle': 0xfca5a5
};

export function createEpZones(helpers) {
  const { sourceCenter, meshVertices = () => [], getMeshes = () => [], isReady = () => true } = helpers;
  const group = new THREE.Group();
  group.name = 'EP Zones';
  group.visible = false;

  const zones = new Map();      // zoneId -> THREE.Group
  const labels = [];            // { mesh, tone, text, zone } for scene-labels
  let rvMarker = null;
  let active = null;
  let initialized = false;

  function arcOf(rim, anchor, lift, span) {
    // Consecutive rim points centred on the point nearest the anchor.
    const n = rim.length;
    const i0 = rim.reduce((bi, v, i) => (v.distanceTo(anchor) < rim[bi].distanceTo(anchor) ? i : bi), 0);
    const k = Math.max(2, Math.round(n * span));
    const pts = [];
    for (let d = -k; d <= k; d++) pts.push(rim[((i0 + d) % n + n) % n].clone().lerp(lift, 0.06));
    return pts;
  }

  function zoneMesh(id, points, closed = false) {
    const zone = new THREE.Group();
    zone.name = `EP zone: ${id}`;
    const curve = new THREE.CatmullRomCurve3(points, closed);
    const material = new THREE.MeshStandardMaterial({
      color: COLORS[id] || 0x8b5cf6, emissive: COLORS[id] || 0x8b5cf6, emissiveIntensity: 0.6,
      roughness: 0.35, transparent: true, opacity: 0.9
    });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(16, points.length * 2), 0.02, 8, closed), material);
    tube.name = `EP zone arc: ${id}`;
    tube.userData = { pickId: `ep-zone-${id}`, provenance: 'schematic', sourceName: `Accessory pathway zone (${id})` };
    zone.add(tube);
    const mid = curve.getPointAt(0.5);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 14, 14), new THREE.MeshBasicMaterial({
      color: COLORS[id] || 0x8b5cf6, wireframe: true, transparent: true, opacity: 0.5, depthWrite: false
    }));
    dot.position.copy(mid);
    dot.name = `EP zone marker: ${id}`;
    zone.add(dot);
    zone.visible = false;
    group.add(zone);
    zones.set(id, zone);
    const zoneText = EP_ZONE_TEXT[id];
    labels.push({
      mesh: dot, tone: id === 'superior-paraseptal' ? 'danger' : 'target', zone: id,
      text: { tr: `${zoneText.tr.name} (şematik)`, en: `${zoneText.en.name} (schematic)` }
    });
    return zone;
  }

  function init() {
    if (initialized || !isReady()) return;
    const ra = sourceCenter('ra') || new THREE.Vector3(-1.03, 0.13, 0.12);
    const la = sourceCenter('la') || new THREE.Vector3(-0.05, 0.27, -0.37);
    const rv = sourceCenter('rv') || new THREE.Vector3(-0.08, -0.16, 0.64);
    const av = sourceCenter('av') || new THREE.Vector3(-0.72, 0.25, -0.02);
    const aorta = sourceCenter('aorta') || la.clone().add(new THREE.Vector3(0.3, 0.4, 0.3));

    const tvRim = sharedRim(getMeshes('ra')[0], getMeshes('rv')[0]) || [];
    const mvRim = sharedRim(getMeshes('la')[0], getMeshes('lv')[0]) || [];
    if (!tvRim.length || !mvRim.length) return;
    const tvCentre = centroid(tvRim);
    const mvCentre = centroid(mvRim);

    // Anchors measured like ep-landmarks: CS ostium, His neighbourhood, IVC side.
    const csMouth = coronarySinusOstium({
      raMesh: getMeshes('ra')[0], laMesh: getMeshes('la')[0], csMesh: getMeshes('cs')[0],
      tvRim, towardVentricle: sourceCenter('rv'), avNode: av
    });
    const csLoop = csMouth ? null : nearestLoop(getMeshes('cs')[0], ra);
    const csOs = csMouth ? csMouth.center.clone() : csLoop ? csLoop.center.clone() : tvCentre.clone();
    const hisVerts = meshVertices('his', /bundle of his/i);
    const hisSite = hisVerts.length ? centroid(hisVerts) : av.clone();
    const tvInferior = tvRim.reduce((best, v) => (v.y < best.y ? v : best)).clone();

    // Tricuspid zones. Lateral = the rim farthest from the left heart.
    const rightLateralAnchor = tvRim.reduce((best, v) => (v.distanceTo(la) > best.distanceTo(la) ? v : best)).clone();
    zoneMesh('superior-paraseptal', arcOf(tvRim, hisSite, ra, NARROW));
    const hisIdx = tvRim.reduce((bi, v, i) => (v.distanceTo(hisSite) < tvRim[bi].distanceTo(hisSite) ? i : bi), 0);
    const csIdx = tvRim.reduce((bi, v, i) => (v.distanceTo(csOs) < tvRim[bi].distanceTo(csOs) ? i : bi), 0);
    const n = tvRim.length;
    const forward = (csIdx - hisIdx + n) % n;
    const backward = (hisIdx - csIdx + n) % n;
    const midIdx = forward <= backward ? (hisIdx + Math.round(forward / 2)) % n : (csIdx + Math.round(backward / 2)) % n;
    zoneMesh('mid-paraseptal', arcOf(tvRim, tvRim[midIdx], ra, NARROW));
    zoneMesh('inferior-paraseptal', arcOf(tvRim, csOs, ra, NARROW));
    zoneMesh('right-lateral', arcOf(tvRim, rightLateralAnchor, ra, SPAN));
    zoneMesh('right-posterior-inferior', arcOf(tvRim, tvInferior, ra, SPAN));
    // Koch region teaching zones share the septal isthmus between the CS
    // ostium and the hinge toward the node (drawn narrower).
    zoneMesh('koch-slow-pathway', arcOf(tvRim, csOs.clone().lerp(hisSite, 0.25), ra, NARROW));
    zoneMesh('koch-inferior-extensions', arcOf(tvRim, csOs.clone().lerp(hisSite, 0.35), ra, SPAN));

    // Mitral zones. Lateral = farthest from the right atrium; anterior = toward the aorta.
    const leftLateralAnchor = mvRim.reduce((best, v) => (v.distanceTo(ra) > best.distanceTo(ra) ? v : best)).clone();
    const anteriorAnchor = mvRim.reduce((best, v) => (v.distanceTo(aorta) < best.distanceTo(aorta) ? v : best)).clone();
    const posteriorAnchor = mvCentre.clone().multiplyScalar(2).sub(anteriorAnchor);
    zoneMesh('left-free-wall', arcOf(mvRim, leftLateralAnchor, la, SPAN));
    zoneMesh('left-anterolateral', arcOf(mvRim, leftLateralAnchor.clone().lerp(anteriorAnchor, 0.5), la, SPAN));
    zoneMesh('left-posterolateral', arcOf(mvRim, leftLateralAnchor.clone().lerp(posteriorAnchor, 0.5), la, SPAN));

    // Advanced-case teaching regions (phase D): schematic ring zones, not
    // mapped circuits. LV posterior septum (fascicular VT) and the right
    // bundle course (BBR-VT).
    {
      const lv = sourceCenter('lv') || mvCentre.clone();
      const ring = (center, radius = 0.09) => Array.from({ length: 13 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return center.clone().add(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * 0.35 * radius, Math.sin(a) * radius));
      });
      const mvLow = mvRim.reduce((best, v) => (v.y < best.y ? v : best));
      const lvSeptal = lv.clone().lerp(rv, 0.45).lerp(mvLow, 0.3);
      zoneMesh('lv-posterior-septum', ring(lvSeptal));
      const rbSite = hisSite.clone().lerp(rv, 0.35);
      zoneMesh('right-bundle', ring(rbSite, 0.06));
    }

    // CS / middle cardiac vein course: the venous connection zone.
    const csBody = vesselCenterline(meshVertices('cs'), csOs, 0.1).slice(0, 6);
    if (csBody.length >= 3) zoneMesh('cs-mcv', csBody.map((p) => p.clone()));

    // Cavotricuspid isthmus: from the low tricuspid hinge to the IVC ostium.
    const ivcLoop = nearestLoop(getMeshes('ivc')[0], ra);
    const ivcOs = ivcLoop ? ivcLoop.center.clone() : inferiorCavalOstium(getMeshes('ra')[0]);
    if (ivcOs) {
      const isthmus = [];
      for (let i = 0; i <= 8; i++) isthmus.push(tvInferior.clone().lerp(ivcOs, i / 8).lerp(ra, 0.08));
      zoneMesh('cavotricuspid-isthmus', isthmus);
    }

    // Crista terminalis (focal AT source): the upper third of the measured ridge (heart.js builds it first).
    const cristaPath = getMeshes('crista-terminalis')[0]?.userData?.path;
    if (cristaPath?.length > 6) {
      const upper = cristaPath.slice(Math.round(cristaPath.length * 0.15), Math.round(cristaPath.length * 0.45));
      zoneMesh('crista-terminalis', upper.map((p) => new THREE.Vector3(...p).lerp(ra, 0.06)));
    }

    // RV pacing reference: a schematic catheter tip at the RV apex (the RV
    // vertex farthest from the tricuspid annulus), shown with any zone.
    const rvVerts = meshVertices('rv');
    const apex = rvVerts.length
      ? rvVerts.reduce((best, v) => (v.distanceTo(tvCentre) > best.distanceTo(tvCentre) ? v : best)).clone().lerp(rv, 0.12)
      : rv.clone();
    rvMarker = new THREE.Group();
    rvMarker.name = 'RV pacing reference (schematic)';
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 14), new THREE.MeshStandardMaterial({ color: 0xffd28a, emissive: 0xb97a1f, emissiveIntensity: 0.7, roughness: 0.35 }));
    tip.position.copy(apex);
    tip.name = 'RV pacing tip';
    const shaft = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([apex.clone().lerp(tvCentre, 0.6), apex.clone().lerp(tvCentre, 0.25), apex]), 16, 0.012, 8, false),
      new THREE.MeshStandardMaterial({ color: 0xffd28a, roughness: 0.4 })
    );
    shaft.name = 'RV pacing catheter (schematic)';
    rvMarker.add(shaft, tip);
    rvMarker.visible = false;
    group.add(rvMarker);
    labels.push({ mesh: tip, tone: 'target', zone: '*', text: { tr: 'RV pacing referansı (şematik)', en: 'RV pacing reference (schematic)' } });

    initialized = true;
    if (active) applyZone();
  }

  function applyZone() {
    for (const [id, zone] of zones) zone.visible = id === active;
    if (rvMarker) rvMarker.visible = Boolean(active && zones.has(active));
  }

  /** Show one zone (and the RV pacing reference), or null for none. */
  function setZone(zoneId) {
    active = zoneId || null;
    init();
    if (initialized) applyZone();
  }

  return {
    group,
    init,
    labels,
    setZone,
    getZone: () => active,
    isActive: (zoneId) => group.visible && (zoneId === '*' ? Boolean(active && zones.has(active)) : zoneId === active && zones.has(zoneId)),
    hasZone: (zoneId) => zones.has(zoneId),
    setVisible(visible) {
      if (visible) init();
      group.visible = Boolean(visible);
    }
  };
}

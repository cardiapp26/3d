import * as THREE from 'three';
import { sharedRim, nearestLoop, coronarySinusOstium, vesselCenterline, centroid, inferiorCavalOstium } from './mesh-utils.js';
import { EP_ZONE_TEXT } from './ep-case-text.js';

/*
 * Accessory pathway zones on the atlas annuli
 * (research/ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md, section 5).
 * Each zone is an arc of the measured mitral or tricuspid annulus rim (the
 * LA/LV and RA/RV shared orifice rims), plus the CS/MCV course for venous
 * connections. Zones are teaching regions on the atlas: schematic, never a
 * localization rule, never a clinical map. One zone shows at a time (the
 * active case of the signal panel) together with an RV pacing reference
 * marker. Zone names and risk text live in ep-case-text.js (EP_ZONE_TEXT).
 */

// Arc span as a fraction of the annulus circumference, per side.
const SPAN = 0.09;
const NARROW = 0.06;

const COLORS = {
  'left-free-wall': 0x8b5cf6, 'left-anterolateral': 0x6366f1, 'left-posterolateral': 0x7c3aed,
  'right-lateral': 0x0ea5e9, 'right-posterior-inferior': 0x0891b2,
  'superior-paraseptal': 0xff2d55, 'mid-paraseptal': 0xff9f0a, 'inferior-paraseptal': 0x30d158,
  'koch-slow-pathway': 0x30d158, 'koch-inferior-extensions': 0x9be15d, 'cs-mcv': 0xd97706,
  'cavotricuspid-isthmus': 0xff453a, 'crista-terminalis': 0xf472b6
};

export function createEpZones(helpers) {
  const { sourceCenter, meshVertices = () => [], getMeshes = () => [], isReady = () => true } = helpers;
  const group = new THREE.Group();
  group.name = 'EP Zones';
  group.visible = false;

  const zones = new Map();      // zoneId -> THREE.Group
  const labels = [];            // { mesh, tone, text, zone } for scene-labels
  const circuits = new Map();   // 'orthodromic' | 'antidromic' -> THREE.Group (left free wall AVRT)
  const paths = new Map();      // 'avn' | 'ap' -> THREE.Group (atrial pacing laboratory, test beat routes)
  let rvMarker = null;
  let halo = null;
  let active = null;
  let options = { halo: false, circuit: null, paths: [] };
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

  /** Tube with arrow cones along the points, drawn over the walls (no depth test) so it stays readable. */
  function arrowTube(name, points, colour, arrowName) {
    const curve = new THREE.CatmullRomCurve3(points);
    const out = new THREE.Group();
    out.name = name;
    const overlay = (mat) => Object.assign(mat, { depthTest: false, depthWrite: false, transparent: true });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.016, 8, false), overlay(new THREE.MeshBasicMaterial({ color: colour, opacity: 0.9 })));
    tube.renderOrder = 20;
    out.add(tube);
    for (const t of [0.15, 0.35, 0.55, 0.75, 0.92]) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 12), overlay(new THREE.MeshBasicMaterial({ color: colour, opacity: 1 })));
      cone.renderOrder = 21;
      cone.position.copy(curve.getPointAt(t));
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangentAt(t).normalize());
      cone.name = arrowName;
      out.add(cone);
    }
    out.visible = false;
    group.add(out);
    return out;
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

    // Right annular Halo (schematic decapolar): along the lateral tricuspid
    // annulus from the high anterolateral rim (electrodes 9-10, proximal) down
    // to the low lateral rim next to the CTI (electrodes 1-2, distal).
    {
      const n = tvRim.length;
      const iLow = tvRim.reduce((bi, v, i) => (v.distanceTo(tvInferior) < tvRim[bi].distanceTo(tvInferior) ? i : bi), 0);
      const iLat = tvRim.reduce((bi, v, i) => (v.distanceTo(rightLateralAnchor) < tvRim[bi].distanceTo(rightLateralAnchor) ? i : bi), 0);
      // Walk from the low rim through the lateral point and beyond (the shorter way round).
      const fwd = (iLat - iLow + n) % n, back = (iLow - iLat + n) % n;
      const step = fwd <= back ? 1 : -1, reach = Math.round(Math.min(fwd, back) * 1.6);
      const arc = [];
      for (let k = 0; k <= reach; k++) arc.push(tvRim[((iLow + step * k) % n + n) % n].clone().lerp(ra, 0.12));
      const curve = new THREE.CatmullRomCurve3(arc);
      halo = new THREE.Group();
      halo.name = 'Halo catheter (schematic)';
      halo.add(Object.assign(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.012, 8, false), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4 })), { name: 'Halo catheter body' }));
      const electrodeMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.25 });
      for (let e = 1; e <= 10; e++) {
        // Bipoles: pairs 1-2 (distal, low) ... 9-10 (proximal, high).
        const u = 0.06 + Math.floor((e - 1) / 2) * 0.21 + ((e - 1) % 2) * 0.05;
        const electrode = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 12), electrodeMat);
        electrode.position.copy(curve.getPointAt(Math.min(0.99, u)));
        electrode.name = `Halo ${e} electrode`;
        halo.add(electrode);
      }
      halo.visible = false;
      group.add(halo);
      labels.push({ mesh: halo.children[2], tone: 'cs', zone: '#halo', text: { tr: 'Halo 1-2 (distal, CTI yanı)', en: 'Halo 1-2 (distal, by the CTI)' } });
      labels.push({ mesh: halo.children[10], tone: 'cs', zone: '#halo', text: { tr: 'Halo 9-10 (proksimal)', en: 'Halo 9-10 (proximal)' } });
    }

    // Reentry circuits over the left free wall pathway (schematic arrows):
    // orthodromic = atrium, AV node, His, ventricle, pathway back to the atrium;
    // antidromic = the reverse direction.
    {
      const apArc = arcOf(mvRim, leftLateralAnchor, la, NARROW);
      const apMid = apArc[Math.floor(apArc.length / 2)];
      const lv = sourceCenter('lv') || mvCentre.clone().add(new THREE.Vector3(0.2, -0.5, 0.3));
      const ventricular = apMid.clone().lerp(lv, 0.45);
      const septalV = hisSite.clone().lerp(lv, 0.35);
      const atrial = apMid.clone().lerp(la, 0.4);
      const loop = [atrial, av.clone(), hisSite.clone(), septalV, ventricular, apMid.clone(), atrial.clone().lerp(apMid, 0.2)];
      for (const kind of ['orthodromic', 'antidromic']) {
        const pts = kind === 'orthodromic' ? loop : [...loop].reverse();
        const circuit = arrowTube(`EP circuit: ${kind}`, pts, kind === 'orthodromic' ? 0x38bdf8 : 0xf97316, `EP circuit arrow (${kind})`);
        circuit.userData = { direction: kind, from: pts[0].toArray(), to: pts[pts.length - 1].toArray(), pathway: apMid.toArray(), avNode: av.toArray() };
        circuits.set(kind, circuit);
      }
      // Antegrade routes of the atrial pacing laboratory's test beat: over the
      // AV node (septal atrium, node, His, septal ventricle) and over the left
      // free wall pathway (atrium, pathway, free wall ventricle).
      const routes = {
        avn: [av.clone().lerp(ra, 0.35), av.clone(), hisSite.clone(), septalV.clone()],
        ap: [atrial.clone(), apMid.clone(), ventricular.clone()]
      };
      for (const [kind, pts] of Object.entries(routes)) {
        const route = arrowTube(`EP pacing path: ${kind}`, pts, kind === 'avn' ? 0x22c55e : 0xf472b6, `EP pacing arrow (${kind})`);
        route.userData = { route: kind, from: pts[0].toArray(), to: pts[pts.length - 1].toArray() };
        paths.set(kind, route);
      }
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
    if (halo) halo.visible = Boolean(active && options.halo);
    for (const [kind, circuit] of circuits) circuit.visible = Boolean(active && options.circuit === kind);
    for (const [kind, route] of paths) route.visible = options.paths.includes(kind);
  }

  /**
   * Show one zone (and the RV pacing reference), or null for none.
   * extra.halo shows the Halo catheter; extra.circuit ('orthodromic' |
   * 'antidromic') draws the reentry direction over the left free wall pathway;
   * extra.paths (['avn', 'ap']) draws the pacing laboratory's antegrade routes.
   */
  function setZone(zoneId, extra = {}) {
    active = zoneId || null;
    options = { halo: Boolean(extra.halo), circuit: extra.circuit || null, paths: Array.isArray(extra.paths) ? [...extra.paths] : [] };
    init();
    if (initialized) applyZone();
  }

  return {
    group,
    init,
    labels,
    setZone,
    getZone: () => active,
    getOptions: () => ({ ...options, paths: [...options.paths] }),
    isActive: (zoneId) => group.visible && (zoneId === '*' ? Boolean(active && zones.has(active))
      : zoneId === '#halo' ? Boolean(active && options.halo)
        : zoneId === active && zones.has(zoneId)),
    hasZone: (zoneId) => zones.has(zoneId),
    setVisible(visible) {
      if (visible) init();
      group.visible = Boolean(visible);
    }
  };
}

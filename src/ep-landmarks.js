import * as THREE from 'three';
import { sharedRim, nearestLoop, inferiorCavalOstium, coronarySinusOstium, vesselCenterline, centroid } from './mesh-utils.js';
import { surface } from './atrial-surface.js';
import { DEFAULT_SITE, clampSite, sitePoint } from './koch-sp-model.js';

/**
 * Procedural 3D Clinical Electrophysiology (EP) Landmarks and Ablation Targets.
 * Grounded in standard clinical EP practice (CTI line, Triangle of Koch, WACA/PVI rings).
 * Anchor points are measured from the atlas meshes (vein ostia, leaflet hinges,
 * CS ostium) instead of hand-tuned constants.
 */
export function createEPLandmarks(helpers) {
  const { sourceCenter, meshVertices = () => [], getMeshes = () => [], isReady = () => true } = helpers;
  const group = new THREE.Group();
  group.name = 'EP Landmarks';
  group.visible = false;

  const targets = {};
  // Scene labels for the Koch close-up (heart.js shows them in that step).
  const labels = [];
  // Optional layers of the Koch step: reference catheters and example RF lesions.
  const optional = { his: [], cs: [], lesions: [] };
  const shown = { his: true, cs: true, lesions: false };
  let kochCentre = null;
  // Movable slow pathway catheter tip (koch-sp-model.js site; set from the mapping panel).
  let kochTip = null;

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
    // Anchors are measured from atlas meshes: never build before the atlas
    // loads, or every anchor freezes on its fallback constant.
    if (initialized || !isReady()) return;

    const ra = sourceCenter('ra') || new THREE.Vector3(-1.03, 0.13, 0.12);
    const la = sourceCenter('la') || new THREE.Vector3(-0.05, 0.27, -0.37);
    // Compact AV node, measured at the Koch apex by the conduction system.
    const av = sourceCenter('av') || new THREE.Vector3(-0.72, 0.25, -0.02);

    // Measured anchors -------------------------------------------------
    // Ostia come from mesh boundary loops (the actual open rims), the
    // tricuspid ring from the RA/RV shared orifice rim.
    const ivcLoop = nearestLoop(getMeshes('ivc')[0], ra);
    const ivcOs = ivcLoop ? ivcLoop.center.clone()
      : (inferiorCavalOstium(getMeshes('ra')[0]) || new THREE.Vector3(-1.05, -0.93, -0.39));
    const tvRim = sharedRim(getMeshes('ra')[0], getMeshes('rv')[0]);
    // The atlas sinus ends on the tricuspid hinge in the AV groove; the RA
    // mouth is measured one septal isthmus up the paraseptal wall from it.
    const csMouth = coronarySinusOstium({
      raMesh: getMeshes('ra')[0], laMesh: getMeshes('la')[0], csMesh: getMeshes('cs')[0],
      tvRim, towardVentricle: sourceCenter('rv'), avNode: av
    });
    const csLoop = csMouth ? null : nearestLoop(getMeshes('cs')[0], ra);
    const csOs = csMouth ? csMouth.center.clone()
      : csLoop ? csLoop.center.clone()
      : (nearEndCentroid(meshVertices('cs'), ra) || new THREE.Vector3(-0.70, -0.41, -0.30));
    // Inferior tricuspid hinge: rim point nearest the IVC ostium.
    let tvInferior = new THREE.Vector3(-0.75, -0.75, 0.0);
    // Septal tricuspid hinge: rim point nearest the left heart (septal side).
    let septalHinge = new THREE.Vector3(-0.45, -0.20, 0.05);
    if (tvRim) {
      // 6 o'clock (LAO) of the tricuspid annulus: its lowest rim point. The
      // central isthmus runs from here to the IVC, lateral to the CS ostium.
      tvInferior = tvRim.reduce((best, v) => v.y < best.y ? v : best).clone();
      septalHinge = tvRim.reduce((best, v) => v.distanceTo(la) < best.distanceTo(la) ? v : best).clone();
    }

    // -------------------------------------------------------------
    // 1. CTI (Cavotricuspid Isthmus) Ablation Line (Atrial Flutter)
    // -------------------------------------------------------------
    const ctiGroup = new THREE.Group();
    ctiGroup.name = 'CTI Ablation Line';

    // Route the lesion line over the isthmus floor: sample the chord, snap each
    // sample to the nearest RA wall vertex, then lift slightly into the cavity.
    const raWall = meshVertices('ra');
    const onWall = pt => {
      if (!raWall.length) return pt;
      let best = raWall[0], bestD = Infinity;
      for (let i = 0; i < raWall.length; i += 2) {
        const d = raWall[i].distanceToSquared(pt);
        if (d < bestD) { bestD = d; best = raWall[i]; }
      }
      return best.clone().lerp(ra, 0.06);
    };
    const ctiPts = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const chord = tvInferior.clone().lerp(ivcOs, t);
      ctiPts.push(i === 0 ? tvInferior.clone().lerp(ra, 0.04) : i === 6 ? ivcOs.clone() : onWall(chord));
    }
    const ctiCurve = new THREE.CatmullRomCurve3(ctiPts);
    const ctiLine = new THREE.Mesh(new THREE.TubeGeometry(ctiCurve, 40, 0.022, 10, false), matLesion.clone());
    ctiLine.name = 'CTI ablation line';
    ctiLine.userData = { pickId: 'cti-line', provenance: 'schematic', sourceName: 'CTI ablation line' };
    ctiGroup.add(ctiLine);

    ctiCurve.getPoints(9).forEach(pt => {
      const burn = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 16), matLesion.clone());
      burn.position.copy(pt);
      burn.name = 'CTI RF lesion';
      burn.userData = { pickId: 'cti-line', provenance: 'schematic', sourceName: 'CTI RF lesion' };
      ctiGroup.add(burn);
    });

    // IVC ostium marker (the atlas has no IVC mesh; measured from the RA floor).
    const ivcMarker = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.012, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0x5b9bd5, transparent: true, opacity: 0.8 })
    );
    ivcMarker.position.copy(ivcOs);
    ivcMarker.rotation.x = Math.PI / 2;
    ivcMarker.name = 'IVC ostium (measured)';
    ivcMarker.userData = { pickId: 'ivc', provenance: 'schematic', sourceName: 'IVC ostium' };
    ctiGroup.add(ivcMarker);

    group.add(ctiGroup);
    targets.cti = ctiGroup;

    // -------------------------------------------------------------
    // 2. Triangle of Koch (AVNRT), after Tretter et al., Europace 2022;24:455.
    //    The triangle is the right atrial face of the inferior pyramidal space,
    //    apex pointing superiorly (attitudinal). Base: inferior (cavotricuspid)
    //    isthmus at the CS ostium. Sides: tendon of Todaro (from the commissure
    //    of the Eustachian and Thebesian valves) and the septal tricuspid hinge,
    //    converging at the membranous septum. Compact AV node at the apex,
    //    formed by union of the inferior extensions (slow pathway: rightward in
    //    the tricuspid vestibule via the septal isthmus, shorter leftward in the
    //    mitral vestibule) with septal inputs from the atrial buttress (fast
    //    pathway). Septal isthmus (CS ostium to septal hinge) = usual target.
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
    // Posterior base corner: the mouth's posterior lip, farthest from the
    // tricuspid annulus (where the Eustachian ridge / Todaro rises).
    const csRim = csLoop ? csLoop.pts : [csOs.clone()];
    const basePosterior = csMouth ? csMouth.posteriorLip.clone() : csRim.reduce((best, v) => {
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
    const todaroMesh = tag(new THREE.Mesh(new THREE.TubeGeometry(todaroCurve, 32, 0.017, 8, false), matTodaro), 'koch-todaro', 'Tendon of Todaro');
    kochGroup.add(todaroMesh);
    // The tendon has no atlas mesh: its course from the base corner to the apex is drawn schematically.
    labels.push({ mesh: todaroMesh, tone: 'todaro', text: { tr: 'Todaro tendonu (şematik seyir)', en: 'Tendon of Todaro (schematic course)' } });
    const hingeCurveMesh = tag(new THREE.Mesh(new THREE.TubeGeometry(hingeCurve, 40, 0.015, 8, false), matHinge), 'tricuspid-septal', 'Septal tricuspid hinge (Koch side)');
    kochGroup.add(hingeCurveMesh);
    kochGroup.add(tag(new THREE.Mesh(new THREE.TubeGeometry(baseCurve, 20, 0.014, 8, false), matBase), 'koch-base', 'CS ostium / inferior isthmus (Koch base)'));
    // The mouth itself: a ring on the wall, facing the cavity.
    const csRing = new THREE.Mesh(new THREE.TorusGeometry(csMouth ? csMouth.radius : 0.13, 0.012, 8, 32), matBase);
    csRing.position.copy(lift(csOs));
    csRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ra.clone().sub(csOs).normalize());
    // The mouth is estimated (mesh-utils coronarySinusOstium): the atlas sinus
    // ends in the AV groove and has no intra-atrial orifice.
    kochGroup.add(tag(csRing, 'koch-base', csMouth ? 'Coronary sinus ostium (estimated)' : 'Coronary sinus ostium (fallback)'));
    labels.push({ mesh: csRing, tone: 'estimate', text: { tr: 'CS ağzı (kestirim)', en: 'CS ostium (estimated)' } });

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
    kochCentre = centroid(outline);
    labels.push({ mesh: hingeCurveMesh, tone: 'hinge', text: { tr: 'Septal menteşe (atlas halkası)', en: 'Septal hinge (atlas rim)' } });

    // Compact AV node at the apex (do not ablate: complete heart block).
    const avDanger = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 18), matDanger);
    avDanger.position.copy(apexLift);
    kochGroup.add(tag(avDanger, 'koch-avnode', 'Compact AV node (Koch apex)'));
    labels.push({ mesh: avDanger, tone: 'danger', text: { tr: 'Kompakt AV düğüm (apeks, şematik)', en: 'Compact AV node (apex, schematic)' } });

    // Fast pathway: septal input from the buttress of the atrial septum, the
    // "last" atrial connection at the apex (danger). Drawn as a short input
    // entering over Todaro from the septal side, ending at the node.
    const matFast = new THREE.MeshStandardMaterial({
      color: 0xff9f0a, emissive: 0xff7a00, emissiveIntensity: 0.8, roughness: 0.3, transparent: true, opacity: 0.9
    });
    const fastCenter = lift(todaroCurve.getPointAt(0.8).lerp(hingeCurve.getPointAt(0.85), 0.2));
    // Buttress (antero-inferior rim of the oval fossa) lies beyond Todaro,
    // away from the hinge and slightly above the fast-pathway zone.
    const buttressPt = todaroCurve.getPointAt(0.85);
    buttressPt.add(buttressPt.clone().sub(hingeCurve.getPointAt(0.85)).setLength(0.09)).add(new THREE.Vector3(0, 0.02, 0));
    const fastInput = new THREE.CatmullRomCurve3([buttressPt, fastCenter, apexLift]);
    kochGroup.add(tag(new THREE.Mesh(new THREE.TubeGeometry(fastInput, 20, 0.012, 8, false), matFast), 'koch-fast', 'Fast pathway (septal input)'));
    const fastZone = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), matFast);
    fastZone.position.copy(fastCenter);
    kochGroup.add(tag(fastZone, 'koch-fast', 'Fast pathway (danger zone)'));
    labels.push({ mesh: fastZone, tone: 'fast', text: { tr: 'Hızlı yol girişi (şematik, kaçınılacak)', en: 'Fast pathway input (schematic, avoid)' } });

    // Slow pathway: septal isthmus between the CS ostium and the septal
    // tricuspid hinge, just above the base (ablation target).
    // Site (u, v) of koch-sp-model.js on this triangle; the default site is the target.
    const kochFrame = { todaro: basePosterior, csOs, hinge: baseAnterior, apex: apexPt };
    const kochPoint = site => lift(sitePoint(site, kochFrame, (a, b, f) => a.clone().lerp(b, f)));
    const slowPathwayCenter = kochPoint(DEFAULT_SITE);
    const slowTarget = new THREE.Mesh(new THREE.SphereGeometry(0.045, 18, 18), new THREE.MeshBasicMaterial({
      color: 0x30d158, wireframe: true, transparent: true, opacity: 0.4, depthWrite: false
    }));
    slowTarget.position.copy(slowPathwayCenter);
    kochGroup.add(tag(slowTarget, 'koch-slow', 'Slow pathway / septal isthmus (ablation target)'));
    labels.push({ mesh: slowTarget, tone: 'target', text: { tr: 'Yavaş yol hedefi (şematik)', en: 'Slow pathway target (schematic)' } });

    // Catheter routes. Teaching routes only: lumen clearance, tissue contact
    // and contact force are not modelled. They run through the RA cavity:
    // the centroid of the inner wall in a horizontal slab (the atlas RA is
    // double-sheeted in places; atrial-surface.js splits the faces).
    const raInner = surface(getMeshes('ra')).inner.map(v => v.p);
    const cavityAt = (y, fallback) => {
      const slab = raInner.filter(p => Math.abs(p.y - y) < 0.06);
      return slab.length >= 8 ? centroid(slab) : fallback.clone();
    };
    const between = (a, b, f) => a + (b - a) * f;
    // The atlas has no IVC mesh: the femoral catheters rise in the IVC lumen
    // under the RA floor, pass the measured caval ostium, then the cavity.
    const femoral = (shift = new THREE.Vector3()) => [
      ivcOs.clone().add(new THREE.Vector3(0, -0.5, 0)).add(shift),
      ivcOs.clone().add(new THREE.Vector3(0, -0.25, 0)).addScaledVector(shift, 0.5),
      ivcOs.clone()
    ];
    const matElectrode = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.25 });
    // A catheter group: body tube and electrodes at curve fractions `rings`.
    // `cavity`: the route points between which it runs in the RA cavity (for checks).
    function catheter({ name, pickId, color, points, radius, rings, tint, cavity }) {
      const catheterGroup = new THREE.Group();
      catheterGroup.name = name;
      catheterGroup.userData = { fluoroDevice: true, fluoroTint: tint, cavity: cavity.map(p => p.toArray()) };
      const curve = new THREE.CatmullRomCurve3(points);
      catheterGroup.add(tag(new THREE.Mesh(new THREE.TubeGeometry(curve, 96, radius, 8, false), new THREE.MeshStandardMaterial({ color, roughness: 0.4 })), pickId, name));
      const electrodes = rings.map((t, i) => {
        const electrode = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.5, 12, 12), matElectrode);
        electrode.position.copy(curve.getPointAt(t));
        return tag(electrode, pickId, `${name} electrode ${i + 1}`);
      });
      electrodes.forEach(e => catheterGroup.add(e));
      return { group: catheterGroup, curve, electrodes };
    }

    // Catheter colours are kept apart in hue in 3D and under fluoroscopy:
    // yellow ablation, magenta His, blue CS.
    // Slow pathway ablation catheter (femoral): up the RA cavity, onto the
    // inferior paraseptal target from the cavity side.
    const ablationRoute = tip => [...femoral(), cavityAt(between(ivcOs.y, tip.y, 0.4), ra), cavityAt(between(ivcOs.y, tip.y, 0.7), ra),
      tip.clone().lerp(ra, 0.3), tip.clone()];
    const ablationRings = [0.88, 0.93, 0.97, 1];
    const ablation = catheter({
      name: 'Slow pathway ablation catheter (schematic)', pickId: 'koch-catheter', color: 0xfacc15, radius: 0.014, tint: 0xd09a00, cavity: [ivcOs, slowPathwayCenter],
      points: ablationRoute(slowPathwayCenter),
      rings: ablationRings
    });
    ablation.electrodes[3].name = 'Slow pathway catheter tip';
    kochGroup.add(ablation.group);
    // Rebuild the body along a new route when the tip moves (mapping panel).
    kochTip = {
      site: { ...DEFAULT_SITE },
      move(site) {
        const next = clampSite(site);
        const tip = kochPoint(next);
        const curve = new THREE.CatmullRomCurve3(ablationRoute(tip));
        const body = ablation.group.children[0];
        body.geometry.dispose();
        body.geometry = new THREE.TubeGeometry(curve, 96, 0.014, 8, false);
        ablationRings.forEach((t, i) => ablation.electrodes[i].position.copy(curve.getPointAt(t)));
        ablation.group.userData.cavity = [ivcOs.toArray(), tip.toArray()];
        this.site = next;
      }
    };

    // His reference catheter (femoral quadripolar): across the septal
    // tricuspid hinge next to the His bundle, distal pair just inside the RV.
    const rvCentre = sourceCenter('rv') || new THREE.Vector3(-0.08, -0.16, 0.64);
    const hisVerts = meshVertices('his', /bundle of his/i);
    const hisNear = hisVerts.filter(v => { const d = v.distanceTo(av); return d > 0.08 && d < 0.2; });
    const hisSite = hisNear.length ? centroid(hisNear) : apexPt.clone().lerp(rvCentre, 0.15);
    const hisHinge = (tvRim || [septalHinge]).reduce((best, v) => v.distanceTo(hisSite) < best.distanceTo(hisSite) ? v : best).clone();
    const hisTip = hisHinge.clone().add(rvCentre.clone().sub(hisHinge).setLength(0.1));
    const hisApproach = hisHinge.clone().add(ra.clone().sub(hisHinge).setLength(0.16));
    const his = catheter({
      name: 'His reference catheter (schematic)', pickId: 'ep-his-cath', color: 0xd946ef, radius: 0.013, tint: 0xc026d3, cavity: [ivcOs, hisApproach],
      points: [...femoral(new THREE.Vector3(0.07, 0, 0.05)), cavityAt(between(ivcOs.y, hisHinge.y, 0.45), ra), cavityAt(between(ivcOs.y, hisHinge.y, 0.8), ra),
        hisApproach, hisTip],
      rings: [0.9, 0.94, 0.97, 1]
    });
    his.group.userData.hisSite = hisSite.toArray();
    his.group.userData.hisHinge = hisHinge.toArray();
    his.group.userData.tip = hisTip.toArray();
    kochGroup.add(his.group);
    optional.his.push(his.group);
    labels.push({ mesh: his.electrodes[2], tone: 'his', text: { tr: 'His kateteri (referans)', en: 'His catheter (reference)' } });

    // CS reference catheter (decapolar, from the SVC): down the posterior RA,
    // into the estimated mouth and along the sinus. Proximal pair (CS 9-10)
    // at the ostium, distal pair (CS 1-2) farthest along the sinus.
    const svcVerts = meshVertices('svc');
    const svcY = svcVerts.reduce((r, v) => [Math.min(r[0], v.y), Math.max(r[1], v.y)], [Infinity, -Infinity]);
    const svcTop = svcVerts.length ? centroid(svcVerts.filter(v => v.y > svcY[1] - 0.12)) : ra.clone().add(new THREE.Vector3(0, 1.8, -0.2));
    const svcBottom = svcVerts.length ? centroid(svcVerts.filter(v => v.y < svcY[0] + 0.12)) : ra.clone().add(new THREE.Vector3(0, 1.1, -0.2));
    const csBody = vesselCenterline(meshVertices('cs'), csOs, 0.1).slice(1, 9);
    const csCatheter = catheter({
      name: 'CS reference catheter (schematic)', pickId: 'ep-cs-cath', color: 0x3b82f6, radius: 0.013, tint: 0x2f7cf0, cavity: [svcBottom, csOs.clone().lerp(ra, 0.25)],
      points: [svcTop, svcTop.clone().lerp(svcBottom, 0.5), svcBottom, cavityAt(between(svcBottom.y, csOs.y, 0.4), ra), cavityAt(between(svcBottom.y, csOs.y, 0.8), ra),
        csOs.clone().lerp(ra, 0.25), csOs.clone(), ...csBody],
      rings: []
    });
    // Ten electrodes as five bipoles on the part inside the sinus.
    const csIn = new THREE.CatmullRomCurve3([csOs.clone(), ...csBody]);
    for (let i = 0; i < (csBody.length >= 2 ? 10 : 0); i++) {
      const u = Math.min(0.98, 0.04 + Math.floor(i / 2) * 0.2 + (i % 2) * 0.05);
      const electrode = new THREE.Mesh(new THREE.SphereGeometry(0.019, 12, 12), matElectrode);
      electrode.position.copy(csIn.getPointAt(u));
      csCatheter.group.add(tag(electrode, 'ep-cs-cath', `CS ${10 - i} electrode`));
      csCatheter.electrodes.push(electrode);
    }
    kochGroup.add(csCatheter.group);
    optional.cs.push(csCatheter.group);
    labels.push({ mesh: csCatheter.electrodes[1] || csCatheter.group.children[0], tone: 'cs', text: { tr: 'CS kateteri (referans)', en: 'CS catheter (reference)' } });

    // Inferior extensions of the AV node. Rightward: long, in the tricuspid
    // vestibule just atrial to the septal hinge, through the septal isthmus.
    const matExtension = new THREE.MeshStandardMaterial({
      color: 0x9be15d, emissive: 0x3f8f1f, emissiveIntensity: 0.6, roughness: 0.4, transparent: true, opacity: 0.85
    });
    const rightExtPts = [slowPathwayCenter.clone()];
    [0.35, 0.6, 0.82].forEach(t => rightExtPts.push(lift(hingeCurve.getPointAt(t).lerp(todaroCurve.getPointAt(t), 0.2))));
    rightExtPts.push(apexLift.clone());
    kochGroup.add(tag(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rightExtPts), 40, 0.011, 8, false), matExtension),
      'koch-ext-right', 'Rightward inferior extension (tricuspid vestibule)'));

    // Leftward: shorter, toward the septal mitral vestibule (left-sided slow
    // pathway, a minority of AVNRT). Its inferoseptal mitral point also closes
    // the inferior pyramidal space below.
    const mvRim = sharedRim(getMeshes('la')[0], getMeshes('lv')[0]);
    const mitralSeptal = mvRim
      ? mvRim.reduce((best, v) => v.distanceTo(csOs) < best.distanceTo(csOs) ? v : best).clone()
      : null;
    if (mitralSeptal) {
      const leftEnd = apexPt.clone().lerp(mitralSeptal.clone().lerp(la, 0.06), 0.45);
      const leftMid = apexPt.clone().lerp(leftEnd, 0.5).add(new THREE.Vector3(0, -0.03, 0));
      const leftExt = new THREE.CatmullRomCurve3([apexLift, leftMid, leftEnd]);
      kochGroup.add(tag(new THREE.Mesh(new THREE.TubeGeometry(leftExt, 24, 0.01, 8, false), matExtension),
        'koch-ext-left', 'Leftward inferior extension (mitral vestibule)'));

      // Inferior pyramidal space: fibro-adipose wedge behind the triangle.
      // Faces: RA wall (Koch), LA vestibule, crest of the muscular septum;
      // base opens onto the inferior AV groove. Apex under the AV node.
      const crux = mitralSeptal.clone();
      const corners = [apexPt, baseAnterior, basePosterior, crux];
      const faces = [[0, 2, 3], [0, 1, 3], [1, 2, 3]];
      const pyrPos = [];
      faces.forEach(f => f.forEach(i => pyrPos.push(...corners[i].toArray())));
      const pyrGeom = new THREE.BufferGeometry();
      pyrGeom.setAttribute('position', new THREE.Float32BufferAttribute(pyrPos, 3));
      pyrGeom.computeVertexNormals();
      kochGroup.add(tag(new THREE.Mesh(pyrGeom, new THREE.MeshBasicMaterial({
        color: 0xf2c46d, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false
      })), 'koch-pyramid', 'Inferior pyramidal space (pyramid of Koch)'));
      const edgePairs = [[0, 3], [1, 3], [2, 3]];
      const edgePos = [];
      edgePairs.forEach(([a, b]) => edgePos.push(...corners[a].toArray(), ...corners[b].toArray()));
      const edgeGeom = new THREE.BufferGeometry();
      edgeGeom.setAttribute('position', new THREE.Float32BufferAttribute(edgePos, 3));
      const edges = new THREE.LineSegments(edgeGeom, new THREE.LineBasicMaterial({ color: 0xf2c46d, transparent: true, opacity: 0.7 }));
      edges.name = 'Inferior pyramidal space edges';
      kochGroup.add(edges);
    }

    // Example RF lesion cluster at the slow pathway, hidden by default: the
    // number and spread are not a treatment protocol.
    const axis = apexPt.clone().sub(baseAnterior).normalize();
    const side = new THREE.Vector3().crossVectors(axis, csOs.clone().sub(baseAnterior)).cross(axis).normalize();
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const rf = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 12), matLesion.clone());
      rf.position.copy(slowPathwayCenter)
        .addScaledVector(axis, Math.cos(angle) * 0.04)
        .addScaledVector(side, Math.sin(angle) * 0.04);
      rf.visible = shown.lesions;
      kochGroup.add(tag(rf, 'koch-slow', 'Slow pathway RF lesion (example, optional)'));
      optional.lesions.push(rf);
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

    // Snap schematic lesion paths onto the LA endocardium (nearest wall vertex,
    // lifted slightly into the cavity) so they sit on the antrum, not in the blood pool.
    const laWall = meshVertices('la');
    const onLaWall = pt => {
      if (!laWall.length) return pt;
      let best = laWall[0], bestD = Infinity;
      for (let i = 0; i < laWall.length; i += 2) {
        const d = laWall[i].distanceToSquared(pt);
        if (d < bestD) { bestD = d; best = laWall[i]; }
      }
      return best.clone().lerp(la, 0.05);
    };
    const smoothClosed = pts => pts.map((pt, i) => pt.clone().multiplyScalar(2)
      .add(pts[(i - 1 + pts.length) % pts.length]).add(pts[(i + 1) % pts.length]).multiplyScalar(0.25));

    function antralRing(osA, osB, fallbackCenter) {
      const center = osA && osB ? osA.clone().add(osB).multiplyScalar(0.5) : fallbackCenter;
      // Ring plane faces outward from the LA body through the vein pair.
      const normal = center.clone().sub(la).normalize();
      const spread = osA && osB ? osA.distanceTo(osB) : 0.55;
      const radius = spread * 0.5 + 0.16;
      const u = new THREE.Vector3(0, 1, 0).cross(normal).normalize();
      if (u.lengthSq() < 0.01) u.set(1, 0, 0);
      const v = new THREE.Vector3().crossVectors(normal, u).normalize();
      let pts = [];
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        pts.push(onLaWall(center.clone()
          .addScaledVector(u, Math.cos(a) * radius)
          .addScaledVector(v, Math.sin(a) * radius * 1.25))); // taller than wide (superior+inferior veins)
      }
      pts = smoothClosed(smoothClosed(pts));
      const spline = new THREE.CatmullRomCurve3(pts, true);
      const ringMesh = new THREE.Mesh(new THREE.TubeGeometry(spline, 40, 0.025, 8, true), matLesion.clone());
      spline.getPoints(14).forEach(pt => {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), matLesion.clone());
        dot.position.copy(pt);
        dot.userData = { pickId: 'pvi-waca', provenance: 'schematic', sourceName: 'WACA RF lesion' };
        ringMesh.add(dot);
        dot.position.sub(ringMesh.position);
      });
      return { ringMesh, center };
    }

    const leftRing = antralRing(lspv, lipv, new THREE.Vector3(la.x + 0.6, la.y + 0.1, la.z - 0.2));
    const rightRing = antralRing(rspv, ripv, new THREE.Vector3(la.x - 0.6, la.y + 0.1, la.z - 0.2));
    pviGroup.add(leftRing.ringMesh);
    pviGroup.add(rightRing.ringMesh);

    // Linear lesion helper: sample a chord, snap to the LA wall.
    const wallLine = (a, b, lift = new THREE.Vector3()) => {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        pts.push(onLaWall(a.clone().lerp(b, t).addScaledVector(lift, Math.sin(Math.PI * t))));
      }
      return new THREE.CatmullRomCurve3(pts);
    };
    const tagLine = (curve, pickId, name) => {
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.018, 8, false), matLesionGlow);
      mesh.name = name;
      mesh.userData = { pickId, provenance: 'schematic', sourceName: name };
      return mesh;
    };

    // Roof line: between the superior veins across the LA roof.
    const roofA = (lspv || leftRing.center).clone();
    const roofB = (rspv || rightRing.center).clone();
    pviGroup.add(tagLine(wallLine(roofA, roofB, new THREE.Vector3(0, 0.25, 0)), 'la-roof-line', 'LA roof line'));

    // Mitral isthmus line: from the LIPV ostium to the lateral mitral annulus.
    if (lipv && mvRim) {
      const lateralMitral = mvRim.reduce((best, v) => v.distanceTo(lipv) < best.distanceTo(lipv) ? v : best).clone();
      pviGroup.add(tagLine(wallLine(lipv, lateralMitral), 'mitral-isthmus-line', 'Mitral isthmus line'));
    }

    leftRing.ringMesh.name = 'Left WACA ring';
    leftRing.ringMesh.userData = { pickId: 'pvi-waca', provenance: 'schematic', sourceName: 'Left WACA ring' };
    rightRing.ringMesh.name = 'Right WACA ring';
    rightRing.ringMesh.userData = { pickId: 'pvi-waca', provenance: 'schematic', sourceName: 'Right WACA ring' };

    group.add(pviGroup);
    targets.pvi = pviGroup;

    initialized = true;
  }

  function setStep(stepIndex) {
    init();
    // stepIndex: 0: CTI, 1: Koch/AVNRT, 2: PVI/AF, 3: Full Overview, 4: Koch with synthetic EGM
    if (targets.cti) targets.cti.visible = (stepIndex === 0 || stepIndex === 3);
    if (targets.koch) targets.koch.visible = (stepIndex === 1 || stepIndex === 3 || stepIndex === 4);
    if (targets.pvi) targets.pvi.visible = (stepIndex === 2 || stepIndex === 3);
  }

  /** Show or hide an optional Koch layer: 'his', 'cs' (reference catheters) or 'lesions' (example RF). */
  function setOptional(key, visible) {
    if (!(key in shown)) return;
    shown[key] = Boolean(visible);
    for (const object of optional[key]) object.visible = shown[key];
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
    setOptional,
    getOptional: () => ({ ...shown }),
    kochCentre: () => kochCentre?.clone() ?? null,
    /** Move the slow pathway catheter tip to a Koch site { u, v } (koch-sp-model.js). */
    setKochTip(site) { init(); kochTip?.move(site); },
    getKochTip: () => (kochTip ? { ...kochTip.site } : null),
    labels,
    targets
  };
}

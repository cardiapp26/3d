// Coronary IVUS Lab · interactive 3D vessel and stent model (Three.js).
// Schematic native coronary tree; the selected pullback route is drawn with its real wall
// (EEM, eccentric lumen, plaque, optional longitudinal cut-away), the stent with strut-level
// apposition colours, the guide catheter, the IVUS catheter, guidewire and the imaging plane.
// Drag the imaging plane (or the vessel) to move the transducer; click another branch to pick it.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { CORONARY_TREE, PULLBACK_ROUTES, segmentForBranch } from './ivus-anatomy.js';
import { sliceLayout, MALAPPOSITION_MM } from './ivus-stent-model.js';

const HEART_CENTER = new THREE.Vector3(6, -52, -14);
const RADIAL = 44;
const CUT_HALF = (75 * Math.PI) / 180;
const COLORS = {
  wall: new THREE.Color('#c45b5f'),
  wallPlaque: new THREE.Color('#c9a25e'),
  lumen: new THREE.Color('#7d1d26'),
  plaque: new THREE.Color('#e3cd86'),
  calcium: new THREE.Color('#f7f5ee'),
  media: new THREE.Color('#5a2a2e'),
  adventitia: new THREE.Color('#d98c8c'),
  strutOk: new THREE.Color('#dfe6ee'),
  strutWarn: new THREE.Color('#f5b041'),
  strutBad: new THREE.Color('#ff4d4f'),
  branch: new THREE.Color('#b9585d')
};

const V3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);

/** Branch curves; each child starts on its parent at `atMm`. */
function buildTreeCurves() {
  const curves = {};
  for (const b of CORONARY_TREE) {
    let pts = b.pts.map(V3);
    const parent = b.parent && curves[b.parent];
    if (parent) {
      const u = b.atMm === 'end' ? 1 : Math.min(1, b.atMm / parent.getLength());
      pts = [parent.getPointAt(u), ...pts.slice(1)];
    }
    curves[b.id] = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  }
  return curves;
}

function routeCurve(curves, vessel) {
  const route = PULLBACK_ROUTES[vessel] || PULLBACK_ROUTES.LAD;
  const pts = [];
  route.chain.forEach((id, i) => {
    const p = curves[id].points;
    pts.push(...(i ? p.slice(1) : p));
  });
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
}

/** Parallel-transport frames; N starts on the epicardial side (away from the heart centre). */
function transportFrames(curve, us) {
  const T = us.map((u) => curve.getTangentAt(u).normalize());
  const N = [];
  const B = [];
  let n = curve.getPointAt(us[0]).sub(HEART_CENTER);
  n.sub(T[0].clone().multiplyScalar(n.dot(T[0])));
  if (n.lengthSq() < 1e-8) n = new THREE.Vector3(0, 0, 1);
  n.normalize();
  for (let i = 0; i < us.length; i++) {
    if (i) {
      const axis = new THREE.Vector3().crossVectors(T[i - 1], T[i]);
      if (axis.lengthSq() > 1e-12) n.applyAxisAngle(axis.normalize(), Math.acos(THREE.MathUtils.clamp(T[i - 1].dot(T[i]), -1, 1)));
      n.sub(T[i].clone().multiplyScalar(n.dot(T[i]))).normalize();
    }
    N.push(n.clone());
    B.push(new THREE.Vector3().crossVectors(T[i], n).normalize());
  }
  return { T, N, B };
}

// Screen convention shared with the cross-section: clock φ (0 = 12 o'clock) → N·cosφ + B·sinφ.
const dirAt = (N, B, phi, out = new THREE.Vector3()) => out.copy(N).multiplyScalar(Math.cos(phi)).addScaledVector(B, Math.sin(phi));
const inPlane = (N, B, x, y, out = new THREE.Vector3()) => out.copy(B).multiplyScalar(x).addScaledVector(N, y);

function taperedTube(curve, r0, r1, u0 = 0, u1 = 1, rings = 40, radial = 14) {
  const us = Array.from({ length: rings + 1 }, (_, i) => u0 + ((u1 - u0) * i) / rings);
  const { N, B } = transportFrames(curve, us);
  const pos = [];
  const idx = [];
  const d = new THREE.Vector3();
  us.forEach((u, i) => {
    const c = curve.getPointAt(u);
    const r = r0 + (r1 - r0) * (i / rings);
    for (let k = 0; k < radial; k++) {
      dirAt(N[i], B[i], (k / radial) * Math.PI * 2, d);
      pos.push(c.x + d.x * r, c.y + d.y * r, c.z + d.z * r);
    }
  });
  for (let i = 0; i < rings; i++) {
    for (let k = 0; k < radial; k++) {
      const a = i * radial + k;
      const b = i * radial + ((k + 1) % radial);
      idx.push(a, a + radial, b, b, a + radial, b + radial);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Route wall: outer (EEM), inner (lumen) and, with a cut window, the two cut faces. */
function buildRouteWall(curve, curveLen, frames, cutCenterFn) {
  const us = frames.map((f) => Math.min(1, f.sMm / curveLen));
  const { N, B } = transportFrames(curve, us);
  const cut = typeof cutCenterFn === 'function';
  const count = cut ? RADIAL + 1 : RADIAL;
  const outer = { pos: [], col: [] };
  const inner = { pos: [], col: [] };
  const faces = { pos: [], col: [], idx: [] };
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const centers = [];
  frames.forEach((f, i) => {
    const c = curve.getPointAt(us[i]);
    centers.push(c);
    const L = sliceLayout(f);
    const phiC = cut ? cutCenterFn(c, N[i], B[i]) : 0;
    const angles = Array.from({ length: count }, (_, k) => (cut ? phiC + CUT_HALF + ((Math.PI * 2 - 2 * CUT_HALF) * k) / RADIAL : (k / RADIAL) * Math.PI * 2));
    const tint = COLORS.wall.clone().lerp(COLORS.wallPlaque, Math.min(0.65, f.lesionWeight * 0.7));
    angles.forEach((phi) => {
      dirAt(N[i], B[i], phi, tmp);
      outer.pos.push(c.x + tmp.x * L.eemR, c.y + tmp.y * L.eemR, c.z + tmp.z * L.eemR);
      outer.col.push(tint.r, tint.g, tint.b);
      inPlane(N[i], B[i], L.lumenX, L.lumenY, tmp2).add(c).addScaledVector(tmp, L.lumenR);
      inner.pos.push(tmp2.x, tmp2.y, tmp2.z);
      inner.col.push(COLORS.lumen.r, COLORS.lumen.g, COLORS.lumen.b);
    });
    if (cut) {
      [angles[0], angles[angles.length - 1]].forEach((phi) => {
        dirAt(N[i], B[i], phi, tmp);
        const pIn = inPlane(N[i], B[i], L.lumenX, L.lumenY, new THREE.Vector3()).add(c).addScaledVector(tmp, L.lumenR);
        const media = Math.max(0.08, L.eemR * 0.06);
        const pMed = c.clone().addScaledVector(tmp, L.eemR - media);
        const pOut = c.clone().addScaledVector(tmp, L.eemR);
        const pAdv = c.clone().addScaledVector(tmp, L.eemR + media * 1.4);
        const calc = L.calciumAt(phi);
        const plaqueCol = calc ? COLORS.calcium : COLORS.plaque.clone().lerp(new THREE.Color('#e8b0a4'), 1 - Math.min(1, f.lesionWeight * 1.4));
        [[pIn, plaqueCol], [pMed, plaqueCol], [pMed, COLORS.media], [pOut, COLORS.media], [pOut, COLORS.adventitia], [pAdv, COLORS.adventitia]].forEach(([p, col]) => {
          faces.pos.push(p.x, p.y, p.z);
          faces.col.push(col.r, col.g, col.b);
        });
      });
    }
  });
  const ringIdx = (wrap) => {
    const idx = [];
    for (let i = 0; i < frames.length - 1; i++) {
      for (let k = 0; k < (wrap ? count : count - 1); k++) {
        const a = i * count + k;
        const b = i * count + ((k + 1) % count);
        idx.push(a, a + count, b, b, a + count, b + count);
      }
    }
    return idx;
  };
  const mk = (part, idx) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(part.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(part.col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  const result = { outer: mk(outer, ringIdx(!cut)), inner: mk(inner, ringIdx(!cut)), centers, us, N, B };
  if (cut) {
    // 12 vertices per ring: two edges × three bands × two points.
    for (let i = 0; i < frames.length - 1; i++) {
      for (let e = 0; e < 2; e++) {
        for (let band = 0; band < 3; band++) {
          const a = i * 12 + e * 6 + band * 2;
          const b = a + 12;
          faces.idx.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
    }
    result.faces = mk(faces, faces.idx);
  }
  return result;
}

/** Stent: zig-zag rings every 1 mm with connectors; vertex colour = local strut-to-wall gap. */
function buildStent(frames, wall) {
  const pos = [];
  const col = [];
  const crowns = 8;
  const tmp = new THREE.Vector3();
  const stented = frames.map((f, i) => ({ f, i })).filter(({ f }) => f.inStent);
  if (!stented.length) return null;
  const point = (i, phi) => {
    const f = frames[i];
    const L = sliceLayout(f);
    dirAt(wall.N[i], wall.B[i], phi, tmp);
    const p = inPlane(wall.N[i], wall.B[i], L.stentX, L.stentY, new THREE.Vector3()).add(wall.centers[i]).addScaledVector(tmp, L.stentR);
    const gap = f.branch ? 0 : L.gapAt(phi);
    const c = gap > MALAPPOSITION_MM ? COLORS.strutBad : gap > 0.1 ? COLORS.strutWarn : COLORS.strutOk;
    return { p, c };
  };
  const seg = (a, b) => {
    pos.push(a.p.x, a.p.y, a.p.z, b.p.x, b.p.y, b.p.z);
    col.push(a.c.r, a.c.g, a.c.b, b.c.r, b.c.g, b.c.b);
  };
  // frames are 0.5 mm apart: a ring spans two frames (crown valley at i, peak at i+1).
  for (let n = 0; n + 1 < stented.length; n += 2) {
    const i0 = stented[n].i;
    const i1 = stented[n + 1].i;
    for (let k = 0; k < crowns * 2; k++) {
      const phiA = (k / (crowns * 2)) * Math.PI * 2;
      const phiB = ((k + 1) / (crowns * 2)) * Math.PI * 2;
      const a = point(k % 2 ? i1 : i0, phiA);
      const b = point(k % 2 ? i0 : i1, phiB);
      seg(a, b);
    }
    const next = stented[n + 2];
    if (next) {
      for (let k = 0; k < crowns * 2; k += 4) {
        const phi = ((k + 1) / (crowns * 2)) * Math.PI * 2;
        seg(point(i1, phi), point(next.i, phi));
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

function label(text, cls = '') {
  const el = document.createElement('div');
  el.className = `ivus3d-label ${cls}`;
  el.textContent = text;
  return new CSS2DObject(el);
}

/**
 * Mounts the scene. Callbacks: onProbe(sMm) while dragging the imaging plane or the route,
 * onPick({ branchId, segmentId, vessel }) on a click elsewhere on the tree, onHover(info|null).
 */
export function createIvusModel3D(container, { onProbe, onPick, onHover } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  } catch (error) {
    container.innerHTML = '<p class="ivus3d-fallback">WebGL unavailable</p>';
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor('#06090f');
  container.appendChild(renderer.domElement);
  renderer.domElement.classList.add('ivus3d-canvas');
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'ivus3d-labels';
  container.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 1, 2000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.minDistance = 18;
  controls.maxDistance = 420;

  scene.add(new THREE.HemisphereLight('#dbe8ff', '#1b1010', 1.25));
  const key = new THREE.DirectionalLight('#ffffff', 1.5);
  key.position.set(60, 90, 120);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#7fb3ff', 0.6);
  rim.position.set(-80, -40, -60);
  scene.add(rim);

  // Context: translucent heart silhouette and aortic root.
  const heart = new THREE.Mesh(
    new THREE.SphereGeometry(1, 40, 28),
    new THREE.MeshStandardMaterial({ color: '#7a2f33', transparent: true, opacity: 0.08, depthWrite: false, roughness: 0.9 })
  );
  heart.scale.set(46, 58, 44);
  heart.position.copy(HEART_CENTER);
  heart.raycast = () => {};
  scene.add(heart);
  const aorta = new THREE.Mesh(
    new THREE.CylinderGeometry(12, 13.5, 46, 32, 1, true),
    new THREE.MeshStandardMaterial({ color: '#b7656a', transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide })
  );
  aorta.position.set(0, 24, 0);
  aorta.raycast = () => {};
  scene.add(aorta);

  const curves = buildTreeCurves();
  const treeGroup = new THREE.Group();
  const labelGroup = new THREE.Group();
  scene.add(treeGroup, labelGroup);
  const branchMeshes = {};
  for (const b of CORONARY_TREE) {
    const mesh = new THREE.Mesh(
      taperedTube(curves[b.id], b.d0 / 2, b.d1 / 2),
      new THREE.MeshStandardMaterial({ color: COLORS.branch, roughness: 0.55, metalness: 0.05, emissive: '#000000' })
    );
    mesh.userData.branchId = b.id;
    branchMeshes[b.id] = mesh;
    treeGroup.add(mesh);
    const tag = label(b.label, 'branch');
    tag.position.copy(curves[b.id].getPointAt(b.parent ? 0.55 : 0.5)).add(new THREE.Vector3(0, 2.5, 0));
    labelGroup.add(tag);
  }

  const routeGroup = new THREE.Group();
  scene.add(routeGroup);
  const probeGroup = new THREE.Group();
  scene.add(probeGroup);

  const mats = {
    outer: new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.4, depthWrite: false, roughness: 0.5, side: THREE.FrontSide }),
    outerCut: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: THREE.DoubleSide }),
    inner: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, side: THREE.DoubleSide }),
    faces: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }),
    stent: new THREE.LineBasicMaterial({ vertexColors: true }),
    catheter: new THREE.MeshStandardMaterial({ color: '#b8c2cc', roughness: 0.35, metalness: 0.2 }),
    guide: new THREE.MeshStandardMaterial({ color: '#8fa0b3', roughness: 0.4, transparent: true, opacity: 0.85 }),
    wire: new THREE.LineBasicMaterial({ color: '#cfd8e3' }),
    plane: new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
    planeEdge: new THREE.LineBasicMaterial({ color: '#7dd3fc' }),
    transducer: new THREE.MeshStandardMaterial({ color: '#22d3ee', emissive: '#0e7490', emissiveIntensity: 0.9 })
  };

  const probeLabel = label('IVUS', 'probe');
  scene.add(probeLabel);

  let current = null; // { vessel, curve, curveLen, frames, wall, sig }
  let probeMm = 0;
  let cutaway = false;
  let disposed = false;

  const disposeGroup = (group) => {
    group.children.slice().forEach((o) => {
      o.geometry?.dispose();
      group.remove(o);
    });
  };

  const cutCenter = (c, N, B) => {
    const v = camera.position.clone().sub(c);
    return Math.atan2(v.dot(B), v.dot(N));
  };

  function buildRoute(vessel, frames) {
    disposeGroup(routeGroup);
    const curve = routeCurve(curves, vessel);
    const curveLen = curve.getLength();
    const wall = buildRouteWall(curve, curveLen, frames, cutaway ? cutCenter : null);
    const outer = new THREE.Mesh(wall.outer, cutaway ? mats.outerCut : mats.outer);
    outer.renderOrder = 3;
    outer.userData.route = true;
    const inner = new THREE.Mesh(wall.inner, mats.inner);
    inner.userData.route = true;
    routeGroup.add(inner, outer);
    if (wall.faces) routeGroup.add(new THREE.Mesh(wall.faces, mats.faces));
    const stentGeo = buildStent(frames, wall);
    if (stentGeo) {
      const stent = new THREE.LineSegments(stentGeo, mats.stent);
      stent.renderOrder = 2;
      routeGroup.add(stent);
    }
    // Rest of the chain beyond the pullback length: plain tapered vessel.
    const route = PULLBACK_ROUTES[vessel] || PULLBACK_ROUTES.LAD;
    const uEnd = Math.min(1, route.lengthMm / curveLen);
    if (uEnd < 0.999) {
      const lastB = CORONARY_TREE.find((b) => b.id === route.chain.at(-1));
      const tail = new THREE.Mesh(taperedTube(curve, frames.at(-1).eemD / 2, lastB.d1 / 2, uEnd, 1, 30), mats.outerCut.clone());
      tail.material.color = COLORS.branch;
      tail.material.vertexColors = false;
      tail.userData.route = true;
      routeGroup.add(tail);
    }
    // Guide catheter from the ascending aorta to the ostium.
    const ost = curve.getPointAt(0);
    const guideCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(vessel === 'RCA' ? -2 : 2, 44, 2), new THREE.Vector3(ost.x * 0.4, 14, ost.z + 4), ost.clone().add(curve.getTangentAt(0).multiplyScalar(-3)), ost]);
    routeGroup.add(new THREE.Mesh(new THREE.TubeGeometry(guideCurve, 40, 1.0, 10), mats.guide));
    // Guidewire to the distal end of the chain.
    const wirePts = Array.from({ length: 80 }, (_, i) => curve.getPointAt(i / 79));
    routeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(wirePts), mats.wire));
    // Branches of the active chain are drawn by the route; hide their simple tubes.
    Object.entries(branchMeshes).forEach(([id, mesh]) => { mesh.visible = !route.chain.includes(id); });
    current = { vessel, curve, curveLen, frames, wall };
  }

  function placeProbe() {
    disposeGroup(probeGroup);
    if (!current) return;
    const { curve, curveLen, frames, wall } = current;
    const i = Math.max(0, Math.min(frames.length - 1, Math.round(probeMm / (frames[1].sMm - frames[0].sMm))));
    const u = wall.us[i];
    const c = wall.centers[i];
    const t = curve.getTangentAt(u);
    const n = Math.max(2, Math.round((u * curveLen) / 2));
    const pts = Array.from({ length: n + 1 }, (_, k) => curve.getPointAt((u * k) / n));
    if (pts.length >= 2) probeGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(4, n), 0.48, 8), mats.catheter));
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), t);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.4, 12), mats.transducer);
    tip.position.copy(c);
    tip.quaternion.copy(q);
    probeGroup.add(tip);
    const r = frames[i].eemD / 2 + 1.6;
    const plane = new THREE.Mesh(new THREE.CircleGeometry(r, 48), mats.plane);
    plane.position.copy(c);
    plane.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), t));
    plane.userData.probe = true;
    plane.renderOrder = 4;
    probeGroup.add(plane);
    const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 48 }, (_, k) => new THREE.Vector3(Math.cos((k / 48) * Math.PI * 2) * r, Math.sin((k / 48) * Math.PI * 2) * r, 0))), mats.planeEdge);
    edge.position.copy(c);
    edge.quaternion.copy(plane.quaternion);
    probeGroup.add(edge);
    probeLabel.position.copy(c).addScaledVector(wall.N[i], r + 2.5);
    probeLabel.element.textContent = `IVUS · ${frames[i].sMm.toFixed(1)} mm`;
  }

  // Pointer: drag the imaging plane / route to move the transducer; click a branch to pick it.
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let dragging = false;
  let downAt = null;
  const setRay = (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  };
  const nearestRouteMm = () => {
    if (!current) return null;
    let best = Infinity;
    let bestI = 0;
    current.wall.centers.forEach((c, i) => {
      const d = raycaster.ray.distanceSqToPoint(c);
      if (d < best) { best = d; bestI = i; }
    });
    return current.frames[bestI].sMm;
  };
  const routeHit = () => raycaster.intersectObjects([...probeGroup.children, ...routeGroup.children], false).find((h) => h.object.userData.probe || h.object.userData.route);
  const branchHit = () => raycaster.intersectObjects(Object.values(branchMeshes).filter((m) => m.visible), false)[0];

  const onDown = (e) => {
    setRay(e);
    downAt = { x: e.clientX, y: e.clientY };
    if (routeHit()) {
      dragging = true;
      controls.enabled = false;
      renderer.domElement.setPointerCapture?.(e.pointerId);
      const mm = nearestRouteMm();
      if (mm !== null) onProbe?.(mm);
    }
  };
  const onMove = (e) => {
    setRay(e);
    if (dragging) {
      const mm = nearestRouteMm();
      if (mm !== null) onProbe?.(mm);
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const hit = branchHit();
    Object.values(branchMeshes).forEach((m) => m.material.emissive.set(hit && m === hit.object ? '#3b1d1f' : '#000000'));
    renderer.domElement.style.cursor = routeHit() ? 'grab' : hit ? 'pointer' : '';
    onHover?.(hit ? { branchId: hit.object.userData.branchId, x: e.clientX, y: e.clientY } : null);
  };
  const onUp = (e) => {
    const moved = downAt ? Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) : 99;
    if (dragging) {
      dragging = false;
      controls.enabled = true;
      renderer.domElement.releasePointerCapture?.(e.pointerId);
    } else if (moved < 6) {
      setRay(e);
      const hit = branchHit();
      if (hit) {
        const id = hit.object.userData.branchId;
        const curve = curves[id];
        let bestU = 0;
        let best = Infinity;
        for (let k = 0; k <= 40; k++) {
          const d = curve.getPointAt(k / 40).distanceToSquared(hit.point);
          if (d < best) { best = d; bestU = k / 40; }
        }
        const vessel = id === 'lcx' ? 'LCX' : id === 'rca' ? 'RCA' : id === 'lad' || id === 'lm' ? 'LAD' : null;
        onPick?.({ branchId: id, segmentId: segmentForBranch(id, bestU), vessel });
      }
    }
    downAt = null;
  };
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointermove', onMove);
  renderer.domElement.addEventListener('pointerup', onUp);
  renderer.domElement.addEventListener('pointercancel', onUp);
  renderer.domElement.addEventListener('pointerleave', () => onHover?.(null));
  controls.addEventListener('end', () => {
    if (cutaway && current) {
      buildRoute(current.vessel, current.frames);
      placeProbe();
    }
  });

  function resize() {
    const wpx = container.clientWidth || 600;
    const hpx = container.clientHeight || 420;
    renderer.setSize(wpx, hpx, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    labelRenderer.setSize(wpx, hpx);
    camera.aspect = wpx / hpx;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  const fly = { from: null, to: null, t: 1 };
  function viewRoute(vessel) {
    const curve = routeCurve(curves, vessel);
    const route = PULLBACK_ROUTES[vessel] || PULLBACK_ROUTES.LAD;
    const mid = curve.getPointAt(Math.min(1, (route.lengthMm * 0.45) / curve.getLength()));
    const dir = vessel === 'RCA' ? new THREE.Vector3(-0.75, 0.2, 0.65) : vessel === 'LCX' ? new THREE.Vector3(0.85, 0.35, -0.2) : new THREE.Vector3(0.35, 0.3, 1);
    flyTo(mid, mid.clone().addScaledVector(dir.normalize(), 120));
  }
  function flyTo(target, position) {
    fly.from = { target: controls.target.clone(), position: camera.position.clone() };
    fly.to = { target, position };
    fly.t = 0;
  }

  let raf = 0;
  function loop() {
    if (disposed) return;
    raf = requestAnimationFrame(loop);
    if (document.hidden || !container.isConnected) return;
    if (fly.t < 1) {
      fly.t = Math.min(1, fly.t + 0.06);
      const k = 1 - (1 - fly.t) ** 3;
      controls.target.lerpVectors(fly.from.target, fly.to.target, k);
      camera.position.lerpVectors(fly.from.position, fly.to.position, k);
    }
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }

  camera.position.set(60, 10, 190);
  controls.target.set(6, -40, 0);
  resize();
  loop();

  let lastSig = '';
  return {
    /** Rebuilds geometry when the model changes; moves the probe every call. */
    update({ vessel, frames, sig, probe, cut, labels }) {
      const vesselChanged = !current || current.vessel !== vessel;
      if (cut !== undefined && cut !== cutaway) {
        cutaway = cut;
        lastSig = '';
      }
      if (sig !== lastSig) {
        buildRoute(vessel, frames);
        lastSig = sig;
      }
      if (vesselChanged) viewRoute(vessel);
      probeMm = probe;
      placeProbe();
      if (labels !== undefined) {
        labelGroup.visible = labels;
        probeLabel.visible = labels;
        labelRenderer.domElement.style.display = labels ? '' : 'none';
      }
    },
    focusProbe() {
      if (!current) return;
      const i = Math.round(probeMm / (current.frames[1].sMm - current.frames[0].sMm));
      const c = current.wall.centers[Math.max(0, Math.min(current.wall.centers.length - 1, i))];
      const dir = camera.position.clone().sub(controls.target).normalize();
      flyTo(c.clone(), c.clone().addScaledVector(dir, 38));
    },
    resetView() {
      if (current) viewRoute(current.vessel);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      disposeGroup(routeGroup);
      disposeGroup(probeGroup);
      scene.traverse((o) => {
        o.geometry?.dispose?.();
        if (o.material) [].concat(o.material).forEach((m) => m.dispose?.());
      });
      renderer.dispose();
      container.innerHTML = '';
    }
  };
}

/**
 * 3D view of the conduction lesson: the real atlas heart (public/models/cardiovascular.glb,
 * loaded like src/ecg/davinci-atlas.js: chamber bounds centred, longest side 3.3) with
 * semi-transparent chambers, and the conduction system drawn as tubes on the geometry heart.js
 * measures (baked into src/ecg/ecg-atlas-conduction.js and ./conduction-atlas-extras.js).
 * While a beat plays, the impulse runs along each tube, the atria and the ventricles change
 * colour in their activation order (yellow wavefront, orange depolarised), a red cross marks
 * a blocked structure, and the blood-supply overlay colours tubes and coronaries by artery.
 * Loaded on demand by conduction-panel.js (the EPS page does not need three.js otherwise).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { ATLAS_URL, normalizedParts, normalizeAtlasName } from '../atlas.js';
import { ATLAS_CONDUCTION as C } from '../ecg/ecg-atlas-conduction.js';
import { ATLAS_CONDUCTION_EXTRAS as X } from './conduction-atlas-extras.js';
import { STRUCTURE_IDS, ARTERIES, impulseProgress, blockReached, localTime, activationTime, rescaleTimes, simplifyPath, supplyColors } from './conduction-model.js';

const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const last = (a) => a[a.length - 1];
const DIST = 7.8;
const TARGET = Object.freeze([0, 0.15, 0]);
const VIEWS = Object.freeze({
  anterior: [0, 0.4, DIST],
  rao: [-DIST * Math.sin(Math.PI / 6), 0.4, DIST * Math.cos(Math.PI / 6)],
  lao: [DIST * Math.sin(Math.PI / 4), 0.4, DIST * Math.cos(Math.PI / 4)],
  posterior: [0, 0.4, -DIST]
});
const RADIUS = Object.freeze({ internodal: 0.016, bachmann: 0.03, his: 0.03, rbb: 0.02, lbb: 0.027, laf: 0.018, lpf: 0.024, septal: 0.013, purkinje: 0.011 });
const COLOR = Object.freeze({ idle: '#c9a447', selected: '#ffe27a', glow: '#fff6c8', head: '#ffffff', block: '#ff4d4d', wave: new THREE.Color('#fff2a0'), depolarised: new THREE.Color('#ff6a2a') });
const VESSEL_IDS = new Set(['aorta', 'pa', 'svc', 'ivc', 'lspv', 'lipv', 'rspv', 'ripv']);
const CORONARY_ARTERY = Object.freeze({ rca: 'rca', rpl: 'rca', lcx: 'lcx', lad: 'lad', septal: 'lad', lm: 'lad' });
const PLATEAU = Object.freeze({ atria: 140, ventricles: 270 });

/**
 * @param {{ getLang: () => string, text: () => object, onSelect: (id: string) => void,
 *   onStatus: (status: 'loading'|'ready'|'failed') => void }} options
 */
export function createConductionAtlas({ getLang, text, onSelect, onStatus }) {
  const element = document.createElement('div');
  element.className = 'cond-atlas';
  const host = document.createElement('div');
  host.className = 'cond-webgl';
  const labels = document.createElement('div');
  labels.className = 'cond-labels';
  labels.setAttribute('aria-hidden', 'true');
  element.append(host, labels);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    onStatus('failed');
    return { element, ok: false, setState() {}, view() {}, screenPoint: () => null, destroy() { element.remove(); } };
  }
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x0a1228, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.append(renderer.domElement);
  renderer.domElement.setAttribute('role', 'img');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(...VIEWS.anterior);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...TARGET); controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 3.8; controls.maxDistance = 12;
  scene.add(new THREE.HemisphereLight(0xf5efff, 0x34404d, 2.4));
  for (const [pos, intensity] of [[[3, 5, 7], 2.8], [[-4, 1, 3], 1.3], [[1, 3, -5], 1.8]]) {
    const light = new THREE.DirectionalLight(0xffece0, intensity); light.position.set(...pos); scene.add(light);
  }
  const heart = new THREE.Group(), system = new THREE.Group();
  scene.add(heart, system);
  const chambers = [], vessels = [], coronaries = [], hitTargets = [], pins = [];
  const parts = new Map(STRUCTURE_IDS.map((id) => [id, { tubes: [], nodes: [], block: null, anchor: null }]));
  let state = { beat: null, t: null, selected: 'sa', supply: false, labels: true };
  let destroyed = false, dirty = true, frame = 0, loaded = false, colouredAt = undefined, activated = { atria: 0, ventricles: 0 };
  const actCache = new Map();

  const disposeNode = (node) => node.traverse((o) => {
    o.geometry?.dispose();
    for (const m of [o.material].flat().filter(Boolean)) m.dispose();
  });

  function tube(id, points, radius) {
    const curve = new THREE.CatmullRomCurve3(points.map(V));
    const tubular = Math.max(24, Math.round(curve.getLength() * 40)), radial = 8;
    const geometry = new THREE.TubeGeometry(curve, tubular, radius, radial, false);
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3).fill(1), 3));
    const base = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: COLOR.idle, emissive: '#3d2c06', roughness: 0.4, metalness: 0.1, vertexColors: true }));
    base.renderOrder = 5;
    const glow = new THREE.Mesh(new THREE.TubeGeometry(curve, tubular, radius * 1.25, radial, false), new THREE.MeshBasicMaterial({ color: COLOR.glow, toneMapped: false, transparent: true, opacity: 0.95, depthTest: false }));
    glow.renderOrder = 12; glow.visible = false;
    const head = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.035, radius * 1.9), 14, 10), new THREE.MeshBasicMaterial({ color: COLOR.head, toneMapped: false, depthTest: false }));
    head.renderOrder = 13; head.visible = false;
    const hit = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.min(tubular, 40), Math.max(0.06, radius * 3), 6, false), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }));
    hit.userData.structure = id;
    system.add(base, glow, head, hit);
    hitTargets.push(hit);
    const record = { curve, base, glow, head, segments: tubular, radial };
    parts.get(id).tubes.push(record);
    return record;
  }

  function node(id, point, radius) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 18), new THREE.MeshStandardMaterial({ color: COLOR.idle, emissive: '#5a3c00', roughness: 0.3, metalness: 0.1, vertexColors: true }));
    mesh.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(mesh.geometry.attributes.position.count * 3).fill(1), 3));
    mesh.position.copy(V(point)); mesh.renderOrder = 6;
    const hit = new THREE.Mesh(new THREE.SphereGeometry(radius * 2.2, 12, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }));
    hit.position.copy(mesh.position); hit.userData.structure = id;
    system.add(mesh, hit); hitTargets.push(hit);
    parts.get(id).nodes.push(mesh);
  }

  function blockMarker(id) {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color: COLOR.block, toneMapped: false, depthTest: false, transparent: true });
    for (const angle of [Math.PI / 4, -Math.PI / 4]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.035), material);
      bar.rotation.z = angle; bar.renderOrder = 14; group.add(bar);
    }
    group.visible = false;
    system.add(group);
    parts.get(id).block = group;
  }

  // Structures on the baked atlas geometry.
  node('sa', C.sa, 0.085);
  node('avn', C.avn, 0.07);
  for (const path of [C.tractAnterior, C.tractMiddle, C.tractPosterior]) tube('internodal', path, RADIUS.internodal);
  const bachmannPath = simplifyPath([C.sa, ...X.bachmann], 0.12);
  tube('bachmann', bachmannPath, RADIUS.bachmann);
  for (const id of ['his', 'rbb', 'lbb', 'laf', 'lpf']) tube(id, C[id], RADIUS[id]);
  for (const path of [C.purkinjeRv, C.purkinjeLaf, C.purkinjeLpf]) tube('purkinje', path, RADIUS.purkinje);
  for (const id of STRUCTURE_IDS) blockMarker(id);
  const anchors = {
    sa: C.sa, avn: C.avn, internodal: C.tractMiddle[1], bachmann: bachmannPath[Math.floor(bachmannPath.length / 2)],
    his: last(C.his), rbb: C.rbb[3], lbb: C.lbb[2], laf: C.laf[3], lpf: C.lpf[3], purkinje: C.purkinjeLpf[1], septal: C.lbb[3]
  };

  function pin(id) {
    const span = document.createElement('span');
    span.className = 'cond-pin';
    span.dataset.structure = id;
    labels.append(span);
    pins.push({ id, span });
  }
  for (const id of STRUCTURE_IDS) pin(id);

  // Point of a structure along its first tube (block markers) or its node.
  function pointOn(id, f) {
    const part = parts.get(id);
    if (part.tubes.length) return part.tubes[0].curve.getPointAt(Math.min(1, Math.max(0, f)));
    return part.nodes[0]?.position.clone() ?? V(anchors[id]);
  }

  const raycaster = new THREE.Raycaster();
  let pointerDown = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { pointerDown = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!pointerDown || Math.hypot(e.clientX - pointerDown[0], e.clientY - pointerDown[1]) > 6) return;
    const box = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((e.clientX - box.left) / box.width * 2 - 1, -(e.clientY - box.top) / box.height * 2 + 1), camera);
    const hit = raycaster.intersectObjects(hitTargets, false)[0];
    if (hit) onSelect(hit.object.userData.structure);
  });

  function resize() {
    if (destroyed) return;
    const w = host.clientWidth, h = host.clientHeight;
    if (w < 1 || h < 1) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.zoom = Math.min(1, camera.aspect / 0.9); camera.updateProjectionMatrix(); dirty = true;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  controls.addEventListener('change', () => { dirty = true; });

  function positionLabels() {
    const t = text();
    for (const p of pins) {
      const point = V(anchors[p.id]).project(camera);
      const show = state.labels || p.id === state.selected;
      p.span.hidden = !show || point.z > 1;
      p.span.textContent = t.structure[p.id].short;
      p.span.classList.toggle('is-selected', p.id === state.selected);
      p.span.style.left = `${(point.x + 1) * host.clientWidth / 2}px`;
      p.span.style.top = `${(-point.y + 1) * host.clientHeight / 2}px`;
    }
  }

  function tick() {
    if (destroyed) return;
    frame = requestAnimationFrame(tick);
    controls.update();
    if (dirty && element.isConnected && host.clientWidth) {
      renderer.render(scene, camera);
      positionLabels();
      dirty = false;
    }
  }
  frame = requestAnimationFrame(tick);

  // ---- Colours ------------------------------------------------------------
  const tmp = new THREE.Color();
  function paintGeometry(geometry, colors, stripe) {
    const attr = geometry.attributes.color;
    const pos = geometry.attributes.position;
    for (let i = 0; i < attr.count; i++) {
      const c = colors.length > 1 && stripe(i, pos) ? colors[1] : colors[0];
      tmp.set(c); attr.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    attr.needsUpdate = true;
  }
  function paintStructures() {
    for (const [id, part] of parts) {
      const selected = id === state.selected;
      const colors = state.supply ? supplyColors(id) : [selected ? COLOR.selected : COLOR.idle];
      for (const tb of part.tubes) {
        const ringSize = tb.radial + 1;
        paintGeometry(tb.base.geometry, colors, (i) => Math.floor(i / ringSize / 4) % 2 === 1);
        tb.base.material.color.set('#ffffff');
        tb.base.material.emissive.set(selected ? '#7a5500' : state.supply ? '#111111' : '#3d2c06');
        tb.base.scale.setScalar(1);
      }
      for (const n of part.nodes) {
        paintGeometry(n.geometry, colors, (i, pos) => pos.getY(i) < 0);
        n.material.color.set('#ffffff');
        n.material.emissive.set(selected ? '#8a6000' : state.supply ? '#111111' : '#5a3c00');
      }
    }
    for (const m of coronaries) {
      const artery = CORONARY_ARTERY[m.userData.id];
      // Coronaries only with the overlay: their gold atlas colour reads as conduction tissue.
      m.visible = state.supply;
      m.material.color.set(artery ? ARTERIES[artery].color : m.userData.color);
      m.material.opacity = 0.95;
      m.material.transparent = m.material.opacity < 1;
      m.material.emissive?.set(state.supply && artery ? ARTERIES[artery].color : '#000000');
      if (m.material.emissiveIntensity !== undefined) m.material.emissiveIntensity = state.supply ? 0.35 : 0;
    }
  }

  // Activation times (ms) of every chamber vertex for the beat, cached per scenario.
  function activationOf(beat) {
    if (actCache.has(beat.id)) return actCache.get(beat.id);
    const septal = septalTargets[1] || C.lbb[3];
    const points = { septalLeft: septal, septalRight: C.rbb[2], lafEnd: last(C.laf), lpfEnd: last(C.lpf), apexLv: last(C.purkinjeLaf), rvModerator: X.moderatorBand, apexRv: last(C.purkinjeRv) };
    const vSources = Object.entries(beat.sources).filter(([k]) => points[k]).map(([k, t]) => ({ p: points[k], t }));
    const laLow = [X.laCentre[0], X.laCentre[1] - 0.35, X.laCentre[2]];
    const retrograde = beat.id === 'sinusArrest';
    const raSources = [{ p: retrograde ? C.avn : C.sa, t: 0 }];
    const laSources = [{ p: retrograde ? laLow : last(bachmannPath), t: 0 }];
    const out = new Map();
    const times = (mesh, sources) => {
      const pos = mesh.geometry.attributes.position, raw = new Array(pos.count);
      for (let i = 0; i < pos.count; i++) raw[i] = activationTime([pos.getX(i), pos.getY(i), pos.getZ(i)], sources, { velocity: 0.8 });
      return raw;
    };
    const ventricles = chambers.filter((m) => ['lv', 'rv'].includes(m.userData.id));
    const rawV = ventricles.map((m) => times(m, vSources));
    const flat = rescaleTimes(rawV.flat(), beat.qrsOnset, beat.qrsDuration);
    let k = 0;
    ventricles.forEach((m, i) => { out.set(m, Float32Array.from(flat.slice(k, k + rawV[i].length))); k += rawV[i].length; });
    for (const m of chambers.filter((x) => ['ra', 'la'].includes(x.userData.id))) {
      const ra = m.userData.id === 'ra';
      const range = ra ? beat.atria.ra : beat.atria.la;
      out.set(m, Float32Array.from(rescaleTimes(times(m, ra ? raSources : laSources), range[0], range[1] - range[0])));
    }
    actCache.set(beat.id, out);
    return out;
  }

  function paintChambers() {
    const { beat, t } = state;
    const key = beat && t !== null ? `${beat.id}:${Math.round(t)}` : 'rest';
    if (key === colouredAt) return;
    colouredAt = key;
    const act = beat && t !== null ? activationOf(beat) : null;
    const count = { atria: [0, 0], ventricles: [0, 0] };
    for (const m of chambers) {
      const attr = m.geometry.attributes.color, base = m.userData.baseColor;
      const times = act?.get(m);
      const atrial = ['ra', 'la'].includes(m.userData.id);
      const at = atrial && beat ? localTime(beat, 'atria', t) : t;
      const plateau = atrial ? PLATEAU.atria : PLATEAU.ventricles;
      for (let i = 0; i < attr.count; i++) {
        const dt = times ? at - times[i] : -1;
        if (dt < 0) tmp.copy(base);
        else if (dt < 22) tmp.copy(COLOR.wave);
        else if (dt < plateau) tmp.copy(COLOR.depolarised);
        else tmp.copy(COLOR.depolarised).lerp(base, Math.min(1, (dt - plateau) / 120));
        attr.setXYZ(i, tmp.r, tmp.g, tmp.b);
        if (dt >= 0) count[atrial ? 'atria' : 'ventricles'][0]++;
      }
      count[atrial ? 'atria' : 'ventricles'][1] += attr.count;
      attr.needsUpdate = true;
    }
    activated = { atria: count.atria[1] ? count.atria[0] / count.atria[1] : 0, ventricles: count.ventricles[1] ? count.ventricles[0] / count.ventricles[1] : 0 };
  }

  function paintImpulse() {
    const { beat, t } = state;
    for (const [id, part] of parts) {
      const f = beat && t !== null ? impulseProgress(beat, id, t) : null;
      const seg = beat?.segments[id];
      const reverse = Boolean(seg?.reverse);
      const after = f !== null && seg ? localTime(beat, id, t) - seg.end : 0;
      const running = f !== null && after <= 4;
      // Bright while the impulse runs, then a dimmer trace of the conducted path.
      const glowOpacity = after <= 0 ? 0.95 : Math.max(0.28, 0.95 - after / 160);
      for (const tb of part.tubes) {
        tb.glow.visible = f !== null && f > 0;
        tb.glow.material.opacity = glowOpacity;
        if (tb.glow.visible) {
          const total = tb.glow.geometry.index.count, per = tb.radial * 6;
          const n = Math.round(tb.segments * f) * per;
          tb.glow.geometry.setDrawRange(reverse ? total - n : 0, n);
        }
        tb.head.visible = Boolean(running && f > 0);
        if (tb.head.visible) tb.head.position.copy(tb.curve.getPointAt(reverse ? 1 - f : f));
      }
      for (const n of part.nodes) {
        const active = f !== null && running;
        const pulse = id === 'avn' && active ? 1 + 0.25 * Math.sin((t || 0) / 18) : 1;
        n.scale.setScalar(active ? 1.35 * pulse : 1);
        n.material.emissive.set(active ? '#ffcc33' : id === state.selected ? '#8a6000' : state.supply ? '#111111' : '#5a3c00');
      }
      const blocked = beat && beat.blocks[id] !== undefined;
      part.block.visible = Boolean(blocked);
      if (blocked) {
        part.block.position.copy(pointOn(id, beat.blocks[id]));
        part.block.quaternion.copy(camera.quaternion);
        const reached = t !== null && blockReached(beat, id, t);
        part.block.scale.setScalar(reached ? 1.25 : 0.9);
      }
    }
  }

  // ---- Atlas --------------------------------------------------------------
  let septalTargets = [];
  const decoder = new DRACOLoader().setDecoderPath('/draco/');
  const loader = new GLTFLoader().setDRACOLoader(decoder);
  onStatus('loading');
  loader.loadAsync(ATLAS_URL).then((gltf) => {
    if (destroyed) { disposeNode(gltf.scene); return; }
    gltf.scene.updateMatrixWorld(true);
    const found = [];
    gltf.scene.traverse((obj) => {
      if (!obj.isMesh) return;
      const association = gltf.parser.associations.get(obj);
      const name = gltf.parser.json.nodes[association?.nodes]?.name || obj.name;
      const part = normalizedParts.get(normalizeAtlasName(name));
      if (part) found.push({ obj, part });
    });
    const bounds = new THREE.Box3();
    found.filter((x) => x.part.layer === 'chambers').forEach((x) => bounds.expandByObject(x.obj));
    if (bounds.isEmpty()) throw new Error('Atlas chamber nodes missing');
    const centre = bounds.getCenter(new THREE.Vector3()), scale = 3.3 / Math.max(...bounds.getSize(new THREE.Vector3()).toArray());
    for (const { obj, part } of found) {
      const keep = part.layer === 'chambers' || part.layer === 'coronaries' || VESSEL_IDS.has(part.id);
      if (!keep || part.veinGroup === 'cardiac-veins') continue;
      const geometry = obj.geometry.clone().applyMatrix4(obj.matrixWorld);
      geometry.translate(-centre.x, -centre.y, -centre.z); geometry.scale(scale, scale, scale);
      if (part.layer === 'chambers') {
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3));
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.02, transparent: true, opacity: 0.34, depthWrite: false, side: THREE.DoubleSide }));
        mesh.userData = { ...part, baseColor: new THREE.Color(part.color).lerp(new THREE.Color('#4a5b68'), 0.6) };
        mesh.renderOrder = 2;
        heart.add(mesh); chambers.push(mesh);
      } else {
        const coronary = part.layer === 'coronaries';
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: part.color, roughness: 0.55, transparent: true, opacity: coronary ? 0.35 : 0.16, depthWrite: false, side: THREE.DoubleSide }));
        mesh.userData = part; mesh.renderOrder = coronary ? 3 : 1;
        heart.add(mesh); (coronary ? coronaries : vessels).push(mesh);
      }
    }
    buildSeptalAndTwigs();
    disposeNode(gltf.scene); decoder.dispose();
    loaded = true; element.dataset.loaded = 'true';
    colouredAt = undefined;
    paintStructures(); paintChambers(); paintImpulse();
    onStatus('ready');
    dirty = true; resize();
  }).catch((error) => {
    if (destroyed) return;
    element.dataset.loaded = 'error';
    console.warn('Conduction atlas:', error);
    onStatus('failed');
  });

  function verticesOf(id) {
    const out = [];
    for (const m of chambers.filter((x) => x.userData.id === id)) {
      const p = m.geometry.attributes.position;
      for (let i = 0; i < p.count; i += 3) out.push([p.getX(i), p.getY(i), p.getZ(i)]);
    }
    return out;
  }
  const nearest = (verts, q) => verts.reduce((b, v) => (Math.hypot(v[0] - q[0], v[1] - q[1], v[2] - q[2]) < Math.hypot(b[0] - q[0], b[1] - q[1], b[2] - q[2]) ? v : b), verts[0]);

  // Septal fibres: from the LBB trunk onto the mid left septal surface (the LV vertices nearest
  // to three points below the trunk). Purkinje twigs: short subendocardial branches from each
  // Purkinje branch end to nearby wall vertices of its ventricle, bent onto the wall.
  function buildSeptalAndTwigs() {
    const lv = verticesOf('lv'), rv = verticesOf('rv');
    if (!lv.length || !rv.length) return;
    const start = C.lbb[C.lbb.length - 1];
    septalTargets = [[0.15, -0.3, 0.12], [0.25, -0.45, 0.05], [0.05, -0.38, 0.2]].map((d) => nearest(lv, [start[0] + d[0], start[1] + d[1], start[2] + d[2]]));
    for (const target of septalTargets) {
      const mid = [(start[0] + target[0]) / 2, (start[1] + target[1]) / 2, (start[2] + target[2]) / 2];
      tube('septal', [start, mid.map((v, i) => v * 0.6 + nearest(lv, mid)[i] * 0.4), target], RADIUS.septal);
    }
    anchors.septal = septalTargets[1];
    for (const [branch, verts] of [[C.purkinjeRv, rv], [C.purkinjeLaf, lv], [C.purkinjeLpf, lv]]) {
      const end = last(branch);
      const candidates = verts.filter((v) => { const d = Math.hypot(v[0] - end[0], v[1] - end[1], v[2] - end[2]); return d > 0.22 && d < 0.55; });
      const picked = [];
      for (const v of candidates) {
        if (picked.length >= 4) break;
        if (picked.every((p) => Math.hypot(p[0] - v[0], p[1] - v[1], p[2] - v[2]) > 0.3)) picked.push(v);
      }
      for (const v of picked) {
        const mid = [(end[0] + v[0]) / 2, (end[1] + v[1]) / 2, (end[2] + v[2]) / 2];
        const wall = nearest(verts, mid);
        tube('purkinje', [end, mid.map((x, i) => x * 0.5 + wall[i] * 0.5), v], RADIUS.purkinje * 0.75);
      }
    }
  }

  function view(name) {
    const p = VIEWS[name] || VIEWS.anterior;
    camera.position.set(...p); camera.up.set(0, 1, 0); controls.target.set(...TARGET); controls.update();
    element.dataset.view = name; dirty = true;
  }

  function setState(next) {
    const prev = state;
    state = { ...state, ...next };
    if (prev.selected !== state.selected || prev.supply !== state.supply || prev.beat !== state.beat) paintStructures();
    if (loaded) paintChambers();
    paintImpulse();
    renderer.domElement.setAttribute('aria-label', text().canvasLabel);
    element.dataset.selected = state.selected;
    dirty = true;
  }

  /** Client coordinates of a structure's label point (browser tests click there). */
  function screenPoint(id) {
    const box = renderer.domElement.getBoundingClientRect();
    const p = V(anchors[id]).project(camera);
    return { x: box.left + (p.x + 1) * box.width / 2, y: box.top + (-p.y + 1) * box.height / 2 };
  }

  paintStructures();
  return {
    element, ok: true, setState, view, screenPoint,
    /** Share of atrial and ventricular vertices reached by the activation at the shown time. */
    getActivation: () => ({ ...activated }),
    destroy() {
      destroyed = true; cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); decoder.dispose();
      disposeNode(scene); renderer.dispose(); renderer.forceContextLoss(); element.remove();
    }
  };
}

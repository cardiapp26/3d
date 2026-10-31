/**
 * The Ashman lab's heart on the real 3D atlas (cardiovascular.glb, the same frame as heart.js
 * and davinci-atlas.js). Chambers are translucent; the conduction system that heart.js measures
 * on this atlas (baked into ecg-atlas-conduction.js) is drawn as tubes. The early atrial beat
 * spreads over the atrial walls from its focus, waits in the AV node, runs down the His and the
 * bundles, stops at a refractory bundle and colours the ventricles from the Purkinje ends, or
 * late, across the septum, on the blocked side. Drag to rotate, double-click to reset.
 * Until the atlas loads, or without WebGL, the 2D section of ecg-ashman-heart.js stands in.
 *
 * With origin 'sa' the same scene shows a sinus beat: the atria activate from the SA node and
 * drawState() takes a conduction snapshot directly (the ECG simulator's beat scrubber), including
 * the recovery of the atria and the ventricles during repolarization.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { ATLAS_URL, normalizedParts, normalizeAtlasName } from '../atlas.js';
import { ATLAS_CONDUCTION as AC } from './ecg-atlas-conduction.js';
import { conductionAt, drawConduction } from './ecg-ashman-heart.js';

const V = a => new THREE.Vector3(...a);
const CHAMBERS = Object.freeze(['ra', 'la', 'rv', 'lv']);
const CONTEXT = Object.freeze(['aorta', 'pa', 'svc', 'ivc', 'tricuspid', 'mitral', 'rv-papillary', 'lv-papillary']);
const MUSCLE = Object.freeze([0.42, 0.34, 0.4]);
const HOT = Object.freeze({ atria: [1, 0.7, 0.16], ventricles: [0.98, 0.3, 0.36] });
const FRONT = Object.freeze([1, 0.95, 0.78]);
const TINT = Object.freeze({ fast: 0xfde047, slow: 0xfb923c });
const VIEW = Object.freeze({ position: [3.1, 1.2, 9.3], target: [0.05, 0.05, 0.15] });
const SEGMENTS = 64, RADIAL = 8;
// Bundle curves start where the His ends; the fascicles start where the LBB trunk ends.
const PATHS = Object.freeze({
  his: AC.his, rbb: AC.rbb.slice(1), lbb: AC.lbb.slice(1), laf: AC.laf.slice(1), lpf: AC.lpf.slice(1)
});
const SOURCES = Object.freeze({
  lvOwn: [AC.laf.at(-1), AC.lpf.at(-1), AC.lbb.at(-1), AC.purkinjeLaf.at(-1), AC.purkinjeLpf.at(-1)],
  lvLate: [AC.rbb[3]],
  rvOwn: [AC.rbb.at(-1), AC.purkinjeRv.at(-1), AC.rbb[3]],
  rvLate: [AC.lbb.at(-1)]
});
const BLOCK_AT = Object.freeze({ avn: ['his', 0.08], rbb: ['rbb', 0.12], lbb: ['lbb', 0.45], laf: ['laf', 0.18] });

function glowTexture(star = false) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  if (star) {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 11 : 28; g.lineTo(32 + r * Math.cos(a), 32 + r * Math.sin(a)); }
    g.closePath(); g.fillStyle = '#fbbf24'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1f2937'; g.stroke();
  } else {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(253,224,71,.9)'); r.addColorStop(1, 'rgba(253,224,71,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Nearest distance from every vertex of a geometry to a set of points. */
function distances(geometry, points) {
  const p = geometry.attributes.position, out = new Float32Array(p.count), v = new THREE.Vector3(), src = points.map(V);
  let max = 0;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    let d = Infinity; for (const s of src) d = Math.min(d, v.distanceTo(s));
    out[i] = d; if (d > max) max = d;
  }
  return { d: out, max };
}

/** A few subendocardial Purkinje twigs from each end point toward nearby wall vertices. */
function twigs(geometry, ends, center) {
  const p = geometry.attributes.position, v = new THREE.Vector3(), out = [];
  for (const e of ends.map(V)) {
    const near = [];
    for (let i = 0; i < p.count; i += 3) { v.fromBufferAttribute(p, i); const d = v.distanceTo(e); if (d > .22 && d < .55) near.push(v.clone()); }
    for (let k = 0; k < 3 && near.length; k++) {
      const tip = near[Math.floor((k * near.length) / 3)].lerp(center, .06);
      const mid = e.clone().lerp(tip, .5).lerp(center, .05);
      out.push([e, mid, tip]);
    }
  }
  return out;
}

function makeTube(scene, points, radius, base, opacity) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => (p.isVector3 ? p : V(p))));
  const geo = new THREE.TubeGeometry(curve, SEGMENTS, radius, RADIAL, false);
  const dim = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: base, transparent: true, opacity, depthWrite: false }));
  const lit = new THREE.Mesh(new THREE.TubeGeometry(curve, SEGMENTS, radius * 1.7, RADIAL, false), new THREE.MeshBasicMaterial({ color: TINT.fast, toneMapped: false }));
  lit.renderOrder = dim.renderOrder = 5; lit.visible = false;
  scene.add(dim, lit);
  return { curve, dim, lit };
}
function setProgress(t, p, color) {
  if (p == null || p <= 0) { t.lit.visible = false; return; }
  t.lit.visible = true; t.lit.material.color.setHex(color);
  t.lit.geometry.setDrawRange(0, Math.max(1, Math.round(SEGMENTS * Math.min(1, p))) * RADIAL * 6);
}

/**
 * Conduction snapshot: progress 0..1 (null = not reached) of atria, avn, his, rbb, lbb, laf, lpf,
 * lv, rv; septal (0..1 arrow length), septalToRv, sa (SA node firing), purkinjeLit (false hides the
 * Purkinje twigs once the ventricles are activated), blockedAt {avn, rbb, lbb,
 * laf}, and recovery {atria, ventricles} 0..1 for repolarization.
 * @param {{ getLang?: () => string, origin?: 'pac' | 'sa' }} [options]
 * @returns {{ element: HTMLElement, draw: (pac: object, t: number, text: object) => void,
 *   drawState: (c: object, options: { bundles?: object, text: object, clock?: string }) => void, destroy: () => void }}
 */
export function createAshmanAtlas({ getLang = () => 'tr', origin = 'pac' } = {}) {
  const element = document.createElement('div');
  element.className = 'ash-3d'; element.dataset.loaded = 'false';
  // The Ashman lab's heart and the simulator's sinus-beat heart are told apart by their marker.
  element.dataset[origin === 'sa' ? 'activationHeart' : 'ashHeart'] = '';
  const flat = document.createElement('canvas'); flat.className = 'ecgc-canvas ash-3d-flat'; flat.setAttribute('role', 'img');
  const host = document.createElement('div'); host.className = 'ash-3d-gl'; host.hidden = true;
  const labels = document.createElement('div'); labels.className = 'ash-3d-labels'; labels.setAttribute('aria-hidden', 'true');
  const clock = document.createElement('span'); clock.className = 'ash-3d-time';
  const hint = document.createElement('span'); hint.className = 'ash-3d-hint';
  element.append(flat, host, labels, clock, hint);
  let last = null, loaded = false, destroyed = false, gl = null;
  const tr = (a, b) => (getLang() === 'en' ? b : a);
  if (origin === 'sa') flat.hidden = true;

  function draw(pac, t, text) {
    last = () => draw(pac, t, text);
    const since = Math.round(t - pac.a);
    clock.textContent = `P′ ${since >= 0 ? '+' : '−'}${Math.abs(since)} ms`;
    if (!loaded) { drawConduction(flat, pac, t, text); return; }
    gl.update(conductionAt(pac, t), pac.bundles, text);
  }
  function drawState(c, { bundles = null, text, clock: clockText = '' }) {
    last = () => drawState(c, { bundles, text, clock: clockText });
    clock.textContent = clockText;
    if (!loaded) { hint.textContent = tr('3B kalp yükleniyor…', 'Loading the 3D heart…'); return; }
    gl.update(c, bundles, text);
  }

  try { gl = buildScene(); } catch { element.dataset.loaded = 'error'; }

  function buildScene() {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2)); renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    host.append(renderer.domElement);
    renderer.domElement.setAttribute('role', 'img');
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, .1, 50);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false; controls.minDistance = 4.5; controls.maxDistance = 13;
    const reset = () => { camera.position.set(...VIEW.position); controls.target.set(...VIEW.target); controls.update(); render(); };
    scene.add(new THREE.HemisphereLight(0xf5efff, 0x2a3442, 2.4));
    for (const [pos, k] of [[[3, 5, 7], 2.6], [[-4, 1, 3], 1.2], [[1, 3, -5], 1.6]]) { const l = new THREE.DirectionalLight(0xffece0, k); l.position.set(...pos); scene.add(l); }
    const world = new THREE.Group(); scene.add(world);
    const state = { chambers: {}, tubes: {}, tracts: [], purkinje: { lv: [], rv: [] }, blocks: [], marks: {} };

    const decoder = new DRACOLoader().setDecoderPath('/draco/');
    new GLTFLoader().setDRACOLoader(decoder).loadAsync(ATLAS_URL).then(gltf => {
      decoder.dispose();
      if (destroyed) return;
      addAtlas(gltf, world, state, origin);
      addConduction(world, state);
      loaded = true; host.hidden = false; flat.hidden = true; element.dataset.loaded = 'true';
      resize(); reset();
      last?.();
    }).catch(() => { decoder.dispose(); if (!destroyed) element.dataset.loaded = 'error'; });

    function render() {
      if (!loaded) return;
      renderer.render(scene, camera);
      placeLabels();
    }
    function resize() {
      const w = element.clientWidth, h = element.clientHeight; if (!(w > 1 && h > 1)) return;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); render();
    }
    const observer = new ResizeObserver(resize); observer.observe(element);
    controls.addEventListener('change', render);
    renderer.domElement.addEventListener('dblclick', reset);

    const pins = new Map();
    function pin(key, text, at, cls = '') {
      let node = pins.get(key);
      if (!node) { node = document.createElement('span'); labels.append(node); pins.set(key, node); }
      node.className = `ash-3d-pin ${cls}`; node.textContent = text; node.dataset.at = JSON.stringify(at); node.hidden = false;
    }
    function placeLabels() {
      const w = element.clientWidth, h = element.clientHeight, v = new THREE.Vector3();
      for (const node of pins.values()) {
        if (node.hidden) continue;
        v.fromArray(JSON.parse(node.dataset.at)).project(camera);
        node.style.left = `${((v.x + 1) / 2) * w}px`; node.style.top = `${((1 - v.y) / 2) * h}px`;
      }
    }

    function update(c, b, text) {
      paintChambers(state, c, b);
      paintConduction(state, b, c);
      state.marks.sa.material.color.setHex(c.sa ? 0xfde047 : 0x94a3b8);
      state.marks.sa.scale.setScalar(c.sa ? 1.5 : 1);
      for (const node of pins.values()) node.hidden = true;
      pin('sa', text.sa, AC.sa, 'is-left'); pin('avn', text.avn, AC.avn, 'is-left'); pin('his', text.his, AC.his.at(-1), 'is-up');
      pin('rbb', text.rbb, AC.rbb.at(-1), 'is-left'); pin('lbb', text.lbb, AC.lbb.at(-1), 'is-right'); pin('laf', text.laf, AC.laf.at(-1), 'is-right'); pin('lpf', text.lpf, AC.lpf.at(-1), 'is-right');
      if (origin === 'pac') pin('pac', 'P′', state.focus.toArray(), 'is-pac is-right');
      const blocked = Object.keys(c.blockedAt).filter(k => c.blockedAt[k] && BLOCK_AT[k] && !(k === 'rbb' && c.blockedAt.lbb));
      for (const key of blocked) pin(`block-${key}`, text.block, blockPoint(state, key).toArray(), { laf: 'is-block is-low', rbb: 'is-block is-west', avn: 'is-block is-west' }[key] || 'is-block');
      if (c.septal > .25) pin('septal', text.septal, septalTip(state).toArray(), 'is-septal');
      hint.textContent = tr('Sürükle: döndür · çift tık: önden', 'Drag to rotate · double-click: front');
      renderer.domElement.setAttribute('aria-label', text.aria || '');
      render();
    }
    return {
      update,
      dispose() { observer.disconnect(); controls.dispose(); scene.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose?.(); }); renderer.dispose(); renderer.forceContextLoss(); }
    };
  }

  return {
    element, draw, drawState,
    destroy() { destroyed = true; gl?.dispose(); element.remove(); }
  };
}

function addAtlas(gltf, world, state, origin = 'pac') {
  gltf.scene.updateMatrixWorld(true);
  const found = [];
  gltf.scene.traverse(obj => {
    if (!obj.isMesh) return;
    const node = gltf.parser.associations.get(obj)?.nodes, name = gltf.parser.json.nodes[node]?.name || obj.name;
    const part = normalizedParts.get(normalizeAtlasName(name));
    if (part && (CHAMBERS.includes(part.id) || CONTEXT.includes(part.id))) found.push({ obj, part });
  });
  const bounds = new THREE.Box3();
  found.filter(f => CHAMBERS.includes(f.part.id)).forEach(f => bounds.expandByObject(f.obj));
  if (bounds.isEmpty()) throw new Error('Atlas chamber nodes missing');
  const centre = bounds.getCenter(new THREE.Vector3()), scale = 3.3 / Math.max(...bounds.getSize(new THREE.Vector3()).toArray());
  for (const { obj, part } of found) {
    const geometry = obj.geometry.clone().applyMatrix4(obj.matrixWorld);
    geometry.translate(-centre.x, -centre.y, -centre.z); geometry.scale(scale, scale, scale);
    geometry.computeVertexNormals();
    if (CHAMBERS.includes(part.id)) {
      geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 4), 4));
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: .6, metalness: 0 }));
      world.add(mesh);
      state.chambers[part.id] = { mesh, dist: {} };
    } else {
      const ghost = part.layer === 'valves' ? .16 : .12;
      world.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: part.color, transparent: true, opacity: ghost, depthWrite: false, side: THREE.DoubleSide, roughness: .7 })));
    }
  }
  gltf.scene.traverse(o => { o.geometry?.dispose(); o.material?.dispose?.(); });
  // The early beat starts on the lateral roof of the left atrium; a sinus beat at the SA node.
  const la = state.chambers.la.mesh.geometry.attributes.position, v = new THREE.Vector3(), focus = new THREE.Vector3();
  let best = -Infinity;
  if (origin === 'sa') focus.copy(V(AC.sa));
  else for (let i = 0; i < la.count; i++) { v.fromBufferAttribute(la, i); const s = v.x + .6 * v.y; if (s > best) { best = s; focus.copy(v); } }
  state.focus = focus; state.origin = origin;
  for (const id of ['ra', 'la']) state.chambers[id].dist.pac = distances(state.chambers[id].mesh.geometry, [focus.toArray()]);
  for (const [id, side] of [['lv', 'lv'], ['rv', 'rv']]) {
    const ch = state.chambers[id];
    ch.dist.own = distances(ch.mesh.geometry, SOURCES[`${side}Own`]);
    ch.dist.late = distances(ch.mesh.geometry, SOURCES[`${side}Late`]);
  }
}

function addConduction(world, state) {
  for (const [key, pts] of Object.entries(PATHS)) state.tubes[key] = makeTube(world, pts, key === 'his' ? .026 : .02, 0x94a3b8, .8);
  for (const key of ['tractAnterior', 'tractMiddle', 'tractPosterior']) state.tracts.push(makeTube(world, AC[key], .012, 0x94a3b8, .45));
  const lvC = new THREE.Box3().setFromBufferAttribute(state.chambers.lv.mesh.geometry.attributes.position).getCenter(new THREE.Vector3());
  const rvC = new THREE.Box3().setFromBufferAttribute(state.chambers.rv.mesh.geometry.attributes.position).getCenter(new THREE.Vector3());
  const lvTwigs = [AC.purkinjeLaf, AC.purkinjeLpf, ...twigs(state.chambers.lv.mesh.geometry, [AC.laf.at(-1), AC.lpf.at(-1), AC.purkinjeLaf.at(-1), AC.purkinjeLpf.at(-1)], lvC)];
  const rvTwigs = [AC.purkinjeRv, ...twigs(state.chambers.rv.mesh.geometry, [AC.rbb.at(-1), AC.purkinjeRv.at(-1)], rvC)];
  for (const pts of lvTwigs) state.purkinje.lv.push(makeTube(world, pts, .009, 0x94a3b8, .5));
  for (const pts of rvTwigs) state.purkinje.rv.push(makeTube(world, pts, .009, 0x94a3b8, .5));
  const node = (at, r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), new THREE.MeshBasicMaterial({ color: 0x94a3b8, toneMapped: false })); m.position.copy(V(at)); m.renderOrder = 6; world.add(m); return m; };
  state.marks.sa = node(AC.sa, .055); state.marks.avn = node(AC.avn, .07);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthTest: false, transparent: true }));
  glow.scale.setScalar(.26); glow.renderOrder = 9; world.add(glow); state.heads = [glow];
  const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(true), depthTest: false, transparent: true }));
  star.position.copy(state.focus); star.scale.setScalar(.22); star.renderOrder = 9; star.visible = state.origin !== 'sa'; world.add(star); state.marks.star = star;
  for (const key of Object.keys(BLOCK_AT)) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.075, .02, 10, 28), new THREE.MeshBasicMaterial({ color: 0xef4444, depthTest: false, toneMapped: false }));
    ring.renderOrder = 10; ring.visible = false; world.add(ring); state.blocks.push({ key, ring });
  }
  const arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), .4, 0xfda4af, .12, .07);
  for (const part of [arrow.line, arrow.cone]) { part.material.depthTest = false; part.material.transparent = true; part.renderOrder = 11; }
  arrow.visible = false; world.add(arrow); state.septalArrow = arrow;
}

function septalTip(state) { const a = state.septalArrow; return a.position.clone().add(new THREE.Vector3(0, 1, 0).applyQuaternion(a.quaternion).multiplyScalar(a.line.scale.y)); }
function blockPoint(state, key) { const [path, f] = BLOCK_AT[key]; return state.tubes[path].curve.getPointAt(f); }

// `rec` (0..1) is repolarization: the last activated wall recovers first, back to resting muscle.
function paint(ch, distKey, p, hot, rec = 0) {
  const { d, max } = ch.dist[distKey], col = ch.mesh.geometry.attributes.color, arr = col.array;
  const r = p == null ? -1 : p * max * 1.02, band = max * .07, front = p != null && p < 1;
  const back = rec > 0 ? (1 - rec) * max * 1.04 : Infinity;
  for (let i = 0; i < d.length; i++) {
    const x = d[i], a = r >= 0 && x <= r && x < back ? 1 : 0, f = front ? Math.max(0, 1 - Math.abs(x - r) / band) : 0, k = i * 4;
    for (let c = 0; c < 3; c++) { const base = MUSCLE[c] + (hot[c] - MUSCLE[c]) * a; arr[k + c] = base + (FRONT[c] - base) * f; }
    arr[k + 3] = .14 + .4 * a + .45 * f;
  }
  col.needsUpdate = true;
}

function paintChambers(state, c, b) {
  for (const id of ['ra', 'la']) paint(state.chambers[id], 'pac', c.atria, HOT.atria, c.recovery?.atria || 0);
  const late = side => b?.[side === 'lv' ? 'lbb' : 'rbb']?.state === 'block';
  for (const id of ['lv', 'rv']) paint(state.chambers[id], late(id) ? 'late' : 'own', c[id], HOT.ventricles, c.recovery?.ventricles || 0);
}

function paintConduction(state, bundles, c) {
  const tone = k => (bundles?.[k]?.state === 'slow' ? TINT.slow : TINT.fast);
  setProgress(state.tubes.his, c.his, TINT.fast);
  for (const k of ['rbb', 'lbb', 'laf']) setProgress(state.tubes[k], c[k], tone(k));
  setProgress(state.tubes.lpf, c.lpf, TINT.fast);
  for (const t of state.tracts) setProgress(t, c.atria, 0xfbbf24);
  for (const side of ['lv', 'rv']) for (const t of state.purkinje[side]) setProgress(t, c[side] == null || c.purkinjeLit === false ? null : Math.min(1, c[side] * 2.5), TINT.fast);
  const avnActive = c.avn != null && c.avn < 1 && !c.blockedAt.avn;
  state.marks.avn.material.color.setHex(avnActive ? 0xfbbf24 : 0x94a3b8);
  state.marks.star.scale.setScalar(c.atria != null && c.atria < 1 ? .3 : .22);
  // The comet: the leading point of whatever is conducting right now.
  const head = state.heads[0], moving = [['his', c.his], ['rbb', c.rbb], ['lbb', c.lbb], ['laf', c.laf], ['lpf', c.lpf]].filter(([, p]) => p != null && p > 0 && p < 1);
  head.visible = avnActive || moving.length > 0;
  if (avnActive) head.position.copy(V(AC.avn));
  else if (moving.length) { const [k, p] = moving.at(-1); head.position.copy(state.tubes[k].curve.getPointAt(p)); }
  for (const { key, ring } of state.blocks) {
    ring.visible = Boolean(c.blockedAt[key]);
    if (!ring.visible) continue;
    const [path, f] = BLOCK_AT[key], curve = state.tubes[path].curve;
    ring.position.copy(curve.getPointAt(f)); ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), curve.getTangentAt(f));
  }
  const arrow = state.septalArrow;
  arrow.visible = c.septal > 0;
  if (arrow.visible) {
    const toRv = c.septalToRv ?? bundles?.rbb?.state === 'block', from = V(toRv ? SOURCES.rvLate[0] : SOURCES.lvLate[0]), to = V(toRv ? SOURCES.lvLate[0] : SOURCES.rvLate[0]);
    arrow.position.copy(from); arrow.setDirection(to.clone().sub(from).normalize()); arrow.setLength(Math.max(.15, from.distanceTo(to) * c.septal), .12, .07);
  }
}

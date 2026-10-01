import * as THREE from 'three';
import { measureEchoAnatomy, echoItems, surfaceExit, chestSurface, ECHO_STRUCTURES } from './echo-anatomy.js';
import { TTE_VIEWS, TEE_VIEWS, ICE_VIEWS, SECTOR_ANGLE, viewById, tteBase, teePath, teePreset, icePath, icePreset } from './echo-views.js';
import { tteFrame, teeFrame, iceFrame } from './echo-probe.js';
import { sectionMeshes } from './echo-section.js';
import { evaluateView, visibleLengths, imagePoint, CAVAL_OFF_PLANE } from './echo-training.js';
import { drawEchoSector } from './echo-renderer.js';
import { createEchoPanel } from './echo-panel.js';

/*
 * Echocardiography mode (research/TTE_TEE_ENTEGRASYON_RAPORU.md): the probe
 * and its imaging plane in the 3D scene, the 2D section of the same plane in
 * the panel, both from the same (current, beating) geometry and phase.
 * Freezing stops the shared heartbeat, so the 3D and 2D images stop together.
 */
const HULL_IDS = ['lv', 'rv', 'la', 'ra', 'aorta', 'pa'];
const STRUCTURE_INFO = Object.fromEntries(ECHO_STRUCTURES.map(s => [s.id, { color: s.color, label: s.label }]));
const MIN_SECTION_INTERVAL = 30;   // ms between sections while the heart beats

/**
 * @param {{ heart: object, mount: HTMLElement, getLang: () => 'tr'|'en' }} deps
 */
export function createEchoMode({ heart, mount, getLang }) {
  let active = false, anatomy = null, items = null, path = null, icePathData = null, hull = null, chest = null, panel = null, overlay = null;
  const VIEWS = { tte: TTE_VIEWS, tee: TEE_VIEWS, ice: ICE_VIEWS };
  const modalityOf = view => (TTE_VIEWS.includes(view) ? 'tte' : TEE_VIEWS.includes(view) ? 'tee' : 'ice');
  const state = {
    modality: 'tte', view: 'plax', style: 'anatomy', labels: true, sectorAngle: SECTOR_ANGLE,
    locked: null,  // modality fixed by the app mode (TTE or TEE); the panel then hides its switch
    tte: { rotation: 0, tilt: 0, rock: 0, slideLateral: 0, slideElevation: 0 }, tee: null, ice: null, depth: 4,
    task: null,  // { target: viewId, done: boolean, start: probe pose at the start }
    frozen: false  // stopped with the panel's freeze button (the badge says so)
  };
  let lastSection = 0, lastResult = null;
  const getMeshes = id => heart.getMeshes(id).filter(m => !m.userData.micro);

  function ensureAnatomy() {
    if (anatomy) return true;
    if (!getMeshes('lv').length) return false;          // atlas not loaded yet
    try {
      anatomy = heart.withRestPose(() => measureEchoAnatomy({ getMeshes }));
    } catch (error) {
      console.error('Echo landmarks unavailable:', error);
      return false;
    }
    // At rest: the LA/LAA split and the vertex welds are cached from this pose.
    items = heart.withRestPose(() => {
      const list = echoItems(getMeshes);
      sectionMeshes(list, { origin: [0, 0, 0], beam: [0, 0, 1], lateral: [1, 0, 0], normal: [0, 1, 0] });
      return list;
    });
    hull = HULL_IDS.flatMap(getMeshes);
    chest = heart.withRestPose(() => chestSurface(hull));
    path = teePath(anatomy);
    icePathData = icePath(anatomy);
    overlay = createOverlay(path, chest, icePathData);
    overlay.group.visible = active;
    heart.addOverlay(overlay.group);
    return true;
  }

  const exit = (point, dir) => surfaceExit(point, dir, hull);
  const tteBases = new Map();
  function baseOf(id) {
    if (!tteBases.has(id)) tteBases.set(id, heart.withRestPose(() => tteBase(id, anatomy, exit, chest)));
    return tteBases.get(id);
  }

  function currentFrame() {
    if (state.modality === 'tte') return tteFrame(baseOf(state.view), state.tte);
    if (state.modality === 'ice') return iceFrame(icePathData, state.ice);
    return teeFrame(path, state.tee);
  }

  function selectView(id, { keepTask = false } = {}) {
    const view = viewById(id);
    if (!view || !ensureAnatomy()) return;
    state.modality = modalityOf(view);
    state.view = id;
    if (state.modality === 'tte') {
      state.tte = { rotation: 0, tilt: 0, rock: 0, slideLateral: 0, slideElevation: 0 };
      state.depth = baseOf(id).depth;
    } else if (state.modality === 'ice') {
      const preset = icePreset(id);
      state.ice = { advance: preset.advance, rotation: preset.rotation, anteroposterior: preset.anteroposterior, leftRight: preset.leftRight };
      state.depth = preset.depth;
    } else {
      const preset = teePreset(id, anatomy, path);
      state.tee = { ...preset };
      state.depth = preset.depth;
    }
    if (!keepTask) state.task = null;
    refresh(true);
  }

  /** "Find the view": a target view and a probe moved away from it (same window or level). */
  // `seed` makes the target and the start pose reproducible (tests, shared exercises).
  function startTask(modality = state.modality, { seed = null } = {}) {
    if (!ensureAnatomy()) return;
    const random = seed === null ? Math.random : seededRandom(seed);
    const views = VIEWS[modality] || TTE_VIEWS;
    const pool = views.filter(v => v.id !== state.task?.target);
    const target = pool[Math.floor(random() * pool.length)];
    selectView(target.id, { keepTask: true });
    const jitter = (range) => Math.round((random() * 2 - 1) * range);
    const preset = { tte: { ...state.tte }, tee: state.tee && { ...state.tee }, ice: state.ice && { ...state.ice } };
    // A start that already shows the target is no task: draw again (a few tries).
    for (let attempt = 0; attempt < 8; attempt++) {
      if (modality === 'tte') state.tte = { ...preset.tte, rotation: jitter(45), tilt: jitter(20), rock: jitter(15) };
      else if (modality === 'ice') state.ice = { ...preset.ice, rotation: preset.ice.rotation + jitter(50), anteroposterior: jitter(15), leftRight: jitter(15) };
      else state.tee = { ...preset.tee, advance: Math.min(1, Math.max(0, preset.tee.advance + jitter(6) / 100)), omega: Math.max(0, Math.min(180, preset.tee.omega + jitter(60))), rotation: jitter(30) };
      if (!solved(target)) break;
    }
    // "Back" during a task returns to this starting pose, not to the answer.
    state.task = { target: target.id, done: false, start: { tte: { ...state.tte }, tee: state.tee && { ...state.tee }, ice: state.ice && { ...state.ice } } };
    refresh(true);
  }

  // The view is judged on the rest (end-diastolic) geometry, recomputed only
  // when the probe, view or display changes: the feedback does not flicker
  // with the beat, while the image itself follows the phase.
  let judged = { key: '', result: null };
  function judge(view, frame) {
    const lang = getLang();
    const key = JSON.stringify([view.id, frame.origin, frame.beam, frame.lateral, state.depth, state.sectorAngle, lang]);
    if (key !== judged.key) {
      const label = id => STRUCTURE_INFO[id]?.label[lang] || id;
      const result = heart.withRestPose(() => evaluateView(sectionMeshes(items, frame), view, { sectorAngle: state.sectorAngle, depth: state.depth, frame, anatomy, label, lang }));
      judged = { key, result };
    }
    return judged.result;
  }
  const solved = view => judge(view, currentFrame()).achieved;

  // The atlas has no IVC mesh: the estimated orifice is shown as a point when the cut passes near it.
  function cavalMarker(frame) {
    const p = imagePoint(anatomy.ivc, frame, state.sectorAngle, state.depth);
    return p.off <= CAVAL_OFF_PLANE ? [{ point: [p.x, p.y], label: { tr: 'İVK ağzı (kestirim)', en: 'IVC orifice (estimated)' } }] : [];
  }

  let trailing = null, pendingTick = false;
  function refresh(force = false) {
    if (!active || !anatomy) return;
    const now = performance.now();
    if (!force && now - lastSection < MIN_SECTION_INTERVAL) {
      // Throttled: still draw the last state once the interval has passed (fast ECG scrubbing).
      trailing ??= setTimeout(() => { trailing = null; refresh(true); }, MIN_SECTION_INTERVAL - (now - lastSection));
      return;
    }
    if (trailing) { clearTimeout(trailing); trailing = null; }
    lastSection = now;
    const frame = currentFrame();
    const section = sectionMeshes(items, frame);
    const lang = getLang();
    const view = viewById(state.task ? state.task.target : state.view);
    const result = judge(view, frame);
    if (state.task && result.achieved) state.task.done = true;
    lastResult = { frame, section, result, view, live: visibleLengths(section, state.sectorAngle, state.depth) };
    overlay.update(frame, state);
    heart.requestRender();
    const playing = heart.getCycleState().playing;
    if (playing) state.frozen = false;
    panel?.render({ state, result, view, playing, frame, presetOmega: state.modality === 'tee' ? teePreset(view.id, anatomy, path)?.omega : state.modality === 'ice' ? icePreset(view.id)?.rotation : null });
    drawEchoSector(panel?.canvas, section, {
      style: state.style, sectorAngle: state.sectorAngle, depth: state.depth, lang,
      info: state.task ? { tr: 'Görev: görünümü bulun', en: 'Task: find the view' } : view.title,
      structureInfo: STRUCTURE_INFO, frozen: state.frozen, hideLabels: !state.labels,
      markers: view.bicaval ? cavalMarker(frame) : []
    });
  }

  function ensurePanel() {
    if (panel) return panel;
    panel = createEchoPanel(mount, {
      getLang,
      views: VIEWS,
      // Picking a view (allowed once a task is solved) ends the task.
      onView: id => selectView(id),
      onModality: modality => selectView((VIEWS[modality] || TTE_VIEWS)[0].id),
      onControl: (group, key, value) => {
        if (group === 'probe') state[state.modality] = { ...state[state.modality], [key]: value };
        else state[key] = value;
        refresh(true);
      },
      onReset: () => {
        if (!state.task) { selectView(state.view); return; }
        state.tte = { ...state.task.start.tte };
        state.tee = state.task.start.tee && { ...state.task.start.tee };
        state.ice = state.task.start.ice && { ...state.task.start.ice };
        state.task.done = false;
        refresh(true);
      },
      onTask: () => startTask(),
      onEndTask: () => { state.task = null; refresh(true); },
      onFreeze: () => {
        const playing = heart.getCycleState().playing;
        state.frozen = playing;
        heart.setBeating(!playing);
        refresh(true);
      },
      onResize: () => refresh(true),
      onLookAtPlane: () => lastResult && heart.lookAlong(lastResult.frame.origin, lastResult.frame.normal, lastResult.frame.beam, state.depth)
    });
    return panel;
  }

  return {
    /** `modality`: the mode's fixed modality (TTE and TEE are separate modes). */
    enter(modality = 'tte') {
      active = true;
      state.locked = modality;
      ensurePanel();
      mount.hidden = false;
      if (!ensureAnatomy()) return;
      overlay.group.visible = true;
      if (state.modality !== modality) selectView((VIEWS[modality] || TTE_VIEWS)[0].id);
      else refresh(true);
    },
    exit() {
      active = false;
      state.frozen = false;
      mount.hidden = true;
      if (overlay) { overlay.group.visible = false; heart.requestRender(); }
    },
    /** Lesson step: { modality, view, task }. */
    applyStep(step = {}) {
      if (!active || !ensureAnatomy()) return;
      const views = VIEWS[step.modality] || TTE_VIEWS;
      if (step.task) { state.modality = step.modality || 'tte'; startTask(state.modality); }
      else selectView(step.view || views[0].id);
    },
    // The cycle notifies before the heart deforms (heart.seekCycle, the frame
    // loop): section after the current task, from the deformed geometry.
    tick() {
      if (!active || pendingTick) return;
      pendingTick = true;
      queueMicrotask(() => { pendingTick = false; refresh(false); });
    },
    setLanguage(lang) { panel?.setLanguage(lang); refresh(true); },
    // Diagnostics for tests.
    getState: () => ({ ...state, tte: { ...state.tte }, tee: state.tee && { ...state.tee }, ice: state.ice && { ...state.ice } }),
    // lengths: the live (current phase) section; achieved/missing/wrong: the rest-pose judgement.
    getResult: () => lastResult && { achieved: lastResult.result.achieved, missing: lastResult.result.missing, wrong: lastResult.result.wrong, lengths: lastResult.live, stats: lastResult.section.stats, view: lastResult.view.id, frame: lastResult.frame },
    selectView, startTask, isActive: () => active
  };
}

/** Deterministic pseudo-random numbers in [0, 1) (mulberry32). */
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 3D probe, imaging fan, (TTE) schematic chest surface and (TEE) oesophagus. */
function createOverlay(path, chest, icePathData) {
  const group = new THREE.Group();
  group.name = 'Echo probe and imaging plane';
  group.visible = false;
  const fanMaterial = new THREE.MeshBasicMaterial({ color: 0x39e8ad, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false });
  const FAN_STEPS = 24;
  const fanGeometry = new THREE.BufferGeometry();
  fanGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(FAN_STEPS * 9), 3));
  const fan = new THREE.Mesh(fanGeometry, fanMaterial);
  fan.name = 'Echo imaging plane (sector)';
  fan.renderOrder = 5;
  const edge = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x1f9e78 }));
  edge.frustumCulled = false;       // its points move every update
  const probeMaterial = new THREE.MeshStandardMaterial({ color: 0x3c4a46, roughness: 0.5 });
  const tteProbe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.5, 20), probeMaterial);
  tteProbe.name = 'TTE probe (schematic)';
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), new THREE.MeshBasicMaterial({ color: 0x39e8ad }));
  marker.name = 'Probe index marker';
  const oesophagus = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path.points.map(p => new THREE.Vector3(...p))), 80, 0.13, 12, false),
    new THREE.MeshStandardMaterial({ color: 0xd9a38f, transparent: true, opacity: 0.22, depthWrite: false, roughness: 0.8 }));
  oesophagus.name = 'Oesophagus and stomach (schematic path)';
  const shaft = new THREE.Mesh(new THREE.BufferGeometry(), probeMaterial);
  shaft.name = 'TEE probe (schematic)';
  const chestShell = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), new THREE.MeshBasicMaterial({ color: 0x9fb8ad, wireframe: true, transparent: true, opacity: 0.12, depthWrite: false }));
  chestShell.name = 'Chest surface (schematic ellipsoid, no ribs)';
  chestShell.position.set(...chest.center);
  chestShell.scale.set(...chest.radii);
  // ICE catheter: from the IVC below into the RA up to its tip.
  const iceCatheter = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0x2f3d39, roughness: 0.45 }));
  iceCatheter.name = 'ICE catheter (schematic)';
  group.add(fan, edge, tteProbe, marker, oesophagus, shaft, chestShell, iceCatheter);
  let iceKey = '';
  let shaftKey = '';

  function update(frame, state) {
    const o = new THREE.Vector3(...frame.origin), b = new THREE.Vector3(...frame.beam), l = new THREE.Vector3(...frame.lateral);
    const pts = [o.clone()];
    for (let i = 0; i <= FAN_STEPS; i++) {
      const a = -state.sectorAngle / 2 + (state.sectorAngle * i) / FAN_STEPS;
      pts.push(o.clone().addScaledVector(b, Math.cos(a) * state.depth).addScaledVector(l, Math.sin(a) * state.depth));
    }
    // One buffer for the life of the overlay, written in place.
    const position = fanGeometry.attributes.position;
    for (let i = 1; i < pts.length - 1; i++) {
      const k = (i - 1) * 3;
      position.setXYZ(k, pts[0].x, pts[0].y, pts[0].z);
      position.setXYZ(k + 1, pts[i].x, pts[i].y, pts[i].z);
      position.setXYZ(k + 2, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z);
    }
    position.needsUpdate = true;
    fanGeometry.computeBoundingSphere();
    edge.geometry.setFromPoints(pts);
    // Index marker on the screen-right side of the transducer.
    marker.position.copy(o).addScaledVector(l, 0.14);
    const tte = state.modality === 'tte', ice = state.modality === 'ice';
    tteProbe.visible = tte; chestShell.visible = tte; oesophagus.visible = !tte && !ice; shaft.visible = !tte && !ice; iceCatheter.visible = ice;
    if (ice) {
      const key = [...frame.tip].map(v => v.toFixed(3)).join('_');
      if (key !== iceKey && icePathData) {
        iceKey = key;
        const base = new THREE.Vector3(...icePathData.base);
        const below = base.clone().add(new THREE.Vector3(0, -1.2, 0));
        const tip = new THREE.Vector3(...frame.tip);
        iceCatheter.geometry.dispose();
        iceCatheter.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([below, base, base.clone().lerp(tip, 0.5), tip]), 40, 0.045, 8, false);
      }
    } else if (tte) {
      tteProbe.position.copy(o).addScaledVector(b, -0.27);
      tteProbe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().negate());
    } else {
      // The shaft follows the path down to the tip (rebuilt only when the tip moves).
      const key = [state.tee.advance, ...frame.tip, ...frame.shaft].map(v => v.toFixed(3)).join('_');
      if (key !== shaftKey) {
        shaftKey = key;
        const along = [];
        for (let k = 0; k <= 30; k++) along.push(new THREE.Vector3(...path.at((state.tee.advance * k) / 30).point));
        along.push(new THREE.Vector3(...frame.tip).addScaledVector(new THREE.Vector3(...frame.shaft), 0.12));
        shaft.geometry.dispose();
        shaft.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(along), 60, 0.05, 8, false);
      }
    }
  }
  return { group, update };
}

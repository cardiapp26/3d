import * as THREE from 'three';
import { measureEchoAnatomy, echoItems, surfaceExit, ECHO_STRUCTURES } from './echo-anatomy.js';
import { TTE_VIEWS, TEE_VIEWS, SECTOR_ANGLE, viewById, tteBase, teePath, teePreset } from './echo-views.js';
import { tteFrame, teeFrame } from './echo-probe.js';
import { sectionMeshes } from './echo-section.js';
import { evaluateView } from './echo-training.js';
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
  let active = false, anatomy = null, items = null, path = null, hull = null, panel = null, overlay = null;
  const state = {
    modality: 'tte', view: 'plax', style: 'anatomy', labels: true, sectorAngle: SECTOR_ANGLE,
    tte: { rotation: 0, tilt: 0, rock: 0, slideLateral: 0, slideElevation: 0 }, tee: null, depth: 4,
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
    items = echoItems(getMeshes);
    hull = HULL_IDS.flatMap(getMeshes);
    path = teePath(anatomy);
    overlay = createOverlay(path);
    overlay.group.visible = active;
    heart.addOverlay(overlay.group);
    return true;
  }

  const exit = (point, dir) => surfaceExit(point, dir, hull);
  const tteBases = new Map();
  function baseOf(id) {
    if (!tteBases.has(id)) tteBases.set(id, heart.withRestPose(() => tteBase(id, anatomy, exit)));
    return tteBases.get(id);
  }

  function currentFrame() {
    if (state.modality === 'tte') return tteFrame(baseOf(state.view), state.tte);
    return teeFrame(path, state.tee);
  }

  function selectView(id, { keepTask = false } = {}) {
    const view = viewById(id);
    if (!view || !ensureAnatomy()) return;
    state.modality = TTE_VIEWS.includes(view) ? 'tte' : 'tee';
    state.view = id;
    if (state.modality === 'tte') {
      state.tte = { rotation: 0, tilt: 0, rock: 0, slideLateral: 0, slideElevation: 0 };
      state.depth = baseOf(id).depth;
    } else {
      const preset = teePreset(id, anatomy, path);
      state.tee = { ...preset };
      state.depth = preset.depth;
    }
    if (!keepTask) state.task = null;
    refresh(true);
  }

  /** "Find the view": a target view and a probe moved away from it (same window or level). */
  function startTask(modality = state.modality) {
    if (!ensureAnatomy()) return;
    const views = modality === 'tte' ? TTE_VIEWS : TEE_VIEWS;
    const pool = views.filter(v => v.id !== state.task?.target);
    const target = pool[Math.floor(Math.random() * pool.length)];
    selectView(target.id, { keepTask: true });
    const jitter = (range) => Math.round((Math.random() * 2 - 1) * range);
    if (modality === 'tte') state.tte = { ...state.tte, rotation: jitter(45), tilt: jitter(20), rock: jitter(15) };
    else state.tee = { ...state.tee, advance: Math.min(1, Math.max(0, state.tee.advance + jitter(6) / 100)), omega: Math.max(0, Math.min(180, state.tee.omega + jitter(60))), rotation: jitter(30) };
    // "Back" during a task returns to this starting pose, not to the answer.
    state.task = { target: target.id, done: false, start: { tte: { ...state.tte }, tee: state.tee && { ...state.tee } } };
    refresh(true);
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
    const label = id => STRUCTURE_INFO[id]?.label[lang] || id;
    const result = evaluateView(section, view, { sectorAngle: state.sectorAngle, depth: state.depth, frame, anatomy, label, lang });
    if (state.task && result.achieved) state.task.done = true;
    lastResult = { frame, section, result, view };
    overlay.update(frame, state);
    heart.requestRender();
    const playing = heart.getCycleState().playing;
    if (playing) state.frozen = false;
    panel?.render({ state, result, view, playing, frame });
    drawEchoSector(panel?.canvas, section, {
      style: state.style, sectorAngle: state.sectorAngle, depth: state.depth, lang,
      info: state.task ? { tr: 'Görev: görünümü bulun', en: 'Task: find the view' } : view.title,
      structureInfo: STRUCTURE_INFO, frozen: state.frozen, hideLabels: !state.labels
    });
  }

  function ensurePanel() {
    if (panel) return panel;
    panel = createEchoPanel(mount, {
      getLang,
      views: { tte: TTE_VIEWS, tee: TEE_VIEWS },
      onView: id => selectView(id),
      onModality: modality => selectView((modality === 'tte' ? TTE_VIEWS : TEE_VIEWS)[0].id),
      onControl: (group, key, value) => {
        if (group === 'probe') state[state.modality] = { ...state[state.modality], [key]: value };
        else state[key] = value;
        refresh(true);
      },
      onReset: () => {
        if (!state.task) { selectView(state.view); return; }
        state.tte = { ...state.task.start.tte };
        state.tee = state.task.start.tee && { ...state.task.start.tee };
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
      onLookAtPlane: () => lastResult && heart.lookAlong(lastResult.frame.origin, lastResult.frame.normal, lastResult.frame.beam, state.depth)
    });
    return panel;
  }

  return {
    enter() {
      active = true;
      ensurePanel();
      mount.hidden = false;
      if (ensureAnatomy()) { overlay.group.visible = true; refresh(true); }
    },
    exit() {
      active = false;
      mount.hidden = true;
      if (overlay) { overlay.group.visible = false; heart.requestRender(); }
    },
    /** Lesson step: { modality, view, task }. */
    applyStep(step = {}) {
      if (!active || !ensureAnatomy()) return;
      const views = step.modality === 'tee' ? TEE_VIEWS : TTE_VIEWS;
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
    getState: () => ({ ...state, tte: { ...state.tte }, tee: state.tee && { ...state.tee } }),
    getResult: () => lastResult && { achieved: lastResult.result.achieved, missing: lastResult.result.missing, wrong: lastResult.result.wrong, lengths: lastResult.result.lengths, stats: lastResult.section.stats, view: lastResult.view.id, frame: lastResult.frame },
    selectView, startTask, isActive: () => active
  };
}

/** 3D probe, imaging fan and (TEE) oesophagus. */
function createOverlay(path) {
  const group = new THREE.Group();
  group.name = 'Echo probe and imaging plane';
  group.visible = false;
  const fanMaterial = new THREE.MeshBasicMaterial({ color: 0x39e8ad, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false });
  const fan = new THREE.Mesh(new THREE.BufferGeometry(), fanMaterial);
  fan.name = 'Echo imaging plane (sector)';
  fan.renderOrder = 5;
  const edge = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x1f9e78 }));
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
  group.add(fan, edge, tteProbe, marker, oesophagus, shaft);
  let shaftKey = '';

  function update(frame, state) {
    const o = new THREE.Vector3(...frame.origin), b = new THREE.Vector3(...frame.beam), l = new THREE.Vector3(...frame.lateral);
    const pts = [o.clone()];
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const a = -state.sectorAngle / 2 + (state.sectorAngle * i) / steps;
      pts.push(o.clone().addScaledVector(b, Math.cos(a) * state.depth).addScaledVector(l, Math.sin(a) * state.depth));
    }
    const positions = [];
    for (let i = 1; i < pts.length - 1; i++) positions.push(...pts[0].toArray(), ...pts[i].toArray(), ...pts[i + 1].toArray());
    fan.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    fan.geometry.computeBoundingSphere();
    edge.geometry.setFromPoints(pts);
    // Index marker on the screen-right side of the transducer.
    marker.position.copy(o).addScaledVector(l, 0.14);
    const tte = state.modality === 'tte';
    tteProbe.visible = tte; oesophagus.visible = !tte; shaft.visible = !tte;
    if (tte) {
      tteProbe.position.copy(o).addScaledVector(b, -0.27);
      tteProbe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().negate());
    } else {
      // The shaft follows the path down to the tip (rebuilt only when the tip moves).
      const key = `${state.tee.advance.toFixed(3)}_${frame.tip.map(v => v.toFixed(3)).join('_')}`;
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

import * as THREE from 'three';
import { measureEchoAnatomy, echoItems, surfaceExit, chestSurface, ECHO_STRUCTURES } from './echo-anatomy.js';
import { TTE_VIEWS, TEE_VIEWS, ICE_VIEWS, SECTOR_ANGLE, viewById, tteBase, teePath, teePreset, icePath, iceLaPath, iceLvPath, icePreset, icePosition } from './echo-views.js';
import { tteFrame, teeFrame, iceFrame } from './echo-probe.js';
import { sectionMeshes } from './echo-section.js';
import { evaluateView, visibleLengths, imagePoint, CAVAL_OFF_PLANE, LANDMARK_OFF_PLANE, STRUCTURE_GROUPS } from './echo-training.js';
import { drawEchoSector } from './echo-renderer.js';
import { transseptalGeometry } from './echo-transseptal.js';
import { createEchoPanel } from './echo-panel.js';

/*
 * Echocardiography mode (research/TTE_TEE_ENTEGRASYON_RAPORU.md): the probe
 * and its imaging plane in the 3D scene, the 2D section of the same plane in
 * the panel, both from the same (current, beating) geometry and phase.
 * Freezing stops the shared heartbeat, so the 3D and 2D images stop together.
 */
const HULL_IDS = ['lv', 'rv', 'la', 'ra', 'aorta', 'pa'];
const STRUCTURE_INFO = {
  ...Object.fromEntries(ECHO_STRUCTURES.map(s => [s.id, { color: s.color, label: s.label, name: s.name }])),
  // Group and landmark names used by the view criteria.
  pv: { color: '#b4a7d6', label: { tr: 'pulmoner venler', en: 'pulmonary veins' } },
  fossa: { color: '#ffffff', label: { tr: 'fossa ovalis', en: 'fossa ovalis' } },
  oesophagus: { color: '#d9a38f', label: { tr: 'özofagus (şematik)', en: 'oesophagus (schematic)' } }
};
const MIN_SECTION_INTERVAL = 30;   // ms between sections while the heart beats

/**
 * @param {{ heart: object, mount: HTMLElement, getLang: () => 'tr'|'en' }} deps
 */
// Visible parts by structure for the panel line: LV segments in number order, leaflets by name.
const PART_ORDER = ['lv', 'rv', 'mitral', 'tricuspid', 'aortic-valve', 'pulmonary-valve'];
function partGroups(parts, lang) {
  const by = new Map();
  for (const { id, part } of parts || []) {
    if (!by.has(id)) by.set(id, new Map());
    by.get(id).set(part.key, part);
  }
  return PART_ORDER.filter(id => by.has(id)).map(id => ({
    label: STRUCTURE_INFO[id]?.label?.[lang] || id,
    parts: [...by.get(id).values()].sort((a, b) => (a.segment ?? 99) - (b.segment ?? 99) || String(a.abbr).localeCompare(String(b.abbr))).map(p => p.short?.[lang] || p.abbr)
  }));
}

export function createEchoMode({ heart, mount, getLang }) {
  let ivcAnchor = null;
  let active = false, anatomy = null, items = null, path = null, icePathData = null, hull = null, chest = null, panel = null, overlay = null;
  // ICE catheter paths by position: the RA, and the LA after the septal crossing (null without a measured fossa).
  let icePaths = { ra: null, la: null, lv: null };
  const VIEWS = { tte: TTE_VIEWS, tee: TEE_VIEWS, ice: ICE_VIEWS };
  const modalityOf = view => (TTE_VIEWS.includes(view) ? 'tte' : TEE_VIEWS.includes(view) ? 'tee' : 'ice');
  const state = {
    modality: 'tte', view: 'plax', style: 'anatomy', labels: true, parts: true, sectorAngle: SECTOR_ANGLE,
    locked: null,  // modality fixed by the app mode (TTE or TEE); the panel then hides its switch
    tte: { rotation: 0, tilt: 0, rock: 0, slideLateral: 0, slideElevation: 0 }, tee: null, ice: null, depth: 4,
    task: null,  // { target: viewId, done: boolean, start: probe pose at the start }
    frozen: false,  // stopped with the panel's freeze button (the badge says so)
    transseptal: null  // ICE septal view: schematic transseptal stage (echo-transseptal.js)
  };
  let sweepRaf = 0, needle = null;
  let lastSection = 0, lastResult = null;
  const getMeshes = id => heart.getMeshes(id).filter(m => !m.userData.micro);

  function ensureAnatomy() {
    if (anatomy) return true;
    if (!getMeshes('lv').length) return false;          // atlas not loaded yet
    try {
      const measured = heart.withRestPose(() => measureEchoAnatomy({ getMeshes }));
      // Fossa ovalis: the transseptal module's measured site on the RA/LA septal contact (world space).
      const fossa = heart.scene.getObjectByName('Fossa ovalis');
      if (fossa) {
        fossa.updateWorldMatrix(true, false);
        const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(fossa.getWorldQuaternion(new THREE.Quaternion()));
        measured.fossa = { center: fossa.getWorldPosition(new THREE.Vector3()).toArray(), normal: normal.toArray() };
      }
      // Oesophagus at the LA level (the schematic TEE path behind the posterior wall): an LA ICE landmark.
      measured.oesophagus = { center: measured.oesophagusPath[2] };
      anatomy = measured;   // assigned last: a failure above leaves the mode uninitialised, not half-built
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
    icePaths = { ra: icePathData, la: iceLaPath(anatomy), lv: iceLvPath(anatomy) };
    ivcAnchor = anchorOnRa(anatomy.ivc);
    overlay = createOverlay(path, chest, icePaths, anatomy);
    // Schematic transseptal needle (3D): the same world points as the 2D path.
    needle = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffd966, depthTest: false }));
    needle.name = 'Transseptal needle (schematic)';
    needle.renderOrder = 8;
    needle.frustumCulled = false;
    const needleTip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffd966, depthTest: false }));
    needleTip.renderOrder = 8;
    needle.add(needleTip);
    needle.userData.tip = needleTip;
    needle.visible = false;
    overlay.group.add(needle);
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
    if (state.modality === 'ice') return iceFrame(icePaths[currentIcePosition()] || icePathData, state.ice);
    return teeFrame(path, state.tee);
  }

  // The catheter position follows the view (a task's target during a task).
  function currentIcePosition() {
    return icePosition(viewById(state.task ? state.task.target : state.view));
  }

  function selectView(id, { keepTask = false } = {}) {
    const view = viewById(id);
    if (!view || !ensureAnatomy()) return;
    cancelAnimationFrame(sweepRaf);
    state.transseptal = null;   // a lesson step sets it again after the view
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
    // A view whose landmark the atlas lacks can never be met: not a task target.
    const pool = views.filter(v => v.id !== state.task?.target && (v.landmarks || []).every(id => anatomy[id]) && (modality !== 'ice' || icePaths[icePosition(v)]));
    const target = pool[Math.floor(random() * pool.length)];
    selectView(target.id, { keepTask: true });
    const jitter = (range) => Math.round((random() * 2 - 1) * range);
    // Start from a pose that does not depend on the target: the TTE window's
    // preset (the window is part of the view), the TEE mid-oesophageal
    // four-chamber level with neutral flexion, the ICE home pose of the target's chamber
    // (rotation offset either way: some targets lie counterclockwise of home).
    const preset = {
      tte: { ...state.tte },
      tee: modality === 'tee' ? { ...teePreset('me4c', anatomy, path), flexion: 0, lateralFlexion: 0 } : null,
      ice: modality === 'ice' ? { ...icePreset({ la: 'ice-la-home', lv: 'ice-lv-inferior' }[icePosition(target)] || 'ice-home') } : null
    };
    // The image depth is the start pose's, not the target's (TEE views differ: 3, 3.6, 4.8).
    if (modality === 'tee') state.depth = preset.tee.depth;
    // A start that already shows the target is no task: draw again (a few tries).
    for (let attempt = 0; attempt < 8; attempt++) {
      if (modality === 'tte') state.tte = { ...preset.tte, rotation: jitter(45), tilt: jitter(20), rock: jitter(15) };
      else if (modality === 'ice') state.ice = { ...preset.ice, advance: Math.min(1, Math.max(0, preset.ice.advance + jitter(8) / 100)), rotation: Math.max(-60, Math.min(270, preset.ice.rotation + jitter(120))), anteroposterior: preset.ice.anteroposterior + jitter(15), leftRight: preset.ice.leftRight + jitter(15) };
      else state.tee = { ...preset.tee, advance: Math.min(1, Math.max(0, preset.tee.advance + jitter(6) / 100)), omega: Math.round(random() * 180), rotation: jitter(30) };
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
  // The estimated IVC orifice rides the beating RA: nearest RA vertex at rest plus its offset.
  function anchorOnRa(point) {
    const ra = getMeshes('ra')[0];
    if (!ra || !point) return null;
    return heart.withRestPose(() => {
      const pos = ra.geometry.attributes.position, p = new THREE.Vector3(...point);
      let index = 0, best = Infinity;
      for (let i = 0; i < pos.count; i++) { const d = new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(ra.matrixWorld).distanceToSquared(p); if (d < best) { best = d; index = i; } }
      return { mesh: ra, index, offset: p.sub(new THREE.Vector3().fromBufferAttribute(pos, index).applyMatrix4(ra.matrixWorld)) };
    });
  }
  function liveIvc() {
    if (!ivcAnchor) return anatomy.ivc;
    const { mesh, index, offset } = ivcAnchor;
    return new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position, index).applyMatrix4(mesh.matrixWorld).add(offset).toArray();
  }
  function cavalMarker(frame) {
    const p = imagePoint(liveIvc(), frame, state.sectorAngle, state.depth);
    return p.off <= CAVAL_OFF_PLANE ? [{ point: [p.x, p.y], label: { tr: 'İVK ağzı (kestirim)', en: 'IVC orifice (estimated)' } }] : [];
  }

  /**
   * Move the catheter to the next / previous ICE view of the clockwise sequence
   * over `ms`, so the structures can be watched entering and leaving the sector.
   */
  function sweep(dir, ms = 1600) {
    if (state.modality !== 'ice' || state.task) return null;
    const position = icePosition(viewById(state.view));
    const ids = ICE_VIEWS.filter(v => icePosition(v) === position).map(v => v.id);
    const next = ids[ids.indexOf(state.view) + dir];
    if (!next) return null;
    const from = { ...state.ice, depth: state.depth };
    const to = icePreset(next);
    cancelAnimationFrame(sweepRaf);
    state.transseptal = null;
    state.view = next;
    const t0 = performance.now();
    const step = now => {
      const f = Math.min(1, (now - t0) / ms), e = f * f * (3 - 2 * f);
      const mix = k => from[k] + (to[k] - from[k]) * e;
      state.ice = { advance: mix('advance'), rotation: mix('rotation'), anteroposterior: mix('anteroposterior'), leftRight: mix('leftRight') };
      state.depth = mix('depth');
      refresh(true);
      if (f < 1) sweepRaf = requestAnimationFrame(step);
      else selectView(next);
    };
    sweepRaf = requestAnimationFrame(step);
    return next;
  }

  // Transseptal stage: 3D needle and 2D paths (needle, tenting) from one geometry.
  function transseptalPaths(frame) {
    const g = state.modality === 'ice' && state.transseptal && !state.task ? transseptalGeometry(anatomy, state.transseptal, frame.normal) : null;
    if (needle) {
      needle.visible = Boolean(g?.needle);
      if (g?.needle) {
        needle.geometry.setFromPoints(g.needle.map(p => new THREE.Vector3(...p)));
        needle.userData.tip.position.set(...g.tip);
        needle.userData.tip.position.sub(needle.position);
      }
    }
    // In 2D only when the cut passes through the fossa: otherwise the drawing would hide a missed plane.
    if (!g || imagePoint(anatomy.fossa.center, frame, state.sectorAngle, state.depth).off > LANDMARK_OFF_PLANE) return [];
    const project = pts => pts.map(p => { const q = imagePoint(p, frame, state.sectorAngle, state.depth); return [q.x, q.y]; });
    const out = [];
    // No in-image labels: the near field is crowded; the stage text names the shapes.
    if (g.needle) out.push({ points: project(g.needle), color: '#ffd966', width: 2.5, tip: true, dashed: state.transseptal === 'crossing' });
    if (g.tent) out.push({ points: project(g.tent), color: '#ff9f6b', width: 3 });
    return out;
  }

  // Fossa ovalis (measured by the transseptal module) as a point when the cut passes through it.
  // Measured landmarks a view names (fossa ovalis, oesophagus) as points when the cut passes through them.
  const LANDMARK_LABELS = { fossa: { tr: 'Fossa ovalis', en: 'Fossa ovalis' }, oesophagus: { tr: 'Özofagus (şematik)', en: 'Oesophagus (schematic)' } };
  function landmarkMarkers(frame, ids = []) {
    if (state.task) return [];
    return ids.filter(id => anatomy[id]?.center).flatMap(id => {
      const p = imagePoint(anatomy[id].center, frame, state.sectorAngle, state.depth);
      return p.off <= LANDMARK_OFF_PLANE ? [{ point: [p.x, p.y], label: LANDMARK_LABELS[id] || { tr: id, en: id } }] : [];
    });
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
    panel?.render({ state, result, view, playing, frame, hasFossa: Boolean(anatomy.fossa), presetOmega: state.modality === 'tee' ? teePreset(view.id, anatomy, path)?.omega : state.modality === 'ice' ? icePreset(view.id)?.rotation : null });
    const drawn = drawEchoSector(panel?.canvas, section, {
      style: state.style, sectorAngle: state.sectorAngle, depth: state.depth, lang,
      info: state.task ? { tr: 'Görev: görünümü bulun', en: 'Task: find the view' } : view.title,
      structureInfo: STRUCTURE_INFO, frozen: state.frozen, hideLabels: !state.labels,
      // ICE: the view's targets are drawn emphasised (not during a task: that would give the answer).
      highlight: state.modality === 'ice' && !state.task ? view.required.flatMap(id => STRUCTURE_GROUPS[id] || [id]) : [],
      markers: [...(view.bicaval ? cavalMarker(frame) : []), ...landmarkMarkers(frame, view.landmarks)],
      paths: transseptalPaths(frame),
      showParts: state.parts
    });
    panel?.setParts(state.parts ? partGroups(drawn?.parts, lang) : []);
    panel?.setHits(drawn?.hits, STRUCTURE_INFO);
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
        cancelAnimationFrame(sweepRaf);   // a manual move ends a running sweep
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
      onSweep: dir => sweep(dir),
      onTransseptal: stage => { state.transseptal = stage; refresh(true); },
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
      cancelAnimationFrame(sweepRaf);
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
      // A lesson step may open the schematic transseptal stages on the septal view.
      if (step.transseptal && state.view === 'ice-septal-sax') { state.transseptal = step.transseptal; refresh(true); }
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
    // Measured landmarks and the ICE catheter path (geometry checks in tests).
    getAnatomy: () => anatomy, getIcePath: (position = 'ra') => icePaths[position] || null,
    sweep, setTransseptal(stage) { state.transseptal = stage; refresh(true); },
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
function createOverlay(path, chest, icePaths, anatomy) {
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
  // ICE catheter from the pose model (iceFrame): straight shaft up the IVC-SVC axis to the
  // knuckle, the deflectable distal segment in a lighter colour, and the
  // transducer face (a bright strip on the side facing the beam) at its end.
  const iceCatheter = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0x2f3d39, roughness: 0.45 }));
  iceCatheter.name = 'ICE catheter shaft (schematic)';
  const iceDistal = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0x5f8f80, roughness: 0.4 }));
  iceDistal.name = 'ICE catheter deflectable segment (schematic)';
  const iceFace = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.02), new THREE.MeshBasicMaterial({ color: 0x39e8ad }));
  iceFace.name = 'ICE transducer face (schematic)';
  const iceCatheterGroup = new THREE.Group();
  iceCatheterGroup.name = 'ICE catheter (schematic)';
  iceCatheterGroup.add(iceCatheter, iceDistal, iceFace);
  group.add(fan, edge, tteProbe, marker, oesophagus, shaft, chestShell, iceCatheterGroup);
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
    tteProbe.visible = tte; chestShell.visible = tte; oesophagus.visible = !tte && !ice; shaft.visible = !tte && !ice; iceCatheterGroup.visible = ice;
    if (ice) {
      const position = frame.position || 'ra';
      const key = [position, ...frame.tip, ...frame.distal, ...frame.beam].map(v => (typeof v === 'number' ? v.toFixed(3) : v)).join('_');
      const raPath = icePaths.ra;
      if (key !== iceKey && raPath && frame.catheter) {
        iceKey = key;
        const base = new THREE.Vector3(...raPath.base);
        // The shaft comes up the IVC: extend it below the orifice along the measured IVC-SVC axis.
        const below = base.clone().addScaledVector(new THREE.Vector3(...raPath.top).sub(base).normalize(), -1.2);
        const bend = frame.catheter.map(p => new THREE.Vector3(...p));
        let shaftPoints;
        if ((position === 'la' || position === 'lv') && anatomy.fossa) {
          // Across the septum: up the IVC, through the RA to the fossa, then into the LA to the knuckle.
          const fossa = new THREE.Vector3(...anatomy.fossa.center), n = new THREE.Vector3(...anatomy.fossa.normal);
          const laSide = new THREE.Vector3(...icePaths.la.top).sub(fossa);
          if (n.dot(laSide) < 0) n.negate();
          const raSide = fossa.clone().addScaledVector(n, -0.35);
          const beyond = bend[0].clone().sub(fossa).dot(n) > 0.02;
          // In the LV the catheter continues from the fossa across the LA and through the mitral valve.
          const mv = new THREE.Vector3(...anatomy.mv.center), mvAbove = mv.clone().addScaledVector(new THREE.Vector3(...anatomy.mv.normal), -0.3);
          const laPart = position === 'lv' ? [fossa, mvAbove, mv] : (beyond ? [fossa] : []);
          shaftPoints = [below, base, raSide, ...laPart, bend[0]];
        } else {
          // Withdrawn far, the knuckle sits below the IVC orifice: then the shaft runs straight to it.
          shaftPoints = bend[0].y > base.y + 0.05 ? [below, base, bend[0]] : [below, bend[0]];
        }
        iceCatheter.geometry.dispose();
        iceCatheter.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(shaftPoints), 40, 0.045, 8, false);
        iceDistal.geometry.dispose();
        iceDistal.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bend), 24, 0.047, 8, false);
        // Transducer: along the last part of the distal segment, on the beam side.
        const d = new THREE.Vector3(...frame.distal), bm = new THREE.Vector3(...frame.beam);
        iceFace.position.copy(bend[bend.length - 1]).addScaledVector(d, -0.08).addScaledVector(bm, 0.04);
        iceFace.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(d, bm), d, bm));
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

// 3D Electroanatomical Mapping (EAM) & Whole-Heart Simulation Workstation Panel

import {
  EAM3D_SCENARIOS,
  EAM3D_MAP_MODES,
  EAM3D_VIEWS,
  DEFAULT_LEVERS,
  DEFAULT_GRID_SITE,
  scenarioSpec,
  buildStimTrain,
  runStimManeuver,
  runCircuitSurvey,
} from './eam3d-model.js';
import { EAM3D_TEXT } from './eam3d-text.js';
import { createEam3dAtlas } from './eam3d-atlas.js';
import { createRfConsole } from './eam3d-rf-console.js';
import { createRhythmTimeline } from './eam3d-timeline.js';
import { createPolygraph } from './eam3d-polygraph.js';
import { drawFallbackView, pickFallbackPoint } from './eam3d-fallback-view.js';
import { el, toggleClass, button, scrollToCard } from './eam3d-dom.js';
import { createLeverCards } from './eam3d-lever-cards.js';
import { createSurveyCard, SURVEY_PRESETS } from './eam3d-survey-card.js';
import { createStimBar } from './eam3d-stim-bar.js';

const RAILS = Object.freeze(['case', 'map', 'ablate', 'survey']);
const RAIL_ICONS = Object.freeze({ case: '3D', map: 'MAP', ablate: 'RF', survey: 'AI' });
const SWEEP_SPEEDS = Object.freeze([25, 50, 100, 200]);
const LEGEND_KEYS = Object.freeze({ live: 'legendLive', lat: 'legendLat', voltage: 'legendVoltage', phase: 'legendPhase' });

// Colour bar under the 3D view, matching what each map mode paints on the heart.
const SCALE_GRADIENTS = Object.freeze({
  live: 'linear-gradient(90deg, #fffbeb 0%, #ea580c 30%, #8a6d28 100%)',
  lat: 'linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6)',
  voltage: 'linear-gradient(90deg, #475569 0 14%, #ef4444 14%, #eab308 45%, #22c55e 62%, #3b82f6 82%, #8b5cf6 100%)',
  phase: 'linear-gradient(90deg, hsl(0 85% 52%), hsl(74 85% 52%), hsl(148 85% 52%), hsl(221 85% 52%), hsl(295 85% 52%))',
});

function hasWebGL(doc) {
  try {
    const c = doc.createElement('canvas');
    return Boolean(
      c &&
        typeof c.getContext === 'function' &&
        (c.getContext('webgl2') || c.getContext('webgl')),
    );
  } catch {
    return false;
  }
}

export function createEam3dPanel(doc, { getLang = () => 'tr' } = {}) {
  const state = {
    scenarioId: 'avnrt',
    mapMode: 'live',
    activeRail: 'case',
    carmPreset: 'lao30',
    running: true,
    simTimeMs: 0,
    sweepSpeed: 100,
    levers: { ...DEFAULT_LEVERS },
    appliedLesions: [],
    lastStimResult: null,
    surveyPreset: 'biatrial-scar',
    surveyRuns: 100,
    showCircuitRibbons: false,
    selectedCircuitIndex: null,
    inspectedPoint: null,
    gridSite: DEFAULT_GRID_SITE,
    atlasStatus: 'loading',
  };

  // What the heart did and does over time (eam3d-timeline.js); the polygraph and 3D map replay it.
  const timeline = createRhythmTimeline({ scenarioId: state.scenarioId });
  let shownSegment = timeline.at(0);
  let shownPacing = false;

  const currentRhythm = () => ({ scenarioId: state.scenarioId, ablated: state.appliedLesions });
  /** Start a new rhythm (or stimulus train) now. */
  const startSegment = (stim = null) => timeline.startAt(state.simTimeMs, { ...currentRhythm(), stim });

  let active = false;
  let rafId = 0;
  let lastFrameTs = 0;
  let atlasInstance = null;
  let atlasInitStarted = false;
  // RF lesion tags and target line for the 3D map, from the RF console.
  let rfVisual = { lesions3d: [], target: null };
  let lastSurveyReport = runCircuitSurvey({
    mapPreset: state.surveyPreset,
    runs: state.surveyRuns,
    levers: state.levers,
    ablatedLines: new Set(state.appliedLesions),
  });

  const root = el(doc, 'section', 'eam3d-workstation', null, {
    'data-eam3d-workstation': 'true',
  });
  root.hidden = true;

  // --- 1. Left Column (Rail + Control Deck) ---
  const leftCol = el(doc, 'aside', 'eam3d-left');
  const railEl = el(doc, 'nav', 'eam3d-rail');
  const deckEl = el(doc, 'div', 'eam3d-deck', null, { 'data-eam3d-deck': 'true' });
  leftCol.append(railEl, deckEl);

  const railButtons = new Map();
  const sectionEls = {};

  for (const railId of RAILS) {
    const btn = button(doc, 'eam3d-rail-btn', { 'data-eam3d-rail': railId });
    const label = el(doc, 'span', 'eam3d-rail-label', railId.toUpperCase());
    btn.append(el(doc, 'span', 'eam3d-rail-icon', RAIL_ICONS[railId]), label);
    btn.addEventListener('click', () => {
      state.activeRail = railId;
      syncRailUI();
      scrollToCard(sectionEls[railId]);
    });
    railButtons.set(railId, { btn, label });
    railEl.appendChild(btn);
  }

  // Deck header
  const deckHeader = el(doc, 'div', 'eam3d-deck-header');
  const deckTitle = el(doc, 'h2', 'eam3d-deck-title');
  const deckSub = el(doc, 'p', 'eam3d-deck-sub');
  deckHeader.append(deckTitle, deckSub);
  deckEl.appendChild(deckHeader);

  // Card 1: Case & Map Mode
  const caseCard = el(doc, 'div', 'eam3d-card');
  sectionEls.case = caseCard;
  const caseHead = el(doc, 'div', 'eam3d-card-head');
  const caseTitle = el(doc, 'h3', 'eam3d-card-title');
  const importMapBtn = button(doc, 'eam3d-btn eam3d-btn--accent', { 'data-eam3d-import-map': 'true' });
  caseHead.append(caseTitle, importMapBtn);

  const scenarioField = el(doc, 'label', 'eam3d-field');
  const scenarioLabel = el(doc, 'span');
  const scenarioSelect = el(doc, 'select', 'eam3d-select', null, {
    'data-eam3d-scenario': 'true',
  });
  const scenarioOptions = EAM3D_SCENARIOS.map((id) => {
    const opt = el(doc, 'option');
    opt.value = id;
    scenarioSelect.appendChild(opt);
    return opt;
  });
  scenarioField.append(scenarioLabel, scenarioSelect);

  const mapModeTitle = el(doc, 'div', 'eam3d-card-title');
  const mapModeGrid = el(doc, 'div', 'eam3d-mode-grid');
  sectionEls.map = mapModeGrid;
  const mapModeBtns = new Map();
  EAM3D_MAP_MODES.forEach((mode) => {
    const btn = button(doc, 'eam3d-mode-btn', { 'data-eam3d-map-mode': mode });
    btn.addEventListener('click', () => {
      state.mapMode = mode;
      syncAll();
    });
    mapModeBtns.set(mode, btn);
    mapModeGrid.appendChild(btn);
  });

  const scenarioSummary = el(doc, 'div', 'eam3d-summary-box', null, {
    'data-eam3d-summary': 'true',
  });

  caseCard.append(caseHead, scenarioField, mapModeTitle, mapModeGrid, scenarioSummary);
  deckEl.appendChild(caseCard);

  // Cards 2-4: atria, ventricles and His-Purkinje levers (eam3d-lever-cards.js).
  const leverCards = createLeverCards(doc, {
    levers: state.levers,
    onChange(patch) {
      state.levers = { ...state.levers, ...patch };
      syncAll();
    },
  });
  deckEl.append(...leverCards.cards);

  // Card 5: 3D RF ablation (eam3d-rf-console.js): point-by-point lesions, gaps, block, safety.
  const rfConsole = createRfConsole(doc, {
    getLang,
    getScenario: () => state.scenarioId,
    getLevers: () => state.levers,
    onChange({ blocked, lesions3d, target }) {
      const changed = [...blocked].sort().join() !== [...state.appliedLesions].sort().join();
      state.appliedLesions = [...blocked];
      if (changed) startSegment();
      rfVisual = { lesions3d, target };
      recomputeSurvey();
      syncAll();
    },
    onTip(pos) {
      if (atlasInstance && atlasInstance.ok) atlasInstance.setState({ rfTip: pos });
    },
    onFocus() {
      if (state.activeRail === 'ablate') return;
      state.activeRail = 'ablate';
      syncRailUI();
    },
  });
  sectionEls.ablate = rfConsole.card;
  deckEl.appendChild(rfConsole.card);

  // Card 6: probabilistic circuit modeling, "Find the circuit" (eam3d-survey-card.js).
  const surveyCard = createSurveyCard(doc, {
    onPreset(presetId) {
      state.surveyPreset = presetId;
      refreshSurvey();
    },
    onRuns(runs) {
      state.surveyRuns = runs;
      refreshSurvey();
    },
    onRun() {
      state.showCircuitRibbons = true;
      refreshSurvey();
    },
    onRibbons(show) {
      state.showCircuitRibbons = show;
      syncAll();
    },
    onSelectCircuit: toggleCircuit,
    // The proposed line is ablated with ideal RF lesions (the console redraws everything).
    onApplyLine: (lineId) => rfConsole.applyIdeal(lineId),
  });
  sectionEls.survey = surveyCard.card;
  deckEl.appendChild(surveyCard.card);

  // --- 2. Center Column (3D Viewport + Top C-arm Bar + Bottom Opacity/Inspect Bar) ---
  const centerCol = el(doc, 'div', 'eam3d-center', null, {
    'data-eam3d-center': 'true',
  });

  const topBar = el(doc, 'div', 'eam3d-topbar');
  const carmGroup = el(doc, 'div', 'eam3d-carm-group');
  const carmLabel = el(doc, 'span', 'eam3d-carm-label', 'C-ARM');
  carmGroup.appendChild(carmLabel);
  const carmBtns = new Map();
  EAM3D_VIEWS.forEach((viewId) => {
    const btn = button(doc, 'eam3d-carm-btn', { 'data-eam3d-carm': viewId });
    btn.addEventListener('click', () => {
      state.carmPreset = viewId;
      if (atlasInstance) atlasInstance.setView(viewId);
      syncAll();
    });
    carmBtns.set(viewId, btn);
    carmGroup.appendChild(btn);
  });

  const topBadges = el(doc, 'div', 'eam3d-top-badges');
  const statusPill = el(doc, 'span', 'eam3d-status-pill', null, {
    'data-eam3d-status-pill': 'true',
  });
  topBadges.appendChild(statusPill);
  topBar.append(carmGroup, topBadges);

  const stageEl = el(doc, 'div', 'eam3d-viewport-stage', null, {
    'data-eam3d-stage': 'true',
  });
  const canvasHost = el(doc, 'div', 'eam3d-canvas-host');
  const fallbackCanvas = el(doc, 'canvas', 'eam3d-fallback-canvas', null, {
    'data-eam3d-fallback-canvas': 'true',
  });
  fallbackCanvas.width = 640;
  fallbackCanvas.height = 460;
  stageEl.append(canvasHost, fallbackCanvas, rfConsole.hud);

  const bottomBar = el(doc, 'div', 'eam3d-bottombar');
  const bottomControls = el(doc, 'div', 'eam3d-bottom-controls');

  const scaleBar = el(doc, 'div', 'eam3d-scale-bar');
  const scaleGradient = el(doc, 'span', 'eam3d-scale-gradient');
  const scaleLabel = el(doc, 'span', '', null, {
    'data-eam3d-scale-label': 'true',
  });
  scaleBar.append(scaleGradient, scaleLabel);

  bottomControls.append(...leverCards.opacitySliders, scaleBar);

  const inspectBar = el(doc, 'div', 'eam3d-inspect-bar');
  const inspectReadout = el(doc, 'span', '', null, {
    'data-eam3d-inspect-readout': 'true',
  });
  inspectBar.append(inspectReadout);

  bottomBar.append(bottomControls, inspectBar);
  centerCol.append(topBar, stageEl, bottomBar);

  // --- 3. Right Column (26-Channel Live Scrolling Polygraph) ---
  const rightCol = el(doc, 'div', 'eam3d-right', null, {
    'data-eam3d-right': 'true',
  });
  const polyHead = el(doc, 'div', 'eam3d-poly-head');
  const polyTitle = el(doc, 'span', 'eam3d-poly-title');
  const polyCl = el(doc, 'span', 'eam3d-poly-cl', null, {
    'data-eam3d-cl-badge': 'true',
  });
  const sweepGroup = el(doc, 'div', 'eam3d-sweep-group');
  const sweepBtns = new Map();
  SWEEP_SPEEDS.forEach((spd) => {
    const btn = button(doc, 'eam3d-sweep-btn', { 'data-eam3d-sweep': String(spd) }, String(spd));
    btn.addEventListener('click', () => {
      state.sweepSpeed = spd;
      syncAll();
    });
    sweepBtns.set(spd, btn);
    sweepGroup.appendChild(btn);
  });
  polyHead.append(polyTitle, polyCl, sweepGroup);

  const polyCanvasWrap = el(doc, 'div', 'eam3d-poly-canvas-wrap');
  const polyCanvas = el(doc, 'canvas', 'eam3d-poly-canvas', null, {
    'data-eam3d-poly-canvas': 'true',
  });
  polyCanvas.setAttribute('role', 'img');
  polyCanvas.width = 360;
  polyCanvas.height = 540;
  polyCanvasWrap.appendChild(polyCanvas);
  rightCol.append(polyHead, polyCanvasWrap);
  const polygraph = createPolygraph(doc, { canvas: polyCanvas, wrap: polyCanvasWrap });

  // --- 4. Bottom Stimulator Bar (eam3d-stim-bar.js) ---
  const stimBar = createStimBar(doc, {
    onToggleRun() {
      state.running = !state.running;
      syncAll();
    },
    onDeliver: deliverStim,
  });

  root.append(leftCol, centerCol, rightCol, stimBar.element);

  function recomputeSurvey() {
    lastSurveyReport = runCircuitSurvey({
      mapPreset: state.surveyPreset,
      runs: state.surveyRuns,
      levers: state.levers,
      ablatedLines: new Set(state.appliedLesions),
    });
  }

  function refreshSurvey() {
    recomputeSurvey();
    syncAll();
  }

  function toggleCircuit(circuitNumber) {
    state.selectedCircuitIndex = state.selectedCircuitIndex === circuitNumber ? null : circuitNumber;
    syncAll();
  }

  /** Run a pacing maneuver from the stimulator bar and put its train on the timeline. */
  function deliverStim(maneuver) {
    const res = runStimManeuver({
      ...maneuver,
      scenarioId: state.scenarioId,
      levers: state.levers,
      ablatedLines: new Set(state.appliedLesions),
    });
    state.lastStimResult = res;
    // The train plays on the rhythm it was delivered into; its outcome follows the last stimulus.
    const train = buildStimTrain({
      ...maneuver,
      captures: res.captures,
      s2Captures: res.s2Captures !== false,
      gridSite: state.gridSite,
    });
    startSegment(train);
    if (res.nextScenario) state.scenarioId = res.nextScenario;
    timeline.startAt(state.simTimeMs + train.durationMs, currentRhythm());
    syncAll();
  }

  // --- Event wiring ---
  scenarioSelect.addEventListener('change', () => {
    state.scenarioId = scenarioSelect.value;
    state.inspectedPoint = null;
    state.lastStimResult = null;
    startSegment();
    if (state.scenarioId === 'vt-ischemic' || state.scenarioId === 'atrial-scar-flutter') {
      state.surveyPreset = state.scenarioId === 'vt-ischemic' ? 'vt-scar' : 'biatrial-scar';
      recomputeSurvey();
    }
    syncAll();
  });

  importMapBtn.addEventListener('click', () => {
    state.activeRail = 'survey';
    state.mapMode = 'voltage';
    state.surveyPreset = 'custom-import';
    state.showCircuitRibbons = true;
    refreshSurvey();
    scrollToCard(sectionEls.survey);
  });

  fallbackCanvas.addEventListener('click', (ev) => {
    state.inspectedPoint = pickFallbackPoint(fallbackCanvas, ev, {
      scenarioId: state.scenarioId,
      levers: state.levers,
      ablated: state.appliedLesions,
    });
    syncInspectReadout();
    drawFallbackViewport();
  });

  function getT() {
    return { t: EAM3D_TEXT[getLang() === 'en' ? 'en' : 'tr'] };
  }

  function syncRailUI() {
    const { t } = getT();
    railButtons.forEach(({ btn, label }, id) => {
      toggleClass(btn, 'is-active', state.activeRail === id);
      label.textContent = t.rails[id] || id;
    });
    rfConsole.hud.hidden = !(state.activeRail === 'ablate' || rfConsole.isDelivering());
    if (atlasInstance && atlasInstance.ok) atlasInstance.setState(rfOverlay());
  }

  /** Catheter tip and target guide on the map while the RF card is in use. */
  function rfOverlay() {
    const showRf = state.activeRail === 'ablate' || rfConsole.isDelivering();
    return { rfTip: showRf ? rfConsole.tipPosition() : null, rfTarget: showRf ? rfConsole.targetLine() : null };
  }

  function syncInspectReadout() {
    const { t } = getT();
    if (!state.inspectedPoint) {
      inspectReadout.textContent = t.viewport.pointReadout;
      return;
    }
    const p = state.inspectedPoint;
    const tagStr = p.tag ? ` · [${p.tag.toUpperCase()}]` : '';
    const tissue = t.viewport.tissues[p.tissue] || p.tissue;
    inspectReadout.textContent = `${p.chamber} · ${tissue} · LAT ${p.lat} ms · Bipolar ${p.bipolar} mV · Unipolar ${p.unipolar} mV${tagStr}`;
  }

  /** Atrial cycle and ventricular rate of a rhythm; they differ in 2:1 flutter and in AF. */
  function rhythmLine(spec, t) {
    const bpm = Math.round(60000 / Math.max(120, spec.vTcl));
    if (spec.irregularV) {
      return `${t.polygraph.atrial} ${t.polygraph.cl} ${spec.tcl} ms · ${t.polygraph.ventricular} ~${bpm} ${t.polygraph.bpm} (${t.polygraph.irregular})`;
    }
    if (spec.avRatio > 1) {
      return `${t.polygraph.atrial} ${t.polygraph.cl} ${spec.tcl} ms · ${t.polygraph.ventricular} ${bpm} ${t.polygraph.bpm} (${spec.avRatio}:1)`;
    }
    return `${t.polygraph.cl} ${spec.tcl} ms · ${bpm} ${t.polygraph.bpm}`;
  }

  /** Rhythm on the monitor right now: the pacing train while it runs, else the segment's rhythm. */
  function liveRhythmLine(t) {
    const seg = timeline.at(state.simTimeMs);
    if (timeline.isPacingAt(state.simTimeMs)) {
      const cycle = seg.stim.spikes[1] - seg.stim.spikes[0];
      return `${t.status.pacing} · ${seg.stim.mode === 's1s2' ? 'S1' : t.polygraph.cl} ${cycle} ms`;
    }
    return rhythmLine(scenarioSpec(seg.scenarioId, state.levers, new Set(seg.ablated)), t);
  }

  /** Outcome of the last maneuver, or the stimulator output while nothing was delivered. */
  function stimVerdictText(t) {
    const res = state.lastStimResult;
    if (!res || !res.summaryCode) return `${t.mapModes[state.mapMode]} · ${t.stim.output}`;
    const verdict = t.stim.verdicts[res.summaryCode];
    return typeof verdict === 'function' ? verdict(res.ppi, res.ppiMinusTcl) : String(res.summaryCode);
  }

  function syncAll() {
    const { t } = getT();
    syncRailUI();

    deckTitle.textContent = t.title;
    deckSub.textContent = t.intro;
    caseTitle.textContent = t.rhythmBox.title;
    importMapBtn.textContent = t.rhythmBox.importMap;
    scenarioLabel.textContent = t.rhythmBox.scenario;

    scenarioOptions.forEach((opt) => {
      opt.textContent = t.scenarios[opt.value] || opt.value;
    });
    scenarioSelect.value = state.scenarioId;

    mapModeTitle.textContent = t.rhythmBox.mapMode;
    mapModeBtns.forEach((btn, mode) => {
      btn.textContent = t.mapModes[mode] || mode;
      toggleClass(btn, 'is-active', state.mapMode === mode);
    });

    const appliedSet = new Set(state.appliedLesions);
    const effSpec = scenarioSpec(state.scenarioId, state.levers, appliedSet);
    scenarioSummary.textContent = `${t.scenarios[effSpec.id] || effSpec.id} · ${rhythmLine(effSpec, t)}`;

    leverCards.sync(state.levers, t);

    rfConsole.setScenario(state.scenarioId);
    rfConsole.render();

    surveyCard.sync({
      t,
      preset: state.surveyPreset,
      runs: state.surveyRuns,
      showRibbons: state.showCircuitRibbons,
      selectedCircuit: state.selectedCircuitIndex,
      report: lastSurveyReport,
    });

    // Center viewport labels
    carmBtns.forEach((btn, id) => {
      btn.textContent = t.views[id] || id;
      toggleClass(btn, 'is-active', state.carmPreset === id);
    });

    shownSegment = timeline.at(state.simTimeMs);
    shownPacing = timeline.isPacingAt(state.simTimeMs);
    const liveLine = liveRhythmLine(t);
    statusPill.textContent = `${state.running ? t.status.running : t.status.frozen} · ${liveLine}`;

    scaleLabel.textContent = t.viewport[LEGEND_KEYS[state.mapMode]];
    if (scaleGradient.style) scaleGradient.style.background = SCALE_GRADIENTS[state.mapMode];
    syncInspectReadout();

    // Right polygraph header
    polyTitle.textContent = t.polygraph.record;
    polyCl.textContent = liveLine;
    polyCanvas.setAttribute('aria-label', t.polygraph.canvasLabel);
    sweepBtns.forEach((btn, spd) => {
      toggleClass(btn, 'is-active', state.sweepSpeed === spd);
    });

    stimBar.sync({ t, running: state.running, verdictText: stimVerdictText(t) });

    if (atlasInstance && atlasInstance.ok) {
      atlasInstance.setState({
        ...timeline.rhythmAt(state.simTimeMs),
        mapMode: state.mapMode,
        view: state.carmPreset,
        levers: state.levers,
        gridSite: state.gridSite,
        ablatedLines: state.appliedLesions,
        rfLesions: rfVisual.lesions3d,
        ...rfOverlay(),
        showSurveyRibbons: state.showCircuitRibbons,
        selectedCircuit: state.selectedCircuitIndex,
        surveyPreset: state.surveyPreset,
        surveyRuns: state.surveyRuns,
      });
    }
    drawPolygraph();
    drawFallbackViewport();
  }

  function drawPolygraph() {
    polygraph.draw({
      nowMs: state.simTimeMs,
      sweepSpeed: state.sweepSpeed,
      levers: state.levers,
      gridSite: state.gridSite,
      segmentAt: timeline.at,
    });
  }

  function drawFallbackViewport() {
    const atlasReady = Boolean(atlasInstance && atlasInstance.ok && state.atlasStatus === 'ready');
    toggleClass(stageEl, 'is-fallback', !atlasReady);
    if (atlasReady) return;
    drawFallbackView(fallbackCanvas, {
      scenarioId: state.scenarioId,
      levers: state.levers,
      ablated: state.appliedLesions,
      lesions: rfVisual.lesions3d,
    });
  }

  function ensureAtlasMounted() {
    if (atlasInitStarted) return;
    if (!hasWebGL(doc)) {
      state.atlasStatus = 'failed';
      return;
    }
    atlasInitStarted = true;
    atlasInstance = createEam3dAtlas({
      onPointSelect(info) {
        state.inspectedPoint = info;
        // The HD Grid moved to this point; its three polygraph channels now record from there.
        state.gridSite = { pos: info.point, chamber: info.chamber.toLowerCase() };
        syncInspectReadout();
      },
      onCircuitSelect: toggleCircuit,
      onStatus(status) {
        state.atlasStatus = status;
        drawFallbackViewport();
      },
    });
    if (atlasInstance && atlasInstance.element) {
      canvasHost.appendChild(atlasInstance.element);
    }
  }

  const nextFrame = (fn) => {
    const win = doc.defaultView || globalThis;
    return typeof win.requestAnimationFrame === 'function' ? win.requestAnimationFrame(fn) : 0;
  };
  const cancelFrame = (id) => {
    const win = doc.defaultView || globalThis;
    if (id && typeof win.cancelAnimationFrame === 'function') win.cancelAnimationFrame(id);
  };

  function stepFrame(ts) {
    if (!active) return;
    if (!lastFrameTs) lastFrameTs = ts;
    const dt = Math.min(50, Math.max(8, ts - lastFrameTs));
    lastFrameTs = ts;

    if (state.running) {
      state.simTimeMs += dt;
    }
    rfConsole.tick(dt);
    // A pacing train just ended (or began): refresh the rhythm badges.
    if (timeline.at(state.simTimeMs) !== shownSegment || timeline.isPacingAt(state.simTimeMs) !== shownPacing) syncAll();

    if (atlasInstance && atlasInstance.ok && state.atlasStatus === 'ready') {
      toggleClass(stageEl, 'is-fallback', false);
      atlasInstance.setState(timeline.rhythmAt(state.simTimeMs));
    } else {
      drawFallbackViewport();
    }
    drawPolygraph();

    rafId = nextFrame(stepFrame);
  }

  return {
    element: root,
    render() {
      if (active) ensureAtlasMounted();
      syncAll();
    },
    draw() {
      drawPolygraph();
      drawFallbackViewport();
    },
    setActive(flag) {
      const next = Boolean(flag);
      root.hidden = !next;
      if (active === next) {
        if (active) syncAll();
        return;
      }
      active = next;
      if (active) {
        ensureAtlasMounted();
        syncAll();
        lastFrameTs = 0;
        rafId = nextFrame(stepFrame);
      } else {
        cancelFrame(rafId);
        rafId = 0;
      }
    },
    openPreset({ scenario, mapMode, rail, surveyPreset } = {}) {
      if (scenario && EAM3D_SCENARIOS.includes(scenario)) {
        state.scenarioId = scenario;
        startSegment();
      }
      if (mapMode && EAM3D_MAP_MODES.includes(mapMode)) {
        state.mapMode = mapMode;
      }
      if (rail && RAILS.includes(rail)) {
        state.activeRail = rail;
      }
      if (surveyPreset && SURVEY_PRESETS.includes(surveyPreset)) {
        state.surveyPreset = surveyPreset;
        state.showCircuitRibbons = true;
        recomputeSurvey();
      }
      if (active) ensureAtlasMounted();
      syncAll();
    },
    getState() {
      return { ...state, ...stimBar.getSettings(), rf: rfConsole.getState() };
    },
    /** RF console (tests: deliverNow, applyIdeal, clear). */
    rf: rfConsole,
    /** The control Space presses: RF on the ablation card, otherwise run / freeze. */
    spaceTarget() {
      return state.activeRail === 'ablate' ? rfConsole.spaceTarget() : stimBar.runButton;
    },
    getAtlas() {
      return atlasInstance
        ? {
            ...atlasInstance,
            isReady: () => Boolean(atlasInstance.ok && state.atlasStatus === 'ready'),
          }
        : null;
    },
    getSurveyReport() {
      return lastSurveyReport;
    },
  };
}

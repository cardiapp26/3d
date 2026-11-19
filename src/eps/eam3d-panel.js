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
import { createMappingCard } from './eam3d-mapping-card.js';
import { MAPPING_CATHETERS, MAP_PALETTES } from './eam3d-mapping-model.js';

const RAILS = Object.freeze(['case', 'map', 'ablate', 'survey']);
const RAIL_ICONS = Object.freeze({ case: '3D', map: 'MAP', ablate: 'RF', survey: 'AI' });
const SWEEP_SPEEDS = Object.freeze([25, 50, 100, 200]);
const LEGEND_KEYS = Object.freeze({ live: 'legendLive', lat: 'legendLat', voltage: 'legendVoltage', phase: 'legendPhase' });

// Colour bar under the 3D view, matching what each map mode paints on the heart. Activation
// and voltage maps follow the mapping system of the selected catheter (CARTO or EnSite).
const LIVE_GRADIENT = 'linear-gradient(90deg, #fffbeb 0%, #ea580c 30%, #8a6d28 100%)';
const PHASE_GRADIENT = 'linear-gradient(90deg, hsl(0 85% 52%), hsl(74 85% 52%), hsl(148 85% 52%), hsl(221 85% 52%), hsl(295 85% 52%))';
function scaleGradient(mapMode, system) {
  if (mapMode === 'live') return LIVE_GRADIENT;
  if (mapMode === 'phase') return PHASE_GRADIENT;
  const palette = MAP_PALETTES[system];
  if (mapMode === 'lat') return `linear-gradient(90deg, ${palette.lat.join(', ')})`;
  // Voltage: a flat block for everything below the window, then the scale inside it.
  return `linear-gradient(90deg, ${palette.belowWindow} 0 16%, ${palette.voltage.map((c, i) => `${c} ${16 + (i * 84) / (palette.voltage.length - 1)}%`).join(', ')})`;
}

// Chamber a mapping run starts in for each rhythm.
const MAPPING_CHAMBER_BY_SCENARIO = Object.freeze({
  avnrt: 'ra',
  sinus: 'ra',
  'flutter-typical': 'ra',
  'atrial-scar-flutter': 'la',
  'avrt-left': 'la',
  'vt-ischemic': 'lv',
  'pvc-rvot': 'rv',
  af: 'la',
});
const GRID_CHANNEL_IDS = Object.freeze(['grid-a12', 'grid-a23', 'grid-a34']);

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
    mappingCatheter: 'pentaray',
    mappingChamber: MAPPING_CHAMBER_BY_SCENARIO.avnrt,
    mappingRunning: false,
    mappingResetToken: 0,
    mappingProgress: null,
  };
  // Set by callbacks that fire inside an atlas update; the next frame runs the full sync.
  let syncPending = false;

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
      if (railId === 'ablate') {
        openRf();
        return;
      }
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

  // Mapping card: catheter, chamber and the point-by-point acquisition (eam3d-mapping-card.js).
  const discardMap = () => {
    state.mappingRunning = false;
    state.mappingProgress = null;
    state.mappingResetToken += 1;
  };
  const mappingCard = createMappingCard(doc, {
    onCatheter(catheterId) {
      state.mappingCatheter = catheterId;
      discardMap();
      syncAll();
    },
    onChamber(chamber) {
      state.mappingChamber = chamber;
      discardMap();
      syncAll();
    },
    onToggle() {
      state.mappingRunning = !state.mappingRunning;
      // Show the map that is being built: activation, or voltage when the cycle is unstable.
      if (state.mappingRunning && (state.mapMode === 'live' || state.mapMode === 'phase')) {
        state.mapMode = currentSpec().id === 'af' ? 'voltage' : 'lat';
      }
      if (state.mappingRunning) state.running = true;
      syncAll();
    },
    onReset() {
      discardMap();
      syncAll();
    },
  });
  sectionEls.map = mappingCard.card;
  deckEl.appendChild(mappingCard.card);

  // Cards 2-4: atria, ventricles and His-Purkinje levers (eam3d-lever-cards.js).
  const leverCards = createLeverCards(doc, {
    levers: state.levers,
    onChange(patch) {
      state.levers = { ...state.levers, ...patch };
      syncAll();
    },
  });
  deckEl.append(...leverCards.cards);

  // Back from the RF console to the stimulator (the rail the user came from).
  let railBeforeRf = 'case';
  const stimSwitch = button(doc, 'eam3d-btn eam3d-dock-switch', { 'data-eam3d-open-stim': 'true' });

  // Card 5: 3D RF ablation (eam3d-rf-console.js): point-by-point lesions, gaps, block, safety.
  const rfConsole = createRfConsole(doc, {
    leading: stimSwitch,
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
      railBeforeRf = state.activeRail;
      state.activeRail = 'ablate';
      syncRailUI();
    },
  });
  // The RF console docks under the 3D view, in place of the stimulator, while Ablation is open.
  sectionEls.ablate = rfConsole.card;
  rfConsole.card.hidden = true;
  stimSwitch.addEventListener('click', () => {
    if (rfConsole.isDelivering()) return;
    state.activeRail = railBeforeRf === 'ablate' ? 'case' : railBeforeRf;
    syncRailUI();
  });

  /** Open the RF console in the bottom bar and bring it into view. */
  function openRf() {
    if (state.activeRail !== 'ablate') railBeforeRf = state.activeRail;
    state.activeRail = 'ablate';
    syncRailUI();
    scrollToCard(rfConsole.card);
  }

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
    // The proposed line is ablated with ideal RF lesions and the RF console opens to show them.
    onApplyLine(lineId) {
      rfConsole.applyIdeal(lineId);
      openRf();
    },
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
  const scaleBarFill = el(doc, 'span', 'eam3d-scale-gradient');
  const scaleLabel = el(doc, 'span', '', null, {
    'data-eam3d-scale-label': 'true',
  });
  scaleBar.append(scaleBarFill, scaleLabel);

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
    onOpenRf: openRf,
  });

  root.append(leftCol, centerCol, rightCol, stimBar.element, rfConsole.card);

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

  /** Select a circuit (or clear it) and turn the C-arm to the view that shows it best. */
  function toggleCircuit(circuitNumber) {
    state.selectedCircuitIndex = state.selectedCircuitIndex === circuitNumber ? null : circuitNumber;
    const circuit = lastSurveyReport.circuits.find((c) => c.number === state.selectedCircuitIndex);
    if (circuit && circuit.view && EAM3D_VIEWS.includes(circuit.view)) {
      state.carmPreset = circuit.view;
      if (atlasInstance) atlasInstance.setView(circuit.view);
    }
    syncAll();
  }

  // Legend and landmark labels of the 3D circuit layer, with the ablation line names.
  const circuitLabelCache = new Map();
  function circuitLabels(t) {
    if (!circuitLabelCache.has(t)) circuitLabelCache.set(t, { ...t.surveyBox.map3d, lines: t.ablationBox.lines });
    return circuitLabelCache.get(t);
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
    // A map belongs to the rhythm it was acquired in.
    discardMap();
    state.mappingChamber = MAPPING_CHAMBER_BY_SCENARIO[state.scenarioId] || state.mappingChamber;
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

  const currentSpec = () => scenarioSpec(state.scenarioId, state.levers, new Set(state.appliedLesions));
  const mappingSystem = () => MAPPING_CATHETERS[state.mappingCatheter].system;

  function syncMappingCard(t) {
    mappingCard.sync({
      t,
      catheterId: state.mappingCatheter,
      chamber: state.mappingChamber,
      running: state.mappingRunning,
      progress: state.mappingProgress,
      unstableCycle: currentSpec().id === 'af',
      gradient: scaleGradient('lat', mappingSystem()),
    });
  }

  /** Progress of the mapping run, reported by the 3D map after every acquired beat. */
  function onMappingProgress(progress) {
    state.mappingProgress = progress.active ? progress : null;
    // The polygraph's mapping-catheter channels record from where the catheter is now.
    if (progress.running && progress.site) state.gridSite = { pos: progress.site, chamber: progress.chamber };
    if (progress.done && state.mappingRunning) {
      state.mappingRunning = false;
      syncPending = true;
    }
    syncMappingCard(getT().t);
  }

  function getT() {
    return { t: EAM3D_TEXT[getLang() === 'en' ? 'en' : 'tr'] };
  }

  function syncRailUI() {
    const { t } = getT();
    railButtons.forEach(({ btn, label }, id) => {
      toggleClass(btn, 'is-active', state.activeRail === id);
      label.textContent = t.rails[id] || id;
    });
    const rfOpen = state.activeRail === 'ablate' || rfConsole.isDelivering();
    stimSwitch.textContent = t.stim.backToStim;
    stimSwitch.disabled = rfConsole.isDelivering();
    rfConsole.hud.hidden = !rfOpen;
    rfConsole.card.hidden = !rfOpen;
    stimBar.element.hidden = rfOpen;
    toggleClass(root, 'is-rf-docked', rfOpen);
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

    const system = mappingSystem();
    const legendKey = LEGEND_KEYS[state.mapMode];
    scaleLabel.textContent = t.viewport[`${legendKey}_${system}`] || t.viewport[legendKey];
    if (scaleBarFill.style) scaleBarFill.style.background = scaleGradient(state.mapMode, system);
    syncMappingCard(t);
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
        clockMs: state.simTimeMs,
        mappingCatheter: state.mappingCatheter,
        mappingChamber: state.mappingChamber,
        mappingRunning: state.mappingRunning,
        mappingResetToken: state.mappingResetToken,
        ablatedLines: state.appliedLesions,
        rfLesions: rfVisual.lesions3d,
        ...rfOverlay(),
        showSurveyRibbons: state.showCircuitRibbons,
        selectedCircuit: state.selectedCircuitIndex,
        circuitLabels: circuitLabels(t),
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
      labels: Object.fromEntries(
        GRID_CHANNEL_IDS.map((id, i) => [id, MAPPING_CATHETERS[state.mappingCatheter].polygraphLabels[i]]),
      ),
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
      onMapping: onMappingProgress,
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
    if (syncPending || timeline.at(state.simTimeMs) !== shownSegment || timeline.isPacingAt(state.simTimeMs) !== shownPacing) {
      syncPending = false;
      syncAll();
    }

    if (atlasInstance && atlasInstance.ok && state.atlasStatus === 'ready') {
      toggleClass(stageEl, 'is-fallback', false);
      atlasInstance.setState({ ...timeline.rhythmAt(state.simTimeMs), clockMs: state.simTimeMs });
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

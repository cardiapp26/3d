// CardaxEP-inspired 3D Electroanatomical Mapping (EAM) & Whole-Heart Simulation Workstation Panel

import {
  EAM3D_SCENARIOS,
  EAM3D_MAP_MODES,
  EAM3D_WALL_LAYERS,
  EAM3D_VIEWS,
  EAM3D_SURVEY_RUNS,
  DEFAULT_LEVERS,
  EAM3D_CATHETERS,
  EAM3D_CHANNELS,
  PACING_CHANNELS,
  EAM3D_ABLATION_LINES,
  scenarioSpec,
  evaluateVertex3d,
  sampleChannelsAt,
  runStimManeuver,
  runCircuitSurvey,
} from './eam3d-model.js';
import { EAM3D_TEXT } from './eam3d-text.js';
import { createEam3dAtlas } from './eam3d-atlas.js';

function el(doc, tag, className, text, attrs = {}) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  for (const [k, v] of Object.entries(attrs)) {
    node.setAttribute(k, String(v));
  }
  return node;
}

function toggleClass(node, cls, enabled) {
  const parts = String(node.className || '')
    .split(/\s+/)
    .filter(Boolean);
  const has = parts.includes(cls);
  if (enabled && !has) parts.push(cls);
  if (!enabled && has) parts.splice(parts.indexOf(cls), 1);
  node.className = parts.join(' ');
}

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
    stimMode: 'burst',
    stimBclMs: 240,
    stimS2Ms: 270,
    stimChannel: 'rv-d',
    lastStimResult: null,
    surveyPreset: 'biatrial-scar',
    surveyRuns: 100,
    showCircuitRibbons: false,
    selectedCircuitIndex: null,
    inspectedPoint: null,
    atlasStatus: 'loading',
  };

  let active = false;
  let rafId = 0;
  let lastFrameTs = 0;
  let atlasInstance = null;
  let atlasInitStarted = false;
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
  const railIcons = {
    case: '3D',
    map: 'MAP',
    ablate: 'RF',
    survey: 'AI',
  };

  const sectionEls = {};

  ['case', 'map', 'ablate', 'survey'].forEach((railId) => {
    const btn = el(doc, 'button', 'eam3d-rail-btn', null, {
      type: 'button',
      'data-eam3d-rail': railId,
    });
    btn.type = 'button';
    const icon = el(doc, 'span', 'eam3d-rail-icon', railIcons[railId]);
    const label = el(doc, 'span', 'eam3d-rail-label', railId.toUpperCase());
    btn.append(icon, label);
    btn.addEventListener('click', () => {
      state.activeRail = railId;
      syncRailUI();
      const targetCard = sectionEls[railId];
      if (targetCard && typeof targetCard.scrollIntoView === 'function') {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
    railButtons.set(railId, { btn, label });
    railEl.appendChild(btn);
  });

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
  const importMapBtn = el(doc, 'button', 'eam3d-btn eam3d-btn--accent', null, {
    type: 'button',
    'data-eam3d-import-map': 'true',
  });
  importMapBtn.type = 'button';
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
    const btn = el(doc, 'button', 'eam3d-mode-btn', null, {
      type: 'button',
      'data-eam3d-map-mode': mode,
    });
    btn.type = 'button';
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

  // Card 2: Atria Levers
  const atriaCard = el(doc, 'div', 'eam3d-card');
  const atriaHead = el(doc, 'div', 'eam3d-card-head');
  const atriaTitle = el(doc, 'h3', 'eam3d-card-title');
  const resetAtriaBtn = el(doc, 'button', 'eam3d-btn', null, {
    type: 'button',
    'data-eam3d-reset-atria': 'true',
  });
  resetAtriaBtn.type = 'button';
  atriaHead.append(atriaTitle, resetAtriaBtn);

  const atriaCheckGrid = el(doc, 'div', 'eam3d-check-grid');
  const checkControls = new Map();

  function makeLeverCheck(key, container, isStateTopLevel = false) {
    const wrap = el(doc, 'label', 'eam3d-check');
    const input = el(doc, 'input', '', null, {
      type: 'checkbox',
      'data-eam3d-check': key,
    });
    input.type = 'checkbox';
    input.checked = Boolean(isStateTopLevel ? state[key] : state.levers[key]);
    const textSpan = el(doc, 'span');
    wrap.append(input, textSpan);
    input.addEventListener('change', () => {
      if (isStateTopLevel) {
        state[key] = Boolean(input.checked);
      } else {
        state.levers[key] = Boolean(input.checked);
      }
      syncAll();
    });
    checkControls.set(key, { input, textSpan, isStateTopLevel });
    container.appendChild(wrap);
  }

  ['raVisible', 'laVisible', 'highDensityAtria'].forEach((k) =>
    makeLeverCheck(k, atriaCheckGrid, false),
  );

  const sliderControls = new Map();
  function makeLeverSlider(key, min, max, step, container) {
    const row = el(doc, 'div', 'eam3d-slider-row');
    const head = el(doc, 'div', 'eam3d-slider-head');
    const labelSpan = el(doc, 'span');
    const valSpan = el(doc, 'span');
    head.append(labelSpan, valSpan);
    const input = el(doc, 'input', '', null, {
      type: 'range',
      min: String(min),
      max: String(max),
      step: String(step),
      value: String(state.levers[key]),
      'data-eam3d-slider': key,
    });
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(state.levers[key]);
    input.addEventListener('input', () => {
      state.levers[key] = Number(input.value);
      syncAll();
    });
    row.append(head, input);
    sliderControls.set(key, { input, labelSpan, valSpan });
    container.appendChild(row);
  }

  atriaCard.append(atriaHead, atriaCheckGrid);
  makeLeverSlider('atrialCv', 0.35, 1.5, 0.05, atriaCard);
  makeLeverSlider('atrialRestitution', 0.4, 1.5, 0.05, atriaCard);
  makeLeverSlider('rateAdaptation', 0.0, 1.0, 0.05, atriaCard);
  makeLeverSlider('afRemodelling', 0.0, 1.0, 0.05, atriaCard);
  deckEl.appendChild(atriaCard);

  // Card 3: Ventricles & Wall Layers
  const ventCard = el(doc, 'div', 'eam3d-card');
  const ventHead = el(doc, 'div', 'eam3d-card-head');
  const ventTitle = el(doc, 'h3', 'eam3d-card-title');
  const resetVentBtn = el(doc, 'button', 'eam3d-btn', null, {
    type: 'button',
    'data-eam3d-reset-ventricles': 'true',
  });
  resetVentBtn.type = 'button';
  ventHead.append(ventTitle, resetVentBtn);

  const ventCheckGrid = el(doc, 'div', 'eam3d-check-grid');
  ['ventriclesVisible', 'highDensityVentricles', 'vtStudyMesh'].forEach((k) =>
    makeLeverCheck(k, ventCheckGrid, false),
  );

  const wallRow = el(doc, 'div', 'eam3d-wall-row');
  const wallBtns = new Map();
  EAM3D_WALL_LAYERS.forEach((layer) => {
    const btn = el(doc, 'button', 'eam3d-wall-btn', null, {
      type: 'button',
      'data-eam3d-wall': layer,
    });
    btn.type = 'button';
    btn.addEventListener('click', () => {
      state.levers.wallLayer = layer;
      syncAll();
    });
    wallBtns.set(layer, btn);
    wallRow.appendChild(btn);
  });

  ventCard.append(ventHead, ventCheckGrid, wallRow);
  makeLeverSlider('ventricularCv', 0.3, 1.4, 0.05, ventCard);
  makeLeverSlider('ventricularRestitution', 0.4, 1.5, 0.05, ventCard);
  deckEl.appendChild(ventCard);

  // Card 4: His-Purkinje Conduction
  const condCard = el(doc, 'div', 'eam3d-card');
  const condTitle = el(doc, 'h3', 'eam3d-card-title');
  const condCheckGrid = el(doc, 'div', 'eam3d-check-grid');
  ['showConduction', 'conductionParticipates'].forEach((k) =>
    makeLeverCheck(k, condCheckGrid, false),
  );
  condCard.append(condTitle, condCheckGrid);
  deckEl.appendChild(condCard);

  // Card 5: 3D RF Ablation Lines
  const ablateCard = el(doc, 'div', 'eam3d-card');
  sectionEls.ablate = ablateCard;
  const ablateHead = el(doc, 'div', 'eam3d-card-head');
  const ablateTitle = el(doc, 'h3', 'eam3d-card-title');
  const clearLesionsBtn = el(doc, 'button', 'eam3d-btn eam3d-btn--danger', null, {
    type: 'button',
    'data-eam3d-clear-lesions': 'true',
  });
  clearLesionsBtn.type = 'button';
  ablateHead.append(ablateTitle, clearLesionsBtn);

  const ablationListEl = el(doc, 'div', 'eam3d-list', null, {
    'data-eam3d-ablation-list': 'true',
  });
  const ablationVerdictEl = el(doc, 'div', 'eam3d-summary-box', null, {
    'data-eam3d-ablation-verdict': 'true',
  });
  ablateCard.append(ablateHead, ablationListEl, ablationVerdictEl);
  deckEl.appendChild(ablateCard);

  // Card 6: Probabilistic Circuit Modeling ("Find the circuit")
  const surveyCard = el(doc, 'div', 'eam3d-card', null, {
    'data-eam3d-survey-card': 'true',
  });
  sectionEls.survey = surveyCard;
  const surveyTitle = el(doc, 'h3', 'eam3d-card-title');
  const surveySub = el(doc, 'p', 'eam3d-deck-sub');

  const surveyPresetField = el(doc, 'label', 'eam3d-field');
  const surveyPresetLabel = el(doc, 'span');
  const surveyPresetSelect = el(doc, 'select', 'eam3d-select', null, {
    'data-eam3d-survey-preset': 'true',
  });
  const surveyPresetKeys = ['biatrial-scar', 'vt-scar', 'custom-import'];
  const surveyPresetOptions = surveyPresetKeys.map((presetId) => {
    const opt = el(doc, 'option');
    opt.value = presetId;
    surveyPresetSelect.appendChild(opt);
    return opt;
  });
  surveyPresetField.append(surveyPresetLabel, surveyPresetSelect);

  const surveyRunsField = el(doc, 'label', 'eam3d-field');
  const surveyRunsLabel = el(doc, 'span');
  const surveyRunsSelect = el(doc, 'select', 'eam3d-select', null, {
    'data-eam3d-survey-runs': 'true',
  });
  EAM3D_SURVEY_RUNS.forEach((n) => {
    const opt = el(doc, 'option', '', String(n));
    opt.value = String(n);
    surveyRunsSelect.appendChild(opt);
  });
  surveyRunsSelect.value = String(state.surveyRuns);
  surveyRunsField.append(surveyRunsLabel, surveyRunsSelect);

  const runSurveyBtn = el(doc, 'button', 'eam3d-btn eam3d-btn--accent', null, {
    type: 'button',
    'data-eam3d-run-survey': 'true',
  });
  runSurveyBtn.type = 'button';

  const ribbonCheckWrap = el(doc, 'div', 'eam3d-check-grid');
  makeLeverCheck('showCircuitRibbons', ribbonCheckWrap, true);

  const circuitsHeader = el(doc, 'div', 'eam3d-card-title');
  const circuitsListEl = el(doc, 'div', 'eam3d-list', null, {
    'data-eam3d-circuits-list': 'true',
  });

  const proposedHeader = el(doc, 'div', 'eam3d-card-title');
  const proposedListEl = el(doc, 'div', 'eam3d-list', null, {
    'data-eam3d-proposed-list': 'true',
  });

  surveyCard.append(
    surveyTitle,
    surveySub,
    surveyPresetField,
    surveyRunsField,
    runSurveyBtn,
    ribbonCheckWrap,
    circuitsHeader,
    circuitsListEl,
    proposedHeader,
    proposedListEl,
  );
  deckEl.appendChild(surveyCard);

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
    const btn = el(doc, 'button', 'eam3d-carm-btn', null, {
      type: 'button',
      'data-eam3d-carm': viewId,
    });
    btn.type = 'button';
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
  stageEl.append(canvasHost, fallbackCanvas);

  const bottomBar = el(doc, 'div', 'eam3d-bottombar');
  const bottomControls = el(doc, 'div', 'eam3d-bottom-controls');

  function makeInlineOpacitySlider(key, min, max, step) {
    const wrap = el(doc, 'label', 'eam3d-inline-slider');
    const lbl = el(doc, 'span');
    const input = el(doc, 'input', '', null, {
      type: 'range',
      min: String(min),
      max: String(max),
      step: String(step),
      value: String(state.levers[key]),
      'data-eam3d-slider': key,
    });
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(state.levers[key]);
    input.addEventListener('input', () => {
      state.levers[key] = Number(input.value);
      syncAll();
    });
    wrap.append(lbl, input);
    sliderControls.set(key, { input, labelSpan: lbl, valSpan: null });
    return wrap;
  }

  const myoSliderWrap = makeInlineOpacitySlider('myocardiumOpacity', 10, 100, 5);
  const condSliderWrap = makeInlineOpacitySlider('conductionOpacity', 10, 100, 5);

  const scaleBar = el(doc, 'div', 'eam3d-scale-bar');
  const scaleGradient = el(doc, 'span', 'eam3d-scale-gradient');
  const scaleLabel = el(doc, 'span', '', null, {
    'data-eam3d-scale-label': 'true',
  });
  scaleBar.append(scaleGradient, scaleLabel);

  bottomControls.append(myoSliderWrap, condSliderWrap, scaleBar);

  const inspectBar = el(doc, 'div', 'eam3d-inspect-bar');
  const inspectReadout = el(doc, 'span', '', null, {
    'data-eam3d-inspect-readout': 'true',
  });
  inspectBar.append(inspectReadout);

  bottomBar.append(bottomControls, inspectBar);
  centerCol.append(topBar, stageEl, bottomBar);

  // --- 3. Right Column (23-Channel Live Scrolling Polygraph) ---
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
  [25, 50, 100, 200].forEach((spd) => {
    const btn = el(doc, 'button', 'eam3d-sweep-btn', `${spd}`, {
      type: 'button',
      'data-eam3d-sweep': String(spd),
    });
    btn.type = 'button';
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
  polyCanvas.width = 360;
  polyCanvas.height = 540;
  polyCanvasWrap.appendChild(polyCanvas);
  rightCol.append(polyHead, polyCanvasWrap);

  // --- 4. Bottom Stimulator Bar ---
  const stimBar = el(doc, 'div', 'eam3d-stimbar', null, {
    'data-eam3d-stimbar': 'true',
  });
  const stimControls = el(doc, 'div', 'eam3d-stim-controls');

  const runBtn = el(doc, 'button', 'eam3d-stim-run', null, {
    type: 'button',
    'data-eam3d-run': 'true',
  });
  runBtn.type = 'button';
  stimControls.appendChild(runBtn);

  const stimModeBtns = new Map();
  ['pace', 'burst', 's1s2'].forEach((m) => {
    const btn = el(doc, 'button', 'eam3d-btn', null, {
      type: 'button',
      'data-eam3d-stim-mode': m,
    });
    btn.type = 'button';
    btn.addEventListener('click', () => {
      state.stimMode = m;
      syncAll();
    });
    stimModeBtns.set(m, btn);
    stimControls.appendChild(btn);
  });

  const bclWrap = el(doc, 'label', 'eam3d-stim-field');
  const bclLabel = el(doc, 'span');
  const bclInput = el(doc, 'input', '', null, {
    type: 'number',
    min: '160',
    max: '1000',
    step: '10',
    value: String(state.stimBclMs),
    'data-eam3d-stim-bcl': 'true',
  });
  bclInput.type = 'number';
  bclInput.value = String(state.stimBclMs);
  bclWrap.append(bclLabel, bclInput);

  const s2Wrap = el(doc, 'label', 'eam3d-stim-field');
  const s2Label = el(doc, 'span');
  const s2Input = el(doc, 'input', '', null, {
    type: 'number',
    min: '160',
    max: '600',
    step: '10',
    value: String(state.stimS2Ms),
    'data-eam3d-stim-s2': 'true',
  });
  s2Input.type = 'number';
  s2Input.value = String(state.stimS2Ms);
  s2Wrap.append(s2Label, s2Input);

  const chWrap = el(doc, 'label', 'eam3d-stim-field');
  const chLabel = el(doc, 'span');
  const chSelect = el(doc, 'select', '', null, {
    'data-eam3d-stim-channel': 'true',
  });
  const chOptions = PACING_CHANNELS.map((ch) => {
    const opt = el(doc, 'option', '', ch.label);
    opt.value = ch.id;
    chSelect.appendChild(opt);
    return opt;
  });
  chSelect.value = state.stimChannel;
  chWrap.append(chLabel, chSelect);

  const deliverBtn = el(doc, 'button', 'eam3d-btn eam3d-btn--accent', null, {
    type: 'button',
    'data-eam3d-deliver-stim': 'true',
  });
  deliverBtn.type = 'button';

  stimControls.append(bclWrap, s2Wrap, chWrap, deliverBtn);

  const stimVerdictEl = el(doc, 'div', 'eam3d-stim-verdict', null, {
    'data-eam3d-stim-verdict': 'true',
  });

  stimBar.append(stimControls, stimVerdictEl);

  root.append(leftCol, centerCol, rightCol, stimBar);

  function recomputeSurvey() {
    lastSurveyReport = runCircuitSurvey({
      mapPreset: state.surveyPreset,
      runs: state.surveyRuns,
      levers: state.levers,
      ablatedLines: new Set(state.appliedLesions),
    });
  }

  // --- Event wiring ---
  scenarioSelect.addEventListener('change', () => {
    state.scenarioId = scenarioSelect.value;
    state.inspectedPoint = null;
    state.lastStimResult = null;
    if (state.scenarioId === 'vt-ischemic' || state.scenarioId === 'atrial-scar-flutter') {
      state.surveyPreset = state.scenarioId === 'vt-ischemic' ? 'vt-scar' : 'biatrial-scar';
      surveyPresetSelect.value = state.surveyPreset;
      recomputeSurvey();
    }
    syncAll();
  });

  importMapBtn.addEventListener('click', () => {
    state.activeRail = 'survey';
    state.mapMode = 'voltage';
    state.surveyPreset = 'custom-import';
    surveyPresetSelect.value = 'custom-import';
    state.showCircuitRibbons = true;
    recomputeSurvey();
    syncAll();
    if (sectionEls.survey && typeof sectionEls.survey.scrollIntoView === 'function') {
      sectionEls.survey.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  resetAtriaBtn.addEventListener('click', () => {
    state.levers.raVisible = DEFAULT_LEVERS.raVisible;
    state.levers.laVisible = DEFAULT_LEVERS.laVisible;
    state.levers.highDensityAtria = DEFAULT_LEVERS.highDensityAtria;
    state.levers.atrialCv = DEFAULT_LEVERS.atrialCv;
    state.levers.atrialRestitution = DEFAULT_LEVERS.atrialRestitution;
    state.levers.rateAdaptation = DEFAULT_LEVERS.rateAdaptation;
    state.levers.afRemodelling = DEFAULT_LEVERS.afRemodelling;
    syncAll();
  });

  resetVentBtn.addEventListener('click', () => {
    state.levers.ventriclesVisible = DEFAULT_LEVERS.ventriclesVisible;
    state.levers.wallLayer = DEFAULT_LEVERS.wallLayer;
    state.levers.highDensityVentricles = DEFAULT_LEVERS.highDensityVentricles;
    state.levers.vtStudyMesh = DEFAULT_LEVERS.vtStudyMesh;
    state.levers.ventricularCv = DEFAULT_LEVERS.ventricularCv;
    state.levers.ventricularRestitution = DEFAULT_LEVERS.ventricularRestitution;
    syncAll();
  });

  clearLesionsBtn.addEventListener('click', () => {
    state.appliedLesions = [];
    recomputeSurvey();
    syncAll();
  });

  surveyPresetSelect.addEventListener('change', () => {
    state.surveyPreset = surveyPresetSelect.value;
    recomputeSurvey();
    syncAll();
  });

  surveyRunsSelect.addEventListener('change', () => {
    state.surveyRuns = Number(surveyRunsSelect.value) || 100;
    recomputeSurvey();
    syncAll();
  });

  runSurveyBtn.addEventListener('click', () => {
    state.showCircuitRibbons = true;
    recomputeSurvey();
    syncAll();
  });

  runBtn.addEventListener('click', () => {
    state.running = !state.running;
    syncAll();
  });

  bclInput.addEventListener('change', () => {
    state.stimBclMs = Math.max(160, Math.min(1000, Number(bclInput.value) || 240));
    bclInput.value = String(state.stimBclMs);
  });

  s2Input.addEventListener('change', () => {
    state.stimS2Ms = Math.max(160, Math.min(600, Number(s2Input.value) || 270));
    s2Input.value = String(state.stimS2Ms);
  });

  chSelect.addEventListener('change', () => {
    state.stimChannel = chSelect.value;
  });

  deliverBtn.addEventListener('click', () => {
    const res = runStimManeuver({
      scenarioId: state.scenarioId,
      mode: state.stimMode,
      channelId: state.stimChannel,
      bclMs: Number(bclInput.value) || state.stimBclMs,
      s2Ms: Number(s2Input.value) || state.stimS2Ms,
      levers: state.levers,
      ablatedLines: new Set(state.appliedLesions),
    });
    state.lastStimResult = res;
    if (res.nextScenario && res.nextScenario !== state.scenarioId) {
      state.scenarioId = res.nextScenario;
      scenarioSelect.value = state.scenarioId;
    }
    syncAll();
  });

  fallbackCanvas.addEventListener('click', (ev) => {
    const rect =
      typeof fallbackCanvas.getBoundingClientRect === 'function'
        ? fallbackCanvas.getBoundingClientRect()
        : { left: 0, top: 0, width: 640, height: 460 };
    const nx = rect.width > 0 ? (((ev.clientX || 320) - rect.left) / rect.width) * 2 - 1 : 0;
    const ny = rect.height > 0 ? -((((ev.clientY || 230) - rect.top) / rect.height) * 2 - 1) : 0;
    const pt = [Number((nx * 0.9).toFixed(3)), Number((ny * 0.9).toFixed(3)), 0.22];
    const chamber = ny >= 0 ? (nx < 0 ? 'ra' : 'la') : nx < 0 ? 'rv' : 'lv';
    const sample = evaluateVertex3d(
      pt,
      chamber,
      state.scenarioId,
      state.levers,
      new Set(state.appliedLesions),
    );
    state.inspectedPoint = {
      chamber: chamber.toUpperCase(),
      point: pt,
      ...sample,
    };
    syncInspectReadout();
    drawFallbackViewport();
  });

  function getT() {
    const lang = getLang() === 'en' ? 'en' : 'tr';
    return { lang, t: EAM3D_TEXT[lang] };
  }

  function syncRailUI() {
    const { t } = getT();
    railButtons.forEach(({ btn, label }, id) => {
      toggleClass(btn, 'is-active', state.activeRail === id);
      label.textContent = t.rails[id] || id;
    });
  }

  function renderAblationList() {
    const { lang, t } = getT();
    ablationListEl.replaceChildren();
    const appliedSet = new Set(state.appliedLesions);

    Object.values(EAM3D_ABLATION_LINES).forEach((line) => {
      const isApplied = appliedSet.has(line.id);
      const item = el(doc, 'div', `eam3d-list-item${isApplied ? ' is-applied' : ''}`);
      const row = el(doc, 'div', 'eam3d-list-row');
      const title = el(doc, 'span', 'eam3d-list-title', t.ablationBox.lines[line.id] || line.id);
      const btn = el(
        doc,
        'button',
        `eam3d-btn${isApplied ? ' is-active' : ''}`,
        isApplied ? t.ablationBox.applied : t.ablationBox.apply,
        { type: 'button', 'data-eam3d-ablate-line': line.id },
      );
      btn.type = 'button';
      btn.addEventListener('click', () => {
        const idx = state.appliedLesions.indexOf(line.id);
        if (idx >= 0) {
          state.appliedLesions.splice(idx, 1);
        } else {
          state.appliedLesions.push(line.id);
        }
        recomputeSurvey();
        syncAll();
      });
      row.append(title, btn);
      const meta = el(
        doc,
        'div',
        'eam3d-list-meta',
        `${line.chamber.toUpperCase()} · ${line.lengthMm} mm`,
      );
      item.append(row, meta);
      ablationListEl.appendChild(item);
    });

    const effSpec = scenarioSpec(state.scenarioId, state.levers, appliedSet);
    const terminated = state.scenarioId !== 'sinus' && effSpec.id === 'sinus';
    ablationVerdictEl.textContent = terminated
      ? lang === 'en'
        ? 'Target circuit blocked -> Sinus rhythm restored (CL 833 ms).'
        : 'Hedef reentran devre bloklandı -> Sinüs ritmi sağlandı (CL 833 ms).'
      : t.ablationBox.hint;
  }

  function renderSurveyLists() {
    const { lang, t } = getT();
    circuitsListEl.replaceChildren();
    proposedListEl.replaceChildren();

    lastSurveyReport.circuits.forEach((c) => {
      const selected = state.selectedCircuitIndex === c.number;
      const item = el(doc, 'div', `eam3d-list-item${selected ? ' is-selected' : ''}`, null, {
        'data-eam3d-circuit-row': String(c.number),
      });
      item.style.cursor = 'pointer';
      const row = el(doc, 'div', 'eam3d-list-row');
      const title = el(
        doc,
        'span',
        'eam3d-list-title',
        t.surveyBox.circuitNames[c.id] || `#${c.number}`,
      );
      const badge = el(
        doc,
        'span',
        'eam3d-badge',
        `${c.sustainedCount}/${lastSurveyReport.runs} (${c.frequencyPct}%)`,
      );
      row.append(title, badge);
      const meta = el(
        doc,
        'div',
        'eam3d-list-meta',
        `${c.interrupted ? (lang === 'en' ? 'Blocked' : 'Bloklu') : lang === 'en' ? 'Conducting' : 'İletimde'} · CL ${c.tclMs} ms · Isthmus ${c.isthmusMm} mm`,
      );
      item.append(row, meta);
      item.addEventListener('click', () => {
        state.selectedCircuitIndex = state.selectedCircuitIndex === c.number ? null : c.number;
        syncAll();
      });
      circuitsListEl.appendChild(item);
    });

    lastSurveyReport.proposedLines.forEach((p) => {
      const item = el(doc, 'div', `eam3d-list-item${p.applied ? ' is-applied' : ''}`);
      const row = el(doc, 'div', 'eam3d-list-row');
      const title = el(doc, 'span', 'eam3d-list-title', t.ablationBox.lines[p.id] || p.id);
      const btn = el(
        doc,
        'button',
        `eam3d-btn${p.applied ? ' is-active' : ' eam3d-btn--accent'}`,
        p.applied ? t.ablationBox.applied : t.surveyBox.applyLine,
        { type: 'button', 'data-eam3d-apply-line': p.id },
      );
      btn.type = 'button';
      btn.addEventListener('click', () => {
        if (!state.appliedLesions.includes(p.id)) {
          state.appliedLesions.push(p.id);
        }
        recomputeSurvey();
        syncAll();
      });
      row.append(title, btn);
      const meta = el(
        doc,
        'div',
        'eam3d-list-meta',
        `${p.lengthMm} mm · ${p.interruptedSharePct}% (${p.circuitsBlocked.map((n) => `#${n}`).join(', ') || '-'})`,
      );
      item.append(row, meta);
      proposedListEl.appendChild(item);
    });
  }

  function syncInspectReadout() {
    const { t } = getT();
    if (!state.inspectedPoint) {
      inspectReadout.textContent = t.viewport.pointReadout;
      return;
    }
    const p = state.inspectedPoint;
    const tagStr = p.tag ? ` · [${p.tag.toUpperCase()}]` : '';
    inspectReadout.textContent = `${p.chamber} · LAT ${p.lat} ms · Bipolar ${p.bipolar} mV · Unipolar ${p.unipolar} mV${tagStr}`;
  }

  function syncAll() {
    const { lang, t } = getT();
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
    const bpm = Math.round(60000 / Math.max(120, effSpec.tcl));
    scenarioSummary.textContent = `${t.scenarios[effSpec.id] || effSpec.id} · CL ${effSpec.tcl} ms (${bpm} ${t.polygraph.bpm})`;

    atriaTitle.textContent = t.atriaBox.title;
    resetAtriaBtn.textContent = t.atriaBox.reset;
    ventTitle.textContent = t.ventriclesBox.title;
    resetVentBtn.textContent = t.ventriclesBox.reset;
    condTitle.textContent = t.hisBox.title;

    const checkLabels = {
      raVisible: t.atriaBox.ra,
      laVisible: t.atriaBox.la,
      highDensityAtria: t.atriaBox.hd,
      ventriclesVisible: t.ventriclesBox.visible,
      highDensityVentricles: t.ventriclesBox.hd,
      vtStudyMesh: t.ventriclesBox.vtMesh,
      showConduction: t.hisBox.show,
      conductionParticipates: t.hisBox.participates,
      showCircuitRibbons: t.surveyBox.showRibbons,
    };

    checkControls.forEach(({ input, textSpan, isStateTopLevel }, key) => {
      input.checked = Boolean(isStateTopLevel ? state[key] : state.levers[key]);
      if (checkLabels[key]) textSpan.textContent = checkLabels[key];
    });

    const sliderLabels = {
      atrialCv: t.atriaBox.cv,
      atrialRestitution: t.atriaBox.restitution,
      rateAdaptation: t.atriaBox.rateAdaptation,
      afRemodelling: t.atriaBox.afRemodelling,
      ventricularCv: t.ventriclesBox.cv,
      ventricularRestitution: t.ventriclesBox.restitution,
      myocardiumOpacity: t.viewport.myoOpacity,
      conductionOpacity: t.viewport.condOpacity,
    };

    sliderControls.forEach(({ input, labelSpan, valSpan }, key) => {
      const val = state.levers[key];
      input.value = String(val);
      if (sliderLabels[key]) labelSpan.textContent = sliderLabels[key];
      if (valSpan) {
        valSpan.textContent =
          key === 'atrialCv' || key === 'ventricularCv'
            ? `${Number(val).toFixed(2)}`
            : `${Math.round(Number(val) * 100)}%`;
      }
    });

    wallBtns.forEach((btn, layer) => {
      btn.textContent = t.ventriclesBox.walls[layer] || layer;
      toggleClass(btn, 'is-active', state.levers.wallLayer === layer);
    });

    ablateTitle.textContent = t.ablationBox.title;
    clearLesionsBtn.textContent = t.ablationBox.clear;
    renderAblationList();

    surveyTitle.textContent = t.surveyBox.title;
    surveySub.textContent = t.surveyBox.intro;
    surveyPresetLabel.textContent = t.surveyBox.preset;
    surveyPresetOptions.forEach((opt) => {
      opt.textContent = t.surveyBox.presets[opt.value] || opt.value;
    });
    surveyPresetSelect.value = state.surveyPreset;
    surveyRunsLabel.textContent = t.surveyBox.runs;
    runSurveyBtn.textContent = t.surveyBox.runBtn;
    circuitsHeader.textContent = t.surveyBox.circuitsTitle;
    proposedHeader.textContent = t.surveyBox.linesTitle;
    renderSurveyLists();

    // Center viewport labels
    carmBtns.forEach((btn, id) => {
      btn.textContent = t.views[id] || id;
      toggleClass(btn, 'is-active', state.carmPreset === id);
    });

    statusPill.textContent = `${state.running ? t.status.running : t.status.frozen} · CL ${effSpec.tcl} ms (${bpm} ${t.polygraph.bpm})`;

    const legendKey =
      state.mapMode === 'lat'
        ? 'legendLat'
        : state.mapMode === 'voltage'
          ? 'legendVoltage'
          : state.mapMode === 'phase'
            ? 'legendPhase'
            : 'legendLive';
    scaleLabel.textContent = t.viewport[legendKey];
    syncInspectReadout();

    // Right polygraph header
    polyTitle.textContent = t.polygraph.record;
    polyCl.textContent = `${t.polygraph.cl} ${effSpec.tcl} ms · ${bpm} ${t.polygraph.bpm}`;
    sweepBtns.forEach((btn, spd) => {
      toggleClass(btn, 'is-active', state.sweepSpeed === spd);
    });

    // Bottom stimulator bar
    runBtn.textContent = state.running ? t.stim.stop : t.stim.start;
    toggleClass(runBtn, 'is-running', state.running);
    stimModeBtns.forEach((btn, m) => {
      btn.textContent = t.stim.modes[m] || m.toUpperCase();
      toggleClass(btn, 'is-active', state.stimMode === m);
    });
    bclLabel.textContent = t.stim.bcl;
    s2Label.textContent = t.stim.s2;
    chLabel.textContent = t.stim.channel;
    deliverBtn.textContent = lang === 'en' ? 'Deliver Stim' : 'Stim Uygula';

    if (state.lastStimResult && state.lastStimResult.summaryCode) {
      const fn = t.stim.verdicts[state.lastStimResult.summaryCode];
      stimVerdictEl.textContent =
        typeof fn === 'function'
          ? fn(state.lastStimResult.ppi, state.lastStimResult.ppiMinusTcl)
          : String(state.lastStimResult.summaryCode);
    } else {
      stimVerdictEl.textContent = `${t.mapModes[state.mapMode]} · ${t.stim.output}`;
    }

    if (atlasInstance && atlasInstance.ok) {
      atlasInstance.setState({
        scenario: state.scenarioId,
        mapMode: state.mapMode,
        view: state.carmPreset,
        timeMs: state.simTimeMs,
        levers: state.levers,
        ablatedLines: state.appliedLesions,
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
    const ctx = typeof polyCanvas.getContext === 'function' ? polyCanvas.getContext('2d') : null;
    if (!ctx) return;

    const rect =
      typeof polyCanvasWrap.getBoundingClientRect === 'function'
        ? polyCanvasWrap.getBoundingClientRect()
        : { width: 350, height: 520 };
    const dpr = (doc.defaultView && doc.defaultView.devicePixelRatio) || 1;
    const cssW = Math.max(280, Math.round(rect.width || 350));
    const cssH = Math.max(420, Math.round(rect.height || 520));
    if (
      polyCanvas.width !== Math.round(cssW * dpr) ||
      polyCanvas.height !== Math.round(cssH * dpr)
    ) {
      polyCanvas.width = Math.round(cssW * dpr);
      polyCanvas.height = Math.round(cssH * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.strokeStyle = 'rgba(30, 41, 59, 0.65)';
    ctx.lineWidth = 1;
    const labelColW = 68;
    const plotW = cssW - labelColW - 6;
    for (let x = labelColW; x < cssW; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cssH);
      ctx.stroke();
    }

    const nCh = EAM3D_CHANNELS.length;
    const rowH = cssH / nCh;
    const windowMs = (100 / Math.max(25, state.sweepSpeed)) * 1200;
    const samplesCount = 88;
    const tEnd = state.simTimeMs;
    const tStart = tEnd - windowMs;
    const ablatedSet = new Set(state.appliedLesions);

    const timeSeries = [];
    for (let s = 0; s < samplesCount; s++) {
      const tMs = tStart + (s / (samplesCount - 1)) * windowMs;
      timeSeries.push(
        sampleChannelsAt(tMs, state.scenarioId, state.levers, ablatedSet, null).values,
      );
    }

    ctx.font = '600 9.5px Inter, -apple-system, sans-serif';
    ctx.textBaseline = 'middle';

    EAM3D_CHANNELS.forEach((ch, idx) => {
      const midY = (idx + 0.5) * rowH;

      ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
      ctx.beginPath();
      ctx.moveTo(labelColW, midY);
      ctx.lineTo(cssW - 4, midY);
      ctx.stroke();

      ctx.fillStyle = ch.color;
      ctx.fillText(ch.label, 5, midY);

      ctx.strokeStyle = ch.color;
      ctx.lineWidth = ch.kind === 'surface' ? 1.5 : 1.15;
      ctx.beginPath();
      for (let s = 0; s < samplesCount; s++) {
        const px = labelColW + (s / (samplesCount - 1)) * plotW;
        const val = timeSeries[s][ch.id] || 0;
        const py = midY - val * (rowH * 0.44);
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawFallbackViewport() {
    const atlasReady = Boolean(
      atlasInstance && atlasInstance.ok && state.atlasStatus === 'ready',
    );
    toggleClass(stageEl, 'is-fallback', !atlasReady);
    if (atlasReady) return;

    const ctx =
      typeof fallbackCanvas.getContext === 'function' ? fallbackCanvas.getContext('2d') : null;
    if (!ctx) return;

    const w = fallbackCanvas.width;
    const h = fallbackCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const scale = Math.min(w, h) * 0.34;
    const ablatedSet = new Set(state.appliedLesions);

    const chambers = [
      { id: 'ra', label: 'RA', vis: state.levers.raVisible, x: -0.46, y: 0.36, rx: 0.34, ry: 0.32 },
      { id: 'la', label: 'LA', vis: state.levers.laVisible, x: 0.44, y: 0.42, rx: 0.34, ry: 0.3 },
      { id: 'rv', label: 'RV', vis: state.levers.ventriclesVisible, x: -0.32, y: -0.34, rx: 0.36, ry: 0.48 },
      { id: 'lv', label: 'LV', vis: state.levers.ventriclesVisible, x: 0.36, y: -0.36, rx: 0.38, ry: 0.5 },
    ];

    chambers.forEach((ch) => {
      if (!ch.vis) return;
      const sample = evaluateVertex3d(
        [ch.x, ch.y, 0.2],
        ch.id,
        state.scenarioId,
        state.levers,
        ablatedSet,
      );
      const hue = Math.round((1 - (sample.lat % sample.tcl) / sample.tcl) * 260);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        cx + ch.x * scale,
        cy - ch.y * scale,
        ch.rx * scale,
        ch.ry * scale,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = `hsla(${hue}, 80%, 45%, ${(state.levers.myocardiumOpacity / 100) * 0.55})`;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = `hsla(${hue}, 85%, 60%, 0.9)`;
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 12px Inter, sans-serif';
      ctx.fillText(ch.label, cx + ch.x * scale - 10, cy - ch.y * scale);
      ctx.restore();
    });

    Object.values(EAM3D_CATHETERS).forEach((cat) => {
      const pts = cat.electrodes || [];
      if (!pts.length) return;
      ctx.save();
      ctx.strokeStyle = cat.color;
      ctx.fillStyle = cat.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      pts.forEach((p, idx) => {
        const px = cx + p[0] * scale;
        const py = cy - p[1] * scale;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      pts.forEach((p) => {
        ctx.beginPath();
        ctx.arc(cx + p[0] * scale, cy - p[1] * scale, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    });

    state.appliedLesions.forEach((lineId) => {
      const line = EAM3D_ABLATION_LINES[lineId];
      if (!line) return;
      ctx.save();
      ctx.fillStyle = '#ef4444';
      line.points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(cx + p[0] * scale, cy - p[1] * scale, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
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
        syncInspectReadout();
      },
      onCircuitSelect(circuitNumber) {
        state.selectedCircuitIndex =
          state.selectedCircuitIndex === circuitNumber ? null : circuitNumber;
        syncAll();
      },
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

    if (atlasInstance && atlasInstance.ok && state.atlasStatus === 'ready') {
      toggleClass(stageEl, 'is-fallback', false);
      atlasInstance.setState({ timeMs: state.simTimeMs });
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
      }
      if (mapMode && EAM3D_MAP_MODES.includes(mapMode)) {
        state.mapMode = mapMode;
      }
      if (rail && ['case', 'map', 'ablate', 'survey'].includes(rail)) {
        state.activeRail = rail;
      }
      if (surveyPreset && ['biatrial-scar', 'vt-scar', 'custom-import'].includes(surveyPreset)) {
        state.surveyPreset = surveyPreset;
        state.showCircuitRibbons = true;
        recomputeSurvey();
      }
      if (active) ensureAtlasMounted();
      syncAll();
    },
    getState() {
      return state;
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

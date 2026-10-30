import { CASES, simulate, thresholdSweep, programmedSweep, paramsOf } from './csp-model.mjs';
import { initialProcedure, modelOf, act, timingReadable, stageOf, criteria, confirmation, acceptCheck, guidance, startThreshold, thresholdBeat, testFromRows, summary, fromModel, thicknessOf, rapidAllowed, HEARTS, LEAD_TYPES } from './csp-procedure.mjs';
import { createRecorder, advance, beatFromResult, drawSweep, LAYOUTS, SPEEDS } from './csp-live.mjs';
import { drawFluoro, levelAt, loadAtlasImages, createFluoroState, tickFluoro, isLive, moved, puff, contrastOf } from './csp-fluoro.mjs';
import { createFinishPanel } from './csp-finish-panel.mjs';
import { createCtFluoro, ctGeometry, clampCarm, carmLabel, CARM_PRESETS, CARM_RANGE } from './csp-ct-xray.mjs';
import { createSpin, advanceSpin, displayDepth, phaseOf, pacingPaused } from './csp-spin.mjs';
import { trendPoint, pushTrend, drawTrends } from './csp-trends.mjs';
import { coaching } from './csp-coaching.mjs';
import { TEXT } from './csp-text.mjs';
import { CONSOLE_TEXT } from './csp-console-text.mjs';

/*
 * CSP / LBBAP laboratory. Implant: an original console where the operator chooses the site
 * (RAO), brings the sheath perpendicular to the septum (LAO) and screws the lead in turn by
 * turn, with a live 12-lead + tip EGM recording, the capture criteria read from that
 * recording, guidance and an event log. Analysis, blind assessment and the case log keep the
 * single-beat review (threshold and S1-S2 rows, calipers, reference beat).
 */
const LEADS = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
const TYPE_IDS = ['insufficient', 'selective', 'nonselective', 'lvsp', 'deep', 'rv', 'anodal', 'none', 'perforation', 'off'];
const VALUE = (x, digits = 1) => (Number.isFinite(x) ? x.toFixed(digits) : '∅');
const HISTORY_KEY = 'cardia.csp.prototype.history.v1';
const FIXATION_CHANCE = .55;
const LOG_SIZE = 40;
const fill = (template, params) => template.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? ''));
const MOVES = Object.freeze(['site', 'torque', 'rotate', 'unscrew', 'reposition']);   // actions that auto-fluoro screens
const COMPLICATIONS = Object.freeze(['perforation', 'rbbBump']);
const now = () => globalThis.performance?.now?.() ?? Date.now();
const CARM_TEXT = Object.freeze({
  tr: { carm: 'C-kolu', ct: 'Gerçek BT skopisi', loading: 'BT yükleniyor', failed: 'BT skopisi açılamadı, atlas görüntüsü',
    hintRao: 'Ucu sürükle: septal seviye · Shift + sürükle: C-kolunu döndür', hintLao: 'Yatay sürükle: kılıf torku (sola saat yönü tersi) · Shift + sürükle: C-kolu',
    hintLocked: 'Lead vidalı: konum ve kılıf kilitli · Shift + sürükle: C-kolu',
    leads: { lumenless: ['Kılıfla yönlendirilir, sabit heliks', 'Vidalarken pacing durur'], stylet: ['Stiletle yönlendirilir, uzatılabilir heliks', 'Sürekli pace eder; ileri destek ister'] } },
  en: { carm: 'C-arm', ct: 'Real CT fluoroscopy', loading: 'Loading CT', failed: 'CT fluoroscopy unavailable, atlas image',
    hintRao: 'Drag the tip: septal level · Shift + drag: rotate the C-arm', hintLao: 'Drag sideways: sheath torque (left counter-clockwise) · Shift + drag: C-arm',
    hintLocked: 'Lead screwed in: site and sheath locked · Shift + drag: C-arm',
    leads: { lumenless: ['Sheath-delivered, fixed helix', 'Pacing pauses while turning'], stylet: ['Stylet-driven, extendable helix', 'Paces throughout; needs forward support'] } }
});
const TORQUE_PX = 12;         // LAO drag: one 5 degree torque step per this many pixels
const CARM_PX = 3;            // shift-drag: one C-arm degree per this many pixels
// Lead pictograms: a thin lead with a fixed helix, a thicker lead with a stylet inside.
const LEAD_ICON = Object.freeze({
  lumenless: '<svg viewBox="0 0 60 16" aria-hidden="true"><path d="M2 8H44" stroke="currentColor" stroke-width="2.2" fill="none"/><path d="M44 8c2-5 3 5 5 0s3 5 5 0 3 5 4 0" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>',
  stylet: '<svg viewBox="0 0 60 16" aria-hidden="true"><path d="M2 8H44" stroke="currentColor" stroke-width="4" fill="none"/><path d="M2 8H42" stroke="#0e1116" stroke-width="1" stroke-dasharray="3 2" fill="none"/><path d="M44 8c2-5 3 5 5 0s3 5 5 0 3 5 4 0" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>'
});
const FOCUS_GAIN = .3;
const LABEL_PX = 46;          // lead-name column of the live recording (drawSweep left margin)
const UI_BACK = Object.freeze({ tr: 'Tüm derivasyonlara dönmek için tıkla', en: 'Click to return to all leads' });
const CARM_STEP = 5;          // keyboard step; the slider moves by 1 degree

export function createCspPanel(doc, { getLang = () => 'tr', storage = null } = {}) {
  let proc = initialProcedure('baseline');
  let s2 = null;                       // S1-S2 row under review (analysis)
  let state = { ...modelOf(proc), s2 }, result = simulate(state), rows = [], reference = null;
  let test = null, lastTest = null;    // live threshold test
  let recorder = createRecorder(50), pendingEscape = false, shownBeats = -1;
  let log = [], trend = [];                 // event log; per-turn trend points
  let fx = createFluoroState(), sites = 1, complications = 0, caseSeed = 1;
  const atlas = doc.createElement ? loadAtlasImages(doc, () => { fx.dirty = true; drawFluoroCanvas(); }) : { images: {}, ready: () => false };
  // Live fluoroscopy of the real chest CT (WebGL2); loaded the first time the console opens.
  const ct = doc.createElement && globalThis.WebGL2RenderingContext ? createCtFluoro(doc, { onReady: () => { fx.dirty = true; render(); } }) : null;
  const ctReady = () => ct?.status === 'ready';
  let spin = null, spinQueue = [];          // helix turn in progress; turns asked for meanwhile
  const ui = { active: false, page: 'implant', projection: 'rao', carm: CARM_PRESETS.rao, instructor: true, blind: false, frozen: false, layout: 'all', ecgGain: 1, egmGain: 1, guides: true, target: false,
    focusLead: null, playing: false, cursor: 50, caliper: false, marks: [], zoom: 1, scale: 4, selected: -1, testKind: null, answer: null, revealed: false };
  let liveFrame = null, liveLast = null, reviewFrame = null, reviewLast = null, plotted = null, history = [], storageStatus = '', dragging = false;
  const lang = () => (getLang() === 'en' ? 'en' : 'tr');
  const t = () => TEXT[lang()];
  const c = () => CONSOLE_TEXT[lang()];
  try { storage ||= doc.defaultView?.localStorage; } catch { storage = null; }
  try {
    const parsed = JSON.parse(storage?.getItem(HISTORY_KEY) || '[]');
    history = Array.isArray(parsed) ? parsed.filter(x => x && typeof x.date === 'string' && CASES.some(k => k.id === x.caseId) && TYPE_IDS.includes(x.capture)).slice(-50) : [];
  } catch { history = []; }

  // Beats of the live recording are cached by their options (a fixed position repeats the same beat).
  const cache = new Map();
  const sim = options => {
    const key = JSON.stringify(options);
    if (!cache.has(key)) { if (cache.size > 96) cache.clear(); cache.set(key, simulate(options)); }
    return cache.get(key);
  };

  const el = (tag, cls = '', attrs = {}) => {
    const n = doc.createElement(tag); n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    return n;
  };
  const bindings = [];
  const txt = (n, get) => { bindings.push([n, get]); return n; };
  const button = (get, fn, attr = {}) => { const n = txt(el('button', '', { type: 'button', ...attr }), get); n.addEventListener('click', fn); return n; };
  const group = (title, ...children) => { const g = el('div', 'csp-group'); g.append(txt(el('span', 'csp-group-title'), title), ...children); return g; };

  // ---- Heading, pages ----
  const root = el('section', 'csp-lab', { 'data-csp': '' }); root.hidden = true;
  const heading = el('header', 'csp-heading');
  const words = el('div'); words.append(txt(el('h2'), () => t().title), txt(el('p'), () => c().intro));
  const nav = el('nav', 'csp-actions');
  const pages = ['implant', 'analysis', 'quiz', 'history'];
  const pageButtons = pages.map(page => {
    const b = button(() => t()[page], () => {
      ui.page = page;
      if (page === 'quiz') { ui.blind = true; ui.instructor = false; setProjection('rao'); ui.revealed = false; ui.answer = null; }
      render();
    }, { 'data-csp-page': page });
    nav.append(b); return b;
  });
  heading.append(words, nav);
  const limits = txt(el('p', 'csp-note'), () => t().limit);

  // ---- Implant console ----
  const implant = el('section', 'csp-implant', { 'data-csp-implant': '' });
  const phases = el('ol', 'csp-phases');
  const phaseNodes = Array.from({ length: 5 }, (_, i) => { const n = txt(el('li'), () => `${i + 1}. ${c().stages[i]}`); phases.append(n); return n; });
  const guide = el('p', 'csp-guide', { 'data-csp-guide': '', 'aria-live': 'polite' });
  const caseRow = el('div', 'csp-case-row');
  const caseField = el('label', 'csp-case');
  const caseSelect = el('select', '', { 'data-csp-control': 'caseId' });
  const caseGroups = Object.fromEntries(['case', 'trap'].map(g => [g, el('optgroup')]));
  for (const k of CASES) caseGroups[k.group].append(txt(el('option', '', { value: k.id }), () => k.name[lang()]));
  caseSelect.append(...Object.values(caseGroups));
  caseField.append(txt(el('span'), () => t().case), caseSelect);
  caseSelect.addEventListener('change', () => loadCase(caseSelect.value));
  const reseed = button(() => c().newPatient, () => loadCase('random', false, Date.now()), { 'data-csp-reseed': '' });
  const patient = el('p', 'csp-patient');
  const teacherBtn = button(() => t().instructor, () => { ui.instructor = !ui.instructor; if (ui.instructor) ui.blind = false; render(); }, { 'data-csp-instructor': '' });
  const blindBtn = button(() => t().blind, () => { ui.blind = !ui.blind; if (ui.blind) { ui.instructor = false; setProjection('rao'); } ui.answer = null; ui.revealed = false; render(); }, { 'data-csp-blind': '' });
  const resetBtn = button(() => t().reset, () => loadCase(proc.caseId, true), { 'data-csp-reset': '' });
  caseRow.append(caseField, reseed, patient, el('span', 'csp-spacer'), teacherBtn, blindBtn, resetBtn);

  const work = el('div', 'csp-work');
  // Fluoroscopy card.
  const fluoroCard = el('section', 'csp-card csp-fluoro');
  const views = el('div', 'csp-tabs');
  const viewButtons = ['rao', 'lao', 'septum'].map(id => { const b = button(() => c().views[id], () => { setProjection(id); render(); }, { 'data-csp-projection': id }); views.append(b); return b; });
  // C-arm angle (real CT fluoroscopy only): RAO 45 .. LAO 60.
  const carmField = el('label', 'csp-carm', { 'data-csp-carm': '' });
  const carmInput = el('input', '', { type: 'range', min: CARM_RANGE[0], max: CARM_RANGE[1], step: 1, 'data-csp-carm-input': '' });
  const carmValue = el('output', 'csp-carm-value');
  carmInput.addEventListener('input', () => { setCarm(Number(carmInput.value)); render(); });
  carmField.append(txt(el('span'), () => CARM_TEXT[lang()].carm), carmInput, carmValue);
  const ctNote = el('span', 'csp-ct-note', { 'data-csp-ct-note': '' });
  const fluoroHint = el('span', 'csp-fluoro-hint', { 'data-csp-fluoro-hint': '' });
  const fluoro = el('canvas', 'csp-fluoro-canvas', { role: 'img', 'data-csp-anatomy': '' });
  const fluoroOpts = el('div', 'csp-actions csp-small');
  const guidesBox = el('label', 'csp-check'); const guidesInput = el('input', '', { type: 'checkbox' });
  guidesInput.addEventListener('change', () => { ui.guides = guidesInput.checked; drawFluoroCanvas(); });
  guidesBox.append(guidesInput, txt(el('span'), () => c().guides));
  const targetBox = el('label', 'csp-check'); const targetInput = el('input', '', { type: 'checkbox' });
  targetInput.addEventListener('change', () => { ui.target = targetInput.checked; drawFluoroCanvas(); });
  targetBox.append(targetInput, txt(el('span'), () => c().target));
  fluoroOpts.append(guidesBox, targetBox);
  const fluoroBar = el('div', 'csp-actions csp-small');
  const fluoroBtn = button(() => c().fluoroBtn, () => {}, { 'data-csp-fluoro': '' });
  const holdOn = event => { event.preventDefault?.(); fx.on = true; fx.dirty = true; ensureLoop(); };
  const holdOff = () => { if (fx.on) { fx.on = false; fx.dirty = true; } };
  fluoroBtn.addEventListener('pointerdown', holdOn);
  for (const type of ['pointerup', 'pointerleave', 'pointercancel']) fluoroBtn.addEventListener(type, holdOff);
  const contrastBtn = button(() => c().contrast, () => { puff(fx, now()); addLog('contrast'); renderConsole(); ensureLoop(); }, { 'data-csp-contrast': '' });
  const autoBox = el('label', 'csp-check'); const autoInput = el('input', '', { type: 'checkbox', 'data-csp-auto-fluoro': '' });
  autoInput.addEventListener('change', () => { fx.auto = autoInput.checked; });
  autoBox.append(autoInput, txt(el('span'), () => c().autoFluoro));
  const heartField = el('label'); const heartSelect = el('select', '', { 'data-csp-control': 'heart' });
  for (const id of Object.keys(HEARTS)) heartSelect.append(txt(el('option', '', { value: id }), () => c().hearts[id]));
  heartSelect.addEventListener('change', () => setSetting({ heart: heartSelect.value }));
  heartField.append(txt(el('span'), () => c().heart), heartSelect);
  fluoroBar.append(fluoroBtn, contrastBtn, autoBox, heartField);
  const groundTruth = el('p', 'csp-truth', { 'data-csp-truth': '' });
  fluoroCard.append(views, carmField, fluoro, fluoroHint, fluoroBar, fluoroOpts, ctNote, groundTruth);
  // Pointer on the fluoroscopy: RAO side drags the tip along the septum, LAO side drags sideways to
  // torque the sheath, shift-drag rotates the C-arm (real CT fluoroscopy).
  let drag = null;
  fluoro.addEventListener('pointerdown', event => {
    const mode = event.shiftKey && ctReady() && ui.projection !== 'septum' ? 'carm' : siteDraggable() ? 'site' : torqueDraggable() ? 'torque' : null;
    if (!mode) return;
    drag = { mode, x: event.clientX, carm: ui.carm, torque: 0 }; dragging = mode === 'site';
    fluoro.setPointerCapture?.(event.pointerId);
    if (mode === 'site') moveSite(event);
  });
  fluoro.addEventListener('pointermove', event => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    if (drag.mode === 'site') moveSite(event);
    else if (drag.mode === 'carm') { setCarm(drag.carm + dx / CARM_PX); render(); }
    else {
      const steps = Math.trunc(dx / TORQUE_PX) - drag.torque;
      if (steps) { drag.torque += steps; doAct({ type: 'torque', delta: -5 * steps }); }
    }
  });
  const endDrag = () => { drag = null; dragging = false; };
  fluoro.addEventListener('pointerup', endDrag);
  fluoro.addEventListener('pointercancel', endDrag);

  // Live recording card.
  const liveCard = el('section', 'csp-card csp-live');
  const liveBar = el('div', 'csp-actions csp-small');
  const play = button(() => (ui.frozen ? c().run : c().freeze), () => { ui.frozen = !ui.frozen; render(); }, { 'data-csp-play': '' });
  const speed = el('select', '', { 'data-csp-speed': '' });
  for (const v of Object.keys(SPEEDS)) { const o = el('option', '', { value: v }); o.textContent = `${v} mm/s`; speed.append(o); }
  speed.addEventListener('change', () => { recorder = createRecorder(Number(speed.value)); render(); });
  const layout = el('select', '', { 'data-csp-layout': '' });
  const layoutOptions = Object.keys(LAYOUTS).map(v => { const o = txt(el('option', '', { value: v }), () => c().layouts[v]); layout.append(o); return o; });
  layout.addEventListener('change', () => { ui.layout = layout.value; ui.focusLead = null; drawLive(); });
  const gainSelect = (key, label) => {
    const field = el('label'); const s = el('select', '', { [`data-csp-${key}`]: '' });
    for (const v of [.5, 1, 2]) { const o = el('option', '', { value: v }); o.textContent = String(v); s.append(o); }
    s.value = '1'; s.addEventListener('change', () => { ui[key] = Number(s.value); drawLive(); });
    field.append(txt(el('span'), label), s); return field;
  };
  liveBar.append(txt(el('h3'), () => c().live), play, speed, layout, gainSelect('ecgGain', () => c().ecgGain), gainSelect('egmGain', () => c().egmGain));
  const live = el('canvas', 'csp-live-canvas', { role: 'img', 'data-csp-live': '' });
  const liveWrap = el('div', 'csp-live-wrap'); liveWrap.append(live);
  // Clicking a lead name (or double-clicking its row) shows that lead alone, large; again to go back.
  live.addEventListener('click', event => { if (ui.focusLead || event.clientX - live.getBoundingClientRect().left < LABEL_PX) toggleFocus(liveRowAt(event.clientY)); });
  live.addEventListener('dblclick', event => { if (!ui.focusLead) toggleFocus(liveRowAt(event.clientY)); });   // the canvas bitmap size must not feed back into the layout
  liveCard.append(liveBar, liveWrap);

  // Analyser card: readouts, criteria, event log.
  const analyser = el('section', 'csp-card csp-analyser');
  const readouts = el('dl', 'csp-readouts', { 'data-csp-readouts': '' });
  const trends = el('canvas', 'csp-trends-canvas', { role: 'img', 'data-csp-trends': '' });
  const coach = el('ul', 'csp-coach', { 'data-csp-coach': '', 'aria-live': 'polite' });
  const criteriaBox = el('div', 'csp-criteria', { 'data-csp-criteria': '' });
  const logList = el('ol', 'csp-log', { 'data-csp-log': '' });
  analyser.append(txt(el('h3'), () => c().analyser), readouts, txt(el('h3'), () => c().trendsTitle), trends, txt(el('h3'), () => c().coachTitle), coach,
    txt(el('h3'), () => c().criteriaTitle), criteriaBox, txt(el('h3'), () => c().log), logList);
  work.append(fluoroCard, liveCard, analyser);

  // Control bar.
  const bar = el('div', 'csp-controlbar');
  const rotate1 = button(() => c().controls.rotate, () => requestTurns(1), { 'data-csp-rotate': 1 });
  const rotate3 = button(() => c().controls.rapid, () => requestTurns(3), { 'data-csp-rotate': 3 });
  const unscrew = button(() => c().controls.unscrew, () => doAct({ type: 'unscrew' }), { 'data-csp-unscrew': '' });
  const reposition = button(() => c().controls.reposition, () => doAct({ type: 'reposition' }), { 'data-csp-reposition': '' });
  // Lead type: two cards (pictogram, name, delivery and behaviour in the console); locked once screwed in.
  const leadField = el('div', 'csp-leads', { role: 'radiogroup', 'data-csp-leads': '' });
  const leadCards = LEAD_TYPES.map(id => {
    const card = el('button', 'csp-lead-card', { type: 'button', role: 'radio', 'data-csp-lead': id });
    const icon = el('span', 'csp-lead-icon'); icon.innerHTML = LEAD_ICON[id];
    const words = el('span', 'csp-lead-words');
    words.append(txt(el('b'), () => c().controls.leads[id]), txt(el('small'), () => CARM_TEXT[lang()].leads[id][0]), txt(el('small'), () => CARM_TEXT[lang()].leads[id][1]));
    card.append(icon, words);
    card.addEventListener('click', () => { if (proc.lead !== id) setSetting({ lead: id }); });
    leadField.append(card); return card;
  });
  const supportBox = el('label', 'csp-check'); const supportInput = el('input', '', { type: 'checkbox', 'data-csp-support': '' });
  supportInput.addEventListener('change', () => setSetting({ forwardSupport: supportInput.checked }));
  supportBox.append(supportInput, txt(el('span'), () => c().controls.support));
  const ccw = button(() => c().controls.ccw, () => doAct({ type: 'torque', delta: 5 }), { 'data-csp-torque': 'ccw' });
  const cw = button(() => c().controls.cw, () => doAct({ type: 'torque', delta: -5 }), { 'data-csp-torque': 'cw' });
  const sheathOut = el('output', 'csp-angle', { 'data-csp-sheath': '' });
  const pace = button(() => (proc.pacing ? t().on : t().off), () => doAct({ type: 'pacing', on: !proc.pacing }), { 'data-csp-pacing': '' });
  const controlNodes = {};
  const range = (key, min, max, step, onInput) => {
    const label = el('label', 'csp-range'); const input = el('input', '', { type: 'range', min, max, step, 'data-csp-control': key }); const output = el('output');
    input.addEventListener('input', () => onInput(Number(input.value)));
    label.append(txt(el('span'), () => c().teacherLabels[key] || t().labels[key]), input, output);
    controlNodes[key] = { label, input, output }; return label;
  };
  const outputMinus = button(() => '−', () => setOutput(proc.output - .25), { 'aria-label': 'output −' });
  const outputPlus = button(() => '+', () => setOutput(proc.output + .25), { 'aria-label': 'output +' });
  const outputRange = range('output', 0, 8, .05, v => setOutput(v));
  const widthRange = range('pulseWidth', .2, 1, .1, v => setSetting({ pulseWidth: v }));
  const rateRange = range('rate', 60, 140, 5, v => setSetting({ rate: v }));
  const polarity = el('select', '', { 'data-csp-control': 'polarity' });
  for (const v of ['uni', 'bi']) polarity.append(txt(el('option', '', { value: v }), () => t()[v]));
  polarity.addEventListener('change', () => setSetting({ polarity: polarity.value }));
  const thresholdBtn = button(() => t().threshold, startLiveThreshold, { 'data-csp-test': 'threshold' });
  const s2Btn = button(() => t().programmed, () => runTest('s2'), { 'data-csp-test': 's2' });
  const accept = button(() => c().controls.accept, () => doAct({ type: 'accept', reasons: acceptCheck(proc, criteria(result, proc, lastTest), lastTest) }), { 'data-csp-accept': '' });
  bar.append(
    group(() => c().controls.lead, leadField, rotate1, rotate3, unscrew, reposition, supportBox),
    group(() => c().controls.sheath, ccw, sheathOut, cw),
    group(() => c().controls.pacing, pace, outputMinus, outputRange, outputPlus, widthRange, rateRange, polarity),
    group(() => c().controls.tests, thresholdBtn, s2Btn, accept)
  );
  const keys = txt(el('p', 'csp-note'), () => c().controls.keys);
  const warning = el('p', 'csp-warning', { 'data-csp-warning': '' });

  // Instructor shortcuts: the model values directly.
  const teacher = el('details', 'csp-teacher', { 'data-csp-teacher': '' });
  const teacherSummary = txt(el('summary'), () => c().teacher);
  const teacherGrid = el('div', 'csp-controls');
  teacherGrid.append(
    range('level', 0, 1, .01, v => setPhysical({ level: v })),
    range('angle', 0, 85, 1, v => setPhysical({ angle: v })),
    range('depth', 0, 1.15, .01, v => setPhysical({ depth: v }))
  );
  teacher.append(teacherSummary, teacherGrid);
  const summaryBox = el('section', 'csp-summary', { 'data-csp-summary': '' });
  const finishPanel = createFinishPanel(doc, {
    text: () => c(), onAct: action => doAct(action),
    context: () => ({ proc, list: criteria(result, proc, lastTest), test: lastTest, extras: { fluoroSec: fx.seconds, sites, complications }, seed: caseSeed })
  });
  implant.append(phases, guide, caseRow, work, bar, keys, warning, teacher, summaryBox, finishPanel.element);

  // ---- Analysis: single-beat review, test rows ----
  const analysis = el('section', 'csp-analysis', { 'data-csp-analysis': '' });
  const toolbar = el('div', 'csp-actions');
  const reviewPlay = button(() => (ui.playing ? t().freeze : t().play), () => { ui.playing = !ui.playing; render(); }, { 'data-csp-review-play': '' });
  const caliper = button(() => t().caliper, () => { ui.caliper = !ui.caliper; render(); }, { 'data-csp-caliper': '' });
  const mark = button(() => t().mark, () => addMark(ui.cursor), { 'data-csp-mark': '' });
  toolbar.append(reviewPlay, caliper, mark, button(() => t().clear, () => { ui.marks = []; render(); }), button(() => t().reference, () => { reference = result; render(); }, { 'data-csp-reference': '' }));
  const zoom = el('select', '', { 'data-csp-view': 'zoom' }), scale = el('select', '', { 'data-csp-view': 'scale' });
  for (const [select, values, key] of [[zoom, [1, 2, 4], 'zoom'], [scale, [2, 4, 8], 'scale']]) {
    const field = el('label'); field.append(txt(el('span'), () => t()[key]));
    for (const value of values) { const o = el('option', '', { value }); o.textContent = String(value); select.append(o); }
    select.addEventListener('change', () => { ui[key] = Number(select.value); render(); }); field.append(select); toolbar.append(field);
  }
  const testTools = el('div', 'csp-actions');
  testTools.append(
    button(() => t().threshold, () => runTest('threshold'), { 'data-csp-test': 'sweep' }),
    button(() => t().programmed, () => runTest('s2'), { 'data-csp-test': 's2-sweep' }),
    button(() => t().clearTest, clearTest, { 'data-csp-clear-test': '' })
  );
  const strip = el('canvas', 'csp-strip', { role: 'img', 'data-csp-strip': '' });
  strip.addEventListener('click', event => {
    if (!plotted) return; const px = event.clientX - strip.getBoundingClientRect().left;
    if (px < plotted.left || px > plotted.right) return;
    ui.cursor = plotted.from + (px - plotted.left) / (plotted.right - plotted.left) * (plotted.to - plotted.from);
    ui.playing = false; if (ui.caliper) addMark(ui.cursor); else render();
  });
  const timeline = el('label', 'csp-timeline');
  const time = el('input', '', { type: 'range', min: 0, max: 500, step: 1, 'data-csp-time': '' });
  const clock = el('output'); time.addEventListener('input', () => { ui.cursor = Number(time.value); ui.playing = false; render(); });
  timeline.append(txt(el('span'), () => t().cursor), time, clock);
  const caliperText = el('p', 'csp-caliper-value', { 'data-csp-caliper-value': '', 'aria-live': 'polite' });
  const measure = el('dl', 'csp-metrics', { 'data-csp-metrics': '' });
  const tableWrap = el('div', 'csp-table-wrap'); const table = el('table'); const thead = el('thead'); const headRow = el('tr');
  for (let i = 0; i < 4; i++) headRow.append(txt(el('th', '', { scope: 'col' }), () => t().testHeaders[i]));
  thead.append(headRow); const tbody = el('tbody'); table.append(thead, tbody); tableWrap.append(table);
  const noTest = txt(el('p'), () => t().noTest);
  analysis.append(txt(el('h3'), () => c().review), testTools, toolbar, strip, timeline, caliperText, txt(el('p', 'csp-note'), () => t().overlay), measure,
    txt(el('p', 'csp-note'), () => t().unavailable), txt(el('h3'), () => t().rows), noTest, tableWrap);

  // ---- Blind assessment, case log, footer ----
  const quiz = el('section', 'csp-quiz');
  const choices = el('div', 'csp-actions'); const feedback = el('p', '', { 'aria-live': 'polite', 'data-csp-feedback': '' });
  const answers = TYPE_IDS.map(type => { const b = button(() => t().types[type], () => { ui.answer = type; render(); }, { 'data-csp-answer': type }); choices.append(b); return b; });
  quiz.append(txt(el('h3'), () => t().assess), txt(el('p', 'csp-note'), () => t().quizNote), choices, feedback, button(() => t().reveal, () => { ui.revealed = true; render(); }, { 'data-csp-reveal': '' }));
  const historyBox = el('section', 'csp-history'); const historyList = el('ol'); const storageNote = el('p', '', { 'aria-live': 'polite' });
  historyBox.append(txt(el('h3'), () => t().history), txt(el('p', 'csp-note'), () => t().logNote), button(() => t().save, save, { 'data-csp-save': '' }), storageNote, historyList);
  const footer = el('footer', 'csp-footer');
  footer.append(txt(el('p'), () => t().source));
  for (const [url, label] of [['https://doi.org/10.1093/europace/euad043', 'EHRA 2023'], ['https://doi.org/10.1093/europace/euaf050', 'ESC 2025']]) {
    const a = el('a', '', { href: url, target: '_blank', rel: 'noopener noreferrer' }); a.textContent = label; footer.append(a);
  }
  root.append(heading, limits, implant, analysis, quiz, historyBox, footer);

  // ---- Keyboard (implant page only) ----
  doc.addEventListener?.('keydown', event => {
    if (!ui.active || ui.page !== 'implant' || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(doc.activeElement?.tagName)) return;
    const key = event.key.toLowerCase();
    if (key === 'r') requestTurns(event.shiftKey ? 3 : 1);
    else if (key === 'u') { if (!spin) doAct({ type: 'unscrew' }); }
    else if (event.key === 'ArrowLeft') doAct({ type: 'torque', delta: 5 });
    else if (event.key === 'ArrowRight') doAct({ type: 'torque', delta: -5 });
    else if (event.key === 'ArrowUp') setOutput(proc.output + .25);
    else if (event.key === 'ArrowDown') setOutput(proc.output - .25);
    else if (event.key === ' ') { if (!event.repeat) holdOn(event); }
    else if (key === 'c') contrastBtn.click();
    else if (key === 't') startLiveThreshold();
    else if (key === 's') runTest('s2');
    else if (key === 'p') doAct({ type: 'pacing', on: !proc.pacing });
    else if (key === 'f') { ui.frozen = !ui.frozen; render(); }
    else if (key === 'v') { setProjection(ui.projection === 'rao' ? 'lao' : 'rao'); render(); }
    else if ((key === ',' || key === '.') && ctReady() && ui.projection !== 'septum') { setCarm(ui.carm + (key === ',' ? -CARM_STEP : CARM_STEP)); render(); }
    else return;
    event.preventDefault();
  });
  doc.addEventListener?.('keyup', event => { if (event.key === ' ') holdOff(); });

  // ---- State changes ----
  function addLog(key, params = {}) {
    const ms = Math.round(recorder.time), clockText = `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
    log = [{ time: clockText, key, params }, ...log].slice(0, LOG_SIZE);
  }
  function eventText(e) {
    const ev = c().events, f = v => (Number.isFinite(v) ? v.toFixed(v < 10 ? 2 : 0).replace(/\.?0+$/, '') : '·');
    const params = { ...e.params };
    if ('d' in params) params.d = Number(params.d).toFixed(1);
    if ('from' in params) { params.from = f(params.from); params.to = f(params.to); params.dv6 = Number.isFinite(e.params.dv6) ? e.params.dv6 : '·'; params.kind = c().kinds[params.kind] || params.kind; }
    if ('v' in params) params.v = f(params.v);
    if (Array.isArray(params.reasons)) params.reasons = params.reasons.map(r => c().acceptReasons[r] || r).join(', ');
    return fill(ev[e.key] || e.key, params);
  }
  function apply(events) {
    for (const e of events) {
      if (e.type === 'rotate') addLog('rotate', { n: e.turns, d: e.depthMm });
      else if (e.type === 'unscrew') addLog('unscrew', { d: e.depthMm });
      else if (e.type === 'acceptRefused') addLog('acceptRefused', { reasons: e.reasons });
      else if (e.type !== 'torque') { const { type, ...params } = e; addLog(type, params); }
      if (e.type === 'reposition') sites++;
      if (COMPLICATIONS.includes(e.type)) complications++;
    }
  }
  function doAct(action, { trendNow = true } = {}) {
    const out = act(proc, action);
    proc = out.proc; apply(out.events);
    if (MOVES.includes(action.type)) { moved(fx, now()); fx.dirty = true; }
    if (action.type === 'reposition') clearSpin();
    if (action.type === 'rotate' || action.type === 'unscrew' || action.type === 'reposition') { test = null; lastTest = null; }   // test evidence belongs to one position
    compute();
    if (trendNow && (action.type === 'rotate' || action.type === 'unscrew')) trend = pushTrend(trend, trendPoint(proc, result));
    else if (action.type === 'reposition') trend = [];
    render();
  }
  // ---- Animated turns ----
  /** A turn from the console: applied now, shown over time; extra turns wait in a queue. */
  function requestTurns(n) {
    if (spin) { spinQueue = [...spinQueue, n].slice(0, 12); render(); return; }
    startSpin(n);
  }
  function startSpin(n) {
    const fromDepth = proc.depthMm, before = proc.turns;
    doAct({ type: 'rotate', turns: n }, { trendNow: false });
    const turns = proc.turns - before;
    spin = createSpin({ fromDepth, toDepth: proc.depthMm, turns, lead: proc.lead });
    if (pacingPaused(spin)) addLog('spinPause');
    ensureLoop(); render();
  }
  function stepSpin(dt) {
    if (!spin) return;
    moved(fx, now());
    spin = advanceSpin(spin, dt);
    if (spin) return;
    compute(); trend = pushTrend(trend, trendPoint(proc, result));   // the trend reads the recording once pacing resumes
    const next = spinQueue[0]; spinQueue = spinQueue.slice(1);
    if (next) startSpin(next); else render();
  }
  function clearSpin() { spin = null; spinQueue = []; }
  /** The procedure as drawn: during a turn the tip is between the old and the new depth. */
  const shownProc = () => (spin ? { ...proc, depthMm: displayDepth(spin) } : proc);
  /** RAO / LAO buttons are C-arm presets; the septal section is the instructor's view. */
  function setProjection(id) {
    ui.projection = id;
    if (id === 'rao' || id === 'lao') ui.carm = CARM_PRESETS[id];
    fx.dirty = true;
  }
  function setCarm(angle) {
    ui.carm = clampCarm(angle);
    ui.projection = ui.carm > 0 ? 'lao' : 'rao';
    fx.dirty = true;
  }
  // The tip is dragged along the septum where the His-apex line is seen in profile (RAO side, up to AP).
  const locked = () => proc.depthMm > .05;
  const siteDraggable = () => !locked() && (ctReady() ? ui.projection !== 'septum' && ui.carm <= 0 : ui.projection === 'rao');
  const torqueDraggable = () => !locked() && ui.projection === 'lao';
  function moveSite(event) {
    const r = fluoro.getBoundingClientRect();
    const mode = ctReady() ? ui.carm : atlas.ready();
    doAct({ type: 'site', level: levelAt(event.clientX - r.left, event.clientY - r.top, r.width, r.height, mode) });
  }
  function setOutput(v) { const out = act(proc, { type: 'output', value: v }); proc = out.proc; recompute(); }
  function setSetting(values) { proc = act(proc, { type: 'set', values }).proc; change(); }
  function setPhysical(values) { proc = fromModel(proc, values); change(); }
  function loadCase(caseId, keepLog = false, seed = proc.seed ?? Date.now()) {
    const keep = { heart: proc.heart, lead: proc.lead };   // the lab setup survives a new case
    proc = initialProcedure(caseId, seed, keep); s2 = null; rows = []; reference = null; test = null; lastTest = null; trend = [];
    fx = { ...createFluoroState(), auto: fx.auto }; sites = 1; complications = 0; caseSeed = Number(seed) || 1; finishPanel.reset(); clearSpin();
    Object.assign(ui, { selected: -1, testKind: null, answer: null, revealed: false, marks: [], playing: false, cursor: 50 });
    if (!keepLog) log = [];
    addLog('case', { name: CASES.find(k => k.id === proc.caseId).name[lang()] });
    recompute();
  }
  function change() { s2 = null; rows = []; lastTest = null; ui.testKind = null; ui.selected = -1; ui.answer = null; ui.revealed = false; ui.marks = []; recompute(); }
  function compute() { state = { ...modelOf(proc), s2 }; result = simulate(state); }
  function recompute() { compute(); render(); }
  function clearTest() { rows = []; ui.testKind = null; s2 = null; ui.selected = -1; ui.answer = null; ui.revealed = false; ui.marks = []; reference = null; recompute(); }
  function runTest(kind) {
    ui.marks = []; ui.answer = null; ui.revealed = false; ui.testKind = kind; ui.selected = -1; ui.page = 'analysis';
    proc = { ...proc, pacing: true }; s2 = null; state = { ...modelOf(proc), s2 }; result = simulate(state);
    rows = kind === 'threshold' ? thresholdSweep(state) : programmedSweep(state);
    lastTest = testFromRows(kind === 'threshold' ? 'threshold' : 's2', rows, proc.polarity);   // the sweep counts as evidence like the live test
    reference = result; render();
  }
  function startLiveThreshold() {
    if (!proc.pacing) proc = { ...proc, pacing: true };
    test = startThreshold(proc); addLog('thresholdStart'); ui.frozen = false; recompute();
  }
  function addMark(ms) { if (!ui.caliper) return; if (ui.marks.length === 2) ui.marks = []; ui.marks.push(Math.round(ms)); ui.playing = false; render(); }
  function expected() {
    if (['none', 'off', 'perforation'].includes(result.capture.type)) return result.capture.type;
    return confirmation(criteria(result, proc, lastTest)).definitive ? result.capture.type : 'insufficient';
  }
  function save() {
    const item = { date: new Date().toISOString(), caseId: proc.caseId, capture: result.capture.type, answer: ui.answer, output: proc.output, pulseWidth: proc.pulseWidth, test: ui.testKind };
    history = [...history, item].slice(-50);
    try { if (!storage) throw new Error('unavailable'); storage.setItem(HISTORY_KEY, JSON.stringify(history)); storageStatus = 'saved'; } catch { storageStatus = 'saveFailed'; }
    render();
  }

  // ---- Live beats ----
  function liveOptions() {
    if (pacingPaused(spin)) return { ...modelOf(proc), s2: null, pacing: false };   // lumenless lead off the clips while it turns
    return { ...modelOf(proc), s2: null, ...(test && !test.done ? { output: test.output, pacing: true } : {}) };
  }
  function nextBeat() {
    const options = liveOptions();
    const interval = 60000 / options.rate, intrinsicInterval = 60000 / paramsOf(options).intrinsicRate;
    if (pendingEscape) { pendingEscape = false; return beatFromResult(sim({ ...options, pacing: false }), intrinsicInterval, { stimulus: false, kind: 'intrinsic' }); }
    if (proc.fixation > 0 && Math.random() < FIXATION_CHANCE) {
      const out = act(proc, { type: 'consumeFixation' });   // the observed beat is what sets the RBBB flag
      proc = out.proc; apply(out.events);
      return beatFromResult(sim({ ...options, output: 8, pacing: true }), interval * .75, { stimulus: false, kind: 'fixation' });
    }
    if (!options.pacing) return beatFromResult(sim(options), intrinsicInterval, { stimulus: false, kind: 'intrinsic' });
    const r = sim(options);
    if (r.metrics.qrsDuration == null) pendingEscape = true;
    if (test && !test.done) {
      const out = thresholdBeat(test, modelOf(proc));
      test = out.test;
      for (const e of out.events) {
        if (e.type === 'transition') addLog('transition', { from: e.from, to: e.to, dv6: e.dv6, kind: e.kind });
        if (e.type === 'thresholdDone') {
          addLog(e.threshold == null ? 'thresholdNone' : 'thresholdDone', { v: e.threshold });
          lastTest = test; rows = test.rows; ui.testKind = 'threshold'; ui.selected = -1; reference = result;
        }
      }
    }
    return beatFromResult(r, interval, { kind: 'paced' });
  }
  function liveLoop(time) {
    liveFrame = null;
    if (!ui.active || ui.page !== 'implant') { liveLast = null; return; }
    const dt = liveLast == null ? 16 : Math.min(250, time - liveLast); liveLast = time;
    stepSpin(dt);
    const frame = tickFluoro(fx, now(), dt, shownProc());
    if (frame) drawFluoroCanvas();
    if (!ui.frozen) {   // freeze stops the recording, not the fluoroscopy
      advance(recorder, dt, nextBeat);
      drawLive();
      if (recorder.beats !== shownBeats) { shownBeats = recorder.beats; renderConsole(); }
    }
    liveFrame = globalThis.requestAnimationFrame?.(liveLoop) ?? null;
  }
  function ensureLoop() { if (ui.active && ui.page === 'implant' && liveFrame === null) { liveLast = null; liveFrame = globalThis.requestAnimationFrame?.(liveLoop) ?? null; } }

  // ---- Rendering ----
  function renderConsole() {
    const stage = stageOf(proc);
    phaseNodes.forEach((n, i) => n.setAttribute('aria-current', i === stage ? 'step' : 'false'));
    const list = criteria(result, proc, lastTest);
    const g = guidance(proc, result, list, lastTest);
    const key = spin ? (pacingPaused(spin) ? 'spinning' : 'spinningStylet') : g.key;
    const queued = spin && spinQueue.length ? ` ${fill(c().guide.spinQueued, { queued: spinQueue.length })}` : '';
    guide.textContent = `${c().guide[key] || ''}${queued}`; guide.dataset.tone = spin ? 'info' : g.tone;
    // Readouts: the live paced beat when a test is running, else the current position.
    const shown = test && !test.done && recorder.last ? recorder.last.result : result;
    const m = shown.metrics, outputV = test && !test.done ? test.output : proc.output;
    const items = [['output', `${VALUE(outputV, 2)} V`], ['impedance', `${VALUE(m.impedance, 0)} Ω`], ['coi', `${VALUE(m.coi, 1)} mV`],
      ['v6Rwpt', timingReadable(m) ? `${VALUE(m.v6Rwpt, 0)} ms` : '·'], ['interpeak', list[2].value == null ? '·' : `${VALUE(m.interpeak, 0)} ms`], ['qrsDuration', `${VALUE(m.qrsDuration, 0)} ms`],
      ['turns', String(proc.turns)], ['depth', ui.blind ? '?' : `${proc.depthMm.toFixed(1)} / ${thicknessOf(proc)} mm`],
      ...(proc.rWave != null ? [['rWave', `${VALUE(proc.rWave, 1)} mV`]] : []),
      ...(proc.lbbPotential != null ? [['lbbPotential', `${proc.lbbPotential} ms`]] : [])];
    readouts.replaceChildren(...items.flatMap(([k, v]) => { const dt = el('dt'); dt.textContent = c().readouts[k]; const dd = el('dd', '', { 'data-csp-readout': k }); dd.textContent = v; return [dt, dd]; }));
    coach.replaceChildren(...coaching(proc, result, list, lastTest, trend).map(i => {
      const li = el('li', '', { 'data-tone': i.tone, 'data-csp-coach-item': i.key });
      const params = { ...i.params, reasons: Array.isArray(i.params.reasons) ? i.params.reasons.map(r => c().acceptReasons[r] || r).join(', ') : '' };
      li.textContent = fill(c().coach[i.key] || i.key, params); return li;
    }));
    renderCriteria(list);
    logList.replaceChildren(...log.map(e => { const li = el('li'); const time = el('time'); time.textContent = e.time; li.append(time, ` ${eventText(e)}`); return li; }));
    sheathOut.textContent = `${Math.round(proc.sheath)}°`;   // signed: negative anterior (clockwise), positive posterior
    const locked = proc.depthMm > .05;
    ccw.disabled = cw.disabled = locked || Boolean(spin); unscrew.disabled = !locked || Boolean(spin); reposition.disabled = Boolean(spin);
    rotate3.disabled = !rapidAllowed(proc) || Boolean(spin);
    accept.disabled = stage < 3 || result.capture.type === 'perforation' || Boolean(spin);
    implant.dataset.spinning = String(Boolean(spin));
    thresholdBtn.setAttribute('aria-pressed', String(Boolean(test && !test.done)));
    warning.textContent = result.capture.type === 'perforation' ? t().warning : '';
    if (proc.accepted) {
      const s = summary(proc, result, list, lastTest), rowsOf = c().summaryRows;
      summaryBox.hidden = false;
      summaryBox.replaceChildren(Object.assign(el('h3'), { textContent: c().summary }), Object.assign(el('p', 'csp-verdict'), { textContent: c().verdict[s.verdict] }),
        ...Object.entries(rowsOf).map(([k, label]) => Object.assign(el('p'), { textContent: `${label}: ${k === 'proof' ? `${s.proof} / 3` : s[k] ?? '·'}` })));
    } else summaryBox.hidden = true;
  }
  // Criteria rows are built once (an opened explanation stays open while the beats update them).
  const criterionNodes = new Map();
  function renderCriteria(list) {
    if (!criterionNodes.size) {
      let last = null;
      for (const item of list) {
        if (item.group !== last) { last = item.group; const h = el('h4', '', { 'data-csp-group': item.group }); criteriaBox.append(h); criterionNodes.set(`group:${item.group}`, h); }
        const d = el('details', 'csp-criterion', { 'data-csp-criterion': item.id });
        const s = el('summary'); const badge = el('span', 'csp-badge'); const name = el('span'); const p = el('p');
        s.append(badge, name); d.append(s, p); criteriaBox.append(d);
        criterionNodes.set(item.id, { d, badge, name, p });
      }
    }
    for (const item of list) {
      const node = criterionNodes.get(item.id), [name, explain] = c().criteria[item.id];
      node.d.dataset.status = item.status;
      node.badge.textContent = c().status[item.status]; node.name.textContent = fill(name, { cutoff: item.cutoff ?? '' }); node.p.textContent = explain;
      criterionNodes.get(`group:${item.group}`).textContent = c().groups[item.group];
    }
  }
  function renderTable() {
    noTest.hidden = rows.length > 0; tableWrap.hidden = !rows.length;
    tbody.replaceChildren(...rows.map((row, i) => {
      const tr = el('tr'); const td = el('td'); const b = el('button', '', { type: 'button', 'data-csp-row': i, 'aria-pressed': ui.selected === i });
      b.textContent = ui.testKind === 's2' ? `${row.s2} ms` : `${VALUE(row.output, 2)} V`;
      b.addEventListener('click', () => {
        ui.selected = i; ui.answer = null; ui.revealed = false; ui.marks = [];
        if (ui.testKind === 's2') s2 = row.s2; else { proc = { ...proc, output: row.output }; s2 = null; }
        state = { ...modelOf(proc), s2 }; result = simulate(state); render();
      });
      td.append(b); tr.append(td);
      for (const value of [VALUE(row.metrics.qrsDuration), VALUE(row.metrics.v6Rwpt), ui.blind ? '?' : t().types[row.capture.type]]) { const cell = el('td'); cell.textContent = value; tr.append(cell); }
      return tr;
    }));
  }
  function render() {
    for (const [n, get] of bindings) n.textContent = get();
    root.setAttribute('lang', lang());
    pageButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(pages[i] === ui.page)));
    implant.hidden = ui.page !== 'implant';
    analysis.hidden = ui.page !== 'analysis' && ui.page !== 'quiz';
    quiz.hidden = !['quiz', 'analysis'].includes(ui.page); historyBox.hidden = ui.page !== 'history';
    caseSelect.value = proc.caseId; caseField.hidden = ui.blind; reseed.hidden = ui.blind || proc.caseId !== 'random';
    for (const g of ['case', 'trap']) caseGroups[g].label = c().caseGroups[g];
    patient.textContent = ui.blind ? '' : c().patient[proc.caseId];
    teacherBtn.setAttribute('aria-pressed', String(ui.instructor)); blindBtn.setAttribute('aria-pressed', String(ui.blind));
    teacher.hidden = !ui.instructor || ui.blind;
    targetBox.hidden = !ui.instructor || ui.blind; guidesInput.checked = ui.guides; targetInput.checked = ui.target;
    pace.setAttribute('aria-pressed', String(proc.pacing)); play.setAttribute('aria-pressed', String(ui.frozen));
    speed.value = String(recorder.speed); layout.value = ui.layout;
    const values = { ...state, output: proc.output, pulseWidth: proc.pulseWidth, level: proc.level, angle: state.angle, depth: state.depth, rate: proc.rate };
    for (const [key, { input, output }] of Object.entries(controlNodes)) {
      if (doc.activeElement !== input) input.value = String(values[key]);
      output.textContent = key === 'output' ? `${VALUE(values[key], 2)} V` : key === 'pulseWidth' ? `${VALUE(values[key], 1)} ms` : String(Math.round(values[key] * 100) / 100);
    }
    controlNodes.depth.label.hidden = ui.blind;
    polarity.value = proc.polarity;
    heartSelect.value = proc.heart; supportInput.checked = proc.forwardSupport; supportBox.hidden = proc.lead !== 'stylet';
    autoInput.checked = fx.auto; heartSelect.disabled = proc.depthMm > .05;
    leadCards.forEach(card => { const on = card.dataset.cspLead === proc.lead; card.setAttribute('aria-checked', String(on)); card.classList?.toggle('is-on', on); card.disabled = proc.depthMm > .05 && !on; });
    finishPanel.render();
    viewButtons.forEach(b => { const id = b.dataset.cspProjection; b.hidden = id === 'septum' && (ui.blind || !ui.instructor); b.setAttribute('aria-pressed', String(id === ui.projection)); });
    if (ui.projection === 'septum' && (ui.blind || !ui.instructor)) setProjection('rao');
    carmField.hidden = !ctReady() || ui.projection === 'septum';
    if (doc.activeElement !== carmInput) carmInput.value = String(ui.carm);
    carmValue.textContent = carmLabel(ui.carm);
    ctNote.textContent = ct ? (ct.status === 'ready' ? `${CARM_TEXT[lang()].ct}: TotalSegmentator s0019 (CC BY 4.0)` : ct.status === 'failed' ? CARM_TEXT[lang()].failed : CARM_TEXT[lang()].loading) : '';
    fluoro.classList?.toggle('is-draggable', siteDraggable() || torqueDraggable());
    fluoroHint.textContent = ui.projection === 'septum' ? '' : locked() ? CARM_TEXT[lang()].hintLocked : ui.projection === 'lao' ? CARM_TEXT[lang()].hintLao : CARM_TEXT[lang()].hintRao;
    groundTruth.hidden = (!ui.instructor || ui.blind) && !ui.revealed; groundTruth.textContent = `${t().capture}: ${t().types[result.capture.type]}`;
    reviewPlay.setAttribute('aria-pressed', String(ui.playing)); caliper.setAttribute('aria-pressed', String(ui.caliper)); mark.disabled = !ui.caliper;
    zoom.value = String(ui.zoom); scale.value = String(ui.scale);
    const metricKeys = ['v6Rwpt', 'v1Rwpt', 'interpeak', 'qrsDuration', ...(ui.blind ? [] : ['impedance', 'coi'])];
    measure.replaceChildren(...metricKeys.flatMap(key => { const dt = el('dt'); dt.textContent = t().metrics[key]; const dd = el('dd', '', { 'data-csp-metric': key }); dd.textContent = `${VALUE(result.metrics[key])} ${key === 'impedance' ? 'Ω' : key === 'coi' ? 'mV' : 'ms'}`; return [dt, dd]; }));
    renderTable();
    const truth = expected(); feedback.textContent = ui.answer ? `${ui.answer === truth ? t().correct : t().incorrect} ${t().evidence}${ui.revealed ? ` ${t().types[result.capture.type]}` : ''}` : '';
    answers.forEach((b, i) => b.setAttribute('aria-pressed', String(TYPE_IDS[i] === ui.answer)));
    storageNote.textContent = storageStatus ? t()[storageStatus] : '';
    historyList.replaceChildren(...(history.length ? history.map(item => { const n = el('li'); const k = CASES.find(x => x.id === item.caseId); n.textContent = `${item.date} · ${k.name[lang()]} · ${t().types[item.capture]}`; return n; }) : [Object.assign(el('li'), { textContent: t().empty })]));
    fluoro.setAttribute('aria-label', `${c().views[ui.projection]}`); strip.setAttribute('aria-label', `${t().signal}; mV, ms`); live.setAttribute('aria-label', `${c().live}; ${recorder.speed} mm/s`);
    renderConsole();
    draw();
    schedule();
  }
  function schedule() {
    const wantLive = ui.active && ui.page === 'implant';
    if (wantLive && liveFrame === null) { liveLast = null; liveFrame = globalThis.requestAnimationFrame?.(liveLoop) ?? null; }
    if (!wantLive && liveFrame !== null) { globalThis.cancelAnimationFrame?.(liveFrame); liveFrame = null; }
    const wantReview = ui.active && ui.playing;
    if (wantReview && reviewFrame === null) { reviewLast = null; reviewFrame = globalThis.requestAnimationFrame?.(reviewTick) ?? null; }
    if (!wantReview && reviewFrame !== null) { globalThis.cancelAnimationFrame?.(reviewFrame); reviewFrame = null; }
  }
  function context(canvas, background = '#0b0e12') {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return null; const ctx = canvas.getContext?.('2d'); if (!ctx) return null;
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = background; ctx.fillRect(0, 0, w, h); ctx.font = '11px system-ui'; return { ctx, w, h };
  }
  function drawFluoroCanvas() {
    const k = context(fluoro); if (!k) return;
    const t0 = now();
    const contrast = contrastOf(fx, t0);
    const image = ctReady() && ui.projection !== 'septum' ? ct.image(ui.carm, contrast) : null;
    drawFluoro(k.ctx, k.w, k.h, ui.projection, shownProc(), { images: atlas.images, ct: image ? { image, geo: ctGeometry(ui.carm) } : null, spin: spin ? phaseOf(spin) : null, guides: ui.guides, target: ui.target && ui.instructor && !ui.blind, badge: !ui.blind, text: c().fluoro,
      contrast, fx: { live: isLive(fx, t0), seconds: fx.seconds, shownDepth: fx.shownDepth } });
  }
  function drawTrendsCanvas() {
    const k = context(trends); if (!k) return;
    drawTrends(k.ctx, k.w, k.h, trend, { labels: c().trends, emptyText: c().trendsEmpty });
  }
  function drawLive() {
    const k = context(live, '#07090c'); if (!k) return;
    const labels = { TIP: c().tip, COI: c().coi }, colors = { V1: '#f4cb75', V6: '#f4cb75', TIP: '#65c9bb', COI: '#8fd3ff' };
    const rows = ui.focusLead ? [ui.focusLead] : LAYOUTS[ui.layout];
    const focus = ui.focusLead ? FOCUS_GAIN : 1;   // one tall row: keep the complexes inside it
    drawSweep(k.ctx, k.w, k.h, recorder, { rows, ecgGain: ui.ecgGain * focus, egmGain: ui.egmGain * focus, labels, colors });
    if (ui.focusLead) { k.ctx.fillStyle = '#6b7787'; k.ctx.font = '10px system-ui, sans-serif'; k.ctx.fillText(UI_BACK[lang()], 52, 18); }
  }
  /** Channel under a pointer y in the live canvas (same row layout as drawSweep). */
  function liveRowAt(clientY) {
    const r = live.getBoundingClientRect(), rows = LAYOUTS[ui.layout];
    const i = Math.floor(((clientY - r.top - 8) / (r.height - 26)) * rows.length);
    return rows[Math.max(0, Math.min(rows.length - 1, i))];
  }
  function toggleFocus(id) { ui.focusLead = ui.focusLead ? null : id; live.setAttribute('aria-label', `${c().live}${ui.focusLead ? `: ${ui.focusLead}` : ''}`); drawLive(); }
  function drawStrip() {
    const k = context(strip); if (!k) return; const { ctx, w, h } = k;
    const left = 70, right = w - 10, top = 22, bottom = h - 24, from = Math.max(0, Math.min(500 - 500 / ui.zoom, ui.cursor - 250 / ui.zoom)), to = from + 500 / ui.zoom;
    plotted = { left, right, from, to }; const x = ms => left + (ms - from) / (to - from) * (right - left);
    for (let ms = Math.ceil(from / 10) * 10; ms <= to; ms += 10) { ctx.strokeStyle = ms % 50 === 0 ? '#232c38' : '#151b23'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x(ms), top); ctx.lineTo(x(ms), bottom); ctx.stroke(); if (ms % 50 === 0 && ms < to - 15) { ctx.fillStyle = '#8d99a8'; ctx.fillText(String(ms), x(ms) - 5, h - 7); } }
    ctx.fillStyle = '#8d99a8'; ctx.fillText('ms', w - 25, h - 7); ctx.fillText('mV', 8, 14);
    const series = [...LEADS.map(id => ({ id, data: result.leads[id], ref: reference?.leads[id] })), { id: 'EGM F', data: result.egm.filtered, ref: reference?.egm.filtered }, { id: 'EGM U', data: result.egm.unfiltered, ref: reference?.egm.unfiltered }];
    const row = (bottom - top) / series.length;
    series.forEach(({ id, data, ref }, r) => {
      const y = top + (r + .5) * row; ctx.fillStyle = ['V1', 'V6'].includes(id) ? '#f4cb75' : '#c3ccd7'; ctx.fillText(id, 8, y + 3);
      ctx.save(); ctx.beginPath(); ctx.rect(left, top + r * row, right - left, row); ctx.clip();
      for (const [values, color] of [[ref, '#5c6673'], [data, ['V1', 'V6'].includes(id) ? '#f4cb75' : r > 11 ? '#65c9bb' : '#d3dae3']]) {
        if (!values) continue; ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath();
        for (let i = Math.max(0, Math.floor(from)); i < result.times.length && result.times[i] <= to; i++) { const yy = y - values[i] * row / ui.scale; if (i === Math.floor(from)) ctx.moveTo(x(result.times[i]), yy); else ctx.lineTo(x(result.times[i]), yy); }
        ctx.stroke();
      }
      ctx.restore();
    });
    for (const [ms, color] of [[ui.cursor, '#8d99a8'], ...ui.marks.map(ms => [ms, '#e9be65'])]) { if (ms < from || ms > to) continue; ctx.strokeStyle = color; ctx.beginPath(); ctx.moveTo(x(ms), top); ctx.lineTo(x(ms), bottom); ctx.stroke(); }
  }
  function draw() {
    if (!ui.active) return;
    time.value = String(Math.round(ui.cursor)); clock.textContent = `${Math.round(ui.cursor)} ms`;
    caliperText.textContent = ui.marks.length === 2 ? `Δt = ${Math.abs(ui.marks[1] - ui.marks[0])} ms` : ui.marks.length ? `t₁ = ${ui.marks[0]} ms` : '';
    if (ui.page === 'implant') { drawFluoroCanvas(); drawLive(); drawTrendsCanvas(); } else drawStrip();
  }
  function reviewTick(now) {
    reviewFrame = null; if (!ui.active || !ui.playing) return;
    if (reviewLast !== null) ui.cursor = (ui.cursor + Math.min(100, now - reviewLast) * .1) % 500;
    reviewLast = now; draw(); reviewFrame = globalThis.requestAnimationFrame?.(reviewTick) ?? null;
  }

  loadCase('baseline', false, 1);
  return {
    element: root, render, draw,
    setActive(active) {
      ui.active = Boolean(active); root.hidden = !ui.active;
      if (ui.active) { ct?.start(); render(); }
      else {
        for (const f of [liveFrame, reviewFrame]) if (f !== null) globalThis.cancelAnimationFrame?.(f);
        liveFrame = reviewFrame = null; liveLast = reviewLast = null;
      }
    },
    getState: () => ({ ...state, ui: { ...ui, marks: [...ui.marks] }, procedure: { ...proc }, liveTime: recorder.time, trend: trend.map(p => ({ ...p })),
      fluoro: { on: fx.on, auto: fx.auto, live: isLive(fx, now()), seconds: fx.seconds, contrast: contrastOf(fx, now()), shownDepth: fx.shownDepth }, sites, complications, atlasFluoro: atlas.ready(), ctFluoro: ct?.status || 'none', carm: ui.carm, spin: { active: Boolean(spin), queued: spinQueue.length, pacingPaused: pacingPaused(spin) } }),
    loadCase: (caseId, seed) => loadCase(caseId, false, seed),
    getResult: () => result, getReference: () => reference, getRows: () => rows,
    getHistory: () => history.map(x => ({ ...x })),
    getCriteria: () => criteria(result, proc, lastTest), getTest: () => test || lastTest,
    act: action => doAct(action),
    /** Advance the live recording by `ms` at once (tests): beats, the threshold test and the log run as in real time. */
    tick(ms) {
      for (let left = ms; left > 0; left -= 250) { const dt = Math.min(250, left); stepSpin(dt); advance(recorder, dt, nextBeat); tickFluoro(fx, now(), dt, shownProc()); }
      shownBeats = recorder.beats; render();
    }
  };
}

// Physical examination panel: finding picker, bedside maneuvers on a real
// time course, a schematic phonocardiogram on the shared cardiac clock, the
// LVOT gauge for dynamic obstruction, the model versus textbook response
// table and the finding card. Every list comes from exam-findings.js and
// exam-physiology.js; the sound and tracing are teaching schematics.

import './exam-panel.css';
import { LVOT_THRESHOLDS, MANEUVERS, MANEUVER_IDS, lvotClass, maneuverLevel } from './exam-physiology.js';
import { AUSCULTATION_AREAS, FINDINGS, FINDING_IDS, respond } from './exam-findings.js';
import { phaseToTime } from './cardiac-cycle.js';
import { createExamAudio, audioSupported } from './exam-audio.js';
import {
  COLORS, GAUGE_MAX, SAM_SEPTUM_PATH, SAM_VIEWBOX, TEXT, findingWords, fmtNum, labelOf, maneuverStage,
  normLang, paintPhono, phonoGeometry, quantizeLevel, responseTable, samGeometry, sampleExamStrip
} from './exam-panel-parts.js';

export { sampleExamStrip, responseTable } from './exam-panel-parts.js';

const DEFAULT_FINDING = 'hocm';
const DEFAULT_MANEUVER = 'rest';
const KINDS = ['systolic', 'diastolic'];
const SVG_NS = 'http://www.w3.org/2000/svg';
const pct = v => `${((100 * Math.max(0, Math.min(GAUGE_MAX, v))) / GAUGE_MAX).toFixed(2)}%`;

function el(tag, cls, text, props) {
  const node = Object.assign(document.createElement(tag), props);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}
const textEl = (tag, cls, key) => { const node = el(tag, cls); node.dataset.k = key; return node; };
function svgEl(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, String(v));
  return node;
}

function buildGauge() {
  const r = { box: el('div', 'exam-lvot'), gauge: el('div', 'exam-gauge', null, { role: 'meter' }) };
  const { obstructive, severe } = LVOT_THRESHOLDS;
  for (const [cls, from, to] of [['is-ok', 0, obstructive], ['is-warn', obstructive, severe], ['is-bad', severe, GAUGE_MAX]]) {
    const zone = el('span', `exam-gauge-zone ${cls}`);
    Object.assign(zone.style, { left: pct(from), width: `calc(${pct(to)} - ${pct(from)})` });
    r.gauge.append(zone);
  }
  const scale = el('div', 'exam-gauge-scale');
  for (const v of [0, obstructive, severe, GAUGE_MAX]) {
    if (v > 0 && v < GAUGE_MAX) { const tick = el('span', 'exam-gauge-tick'); tick.style.left = pct(v); r.gauge.append(tick); }
    const lab = el('span', 'exam-gauge-num', String(v));
    lab.style.left = pct(v);
    scale.append(lab);
  }
  r.rest = el('span', 'exam-gauge-rest');
  r.marker = el('span', 'exam-gauge-marker');
  r.gauge.append(r.rest, r.marker);
  r.reading = el('p', 'exam-lvot-reading');
  r.sam = el('figure', 'exam-sam');
  r.svg = svgEl('svg', { viewBox: SAM_VIEWBOX, class: 'exam-sam-svg', role: 'img', preserveAspectRatio: 'xMidYMid meet' });
  r.samLeaflet = svgEl('path', { class: 'exam-sam-leaflet', fill: 'none' });
  r.samGap = svgEl('line', { class: 'exam-sam-gap' });
  r.samSeptumText = svgEl('text', { x: 6, y: 7, class: 'exam-sam-text is-light' });
  r.samLeafletText = svgEl('text', { x: 236, y: 40, class: 'exam-sam-text', 'text-anchor': 'end' });
  const lvotText = svgEl('text', { x: 20, y: 34, class: 'exam-sam-text' });
  lvotText.textContent = 'LVOT';
  r.svg.append(svgEl('path', { d: SAM_SEPTUM_PATH, class: 'exam-sam-septum' }), svgEl('path', { d: 'M20,40 H92 M87,36 L93,40 L87,44', class: 'exam-sam-flow' }),
    lvotText, r.samGap, r.samLeaflet, r.samSeptumText, r.samLeafletText);
  r.samCaption = el('figcaption', 'exam-sam-caption');
  r.sam.append(r.svg, r.samCaption);
  r.box.append(textEl('h4', 'exam-section-title', 'lvotTitle'), r.gauge, scale, r.reading, r.sam);
  return r;
}

function buildDom() {
  const r = { element: el('div', 'exam-panel'), select: el('select', 'exam-select'), badge: el('span', 'exam-badge') };
  r.grade = el('b', 'exam-badge-grade');
  r.badgeLvot = el('span', 'exam-badge-lvot', null, { hidden: true });
  r.badge.append(r.grade, r.badgeLvot);
  const header = el('div', 'exam-header');
  header.append(r.select, r.badge);
  r.maneuvers = el('div', 'exam-maneuvers');
  r.maneuverButtons = Object.fromEntries(MANEUVER_IDS.map(id => {
    const b = el('button', 'exam-maneuver', null, { type: 'button' });
    b.dataset.maneuver = id;
    r.maneuvers.append(b);
    return [id, b];
  }));
  r.progress = el('div', 'exam-progress', null, { hidden: true });
  r.progressTrack = el('div', 'exam-progress-track');
  r.segments = ['ramp', 'hold', 'recover'].map(stage => { const s = el('span', 'exam-progress-seg'); s.dataset.stage = stage; return s; });
  r.progressFill = el('span', 'exam-progress-fill');
  r.progressTrack.append(...r.segments, r.progressFill);
  r.progressLabel = el('span', 'exam-progress-label');
  r.progress.append(r.progressTrack, r.progressLabel);
  r.note = el('p', 'exam-note', null, { hidden: true });
  r.canvasWrap = el('div', 'exam-canvas-wrap');
  r.canvasWrap.append(r.canvas = el('canvas', 'exam-canvas', null, { role: 'img' }));
  r.audioBox = el('input', null, null, { type: 'checkbox' });
  r.audioLabel = el('label', 'exam-audio');
  r.audioLabel.append(r.audioBox, textEl('span', null, 'sound'));
  r.audioNote = textEl('span', 'exam-audio-note', 'soundNote');
  r.audioNote.hidden = true;
  const audioRow = el('div', 'exam-audio-row');
  audioRow.append(r.audioLabel, r.audioNote);
  r.hint = el('p', 'exam-hint', null, { hidden: true });
  r.lvot = buildGauge();
  r.tableWrap = el('div', 'exam-table-wrap');
  r.table = el('table', 'exam-table');
  r.tableWrap.append(r.table);
  r.citation = textEl('p', 'exam-citation', 'citation');
  r.card = el('div', 'exam-card');
  r.areas = el('div', 'exam-areas');
  r.areaChips = Object.fromEntries(Object.keys(AUSCULTATION_AREAS).map(id => {
    const chip = el('button', 'exam-area', null, { type: 'button' });
    chip.dataset.area = id;
    r.areas.append(chip);
    return [id, chip];
  }));
  r.element.append(header, textEl('h4', 'exam-section-title', 'maneuvers'), r.maneuvers, r.progress, r.note, r.canvasWrap,
    audioRow, r.hint, r.lvot.box, textEl('h4', 'exam-section-title', 'table'), r.tableWrap, r.citation,
    textEl('h4', 'exam-section-title', 'areas'), r.areas, r.card);
  return r;
}

/**
 * Create the examination panel inside root.
 * @param {HTMLElement} root empty container provided by the integrator
 * @param {{ lang?: 'tr'|'en', finding?: string, getCycleState?: () => ({ phase: number, bpm: number, rhythm: string, playing: boolean }),
 *   onFindingChange?: (id: string) => void, onManeuverChange?: (id: string) => void, onAreaFocus?: (areaId: string) => void }} options
 */
export function createExamPanel(root, options = {}) {
  if (!root) throw new Error('createExamPanel: root is required');
  const { getCycleState = () => ({}), onFindingChange, onManeuverChange, onAreaFocus } = options;
  let lang = normLang(options.lang);
  const state = {
    findingId: FINDINGS[options.finding] ? options.finding : FINDINGS[DEFAULT_FINDING] ? DEFAULT_FINDING : FINDING_IDS[0],
    maneuverId: DEFAULT_MANEUVER, autoplay: false, startMs: 0, areaId: null
  };
  const ac = new AbortController();
  const on = (target, type, fn) => target.addEventListener(type, fn, { signal: ac.signal });
  let destroyed = false, rafId = 0, lastCycle = {};
  let cache = { key: '', g: null };
  let ui = { key: '', progressKey: '' };
  const layer = document.createElement('canvas');

  root.textContent = '';
  const refs = buildDom();
  const { element, select, canvas, canvasWrap } = refs;
  root.append(element);
  const audio = createExamAudio({ getParams: audioParams });
  if (!audioSupported()) refs.audioLabel.hidden = true;

  const finding = () => FINDINGS[state.findingId];
  const now = () => (globalThis.performance ? performance.now() : Date.now());
  const elapsed = () => (now() - state.startMs) / 1000;
  function currentLevel() {
    if (state.maneuverId === DEFAULT_MANEUVER) return 0;
    return state.autoplay ? maneuverLevel(state.maneuverId, elapsed()) : 1;
  }

  function audioParams() {
    const cs = lastCycle || {};
    const hidden = root.hidden || globalThis.document?.hidden;
    const f = finding();
    return {
      findingId: state.findingId, pitch: f?.pitch, physio: respond(state.findingId, state.maneuverId, currentLevel()).physio,
      bpm: cs.bpm, rhythm: cs.rhythm || 'sinus', phase: cs.phase, active: !destroyed && !hidden && cs.playing !== false
    };
  }

  function renderFindingOptions() {
    select.replaceChildren(...KINDS.map(kind => {
      const group = el('optgroup', null, null, { label: TEXT[lang][kind] });
      group.append(...FINDING_IDS.filter(id => FINDINGS[id].kind === kind)
        .map(id => el('option', null, labelOf(FINDINGS[id].label, lang), { value: id })));
      return group;
    }).filter(g => g.children.length));
    select.value = state.findingId;
  }

  function renderTable() {
    const T = TEXT[lang];
    const rows = responseTable(state.findingId, lang);
    const head = el('tr');
    for (const k of ['colManeuver', 'colModel', 'colExpected', 'colMatch', 'colLembo']) head.append(el('th', null, T[k], { scope: 'col' }));
    const body = el('tbody');
    for (const row of rows) {
      const tr = el('tr', 'exam-row');
      tr.dataset.maneuver = row.maneuverId;
      tr.classList.toggle('is-active', row.maneuverId === state.maneuverId);
      const match = el('td', `exam-match${row.match === true ? ' is-yes' : row.match === false ? ' is-no' : ''}`,
        row.match === true ? '✓' : row.match === false ? '✗' : '', { title: row.match == null ? '' : row.match ? T.match : T.mismatch });
      const lembo = el('td', 'exam-lembo', row.lembo || '', { title: row.lembo ? [T.lemboTitle, row.lemboNote].filter(Boolean).join('; ') : '' });
      const wrap = text => (text || '').replace(/\//g, '/\u200b');   // let timing words break after the slash
      tr.append(el('td', 'exam-cell-maneuver', row.label), el('td', 'exam-dir', wrap(row.modelText), { title: row.modelTitle }),
        el('td', 'exam-dir', wrap(row.expected)), match, lembo);
      body.append(tr);
    }
    const thead = el('thead');
    thead.append(head);
    refs.table.replaceChildren(thead, body);
    refs.citation.hidden = !rows.some(r => r.lembo);
  }

  function renderCard() {
    const f = finding();
    const T = TEXT[lang];
    const words = findingWords(f, lang);
    const area = AUSCULTATION_AREAS[f.area];
    const rows = [[T.bestHeard, area ? labelOf(area.label, lang) : f.area], [T.radiation, labelOf(f.radiation, lang)],
      [T.timing, words.timing], [T.pitch, words.pitch]];
    refs.card.replaceChildren(...rows.map(([k, v]) => {
      const row = el('div', 'exam-card-row');
      row.append(el('span', 'exam-card-label', k), el('span', 'exam-card-value', v));
      return row;
    }), el('p', 'exam-teaching', labelOf(f.teaching, lang)));
  }

  function renderAreas() {
    for (const [id, chip] of Object.entries(refs.areaChips)) {
      const area = AUSCULTATION_AREAS[id];
      const full = labelOf(area.label, lang);
      chip.replaceChildren(el('b', 'exam-area-short', area.short), el('span', 'exam-area-name', full.split(' (')[0]));
      chip.title = full;
      chip.classList.toggle('is-finding', id === finding().area);
      chip.classList.toggle('is-active', id === state.areaId);
      chip.setAttribute('aria-pressed', String(id === state.areaId));
    }
  }

  function renderManeuvers() {
    for (const [id, b] of Object.entries(refs.maneuverButtons)) {
      b.textContent = labelOf(MANEUVERS[id].label, lang);
      b.classList.toggle('is-active', id === state.maneuverId);
      b.setAttribute('aria-pressed', String(id === state.maneuverId));
    }
    for (const tr of refs.table.querySelectorAll('.exam-row')) tr.classList.toggle('is-active', tr.dataset.maneuver === state.maneuverId);
    const note = labelOf(MANEUVERS[state.maneuverId]?.note, lang);
    refs.note.textContent = note;
    refs.note.hidden = !note;
    const { spans, total } = maneuverStage(state.maneuverId, 0);
    refs.progress.hidden = !total;
    if (total) refs.segments.forEach((s, i) => { s.style.flexGrow = String(spans[i]); });
    ui.progressKey = '';
  }

  function updateProgress() {
    if (refs.progress.hidden) return;
    const T = TEXT[lang];
    const t = elapsed();
    const st = maneuverStage(state.maneuverId, state.autoplay ? t : 0);
    const fraction = state.autoplay ? st.fraction : (st.spans[0] + st.spans[1] / 2) / st.total;
    const label = state.autoplay ? `${T.stages[st.stage]} · ${fmtNum(Math.min(t, st.total), lang)} s` : T.stages.fixed;
    const key = `${Math.round(fraction * 400)}|${label}`;
    if (key === ui.progressKey) return;
    ui.progressKey = key;
    refs.progressFill.style.width = `${(fraction * 100).toFixed(2)}%`;
    refs.progressLabel.textContent = label;
  }

  function updateLevelUi(level) {
    const key = `${state.findingId}|${state.maneuverId}|${level}|${lang}`;
    if (key === ui.key) return;
    ui.key = key;
    const T = TEXT[lang];
    const f = finding();
    const r = respond(state.findingId, state.maneuverId, level);
    refs.grade.textContent = `${fmtNum(r.grade, lang)}/6`;
    refs.badge.title = T.gradeTitle;
    const lv = refs.lvot;
    lv.box.hidden = !f.lvot;
    refs.badgeLvot.hidden = !f.lvot;
    if (!f.lvot) return;
    const g = Math.round(r.lvotGradient);
    const rest = Math.round(respond(state.findingId, DEFAULT_MANEUVER, 0).lvotGradient);
    const cls = lvotClass(g);
    const ctx = level > 0 && g > rest * 1.05 ? 'provoked' : level > 0 && g < rest * 0.95 ? 'reduced' : 'rest';
    refs.badgeLvot.textContent = `LVOT ${g} mmHg`;
    refs.badgeLvot.dataset.class = cls;
    lv.box.dataset.class = cls;
    lv.marker.style.left = pct(g);
    lv.rest.style.left = pct(rest);
    lv.rest.title = `${T.restMark}: ${rest} mmHg`;
    Object.entries({ 'aria-valuemin': 0, 'aria-valuemax': GAUGE_MAX, 'aria-valuenow': g }).forEach(([k, v]) => lv.gauge.setAttribute(k, String(v)));
    lv.reading.textContent = T.lvotReading(g, T.lvotClass[cls], T.lvotCtx[ctx]);
    lv.gauge.setAttribute('aria-label', lv.reading.textContent);
    const sam = samGeometry(r.lvotGradient);
    lv.samLeaflet.setAttribute('d', sam.leaflet);
    Object.entries(sam.gapLine).forEach(([k, v]) => lv.samGap.setAttribute(k, v.toFixed(1)));
    lv.samSeptumText.textContent = T.samSeptum;
    lv.samLeafletText.textContent = T.samLeaflet;
    lv.samCaption.textContent = T.samCaption;
    lv.svg.setAttribute('aria-label', T.samCaption);
  }

  function renderAll() {
    const T = TEXT[lang];
    element.lang = lang;
    for (const node of element.querySelectorAll('[data-k]')) node.textContent = T[node.dataset.k];
    select.setAttribute('aria-label', T.finding);
    canvas.setAttribute('aria-label', T.canvas);
    refs.audioLabel.title = T.soundNote;
    renderFindingOptions();
    renderTable();
    renderManeuvers();
    renderCard();
    renderAreas();
    ui.key = '';
  }

  function drawCanvas(cs, level) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w < 40 || h < 40) return;
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    const bpm = cs.bpm > 0 ? cs.bpm : 72;
    const rhythm = cs.rhythm || 'sinus';
    const key = [state.findingId, state.maneuverId, level, Math.round(bpm * 10), rhythm, lang, w, h, dpr].join('|');
    if (key !== cache.key) {
      layer.width = Math.round(w * dpr);
      layer.height = Math.round(h * dpr);
      const lctx = layer.getContext('2d');
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const columns = phonoGeometry(w, h).n;
      const strip = sampleExamStrip({ findingId: state.findingId, maneuverId: state.maneuverId, level, bpm, rhythm, columns });
      cache = { key, g: paintPhono(lctx, { w, h, bpm, lang, pitch: finding().pitch, strip }) };
    }
    if (canvas.width !== layer.width || canvas.height !== layer.height) { canvas.width = layer.width; canvas.height = layer.height; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(layer, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const phase = Number.isFinite(cs.phase) ? ((cs.phase % 1) + 1) % 1 : 0;
    const cx = cache.g.left + phaseToTime(phase, bpm) * cache.g.beatW;   // cursor on the first beat
    Object.assign(ctx, { strokeStyle: COLORS.cursor, lineWidth: 1.3 });
    ctx.beginPath(); ctx.moveTo(cx, cache.g.top - 4); ctx.lineTo(cx, h - 3); ctx.stroke();
  }

  /** Redraw; cheap per tick (cached layer + cursor); resamples only when inputs change. */
  function draw(cycleState) {
    if (destroyed) return;
    const cs = cycleState || getCycleState() || {};
    lastCycle = cs;
    const level = quantizeLevel(currentLevel());
    updateProgress();
    updateLevelUi(level);
    drawCanvas(cs, level);
  }

  function animating() {
    return state.autoplay && state.maneuverId !== DEFAULT_MANEUVER && elapsed() <= maneuverStage(state.maneuverId, 0).total + 0.1;
  }
  function loop() {
    rafId = 0;
    if (destroyed) return;
    draw();
    if (animating()) rafId = requestAnimationFrame(loop);
  }
  function startLoop() {
    if (!rafId && typeof requestAnimationFrame === 'function') rafId = requestAnimationFrame(loop);
  }

  function applyManeuver(id, autoplay) {
    state.maneuverId = id;
    state.autoplay = Boolean(autoplay) && id !== DEFAULT_MANEUVER;
    state.startMs = now();
    renderManeuvers();
    draw();
    if (state.autoplay) startLoop();
  }

  function applyFinding(id) {
    state.findingId = id;
    state.areaId = FINDINGS[id].area;
    select.value = id;
    renderTable();
    renderCard();
    renderAreas();
    ui.key = '';
    draw();
  }

  on(select, 'change', () => {
    if (!FINDINGS[select.value]) { select.value = state.findingId; return; }
    applyFinding(select.value);
    onFindingChange?.(state.findingId);
  });
  const startFromEvent = event => {
    const id = event.target.closest('[data-maneuver]')?.dataset.maneuver;
    if (!MANEUVERS[id]) return;
    applyManeuver(id, true);
    onManeuverChange?.(id);
  };
  on(refs.maneuvers, 'click', startFromEvent);
  on(refs.table, 'click', startFromEvent);
  on(refs.areas, 'click', event => {
    const id = event.target.closest('[data-area]')?.dataset.area;
    if (!AUSCULTATION_AREAS[id]) return;
    state.areaId = id;
    renderAreas();
    onAreaFocus?.(id);
  });
  on(refs.audioBox, 'change', () => {
    const enabled = audio.setEnabled(refs.audioBox.checked);
    refs.audioBox.checked = enabled;
    refs.audioNote.hidden = !enabled;
  });
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => draw()) : null;
  observer?.observe(canvasWrap);

  const panel = {
    element,
    draw,
    setLanguage(next) { lang = normLang(next); renderAll(); draw(); },
    setFinding(id) {
      if (!FINDINGS[id]) return false;
      applyFinding(id);
      return true;
    },
    getFinding: () => state.findingId,
    setManeuver(id, { autoplay = true } = {}) {
      if (!MANEUVERS[id]) return false;
      applyManeuver(id, autoplay);
      return true;
    },
    getManeuver: () => state.maneuverId,
    setArea(areaId) {
      if (areaId != null && !AUSCULTATION_AREAS[areaId]) return false;
      state.areaId = areaId ?? null;
      renderAreas();
      return true;
    },
    setHint(text) { refs.hint.textContent = text || ''; refs.hint.hidden = !text; },
    setAudioEnabled(enabled) {
      const onNow = audio.setEnabled(Boolean(enabled));
      refs.audioBox.checked = onNow;
      refs.audioNote.hidden = !onNow;
      return onNow;
    },
    destroy() {
      destroyed = true;
      if (rafId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId);
      rafId = 0;
      ac.abort();
      observer?.disconnect();
      audio.destroy();
      root.textContent = '';
    }
  };

  state.areaId = finding().area;
  renderAll();
  draw();
  return panel;
}

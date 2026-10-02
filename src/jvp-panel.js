import { CYCLE_SYNC as S } from './cardiac-cycle.js';
import { ecgSample } from './ecg-trace.js';
import { JVP_SCENARIOS, jvpCurve, heightAboveSternalAngle } from './jvp-physiology.js';
import { JVP_TEXT, JVP_SOURCES } from './jvp-content.js';
import { buildStrip, evaluateAjr, STRIP_MODES } from './jvp-timeline.js';
import { PARAMETER_VERSION, parametersFor, toCsv } from './jvp-parameters.js';
import { drawStrip, stripRows } from './jvp-strip.js';

/*
 * Jugular venous pulse panel. Single-beat view: the schematic RA pressure
 * (fixed mmHg axis, optional normal reference on the same axis), the ECG with
 * S1/S2 and the tricuspid-open band, one cursor on the shared cardiac clock;
 * picking a wave moves the heart to its phase. Strip views (AF, AV
 * dissociation, abdominojugular test, ventilation): the panel owns a clock in
 * seconds, draws the strip at that time and poses the heart at the strip's
 * ventricular phase, so every channel reads one timeline. DOM and canvas
 * only; the models are jvp-physiology.js and jvp-timeline.js.
 */
export const JVP_AXIS_MAX = 30;       // mmHg, the same for every pattern (no auto scaling)
const WINDOW_START = 0.25;            // the strip reads a, c, x′, v, y from left to right
const SLOW_SPEED = 0.35;
const VIEWS = ['beat', ...STRIP_MODES];
const ATRIAL_RATES = [60, 75, 90];
const PEEPS = [0, 5, 10];
const COLOR = { curve: '#b83b5e', normal: '#7a8a82', grid: '#e6ece6', axis: '#8a988e', ecg: '#2f6f5e', band: 'rgba(84,160,200,0.13)', cursor: '#d4a017', label: '#3a2530' };

const judgements = new WeakMap();
/** Protocol judgement of an abdominojugular strip, computed once per strip. */
const judge = s => { if (!judgements.has(s)) judgements.set(s, evaluateAjr(s)); return judgements.get(s); };

function el(tag, cls, text, attrs = {}) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

/** Canvas x position of phase u in the strip window (0..1 of the plot width). */
export function windowFraction(u) {
  return (((u - WINDOW_START) % 1) + 1) % 1;
}

function fillSelect(select, items, key) {
  if (select.dataset.key === key) return;
  select.replaceChildren(...items.map(([value, label]) => el('option', '', label, { value })));
  select.dataset.key = key;
}

/**
 * @param {HTMLElement} mount
 * @param {{ getLang: () => 'tr'|'en', getCycleState: () => object, onSeek: (phase: number, options?: { atrialPhase?: number }) => void, onFreeze: (frozen: boolean) => void, onSlow: (slow: boolean) => void }} deps
 */
export function createJvpPanel(mount, deps) {
  let lang = deps.getLang() === 'en' ? 'en' : 'tr';
  const state = { view: 'beat', scenario: 'normal', respiration: 'exp', compare: true, labels: true, slow: false, wave: null, response: 'transient', peep: 5, atrialRate: 75, t: 0, stripPlaying: true };
  const root = el('section', 'jvp-panel');
  const heading = el('p', 'eyebrow');
  const controls = el('div', 'jvp-controls');
  const field = (key) => { const label = el('label', 'jvp-field'); const name = el('span'); const select = el('select', 'jvp-select', null, { 'data-jvp-control': key }); label.append(name, select); return { label, name, select }; };
  const viewField = field('view'), scenarioField = field('scenario'), responseField = field('response'), peepField = field('peep'), atrialField = field('atrialRate');
  const resp = el('div', 'jvp-resp', null, { role: 'group' });
  const respButtons = ['exp', 'insp'].map(id => { const b = el('button', '', null, { type: 'button', 'data-jvp-resp': id }); b.addEventListener('click', () => set({ respiration: id })); resp.append(b); return b; });
  const toggles = el('div', 'jvp-toggles');
  const check = (key) => { const label = el('label', 'jvp-check'); const box = el('input', '', null, { type: 'checkbox', 'data-jvp-control': key }); const name = el('span'); box.addEventListener('change', () => set({ [key]: box.checked })); label.append(box, name); toggles.append(label); return { label, box, name }; };
  const compareBox = check('compare'), labelsBox = check('labels'), slowBox = check('slow');
  const button = action => el('button', 'jvp-freeze', null, { type: 'button', 'data-jvp-action': action });
  const freezeBtn = button('freeze'), restartBtn = button('restart'), exportBtn = button('export');
  toggles.append(freezeBtn, restartBtn, exportBtn);
  controls.append(viewField.label, scenarioField.label, responseField.label, peepField.label, atrialField.label, resp, toggles);
  const waveRow = el('div', 'jvp-waves', null, { role: 'group' });
  const canvas = el('canvas', 'jvp-canvas', null, { role: 'img', tabindex: '0' });
  const readout = el('p', 'jvp-readout');
  const result = el('p', 'jvp-result', null, { 'aria-live': 'polite' });
  const card = el('div', 'jvp-card', null, { 'aria-live': 'polite' });
  const cardTitle = el('h4', 'jvp-card-title');
  const cardText = el('p', 'jvp-card-text');
  const scenarioText = el('p', 'jvp-scenario-text');
  const respNote = el('p', 'jvp-resp-note');
  card.append(cardTitle, cardText, scenarioText, respNote);
  const bedsideNote = el('p', 'jvp-note');
  const synthetic = el('p', 'jvp-note jvp-data-label');
  const more = el('details', 'jvp-more');
  const moreSummary = el('summary');
  const questions = el('ol', 'jvp-questions');
  const paramTitle = el('p', 'jvp-note');
  const params = el('ul', 'jvp-params');
  const sources = el('p', 'jvp-note');
  more.append(moreSummary, questions, paramTitle, params, sources);
  root.append(heading, controls, waveRow, canvas, readout, result, card, bedsideNote, synthetic, more);
  mount.append(root);

  viewField.select.addEventListener('change', () => set({ view: viewField.select.value }));
  scenarioField.select.addEventListener('change', () => set({ scenario: scenarioField.select.value }));
  responseField.select.addEventListener('change', () => set({ response: responseField.select.value }));
  peepField.select.addEventListener('change', () => set({ peep: Number(peepField.select.value) }));
  atrialField.select.addEventListener('change', () => set({ atrialRate: Number(atrialField.select.value) }));
  freezeBtn.addEventListener('click', () => {
    if (!isStrip()) { deps.onFreeze(deps.getCycleState()?.playing); return; }
    if (!state.stripPlaying && state.view === 'ajr' && state.t >= strip().duration - 0.01) state.t = 0;
    state.stripPlaying = !state.stripPlaying;
    render();
  });
  restartBtn.addEventListener('click', () => { state.t = 0; state.stripPlaying = true; render(); });
  exportBtn.addEventListener('click', exportCsv);
  canvas.addEventListener('click', event => {
    if (isStrip()) return;
    const rect = canvas.getBoundingClientRect(), g = geometry(rect.width, rect.height);
    const x = event.clientX - rect.left;
    const hit = curve().labels.map(l => ({ l, d: Math.abs(g.x(l.u) - x) })).sort((a, b) => a.d - b.d)[0];
    if (hit && hit.d < 16) selectWave(hit.l.id);
  });
  canvas.addEventListener('keydown', event => {
    if (isStrip()) return;
    const ids = curve().labels.map(l => l.id);
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || !ids.length) return;
    event.preventDefault();
    const i = ids.indexOf(state.wave);
    selectWave(ids[(i + (event.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length]);
  });

  const curve = () => jvpCurve(state.scenario, { respiration: state.respiration });
  const isStrip = () => state.view !== 'beat';
  let stripKey = '', stripValue = null;
  function strip() {
    if (!isStrip()) return null;
    const key = `${state.view}|${state.response}|${state.peep}|${state.atrialRate}`;
    if (key !== stripKey) { stripKey = key; stripValue = buildStrip(state.view, { response: state.response, peep: state.peep, atrialRate: state.atrialRate }); }
    return stripValue;
  }

  function set(patch) {
    const wasStrip = isStrip();
    Object.assign(state, patch);
    if ('slow' in patch) deps.onSlow(state.slow);
    if ('scenario' in patch && state.wave && !curve().labels.some(l => l.id === state.wave)) state.wave = null;
    if (['view', 'response', 'peep', 'atrialRate'].some(k => k in patch)) { state.t = 0; state.stripPlaying = true; }
    if ('view' in patch && patch.view !== 'beat') state.wave = null;
    if (wasStrip && !isStrip()) release();         // back to the shared beating clock
    render();
  }

  function selectWave(id) {
    const label = curve().labels.find(l => l.id === id);
    if (!label) return;
    state.wave = id;
    deps.onFreeze(true);
    deps.onSeek(label.u);
    render();
  }

  // Strip clock: one requestAnimationFrame loop while a strip view is open.
  // While the panel is visible it drives the heart pose (the heart's own clock
  // is paused); hidden, it waits without touching the heart.
  let raf = 0, last = 0, driving = false;
  const visible = () => root.isConnected && !root.closest('[hidden]');
  function loop(now) {
    // raf keeps the fired id until the next frame is booked, so draw() cannot start a second loop.
    const s = strip();
    if (!s) { raf = 0; return; }
    if (!visible()) { last = 0; raf = requestAnimationFrame(loop); return; }
    if (!driving) { driving = true; deps.onFreeze(true); }
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (state.stripPlaying) {
      state.t += dt * (state.slow ? SLOW_SPEED : 1);
      if (state.t >= s.duration) {
        // The maneuver runs once and holds its judgement; rhythm and ventilator strips loop.
        if (s.id === 'ajr') { state.t = s.duration - 0.001; state.stripPlaying = false; } else state.t %= s.duration;
      }
    }
    deps.onSeek(s.phaseAt(state.t), s.atrialPhaseAt ? { atrialPhase: s.atrialPhaseAt(state.t) } : undefined);
    draw();
    live();
    raf = requestAnimationFrame(loop);
  }
  function ensureLoop() {
    if (raf || !isStrip() || typeof requestAnimationFrame !== 'function') return;
    last = 0;
    raf = requestAnimationFrame(loop);
  }
  /** Stop the strip clock and give the heart back its own beating clock. */
  function release() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (driving) { driving = false; deps.onFreeze(false); }
  }

  // Per-frame text of a strip view: the readout and the maneuver judgement.
  function live() {
    const s = strip();
    if (!s) return;
    const t = JVP_TEXT[lang].strip;
    let text = '', judged = '', positive = '';
    if (s.id === 'af') text = t.af.readout(s, s.clock.locate(state.t).rr);
    if (s.id === 'avd') text = t.avd.readout(s);
    if (s.id === 'ppv') text = t.ppv.readout(s, s.breathAt(state.t));
    if (s.id === 'ajr') {
      const stage = s.stageAt(state.t);
      text = stage === 'compression' ? `${t.ajr.stages.compression}: ${(state.t - s.protocol.baseline).toFixed(1)}/${s.protocol.compression} s` : t.ajr.stages[stage];
      if (stage === 'done') {
        const r = judge(s);
        judged = `${r.positive ? t.ajr.positive : t.ajr.negative}${r.transientOnly ? ` ${t.ajr.transientOnly}` : ''} (${t.ajr.numbers(r)})`;
        positive = String(r.positive);
      } else judged = t.ajr.waiting;
    }
    if (readout.textContent !== text) readout.textContent = text;
    if (result.textContent !== judged) result.textContent = judged;
    result.hidden = !judged;
    result.dataset.positive = positive;
    const label = state.stripPlaying ? JVP_TEXT[lang].freeze : JVP_TEXT[lang].play;
    if (freezeBtn.textContent !== label) freezeBtn.textContent = label;
  }

  function render() {
    const t = JVP_TEXT[lang], strips = isStrip();
    heading.textContent = t.heading;
    const select = (f, name, items, key, value) => { f.name.textContent = name; fillSelect(f.select, items, key); f.select.value = String(value); };
    select(viewField, t.view, VIEWS.map(id => [id, t.views[id]]), `views|${lang}`, state.view);
    select(scenarioField, t.scenario, JVP_SCENARIOS.map(id => [id, t.scenarios[id].title]), `scenarios|${lang}`, state.scenario);
    select(responseField, t.strip.ajr.response, Object.entries(t.strip.ajr.responses), `responses|${lang}`, state.response);
    select(peepField, t.strip.ppv.peep, PEEPS.map(v => [String(v), `${v} cmH2O`]), 'peep', state.peep);
    select(atrialField, t.strip.avd.atrialRate, ATRIAL_RATES.map(v => [String(v), `${v}/${lang === 'tr' ? 'dk' : 'min'}`]), `atrial|${lang}`, state.atrialRate);
    scenarioField.label.hidden = strips;
    responseField.label.hidden = state.view !== 'ajr';
    peepField.label.hidden = state.view !== 'ppv';
    atrialField.label.hidden = state.view !== 'avd';
    resp.hidden = strips;
    compareBox.label.hidden = strips;
    labelsBox.label.hidden = strips && state.view !== 'avd';
    restartBtn.hidden = !strips;
    resp.setAttribute('aria-label', t.respiration);
    respButtons.forEach(b => { b.textContent = t[b.dataset.jvpResp]; b.setAttribute('aria-pressed', String(b.dataset.jvpResp === state.respiration)); });
    compareBox.box.checked = state.compare; compareBox.name.textContent = t.compare;
    labelsBox.box.checked = state.labels; labelsBox.name.textContent = t.labels;
    slowBox.box.checked = state.slow; slowBox.name.textContent = t.slow;
    restartBtn.textContent = t.restart;
    exportBtn.textContent = t.exportCsv;
    synthetic.textContent = t.synthetic;
    moreSummary.textContent = t.questions;
    questions.replaceChildren(...t.questions_list.map(q => el('li', '', q)));
    paramTitle.textContent = `${t.paramTitle} (${PARAMETER_VERSION})`;
    params.replaceChildren(...scopes().flatMap(parametersFor).map(p => el('li', '', `${p.id}: ${p.value} ${p.unit} · ${t.paramStatus[p.status]}`)));
    sources.textContent = JVP_SOURCES.join(' · ');
    if (strips) renderStrip(t); else renderBeat(t);
    draw(deps.getCycleState());
  }

  function renderBeat(t) {
    const c = curve();
    waveRow.hidden = false;
    waveRow.replaceChildren(...c.labels.map(l => {
      const b = el('button', '', t.waves[l.id].name, { type: 'button', 'data-jvp-wave': l.id });
      b.setAttribute('aria-pressed', String(l.id === state.wave));
      b.addEventListener('click', () => selectWave(l.id));
      return b;
    }));
    const height = heightAboveSternalAngle(c.mean);
    readout.textContent = `${t.mean}: ${c.mean.toFixed(0)} mmHg · ${t.bedside}: ${height > 0 ? `≈ ${height.toFixed(0)} cm ${t.sternal}` : t.belowSternal}`;
    result.hidden = true; result.textContent = '';
    const wave = state.wave && t.waves[state.wave];
    cardTitle.textContent = wave ? `${t.waveCard}: ${wave.name}` : t.scenarios[state.scenario].title;
    cardText.textContent = wave ? wave.text : t.pickWave;
    scenarioText.textContent = t.scenarios[state.scenario].text;
    respNote.textContent = state.respiration === 'insp'
      ? (c.kussmaul ? t.kussmaulNote : state.scenario === 'tamponade' ? `${t.respNormalNote} ${t.tamponadeRespNote}` : t.respNormalNote)
      : '';
    respNote.hidden = !respNote.textContent;
    bedsideNote.hidden = false;
    bedsideNote.textContent = t.bedsideNote;
    canvas.setAttribute('aria-label', `${t.axis}: ${t.scenarios[state.scenario].title}`);
  }

  function renderStrip(t) {
    waveRow.hidden = true;
    waveRow.replaceChildren();
    cardTitle.textContent = t.views[state.view];
    cardText.textContent = t.strip[state.view].text;
    scenarioText.textContent = t.strip.heartNote;
    respNote.hidden = true; respNote.textContent = '';     // spontaneous breathing notes do not carry over
    bedsideNote.hidden = true;
    canvas.setAttribute('aria-label', `${t.axis}: ${t.views[state.view]}`);
    live();
    ensureLoop();
  }

  function scopes() {
    if (isStrip()) return strip().scopes;
    return [state.scenario, 'units', ...(state.respiration === 'insp' ? ['spontaneous'] : [])];
  }

  /** The current view as CSV rows with the data-quality label and parameter record in the header. */
  function csvData() {
    const t = JVP_TEXT[lang], s = strip();
    if (s) return { title: t.views[state.view], columns: ['t_s', 'ra_mmHg', 'ecg_au', ...(s.extra ? [`${s.extra.id}_${s.extra.unit}`] : [])], rows: stripRows(s), scopes: s.scopes };
    const normal = jvpCurve('normal', { respiration: state.respiration }), c = curve();
    const rows = Array.from({ length: 201 }, (_, i) => [i / 200, c.pressure(i / 200), normal.pressure(i / 200)]);
    return { title: `${t.scenarios[state.scenario].title} (${state.respiration})`, columns: ['phase_u', 'ra_mmHg', 'normal_ra_mmHg'], rows, scopes: scopes() };
  }

  function exportCsv() {
    const url = URL.createObjectURL(new Blob([toCsv(csvData())], { type: 'text/csv' }));
    const a = el('a', '', null, { href: url, download: `cardia-jvp-${isStrip() ? state.view : state.scenario}.csv` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function geometry(width, height) {
    const left = 34, right = width - 8, top = 16, plotBottom = Math.round(height * 0.66), ecgTop = plotBottom + 18, bottom = height - 14;
    return {
      left, right, top, plotBottom, ecgTop, bottom,
      x: u => left + windowFraction(u) * (right - left),
      y: p => plotBottom - (Math.max(-2, Math.min(JVP_AXIS_MAX, p)) / JVP_AXIS_MAX) * (plotBottom - top)
    };
  }

  function prepare() {
    const ctx = canvas.getContext?.('2d');
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!ctx || width < 2 || height < 2) return null;
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) { canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    return { ctx, width, height };
  }


  function drawStripView() {
    ensureLoop();
    const s = strip(), box = prepare();
    if (!box) return;
    const t = JVP_TEXT[lang], mode = t.strip[state.view];
    drawStrip(box.ctx, { width: box.width, height: box.height, axisMax: JVP_AXIS_MAX }, s, {
      t: state.t, labels: state.labels, baseline: s.id === 'ajr' ? judge(s).baselineMmHg : null,
      text: { tvOpen: t.tvOpen, ecg: t.ecg, seconds: t.seconds, band: mode.band, extra: mode.extra, threshold: mode.threshold, cannon: t.strip.avd.cannon }
    });
  }

  function draw(cycleState) {
    if (isStrip()) { drawStripView(); return; }
    const playing = Boolean(cycleState?.playing);
    freezeBtn.textContent = playing ? JVP_TEXT[lang].freeze : JVP_TEXT[lang].play;
    const box = prepare();
    if (!box) return;
    const { ctx, width, height } = box;
    const g = geometry(width, height), t = JVP_TEXT[lang], c = curve();
    const span = (from, to) => { const a = g.x(from), b = g.x(to); return b >= a ? [[a, b]] : [[a, g.right], [g.left, b]]; };
    // Tricuspid open band over both strips.
    ctx.fillStyle = COLOR.band;
    for (const [a, b] of span(0, S.avClosed)) ctx.fillRect(a, g.top, b - a, g.bottom - g.top);
    ctx.font = '9px system-ui, sans-serif'; ctx.fillStyle = '#4f86a3';
    ctx.fillText(t.tvOpen, g.x(0) + 3, g.top + 9);
    // Pressure grid and axis (fixed 0..30 mmHg).
    ctx.strokeStyle = COLOR.grid; ctx.fillStyle = COLOR.axis; ctx.lineWidth = 1; ctx.textAlign = 'right';
    for (let p = 0; p <= JVP_AXIS_MAX; p += 10) { const y = g.y(p); ctx.beginPath(); ctx.moveTo(g.left, y); ctx.lineTo(g.right, y); ctx.stroke(); ctx.fillText(String(p), g.left - 4, y + 3); }
    ctx.textAlign = 'left';
    ctx.fillText('mmHg', 2, g.top - 4);
    const trace = (fn, color, dash, widthPx) => {
      ctx.strokeStyle = color; ctx.lineWidth = widthPx; ctx.setLineDash(dash); ctx.beginPath();
      for (let i = 0; i <= 240; i++) { const u = WINDOW_START + i / 240; const x = g.left + (i / 240) * (g.right - g.left), y = g.y(fn(u)); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]);
    };
    if (state.compare && state.scenario !== 'normal') trace(jvpCurve('normal', { respiration: state.respiration }).pressure, COLOR.normal, [5, 4], 1.4);
    trace(c.pressure, COLOR.curve, [], 2.2);
    if (state.labels) {
      ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'center';
      for (const l of c.labels) {
        const x = g.x(l.u), y = g.y(l.p), trough = ['x', 'xp', 'y'].includes(l.id);
        ctx.fillStyle = l.id === state.wave ? COLOR.cursor : COLOR.label;
        ctx.fillText(l.id === 'xp' ? 'x′' : l.id, x, trough ? y + 13 : y - 6);
      }
      ctx.textAlign = 'left';
    }
    // ECG and heart sounds on their own axis.
    const mid = (g.ecgTop + g.bottom) / 2, amp = (g.bottom - g.ecgTop) * 0.45;
    ctx.strokeStyle = COLOR.ecg; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let i = 0; i <= 240; i++) { const u = WINDOW_START + i / 240; const x = g.left + (i / 240) * (g.right - g.left), y = mid - ecgSample(u, 'sinus') * amp; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke();
    ctx.font = '9px system-ui, sans-serif'; ctx.fillStyle = COLOR.axis;
    ctx.fillText(t.ecg, g.left + 2, g.ecgTop - 4);
    for (const [u, name] of [[S.ivcStart, 'S1'], [S.ivrStart, 'S2']]) { ctx.fillStyle = '#5f6f64'; ctx.fillText(name, g.x(u) - 6, g.bottom + 10); }
    // Shared cursor.
    const phase = cycleState?.phase;
    if (Number.isFinite(phase)) { const x = g.x(phase); ctx.strokeStyle = COLOR.cursor; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, g.top); ctx.lineTo(x, g.bottom); ctx.stroke(); }
  }

  render();
  return {
    element: root,
    draw,
    getState: () => ({ ...state }),
    /** The current strip (null in the single-beat view). */
    getStrip: () => strip(),
    /** Move the strip clock to t seconds and hold it there (lesson steps and tests). */
    seekStrip(t) {
      const s = strip();
      if (!s) return;
      state.t = Math.max(0, Math.min(s.duration - 0.001, t));
      state.stripPlaying = false;
      deps.onSeek(s.phaseAt(state.t), s.atrialPhaseAt ? { atrialPhase: s.atrialPhaseAt(state.t) } : undefined);
      render();
    },
    /** CSV text of the current view (the same content the download button saves). */
    getCsv: () => toCsv(csvData()),
    /** Lesson step: { view, scenario, respiration, wave, compare, response, peep, atrialRate }; no view means the single beat. */
    apply(step = {}) {
      const patch = { view: step.view || 'beat', wave: null };
      for (const key of ['scenario', 'respiration', 'compare', 'response', 'peep', 'atrialRate']) if (step[key] !== undefined) patch[key] = step[key];
      set(patch);
      if (step.wave && !isStrip()) selectWave(step.wave);
    },
    setLanguage(next) { lang = next === 'en' ? 'en' : 'tr'; render(); },
    /** Panel hidden (other sub-tab): stop the strip clock and give the heart back its own clock. */
    pause: release,
    reset() {
      release();
      if (state.slow) { state.slow = false; deps.onSlow(false); render(); }
    }
  };
}

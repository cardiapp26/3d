import { DEFAULT_RECORDING_STATE, simulateRecording } from './recording-model.js';
import { RECORDING_TEXT } from './recording-text.js';
import { LESSONS, METRICS, lessonById, computeMetrics, omniAngle } from './recording-lessons.js';
import { prepare, drawPipeline, drawAmplifier, drawTissue, drawSignals, drawExtra } from './recording-draw.js';

// Control specs: [min, max, step] for ranges, value lists for selects.
const SPECS = {
  angle: [0, 180, 1], spacing: [1, 10, 0.5], contact: [0, 1, 0.05], virtualAngle: [0, 180, 1],
  mains: [0, 0.5, 0.01], mismatch: [0, 1, 0.05],
  hp: [0.5, 1, 2, 4, 8, 16, 30, 70, 100], lp: [120, 240, 500, 1000], notch: [0, 50, 60],
  sampleRate: [250, 500, 1000, 2000, 4000], bits: [8, 12, 16], gain: [1, 2, 4, 8, 16], antiAlias: [true, false]
};
const RANGE_KEYS = ['angle', 'spacing', 'contact', 'virtualAngle', 'mains', 'mismatch'];
const VIEW_DEFAULTS = { display: 4, zoom: 1, cursor: 250, playing: false, caliperOn: false, marks: [] };
// Physical noise measures (Haq Table 1) mapped onto the model's noise inputs.
const CHECKLIST_EFFECTS = {
  stim: (s) => ({ mismatch: 0 }),
  interconnect: (s) => ({ mismatch: Math.round(s.mismatch * 10) / 20 }),
  cable: (s) => ({ mains: Math.round(s.mains * 50) / 100 }),
  ground: (s) => ({ mains: Math.round(s.mains * 40) / 100 }),
  unused: (s) => ({ mains: Math.round(s.mains * 70) / 100 }),
  surface: () => ({})
};
const pad = (n) => String(n).padStart(2, '0');

function formatMetric(key, value) {
  const def = METRICS[key];
  if (typeof value === 'string') return value;
  if (!Number.isFinite(value)) return `∅${def.unit ? ` ${def.unit}` : ''}`;
  return `${value.toFixed(def.digits ?? 2)}${def.unit ? ` ${def.unit}` : ''}`;
}

export function createRecordingPanel(doc, { getLang = () => 'tr' } = {}) {
  const t = () => RECORDING_TEXT[getLang() === 'en' ? 'en' : 'tr'];
  const lt = () => t().lessons[state.mode];
  const state = { ...DEFAULT_RECORDING_STATE, ...LESSONS[0].base, ...VIEW_DEFAULTS, mode: LESSONS[0].id };
  const progress = Object.fromEntries(LESSONS.map((l) => [l.id, new Set()]));
  const observed = Object.fromEntries(LESSONS.map((l) => [l.id, new Set()]));
  const answers = {};
  let checklist = new Set();
  let result = null, metrics = {}, active = false, frame = null, lastFrame = 0, dirty = true;
  const plot = {};
  const bindings = [];

  const node = (tag, cls = '', attrs = {}) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    for (const [key, value] of Object.entries(attrs)) n.setAttribute(key, String(value));
    return n;
  };
  const text = (n, fn) => { bindings.push([n, fn]); return n; };
  const button = (fn, action, attrs = {}, cls = '') => {
    const b = text(node('button', cls, { type: 'button', ...attrs }), fn);
    b.addEventListener('click', action);
    return b;
  };
  const lesson = () => lessonById(state.mode);

  /* ----- Header and lesson navigation ----- */
  const root = node('section', 'recording-lab', { 'data-recording': '' });
  root.hidden = true;
  const header = node('header', 'recording-header');
  const titleBox = node('div');
  titleBox.append(text(node('p', 'recording-eyebrow'), () => t().eyebrow), text(node('h2'), () => t().title), text(node('p', 'recording-intro'), () => t().intro));
  const links = node('nav', 'recording-links');
  for (const id of ['basics', 'mapping', 'substrate']) links.appendChild(text(node('a', '', { href: `#/${id}` }), () => t()[id]));
  header.append(titleBox, links);
  const lessonNav = node('nav', 'recording-modes');
  const lessonButtons = LESSONS.map((l, i) => {
    const b = node('button', '', { type: 'button', 'data-recording-mode': l.id });
    const num = node('span', 'recording-mode-num'); num.textContent = pad(i + 1);
    const name = text(node('span', 'recording-mode-name'), () => t().lessons[l.id].title);
    const badge = node('span', 'recording-mode-badge');
    b.append(num, name, badge);
    b.addEventListener('click', () => setLesson(l.id));
    lessonNav.appendChild(b);
    return { b, badge, lesson: l };
  });

  /* ----- Main column ----- */
  const grid = node('div', 'recording-grid');
  const main = node('div', 'recording-visual');
  const head = node('article', 'recording-lesson-head');
  const kicker = node('p', 'recording-kicker');
  const lessonTitle = node('h3', 'recording-lesson-title');
  const concept = node('p', 'recording-concept');
  const points = node('details', 'recording-points'); points.open = true;
  const pointsSummary = text(node('summary'), () => t().keyPoints);
  const pointsList = node('ul');
  points.append(pointsSummary, pointsList);
  head.append(kicker, lessonTitle, concept, points);

  const stage = node('div', 'recording-stage');
  const stageBar = node('div', 'recording-stagebar');
  const scenarioLabel = node('label', 'recording-field recording-scenario');
  const scenario = node('select', '', { 'data-recording-control': 'scenario' });
  scenario.addEventListener('change', () => { state.scenario = scenario.value; changed(); });
  scenarioLabel.append(text(node('span'), () => t().scenario), scenario);
  const play = button(() => state.playing ? t().freeze : t().play, () => { state.playing = !state.playing; render(); }, { 'data-recording-play': '' }, 'recording-play');
  stageBar.append(scenarioLabel, play);
  const diagram = node('canvas', 'recording-geometry', { role: 'img', 'data-recording-tissue': '' });
  stage.append(stageBar, diagram);

  const signalTitle = text(node('h4'), () => t().signal);
  const toolbar = node('div', 'recording-toolbar');
  const caliper = button(() => t().caliper, () => { state.caliperOn = !state.caliperOn; render(); }, { 'data-recording-caliper': '' });
  const mark = button(() => t().mark, () => addMark(state.cursor), { 'data-recording-mark': '' });
  toolbar.append(caliper, mark, button(() => t().clear, () => { state.marks = []; render(); }));
  const viewSelect = (key, values) => {
    const label = node('label');
    label.appendChild(text(node('span'), () => t().labels[key]));
    const select = node('select', '', { 'data-recording-control': key });
    for (const value of values) { const o = node('option', '', { value }); o.textContent = String(value); select.appendChild(o); }
    select.addEventListener('change', () => { state[key] = Number(select.value); render(); });
    label.appendChild(select); toolbar.appendChild(label);
    return select;
  };
  const display = viewSelect('display', [0.5, 1, 2, 4, 8]);
  const zoom = viewSelect('zoom', [1, 2, 4]);
  const signal = node('canvas', 'recording-signal', { role: 'img', 'data-recording-signal': '' });
  signal.addEventListener('click', (event) => {
    if (!plot.right) return;
    const x = event.clientX - signal.getBoundingClientRect().left;
    if (x < plot.left || x > plot.right) return;
    state.cursor = Math.round(plot.from + (x - plot.left) / (plot.right - plot.left) * (plot.to - plot.from));
    state.playing = false;
    if (state.caliperOn) addMark(state.cursor); else render();
  });
  const timeLabel = node('label', 'recording-time');
  const time = node('input', '', { type: 'range', min: 0, max: 600, step: 1, 'data-recording-control': 'time' });
  const timeReadout = node('output');
  time.addEventListener('input', () => { state.cursor = Number(time.value); state.playing = false; render(); });
  timeLabel.append(text(node('span'), () => t().labels.time), time, timeReadout);
  const caliperReadout = node('p', 'recording-caliper-readout', { 'data-recording-caliper-value': '', 'aria-live': 'polite' });
  const caliperHelp = text(node('p', 'recording-note'), () => t().caliperHelp);
  const extraTitle = node('h4');
  const extra = node('canvas', 'recording-extra', { role: 'img', 'data-recording-extra': '' });
  main.append(head, stage, signalTitle, toolbar, signal, timeLabel, caliperReadout, caliperHelp, extraTitle, extra);

  /* ----- Console: steps, controls, live reading, checklist, quiz ----- */
  const aside = node('aside', 'recording-console');
  const card = (cls, titleFn) => {
    const box = node('section', `recording-card ${cls}`);
    if (titleFn) box.appendChild(text(node('h3'), titleFn));
    return box;
  };
  const stepsCard = card('recording-steps', () => t().stepsTitle);
  const stepsHint = text(node('p', 'recording-note'), () => t().stepsHint);
  const stepsProgress = node('p', 'recording-progress', { 'data-recording-progress': '' });
  const stepsList = node('ol');
  stepsCard.append(stepsHint, stepsList, stepsProgress);

  const controlsCard = card('recording-settings', () => t().controlsTitle);
  const controls = node('div', 'recording-controls');
  const controlNodes = {};
  for (const [key, values] of Object.entries(SPECS)) {
    const label = node('label', 'recording-field');
    const caption = text(node('span'), () => t().labels[key]);
    const range = RANGE_KEYS.includes(key);
    const input = node(range ? 'input' : 'select', '', { 'data-recording-control': key });
    if (range) {
      for (const [name, value] of [['type', 'range'], ['min', values[0]], ['max', values[1]], ['step', values[2]]]) input.setAttribute(name, String(value));
    } else {
      for (const value of values) {
        input.appendChild(text(node('option', '', { value: String(value) }), () => typeof value === 'boolean' ? (value ? t().on : t().off) : value === 0 ? t().off : String(value)));
      }
    }
    const output = node('output');
    input.addEventListener(range ? 'input' : 'change', () => {
      state[key] = key === 'antiAlias' ? input.value === 'true' : Number(input.value);
      changed();
    });
    label.append(caption, input, output); controls.appendChild(label);
    controlNodes[key] = { label, input, output };
  }
  controlsCard.appendChild(controls);

  const liveCard = card('recording-live', () => t().liveTitle);
  const live = node('p', 'recording-live-text', { 'data-recording-live': '', 'aria-live': 'polite' });
  const metricsList = node('dl', 'recording-metrics', { 'data-recording-metrics': '' });
  const warnings = node('ul', 'recording-warnings', { 'data-recording-warnings': '' });
  liveCard.append(live, metricsList, warnings);

  const checklistCard = card('recording-checklist', () => t().checklistTitle);
  const checklistHint = text(node('p', 'recording-note'), () => t().checklistHint);
  const checklistList = node('ul');
  checklistCard.append(checklistHint, checklistList);

  const quizCard = card('recording-quiz', () => t().quizTitle);
  const quizBody = node('div');
  quizCard.appendChild(quizBody);

  const pearlCard = card('recording-pearl', () => t().pearl);
  const pearl = node('p');
  pearlCard.appendChild(pearl);

  const lessonFooter = node('nav', 'recording-lesson-nav');
  const prev = button(() => t().prev, () => step(-1), { 'data-recording-prev': '' });
  const restart = button(() => t().restart, () => restartLesson(), { 'data-recording-reset': '' });
  const next = button(() => t().next, () => step(1), { 'data-recording-next': '' }, 'recording-next');
  lessonFooter.append(prev, restart, next);

  aside.append(stepsCard, controlsCard, liveCard, checklistCard, quizCard, pearlCard, lessonFooter);
  grid.append(main, aside);
  const footer = node('footer', 'recording-footer');
  footer.append(text(node('p'), () => t().disclaimer), text(node('a', '', { href: 'https://doi.org/10.1016/j.ipej.2026.09.004', target: '_blank', rel: 'noopener noreferrer' }), () => t().source));
  root.append(header, lessonNav, grid, footer);

  /* ----- State transitions ----- */
  function baseline(id) {
    return { ...DEFAULT_RECORDING_STATE, ...lessonById(id).base, ...VIEW_DEFAULTS, marks: [], mode: id };
  }
  function setLesson(id) {
    if (state.mode === id) return;
    Object.assign(state, baseline(id));
    checklist = new Set();
    changed();
    root.scrollTo?.({ top: 0, behavior: 'smooth' });
  }
  function step(delta) {
    const i = LESSONS.findIndex((l) => l.id === state.mode) + delta;
    if (i >= 0 && i < LESSONS.length) setLesson(LESSONS[i].id);
  }
  function restartLesson() {
    Object.assign(state, baseline(state.mode));
    progress[state.mode].clear(); observed[state.mode].clear(); checklist = new Set();
    for (const key of Object.keys(answers)) if (key.startsWith(`${state.mode}:`)) delete answers[key];
    changed();
  }
  function applyStep(index) {
    const item = lesson().steps[index];
    for (const [key, value] of Object.entries(item.apply)) {
      state[key] = key === 'virtualAngle' && value === 'omni' && result ? omniAngle(result) : value;
    }
    if (item.observe) observed[state.mode].add(index);
    changed();
  }
  function applyChecklist(id) {
    Object.assign(state, CHECKLIST_EFFECTS[id](state));
    checklist.add(id);
    changed();
  }
  function changed() { dirty = true; state.marks = []; render(); }
  function addMark(ms) {
    if (!state.caliperOn) return;
    if (state.marks.length === 2) state.marks = [];
    state.marks.push(Math.round(ms));
    state.playing = false;
    render();
  }
  function evaluateSteps() {
    const done = progress[state.mode];
    lesson().steps.forEach((item, i) => {
      if (done.has(i)) return;
      if (item.observe ? observed[state.mode].has(i) : item.done(state, metrics, done)) done.add(i);
    });
  }

  /* ----- Text and DOM refresh ----- */
  function refreshLessonText() {
    const l = lesson(), copy = lt(), index = LESSONS.indexOf(l);
    kicker.textContent = `${t().lesson} ${index + 1}${t().of}${LESSONS.length} · ${t().ref}: ${copy.ref}`;
    lessonTitle.textContent = copy.title;
    concept.textContent = copy.concept;
    pointsList.replaceChildren(...copy.points.map((p) => { const li = node('li'); li.textContent = p; return li; }));
    pearl.textContent = copy.pearl;
    scenario.replaceChildren(...l.scenarios.map((id) => { const o = node('option', '', { value: id }); o.textContent = t().scenarios[id]; return o; }));
    scenario.value = state.scenario;
    scenarioLabel.hidden = l.scenarios.length < 2;
    extraTitle.textContent = l.extra ? t().extra[l.extra] : '';
    extra.hidden = extraTitle.hidden = !l.extra;
    checklistCard.hidden = !l.checklist;
    prev.disabled = index === 0; next.disabled = index === LESSONS.length - 1;
  }
  function refreshSteps() {
    const l = lesson(), copy = lt(), done = progress[state.mode];
    const firstOpen = l.steps.findIndex((_, i) => !done.has(i));
    stepsList.replaceChildren(...l.steps.map((item, i) => {
      const li = node('li', done.has(i) ? 'is-done' : i === firstOpen ? 'is-current' : '', { 'data-recording-step': i, 'data-done': done.has(i) });
      const row = node('div', 'recording-step-row');
      const mark = node('span', 'recording-step-mark', { 'aria-hidden': 'true' }); mark.textContent = done.has(i) ? '✓' : String(i + 1);
      const what = node('p', 'recording-step-do'); what.textContent = copy.steps[i].do;
      const go = node('button', 'recording-step-apply', { type: 'button', 'data-recording-step-apply': i });
      go.textContent = t().apply;
      go.addEventListener('click', () => applyStep(i));
      row.append(mark, what, go);
      li.appendChild(row);
      if (done.has(i)) {
        const see = node('p', 'recording-step-see');
        const strong = node('strong'); strong.textContent = `${t().observed}: `;
        see.append(strong, copy.steps[i].see);
        li.appendChild(see);
      }
      return li;
    }));
    stepsProgress.textContent = `${done.size}/${l.steps.length} ${t().progress}`;
    lessonButtons.forEach(({ b, badge, lesson: item }) => {
      const count = progress[item.id].size, total = item.steps.length;
      b.setAttribute('aria-pressed', String(item.id === state.mode));
      b.classList.toggle('is-complete', count === total);
      badge.textContent = count === total ? '✓' : count ? `${count}/${total}` : '';
    });
  }
  function refreshControls() {
    const l = lesson();
    for (const [key, { label, input, output }] of Object.entries(controlNodes)) {
      label.hidden = !l.controls.includes(key);
      input.value = String(state[key]);
      output.textContent = RANGE_KEYS.includes(key) ? String(state[key]) : '';
    }
    display.value = String(state.display); zoom.value = String(state.zoom);
    play.setAttribute('aria-pressed', String(state.playing));
    caliper.setAttribute('aria-pressed', String(state.caliperOn));
    mark.disabled = !state.caliperOn;
    caliperHelp.hidden = !state.caliperOn;
  }
  function refreshLive() {
    if (!result) return;
    const l = lesson();
    live.textContent = lt().live(state, metrics);
    metricsList.replaceChildren(...l.metrics.flatMap((key) => {
      const dt = node('dt'); dt.textContent = t().metrics[key];
      const dd = node('dd', '', { 'data-recording-metric': key }); dd.textContent = formatMetric(key, metrics[key]);
      return [dt, dd];
    }));
    warnings.replaceChildren(...result.warnings.filter((id) => l.warnings.includes(id)).map((id) => {
      const li = node('li', '', { 'data-recording-warning': id }); li.textContent = t().warnings[id] || id; return li;
    }));
    warnings.hidden = !warnings.children.length;
  }
  function refreshChecklist() {
    if (!lesson().checklist) return;
    checklistList.replaceChildren(...t().checklist.map((item) => {
      const li = node('li', checklist.has(item.id) ? 'is-done' : '');
      const title = node('p', 'recording-check-title'); title.textContent = item.title;
      const why = node('p', 'recording-note'); why.textContent = item.why;
      const go = node('button', '', { type: 'button', 'data-recording-check': item.id });
      go.textContent = checklist.has(item.id) ? `${t().applied} ✓` : t().apply;
      go.disabled = checklist.has(item.id);
      go.addEventListener('click', () => applyChecklist(item.id));
      li.append(title, why, go);
      return li;
    }));
  }
  function refreshQuiz() {
    quizBody.replaceChildren(...lt().quiz.map((question, qi) => {
      const key = `${state.mode}:${qi}`, chosen = answers[key];
      const box = node('div', 'recording-question');
      const q = node('p', 'recording-question-text'); q.textContent = `${qi + 1}. ${question.q}`;
      const options = node('div', 'recording-answers');
      question.options.forEach((option, oi) => {
        const b = node('button', chosen === undefined ? '' : oi === question.answer ? 'is-right' : oi === chosen ? 'is-wrong' : '', { type: 'button', 'data-recording-answer': oi, 'data-question': qi, 'aria-pressed': String(chosen === oi) });
        b.textContent = option;
        b.addEventListener('click', () => { answers[key] = oi; refreshQuiz(); });
        options.appendChild(b);
      });
      const feedback = node('p', 'recording-feedback', { 'aria-live': 'polite', 'data-recording-feedback': qi });
      feedback.textContent = chosen === undefined ? '' : `${chosen === question.answer ? t().correct : t().wrong} ${question.why}`;
      box.append(q, options, feedback);
      return box;
    }));
  }
  function refreshText() {
    for (const [n, fn] of bindings) n.textContent = fn();
    lessonNav.setAttribute('aria-label', t().title);
    refreshLessonText(); refreshControls(); refreshSteps(); refreshLive(); refreshChecklist(); refreshQuiz();
    diagram.setAttribute('aria-label', `${t().tissue}: ${t().scenarios[state.scenario]}`);
    signal.setAttribute('aria-label', `${t().signal}. ${lesson().traces.map((k) => t().traces[k]).join(', ')}. mV, ms.`);
    extra.setAttribute('aria-label', extraTitle.textContent);
  }

  /* ----- Drawing ----- */
  function draw() {
    if (!active || !result) return;
    time.value = String(Math.round(state.cursor)); timeReadout.textContent = `${Math.round(state.cursor)} ms`;
    caliperReadout.textContent = state.marks.length === 2 ? `Δt = ${Math.abs(state.marks[1] - state.marks[0])} ms` : state.marks.length ? `t₁ = ${state.marks[0]} ms` : '';
    const l = lesson(), copy = t();
    const d = prepare(diagram);
    if (d) {
      if (l.diagram === 'pipeline') drawPipeline(d, state, result, copy);
      else if (l.diagram === 'amplifier') drawAmplifier(d, state, result, copy);
      else drawTissue(d, state, result, l, copy);
    }
    const s = prepare(signal);
    if (s) drawSignals(s, state, result, l, copy, plot);
    if (l.extra && !extra.hidden) { const e = prepare(extra); if (e) drawExtra(l.extra, e, state, result, copy); }
  }
  function tick(timestamp) {
    frame = null;
    if (!active || !state.playing) return;
    if (lastFrame) state.cursor = (state.cursor + Math.min(timestamp - lastFrame, 100) * 0.12) % 600;
    lastFrame = timestamp;
    draw();
    frame = globalThis.requestAnimationFrame?.(tick) ?? null;
  }
  function render() {
    if (active && (dirty || !result)) {
      result = simulateRecording(state);
      metrics = computeMetrics(result, state);
      dirty = false;
    }
    if (result) evaluateSteps();
    refreshText();
    if (!active) return;
    draw();
    if (state.playing && frame === null) { lastFrame = 0; frame = globalThis.requestAnimationFrame?.(tick) ?? null; }
    else if (!state.playing && frame !== null) { globalThis.cancelAnimationFrame?.(frame); frame = null; }
  }

  // Same contract as the other standalone EPS panels; state survives tab and language changes.
  return {
    element: root, render, draw,
    setActive(next) {
      active = Boolean(next); root.hidden = !active;
      if (active) render();
      else { if (frame !== null) globalThis.cancelAnimationFrame?.(frame); frame = null; lastFrame = 0; }
    },
    getState: () => ({ ...state, marks: [...state.marks], progress: [...progress[state.mode]], checklist: [...checklist] }),
    getResult: () => result,
    getMetrics: () => ({ ...metrics })
  };
}

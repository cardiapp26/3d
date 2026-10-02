/*
 * Live EP recording system: a continuously sweeping multichannel monitor
 * driven by the conduction model (ep-live-model.js), with a programmable
 * stimulator (site, S1 × N, S2-S4, burst, pace and pause), DC cardioversion,
 * freeze and review of the last 30 s, sweep speed, interval readout and
 * vertical calipers, RF ablation at a chosen catheter-tip target, and a
 * hidden-case diagnosis quiz with expert hints. The strip is drawn by
 * drawEgm on the visible window.
 */
import { drawEgm, timeAtX, channelAtY } from './ep-egm.js';
import { LIVE_CASES, LIVE_CHANNELS, LIVE_SITES, ABLATION_TARGETS, createLiveHeart, planTrain, liveIntervals } from './ep-live-model.js';
import { LIVE_TEXT, LIVE_CASE_TEXT } from './ep-live-text.js';
import { CALIPER_SNAP_MS, noCaliper, snapTime, placeCaliper, caliperText } from './ep-user-caliper.js';

const PX_PER_MM = 3.78;            // CSS pixels per millimetre (96 dpi)
const SPEEDS = [25, 50, 100];      // sweep, mm/s
const REVIEW_MS = 30000;           // frozen history that can be scrolled back
const KEEP_MS = 45000;             // event memory kept by the model
// Animation frame helpers that also load outside a browser (unit tests).
const nextFrame = (fn) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : 0);
const cancelFrame = (id) => { if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id); };

export function createLivePanel(doc, { getLang = () => 'tr' } = {}) {
  const el = (tag, cls, attrs = {}) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const L = () => (getLang() === 'en' ? 'en' : 'tr');
  const T = () => LIVE_TEXT[L()];
  const caseText = (id) => LIVE_CASE_TEXT[id][L()];
  const state = { caseId: 'avnrt-typical', active: false, running: true, speed: 25, rate: 1, back: 0, frozenAt: null, pauseAt: null, caliperOn: false, caliper: noCaliper(), status: '',
    hidden: false, quizOpen: false, answer: null, showHints: false, rfOn: false, rfTarget: 'slow-pathway', lesion: '' };
  let heart = createLiveHeart(state.caseId);
  let simNow = 0, lastWall = null, raf = 0, lastTrim = 0, drawn = null;

  const root = el('section', 'ep-live', { 'data-ep-live': '' });
  const caseRow = el('label', 'ep-case'); const caseName = el('span'); const caseSelect = el('select', '', { 'data-ep-live-case': '' });
  caseRow.append(caseName, caseSelect);
  // Hidden case, diagnosis quiz and hints.
  const caseBar = el('div', 'ep-pace-actions ep-live-casebar');
  const surpriseBtn = el('button', 'ep-pace-retry', { type: 'button', 'data-ep-live-surprise': '' });
  const diagnoseBtn = el('button', 'ep-pace-retry', { type: 'button', 'data-ep-live-diagnose': '' });
  const hintsBtn = el('button', 'ep-pace-retry', { type: 'button', 'data-ep-live-hints': '' });
  caseBar.append(surpriseBtn, diagnoseBtn, hintsBtn);
  const quiz = el('section', 'ep-pace ep-live-quiz', { 'data-ep-live-quiz': '' });
  const quizQ = el('p', 'ep-pace-title');
  const quizChoices = el('div', 'ep-pace-answers', { role: 'group' });
  const quizResult = el('p', 'ep-pace-result', { 'aria-live': 'polite' });
  quiz.append(quizQ, quizChoices, quizResult);
  const hintsBox = el('ul', 'ep-live-hints', { 'data-ep-live-hint-list': '' });
  const canvas = el('canvas', 'ep-live-canvas', { role: 'img' });
  const bar = el('div', 'ep-view');
  const runBtn = el('button', 'ep-size', { type: 'button', 'data-ep-live-run': '' });
  const speedSel = el('select', '', { 'data-ep-live-speed': '' });
  const review = el('input', '', { type: 'range', min: '0', max: String(REVIEW_MS), step: '50', 'data-ep-live-review': '' });
  const calBtn = el('button', 'ep-size', { type: 'button', 'data-ep-live-caliper': '' });
  bar.append(runBtn, speedSel, review, calBtn);
  const readout = el('p', 'ep-live-readout', { 'data-ep-live-intervals': '' });
  const info = el('p', 'ep-live-info', { 'aria-live': 'polite' });

  const stimBox = el('section', 'ep-pace ep-live-stim');
  const stimTitle = el('h4', 'ep-pace-title');
  const fieldLabels = [];
  const field = (key, input) => { const l = el('label', 'ep-pace-field'); const s = el('span'); fieldLabels.push([s, key]); l.append(s, input); return l; };
  const num = (key, value, min, max) => el('input', '', { type: 'number', min: String(min), max: String(max), step: '10', value: String(value), 'data-ep-live-stim': key });
  const siteSel = el('select', '', { 'data-ep-live-stim': 'site' });
  const inputs = { s1: num('s1', 600, 200, 1500), n: num('n', 8, 1, 20), s2: num('s2', 370, 0, 1000), s3: num('s3', 0, 0, 1000), s4: num('s4', 0, 0, 1000) };
  inputs.n.step = '1';
  const grid = el('div', 'ep-live-grid');
  grid.append(field('site', siteSel), field('s1', inputs.s1), field('n', inputs.n), field('S2', inputs.s2), field('S3', inputs.s3), field('S4', inputs.s4));
  const actions = el('div', 'ep-pace-actions');
  const button = (key, cls) => { const b = el('button', cls, { type: 'button', 'data-ep-live-action': key }); actions.append(b); return b; };
  const paceBtn = button('pace', 'ep-pace-deliver'), burstBtn = button('burst', 'ep-pace-retry'), pausePaceBtn = button('pace-pause', 'ep-pace-retry'), stopBtn = button('stop', 'ep-pace-retry'), shockBtn = button('shock', 'ep-pace-retry ep-live-shock');
  const hint = el('p', 'ep-pace-note');
  stimBox.append(stimTitle, grid, actions, hint);
  // RF ablation console.
  const ablBox = el('section', 'ep-pace ep-live-ablation');
  const ablTitle = el('h4', 'ep-pace-title');
  const targetSel = el('select', '', { 'data-ep-live-target': '' });
  const targetField = field('target', targetSel);
  const rfBtn = el('button', 'ep-pace-deliver ep-live-rf', { type: 'button', 'data-ep-live-rf': '' });
  const ablStatus = el('p', 'ep-pace-result', { 'aria-live': 'polite', 'data-ep-live-lesion': '' });
  ablBox.append(ablTitle, targetField, rfBtn, ablStatus);
  root.append(caseRow, caseBar, quiz, hintsBox, bar, canvas, readout, info, stimBox, ablBox);

  const spanMs = () => {
    const plot = Math.max(200, (canvas.clientWidth || 800) - 64);
    return (plot / (state.speed * PX_PER_MM)) * 1000;
  };
  const viewEnd = () => (state.running ? simNow : state.frozenAt - state.back);

  function setCase(id, { hidden = false } = {}) {
    state.caseId = LIVE_CASES[id] ? id : 'normal';
    heart = createLiveHeart(state.caseId);
    simNow = 0; lastTrim = 0; state.back = 0; state.caliper = noCaliper(); state.status = '';
    Object.assign(state, { hidden, quizOpen: false, answer: null, showHints: false, rfOn: false, lesion: '' });
    advance(2500);   // open on a few sinus beats
    if (!state.running) state.frozenAt = simNow;
    render();
  }

  /** Advance the simulation by ms (also the test hook; the animation loop calls it per frame). */
  function advance(ms) {
    simNow += ms;
    heart.advanceTo(simNow);
    if (state.pauseAt != null && simNow >= state.pauseAt) { state.pauseAt = null; freeze(true); }
    if (simNow - lastTrim > 5000) { heart.trim(simNow - KEEP_MS); lastTrim = simNow; }
    // A completed lesion ends the RF application and reports its effect.
    const rf = heart.rf();
    if (state.rfOn && rf && rf.effect !== undefined) {
      heart.rfStop();
      state.rfOn = false;
      state.lesion = T().effects[rf.effect || 'none'];
      renderAblation();
    }
  }

  function freeze(flag) {
    state.running = !flag;
    state.frozenAt = flag ? simNow : null;
    state.back = 0;
    if (!flag) state.caliper = noCaliper();
    lastWall = null;
    render();
    if (state.running && state.active) loop();
  }

  function deliver(kind) {
    const s1 = Number(inputs.s1.value), n = Number(inputs.n.value);
    const extras = kind === 'burst' ? [] : ['s2', 's3', 's4'].map((k) => Number(inputs[k].value) || 0);
    const train = planTrain({ site: siteSel.value, start: simNow + 300, s1, n, extras });
    if (!train.length) return;
    if (!state.running) freeze(false);
    heart.stimulate(train);
    const used = extras.filter((x) => x > 0);
    state.status = T().delivered(`${T().sites[siteSel.value]} S1 ${s1} × ${n}${used.length ? ` + ${used.map((x, i) => `S${i + 2} ${x}`).join(', ')}` : ''}`);
    state.pauseAt = kind === 'pace-pause' ? train[train.length - 1].t + 1600 : null;
    render();
  }

  paceBtn.addEventListener('click', () => deliver('pace'));
  burstBtn.addEventListener('click', () => deliver('burst'));
  pausePaceBtn.addEventListener('click', () => deliver('pace-pause'));
  stopBtn.addEventListener('click', () => { heart.stopPacing(); state.pauseAt = null; state.status = T().stopped; render(); });
  shockBtn.addEventListener('click', () => { if (!state.running) freeze(false); heart.cardiovert(simNow + 50); state.status = T().shocked; render(); });
  runBtn.addEventListener('click', () => freeze(state.running));
  speedSel.addEventListener('change', () => { state.speed = Number(speedSel.value) || 25; render(); });
  review.addEventListener('input', () => { state.back = Number(review.value); state.caliper = noCaliper(); draw(); });
  calBtn.addEventListener('click', () => { state.caliperOn = !state.caliperOn; state.caliper = noCaliper(); render(); });
  caseSelect.addEventListener('change', () => { if (LIVE_CASES[caseSelect.value]) setCase(caseSelect.value); });
  surpriseBtn.addEventListener('click', () => {
    const ids = Object.keys(LIVE_CASES).filter((id) => id !== state.caseId);
    setCase(ids[Math.floor(Math.random() * ids.length)], { hidden: true });
  });
  diagnoseBtn.addEventListener('click', () => { state.quizOpen = !state.quizOpen; renderQuiz(); });
  hintsBtn.addEventListener('click', () => { state.showHints = !state.showHints; renderQuiz(); });
  quizChoices.addEventListener('click', (event) => {
    const id = event.target.closest?.('[data-ep-live-answer]')?.getAttribute('data-ep-live-answer');
    if (!id || state.answer) return;
    state.answer = { choice: id, correct: id === state.caseId };
    state.hidden = false;
    state.showHints = true;
    render();
  });
  targetSel.addEventListener('change', () => { state.rfTarget = targetSel.value; });
  rfBtn.addEventListener('click', () => {
    if (state.rfOn) {
      heart.rfStop();
      state.rfOn = false;
      state.lesion = L() === 'en' ? 'RF stopped before a lesion formed.' : 'RF lezyon oluşmadan durduruldu.';
    } else {
      if (!state.running) freeze(false);
      heart.rfStart(state.rfTarget, simNow);
      state.rfOn = true;
      state.lesion = T().rfRunning(T().targets[state.rfTarget]);
    }
    renderAblation();
  });
  canvas.addEventListener('click', (event) => {
    if (!state.caliperOn || !drawn) return;
    const rect = canvas.getBoundingClientRect();
    const local = timeAtX(event.clientX - rect.left, drawn);
    if (local == null) return;
    const from = viewEnd() - spanMs();
    const ch = channelAtY(event.clientY - rect.top, drawn);
    const radius = Math.max(CALIPER_SNAP_MS, (6 * (drawn.to - drawn.from)) / drawn.plotW);
    const t = snapTime({ events: heart.events(from + local - radius, from + local + radius) }, from + local, ch ? [ch] : LIVE_CHANNELS, radius);
    state.caliper = placeCaliper(state.caliper, t);
    render();
  });

  function draw() {
    const span = spanMs(), end = viewEnd(), from = end - span;
    const raw = heart.events(from - 80, end + 80);
    const events = Object.fromEntries(Object.entries(raw).map(([ch, list]) => [ch, list.map((e) => ({ ...e, t: e.t - from }))]));
    const local = state.caliperOn ? { a: state.caliper.a == null ? null : state.caliper.a - from, b: state.caliper.b == null ? null : state.caliper.b - from } : null;
    drawn = drawEgm(canvas, { id: 'live', channels: LIVE_CHANNELS, windowMs: span, events, calipers: [], markers: [] }, { lang: getLang(), channels: LIVE_CHANNELS, caliper: local }) || drawn;
    const iv = liveIntervals(heart.events(end - 2500, end));
    const t = T(), f = (v) => (v == null ? t.none : `${v} ms`);
    readout.textContent = `${t.intervals}: PP ${f(iv.pp)} · RR ${f(iv.rr)} · AH ${f(iv.ah)} · HV ${f(iv.hv)} · VA ${f(iv.va)}`;
  }

  const option = (value, text) => { const o = doc.createElement('option'); o.value = value; o.textContent = text; return o; };

  function renderQuiz() {
    const t = T();
    surpriseBtn.textContent = t.surprise;
    diagnoseBtn.textContent = t.diagnose;
    diagnoseBtn.setAttribute('aria-pressed', String(state.quizOpen));
    hintsBtn.textContent = t.hints;
    hintsBtn.setAttribute('aria-pressed', String(state.showHints));
    quiz.hidden = !state.quizOpen;
    quizQ.textContent = t.question;
    quizChoices.replaceChildren(...Object.keys(LIVE_CASES).map((id) => {
      const b = el('button', '', { type: 'button', 'data-ep-live-answer': id });
      b.textContent = caseText(id).name;
      if (state.answer) b.setAttribute('aria-pressed', String(id === state.answer.choice));
      if (state.answer && id === state.caseId) b.className = 'is-correct';
      return b;
    }));
    quizResult.textContent = !state.answer ? '' : state.answer.correct ? t.correct : t.wrong(caseText(state.caseId).name);
    hintsBox.hidden = !state.showHints;
    hintsBox.replaceChildren(...caseText(state.caseId).hints.map((h) => { const li = el('li'); li.textContent = h; return li; }));
  }

  function renderAblation() {
    const t = T();
    ablTitle.textContent = t.ablation;
    targetSel.replaceChildren(...ABLATION_TARGETS.map((id) => option(id, t.targets[id])));
    targetSel.value = state.rfTarget;
    rfBtn.textContent = state.rfOn ? t.rfOff : t.rfOn;
    rfBtn.setAttribute('aria-pressed', String(state.rfOn));
    ablStatus.textContent = state.lesion;
  }

  function render() {
    const t = T(), lang = L();
    caseName.textContent = t.caseLabel;
    caseSelect.replaceChildren(...(state.hidden ? [option('hidden', t.hidden)] : []), ...Object.keys(LIVE_CASES).map((id) => option(id, caseText(id).name)));
    caseSelect.value = state.hidden ? 'hidden' : state.caseId;
    renderQuiz();
    renderAblation();
    siteSel.replaceChildren(...LIVE_SITES.map((id) => { const o = doc.createElement('option'); o.value = id; o.textContent = t.sites[id]; return o; }));
    siteSel.value = siteSel.dataset.value || 'hra';
    speedSel.replaceChildren(...SPEEDS.map((v) => { const o = doc.createElement('option'); o.value = String(v); o.textContent = `${v} mm/s`; return o; }));
    speedSel.value = String(state.speed);
    speedSel.setAttribute('aria-label', t.speed);
    runBtn.textContent = state.running ? t.run : t.resume;
    runBtn.setAttribute('aria-pressed', String(!state.running));
    review.disabled = state.running;
    review.value = String(state.back);
    review.setAttribute('aria-label', t.review);
    calBtn.textContent = t.calipers;
    calBtn.setAttribute('aria-pressed', String(state.caliperOn));
    stimTitle.textContent = t.stim;
    for (const [span, key] of fieldLabels) span.textContent = t[key] || key;
    paceBtn.textContent = t.pace; burstBtn.textContent = t.burst; pausePaceBtn.textContent = t.pacePause; stopBtn.textContent = t.stop; shockBtn.textContent = t.shock;
    hint.textContent = t.hint;
    info.textContent = state.caliperOn ? caliperText(state.caliper, lang) : !state.running ? t.frozen : state.status;
    canvas.setAttribute('aria-label', lang === 'en' ? 'Live electrogram monitor' : 'Canlı elektrogram monitörü');
    draw();
  }
  siteSel.addEventListener('change', () => { siteSel.dataset.value = siteSel.value; });

  function loop() {
    cancelFrame(raf);
    const step = (wall) => {
      if (!state.active || !state.running) return;
      if (lastWall != null) advance(Math.min(100, wall - lastWall) * state.rate);
      lastWall = wall;
      draw();
      raf = nextFrame(step);
    };
    raf = nextFrame(step);
  }

  setCase(state.caseId);
  return {
    element: root,
    render,
    setActive(flag) {
      state.active = Boolean(flag);
      root.hidden = !state.active;
      lastWall = null;
      if (state.active) { render(); if (state.running) loop(); } else cancelFrame(raf);
    },
    /** Test hooks: deterministic stepping without the animation loop. */
    advance(ms) { advance(ms); if (!state.running) { state.frozenAt = simNow; state.back = 0; } draw(); },
    getState: () => ({ caseId: state.caseId, hidden: state.hidden, answer: state.answer, running: state.running, speed: state.speed, now: simNow, rfOn: state.rfOn, caliper: state.caliperOn ? { ...state.caliper } : null }),
    status: () => heart.status(),
    intervals: () => liveIntervals(heart.events(viewEnd() - 2500, viewEnd())),
    setCase
  };
}

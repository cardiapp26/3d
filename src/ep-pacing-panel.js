import {
  PACE_SITES, PACE_MODES, PACE_COUNTS, PACE_RANGE, PACE_ANSWERS, PACING_CASES,
  defaultPacing, normalizePacing, deliverPacing, pacingMeasures, gradePacingAnswer, compareExtrastimuli, pacingScene
} from './ep-pacing-lab.js';
import { PACE_TEXT } from './ep-pacing-text.js';
import { EP_CHANNELS } from './ep-cases.js';

/*
 * Controls of the atrial pacing laboratory (ep-pacing-lab.js): protocol,
 * pacing site, S1 cycle length and count, S2 interval. "Deliver" builds the
 * recording and hands it to the signal panel; the previous delivery is kept
 * for the extrastimulus comparison (AH jump). The route question opens once a
 * test beat captured; answering grades it, lists the observed evidence and
 * what the recording cannot tell, and releases the 3D conduction routes.
 */

const CHANNEL_LABEL = new Map(EP_CHANNELS.map((c) => [c.id, c.label]));

/**
 * @param {Document} doc
 * @param {{ getLang: () => string, onRecording: (recording: object|null) => void, onAnswer: () => void }} deps
 */
export function createPacingPanel(doc, { getLang, onRecording, onAnswer }) {
  const el = (tag, cls, attrs = {}) => {
    const node = doc.createElement(tag);
    if (cls) node.className = cls;
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };
  let caseId = 'focal-at';
  let choices = defaultPacing(caseId);
  let last = null;
  let previous = null;
  let answer = null;
  let active = true;   // false while another recording (clip, maneuver) is on the strip

  const root = el('section', 'ep-pace', { 'data-ep-pace': '' });
  const heading = el('h4', 'ep-pace-title');
  const intro = el('p', 'ep-pace-note');
  const field = (key, tag = 'select') => {
    const label = el('label', 'ep-pace-field');
    const name = el('span');
    const input = el(tag, '', { 'data-ep-pace-control': key });
    label.append(name, input);
    return { label, name, input };
  };
  const mode = field('mode'), site = field('site'), count = field('count');
  const s1 = field('s1', 'input'), s2 = field('s2', 'input');
  s1.input.type = 'range';
  s2.input.type = 'range';
  const s1Value = el('output'), s2Value = el('output');
  s1.label.append(s1Value);
  s2.label.append(s2Value);
  const deliver = el('button', 'ep-pace-deliver', { type: 'button', 'data-ep-pace-action': 'deliver' });
  const reset = el('button', 'ep-pace-retry', { type: 'button', 'data-ep-pace-action': 'reset' });
  const actions = el('div', 'ep-pace-actions');
  actions.append(deliver, reset);
  const feedback = el('ul', 'ep-pace-feedback', { 'aria-live': 'polite' });
  const result = el('p', 'ep-pace-result');
  const reason = el('p', 'ep-pace-reason');
  const compare = el('p', 'ep-pace-reason ep-pace-compare');
  const quiz = el('div', 'ep-pace-quiz', { role: 'group' });
  const question = el('p', 'ep-pace-question', { id: 'ep-pace-question' });
  quiz.setAttribute('aria-labelledby', 'ep-pace-question');
  const questionNote = el('p', 'ep-pace-note');
  const answerRow = el('div', 'ep-pace-answers');
  const answerButtons = PACE_ANSWERS.map((id) => {
    const b = el('button', '', { type: 'button', 'data-ep-pace-answer': id, 'aria-pressed': 'false' });
    b.addEventListener('click', () => {
      if (!last?.test?.answer) return;
      answer = id;
      render();
      onAnswer();
    });
    answerRow.append(b);
    return b;
  });
  const grade = el('p', 'ep-pace-grade', { 'aria-live': 'polite' });
  const evidenceTitle = el('p', 'ep-pace-subtitle');
  const evidence = el('ul', 'ep-pace-list');
  const cannotTitle = el('p', 'ep-pace-subtitle');
  const cannot = el('ul', 'ep-pace-list');
  const sceneNote = el('p', 'ep-pace-note');
  quiz.append(question, questionNote, answerRow, grade, evidenceTitle, evidence, cannotTitle, cannot, sceneNote);
  const limits = el('p', 'ep-pace-note ep-pace-limits');
  root.append(heading, intro, mode.label, site.label, s1.label, count.label, s2.label, actions, feedback, result, reason, compare, quiz, limits);

  const update = (patch) => { choices = normalizePacing({ ...choices, ...patch }); render(); };
  mode.input.addEventListener('change', () => update({ mode: mode.input.value }));
  site.input.addEventListener('change', () => update({ site: site.input.value }));
  count.input.addEventListener('change', () => update({ count: Number(count.input.value) }));
  s1.input.addEventListener('input', () => update({ s1: Number(s1.input.value) }));
  s2.input.addEventListener('input', () => update({ s2: Number(s2.input.value) }));
  deliver.addEventListener('click', () => {
    previous = last;
    last = deliverPacing({ ...choices, caseId });
    answer = null;
    render();
    onRecording(last);
  });
  reset.addEventListener('click', () => {
    choices = defaultPacing(caseId);
    last = previous = answer = null;
    render();
    onRecording(null);
  });

  const options = (select, items) => {
    const key = items.map(([v, l]) => `${v}:${l}`).join('|');
    if (select.dataset?.key === key) return;
    select.replaceChildren(...items.map(([value, label]) => { const o = doc.createElement('option'); o.value = String(value); o.textContent = label; return o; }));
    if (select.dataset) select.dataset.key = key;
  };
  const listItems = (list, lines) => list.replaceChildren(...lines.map((line) => { const li = el('li'); li.textContent = line; return li; }));

  function renderControls(t) {
    heading.textContent = t.heading;
    intro.textContent = t.intro;
    mode.name.textContent = t.mode;
    options(mode.input, PACE_MODES.map((m) => [m, t.modes[m]]));
    mode.input.value = choices.mode;
    site.name.textContent = t.site;
    options(site.input, PACE_SITES.map((s) => [s, t.sites[s]]));
    site.input.value = choices.site;
    count.name.textContent = t.count;
    options(count.input, PACE_COUNTS.map((n) => [n, String(n)]));
    count.input.value = String(choices.count);
    s1.name.textContent = t.s1;
    Object.assign(s1.input, { min: PACE_RANGE.s1.min, max: PACE_RANGE.s1.max, step: PACE_RANGE.s1.step });
    s1.input.value = String(choices.s1);
    s1Value.textContent = `${choices.s1} ms`;
    s2.name.textContent = t.s2;
    Object.assign(s2.input, { min: PACE_RANGE.s2.min, max: Math.min(PACE_RANGE.s2.max, choices.s1), step: PACE_RANGE.s2.step });
    s2.input.value = String(choices.s2);
    s2Value.textContent = `${choices.s2} ms`;
    s2.label.hidden = choices.mode !== 'extra';
    deliver.textContent = t.deliver;
    reset.textContent = t.reset;
    limits.textContent = t.limits;
  }

  function renderResult(t) {
    feedback.replaceChildren();
    compare.textContent = '';
    delete compare.dataset.jump;
    compare.hidden = true;
    result.hidden = reason.hidden = feedback.hidden = !last || !active;
    if (!last || !active) return;
    for (const [key, value] of Object.entries(last.feedback)) {
      const li = el('li');
      li.textContent = `${t.feedback[key]}: ${value ? t.feedback.yes : t.feedback.no}`;
      li.dataset.state = String(value);
      feedback.append(li);
    }
    result.textContent = t.results[last.result];
    result.dataset.result = last.result;
    reason.textContent = t.reasons[last.reason] || '';
    const d = compareExtrastimuli(previous, last);
    if (d) {
      const ah = (r) => pacingMeasures(r)['AH (S2)'];
      compare.textContent = t.compare({ s2: previous.choices.s2, ah: ah(previous) }, { s2: last.choices.s2, ah: ah(last) }, d) + (d.dS2 === -10 ? (d.jump ? t.jump : t.noJump) : ` ${t.compareHint}`);
      compare.dataset.jump = String(d.jump);
    } else if (last.choices.mode === 'extra' && last.test.route) {
      compare.textContent = t.compareHint;
      compare.dataset.jump = 'false';
    }
    compare.hidden = !compare.textContent;
  }

  function renderQuiz(t) {
    quiz.hidden = !last || !active;
    if (quiz.hidden) return;
    const key = last.test.answer;
    question.textContent = t.question;
    questionNote.textContent = key ? t.questionNote : t.unavailable;
    answerRow.hidden = !key;
    answerButtons.forEach((b) => {
      b.textContent = t.answers[b.getAttribute('data-ep-pace-answer')];
      b.setAttribute('aria-pressed', String(b.getAttribute('data-ep-pace-answer') === answer));
    });
    const answered = Boolean(key && answer);
    for (const node of [grade, evidenceTitle, evidence, cannotTitle, cannot, sceneNote]) node.hidden = !answered;
    if (!answered) return;
    const state = gradePacingAnswer(last, answer);
    grade.dataset.grade = state;
    grade.textContent = `${t.grades[state]} ${t.keyLabel}: ${t.answers[key]}.`;
    evidenceTitle.textContent = t.evidenceTitle;
    const lines = Object.entries(pacingMeasures(last)).filter(([, v]) => v != null).map(([label, v]) => `${label} ${v} ms`);
    if (last.test.conducted) lines.push(last.feedback.preexcitation ? t.delta.yes : t.delta.no);
    if (last.test.echoFirst) lines.push(t.echoLine(CHANNEL_LABEL.get(last.test.echoFirst) || last.test.echoFirst));
    listItems(evidence, lines);
    cannotTitle.textContent = t.cannotTitle;
    const notes = [t.cannot[key]];
    if (last.test.conducted && !last.feedback.preexcitation) notes.push(t.cannot.noDelta);
    if (last.test.echo) notes.push(t.cannot.echo);
    listItems(cannot, notes.filter(Boolean));
    sceneNote.textContent = t.scene;
  }

  function render() {
    const t = PACE_TEXT[getLang() === 'en' ? 'en' : 'tr'];
    renderControls(t);
    renderResult(t);
    renderQuiz(t);
  }

  render();
  return {
    element: root,
    /** Case of the signal panel; resets the laboratory when it changes. */
    setCase(id) {
      if (!PACING_CASES[id]) { root.hidden = true; return; }
      root.hidden = false;
      if (id !== caseId) { caseId = id; choices = defaultPacing(id); last = previous = answer = null; }
      render();
    },
    render,
    /** Show the result and the question only while this panel's recording is on the strip. */
    setActive(flag) { if (Boolean(flag) !== active) { active = Boolean(flag); render(); } },
    supports: (id) => Boolean(PACING_CASES[id]),
    getChoices: () => ({ ...choices }),
    getLast: () => last,
    /** 3D routes of the test beat, released once the learner answered. */
    getScene: () => (active && last && answer ? pacingScene(last) : null)
  };
}

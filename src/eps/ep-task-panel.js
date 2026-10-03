import { TASK_CASES, MECHANISMS, taskOrder, taskBaseline, taskView, classifyEvidence, gradeTask } from './ep-task.js';
import { TASK_TEXT } from './ep-task-text.js';
import { EP_SIM_TEXT } from './ep-case-text.js';
import { EP_CHANNELS } from './ep-cases.js';
import { createSimPanel } from './ep-sim-panel.js';

/*
 * Narrow QRS tachycardia task panel (ep-task.js), in the Diagnosis tab: a
 * hidden case, its tachycardia recording, the maneuver controls of
 * ep-sim-panel.js bound to the hidden case, a ledger that classifies every
 * piece of evidence against the five mechanisms, and the answer with the
 * reveal. Recordings reach the signal panel tagged lab 'task' so the title
 * and the schematic zone stay neutral until the learner answers.
 */

const SYMBOL = { supports: '↑', against: '↓', neutral: '–', uninterpretable: '?' };
const CHANNEL_LABEL = new Map(EP_CHANNELS.map((c) => [c.id, c.label]));

/**
 * @param {Document} doc
 * @param {{ getLang: () => string, onRecording: (recording: object) => void, onAnswer: () => void,
 *   caseName: (id: string) => string, seed?: number }} deps
 */
export function createTaskPanel(doc, { getLang, onRecording, onAnswer, caseName, seed = Date.now() }) {
  const el = (tag, cls, attrs = {}) => {
    const node = doc.createElement(tag);
    if (cls) node.className = cls;
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };
  const order = taskOrder(seed);
  let index = -1;
  let caseId = null;
  let evidence = [];
  let last = null;
  let result = null;
  let active = true;

  const root = el('details', 'ep-task', { 'data-ep-task': '' });
  const summary = el('summary', 'ep-task-title');
  const intro = el('p', 'ep-pace-note');
  const startRow = el('div', 'ep-pace-actions');
  const startBtn = el('button', 'ep-pace-deliver', { type: 'button', 'data-ep-task-action': 'start' });
  const taskName = el('span', 'ep-task-name');
  const baselineBtn = el('button', 'ep-pace-retry', { type: 'button', 'data-ep-task-action': 'baseline' });
  startRow.append(startBtn, taskName, baselineBtn);
  const body = el('div', 'ep-task-body');
  // The maneuver controls of the Maneuvers tab, bound to the hidden case.
  const sim = createSimPanel(doc, { getLang, scope: 'ep-task-sim', onRecording: (recording) => { if (recording && caseId) show(recording); } });
  const ledger = el('table', 'ep-task-ledger', { 'data-ep-task-ledger': '' });
  const legend = el('p', 'ep-pace-note');
  const notes = el('ul', 'ep-pace-list ep-task-notes');
  const answerRow = el('div', 'ep-pace-actions');
  const answerLabel = el('label', 'ep-pace-field');
  const answerName = el('span');
  const answerSelect = el('select', '', { 'data-ep-task-answer': '' });
  answerLabel.append(answerName, answerSelect);
  const submit = el('button', 'ep-pace-deliver', { type: 'button', 'data-ep-task-action': 'answer' });
  answerRow.append(answerLabel, submit);
  const verdict = el('p', 'ep-pace-grade', { 'aria-live': 'polite' });
  const limits = el('p', 'ep-pace-note ep-pace-limits');
  body.append(sim.element, legend, ledger, notes, answerRow, verdict);
  root.append(summary, intro, startRow, body, limits);

  // One ledger row per distinct recording: delivering the same choices again adds no evidence.
  const record = (recording) => {
    if (!evidence.some((e) => e.id === recording.id)) evidence.push({ ...classifyEvidence(recording), id: recording.id, maneuver: recording.maneuver || null });
  };
  function show(recording) {
    if (result) return;   // the answer closes the task: no evidence after it
    record(recording);
    last = taskView(recording);
    render();
    onRecording(last);
  }
  function showBaseline() {
    const recording = taskBaseline(caseId);
    record(recording);
    last = recording;
    render();
    onRecording(last);
  }
  function start(id = null) {
    index += 1;
    caseId = TASK_CASES.includes(id) ? id : order[index % order.length];
    evidence = [];
    result = null;
    answerSelect.value = '';
    sim.setCase(caseId);
    root.open = true;
    showBaseline();
  }
  startBtn.addEventListener('click', () => start());
  baselineBtn.addEventListener('click', () => { if (caseId) showBaseline(); });
  submit.addEventListener('click', () => {
    if (!caseId || result || !answerSelect.value) return;
    result = { ...gradeTask(caseId, answerSelect.value, evidence), total: evidence.length };
    render();
    onAnswer();
  });

  const measureLine = (e, t) => {
    const parts = Object.entries(e.measures).filter(([, v]) => v != null).map(([k, v]) => `${k} ${v}`);
    if (e.first) parts.push(`${t.earliest} ${CHANNEL_LABEL.get(e.first) || e.first}`);
    return parts.join(' · ');
  };

  function renderLedger(t, lang) {
    const head = el('tr');
    for (const label of [t.evidenceHead, ...MECHANISMS.map((m) => t.short[m])]) { const th = el('th'); th.textContent = label; head.append(th); }
    const rows = evidence.map((e) => {
      const tr = el('tr');
      const name = el('td');
      name.textContent = `${t.kinds[e.kind] || e.kind}: ${measureLine(e, t)}`;
      tr.append(name);
      for (const m of MECHANISMS) {
        const td = el('td', 'ep-task-cell', { 'data-state': e.states[m], title: `${t.mechanisms[m]}: ${t.states[e.states[m]]}` });
        td.textContent = SYMBOL[e.states[m]];
        tr.append(td);
      }
      return tr;
    });
    ledger.replaceChildren(head, ...rows);
    // Notes of the latest evidence: the reason of the maneuver and the rule that classified it.
    const latest = evidence[evidence.length - 1];
    const lines = latest ? latest.notes.map((key) => t.notes[key] || EP_SIM_TEXT[lang].reasons[key]).filter(Boolean) : [];
    notes.replaceChildren(...lines.map((line) => { const li = el('li'); li.textContent = line; return li; }));
  }

  function render() {
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const t = TASK_TEXT[lang];
    summary.textContent = t.heading;
    intro.textContent = t.intro;
    startBtn.textContent = t.start;
    baselineBtn.textContent = t.baseline;
    baselineBtn.hidden = !caseId;
    taskName.textContent = caseId ? t.task(index + 1) : '';
    body.hidden = !caseId;
    legend.textContent = t.legend;
    limits.textContent = t.limits;
    answerName.textContent = t.answer;
    const key = MECHANISMS.map((m) => `${m}:${t.mechanisms[m]}`).join('|');
    if (answerSelect.dataset?.key !== key) {
      const keep = answerSelect.value;
      const option = (value, label) => { const o = doc.createElement('option'); o.value = value; o.textContent = label; return o; };
      answerSelect.replaceChildren(option('', t.choose), ...MECHANISMS.map((m) => option(m, t.mechanisms[m])));
      answerSelect.value = keep || '';
      if (answerSelect.dataset) answerSelect.dataset.key = key;
    }
    submit.textContent = t.submit;
    answerSelect.disabled = submit.disabled = Boolean(result);
    sim.setActive(active && Boolean(last) && last.reason !== 'baseline');
    sim.element.hidden = Boolean(result);
    renderLedger(t, lang);
    verdict.hidden = !result;
    if (result) {
      verdict.dataset.grade = result.grade;
      const total = result.total;
      verdict.textContent = [
        t.grades[result.grade],
        t.reveal(caseName(caseId), t.mechanisms[result.key]),
        result.support ? t.support(result.support, result.against, total) : t.noSupport
      ].join(' ');
    }
  }

  render();
  return {
    element: root,
    render,
    /** Show the maneuver feedback only while this task's recording is on the strip. */
    setActive(flag) { if (Boolean(flag) !== active) { active = Boolean(flag); render(); } },
    owns: (recording) => Boolean(recording) && recording === last,
    /** Neutral strip title: task number and evidence kind, never the case. */
    title(lang) {
      const t = TASK_TEXT[lang === 'en' ? 'en' : 'tr'];
      return t.title(index + 1, t.kinds[last?.maneuver || 'baseline'] || '');
    },
    isAnswered: () => Boolean(result),
    getCase: () => caseId,
    getEvidence: () => evidence.map((e) => ({ ...e })),
    /** Start a task (a case id for tests and shared exercises, or the next case of the seeded order). */
    start
  };
}

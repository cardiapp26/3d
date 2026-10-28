/** Finish section of the CSP implant console: the sheath and slack steps after acceptance, the
 * case score and the follow-up clinic (day 1, 6 weeks) with its two questions. DOM only; the
 * numbers come from csp-finish.mjs. The console owns the procedure and calls back with actions.
 */
import { scoreCase, followUp, gradeFollowUp, SLACK } from './csp-finish.mjs';

const VISITS = ['day1', 'week6'];
const Q1 = ['conduction', 'myocardium', 'none'];
const Q2 = ['keep', 'increase', 'revise'];

/**
 * @param {Document} doc
 * @param {{ text: () => object, onAct: (action: object) => void, context: () => { proc, list, test, extras, seed } }} api
 */
export function createFinishPanel(doc, { text, onAct, context }) {
  const el = (tag, cls = '', attrs = {}) => { const n = doc.createElement(tag); n.className = cls; for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v)); return n; };
  const bindings = [];
  const txt = (n, get) => { bindings.push([n, get]); return n; };
  const button = (get, fn, attr = {}) => { const n = txt(el('button', '', { type: 'button', ...attr }), get); n.addEventListener('click', fn); return n; };
  const ui = { scored: false, visit: 'day1', answers: {}, checked: false };

  const root = el('section', 'csp-finish', { 'data-csp-finish': '' });
  const steps = el('div', 'csp-actions');
  const stepButtons = Object.fromEntries(['withdraw', 'slit', 'breath'].map(id => {
    const action = id === 'withdraw' ? () => onAct({ type: 'withdrawSheath', threshold: context().test?.threshold ?? null }) : id === 'slit' ? () => onAct({ type: 'slit' }) : () => onAct({ type: 'breath' });
    const b = button(() => text().finish.steps[id], action, { 'data-csp-finish-step': id }); steps.append(b); return [id, b];
  }));
  const slackField = el('label'); const slack = el('select', '', { 'data-csp-slack': '' });
  for (const v of SLACK) slack.append(txt(el('option', '', { value: v }), () => text().finish.slack[v]));
  slack.addEventListener('change', () => onAct({ type: 'slack', value: slack.value }));
  slackField.append(txt(el('span'), () => text().finish.slack.label), slack); steps.append(slackField);
  const finishBtn = button(() => text().finish.finishCase, () => { ui.scored = true; render(); }, { 'data-csp-finish-case': '' });
  steps.append(finishBtn);
  const scoreBox = el('div', 'csp-score', { 'data-csp-score': '' });
  const scoreHead = el('p', 'csp-verdict'); const scoreList = el('ul', 'csp-score-list');
  scoreBox.append(scoreHead, scoreList);

  // Follow-up clinic.
  const clinic = el('div', 'csp-clinic', { 'data-csp-clinic': '' });
  const visits = el('div', 'csp-tabs');
  const visitButtons = VISITS.map(v => { const b = button(() => text().finish.clinic[v], () => { ui.visit = v; ui.answers = {}; ui.checked = false; render(); }, { 'data-csp-visit': v }); visits.append(b); return b; });
  const readings = el('dl', 'csp-readouts', { 'data-csp-clinic-readings': '' });
  const q1 = el('div', 'csp-actions'), q2 = el('div', 'csp-actions');
  const q1Buttons = Q1.map(v => { const b = button(() => text().finish.clinic.q1Options[v], () => { ui.answers = { ...ui.answers, captured: v }; ui.checked = false; render(); }, { 'data-csp-q1': v }); q1.append(b); return b; });
  const q2Buttons = Q2.map(v => { const b = button(() => text().finish.clinic.q2Options[v], () => { ui.answers = { ...ui.answers, action: v }; ui.checked = false; render(); }, { 'data-csp-q2': v }); q2.append(b); return b; });
  const check = button(() => text().finish.clinic.check, () => { ui.checked = true; render(); }, { 'data-csp-clinic-check': '' });
  const feedback = el('p', 'csp-clinic-feedback', { 'data-csp-clinic-feedback': '', 'aria-live': 'polite' });
  clinic.append(txt(el('h3'), () => text().finish.clinic.title), visits, readings, txt(el('p', 'csp-note'), () => text().finish.clinic.q1), q1, txt(el('p', 'csp-note'), () => text().finish.clinic.q2), q2, check, feedback);
  root.append(txt(el('h3'), () => text().finish.title), steps, scoreBox, clinic);

  function render() {
    for (const [n, get] of bindings) n.textContent = get();
    const { proc, list, test, extras, seed } = context();
    const t = text().finish, f = proc.finish || {};
    root.hidden = !proc.accepted;
    if (root.hidden) return;
    stepButtons.withdraw.disabled = Boolean(f.withdraw); stepButtons.slit.disabled = !f.withdraw || Boolean(f.slit); stepButtons.breath.disabled = !f.slit;
    for (const id of ['withdraw', 'slit', 'breath']) stepButtons[id].setAttribute('aria-pressed', String(Boolean(f[id])));
    slack.value = proc.slack;
    scoreBox.hidden = !ui.scored;
    if (ui.scored) {
      const s = scoreCase(proc, list, test, extras);
      scoreHead.textContent = `${t.score}: ${s.score} / 100`;
      scoreList.replaceChildren(...s.items.map(i => {
        const li = el('li', '', { 'data-ok': i.ok, 'data-csp-score-item': i.id });
        li.textContent = `${i.ok ? '✓' : '✗'} ${t.items[i.id]}${i.value != null && i.value !== '' ? ` · ${i.value}` : ''}`; return li;
      }));
    }
    clinic.hidden = !ui.scored;
    if (!ui.scored) return;
    const truth = followUp(proc, test, ui.visit, seed);
    visitButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cspVisit === ui.visit)));
    const rows = [
      [t.clinic.readings.programmed, `${proc.output.toFixed(2)} V @ ${proc.pulseWidth} ms ${proc.polarity === 'uni' ? 'uni' : 'bi'}`],
      [t.clinic.readings.device, truth.thresholds.device == null ? t.clinic.readings.noCapture : `${truth.thresholds.device.toFixed(2)} V`],
      [t.clinic.readings.rWave, `${truth.rWave} mV`], [t.clinic.readings.impedance, `${truth.impedance} Ω`],
      [t.clinic.readings.reference, proc.thresholds?.uni != null ? `${proc.thresholds.uni.toFixed(2)} V · ${test?.rows?.[0]?.metrics?.v6Rwpt ?? '·'} ms` : '·'],
      [t.clinic.readings.deltaV6, `${truth.deltaV6 > 0 ? '+' : ''}${truth.deltaV6} ms`]
    ];
    readings.replaceChildren(...rows.flatMap(([k, v]) => { const dt = el('dt'); dt.textContent = k; const dd = el('dd'); dd.textContent = v; return [dt, dd]; }));
    q1Buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cspQ1 === ui.answers.captured)));
    q2Buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cspQ2 === ui.answers.action)));
    check.disabled = !ui.answers.captured || !ui.answers.action;
    if (ui.checked) {
      const g = gradeFollowUp(truth, ui.answers);
      const why = truth.dislodged ? ` ${t.clinic.dislodged[truth.dislodged]}` : '';
      feedback.textContent = `${g.captured && g.action ? t.clinic.correct : t.clinic.wrong} ${t.clinic.q1Options[truth.captured]}; ${t.clinic.q2Options[truth.action]}.${why}`;
    } else feedback.textContent = '';
  }
  return { element: root, render, reset() { ui.scored = false; ui.visit = 'day1'; ui.answers = {}; ui.checked = false; } };
}

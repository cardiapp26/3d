import { MECHANISMS, GROUPS, evaluate, groupEnabled } from './svt-dx-model.js';
import { SVT_DX_TEXT } from './svt-dx-text.js';
import { createSvtRecordings } from './svt-dx-recordings.js';
import { createAtGuide } from './at-markowitz-guide.js';

/*
 * SVT algorithm tab: the findings of the narrow QRS tachycardia work-up
 * (surface ECG, carotid massage or adenosine, EP study) as buttons; the
 * candidate list beside them shows which mechanisms each finding excludes
 * or favors, and why. Pure logic lives in svt-dx-model.js.
 */

const STEPS = ['ecg', 'drug', 'ep'];

export function createSvtDxPanel(doc, { getLang = () => 'tr' } = {}) {
  const el = (tag, cls, attrs = {}) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const L = () => (getLang() === 'en' ? 'en' : 'tr');
  const T = () => SVT_DX_TEXT[L()];
  const state = { active: false, selection: {} };

  const root = el('section', 'svt', { 'data-svt': '' });
  root.hidden = true;
  const heading = el('h3', 'amap-title');
  const intro = el('p', 'amap-note');
  const source = el('p', 'amap-source');
  const layout = el('div', 'svt-layout');
  const findings = el('div', 'svt-findings');
  const aside = el('aside', 'svt-aside basics-card', { 'data-svt-candidates': '' });
  layout.append(findings, aside);
  const recordings = createSvtRecordings(doc, L);
  const atGuide = createAtGuide(doc, L);
  root.append(heading, intro, recordings.element, atGuide.element, layout, source);

  // Findings: one card per group, grouped under their step.
  const stepHeads = new Map();
  const cards = new Map();   // group id -> { card, title, hint, buttons: Map(option -> button) }
  for (const step of STEPS) {
    const head = el('h4', 'svt-step', { 'data-svt-step': step });
    stepHeads.set(step, head);
    findings.append(head);
    for (const group of GROUPS.filter((g) => g.step === step)) {
      const card = el('section', 'basics-card svt-group', { 'data-svt-group': group.id });
      const title = el('h4');
      const hint = el('p', 'amap-note');
      const row = el('div', 'amap-toggles');
      const buttons = new Map();
      for (const option of Object.keys(group.options)) {
        const b = el('button', 'amap-toggle', { type: 'button', 'data-svt-option': `${group.id}:${option}` });
        b.addEventListener('click', () => {
          if (state.selection[group.id] === option) delete state.selection[group.id];
          else state.selection[group.id] = option;
          render();
        });
        buttons.set(option, b);
        row.append(b);
      }
      card.append(title, hint, row);
      findings.append(card);
      cards.set(group.id, { card, title, hint, buttons, group });
    }
  }

  // Candidates and reasons.
  const candTitle = el('h4');
  const reset = el('button', 'amap-toggle', { type: 'button', 'data-svt-reset': '' });
  reset.addEventListener('click', () => { state.selection = {}; render(); });
  const list = el('ul', 'svt-candidates');
  const verdict = el('p', 'svt-verdict', { 'data-svt-verdict': '', role: 'status' });
  const reasonsTitle = el('h4');
  const reasons = el('ul', 'basics-lines svt-reasons', { 'data-svt-reasons': '' });
  aside.append(candTitle, list, verdict, reasonsTitle, reasons, reset);
  const items = new Map(MECHANISMS.map((id) => {
    const li = el('li', 'svt-candidate', { 'data-svt-mechanism': id });
    const name = el('strong');
    const note = el('span', 'svt-note');
    const badge = el('span', 'svt-badge');
    li.append(name, note, badge);
    list.append(li);
    return [id, { li, name, note, badge }];
  }));

  function render() {
    recordings.render();
    const t = T();
    heading.textContent = t.heading; intro.textContent = t.intro; source.textContent = t.source;
    candTitle.textContent = t.candidates; reasonsTitle.textContent = t.reasons; reset.textContent = t.reset;
    atGuide.render();
    for (const [step, head] of stepHeads) head.textContent = t.steps[step];
    for (const { card, title, hint, buttons, group } of cards.values()) {
      const text = t.groups[group.id];
      title.textContent = text.title; hint.textContent = text.hint;
      card.hidden = !groupEnabled(group, state.selection);
      for (const [option, b] of buttons) {
        b.textContent = text.options[option].label;
        b.setAttribute('aria-pressed', String(state.selection[group.id] === option));
      }
    }
    const result = evaluate(state.selection);
    for (const m of result.mechanisms) {
      const item = items.get(m.id);
      item.name.textContent = t.mechanisms[m.id].name;
      item.note.textContent = t.mechanisms[m.id].note;
      item.badge.textContent = t.status[m.status];
      item.li.setAttribute('data-status', m.status);
    }
    verdict.textContent = result.conflict ? t.conflict : result.single ? t.single(t.mechanisms[result.single].name) : '';
    verdict.hidden = !verdict.textContent;
    verdict.setAttribute('data-state', result.conflict ? 'conflict' : result.single ? 'single' : 'open');
    const lines = [];
    for (const m of result.mechanisms) {
      for (const [kind, refs] of [['excluded', m.excludedBy], ['favored', m.favoredBy]]) {
        for (const r of refs) lines.push({ id: m.id, kind, why: t.groups[r.group].options[r.option].why, finding: t.groups[r.group].options[r.option].label });
      }
    }
    reasons.replaceChildren(...(lines.length ? lines.map((line) => {
      const li = el('li', '', { 'data-svt-reason': `${line.id}:${line.kind}` });
      li.textContent = `${t.mechanisms[line.id].name}, ${t.status[line.kind]}: ${line.finding} (${t.because}: ${line.why})`;
      return li;
    }) : [(() => { const li = el('li'); li.textContent = t.noReasons; return li; })()]));
  }

  return {
    element: root,
    render,
    setActive(flag) { state.active = Boolean(flag); root.hidden = !state.active; recordings.setActive(state.active); if (state.active) render(); },
    /** Test hooks. */
    set(patch) { Object.assign(state, patch); render(); return { ...state, selection: { ...state.selection } }; },
    getState: () => ({ ...state, selection: { ...state.selection } })
  };
}

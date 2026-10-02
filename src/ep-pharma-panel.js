import { PHARMA_CASES, PHARMA_DRUGS, pharmaInducible, pharmaExamples, defaultPharma, pharmaComparison, pharmaMeasures } from './ep-pharma.js';
import { PHARMA_TEXT, PHARMA_SOURCES } from './ep-pharma-text.js';

/** Drug challenge controls share the main EGM strip and retain a paired comparison. */
export function createPharmaPanel(doc, { getLang, onRecording }) {
  const el = (tag, cls, attrs = {}) => {
    const node = doc.createElement(tag);
    if (cls) node.className = cls;
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  };
  let choices = defaultPharma();
  let pair = null;
  let phase = 'after';
  let active = false;
  const root = el('section', 'ep-pace ep-pharma', { 'data-ep-pharma': '' });
  const heading = el('h4', 'ep-pace-title');
  const intro = el('p', 'ep-pace-note');
  const field = (key) => {
    const label = el('label', 'ep-pace-field'), name = el('span');
    const input = el('select', '', { 'data-ep-pharma-control': key });
    label.append(name, input);
    return { label, name, input };
  };
  const drug = field('drug'), example = field('example');
  const mechanism = el('p', 'ep-pace-reason');
  const show = el('button', 'ep-pace-deliver', { type: 'button', 'data-ep-pharma-action': 'show' });
  const reset = el('button', 'ep-pace-retry', { type: 'button', 'data-ep-pharma-action': 'reset' });
  const actions = el('div', 'ep-pace-actions');
  actions.append(show, reset);
  const phaseRow = el('div', 'ep-pace-answers', { role: 'group', 'data-ep-pharma-phases': '' });
  const phaseButtons = ['before', 'after'].map((id) => {
    const button = el('button', '', { type: 'button', 'data-ep-pharma-phase': id });
    button.addEventListener('click', () => {
      if (!pair) return;
      phase = id;
      onRecording(pair[phase]);
      render();
    });
    phaseRow.append(button);
    return button;
  });
  const table = el('table', 'ep-task-ledger', { 'data-ep-pharma-comparison': '' });
  const observation = el('p', 'ep-pace-result', { 'aria-live': 'polite' });
  const limits = el('p', 'ep-pace-note ep-pace-limits');
  const sources = el('p', 'ep-pace-note');
  root.append(heading, intro, drug.label, example.label, mechanism, actions, phaseRow, table, observation, limits, sources);

  function clear() {
    pair = null;
    active = false;
    onRecording(null);
    render();
  }
  drug.input.addEventListener('change', () => { choices.drug = drug.input.value; clear(); });
  example.input.addEventListener('change', () => { choices.example = example.input.value; clear(); });
  show.addEventListener('click', () => {
    pair = pharmaComparison(choices);
    phase = 'after';
    onRecording(pair.after);
    render();
  });
  reset.addEventListener('click', () => { choices = defaultPharma(choices.caseId); clear(); });

  const fillOptions = (input, ids, labels, value) => {
    input.replaceChildren(...ids.map((id) => { const o = doc.createElement('option'); o.value = id; o.textContent = labels[id]; return o; }));
    input.value = value;
  };

  function render() {
    const lang = getLang() === 'en' ? 'en' : 'tr', t = PHARMA_TEXT[lang];
    heading.textContent = `${t.heading}: ${t.drugs.atropine} / Isuprel`;
    intro.textContent = t.intro;
    drug.name.textContent = t.drug;
    example.name.textContent = t.example;
    fillOptions(drug.input, PHARMA_DRUGS, t.drugs, choices.drug);
    fillOptions(example.input, pharmaExamples(choices.caseId), t.examples, choices.example);
    mechanism.textContent = t.mechanism[choices.drug];
    show.textContent = t.show;
    reset.textContent = t.reset;
    limits.textContent = pharmaInducible(choices.caseId) ? t.limits : `${t.rateOnly} ${t.limits}`;
    phaseRow.setAttribute('aria-label', t.show);
    phaseButtons.forEach((b, i) => {
      const id = i === 0 ? 'before' : 'after';
      b.textContent = t[id];
      b.disabled = !pair;
      b.setAttribute('aria-pressed', String(Boolean(pair) && active && phase === id));
    });
    table.hidden = observation.hidden = !pair || !active;
    table.replaceChildren();
    observation.textContent = '';
    if (pair && active) {
      const before = pharmaMeasures(pair.before), after = pharmaMeasures(pair.after);
      const row = (cells, tag = 'td') => {
        const tr = el('tr');
        for (const text of cells) { const td = el(tag); td.textContent = text; tr.append(td); }
        return tr;
      };
      table.append(row(t.compareHead, 'th'));
      const value = (key, v) => typeof v === 'boolean' ? (v ? t.yes : t.no) : v == null ? t.notMeasured : `${v} ${key === 'rate' ? (lang === 'tr' ? 'atım/dk' : 'bpm') : 'ms'}`;
      for (const key of Object.keys(before)) {
        if (before[key] == null && after[key] == null) continue;
        const tr = row([t.labels[key], value(key, before[key]), value(key, after[key])]);
        tr.setAttribute('data-ep-pharma-measure', key);
        table.append(tr);
      }
      const observed = after.induced ? 'induced' : after.echo ? 'echo' : choices.example === 'sinus-av' ? 'rate' : 'noninduced';
      observation.textContent = t.observed[observed];
    }
    sources.replaceChildren();
    const label = el('span'); label.textContent = `${t.sources}: `; sources.append(label);
    for (const source of PHARMA_SOURCES) {
      const link = el('a', '', { href: source.url, target: '_blank', rel: 'noopener noreferrer', title: source.title });
      link.textContent = `[${source.id}] `;
      sources.append(link);
    }
  }

  render();
  return {
    element: root, render,
    supports: (id) => PHARMA_CASES.includes(id),
    setCase(id) {
      if (!PHARMA_CASES.includes(id)) return;
      if (id !== choices.caseId) { choices = { ...defaultPharma(id), drug: choices.drug }; pair = null; active = false; }
      render();
    },
    setActive(flag) { if (Boolean(flag) !== active) { active = Boolean(flag); render(); } },
    getRecording: () => pair?.[phase] || null,
    getComparison: () => pair,
    stripTitle(lang) { const t = PHARMA_TEXT[lang === 'en' ? 'en' : 'tr']; return t.strip(t.drugs[choices.drug], t[phase]); }
  };
}

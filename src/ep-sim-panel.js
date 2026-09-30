import { SIM_CASES, SIM_MANEUVERS, SIM_SITES, SIM_PARAHIS_OUTPUTS, HIS_PVC_RANGE, defaultChoices, simulate, simMeasures } from './ep-maneuver-sim.js';
import { EP_SIM_TEXT } from './ep-case-text.js';

/*
 * Controls of the interactive maneuver (ep-maneuver-sim.js): maneuver,
 * pacing site, stimulus timing or pacing cycle length, output; "Deliver"
 * builds the recording and hands it to the signal panel; the feedback lists
 * capture, refractoriness and entrainment, then the result and its reason.
 * "Try again" returns to the case's default choices.
 */


/**
 * @param {Document} doc
 * @param {{ getLang: () => string, onRecording: (recording: object|null) => void }} deps
 */
export function createSimPanel(doc, { getLang, onRecording }) {
  const el = (tag, cls, attrs = {}) => {
    const node = doc.createElement(tag);
    if (cls) node.className = cls;
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };
  let caseId = 'avnrt-typical';
  let choices = defaultChoices(caseId);
  let last = null;
  let active = true;   // false while another recording (clip, pacing laboratory) is on the strip

  const root = el('section', 'ep-sim', { 'data-ep-sim': '' });
  const heading = el('h4', 'ep-sim-title');
  const field = (key, tag = 'select') => {
    const label = el('label', 'ep-sim-field');
    const name = el('span');
    const input = el(tag, '', { 'data-ep-sim-control': key });
    label.append(name, input);
    return { label, name, input };
  };
  const maneuver = field('maneuver'), site = field('site'), output = field('output');
  const timing = field('timing', 'input'), pcl = field('pcl', 'input');
  timing.input.type = 'range';
  pcl.input.type = 'range';
  const timingValue = el('output'), pclValue = el('output');
  timing.label.append(timingValue);
  pcl.label.append(pclValue);
  const deliver = el('button', 'ep-sim-deliver', { type: 'button', 'data-ep-sim-action': 'deliver' });
  const retry = el('button', 'ep-sim-retry', { type: 'button', 'data-ep-sim-action': 'retry' });
  const actions = el('div', 'ep-sim-actions');
  actions.append(deliver, retry);
  const feedback = el('ul', 'ep-sim-feedback', { 'aria-live': 'polite' });
  const result = el('p', 'ep-sim-result');
  const reason = el('p', 'ep-sim-reason');
  root.append(heading, maneuver.label, site.label, timing.label, pcl.label, output.label, actions, feedback, result, reason);

  maneuver.input.addEventListener('change', () => { choices = { ...defaultChoices(caseId, maneuver.input.value) }; last = null; render(); onRecording(null); });
  site.input.addEventListener('change', () => { choices.site = site.input.value; render(); });
  output.input.addEventListener('change', () => { choices.output = output.input.value; render(); });
  timing.input.addEventListener('input', () => { choices.timing = Number(timing.input.value); render(); });
  pcl.input.addEventListener('input', () => { choices.pcl = Number(pcl.input.value); render(); });
  deliver.addEventListener('click', () => { last = simulate({ ...choices }); render(); onRecording(last); });
  retry.addEventListener('click', () => { choices = defaultChoices(caseId, choices.maneuver); last = null; render(); onRecording(null); });

  const options = (select, items) => {
    const key = items.map(([v, l]) => `${v}:${l}`).join('|');
    if (select.dataset?.key === key) return;
    select.replaceChildren(...items.map(([value, label]) => { const o = doc.createElement('option'); o.value = value; o.textContent = label; return o; }));
    if (select.dataset) select.dataset.key = key;
  };

  function render() {
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const t = EP_SIM_TEXT[lang];
    const model = SIM_CASES[caseId];
    heading.textContent = `${t.heading} (${t.tcl} ${model.tcl} ms)`;
    maneuver.name.textContent = t.maneuver;
    options(maneuver.input, SIM_MANEUVERS.map((m) => [m, t.maneuvers[m]]));
    maneuver.input.value = choices.maneuver;
    site.name.textContent = t.site;
    options(site.input, SIM_SITES.map((s) => [s, t.sites[s]]));
    site.input.value = choices.site;
    output.name.textContent = t.output;
    options(output.input, SIM_PARAHIS_OUTPUTS.map((o) => [o, t.outputs[o]]));
    output.input.value = choices.output;
    timing.name.textContent = t.timing;
    Object.assign(timing.input, { min: HIS_PVC_RANGE.min, max: HIS_PVC_RANGE.max, step: HIS_PVC_RANGE.step });
    timing.input.value = String(choices.timing);
    timingValue.textContent = `H${choices.timing >= 0 ? '+' : ''}${choices.timing} ms`;
    pcl.name.textContent = t.pcl;
    Object.assign(pcl.input, { min: model.tcl - 120, max: model.tcl + 40, step: 10 });
    pcl.input.value = String(choices.pcl);
    pclValue.textContent = `${choices.pcl} ms`;
    site.label.hidden = choices.maneuver !== 'v-overdrive';
    pcl.label.hidden = choices.maneuver !== 'v-overdrive';
    timing.label.hidden = choices.maneuver !== 'his-pvc';
    output.label.hidden = choices.maneuver !== 'para-his';
    deliver.textContent = t.deliver;
    retry.textContent = t.retry;
    feedback.replaceChildren();
    result.textContent = '';
    reason.textContent = '';
    result.hidden = reason.hidden = feedback.hidden = !last || !active;
    if (!last || !active) return;
    for (const [key, value] of Object.entries(last.feedback)) {
      const li = el('li');
      li.textContent = `${t.feedback[key]}: ${value ? t.feedback.yes : t.feedback.no}`;
      li.dataset.state = String(value);
      feedback.append(li);
    }
    const m = simMeasures(last);
    const extra = [];
    if (m.PPI != null && m.TCL != null) extra.push(`PPI-TCL ${m.PPI - m.TCL} ms`);
    if (m.SA != null && m.VA != null) extra.push(`SA-VA ${m.SA - m.VA} ms`);
    result.textContent = `${t.results[last.result]}${extra.length ? ` · ${extra.join(' · ')}` : ''}`;
    result.dataset.result = last.result;
    reason.textContent = t.reasons[last.reason] || '';
  }

  render();
  return {
    element: root,
    /** Case of the signal panel; resets the choices when it changes. */
    setCase(id) {
      if (!SIM_CASES[id]) { root.hidden = true; return; }
      root.hidden = false;
      if (id !== caseId) { caseId = id; choices = defaultChoices(id, choices.maneuver); last = null; }
      render();
    },
    render,
    /** Show the feedback only while this panel's recording is on the strip. */
    setActive(flag) { if (Boolean(flag) !== active) { active = Boolean(flag); render(); } },
    getChoices: () => ({ ...choices }),
    getLast: () => last,
    supports: (id) => Boolean(SIM_CASES[id])
  };
}


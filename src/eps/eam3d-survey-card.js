/*
 * "Find the circuit" card of the 3D EAM workstation: voltage map source, number of survey
 * runs, the surveyed candidate circuits and the proposed minimal-intervention lines.
 * The card holds no state; the panel passes the survey report in and gets intents back.
 */
import { EAM3D_SURVEY_RUNS } from './eam3d-model.js';
import { el, button, checkbox } from './eam3d-dom.js';

export const SURVEY_PRESETS = Object.freeze(['biatrial-scar', 'vt-scar', 'custom-import']);

/**
 * @param {Document} doc
 * @param {{
 *   onPreset: (presetId: string) => void,
 *   onRuns: (runs: number) => void,
 *   onRun: () => void,
 *   onRibbons: (show: boolean) => void,
 *   onSelectCircuit: (circuitNumber: number) => void,
 *   onApplyLine: (lineId: string) => void,
 * }} handlers
 */
export function createSurveyCard(doc, { onPreset, onRuns, onRun, onRibbons, onSelectCircuit, onApplyLine }) {
  const card = el(doc, 'div', 'eam3d-card', null, { 'data-eam3d-survey-card': 'true' });
  const title = el(doc, 'h3', 'eam3d-card-title');
  const intro = el(doc, 'p', 'eam3d-deck-sub');

  const presetField = el(doc, 'label', 'eam3d-field');
  const presetLabel = el(doc, 'span');
  const presetSelect = el(doc, 'select', 'eam3d-select', null, { 'data-eam3d-survey-preset': 'true' });
  const presetOptions = SURVEY_PRESETS.map((presetId) => {
    const opt = el(doc, 'option');
    opt.value = presetId;
    presetSelect.appendChild(opt);
    return opt;
  });
  presetField.append(presetLabel, presetSelect);
  presetSelect.addEventListener('change', () => onPreset(presetSelect.value));

  const runsField = el(doc, 'label', 'eam3d-field');
  const runsLabel = el(doc, 'span');
  const runsSelect = el(doc, 'select', 'eam3d-select', null, { 'data-eam3d-survey-runs': 'true' });
  for (const n of EAM3D_SURVEY_RUNS) {
    const opt = el(doc, 'option', '', String(n));
    opt.value = String(n);
    runsSelect.appendChild(opt);
  }
  runsField.append(runsLabel, runsSelect);
  runsSelect.addEventListener('change', () => onRuns(Number(runsSelect.value) || EAM3D_SURVEY_RUNS[1]));

  const runBtn = button(doc, 'eam3d-btn eam3d-btn--accent', { 'data-eam3d-run-survey': 'true' });
  runBtn.addEventListener('click', onRun);

  const ribbonGrid = el(doc, 'div', 'eam3d-check-grid');
  const ribbons = checkbox(doc, { 'data-eam3d-check': 'showCircuitRibbons' }, false, onRibbons);
  ribbonGrid.appendChild(ribbons.wrap);

  const summary = el(doc, 'div', 'eam3d-summary-box', null, { 'data-eam3d-survey-summary': 'true' });
  const circuitsHeader = el(doc, 'div', 'eam3d-card-title');
  const circuitsList = el(doc, 'div', 'eam3d-list', null, { 'data-eam3d-circuits-list': 'true' });
  const linesHeader = el(doc, 'div', 'eam3d-card-title');
  const linesList = el(doc, 'div', 'eam3d-list', null, { 'data-eam3d-proposed-list': 'true' });

  card.append(title, intro, presetField, runsField, runBtn, ribbonGrid, summary, circuitsHeader, circuitsList, linesHeader, linesList);

  function circuitRow(circuit, report, selected, t) {
    const item = el(doc, 'div', `eam3d-list-item${selected ? ' is-selected' : ''}`, null, {
      'data-eam3d-circuit-row': String(circuit.number),
    });
    item.style.cursor = 'pointer';
    const row = el(doc, 'div', 'eam3d-list-row');
    row.append(
      el(doc, 'span', 'eam3d-list-title', t.surveyBox.circuitNames[circuit.id] || `#${circuit.number}`),
      el(doc, 'span', 'eam3d-badge', `${circuit.sustainedCount}/${report.runs} (${circuit.frequencyPct}%)`),
    );
    const status = circuit.interrupted ? t.surveyBox.blocked : t.surveyBox.conducting;
    const meta = el(
      doc,
      'div',
      'eam3d-list-meta',
      `${status} · CL ${circuit.tclMs} ms · ${t.surveyBox.isthmus} ${circuit.isthmusMm} mm`,
    );
    item.append(row, meta);
    item.addEventListener('click', () => onSelectCircuit(circuit.number));
    return item;
  }

  function lineRow(line, t) {
    const item = el(doc, 'div', `eam3d-list-item${line.applied ? ' is-applied' : ''}`);
    const row = el(doc, 'div', 'eam3d-list-row');
    const apply = button(
      doc,
      `eam3d-btn${line.applied ? ' is-active' : ' eam3d-btn--accent'}`,
      { 'data-eam3d-apply-line': line.id },
      line.applied ? t.ablationBox.applied : t.surveyBox.applyLine,
    );
    apply.addEventListener('click', () => onApplyLine(line.id));
    row.append(el(doc, 'span', 'eam3d-list-title', t.ablationBox.lines[line.id] || line.id), apply);
    const blocked = line.circuitsBlocked.map((n) => `#${n}`).join(', ') || '-';
    item.append(row, el(doc, 'div', 'eam3d-list-meta', `${line.lengthMm} mm · ${line.interruptedSharePct}% (${blocked})`));
    return item;
  }

  /**
   * @param {{ t: object, preset: string, runs: number, showRibbons: boolean, selectedCircuit: number | null, report: object }} view
   */
  function sync({ t, preset, runs, showRibbons, selectedCircuit, report }) {
    title.textContent = t.surveyBox.title;
    intro.textContent = t.surveyBox.intro;
    presetLabel.textContent = t.surveyBox.preset;
    for (const opt of presetOptions) opt.textContent = t.surveyBox.presets[opt.value] || opt.value;
    presetSelect.value = preset;
    runsLabel.textContent = t.surveyBox.runs;
    runsSelect.value = String(runs);
    runBtn.textContent = t.surveyBox.runBtn;
    ribbons.input.checked = Boolean(showRibbons);
    ribbons.label.textContent = t.surveyBox.showRibbons;
    circuitsHeader.textContent = t.surveyBox.circuitsTitle;
    linesHeader.textContent = t.surveyBox.linesTitle;
    summary.textContent = t.surveyBox.sustainedSummary(report.totalSustained, report.runs, report.sustainedPct);
    circuitsList.replaceChildren(...report.circuits.map((c) => circuitRow(c, report, selectedCircuit === c.number, t)));
    linesList.replaceChildren(...report.proposedLines.map((line) => lineRow(line, t)));
  }

  return { card, sync };
}

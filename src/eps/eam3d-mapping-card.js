/*
 * Mapping card of the 3D EAM workstation: choose the high-density catheter (which also sets
 * the mapping system and its colour convention), the chamber, start or stop the point-by-point
 * acquisition and read its running totals. The card holds no state.
 */
import { MAPPING_CATHETERS, MAPPING_CATHETER_IDS, MAPPING_CHAMBERS, MAPPING_SETTINGS } from './eam3d-mapping-model.js';
import { el, toggleClass, button } from './eam3d-dom.js';

/**
 * @param {Document} doc
 * @param {{
 *   onCatheter: (catheterId: string) => void,
 *   onChamber: (chamber: string) => void,
 *   onToggle: () => void,
 *   onReset: () => void,
 * }} handlers
 */
export function createMappingCard(doc, { onCatheter, onChamber, onToggle, onReset }) {
  const card = el(doc, 'div', 'eam3d-card eam3d-mapping-card', null, { 'data-eam3d-mapping-card': 'true' });
  const head = el(doc, 'div', 'eam3d-card-head');
  const title = el(doc, 'h3', 'eam3d-card-title');
  const resetBtn = button(doc, 'eam3d-btn', { 'data-eam3d-mapping-reset': 'true' });
  resetBtn.addEventListener('click', onReset);
  head.append(title, resetBtn);

  function selectField(ids, attr, onPick) {
    const field = el(doc, 'label', 'eam3d-field');
    const label = el(doc, 'span');
    const select = el(doc, 'select', 'eam3d-select', null, { [attr]: 'true' });
    const options = ids.map((id) => {
      const opt = el(doc, 'option');
      opt.value = id;
      select.appendChild(opt);
      return opt;
    });
    select.addEventListener('change', () => onPick(select.value));
    field.append(label, select);
    return { field, label, select, options };
  }
  const catheter = selectField(MAPPING_CATHETER_IDS, 'data-eam3d-mapping-catheter', onCatheter);
  const chamber = selectField(MAPPING_CHAMBERS, 'data-eam3d-mapping-chamber', onChamber);

  const system = el(doc, 'div', 'eam3d-mapping-system', null, { 'data-eam3d-mapping-system': 'true' });
  const swatch = el(doc, 'span', 'eam3d-mapping-swatch');
  const systemText = el(doc, 'span');
  system.append(swatch, systemText);

  const toggleBtn = button(doc, 'eam3d-btn eam3d-btn--accent eam3d-mapping-go', { 'data-eam3d-mapping-toggle': 'true' });
  toggleBtn.addEventListener('click', onToggle);

  const bar = el(doc, 'div', 'eam3d-mapping-bar');
  const barFill = el(doc, 'span');
  bar.appendChild(barFill);
  const stats = el(doc, 'div', 'eam3d-summary-box', null, { 'data-eam3d-mapping-stats': 'true' });
  const note = el(doc, 'p', 'eam3d-mapping-note');

  card.append(head, catheter.field, chamber.field, system, toggleBtn, bar, stats, note);

  /**
   * @param {{ t: object, catheterId: string, chamber: string, running: boolean, progress: object | null,
   *   unstableCycle: boolean, gradient: string }} view
   */
  function sync({ t, catheterId, chamber: chamberId, running, progress, unstableCycle, gradient }) {
    const text = t.mappingBox;
    const spec = MAPPING_CATHETERS[catheterId];
    title.textContent = text.title;
    resetBtn.textContent = text.reset;
    catheter.label.textContent = text.catheter;
    for (const opt of catheter.options) opt.textContent = text.catheters[opt.value];
    catheter.select.value = catheterId;
    chamber.label.textContent = text.chamber;
    for (const opt of chamber.options) opt.textContent = text.chambers[opt.value];
    chamber.select.value = chamberId;
    // The catheter and chamber are fixed while points are being collected.
    catheter.select.disabled = running;
    chamber.select.disabled = running;

    systemText.textContent = text.systems[spec.system];
    if (swatch.style) swatch.style.background = gradient;

    const s = progress && progress.stats;
    toggleBtn.textContent = running ? text.stop : s && !progress.done ? text.resume : text.start;
    toggleClass(toggleBtn, 'is-running', running);
    if (barFill.style) barFill.style.width = `${s ? s.coveragePct : 0}%`;
    stats.textContent = s
      ? text.stats({
          ...s,
          electrodes: spec.electrodes.length,
          bipoles: spec.bipoles.length,
          seconds: Math.round(s.elapsedMs / 1000),
          fillMm: MAPPING_SETTINGS.fillThresholdMm,
        })
      : text.idle;
    note.textContent = progress && progress.done ? text.done : unstableCycle ? text.afNote : text.how;
  }

  return { card, sync };
}

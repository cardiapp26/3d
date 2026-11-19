// RF ablation console of the 3D map: point-by-point lesions along the target
// line (eam3d-rf-model.js) with power, contact force, catheter position and
// auto-stop, the line's gaps and block, the 20-minute wait, safety limits, a
// lesion log and a readout over the 3D view (contact, RF, impedance, index).
import { EAM3D_ABLATION_LINES, scenarioSpec } from './eam3d-model.js';
import {
  RF_POWERS,
  RF_SPACINGS_MM,
  RF_FORCE_RANGE,
  RF_BASE_TEMP_C,
  lineTissue,
  defaultLineFor,
  startDelivery,
  stepDelivery,
  stopDelivery,
  deliveryReadout,
  finishDelivery,
  deliverAtOnce,
  evaluateLine,
  blockedLines,
  ageLesions,
  idealLesions,
  lesionGrade,
  pointOnLine,
  unitsPerMm
} from './eam3d-rf-model.js';
import { EAM3D_RF_TEXT } from './eam3d-rf-text.js';
import { EAM3D_TEXT } from './eam3d-text.js';

/** RF seconds per real second, so a 30 s application takes about 7 s on screen. */
export const RF_SPEED = 4;
const GRADE_COLORS = Object.freeze({ durable: '#ef4444', acute: '#f9a8d4', weak: '#94a3b8', pop: '#facc15' });
const ESOPHAGUS_COOLING_S = 25;

function el(doc, tag, className, text, attrs = {}) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}
const setClass = (node, cls, on) => {
  const parts = String(node.className || '').split(/\s+/).filter(Boolean).filter((c) => c !== cls);
  node.className = (on ? [...parts, cls] : parts).join(' ');
};
const button = (doc, cls, attrs) => {
  const b = el(doc, 'button', cls, null, { type: 'button', ...attrs });
  b.type = 'button';
  return b;
};
function slider(doc, attrs) {
  const input = el(doc, 'input', '', null, { type: 'range', ...attrs });
  input.type = 'range';
  for (const k of ['min', 'max', 'step', 'value']) if (attrs[k] !== undefined) input[k] = String(attrs[k]);
  return input;
}
const forceClass = (g) => (g < 5 || g > RF_FORCE_RANGE.max ? 'is-bad' : g < RF_FORCE_RANGE.low || g > RF_FORCE_RANGE.high ? 'is-warn' : 'is-good');
const gradeOf = (lesion) => (lesion.pop ? 'pop' : lesionGrade(lesion));

/**
 * @param {Document} doc
 * @param {{ getLang: () => string, getScenario: () => string, getLevers: () => object,
 *   onChange: (s: { blocked: Set<string>, lesions3d: object[], target: string }) => void,
 *   onTip: (pos: number[]|null) => void, onFocus?: () => void, leading?: Node | null }} opts
 *   `leading` is placed before the card title (the panel's switch back to the stimulator).
 */
export function createRfConsole(doc, { getLang, getScenario, getLevers, onChange, onTip, onFocus = () => {}, leading = null }) {
  let state = {
    targetLine: defaultLineFor(getScenario()),
    scenario: getScenario(),
    userPicked: false,
    powerW: 35,
    forceG: 12,
    positionMm: Math.min(2, EAM3D_ABLATION_LINES[defaultLineFor(getScenario())].lengthMm / 2),
    spacingMm: 5,
    autoStop: true,
    lesions: [],
    delivery: null,
    lastStop: null,
    esophagusC: RF_BASE_TEMP_C,
    waitedLost: null,
    nextId: 1,
    seed: 1
  };
  const patch = (next) => { state = { ...state, ...next }; };
  const langKey = () => (getLang() === 'en' ? 'en' : 'tr');
  const text = () => EAM3D_RF_TEXT[langKey()];
  const lineNames = () => EAM3D_TEXT[langKey()].ablationBox.lines;
  const line = () => EAM3D_ABLATION_LINES[state.targetLine];

  // ---- Card -------------------------------------------------------------
  const card = el(doc, 'div', 'eam3d-card eam3d-rf-card', null, { 'data-eam3d-rf-console': 'true' });
  card.addEventListener('pointerdown', () => onFocus());
  const head = el(doc, 'div', 'eam3d-card-head');
  const title = el(doc, 'h3', 'eam3d-card-title');
  const clearBtn = button(doc, 'eam3d-btn eam3d-btn--danger', { 'data-eam3d-clear-lesions': 'true' });
  head.append(title, clearBtn);

  const targetLabel = el(doc, 'label', 'eam3d-rf-field');
  const targetText = el(doc, 'span', 'eam3d-rf-label');
  const targetSelect = el(doc, 'select', 'eam3d-select', null, { 'data-eam3d-rf-target': 'true' });
  const targetOptions = Object.keys(EAM3D_ABLATION_LINES).map((id) => {
    const opt = el(doc, 'option', '', id, { value: id });
    opt.value = id;
    targetSelect.appendChild(opt);
    return opt;
  });
  targetLabel.append(targetText, targetSelect);
  const meta = el(doc, 'div', 'eam3d-list-meta', null, { 'data-eam3d-rf-meta': 'true' });
  const hazard = el(doc, 'p', 'eam3d-rf-hazard', null, { 'data-eam3d-rf-hazard': 'true' });

  const powerRow = el(doc, 'div', 'eam3d-rf-field');
  const powerText = el(doc, 'span', 'eam3d-rf-label');
  const powerPills = el(doc, 'div', 'eam3d-rf-pills');
  const powerBtns = new Map(RF_POWERS.map((w) => {
    const b = button(doc, 'eam3d-rf-pill', { 'data-eam3d-rf-power': w });
    powerPills.appendChild(b);
    return [w, b];
  }));
  powerRow.append(powerText, powerPills);

  const forceRow = el(doc, 'label', 'eam3d-rf-field');
  const forceText = el(doc, 'span', 'eam3d-rf-label');
  const forceInput = slider(doc, { min: RF_FORCE_RANGE.min, max: RF_FORCE_RANGE.max, step: 1, value: state.forceG, 'data-eam3d-rf-force': 'true' });
  const forceVal = el(doc, 'span', 'eam3d-rf-value');
  forceRow.append(forceText, forceInput, forceVal);

  const posRow = el(doc, 'label', 'eam3d-rf-field');
  const posText = el(doc, 'span', 'eam3d-rf-label');
  const posInput = slider(doc, { min: 0, max: line().lengthMm, step: 0.5, value: 0, 'data-eam3d-rf-pos': 'true' });
  const posVal = el(doc, 'span', 'eam3d-rf-value');
  posRow.append(posText, posInput, posVal);

  const spacingRow = el(doc, 'div', 'eam3d-rf-field');
  const spacingText = el(doc, 'span', 'eam3d-rf-label');
  const spacingPills = el(doc, 'div', 'eam3d-rf-pills');
  const spacingBtns = new Map(RF_SPACINGS_MM.map((mm) => {
    const b = button(doc, 'eam3d-rf-pill', { 'data-eam3d-rf-spacing': mm });
    b.textContent = `${mm} mm`;
    spacingPills.appendChild(b);
    return [mm, b];
  }));
  spacingRow.append(spacingText, spacingPills);

  const autoLabel = el(doc, 'label', 'eam3d-check eam3d-rf-auto');
  const autoInput = el(doc, 'input', '', null, { type: 'checkbox', 'data-eam3d-rf-autostop': 'true' });
  autoInput.type = 'checkbox';
  autoInput.checked = state.autoStop;
  const autoText = el(doc, 'span');
  autoLabel.append(autoInput, autoText);

  const actions = el(doc, 'div', 'eam3d-rf-actions');
  const rfBtn = button(doc, 'eam3d-btn eam3d-rf-go', { 'data-eam3d-rf-toggle': 'true' });
  const waitBtn = button(doc, 'eam3d-btn', { 'data-eam3d-rf-wait': 'true' });
  actions.append(rfBtn, waitBtn);

  const statusBox = el(doc, 'div', 'eam3d-summary-box eam3d-rf-status');
  const statusTitle = el(doc, 'strong', 'eam3d-rf-subtitle');
  const statusText = el(doc, 'div', '', null, { 'data-eam3d-ablation-verdict': 'true' });
  statusBox.append(statusTitle, statusText);

  const safetyBox = el(doc, 'div', 'eam3d-rf-safety', null, { 'data-eam3d-rf-safety': 'true' });

  const legend = el(doc, 'div', 'eam3d-rf-legend');
  const legendItems = new Map(Object.entries(GRADE_COLORS).map(([grade, color]) => {
    const item = el(doc, 'span', 'eam3d-rf-legend-item');
    const dot = el(doc, 'i', 'eam3d-rf-dot');
    dot.style.background = color;
    const label = el(doc, 'span');
    item.append(dot, label);
    legend.appendChild(item);
    return [grade, label];
  }));

  const logTitle = el(doc, 'strong', 'eam3d-rf-subtitle');
  const logTable = el(doc, 'table', 'eam3d-rf-log', null, { 'data-eam3d-rf-log': 'true' });
  const demoBtn = button(doc, 'eam3d-btn eam3d-btn--accent eam3d-rf-demo', { 'data-eam3d-rf-demo': 'true' });
  const scope = el(doc, 'p', 'eam3d-rf-scope');

  // Five groups that sit side by side when the console is docked under the 3D view:
  // target line, energy, catheter position, delivery and outcome, lesion log.
  const group = (...nodes) => {
    const col = el(doc, 'div', 'eam3d-rf-col');
    col.append(...nodes);
    return col;
  };
  const logScroll = el(doc, 'div', 'eam3d-rf-log-wrap');
  logScroll.appendChild(logTable);
  card.append(
    group(...(leading ? [leading] : []), head, targetLabel, meta, hazard),
    group(powerRow, forceRow),
    group(posRow, spacingRow, autoLabel),
    group(actions, statusBox, safetyBox),
    group(legend, logTitle, logScroll, demoBtn, scope)
  );

  // ---- Readout over the 3D view -----------------------------------------------------
  const hud = el(doc, 'div', 'eam3d-rf-hud', null, { 'data-eam3d-rf-hud': 'true' });
  hud.hidden = true;
  const hudRows = ['contact', 'rf', 'z', 'index', 'tip', 'esophagus', 'note'].map((key) => {
    const row = el(doc, 'div', `eam3d-rf-hud-row eam3d-rf-hud-${key}`, null, { [`data-eam3d-rf-hud-${key}`]: 'true' });
    hud.appendChild(row);
    return [key, row];
  });
  const hudRow = Object.fromEntries(hudRows);

  // ---- Behaviour --------------------------------------------------------------
  const visuals = () => state.lesions.map((l) => ({
    pos: l.pos,
    color: GRADE_COLORS[gradeOf(l)],
    radius: Math.max(0.022, (l.diameterMm / 2) * unitsPerMm(l.lineId) * 0.55)
  }));
  const tipPos = () => pointOnLine(state.targetLine, state.delivery ? state.delivery.sMm : state.positionMm, state.delivery ? state.delivery.offsetMm : 0);

  function emitChange() {
    onChange({ blocked: blockedLines(state.lesions), lesions3d: visuals(), target: state.targetLine });
    onTip(tipPos());
    render();
  }

  function setTarget(lineId, picked, silent = false) {
    if (!EAM3D_ABLATION_LINES[lineId] || state.delivery) return;
    patch({ targetLine: lineId, userPicked: picked, positionMm: Math.min(2, EAM3D_ABLATION_LINES[lineId].lengthMm / 2), lastStop: null });
    if (silent) render();
    else emitChange();
  }

  function startRf() {
    if (state.delivery) return;
    patch({
      delivery: startDelivery({ lineId: state.targetLine, sMm: state.positionMm, powerW: state.powerW, forceG: state.forceG, seed: state.seed, autoStop: state.autoStop, esophagusC: state.esophagusC }),
      seed: state.seed + 1,
      lastStop: null,
      waitedLost: null
    });
    hud.hidden = false;
    onTip(tipPos());
    render();
  }

  function finishRf() {
    const d = state.delivery;
    if (!d) return;
    const lesion = finishDelivery(d, state.nextId);
    patch({
      lesions: [...state.lesions, lesion],
      nextId: state.nextId + 1,
      delivery: null,
      lastStop: d.stopReason,
      esophagusC: d.esophagusC,
      positionMm: Math.min(line().lengthMm, d.sMm + state.spacingMm)
    });
    emitChange();
  }

  function toggleRf() {
    if (state.delivery) {
      patch({ delivery: stopDelivery(state.delivery) });
      finishRf();
    } else {
      startRf();
    }
  }

  function waitTwentyMinutes() {
    if (state.delivery) return;
    const before = blockedLines(state.lesions);
    const lesions = ageLesions(state.lesions);
    const after = blockedLines(lesions);
    const lost = [...before].filter((id) => !after.has(id));
    patch({ lesions, waitedLost: lost, esophagusC: RF_BASE_TEMP_C, lastStop: null });
    emitChange();
  }

  /**
   * Replace a line's lesions with ideal ones (demo, survey "apply line"). The console then shows
   * that line as its target, so the card, the log and the map describe the same lesion set.
   */
  function applyIdeal(lineId) {
    if (!EAM3D_ABLATION_LINES[lineId] || state.delivery) return;
    const ideal = idealLesions(lineId, state.nextId);
    const picked = lineId !== state.targetLine ? { targetLine: lineId, userPicked: true, positionMm: Math.min(2, EAM3D_ABLATION_LINES[lineId].lengthMm / 2) } : {};
    patch({ ...picked, lesions: [...state.lesions.filter((l) => l.lineId !== lineId), ...ideal], nextId: state.nextId + ideal.length, waitedLost: null, lastStop: null });
    emitChange();
  }

  function clear() {
    patch({ lesions: [], delivery: null, lastStop: null, waitedLost: null, esophagusC: RF_BASE_TEMP_C, positionMm: Math.min(2, line().lengthMm / 2) });
    emitChange();
  }

  targetSelect.addEventListener('change', () => setTarget(targetSelect.value, true));
  powerBtns.forEach((b, w) => b.addEventListener('click', () => { if (!state.delivery) { patch({ powerW: w }); render(); } }));
  forceInput.addEventListener('input', () => { patch({ forceG: Number(forceInput.value) || 0 }); render(); });
  posInput.addEventListener('input', () => {
    if (state.delivery) return;
    patch({ positionMm: Number(posInput.value) || 0 });
    onTip(tipPos());
    render();
  });
  spacingBtns.forEach((b, mm) => b.addEventListener('click', () => { patch({ spacingMm: mm }); render(); }));
  autoInput.addEventListener('change', () => { patch({ autoStop: autoInput.checked }); render(); });
  rfBtn.addEventListener('click', toggleRf);
  waitBtn.addEventListener('click', waitTwentyMinutes);
  demoBtn.addEventListener('click', () => applyIdeal(state.targetLine));
  clearBtn.addEventListener('click', clear);

  /** Advance a running application (RF_SPEED x real time) and let the oesophagus cool between lesions. */
  function tick(dtMs) {
    const dt = (Math.max(0, dtMs) / 1000) * RF_SPEED;
    if (state.delivery) {
      patch({ delivery: stepDelivery(state.delivery, dt) });
      if (state.delivery.stopReason) finishRf();
      else renderHud();
    } else if (state.esophagusC > RF_BASE_TEMP_C + 0.05) {
      patch({ esophagusC: RF_BASE_TEMP_C + (state.esophagusC - RF_BASE_TEMP_C) * Math.exp(-dt / ESOPHAGUS_COOLING_S) });
      renderHud();
      renderSafety();
    }
  }

  /** Follow the scenario's own line unless one was picked; the panel redraws the map itself. */
  function setScenario(scenarioId) {
    if (scenarioId === state.scenario) return;
    patch({ scenario: scenarioId });
    if (!state.userPicked && !state.delivery) setTarget(defaultLineFor(scenarioId), false, true);
  }

  // ---- Rendering ----------------------------------------------------------------
  function renderHud() {
    const t = text().hud;
    const tissue = lineTissue(state.targetLine);
    const last = state.lesions[state.lesions.length - 1];
    const d = state.delivery;
    const r = d ? deliveryReadout(d) : null;
    const cf = r ? r.cf : state.forceG;
    hudRow.contact.textContent = `${t.contact} ${cf} g`;
    hudRow.contact.className = `eam3d-rf-hud-row eam3d-rf-hud-contact ${forceClass(cf)}`;
    hudRow.rf.textContent = d ? `${t.rfOn} ${state.powerW} W · ${r.t.toFixed(1)} s` : `${t.rfOff} ${state.powerW} W`;
    setClass(hudRow.rf, 'is-on', Boolean(d));
    hudRow.z.textContent = r ? `Z ${r.z} Ω · ΔZ ${r.dZ >= 0 ? '-' : '+'}${Math.abs(r.dZ)}` : last ? `Z ${112 - last.dZ} Ω · ΔZ -${last.dZ}` : 'Z 112 Ω';
    const index = r ? r.index : last ? last.index : 0;
    const depth = r ? r.depthMm : last ? last.depthMm : 0;
    hudRow.index.textContent = `${t.index} ${index} (${t.depth} ${depth.toFixed(1)} mm) · ${tissue.target[0]}-${tissue.target[1]}`;
    setClass(hudRow.index, 'is-good', index >= tissue.target[0]);
    hudRow.tip.textContent = `${t.tip} ${r ? r.tipC.toFixed(1) : '36.8'} °C`;
    const esoC = r ? r.esophagusC : state.esophagusC;
    hudRow.esophagus.hidden = tissue.hazard !== 'esophagus' && esoC < RF_BASE_TEMP_C + 0.1;
    hudRow.esophagus.textContent = `${t.esophagus} ${esoC.toFixed(1)} °C`;
    setClass(hudRow.esophagus, 'is-bad', esoC >= 38.5);
    const note = d?.junctional ? text().junctional : '';
    hudRow.note.hidden = !note;
    hudRow.note.textContent = note;
  }

  function renderSafety() {
    const t = text();
    const tissue = lineTissue(state.targetLine);
    const items = [];
    if (tissue.hazard === 'esophagus' || state.esophagusC > RF_BASE_TEMP_C + 0.1) items.push(['', `${t.esophagus}: ${state.esophagusC.toFixed(1)} °C`]);
    if (state.lastStop && state.lastStop !== 'target') items.push([['pop', 'esophagus', 'avblock'].includes(state.lastStop) ? 'is-bad' : '', t.stopReasons[state.lastStop]]);
    if (state.delivery?.junctional) items.push(['is-good', t.junctional]);
    if (state.forceG < 5) items.push(['is-warn', t.lowContact]);
    if (state.forceG > RF_FORCE_RANGE.high) items.push(['is-warn', t.highContact]);
    if (!items.length) items.push(['', t.safetyOk]);
    safetyBox.replaceChildren(el(doc, 'strong', 'eam3d-rf-subtitle', t.safetyTitle), ...items.map(([cls, msg]) => el(doc, 'p', cls, msg)));
  }

  function renderStatus() {
    const t = text();
    const names = lineNames();
    const r = evaluateLine(state.targetLine, state.lesions);
    const lines = [];
    if (!r.lesions && !r.missed) {
      lines.push(t.noLesions);
    } else {
      lines.push(t.status(r));
      if (r.gaps.length) lines.push(t.gaps(r.gaps.map((g) => (g.fromMm === g.toMm ? `~${g.fromMm} mm` : `${g.fromMm}-${g.toMm} mm`)).join(', ')));
      if (r.complete) {
        lines.push(t.blocked);
        const scenario = getScenario();
        if (scenario !== 'sinus') {
          const ended = scenarioSpec(scenario, getLevers(), blockedLines(state.lesions)).id === 'sinus';
          lines.push(ended ? t.terminated : t.notTerminated);
        }
      }
    }
    if (state.waitedLost) lines.push(t.waited(state.waitedLost.map((id) => names[id] || id)));
    statusText.replaceChildren(...lines.map((s) => el(doc, 'p', '', s)));
    setClass(statusBox, 'is-blocked', r.complete);
  }

  function renderLog() {
    const t = text();
    const rows = state.lesions.filter((l) => l.lineId === state.targetLine).slice(-6).reverse();
    const headRow = el(doc, 'tr');
    t.logHead.forEach((h) => headRow.appendChild(el(doc, 'th', '', h)));
    const body = rows.map((l) => {
      const tr = el(doc, 'tr', `is-${gradeOf(l)}`);
      [l.id, l.sMm.toFixed(1), l.powerW, l.forceG, l.seconds.toFixed(1), l.index, `${l.depthMm.toFixed(1)} mm`].forEach((v) => tr.appendChild(el(doc, 'td', '', v)));
      return tr;
    });
    logTable.replaceChildren(headRow, ...body);
    logTable.hidden = rows.length === 0;
    logTitle.hidden = rows.length === 0;
  }

  function render() {
    const t = text();
    const names = lineNames();
    const ln = line();
    const tissue = lineTissue(state.targetLine);
    const busy = Boolean(state.delivery);
    title.textContent = t.title;
    clearBtn.textContent = t.clear;
    targetText.textContent = t.target;
    targetOptions.forEach((opt) => { opt.textContent = names[opt.value] || opt.value; });
    targetSelect.value = state.targetLine;
    targetSelect.disabled = busy;
    meta.textContent = t.lineMeta(ln.chamber.toUpperCase(), ln.lengthMm, tissue.wallMm, tissue.target[0], tissue.target[1]);
    hazard.textContent = t.hazards[tissue.hazard] || '';
    hazard.hidden = !hazard.textContent;
    powerText.textContent = t.power;
    powerBtns.forEach((b, w) => {
      b.textContent = w >= 50 ? `${w} W ${t.hpsd}` : `${w} W`;
      setClass(b, 'is-active', state.powerW === w);
      b.disabled = busy;
    });
    forceText.textContent = `${t.force} (${t.forceAdvice})`;
    forceInput.value = String(state.forceG);
    forceVal.textContent = `${state.forceG} g`;
    forceVal.className = `eam3d-rf-value ${forceClass(state.forceG)}`;
    posText.textContent = t.position;
    posInput.max = String(ln.lengthMm);
    posInput.value = String(state.positionMm);
    posInput.disabled = busy;
    posVal.textContent = `${state.positionMm.toFixed(1)} / ${ln.lengthMm} mm`;
    spacingText.textContent = t.spacing;
    spacingBtns.forEach((b, mm) => setClass(b, 'is-active', state.spacingMm === mm));
    autoText.textContent = t.autoStop;
    autoInput.checked = state.autoStop;
    rfBtn.textContent = `${busy ? t.stop : t.start} (${t.spaceHint})`;
    setClass(rfBtn, 'is-on', busy);
    waitBtn.textContent = t.wait;
    waitBtn.disabled = busy || !state.lesions.length;
    statusTitle.textContent = t.statusTitle;
    legendItems.forEach((label, grade) => { label.textContent = t.legend[grade]; });
    logTitle.textContent = t.logTitle;
    demoBtn.textContent = t.demo;
    demoBtn.disabled = busy;
    scope.textContent = t.scope;
    renderStatus();
    renderSafety();
    renderLog();
    renderHud();
  }

  return {
    card,
    hud,
    render,
    tick,
    setScenario,
    applyIdeal,
    clear,
    /** Space presses this while the RF card is in use. */
    spaceTarget: () => rfBtn,
    isDelivering: () => Boolean(state.delivery),
    tipPosition: tipPos,
    targetLine: () => state.targetLine,
    getState: () => ({ ...state, blocked: [...blockedLines(state.lesions)], line: evaluateLine(state.targetLine, state.lesions) }),
    /** Test hook: one whole application at the current settings (or overrides), at once. */
    deliverNow(overrides = {}) {
      if (state.delivery) return null;
      const opts = { lineId: state.targetLine, sMm: state.positionMm, powerW: state.powerW, forceG: state.forceG, seed: state.seed, autoStop: state.autoStop, esophagusC: state.esophagusC, ...overrides };
      const { lesion, delivery } = deliverAtOnce(opts, state.nextId);
      patch({
        lesions: [...state.lesions, lesion],
        nextId: state.nextId + 1,
        seed: state.seed + 1,
        lastStop: delivery.stopReason,
        esophagusC: delivery.esophagusC,
        waitedLost: null,
        positionMm: Math.min(EAM3D_ABLATION_LINES[opts.lineId].lengthMm, lesion.sMm + state.spacingMm)
      });
      emitChange();
      return lesion;
    }
  };
}

/*
 * Stimulator bar of the 3D EAM workstation: run / freeze, pacing mode (PACE, BURST, S1-S2),
 * cycle lengths, pacing channel, the Deliver button and the verdict line.
 * It keeps the stimulator settings and hands a ready maneuver to the panel on Deliver.
 */
import { PACING_CHANNELS } from './eam3d-model.js';
import { el, toggleClass, button, numericInput } from './eam3d-dom.js';

const STIM_MODES = Object.freeze(['pace', 'burst', 's1s2']);
const BCL_LIMITS = Object.freeze({ min: 160, max: 1000, step: 10, fallback: 240 });
const S2_LIMITS = Object.freeze({ min: 160, max: 600, step: 10, fallback: 270 });

const clampMs = (raw, limits) => Math.max(limits.min, Math.min(limits.max, Number(raw) || limits.fallback));

/**
 * @param {Document} doc
 * @param {{
 *   onToggleRun: () => void,
 *   onDeliver: (maneuver: { mode: string, channelId: string, bclMs: number, s2Ms: number }) => void,
 *   onOpenRf: () => void,
 * }} handlers
 */
export function createStimBar(doc, { onToggleRun, onDeliver, onOpenRf }) {
  let settings = { stimMode: 'burst', stimBclMs: BCL_LIMITS.fallback, stimS2Ms: S2_LIMITS.fallback, stimChannel: 'rv-d' };

  const bar = el(doc, 'div', 'eam3d-stimbar', null, { 'data-eam3d-stimbar': 'true' });
  const controls = el(doc, 'div', 'eam3d-stim-controls');

  const runButton = button(doc, 'eam3d-stim-run', { 'data-eam3d-run': 'true' });
  runButton.addEventListener('click', onToggleRun);
  controls.appendChild(runButton);

  const modeButtons = new Map();
  const syncModes = () => modeButtons.forEach((btn, mode) => toggleClass(btn, 'is-active', settings.stimMode === mode));
  for (const mode of STIM_MODES) {
    const btn = button(doc, 'eam3d-btn', { 'data-eam3d-stim-mode': mode });
    btn.addEventListener('click', () => {
      settings = { ...settings, stimMode: mode };
      syncModes();
    });
    modeButtons.set(mode, btn);
    controls.appendChild(btn);
  }

  function msField(key, limits, attr) {
    const wrap = el(doc, 'label', 'eam3d-stim-field');
    const label = el(doc, 'span');
    const input = numericInput(doc, 'number', { ...limits, value: settings[key] }, { [attr]: 'true' });
    // Typed values are clamped to the stimulator's range when the field is committed.
    input.addEventListener('change', () => {
      settings = { ...settings, [key]: clampMs(input.value, limits) };
      input.value = String(settings[key]);
    });
    wrap.append(label, input);
    return { wrap, label, input };
  }
  const bcl = msField('stimBclMs', BCL_LIMITS, 'data-eam3d-stim-bcl');
  const s2 = msField('stimS2Ms', S2_LIMITS, 'data-eam3d-stim-s2');

  const channelWrap = el(doc, 'label', 'eam3d-stim-field');
  const channelLabel = el(doc, 'span');
  const channelSelect = el(doc, 'select', '', null, { 'data-eam3d-stim-channel': 'true' });
  for (const ch of PACING_CHANNELS) {
    const opt = el(doc, 'option', '', ch.label);
    opt.value = ch.id;
    channelSelect.appendChild(opt);
  }
  channelSelect.value = settings.stimChannel;
  channelSelect.addEventListener('change', () => {
    settings = { ...settings, stimChannel: channelSelect.value };
  });
  channelWrap.append(channelLabel, channelSelect);

  const deliverButton = button(doc, 'eam3d-btn eam3d-btn--accent', { 'data-eam3d-deliver-stim': 'true' });
  deliverButton.addEventListener('click', () => {
    // Read the fields directly: Deliver may be pressed before a typed value fired `change`.
    settings = { ...settings, stimBclMs: clampMs(bcl.input.value, BCL_LIMITS), stimS2Ms: clampMs(s2.input.value, S2_LIMITS) };
    onDeliver({ mode: settings.stimMode, channelId: settings.stimChannel, bclMs: settings.stimBclMs, s2Ms: settings.stimS2Ms });
  });

  controls.append(bcl.wrap, s2.wrap, channelWrap, deliverButton);
  const verdict = el(doc, 'div', 'eam3d-stim-verdict', null, { 'data-eam3d-stim-verdict': 'true' });
  // The bottom bar holds either the stimulator or the RF console; this switches to RF.
  const rfButton = button(doc, 'eam3d-btn eam3d-dock-switch', { 'data-eam3d-open-rf': 'true' });
  rfButton.addEventListener('click', onOpenRf);
  bar.append(controls, verdict, rfButton);

  /** @param {{ t: object, running: boolean, verdictText: string }} view */
  function sync({ t, running, verdictText }) {
    runButton.textContent = running ? t.stim.stop : t.stim.start;
    toggleClass(runButton, 'is-running', running);
    modeButtons.forEach((btn, mode) => {
      btn.textContent = t.stim.modes[mode] || mode.toUpperCase();
    });
    syncModes();
    bcl.label.textContent = t.stim.bcl;
    s2.label.textContent = t.stim.s2;
    channelLabel.textContent = t.stim.channel;
    deliverButton.textContent = t.stim.deliver;
    rfButton.textContent = t.stim.openRf;
    verdict.textContent = verdictText;
  }

  return { element: bar, runButton, sync, getSettings: () => ({ ...settings }) };
}

/*
 * Tissue lever cards of the 3D EAM workstation: atria, ventricles (with wall layer),
 * His-Purkinje, and the two opacity sliders under the 3D view.
 * The cards never mutate the levers; every change is reported as a patch.
 */
import { DEFAULT_LEVERS, EAM3D_WALL_LAYERS } from './eam3d-model.js';
import { el, toggleClass, button, numericInput, checkbox } from './eam3d-dom.js';

const ATRIA_CHECKS = Object.freeze(['raVisible', 'laVisible', 'highDensityAtria']);
const VENTRICLE_CHECKS = Object.freeze(['ventriclesVisible', 'highDensityVentricles', 'vtStudyMesh']);
const CONDUCTION_CHECKS = Object.freeze(['showConduction', 'conductionParticipates']);
const ATRIA_SLIDERS = Object.freeze({
  atrialCv: { min: 0.35, max: 1.5, step: 0.05 },
  atrialRestitution: { min: 0.4, max: 1.5, step: 0.05 },
  rateAdaptation: { min: 0, max: 1, step: 0.05 },
  afRemodelling: { min: 0, max: 1, step: 0.05 },
});
const VENTRICLE_SLIDERS = Object.freeze({
  ventricularCv: { min: 0.3, max: 1.4, step: 0.05 },
  ventricularRestitution: { min: 0.4, max: 1.5, step: 0.05 },
});
const OPACITY_SLIDERS = Object.freeze({
  myocardiumOpacity: { min: 10, max: 100, step: 5 },
  conductionOpacity: { min: 10, max: 100, step: 5 },
});
// Conduction velocity is shown in mm/ms; the other tissue levers as a percentage.
const VELOCITY_KEYS = new Set(['atrialCv', 'ventricularCv']);

const pickDefaults = (keys) => Object.fromEntries(keys.map((k) => [k, DEFAULT_LEVERS[k]]));

/**
 * @param {Document} doc
 * @param {{ levers: object, onChange: (patch: object) => void }} options
 */
export function createLeverCards(doc, { levers, onChange }) {
  const checks = new Map();
  const sliders = new Map();

  function addChecks(keys, container) {
    for (const key of keys) {
      const control = checkbox(doc, { 'data-eam3d-check': key }, levers[key], (value) => onChange({ [key]: value }));
      checks.set(key, control);
      container.appendChild(control.wrap);
    }
  }

  function addSlider(key, bounds, container) {
    const row = el(doc, 'div', 'eam3d-slider-row');
    const head = el(doc, 'div', 'eam3d-slider-head');
    const label = el(doc, 'span');
    const value = el(doc, 'span');
    head.append(label, value);
    const input = numericInput(doc, 'range', { ...bounds, value: levers[key] }, { 'data-eam3d-slider': key });
    input.addEventListener('input', () => onChange({ [key]: Number(input.value) }));
    row.append(head, input);
    sliders.set(key, { input, label, value });
    container.appendChild(row);
  }

  function cardWithReset(resetAttr, resetKeys) {
    const card = el(doc, 'div', 'eam3d-card');
    const head = el(doc, 'div', 'eam3d-card-head');
    const title = el(doc, 'h3', 'eam3d-card-title');
    const reset = button(doc, 'eam3d-btn', { [resetAttr]: 'true' });
    reset.addEventListener('click', () => onChange(pickDefaults(resetKeys)));
    head.append(title, reset);
    card.appendChild(head);
    return { card, title, reset };
  }

  // Atria
  const atria = cardWithReset('data-eam3d-reset-atria', [...ATRIA_CHECKS, ...Object.keys(ATRIA_SLIDERS)]);
  const atriaChecks = el(doc, 'div', 'eam3d-check-grid');
  addChecks(ATRIA_CHECKS, atriaChecks);
  atria.card.appendChild(atriaChecks);
  for (const [key, bounds] of Object.entries(ATRIA_SLIDERS)) addSlider(key, bounds, atria.card);

  // Ventricles and wall layer
  const ventricles = cardWithReset('data-eam3d-reset-ventricles', [
    ...VENTRICLE_CHECKS,
    'wallLayer',
    ...Object.keys(VENTRICLE_SLIDERS),
  ]);
  const ventricleChecks = el(doc, 'div', 'eam3d-check-grid');
  addChecks(VENTRICLE_CHECKS, ventricleChecks);
  const wallRow = el(doc, 'div', 'eam3d-wall-row');
  const wallButtons = new Map();
  for (const layer of EAM3D_WALL_LAYERS) {
    const btn = button(doc, 'eam3d-wall-btn', { 'data-eam3d-wall': layer });
    btn.addEventListener('click', () => onChange({ wallLayer: layer }));
    wallButtons.set(layer, btn);
    wallRow.appendChild(btn);
  }
  ventricles.card.append(ventricleChecks, wallRow);
  for (const [key, bounds] of Object.entries(VENTRICLE_SLIDERS)) addSlider(key, bounds, ventricles.card);

  // His-Purkinje
  const conductionCard = el(doc, 'div', 'eam3d-card');
  const conductionTitle = el(doc, 'h3', 'eam3d-card-title');
  const conductionChecks = el(doc, 'div', 'eam3d-check-grid');
  addChecks(CONDUCTION_CHECKS, conductionChecks);
  conductionCard.append(conductionTitle, conductionChecks);

  // Opacity sliders that sit under the 3D view
  const opacitySliders = Object.entries(OPACITY_SLIDERS).map(([key, bounds]) => {
    const wrap = el(doc, 'label', 'eam3d-inline-slider');
    const label = el(doc, 'span');
    const input = numericInput(doc, 'range', { ...bounds, value: levers[key] }, { 'data-eam3d-slider': key });
    input.addEventListener('input', () => onChange({ [key]: Number(input.value) }));
    wrap.append(label, input);
    sliders.set(key, { input, label, value: null });
    return wrap;
  });

  /** Refresh labels (language) and control values from the current levers. */
  function sync(current, t) {
    atria.title.textContent = t.atriaBox.title;
    atria.reset.textContent = t.atriaBox.reset;
    ventricles.title.textContent = t.ventriclesBox.title;
    ventricles.reset.textContent = t.ventriclesBox.reset;
    conductionTitle.textContent = t.hisBox.title;

    const checkLabels = {
      raVisible: t.atriaBox.ra,
      laVisible: t.atriaBox.la,
      highDensityAtria: t.atriaBox.hd,
      ventriclesVisible: t.ventriclesBox.visible,
      highDensityVentricles: t.ventriclesBox.hd,
      vtStudyMesh: t.ventriclesBox.vtMesh,
      showConduction: t.hisBox.show,
      conductionParticipates: t.hisBox.participates,
    };
    checks.forEach(({ input, label }, key) => {
      input.checked = Boolean(current[key]);
      label.textContent = checkLabels[key];
    });

    const sliderLabels = {
      atrialCv: t.atriaBox.cv,
      atrialRestitution: t.atriaBox.restitution,
      rateAdaptation: t.atriaBox.rateAdaptation,
      afRemodelling: t.atriaBox.afRemodelling,
      ventricularCv: t.ventriclesBox.cv,
      ventricularRestitution: t.ventriclesBox.restitution,
      myocardiumOpacity: t.viewport.myoOpacity,
      conductionOpacity: t.viewport.condOpacity,
    };
    sliders.forEach(({ input, label, value }, key) => {
      const val = Number(current[key]);
      input.value = String(val);
      label.textContent = sliderLabels[key];
      if (value) value.textContent = VELOCITY_KEYS.has(key) ? val.toFixed(2) : `${Math.round(val * 100)}%`;
    });

    wallButtons.forEach((btn, layer) => {
      btn.textContent = t.ventriclesBox.walls[layer] || layer;
      toggleClass(btn, 'is-active', current.wallLayer === layer);
    });
  }

  return {
    cards: [atria.card, ventricles.card, conductionCard],
    opacitySliders,
    sync,
  };
}

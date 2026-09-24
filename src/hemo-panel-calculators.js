// Editable teaching calculators for the hemodynamics panel (Fick, Gorlin,
// shunt oximetry, resistances). Pure arithmetic lives in hemo-formulas.js;
// this module only builds the form, prefills it from the scenario and shows
// the live results. Teaching arithmetic, not a diagnostic device.

import { STATION_INFO } from './hemodynamics.js';
import {
  GORLIN_AORTIC, GORLIN_MITRAL, assumedVo2, bodySurfaceArea, cardiacIndex, diastolicPulmonaryGradient,
  fickOutput, gorlinArea, hakkiArea, mixedVenousSaturation, oximetryStepUp, pvrDyn, pvrWood, qpQs, svrDyn,
  transpulmonaryGradient
} from './hemo-formulas.js';

const CALC_TEXT = {
  tr: {
    calcTitle: 'Hesaplayıcılar', na: 'yok',
    fick: 'Fick kalp debisi', height: 'Boy (cm)', weight: 'Kilo (kg)', hb: 'Hb (g/dL)', sao2: 'SaO2 (%)', svo2: 'SvO2 (%)',
    bsa: 'VYA, Mosteller (m²)', vo2: 'VO2 varsayılan (mL/dk)', coOut: 'Kalp debisi (L/dk)', ciOut: 'Kardiyak indeks (L/dk/m²)',
    gorlin: 'Gorlin kapak alanı', co: 'Kalp debisi (L/dk)', hr: 'Nabız (atım/dk)', grad: 'Ortalama gradyan (mmHg)',
    period: 'SEP / DFP (s)', constant: 'Gorlin sabiti', aortic: 'Aort (44.3)', mitral: 'Mitral (37.7)',
    area: 'Kapak alanı, Gorlin (cm²)', hakki: 'Kapak alanı, Hakki (cm²)',
    shunt: 'Oksimetri ve şant', svc: 'SVC (%)', ivc: 'IVC (%)', ra: 'RA (%)', rv: 'RV (%)', pa: 'PA (%)', pv: 'PV (%)', ao: 'Ao (%)',
    mv: 'Karışık venöz satürasyon (%)', stepUp: 'Basamak artışı', qpqs: 'Şant oranı (Qp/Qs)',
    res: 'Dirençler', mpap: 'Ort. PA basıncı (mmHg)', pcwp: 'Kama basıncı, PCWP (mmHg)', pad: 'PA diyastolik (mmHg)',
    map: 'Ort. arter basıncı (mmHg)', rap: 'RA ortalama (mmHg)',
    pvrWu: 'PVR (WU)', pvrDyn: 'PVR (dyn·s·cm⁻⁵)', svr: 'SVR (dyn·s·cm⁻⁵)', tpg: 'Transpulmoner gradyan (mmHg)',
    dpg: 'Diyastolik pulmoner gradyan (mmHg)',
    levels: { atrial: 'atriyal', ventricular: 'ventriküler', 'great-artery': 'büyük arter' }
  },
  en: {
    calcTitle: 'Calculators', na: 'n/a',
    fick: 'Fick cardiac output', height: 'Height (cm)', weight: 'Weight (kg)', hb: 'Hb (g/dL)', sao2: 'SaO2 (%)', svo2: 'SvO2 (%)',
    bsa: 'BSA, Mosteller (m²)', vo2: 'Assumed VO2 (mL/min)', coOut: 'Cardiac output (L/min)', ciOut: 'Cardiac index (L/min/m²)',
    gorlin: 'Gorlin valve area', co: 'Cardiac output (L/min)', hr: 'Heart rate (bpm)', grad: 'Mean gradient (mmHg)',
    period: 'SEP / DFP (s)', constant: 'Gorlin constant', aortic: 'Aortic (44.3)', mitral: 'Mitral (37.7)',
    area: 'Valve area, Gorlin (cm²)', hakki: 'Valve area, Hakki (cm²)',
    shunt: 'Oximetry and shunt', svc: 'SVC (%)', ivc: 'IVC (%)', ra: 'RA (%)', rv: 'RV (%)', pa: 'PA (%)', pv: 'PV (%)', ao: 'Ao (%)',
    mv: 'Mixed venous saturation (%)', stepUp: 'Step-up', qpqs: 'Shunt ratio (Qp/Qs)',
    res: 'Resistances', mpap: 'Mean PA pressure (mmHg)', pcwp: 'Wedge, PCWP (mmHg)', pad: 'PA diastolic (mmHg)',
    map: 'Mean arterial pressure (mmHg)', rap: 'RA mean (mmHg)',
    pvrWu: 'PVR (WU)', pvrDyn: 'PVR (dyn·s·cm⁻⁵)', svr: 'SVR (dyn·s·cm⁻⁵)', tpg: 'Transpulmonary gradient (mmHg)',
    dpg: 'Diastolic pulmonary gradient (mmHg)',
    levels: { atrial: 'atrial', ventricular: 'ventricular', 'great-artery': 'great artery' }
  }
};

/** Number formatter shared by the panel: fixed decimals, infinity sign, n/a. */
export function fmt(value, digits = 1, lang = 'tr') {
  if (value === Infinity) return '∞';
  if (!Number.isFinite(value)) return CALC_TEXT[lang === 'en' ? 'en' : 'tr'].na;
  return value.toFixed(digits);
}

/** Localized oximetry step-up description, or the n/a word. */
export function stepUpLabel(stepUp, lang = 'tr') {
  const T = CALC_TEXT[lang === 'en' ? 'en' : 'tr'];
  if (!stepUp) return T.na;
  return `${T.levels[stepUp.level] || stepUp.level} (+${fmt(stepUp.rise, 0)}%)`;
}

const METRIC_TEXT = {
  tr: {
    kinds: { vent: 's/EDP/ort', art: 's/d/ort', atr: 'a/v/ort' },
    ci: ['CI (L/dk/m²)', 'Kardiyak indeks (VYA 1.9 m²)'], sv: ['SV (mL)', 'Atım hacmi'],
    pvrWu: ['PVR (WU)', 'Pulmoner vasküler direnç'], pvrDyn: ['PVR (dyn·s·cm⁻⁵)', 'Pulmoner vasküler direnç'],
    svr: ['SVR (dyn·s·cm⁻⁵)', 'Sistemik vasküler direnç'], tpg: ['TPG (mmHg)', 'Transpulmoner gradyan'],
    dpg: ['DPG (mmHg)', 'Diyastolik pulmoner gradyan'], raPcwp: ['RA/PCWP', 'Sağ atriyum / kama basıncı oranı'],
    edp: ['LVEDP − RVEDP (mmHg)', 'Diyastolik basınç farkı'], mv: ['SvO2 (%)', 'Karışık venöz satürasyon'],
    aoGrad: ['Ao ort. gradyan (mmHg)', 'LV-Ao ortalama gradyan'], ava: ['AVA Gorlin (cm²)', 'Aort kapak alanı'],
    miGrad: ['Mitral ort. gradyan (mmHg)', 'LV-PCWP ortalama gradyan'], mva: ['MVA Gorlin (cm²)', 'Mitral kapak alanı'],
    qpqs: ['Qp/Qs', 'Şant oranı'], stepUp: ['Basamak artışı', 'Oksimetrik basamak artışı']
  },
  en: {
    kinds: { vent: 's/EDP/m', art: 's/d/m', atr: 'a/v/m' },
    ci: ['CI (L/min/m²)', 'Cardiac index (BSA 1.9 m²)'], sv: ['SV (mL)', 'Stroke volume'],
    pvrWu: ['PVR (WU)', 'Pulmonary vascular resistance'], pvrDyn: ['PVR (dyn·s·cm⁻⁵)', 'Pulmonary vascular resistance'],
    svr: ['SVR (dyn·s·cm⁻⁵)', 'Systemic vascular resistance'], tpg: ['TPG (mmHg)', 'Transpulmonary gradient'],
    dpg: ['DPG (mmHg)', 'Diastolic pulmonary gradient'], raPcwp: ['RA/PCWP', 'Right atrial to wedge ratio'],
    edp: ['LVEDP − RVEDP (mmHg)', 'Diastolic pressure difference'], mv: ['SvO2 (%)', 'Mixed venous saturation'],
    aoGrad: ['Ao mean gradient (mmHg)', 'LV-Ao mean gradient'], ava: ['AVA Gorlin (cm²)', 'Aortic valve area'],
    miGrad: ['Mitral mean gradient (mmHg)', 'LV-PCWP mean gradient'], mva: ['MVA Gorlin (cm²)', 'Mitral valve area'],
    qpqs: ['Qp/Qs', 'Shunt ratio'], stepUp: ['Step-up', 'Oximetry step-up']
  }
};
const KIND = { ra: 'atr', pcwp: 'atr', rv: 'vent', lv: 'vent', pa: 'art', ao: 'art' };

/**
 * Metric grid rows [label, value, title] for the shown channels and the scenario.
 * @param {{ hemo: object, metrics: object, channels: string[], lang: 'tr'|'en' }} p
 */
export function metricRows({ hemo, metrics: m, channels, lang }) {
  const T = METRIC_TEXT[lang === 'en' ? 'en' : 'tr'];
  const sc = hemo.getScenario();
  const rows = channels.map(s => {
    const kind = KIND[s];
    const [a, b] = kind === 'atr' ? [sc.stations[s].a, sc.stations[s].v] : [m.systolic[s], m.diastolic[s]];
    const info = STATION_INFO[s];
    return [`${info.short} ${T.kinds[kind]} (mmHg)`, `${fmt(a, 0)}/${fmt(b, 0)}/${fmt(m.means[s], 0)}`, info.label[lang] || info.label.tr];
  });
  const add = (key, value) => rows.push([T[key][0], value, T[key][1]]);
  add('ci', fmt(m.ci, 2, lang)); add('sv', fmt(m.strokeVolume, 0, lang));
  add('pvrWu', fmt(m.pvrWood, 1, lang)); add('pvrDyn', fmt(m.pvrDyn, 0, lang));
  add('svr', fmt(m.svrDyn, 0, lang)); add('tpg', fmt(m.tpg, 1, lang)); add('dpg', fmt(m.dpg, 1, lang));
  add('raPcwp', fmt(m.raPcwpRatio, 2, lang)); add('edp', fmt(m.lvedpMinusRvedp, 1, lang)); add('mv', fmt(m.mixedVenous, 1, lang));
  if (m.areas.aortic != null) { add('aoGrad', fmt(m.gradients.lvAoMean, 1, lang)); add('ava', fmt(m.areas.aortic, 2, lang)); }
  if (m.areas.mitral != null) { add('miGrad', fmt(m.gradients.lvPcwpMean, 1, lang)); add('mva', fmt(m.areas.mitral, 2, lang)); }
  if (m.stepUp) { add('qpqs', fmt(m.qpQs, 2, lang)); add('stepUp', stepUpLabel(m.stepUp, lang)); }
  return rows;
}

const BLOCKS = [
  {
    id: 'fick',
    inputs: [['height', 170], ['weight', 75], ['hb', 14], ['sao2', 97], ['svo2', 75]],
    formula: 'BSA = √(cm × kg / 3600); VO2 = 125 × BSA; CO = VO2 / (Hb × 1.36 × 10 × (SaO2 − SvO2)); CI = CO / BSA',
    compute(v, f) {
      const bsa = bodySurfaceArea(v.height, v.weight);
      const vo2 = assumedVo2(bsa);
      const co = fickOutput({ vo2, hb: v.hb, satArterial: v.sao2, satVenous: v.svo2 });
      return [['bsa', f(bsa, 2)], ['vo2', f(vo2, 0)], ['coOut', f(co)], ['ciOut', f(cardiacIndex(co, bsa))]];
    }
  },
  {
    id: 'gorlin',
    inputs: [['co', 5], ['hr', 72], ['grad', 0], ['period', 0.3], ['constant', GORLIN_AORTIC]],
    formula: 'Area = (CO × 1000 / (HR × SEP|DFP)) / (K × √ΔP), K = 44.3 | 37.7; Hakki ≈ CO / √ΔP',
    compute(v, f) {
      const area = gorlinArea({ flow: v.co, hr: v.hr, period: v.period, meanGradient: v.grad, constant: v.constant });
      return [['area', f(area, 2)], ['hakki', f(hakkiArea(v.co, v.grad), 2)]];
    }
  },
  {
    id: 'shunt',
    inputs: [['svc', 72], ['ivc', 78], ['ra', 75], ['rv', 75], ['pa', 75], ['pv', 98], ['ao', 97]],
    formula: 'MV = (3 × SVC + IVC) / 4; Qp/Qs = (Ao − MV) / (PV − PA)',
    compute(v, f, lang) {
      const mv = mixedVenousSaturation(v.svc, v.ivc);
      const ratio = qpQs({ arterial: v.ao, mixedVenous: mv, pulmonaryVein: v.pv, pulmonaryArtery: v.pa });
      return [['mv', f(mv)], ['stepUp', stepUpLabel(oximetryStepUp(v), lang)], ['qpqs', f(ratio, 2)]];
    }
  },
  {
    id: 'res',
    inputs: [['mpap', 15], ['pcwp', 8], ['pad', 10], ['map', 93], ['rap', 3], ['co', 5]],
    formula: 'PVR = (mPAP − PCWP) / CO; SVR = 80 × (MAP − RA) / CO; TPG = mPAP − PCWP; DPG = PAd − PCWP',
    compute(v, f) {
      return [
        ['pvrWu', f(pvrWood(v.mpap, v.pcwp, v.co))], ['pvrDyn', f(pvrDyn(v.mpap, v.pcwp, v.co), 0)],
        ['svr', f(svrDyn(v.map, v.rap, v.co), 0)], ['tpg', f(transpulmonaryGradient(v.mpap, v.pcwp))],
        ['dpg', f(diastolicPulmonaryGradient(v.pad, v.pcwp))]
      ];
    }
  }
];

function node(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function buildInput(blockId, key, value) {
  const label = node('label', 'hemo-field');
  const caption = node('span', 'hemo-field-label');
  caption.dataset.ck = key;
  let input;
  if (key === 'constant') {
    input = node('select', 'hemo-input');
    for (const [k, v] of [['aortic', GORLIN_AORTIC], ['mitral', GORLIN_MITRAL]]) {
      const opt = node('option');
      opt.value = String(v);
      opt.dataset.ck = k;
      input.append(opt);
    }
  } else {
    input = node('input', 'hemo-input');
    input.type = 'number';
    input.step = 'any';
    input.inputMode = 'decimal';
  }
  input.value = String(value);
  input.name = `${blockId}-${key}`;
  input.dataset.key = key;
  label.append(caption, input);
  return label;
}

/**
 * Build the collapsed calculators block.
 * @param {{ lang?: 'tr'|'en', signal?: AbortSignal }} opts
 * @returns {{ element: HTMLDetailsElement, setLanguage(lang): void, prefill(hemo): void }}
 */
export function createCalculators({ lang: initialLang = 'tr', signal } = {}) {
  let lang = initialLang === 'en' ? 'en' : 'tr';
  let lastMetrics = null;
  const element = node('details', 'hemo-calc');
  const summary = node('summary', 'hemo-calc-title');
  summary.dataset.ck = 'calcTitle';
  element.append(summary);
  const blocks = BLOCKS.map(def => {
    const section = node('section', 'hemo-calc-block');
    const title = node('h4', 'hemo-calc-heading');
    title.dataset.ck = def.id;
    const grid = node('div', 'hemo-grid');
    const inputs = {};
    for (const [key, value] of def.inputs) {
      const field = buildInput(def.id, key, value);
      inputs[key] = field.querySelector('[data-key]');
      grid.append(field);
    }
    const out = node('div', 'hemo-calc-out');
    section.append(title, grid, out, node('p', 'hemo-formula', def.formula));
    element.append(section);
    return { def, section, inputs, out };
  });

  function compute(block) {
    const values = Object.fromEntries(Object.entries(block.inputs).map(([k, input]) => [k, parseFloat(input.value)]));
    const T = CALC_TEXT[lang];
    block.out.textContent = '';
    for (const [key, text] of block.def.compute(values, (v, d) => fmt(v, d, lang), lang)) {
      const row = node('div', 'hemo-calc-row');
      row.append(node('span', 'hemo-metric-label', T[key]), node('b', 'hemo-metric-value', text));
      block.out.append(row);
    }
  }

  function setLanguage(next) {
    lang = next === 'en' ? 'en' : 'tr';
    for (const n of element.querySelectorAll('[data-ck]')) n.textContent = CALC_TEXT[lang][n.dataset.ck];
    blocks.forEach(compute);
  }

  function setValues(block, values) {
    for (const [k, v] of Object.entries(values)) {
      if (block.inputs[k] && Number.isFinite(v)) block.inputs[k].value = String(Math.round(v * 100) / 100);
    }
  }

  function gorlinFor(constant) {
    if (!lastMetrics) return {};
    const mitral = constant === GORLIN_MITRAL;
    const g = lastMetrics.gradients;
    return mitral
      ? { grad: Math.max(0, g.lvPcwpMean), period: lastMetrics.periods.dfp }
      : { grad: Math.max(0, g.lvAoMean), period: lastMetrics.periods.sep };
  }

  /** Prefill every scenario-derived input (body size and Hb are kept). */
  function prefill(hemo) {
    const m = hemo.metrics();
    const sats = hemo.saturations();
    const sc = hemo.getScenario();
    lastMetrics = m;
    const [fick, gorlin, shunt, res] = blocks;
    setValues(fick, { sao2: sats.ao, svo2: sats.pa });
    const constant = m.areas.mitral != null && m.areas.aortic == null ? GORLIN_MITRAL : GORLIN_AORTIC;
    gorlin.inputs.constant.value = String(constant);
    setValues(gorlin, { co: sc.co, hr: sc.hr, ...gorlinFor(constant) });
    setValues(shunt, { svc: sats.svc, ivc: sats.ivc, ra: sats.ra, rv: sats.rv, pa: sats.pa, pv: sats.pv, ao: sats.ao });
    setValues(res, {
      mpap: m.means.pa, pcwp: m.means.pcwp, pad: m.diastolic.pa, map: m.means.ao, rap: m.means.ra, co: sc.co
    });
    blocks.forEach(compute);
  }

  element.addEventListener('input', event => {
    const block = blocks.find(b => b.section.contains(event.target));
    if (!block) return;
    if (block.def.id === 'gorlin' && event.target.dataset.key === 'constant') {
      setValues(block, gorlinFor(parseFloat(event.target.value)));
    }
    compute(block);
  }, { signal });

  setLanguage(lang);
  return { element, setLanguage, prefill };
}

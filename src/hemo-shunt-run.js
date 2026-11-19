// Interactive oximetry ("shunt") run for the hemodynamics panel. The learner
// advances the catheter site by site; each click draws a sample (saturation
// and, where the site has a transducer station, pressure), and the worked
// calculation unlocks as its inputs arrive: mixed venous saturation, step-up,
// Qp/Qs, Fick flows, resistances and where the numbers stand against the
// atrial septal defect closure thresholds. Teaching arithmetic on scenario
// values, not a diagnostic device.

import { ATRIAL_COMMUNICATION_FLAGS } from './hemo-scenarios.js';
import {
  PVR_TREAT_FIRST_WOOD, assumedVo2, fickOutput, mixedVenousSaturation, oximetryStepUp, pulmonaryVenousSaturation,
  pvrWood, qpQs, shuntClosureClass
} from './hemo-formulas.js';
import { fmt, stepUpLabel } from './hemo-panel-calculators.js';

export const RUN_BSA_M2 = 1.9;
export const RUN_HB_G_DL = 14;

/**
 * Sampling sites in the order of a run from the femoral vein. `channel` is the
 * pressure station whose tracing and 3D catheter stage show the site;
 * `needsDefect` marks a site reached only across an atrial communication.
 */
export const RUN_SITES = Object.freeze([
  { id: 'svc', channel: 'ra' },
  { id: 'ivc', channel: 'ra' },
  { id: 'ra', channel: 'ra', pressure: true },
  { id: 'rv', channel: 'rv', pressure: true },
  { id: 'pa', channel: 'pa', pressure: true },
  { id: 'pcwp', channel: 'pcwp', pressure: true, noSaturation: true },
  { id: 'pv', channel: 'pcwp', needsDefect: true },
  { id: 'ao', channel: 'ao', pressure: true }
].map(Object.freeze));

const SITE_BY_ID = Object.freeze(Object.fromEntries(RUN_SITES.map(site => [site.id, site])));

/** True when the scenario has an atrial communication the catheter can cross. */
export function hasAtrialCommunication(hemo) {
  const flags = hemo.flags();
  return ATRIAL_COMMUNICATION_FLAGS.some(flag => flags.has(flag));
}

function sitePressure(siteId, scenario, metrics) {
  const t = scenario.stations;
  if (siteId === 'ra' || siteId === 'pcwp') return { a: t[siteId].a, v: t[siteId].v, mean: metrics.means[siteId] };
  // A ventricle is reported as systolic / end-diastolic; its mean has no use.
  if (siteId === 'rv') return { systolic: metrics.systolic.rv, diastolic: metrics.diastolic.rv };
  return { systolic: metrics.systolic[siteId], diastolic: metrics.diastolic[siteId], mean: metrics.means[siteId] };
}

/**
 * Draw one sample from the scenario.
 * @param {object} hemo hemodynamics model (hemodynamics.js)
 * @param {string} siteId one of RUN_SITES
 * @returns {{ site: string, saturation?: number, pressure?: object }|null} null when the site cannot be reached
 */
export function captureSample(hemo, siteId) {
  const site = SITE_BY_ID[siteId];
  if (!site) return null;
  if (site.needsDefect && !hasAtrialCommunication(hemo)) return null;
  const sample = { site: siteId };
  if (!site.noSaturation) sample.saturation = hemo.saturations()[siteId];
  if (site.pressure) sample.pressure = sitePressure(siteId, hemo.getScenario(), hemo.metrics());
  return sample;
}

/**
 * Worked calculation for the samples drawn so far. Pure; unit tested.
 * @param {{ samples: Object<string, object>, vo2?: number, hb?: number }} p vo2 mL/min, hb g/dL
 * @returns {{ steps: object[], verdict: { class: string, pvrAbove5: boolean }|null }}
 */
export function shuntRunReport({ samples = {}, vo2 = assumedVo2(RUN_BSA_M2), hb = RUN_HB_G_DL } = {}) {
  const sat = id => samples[id]?.saturation;
  const pressure = id => samples[id]?.pressure;
  const step = (id, needs, build) => {
    const missing = needs.filter(site => !samples[site]);
    return missing.length ? { id, ready: false, missing } : { id, ready: true, missing, ...build() };
  };
  const mixedVenous = () => mixedVenousSaturation(sat('svc'), sat('ivc'));
  const pulmonaryVein = () => pulmonaryVenousSaturation({ pulmonaryVein: sat('pv'), arterial: sat('ao') });
  const flows = () => {
    const qs = fickOutput({ vo2, hb, satArterial: sat('ao'), satVenous: mixedVenous() });
    const qp = fickOutput({ vo2, hb, satArterial: pulmonaryVein().value, satVenous: sat('pa') });
    return { qs, qp, shunt: qp - qs };
  };
  const ratio = () => qpQs({
    arterial: sat('ao'), mixedVenous: mixedVenous(), pulmonaryVein: pulmonaryVein().value, pulmonaryArtery: sat('pa')
  });
  const resistance = () => {
    const { qs, qp } = flows();
    const pvr = pvrWood(pressure('pa').mean, pressure('pcwp').mean, qp);
    const svr = (pressure('ao').mean - pressure('ra').mean) / qs;
    return { pvr, svr, pvrSvrRatio: pvr / svr, paspRatio: pressure('pa').systolic / pressure('ao').systolic };
  };
  const steps = [
    step('mv', ['svc', 'ivc'], () => ({ value: mixedVenous() })),
    step('stepUp', ['svc', 'ivc', 'ra', 'rv', 'pa'], () => ({
      value: oximetryStepUp({ svc: sat('svc'), ivc: sat('ivc'), ra: sat('ra'), rv: sat('rv'), pa: sat('pa') })
    })),
    step('ratio', ['svc', 'ivc', 'pa', 'ao'], () => ({ value: ratio(), pulmonaryVein: pulmonaryVein() })),
    step('flows', ['svc', 'ivc', 'pa', 'ao'], flows),
    step('resistance', ['svc', 'ivc', 'ra', 'pa', 'pcwp', 'ao'], resistance)
  ];
  const last = steps[steps.length - 1];
  const verdictClass = last.ready
    ? shuntClosureClass({ qpQs: ratio(), paspRatio: last.paspRatio, pvrSvrRatio: last.pvrSvrRatio })
    : null;
  return {
    steps,
    verdict: verdictClass ? { class: verdictClass, pvrAbove5: last.pvr > PVR_TREAT_FIRST_WOOD } : null
  };
}

const RUN_TEXT = {
  tr: {
    title: 'Şant taraması: örnek al, hesapla, karar ver',
    intro: 'Kateteri femoral venden sırayla ilerletin. Her bölgeye tıklayınca kan örneği alınır, kateter 3B modelde o istasyona gider ve basınç trasesi açılır. Hesap, gereken örnekler tamamlandıkça açılır.',
    next: 'Sıradaki örnek', all: 'Tümünü al', reset: 'Sıfırla', missing: 'eksik', none: 'yok',
    sites: { svc: 'SVC', ivc: 'IVC', ra: 'RA', rv: 'RV', pa: 'PA', pcwp: 'Kama', pv: 'PV / LA', ao: 'Aort' },
    siteHints: {
      svc: 'Süperiyor vena kava', ivc: 'İnferiyor vena kava', ra: 'Sağ atriyum', rv: 'Sağ ventrikül', pa: 'Ana pulmoner arter',
      pcwp: 'Pulmoner kapiller kama basıncı (balon şişik)', pv: 'Defektten geçilerek sol atriyum ve pulmoner ven', ao: 'Aort / arter kan gazı'
    },
    noDefect: 'Atriyal defekt yok: pulmoner vene geçilemez. PV yerine arter satürasyonu kullanılır.',
    mean: 'ort', pressureOnly: 'basınç',
    mv: 'Karışık venöz = (3 × SVC + IVC) / 4', stepUp: 'Basamak artışı (RA ≥ %7, RV/PA ≥ %5)',
    ratio: 'Qp/Qs = (Ao − MV) / (PV − PA)', pvSource: 'PV satürasyonu',
    pvSources: { measured: 'ölçüldü (defektten geçildi)', arterial: 'arter değeri kullanıldı (≥ %95)', assumed: '%98 varsayıldı (arter < %95)' },
    qs: 'Qs, sistemik akım (Fick)', qp: 'Qp, pulmoner akım (Fick)', shunt: 'Şant akımı (Qp − Qs)',
    leftToRight: 'soldan sağa', rightToLeft: 'sağdan sola',
    pvr: 'PVR = (mPAP − PCWP) / Qp', svr: 'SVR = (MAP − RA) / Qs', pvrSvr: 'PVR / SVR', pasp: 'PA sistolik / sistemik sistolik',
    flowUnit: 'L/dk', verdictPending: 'Karar için eksik örnek',
    verdicts: {
      closure: 'Kapatma endike. Qp/Qs ≥ 1,5; PA sistolik basıncı sistemik basıncın yarısından düşük; PVR, SVR\'nin üçte birinden düşük. Sağ boşluk genişlemesi ve siyanoz olmamasıyla birlikte değerlendirilir.',
      case_by_case: 'Olgu bazlı karar. Anlamlı soldan sağa şant var, ancak orta pulmoner hipertansiyon eşlik ediyor (PA sistolik basıncı sistemik basıncın yarısı ile üçte ikisi arasında veya PVR/SVR üçte bir ile üçte iki arasında). Vazoreaktivite testi, PAH tedavisi sonrası yeniden ölçüm ve sol kalp hastalığında balonla test oklüzyon yol gösterir.',
      contraindicated: 'Kapatma önerilmez. PA sistolik basıncı veya PVR sistemik değerin üçte ikisinden yüksek; geri dönüşsüzse defekt debiyi koruyan bir çıkış yoludur. Net sağdan sola şant Eisenmenger fizyolojisini gösterir.',
      right_to_left: 'Net sağdan sola şant var, ağır pulmoner hipertansiyon yok. Neden araştırılır (platipne-ortodeoksi, sağ kalp doluş basıncı artışı); karar erişkin doğumsal kalp hastalığı uzmanıyla verilir.',
      not_significant: 'Hemodinamik olarak anlamlı şant yok (Qp/Qs < 1,5).'
    },
    pvrAbove5: 'PVR > 5 WU: önce hedefe yönelik PAH tedavisi, ardından hemodinami yeniden değerlendirilir.',
    assumptions: `Varsayımlar: VO₂ 125 mL/dk/m², VYA ${RUN_BSA_M2} m², Hb ${RUN_HB_G_DL} g/dL. Gerçek işlemde VO₂ ölçülür ve oda havasında çalışılır; şantta termodilüsyon debisi güvenilmez. Eşikler: 2018 AHA/ACC erişkin doğumsal kalp hastalığı kılavuzu. Eğitim amaçlı sınıflamadır, klinik karar aracı değildir.`
  },
  en: {
    title: 'Shunt run: sample, calculate, decide',
    intro: 'Advance the catheter from the femoral vein site by site. Each click draws a blood sample, moves the catheter to that station in the 3D model and opens its pressure tracing. The calculation unlocks as the samples it needs arrive.',
    next: 'Next sample', all: 'Sample all', reset: 'Reset', missing: 'missing', none: 'none',
    sites: { svc: 'SVC', ivc: 'IVC', ra: 'RA', rv: 'RV', pa: 'PA', pcwp: 'Wedge', pv: 'PV / LA', ao: 'Aorta' },
    siteHints: {
      svc: 'Superior vena cava', ivc: 'Inferior vena cava', ra: 'Right atrium', rv: 'Right ventricle', pa: 'Main pulmonary artery',
      pcwp: 'Pulmonary capillary wedge pressure (balloon inflated)', pv: 'Left atrium and pulmonary vein across the defect', ao: 'Aorta / arterial blood gas'
    },
    noDefect: 'No atrial defect: the pulmonary veins cannot be reached. The arterial saturation stands in for PV.',
    mean: 'm', pressureOnly: 'pressure',
    mv: 'Mixed venous = (3 × SVC + IVC) / 4', stepUp: 'Step-up (RA ≥ 7%, RV/PA ≥ 5%)',
    ratio: 'Qp/Qs = (Ao − MV) / (PV − PA)', pvSource: 'PV saturation',
    pvSources: { measured: 'measured (defect crossed)', arterial: 'arterial value used (≥ 95%)', assumed: '98% assumed (arterial < 95%)' },
    qs: 'Qs, systemic flow (Fick)', qp: 'Qp, pulmonary flow (Fick)', shunt: 'Shunt flow (Qp − Qs)',
    leftToRight: 'left to right', rightToLeft: 'right to left',
    pvr: 'PVR = (mPAP − PCWP) / Qp', svr: 'SVR = (MAP − RA) / Qs', pvrSvr: 'PVR / SVR', pasp: 'PA systolic / systemic systolic',
    flowUnit: 'L/min', verdictPending: 'Samples still needed for the decision',
    verdicts: {
      closure: 'Closure indicated. Qp/Qs ≥ 1.5; PA systolic pressure below half of systemic; PVR below one-third of SVR. Read together with right heart enlargement and the absence of cyanosis.',
      case_by_case: 'Case-by-case decision. The left-to-right shunt is significant but comes with moderate pulmonary hypertension (PA systolic between half and two-thirds of systemic, or PVR/SVR between one-third and two-thirds). Vasoreactivity testing, a re-study after PAH therapy and, with left heart disease, balloon test occlusion guide the decision.',
      contraindicated: 'Closure not recommended. PA systolic pressure or PVR exceeds two-thirds of the systemic value; if irreversible, the defect is the outlet that preserves output. A net right-to-left shunt indicates Eisenmenger physiology.',
      right_to_left: 'Net right-to-left shunt without severe pulmonary hypertension. Look for the cause (platypnea-orthodeoxia, raised right heart filling pressure); the decision belongs with an adult congenital heart disease specialist.',
      not_significant: 'No hemodynamically significant shunt (Qp/Qs < 1.5).'
    },
    pvrAbove5: 'PVR > 5 WU: targeted PAH therapy first, then the hemodynamics are re-assessed.',
    assumptions: `Assumptions: VO₂ 125 mL/min/m², BSA ${RUN_BSA_M2} m², Hb ${RUN_HB_G_DL} g/dL. In a real study VO₂ is measured and the patient breathes room air; thermodilution output is unreliable with a shunt. Thresholds: 2018 AHA/ACC adult congenital heart disease guideline. Teaching classification, not a clinical decision tool.`
  }
};

const VENOUS_RGB = [47, 111, 179];
const ARTERIAL_RGB = [210, 58, 79];
/** Blue-to-red tint for a saturation between 50% and 100%. */
function saturationColor(saturation) {
  const t = Math.min(1, Math.max(0, (saturation - 50) / 50));
  return `rgb(${VENOUS_RGB.map((c, i) => Math.round(c + (ARTERIAL_RGB[i] - c) * t)).join(', ')})`;
}

function node(tag, cls, text, props) {
  const n = Object.assign(document.createElement(tag), props);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function pressureText(pressure, T) {
  const r = v => fmt(v, 0);
  if ('a' in pressure) return `a ${r(pressure.a)} / v ${r(pressure.v)} / ${T.mean} ${r(pressure.mean)}`;
  const pair = `${r(pressure.systolic)}/${r(pressure.diastolic)}`;
  return Number.isFinite(pressure.mean) ? `${pair} (${T.mean} ${r(pressure.mean)})` : pair;
}

/** Rows [label, value] a ready step contributes to the worked calculation. */
function stepRows(step, T, lang) {
  const f = (value, digits) => fmt(value, digits, lang);
  const percent = value => (lang === 'tr' ? `%${f(value, 1)}` : `${f(value, 1)}%`);
  const flow = value => `${f(value, 1)} ${T.flowUnit}`;
  if (step.id === 'mv') return [[T.mv, percent(step.value)]];
  if (step.id === 'stepUp') return [[T.stepUp, step.value ? stepUpLabel(step.value, lang) : T.none]];
  if (step.id === 'ratio') return [[T.ratio, f(step.value, 2)], [T.pvSource, T.pvSources[step.pulmonaryVein.source]]];
  if (step.id === 'flows') {
    const direction = step.shunt >= 0 ? T.leftToRight : T.rightToLeft;
    return [[T.qs, flow(step.qs)], [T.qp, flow(step.qp)], [T.shunt, `${flow(Math.abs(step.shunt))}, ${direction}`]];
  }
  return [
    [T.pvr, `${f(step.pvr, 1)} WU`], [T.svr, `${f(step.svr, 1)} WU`],
    [T.pvrSvr, f(step.pvrSvrRatio, 2)], [T.pasp, f(step.paspRatio, 2)]
  ];
}

/**
 * Build the shunt run block.
 * @param {{ hemo: object, lang?: 'tr'|'en', signal?: AbortSignal, onSample?: (site: object) => void }} opts
 *   onSample receives the RUN_SITES entry just sampled (its `channel` names the pressure station).
 * @returns {{ element: HTMLDetailsElement, setLanguage(lang: string): void, reset(): void,
 *   sample(siteId: string): boolean, sampleAll(): void, getSamples(): object }}
 */
export function createShuntRun({ hemo, lang: initialLang = 'tr', signal, onSample } = {}) {
  if (!hemo) throw new Error('createShuntRun: options.hemo is required');
  let lang = initialLang === 'en' ? 'en' : 'tr';
  let samples = {};
  let lastSite = null;

  const element = node('details', 'hemo-calc hemo-run');
  const summary = node('summary', 'hemo-calc-title');
  const intro = node('p', 'hemo-formula');
  const siteGrid = node('div', 'hemo-run-sites');
  const buttons = Object.fromEntries(RUN_SITES.map(site => {
    const button = node('button', 'hemo-run-site', null, { type: 'button' });
    button.dataset.site = site.id;
    const parts = { name: node('span', 'hemo-run-site-name'), sat: node('b', 'hemo-run-site-sat'), pressure: node('span', 'hemo-run-site-pressure') };
    button.append(parts.name, parts.sat, parts.pressure);
    siteGrid.append(button);
    return [site.id, { button, ...parts }];
  }));
  const actions = node('div', 'hemo-run-actions');
  const nextButton = node('button', 'hemo-preset hemo-run-next', null, { type: 'button' });
  const allButton = node('button', 'hemo-preset', null, { type: 'button' });
  const resetButton = node('button', 'hemo-preset', null, { type: 'button' });
  nextButton.dataset.runAction = 'next';
  allButton.dataset.runAction = 'all';
  resetButton.dataset.runAction = 'reset';
  actions.append(nextButton, allButton, resetButton);
  const stepList = node('div', 'hemo-calc-out hemo-run-steps');
  const verdict = node('div', 'hemo-run-verdict', null, { role: 'status' });
  const assumptions = node('p', 'hemo-formula');
  element.append(summary, intro, siteGrid, actions, stepList, verdict, assumptions);

  const reachable = site => !site.needsDefect || hasAtrialCommunication(hemo);
  const nextSite = () => RUN_SITES.find(site => !samples[site.id] && reachable(site)) || null;

  function renderSites(T) {
    for (const site of RUN_SITES) {
      const { button, name, sat, pressure } = buttons[site.id];
      const sample = samples[site.id];
      const open = reachable(site);
      name.textContent = T.sites[site.id];
      button.title = open ? T.siteHints[site.id] : T.noDefect;
      button.disabled = !open;
      button.classList.toggle('is-done', Boolean(sample));
      button.classList.toggle('is-last', lastSite === site.id);
      button.setAttribute('aria-pressed', String(Boolean(sample)));
      const saturation = sample?.saturation;
      const hasSaturation = Number.isFinite(saturation);
      sat.textContent = hasSaturation ? (lang === 'tr' ? `%${saturation}` : `${saturation}%`) : sample ? T.pressureOnly : '·';
      pressure.textContent = sample?.pressure ? pressureText(sample.pressure, T) : '';
      if (hasSaturation) button.style.setProperty('--hemo-sat', saturationColor(saturation));
      else button.style.removeProperty('--hemo-sat');
    }
  }

  function renderSteps(T, report) {
    const rows = report.steps.flatMap(step => {
      if (step.ready) return stepRows(step, T, lang).map(([label, value]) => ({ label, value, locked: false }));
      const label = step.id === 'flows' ? T.qp : step.id === 'resistance' ? T.pvr : T[step.id];
      return [{ label, value: `${T.missing}: ${step.missing.map(id => T.sites[id]).join(', ')}`, locked: true }];
    });
    stepList.replaceChildren(...rows.map(({ label, value, locked }) => {
      const row = node('div', locked ? 'hemo-calc-row hemo-run-locked' : 'hemo-calc-row');
      row.append(node('span', 'hemo-metric-label', label), node('b', 'hemo-metric-value', value));
      return row;
    }));
  }

  function renderVerdict(T, report) {
    if (!report.verdict) {
      const missing = [...new Set(report.steps.flatMap(step => step.missing))];
      verdict.dataset.class = 'pending';
      verdict.textContent = `${T.verdictPending}: ${missing.map(id => T.sites[id]).join(', ')}`;
      return;
    }
    verdict.dataset.class = report.verdict.class;
    verdict.textContent = [T.verdicts[report.verdict.class], report.verdict.pvrAbove5 ? T.pvrAbove5 : ''].filter(Boolean).join(' ');
  }

  function render() {
    const T = RUN_TEXT[lang];
    const report = shuntRunReport({ samples });
    summary.textContent = T.title;
    intro.textContent = T.intro;
    assumptions.textContent = T.assumptions;
    nextButton.textContent = T.next;
    allButton.textContent = T.all;
    resetButton.textContent = T.reset;
    const upcoming = nextSite();
    nextButton.disabled = !upcoming;
    allButton.disabled = !upcoming;
    renderSites(T);
    renderSteps(T, report);
    renderVerdict(T, report);
  }

  /** Draw the sample at a site; returns false when the site is unknown or unreachable. */
  function sample(siteId, { notify = true } = {}) {
    const drawn = captureSample(hemo, siteId);
    if (!drawn) return false;
    samples = { ...samples, [siteId]: drawn };
    lastSite = siteId;
    render();
    if (notify) onSample?.(SITE_BY_ID[siteId]);
    return true;
  }

  function sampleAll() {
    const pending = RUN_SITES.filter(site => !samples[site.id] && reachable(site));
    pending.forEach((site, i) => sample(site.id, { notify: i === pending.length - 1 }));
  }

  function reset() {
    samples = {};
    lastSite = null;
    render();
  }

  element.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const siteButton = target?.closest('[data-site]');
    if (siteButton && !siteButton.disabled) { sample(siteButton.dataset.site); return; }
    const action = target?.closest('[data-run-action]')?.dataset.runAction;
    if (action === 'next') { const upcoming = nextSite(); if (upcoming) sample(upcoming.id); }
    else if (action === 'all') sampleAll();
    else if (action === 'reset') reset();
  }, { signal });

  render();
  return {
    element,
    setLanguage(next) { lang = next === 'en' ? 'en' : 'tr'; render(); },
    reset,
    sample: siteId => sample(siteId),
    sampleAll,
    getSamples: () => ({ ...samples })
  };
}

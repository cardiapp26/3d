/*
 * Parameter record of the jugular venous pulse module
 * (research/VENOZ_BASINC_FIZIK_MUAYENE_MODUL_RAPORU.md, JVP-05). Every number
 * the curves use is listed with its unit, rationale, source key, version and
 * validation status. Nothing here is measured patient data: the status is
 * either a chosen teaching value or a value awaiting expert review, never
 * "measured" or "clinically validated". The same data-quality label goes on
 * the graph, the text and every export.
 */

export const PARAMETER_VERSION = 'jvp-params-2026-09-30';

/** Allowed validation states. A clinical claim needs data provenance, permission, method and independent validation first. */
export const STATUS = Object.freeze({
  teaching: 'synthetic-teaching',
  review: 'synthetic-expert-review-pending'
});

export const DATA_LABEL = Object.freeze({
  tr: 'Sentetik öğretim verisi: hasta kaydı değil, klinik olarak doğrulanmadı.',
  en: 'Synthetic teaching data: not patient data, not clinically validated.'
});

/** Source keys (full references in jvp-content.js JVP_SOURCES and the report). */
export const SOURCE_KEYS = Object.freeze({
  ranganathan2023: 'Ranganathan N, Sivaciyan V. CJC Open 2023; doi:10.1016/j.cjco.2022.11.016',
  stanford25: 'Stanford Medicine 25: Neck vein examination and wave forms',
  clinicalMethods: 'Clinical Methods, 3rd ed. (NCBI NBK300)',
  merck: 'Merck Manual Professional: tricuspid regurgitation, tricuspid stenosis, cardiovascular examination',
  statpearlsTamponade: 'StatPearls: Cardiac tamponade (NCBI NBK431090)',
  wiese2000: 'Wiese J. The abdominojugular reflux sign. Am J Med 2000; doi:10.1016/S0002-9343(00)00443-5',
  sternalAngle: 'How far is the sternal angle from the mid-right atrium? (PMC1495124)',
  hemoScenarios: 'CARDIA catheterization module, src/hemo-scenarios.js (shared RA mean)',
  none: 'No source: chosen teaching value'
});

const p = (id, scope, value, unit, rationale, source, status = STATUS.teaching) =>
  Object.freeze({ id, scope, value, unit, rationale, source, version: PARAMETER_VERSION, status });

export const JVP_PARAMETERS = Object.freeze([
  // Single-beat patterns (jvp-physiology.js): wave shapes are relative anchors, the mean is the level.
  p('normal.mean', 'normal', 5, 'mmHg', 'RA mean shared with the catheterization module', 'hemoScenarios'),
  p('normal.shape', 'normal', 'a 2.5, c 1.3, x′ -2, v 1.8, y -1.5', 'mmHg relative', 'schematic a > v, visible x′ and y', 'clinicalMethods'),
  p('af.mean', 'af', 6, 'mmHg', 'chosen level', 'none'),
  p('af.shape', 'af', 'no a, no x', 'mmHg relative', 'no organized atrial contraction', 'stanford25'),
  p('tr.mean', 'tr', 12, 'mmHg', 'chosen level for marked TR', 'none'),
  p('tr.shape', 'tr', 'c-v peak 9.5, no x′, y -3', 'mmHg relative', 'systolic regurgitant wave replaces x′', 'merck'),
  p('ts.mean', 'ts', 10, 'mmHg', 'chosen level', 'none'),
  p('ts.shape', 'ts', 'a 10, slow shallow y', 'mmHg relative', 'resistance to atrial emptying', 'merck'),
  p('constriction.mean', 'constriction', 20, 'mmHg', 'RA mean shared with the catheterization module', 'hemoScenarios'),
  p('constriction.shape', 'constriction', 'y -6 early, x′ -4', 'mmHg relative', 'rapid early filling then abrupt halt', 'ranganathan2023'),
  p('tamponade.mean', 'tamponade', 15, 'mmHg', 'RA mean shared with the catheterization module', 'hemoScenarios'),
  p('tamponade.shape', 'tamponade', 'y blunted, x′ -5', 'mmHg relative', 'early diastolic filling restricted', 'statpearlsTamponade'),
  p('cannon.mean', 'cannon', 6, 'mmHg', 'chosen level', 'none'),
  p('respiration.shift', 'spontaneous', 3, 'mmHg', 'spontaneous inspiration lowers the level (Kussmaul: raises it)', 'merck'),
  p('bedside.sternalAngle', 'units', 5, 'cm', 'sternal angle above the RA, varies with build and position', 'sternalAngle'),
  p('bedside.cmPerMmHg', 'units', 1.36, 'cmH2O/mmHg', 'unit conversion', 'none'),
  // Rhythm strips (jvp-timeline.js).
  p('af.rrRange', 'rhythm-af', '0.45–1.10', 's', 'irregularly irregular ventricular response; limits to be set by an expert', 'none', STATUS.review),
  p('af.seed', 'rhythm-af', 7, '', 'fixed seed: the same seed gives the same RR sequence', 'none'),
  p('avd.ventricularRate', 'rhythm-avd', 40, 'bpm', 'escape rhythm in complete AV block', 'none', STATUS.review),
  p('avd.atrialRate', 'rhythm-avd', 75, 'bpm', 'independent sinus P waves', 'none', STATUS.review),
  p('avd.contractionDelay', 'rhythm-avd', 'template pPeak to mid atrial systole at the atrial rate (about 0.1)', 's', 'schematic electromechanical delay; the same for the JVP a/cannon waves and the 3D atria', 'none'),
  p('avd.aAmplitude', 'rhythm-avd', 2.5, 'mmHg', 'atrial contraction with the tricuspid valve open', 'none'),
  p('avd.cannonAmplitude', 'rhythm-avd', 10, 'mmHg', 'atrial contraction against the closed tricuspid valve', 'stanford25', STATUS.review),
  // Abdominojugular test (jvp-timeline.js AJR_PROTOCOL).
  p('ajr.compression', 'ajr', 10, 's', 'firm periumbilical pressure, protocol duration', 'wiese2000'),
  p('ajr.abdominalPressure', 'ajr', '20–35', 'mmHg', 'applied pressure range of the protocol', 'wiese2000'),
  p('ajr.threshold', 'ajr', 4, 'cm', 'sustained rise and fall on release', 'wiese2000', STATUS.review),
  p('ajr.transientPeak', 'ajr', 4, 'mmHg', 'normal: brief early rise that fades while pressure continues', 'none', STATUS.review),
  p('ajr.sustainedRise', 'ajr', 5, 'mmHg', 'elevated filling pressures: rise persists until release', 'none', STATUS.review),
  // Positive pressure ventilation (jvp-timeline.js VENTILATION).
  p('ppv.rate', 'ppv', 12, 'breaths/min', 'controlled ventilation example', 'none'),
  p('ppv.ieRatio', 'ppv', '1:2', '', 'inspiration to expiration', 'none'),
  p('ppv.peep', 'ppv', 5, 'cmH2O', 'default PEEP (0, 5 or 10 selectable)', 'none'),
  p('ppv.plateau', 'ppv', 20, 'cmH2O', 'end-inspiratory airway pressure above atmosphere', 'none'),
  p('ppv.transmission', 'ppv', 0.35, 'fraction', 'share of airway pressure reaching the pleural space; depends on lung and chest wall compliance', 'none', STATUS.review)
]);

/** Parameters of one scope (scenario id or strip mode). */
export function parametersFor(scope) {
  return JVP_PARAMETERS.filter(item => item.scope === scope);
}

/**
 * CSV export of a sampled series. The header carries the data-quality label,
 * the parameter version and the scenario, so a copied file keeps its origin.
 * @param {{ title: string, columns: string[], rows: number[][], scopes: string[] }} data
 */
export function toCsv({ title, columns, rows, scopes }) {
  const params = scopes.flatMap(parametersFor);
  const header = [
    `# CARDIA jugular venous pulse: ${title}`,
    `# ${DATA_LABEL.en}`,
    `# parameters ${PARAMETER_VERSION}; ${params.map(item => `${item.id}=${item.value} ${item.unit} [${item.status}]`).join('; ')}`
  ];
  const body = rows.map(row => row.map(v => (Number.isFinite(v) ? +v.toFixed(4) : '')).join(','));
  return [...header, columns.join(','), ...body].join('\n') + '\n';
}

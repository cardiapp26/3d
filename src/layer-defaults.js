// Checkbox ids and internal mesh flags share this table.
// Reset copies it back so a hidden SVC or an opened phrenic nerve cannot stick.
export const LESSON_TISSUE_OPACITY = 0.28;

export const LEAFLET_VISIBILITY_IDS = Object.freeze([
  'mitral-posterior',
  'mitral-anterior',
  'tricuspid-septal',
  'tricuspid-inferior',
  'tricuspid-anterior'
]);

export const VEIN_VISIBILITY_IDS = Object.freeze([
  'cs',
  'gcv',
  'mcv',
  'piv',
  'pv',
  'lspv',
  'lipv',
  'rspv',
  'ripv',
  'svc',
  'ivc',
  'cardiac-veins'
]);

export const LAYER_DEFAULTS = Object.freeze({
  chambers: true,
  lv: true,
  rv: true,
  la: true,
  ra: true,
  vessels: true,
  coronaries: true,
  valves: true,
  'aortic-valve': true,
  lcc: true,
  rcc: true,
  ncc: true,
  mitral: true,
  tricuspid: true,
  'mitral-annulus': true,
  'tricuspid-annulus': true,
  'pulmonary-valve': true,
  'mitral-posterior': true,
  'mitral-anterior': true,
  'tricuspid-septal': true,
  'tricuspid-inferior': true,
  'tricuspid-anterior': true,
  papillary: true,
  'rv-papillary': true,
  'lv-papillary': true,
  veins: true,
  cs: true,
  gcv: true,
  mcv: true,
  piv: true,
  pv: true,
  lspv: true,
  lipv: true,
  rspv: true,
  ripv: true,
  svc: true,
  ivc: true,
  'cardiac-veins': true,
  conduction: true,
  bachmann: true,
  thorax: true,
  diaphragm: true,
  phrenic: false,
  vertebrae: true,
  'pa-faint': false,
  flow: false
});

export function applyLayerDefaults(visibility) {
  for (const key of Object.keys(visibility)) {
    if (!Object.prototype.hasOwnProperty.call(LAYER_DEFAULTS, key)) delete visibility[key];
  }
  for (const [key, value] of Object.entries(LAYER_DEFAULTS)) {
    visibility[key] = value;
  }
  return visibility;
}

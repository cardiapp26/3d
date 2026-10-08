import { LEADS, PRECORDIAL } from './ecg12.js';

// Original teaching examples, not patient data. Region numbers link the schematic anatomical
// views to their recordings. With an RBBB-like V1 the precordial transition is read as V1.
const region = (id, number, view, xy, group, v1, axis, transition, leadI, width, local, purkinje = false) =>
  Object.freeze({ id, number, view, xy: Object.freeze(xy), group, v1, axis, transition, leadI, width, local, purkinje });
export const VES_REGIONS = Object.freeze([
  region('rvot-septal', 1, 'base', [196, 66], 'outflow', 'rs', 'inferior', 'late', 'positive', 150, -32),
  region('rvot-free', 2, 'base', [138, 58], 'outflow', 'lbbb', 'inferior', 'late', 'negative', 170, -28),
  region('lvot-cusp', 3, 'base', [204, 130], 'outflow', 'rs', 'inferior', 'early', 'positive', 145, -30),
  region('lv-summit', 4, 'base', [314, 98], 'outflow', 'rbbb', 'inferior', 'positive', 'negative', 170, -24),
  region('para-his', 5, 'base', [164, 185], 'septal', 'lbbb', 'inferior', 'v3', 'positive', 130, -25),
  region('tricuspid', 6, 'base', [60, 258], 'annular', 'lbbb', 'superior', 'late', 'positive', 165, -31),
  region('mitral', 7, 'base', [305, 176], 'annular', 'rbbb', 'inferior', 'positive', 'negative', 160, -29),
  region('papillary-pm', 8, 'chambers', [636, 284], 'papillary', 'rbbb', 'superior', 'positive', 'positive', 165, -27),
  region('papillary-al', 9, 'chambers', [702, 214], 'papillary', 'rbbb', 'inferior', 'positive', 'negative', 160, -26),
  region('fascicle', 10, 'chambers', [606, 232], 'fascicular', 'rbbb', 'superior', 'positive', 'positive', 115, -22, true),
  region('moderator', 11, 'chambers', [540, 244], 'band', 'lbbb', 'superior', 'late', 'positive', 155, -26, true),
  region('crux', 12, 'base', [198, 292], 'inferior', 'lbbb', 'superior', 'early', 'positive', 180, -23)
]);
// Findings in the order of the stepwise approach: axis, lead I, aVL, V1, transition, V6, width.
export const VES_OPTIONS = Object.freeze({
  axis: ['inferior', 'superior', 'disc-ii', 'disc-iii'],
  leadI: ['positive', 'negative', 'biphasic'],
  avl: ['negative', 'r'],
  v1: ['lbbb', 'rs', 'rbbb', 'qr'],
  transition: ['positive', 'early', 'v3', 'late', 'negative'],
  v6: ['gt', 'lt'],
  width: ['narrow', 'wide']
});
/** Examples whose V6 is S dominant (R/S < 1): posteromedial papillary muscle and posterior fascicle. */
const V6_S_DOMINANT = new Set(['papillary-pm', 'fascicle']);
export const VES_INPUTS = Object.freeze(Object.keys(VES_OPTIONS));
export const VES_SOURCES = Object.freeze([
  { id: 'easy', title: 'EasyECG · Easy PVC', url: 'https://www.easy-ecg.com/diagnostic/dUBqGUnQNGjIZA907FT1' },
  { id: 'abstract', title: 'Nageler et al. · EASY-PVC (ESC 2025 abstract)', url: 'https://doi.org/10.1093/eurheartj/ehaf784.621' },
  { id: 'consensus', title: 'HRS/EHRA/APHRS/LAHRS · Ventricular arrhythmias (2019)', url: 'https://doi.org/10.1002/joa3.12185' },
  { id: 'stepwise', title: 'Enriquez et al. · Stepwise 12-lead ECG approach to idiopathic VA origin (Heart Rhythm 2019)', url: 'https://doi.org/10.1016/j.hrthm.2019.04.002' },
  { id: 'ratio', title: 'Betensky et al. · V2 transition ratio (2011)', url: 'https://doi.org/10.1016/j.jacc.2011.01.035' },
  { id: 'asirvatham', title: 'Asirvatham · Outflow tract correlative anatomy (J Cardiovasc Electrophysiol 2009)', url: 'https://doi.org/10.1111/j.1540-8167.2009.01472.x' },
  { id: 'dixit', title: 'Dixit et al. · Septal versus free-wall RVOT ECG patterns (J Cardiovasc Electrophysiol 2003)', url: 'https://doi.org/10.1046/j.1540-8167.2003.02404.x' },
  { id: 'park', title: 'Park, Kim, Marchlinski · Surface ECG localization of idiopathic VT (PACE 2012)', url: 'https://doi.org/10.1111/j.1540-8159.2012.03488.x' },
  { id: 'aortic-root', title: 'John, Ghazizadeh, Ceresnak · Aortic root substrates (Heart Rhythm 2026)', url: 'https://doi.org/10.1016/j.hrthm.2026.01.055' },
  { id: 'egm', title: 'Focal PVC · Local activation annotation (2018)', url: 'https://academic.oup.com/europace/article/20/FI2/f171/4587592' }
]);
export const vesRegion = id => VES_REGIONS.find(r => r.id === id) || null;

// One synthetic beat per region: a smooth QRS (q, R, S lobes; a mid-QRS notch
// for the free-wall example), a short ST segment and a discordant T wave.
// Limb leads obey Einthoven and Goldberger because II and III derive from I/II.
const gauss = (t, center, sigma) => Math.exp(-0.5 * ((t - center) / sigma) ** 2);
export const VES_ECG_STEP = 2;
export const VES_ECG_WINDOW = Object.freeze({ from: -60, to: 460 });
/** QRS of `width` ms starting at t = 0 with R and S amplitudes; `notch` splits the R upstroke. */
export function qrsWave(t, width, r, s, notch = false) {
  const q = 0.06 * Math.max(r, s) * gauss(t, 0.14 * width, 0.05 * width);
  const rLobe = r * (notch ? 0.72 * gauss(t, 0.26 * width, 0.08 * width) + 0.58 * gauss(t, 0.42 * width, 0.08 * width) : gauss(t, 0.33 * width, 0.11 * width));
  const sLobe = s * gauss(t, 0.66 * width, 0.12 * width);
  return rLobe - sLobe - q;
}
/** Discordant T wave: opposite to the dominant QRS deflection, with a slight ST shift. */
const tWave = (t, width, r, s) => {
  const net = r - s;
  const sign = net >= 0 ? -1 : 1;
  const amplitude = 0.32 * Math.max(r, s, 0.3);
  const st = sign * 0.05 * gauss(t, width + 70, 45);   // gentle ST shift into the T wave
  return sign * amplitude * gauss(t, width + 190, 58) + st;
};
const beat = (t, width, r, s, notch) => qrsWave(t, width, r, s, notch) + tWave(t, width, r, s);
// Para-Hisian: frontal axis near 40 degrees, so lead III stays small (Park 2012: a negative III suggests the His region).
const AXIS_OVERRIDE = Object.freeze({ 'para-his': 40 });
/** Frontal-plane QRS axis of an example, degrees (hexaxial: 0 = lead I, +90 = aVF). */
export function vesFrontalAxis(id) {
  const site = vesRegion(id);
  if (!site) return null;
  return AXIS_OVERRIDE[site.id] ?? (site.axis === 'superior' ? (site.leadI === 'negative' ? -110 : -60) : (site.leadI === 'negative' ? 100 : 75));
}
/** Hexaxial angle of each limb lead's positive pole. */
export const LIMB_LEAD_ANGLES = Object.freeze({ I: 0, II: 60, III: 120, aVR: -150, aVL: -30, aVF: 90 });
export function vesEcg(id) {
  const site = vesRegion(id);
  if (!site) return null;
  const t = Array.from({ length: (VES_ECG_WINDOW.to - VES_ECG_WINDOW.from) / VES_ECG_STEP + 1 }, (_, i) => VES_ECG_WINDOW.from + i * VES_ECG_STEP);
  const leads = Object.fromEntries(LEADS.map(l => [l, []]));
  const notch = site.id === 'rvot-free';
  // Limb leads project one frontal-plane vector (axis angle in degrees, hexaxial convention):
  // inferior 75 or 100, superior -60 or -110 depending on lead I. Hence III = II - I exactly,
  // and an inferior axis with a negative lead I has III taller than II (anterior/leftward outflow).
  const theta = vesFrontalAxis(site.id) * Math.PI / 180;
  const LIMB_MV = 1.5;
  const proj = { I: LIMB_MV * Math.cos(theta), II: LIMB_MV * Math.cos(theta - Math.PI / 3) };
  const transition = { early: 2, v3: 3, late: 5, positive: 1, negative: 7 }[site.transition];
  for (const ms of t) {
    const frontal = beat(ms, site.width, 1, .12, notch);
    const I = proj.I * frontal, II = proj.II * frontal;
    const limb = { I, II, III: II - I, aVR: -(I + II) / 2, aVL: I - II / 2, aVF: II - I / 2 };
    for (const l of Object.keys(limb)) leads[l].push(limb[l]);
    PRECORDIAL.forEach((l, i) => {
      let r = i + 1 >= transition ? 1.15 : .22;
      let s = i + 1 >= transition ? .25 : 1.2;
      if (i === 0) {
        r = site.v1 === 'lbbb' ? 0 : site.v1 === 'rs' ? .4 : 1.25;
        s = site.v1 === 'rbbb' ? .25 : 1.15;
      }
      if (l === 'V6' && V6_S_DOMINANT.has(site.id)) { r = .3; s = .95; }
      leads[l].push(beat(ms, site.width, r, s, notch));
    });
  }
  return { t, leads, width: site.width, step: VES_ECG_STEP, from: VES_ECG_WINDOW.from };
}

/** Features are measured from the displayed synthetic QRS (its 0..width window), not its region label. */
export function vesFeatures(id) {
  const ecg = vesEcg(id);
  if (!ecg) return null;
  const inQrs = ecg.t.map(ms => ms >= 0 && ms <= ecg.width);
  const window = lead => ecg.leads[lead].filter((_, i) => inQrs[i]);
  const peaks = lead => ({ r: Math.max(0, ...window(lead)), s: Math.max(0, ...window(lead).map(v => -v)) });
  const sign = lead => { const { r, s } = peaks(lead); return r > s ? 'positive' : s > r ? 'negative' : 'biphasic'; };
  const v = peaks('V1'), avl = peaks('aVL'), v6 = peaks('V6');
  const tr = PRECORDIAL.findIndex((_, i) => PRECORDIAL.slice(i).every(l => { const { r, s } = peaks(l); return r >= s; }));
  const ii = sign('II'), iii = sign('III');
  const axis = ii === 'positive' && iii === 'positive' ? 'inferior' : ii === 'negative' && iii === 'negative' ? 'superior'
    : ii === 'positive' ? 'disc-ii' : 'disc-iii';
  const v1 = v.r < .08 ? 'lbbb' : v.r < v.s ? 'rs' : 'rbbb';
  return {
    axis, leadI: sign('I'),
    // "Any R or r in aVL": an r of at least a quarter of the S counts.
    avl: avl.r >= .25 * avl.s ? 'r' : 'negative',
    v1,
    // RBBB-like V1 (R >= S in V1) reads as transition V1, as in the stepwise approach.
    transition: v1 === 'rbbb' ? 'positive' : tr === -1 ? 'negative' : tr <= 1 ? 'early' : tr === 2 ? 'v3' : 'late',
    v6: v6.r > v6.s ? 'gt' : 'lt',
    width: ecg.width < 130 ? 'narrow' : 'wide'
  };
}

/**
 * Stepwise ECG approach (Enriquez, Baranchuk, Briceno, Saenz, Garcia; Heart Rhythm 2019;16:1538,
 * Figure 3), reduced to this workbook's findings. Nodes ask one finding; leaves name sites.
 * A missing finding keeps every branch below it open, so the reachable sites narrow step by step.
 */
const node = (key, branches) => ({ key, branches });
export const VES_STEPWISE = node('axis', [
  [['inferior'], node('leadI', [
    [['positive', 'biphasic'], node('avl', [
      [['negative'], node('transition', [[['late'], ['posteriorRvot']], [['v3'], ['posteriorRvot', 'rcc']], [['early', 'positive'], ['rcc']]])],
      [['r'], node('transition', [[['late'], ['tvFree']], [['v3', 'early', 'positive'], ['tvSeptum', 'parahis']]])]
    ])],
    [['negative', 'biphasic'], node('transition', [[['late', 'v3'], ['anteriorRvot']], [['early'], ['lcc', 'summit']], [['positive'], ['lcc', 'summit', 'amc', 'topMv', 'apm', 'laf']]])]
  ])],
  [['superior'], node('v1', [
    [['lbbb', 'rs'], node('transition', [[['late'], ['tvFree', 'mb']], [['v3', 'early', 'positive'], ['tvSeptum', 'crux']]])],
    [['rbbb', 'qr'], node('v6', [[['gt'], ['inferiorMv']], [['lt'], ['ppm', 'lpf']]])]
  ])],
  [['disc-ii'], node('transition', [[['early', 'v3'], ['parahis']], [['late'], ['lateralTv', 'mb']]])],
  [['disc-iii'], node('v6', [[['gt'], ['lateralMv']], [['lt'], ['apm']]])]
]);
/** Stepwise sites drawn as teaching examples; sites without an example are listed by name only. */
export const VES_SITE_EXAMPLES = Object.freeze({
  posteriorRvot: ['rvot-septal'], rcc: ['lvot-cusp'], tvFree: ['tricuspid'], tvSeptum: [], parahis: ['para-his'],
  anteriorRvot: ['rvot-free'], lcc: ['lvot-cusp'], summit: ['lv-summit'], amc: [], topMv: ['mitral'], apm: ['papillary-al'], laf: [],
  mb: ['moderator'], crux: ['crux'], inferiorMv: [], ppm: ['papillary-pm'], lpf: ['fascicle'], lateralTv: [], lateralMv: []
});
const uniq = list => [...new Set(list)];
function walk(tree, inputs) {
  if (Array.isArray(tree)) return { sites: tree, required: [], missing: null };
  const value = inputs[tree.key];
  const known = VES_OPTIONS[tree.key].includes(value);
  const branches = known ? tree.branches.filter(([values]) => values.includes(value)) : tree.branches;
  const below = branches.map(([, sub]) => walk(sub, inputs));
  return {
    sites: uniq(below.flatMap(b => b.sites)),
    required: uniq([tree.key, ...(known ? below.flatMap(b => b.required) : [])]),
    missing: known ? below.map(b => b.missing).find(Boolean) || null : tree.key
  };
}
const bundle = v1 => (v1 === 'lbbb' || v1 === 'rs' ? 'lbbb' : v1 === 'rbbb' || v1 === 'qr' ? 'rbbb' : null);

/** Site groups only. No partial-score percentages or definite target. */
export function localizeVes(inputs = {}, { scar = false } = {}) {
  const tree = walk(VES_STEPWISE, inputs);
  const path = tree.required.filter(k => VES_OPTIONS[k].includes(inputs[k])).map(key => ({ key, value: inputs[key] }));
  const base = { path, required: tree.required, scar };
  const conflict = bundle(inputs.v1) === 'lbbb' && inputs.transition === 'positive' || bundle(inputs.v1) === 'rbbb' && inputs.transition === 'negative';
  if (conflict) return { ...base, next: tree.missing, sites: [], candidates: [], status: 'unresolved', conflict: true };
  if (inputs.transition === 'negative') return { ...base, next: null, sites: [], candidates: [], status: 'unresolved' };   // no branch reads negative concordance
  if (!VES_OPTIONS.axis.includes(inputs.axis)) return { ...base, next: 'axis', sites: [], candidates: [], status: 'incomplete' };
  const candidates = uniq(tree.sites.flatMap(site => VES_SITE_EXAMPLES[site]));
  return { ...base, next: tree.missing, sites: tree.sites, candidates, status: tree.missing ? 'incomplete' : tree.sites.length ? 'regions' : 'unresolved' };
}

/** Betensky ratio, restricted to LBBB/inferior-axis PVC with V3 transition. */
export function v2TransitionRatio(inputs, amplitudes) {
  if (inputs.v1 !== 'lbbb' && inputs.v1 !== 'rs' || inputs.axis !== 'inferior' || inputs.transition !== 'v3') return { status: 'outside', value: null };
  const keys = ['pvcR', 'pvcS', 'sinusR', 'sinusS'];
  if (keys.some(k => amplitudes[k] === '' || amplitudes[k] == null || !Number.isFinite(Number(amplitudes[k])) || Number(amplitudes[k]) < 0)) return { status: 'missing', value: null };
  const [r, s, sr, ss] = keys.map(k => Number(amplitudes[k]));
  if (r + s <= 0 || sr <= 0) return { status: 'invalid', value: null };
  const fraction = (a, b) => { const scale = Math.max(a, b); return (a / scale) / (a / scale + b / scale); };
  const value = fraction(r, s) / fraction(sr, ss);
  if (!Number.isFinite(value)) return { status: 'invalid', value: null };
  return { status: value >= .6 ? 'lvot' : 'rvot', value };
}

export const VES_POSITIONS = Object.freeze(['near', 'adjacent', 'remote']);
/** Relative to surface QRS onset at 0 ms. Values deliberately designed for teaching. */
export function vesRecording(id, position = 'near') {
  const site = vesRegion(id);
  if (!site || !VES_POSITIONS.includes(position)) return null;
  const channels = ['his', 'rvot', 'lvot', 'cs', 'abl', 'uni'];
  const near = position === 'near';
  const local = near ? site.local : position === 'adjacent' ? -9 : 18;
  const timings = { his: 20, rvot: 24, lvot: 26, cs: 38, abl: local, uni: local };
  if (id.startsWith('rvot')) timings.rvot = 4;
  if (id === 'lvot-cusp') timings.lvot = 3;
  if (id === 'lv-summit' || id === 'mitral') timings.cs = -8;
  if (id === 'para-his') timings.his = -12;
  const purkinje = site.purkinje ? local - 16 : null;
  return { id, position, channels, timings, local, purkinje, unipolar: near ? 'QS' : 'rS', ecg: vesEcg(id), from: -80, to: 220 };
}

export function recordingValue(recording, channel, t) {
  const onset = recording.timings[channel];
  if (onset == null) return 0;
  const u = t - onset;
  const tent = (x, center, span) => Math.max(0, 1 - Math.abs(x - center) / span);
  if (channel === 'uni') return (recording.unipolar === 'rS' ? .3 * tent(u, -8, 8) : 0) - .9 * tent(u, 8, 8);
  const local = channel === 'abl';
  const sharp = tent(u, 3, 3) - .7 * tent(u, 8, 5);
  const p = local && recording.purkinje != null ? .35 * tent(t, recording.purkinje + 2, 2) : 0;
  return (local ? 1 : .5) * sharp + p;
}

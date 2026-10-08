import { LEADS, PRECORDIAL } from './ecg12.js';

// Original teaching examples, not the EASY-PVC decision tree or patient data.
// Region numbers link the two schematic anatomical views to their recordings.
const region = (id, number, view, xy, group, v1, axis, transition, leadI, width, local, purkinje = false) =>
  Object.freeze({ id, number, view, xy: Object.freeze(xy), group, v1, axis, transition, leadI, width, local, purkinje });
export const VES_REGIONS = Object.freeze([
  region('rvot-septal', 1, 'base', [196, 66], 'outflow', 'lbbb', 'inferior', 'late', 'positive', 150, -32),
  region('rvot-free', 2, 'base', [138, 58], 'outflow', 'lbbb', 'inferior', 'late', 'positive', 170, -28),
  region('lvot-cusp', 3, 'base', [204, 130], 'outflow', 'rs', 'inferior', 'early', 'positive', 145, -30),
  region('lv-summit', 4, 'base', [314, 98], 'outflow', 'rbbb', 'inferior', 'early', 'negative', 170, -24),
  region('para-his', 5, 'base', [164, 185], 'septal', 'rs', 'inferior', 'v3', 'positive', 130, -25),
  region('tricuspid', 6, 'base', [60, 258], 'annular', 'lbbb', 'superior', 'late', 'positive', 165, -31),
  region('mitral', 7, 'base', [305, 176], 'annular', 'rbbb', 'inferior', 'positive', 'negative', 160, -29),
  region('papillary-pm', 8, 'chambers', [636, 284], 'papillary', 'rbbb', 'superior', 'v3', 'positive', 165, -27),
  region('papillary-al', 9, 'chambers', [702, 214], 'papillary', 'rbbb', 'inferior', 'v3', 'negative', 160, -26),
  region('fascicle', 10, 'chambers', [606, 232], 'fascicular', 'rbbb', 'superior', 'early', 'positive', 115, -22, true),
  region('moderator', 11, 'chambers', [540, 244], 'band', 'lbbb', 'superior', 'late', 'positive', 155, -26, true),
  region('crux', 12, 'base', [198, 292], 'inferior', 'lbbb', 'superior', 'early', 'positive', 180, -23)
]);
export const VES_OPTIONS = Object.freeze({
  v1: ['lbbb', 'rs', 'rbbb', 'qr'],
  axis: ['inferior', 'superior', 'mixed'],
  transition: ['early', 'v3', 'late', 'positive', 'negative'],
  leadI: ['positive', 'negative', 'biphasic'],
  width: ['narrow', 'wide']
});
export const VES_INPUTS = Object.freeze(Object.keys(VES_OPTIONS));
export const VES_SOURCES = Object.freeze([
  { id: 'easy', title: 'EasyECG · Easy PVC', url: 'https://www.easy-ecg.com/diagnostic/dUBqGUnQNGjIZA907FT1' },
  { id: 'abstract', title: 'Nageler et al. · EASY-PVC (ESC 2025 abstract)', url: 'https://doi.org/10.1093/eurheartj/ehaf784.621' },
  { id: 'consensus', title: 'HRS/EHRA/APHRS/LAHRS · Ventricular arrhythmias (2019)', url: 'https://doi.org/10.1002/joa3.12185' },
  { id: 'ratio', title: 'Betensky et al. · V2 transition ratio (2011)', url: 'https://doi.org/10.1016/j.jacc.2011.01.035' },
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
export function vesEcg(id) {
  const site = vesRegion(id);
  if (!site) return null;
  const t = Array.from({ length: (VES_ECG_WINDOW.to - VES_ECG_WINDOW.from) / VES_ECG_STEP + 1 }, (_, i) => VES_ECG_WINDOW.from + i * VES_ECG_STEP);
  const leads = Object.fromEntries(LEADS.map(l => [l, []]));
  const notch = site.id === 'rvot-free';
  const iAmp = site.leadI === 'negative' ? [0.1, 0.5] : [0.65, 0.1];
  const iiAmp = site.axis === 'superior' ? [0.12, 1.15] : [1.4, 0.12];
  const transition = { early: 2, v3: 3, late: 5, positive: 1, negative: 7 }[site.transition];
  for (const ms of t) {
    const I = beat(ms, site.width, iAmp[0], iAmp[1], notch), II = beat(ms, site.width, iiAmp[0], iiAmp[1], notch);
    const limb = { I, II, III: II - I, aVR: -(I + II) / 2, aVL: I - II / 2, aVF: II - I / 2 };
    for (const l of Object.keys(limb)) leads[l].push(limb[l]);
    PRECORDIAL.forEach((l, i) => {
      let r = i + 1 >= transition ? 1.15 : .22;
      let s = i + 1 >= transition ? .25 : 1.2;
      if (i === 0) {
        r = site.v1 === 'lbbb' ? 0 : site.v1 === 'rs' ? .4 : 1.25;
        s = site.v1 === 'rbbb' ? .25 : 1.15;
      }
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
  const v = peaks('V1');
  const tr = PRECORDIAL.findIndex((_, i) => PRECORDIAL.slice(i).every(l => { const { r, s } = peaks(l); return r >= s; }));
  const axis = sign('II') === 'positive' && sign('III') === 'positive' ? 'inferior'
    : sign('II') === 'negative' && sign('III') === 'negative' ? 'superior' : 'mixed';
  return {
    v1: v.r < .08 ? 'lbbb' : v.r < v.s ? 'rs' : 'rbbb', axis,
    transition: tr === -1 ? 'negative' : tr === 0 ? 'positive' : tr <= 1 ? 'early' : tr === 2 ? 'v3' : 'late',
    leadI: sign('I'), width: ecg.width < 130 ? 'narrow' : 'wide'
  };
}

/** Broad region groups only. No partial-score percentages or definite target. */
export function localizeVes(inputs = {}, { scar = false } = {}) {
  const path = VES_INPUTS.filter(k => VES_OPTIONS[k].includes(inputs[k])).map(key => ({ key, value: inputs[key] }));
  const next = VES_INPUTS.find(k => !VES_OPTIONS[k].includes(inputs[k])) || null;
  const hasAxis = ['inferior', 'superior'].includes(inputs.axis);
  const left = inputs.v1 === 'rbbb' || inputs.v1 === 'qr';
  const right = inputs.v1 === 'lbbb' || inputs.v1 === 'rs';
  const conflict = right && inputs.transition === 'positive' || left && inputs.transition === 'negative';
  if (conflict) return { path, next, candidates: [], status: 'unresolved', conflict: true, scar };
  let ids = [];
  if (hasAxis && (left || right)) {
    if (inputs.axis === 'inferior' && right) {
      ids = ['rvot-septal', 'rvot-free', 'lvot-cusp', 'para-his', 'lv-summit'];
      if (inputs.transition === 'early' || inputs.transition === 'positive') ids = ['lvot-cusp', 'lv-summit', 'para-his'];
      if (inputs.transition === 'late') ids = ['rvot-septal', 'rvot-free'];
      if (inputs.transition === 'negative') ids = [];
    } else if (inputs.axis === 'inferior' && left) {
      ids = ['lvot-cusp', 'lv-summit', 'mitral', 'papillary-al'];
      if (inputs.transition === 'positive') ids = ['mitral', 'lv-summit', 'lvot-cusp'];
      if (inputs.transition === 'negative' || inputs.transition === 'late') ids = [];
    } else if (right) {
      ids = ['tricuspid', 'moderator', 'crux'];
      if (inputs.transition === 'early' || inputs.transition === 'positive') ids = ['crux'];
      if (inputs.transition === 'late') ids = ['tricuspid', 'moderator'];
    } else {
      ids = ['papillary-pm', 'fascicle', 'mitral'];
      if (inputs.width === 'narrow') ids = ['fascicle'];
      if (inputs.width === 'wide') ids = ['papillary-pm', 'mitral'];
    }
  }
  return { path, next, candidates: ids, status: !hasAxis || (!left && !right) ? 'incomplete' : !ids.length ? 'unresolved' : next ? 'incomplete' : 'regions', scar };
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

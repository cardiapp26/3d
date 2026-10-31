/**
 * Action potentials along the conduction system over one beat: sinoatrial (SA) node, atrial
 * myocyte, atrioventricular (AV) node, Purkinje fibre and ventricular myocyte, on the same time
 * axis as lead II. Schematic teaching model: each action potential is drawn from phase segments
 * whose voltages and durations follow typical published values (resting/maximum diastolic
 * potential, threshold, peak, upstroke and duration), and each membrane current is a 0..1
 * activity by phase. It is not a solved ionic model; the ventricular cell lab below
 * (ecg-cell-model.js) is the quantitative one.
 *
 * Sources for the values: Katz, Physiology of the Heart (5th ed.); Grant, Circulation
 * 2009;120:1773 (cardiac ion channels); Mangoni and Nargeot, Physiol Rev 2008;88:919 (SA node
 * pacemaking); DiFrancesco, Circ Res 2010;106:434 (If).
 *
 * Time 0 is the start of the beat on the ECG strip (P onset at 120 ms, as in guyton-render.js).
 */
import { ecgTiming } from './guyton-render.js';

export const CASCADE_CELLS = Object.freeze(['sa', 'atrial', 'av', 'purkinje', 'ventricle']);

/** Channels: the ions they carry (direction in the usual forward mode) and the gene of the main subunit. */
export const CHANNELS = Object.freeze({
  If: { gene: 'HCN4', flows: [['Na', 'in']] },
  ICaT: { gene: 'CACNA1G/H', flows: [['Ca', 'in']] },
  ICaL: { gene: 'CACNA1C/D', flows: [['Ca', 'in']] },
  INa: { gene: 'SCN5A', flows: [['Na', 'in']] },
  INaL: { gene: 'SCN5A', flows: [['Na', 'in']] },
  Ito: { gene: 'KCND3', flows: [['K', 'out']] },
  IKur: { gene: 'KCNA5', flows: [['K', 'out']] },
  IKr: { gene: 'KCNH2', flows: [['K', 'out']] },
  IKs: { gene: 'KCNQ1', flows: [['K', 'out']] },
  IK1: { gene: 'KCNJ2', flows: [['K', 'out']] },
  IKACh: { gene: 'KCNJ3/5', flows: [['K', 'out']] },
  NCX: { gene: 'SLC8A1', flows: [['Ca', 'out'], ['Na', 'in']] },
  NaK: { gene: 'ATP1A1', flows: [['Na', 'out'], ['K', 'in']] }
});

const CELL_CHANNELS = Object.freeze({
  sa: ['If', 'ICaT', 'ICaL', 'IKr', 'IKs', 'IKACh', 'NCX', 'NaK'],
  atrial: ['INa', 'Ito', 'IKur', 'ICaL', 'IKr', 'IKs', 'IK1', 'IKACh', 'NCX', 'NaK'],
  av: ['If', 'ICaT', 'ICaL', 'IKr', 'IKACh', 'NCX', 'NaK'],
  purkinje: ['If', 'INa', 'INaL', 'Ito', 'ICaL', 'IKr', 'IKs', 'IK1', 'NCX', 'NaK'],
  ventricle: ['INa', 'Ito', 'ICaL', 'IKr', 'IKs', 'IK1', 'NCX', 'NaK']
});
export const channelsOf = cell => CELL_CHANNELS[cell] || [];

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const ease = f => (1 - Math.cos(Math.PI * clamp(f, 0, 1))) / 2;
const easeOut = f => Math.sin(Math.PI / 2 * clamp(f, 0, 1));
const easeIn = f => 1 - Math.cos(Math.PI / 2 * clamp(f, 0, 1));
const lin = f => clamp(f, 0, 1);
// SA phase 4: steady If depolarization with a steeper end (T-type calcium and the calcium clock).
const pacemaker = f => .78 * lin(f) + .22 * lin(f) ** 3;

/**
 * Beat timing for an autonomic tone (-1 vagal .. +1 sympathetic) and an optional If blocker.
 * The SA node sets the rate through its phase 4 slope and maximum diastolic potential; the AV
 * node sets the PR; the QT follows the rate (QTc 400 ms, Bazett).
 */
export function cascadeTiming({ tone = 0, ivabradine = false } = {}) {
  const t = clamp(Number(tone) || 0, -1, 1), sym = Math.max(0, t), vag = Math.max(0, -t);
  const mdp = -60 - 6 * vag + 2 * sym, threshold = -40;
  const ifScale = (1 + .5 * sym - .35 * vag) * (ivabradine ? .65 : 1);
  const caScale = 1 + .4 * sym - .15 * vag;
  const slope = 1 + .6 * sym - .45 * vag - (ivabradine ? .18 : 0);
  const up = Math.round(40 - 8 * sym + 6 * vag), rep = Math.round(140 - 20 * sym + 10 * vag);
  const d4 = 653 * ((threshold - mdp) / 20) / slope;
  const rr = Math.round(up + rep + d4);
  const pr = clamp(Math.round(160 + 55 * vag - 30 * sym), 110, 260);
  const qt = Math.round(400 * Math.sqrt(rr / 1000));
  const ecg = ecgTiming({ rate: 60000 / rr, pr: pr / 1000, qt: qt / 1000 });
  const p = Math.round(ecg.p * 1000), q = Math.round(ecg.q * 1000);
  return {
    tone: t, sym, vag, ivabradine: Boolean(ivabradine), rr, rate: Math.round(60000 / rr), pr, qt, mdp, threshold, up, rep, ifScale, caScale,
    onsets: { sa: p - 35, atrial: p + 8, av: p + 45, purkinje: q - 25, ventricle: q + 12 },
    ecg: { p, pEnd: Math.round(ecg.pEnd * 1000), q, j: Math.round(ecg.j * 1000), tStart: Math.round(ecg.tStart * 1000), tEnd: Math.round(ecg.tEnd * 1000) }
  };
}

/** Phase segments of one cell after its upstroke: [phase, duration ms, from mV, to mV, shape]. Phase 4 fills the rest of the RR. */
function segments(cell, k) {
  const vApd = k.qt - 20;
  switch (cell) {
    case 'sa': return [[0, k.up, k.threshold, 10, ease], [3, k.rep, 10, k.mdp, ease], [4, null, k.mdp, k.threshold, pacemaker]];
    case 'av': {
      const mdp = -65 - 5 * k.vag, up = Math.round(26 + 18 * k.vag - 6 * k.sym);
      return [[0, up, -55, 5, ease], [3, 170, 5, mdp, ease], [4, null, mdp, -55, f => .7 * lin(f) + .3 * lin(f) ** 2]];
    }
    case 'atrial': {
      const rest = -80 - 4 * k.vag, apd = Math.round(190 * Math.sqrt(k.rr / 1000) - 25 * k.vag);
      return [[0, 3, -68, 25, easeOut], [1, 9, 25, 4, easeOut], [2, Math.round(apd * .35), 4, -18, lin], [3, Math.round(apd * .65) - 12, -18, rest, ease], [4, null, rest, -68, f => lin(f) ** 8]];
    }
    case 'purkinje': return [[0, 3, -80, 32, easeOut], [1, 8, 32, 6, easeOut], [2, Math.round((vApd + 40) * .62), 6, -6, lin], [3, Math.round((vApd + 40) * .38) - 11, -6, -89, easeIn], [4, null, -89, -80, f => .8 * lin(f) + .2 * lin(f) ** 6]];
    default: return [[0, 3, -72, 30, easeOut], [1, 6, 30, 14, easeOut], [2, Math.round(vApd * .62), 14, -8, f => .3 * lin(f) + .7 * lin(f) ** 2], [3, Math.round(vApd * .38) - 9, -8, -85, easeIn], [4, null, -85, -72, f => lin(f) ** 10]];
  }
}

/** Voltage, phase and the fraction of that phase reached by one cell at time ms of the beat. */
export function cellAt(cell, ms, k) {
  const segs = segments(cell, k);
  const used = segs.reduce((a, s) => a + (s[1] ?? 0), 0);
  let tau = ((ms - k.onsets[cell]) % k.rr + k.rr) % k.rr;
  for (const [phase, dur, from, to, shape] of segs) {
    const d = dur ?? Math.max(1, k.rr - used);
    if (tau < d || dur == null) return { phase, f: clamp(tau / d, 0, 1), mv: from + (to - from) * shape(tau / d) };
    tau -= d;
  }
  return { phase: 4, f: 1, mv: segs[segs.length - 1][3] };
}

/** Resting (or maximum diastolic) potential, threshold, peak, upstroke time and action potential duration of one cell. */
export function cellMeasures(cell, k) {
  const segs = segments(cell, k), phase4 = segs[segs.length - 1];
  const active = segs.slice(0, -1);
  return {
    rest: Math.round(phase4[2]), threshold: Math.round(active[0][2]), peak: Math.round(Math.max(...active.map(s => s[3]), active[0][3])),
    upstroke: active[0][1], apd: active.reduce((a, s) => a + s[1], 0),
    pacemaker: cell === 'sa' || cell === 'av' || cell === 'purkinje'
  };
}

/** Activity 0..1 of each channel of a cell in phase p at fraction f (schematic, for the membrane view). */
function activity(id, cell, p, f, k) {
  const node = cell === 'sa' || cell === 'av';
  switch (id) {
    case 'If': { const g = cell === 'sa' ? 1 : cell === 'av' ? .55 : .35; return k.ifScale * g * (p === 4 ? .25 + .75 * (1 - f) : p === 3 && f > .7 ? (f - .7) * 2 : 0); }
    case 'ICaT': return k.caScale * (p === 4 ? Math.max(0, f - .5) * 2 : p === 0 ? .4 * (1 - f) : 0);
    case 'ICaL': return k.caScale * (node ? (p === 0 ? 1 : p === 3 ? .6 * (1 - f) ** 2 : 0)
      : p === 0 ? .3 * f : p === 1 ? .8 : p === 2 ? .9 * (1 - .5 * f) : p === 3 ? .25 * (1 - f) : 0);
    case 'INa': return p === 0 ? 1 : p === 1 ? .15 * (1 - f) : 0;
    case 'INaL': return p === 1 ? .3 : p === 2 ? .35 * (1 - .5 * f) : 0;
    case 'Ito': return (cell === 'ventricle' ? .6 : 1) * (p === 0 ? .4 * f : p === 1 ? 1 : p === 2 ? .3 * (1 - f) : 0);
    case 'IKur': return p === 1 ? .6 : p === 2 ? .7 : p === 3 ? .4 * (1 - f) : 0;
    case 'IKr': return node ? (p === 3 ? .4 + .6 * Math.sin(Math.PI * f) : p === 4 ? .6 * (1 - f) ** 2 : 0)
      : p === 2 ? .25 + .35 * f : p === 3 ? .9 * (1 - .6 * f) : 0;
    case 'IKs': return (1 + .6 * k.sym) * (p === 2 ? .2 + .4 * f : p === 3 ? .6 * (1 - f) : 0) * (node ? .5 : 1);
    case 'IK1': return p === 3 ? f : p === 4 ? .6 : p === 0 ? .1 : 0;
    case 'IKACh': return cell === 'sa' || cell === 'av' || cell === 'atrial' ? .9 * k.vag : 0;
    case 'NCX': return cell === 'sa' && p === 4 ? (f > .6 ? .3 + .7 * (f - .6) / .4 : .2) : p === 2 ? .4 : p === 3 ? .5 : .15;
    case 'NaK': return .35;
    default: return 0;
  }
}

/** The channels of a cell at time ms with their 0..1 activity, strongest first. */
export function currentsAt(cell, ms, k) {
  const { phase, f } = cellAt(cell, ms, k);
  return channelsOf(cell).map(id => ({ id, gene: CHANNELS[id].gene, flows: CHANNELS[id].flows, level: clamp(activity(id, cell, phase, f, k), 0, 1) }))
    .sort((a, b) => b.level - a.level);
}

/** The part of the ECG under time ms: P, PR segment, QRS, ST, T or TP. */
export function ecgRegionAt(ms, k) {
  const e = k.ecg, t = ((ms % k.rr) + k.rr) % k.rr;
  // A T wave that runs past the RR (fast rates) still shows at the start of the next beat.
  if (e.tEnd > k.rr && t < e.tEnd - k.rr) return 'T';
  if (t >= e.p && t < e.pEnd) return 'P';
  if (t >= e.pEnd && t < e.q) return 'PR';
  if (t >= e.q && t < e.j) return 'QRS';
  if (t >= e.j && t < e.tStart) return 'ST';
  if (t >= e.tStart && t < e.tEnd) return 'T';
  return 'TP';
}

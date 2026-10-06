import { CYCLE_SYNC as S } from './cardiac-cycle.js';
import { realTimeMean } from './hemodynamics.js';
import { SCENARIOS as HEMO } from './hemo-scenarios.js';

/*
 * Jugular venous pulse teaching model (research/VENOZ_BASINC_FIZIK_MUAYENE_MODUL_RAPORU.md).
 * A schematic right atrial pressure (mmHg) on the shared cardiac clock: the
 * template phase u of cardiac-cycle.js, so the a wave follows the P wave,
 * c sits at QRS/S1, v rises while the tricuspid valve is closed and y falls
 * after it opens. Amplitudes are chosen teaching parameters, not measured
 * data. Scenarios shared with the catheterization module (normal,
 * constriction, tamponade) take their mean RA pressure from
 * hemo-scenarios.js, so the two modules never disagree.
 */

// Landmark phases (template phase u). Tricuspid valve open 0 to S.avClosed.
export const WAVE_PHASE = Object.freeze({
  a: 0.40,          // atrial contraction (after the P wave, before ventricular systole)
  x: 0.455,         // atrial relaxation
  c: 0.49,          // tricuspid bulging in isovolumic contraction (QRS / S1)
  xp: 0.72,         // x': annular descent in ejection
  v: 0.97,          // atrial filling against the closed valve, just before it opens
  y: 0.10,          // tricuspid open: atrial emptying (rapid filling)
  cannon: 0.6       // atrial contraction against a closed valve (AV dissociation beat)
});

const REF_HR = 72;           // means are fitted at this rate (real-time weighting)
const RESP_SHIFT = 3;        // mmHg: spontaneous inspiration lowers the venous pressure
const INSP_DESCENT = 1.2;    // descents deepen a little in inspiration (more return)

/**
 * Scenario shapes: anchors relative to a baseline b (added), plus the labels
 * the graph shows. `mean`: target real-time mean RA pressure (mmHg).
 */
const SHAPES = {
  normal: {
    hemo: 'normal',
    labels: ['a', 'x', 'c', 'xp', 'v', 'y'],
    anchors: [[0.00, 1.5], [0.10, -1.5], [0.25, 0], [0.32, 0.2], [0.40, 2.5], [0.455, 0.4], [0.49, 1.3], [0.72, -2], [0.97, 1.8]]
  },
  af: {
    mean: 6,
    labels: ['c', 'xp', 'v', 'y'],
    anchors: [[0.00, 1.8], [0.10, -1.5], [0.25, 0], [0.40, 0.1], [0.49, 1.0], [0.72, -1.2], [0.97, 2.0]]
  },
  tr: {
    mean: 12,
    labels: ['a', 'c', 'cv', 'y'],
    anchors: [[0.00, 7], [0.07, -3], [0.20, 0], [0.32, 0.3], [0.40, 2], [0.455, 1.2], [0.49, 3], [0.62, 7], [0.80, 9.5], [0.95, 9]]
  },
  ts: {
    mean: 10,
    labels: ['a', 'c', 'xp', 'v', 'y'],
    anchors: [[0.00, 1.8], [0.12, 1.0], [0.26, 0.3], [0.32, 0.6], [0.40, 10], [0.455, 3], [0.49, 3.2], [0.72, -1], [0.97, 2]]
  },
  constriction: {
    hemo: 'constrictive_pericarditis',
    labels: ['a', 'xp', 'v', 'y'],
    anchors: [[0.00, 1.5], [0.06, -6], [0.13, 1.5], [0.30, 1.6], [0.40, 3], [0.455, 1.2], [0.49, 1.6], [0.72, -4], [0.97, 2]]
  },
  tamponade: {
    hemo: 'tamponade',
    labels: ['a', 'xp', 'v', 'y'],
    anchors: [[0.00, 1.4], [0.10, 0.8], [0.25, 0.6], [0.32, 0.7], [0.40, 2.4], [0.455, 1.0], [0.49, 1.3], [0.72, -5], [0.97, 1.6]]
  },
  cannon: {
    mean: 6,
    labels: ['c', 'cannon', 'v', 'y'],
    anchors: [[0.00, 1.5], [0.10, -1.5], [0.25, 0], [0.40, 0.3], [0.49, 1.3], [0.53, 1.5], [0.60, 12], [0.68, 0], [0.76, -1.5], [0.97, 1.8]]
  }
};

export const JVP_SCENARIOS = Object.freeze(Object.keys(SHAPES));

/** Catheterization scenario (hemo-scenarios.js) a JVP scenario shares its numbers with, or null. */
export function jvpHemoScenario(id) {
  return SHAPES[id]?.hemo || null;
}
/** JVP scenario drawn from a catheterization scenario, or null. */
export function hemoJvpScenario(hemoId) {
  return JVP_SCENARIOS.find(id => SHAPES[id].hemo === hemoId) || null;
}
/** Scenarios with a spontaneous-breathing Kussmaul response (not tamponade). */
const KUSSMAUL = new Set(['constriction']);

export function targetMean(id) {
  const shape = SHAPES[id];
  return shape.hemo ? HEMO[shape.hemo].stations.ra.mean : shape.mean;
}

const wrap = u => ((u % 1) + 1) % 1;

// Smooth periodic interpolation through anchors (cosine easing between neighbours).
function periodic(anchors) {
  const pts = [...anchors].sort((p, q) => p[0] - q[0]);
  const first = pts[0], last = pts[pts.length - 1];
  return u => {
    const t = wrap(u);
    let prev, next;
    if (t < first[0]) { prev = [last[0] - 1, last[1]]; next = first; }
    else if (t >= last[0]) { prev = last; next = [first[0] + 1, first[1]]; }
    else { const i = pts.findIndex(p => p[0] > t); prev = pts[i - 1]; next = pts[i]; }
    const f = (t - prev[0]) / (next[0] - prev[0]);
    return prev[1] + (next[1] - prev[1]) * (1 - Math.cos(Math.PI * f)) / 2;
  };
}

const cache = new Map();

/**
 * The venous pressure curve of a scenario.
 * @param {string} id one of JVP_SCENARIOS
 * @param {{ respiration?: 'exp'|'insp' }} [options] spontaneous breathing phase
 * @returns {{ id: string, pressure: (u: number) => number, mean: number, labels: { id: string, u: number, p: number }[], kussmaul: boolean }}
 */
export function jvpCurve(id, { respiration = 'exp' } = {}) {
  const key = `${id}|${respiration}`;
  if (cache.has(key)) return cache.get(key);
  const shape = SHAPES[id] || SHAPES.normal;
  const insp = respiration === 'insp';
  const kussmaul = KUSSMAUL.has(id);
  // Inspiration: deeper descents (more return); the level falls, or rises with Kussmaul.
  const anchors = shape.anchors.map(([u, p]) => [u, insp && p < 0 ? p * INSP_DESCENT : p]);
  const relative = periodic(anchors);
  const target = targetMean(id) + (insp ? (kussmaul ? RESP_SHIFT : -RESP_SHIFT) : 0);
  const base = target - realTimeMean(relative, REF_HR);
  const pressure = u => base + relative(u);
  // Labels sit on the actual peak or trough inside each wave's window.
  const labels = shape.labels.map(label => {
    const [kind, from, to] = LABEL_WINDOW[label];
    const u = kind === 'at' ? WAVE_PHASE[label] : extremePhase(pressure, from, to, kind === 'max');
    return { id: label, u, p: pressure(u) };
  });
  const curve = Object.freeze({ id, pressure, mean: realTimeMean(pressure, REF_HR), labels, kussmaul });
  cache.set(key, curve);
  return curve;
}

const LABEL_WINDOW = {
  a: ['max', 0.33, 0.45], x: ['at'], c: ['at'], xp: ['min', 0.55, 0.86], v: ['max', 0.86, 1.0],
  y: ['min', 0.0, 0.22], cv: ['max', 0.6, 0.97], cannon: ['max', 0.5, 0.7]
};

function extremePhase(fn, from, to, max) {
  let best = from;
  for (let u = from; u <= to; u += 0.0025) if (max ? fn(u) > fn(best) : fn(u) < fn(best)) best = u;
  return best;
}

/**
 * Bedside estimate: vertical height of the venous column above the sternal
 * angle (cm). 1 mmHg = 1.36 cmH2O; the sternal angle is taken 5 cm above
 * the right atrium, an approximate assumption that varies with body build
 * and position (report section 6).
 */
export function heightAboveSternalAngle(meanMmHg) {
  return meanMmHg * 1.36 - 5;
}

/** Tricuspid valve open (atrium emptying into the ventricle) at phase u. */
export function tricuspidOpen(u) {
  return wrap(u) < S.avClosed;
}

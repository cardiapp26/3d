/**
 * Conduction system lesson model: the structures (SA node to Purkinje network), their
 * coronary supply, one synthetic beat per scenario (normal and one "what if" per structure)
 * with the time window of every structure, the atrial and ventricular activation order, the
 * intervals (PR, AH, HV, P, QRS) and a lead II and V1 trace built from Gaussian components.
 * Teaching values (ms) chosen inside the normal ranges; not a cellular model.
 * Pure functions, shared by the 3D atlas view, the 2D diagram and the tests.
 */

export const STRUCTURE_IDS = Object.freeze(['sa', 'internodal', 'bachmann', 'avn', 'his', 'rbb', 'lbb', 'laf', 'lpf', 'septal', 'purkinje']);

/** Coronary arteries of the blood-supply overlay. 'regional': the local coronary territory. */
export const ARTERIES = Object.freeze({
  rca: { color: '#e4675b' },
  lcx: { color: '#4fb6dc' },
  lad: { color: '#f2c14b' },
  regional: { color: '#9aa7b4' }
});

/**
 * Facts the cards show (numbers only; the words are in conduction-text.js).
 * rate: intrinsic (escape) rate per minute, null when the structure is no pacemaker.
 * velocity: conduction velocity, m/s. supply: arteries with the share in percent when known;
 * variant: the supply is one artery or the other (dominance), not a dual supply.
 * whatIf: the scenario its toggle starts, or null.
 */
export const STRUCTURES = Object.freeze({
  sa: { rate: [60, 100], velocity: [0.05, 0.05], supply: [{ artery: 'rca', share: 60 }, { artery: 'lcx', share: 40 }], variant: true, whatIf: 'sinusArrest' },
  internodal: { rate: null, velocity: [0.3, 1], supply: [{ artery: 'rca' }, { artery: 'lcx' }], whatIf: null },
  bachmann: { rate: null, velocity: [1, 1.7], supply: [{ artery: 'rca' }, { artery: 'lcx' }], whatIf: 'interatrialBlock' },
  avn: { rate: [40, 60], velocity: [0.01, 0.05], supply: [{ artery: 'rca', share: 90 }, { artery: 'lcx', share: 10 }], variant: true, whatIf: 'firstDegree' },
  his: { rate: [40, 60], velocity: [1, 1.5], supply: [{ artery: 'lad' }, { artery: 'rca' }], whatIf: 'hisBlock' },
  rbb: { rate: [20, 40], velocity: [2, 2], supply: [{ artery: 'lad' }], whatIf: 'rbbb' },
  lbb: { rate: [20, 40], velocity: [2, 2], supply: [{ artery: 'lad' }, { artery: 'rca' }], whatIf: 'lbbb' },
  laf: { rate: [20, 40], velocity: [2, 2], supply: [{ artery: 'lad' }], whatIf: 'lafb' },
  lpf: { rate: [20, 40], velocity: [2, 2], supply: [{ artery: 'lad' }, { artery: 'rca' }], whatIf: 'lpfb' },
  septal: { rate: [20, 40], velocity: [2, 2], supply: [{ artery: 'lad' }], whatIf: null },
  purkinje: { rate: [20, 40], velocity: [2, 4], supply: [{ artery: 'regional' }], whatIf: null }
});

export const SCENARIO_IDS = Object.freeze(['normal', 'sinusArrest', 'interatrialBlock', 'firstDegree', 'hisBlock', 'rbbb', 'lbbb', 'lafb', 'lpfb']);
export const VENTRICULAR_REGIONS = Object.freeze(['septum', 'apex', 'rvFree', 'lvFree', 'posterobasal']);

// One normal beat at 75/min (ms from the SA node discharge). PR 160, AH 78, HV 42, QRS 90.
const NORMAL = Object.freeze({
  segments: {
    sa: [0, 10], internodal: [10, 50], bachmann: [10, 45], avn: [50, 128], his: [128, 145],
    lbb: [145, 155], rbb: [145, 165], septal: [150, 168], laf: [155, 166], lpf: [155, 164], purkinje: [163, 182]
  },
  atria: { ra: [10, 80], la: [40, 110] },
  pOnset: 10, pDuration: 100, qrsOnset: 170, qrsDuration: 90,
  ventricles: { septum: [170, 200], apex: [185, 215], rvFree: [195, 235], lvFree: [195, 240], posterobasal: [228, 260] },
  // Earliest ventricular breakthrough sites (atlas views map these names to points).
  sources: { septalLeft: 170, lafEnd: 178, lpfEnd: 177, apexLv: 181, rvModerator: 182, apexRv: 184 }
});

// Lead II and V1 components: { at, w, a } = centre (ms after the wave onset), width (ms), mV.
const WAVES = Object.freeze({
  p: { II: [{ at: 50, w: 22, a: 0.15 }], V1: [{ at: 38, w: 14, a: 0.07 }, { at: 78, w: 14, a: -0.05 }] },
  pBifid: { II: [{ at: 42, w: 17, a: 0.12 }, { at: 100, w: 17, a: 0.13 }], V1: [{ at: 38, w: 14, a: 0.06 }, { at: 104, w: 17, a: -0.09 }] },
  pRetro: { II: [{ at: 0, w: 16, a: -0.12 }], V1: [{ at: 0, w: 16, a: 0.04 }] },
  normal: {
    II: [{ at: 9, w: 4, a: -0.08 }, { at: 36, w: 9, a: 1.2 }, { at: 62, w: 8, a: -0.22 }, { at: 290, w: 46, a: 0.3 }],
    V1: [{ at: 13, w: 6, a: 0.25 }, { at: 46, w: 12, a: -1.05 }, { at: 290, w: 46, a: 0.08 }]
  },
  rbbb: {
    II: [{ at: 9, w: 4, a: -0.06 }, { at: 36, w: 9, a: 1.0 }, { at: 92, w: 18, a: -0.32 }, { at: 320, w: 46, a: 0.22 }],
    V1: [{ at: 14, w: 6, a: 0.3 }, { at: 46, w: 10, a: -0.55 }, { at: 100, w: 17, a: 0.85 }, { at: 320, w: 46, a: -0.2 }]
  },
  lbbb: {
    II: [{ at: 48, w: 20, a: 0.75 }, { at: 102, w: 20, a: 0.8 }, { at: 340, w: 50, a: -0.25 }],
    V1: [{ at: 72, w: 30, a: -1.3 }, { at: 340, w: 50, a: 0.3 }]
  },
  lafb: {
    II: [{ at: 18, w: 6, a: 0.28 }, { at: 56, w: 12, a: -0.85 }, { at: 295, w: 46, a: 0.18 }],
    V1: [{ at: 13, w: 6, a: 0.22 }, { at: 48, w: 12, a: -1.0 }, { at: 295, w: 46, a: 0.08 }]
  },
  lpfb: {
    II: [{ at: 11, w: 5, a: -0.12 }, { at: 45, w: 11, a: 1.55 }, { at: 295, w: 46, a: 0.32 }],
    V1: [{ at: 13, w: 6, a: 0.2 }, { at: 48, w: 12, a: -0.95 }, { at: 295, w: 46, a: 0.08 }]
  },
  escape: {
    II: [{ at: 28, w: 14, a: 0.2 }, { at: 98, w: 30, a: -0.9 }, { at: 360, w: 56, a: 0.42 }],
    V1: [{ at: 74, w: 30, a: 0.95 }, { at: 360, w: 56, a: -0.32 }]
  }
});

const shift = (range, by) => [range[0] + by, range[1] + by];
const shiftAll = (obj, by, keys = Object.keys(obj)) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, keys.includes(k) ? (Array.isArray(v) ? shift(v, by) : v + by) : v]));

function base(id) {
  return {
    id,
    duration: 800,
    rate: 75,
    segments: Object.fromEntries(Object.entries(NORMAL.segments).map(([k, v]) => [k, { start: v[0], end: v[1] }])),
    blocks: {},                    // structure id -> fraction of its length where the impulse stops
    atria: { ...NORMAL.atria },
    pOnsets: [NORMAL.pOnset], pDuration: NORMAL.pDuration, pWave: 'p', retroP: null,
    qrsOnset: NORMAL.qrsOnset, qrsDuration: NORMAL.qrsDuration, qrs: 'normal',
    ventricles: { ...NORMAL.ventricles },
    septalDirection: 'leftToRight',
    sources: { ...NORMAL.sources },
    escape: null
  };
}

/** Moves every window from the AV node on by `by` ms (AV nodal delay, junctional escape). */
function delayVentricles(beat, by) {
  const below = ['his', 'lbb', 'rbb', 'septal', 'laf', 'lpf', 'purkinje'];
  for (const id of below) beat.segments[id] = { ...beat.segments[id], start: beat.segments[id].start + by, end: beat.segments[id].end + by };
  beat.qrsOnset += by;
  beat.ventricles = shiftAll(beat.ventricles, by);
  beat.sources = shiftAll(beat.sources, by);
}

const BUILDERS = {
  normal: (b) => b,
  // SA node does not fire: no P; a junctional escape (40-60/min) from the AV junction.
  sinusArrest: (b) => {
    const escapeAt = 1200;
    b.blocks.sa = 0;
    b.segments.sa = null;
    b.pOnsets = [];
    const by = escapeAt - b.segments.his.start;
    b.segments.avn = { start: escapeAt - 10, end: escapeAt };
    delayVentricles(b, by);
    // Retrograde atrial activation from the junction, after the QRS onset (inverted P in II
    // in the ST segment); the atrial windows match the retrograde P.
    const q = b.qrsOnset;
    b.segments.internodal = { start: q + 20, end: q + 58, reverse: true };
    b.segments.bachmann = { start: q + 53, end: q + 83, reverse: true };
    b.atria = { ra: [q + 28, q + 98], la: [q + 58, q + 128] };
    b.retroP = q + 80;
    b.escape = { site: 'avn', rate: [40, 60], at: escapeAt };
    b.duration = escapeAt + 640;
    b.rate = 50;
  },
  // Partial interatrial block: slowed conduction in Bachmann's bundle, the LA activates late
  // (bifid P in II, >= 120 ms). Advanced block (LA from below, +/- P inferiorly) is in the text.
  interatrialBlock: (b) => {
    b.segments.bachmann = { ...b.segments.bachmann, end: 78 };
    b.atria = { ra: [10, 80], la: [72, 140] };
    b.pDuration = 130;
    b.pWave = 'pBifid';
  },
  // Slower AV nodal conduction: PR 280 ms (AH prolonged), every P still conducts.
  firstDegree: (b) => {
    b.segments.avn = { start: 50, end: 248 };
    delayVentricles(b, 120);
    b.duration = 920;
  },
  // Infra-Hisian complete block: the impulse passes the His bundle and stops in both bundle
  // branches; P waves march on, a slow wide ventricular escape (20-40/min) takes over.
  hisBlock: (b) => {
    const escapeAt = 1700;
    b.blocks.rbb = 0.15;
    b.blocks.lbb = 0.25;
    b.segments.rbb = { start: 145, end: 149 };
    b.segments.lbb = { start: 145, end: 149 };
    for (const id of ['septal', 'laf', 'lpf']) b.segments[id] = null;
    b.pOnsets = [10, 810, 1610];
    b.qrsOnset = escapeAt;
    b.qrsDuration = 160;
    b.qrs = 'escape';
    b.segments.purkinje = { start: escapeAt - 15, end: escapeAt };
    b.ventricles = { septum: [escapeAt + 40, escapeAt + 110], apex: [escapeAt + 10, escapeAt + 80], rvFree: [escapeAt + 60, escapeAt + 160], lvFree: [escapeAt, escapeAt + 90], posterobasal: [escapeAt + 5, escapeAt + 70] };
    b.sources = { lpfEnd: escapeAt };
    b.septalDirection = 'none';
    b.escape = { site: 'purkinje', rate: [20, 40], at: escapeAt };
    b.duration = escapeAt + 700;
    b.rate = 35;
  },
  // RBBB: the RV is activated late, across the septum from the left (QRS >= 120 ms, rSR' in V1).
  rbbb: (b) => {
    b.blocks.rbb = 0.3;
    b.segments.rbb = { ...b.segments.rbb, end: 151 };
    b.qrsDuration = 140;
    b.qrs = 'rbbb';
    b.ventricles = { septum: [170, 215], apex: [185, 220], rvFree: [225, 300], lvFree: [195, 240], posterobasal: [235, 310] };
    delete b.sources.rvModerator;
    delete b.sources.apexRv;
  },
  // LBBB: septum from right to left, the LV last (no septal q in I/V6, QS in V1, QRS >= 120 ms).
  lbbb: (b) => {
    b.blocks.lbb = 0.4;
    b.segments.lbb = { ...b.segments.lbb, end: 149 };
    for (const id of ['septal', 'laf', 'lpf']) b.segments[id] = null;
    b.segments.purkinje = { start: 163, end: 180 };
    b.qrsDuration = 150;
    b.qrs = 'lbbb';
    b.septalDirection = 'rightToLeft';
    b.ventricles = { septum: [172, 230], apex: [190, 250], rvFree: [185, 225], lvFree: [215, 305], posterobasal: [270, 320] };
    b.sources = { septalRight: 170, rvModerator: 178, apexRv: 182 };
  },
  // LAFB: the anterosuperior LV is reached through the posterior fascicle (left axis, rS in II).
  lafb: (b) => {
    b.blocks.laf = 0.4;
    b.segments.laf = { ...b.segments.laf, end: 158 };
    b.qrsDuration = 100;
    b.qrs = 'lafb';
    // The inferoposterior wall comes early through the LPF; the anterosuperior / lateral basal LV is last.
    b.ventricles = { septum: [170, 200], apex: [185, 220], rvFree: [195, 235], lvFree: [200, 270], posterobasal: [200, 238] };
    delete b.sources.lafEnd;
  },
  // LPFB: the inferoposterior LV is reached through the anterior fascicle (right axis, qR in II).
  lpfb: (b) => {
    b.blocks.lpf = 0.4;
    b.segments.lpf = { ...b.segments.lpf, end: 157 };
    b.qrsDuration = 100;
    b.qrs = 'lpfb';
    b.ventricles = { septum: [170, 200], apex: [185, 220], rvFree: [195, 235], lvFree: [195, 250], posterobasal: [240, 270] };
    delete b.sources.lpfEnd;
  }
};

const cache = new Map();

/** One beat of the scenario (unknown ids fall back to the normal beat). Frozen; do not mutate. */
export function beatTimeline(id = 'normal') {
  const key = SCENARIO_IDS.includes(id) ? id : 'normal';
  if (!cache.has(key)) {
    const beat = base(key);
    BUILDERS[key](beat);
    beat.intervals = intervalsOf(beat);
    cache.set(key, deepFreeze(beat));
  }
  return cache.get(key);
}

function deepFreeze(obj) {
  for (const v of Object.values(obj)) if (v && typeof v === 'object') deepFreeze(v);
  return Object.freeze(obj);
}

/** PR, AH, HV, P and QRS durations (ms) of a beat; null where the beat has no such interval. */
export function intervalsOf(beat) {
  const p = beat.pOnsets.length ? beat.pOnsets[0] : null;
  const conducted = p !== null && !beat.escape;
  const his = beat.segments.his;
  return {
    pr: conducted ? beat.qrsOnset - p : null,
    ah: conducted && his ? his.start - beat.segments.avn.start : null,
    hv: conducted && his ? beat.qrsOnset - his.start : null,
    p: p !== null ? beat.pDuration : null,
    qrs: beat.qrsDuration,
    rate: beat.rate
  };
}

/** Which scenario the structure's "what if" toggle starts (null: none). */
export const whatIfOf = (id) => STRUCTURES[id]?.whatIf ?? null;

/** The structure a scenario blocks or changes (for the card and the block marker). */
export function structureOfScenario(scenario) {
  return STRUCTURE_IDS.find((id) => STRUCTURES[id].whatIf === scenario) ?? null;
}

/**
 * Time inside the activation the latest P wave started: structures the impulse of each P runs
 * through (they end before the next P) restart with every P, as when the P waves march on.
 */
export function localTime(beat, id, t) {
  const seg = id === 'atria' ? { end: beat.atria.la[1] } : beat.segments[id];
  if (beat.pOnsets.length < 2 || !seg || seg.end >= beat.pOnsets[1]) return t;
  let onset = beat.pOnsets[0];
  for (const p of beat.pOnsets) if (p <= t) onset = p;
  return t - (onset - beat.pOnsets[0]);
}

/**
 * How far the impulse has run along a structure at time t: null before it starts (or when the
 * beat never reaches it), then 0..1 of its length, capped at the block point when blocked.
 */
export function impulseProgress(beat, id, t) {
  const seg = beat.segments[id];
  const at = localTime(beat, id, t);
  if (!seg || at < seg.start) return null;
  const f = seg.end > seg.start ? Math.min(1, (at - seg.start) / (seg.end - seg.start)) : 1;
  const block = beat.blocks[id];
  return f * (block === undefined ? 1 : block);
}

/** True once the impulse has stopped at the structure's block point. */
export function blockReached(beat, id, t) {
  const seg = beat.segments[id];
  if (beat.blocks[id] === undefined) return false;
  return !seg ? t >= 0 : localTime(beat, id, t) >= seg.end;
}

/** 0 (resting) .. 1 (fully depolarised) of a region window [start, end] at time t. */
export function regionProgress(range, t) {
  if (!range || t < range[0]) return 0;
  return range[1] > range[0] ? Math.min(1, (t - range[0]) / (range[1] - range[0])) : 1;
}

/** Phase of the beat at time t (for the step list): which step is running. */
export const PHASES = Object.freeze(['sa', 'atria', 'avn', 'pause', 'his', 'bundles', 'purkinje', 'ventricles', 'repolarisation']);
export function phaseAt(beat, t) {
  const s = beat.segments;
  const inside = (seg) => {
    if (!seg) return false;
    const id = Object.keys(s).find((k) => s[k] === seg);
    const at = localTime(beat, id, t);
    return at >= seg.start && at <= seg.end;
  };
  if (t >= beat.qrsOnset + beat.qrsDuration) return 'repolarisation';
  if (t >= beat.qrsOnset) return 'ventricles';
  if (inside(s.purkinje) || inside(s.septal)) return 'purkinje';
  if (inside(s.rbb) || inside(s.lbb) || inside(s.laf) || inside(s.lpf)) return 'bundles';
  if (inside(s.his)) return 'his';
  if (inside(s.avn)) return 'avn';
  if (beat.pOnsets.some((p) => t >= p && t <= p + beat.pDuration)) return 'atria';
  if (inside(s.sa)) return 'sa';
  return beat.escape && t < beat.escape.at ? 'pause' : 'sa';
}

const gauss = (t, c) => c.a * Math.exp(-0.5 * ((t - c.at) / c.w) ** 2);

/** Voltage (mV) of lead 'II' or 'V1' at time t of the beat. */
export function leadVoltage(beat, lead, t) {
  const comps = (set) => (WAVES[set] && WAVES[set][lead]) || [];
  let v = 0;
  for (const onset of beat.pOnsets) for (const c of comps(beat.pWave)) v += gauss(t - onset, c);
  if (beat.retroP !== null) for (const c of comps('pRetro')) v += gauss(t - beat.retroP, c);
  for (const c of comps(beat.qrs)) v += gauss(t - beat.qrsOnset, c);
  return v;
}

/** Sampled trace of one lead: [{ t, v }] every `step` ms over the beat. */
export function leadTrace(beat, lead, step = 2) {
  const out = [];
  for (let t = 0; t <= beat.duration; t += step) out.push({ t, v: leadVoltage(beat, lead, t) });
  return out;
}

/**
 * Activation time (ms) of a point: the earliest arrival over the sources ({ p: [x, y, z],
 * t: ms }) at `velocity` mm/ms, with `mmPerUnit` converting model units to mm.
 */
export function activationTime(point, sources, { velocity = 0.8, mmPerUnit = 38 } = {}) {
  let best = Infinity;
  for (const s of sources) {
    const d = Math.hypot(point[0] - s.p[0], point[1] - s.p[1], (point[2] ?? 0) - (s.p[2] ?? 0)) * mmPerUnit;
    best = Math.min(best, s.t + d / velocity);
  }
  return best;
}

/** Linearly maps times onto [start, start + span] keeping their order (a constant list maps to start). */
export function rescaleTimes(times, start, span) {
  let lo = Infinity, hi = -Infinity;
  for (const t of times) { if (t < lo) lo = t; if (t > hi) hi = t; }
  const k = hi > lo ? span / (hi - lo) : 0;
  return times.map((t) => start + (t - lo) * k);
}

/** Drops path points closer than `minStep` to the last kept one (keeps the first and the last). */
export function simplifyPath(points, minStep = 0.1) {
  if (points.length < 3) return points.map((p) => [...p]);
  const out = [[...points[0]]];
  for (const p of points.slice(1, -1)) {
    const q = out[out.length - 1];
    if (Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) >= minStep) out.push([...p]);
  }
  const last = points[points.length - 1], q = out[out.length - 1];
  if (Math.hypot(last[0] - q[0], last[1] - q[1], last[2] - q[2]) < minStep / 2 && out.length > 1) out.pop();
  out.push([...last]);
  return out;
}

/** Blood-supply colours of a structure: the usual artery for a variant supply, both for a dual one. */
export function supplyColors(id) {
  const s = STRUCTURES[id];
  if (!s) return [];
  return (s.variant ? s.supply.slice(0, 1) : s.supply).map((x) => ARTERIES[x.artery].color);
}

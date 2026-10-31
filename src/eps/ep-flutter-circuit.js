/*
 * Typical (counterclockwise, cavotricuspid isthmus dependent) flutter circuit of the live EP
 * laboratory, seen in LAO en face on the tricuspid annulus: where the wavefront is at a given
 * time, which limb of the circuit it is in, and lead II split into those limbs. Pure functions
 * on the live model's events (ep-live-model.js). The phase is read from the His A of each
 * flutter cycle, so the drawing stays in step with the electrograms.
 *
 * Teaching geometry: the front ascends the septum from beyond the CS ostium, crosses anterior to
 * the SVC, descends the lateral wall and returns through the isthmus, where conduction is
 * slowest (Shah 1997). The lead II F wave follows: the descending limb with the septum and the
 * proximal-to-distal CS (Lesh 2000), the nadir as the free wall starts its craniocaudal
 * activation, the positive part with the lateral wall (Sasaki 2013) and the plateau with the
 * isthmus.
 *
 * Angles are LAO clock degrees: 0 at 12 o'clock, clockwise positive (septum on the right,
 * lateral wall on the left). A counterclockwise front runs through decreasing angles.
 */
import { ORIGINS } from './ep-live-substrates.js';
import { SITE_CHANNEL } from './ep-live-model.js';
import { channelEvents, waveValue } from './ep-waveform.js';
import { egmSample } from './ep-egm.js';

/** Limbs of the circuit in the order the front runs them (from: entry angle, to: exit; slow: time weight per degree). */
export const CIRCUIT_SEGMENTS = Object.freeze([
  Object.freeze({ id: 'septum', from: 165, to: 45, slow: 1 }),
  Object.freeze({ id: 'roof', from: 45, to: -30, slow: 1 }),
  Object.freeze({ id: 'lateral', from: -30, to: -150, slow: 1 }),
  Object.freeze({ id: 'cti', from: -150, to: -195, slow: 2 })
]);
const HIS_ANGLE = 45;                       // the His bundle region, where the septal limb ends
const DEFAULT_TCL = 240;
const ATRIAL = ['hra', 'his-p', 'his-d', 'cs-910', 'cs-78', 'cs-56', 'cs-34', 'cs-12', 'abl-d'];
const CLUSTER_MS = 120;                     // A electrograms of one activation lie within this span
const RECENT_MS = 600;                      // an activation older than this is not reported

export const normAngle = (deg) => ((deg % 360) + 360) % 360;

const knotCache = new Map();
/** Time course of one cycle from the His A (tau 0): each limb's start and end time and angle. */
function knots(tcl) {
  if (knotCache.has(tcl)) return knotCache.get(tcl);
  const order = ['roof', 'lateral', 'cti', 'septum'].map((id) => CIRCUIT_SEGMENTS.find((s) => s.id === id));
  const weight = order.reduce((sum, s) => sum + (s.from - s.to) * s.slow, 0);
  let t = 0, a = HIS_ANGLE;
  const list = order.map((s) => {
    const arc = s.from - s.to, dur = ((arc * s.slow) / weight) * tcl;
    const k = Object.freeze({ id: s.id, t0: t, t1: t + dur, a0: a, a1: a - arc });
    t += dur; a -= arc;
    return k;
  });
  knotCache.set(tcl, list);
  return list;
}

/** Front position tau ms after the His A of its cycle: { angle (0-360), segment }. */
export function circuitAngle(tau, tcl = DEFAULT_TCL) {
  const list = knots(tcl);
  const ph = ((tau % tcl) + tcl) % tcl;
  const k = list.find((x) => ph < x.t1) || list[list.length - 1];
  return { angle: normAngle(k.a0 + ((k.a1 - k.a0) * (ph - k.t0)) / (k.t1 - k.t0)), segment: k.id };
}

/** Angular speed of each limb (degrees per ms) at a cycle length. */
export function segmentSpeeds(tcl = DEFAULT_TCL) {
  return Object.fromEntries(knots(tcl).map((k) => [k.id, (k.a0 - k.a1) / (k.t1 - k.t0)]));
}

/** Circuit phase of a channel: its flutter A time from the His A. */
const FL = ORIGINS.flutter;
const phaseOf = (ch) => FL[ch] - FL['his-d'];
/** Where the catheters sit on the drawing: where the front is when their flutter A is recorded. */
export const CIRCUIT_SITES = Object.freeze({
  his: HIS_ANGLE,
  hra: Math.round(circuitAngle(phaseOf('hra')).angle),
  csOs: Math.round(circuitAngle(phaseOf('cs-910')).angle),
  cti: Math.round(circuitAngle(phaseOf('abl-d')).angle)
});

// Per event table (the live panel builds a new one per frame; the trace samples it many times).
const memo = new WeakMap();
const cached = (events, key, fn) => {
  if (!events || typeof events !== 'object') return fn();
  let m = memo.get(events);
  if (!m) { m = {}; memo.set(events, m); }
  if (!(key in m)) m[key] = fn();
  return m[key];
};

/** His A times of the flutter cycles in the events, in order. */
export function flutterAnchors(events) {
  return cached(events, 'anchors', () => (events?.['his-d'] || []).filter((e) => e.type === 'A' && e.origin === 'flutter').map((e) => e.t).sort((a, b) => a - b));
}

/** Cycle length from the latest His anchors (null with fewer than two in the flutter range). */
function cycleOf(anchors) {
  const diffs = anchors.slice(1).map((t, i) => t - anchors[i]).filter((d) => d >= 150 && d <= 400);
  return diffs.length ? diffs[diffs.length - 1] : null;
}

/** Times of atrial activations that did not come from the circuit (paced capture, sinus, any other origin). */
function foreignTimes(events) {
  return ATRIAL.flatMap((ch) => (events?.[ch] || []).filter((e) => e.type === 'A' && e.origin && e.origin !== 'flutter').map((e) => e.t));
}

/**
 * Clock of the circuit over an event table: a function of time giving the front ({ angle,
 * segment, tau, tcl, his }), or null when no flutter cycle holds that time (before the first
 * cycle, after the last one, or once another activation took over the atrium).
 * @param {Record<string, object[]>} events live model events (absolute times)
 * @param {{ tcl?: number|null }} [opts] cycle length when the events hold a single cycle
 */
export function circuitClock(events, { tcl = null } = {}) {
  const anchors = flutterAnchors(events);
  const cl = cycleOf(anchors) ?? tcl;
  const foreign = foreignTimes(events);
  return (t) => {
    if (!cl || !anchors.length) return null;
    let his = null;
    for (const a of anchors) { if (a <= t) his = a; else break; }
    if (his == null || t - his >= cl) return null;
    if (foreign.some((f) => f > his && f <= t)) return null;
    const tau = t - his;
    return { ...circuitAngle(tau, cl), tau, tcl: cl, his };
  };
}

/** The circuit at one time (see circuitClock). */
export const circuitAt = (events, t, opts) => circuitClock(events, opts)(t);

/** Drawing spot of an activation origin: circuit, sinus, hra, cs, cti, septal, left, af or other. */
export function originSpot(origin) {
  if (origin === 'flutter') return 'circuit';
  if (origin === 'cti') return 'cti';
  if (origin === 'sinus' || origin === 'hra' || origin === 'af') return origin;
  if (String(origin).startsWith('cs')) return 'cs';
  if (['avn-fast', 'avn-slow', 'ap-ps', 'his'].includes(origin)) return 'septal';
  if (origin === 'ap-left' || origin === 'la-focus') return 'left';
  return 'other';
}

/** The latest atrial activation at or before t: { origin, spot, t (its earliest A) }, or null. */
export function lastActivation(events, t) {
  const all = ATRIAL.flatMap((ch) => (events?.[ch] || []).filter((e) => e.type === 'A' && e.origin && e.t <= t));
  if (!all.length) return null;
  const latest = all.reduce((m, e) => (e.t > m.t ? e : m));
  if (t - latest.t > RECENT_MS) return null;
  const start = Math.min(...all.filter((e) => e.origin === latest.origin && latest.t - e.t <= CLUSTER_MS).map((e) => e.t));
  return { origin: latest.origin, spot: originSpot(latest.origin), t: start };
}

/**
 * Lead II from `from` to `to` in n samples: the full lead, its F wave component alone and the
 * circuit limb at each sample (null outside a flutter cycle).
 */
export function leadIiTrace(events, from, to, n = 160, opts = {}) {
  const clock = circuitClock(events, opts);
  const paced = opts.ppiExtra ? (t) => entrainmentAt(events, t, opts)?.fronts.filter((f) => f.kind !== 'anti').at(-1)?.segment ?? null : () => null;
  const fOnly = channelEvents({ events: { 'ecg-ii': (events?.['ecg-ii'] || []).filter((e) => e.type === 'F') } }, 'ecg-ii');
  const rec = { events: events || {}, t0: 0 };
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = from + ((to - from) * i) / n;
    const f = fOnly.reduce((v, e) => v + waveValue(t, e, 'ecg-ii'), 0);
    out.push({ t, full: egmSample(rec, 'ecg-ii', t), f, segment: clock(t)?.segment ?? paced(t) });
  }
  return out;
}

// ---- Entrainment on the ring ----
const IN_CIRCUIT = new Set(['hra', 'cs-prox', 'cti']);   // the other CS bipoles lie on the left atrium
const CS_SITES = ['cs-prox', 'cs-78', 'cs-56', 'cs-34', 'cs-dist'];
const CAPTURE_MS = 30;                                    // a paced A this soon after its stimulus
const TRAIN_GAP_MS = 120;                                 // beyond the TCL: a new train
const RESULT_MS = 6000;                                   // the readout stays this long after the return
const COLLISION_MS = 70;                                  // a collision is marked this long
/** Where the paced front joins the circuit: the site itself, or the CS ostium from the left atrium. */
export const entryChannel = (site) => (IN_CIRCUIT.has(site) ? SITE_CHANNEL[site] : 'cs-910');
export const isInCircuitSite = (site) => IN_CIRCUIT.has(site);

/** Return cycle beyond the TCL at a pacing site (mid CS bipoles between the proximal and distal values). */
export function ppiExtraAt(ppiExtra, site) {
  if (!ppiExtra) return null;
  if (ppiExtra[site] != null) return ppiExtra[site];
  const k = CS_SITES.indexOf(site);
  if (k < 0 || ppiExtra['cs-prox'] == null || ppiExtra['cs-dist'] == null) return null;
  return Math.round(ppiExtra['cs-prox'] + ((ppiExtra['cs-dist'] - ppiExtra['cs-prox']) * k) / (CS_SITES.length - 1));
}

/** Captured atrial stimuli in time order: { site, s }. */
function atrialCaptures(events) {
  return cached(events, 'captures', () => findCaptures(events));
}
function findCaptures(events) {
  const out = [];
  for (const [site, ch] of Object.entries(SITE_CHANNEL)) {
    if (site === 'rv') continue;
    const list = events?.[ch] || [];
    for (const st of list.filter((e) => e.type === 'S')) {
      if (list.some((e) => e.type === 'A' && e.origin === site && e.t >= st.t && e.t - st.t <= CAPTURE_MS)) out.push({ site, s: st.t });
    }
  }
  return out.sort((a, b) => a.s - b.s);
}

const mod = (x, m) => ((x % m) + m) % m;

/**
 * Entrainment of the flutter circuit by atrial pacing, at time t: the paced fronts on the ring
 * (orthodromic: on round the circuit; antidromic: against it until it meets the wave ahead),
 * their collisions, the path from a left atrial site to the CS ostium, and after the return the
 * PPI read at the pacing site. Each capture joins the circuit at
 *   e = s + ppiExtra - (flutter A of the paced channel) + (flutter A of the entry point),
 * so the last orthodromic front comes back to the pacing site TCL + ppiExtra after the stimulus,
 * as the model returns it. Null without a train of captures during flutter.
 * @param {Record<string, object[]>} events live model events (absolute times)
 * @param {number} t
 * @param {{ tcl?: number, ppiExtra?: object|null }} opts ppiExtra: the case's return cycles per site
 */
export function entrainmentAt(events, t, { tcl = DEFAULT_TCL, ppiExtra = null } = {}) {
  if (!ppiExtra) return null;
  const all = atrialCaptures(events).filter((c) => c.s <= t);
  if (!all.length) return null;
  const site = all[all.length - 1].site;
  const train = [all[all.length - 1]];
  for (let i = all.length - 2; i >= 0 && all[i].site === site && train[0].s - all[i].s <= tcl + TRAIN_GAP_MS; i--) train.unshift(all[i]);
  const anchors = flutterAnchors(events);
  const h0 = anchors.filter((a) => a <= train[0].s).at(-1);
  if (h0 == null || train[0].s - h0 > tcl + TRAIN_GAP_MS) return null;   // not paced during flutter
  const extra = ppiExtraAt(ppiExtra, site);
  if (extra == null) return null;
  const ch = SITE_CHANNEL[site], entry = entryChannel(site);
  const delay = extra - FL[ch] + FL[entry];
  const tauE = phaseOf(entry);
  const caps = train.map((c) => ({ s: c.s, e: c.s + delay }));
  const last = caps[caps.length - 1];
  const hReturn = anchors.find((a) => a > last.s) ?? null;
  const ret = (events?.[ch] || []).find((e) => e.type === 'A' && e.origin === 'flutter' && e.t > last.s);
  if (ret && t - ret.t > RESULT_MS) return null;
  const ppi = ret ? Math.round(ret.t - last.s) : null;
  const ppiTcl = ppi != null ? ppi - tcl : null;
  const verdict = ppiTcl == null ? null : ppiTcl <= 30 ? 'inCircuit' : 'outside';
  const fusion = verdict === 'inCircuit' ? (site === 'cti' ? 'concealed' : 'manifest') : verdict ? 'none' : null;
  const pcls = caps.slice(1).map((c, i) => c.s - caps[i].s);
  const pcl = pcls.length ? Math.round(pcls[pcls.length - 1]) : null;

  const fronts = [], collisions = [];
  const live = hReturn == null || t < hReturn;
  const front = (kind, phase, age) => fronts.push({ kind, phase, age, ...circuitAngle(phase, tcl) });
  // The wave ahead of the first capture is the flutter front; each later one is the previous orthodromic front.
  const firstMeet = mod(tauE - (caps[0].e - h0), tcl) / 2;
  if (live && t >= caps[0].s && t < caps[0].e + firstMeet) front('flutter', t - h0, Infinity);
  caps.forEach((c, k) => {
    const x = t - c.e;
    const meet = k === 0 ? firstMeet : Math.max(0, (tcl - (c.e - caps[k - 1].e)) / 2);
    const next = caps[k + 1];
    const orthoEnd = next ? next.e - c.e + Math.max(0, (tcl - (next.e - c.e)) / 2) : Infinity;
    if (live && x >= 0 && x < orthoEnd) front('ortho', tauE + x, x);
    if (live && x >= 0 && x < meet) front('anti', tauE - x, x);
    const tc = c.e + meet;
    if (t >= tc && t - tc < COLLISION_MS) collisions.push({ ...circuitAngle(tauE - meet, tcl), age: t - tc });
  });
  const pathCap = !IN_CIRCUIT.has(site) ? caps.find((c) => t >= c.s && t < c.e) : null;
  return {
    site, pcl, captures: caps.length, stimAge: t - caps.filter((c) => c.s <= t).at(-1).s, outside: !IN_CIRCUIT.has(site), entryAngle: circuitAngle(tauE, tcl).angle,
    fronts, collisions, path: pathCap ? (t - pathCap.s) / (pathCap.e - pathCap.s) : null,
    pacing: t - last.s < (pcl ?? tcl) + CAPTURE_MS, returned: hReturn != null && t >= hReturn,
    ppi, ppiTcl, verdict, fusion
  };
}


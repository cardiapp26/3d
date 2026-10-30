/**
 * Ashman phenomenon: aberrant conduction of an early beat after a long-short sequence. The
 * refractory period of each bundle branch follows the length of that bundle's preceding cycle
 * (Ashman 1947; Gouaux and Ashman), so a long cycle followed by a short one finds a bundle
 * still refractory. The right bundle usually has the longest refractory period at slow rates
 * (RBBB aberrancy), the left bundle at fast rates (LBBB aberrancy). AV nodal delay of an early
 * beat lengthens the H1-H2 interval and can protect the bundles; a bundle that blocked is
 * activated late across the septum, so its next cycle is short too and aberrancy can persist
 * (linking). Teaching model: linear refractoriness, one dipole, never a patient recording.
 *
 * Units: ms and mV. A = atrial activation at the AV node input, H = His, V = QRS onset.
 */
import { vectorAt, leadsOf } from '../eps/ecg12.js';

export const BUNDLES = Object.freeze(['rbb', 'laf', 'lbb']);
// ERP = base + slope * preceding cycle (ms). The right bundle line is steeper, so the two cross near 450 ms.
const ERP_LINE = Object.freeze({ rbb: [105, .32], laf: [125, .27], lbb: [165, .19] });
const RRP_FRACTION = .1;               // relative refractory width as a fraction of the ERP
const AVN = Object.freeze({ base: 230, slope: .06, ah0: 90, gain: 170, tau: 50 });
// Brisk AV nodal conduction (high sympathetic tone): less delay of early beats, so less protection of the bundles.
const AVN_FAST = Object.freeze({ base: 200, slope: .05, ah0: 75, gain: 60, tau: 40 });
export const HV = 45;
const TRANSSEPTAL_MS = 80;             // a blocked bundle is activated from the other side this much later
export const RANGES = Object.freeze({ cycle: [400, 1500], coupling: [220, 1500] });

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Effective and relative refractory periods (ms) of one bundle after a cycle of `cycle` ms. */
export function bundleRefractory(bundle, cycle, { diseased = false } = {}) {
  const [base, slope] = ERP_LINE[bundle];
  const erp = (base + slope * clamp(cycle, 250, 2000)) * (diseased ? 1.2 : 1);
  return { erp: Math.round(erp), rrp: Math.round(erp * RRP_FRACTION) };
}

/** AV node: effective refractory period and the AH of an atrial beat at coupling A1A2. */
export function avNode(cycle, a1a2, { brisk = false } = {}) {
  const n = brisk ? AVN_FAST : AVN, erp = Math.round(n.base + n.slope * cycle);
  if (a1a2 == null || a1a2 >= cycle) return { erp, ah: n.ah0, ah0: n.ah0, conducts: true };
  if (a1a2 < erp) return { erp, ah: null, ah0: n.ah0, conducts: false };
  return { erp, ah: Math.round(n.ah0 + n.gain * Math.exp(-(a1a2 - erp) / n.tau)), ah0: n.ah0, conducts: true };
}

/** How one bundle meets an impulse `avail` ms after its last activation, given its ERP / RRP. */
function bundleState(avail, { erp, rrp }) {
  if (avail < erp) return { state: 'block', degree: 1 };
  if (avail < erp + rrp) return { state: 'slow', degree: Math.round((1 - (avail - erp) / rrp) * 100) / 100 };
  return { state: 'ok', degree: 0 };
}

/** The QRS pattern from the three bundle states. */
export function patternOf(b) {
  const r = b.rbb.state, l = b.lbb.state, f = b.laf.state;
  if (r === 'block' && l === 'block') return 'blocked-hps';
  // A blocked bundle sets the shape; a merely slowed one only matters when nothing is blocked.
  if (r === 'block') return f === 'block' ? 'rbbb-lafb' : 'rbbb';
  if (l === 'block') return 'lbbb';
  if (f === 'block') return 'lafb';
  if (r === 'slow' || l === 'slow') return b.lbb.degree > b.rbb.degree ? 'lbbb-incomplete' : 'rbbb-incomplete';
  return 'normal';
}

/**
 * Conduct a run of His activations through the bundles, beat by beat. Each bundle keeps its own
 * last activation and its own preceding cycle (so linking emerges by itself).
 * @param {number[]} hTimes His activation times (ms), increasing
 * @returns {{ h: number, cycle: number, bundles: object, pattern: string }[]}
 */
export function conductRun(hTimes, { diseased = false } = {}) {
  const first = hTimes[1] != null ? hTimes[1] - hTimes[0] : 1000;
  const st = Object.fromEntries(BUNDLES.map(b => [b, { last: hTimes[0] - first, cycle: first }]));
  return hTimes.map((h, i) => {
    const bundles = {};
    for (const b of BUNDLES) {
      const ref = bundleRefractory(b, st[b].cycle, { diseased });
      bundles[b] = { ...ref, avail: Math.round(h - st[b].last), ...bundleState(h - st[b].last, ref) };
    }
    // The left anterior fascicle follows its parent: a blocked left bundle leaves it nothing to conduct.
    if (bundles.lbb.state === 'block') bundles.laf = { ...bundles.laf, state: 'block', degree: 1 };
    const pattern = patternOf(bundles);
    if (pattern !== 'blocked-hps') {
      for (const b of BUNDLES) {
        const late = bundles[b].state === 'block' ? TRANSSEPTAL_MS : bundles[b].state === 'slow' ? TRANSSEPTAL_MS * bundles[b].degree : 0;
        const act = h + late;
        st[b] = { last: act, cycle: act - st[b].last };
      }
    }
    return { h, cycle: i ? Math.round(h - hTimes[i - 1]) : first, bundles, pattern };
  });
}

/**
 * The single premature atrial beat after a steady rhythm at `cycle` (the long cycle), with
 * coupling A1A2 (P to P'). The sinus node is reset, so the pause after the PAC is about one cycle.
 */
export function prematureBeat({ cycle = 1000, coupling = 420, diseased = false, brisk = false, beforeBeats = 3 } = {}) {
  const avn = avNode(cycle, coupling, { brisk });
  const a = Array.from({ length: beforeBeats }, (_, i) => 400 + i * cycle);
  const a1 = a.at(-1), a2 = a1 + coupling;
  const sinusAfter = [a2 + cycle, a2 + 2 * cycle];
  const hSinus = x => x + avn.ah0;
  const hBefore = a.map(hSinus);
  let pac;
  if (!avn.conducts) {
    const run = conductRun([...hBefore, ...sinusAfter.map(hSinus)], { diseased });
    pac = { a: a2, h: null, v: null, ah: null, h1h2: null, bundles: null, pattern: 'blocked-avn' };
    return assemble(run, beforeBeats, pac, { cycle, coupling, avn });
  }
  const h2 = a2 + avn.ah;
  const run = conductRun([...hBefore, h2, ...sinusAfter.map(hSinus)], { diseased });
  const r = run[beforeBeats];
  pac = { a: a2, h: h2, v: r.pattern === 'blocked-hps' ? null : h2 + HV, ah: avn.ah, h1h2: Math.round(h2 - hBefore.at(-1)), bundles: r.bundles, pattern: r.pattern };
  return assemble(run.filter((_, i) => i !== beforeBeats), beforeBeats, pac, { cycle, coupling, avn });
}

function assemble(sinusRun, beforeBeats, pac, { cycle, coupling, avn }) {
  const sinus = sinusRun.map(x => ({ a: x.h - avn.ah0, h: x.h, v: x.pattern === 'blocked-hps' ? null : x.h + HV, ah: avn.ah0, bundles: x.bundles, pattern: x.pattern, sinus: true }));
  const beats = [...sinus.slice(0, beforeBeats), { ...pac, premature: true }, ...sinus.slice(beforeBeats)];
  return { beats, pac: beats[beforeBeats], cycle, coupling, avn, span: Math.round(beats.at(-1).a + cycle * .9) };
}

/** QRS width (ms) and a short code for each pattern; slow (incomplete) conduction narrows it. */
export function qrsWidth(pattern, bundles) {
  const deg = b => bundles?.[b]?.degree ?? 1;
  switch (pattern) {
    case 'rbbb': case 'rbbb-lafb': return 140;
    case 'rbbb-incomplete': return Math.round(95 + 25 * deg('rbb'));
    case 'lbbb': return 150;
    case 'lbbb-incomplete': return Math.round(95 + 30 * deg('lbb'));
    case 'lafb': return 105;
    default: return 90;
  }
}

// ---- Heart-vector lobes (t from QRS onset) ----
const P_LOBE = Object.freeze({ dir: [.45, .85, .15], sigma: 20, amp: .14 });
const PAC_P = Object.freeze({ dir: [.55, .7, -.1], sigma: 18, amp: .12 });        // a left atrial ectopic focus: different P'
const N = Object.freeze({
  septum: { dir: [-.55, .1, .75], t: 18, sigma: 6, amp: .3 },
  lv: { dir: [.7, .62, -.1], t: 43, sigma: 9, amp: 1.55 },
  term: { dir: [-.35, -.55, -.6], t: 64, sigma: 6, amp: .38 },
  t: { dir: [.5, .6, .55], t: 270, sigma: 52, amp: .36 }
});
/** QRS-T lobes of a conducted beat by pattern (degree scales incomplete blocks). */
export function qrsLobes(pattern, bundles) {
  const deg = b => bundles?.[b]?.degree ?? 1;
  const rv = d => ({ dir: [-.55, .05, .8], t: 70 + 35 * d, sigma: 10 + 6 * d, amp: .25 + .5 * d });
  const lafLv = { ...N.lv, dir: [.72, -.62, -.1] };
  switch (pattern) {
    case 'rbbb': return [N.septum, N.lv, rv(1), { ...N.t, dir: [.6, .55, -.35], amp: .3 }];
    case 'rbbb-incomplete': return [N.septum, N.lv, rv(deg('rbb') * .7), N.t];
    case 'rbbb-lafb': return [N.septum, lafLv, rv(1), { ...N.t, dir: [.65, .25, -.4], amp: .3 }];
    case 'lafb': return [N.septum, lafLv, N.term, N.t];
    case 'lbbb': case 'lbbb-incomplete': {
      const d = pattern === 'lbbb' ? 1 : deg('lbb') * .8;
      return [
        { dir: [.6, .1, -.5], t: 22, sigma: 9 + 3 * d, amp: .35 },
        { dir: [.75, .35, -.55], t: 45 + 25 * d, sigma: 10 + 12 * d, amp: 1.5 },
        { dir: [.85, .2, -.3], t: 70 + 40 * d, sigma: 8 + 6 * d, amp: .3 + .4 * d },
        { dir: [-.55 * d + .5 * (1 - d), -.3 * d + .6 * (1 - d), .55], t: 280 + 20 * d, sigma: 55, amp: .36 + .06 * d }
      ];
    }
    default: return [N.septum, N.lv, N.term, N.t];
  }
}

// Fibrillatory waves: a few incommensurate 4-8 Hz components with a slowly wandering envelope, largest in V1.
const F_LEAD_GAIN = Object.freeze({ V1: .07, II: .045 });
function fWave(i) {
  const t = i / 1000, env = .75 + .25 * Math.sin(2 * Math.PI * .23 * t);
  return env * (Math.sin(2 * Math.PI * 6.1 * t) + .6 * Math.sin(2 * Math.PI * 7.4 * t + 1.3) + .45 * Math.sin(2 * Math.PI * 4.7 * t + 2.1)) / 2.05;
}
/** Lead samples (1 kHz) of a sequence from prematureBeat or afRun; `fib` adds f waves. */
export function renderBeats(beats, span, leads = ['II', 'V1'], { fib = false } = {}) {
  const lobes = [];
  for (const b of beats) {
    if (b.a != null) lobes.push({ ...(b.premature ? PAC_P : P_LOBE), t: b.a + 45 });
    if (b.v != null) for (const l of qrsLobes(b.pattern, b.bundles)) lobes.push({ ...l, t: l.t + b.v });
  }
  const out = Object.fromEntries(leads.map(l => [l, new Float32Array(span)]));
  for (let i = 0; i < span; i++) {
    const near = lobes.filter(l => Math.abs(i - l.t) < l.sigma * 5);
    const L = leadsOf(vectorAt(near, i));
    const f = fib ? fWave(i) : 0;
    for (const l of leads) out[l][i] = L[l] + f * (F_LEAD_GAIN[l] ?? .04);
  }
  return out;
}

/** Outcome map: the pattern of the premature beat over a grid of preceding cycle and coupling. */
export function outcomeMap({ diseased = false, brisk = false, cycles = [400, 1500, 25], couplings = [220, 1000, 10] } = {}) {
  const rows = [];
  for (let c = cycles[0]; c <= cycles[1]; c += cycles[2]) {
    const row = [];
    for (let k = couplings[0]; k <= couplings[1]; k += couplings[2]) row.push(k >= c ? 'sinus' : prematureBeat({ cycle: c, coupling: k, diseased, brisk, beforeBeats: 2 }).pac.pattern);
    rows.push({ cycle: c, cells: row });
  }
  return { rows, cycles, couplings };
}

// ---- Atrial fibrillation: irregular RR with Ashman beats and linking ----
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
/**
 * Candidate RR intervals of AF (ms): irregularly irregular, with long pauses that are often
 * followed by a burst of short cycles (the classic setting for Ashman beats and linking).
 */
export function afIntervals(seconds = 10, seed = 3) {
  const r = rng(seed), out = [];
  let t = 0;
  const push = rr => { out.push(Math.round(rr)); t += rr; };
  while (t < seconds * 1000 - 300) {
    if (r() < .22) { push(900 + r() * 500); const burst = 1 + Math.floor(r() * 4); for (let k = 0; k < burst; k++) push(k ? 320 + r() * 80 : 390 + r() * 110); }
    else push(480 + r() * 420);
  }
  return out;
}
/**
 * Conduct an AF run: an impulse that finds both bundles refractory is concealed (no QRS, and the
 * bundles are not reset); the others give beats with their pattern, long-short flag and linking.
 */
export function afRun({ seconds = 10, seed = 3, diseased = false } = {}) {
  const h = [300]; for (const x of afIntervals(seconds, seed)) h.push(h.at(-1) + x);
  const run = conductRun(h.filter(x => x < seconds * 1000 - 200), { diseased }).filter(x => x.pattern !== 'blocked-hps');
  const beats = run.map((x, i) => {
    const cycle = i ? Math.round(x.h - run[i - 1].h) : x.cycle, prevCycle = i > 1 ? Math.round(run[i - 1].h - run[i - 2].h) : null;
    const longShort = prevCycle != null && prevCycle - cycle >= 250;
    const aberrant = x.pattern !== 'normal';
    const linked = aberrant && i > 0 && run[i - 1].pattern !== 'normal';
    return { a: null, h: x.h, v: x.h + HV, bundles: x.bundles, pattern: x.pattern, cycle, longShort, aberrant, linked };
  });
  return { beats, span: seconds * 1000 };
}

/** Clues that favour aberrancy over a ventricular ectopic beat, evaluated for the premature beat. */
export function aberrancyClues(result) {
  const p = result.pac, aberrant = !['normal', 'blocked-avn', 'blocked-hps'].includes(p.pattern);
  return {
    aberrant,
    clues: [
      { id: 'pWave', met: p.a != null },
      { id: 'longShort', met: aberrant && result.coupling < result.cycle * .75 },
      { id: 'rbbbShape', met: p.pattern.startsWith('rbbb') },
      { id: 'initial', met: aberrant && !p.pattern.startsWith('lbbb') },
      { id: 'noCompensatory', met: true }
    ]
  };
}

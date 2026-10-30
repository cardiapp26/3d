/**
 * Pacing on a rhythm strip: an underlying rhythm (sinus bradycardia with intact AV conduction, or
 * complete heart block with a slow escape), a pacemaker in AAI, VVI or DDD with its timers and
 * sensing, and three malfunctions (failure to capture, undersensing, oversensing). The result is a
 * list of cardiac events and device markers, rendered on the single-dipole leads (src/eps/ecg12.js)
 * with a paced QRS that depends on where the ventricular lead sits. Teaching timing model with
 * schematic morphologies; it is not a device algorithm. Times in ms.
 */
import { vectorAt, leadsOf, LEADS } from '../eps/ecg12.js';
import { NORMAL_BEAT } from './ecg-recording-model.js';

export const MODES = Object.freeze(['AAI', 'VVI', 'DDD']);
export const FAULTS = Object.freeze(['none', 'capture', 'undersensing', 'oversensing']);
export const SITES = Object.freeze(['rvApex', 'rvSeptum', 'his', 'lbbap', 'biv']);
export const DEVICE = Object.freeze({ lri: 1000, avDelay: 170, sensedAv: 150, vrp: 250, arp: 250, pvarp: 280, url: 500 });
/** NBG code letters: chamber paced, chamber sensed, response to sensing (then R and multisite). */
export const NBG = Object.freeze({ AAI: ['A', 'A', 'I'], VVI: ['V', 'V', 'I'], DDD: ['D', 'D', 'D'] });

/**
 * Underlying rhythm: sinus node disease for AAI, complete AV block for VVI and DDD. Undersensing is
 * shown on a heart that beats on its own faster than the lower rate (the device should stay quiet).
 */
export function rhythmFor(mode, fault = 'none') {
  if (fault === 'undersensing') return { sinusRate: 82, avIntact: true, pr: 165, escape: null };
  return mode === 'AAI' ? { sinusRate: 42, avIntact: true, pr: 170, escape: null } : { sinusRate: 78, avIntact: false, pr: null, escape: 1750 };
}

/**
 * Run the strip.
 * @param {{ mode?: string, fault?: string, seconds?: number }} options
 * @returns {{ events: { t: number, kind: string, captured?: boolean }[], markers: { t: number, label: string }[], noise: [number, number][] }}
 */
export function simulatePacing({ mode = 'VVI', fault = 'none', seconds = 10 } = {}) {
  const r = rhythmFor(mode, fault), D = DEVICE, end = seconds * 1000;
  const events = [], markers = [], noise = [];
  const pacesV = mode !== 'AAI', pacesA = mode !== 'VVI', sensesV = mode !== 'AAI', sensesA = mode !== 'VVI';
  // Oversensing: bursts of myopotential noise the ventricular (or atrial) channel takes for beats.
  if (fault === 'oversensing') for (const t0 of [2600, 6100]) noise.push([t0, t0 + 1300]);
  const inNoise = t => noise.some(([a, b]) => t >= a && t <= b);
  let nextSinus = 300, lastV = -10000, lastA = -10000, escapeDue = r.escape ? 900 : Infinity;
  let aTimerFrom = 0, vTimerFrom = 0, avPending = null, paceCount = 0, ventricleRefractoryUntil = -1, atriaRefractoryUntil = -1;
  const sensedV = t => sensesV && fault !== 'undersensing' && t - lastVDevice > D.vrp;
  let lastVDevice = -10000;
  const conductedAt = new Set();
  const ventricular = (t, kind, captured = true) => {
    events.push({ t, kind, captured });
    if (!captured) return;
    lastV = t; ventricleRefractoryUntil = t + 260; escapeDue = r.escape ? t + r.escape : Infinity;
  };
  for (let t = 0; t <= end; t++) {
    // Sinus node fires on its own schedule (it keeps firing through complete block).
    if (t === Math.round(nextSinus)) {
      nextSinus += 60000 / r.sinusRate;
      if (t > atriaRefractoryUntil) {
        events.push({ t, kind: 'P' }); lastA = t; atriaRefractoryUntil = t + 220;
        if (mode === 'AAI' && fault !== 'undersensing') aTimerFrom = t;
        if (r.avIntact) conductedAt.add(t + r.pr);
        if (sensesA && !(fault === 'undersensing' && mode === 'AAI') && t - lastVDevice > D.pvarp) {
          markers.push({ t, label: 'AS' }); aTimerFrom = t;
          if (mode === 'DDD') avPending = { due: t + D.sensedAv };
        }
      }
    }
    // A conducted or escape beat is a ventricular event the device may sense.
    if (conductedAt.has(t) && t > ventricleRefractoryUntil) {
      ventricular(t, 'QRS');
      if (sensedV(t)) { markers.push({ t, label: 'VS' }); vTimerFrom = t; lastVDevice = t; avPending = null; }
    }
    if (t >= escapeDue && t > ventricleRefractoryUntil) {
      ventricular(t, 'escape');
      if (sensedV(t)) { markers.push({ t, label: 'VS' }); vTimerFrom = t; lastVDevice = t; avPending = null; }
    }
    // Noise sensed as ventricular events resets the timer (inhibits pacing).
    if (inNoise(t) && t % 180 === 0 && sensesV) { markers.push({ t, label: 'VS' }); vTimerFrom = t; lastVDevice = t; avPending = null; }
    if (inNoise(t) && t % 180 === 0 && mode === 'AAI') { markers.push({ t, label: 'AS' }); aTimerFrom = t; }
    // Atrial pacing (AAI, DDD).
    const aDue = mode === 'AAI' ? aTimerFrom + D.lri : vTimerFrom + D.lri - D.avDelay;
    if (pacesA && t === Math.round(aDue) && (t - lastA > 300 || (fault === 'undersensing' && mode === 'AAI'))) {
      const captured = !(fault === 'capture' && mode === 'AAI' && paceCount++ % 2 === 1) && t > atriaRefractoryUntil;
      events.push({ t, kind: 'spikeA' }); markers.push({ t, label: 'AP' });
      if (captured) {
        events.push({ t: t + 25, kind: 'pacedP' }); lastA = t; atriaRefractoryUntil = t + 250;
        nextSinus = t + 60000 / r.sinusRate;   // the paced atrium resets the sinus node
        if (r.avIntact) conductedAt.add(t + 25 + r.pr);
      }
      aTimerFrom = t;
      if (mode === 'DDD') avPending = { due: t + D.avDelay };
    }
    // Ventricular pacing.
    const vDue = mode === 'DDD' ? avPending?.due : vTimerFrom + D.lri;
    const asynchronous = fault === 'undersensing';
    if (pacesV && (t === Math.round(vDue ?? -1) || (mode === 'DDD' && t === Math.round(vTimerFrom + D.lri) && !avPending))) {
      const refractory = t <= ventricleRefractoryUntil;   // a spike into refractory myocardium cannot capture
      const lost = fault === 'capture' && paceCount++ % 2 === 1;
      const captured = !refractory && !lost;
      events.push({ t, kind: 'spikeV' }); markers.push({ t, label: 'VP' });
      ventricular(t + 2, 'pacedQRS', captured);
      vTimerFrom = t; lastVDevice = t; avPending = null;
      if (asynchronous) vTimerFrom = t;   // with undersensing the timer only follows its own pulses
    }
  }
  return { events: events.sort((a, b) => a.t - b.t), markers: markers.sort((a, b) => a.t - b.t), noise, rhythm: r };
}

// ---- Morphology ----
const P_LOBE = NORMAL_BEAT[0], SINUS_QRS_T = NORMAL_BEAT.slice(1);
const shift = (lobes, dt, scale = 1) => lobes.map(l => ({ ...l, t: l.t + dt, amp: l.amp * scale }));
/**
 * Paced QRS and T lobes by lead site (from the spike, ms). RV apex: wide, superior axis, LBBB-like;
 * RV septum: wide, inferior axis; His (selective): isoelectric interval then the native QRS;
 * LBBAP: shorter, terminal R in V1 (RBBB-like); biventricular: narrower, dominant R in V1.
 */
export const PACED = Object.freeze({
  rvApex: [{ dir: [.2, -.75, -.6], t: 50, sigma: 24, amp: 1.2 }, { dir: [.75, -.25, -.55], t: 105, sigma: 26, amp: .9 }, { dir: [-.3, .6, .6], t: 330, sigma: 60, amp: .38 }],
  rvSeptum: [{ dir: [.35, .65, -.6], t: 52, sigma: 22, amp: 1.05 }, { dir: [.8, .35, -.45], t: 100, sigma: 24, amp: .85 }, { dir: [-.45, -.35, .7], t: 330, sigma: 58, amp: .34 }],
  his: shift(SINUS_QRS_T, -160 + 45),
  lbbap: [{ dir: [.7, .55, -.3], t: 42, sigma: 14, amp: 1.25 }, { dir: [-.45, .1, .85], t: 88, sigma: 15, amp: .55 }, { dir: [.5, .6, .45], t: 300, sigma: 52, amp: .3 }],
  biv: [{ dir: [-.6, -.45, .6], t: 45, sigma: 18, amp: .9 }, { dir: [.45, -.1, -.5], t: 100, sigma: 20, amp: .45 }, { dir: [.4, .5, .5], t: 310, sigma: 54, amp: .3 }]
});
const SPIKE = 2.2;   // mV, 1 ms wide, in every lead (bipolar spikes are smaller; drawn unipolar for clarity)

/** Heart vector of all events at time t (ms), with the ventricular paced shape of a site. */
function vectorOf(events, t, site) {
  const sum = [0, 0, 0];
  const add = v => { sum[0] += v[0]; sum[1] += v[1]; sum[2] += v[2]; };
  for (const e of events) {
    const dt = t - e.t;
    if (dt < -60 || dt > 700) continue;
    if (e.kind === 'P' || e.kind === 'pacedP') add(vectorAt([{ ...P_LOBE, t: 40 }], dt));
    else if ((e.kind === 'QRS' || e.kind === 'escape') && e.captured !== false) add(vectorAt(shift(SINUS_QRS_T, -160 + (e.kind === 'escape' ? 0 : 0)), dt));
    else if (e.kind === 'pacedQRS' && e.captured) add(vectorAt(PACED[site] || PACED.rvApex, dt));
  }
  return sum;
}
/** Leads (II, V1 and the rest) over the strip at 1 kHz, spikes and noise added. */
export function renderStrip(result, { site = 'rvApex', seconds = 10, leads = ['II', 'V1'] } = {}) {
  const n = seconds * 1000, out = Object.fromEntries(leads.map(l => [l, new Float32Array(n)]));
  let seed = 11; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 - .5; };
  for (let i = 0; i < n; i++) {
    const L = leadsOf(vectorOf(result.events, i, site));
    for (const l of leads) out[l][i] = L[l];
  }
  for (const e of result.events) if (e.kind === 'spikeA' || e.kind === 'spikeV') for (const l of leads) { out[l][e.t] += SPIKE; if (out[l][e.t + 1] != null) out[l][e.t + 1] -= SPIKE * .3; }
  for (const [a, b] of result.noise) for (let i = a; i <= b && i < n; i++) { const v = rnd() * .22; for (const l of leads) out[l][i] += v; }
  return out;
}
/** One beat of a paced ventricle in all twelve leads (spike at 0), next to the sinus beat. */
export function pacedBeat(site = 'rvApex', span = 600) {
  const paced = Object.fromEntries(LEADS.map(l => [l, []])), sinus = Object.fromEntries(LEADS.map(l => [l, []]));
  for (let t = -60; t <= span; t++) {
    const p = leadsOf(vectorAt(PACED[site] || PACED.rvApex, t)), s = leadsOf(vectorAt(shift(SINUS_QRS_T, -160), t));
    for (const l of LEADS) { paced[l].push(p[l] + (t === 0 ? SPIKE * .6 : 0)); sinus[l].push(s[l]); }
  }
  return { from: -60, paced, sinus };
}
/** QRS width (ms) of a paced beat from its envelope, and the V1 terminal polarity. */
export function pacedMeasures(site) {
  const b = pacedBeat(site, 400);
  // Depolarization only: the paced shape without its T lobe (the last lobe).
  const lobes = (PACED[site] || PACED.rvApex).slice(0, -1);
  const env = Array.from({ length: 360 }, (_, i) => { const L = leadsOf(vectorAt(lobes, i - 60)); return Math.hypot(L.I, L.aVF, L.V1); });
  const qrsEnd = 60 + 260, peak = Math.max(...env.slice(62, qrsEnd));
  const active = env.map((v, i) => (i > 62 && i < qrsEnd && v > peak * .08 ? i : null)).filter(i => i != null);
  const width = active.length ? active.at(-1) - active[0] : 0;
  const v1 = b.paced.V1.slice(active[0] ?? 62, (active.at(-1) ?? qrsEnd) + 1);
  const axis = Math.round((Math.atan2(b.paced.aVF.slice(62, qrsEnd).reduce((a, x) => a + x, 0), b.paced.I.slice(62, qrsEnd).reduce((a, x) => a + x, 0)) * 180) / Math.PI);
  return { width, axis, v1Terminal: Math.sign(v1.slice(-Math.ceil(v1.length / 3)).reduce((a, x) => a + x, 0)), latency: (active[0] ?? 62) - 60 };
}

/*
 * Live EP laboratory: a discrete-event conduction model that runs
 * continuously and answers stimuli. Tissues (atrium, AV node fast and slow
 * pathways, His-Purkinje, ventricle, accessory pathway) each keep their last
 * activation time and an effective refractory period; the AV node pathways
 * conduct decrementally (shorter recovery, longer AH). A wavefront that
 * meets refractory tissue blocks; one that reaches recovered tissue
 * conducts, so echoes and reentry (AVNRT, orthodromic AVRT) arise from the
 * timing of the stimuli instead of being scripted. Atrial and ventricular
 * wavefronts also conceal into the pathways they reach. Designed teaching
 * timings (ms), not patient physiology.
 */
import { ev, far, mono } from './ep-beats.js';

export const LIVE_CHANNELS = Object.freeze(['ecg-ii', 'ecg-v1', 'hra', 'his-p', 'his-d', 'cs-910', 'cs-78', 'cs-56', 'cs-34', 'cs-12', 'rv']);
export const LIVE_SITES = Object.freeze(['hra', 'cs-prox', 'cs-dist', 'rv']);
const ATRIAL_CHANNELS = ['hra', 'his-p', 'his-d', 'cs-910', 'cs-78', 'cs-56', 'cs-34', 'cs-12'];

// Atrial activation sequences per origin: channel A times after the origin's
// activation; avj: arrival at the AV junction; ap: arrival at the left
// lateral pathway insertion; p: surface P onset (sign: retrograde P negative).
const ORIGINS = Object.freeze({
  sinus: { hra: 0, 'his-p': 32, 'his-d': 35, 'cs-910': 45, 'cs-78': 55, 'cs-56': 63, 'cs-34': 72, 'cs-12': 80, avj: 35, ap: 75, p: 0, pAmp: 0.22 },
  hra: { hra: 2, 'his-p': 34, 'his-d': 37, 'cs-910': 47, 'cs-78': 57, 'cs-56': 65, 'cs-34': 74, 'cs-12': 82, avj: 37, ap: 77, p: 4, pAmp: 0.22 },
  'cs-prox': { 'cs-910': 2, 'cs-78': 12, 'his-d': 18, 'his-p': 20, 'cs-56': 22, 'cs-34': 32, 'cs-12': 42, hra: 55, avj: 15, ap: 40, p: 6, pAmp: -0.14 },
  'cs-dist': { 'cs-12': 2, 'cs-34': 12, 'cs-56': 22, 'cs-78': 32, 'cs-910': 42, 'his-d': 55, 'his-p': 57, hra: 80, avj: 55, ap: 5, p: 10, pAmp: 0.12 },
  // Retrograde through the AV node: septal (His) first, concentric.
  'avn-fast': { 'his-d': 0, 'his-p': -2, 'cs-910': 10, 'cs-78': 18, 'cs-56': 26, 'cs-34': 36, 'cs-12': 46, hra: 25, avj: 0, ap: 45, p: 5, pAmp: -0.15 },
  // Retrograde through a left lateral pathway: CS distal first, eccentric.
  'ap-left': { 'cs-12': 0, 'cs-34': 14, 'cs-56': 28, 'cs-78': 42, 'cs-910': 56, 'his-d': 62, 'his-p': 64, hra: 85, avj: 62, ap: 0, p: 10, pAmp: -0.15 }
});

const BASE = Object.freeze({
  sinusCl: 800, aErp: 220, vErp: 240, hpsErp: 260, hv: 45,
  fp: { ah: 75, dec: 110, tau: 110, erp: 300, retro: 75, retroErp: 300 },
  sp: null, ap: null
});

/** Cases of the live laboratory (phase 1: nodal and accessory pathway substrates). */
export const LIVE_CASES = Object.freeze({
  normal: { ...BASE },
  // Dual AV nodal physiology: the fast pathway's ERP is longer than the slow pathway's.
  'avnrt-typical': { ...BASE, fp: { ...BASE.fp, erp: 380 }, sp: { ah: 260, dec: 90, tau: 50, erp: 250 } },
  // Concealed left lateral pathway: retrograde only.
  'ort-left': { ...BASE, fp: { ...BASE.fp, erp: 250, dec: 120, tau: 130 }, ap: { ante: false, retro: 70, erp: 180, anteDelay: 25 } },
  // Manifest left lateral pathway: pre-excitation in sinus rhythm.
  'wpw-left': { ...BASE, ap: { ante: true, retro: 70, erp: 280, anteDelay: 25 } }
});

/** Stimulus train: S1 × n then the extrastimuli (each coupled to the previous stimulus; 0 or empty = off). */
export function planTrain({ site, start, s1, n, extras = [] }) {
  if (!LIVE_SITES.includes(site) || !(s1 > 0) || !(n >= 1)) return [];
  const out = [];
  for (let i = 0; i < n; i++) out.push({ t: start + i * s1, site });
  let t = out[out.length - 1].t;
  for (const x of extras) {
    if (!(x > 0)) break;
    t += x;
    out.push({ t, site });
  }
  return out;
}

/** Decremental conduction: the AH grows as the pathway's recovery time approaches its ERP. */
const decremental = (path, recovery) => path.ah + path.dec * Math.exp(-(recovery - path.erp) / path.tau);

/**
 * One running heart for a case.
 * @returns {{ caseId: string, now: () => number, advanceTo(t: number): void, stimulate(list: {t: number, site: string}[]): void,
 *   cardiovert(t: number): void, events(from: number, to: number): Object<string, object[]>, beats(): object[] }}
 */
export function createLiveHeart(caseId = 'normal') {
  const p = LIVE_CASES[caseId] || LIVE_CASES.normal;
  const queue = [];
  const log = Object.fromEntries(LIVE_CHANNELS.map((ch) => [ch, []]));
  const last = { atrium: -1e9, fp: -1e9, sp: -1e9, his: -1e9, v: -1e9, ap: -1e9 };
  const beats = [];   // per ventricular activation: { v, h, a, origin }
  let now = 0;
  let lastAtrium = null;   // { t, origin } of the latest atrial activation (for the beat log)

  const schedule = (t, kind, data = {}) => {
    const item = { t, kind, data };
    let i = queue.length;
    while (i > 0 && queue[i - 1].t > t) i--;
    queue.splice(i, 0, item);
  };
  const record = (ch, e) => log[ch]?.push(e);
  const ready = (node, t, erp) => t - last[node] >= erp;

  function activateAtrium(t, origin) {
    if (!ready('atrium', t, p.aErp)) return;
    last.atrium = t;
    lastAtrium = { t, origin };
    const o = ORIGINS[origin];
    for (const ch of ATRIAL_CHANNELS) {
      if (o[ch] == null) continue;
      record(ch, ev('A', t + o[ch], ch === 'his-d' ? 0.35 : ch === 'his-p' ? 0.6 : 0.75));
    }
    record('ecg-ii', mono('P', t + o.p, o.pAmp, 10));
    // Another wavefront reaching the sinus node resets it.
    if (origin !== 'sinus') {
      for (let i = queue.length - 1; i >= 0; i--) if (queue[i].kind === 'sinus') queue.splice(i, 1);
      schedule(t + (o.hra ?? 0) + p.sinusCl + 40, 'sinus');
    }
    schedule(t + o.avj, 'avn-ante');
    if (p.ap && origin !== 'ap-left') schedule(t + o.ap, 'ap-atrial');
  }

  function avnAnte(t) {
    const fpReady = ready('fp', t, p.fp.erp);
    const spReady = p.sp && ready('sp', t, p.sp.erp);
    let ah, path;
    if (fpReady) {
      ah = decremental(p.fp, t - last.fp); path = 'fast';
      last.fp = t;
      if (spReady) last.sp = t;   // concealed into the slow pathway
    } else if (spReady) {
      ah = decremental(p.sp, t - last.sp); path = 'slow';
      last.sp = t;
    } else return;   // AV nodal block
    const h = t + ah;
    schedule(h, 'his', { aJunction: t, path });
    // Echo: slow-pathway arrival at the lower common pathway with a recovered fast pathway turns back up it.
    if (path === 'slow' && ready('fp', h, p.fp.retroErp)) {
      last.fp = h;
      schedule(h + p.fp.retro, 'atrium', { origin: 'avn-fast' });
    }
  }

  function his(t, data) {
    record('his-d', ev('H', t, 0.7, 4));
    record('his-p', ev('H', t, 0.3, 4));
    if (!ready('his', t, p.hpsErp)) return;   // infra-His block
    last.his = t;
    schedule(t + p.hv, 'ventricle', { origin: 'his', h: t, aJunction: data.aJunction });
  }

  function ventricle(t, { origin, h = null, aJunction = null }) {
    if (!ready('v', t, p.vErp)) return;
    last.v = t;
    const wide = origin !== 'his';
    const sigma = wide ? 16 : 8;
    if (origin === 'ap') record('ecg-ii', mono('delta', t, 0.3, 7));
    const qrs = origin === 'ap' ? t + 30 : origin === 'rv' ? t + 20 : t;
    record('ecg-ii', ev('V', qrs, 0.9, sigma));
    record('ecg-v1', ev('V', qrs, origin === 'ap' ? 0.6 : -0.5, sigma));
    record('rv', ev('V', origin === 'rv' ? t : t + 5, 0.9));
    record('his-d', far('V', t + (origin === 'his' ? 0 : 25), origin === 'his' ? 0.9 : 0.6, origin === 'his' ? 6 : 10));
    record('his-p', far('V', t + (origin === 'his' ? 0 : 25), 0.5, origin === 'his' ? 6 : 10));
    for (const [ch, dt] of [['cs-910', 15], ['cs-78', 17], ['cs-56', 19], ['cs-34', 21], ['cs-12', 23]]) record(ch, far('V', t + dt, 0.4, 8));
    beats.push({ v: t, h, aJunction, origin, a: lastAtrium });
    // Retrograde into the His bundle and the AV node (paced or pre-excited beats).
    if (origin !== 'his') {
      const hr = t + (origin === 'rv' ? 45 : 30);
      if (ready('his', hr, p.hpsErp)) {
        last.his = hr;
        if (ready('fp', hr, p.fp.retroErp)) {
          last.fp = hr;
          if (p.sp && ready('sp', hr, p.sp.erp)) last.sp = hr;
          schedule(hr + p.fp.retro, 'atrium', { origin: 'avn-fast' });
        }
      }
    }
    // Retrograde up the accessory pathway.
    if (p.ap && origin !== 'ap' && ready('ap', t, p.ap.erp)) {
      last.ap = t;
      schedule(t + p.ap.retro, 'atrium', { origin: 'ap-left' });
    }
  }

  function apAtrial(t) {
    if (!ready('ap', t, p.ap.erp)) return;
    last.ap = t;   // antegrade conduction, or concealment of a retrograde-only pathway
    if (p.ap.ante) schedule(t + p.ap.anteDelay, 'ventricle', { origin: 'ap' });
  }

  function stim(t, site) {
    const ch = site === 'cs-prox' ? 'cs-910' : site === 'cs-dist' ? 'cs-12' : site;
    record(ch, ev('S', t, 0.5, 2));
    if (site === 'rv') ventricle(t + 10, { origin: 'rv' });
    else activateAtrium(t + 2, site);
  }

  const handlers = {
    sinus: (t) => { activateAtrium(t, 'sinus'); if (!queue.some((q) => q.kind === 'sinus')) schedule(t + p.sinusCl, 'sinus'); },
    stim: (t, d) => stim(t, d.site),
    atrium: (t, d) => activateAtrium(t, d.origin),
    'avn-ante': (t) => avnAnte(t),
    'ap-atrial': (t) => apAtrial(t),
    his: (t, d) => his(t, d),
    ventricle: (t, d) => ventricle(t, d)
  };

  schedule(200, 'sinus');

  return {
    caseId: LIVE_CASES[caseId] ? caseId : 'normal',
    now: () => now,
    /** Process every event up to time t. */
    advanceTo(t) {
      while (queue.length && queue[0].t <= t) {
        const item = queue.shift();
        handlers[item.kind](item.t, item.data);
      }
      now = Math.max(now, t);
    },
    /** Queue stimuli (absolute times, not earlier than now). */
    stimulate(list) { for (const s of list) if (s.t >= now && LIVE_SITES.includes(s.site)) schedule(s.t, 'stim', { site: s.site }); },
    /** Cancel stimuli still to come. */
    stopPacing() { for (let i = queue.length - 1; i >= 0; i--) if (queue[i].kind === 'stim') queue.splice(i, 1); },
    /** DC shock: every tissue depolarized at t, pending wavefronts and stimuli cleared, sinus resumes. */
    cardiovert(t) {
      queue.length = 0;
      for (const k of Object.keys(last)) last[k] = t;
      record('ecg-ii', ev('DC', t, 1.6, 3)); record('ecg-v1', ev('DC', t, -1.4, 3));
      schedule(t + 900, 'sinus');
    },
    /** Event lists of every channel within [from, to]. */
    events(from, to) {
      return Object.fromEntries(Object.entries(log).map(([ch, list]) => [ch, list.filter((e) => e.t >= from && e.t <= to)]));
    },
    /** Drop events older than t (memory bound of a long session). */
    trim(t) {
      for (const list of Object.values(log)) { let i = 0; while (i < list.length && list[i].t < t) i++; if (i) list.splice(0, i); }
      while (beats.length && beats[0].v < t) beats.shift();
    },
    beats: () => beats.slice()
  };
}

/** Intervals of the latest complete beat, read from the events (ms; null when not present). */
export function liveIntervals(events) {
  const times = (ch, type) => (events[ch] || []).filter((e) => e.type === type).map((e) => e.t);
  const lastPair = (list) => (list.length >= 2 ? Math.round(list[list.length - 1] - list[list.length - 2]) : null);
  const hisA = times('his-d', 'A'), hisH = times('his-d', 'H'), hisV = times('his-d', 'V'), rvV = times('rv', 'V');
  const lastV = hisV[hisV.length - 1];
  const hBefore = hisH.filter((h) => lastV != null && h <= lastV && lastV - h < 150).pop();
  const aBefore = hisA.filter((a) => hBefore != null && a <= hBefore && hBefore - a < 450).pop();
  const prevV = hisV[hisV.length - 2];
  const aAfterPrev = hisA.filter((a) => prevV != null && a > prevV && (lastV == null || a < lastV)).shift();
  return {
    pp: lastPair(times('hra', 'A')),
    rr: lastPair(rvV),
    ah: aBefore != null ? Math.round(hBefore - aBefore) : null,
    hv: hBefore != null ? Math.round(lastV - hBefore) : null,
    // VA only for an A that follows the V closely enough to be its retrograde (or tachycardia) A.
    va: aAfterPrev != null && lastV != null && aAfterPrev - prevV < 0.7 * (lastV - prevV) ? Math.round(aAfterPrev - prevV) : null
  };
}

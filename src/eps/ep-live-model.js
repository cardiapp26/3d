/*
 * Live EP laboratory: a discrete-event conduction model that runs
 * continuously and answers stimuli. Tissues (atrium, AV node fast and slow
 * pathways, His-Purkinje, ventricle, accessory pathway) each keep their last
 * activation time and an effective refractory period; the AV node pathways
 * conduct decrementally (shorter recovery, longer AH). A wavefront that
 * meets refractory tissue blocks; one that reaches recovered tissue
 * conducts, so echoes and reentry (typical and atypical AVNRT, orthodromic
 * AVRT, PJRT) arise from the timing of the stimuli instead of being
 * scripted. Atrial and ventricular wavefronts also conceal into the
 * pathways they reach. Focal AT, CTI flutter, AF and scar VT start after
 * rapid capture (substrates.js triggers) and run until cardioversion (focal
 * AT is automatic and resumes after a shock) or an RF lesion removes their
 * substrate. Designed teaching timings (ms), not patient physiology.
 */
import { ev, far, mono } from './ep-beats.js';
import { ORIGINS, LIVE_CASES, ABLATION_TARGETS, RF_LESION_MS } from './ep-live-substrates.js';

export { LIVE_CASES, ABLATION_TARGETS, RF_LESION_MS };
export const LIVE_CHANNELS = Object.freeze(['ecg-ii', 'ecg-v1', 'hra', 'his-p', 'his-d', 'cs-910', 'cs-78', 'cs-56', 'cs-34', 'cs-12', 'rv']);
export const LIVE_SITES = Object.freeze(['hra', 'cs-prox', 'cs-dist', 'rv']);
const ATRIAL_CHANNELS = ['hra', 'his-p', 'his-d', 'cs-910', 'cs-78', 'cs-56', 'cs-34', 'cs-12'];

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

/** Decremental conduction: the delay grows as the tissue's recovery time approaches its ERP. */
const decremental = (base, dec, tau, erp, recovery) => base + dec * Math.exp(-(recovery - erp) / tau);

// Small deterministic PRNG (mulberry32) for the fibrillatory activations.
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * One running heart for a case (its own mutable copy of the case parameters).
 * @returns {object} advanceTo, stimulate, stopPacing, cardiovert, rfStart, rfStop, events, trim, beats, status, lesions
 */
export function createLiveHeart(caseId = 'normal') {
  const id = LIVE_CASES[caseId] ? caseId : 'normal';
  const p = JSON.parse(JSON.stringify(LIVE_CASES[id]));
  p.avBlock = false;
  const rand = prng(id.length * 7919 + 17);
  const queue = [];
  const log = Object.fromEntries(LIVE_CHANNELS.map((ch) => [ch, []]));
  // The slow pathway keeps both ends: spTop (atrial end), spBottom (lower common
  // pathway end) and spAnte (last antegrade entry, whose wave occupies the
  // pathway for about its conduction time and collides with a retrograde one).
  const last = { atrium: -1e9, fp: -1e9, spTop: -1e9, spBottom: -1e9, spAnte: -1e9, his: -1e9, v: -1e9, ap: -1e9 };
  const active = { at: false, flutter: false, af: false, vt: false };
  const runs = { a: { lastT: -1e9, count: 0 }, v: { lastT: -1e9, count: 0 } };
  const beats = [];
  const lesions = [];
  let rf = null;   // { target, token }
  let now = 0;
  let lastAtrium = null;
  let pacedRun = 0;
  let lastFlutterCapture = null;   // consecutive paced atrial captures since the last sinus beat

  const schedule = (t, kind, data = {}) => {
    const item = { t, kind, data };
    let i = queue.length;
    while (i > 0 && queue[i - 1].t > t) i--;
    queue.splice(i, 0, item);
  };
  const unschedule = (kind) => { for (let i = queue.length - 1; i >= 0; i--) if (queue[i].kind === kind) queue.splice(i, 1); };
  const record = (ch, e) => log[ch]?.push(e);
  const ready = (node, t, erp) => t - last[node] >= erp;

  function activateAtrium(t, origin, { force = false, offsets = null } = {}) {
    if (!force && !ready('atrium', t, p.aErp)) return false;
    if (!LIVE_SITES.includes(origin)) pacedRun = 0;   // a non-paced activation ends the paced run
    last.atrium = t;
    lastAtrium = { t, origin };
    const o = offsets || ORIGINS[origin];
    const amp = origin === 'af' ? 0.3 : null;
    for (const ch of ATRIAL_CHANNELS) {
      if (o[ch] == null) continue;
      record(ch, ev('A', t + o[ch], amp ?? (ch === 'his-d' ? 0.35 : ch === 'his-p' ? 0.6 : 0.75), origin === 'af' ? 3 : 5, { origin }));
    }
    if (origin === 'flutter') record('ecg-ii', mono('F', t + 60, -0.16, 45));
    else if (origin === 'af') record('ecg-ii', mono('f', t + 20, (rand() - 0.5) * 0.08, 12));
    else if (o.p != null) record('ecg-ii', mono('P', t + o.p, o.pAmp, 10));
    // Another wavefront reaching the sinus node (or an automatic focus) resets it;
    // after a paced run the node recovers late (overdrive suppression: SNRT).
    if (origin !== 'sinus') {
      unschedule('sinus');
      schedule(t + (o.hra ?? 0) + p.sinusCl + 40 + (pacedRun >= 8 ? p.snSuppression : 0), 'sinus');
    }
    if (active.at && origin !== p.at.origin) { unschedule('at-fire'); schedule(t + 40 + p.at.cl, 'at-fire'); }
    schedule(t + o.avj, 'avn-ante');
    if (p.ap && origin !== p.ap.origin) schedule(t + o[p.ap.insertion], 'ap-atrial');
    return true;
  }

  function avnAnte(t) {
    if (p.avBlock) return;
    const fpReady = ready('fp', t, p.fp.erp);
    const spReady = p.sp && ready('spTop', t, p.sp.erp);
    let ah, path;
    if (fpReady) {
      ah = decremental(p.fp.ah, p.fp.dec, p.fp.tau, p.fp.erp, t - last.fp); path = 'fast';
      last.fp = t;
      if (spReady) { last.spTop = t; last.spAnte = t; }   // concealed into the slow pathway
    } else if (spReady) {
      ah = decremental(p.sp.ah, p.sp.dec, p.sp.tau, p.sp.erp, t - last.spTop); path = 'slow';
      last.spTop = t; last.spAnte = t; last.spBottom = t + ah;
    } else return;   // AV nodal block
    schedule(t + ah, 'his', { aJunction: t, path });
  }

  // Arrival at the lower common pathway and the His, decided at arrival time so
  // that a retrograde wave that got there first (pacing, PVC) blocks both.
  function his(t, data) {
    if (p.avBlock && data.path) return;
    if (!ready('his', t, p.hpsErp)) return;   // His already activated (collision) or refractory
    // Echo: slow down, fast up (typical) or fast down, slow up (atypical).
    if (data.path === 'slow' && ready('fp', t, p.fp.retroErp)) {
      last.fp = t;
      schedule(t + p.fp.retro, 'atrium', { origin: 'avn-fast' });
    } else if (data.path === 'fast' && spRetroReady(t)) spRetro(t);
    record('his-d', ev('H', t, 0.7, 4));
    record('his-p', ev('H', t, 0.3, 4));
    last.his = t;
    schedule(t + p.hv, 'ventricle', { origin: 'his', h: t, aJunction: data.aJunction ?? null });
  }

  // Retrograde slow-pathway conduction: its lower end recovered and no antegrade wave still in it.
  const spRetroReady = (x) => Boolean(p.sp?.retro) && ready('spBottom', x, p.sp.retroErp) && x - last.spAnte >= p.sp.ah + 50;
  function spRetro(x) {
    last.spBottom = x; last.spTop = x + p.sp.retro;
    schedule(x + p.sp.retro, 'atrium', { origin: 'avn-slow' });
  }

  // Retrograde over the AV node from below (paced, escape, VT or junctional beats).
  function avnRetro(hr) {
    if (p.avBlock) return;
    if (ready('fp', hr, p.fp.retroErp)) {
      last.fp = hr;
      if (p.sp && ready('spBottom', hr, p.sp.erp)) last.spBottom = hr;   // concealed from below
      schedule(hr + p.fp.retro, 'atrium', { origin: 'avn-fast' });
    } else if (spRetroReady(hr)) spRetro(hr);
  }

  const QRS = {
    his: { lag: 0, sigma: 8, v1: -0.5 }, rv: { lag: 20, sigma: 16, v1: -0.5 }, escape: { lag: 20, sigma: 18, v1: -0.5 },
    ap: { lag: 30, sigma: 16, v1: 0.6 }, vt: { lag: 15, sigma: 18, v1: 0.8 }
  };
  function ventricle(t, { origin, h = null, aJunction = null }, force = false) {
    if (!force && !ready('v', t, p.vErp)) return false;
    last.v = t;
    const q = QRS[origin] || QRS.rv;
    if (origin === 'ap') record('ecg-ii', mono('delta', t, 0.3, 7));
    record('ecg-ii', ev('V', t + q.lag, origin === 'vt' ? -0.8 : 0.9, q.sigma));
    record('ecg-v1', ev('V', t + q.lag, q.v1, q.sigma));
    record('rv', ev('V', origin === 'rv' ? t : t + (origin === 'vt' ? 40 : 5), 0.9, 5, { origin }));
    const nearHis = origin === 'his';
    record('his-d', far('V', t + (nearHis ? 0 : 25), nearHis ? 0.9 : 0.6, nearHis ? 6 : 10));
    record('his-p', far('V', t + (nearHis ? 0 : 25), 0.5, nearHis ? 6 : 10));
    for (const [ch, dt] of [['cs-910', 15], ['cs-78', 17], ['cs-56', 19], ['cs-34', 21], ['cs-12', 23]]) record(ch, far('V', t + dt, 0.4, 8));
    beats.push({ v: t, h, aJunction, origin, a: lastAtrium });
    schedule(t + p.escapeCl, 'escape', { token: t });
    // Retrograde into the His and AV node (paced, pre-excited and VT beats; escape beats do not conduct back).
    if (origin !== 'his' && origin !== 'escape') schedule(t + (origin === 'rv' ? 70 : origin === 'vt' ? 40 : 30), 'his-retro', { origin });
    if (p.ap && origin !== 'ap' && ready('ap', t, p.ap.erp)) {
      const retro = p.ap.retroDec ? decremental(p.ap.retro, p.ap.retroDec, p.ap.retroTau, p.ap.erp, t - last.ap) : p.ap.retro;
      last.ap = t;
      schedule(t + retro, 'atrium', { origin: p.ap.origin });
    }
    return true;
  }

  function apAtrial(t) {
    if (!p.ap || !ready('ap', t, p.ap.erp)) return;
    last.ap = t;   // antegrade conduction, or concealment of a retrograde-only pathway
    if (p.ap.ante) schedule(t + p.ap.anteDelay, 'ventricle', { origin: 'ap' });
  }

  // Rapid capture starts the triggered substrates of the case. Couplings are
  // stimulus to stimulus (the programmed intervals), counted on captured stimuli.
  function onStim(kind, t, captured, site) {
    const run = runs[kind];
    const coupling = t - run.lastT;
    run.lastT = t;
    if (!captured) return;
    // Entrainment: a captured stimulus resets a running macroreentry; the return
    // cycle at the pacing site is the TCL plus the distance to the circuit.
    if (kind === 'a' && active.flutter) {
      unschedule('flutter-fire');
      lastFlutterCapture = { t, site };
      // While the train goes on, the next stimulus captures before the wavefront returns.
      const next = queue.find((q) => q.kind === 'stim' && q.data.site !== 'rv');
      if (!next || next.t >= t + p.flutter.tcl + p.flutter.ppiExtra[site]) scheduleFlutterReturn(lastFlutterCapture);
    }
    if (kind === 'v' && active.vt) {
      unschedule('vt-fire');
      // Antitachycardia pacing: a run of fast captures ends the VT.
      p.vt.atpCount = coupling <= p.vt.atpCl ? (p.vt.atpCount || 0) + 1 : 0;
      if (p.vt.atpCount >= p.vt.atpCaptures) { active.vt = false; p.vt.atpCount = 0; run.block = t + 1500; return; }
      schedule(t + 10 + p.vt.cl + p.vt.ppiExtra - 40, 'vt-fire');
    }
    if (kind === 'a') pacedRun++;
    if (kind === 'a') {
      for (const key of ['at', 'flutter', 'af']) {
        const s = p[key];
        if (!s || active[key]) continue;
        s.count = coupling <= s.triggerCl ? (s.count || 1) + 1 : 1;
        if (s.count >= s.triggerCount) {
          active[key] = true;
          if (key === 'at') schedule(t + s.cl, 'at-fire');
          if (key === 'flutter') schedule(t + s.tcl, 'flutter-fire');
          if (key === 'af') schedule(t + s.min, 'af-fire');
        }
      }
    } else if (p.vt && !active.vt) {
      // The rest of a train that just ended the VT does not re-induce it.
      if (t < (run.block ?? -1)) { run.block = t + 1500; run.count = 0; return; }
      run.count = coupling <= p.vt.triggerCl ? run.count + 1 : 0;
      if (run.count >= 2) { active.vt = true; schedule(t + p.vt.cl - 40, 'vt-fire'); }
    }
  }

  // Return of the entrained flutter wavefront: TCL + distance to the circuit at the pacing site.
  function scheduleFlutterReturn({ t, site }) {
    const ch = { hra: 'hra', 'cs-prox': 'cs-910', 'cs-dist': 'cs-12' }[site];
    schedule(t + p.flutter.tcl + p.flutter.ppiExtra[site] - ORIGINS.flutter[ch], 'flutter-fire');
  }

  function stim(t, site) {
    const ch = site === 'cs-prox' ? 'cs-910' : site === 'cs-dist' ? 'cs-12' : site;
    record(ch, ev('S', t, 0.5, 2));
    if (site === 'rv') onStim('v', t, ventricle(t + 10, { origin: 'rv' }), site);
    else {
      const captured = activateAtrium(t + 2, site);
      onStim('a', t, captured, site);
      // A stimulus that did not capture leaves the circuit to return from the last capture.
      if (!captured && active.flutter && lastFlutterCapture && !queue.some((q) => q.kind === 'flutter-fire')) scheduleFlutterReturn(lastFlutterCapture);
    }
  }

  function afOffsets() {
    const o = { avj: 20 + rand() * 40, ap: 10 + rand() * 50, aps: 10 + rand() * 50, p: null };
    for (const ch of ATRIAL_CHANNELS) o[ch] = rand() * 70;
    return o;
  }

  function lesion(target) {
    let effect = null;
    if (target === 'slow-pathway' && p.sp) { p.sp = null; effect = 'sp'; }
    else if (target === 'compact-node') { p.avBlock = true; effect = 'av-block'; }
    else if (target === 'left-lateral' && p.ap?.insertion === 'ap') { p.ap = null; effect = 'ap'; }
    else if (target === 'posteroseptal' && p.ap?.insertion === 'aps') { p.ap = null; effect = 'ap'; }
    else if (target === 'cti' && p.flutter) { p.flutter = null; active.flutter = false; effect = 'cti'; }
    else if (target === 'la-focus' && p.at) { p.at = null; active.at = false; effect = 'focus'; }
    else if (target === 'vt-isthmus' && p.vt) { p.vt = null; active.vt = false; effect = 'isthmus'; }
    lesions.push({ target, effect, t: now });
    return effect;
  }

  const handlers = {
    sinus: (t) => { pacedRun = 0; activateAtrium(t, 'sinus'); if (!queue.some((q) => q.kind === 'sinus')) schedule(t + p.sinusCl, 'sinus'); },
    stim: (t, d) => stim(t, d.site),
    atrium: (t, d) => activateAtrium(t, d.origin),
    'avn-ante': (t) => avnAnte(t),
    'ap-atrial': (t) => apAtrial(t),
    his: (t, d) => his(t, d),
    ventricle: (t, d) => ventricle(t, d),
    'his-retro': (t, d) => {
      if (!ready('his', t, p.hpsErp)) return;
      last.his = t;
      if (d.origin === 'vt') { record('his-d', ev('H', t, 0.45, 4)); record('his-p', ev('H', t, 0.2, 4)); }
      avnRetro(t);
    },
    escape: (t, d) => { if (last.v === d.token) ventricle(t, { origin: 'escape' }); },
    'at-fire': (t) => { if (!active.at || !p.at) return; activateAtrium(t, p.at.origin); schedule(t + p.at.cl, 'at-fire'); },
    'flutter-fire': (t) => { if (!active.flutter || !p.flutter) return; activateAtrium(t, 'flutter', { force: true }); schedule(t + p.flutter.tcl, 'flutter-fire'); },
    'af-fire': (t) => { if (!active.af || !p.af) return; activateAtrium(t, 'af', { force: true, offsets: afOffsets() }); schedule(t + p.af.min + rand() * (p.af.max - p.af.min), 'af-fire'); },
    // The circuit keeps its cycle; a beat finding the ventricle refractory (a capture beat) does not exit.
    'vt-fire': (t) => { if (!active.vt || !p.vt) return; ventricle(t, { origin: 'vt' }); schedule(t + p.vt.cl, 'vt-fire'); },
    // Accelerated junctional beats while RF heats the slow pathway region.
    junctional: (t, d) => {
      if (!rf || rf.token !== d.token || p.avBlock) return;
      if (ready('his', t, p.hpsErp)) { last.his = t; record('his-d', ev('H', t, 0.7, 4)); record('his-p', ev('H', t, 0.3, 4)); schedule(t + p.hv, 'ventricle', { origin: 'his', h: t }); avnRetro(t); }
      schedule(t + 620, 'junctional', d);
    },
    'rf-lesion': (t, d) => { if (rf && rf.token === d.token) rf.effect = lesion(rf.target); }
  };

  schedule(200, 'sinus');

  return {
    caseId: id,
    now: () => now,
    advanceTo(t) {
      while (queue.length && queue[0].t <= t) {
        const item = queue.shift();
        now = item.t;
        handlers[item.kind](item.t, item.data);
      }
      now = Math.max(now, t);
    },
    stimulate(list) { for (const s of list) if (s.t >= now && LIVE_SITES.includes(s.site)) schedule(s.t, 'stim', { site: s.site }); },
    /** Cancel stimuli still to come (or only those after time `after`). */
    stopPacing(after = -Infinity) {
      for (let i = queue.length - 1; i >= 0; i--) if (queue[i].kind === 'stim' && queue[i].t > after) queue.splice(i, 1);
      if (active.flutter && lastFlutterCapture && !queue.some((q) => q.kind === 'flutter-fire' || (q.kind === 'stim' && q.data.site !== 'rv'))) scheduleFlutterReturn(lastFlutterCapture);
    },
    /** DC shock: every tissue depolarized; reentry and triggered rhythms end, an automatic focus resumes. */
    cardiovert(t) {
      queue.length = 0;
      for (const k of Object.keys(last)) last[k] = t;
      active.flutter = active.af = active.vt = false;
      rf = null;
      record('ecg-ii', ev('DC', t, 1.6, 3)); record('ecg-v1', ev('DC', t, -1.4, 3));
      schedule(t + 900, 'sinus');
      if (active.at) schedule(t + p.at.cl + 300, 'at-fire');
    },
    /** Start RF at a target; the lesion completes after RF_LESION_MS of continuous RF. */
    rfStart(target, t) {
      if (!ABLATION_TARGETS.includes(target)) return null;
      rf = { target, token: t, effect: undefined };
      schedule(t + RF_LESION_MS, 'rf-lesion', { token: t });
      if (target === 'slow-pathway' && p.sp) schedule(t + 900, 'junctional', { token: t });
      return rf.token;
    },
    rfStop() { const done = rf; rf = null; return done; },
    rf: () => (rf ? { ...rf } : null),
    events(from, to) {
      return Object.fromEntries(Object.entries(log).map(([ch, list]) => [ch, list.filter((e) => e.t >= from && e.t <= to)]));
    },
    trim(t) {
      for (const list of Object.values(log)) { let i = 0; while (i < list.length && list[i].t < t) i++; if (i) list.splice(0, i); }
      while (beats.length && beats[0].v < t) beats.shift();
    },
    beats: () => beats.slice(),
    lesions: () => lesions.slice(),
    /** Running rhythms and remaining substrate elements. */
    status: () => ({
      avBlock: p.avBlock,
      sp: Boolean(p.sp), ap: Boolean(p.ap), at: Boolean(p.at), flutter: Boolean(p.flutter), vt: Boolean(p.vt),
      atActive: active.at, flutterActive: active.flutter, afActive: active.af, vtActive: active.vt
    })
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

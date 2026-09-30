import { HV, ev, far, mono, merge, A_TYPICAL, A_LEFT_LAT } from './ep-beats.js';
import { ref, cal, measure } from './ep-cases.js';
import { SIM_CASES } from './ep-maneuver-sim.js';

/*
 * Atrial pacing and preexcitation laboratory (research/EASY_ECG_EP_OZGUN_GELISTIRME_RAPORU.md,
 * phase A; source matrix and storyboard: research/EP_ATRIYAL_PACING_KAYNAK_STORYBOARD.md).
 * The learner sets the drive (S1 x N), an optional extrastimulus (S2) and the
 * pacing site; deliverPacing() runs a beat-by-beat model and returns a
 * recording in the catalog's shape. AV nodal conduction time depends on the
 * recovery time (His to the next atrial input), so decrement, Wenckebach and
 * the AH jump of dual pathways come out of the model, not out of a lookup.
 * The accessory pathway conducts without decrement until its refractory
 * period. A single echo is modeled after the test beat only; no sustained
 * tachycardia. Measurements are read from the events. Pure and deterministic;
 * every number is a designed teaching value, not a measured interval.
 */

export const PACE_SITES = Object.freeze(['hra', 'cs-prox', 'cs-dist']);
export const PACE_MODES = Object.freeze(['extra', 'incremental']);
export const PACE_COUNTS = Object.freeze([4, 6, 8]);
export const PACE_RANGE = Object.freeze({ s1: Object.freeze({ min: 300, max: 700, step: 10 }), s2: Object.freeze({ min: 180, max: 500, step: 10 }) });
/** Answers to "which route conducted the test beat?". */
export const PACE_ANSWERS = Object.freeze(['avn', 'avn-slow', 'ap', 'fusion', 'none']);

/** A stimulus closer than this to the previous captured one finds refractory atrium (drive independent here). */
export const ATRIAL_ERP = 200;
/** Critical AH for a single slow-fast echo in this model (source P6: echoes follow a critical AH). */
export const ECHO_AH = 210;
const AP_V_DELAY = 40;       // atrial end to ventricular end of the pathway, non-decremental (P9)
const AP_ERP = 270;          // antegrade refractory period at the atrial end (P11)
const AP_RETRO_ERP = 250;    // retrograde recovery after the pathway's last activation
const V_TO_ANNULUS = 15;     // normal ventricular activation reaching the pathway's ventricular end
const DELTA_SPAN = 120;      // lead of the pathway V over the normal V giving full preexcitation (P10)
const START = 200;

const CHANNELS = Object.freeze(['ecg-ii', 'ecg-v1', 'hra', 'his-p', 'his-d', 'cs-910', 'cs-78', 'cs-56', 'cs-34', 'cs-12', 'rv']);
const ATRIAL = Object.freeze(['hra', 'his-p', 'his-d', 'cs-910', 'cs-78', 'cs-56', 'cs-34', 'cs-12']);
const SITE_CHANNEL = Object.freeze({ hra: 'hra', 'cs-prox': 'cs-910', 'cs-dist': 'cs-12' });
const SITE_LABEL = Object.freeze({ hra: { tr: 'HRA', en: 'HRA' }, 'cs-prox': { tr: 'CS proksimal', en: 'proximal CS' }, 'cs-dist': { tr: 'CS distal', en: 'distal CS' } });
/** Stimulus to local atrial activation on each channel, per pacing site (ms). */
const SITE_A = Object.freeze({
  hra: Object.freeze({ hra: 5, 'his-p': 38, 'his-d': 40, 'cs-910': 50, 'cs-78': 58, 'cs-56': 65, 'cs-34': 73, 'cs-12': 80 }),
  'cs-prox': Object.freeze({ 'cs-910': 5, 'cs-78': 14, 'cs-56': 22, 'his-d': 25, 'his-p': 27, 'cs-34': 30, 'cs-12': 38, hra: 55 }),
  'cs-dist': Object.freeze({ 'cs-12': 5, 'cs-34': 14, 'cs-56': 22, 'cs-78': 30, 'cs-910': 38, 'his-p': 58, 'his-d': 60, hra: 85 })
});
/**
 * AV nodal pathways, tried in order: AH = ahMin + gain * exp(-(RT - rtMin) / tau)
 * while RT (His to the next His-region A) is at least rtMin (P1). Dual
 * physiology: the fast pathway blocks first, the slow one takes over (P5).
 */
const NODES = Object.freeze({
  single: Object.freeze([{ path: 'avn', rtMin: 150, ahMin: 75, gain: 150, tau: 100 }]),
  dual: Object.freeze([{ path: 'fast', rtMin: 230, ahMin: 78, gain: 40, tau: 60 }, { path: 'slow', rtMin: 140, ahMin: 170, gain: 120, tau: 70 }])
});
// Far-field ventricular timing on the CS bipoles: over the His-Purkinje system, and from a left free wall pathway.
const NODAL_CS_V = Object.freeze({ 'cs-910': 15, 'cs-78': 17, 'cs-56': 19, 'cs-34': 21, 'cs-12': 23 });
const LEFT_FREE_WALL_V = Object.freeze({ 'cs-12': 5, 'cs-34': 10, 'cs-56': 15, 'cs-78': 20, 'cs-910': 25 });

const atrialOnly = (offsets) => Object.freeze(Object.fromEntries(Object.entries(offsets).filter(([ch]) => ATRIAL.includes(ch))));

/**
 * Substrate per catalog case: AV nodal model, optional accessory pathway
 * (antegrade or concealed, atrial insertion channel, retrograde sequence
 * relative to the His-d V), optional slow-fast echo sequence.
 */
export const PACING_CASES = Object.freeze({
  'avnrt-typical': Object.freeze({ node: 'dual', echo: atrialOnly(A_TYPICAL) }),
  'focal-at': Object.freeze({ node: 'single' }),
  'ap-left-lateral': Object.freeze({ node: 'single', ap: Object.freeze({ antegrade: false, insertion: 'cs-12', retro: atrialOnly(SIM_CASES['ap-left-lateral'].a) }) }),
  'ap-inf-paraseptal': Object.freeze({ node: 'single', ap: Object.freeze({ antegrade: false, insertion: 'cs-910', retro: atrialOnly(SIM_CASES['ap-inf-paraseptal'].a) }) }),
  'ap-parahisian': Object.freeze({ node: 'single', ap: Object.freeze({ antegrade: false, insertion: 'his-d', retro: atrialOnly(SIM_CASES['ap-parahisian'].a) }) }),
  'ap-left-manifest': Object.freeze({ node: 'single', ap: Object.freeze({ antegrade: true, insertion: 'cs-12', retro: atrialOnly(A_LEFT_LAT) }) })
});

const clamp = (value, { min, max, step }) => Math.max(min, Math.min(max, Math.round((Number(value) || min) / step) * step));

/** Default choices: an extrastimulus protocol from the HRA. */
export function defaultPacing(caseId) {
  return { caseId: PACING_CASES[caseId] ? caseId : 'focal-at', mode: 'extra', site: 'hra', s1: 600, count: 6, s2: 400 };
}

/** Normalized choices (valid ranges; S2 never beyond the drive cycle). */
export function normalizePacing(choices) {
  const c = { ...defaultPacing(choices?.caseId), ...choices };
  const s1 = clamp(c.s1, PACE_RANGE.s1);
  return {
    caseId: PACING_CASES[c.caseId] ? c.caseId : 'focal-at',
    mode: PACE_MODES.includes(c.mode) ? c.mode : 'extra',
    site: PACE_SITES.includes(c.site) ? c.site : 'hra',
    s1,
    count: PACE_COUNTS.includes(Number(c.count)) ? Number(c.count) : 6,
    s2: Math.min(clamp(c.s2, PACE_RANGE.s2), s1)
  };
}

/** Stable key of a choice set (the reproducible state). */
export function pacingKey(c) {
  const n = normalizePacing(c);
  return [n.caseId, n.mode, n.site, n.s1, n.count, n.mode === 'extra' ? n.s2 : '-'].join('|');
}

function conductNode(kind, rt) {
  for (const p of NODES[kind]) {
    if (rt >= p.rtMin) return { path: p.path, ah: Math.round(p.ahMin + p.gain * Math.exp(-(rt - p.rtMin) / p.tau)) };
  }
  return null;
}

/** Beat-by-beat conduction of a stimulus train. */
function runBeats(stimuli, site, sub) {
  const beats = [];
  let lastCapture = -Infinity, lastH = -Infinity, apLast = -Infinity;
  for (const s of stimuli) {
    const beat = { s, captured: s - lastCapture >= ATRIAL_ERP };
    beats.push(beat);
    if (!beat.captured) continue;
    lastCapture = s;
    const a = SITE_A[site];
    const route = conductNode(sub.node, s + a['his-d'] - lastH);
    if (route) {
      beat.route = route.path;
      beat.ah = route.ah;
      beat.h = s + a['his-d'] + route.ah;
      beat.vN = beat.h + HV;
      lastH = beat.h;
    }
    if (sub.ap) {
      beat.apBefore = apLast;
      const aIns = s + a[sub.ap.insertion];
      if (sub.ap.antegrade && aIns - apLast >= AP_ERP) {
        beat.vAp = aIns + AP_V_DELAY;
        apLast = aIns;
      } else if (beat.vN != null) {
        // The ventricular wavefront enters the pathway retrogradely (concealed when the atrium is refractory).
        apLast = Math.max(apLast, beat.vN + V_TO_ANNULUS);
      }
    }
    const vN = beat.vN ?? Infinity, vAp = beat.vAp ?? Infinity;
    if (Number.isFinite(Math.min(vN, vAp))) {
      const lead = vN - vAp;
      beat.f = !Number.isFinite(vAp) ? 0 : lead === Infinity ? 1 : Math.max(0, Math.min(1, lead / DELTA_SPAN));
    }
  }
  return beats;
}

/** Single echo after the test beat: slow-fast over the node, or orthodromic over the pathway. */
function echoOf(beat, site, sub) {
  if (!beat.captured || beat.vN == null) return null;
  if (sub.echo && beat.route === 'slow' && beat.ah >= ECHO_AH) return { kind: 'avn', offsets: sub.echo };
  const ap = sub.ap;
  if (ap && beat.vAp == null && ap.retro[ap.insertion] != null) {
    const apRecovered = beat.vN + V_TO_ANNULUS - beat.apBefore >= AP_RETRO_ERP;
    const atriumRecovered = beat.vN + ap.retro[ap.insertion] - (beat.s + SITE_A[site][ap.insertion]) >= ATRIAL_ERP;
    if (apRecovered && atriumRecovered) return { kind: 'ap', offsets: ap.retro };
  }
  return null;
}

function surface(vN, vAp, f, p) {
  const ii = [mono('P', p, 0.22, 10)];
  const v1 = [];
  if (f > 0) {
    // Preexcited: the slurred onset starts at the pathway V; a left free wall pathway gives a positive delta in V1.
    const peak = Math.min(vN, vAp + 45);
    const sigma = f >= 0.5 ? 14 : 9;
    ii.push(mono('delta', vAp + 5, 0.12 + 0.2 * f, 7), ev('V', peak, 0.9, sigma));
    v1.push(mono('delta', vAp + 5, 0.1 + 0.15 * f, 7), ev('V', peak, -0.5 + f, sigma));
  } else {
    ii.push(ev('V', vN, 0.9, 8));
    v1.push(ev('V', vN, -0.5, 8));
  }
  return { 'ecg-ii': ii, 'ecg-v1': v1 };
}

function beatEvents(beat, site, shift) {
  const t = (x) => x - shift;
  const parts = [{ [SITE_CHANNEL[site]]: [ev('S', t(beat.s), 0.5, 2)] }];
  if (!beat.captured) return merge(...parts);
  const a = SITE_A[site];
  for (const ch of ATRIAL) parts.push({ [ch]: [ev('A', t(beat.s + a[ch]), ch === 'his-d' ? 0.35 : ch === 'his-p' ? 0.6 : 0.8)] });
  if (beat.h != null) parts.push({ 'his-d': [ev('H', t(beat.h), 0.75, 4)], 'his-p': [ev('H', t(beat.h), 0.35, 4)] });
  if (beat.f == null) {
    parts.push({ 'ecg-ii': [mono('P', t(beat.s + 15), 0.22, 10)] });
    return merge(...parts);
  }
  const vN = beat.vN ?? Infinity, vAp = beat.vAp ?? Infinity;
  const first = Math.min(vN, vAp);
  const hisV = Math.min(vN, vAp + 40);
  parts.push({
    'his-d': [ev('V', t(hisV), 0.9)], 'his-p': [ev('V', t(hisV), 0.7, 6)],
    rv: [ev('V', t(Math.min(vN - 5, vAp + 55)), 0.9)],
    hra: [far('V', t(first + 10), 0.22)]
  });
  for (const [ch, d] of Object.entries(NODAL_CS_V)) parts.push({ [ch]: [far('V', t(Math.min(vN + d, vAp + LEFT_FREE_WALL_V[ch])), 0.45, 7)] });
  parts.push(surface(t(vN), t(vAp), beat.f, t(beat.s + 15)));
  return merge(...parts);
}

/** Correct answer for the test beat, or null when the stimulus did not capture. */
function answerOf(beat) {
  if (!beat.captured) return null;
  if (beat.f == null) return 'none';
  if (beat.vAp != null && (beat.vN == null || beat.f >= 1)) return 'ap';
  if (beat.vAp != null && beat.f > 0) return 'fusion';
  return beat.route === 'slow' ? 'avn-slow' : 'avn';
}

function reasonOf(test, beats, sub, mode) {
  if (!test.captured) return 'noCapture';
  // Nodal block within the train (an A without H), also when a pathway still conducts the V.
  if (mode === 'incremental' && beats.some((b) => b.captured && b.h == null)) return 'wenckebach';
  if (test.f == null) return 'block';
  if (test.echo === 'avn') return 'echoAvn';
  if (test.echo === 'ap') return sub.ap?.antegrade ? 'apRefractoryEcho' : 'echoAp';
  const previous = beats[beats.length - 2];
  if (sub.ap?.antegrade && test.vAp == null && previous?.vAp != null) return 'apRefractory';
  if (test.vAp != null && test.f >= 1) return 'maximal';
  if (test.vAp != null && test.f > 0) return 'fusion';
  if (test.route === 'slow') return 'slowPathway';
  return sub.ap && !sub.ap.antegrade ? 'concealed' : 'conducted';
}

/** Occurrence index of an event of `type` on `ch` at time t (for caliper references). */
function occAt(events, ch, type, t) {
  return (events[ch] || []).filter((e) => e.type === type).findIndex((e) => Math.abs(e.t - t) < 0.5);
}

function calipersFor(events, shown, c, stimCh) {
  const out = [];
  const h = (beat) => beat.h - shown.shift;
  const add = (label, a, b, row) => { if (a.occ >= 0 && b.occ >= 0) out.push(cal(label, a, b, row)); };
  const hisA = (beat) => ref('his-d', 'A', occAt(events, 'his-d', 'A', beat.s + SITE_A[c.site]['his-d'] - shown.shift));
  const hisH = (beat) => ref('his-d', 'H', occAt(events, 'his-d', 'H', h(beat)));
  const stim = (beat) => ref(stimCh, 'S', occAt(events, stimCh, 'S', beat.s - shown.shift));
  const delta = (beat) => ref('ecg-ii', 'delta', occAt(events, 'ecg-ii', 'delta', beat.vAp + 5 - shown.shift));
  const hisV = (beat) => ref('his-d', 'V', occAt(events, 'his-d', 'V', Math.min(beat.vN ?? Infinity, (beat.vAp ?? Infinity) + 40) - shown.shift));
  const beats = shown.beats;
  const test = beats[beats.length - 1];
  if (c.mode === 'extra') {
    const drive = beats[beats.length - 2];
    add('S1-S2', stim(drive), stim(test), stimCh);
    if (drive.h != null) add('AH (S1)', hisA(drive), hisH(drive), 'his-d');
    if (test.h != null) add('AH (S2)', hisA(test), hisH(test), 'his-d');
    if (test.h != null && test.f != null) add('HV (S2)', hisH(test), hisV(test), 'his-d');
    if (test.vAp != null && test.f > 0) {
      if (test.h != null) add('H-delta (S2)', hisH(test), delta(test), 'his-d');
      add('S-delta (S2)', stim(test), delta(test), 'ecg-ii');
    }
  } else {
    add('PCL', stim(beats[0]), stim(beats[1]), stimCh);
    const conducted = beats.filter((b) => b.h != null);
    if (conducted.length) add('AH (1)', hisA(conducted[0]), hisH(conducted[0]), 'his-d');
    // The longest AH of the train (before a block, or at steady state when 1:1).
    const longest = conducted.reduce((best, b) => (best && best.ah >= b.ah ? best : b), null);
    if (longest && longest !== conducted[0]) add('AH (max)', hisA(longest), hisH(longest), 'his-d');
    if (test.vAp != null && test.f > 0) add('S-delta', stim(test), delta(test), 'ecg-ii');
  }
  return out;
}

/**
 * Deliver a pacing protocol.
 * @param {{ caseId: string, mode?: 'extra'|'incremental', site?: string, s1?: number, count?: number, s2?: number }} choices
 * @returns {object} frozen recording (catalog shape) with lab 'pacing', test beat summary, result and reason
 */
export function deliverPacing(choices) {
  const c = normalizePacing(choices);
  const sub = PACING_CASES[c.caseId];
  const drive = Array.from({ length: c.count }, (_, i) => START + i * c.s1);
  const stimuli = c.mode === 'extra' ? [...drive, drive[drive.length - 1] + c.s2] : drive;
  const beats = runBeats(stimuli, c.site, sub);
  const testBeat = beats[beats.length - 1];
  const echo = echoOf(testBeat, c.site, sub);
  // Extrastimulus: show the last two drive beats and S2; incremental: the whole train.
  const shownBeats = c.mode === 'extra' ? beats.slice(-3) : beats;
  const shift = shownBeats[0].s - 150;
  const shown = { beats: shownBeats, shift };
  // The drive beat before the window can still end inside it (late H, V): draw what falls after t = 0.
  const before = c.mode === 'extra' ? beats.slice(-4, -3) : [];
  const parts = [...before, ...shownBeats].map((b) => beatEvents(b, c.site, shift));
  // 6: the window ends after the last H or V of the shown beats.
  let last = Math.max(...shownBeats.map((b) => Math.max(b.h != null ? b.h + 60 : -Infinity,
    b.f != null ? Math.min(b.vN ?? Infinity, b.vAp ?? Infinity) + 60 : b.s + 120)));
  if (echo) {
    const echoEvents = Object.fromEntries(Object.entries(echo.offsets).map(([ch, dt]) => [ch, [ev('A', testBeat.vN + dt - shift, ch === 'his-d' ? 0.35 : 0.7)]]));
    parts.push(echoEvents);
    last = Math.max(last, testBeat.vN + Math.max(...Object.values(echo.offsets)));
  }
  const events = Object.fromEntries(Object.entries(merge(...parts))
    .map(([ch, list]) => [ch, list.filter((e) => e.t >= 0)]).filter(([, list]) => list.length));
  const stimCh = SITE_CHANNEL[c.site];
  const site = SITE_LABEL[c.site];
  const markers = shownBeats.map((b, i) => {
    const isS2 = c.mode === 'extra' && i === shownBeats.length - 1;
    const first = i === 0;
    const tr = isS2 ? `S2 ${c.s2} ms` : first ? `S1 ${c.s1} ms × ${c.count} (${site.tr})` : 'S1';
    const en = isS2 ? `S2 ${c.s2} ms` : first ? `S1 ${c.s1} ms × ${c.count} (${site.en})` : 'S1';
    return { t: b.s - shift, label: { tr, en } };
  });
  const test = {
    captured: testBeat.captured,
    conducted: testBeat.f != null,
    route: testBeat.route || null,
    ah: testBeat.ah ?? null,
    ap: testBeat.vAp != null,
    preexcitation: testBeat.f ?? null,
    echo: echo?.kind || null,
    // Earliest atrial channel of the echo (concentric: His; eccentric: the pathway's atrial end).
    echoFirst: echo ? Object.entries(echo.offsets).reduce((best, e) => (e[1] < best[1] ? e : best))[0] : null,
    answer: answerOf(testBeat)
  };
  const recording = {
    id: `pace:${pacingKey(c)}`, caseId: c.caseId, section: 'maneuver', lab: 'pacing',
    maneuver: c.mode === 'extra' ? 'a-extra' : 'a-incremental',
    channels: [...CHANNELS], markers, calipers: calipersFor(events, shown, c, stimCh), windowMs: Math.round(last - shift + 180), events,
    result: test.captured ? 'valid' : 'invalidCapture', reason: reasonOf({ ...testBeat, echo: test.echo }, beats, sub, c.mode),
    feedback: { capture: test.captured, avConduction: test.conducted, preexcitation: Boolean(test.ap && test.preexcitation > 0), echo: Boolean(test.echo) },
    test, choices: c, teachingNumbers: {}, simulated: true
  };
  return deepFreeze(recording);
}

/** Measured values of a pacing recording, by caliper label. */
export function pacingMeasures(recording) {
  return Object.fromEntries(recording.calipers.map((c) => [c.label, measure(recording, c)]));
}

/**
 * Grade an answer against the test beat: 'correct', 'partial' (AV node for a
 * slow-pathway beat: right, but less specific), 'incorrect', or 'unavailable'
 * when the stimulus did not capture.
 */
export function gradePacingAnswer(recording, answer) {
  const key = recording?.test?.answer;
  if (!key) return 'unavailable';
  if (answer === key) return 'correct';
  if (key === 'avn-slow' && answer === 'avn') return 'partial';
  return 'incorrect';
}

/**
 * Two extrastimulus recordings of the same drive, site and case, S2 10 ms
 * apart, both conducted over the node: the AH change measured from the events.
 * jump: at least 50 ms (source P7). Null when the pair is not comparable.
 */
export function compareExtrastimuli(previous, next) {
  const p = previous?.choices, n = next?.choices;
  if (!p || !n || p.mode !== 'extra' || n.mode !== 'extra') return null;
  if (p.caseId !== n.caseId || p.site !== n.site || p.s1 !== n.s1 || p.count !== n.count || p.s2 === n.s2) return null;
  const ahP = pacingMeasures(previous)['AH (S2)'], ahN = pacingMeasures(next)['AH (S2)'];
  if (ahP == null || ahN == null) return null;
  const dS2 = n.s2 - p.s2, dAH = ahN - ahP;
  return { dS2, dAH, jump: dS2 === -10 && dAH >= 50 };
}

/** 3D conduction routes of the test beat (shown after the learner answers). */
export function pacingScene(recording) {
  const test = recording?.test;
  if (!test?.conducted) return { paths: [], circuit: null };
  const paths = [];
  if (test.route) paths.push('avn');
  if (test.ap) paths.push('ap');
  const leftFreeWall = recording.caseId === 'ap-left-lateral' || recording.caseId === 'ap-left-manifest';
  return { paths, circuit: test.echo === 'ap' && leftFreeWall ? 'orthodromic' : null };
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/*
 * Waveform shapes of the synthetic EP recordings (drawn by ep-egm.js). Recordings carry events
 * per channel (ep-beats.js); this module turns them into waves and completes the surface leads
 * the catalogue leaves implicit:
 *   - the surface QRS has an initial, a main and a terminal deflection (q R s, or r S in V1);
 *   - every QRS gets its T wave from the cycle length (QT from RR); a wide QRS (ventricular,
 *     paced, pre-excited) gets a discordant T wave;
 *   - P waves come from atrial activation: the earliest atrial channel of each atrial cluster
 *     decides the axis (high right atrium: upright in II; septal, retrograde: negative in II and
 *     upright in V1, the pseudo-S and pseudo-r'; left atrium: upright in V1);
 *   - near-field bipolar electrograms are sharp and multiphasic, far-field ones broad and smooth.
 * Teaching schematic with designed shapes; never a clinical recording.
 */

export const SURFACE = Object.freeze(['ecg-i', 'ecg-ii', 'ecg-v1']);
const ATRIAL_ORIGIN = Object.freeze({
  hra: 'high', 'halo-910': 'high', 'halo-78': 'high', 'halo-56': 'high', 'halo-34': 'high', 'halo-12': 'high',
  'his-p': 'septal', 'his-d': 'septal', 'his-2': 'septal', 'his-3': 'septal', 'cs-910': 'septal', 'cs-78': 'septal', 'abl-d': 'septal', 'abl-p': 'septal',
  'cs-56': 'left', 'cs-34': 'left', 'cs-12': 'left', pv: 'left'
});
// P wave by origin: amplitude and width in II, and the V1 shape (initial, terminal).
const P_SHAPE = Object.freeze({
  high: { ii: 0.2, sd: 17, v1: [0.09, -0.07] },
  septal: { ii: -0.17, sd: 13, v1: [0.11, 0] },
  left: { ii: 0.05, sd: 15, v1: [0.03, 0.12] }
});
const CLUSTER_MS = 70;      // atrial activations within this gap belong to one atrial beat
const P_LEAD_MS = 30;       // P centre after the earliest atrial electrogram
const EXPLICIT_MS = 120;
const MERGED_QRS_MS = 200;  // a QRS this close to the next one has no T wave of its own    // a catalogue P wave this close already represents the beat

const gauss = (x, sd) => Math.exp(-0.5 * (x / sd) ** 2);
// Derived events with a `part` are drawn but not named (the V1 terminal P, a T under flutter waves).
const isWide = (e) => (e.sigma || 8) >= 12;
const kOf = (e) => Math.max(0.6, (e.sigma || 8) / 8);   // QRS width scale (8 ms sigma: about 80 ms QRS)

/** QT (ms) at a cycle length (ms): a log-linear relation between Bazett's and Fridericia's. */
export const qtAt = (rr) => 400 * (Math.max(250, Math.min(2000, rr)) / 1000) ** 0.38;

/** Surface QRS: initial (q or r), main (R or S) and terminal deflections; the main peak equals amp at e.t. */
function surfaceQrs(dt, e) {
  const k = kOf(e), a = e.amp;
  return a * gauss(dt, 6 * k) - 0.14 * a * gauss(dt + 14 * k, 4 * k) - 0.24 * a * gauss(dt - 15 * k, 5 * k);
}
/** Near-field bipolar electrogram: small opposite pre-deflection, sharp main peak (= amp at e.t), mirror deflection and tail. */
const NF = Object.freeze({ pre: [-1.15, 0.4, 0.25], mirror: [1.25, 0.5, 0.82], tail: [2.3, 0.55, 0.22] });
const nfRaw = (x) => gauss(x, 0.55) - NF.pre[2] * gauss(x - NF.pre[0], NF.pre[1]) - NF.mirror[2] * gauss(x - NF.mirror[0], NF.mirror[1]) + NF.tail[2] * gauss(x - NF.tail[0], NF.tail[1]);
const NF_NORM = nfRaw(0);   // the main peak equals amp exactly
function nearField(dt, e) {
  return (e.amp * nfRaw(dt / e.sigma)) / NF_NORM;
}
/** Far-field: the broad derivative of a Gaussian (peak = amp). */
function farField(dt, e) {
  const x = dt / e.sigma;
  return -e.amp * x * Math.exp(0.5 - 0.5 * x * x);
}

/**
 * Flutter F wave as a sawtooth over its cycle length: a slow descent to the trough (amp at e.t),
 * a quicker return and a low plateau, so consecutive waves leave no isoelectric baseline.
 */
const SAW = Object.freeze({ fall: 0.55, rise: 0.25, plateau: 0.12, gain: 1.5 });   // gain: trough depth over the catalogue amplitude
function sawtooth(dt, e) {
  const cl = e.saw, fall = SAW.fall * cl, rise = SAW.rise * cl, amp = e.amp * SAW.gain;
  const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));
  if (dt <= 0) return amp * ease((dt + fall) / fall);
  if (dt <= rise) return amp * (1 - (1 + SAW.plateau) * ease(dt / rise));
  return -amp * SAW.plateau * (1 - ease((dt - rise) / (cl - fall - rise)));
}

/**
 * Pacing stimulus artifact (live monitor). On the paced bipole the pulse saturates the amplifier
 * (near: a flat-topped pulse far above the row, then an opposite after-potential that decays
 * over tens of ms); every other channel and the surface leads pick up a small sharp spike (far).
 */
export const STIM_ARTIFACT = Object.freeze({ near: 6, pulse: 2, rise: 0.4, after: -0.4, tau: 14, far: 0.3, surface: 0.2 });
function stimArtifact(dt, e) {
  const A = STIM_ARTIFACT;
  if (e.stim === 'far') return dt < -3 || dt > 5 ? 0 : e.amp * (gauss(dt, 0.6) - 0.45 * gauss(dt - 1.5, 0.8));
  if (dt < -A.rise || dt > A.pulse + 8 * A.tau) return 0;
  if (dt < 0) return e.amp * (1 + dt / A.rise);
  if (dt <= A.pulse) return e.amp;
  return e.amp * A.after * Math.exp(-(dt - A.pulse) / A.tau);
}

/**
 * Event table with the pacing artifacts of its stimuli: the stimulus on the paced channel becomes
 * the saturating artifact and every other listed channel gets the small far-field spike.
 */
export function withStimArtifacts(events, channels = []) {
  const stims = [];
  for (const [ch, list] of Object.entries(events || {})) for (const e of list) if (e.type === 'S') stims.push({ ch, t: e.t });
  if (!stims.length) return events;
  const out = {};
  for (const ch of new Set([...Object.keys(events), ...channels])) {
    const own = (events[ch] || []).map((e) => (e.type === 'S' ? { ...e, amp: STIM_ARTIFACT.near, stim: 'near' } : e));
    const amp = SURFACE.includes(ch) ? STIM_ARTIFACT.surface : STIM_ARTIFACT.far;
    const far = stims.filter((s) => s.ch !== ch).map((s) => ({ type: 'S', t: s.t, amp, sigma: 1, stim: 'far', part: 1 }));
    out[ch] = far.length ? [...own, ...far].sort((a, b) => a.t - b.t) : own;
  }
  return out;
}

/** Value of one event at time t (ms) on a channel. */
export function waveValue(t, e, channelId) {
  const dt = t - e.t;
  if (e.stim) return stimArtifact(dt, e);
  if (e.saw) return dt < -SAW.fall * e.saw || dt > (1 - SAW.fall) * e.saw ? 0 : sawtooth(dt, e);
  const reach = e.kind === 'T' ? 5 * e.sigma : e.surfaceQrs ? 45 * kOf(e) : 6 * e.sigma;
  if (Math.abs(dt) > reach) return 0;
  if (e.mono || e.kind === 'T' || e.kind === 'P') return e.amp * gauss(dt, e.sigma);
  if (e.surfaceQrs) return surfaceQrs(dt, e);
  if (e.far || SURFACE.includes(channelId)) return farField(dt, e);
  return nearField(dt, e);
}
/** Times where an event's shape peaks (so a sub-pixel sampling grid never misses them). */
export function wavePeaks(e) {
  if (e.stim === 'near') { const A = STIM_ARTIFACT; return [e.t - A.rise, e.t, e.t + A.pulse, e.t + A.pulse + 0.05]; }
  if (e.stim) return [e.t, e.t + 1.5];
  if (e.saw) return [e.t, e.t + SAW.rise * e.saw];
  if (e.mono || e.kind === 'T' || e.kind === 'P') return [e.t];
  if (e.surfaceQrs) { const k = kOf(e); return [e.t - 14 * k, e.t, e.t + 15 * k]; }
  if (e.far) return [e.t - e.sigma, e.t, e.t + e.sigma];
  return [e.t + NF.pre[0] * e.sigma, e.t, e.t + NF.mirror[0] * e.sigma, e.t + NF.tail[0] * e.sigma];
}

// ---- Completion of the surface leads ----
/** Give each flutter F wave its cycle length (from the neighbouring F waves) for the sawtooth. */
function withSawtooth(events) {
  const fs = events.filter((e) => e.type === 'F').sort((a, b) => a.t - b.t);
  fs.forEach((f, i) => {
    const cl = fs[i + 1] ? fs[i + 1].t - f.t : i > 0 ? f.t - fs[i - 1].t : 0;
    if (cl >= 150 && cl <= 400) f.saw = cl;
  });
  return events;
}
const ATRIAL_FLAGS = new Set(['F', 'f']);

/** Atrial beats as clusters of near-field atrial electrograms: { t (earliest), origin }. */
export function atrialClusters(events) {
  const acts = [];
  for (const [ch, list] of Object.entries(events || {})) {
    const origin = ATRIAL_ORIGIN[ch];
    if (!origin) continue;
    for (const e of list) if (e.type === 'A' && !e.far) acts.push({ t: e.t, origin, ch });
  }
  acts.sort((a, b) => a.t - b.t);
  const clusters = [];
  for (const a of acts) {
    const last = clusters.at(-1);
    if (last && a.t - last.end <= CLUSTER_MS) last.end = a.t;
    else clusters.push({ t: a.t, end: a.t, origin: a.origin, ch: a.ch });
  }
  return clusters;
}

/**
 * The surface events of a channel with the implied waves added: the QRS marked for its q-R-s
 * shape, a T wave after each QRS and P waves from atrial activation.
 */
export function completeSurface(recording, channelId) {
  const own = recording?.events?.[channelId] || [];
  if (!SURFACE.includes(channelId)) return own;
  const lead = channelId === 'ecg-v1' ? 'v1' : 'ii';
  const qrs = own.filter((e) => e.type === 'V' && !e.mono).sort((a, b) => a.t - b.t);
  const out = own.map((e) => (e.type === 'V' && !e.mono ? { ...e, surfaceQrs: true } : e.type === 'F' ? { ...e } : e));
  withSawtooth(out);
  // T waves: from the cycle length of the neighbouring QRS complexes. Under flutter waves the
  // T wave is drawn lower so the sawtooth stays readable (it is partly hidden in practice too).
  const flutter = Object.values(recording.events).some((list) => list.some((e) => e.type === 'F'));
  const tScale = flutter ? 0.45 : 1;
  qrs.forEach((e, i) => {
    if (qrs[i + 1] && qrs[i + 1].t - e.t < MERGED_QRS_MS) return;   // repolarization hidden in the next complex
    const rr = qrs[i + 1] ? qrs[i + 1].t - e.t : i > 0 ? e.t - qrs[i - 1].t : 800;
    const qt = qtAt(rr), k = kOf(e), onset = e.t - 22 * k;
    const concordant = lead === 'ii' ? 0.26 * e.amp : 0.06;
    const amp = (isWide(e) ? -0.32 * e.amp : concordant) * tScale;
    out.push({ type: 'T', kind: 'T', t: onset + qt * 0.72, sigma: qt * 0.13, amp, derived: true, ...(flutter ? { part: 1 } : {}) });
  });
  // Flutter: the catalogue draws F waves in II; V1 shows them upright (counter-clockwise flutter).
  const iiEvents = recording.events['ecg-ii'] || [];
  if (lead === 'v1' && !own.some((e) => e.type === 'F')) {
    const derivedF = iiEvents.filter((e) => e.type === 'F').map((f) => ({ type: 'F', kind: 'P', t: f.t + 8, sigma: f.sigma || 14, amp: -0.7 * f.amp, derived: true }));
    out.push(...withSawtooth(derivedF));
  }
  // Fibrillation: atrial f electrograms give a small irregular baseline on the surface.
  const fib = Object.entries(recording.events).filter(([ch]) => ATRIAL_ORIGIN[ch]).flatMap(([, list]) => list.filter((e) => e.type === 'f'));
  if (fib.length && !own.some((e) => e.type === 'f')) {
    const seen = new Set();
    for (const f of fib.sort((a, b) => a.t - b.t)) {
      const slot = Math.round(f.t / 45);
      if (seen.has(slot)) continue;
      seen.add(slot);
      const amp = (lead === 'v1' ? 0.07 : 0.045) * (slot % 2 ? 1 : -0.8) * (0.7 + 0.3 * Math.abs(Math.sin(slot * 1.7)));
      out.push({ type: 'f', kind: 'P', t: f.t + 20, sigma: 16, amp, derived: true });
    }
  }
  // P waves: skipped for flutter and fibrillation (their F and f waves stand for atrial activity).
  const surfaceAll = [...iiEvents, ...(recording.events['ecg-v1'] || [])];
  if (fib.length || surfaceAll.some((e) => ATRIAL_FLAGS.has(e.type))) return out.sort((a, b) => a.t - b.t);
  const explicitP = (recording.events['ecg-ii'] || []).filter((e) => e.type === 'P');
  for (const c of atrialClusters(recording.events)) {
    const shape = P_SHAPE[c.origin];
    const given = explicitP.find((p) => Math.abs(p.t - (c.t + P_LEAD_MS)) <= EXPLICIT_MS);
    const t = given ? given.t : c.t + P_LEAD_MS;
    if (lead === 'ii') { if (!given) out.push({ type: 'P', kind: 'P', t, sigma: shape.sd, amp: shape.ii * (channelId === 'ecg-i' ? 0.6 : 1), derived: true }); continue; }
    const pShape = shape;   // V1 follows where atrial activation starts, also under a catalogue P wave
    if (pShape.v1[0]) out.push({ type: 'P', kind: 'P', t: t - 9, sigma: 11, amp: pShape.v1[0], derived: true });
    if (pShape.v1[1]) out.push({ type: 'P', kind: 'P', t: t + 13, sigma: 12, amp: pShape.v1[1], derived: true, part: pShape.v1[0] ? 2 : 0 });
  }
  return out.sort((a, b) => a.t - b.t);
}

// Completed surface events are cached per event table (a live monitor builds a new one per frame).
const cache = new WeakMap();
/** Events to draw on a channel: the catalogue's, plus the completed surface waves. */
export function channelEvents(recording, channelId) {
  const table = recording?.events;
  if (!table) return [];
  if (!SURFACE.includes(channelId)) return table[channelId] || [];
  let byChannel = cache.get(table);
  if (!byChannel) { byChannel = new Map(); cache.set(table, byChannel); }
  if (!byChannel.has(channelId)) byChannel.set(channelId, completeSurface(recording, channelId));
  return byChannel.get(channelId);
}

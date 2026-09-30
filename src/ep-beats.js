/*
 * Beat builders of the electrophysiological anatomy recordings
 * (research/ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md). Each builder
 * returns per-channel event lists on one millisecond timeline; the case
 * catalog (ep-cases.js) and the interactive maneuver model
 * (ep-maneuver-sim.js) compose them. Designed synthetic timing, never a
 * clinical recording.
 */

export const AH = 80;
export const HV = 45;

// Near-field: sharp and large. Far-field: broad and small. mono: Gaussian bump (P, delta).
export const ev = (type, t, amp, sigma = 5, extra = {}) => ({ type, t, amp, sigma, ...extra });
export const far = (type, t, amp, sigma = 15) => ev(type, t, amp, sigma, { far: true });
export const mono = (type, t, amp, sigma) => ev(type, t, amp, sigma, { mono: true });

// Merge per-channel event lists.
export function merge(...parts) {
  const out = {};
  for (const part of parts) for (const [ch, list] of Object.entries(part)) (out[ch] ??= []).push(...list);
  for (const list of Object.values(out)) list.sort((a, b) => a.t - b.t);
  return out;
}

// Surface QRS on II and V1 at time v; withDelta draws the slurred onset earlier.
export function surfaceBeat(v, { p = null, delta = null, wide = false } = {}) {
  const sigma = wide ? 16 : 8;
  return {
    'ecg-ii': [
      ...(p != null ? [mono('P', p, 0.22, 10)] : []),
      ...(delta != null ? [mono('delta', delta, 0.3, 7)] : []),
      ev('V', v, 0.9, sigma)
    ],
    'ecg-v1': [
      ...(delta != null ? [mono('delta', delta, -0.22, 7)] : []),
      ev('V', v, -0.5, sigma)
    ]
  };
}

/**
 * One supraventricular tachycardia beat. v is the His-d ventricular time;
 * aOffsets maps atrial channels to retrograde A delay after v (ABL included
 * when the catheter records the annulus); h precedes v by HV.
 */
export function svtBeat(v, aOffsets, { ablV = null } = {}) {
  const events = merge(surfaceBeat(v), {
    'his-p': [ev('H', v - HV, 0.3, 4), ev('V', v, 0.7, 6)],
    'his-d': [ev('H', v - HV, 0.7, 4), ev('V', v, 0.9)],
    'cs-910': [far('V', v + 15, 0.4, 8)],
    'cs-78': [far('V', v + 17, 0.4, 8)],
    'cs-56': [far('V', v + 19, 0.4, 8)],
    'cs-34': [far('V', v + 21, 0.4, 8)],
    'cs-12': [far('V', v + 23, 0.4, 8)],
    'rv': [ev('V', v - 5, 0.9)],
    ...(ablV != null ? { 'abl-d': [ev('V', v + ablV, 0.8)] } : {})
  });
  for (const [ch, dt] of Object.entries(aOffsets)) (events[ch] ??= []).push(ev('A', v + dt, ch === 'abl-d' ? 0.35 : 0.7));
  return events;
}

// Sinus beat through the AV node; options add preexcitation or a fragmented slow-pathway A.
export function sinusBeat(t0, { fragmented = false, delta = null, ablV = null, ablA = 48 } = {}) {
  const aHis = t0 + 35;
  const h = aHis + AH;
  const v = delta != null ? delta + 20 : h + HV;
  const abl = [];
  if (ablA != null) abl.push(...(fragmented ? [ev('A', t0 + 46, 0.2, 4), ev('A', t0 + 62, 0.16, 4)] : [ev('A', t0 + ablA, 0.24, 5)]));
  abl.push(ev('V', ablV != null ? t0 + ablV : v + 5, 0.8));
  return merge(surfaceBeat(v, { p: t0, delta }), {
    hra: [ev('A', t0, 0.9), far('V', v + 10, 0.22)],
    'his-p': [ev('A', aHis - 3, 0.6), ev('H', h, 0.35, 4), ev('V', v, 0.7, 6)],
    'his-d': [ev('A', aHis, 0.35), ev('H', h, 0.75, 4), ev('V', v, 0.9)],
    'cs-910': [ev('A', t0 + 45, 0.8), far('V', v + 15, 0.45, 6)],
    'cs-12': [ev('A', t0 + 75, 0.7), far('V', v + 25, 0.5, 6)],
    'abl-d': abl
  });
}

// Junctional beat during RF: H then V; retrograde A concentric unless blocked.
export function junctionalBeat(h, { vaBlock = false, va = 70 } = {}) {
  const v = h + HV;
  const a = v + va;
  const retro = (list) => (vaBlock ? [] : list);
  return merge(surfaceBeat(v), {
    hra: [far('V', v + 10, 0.22), ...retro([ev('A', a + 40, 0.9)])],
    'his-p': [ev('H', h, 0.35, 4), ev('V', v, 0.7, 6), ...retro([ev('A', a - 2, 0.6)])],
    'his-d': [ev('H', h, 0.75, 4), ev('V', v, 0.9), ...retro([ev('A', a, 0.35)])],
    'cs-910': [far('V', v + 15, 0.45, 6), ...retro([ev('A', a + 6, 0.8)])],
    'cs-12': [far('V', v + 25, 0.5, 6), ...retro([ev('A', a + 28, 0.7)])],
    'abl-d': [ev('V', v + 5, 0.8), ...retro([ev('A', a + 4, 0.22)])]
  });
}

// Ventricular paced beat from the RV: wide QRS, retrograde A per aOffsets after the stimulus.
export function pacedBeat(s, aOffsets, { capture = true } = {}) {
  if (!capture) return { rv: [ev('S', s, 0.5, 2)] };
  const v = s + 10;
  const events = merge(surfaceBeat(v + 20, { wide: true }), {
    rv: [ev('S', s, 0.5, 2), ev('V', v, 0.9)],
    'his-p': [far('V', v + 25, 0.5, 10)],
    'his-d': [far('V', v + 25, 0.6, 10)],
    'cs-910': [far('V', v + 30, 0.4, 10)],
    'cs-56': [far('V', v + 33, 0.4, 10)],
    'cs-12': [far('V', v + 35, 0.4, 10)]
  });
  for (const [ch, dt] of Object.entries(aOffsets)) (events[ch] ??= []).push(ev('A', s + dt, 0.7));
  return events;
}


// Para-Hisian paced beat: with His capture the QRS is narrower and earlier;
// without it the wavefront takes the myocardial route (wide QRS). Retrograde
// A times are absolute offsets after the stimulus.
export function paraHisBeat(s, aOffsets, hisCapture) {
  const v = s + (hisCapture ? 6 : 12);
  const events = merge(surfaceBeat(v + 15, { wide: !hisCapture }), {
    rv: [ev('S', s, 0.5, 2), ev('V', v, 0.9)],
    'his-p': [far('V', v + (hisCapture ? 6 : 22), 0.5, hisCapture ? 7 : 12)],
    'his-d': [far('V', v + (hisCapture ? 6 : 22), 0.6, hisCapture ? 7 : 12)],
    'cs-910': [far('V', v + 25, 0.4, 10)],
    'cs-78': [far('V', v + 27, 0.4, 10)],
    'cs-56': [far('V', v + 28, 0.4, 10)],
    'cs-34': [far('V', v + 29, 0.4, 10)],
    'cs-12': [far('V', v + 30, 0.4, 10)]
  });
  for (const [ch, dt] of Object.entries(aOffsets)) (events[ch] ??= []).push(ev('A', s + dt, ch === 'abl-d' ? 0.35 : 0.7));
  return events;
}

// Retrograde A offset tables (after the His-d V of the beat). Concentric septal
// patterns and eccentric pathway patterns; teaching examples, not localization rules.
export const A_TYPICAL = { 'his-p': 28, 'his-d': 30, 'cs-910': 40, 'cs-56': 55, 'cs-12': 75, hra: 55 };
export const A_ATYPICAL = { 'cs-910': 200, 'his-d': 215, 'his-p': 213, 'cs-56': 225, 'cs-12': 245, hra: 235 };
export const A_LEFT_LAT = { 'cs-12': 55, 'cs-34': 70, 'cs-56': 85, 'cs-78': 100, 'cs-910': 115, 'his-d': 120, 'his-p': 118, hra: 140, 'abl-d': 45 };
export const A_INF_PS = { 'abl-d': 45, 'cs-910': 60, 'his-d': 75, 'his-p': 73, 'cs-56': 95, hra: 110, 'cs-12': 125 };
export const A_PJRT = { 'cs-910': 180, 'his-d': 200, 'his-p': 198, hra: 225, 'cs-56': 215, 'cs-12': 240 };
export const A_NODAL_PACED = { 'his-d': 140, 'his-p': 138, 'cs-910': 150, 'cs-56': 170, 'cs-12': 185, hra: 160 };

export const CH_SVT = ['ecg-ii', 'ecg-v1', 'hra', 'his-p', 'his-d', 'cs-910', 'cs-56', 'cs-12', 'rv'];
export const CH_CS_FULL = ['ecg-ii', 'ecg-v1', 'hra', 'his-p', 'his-d', 'cs-910', 'cs-78', 'cs-56', 'cs-34', 'cs-12', 'rv', 'abl-d'];
export const CH_LEGACY = ['ecg-ii', 'hra', 'his-p', 'his-d', 'cs-910', 'cs-12', 'abl-d'];

export function svtRun(vs, aOffsets, options) {
  return merge(...vs.map((v) => svtBeat(v, aOffsets, options)));
}

// Atrial paced beat (HRA stimulus): antegrade activation with the given AH.
export function atrialPacedBeat(s, ah) {
  const aHis = s + 40;
  const h = aHis + ah;
  const v = h + HV;
  return merge(surfaceBeat(v, { p: s + 10 }), {
    hra: [ev('S', s, 0.5, 2), ev('A', s + 5, 0.9)],
    'his-p': [ev('A', aHis - 2, 0.6), ev('H', h, 0.35, 4), ev('V', v, 0.7, 6)],
    'his-d': [ev('A', aHis, 0.35), ev('H', h, 0.75, 4), ev('V', v, 0.9)],
    'cs-910': [ev('A', s + 50, 0.8), far('V', v + 15, 0.45, 6)],
    'cs-56': [ev('A', s + 65, 0.7), far('V', v + 19, 0.4, 8)],
    'cs-12': [ev('A', s + 80, 0.7), far('V', v + 25, 0.5, 6)],
    rv: [ev('V', v - 3, 0.9)]
  });
}

// Preexcited AF beat: irregular wide QRS with a delta; narrow beats lack it.
export function afBeat(v, wide) {
  return merge(surfaceBeat(v, wide ? { delta: v - 25, wide: true } : {}), {
    rv: [ev('V', v - 5, 0.9)],
    'his-d': [far('V', v + (wide ? 18 : 0), 0.5, 12)],
    'abl-d': [ev('V', wide ? v - 35 : v + 5, 0.8)]
  });
}

// Fibrillatory atrial activity: a fixed repeating interval pattern (no RNG).
export function fWaves(windowMs, channels) {
  const steps = [55, 70, 60, 75, 65];
  const out = {};
  for (const [k, ch] of channels.entries()) {
    const list = [];
    for (let t = 40 + k * 18, i = 0; t < windowMs - 20; t += steps[i % steps.length], i++) {
      list.push(mono('A', t, 0.12 + 0.03 * (i % 3), 5));
    }
    out[ch] = list;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Typical (counterclockwise) atrial flutter: up the septum, down the lateral
// wall (Halo proximal to distal), through the cavotricuspid isthmus (ABL on
// the CTI) back to the CS ostium. A offsets within one flutter cycle.
// ---------------------------------------------------------------------------
export const FLUTTER_CCW = Object.freeze({
  'cs-910': 0, 'his-p': 28, 'his-d': 30, 'cs-56': 45, 'cs-12': 65, hra: 75,
  'halo-910': 100, 'halo-78': 125, 'halo-56': 150, 'halo-34': 175, 'halo-12': 200, 'abl-d': 220
});

/**
 * Flutter run: atrial activation every tcl from t0 over `cycles`, 2:1 AV
 * conduction (V every second flutter wave), optional skip of cycles (for a
 * pacing train drawn separately). Surface II shows the negative F waves.
 */
export function flutterRun(t0, tcl, cycles, { conduct = 2, offsets = FLUTTER_CCW, fromCycle = 0 } = {}) {
  const parts = [];
  for (let k = fromCycle; k < cycles; k++) {
    const base = t0 + k * tcl;
    const beat = {};
    for (const [ch, dt] of Object.entries(offsets)) beat[ch] = [ev('A', base + dt, ch === 'abl-d' ? 0.35 : 0.6)];
    beat['ecg-ii'] = [mono('F', base + 120, -0.16, 45)];
    if (k % conduct === 0) {
      const v = base + 60 + AH + HV;
      Object.assign(beat, merge(beat, surfaceBeat(v), { rv: [ev('V', v - 5, 0.9)], 'his-d': [ev('H', v - HV, 0.6, 4), far('V', v, 0.5, 8)] }));
    }
    parts.push(beat);
  }
  return merge(...parts);
}

/**
 * Sinus-rhythm pacing from one atrial site: every channel's A at stimulus +
 * offset (the activation sequence of that pacing site). Used for the CTI
 * block assessment (proximal CS and low lateral RA pacing).
 */
export function atrialSitePacing(stimuli, siteChannel, offsets) {
  return merge(...stimuli.map((s) => {
    const beat = { [siteChannel]: [ev('S', s, 0.5, 2)] };
    for (const [ch, dt] of Object.entries(offsets)) (beat[ch] ??= []).push(ev('A', s + dt, ch === 'abl-d' ? 0.3 : 0.6));
    // Conducted beat: His A to H to V, the surface P and QRS.
    const aHis = s + (offsets['his-d'] ?? 40);
    const v = aHis + AH + HV;
    return merge(beat, surfaceBeat(v, { p: s + 15 }), { 'his-d': [ev('H', aHis + AH, 0.6, 4), ev('V', v, 0.8)], rv: [ev('V', v - 5, 0.9)] });
  }));
}

// Unipolar ABL electrogram: QS (only negative) at the earliest site, rS
// (small R, then S) away from it. Mono events, relative units.
export function unipolar(t, kind) {
  if (kind === 'QS') return { 'abl-uni': [mono('U', t, -0.85, 9)] };
  return { 'abl-uni': [mono('U', t - 8, 0.3, 5), mono('U', t + 6, -0.7, 8)] };
}


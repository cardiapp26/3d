/*
 * Pulmonary vein isolation (PVI) teaching model. Pure data and recording
 * builders for the interactive exercise: four veins, a ring of candidate
 * lesion points per vein, and a synthetic strip whose PV channel shows
 * near-field PV potentials until the sampled vein's ring is complete
 * (entrance block reads as downstream electrical silence, R30, R31).
 * Designed synthetic timings, never a clinical recording; completing the
 * rings restores sinus rhythm in this exercise as a teaching simplification,
 * stated in the panel text: clinically AF termination is not guaranteed and
 * late reconnection drives recurrence (R30).
 */
import { ev, far, mono, merge } from './ep-beats.js';
import { ref, cal } from './ep-caliper.js';

/** Veins in panel order, with the TR/EN names of the lasso marker. */
export const PVI_VEINS = Object.freeze([
  { id: 'lspv', label: { tr: 'Sol üst PV', en: 'Left superior PV' } },
  { id: 'lipv', label: { tr: 'Sol alt PV', en: 'Left inferior PV' } },
  { id: 'rspv', label: { tr: 'Sağ üst PV', en: 'Right superior PV' } },
  { id: 'ripv', label: { tr: 'Sağ alt PV', en: 'Right inferior PV' } }
].map(Object.freeze));

/** Candidate lesion points per vein ring. */
export const PVI_DOTS = 10;

/** Fresh exercise state: nothing ablated. */
export function createPviState() {
  return Object.freeze(Object.fromEntries(PVI_VEINS.map((v) => [v.id, Object.freeze(Array(PVI_DOTS).fill(false))])));
}

/** New state with one lesion set (immutable; unknown refs return the state unchanged). */
export function burnDot(state, veinId, index) {
  if (!state[veinId] || index < 0 || index >= PVI_DOTS || state[veinId][index]) return state;
  const ring = state[veinId].map((b, i) => b || i === index);
  return Object.freeze({ ...state, [veinId]: Object.freeze(ring) });
}

export const burnedCount = (state, veinId) => (state[veinId] || []).filter(Boolean).length;
export const isolated = (state, veinId) => burnedCount(state, veinId) === PVI_DOTS;
export const allIsolated = (state) => PVI_VEINS.every((v) => isolated(state, v.id));

// Deterministic irregular AF ventricular response (RR list, ms).
const AF_RR = [340, 420, 300, 460, 380];
// Deterministic irregular near-field PV potential cycle during AF.
const PV_CYCLES = [150, 185, 130, 205, 160, 175, 140, 190];

const qrs = (v) => ({
  'ecg-ii': [ev('V', v, 0.9, 8)],
  'ecg-v1': [ev('V', v, -0.5, 8)]
});

// Atrial fibrillatory baseline on the atrial channels: low, irregular bumps.
function fWaves(windowMs, channels, amp = 0.14) {
  const out = Object.fromEntries(channels.map((ch) => [ch, []]));
  for (const [k, ch] of channels.entries()) {
    for (let t = 90 + k * 23; t < windowMs - 60; t += 150 + ((t * 7 + k * 41) % 70)) {
      out[ch].push(mono('f', t, amp * (0.7 + ((t + k * 13) % 5) / 8), 9));
    }
  }
  return out;
}

const PVI_WINDOW = 2050;
export const PVI_CHANNELS = ['ecg-ii', 'ecg-v1', 'hra', 'pv', 'cs-910', 'cs-12'];

/**
 * Strip of the exercise: the lasso samples `veinId`. During AF the PV channel
 * carries near-field PV potentials plus the far-field atrial signal; once the
 * sampled ring is complete only the far field remains (entrance block). With
 * every ring complete the strip shows sinus rhythm and a silent PV channel.
 * @returns {object} recording in the catalog shape, lab 'pvi'
 */
export function pviRecording(state, veinId) {
  const vein = PVI_VEINS.find((v) => v.id === veinId) || PVI_VEINS[0];
  const done = allIsolated(state);
  const veinDone = isolated(state, vein.id);
  const windowMs = PVI_WINDOW;
  let events;
  if (done) {
    // Sinus rhythm: P, QRS, atrial A's; the PV channel keeps only the far-field A.
    const beats = [150, 1000, 1850];
    events = merge(...beats.map((p) => merge(
      { 'ecg-ii': [mono('P', p, 0.22, 10)] },
      qrs(p + 160),
      {
        hra: [ev('A', p + 5, 0.9)],
        'cs-910': [ev('A', p + 40, 0.7)],
        'cs-12': [ev('A', p + 70, 0.6)],
        pv: [far('A', p + 55, 0.2, 12)]
      }
    )));
  } else {
    const vs = [];
    let t = 160;
    for (const rr of AF_RR) { vs.push(t); t += rr; }
    events = merge(
      ...vs.map(qrs),
      fWaves(windowMs, ['hra', 'cs-910', 'cs-12']),
      // Far-field atrial signal on the lasso in both cases (R31).
      fWaves(windowMs, ['pv'], 0.12)
    );
    if (!veinDone) {
      // Near-field PV potentials: sharp, fast, irregular.
      const spikes = [];
      let s = 120;
      for (let i = 0; s < windowMs - 80; i++) { spikes.push(ev('PV', s, 0.85, 3)); s += PV_CYCLES[i % PV_CYCLES.length]; }
      events = merge(events, { pv: spikes });
    }
  }
  const calipers = done
    ? [cal('PP', ref('ecg-ii', 'P', 0), ref('ecg-ii', 'P', 1), 'ecg-ii')]
    : [cal('RR (1)', ref('ecg-ii', 'V', 0), ref('ecg-ii', 'V', 1), 'ecg-ii'), cal('RR (2)', ref('ecg-ii', 'V', 1), ref('ecg-ii', 'V', 2), 'ecg-ii'),
      ...(veinDone ? [] : [cal('PV-PV', ref('pv', 'PV', 0), ref('pv', 'PV', 1))])];
  return Object.freeze({
    id: `pvi:${vein.id}:${PVI_VEINS.map((v) => burnedCount(state, v.id)).join('-')}`,
    caseId: 'af-pvi', section: 'treatment', lab: 'pvi', simulated: true,
    channels: PVI_CHANNELS, windowMs, events, calipers, teachingNumbers: {},
    markers: [{ t: 60, label: { tr: `Lasso: ${vein.label.tr}`, en: `Lasso: ${vein.label.en}` } }],
    vein: vein.id, isolatedVein: veinDone, sinus: done
  });
}

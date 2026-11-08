// Pure model of the "auscultation in acute valvular emergencies" comparison
// (exam-acute-valves.js): five schematic phonocardiograms over one cycle from
// S1 to the next S1, sampled from the same findings table and cardiac clock as
// the main examination panel. No DOM access, so it is unit tested under Node.

import { CYCLE_SYNC as S, phaseToTime, timeToPhase } from './cardiac-cycle.js';
import { FINDINGS, heartSoundEvents, murmurEnvelope } from './exam-findings.js';
import { physiologyOf } from './exam-physiology.js';

export const LIT_WINDOW = 0.09;      // a sound label stays lit this long (fraction of the cycle) after the cursor
export const SEGMENT_TAIL = 0.03;    // a murmur label stays lit this long after the murmur ends
const MURMUR_EPS = 0.004;

const note = (en, tr) => ({ en, tr });

export const ACUTE_TEXT = {
  tr: {
    title: 'Akut kapak acillerinde oskültasyon',
    intro: 'Bir kardiyak döngünün şematik fonokardiyogramları (S1\'den sonraki S1\'e). A2 kırmızı, P2 mavi; taralı alan üfürümdür. İmleç ortak kardiyak saatle ilerler.',
    play: 'Sesi çal', stop: 'Sesi durdur', select: 'Bu bulguyu panelde aç',
    systole: 'sistol', diastole: 'diyastol', aortic: 'A2 (aort)', pulmonic: 'P2 (pulmoner)', murmur: 'üfürüm',
    soundNote: 'Sentezlenmiş şematik ses; gerçek bir kayıt değildir.'
  },
  en: {
    title: 'Auscultation in acute valvular emergencies',
    intro: 'Schematic phonocardiograms over one cardiac cycle (S1 to the next S1). A2 red, P2 blue; the hatched area is the murmur. The cursor runs on the shared cardiac clock.',
    play: 'Play sound', stop: 'Stop sound', select: 'Open this finding in the panel',
    systole: 'systole', diastole: 'diastole', aortic: 'A2 (aortic)', pulmonic: 'P2 (pulmonic)', murmur: 'murmur',
    soundNote: 'Synthesized schematic sound, not a recording.'
  }
};

/**
 * Rows A to E. `notes` overrides the label of a sound (S1, A2, P2, S3, S4, OS)
 * or names a murmur segment (systolic, diastolic); a sound without a note shows its own label.
 */
export const ACUTE_ROWS = Object.freeze([
  {
    key: 'A', findingId: 'normal', title: note('Normal', 'Normal'),
    notes: {}
  },
  {
    key: 'B', findingId: 'acute_mitral_regurgitation', title: note('Acute severe MR', 'Akut ciddi MY'),
    notes: { systolic: note('Faint early decrescendo', 'Hafif erken dekreşendo') }
  },
  {
    key: 'C', findingId: 'acute_aortic_regurgitation', title: note('Acute severe AR', 'Akut ciddi AY'),
    notes: {
      S1: note('Soft or absent S1', 'S1 hafif veya yok'), A2: note('Soft A2', 'A2 hafif'), P2: note('Loud P2', 'P2 sert'),
      systolic: note('Soft flow murmur', 'Hafif akım üfürümü'), diastolic: note('Short early decrescendo', 'Kısa erken dekreşendo')
    }
  },
  {
    key: 'D', findingId: 'mitral_stenosis', title: note('Chronic severe rheumatic MS', 'Kronik ciddi romatizmal MD'),
    notes: {
      S1: note('Loud S1', 'S1 sert'), P2: note('Loud P2', 'P2 sert'),
      diastolic: note('Rumble, presystolic accentuation', 'Rulman, presistolik belirginleşme')
    }
  },
  {
    key: 'E', findingId: 'aortic_stenosis', title: note('Chronic severe AS', 'Kronik ciddi AD'),
    notes: { A2: note('Soft or absent A2', 'A2 hafif veya yok'), systolic: note('Mid-to-late peaking', 'Orta-geç tepeli') }
  }
]);

export const normLang = lang => (lang === 'en' ? 'en' : 'tr');
const pick = (text, lang) => (text ? text[normLang(lang)] || text.en : '');
const frac = v => ((v % 1) + 1) % 1;

/** Real-time fraction of the cycle at S1; strips start here. */
export const s1Offset = bpm => phaseToTime(S.avClosed, bpm > 0 ? bpm : 72);

/** Cursor position (0..1 from S1) for a phase on the shared cardiac clock. */
export function cursorX(phase, bpm) {
  const rate = bpm > 0 ? bpm : 72;
  return frac(phaseToTime(Number.isFinite(phase) ? phase : 0, rate) - s1Offset(rate));
}

/** Phase u of strip position x (0..1 from S1). */
// The tiny offset keeps x = 0 on S1 itself rather than just before it (the end of the presystolic rumble).
export const phaseAtX = (x, bpm) => timeToPhase(Math.min(0.99999, frac(x + s1Offset(bpm) + 1e-6)), bpm > 0 ? bpm : 72);

const isSystolic = u => u >= S.avClosed && u <= S.ivrStart;

/** Contiguous murmur runs as { x0, x1, kind }. */
function murmurSegments(murmur, phases) {
  const n = murmur.length;
  const segments = [];
  let start = -1;
  for (let i = 0; i <= n; i++) {
    const on = i < n && murmur[i] > MURMUR_EPS;
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      const mid = phases[Math.floor((start + i - 1) / 2)];
      segments.push({ x0: start / (n - 1), x1: (i - 1) / (n - 1), kind: isSystolic(mid) ? 'systolic' : 'diastolic' });
      start = -1;
    }
  }
  return segments;
}

/**
 * Sample one cycle from S1 for a finding at rest.
 * @returns {{ murmur: Float32Array, phases: Float32Array, sounds: Array<{ x: number, amp: number, label: string }>,
 *   segments: Array<{ x0: number, x1: number, kind: 'systolic'|'diastolic' }>, systole: [number, number] }}
 */
export function sampleAcuteStrip(findingId, { bpm = 72, columns = 240 } = {}) {
  const n = Math.max(2, Math.round(columns) || 2);
  const rate = bpm > 0 ? bpm : 72;
  const physio = physiologyOf('rest');
  const murmur = new Float32Array(n), phases = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = phaseAtX(i / (n - 1), rate);
    phases[i] = u;
    murmur[i] = FINDINGS[findingId] ? Math.max(0, murmurEnvelope(findingId, u, physio)) : 0;
  }
  const events = FINDINGS[findingId] ? heartSoundEvents(findingId, physio) : [];
  const sounds = events.map(ev => ({ x: cursorX(ev.u, rate), amp: ev.amp, label: ev.label })).sort((a, b) => a.x - b.x);
  return { murmur, phases, sounds, segments: murmurSegments(murmur, phases), systole: [0, cursorX(S.ivrStart, rate)] };
}

/** Labels to draw and light: one per sound, one per murmur segment that has a note. */
export function rowLabels(row, strip, lang) {
  const sounds = strip.sounds.map(s => ({
    id: s.label, x: s.x, x1: s.x + LIT_WINDOW, type: 'sound',
    tone: s.label === 'A2' ? 'aortic' : s.label === 'P2' ? 'pulmonic' : 'neutral',
    text: pick(row.notes[s.label], lang) || s.label
  }));
  const murmurs = strip.segments.filter(seg => row.notes[seg.kind]).map(seg => ({
    id: seg.kind, x: (seg.x0 + seg.x1) / 2, x0: seg.x0, x1: seg.x1 + SEGMENT_TAIL, type: 'murmur', tone: 'murmur',
    text: pick(row.notes[seg.kind], lang)
  }));
  return [...sounds, ...murmurs];
}

/** Whether the cursor (0..1) is passing a label's event. */
export function isLit(label, cursor) {
  const from = label.type === 'murmur' ? label.x0 : label.x;
  return cursor >= from && cursor <= label.x1;
}

/**
 * Stack labels on rows so neighbours do not overlap. `width(text)` is in the
 * same units as `scale` (x * scale); returns the row index of each label.
 */
export function stackRows(labels, width, scale, gap = 3) {
  const ends = [];
  return labels.map(label => {
    const w = width(label.text);
    const left = Math.max(0, Math.min(scale - w, label.x * scale - w / 2));
    let row = ends.findIndex(end => left > end + gap);
    if (row < 0) { row = ends.length; ends.push(0); }
    ends[row] = left + w;
    return { row, left, width: w };
  });
}

/** Display title of a row ("A. Normal"). */
export const rowTitle = (row, lang) => `${row.key}. ${pick(row.title, lang)}`;
/** The finding's own full label (from the findings table). */
export const findingLabel = (row, lang) => pick(FINDINGS[row.findingId]?.label, lang);

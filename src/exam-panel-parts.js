// Pure pieces of the physical examination panel (exam-panel.js): the text
// table, the phonocardiogram sampler and renderer, the maneuver response
// table and the schematic SAM geometry. No DOM access at import time, so the
// helpers are unit tested under Node. Everything is driven by the data
// modules; a new finding or maneuver needs no change here.

import { CYCLE_SYNC as S, phaseToTime, timeToPhase } from './cardiac-cycle.js';
import { ecgSample } from './ecg-trace.js';
import { MANEUVERS, MANEUVER_IDS, maneuverSpans, physiologyOf } from './exam-physiology.js';
import { FINDINGS, heartSoundEvents, matchesExpected, murmurEnvelope, respond } from './exam-findings.js';

export const TEXT = {
  tr: {
    finding: 'Bulgu', systolic: 'Sistolik üfürümler', diastolic: 'Diyastolik üfürümler',
    gradeTitle: 'Üfürüm şiddeti (Levine derecesi)', maneuvers: 'Manevralar',
    stages: { ramp: 'başlangıç', hold: 'sürdürme', recover: 'düzelme', done: 'tamamlandı', fixed: 'sürdürme (sabit)' },
    canvas: 'Şematik fonokardiyogram ve EKG', systole: 'sistol', diastole: 'diyastol', ecg: 'EKG',
    lvotTitle: 'LVOT gradyanı (mmHg)', restMark: 'istirahat',
    lvotReading: (g, cls, ctx) => `LVOT gradyanı ${g} mmHg (${cls}, ${ctx})`,
    lvotClass: { severe: 'ciddi', obstructive: 'obstrüktif', 'non-obstructive': 'obstrüktif değil' },
    lvotCtx: { rest: 'istirahat', provoked: 'provoke', reduced: 'azalmış' },
    samSeptum: 'septum', samLeaflet: 'ön mitral yaprakçık',
    samCaption: 'Şematik: sistolik öne hareket (SAM); gradyan arttıkça septum ile ön mitral yaprakçık arası daralır.',
    table: 'Manevra yanıtları', colManeuver: 'Manevra', colModel: 'Model', colExpected: 'Beklenen (ders kitabı)',
    colMatch: 'Uyum', colLembo: 'Lembo', match: 'uyumlu', mismatch: 'uyumsuz',
    dir: { '+': 'artar', '-': 'azalır', '0': 'değişmez' },
    durDir: { '+': 'daha erken/uzun', '-': 'daha geç/kısa', '0': 'değişmez' },
    lembo: (se, sp) => `Se %${se}, Sp %${sp}`, lemboTitle: 'duyarlılık (Se), özgüllük (Sp)',
    citation: 'Lembo NJ et al. N Engl J Med 1988;318:1572-8',
    bestHeard: 'En iyi duyulduğu odak', radiation: 'Yayılım', timing: 'Zamanlama ve şekil', pitch: 'Frekans',
    areas: 'Oskültasyon odakları', sound: 'Ses (şematik)',
    soundNote: 'Sentezlenmiş şematik ses; gerçek bir kayıt değildir.',
    kinds: { systolic: 'sistolik', diastolic: 'diyastolik' },
    shapes: {
      ejection: 'Sistolik ejeksiyon üfürümü, kreşendo-dekreşendo',
      holosystolic: 'Holosistolik, düz (plato)',
      'late-systolic': 'Orta sistolik klik ve geç sistolik üfürüm',
      'early-diastolic': 'Erken diyastolik, dekreşendo',
      rumble: 'Orta-geç diyastolik rulman, açılma sesinden sonra; sinüs ritminde presistolik belirginleşme'
    },
    pitches: {
      low: 'düşük frekanslı (çan)', rumble: 'düşük frekanslı (çan)', medium: 'orta frekanslı',
      harsh: 'sert, orta-yüksek frekanslı', blowing: 'üfleyici, yüksek frekanslı (diyafram)',
      high: 'yüksek frekanslı (diyafram)', musical: 'müzikal, titreşimli'
    }
  },
  en: {
    finding: 'Finding', systolic: 'Systolic murmurs', diastolic: 'Diastolic murmurs',
    gradeTitle: 'Murmur intensity (Levine grade)', maneuvers: 'Maneuvers',
    stages: { ramp: 'onset', hold: 'hold', recover: 'recovery', done: 'done', fixed: 'hold (fixed)' },
    canvas: 'Schematic phonocardiogram and ECG', systole: 'systole', diastole: 'diastole', ecg: 'ECG',
    lvotTitle: 'LVOT gradient (mmHg)', restMark: 'rest',
    lvotReading: (g, cls, ctx) => `LVOT gradient ${g} mmHg (${cls}, ${ctx})`,
    lvotClass: { severe: 'severe', obstructive: 'obstructive', 'non-obstructive': 'non-obstructive' },
    lvotCtx: { rest: 'at rest', provoked: 'provoked', reduced: 'reduced' },
    samSeptum: 'septum', samLeaflet: 'anterior mitral leaflet',
    samCaption: 'Schematic: systolic anterior motion (SAM); the septum to leaflet gap narrows as the gradient rises.',
    table: 'Maneuver responses', colManeuver: 'Maneuver', colModel: 'Model', colExpected: 'Expected (textbook)',
    colMatch: 'Match', colLembo: 'Lembo', match: 'matches', mismatch: 'does not match',
    dir: { '+': 'louder', '-': 'softer', '0': 'unchanged' },
    durDir: { '+': 'earlier/longer', '-': 'later/shorter', '0': 'unchanged' },
    lembo: (se, sp) => `Se ${se}%, Sp ${sp}%`, lemboTitle: 'sensitivity (Se), specificity (Sp)',
    citation: 'Lembo NJ et al. N Engl J Med 1988;318:1572-8',
    bestHeard: 'Best heard at', radiation: 'Radiation', timing: 'Timing and shape', pitch: 'Pitch',
    areas: 'Auscultation areas', sound: 'Sound (schematic)',
    soundNote: 'Synthesized schematic sound, not a recording.',
    kinds: { systolic: 'systolic', diastolic: 'diastolic' },
    shapes: {
      ejection: 'Systolic ejection murmur, crescendo-decrescendo',
      holosystolic: 'Holosystolic, plateau',
      'late-systolic': 'Mid-systolic click and late systolic murmur',
      'early-diastolic': 'Early diastolic, decrescendo',
      rumble: 'Mid-to-late diastolic rumble after the opening snap; presystolic accentuation in sinus rhythm'
    },
    pitches: {
      low: 'low-pitched (bell)', rumble: 'low-pitched (bell)', medium: 'medium-pitched',
      harsh: 'harsh, medium-high pitch', blowing: 'blowing, high-pitched (diaphragm)',
      high: 'high-pitched (diaphragm)', musical: 'musical, vibratory'
    }
  }
};

export const ARROWS = Object.freeze({ '+': '↑', '-': '↓', '0': '↔' });
export const GAUGE_MAX = 120;            // mmHg, right end of the LVOT gauge
export const LEVEL_STEP = 0.02;          // maneuver level quantum for resampling
export const PHONO_BEATS = 2;            // the strip always shows two beats
const NORMAL_SOUNDS = new Set(['S1', 'A2', 'P2']);

export const normLang = lang => (lang === 'en' ? 'en' : 'tr');
export const labelOf = (label, lang) => (label ? label[normLang(lang)] || label.tr || label.en || '' : '');
/** Number with the language's decimal mark; integers print without decimals. */
export const fmtNum = (v, lang, digits = 1) => {
  const text = Number.isInteger(v) ? String(v) : v.toFixed(digits);
  return normLang(lang) === 'tr' ? text.replace('.', ',') : text;
};
export const quantizeLevel = level => Math.round(Math.max(0, Math.min(1, level)) / LEVEL_STEP) * LEVEL_STEP;

/** Direction code as display text: arrow, or timing words for duration findings (MVP). */
export function directionText(code, duration, lang) {
  return duration ? TEXT[normLang(lang)].durDir[code] || code : ARROWS[code] || code;
}

/**
 * Maneuver time course: ramp, hold and recovery spans (seconds, from
 * maneuverSpans in exam-physiology.js) and the stage at time t.
 */
export function maneuverStage(maneuverId, t) {
  const m = MANEUVERS[maneuverId] || MANEUVERS.rest;
  if (m.id === 'rest') return { stage: 'rest', fraction: 0, spans: [0, 0, 0], total: 0 };
  const spans = maneuverSpans(maneuverId);
  const total = spans[0] + spans[1] + spans[2];
  const stage = t < spans[0] ? 'ramp' : t < spans[0] + spans[1] ? 'hold' : t < total ? 'recover' : 'done';
  return { stage, fraction: Math.max(0, Math.min(1, t / total)), spans, total };
}

/**
 * Sample the phonocardiogram over `beats` beats on real time. No DOM.
 * @returns {{ times: Float32Array, phases: Float32Array, murmur: Float32Array, ecg: Float32Array,
 *   sounds: Array<{ x: number, amp: number, label: string, width: number, beat: number }>, physio: object, total: number }}
 */
export function sampleExamStrip({ findingId, maneuverId = 'rest', level = 1, beats = PHONO_BEATS, bpm = 72, rhythm = 'sinus', columns = 300 }) {
  const n = Math.max(2, Math.round(columns) || 2);
  const nb = Math.max(1, Math.round(beats) || PHONO_BEATS);
  const rate = bpm > 0 ? bpm : 72;
  const rr = 60 / rate;
  const total = rr * nb;
  const physio = physiologyOf(maneuverId, level);
  const times = new Float32Array(n), phases = new Float32Array(n), murmur = new Float32Array(n), ecg = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = (i * total) / (n - 1);
    const k = Math.min(nb - 1, Math.floor(t / rr));
    const u = timeToPhase(Math.min((t - k * rr) / rr, 0.99999), rate);
    times[i] = t; phases[i] = u;
    murmur[i] = Math.max(0, murmurEnvelope(findingId, u, physio, { rhythm }));
    ecg[i] = ecgSample(u, rhythm);
  }
  const events = FINDINGS[findingId] ? heartSoundEvents(findingId, physio, { rhythm }) : [];
  const sounds = [];
  for (let k = 0; k < nb; k++) {
    for (const ev of events) {
      const t = (k + phaseToTime(ev.u, rate)) * rr;
      sounds.push({ x: Math.round((t / total) * (n - 1)), amp: Math.max(0, ev.amp), label: ev.label, width: ev.width, beat: k });
    }
  }
  sounds.sort((a, b) => a.x - b.x);
  return { times, phases, murmur, sounds, ecg, physio, total };
}

/**
 * Model versus textbook response of one finding to every maneuver (level 1).
 * `model` is the raw code, `modelText` / `expected` are display strings.
 */
export function responseTable(findingId, lang = 'tr') {
  const finding = FINDINGS[findingId];
  if (!finding) return [];
  const T = TEXT[normLang(lang)];
  const duration = finding.metric === 'duration';
  return MANEUVER_IDS.map(maneuverId => {
    const r = respond(findingId, maneuverId, 1);
    const raw = finding.expected[maneuverId];
    const codes = raw === undefined ? null : [].concat(raw);
    const lembo = finding.lembo?.[maneuverId];
    return {
      maneuverId,
      label: labelOf(MANEUVERS[maneuverId].label, lang),
      model: r.direction,
      modelText: directionText(r.direction, duration, lang),
      modelTitle: duration ? T.durDir[r.direction] : T.dir[r.direction],
      expected: codes ? codes.map(c => directionText(c, duration, lang)).join(duration ? ' / ' : '/') : null,
      expectedCodes: codes,
      match: matchesExpected(findingId, maneuverId, r.direction),
      lembo: lembo ? T.lembo(lembo.sens, lembo.spec) : null,
      lemboNote: lembo?.note || null,
      gradeText: `${fmtNum(r.grade, lang)}/6`,
      lvot: r.lvotGradient == null ? null : Math.round(r.lvotGradient)
    };
  });
}

/** Words for the finding card; unknown shapes or pitches fall back to the raw value. */
export function findingWords(finding, lang) {
  const T = TEXT[normLang(lang)];
  return {
    timing: T.shapes[finding.shape] || `${T.kinds[finding.kind] || finding.kind} (${finding.shape})`,
    pitch: T.pitches[finding.pitch] || finding.pitch || ''
  };
}

// ---------------------------------------------------------------------------
// Canvas rendering of the cached phonocardiogram layer.
// ---------------------------------------------------------------------------

export const COLORS = {
  bg: '#fcfdfb', boundary: 'rgba(63, 94, 82, 0.28)', baseline: 'rgba(93, 138, 120, 0.3)', cursor: '#e0524d',
  murmur: 'rgba(36, 79, 67, 0.58)', sound: '#263e3b', soundAbnormal: '#8e4a58', label: '#31573f',
  systole: 'rgba(224, 82, 77, 0.055)', span: '#96a28e', ecg: '#3f7d5f'
};
const FONT = '9px "DM Sans", sans-serif';
const SMALL_FONT = '8px "DM Sans", sans-serif';

function hash(i) {
  let x = Math.imul((i | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

/** Deterministic texture (0.35..1) of column i; coarse grain for low-pitched murmurs. */
export function murmurTexture(i, pitch) {
  if (pitch === 'musical') return 0.72 + 0.28 * Math.sin(i * 1.3);
  const grain = pitch === 'low' || pitch === 'rumble' ? 4 : pitch === 'high' || pitch === 'blowing' ? 1 : 2;
  const cell = Math.floor(i / grain), f = (i % grain) / grain;
  const noise = hash(cell) * (1 - f) + hash(cell + 1) * f;
  return 0.35 + 0.65 * noise;
}

/** Layout of the phonocardiogram canvas in CSS pixels. */
export function phonoGeometry(w, h) {
  const left = 8, right = w - 8, top = 24;
  const ecgH = Math.max(16, Math.round(h * 0.15));
  const ecgTop = h - 4 - ecgH;
  const bottom = ecgTop - 12;
  const n = Math.max(2, Math.round(right - left));
  return {
    w, h, left, right, top, bottom, ecgTop, ecgH, n,
    baseline: (top + bottom) / 2, half: (bottom - top) / 2 - 2,
    beatW: (right - left) / PHONO_BEATS, x: i => left + (i * (right - left)) / (n - 1)
  };
}

function drawSpans(ctx, g, bpm, T) {
  const sysStart = phaseToTime(S.avClosed, bpm), sysEnd = phaseToTime(S.ivrStart, bpm);
  ctx.font = SMALL_FONT;
  ctx.textAlign = 'center';
  for (let k = 0; k < PHONO_BEATS; k++) {
    const b = g.left + k * g.beatW;
    const x0 = b + sysStart * g.beatW, x1 = b + sysEnd * g.beatW;
    ctx.fillStyle = COLORS.systole;
    ctx.fillRect(x0, g.top, x1 - x0, g.bottom - g.top);
    ctx.fillStyle = COLORS.span;
    if (x1 - x0 > 34) ctx.fillText(T.systole, (x0 + x1) / 2, g.bottom + 9);
    if (x0 - b > 40) ctx.fillText(T.diastole, (b + x0) / 2, g.bottom + 9);
  }
  ctx.strokeStyle = COLORS.boundary;
  ctx.setLineDash([3, 3]);
  for (let k = 1; k < PHONO_BEATS; k++) {
    ctx.beginPath();
    ctx.moveTo(g.left + k * g.beatW, g.top - 4);
    ctx.lineTo(g.left + k * g.beatW, g.h - 3);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawMurmur(ctx, g, strip, pitch) {
  ctx.fillStyle = COLORS.murmur;
  for (let i = 0; i < g.n; i++) {
    const a = strip.murmur[i];
    if (a <= 0.002) continue;
    const amp = a * murmurTexture(i, pitch) * g.half;
    ctx.fillRect(g.x(i) - 0.5, g.baseline - amp, 1, 2 * amp);
  }
  ctx.strokeStyle = COLORS.baseline;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(g.left, g.baseline); ctx.lineTo(g.right, g.baseline); ctx.stroke();
}

function drawSounds(ctx, g, strip) {
  const rowEnd = [-Infinity, -Infinity];
  ctx.font = FONT;
  ctx.textAlign = 'left';
  for (const s of strip.sounds) {
    const x = g.x(Math.min(g.n - 1, Math.max(0, s.x)));
    const height = Math.min(1, s.amp) * g.half * 0.95;
    const color = NORMAL_SOUNDS.has(s.label) ? COLORS.sound : COLORS.soundAbnormal;
    const spread = Math.max(1.5, s.width * g.beatW * 0.5);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x, g.baseline - height); ctx.lineTo(x, g.baseline + height); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - spread, g.baseline - height * 0.5); ctx.lineTo(x - spread, g.baseline + height * 0.5);
    ctx.moveTo(x + spread, g.baseline - height * 0.45); ctx.lineTo(x + spread, g.baseline + height * 0.45);
    ctx.stroke();
    const tw = ctx.measureText(s.label).width;
    const x0 = x - tw / 2;
    const row = x0 > rowEnd[0] + 2 ? 0 : 1;
    rowEnd[row] = x0 + tw;
    ctx.fillStyle = color;
    ctx.fillText(s.label, x0, row === 0 ? 20 : 10);
  }
}

function drawEcg(ctx, g, strip, T) {
  ctx.strokeStyle = COLORS.ecg;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < g.n; i++) {
    const y = g.ecgTop + g.ecgH - ((strip.ecg[i] + 0.3) / 1.35) * g.ecgH;
    if (i === 0) ctx.moveTo(g.x(i), y); else ctx.lineTo(g.x(i), y);
  }
  ctx.stroke();
  ctx.font = SMALL_FONT;
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.span;
  ctx.fillText(T.ecg, g.right, g.ecgTop + 7);
}

/** Paint the static phonocardiogram layer (everything but the cursor). */
export function paintPhono(ctx, { w, h, strip, pitch, bpm, lang }) {
  const g = phonoGeometry(w, h);
  const T = TEXT[normLang(lang)];
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);
  drawSpans(ctx, g, bpm, T);
  drawMurmur(ctx, g, strip, pitch);
  drawSounds(ctx, g, strip);
  drawEcg(ctx, g, strip, T);
  return g;
}

// ---------------------------------------------------------------------------
// Schematic SAM: the anterior mitral leaflet tip swings toward the septal
// bulge as the LVOT gradient rises. Coordinates in a 240 x 60 viewBox.
// ---------------------------------------------------------------------------

export const SAM_VIEWBOX = '0 0 240 60';
export const SAM_SEPTUM_PATH = 'M0,0 H240 V9 C176,9 152,23 120,23 C88,23 64,9 0,9 Z';
const SAM_BULGE = { x: 120, y: 23 };

/** Leaflet path, gap line and gap (viewBox units) for a gradient in mmHg. */
export function samGeometry(gradient) {
  const s = Math.max(0, Math.min(1, (gradient - 5) / (GAUGE_MAX - 5)));
  const gap = 24 - 22 * Math.sqrt(s);
  const tip = { x: 126 - 4 * s, y: SAM_BULGE.y + gap };
  return {
    gap,
    leaflet: `M204,58 Q${(162 - 8 * s).toFixed(1)},${(54 - 6 * s).toFixed(1)} ${tip.x.toFixed(1)},${tip.y.toFixed(1)}`,
    gapLine: { x1: SAM_BULGE.x, y1: SAM_BULGE.y, x2: tip.x, y2: tip.y }
  };
}

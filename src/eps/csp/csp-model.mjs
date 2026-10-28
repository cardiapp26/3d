/** Original educational signal model. All parameters and waveforms are synthetic.
 * Capture fields are simulation ground truth, never a patient diagnosis.
 * No device, proprietary simulator, or validated clinical classifier is reproduced.
 */
// group: 'case' (a patient) or 'trap' (one situation where a single criterion misleads).
export const CASES = Object.freeze([
  { id: 'baseline', group: 'case', name: { tr: 'Tam AV blok, ayrı eşikler', en: 'Complete AV block, separate thresholds' }, description: { tr: 'Aynı konumda output azaltılır; iki dokunun ayrı eşikleri karşılaştırılır.', en: 'Reduce output at one position and compare independent tissue thresholds.' } },
  { id: 'random', group: 'case', name: { tr: 'Rastgele hasta', en: 'Random patient' }, description: { tr: 'Septum kalınlığı, sol dal seviyesi, eşikler ve ileti hızı her yüklemede yeniden çekilir.', en: 'Septal thickness, left bundle level, thresholds and conduction speed are drawn anew on every load.' } },
  { id: 'slow', group: 'trap', name: { tr: 'Yavaş ileti ve refrakterlik', en: 'Slow conduction and refractoriness' }, description: { tr: 'İleti gecikmesi ve farklı ERP değerleri programlı uyarımla karşılaştırılır.', en: 'Compare conduction delay and different ERPs using programmed stimulation.' } },
  { id: 'equal', group: 'trap', name: { tr: 'Çakışan eşikler', en: 'Coincident thresholds' }, description: { tr: 'Output testi belirgin bir morfoloji geçişi göstermeyebilir.', en: 'An output test may not reveal a distinct morphology transition.' } },
  { id: 'scar', group: 'trap', name: { tr: 'Heterojen septum', en: 'Heterogeneous septum' }, description: { tr: 'Yüksek miyokard eşiği ve erişilemeyen ileti dokusu birlikte modellenir.', en: 'A raised myocardial threshold coexists with unavailable conduction tissue.' } },
  { id: 'selective', group: 'trap', name: { tr: 'Selektif yakalanma maskeli', en: 'Selective capture unmasked' }, description: { tr: 'Miyokard eşiği yüksek, ileti eşiği düşük: geniş bir çıkış aralığında yalnız selektif yakalanma vardır ve yakalanma kaybı sanılabilir.', en: 'High myocardial, low conduction threshold: a wide output range captures only the conduction system and can be mistaken for loss of capture.' } },
  { id: 'invertedErp', group: 'trap', name: { tr: 'Ters refrakterlik', en: 'Inverted refractoriness' }, description: { tr: 'Miyokardın ERP’si ileti dokusundan uzun: S2 önce miyokardı düşürür, selektif LBBP çıkar.', en: 'Myocardial ERP longer than the conduction tissue: S2 drops the myocardium first and unmasks selective LBBP.' } },
  { id: 'dilated', group: 'trap', name: { tr: 'Dilate LV, sınırda V6RWPT', en: 'Dilated LV, borderline V6RWPT' }, description: { tr: 'Süre ölçümleri gri bölgede kalır; kanıt yalnız geçişle gelir.', en: 'Timing stays in the grey band; proof comes only from a transition.' } },
  { id: 'lbbHigh', group: 'trap', name: { tr: 'LBB eşiği miyokard eşiğinin üstünde', en: 'LBB threshold above muscle threshold' }, description: { tr: 'Azalan çıkışta nonselektiften LV septale düşüş; çıkış LBB eşiğinin 2 katına ayarlanmalı.', en: 'Decremental output drops from nonselective to LV septal capture; the output must be set to twice the LBB threshold.' } },
  { id: 'stall', group: 'trap', name: { tr: 'Mid-septal skar: heliks takılır', en: 'Mid-septal scar stall' }, description: { tr: 'Septumun ortasında skar adası: tur atılır, derinlik ilerlemez. Birkaç mm apikale yeniden konumlanır.', en: 'A scar island mid-septum: turns advance nothing. Reposition a few mm apically.' } },
  { id: 'snd', group: 'case', name: { tr: 'Sinüs düğümü hastalığı, dar QRS', en: 'Sinus node disease, narrow QRS' }, description: { tr: 'Sinüs bradikardisi, intakt AV ileti. Pacing kapalıyken P dalgalı dar QRS görülür.', en: 'Sinus bradycardia with intact AV conduction. Pacing off shows P waves and a narrow QRS.' } },
  { id: 'lbbb', group: 'case', name: { tr: 'LBBB, HFrEF (CRT endikasyonu)', en: 'LBBB, HFrEF (CRT indication)' }, description: { tr: 'Geniş LBBB; düzeltme için V6RWPT kesimi 80 ms.', en: 'Wide LBBB; the correction cut-off for V6RWPT is 80 ms.' } },
  { id: 'lbbbScar', group: 'case', name: { tr: 'LBBB, septal skar (zor)', en: 'LBBB, septal scar (hard)' }, description: { tr: 'LBBB ile birlikte yüksek miyokard eşiği ve zor ilerleyen heliks.', en: 'LBBB with a raised myocardial threshold and a helix that advances poorly.' } },
  { id: 'rbbb', group: 'trap', name: { tr: 'Bazal RBBB', en: 'Baseline RBBB' }, description: { tr: 'V1’deki r′ her derinlikte vardır; derinlik V6RWPT, empedans ve COI ile değerlendirilir.', en: 'The r′ in V1 is present at any depth; judge depth on V6RWPT, impedance and COI.' } },
  { id: 'fusion', group: 'trap', name: { tr: 'İntrinsik iletiyle füzyon', en: 'Fusion with intrinsic conduction' }, description: { tr: 'Sinüs hızı pacing hızına yakın: füzyon QRS’i daraltır ve V6RWPT’yi yanıltır. Hızı artır.', en: 'Sinus rate close to the pacing rate: fusion narrows the QRS and fakes a short V6RWPT. Raise the rate.' } },
  { id: 'bump', group: 'trap', name: { tr: 'LBBB, sağ dal travması', en: 'LBBB, right bundle bumped' }, description: { tr: 'Bazal septumda manipülasyon sağ dalı zedeler: tam blok, geniş yavaş kaçış. Pacing kapatılmaz.', en: 'Manipulation on the basal septum injures the right bundle: complete block, slow wide escape. Pacing stays on.' } }
]);
export const RHYTHMS = Object.freeze(['escape', 'sinus', 'lbbb', 'rbbb', 'escapeWide']);
/**
 * Tissue parameters per teaching case (synthetic). scar: myocardial threshold multiplier;
 * access: conduction tissue reachable at all; ratio: conduction threshold as a fraction of the
 * myocardial one (null: the model's own, about .5); slowMs: conduction delay; ERPs in ms;
 * v6Offset: extra Stim-V6RWPT (dilated LV); interpeakShift narrows the V6-V1 interpeak;
 * muscleERP > conductionERP inverts the S2 order. `random` draws its own set (options.params).
 */
// rhythm: the intrinsic rhythm seen with pacing off (escape: complete block with a narrow escape;
// sinus: intact AV conduction with P waves; lbbb / rbbb: sinus with bundle branch block; escapeWide:
// complete block with a slow wide escape). intrinsicRate in bpm. trauma: basal manipulation can bump the right bundle.
const BASE = { scar: 1, access: true, ratio: null, slowMs: 0, muscleERP: 235, conductionERP: 285, v6Offset: 0, conductionFactor: 1, interpeakShift: 0, rhythm: 'escape', intrinsicRate: 40, trauma: false };
export const CASE_PARAMS = Object.freeze({
  baseline: { ...BASE },
  random: { ...BASE },
  slow: { ...BASE, slowMs: 24, conductionERP: 340, conductionFactor: 1.15, interpeakShift: -8 },
  equal: { ...BASE, ratio: 1 },
  scar: { ...BASE, scar: 2.4, access: false, muscleERP: 265 },
  selective: { ...BASE, scar: 1.6, ratio: .25 },
  invertedErp: { ...BASE, muscleERP: 275, conductionERP: 215 },
  dilated: { ...BASE, v6Offset: 20, interpeakShift: -6 },
  lbbHigh: { ...BASE, ratio: 1.6 },
  stall: { ...BASE },
  snd: { ...BASE, rhythm: 'sinus', intrinsicRate: 45 },
  lbbb: { ...BASE, rhythm: 'lbbb', intrinsicRate: 70, slowMs: 6 },
  lbbbScar: { ...BASE, rhythm: 'lbbb', intrinsicRate: 68, scar: 1.8, conductionFactor: 1.25, slowMs: 8 },
  rbbb: { ...BASE, rhythm: 'rbbb', intrinsicRate: 72 },
  fusion: { ...BASE, rhythm: 'sinus', intrinsicRate: 86 },
  bump: { ...BASE, rhythm: 'lbbb', intrinsicRate: 66, slowMs: 6, trauma: true }
});
const PARAM_RANGES = Object.freeze({ scar: [1, 3], ratio: [.2, 2], slowMs: [0, 40], muscleERP: [200, 320], conductionERP: [200, 380], v6Offset: [0, 30], conductionFactor: [.8, 1.5], interpeakShift: [-15, 15], intrinsicRate: [25, 120] });
/** A custom parameter set (random patient, trauma override), every field bounded; null when nothing usable was given. */
export function sanitizeParams(params) {
  if (!params || typeof params !== 'object') return null;
  const out = { ...BASE };
  for (const [key, [lo, hi]] of Object.entries(PARAM_RANGES)) {
    if (key === 'ratio' && params.ratio === null) { out.ratio = null; continue; }
    if (Number.isFinite(params[key])) out[key] = clamp(params[key], lo, hi);
  }
  if (typeof params.access === 'boolean') out.access = params.access;
  if (typeof params.trauma === 'boolean') out.trauma = params.trauma;
  if (RHYTHMS.includes(params.rhythm)) out.rhythm = params.rhythm;
  return Object.freeze(out);
}
const caseParams = s => s.params || CASE_PARAMS[s.caseId] || CASE_PARAMS.baseline;
/** Parameters in force for a normalized state (custom set or the case's). */
export const paramsOf = s => caseParams(s);
const WIDE_RHYTHMS = Object.freeze(['lbbb', 'escapeWide']);
/** Stim-V6RWPT cut-offs by baseline rhythm: 74 / 85 ms for a narrow QRS or RBBB, 80 / 100 ms for LBBB and a wide escape. */
export const v6CutoffsOf = s => (WIDE_RHYTHMS.includes(caseParams(s).rhythm) ? { met: 80, likely: 100 } : { met: 74, likely: 85 });
// level: site along the His-apex line (0 His, 1 apex); offset: away from the septum (-1 anterior free wall .. +1 posterior).
// Both shape the paced morphology (limb-lead axis, V1 notch, free-wall width); `entry` keeps the conduction access.
export const DEFAULTS = Object.freeze({ caseId: 'baseline', entry: .5, angle: 8, depth: .88, output: 2, pulseWidth: .4, polarity: 'uni', rate: 70, pacing: true, s2: null, level: .35, offset: 0, params: null });
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const COI_MAX = 15;   // mV at the best position (synthetic teaching scale)
function number(value, fallback, lo, hi) {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isFinite(n) ? clamp(n, lo, hi) : fallback;
}
export function normalize(options = {}) {
  const o = options && typeof options === 'object' ? options : {};
  const s2Value = o.s2 === undefined ? o.couplingMs : o.s2;
  return {
    caseId: Object.hasOwn(CASE_PARAMS, o.caseId) ? o.caseId : DEFAULTS.caseId,
    entry: number(o.entry, DEFAULTS.entry, 0, 1), angle: number(o.angle, DEFAULTS.angle, 0, 90),
    depth: number(o.depth, DEFAULTS.depth, 0, 1.2), output: number(o.output, DEFAULTS.output, 0, 8),
    pulseWidth: number(o.pulseWidth, DEFAULTS.pulseWidth, .2, 1),
    polarity: o.polarity === 'bi' ? 'bi' : 'uni', rate: number(o.rate, DEFAULTS.rate, 40, 140),
    pacing: typeof o.pacing === 'boolean' ? o.pacing : DEFAULTS.pacing,
    s2: s2Value == null || s2Value === '' ? null : number(s2Value, null, 180, 450),
    level: number(o.level, DEFAULTS.level, 0, 1), offset: number(o.offset, DEFAULTS.offset, -1, 1),
    params: sanitizeParams(o.params),
  };
}
function tissue(s) {
  const cp = caseParams(s);
  const contact = Math.max(.12, Math.cos(s.angle * Math.PI / 180)) * (1 - .6 * Math.abs(s.entry - .5));
  const conductionAccess = s.depth >= .82 && s.depth < .98 && Math.abs(s.entry - .5) <= .21 && s.angle <= 32 && cp.access;
  const muscleThreshold = .65 * (1 + .18 / s.pulseWidth) * cp.scar / contact;
  const conductionThreshold = conductionAccess
    ? (cp.ratio != null ? muscleThreshold * cp.ratio : .32 * (1 + .22 / s.pulseWidth) * (cp.conductionFactor || 1) / contact) : null;
  return { contact, muscleThreshold, conductionThreshold, muscleERP: cp.muscleERP, conductionERP: cp.conductionERP };
}
function captureAt(s, t) {
  const empty = { type: 'none', muscle: false, conduction: false, anodal: false };
  if (s.depth >= 1) return { ...empty, type: 'perforation' };
  if (!s.pacing) return { ...empty, type: 'off' };
  const interval = s.s2 ?? 60000 / s.rate;
  const muscle = s.output > 0 && s.output >= t.muscleThreshold && interval >= t.muscleERP;
  const conduction = s.output > 0 && t.conductionThreshold !== null && s.output >= t.conductionThreshold && interval >= t.conductionERP;
  const anodal = s.polarity === 'bi' && s.depth >= .76 && s.angle <= 40 && s.output >= 3.8 * (1 + .12 / s.pulseWidth) / t.contact && interval >= t.muscleERP;
  let type = 'none';
  if (muscle) type = s.depth < .35 ? 'rv' : s.depth < .78 ? 'deep' : 'lvsp';
  if (conduction) type = muscle ? 'nonselective' : 'selective';
  if (anodal) type = 'anodal';
  return { type, muscle, conduction, anodal };
}
// Compact smooth components with finite support make delineation reproducible.
function bump(t, center, halfWidth) {
  const d = Math.abs(t - center) / halfWidth;
  return d >= 1 ? 0 : .5 * (1 + Math.cos(Math.PI * d));
}
const PROJECTIONS = Object.freeze({
  I: [1, 0, 0], II: [.5, Math.sqrt(3) / 2, 0], III: [-.5, Math.sqrt(3) / 2, 0],
  aVR: [-.75, -Math.sqrt(3) / 4, 0], aVL: [.75, -Math.sqrt(3) / 4, 0], aVF: [0, Math.sqrt(3) / 2, 0],
  V1: [-.3, 0, 1], V2: [-.2, .05, .92], V3: [.2, .08, .65], V4: [.65, .1, .3], V5: [.92, .1, -.05], V6: [1, .08, -.16],
});
const OFF_REFERENCE = 230;   // intrinsic beats: QRS late enough in the 0-500 ms window for a P wave before it
// Intrinsic QRS templates by rhythm: width, peak of the leftward (V6) vector, peak of the anterior
// (V1) vector, the terminal V1 vector, a late rightward S (RBBB), a mid-R notch in V6 (LBBB), P wave.
const INTRINSIC = Object.freeze({
  escape: { width: 105, xPeak: 48, zPeak: 32, terminal: .85, xLate: 0, xNotch: 0, pWave: false },
  sinus: { width: 95, xPeak: 44, zPeak: 30, terminal: .85, xLate: 0, xNotch: 0, pWave: true },
  lbbb: { width: 152, xPeak: 92, zPeak: 60, terminal: -1.1, xLate: 0, xNotch: .32, pWave: true },
  rbbb: { width: 138, xPeak: 38, zPeak: 112, terminal: .95, xLate: -.55, xNotch: 0, pWave: true },
  escapeWide: { width: 160, xPeak: 96, zPeak: 64, terminal: -1, xLate: 0, xNotch: .2, pWave: false }
});
function parameters(s, c) {
  const hasBeat = c.type === 'off' || c.muscle || c.conduction || c.anodal;
  const cp = caseParams(s);
  const slow = cp.slowMs + (c.type === 'off' ? 0 : cp.v6Offset);
  let onset = 8, width = 145, xPeak = 88, zPeak = 112, xLate = 0, xNotch = 0, pWave = false, terminal = null;
  if (c.type === 'off') {
    const t = INTRINSIC[cp.rhythm] || INTRINSIC.escape;
    onset = 0; width = t.width + slow; xPeak = t.xPeak + slow; zPeak = t.zPeak + slow; xLate = t.xLate; xNotch = t.xNotch; pWave = t.pWave; terminal = t.terminal;
  }
  else if (c.conduction) { onset = c.muscle ? 5 : 22; width = (c.muscle ? 111 : 96) + slow; xPeak = 58 + slow; zPeak = 110 + slow; }   // early V6 R, late V1 r': interpeak beyond 44 ms
  else if (s.depth >= .78) { width = 128 + slow; xPeak = 83 + slow; zPeak = 106 + slow; }
  else if (s.depth >= .35) { width = 144 + slow; xPeak = 95 + slow; zPeak = 116 + slow; }
  // Off the septum (RV free wall): a wide, late beat without the septal notch.
  const freeWall = c.type === 'rv' && Math.abs(s.offset) > .5;
  if (freeWall) { width += 40; xPeak += 22; zPeak += 18; }
  if (cp.scar > 1) { width += 28; xPeak += 15; zPeak += 12; }
  if (c.anodal) { width -= 9; xPeak -= 7; zPeak -= 17; }
  if (c.conduction) zPeak += cp.interpeakShift || 0;   // slow left-sided conduction narrows the V6-V1 interpeak
  // Limb-lead axis by level: basal septum inferior (II, III positive), apical superior (II, III negative).
  const axis = 1 - 2 * clamp((s.level - .1) / .6, 0, 1);
  // V1: the septal pace map has a mid-QRS notch (a W) that moves toward the end of the QRS as the tip
  // goes deeper but stays within it (up to 70 %); the terminal r' is a separate, later vector.
  const notch = c.type === 'off' || freeWall ? 0 : .3;
  const notchAt = .38 + .32 * clamp(s.depth / .8, 0, 1);
  // Terminal V1 vector: negative (QS) from the RV septum, turning positive (r') from the LV septal
  // depth (.78 of the wall, where the capture label becomes LV septal). With baseline RBBB the
  // late right ventricle keeps an r' at any depth.
  if (terminal === null) {
    const deepShare = c.conduction ? 1 : c.type === 'rv' ? 0 : clamp((s.depth - .66) / .16, 0, 1);
    terminal = -.5 + 1.35 * deepShare;
    if (cp.rhythm === 'rbbb' && !freeWall) terminal = Math.max(terminal, .55);
  }
  return { hasBeat, reference: c.type === 'off' ? OFF_REFERENCE : 50, onset, width, xPeak, zPeak, axis, notch, notchAt, freeWall, terminal, xLate, xNotch, pWave };
}
function causalBandpass(values, hp = 30, lp = 250) {
  const highAlpha = 1 / (1 + 2 * Math.PI * hp / 1000);
  const lowAlpha = 1 - Math.exp(-2 * Math.PI * lp / 1000);
  let previous = values[0], high = 0, low = 0;
  return values.map(value => { high = highAlpha * (high + value - previous); previous = value; low += lowAlpha * (high - low); return low; });
}
const PEAK_MIN = .1;   // a positive deflection below this is noise, not an R wave
function positivePeak(values, start, end) {
  let index = null, amplitude = PEAK_MIN;
  for (let i = Math.max(0, start); i <= Math.min(values.length - 1, end); i++) if (values[i] > amplitude) { amplitude = values[i]; index = i; }
  return index;
}
/** Latency (ms) from the stimulus to the local EGM: an isoelectric interval marks selective capture. */
function latencyOf(filtered, p, s) {
  if (!p.hasBeat || !s.pacing || p.reference !== 50) return null;
  // Skip the stimulus artefact and its filter ringing (about 8 ms), then take the first local deflection.
  for (let i = p.reference + 9; i < filtered.length; i++) if (Math.abs(filtered[i]) > .25) return i - p.reference;
  return null;
}
function measure(leads, p, s) {
  if (!p.hasBeat) return { v6Rwpt: null, v1Rwpt: null, interpeak: null, qrsDuration: null };
  const start = Math.ceil(p.reference + p.onset), end = Math.min(500, Math.ceil(start + p.width));
  // Envelope uses independent projections of same vector, with stimulus excluded.
  const envelope = leads.I.map((x, i) => Math.hypot(x, (leads.II[i] - .5 * x) * 2 / Math.sqrt(3), leads.V1[i] + .3 * x));
  const maximum = Math.max(...envelope.slice(start, end + 1));
  const active = [];
  for (let i = start; i <= end; i++) if (envelope[i] >= maximum * .03 && maximum > 0) active.push(i);
  const v6 = positivePeak(leads.V6, start, end), v1 = positivePeak(leads.V1, start, end);
  return { v6Rwpt: s.pacing && v6 !== null ? v6 - p.reference : null,
    v1Rwpt: s.pacing && v1 !== null ? v1 - p.reference : null,
    interpeak: v1 !== null && v6 !== null ? v1 - v6 : null,
    qrsDuration: active.length ? active.at(-1) - active[0] : null };
}
const TIMES = Object.freeze(Array.from({ length: 501 }, (_, i) => i));
/** The 12 leads and the unipolar tip EGM for one parameter set (stimulus only when `stim`). */
function render(state, p, c, coi, stim) {
  const leads = Object.fromEntries(Object.keys(PROJECTIONS).map(key => [key, []]));
  const unfiltered = [];
  const yAxis = c.type === 'off' ? .62 : 1.5 * p.axis;   // intrinsic beat keeps its own axis
  for (const time of TIMES) {
    const r = time - p.reference;
    const start = p.onset, end = p.onset + p.width;
    const window = r > start && r < end ? Math.sin(Math.PI * (r - start) / p.width) ** .4 : 0;
    const pWave = p.pWave ? .11 * bump(r, start - 150, 38) : 0;
    const x = (p.hasBeat ? window * (-.22 * bump(r, start + 14, 14) + 1.35 * bump(r, p.xPeak, 33) - .27 * bump(r, end - 11, 15)
      - p.xNotch * bump(r, p.xPeak + 2, 7) + p.xLate * bump(r, end - 22, 18)) : 0) + pWave * .6;
    const y = (p.hasBeat ? window * (yAxis * bump(r, p.xPeak - 6, 40) - .18 * bump(r, end - 14, 19)) : 0) + pWave;
    const z = p.hasBeat ? window * (-(p.freeWall ? .9 : .62) * bump(r, start + 35, 28) + p.terminal * bump(r, p.zPeak, 25)
      + p.notch * bump(r, start + p.width * p.notchAt, 8)) : 0;
    // Stimulus itself is a common vector projected exactly as QRS is.
    const stimulus = stim ? .08 * state.output * bump(time, 50, 1.3) : 0;
    for (const [key, v] of Object.entries(PROJECTIONS)) leads[key].push(v[0] * (x + stimulus) + v[1] * y + v[2] * stimulus + v[2] * z);
    const local = p.hasBeat ? -.9 * bump(r, p.onset + 17, 4) + .35 * bump(r, p.onset + 22, 5) : 0;
    const injury = time >= 50 ? (coi / COI_MAX) * 1.6 * Math.exp(-(time - 50) / 135) : 0;
    unfiltered.push(local + injury + .04 * Math.sin(time * Math.PI / 170) + (stim ? .14 * state.output * bump(time, 50, 1.3) : 0));
  }
  return { leads, unfiltered };
}
/** Share of the paced QRS taken by intrinsic conduction: sinus with intact AV node, pacing rate not clearly above it. */
export function fusionOf(s) {
  const cp = caseParams(s);
  if (!s.pacing || s.s2 != null || !['sinus', 'rbbb', 'lbbb'].includes(cp.rhythm)) return 0;
  return clamp((cp.intrinsicRate + 15 - s.rate) / 20, 0, 1);
}
export function simulate(options = {}) {
  const state = normalize(options), t = tissue(state), capture = captureAt(state, t), p = parameters(state, capture);
  const times = [...TIMES];
  // Current of injury in mV (synthetic scale): rises as the helix engages, peaks near the LV side, lost on perforation.
  const coi = state.depth >= 1 ? 0 : Math.round(COI_MAX * Math.max(0, 1 - Math.abs(state.depth - .85) / .85) * t.contact * 10) / 10;
  const main = render(state, p, capture, coi, state.pacing);
  // Fusion: the intrinsic QRS, starting just after the stimulus, blends into the paced one.
  const fusion = p.hasBeat && capture.type !== 'off' ? fusionOf(state) : 0;
  let leads = main.leads;
  if (fusion > 0) {
    const off = { type: 'off', muscle: false, conduction: false, anodal: false };
    const intrinsic = render(state, { ...parameters(state, off), reference: 62, pWave: false }, off, coi, false).leads;
    leads = Object.fromEntries(Object.entries(main.leads).map(([key, values]) => [key, values.map((v, i) => (1 - fusion) * v + fusion * intrinsic[key][i])]));
  }
  const unfiltered = main.unfiltered;
  // Unipolar impedance rises as the helix enters the myocardium; perforation drops it by more than 200 ohm.
  const impedance = state.depth >= 1 ? 260 : Math.round(540 + 290 * state.depth + 45 * (1 - t.contact));
  const filtered = causalBandpass(unfiltered);
  return { state, capture, times, leads, egm: { unfiltered, filtered },
    metrics: { ...measure(leads, p, state), latency: latencyOf(filtered, p, state), impedance, coi, fusion: Math.round(fusion * 100) / 100, muscleThreshold: t.muscleThreshold, conductionThreshold: t.conductionThreshold },
    truth: { muscleERP: t.muscleERP, conductionERP: t.conductionERP, contact: t.contact, synthetic: true },
    explanation: { synthetic: true, warning: state.depth >= 1 ? 'perforation' : null, note: 'Illustrative activation templates and parameters; no validated physiological, anatomical, device or diagnostic model. S2 traces show the test beat only; S1 train is implicit.' } };
}
export function thresholdSweep(options = {}) {
  const state = normalize(options);
  return Array.from({ length: 33 }, (_, i) => { const output = 8 - i * .25; const r = simulate({ ...state, output, pacing: true, s2: null }); return { output, capture: r.capture, metrics: r.metrics, signature: waveformSignature(r) }; });
}
export function programmedSweep(options = {}) {
  const state = normalize(options);
  return Array.from({ length: 28 }, (_, i) => { const s2 = 450 - i * 10; const r = simulate({ ...state, s2, pacing: true }); return { s2, capture: r.capture, metrics: r.metrics, signature: waveformSignature(r) }; });
}
function waveformSignature(r) {
  // Compare sampled morphology after stimulus; output-dependent artifact excluded.
  return ['I', 'V1', 'V6'].flatMap(key => r.leads[key].slice(55, 251));
}
export function evidence(rows = []) {
  const transitions = [];
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i];
    if (!Array.isArray(a.signature) || !Array.isArray(b.signature) || a.signature.length !== b.signature.length) continue;
    const rmsDifference = Math.sqrt(a.signature.reduce((sum, x, j) => sum + (x - b.signature[j]) ** 2, 0) / a.signature.length);
    if (rmsDifference > .015) transitions.push({ from: a.output ?? a.s2, to: b.output ?? b.s2, rmsDifference, lossOfSignal: b.metrics?.qrsDuration == null });
  }
  return { transitions, hasTransition: transitions.some(t => !t.lossOfSignal), diagnostic: false,
    message: transitions.some(t => !t.lossOfSignal) ? 'Observed synthetic waveform transition; compare tracings and independent evidence.' : 'No distinct waveform transition observed; this alone does not establish or exclude conduction-system capture.' };
}

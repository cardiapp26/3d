/** Original educational signal model. All parameters and waveforms are synthetic.
 * Capture fields are simulation ground truth, never a patient diagnosis.
 * No device, proprietary simulator, or validated clinical classifier is reproduced.
 */
export const CASES = Object.freeze([
  { id: 'baseline', name: { tr: 'Ayrı eşikler', en: 'Separate thresholds' }, description: { tr: 'Aynı konumda output azaltılır; iki dokunun ayrı eşikleri karşılaştırılır.', en: 'Reduce output at one position and compare independent tissue thresholds.' } },
  { id: 'slow', name: { tr: 'Yavaş ileti ve refrakterlik', en: 'Slow conduction and refractoriness' }, description: { tr: 'İleti gecikmesi ve farklı ERP değerleri programlı uyarımla karşılaştırılır.', en: 'Compare conduction delay and different ERPs using programmed stimulation.' } },
  { id: 'equal', name: { tr: 'Çakışan eşikler', en: 'Coincident thresholds' }, description: { tr: 'Output testi belirgin bir morfoloji geçişi göstermeyebilir.', en: 'An output test may not reveal a distinct morphology transition.' } },
  { id: 'scar', name: { tr: 'Heterojen septum', en: 'Heterogeneous septum' }, description: { tr: 'Yüksek miyokard eşiği ve erişilemeyen ileti dokusu birlikte modellenir.', en: 'A raised myocardial threshold coexists with unavailable conduction tissue.' } },
]);
// level: site along the His-apex line (0 His, 1 apex); offset: away from the septum (-1 anterior free wall .. +1 posterior).
// Both shape the paced morphology (limb-lead axis, V1 notch, free-wall width); `entry` keeps the conduction access.
export const DEFAULTS = Object.freeze({ caseId: 'baseline', entry: .5, angle: 8, depth: .88, output: 2, pulseWidth: .4, polarity: 'uni', rate: 70, pacing: true, s2: null, level: .35, offset: 0 });
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
function number(value, fallback, lo, hi) {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isFinite(n) ? clamp(n, lo, hi) : fallback;
}
export function normalize(options = {}) {
  const o = options && typeof options === 'object' ? options : {};
  const s2Value = o.s2 === undefined ? o.couplingMs : o.s2;
  return {
    caseId: CASES.some(c => c.id === o.caseId) ? o.caseId : DEFAULTS.caseId,
    entry: number(o.entry, DEFAULTS.entry, 0, 1), angle: number(o.angle, DEFAULTS.angle, 0, 90),
    depth: number(o.depth, DEFAULTS.depth, 0, 1.2), output: number(o.output, DEFAULTS.output, 0, 8),
    pulseWidth: number(o.pulseWidth, DEFAULTS.pulseWidth, .2, 1),
    polarity: o.polarity === 'bi' ? 'bi' : 'uni', rate: number(o.rate, DEFAULTS.rate, 40, 140),
    pacing: typeof o.pacing === 'boolean' ? o.pacing : DEFAULTS.pacing,
    s2: s2Value == null || s2Value === '' ? null : number(s2Value, null, 180, 450),
    level: number(o.level, DEFAULTS.level, 0, 1), offset: number(o.offset, DEFAULTS.offset, -1, 1),
  };
}
function tissue(s) {
  const contact = Math.max(.12, Math.cos(s.angle * Math.PI / 180)) * (1 - .6 * Math.abs(s.entry - .5));
  const conductionAccess = s.depth >= .82 && s.depth < .98 && Math.abs(s.entry - .5) <= .21 && s.angle <= 32 && s.caseId !== 'scar';
  const scarMultiplier = s.caseId === 'scar' ? 2.4 : 1;
  const muscleThreshold = .65 * (1 + .18 / s.pulseWidth) * scarMultiplier / contact;
  const conductionThreshold = conductionAccess
    ? (s.caseId === 'equal' ? muscleThreshold : .32 * (1 + .22 / s.pulseWidth) * (s.caseId === 'slow' ? 1.15 : 1) / contact) : null;
  return { contact, muscleThreshold, conductionThreshold, muscleERP: s.caseId === 'scar' ? 265 : 235, conductionERP: s.caseId === 'slow' ? 340 : 285 };
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
function parameters(s, c) {
  const hasBeat = c.type === 'off' || c.muscle || c.conduction || c.anodal;
  const slow = s.caseId === 'slow' ? 24 : 0;
  let onset = 8, width = 145, xPeak = 88, zPeak = 112;
  if (c.type === 'off') { onset = 0; width = 105 + slow; xPeak = 48 + slow; zPeak = 32 + slow; }
  else if (c.conduction) { onset = c.muscle ? 5 : 22; width = (c.muscle ? 111 : 96) + slow; xPeak = 58 + slow; zPeak = 110 + slow; }   // early V6 R, late V1 r': interpeak beyond 44 ms
  else if (s.depth >= .78) { width = 128 + slow; xPeak = 83 + slow; zPeak = 106 + slow; }
  else if (s.depth >= .35) { width = 144 + slow; xPeak = 95 + slow; zPeak = 116 + slow; }
  // Off the septum (RV free wall): a wide, late beat without the septal notch.
  const freeWall = c.type === 'rv' && Math.abs(s.offset) > .5;
  if (freeWall) { width += 40; xPeak += 22; zPeak += 18; }
  if (s.caseId === 'scar') { width += 28; xPeak += 15; zPeak += 12; }
  if (c.anodal) { width -= 9; xPeak -= 7; zPeak -= 17; }
  // Limb-lead axis by level: basal septum inferior (II, III positive), apical superior (II, III negative).
  const axis = 1 - 2 * clamp((s.level - .1) / .6, 0, 1);
  // V1: the septal pace map has a mid-QRS notch (a W) that moves to the end of the QRS as the tip
  // goes deeper, where it becomes the terminal r'. No notch on the free wall or without a paced beat.
  const notch = c.type === 'off' || freeWall ? 0 : .3;
  const notchAt = .38 + .5 * clamp(s.depth / .8, 0, 1);
  // Terminal V1 vector: negative (QS) from the RV septum, turning positive (r') as the tip nears the LV side.
  const deepShare = c.conduction || c.type === 'off' ? 1 : c.type === 'rv' ? 0 : clamp((s.depth - .5) / .3, 0, 1);
  const terminal = -.5 + 1.35 * deepShare;
  return { hasBeat, reference: c.type === 'off' ? 80 : 50, onset, width, xPeak, zPeak, axis, notch, notchAt, freeWall, terminal };
}
function causalBandpass(values, hp = 30, lp = 250) {
  const highAlpha = 1 / (1 + 2 * Math.PI * hp / 1000);
  const lowAlpha = 1 - Math.exp(-2 * Math.PI * lp / 1000);
  let previous = values[0], high = 0, low = 0;
  return values.map(value => { high = highAlpha * (high + value - previous); previous = value; low += lowAlpha * (high - low); return low; });
}
function positivePeak(values, start, end) {
  let index = null, amplitude = 0;
  for (let i = Math.max(0, start); i <= Math.min(values.length - 1, end); i++) if (values[i] > amplitude) { amplitude = values[i]; index = i; }
  return index;
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
export function simulate(options = {}) {
  const state = normalize(options), t = tissue(state), capture = captureAt(state, t), p = parameters(state, capture);
  const times = Array.from({ length: 501 }, (_, i) => i);
  const leads = Object.fromEntries(Object.keys(PROJECTIONS).map(key => [key, []]));
  const unfiltered = [];
  const coi = state.depth >= 1 ? 0 : Math.max(0, 1 - Math.abs(state.depth - .85) / .85) * t.contact * 1.6;
  const yAxis = capture.type === 'off' ? .62 : 1.5 * p.axis;   // intrinsic beat keeps its own axis
  for (const time of times) {
    const r = time - p.reference;
    const start = p.onset, end = p.onset + p.width;
    const window = r > start && r < end ? Math.sin(Math.PI * (r - start) / p.width) ** .4 : 0;
    const x = p.hasBeat ? window * (-.22 * bump(r, start + 14, 14) + 1.35 * bump(r, p.xPeak, 33) - .27 * bump(r, end - 11, 15)) : 0;
    const y = p.hasBeat ? window * (yAxis * bump(r, p.xPeak - 6, 40) - .18 * bump(r, end - 14, 19)) : 0;
    const z = p.hasBeat ? window * (-(p.freeWall ? .9 : .62) * bump(r, start + 35, 28) + p.terminal * bump(r, p.zPeak, 25)
      + p.notch * bump(r, start + p.width * p.notchAt, 8)) : 0;
    // Stimulus itself is a common vector projected exactly as QRS is.
    const stimulus = state.pacing ? .08 * state.output * bump(time, 50, 1.3) : 0;
    for (const [key, v] of Object.entries(PROJECTIONS)) leads[key].push(v[0] * (x + stimulus) + v[1] * y + v[2] * stimulus + v[2] * z);
    const local = p.hasBeat ? -.9 * bump(r, p.onset + 17, 4) + .35 * bump(r, p.onset + 22, 5) : 0;
    const injury = time >= 50 ? coi * Math.exp(-(time - 50) / 135) : 0;
    unfiltered.push(local + injury + .04 * Math.sin(time * Math.PI / 170) + (state.pacing ? .14 * state.output * bump(time, 50, 1.3) : 0));
  }
  const impedance = state.depth >= 1 ? 260 : Math.round(690 - 145 * state.depth + 45 * (1 - t.contact));
  return { state, capture, times, leads, egm: { unfiltered, filtered: causalBandpass(unfiltered) },
    metrics: { ...measure(leads, p, state), impedance, coi, muscleThreshold: t.muscleThreshold, conductionThreshold: t.conductionThreshold },
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

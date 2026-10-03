import { sampleLeads, polarity, transitionLead } from './ecg12.js';
import { ev, mono, merge } from './ep-beats.js';
import { ref, cal } from './ep-cases.js';

/*
 * PAC / PVC source-region exercise (research/EASY_ECG_EP_OZGUN_GELISTIRME_RAPORU.md,
 * phase C; features and sources: research/EP_FAZ_BCD_KAYNAK_STORYBOARD.md).
 * Each example is a synthetic heart-vector (ecg12.js) built from scratch for
 * one anatomical region. The ECG features (bundle-branch pattern of V1, axis,
 * lead I and aVL, precordial transition) are read back from the sampled
 * leads, matched against the region patterns, and returned as likely regions
 * with a confidence level and its reason: never a "definite target" and never
 * an accuracy percentage. Atrial examples also carry a catheter activation
 * recording that shows the sampling limit of the recorded bipoles. Pure and
 * deterministic.
 */

export const ORIGIN_KINDS = Object.freeze(['ventricular', 'atrial']);
export const REGIONS = Object.freeze({
  ventricular: Object.freeze(['rvot', 'lvot-cusp', 'lv-summit', 'mitral-superior', 'ta-free-wall', 'lv-inferior']),
  atrial: Object.freeze(['crista-high', 'cs-ostium', 'ta-superior', 'rspv', 'laa'])
});

const L = (dir, t, sigma, amp) => Object.freeze({ dir: Object.freeze(dir), t, sigma, amp });

/**
 * Examples: region, clinical context and heart-vector lobes (QRS for PVCs, P
 * for atrial foci). Designed teaching vectors, not measured patterns.
 * Atrial `catheter`: local A on each recorded bipole relative to P onset (ms).
 */
export const ORIGIN_EXAMPLES = Object.freeze([
  { id: 'pvc-rvot', kind: 'ventricular', region: 'rvot', context: 'normal', lobes: [L([0.16, 0.35, 0.68], 40, 16, 0.9), L([0.22, 0.84, -0.56], 95, 28, 1.4)] },
  // RVOT with a V3 transition: the outflow tract pattern that cannot tell right from left (source C2).
  { id: 'pvc-rvot-v3', kind: 'ventricular', region: 'rvot', context: 'normal', lobes: [L([-0.21, 0.36, 0.33], 40, 16, 0.58), L([0.12, 0.7, 0.04], 95, 28, 1.4)] },
  { id: 'pvc-lvot-cusp', kind: 'ventricular', region: 'lvot-cusp', context: 'normal', lobes: [L([-0.22, 0.69, 0.81], 40, 16, 0.64), L([0.04, 0.71, 0.04], 95, 28, 1.4)] },
  // LV summit (epicardial, under the LAD-LCx bifurcation): inferior axis, lead I negative, a deeper
  // negative aVL than aVR, RBBB-like V1 (Yamada 2010, C10; anatomy Kuniewicz 2021, C11).
  { id: 'pvc-lv-summit', kind: 'ventricular', region: 'lv-summit', context: 'normal', lobes: [L([-0.3, 0.5, 0.55], 40, 16, 0.6), L([-0.3, 0.85, 0.3], 95, 28, 1.4)] },
  { id: 'pvc-mitral-superior', kind: 'ventricular', region: 'mitral-superior', context: 'normal', lobes: [L([-0.3, 0.3, 0.5], 40, 16, 0.4), L([-0.3, 0.7, 0.65], 95, 28, 1.4)] },
  { id: 'pvc-ta-free-wall', kind: 'ventricular', region: 'ta-free-wall', context: 'normal', lobes: [L([0.3, 0, 0.3], 40, 16, 0.35), L([0.8, -0.35, -0.45], 95, 28, 1.4)] },
  // Structural heart disease: the QRS is wider and notched; it points to the exit at the scar border, not to the isthmus.
  { id: 'vt-lv-inferior-scar', kind: 'ventricular', region: 'lv-inferior', context: 'inferiorScar', lobes: [L([-0.2, -0.3, 0.4], 45, 20, 0.4), L([-0.2, -0.8, 0.55], 115, 36, 1.3), L([0.3, -0.2, -0.2], 185, 14, 0.35)] },
  { id: 'pac-crista-high', kind: 'atrial', region: 'crista-high', context: 'normal', lobes: [L([0.3, 0.6, 0.7], 35, 18, 0.12), L([0.6, 0.6, 0.1], 72, 18, 0.12)],
    catheter: { hra: -15, 'his-d': 35, 'cs-910': 45, 'cs-56': 60, 'cs-12': 75 } },
  { id: 'pac-cs-ostium', kind: 'atrial', region: 'cs-ostium', context: 'normal', lobes: [L([0.4, -0.8, 0.3], 50, 22, 0.14)],
    catheter: { 'cs-910': -10, 'his-d': 10, 'cs-56': 20, 'cs-12': 35, hra: 45 } },
  { id: 'pac-ta-superior', kind: 'atrial', region: 'ta-superior', context: 'normal', lobes: [L([0.5, 0.25, -0.75], 50, 22, 0.14)],
    catheter: { hra: 15, 'his-d': 30, 'cs-910': 45, 'cs-56': 60, 'cs-12': 75 } },
  { id: 'pac-rspv', kind: 'atrial', region: 'rspv', context: 'normal', lobes: [L([0.15, 0.75, 0.6], 50, 22, 0.14)],
    catheter: { 'his-d': 25, 'cs-910': 30, hra: 35, 'cs-56': 40, 'cs-12': 55 } },
  { id: 'pac-laa', kind: 'atrial', region: 'laa', context: 'normal', lobes: [L([-0.6, 0.6, 0.45], 50, 22, 0.14)],
    catheter: { 'cs-12': 25, 'cs-56': 35, 'cs-910': 50, 'his-d': 55, hra: 70 } }
].map((e) => Object.freeze({ ...e, lobes: Object.freeze(e.lobes), catheter: e.catheter ? Object.freeze(e.catheter) : null })));

const WINDOW = Object.freeze({ ventricular: { from: 0, to: 230 }, atrial: { from: 0, to: 130 } });
const FLAT = Object.freeze({ ventricular: 0.05, atrial: 0.01 });

/** Sampled 12 leads of an example. */
export function originEcg(example) {
  return sampleLeads(example.lobes, WINDOW[example.kind]);
}

/** ECG features read back from the sampled leads. */
export function originFeatures(example) {
  const s = originEcg(example);
  const p = (lead) => polarity(s.leads[lead], FLAT[example.kind]);
  const inferior = ['II', 'III', 'aVF'].map(p);
  const axis = inferior.every((v) => v === '+') ? 'inferior' : p('aVF') === '-' ? 'superior' : 'intermediate';
  const v1 = p('V1');
  return {
    kind: example.kind,
    v1,
    bundle: example.kind === 'ventricular' ? (v1 === '+' ? 'RBBB' : v1 === '-' ? 'LBBB' : 'indeterminate') : null,
    axis,
    inferior,
    leadI: p('I'),
    aVL: p('aVL'),
    aVR: p('aVR'),
    // Depth of the negative deflection in aVL against aVR (the source's Q-wave ratio, read qualitatively).
    avlAvr: depth(s.leads.aVL) / Math.max(1e-6, depth(s.leads.aVR)),
    transition: example.kind === 'ventricular' ? transitionLead(s, FLAT.ventricular) : null
  };
}

const depth = (signal) => Math.max(0, -Math.min(...signal));
const AT_OR_AFTER = (lead, from) => lead != null && Number(lead.slice(1)) >= Number(from.slice(1));
const AT_OR_BEFORE = (lead, to) => lead != null && Number(lead.slice(1)) <= Number(to.slice(1));

/**
 * Region patterns as predicates on the features (sources C1-C8). A region is
 * likely when all its predicates hold; overlapping patterns are expected.
 */
export const REGION_PATTERNS = Object.freeze({
  rvot: [['bundle', (f) => f.bundle === 'LBBB'], ['axis', (f) => f.axis === 'inferior'], ['transition', (f) => f.transition == null || AT_OR_AFTER(f.transition, 'V3')]],
  'lvot-cusp': [['axis', (f) => f.axis === 'inferior'], ['transition', (f) => AT_OR_BEFORE(f.transition, 'V3')], ['leadI', (f) => f.leadI === '-' || f.leadI === '±' || f.leadI === '0'], ['bundle', (f) => f.bundle !== 'RBBB']],
  'lv-summit': [['bundle', (f) => f.bundle === 'RBBB'], ['axis', (f) => f.axis === 'inferior'], ['leadI', (f) => f.leadI === '-'], ['avlAvr', (f) => f.avlAvr > 1.1]],
  'mitral-superior': [['bundle', (f) => f.bundle === 'RBBB'], ['axis', (f) => f.axis === 'inferior']],
  'ta-free-wall': [['bundle', (f) => f.bundle === 'LBBB'], ['axis', (f) => f.axis !== 'inferior'], ['leadI', (f) => f.leadI === '+'], ['aVL', (f) => f.aVL === '+']],
  'lv-inferior': [['bundle', (f) => f.bundle === 'RBBB'], ['axis', (f) => f.axis === 'superior']],
  'crista-high': [['inferior', (f) => f.axis === 'inferior'], ['leadI', (f) => f.leadI === '+'], ['aVR', (f) => f.aVR === '-'], ['v1', (f) => f.v1 === '±' || f.v1 === '+']],
  'cs-ostium': [['inferior', (f) => f.axis === 'superior'], ['aVL', (f) => f.aVL === '+'], ['v1', (f) => f.v1 !== '-']],
  'ta-superior': [['v1', (f) => f.v1 === '-'], ['inferior', (f) => f.axis !== 'superior']],
  rspv: [['v1', (f) => f.v1 === '+'], ['inferior', (f) => f.axis === 'inferior'], ['leadI', (f) => f.leadI !== '-']],
  laa: [['leadI', (f) => f.leadI === '-'], ['aVL', (f) => f.aVL === '-'], ['inferior', (f) => f.axis === 'inferior'], ['v1', (f) => f.v1 === '+']]
});

/**
 * Likely regions for the features: every region whose pattern fully holds
 * (or, if none does, the best partial matches). Confidence is 'moderate' for
 * a single full match and 'low' otherwise; a structural-disease context adds
 * that the pattern locates an exit, not the critical isthmus.
 */
export function likelyRegions(example) {
  const f = originFeatures(example);
  const scored = REGIONS[example.kind].map((region) => {
    const checks = REGION_PATTERNS[region].map(([key, test]) => [key, test(f)]);
    return { region, met: checks.filter(([, ok]) => ok).map(([k]) => k), missed: checks.filter(([, ok]) => !ok).map(([k]) => k), score: checks.filter(([, ok]) => ok).length / checks.length };
  });
  const full = scored.filter((s) => s.score === 1);
  const best = Math.max(...scored.map((s) => s.score));
  const likely = full.length ? full : scored.filter((s) => s.score === best);
  const confidence = full.length === 1 ? 'moderate' : 'low';
  const reasons = [full.length === 1 ? 'single' : full.length > 1 ? 'overlap' : 'partial'];
  if (example.context === 'inferiorScar') reasons.push('scarExit');
  return { features: f, likely: likely.map((s) => s.region), scored, confidence, reasons };
}

/**
 * Grade a chosen region: 'match' (the source region), 'compatible' (not the
 * source, but the ECG pattern cannot separate it) or 'mismatch'.
 */
export function gradeOrigin(example, region) {
  if (region === example.region) return 'match';
  return likelyRegions(example).likely.includes(region) ? 'compatible' : 'mismatch';
}

/**
 * Catheter activation of an atrial example on the recorded bipoles (lab
 * 'origin'): surface P onset at t0, local A per channel. The earliest
 * recorded A relative to P onset shows whether a catheter sits near the
 * focus (A before P onset) or the focus is unsampled (A after P onset).
 */
export function originRecording(example) {
  if (!example?.catheter) return null;
  const t0 = 120;
  // Surface P on the strip from the same dipole as the 12-lead: each lead's positive and negative peaks.
  const s = originEcg(example);
  const peak = Math.max(...['II', 'V1'].flatMap((l) => s.leads[l].map(Math.abs)));
  const surface = (lead) => {
    const sig = s.leads[lead];
    const hi = sig.indexOf(Math.max(...sig)), lo = sig.indexOf(Math.min(...sig));
    return [[hi, sig[hi]], [lo, sig[lo]]].filter(([, v]) => Math.abs(v) >= 0.2 * peak)
      .map(([i, v]) => mono('P', t0 + s.t[i], (0.22 * v) / peak, 14));
  };
  const events = merge(
    { 'ecg-ii': surface('II'), 'ecg-v1': surface('V1') },
    ...Object.entries(example.catheter).map(([ch, dt]) => ({ [ch]: [ev('A', t0 + dt, ch === 'his-d' ? 0.35 : 0.8)] })),
    { 'ecg-ii': [ev('Pon', t0, 0, 1)] }
  );
  const [first] = Object.entries(example.catheter).reduce((best, e) => (e[1] < best[1] ? e : best));
  return Object.freeze({
    id: `origin:${example.id}`, caseId: null, section: 'diagnosis', lab: 'origin', maneuver: null,
    channels: ['ecg-ii', 'ecg-v1', 'hra', 'his-d', 'cs-910', 'cs-56', 'cs-12'],
    markers: [{ t: t0, label: { tr: 'P başlangıcı', en: 'P onset' } }],
    calipers: [cal('P-A (en erken)', ref('ecg-ii', 'Pon', 0), ref(first, 'A', 0), first)],
    windowMs: t0 + Math.max(...Object.values(example.catheter)) + 140, events, earliest: first,
    earliestLead: example.catheter[first], result: null, reason: null, simulated: true, teachingNumbers: {}
  });
}

/** Deterministic example order within a kind (the next example after `id`). */
export function nextExample(kind, id = null) {
  const list = ORIGIN_EXAMPLES.filter((e) => e.kind === kind);
  const i = list.findIndex((e) => e.id === id);
  return list[(i + 1) % list.length];
}

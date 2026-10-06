// WPW localization model (wpw-loc-panel.js): the Arruda surface ECG algorithm
// (J Cardiovasc Electrophysiol 1998;9:2-12, as reproduced in Josephson 2025,
// figures 8.46 and 11.12): delta polarity in the first 20 ms of I, V1, II,
// aVF and the R/S ratio of III,
// the coronary sinus ventricular sequence before and after ablation, and
// the accessory pathway refractory period cut-off. Teaching values only.

export const LEADS = Object.freeze(['d1', 'v1', 'd2', 'avf', 'd3']);

/** Options of every lead; the first word of an option is its polarity. */
export const LEAD_OPTIONS = Object.freeze({
  d1: ['negIso', 'pos'],
  v1: ['rGtS', 'sGtR', 'isoNeg'],
  d2: ['pos', 'iso', 'neg'],
  avf: ['pos', 'iso', 'neg'],
  d3: ['rGtS', 'rLtS']
});

// The ten annular sites of the algorithm.
export const SITES = Object.freeze([
  'leftLateral', 'leftPosterior', 'posteroseptalEpi', 'posteroseptalTricuspid', 'posteroseptalMitral',
  'midseptal', 'anteroseptal', 'rightAnterior', 'rightLateral', 'rightPosterior'
]);

/**
 * Walks the algorithm with the leads chosen so far.
 * Returns { site, next, path, stalled }: `site` once decided; otherwise `next`
 * names the lead to read next. Every combination of the five leads reaches a
 * site, so `stalled` stays false (kept for the panel's contract).
 * `path` lists the decisions taken: { lead, option, means }.
 */
export function localize(sel = {}) {
  const path = [];
  const step = (lead, means) => path.push({ lead, option: sel[lead], means });
  const done = (site) => ({ site, next: null, path, stalled: false });
  const ask = (lead) => ({ site: null, next: lead, path, stalled: false });
  // Step 1: I negative or isoelectric, or V1 R >= S: left free wall; aVF splits anterior and posterior.
  const leftFreeWall = () => {
    if (!sel.avf) return ask('avf');
    step('avf', sel.avf === 'pos' ? 'leftAnterior' : 'leftPosterior');
    return done(sel.avf === 'pos' ? 'leftLateral' : 'leftPosterior');
  };
  if (!sel.d1) return ask('d1');
  if (sel.d1 === 'negIso') { step('d1', 'leftFreeWall'); return leftFreeWall(); }
  step('d1', 'notLeftByI');
  if (!sel.v1) return ask('v1');
  if (sel.v1 === 'rGtS') { step('v1', 'leftFreeWallV1'); return leftFreeWall(); }
  step('v1', sel.v1 === 'isoNeg' ? 'septalCandidate' : 'rightCandidate');
  // Step 2: negative delta in II: subepicardial posteroseptal (coronary sinus, middle cardiac vein).
  if (!sel.d2) return ask('d2');
  if (sel.d2 === 'neg') { step('d2', 'epicardial'); return done('posteroseptalEpi'); }
  step('d2', 'notEpicardial');
  if (!sel.avf) return ask('avf');
  if (sel.v1 === 'isoNeg') {
    // Step 3: septal. aVF negative: tricuspid side; isoelectric: mitral side; positive: III decides.
    if (sel.avf === 'neg') { step('avf', 'posteroseptalTricuspid'); return done('posteroseptalTricuspid'); }
    if (sel.avf === 'iso') { step('avf', 'posteroseptalMitral'); return done('posteroseptalMitral'); }
    step('avf', 'superiorSeptum');
    if (!sel.d3) return ask('d3');
    step('d3', sel.d3 === 'rGtS' ? 'anteroseptal' : 'midseptal');
    return done(sel.d3 === 'rGtS' ? 'anteroseptal' : 'midseptal');
  }
  // Step 4: right free wall (V1 positive, R < S): aVF positive anterior, isoelectric lateral, negative posterior.
  step('avf', sel.avf === 'pos' ? 'rightAnterior' : sel.avf === 'iso' ? 'rightLateral' : 'rightPosterior');
  return done(sel.avf === 'pos' ? 'rightAnterior' : sel.avf === 'iso' ? 'rightLateral' : 'rightPosterior');
}

/** Channels of the coronary sinus, proximal (ostium) to distal (lateral wall). */
export const CS_CHANNELS = Object.freeze(['cs910', 'cs78', 'cs56', 'cs34', 'cs12']);
export const PHASES = Object.freeze(['normal', 'before', 'after']);
const SPAN = 40;   // teaching value: four sampled steps of 10 ms each

/**
 * Ventricular activation on the coronary sinus channels in sinus rhythm.
 * normal / after ablation: septum first, so proximal first; left lateral
 * pathway before ablation: the pre-excited wall first, so distal first.
 * Returns { onsets: { channel: ms }, earliest, order }.
 */
export function csSequence(phase = 'before', site = 'leftLateral') {
  // Illustrative sampling profiles, not measured timings or nine diagnostic rules.
  const firstIndex = phase !== 'before' ? 0 : site === 'leftLateral' ? 4 : site === 'leftPosterior' ? 2 : 0;
  const onsets = {};
  CS_CHANNELS.forEach((id, i) => { onsets[id] = Math.abs(i - firstIndex) * SPAN / (CS_CHANNELS.length - 1); });
  const order = [...CS_CHANNELS].sort((a, b) => onsets[a] - onsets[b]);
  return { onsets, earliest: order[0], order };
}

/** Which wall a site belongs to: left free wall, septal, or right free wall. */
export function siteGroup(site) {
  if (site === 'leftLateral' || site === 'leftPosterior') return 'left';
  if (site === 'rightAnterior' || site === 'rightLateral' || site === 'rightPosterior') return 'right';
  if (site === 'anteroseptal' || site === 'midseptal') return 'superiorSeptal';
  return 'posteroseptal';
}

// Delta polarity in lead I and aVL (Josephson 2025, ch. 8): negative in both over a
// left lateral pathway; I isoelectric and aVL isoelectric or slightly positive over a
// left posterior one; positive elsewhere.
const SURFACE_POLARITY = Object.freeze({
  leftLateral: { d1: 'neg', avl: 'neg' },
  leftPosterior: { d1: 'iso', avl: 'iso' }
});
// Pathways next to the His bundle: the His catheter records the early V too.
const NEAR_HIS = new Set(['anteroseptal', 'midseptal']);

/**
 * Surface and intracardiac findings before and after ablation of `site`
 * ('normal': no pathway at all).
 * Every pathway: delta and short PR before, gone after. Only the lecture
 * patient (left lateral pathway) also carries a left bundle branch block
 * that the pre-excitation hid; with other sites the QRS is narrow after.
 */
export function ablationFindings(phase = 'before', site = 'leftLateral') {
  const before = phase === 'before';
  // 'normal' is a heart without a pathway: no lecture patient, no masked block.
  const lbbbPresent = phase !== 'normal' && site === 'leftLateral';
  const tl = epTimeline(phase, site);
  return {
    delta: before, shortPr: before, lbbbVisible: phase === 'after' && lbbbPresent, lbbbPresent,
    csEarliest: csSequence(phase, site).earliest, group: siteGroup(site),
    pr: tl.pr, hv: tl.hv, ablLead: tl.ablLead
  };
}

// Teaching timings (ms from the onset of atrial activation), not measurements.
const T = Object.freeze({
  hisA: 35, his: 100, deltaOnset: 100, qrsAfter: 150, narrowQrs: 80, preexQrs: 120, lbbbQrs: 140,
  ablLeadBefore: 25, ablVAfter: 25, csA: 40, csAStep: 8, csVBefore: 5, csVAfter: 15
});
// Atrial timing at the ablation catheter: near the sinus node early, far on the left late.
const ABL_A = Object.freeze({ left: 65, posteroseptal: 50, superiorSeptal: 40, right: 40 });

/**
 * Channel events of a sinus beat for the laboratory monitor: surface D1 and
 * aVL, the His bundle electrogram, the ablation catheter tip on the pathway
 * (ABL d) and the coronary sinus. Returns onsets in ms plus PR, HV and how
 * far the local V at the ablation tip leads the delta wave (ablLead).
 * Delta polarity in I / aVL follows SURFACE_POLARITY.
 */
export function epTimeline(phase = 'before', site = 'leftLateral') {
  const before = phase === 'before';
  const group = siteGroup(site);
  const lbbb = phase === 'after' && site === 'leftLateral';
  const vStart = before ? T.deltaOnset : T.qrsAfter;
  const polarity = (lead) => (before ? SURFACE_POLARITY[site]?.[lead] || 'pos' : 'pos');
  const surface = (lead) => ({ onset: vStart, width: before ? T.preexQrs : lbbb ? T.lbbbQrs : T.narrowQrs, delta: before, polarity: polarity(lead), lbbb });
  const ablA = ABL_A[group];
  const ablV = before ? vStart - T.ablLeadBefore : vStart + T.ablVAfter;
  const seq = csSequence(phase, site);
  const cs = Object.fromEntries(CS_CHANNELS.map((id, i) => [id, {
    a: T.csA + i * T.csAStep,
    v: vStart + (before ? T.csVBefore : T.csVAfter) + seq.onsets[id]
  }]));
  // Next to the His the His catheter sees the pre-excited V as early as the ablation tip.
  const hisV = before && NEAR_HIS.has(site) ? ablV + 3 : Math.max(vStart, T.his) + 10;
  return {
    d1: surface('d1'), avl: surface('avl'),
    his: { a: T.hisA, h: T.his, v: hisV },
    abl: { a: ablA, v: ablV, fused: before },
    cs, pr: vStart, hv: vStart - T.his, ablLead: before ? vStart - ablV : null
  };
}

/** Anterograde refractory period of the pathway (ms): at or below 250 ms conducts fast. */
export const ERP_LIMIT = 250;
export const ERP_RANGE = Object.freeze([150, 400]);
export function pathwayRisk(erp) {
  if (!Number.isFinite(erp)) return null;
  return erp <= ERP_LIMIT ? 'short' : 'long';
}

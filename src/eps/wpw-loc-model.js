// WPW localization model (wpw-loc-panel.js): the surface ECG algorithm of
// the Kardiyopedi WPW lecture (delta wave polarity in D1, V1, D2, aVF, D3),
// the coronary sinus ventricular sequence before and after ablation, and
// the accessory pathway refractory period cut-off. Teaching values only.

export const LEADS = Object.freeze(['d1', 'v1', 'd2', 'avf', 'd3']);

/** Options of every lead; the first word of an option is its polarity. */
export const LEAD_OPTIONS = Object.freeze({
  d1: ['negIso', 'pos'],
  v1: ['rGtS', 'sGtR', 'isoNeg'],
  d2: ['pos', 'negIso'],
  avf: ['pos', 'iso', 'neg'],
  d3: ['rGtS', 'rLtS']
});

export const SITES = Object.freeze([
  'leftLateral', 'leftPosterior', 'posteroseptal', 'septalAnnulus', 'midseptal', 'anteroseptal',
  'rightAnterior', 'rightLateral', 'rightPosterior'
]);

/**
 * Walks the algorithm with the leads chosen so far.
 * Returns { site, next, path, stalled }: `site` once decided; otherwise `next`
 * names the lead to read next; `stalled` marks a combination the lecture does
 * not classify (the walk stops with no site and no next lead).
 * `path` lists the decisions taken: { lead, option, means }.
 */
export function localize(sel = {}) {
  const path = [];
  const step = (lead, means) => path.push({ lead, option: sel[lead], means });
  const done = (site) => ({ site, next: null, path, stalled: false });
  const ask = (lead) => ({ site: null, next: lead, path, stalled: false });
  const stall = () => ({ site: null, next: null, path, stalled: true });

  if (!sel.v1) return ask('v1');
  if (sel.v1 === 'rGtS') {
    step('v1', 'leftSide');
    if (!sel.d1) return ask('d1');
    if (sel.d1 !== 'negIso') return stall();
    step('d1', 'leftVentricle');
    if (!sel.avf) return ask('avf');
    step('avf', sel.avf === 'pos' ? 'anterior' : 'posterior');
    if (sel.avf === 'pos') return done('leftLateral');
    if (sel.avf === 'neg') return done('leftPosterior');
    return stall();
  }
  if (sel.v1 === 'sGtR') {
    step('v1', 'rightFreeWall');
    if (!sel.avf) return ask('avf');
    step('avf', sel.avf === 'pos' ? 'anterior' : 'notAnterior');
    if (sel.avf === 'pos') return done('rightAnterior');
    if (!sel.d2) return ask('d2');
    step('d2', sel.d2 === 'pos' ? 'lateral' : 'posterior');
    return done(sel.d2 === 'pos' ? 'rightLateral' : 'rightPosterior');
  }
  // V1 isoelectric or negative: septal when D2 is negative too (middle cardiac vein side).
  step('v1', 'septalCandidate');
  if (!sel.d2) return ask('d2');
  if (sel.d2 !== 'negIso') return stall();
  step('d2', 'septal');
  if (!sel.avf) return ask('avf');
  step('avf', sel.avf === 'neg' ? 'posterior' : sel.avf === 'iso' ? 'annulus' : 'notPosterior');
  if (sel.avf === 'neg') return done('posteroseptal');
  if (sel.avf === 'iso') return done('septalAnnulus');
  if (!sel.d3) return ask('d3');
  step('d3', sel.d3 === 'rGtS' ? 'anterior' : 'mid');
  return done(sel.d3 === 'rGtS' ? 'anteroseptal' : 'midseptal');
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
  return 'septal';
}

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
const ABL_A = Object.freeze({ left: 65, septal: 45, right: 40 });

/**
 * Channel events of a sinus beat for the laboratory monitor: surface D1 and
 * aVL, the His bundle electrogram, the ablation catheter tip on the pathway
 * (ABL d) and the coronary sinus. Returns onsets in ms plus PR, HV and how
 * far the local V at the ablation tip leads the delta wave (ablLead).
 * Delta polarity in D1 / aVL: negative over a left free wall pathway.
 */
export function epTimeline(phase = 'before', site = 'leftLateral') {
  const before = phase === 'before';
  const group = siteGroup(site);
  const lbbb = phase === 'after' && site === 'leftLateral';
  const vStart = before ? T.deltaOnset : T.qrsAfter;
  const polarity = before && group === 'left' ? 'neg' : 'pos';
  const surface = { onset: vStart, width: before ? T.preexQrs : lbbb ? T.lbbbQrs : T.narrowQrs, delta: before, polarity, lbbb };
  const ablA = ABL_A[group];
  const ablV = before ? vStart - T.ablLeadBefore : vStart + T.ablVAfter;
  const seq = csSequence(phase, site);
  const cs = Object.fromEntries(CS_CHANNELS.map((id, i) => [id, {
    a: T.csA + i * T.csAStep,
    v: vStart + (before ? T.csVBefore : T.csVAfter) + seq.onsets[id]
  }]));
  return {
    d1: surface, avl: surface,
    his: { a: T.hisA, h: T.his, v: Math.max(vStart, T.his) + 10 },
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

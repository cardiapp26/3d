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
const SPAN = 40;   // teaching value: ms between the first and the last channel

/**
 * Ventricular activation on the coronary sinus channels in sinus rhythm.
 * normal / after ablation: septum first, so proximal first; left lateral
 * pathway before ablation: the pre-excited wall first, so distal first.
 * Returns { onsets: { channel: ms }, earliest, order }.
 */
export function csSequence(phase = 'before') {
  const distalFirst = phase === 'before';
  const onsets = {};
  CS_CHANNELS.forEach((id, i) => { onsets[id] = Math.round((distalFirst ? CS_CHANNELS.length - 1 - i : i) * SPAN / (CS_CHANNELS.length - 1)); });
  const order = [...CS_CHANNELS].sort((a, b) => onsets[a] - onsets[b]);
  return { onsets, earliest: order[0], order };
}

/**
 * Surface findings of the same patient before and after ablation: the left
 * lateral pathway pre-excites the left ventricle and hides a left bundle
 * branch block that shows once the pathway is gone.
 */
export function ablationFindings(phase = 'before') {
  const after = phase === 'after';
  return { delta: !after, shortPr: !after, lbbbVisible: after, lbbbPresent: true, csEarliest: csSequence(phase).earliest };
}

/** Anterograde refractory period of the pathway (ms): at or below 250 ms conducts fast. */
export const ERP_LIMIT = 250;
export const ERP_RANGE = Object.freeze([150, 400]);
export function pathwayRisk(erp) {
  if (!Number.isFinite(erp)) return null;
  return erp <= ERP_LIMIT ? 'short' : 'long';
}

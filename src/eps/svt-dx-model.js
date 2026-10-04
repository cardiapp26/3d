// SVT diagnostic algorithm model (svt-dx-panel.js): each finding of the
// narrow QRS tachycardia work-up removes (excludes) or supports (favors)
// mechanisms. The rules follow the Kardiyopedi SVT lecture series: the five
// "excluding and diagnosing" EP findings, the RP/PR split, the response to
// carotid massage or adenosine, and the P wave morphology. Nothing here is
// a patient-level decision aid: it teaches which finding closes which door.

export const MECHANISMS = Object.freeze(['avnrtTyp', 'avnrtAtyp', 'avrt', 'avrtSlow', 'at', 'snrt', 'flutter']);

const AVNRT = ['avnrtTyp', 'avnrtAtyp'];
const AVRT = ['avrt', 'avrtSlow'];
const ATRIAL = ['at', 'snrt', 'flutter'];
const without = (list, keep) => list.filter((id) => !keep.includes(id));

/**
 * Finding groups, in reading order. `step` is the stage of the work-up:
 * 'ecg' (surface ECG), 'drug' (carotid massage / adenosine), 'ep' (EP study).
 * Each option: { excludes, favors } mechanism ids.
 */
export const GROUPS = Object.freeze([
  { id: 'av', step: 'ecg', options: {
    oneToOne: {},
    aMoreV: { excludes: AVRT },
    vMoreA: { excludes: [...AVRT, ...ATRIAL] }
  } },
  { id: 'pseudo', step: 'ecg', options: {
    present: { favors: ['avnrtTyp'] },
    absent: {}
  } },
  { id: 'rp', step: 'ecg', options: {
    short: { excludes: ['avnrtAtyp', 'avrtSlow'] },
    long: { excludes: ['avnrtTyp', 'avrt'] }
  } },
  { id: 'va', step: 'ep', options: {
    lt70: { excludes: [...AVRT, 'avnrtAtyp'] },
    gt70: { excludes: ['avnrtTyp'] }
  } },
  { id: 'adeno', step: 'drug', options: {
    terminatesP: { excludes: ATRIAL },
    terminatesQRS: {},
    blockPersists: { excludes: AVRT }
  } },
  { id: 'waves', step: 'drug', requires: { adeno: 'blockPersists' }, options: {
    sawtooth: { excludes: without(MECHANISMS, ['flutter']) },
    isoelectric: { excludes: ['flutter', ...AVNRT] }
  } },
  { id: 'pwave', step: 'drug', options: {
    negInferior: { excludes: ['snrt'] },
    differs: { excludes: [...AVNRT, ...AVRT, 'snrt'], favors: ['at'] },
    sinusLike: { excludes: [...AVNRT, ...AVRT], favors: ['snrt'] }
  } },
  { id: 'activation', step: 'ep', options: {
    superiorInferior: { excludes: without(MECHANISMS, ['at']) }
  } },
  { id: 'aaPr', step: 'ep', options: {
    aaConstRpVariable: { excludes: without(MECHANISMS, ['at']) }
  } },
  { id: 'bbb', step: 'ep', options: {
    vaPlus30: { excludes: [...AVNRT, ...ATRIAL], favors: AVRT },
    noChange: {}
  } },
  { id: 'ending', step: 'ep', options: {
    nonPrematureA: { excludes: ATRIAL },
    qrs: {}
  } }
]);

export const GROUP_IDS = Object.freeze(GROUPS.map((g) => g.id));
export const optionIds = (groupId) => Object.keys(GROUPS.find((g) => g.id === groupId)?.options ?? {});

/** A group is open once the findings it requires are chosen. */
export function groupEnabled(group, selection = {}) {
  return Object.entries(group.requires ?? {}).every(([id, option]) => selection[id] === option);
}

/**
 * Selection: { groupId: optionId }. Returns every mechanism with its status
 * ('possible' | 'favored' | 'excluded') and the reasons ({ group, option }),
 * the list of survivors, and `conflict` when the findings exclude everything
 * (an inconsistent set of findings, or a rhythm outside this list).
 */
export function evaluate(selection = {}) {
  const status = new Map(MECHANISMS.map((id) => [id, { id, status: 'possible', excludedBy: [], favoredBy: [] }]));
  for (const group of GROUPS) {
    const option = selection[group.id];
    if (!option || !groupEnabled(group, selection)) continue;
    const effect = group.options[option];
    if (!effect) continue;
    for (const id of effect.excludes ?? []) status.get(id).excludedBy.push({ group: group.id, option });
    for (const id of effect.favors ?? []) status.get(id).favoredBy.push({ group: group.id, option });
  }
  const mechanisms = [...status.values()].map((m) => ({
    ...m,
    status: m.excludedBy.length ? 'excluded' : m.favoredBy.length ? 'favored' : 'possible'
  }));
  const remaining = mechanisms.filter((m) => m.status !== 'excluded').map((m) => m.id);
  return { mechanisms, remaining, conflict: remaining.length === 0, single: remaining.length === 1 ? remaining[0] : null };
}

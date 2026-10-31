/*
 * Teaching coach of the live EP laboratory: reads what just happened (a
 * decremental extrastimulus run, a drug given or stopped) and returns notes
 * that name the finding and the next step, as an attending would at the
 * console. Pure functions; the wording lives in ep-live-text.js (coach) and
 * the panel keeps the last notes. Teaching heuristics on the designed model,
 * not a diagnostic rule.
 */

export const COACH_MAX = 5;
const NODAL = new Set(['avn-fast', 'avn-slow']);
const SYNC_MARGIN_MS = 40;   // a drive cycle this close to the sinus cycle competes with it

/** Which drug to try next for a weak retrograde limb, or null when both are on. */
const nextDrug = (drugs = {}) => (!drugs.iso ? 'iso' : !drugs.atropine ? 'atropine' : null);

/**
 * Notes after a programmed run.
 * @param {object[]} rows drive readouts (ep-live-stim.js analyzeDrive, jumps marked)
 * @param {object} sum summarizeProgrammed(rows)
 * @param {{ drugs?: object, s1?: number, sinusCl?: number }} ctx
 * @returns {{ key: string }[]}
 */
export function notesAfterRun(rows, sum, { drugs = {}, s1 = null, sinusCl = null } = {}) {
  if (!rows?.length || !sum) return [];
  const notes = [];
  const onDrug = Object.values(drugs).some(Boolean);
  // The first drive did not capture: the train runs slower than the sinus node.
  if (!rows[0].capture && !rows[0].sustained && s1 != null && sinusCl != null && s1 >= sinusCl - SYNC_MARGIN_MS) {
    notes.push({ key: 'syncS1', s1, sinusCl });
  }
  if (sum.induced != null) {
    notes.push({ key: onDrug ? 'inducedOnDrug' : 'induced', coupling: sum.induced, label: sum.label });
    return notes;
  }
  if (sum.ventricular) {
    const first = rows.find((r) => r.capture);
    const retro = rows.find((r) => r.retro)?.retro ?? null;
    if (first && first.va == null) notes.push({ key: 'noVa', drug: nextDrug(drugs) });
    else if (retro === 'ap-left') notes.push({ key: 'vaEccentric', vaBlock: sum.vaBlock });
    else if (retro === 'ap-ps') notes.push({ key: 'vaSeptalAp', vaBlock: sum.vaBlock });
    else if (NODAL.has(retro)) notes.push({ key: 'vaNodal', vaBlock: sum.vaBlock });
    return notes;
  }
  if (!rows.some((r) => r.capture)) return notes;
  if (sum.echo != null) notes.push({ key: 'echoOnly', coupling: sum.echo, label: sum.label, drug: nextDrug(drugs) });
  else if (sum.jump != null) notes.push({ key: 'jumpOnly', coupling: sum.jump, label: sum.label, drug: nextDrug(drugs) });
  else if (sum.reason === 'erp' || sum.reason === 'limit') notes.push({ key: 'noDual' });
  return notes;
}

/** Note for a drug given (on) or stopped, with the sinus cycle it leaves. */
export const noteForDrug = (drug, on, sinusCl) => ({ key: on ? 'drugOn' : 'drugOff', drug, sinusCl });

const sameNote = (a, b) => a.key === b.key && a.drug === b.drug;

/** Coach log with the new notes first; an older copy of the same note is dropped. */
export function addNotes(log, notes, max = COACH_MAX) {
  const fresh = notes.filter(Boolean);
  if (!fresh.length) return log;
  return [...fresh, ...log.filter((old) => !fresh.some((n) => sameNote(n, old)))].slice(0, max);
}

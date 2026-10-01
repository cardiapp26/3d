import {
  AH, HV, A_TYPICAL, A_ATYPICAL, A_LEFT_LAT, A_INF_PS, A_PJRT, CH_SVT, CH_CS_FULL,
  ev, merge, svtBeat, sinusBeat, pacedBeat, paraHisBeat
} from './ep-beats.js';
import { ref, cal, measure } from './ep-cases.js';

/*
 * Interactive maneuver model (research/ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md,
 * section 15: "etkileşimli manevra akışı"). The learner picks the maneuver,
 * the pacing site and the timing or cycle length; simulate() returns a
 * recording in the catalog's shape plus capture / refractoriness /
 * entrainment feedback and a result state. It is a pure function: the same
 * choices always give the same recording (reproducible state). An invalid
 * precondition never yields a diagnostic result. All numbers are designed
 * teaching values, not measured intervals or thresholds.
 */

const A_PARAHIS_SVT = { 'his-p': 73, 'his-d': 75, 'cs-910': 93, hra: 90, 'cs-56': 107, 'cs-12': 125 };
const A_CRISTAL = { hra: 190, 'his-d': 215, 'his-p': 213, 'cs-910': 225, 'cs-56': 240, 'cs-12': 260 };
const NODAL_RETRO = { 'his-d': 140, 'his-p': 138, 'cs-910': 150, 'cs-56': 170, 'cs-12': 185, hra: 160 };

/**
 * Tachycardia models per case. pull: how far a His-refractory PVC advances
 * the next A (0 = no pathway in the circuit; negative = delay over a
 * decremental pathway). ppiTcl: PPI - TCL after RV overdrive from each site.
 * sa: stimulus to His-d A during pacing. response: after overdrive.
 * paraHis: 'extranodal' for septal pathways, 'nodal' otherwise.
 */
export const SIM_CASES = Object.freeze({
  'avnrt-typical': { tcl: 360, a: A_TYPICAL, pull: 0, ppiTcl: { 'rv-apex': 150, 'rv-base': 185 }, sa: 150, response: 'VAV', paraHis: 'nodal', channels: CH_SVT },
  'avnrt-atypical': { tcl: 380, a: A_ATYPICAL, pull: 0, ppiTcl: { 'rv-apex': 140, 'rv-base': 175 }, sa: 310, response: 'VAV', paraHis: 'nodal', channels: CH_SVT },
  'ap-left-lateral': { tcl: 360, a: A_LEFT_LAT, pull: 25, ppiTcl: { 'rv-apex': 110, 'rv-base': 105 }, sa: 190, response: 'VAV', paraHis: 'nodal', channels: CH_CS_FULL, ablV: -5 },
  'ap-inf-paraseptal': { tcl: 380, a: A_INF_PS, pull: 20, ppiTcl: { 'rv-apex': 90, 'rv-base': 70 }, sa: 130, response: 'VAV', paraHis: 'extranodal', channels: CH_CS_FULL, ablV: -3 },
  'ap-parahisian': { tcl: 330, a: A_PARAHIS_SVT, pull: 15, ppiTcl: { 'rv-apex': 80, 'rv-base': 60 }, sa: 130, response: 'VAV', paraHis: 'extranodal', channels: CH_SVT },
  // A slowly conducting (decremental) retrograde pathway can be masked by nodal conduction in para-Hisian pacing (report section 7).
  pjrt: { tcl: 420, a: A_PJRT, pull: -15, ppiTcl: { 'rv-apex': 100, 'rv-base': 85 }, sa: 260, response: 'VAV', paraHis: 'nodal', channels: CH_SVT },
  'focal-at': { tcl: 400, a: A_CRISTAL, pull: 0, ppiTcl: { 'rv-apex': 0, 'rv-base': 0 }, sa: 175, response: 'AAV', paraHis: 'nodal', channels: CH_SVT }
});

export const SIM_MANEUVERS = Object.freeze(['his-pvc', 'v-overdrive', 'para-his']);
export const SIM_SITES = Object.freeze(['rv-apex', 'rv-base']);
export const SIM_PARAHIS_OUTPUTS = Object.freeze(['standard', 'direct-a', 'pure-his']);
/** His-PVC timing: stimulus relative to the His (H) of the target beat, ms. */
export const HIS_PVC_RANGE = Object.freeze({ min: -60, max: 50, step: 5 });
/** A PVC later than this after the H meets refractory ventricle (no capture). */
const PVC_LATEST = HV - 10;

const shifted = (offsets, dt) => Object.fromEntries(Object.entries(offsets).map(([ch, t]) => [ch, t + dt]));

/** Default choices for a case (a valid starting point for each maneuver). */
export function defaultChoices(caseId, maneuver = 'his-pvc') {
  const model = SIM_CASES[caseId] || SIM_CASES['avnrt-typical'];
  return { caseId: SIM_CASES[caseId] ? caseId : 'avnrt-typical', maneuver, site: 'rv-apex', timing: 15, pcl: model.tcl - 30, output: 'standard' };
}

/** Stable key of a choice set (the reproducible state). */
export function choiceKey(c) {
  return [c.caseId, c.maneuver, c.site, c.timing, c.pcl, c.output].join('|');
}

function hisPvc(model, timing) {
  const v1 = 150, tcl = model.tcl, options = { ablV: model.ablV ?? null };
  const v3 = v1 + 2 * tcl;
  const h3 = v3 - HV;
  const s = h3 + timing;
  const base = merge(svtBeat(v1, model.a, options), svtBeat(v1 + tcl, model.a, options));
  const markers = [{ t: s, label: { tr: `S (H${timing >= 0 ? '+' : ''}${timing} ms)`, en: `S (H${timing >= 0 ? '+' : ''}${timing} ms)` } }];
  const calipers = [cal('TCL', ref('his-d', 'V', 0), ref('his-d', 'V', 1)), cal('A-A', ref('his-d', 'A', 1), ref('his-d', 'A', 2))];
  if (timing > PVC_LATEST) {
    // Ventricle already refractory: the stimulus does not capture; the tachycardia runs on.
    const events = merge(base, svtBeat(v3, model.a, options), svtBeat(v3 + tcl, model.a, options), { rv: [ev('S', s, 0.5, 2)] });
    return { events, markers, calipers, windowMs: v3 + tcl + 260, feedback: { capture: false, hisRefractory: true }, result: 'invalidCapture', reason: 'pvcNoCapture' };
  }
  if (timing < 0) {
    // His not yet refractory: the PVC can reach the atrium over the His; any A change is uninterpretable.
    const pull = 20;
    const events = merge(base, { rv: [ev('S', s, 0.5, 2), ev('V', s + 8, 0.9)] },
      svtBeat(v3 + tcl - pull, model.a, options),
      Object.fromEntries(Object.entries(model.a).map(([ch, dt]) => [ch, [ev('A', v3 + dt - pull, ch === 'abl-d' ? 0.35 : 0.7)]])),
      { 'his-d': [ev('V', v3 - pull + 5, 0.9)] });
    return { events, markers, calipers, windowMs: v3 + tcl + 260, feedback: { capture: true, hisRefractory: false }, result: 'insufficientEvidence', reason: 'hisNotRefractory' };
  }
  // Valid His-refractory PVC: the committed H and V of this beat stay; the A moves by `pull`.
  const pull = model.pull;
  const events = merge(base, svtBeat(v3, {}, options),
    Object.fromEntries(Object.entries(model.a).map(([ch, dt]) => [ch, [ev('A', v3 + dt - pull, ch === 'abl-d' ? 0.35 : 0.7)]])),
    { rv: [ev('S', s, 0.5, 2)] }, svtBeat(v3 + tcl - pull, model.a, options));
  const reason = pull > 0 ? 'aAdvanced' : pull < 0 ? 'aDelayed' : 'aUnchanged';
  return { events, markers, calipers, windowMs: v3 + tcl + 260, feedback: { capture: true, hisRefractory: true }, result: 'valid', reason };
}

function overdrive(model, pcl, site) {
  const tcl = model.tcl, n = 4, s0 = 200;
  const stims = Array.from({ length: n }, (_, i) => s0 + i * pcl);
  const last = stims[n - 1];
  const markers = stims.map((t, i) => ({ t, label: { tr: i ? 'S' : `S (${site === 'rv-base' ? 'RV bazal' : 'RV apeks'}, ${pcl} ms)`, en: i ? 'S' : `S (${site === 'rv-base' ? 'RV base' : 'RV apex'}, ${pcl} ms)` } }));
  const tachy = (from, count) => merge(...Array.from({ length: count }, (_, k) => svtBeat(from + k * tcl, model.a, { ablV: model.ablV ?? null })));
  if (pcl >= tcl) {
    // Not faster than the tachycardia: no entrainment is possible; stimuli fall in refractory tissue.
    const events = merge(tachy(150, 5), { rv: stims.map((t) => ev('S', t, 0.5, 2)) });
    return { events, markers, calipers: [cal('TCL', ref('his-d', 'V', 1), ref('his-d', 'V', 2))], windowMs: 150 + 4 * tcl + 260, feedback: { capture: false, entrained: false }, result: 'insufficientEvidence', reason: 'notFaster' };
  }
  // Retrograde A during pacing: nodal for AVNRT and AT, over the pathway for AVRT.
  const retro = model.response === 'AAV' || model.pull === 0 ? shifted(NODAL_RETRO, model.sa - NODAL_RETRO['his-d'])
    : shifted(model.a, model.sa - model.a['his-d']);
  if (pcl < tcl - 70) {
    // Too fast: the train terminates the tachycardia; sinus follows, nothing to read.
    const events = merge(...stims.map((t) => pacedBeat(t, retro)), sinusBeat(last + 650));
    return { events, markers, calipers: [cal('PCL', ref('rv', 'S', 0), ref('rv', 'S', 1), 'rv')], windowMs: last + 650 + 500, feedback: { capture: true, entrained: false }, result: 'insufficientEvidence', reason: 'terminated' };
  }
  const paced = merge(...stims.map((t) => pacedBeat(t, retro)));
  if (model.response === 'AAV') {
    // Focal AT: after the last retrograde A the focus fires its own A before any V.
    const firstA = last + model.sa + (tcl - 60);
    const events = merge(paced, Object.fromEntries(Object.entries(model.a).map(([ch, dt]) => [ch, [ev('A', firstA + dt - model.a.hra, 0.7)]])),
      { 'his-d': [ev('H', firstA + 90 + AH, 0.7, 4), ev('V', firstA + 90 + AH + HV, 0.9)], rv: [ev('V', firstA + 90 + AH + HV - 5, 0.9)] });
    return {
      events, markers,
      calipers: [cal('S-A', ref('rv', 'S', n - 1), ref('his-d', 'A', n - 1), 'his-d')],
      windowMs: firstA + 90 + AH + HV + 260, feedback: { capture: true, entrained: true }, result: 'valid', reason: 'AAV'
    };
  }
  // V-A-V: the last paced beat conducts to the atrium, then the circuit returns to the RV.
  const ppi = tcl + model.ppiTcl[site];
  const vReturn = last + ppi;
  const events = merge(paced, svtBeat(vReturn + 5, model.a, { ablV: model.ablV ?? null }), svtBeat(vReturn + 5 + tcl, model.a, { ablV: model.ablV ?? null }));
  return {
    events, markers,
    calipers: [
      cal('PPI', ref('rv', 'S', n - 1), ref('rv', 'V', n), 'rv'),
      cal('TCL', ref('his-d', 'V', n), ref('his-d', 'V', n + 1)),
      cal('SA', ref('rv', 'S', n - 1), ref('his-d', 'A', n - 1), 'his-d'),
      cal('VA', ref('his-d', 'V', n), ref('his-d', 'A', n), 'his-p')
    ],
    windowMs: vReturn + tcl + 300, feedback: { capture: true, entrained: true }, result: 'valid', reason: 'VAV'
  };
}

function paraHis(model, output) {
  const nodalA = { 'his-d': 100, 'his-p': 98, 'cs-910': 110, hra: 120, 'cs-12': 145 };
  const extraA = shifted(model.a, 60 - model.a['his-d']);
  const markers = (a, b) => [{ t: 150, label: a }, { t: 750, label: b }];
  const pair = { tr: 'S: His+RV yakalama', en: 'S: His+RV capture' }, rvOnly = { tr: 'S: yalnız RV yakalama', en: 'S: RV-only capture' };
  if (output === 'direct-a') {
    const a = { 'his-d': 12, 'his-p': 10, 'cs-910': 35, hra: 45, 'cs-12': 70 };
    return {
      events: merge(paraHisBeat(150, a, true), paraHisBeat(750, a, false)),
      markers: markers({ tr: 'S: A + His + RV', en: 'S: A + His + RV' }, { tr: 'S: A + RV', en: 'S: A + RV' }),
      calipers: [cal('S-A', ref('rv', 'S', 0), ref('his-d', 'A', 0), 'his-d')], windowMs: 1400,
      feedback: { capture: true, directA: true }, result: 'invalidCapture', reason: 'directA'
    };
  }
  if (output === 'pure-his') {
    // His captured without local RV myocardium: the V-capture condition fails.
    const events = merge(paraHisBeat(150, nodalA, true), { rv: [ev('S', 750, 0.5, 2)], 'his-d': [ev('H', 752, 0.6, 4), ev('V', 797, 0.9)] }, { 'ecg-ii': [ev('V', 797, 0.9, 8)] });
    return {
      events, markers: markers(pair, { tr: 'S: yalnız His (RV yok)', en: 'S: His only (no RV)' }),
      calipers: [cal('S-A (His+RV)', ref('rv', 'S', 0), ref('his-d', 'A', 0), 'his-d')], windowMs: 1400,
      feedback: { capture: true, rvCapture: false }, result: 'insufficientEvidence', reason: 'pureHis'
    };
  }
  const extranodal = model.paraHis === 'extranodal';
  const a1 = extranodal ? extraA : nodalA;
  const a2 = extranodal ? extraA : shifted(nodalA, 45);
  return {
    events: merge(paraHisBeat(150, a1, true), paraHisBeat(750, a2, false)),
    markers: markers(pair, rvOnly),
    calipers: [cal('S-A (His+RV)', ref('rv', 'S', 0), ref('his-d', 'A', 0), 'his-d'), cal('S-A (RV)', ref('rv', 'S', 1), ref('his-d', 'A', 1), 'his-d')],
    windowMs: 1400, feedback: { capture: true, rvCapture: true, directA: false }, result: 'valid', reason: extranodal ? 'extranodal' : 'nodal'
  };
}

/**
 * Deliver a maneuver.
 * @param {{ caseId: string, maneuver: string, site?: string, timing?: number, pcl?: number, output?: string }} choices
 * @returns {object} frozen recording (catalog shape) with feedback, result, reason and choices
 */
export function simulate(choices) {
  const c = { ...defaultChoices(choices.caseId, choices.maneuver), ...choices };
  const model = SIM_CASES[c.caseId] || SIM_CASES['avnrt-typical'];
  const timing = Math.max(HIS_PVC_RANGE.min, Math.min(HIS_PVC_RANGE.max, Math.round(Number(c.timing) || 0)));
  const pcl = Math.max(200, Math.min(700, Math.round(Number(c.pcl) || model.tcl - 30)));
  const site = SIM_SITES.includes(c.site) ? c.site : 'rv-apex';
  const out = c.maneuver === 'v-overdrive' ? overdrive(model, pcl, site)
    : c.maneuver === 'para-his' ? paraHis(model, SIM_PARAHIS_OUTPUTS.includes(c.output) ? c.output : 'standard')
      : hisPvc(model, timing);
  const recording = {
    id: `sim:${choiceKey({ ...c, timing, pcl, site })}`, caseId: c.caseId, section: 'maneuver', maneuver: c.maneuver,
    channels: model.channels, markers: out.markers, calipers: out.calipers, windowMs: out.windowMs, events: out.events,
    result: out.result, reason: out.reason, feedback: out.feedback, choices: { ...c, timing, pcl, site }, teachingNumbers: {}, simulated: true
  };
  return deepFreeze(recording);
}

/** Measured values of a simulated recording, by caliper label. */
export function simMeasures(recording) {
  return Object.fromEntries(recording.calipers.map((c) => [c.label, measure(recording, c)]));
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

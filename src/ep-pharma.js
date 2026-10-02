/* Paired, deterministic pharmacological teaching examples. Values are designed
 * timings, not drug kinetics, doses or predictions of a patient's response.
 * Source rationale: research/EP_FARMAKOLOJIK_PROVOKASYON.md. */
import { AH, HV, CH_SVT, ev, far, merge, sinusBeat, atrialPacedBeat, svtBeat, surfaceBeat } from './ep-beats.js';
import { ref, cal, measure, resolveRef } from './ep-caliper.js';
import { SIM_CASES } from './ep-maneuver-sim.js';
import { EP_CASES } from './ep-cases.js';

export const PHARMA_DRUGS = Object.freeze(['atropine', 'isuprel']);
// Every EP case offers the drug challenge. Induction examples need a
// maneuver-simulator model (SIM_CASES); the other cases keep the sinus rate
// and AV nodal conduction example only.
export const PHARMA_CASES = Object.freeze(EP_CASES.map((c) => c.id));

/** True when the case has induction examples (a simulator model). */
export const pharmaInducible = (caseId) => Object.hasOwn(SIM_CASES, caseId);
const PARAMETERS = Object.freeze({
  atropine: { pp: 650, ah: 65, tclChange: 0 },
  isuprel: { pp: 550, ah: 55, tclChange: -30 }
});

export function pharmaExamples(caseId) {
  if (!pharmaInducible(caseId)) return ['sinus-av'];
  return ['sinus-av', ...(caseId.startsWith('avnrt-') ? ['echo-only'] : []), 'induced', 'noninduced'];
}

export function defaultPharma(caseId = 'avnrt-typical') {
  return { caseId: PHARMA_CASES.includes(caseId) ? caseId : 'avnrt-typical', drug: 'atropine', example: 'sinus-av' };
}

function normalize(choices) {
  const c = { ...defaultPharma(choices.caseId), ...choices };
  if (!PHARMA_CASES.includes(c.caseId)) c.caseId = 'avnrt-typical';
  if (!PHARMA_DRUGS.includes(c.drug)) c.drug = 'atropine';
  if (!pharmaExamples(c.caseId).includes(c.example)) c.example = 'sinus-av';
  return c;
}

function sinusAt(p, ah) {
  const events = sinusBeat(p, { ablA: null });
  for (const list of Object.values(events)) for (const e of list) {
    if (e.type === 'H' || e.type === 'V') e.t += ah - AH;
  }
  delete events['abl-d'];
  return events;
}

function focalBeat(a, ah, model) {
  const aHis = a + model.a['his-d'] - model.a.hra;
  const h = aHis + ah, v = h + HV;
  return merge(
    surfaceBeat(v, { p: a }),
    Object.fromEntries(Object.entries(model.a).map(([ch, dt]) => [ch, [ev('A', a + dt - model.a.hra, 0.7)]])),
    {
      'his-d': [ev('H', h, 0.75, 4), ev('V', v, 0.9)],
      'his-p': [ev('H', h, 0.35, 4), ev('V', v, 0.7)],
      'cs-910': [far('V', v + 15, 0.4)],
      'cs-12': [far('V', v + 25, 0.4)], rv: [ev('V', v - 3, 0.9)]
    }
  );
}

function build(c, phase) {
  const after = phase === 'after';
  const parameters = after ? PARAMETERS[c.drug] : { pp: 850, ah: AH, tclChange: 0 };
  const model = SIM_CASES[c.caseId];
  const rateExample = c.example === 'sinus-av';
  let events, calipers, markers, windowMs;
  if (rateExample) {
    // Spontaneous P-P measures rate; AH/HV use a separate, identical S1 train.
    events = merge(sinusAt(100, parameters.ah), sinusAt(100 + parameters.pp, parameters.ah),
      ...[2000, 2500, 3000].map((s) => atrialPacedBeat(s, parameters.ah)));
    calipers = [
      cal('P-P', ref('ecg-ii', 'P', 0), ref('ecg-ii', 'P', 1), 'ecg-ii'),
      cal('S1-S1', ref('hra', 'S', 0), ref('hra', 'S', 1), 'hra'),
      cal('AH (S1)', ref('his-d', 'A', 3), ref('his-d', 'H', 3)),
      cal('HV', ref('his-d', 'H', 3), ref('his-d', 'V', 3))
    ];
    markers = [
      { t: 100, label: { tr: 'Sinüs', en: 'Sinus' } },
      { t: 2000, label: { tr: 'Aynı S1: 500 ms', en: 'Matched S1: 500 ms' } }
    ];
    windowMs = 3700;
  } else {
    const s2 = 1040;
    const induced = after && c.example === 'induced';
    const echoOnly = after && c.example === 'echo-only';
    const testAh = after && (echoOnly || (induced && c.caseId !== 'focal-at')) ? 180 : after ? 90 : 100;
    const testV = s2 + 40 + testAh + HV;
    const tcl = model.tcl + parameters.tclChange;
    events = merge(atrialPacedBeat(100, parameters.ah), atrialPacedBeat(700, parameters.ah), atrialPacedBeat(s2, testAh));
    if (echoOnly || (induced && c.caseId !== 'focal-at')) {
      events = merge(events, Object.fromEntries(Object.entries(model.a).map(([ch, dt]) => [ch, [ev('A', testV + dt, 0.7)]])));
    }
    if (induced) {
      if (c.caseId === 'focal-at') {
        // Automatic AT is drawn from its atrial source, not as a retrograde echo.
        events = merge(events, ...[0, 1, 2, 3].map((i) => focalBeat(testV + 250 + i * tcl, parameters.ah, model)));
      } else {
        events = merge(events, ...[1, 2, 3, 4].map((i) => svtBeat(testV + i * tcl, model.a, { ablV: model.ablV ?? null })));
      }
    }
    calipers = [
      cal('S1-S1', ref('hra', 'S', 0), ref('hra', 'S', 1), 'hra'),
      cal('AH (S1)', ref('his-d', 'A', 1), ref('his-d', 'H', 1)),
      cal('HV', ref('his-d', 'H', 1), ref('his-d', 'V', 1)),
      cal('S1-S2', ref('hra', 'S', 1), ref('hra', 'S', 2), 'hra'),
      cal('AH (S2)', ref('his-d', 'A', 2), ref('his-d', 'H', 2)),
      ...(echoOnly ? [cal('VA (echo)', ref('his-d', 'V', 2), ref('his-d', 'A', 3))] : []),
      ...(induced ? [cal('TCL', ref('his-d', 'V', 3), ref('his-d', 'V', 4))] : [])
    ];
    markers = [100, 700].map((t) => ({ t, label: { tr: 'S1', en: 'S1' } }));
    markers.push({ t: s2, label: { tr: 'S2: 340 ms', en: 'S2: 340 ms' } });
    if (echoOnly) markers.push({ t: testV + model.a['his-d'], label: { tr: 'Tek echo A', en: 'Single echo A' } });
    if (induced) markers.push({ t: c.caseId === 'focal-at' ? testV + 250 : testV + model.a['his-d'], label: { tr: 'Tekrar eden ritim', en: 'Repeating rhythm' } });
    windowMs = Math.max(1800, ...Object.values(events).flat().map((e) => e.t + 150));
  }
  // Keep only the channels sampled by this lab; no roving ablation catheter.
  events = Object.fromEntries(Object.entries(events).filter(([ch]) => CH_SVT.includes(ch)));
  return {
    id: `pharma:${c.caseId}:${c.drug}:${c.example}:${phase}`, caseId: c.caseId,
    section: 'maneuver', lab: 'pharma', maneuver: c.drug, drug: c.drug, phase,
    channels: CH_SVT, events, markers, calipers, windowMs, teachingNumbers: {},
    choices: c, simulated: true, result: null,
    protocol: { rateExample, testV: rateExample ? null : resolveRef({ events }, ref('his-d', 'V', 2)).t }
  };
}

/** Baseline and post-drug are alternative observed examples, not a response predictor. */
export function pharmaComparison(choices = {}) {
  const c = normalize(choices);
  return freeze({ choices: c, before: build(c, 'before'), after: build(c, 'after') });
}

/** Read observations and intervals from the actual events shown on the strip. */
export function pharmaMeasures(recording) {
  const intervals = Object.fromEntries(recording.calipers.map((c) => [c.label, measure(recording, c)]));
  const his = (recording.events['his-d'] || []).filter((e) => e.type === 'H');
  const atrial = (recording.events['his-d'] || []).filter((e) => e.type === 'A');
  const testV = recording.protocol.testV;
  const induced = testV != null && his.filter((e) => e.t > testV).length >= 3;
  const echo = testV != null && !induced && atrial.some((e) => e.t > testV);
  const pp = intervals['P-P'] ?? null;
  return {
    rate: pp ? Math.round(60000 / pp) : null, pp, drive: intervals['S1-S1'] ?? null,
    ah: intervals['AH (S1)'] ?? null, hv: intervals.HV ?? null,
    s2: intervals['S1-S2'] ?? null, testAh: intervals['AH (S2)'] ?? null,
    va: intervals['VA (echo)'] ?? null, echo, induced, tcl: induced ? intervals.TCL ?? null : null
  };
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

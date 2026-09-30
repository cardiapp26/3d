// Jugular venous pulse time strips and parameter record
// (research/VENOZ_BASINC_FIZIK_MUAYENE_MODUL_RAPORU.md, JVP-01 to JVP-05):
// irregular AF from a fixed seed, cannon a only against the closed tricuspid
// valve, the abdominojugular test judged by protocol timing, positive pressure
// ventilation with its own parameters, and the synthetic-data label.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CYCLE_SYNC as S } from '../src/cardiac-cycle.js';
import { ecgSample } from '../src/ecg-trace.js';
import { WAVE_PHASE, tricuspidOpen, JVP_SCENARIOS } from '../src/jvp-physiology.js';
import { afStrip, avdStrip, ajrStrip, ppvStrip, evaluateAjr, airwayPressure, buildStrip, STRIP_MODES, AJR_PROTOCOL, VENTILATION, ventricularClock } from '../src/jvp-timeline.js';
import { JVP_PARAMETERS, STATUS, DATA_LABEL, PARAMETER_VERSION, SOURCE_KEYS, parametersFor, toCsv } from '../src/jvp-parameters.js';

const range = (s, step = 0.005) => { const out = []; for (let t = 0; t < s.duration; t += step) out.push(t); return out; };
const peakTimes = (fn, s) => { const ts = range(s, 0.002); return ts.filter((t, i) => i > 0 && i < ts.length - 1 && fn(t) > 0.6 && fn(t) >= fn(ts[i - 1]) && fn(t) > fn(ts[i + 1])); };

// Ventricular clock: the rate warp keeps each cycle inside its RR; phases increase within a cycle.
const clock = ventricularClock([0.5, 1.0]);
assert.equal(clock.duration, 1.5);
assert.ok(Math.abs(clock.timeOf(1, 0) - 0.5) < 1e-9);
assert.ok(clock.phaseAt(0.2) < clock.phaseAt(0.45) && clock.phaseAt(0.49) > 0.9);

// JVP-01: AF. Variable RR, reproducible from the seed, no organized a wave, channels on one timeline.
const af = afStrip();
const rrs = af.clock.rrs;
assert.ok(Math.max(...rrs) - Math.min(...rrs) > 0.3, 'AF: RR intervals vary');
assert.ok(new Set(rrs.map(r => r.toFixed(3))).size > rrs.length - 2, 'AF: no repeating RR');
assert.deepEqual(afStrip().clock.rrs, rrs, 'AF: the same seed gives the same sequence');
assert.notDeepEqual(afStrip({ seed: 8 }).clock.rrs, rrs, 'AF: another seed, another sequence');
assert.equal(af.atrial.length, 0, 'AF: no atrial contractions');
for (const c of af.cycles) {
  const beforeClose = c.start + (c.tvClose - c.start) * 0.7;   // late diastole, where the a wave would be
  const u = af.phaseAt(beforeClose);
  assert.ok(tricuspidOpen(u));
  assert.ok(af.pressure(beforeClose) - af.pressure(c.start + 0.25 * c.rr) < 1.2, 'AF: no atrial bump before valve closure');
}
// Every R peak of the ECG sits at a QRS event of the same clock (the heart pose reads that clock too).
const rPeaks = peakTimes(af.ecg, af);
assert.equal(rPeaks.length, af.cycles.length, 'AF: one R wave per ventricular cycle');
for (const t of rPeaks) assert.ok(af.cycles.some(c => Math.abs(c.qrs - t) < 0.02), 'AF: R wave on a QRS event');
// Pausing, slow motion and restart only change t: a channel read twice at the same t is identical, and t=0 is the loop start.
for (const t of [0, 1.234, af.duration - 0.001]) assert.equal(af.pressure(t), af.pressure(t + af.duration));
assert.ok(Math.abs(af.pressure(af.duration - 1e-6) - af.pressure(0)) < 0.05, 'AF: seamless loop');

// JVP-02: AV dissociation. Cannon a only when the atrial contraction meets the closed valve.
const avd = avdStrip();
const kinds = avd.atrial.map(e => e.kind);
assert.ok(kinds.includes('cannon') && kinds.includes('a'), 'AVD: both cannon and ordinary a waves in the sample');
for (const e of avd.atrial) {
  const open = tricuspidOpen(avd.phaseAt(e.t));
  assert.equal(e.kind === 'cannon', !open, 'cannon exactly when the tricuspid valve is closed');
  assert.ok(e.t > e.p, 'contraction follows the P wave');
}
const at = e => avd.pressure(e.t);
const cannonHeight = Math.min(...avd.atrial.filter(e => e.kind === 'cannon').map(at));
const aHeight = Math.max(...avd.atrial.filter(e => e.kind === 'a').map(at));
assert.ok(cannonHeight > aHeight + 3, 'cannon waves are larger than the ordinary a waves');
const slower = avdStrip({ atrialRate: 60 });
assert.notDeepEqual(slower.atrial.map(e => e.kind), kinds, 'another atrial rate: another coincidence pattern');
assert.ok(Math.abs(avd.atrialRate - 75) < 1.5, 'atrial rate close to the requested one (whole beats per loop)');
assert.ok(peakTimes(avd.ecg, avd).length === avd.cycles.length, 'AVD: one QRS per ventricular cycle, P waves smaller');
// Tricuspid stenosis keeps its large a with the valve open: a different mechanism.
assert.ok(tricuspidOpen(WAVE_PHASE.a) && !tricuspidOpen(WAVE_PHASE.cannon));
assert.ok(Math.abs(avd.pressure(avd.duration - 1e-6) - avd.pressure(0)) < 0.05, 'AVD: seamless loop');

// Separate atrial clock for the 3D atria: the atrial contraction channel peaks
// on each atrial contraction event, and the atrial and ventricular phases drift.
{
  const { computeChannelWeights } = await import('../src/cycle-channels.js');
  for (const e of avd.atrial) {
    const w = computeChannelWeights(avd.phaseAt(e.t), { atrialPhase: avd.atrialPhaseAt(e.t) });
    assert.ok(w.atrialContraction > 0.97, `atrial contraction peaks on the event at ${e.t.toFixed(2)} s (${w.atrialContraction.toFixed(2)})`);
  }
  const gap = avd.atrial.map(e => ((avd.atrialPhaseAt(e.t) - avd.phaseAt(e.t)) % 1 + 1) % 1);
  assert.ok(Math.max(...gap) - Math.min(...gap) > 0.3, 'atrial and ventricular phases drift apart (no fixed A to V coupling)');
  const sinusW = computeChannelWeights(0.385);
  assert.equal(sinusW.atrialPhase, undefined, 'without an atrial clock the phases stay shared');
}

// Ventricular-only ECG has no P wave; sinus has one.
assert.ok(Math.abs(ecgSample(S.pPeak, 'ventricular')) < 0.01 && ecgSample(S.pPeak, 'sinus') > 0.15);

// JVP-03: abdominojugular test. A brief early rise is not positive; a sustained rise with a fall on release is.
const normal = evaluateAjr(ajrStrip('transient'));
assert.ok(normal.peakRiseCm >= AJR_PROTOCOL.thresholdCm, 'normal: the early rise crosses the threshold briefly');
assert.equal(normal.positive, false, 'normal: transient rise is negative');
assert.equal(normal.transientOnly, true);
const failing = evaluateAjr(ajrStrip('sustained'));
assert.ok(failing.sustained && failing.fall && failing.positive, 'elevated filling: sustained rise and fall on release');
const s = ajrStrip('sustained');
const start = AJR_PROTOCOL.baseline, end = start + AJR_PROTOCOL.compression;
assert.equal(s.stageAt(start - 0.1), 'baseline');
assert.equal(s.stageAt(start + 1), 'compression');
assert.equal(s.stageAt(end + 1), 'release');
assert.equal(s.stageAt(end + AJR_PROTOCOL.releaseWindow + 0.5), 'done');
assert.equal(s.extra.value(start - 0.1), 0);
assert.equal(s.extra.value(start + 0.1), AJR_PROTOCOL.abdominalPressure, 'compression visible on its own channel');
assert.ok(Math.abs(s.pressure(0) - s.pressure(s.duration)) < 1e-9, 'restart returns to the baseline state');
// Protocol timing matters: judged too early (sustain window starting at 1 s) the transient would count.
const early = evaluateAjr({ ...ajrStrip('transient'), protocol: { ...AJR_PROTOCOL, sustainFrom: 0.9, compression: 2.5 } });
assert.ok(early.endRiseCm > normal.endRiseCm, 'the protocol window, not the peak, decides');

// JVP-04: ventilation. Separate parameters; inspiration raises the pressure; PEEP raises the end-expiratory level.
const ppv = ppvStrip();
const avg = (strip, phase) => { const ts = range(strip).filter(t => strip.breathAt(t) === phase); return ts.reduce((a, t) => a + strip.pressure(t), 0) / ts.length; };
assert.ok(avg(ppv, 'insp') > avg(ppv, 'exp') + 1, 'ventilator: pressure rises in inspiration (opposite of spontaneous)');
const cycle = 60 / VENTILATION.rate, ti = cycle * VENTILATION.inspiratoryFraction;
for (const t of range(ppv, 0.1)) {
  const x = t % cycle;
  if (x > 0.5 && x < ti) assert.ok(ppv.breathAt(t) === 'insp' && airwayPressure(t) > VENTILATION.peep + 5, 'inspiration: airway pressure up');
  if (x > ti + 1.5) assert.ok(ppv.breathAt(t) === 'exp' && airwayPressure(t) < VENTILATION.peep + 1, 'late expiration: back to PEEP');
}
assert.ok(ppvStrip({ peep: 10 }).endExpiratory() > ppvStrip({ peep: 0 }).endExpiratory() + 1, 'PEEP raises the end-expiratory level');
assert.equal(ppv.extra.id, 'airway');
assert.ok(parametersFor('ppv').length >= 5 && !parametersFor('ppv').some(p => p.scope === 'spontaneous'), 'ventilator has its own parameters');
assert.equal(buildStrip('beat'), null);
for (const mode of STRIP_MODES) assert.ok(buildStrip(mode).duration > 5, `${mode} strip builds`);

// JVP-05: every scenario and strip has recorded parameters; nothing claims measured or validated data.
for (const scope of [...JVP_SCENARIOS, 'rhythm-af', 'rhythm-avd', 'ajr', 'ppv']) assert.ok(parametersFor(scope).length > 0, `${scope}: parameters recorded`);
for (const item of JVP_PARAMETERS) {
  assert.ok(Object.values(STATUS).includes(item.status), `${item.id}: known status`);
  assert.ok(!/measured|validated|clinical/i.test(item.status), `${item.id}: never measured or validated`);
  assert.ok(item.unit !== undefined && item.rationale && SOURCE_KEYS[item.source] && item.version === PARAMETER_VERSION, `${item.id}: unit, rationale, source, version`);
}
const csv = toCsv({ title: 'test', columns: ['t_s', 'ra_mmHg'], rows: [[0, 5], [0.01, 5.1]], scopes: ['af', 'rhythm-af'] });
assert.ok(csv.includes(DATA_LABEL.en) && csv.includes(PARAMETER_VERSION) && csv.includes('af.rrRange'), 'export keeps the label and the parameters');
assert.match(DATA_LABEL.tr, /Sentetik öğretim verisi/);
for (const file of ['../src/jvp-timeline.js', '../src/jvp-parameters.js']) {
  assert.ok(!readFileSync(new URL(file, import.meta.url), 'utf8').includes('\u2014'), `${file}: no em dash`);
}
console.log('PASS jvp-timeline: AF irregular RR (seeded), cannon a only against the closed valve, abdominojugular protocol timing, ventilator mode and PEEP, parameter record and export label');

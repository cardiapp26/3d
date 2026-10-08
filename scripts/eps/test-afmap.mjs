// AF mapping model (src/eps/afmap-model.js): each teaching claim of the AF
// mapping tab, read from the simulated sheet. A stable rotor (one true PS,
// wandering a few mm) drives the sheet 1:1 at about 7 Hz while the fibrotic
// patch conducts fibrillatory (fewer beats, lower DF) and holds the
// fractionated, CFAE signals (Cardiac Mapping chapter 52); a 64-pole basket
// finds false PS beside the rotor and loses more with poor contact
// (chapter 53); the Hilbert phase follows a signal through amplitude
// changes; ablation of the core anchors the wave (organized reentry), a
// line to the edge terminates AF, ablation of the CFAE area does not; with
// multiple wavelets many short-lived PS and no single target.
import assert from 'node:assert/strict';
import { N, FRAMES, FRAME_MS, CFAE_MS, RESOLUTIONS, ABLATIONS, SCENARIOS, simulate, electrogram, deflections, cfeMean, dominantFrequency, hilbertPhase, truePs, psStats, rotorCore, siteMaps, ablationLesions, outcome, inPatch, electrodes } from '../../src/eps/afmap-model.js';
import { AFMAP_TEXT } from '../../src/eps/afmap-text.js';

const rotor = simulate('rotor');
assert.equal(rotor.U.length, FRAMES * N * N);

// One stable rotor: one true PS per frame, wandering a few millimetres, left of the patch.
const core = rotorCore(rotor);
assert.ok(Math.abs(core.perFrame - 1) < 0.1, `one PS per frame (${core.perFrame})`);
assert.ok(core.spread < 4, `core wanders < 4 mm (${core.spread.toFixed(1)})`);
assert.ok(!inPatch('rotor', [Math.round(core.x), Math.round(core.y)]), 'the rotor is outside the fibrotic patch');

// The rotor drives the rest 1:1 (about 7 Hz); the patch conducts fibrillatory and fractionates.
const maps = siteMaps(rotor);
const out = maps.filter((m) => !inPatch('rotor', [m.x, m.y])), patch = maps.filter((m) => inPatch('rotor', [m.x, m.y]));
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const coreEgm = electrogram(rotor, [Math.round(core.x), Math.round(core.y)]);
const coreDf = dominantFrequency(coreEgm).df;
assert.ok(coreDf > 6 && coreDf < 8, `rotor DF ${coreDf} Hz`);
assert.ok(mean(patch.map((m) => m.beats)) < 0.8 * mean(out.map((m) => m.beats)), 'fewer beats in the patch (fibrillatory conduction)');
assert.ok(mean(patch.filter((m) => m.df).map((m) => m.df)) < mean(out.filter((m) => m.df).map((m) => m.df)) - 0.3, 'lower DF in the patch');
assert.ok(Math.max(...maps.map((m) => m.df || 0)) <= coreDf + 0.01, 'no site exceeds the rotor DF');
assert.equal(out.filter((m) => m.cfae).length, 0, 'no CFAE outside the patch');
assert.ok(patch.filter((m) => m.cfae).length >= 3, 'CFAE in the patch');
const fib = electrogram(rotor, SCENARIOS.rotor.sites.fibrosis);
const fibCfe = cfeMean(deflections(fib));
assert.ok(fibCfe != null && fibCfe < CFAE_MS, `fibrotic site: CFE-mean < 120 ms (${fibCfe})`);
assert.ok(patch.some((m) => m.cfe == null), 'part of the patch is silent (conduction block)');
assert.ok(dominantFrequency(coreEgm).regularity > dominantFrequency(fib).regularity, 'rotor core more regular than the fractionated site');

// Phase: the Hilbert phase advances once per cycle, through an amplitude change.
const sig = Float32Array.from({ length: FRAMES }, (_, f) => (f < FRAMES / 2 ? 1 : 0.3) * Math.sin((2 * Math.PI * 6 * f * FRAME_MS) / 1000));
const ph = hilbertPhase(sig);
let turns = 0;
for (let f = 1; f < FRAMES; f++) if (ph[f - 1] > 2 && ph[f] < -2) turns++;
assert.ok(Math.abs(turns - 18) <= 1, `phase wraps once per cycle (${turns} in 3 s at 6 Hz)`);

// Electrode resolution: full maps the rotor, the basket adds false PS, poor contact makes it worse.
const full = psStats(rotor, 'full'), basket = psStats(rotor, 'basket'), poor = psStats(rotor, 'basketPoor');
assert.ok(full.precision > 0.9 && Math.abs(full.mappedPs - full.truePs) < 0.2, 'full resolution finds the true PS');
assert.ok(basket.mappedPs > 2 * basket.truePs && basket.precision < 0.5, 'basket: false PS beside the rotor');
assert.ok(poor.precision < 0.5, 'basket with poor contact: still mostly false');
assert.equal(electrodes('basket').points.length, 64);
assert.ok(electrodes('basketPoor').lost.size >= 24 && electrodes('basketPoor').lost.size <= 40, 'about half out of contact');

// Ablation.
const after = (id, a) => outcome(simulate(id, ablationLesions(id, a)));
assert.equal(after('rotor', 'none'), 'persists');
assert.equal(after('rotor', 'core'), 'organized', 'disc on the core: the wave anchors (regular reentry)');
assert.equal(after('rotor', 'line'), 'terminated', 'line from the core to the edge: AF ends');
assert.equal(after('rotor', 'cfae'), 'persists', 'CFAE ablation leaves the rotor');

// Multiple wavelets: many short-lived PS, no single target.
const waves = simulate('wavelets');
assert.ok(rotorCore(waves).perFrame > 4, 'many PS at once');
assert.ok(rotorCore(waves).spread > 10, 'PS spread over the sheet');
const sample = [200, 700, 1200].map((f) => truePs(waves, f).map((p) => `${p.x},${p.y}`));
assert.ok(sample[0].filter((p) => sample[2].includes(p)).length < sample[0].length / 2, 'PS do not stay in place');
for (const a of ['core', 'line']) assert.equal(after('wavelets', a), 'persists', `wavelets: ${a} ablation does not stop AF`);

// Texts in both languages.
for (const lang of ['tr', 'en']) {
  const x = AFMAP_TEXT[lang];
  for (const id of Object.keys(SCENARIOS)) assert.ok(x.scenarios[id].name && x.scenarios[id].lesson, `${lang} ${id}`);
  for (const id of RESOLUTIONS) assert.ok(x.resolutions[id], `${lang} ${id}`);
  for (const id of ABLATIONS) assert.ok(x.ablations[id] && x.ablationText[id], `${lang} ${id}`);
  for (const id of ['persists', 'organized', 'terminated']) assert.ok(x.outcomes[id], `${lang} ${id}`);
  for (const id of ['core', ...Object.keys(SCENARIOS.rotor.sites), ...Object.keys(SCENARIOS.wavelets.sites)]) assert.ok(x.sites[id], `${lang} site ${id}`);
}
console.log('PASS AF mapping model');

import assert from 'node:assert/strict';
import {
  EAM3D_SCENARIOS,
  EAM3D_MAP_MODES,
  EAM3D_WALL_LAYERS,
  EAM3D_CATHETERS,
  EAM3D_CHANNELS,
  EAM3D_ABLATION_LINES,
  DEFAULT_LEVERS,
  ANCHORS,
  scenarioSpec,
  evaluateVertex3d,
  vertexWaveState,
  sampleChannelsAt,
  runStimManeuver,
  runCircuitSurvey,
  chamberClock,
  activationAge,
  nearestActivationDelta,
  actionPotentialMs,
  buildStimTrain,
  pacedClock,
  pacedLat,
  createChannelSampler,
  PACING_CHANNELS
} from '../../src/eps/eam3d-model.js';
import { EAM3D_TEXT } from '../../src/eps/eam3d-text.js';
import { createRhythmTimeline } from '../../src/eps/eam3d-timeline.js';
import { polygraphWindowMs } from '../../src/eps/eam3d-polygraph.js';
import {
  MAPPING_CATHETERS,
  MAP_PALETTES,
  MAPPING_SETTINGS,
  voltageScale,
  acquireBeat,
  createRng,
  relativeLat,
  summarizeSession
} from '../../src/eps/eam3d-mapping-model.js';

// 1. Scenarios, map modes, wall layers and catheters match the workstation specification
assert.equal(EAM3D_SCENARIOS.includes('avnrt'), true);
assert.equal(EAM3D_SCENARIOS.includes('vt-ischemic'), true);
assert.equal(EAM3D_SCENARIOS.includes('pvc-rvot'), true);
assert.deepEqual(EAM3D_MAP_MODES, ['live', 'lat', 'voltage', 'phase']);
assert.deepEqual(EAM3D_WALL_LAYERS, ['all', 'endo', 'mid', 'epi', 'hide-epi']);
assert.equal(EAM3D_CATHETERS.duo.electrodes.length, 20, '20-pole DUO catheter');
assert.equal(EAM3D_CATHETERS.cs.electrodes.length, 10, '10-pole CS catheter');
assert.equal(EAM3D_CATHETERS.grid.electrodes.length, 16, '4x4 16-pole HD Grid catheter');
assert.equal(EAM3D_CHANNELS.length, 26, 'surface II/V1 + 10 DUO + 5 CS + 2 HRA + 2 His + 3 Grid + 2 RV channels');

// 2. Scenario cycle length responds to tissue conduction velocity levers and ablation
const avnrtBase = scenarioSpec('avnrt', DEFAULT_LEVERS);
assert.equal(avnrtBase.tcl, 392, 'default AVNRT CL is 392 ms');
const avnrtSlow = scenarioSpec('avnrt', { ...DEFAULT_LEVERS, atrialCv: 0.45 });
assert.ok(avnrtSlow.tcl > avnrtBase.tcl, 'slower atrial CV lengthens cycle length');
const afterSlowPathwayAblation = scenarioSpec('avnrt', DEFAULT_LEVERS, new Set(['slow-pathway']));
assert.equal(afterSlowPathwayAblation.id, 'sinus', 'slow pathway ablation terminates AVNRT to sinus rhythm');

// 3. 3D vertex evaluation: LAT, voltage, scar and conducting channels
const vtChannelVertex = evaluateVertex3d(ANCHORS.lvInferolateralScar, 'lv', 'vt-ischemic');
assert.equal(vtChannelVertex.tissue, 'channel', 'center of LV inferolateral scar has a conducting diastolic isthmus');
assert.ok(vtChannelVertex.bipolar < 0.5, 'channel bipolar voltage is in low-voltage range');
assert.ok(vtChannelVertex.tag === 'lp' || vtChannelVertex.tag === 'lava', 'late potential / LAVA tagged on channel');

const afterVtAblation = evaluateVertex3d(ANCHORS.lvInferolateralScar, 'lv', 'vt-ischemic', DEFAULT_LEVERS, new Set(['vt-isthmus-dechannel']));
assert.equal(afterVtAblation.tissue, 'scar', 'RF dechanneling turns isthmus into dense non-conducting scar');

// 4. Wavefront state U(v, t) and phase
const waveFront = vertexWaveState(50, 392, 56, 'ra', 'normal');
assert.equal(waveFront.front, true);
assert.ok(waveFront.u > 0.3, 'depolarizing wavefront has positive action potential U');
const scarWave = vertexWaveState(50, 392, 56, 'lv', 'scar');
assert.equal(scarWave.u, 0, 'dense scar does not depolarize');

// 5. Multichannel polygraph sampling
const sample = sampleChannelsAt(120, 'avnrt');
assert.equal(sample.tcl, 392);
assert.equal(sample.bpm, 153);
assert.equal(typeof sample.values.II, 'number');
assert.equal(typeof sample.values['duo-19-20'], 'number');
assert.equal(typeof sample.values['cs-9-10'], 'number');
assert.equal(typeof sample.values['rv-d'], 'number');

// 6. Programmed stimulation maneuvers (BURST overdrive and S1-S2 extrastimulus)
const entrainRv = runStimManeuver({ scenarioId: 'avnrt', mode: 'burst', channelId: 'rv-d', bclMs: 352 });
assert.equal(entrainRv.outcome, 'entrained');
assert.ok(entrainRv.ppiMinusTcl > 100, 'RV overdrive pacing in AVNRT has long PPI - TCL (>115 ms)');

const induceAvnrt = runStimManeuver({ scenarioId: 'sinus', mode: 's1s2', channelId: 'hra-d', s2Ms: 280 });
assert.equal(induceAvnrt.outcome, 'induced');
assert.equal(induceAvnrt.nextScenario, 'avnrt');

// 7. Probabilistic Circuit Survey ("Find the circuit")
const survey = runCircuitSurvey({ mapPreset: 'biatrial-scar', runs: 100 });
assert.equal(survey.circuits.length, 6, '6 numbered candidate circuits surveyed');
assert.ok(survey.totalSustained > 50, 'majority of runs sustain reentry before ablation');
assert.ok(survey.proposedLines.length >= 4, 'proposed minimal-intervention lines ranked');

const roofAndMitral = new Set(['la-anterior-roof', 'mitral-isthmus']);
const surveyAfterLines = runCircuitSurvey({ mapPreset: 'biatrial-scar', runs: 100, ablatedLines: roofAndMitral });
assert.ok(surveyAfterLines.totalSustained < survey.totalSustained, 'applying proposed ablation lines reduces sustained reentry runs');

// 8. Bilingual text completeness
for (const lang of ['tr', 'en']) {
  const t = EAM3D_TEXT[lang];
  assert.ok(t.title.length > 10);
  for (const id of EAM3D_SCENARIOS) assert.ok(t.scenarios[id], `${lang} scenario ${id}`);
  for (const id of Object.keys(EAM3D_ABLATION_LINES)) assert.ok(t.ablationBox.lines[id], `${lang} line ${id}`);
}

// 9. AV conduction: flutter conducts 2:1, AF gives an irregular ventricular response
const flutter = scenarioSpec('flutter-typical', DEFAULT_LEVERS);
assert.equal(flutter.avRatio, 2);
assert.equal(flutter.vTcl, flutter.tcl * 2, 'ventricular cycle is twice the flutter cycle');
assert.equal(sampleChannelsAt(0, 'flutter-typical').bpm, 125, 'flutter 240 ms conducts 2:1 at 125 bpm, not 250');
assert.equal(scenarioSpec('avnrt', DEFAULT_LEVERS).avRatio, 1, 'AVNRT conducts 1:1');
const afSpec = scenarioSpec('af', DEFAULT_LEVERS);
assert.equal(afSpec.irregularV, true);
const afBpm = sampleChannelsAt(0, 'af').bpm;
assert.ok(afBpm > 80 && afBpm < 130, `AF mean ventricular rate is physiological: ${afBpm}`);
const rrSeen = new Set();
for (let t = 0; t < 6000; t += 50) rrSeen.add(chamberClock(afSpec, 'lv', t).cycle);
assert.ok(rrSeen.size >= 5, 'AF RR intervals vary');
assert.equal(chamberClock(afSpec, 'ra', 400).cycle, afSpec.tcl, 'atria keep the fibrillatory cycle');
const negClock = chamberClock(afSpec, 'lv', -250);
assert.ok(negClock.phase >= 0 && negClock.phase < negClock.cycle, 'clock is defined before time zero');

// Count QRS complexes on lead II: one per two flutter waves
const countPeaks = (scenarioId, channel, fromMs, toMs, threshold) => {
  const sampler = createChannelSampler(scenarioId);
  let peaks = 0;
  let above = false;
  for (let t = fromMs; t < toMs; t += 2) {
    const v = sampler(t).values[channel];
    if (v > threshold && !above) peaks++;
    above = v > threshold;
  }
  return peaks;
};
assert.equal(countPeaks('flutter-typical', 'II', 0, 4800, 0.6), 10, '10 QRS in 4.8 s of 2:1 flutter (20 flutter waves)');
const afQrs = countPeaks('af', 'II', 0, 5900, 0.6);
assert.ok(afQrs >= 9 && afQrs <= 11, `AF shows about 10 QRS in one RR table pass: ${afQrs}`);

// Typical AVNRT: His precedes the atrium, A and V are almost simultaneous
const avnrtSpec = scenarioSpec('avnrt', DEFAULT_LEVERS);
assert.ok(avnrtSpec.hisOffset < 0 && Math.abs(avnrtSpec.vOffset) < 70, 'short VA interval in slow-fast AVNRT');

// 10. Activation age helpers
assert.equal(activationAge(50, { phase: 80, cycle: 300, prevCycle: 300 }), 30);
assert.equal(activationAge(250, { phase: 10, cycle: 440, prevCycle: 680 }), 440, 'age reaches back into the previous (longer) cycle');
assert.equal(nearestActivationDelta(290, { phase: 5, cycle: 300, prevCycle: 300 }), 15, 'activation just before the cycle wrapped');
assert.equal(nearestActivationDelta(10, { phase: 295, cycle: 300, prevCycle: 300 }), -15, 'activation coming right after the wrap');

// 11. Restitution and rate adaptation levers change the action potential
const apdBase = actionPotentialMs('ra', 600, DEFAULT_LEVERS);
assert.ok(actionPotentialMs('ra', 600, { ...DEFAULT_LEVERS, atrialRestitution: 1.4 }) > apdBase, 'restitution lengthens APD');
assert.ok(actionPotentialMs('ra', 260, DEFAULT_LEVERS) < apdBase, 'APD shortens at a fast rate');
assert.ok(
  actionPotentialMs('ra', 260, { ...DEFAULT_LEVERS, rateAdaptation: 0 }) > actionPotentialMs('ra', 260, DEFAULT_LEVERS),
  'no rate adaptation keeps APD long at a fast rate'
);
assert.ok(actionPotentialMs('lv', 200, { ...DEFAULT_LEVERS, ventricularRestitution: 1.5 }) <= 160, 'APD never exceeds 80% of the cycle');

// 12. His-Purkinje participation: without it the ventricles activate late and the QRS widens
const lvFree = [0.9, -0.3, 0.1];
const withPurkinje = evaluateVertex3d(lvFree, 'lv', 'sinus');
const muscleOnly = evaluateVertex3d(lvFree, 'lv', 'sinus', { ...DEFAULT_LEVERS, conductionParticipates: false });
assert.ok(muscleOnly.lat > withPurkinje.lat + 20, 'muscle-to-muscle spread is slower than Purkinje activation');

// 13. Stimulus trains: spikes, capture and the paced clock
const burst = buildStimTrain({ mode: 'burst', channelId: 'rv-d', bclMs: 240 });
assert.equal(burst.spikes.length, 8);
assert.equal(burst.durationMs, 8 * 240);
assert.deepEqual(pacedClock(burst, 250), { phase: 10, cycle: 240, prevCycle: 240 });
const firstBeat = pacedClock(burst, 5);
assert.equal(firstBeat.prevCycle, Infinity, 'no paced beat before the first stimulus');
assert.equal(activationAge(200, firstBeat), Infinity, 'tissue the first paced wave has not reached has not fired');
assert.equal(nearestActivationDelta(200, firstBeat), -195, 'no phantom deflection before the first paced wave arrives');
const gridTrain = buildStimTrain({ channelId: 'grid-a12', gridSite: { pos: ANCHORS.sa, chamber: 'ra' } });
assert.deepEqual([...gridTrain.pos], [...ANCHORS.sa], 'grid pacing starts where the grid sits');
assert.equal(gridTrain.chamber, 'ra');
for (const pt of [lvFree, ANCHORS.rvApex, [0.9, -0.9, 0.9]]) {
  const afLat = evaluateVertex3d(pt, 'lv', 'af', { ...DEFAULT_LEVERS, conductionParticipates: false, ventricularCv: 0.3 }).lat;
  assert.ok(afLat < 440, `AF ventricular LAT stays inside the shortest RR: ${afLat}`);
}
const extra = buildStimTrain({ mode: 's1s2', channelId: 'hra-d', bclMs: 600, s2Ms: 280 });
assert.deepEqual([...extra.spikes], [0, 600, 1200, 1800, 2080]);
assert.equal(pacedClock(extra, 1900).cycle, 280, 'the last S1 is followed by the S2 coupling interval');
const blockedS2 = buildStimTrain({ mode: 's1s2', channelId: 'hra-d', bclMs: 600, s2Ms: 190, s2Captures: false });
assert.equal(pacedClock(blockedS2, 2000).phase, 200, 'a refractory S2 does not reset the clock');
assert.equal(pacedClock(buildStimTrain({ bclMs: 500, captures: false }), 100), null, 'underdrive pacing never captures');
const rvPacer = PACING_CHANNELS.find((pc) => pc.id === 'rv-d');
assert.ok(pacedLat(rvPacer.pos, 'rv', burst) < 5, 'tissue under the pacing bipole activates first');
assert.ok(pacedLat(ANCHORS.sa, 'ra', burst) > 90, 'atria follow RV pacing after the VA delay');

const underdrive = runStimManeuver({ scenarioId: 'avnrt', mode: 'burst', channelId: 'rv-d', bclMs: 500 });
assert.equal(underdrive.captures, false);
assert.equal(runStimManeuver({ scenarioId: 'sinus', mode: 's1s2', channelId: 'hra-d', s2Ms: 190 }).s2Captures, false);

// Paced polygraph: stimulus artifact on the pacing channel, rate follows the train
const pacedSampler = createChannelSampler('avnrt', DEFAULT_LEVERS, new Set(), { stim: burst });
const onSpike = pacedSampler(242);
assert.equal(onSpike.values['rv-d'], 1.8, 'pacing spike on the stimulated channel');
assert.equal(onSpike.pacing, true);
assert.equal(onSpike.tcl, 240);
assert.equal(onSpike.bpm, 250);

// 14. Each bipole names its two electrodes; the HD Grid channels follow the grid site
for (const ch of EAM3D_CHANNELS.filter((c) => c.catheter)) {
  assert.equal(ch.electrodes.length, 2, `${ch.id} electrode pair`);
  for (const idx of ch.electrodes) assert.ok(EAM3D_CATHETERS[ch.catheter].electrodes[idx], `${ch.id} electrode ${idx}`);
}
const lit = sampleChannelsAt(0, 'sinus').litChannels;
assert.ok(lit.every((id) => EAM3D_CHANNELS.some((c) => c.id === id)), 'lit entries are channel ids');
const gridAtSa = createChannelSampler('sinus', DEFAULT_LEVERS, new Set(), { gridSite: { pos: ANCHORS.sa, chamber: 'ra' } });
assert.ok(gridAtSa(0).litChannels.includes('grid-a12'), 'grid moved onto the sinus node records the earliest atrial activation');
assert.ok(!sampleChannelsAt(0, 'sinus').litChannels.includes('grid-a12'), 'grid on the LV scar is silent at sinus onset');

// 15. Ablation ends the arrhythmia on the monitor too (narrow QRS, sinus rate)
const afterAblation = sampleChannelsAt(0, 'vt-ischemic', DEFAULT_LEVERS, new Set(['vt-isthmus-dechannel']));
assert.equal(afterAblation.tcl, 833);

// 16. Rhythm timeline: history stays, a pacing train is followed by its outcome
const timeline = createRhythmTimeline({ scenarioId: 'avnrt' });
assert.equal(timeline.at(-500).scenarioId, 'avnrt', 'times before the start fall on the first segment');
const train = buildStimTrain({ mode: 'burst', channelId: 'rv-d', bclMs: 240 });
timeline.startAt(1000, { scenarioId: 'avnrt', stim: train });
timeline.startAt(1000 + train.durationMs, { scenarioId: 'sinus' });
assert.equal(timeline.at(900).stim, null, 'tachycardia before the train is kept');
assert.equal(timeline.at(1500).stim, train);
assert.equal(timeline.isPacingAt(1500), true);
assert.equal(timeline.isPacingAt(900), false);
assert.equal(timeline.at(1000 + train.durationMs).scenarioId, 'sinus', 'outcome rhythm follows the last stimulus');
assert.equal(timeline.isPacingAt(1000 + train.durationMs), false);
assert.deepEqual(timeline.rhythmAt(1500), { scenario: 'avnrt', stim: train, timeMs: 500 });
assert.deepEqual(timeline.rhythmAt(1000 + train.durationMs + 40), { scenario: 'sinus', stim: null, timeMs: 40 });
// A new rhythm during the train drops the scheduled outcome
timeline.startAt(1600, { scenarioId: 'af', ablated: ['cti-line'] });
assert.equal(timeline.at(5000).scenarioId, 'af');
assert.deepEqual([...timeline.at(5000).ablated], ['cti-line']);
assert.equal(timeline.list().length, 3);
assert.equal(timeline.isPacingAt(1700), false);
// Segment-zero replacement and the history cap
const capped = createRhythmTimeline({ scenarioId: 'sinus' });
capped.startAt(0, { scenarioId: 'avnrt' });
assert.equal(capped.list().length, 1, 'a rhythm started at time 0 replaces the initial one');
for (let i = 1; i <= 30; i++) capped.startAt(i * 100, { scenarioId: 'sinus' });
assert.equal(capped.list().length, 12, 'old segments are pruned');
assert.equal(polygraphWindowMs(100), 1200);
assert.equal(polygraphWindowMs(25), 4800);

// 17. Mapping catheters: published electrode layouts and each system's colour convention
const penta = MAPPING_CATHETERS.pentaray;
const hdGrid = MAPPING_CATHETERS.hdgrid;
assert.equal(penta.electrodes.length, 20, 'PentaRay: 5 splines x 4 electrodes');
assert.equal(hdGrid.electrodes.length, 16, 'HD Grid: 4 x 4 electrodes');
assert.equal(penta.system, 'carto');
assert.equal(hdGrid.system, 'ensite');
const gapMm = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const firstSpline = penta.electrodes.filter((e) => e.spline === 0);
assert.deepEqual(
  [0, 1, 2].map((k) => Math.round(gapMm(firstSpline[k], firstSpline[k + 1]))),
  [2, 6, 2],
  'PentaRay 2-6-2 mm spacing'
);
for (const [a, b] of hdGrid.bipoles) {
  assert.equal(Math.round(gapMm(hdGrid.electrodes[a], hdGrid.electrodes[b])), 3, 'HD Grid bipoles are 3 mm, along and across');
}
assert.equal(hdGrid.bipoles.length, 24, 'HD Wave: 12 along + 12 across the splines');
assert.equal(penta.bipoles.length, 10, 'PentaRay: two 2 mm pairs per spline');
assert.equal(MAP_PALETTES.carto.lat[0], '#ff0000', 'CARTO: red is earliest');
assert.equal(MAP_PALETTES.ensite.lat[0], '#ffffff', 'EnSite: white is earliest');
assert.notDeepEqual(MAP_PALETTES.carto.lat, MAP_PALETTES.ensite.lat);
assert.equal(MAP_PALETTES.ensite.lat[MAP_PALETTES.ensite.lat.length - 1], '#7800c8', 'EnSite: purple is latest');
// Voltage: both systems use the 0.5-1.5 mV window; below it CARTO stays red, EnSite turns grey
assert.deepEqual(voltageScale('ensite', 0.3), { below: true, t: 0 });
assert.deepEqual(voltageScale('ensite', 1.0), { below: false, t: 0.5 });
assert.equal(voltageScale('carto', 2.4).t, 1, 'healthy tissue is at the top of the scale');
assert.equal(MAP_PALETTES.carto.belowWindow, MAP_PALETTES.carto.voltage[0], 'CARTO: low voltage is red');
assert.equal(MAP_PALETTES.ensite.belowWindow, MAP_PALETTES.ensite.scar, 'EnSite: low voltage is grey scar');
assert.notEqual(MAP_PALETTES.ensite.unmapped, MAP_PALETTES.ensite.scar, 'unmapped shell is not confused with scar');
assert.notEqual(hdGrid.color, penta.color, 'each catheter has its own colour');

// 18. Reference-relative LAT and the window of interest
assert.equal(relativeLat(230, 10, 240, true), -20, 'reentry: late activation wraps to just before the reference');
assert.equal(relativeLat(230, 10, 833, false), 220, 'focal / sinus rhythm is not wrapped');
assert.equal(relativeLat(130, 10, 240, true), -120, 'the window of interest spans one cycle');

// 19. One acquired beat: contact, noise, scar and unstable cycles
const flat = (wallMm) => hdGrid.electrodes.map((e) => ({ pos: [e.x / 36, e.y / 36, 0], wallMm }));
const healthy = () => ({ lat: 100, bipolar: 2.4, tissue: 'normal' });
const stable = { tcl: 400, reentrant: false, stableCycle: true, refLat: 0 };
const beat = acquireBeat({ electrodes: flat(0.5), bipoles: hdGrid.bipoles, truthAt: healthy, rhythm: stable, rng: createRng(7) });
assert.equal(beat.length, 24, 'one point per bipole');
assert.ok(beat.every((p) => p.accepted && p.lat !== null));
assert.ok(beat.every((p) => Math.abs(p.lat - 100) <= 4 * MAPPING_SETTINGS.latNoiseMs), 'LAT scatter stays within a few ms');
assert.ok(new Set(beat.map((p) => p.lat)).size > 1, 'points are not identical: beat-to-beat noise');
const replay = acquireBeat({ electrodes: flat(0.5), bipoles: hdGrid.bipoles, truthAt: healthy, rhythm: stable, rng: createRng(7) });
assert.deepEqual(replay, beat, 'the same seed replays the same acquisition');
const floating = acquireBeat({ electrodes: flat(6), bipoles: hdGrid.bipoles, truthAt: healthy, rhythm: stable, rng: createRng(7) });
assert.ok(floating.every((p) => !p.accepted && p.reason === 'no-contact'), 'a floating catheter gives no points');
const scarBeat = acquireBeat({ electrodes: flat(0.5), bipoles: hdGrid.bipoles, truthAt: () => ({ lat: 100, bipolar: 0.1, tissue: 'scar' }), rhythm: stable, rng: createRng(7) });
assert.ok(scarBeat.every((p) => p.accepted && p.lat === null && p.bipolar < 0.5), 'dense scar: voltage point without LAT');
const afBeat = acquireBeat({ electrodes: flat(0.5), bipoles: hdGrid.bipoles, truthAt: healthy, rhythm: { ...stable, stableCycle: false }, rng: createRng(7) });
assert.ok(afBeat.every((p) => p.accepted && p.lat === null), 'unstable cycle (AF): voltage only');
const liftedVolt = acquireBeat({ electrodes: flat(3), bipoles: [[0, 1]], truthAt: healthy, rhythm: stable, rng: createRng(3) })[0].bipolar;
const contactVolt = acquireBeat({ electrodes: flat(0), bipoles: [[0, 1]], truthAt: healthy, rhythm: stable, rng: createRng(3) })[0].bipolar;
assert.ok(liftedVolt < contactVolt, 'poor contact lowers the recorded voltage');

const summary = summarizeSession({ points: [...beat, ...floating, ...scarBeat], mappedVertices: 250, totalVertices: 1000, beats: 3, elapsedMs: 1200 });
assert.equal(summary.pointsTaken, 72);
assert.equal(summary.pointsUsed, 48);
assert.equal(summary.latPoints, 24);
assert.equal(summary.coveragePct, 25);
assert.equal(summary.lowVoltagePct, 50, 'half of the used points are scar');

console.log('PASS test-eam3d: four-chamber 3D EAM model, catheters, polygraph, stimulation, RF ablation & probabilistic circuit survey');

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
  runCircuitSurvey
} from '../../src/eps/eam3d-model.js';
import { EAM3D_TEXT } from '../../src/eps/eam3d-text.js';

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

console.log('PASS test-eam3d: four-chamber 3D EAM model, catheters, polygraph, stimulation, RF ablation & probabilistic circuit survey');

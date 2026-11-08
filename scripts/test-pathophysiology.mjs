import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  PATHOPHYS_STATIONS,
  PV_SCENARIOS,
  FORRESTER_PROFILES,
  ATHEROMA_STAGES,
  ATHEROMA_MODIFIERS,
  PATHOPHYS_GROUPS
} from '../src/pathophysiology/pathophysiology-data.js';

import { createPVLoopLab } from '../src/pathophysiology/pv-loop-lab.js';
import { createStarlingLaplaceLab } from '../src/pathophysiology/starling-laplace-lab.js';
import { createAtherogenesisLab } from '../src/pathophysiology/atherogenesis-lab.js';
import { createElectrophysLab } from '../src/pathophysiology/electrophys-lab.js';
import { cytosolicCalciumAt, ventricularFrameAt, VENTRICULAR_PLAYBACK_MS } from '../src/pathophysiology/ventricular-ap-scene.js';
import { createForresterLab } from '../src/pathophysiology/forrester-lab.js';
import { createValvularLab } from '../src/pathophysiology/valvular-lab.js';
import { createIschemicCascadeLab } from '../src/pathophysiology/ischemic-cascade-lab.js';
import { createHeartFailureLab } from '../src/pathophysiology/heart-failure-lab.js';
import { createPericardialLab } from '../src/pathophysiology/pericardial-lab.js';
import {
  laplaceStresses, dilatedAorta, aortaZone, wallShear, shearZone, poiseuilleVelocity,
  pulsePressureAt, oscillatoryShearIndex, MMHG_TO_KPA
} from '../src/pathophysiology/vessel-wall-model.js';
import { laplaceSvg, aortaSvg, shearSvg, lumenHalf } from '../src/pathophysiology/vessel-wall-svg.js';
import { VW_TEXT } from '../src/pathophysiology/vessel-wall-text.js';

test('Pathophysiology: data structures and bilingual integrity', () => {
  assert.equal(PATHOPHYS_STATIONS.length, 16, 'Should have exactly 16 didactic stations');
  for (const st of PATHOPHYS_STATIONS) assert.ok(PATHOPHYS_GROUPS.some(g => g.id === st.group), `${st.id} belongs to a known group`);
  assert.equal(ATHEROMA_MODIFIERS.length, 4, 'four systemic atheroma phenotypes');
  for (const id of ['loads', 'physiology', 'wiggers', 'hypertension-vascular', 'pah-rv', 'myocardial-ckm', 'achd-shunts', 'ischemic-cascade', 'heart-failure', 'pericardial']) {
    assert.ok(PATHOPHYS_STATIONS.some(s => s.id === id), `${id} station is present`);
  }

  for (const station of PATHOPHYS_STATIONS) {
    assert.ok(station.id, 'Station must have an id');
    assert.ok(station.num, 'Station must have a number');
    assert.ok(station.title.tr && station.title.en, `Station ${station.id} must have bilingual title`);
    assert.ok(station.shortTitle.tr && station.shortTitle.en, `Station ${station.id} must have bilingual shortTitle`);
    assert.ok(station.intro.tr && station.intro.en, `Station ${station.id} must have bilingual intro`);
  }

  assert.ok(PV_SCENARIOS.length >= 6, 'Should have at least 6 PV loop scenarios');
  for (const sc of PV_SCENARIOS) {
    assert.ok(sc.id && sc.name.tr && sc.name.en && sc.desc.tr && sc.desc.en, `Scenario ${sc.id} must be complete`);
    assert.ok(sc.params.edv > 0 && sc.params.ees > 0 && sc.params.ea > 0, `Scenario ${sc.id} params must be valid`);
  }

  assert.equal(FORRESTER_PROFILES.length, 4, 'Should have 4 Forrester clinical subsets');
  for (const prof of FORRESTER_PROFILES) {
    assert.ok(prof.id && prof.ci > 0 && prof.pcwp > 0);
    assert.ok(prof.name.tr && prof.name.en);
    assert.ok(prof.clinical.tr && prof.clinical.en);
    assert.ok(prof.management.tr && prof.management.en);
  }

  assert.equal(ATHEROMA_STAGES.length, 5, 'Should have 5 atheroma stages');
  for (const st of ATHEROMA_STAGES) {
    assert.ok(st.stage >= 1 && st.stage <= 5);
    assert.ok(st.title.tr && st.title.en);
    assert.ok(st.desc.tr && st.desc.en);
    assert.ok(Array.isArray(st.features) && st.features.length >= 3);
  }
});

test('Pathophysiology: lab factories are functions', () => {
  assert.equal(typeof createPVLoopLab, 'function');
  assert.equal(typeof createStarlingLaplaceLab, 'function');
  assert.equal(typeof createAtherogenesisLab, 'function');
  assert.equal(typeof createElectrophysLab, 'function');
  assert.equal(typeof createForresterLab, 'function');
  assert.equal(typeof createValvularLab, 'function');
  assert.equal(typeof createIschemicCascadeLab, 'function');
  assert.equal(typeof createHeartFailureLab, 'function');
  assert.equal(typeof createPericardialLab, 'function');
});

test('Ventricular animation: short early phases stay visible without stretching the voltage axis', () => {
  const phases = [
    [0, 0, 4, []],
    [1200, 60, 0, ['na']],
    [2600, 65, 1, ['ito']],
    [3650, 78, 2, ['ca', 'k']],
    [5850, 190, 3, ['k']],
    [7950, 315, 4, []],
    [VENTRICULAR_PLAYBACK_MS, 500, 4, []]
  ];
  for (const [elapsed, time, phase, gates] of phases) {
    const frame = ventricularFrameAt(elapsed);
    assert.equal(frame.time, time);
    assert.equal(frame.phase, phase);
    assert.deepEqual(frame.gates ?? [], gates);
  }
  assert.equal(ventricularFrameAt(1900).time, 62.5);
});

test('Ventricular animation: cytosolic Ca²⁺ rises after Ca²⁺ entry and outlasts repolarization', () => {
  assert.deepEqual(cytosolicCalciumAt(65), { stage: 'basal', level: 0 });
  assert.deepEqual(cytosolicCalciumAt(78), { stage: 'rising', level: 0 });
  assert.ok(cytosolicCalciumAt(105).level > 0 && cytosolicCalciumAt(105).level < 1);
  assert.deepEqual(cytosolicCalciumAt(130), { stage: 'falling', level: 1 });
  const duringRepolarization = cytosolicCalciumAt(230).level;
  const afterRepolarization = cytosolicCalciumAt(325).level;
  assert.ok(duringRepolarization < 1 && duringRepolarization > afterRepolarization && afterRepolarization > 0);
  assert.deepEqual(cytosolicCalciumAt(420), { stage: 'basal', level: 0 });
});

test('Pathophysiology: zero em-dashes house rule across all files', () => {
  const files = [
    'src/pathophysiology/pathophysiology-data.js',
    'src/pathophysiology/pv-loop-lab.js',
    'src/pathophysiology/starling-laplace-lab.js',
    'src/pathophysiology/atherogenesis-lab.js',
    'src/pathophysiology/ischemic-cascade-lab.js',
    'src/pathophysiology/heart-failure-lab.js',
    'src/pathophysiology/pericardial-lab.js',
    'src/pathophysiology/electrophys-lab.js',
    'src/pathophysiology/forrester-lab.js',
    'src/pathophysiology/valvular-lab.js',
    'src/pathophysiology/hypertension-lab.js',
    'src/pathophysiology/pah-rv-lab.js',
    'src/pathophysiology/myocardial-ckm-lab.js',
    'src/pathophysiology/achd-shunts-lab.js',
    'src/pathophysiology/vessel-wall-model.js',
    'src/pathophysiology/vessel-wall-svg.js',
    'src/pathophysiology/vessel-wall-text.js',
    'src/pathophysiology/vessel-wall-lab.js',
    'src/pathophysiology/vessel-wall.css',
    'src/pathophysiology/pathophysiology.css',
    'src/pathophysiology/main.js',
    'pathophysiology/index.html'
  ];

  for (const rel of files) {
    const full = resolve(process.cwd(), rel);
    assert.ok(existsSync(full), `File ${rel} must exist`);
    const content = readFileSync(full, 'utf8');
    assert.ok(!content.includes('\u2014'), `File ${rel} must not contain em-dash character`);
  }
});

test('Pathophysiology: index.html has valid metadata and version alignment', () => {
  const html = readFileSync(resolve(process.cwd(), 'pathophysiology/index.html'), 'utf8');
  assert.match(html, /data-site-page="pathophysiology"/);
  assert.match(html, /name="app-version"\s+content="1\.17\.0"/);
  assert.match(html, /name="app-build"\s+content="v17"/);
  assert.match(html, /data-cardia-root="\.\.\/"/);
});

test('Vessel wall: Laplace stresses of a thin-walled cylinder', () => {
  const s = laplaceStresses({ pInt: 120, pExt: 0, r: 12.5, h: 2 });
  assert.ok(Math.abs(s.hoop - (120 * 12.5 / 2) * MMHG_TO_KPA) < 1e-9, 'hoop = P r / h');
  assert.ok(Math.abs(s.axial - s.hoop / 2) < 1e-9, 'axial is half the hoop stress');
  assert.ok(Math.abs(s.radialInner + 120 * MMHG_TO_KPA) < 1e-9, 'radial stress at the intima equals -Pint');
  assert.ok(s.hoop > Math.abs(s.radialInner) * 6, 'hoop dominates radial by about r/h');
  const ext = laplaceStresses({ pInt: 120, pExt: 30, r: 12.5, h: 2 });
  assert.equal(ext.transmural, 90);
  assert.ok(ext.hoop < s.hoop, 'external pressure lowers transmural stress');
  const thick = laplaceStresses({ pInt: 180, r: 13.5, h: 3 });
  const thin = laplaceStresses({ pInt: 180, r: 13.5, h: 2 });
  assert.ok(Math.abs(thin.hoop / thick.hoop - 1.5) < 1e-9, 'hypertrophy lowers stress in proportion to h');
});

test('Vessel wall: dilated aorta stress rises with the square of the diameter', () => {
  const ref = dilatedAorta({ diameter: 32, pressure: 120 });
  assert.ok(Math.abs(ref.ratio - 1) < 1e-9);
  const big = dilatedAorta({ diameter: 64, pressure: 120 });
  assert.ok(Math.abs(big.ratio - 4) < 1e-9, 'double diameter at constant wall mass = 4x stress');
  assert.ok(big.wall < ref.wall, 'wall thins');
  assert.deepEqual([38, 45, 52, 56].map(aortaZone), ['normal', 'dilated', 'high-risk', 'surgery']);
});

test('Vessel wall: Hagen-Poiseuille wall shear', () => {
  const c = wallShear({ vMean: 0.2, diameter: 3.5, viscosity: 3.5 });
  assert.ok(Math.abs(c.tau - 8 * 0.0035 * 0.2 / 0.0035) < 1e-9, 'tau = 8 mu V / D');
  assert.ok(Math.abs(c.dyn - c.tau * 10) < 1e-9, '1 Pa = 10 dyn/cm2');
  assert.equal(c.zone, 'protective');
  assert.equal(wallShear({ vMean: 0.07, diameter: 6 }).zone, 'low');
  assert.equal(wallShear({ vMean: 0.9, diameter: 1.4 }).zone, 'high');
  assert.ok(wallShear({ vMean: 0.2, diameter: 3.5, viscosity: 6 }).tau > c.tau, 'viscosity raises shear');
  assert.deepEqual([0.2, 1, 3, 9].map(shearZone), ['low', 'intermediate', 'protective', 'high']);
  assert.equal(poiseuilleVelocity(0.2, 0), 0.4, 'centreline is twice the mean');
  assert.equal(poiseuilleVelocity(0.2, 1), 0, 'no slip at the wall');
  assert.ok(c.reynolds < 2000, 'coronary flow is laminar');
});

test('Vessel wall: pulse and oscillatory shear', () => {
  for (let i = 0; i < 20; i++) {
    const p = pulsePressureAt(i / 20, 120, 80);
    assert.ok(p >= 80 - 1e-9 && p <= 120 + 1e-9, 'pressure stays between DBP and SBP');
  }
  assert.equal(oscillatoryShearIndex(false), 0, 'laminar flow never reverses');
  const osi = oscillatoryShearIndex(true);
  assert.ok(osi > 0.1 && osi < 0.5, `bifurcation OSI ${osi}`);
});

test('Vessel wall: SVG frames are well formed and bilingual text is complete', () => {
  const t = VW_TEXT.tr;
  const a = laplaceSvg({ pNow: 110, pExt: 20, r: 12.5, h: 2, hoop: 100, axial: 50, hoopNow: 90, pulse: 0.5 }, t);
  assert.match(a, /data-vw-hoop/);
  assert.match(a, /P<tspan class="vw-sub">ext/);
  const b = aortaSvg({ diameter: 60, wall: 1.2, hoop: 300, hoopNow: 260, ratio: 3.5, pNow: 120, pulse: 0.2 }, t);
  assert.match(b, /d 60 mm/);
  const c = shearSvg({ diameter: 3.5, factor: -0.4, tauNow: -0.6, zone: 'low', particles: [{ x: 10, rho: 0.2 }] }, t);
  assert.equal((c.match(/class="vw-rbc"/g) || []).length, 1);
  assert.ok(!/NaN|undefined/.test(a + b + c), 'no NaN or undefined in markup');
  assert.ok(lumenHalf(30) <= 76 && lumenHalf(1) >= 22);
  const keys = o => Object.keys(o).sort().join();
  assert.equal(keys(VW_TEXT.tr), keys(VW_TEXT.en));
  for (const k of ['lapPresets', 'shPresets', 'zones', 'shZones', 'layers']) assert.equal(keys(VW_TEXT.tr[k]), keys(VW_TEXT.en[k]), k);
});

test('Regurgitation lab: acute vs chronic MR/AR hemodynamics and geometry', async () => {
  const { regurgParams, pressuresAt, jetIntensity, earlyMitralClosure, heartGeometry, valveOpenness, cycleWindows } =
    await import('../src/pathophysiology/regurgitation-lab.js');
  const win = cycleWindows();
  const sys = (win.ej0 + win.ej1) / 2, earlyDia = 0.05, endDia = win.ivc0 - 0.005;
  const peak = (p, key) => Math.max(...Array.from({ length: 200 }, (_, i) => pressuresAt(p, i / 200)[key]));
  const mrA = regurgParams('mr', 0), mrC = regurgParams('mr', 1), arA = regurgParams('ar', 0), arC = regurgParams('ar', 1);
  assert.ok(peak(mrA, 'la') > 2 * peak(mrC, 'la'), 'acute MR: giant v wave versus a modest v in the compliant LA');
  assert.ok(pressuresAt(mrA, endDia).lv > 20 && pressuresAt(mrC, endDia).lv < 16, 'LVEDP high acutely, near normal chronically');
  assert.ok(jetIntensity(mrA, sys) > 0.5 && jetIntensity(mrA, earlyDia) === 0, 'MR jet is systolic only');
  assert.ok(jetIntensity(arC, earlyDia) > 0.5 && jetIntensity(arC, sys) === 0, 'AR jet is diastolic only');
  assert.ok(earlyMitralClosure(arA) < win.ivc0 - 0.1 && earlyMitralClosure(arC) === null, 'early MV closure only in acute AR');
  const pp = p => peak(p, 'ao') - Math.min(...Array.from({ length: 200 }, (_, i) => pressuresAt(p, i / 200).ao));
  assert.ok(pp(arC) > 90 && pp(arA) < 50, 'wide pulse pressure in chronic AR only');
  assert.ok(heartGeometry(mrC, 0).a > heartGeometry(mrA, 0).a && heartGeometry(mrC, 0).la.rx > heartGeometry(mrA, 0).la.rx, 'chronic MR dilates LV and LA');
  assert.equal(heartGeometry(arC, 0).la.rx, heartGeometry(arA, 0).la.rx, 'LA size unchanged in AR');
  assert.ok(heartGeometry(mrA, 1).a < heartGeometry(mrA, 0).a, 'LV cavity shrinks in systole');
  assert.ok(valveOpenness(0.2).mv > 0.9 && valveOpenness(0.2).av === 0 && valveOpenness(sys).av > 0.9 && valveOpenness(sys).mv === 0, 'MV open in filling, AV in ejection');
  const mid = regurgParams('mr', 0.5);
  assert.ok(mid.lvA > mrA.lvA && mid.lvA < mrC.lvA, 'chronicity interpolates geometry');
});

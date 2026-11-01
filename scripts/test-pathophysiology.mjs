import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  PATHOPHYS_STATIONS,
  PV_SCENARIOS,
  FORRESTER_PROFILES,
  ATHEROMA_STAGES
} from '../src/pathophysiology/pathophysiology-data.js';

import { createPVLoopLab } from '../src/pathophysiology/pv-loop-lab.js';
import { createStarlingLaplaceLab } from '../src/pathophysiology/starling-laplace-lab.js';
import { createAtherogenesisLab } from '../src/pathophysiology/atherogenesis-lab.js';
import { createElectrophysLab } from '../src/pathophysiology/electrophys-lab.js';
import { createForresterLab } from '../src/pathophysiology/forrester-lab.js';
import { createValvularLab } from '../src/pathophysiology/valvular-lab.js';

test('Pathophysiology: data structures and bilingual integrity', () => {
  assert.equal(PATHOPHYS_STATIONS.length, 6, 'Should have exactly 6 didactic stations');

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
});

test('Pathophysiology: zero em-dashes house rule across all files', () => {
  const files = [
    'src/pathophysiology/pathophysiology-data.js',
    'src/pathophysiology/pv-loop-lab.js',
    'src/pathophysiology/starling-laplace-lab.js',
    'src/pathophysiology/atherogenesis-lab.js',
    'src/pathophysiology/electrophys-lab.js',
    'src/pathophysiology/forrester-lab.js',
    'src/pathophysiology/valvular-lab.js',
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

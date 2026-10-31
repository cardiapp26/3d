// Transseptal guide content: TR/EN parity, sources, quiz keys, the LA
// confirmation rule, the clock verdicts, the pullback jumps and the site map.
import assert from 'node:assert/strict';
import * as data from '../src/transseptal-guide-data.js';
import { TS_SITES } from '../src/transseptal-sites.js';
import { pullbackState, sitePoint, hourAtPoint, JUMP_AT, TENT_AT } from '../src/transseptal-guide-figures.js';

const { TS_SOURCES, TS_GUIDE_TABS, TS_GUIDE_WORDS, TS_EQUIPMENT, TS_PROCEDURE, TS_LA_SIGNS, laVerdict, TS_LA_VERDICT_TEXT,
  TS_SITE_GUIDE, TS_TROUBLE, TS_COMPLICATIONS, TS_HISTORY, TS_QUIZ, clockVerdict, TS_CLOCK_TEXT, TS_NEEDLE_POSITIONS } = data;

// Every bilingual pair has non-empty TR and EN text and no em dash anywhere.
let pairs = 0;
(function walk(v, path) {
  if (v && typeof v === 'object') {
    if ('tr' in v && 'en' in v && typeof v.tr === 'string') {
      pairs++;
      assert.ok(v.tr.trim() && v.en.trim(), `empty text at ${path}`);
      assert.notEqual(v.tr, '', path);
    }
    for (const [k, c] of Object.entries(v)) walk(c, `${path}.${k}`);
  } else if (typeof v === 'string') assert.ok(!v.includes('\u2014'), `em dash at ${path}`);
})(data, 'data');
assert.ok(pairs > 150, `bilingual pairs: ${pairs}`);
assert.deepEqual(Object.keys(TS_GUIDE_WORDS.tr).sort(), Object.keys(TS_GUIDE_WORDS.en).sort(), 'UI words match in TR and EN');

// Sources: every card cites at least one known source.
for (const list of [TS_EQUIPMENT, TS_PROCEDURE, TS_SITE_GUIDE, TS_TROUBLE, TS_COMPLICATIONS, TS_HISTORY]) {
  for (const item of list) {
    assert.ok(item.sources?.length, 'card has sources');
    for (const key of item.sources) assert.ok(TS_SOURCES[key], `unknown source ${key}`);
  }
}
assert.equal(TS_GUIDE_TABS.length, 8);

// Procedure: ten steps in order, each mapped to a 3D lesson step (0..3).
assert.equal(TS_PROCEDURE.length, 10);
for (const s of TS_PROCEDURE) assert.ok(Number.isInteger(s.lesson) && s.lesson >= 0 && s.lesson <= 3);
assert.deepEqual(TS_PROCEDURE.map(s => s.stage).slice(4, 6), ['jump1', 'fossa'], 'two jumps before the puncture');

// Equipment: the needle never protrudes before the puncture position.
assert.deepEqual(TS_NEEDLE_POSITIONS.map(p => p.safe), [true, true, false]);
assert.ok(TS_NEEDLE_POSITIONS.every(p => (p.mm < 0) === p.safe));

// LA confirmation: two signs with one objective; alarm signs win.
assert.equal(laVerdict([]).reason, 'none');
assert.equal(laVerdict(['give']).ok, false);
assert.equal(laVerdict(['give', 'tent']).ok, false, 'two subjective signs are not enough');
assert.equal(laVerdict(['pressure', 'tent']).ok, true);
assert.equal(laVerdict(['pressure', 'sat', 'aortic']).reason, 'aortic');
assert.equal(laVerdict(['contrast', 'pericardial']).reason, 'pericardial');
for (const s of TS_LA_SIGNS.filter(x => x.trap)) assert.ok(TS_LA_VERDICT_TEXT[s.id], `alarm text for ${s.id}`);

// Clock: 4-5:30 is the pullback window, 12 anterior, 3 after crossing.
assert.equal(clockVerdict(4), 'ok');
assert.equal(clockVerdict(5.5), 'ok');
assert.equal(clockVerdict(12), 'anterior');
assert.equal(clockVerdict(1), 'anterior');
assert.equal(clockVerdict(3), 'across');
assert.equal(clockVerdict(6), 'large-la');
assert.equal(clockVerdict(9), 'wrong');
for (let h = 0.5; h <= 12; h += 0.5) assert.ok(TS_CLOCK_TEXT[clockVerdict(h)], `text for ${h}`);
assert.equal(hourAtPoint(80, 10), 12);
assert.equal(hourAtPoint(150, 80), 3);
assert.equal(hourAtPoint(80, 150), 6);

// Pullback: the tip only moves down, with two lateral jumps, then the tent.
for (const view of ['lao', 'rao']) {
  let last = pullbackState(view, 0);
  assert.equal(last.jumps, 0);
  for (let t = 0.01; t <= 1.0001; t += 0.01) {
    const now = pullbackState(view, t);
    assert.ok(now.y >= last.y - 1e-9, `${view} tip moves down`);
    assert.ok(now.jumps >= last.jumps);
    last = now;
  }
  assert.equal(last.jumps, 2);
  assert.equal(last.tent, true);
  const before = pullbackState(view, JUMP_AT[1] - 0.001), after = pullbackState(view, JUMP_AT[1]);
  assert.ok(Math.abs(after.x - before.x) > 8, `${view} second jump is a visible step`);
  assert.equal(pullbackState(view, TENT_AT - 0.01).tent, false);
}
// LAO: the fossa lies toward the spine (posterior, right of image); RAO the opposite side.
assert.ok(pullbackState('lao', 1).x > pullbackState('lao', 0).x);
assert.ok(pullbackState('rao', 1).x < pullbackState('rao', 0).x);

// Sites: the guide covers every 3D ring, and the map keeps the anatomical order.
assert.deepEqual(TS_SITE_GUIDE.map(s => s.key).sort(), Object.keys(TS_SITES).sort());
assert.ok(sitePoint('laac').y > sitePoint('mitral').y, 'LAA occlusion below the mitral site');
assert.ok(sitePoint('laac').x < sitePoint('lv').x, 'LAA occlusion posterior to the LV site');
assert.ok(sitePoint('pfo').y < sitePoint('pvi').y && sitePoint('pfo').x > sitePoint('pvi').x, 'PFO superior-anterior');

// Quiz: valid keys, four options each.
assert.ok(TS_QUIZ.length >= 8);
for (const q of TS_QUIZ) {
  assert.equal(q.options.length, 4);
  assert.ok(q.answer >= 0 && q.answer < 4);
}
console.log(`PASS: transseptal guide content (${pairs} TR/EN pairs, ${TS_QUIZ.length} questions)`);

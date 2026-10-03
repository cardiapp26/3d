// Activation mapping model (src/eps/amap-model.js): each teaching claim of
// the Mapping tab, read from the grid. Focal maps do not depend on the
// reference; a right-atrium-only map of a left atrial focus looks septal; a
// macroreentry shows early meets late and its colours move with the
// reference; an old CTI line gives a focal tachycardia a false early meets
// late; one wrong point becomes the red spot; when the chamber activation
// time exceeds the cycle no window works and adjacent beats are mixed in,
// while the right atrium alone maps correctly.
import assert from 'node:assert/strict';
import {
  SCENARIOS, REFERENCES, GRID, RA_COLS, activationTimes, windowPreset, localTimes, readMap, colourIndex, cellOf, cellKey
} from '../../src/eps/amap-model.js';
import { AMAP_TEXT } from '../../src/eps/amap-text.js';

const map = (id, { reference = SCENARIOS[id].reference, kind = 'symmetric', region = SCENARIOS[id].region || 'both', artifact = null } = {}) => {
  const at = activationTimes(id);
  const r = at.time[cellKey(...REFERENCES[reference].at)];
  const win = windowPreset(kind, at, r);
  const out = localTimes(at, { reference, ...win, region, artifact });
  const reading = readMap(out.lat);
  const red = [...out.lat].filter(([, v]) => v != null && colourIndex(v, reading.min, reading.max) === 0).map(([k]) => cellOf(k));
  const centre = red.length ? red.reduce(([sx, sy], [x, y]) => [sx + x / red.length, sy + y / red.length], [0, 0]) : null;
  const wrong = [...out.beat.values()].filter((b) => b === -1 || b === 1).length;
  return { at, win, reading, centre, wrong, colours: [...out.lat].map(([k, v]) => [k, v == null ? null : colourIndex(v, reading.min, reading.max)]) };
};
const near = (c, [x, y], d = 2.5) => c && Math.hypot(c[0] - x, c[1] - y) <= d;

// Basic focal map: one red region at the focus, diastole between beats, same colours with any reference.
const focal = map('focal-ra');
assert.ok(focal.at.tcl - focal.at.activation > 100, 'X well above Y');
assert.equal(focal.reading.redRegions, 1);
assert.ok(near(focal.centre, SCENARIOS['focal-ra'].origin), `red at the focus ${focal.centre}`);
assert.equal(focal.reading.earlyMeetsLate, 0);
assert.deepEqual(map('focal-ra', { reference: 'crista' }).colours, focal.colours, 'focal: the reference does not change the colour map');

// Incomplete mapping: the right atrium alone puts red on the septum; both atria find the left atrial focus.
const raOnly = map('focal-la', { region: 'ra' }), both = map('focal-la');
assert.ok(raOnly.centre[0] >= RA_COLS - 3, `right atrium only: earliest on the septal side ${raOnly.centre}`);
assert.ok(near(both.centre, SCENARIOS['focal-la'].origin), 'both atria: the left atrial focus');

// Macroreentry: early meets late; changing the reference moves the red.
const fl = map('flutter'), flCrista = map('flutter', { reference: 'crista' });
assert.ok(fl.reading.earlyMeetsLate > 0 && flCrista.reading.earlyMeetsLate > 0, 'early meets late with either reference');
assert.ok(Math.hypot(fl.centre[0] - flCrista.centre[0], fl.centre[1] - flCrista.centre[1]) > 3, 'red moves with the reference');
assert.ok(fl.at.tcl >= 220 && fl.at.tcl <= 300, `flutter cycle ${fl.at.tcl}`);

// Line of block: a focal tachycardia with a false early meets late, red still at the focus.
const line = map('focal-cti-line');
assert.ok(line.reading.earlyMeetsLate > 0, 'false early meets late across the old CTI line');
assert.ok(near(line.centre, SCENARIOS['focal-cti-line'].origin), 'red at the focus');
assert.equal(map('focal-cti-line', { kind: 'dePonti' }).reading.redRegions, 1);

// One wrong point takes the red.
const art = map('focal-ra', { artifact: SCENARIOS['focal-ra'].artifact });
assert.ok(near(art.centre, SCENARIOS['focal-ra'].artifact, 1), 'the wrong point becomes the red spot');

// Windowing: Y > X across both atria; every window mixes beats; the right atrium alone maps correctly.
const slow = map('slow-scar');
assert.ok(slow.at.activation > slow.at.tcl, `Y ${slow.at.activation} > X ${slow.at.tcl}`);
assert.ok(slow.reading.redRegions > 1 && slow.wrong > 10 && !near(slow.centre, SCENARIOS['slow-scar'].origin, 4), 'symmetric window: misleading map');
assert.equal(windowPreset('dePonti', slow.at, 0), null, 'no diastole: no De Ponti window');
assert.ok(map('slow-scar', { kind: 'mgh' }).wrong > 0, 'MGH window cannot fix overlapping beats either');
const slowRa = map('slow-scar', { region: 'ra' });
assert.equal(slowRa.reading.redRegions, 1); assert.equal(slowRa.wrong, 0);
assert.ok(near(slowRa.centre, SCENARIOS['slow-scar'].origin), 'right atrium alone: red at the focus');

// LAT rule: inside the window, at most one cycle wide; a narrower window leaves points unannotated.
const at = activationTimes('focal-ra');
const narrow = localTimes(at, { reference: 'cs-56', left: -50, right: 20 });
assert.ok([...narrow.lat.values()].some((v) => v == null) && [...narrow.lat.values()].every((v) => v == null || (v >= -50 && v <= 20)));

// Texts for every scenario in both languages.
for (const lang of ['tr', 'en']) for (const id of Object.keys(SCENARIOS)) {
  const s = AMAP_TEXT[lang].scenarios[id];
  assert.ok(s.name && s.lesson.length > 80 && s.truth.length > 30, `${lang} ${id}`);
}
assert.equal(GRID.w * GRID.h, at.time.length);
console.log('PASS amap: focal map independent of the reference, incomplete mapping, macroreentry early meets late moving with the reference, CTI line false early meets late, one wrong point, windowing with Y > X (beats mixed, no De Ponti, right atrium alone correct), LAT rule, TR/EN texts');

// Chest-wall frame of the auscultation areas (src/chest-surface.js): right and
// left, sternal border versus midclavicular line, and the intercostal levels
// of A, P, E, T and M on one plane.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHEST, icsY, lineX, areaPoints, AREA_ADDRESS } from '../src/chest-surface.js';
import { AUSCULTATION_AREAS } from '../src/exam-findings.js';

const pts = areaPoints(2);
assert.deepEqual(Object.keys(pts).sort(), Object.keys(AUSCULTATION_AREAS).sort(), 'one address per area');
assert.ok(Object.values(pts).every((p) => p.z === 2), 'all areas on the same chest plane');

// Sides: +x is the patient's left. A right of the midline, P/E/T/M left of it.
assert.ok(pts.aortic.x < CHEST.midlineX, 'A: right sternal border');
for (const id of ['pulmonic', 'erb', 'tricuspid', 'mitral']) assert.ok(pts[id].x > CHEST.midlineX, `${id}: left of the midline`);
assert.equal(pts.aortic.x - CHEST.midlineX, -(pts.pulmonic.x - CHEST.midlineX), 'A and P mirror across the midline');
// Lines: A, P, E, T on the sternal border; M on the midclavicular line, well lateral to it.
for (const id of ['aortic', 'pulmonic', 'erb', 'tricuspid']) assert.equal(AREA_ADDRESS[id].line, 'sternal');
assert.equal(pts.mitral.x, lineX('left', 'mcl'));
assert.ok(pts.mitral.x - CHEST.midlineX > 3 * CHEST.sternalEdge, 'M lateral to the sternal border');

// Levels: A = P at the 2nd space; E one space lower; T across the 4th-5th spaces; M at the 5th.
assert.equal(pts.aortic.y, icsY(2));
assert.equal(pts.pulmonic.y, pts.aortic.y);
assert.ok(Math.abs(pts.pulmonic.y - pts.erb.y - CHEST.pitch) < 1e-9, 'E one intercostal space below P');
assert.ok(pts.tricuspid.y < icsY(4) && pts.tricuspid.y > icsY(5), 'T between the 4th and 5th spaces');
assert.equal(pts.mitral.y, icsY(5));
// The 2nd space lies half a pitch above the 3rd costal cartilage (pulmonary valve level).
assert.ok(Math.abs(icsY(2) - (CHEST.costal3Y + CHEST.pitch / 2)) < 1e-9);

assert.ok(!readFileSync(new URL('../src/chest-surface.js', import.meta.url), 'utf8').includes('\u2014'), 'no em dash');
console.log('PASS chest-surface: one chest plane, A right / P E T M left, sternal border vs MCL, 2nd/3rd/4-5th/5th intercostal levels');

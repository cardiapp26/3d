import assert from 'node:assert/strict';
import { CYCLE_SYNC as S } from '../src/cardiac-cycle.js';
import { FINDINGS } from '../src/exam-findings.js';
import {
  ACUTE_ROWS, ACUTE_TEXT, cursorX, isLit, phaseAtX, rowLabels, rowTitle, sampleAcuteStrip, stackRows
} from '../src/exam-acute-valves-model.js';

// Five rows A to E, each backed by a finding of the examination table
assert.deepEqual(ACUTE_ROWS.map(r => r.key), ['A', 'B', 'C', 'D', 'E']);
assert.deepEqual(ACUTE_ROWS.map(r => r.findingId),
  ['normal', 'acute_mitral_regurgitation', 'acute_aortic_regurgitation', 'mitral_stenosis', 'aortic_stenosis']);
for (const row of ACUTE_ROWS) assert.ok(FINDINGS[row.findingId], `${row.key}: finding exists`);

// Strips start at S1 and the cursor follows the shared clock
for (const bpm of [60, 72, 110]) {
  assert.ok(cursorX(S.avClosed, bpm) < 1e-9, `S1 at x = 0 (${bpm} bpm)`);
  assert.ok(Math.abs(phaseAtX(0, bpm) - S.avClosed) < 1e-3, 'x = 0 is S1');
  const a2 = cursorX(S.ivrStart, bpm);
  assert.ok(a2 > 0.25 && a2 < 0.6, `A2 inside the strip (${a2.toFixed(3)})`);
}
assert.ok(cursorX(0.7, 72) > cursorX(0.6, 72), 'cursor moves forward with the phase');

const strips = Object.fromEntries(ACUTE_ROWS.map(r => [r.key, sampleAcuteStrip(r.findingId, { bpm: 72, columns: 240 })]));
const labelsOf = s => s.sounds.map(x => x.label);
const at = (strip, label) => strip.sounds.find(x => x.label === label);
for (const [key, strip] of Object.entries(strips)) {
  assert.equal(strip.murmur.length, 240, `${key}: columns`);
  assert.ok(strip.sounds.every(x => x.x >= 0 && x.x < 1), `${key}: sounds inside the strip`);
  assert.ok(at(strip, 'A2').x < at(strip, 'P2').x, `${key}: A2 before P2`);
}

// A normal: no murmur
assert.equal(strips.A.segments.length, 0, 'A: no murmur');
// B acute MR: one systolic segment that ends well before A2, S3
assert.deepEqual(strips.B.segments.map(s => s.kind), ['systolic']);
assert.ok(strips.B.segments[0].x1 < at(strips.B, 'A2').x - 0.08, 'B: murmur stops well before A2');
assert.ok(labelsOf(strips.B).includes('S3'));
// C acute AR: soft systolic flow murmur and a short diastolic one
assert.deepEqual(strips.C.segments.map(s => s.kind), ['systolic', 'diastolic']);
const cDia = strips.C.segments[1], eDia = sampleAcuteStrip('aortic_regurgitation').segments.find(s => s.kind === 'diastolic');
assert.ok(cDia.x1 - cDia.x0 < 0.6 * (eDia.x1 - eDia.x0), 'C: diastolic murmur much shorter than in chronic AR');
assert.ok(at(strips.C, 'S1').amp < 0.3 && at(strips.C, 'P2').amp > at(strips.C, 'A2').amp, 'C: soft S1, loud P2');
// D chronic MS: OS after A2, diastolic rumble
assert.ok(at(strips.D, 'OS').x > at(strips.D, 'P2').x, 'D: opening snap after S2');
assert.deepEqual(strips.D.segments.map(s => s.kind), ['diastolic']);
// E chronic AS: systolic murmur peaking after mid-systole
assert.deepEqual(strips.E.segments.map(s => s.kind), ['systolic']);
const e = strips.E;
let peakI = 0;
for (let i = 0; i < e.murmur.length; i++) if (e.murmur[i] > e.murmur[peakI]) peakI = i;
assert.ok(peakI / 239 > at(e, 'A2').x / 2, 'E: mid-to-late peak');

// Labels: notes override sound names, murmur notes light while the cursor is inside
const rowC = ACUTE_ROWS[2];
const tr = rowLabels(rowC, strips.C, 'tr'), en = rowLabels(rowC, strips.C, 'en');
assert.ok(en.some(l => l.text === 'Soft or absent S1') && en.some(l => l.text === 'Loud P2'));
assert.ok(tr.some(l => l.text === 'P2 sert'));
assert.equal(en.find(l => l.id === 'A2').tone, 'aortic');
assert.equal(en.find(l => l.id === 'P2').tone, 'pulmonic');
const dia = en.find(l => l.id === 'diastolic');
assert.ok(isLit(dia, (dia.x0 + dia.x1) / 2) && !isLit(dia, 0.05), 'murmur label lit inside its span only');
const p2 = en.find(l => l.id === 'P2');
assert.ok(!isLit(p2, p2.x - 0.01) && isLit(p2, p2.x + 0.01), 'sound label lights as the cursor passes');
assert.ok(rowLabels(ACUTE_ROWS[0], strips.A, 'en').every(l => l.type === 'sound'), 'A: sound labels only');

// Stacking keeps neighbouring labels apart
const placed = stackRows(en.filter(l => l.type === 'sound'), t => t.length * 5, 348);
const byRow = {};
placed.forEach(p => (byRow[p.row] ||= []).push(p));
for (const list of Object.values(byRow)) for (let i = 1; i < list.length; i++) assert.ok(list[i].left > list[i - 1].left + list[i - 1].width, 'no overlap within a row');
assert.ok(placed.every(p => p.left >= 0 && p.left + p.width <= 348), 'labels inside the strip');

// Bilingual, no em dash
assert.equal(rowTitle(ACUTE_ROWS[1], 'en'), 'B. Acute severe MR');
const walk = v => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(walk) : []);
for (const s of [...walk(ACUTE_TEXT), ...walk(ACUTE_ROWS)]) assert.ok(!s.includes('\u2014'), `no em dash: ${s}`);
assert.deepEqual(Object.keys(ACUTE_TEXT.tr).sort(), Object.keys(ACUTE_TEXT.en).sort(), 'TR and EN keys match');

console.log('PASS: acute valvular emergencies comparison (5 rows, timing, labels, stacking)');

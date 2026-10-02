// User calipers (src/ep-user-caliper.js): click order, snapping to the
// nearest event, dragging one line, and the interval/rate readout.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { noCaliper, snapTime, placeCaliper, moveCaliper, caliperSpan, caliperText } from '../src/ep-user-caliper.js';
import { epRecording } from '../src/ep-cases.js';

const rec = epRecording('avnrt-typ-svt');
const vs = rec.events.rv.filter((e) => e.type === 'V').map((e) => e.t);
// A click within the snap radius lands on the event; outside it keeps the click time.
assert.equal(snapTime(rec, vs[1] + 5, ['rv']), Math.round(vs[1]));
assert.equal(snapTime(rec, vs[1] + 60, ['rv']), Math.round(vs[1] + 60));
assert.equal(snapTime(rec, Number.NaN, ['rv']), null);

let c = noCaliper();
c = placeCaliper(c, snapTime(rec, vs[1] - 3, ['rv']));
assert.equal(caliperSpan(c), null);
assert.match(caliperText(c, 'tr'), /ikinci/);
c = placeCaliper(c, snapTime(rec, vs[2] + 4, ['rv']));
assert.equal(caliperSpan(c), Math.round(vs[2] - vs[1]), 'V-V measured between the lines');
assert.match(caliperText(c, 'tr'), new RegExp(`${caliperSpan(c)} ms · ${Math.round(60000 / caliperSpan(c))} /dk`));
assert.match(caliperText(c, 'en'), /bpm/);
// A third click starts over; dragging moves one line only; the input is never mutated.
const before = { ...c };
assert.deepEqual(placeCaliper(c, 100), { a: 100, b: null });
assert.deepEqual(moveCaliper(c, 'b', 900), { a: c.a, b: 900 });
assert.deepEqual(c, before);
assert.equal(placeCaliper(c, Number.NaN), c);

assert.ok(!readFileSync(new URL('../src/ep-user-caliper.js', import.meta.url), 'utf8').includes('\u2014'), 'no em dash');
console.log('PASS ep-user-caliper: click order, event snapping, drag, interval and rate readout');

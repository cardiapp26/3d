import assert from 'node:assert/strict';
import { PHARMA_CASES, PHARMA_DRUGS, pharmaExamples, defaultPharma, pharmaComparison, pharmaMeasures } from '../src/ep-pharma.js';

let count = 0;
for (const caseId of PHARMA_CASES) for (const drug of PHARMA_DRUGS) for (const example of pharmaExamples(caseId)) {
  const choices = { ...defaultPharma(caseId), drug, example };
  const pair = pharmaComparison(choices);
  assert.deepEqual(pharmaComparison(choices), pair, 'deterministic drug example');
  assert.ok(Object.isFrozen(pair) && Object.isFrozen(pair.after.events), 'immutable result');
  for (const r of [pair.before, pair.after]) {
    for (const events of Object.values(r.events)) for (const e of events) {
      assert.ok(Number.isFinite(e.t) && e.t >= 0 && e.t <= r.windowMs, `${r.id}: event inside strip`);
    }
  }
  const before = pharmaMeasures(pair.before), after = pharmaMeasures(pair.after);
  if (example === 'sinus-av') {
    assert.equal(before.pp, 850);
    assert.ok(after.pp < before.pp && after.rate > before.rate, 'illustrative sinus acceleration');
    assert.equal(before.drive, 500);
    assert.equal(after.drive, before.drive, 'AH compared at identical pacing cycle length');
    assert.ok(before.drive < before.pp && after.drive < after.pp, 'paced drive overdrives intrinsic sinus');
    assert.equal(before.ah, 80);
    assert.ok(after.ah < before.ah, 'illustrative nodal conduction change');
    assert.equal(before.hv, 45);
    assert.equal(after.hv, before.hv, 'fixed HV in this teaching example');
    assert.equal(after.induced, false, 'sinus acceleration is not tachycardia induction');
  } else {
    assert.equal(before.s2, after.s2, 'identical induction protocol before and after');
    assert.equal(before.s2, 340);
    assert.equal(before.induced, false);
    assert.equal(after.induced, example === 'induced');
    assert.equal(after.echo, example === 'echo-only');
    if (example === 'echo-only') {
      assert.equal(after.va, caseId === 'avnrt-typical' ? 30 : 215);
      const h = pair.after.events['his-d'].filter((e) => e.type === 'H');
      assert.equal(h.length, 3, 'echo alone has no new His or QRS');
    }
    if (example === 'induced') assert.ok(after.tcl > 0, 'induced rhythm has measured cycle length');
    if (example === 'noninduced') assert.equal(after.tcl, null, 'no TCL without tachycardia');
  }
  count++;
}
assert.ok(!pharmaExamples('ap-left-lateral').includes('echo-only'), 'AV nodal echo example limited to nodal cases');
console.log(`PASS ep-pharma: ${count} paired drug examples, matched protocols, event-derived rate/AH/HV, single echo versus sustained induction and negative controls`);

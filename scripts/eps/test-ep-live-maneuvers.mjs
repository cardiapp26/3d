// Live EP laboratory maneuvers and protocols (src/ep-live-maneuvers.js) on the
// conduction model: His-refractory PVC, ventricular overdrive paced until the
// atrium is entrained (V-A-V / V-A-A-V, PPI - TCL, SA - VA), atrial
// entrainment of flutter by site, VT entrainment and antitachycardia pacing,
// AV block cycle length, programmed extrastimuli and SNRT. Read from events.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLiveHeart, planTrain } from '../../src/eps/ep-live-model.js';
import {
  tclBefore, hisPvcTime, analyzeHisPvc, overdriveStart, planOverdrive, atriumEntrained, analyzeOverdrive, interpretOverdrive,
  interpretSite, planProtocol, analyzeStep, summarizeProtocol, atrialCycle
} from '../../src/eps/ep-live-maneuvers.js';

const tr = (site, extras, s1 = 600, n = 8) => planTrain({ site, start: 1000, s1, n, extras });
const INDUCE = {
  'avnrt-typical': tr('hra', [370]), 'ort-left': tr('rv', [250]), 'at-focal': tr('hra', [], 300), 'avnrt-atypical': tr('rv', [330]),
  pjrt: tr('hra', [280]), 'flutter-cti': tr('hra', [], 250), 'vt-scar': tr('rv', [280, 260])
};
const running = (c) => { const h = createLiveHeart(c); h.stimulate(INDUCE[c]); h.advanceTo(9000); return h; };

// His-refractory PVC: advances the atrium over a pathway, not in AVNRT or AT.
const pvc = (c) => { const h = running(c); const s = hisPvcTime(h.events(0, 9000), 9000); h.stimulate([{ t: s, site: 'rv' }]); h.advanceTo(12500); return analyzeHisPvc(h.events(0, 12500), s); };
assert.equal(pvc('avnrt-typical').result, 'unchanged');
assert.equal(pvc('at-focal').result, 'unchanged');
assert.equal(pvc('ort-left').result, 'advanced');
assert.ok(pvc('ort-left').delta <= -30, 'ORT: atrium clearly advanced');

// Ventricular overdrive paced until atrial entrainment, then two beats.
function overdrive(c) {
  const h = running(c);
  const tcl = tclBefore(h.events(0, 9000), 9000);
  const st = planOverdrive({ site: 'rv', start: overdriveStart(h.events(0, 9000), 9000, 'rv', tcl), tcl, n: 30 });
  h.stimulate(st);
  let t = 9000, cut = null;
  while (t < st[st.length - 1].t + 3000) {
    t += 100; h.advanceTo(t);
    if (cut == null && atriumEntrained(h.events(0, t), st, t)) { cut = t + 2 * (st[1].t - st[0].t) - 10; h.stopPacing(cut); }
  }
  return analyzeOverdrive(h.events(0, t), st.filter((s) => s.t <= (cut ?? Infinity)));
}
const expected = { 'avnrt-typical': ['VAV', 'avnrt'], 'ort-left': ['VAV', 'avrt'], 'at-focal': ['VAAV', 'at'], 'avnrt-atypical': ['VAV', 'avnrt'], pjrt: ['VAV', 'avrt'] };
for (const [c, [response, verdict]] of Object.entries(expected)) {
  const r = overdrive(c);
  assert.ok(r.captured && r.entrained && !r.terminated, `${c}: entrained ${JSON.stringify(r)}`);
  assert.equal(r.response, response, `${c}: response`);
  assert.equal(interpretOverdrive(r), verdict, `${c}: verdict ${JSON.stringify(r)}`);
}
// Atypical AVNRT: a VA longer than the pacing cycle does not read as V-A-A-V (pseudo-V-A-A-V avoided).
assert.ok(overdrive('avnrt-atypical').saVa > 85);

// Flutter entrainment by site: CS proximal and HRA in the circuit, CS distal outside.
const flutterPpi = (site) => {
  const h = running('flutter-cti');
  const acl = atrialCycle(h.events(0, 9000), site, 9000);
  const st = planOverdrive({ site, start: overdriveStart(h.events(0, 9000), 9000, site, acl, 20), tcl: acl, offset: 20, n: 12 });
  h.stimulate(st); h.advanceTo(st[st.length - 1].t + 2500);
  return analyzeOverdrive(h.events(0, st[st.length - 1].t + 2500), st);
};
const prox = flutterPpi('cs-prox'), dist = flutterPpi('cs-dist');
assert.equal(prox.tcl, 240); assert.ok(prox.entrained && !prox.terminated);
assert.equal(interpretSite(prox), 'inCircuit'); assert.equal(interpretSite(flutterPpi('hra')), 'inCircuit', 'lateral RA is part of the CTI circuit');
assert.equal(interpretSite(dist), 'outside'); assert.ok(dist.ppiTcl > 100);

// VT: entrainment from the RV apex (outside the circuit) and termination by fast pacing (ATP).
{
  const h = running('vt-scar');
  let st = planOverdrive({ site: 'rv', start: overdriveStart(h.events(0, 9000), 9000, 'rv', 380), tcl: 380, offset: 30, n: 5 });
  h.stimulate(st); h.advanceTo(13000);
  const r = analyzeOverdrive(h.events(0, 13000), st);
  assert.ok(r.captured && !r.terminated && r.ppiTcl > 30, `VT entrainment ${JSON.stringify(r)}`);
  st = planOverdrive({ site: 'rv', start: overdriveStart(h.events(0, 13000), 13000, 'rv', 380, 80), tcl: 380, offset: 80, n: 8 });
  h.stimulate(st); h.advanceTo(18000);
  assert.ok(!h.status().vtActive && analyzeOverdrive(h.events(0, 18000), st).terminated, 'ATP ends the VT');
}

// Protocols.
const protocol = (kind, c) => {
  const h = createLiveHeart(c); const steps = planProtocol(kind, { start: 2000 });
  for (const s of steps) h.stimulate(s.stims);
  h.advanceTo(steps[steps.length - 1].end + 100);
  const ev = h.events(0, 1e9);
  return summarizeProtocol(kind, steps.map((s) => analyzeStep(kind, ev, s)), { sinusCl: c === 'sinus-node-disease' ? 1000 : 800 });
};
assert.equal(protocol('avbcl', 'normal').avbcl, 280, 'Wenckebach cycle length');
assert.deepEqual(protocol('erp', 'normal'), { aerp: 210, avnErp: 290, jump: null, echo: null, induced: null });
const erpAvnrt = protocol('erp', 'avnrt-typical');
assert.equal(erpAvnrt.jump, 370); assert.equal(erpAvnrt.induced, 370, 'AH jump, echo and AVNRT at S2 370; protocol stops there');
const snrt = protocol('snrt', 'normal'), snd = protocol('snrt', 'sinus-node-disease');
assert.ok(!snrt.abnormal && snrt.csnrt < 550, `normal SNRT ${JSON.stringify(snrt)}`);
assert.ok(snd.abnormal && snd.csnrt > 550, `sinus node disease ${JSON.stringify(snd)}`);

assert.ok(!readFileSync(new URL('../../src/eps/ep-live-maneuvers.js', import.meta.url), 'utf8').includes('\u2014'), 'no em dash');
console.log('PASS ep-live-maneuvers: His-refractory PVC, V overdrive until entrainment (AVNRT, ORT, AT V-A-A-V, atypical without pseudo-V-A-A-V, PJRT), flutter entrainment by site, VT entrainment and ATP, AVBCL, ERP with AH jump/induction stop, SNRT normal vs sinus node disease');

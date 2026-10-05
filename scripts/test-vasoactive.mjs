import assert from 'node:assert/strict';
import { VASO_DRUGS, VASO_SCENARIOS, VASO_SOURCES, vasoPath } from '../src/vasoactive-data.js';
assert.equal(VASO_DRUGS.length,10);assert.equal(new Set(VASO_DRUGS.map(d=>d.id)).size,10);
for(const d of VASO_DRUGS){for(const key of ['name','context','risk','dose'])assert.ok(d[key].tr&&d[key].en);assert.equal(d.effects.length,3);assert.ok(d.sources.length);d.sources.forEach(id=>assert.ok(VASO_SOURCES[id]));}
for(const scenario of VASO_SCENARIOS)for(const profile of ['pressure','output','both'])for(const escalating of [false,true]){const p=vasoPath({scenario:scenario.id,profile,escalating});[...p.agents,...p.adjunct].forEach(id=>assert.ok(VASO_DRUGS.some(d=>d.id===id)));}
assert.deepEqual(vasoPath({profile:'both'}).agents,['norepinephrine','dobutamine']);
assert.deepEqual(vasoPath({profile:'output',escalating:true}).adjunct,[],'adequate-pressure output pathway does not automatically add pressor');
assert.deepEqual(vasoPath({escalating:true}).adjunct,['vasopressin']);
assert.deepEqual(vasoPath({scenario:'cardiogenic',escalating:true}).adjunct,[],'sepsis escalation not generalized');
for(const scenario of ['hypovolemic','obstructive'])assert.equal(vasoPath({scenario,profile:'both'}).kind,'cause');
assert.throws(()=>vasoPath({profile:'invalid'}),RangeError);
const a=VASO_DRUGS.find(d=>d.id==='angiotensin');assert.match(a.dose.en,/20 ng\/kg\/min/);assert.match(a.dose.en,/maximum 80/);assert.match(a.dose.en,/maximum 40/);
assert.match(VASO_DRUGS.find(d=>d.id==='levosimendan').context.en,/against use in septic shock/);
console.log('PASS vasoactive: ten sourced bilingual agents, unit/reference checks, all 30 profile/scenario/escalation paths, cause-first and adjunct boundaries');

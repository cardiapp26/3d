import assert from 'node:assert/strict';
import { PHARMA_TOPICS, PHARMA_SOURCES, PHARMA_QUESTIONS, PHARMA_INTERACTIONS } from '../src/pharmacology-data.js';
import { findPharmaCards, allPharmaCards, remainingFraction, concentrationCurve } from '../src/pharmacology-model.js';
import { COAG_NODES, COAG_EDGES, COAG_TESTS, COAG_DRUGS, COAG_FEEDBACK, coagHighlights } from '../src/coagulation-data.js';

const sourceIds = new Set(PHARMA_SOURCES.map(source => source.id));
assert.equal(sourceIds.size, PHARMA_SOURCES.length);
const bilingual = value => {
  assert.ok(value.tr?.trim() && value.en?.trim(), 'TR/EN text required');
  assert.ok(!value.tr.includes('\u2014') && !value.en.includes('\u2014'), 'house punctuation');
};
PHARMA_SOURCES.forEach(source => bilingual(source.detail));
const sourced = item => { assert.ok(item.sources.length); item.sources.forEach(id => assert.ok(sourceIds.has(id), `source exists: ${id}`)); };
const cards = allPharmaCards();
assert.equal(new Set(cards.map(card => card.id)).size, cards.length, 'comparison ids unique');
assert.equal(PHARMA_TOPICS.length, 9, 'nine requested teaching domains');
for (const topic of PHARMA_TOPICS) {
  bilingual(topic.title); bilingual(topic.intro);
  for (const card of topic.cards) {
    for (const key of ['name', 'examples', 'mechanism', 'use', 'risk', 'monitor']) bilingual(card[key]);
    sourced(card);
  }
}
for (const item of PHARMA_INTERACTIONS) { ['title', 'why', 'action'].forEach(key => bilingual(item[key])); sourced(item); }
for (const question of PHARMA_QUESTIONS) {
  bilingual(question.prompt); bilingual(question.explanation); question.options.forEach(bilingual); sourced(question);
  assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length);
}
assert.equal(remainingFraction(0, 6), 1);
assert.equal(remainingFraction(6, 6), 0.5);
assert.equal(remainingFraction(12, 6), 0.25);
assert.equal(remainingFraction(24, 6), 0.0625);
assert.throws(() => remainingFraction(1, 0), RangeError);
assert.throws(() => remainingFraction(-1, 6), RangeError);
for (const halfLife of [1, 6, 12]) {
  const curve = concentrationCurve(halfLife);
  assert.equal(curve[0].fraction, 1);
  assert.equal(curve.at(-1).hours, 24);
  assert.ok(curve.every((point, i) => i === 0 || point.fraction < curve[i - 1].fraction));
}
const all = findPharmaCards('antiarrhythmics', '');
assert.ok(all.length >= 4);
assert.ok(findPharmaCards('antiarrhythmics', 'AMIODARONE', 'en').length > 0, 'English uppercase search');
assert.ok(findPharmaCards('antiarrhythmics', 'amiodaron', 'tr').length > 0, 'Turkish search');
assert.equal(findPharmaCards('antiarrhythmics', 'unknown-nonsense').length, 0);
assert.equal(findPharmaCards('missing').length, 0);
const factors = new Set(COAG_NODES.map(item => item.id));
assert.equal(factors.size, COAG_NODES.length);
COAG_NODES.forEach(item => { bilingual(item.name); bilingual(item.role); });
COAG_DRUGS.forEach(item => { bilingual(item.title); bilingual(item.text); item.targets.forEach(id => assert.ok(factors.has(id))); });
COAG_EDGES.forEach(edge => edge.forEach(id => assert.ok(factors.has(id), `coag edge ${id}`)));
assert.deepEqual(COAG_TESTS.pt, ['vii', 'x', 'v', 'ii', 'i'], 'PT includes V, excludes XIII');
assert.deepEqual(COAG_TESTS.aptt, ['xii', 'xi', 'ix', 'viii', 'x', 'v', 'ii', 'i'], 'aPTT excludes VII and XIII');
assert.ok(!coagHighlights('pt').tested.has('xiii') && !coagHighlights('aptt').tested.has('xiii'));
assert.deepEqual([...coagHighlights('all', 'warfarin').targeted], ['ii', 'vii', 'ix', 'x'], 'vitamin K-dependent procoagulant targets');
assert.deepEqual([...coagHighlights('all', 'xa').targeted], ['x'], 'Xa drug acts on activated X');
assert.deepEqual([...coagHighlights('all', 'iia').targeted], ['ii'], 'dabigatran acts on thrombin');
assert.deepEqual([...coagHighlights('all', 'heparin').targeted], ['x', 'ii'], 'UFH principal AT-mediated targets');
assert.deepEqual(COAG_FEEDBACK, ['v', 'viii', 'xi']);
assert.ok(COAG_EDGES.some(([a,b]) => a === 'ii' && b === 'xiii'), 'thrombin activates XIII');
assert.ok(COAG_EDGES.some(([a,b]) => a === 'extrinsic-tenase' && b === 'ix'), 'TF-VIIa activates IX as well as X');
console.log('PASS coagulation: factor graph, TF cross-path activation, PT/aPTT coverage, XIII exclusion, drug targets and bilingual text');
console.log(`PASS pharmacology: ${PHARMA_TOPICS.length} topics, ${cards.length} bilingual sourced cards, ${PHARMA_INTERACTIONS.length} interactions, ${PHARMA_QUESTIONS.length} questions; search and first-order curve verified`);

const { DIURETIC_CLASSES, DIURETIC_SOURCES } = await import('../src/diuretics-data.js');
assert.equal(DIURETIC_CLASSES.length, 6);
const diureticSources = new Set(DIURETIC_SOURCES.map(item => item.id));
const sites = { ca: ['proximal'], loop: ['ascending'], thiazide: ['distal'], mra: ['collecting'], enac: ['collecting'], osmotic: ['proximal', 'descending'] };
for (const item of DIURETIC_CLASSES) {
  ['title', 'examples', 'mechanism', 'monitor'].forEach(key => bilingual(item[key]));
  [...item.uses, ...item.risks].forEach(bilingual);
  assert.deepEqual(item.segments, sites[item.id]);
  assert.ok(item.sourceIds.length);
  item.sourceIds.forEach(id => assert.ok(diureticSources.has(id)));
}
const diuretic = id => DIURETIC_CLASSES.find(item => item.id === id);
assert.equal(diuretic('loop').effects.calcium, 'urine-up');
assert.equal(diuretic('thiazide').effects.calcium, 'urine-down');
for (const id of ['ca', 'loop', 'thiazide']) assert.equal(diuretic(id).effects.potassium, 'down');
for (const id of ['mra', 'enac']) assert.equal(diuretic(id).effects.potassium, 'up');
assert.equal(diuretic('osmotic').effects.potassium, 'variable');
console.log('PASS diuretics: six bilingual sourced classes, nephron sites, urinary calcium and potassium tendencies');

const { lipidLabValues, STATIN_INTENSITY } = await import('../src/lipid-lab-model.js');
assert.deepEqual(lipidLabValues({total:200,hdl:50,tg:150}), {nonHdl:150,ldl:120,reason:null});
assert.equal(lipidLabValues({total:200,hdl:50,tg:400}).ldl, null);
assert.equal(lipidLabValues({total:200,hdl:50,tg:399}).ldl, 70.2);
assert.equal(lipidLabValues({total:100,hdl:50,tg:300}).reason, 'negative');
assert.equal(lipidLabValues({total:50,hdl:60,tg:100}).error, 'inconsistent');
for (const value of [-1, NaN, Infinity]) assert.equal(lipidLabValues({total:value,hdl:50,tg:100}).error, 'invalid');
assert.equal(STATIN_INTENSITY.filter(item => item.high).length, 2);
assert.equal(STATIN_INTENSITY.find(item => item.name === 'Pitavastatin').low, null);
console.log('PASS lipid lab: independently checked formula, units, invalid values, TG400 boundary and intensity categories');

const { LIPID_REFERENCE, LIPID_REFERENCE_SOURCES } = await import('../src/lipid-reference-data.js');
assert.equal(LIPID_REFERENCE.length, 11);
assert.equal(new Set(LIPID_REFERENCE.map(item => item.id)).size, 11);
const referenceSources = new Set(LIPID_REFERENCE_SOURCES.map(item => item.id));
for (const item of LIPID_REFERENCE) {
  ['name','examples','mechanism','context','risk','monitor'].forEach(key => bilingual(item[key]));
  assert.ok(['standard','specialist','historical'].includes(item.group));
  assert.ok(item.sourceIds.length); item.sourceIds.forEach(id => assert.ok(referenceSources.has(id)));
}
assert.equal(LIPID_REFERENCE.find(item => item.id === 'metreleptin').group, 'specialist');
assert.equal(LIPID_REFERENCE.find(item => item.id === 'mipomersen').group, 'historical');
console.log('PASS lipid reference: 11 bilingual sourced entries with specialist/historical distinction');

const { ANGINA_DRUGS, ANGINA_SOURCES } = await import('../src/angina-data.js');
assert.equal(ANGINA_DRUGS.length, 8);
assert.equal(new Set(ANGINA_DRUGS.map(item => item.id)).size, 8);
const anginaSources = new Set(ANGINA_SOURCES.map(item => item.id));
const targetIds = new Set(['rate','contractility','afterload','preload','coronary','diastolic','metabolic']);
for (const item of ANGINA_DRUGS) {
  ['name','examples','mechanism','context','risk','monitor'].forEach(key => bilingual(item[key]));
  item.targets.forEach(id => assert.ok(targetIds.has(id)));
  assert.ok(item.sourceIds.length); item.sourceIds.forEach(id => assert.ok(anginaSources.has(id)));
}
assert.deepEqual(ANGINA_DRUGS.find(item => item.id === 'ivabradine').targets, ['rate']);
assert.ok(ANGINA_DRUGS.find(item => item.id === 'nondhp').targets.includes('rate'));
assert.ok(!ANGINA_DRUGS.find(item => item.id === 'dhp').targets.includes('rate'));
assert.deepEqual(ANGINA_DRUGS.find(item => item.id === 'ranolazine').targets, ['diastolic']);
console.log('PASS angina: eight sourced bilingual classes, distinct DHP/non-DHP and If/late sodium targets');

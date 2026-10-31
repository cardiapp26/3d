import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LIPOPROTEINS, LIPID_PRESETS, LIPID_LEVERS, POST_CLAIMS, LIPOPROTEIN_SOURCES, LIPID_COMPONENTS, APOLIPOPROTEINS, PARTICLE_ANATOMY } from '../src/lipoprotein-traffic-data.js';
import { particleSection, compositionBar, sizeStrip, coreFraction } from '../src/lipoprotein-particle.js';
import { validateProfile, applyLevers, apoBParticles, lipidPanel, lipidScenario, trafficRates } from '../src/lipoprotein-traffic-model.js';
import { LPT_WORDS } from '../src/lipoprotein-traffic-text.js';

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const sourceIds = new Set(LIPOPROTEIN_SOURCES.map(item => item.id));

// Data: bilingual, every source reference resolves, sources are https links.
for (const item of [...LIPOPROTEINS, ...LIPID_PRESETS, ...LIPID_LEVERS, ...POST_CLAIMS]) {
  for (const value of Object.values(item)) if (value && typeof value === 'object' && 'tr' in value) assert.ok(value.tr && value.en, `${item.id} bilingual`);
  for (const id of item.sources ?? []) assert.ok(sourceIds.has(id), `${item.id} source ${id}`);
}
for (const source of LIPOPROTEIN_SOURCES) assert.match(source.url, /^https:\/\//);
assert.deepEqual(LIPOPROTEINS.map(item => item.id), ['chylomicron', 'vldl', 'idl', 'ldl', 'lpa', 'hdl']);
assert.equal(LIPOPROTEINS.find(item => item.id === 'hdl').apoB, null, 'HDL carries no apoB');
assert.equal(LIPOPROTEINS.find(item => item.id === 'chylomicron').apoB, 'B-48');
assert.ok(LIPOPROTEINS.filter(item => item.id !== 'hdl' && item.id !== 'chylomicron').every(item => item.apoB === 'B-100'));
assert.deepEqual([...new Set(POST_CLAIMS.map(item => item.verdict))].sort(), ['ok', 'partial', 'wrong']);
assert.equal(POST_CLAIMS.find(item => item.id === 'apoa1').verdict, 'wrong', 'apoA-I raising is not supported (AEGIS-II)');
assert.match(POST_CLAIMS.find(item => item.id === 'lpa').check.en, /HORIZON/);
// Lifestyle never moves Lp(a); only drugs may.
for (const lever of LIPID_LEVERS.filter(item => item.group === 'lifestyle')) assert.equal(lever.effect.lpa ?? 0, 0, `${lever.id} Lp(a)`);
// No em dash anywhere in the module text.
for (const file of ['lipoprotein-particle.js', 'lipoprotein-traffic-data.js', 'lipoprotein-traffic-text.js', 'lipoprotein-traffic.js', 'lipoprotein-traffic-model.js', 'lipoprotein-traffic-scene.js', 'lipoprotein-traffic.css']) {
  assert.equal(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8').includes('\u2014'), false, `${file} has no em dash`);
}
for (const lang of ['tr', 'en']) {
  const flags = LPT_WORDS[lang].flags;
  for (const flag of ['tg-estimate', 'tg-high', 'lpa-high', 'ldl-severe', 'hdl-very-high', 'hdl-low', 'apob-discordant']) assert.ok(flags[flag], `${lang} ${flag}`);
}

// Validation.
const reference = LIPID_PRESETS.find(item => item.id === 'reference').profile;
assert.equal(validateProfile(reference).ok, true);
assert.equal(validateProfile({ ...reference, tg: NaN }).field, 'tg');
assert.equal(validateProfile({ ...reference, hdl: 0 }).field, 'hdl');
assert.equal(lipidPanel({ ...reference, ldl: -5 }).error.field, 'ldl');

// Levers combine multiplicatively; unknown ids are ignored; input is not mutated.
const copy = { ...reference };
const statinEze = applyLevers(reference, ['statin', 'ezetimibe', 'nope']);
close(statinEze.ldl, 100 * 0.5 * 0.78);
assert.deepEqual(reference, copy);
close(applyLevers(reference, ['pcsk9']).lpa, 30 * 0.75);
close(applyLevers(reference, []).tg, 100);

// ApoB particles: reference ≈ 1300 LDL + 100 remnant + 30 Lp(a) nmol/L ≈ 79 mg/dL apoB.
const ref = apoBParticles(reference);
close(ref.ldl, 1300); close(ref.total, 1430); close(ref.apoB, 78.65);

// Same LDL-C, high TG: more particles and a discordance flag (the post's apoB point).
const athero = lipidPanel(LIPID_PRESETS.find(item => item.id === 'atherogenic').profile);
const refPanel = lipidPanel(reference);
assert.equal(athero.values.ldl, refPanel.values.ldl);
assert.ok(athero.particles.apoB > refPanel.particles.apoB + 15);
assert.ok(athero.flags.includes('apob-discordant') && athero.flags.includes('tg-high') && athero.flags.includes('hdl-low'));
assert.equal(refPanel.flags.length, 0);
close(athero.values.tgHdl, 8);
close(refPanel.values.nonHdl, 120);

// High Lp(a): lifestyle levers leave Lp(a) unchanged and keep the flag.
const highLpa = LIPID_PRESETS.find(item => item.id === 'lpa').profile;
const lifestyle = LIPID_LEVERS.filter(item => item.group === 'lifestyle').map(item => item.id);
const lifestyleRun = lipidScenario(highLpa, lifestyle);
close(lifestyleRun.change.lpa, 0);
assert.ok(lifestyleRun.after.flags.includes('lpa-high'));
assert.ok(lifestyleRun.change.tg < -0.4, 'lifestyle lowers TG clearly');
assert.ok(lifestyleRun.change.ldl > -0.3, 'lifestyle lowers LDL-C modestly');

// FH-like: lifestyle alone keeps LDL-C high; statin + ezetimibe brings it down a lot more.
const fh = LIPID_PRESETS.find(item => item.id === 'fh').profile;
assert.ok(lipidScenario(fh, lifestyle).after.values.ldl > 150);
assert.ok(lipidScenario(fh, ['statin', 'ezetimibe']).after.values.ldl < 100);
assert.ok(lipidPanel(fh).flags.includes('ldl-severe'));

// TG ≥400 flags the TG/5 estimate.
assert.ok(lipidPanel({ ...reference, tg: 450 }).flags.includes('tg-estimate'));
assert.ok(lipidPanel({ ...reference, hdl: 95 }).flags.includes('hdl-very-high'));

// Animation rates follow the panel: more apoB → more LDL traffic and more intimal entry.
const rRef = trafficRates(refPanel), rAth = trafficRates(athero), rLpa = trafficRates(lipidPanel(highLpa));
assert.ok(rAth.ldl > rRef.ldl && rAth.vldl > rRef.vldl && rAth.wallLdl > rRef.wallLdl);
assert.ok(rLpa.lpa > rRef.lpa * 5);
assert.ok(rRef.wallLpa > rRef.wallLdl, 'Lp(a) is retained more readily per particle');
assert.ok(Object.values(rRef).every(value => Number.isFinite(value) && value >= 0));


// Particle anatomy: every class drawn, composition sums to 100, sizes in textbook order,
// one apoB per apoB particle, apo(a) only on Lp(a), apoA-I and no apoB on HDL.
const hexes = LIPOPROTEINS.map(item => item.color);
assert.equal(new Set(hexes).size, hexes.length, 'distinct class colours');
for (const item of LIPOPROTEINS) {
  const a = PARTICLE_ANATOMY[item.id];
  assert.ok(a, `${item.id} anatomy`);
  assert.equal(Object.values(a.composition).reduce((x, y) => x + y, 0), 100, `${item.id} composition sums to 100`);
  assert.ok(a.diameter >= a.range[0] && a.diameter <= a.range[1], `${item.id} typical diameter in range`);
  for (const [apo] of a.apos) assert.ok(APOLIPOPROTEINS.some(value => value.id === apo), `${item.id} ${apo}`);
  const apoB = a.apos.filter(([apo]) => apo === 'apoB100' || apo === 'apoB48');
  assert.equal(apoB.length ? apoB[0][1] : 0, item.apoB ? 1 : 0, `${item.id}: one apoB per apoB particle`);
  if (item.apoB) assert.equal(apoB[0][0], item.apoB === 'B-48' ? 'apoB48' : 'apoB100');
  const svg = particleSection(item.id, { title: 'x' });
  assert.match(svg, new RegExp(`data-lpp-section="${item.id}"`));
  for (const part of ['tg', 'pl', 'fc']) assert.match(svg, new RegExp(`data-lpp-part="${part}"`), `${item.id} draws ${part}`);
  for (const [apo] of a.apos) assert.match(svg, new RegExp(`data-lpp-apo="${apo}"`), `${item.id} draws ${apo}`);
  for (const part of LIPID_COMPONENTS) assert.match(compositionBar(item.id), new RegExp(`data-lpp-bar="${part.id}"`));
}
const dia = id => PARTICLE_ANATOMY[id].diameter;
assert.ok(dia('chylomicron') > dia('vldl') && dia('vldl') > dia('idl') && dia('idl') > dia('ldl') && dia('ldl') > dia('hdl'), 'size order');
assert.ok(dia('lpa') > dia('ldl'), 'Lp(a) a little larger than LDL');
assert.ok(PARTICLE_ANATOMY.chylomicron.composition.tg > 80 && PARTICLE_ANATOMY.ldl.composition.ce > 35 && PARTICLE_ANATOMY.hdl.composition.protein > 40, 'main loads');
assert.ok(!PARTICLE_ANATOMY.hdl.apos.some(([apo]) => apo.startsWith('apoB')) && PARTICLE_ANATOMY.hdl.apos.some(([apo]) => apo === 'apoA1'));
assert.ok(Object.entries(PARTICLE_ANATOMY).every(([id, a]) => a.apos.some(([apo]) => apo === 'apoa') === (id === 'lpa')), 'apo(a) only on Lp(a)');
assert.ok(coreFraction(9) < coreFraction(22) && coreFraction(22) < coreFraction(200), 'the 2 nm monolayer weighs more on small particles');
const strip = sizeStrip('ldl', { name: item => item.id });
assert.equal((strip.match(/data-lpp-size=/g) || []).length, 6);
assert.match(strip, /data-lpp-size="ldl" class="is-on"/);
assert.match(strip, new RegExp(`r="${(dia('hdl') / 2).toFixed(1)}"`), 'HDL drawn at 1 px per nm');
for (const lang of ['tr', 'en']) {
  const w = LPT_WORDS[lang];
  for (const key of ['anatomyIntro', 'compTitle', 'aposTitle', 'stripTitle', 'stripAria']) assert.ok(w[key], `${lang} ${key}`);
  assert.match(w.stripNote('X', [18, 25], 22), /18–25/);
}
console.log('lipoprotein traffic: data, model and rates OK');

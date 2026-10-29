import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { SITE_MODULES, SITE_BADGES } from '../src/site-modules.js';
import { HOME_MODULES } from '../src/home/home-data.js';
import viteConfig from '../vite.config.js';
import * as G from '../src/cardiac-mr/cmr-geometry.js';
import { SECTION_STRUCTURES, STRUCTURES, STEPS, SECTIONS, UI, SOURCE_URL } from '../src/cardiac-mr/cardiac-mr-data.js';
import { SEQUENCES, LGE_PATTERNS } from '../src/cardiac-mr/cmr-sequences-data.js';
import { sectionSvg } from '../src/cardiac-mr/cmr-sections.js';
import { planningStep, dialSvg } from '../src/cardiac-mr/cmr-planning.js';
import { cineSvg, lgeSvg, t1Svg, t2Svg } from '../src/cardiac-mr/cmr-seq-tissue.js';
import { pcSvg, perfusionSvg, mraSvg } from '../src/cardiac-mr/cmr-seq-flow.js';

const root = new URL('../', import.meta.url);

// ---- Registration (unchanged expectations) --------------------------------
const module = SITE_MODULES.find(entry => entry.id === 'cardiac-mr');
assert.ok(module, 'cardiac MR is a top-level module');
assert.equal(module.path, './cardiac-mr/');
for (const lang of ['tr', 'en']) {
  assert.ok(module.label[lang]?.trim(), `module label in ${lang}`);
  assert.ok(SITE_BADGES['cardiac-mr']?.[lang]?.trim(), `module badge in ${lang}`);
}
const card = HOME_MODULES.find(entry => entry.id === 'cardiac-mr');
assert.ok(card, 'cardiac MR has a home card');
assert.equal(card.path, module.path, 'home and navigation resolve to the same module');
const entryUrl = new URL('cardiac-mr/index.html', root);
assert.ok(existsSync(entryUrl), 'entry page exists');
const entry = readFileSync(entryUrl, 'utf8');
assert.match(entry, /data-site-page="cardiac-mr"/, 'shared header selects cardiac MR');
assert.match(entry, /data-cardia-root="\.\.\/"/, 'header links resolve from the module directory');
assert.match(entry, /src="(?:\.\.\/|\/)src\/cardiac-mr\/main\.js"/, 'entry loads the cardiac MR application');
assert.ok(Object.values(viteConfig.build.rollupOptions.input).some(path => path.endsWith('/cardiac-mr/index.html')), 'production build includes the module entry');
const thumb = new URL(`src/home/thumbs/${card.thumb}.webp`, root);
assert.ok(existsSync(thumb), 'home thumbnail exists');
assert.ok(statSync(thumb).size > 1000 && statSync(thumb).size < 80000, 'thumbnail is a compact real module capture');

// ---- Planning geometry -----------------------------------------------------
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
const longAxis = view => G.sub(view.apex, G.mitralCentre(view));

function checkStack(view, name) {
  const stack = G.planSaxStack(view);
  assert.ok(stack.lines.length >= 8 && stack.lines.length <= 12, `${name}: 8-12 SAX lines`);
  const axis = longAxis(view);
  for (const l of stack.lines) near(G.angleBetweenDeg(G.sub(l.b, l.a), axis), 90, 1, `${name}: SAX line ${l.index} perpendicular to the long axis`);
  near(G.angleBetweenDeg(G.sub(stack.axis.b, stack.axis.a), axis), 0, 1e-6, `${name}: drawn long axis follows apex-mitral`);
  const m = G.mitralCentre(view);
  const dist = stack.lines.map(l => G.length(G.sub(l.centre, m)));
  const gaps = dist.slice(1).map((d, i) => d - dist[i]);
  assert.ok(gaps.every(g => g > 0), `${name}: stack ordered base to apex`);
  for (const g of gaps) near(g, gaps[0], 1e-6, `${name}: equal stack spacing`);
  assert.ok(G.length(G.sub(stack.lines.at(-1).centre, view.apex)) < G.length(G.sub(stack.lines[0].centre, view.apex)), `${name}: last slice nearest the apex`);
  for (const l of stack.lines) near(G.distanceToLine(l.centre, m, view.apex), 0, 1e-6, `${name}: slice centred on the long axis`);
}
checkStack(G.TWO_CH, '2CH');
checkStack(G.FOUR_CH, '4CH');
// Lines come from landmarks: a rotated synthetic view stays perpendicular.
checkStack({ apex: { x: 40, y: 60 }, mitralA: { x: 300, y: 200 }, mitralB: { x: 280, y: 250 } }, 'synthetic');

const through = (plan, points, name) => points.forEach((p, i) => near(G.distanceToLine(p, plan.a, plan.b), 0, 0.5, `${name}: passes landmark ${i}`));
through(G.planTwoChamberOnAxial(), [G.AXIAL.apex, G.mitralCentre(G.AXIAL)], 'axial 2CH line');
through(G.planFourChamberOnTwoChamber(), [G.TWO_CH.apex, G.mitralCentre(G.TWO_CH)], '4CH line on the 2CH image');
through(G.planThreeChamberOnBasalSax(), [G.SAX.centre, G.saxAorticValveCentre()], '3CH line on the basal SAX');

const dial = Object.fromEntries(G.longAxisDial().map(l => [l.plane, l]));
for (const [plane, [from, to]] of Object.entries({ '2ch': ['anterior', 'inferior'], '4ch': ['inferoseptal', 'anterolateral'], '3ch': ['anteroseptal', 'inferolateral'] })) {
  assert.deepEqual([dial[plane].from, dial[plane].to], [from, to], `${plane} dial uses AHA segments`);
  near(G.distanceToLine(G.SAX.centre, dial[plane].a, dial[plane].b), 0, 1e-6, `${plane} dial line crosses the LV centre`);
}
assert.deepEqual(G.AHA_SEGMENTS, { anterior: 0, anterolateral: 60, inferolateral: 120, inferior: 180, inferoseptal: 240, anteroseptal: 300 });
// Display orientation: RV on image left in SAX (viewed from apex) and 4CH.
const [rvA, rvB] = G.SAX.levels.mid.rv;
assert.ok(rvA < 270 && rvB > 270, 'SAX RV wraps the septal (image-left) side');
assert.ok(G.polar(G.SAX.centre, 270, 10).x < G.SAX.centre.x, 'theta 270 is image left');
assert.ok(G.tricuspidCentre(G.FOUR_CH).x < G.mitralCentre(G.FOUR_CH).x, '4CH: RV/tricuspid on image left');
assert.ok(G.FOUR_CH.apex.y > G.mitralCentre(G.FOUR_CH).y && G.TWO_CH.apex.y > G.mitralCentre(G.TWO_CH).y, 'long axes: atria up, apex down');

// ---- Steps, sections and labels --------------------------------------------
assert.deepEqual(STEPS.map(s => s.id), ['axial-2ch', '2ch-4ch', 'sax-stack', 'basal-3ch']);
const stepMarkup = new Set();
for (const s of STEPS) {
  const r = planningStep(s.id, { lang: 'tr' });
  assert.match(r.sources.join(''), /data-cmr-plan=/, `${s.id}: source shows planning lines`);
  stepMarkup.add(r.sources.join('') + r.result);
}
assert.equal(stepMarkup.size, 4, 'each step has its own source and result');
const stackSvg = planningStep('sax-stack').sources.join('');
assert.equal((stackSvg.match(/data-cmr-stack=/g) || []).length, 20, 'SAX stack drawn on both 2CH and 4CH');
assert.match(dialSvg({ lang: 'en' }), /data-cmr-dial="4ch"/);

for (const [id, ids] of Object.entries(SECTION_STRUCTURES)) {
  for (const lang of ['tr', 'en']) {
    const svg = sectionSvg(id, { lang, labels: true });
    for (const sid of ids) {
      assert.ok(svg.includes(`data-cmr-label="${sid}"`), `${id} labels ${sid} (${lang})`);
      assert.ok(STRUCTURES[sid].short[lang] && STRUCTURES[sid].full[lang], `${sid} has ${lang} names`);
    }
    assert.ok(!sectionSvg(id, { lang, labels: false }).includes('data-cmr-label'), `${id} hides labels`);
  }
}
assert.deepEqual(SECTIONS.map(s => s.id), ['sax', '2ch', '3ch', '4ch']);

// ---- Sequences ---------------------------------------------------------------
assert.deepEqual(SEQUENCES.map(s => s.id), ['cine', 'lge', 't1', 't2', 'pc', 'perfusion', 'mra']);
for (const s of SEQUENCES) {
  for (const key of ['label', 'purpose', 'measures', 'pitfall']) for (const lang of ['tr', 'en']) assert.ok(s[key][lang]?.trim(), `${s.id}.${key}.${lang}`);
  assert.ok(s.how.tr.length >= 3 && s.how.tr.length === s.how.en.length, `${s.id}: bilingual how-to bullets`);
  assert.notEqual(s.purpose.tr, s.purpose.en, `${s.id}: translated`);
}
assert.equal(new Set(SEQUENCES.map(s => s.purpose.en)).size, 7, 'every sequence has its own purpose');
const howEn = id => SEQUENCES.find(s => s.id === id).how.en.join(' ');
assert.match(howEn('cine'), /1\.5 T/); assert.match(howEn('cine'), /3 T.*banding/i); assert.match(howEn('cine'), /spoiled GRE/);
assert.match(howEn('lge'), /10 min/); assert.match(howEn('lge'), /0\.1–0\.2 mmol\/kg/); assert.match(howEn('lge'), /5 min after the second injection/); assert.match(howEn('lge'), /TI scout/); assert.match(howEn('lge'), /PSIR/);
assert.match(howEn('t1'), /MOLLI/); assert.match(howEn('t1'), /10–30 min/); assert.match(howEn('t1'), /haematocrit/);
assert.match(howEn('t2'), /separately/i);
assert.match(howEn('pc'), /VENC/); assert.match(SEQUENCES.find(s => s.id === 'pc').measures.en, /Qp\/Qs/);
assert.match(howEn('perfusion'), /0\.05–0\.1 mmol\/kg at 3–7 ml\/s/); assert.match(howEn('perfusion'), /basal, mid and apical/); assert.match(howEn('perfusion'), /rest perfusion.*omitted/i);
assert.match(howEn('mra'), /3D/);

const schematics = { cine: cineSvg, lge: l => lgeSvg(l), t1: t1Svg, t2: t2Svg, pc: pcSvg, perfusion: perfusionSvg, mra: mraSvg };
const seqMarkup = new Set(Object.entries(schematics).map(([id, fn]) => { const svg = fn('tr'); assert.match(svg, new RegExp(`data-cmr-seq-view="${id}"`)); return svg; }));
assert.equal(seqMarkup.size, 7, 'each sequence has its own schematic');
assert.equal(new Set(LGE_PATTERNS.map(p => lgeSvg('en', p.id))).size, 4, 'LGE patterns differ');

const simpson = G.simpsonStack();
assert.ok(simpson.ef > 0.45 && simpson.ef < 0.7, 'illustrative EF in a plausible range');
assert.match(cineSvg('en'), new RegExp(`EF ${Math.round(simpson.ef * 100)}%`), 'cine readout uses the Simpson stack');
const ecv = G.extracellularVolume(G.ECV_EXAMPLE);
near(ecv.ecv, (1 - 0.42) * ((1 / 450 - 1 / 1000) / (1 / 280 - 1 / 1600)), 1e-12, 'ECV formula');
assert.match(t1Svg('en'), /ECV 24%/);
const flow = G.integrateFlow(G.aorticFlowCurve());
near(flow.net, flow.forward - flow.backward, 1e-9, 'net flow');
assert.match(pcSvg('en'), new RegExp(`RF: ${Math.round(flow.rf * 100)}%`), 'PC readout from the curve integral');

// ---- Text and source ------------------------------------------------------------
assert.equal(SOURCE_URL, 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7038611/');
for (const lang of ['tr', 'en']) assert.match(UI[lang].disclaimer, lang === 'tr' ? /hasta MR görüntüsü değildir.*sentezlemez/s : /not patient MR images.*does not synthesize/s);
const files = [
  ...readdirSync(new URL('src/cardiac-mr/', root)).map(f => new URL(`src/cardiac-mr/${f}`, root)),
  entryUrl, new URL('scripts/test-cardiac-mr.mjs', root), new URL('scripts/test-cardiac-mr-browser.cjs', root)
];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  assert.ok(!src.includes(String.fromCharCode(0x2014)), `no em dash in ${file.pathname}`);
  for (const m of src.matchAll(new RegExp(`(.)${String.fromCharCode(0x2013)}(.)`, 'g'))) assert.ok(/[\d}]/.test(m[1]) && /[\d$]/.test(m[2]), `en dash only in numeric ranges (${file.pathname}: "${m[0]}")`);
}
console.log('PASS cardiac MR: registration, landmark-derived planning geometry, labelled sections, 7 bilingual sequences with own schematics, text rules');

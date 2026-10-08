import assert from 'node:assert/strict';
import { VES_REGIONS, VES_OPTIONS, VES_INPUTS, VES_STEPWISE, VES_SITE_EXAMPLES, LIMB_LEAD_ANGLES, vesFrontalAxis, qrsWave, vesEcg, vesFeatures, localizeVes, vesRecording, recordingValue, v2TransitionRatio } from '../../src/eps/ves-loc-model.js';
import { VES_TEXT } from '../../src/eps/ves-loc-text.js';
import { createVesLocPanel } from '../../src/eps/ves-loc-panel.js';
import { leadPolarity, FRONTAL_SITES, FRONTAL_CROSS } from '../../src/eps/ves-loc-map.js';
import { EP_VIEWS } from '../../src/eps/ep-panel.js';
import { viewFromHash } from '../../src/eps/app-text.js';

assert.equal(VES_REGIONS.length, 12);
assert.equal(viewFromHash('#/ves', EP_VIEWS), 'ves');
assert.equal(localizeVes({}).next, 'axis', 'the stepwise approach starts with II and III');
assert.equal(localizeVes({ v1: 'unknown', axis: 'inferior' }).status, 'incomplete');
assert.equal(localizeVes({ v1: 'rbbb', axis: 'mixed' }).candidates.length, 0);
assert.equal(localizeVes({ v1: 'lbbb', axis: 'inferior', transition: 'negative' }).status, 'unresolved');
for (const inputs of [{ v1: 'rbbb', axis: 'superior', transition: 'negative', leadI: 'positive', width: 'narrow' },
  { v1: 'lbbb', axis: 'inferior', transition: 'positive', leadI: 'positive', width: 'wide' }]) {
  assert.equal(localizeVes(inputs).status, 'unresolved'); assert.deepEqual(localizeVes(inputs).candidates, []);
}
assert.deepEqual(localizeVes({ v1: 'lbbb', axis: 'inferior', transition: 'late' }).candidates, ['rvot-septal', 'tricuspid', 'rvot-free'], 'lead I unknown: both lead I branches stay open');
// Enriquez 2019 stepwise approach, branch by branch.
const sites = inputs => localizeVes(inputs).sites;
assert.deepEqual(localizeVes({ axis: 'inferior' }).next, 'leadI');
assert.deepEqual(localizeVes({ axis: 'inferior', leadI: 'positive' }).next, 'avl');
assert.deepEqual(localizeVes({ axis: 'inferior', leadI: 'negative' }).next, 'transition', 'aVL is not asked on the negative lead I branch');
assert.deepEqual(localizeVes({ axis: 'inferior', leadI: 'positive', avl: 'negative', transition: 'late' }).required, ['axis', 'leadI', 'avl', 'transition']);
assert.deepEqual(sites({ axis: 'inferior', leadI: 'positive', avl: 'negative', transition: 'late' }), ['posteriorRvot']);
assert.deepEqual(sites({ axis: 'inferior', leadI: 'positive', avl: 'negative', transition: 'v3' }), ['posteriorRvot', 'rcc']);
assert.deepEqual(sites({ axis: 'inferior', leadI: 'positive', avl: 'negative', transition: 'early' }), ['rcc']);
assert.deepEqual(sites({ axis: 'inferior', leadI: 'positive', avl: 'r', transition: 'late' }), ['tvFree']);
assert.deepEqual(sites({ axis: 'inferior', leadI: 'positive', avl: 'r', transition: 'v3' }), ['tvSeptum', 'parahis']);
assert.deepEqual(sites({ axis: 'inferior', leadI: 'negative', transition: 'v3' }), ['anteriorRvot']);
assert.deepEqual(sites({ axis: 'inferior', leadI: 'negative', transition: 'early' }), ['lcc', 'summit']);
assert.deepEqual(sites({ axis: 'inferior', leadI: 'negative', transition: 'positive' }), ['lcc', 'summit', 'amc', 'topMv', 'apm', 'laf']);
assert.deepEqual(sites({ axis: 'superior', v1: 'lbbb', transition: 'late' }), ['tvFree', 'mb']);
assert.deepEqual(sites({ axis: 'superior', v1: 'lbbb', transition: 'early' }), ['tvSeptum', 'crux']);
assert.deepEqual(sites({ axis: 'superior', v1: 'rbbb', v6: 'gt' }), ['inferiorMv']);
assert.deepEqual(sites({ axis: 'superior', v1: 'rbbb', v6: 'lt' }), ['ppm', 'lpf']);
assert.deepEqual(sites({ axis: 'disc-ii', transition: 'v3' }), ['parahis']);
assert.deepEqual(sites({ axis: 'disc-ii', transition: 'late' }), ['lateralTv', 'mb']);
assert.deepEqual(sites({ axis: 'disc-iii', v6: 'gt' }), ['lateralMv']);
assert.deepEqual(sites({ axis: 'disc-iii', v6: 'lt' }), ['apm']);
assert.ok(sites({ axis: 'inferior', leadI: 'biphasic', avl: 'negative', transition: 'late' }).includes('anteriorRvot'), 'a biphasic lead I keeps both sides of the midline');
// Every leaf names a site with TR/EN text; sites with an example point to real regions.
const leaves = t => Array.isArray(t) ? t : t.branches.flatMap(([, sub]) => leaves(sub));
for (const site of leaves(VES_STEPWISE)) {
  assert.ok(site in VES_SITE_EXAMPLES, site);
  for (const lang of ['tr', 'en']) assert.ok(VES_TEXT[lang].stepSites[site], `${lang} ${site}`);
  for (const id of VES_SITE_EXAMPLES[site]) assert.ok(VES_REGIONS.some(r => r.id === id), id);
}
// Each example's own ECG walks the tree to a single complete leaf that includes it.
for (const r of VES_REGIONS) { const L = localizeVes(vesFeatures(r.id)); assert.equal(L.status, 'regions', r.id); assert.equal(L.next, null, r.id); }
const v3 = { v1: 'lbbb', axis: 'inferior', transition: 'v3' };
assert.ok(localizeVes(v3).candidates.includes('rvot-septal') && localizeVes(v3).candidates.includes('lvot-cusp'), 'V3 overlap is explicit');
assert.equal(v2TransitionRatio(v3, { pvcR: .3, pvcS: .7, sinusR: .5, sinusS: .5 }).status, 'lvot', 'inclusive 0.60 boundary');
assert.equal(v2TransitionRatio(v3, { pvcR: .2, pvcS: .8, sinusR: .5, sinusS: .5 }).status, 'rvot');
assert.equal(v2TransitionRatio(v3, { pvcR: 0, pvcS: 0, sinusR: .5, sinusS: .5 }).status, 'invalid');
assert.equal(v2TransitionRatio(v3, { pvcR: .2, pvcS: .8, sinusR: 0, sinusS: .5 }).status, 'invalid');
for (const value of ['', null, undefined, NaN, Infinity, -1]) assert.equal(v2TransitionRatio(v3, { pvcR: value, pvcS: .8, sinusR: .5, sinusS: .5 }).status, 'missing');
assert.equal(v2TransitionRatio({ ...v3, v1: 'rbbb' }, {}).status, 'outside');
assert.equal(v2TransitionRatio({ ...v3, transition: 'early' }, {}).status, 'outside');
assert.equal(v2TransitionRatio(v3, { pvcR: 1e308, pvcS: 1e308, sinusR: 1e308, sinusS: 1e308 }).value, 1, 'stable under large finite amplitudes');
assert.ok(Math.abs(qrsWave(-40, 150, 1, .2)) < 1e-3 && Math.abs(qrsWave(190, 150, 1, .2)) < 1e-3, 'QRS energy inside its window');
for (const r of VES_REGIONS) {
  const f = vesFeatures(r.id), ecg = vesEcg(r.id);
  // Frontal quadrants (Enriquez 2019): basal origins give an inferior axis, right of the midline a positive
  // lead I; inferior origins give a superior axis, right of the midline LBBB-like and left RBBB-like.
  { const [x, y] = FRONTAL_SITES[r.id], right = x < FRONTAL_CROSS.x;   // patient right is on the viewer's left
    if (f.axis === 'inferior') { assert.ok(y < FRONTAL_CROSS.y, `${r.id} basal`); assert.equal(right, f.leadI === 'positive', `${r.id} side of midline`); }
    if (f.axis === 'superior') { assert.ok(y > FRONTAL_CROSS.y, `${r.id} inferior`); assert.equal(right, f.v1 === 'lbbb' || f.v1 === 'rs', `${r.id} LBBB right / RBBB left`); } }
  // Frontal vector widget: each limb-lead sign equals the dominant QRS deflection drawn in that lead.
  for (const lead of Object.keys(LIMB_LEAD_ANGLES)) {
    const q = ecg.leads[lead].filter((_, i) => ecg.t[i] >= 0 && ecg.t[i] <= ecg.width), R = Math.max(0, ...q), S = Math.max(0, ...q.map(v => -v));
    const sign = leadPolarity(vesFrontalAxis(r.id), lead);
    if (sign !== '±') assert.equal(sign, R > S ? '+' : '−', `${r.id} ${lead}: frontal vector sign matches the ECG`);
  }
  const qrs = ecg.t.map((ms, i) => ms >= 0 && ms <= ecg.width ? ecg.leads.II[i] : 0), tail = ecg.t.map((ms, i) => ms > ecg.width + 120 ? ecg.leads.II[i] : 0);
  const netQrs = qrs.reduce((a, v) => a + v, 0), netT = tail.reduce((a, v) => a + v, 0);
  assert.ok(netQrs * netT < 0, `${r.id}: T wave discordant to the QRS in II`);
  assert.ok(localizeVes(f).candidates.includes(r.id), `${r.id}: displayed ECG keeps its example region among candidates`);
  for (const key of VES_INPUTS) assert.ok(VES_OPTIONS[key].includes(f[key]));
  for (let i = 0; i < ecg.t.length; i++) {
    assert.ok(Math.abs(ecg.leads.III[i] - (ecg.leads.II[i] - ecg.leads.I[i])) < 1e-12);
    assert.ok(Math.abs(ecg.leads.aVR[i] + ecg.leads.aVL[i] + ecg.leads.aVF[i]) < 1e-12);
    for (const signal of Object.values(ecg.leads)) assert.ok(Number.isFinite(signal[i]));
  }
  const near = vesRecording(r.id), adjacent = vesRecording(r.id, 'adjacent'), remote = vesRecording(r.id, 'remote');
  assert.ok(near.local < adjacent.local && adjacent.local < 0 && remote.local > 0);
  assert.equal(near.unipolar, 'QS'); assert.equal(remote.unipolar, 'rS');
  assert.equal(near.purkinje != null, r.purkinje);
  if (near.purkinje != null) assert.ok(near.purkinje < near.local);
  assert.ok(recordingValue(near, 'uni', near.local - 8) === 0, 'QS has no initial R');
  assert.ok(recordingValue(remote, 'uni', remote.local - 8) > 0, 'remote unipolar initial R');
  for (const ch of near.channels) for (let ms = -80; ms <= 220; ms++) assert.ok(Number.isFinite(recordingValue(near, ch, ms)));
  for (const lang of ['tr', 'en']) for (const key of ['name', 'anatomy', 'ecg', 'recording', 'caution']) assert.ok(VES_TEXT[lang].sites[r.id][key].length > 0);
}
assert.equal(vesEcg('unknown'), null); assert.equal(vesRecording('unknown'), null); assert.equal(vesRecording('rvot-free', 'unknown'), null);

const fake = tag => ({ tag, children: [], attrs: {}, listeners: {}, hidden: false, textContent: '',
  append(...nodes) { this.children.push(...nodes); }, replaceChildren(...nodes) { this.children = nodes; },
  setAttribute(k, v) { this.attrs[k] = String(v); }, addEventListener(k, fn) { this.listeners[k] = fn; }
});
const doc = { createElement: fake, createElementNS: (_, tag) => fake(tag) };
let lang = 'tr'; const panel = createVesLocPanel(doc, { getLang: () => lang }); panel.setActive(true);
const walk = n => [n, ...n.children.flatMap(walk)];
const by = (key, value = '') => walk(panel.element).find(n => n.attrs[key] === value);
by('data-ves-atlas-3d').listeners.click();
assert.equal(panel.getState().atlas3d, true);
assert.equal(walk(panel.element).find(n => n.attrs['data-ves-atlas'] === '3d').attrs.viewBox, '0 0 720 731', 'basal map shows the 3D render');
assert.equal(walk(panel.element).filter(n => n.attrs['data-ves-map-site']).length, 8 * 2, 'eight basal regions on both maps');
by('data-ves-atlas-3d').listeners.click();
assert.equal(walk(panel.element).find(n => n.attrs['data-ves-atlas'] === '3d'), undefined);
by('data-ves-map-view', 'root').listeners.click();
assert.equal(panel.getState().mapView, 'root');
const rootSites = walk(panel.element).filter(n => n.attrs['data-ves-map-site']).map(n => n.attrs['data-ves-map-site']);
for (const id of ['rvot-septal', 'lvot-cusp', 'lv-summit', 'para-his']) assert.ok(rootSites.includes(id), `${id} on the opened root`);
assert.ok(walk(panel.element).some(n => n.attrs['data-ves-ilt'] === 'r-l') && walk(panel.element).some(n => n.attrs['data-ves-ilt'] === 'r-n'), 'interleaflet triangles drawn');
assert.equal(VES_TEXT.en.sites['lvot-cusp'].name, 'Aortic sinuses / ILT');
panel.select('lv-summit'); assert.equal(panel.getState().mapView, 'root', 'selecting a root example keeps the opened root');
panel.select('mitral'); assert.equal(panel.getState().mapView, 'base', 'an example not on the root opens its own view');
by('data-ves-map-view', 'root').listeners.click();
by('data-ves-map-view', 'rvot').listeners.click();
const rvotSites = walk(panel.element).filter(n => n.attrs['data-ves-map-site']).map(n => n.attrs['data-ves-map-site']);
for (const id of ['rvot-free', 'rvot-septal', 'para-his']) assert.ok(rvotSites.includes(id), `${id} on the opened RVOT`);
panel.select('rvot-free'); assert.equal(panel.getState().mapView, 'rvot', 'selecting an RVOT example keeps the opened RVOT');
assert.equal(walk(panel.element).find(n => n.attrs['data-ves-v1-station'] === '0').attrs['data-active'], 'true', 'anterior RVOT lights the QS station of the V1 gradient');
assert.equal(walk(panel.element).filter(n => n.attrs['data-ves-v1-station'] && n.attrs.tabindex === '0').length / 2, 7, 'seven of eight V1 stations link to an example (AMC has none)');
walk(panel.element).find(n => n.attrs['data-ves-v1-station'] === '6').listeners.click?.();
walk(panel.element).find(n => n.attrs['data-ves-v1-station'] === '7').listeners.click();
assert.equal(panel.getState().selected, 'lv-summit', 'the summit/MA station selects its example');
panel.select('rvot-free');
// Slide-based corrections: posterior septal RVOT has a small V1 r and positive lead I; the anterior free wall a negative lead I with III > II.
assert.equal(vesFeatures('rvot-septal').v1, 'rs'); assert.equal(vesFeatures('rvot-septal').leadI, 'positive');
assert.equal(vesFeatures('rvot-free').leadI, 'negative');
{ const e = vesEcg('rvot-free'), peak = l => Math.max(...e.leads[l].filter((_, i) => e.t[i] >= 0 && e.t[i] <= e.width)); assert.ok(peak('III') > peak('II'), 'anterior RVOT: III taller than II'); }
by('data-ves-map-view', 'chambers').listeners.click();
assert.equal(by('data-ves-v1-principle').hidden, false, 'V1 principle toggle on the cutaway');
by('data-ves-v1-principle').listeners.click();
const arrows = walk(panel.element).filter(n => n.attrs['data-direction']);
assert.equal(arrows.length, 6, 'drawn on both atlas copies (localization and recordings pages)');
assert.deepEqual(arrows.slice(0, 3).map(n => `${n.attrs['data-origin']}:${n.attrs['data-direction']}`), ['ta-lateral:away', 'septum-rv:away', 'ma-lateral:toward'], 'lateral TA and RV basal septum move away from V1, lateral MA towards it');
by('data-ves-v1-principle').listeners.click();
assert.equal(walk(panel.element).some(n => n.attrs['data-ves-v1-principle-overlay'] === ''), false);
// V1 follows the same rule in the examples: RV-side origins QS, LV free-wall annulus R.
assert.equal(vesFeatures('tricuspid').v1, 'lbbb'); assert.equal(vesFeatures('para-his').v1, 'lbbb'); assert.equal(vesFeatures('mitral').v1, 'rbbb');
{ const e = vesEcg('para-his'), peak = l => Math.max(...e.leads[l].filter((_, i) => e.t[i] >= 0 && e.t[i] <= e.width)); assert.ok(peak('III') < .5 * peak('II'), 'para-Hisian: low-amplitude III'); }
by('data-ves-map-view', 'base').listeners.click();
panel.select('fascicle');
assert.equal(panel.getState().mapView, 'chambers');
by('data-ves-open-recording').listeners.click();
assert.equal(panel.getState().page, 'recordings');
assert.equal(by('data-ves-readout').attrs['data-local'], '-22');
by('data-ves-position', 'remote').listeners.click();
assert.equal(panel.getRecording().unipolar, 'rS');
lang = 'en'; panel.render(); assert.match(by('data-ves-record-title').textContent, /Left posterior fascicle/);
by('data-ves-page', 'loc').listeners.click();
by('data-ves-option', 'axis:inferior').listeners.click();
assert.equal(panel.getState().selected, null); assert.equal(panel.getRecording(), null);
assert.equal(walk(panel.element).find(n => n.attrs.class === 'ves-ecg').hidden, true, 'manual mode does not leave an unrelated ECG visible');
by('data-ves-scar').checked = true; by('data-ves-scar').listeners.change();
assert.equal(by('data-ves-verdict').attrs['data-state'], 'scar');
assert.equal(by('data-ves-verdict').attrs['data-candidates'], '');
by('data-ves-reset').listeners.click(); assert.deepEqual(panel.getState().inputs, {});
assert.equal(panel.getState().scar, true, 'reset cannot silently remove clinical context');
panel.setActive(false); assert.equal(panel.element.hidden, true);
console.log('PASS ves-loc: frontal quadrants, Enriquez 2019 stepwise tree (every branch, every example a complete leaf), frontal vector signs match every limb lead, V1 principle overlay, opened RVOT and V1 gradient, opened aortic root with ILTs, 3D/SVG basal atlas, 12 region ECGs with discordant T, limb-lead identities, overlap, V2 ratio boundaries/invalid inputs, anatomically linked recordings, local/Purkinje timing, QS/rS, manual/scar separation, TR/EN, route');

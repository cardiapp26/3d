// WPW localization tab (src/eps/wpw-loc-model.js, wpw-loc-panel.js): the
// delta wave algorithm of the lecture, the coronary sinus sequence, the
// findings before and after ablation, the refractory period cut-off.
import assert from 'node:assert/strict';
import { LEADS, LEAD_OPTIONS, SITES, localize, CS_CHANNELS, PHASES, csSequence, ablationFindings, ERP_LIMIT, pathwayRisk } from '../../src/eps/wpw-loc-model.js';
import { WPW_LOC_TEXT } from '../../src/eps/wpw-loc-text.js';
import { createWpwLocPanel } from '../../src/eps/wpw-loc-panel.js';

const site = (sel) => localize(sel).site;

// Left side: V1 R > S and D1 negative or isoelectric, then aVF.
assert.equal(localize({}).next, 'v1', 'V1 is read first');
assert.equal(localize({ v1: 'rGtS' }).next, 'd1');
assert.equal(localize({ v1: 'rGtS', d1: 'negIso' }).next, 'avf');
assert.equal(site({ v1: 'rGtS', d1: 'negIso', avf: 'pos' }), 'leftLateral');
assert.equal(site({ v1: 'rGtS', d1: 'negIso', avf: 'neg' }), 'leftPosterior');
assert.equal(localize({ v1: 'rGtS', d1: 'pos' }).stalled, true, 'a positive D1 with R > S is not classified');

// Right free wall: positive delta with S > R, then aVF, then D2.
assert.equal(localize({ v1: 'sGtR' }).next, 'avf');
assert.equal(site({ v1: 'sGtR', avf: 'pos' }), 'rightAnterior');
assert.equal(localize({ v1: 'sGtR', avf: 'neg' }).next, 'd2');
assert.equal(site({ v1: 'sGtR', avf: 'neg', d2: 'pos' }), 'rightLateral');
assert.equal(site({ v1: 'sGtR', avf: 'iso', d2: 'negIso' }), 'rightPosterior');

// Septal: V1 isoelectric or negative with D2 negative, then aVF, then D3.
assert.equal(localize({ v1: 'isoNeg' }).next, 'd2');
assert.equal(localize({ v1: 'isoNeg', d2: 'pos' }).stalled, true);
assert.equal(site({ v1: 'isoNeg', d2: 'negIso', avf: 'neg' }), 'posteroseptal');
assert.equal(site({ v1: 'isoNeg', d2: 'negIso', avf: 'iso' }), 'septalAnnulus');
assert.equal(localize({ v1: 'isoNeg', d2: 'negIso', avf: 'pos' }).next, 'd3');
assert.equal(site({ v1: 'isoNeg', d2: 'negIso', avf: 'pos', d3: 'rGtS' }), 'anteroseptal');
assert.equal(site({ v1: 'isoNeg', d2: 'negIso', avf: 'pos', d3: 'rLtS' }), 'midseptal');

// Every site is reachable and every decision is explained.
const reached = new Set();
const pick = (lead) => LEAD_OPTIONS[lead];
for (const v1 of pick('v1')) for (const d1 of [undefined, ...pick('d1')]) for (const d2 of [undefined, ...pick('d2')]) for (const avf of [undefined, ...pick('avf')]) for (const d3 of [undefined, ...pick('d3')]) {
  const sel = { v1, ...(d1 && { d1 }), ...(d2 && { d2 }), ...(avf && { avf }), ...(d3 && { d3 }) };
  const r = localize(sel);
  if (r.site) reached.add(r.site);
  assert.ok(r.site || r.next || r.stalled, 'every walk ends, asks or stalls');
  assert.ok(!(r.site && r.next), 'a decided site asks nothing');
}
assert.deepEqual([...reached].sort(), [...SITES].sort(), 'all nine sites are reachable');

// Coronary sinus sequence.
assert.equal(csSequence('normal').earliest, 'cs910', 'septum first: proximal earliest');
assert.equal(csSequence('before').earliest, 'cs12', 'left lateral pathway: distal earliest');
assert.equal(csSequence('after').earliest, 'cs910', 'after ablation the sequence reverses back');
assert.deepEqual(csSequence('before').order, [...CS_CHANNELS].reverse());
assert.equal(csSequence('before').onsets.cs12, 0);
assert.equal(PHASES.length, 3);

// Findings before and after ablation: the left bundle branch block is masked, then shows.
assert.deepEqual([ablationFindings('before').delta, ablationFindings('before').lbbbVisible], [true, false]);
assert.deepEqual([ablationFindings('after').delta, ablationFindings('after').lbbbVisible], [false, true]);
assert.equal(ablationFindings('after').lbbbPresent && ablationFindings('before').lbbbPresent, true, 'the block is there all along');

// Refractory period.
assert.equal(pathwayRisk(210), 'short');
assert.equal(pathwayRisk(ERP_LIMIT), 'short');
assert.equal(pathwayRisk(ERP_LIMIT + 5), 'long');
assert.equal(pathwayRisk(NaN), null);

// Texts: both languages, complete, no em dash.
for (const lang of ['tr', 'en']) {
  const t = WPW_LOC_TEXT[lang];
  for (const lead of LEADS) {
    assert.ok(t.loc.leads[lead].name && t.loc.leads[lead].hint, `${lang} lead ${lead}`);
    for (const o of LEAD_OPTIONS[lead]) assert.ok(t.loc.leads[lead].options[o], `${lang} ${lead}:${o}`);
  }
  for (const id of SITES) assert.ok(t.loc.sites[id]?.name && t.loc.sites[id]?.note, `${lang} site ${id}`);
  for (const id of PHASES) assert.ok(t.cs.phases[id], `${lang} phase ${id}`);
  for (const id of CS_CHANNELS) assert.ok(t.cs.channels[id], `${lang} channel ${id}`);
  assert.equal(t.abl.steps.length, 4);
  assert.ok(t.risk.short && t.risk.long);
  assert.ok(!JSON.stringify(t).includes(String.fromCharCode(0x2014)), 'no em dash');
}
// Every "means" key the algorithm can emit has a text.
for (const v1 of pick('v1')) for (const d1 of pick('d1')) for (const d2 of pick('d2')) for (const avf of pick('avf')) for (const d3 of pick('d3')) {
  for (const p of localize({ v1, d1, d2, avf, d3 }).path) assert.ok(WPW_LOC_TEXT.tr.loc.means[p.means] && WPW_LOC_TEXT.en.loc.means[p.means], `means ${p.means}`);
}

// Panel on a minimal DOM.
class Node {
  constructor(tag) { this.tag = tag; this.children = []; this.attributes = {}; this.listeners = {}; this.className = ''; this.textContent = ''; this.hidden = false; this.value = ''; }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  append(...kids) { this.children.push(...kids); }
  appendChild(k) { this.children.push(k); return k; }
  replaceChildren(...kids) { this.children = [...kids]; }
  addEventListener(type, fn) { this.listeners[type] = fn; }
}
const doc = { createElement: (tag) => new Node(tag), createElementNS: (ns, tag) => new Node(tag) };
const walk = (n, out = []) => { out.push(n); n.children.forEach((c) => walk(c, out)); return out; };
const panel = createWpwLocPanel(doc, { getLang: () => 'tr' });
panel.setActive(true);
const nodes = () => walk(panel.element);
const by = (attr, value) => nodes().find((n) => n.attributes[attr] === value);
const has = (attr) => nodes().find((n) => n.attributes[attr] !== undefined);
assert.equal(panel.element.hidden, false);
assert.equal(nodes().filter((n) => n.attributes['data-wpw-card']).length, 4, 'four sections retained');
assert.equal(nodes().filter(n => n.attributes['data-wpw-map-site']).length, 18, 'nine regions on each of two maps');
assert.equal(by('data-wpw-card', 'loc').hidden, false);
assert.equal(by('data-wpw-card', 'cs').hidden, true);
by('data-wpw-page', 'cs').listeners.click();
assert.equal(by('data-wpw-card', 'cs').hidden, false);
by('data-wpw-page', 'loc').listeners.click();
assert.match(has('data-wpw-verdict').textContent, /V1/, 'V1 is asked first');
by('data-wpw-option', 'v1:rGtS').listeners.click();
by('data-wpw-option', 'd1:negIso').listeners.click();
by('data-wpw-option', 'avf:pos').listeners.click();
assert.equal(has('data-wpw-verdict').attributes['data-site'], 'leftLateral');
assert.match(has('data-wpw-verdict').textContent, /Sol lateral/);
assert.equal(nodes().filter((n) => n.attributes['data-wpw-step']).length, 3, 'three decisions listed');
by('data-wpw-option', 'avf:pos').listeners.click();
assert.equal(has('data-wpw-verdict').attributes['data-site'], '', 'a second click clears the lead');
has('data-wpw-reset').listeners.click();
assert.deepEqual(panel.getState().leads, {});
by('data-wpw-cs-phase', 'normal').listeners.click();
assert.equal(has('data-wpw-cs-bars').children.find((c) => c.attributes['data-earliest'] === 'true').attributes['data-wpw-cs-channel'], 'cs910');
by('data-wpw-cs-phase', 'before').listeners.click();
assert.equal(has('data-wpw-cs-bars').children.find((c) => c.attributes['data-earliest'] === 'true').attributes['data-wpw-cs-channel'], 'cs12');
by('data-wpw-abl-phase', 'after').listeners.click();
assert.equal(has('data-wpw-masked').hidden, false, 'the unmasked block is explained after ablation');
by('data-wpw-abl-phase', 'before').listeners.click();
assert.equal(has('data-wpw-masked').hidden, true);
assert.equal(has('data-wpw-risk').attributes['data-risk'], 'short', 'the lecture patient: 210 ms');
panel.set({ erp: 300 });
assert.equal(has('data-wpw-risk').attributes['data-risk'], 'long');
panel.setActive(false);
assert.equal(panel.element.hidden, true);
const { WPW_EXAMPLES } = await import('../../src/eps/wpw-loc-visual.js');
for (const [site, leads] of Object.entries(WPW_EXAMPLES)) {
  assert.equal(localize(leads).site, site, `example resolves to ${site}`);
  by('data-wpw-example', site).listeners.click();
  assert.equal(has('data-wpw-verdict').attributes['data-site'], site);
}
for (const id of SITES) {
  by('data-wpw-cs-site', id).listeners.click();
  assert.equal(panel.getState().csSite, id);
  assert.equal(has('data-wpw-cs-title').textContent, WPW_LOC_TEXT.tr.loc.sites[id].name);
  assert.equal(by('data-wpw-cs-site', id).attributes['aria-pressed'], 'true');
  assert.equal(has('data-wpw-verdict').attributes['data-site'], id);
  for (const phase of PHASES) {
    const seq = csSequence(phase, id);
    assert.equal(Math.min(...Object.values(seq.onsets)), 0);
    assert.ok(Object.values(seq.onsets).every(Number.isFinite));
    if (phase !== 'before') assert.equal(seq.earliest, 'cs910');
  }
}
assert.equal(csSequence('before', 'leftPosterior').earliest, 'cs56');
assert.deepEqual(csSequence('before', 'leftPosterior').onsets, { cs910: 20, cs78: 10, cs56: 0, cs34: 10, cs12: 20 });
console.log('PASS wpw-loc: localization algorithm (9 sites), CS sequence, before/after ablation, refractory cut-off, texts, panel');

// WPW localization tab (src/eps/wpw-loc-model.js, wpw-loc-panel.js): the
// Arruda delta wave algorithm, the coronary sinus sequence, the
// findings before and after ablation, the refractory period cut-off.
import assert from 'node:assert/strict';
import { LEADS, LEAD_OPTIONS, SITES, localize, CS_CHANNELS, PHASES, csSequence, ablationFindings, epTimeline, siteGroup, ERP_LIMIT, pathwayRisk } from '../../src/eps/wpw-loc-model.js';
import { WPW_LOC_TEXT } from '../../src/eps/wpw-loc-text.js';
import { createWpwLocPanel } from '../../src/eps/wpw-loc-panel.js';

const site = (sel) => localize(sel).site;

// Arruda (Josephson 2025, fig. 8.46 / 11.12). Step 1: lead I negative or isoelectric, or V1 R >= S: left free wall.
assert.equal(localize({}).next, 'd1', 'lead I is read first');
assert.equal(localize({ d1: 'negIso' }).next, 'avf');
assert.equal(site({ d1: 'negIso', avf: 'pos' }), 'leftLateral');
assert.equal(site({ d1: 'negIso', avf: 'neg' }), 'leftPosterior');
assert.equal(site({ d1: 'negIso', avf: 'iso' }), 'leftPosterior');
assert.equal(localize({ d1: 'pos' }).next, 'v1');
assert.equal(site({ d1: 'pos', v1: 'rGtS', avf: 'pos' }), 'leftLateral', 'V1 R >= S with a positive lead I is still left free wall');

// Step 2: negative delta in II: subepicardial posteroseptal, whatever V1 shows next.
assert.equal(localize({ d1: 'pos', v1: 'isoNeg' }).next, 'd2');
assert.equal(site({ d1: 'pos', v1: 'isoNeg', d2: 'neg' }), 'posteroseptalEpi');
assert.equal(site({ d1: 'pos', v1: 'sGtR', d2: 'neg' }), 'posteroseptalEpi');

// Step 3: septal (V1 isoelectric or negative): aVF then III.
assert.equal(site({ d1: 'pos', v1: 'isoNeg', d2: 'iso', avf: 'neg' }), 'posteroseptalTricuspid');
assert.equal(site({ d1: 'pos', v1: 'isoNeg', d2: 'pos', avf: 'iso' }), 'posteroseptalMitral');
assert.equal(localize({ d1: 'pos', v1: 'isoNeg', d2: 'pos', avf: 'pos' }).next, 'd3');
assert.equal(site({ d1: 'pos', v1: 'isoNeg', d2: 'pos', avf: 'pos', d3: 'rGtS' }), 'anteroseptal');
assert.equal(site({ d1: 'pos', v1: 'isoNeg', d2: 'pos', avf: 'pos', d3: 'rLtS' }), 'midseptal');

// Step 4: right free wall (V1 positive, R < S). aVF positive anterior; otherwise lead II: positive lateral, isoelectric posterior.
assert.equal(site({ d1: 'pos', v1: 'sGtR', d2: 'pos', avf: 'pos' }), 'rightAnterior');
assert.equal(site({ d1: 'pos', v1: 'sGtR', d2: 'pos', avf: 'iso' }), 'rightLateral');
assert.equal(site({ d1: 'pos', v1: 'sGtR', d2: 'pos', avf: 'neg' }), 'rightLateral', 'Arruda step 4: lead II positive is lateral whatever aVF');
assert.equal(site({ d1: 'pos', v1: 'sGtR', d2: 'iso', avf: 'iso' }), 'rightPosterior');
assert.equal(site({ d1: 'pos', v1: 'sGtR', d2: 'iso', avf: 'neg' }), 'rightPosterior');

// EASY-WPW (El Hamriti 2023): V1, transition for right-sided, most positive delta among II, III, aVR, aVL.
const { easyWpw, EASY_OPTIONS } = await import('../../src/eps/wpw-loc-model.js');
assert.equal(easyWpw({}).next, 'v1');
assert.equal(easyWpw({ v1: 'pos' }).next, 'lead', 'left-sided: two steps');
assert.equal(easyWpw({ v1: 'negIso' }).next, 'transition', 'right-sided: three steps');
const easy = (v1, lead, transition) => easyWpw({ v1, lead, transition }).site;
assert.deepEqual(['avl', 'ii', 'avr', 'iii'].map((l) => easy('pos', l)), ['posteroseptalMitral', 'leftPosterior', 'leftPosterior', 'leftLateral']);
assert.deepEqual(['ii', 'iii', 'avr', 'avl'].map((l) => easy('negIso', l, 'early')), ['anteroseptal', 'anteroseptal', 'posteroseptalTricuspid', 'posteroseptalTricuspid']);
assert.deepEqual(['avl', 'ii', 'iii', 'avr'].map((l) => easy('negIso', l, 'late')), ['rightPosterior', 'rightAnterior', 'anteroseptal', 'posteroseptalTricuspid']);
for (const v1 of EASY_OPTIONS.v1) for (const transition of EASY_OPTIONS.transition) for (const lead of EASY_OPTIONS.lead) assert.ok(SITES.includes(easy(v1, lead, transition)));

// Anteroseptal and midseptal never need a negative lead II; the examples follow the algorithm.
const { WPW_EXAMPLES: EXAMPLES } = await import('../../src/eps/wpw-loc-visual.js');
assert.equal(EXAMPLES.anteroseptal.d2, 'pos');
assert.equal(EXAMPLES.midseptal.d2, 'pos');

// Every site is reachable, every walk ends or asks, every decision is explained.
const reached = new Set();
const pick = (lead) => LEAD_OPTIONS[lead];
for (const d1 of pick('d1')) for (const v1 of [undefined, ...pick('v1')]) for (const d2 of [undefined, ...pick('d2')]) for (const avf of [undefined, ...pick('avf')]) for (const d3 of [undefined, ...pick('d3')]) {
  const sel = { d1, ...(v1 && { v1 }), ...(d2 && { d2 }), ...(avf && { avf }), ...(d3 && { d3 }) };
  const r = localize(sel);
  if (r.site) reached.add(r.site);
  assert.ok((r.site || r.next) && !r.stalled, 'every walk ends or asks');
  assert.ok(!(r.site && r.next), 'a decided site asks nothing');
}
assert.deepEqual([...reached].sort(), [...SITES].sort(), 'all ten sites are reachable');
assert.equal(SITES.length, 10);

// Coronary sinus sequence.
assert.equal(csSequence('normal').earliest, 'cs910', 'septum first: proximal earliest');
assert.equal(csSequence('before').earliest, 'cs12', 'left lateral pathway: distal earliest');
assert.equal(csSequence('after').earliest, 'cs910', 'after ablation the sequence reverses back');
assert.deepEqual(csSequence('before').order, [...CS_CHANNELS].reverse());
assert.equal(csSequence('before').onsets.cs12, 0);
assert.equal(PHASES.length, 3);

// Findings before and after ablation: the left bundle branch block of the lecture patient is masked, then shows.
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
  for (const group of ['left', 'posteroseptal', 'superiorSeptal', 'right']) assert.equal(t.abl.steps[group].length, 4, `${group} ablation steps`);
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
assert.equal(nodes().filter((n) => n.attributes['data-wpw-card']).length, 3, 'four sections retained');
assert.equal(nodes().filter(n => n.attributes['data-wpw-map-site']).length, 20, 'ten regions on each of two maps');
assert.equal(by('data-wpw-card', 'loc').hidden, false);
assert.equal(by('data-wpw-card', 'cs').hidden, true);
by('data-wpw-page', 'cs').listeners.click();
assert.equal(by('data-wpw-card', 'cs').hidden, false);
by('data-wpw-page', 'loc').listeners.click();
assert.match(has('data-wpw-verdict').textContent, /D1/, 'lead I is asked first');
by('data-wpw-option', 'd1:negIso').listeners.click();
by('data-wpw-option', 'avf:pos').listeners.click();
assert.equal(has('data-wpw-verdict').attributes['data-site'], 'leftLateral');
assert.match(has('data-wpw-verdict').textContent, /Sol lateral/);
assert.equal(nodes().filter((n) => n.attributes['data-wpw-step']).length, 2, 'two decisions listed');
by('data-wpw-option', 'avf:pos').listeners.click();
assert.equal(has('data-wpw-verdict').attributes['data-site'], '', 'a second click clears the lead');
has('data-wpw-reset').listeners.click();
assert.deepEqual(panel.getState().leads, {});
by('data-wpw-cs-phase', 'normal').listeners.click();
assert.equal(has('data-wpw-cs-bars').children.find((c) => c.attributes['data-earliest'] === 'true').attributes['data-wpw-cs-channel'], 'cs910');
// No accessory pathway: neutral title, no region selected on the map or in the list.
assert.equal(has('data-wpw-cs-title').textContent, WPW_LOC_TEXT.tr.cs.normalTitle);
assert.equal(has('data-wpw-cs-title').attributes['data-site'], 'none');
assert.ok(nodes().filter((n) => n.attributes['data-wpw-cs-site']).every((n) => n.attributes['aria-pressed'] === 'false'), 'no site pressed without a pathway');
by('data-wpw-cs-site', 'leftLateral').listeners.click();
assert.equal(panel.getState().csPhase, 'before', 'picking a region brings the pathway back');
by('data-wpw-cs-phase', 'before').listeners.click();
by('data-wpw-cs-phase', 'before').listeners.click();
assert.equal(has('data-wpw-cs-bars').children.find((c) => c.attributes['data-earliest'] === 'true').attributes['data-wpw-cs-channel'], 'cs12');
by('data-wpw-cs-phase', 'after').listeners.click();
assert.equal(has('data-wpw-masked').hidden, false, 'the unmasked block is explained after ablation');
by('data-wpw-cs-phase', 'before').listeners.click();
assert.equal(has('data-wpw-masked').hidden, true);
// Every pathway has its own before/after: monitor channels, wall-specific steps, normal HV after.
for (const site of SITES) {
  panel.set({ csSite: site, leads: {}, csPhase: 'before' });
  const monitor = nodes().find((n) => n.attributes.class === 'wpw-ablation-ecg');
  assert.equal(monitor.attributes['data-site'], site);
  const rows = monitor.children.filter((n) => n.attributes['data-wpw-monitor']).map((n) => n.attributes['data-wpw-monitor']);
  assert.deepEqual(rows, ['d1', 'avl', 'his', 'abl', ...CS_CHANNELS], `${site} monitor channels`);
  assert.equal(has('data-wpw-steps').children.length, 4);
  const before = ablationFindings('before', site), after = ablationFindings('after', site);
  assert.ok(before.delta && !after.delta && before.hv < 35 && after.hv >= 35 && after.hv <= 55, `${site} delta and HV`);
  assert.ok(before.ablLead > 0 && after.ablLead === null, `${site} local V leads the delta before ablation`);
  assert.equal(after.csEarliest, 'cs910');
  assert.equal(after.lbbbVisible, site === 'leftLateral', `${site}: only the lecture patient unmasks LBBB`);
  panel.set({ csPhase: 'after' });
  assert.equal(has('data-wpw-masked').hidden, site !== 'leftLateral');
}
assert.equal(epTimeline('before', 'leftLateral').d1.polarity, 'neg', 'left free wall: negative delta in lead I');
assert.equal(epTimeline('before', 'rightLateral').d1.polarity, 'pos');
assert.equal(siteGroup('anteroseptal'), 'superiorSeptal');
assert.equal(siteGroup('posteroseptalEpi'), 'posteroseptal');
// Lead I / aVL polarity by site (Josephson 2025, ch. 8): left lateral negative in both, left posterior isoelectric.
assert.deepEqual([epTimeline('before', 'leftLateral').avl.polarity, epTimeline('before', 'leftPosterior').d1.polarity, epTimeline('before', 'leftPosterior').avl.polarity], ['neg', 'iso', 'iso']);
assert.equal(epTimeline('before', 'anteroseptal').d1.polarity, 'pos');
// Next to the His the His catheter records the early V with the ablation tip; far from it, it does not.
const near = epTimeline('before', 'anteroseptal'), far = epTimeline('before', 'leftLateral');
assert.ok(Math.abs(near.his.v - near.abl.v) <= 5, 'anteroseptal: His V beside ABL V');
assert.ok(far.his.v - far.abl.v >= 25, 'left lateral: His V well after ABL V');
// Normal HV 35-55 ms after ablation; short (< 35 ms) before. The local V leads the delta (Josephson, ch. 11).
for (const site of SITES) { const before = ablationFindings('before', site), after = ablationFindings('after', site); assert.ok(before.ablLead >= 25 && before.hv < 35 && after.hv >= 35 && after.hv <= 55, site); }
// No pathway on the merged page: no delta, no steps, no masked block, wave names on the monitor.
panel.set({ csSite: 'leftLateral', csPhase: 'normal' });
assert.equal(ablationFindings('normal', 'leftLateral').lbbbPresent, false);
assert.equal(has('data-wpw-steps').hidden, true);
assert.equal(has('data-wpw-masked').hidden, true);
const waves = walk(nodes().find((n) => n.attributes.class === 'wpw-ablation-ecg')).map((n) => n.attributes['data-wave']).filter(Boolean);
for (const name of ['P', 'QRS', 'T', 'A', 'H', 'V']) assert.ok(waves.includes(name), `wave name ${name}`);
assert.ok(!waves.includes('δ'), 'no delta label without a pathway');
panel.set({ csPhase: 'before' });
assert.ok(walk(nodes().find((n) => n.attributes.class === 'wpw-ablation-ecg')).some((n) => n.attributes['data-wave'] === 'δ'), 'delta labelled before ablation');
panel.set({ csSite: 'leftLateral', csPhase: 'before' });
assert.equal(has('data-wpw-risk').attributes['data-risk'], 'short', 'the lecture patient: 210 ms');
panel.set({ erp: 300 });
assert.equal(has('data-wpw-risk').attributes['data-risk'], 'long');
panel.set({ page: 'loc', leads: { d1: 'negIso', avf: 'pos' }, easy: {} });
by('data-wpw-easy-option', 'v1:pos').listeners.click();
assert.equal(by('data-wpw-easy-input', 'transition').hidden, true, 'no transition step for a left-sided pathway');
by('data-wpw-easy-option', 'lead:iii').listeners.click();
assert.equal(has('data-wpw-easy-result').attributes['data-site'], 'leftLateral');
assert.equal(nodes().find((n) => n.attributes['data-agree'] !== undefined).attributes['data-agree'], 'true', 'EASY-WPW and Arruda agree');
by('data-wpw-easy-option', 'lead:avl').listeners.click();
assert.equal(nodes().find((n) => n.attributes['data-agree'] !== undefined).attributes['data-agree'], 'false');
has('data-wpw-easy-reset').listeners.click();
assert.deepEqual(panel.getState().easy, {});
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
console.log('PASS wpw-loc: Arruda localization (10 sites, lead I first, step 4 by lead II), EASY-WPW and comparison, CS sequence, no-pathway state, before/after ablation for every site (monitor channels, HV, local V lead), refractory cut-off, texts, panel');

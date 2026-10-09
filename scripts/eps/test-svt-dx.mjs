// SVT algorithm tab (src/eps/svt-dx-model.js, svt-dx-panel.js): each finding
// of the lecture series closes the doors it should and no others.
import assert from 'node:assert/strict';
import { MECHANISMS, GROUPS, evaluate, groupEnabled, optionIds } from '../../src/eps/svt-dx-model.js';
import { SVT_DX_TEXT } from '../../src/eps/svt-dx-text.js';
import { createSvtDxPanel } from '../../src/eps/svt-dx-panel.js';
import { SVT_EXAMPLES, svtExampleRecording } from '../../src/eps/svt-dx-recordings.js';
import { AVRT_LOCALIZATIONS } from '../../src/eps/svt-avrt-localizations.js';
import { EP_CASES, measure } from '../../src/eps/ep-cases.js';
import { selectableChannels } from '../../src/eps/ep-egm.js';
import { buildLadder, inferLadderEvents } from '../../src/eps/ep-ladder.js';
import { stripLinks } from '../../src/eps/ep-strip-links.js';

for (const [id, tr, en] of SVT_EXAMPLES) {
  const recording = svtExampleRecording(id);
  assert.ok(recording && tr && en, `example ${id} exists and is bilingual`);
  const channels = selectableChannels(recording);
  for (const [ch, events] of Object.entries(recording.events)) {
    if (events.length) assert.ok(channels.includes(ch), `${id} displays ${ch}`);
  }
  const mechanism = recording.mechanism || EP_CASES.find((c) => c.id === recording.caseId)?.mechanism;
  const ladder = buildLadder(inferLadderEvents(recording.events, { mechanism }), { until: recording.windowMs });
  assert.ok(ladder.atria.length && ladder.ventricles.length && ladder.links.length, `${id} has a conduction ladder`);
  const links = stripLinks(recording.events, ladder);
  assert.ok(links.groups.length && links.conduction.length, `${id} links ladder to signals`);
}
for (const site of AVRT_LOCALIZATIONS) {
  const r = svtExampleRecording(site.id);
  const atria = Object.entries(r.events).flatMap(([ch, events]) => events.filter((e) => e.type === 'A').map((e) => ({ ch, t: e.t })));
  const earliest = [...atria].sort((a, b) => a.t - b.t)[0];
  assert.equal(earliest.ch, 'abl-d', `${site.id} local mapping A is earliest`);
  const diagnostic = atria.filter((e) => e.ch !== 'abl-d').sort((a, b) => a.t - b.t)[0];
  assert.equal(diagnostic.ch, site.earliest, `${site.id} diagnostic catheter sequence`);
  assert.equal(measure(r, r.calipers[0]), 400);
  assert.equal(measure(r, r.calipers[2]), 85);
  for (const events of Object.values(r.events)) for (const e of events) assert.ok(e.t >= 0 && e.t <= r.windowMs);
  const ladder = buildLadder(inferLadderEvents(r.events, { mechanism: r.mechanism }), { until: r.windowMs });
  assert.equal(ladder.atria.length, 4, `${site.id} one atrial activation per cycle`);
  assert.ok(ladder.links.some((l) => l.kind === 'ap-retro'), `${site.id} accessory pathway return`);
}

const left = (selection) => evaluate(selection).remaining.sort();
const status = (selection, id) => evaluate(selection).mechanisms.find((m) => m.id === id).status;

// Nothing picked: everything is open.
assert.deepEqual(left({}), [...MECHANISMS].sort());
assert.equal(evaluate({}).conflict, false);

// The five excluding and diagnosing EP findings.
assert.deepEqual(left({ activation: 'superiorInferior' }), ['at', 'flutter', 'snrt'].sort(), 'superior to inferior: excludes AVNRT and AVRT');
assert.ok(!left({ av: 'aMoreV' }).includes('avrt') && !left({ av: 'aMoreV' }).includes('avrtSlow'), 'A > V excludes AVRT');
assert.ok(left({ av: 'aMoreV' }).includes('avnrtTyp'), 'blocked AVNRT stays possible');
assert.deepEqual(left({ aaPr: 'aaConstRpVariable' }), ['at', 'flutter', 'snrt'].sort(), 'AA constant with variable RP: excludes AVNRT and AVRT');
assert.deepEqual(left({ bbb: 'vaPlus30' }), ['avrt', 'avrtSlow'], 'VA +30 ms with bundle branch block: accessory pathway');
assert.equal(status({ bbb: 'vaPlus30' }, 'avrt'), 'favored');
assert.deepEqual(left({ bbb: 'noChange' }), [...MECHANISMS].sort(), 'no change excludes nothing');
assert.ok(!left({ ending: 'nonPrematureA' }).includes('at'), 'ending with a non-premature A excludes AT');
assert.ok(left({ ending: 'nonPrematureA' }).includes('avrt'));
assert.deepEqual(left({ ending: 'qrs' }), [...MECHANISMS].sort(), 'ending with a QRS separates nothing');

// RP against PR.
const short = left({ rp: 'short' }), long = left({ rp: 'long' });
assert.deepEqual(short, ['at', 'avnrtTyp', 'avrt', 'flutter', 'snrt'].sort());
assert.deepEqual(long, ['at', 'avnrtAtyp', 'avrtSlow', 'flutter', 'snrt'].sort());
assert.ok(!short.includes('avnrtAtyp') && !long.includes('avnrtTyp'));

// VA interval.
assert.ok(!left({ va: 'lt70' }).includes('avrt') && !left({ va: 'lt70' }).includes('avnrtAtyp'));
assert.ok(left({ va: 'lt70' }).includes('avnrtTyp') && left({ va: 'lt70' }).includes('at'));
assert.ok(!left({ va: 'gt70' }).includes('avnrtTyp') && left({ va: 'gt70' }).includes('avrt'));

// Carotid massage or adenosine.
assert.deepEqual(left({ adeno: 'terminatesP' }), ['avnrtAtyp', 'avnrtTyp', 'avrt', 'avrtSlow'].sort(), 'ending with a P excludes atrial rhythms');
assert.deepEqual(left({ adeno: 'terminatesQRS' }), [...MECHANISMS].sort());
assert.ok(!left({ adeno: 'blockPersists' }).includes('avrt'));
const waves = GROUPS.find((g) => g.id === 'waves');
assert.equal(groupEnabled(waves, {}), false, 'waves wait for a persisting block');
assert.deepEqual(left({ waves: 'sawtooth' }), [...MECHANISMS].sort(), 'a locked group is ignored');
assert.deepEqual(left({ adeno: 'blockPersists', waves: 'sawtooth' }), ['flutter'], 'saw-tooth: flutter');
assert.ok(!left({ adeno: 'blockPersists', waves: 'isoelectric' }).includes('flutter') && !left({ adeno: 'blockPersists', waves: 'isoelectric' }).includes('avrt'), 'isoelectric P waves: flutter and AVRT excluded');

// P wave morphology.
assert.ok(!left({ pwave: 'negInferior' }).includes('snrt'), 'negative inferior P excludes SNRT');
assert.equal(status({ pwave: 'differs' }, 'at'), 'favored');
assert.equal(status({ pwave: 'sinusLike' }, 'snrt'), 'favored');
assert.ok(!left({ pwave: 'sinusLike' }).includes('avnrtTyp'));

// Conflicting findings leave nothing, and say so.
const conflict = evaluate({ activation: 'superiorInferior', bbb: 'vaPlus30' });
assert.equal(conflict.conflict, true);
assert.deepEqual(conflict.remaining, []);
assert.equal(evaluate({ activation: 'superiorInferior', pwave: 'differs', adeno: 'blockPersists', waves: 'isoelectric' }).single, 'at');

// Every group and option is described in both languages, and no em dash.
for (const lang of ['tr', 'en']) {
  const t = SVT_DX_TEXT[lang];
  for (const id of MECHANISMS) assert.ok(t.mechanisms[id]?.name && t.mechanisms[id]?.note, `${lang} mechanism ${id}`);
  for (const group of GROUPS) {
    const g = t.groups[group.id];
    assert.ok(g?.title && g?.hint, `${lang} group ${group.id}`);
    for (const option of optionIds(group.id)) assert.ok(g.options[option]?.label && g.options[option]?.why, `${lang} ${group.id}:${option}`);
    assert.ok(t.steps[group.step], `${lang} step ${group.step}`);
  }
  assert.ok(!JSON.stringify(t).includes(String.fromCharCode(0x2014)), 'no em dash');
}

// Panel on a minimal DOM.
class Node {
  constructor(tag) { this.tag = tag; this.children = []; this.attributes = {}; this.listeners = {}; this.className = ''; this.textContent = ''; this.hidden = false; }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  append(...kids) { this.children.push(...kids); }
  appendChild(k) { this.children.push(k); return k; }
  replaceChildren(...kids) { this.children = [...kids]; }
  addEventListener(type, fn) { this.listeners[type] = fn; }
}
const doc = { createElement: (tag) => new Node(tag) };
const walk = (n, out = []) => { out.push(n); n.children.forEach((c) => walk(c, out)); return out; };
const panel = createSvtDxPanel(doc, { getLang: () => 'tr' });
panel.setActive(true);
const nodes = () => walk(panel.element);
const button = (key) => nodes().find((n) => n.attributes['data-svt-option'] === key);
assert.equal(panel.element.hidden, false);
assert.equal(nodes().filter((n) => n.attributes['data-svt-mechanism']).length, MECHANISMS.length, 'one row per mechanism');
button('av:aMoreV').listeners.click();
assert.equal(nodes().find((n) => n.attributes['data-svt-mechanism'] === 'avrt').attributes['data-status'], 'excluded');
assert.equal(button('av:aMoreV').attributes['aria-pressed'], 'true');
button('av:aMoreV').listeners.click();
assert.equal(nodes().find((n) => n.attributes['data-svt-mechanism'] === 'avrt').attributes['data-status'], 'possible', 'a second click clears the finding');
button('adeno:blockPersists').listeners.click();
button('waves:sawtooth').listeners.click();
assert.match(nodes().find((n) => n.attributes['data-svt-verdict'] !== undefined).textContent, /Atriyal flutter/, 'single candidate named');
nodes().find((n) => n.attributes['data-svt-reset'] !== undefined).listeners.click();
assert.deepEqual(panel.getState().selection, {});
panel.setActive(false);
assert.equal(panel.element.hidden, true);
console.log('PASS svt-dx: model rules, text coverage, panel');

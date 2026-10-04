// Electrophysiological anatomy panel (ep-panel.js) against a minimal fake
// DOM: strip and side columns, section / case / clip / evidence flow,
// neutral diagnosis, maneuver cards and validity, the 2D schematic in place
// of the 3D zone arcs, the live tab, pharmacology strips and TR/EN.
import assert from 'node:assert/strict';
import { createEpPanel } from '../../src/eps/ep-panel.js';

// createEpPanel against a minimal fake DOM.
function fakeElement(tagName) {
  const node = {
    tagName, children: [], attributes: {}, listeners: {}, dataset: {}, className: '', textContent: '', hidden: false,
    value: '', clientWidth: tagName === 'canvas' ? 600 : 0, clientHeight: tagName === 'canvas' ? 240 : 0, width: 0, height: 0,
    style: {}, getContext: () => null,
    appendChild(child) { node.children.push(child); return child; },
    append(...kids) { node.children.push(...kids); },
    replaceChildren(...kids) { node.children = kids; },
    setAttribute(k, v) { node.attributes[k] = String(v); if (k.startsWith('data-')) node.dataset[k.slice(5).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = String(v); },
    getAttribute(k) { return node.attributes[k] ?? null; },
    addEventListener(type, fn) { node.listeners[type] = fn; }
  };
  return node;
}
const fakeDoc = { createElement: fakeElement, createElementNS: (ns, tag) => fakeElement(tag) };
const mount = { ...fakeElement('div'), ownerDocument: fakeDoc };
mount.appendChild = (child) => { mount.children.push(child); return child; };
const picked = [];
const panel = createEpPanel(mount, { getLang: () => 'tr', onScenario: (id) => picked.push(id) });
assert.ok(panel && panel.element.className === 'egm-panel', 'panel root class');
// The lesson content sits in the .ep-lesson box (the live laboratory replaces it as a whole).
const hasClass = (c, name) => (c.className || '').split(' ').includes(name);
const lessonBox = panel.element.children.find((c) => hasClass(c, 'ep-lesson'));
const columns = lessonBox.children;
assert.deepEqual(columns.map((c) => c.className), ['ep-strip', 'ep-side'], 'strip column beside the side column');
const viewBarOf = () => columns[0].children.find((c) => hasClass(c, 'ep-view'));
const byClass = (name) => [...panel.element.children, ...columns.flatMap((c) => c.children)].find((c) => hasClass(c, name));
const tabs = byClass('ep-sections');
const row = byClass('egm-scenarios');
const text = byClass('egm-text');
const title = byClass('egm-title');
assert.equal(tabs.children.length, 8, 'three lesson sections, the live recording, the mapping, pace map, EGM basics and SVT algorithm tabs');

// Lesson entry: the legacy scenario ids open the treatment clips.
panel.openLesson('sinus');
assert.deepEqual(panel.getState(), { section: 'treatment', caseId: 'avnrt-typical', clipId: 'sinus', evidence: false, live: false });
assert.deepEqual(row.children.map((b) => b.attributes['data-egm-scenario']), ['sinus', 'slow-target', 'junctional-rf', 'junctional-va-block'], 'legacy treatment clips in order');
assert.equal(row.children[0].attributes['aria-pressed'], 'true');
row.children[2].listeners.click();
assert.deepEqual(picked, ['junctional-rf'], 'onScenario called on click');
assert.ok(text.textContent.includes('tek başına'), 'junctional text warns');
assert.ok(byClass('ep-endpoint').textContent.includes('indüklenememesi'), 'endpoint shown in treatment');

// Diagnosis: numbered cases, neutral title, evidence toggle.
tabs.children[0].listeners.click();
assert.equal(panel.getState().section, 'diagnosis');
assert.equal(title.textContent, 'Taşikardi kaydı (mekanizma gizli)', 'mechanism hidden');
const caseSelect = byClass('ep-case').children[1];
assert.ok(caseSelect.children.every((o) => /^Olgu \d\d$/.test(o.textContent)), 'diagnosis cases are numbered, not named');
assert.ok(text.textContent.includes('Kanıtı göster'), 'neutral prompt');
const evidence = byClass('ep-evidence');
assert.equal(evidence.hidden, false);
evidence.listeners.click();
assert.equal(panel.getState().evidence, true);
assert.ok(title.textContent.includes('AVNRT'), 'evidence reveals the mechanism');
assert.ok(byClass('ep-compare').textContent.includes('CS ağzı karşılaştırması'), 'CS ostium comparison note');
evidence.listeners.click();
assert.equal(panel.getState().evidence, false, 'evidence toggles back');

// Maneuvers: card fields and validity state.
tabs.children[1].listeners.click();
panel.setScenario('avnrt-typ-vop-noncapture');
assert.equal(byClass('ep-result').dataset.result, 'invalidCapture');
assert.ok(byClass('ep-result').textContent.includes('yakalama yok'));
const card = byClass('ep-card');
assert.equal(card.children.length, 10, 'five dt/dd pairs on the maneuver card');
assert.ok(byClass('ep-measures').textContent.includes('TCL 360 ms'), 'measurements from the events');

// Language switch and unknown ids.
panel.setLanguage('en');
assert.equal(tabs.children[3].textContent, 'Live recording');
assert.ok(byClass('ep-result').textContent.includes('no capture'));
panel.setScenario('bogus');
assert.equal(panel.getScenario(), 'avnrt-typ-vop-noncapture', 'unknown scenario ignored');
assert.doesNotThrow(() => panel.draw({ phase: 0.3 }));
assert.doesNotThrow(() => panel.draw(null));

// Pharmacological examples own the strip only while active, and their phase
// title follows the selected drug and language.
panel.setScenario('avnrt-typ-parahis');
const pharma = byClass('ep-pharma');
const pharmaAction = (id) => pharma.children.find((n) => n.className === 'ep-pace-actions').children.find((b) => b.dataset.epPharmaAction === id);
pharmaAction('show').listeners.click();
assert.equal(panel.getRecording().lab, 'pharma');
assert.equal(panel.getRecording().phase, 'after');
assert.ok(title.textContent.includes('Atropine') && title.textContent.includes('After'));
assert.equal(panel.getZone(), null, 'drug effect is not an ablation target');
const phaseRow = pharma.children.find((n) => n.dataset.epPharmaPhases === '');
phaseRow.children[0].listeners.click();
assert.equal(panel.getRecording().phase, 'before');
panel.setLanguage('tr');
assert.ok(title.textContent.includes('Atropin') && title.textContent.includes('Önce'));
panel.setScenario('avnrt-typ-parahis');
assert.equal(pharma.children.find((n) => n.tagName === 'table').hidden, true, 'comparison retires when another strip is active');
tabs.children[0].listeners.click();
assert.equal(pharma.hidden, true, 'drug panel stays in Maneuvers');
panel.hide();
assert.equal(panel.element.hidden, true);
panel.show();
assert.equal(panel.element.hidden, false);


// The schematic shows the zone only once the reading is open.
panel.setScenario('sinus');
assert.equal(panel.getState().section, 'treatment');
assert.equal(panel.schematic.getOptions().zone, 'koch-slow-pathway', 'zone on the schematic');
tabs.children[0].listeners.click();
assert.equal(panel.schematic.getOptions().zone, null, 'neutral diagnosis hides the zone');

// Ladder: locked while the diagnosis is neutral, open with the evidence.
const ladderBtn = viewBarOf().children.find((c) => c.attributes['data-ep-ladder'] === '');
tabs.children[0].listeners.click();
panel.setScenario('avnrt-typ-svt');
ladderBtn.listeners.click();
assert.equal(ladderBtn.disabled, true, 'locked in the neutral diagnosis');
assert.equal(panel.getView().ladder, false);
byClass('ep-evidence').listeners.click();
assert.equal(ladderBtn.disabled, false, 'open with the evidence');
assert.equal(panel.getView().ladder, true);

// Views: the live tab replaces the lesson box; onSection reports tab clicks.
const seen = [];
const mount2 = { ...fakeElement('div'), ownerDocument: fakeDoc };
mount2.appendChild = (child) => { mount2.children.push(child); return child; };
const panel2 = createEpPanel(mount2, { getLang: () => 'tr', initial: 'live', onSection: (id) => seen.push(id) });
assert.equal(panel2.getActiveView(), 'live', 'initial live view');
const lesson2 = panel2.element.children.find((c) => hasClass(c, 'ep-lesson'));
assert.equal(lesson2.hidden, true, 'lesson hidden in live view');
const tabs2 = panel2.element.children.find((c) => hasClass(c, 'ep-sections'));
tabs2.children[0].listeners.click();
assert.equal(panel2.getActiveView(), 'diagnosis');
assert.equal(lesson2.hidden, false);
tabs2.children[3].listeners.click();
assert.deepEqual(seen, ['diagnosis', 'live']);
panel2.showView('treatment');
assert.equal(panel2.getActiveView(), 'treatment');
panel2.showView('bogus');
assert.equal(panel2.getActiveView(), 'treatment', 'unknown view ignored');
panel2.live.setActive(false);

console.log('PASS ep-panel: strip + side columns, sections, neutral diagnosis with evidence toggle, maneuver cards and validity, schematic zone, live view and onSection, pharmacology strips, TR/EN');

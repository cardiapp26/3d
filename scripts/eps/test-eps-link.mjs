// Links from the 3D simulator to the EPS page (src/eps-link.js): the lesson
// clip table matches the lesson steps and the EPS catalog (neutral title and
// no zone for a diagnosis clip, the case zone once the reading is open), the
// clip address round-trips through the EPS router, and the lesson card
// shows only for a known recording.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LESSON_CLIPS, epsClipUrl, createEpsHandoff, epsLinkMarkup, EPS_URL } from '../../src/eps-link.js';
import { epRecording, EP_CASES } from '../../src/eps/ep-cases.js';
import { EP_TEXT, EP_CLIP_TEXT } from '../../src/eps/ep-case-text.js';
import { clipFromHash } from '../../src/eps/app-text.js';

// Every lesson step recording is in the table, and nothing else.
const content = readFileSync(new URL('../../src/content.js', import.meta.url), 'utf8');
const lessonClips = new Set([...content.matchAll(/\begm:\s*'([\w-]+)'/g)].map((m) => m[1]));
assert.ok(lessonClips.size > 0, 'lesson steps carry recordings');
assert.deepEqual([...lessonClips].sort(), Object.keys(LESSON_CLIPS).sort(), 'table matches the lesson steps');

for (const [clip, entry] of Object.entries(LESSON_CLIPS)) {
  const recording = epRecording(clip);
  assert.ok(recording, `${clip}: in the EPS catalog`);
  const neutral = recording.section === 'diagnosis';
  const zone = EP_CASES.find((c) => c.id === recording.caseId)?.pathwayZone || null;
  assert.equal(entry.zone, neutral ? null : zone, `${clip}: zone only once the reading is open`);
  for (const lang of ['tr', 'en']) {
    const expected = neutral ? EP_TEXT[lang][recording.maneuver === 'a-extra' ? 'extrastimulusTitle' : 'neutralTitle'] : EP_CLIP_TEXT[clip][lang].title;
    assert.equal(entry.title[lang], expected, `${clip} ${lang}: same title as the EPS strip`);
  }
  // The EPS router reads the address back.
  assert.equal(clipFromHash(epsClipUrl(clip).slice(EPS_URL.length)), clip, `${clip}: address round trip`);
}

// Header markup.
assert.match(epsLinkMarkup('en'), /href="\.\/eps\/"/);
assert.match(epsLinkMarkup('en'), /EPS laboratory/);
assert.match(epsLinkMarkup('tr'), /EPS laboratuvarı/);

// Lesson card against a minimal fake DOM.
function fake(tag) {
  const n = { tag, children: [], hidden: true, textContent: '', className: '', href: '', attributes: {},
    setAttribute(k, v) { n.attributes[k] = String(v); }, append(...k) { n.children.push(...k); } };
  return n;
}
const doc = { createElement: fake };
const mount = { ...fake('div'), ownerDocument: doc };
mount.append = (...k) => mount.children.push(...k);
let lang = 'tr';
const card = createEpsHandoff(mount, { getLang: () => lang });
card.show('sinus');
assert.equal(mount.hidden, false, 'card shown for a lesson recording');
const link = mount.children.find((c) => c.attributes['data-eps-handoff-link'] === '');
assert.equal(link.href, './eps/#/clip/sinus');
assert.equal(mount.children[1].textContent, 'Sinüs ritmi: AH ve HV');
lang = 'en';
card.render();
assert.equal(link.textContent, 'Open in the EPS laboratory');
card.show('bogus');
assert.equal(mount.hidden, true, 'unknown recording hides the card');
assert.equal(card.getClip(), null);
card.show(null);
assert.equal(mount.hidden, true);
assert.doesNotThrow(() => createEpsHandoff(null, { getLang: () => 'tr' }).show('sinus'), 'missing mount is harmless');

console.log(`PASS eps-link: ${Object.keys(LESSON_CLIPS).length} lesson recordings match the steps and the EPS catalog (titles, zones), clip address round trip, header markup, lesson card`);

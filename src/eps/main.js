// EPS laboratory entry: the shared Cardia header (site-header.js) with the
// language switch (shared with the 3D page), the EP panel
// (Diagnosis / Maneuvers / Treatment lessons, the live recording
// workstation, activation mapping, pace mapping, the electrogram basics,
// SVT, WPW and VES localization, ep-panel.js) and the
// site notice. The open tab lives in the address (#/live, #/diagnosis,
// #/maneuver, #/treatment, #/mapping, #/pacemap, #/basics, #/svt, #/wpw, #/ves); #/clip/<id> opens
// one recording (the 3D ablation lesson links to its clips this way).
import './style.css';
import { mountSiteHeader } from '../site-header.js';
import { createPersonalNotes } from '../personal-notes.js';
import './lesson.css';
import './ves-loc.css';
import { APP_TEXT, LANGS, resolveLang, viewFromHash, clipFromHash } from './app-text.js';
import { createEpPanel, EP_VIEWS } from './ep-panel.js';
import { initialLanguage, rememberLanguage } from '../entry-language.js';
import { linkToLastRoute } from '../entry-route.js';
import { registerOffline } from './offline.js';

let lang = resolveLang(location.search, initialLanguage());
// Notes drawer (right edge), created once the header exists.
let notes = null;
const getLang = () => lang;

const langGroup = document.querySelector('[data-app-lang]');
const shortcuts = document.querySelector('[data-app-shortcuts]');
const disclaimer = document.querySelector('[data-app-disclaimer]');
const workspace = document.querySelector('[data-app-workspace]');

const panel = createEpPanel(workspace, {
  getLang,
  initial: clipFromHash(location.hash) ? 'treatment' : viewFromHash(location.hash, EP_VIEWS),
  onSection: (id) => { history.replaceState(null, '', `#/${id}`); }
});
const live = panel.live;

/** Open the tab or the recording the address names (an unknown clip leaves the lessons open). */
function followHash() {
  const clip = clipFromHash(location.hash);
  if (!clip) { panel.showView(viewFromHash(location.hash, EP_VIEWS)); return; }
  panel.showView(panel.getActiveView() === 'live' ? 'treatment' : panel.getActiveView());
  panel.setScenario(clip);
}
followHash();
window.addEventListener('hashchange', followHash);

const langButtons = LANGS.map((id) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = id.toUpperCase();
  button.setAttribute('data-app-lang-option', id);
  button.addEventListener('click', () => setLang(id));
  langGroup.append(button);
  return button;
});

function renderShell() {
  const t = APP_TEXT[lang];
  document.documentElement.lang = lang;
  document.title = t.title;
  mountSiteHeader(document.querySelector('.site-header'), lang);
  notes?.refresh();
  linkToLastRoute(document);
  langGroup.setAttribute('aria-label', t.langLabel);
  for (const button of langButtons) button.setAttribute('aria-pressed', String(button.dataset.appLangOption === lang));
  shortcuts.textContent = t.shortcuts;
  disclaimer.textContent = t.disclaimer;
}

function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return;
  lang = next;
  rememberLanguage(lang);
  renderShell();
  panel.setLanguage(lang);
}

// Space freezes or resumes the live sweep, and plays or pauses the AF map,
// wherever the focus is, except in a field that takes text typing. A
// focused button, select dropdown (speed, rate, case, site) or slider
// (after a click on Run, Calipers, the time slider ...) would otherwise take the key.
const TEXT_INPUT = 'textarea, input:is([type=text], [type=search], [type=password], [type=email], [type=url], :not([type])), [contenteditable=""], [contenteditable="true"]';
const isSpaceKey = (event) => event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar';

/** The play / freeze control Space presses in the open view, or null. */
function spaceTarget() {
  const view = panel.getActiveView();
  if (view === 'live' || (!live.element.hidden && live.element.offsetParent !== null)) {
    return live.element.querySelector('[data-ep-live-run]');
  }
  if (view === 'afmap') {
    const play = panel.afmap.element.querySelector('[data-afmap-play]');
    return play && !play.parentElement?.hidden ? play : null;
  }
  return null;
}
const spaceTargetFor = (event) => (isSpaceKey(event) && !event.target.closest?.(TEXT_INPUT) ? spaceTarget() : null);
document.addEventListener('keydown', (event) => {
  const target = spaceTargetFor(event);
  if (!target) return;
  event.preventDefault();
  if (!event.repeat) target.click();
}, true);
// A focused button or select clicks itself on key release; stop that so Space only plays or freezes.
document.addEventListener('keyup', (event) => { if (spaceTargetFor(event)) event.preventDefault(); }, true);

// Strips are redrawn when the window changes size (a frozen sweep included).
window.addEventListener('resize', () => { if (panel.getActiveView() === 'live') live.render(); else panel.draw(); });

renderShell();
notes = createPersonalNotes({ getLang: () => lang });
window.addEventListener('load', () => { registerOffline(); });

/** Test hooks (browser tests). */
window.epsLab = { panel, live, setLang, getLang };

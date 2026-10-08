// EPS laboratory entry: header with the link back to the 3D simulator and
// the language switch (shared with the 3D page), the EP panel
// (Diagnosis / Maneuvers / Treatment lessons, the live recording
// workstation, activation mapping, pace mapping, the electrogram basics,
// SVT, WPW and VES localization, ep-panel.js) and the
// site notice. The open tab lives in the address (#/live, #/diagnosis,
// #/maneuver, #/treatment, #/mapping, #/pacemap, #/basics, #/svt, #/wpw, #/ves); #/clip/<id> opens
// one recording (the 3D ablation lesson links to its clips this way).
import './style.css';
import './lesson.css';
import './ves-loc.css';
import { APP_TEXT, LANGS, CARDIA_URL, resolveLang, viewFromHash, clipFromHash } from './app-text.js';
import { createEpPanel, EP_VIEWS } from './ep-panel.js';
import { initialLanguage, rememberLanguage } from '../entry-language.js';
import { simulatorHref } from '../entry-route.js';
import { registerOffline } from './offline.js';

let lang = resolveLang(location.search, initialLanguage());
const getLang = () => lang;

const title = document.querySelector('[data-app-title]');
const subtitle = document.querySelector('[data-app-subtitle]');
const langGroup = document.querySelector('[data-app-lang]');
const shortcuts = document.querySelector('[data-app-shortcuts]');
const back = document.querySelector('[data-app-back]');
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
  title.textContent = t.title;
  subtitle.textContent = t.subtitle;
  langGroup.setAttribute('aria-label', t.langLabel);
  for (const button of langButtons) button.setAttribute('aria-pressed', String(button.dataset.appLangOption === lang));
  shortcuts.textContent = t.shortcuts;
  back.textContent = t.back;
  back.title = t.backTitle;
  back.href = simulatorHref(CARDIA_URL);
  document.querySelector('[data-app-pharmacology]').textContent = lang === 'tr' ? 'Farmakoloji' : 'Pharmacology';
  const ecgLink = document.querySelector('[data-app-ecg]');
  if (ecgLink) ecgLink.textContent = lang === 'tr' ? 'EKG' : 'ECG';
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
// wherever the focus is, except in a field that takes typing or a list. A
// focused button or slider (after a click on Run, Calipers, the time slider
// ...) would otherwise take the key.
const TYPING = 'textarea, select, [contenteditable=""], [contenteditable="true"], input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=button])';
/** The play / freeze control Space presses in the open view, or null. */
function spaceTarget() {
  const view = panel.getActiveView();
  if (view === 'live') return live.element.querySelector('[data-ep-live-run]');
  if (view === 'afmap') { const play = panel.afmap.element.querySelector('[data-afmap-play]'); return play && !play.parentElement?.hidden ? play : null; }
  return null;
}
const spaceTargetFor = (event) => (event.code === 'Space' && !event.target.closest?.(TYPING) ? spaceTarget() : null);
document.addEventListener('keydown', (event) => {
  const target = spaceTargetFor(event);
  if (!target) return;
  event.preventDefault();
  if (!event.repeat) target.click();
}, true);
// A focused button clicks itself on key release; stop that so Space only plays or freezes.
document.addEventListener('keyup', (event) => { if (spaceTargetFor(event)) event.preventDefault(); }, true);

// Strips are redrawn when the window changes size (a frozen sweep included).
window.addEventListener('resize', () => { if (panel.getActiveView() === 'live') live.render(); else panel.draw(); });

renderShell();
window.addEventListener('load', () => { registerOffline(); });

/** Test hooks (browser tests). */
window.epsLab = { panel, live, setLang, getLang };

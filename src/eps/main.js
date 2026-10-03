// EPS laboratory entry: header with the link back to the 3D simulator and
// the language switch (shared with the 3D page), the EP panel
// (Diagnosis / Maneuvers / Treatment lessons, the live recording
// workstation, activation mapping and pace mapping, ep-panel.js) and the
// site notice. The open tab lives in the address (#/live, #/diagnosis,
// #/maneuver, #/treatment, #/mapping, #/pacemap); #/clip/<id> opens
// one recording (the 3D ablation lesson links to its clips this way).
import './style.css';
import './lesson.css';
import { APP_TEXT, LANGS, CARDIA_URL, resolveLang, viewFromHash, clipFromHash } from './app-text.js';
import { createEpPanel, EP_VIEWS } from './ep-panel.js';
import { initialLanguage, rememberLanguage } from '../entry-language.js';
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
  back.href = CARDIA_URL;
  disclaimer.textContent = t.disclaimer;
}

function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return;
  lang = next;
  rememberLanguage(lang);
  renderShell();
  panel.setLanguage(lang);
}

// Space freezes or resumes the live sweep unless a form control has the focus.
document.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || event.repeat || panel.getActiveView() !== 'live') return;
  if (event.target.closest?.('input, select, textarea, button')) return;
  event.preventDefault();
  live.element.querySelector('[data-ep-live-run]')?.click();
});

// Strips are redrawn when the window changes size (a frozen sweep included).
window.addEventListener('resize', () => { if (panel.getActiveView() === 'live') live.render(); else panel.draw(); });

renderShell();
window.addEventListener('load', () => { registerOffline(); });

/** Test hooks (browser tests). */
window.epsLab = { panel, live, setLang, getLang };

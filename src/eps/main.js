// EPS laboratory entry: header with the language switch, the EP panel
// (Diagnosis / Maneuvers / Treatment lessons and the live recording
// workstation, ep-panel.js) and the site notice. The open tab lives in the
// address (#/live, #/diagnosis, #/maneuver, #/treatment).
import './style.css';
import './lesson.css';
import { APP_TEXT, LANGS, LANG_KEY, resolveLang, viewFromHash } from './app-text.js';
import { createEpPanel, EP_VIEWS } from './ep-panel.js';

const readStored = () => { try { return localStorage.getItem(LANG_KEY); } catch { return null; } };
const writeStored = (lang) => { try { localStorage.setItem(LANG_KEY, lang); } catch { /* private mode */ } };

let lang = resolveLang(location.search, readStored());
const getLang = () => lang;

const title = document.querySelector('[data-app-title]');
const subtitle = document.querySelector('[data-app-subtitle]');
const langGroup = document.querySelector('[data-app-lang]');
const shortcuts = document.querySelector('[data-app-shortcuts]');
const disclaimer = document.querySelector('[data-app-disclaimer]');
const workspace = document.querySelector('[data-app-workspace]');

const panel = createEpPanel(workspace, {
  getLang,
  initial: viewFromHash(location.hash, EP_VIEWS),
  onSection: (id) => { history.replaceState(null, '', `#/${id}`); }
});
const live = panel.live;
window.addEventListener('hashchange', () => panel.showView(viewFromHash(location.hash, EP_VIEWS)));

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
  disclaimer.textContent = t.disclaimer;
}

function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return;
  lang = next;
  writeStored(lang);
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

/** Test hooks (browser tests). */
window.epsLab = { panel, live, setLang, getLang };

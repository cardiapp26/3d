import { mountSiteHeader } from '../site-header.js';
import { initialLanguage, rememberLanguage } from '../entry-language.js';
import { linkToLastRoute } from '../entry-route.js';
import { createCardiacCtPanel } from './cardiac-ct-panel.js';
import { SHELL_TEXT } from './cardiac-ct-data.js';
import '../angio/angio-studio.css';
import './cardiac-ct.css';

const params = new URLSearchParams(location.search);
let lang = ['tr', 'en'].includes(params.get('lang')) ? params.get('lang') : initialLanguage();
const mount = document.querySelector('[data-ct-root]');
const panel = mount ? createCardiacCtPanel({ mount, getLang: () => lang }) : null;

function renderShell() {
  const text = SHELL_TEXT[lang] || SHELL_TEXT.tr;
  document.documentElement.lang = lang;
  document.title = text.title;
  mountSiteHeader(document.querySelector('.site-header'), lang);
  linkToLastRoute(document);
  const footer = document.querySelector('[data-ct-disclaimer]');
  if (footer) footer.textContent = text.disclaimer;
  document.querySelectorAll('[data-ct-lang]').forEach((button) => {
    const active = button.dataset.ctLang === lang;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

document.querySelectorAll('[data-ct-lang]').forEach((button) =>
  button.addEventListener('click', () => {
    const next = button.dataset.ctLang;
    if (next === lang) return;
    lang = next;
    rememberLanguage(lang);
    const url = new URL(location.href);
    url.searchParams.delete('lang');
    history.replaceState(null, '', url);
    renderShell();
    panel?.render();
  })
);

renderShell();

function showOfflineCacheNotice() {
  const footer = document.querySelector('[data-ct-disclaimer]');
  if (!footer || document.querySelector('[data-ct-sw-note]')) return;
  const note = document.createElement('p');
  note.className = 'ct-sw-note';
  note.setAttribute('role', 'status');
  note.dataset.ctSwNote = '';
  note.textContent = lang === 'tr'
    ? 'Çevrimdışı önbellek etkinleştirilemedi; modül yalnızca çevrimiçi çalışır.'
    : 'Offline cache could not be enabled; the module works online only.';
  footer.insertAdjacentElement('afterend', note);
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('../sw.js', { scope: '../', updateViaCache: 'none' })
    .catch(() => showOfflineCacheNotice());
}

window.cardiacCt = panel;

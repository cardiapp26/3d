import { mountSiteHeader } from '../../site-header.js';
import { initialLanguage, rememberLanguage } from '../../entry-language.js';
import { linkToLastRoute } from '../../entry-route.js';
import { createCoronaryIvusPanel } from './coronary-ivus-panel.js';
import { SHELL_TEXT } from './coronary-ivus-data.js';
import '../angio-studio.css';
import './coronary-ivus.css';

const params = new URLSearchParams(location.search);
let lang = ['tr', 'en'].includes(params.get('lang')) ? params.get('lang') : initialLanguage();
const mount = document.querySelector('[data-ivus-root]');
const panel = mount ? createCoronaryIvusPanel({ mount, getLang: () => lang }) : null;

function renderShell() {
  const text = SHELL_TEXT[lang];
  document.documentElement.lang = lang;
  document.title = text.title;
  mountSiteHeader(document.querySelector('.site-header'), lang);
  linkToLastRoute(document);
  const footer = document.querySelector('[data-ivus-disclaimer]');
  if (footer) footer.textContent = text.disclaimer;
  document.querySelectorAll('[data-ivus-lang]').forEach((button) => {
    const active = button.dataset.ivusLang === lang;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

document.querySelectorAll('[data-ivus-lang]').forEach((button) =>
  button.addEventListener('click', () => {
    const next = button.dataset.ivusLang;
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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('../../sw.js', { scope: '../../', updateViaCache: 'none' })
    .catch((error) => console.warn('Coronary IVUS offline cache unavailable', error));
}

window.coronaryIvus = panel;

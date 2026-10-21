import { mountSiteHeader } from '../../site-header.js';
import { initialLanguage, rememberLanguage } from '../../entry-language.js';
import { linkToLastRoute } from '../../entry-route.js';
import { createPeripheralPanel } from './peripheral-panel.js';
import { SHELL } from './peripheral-data.js';
import '../angio-studio.css';
import './peripheral.css';

const params = new URLSearchParams(location.search);
let lang = ['tr', 'en'].includes(params.get('lang')) ? params.get('lang') : initialLanguage();
const mount = document.querySelector('[data-peri-root]');
const panel = mount ? createPeripheralPanel({ mount, getLang: () => lang }) : null;

function renderShell() {
  const text = SHELL[lang];
  document.documentElement.lang = lang;
  document.title = text.title;
  mountSiteHeader(document.querySelector('.site-header'), lang);
  linkToLastRoute(document);
  const footer = document.querySelector('[data-peri-disclaimer]');
  if (footer) footer.textContent = text.disclaimer;
  document.querySelectorAll('[data-peri-lang]').forEach(button => {
    const active = button.dataset.periLang === lang;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

document.querySelectorAll('[data-peri-lang]').forEach(button => button.addEventListener('click', () => {
  const next = button.dataset.periLang;
  if (next === lang) return;
  lang = next;
  rememberLanguage(lang);
  const url = new URL(location.href);
  url.searchParams.delete('lang');
  history.replaceState(null, '', url);
  renderShell();
  panel?.render();
}));

renderShell();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../../sw.js', { scope: '../../', updateViaCache: 'none' })
    .catch(error => console.warn('Peripheral angiography offline cache unavailable', error));
}

window.peripheralAngio = panel;

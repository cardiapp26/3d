import { mountSiteHeader } from '../../site-header.js';
import { initialLanguage, rememberLanguage } from '../../entry-language.js';
import { linkToLastRoute } from '../../entry-route.js';
import { createCoronaryPhysiologyPanel } from './coronary-physiology-panel.js';
import { SHELL_TEXT } from './coronary-physiology-data.js';
import '../angio-studio.css';
import './coronary-physiology.css';

const params = new URLSearchParams(location.search);
let lang = ['tr', 'en'].includes(params.get('lang')) ? params.get('lang') : initialLanguage();
const mount = document.querySelector('[data-phys-root]');
const panel = mount ? createCoronaryPhysiologyPanel({ mount, getLang: () => lang }) : null;

function renderShell() {
  const text = SHELL_TEXT[lang];
  document.documentElement.lang = lang;
  document.title = text.title;
  mountSiteHeader(document.querySelector('.site-header'), lang);
  linkToLastRoute(document);
  const footer = document.querySelector('[data-phys-disclaimer]');
  if (footer) footer.textContent = text.disclaimer;
  document.querySelectorAll('[data-phys-lang]').forEach((button) => {
    const active = button.dataset.physLang === lang;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

document.querySelectorAll('[data-phys-lang]').forEach((button) =>
  button.addEventListener('click', () => {
    const next = button.dataset.physLang;
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
    .catch((error) => console.warn('Coronary physiology offline cache unavailable', error));
}

window.coronaryPhysiology = panel;

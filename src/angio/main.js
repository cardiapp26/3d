// Coronary Angiography Module Entry Point (angio/index.html)
import { createAngioStudio } from './angio-studio.js';
import { mountSiteHeader } from '../site-header.js';
import './angio-studio.css';
import { initialLanguage, rememberLanguage } from '../entry-language.js';
import { linkToLastRoute } from '../entry-route.js';

const params = new URLSearchParams(location.search);
let lang = ['tr', 'en'].includes(params.get('lang')) ? params.get('lang') : initialLanguage();

const TEXTS = {
  tr: {
    title: 'Cardia · Koroner Anjiyografi & C-Arm Stüdyosu',
    disclaimer: 'Cardia’nın mevcut 3B kalp atlası ve floroskopi görünümü kullanılır. Floroskopi, atlas yüzeylerinin geometrik projeksiyonudur; hasta röntgeni değildir. C-arm cihazı ve koroner lezyon alıştırması şematiktir. Eğitim ve simülasyon amaçlıdır.'
  },
  en: {
    title: 'Cardia · Coronary Angiography & C-Arm Studio',
    disclaimer: 'Uses the existing Cardia 3D heart atlas and fluoroscopy view. Fluoroscopy is a geometric projection of atlas surfaces, not a patient radiograph. The C-arm device and coronary lesion exercise are schematic. For education and simulation.'
  }
};

const text = (selector, val) => {
  const el = document.querySelector(selector);
  if (el) el.textContent = val;
};

const workspace = document.querySelector('[data-angio-workspace]');
let studio = null;

if (workspace) {
  studio = createAngioStudio({
    mount: workspace,
    getLang: () => lang
  });
}

function renderShell() {
  const t = TEXTS[lang];
  document.documentElement.lang = lang;
  document.title = t.title;

  mountSiteHeader(document.querySelector('.site-header'), lang);
  linkToLastRoute(document);
  text('[data-angio-disclaimer]', t.disclaimer);

  document.querySelectorAll('[data-angio-lang]').forEach(btn => {
    const isAct = btn.dataset.angioLang === lang;
    btn.classList.toggle('active', isAct);
    btn.setAttribute('aria-pressed', String(isAct));
  });
}

document.querySelectorAll('[data-angio-lang]').forEach(btn => {
  btn.addEventListener('click', () => {
    const next = btn.dataset.angioLang;
    if (next === lang) return;
    lang = next;
    rememberLanguage(lang);

    const url = new URL(location.href);
    url.searchParams.delete('lang');
    history.replaceState(null, '', url);

    renderShell();
    studio?.render();
  });
});

renderShell();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../sw.js', { scope: '../', updateViaCache: 'none' })
    .catch(err => console.warn('Angio offline cache unavailable', err));
}

window.angioStudio = studio;

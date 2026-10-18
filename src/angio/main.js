// Coronary Angiography Module Entry Point (angio/index.html)
import { createAngioStudio } from './angio-studio.js';
import './angio-studio.css';
import { initialLanguage, rememberLanguage } from '../entry-language.js';
import { linkToLastRoute } from '../entry-route.js';

const params = new URLSearchParams(location.search);
let lang = ['tr', 'en'].includes(params.get('lang')) ? params.get('lang') : initialLanguage();

const TEXTS = {
  tr: {
    title: 'Cardia · Koroner Anjiyografi & C-Arm Stüdyosu',
    badge: 'KORONER ANJİYOGRAFİ',
    back: '3D Anatomi',
    eps: 'EPS',
    pharma: 'Farmakoloji',
    ecg: 'EKG',
    angio: 'Anjiyografi',
    disclaimer: 'Eğitim ve simülasyon amaçlıdır. AngioView, Kern (Cardiac Catheterization Handbook) ve SCAI kılavuzları temel alınarak C-arm projeksiyon açıları (LAO/RAO, Cranial/Caudal), damar kısalması (foreshortening), süperpozisyon ve koroner lezyonlar modellenmiştir. Klinik kararlar için uzman hekim değerlendirmesi esastır.'
  },
  en: {
    title: 'Cardia · Coronary Angiography & C-Arm Studio',
    badge: 'CORONARY ANGIOGRAPHY',
    back: '3D Anatomy',
    eps: 'EPS',
    pharma: 'Pharmacology',
    ecg: 'ECG',
    angio: 'Angiography',
    disclaimer: 'For educational and simulation use. C-arm gantry projections (LAO/RAO, Cranial/Caudal), vessel foreshortening, branch overlap, and coronary stenosis profiles modeled after AngioView, Kern (Cardiac Catheterization Handbook), and SCAI guidelines. Clinical decisions require licensed physician assessment.'
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

  text('.ecg-brand-badge', t.badge);
  text('[data-simulator-link]', t.back);
  linkToLastRoute(document);
  text('[data-angio-disclaimer]', t.disclaimer);

  const epsLink = document.querySelector('[href="../eps/"]');
  if (epsLink) epsLink.textContent = t.eps;
  const pharmaLink = document.querySelector('[href="../pharmacology/"]');
  if (pharmaLink) pharmaLink.textContent = t.pharma;
  const ecgLink = document.querySelector('[href="../ecg/"]');
  if (ecgLink) ecgLink.textContent = t.ecg;

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

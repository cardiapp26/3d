import { initialLanguage, rememberLanguage } from '../entry-language.js';
import { createGuytonEcgStudio } from './guyton-studio.js';
import './guyton-studio.css';

const params = new URLSearchParams(location.search);
let lang = ['tr', 'en'].includes(params.get('lang')) ? params.get('lang') : initialLanguage();

const TEXTS = {
  tr: {
    title: 'Cardia · EKG Fizyolojisi',
    badge: 'EKG FİZYOLOJİSİ',
    back: '3D Anatomi',
    eps: 'EPS',
    pharma: 'Farmakoloji',
    module: 'EKG',
    disclaimer: 'Eğitim amaçlıdır. Guyton & Hall Tıbbi Fizyoloji Ders Kitabı (Bölüm III: Kalp, 11., 12. ve 13. Bölümler) ve Netter Cardiovascular System (2. baskı, 2014, s. 34–48) temel alınarak vektöryel analiz, Einthoven kanunları, hasar akımı ve re-entry sirküler hareket ilkeleri modellenmiştir. Klinik tanı ve tedavi için yetkili uzman hekim değerlendirmesi esastır.'
  },
  en: {
    title: 'Cardia · ECG Physiology',
    badge: 'ECG PHYSIOLOGY',
    back: '3D Anatomy',
    eps: 'EPS',
    pharma: 'Pharmacology',
    module: 'ECG',
    disclaimer: 'For educational purposes. Vectorial analysis, Einthoven\'s law, current of injury and circus movement re-entry principles modeled after Guyton & Hall Textbook of Medical Physiology (Unit III: The Heart, Chapters 11, 12, and 13) and Netter Cardiovascular System (2nd edition, 2014, pp. 34–48). Clinical diagnosis and treatment require licensed medical evaluation.'
  }
};

const text = (selector, val) => {
  const el = document.querySelector(selector);
  if (el) el.textContent = val;
};

const workspace = document.querySelector('[data-ecg-workspace]');
const studio = createGuytonEcgStudio({
  mount: workspace,
  getLang: () => lang
});

function renderShell() {
  const t = TEXTS[lang];
  document.documentElement.lang = lang;
  document.title = t.title;

  text('.ecg-brand-badge', t.badge);
  text('[data-ecg-back]', t.back);
  text('[data-ecg-module]', t.module);
  text('[data-ecg-disclaimer]', t.disclaimer);

  const epsLink = document.querySelector('[href="../eps/"]');
  if (epsLink) epsLink.textContent = t.eps;
  const pharmaLink = document.querySelector('[href="../pharmacology/"]');
  if (pharmaLink) pharmaLink.textContent = t.pharma;

  document.querySelectorAll('[data-ecg-lang]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.ecgLang === lang));
  });
}

document.querySelectorAll('[data-ecg-lang]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = btn.dataset.ecgLang;
    if (next === lang) return;
    lang = next;
    rememberLanguage(lang);

    const url = new URL(location.href);
    url.searchParams.delete('lang');
    history.replaceState(null, '', url);

    renderShell();
    studio.render();
  });
});

renderShell();

// Register service worker if supported
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../sw.js', { scope: '../', updateViaCache: 'none' })
    .catch((err) => console.warn('Guyton ECG: offline cache unavailable', err));
}

window.guytonStudio = studio;

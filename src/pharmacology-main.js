import { initialLanguage, rememberLanguage } from './entry-language.js';
import { PHARMA_TOPICS } from './pharmacology-data.js';
import { pharmaText } from './pharmacology-model.js';
import { createPharmacologyPanel } from './pharmacology-panel.js';
import { createPharmacologyVisual } from './pharmacology-visual.js';
import { createPharmacologyElectrophysiology } from './pharmacology-electrophysiology.js';
import { createCoagulationPanel } from './coagulation-panel.js';
import { createDiureticsPanel } from './diuretics-panel.js';
import { createHeartFailurePharmacology } from './heart-failure-pharmacology.js';
import { createLipidPathways } from './lipid-pathways.js';
import { createLipidReference } from './lipid-reference-panel.js';
import { createAnginaPanel } from './angina-panel.js';
import './pharmacology-page.css';

const params = new URLSearchParams(location.search);
let lang = ['tr', 'en'].includes(params.get('lang')) ? params.get('lang') : initialLanguage();
let topicIndex = 0;
const WORDS = {
  tr: { title: 'Farmakoloji', eyebrow: 'KARDİYOVASKÜLER İLAÇ ATLASI', subtitle: 'Hedefi keşfet. Mekanizmayı anla. Güvenlik noktasını bul.', back: '3D Anatomi', chapter: 'BÖLÜM', topics: 'Farmakoloji alt başlıkları', sourceNote: 'İki PDF, iki sunum ve çevrimiçi kaynak; kartlarda kaynak izi.', disclaimer: 'Eğitim amaçlıdır. Görseller ve eğriler şematik öğretim modelleridir; klinik yanıt, doz veya reçete önerisi değildir. Hasta bakımında güncel kılavuz ve ürün bilgisi gerekir.' },
  en: { title: 'Pharmacology', eyebrow: 'CARDIOVASCULAR DRUG ATLAS', subtitle: 'Explore the target. Understand the mechanism. Find the safety point.', back: '3D Anatomy', chapter: 'CHAPTER', topics: 'Pharmacology topics', sourceNote: 'Two PDFs, two slide decks and online sources; references on each card.', disclaimer: 'For education. Visuals and curves are schematic teaching models, not clinical responses, doses or prescribing advice. Patient care requires current guidelines and product information.' }
};
const text = (selector, value) => { document.querySelector(selector).textContent = value; };
const visual = createPharmacologyVisual({ mount: document.querySelector('[data-pharma-visual]'), getLang: () => lang });
const electrical = createPharmacologyElectrophysiology({ mount: document.querySelector('[data-pharma-electrical]'), getLang: () => lang });
const coagulation = createCoagulationPanel({ mount: document.querySelector('[data-pharma-coagulation]'), getLang: () => lang });
const diuretics = createDiureticsPanel({ mount: document.querySelector('[data-pharma-diuretics]'), getLang: () => lang });
const heartFailure = createHeartFailurePharmacology({ mount: document.querySelector('[data-pharma-hf]'), getLang: () => lang });
const lipidPathways = createLipidPathways({ mount: document.querySelector('[data-pharma-lipids]'), getLang: () => lang });
const lipidReference = createLipidReference({ mount: document.querySelector('[data-pharma-lipid-reference]'), getLang: () => lang });
const angina = createAnginaPanel({ mount: document.querySelector('[data-pharma-angina]'), getLang: () => lang });
const panel = createPharmacologyPanel({
  mount: document.querySelector('[data-pharma-panel]'), getLang: () => lang,
  showTopicNav: false, onTopic: index => selectTopic(index),
  canFocus: () => PHARMA_TOPICS[topicIndex].id === 'principles',
  onFocus: target => {
    visual.setTarget(target);
    document.querySelector('.pharmaviz-target[aria-pressed=true]')?.focus({ preventScroll: true });
    document.querySelector('[data-pharma-visual]').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

function renderShell() {
  const w = WORDS[lang];
  document.documentElement.lang = lang;
  document.title = `Cardia · ${w.title}`;
  text('[data-pharma-title]', w.title);
  text('[data-pharma-module]', w.title);
  text('[data-pharma-eyebrow]', w.eyebrow);
  text('[data-pharma-subtitle]', w.subtitle);
  text('[data-pharma-back]', w.back);
  text('[data-pharma-source-note]', w.sourceNote);
  text('[data-pharma-disclaimer]', w.disclaimer);
  const nav = document.querySelector('[data-pharma-chapters]');
  nav.setAttribute('aria-label', w.topics);
  nav.replaceChildren(...PHARMA_TOPICS.map((topic, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.pharmaChapter = index;
    button.setAttribute('aria-current', String(topicIndex === index));
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    const label = document.createElement('span');
    label.textContent = pharmaText(topic.title, lang);
    button.append(number, label);
    button.addEventListener('click', () => selectTopic(index));
    return button;
  }));
  for (const button of document.querySelectorAll('[data-pharma-lang]')) button.setAttribute('aria-pressed', String(button.dataset.pharmaLang === lang));
  renderHeading();
}

function renderHeading() {
  const topic = PHARMA_TOPICS[topicIndex];
  text('[data-pharma-chapter-number]', `${WORDS[lang].chapter} ${String(topicIndex + 1).padStart(2, '0')} / ${String(PHARMA_TOPICS.length).padStart(2, '0')}`);
  text('[data-pharma-topic-title]', pharmaText(topic.title, lang));
  text('[data-pharma-topic-intro]', pharmaText(topic.intro, lang));
  document.querySelectorAll('[data-pharma-chapter]').forEach(button => button.setAttribute('aria-current', String(Number(button.dataset.pharmaChapter) === topicIndex)));
}

function selectTopic(index, updateUrl = true) {
  if (!PHARMA_TOPICS[index]) return;
  topicIndex = index;
  renderHeading();
  // One lab per chapter: the target overview belongs to principles, the EP lab to antiarrhythmics.
  document.querySelector('[data-pharma-visual]').hidden = PHARMA_TOPICS[index].id !== 'principles';
  document.querySelector('[data-pharma-electrical]').hidden = PHARMA_TOPICS[index].id !== 'antiarrhythmics';
  panel.setTopic(index);
  visual.setTopic(PHARMA_TOPICS[index].id);
  document.querySelector('[data-pharma-coagulation]').hidden = PHARMA_TOPICS[index].id !== 'antithrombotics';
  document.querySelector('[data-pharma-diuretics]').hidden = PHARMA_TOPICS[index].id !== 'diuretics';
  document.querySelector('[data-pharma-hf]').hidden = PHARMA_TOPICS[index].id !== 'heart-failure';
  document.querySelector('[data-pharma-lipids]').hidden = PHARMA_TOPICS[index].id !== 'lipids';
  document.querySelector('[data-pharma-lipid-reference]').hidden = PHARMA_TOPICS[index].id !== 'lipids';
  document.querySelector('[data-pharma-angina]').hidden = PHARMA_TOPICS[index].id !== 'antianginals';
  if (updateUrl) history.replaceState(null, '', `#/${PHARMA_TOPICS[index].id}`);
}

function followHash() {
  const id = location.hash.replace(/^#\/?/, '');
  const index = PHARMA_TOPICS.findIndex(topic => topic.id === id);
  selectTopic(index < 0 ? 0 : index, false);
}

document.querySelectorAll('[data-pharma-lang]').forEach(button => button.addEventListener('click', () => {
  const next = button.dataset.pharmaLang;
  if (next === lang) return;
  lang = next;
  rememberLanguage(lang);
  // A query language is an entry hint, not an override of a later explicit choice.
  const url = new URL(location.href);
  url.searchParams.delete('lang');
  history.replaceState(null, '', url);
  renderShell();
  panel.refresh();
  visual.refresh();
  electrical.refresh();
  coagulation.refresh();
  diuretics.refresh();
  heartFailure.refresh();
  lipidPathways.refresh();
  lipidReference.refresh();
  angina.refresh();
}));
window.addEventListener('hashchange', followHash);
renderShell();
panel.enter();
followHash();

// Register the shared worker even when this page is the first entry.
if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js', { scope: '../', updateViaCache: 'none' }).catch(error => console.warn('Pharmacology: offline support unavailable', error));

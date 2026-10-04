export const PHARMACOLOGY_URL = './pharmacology/';
const labels = { tr: 'Farmakoloji', en: 'Pharmacology' };

export function pharmacologyLinkMarkup(lang = 'tr') {
  return `<a id="pharmacology-link" class="eps-link pharmacology-link" href="${PHARMACOLOGY_URL}">${labels[lang === 'en' ? 'en' : 'tr']}</a>`;
}

export function syncPharmacologyLink(lang) {
  const link = document.querySelector('#pharmacology-link');
  if (link) link.textContent = labels[lang === 'en' ? 'en' : 'tr'];
}

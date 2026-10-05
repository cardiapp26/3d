export const ECG_URL = './ecg/';
const labels = { tr: 'EKG', en: 'ECG' };

export function ecgLinkMarkup(lang = 'tr') {
  return `<a id="ecg-link" class="eps-link ecg-link" href="${ECG_URL}">${labels[lang === 'en' ? 'en' : 'tr']}</a>`;
}

export function syncEcgLink(lang) {
  const link = document.querySelector('#ecg-link');
  if (link) link.textContent = labels[lang === 'en' ? 'en' : 'tr'];
}

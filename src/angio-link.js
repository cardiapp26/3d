export const ANGIO_URL = './angio/';
const labels = { tr: 'Anjiyografi', en: 'Angiography' };

export function angioLinkMarkup(lang = 'tr') {
  return `<a id="angio-link" class="eps-link angio-link" href="${ANGIO_URL}">${labels[lang === 'en' ? 'en' : 'tr']}</a>`;
}

export function syncAngioLink(lang) {
  const link = document.querySelector('#angio-link');
  if (link) link.textContent = labels[lang === 'en' ? 'en' : 'tr'];
}

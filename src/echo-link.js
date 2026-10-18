export const ECHO_URL = './echo/';
const labels = { tr: 'Eko', en: 'Echo' };

export function echoLinkMarkup(lang = 'tr') {
  return `<a id="echo-link" class="eps-link echo-link" href="${ECHO_URL}">${labels[lang === 'en' ? 'en' : 'tr']}</a>`;
}

export function syncEchoLink(lang) {
  const link = document.querySelector('#echo-link');
  if (link) link.textContent = labels[lang === 'en' ? 'en' : 'tr'];
}

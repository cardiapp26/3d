import { CARDIA_PAGES, currentPageId, fromRoot } from './cardia-pages.js';

// Header links between the 3D lesson pages that have no module link of their
// own (the EP anatomy and 3D angiography pages are reached from the EPS and
// angiography modules). The current page is left out.
const LINKED_PAGES = ['anatomy', 'exam', 'hemo'];
const LABELS = Object.freeze({
  anatomy: { tr: '3D Anatomi', en: '3D Anatomy' },
  exam: { tr: 'Fizik muayene', en: 'Physical exam' },
  hemo: { tr: 'Hemodinami', en: 'Hemodynamics' }
});
const label = (id, lang) => LABELS[id][lang === 'en' ? 'en' : 'tr'];

export function pageLinksMarkup(lang) {
  const current = currentPageId();
  return LINKED_PAGES.filter(id => id !== current)
    .map(id => `<a class="eps-link page-link" data-page-link="${id}" href="${fromRoot(CARDIA_PAGES[id].path)}">${label(id, lang)}</a>`)
    .join('');
}

export function syncPageLinks(lang) {
  document.querySelectorAll('[data-page-link]').forEach(link => {
    link.textContent = label(link.dataset.pageLink, lang);
  });
}

/** Module links are written relative to the site root; point them from this page. */
export function rebaseModuleLinks(container) {
  container?.querySelectorAll('a[href^="./"]').forEach(link => {
    if (!link.dataset.pageLink) link.setAttribute('href', fromRoot(link.getAttribute('href')));
  });
}

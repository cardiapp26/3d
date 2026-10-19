import { fromRoot } from './cardia-pages.js';
import { SITE_MODULES, SITE_BADGES } from './site-modules.js';
import './site-header.css';

// The header every Cardia page shares: brand, the page badge, the module menu
// (one order everywhere) and, for modules with more than one page, their
// sub-pages. A page writes <header class="site-header" data-site-page="...">
// with its own controls in .site-header-actions; mountSiteHeader adds the rest.

const pick = (text, lang) => text[lang === 'en' ? 'en' : 'tr'];
const moduleOfPage = page => SITE_MODULES.find(m => m.id === page || m.pages?.some(p => p.id === page)) || SITE_MODULES[0];
const escapeAttr = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function moduleLink(module, current, lang) {
  const active = module.id === current.id;
  const attrs = [
    `id="${module.id}-link"`,
    'class="site-module"',
    `data-site-link="${module.id}"`,
    `href="${fromRoot(module.path)}"`,
    module.id === 'anatomy' ? 'data-simulator-link' : '',
    active ? 'aria-current="page"' : '',
    module.title ? `title="${escapeAttr(pick(module.title, lang))}"` : ''
  ].filter(Boolean).join(' ');
  return `<a ${attrs}>${pick(module.label, lang)}</a>`;
}

function subPageLinks(module, page, lang) {
  if (!module.pages) return '';
  const links = module.pages.map(sub => `<a class="site-subpage" data-site-subpage="${sub.id}" href="${fromRoot(sub.path)}"${sub.id === page ? ' aria-current="page"' : ''}>${pick(sub.label, lang)}</a>`);
  return `<nav class="site-subpages" aria-label="${pick(module.label, lang)}">${links.join('')}</nav>`;
}

/**
 * Fill a page header: brand, badge, sub-pages and the module menu before the
 * page's own controls (.site-header-actions).
 * @param {HTMLElement|null} header <header class="site-header" data-site-page="...">
 * @param {'tr'|'en'} lang
 */
export function mountSiteHeader(header, lang) {
  if (!header) return;
  const page = header.dataset.sitePage || 'anatomy';
  const module = moduleOfPage(page);
  header.querySelectorAll(':scope > [data-site-part]').forEach(node => node.remove());
  const markup = `
    <div class="site-brand-block" data-site-part>
      <a class="site-brand" href="${fromRoot('./')}">✳ <strong>CARDIA</strong></a>
      <span class="site-badge" data-site-badge>${pick(SITE_BADGES[page] || SITE_BADGES.anatomy, lang)}</span>
      ${subPageLinks(module, page, lang)}
    </div>
    <nav class="site-modules" aria-label="${lang === 'en' ? 'Modules' : 'Modüller'}" data-site-part>${SITE_MODULES.map(m => moduleLink(m, module, lang)).join('')}</nav>`;
  header.insertAdjacentHTML('afterbegin', markup);
  // Narrow screens scroll the menu: keep this page's module in view.
  const nav = header.querySelector('.site-modules');
  const current = nav?.querySelector('[aria-current="page"]');
  if (nav && current && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, current.offsetLeft - nav.offsetLeft - 8);
}

/** Re-label the header after a language switch (same structure, new words). */
export function setSiteHeaderLanguage(header, lang) {
  mountSiteHeader(header, lang);
}

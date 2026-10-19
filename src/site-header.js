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
  const link = `<a ${attrs}>${pick(module.label, lang)}</a>`;
  if (!module.pages) return link;
  const more = lang === 'en' ? `${pick(module.label, lang)} pages` : `${pick(module.label, lang)} sayfaları`;
  return `<span class="site-module-group">${link}<button type="button" class="site-module-more" data-site-more="${module.id}" aria-haspopup="true" aria-expanded="false" aria-label="${escapeAttr(more)}" title="${escapeAttr(more)}">▾</button></span>`;
}

/** Drop-down of a module with several pages: each page, and the lessons of a 3D page. */
function moduleMenu(module, page, lang) {
  const items = module.pages.flatMap(sub => [
    `<a class="site-menu-page" href="${fromRoot(sub.path)}"${sub.id === page ? ' aria-current="page"' : ''}>${pick(sub.label, lang)}</a>`,
    ...(sub.lessons || []).map(lesson => `<a class="site-menu-lesson" href="${fromRoot(sub.path)}#/mode/${lesson.mode}">${pick(lesson.label, lang)}</a>`)
  ]);
  return `<div class="site-module-menu" data-site-menu="${module.id}" data-site-part hidden>${items.join('')}</div>`;
}

let menuEventsBound = false;
function closeMenus(except) {
  document.querySelectorAll('.site-module-menu').forEach(menu => {
    if (menu === except) return;
    menu.hidden = true;
    document.querySelector(`[data-site-more="${menu.dataset.siteMenu}"]`)?.setAttribute('aria-expanded', 'false');
  });
}
function bindMenus(header) {
  header.querySelectorAll('[data-site-more]').forEach(button => {
    button.addEventListener('click', () => {
      const menu = header.querySelector(`[data-site-menu="${button.dataset.siteMore}"]`);
      const open = menu.hidden;
      closeMenus(menu);
      menu.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      if (!open) return;
      // The menu row scrolls sideways (it would clip a child menu): place the menu under its button.
      const r = button.closest('.site-module-group').getBoundingClientRect();
      menu.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8))}px`;
      menu.style.top = `${r.bottom + 4}px`;
      menu.querySelector('a')?.focus();
    });
  });
  // The menu row is rebuilt on every mount; its scroll would leave a menu floating.
  header.querySelector('.site-modules')?.addEventListener('scroll', () => closeMenus(), { passive: true });
  if (menuEventsBound) return;
  menuEventsBound = true;
  document.addEventListener('click', e => { if (!e.target.closest('.site-module-menu, [data-site-more]')) closeMenus(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const open = document.querySelector('.site-module-menu:not([hidden])');
    if (!open) return;
    closeMenus();
    document.querySelector(`[data-site-more="${open.dataset.siteMenu}"]`)?.focus();
  });
  window.addEventListener('resize', () => closeMenus());
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
    <nav class="site-modules" aria-label="${lang === 'en' ? 'Modules' : 'Modüller'}" data-site-part>${SITE_MODULES.map(m => moduleLink(m, module, lang)).join('')}</nav>
    ${SITE_MODULES.filter(m => m.pages).map(m => moduleMenu(m, page, lang)).join('')}`;
  header.insertAdjacentHTML('afterbegin', markup);
  bindMenus(header);
  // Narrow screens scroll the menu: keep this page's module in view.
  const nav = header.querySelector('.site-modules');
  const current = nav?.querySelector('[aria-current="page"]');
  if (nav && current && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, current.offsetLeft - nav.offsetLeft - 8);
}

/** Re-label the header after a language switch (same structure, new words). */
export function setSiteHeaderLanguage(header, lang) {
  mountSiteHeader(header, lang);
}

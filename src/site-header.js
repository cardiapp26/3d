import { fromRoot } from './cardia-pages.js';
import { SITE_MODULES, SITE_BADGES } from './site-modules.js';
import { ensureSideRail, sideRailWide, SIDE_RAIL_QUERY } from './side-rail.js';
import './site-header.css';

// The header every Cardia page shares: brand, the page badge and the module
// menu (one order everywhere). A module with several pages lists them in the
// left rail on wide screens (side-rail.js) and in a drawer opened from the
// header button on narrow ones: the same list, moved between the two.
// A page writes <header class="site-header" data-site-page="..."> with its own
// controls in .site-header-actions; mountSiteHeader adds the rest.

const pick = (text, lang) => text[lang === 'en' ? 'en' : 'tr'];
const moduleOfPage = page => SITE_MODULES.find(m => m.id === page || m.aliases?.includes(page) || m.pages?.some(p => p.id === page)) || SITE_MODULES[0];
const escapeAttr = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const NAV_TEXT = {
  tr: { button: 'Sayfalar', pages: label => `${label} sayfaları`, open: label => `${label} sayfaları`, close: 'Menüyü kapat' },
  en: { button: 'Pages', pages: label => `${label} pages`, open: label => `${label} pages`, close: 'Close the menu' }
};

function moduleLink(module, current, lang) {
  const attrs = [
    `id="${module.id}-link"`,
    'class="site-module"',
    `data-site-link="${module.id}"`,
    `href="${fromRoot(module.path)}"`,
    module.id === 'anatomy' ? 'data-simulator-link' : '',
    module.id === current.id ? 'aria-current="page"' : '',
    module.title ? `title="${escapeAttr(pick(module.title, lang))}"` : ''
  ].filter(Boolean).join(' ');
  return `<a ${attrs}>${pick(module.label, lang)}</a>`;
}

/** 3D lesson in the address (#/mode/<id>), or null. */
const currentMode = () => (typeof location === 'undefined' ? null : (location.hash.match(/^#\/mode\/([\w-]+)/) || [])[1] || null);

/** The drawer entry that matches this page (and, on a 3D page, its open lesson). */
function activeEntry(module, page) {
  const here = module.pages.filter(sub => (sub.page || sub.id) === page);
  const mode = currentMode();
  return here.find(sub => sub.mode && sub.mode === mode) || here.find(sub => !sub.mode) || null;
}

/** Header button that opens the drawer (left of the brand). */
function drawerToggleMarkup(module, lang) {
  const t = NAV_TEXT[lang === 'en' ? 'en' : 'tr'];
  const label = pick(module.label, lang);
  return `<button type="button" class="module-nav-toggle" data-module-nav-toggle aria-expanded="false" aria-controls="module-nav-panel" title="${escapeAttr(t.open(label))}"><span class="module-nav-icon" aria-hidden="true">☰</span><span>${t.button}</span></button>`;
}

const entryHref = sub => `${fromRoot(sub.path)}${sub.mode ? `#/mode/${sub.mode}` : ''}`;

function drawerMarkup(module, page, lang) {
  const t = NAV_TEXT[lang === 'en' ? 'en' : 'tr'];
  const label = pick(module.label, lang);
  const active = activeEntry(module, page);
  const links = module.pages.map(sub => `<a class="site-subpage module-nav-link" data-site-subpage="${sub.id}" href="${entryHref(sub)}"${sub === active ? ' aria-current="page"' : ''}>${pick(sub.label, lang)}</a>`);
  return `<div class="module-nav" data-module-nav="${module.id}" data-open="false">
    <nav id="module-nav-panel" class="module-nav-panel" aria-label="${escapeAttr(t.pages(label))}" hidden>
      <div class="module-nav-head"><strong>${label}</strong><button type="button" class="module-nav-close" data-module-nav-close aria-label="${escapeAttr(t.close)}" title="${escapeAttr(t.close)}">×</button></div>
      ${links.join('')}
    </nav>
  </div>`;
}

let drawerEventsBound = false;
const panelEl = () => document.querySelector('#module-nav-panel');
const inRail = panel => panel?.dataset.inRail === 'true';

function setDrawerOpen(open, focus = false) {
  const drawer = document.querySelector('[data-module-nav]');
  const panel = panelEl();
  if (!drawer || !panel || inRail(panel)) return;
  const handle = document.querySelector('[data-module-nav-toggle]');
  drawer.dataset.open = String(open);
  panel.hidden = !open;
  handle.setAttribute('aria-expanded', String(open));
  if (open && focus) (panel.querySelector('[aria-current="page"]') || panel.querySelector('a'))?.focus();
  if (!open && focus) handle.focus();
}

/** Keep the drawer just under the sticky header. */
function placeDrawer(header) {
  const drawer = document.querySelector('[data-module-nav]');
  if (drawer) drawer.style.setProperty('--module-nav-top', `${Math.max(0, Math.round(header.getBoundingClientRect().bottom))}px`);
}

/** Wide screens: the page list sits in the left rail, always open. Narrow screens: in the drawer, closed. */
function placePanel() {
  const drawer = document.querySelector('[data-module-nav]');
  const panel = panelEl();
  if (!drawer || !panel) return;
  const wide = sideRailWide();
  const rail = document.querySelector('.side-rail .side-rail-body');
  if (wide && rail) {
    drawer.dataset.open = 'false';
    rail.append(panel);
    panel.dataset.inRail = 'true';
    panel.hidden = false;
  } else {
    drawer.append(panel);
    panel.dataset.inRail = 'false';
    panel.hidden = drawer.dataset.open !== 'true';
  }
}

function bindDrawer(header, module, page) {
  const drawer = document.querySelector('[data-module-nav]');
  header.querySelector('[data-module-nav-toggle]').addEventListener('click', () => setDrawerOpen(drawer.dataset.open !== 'true', true));
  drawer.querySelector('[data-module-nav-close]').addEventListener('click', () => setDrawerOpen(false, true));
  placeDrawer(header);
  placePanel();
  if (drawerEventsBound) return;
  drawerEventsBound = true;
  if (typeof matchMedia === 'function') matchMedia(SIDE_RAIL_QUERY).addEventListener('change', placePanel);
  document.addEventListener('click', e => { if (!e.target.closest('[data-module-nav], [data-module-nav-toggle]')) setDrawerOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.querySelector('[data-module-nav][data-open="true"]')) setDrawerOpen(false, true); });
  window.addEventListener('resize', () => placeDrawer(header), { passive: true });
  window.addEventListener('scroll', () => placeDrawer(header), { passive: true });
  // A 3D page switches lessons in place: follow the lesson in the drawer.
  window.addEventListener('hashchange', () => {
    const active = activeEntry(module, page);
    document.querySelectorAll('.module-nav-link').forEach(a => {
      if (active && a.dataset.siteSubpage === active.id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  });
}

/**
 * Fill a page header: brand, badge and the module menu before the page's own
 * controls (.site-header-actions); a module with pages gets its left drawer.
 * @param {HTMLElement|null} header <header class="site-header" data-site-page="...">
 * @param {'tr'|'en'} lang
 */
export function mountSiteHeader(header, lang) {
  if (!header) return;
  const page = header.dataset.sitePage || 'anatomy';
  const module = moduleOfPage(page);
  header.querySelectorAll(':scope > [data-site-part]').forEach(node => node.remove());
  document.querySelectorAll('[data-module-nav], #module-nav-panel').forEach(node => node.remove());
  const markup = `
    <div class="site-brand-block" data-site-part>
      ${module.pages ? drawerToggleMarkup(module, lang) : ''}
      <a class="site-brand" href="${fromRoot('./')}">✳ <strong>CARDIA</strong></a>
      <span class="site-badge" data-site-badge>${pick(SITE_BADGES[page] || SITE_BADGES.anatomy, lang)}</span>
    </div>
    <nav class="site-modules" aria-label="${lang === 'en' ? 'Modules' : 'Modüller'}" data-site-part>${SITE_MODULES.map(m => moduleLink(m, module, lang)).join('')}</nav>`;
  header.insertAdjacentHTML('afterbegin', markup);
  if (module.pages) {
    // 3D pages read this to leave their own lesson list out of the rail (the pages cover it).
    document.body.dataset.modulePages = 'true';
    ensureSideRail({ label: { tr: NAV_TEXT.tr.button, en: NAV_TEXT.en.button }, getLang: () => lang });
    document.body.insertAdjacentHTML('beforeend', drawerMarkup(module, page, lang));
    bindDrawer(header, module, page);
  }
  // Narrow screens scroll the menu: keep this page's module in view.
  const nav = header.querySelector('.site-modules');
  const current = nav?.querySelector('[aria-current="page"]');
  if (nav && current && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, current.offsetLeft - nav.offsetLeft - 8);
}

/** Re-label the header after a language switch (same structure, new words). */
export function setSiteHeaderLanguage(header, lang) {
  mountSiteHeader(header, lang);
}

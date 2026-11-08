// Left rail under the site header on wide screens: a module's pages (site-header.js)
// or a 3D lesson page's modes (header-tabs.js), open by default and collapsible to a
// slim strip; the choice is remembered. Narrow screens hide the rail and keep their
// drawer or drop-down menus, so every link exists once per layout.
import './side-rail.css';

export const SIDE_RAIL_QUERY = '(min-width: 1100px)';
const STORE_KEY = 'cardia.side-rail';
const TEXT = {
  tr: { collapse: 'Menüyü daralt', expand: 'Menüyü aç' },
  en: { collapse: 'Collapse the menu', expand: 'Open the menu' }
};

let rail = null;

function readCollapsed() {
  try { return localStorage.getItem(STORE_KEY) === 'collapsed'; } catch { return false; }
}
function writeCollapsed(value) {
  try { localStorage.setItem(STORE_KEY, value ? 'collapsed' : 'open'); } catch { /* storage off: keep it for this visit */ }
}

/** Wide screen: the rail is shown. */
export const sideRailWide = () => typeof matchMedia === 'function' && matchMedia(SIDE_RAIL_QUERY).matches;

/** Keep the rail just under the sticky header. */
function placeRail() {
  const header = document.querySelector('.site-header');
  const bottom = header ? Math.max(0, Math.round(header.getBoundingClientRect().bottom)) : 0;
  document.documentElement.style.setProperty('--side-rail-top', `${bottom}px`);
}

/**
 * The page's left rail (one per page; a second call relabels it).
 * @param {{ label: { tr: string, en: string }, getLang: () => 'tr'|'en' }} options
 * @returns {{ element: HTMLElement, body: HTMLElement, render: () => void }}
 */
export function ensureSideRail({ label, getLang }) {
  if (rail?.element.isConnected) {
    rail.setLabel(label, getLang);
    return rail;
  }
  const element = document.createElement('aside');
  element.className = 'side-rail';
  element.setAttribute('data-side-rail', '');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'side-rail-toggle';
  toggle.setAttribute('data-side-rail-toggle', '');
  const icon = document.createElement('span');
  icon.className = 'side-rail-icon';
  icon.setAttribute('aria-hidden', 'true');
  const text = document.createElement('span');
  text.className = 'side-rail-label';
  toggle.append(icon, text);
  const body = document.createElement('div');
  body.className = 'side-rail-body';
  element.append(toggle, body);
  document.body.append(element);
  document.body.classList.add('has-side-rail');

  let collapsed = readCollapsed();
  let currentLabel = label;
  let langOf = getLang;
  function render() {
    const lang = langOf() === 'en' ? 'en' : 'tr';
    const t = TEXT[lang];
    element.dataset.collapsed = String(collapsed);
    document.body.dataset.sideRailState = collapsed ? 'collapsed' : 'open';
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.title = collapsed ? t.expand : t.collapse;
    text.textContent = currentLabel[lang];
    body.hidden = collapsed;
  }
  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    writeCollapsed(collapsed);
    render();
    // Canvases and charts that size from their box re-measure after the content moved.
    window.dispatchEvent(new Event('resize'));
  });
  placeRail();
  window.addEventListener('resize', placeRail, { passive: true });
  window.addEventListener('scroll', placeRail, { passive: true });
  render();
  rail = {
    element,
    body,
    render,
    setLabel(next, nextLang) {
      currentLabel = next;
      if (nextLang) langOf = nextLang;
      render();
    }
  };
  return rail;
}

/**
 * Header tabs (tablet and desktop): the mode groups open as drop-down menus
 * and the Layers / Tools tabs open the former left panel as a floating
 * drawer over the scene. Phones keep the bottom sheets from panel-shell; the
 * mode list moves back into the aside there, so every control exists once.
 */
const WORDS = {
  tr: { layers: 'Katmanlar', tools: 'Araçlar', close: 'Kapat', label: 'Modlar ve katmanlar' },
  en: { layers: 'Layers', tools: 'Tools', close: 'Close', label: 'Modes and layers' },
};
const MOBILE_QUERY = '(max-width: 640px)';
const TOOL_SECTIONS = ['.chamber-tools', '#defect-tools', '#ep-tools'];

function visible(selector) {
  return [...document.querySelectorAll(selector)].some(node => !node.hidden);
}

export function createHeaderTabs({ getLang = () => 'tr' } = {}) {
  const bar = document.querySelector('#header-tabs');
  const nav = document.querySelector('#mode-nav');
  const aside = document.querySelector('.workspace > aside');
  if (!bar || !nav || !aside) return { refresh() {}, closeAll() {} };
  const words = () => WORDS[getLang() === 'en' ? 'en' : 'tr'];
  const mobile = window.matchMedia(MOBILE_QUERY);
  const groups = [...nav.querySelectorAll('.mode-group')];
  const drawerTabs = {
    layers: bar.querySelector('[data-drawer=layers]'),
    tools: bar.querySelector('[data-drawer=tools]'),
  };
  const drawerClose = document.createElement('button');
  drawerClose.type = 'button';
  drawerClose.className = 'drawer-close';
  aside.prepend(drawerClose);
  let openGroup = null;
  let drawer = null;
  let wasToolsOnly = false;

  // ---- Placement --------------------------------------------------------
  // Phones: the list lives in the Modes sheet, after its search field.
  function place() {
    if (mobile.matches) {
      closeAll();
      const search = aside.querySelector('#aside-search');
      if (nav.parentElement !== aside) aside.insertBefore(nav, search ? search.nextSibling : aside.firstChild);
    } else if (nav.parentElement !== bar) {
      bar.prepend(nav);
    }
  }

  // ---- Mode group menus -------------------------------------------------
  const tabOf = group => group.querySelector('.mode-group-tab');
  const itemsOf = group => [...group.querySelectorAll('[data-mode]')];
  function setGroup(group, focusItem = false) {
    openGroup = group;
    for (const other of groups) {
      const on = other === group;
      tabOf(other).setAttribute('aria-expanded', String(on));
      other.classList.toggle('open', on);
    }
    if (group && focusItem) {
      const items = itemsOf(group);
      (items.find(item => item.classList.contains('active')) || items[0])?.focus();
    }
  }
  for (const group of groups) {
    tabOf(group).addEventListener('click', () => setGroup(openGroup === group ? null : group));
  }
  nav.addEventListener('keydown', event => {
    if (mobile.matches) return;
    const group = event.target.closest('.mode-group');
    if (!group) return;
    const onTab = event.target === tabOf(group);
    if (event.key === 'Escape' && openGroup) {
      event.stopPropagation();
      setGroup(null);
      tabOf(group).focus();
    } else if (onTab && event.key === 'ArrowDown') {
      event.preventDefault();
      setGroup(group, true);
    } else if (onTab && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      const next = groups[(groups.indexOf(group) + (event.key === 'ArrowRight' ? 1 : groups.length - 1)) % groups.length];
      if (openGroup) setGroup(next);
      tabOf(next).focus();
    } else if (!onTab && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      const items = itemsOf(group);
      const index = items.indexOf(event.target);
      items[(index + (event.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
    }
  });
  // Choosing a mode closes its menu; the scene is where the change shows.
  nav.addEventListener('click', event => {
    if (!mobile.matches && event.target.closest('[data-mode]')) setGroup(null);
  });

  // ---- Layers / Tools drawer --------------------------------------------
  // The drawer stays open while the scene is used (wall cuts, layer checks);
  // only its tab, the close button or Escape closes it.
  function setDrawer(which) {
    drawer = which;
    if (which) document.body.dataset.openDrawer = which;
    else delete document.body.dataset.openDrawer;
    for (const [id, tab] of Object.entries(drawerTabs)) tab?.setAttribute('aria-expanded', String(id === which));
  }
  for (const [id, tab] of Object.entries(drawerTabs)) {
    tab?.addEventListener('click', () => {
      setGroup(null);
      setDrawer(drawer === id ? null : id);
    });
  }
  drawerClose.addEventListener('click', () => {
    const back = drawerTabs[drawer];
    setDrawer(null);
    back?.focus();
  });

  function closeAll() {
    setGroup(null);
    setDrawer(null);
  }
  document.addEventListener('pointerdown', event => {
    if (openGroup && !openGroup.contains(event.target)) setGroup(null);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || mobile.matches || !drawer || openGroup) return;
    if (!aside.contains(document.activeElement) && !bar.contains(document.activeElement)) return;
    const back = drawerTabs[drawer];
    setDrawer(null);
    back?.focus();
  });
  mobile.addEventListener('change', place);

  // ---- State ------------------------------------------------------------
  function refresh() {
    const w = words();
    bar.setAttribute('aria-label', w.label);
    for (const group of groups) {
      const active = group.querySelector('[data-mode].active');
      group.classList.toggle('current', !!active);
      const current = group.querySelector('.mode-group-current');
      if (current) current.textContent = active?.querySelector('.mode-label')?.textContent || '';
    }
    const available = { layers: visible('#layers'), tools: TOOL_SECTIONS.some(visible) };
    for (const [id, tab] of Object.entries(drawerTabs)) {
      if (!tab) continue;
      tab.hidden = !available[id];
      tab.querySelector('.drawer-tab-label').textContent = w[id];
      tab.title = w[id];
    }
    if (drawer && !available[drawer]) setDrawer(null);
    // Modes whose only controls are tools (LA, RA, septal defects) open them on entry.
    const toolsOnly = available.tools && !available.layers;
    if (toolsOnly && !wasToolsOnly && !mobile.matches) setDrawer('tools');
    wasToolsOnly = toolsOnly;
    drawerClose.textContent = `${w.close} ×`;
    drawerClose.setAttribute('aria-label', drawer ? `${w[drawer]}: ${w.close}` : w.close);
  }

  place();
  refresh();
  return { refresh, closeAll, getState: () => ({ group: openGroup?.dataset.modeGroup || null, drawer }) };
}

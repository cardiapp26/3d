/**
 * Panel shell: right-panel tabs (Learn / Sources) on every screen size and,
 * on phones, a bottom tab bar that opens one sheet at a time (Modes, Layers,
 * Learn, Tools). The sheets reuse the existing left and right panels; no
 * control is duplicated, so selection, lesson step and camera are shared.
 */
const WORDS = {
  tr: {
    learn: 'Öğren', sources: 'Kaynaklar', modes: 'Modlar', layers: 'Katmanlar', tools: 'Araçlar',
    tabsLabel: 'Açıklama paneli', mobileLabel: 'Çalışma alanı panelleri',
    expand: 'Büyüt', shrink: 'Küçült', close: 'Kapat',
    selected: 'Seçili yapı', source: 'Kaynak', noSource: 'Bu yapı için ayrı kaynak kaydı yok.',
    empty: 'Açıklamasını görmek için bir yapı seçin.',
    provenance: { atlas: 'Anatomik atlas yapısı', schematic: 'Şematik eğitim modeli', reference: 'Bilgi notu; anatomik modele hizalanmış 3D yapı yok' },
    modelType: 'Model niteliği', limits: 'Model sınırları', allSources: 'Tüm kaynaklar ve sınırlar',
  },
  en: {
    learn: 'Learn', sources: 'Sources', modes: 'Modes', layers: 'Layers', tools: 'Tools',
    tabsLabel: 'Explanation panel', mobileLabel: 'Workspace panels',
    expand: 'Expand', shrink: 'Shrink', close: 'Close',
    selected: 'Selected structure', source: 'Source', noSource: 'No separate source record for this structure.',
    empty: 'Select a structure to view its description.',
    provenance: { atlas: 'Anatomical atlas structure', schematic: 'Schematic teaching model', reference: 'Reference note; no 3D structure registered to the model' },
    modelType: 'Model type', limits: 'Model limits', allSources: 'All sources and limits',
  },
};
const SIZES = ['peek', 'half', 'full'];
const MOBILE_QUERY = '(max-width: 640px)';

function el(tag, attrs = {}, text) {
  const out = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') out.className = value;
    else out.setAttribute(key, value);
  }
  if (text != null) out.textContent = text;
  return out;
}

export function createPanelShell({ getLang = () => 'tr', getLimits = () => '', openReferences = () => {} } = {}) {
  const aside = document.querySelector('.workspace > aside');
  const article = document.querySelector('.workspace > article');
  if (!aside || !article) return { refresh() {}, setStructure() {}, closeSheet() {}, isMobile: () => false };
  const words = () => WORDS[getLang() === 'en' ? 'en' : 'tr'];
  const mobile = window.matchMedia(MOBILE_QUERY);
  let structure = { title: '', source: '', provenance: '' };
  let openSheet = null;
  let learnSize = 'peek';
  let returnFocus = null;

  // ---- Right panel tabs -------------------------------------------------
  const carm = article.querySelector('#carm-panel');
  const tabs = el('div', { class: 'panel-tabs', role: 'tablist' });
  const learnTab = el('button', { type: 'button', role: 'tab', id: 'panel-tab-learn', 'aria-controls': 'panel-learn', 'aria-selected': 'true' });
  const sourcesTab = el('button', { type: 'button', role: 'tab', id: 'panel-tab-sources', 'aria-controls': 'panel-sources', 'aria-selected': 'false', tabindex: '-1' });
  tabs.append(learnTab, sourcesTab);
  const learnPanel = el('div', { role: 'tabpanel', id: 'panel-learn', 'aria-labelledby': 'panel-tab-learn', class: 'panel-body' });
  const sourcesPanel = el('div', { role: 'tabpanel', id: 'panel-sources', 'aria-labelledby': 'panel-tab-sources', class: 'panel-body', hidden: '' });
  // Everything after the C-Arm tool becomes the Learn panel content.
  const learnNodes = [...article.children].filter(node => node !== carm);
  learnPanel.append(...learnNodes);
  const learnHead = el('div', { class: 'sheet-head' });
  const learnTitle = el('strong', { class: 'sheet-title' });
  const sizeButton = el('button', { type: 'button', class: 'sheet-btn', 'data-sheet-size': '' });
  const learnClose = el('button', { type: 'button', class: 'sheet-btn sheet-close' });
  learnHead.append(learnTitle, sizeButton, learnClose);
  article.append(learnHead, tabs, learnPanel, sourcesPanel);
  article.id = article.id || 'learn-sheet';

  // Tabs in display order; extra tabs (e.g. Findings) slot in before Sources.
  const tabDefs = [
    { id: 'learn', tab: learnTab, panel: learnPanel },
    { id: 'sources', tab: sourcesTab, panel: sourcesPanel, onShow: () => renderSources() },
  ];
  let currentTab = 'learn';
  function selectTab(which) {
    const target = tabDefs.find(def => def.id === which && !def.tab.hidden) || tabDefs[0];
    currentTab = target.id;
    for (const def of tabDefs) {
      const on = def === target;
      def.tab.setAttribute('aria-selected', String(on));
      def.tab.tabIndex = on ? 0 : -1;
      def.panel.hidden = !on;
    }
    target.onShow?.();
  }
  learnTab.addEventListener('click', () => selectTab('learn'));
  sourcesTab.addEventListener('click', () => selectTab('sources'));
  tabs.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const visible = tabDefs.filter(def => !def.tab.hidden);
    const index = visible.findIndex(def => def.tab === event.target);
    const next = visible[(index + (event.key === 'ArrowRight' ? 1 : visible.length - 1)) % visible.length];
    selectTab(next.id);
    next.tab.focus();
  });
  /** Add a tab before Sources; `label` is { tr, en }. Returns its panel. */
  function addTab({ id, label, onShow }) {
    const tab = el('button', { type: 'button', role: 'tab', id: `panel-tab-${id}`, 'aria-controls': `panel-${id}`, 'aria-selected': 'false', tabindex: '-1' });
    const panel = el('div', { role: 'tabpanel', id: `panel-${id}`, 'aria-labelledby': `panel-tab-${id}`, class: 'panel-body', hidden: '' });
    tabs.insertBefore(tab, sourcesTab);
    article.insertBefore(panel, sourcesPanel);
    const def = { id, tab, panel, label, onShow };
    tabDefs.splice(tabDefs.length - 1, 0, def);
    tab.addEventListener('click', () => selectTab(id));
    relabel();
    return panel;
  }

  function renderSources() {
    const w = words();
    sourcesPanel.replaceChildren();
    const card = el('section', { class: 'source-card' });
    card.append(el('div', { class: 'eyebrow' }, w.selected), el('h3', {}, structure.title || w.empty));
    if (structure.provenance) {
      card.append(el('div', { class: 'eyebrow' }, w.modelType), el('p', {}, w.provenance[structure.provenance] || structure.provenance));
    }
    if (structure.title) {
      card.append(el('div', { class: 'eyebrow' }, w.source), el('p', { class: 'source-text' }, structure.source || w.noSource));
    }
    const limits = getLimits();
    if (limits) card.append(el('div', { class: 'eyebrow' }, w.limits), el('p', {}, limits));
    const all = el('button', { type: 'button', class: 'source-all' }, w.allSources);
    all.addEventListener('click', openReferences);
    card.append(all);
    sourcesPanel.append(card);
  }

  // ---- Mobile sheets ----------------------------------------------------
  const bar = el('nav', { class: 'mobile-tabs' });
  const sheetButtons = {};
  for (const id of ['modes', 'layers', 'learn', 'tools']) {
    const button = el('button', { type: 'button', class: 'mobile-tab', 'data-sheet': id, 'aria-expanded': 'false', 'aria-controls': id === 'learn' ? article.id : 'mobile-aside-sheet' });
    button.append(el('span', { class: 'mobile-tab-label' }));
    button.addEventListener('click', () => (openSheet === id ? closeSheet() : open(id, button)));
    sheetButtons[id] = button;
    bar.append(button);
  }
  document.body.append(bar);
  aside.id = aside.id || 'mobile-aside-sheet';
  const asideHead = el('div', { class: 'sheet-head' });
  const asideTitle = el('strong', { class: 'sheet-title' });
  const asideClose = el('button', { type: 'button', class: 'sheet-btn sheet-close' });
  asideHead.append(asideTitle, asideClose);
  aside.prepend(asideHead);

  function setSize(size) {
    learnSize = SIZES.includes(size) ? size : 'peek';
    document.body.dataset.sheetSize = learnSize;
    relabel();
  }
  sizeButton.addEventListener('click', () => setSize(learnSize === 'full' ? 'peek' : SIZES[SIZES.indexOf(learnSize) + 1]));

  function open(id, opener) {
    if (!mobile.matches) return;
    openSheet = id;
    returnFocus = opener || sheetButtons[id];
    document.body.dataset.sheet = id;
    if (id === 'learn') { setSize(learnSize); sheetButtons.learn.removeAttribute('data-badge'); }
    for (const [key, button] of Object.entries(sheetButtons)) button.setAttribute('aria-expanded', String(key === id));
    relabel();
    const target = id === 'learn' ? learnClose : asideClose;
    target.focus({ preventScroll: true });
  }
  function closeSheet() {
    if (!openSheet) return;
    openSheet = null;
    delete document.body.dataset.sheet;
    for (const button of Object.values(sheetButtons)) button.setAttribute('aria-expanded', 'false');
    const back = returnFocus;
    returnFocus = null;
    if (back && mobile.matches) back.focus({ preventScroll: true });
  }
  learnClose.addEventListener('click', closeSheet);
  asideClose.addEventListener('click', closeSheet);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && openSheet && mobile.matches) { event.stopPropagation(); closeSheet(); }
  });
  // Choosing a mode is a navigation step: return to the scene.
  aside.addEventListener('click', event => {
    if (openSheet === 'modes' && event.target.closest('[data-mode]')) closeSheet();
  });
  mobile.addEventListener('change', () => { closeSheet(); refresh(); });

  function toolsAvailable() {
    return ['#atria-tools', '#ra-tools', '#defect-tools'].some(sel => {
      const node = document.querySelector(sel);
      return node && !node.hidden;
    });
  }
  function layersAvailable() {
    const node = document.querySelector('#layers');
    return !!node && !node.hidden;
  }

  function relabel() {
    const w = words();
    learnTab.textContent = w.learn;
    sourcesTab.textContent = w.sources;
    for (const def of tabDefs) if (def.label) def.tab.textContent = def.label[getLang() === 'en' ? 'en' : 'tr'];
    tabs.setAttribute('aria-label', w.tabsLabel);
    bar.setAttribute('aria-label', w.mobileLabel);
    for (const [id, button] of Object.entries(sheetButtons)) button.querySelector('.mobile-tab-label').textContent = w[id];
    learnTitle.textContent = w.learn;
    asideTitle.textContent = openSheet && openSheet !== 'learn' ? w[openSheet] : w.modes;
    sizeButton.textContent = learnSize === 'full' ? w.shrink : w.expand;
    learnClose.textContent = w.close;
    learnClose.setAttribute('aria-label', `${w.learn}: ${w.close}`);
    asideClose.textContent = w.close;
  }

  function refresh() {
    const tools = toolsAvailable();
    const layers = layersAvailable();
    sheetButtons.tools.hidden = !tools;
    sheetButtons.layers.hidden = !layers;
    if ((openSheet === 'tools' && !tools) || (openSheet === 'layers' && !layers)) closeSheet();
    relabel();
    if (currentTab === 'sources') renderSources();
  }

  function setStructure(next) {
    const changed = next.title !== structure.title;
    structure = { ...structure, ...next };
    if (currentTab === 'sources') renderSources();
    if (changed && mobile.matches && openSheet !== 'learn' && structure.title) sheetButtons.learn.setAttribute('data-badge', '');
  }

  relabel();
  refresh();
  return { refresh, setStructure, closeSheet, open, selectTab, addTab, isMobile: () => mobile.matches, getState: () => ({ sheet: openSheet, size: learnSize, tab: currentTab }) };
}

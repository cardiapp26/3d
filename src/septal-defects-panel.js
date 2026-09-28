import './septal-defects.css';
import { DEFECT_TYPES, DEFECT_COPY } from './septal-defects-data.js';
import { defectMap, MAP_WORDS } from './septal-defects-map.js';

const WORDS = {
  tr: { focus: '3B modelde odakla', types: 'Defekt tipleri', source: 'Kaynak', more: 'Ek kaynaklar', asd: 'ASD · Atriyal', vsd: 'VSD · Ventriküler', prevalence: 'Sıklık', associations: 'Eşlik eden', conduction: 'İleti sistemi', closure: 'Kapatma', legend: 'Kodlar 3B işaretlerle aynıdır.' },
  en: { focus: 'Focus in 3D', types: 'Defect types', source: 'Source', more: 'Further reading', asd: 'ASD · Atrial', vsd: 'VSD · Ventricular', prevalence: 'Frequency', associations: 'Associated', conduction: 'Conduction', closure: 'Closure', legend: 'Codes match the 3D markers.' },
};
const FACT_KEYS = ['prevalence', 'associations', 'conduction', 'closure'];

function node(tag, cls, text) {
  const out = document.createElement(tag);
  if (cls) out.className = cls;
  if (text != null) out.textContent = text;
  return out;
}
function link(cls, text, url) {
  const out = node('a', cls, text);
  out.href = url;
  out.target = '_blank';
  out.rel = 'noopener noreferrer';
  return out;
}
function factList(item, lang, words) {
  const list = node('dl', 'defect-facts');
  for (const key of FACT_KEYS) {
    if (!item[key]) continue;
    list.append(node('dt', '', words[key]), node('dd', '', item[key][lang]));
  }
  return list;
}
function legend(item, lang, words) {
  const out = node('p', 'defect-legend');
  for (const sibling of DEFECT_TYPES.filter(other => other.family === item.family)) {
    const chip = node('span', 'defect-legend-chip' + (sibling.id === item.id ? ' selected' : ''), sibling.mark);
    chip.title = sibling.title[lang];
    out.append(chip, ' ');
  }
  out.append(node('span', 'defect-legend-note', words.legend));
  return out;
}

export function createSeptalDefectsPanel({ mount, mountDetails, getLang = () => 'tr', onSelect = () => {}, onFocus = () => {} }) {
  let selected = 'asd-secundum';
  let disposed = false;
  const root = node('section', 'defect-panel defect-controls');
  mount.append(root);
  const detailsRoot = mountDetails ? node('section', 'defect-panel defect-details') : null;
  if (detailsRoot) mountDetails.append(detailsRoot);

  function render() {
    if (disposed) return;
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const words = WORDS[lang];
    const copy = DEFECT_COPY[lang];
    const current = DEFECT_TYPES.find(item => item.id === selected);

    root.replaceChildren();
    root.setAttribute('aria-label', copy.title);
    root.append(node('h3', 'defect-heading', copy.title), node('p', 'defect-intro', copy.intro));

    const families = node('div', 'defect-families');
    families.setAttribute('role', 'group');
    families.setAttribute('aria-label', words.types);
    for (const family of ['asd', 'vsd']) {
      const button = node('button', '', words[family]);
      button.type = 'button';
      button.dataset.defectFamily = family;
      button.setAttribute('aria-pressed', String(current.family === family));
      button.addEventListener('click', () => choose(DEFECT_TYPES.find(item => item.family === family).id));
      families.append(button);
    }
    root.append(families);

    const types = node('div', 'defect-types');
    types.setAttribute('role', 'group');
    types.setAttribute('aria-label', words.types);
    for (const item of DEFECT_TYPES.filter(item => item.family === current.family)) {
      const button = node('button', '', '');
      button.append(node('span', 'defect-type-mark', item.mark), node('span', 'defect-type-name', item.title[lang]));
      button.type = 'button';
      button.dataset.defectId = item.id;
      button.setAttribute('aria-pressed', String(item.id === selected));
      button.addEventListener('click', () => choose(item.id));
      types.append(button);
    }
    root.append(types);

    const card = node('div', 'defect-card');
    card.append(node('h4', 'defect-title', current.title[lang]), node('p', 'defect-location', current.location[lang]));
    const figure = node('figure', 'defect-map');
    const mapWords = MAP_WORDS[lang];
    figure.append(defectMap(current, lang), node('figcaption', '', `${current.family === 'asd' ? mapWords.ra : mapWords.rv}. ${mapWords.scale}`));
    card.append(figure, legend(current, lang, words), node('p', 'defect-detail', current.detail[lang]), factList(current, lang, words));
    const focus = node('button', 'defect-focus', words.focus);
    focus.type = 'button';
    focus.addEventListener('click', () => onFocus(selected));
    card.append(focus);
    card.append(link('defect-source', `${words.source}: ${current.source.title}`, current.source.url));
    for (const ref of current.references || []) card.append(link('defect-source defect-source-extra', `${words.more}: ${ref.title}`, ref.url));

    const explanationTarget = detailsRoot || root;
    if (detailsRoot) detailsRoot.replaceChildren();
    explanationTarget.append(card, node('p', 'defect-note', copy.schematic), node('p', 'defect-note', copy.flowNote));
    if (current.family === 'asd') explanationTarget.append(node('p', 'defect-note', copy.pfoNote));
    if (current.id === 'asd-primum' || current.id === 'vsd-inlet') explanationTarget.append(node('p', 'defect-note', copy.avsdNote));
  }
  function choose(id) {
    if (id === selected || !DEFECT_TYPES.some(item => item.id === id)) return;
    const previousFamily = DEFECT_TYPES.find(item => item.id === selected).family;
    selected = id;
    render();
    const family = DEFECT_TYPES.find(item => item.id === id).family;
    const target = family === previousFamily ? `[data-defect-id="${id}"]` : `[data-defect-family="${family}"]`;
    root.querySelector(target)?.focus();
    onSelect(id);
  }
  render();
  mount.hidden = true;
  if (mountDetails) mountDetails.hidden = true;
  return {
    show() {
      if (!disposed) {
        mount.hidden = false;
        if (mountDetails) mountDetails.hidden = false;
        render();
      }
    },
    hide() {
      mount.hidden = true;
      if (mountDetails) mountDetails.hidden = true;
    },
    select(id) {
      if (!disposed && id !== selected && DEFECT_TYPES.some(item => item.id === id)) {
        selected = id;
        render();
      }
    },
    refresh: render,
    getSelected() { return selected; },
    dispose() {
      disposed = true;
      root.remove();
      if (detailsRoot) detailsRoot.remove();
      mount.hidden = true;
      if (mountDetails) mountDetails.hidden = true;
    },
  };
}

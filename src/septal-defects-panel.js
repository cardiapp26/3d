import './septal-defects.css';
import { DEFECT_TYPES, DEFECT_COPY } from './septal-defects-data.js';

const NS = 'http://www.w3.org/2000/svg';
const WORDS = {
  tr: { focus: '3B modelde odakla', types: 'Defekt tipleri', source: 'Kaynak', asd: 'ASD · Atriyal', vsd: 'VSD · Ventriküler', ra: 'Sağ atriyumdan şematik görünüm', rv: 'Sağ ventrikülden şematik görünüm', fossa: 'Fossa ovalis', inlet: 'AV giriş', outlet: 'Çıkış kapakları', muscle: 'Kas septumu', junction: 'AV bileşke', cs: 'Koroner sinüs', roof: 'KS tavanı', scale: 'Konum şeması; ölçekli değildir.' },
  en: { focus: 'Focus in 3D', types: 'Defect types', source: 'Source', asd: 'ASD · Atrial', vsd: 'VSD · Ventricular', ra: 'Schematic right atrial view', rv: 'Schematic right ventricular view', fossa: 'Fossa ovalis', inlet: 'AV inlet', outlet: 'Outflow valves', muscle: 'Muscular septum', junction: 'AV junction', cs: 'Coronary sinus', roof: 'CS roof', scale: 'Location diagram; not to scale.' },
};
const SITES = {
  'asd-secundum': [136, 119], 'asd-primum': [173, 190],
  'asd-sinus-superior': [111, 52], 'asd-sinus-inferior': [91, 191],
  'asd-coronary-sinus': [225, 180], 'vsd-perimembranous': [165, 101],
  'vsd-muscular': [137, 166], 'vsd-inlet': [93, 112], 'vsd-outlet': [186, 66],
};
function node(tag, cls, text) {
  const out = document.createElement(tag);
  if (cls) out.className = cls;
  if (text != null) out.textContent = text;
  return out;
}
function svg(tag, attrs, text) {
  const out = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) out.setAttribute(key, String(value));
  if (text != null) out.textContent = text;
  return out;
}
function mapOf(item, lang) {
  const w = WORDS[lang];
  const atrial = item.family === 'asd';
  const map = svg('svg', { viewBox: '0 0 290 248', role: 'img', 'aria-label': `${atrial ? w.ra : w.rv}: ${item.title[lang]}. ${w.scale}` });
  const label = (x, y, text, anchor = 'middle') => map.append(svg('text', { x, y, 'text-anchor': anchor }, text));
  map.append(svg('path', { d: atrial ? 'M107 38 C63 49 48 91 54 139 C56 186 90 218 139 220 C193 219 216 182 218 135 C220 89 194 49 158 41 Z' : 'M79 79 Q128 45 192 40 Q236 79 221 149 Q198 216 143 227 Q84 207 59 149 Q48 114 79 79 Z', class: 'defect-map-tissue' }));
  if (atrial) {
    map.append(svg('path', { d: 'M96 17 L96 52 M120 17 L120 48 M77 186 L77 228 M102 200 L102 228', class: 'defect-map-vessel' }));
    map.append(svg('ellipse', { cx: 136, cy: 119, rx: 33, ry: 44, class: 'defect-map-fossa' }));
    map.append(svg('path', { d: 'M159 211 Q178 195 196 192', class: 'defect-map-junction' }));
    map.append(svg('path', { d: 'M195 174 Q223 165 258 180 L258 193 Q225 179 198 188 Z', class: 'defect-map-sinus' }));
    label(108, 13, 'SVC'); label(87, 243, 'IVC'); label(137, 69, w.fossa);
    label(179, 235, w.junction); label(229, 151, w.cs);
    if (item.id === 'asd-coronary-sinus') label(241, 214, w.roof);
  } else {
    map.append(svg('path', { d: 'M63 91 Q79 73 105 74 M163 49 Q189 32 210 55', class: 'defect-map-junction' }));
    map.append(svg('path', { d: 'M114 118 Q147 137 180 125', class: 'defect-map-fossa' }));
    label(66, 61, w.inlet); label(191, 23, w.outlet); label(143, 203, w.muscle);
  }
  const [cx, cy] = SITES[item.id];
  map.append(svg('ellipse', { cx, cy, rx: item.id === 'asd-coronary-sinus' ? 19 : 13, ry: item.id === 'asd-coronary-sinus' ? 7 : 13, class: 'defect-map-hole' }));
  return map;
}

export function createSeptalDefectsPanel({ mount, getLang = () => 'tr', onSelect = () => {}, onFocus = () => {} }) {
  let selected = 'asd-secundum';
  let disposed = false;
  const root = node('section', 'defect-panel');
  mount.append(root);
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
      const button = node('button', '', item.title[lang]);
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
    figure.append(mapOf(current, lang), node('figcaption', '', `${current.family === 'asd' ? words.ra : words.rv}. ${words.scale}`));
    card.append(figure, node('p', 'defect-detail', current.detail[lang]));
    const focus = node('button', 'defect-focus', words.focus);
    focus.type = 'button';
    focus.addEventListener('click', () => onFocus(selected));
    card.append(focus);
    const source = node('a', 'defect-source', `${words.source}: ${current.source.title}`);
    source.href = current.source.url;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    card.append(source);
    root.append(card, node('p', 'defect-note', copy.schematic), node('p', 'defect-note', copy.flowNote));
    if (current.family === 'asd') root.append(node('p', 'defect-note', copy.pfoNote));
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
  return {
    show() { if (!disposed) { mount.hidden = false; render(); } },
    hide() { mount.hidden = true; },
    select(id) { if (!disposed && id !== selected && DEFECT_TYPES.some(item => item.id === id)) { selected = id; render(); } },
    refresh: render,
    getSelected() { return selected; },
    dispose() { disposed = true; root.remove(); mount.hidden = true; },
  };
}

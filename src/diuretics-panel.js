import { DIURETIC_CLASSES, DIURETIC_SOURCES } from './diuretics-data.js';
import './diuretics.css';
import { createLoopDetail } from './loop-diuretics.js';

const WORDS = {
  tr: { eyebrow: 'NEFRON LABORATUVARI', title: 'Diüretikler: etki yeri ve yan etkiler', intro: 'Bir ilaç sınıfı veya nefron segmenti seçin. Mekanizma, kullanım bağlamı ve elektrolit eğilimlerini karşılaştırın.', proximal: 'Proksimal tübül', descending: 'İnen ince kol', ascending: 'Kalın çıkan kol', distal: 'Distal tübül', collecting: 'Toplayıcı kanal', glomerulus: 'Glomerül', urine: 'İdrar', cortex: 'KORTEKS', medulla: 'MEDULLA', macula: 'Makula densa', flow: 'Tübül sıvısı akışı', mechanism: 'Mekanizma', uses: 'Kullanım bağlamları', risks: 'Önemli yan etkiler', monitor: 'İzlem', comparison: 'Elektrolit ve asit-baz karşılaştırması', class: 'İlaç sınıfı', potassium: 'Serum K⁺ eğilimi', calcium: 'İdrar Ca²⁺ atılımı', acid: 'Asit-baz eğilimi', down: '↓ Azalabilir', up: '↑ Artabilir', variable: 'Değişken', 'urine-up': '↑ Artar', 'urine-down': '↓ Azalır', neutral: 'Belirgin sınıf etkisi yok', acidosis: 'Asidoz', alkalosis: 'Alkaloz', reset: 'Sıfırla', sources: 'Kaynaklar ve görsel düzeltmeleri', sourceNote: 'Paylaşılan zihin haritasından uyarlanan özgün etkileşimli çizim. AKI, mannitol, etakrinik asit ve amilorid genellemeleri kaynaklarla düzeltildi.', limit: 'Şematik nefron, anatomik ölçek değildir. Oklar tipik sınıf eğilimlerini gösterir; hasta laboratuvar sonucu, doz yanıtı veya tedavi önerisi değildir. Etki böbrek işlevi, hacim durumu ve eşlik eden ilaçlarla değişir.', siteNote: 'Altın çizgi: seçili sınıfın renal etki yeri. Toplayıcı kanalda MRA ve ENaC blokerleri farklı moleküler hedefleri etkiler.', correction: 'AKI varlığı tek başına diüretik endikasyonu değildir; hacim yükünün yönetimi ayrı değerlendirilir. Mannitol genel bir “oligüri tedavisi” olarak gösterilmez.' },
  en: { eyebrow: 'NEPHRON LAB', title: 'Diuretics: sites, uses and side effects', intro: 'Select a drug class or nephron segment. Compare mechanisms, use contexts and electrolyte tendencies.', proximal: 'Proximal tubule', descending: 'Thin descending limb', ascending: 'Thick ascending limb', distal: 'Distal tubule', collecting: 'Collecting duct', glomerulus: 'Glomerulus', urine: 'Urine', cortex: 'CORTEX', medulla: 'MEDULLA', macula: 'Macula densa', flow: 'Tubular fluid flow', mechanism: 'Mechanism', uses: 'Use contexts', risks: 'Key side effects', monitor: 'Monitoring', comparison: 'Electrolyte and acid-base comparison', class: 'Drug class', potassium: 'Serum K⁺ tendency', calcium: 'Urinary Ca²⁺ excretion', acid: 'Acid-base tendency', down: '↓ May decrease', up: '↑ May increase', variable: 'Variable', 'urine-up': '↑ Increased', 'urine-down': '↓ Decreased', neutral: 'No prominent class effect', acidosis: 'Acidosis', alkalosis: 'Alkalosis', reset: 'Reset', sources: 'Sources and image corrections', sourceNote: 'Original interactive drawing adapted from the shared mind map. AKI, mannitol, ethacrynic acid and amiloride generalizations corrected against sources.', limit: 'Schematic nephron, not anatomical scale. Arrows show typical class tendencies, not patient laboratory values, dose responses or treatment advice. Effects vary with renal function, volume status and other drugs.', siteNote: 'Gold line: selected class renal site. MRA and ENaC blockers act on different molecular targets in the collecting duct.', correction: 'AKI alone is not an indication for diuretics; volume overload is a separate consideration. Mannitol is not shown as a general treatment for oliguria.' }
};

/** Label anchors on the schematic nephron (SVG user units). */
const SEGMENT_LABELS = { proximal: [150, 52, 'middle'], descending: [98, 330, 'middle', -90], ascending: [204, 330, 'middle', 90], distal: [440, 200, 'middle'], collecting: [538, 330, 'middle', 90] };
/** Molecular target and badge anchor per class; first point = site on the tubule. */
const CLASS_SITES = {
  ca: { target: 'Carbonic anhydrase', site: [126, 118], box: [8, 140] },
  loop: { target: 'NKCC2 (Na⁺/K⁺/2Cl⁻)', site: [176, 400], box: [230, 400] },
  thiazide: { target: 'NCC (Na⁺/Cl⁻)', site: [352, 156], box: [300, 250] },
  osmotic: { target: { tr: 'Ozmotik su tutulumu', en: 'Osmotic water retention' }, site: [120, 330], box: [240, 330] },
  mra: { target: { tr: 'Mineralokortikoid reseptör', en: 'Mineralocorticoid receptor' }, site: [512, 300], box: [230, 300] },
  enac: { target: 'ENaC', site: [512, 300], box: [340, 300] },
};

export function createDiureticsPanel({ mount, getLang = () => 'tr' }) {
  let selected = 'loop';
  const root = document.createElement('section');
  root.className = 'diuretic';
  root.innerHTML = `<p class="diuretic-eyebrow"></p><h2></h2><p class="diuretic-intro"></p><div class="diuretic-class-tabs" role="group"></div>
    <div class="diuretic-layout"><div class="diuretic-map-wrap"><svg class="diuretic-map" viewBox="0 0 640 500" role="img"><title></title>
      <defs><linearGradient id="diuretic-medulla" x2="0" y2="1"><stop stop-color="#f3e6dc"/><stop offset="1" stop-color="#e9cfc4"/></linearGradient></defs>
      <rect x="1" y="1" width="638" height="498" rx="20" fill="#f6f4ea"/>
      <rect x="1" y="215" width="638" height="284" fill="url(#diuretic-medulla)"/>
      <path d="M1 215H639" stroke="#d3bfae" stroke-dasharray="6 6"/>
      <text data-diuretic-svg-label="cortex" x="620" y="30" text-anchor="end" class="diuretic-zone"/><text data-diuretic-svg-label="medulla" x="620" y="240" text-anchor="end" class="diuretic-zone"/>
      <path d="M245 20V70M330 20V72" stroke="#c46a5c" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="288" cy="100" r="44" fill="#f8e6da" stroke="#c18d71" stroke-width="3"/>
      <path d="M262 96Q276 70 292 98Q305 122 318 95M268 112Q288 126 300 86" fill="none" stroke="#bb6b65" stroke-width="5" stroke-linecap="round"/>
      <g class="diuretic-hit">
      <path data-nephron-line="proximal" d="M246 112C226 118 214 96 196 108C176 122 186 80 160 86C136 92 150 128 126 118C104 108 96 140 110 162Q120 180 120 215"/>
      <path data-nephron-line="descending" d="M120 215V420Q120 456 148 456"/>
      <path data-nephron-line="ascending" d="M148 456Q176 456 176 420V230Q176 186 236 160L262 150"/>
      <path data-nephron-line="distal" d="M262 150C300 166 328 132 352 156C376 180 392 118 418 140C440 158 452 120 476 132"/>
      <path data-nephron-line="collecting" d="M476 132Q512 146 512 190V450"/>
      </g>
      <circle cx="258" cy="152" r="7" fill="#7c5a8a" stroke="#fff" stroke-width="2"/>
      <text data-diuretic-svg-label="macula" x="272" y="196" class="diuretic-small"/>
      <path d="M560 205V445M552 435L560 448L568 435" stroke="#b5a28f" stroke-width="2" fill="none"/>
      <text data-diuretic-svg-label="flow" x="584" y="250" class="diuretic-small" transform="rotate(90 584 250)"/>
      <path d="M504 462L512 478L520 462" fill="none" stroke="#668da3" stroke-width="4"/>
      <text data-diuretic-svg-label="glomerulus" x="342" y="46"/><text data-diuretic-svg-label="urine" x="512" y="496" text-anchor="middle"/>
      <g class="diuretic-seg-labels"></g>
      <g class="diuretic-badge"><line class="diuretic-badge-line"/><rect rx="10" height="54"/><text class="diuretic-badge-drug" dy="23"/><text class="diuretic-badge-target" dy="44"/></g>
    </svg><div class="diuretic-segments" role="group"></div><p class="diuretic-site-note"></p></div>
    <div class="diuretic-details" aria-live="polite"><h3></h3><p class="diuretic-examples"></p><div class="diuretic-mechanism"><h4></h4><p></p></div><div class="diuretic-use"><h4></h4><ul></ul></div><div class="diuretic-risk"><h4></h4><ul></ul></div><div class="diuretic-monitor"><h4></h4><p></p></div></div></div>
    <section data-loop-detail></section><p class="diuretic-correction"></p><div class="diuretic-table-scroll"><table><caption></caption><thead><tr></tr></thead><tbody></tbody></table></div><p class="diuretic-limit"></p><button type="button" data-diuretic-reset></button>
    <details class="diuretic-sources"><summary></summary><p></p><ul></ul></details>`;
  mount.append(root);
  const loop = createLoopDetail({ mount: root.querySelector('[data-loop-detail]'), getLang });
  const t = value => value[getLang() === 'en' ? 'en' : 'tr'];
  const w = () => WORDS[getLang() === 'en' ? 'en' : 'tr'];
  const tabs = new Map(), segments = new Map(), rows = new Map();
  const choose = id => { selected = id; refresh(); };
  for (const item of DIURETIC_CLASSES) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.diureticClass = item.id;
    button.addEventListener('click', () => choose(item.id));
    root.querySelector('.diuretic-class-tabs').append(button); tabs.set(item.id, button);
    const row = document.createElement('tr'), labelCell = document.createElement('th'), rowButton = document.createElement('button');
    labelCell.scope = 'row'; rowButton.type = 'button'; rowButton.dataset.diureticCompare = item.id;
    rowButton.addEventListener('click', () => choose(item.id));
    labelCell.append(rowButton); row.append(labelCell);
    for (const key of ['potassium', 'calcium', 'acid']) { const cell = document.createElement('td'); cell.dataset.diureticEffect = key; row.append(cell); }
    root.querySelector('tbody').append(row); rows.set(item.id, row);
  }
  for (const id of ['proximal', 'descending', 'ascending', 'distal', 'collecting']) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.diureticSegment = id;
    button.addEventListener('click', () => {
      const active = DIURETIC_CLASSES.find(item => item.id === selected);
      if (!active.segments.includes(id)) choose(DIURETIC_CLASSES.find(item => item.segments.includes(id)).id);
    });
    root.querySelector('.diuretic-segments').append(button); segments.set(id, button);
  }
  root.querySelectorAll('[data-nephron-line]').forEach(path => {
    const id = path.dataset.nephronLine;
    path.addEventListener('click', () => segments.get(id).click());
    path.addEventListener('pointerenter', () => root.classList.add(`hover-${id}`));
    path.addEventListener('pointerleave', () => root.classList.remove(`hover-${id}`));
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const [x, y, anchor, angle] = SEGMENT_LABELS[id];
    label.setAttribute('x', x); label.setAttribute('y', y); label.setAttribute('text-anchor', anchor);
    if (angle) label.setAttribute('transform', `rotate(${angle} ${x} ${y})`);
    label.dataset.segLabel = id; label.classList.add('diuretic-seg-label');
    root.querySelector('.diuretic-seg-labels').append(label);
  });
  root.querySelector('[data-diuretic-reset]').addEventListener('click', () => choose('loop'));
  for (const source of DIURETIC_SOURCES) {
    const li = document.createElement('li');
    const link = source.url ? document.createElement('a') : document.createElement('span');
    link.textContent = source.title;
    if (source.url) { link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    li.append(link); root.querySelector('.diuretic-sources ul').append(li);
  }
  function refresh() {
    root.querySelector('[data-loop-detail]').hidden = selected !== 'loop';
    loop.refresh();
    const words = w(), active = DIURETIC_CLASSES.find(item => item.id === selected);
    const write = (selector, value) => { root.querySelector(selector).textContent = value; };
    write('.diuretic-eyebrow', words.eyebrow); write('h2', words.title); write('.diuretic-intro', words.intro);
    root.querySelector('.diuretic-class-tabs').setAttribute('aria-label', words.class);
    root.querySelector('.diuretic-segments').setAttribute('aria-label', words.siteNote);
    for (const [id, button] of tabs) {
      button.textContent = t(DIURETIC_CLASSES.find(item => item.id === id).title);
      button.setAttribute('aria-pressed', String(id === selected));
    }
    for (const [id, button] of segments) {
      button.textContent = words[id]; button.setAttribute('aria-pressed', String(active.segments.includes(id)));
      root.querySelector(`[data-nephron-line="${id}"]`).classList.toggle('is-active', active.segments.includes(id));
    }
    root.querySelector('.diuretic-map title').textContent = `${words.title}: ${active.segments.map(id => words[id]).join(', ')}`;
    root.querySelectorAll('[data-diuretic-svg-label]').forEach(node => { node.textContent = words[node.dataset.diureticSvgLabel]; });
    root.querySelectorAll('[data-seg-label]').forEach(node => {
      node.textContent = words[node.dataset.segLabel];
      node.classList.toggle('is-active', active.segments.includes(node.dataset.segLabel));
    });
    drawBadge(active);
    write('.diuretic-site-note', words.siteNote); write('.diuretic-details h3', t(active.title)); write('.diuretic-examples', t(active.examples));
    for (const key of ['mechanism', 'monitor']) { write(`.diuretic-${key} h4`, words[key]); write(`.diuretic-${key} p`, t(active[key])); }
    for (const [cls, key] of [['use', 'uses'], ['risk', 'risks']]) {
      write(`.diuretic-${cls} h4`, words[key]);
      root.querySelector(`.diuretic-${cls} ul`).replaceChildren(...active[key].map(value => { const li = document.createElement('li'); li.textContent = t(value); return li; }));
    }
    write('.diuretic-correction', words.correction); write('caption', words.comparison);
    root.querySelector('thead tr').replaceChildren(...['class', 'potassium', 'calcium', 'acid'].map(key => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = words[key]; return th; }));
    for (const item of DIURETIC_CLASSES) {
      const row = rows.get(item.id), button = row.querySelector('button');
      button.textContent = t(item.title); button.setAttribute('aria-pressed', String(item.id === selected));
      row.classList.toggle('is-active', item.id === selected);
      row.querySelectorAll('[data-diuretic-effect]').forEach(cell => { cell.textContent = words[item.effects[cell.dataset.diureticEffect]]; });
    }
    write('.diuretic-limit', words.limit); write('[data-diuretic-reset]', words.reset);
    write('.diuretic-sources summary', words.sources); write('.diuretic-sources p', words.sourceNote);
  }
  function drawBadge(active) {
    const meta = CLASS_SITES[active.id];
    const badge = root.querySelector('.diuretic-badge');
    badge.style.display = meta ? '' : 'none';
    if (!meta) return;
    const drug = t(active.examples).split(/[,;(]/)[0].trim();
    const target = typeof meta.target === 'string' ? meta.target : t(meta.target);
    const width = Math.max(drug.length, target.length) * 9.6 + 28;
    const x = Math.min(Math.max(meta.box[0], 8), 632 - width), y = meta.box[1];
    const line = badge.querySelector('line');
    line.setAttribute('x1', meta.site[0]); line.setAttribute('y1', meta.site[1]);
    line.setAttribute('x2', x + width / 2); line.setAttribute('y2', y + 27);
    const rect = badge.querySelector('rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y); rect.setAttribute('width', width);
    for (const [cls, value] of [['drug', drug], ['target', target]]) {
      const node = badge.querySelector(`.diuretic-badge-${cls}`);
      node.setAttribute('x', x + 14); node.setAttribute('y', y); node.textContent = value;
    }
  }
  refresh();
  return { refresh, getState: () => ({ selected }) };
}

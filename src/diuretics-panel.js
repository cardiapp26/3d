import { DIURETIC_CLASSES, DIURETIC_SOURCES } from './diuretics-data.js';
import './diuretics.css';
import { createLoopDetail } from './loop-diuretics.js';

const WORDS = {
  tr: { eyebrow: 'NEFRON LABORATUVARI', title: 'Diüretikler: etki yeri ve yan etkiler', intro: 'Bir ilaç sınıfı veya nefron segmenti seçin. Mekanizma, kullanım bağlamı ve elektrolit eğilimlerini karşılaştırın.', proximal: 'Proksimal tübül', descending: 'İnen ince kol', ascending: 'Kalın çıkan kol', distal: 'Distal tübül', collecting: 'Toplayıcı kanal', glomerulus: 'Glomerül', urine: 'İdrar', mechanism: 'Mekanizma', uses: 'Kullanım bağlamları', risks: 'Önemli yan etkiler', monitor: 'İzlem', comparison: 'Elektrolit ve asit-baz karşılaştırması', class: 'İlaç sınıfı', potassium: 'Serum K⁺ eğilimi', calcium: 'İdrar Ca²⁺ atılımı', acid: 'Asit-baz eğilimi', down: '↓ Azalabilir', up: '↑ Artabilir', variable: 'Değişken', 'urine-up': '↑ Artar', 'urine-down': '↓ Azalır', neutral: 'Belirgin sınıf etkisi yok', acidosis: 'Asidoz', alkalosis: 'Alkaloz', reset: 'Sıfırla', sources: 'Kaynaklar ve görsel düzeltmeleri', sourceNote: 'Paylaşılan zihin haritasından uyarlanan özgün etkileşimli çizim. AKI, mannitol, etakrinik asit ve amilorid genellemeleri kaynaklarla düzeltildi.', limit: 'Şematik nefron, anatomik ölçek değildir. Oklar tipik sınıf eğilimlerini gösterir; hasta laboratuvar sonucu, doz yanıtı veya tedavi önerisi değildir. Etki böbrek işlevi, hacim durumu ve eşlik eden ilaçlarla değişir.', siteNote: 'Altın çizgi: seçili sınıfın renal etki yeri. Toplayıcı kanalda MRA ve ENaC blokerleri farklı moleküler hedefleri etkiler.', correction: 'AKI varlığı tek başına diüretik endikasyonu değildir; hacim yükünün yönetimi ayrı değerlendirilir. Mannitol genel bir “oligüri tedavisi” olarak gösterilmez.' },
  en: { eyebrow: 'NEPHRON LAB', title: 'Diuretics: sites, uses and side effects', intro: 'Select a drug class or nephron segment. Compare mechanisms, use contexts and electrolyte tendencies.', proximal: 'Proximal tubule', descending: 'Thin descending limb', ascending: 'Thick ascending limb', distal: 'Distal tubule', collecting: 'Collecting duct', glomerulus: 'Glomerulus', urine: 'Urine', mechanism: 'Mechanism', uses: 'Use contexts', risks: 'Key side effects', monitor: 'Monitoring', comparison: 'Electrolyte and acid-base comparison', class: 'Drug class', potassium: 'Serum K⁺ tendency', calcium: 'Urinary Ca²⁺ excretion', acid: 'Acid-base tendency', down: '↓ May decrease', up: '↑ May increase', variable: 'Variable', 'urine-up': '↑ Increased', 'urine-down': '↓ Decreased', neutral: 'No prominent class effect', acidosis: 'Acidosis', alkalosis: 'Alkalosis', reset: 'Reset', sources: 'Sources and image corrections', sourceNote: 'Original interactive drawing adapted from the shared mind map. AKI, mannitol, ethacrynic acid and amiloride generalizations corrected against sources.', limit: 'Schematic nephron, not anatomical scale. Arrows show typical class tendencies, not patient laboratory values, dose responses or treatment advice. Effects vary with renal function, volume status and other drugs.', siteNote: 'Gold line: selected class renal site. MRA and ENaC blockers act on different molecular targets in the collecting duct.', correction: 'AKI alone is not an indication for diuretics; volume overload is a separate consideration. Mannitol is not shown as a general treatment for oliguria.' }
};

export function createDiureticsPanel({ mount, getLang = () => 'tr' }) {
  let selected = 'loop';
  const root = document.createElement('section');
  root.className = 'diuretic';
  root.innerHTML = `<p class="diuretic-eyebrow"></p><h2></h2><p class="diuretic-intro"></p><div class="diuretic-class-tabs" role="group"></div>
    <div class="diuretic-layout"><div class="diuretic-map-wrap"><svg class="diuretic-map" viewBox="0 0 640 500" role="img"><title></title>
      <rect x="1" y="1" width="638" height="498" rx="20" fill="#f1f5e9"/>
      <path d="M65 65C30 72 30 116 60 123C100 137 133 119 131 91C130 62 100 47 65 65Z" fill="#f2ddd0" stroke="#c18d71" stroke-width="3"/>
      <path d="M50 92Q68 65 92 99Q105 113 116 87M60 102Q80 118 99 80" fill="none" stroke="#bb6b65" stroke-width="5"/>
      <path data-nephron-line="proximal" d="M129 94H150C179 53 191 124 214 84C236 47 248 118 263 102V145"/>
      <path data-nephron-line="descending" d="M263 145V391Q265 443 307 443"/>
      <path data-nephron-line="ascending" d="M307 443Q349 443 349 391V166Q348 141 369 125"/>
      <path data-nephron-line="distal" d="M369 125C392 94 405 158 426 121C446 84 462 149 484 110Q500 85 520 127"/>
      <path data-nephron-line="collecting" d="M520 127Q549 157 555 201V438"/>
      <path d="M548 452L555 465L562 452" fill="none" stroke="#668da3" stroke-width="4"/>
      <text data-diuretic-svg-label="glomerulus" x="24" y="39"/><text data-diuretic-svg-label="urine" x="525" y="485"/>
      <text x="286" y="475" class="diuretic-loop-label">Henle</text>
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
  refresh();
  return { refresh, getState: () => ({ selected }) };
}

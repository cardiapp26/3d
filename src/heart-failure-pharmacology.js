import { PHARMA_TOPICS } from './pharmacology-data.js';
import './heart-failure-pharmacology.css';
import { createHfVisual, HF_DRUG_NODES } from './hf-visual.js';
const text = (tr, en) => ({ tr, en });
const cards = PHARMA_TOPICS.find(topic => topic.id === 'heart-failure').cards;
export const HF_GROUPS = [
  { id: 'foundation', title: text('Kronik HFrEF · dört temel sınıf', 'Chronic HFrEF · four core classes'), ids: ['arni', 'hf-beta', 'mra', 'sglt2'] },
  { id: 'symptom', title: text('Konjesyon ve seçilmiş ek tedaviler', 'Congestion and selected add-on therapies'), ids: ['loop', 'digoxin', 'hydralazine'] },
  { id: 'acute', title: text('Akut / ileri hastalık · uzman gözetimi', 'Acute / advanced disease · specialist monitoring'), ids: ['inotrope', 'iv-vasodilator', 'nesiritide'] },
];
export const HF_EXTRA = [
  { id: 'loop', name: text('Loop diüretikleri', 'Loop diuretics'), examples: text('Furosemid, torsemid, bumetanid', 'Furosemide, torsemide, bumetanide'), mechanism: text('NKCC2 blokajı → Na⁺/su atılımı → konjesyon azalır.', 'NKCC2 blockade → sodium/water excretion → reduced congestion.'), use: text('Sıvı retansiyonunda semptom giderme; dört temel sınıfın yerine geçmez. Tek başına kanıtlanmış sağkalım yararıyla etiketlenmez.', 'Symptom relief in fluid retention; does not replace the four core classes. Not labeled with a proven independent survival benefit.'), risk: text('Hipovolemi, elektrolit kaybı, böbrek işlevinde bozulma.', 'Hypovolemia, electrolyte loss, worsening renal function.'), monitor: text('Kilo, konjesyon, kan basıncı, K⁺/Mg²⁺ ve böbrek işlevi.', 'Weight, congestion, blood pressure, K⁺/Mg²⁺ and renal function.') },
  { id: 'hydralazine', name: text('Hidralazin + ISDN', 'Hydralazine + ISDN'), examples: text('Hidralazin / izosorbid dinitrat', 'Hydralazine / isosorbide dinitrate'), mechanism: text('Arteriyel + venöz vazodilatasyon → ard yük/ön yük azalır.', 'Arterial + venous vasodilation → reduced afterload/preload.'), use: text('Optimal tedaviye rağmen semptomatik, kendini Siyah olarak tanımlayan NYHA III–IV HFrEF grubunda sonuç yararı; RAAS ilaçları kullanılamayan seçilmiş hastalarda da değerlendirilir. Irk, tek başına biyolojik yanıt belirleyicisi değildir.', 'Outcome benefit in self-identified Black patients with NYHA III–IV HFrEF despite optimal therapy; also considered in selected patients unable to receive RAAS drugs. Race alone does not determine biological response.'), risk: text('Hipotansiyon, baş ağrısı; hidralazine bağlı lupus benzeri sendrom.', 'Hypotension, headache; hydralazine-associated lupus-like syndrome.'), monitor: text('Kan basıncı, semptomlar; nitrat-PDE5 inhibitörü etkileşimi.', 'Blood pressure, symptoms; nitrate-PDE5 inhibitor interaction.') },
  { id: 'inotrope', name: text('IV inotroplar', 'IV inotropes'), examples: text('Dobutamin; milrinon (PDE3). Dopamin: seçilmiş hemodinamik bağlam.', 'Dobutamine; milrinone (PDE3). Dopamine: selected hemodynamic contexts.'), mechanism: text('Beta adrenerjik uyarı veya PDE3 inhibisyonu → cAMP/Ca²⁺ artışı → kontraktilite artışı.', 'Beta adrenergic stimulation or PDE3 inhibition → increased cAMP/Ca²⁺ → increased contractility.'), use: text('Şok/hipoperfüzyonda seçilmiş destek; ileri tedaviye köprü veya palyatif kullanım uzman kararıdır. Bunların dışında uzun süreli IV kullanım potansiyel olarak zararlıdır.', 'Selected support for shock/hypoperfusion; bridge to advanced therapy or palliative use requires specialist assessment. Other long-term IV use is potentially harmful.'), risk: text('Taşiaritmi, iskemi; milrinonda hipotansiyon ve renal birikim.', 'Tachyarrhythmia, ischemia; hypotension and renal accumulation with milrinone.'), monitor: text('Sürekli ritim/hemodinami, perfüzyon ve böbrek işlevi.', 'Continuous rhythm/hemodynamic monitoring, perfusion and renal function.') },
  { id: 'iv-vasodilator', name: text('IV vazodilatörler', 'IV vasodilators'), examples: text('Nitrogliserin, nitroprussid', 'Nitroglycerin, nitroprusside'), mechanism: text('Vazodilatasyon → dolum basıncı/ön yük ve ilaca göre ard yük azalır.', 'Vasodilation → reduced filling pressure/preload and drug-dependent afterload.'), use: text('Sistemik hipotansiyon yoksa seçilmiş akut dekompansasyonda diüretiğe ek semptomatik seçenek; kronik sağkalım tedavisi değildir.', 'Selected adjunct to diuretics in acute decompensation without systemic hypotension; not chronic survival therapy.'), risk: text('Hipotansiyon; nitroprussidde siyanür/tiyosiyanat toksisitesi.', 'Hypotension; cyanide/thiocyanate toxicity with nitroprusside.'), monitor: text('Yakın kan basıncı/hemodinami; nitroprussidde süre ve organ işlevi.', 'Close blood pressure/hemodynamic monitoring; duration and organ function with nitroprusside.') },
  { id: 'nesiritide', name: text('BNP analoğu · tarihsel bağlam', 'BNP analogue · historical context'), examples: text('Nesiritid', 'Nesiritide'), mechanism: text('Natriüretik peptid reseptörü → cGMP → vazodilatasyon.', 'Natriuretic peptide receptor → cGMP → vasodilation.'), use: text('ASCEND-HF: 30 günlük ölüm/HF yeniden yatış birleşik sonucunda yarar gösterilmedi. Güncel dört temel sınıfın parçası değildir.', 'ASCEND-HF showed no benefit for the 30-day death/HF readmission composite. Not part of the contemporary four core classes.'), risk: text('Hipotansiyon; sonuç yararı varsayılmaz.', 'Hypotension; outcome benefit should not be assumed.'), monitor: text('Kan basıncı ve böbrek işlevi; tarihsel öğretim kartı.', 'Blood pressure and renal function; historical teaching card.') },
];
export function createHeartFailurePharmacology({ mount, getLang }) {
  let selected = 'arni', node = '';
  const root = document.createElement('section'); root.className = 'hfpharma';
  root.innerHTML = '<p class="hfpharma-eyebrow"></p><h2></h2><p class="hfpharma-intro"></p><div data-hf-visual></div><div class="hfpharma-tree"></div><article class="hfpharma-detail" aria-live="polite"><h3></h3><p class="hfpharma-examples"></p></article><details class="hfpharma-safety"><summary></summary><p></p></details><p class="hfpharma-limit"></p><details class="hfpharma-sources"><summary></summary><ul></ul></details>';
  mount.append(root);
  const visual = createHfVisual({ mount: root.querySelector('[data-hf-visual]'), getLang, onNode: id => { node = node === id ? '' : id; refresh(); } });
  const t = value => value[getLang() === 'en' ? 'en' : 'tr'];
  const items = [...cards, ...HF_EXTRA], buttons = new Map(), headings = new Map();
  for (const group of HF_GROUPS) {
    const branch = document.createElement('div'); branch.className = 'hfpharma-branch';
    const heading = document.createElement('h3'); branch.append(heading); headings.set(group.id, heading);
    for (const id of group.ids) {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.hfDrug = id;
      button.addEventListener('click', () => { selected = id; node = ''; refresh(); }); branch.append(button); buttons.set(id, button);
    }
    root.querySelector('.hfpharma-tree').append(branch);
  }
  const fields = ['mechanism', 'use', 'risk', 'monitor'];
  for (const field of fields) { const div = document.createElement('div'); div.dataset.hfField = field; div.innerHTML = '<h4></h4><p></p>'; root.querySelector('article').append(div); }
  const sources = [
    ['2024 ACC HFrEF consensus', 'https://www.acc.org/latest-in-cardiology/ten-points-to-remember/2024/03/06/19/22/2024-acc-expert-consensus-hfref'],
    ['2022 AHA/ACC/HFSA guideline', 'https://www.jacc.org/doi/full/10.1016/j.jacc.2021.12.012'],
    ['DailyMed: Digoxin', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=5500ee2a-077d-486c-b56d-36e0c5e5c31d'],
    ['ACC: ASCEND-HF', 'https://www.acc.org/latest-in-cardiology/clinical-trials/2014/08/20/14/29/ascend-hf'],
  ];
  for (const [title, url] of sources) { const li = document.createElement('li'), a = document.createElement('a'); a.textContent = title; a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; li.append(a); root.querySelector('.hfpharma-sources ul').append(li); }
  function refresh() {
    root.querySelector('.hfpharma-eyebrow').textContent = t(text('KALP YETERSİZLİĞİ İLAÇ HARİTASI', 'HEART FAILURE DRUG MAP'));
    root.querySelector('h2').textContent = t(text('Hedef, amaç ve kanıt', 'Target, purpose and evidence'));
    root.querySelector('.hfpharma-intro').textContent = t(text('Bir dal seçin. Kronik HFrEF temel tedavileri, konjesyon giderme ve akut destek farklı amaç taşır. ARNI uygun değilse ACEi/ARB alternatif olabilir; birlikte kullanılan ek bir temel sınıf değildir.', 'Select a branch. Chronic HFrEF core therapy, congestion relief and acute support have different purposes. ACEi/ARB may substitute when ARNI is unsuitable; they are not an additional core class used together.'));
    for (const group of HF_GROUPS) headings.get(group.id).textContent = t(group.title);
    for (const [id, button] of buttons) { button.textContent = t(items.find(item => item.id === id).name); button.setAttribute('aria-pressed', String(id === selected)); button.classList.toggle('acts-here', Boolean(node && HF_DRUG_NODES[id]?.[node])); }
    const item = items.find(item => item.id === selected);
    visual.update({ drug: selected, node, drugName: t(item.name) });
    root.querySelector('article h3').textContent = t(item.name); root.querySelector('.hfpharma-examples').textContent = t(item.examples);
    const labels = { mechanism: text('Etki hedefi', 'Target'), use: text('Amaç / kanıt', 'Purpose / evidence'), risk: text('Güvenlik', 'Safety'), monitor: text('İzlem', 'Monitoring') };
    for (const field of fields) { const div = root.querySelector(`[data-hf-field=${field}]`); div.querySelector('h4').textContent = t(labels[field]); div.querySelector('p').textContent = t(item[field]); }
    root.querySelector('.hfpharma-safety summary').textContent = t(text('Digoksin: dar terapötik aralık ve elektrolitler', 'Digoxin: narrow therapeutic index and electrolytes'));
    root.querySelector('.hfpharma-safety p').textContent = t(text('Hipokalemi, hipomagnezemi ve hiperkalsemi duyarlılığı artırır. Böbrek işlevi ve amiodaron/verapamil gibi etkileşimler düzeyi etkiler. Bulantı, görme değişikliği, bradikardi veya aritmi toksisite bulgusu olabilir. Ağır akut toksisitede hiperkalemi görülebilir. Digoksin immün Fab, ciddi toksisite için özgül tedavidir; eski şemadaki lidokain/pacing sıralaması evrensel tedavi algoritması olarak aktarılmaz.', 'Hypokalemia, hypomagnesemia and hypercalcemia increase susceptibility. Renal function and interactions such as amiodarone/verapamil affect levels. Nausea, visual changes, bradycardia or arrhythmia may indicate toxicity. Severe acute toxicity can cause hyperkalemia. Digoxin immune Fab is specific therapy for serious toxicity; the old lidocaine/pacing sequence is not reproduced as a universal treatment algorithm.'));
    root.querySelector('.hfpharma-limit').textContent = t(text('Paylaşılan şemanın güncellenmiş öğretim uyarlaması. Dört temel sınıf kronik HFrEF içindir; HFpEF’ye aynı sağkalım hiyerarşisi uygulanmaz. Labetalol tüm beta blokerlerle eşdeğer HFrEF kanıtına sahip değildir. Doz, başlama sırası veya hasta tedavi algoritması hesaplanmaz.', 'Updated teaching adaptation of the shared chart. Four core classes refer to chronic HFrEF; the same survival hierarchy is not applied to HFpEF. Labetalol does not share equivalent HFrEF evidence with all beta blockers. No dosing, initiation sequence or patient treatment algorithm is calculated.'));
    root.querySelector('.hfpharma-sources summary').textContent = t(text('Kaynaklar ve şema düzeltmeleri', 'Sources and chart corrections'));
  }
  refresh(); return { refresh };
}

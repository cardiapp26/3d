import { PHARMA_TOPICS } from './pharmacology-data.js';
import './lipid-pathways.css';
import { LIPID_SCENE, LIPID_SCENE_LABELS, createLipidFlow } from './lipid-flow.js';
const text = (tr, en) => ({ tr, en });
export const LIPID_TARGETS = {
  statin: { site: 'synthesis', flow: text('HMG-CoA redüktaz ⊣ → hepatik kolesterol ↓ → LDL-R ↑ → LDL temizlenmesi ↑', 'HMG-CoA reductase ⊣ → hepatic cholesterol ↓ → LDL-R ↑ → LDL clearance ↑') },
  ezetimibe: { site: 'absorption', flow: text('NPC1L1 ⊣ → bağırsaktan kolesterol emilimi ↓', 'NPC1L1 ⊣ → intestinal cholesterol absorption ↓') },
  pcsk9: { site: 'receptor', flow: text('PCSK9 ⊣ → LDL-R yıkımı ↓ → reseptör geri dönüşümü ↑', 'PCSK9 ⊣ → LDL-R degradation ↓ → receptor recycling ↑') },
  bile: { site: 'bile', flow: text('Safra asidi bağlama → dışkıyla kayıp ↑ → hepatik kolesterol kullanımı ↑', 'Bile acid binding → fecal loss ↑ → hepatic cholesterol utilization ↑') },
  fibrate: { site: 'lpl', flow: text('PPAR-α aktivasyonu → LPL ilişkili TG temizlenmesi ↑', 'PPAR-α activation → LPL-associated triglyceride clearance ↑') },
  niacin: { site: 'vldl', flow: text('Hepatik VLDL üretimi ↓; HDL-C ↑', 'Hepatic VLDL production ↓; HDL-C ↑') },
};
const extra = [
  { id: 'bile', name: text('Safra asidi bağlayıcıları', 'Bile acid sequestrants'), examples: text('Kolestiramin, kolesevelam', 'Cholestyramine, colesevelam'), use: text('Seçilmiş LDL düşürme bağlamı. TG artabilir; belirgin hipertrigliseridemide uygun olmayabilir.', 'Selected LDL-lowering settings. Triglycerides may increase; may be unsuitable in marked hypertriglyceridemia.'), risk: text('Kabızlık, şişkinlik; diğer ilaçların ve yağda çözünen vitaminlerin emilimini azaltabilir.', 'Constipation, bloating; may reduce absorption of other drugs and fat-soluble vitamins.'), monitor: text('LDL/TG yanıtı, gastrointestinal tolerans ve emilim etkileşimleri.', 'LDL/triglyceride response, gastrointestinal tolerance and absorption interactions.') },
  { id: 'fibrate', name: text('Fibratlar', 'Fibrates'), examples: text('Fenofibrat, gemfibrozil', 'Fenofibrate, gemfibrozil'), use: text('Özellikle TG düşürme. TG azalması tüm hastalarda kanıtlanmış ASCVD olay azalması anlamına gelmez; statine rutin ek sonuç yararı varsayılmaz.', 'Primarily triglyceride lowering. Lower triglycerides do not imply proven ASCVD event reduction in every patient; routine add-on outcome benefit with statins is not assumed.'), risk: text('Miyopati (özellikle gemfibrozil-statin), safra taşı, karaciğer/böbrek bağlamında risk.', 'Myopathy (especially gemfibrozil-statin), gallstones, hepatic/renal safety concerns.'), monitor: text('TG, böbrek işlevi, karaciğer değerlendirmesi ve kas yakınmaları.', 'Triglycerides, renal function, hepatic assessment and muscle symptoms.') },
  { id: 'niacin', name: text('Niasin · sınırlı güncel rol', 'Niacin · limited contemporary role'), examples: text('Nikotinik asit', 'Nicotinic acid'), use: text('Tarihsel lipid mekanizması. AIM-HIGH içinde kontrollü LDL ve ASCVD bağlamında statine ek niasin klinik olay yararı sağlamadı; HDL artışı tek başına tedavi başarısı değildir.', 'Historical lipid mechanism. In AIM-HIGH, adding niacin to statins with controlled LDL and ASCVD did not improve clinical events; raising HDL alone is not treatment success.'), risk: text('Flushing, hepatotoksisite, hiperürisemi ve glisemik bozulma.', 'Flushing, hepatotoxicity, hyperuricemia and impaired glycemic control.'), monitor: text('Karaciğer, glukoz, ürik asit ve tolerans; rutin statin eki olarak sunulmaz.', 'Liver, glucose, uric acid and tolerance; not presented as a routine statin add-on.') },
];
export function createLipidPathways({ mount, getLang }) {
  let selected = 'statin';
  const items = [...PHARMA_TOPICS.find(topic => topic.id === 'lipids').cards, ...extra];
  const root = document.createElement('section'); root.className = 'lipidlab';
  root.innerHTML = `<p class="lipidlab-eyebrow"></p><h2></h2><p class="lipidlab-intro"></p><div class="lipidlab-tabs" role="group"></div><div class="lipidlab-layout"><svg viewBox="0 0 700 470" role="img"><title></title>${LIPID_SCENE}
    </svg><article aria-live="polite"><h3></h3><p class="lipidlab-examples"></p><strong class="lipidlab-flow"></strong><div data-lipid-field="use"><h4></h4><p></p></div><div data-lipid-field="risk"><h4></h4><p></p></div><div data-lipid-field="monitor"><h4></h4><p></p></div></article></div><p class="lipidlab-limit"></p><details><summary></summary><ul></ul></details>`;
  mount.append(root);
  const flow = createLipidFlow(root.querySelector('svg'), { reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches });
  const t = value => value[getLang() === 'en' ? 'en' : 'tr'];
  const buttons = new Map();
  for (const item of items) { const button = document.createElement('button'); button.type = 'button'; button.dataset.lipidDrug = item.id; button.addEventListener('click', () => { selected = item.id; refresh(); }); root.querySelector('.lipidlab-tabs').append(button); buttons.set(item.id, button); }
  const sources = [
    ['2026 ACC/AHA dyslipidemia guideline', 'https://doi.org/10.1016/j.jacc.2025.11.016'],
    ['NHLBI: AIM-HIGH', 'https://www.nhlbi.nih.gov/grants-and-training/aim-high-faqs'],
    ['DailyMed: Fenofibrate', 'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=38f43148-4ca0-402a-ba39-8ee5011a7907&version=4'],
    ['DailyMed: Cholestyramine', 'https://www.dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=214ea05f-de81-4026-9df9-4ce3820668ee&type=display'],
  ];
  for (const [title, url] of sources) { const li = document.createElement('li'), a = document.createElement('a'); a.textContent = title; a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; li.append(a); root.querySelector('ul').append(li); }
  function refresh() {
    const item = items.find(value => value.id === selected), target = LIPID_TARGETS[selected];
    root.querySelector('.lipidlab-eyebrow').textContent = t(text('LİPOPROTEİN LABORATUVARI', 'LIPOPROTEIN LAB'));
    root.querySelector('h2').textContent = t(text('Lipid yolakları ve ilaç hedefleri', 'Lipid pathways and drug targets'));
    root.querySelector('.lipidlab-intro').textContent = t(text('İlaç seçin: partiküller lipid yolunu izler; seçilen ilacın etki ettiği adım (altın) yavaşlar, tıkanır veya hızlanır. Hızlar görecelidir.', 'Select a drug: particles trace the lipid pathway; the step the drug acts on (gold) slows, closes or speeds up. Rates are relative.'));
    root.querySelector('[role=group]').setAttribute('aria-label', t(text('Lipid ilaç sınıfları', 'Lipid drug classes')));
    for (const [id, button] of buttons) { button.textContent = t(items.find(value => value.id === id).name); button.setAttribute('aria-pressed', String(id === selected)); }
    root.querySelectorAll('[data-lipid-site]').forEach(node => node.classList.toggle('is-active', node.dataset.lipidSite === target.site));
    flow.setDrug(selected);
    const labels = { intestine: text('Bağırsak', 'Intestine'), liver: text('Karaciğer', 'Liver'), blood: text('Dolaşım', 'Circulation'), tissue: text('Kas / yağ dokusu', 'Muscle / adipose'), bile: text('Safra asidi', 'Bile acids'), chylomicron: text('Şilomikron', 'Chylomicron'), feces: text('Dışkıyla atılım', 'Fecal loss'), ...LIPID_SCENE_LABELS };
    root.querySelectorAll('[data-lipid-label]').forEach(node => { node.textContent = t(labels[node.dataset.lipidLabel]); });
    root.querySelector('svg title').textContent = `${t(item.name)}: ${t(target.flow)}`;
    root.querySelector('article h3').textContent = t(item.name); root.querySelector('.lipidlab-examples').textContent = t(item.examples); root.querySelector('.lipidlab-flow').textContent = t(target.flow);
    const fields = { use: text('Klinik bağlam', 'Clinical context'), risk: text('Güvenlik', 'Safety'), monitor: text('İzlem', 'Monitoring') };
    for (const key of Object.keys(fields)) { const div = root.querySelector(`[data-lipid-field=${key}]`); div.querySelector('h4').textContent = t(fields[key]); div.querySelector('p').textContent = t(item[key]); }
    root.querySelector('.lipidlab-limit').textContent = t(text('Özgün, basitleştirilmiş öğretim şeması; oklar konsantrasyon veya kinetik simülasyonu değildir. Şilomikron/kalıntı ve HDL geri taşıma yolları tam çizilmemiştir. HDL artışı, TG veya LDL düşüşü her ajan için aynı olay azalması anlamına gelmez. Bu altı sınıf güncel ilaçların tamamı değildir; inklisiran ve bempedoik asit bu referans görselin kapsamı dışındadır.', 'Original simplified teaching diagram; arrows are not concentration or kinetic simulations. Chylomicron/remnant and HDL reverse transport pathways are not fully drawn. Raising HDL or lowering TG/LDL does not imply identical event reduction for every agent. These six classes are not exhaustive; inclisiran and bempedoic acid are outside this reference image scope.'));
    root.querySelector('summary').textContent = t(text('Kaynaklar ve görsel sınırları', 'Sources and visual limits'));
  }
  refresh(); return { refresh };
}

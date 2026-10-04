import { LIPID_REFERENCE, LIPID_REFERENCE_SOURCES } from './lipid-reference-data.js';
import { lipidLabValues, STATIN_INTENSITY } from './lipid-lab-model.js';
import './lipid-reference.css';
const text = (tr, en) => ({ tr, en });
export function createLipidReference({ mount, getLang }) {
  let selected = 'statins', group = 'all', intensity = 'high';
  const root = document.createElement('section'); root.className = 'lipidref';
  root.innerHTML = '<h2></h2><p class="lipidref-intro"></p><div class="lipidref-filters"><label><span></span><input type="search" data-lipid-search></label><label><span></span><select data-lipid-group><option value="all"></option><option value="standard"></option><option value="specialist"></option><option value="historical"></option></select></label></div><div class="lipidref-catalog"><div class="lipidref-list" role="group"></div><article aria-live="polite"><h3></h3><p class="lipidref-examples"></p></article></div><section class="lipidref-intensity"><h3></h3><p></p><div role="group"></div><div class="lipidref-table-scroll"><table><thead><tr><th></th><th></th></tr></thead><tbody></tbody></table></div></section><section class="lipidref-lab"><h3></h3><p class="lipidref-formula"></p><div class="lipidref-inputs"></div><output aria-live="polite"></output><p class="lipidref-lab-limit"></p></section><details class="lipidref-corrections"><summary></summary><ul></ul></details><details class="lipidref-sources"><summary></summary><ul></ul></details>';
  mount.append(root);
  const t = value => value[getLang() === 'en' ? 'en' : 'tr'];
  const buttons = new Map(), fieldNodes = new Map(), labInputs = new Map(), intensityButtons = new Map();
  for (const item of LIPID_REFERENCE) { const button = document.createElement('button'); button.type = 'button'; button.dataset.lipidReference = item.id; button.addEventListener('click', () => { selected = item.id; refreshDetail(); }); root.querySelector('.lipidref-list').append(button); buttons.set(item.id, button); }
  for (const key of ['mechanism', 'context', 'risk', 'monitor']) { const div = document.createElement('div'); div.innerHTML = '<h4></h4><p></p>'; root.querySelector('article').append(div); fieldNodes.set(key, div); }
  for (const key of ['high', 'moderate', 'low']) { const button = document.createElement('button'); button.type = 'button'; button.dataset.statinIntensity = key; button.addEventListener('click', () => { intensity = key; refreshIntensity(); }); root.querySelector('.lipidref-intensity [role=group]').append(button); intensityButtons.set(key, button); }
  for (const [key, value] of [['total', 200], ['hdl', 50], ['tg', 150]]) { const label = document.createElement('label'); label.innerHTML = '<span></span>'; const input = document.createElement('input'); input.type = 'number'; input.min = '0'; input.step = 'any'; input.value = value; input.dataset.lipidLab = key; input.addEventListener('input', refreshLab); label.append(input); root.querySelector('.lipidref-inputs').append(label); labInputs.set(key, { input, label }); }
  root.querySelector('[data-lipid-search]').addEventListener('input', refreshList);
  root.querySelector('[data-lipid-group]').addEventListener('change', event => { group = event.target.value; refreshList(); });
  function refreshList() {
    const query = root.querySelector('[data-lipid-search]').value.trim().toLocaleLowerCase(getLang() === 'en' ? 'en' : 'tr');
    let count = 0;
    for (const item of LIPID_REFERENCE) { const button = buttons.get(item.id); button.textContent = t(item.name); button.hidden = (group !== 'all' && item.group !== group) || !`${t(item.name)} ${t(item.examples)}`.toLocaleLowerCase(getLang() === 'en' ? 'en' : 'tr').includes(query); if (!button.hidden) count++; }
    root.querySelector('.lipidref-list').setAttribute('aria-label', `${t(text('İlaç atlası', 'Drug atlas'))}: ${count}`);
  }
  function refreshDetail() {
    const item = LIPID_REFERENCE.find(value => value.id === selected);
    for (const [id, button] of buttons) button.setAttribute('aria-pressed', String(id === selected));
    root.querySelector('article h3').textContent = t(item.name); root.querySelector('.lipidref-examples').textContent = t(item.examples);
    const labels = { mechanism: text('Mekanizma', 'Mechanism'), context: text('Kullanım / kanıt', 'Use / evidence'), risk: text('Güvenlik', 'Safety'), monitor: text('İzlem / danışmanlık', 'Monitoring / counseling') };
    for (const [key, node] of fieldNodes) { node.querySelector('h4').textContent = t(labels[key]); node.querySelector('p').textContent = t(item[key]); }
  }
  function refreshIntensity() {
    const labels = { high: text('Yüksek · ≥%50 LDL azalması', 'High · ≥50% LDL reduction'), moderate: text('Orta · %30–49', 'Moderate · 30–49%'), low: text('Düşük · <%30', 'Low · <30%') };
    for (const [key, button] of intensityButtons) { button.textContent = t(labels[key]); button.setAttribute('aria-pressed', String(key === intensity)); }
    root.querySelectorAll('thead th')[0].textContent = t(text('İlaç', 'Drug')); root.querySelectorAll('thead th')[1].textContent = t(text('Sınıflandırma dozu (mg; BID hariç günlük)', 'Classification dose (mg; daily except BID)'));
    root.querySelector('tbody').replaceChildren(...STATIN_INTENSITY.filter(item => item[intensity]).map(item => { const row = document.createElement('tr'), name = document.createElement('th'), dose = document.createElement('td'); name.scope = 'row'; name.textContent = item.name; dose.textContent = item[intensity]; row.append(name, dose); return row; }));
  }
  function refreshLab() {
    const values = Object.fromEntries([...labInputs].map(([key, { input }]) => [key, input.value.trim() === '' ? NaN : Number(input.value)]));
    const result = lipidLabValues(values), output = root.querySelector('output');
    if (result.error) { output.textContent = t(text('Geçerli, negatif olmayan değerler girin; HDL toplam kolesterolü aşamaz.', 'Enter valid nonnegative values; HDL cannot exceed total cholesterol.')); return; }
    output.textContent = `non-HDL-C: ${result.nonHdl.toFixed(1)} mg/dL · ${t(text('Tarihsel Friedewald LDL-C', 'Historical Friedewald LDL-C'))}: ${result.ldl === null ? t(text('raporlanmaz (TG ≥400 veya negatif tahmin)', 'not reported (TG ≥400 or negative estimate)')) : `${result.ldl.toFixed(1)} mg/dL`}`;
  }
  function refresh() {
    root.querySelector('h2').textContent = t(text('Dislipidemi: ilaç atlası ve laboratuvar', 'Dyslipidemia: drug atlas and laboratory'));
    root.querySelector('.lipidref-intro').textContent = t(text('İki referans tablo kaynak kontrolüyle yeniden düzenlendi. İlaç adı arayın veya kullanım grubunu seçin. ABD ürün bilgisi marka adları örnektir; Türkiye erişimi veya güncel pazarlama durumu varsayılmaz.', 'Two reference tables reorganized after source checks. Search drug names or select a use group. US label brand names are examples; Turkish availability or current marketing status is not assumed.'));
    const filterLabels = root.querySelectorAll('.lipidref-filters label > span'); filterLabels[0].textContent = t(text('İlaç / örnek adı', 'Drug / example name')); filterLabels[1].textContent = t(text('Kullanım grubu', 'Use group'));
    const groups = { all: text('Tümü', 'All'), standard: text('Genel lipid tedavileri', 'General lipid therapies'), specialist: text('Uzmanlık / nadir hastalık', 'Specialist / rare disease'), historical: text('Tarihsel / sınırlı rol', 'Historical / limited role') };
    root.querySelectorAll('option').forEach(node => { node.textContent = t(groups[node.value]); });
    root.querySelector('.lipidref-intensity h3').textContent = t(text('Statin yoğunluğu, eşdeğer doz değildir', 'Statin intensity, not equivalent dosing'));
    root.querySelector('.lipidref-intensity > p').textContent = t(text('ACC yoğunluk sınıfları, popülasyon ortalama LDL yanıtıdır. Doz tablosu eğitim içindir; hasta dozu veya ilaç değiştirme önerisi değildir. BID: günde iki kez; XL: uzatılmış salım. Simvastatin 80 mg yeni başlanacak seçenek olarak gösterilmez.', 'ACC intensity classes describe population-average LDL response. Doses are educational classifications, not patient dosing or switching advice. BID: twice daily; XL: extended release. Simvastatin 80 mg is not shown as a new-start option.'));
    root.querySelector('.lipidref-intensity [role=group]').setAttribute('aria-label', t(text('Statin yoğunluğu', 'Statin intensity')));
    root.querySelector('.lipidref-lab h3').textContent = t(text('Örnek lipit hesabı · mg/dL', 'Example lipid calculation · mg/dL'));
    root.querySelector('.lipidref-formula').textContent = 'non-HDL-C = TC − HDL-C · Friedewald: LDL-C = TC − HDL-C − TG/5';
    const labLabels = { total: text('Toplam kolesterol (TC)', 'Total cholesterol (TC)'), hdl: text('HDL-C', 'HDL-C'), tg: text('Trigliserid (TG)', 'Triglycerides (TG)') };
    for (const [key, { label }] of labInputs) label.querySelector('span').textContent = `${t(labLabels[key])} · mg/dL`;
    root.querySelector('.lipidref-lab-limit').textContent = t(text('Yalnız mg/dL. Friedewald tarihsel öğretim hesabıdır; TG ≥400 mg/dL için LDL sonucu verilmez. Düşük LDL/yüksek TG içinde hatası artabilir. 2026 kılavuzu Martin/Hopkins veya Sampson/NIH tahminini tercih eder. Rutin lipid profili her zaman açlık gerektirmez; yüksek TG gibi durumlarda açlık ölçümü ayrıca değerlendirilir. Hedef veya tedavi kararı hesaplanmaz.', 'mg/dL only. Friedewald is a historical teaching calculation; no LDL result for TG ≥400 mg/dL. Error may increase with low LDL/high TG. The 2026 guideline prefers Martin/Hopkins or Sampson/NIH estimates. Routine lipid profiles do not always require fasting; fasting testing is considered separately in situations such as elevated TG. No target or treatment decision is calculated.'));
    root.querySelector('.lipidref-corrections summary').textContent = t(text('Referans tablodaki düzeltmeler', 'Corrections to reference tables'));
    const corrections = [text('Friedewald mg/dL böleni 5; görüntüdeki belirsiz “G” kullanılmadı.', 'Friedewald divisor is 5 in mg/dL; ambiguous image “G” not used.'), text('Erken aile ASCVD öyküsü: erkek <55, kadın <65 yaş; tablodaki > yönü yanlıştır. ABI <0,9 bir risk işaretidir; >0,9 aynı anlama gelmez.', 'Premature family ASCVD history: men <55, women <65 years; image > direction is wrong. ABI <0.9 is a risk marker; >0.9 is not equivalent.'), text('Eski 7,5%/yaş tabanlı akış, otomatik tedavi motoru yapılmadı. 2026 PREVENT-ASCVD çerçevesi ve klinik bağlam gerekir.', 'Old 7.5%/age-based flow was not made into an automated treatment engine. The 2026 PREVENT-ASCVD framework and clinical context are needed.'), text('Statin yan etkileri tüm sınıf için kutulu uyarı (BBW) değildir. Gebelikte mutlak sınıf kontrendikasyonu FDA 2021’de kaldırıldı; çoğu gebe hastada yine kesilir, çok yüksek riskte uzman değerlendirmesi gerekir. Statin gerekirken emzirme önerilmez.', 'Statin adverse effects are not a class boxed warning. FDA removed the absolute class pregnancy contraindication in 2021; most pregnant patients still stop, while very-high-risk cases need specialist assessment. Breastfeeding is not recommended when statin therapy is required.'), text('ALT/AST artışında tüm “karaciğer toksik ilaçları” otomatik durdurma ve tüm etkileşimler için aynı doz sınırı aktarılmadı. Ürün, eş ilaç ve klinik bağlam ayrı kontrol edilir.', 'Automatic stopping of all “hepatotoxic drugs” for ALT/AST elevation and universal interaction dose caps were not reproduced. Product, interacting drug and clinical context need separate checks.')];
    root.querySelector('.lipidref-corrections ul').replaceChildren(...corrections.map(value => { const li = document.createElement('li'); li.textContent = t(value); return li; }));
    root.querySelector('.lipidref-sources summary').textContent = t(text('Kaynaklar', 'Sources'));
    refreshList(); refreshDetail(); refreshIntensity(); refreshLab();
  }
  for (const source of LIPID_REFERENCE_SOURCES) { const li = document.createElement('li'), node = document.createElement(source.url ? 'a' : 'span'); node.textContent = source.title; if (source.url) { node.href = source.url; node.target = '_blank'; node.rel = 'noopener noreferrer'; } li.append(node); root.querySelector('.lipidref-sources ul').append(li); }
  refresh(); return { refresh };
}

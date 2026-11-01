// Shared experiment workflow. Feedback checks observations from the current model, not clinical validity.
import './learning-studio.css';
const KEY = 'cardia.pathophysiology.experiments.v1';
export function createLearningStudio({ container, station, lang, onProgress = () => {} }) {
  let language = lang, baseline = null, baselineFigure = null, prediction = null, changed = false;
  const syncRanges = new WeakMap();
  let records = {};
  try { const saved = JSON.parse(localStorage.getItem(KEY) || '{}'); records = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}; } catch { /* Storage may be unavailable. */ }
  const tr = (a, b) => language === 'tr' ? a : b;
  const panel = document.createElement('section'); panel.className = 'learning-studio';
  panel.innerHTML = `<p class="learning-eyebrow"></p><h3></h3><ol class="learning-flow"></ol><p class="learning-goal"></p>
    <div class="learning-plan"><label><span data-learn-label="metric"></span><select data-learn-metric></select></label><label><span data-learn-label="prediction"></span><select data-learn-prediction><option value="up"></option><option value="down"></option><option value="same"></option></select></label><button type="button" data-learn-start></button></div>
    <p class="learning-status" role="status"></p><div class="learning-actions"><button type="button" data-learn-compare></button><a href="/pharmacology/#/lipids" data-learn-lipid></a></div>
    <div class="learning-results" tabindex="0"></div><label class="learning-reflection"><span></span><textarea rows="2" maxlength="2000"></textarea></label><button type="button" data-learn-save></button><p class="learning-storage"></p>`;
  container.prepend(panel);
  const $ = s => panel.querySelector(s);
  $('.learning-reflection textarea').value = typeof records[station.id]?.note === 'string' ? records[station.id].note : '';
  const numericMetrics = () => [...container.querySelectorAll('.readout-value, output')].filter(n => !panel.contains(n)).map((node, i) => ({
    id: String(i), label: node.closest('.readout-card, label')?.querySelector('.readout-title, .slider-label')?.textContent.trim() || `#${i + 1}`,
    text: node.textContent.trim()
  }));
  const metrics = () => { const values = numericMetrics(); return values.length ? values : [{ id: 'visual', label: tr('Görsel model', 'Visual model'), text: station.shortTitle[language] }]; };
  function figure() {
    const svg = [...container.querySelectorAll('svg')].find(node => !panel.contains(node));
    if (!svg) return null;
    const clone = svg.cloneNode(true);
    const targets = [clone, ...clone.querySelectorAll('*')];
    [svg, ...svg.querySelectorAll('*')].forEach((node, i) => {
      const target = targets[i];
      const style = getComputedStyle(node);
      for (const attr of ['fill', 'stroke', 'stroke-width', 'font-size', 'font-family']) target.style.setProperty(attr, style.getPropertyValue(attr));
    });
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  }
  const number = text => {
    // Only scalar outputs are graded. Ratios, ranges and paired pressures remain descriptive.
    const matches = text.match(/[-+−]?\d+(?:[.,]\d+)?/g);
    return matches?.length === 1 ? Number(matches[0].replace('−', '-').replace(',', '.')) : null;
  };
  function status(text) { $('.learning-status').textContent = text; }
  function save(done = false) {
    records[station.id] = { note: $('.learning-reflection textarea').value, completed: done || Boolean(records[station.id]?.completed) };
    try { localStorage.setItem(KEY, JSON.stringify(records)); onProgress(records); status(tr('Deney notu bu tarayıcıya kaydedildi.', 'Experiment note saved in this browser.')); }
    catch { status(tr('Kayıt yapılamadı. Notunuzu kopyalayın.', 'Could not save. Copy your note.')); }
  }
  function updateMetrics() {
    const select = $('[data-learn-metric]'), selected = select.value;
    select.replaceChildren(...metrics().map(item => { const option = document.createElement('option'); option.value = item.id; option.textContent = `${item.label}: ${item.text}`; return option; }));
    if ([...select.options].some(o => o.value === selected)) select.value = selected;
    $('[data-learn-start]').disabled = !select.options.length;
    $('[data-learn-prediction]').disabled = select.value === 'visual';
  }
  function enhance() {
    for (const range of container.querySelectorAll('input[type=range]')) {
      if (range.closest('.learning-range')) { syncRanges.get(range)?.(); continue; }
      const wrap = document.createElement('span'); wrap.className = 'learning-range';
      range.before(wrap); wrap.append(range);
      const controls = document.createElement('span'); controls.className = 'learning-fine';
      const minus = document.createElement('button'), plus = document.createElement('button'), input = document.createElement('input');
      minus.type = plus.type = 'button'; minus.textContent = '−'; plus.textContent = '+'; input.type = 'number';
      for (const attr of ['min', 'max', 'step']) input.setAttribute(attr, range.getAttribute(attr) || (attr === 'step' ? '1' : ''));
      const label = range.closest('label')?.querySelector('strong, .slider-label')?.textContent.trim() || tr('Parametre', 'Parameter');
      input.setAttribute('aria-label', label); minus.setAttribute('aria-label', `${label} −`); plus.setAttribute('aria-label', `${label} +`);
      function sync() { const currentLabel = range.closest('label')?.querySelector('strong, .slider-label')?.textContent.trim() || tr('Parametre', 'Parameter'); input.setAttribute('aria-label', currentLabel); minus.setAttribute('aria-label', `${currentLabel} −`); plus.setAttribute('aria-label', `${currentLabel} +`); input.value = range.value; minus.disabled = Number(range.value) <= Number(range.min); plus.disabled = Number(range.value) >= Number(range.max); }
      function apply(value) { if (!Number.isFinite(value)) { sync(); return; } range.value = String(value); range.dispatchEvent(new Event('input', { bubbles: true })); sync(); }
      minus.onclick = () => apply(Number(range.value) - Number(range.step || 1));
      plus.onclick = () => apply(Number(range.value) + Number(range.step || 1));
      input.onchange = () => apply(input.value.trim() ? Number(input.value) : NaN);
      syncRanges.set(range, sync); range.addEventListener('input', sync); controls.append(minus, input, plus); wrap.append(controls); sync();
    }
  }
  $('[data-learn-start]').onclick = () => {
    baseline = metrics(); baselineFigure = figure(); prediction = { id: $('[data-learn-metric]').value, direction: $('[data-learn-prediction]').value };
    changed = false; if (records[station.id]) records[station.id].compared = false; $('.learning-results').replaceChildren();
    status(tr('Başlangıç kaydedildi. Modelde tek bir parametreyi veya senaryoyu değiştirin; sonra karşılaştırın.', 'Baseline captured. Change one model parameter or scenario, then compare.'));
    $('[data-learn-compare]').disabled = false;
  };
  $('[data-learn-compare]').onclick = () => {
    if (!baseline || !changed) { status(tr('Önce deneyi başlatın ve modelde bir değişiklik yapın.', 'Start an experiment and change the model first.')); return; }
    const current = metrics(); const out = $('.learning-results'); out.replaceChildren();
    const table = document.createElement('table');
    const head = table.createTHead().insertRow();
    for (const text of [tr('Ölçüt', 'Metric'), tr('Başlangıç', 'Baseline'), tr('Şimdi', 'Now')]) { const th = document.createElement('th'); th.textContent = text; head.append(th); }
    const body = table.createTBody();
    baseline.forEach((item, i) => { const row = body.insertRow(); for (const text of [current[i]?.label || item.label, item.text, current[i]?.text || '·']) { const td = row.insertCell(); td.textContent = text; } });
    out.append(table);
    const currentFigure = figure();
    if (baselineFigure && currentFigure) {
      const figures = document.createElement('div'); figures.className = 'learning-figures';
      [baselineFigure, currentFigure].forEach((src, i) => { const item = document.createElement('figure'), img = document.createElement('img'), caption = document.createElement('figcaption'); img.src = src; img.alt = i ? tr('Modelin güncel görünümü', 'Current model view') : tr('Modelin başlangıç görünümü', 'Baseline model view'); caption.textContent = i ? tr('Şimdi', 'Now') : tr('Başlangıç', 'Baseline'); item.append(img, caption); figures.append(item); });
      out.append(figures);
    }
    const before = baseline.find(m => m.id === prediction.id), after = current.find(m => m.id === prediction.id);
    const a = before && number(before.text), b = after && number(after.text);
    const direction = a == null || b == null || before.label !== after.label || baseline.length !== current.length ? null : b > a ? 'up' : b < a ? 'down' : 'same';
    status(direction ? (direction === prediction.direction ? tr('Tahmininiz modeldeki değişimle uyumlu.', 'Your prediction matches the model change.') : tr('Modeldeki değişim tahmininizden farklı. Başlangıç ve sonucu karşılaştırıp mekanizmayı açıklayın.', 'The model changed differently from your prediction. Compare baseline and result; explain the mechanism.')) : tr('Bu çıktı tek bir sayı değil; tablo üzerinden nitel karşılaştırma yapın.', 'This output is not a single number; compare it qualitatively in the table.'));
    records[station.id] = { ...records[station.id], compared: true };
  };
  $('[data-learn-save]').onclick = () => {
    if (!records[station.id]?.compared || !$('.learning-reflection textarea').value.trim()) { status(tr('Tamamlamak için sonuçları karşılaştırın ve mekanizmayı kendi cümlelerinizle yazın.', 'Compare results and explain the mechanism in your own words to complete the experiment.')); return; }
    save(true);
  };
  function invalidate() { if (records[station.id]) records[station.id].compared = false; $('.learning-results').replaceChildren(); baseline = null; prediction = null; $('[data-learn-compare]').disabled = true; status(tr('Tahmin değişti. Yeni başlangıç kaydıyla deneyi başlatın.', 'Prediction changed. Start a new experiment baseline.')); }
  $('[data-learn-metric]').onchange = invalidate; $('[data-learn-prediction]').onchange = invalidate;
  const controller = new AbortController();
  function intervention() { changed = true; if (records[station.id]?.compared) { records[station.id].compared = false; status(tr('Model değişti. Tamamlamadan önce yeniden karşılaştırın.', 'Model changed. Compare again before completing.')); } }
  container.addEventListener('input', event => { if (!panel.contains(event.target)) { intervention(); updateMetrics(); } }, { signal: controller.signal });
  container.addEventListener('click', event => { if (!panel.contains(event.target) && event.target.closest('button')) { intervention(); queueMicrotask(() => { enhance(); updateMetrics(); }); } }, { signal: controller.signal });
  const observer = new MutationObserver(() => enhance()); observer.observe(container, { childList: true, subtree: true });
  function refresh(next) {
    language = next;
    $('.learning-eyebrow').textContent = tr('ETKİLEŞİMLİ ÖĞRENME', 'ACTIVE LEARNING');
    $('h3').textContent = tr('Kendi deneyini kur', 'Build your experiment');
    $('.learning-flow').replaceChildren(...[tr('Tahmin et', 'Predict'), tr('Değiştir', 'Explore'), tr('Karşılaştır', 'Compare'), tr('Yorumla', 'Explain')].map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    $('.learning-goal').textContent = station.intro[language];
    $('[data-learn-label=metric]').textContent = tr('İzlenecek çıktı', 'Outcome to observe'); $('[data-learn-label=prediction]').textContent = tr('Beklediğim değişim', 'My prediction');
    [...$('[data-learn-prediction]').options].forEach((option, i) => option.textContent = [tr('Artar', 'Increases'), tr('Azalır', 'Decreases'), tr('Aynı kalır', 'Unchanged')][i]);
    $('[data-learn-start]').textContent = tr('Başlangıcı kaydet · Deneyi başlat', 'Capture baseline · Start experiment');
    $('[data-learn-compare]').textContent = tr('Sonuçları karşılaştır', 'Compare results'); $('[data-learn-compare]').disabled = !baseline;
    $('[data-learn-lipid]').textContent = tr('Lipit metabolizması laboratuvarı ↗', 'Lipid metabolism lab ↗'); $('[data-learn-lipid]').href = `/pharmacology/?lang=${language}#/lipids`;
    $('.learning-reflection span').textContent = tr('Neden böyle değişti? Mekanizmayı kendi cümlelerinle açıkla.', 'Why did it change? Explain the mechanism in your own words.');
    $('[data-learn-save]').textContent = tr('Deney notunu kaydet ve tamamla', 'Save note and complete experiment');
    $('.learning-storage').textContent = tr('İlerleme yalnız bu tarayıcıda saklanır. Tamamlanma, klinik yeterlilik değerlendirmesi değildir.', 'Progress is stored only in this browser. Completion is not a clinical competency assessment.');
    enhance(); updateMetrics();
  }
  refresh(language); onProgress(records);
  return { updateLanguage: refresh, destroy() { observer.disconnect(); controller.abort(); panel.remove(); } };
}

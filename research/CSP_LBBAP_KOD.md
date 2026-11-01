# CSP / LBBAP Laboratuvarı: çalıştırılabilir kod paketi

Tarih: 2026-10-21. Teslim biçimi: tek Markdown içinde tam kaynak kod. Mevcut EPS uygulamasına uygulanmış bir değişiklik değildir.

## Kapsam

Bu dosya, bağımlılıksız HTML/CSS/JavaScript ile çalışan özgün bir öğretim prototipi içerir. Aynı model, lead konumu/açısı/derinliği ve uyarı ayarlarından yakalanan dokuları, 12 derivasyon EKG'yi, uç EGM'sini ve ölçümleri üretir. Eşik testi ve S1–S2 sonuçları seçilip incelenebilir. Referans atım, kaliper, TR/EN, kör değerlendirme ve yerel olgu günlüğü bulunur.

- Varsayılan konumda çıkış azaltılınca nonselektif, selektif ve yakalanma kaybı gözlenir. Miyokard ve ileti dokusunun eşikleri ve refrakter süreleri bağımsızdır.
- Polarite, pulse width, sentetik temas/geometri ve S2 aralığı hesaplamayı etkiler. Anodal katkı ayrı tutulur. Septal sınır aşımında yakalanma kesilir.
- Süre ölçümleri çizilen örneklerden türetilir. Empedans/COI ise bu kodun açıkça sentetik parametreleridir; gerçek ölçüm değildir.
- Grafik 0–500 ms aralığında **tek test atımıdır**. S1 treni örtüktür. Hız, S1 siklusunu belirler; kesintisiz ritim/pacing treni üretmez. “Oynat” yalnız inceleme imlecini ilerletir.
- RAO/LAO çizimleri ve septum kesiti özgün şemalardır; CT veya fizik tabanlı floroskopi değildir. İlerleme kontrolü tur sayısının milimetreye çevrildiği mekanik bir implant modeli değildir.
- Tam 3D anatomi, füzyon, ayrıntılı atriyal/T dalgası, takip kliniği, olgu zorluğuna göre klinik puanlama ve üretici algoritmaları bu prototipte uygulanmamıştır. EPS'nin 3D sahnesine bağlantı aşağıda ayrı entegrasyon adımı olarak belirtilmiştir.
- `capture` alanı simülasyonun bilinen doku durumudur. Hasta kaydından tanı koyan bir sınıflandırıcı değildir. Kör değerlendirmenin doğru yanıtı, bu prototipin öğretim kuralına göre belirlenir; klinik yeterlilik ölçmez.

## Bilimsel çerçeve ve özgünlük

Genel kavramlar için birincil kaynaklar: [EHRA 2023 CSP implantation consensus](https://doi.org/10.1093/europace/euad043) ve [ESC 2025 CSP consensus](https://doi.org/10.1093/europace/euaf050). Kod içindeki eşikler, ERP değerleri, genlikler, projeksiyonlar ve dalga şablonları **özgün sentetik öğretim parametreleridir**; bu yayınlardan çıkarılmış/fit edilmiş klinik veri veya doğrulanmış tanısal eşikler olarak sunulmaz.

[PacingSim](https://pacingsimulator.com/) arayüz incelemesi, anatomi-kayıt-test iş akışı fikri için bağlam sağladı. Sitenin kaynak kodu, ECG/EGM modeli, vaka parametreleri, metinleri veya görselleri bu pakete alınmadı. Site yazılı izin olmadan kopyalama ve yeniden barındırmayı kısıtlıyor; bu paket bağımsız, özgün uygulamadır.

## Markdown'dan dosyaları çıkarma

Proje kökünde aşağıdaki komutu çalıştır. `csp-lbbap-demo` yeni bir klasör olmalıdır; mevcut klasör/dosyaların üstüne yazılmaz. Markdown içindeki yalnız `file:` işaretli kaynak blokları çıkarılır.

```bash
python3 - <<'PY_EXTRACT'
from pathlib import Path
import re
source = Path('research/CSP_LBBAP_KOD.md')
target = Path('csp-lbbap-demo')
blocks = re.findall(r'<!-- file: ([a-z0-9.-]+) -->\n```[^\n]*\n(.*?)\n```', source.read_text(), flags=re.S)
assert len(blocks) == 9, f'Expected 9 source blocks, found {len(blocks)}'
assert len({name for name, _ in blocks}) == len(blocks), 'Duplicate file names'
target.mkdir(exist_ok=False)
for name, content in blocks:
    assert Path(name).name == name and name not in ('.', '..')
    with (target / name).open('x') as stream:
        stream.write(content + '\n')
print(f'{len(blocks)} files extracted to {target.resolve()}')
PY_EXTRACT
```

Çalıştırma:

```bash
node csp-lbbap-demo/test-csp.mjs
python3 -m http.server 5194 --bind 127.0.0.1 --directory csp-lbbap-demo
```

Tarayıcı: `http://127.0.0.1:5194/`. Node veya Python paket kurulumu gerekmez. `file://` yerine HTTP kullanılır, çünkü ES modülleri tarayıcının origin kurallarına tabidir.

İsteğe bağlı derleme, projenin mevcut Vite'ı ile:

```bash
./node_modules/.bin/vite build ./csp-lbbap-demo --config ./csp-lbbap-demo/vite.config.mjs
```

Tarayıcı regresyonu, mevcut Playwright kurulumuyla:

```bash
CSP_URL=http://127.0.0.1:5194 PLAYWRIGHT_MODULE=/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright node csp-lbbap-demo/test-browser.cjs
```

Bu Playwright yolu mevcut çalışma ortamına aittir. Başka makinede `PLAYWRIGHT_MODULE` kurulu Playwright paketinin mutlak yolu olmalı; Node modül aramasında Playwright zaten bulunuyorsa değişken atlanabilir. Ayrı TypeScript/ESLint yapılandırması eklenmemiştir.

## EPS entegrasyon sözleşmesi (henüz uygulanmadı)

Kaynak dosyaları örneğin `src/eps/csp/` altında konumlandır. Demo `main.mjs`, `index.html` ve `vite.config.mjs` dosyalarını EPS girişine kopyalamak gerekmez. EPS mevcut HTML girişini ve dil durumunu kullanır.

`createCspPanel(document, { getLang })` şu API'yi döndürür:

- `element`: panel kökü.
- `setActive(boolean)`: görünürlüğü ve animasyon yaşam döngüsünü yönetir.
- `render()`: dil/arayüz yenilemesi. Mevcut kontrol ve ölçümler korunur.
- `draw()`: boyut değişiminde Canvas çizimi.
- `getState()`, `getResult()`, `getRows()`, `getReference()`, `getHistory()`: doğrulama/entegrasyon erişimleri.

`src/eps/ep-panel.js` için gerekli değişiklikler:

1. `createCspPanel` import et, `EP_VIEWS` dizisine `'csp'`, görünüm durumuna `csp: false` ekle.
2. Diğer laboratuvar sekmeleriyle aynı şekilde sekme ve panel oluştur; kök DOM listesine `cspPanel.element` ekle:

```js
import { createCspPanel } from './csp/csp-panel.mjs';

// createEpPanel içinde; getLang mevcut panel dilini okuyacak:
const cspPanel = createCspPanel(doc, { getLang: () => lang });
const cspTab = el('button');
cspTab.type = 'button';
cspTab.setAttribute('role', 'tab');
cspTab.setAttribute('data-ep-section', 'csp');
cspTab.addEventListener('click', () => { showView('csp'); notifySection(); });
tabs.appendChild(cspTab);
// Mevcut root.append(...) listesine cspPanel.element eklenir.
```

3. `render()` içinde metni ve seçimi yenile, `cspPanel.setActive(state.csp)` çağır. Diğer görünüm boolean'larını toplayan `lessonBox.hidden`, `lab`, `wasLab` ifadelerine `state.csp`; ders sekmelerinin `aria-selected` koşuluna `!state.csp` ekle. Böylece eski canlı laboratuvar animasyonu kapatılır:

```js
cspTab.textContent = 'CSP / LBBAP';
cspTab.setAttribute('aria-selected', String(state.csp));
cspPanel.setActive(state.csp);
```

4. `showView(id)` içinde `state.csp = id === 'csp'`; başlangıçta `state.csp = initial === 'csp'` ata. `currentView()` zincirine `state.csp ? 'csp' : ...` ekle. Panel API'sine `csp: cspPanel` ekle. `redraw()` başında CSP aktifse `cspPanel.draw()` çağırıp dön.
5. `src/eps/main.js` içinde CSS'i import et. Mevcut Space hedef seçicisine CSP dalını ekle; demo klavye dinleyicisini ayrıca kurma:

```js
import './csp/csp.css';
// spaceTarget() içinde:
if (view === 'csp') return panel.csp.element.querySelector('[data-csp-play]');
```

6. Mevcut panel birim testindeki sekme sayısını yeni davranış için güncelle; `#/csp` doğrudan açılış, dil değişimi, diğer görünüm animasyonlarının durması, boyut değişimi ve çevrimdışı paket erişimini gerçek EPS üzerinde doğrula. Bu pakette standalone kod doğrulanmıştır; bu altı entegrasyon değişikliği mevcut projeye uygulanmadığı için entegre EPS testi geçti iddiası yoktur.
7. Sonraki 3D bağdaştırıcıda `entry`, `angle`, `depth` durumunu mevcut `pacemaker-leads.js` geometrisine aktar. Geometrik konum elektriksel yakalanma etiketi üretmemeli; sinyaller ve doku durumu bu ortak modelden gelmeli. Mevcut atlasın septum kalınlığı ve koordinat dönüşümü ayrı doğrulama gerektirir; bu dosya bu doğrulamayı yapmış sayılmaz.

## Doğrulama kaydı

Çalışma ortamı: macOS, Node v22.14.0; mevcut projenin Vite 8.3.0'ı ve kurulu Playwright/Chrome. Yeni bağımlılık veya lockfile değişikliği yok.

- `node --check`: tüm `.mjs` ve `.cjs` kaynakları geçiyor.
- `node test-csp.mjs`: **14 model testi geçti**. Normalizasyon, tekrar üretilebilirlik, ayrı eşikler, pulse width, geometri, ERP, anodal katkı, örtüşen eşikler, septal sınır aşımı, her örnekte Einthoven, dalgadan süreleri yeniden türetme, nedensel filtre ve morfoloji kanıtı kapsanıyor.
- `node test-browser.cjs`: **PASS**, sayfa hatası yok. Eşik/S2 satırlarının gerçek kaydı değiştirmesi, referans koruma, ölçüm/yanıt temizliği, kör görünüm, TR/EN, depolama/reload/hata, perforasyon, gizli animasyon ve 390 px yerleşim doğrulandı.
- Vite üretim derlemesi: **PASS**. Standalone kaynaklar derlenir; mevcut Cardia uygulamasının derlemesi bu görev kapsamında değiştirilmemiştir.
- Ayrı JavaScript ve genel kod incelemesinde bulunan referans/cevap temizleme sorunları düzeltildi, regresyonlara eklendi. Bu yazılım incelemesi bağımsız klinik doğrulama değildir.
- Son paket kontrolü: Markdown içinden 9 kaynak çıkarıldı; SHA-256 değerleri kaynaklarla birebir eşleşti. Çıkarılan kodun syntax kontrolleri, 14 model testi ve Vite üretim derlemesi geçti. Derlenmiş sürümde aynı gerçek tarayıcı regresyonu da PASS, sayfa hatası yok.

## Kaynak kod

### `csp-model.mjs`

<!-- file: csp-model.mjs -->
```javascript
/** Original educational signal model. All parameters and waveforms are synthetic.
 * Capture fields are simulation ground truth, never a patient diagnosis.
 * No device, proprietary simulator, or validated clinical classifier is reproduced.
 */
export const CASES = Object.freeze([
  { id: 'baseline', name: { tr: 'Ayrı eşikler', en: 'Separate thresholds' }, description: { tr: 'Aynı konumda output azaltılır; iki dokunun ayrı eşikleri karşılaştırılır.', en: 'Reduce output at one position and compare independent tissue thresholds.' } },
  { id: 'slow', name: { tr: 'Yavaş ileti ve refrakterlik', en: 'Slow conduction and refractoriness' }, description: { tr: 'İleti gecikmesi ve farklı ERP değerleri programlı uyarımla karşılaştırılır.', en: 'Compare conduction delay and different ERPs using programmed stimulation.' } },
  { id: 'equal', name: { tr: 'Çakışan eşikler', en: 'Coincident thresholds' }, description: { tr: 'Output testi belirgin bir morfoloji geçişi göstermeyebilir.', en: 'An output test may not reveal a distinct morphology transition.' } },
  { id: 'scar', name: { tr: 'Heterojen septum', en: 'Heterogeneous septum' }, description: { tr: 'Yüksek miyokard eşiği ve erişilemeyen ileti dokusu birlikte modellenir.', en: 'A raised myocardial threshold coexists with unavailable conduction tissue.' } },
]);
export const DEFAULTS = Object.freeze({ caseId: 'baseline', entry: .5, angle: 8, depth: .88, output: 2, pulseWidth: .4, polarity: 'uni', rate: 70, pacing: true, s2: null });
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
function number(value, fallback, lo, hi) {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isFinite(n) ? clamp(n, lo, hi) : fallback;
}
export function normalize(options = {}) {
  const o = options && typeof options === 'object' ? options : {};
  const s2Value = o.s2 === undefined ? o.couplingMs : o.s2;
  return {
    caseId: CASES.some(c => c.id === o.caseId) ? o.caseId : DEFAULTS.caseId,
    entry: number(o.entry, DEFAULTS.entry, 0, 1), angle: number(o.angle, DEFAULTS.angle, 0, 90),
    depth: number(o.depth, DEFAULTS.depth, 0, 1.2), output: number(o.output, DEFAULTS.output, 0, 8),
    pulseWidth: number(o.pulseWidth, DEFAULTS.pulseWidth, .2, 1),
    polarity: o.polarity === 'bi' ? 'bi' : 'uni', rate: number(o.rate, DEFAULTS.rate, 40, 140),
    pacing: typeof o.pacing === 'boolean' ? o.pacing : DEFAULTS.pacing,
    s2: s2Value == null || s2Value === '' ? null : number(s2Value, null, 180, 450),
  };
}
function tissue(s) {
  const contact = Math.max(.12, Math.cos(s.angle * Math.PI / 180)) * (1 - .6 * Math.abs(s.entry - .5));
  const conductionAccess = s.depth >= .82 && s.depth < .98 && Math.abs(s.entry - .5) <= .21 && s.angle <= 32 && s.caseId !== 'scar';
  const scarMultiplier = s.caseId === 'scar' ? 2.4 : 1;
  const muscleThreshold = .65 * (1 + .18 / s.pulseWidth) * scarMultiplier / contact;
  const conductionThreshold = conductionAccess
    ? (s.caseId === 'equal' ? muscleThreshold : .32 * (1 + .22 / s.pulseWidth) * (s.caseId === 'slow' ? 1.15 : 1) / contact) : null;
  return { contact, muscleThreshold, conductionThreshold, muscleERP: s.caseId === 'scar' ? 265 : 235, conductionERP: s.caseId === 'slow' ? 340 : 285 };
}
function captureAt(s, t) {
  const empty = { type: 'none', muscle: false, conduction: false, anodal: false };
  if (s.depth >= 1) return { ...empty, type: 'perforation' };
  if (!s.pacing) return { ...empty, type: 'off' };
  const interval = s.s2 ?? 60000 / s.rate;
  const muscle = s.output > 0 && s.output >= t.muscleThreshold && interval >= t.muscleERP;
  const conduction = s.output > 0 && t.conductionThreshold !== null && s.output >= t.conductionThreshold && interval >= t.conductionERP;
  const anodal = s.polarity === 'bi' && s.depth >= .76 && s.angle <= 40 && s.output >= 3.8 * (1 + .12 / s.pulseWidth) / t.contact && interval >= t.muscleERP;
  let type = 'none';
  if (muscle) type = s.depth < .35 ? 'rv' : s.depth < .78 ? 'deep' : 'lvsp';
  if (conduction) type = muscle ? 'nonselective' : 'selective';
  if (anodal) type = 'anodal';
  return { type, muscle, conduction, anodal };
}
// Compact smooth components with finite support make delineation reproducible.
function bump(t, center, halfWidth) {
  const d = Math.abs(t - center) / halfWidth;
  return d >= 1 ? 0 : .5 * (1 + Math.cos(Math.PI * d));
}
const PROJECTIONS = Object.freeze({
  I: [1, 0, 0], II: [.5, Math.sqrt(3) / 2, 0], III: [-.5, Math.sqrt(3) / 2, 0],
  aVR: [-.75, -Math.sqrt(3) / 4, 0], aVL: [.75, -Math.sqrt(3) / 4, 0], aVF: [0, Math.sqrt(3) / 2, 0],
  V1: [-.3, 0, 1], V2: [-.2, .05, .92], V3: [.2, .08, .65], V4: [.65, .1, .3], V5: [.92, .1, -.05], V6: [1, .08, -.16],
});
function parameters(s, c) {
  const hasBeat = c.type === 'off' || c.muscle || c.conduction || c.anodal;
  const slow = s.caseId === 'slow' ? 24 : 0;
  let onset = 8, width = 145, xPeak = 88, zPeak = 112;
  if (c.type === 'off') { onset = 0; width = 105 + slow; xPeak = 48 + slow; zPeak = 32 + slow; }
  else if (c.conduction) { onset = c.muscle ? 5 : 22; width = (c.muscle ? 111 : 96) + slow; xPeak = 67 + slow; zPeak = 96 + slow; }
  else if (s.depth >= .78) { width = 128 + slow; xPeak = 83 + slow; zPeak = 106 + slow; }
  else if (s.depth >= .35) { width = 144 + slow; xPeak = 95 + slow; zPeak = 116 + slow; }
  if (s.caseId === 'scar') { width += 28; xPeak += 15; zPeak += 12; }
  if (c.anodal) { width -= 9; xPeak -= 7; zPeak -= 17; }
  return { hasBeat, reference: c.type === 'off' ? 80 : 50, onset, width, xPeak, zPeak };
}
function causalBandpass(values, hp = 30, lp = 250) {
  const highAlpha = 1 / (1 + 2 * Math.PI * hp / 1000);
  const lowAlpha = 1 - Math.exp(-2 * Math.PI * lp / 1000);
  let previous = values[0], high = 0, low = 0;
  return values.map(value => { high = highAlpha * (high + value - previous); previous = value; low += lowAlpha * (high - low); return low; });
}
function positivePeak(values, start, end) {
  let index = null, amplitude = 0;
  for (let i = Math.max(0, start); i <= Math.min(values.length - 1, end); i++) if (values[i] > amplitude) { amplitude = values[i]; index = i; }
  return index;
}
function measure(leads, p, s) {
  if (!p.hasBeat) return { v6Rwpt: null, v1Rwpt: null, interpeak: null, qrsDuration: null };
  const start = Math.ceil(p.reference + p.onset), end = Math.min(500, Math.ceil(start + p.width));
  // Envelope uses independent projections of same vector, with stimulus excluded.
  const envelope = leads.I.map((x, i) => Math.hypot(x, (leads.II[i] - .5 * x) * 2 / Math.sqrt(3), leads.V1[i] + .3 * x));
  const maximum = Math.max(...envelope.slice(start, end + 1));
  const active = [];
  for (let i = start; i <= end; i++) if (envelope[i] >= maximum * .03 && maximum > 0) active.push(i);
  const v6 = positivePeak(leads.V6, start, end), v1 = positivePeak(leads.V1, start, end);
  return { v6Rwpt: s.pacing && v6 !== null ? v6 - p.reference : null,
    v1Rwpt: s.pacing && v1 !== null ? v1 - p.reference : null,
    interpeak: v1 !== null && v6 !== null ? v1 - v6 : null,
    qrsDuration: active.length ? active.at(-1) - active[0] : null };
}
export function simulate(options = {}) {
  const state = normalize(options), t = tissue(state), capture = captureAt(state, t), p = parameters(state, capture);
  const times = Array.from({ length: 501 }, (_, i) => i);
  const leads = Object.fromEntries(Object.keys(PROJECTIONS).map(key => [key, []]));
  const unfiltered = [];
  const coi = state.depth >= 1 ? 0 : Math.max(0, 1 - Math.abs(state.depth - .85) / .85) * t.contact * 1.6;
  for (const time of times) {
    const r = time - p.reference;
    const start = p.onset, end = p.onset + p.width;
    const window = r > start && r < end ? Math.sin(Math.PI * (r - start) / p.width) ** .4 : 0;
    const x = p.hasBeat ? window * (-.22 * bump(r, start + 14, 14) + 1.35 * bump(r, p.xPeak, 33) - .27 * bump(r, end - 11, 15)) : 0;
    const y = p.hasBeat ? window * (.62 * bump(r, p.xPeak - 6, 40) - .18 * bump(r, end - 14, 19)) : 0;
    const z = p.hasBeat ? window * (-.62 * bump(r, start + 35, 28) + (capture.type === 'rv' ? -.5 : .85) * bump(r, p.zPeak, 25)) : 0;
    // Stimulus itself is a common vector projected exactly as QRS is.
    const stimulus = state.pacing ? .08 * state.output * bump(time, 50, 1.3) : 0;
    for (const [key, v] of Object.entries(PROJECTIONS)) leads[key].push(v[0] * (x + stimulus) + v[1] * y + v[2] * stimulus + v[2] * z);
    const local = p.hasBeat ? -.9 * bump(r, p.onset + 17, 4) + .35 * bump(r, p.onset + 22, 5) : 0;
    const injury = time >= 50 ? coi * Math.exp(-(time - 50) / 135) : 0;
    unfiltered.push(local + injury + .04 * Math.sin(time * Math.PI / 170) + (state.pacing ? .14 * state.output * bump(time, 50, 1.3) : 0));
  }
  const impedance = state.depth >= 1 ? 260 : Math.round(690 - 145 * state.depth + 45 * (1 - t.contact));
  return { state, capture, times, leads, egm: { unfiltered, filtered: causalBandpass(unfiltered) },
    metrics: { ...measure(leads, p, state), impedance, coi, muscleThreshold: t.muscleThreshold, conductionThreshold: t.conductionThreshold },
    truth: { muscleERP: t.muscleERP, conductionERP: t.conductionERP, contact: t.contact, synthetic: true },
    explanation: { synthetic: true, warning: state.depth >= 1 ? 'perforation' : null, note: 'Illustrative activation templates and parameters; no validated physiological, anatomical, device or diagnostic model. S2 traces show the test beat only; S1 train is implicit.' } };
}
export function thresholdSweep(options = {}) {
  const state = normalize(options);
  return Array.from({ length: 33 }, (_, i) => { const output = 8 - i * .25; const r = simulate({ ...state, output, pacing: true, s2: null }); return { output, capture: r.capture, metrics: r.metrics, signature: waveformSignature(r) }; });
}
export function programmedSweep(options = {}) {
  const state = normalize(options);
  return Array.from({ length: 28 }, (_, i) => { const s2 = 450 - i * 10; const r = simulate({ ...state, s2, pacing: true }); return { s2, capture: r.capture, metrics: r.metrics, signature: waveformSignature(r) }; });
}
function waveformSignature(r) {
  // Compare sampled morphology after stimulus; output-dependent artifact excluded.
  return ['I', 'V1', 'V6'].flatMap(key => r.leads[key].slice(55, 251));
}
export function evidence(rows = []) {
  const transitions = [];
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i];
    if (!Array.isArray(a.signature) || !Array.isArray(b.signature) || a.signature.length !== b.signature.length) continue;
    const rmsDifference = Math.sqrt(a.signature.reduce((sum, x, j) => sum + (x - b.signature[j]) ** 2, 0) / a.signature.length);
    if (rmsDifference > .015) transitions.push({ from: a.output ?? a.s2, to: b.output ?? b.s2, rmsDifference, lossOfSignal: b.metrics?.qrsDuration == null });
  }
  return { transitions, hasTransition: transitions.some(t => !t.lossOfSignal), diagnostic: false,
    message: transitions.some(t => !t.lossOfSignal) ? 'Observed synthetic waveform transition; compare tracings and independent evidence.' : 'No distinct waveform transition observed; this alone does not establish or exclude conduction-system capture.' };
}
```

### `csp-text.mjs`

<!-- file: csp-text.mjs -->
```javascript
export const TEXT = {
  tr: {
    title:'CSP / LBBAP Laboratuvarı', intro:'Konumu değiştir, dokuyu uyar, kayıttan kanıt topla.',
    limit:'Özgün, sentetik öğretim modeli. Şematik anatomi ve dalgalar klinik implant planlaması veya yakalanma tanısı için doğrulanmış değildir.',
    first:'İlk deney: eşik testini çalıştır. Bir satırı seç, atımları karşılaştır ve yakalanmayı sınıflandır.',
    implant:'İmplant', analysis:'Analiz', quiz:'Kör değerlendirme', history:'Olgu günlüğü',
    modes:['Hedef','Pace map','İlerle','Kanıtla','Değerlendir'],
    case:'Öğretim olgusu', instructor:'Eğitmen görünümü', blind:'Kör görünüm',
    projections:{rao:'RAO şeması',lao:'LAO şeması',septum:'Septum kesiti'},
    labels:{entry:'Giriş konumu (0–1)',angle:'Septal normale açı farkı (°)',depth:'Septum kalınlığına göre derinlik',output:'Çıkış (V)',pulseWidth:'Pulse width (ms)',polarity:'Polarite',rate:'Örtük S1 sürüş hızı (bpm)'},
    uni:'Unipolar',bi:'Bipolar',on:'Pacing açık',off:'Pacing kapalı',advance:'İlerle',back:'Geri çek',newSite:'Yeni hedef',reset:'Başlangıca dön',
    play:'İmleci oynat',freeze:'Dondur',caliper:'Kaliper',mark:'İşaret koy',clear:'İşaretleri sil',cursor:'Zaman (ms)',zoom:'Büyütme',scale:'mV / satır',
    threshold:'Eşik testi',programmed:'S1–S2 taraması',clearTest:'Testi temizle',capture:'Modelde yakalanan doku',
    types:{off:'Pacing kapalı',none:'Yakalanma yok',rv:'RV miyokardı',deep:'Derin septal miyokard',lvsp:'LV septal miyokard',selective:'Selektif ileti dokusu',nonselective:'İleti dokusu + miyokard',anodal:'Anodal katkı',perforation:'Septal sınır aşımı',insufficient:'Kanıt yetersiz'},
    metrics:{v6Rwpt:'Stim–V6RWPT',v1Rwpt:'Stim–V1RWPT',interpeak:'V1RWPT − V6RWPT',qrsDuration:'QRS süresi',impedance:'Sentetik empedans',coi:'Sentetik COI'},
    anatomy:'İnterventriküler septum · ölçekli hasta anatomisi değildir',
    signal:'Tek kalp vektöründen 12 derivasyon + uç EGM',overlay:'Referans atım gri; seçili atım renkli. Aynı ms/mV ölçeği.',
    filtered:'Uç EGM · filtreli',unfiltered:'Uç EGM · geniş bant',
    warning:'Lead septal sınırı aştı; modelde yakalanma yok. Yeni hedefle sıfırla.',
    unavailable:'∅: bu atımda ölçülebilir sonuç yok.',assess:'Mevcut kaydı nasıl sınıflandırırsın?',
    quizNote:'Kör görünümde olgu adı, derinlik ve modelin doku etiketi gizlenir. Kanıt oluşmadan “kanıt yetersiz” seçeneğini kullan.',
    correct:'Bu eğitim kuralına göre doğru.',incorrect:'Kayıtları yeniden karşılaştır.',
    evidence:'Gerekçe: bu prototip, geçiş gösteren bir test olmadan ileti dokusu yakalanmasını kesinleştirmez. Model doğrusu klinik doğrulama değildir.',
    save:'Olgu özeti kaydet',empty:'Henüz kayıt yok.',saved:'Bu tarayıcıya kaydedildi.',saveFailed:'Kalıcı kayıt yapılamadı; oturum belleğinde tutuluyor.',
    logNote:'Yalnız bu tarayıcıda tutulur. Hasta bilgisi girilmez; başarı oranı klinik yetkinlik ölçümü değildir.',
    noTest:'Henüz test yapılmadı.',rows:'Test sonuçları · satır seçerek atımı incele',
    testHeaders:['Uyarı','QRS','V6RWPT','Model etiketi'],
    summary:'Grafik tek test atımını gösterir; S1 treni örtüktür, hız kontrolü tekrar eden EKG üretmez. Büyütmede zaman imleci pencereyi merkezler. Ayar değişince eski test, yanıt ve kaliper temizlenir. Derinlik ilerlemesi açı/örnek dokuya bağlı öğretim yaklaşımıdır; tur–mm ilişkisi değildir.',
    source:'Birincil bilimsel çerçeve: EHRA 2023 / ESC 2025. Sayısal değerler bu kodun öğretim parametreleridir.',
    reveal:'Model doğrusunu gör',reference:'Referans atımı sabitle'
  },
  en: {
    title:'CSP / LBBAP Laboratory',intro:'Change position, stimulate tissue, collect evidence from the recording.',
    limit:'Original synthetic teaching model. Schematic anatomy and waveforms are not validated for clinical implantation planning or capture diagnosis.',
    first:'First experiment: run a threshold test. Select a row, compare beats and classify capture.',
    implant:'Implant',analysis:'Analysis',quiz:'Blind assessment',history:'Case log',
    modes:['Target','Pace map','Advance','Test','Assess'],case:'Teaching case',instructor:'Instructor view',blind:'Blind view',
    projections:{rao:'RAO schematic',lao:'LAO schematic',septum:'Septal section'},
    labels:{entry:'Entry position (0–1)',angle:'Angle error from septal normal (°)',depth:'Depth relative to septal thickness',output:'Output (V)',pulseWidth:'Pulse width (ms)',polarity:'Polarity',rate:'Implicit S1 drive rate (bpm)'},
    uni:'Unipolar',bi:'Bipolar',on:'Pacing on',off:'Pacing off',advance:'Advance',back:'Retract',newSite:'New target',reset:'Reset',
    play:'Play cursor',freeze:'Freeze',caliper:'Caliper',mark:'Place mark',clear:'Clear marks',cursor:'Time (ms)',zoom:'Zoom',scale:'mV / row',
    threshold:'Threshold test',programmed:'S1–S2 sweep',clearTest:'Clear test',capture:'Tissue captured in model',
    types:{off:'Pacing off',none:'No capture',rv:'RV myocardium',deep:'Deep septal myocardium',lvsp:'LV septal myocardium',selective:'Selective conduction tissue',nonselective:'Conduction tissue + myocardium',anodal:'Anodal contribution',perforation:'Septal boundary exceeded',insufficient:'Insufficient evidence'},
    metrics:{v6Rwpt:'Stim–V6RWPT',v1Rwpt:'Stim–V1RWPT',interpeak:'V1RWPT − V6RWPT',qrsDuration:'QRS duration',impedance:'Synthetic impedance',coi:'Synthetic COI'},
    anatomy:'Interventricular septum · not scaled patient anatomy',signal:'One cardiac vector, twelve leads + tip EGM',
    overlay:'Reference beat in gray; selected beat in color. Same ms/mV scale.',filtered:'Tip EGM · filtered',unfiltered:'Tip EGM · wide band',
    warning:'Lead crossed the septal boundary; no capture in this model. Reset to a new target.',
    unavailable:'∅: no measurable result in this beat.',assess:'How would you classify this recording?',
    quizNote:'Blind view hides case name, depth and model tissue labels. Use “insufficient evidence” before a transition-producing test.',
    correct:'Correct under this teaching rule.',incorrect:'Compare the recordings again.',
    evidence:'Reason: this prototype does not establish conduction-tissue capture without a transition-producing test. Model ground truth is not clinical validation.',
    save:'Save case summary',empty:'No saved cases yet.',saved:'Saved in this browser.',saveFailed:'Persistent storage unavailable; kept in session memory.',
    logNote:'Stored only in this browser. Enter no patient information; scores do not measure clinical competence.',
    noTest:'No test yet.',rows:'Test results · select a row to inspect the beat',testHeaders:['Stimulus','QRS','V6RWPT','Model label'],
    summary:'The plot shows one test beat; S1 is implicit and the rate control does not generate a repeating ECG. When zoomed, the time cursor centers the window. Changing settings clears old tests, answers and calipers. Advancement depends on angle/synthetic tissue; it is not a turns-to-mm relation.',
    source:'Primary scientific framework: EHRA 2023 / ESC 2025. Numerical values are this code’s teaching parameters.',
    reveal:'Reveal model ground truth',reference:'Pin reference beat'
  }
};
```

### `csp-panel.mjs`

<!-- file: csp-panel.mjs -->
```javascript
import { CASES, DEFAULTS, normalize, simulate, thresholdSweep, programmedSweep, evidence } from './csp-model.mjs';
import { TEXT } from './csp-text.mjs';
const LEADS = ['I','II','III','aVR','aVL','aVF','V1','V2','V3','V4','V5','V6'];
const TYPE_IDS = ['insufficient','selective','nonselective','lvsp','deep','rv','anodal','none','perforation','off'];
const VALUE = (x, digits = 1) => Number.isFinite(x) ? x.toFixed(digits) : '∅';
const HISTORY_KEY = 'cardia.csp.prototype.history.v1';

export function createCspPanel(doc, { getLang = () => 'tr', storage = null } = {}) {
  let state = { ...DEFAULTS }, result = simulate(state), rows = [], reference = null;
  const ui = { active:false, page:'implant', projection:'septum', instructor:true, blind:false, playing:false, cursor:50, caliper:false, marks:[], zoom:1, scale:4, selected:-1, testKind:null, answer:null, revealed:false };
  let frame = null, lastTime = null, plotted = null, history = [], storageStatus = '';
  const lang = () => getLang() === 'en' ? 'en' : 'tr';
  const t = () => TEXT[lang()];
  try { storage ||= doc.defaultView?.localStorage; } catch { storage = null; }
  try {
    const parsed = JSON.parse(storage?.getItem(HISTORY_KEY) || '[]');
    history = Array.isArray(parsed) ? parsed.filter(x => x && typeof x.date === 'string' && CASES.some(c=>c.id===x.caseId) && TYPE_IDS.includes(x.capture)).slice(-50) : [];
  } catch { history = []; }
  const el = (tag, cls='', attrs={}) => {
    const n = doc.createElement(tag); n.className = cls;
    for (const [k,v] of Object.entries(attrs)) n.setAttribute(k,String(v));
    return n;
  };
  const bindings = [];
  const txt = (n, get) => { bindings.push([n,get]); return n; };
  const button = (get, fn, attr={}) => { const n=txt(el('button','',{type:'button',...attr}),get); n.addEventListener('click',fn); return n; };
  const root = el('section','csp-lab',{'data-csp':''}); root.hidden=true;
  const heading = el('header','csp-heading');
  const words = el('div'); words.append(txt(el('h2'),()=>t().title),txt(el('p'),()=>t().intro));
  const nav = el('nav','csp-actions');
  const pages = ['implant','analysis','quiz','history'];
  const pageButtons = pages.map(page=>{ const b=button(()=>t()[page],()=>{ui.page=page; if(page==='quiz'){ui.blind=true;ui.instructor=false;ui.projection='rao';ui.revealed=false;ui.answer=null;} render();},{'data-csp-page':page}); nav.append(b); return b; });
  heading.append(words,nav);
  const limits = txt(el('p','csp-note'),()=>t().limit);
  const first = txt(el('p','csp-intro'),()=>t().first);
  const phases = el('ol','csp-phases');
  const phaseNodes = Array.from({length:5},(_,i)=>{const n=txt(el('li'),()=>`${i+1}. ${t().modes[i]}`);phases.append(n);return n;});
  const grid=el('div','csp-grid');
  const anatomyBox=el('section','csp-anatomy');
  const projections=el('div','csp-actions');
  const projectionButtons=Object.keys(t().projections).map(id=>{const b=button(()=>t().projections[id],()=>{ui.projection=id;render();},{'data-csp-projection':id});projections.append(b);return b;});
  const anatomy=el('canvas','csp-anatomy-canvas',{role:'img','data-csp-anatomy':''});
  const anatomyNote=txt(el('p','csp-note'),()=>t().anatomy);
  const groundTruth=el('p','csp-truth',{'data-csp-truth':''});
  anatomyBox.append(projections,anatomy,anatomyNote,groundTruth);
  const monitor=el('section','csp-monitor');
  const toolbar=el('div','csp-actions');
  const play=button(()=>ui.playing?t().freeze:t().play,()=>{ui.playing=!ui.playing;render();},{'data-csp-play':''});
  const caliper=button(()=>t().caliper,()=>{ui.caliper=!ui.caliper;render();},{'data-csp-caliper':''});
  const mark=button(()=>t().mark,()=>addMark(ui.cursor),{'data-csp-mark':''});
  toolbar.append(play,caliper,mark,button(()=>t().clear,()=>{ui.marks=[];render();}),button(()=>t().reference,()=>{reference=result;render();},{'data-csp-reference':''}));
  const zoom=el('select','',{'data-csp-view':'zoom'}), scale=el('select','',{'data-csp-view':'scale'});
  for (const [select,values,key] of [[zoom,[1,2,4],'zoom'],[scale,[2,4,8],'scale']]) {
    const field=el('label');field.append(txt(el('span'),()=>t()[key]));
    for(const value of values){const o=el('option','',{value});o.textContent=String(value);select.append(o);}
    select.addEventListener('change',()=>{ui[key]=Number(select.value);render();});field.append(select);toolbar.append(field);
  }
  const strip=el('canvas','csp-strip',{role:'img','data-csp-strip':''});
  strip.addEventListener('click',event=>{
    if(!plotted)return;const px=event.clientX-strip.getBoundingClientRect().left;
    if(px<plotted.left||px>plotted.right)return;
    ui.cursor=plotted.from+(px-plotted.left)/(plotted.right-plotted.left)*(plotted.to-plotted.from);
    ui.playing=false;if(ui.caliper)addMark(ui.cursor);else render();
  });
  const timeline=el('label','csp-timeline');
  const time=el('input','',{type:'range',min:0,max:500,step:1,'data-csp-time':''});
  const clock=el('output'); time.addEventListener('input',()=>{ui.cursor=Number(time.value);ui.playing=false;render();});
  timeline.append(txt(el('span'),()=>t().cursor),time,clock);
  const caliperText=el('p','csp-caliper-value',{'data-csp-caliper-value':'','aria-live':'polite'});
  const overlayNote=txt(el('p','csp-note'),()=>t().overlay);
  const measure=el('dl','csp-metrics',{'data-csp-metrics':''});
  const unavailable=txt(el('p','csp-note'),()=>t().unavailable);
  monitor.append(txt(el('h3'),()=>t().signal),toolbar,strip,timeline,caliperText,overlayNote,measure,unavailable);
  const consoleBox=el('aside','csp-console');
  const caseField=el('label');const caseSelect=el('select','',{'data-csp-control':'caseId'});
  for(const c of CASES){const o=txt(el('option','',{value:c.id}),()=>c.name[lang()]);caseSelect.append(o);}
  caseField.append(txt(el('span'),()=>t().case),caseSelect);
  caseSelect.addEventListener('change',()=>{state={...DEFAULTS,caseId:caseSelect.value};reference=null;change();});
  const controlNodes={};
  const controls=el('div','csp-controls');
  const definitions={entry:[0,1,.01],angle:[0,85,1],depth:[0,1.15,.01],output:[0,8,.05],pulseWidth:[.2,1,.1],rate:[40,140,1],polarity:['uni','bi']};
  for(const [key,values] of Object.entries(definitions)){
    const label=el('label'),output=el('output');
    const range=key!=='polarity'; const input=el(range?'input':'select','',{'data-csp-control':key});
    if(range){for(const [name,v] of [['type','range'],['min',values[0]],['max',values[1]],['step',values[2]]])input.setAttribute(name,v);}
    else for(const value of values){const o=txt(el('option','',{value}),()=>t()[value]);input.append(o);}
    input.addEventListener(range?'input':'change',()=>{state[key]=range?Number(input.value):input.value;change();});
    label.append(txt(el('span'),()=>t().labels[key]),input,output);controls.append(label);controlNodes[key]={label,input,output};
  }
  const toggles=el('div','csp-actions');
  const pace=button(()=>state.pacing?t().on:t().off,()=>{state.pacing=!state.pacing;change();},{'data-csp-pacing':''});
  const teacher=button(()=>t().instructor,()=>{ui.instructor=!ui.instructor;if(ui.instructor)ui.blind=false;render();},{'data-csp-instructor':''});
  const blind=button(()=>t().blind,()=>{ui.blind=!ui.blind;if(ui.blind){ui.instructor=false;ui.projection='rao';}ui.answer=null;ui.revealed=false;render();},{'data-csp-blind':''});
  toggles.append(pace,teacher,blind);
  const leadControls=el('div','csp-actions');
  leadControls.append(button(()=>t().advance,()=>{
    const factor=Math.cos(state.angle*Math.PI/180)**2*(state.caseId==='scar'?.5:1);
    state.depth=Math.min(1.15,state.depth+.035*factor);change();
  },{'data-csp-advance':''}),button(()=>t().back,()=>{state.depth=Math.max(0,state.depth-.04);change();}),button(()=>t().newSite,()=>{state.depth=0;state.entry=.5;reference=null;change();}));
  const tests=el('div','csp-actions');
  tests.append(button(()=>t().threshold,()=>runTest('threshold'),{'data-csp-test':'threshold'}),button(()=>t().programmed,()=>runTest('s2'),{'data-csp-test':'s2'}),button(()=>t().clearTest,()=>{rows=[];ui.testKind=null;state.s2=null;ui.selected=-1;ui.answer=null;ui.revealed=false;ui.marks=[];reference=null;recompute();}));
  const warning=el('p','csp-warning',{'data-csp-warning':''});
  consoleBox.append(caseField,toggles,controls,leadControls,tests,warning,txt(el('p','csp-note'),()=>t().summary),button(()=>t().reset,()=>{state={...DEFAULTS};rows=[];reference=null;Object.assign(ui,{page:'implant',projection:'septum',instructor:true,blind:false,playing:false,cursor:50,caliper:false,marks:[],zoom:1,scale:4,selected:-1,testKind:null,answer:null,revealed:false});recompute();},{'data-csp-reset':''}));
  grid.append(anatomyBox,monitor,consoleBox);
  const analysis=el('section','csp-analysis',{'data-csp-analysis':''});
  const tableWrap=el('div','csp-table-wrap'); const table=el('table'); const thead=el('thead');const headRow=el('tr');
  for(let i=0;i<4;i++)headRow.append(txt(el('th','',{scope:'col'}),()=>t().testHeaders[i]));
  thead.append(headRow);const tbody=el('tbody');table.append(thead,tbody);tableWrap.append(table);
  const noTest=txt(el('p'),()=>t().noTest);
  analysis.append(txt(el('h3'),()=>t().rows),noTest,tableWrap);
  const quiz=el('section','csp-quiz');
  const question=txt(el('h3'),()=>t().assess);const choices=el('div','csp-actions');const feedback=el('p','',{'aria-live':'polite','data-csp-feedback':''});
  const answers=TYPE_IDS.map(type=>{const b=button(()=>t().types[type],()=>{ui.answer=type;render();},{'data-csp-answer':type});choices.append(b);return b;});
  quiz.append(question,txt(el('p','csp-note'),()=>t().quizNote),choices,feedback,button(()=>t().reveal,()=>{ui.revealed=true;render();},{'data-csp-reveal':''}));
  const historyBox=el('section','csp-history');const historyList=el('ol');const storageNote=el('p','',{'aria-live':'polite'});
  historyBox.append(txt(el('h3'),()=>t().history),txt(el('p','csp-note'),()=>t().logNote),button(()=>t().save,save,{'data-csp-save':''}),storageNote,historyList);
  const footer=el('footer','csp-footer');
  footer.append(txt(el('p'),()=>t().source));
  for(const [url,label] of [['https://doi.org/10.1093/europace/euad043','EHRA 2023'],['https://doi.org/10.1093/europace/euaf050','ESC 2025']]){const a=el('a','',{href:url,target:'_blank',rel:'noopener noreferrer'});a.textContent=label;footer.append(a);}
  root.append(heading,limits,first,phases,grid,analysis,quiz,historyBox,footer);

  function change(){state.s2=null;rows=[];ui.testKind=null;ui.selected=-1;ui.answer=null;ui.revealed=false;ui.marks=[];recompute();}
  function recompute(){state=normalize(state);result=simulate(state);render();}
  function runTest(kind){
    ui.marks=[];ui.answer=null;ui.revealed=false;ui.testKind=kind;ui.selected=-1;ui.page='analysis';
    state=normalize({...state,pacing:true,s2:null});result=simulate(state);
    rows=kind==='threshold'?thresholdSweep({...state,s2:null}):programmedSweep({...state,s2:null});
    reference=result;render();
  }
  function addMark(ms){if(!ui.caliper)return;if(ui.marks.length===2)ui.marks=[];ui.marks.push(Math.round(ms));ui.playing=false;render();}
  function expected(){
    if(['none','off','perforation'].includes(result.capture.type))return result.capture.type;
    return rows.length&&evidence(rows).hasTransition?result.capture.type:'insufficient';
  }
  function save(){
    const item={date:new Date().toISOString(),caseId:state.caseId,capture:result.capture.type,answer:ui.answer,output:state.output,pulseWidth:state.pulseWidth,test:ui.testKind};
    history=[...history,item].slice(-50);
    try{if(!storage)throw new Error('unavailable');storage.setItem(HISTORY_KEY,JSON.stringify(history));storageStatus='saved';}catch{storageStatus='saveFailed';}
    render();
  }
  function renderTable(){
    noTest.hidden=rows.length>0;tableWrap.hidden=!rows.length;
    tbody.replaceChildren(...rows.map((row,i)=>{
      const tr=el('tr');const td=el('td');const b=el('button','',{type:'button','data-csp-row':i,'aria-pressed':ui.selected===i});
      b.textContent=ui.testKind==='s2'?`${row.s2} ms`:`${VALUE(row.output,2)} V`;
      b.addEventListener('click',()=>{
        ui.selected=i;ui.answer=null;ui.revealed=false;ui.marks=[];
        if(ui.testKind==='s2')state.s2=row.s2;else{state.output=row.output;state.s2=null;}
        state=normalize(state);result=simulate(state);render();
      });td.append(b);tr.append(td);
      for(const value of [VALUE(row.metrics.qrsDuration),VALUE(row.metrics.v6Rwpt),ui.blind?'?':t().types[row.capture.type]]){const cell=el('td');cell.textContent=value;tr.append(cell);}
      return tr;
    }));
  }
  function render(){
    for(const [n,get] of bindings)n.textContent=get();
    root.setAttribute('lang',lang());
    pageButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(pages[i]===ui.page)));
    caseSelect.value=state.caseId;caseField.hidden=ui.blind;
    for(const [key,{label,input,output}] of Object.entries(controlNodes)){input.value=String(state[key]);output.textContent=key==='polarity'?'':String(state[key]);label.hidden=key==='depth'&&ui.blind;}
    pace.setAttribute('aria-pressed',String(state.pacing));teacher.setAttribute('aria-pressed',String(ui.instructor));blind.setAttribute('aria-pressed',String(ui.blind));
    play.setAttribute('aria-pressed',String(ui.playing));caliper.setAttribute('aria-pressed',String(ui.caliper));mark.disabled=!ui.caliper;
    zoom.value=String(ui.zoom);scale.value=String(ui.scale);
    projectionButtons.forEach((b,i)=>{const id=Object.keys(t().projections)[i];b.hidden=id==='septum'&&ui.blind;b.setAttribute('aria-pressed',String(id===ui.projection));});
    const phase=state.depth<.05?0:state.depth<.25?1:state.depth<.8?2:rows.length?4:3;
    phaseNodes.forEach((n,i)=>n.setAttribute('aria-current',i===phase?'step':'false'));
    warning.textContent=result.capture.type==='perforation'?t().warning:'';
    groundTruth.hidden=(!ui.instructor||ui.blind)&&!ui.revealed;groundTruth.textContent=`${t().capture}: ${t().types[result.capture.type]}`;
    const metricKeys=['v6Rwpt','v1Rwpt','interpeak','qrsDuration',...(ui.blind?[]:['impedance','coi'])];
    measure.replaceChildren(...metricKeys.flatMap(key=>{const dt=el('dt');dt.textContent=t().metrics[key];const dd=el('dd','',{'data-csp-metric':key});dd.textContent=`${VALUE(result.metrics[key])} ${key==='impedance'?'Ω':key==='coi'?'mV':'ms'}`;return[dt,dd];}));
    analysis.hidden=ui.page==='history';quiz.hidden=!['quiz','analysis'].includes(ui.page);historyBox.hidden=ui.page!=='history';
    renderTable();
    const truth=expected();feedback.textContent=ui.answer?`${ui.answer===truth?t().correct:t().incorrect} ${t().evidence}${ui.revealed?` ${t().types[result.capture.type]}`:''}`:'';
    answers.forEach((b,i)=>b.setAttribute('aria-pressed',String(TYPE_IDS[i]===ui.answer)));
    storageNote.textContent=storageStatus?t()[storageStatus]:'';
    historyList.replaceChildren(...(history.length?history.map(item=>{const n=el('li');const c=CASES.find(c=>c.id===item.caseId);n.textContent=`${item.date} · ${c.name[lang()]} · ${t().types[item.capture]}`;return n;}):[txtOnce(t().empty)]));
    anatomy.setAttribute('aria-label',`${t().anatomy}; ${ui.blind?'?':state.depth}`);strip.setAttribute('aria-label',`${t().signal}; mV, ms`);
    draw();
    if(ui.active&&ui.playing&&frame===null){lastTime=null;frame=globalThis.requestAnimationFrame?.(tick)??null;}
    if(!ui.playing&&frame!==null){globalThis.cancelAnimationFrame?.(frame);frame=null;}
  }
  function txtOnce(value){const n=el('li');n.textContent=value;return n;}
  function context(canvas){
    const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return null;const ctx=canvas.getContext?.('2d');if(!ctx)return null;
    const dpr=Math.min(globalThis.devicePixelRatio||1,2);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#0a1411';ctx.fillRect(0,0,w,h);ctx.font='11px system-ui';return{ctx,w,h};
  }
  function drawAnatomy(){
    const c=context(anatomy);if(!c)return;const{ctx,w,h}=c;
    ctx.fillStyle='#b3c6bb';ctx.fillText(t().projections[ui.projection],12,20);
    const cx=w*.5,top=48,bottom=h-40;
    ctx.strokeStyle='#426255';ctx.lineWidth=3;
    if(ui.projection==='septum'&&!ui.blind){
      const left=w*.28,right=w*.7;ctx.fillStyle='#294338';ctx.fillRect(left,top,right-left,bottom-top);
      ctx.fillStyle='#d2dccb';ctx.fillText('RV',left-26,top+15);ctx.fillText('LV',right+10,top+15);
      const y=top+(bottom-top)*state.entry;
      const tip=left+(right-left)*state.depth;
      ctx.strokeStyle='#e5bd68';ctx.beginPath();ctx.moveTo(12,y-20);ctx.lineTo(left,y);ctx.lineTo(tip,y);ctx.stroke();
      ctx.fillStyle='#78dba9';ctx.fillRect(right-14,top,4,bottom-top);
      ctx.fillStyle='#e5bd68';ctx.beginPath();ctx.arc(tip,y,5,0,Math.PI*2);ctx.fill();
    }else{
      ctx.beginPath();ctx.ellipse(cx,h*.53,w*.33,h*.36,ui.projection==='lao'?.3:-.3,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(cx,top);ctx.lineTo(cx,bottom);ctx.stroke();ctx.setLineDash([]);
      const angle=state.angle*Math.PI/180;
      const y=top+(bottom-top)*state.entry,px=ui.projection==='lao'?cx-w*.15+state.depth*w*.26*Math.cos(angle):cx;
      ctx.strokeStyle='#e5bd68';ctx.beginPath();ctx.moveTo(w*.2,top);ctx.quadraticCurveTo(w*.12,y,px,y);ctx.stroke();
      ctx.fillStyle='#e5bd68';ctx.beginPath();ctx.arc(px,y,5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#b3c6bb';ctx.fillText('His / TV',cx+6,top+12);
    }
  }
  function drawStrip(){
    const c=context(strip);if(!c)return;const{ctx,w,h}=c;
    const left=70,right=w-10,top=22,bottom=h-24,from=Math.max(0,Math.min(500-500/ui.zoom,ui.cursor-250/ui.zoom)),to=from+500/ui.zoom;
    plotted={left,right,from,to};const x=ms=>left+(ms-from)/(to-from)*(right-left);
    for(let ms=Math.ceil(from/10)*10;ms<=to;ms+=10){ctx.strokeStyle=ms%50===0?'#294036':'#16281f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x(ms),top);ctx.lineTo(x(ms),bottom);ctx.stroke();if(ms%50===0&&ms<to-15){ctx.fillStyle='#839d8d';ctx.fillText(String(ms),x(ms)-5,h-7);}}
    ctx.fillStyle='#839d8d';ctx.fillText('ms',w-25,h-7);ctx.fillText('mV',8,14);
    const series=[...LEADS.map(id=>({id,data:result.leads[id],ref:reference?.leads[id]})),{id:'EGM F',data:result.egm.filtered,ref:reference?.egm.filtered},{id:'EGM U',data:result.egm.unfiltered,ref:reference?.egm.unfiltered}];
    const row=(bottom-top)/series.length;
    series.forEach(({id,data,ref},r)=>{
      const y=top+(r+.5)*row;ctx.fillStyle=['V1','V6'].includes(id)?'#f4cb75':'#b9cec0';ctx.fillText(id,8,y+3);
      ctx.save();ctx.beginPath();ctx.rect(left,top+r*row,right-left,row);ctx.clip();
      for(const [values,color] of [[ref,'#637169'],[data,['V1','V6'].includes(id)?'#f4cb75':r>11?'#65c9bb':'#c5d8ca']]){
        if(!values)continue;ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();
        for(let i=Math.max(0,Math.floor(from));i<result.times.length&&result.times[i]<=to;i++){const yy=y-values[i]*row/ui.scale;if(i===Math.floor(from))ctx.moveTo(x(result.times[i]),yy);else ctx.lineTo(x(result.times[i]),yy);}ctx.stroke();
      }ctx.restore();
    });
    for(const [ms,color] of [[ui.cursor,'#9cb6a4'],...ui.marks.map(ms=>[ms,'#e9be65'])]){if(ms<from||ms>to)continue;ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x(ms),top);ctx.lineTo(x(ms),bottom);ctx.stroke();}
  }
  function draw(){if(!ui.active)return;time.value=String(Math.round(ui.cursor));clock.textContent=`${Math.round(ui.cursor)} ms`;caliperText.textContent=ui.marks.length===2?`Δt = ${Math.abs(ui.marks[1]-ui.marks[0])} ms`:ui.marks.length?`t₁ = ${ui.marks[0]} ms`:'';drawAnatomy();drawStrip();}
  function tick(now){frame=null;if(!ui.active||!ui.playing)return;if(lastTime!==null)ui.cursor=(ui.cursor+Math.min(100,now-lastTime)*.1)%500;lastTime=now;draw();frame=globalThis.requestAnimationFrame?.(tick)??null;}
  return {
    element:root,render,draw,
    setActive(active){ui.active=Boolean(active);root.hidden=!ui.active;if(ui.active)render();else{if(frame!==null)globalThis.cancelAnimationFrame?.(frame);frame=null;lastTime=null;}},
    getState:()=>({...state,ui:{...ui,marks:[...ui.marks]}}),getResult:()=>result,getReference:()=>reference,getRows:()=>rows,
    getHistory:()=>history.map(x=>({...x}))
  };
}
```

### `csp.css`

<!-- file: csp.css -->
```css
.csp-lab { color:#dce9df; background:#0b1711; font:13px/1.5 system-ui,sans-serif; padding:16px; max-width:1800px; margin:auto; }
.csp-lab *, .csp-lab *::before, .csp-lab *::after { box-sizing:border-box; }
.csp-lab [hidden] { display:none!important; }
.csp-heading { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
.csp-lab h2 { margin:0; font-size:25px; }.csp-lab h3 { margin:6px 0; font-size:13px; }
.csp-heading p { margin:4px 0; }.csp-note { color:#9eb9a6; font-size:11px; }
.csp-intro { border-left:3px solid #76d7a5; padding:8px 12px; background:#14291d; }
.csp-lab button,.csp-lab select { color:inherit; font:inherit; background:#183222; border:1px solid #3d5d49; border-radius:5px; padding:6px 9px; min-height:34px; }
.csp-lab button { cursor:pointer; }.csp-lab button:hover { background:#274c35; }.csp-lab button[aria-pressed=true] { background:#306a49; border-color:#76d7a5; }
.csp-lab button:disabled { opacity:.4;cursor:default; }.csp-lab :focus-visible { outline:2px solid #9af2bc;outline-offset:2px; }
.csp-actions { display:flex; flex-wrap:wrap; gap:6px; align-items:end; }.csp-actions label { display:grid; font-size:10px; }
.csp-phases { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); list-style:none; padding:0; gap:5px; font-size:12px; }
.csp-phases li { padding:8px; background:#162b1e; }.csp-phases [aria-current=step] { color:#091b0e; background:#76d7a5; }
.csp-grid { display:grid; grid-template-columns:230px minmax(350px,1fr) 290px; gap:12px;align-items:start; }
.csp-grid>*,.csp-table-wrap { min-width:0; }.csp-anatomy,.csp-console { border:1px solid #2e4a37; border-radius:6px; padding:10px; background:#102318; }
.csp-console { display:grid; gap:12px; }.csp-console label { display:grid; gap:3px; font-size:11px; }
.csp-controls { display:grid; grid-template-columns:1fr 1fr;gap:10px; }.csp-lab input[type=range] { width:100%;accent-color:#76d7a5; min-height:24px; }
.csp-lab select { max-width:100%; }.csp-lab output { font-family:ui-monospace,monospace; }
.csp-anatomy-canvas { width:100%;height:360px;display:block;margin-top:10px; }.csp-strip { display:block;width:100%;height:760px;margin-top:10px;border:1px solid #2e4a37; }
.csp-timeline { display:grid;grid-template-columns:auto minmax(0,1fr) 60px;gap:8px;align-items:center;font-size:11px; }
.csp-metrics { display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 12px; margin:8px 0; font-size:11px; }.csp-metrics dd { margin:0;font-family:ui-monospace,monospace; }
.csp-truth { color:#9fe7b8; }.csp-warning,.csp-caliper-value { color:#f1c77c; }.csp-caliper-value { min-height:20px; }
.csp-analysis,.csp-quiz,.csp-history { margin-top:16px;border-top:1px solid #2e4a37;padding-top:10px; }
.csp-table-wrap { overflow:auto;max-height:250px; }.csp-lab table { width:100%;border-collapse:collapse; font-size:12px; }.csp-lab td,.csp-lab th { padding:5px 8px;border-bottom:1px solid #294532;text-align:left;white-space:nowrap; }
.csp-footer { color:#8eab97;font-size:11px;margin-top:18px; }.csp-lab a { color:#96dfb1;margin-right:15px; }.csp-history li { margin-bottom:8px;overflow-wrap:anywhere; }
@media(max-width:1100px){.csp-grid{grid-template-columns:180px minmax(300px,1fr)}.csp-console{grid-column:1/-1;grid-template-columns:1fr 1fr}.csp-anatomy-canvas{height:310px}}
@media(max-width:650px){.csp-lab{padding:10px}.csp-grid{grid-template-columns:minmax(0,1fr)}.csp-console{grid-column:auto;grid-template-columns:1fr;order:-1}.csp-anatomy-canvas{height:250px}.csp-anatomy{order:0}.csp-monitor{order:1}.csp-phases{font-size:10px}.csp-phases li{padding:5px 3px}.csp-strip{height:780px}.csp-timeline{grid-template-columns:1fr 60px}.csp-timeline>span{grid-column:1/-1}.csp-heading h2{font-size:22px}}
```

### `main.mjs`

<!-- file: main.mjs -->
```javascript
import { createCspPanel } from './csp-panel.mjs';
let language = 'tr';
const panel = createCspPanel(document,{getLang:()=>language});
document.querySelector('#app').append(panel.element);
panel.setActive(true);
for (const button of document.querySelectorAll('[data-language]')) {
  button.addEventListener('click',()=>setLanguage(button.dataset.language));
}
function setLanguage(next){
  language=next==='en'?'en':'tr';document.documentElement.lang=language;panel.render();
  for(const b of document.querySelectorAll('[data-language]'))b.setAttribute('aria-pressed',String(b.dataset.language===language));
}
window.addEventListener('resize',()=>panel.draw());
document.addEventListener('keydown',event=>{
  if(event.code!=='Space'||event.repeat||event.target.closest('input,select,textarea,button,a,[contenteditable]'))return;
  event.preventDefault();panel.element.querySelector('[data-csp-play]').click();
});
window.cspDemo={panel,setLanguage,createPanel:createCspPanel};
setLanguage(language);
```

### `index.html`

<!-- file: index.html -->
```html
<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CSP / LBBAP Kod Örneği</title>
<link rel="stylesheet" href="./csp.css">
<style>body{margin:0;background:#0b1711}#language{padding:10px 16px;color:#dce9df}#language button{padding:7px 14px;margin-right:5px;background:#234c31;color:inherit;border:1px solid #567a61;cursor:pointer}</style>
</head>
<body>
<nav id="language" aria-label="Language / Dil"><button type="button" data-language="tr">TR</button><button type="button" data-language="en">EN</button></nav>
<main id="app"></main>
<script type="module" src="./main.mjs"></script>
</body>
</html>
```

### `test-csp.mjs`

<!-- file: test-csp.mjs -->
```javascript
import assert from 'node:assert/strict';
import { CASES, DEFAULTS, normalize, simulate, thresholdSweep, programmedSweep, evidence } from './csp-model.mjs';

let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
const near = (a, b, tolerance = 1e-10) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
const mean = xs => xs.reduce((sum, x) => sum + x, 0) / xs.length;

test('normalization bounds malformed and nonfinite inputs without throwing', () => {
  assert.deepEqual(normalize(null), DEFAULTS);
  const s = normalize({ entry: Infinity, depth: 90, angle: -40, output: '7.5', pulseWidth: '', rate: NaN, s2: 'bad', caseId: '__proto__' });
  assert.equal(s.entry, DEFAULTS.entry); assert.equal(s.depth, 1.2); assert.equal(s.angle, 0);
  assert.equal(s.output, 7.5); assert.equal(s.pulseWidth, DEFAULTS.pulseWidth); assert.equal(s.rate, DEFAULTS.rate);
  assert.equal(s.s2, null); assert.equal(s.caseId, DEFAULTS.caseId);
  assert.equal(normalize({ couplingMs: 200 }).s2, 200);
  assert.equal(normalize({ s2: null, couplingMs: 200 }).s2, null);
});
test('all four examples produce deterministic finite sampled arrays', () => {
  assert.equal(CASES.length, 4);
  for (const { id } of CASES) {
    const a = simulate({ caseId: id });
    assert.deepEqual(a, simulate({ caseId: id }));
    assert.equal(a.times.length, 501); assert.equal(a.times[0], 0); assert.equal(a.times.at(-1), 500);
    assert.equal(Object.keys(a.leads).length, 12);
    for (const values of [...Object.values(a.leads), ...Object.values(a.egm)]) {
      assert.equal(values.length, 501); assert.ok(values.every(Number.isFinite));
    }
  }
});
test('independent thresholds allow reversible nonselective-selective-loss transitions', () => {
  const both = simulate(), cs = simulate({ output: .7 }), none = simulate({ output: .1 });
  assert.equal(both.capture.type, 'nonselective'); assert.equal(cs.capture.type, 'selective'); assert.equal(none.capture.type, 'none');
  assert.ok(cs.metrics.conductionThreshold < .7 && cs.metrics.muscleThreshold > .7);
  assert.equal(cs.capture.muscle, false); assert.equal(cs.capture.conduction, true);
  assert.deepEqual(simulate(), both);
});
test('strength-duration relation changes both capture thresholds at fixed geometry', () => {
  const short = simulate({ pulseWidth: .2, output: .6 }), long = simulate({ pulseWidth: 1, output: .6 });
  assert.ok(short.metrics.muscleThreshold > long.metrics.muscleThreshold);
  assert.ok(short.metrics.conductionThreshold > long.metrics.conductionThreshold);
  assert.equal(short.capture.type, 'none'); assert.equal(long.capture.type, 'selective');
});
test('geometry distinguishes RV, deep, LV septal and unavailable conduction', () => {
  assert.equal(simulate({ depth: .2 }).capture.type, 'rv');
  assert.equal(simulate({ depth: .6 }).capture.type, 'deep');
  assert.equal(simulate({ depth: .8 }).capture.type, 'lvsp');
  const misaligned = simulate({ angle: 60, output: 8 });
  assert.equal(misaligned.capture.conduction, false); assert.equal(misaligned.metrics.conductionThreshold, null);
  assert.equal(simulate({ entry: 0, output: 8 }).capture.conduction, false);
});
test('S2 refractoriness acts independently of voltage and tissue thresholds', () => {
  assert.equal(simulate({ s2: 300 }).capture.type, 'nonselective');
  assert.equal(simulate({ s2: 250 }).capture.type, 'lvsp');
  assert.equal(simulate({ s2: 200, output: 8 }).capture.type, 'none');
  assert.equal(simulate({ caseId: 'slow', s2: 300 }).capture.type, 'lvsp');
  assert.equal(simulate({ caseId: 'slow', s2: 350 }).capture.type, 'nonselective');
});
test('anodal capture requires bipolar high output and retains captured tissue flags', () => {
  const uni = simulate({ output: 6 }), bi = simulate({ output: 6, polarity: 'bi' });
  assert.equal(uni.capture.anodal, false); assert.equal(bi.capture.type, 'anodal');
  assert.equal(bi.capture.conduction, uni.capture.conduction); assert.equal(bi.capture.muscle, uni.capture.muscle);
  assert.notDeepEqual(bi.leads.V1.slice(55), uni.leads.V1.slice(55));
  assert.equal(simulate({ output: 6, polarity: 'bi', depth: .3 }).capture.anodal, false);
});
test('equal thresholds and scar do not manufacture selective capture', () => {
  assert.ok(thresholdSweep({ caseId: 'equal' }).every(row => row.capture.type !== 'selective'));
  assert.equal(evidence(thresholdSweep({ caseId: 'equal' })).hasTransition, false);
  const scar = simulate({ caseId: 'scar', output: 2 });
  assert.equal(scar.capture.type, 'none'); assert.equal(scar.metrics.conductionThreshold, null);
  assert.equal(simulate({ caseId: 'scar', output: 4 }).capture.type, 'lvsp');
});
test('perforation suppresses paced ventricular response at any output', () => {
  for (const depth of [1, 1.1, 1.2]) {
    const r = simulate({ depth, output: 8, polarity: 'bi' });
    assert.equal(r.capture.type, 'perforation'); assert.equal(r.capture.muscle, false); assert.equal(r.capture.conduction, false);
    assert.equal(r.metrics.qrsDuration, null); assert.equal(r.explanation.warning, 'perforation');
    assert.ok(r.leads.V6.slice(55).every(x => x === 0));
  }
});
test('limb lead algebra holds at every sample including stimulus', () => {
  for (const options of [{}, { depth: .2 }, { polarity: 'bi', output: 7 }, { pacing: false }]) {
    const { leads } = simulate(options);
    for (let i = 0; i < 501; i++) {
      near(leads.II[i], leads.I[i] + leads.III[i]);
      near(leads.aVR[i], -(leads.I[i] + leads.II[i]) / 2);
      near(leads.aVL[i], leads.I[i] - leads.II[i] / 2);
      near(leads.aVF[i], leads.II[i] - leads.I[i] / 2);
    }
  }
});
test('reported peak times and QRS duration reproduce from actual samples', () => {
  const r = simulate();
  const peak = values => values.indexOf(Math.max(...values.slice(55, 251)));
  assert.equal(r.metrics.v6Rwpt, peak(r.leads.V6) - 50);
  assert.equal(r.metrics.v1Rwpt, peak(r.leads.V1) - 50);
  assert.equal(r.metrics.interpeak, r.metrics.v1Rwpt - r.metrics.v6Rwpt);
  const env = r.leads.I.map((x, i) => Math.hypot(x, (r.leads.II[i] - .5 * x) * 2 / Math.sqrt(3), r.leads.V1[i] + .3 * x));
  const peakEnvelope = Math.max(...env.slice(55, 167));
  const active = env.map((v, i) => ({ v, i })).filter(({ v, i }) => i >= 55 && i <= 166 && v >= peakEnvelope * .03);
  assert.equal(r.metrics.qrsDuration, active.at(-1).i - active[0].i);
  const slow = simulate({ caseId: 'slow' }); assert.ok(slow.metrics.v6Rwpt > r.metrics.v6Rwpt);
});
test('causal EGM filter attenuates sustained injury component', () => {
  const r = simulate();
  assert.ok(Math.abs(mean(r.egm.filtered.slice(130, 200))) < Math.abs(mean(r.egm.unfiltered.slice(130, 200))) * .15);
  assert.notDeepEqual(r.egm.filtered, r.egm.unfiltered);
});
test('pacing off and noncapture have distinct signal behavior', () => {
  const intrinsic = simulate({ pacing: false });
  assert.equal(intrinsic.capture.type, 'off'); assert.equal(intrinsic.metrics.v6Rwpt, null);
  assert.ok(intrinsic.metrics.qrsDuration > 0); assert.ok(intrinsic.leads.V6.some(x => Math.abs(x) > .1));
  const noCapture = simulate({ output: 0 });
  assert.equal(noCapture.metrics.v6Rwpt, null); assert.ok(noCapture.leads.V6.every(x => x === 0));
});
test('evidence observes waveforms without trusting ground-truth capture labels', () => {
  const sweep = thresholdSweep(); const e = evidence(sweep);
  assert.ok(e.hasTransition); assert.equal(e.diagnostic, false);
  const masked = sweep.map(row => ({ ...row, capture: { type: 'rv' } }));
  assert.deepEqual(evidence(masked), e);
  assert.equal(evidence([]).hasTransition, false);
  const s2 = programmedSweep({ caseId: 'slow' });
  assert.equal(s2[0].s2, 450); assert.equal(s2.at(-1).s2, 180);
  assert.ok(evidence(s2).hasTransition);
});
console.log(`${passed} model tests passed`);
```

### `test-browser.cjs`

<!-- file: test-browser.cjs -->
```javascript
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const URL=process.env.CSP_URL || 'http://127.0.0.1:5194';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1050}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(URL);await page.locator('[data-csp]').waitFor({state:'visible'});
  const input=key=>page.locator(`[data-csp-control=${key}]`);
  const set=async(key,value)=>input(key).evaluate((n,v)=>{n.value=String(v);n.dispatchEvent(new Event('input',{bubbles:true}));},value);
  const state=()=>page.evaluate(()=>window.cspDemo.panel.getState());
  const capture=()=>page.evaluate(()=>window.cspDemo.panel.getResult().capture.type);
  assert.equal(await capture(),'nonselective');
  await page.locator('[data-csp-reference]').click();const ref=await page.evaluate(()=>window.cspDemo.panel.getReference().leads.V6);
  await set('output',.7);assert.equal(await capture(),'selective');assert.deepEqual(await page.evaluate(()=>window.cspDemo.panel.getReference().leads.V6),ref,'pinned reference survives settings');await set('output',.1);assert.equal(await capture(),'none');
  await set('output',2);await set('pulseWidth',.2);
  assert.equal((await state()).pulseWidth,.2);await set('pulseWidth',.4);
  await page.locator('[data-csp-pacing]').click();assert.equal(await capture(),'off');
  await page.locator('[data-csp-test=threshold]').click();assert.equal((await state()).pacing,true,'test explicitly enables pacing');
  assert.equal(await page.locator('[data-csp-row]').count(),33);
  await page.locator('[data-csp-row="29"]').click();assert.equal(await capture(),'selective','test row controls actual acquired beat');
  await page.locator('[data-csp-caliper]').click();await page.locator('[data-csp-time]').evaluate(n=>{n.value='50';n.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('[data-csp-mark]').click();await page.locator('[data-csp-time]').evaluate(n=>{n.value='120';n.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('[data-csp-mark]').click();
  assert.equal(await page.locator('[data-csp-caliper-value]').textContent(),'Δt = 70 ms');
  const before=await state();await page.locator('[data-language=en]').click();assert.deepEqual(await state(),before,'language preserves settings, test and measurements');
  assert.equal(await page.locator('[data-csp] h2').textContent(),'CSP / LBBAP Laboratory');
  await set('angle',20);assert.equal(await page.locator('[data-csp-row]').count(),0);assert.deepEqual((await state()).ui.marks,[]);
  await page.locator('[data-csp-reset]').click();await input('caseId').selectOption('slow');
  await page.locator('[data-csp-test=s2]').click();assert.equal(await page.locator('[data-csp-row]').count(),28);
  await page.locator('[data-csp-row="17"]').click();assert.equal((await state()).s2,280);assert.equal(await capture(),'lvsp');
  await page.locator('[data-csp-page=quiz]').click();assert.equal(await page.locator('[data-csp-truth]').isVisible(),false);assert.equal(await input('caseId').isVisible(),false);
  assert.equal((await state()).ui.projection,'rao');
  await page.locator('[data-csp-answer=lvsp]').click();assert.match(await page.locator('[data-csp-feedback]').textContent(),/Correct/);
  await page.locator('[data-csp-reveal]').click();assert.equal(await page.locator('[data-csp-truth]').isVisible(),true);
  await page.locator('[data-csp-page=implant]').click();await page.locator('[data-csp-page=quiz]').click();assert.equal(await page.locator('[data-csp-truth]').isVisible(),false,'blind re-entry hides revealed truth');
  await page.locator('[data-csp-reveal]').click();
  await page.getByRole('button',{name:'Clear test',exact:true}).click();assert.equal((await state()).ui.revealed,false);assert.equal((await state()).ui.answer,null);assert.deepEqual((await state()).ui.marks,[]);assert.equal((await state()).s2,null);assert.equal(await page.evaluate(()=>window.cspDemo.panel.getReference()),null);assert.equal(await page.locator('[data-csp-truth]').isVisible(),false,'cleared test retires reveal');
  await page.locator('[data-csp-page=history]').click();await page.locator('[data-csp-save]').click();assert.equal(await page.evaluate(()=>window.cspDemo.panel.getHistory().length),1);
  await page.reload();await page.locator('[data-csp]').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>window.cspDemo.panel.getHistory().length),1);
  await set('depth',1.1);assert.equal(await capture(),'perforation');assert.notEqual(await page.locator('[data-csp-warning]').textContent(),'');
  await page.locator('[data-csp-reset]').click();
  await page.locator('[data-csp-play]').click();const cursor=(await state()).ui.cursor;
  await page.waitForFunction(v=>window.cspDemo.panel.getState().ui.cursor!==v,cursor);
  await page.evaluate(()=>window.cspDemo.panel.setActive(false));const paused=(await state()).ui.cursor;
  await page.waitForTimeout(130);assert.equal((await state()).ui.cursor,paused,'hidden panel stops animation');await page.evaluate(()=>window.cspDemo.panel.setActive(true));await page.locator('[data-csp-play]').click();
  await page.screenshot({path:'/tmp/csp-code-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'mobile no horizontal overflow');
  await page.locator('[data-csp-strip]').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/csp-code-mobile.png',fullPage:true});
  await page.evaluate(async()=>{
   window.testStorage=window.cspDemo.createPanel(document,{getLang:()=> 'en',storage:{getItem(){throw new Error('blocked');},setItem(){throw new Error('quota');}}});
   document.body.append(window.testStorage.element);window.testStorage.setActive(true);
   window.testStorage.element.querySelector('[data-csp-page=history]').click();window.testStorage.element.querySelector('[data-csp-save]').click();
  });
  assert.equal(await page.evaluate(()=>window.testStorage.getHistory().length),1,'storage failure keeps session record');
  assert.match(await page.evaluate(()=>window.testStorage.element.textContent),/Persistent storage unavailable/);
  assert.deepEqual(errors,[]);
  console.log('PASS browser: capture transitions, width, pacing/test state, threshold and S2 row replay, calipers, TR/EN state, invalidation, blind reveal, history reload/failure, perforation, hidden animation, 390px layout; no page errors');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
```

### `vite.config.mjs`

<!-- file: vite.config.mjs -->
```javascript
export default { base:'./', build:{outDir:'dist'} };
```

## Kaynak kimliği

Aşağıdaki SHA-256 değerleri yalnız kaynak blokları içindir; her dosya sonu tek LF içerir.

- `csp-model.mjs`: `05c27ceb52b744b712d7100e524e896ca1d71920c99352abfffe478cba1b7116`.
- `csp-text.mjs`: `f9a231b31967c4861f3adea63c93a4bdd552289fc1563c7334f5b51caaab899f`.
- `csp-panel.mjs`: `8d4d049f3bae01bea3aa6b834e348660a76cafd6f5bcd9dd0fb55862109b211c`.
- `csp.css`: `aeac73e0fcd9ee8422abfece9dfa28db2fc4cd77f9474a20c9fccaa463c2d3f1`.
- `main.mjs`: `00905e93a8c66bad6b77d8f7a6818059df7067bea63407cc36dc989fff655871`.
- `index.html`: `6ece224e0f94fe78315944b151af48e6de2c27cd938fa933b7b014710c9b71ed`.
- `test-csp.mjs`: `fcd8f652e754653fc9b03a64a127a563e21f5842f3b03930c8a4552389f64965`.
- `test-browser.cjs`: `0d45eb0ad275ad7c80156f07d3ee67380621f8f6d69eea20122a29566c54da62`.
- `vite.config.mjs`: `fc3e12742fbc5fd5037a7629924ad206c28c03c3cddb0dc32f7e470e4ecbb099`.

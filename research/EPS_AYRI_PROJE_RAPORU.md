# EPS simülatörü: ayrı projeye taşıma ve başlangıç raporu

Tarih: 2026-10-03. Kaynak proje: Cardia (`/Users/yh/Documents/projects/3d card visualization`). Hedef klasör: `/Users/yh/Documents/projects/eps` (boş, açıldı).

Bu rapor yeni bir sohbette EPS projesini başlatmak için yazıldı. Yeni oturum önce bu dosyayı okumalı.

## 1. Karar ve gerekçe

- Cardia bir 3D kardiyak anatomi ve girişim simülatörü (Vite, vanilla JS, Three.js). İçindeki EP "sinyal" kısmı (canlı EPS kaydı, vakalar, pacing laboratuvarı, görevler, 12 derivasyon odak bulma, farmakoloji, PVI) 3D sahneyle yer paylaşıyor; sol panelin 1/3'üne sıkışmış durumda ve eksik.
- Karar (kullanıcı onaylı): EPS kısmı ayrı bir proje olacak. Tek HTML sayfası değil; modüler Vite projesi, kendi testleriyle.
- Cardia'da yalnız 3D'de gösterilen EP anatomisi kalır: Koch üçgeni ve ablasyon işaretleri (`ep-landmarks.js`), yol bölgeleri (`ep-zones.js`, 3D yay), transseptal, kalp pili elektrotları, Bachmann, PVI lezyon halkaları (`pvi-lab.js`, 3D). Cardia'daki sinyal panelinin yerine EPS uygulamasına bağlantı konur; kod iki projede kopya tutulmaz.
- Referans: `/Users/yh/Documents/projects/svtsimulator` (tek dosyalık `index.html`, kayıt sistemi düzeni için örnek alındı; kod kaynağı değil).

## 2. Taşınacak modüller (Cardia `src/`)

Satır sayıları yaklaşık. Bağımlılıklar yalnız proje içi importlar.

| Modül | Satır | Bağımlılık | İçerik |
|---|---|---|---|
| ep-live-model.js | 381 | ep-beats, ep-live-substrates | Ayrık olay kuyruklu iletim modeli: doku refrakterliği, dekremental AV düğüm, iki uçlu yavaş yol, His/LCP kararları varış anında |
| ep-live-substrates.js | 63 | yok | Aktivasyon dizileri (sinüs, HRA, CS, retrograd yollar, LA odak, flutter) ve vaka parametreleri (AVNRT tipik/atipik, ORT, PJRT, WPW, AT, CTI flutter, skar VT, sinüs düğümü hastalığı) |
| ep-live-maneuvers.js | 237 | yok | Manevralar: entrainment, PPI, ATP, overdrive, protokoller |
| ep-live-panel.js | 450 | ep-egm, ep-live-model, ep-live-text, ep-live-maneuvers, ep-user-caliper | Canlı kayıt monitörü (süpürme), stimülatör, oynatma hızı, RF, gizli vaka sınavı |
| ep-live-text.js | 144 | yok | TR/EN metinler |
| ep-cases.js | 725 | ep-beats, ep-caliper, ep-cases-advanced | Statik vaka kayıtları (EGM şeritleri) |
| ep-cases-advanced.js | 345 | ep-beats, ep-caliper, pvi-model | İleri vakalar |
| ep-case-text.js | 812 | yok | Vaka metinleri TR/EN |
| ep-beats.js | 259 | yok | Atım/elektrogram üretimi |
| ep-egm.js | 280 | ep-cases | EGM çizimi |
| ep-caliper.js, ep-user-caliper.js | 26, 46 | yok | Kaliperler (yatay, dikey) |
| ep-activation-map.js | 70 | ep-cases | Aktivasyon haritası (2D) |
| ep-maneuver-sim.js, ep-sim-panel.js | 206, 137 | ep-beats, ep-cases, ep-case-text | Manevra simülasyonu |
| ep-pacing-lab.js, ep-pacing-panel.js, ep-pacing-text.js | 375, 226, 109 | ep-beats, ep-cases, ep-maneuver-sim | Atriyal pacing laboratuvarı |
| ep-task.js, ep-task-panel.js, ep-task-text.js | 183, 186, 75 | ep-maneuver-sim, ep-beats, ep-cases, ep-case-text, ep-sim-panel | Görevler / sınav |
| ep-origin.js, ep-origin-panel.js, ep-origin-text.js, ecg12.js | 176, 148, 89, 139 | ecg12, ep-beats, ep-cases | 12 derivasyondan odak / yol yerleşimi |
| ep-pharma.js, ep-pharma-panel.js, ep-pharma-text.js | 158, 133, 62 | ep-beats, ep-caliper, ep-maneuver-sim, ep-cases | Atropin, isoproterenol, adenozin vb. (tüm vakalar) |
| pvi-model.js, ep-pvi-panel.js | 121, 134 | ep-beats, ep-caliper | PVI modeli ve paneli (2D kısmı) |
| ep-fullscreen.js | 106 | yok | Tam ekran kayıt |
| ep-panel.js | 580 | yukarıdakilerin çoğu | Ana panel: Tanı / Manevralar / Tedavi / Canlı kayıt sekmeleri |

Stil: `src/style.css` içinde EP ile ilgili yaklaşık 128 satır kural (`.ep-*`, `.egm*`, `.live-*`, `.pvi-*`). Taşınırken yeni projenin kendi CSS dosyasına alınmalı.

## 3. Cardia ile bağlantı noktaları (taşırken kopacak yerler)

- `main.js` `syncEgm()`: ablasyon dersinin `egm` senaryolu adımlarında `createEpPanel(egmMount, { getLang, onZone, getPvi })` açılır; `egmPanel.openLesson(scenario)`.
- `onZone: (zoneId, extra) => heart.setEpZone(...)`: vaka yol bölgesini 3D'de yay olarak gösterir. Yeni projede 3D yok; ya kaldırılır ya da sabit bir 2D şematik (Koch / AV halka çizimi) ile değiştirilir.
- `getPvi: () => heart.pvi`: PVI lezyon halkaları 3D'de. Yeni projede 2D şematik LA/PV haritası gerekir.
- `egmPanel.draw(state)`: kalp döngüsü (`cardiac-cycle.js`) aboneliğinden çağrılıyor. Canlı model kendi saatine sahip; statik vakalar için yeni projede bağımsız bir zamanlayıcı gerekir.
- `ep-zones.js` (Cardia'da kalır) `ep-case-text.js`'i kullanıyor: Cardia'da yalnız gereken bölge metinleri bırakılmalı ya da `ep-zones` metinleri kendi dosyasına alınmalı.
- `window.cardiaEp` test kancası (test-ep-flow, test-ep-live-browser).

## 4. Testler

Taşınacak birim testleri (`scripts/`): test-ep-live.mjs, test-ep-live-maneuvers.mjs, test-ep-cases.mjs, test-ep-egm.mjs, test-ep-advanced.mjs, test-ep-sim.mjs, test-ep-pacing.mjs, test-ep-task.mjs, test-ep-origin.mjs, test-ep-pharma.mjs, test-ep-pvi.mjs, test-ep-user-caliper.mjs.

Tarayıcı testleri: test-ep-live-browser.cjs, test-ep-flow.cjs (EP akışı; 3D'ye bağlı kısımları ayrılmalı). test-ep-koch.cjs Cardia'da kalır (3D Koch).

Çalıştırma: birim `node scripts/x.mjs`; tarayıcı testleri Playwright, `APP_URL` ile, Chrome kanalı, modül yolu `/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright` (`PLAYWRIGHT_MODULE` ile değiştirilebilir).

## 5. Kaynak ve araştırma belgeleri (Cardia `research/`)

- EASY_ECG_EP_OZGUN_GELISTIRME_RAPORU.md
- EP_ATRIYAL_PACING_KAYNAK_STORYBOARD.md
- EP_FARMAKOLOJIK_PROVOKASYON.md
- EP_FAZ_BCD_KAYNAK_STORYBOARD.md
- ep-report-provenance.json

Bunlar yeni projenin `research/` klasörüne kopyalanmalı.

## 6. Yeni proje: hedef düzen

- Tam ekran kayıt iş istasyonu (svtsimulator benzeri):
  - Üstte yüzey EKG derivasyonları (I, II, III, aVF, V1, V6 seçilebilir; 12 derivasyon görünümü).
  - Altta intrakardiyak kanallar (HRA, His p/m/d, CS 1-2 … 9-10, RVA, ablasyon d/p).
  - Süpürme (sweep) ve donmuş kayıt, kaydırma, kanal kazancı ve sırası.
- Sağda stimülatör: S1 dizisi, S2/S3 ekstrastimulus, burst, dekremental, sinüs senkron; çıkış kanalı (HRA, CS, RVA, His).
- Protokol menüsü: atriyal ekstrastimulus, ventriküler ekstrastimulus, artan hızda pacing, SNRT, para-Hisian, entrainment, ATP.
- Ölçüm: kaliperler (yatay, dikey), AH/HV/VA ve döngü uzunlukları.
- Vaka kütüphanesi ve gizli vaka sınavı; ilaçlar (atropin, isoproterenol, adenozin) tüm vakalarda.
- Ablasyon: hedef seçimi, RF süresi, sonuç (canlı modeldeki RF lezyonları).
- Anatomi için Cardia'ya bağlantı ("3D'de gör") ve 2D şematik (Koch, AV halka, CS, PV).

## 7. Önerilen fazlar

Her faz en fazla 5 dosyaya dokunur (kullanıcının proje kuralı); her fazdan sonra doğrulama ve onay.

1. **Faz 1 (iskelet):** Vite, vanilla JS, `package.json` betikleri (`dev`, `build`, `test`, `check`), git init, README. Canlı EPS laboratuvarının (ep-live-*, ep-beats, ep-egm, ep-user-caliper ve bağımlılıkları) taşınması; tam ekran kayıt düzeni; birim testleri ve tarayıcı testi geçer.
2. **Faz 2:** Statik vakalar, Tanı/Manevralar/Tedavi sekmeleri (ep-panel ve bağımlıları), 2D şematik bölge gösterimi (onZone yerine).
3. **Faz 3:** Pacing laboratuvarı, görevler, 12 derivasyon odak bulma, farmakoloji, PVI (2D).
4. **Faz 4:** Cardia temizliği: EP sinyal modüllerinin kaldırılması, `syncEgm` yerine EPS uygulamasına bağlantı, `ep-zones` metinlerinin ayrılması, Cardia testlerinin güncellenmesi. (Bu faz Cardia deposunda yapılır.)

## 8. Çalışma kuralları (kullanıcı tercihleri)

- Yanıtlar Türkçe, kısa.
- Uzun tire (em dash) hiçbir çıktıda kullanılmaz (kod yorumu, commit, belge dahil); kısa tire yalnız sayı aralıklarında.
- Commit ve push yalnız kullanıcı "com push" deyince. Commit mesajı sonu: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Alt ajan kullanılırsa yalnız Sonnet modeli (kullanıcı önceki işlerde bunu istedi).
- Kayıtlar sentetik eğitim verisidir; sitede alt bilgi olarak "bilgilendirme ve eğitim amaçlıdır, gerçek uzman ve doğrulanmış kaynaklara başvurun" uyarısı bulunmalı (Cardia'daki gibi). Her panelde ayrıca "sentetik" notu tekrar edilmez.
- Doğrulamadan "bitti" denmez: `npm test`, `npm run check`, `vite build` ve ilgili tarayıcı testi.

## 9. Yeni sohbet için başlangıç komutu (öneri)

"`/Users/yh/Documents/projects/eps/EPS_AYRI_PROJE_RAPORU.md` raporunu oku. Faz 1'i uygula: Vite iskeleti, Cardia'daki canlı EPS laboratuvarını (`/Users/yh/Documents/projects/3d card visualization/src/ep-live-*` ve bağımlılıkları) taşı, tam ekran kayıt düzeni kur, testleri taşı ve geçir."

# EKG görsel ve etkileşim denetimi

Tarih: 2026-10-05. Kapsam: `/ecg/` içindeki altı eğitim bölümü; başlık ve menülerden Guyton markasının kaldırılması, kaynak atfının korunması, görsel etkileşimlerin zenginleştirilmesi.

## Kaynak ve yöntem

Kaynak belge: `/Users/yh/Library/CloudStorage/OneDrive-Personal/01-Kardiology E kitap/01-Kardiyoloji E kitapları kısmi sınıflandırılmış/netter/netter ecg.pdf`.

Belge: *The Netter Collection of Medical Illustrations, Cardiovascular System*, Volume 8, second edition, 2014. PDF 15 sayfa; kitap sayfaları 34–48, Plates 2-15–2-29. SHA-256: `09f5269384327618f8e533ed799c5b2a4395fccaa02236ee7e013e747a8a38bb`.

PDF metni PyMuPDF ile incelendi; elektrot yerleşimi, aks, dal blokları ve erken atım plakaları ayrıca görsel olarak kontrol edildi. Kaynak şekilleri dağıtıma kopyalanmadı. Yeni SVG şemaları ve sentetik dalga şekilleri özgün çizimlerdir. Eski kaynakların tanısal önerileri otomatik olarak güncel klinik protokol kabul edilmedi.

| Bölüm | Önceki eksik | Yeni etkileşim | Netter eşlemesi |
|---|---|---|---|
| Temel EKG | Statik açıklama, zaman ölçeği tutarsızlığı | Hız, kazanç, kalp hızı, P/PR/QRS/QT/T seçimi; AP ve EKG ortak imleci | PDF 1, kitap 34, Plate 2-15 |
| Derivasyonlar | Ekstremite ağırlıklı gösterim | Seçilebilir I/II/III/aVR/aVL/aVF ve V1–V6; göğüs elektrot haritası, R progresyonu | PDF 2, kitap 35, Plate 2-16 |
| Vektörler | Metin ve tekil adımlar | Kalpte aktivasyon adımları, beş eşzamanlı derivasyon izi | PDF 3–4, kitap 36–37, Plates 2-17–2-18 |
| Aks | Olgu kartları ağırlıklı | Serbest aks kaydırıcısı, I/aVF/II polaritesi, olguyla senkronizasyon | PDF 5–8, kitap 38–41, Plates 2-19–2-22 |
| Hasar akımı / ST | Referans noktası açıklaması hatalı | Bölgesel dört ST izi, TP referansı ve J noktası, kayma kontrolü | Temel ölçüm ve derivasyon plakaları; aşağıdaki standartlarla tamamlandı |
| Aritmiler | Sınırlı halka gösterimi | Yol uzunluğu, hız ve ERP ile re-entry; başlatıcı blok, oynat/duraklat/adımla; yedi ritim | PDF 10–13, kitap 43–46, Plates 2-24–2-27 |

## Sayısal ve fizyolojik düzeltmeler

- QRS süresi piksel genişliğinden değil gerçek zaman parametresinden üretilir. 80 ms, 25 mm/s'de 2 küçük kutu; 50 mm/s'de 4 kutudur. Kazanç seçenekleri 5/10/20 mm/mV.
- Temel örnek PR 160 ms, QRS 80 ms, QT 360 ms. Kalp hızı 60–100/dk; QT örneği hızla otomatik uyarlanmaz. QTc Fridericia ayrı gösterilir. Tek hücre aksiyon potansiyeli yüzey EKG'siyle özdeş değildir.
- Einthoven ilişkisi aynı frontal vektörden hesaplanır: I + III = II. V1/V6 yatay düzlem örnekleri bu eşitliğin parçası değildir.
- −15° normal aks içindeki sola yönelimdir. Aks tek başına hipertrofi veya dal bloğu tanısı koydurmaz.
- J noktası QRS-ST birleşimidir; evrensel sıfır potansiyel olarak sunulmaz. TP referansı ve posterior V1–V3/V7–V9 örnekleri tanısal eşiklerden ayrılır.
- Re-entry için λ = iletim hızı × ERP; birimler cm, cm/s ve ms. Sürdürülebilir halka için başlatıcı tek yönlü blok ve yol uzunluğunun λ'dan büyük olması gerekir. Bu basitleştirilmiş halka modeli anatomik/klinik simülasyon değildir.
- Yedi ritim: sinüs, birinci derece AV blok, Wenckebach, tam AV blok, PVC, AF, flutter (3:1). Örnekler deterministiktir; klinik veri veya rastgele üretim kullanılmaz.

Ek birincil kaynaklar (arayüz kaynak panelinde de bağlantılı):

- [AHA/ACCF/HRS ECG technology statement, 2007](https://doi.org/10.1016/j.jacc.2007.01.024).
- [ESC: How to measure the QT interval](https://www.escardio.org/communities/councils/genomics/scientific-documents-and-publications/cardiogenomics-insights/volume-9/how-to-measure-the-qt-interval/).
- [Electrical propagation and re-entry, 2013](https://doi.org/10.1161/CIRCEP.113.000311).

## Doğrulama

Ortam: macOS, Node v22.14.0; mevcut proje bağımlılıkları, Vite ve Chrome/Playwright. Yeni bağımlılık eklenmedi.

- `npm run check`: geçti.
- `npm test`: geçti; mevcut modül testleri ve yeni EKG model testleri dahil.
- `npm run test:ecg-labs`: son değişikliklerden sonra geçti. Süre/ölçek, sonlu ve sıralı dalga noktaları, Einthoven ilişkisi, aks sınırları, elektrot yerleri, re-entry birimleri ve ritim örüntüleri doğrulandı.
- `node scripts/test-ecg-labs-browser.cjs`: son değişikliklerden sonra geçti. Altı bölüm, Türkçe/İngilizce durum koruması, klavye odağı, 1440 px masaüstü ve 390 px mobil, başlıklar ve animasyon kontrolü doğrulandı. Sayfa JavaScript hatası yok.
- `npm run build`: son değişikliklerden sonra geçti (`built in 397ms`).
- Bağımsız incelemede yüksek hızda T dalgası kesilmesi, imleç sınırı uyuşmazlığı ve sönmüş halkada refrakter rengin kalması bulundu. Üçü düzeltildi, regresyon kontrolleri eklendi; ikinci inceleme onaylandı.

Tarayıcı ekran görüntüleri: `/private/tmp/cardia-ecg-labs/`. Testler eğitim modelinin iç tutarlılığını ve arayüz davranışını doğrular; klinik tanısal doğruluk çalışması değildir.

Son kod SHA-256:

- `src/ecg/ecg-lab-model.js`: `9088893f1d974f6875bfd79d4b3c9b5e1e063132476cfd7532c893a8b8b61493`
- `src/ecg/ecg-labs.js`: `e6308c4d4bd842174a0c9d7ea0a99c8fb6adce57710c3472afae7f433210e592`
- `src/ecg/guyton-render.js`: `29bb1c514f929a952cff6f52145516b30bbfeb41b6b271907e8153bf2cd4b9ee`

Commit veya push yapılmadı. Paylaşılan çalışma alanındaki diğer değişiklikler korundu.

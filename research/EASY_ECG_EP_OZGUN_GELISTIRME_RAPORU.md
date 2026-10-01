# EasyECG incelemesi: elektrofizyoloji için özgün geliştirme raporu

**Tarih:** 30 Eylül 2026

**Yetki ve durum:** Plan ve kaynak değerlendirmesi. Bu rapor uygulama, klinik doğrulama veya içerik lisansı vermez.

**Claude'ye devir amacı:** Aşağıdaki fazları mevcut EP modülünde, kaynakları yeniden doğrulayarak uygulamak. Yerel `svtsimulator` prototipi ayrıca incelendi; aşağıdaki entegrasyon sınırları geçerlidir.

## Uygulama durumu (30 Eylül 2026, Faz A)

Faz A uygulandı ve test edildi; klinik olarak **doğrulanmadı** (EP uzman incelemesi yok). Faz B-D bu rapordaki yol haritası olarak açıktır.

| Teslim | Yer |
|---|---|
| Kaynak matrisi (P1-P14), sentetik olay storyboard'u (11 satır), kapsam ve karar kaydı | `research/EP_ATRIYAL_PACING_KAYNAK_STORYBOARD.md` |
| Olay modeli: S1 × N, S2, artan hızda pacing, HRA / CS proksimal / CS distal; AV düğüm toparlanma eğrisi, çift yol, decremental olmayan AP, tek echo | `src/ep-pacing-lab.js` |
| Panel: Manevralar sekmesinde "Atriyal pacing laboratuvarı", iki kayıt karşılaştırması (AH sıçraması olaylardan), "hangi yol iletti?" sorusu, gözlenen kanıt ve ayırt edilemeyenler, yanıttan sonra 3B iletim yolları | `src/ep-pacing-panel.js`, `src/ep-pacing-text.js`, `src/ep-panel.js`, `src/ep-zones.js`; manevra kartı `a-incremental` `src/ep-case-text.js` içinde |
| Testler | `scripts/test-ep-pacing.mjs` (`npm test` içinde; 4050 protokol, storyboard satırları olaylardan), `scripts/test-ep-flow.cjs` (tarayıcı akışı) |

`svtsimulator`'dan kod, CSS, vaka metni veya eşik alınmadı; yalnız S1×N / S2 / pacing yeri kontrol fikri kullanıldı. Bölüm 2'deki kritik kod sınırlarının karşılığı yoktur: süreler olaylardan ölçülür, yakalamayan uyarı tanısal sonuç vermez, aynı giriş aynı kaydı üretir, rastgele sayı kullanılmaz.

### Faz B, C ve D (30 Eylül 2026, ikinci tur)

Faz B ve C uygulandı ve test edildi; Faz D için rapor bölüm 4D'nin istediği kaynak matrisi ve olay storyboard'u yazıldı, kod yazılmadı (A-C ve EP uzman incelemesi önkoşulu). Hiçbiri klinik olarak doğrulanmadı. Kaynaklar, kurallar, storyboard ve karar kaydı: `research/EP_FAZ_BCD_KAYNAK_STORYBOARD.md`.

| Faz | Teslim | Yer |
|---|---|---|
| B | Tanı sekmesinde gizli olgulu dar QRS görevi: taşikardi kaydı (VA ve en erken A olaylardan), mevcut manevra modeliyle His-refrakter PVC, ventriküler overdrive ve para-Hisian pacing; her kanıt beş mekanizmaya karşı "destekler / aleyhine, dışlamaz / dışlamaz / yorumlanamaz"; yanıt ve açıklama; başlık ve 3B zon yanıta kadar nötr | `src/ep-task.js`, `src/ep-task-text.js`, `src/ep-task-panel.js`; test `scripts/test-ep-task.mjs` |
| B (düzeltme) | Para-Hisian yol olgusunun septal VA'sı 40 ms'den 75 ms'ye (40 ms, septal VA < 70 ms'nin ortodromik AVRT'yi dışladığı ölçütüyle çelişiyordu) | `src/ep-cases.js`, `src/ep-maneuver-sim.js`, `src/ep-case-text.js` |
| C | Tek dipolden sentetik 12 derivasyon; 6 PVC (skar karşı örneği dahil) ve 5 atriyal odak örneği; özellikler sinyalden okunur, olası bölgeler ve güven gerekçesi; atriyal odakta kateter aktivasyonu ile örnekleme sınırı; yanıttan sonra 3B bölge işaretçisi | `src/ecg12.js`, `src/ep-origin.js`, `src/ep-origin-text.js`, `src/ep-origin-panel.js`, `src/ep-zones.js`; test `scripts/test-ep-origin.mjs` |
| D | Para-Hisian fokal AT, sol posterior fasiküler VT ve dal bloğu reentrisi VT için aday kaynak matrisi (D1-D8) ve olay storyboard'u | `research/EP_FAZ_BCD_KAYNAK_STORYBOARD.md` bölüm 3 |

### Faz D uygulaması ve PVİ egzersizi (1 Ekim 2026, üçüncü tur)

Faz D, raporun "A-C ve EP uzman incelemesi tamamlanmadan uygulanmaz" önkoşuluna karşın **kullanıcının açık talebiyle** uygulandı; EP uzman incelemesi hâlâ yapılmadı ve açık maddedir. Ayrıca kullanıcı talebiyle rapor kapsamı dışından bir AF / pulmoner ven izolasyonu egzersizi eklendi. Hiçbiri klinik olarak doğrulanmadı.

| Teslim | Yer |
|---|---|
| Para-Hisian fokal AT: uzun RP taşikardi (en erken A His'te, dar P), His-refrakter PVC yanıtsız, ventriküler overdrive'da VA dissosiyasyonu, nonkoroner kusp haritalama klibi (ABL A, P başlangıcını 15 ms önceler; R20), işlem sonrası korunmuş AH/HV | `src/ep-cases-advanced.js` (olgu `at-parahisian`), metinler `src/ep-case-text.js` |
| Sol posterior fasiküler VT: P1 (bazalden apekse, diastolik) ve P2 (apeksten bazale, presistolik), retrograd His, AV dissosiyasyonu; RV'den entrainment (P1 pacing siklusuna uyar, VT kendi siklusuyla döner, PPI-TCL uzun); ablasyon sonrası korunmuş HV ve antegrad Purkinje | olgu `fascicular-vt`; manevra kartı `entrain-rv` |
| BBR-VT: sinüste uzun HV + RB potansiyeli, VT'de her V'den önce H ve RB, H-H değişimi aynı dönüşün V-V'sinde; sağ dal ablasyonu sonrası RB kaybı, RBBB ve daha uzun HV; interfasiküler reentri tuzağı metinde | olgu `bbr-vt`; yeni kanallar `rb`, `lv-sep-b`, `lv-sep-a` (3B elektrot iddiası yok) |
| Kaynaklar R16-R28 (D1-D8 matrisinin doğrulanan kısmı) `ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md` bölüm 13'e eklendi; BBR klasik ölçütleri R26 (Caceres 1989) özetinden | ilgili rapor |
| AF / PVİ egzersizi: Tanı sekmesinde AF + PV potansiyeli temel kaydı; Tedavi sekmesinde 3B'de her ven ağzı çevresinde 10 aday noktalı şematik halka, tıklanan nokta lezyon; halka tamamlanınca Lasso kanalında giriş bloğu (yakın alan PV potansiyelleri kaybolur, uzak alan kalır; R30, R31); dört halka tamamlanınca bu kurguda sinüs (sadeleştirme metinde; R30 geç rekonneksiyon) | `src/pvi-model.js`, `src/pvi-lab.js`, `src/ep-pvi-panel.js`; kaynaklar R29-R31 |
| Testler | `scripts/test-ep-advanced.mjs`, `scripts/test-ep-pvi.mjs` (`npm test` içinde), `scripts/test-ep-flow.cjs` genişletildi |

## 1. Soru, kapsam ve bitiş ölçütü

Soru: [EasyECG makale kataloğundaki](https://www.easy-ecg.com/articles) öğrenme konularından hangileri, Cardia'nın 3B anatomi ve sentetik elektrogram altyapısıyla özgün, etkileşimli EP eğitimine dönüştürülebilir?

Kapsam: atriyal pacing ve preeksitasyon, dar QRS taşikardi mekanizması, PAC/PVC kaynak bölgesi, seçilmiş ileri EP olguları. Hasta verisi, gerçek EKG kopyası, klinik karar desteği ve işlem reçetesi kapsam dışı. Bitiş ölçütü: her yeni olguda kullanıcı girişinin sinyali ve 3B görünümü değiştirmesi; olaylardan ölçülen sonuç; geçersiz koşulda tanı vermeyen geri bildirim; TR/EN açıklama; kaynak ve telif izi; ilgili testlerin geçmesi. Uzman EP incelemesi yapılmadan içerik klinik olarak doğrulanmış sayılmaz.

## 2. İncelenen site ve çıkarılan öğrenme başlıkları

30 Eylül 2026'da katalog tarayıcıda açıldı. Görünen başlıklar arasında Easy-WPW, Easy-PVC, tipik/atipik AVNRT, saat yönüne göre tipik flutter, ventriküler pacing ile VA iletimi, decremental atriyal pacing, PJRT, para-Hisian atriyal taşikardi, fasiküler VT, bundle branch reentry VT, PAC/EAT ve PVC/VT lokalizasyonu vardı. Başlıklar konu keşfi içindir; sitenin görsel, video, vaka, metin ve algoritmaları kullanılmayacak. İncelenen [VA iletimi yazısı](https://www.easy-ecg.com/articles/r83bHw8rVW53hg4Tntyo) kısa kurallar içeriyor; bunlar proje için klinik doğruluk kaynağı kabul edilmez.

| Site başlığı | Projedeki durum | Özgün eğitim fırsatı |
|---|---|---|
| AVNRT, AVRT, PJRT, WPW | 9 olguluk EP kataloğunda tipik/atipik AVNRT, aksesuar yol, PJRT ve manifest yol var | Aynı hastalık adlarını çoğaltmak yerine hız ve uyarı zamanlaması değişince kanıtın nasıl değiştiğini göstermek |
| VA iletimi ve EPS manevraları | His-refrakter PVC, ventriküler overdrive ve para-Hisian pacing etkileşimli | Farklı manevraların aynı ayırıcı tanıda hangi koşulda yorumlanabildiğini yan yana göstermek |
| Tipik flutter | CTI entrainment, Halo ve çift yönlü blok klipleri var | Saat yönü karşılaştırmasını aynı anulus üzerinde aktivasyon sırası ve yüzey EKG ile öğretmek |
| PAC/EAT lokalizasyonu | Krista kaynaklı fokal AT olgusu var | Çok bölgeli atriyal aktivasyon ve P dalgası tahmin laboratuvarı |
| PVC/VT lokalizasyonu | Bağımsız PVC haritalama eğitimi yok | 12 derivasyonlu sentetik örnek, olası çıkış bölgesi ve belirsizlik gösterimi |
| Fasiküler VT, BBR-VT, para-Hisian AT | Ayrı tam olgular yok | İleri düzey modül; kaynak ve uzman incelemesinden sonra |

**Durum kaynağı:** `research/ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md` girişindeki dört uygulama turu; `src/ep-cases.js`, `src/ep-maneuver-sim.js`. Eski raporun 15. bölümündeki açık iş tablosu, girişte belgelenen dördüncü uygulama turundan önce yazılmıştır. Güncel durumu giriş tablosu ve kod üzerinden yeniden doğrulayın.

### Yerel `svtsimulator` prototipi: ne alınabilir?

İncelenen dosyalar: `/Users/yh/Documents/projects/svtsimulator/index.html` (SVTSim v2), `hemosim.html` ve `index.html.bak`. Klasörde lisans dosyası, kaynakça, test paketi veya proje düzeyinde sürüm kaydı görünmedi. Kaynak kimliği için SHA-256: `index.html` `d0b7473ba1fa711997d6d1de5280957992045e82ef4c41301560f3d33e4dcafb`; `hemosim.html` `1fda2f6bacae222e555e05d7a271a9b8e8680b9dc8ccee86bf08925049dc3d70`. İnceleme statik kod okumasıdır; tarayıcıda doğrulanmadı.

| Prototip öğesi | Karar | Gerekçe / Cardia karşılığı |
|---|---|---|
| S1×N, S2/S3/S4, pacing ve sensing yeri kontrolleri | **Faz A için değerli ürün fikri** | Cardia'da atriyal ekstrastimulus klibi ve ventriküler manevra simülatörü var; kullanıcı kontrollü atriyal pacing dizisi eksik. Giriş biçimi kavramsal örnek alınabilir; olay üretimi yeniden yazılmalı. |
| 7 kanallı canlı şerit, pause/review, sweep ve sürüklemeli kaliper | **Seçici entegrasyon** | Cardia'nın olay tabanlı EGM çizicisi, kaliperleri ve mobil tam ekranı var. Canlı akan kayıt ve geri sarma görev deneyimine katkı verebilir; mevcut çiziciye ikinci, bağımsız sinyal saati eklenmemeli. |
| Basit/ileri/flutter modları, ipucu ve tanı testi | **Öğretim akışı için fikir** | Cardia'nın Tanı/Manevralar/Tedavi düzeni ve kanıtı gizle/göster akışı korunmalı. Mevcut olgulara seviyeli ipucu ve gerekçeli geri bildirim eklenebilir. |
| `SC` olguları ve `SLIDES` eğitim metni | **Doğrudan taşınmayacak** | Çoğu mevcut EP kataloğuyla çakışıyor; kaynak/uzman kontrolü yok; bazı kesin tanı kuralları ve sayısal eşikler bağlam dışı. |
| `buildBeat`, `RingBuffer`, `Renderer` | **Doğrudan taşınmayacak** | Dalga örnekleri olgudan türetiliyor; Cardia'da tek gerçek kaynak zaman damgalı A/H/V/S olayları. Ayrı örnek tamponu ölçüm ve 3B saatinin ayrışmasına yol açar. |
| `hemosim.html` basınç/hacim modeli | **EP kapsamına alınmayacak** | Cardia'nın ayrı hemodinami modülü var; iki modeli birleştirmek EP eğitimine katkı sağlamaz, fizyolojik tutarlılık incelemesi gerektirir. |

**Kritik kod sınırları:** `runPaceTrain()` S1 için yalnız senaryonun `cl` değerini değiştiriyor; S2/S3/S4 uyarıları çizilen olaya eklenmiyor. S2 eşikleri sabit tanı/indüksiyon mesajına gidiyor; pacing ve sensing yeri çoğunlukla durum metninde kalıyor. `getInterval()` değerleri kayıttan ölçmek yerine `SC` sabitlerini döndürüyor. `doDetectReentry()` olgu kimliğinden sonuç veriyor. `doAblation()` hangi mekanizma/katılım kanıtı olursa olsun sinüse geçiyor. Preeksite AF şeridi `Math.random()` kullanıyor; tekrar üretilebilir değil. Bu davranışlar Cardia'ya aktarılmamalı.

**Klinik metin uyarısı:** Prototipte "konsantrik = AVNRT", "PJRT eksantrik; atipik AVNRT konsantrik", "V-A-A-V = AT veya AVNRT", "VA <70 ms = tipik AVNRT" gibi kesin eşlemeler var. Mevcut Cardia raporu özellikle CS ağzı ve PJRT/atipik AVNRT çakışmasını manevrayla ayırıyor. Prototipin test/sonuç ve ablasyon metnini klinik bilgi olarak kullanmayın. Eşik veya mekanizma anlatımı birincil kaynakla tek tek doğrulanmalı.

**Telif/menşe:** Prototip yerel dosya olsa da yazarlık ve lisans bu klasörde belgelenmiyor. Kullanıcı sahipliği/yeniden kullanım hakkı doğrulanana kadar kod, CSS, vaka metni, slayt, özgün dalga biçimi ve görsel düzeni kopyalamayın. Kontrol adları ve genel eğitim fikri üzerinden Cardia'da bağımsız uygulama yapın. Kullanıcı hak sahipliğini doğrularsa bile klinik model denetimi olmadan kodu üretime almayın.

## 3. Klinik doğruluk sınırları

1. VA dissosiyasyonu, CS'deki en erken A veya decremental iletim tek başına kesin mekanizma vermez. PJRT, decremental retrograd iletimli aksesuar yol karşı örneğidir. Yakalama, doğrudan atriyal yakalama, His yakalaması, taşikardi entrainment'ı ve gözlenen A/H/V dizisi ayrı belgelenmeli. Mevcut `src/ep-case-text.js` bu tuzakların bir kısmını zaten anlatır.
2. P dalgası ve PVC QRS morfolojisi olası bölgeyi düşündürür; kesin odak veya ablasyon hedefi değildir. Özellikle skarlı VT'de yüzey EKG'si devrenin kritik istmusundan çok çıkış bölgesini yansıtabilir. [2019 HRS/EHRA/APHRS/LAHRS ventriküler aritmi uzlaşısı](https://www.hrsonline.org/resource/2019-hrsehraaphrslahrs-expert-consensus-statement-catheter-ablation-ventricular-arrhythmias/).
3. WPW paterni, aksesuar yol ve klinik sendrom ayrı kavramlardır. Preeksitasyonlu AF, dar QRS SVT karar akışına sokulmamalı. [2015 ACC/AHA/HRS SVT kılavuzu](https://www.jacc.org/doi/10.1016/j.jacc.2015.08.856).
4. Verilen süreler, sinyal biçimleri ve aktivasyon haritaları öğretim için sentetik olmalı ve öyle etiketlenmeli. Gerçek hasta kaydı, prosedür başarısı veya klinik duyarlılık iddiası üretilmemeli.

Bu kaynaklar uygulama öncesi ilgili iddia düzeyinde tekrar okunmalı. Bu raporda EasyECG ile klinik kılavuzlar arasında sistematik kanıt sentezi yapılmadı; ileri olguların ayrıntılı elektrofizyolojisi ayrıca doğrulanacak.

## 4. Önerilen ürün fazları

### Faz A, atriyal pacing ve preeksitasyon laboratuvarı

**Amaç:** Kullanıcı atriyal pacing siklus süresini ve uyarı yerini değiştirir. Ekran A, H, V, AH, HV, delta başlangıcı ve QRS füzyonunu aynı zaman ekseninde gösterir. Senaryolar: normal AV düğüm iletimi, dual AV nodal fizyoloji, manifest aksesuar yol, decremental antegrad yol örneği. Sonuncusu için Mahaim benzeri mekanizma ancak birincil kaynak ve uzman onayıyla eklenir.

**Arayüz:** Mevcut EGM panelinde hız kontrolü ve iki kayıt karşılaştırması; 3B'de atriyumdan ventriküle olası iletim yolları. Her değişimde ölçümler olay zamanlarından hesaplanır. Kullanıcı 'hangi yol iletti?' sorusunu yanıtlar; açıklama gözlenen kanıtı ve ayırt edilemeyen durumları listeler. Tek morfolojiden kesin tanı üretmez.

**Kabul:** Hız değişimi olayları, kaliperleri ve 3B animasyonu aynı mantıkla değiştirir; geçersiz/yakalanmayan uyarı tanısal sonuç vermez; aynı giriş aynı sinyali üretir; TR/EN metin ve klavye/mobil kontroller çalışır.

**`svtsimulator` ile somut entegrasyon:** S1×N ve S2 (sonra gerekirse S3/S4) kontrollerini Cardia'nın EP manevra paneline uyarlayın. Her S olayı, yakalanan A/H/V ve blok/echo sonuçları aynı olay listesinde üretilsin. Hız ve uyarı yeri, yalnız durum yazısını değil olay saatini ve 3B yolu değiştirsin. Pause/review gerekiyorsa aynı kaydın zaman penceresini gezdirsin; ayrı `RingBuffer` fiziği kurmayın. Statik `SC` sürelerini veya otomatik indüksiyon eşiklerini kullanmayın.

### Faz B, dar QRS taşikardi karşılaştırma görevi

Mevcut AVNRT, AVRT, fokal AT ve PJRT olgularından özgün bir görev oluşturun. İlk görünüm tanıyı saklar. Kullanıcı kanal ve manevra seçer; sonuç paneli 'destekler', 'dışlamaz', 'yorumlanamaz' durumlarını ayırır. Özellikle proksimal CS erken A ve decremental retrograd VA iletimini otomatik kesin tanıya çevirmeyin. Yeni kayıt gerekiyorsa `src/ep-maneuver-sim.js` olay modeline ekleyin; sabit metinle sahte etkileşim kurmayın.

**Kabul:** Her kararın kullandığı olaylar ve ölçümler izlenebilir; capture yok, doğrudan A capture veya pacing sırasında taşikardi sonlanması gibi durumlar tanı üretmez; mevcut olguların sonuçları bozulmaz.

### Faz C, PAC/PVC kaynak bölgesi eğitimi

İki ayrı alıştırma: (1) atriyal odak için P dalgası ve atriyal kateter aktivasyon dizisi, (2) PVC için 12 derivasyonlu QRS morfolojisi ve anatomik çıkış bölgesi. İlk sürümde az sayıda anatomik bölge seçin; örnekleri sıfırdan üretin. Harita kateter örnekleme sınırlamasını gösterir. PVC görevi olası bölgeyi ve güven düzeyinin gerekçesini verir; 'kesin hedef' dili kullanmaz. Skar ve yapısal hastalık karşı örneği ekleyin.

**Kabul:** 12 derivasyonun zaman ve polarite ilişkisi tutarlı; seçilen bölge 3B'de görünür; belirsizlik ve alternatifler açıklanır; sentetik veri etiketi kalıcıdır. Klinik doğrulama olmadan doğruluk yüzdesi sunulmaz.

### Faz D, ileri EP olguları

Para-Hisian fokal AT, fasiküler VT ve BBR-VT için önce ayrı kaynak matrisi ve olay storyboard'u hazırlayın. Her olguda mekanizma, yüzey EKG, intrakardiyak kayıt, haritalama kanıtı, ayırıcı tanı ve tedavi sonlanımı bağımsız kontrol edilmeli. Faz A–C ve EP uzman incelemesi tamamlanmadan geniş katalog otomatik üretilmemeli.

## 5. Telif ve kaynak sözleşmesi

- EasyECG yalnız konu envanteri ve karşılaştırma bağlamı. Metin, grafik, ekran görüntüsü, video, hasta EKG'si, görsel düzen, başlık dizilimi ve Easy-WPW/Easy-PVC karar ağaçları yeniden çizilerek dahi aktarılmayacak.
- Açıklama, sorular, sentetik zaman çizgileri, 3B vurgular ve algoritma kararları bağımsız tasarlanacak. Her klinik iddia için birincil kılavuz, uzlaşı veya özgün çalışma ve iddianın hangi kısmını desteklediği kayıt altına alınacak. Kaynağa bağlantı vermek içerik kopyalama izni anlamına gelmez.
- Üçüncü taraf görsel ya da gerçek EKG ileride gerekirse ayrı lisans, atıf ve kullanım izni kontrolü yapılacak. Şimdiki fazlarda bunlar kullanılmayacak.
- Kaynak matrisi alanları: iddia; birincil kaynak DOI/URL; ilgili bölüm veya şekil; destek/istisna; erişim tarihi; içerik yazarı; EP uzman inceleme durumu. Sitenin kendisi klinik doğrulama kaynağı olarak bu matrise yazılmayacak.

## 6. Claude için uygulama talimatı

1. Önce `README.md`, proje talimatları, `research/ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md`, `src/ep-cases.js`, `src/ep-maneuver-sim.js`, `src/ep-case-text.js`, `src/ep-panel.js` ve ilgili testleri oku. `/Users/yh/Documents/projects/svtsimulator/index.html` dosyasını yalnız prototip davranışını anlamak için incele; yukarıdaki kod ve klinik sınırları uygula. Çalışma ağacındaki değişiklikleri koru. Kapsamı Faz A ile başlat; diğer fazlar için ayrı aşama planı çıkar.
2. Faz A'nın klinik kaynak matrisini ve sentetik olay storyboard'unu koddan önce yaz. Gerekli birincil kaynakların tam iddiaları destekleyip desteklemediğini kontrol et. Desteklenmeyen kuralı uygulama.
3. Olay modeli, görünüm, TR/EN metin ve testleri küçük adımlarla uygula. Mevcut 3B atlas yapılarını şematik iletim dokusundan ayır; ölçümleri tek olay listesinden üret.
4. Her faz sonrası `npm run check`, ilgili EP testleri, `npm test` ve `npm run build` çalıştır. Kullanıcı akışı değiştiğinde mevcut tarayıcı testini çalıştır veya anlamlı yeni uçtan uca kontrol ekle. Gerçek çıktıları raporla.
5. Diff'i klinik çıkarım, telif izi, sentetik veri etiketi, erişilebilirlik ve TR/EN tutarlılığı açısından incele. EP uzman incelemesi yapılmadıysa bunu açık bırak; 'klinik doğrulandı' deme. Commit/PR yalnız kullanıcı ayrıca isterse.

**Önerilen ilk teslim:** Faz A'nın çalışan laboratuvarı, kaynak matrisi, storyboard, test çıktıları ve kısa karar kaydı. Faz B–D bu rapordaki yol haritasıdır; tamamlandı diye işaretlenmez.

## 7. Kaynak ve inceleme kaydı

| Kaynak | Bu rapordaki kullanım | Durum |
|---|---|---|
| [EasyECG Articles](https://www.easy-ecg.com/articles) | Konu başlıkları ve site envanteri | Tarayıcıda 30 Eylül 2026 incelendi; içerik lisansı alınmadı |
| [EasyECG, VA conduction yazısı](https://www.easy-ecg.com/articles/r83bHw8rVW53hg4Tntyo) | Kısa kural yaklaşımının değerlendirilmesi | Tarayıcıda okundu; klinik kaynak kabul edilmedi |
| [2015 ACC/AHA/HRS SVT kılavuzu](https://www.jacc.org/doi/10.1016/j.jacc.2015.08.856) | SVT, AVNRT/AVRT, AP ve preeksitasyon çerçevesi | Yayınevi kaydı kontrol edildi; uygulama düzeyi iddialar yeniden doğrulanmalı |
| [2019 HRS/EHRA/APHRS/LAHRS VA uzlaşısı](https://www.hrsonline.org/resource/2019-hrsehraaphrslahrs-expert-consensus-statement-catheter-ablation-ventricular-arrhythmias/) | Yüzey EKG'siyle VA lokalizasyonunun sınırı | Kurum kaydı ve tam metin bağlantısı kontrol edildi; yeni senaryo iddiaları yeniden doğrulanmalı |
| [Mevcut EP geliştirme raporu](ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md) | Proje durumu ve mevcut içerik | 30 Eylül 2026 çalışma ağacından okundu |
| `/Users/yh/Documents/projects/svtsimulator/index.html`, `hemosim.html` | Yerel prototip özellikleri ve sınırları | 30 Eylül 2026 statik kod okuması; lisans/menşe ve klinik doğrulama yok |

**Yöntem:** Site kataloğunun tarayıcı görünümü, VA iletimi makalesi, mevcut proje raporu, ilgili kod envanteri ve yerel `svtsimulator` kaynakları karşılaştırıldı. Sayısal etki veya doğruluk analizi yapılmadı. Site başlıkları zamanla değişebilir; uygulamadan önce tekrar kontrol edin.

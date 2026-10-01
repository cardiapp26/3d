# Elektrofizyolojik anatomi: tanı, manevralar ve tedavi

Tarih: 30 Eylül 2026. Durum: araştırma ve geliştirme önerisi; ilk uygulama turu aynı gün ayrı bir çalışmayla yapıldı (aşağıda "Uygulama durumu"). Rapor gövdesi öneri metni olarak korunuyor.

## Tanı akışı güncellemesi (1 Ekim 2026)

Tipik AVNRT olgusunun Tanı sekmesine `avnrt-ah-jump` ve `avnrt-jump-echo` eklendi. Mevcut `avnrt-dual-echo` Manevralar sekmesinde aynı düzeltilmiş karşılaştırmayı kullanır. Her örnekte iki kısaltılmış 600 ms sürüş dizisi sonrası S1–S2 350 ve 340 ms; olaylardan ölçülen A2–H2 sırasıyla 100 ve 180 ms. Böylece 10 ms erkenlik artışına karşı AH 80 ms uzar. Önceki sürüş AH'si ile erken S2 AH'sinin karşılaştırılması, normal decremental iletimden sıçramayı ayırmaya yetmediği için kaldırıldı. Echo örneğinde son iletilen V'den 30 ms sonra His d kanalında tek uyarısız A döner; yeni H/V veya sürekli taşikardi çizilmez. Sayılar sentetik öğretim tasarımıdır. Tanı görünümünde yorum, manevra kartı ve zon kanıt açılana kadar gizlidir; pacing dizisi taşikardi aktivasyon haritasına gönderilmez.

Tanımın birincil araştırma dayanağı: Bayraktarova ve ark., *Correlation between the sudden jump-like increases of the atrio-Hisian interval induced during burst atrial pacing and during programmed atrial stimulation in patients with atrioventricular nodal reentrant tachycardia*, Indian Pacing Electrophysiol J. 2018;18:49–53, DOI [10.1016/j.ipej.2017.11.003](https://doi.org/10.1016/j.ipej.2017.11.003). İndekslenen araştırma metni 10 ms S2 azaltımında ≥50 ms AH artışı tanımını doğrular; scite metadata ve özet kontrolü yapıldı, tam metin erişimi `contentDenied` döndü. Jump ve tek echo'nun klinik AVNRT tanısını tek başına kesinleştirmediği ayrımı korunur (R9, R10; atriyal pacing storyboard P4/P8). Doğrulama: olay tabanlı karşılaştırma/echo regresyonları ve Tanı sekmesindeki tarayıcı akışı.

## Uygulama durumu (30 Eylül 2026, ilk tur)

Raporun 14. bölümdeki başlangıç önerisi uygulandı; faz 1-2 ve ilk karşılaştırma seti tamam, faz 3-5 açık. Kod: `src/ep-cases.js` (olgu/kayıt verisi), `src/ep-case-text.js` (TR/EN metin), `src/ep-egm.js` (genel çizici), `src/ep-panel.js` (panel). Testler: `scripts/test-ep-cases.mjs`, yeniden yazılmış `scripts/test-ep-egm.mjs` (ikisi de `npm test` içinde).

| Rapor maddesi | Uygulama |
|---|---|
| Ad değişikliği (bölüm 1) | Menü ve ders TR "Elektrofizyolojik anatomi", EN "Electrophysiological anatomy". Mod kimliği ve `#/mode/ablation` URL'si korundu (bölüm 10 uyumu). Arama testi yeni ada güncellendi. |
| İki ifade düzeltmesi (bölüm 2) | VA blok klibi "junctional ritim sırasında yeni VA blok" oldu: tipikte uyarı ama kesin AV blok kanıtı değil; atipikte retrograd yavaş yol kaybı ayrımı; antegrad AV iletim kayıttaki sinüs atımıyla gösteriliyor; siklus süresi bağlamlı özellik, otomatik tehlike sınırı değil. Tipik ve atipik VA blok klipleri ayrı (kabul 9). |
| Tanı / Manevralar / Tedavi (bölüm 4) | Sinyal panelinde üç sekme. Tanı ekranı mekanizmayı gizler (olgular numaralı), "Kanıtı göster" yorumu açar; sonuçlar "bu kayıt şu mekanizmayı destekliyor" dilinde. Manevra klipleri amaç/ön koşul/beklenen/çıkarım/tuzak kartı ve geçerli / yakalama yok / yetersiz kanıt durumunu taşır. Tedavi kliplerinde mekanizmaya özgü elektriksel sonlanım metni; RF reçetesi verilmez. |
| Kanallar ve kaliperler (bölüm 6) | Yüzey II/V1, HRA, His p/d, CS 9-10 … 1-2 (beş çift), RV, ABL d; klip başına kanal alt kümesi. Olay etiketleri A/H/V/S/delta. Kaliperler olay çiftlerinden ölçülür ve çizilen değer olay farkına eşittir (kabul 5, testle). Pencere uzunluğu klibe göre değişir; manevra klipleri pencere sınırında kesilmez (kabul 14). |
| Olgu sözleşmesi ve saat (bölüm 10) | Kayıtlar milisaniye zaman çizgisinde statik olaylardır; kalp animasyonu imleci EGM üzerinde artık çizilmez (tek pencereye normalize imleç kaldırıldı). Olgu alanları: mechanism, pathwayZone, conduction, citations; manevra sonucu üç durumlu. |
| İlk katalog (bölüm 9, 14) | 6 olgu, 20 kayıt: tipik AVNRT (taşikardi, negatif His-refrakter PVC, overdrive V-A-V + PPI, yakalama yok örneği, eski 4 tedavi klibi), atipik AVNRT, sol lateral concealed AP (storyboard 1: PVC ile A ilerlemesi), inferior paraseptal AP (storyboard 2), PJRT (iki hızda pacing ile decremental retrograd), manifest sol AP (storyboard 3: delta füzyonu, V-delta -15, RF sonrası sinüs ve ayrı retrograd test). CS ağzı zorunlu karşılaştırması (bölüm 5) dört tanı klibiyle panelde işaretli. |

**Yapılmayanlar:** faz 3 3B zon işaretleri (mitral/triküspit anulus zonları, RV pacing referansı 3B'de, Halo ve unipolar kanallar); 24 olgunun kalanı (fokal AT, CTI entrainment, antidromik AVRT, preeksitasyonlu AF, para-Hisian pacing olgusu, AH jump/echo); etkileşimli manevra akışı (kayıtlar önceden tasarlanmış statik kliplerdir; kullanıcı stimulus zamanlamaz); kullanıcı işaretleme/ölçüm görevleri; mobil tam ekran sinyal görünümü; mevcut CTI/PVI derslerinin üç bölüme dağıtılması (adımlar korunup son adıma panel bağlandı); EP uzmanı içerik onayı; ESC rehber içeriği lisans değerlendirmesi. Sinyal sayıları tasarlanmış sentetik zamanlamadır; storyboard değerleri kayıtlarda birebir kullanılmıştır ancak klinik doğrulama yoktur.

Yetki notu: raporu üreten çalışmanın yetkisi rapor dosyasıyla sınırlıydı; bu uygulama turu kullanıcının ayrı talimatıyla yapıldı ve `ep-report-provenance.json` içindeki rapor hash'i bu bölüm eklendiği için yeniden üretildi.

### İkinci uygulama turu (30 Eylül 2026): faz 3 ve katalog genişlemesi

Faz 3 uygulandı ve katalog 23 kayda çıktı. Kod: `src/ep-zones.js` (anulus zonları ve RV pacing referansı), `src/heart.js` ve `src/ep-panel.js` bağlantısı; test genişlemeleri `scripts/test-ep-cases.mjs` ve `scripts/test-ep-koch.cjs` içinde.

| İş | Uygulama |
|---|---|
| Zon matrisi 3B'de (bölüm 5, faz 3) | Ölçülen mitral (LA/LV) ve triküspit (RA/RV) anulus halkaları üzerinde 11 zon yayı: sol lateral / anterolateral / posterolateral, sağ lateral ve posterior-inferior, superior / orta / inferior paraseptal, Koch yavaş yol ve inferior uzantılar, CS/MCV seyri. Her zonun adı ve risk notu (koroner komşuluk, AV blok, "bütün sol AP'ler CS 1-2 yanlıştır" vb.) panelde ve 3B etikette; zonlar şematik bölge, lokalizasyon kuralı değil. |
| RV pacing referansı | RV apeksinde şematik kateter ucu; herhangi bir zonla birlikte görünür. |
| Panel-3B bağlantısı | Sinyal panelindeki aktif olgunun zonu 3B'de çizilir. Tanı bölümünde nötr görünüm zonu da gizler ("ilk ekran tanıyı açık etmez"); kanıt açılınca zon görünür. Moddan veya panelden çıkınca zon temizlenir. |
| Olgu 02: çift fizyoloji / echo | Atriyal ekstrastimulus klibi: 600 ms sürüşte AH 80 ms, erken S2'de 180 ms'ye sıçrama ve tek atriyal echo; taşikardi başlamaz. Kart tuzağı: AH sıçraması tek başına klinik AVNRT kanıtı değildir. Yeni "atriyal ekstrastimulus" manevra kartı. |
| Olgu 10: aynı yol ile ortodromik AVRT | Manifest olguya dar QRS taşikardi klibi: delta yok, HV 45 ms (antegrad kol düğüm), eksantrik retrograd A. WPW paterni ile taşikardi ayrımı. |
| Olgu 22: preeksitasyonlu AF | Ayrı acil durum olgusu: düzensiz RR (sabit desen, RNG yok), değişken preeksitasyon, bir dar füzyon atımı, atriyal kanallarda fibrilasyon aktivitesi. SPERRI kaliperi olaylardan 220 ms. Metin: dar QRS algoritması uygulanmaz; AV düğüm blokerleri ve IV amiodaron zarar verebilir; hemodinami ve kardiyoversiyon birlikte; doz verilmez; ESC ≤ 250 ms özellikleri ölçüm koşullarıyla, tek eşik otomatik hüküm değil (R3, R14). |

**Bu turda da yapılmayanlar:** kalan katalog (fokal AT, CTI entrainment/çift yönlü blok pacing içeriği, antidromik AVRT, para-Hisian pacing olgusu, ileri katalog); Halo ve unipolar kanallar; etkileşimli manevra akışı ve kullanıcı işaretleme görevleri; mobil tam ekran sinyal; derslerin üç bölüme dağıtılması; EP uzman onayı; ESC lisans değerlendirmesi. Zon yayları atlas geometrisinden ölçülür ama klinik haritalama doğrulaması değildir.

### Üçüncü uygulama turu (30 Eylül 2026): manevra ve katalog genişlemesi

Katalog 28 kayda çıktı; testler ve tarayıcı denetimi genişletildi.

| İş | Uygulama |
|---|---|
| Para-Hisian pacing (bölüm 7) | Yeni manevra kartı (amaç / ön koşul / beklenen / çıkarım / tuzak; R4): V yakalaması korunmalı, doğrudan A capture dışlanmalı, doğru S-A ölçümü, "nodal yanıt = AP yok" kuralı yok, sinüs pacing'i ile taşikardi entrainment'ı aynı test değil. İki klip: tipik AVNRT olgusunda nodal yanıt (His capture kaybında S-A 100'den 145 ms'ye uzar, dizi korunur) ve inferior paraseptal AP olgusunda extranodal yanıt (S-A 95 ms, değişmez). |
| Olgu 23: fokal AT | Kristal fokal AT: uzun RP, en erken A HRA'da; CS ağzı setiyle karşılaştırma metni. VOP klibi A-A-V yanıtını gösterir (pacing sonrası V gelmeden iki A) ve V-A-V ile karşıtlar; pseudo-A-A-V tuzağı kartta. Tedavi klibi yoktur ve olmadığı açıkça yazılıdır. Zon metni krista terminalis; 3B zon yayı bu tur çizilmez. |
| Olgu 21: antidromik AVRT | Manifest olguya geniş QRS taşikardi klibi: her atım tam preeksite (sinüs deltasıyla aynı yön), anüler ABL lokal V geniş QRS'i önceler, retrograd A konsantrik (düğüm kolu). VT ayrımının tek kayıtla yapılmadığı yazılıdır. |
| Sinyal büyütme | Panelde Büyüt/Küçült düğmesi (240/420 px); olgu, klip ve kaliperler korunur. Mobil tam ekran görünümün kısmi karşılığıdır. |

**Hâlâ yapılmayanlar:** CTI entrainment ve çift yönlü blok pacing içeriği (raporun kendisi bunu güncel konsensus doğrulamasına bağlar), Halo ve unipolar kanallar, ileri katalog (çoklu AP, bystander, oblik yol, mekanik blok, doğrudan A capture tuzağı, nodofasiküler), etkileşimli manevra akışı ve kullanıcı işaretleme görevleri, derslerin üç bölüme dağıtılması, EP uzman onayı, ESC lisans değerlendirmesi.

### Dördüncü uygulama turu (30 Eylül 2026): bölüm 15 açık işleri ve AV dissosiyasyonu sınırı

Bölüm 10'daki model sınırı ve bölüm 15'teki yedi iş kod, test ve tarayıcı denetimiyle ele alındı. Katalog 9 olgu, 43 kayıt. Kod: `src/ep-beats.js` (vuruş kurucuları, `ep-cases.js`'ten ayrıldı), `src/ep-maneuver-sim.js` ve `src/ep-sim-panel.js` (etkileşimli manevra), `src/ep-fullscreen.js`, `src/ep-activation-map.js`; `src/ep-zones.js`, `src/ep-egm.js`, `src/ep-panel.js` genişletildi. AV dissosiyasyonu için `src/cycle-channels.js`, `src/animation-channels.js`, `src/heart.js`, `src/jvp-timeline.js`. Testler: yeni `scripts/test-ep-sim.mjs` (npm test) ve `scripts/test-ep-flow.cjs` (`npm run test:ep-flow`); `test-ep-cases.mjs`, `test-ep-egm.mjs`, `test-ep-koch.cjs`, `test-jvp-timeline.mjs`, `test-jvp-browser.cjs` genişletildi. Kontrol, birim testleri, derleme ve 16 tarayıcı testi geçti.

| Açık iş | Yapılan | Kapanış kanıtından karşılanan | Karşılanmayan |
|---|---|---|---|
| AV dissosiyasyonu 3B (bölüm 10, kabul 16) | Kanal ağırlıkları ayrı atriyal faz alabiliyor (`atrialPhase`); JVP AV dissosiyasyonu şeridi atriyal saati üretir ve 3B atriyumlar onu, ventriküller ventrikül saatini izler. P ile atriyal kasılma arasındaki gecikme şematik ve açıkça tanımlı (şablon pPeak ile atriyal sistol ortası arası, yaklaşık 0,09 s); JVP a/cannon dalgaları da aynı gecikmeyi kullanır. Sınır metni güncellendi. | Birim test: her atriyal olayda atriyal kasılma kanalı tepe yapar, atriyal ve ventriküler fazlar kayar. Tarayıcı: 3B atriyumlar her A olayında kasılır, ventrikül fazı her olayda farklıdır, bir cannon a ventrikül kasılmasına denk gelir. | EP olgularında (klip EGM'leri) 3B kalp kayda bağlı değildir; kalp animasyonu yalnız JVP şeritlerinde olay saatine bağlıdır. Elektromekanik gecikme fizyolojik olarak doğrulanmadı. |
| Fokal AT | Başlangıç kaydı, atriyal aktivasyon dizisi haritası (kanal tabanlı, "elektroanatomik harita değil" etiketli), A-A-V yanıtlı VOP, pacing sırasında sonlanan tanısal olmayan VOP, fokal AT / AVNRT / ortodromik AVRT açıklamalı karşılaştırma kartı, 3B'de krista üst üçte biri. | Olay dizileri tam kanal; harita en erken kanalı HRA bulur (test); tarayıcıda olgu akışı çalışır. | EP içerik incelemesi. |
| CTI entrainment (olgu 24) | Tipik saat yönü tersi flutter (Halo ile), CTI'den 225 ms entrainment (pacing sırasında dizi flutter ile aynı, PPI olaylardan 250 ms), yakalama yok ve sonlanan denemeler (PPI yok), ablasyon öncesi/sonrası proksimal CS pacing ve sonrası düşük lateral RA pacing ile ayrı çift yönlü blok değerlendirmesi (Halo dizisi, istmus geçiş süresi, çift potansiyel). | Ölçümler olaylardan; geçersiz entrainment örneği; tarayıcıda uçtan uca akış. Blok ölçütleri R15 ile karşılaştırıldı (aşağıda). | "Güncel kaynakla içerik doğrulaması" kısmi: PPI-TCL için birincil kaynak tam metni okunamadı; metin 20 ms civarını "kesin eşik değil" diye verir. Güncel konsensus taraması yapılmadı. |
| Antidromik AVRT | Olgu verisinde antegrad kol (AP) ve retrograd kol (düğüm) açık; geniş QRS kaydı; VT ayırıcı tanı kartı; 3B'de seçilen devrenin yönlü okları (antidromik ve ortodromik ayrı, duvar arkasında kalmaması için üstte çizilir). | Test: her atımda anüler V, delta ve QRS sırası tutarlı; devre yalnız kanıt açıkken görünür. | EP içerik incelemesi. |
| Para-Hisian pacing olgusu (olgu 16) | Ayrı superior paraseptal olgu: taşikardi, His+RV / yalnız RV yakalama etiketli extranodal klip, S-A ve H-A referanslı nodal karşılaştırma, doğrudan A yakalama (yorumlanamaz), ablasyon sonrası sinüs. Kart başlığı "sinüste; entrainment değil". Etkileşimli manevrada saf His yakalama ve doğrudan A yakalama seçenekleri. | Test ve tarayıcı: yakalama etiketleri, H-A sabit / S-A uzar, doğrudan A yakalama geçersiz, başlık ayrımı. | EP içerik incelemesi. |
| Halo / unipolar | Sağ annüler Halo (şematik dekapolar, 5 bipol) 3B'de ölçülen triküspit halkası boyunca; ABL unipolar kanal; manifest olguda iki aday noktada bipolar ve unipolar (rS ve QS) eşzamanlı karşılaştırma (R8). Kanal-elektrot kimlik tablosu (`CHANNEL_ELECTRODES`). Kanal seçimi (varsayılan dışındaki kanallar da açılabilir). | Tarayıcı: her bipolün 3B elektrotları var; Halo 1-2 İVK/CTI'ye, CS 9-10 CS ağzına daha yakın; kanal seçimi klip değişince korunur. Çizim aynı olay listesinden. | Gerçek Halo 20 kutupludur (burada 10); yakın/uzak alan açıklaması yalnız metinde. |
| Etkileşimli manevra akışı | Manevralar sekmesinde "Manevrayı sen uygula": His-refrakter PVC (uyarı zamanı), ventriküler overdrive (siklus ve RV apeks/bazal), para-Hisian (çıkış/yakalama). Uyarı ve yakalama geri bildirimi, sonuç ve gerekçe, kaliperler, şeride tıklayarak inceleme, "Yeniden dene". Model saf fonksiyondur. | Test: 189 seçim kümesi; seçim kaydı değiştirir; H'den önce, refrakter ventrikül, TCL'den yavaş veya sonlandıran pacing ve doğrudan A yakalama tanısal sonuç vermez; aynı seçim aynı kayıt; tarayıcıda uçtan uca akış. | Manevra değerleri tasarlanmış öğretim değerleridir; stimulus zamanlaması sürüklenerek değil kaydırıcıyla seçilir. |
| Mobil tam ekran sinyal | Tam ekran görünüm: aynı kanal, zaman ölçeği, kaliper ve olgu durumu; yakınlaştırma düğmeleri, zaman kaydırıcısı, yatay kaydırma (dokunma), Escape ve Kapat, odak açan düğmeye döner. Panelde zaman yakınlaştırma (1-4×) ve kaydırma. | Tarayıcı: dikey 390×844 ve yatay 844×390'da tuval ekranı doldurur, taşma yok; kaydırma zamanda ilerletir; kapatınca durum korunur. | Gerçek cihazda (dokunmatik donanım) deneme yapılmadı; testler masaüstü tarayıcının mobil görünüm boyutudur. |

**Kapanmayan ortak koşul:** Bölüm 15'in her satırındaki EP içerik incelemesi ve raporun istediği uzman onayı yapılmadı; bu nedenle işler "uygulandı ve test edildi" durumundadır, rapordaki tanımla "kapandı" sayılmamalıdır. ESC lisans değerlendirmesi de açıktır.

**Bu turda eklenen kaynak:** R15 (aşağıda, bölüm 13 sonunda).

## 1. Karar ve kapsam

“Ablasyon anatomisi” adı **“Elektrofizyolojik anatomi”**, İngilizcesi **“Electrophysiological anatomy”** olmalı. Modül, anatomik hedeflerden elektriksel mekanizmaya, tanısal manevraya ve tedavi sonlanımına uzanmalı. Ana bölümler **Tanı / Manevralar / Tedavi**; her bölümde aynı olgunun 3B anatomisi ve sinyalleri korunmalı.

Araştırma sorusu: mevcut Koch/AVNRT ağırlıklı eğitim, aksesuar yolun iletim yönünü ve anatomik zonunu ayrı tanımlayan, manevraları bağlam içinde öğreten bir EP modülüne nasıl genişletilir?

Bitmiş geliştirme için ölçüt: kullanıcı bir sinyalin kaynağını, olası mekanizmaları, seçtiği manevranın geçerliliğini, hedef zonun risklerini ve işlem sonrası beklenen elektriksel değişikliği açıklayabilmeli. Bu raporun bitiş ölçütü, kaynaklı içerik matrisi, senaryo kataloğu, mevcut koda uyarlama planı ve doğrulama gerekliliklerinin teslimidir. Hasta kohortu ve istatistiksel hipotez testi yoktur.

Öncelikli kapsam AVNRT ve AVRT/aksesuar yoldur. Mevcut CTI, PVI ve lineer hat dersleri korunmalı; yeni yapıya taşınmalı. Fokal AT ve PJRT ayırıcı tanı için eklenmeli. Ayrıntılı AF/VT simülasyonu sonraki kapsam kararıdır.

## 2. Mevcut uygulama ve açıklar

Kaynak dosyaları ve önceki ablasyon raporu incelendi. Bulgular canlı tarayıcı gözlemi değildir.

| Mevcut unsur | Kaynak | Yeni ihtiyaç |
|---|---|---|
| Menü adı “Ablasyon anatomisi” / “Ablation anatomy” | `src/content.js` | Menü, ders başlığı, arama ve TR/EN metinlerini birlikte değiştirme |
| CTI, Koch, PVI, kombine harita ve EGM adımları | `src/content.js` | Tanı, manevra ve tedavi akışına dağıtma |
| Sinüs, yavaş yol hedefi, RF junctional, junctional VA blok | `src/ep-egm.js` | AVNRT taşikardisi, manifest/concealed AP, pacing ve işlem sonrası kayıtlar |
| HRA, His p/d, CS 9–10, CS 1–2, ABL d | `src/ep-egm.js` | Ara CS çiftleri, RV ve yüzey ECG; gerektiğinde Halo/unipolar |
| Her senaryoda 1200 ms pencere; sabit örnek AH/HV/VA | `src/ep-egm.js` | Manevraya göre uzunluk, olay tabanlı kaliperler, değişken ritim |
| EGM yalnız `ablation` modunun `egm` içeren ders adımlarında açılıyor | `src/main.js` | Her üç bölümden aynı olgu/sinyal paneline erişim |
| His ve CS referansları; yavaş yol kateteri ve Koch yakın planı | `src/ep-landmarks.js` | Mitral/triküspit zonları ve RV pacing referansı |
| CS ağzı kestirim, ileti dokusu ve hedefler şematik | `src/content.js`, önceki rapor | Kaynak etiketlerini yeni zonlarda sürdürme |
| Testler dört senaryoyu ve altı kanalı sabit listelerle doğruluyor | `scripts/test-ep-egm.mjs` | Yeni kataloğu ve fizyolojik tutarlılığı sınayan testlere geçiş |

**Önce düzeltilmesi gereken iki ifade:**

1. VA blok bütün AVNRT tiplerinde aynı anlama gelmez. Tipik slow-fast AVNRT'de önceden mevcut VA iletiminin RF sırasında yeni kaybı uyarıdır; kesin AV blok kanıtı değildir. Atipik AVNRT'de retrograd yavaş yolun ortadan kalkmasıyla da görülebilir. Antegrad AV iletim sinüs veya atriyal paced atımlarda ayrıca gösterilmelidir. Bu ayrım, “VA blok güvenlidir” şeklinde ters bir genellemeye de dönüştürülmemeli. [R1](https://academic.oup.com/europace/article/10/8/982/555962)
2. Mevcut uyarı senaryosunun yaklaşık 470 ms siklusu kodda “hızlı” diye niteleniyor. Siklus sayısını otomatik tehlike sınırı olarak sunmak yerine “junctional ritim sırasında yeni VA blok” başlığı kullanılmalı; hız ayrı ve bağlamlı özellik olmalı. Junctional ritim tek başına başarı sonlanımı değildir. [R2](https://www.jacc.org/doi/10.1016/j.jacep.2018.09.012)

## 3. Bilimsel sınıflandırma

**WPW bir zon değildir. Concealed bir taraf değildir.** Senaryo seçimi en az üç ayrı eksende yapılmalı:

| Eksen | Değerler | Öğretim amacı |
|---|---|---|
| İletim | Antegrad, retrograd, iki yönlü; decremental/nondecremental | Preeksitasyon ve AVRT olasılığını ayırma |
| Anatomi | Sol/sağ serbest duvar, superior/orta/inferior paraseptal, CS/venöz bağlantı | Kayıt yeri, hedef ve risk ilişkisi |
| Ritim | Sinüs, atriyal pacing, ventriküler pacing, ortodromik/antidromik AVRT, AF | Aynı yolun farklı ritimlerdeki görünümü |

Manifest AP antegrad preeksitasyon oluşturabilir. WPW paterni ile aritmiyle ilişkili WPW sendromu ayrılmalı. Concealed AP, antegrad preeksitasyon oluşturmayan retrograd iletimli yoldur; ortodromik AVRT yapabilir. Sinüste delta görülmemesi, tek başına concealed AP kanıtı değildir; aralıklı veya az belirgin preeksitasyon da düşünülür. Salt concealed yol için antegrad AP üzerinden preeksitasyonlu AF mekanizması öğretilmez. Ortodromik AVRT'de antegrad kol AV düğüm/His-Purkinje, retrograd kol AP'dir; antidromik AVRT'de antegrad kol AP'dir. [R3](https://www.jacc.org/doi/10.1016/j.jacc.2015.08.856)

Decremental retrograd AP/PJRT, “bütün AP'ler nondecremental” kuralına karşı olgudur. Geç A ve konsantrik aktivasyon, nodal mekanizma için tek başına yeterli değildir. [R4](https://pubmed.ncbi.nlm.nih.gov/8790042/)

## 4. Kullanıcı akışı

Üst bölüm: **Tanı | Manevralar | Tedavi**. İkinci satır: **AVNRT | Aksesuar yollar | Atriyal taşikardi / flutter | AF / PVI**. Bunlar önerilen arayüzdür, uygulanmış değildir.

### Tanı

Olgu ritmi ve kanal düzeni açılır. Kullanıcı A/H/V/S olaylarını işaretler, AH/HV/VA/TCL ölçer, en erken lokal aktivasyonu seçer ve olası mekanizmaları listeler. İlk ekran tanıyı açık etmez; “kanıtı göster” açıklamalı moda geçer. Sonuç “bu kayıt şu mekanizmayı destekliyor” biçiminde verilir; tek sinyal üzerinden kesin tanı üretilmez.

### Manevralar

Pacing yeri, ritim ve yakalama bilgisi görünür. Akış **önce kayıt → stimulus → ilk yanıt → taşikardinin sonraki siklusu** şeklindedir. Kullanıcı geçerli/yorumlanamaz yanıt ayrımını da yapar. Yanlış yakalama veya yanlış zamanlama için “tanısal değil” sonucu gerekir.

### Tedavi

Zonun anatomisi, hedef sinyali ve risk yapıları birlikte görünür. Akış **işlem öncesi → hedefte kayıt → iletim değişikliği → yeniden değerlendirme**. Başarı düğmesi yerine mekanizmaya özgü sonlanım gösterilir. RF/kriyo enerji fiziği modellenmiyorsa uygulama zamanı, watt veya sıcaklık reçetesi verilmez.

3B kalp, EGM ve açıklama aynı görünümde tutulmalı. EGM ders metninin altında kaybolmamalı. Mobilde sinyal tam ekran açılabilmeli; geri dönüş aynı olgu ve kaliperleri korumalı. Mevcut C-arm iki görünümde de erişilebilir kalmalı.

## 5. Aksesuar yol zon matrisi

**Aşağıdaki aktivasyonlar beklenen öğretim örüntüleridir; sabit lokalizasyon kuralları değildir.** Kateter pozisyonu, atriyal/ventriküler insersiyon farkı, oblik yol, pacing yeri ve birden çok yol sonucu değiştirebilir. CS elektrot numarası anatomik koordinat olarak kullanılamaz. Tablo, anatomik zon adları ile geleneksel EP adlarını birlikte sunar. [R5](https://pmc.ncbi.nlm.nih.gov/articles/PMC2907089/)

| Zon | Önerilen kayıt örneği | Hedef/ablasyon öğretimi | Risk veya tuzak |
|---|---|---|---|
| Sol lateral / sol serbest duvar | Retrograd iletimde distal CS tarafında erken A; lokal ABL annüler A daha erken olabilir | Mitral anulus; transseptal ve retrograd aortik erişim farkını göster | Distal CS'de erken A, tek başına kesin hedef veya AP katılımı değildir |
| Sol anterior/anterolateral | Anterior mitral haritada erken A/V; CS dizisi tek başına yetersiz kalabilir | Atriyal ve ventriküler insersiyonu ayrı göster | “Bütün sol AP'ler CS 1–2” yanlıştır |
| Sol posterior/posterolateral | Ara veya proksimale yakın CS çiftlerinde erken A olabilen örnek | Posterior mitral anulus ile venöz alternatifleri karşılaştır | Oblik yol nedeniyle antegrad/retrograd en erken noktalar farklı olabilir |
| Sağ lateral/anterolateral | Sağ annüler ABL/Halo'da erken A; CS erken olmayabilir | Triküspit anulus boyunca annüler harita | HRA'nın erken oluşu yalnız kateterin ilgili insersiyona yakınlığıyla anlamlıdır |
| Sağ posterior/inferior | Posterior sağ anulus çevresinde erken A | Sağ inferior anulus ile CS ağzının ayrımı | Proksimal CS referansı tüm sağ serbest duvarı örneklemez |
| Superior paraseptal / para-Hisian; geleneksel anteroseptal | His çevresinde erken A; lokal ABL'de H bulunabilir | İleti sistemi komşuluğu; RF/kriyo seçeneklerini kavramsal karşılaştır | AV blok riski; H sinyalinin yakın/uzak alan ayrımı |
| Orta paraseptal; geleneksel midseptal | Septal kayıtlarda kısa VA ve konsantrik örüntü | AV düğüm çevresindeki risk alanı | AVNRT ile görünüm çakışabilir; katılım manevrası gerekir |
| Inferior paraseptal; geleneksel posteroseptal | CS ostiyumu/proksimal CS veya komşu septal ABL'de erken A | Sağ endokardiyal, sol endokardiyal ve venöz kaynakları ayrı haritalama | CS ağzı, Koch yavaş yol hedefi ve AP aynı yapı değildir |
| CS/MCV/PCV bağlantısı, divertikül boynu | Venöz kayıtta erken aktivasyon/AP-benzeri potansiyel; endokardiyal kayıt daha geç | CS kas kılıfı ve ventriküler bağlantı; venöz anatomi | Koroner komşuluk, ven hasarı; normal görünen CS bağlantıyı dışlamaz |

Son satırın anatomik temeli CS kas kılıfının venöz uzantılarıdır. Divertikül bütün olgularda bulunmaz; ayrı öğretim varyantı olmalı. [R6](https://pubmed.ncbi.nlm.nih.gov/12221053/)

CS/MCV ablasyonunda koroner yakınlık özel risk katmanı gerektirir. Birincil araştırma RF hasarının arter mesafesiyle ilişkili olduğunu gösterir; çalışmadaki mesafeler uygulamanın atlasında güvenlik eşiklerine dönüştürülmemeli. Model gerçek arter-hedef uzaklığı veya termal hasar hesaplamıyor. [R7](https://pubmed.ncbi.nlm.nih.gov/24365648/)

### CS ostiyumu için zorunlu karşılaştırma

Aynı anatomik görünümde dört kayıt hazırlanmalı: **tipik AVNRT / atipik AVNRT / inferior paraseptal AP-AVRT / PJRT**. Kullanıcı önce proksimal erken A'nın yetersizliğini görmeli; sonra manevrayla ayırmalı. Ek “CS/MCV bağlantısı” kaydında endokardiyal ve venöz aktivasyon ayrı işaretlenmeli. [R1](https://academic.oup.com/europace/article/10/8/982/555962), [R4](https://pubmed.ncbi.nlm.nih.gov/8790042/), [R6](https://pubmed.ncbi.nlm.nih.gov/12221053/)

## 6. Sinyal paneli ve ölçüm sözleşmesi

### Kanal düzeni

Çekirdek: yüzey ECG II/V1, HRA, His p/d, RV, CS 9–10 / 7–8 / 5–6 / 3–4 / 1–2, ABL bipolar. İleri görünüm: ABL unipolar ve sağ anulus için Halo. Seçilebilir kanal seti ekran yoğunluğunu azaltır.

Mevcut model sözleşmesinde CS 9–10 proksimal/ostiyal, CS 1–2 distal. Yerleşim şeması her kayıtta açılabilir olmalı; fiziksel elektrotlardan kaydedilen bipolar çift ile 3B işaret aynı kimliği paylaşmalı.

Olay etiketleri **A, H, V, S ve aday AP potansiyeli**. AP potansiyeli ayrı aday sınıfı olmalı; her hedefte zorunlu çizilmemeli. Lokal V ile yüzey QRS başlangıcı farklı olaylardır. Uzak alan sinyallerini açık etiketleyen öğretim modu gerekir.

### Kaliperler

| Ölçüm | Tanım |
|---|---|
| AH | Seçilen His kanalında atriyal başlangıçtan His başlangıcına |
| HV | His başlangıcından tanımlanmış en erken ventriküler başlangıca; yüzey/intrakardiyak referans görünür |
| Lokal AV | Aynı hedef kanalında A başlangıcından V başlangıcına |
| Lokal VA | Aynı hedef kanalında V başlangıcından A başlangıcına |
| Septal VA | Açıkça seçilmiş ventriküler referanstan septal A'ya; lokal VA ile karıştırılmaz |
| V–delta | Lokal V başlangıcı eksi yüzey delta başlangıcı; negatif değer lokal V'nin erkenciliğini gösterir |
| TCL | Taşikardinin aynı olayına ait ardışık başlangıçlar arasındaki süre |
| PPI | Son pacing stimulusundan pacing yerindeki ilk geri dönüş aktivasyonuna; olay uçları gösterilir |
| SA–VA | Pacing sırasında S→A ile taşikardi sırasında tanımlı V→A farkı |

Filtre, hız ve kazanç verileri gerçek kayda ait değilse “sentetik gösterim ayarı” diye belirtilmeli. Milivolt ölçeği fiziksel kalibrasyon olmadan verilmemeli; mevcut genlikler bağıl birimlerdir.

WPW sinüs kaydı normal `sinusBeat` üzerine erken V eklenerek oluşturulmamalı. Yüzey delta, lokal preeksitasyon, His ve normal sistemden gelen ventriküler aktivasyon birlikte tanımlanmalı; iki dalın füzyonu görünür olmalı. Concealed örnekte sinüs ECG'si normal olabilir; tanısal fark retrograd pacing/AVRT kaydında açılır.

Unipolar erken negatif defleksiyon/QS ve bipolar A–V sürekliliği öğretilebilir; hiçbiri tek başına başarılı hedef garantisi değildir. Bir olgu, iyi görünen bipolar kaydın unipolar elektrot karşılaştırmasıyla yeniden değerlendirilmesini göstermelidir. [R8](https://pmc.ncbi.nlm.nih.gov/articles/PMC4750162/)

## 7. Tanısal manevralar

Her manevra **amaç / ön koşul / beklenen yanıt / çıkarım / tuzak** kartı taşımalı. Tanı ve mekanizmaya katılım ayrı sonuç alanlarıdır. Temel manevra kapsamı iki eğitim derlemesiyle eşleştirilmiştir; ayrıntılı kararlar aşağıdaki birincil deneylerle sınırlandırılır. [R9](https://pubmed.ncbi.nlm.nih.gov/21438892/), [R10](https://pubmed.ncbi.nlm.nih.gov/22385228/)

| Manevra | Öğretilecek yanıt | Sınır / yorumlanamaz durum |
|---|---|---|
| Atriyal ekstrastimulus | AH'de ani uzama, echo, AVNRT indüksiyonu; AP antegrad iletimin değerlendirilmesi | AH jump tek başına klinik AVNRT kanıtı değildir |
| Ventriküler pacing | Retrograd A dizisi; konsantrik/eksantrik, decremental/nondecremental iletim | En erken A yolun varlığı/konumu için ipucu, devreye katılım için yeterli değil |
| His-refrakter PVC | A'nın ilerlemesi/gecikmesi, taşikardi siklusunun resetlenmesi veya araya yeni A girmeden terminasyon | His refrakterliği ve ventriküler capture doğrulanmalı; negatif yanıt AP'yi dışlamaz |
| Ventriküler overdrive pacing | Entrainment sonrası V–A–V veya A–A–V dizisi; PPI ve SA–VA | Entrainment yoksa hesap tanısal değildir; pseudo-A–A–V ve decremental yol örnekleri gerekir |
| Para-Hisian pacing | His capture kaybında SA'nın ve A dizisinin değişimi | V capture korunmalı, doğrudan A capture dışlanmalı; “VA” yerine doğru S–A ölçümü kullanılmalı |
| Para-Hisian entrainment | Taşikardi sırasında capture değişimi ve devre uzaklığı | Sinüsteki para-Hisian pacing ile aynı test değildir |
| Diferansiyel RV pacing | Apeks ve bazal pacing'den devreye uzaklık farkı | Farklı capture, pacing siklusu ve AV nodal gecikme karşılaştırmayı bozabilir |
| Atriyal overdrive pacing | VA linking ve farklı atriyal yerlerden yanıt | AT ayrımında yardımcı; tek yanıtı evrensel kural yapma |
| Dal bloğu sırasında kayıt | Aynı taraftaki serbest duvar AP'sinde VA/TCL değişimi | Her AP'de beklenmez; nodal gecikme ve uzak alan referansı sonucu etkiler |

**His-refrakter PVC:** Bir A'yı ilerletmek retrograd bağlantı lehine güçlü kanıttır. A ilerlese de sonraki H/V ve taşikardi zamanlaması değişmiyorsa bystander bağlantı düşünülmelidir. Devre reseti veya uygun koşullarda A'ya ulaşmadan terminasyon, katılım için daha güçlü kanıttır. Nadiren nodofasiküler/nodoventriküler bağlantılar benzer yanıt yaratır; ileri olgu bu istisnayı göstermeli. [R10](https://pubmed.ncbi.nlm.nih.gov/22385228/), [R11](https://www.jacc.org/doi/10.1016/j.jacep.2020.07.007)

**Para-Hisian pacing:** His/RB capture kaybolurken RV capture sürüyor ve S–A/dizi değişmiyorsa extranodal yanıt; S–A uzuyor, H–A ve dizi korunuyorsa nodal yanıt desteklenir. Aktivasyon dizisinin değişmesi birleşik iletimi düşündürür. Saf His capture, doğrudan A capture ve dal hastalığı ayrıca kontrol edilmelidir. Uzak sol yol veya yavaş retrograd AP, nodal iletim tarafından maskelenebilir. “Nodal yanıt = AP yok” kuralı kullanılmamalı. [R4](https://pubmed.ncbi.nlm.nih.gov/8790042/)

**PPI–TCL / SA–VA:** Klasik RV pacing çalışmasında >115 ms ve >85 ms, atipik AVNRT lehineydi; çalışma septal AP-ORT ile karşılaştırmadır. Bu değerler bütün zonlara uygulanacak kesin eşikler değildir. AH uzaması, pacing yeri ve decremental yol ayrıca gösterilmeli; düzeltilmiş/düzeltilmemiş PPI ayrı adlandırılmalı. [R12](https://pubmed.ncbi.nlm.nih.gov/11583898/)

Yanıltıcı ilk manevraların ardından para-Hisian entrainment ile septal AP'nin gösterildiği olgu, “tek teste güvenme” eğitim kartına uygundur. Olgu raporu genellenebilir doğruluk ölçümü değildir. [R13](https://pmc.ncbi.nlm.nih.gov/articles/PMC6379302/)

## 8. Tedavi ve elektriksel sonlanımlar

| Mekanizma | Tedavi görünümünün içeriği | Öğretilen elektriksel sonlanım |
|---|---|---|
| AVNRT | Inferior nodal uzantı, Koch/His ilişkisi; tipik ve atipik RF yanıtı | Klinik AVNRT'nin yeniden indüklenememesi ve AV iletimin korunması; junctional ritim tek başına yeterli değil [R2](https://www.jacc.org/doi/10.1016/j.jacep.2018.09.012) |
| Manifest AP | Antegrad erken V, retrograd erken A, insersiyonlar, işlem öncesi/sonrası ECG | Mevcut AP iletim yönlerinin ortadan kalkması; yalnız delta kaybı tüm retrograd iletimi değerlendirmez [R3](https://www.jacc.org/doi/10.1016/j.jacc.2015.08.856) |
| Concealed AP | V pacing/AVRT'de retrograd haritalama; delta yokluğu olağan olabilir | AP üzerinden retrograd iletimin kaybı; kalan nodal VA iletimin ayırt edilmesi [R4](https://pubmed.ncbi.nlm.nih.gov/8790042/) |
| Para-Hisian AP | H yakınlığı, AV iletim izleme, RF/kriyo karşılaştırması | Yol iletimi ve normal ileti sisteminin ayrı değerlendirilmesi [R5](https://pmc.ncbi.nlm.nih.gov/articles/PMC2907089/) |
| CS/MCV bağlantısı | Venöz aktivasyon, olası divertikül, komşu koroner | AP iletiminin kaybı ve venöz/koroner riskin ayrı değerlendirilmesi [R6](https://pubmed.ncbi.nlm.nih.gov/12221053/), [R7](https://pubmed.ncbi.nlm.nih.gov/24365648/) |
| CTI flutter | Mevcut hat korunur; pacing yerleri ve blok kontrolü eklenir | Çift yönlü CTI blok; yalnız flutter terminasyonu yeterli değildir |
| AF/PVI | Mevcut antral harita korunur; PV potansiyeli örnekleri ileri faza ayrılır | PV iletiminin değerlendirilmesi; görsel lezyon halkası elektriksel izolasyon kanıtı değildir |

CTI/PVI satırları mevcut derslerin yeni yapıya taşınma çerçevesidir; ayrıntılı yeni pacing/izolasyon içeriği üretimden önce ilgili güncel konsensusla ayrıca doğrulanmalıdır.

**Preeksitasyonlu AF ayrı acil durum olgusudur.** Düzenli dar QRS taşikardi algoritması bu kayda uygulanmamalı. AV düğümü bloke eden ilaçlar ve intravenöz amiodaron potansiyel zarar içerir; hemodinamik durum ve kardiyoversiyon değerlendirmesi görünür olmalıdır. Doz ve otomatik tedavi önerisi üretilmez. [R3](https://www.jacc.org/doi/10.1016/j.jacc.2015.08.856)

Asimptomatik manifest preeksitasyon için risk eğitimi ayrı kart olmalı: AF sırasında SPERRI, AP ERP, çoklu AP ve indüklenebilir AP aracılı taşikardi. ESC 2019 metni SPERRI ve AP ERP için ≤250 ms özelliklerini kullanır; ölçüm ve provokasyon koşulları beraber gösterilmeli. Tek bir eşik uygulamada otomatik tedavi hükmüne çevrilmemeli. [R14](https://academic.oup.com/eurheartj/article/41/5/655/5556821?login=false)

## 9. Önerilen başlangıç kataloğu: 24 öğretim olgusu

Bu sayı ürün planıdır; prevalans, doğruluk veya klinik örneklem büyüklüğü değildir. Her olgu birden fazla manevra/işlem sonrası klip taşıyabilir.

| No | Olgu | Temel görev |
|---|---|---|
| 01 | Normal sinüs ve His kaydı | A/H/V, AH/HV referansları |
| 02 | AV nodal çift fizyoloji/echo | Bulguyu taşikardi tanısından ayır |
| 03 | Tipik slow-fast AVNRT | Kısa septal VA ve devre |
| 04 | Atipik AVNRT | Uzun RP ve proksimal CS erken A |
| 05 | Yavaş yol hedef kaydı | Küçük/bölünmüş A, V, H komşuluğu |
| 06 | RF junctional, VA korunmuş | Yanıt ile sonlanımı ayır |
| 07 | Tipik AVNRT bağlamında yeni VA blok | Uyarı ve antegrad AV değerlendirmesi |
| 08 | Atipik AVNRT, junctional VA blok | Retrograd yol kaybı ve korunmuş antegrad AV |
| 09 | Sol lateral manifest AP, sinüs | Delta ve erken lokal V |
| 10 | Aynı AP ile ortodromik AVRT | Dar QRS ile WPW zeminini ayır |
| 11 | Sol lateral concealed AP | Normal sinüs ECG'si, eksantrik retrograd A |
| 12 | Sol anterior/anterolateral AP | Distal CS ezberini sorgula |
| 13 | Sol posterior/posterolateral AP | Ara CS çiftleri ve oblik insersiyon |
| 14 | Sağ lateral AP | Sağ annüler kayıt/Halo ihtiyacı |
| 15 | Sağ posterior/inferior AP | Sağ inferior hedef ile CS ağzını ayır |
| 16 | Para-Hisian/superior paraseptal AP | H komşuluğu ve capture doğrulaması |
| 17 | Orta paraseptal concealed AP | AVNRT benzeri kısa VA |
| 18 | Inferior paraseptal AP | Proksimal CS ve His-refrakter PVC |
| 19 | CS/MCV AP, divertikül varyantı | Venöz ve endokardiyal erken aktivasyon |
| 20 | PJRT/decremental AP | Uzun RP, decremental retrograd iletim |
| 21 | Antidromik AVRT | Geniş QRS ve VT ayırıcı tanısı |
| 22 | Preeksitasyonlu AF | Düzensiz geniş QRS, SPERRI ve tedavi tuzağı |
| 23 | Fokal AT | VOP sonrası yanıt ve VA linking karşılaştırması |
| 24 | CTI flutter | Aktivasyon, entrainment ve çift yönlü blok |

İleri katalog: birden çok AP, bystander AP + AVNRT, oblik AP, mekanik geçici AP blok, doğrudan atriyal capture ile yanıltıcı para-Hisian yanıt, fasciculoventricular/nodofascicular bağlantı, PVI/PV potansiyelleri. Bunlar ilk 24 olgunun kapsamına sessizce eklenmemeli.

### Üç somut sinyal storyboard'u

Aşağıdaki sayılar **tasarlanmış sentetik zamanlamadır**; literatür ölçümü, normal aralık veya klinik eşik değildir. Belirsizlik hesabı uygulanmaz; hasta verisinden tahmin yapılmamıştır.

1. **Sol lateral concealed AP, ortodromik AVRT:** TCL 360 ms; referans V=0; distal CS A=55, CS 3–4=70, CS 5–6=85, CS 7–8=100, CS 9–10=115, His A=120, HRA A=140 ms. Hedefte lokal A=45 ms. İkinci klipte uygun zamanlı His-refrakter PVC, A'yı ve takip eden H/V siklusunu ilerletir. V referansı ile hedefin lokal V'si ayrı tutulur.
2. **Inferior paraseptal concealed AP:** TCL 380 ms; referans V=0; hedef A=45, CS 9–10 A=60, His A=75, distal CS A=125 ms. Yanında benzer proksimal A dizili atipik AVNRT klibi açılır; zaman dizisiyle tanı seçmek yerine manevra seçilir.
3. **Manifest sol AP, sinüs:** yüzey delta başlangıcı t=160 ms; hedef lokal V t=145 ms, V–delta=−15 ms. His ve normal sistem ventriküler olayları ayrı tanımlanır. İşlem sonrası klipte delta kaybolur; retrograd test klibi ayrıca gösterilir.

Storyboard bütün kanallar ve sikluslar için geliştirme sırasında tamamlanmalı; sadece bu zaman listelerinden fizyolojik simülatör doğruluğu çıkarılamaz.

## 10. Mevcut koda uyarlama planı

Bu bölüm uygulama önerisidir. Yeni bağımlılık veya runtime gerektirmez; geliştirme başlamadan mevcut kullanıcı değişiklikleriyle yeniden karşılaştırılmalıdır.

| Faz | İş | Doğrulama |
|---|---|---|
| 1 | TR/EN ad değişikliği; Tanı/Manevralar/Tedavi kabuğu; mevcut dersleri koruma | `npm run check`, `node scripts/test-translations.mjs`, `npm run build`; eski deep-link ve mod geçişini tarayıcıda deneme |
| 2 | Olgu verisini render'dan ayırma; CS ara kanalları, RV, ECG; olay tabanlı kaliperler | `node scripts/test-ep-egm.mjs`; başlangıç/bitiş referansı, kanal kimliği ve sonlu örnek kontrolü |
| 3 | Mitral/triküspit zonları; seçime bağlı ABL ve pacing işaretleri | `npm run test:ep-koch` (sunucu gerekir); yeni zon/elektrot eşleştirme tarayıcı kontrolü |
| 4 | İlk 24 olgu, manevra ön koşulları, geçersiz capture yanıtları | Yeni fizyolojik senaryo testleri; `npm test`, `npm run build` |
| 5 | Öğrenci/kanıt modu, mobil sinyal görünümü, öğrenme görevleri | `npm run test:practice`, `npm run test:mobile`, `npm run test:browser` (sunucu gerekir); EP uzmanı içerik incelemesi |

Önerilen veri ayrımı: olgu/metin kaynağı, zon tanımı, manevra yanıt modeli, EGM renderer ve panel controller. Dosya adları geliştirmede seçilebilir. `src/main.js` yalnız koordinasyon yapmalı; bütün olgular buraya yığılmamalı.

Olgu sözleşmesi şu alanları taşımalı: `id`, `mechanism`, `pathwayZone`, `conductionDirections`, `rhythm`, `channels`, `catheterPlacement`, `events`, `measurementReferences`, `maneuvers`, `endpointChecks`, `teachingNumbers`, `citations`, `tr/en`, `provenance`. Manevra yanıtı `valid`, `invalidCapture`, `insufficientEvidence` durumlarını ayırmalı.

**EP kayıt saati kalp animasyonundan ayrı yönetilmeli.** Tek pencereye normalize edilmiş imleç yeterli değildir. Pacing, refrakterlik, taşikardi ve AF olayları aynı milisaniye zaman çizgisinde olmalı; 3B aktivasyon aynı olayları izlemeli. AF için düzenli mekanik siklus gösteriliyorsa şematik sınırlama belirtilmeli.

**Model sınırı, kullanıcı bildirimi:** Mevcut 3B model AV dissosiyasyonunda yalnız ventriküler ritmi izliyor; atriyal kasılma ayrı görünmüyor. Bu davranış bu rapor güncellemesinde canlı uygulamada yeniden doğrulanmadı. Sinyalde bağımsız A/V olayları gösterilmesi, mevcut 3B kasılmanın bunları ayrı temsil ettiği anlamına gelmez. İlgili olguda bu sınır görünür biçimde belirtilmeli.

**Geliştirme gereksinimi:** Ortak milisaniye zaman çizgisinde bağımsız atriyal ve ventriküler olay dizileri tutulmalı. Atriyal kasılma A olaylarını, ventriküler kasılma V olaylarını, açıkça tanımlanan şematik elektromekanik gecikmelerle izlemeli. AV dissosiyasyonunda sabit A→V eşleştirmesi zorlanmamalı. Bu animasyon değişikliği öneridir; bu rapor kapsamında uygulanmadı.

URL uyumu için ilk aşamada `#/mode/ablation` ve mevcut `ablation` kimliği korunabilir; görünür ad değişir. Tanı/manevra/tedavi ve olgu kimliği state'e eklenir. Kimlik değişimi gerekirse mevcut bağlantılara yönlendirme gerekir.

## 11. Kabul ölçütleri ve test tuzakları

1. TR/EN'de yeni ad bütün girişlerde aynı; eski beş ders erişilebilir.
2. WPW/concealed ve zon bağımsız seçilir; geçersiz kombinasyon açıklanır.
3. CS 9–10/1–2 yönü ve bütün ara çiftler 3B yerleşimle tutarlı.
4. “Erken A” yakın alan atriyal olaya dayanır; büyük uzak alan V'yi A sayan fixture reddedilir.
5. Ölçüm metni, çizilen kaliper uçları ve olay farkı aynı değeri verir.
6. His-refrakter PVC'de capture/refrakterlik koşulu görünür; yalnız A değişmesi katılım sonucu üretmez.
7. Para-Hisian manevrada His/V/A capture durumları ayrılır; doğrudan A capture yorumlanamaz.
8. PPI hesabı yalnız geçerli entrainment sonrası; pacing uzaması ve referans değişimi açıklanır.
9. Tipik/atipik AVNRT VA blok klipleri ayrı; korunmuş antegrad AV ancak kayıt varsa belirtilir.
10. AP ablasyonu sonrası kalan nodal VA iletimi, başarısız AP ablasyonu diye etiketlenmez.
11. Mekanik geçici AP blok kalıcı başarıyla eşitlenmez; işlem sonrası yeniden değerlendirme görünür.
12. Bütün sinyal ve geometri şemaları sentetik/kestirim etiketli; atlas konumu klinik güvenlik iddiası üretmez.
13. Rastgele gürültü eklenirse seed kaydedilir; aynı girdiler aynı sinyali üretir.
14. Uzun manevra klipleri pencere sınırında kesilmez; zoom ve mobil görünüm zaman ölçeğini korur.
15. Otomatik test geçişi, klinik uzman onayının yerine yazılmaz.
16. AV dissosiyasyonu örneğinde bağımsız A/V dizileri EGM ve 3B kasılmada tutarlı gösterilir; atriyal ve ventriküler fazların birbirinden kaydığı doğrulanır. Ayrı atriyal kasılma henüz uygulanmamışsa görünür model sınırı etiketi gerekir.

Özellikle mevcut testlerdeki 2–3 beat sınırı, dört olgu listesi ve altı kanal listesi genişleme için gözden geçirilmeli. Bunları kaldırmak tek başına yeterli değildir; yerlerine sahici mekanizma ve olay tutarlılığı kontrolleri konmalıdır.

## 12. Kaynak doğrulaması, güncellik ve yeniden üretilebilirlik

Yöntem: hedefli literatür araştırması, yerel kaynak incelemesi, PubMed/yayınevi metinleri ve scite metadata/Smart Citation kontrolü. Sistematik derleme değildir; yayın seçimi eğitimdeki karar noktalarına göre yapıldı. Sinyal sayıları tasarım önerisidir; klinik sonuç veya performans yüzdesi türetilmedi.

Aramalar: `accessory pathway concealed para-Hisian coronary sinus ablation`; `His refractory PVC ventricular overdrive pacing`; `junctional VA block atypical AVNRT`; `coronary sinus-ventricular accessory connections`; `unipolar accessory pathway`; DOI bazlı scite sorguları. Erişim: 30 Eylül 2026.

Scite kullanıldı. İlk çekirdek sorguda R1, R2, R6 ve R14 metadata/tally kontrolü; ek sorguda R4, R7 ve R13 kontrolü yapıldı. Sınıflandırılmış atıfların çoğu “mentioning”; destek veya kontrast toplamı rapordaki her iddiaya özgü doğrulama değildir. Dönen bazı citation kayıtları sorgulanan yazının **kendi kaynaklarına** atıflarıdır; bağımsız destek gibi sayılmadı. R14 için kontrast kaydı bulunması bütün rehberin çürütülmesi anlamına gelmez; snippet/iddia eşleştirmesi olmadan böyle sonuç çıkarılmadı.

R14 için scite, `10.1093/eurheartj/ehz827` düzeltme kaydını bildirdi. Yayınevi düzeltme metni ayrıca okundu: Figure 16'da sağdan üçüncü sütundaki **LAL etiketi LPL** olarak düzeltilmiş. Orijinal lokalizasyon algoritması aynen kopyalanmamalı. Belgede akut fokal AT tablosu, geniş QRS manevra metni ve başka düzeltmeler de var. Rehberin 2019 adı ile 2020 cilt/sayfa yılı farklıdır. [Yayınevi düzeltmesi](https://academic.oup.com/eurheartj/article/41/44/4258/5625724)

30 Eylül 2026 itibarıyla incelenen resmi listelerde temel SVT belgeleri ESC 2019 ve ACC/AHA/HRS 2015'tir. Bu gözlem tüm EP alt konularındaki konsensusların kapsamlı güncellik taraması değildir. [ESC katalog](https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/supraventricular-tachycardia/), [AHA resmi belge sayfası](https://professional.heart.org/en/guidelines-statements/2015-accahahrs-guideline-for-the-management-of-adult-patients-withe506)

R2 ve düzeltme belgesi için scite `read_fulltext` okunabilir metin döndürmedi; R2 klinik sonlanım ifadesi yayınevinin indekslenen sonuç metniyle kontrol edildi, düzeltme doğrudan yayınevinden okundu. Erişilemeyen metinler tam metin okunmuş gibi sunulmadı. R4/R6/R7/R12 için birincil makalelerin PubMed özetleri kullanıldı; yöntem ayrıntılarının tamamı bu raporda doğrulanmış değildir.

Ayrı modelin kaynak incelemesi WPW/concealed, CS erken A, AP varlığı/katılımı, capture tuzakları, eşiklerin örneklem sınırı ve tipik/atipik VA blok ayrımını yeniden kontrol etti. Uyarının önceki VA iletimiyle ilişkilendirilmesi, antegrad iletimin kayıtla gösterilmesi ve ESC LAL/LPL düzeltmesi rapora işlendi. İnsan EP uzmanı değerlendirmesi yapılmadı.

ESC resmi sayfası rehber içeriğinin yazılımda kullanımı için lisans şartı bildiriyor. Bu rapor literatür ve geliştirme önerisidir; rehber tablo/algoritmalarını ürüne aktarmadan önce kullanım izni değerlendirilmelidir. [ESC kullanım bilgisi](https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/supraventricular-tachycardia/)

Girdi kimlikleri, kaynak erişim kapsamı, rapor SHA-256 ve doğrulama çıktıları eşlik eden `ep-report-provenance.json` dosyasında tutulur. Dosya sonrasında değişirse hash yeniden üretilmelidir. Yeniden üretilebilirlik hedefi kaynak kararları ve içerik izinin denetlenmesidir; değişken web/scite sonuçlarının byte düzeyinde yeniden üretimi iddia edilmez.

**Bu çalışma sırasında uygulama testleri çalıştırılmadı; uygulama kodu değiştirilmedi.** Faz tablosundaki komutlar gelecekteki geliştirmenin doğrulama planıdır. Rapor kontrolü referans etiketleri, 24 olgu sayımı, dosya varlığı ve hash üretimini kapsar. Ayrı modelin adversarial kaynak incelemesi insan EP uzmanı onayı değildir.

## 13. Kaynak listesi

Referanslar ilk kullanım sırasıyla verilmiştir. DOI/yayın metadata kontrolü yapılmıştır; erişim kapsamı ayrıca belirtilir.

- **R1.** Fujiki ve ark. *Junctional rhythm associated with ventriculoatrial block during slow pathway ablation in atypical atrioventricular nodal re-entrant tachycardia*. Europace. 2008;10:982–987. DOI: [10.1093/europace/eun151](https://doi.org/10.1093/europace/eun151). Yayınevi metni: tipik/atipik VA blok farkı.
- **R2.** Katritsis ve ark. *Endpoints for Successful Slow Pathway Catheter Ablation in Typical and Atypical Atrioventricular Nodal Re-Entrant Tachycardia: A Contemporary, Multicenter Study*. JACC Clin Electrophysiol. 2019;5:113–119. DOI: [10.1016/j.jacep.2018.09.012](https://doi.org/10.1016/j.jacep.2018.09.012). İndekslenen yayınevi sonuç metni; tam metin okunamadı.
- **R3.** Page ve ark. *2015 ACC/AHA/HRS Guideline for the Management of Adult Patients With Supraventricular Tachycardia*. JACC. 2016;67:e27–e115. DOI: [10.1016/j.jacc.2015.08.856](https://doi.org/10.1016/j.jacc.2015.08.856). Yayınevi indeks metni: AP/AVRT çerçevesi, preeksitasyonlu AF tedavi riski.
- **R4.** Hirao ve ark. *Para-Hisian pacing. A new method for differentiating retrograde conduction over an accessory AV pathway from conduction over the AV node*. Circulation. 1996;94:1027–1035. DOI: [10.1161/01.CIR.94.5.1027](https://doi.org/10.1161/01.CIR.94.5.1027). [Birincil özet](https://pubmed.ncbi.nlm.nih.gov/8790042/).
- **R5.** Macedo ve ark. *Septal Accessory Pathway: Anatomy, Causes for Difficulty, and an Approach to Ablation*. Indian Pacing Electrophysiol J. 2010;10:292–309. [Açık tam metin](https://pmc.ncbi.nlm.nih.gov/articles/PMC2907089/). Anatomik değerlendirme derlemesi; evrensel başarı/mesafe eşikleri için kullanılmadı.
- **R6.** Sun ve ark. *Coronary sinus-ventricular accessory connections producing posteroseptal and left posterior accessory pathways: incidence and electrophysiological identification*. Circulation. 2002;106:1362–1367. DOI: [10.1161/01.CIR.0000028464.12047.A6](https://doi.org/10.1161/01.CIR.0000028464.12047.A6). [Birincil özet](https://pubmed.ncbi.nlm.nih.gov/12221053/).
- **R7.** Stavrakis ve ark. *Risk of Coronary Artery Injury With Radiofrequency Ablation and Cryoablation of Epicardial Posteroseptal Accessory Pathways Within the Coronary Venous System*. Circ Arrhythm Electrophysiol. 2014;7:113–119. DOI: [10.1161/CIRCEP.113.000986](https://doi.org/10.1161/CIRCEP.113.000986). [Birincil özet](https://pubmed.ncbi.nlm.nih.gov/24365648/).
- **R8.** Sundaram, Sra. *Utility of unipolar recordings for complex Wolff–Parkinson–White ablation*. Indian Pacing Electrophysiol J. 2015;15:125–129. DOI: [10.1016/j.ipej.2015.07.010](https://doi.org/10.1016/j.ipej.2015.07.010). [Açık olgu metni](https://pmc.ncbi.nlm.nih.gov/articles/PMC4750162/). Unipolar/bipolar uyumsuzluk için olgu kanıtı.
- **R9.** Veenhuyzen ve ark. *Diagnostic pacing maneuvers for supraventricular tachycardia: part 1*. Pacing Clin Electrophysiol. 2011;34:767–782. DOI: [10.1111/j.1540-8159.2011.03076.x](https://doi.org/10.1111/j.1540-8159.2011.03076.x). [Özet](https://pubmed.ncbi.nlm.nih.gov/21438892/).
- **R10.** Veenhuyzen ve ark. *Diagnostic pacing maneuvers for supraventricular tachycardias: part 2*. Pacing Clin Electrophysiol. 2012;35:757–769. DOI: [10.1111/j.1540-8159.2012.03352.x](https://doi.org/10.1111/j.1540-8159.2012.03352.x). [Özet](https://pubmed.ncbi.nlm.nih.gov/22385228/).
- **R11.** *Novel Diagnostic Observations of Nodoventricular/Nodofascicular Pathway-Related Orthodromic Reciprocating Tachycardia Differentiating From Atrioventricular Nodal Re-Entrant Tachycardia*. JACC Clin Electrophysiol. DOI: [10.1016/j.jacep.2020.07.007](https://www.jacc.org/doi/10.1016/j.jacep.2020.07.007). İndekslenen birincil sonuç metni; özel bağlantı istisnası.
- **R12.** Michaud ve ark. *Differentiation of atypical atrioventricular node re-entrant tachycardia from orthodromic reciprocating tachycardia using a septal accessory pathway by the response to ventricular pacing*. JACC. 2001;38:1163–1167. DOI: [10.1016/S0735-1097(01)01480-2](https://doi.org/10.1016/S0735-1097(01)01480-2). [Birincil özet](https://pubmed.ncbi.nlm.nih.gov/11583898/).
- **R13.** Naniwadekar, Joshi, Bhardwaj. *Septal accessory pathway and the value of para-Hisian entrainment*. HeartRhythm Case Rep. 2019;5:78–79. DOI: [10.1016/j.hrcr.2018.06.002](https://doi.org/10.1016/j.hrcr.2018.06.002). [Açık olgu metni](https://pmc.ncbi.nlm.nih.gov/articles/PMC6379302/).
- **R14.** Brugada ve ark. *2019 ESC Guidelines for the management of patients with supraventricular tachycardia*. Eur Heart J. 2020;41:655–720. DOI: [10.1093/eurheartj/ehz467](https://doi.org/10.1093/eurheartj/ehz467). Düzeltme: [10.1093/eurheartj/ehz827](https://doi.org/10.1093/eurheartj/ehz827). Yayınevi indeks metni ve scite metadata; bütün tam metin erişilemedi.
- **R15.** Tai CT, Haque A, Lin YK ve ark. *Double potential interval and transisthmus conduction time for prediction of cavotricuspid isthmus block after ablation of typical atrial flutter.* J Interv Card Electrophysiol. 2002;7(1):77–82. DOI: [10.1023/A:1020876317859](https://doi.org/10.1023/A:1020876317859). Yayın özeti: 32 hasta; proksimal CS ve düşük lateral RA pacing; çift potansiyel aralığı ≥ 100 ms ve istmus geçiş süresinde ≥ %50 artış. Küçük tek merkezli çalışma; uygulamada otomatik eşik olarak kullanılmaz. Dördüncü uygulama turunda eklendi.
- **R16.** Madaffari A ve ark. *Electrocardiographic and Electrophysiological Characteristics of Atrial Tachycardia With Early Activation Close to the His-Bundle*. J Cardiovasc Electrophysiol. 2016;27:175–182. DOI: [10.1111/jce.12847](https://doi.org/10.1111/jce.12847). Yayınevi özeti: para-Hisian AT'de dar, bifazik (-/+) veya trifazik (+/-/+) P. Faz D ile eklendi.
- **R17.** Morishima I ve ark. *Adenosine-Sensitive Focal Reentrant Atrial Tachycardia Originating From the Mitral Annulus-Aorta Junction*. J Arrhythm. 2008;24:209–213. DOI: [10.1016/s1880-4276(08)80030-0](https://doi.org/10.1016/s1880-4276(08)80030-0). Açık tam metin; Iesaka tipine atıf: AV düğüm komşuluğunda adenozine duyarlı fokal reentran AT ve nonkoroner/sol koroner kusp varyantı.
- **R18.** Vaishnav AS ve ark. *A Hidden Recess of Atrial Tachycardia*. J Innov Card Rhythm Manag. 2021;12:4372–4374. DOI: [10.19102/icrm.2021.120103](https://doi.org/10.19102/icrm.2021.120103). Açık tam metin: para-Hisian erken A; ventriküler overdrive'da atriyal hız değişmeden VA dissosiyasyonu AT'yi doğrular.
- **R19.** Zhou Y ve ark. *Electrophysiologic characteristics and radiofrequency ablation of focal atrial tachycardia arising from para-Hisian region*. Int J Clin Pract. 2007;61:385–391. DOI: [10.1111/j.1742-1241.2006.01203.x](https://doi.org/10.1111/j.1742-1241.2006.01203.x). Özet: 224 olguluk seride 14 para-Hisian AT; titre edilmiş enerji ve AV ileti izlemi; karakteristik tek P morfolojisi yoktur.
- **R20.** Oda A ve ark. *Azygos vein approach for radiofrequency ablation of para-Hisian atrial tachycardia in a patient with inferior vena cava interruption*. HeartRhythm Case Rep. 2025;11:343–346. DOI: [10.1016/j.hrcr.2025.01.009](https://doi.org/10.1016/j.hrcr.2025.01.009). Açık tam metin: NCC'de en erken A yüzey P başlangıcını 15 ms öncelemiş; NCC ile CS ağzı zamanlaması karşılaştırılmış.
- **R21.** Nogami A ve ark. *Demonstration of diastolic and presystolic Purkinje potentials as critical potentials in a macroreentry circuit of verapamil-sensitive idiopathic left ventricular tachycardia*. JACC. 2000;36:811–823. DOI: [10.1016/s0735-1097(00)00780-4](https://doi.org/10.1016/s0735-1097(00)00780-4). Açık metin: P1 diastolik (proksimalden distale), P2 presistolik ters yönde; makroreentri devresinin kritik potansiyelleri.
- **R22.** Morishima I, Nogami A ve ark. *Negative Participation of the Left Posterior Fascicle in the Reentry Circuit of Verapamil-Sensitive Idiopathic Left Ventricular Tachycardia*. J Cardiovasc Electrophysiol. 2012;23:556–559. DOI: [10.1111/j.1540-8167.2011.02251.x](https://doi.org/10.1111/j.1540-8167.2011.02251.x). Açık metin: posterior fasikül seyirci olabilir; retrograd bacak LV miyokardı; entrainment kanıtı.
- **R23.** Nakagawa E ve ark. *The main trunk of the left bundle branch is not part of the re-entry circuit of verapamil-sensitive idiopathic left ventricular tachycardia*. J Arrhythm. 2012;28:232–234. DOI: [10.1016/j.joa.2011.12.001](https://doi.org/10.1016/j.joa.2011.12.001). Açık tam metin: sol dal ana gövdesi devrenin parçası değil; ablasyon pre-Purkinje potansiyel bölgesinde.
- **R24.** Puie P ve ark. *Insights into the mechanism of idiopathic left ventricular tachycardia: a case report and literature review*. Eur J Med Res. 2015;20:55. DOI: [10.1186/s40001-015-0156-y](https://doi.org/10.1186/s40001-015-0156-y). Açık tam metin: posterior fasiküler tip yaklaşık %90; RBBB + sol/superior aks; verapamil duyarlı yavaş ileten lifler antegrad bacak.
- **R25.** Nakagawa H ve ark. *Radiofrequency catheter ablation of idiopathic left ventricular tachycardia guided by a Purkinje potential*. Circulation. 1993;88:2607–2617. DOI: [10.1161/01.cir.88.6.2607](https://doi.org/10.1161/01.cir.88.6.2607). Açık metin: en erken Purkinje potansiyeli hedefi; pace-map tek başına özgül değil.
- **R26.** Caceres J ve ark. *Sustained bundle branch reentry as a mechanism of clinical tachycardia*. Circulation. 1989;79:256–270. DOI: [10.1161/01.cir.79.2.256](https://doi.org/10.1161/01.cir.79.2.256). Yayınevi özeti: sinüste ileti kusuru + uzamış HV; siklus değişiminde H-H değişimi sonraki V aktivasyonunu belirler; LBBB tipi VT'de BBR çoğunluk; sağ dal ablasyonu tedavi.
- **R27.** Sarkozy A ve ark. *Bundle branch reentry tachycardia* (olgu serisi). J Cardiovasc Electrophysiol. 2006;17:902. DOI: [10.1111/j.1540-8167.2006.00468.x](https://doi.org/10.1111/j.1540-8167.2006.00468.x). Özet düzeyi: VA dissosiyasyonlu geniş QRS taşikardi; sağ dal potansiyelinde ablasyon. Tam metin okunmadı; klasik ölçüt listesi R26'dan alındı.
- **R28.** Blanck Z ve ark. (interfasiküler reentri, sağ dal ablasyonu sonrası). J Cardiovasc Electrophysiol. 2009;20:1279. DOI: [10.1111/j.1540-8167.2009.01459.x](https://doi.org/10.1111/j.1540-8167.2009.01459.x). Özet düzeyi: sağ dal ablasyonundan sonra interfasiküler reentri gelişebilir (tedavi sonlanımı tuzağı).

## 14. Teslim ve önerilen başlangıç

Raporun önerisi: önce ad/bölüm yapısını kurmak ve mevcut VA blok anlatımını bağlamlandırmak; sonra CS/RV/ECG kanallarını ve olay tabanlı manevra altyapısını genişletmek. İlk karşılaştırma seti **tipik AVNRT, atipik AVNRT, sol lateral concealed AP, inferior paraseptal AP** olmalı. Böylece aynı kayıt görünümünde tanı, manevra ve hedef farkı sınanabilir. Tam 24 olgu kataloğu bundan sonra tamamlanır.

Uygulama tesliminden önce EP uzmanı, özellikle para-Hisian capture, AP katılımı, CS ostiyumu ayırıcı tanısı ve işlem sonrası sonlanım kliplerini gözden geçirmelidir. Mevcut atlasın koordinatları, gerçek klinik haritalama veya enerji güvenliği doğrulaması değildir.

## 15. Açık işler ve kapanış ölçütleri

**Kullanıcı durum bildirimi:** Aşağıdaki yedi iş hâlâ açık. Bu güncelleme durum kaydı ve kapsam netleştirmesidir; uygulamanın son hali yeniden çalıştırılarak denetlenmedi. Katalogda bir olgunun veya özellik adının bulunması, uygulanmış ya da doğrulanmış olduğu anlamına gelmez. Faz 4 ve 5 bu işler kapanmadan tamamlandı sayılmamalı.

| Açık iş | Tamamlanacak kapsam | Kapanış kanıtı |
|---|---|---|
| Fokal AT | Olgu 23 için başlangıç kaydı, atriyal aktivasyon haritası, tanısal manevra yanıtları ve açıklamalı AVNRT/AVRT karşılaştırması; tanısal olmayan yanıtlar dahil | Tam kanal olay dizileri; mekanizma ve referans kontrolü; çalışan olgu akışı; EP içerik incelemesi |
| CTI entrainment içeriği | Olgu 24'te pacing yeri, capture ve entrainment koşulları; pacing öncesi/sırası/sonrası kayıt; PPI/TCL uçları; işlem sonrası çift yönlü blok değerlendirmesinin ayrı gösterimi | Güncel kaynakla içerik doğrulaması; ölçümlerin olaylardan hesaplanması; geçersiz entrainment örneği; tarayıcıda uçtan uca olgu kontrolü |
| Antidromik AVRT | Olgu 21'in gerçek senaryo verisi; antegrad AP ve retrograd kolun açık tanımı; geniş QRS kaydı ve VT ayırıcı tanı kartı | Yüzey ECG ile intrakardiyak olay tutarlılığı; seçilen devrenin 3B gösterimi; tek morfolojiden kesin tanı üretmeyen açıklama |
| Para-Hisian pacing olgusu | Olgu 16'nın anatomik görünümünden ayrı, uygulanabilir pacing akışı; His+RV ve RV-only capture karşılaştırması; nodal/extranodal ve yorumlanamaz yanıt klipleri | Capture etiketleri; doğru S–A/H–A referansları; doğrudan A capture tuzağı; para-Hisian entrainment ile karıştırılmayan başlık/akış |
| Halo / unipolar | Sağ annüler Halo yerleşimi ve kanalları; ABL unipolar sinyal ve referansı; bipolar/unipolar eşzamanlı karşılaştırma | Elektrot-kanal kimliği eşleştirmesi; aynı olay saatinden çizim; yakın/uzak alan açıklaması; görünüm ve kanal seçiminin çalışması |
| Etkileşimli manevra akışı | Manevra, pacing yeri ve zamanlama seçimi; stimulus ve capture geri bildirimi; yanıtı durdurma/inceleme; kaliper; açıklama; yeniden deneme | Kullanıcı seçiminin kayıt sonucunu değiştirmesi; geçersiz ön koşulda tanısal sonuç üretilmemesi; tekrar üretilebilir olgu state'i ve uçtan uca test |
| Mobil tam ekran sinyal | Sinyali büyütme/kapatma; kanal, zaman ölçeği, kaliper ve olgu state'ini koruma; dikey/yatay ekran ve dokunma kontrolleri | Gerçek mobil viewport kontrolü; aç/kapat sonrası state korunması; okunur kanal/kaliperler; kaydırma, odak ve geri dönüş testi |

Bağımlılık sırası: önce ortak olay/ölçüm altyapısı ve gerekli kanallar; sonra dört eksik klinik içerik akışı; ardından bunları kullanan etkileşimli manevralar ve mobil tam ekran. Mobil kabuk bağımsız geliştirilebilir, ancak gerçek manevra kaydıyla ayrıca doğrulanmalıdır. AV dissosiyasyonunda bağımsız atriyal kasılma eksikliği de bölüm 10'daki ayrı model sınırı olarak açık kalır.

Bu işlerin kapatılması için içerik yazılması, uygulama verisinin tamamlanması, çalışan arayüz ve ilgili doğrulama birlikte gerekir. Bu rapor güncellemesi hiçbirini kapatmaz.

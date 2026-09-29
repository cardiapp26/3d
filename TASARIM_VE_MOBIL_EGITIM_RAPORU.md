# CARDIA: eğitim simülatörü ve mobil tasarım raporu

Tarih: 29 Eylül 2026  
Kapsam: Mevcut arayüzün bilgi mimarisi, eğitim akışı, mobil kullanım ve doğrulama planı. Uygulama kodu değiştirilmedi.

## 1. Ana karar

**Evet: sol panel seçim ve kontrol, orta alan uygulama, sağ panel açıklama ve öğrenme için kullanılmalı.** Sol menüde uzun açıklama bulunmamalı. Kontrol adı, birim, güncel değer ve açık/kapalı durumu kalmalı. Örneğin “LA duvar kesiti · %30” solda, kesitin ne gösterdiği ve sınırlılıkları sağda yer almalı.

Ancak yalnızca açıklamaları taşımak yeterli değil. Menü uzunluğunun önemli kısmı sürekli açık alt katmanlardan ve aynı anda gösterilen araçlardan geliyor. Kompaktlık, yazıyı ve düğmeleri küçülterek değil, bağlama göre göstererek sağlanmalı.

Mobilde “sağ panel” fiziksel olarak sağda durmamalı. Aynı içerik, alt panelde açılmalı. Masaüstü ve mobil aynı seçim, ders ve ilerleme durumunu paylaşmalı.

## 2. İnceleme dayanağı ve sınırlar

İncelenen kaynaklar: `README.md`, `package.json`, `src/main.js`, `src/style.css`, `src/content.js` içindeki ilgili arayüz bölümleri.

Bu rapor kaynak koduna dayalı tasarım değerlendirmesidir. Canlı ekran, gerçek telefon, ekran okuyucu ve FPS ölçümü yapılmadı. Aşağıdaki ölçüler ve performans değerleri önerilen hedeflerdir; mevcut ürünün ölçülmüş sonuçları değildir. Kod bilgi grafiğinde bu proje indeksli bulunmadığı için dosya incelemesine geçildi.

| Kodda gözlenen durum | Tasarım etkisi | Öneri |
|---|---|---|
| Sol panelde modlar, katmanlar, alt katmanlar, duvar kesitleri ve koroner araçları birlikte bulunuyor | Gezinme ve sahne ayarları aynı uzun alanda yarışıyor | Mod seçimini sahne araçlarından ayır |
| `.wall-tools` başlangıçta `open`; birden fazla alt katman grubu sürekli açık | İlk görünüm gereğinden uzun | Grupları kapalı başlat, aktif görev grubunu aç |
| Atriyum notları, kesit açıklaması ve aort kökü notu solda | Kontroller arasına okuma yükü giriyor | Açıklamaları sağdaki bağlamsal içeriğe taşı |
| Sağ panelde C-Arm, yapı bilgisi, ders, hemodinami ve muayene alanları bulunuyor | Açıklama paneli de zamanla uzayabilir | Görev odaklı sekmeler ve moda özel araç alanı kullan |
| 1100 px altında açıklama alanı tüm sütunların altına geçiyor | Tablet görünümünde anlatım sahneden uzaklaşabilir | Tablet için açılır bilgi paneli kullan |
| 640 px altında sahne, sol panel ve açıklamalar dikey sıraya geçiyor; sahnede 580 px minimum yükseklik var | Kısa telefon ekranında kontrol ve sonuç arasında sayfa kaydırma gerekir | Görünür ekran yüksekliğine bağlı çalışma alanı kur |
| Mobil kamera düğmeleri için 9,5 px yazı ve 3×5 px iç boşluk tanımlı | Dokunma alanları ölçülmeli; daha da küçültülmemeli | Büyük dokunma hedefi, daha az görünür araç |
| Miyokart opaklığı hem solda hem sahne üstünde kontrol ediliyor | Aynı işlev alan tüketiyor | Birincil kontrolü tek yerde sun |

## 3. Masaüstü yerleşimi

Önerilen başlangıç ölçüleri: sol panel 216–240 px, sağ panel 320–380 px; kalan alan 3D sahne. Sağ panel yeniden boyutlandırılabilir ve kapatılabilir olmalı. Bunlar sabit ürün şartı değil, prototip başlangıç değerleri.

```text
Üst çubuk: CARDIA | Mod seçimi | Keşfet / Öğren / Kendini sına | Dil
┌──────────────────┬──────────────────────────┬──────────────────────┐
│ Yapı ara         │ Aktif görev / adım       │ Öğren | Bulgu | Kaynak│
│                  │                          │                      │
│ ▸ Boşluklar      │                          │ Seçili yapı          │
│ ▸ Kapaklar       │        3D SAHNE           │ Kısa açıklama        │
│ ▸ Damarlar       │                          │ Görev ve geri bildirim│
│ ▸ İleti sistemi  │                          │                      │
│ ▸ Kesit / görünüm│ Kamera • Odakla • Sıfırla │ Önceki / Sonraki     │
├──────────────────┴──────────────────────────┴──────────────────────┤
│ Oynat/durdur | Kalp hızı | Gerektiğinde EKG / basınç grafikleri     │
└──────────────────────────────────────────────────────────────────┘
```

Mod listesini üst çubukta aramalı bir seçiciye taşımak en yüksek kazancı sağlar. Sol panel bütünüyle aktif sahneye ayrılır. Alternatif olarak sol panelde “Modlar / Katmanlar” sekmeleri kullanılabilir; iki uzun liste aynı anda açılmamalı.

Mod seçicinin önerilen grupları: Anatomi, Fizyoloji ve muayene, Girişimsel eğitim. Mevcut modlar korunur; yalnızca erişim düzeni değişir. Sık kullanılanlar ve son açılan modlar seçicinin üstünde gösterilebilir.

## 4. Sol menü nasıl kompakt olmalı?

1. **Arama:** Yapı adı ve kısaltma ile bulma. Sonuç seçildiğinde ilgili grup açılır, yapı görünür hale gelir ve sahneye odaklanır.
2. **Katlanabilir gruplar:** Boşluklar, Kapaklar, Damarlar, İleti sistemi, Çevre yapılar. Alt yapılar başlangıçta kapalıdır.
3. **Bağlamsal araçlar:** Duvar kesiti yalnızca ilgili boşluk seçildiğinde; koroner filtre anjiyografi bağlamında; kateter araçları ilgili girişim modunda görünür. “Tüm araçlar” erişimi korunur.
4. **Kısa satırlar:** Renk işareti + yapı adı + görünürlük kontrolü. Anatomik ad anlaşılmaz hale gelecek biçimde kısaltılmaz.
5. **Grup durumu:** Kısmen açık grup için karma durum göstergesi; görünür alt yapı sayısı. Başlık tıklaması grubu açar, ayrı kontrol görünürlüğü değiştirir.
6. **Tek opaklık kontrolü:** Seçili yapıya veya açıkça belirtilmiş doku grubuna uygulanır. Kontrolün kapsamı etiketinde görünür.
7. **Gelişmiş ayarlar:** Seyrek kullanılan kesit, çevre yapı ve çizim seçenekleri kapalı bir bölümde tutulur.
8. **Hatırlanan durum:** Kullanıcının açtığı gruplar mod bazında hatırlanır. Ders için geçici görünüm uygulanmışsa çıkışta önceki keşif görünümü geri gelir.

Başlangıç hedefi: 900 px yüksekliğindeki masaüstünde mod seçimi, arama ve ana grup başlıkları kaydırmadan erişilebilir. Açılan ayrıntı listesinde kaydırma kabul edilir. Tüm anatomiyi tek ekrana sıkıştırmak hedef değildir.

Soldan taşınacak içerik: `atriaNote`, `raNote`, `wallToolsNote`, `rootWindowNote` ve genel eğitim paragrafları. Solda kalacak içerik: kontrol etiketi, değer, birim, durum ve gerektiğinde kısa hata mesajı. Kritik işlem geri bildirimi ilgili kontrolün yanında da görünmeli; kullanıcı bunu görmek için başka panele bakmak zorunda kalmamalı.

## 5. Sağ panel: bağlamsal eğitim alanı

Sağ taraf tek uzun belgeye dönüşmemeli. Önerilen üç sekme:

| Sekme | İçerik |
|---|---|
| Öğren | Seçili yapı, 2–3 cümlelik özet, aktif öğrenme hedefi, görev adımı, ipucu |
| Bulgu | Kullanıcının yaptığı işlemin sonucu, ölçüm, karşılaştırma ve hata açıklaması |
| Kaynak | İlgili referans, modelin atlas/şematik niteliği, içerik sürümü ve sınırlılık |

Serbest keşifte yapı bilgisi; ders modunda görev bilgisi öncelikli olur. Seçim değişince içerik güncellenir, ancak öğrenci metin okurken kamera hareketi odağı veya kaydırma konumunu sürekli sıfırlamaz. Ayrıntıyı sabitleme seçeneği yararlı olur.

C-Arm joystick gibi işlem araçları açıklama metninin üstünde kalıcı yer kaplamamalı. İlgili modda sahne kenarında açılan “Araçlar” alanına alınmalı. Hemodinamik hesaplayıcılar ve muayene manevraları kendi görev bağlamında açılmalı.

## 6. Mobil: küçültülmüş masaüstü yerine görev ekranı

Telefonun ana ekranı 3D sahne olmalı. Uzun sol menü sahnenin altında sürekli bulunmamalı.

```text
CARDIA       [Mod ▾]       [⋯]
Görev 2/5: Hedef yapıyı seç
┌─────────────────────────────┐
│                             │
│          3D SAHNE           │
│                             │
│ [Görünüm] [Odakla] [Sıfırla]│
└─────────────────────────────┘
[▶] [Hız] [Grafik aç]
[Modlar] [Katmanlar] [Öğren] [Araçlar]
```

- **Modlar:** Gruplu, aramalı seçim çekmecesi.
- **Katmanlar:** Gruplu görünürlük ve kesit kontrolleri.
- **Öğren:** Masaüstü sağ panelinin içeriği; kısa, yarım ekran ve tam ekran durumları.
- **Araçlar:** Aktif modun kontrolleri. Gereksiz araçlar gösterilmez.

Aynı anda bir ana çekmece açık olur. Öğrenme paneli kısa durumdayken görev ve bir sonraki eylem görünür. Okuma için genişletilebilir; kapatıldığında kamera, seçim ve adım korunur. Panel sürükleme yanında açık “Büyüt/Küçült/Kapat” düğmeleri de sunar.

Dikey telefonda panel kapalıyken kullanılabilir yüksekliğin en az yaklaşık yarısını sahneye ayırmak başlangıç hedefidir. Çok kısa yatay ekranlarda yüzdelere zorlamak yerine sahne/okuma görünümü arasında geçiş sağlanmalı. Tablet ve yatay telefon ayrıca test edilmeli; yön değiştirmek zorunlu olmamalı.

### Dokunma ve erişilebilirlik

- Birincil düğmelerde ürün hedefi en az 44×44 CSS px; küçük ikonun çevresindeki tıklanabilir alan büyük olabilir.
- WCAG 2.2 AA hedef boyutu koşulu 24×24 CSS px ve tanımlı istisnalardır; 44 px burada daha rahat dokunma için tasarım tercihidir. [W3C: Target Size](https://www.w3.org/TR/WCAG22/#target-size-minimum)
- Metin ve kontroller 320 CSS px genişlikte işlev kaybetmeden yeniden akmalı. 3D sahnenin iki boyutlu doğası tüm sayfanın yatay taşmasına gerekçe olmamalı. [W3C: Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow/)
- Tek parmak döndürme, iki parmak yakınlaştırma; seçme ile sürükleme ayrı algılanmalı. Alternatif kamera ve yakınlaştırma düğmeleri bulunmalı.
- `touch-action: none` yalnızca etkileşimli sahneyle sınırlı kalmalı. Metin panelinde sayfa kaydırma ve tarayıcı yakınlaştırması engellenmemeli.
- Panel açıldığında odak yönetimi, kapanınca açan düğmeye dönüş, klavye erişimi ve ekran okuyucu adları doğrulanmalı.
- Renk tek anlam taşıyıcısı olmamalı. Seçili durum yazı, simge veya kenarlıkla desteklenmeli.
- Uzun açıklama mobilde yaklaşık 16 px, kısa kontrol etiketleri 14–16 px başlangıç hedefiyle tasarlanmalı.
- `100dvh` ve güvenli ekran kenar boşlukları hesaba katılmalı. Klavye ve tarayıcı çubukları görev düğmesini örtmemeli.

## 7. Tam eğitim simülatörüne dönüşüm

Mevcut 3D atlas, rehberli adımlar ve fizyoloji modülleri güçlü bir temel. Tam eğitim deneyiminin tasarım hedefi, öğrencinin eylemini ölçülebilir sonuca bağlamak olmalı. Yeni özelliklerin mevcut kodda bulunmadığı kesinleşmiş kabul edilmemeli; uygulama öncesi ayrı envanter çıkarılmalı.

### Üç kullanım biçimi

| Biçim | Öğrenci deneyimi | Tamamlanma ölçütü |
|---|---|---|
| Keşfet | Serbest seçim, katmanlar, açıklamalar | Zorunlu puan yok |
| Öğren | Kısa hedef, yönlendirilmiş görev, gerektiğinde ipucu | Hedef eylemler tamamlandı |
| Kendini sına | Aynı beceri, yönlendirici etiketler gizli | Doğru eylem, hata ve ipucu kullanımı raporlandı |

### Ders döngüsü

**Hedefi gör → tahmin et → sahnede uygula → sonucu incele → nedenini açıkla → tekrar dene.**

Örnek anatomik görev: “Mitral kapağı atriyal görünümde bul, P2 bölgesini seç.” Keşifte etiket görünür; sınamada gizlenir. Yanlış seçimde önce ilgili anatomik ilişkiyi düşündüren ipucu verilir. Yanıt gösterildiğinde neden doğru olduğu ve tekrar deneme seçeneği sunulur.

Her ders için tanımlanacak veri: ders kimliği, seviye, önkoşul, öğrenme hedefi, başlangıç sahnesi, kabul edilen eylemler, başarı ölçütü, ipucu sırası, açıklama, kaynak ve içerik sürümü. “Sonraki” düğmesine basmak tek başına başarı sayılmamalı.

İlerleme ekranı; tamamlanan hedefler, zorlanılan yapılar ve tekrar önerilerini göstermeli. Hız, doğruluğun yerine geçmemeli. İpucuyla tamamlanan görev ile bağımsız tamamlanan görev ayrı gösterilmeli. İlk sürümde yerel ilerleme kaydı yeterli olabilir; hesap ve bulut eşitleme ayrı karar olarak ele alınmalı.

Şematik modellerin niteliği görünür kalmalı. Arayüzün veya testlerin tamamlanması klinik doğrulama anlamına gelmez; eğitim içeriği ve değerlendirme rubriği alan uzmanı tarafından ayrıca gözden geçirilmeli.

## 8. Mobil performans planı

Mevcut README, gereksiz çizimi azaltan render yaklaşımı tanımlıyor. Korunmalı; gerçek cihaz üzerinde doğrulanmalı.

- Mod varlıklarını gerektiğinde yükle; ilk ekran için gereksiz modülleri bekletme.
- Cihaz piksel oranına üst sınır ve ayarlanabilir görüntü kalitesi uygula.
- Düşük güç modunda partikül ve dekoratif efektleri azalt; eğitim hedefinin gerektirdiği yapıları kaldırma.
- Arka plandaki sekmede çizimi durdur. Etkin ses veya zaman tabanlı görev varsa geri dönüş davranışını açıkça tanımla.
- Model yükleme ilerlemesi, yeniden deneme ve WebGL başarısızlığında erişilebilir metin/şema alternatifi sun.
- İlk etkileşim, FPS, bellek ve uzun oturumda ısınmayı gerçek orta sınıf Android ve iPhone üzerinde ölç.

Önerilen kabul hedefleri: referans orta sınıf cihazda normal etkileşimde en az 30 FPS; yerel kontrol geri bildirimi yaklaşık 100 ms içinde; tanımlı ağ/önbellek koşullarında ilk kullanılabilir sahne için 5 saniyelik başlangıç bütçesi. İlk ölçümden sonra bütçeler cihaz ve model ağırlığına göre netleştirilmeli.

## 9. Uygulama sırası ve doğrulama

| Öncelik | İş | Doğrulama |
|---|---|---|
| P0 | Mod seçiciyi ayır; açıklamaları sağa taşı; katmanları katla | Mevcut tüm mod ve kontroller erişilebilir; ilk görünümde ana gruplar görünür |
| P0 | Mobil çekmece ve alt panel; büyük dokunma hedefleri | Gerçek cihazda panel aç/kapat, seçim, yön değişimi ve kaydırma kontrolü |
| P0 | Sağ panel sekmeleri ve görev başlığı | Seçili yapı, aktif görev ve gösterilen açıklama her zaman eşleşir |
| P1 | Tek örnek dersle hedef, eylem, geri bildirim, sınama döngüsü | Doğru/yanlış eylem, ipucu, tekrar ve ilerleme kaydı testleri |
| P1 | Kalite seçenekleri ve yükleme iyileştirmesi | Tanımlı cihaz/ağ üzerinde performans kaydı |
| P2 | Diğer dersler, tekrar listesi ve gelişim görünümü | Uzman içerik incelemesi ve öğrencilerle görev testi |

Kod değişikliklerinde temel kontroller: `npm run check`, `npm test`, `npm run build`. Çalışan sunucuya karşı `APP_URL=<sunucu-adresi> npm run test:browser`; değişen modların ilgili tarayıcı testleri de çalıştırılmalı. Mevcut taşma kontrolü, tek başına mobil kullanılabilirlik kanıtı sayılmamalı.

Önerilen ekran matrisi: 320×568, 390×844, 412×915, 768×1024, 1024×768 ve 1440×900. Safari/iOS ve Chrome/Android gerçek cihaz kontrolleri eklenmeli.

Kritik senaryolar:

1. Mobilde mod seç, yapı bul, açıklamasını aç, sahneye dön; bağlam kaybolmasın.
2. Katman görünürlüğü değiştir, duvar kesiti uygula, geri al; kontrol ve sahne eşleşsin.
3. Öğren modundan sınamaya geç; yanıtı ele veren etiketler ve açıklamalar saklansın.
4. Panel açıkken yön değiştir; kapatma ve görev düğmeleri erişilebilir kalsın.
5. Klavye, ekran okuyucu ve büyütülmüş metinle aynı görev tamamlanabilsin.
6. Sayfa yenilemesi ve içerik sürümü değişiminde ilerleme güvenli biçimde geri yüklensin veya açıkça sıfırlansın.

## 10. İlk teslimin bitiş tanımı

İlk tasarım teslimi; kısa sol panel, bağlamsal sağ panel, telefonda tek sahne ve açılır paneller, mevcut özelliklerin korunması ve uçtan uca tamamlanabilen tek örnek eğitim görevi içermeli. Diğer derslere yayılım, bu akış gerçek kullanıcılarla doğrulandıktan sonra yapılmalı.

Bu rapor için uygulama testleri çalıştırılmadı; yalnızca rapor dosyası oluşturuldu. Öneriler uygulandıktan sonra yukarıdaki doğrulama planı yürütülmeli.

## 11. Türkçe ve İngilizce redaksiyon incelemesi

### Kapsam ve sonuç

`src/content.js` içindeki TR/EN arayüz sözlükleri, seçili pacemaker, Bachmann, transseptal ve muayene dersleri; `src/main.js` içindeki sabit etiketler ve dil değiştirme işlevi incelendi. Bu bölüm örnekli editoryal denetimdir; tüm modüllerin tüm cümlelerinin eksiksiz redaksiyonu değildir. Metinler uygulama içinde değiştirilmedi.

Temel sorun yalnızca yazım değil: dil karışıklığı, kontrol anlamının yanlış çevrilmesi, iki dil arasında içerik farkı ve öğrenciye gösterilen teknik geliştirme notları. Türkçe ve İngilizce sürümler aynı görevi, aynı kapsam ve sınırlılıklarla anlatmalı.

### Öncelikli düzeltme tablosu

| Öncelik / yer | Mevcut metin veya bulgu | Önerilen Türkçe | Önerilen İngilizce / işlem |
|---|---|---|---|
| P0 · `opacityLabel` | TR “Saydamlık”; EN “Opacity”. Değer doğrudan opaklığa uygulanıyor | “Doku opaklığı” | “Tissue opacity”. %100 opak anlamı korunmalı; “saydamlık” istenirse değer dönüşümü de değişmeli |
| P0 · `fluoroDockTitle` | “X-ışını simülasyonu / X-ray simulation”, README ise eğitsel mesh projeksiyonu tanımlıyor | “Şematik floroskopi görünümü” | “Schematic fluoroscopic view”. Fiziksel X-ışını simülasyonu izlenimi kaldırılmalı |
| P1 · `main.js` yapı paneli | Sabit “WHY IT MATTERS”, “INSPECT STRUCTURE”, “GUIDED EXPLORATION” | “Neden önemli?”, “Yapı seçin”, “Rehberli öğrenme” | “Why it matters”, “Select a structure”, “Guided learning”. Tamamı çeviri anahtarına bağlanmalı |
| P1 · katman adları | “Odacıklar (Chambers)”, “Venler (Veins)”, “İleti sistemi (Conduction)” | “Kalp boşlukları”, “Venler”, “İleti sistemi” | “Heart chambers”, “Veins”, “Conduction system”. Karşı dildeki eş anlamlılar menüden kaldırılmalı |
| P1 · `veins` | İngilizce “Cardiac veins”; alt listede pulmoner venler, SVC ve IVC de var | “Venler” | “Veins”. Grup adı kapsadığı yapılarla eşleşmeli |
| P1 · `main.js` alt katmanları | “Left ventricle (LV)” gibi sabit İngilizce ve “Diyafram”, “Frenik sinirler” gibi sabit Türkçe etiketler | “Sol ventrikül (LV)”, “Diyafram”, “Frenik sinirler” | “Left ventricle (LV)”, “Diaphragm”, “Phrenic nerves”. İki yönde de yerelleştirilmeli |
| P1 · transseptal giriş metni | “ilerletmesini animasyonlar” | “Kaydırıcıyla kateterin ve iğnenin ilerleyişini izleyin.” | “Use the slider to follow catheter and needle advancement.” |
| P1 · Bachmann başlığı | “Bachmann demeti anatomisi ve bölge pacing” | “Bachmann demeti anatomisi ve bölgesinin uyarımı” | “Bachmann bundle anatomy and area pacing” |
| P1 · mod adı | “Pacemaker leadi” | “Kalp pili elektrotları” | “Pacemaker leads”. Ayrıntıda ilk kullanımda “elektrot (lead)” açıklanmalı |
| P1 · `leadProgressLabel` | “Lead ilerletme / Yerleşim” | “Elektrot ilerletme” | “Lead advancement”. Yerleşim ayrı bir durumsa ayrıca gösterilmeli |
| P1 · `wallToolsSummary` | “Duvar açma pencereleri” | “Duvar kesitleri” | “Wall cutaways”. Geometrik görüntüleme kesiti olduğu sağ panelde açıklanmalı |
| P1 · `restoreWalls` | “Duvarları geri getir / Restore wall windows” | “Kesitleri kapat” | “Close all cutaways”. İşlemin sonucunu açıkça anlatmalı |
| P1 · `raNote` | “tricuspid relation” doğal ve belirgin değil | “Sağ atriyumun düz duvarlı venöz bölümünü, pektinat kaslarını ve triküspit kapakla ilişkisini inceleyin.” | “Explore the right atrium’s smooth-walled venous component, pectinate muscles, and relationship to the tricuspid valve.” |
| P1 · `referencesLimits` | “Üst yazar”, “geçerliliği kurmaz” | “Modelin özgün üreticisi ve lisansı doğrulanmamıştır.” / “Kaynak incelemesi, simülatörün klinik geçerliliğini doğrulamaz.” | “The model’s original creator and license have not been verified.” / “Source review does not validate the simulator for clinical use.” |
| P2 · `provenanceReference` | “REFERANS NOTU / KAYITLI MESH YOK” | “Bilgi notu · anatomik modele hizalanmış 3D yapı yok” | “Reference note · no registered 3D mesh”. Teknik anlam kısa açıklamayla korunmalı |
| P2 · `carmPill` | “ANJİOGRAFİ”, mod adı ise “Anjiyografi” | “Anjiyografi” | “Angiography” |
| P2 · `modeShortcut` | Metin yalnızca 1–6 modlarını anlatıyor; listede 11 mod var | “Mod kısayolları” | “Mode shortcuts”. Açıklama gerçekten desteklenen tuşlardan üretilmeli |
| P2 · `updateBtn` | “Güncelle / Update”, başlık güncelleme denetimini anlatıyor | “Güncelleme denetle” | “Check for updates”. Kısa mobil etiketi “Güncelleme / Updates” olabilir |

Sabit başlık ve etiket bulguları kaynak koduna dayanır. `applyChromeTranslations()` çoğunlukla `data-i18n` alanlarını güncelliyor; adı geçen sabit başlıklar bu işaretleri taşımıyor. Son kabulde TR→EN→TR geçişi canlı ekranda ayrıca kontrol edilmeli.

### İki dil arasında anlam eşitliği

**Somut örnek:** Pacemaker dersinin ilk adımında Türkçe metin sağ atriyal apendiks “veya lateral duvar” seçeneğini içeriyor. İngilizce karşılığı yalnızca apendiksi anlatıyor. Bu bir yazım hatası değil, içerik kapsamı farkı. Önce gösterilen modelin ve ders hedefinin kapsamı belirlenmeli; iki dil aynı onaylı metinden türetilmeli. Redaksiyon sırasında anatomik seçenek sessizce eklenmemeli veya silinmemeli.

İngilizce “anchors securely” gibi ek kesinlik taşıyan ifadeler de Türkçe karşılık ve modelin gösterebildiği şeyle karşılaştırılmalı. Kaynak doğrulaması yapılmadan güvenlik veya başarı iddiası güçlendirilmemeli.

Muayene dersinin girişindeki “This module will keep growing; new findings and maneuvers are data table entries.” öğrenciye değil geliştiriciye yönelik. Türkçe karşılığıyla birlikte geliştirici belgesine taşınmalı. Ders girişinde öğrencinin ne yapacağı ve ne gözlemleyeceği kalmalı.

Bu inceleme klinik iddiaları veya atıfları doğrulamıyor. İşlem sıralaması, risk azalması ve elektriksel yakalanma gibi iddialar editoryal düzeltmeden ayrı uzman/kaynak kontrolü gerektirir.

### Türkçe yazım ve terim standardı

- Başlıklarda cümle düzeni: “Sağ atriyal elektrot”, “Klavye kısayolları”. Her sözcüğü büyük harfle başlatmayın.
- Düğmeler kısa eylem adı taşısın: “Odakla”, “Kesiti kapat”, “Yeniden dene”. Yönergeler tutarlı biçimde “seçin”, “inceleyin”, “karşılaştırın” kullansın.
- Türkçe anlatımda “ve”; İngilizcede “and” kullanın. `&` yalnızca yer kısıtı olan, tutarlı kısa etiketlerde tercih edilsin.
- İlk kullanımda “elektrot (lead)”, “kardiyak uyarım (pacing)” gibi açıklama verin; sonraki kullanımlarda seçilen terimi koruyun. Terim sözlüğü alan uzmanıyla onaylanmalı.
- “Ostiyum/ostium”, “kusp/cusp”, “anjiyografi/anjiografi” varyantları için tek tercih belirleyin. Anatomik kapsamı farklı sözcükleri yalnızca benzer göründükleri için topluca değiştirmeyin.
- Kısaltmaları menüde koruyun; ilk açıklamada açın. TR metninde LV kullanılıyorsa açıklamada “sol ventrikül (LV)” yazın; SV/LV arasında gelişigüzel geçiş yapmayın.
- Önerilen sayısal biçim: TR “1–1,5 cm”, EN “1–1.5 cm”; açı “30°”, basınç “mmHg”. Aralık çizgisi en dash, ondalık ayırıcı dil bazlı olmalı.
- “Kaydır” tek başına belirsiz: sayfa kaydırma, tekerlekle yakınlaştırma ve kaydırıcı kullanımı ayrı adlandırılmalı. Telefon yönergeleri fare eylemleri istememeli.

### İngilizce redaksiyon standardı

- Arayüzde sentence case kullanın: “Physical examination”, “Reset view”, “Lead advancement”.
- Mevcut “catheterization”, “maneuver”, “modeled” tercihleriyle uyumlu Amerikan İngilizcesini ürün standardı olarak benimseyin; diğer yazım biçimleri hata diye değil tutarlılık açısından ele alınmalı.
- “Murmur grows/softens” yerine ses şiddeti için “becomes louder/softer” veya “increases/decreases in intensity” kullanın. “Gradient increases” gibi nicelik ifadelerini ses tarifinden ayırın.
- “the His” gibi kısaltılmış anlatım yerine bağlama göre “the His bundle” veya “the His recording site” kullanın; hangisinin kastedildiği içerik sahibince belirlenmeli.
- “Simulate”, “demonstrate”, “illustrate” fiillerini model yeteneğine göre seçin. Yalnızca şematik konumu gösteren model için “illustrate” daha doğru olabilir.
- Uzun işlem paragrafını “Task / Observe / Explanation” bölümlerine ayırın. Kısa yazmak uğruna anatomik yön, koşul veya istisna silinmemeli.

### Önerilen çift dilli kısa metin seti

| İşlev | Türkçe | English |
|---|---|---|
| Mod seçimi | Eğitim modunu seçin | Choose a learning mode |
| Yapı arama | Yapı adı veya kısaltma ara | Search by structure name or abbreviation |
| Serbest kullanım | Keşfet | Explore |
| Rehberli kullanım | Öğren | Learn |
| Değerlendirme | Kendini sına | Test yourself |
| Seçime yaklaş | Seçili yapıya odakla | Focus on selected structure |
| İpucu | İpucu göster | Show hint |
| Tekrar | Yeniden dene | Try again |
| Görev geçişi | Sonraki adım | Next step |
| Kaynak sekmesi | Kaynaklar | Sources |
| Boş seçim | Açıklamasını görmek için bir yapı seçin. | Select a structure to view its description. |
| Şematik model etiketi | Şematik eğitim modeli | Schematic teaching model |

### Redaksiyon kabul planı

1. Metinleri yalnızca ana sözlükte değil; muayene, hemodinami, septal defekt panelleri, hata mesajları, araç ipuçları ve erişilebilirlik etiketleriyle birlikte envantere alın.
2. Her metne anlamı belirli anahtar verin. İki dilin anahtar, değişken, birim ve adım sayısı eşitliğini denetleyin.
3. Eksik İngilizce anahtarın Türkçeye sessiz geri dönüşünü geliştirme aşamasında görünür hata/uyarı haline getirin. Üretim geri dönüş davranışı ayrıca korunabilir.
4. TR→EN→TR geçişinde seçili yapı, görev adımı ve ölçümler korunmalı; görünen metin, `title`, `aria-label` ve hata mesajları güncellenmeli.
5. 320 ve 390 CSS px genişliklerde uzun terimler, büyütülmüş yazı ve düğme taşması kontrol edilmeli. Anlamlı etiketleri üç noktayla okunamaz hale getirmek kabul edilmemeli.
6. İki dilde dersleri yan yana inceleyin: aynı eylem, aynı yön, aynı sayı, aynı koşul, aynı sınırlılık. Editör değişiklikleri klinik kapsam değişikliklerinden ayrılmalı.
7. Mevcut `scripts/test-entry-language.mjs` giriş dili seçimini test ediyor; dil kalitesi ve tüm ekranların çeviri kapsamı için yeterli değil. Yeni kontroller gerçek dil geçişi ve metin kapsamına odaklanmalı.

İlk redaksiyon tesliminde P0 anlam hataları ve P1 dil karışıklıkları giderilmeli. Ardından terim sözlüğü sabitlenip tüm derslere yayılmalı. Bu rapordaki öneriler uygulama metinlerine henüz işlenmedi.

## 12. Atım görsellerini iyileştirme planı

### Hedef ve kapsam

**Hedef: Kalbe bağlı yapıların birbirinden kopmadan, aynı döngü üzerinde tutarlı hareket etmesi.** Her yapıyı aynı oranda büyütüp küçültmek yerine, ana dokunun deformasyonu ve ona bağlı yapıların takibi birlikte tasarlanmalı. Omurga gibi çevre referanslarının sabit kalması normaldir; kalp üzerindeki damarın hareketli yüzeyden ayrılması giderilmesi gereken sorundur.

Bu aşama plan teslimidir. Animasyon kodu, model, paketler ve mevcut mod davranışları değiştirilmedi. Yeni motor veya model dosyası gerektirmeyen, mevcut Three.js ve ortak döngü altyapısını kullanan yaklaşım öneriliyor. Rig, yeni atlas veya GPU deformasyonuna geçiş gerekirse ayrı mimari karar alınmalı.

### Kodda görülen nedenler

İncelenen ana noktalar: `src/animation-channels.js` içindeki `computeChannelWeights`, `writeChamber`, `applyChannels`, `applyValves`; `src/heart.js` içindeki ana animasyon döngüsü ve model kurulumu; `src/cardiac-cycle.js` zaman çizelgesi; mitral etiketlerinin güncelleme altyapısı.

| Bulgu | Görsel sonuç / risk |
|---|---|
| `applyChannels` doğrudan LV, RV, LA, RA ve LA hareketini izleyen LAA işaretini deforme ediyor | Diğer yapıların bu hareketi kendiliğinden izlemesi sağlanmıyor |
| Kapaklar ayrı açılma kanallarına sahip; anulus çerçeveleri başlangıç geometrisinden önbelleğe alınıyor | Boşluk, anulus ve yaprakçık arasında ortak hareket çerçevesi gerekiyor |
| Koroner arterler, kardiyak venler ve papiller kaslar bu denetleyicide deformasyon uygulanacaklar arasında değil | Hareketli kalp ile sabit bağlı yapılar arasında görsel uyumsuzluk beklenir |
| Papiller kaslar sıfırlama listesinde var, aktif deformasyon listesinde yok | Sıfırlama desteği hareket desteği anlamına gelmiyor |
| LV ve RV aynı kasılma ağırlığını kullanıyor; deformasyon dünya Y ekseni ve kutu sınırlarından hesaplanıyor | İki boşlukta benzer, mekanik bir sıkışma hissi oluşabilir |
| Tek `ventricularContraction` ağırlığı hem kasılma anlatımı hem geometrik küçülme için kullanılıyor | Gerilim ve hacim değişimi görsel olarak ayrıştırılmamış |
| Bu ağırlık ejeksiyon ortasında tepe yapıp gevşeme başlangıcında sıfıra dönüyor | Geometri erken genişliyormuş gibi görünebilir; hedef hareket eğrisi ayrıca tanımlanmalı |
| Vertex konumları değişiyor; ilgili yazım işlevleri normalleri yeniden hesaplamıyor | Işık/gölge deformasyona uymayabilir; canlı görüntüyle doğrulanmalı |
| Defekt moduna girişte atım bilerek durduruluyor | Bu sabitlik mevcut mod politikası; animasyon hatası gibi otomatik değiştirilmemeli |

Bu bulgular kod incelemesidir. Hangi görünümde hangi yapının ne kadar ayrıldığı henüz video veya sayısal mesafe ölçümüyle doğrulanmadı.

### Hareket sınıfları

| Yapı | Planlanan davranış |
|---|---|
| LV ve RV duvarları | Kendi yerel anatomik eksenlerinde kontrollü deformasyon; ortak bağlantı sınırlarında uyum |
| LA ve RA | Ortak saatten türeyen ayrı hareket eğrileri; ven girişlerinde yumuşak geçiş |
| LAA ve işareti | LA yüzeyine bağlı hareket; mevcut işaret takibi korunur |
| Papiller kaslar | İlgili ventrikülün deformasyon alanını izler; boşluk içinde sabit kalmaz |
| Mitral/triküspit anulus ve yaprakçıklar | Önce güncel bağlantı çerçevesi; ardından bu çerçevede açılma/kapanma |
| Korda içeren geometri | Kapak ve papiller bağlantıları arasında ağırlıklı geçiş; ayrı segment yoksa bu sınır açıkça belgelenir |
| Koroner arterler ve kardiyak venler | Yakın kalp yüzeyinin yer değiştirmesini izler; damar çapına bağımsız “nabız” efekti eklenmez |
| Aort/pulmoner kök ve büyük damar bağlantıları | Kalbe yakın bölüm bağlı hareket eder; uzak bölümde hareket kademeli söner |
| SA/AV düğümleri, ileti yolları ve anatomik işaretler | Bağlı olduğu yüzey veya bölgenin hareketini izler |
| Kalp içi elektrotlar ve kateterler | Sabit giriş noktası ile hareketli hedef arasında kontrollü esneme; ilerletme animasyonuyla birlikte hesaplanır |
| Akış yolları ve parçacıklar | Hareketli giriş/çıkış noktalarını izler; duvar dışına taşma kontrol edilir |
| Etiketler ve seçim vurgusu | Güncel geometriyi izler; başlangıç koordinatında kalmaz |
| Omurga ve çevre anatomisi | Atımla küçülüp büyümez; solunum animasyonu bu planın dışında |

### Önerilen teknik yaklaşım

Mevcut kanal denetleyicisini aşamalı genişletin. Tek kalp döngüsü korunmalı; her modül kendi zamanlayıcısını üretmemeli.

```text
Ortak döngü durumu
  → ayrı geometrik hareket ağırlıkları
  → boşlukların güncel şekli ve bağlantı çerçeveleri
  → yüzeye bağlı damar, kas, işaret ve cihazlar
  → hareketli çerçevede kapak hareketi
  → akış, etiket, seçim ve çizim güncellemesi
```

- Her nesne için değişmez başlangıç pozu saklanmalı. Her kare başlangıç pozundan hesaplanmalı; önceki kareye ekleme yapılarak kayma biriktirilmemeli.
- Yüzeye bağlı nesneler için başlangıçta eşleme üretin: sahip bölge, yüzey üçgeni/ağırlıklar veya yerel deformasyon alanı, başlangıç ofseti ve geçiş ağırlığı. Her kare tüm mesh üzerinde en yakın nokta araması yapılmamalı.
- Sadece en yakın yüzeyi seçmek yeterli değil. Birbirine yakın karşı duvarlara yanlış bağlanmayı önlemek için anatomik bölge sınırları ve doğrulanmış bağlantı noktaları kullanılmalı.
- Damarlarda ve bölge sınırlarında ağırlıklar yumuşatılmalı; dal birleşimleri ayrılmamalı. İnce damar geometrisi farklı yüzeylere dağınık bağlanmamalı.
- Yaprakçık açılması ve kalple taşınma ayrı dönüşümler olarak bir kez uygulanmalı. Çift deformasyon engellenmeli.
- Deforme geometri için normal, sınır hacmi, raycast ve seçim davranışı birlikte ele alınmalı. GPU hareketi düşünülürse CPU seçim geometrisiyle uyum ayrı iş kalemidir.

### Uygulama fazları

#### Faz A: Envanter ve sorunu görünür kılma

Aktif mesh, yardımcı işaret, cihaz ve akış yolu için “bağımsız hareket / bağlı hareket / sabit / kapsam dışı” kaydı çıkarın. AP, posterior, LAO, RAO ve mitral yakın görünümde aynı fazların önce görüntülerini alın. Dört boşluk, koroner damarlar ve kapak çevresinde bağlantı noktaları belirleyin.

Doğrulama: `node scripts/test-animation-channels.mjs`, `node scripts/test-cardiac-cycle.mjs`. Bunlar başlangıç regresyon kaydı sağlar; görsel sorunun yokluğunu kanıtlamaz. Ek tarayıcı kaydında faz sabitlenerek aynı kamera karşılaştırılmalı.

#### Faz B: Hareketli yüzey ile sabit ek yapı sorununu giderme

İlk dikey dilim: **LV + LAD + papiller kas + mitral bağlantısı**. Ortak takip mekanizmasını önce bu küçük grupta kanıtlayın. Ardından RV, atriyumlar, kardiyak venler ve büyük damar geçişlerine genişletin. Başlangıçta kasılma eğrisini değiştirmeyin; bağlantı düzeltmesinin etkisi ayrı görülsün.

Doğrulama: Yeni bağlantı regresyon testleri; tam döngü boyunca bağlantı sapması, damar dallarında kopma ve reset sonrası başlangıç pozuna dönüş. Mevcut `node scripts/test-animation-channels.mjs` ve `node scripts/test-annuli.mjs` de çalışmalı.

#### Faz C: Atım biçimini ve kapak hareketini iyileştirme

Tek kasılma skalerini, en azından geometrik hacim/şekil değişimi ile gerilim anlatımını ayıran kanallara bölün. Dünya Y ekseni yerine boşluğun yerel apeks-baz eksenini değerlendirin. Boyuna kısalma, radyal deformasyon ve düşük genlikli burulma ayrı, sınırlanabilir bileşenler olmalı. Genlikler ölçülmüş hasta verisi gibi sunulmamalı.

Amaçlanan faz-hareket ilişkisi önce yazılı olarak onaylanmalı. İzovolümetrik evrelerin, ejeksiyonun ve doluşun görsel anlatımı alan uzmanıyla kontrol edilmeli. Açık/kesilmiş meshlerden güvenilir kapalı boşluk hacmi hesaplanamıyorsa “hacim doğrulandı” denmemeli; uygun geometrik vekil ölçüm açıkça adlandırılmalı.

Doğrulama: `node scripts/test-animation-channels.mjs`, `node scripts/test-cardiac-cycle.mjs`, `node scripts/test-schematic-leaflets.mjs`, `node scripts/test-wiggers.mjs`. Eski eğriyi sabitleyen test beklentileri ancak yeni davranış gerekçesiyle güncellenmeli; hata saklamak için gevşetilmemeli.

#### Faz D: Eğitim işaretleri, cihazlar ve akış entegrasyonu

İleti sistemi, anatomik işaretler, mitral etiketler, cihaz uçları ve akış rotalarını güncel geometriye bağlayın. Ders ilerletme, atım ve kamera hareketini aynı anda test edin. Kesit düzleminin dünyaya mı yapıya mı bağlı olduğu her araç için belirli olsun.

Defekt modunun mevcut sabit davranışı korunmalı. Bu modda atım istenirse defekt sınırları, şant işaretleri ve etiketleri kapsayan ayrı alt faz planlanmalı.

Doğrulama: `node scripts/test-blood-flow.mjs`, `node scripts/test-flow-routes.mjs`, `node scripts/test-conduction-paths.mjs`, `node scripts/test-crt-lead.mjs`; çalışan sunucuda `npm run test:mitral`, `npm run test:atria`, `npm run test:bachmann`, `npm run test:defects`.

#### Faz E: Mobil kalite ve eğitim kontrolleri

Standart/düşük güç kalite seçenekleri tanımlayın. Kalite düşerken hareket bağı korunmalı; “damarı sabit bırak” performans çözümü olmamalı. Önce normal güncelleme maliyeti, vertex döngüleri, gereksiz hesaplamalar ve çizim yükü ölçülmeli.

Oynat/durdur, faza git ve adım adım inceleme sunulmalı. Yavaş gösterim, BPM değişiminden ayrılmalı: “Oynatma hızı 0,5×” kalp hızının fizyolojik parametresini değiştirmemeli. TR/EN kısa açıklamalar sağ panelde veya mobil alt panelde yer almalı.

Doğrulama: Gerçek Android/iPhone üzerinde FPS, kare süresi ve ısınma; düşük ve standart kalitede aynı anatomik bağlantı testleri. Son kapı: `npm run check`, `npm test`, `npm run build` ve çalışan sunucuda `npm run test:browser`.

### Bitiş ölçütleri

- Hareket politikası tanımlanmamış görünür kalp yapısı kalmaz. Sabit olması gereken çevre yapıları ayrıca listelenir.
- Seçilmiş yüzey bağlantılarında başlangıç ofsetine göre sapma ölçülür. Başlangıç mühendislik hedefi kalp uzunluğunun %1'inden küçük sapma; küçük kapak/ostiyum bağlantıları için daha sıkı yerel eşik belirlenir. Bu eşik klinik doğruluk ölçüsü değildir.
- Tek döngüde en az 24 örnek faz ve faz sınırlarının iki yanı kontrol edilir; faz geçişlerinde sıçrama ve 0→1 döngü kapanışında kopma görülmez.
- Durdur/devam, faz sürükleme, hız değişimi ve tekrar oynatma aynı fazda aynı pozu üretir. En az 100 döngü sonunda birikimli kayma olmaz.
- Reset, kameradan bağımsız olarak tüm animasyonlu ve bağlı nesneleri başlangıç pozuna döndürür.
- Kapaklar, anuluslar ve papiller bağlantılar yakın görünümde ayrılmaz; belirlenmiş kontrol bölgelerinde yeni kesişme veya ters yüz oluşmaz.
- 3D hareket, EKG, Wiggers ve basınç panelleri ortak saatten güncellenir; gizlenen panel döndüğünde faz atlaması veya eski kare göstermez.
- Orta sınıf referans telefonda önerilen hedef en az 30 FPS; düşük güç modunda da bağlı yapı bütünlüğü korunur. Ölçüm cihazı ve koşulları raporlanır.
- Azaltılmış hareket tercihi, mevcut özelliklerle birlikte açık bir davranışa sahip olur; kullanıcı statik fazları inceleyebilir.

### Teslim ve öncelik

**İlk teslim Faz A+B olmalı:** mevcut atım sırasında koronerlerin, papiller kasların ve kapak bağlantılarının yüzeyden kopmasını gideren küçük, karşılaştırılabilir örnek. Ardından Faz C ile hareket kalitesi; Faz D ile tüm eğitim öğeleri; Faz E ile mobil optimizasyon.

Her fazın çıktısı: değişen dosyalar, aynı kamera/fazda önce-sonra görselleri, bağlantı ölçümleri, çalıştırılan testler ve kalan sınırlılıklar. Bu plan için testler veya performans ölçümleri henüz çalıştırılmadı.

## 13. LAA görünümü ve Bachmann demeti yerleşimi: öncelikli inceleme

Kullanıcı gözlemi: LAA, LA gövdesine göre çok büyük görünüyor; Bachmann demeti yerleşimi de şüpheli. Paylaşılan kesit görüntüsü tek başına boyut oranını veya demet konumunu doğrulamaya yeterli değil.

**Önce işaret kimliği ayrılmalı.** `src/la-landmarks.js` LAA ostiyumu için ince altın renkli tüp halka oluşturuyor. `src/heart.js` içindeki `atria` modu yalnızca `la` ve `laa` yapılarını gösteriyor; Bachmann bu görünümde gizleniyor. Dolayısıyla ekran görüntüsü bu moddan alınmışsa ince sarı çizgi Bachmann demeti değil, LAA ostiyum işaretidir. Ekran kırpımında aktif mod görünmediği için bu çıkarım koşulludur.

Bachmann yerleşim kodunda ayrıca somut inceleme gerektiren yaklaşım var: `src/bachmann.js`, atriyum kutu sınırları ve sabit koordinatlarla en yakın vertexleri seçiyor; ara eğriyi yüzeye bağlamıyor. Kod yorumu, aorttan kaçınmak için posterior ağırlıklı çatı noktaları seçildiğini söylüyor. Bu yöntem anatomik ön interatriyal oluğu doğrudan tanımlamadığından, bandın gereğinden posterior/süperior kalması veya yüzeyden ayrılması riski var. Mevcut koordinatlar anatomik doğruluğun kanıtı değil.

Anatomik referans: Bachmann demeti anterior interatriyal oluğu geçen subepikardiyal kas bandıdır; sol atriyal apendiks yönüne uzanır. Sadece LA çatısı üzerinden geçen herhangi bir eğriyle temsil edilmemeli. [Diseksiyon ve histoloji görselleri: Anatomical Basis for the Cardiac Interventional Electrophysiologist](https://pmc.ncbi.nlm.nih.gov/articles/PMC4668306/)

Önerilen sıra:

1. Aktif modu ve seçili yapıyı görünür etiketle kaydet; LAA halkası ve Bachmann bandını ayrı renk/etiketle göster.
2. LA kesitini kapat; ortografik veya aynı ölçekli anterior, superior ve lateral görüntüler al. LAA gövde sınırını, ostiyum işaretini ve perspektif etkisini ayrı değerlendir. Keyfî ölçek küçültmesi yapma.
3. RA, LA, SVC, aort kökü ve LAA tabanını birlikte göster; Bachmann rotasını anatomik referansla bu ilişkiler üzerinden belirle.
4. Sabit koordinat tahminlerinin yerine doğrulanmış yüzey bağlantıları ve anterior oluk boyunca kontrollü bant yerleşimi kullan. Aorttan kaçınma koşulu anatomik hedefin yerine geçmesin.
5. Epikardiyal bandı ve sağ atriyal endokardiyal pacing hedefini ayrı işaretle; aynı yapı gibi sunma.
6. Statik yerleşim doğrulandıktan sonra bandı atriyal deformasyona bağla. Atımın farklı fazlarında yüzeyden kopma, aortla kesişme ve etiket kayması kontrol edilsin.

Öncelik: Atım estetiğini geliştirmeden önce LAA sınırı/işaret kimliği ve Bachmann statik yerleşimi doğrulanmalı. Bu bölüm tespit ve düzeltme planıdır; geometri henüz değiştirilmedi.

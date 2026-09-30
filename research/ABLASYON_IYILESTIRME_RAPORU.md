# Ablasyon modülü: Koch üçgeni, yavaş yol ve kateter yerleşimi

Tarih: 30 Eylül 2026. Kapsam: mevcut eğitim uygulamasının kaynak kodu incelemesi, bilimsel içerik değerlendirmesi ve sınırlı görsel ekleme. Yetki: edit/execute; commit veya yayın yok. Hasta verisi ve klinik sonuç analizi yok.

## Sonuç

Koch üçgeni sınırları, inferior uzantılar ve yavaş yol hedefi mevcut. Başlıca eksikler: metinde geçen kateterin görünmemesi, junctional ritmin başarıyla eşitlenmesi ve tabandan apekse otomatik RF ilerlemesi anlatımı. Bu üç nokta düzeltildi. Yeni kateter eğitim şemasıdır; hasta anatomisine kayıtlı prosedür simülasyonu değildir.

## Bulgular ve öncelikler

| Öncelik | Mevcut bulgu | Düzeltme / durum |
|---|---|---|
| Yüksek | `koch-slow` metni junctional ritmi başarı işareti olarak sunuyordu. | TR/EN düzeltildi: tek başına yeterli değil; AVNRT yeniden indüklenebilirliği ve AV iletimin korunması değerlendirilir. [1] |
| Yüksek | Tabandan apekse kademeli RF, koşulsuz işlem dizisi izlenimi veriyordu. | Otomatik ilerleme ifadesi çıkarıldı. İnferior paraseptal hedef vurgulandı. [2] |
| Orta | Ders kateterlerden söz ediyor, yavaş yol kateteri çizilmiyordu. | Mor gövde ve beyaz elektrotlarla İVK ağzı → sağ atriyum → inferior hedef şeması eklendi. |
| Orta | “Bu bölgede ablasyon kalıcı blok yapar” kesin sonuç bildiriyordu. | İlgili TR/EN AV düğüm ve ders ifadeleri “kalıcı AV blok riski taşır” olarak düzeltildi. |
| Orta | Hedef opak küre, yeni uç elektrodunu tamamen örtüyordu. | Ayrı inceleme bulgusu üzerine hedef yarı saydam tel kafese çevrildi. |
| Uygulandı (2. tur) | Koch sınırları ve CS ağzı çıkarımlarla oluşturuluyor; tüm işaretler doğrudan segmentasyon değil. | Sahne etiketleri kaynağı söylüyor: “CS ağzı (kestirim)”, “Septal menteşe (atlas halkası)”, “Kompakt AV düğüm (apeks, şematik)”, “Yavaş yol hedefi (şematik)”. Yanıltıcı “(measured)” adı “(estimated)” oldu. |
| Uygulandı (2. tur) | Beş RF küresi sabit bir lezyon tarifi izlenimi verebilir. | Örnek RF lezyonları varsayılan olarak gizli; sol paneldeki aç/kapa ile görünür; metin sayı ve dağılımın protokol olmadığını söylüyor. |
| Uygulandı (2. tur) | RAO anlatımı fazla mutlak; His ve CS referans kateterleri çizilmiyor. | Koch · RAO 30 / Koch · LAO 45 yakın planı; fuşya His ve mavi CS referans kateterleri (aç/kapa); adım metni projeksiyonun tek başına konumu doğrulamadığını söylüyor. |

## Koch üçgeni ve yavaş yol için içerik çerçevesi

Öğretimde üç sınır birlikte gösterilmeli: Todaro tendonu, triküspit septal yaprakçığın tutunma çizgisi ve CS ostiyumu düzeyindeki inferior taban. Apeks kompakt AV düğüm/His bölgesiyle ilişkilidir. Tipik AVNRT için inferior nodal uzantılarla ilişkili yavaş yol bölgesi, CS ağzı ve septal triküspit anulus arasındaki inferior paraseptal alanda anlatılmalı. Hedef, tek hastaya uygulanabilecek sabit bir koordinat değildir. [2,3]

Mevcut modelin hedef noktası geometrik interpolasyonla üretiliyor. Bu, anatomik kavramı göstermek için uygun bir şema olabilir; histolojik yavaş yolun ölçüldüğü veya yerinin doğrulandığı anlamına gelmez. Hızlı ve yavaş yol çizgileri de gerçek hastada ayrıştırılmış kablolar gibi sunulmamalı.

## Eklenen yavaş yol ablasyon kateteri yerleşimi

- Giriş: modeldeki İVK ağzı, ardından sağ atriyal kavite.
- Distal hedef: Koch üçgeninin inferior kısmında, CS ağzı ile septal triküspit menteşe arasındaki mevcut şematik hedef.
- Gösterim: mor kateter gövdesi; beyaz distal elektrotlar; yeşil tel kafes hedef. Uç ve hedef merkezleri çakışır.
- Etkileşim: kateter seçilince Türkçe/İngilizce yerleşim açıklaması açılır. Koch ve kombine EP adımlarında görünür; CTI ve PVI adımlarında gizlenir.
- Klinik bağlam: His kaydı üst anatomik-elektriksel referans, CS kateteri ostiyum referansı sağlar. Gerçek hedef değerlendirmesi intrakardiyak elektrogram ve anatomik görüntülemeyi birlikte gerektirir. [2,3]
- Sınır: kateter eğrisi lümen içinde kalma, doku teması, temas kuvveti, güvenli mesafe veya enerji etkisi hesaplamaz. Elektrot boyları ve aralıkları fiziksel cihaz ölçüsü değildir. His/CS referans kateterleri bu eklemede çizilmedi.

Junctional ritim enerji uygulaması sırasında görülebilir, fakat tek başına başarı kararı değildir. AVNRT'nin indüklenememesi temel sonlanım değerlendirmesidir. Bu eğitim sahnesinde gerçek elektrogram veya indüksiyon testi bulunmadığından “başarılı ablasyon” sonucu üretilmemeli. [1]

## Sonraki geliştirme planı ve kabul ölçütleri

1. **Anatomi görünümü:** etiketli Koch yakın planı, CS ostiyumu ve septal menteşeyi aynı karede göstermek. Kabul: hedef/apeks ayrımı RAO ve LAO görünümünde okunur.
2. **Referans kateterleri:** His ve CS kateterlerini farklı renklerle, aç/kapa kontrolüyle eklemek. Kabul: şematik kaynak etiketi, ostiyum/apeks ilişkisi ve mod geçişleri doğrulanır.
3. **Elektrogram öğretimi:** açıkça sentetik A/H/V örnekleri ve “junctional ritim ≠ tek başına başarı” karşılaştırması. Kabul: sentetik kayıt etiketi; gerçek klinik karar iddiası yok.
4. **Anatomik doğrulama:** EP uzmanı ile farklı projeksiyonlar ve anatomi varyasyonu incelemesi. Kabul: uzman değerlendirme kaydı; test geçişinin klinik doğrulama sayılmaması.

## Uygulama durumu (2. tur, 30 Eylül 2026)

Plan maddeleri 1–3 uygulandı; madde 4 (uzman incelemesi) yapılamaz ve yapılmadı.

**Kateter rotası.** Önceki mor kateterin 65 örneğinin 7'si (İVK girişinin hemen üstünde) sağ atriyum boşluğunun dışındaydı. Yeni rota: atlasta İVK mesh'i olmadığı için sağ atriyum tabanının altında şematik İVK lümeni, ölçülen kaval ağız, ardından boşluğun yatay kesit merkezleri (iç duvar köşelerinin ağırlık merkezi; `atrial-surface.js` iç/dış yüz ayrımı) ve hedefe boşluk tarafından yaklaşım. Kaval ağızdan hedefe kadar tüm örnekler sağ atriyum boşluğunun içinde (`scripts/test-ep-koch.cjs`).

**Koch yakın planı (madde 1).** Sol paneldeki “Koch yakın planı” bölümü: Koch · RAO 30 ve Koch · LAO 45. Kamera Koch üçgeninin ortasına bakar ve kalp yüzeyinin hemen dışına konur (ışın ile ölçülür; doku içine girmez). Yakın planda koronerler, kapak aparatı ve diğer damarlar gizlenir, ileti sisteminden yalnız AV düğüm ve His demeti kalır, doku saydamlığı %15'e iner. Koch adımı artık bu RAO yakın planıyla açılır. Hedef/apeks ayrımı RAO'da (septum önden), septuma göre konum LAO'da (septum kenardan) okunur.

**Referans kateterleri (madde 2).** His kateteri (fuşya, dört kutuplu, femoral): sağ atriyum boşluğundan geçer, triküspit septal menteşesini His demeti hizasında aşar, distal ucu sağ ventrikülün hemen içindedir (His demetinden 0.04 birim). CS kateteri (mavi, on kutuplu, SVC yoluyla): sağ atriyumun arkasından iner, kestirilen CS ağzına girer ve sinüs merkez hattında ilerler; CS 9-10 ağızda, CS 1-2 en uzakta. İkisi de aç/kapa ile gizlenebilir, floroskopide cihaz gibi koyu yansır, iki dilde seçim metinleri vardır ve atımla birlikte hareket eder.

**Sentetik elektrogram (madde 3).** Ablasyon dersine 5. adım eklendi: altı kanallı (HRA, His p, His d, CS 9-10, CS 1-2, ABL d) açıkça “SENTETİK · klinik kayıt değil” etiketli şerit. Dört senaryo: sinüs ritmi (AH 80, HV 45 ms kaliperleri), yavaş yol hedefi (küçük/bölünmüş A, büyük V, His yok), RF sırasında junctional ritim (V'den 70 ms sonra retrograd A; metin: tek başına başarı değildir, temel sonlanım AV iletim korunarak indüklenememedir), junctional ritim ve VA blok (uyarı: enerjiyi durdur). Kanal renkleri 3B kateterlerle aynıdır; imleç kalp döngüsüyle ilerler (`src/ep-egm.js`, `scripts/test-ep-egm.mjs`).

**Doğrulama (2. tur).** `npm run check`, `npm test` (yeni: `test-ep-egm.mjs`, `test-ablation-catheter.mjs`), `npm run build`, `npm run test:ep-koch` ve tüm tarayıcı testleri geçti. Ölçülen: üç kateterin boşluk segmentinde dışarıda kalan örnek 0; His ucu sağ ventrikül boşluğunda; ablasyon ucu hedefte; etiketler floroskopide ve diğer adımlarda gizli. Bu kontroller atlas üzerinde öğretim geometrisini sınar; klinik doğrulama değildir.

**Yapılmayan.** Madde 4: EP uzmanı incelemesi, farklı anatomi varyasyonları ve kayıtlı görüntüyle karşılaştırma bu çalışmanın dışında kaldı. Kateter doku teması, temas kuvveti ve lümen açıklığı hâlâ modellenmez.

## Doğrulama ve sınırlar

İncelenen başlıca dosyalar: `src/ep-landmarks.js`, `src/content.js`, `src/heart.js`, `src/main.js`, `README.md`, `package.json`. Kod grafiği sorgusu sonuç vermedi; kaynak dosyalar okundu. Çalışma ağacında önceden mevcut değişiklikler vardı; bunlar korunmuştur.

- `npm run check`: geçti.
- `npm test`: geçti; mevcut regresyon testleri.
- `npm run build`: geçti. Vite büyük paket uyarısı mevcut; başarısız derleme değil.
- `node scripts/test-ablation-catheter.mjs`: kateter uç-hedef ilişkisi, sonlu geometri, iki dilde seçim içeriği ve adım görünürlüğü kontrolü. Sentetik fallback fixture kullanır; atlas üzerinde klinik doğrulama değildir.
- Ayrı kod incelemesi: uç elektrodunun opak hedef içinde gizlenmesi bulundu ve düzeltildi.
- Canlı tarayıcıda yeni görünümün görsel doğrulaması yapılmadı. Doku çakışması, yüzey teması ve projeksiyon okunabilirliği henüz doğrulanmış değildir.
- Bilimsel kaynak kontrolü yayınevi/indeks içerikleri üzerinden yapıldı; bazı tam metin sayfaları erişim engeli verdi. Bağımsız insan EP uzmanı incelemesi yapılmadı.

## Kaynaklar

[1] Katritsis ve ark. *Endpoints for Successful Slow Pathway Catheter Ablation in Typical and Atypical Atrioventricular Nodal Re-Entrant Tachycardia: A Contemporary, Multicenter Study*. JACC: Clinical Electrophysiology. DOI: [10.1016/j.jacep.2018.09.012](https://www.jacc.org/doi/10.1016/j.jacep.2018.09.012). Junctional ritmin tek başına yetersizliği ve indüklenememe sonlanımı.

[2] Jackman ve ark. *Treatment of Supraventricular Tachycardia Due to Atrioventricular Nodal Reentry by Radiofrequency Catheter Ablation of Slow-Pathway Conduction*. NEJM, 1992. DOI: [10.1056/NEJM199207303270504](https://www.nejm.org/doi/full/10.1056/NEJM199207303270504). Yavaş yolun atriyal bağlantısını hedefleyen yaklaşım ve elektrogram temeli.

[3] *Using coronary sinus ostium as the reference for the slow pathway ablation of atrioventricular nodal reentrant tachycardia in children*. [PubMed PMID 32782644](https://pubmed.ncbi.nlm.nih.gov/32782644/). İnferior Koch bölgesi ve CS ostiyumu referansı. Pediatrik çalışmadır; mesafe ve sonuçları erişkinler için genellenmedi.

Erişim tarihi: 30 Eylül 2026. Bu rapor literatürün sistematik derlemesi değildir. Mevcut `euab285` kaynak kaydının tam bibliyografik doğrulaması bu turda tamamlanmadı; bu kayıt yeni iddiaların tek dayanağı olarak kullanılmadı.

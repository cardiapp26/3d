# İntrakardiyak Eko (ICE) İnceleme ve İyileştirme Raporu

Tarih: 2 Ekim 2026  
Kapsam: ICE kateteri, görüntü düzlemi, anatomik kesit, hazır görünümler, görev ölçütleri ve ders akışı.  
Durum: İnceleme tamamlandı. Bu rapor kapsamında uygulama kodu değiştirilmedi.

## 1. Sonuç

Mevcut ICE bölümü aynı düzlemden üretilen 3D sektör ve 2D anatomik kesiti gösteriyor. Ancak kateter manevrasını, hedef yapıyı ve kesitin neden değiştiğini yeterince açık bir demonstrasyona dönüştürmüyor. Teknik olarak çalışan hazır görünümler, klinik olarak doğru ve öğretici görüntü elde edildiğini tek başına kanıtlamıyor.

Öncelik görüntüyü ultrasona benzetmek değil, kateter hareketi ile kesit arasındaki ilişkiyi ve hedef anatomiyi doğru göstermektir. Mevcut görüntü atlas yüzeylerinin kesitidir; gerçek B-mod veya Doppler simülasyonu değildir.

## 2. İnceleme yöntemi

- İlgili kaynak kodlar okundu: `src/echo-probe.js`, `src/echo-views.js`, `src/echo-mode.js`, `src/echo-anatomy.js`, `src/echo-training.js`, `src/echo-renderer.js`, `src/echo-panel.js` ve `src/content.js`.
- Chrome'da ICE modu açıldı; kalp hareketi durdurularak sekiz hazır görünümün görüntüsü ve model geri bildirimi incelendi.
- Home, MV/LAA, sol PV ve septal kısa eksen kesitleri görsel olarak incelendi.
- Kesit, çizim ve eğitim değerlendirmesi testleri çalıştırıldı.
- Klinik öğretim çerçevesi PCR Textbook ve EHRA/EAPCI kaynaklarıyla karşılaştırıldı. Bu çalışma uzman ekokardiyografi onayı yerine geçmez.

## 3. Bulgular

### 3.1. Kateter bükümü ile 3D gösterim eşleşmiyor

**Kanıt:** `iceFrame()` büküm ayarlarıyla görüntü düzlemini döndürüyor. Kateter geometrisi ise yalnız uç konumu değişince yeniden üretiliyor; taban ile uç arasındaki orta nokta aynı doğru üzerinde. Büküm sırasında distal kateterin eğilmesi gösterilmiyor.

**Etkisi:** Kullanıcı kesitin değiştiğini görüyor, bunu oluşturan fiziksel kateter hareketini göremiyor.

**Öneri:** Distal segment, transdüser yönü ve sektör aynı poz modelinden üretilmeli. Rotasyon ve iki yönlü büküm görsel olarak ayrılmalı. ICE uç hareketi ile 2D görüntü yönü tutarlı kalmalı.

**Öncelik:** Yüksek.

### 3.2. Sol ve sağ pulmoner ven ölçütleri ayrışmıyor

**Kanıt:** `echo-anatomy.js` dört pulmoner veni tek `pv` grubunda topluyor. `ice-left-pv` ve `ice-right-pv` aynı `required: ['la', 'pv']` ölçütünü kullanıyor.

**Etkisi:** Mevcut değerlendirme görülen venin sol mu sağ mı, superior mu inferior mu olduğunu doğrulamıyor. Bir PV konturu görmek hedef ven çiftini göstermekle eşdeğer kabul edilebiliyor.

**Öneri:** LSPV, LIPV, RSPV ve RIPV kimlikleri kesit ve etiketleme boyunca korunmalı. Sol ve sağ görünüm için ayrı ven çifti, ostiyum görünürlüğü ve görüntü içi ilişkiler değerlendirilmelidir. Sol PV görünümündeki iki ven ilişkisi ayrıca gösterilmeli.

**Öncelik:** Yüksek.

### 3.3. Septal görünümün başarı ölçütü hedef anatomiyi sınamıyor

**Kanıt:** `ice-septal-sax` yalnız LA ve aort kapağını zorunlu tutuyor. RA, interatriyal septum ve fossa ovalis için bu görünüme özgü zorunlu ölçüt bulunmuyor.

**Etkisi:** Fossa ovalis veya uygun septal kesit gösterilmeden başarı bildirimi alınabilir. Modelin başarısı transseptal çalışma görünümünün yeterliliği anlamına gelmiyor.

**Öneri:** RA–septum–LA ilişkisi, fossa ovalis konumu, aortla komşuluk ve kesit yönü ayrı ölçütlere dönüştürülmeli. Ölçülemeyen veya atlasta bulunmayan yapı için başarı varsayılmamalı; açıkça sınırlı değerlendirme bildirilmeli.

**Öncelik:** Yüksek.

### 3.4. Transseptal demonstrasyon metin düzeyinde kalıyor

**Kanıt:** Ders metni iğne yaklaşımı, çadırlanma ve geçişi anlatıyor; ICE görünümünde bu işlemin aşamalarını gösteren iğne, septal temas ve çadırlanma demonstrasyonu bulunmuyor.

**Etkisi:** Kullanıcı anlatılan işlemi anatomik kesitte izleyemiyor.

**Öneri:** Ayrı bir öğretim dizisi oluşturulmalı: hedef septumu bulma → iğnenin yaklaşımı → şematik temas ve çadırlanma → şematik geçiş. Her aşama hem 3D hem 2D kesitte gösterilmeli. Şematik işlem, gerçek temas veya güvenli ponksiyon kanıtı olarak sunulmamalı.

**Öncelik:** Yüksek; anatomik referanslar doğrulandıktan sonra.

### 3.5. MV/LAA başlığı ile değerlendirme uyuşmuyor

**Kanıt:** `ice-mitral-laa` LA, mitral kapak ve LV'yi zorunlu tutuyor; LAA zorunlu değil. İncelenen hazır pozda LAA konturu vardı, ancak görev ölçütü bunu gerektirmiyor.

**Etkisi:** LAA görünmeden MV/LAA görevi tamamlanabilir.

**Öneri:** LAA görünürlüğü ve beklenen görüntü yönü ölçütlere eklenmeli. LAA'nın yalnız bir kontur parçası olarak görünmesiyle tanınabilir şekilde gösterilmesi ayrılmalı.

**Öncelik:** Yüksek.

### 3.6. Diğer hazır görünümlerin ölçütleri de başlığa göre zayıf

**Kanıt:** RVOT görünümü RV ve aort kapağını arıyor; pulmoner kapak zorunlu değil. SVC görünümü yalnız SVC'yi arıyor. Home görünümünde metinde anlatılan aort kapağı, incelenen durdurulmuş kesitin görünür yapı listesinde bulunmadı.

**Etkisi:** Görünüm adının ve ders metninin vaat ettiği anatomi bütünüyle gösterilmeden başarı bildirilebilir.

**Öneri:** Her görünüm için temel hedef, yardımcı yapı ve isteğe bağlı yapı açıkça tanımlanmalı. Ölçütler yalnız kontur uzunluğuna değil hedefin yönüne, komşuluğuna ve görünüm niteliğine de dayanmalı. Metindeki yardımcı bulgular zorunlu değilse bu ayrım belirtilmeli.

**Öncelik:** Orta–yüksek.

### 3.7. Klinik yön tarifleri ile hazır poz kontrolleri uyuşmuyor

**Kanıt:** Septal kısa eksen tarifi posterior ve sağ büküm, 100–150° rotasyon diyor. Hazır atlas pozu 95° rotasyon, `anteroposterior: +35`, `leftRight: +35` kullanıyor. Arayüz pozitif değerleri ön ve sol olarak etiketliyor. Sağ PV tarifi posterior bükümün korunduğunu söylüyor; hazır pozda iki büküm de sıfır.

**Etkisi:** Kaynak tarifi izleyen kullanıcı ile hazır görünüm düğmesini kullanan kullanıcı aynı manevrayı öğrenmiyor. Atlas kalibrasyonu ile klinik tarif arasındaki ayrım öğretim açısından yeterince açıklanmıyor.

**Öneri:** Hasta koordinatları, kateter kontrol yönleri ve ekran yönleri birlikte denetlenmeli. Sorunun kontrol işaretinden mi, geometri modelinden mi, atlas kalibrasyonundan mı geldiği belirlenmeli. Hazır poz, kaynak tarifine uyacak şekilde düzeltilmeli veya kalan fark görünümün yanında açıkça belirtilmeli. Klinik açıları yalnız mevcut testi geçirmek için değiştirmek uygun değil.

**Öncelik:** Yüksek.

### 3.8. Ders akışı taramayı adım adım öğretmiyor

**Kanıt:** RVOT, LVOT/AV, MV/LAA ve pulmoner venler tek ders adımında anlatılıyor; adım doğrudan MV/LAA hazır pozunu açıyor.

**Etkisi:** Rotasyon boyunca hangi yapının ne zaman görüntüye girdiği açıkça izlenemiyor. Dar eko panelindeki küçük kesitler ve üst üste gelen etiketler ayırt etmeyi zorlaştırıyor; büyütme kontrolü mevcut olsa da başlangıç gösterimi yoğun.

**Öneri:** Home → çıkış yolları → MV/LAA → sol PV → septum → sağ PV → SVC ayrı adımlar olmalı. Her adımda hedef yapı vurgusu, hareket yönü ve önceki/sonraki kesit ilişkisi gösterilmeli. Kademeli tarama veya kullanıcı kontrollü hareket demonstrasyonu eklenmeli. Etiket çakışmaları azaltılmalı.

**Öncelik:** Orta; anatomik ve hareket doğruluğundan sonra.

## 4. Önerilen uygulama sırası

1. **Koordinat ve hareket denetimi:** Rotasyon, ön/arka ve sol/sağ büküm işaretlerini doğrula; distal kateteri ve transdüseri aynı poz modeliyle göster.
2. **Anatomik kimlikler ve ölçütler:** Venleri ayrı tut; septum/fossa ovalis, LAA ve görünüm hedeflerini değerlendirmeye ekle.
3. **Hazır pozların yeniden değerlendirilmesi:** Sadece yapı varlığını değil yön, komşuluk ve tanınabilir görünümü kontrol et. Kaynak tarifleriyle farkları belgele.
4. **Demonstrasyon akışı:** Görünümleri ayrı ders adımlarına ayır; hareket–kesit ilişkisini ve hedef yapıyı birlikte vurgula.
5. **Transseptal öğretim dizisi:** Doğrulanmış septal geometri üzerinde iğne yaklaşımı ve şematik çadırlanma gösterimini ekle.
6. **Uzman görsel değerlendirmesi:** Hazır kesitleri ve hareket yönlerini ICE deneyimi olan klinisyenle doğrula.

## 5. Kabul ve regresyon ölçütleri

- Büküm değişince distal kateterin yönü ve görüntü düzlemi birlikte değişmeli; ilerletme ile rotasyon birbirine karışmamalı.
- Sol PV görevinde sağ venler, sağ PV görevinde sol venler hedefi karşılamamalı.
- LAA görünmeden MV/LAA görevi tamamlanmamalı.
- Uygun septal ilişki gösterilmeden transseptal çalışma görünümü tamamlanmamalı.
- RVOT gibi görünüm adları, zorunlu hedef yapılarıyla tutarlı olmalı.
- Hazır pozlar kalp döngüsünün farklı fazlarında incelenmeli; diyastol sonu görev değerlendirmesi ile canlı görüntü arasındaki fark korunmalı ve açıklanmalı.
- Türkçe ve İngilizce hareket tarifleri, kontrol işaretleri ve görüntü etiketleri eşleşmeli.
- Masaüstü ve dar ekranlarda kesit, etiketler ve kontrol değerleri okunabilir olmalı.
- Şematik kesit, gerçek ultrason görüntüsü veya klinik işlem doğrulaması olarak sunulmamalı.

## 6. Çalıştırılan kontroller ve sonuçları

### Chrome görsel ve durum incelemesi

Sekiz hazır görünüm mevcut model ölçütlerine göre `achieved: true`, `missing: []`, `wrong: []` verdi:

| Görünüm | Mevcut model sonucu |
|---|---|
| Home | Geçti |
| RVOT | Geçti |
| LVOT / aort kapağı | Geçti |
| Mitral / LAA | Geçti |
| Sol pulmoner venler | Geçti |
| Septal kısa eksen | Geçti |
| Sağ pulmoner venler | Geçti |
| SVC | Geçti |

Bu sonuç mevcut ölçütlerin çalıştığını gösterir; klinik görünüm doğruluğu veya demonstratif yeterlilik onayı değildir. Görsel inceleme kalp hareketi durdurularak yapıldı; bu tur tüm fazları kapsayan yeni bir ICE testi çalıştırılmadı.

### Otomatik kontroller

```sh
node scripts/test-echo-section.mjs
node scripts/test-echo-renderer.mjs
node scripts/test-echo-training.mjs
```

- Kesit testi: **PASS**; kapalı/açık konturlar, birleştirme, yön, dünya matrisi ve canlı konumlar.
- Çizim testi: **PASS**; sektör geometrisi, kırpma, iki stil, etiketler, boş görüntü ve dondurma.
- Eğitim testi: **PASS**; apeks kısalması, bikaval ilişkiler, mitral kesit açısı, fleksiyon/multiplan ayrımı, lümen sınırı ve göğüs teması.

Bu testler yukarıdaki ICE'ye özgü eksikleri bütünüyle sınamıyor. Kod değişmediği için bu rapor turunda tam test paketi veya üretim derlemesi çalıştırılmadı.

## 7. Kaynaklar ve sınırlar

1. Bortnick A, Halaby R, Silvestry FE, Herrmann HC. **Intracardiac echocardiography.** The PCR Textbook; güncelleme 21 Haziran 2020. [Kaynak](https://textbooks.pcronline.com/the-pcr-textbook/intracardiac-echocardiography).
2. **Intracardiac Echocardiography during Invasive Electrophysiological Procedures: a Scientific Statement of the European Heart Rhythm Association of the ESC, and the European Association of Percutaneous Cardiovascular Interventions of the ESC.** EP Europace. 2026;28(6):euag059. [Kaynak](https://academic.oup.com/europace/article/28/6/euag059/8651483).

Kaynaklar standart görüntü dizisini ve kateter hareketi–hedef anatomi ilişkisini karşılaştırmak için kullanıldı. Bu rapor sistematik literatür taraması veya tüm ders metnindeki klinik ifadelerin kapsamlı doğrulaması değildir. Atlas pozları için bağımsız klinisyen değerlendirmesi yapılmadı. Bulgular mevcut kod ve gözlenen kesitlere dayanır; aynı incelemeci tarafından yorumlanmıştır.

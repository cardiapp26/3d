# Tıbbi tutarlılık denetimi

Tarih: 2026-10-09. Kapsam: Cardia öğretim uygulamasının bütün bölümleri. 3D stüdyo modları 01–16, `/eps/`, `/pharmacology/`, `/ecg/`. Kod değiştirilmedi. Bu belge tanı veya tedavi rehberi değildir. Uygulamanın kendi uyarısı da içeriği şematik eğitim malzemesi sayar. O uyarı, aşağıda yanlış çıkan karar kuralını, kenar adını veya doz atfını doğru yapmaz.

Kaynaklar satır satır açıldı: `src/content.js`, `src/blood-flow.js`, `src/exam-findings.js`, `src/hemo-scenarios.js`, `src/hemodynamics.js`, `src/hemo-formulas.js`, `src/hemo-panel.js`, `src/hemo-panel-calculators.js`, `src/pharmacology-data.js`, `src/ecg/guyton-data.js`, `src/eps/wpw-loc-model.js`, `src/eps/wpw-loc-text.js`, `src/eps/ves-loc-model.js`, `src/eps/svt-dx-model.js`, `src/eps/svt-dx-text.js`, `src/eps/ep-live-text.js`, `src/eps/ep-cases-advanced.js`, `src/eps/egm-basics-text.js`. Karşılaştırma: Arruda 1998, EASY-WPW (El Hamriti, Europace 2023), Enriquez (Heart Rhythm 2019), Betensky (JACC 2011), Kerr (Circulation 1982), Michaud 2001, Lembo (NEJM 1988), ESC 2019 SVT, 2022 ESC/ERS pulmoner hipertansiyon tanımı, AHA adenozin başlangıç dozu, güncel atriyal ve transseptal anatomi.

## Özet

Ürünün büyük kısmı güncel kardiyoloji öğretimiyle uyumlu. Güvenlik kartlarının yönü (sınıf IC, preeksite AF'de nodal bloker, dofetilid, dronedaron, ACEI-ARNI, nitrat-PDE5) doğru. Çatışma, az sayıda cümle ve karar kuralında.

7 Ekim WPW notundaki hatalar kapanmış. Sağ serbest duvar artık aVF pozitif değilse DII ile ayrılıyor. Başarı cümleleri polariteye göre ayrılmış. Lokal V için Josephson eşiği en az 25 ms. ERP ≤250 ms tek başına ablasyon endikasyonu değil.

## Çatışmalar

### 1. Adenozin başlangıç dozu AHA'ya yanlış bağlanmış

Dosya: `src/pharmacology-data.js`, adenozin kartı (TR ve EN).

Periferik erişkin bolus 6 mg, gerekirse 1–2 dakika sonra 12 mg, proksimal damar ve hemen salin doğru. Aynı kart, nakil ve santral yol için AHA'nın 1 mg'ı yeterli bulduğunu yazıyor. AHA'nın bu durumlarda, ayrıca dipiridamol ve karbamazepinde, indirdiği başlangıç dozu 3 mg'dır. 1 mg bazı nakil protokollerinde alt sınırdır ve santral yol için AHA dozu değildir.

Aynı kartta doğru kalanlar: preeksite AF ve düzensiz geniş kompleks taşikardide vermemek, aktif bronkospazm, metilksantinin etkiyi azaltması, dipiridamolün etkiyi artırması, karbamazepinin AV bloğu ağırlaştırabilmesi.

### 2. Fossa kenar adları yer değiştirmiş

Dosya: `src/content.js`, fossa ovalis klinik notu.

Üst kenar aort köküne, alt kenar triküspit anülüse bağlanmış. Üst kenar vena kava süperiora, alt kenar vena kava inferiora bakar. Aort kökünün karşısındaki kenar anterosüperior (aortik) kenardır. Triküspit menteşesi ve koroner sinüs ağzı anteroinferiordur. Fossa'nın nonkoroner küspisin inferiyor ve posteriorunda durduğu cümle doğrudur.

Aynı dosyadaki transseptal adım EHRA sınır listesini doğru verir: üstte ve altta kaval ağızlar, anterosüperiorda nonkoroner sinüs, önde septal triküspit menteşesi, arkada limbus, anteroinferiorda koroner sinüs ağzı.

### 3. İnternodal yollar özelleşmiş trakt gibi yazılmış

Dosya: `src/content.js`, sinüs düğümü klinik cümlesi.

Uyarı "internodal yollar ve Bachmann demeti" üzerinden AV düğüme ilerletiliyor. Yalıtılmış, histolojik olarak özelleşmiş internodal trakt yoktur. Tercihli iletim Bachmann bandı, krista terminalis ve fossa kenarları boyunca sıradan atriyal miyokardadır. Aynı dosyadaki Bachmann notu bandın yalıtılmış kablo olmadığını doğru söyler. Sinüs düğümünün vena kava süperior-sağ atriyum bileşkesi, sulkus terminalis ve subepikardiyal yerleşimi doğrudur.

### 4. Statik balon ile Rashkind septostomisi birleştirilmiş

Dosya: `src/content.js`, transseptal adımlar.

Başlık "statik balon"dır ve metin balonu septum hizasında, bel kaybolana kadar şişirir. Örnek olarak duktus bağımlı dolaşım verilmiştir. O örnek Rashkind balon atriyal septostomisidir: balon sol atriyumda şişirilir ve hızla sağ atriyuma çekilir. Bel kaybolana kadar inflasyon, kalın septum veya seçilmiş pulmoner hipertansiyon dekompresyonundaki statik balon dilatasyondur. Pulmoner hipertansiyon örneği statik tekniğe uyar. Duktus bağımlı örnek uymaz.

### 5. Septum lateral görünümde hem görünmez hem ölçülür

Dosya: `src/content.js`, fossa konum paragrafı.

Paragraf atriyal septumun oblik düzlemde olduğunu ve frontal ya da lateral görünümde görülemeyeceğini söyler. Aynı paragraf lateralde fossayı, aort kökünden omurgaya çizilen yatay çizginin 3–5 mm altında diye ölçer. Düz AP septumu profillemez. Lateral projeksiyon transseptal işlemde standarttır.

Paragrafın geri kalanı tutarlıdır: LAO 45° teğet, RAO 30° yüz yüze, iğnenin nonkoroner pigtail'e göre posteroinferiyor durması, iki sıçrama, fossa alanı 1,5–2,4 cm², işleme göre ponksiyon yüksekliği (MitraClip süperior-posterior, LAA inferiyor-posterior, PVI santral ve hafif alçak, LV ablasyonu anterior ve alçak-orta), ACT >300 sn, LA girişinin en az iki bulguyla doğrulanması. "Tek mutlak kontrendikasyon septal trombüs ve septal miksoma" cümlesi Ducrocq bölümüne bağlanmıştır ve aynı adım yeni sol atriyum veya apendiks trombüsünden kaçınmayı da söyler. Bu ikinci bir çatışma değildir.

### 6. LV summit EKG'si "genellikle RBBB" diye kilitlenmiş

Dosya: `src/content.js`, EP anatomi, LV summit cümlesi.

Anatomi tutarlıdır: LAD-LCx üçgeni, sol ana bifurkasyonun altında, GCV-AIV geçişinin erişilebilir alt bölge ile genellikle erişilemeyen üst bölgeyi ayırması, ablasyonun venden, epikarddan veya komşu sol küspis ve LVOT'tan yapılması, önce koroner görüntüleme. İnferiyor aks, negatif DI ve aVL'de aVR'den derin Q sol çıkışa uyar.

"Genellikle RBBB" fazla kesindir. RBBB sola bakan erişilebilir odaklarda tipiktir. Sağa bakan ve erişilemeyen odaklarda sık kalıp erken geçişli LBBB'dir. Summit aritmilerinde genel olarak LBBB daha yaygındır. Süperiyor mitral anülüs ve sol küspis ile çakışma aynı cümlede zaten belirtilmiştir.

### 7. ASD cihazı için altı sektörün hepsinde ≥5 mm istenmiş

Dosya: `src/content.js`, ICE septal görünüm (Bortnick, Halaby, Silvestry, Herrmann; PCR-EAPCI, 2020 atfı).

En az 5 mm, süperior, inferiyor, posterior ve atriyoventriküler kenarlar için olağan kuraldır. Anterosüperior aort kenarının kısa olması sıktır. Diğer kenarlar cihazı tutuyorsa bu eksiklik tek başına kontrendikasyon değildir.

ICE saat yönü dizisinin geri kalanı standart öğretimle uyumludur: home 15–30°, 30–40° aort kapağı yakın ve RVOT uzak, yaklaşık 45° aort uzun eksen ve LVOT, 90–100° sol venler, septal kısa eksen, 150–180° sağ venler. Nonkoroner küspisin anterior sol atriyum karşısında, sağ küspisin RVOT yanında, sol küspis ve sol ananın apendiks yanında durması doğrudur. Atlas uyarıları (RSPV'nin RIPV'den önce çizilmesi, tek LV papiller kas, şematik özofagus, Bachmann ve frenik sinirin puanlanmaması) açıktır.

### 8. Akış lejantı bütün venleri mavi sayıyor

Dosya: `src/content.js`, `flowLegendTitle`. TR: "Mavi (Sağ kalp / Pulmoner arter / Venöz sistem)". EN: "Blue (Right heart / Pulmonary artery / Veins)".

Pulmoner venler oksijenlidir ve sol kalp grubuna girer. Mavi sınıf sistemik venler, koroner sinüs, sağ kalp ve pulmoner arterdir. Parçacık akışı bunu doğru çizer (`src/blood-flow.js`): LSPV, LIPV, RSPV ve RIPV `oxygenated`, VKS, VKİ, pulmoner arter ve koroner venler `deoxygenated`. Yanlış olan lejant cümlesidir, akışın rengi değildir.

### 9. SVT karar kuralları kapıyı fazla kapatıyor

Dosyalar: `src/eps/svt-dx-model.js`, `src/eps/svt-dx-text.js`.

| Bulgu | Kodun kapattığı | Güncel ayırım |
|---|---|---|
| Sinüs P'sinden farklı P | AVNRT, AVRT ve sinüs düğümü reentrisi gider; atriyal taşikardi lehine | Retrograd P sinüs P'sinden farklıdır. Bu bulgu sinüs düğümü reentrisini dışlar. AVNRT ve AVRT kalır. Sinüs P'sine benzeyen dalga için AVNRT ve AVRT'yi elemek doğrudur. |
| Yukarıdan aşağı aktivasyon | Yalnız atriyal taşikardi kalır | Sinüs düğümü reentrisi de sinüs gibi yukarıdan aşağı iner. AVNRT ve AVRT'yi elemek doğrudur. |
| Sabit AA, değişken RP | Yalnız fokal atriyal taşikardi kalır | VA bağlantısı kalkar, AVNRT ve AVRT gider. Değişken bloklu flutter ve sinüs düğümü reentrisi kalmalıdır. |
| A > V açıklaması | AVRT doğru biçimde elenir | Metin, atriyuma ulaşmayan vurunun devreyi bozduğunu söyler. A > V, AV blokudur. Devre, atriyal vuru ventriküle ulaşmadığı için kırılır. |
| V > A açıklaması | AVRT ve atriyal ritimler doğru biçimde elenir | Olağan AVNRT mekanizması üst ortak yolda bloktur. Çift antegrad yoldan 1:2 iletim ayrı ve seyrek bir olaydır. Nodoventriküler devre kalabilir. |
| Blok sürerken izoelektrik P | Flutter ve bütün AVNRT gider | Flutter'ı izoelektrik tabanla elemek doğrudur. Metin "AVNRT'de çok seyrek" der. Model bu olguyu imkansız kılar. 2:1 AVNRT seyrektir, yoktur denemez. |
| VA >70 ms | Tipik AVNRT gider | En erken septal VA <70 ms ortodromik AVRT'yi dışlar. Tersi, tipik yavaş-hızlı formu laboratuvar tanımıyla uzaklaştırır. AVNRT sınıfının tamamını dışlamaz. Atipik dal kodda durur. Katı öğretim kısaltmasıdır, güvenlik tersine çevirmesi değildir. |
| Dal bloğunda VA ≥30 ms | Serbest duvar yolu (Coumel); AVNRT ve atriyal ritimler gider | Kerr (Circulation 1982) serbest duvar için en az yaklaşık 35 ms, septal için 25 ms ve altı bildirmiştir. AVNRT'yi elemek yerindedir. 30 ms'yi serbest duvar diye adlandırmak eşiğin altındadır. VA değişmemesinin hiçbir şeyi elemediği doğru yazılmıştır. |

His-refrakter PVC, para-His pacing, V-A-V ile V-A-A-V, yalancı V-A-A-V ve septal karşılaştırmaya sınırlı PPI-TCL >115 ms ile SA-VA >85 ms tutarlıdır. Adenozin veya karotis masajıyla P dalgasında bitişin atriyal ritimleri elemesi doğrudur. Kısa RP'nin atipik AVNRT ve yavaş retrograd yollu AVRT'yi, uzun RP'nin tipik AVNRT ve hızlı retrograd yollu AVRT'yi elemesi doğrudur.

### 10. VES ağacı, negatif DI ve V3 geçişini yalnız ön RVOT'a kapatıyor

Dosya: `src/eps/ves-loc-model.js`, `VES_STEPWISE`. Negatif veya bifazik DI dalında `late` ve `v3` birlikte `anteriorRvot` yaprağına gider.

Aynı sayfa V3'te RVOT ile LVOT'un çakıştığını ve V2 geçiş oranını gösterir. Betensky (JACC 2011) ve Enriquez (Heart Rhythm 2019) V3 geçişini belirsiz bırakır. Oran, yalnız LBBB tipi, inferiyor aks ve V3 geçişli vuruda, `[R/(R+|S|)]PVC / [R/(R+|S|)]sinüs` biçimindedir. <0,60 RVOT, ≥0,60 LVOT lehinedir. Negatif DI sol çıkışı (sol küspis, summit) bu çakışmadan çıkarmaz.

Pozitif DI ve negatif aVL dalı V3'te arka RVOT ile sağ küspisi birlikte tutar. O dal doğrudur. Dixit 2003 serbest duvar RVOT ölçütleri (QRS ≥140 ms, inferiyor çentik, V3 R/S ≤1) ve Park 2012 para-His ölçütleri sayfadaki sınırla uyumludur. QRS 130 ms tanı eşiği diye kullanılmaz. İletim yaprakçıkları aritmi kaynağı diye gösterilmez. Haritalar şematik ve atlasa kayıtlı değildir.

### 11. Gizli sol lateral ORT'ye septal entrainment eşikleri yazılmış

Dosya: `src/eps/ep-live-text.js`, `ort-left` ipucu.

Manevra sonucu olarak PPI-TCL ≤115 ms ve SA-VA ≤85 ms verilmiştir. Bu eşikler septal aksesuar yol ile AVNRT ayrımındandır (Michaud 2001). RV apeksinden bakınca sol serbest duvar yolu çoğu kez PPI-TCL >115 ms verir. Aynı dosyanın genel overdrive metni uzun dönüşün sol serbest duvar yolunu dışlamadığını doğru söyler. cPPI-TCL <110 ms (González-Torrecilla) ortodromik AVRT lehinedir ve ayrıca doğru yazılmıştır.

Aynı kartta doğru kalanlar: sinüste preeksitasyon yok, retrograd aktivasyon distal koroner sinüsten erken, VA yaklaşık 130 ms, ablasyon en erken retrograd A'da, His-refrakter PVC'nin atriyumu öne çekmesi.

Preeksite AF kartı en kısa preeksite RR için kesin <250 ms der. ESC 2019 yüksek risk eşiği ≤250 ms'dir (SPERRI). WPW sayfası ≤250 ms'yi doğru yazar. Tam 250 ms yüksek risktir. AV nodal bloker kontrendikasyonu ve ablasyon sonrası AF'nin dar QRS ile sürebilmesi doğrudur.

### 12. Şant olgularında PVR sistemik akıma bölünüyor

Dosyalar: `src/hemo-scenarios.js` (şantta `co` = Qs), `src/hemodynamics.js` (`pvrWood(means.pa, means.pcwp, scenario.co)`), `src/hemo-formulas.js`.

PVR = (ortalama pulmoner arter basıncı − PCWP) / Qp. Paydada Qs kullanmak PVR'yi yaklaşık Qp/Qs kadar büyütür. Hafif yüksek basınçlı ASD ve VSD tablolarında gösterilen Wood birimi olağan >2 eşiğini geçebilir. SVR'nin Qs kullanması doğrudur. TPG = ortalama PA − PCWP ve DPG = PA diyastolik − PCWP doğrudur.

### 13. Fick kutusu şantta Qp'yi kalp debisi diye dolduruyor

Dosya: `src/hemo-panel-calculators.js`. Ölçüm satırı karışık venözü Flamm ile `(3×SVC + IVC)/4` hesaplar. Fick ön doldurması `svo2` alanına pulmoner arter satürasyonunu yazar.

Soldan sağa şantta proksimal karışık venöz (atriyal şantta Flamm, ventriküler şantta sağ atriyum) Qs örneğidir. Pulmoner arter satürasyonu Qp örneğidir. ASD'de ölçüm satırı yaklaşık %68 karışık venöz ve Qs 4,1 L/dk iken Fick kutusu PA satürasyonu %84 ile yaklaşık 8,8 L/dk döndürür. Bu sayı Qp'dir. VSD'de aynı ayrım vardır. Qp/Qs formülü ve basamak tarama eşikleri (atriyal yaklaşık %7, ventrikül ve büyük arter yaklaşık %5) doğrudur.

### 14. Tamponad inspirasyonunda LV sistolik tepe aortun altına iniyor

Dosya: `src/hemodynamics.js`, `respirationAdjust`. Tamponad hedefleri LV 95/16, aorta 92/68 (`src/hemo-scenarios.js`). Bayraklar: künt y, eşit diyastol, `pulsus_paradoxus`, `ventricular_interdependence`.

Pulsus katsayısı 0,4 nabız basıncını diyastolik tabana doğru ezer, sonra interdependence katsayısı 0,1 aynı ekseni bir kez daha ezer. Tam inspirasyonda LV sistolik tepe yaklaşık 58 mmHg, aort sistolik tepe yaklaşık 80 mmHg olur. Aort kapağı açıkken LV sistolik basıncı aortun altında kalamaz. Pulsus, arter sistolik basıncında genellikle ≥10 mmHg düşüştür. LV tepe, kapak açıkken aortun üstünde kalacak biçimde birlikte düşer.

Tamponad tablosunun yönü doğrudur: künt y, Kussmaul yok, karekök yok, eşit diyastol, dar nabız basıncı, düşük debi, taşikardi.

### 15. Saf konstriksiyon yaklaşık 11 mmHg arter salınımı üretiyor

Aynı ölçek. Konstriksiyonun `pulsus_paradoxus` bayrağı yoktur. `ventricular_interdependence` vardır. Aort 105/70. Ekspirasyondan inspirasyona sistolik tepe yaklaşık 111 mmHg'den yaklaşık 100 mmHg'ye iner. Yaklaşık 11 mmHg, ≥10 mmHg pulsus tanımına girer. Sert konstriksiyonda y inişi diktir, diyastol eşitlenir ve pulsus yoktur ya da küçüktür. ≥10 mmHg tamponad veya effüziv-konstriktif hastalığa işaret eder.

Diskordansın yönü doğrudur: inspirasyonda RV sistolik yükselir, LV düşer. Konstriksiyon ile restriksiyon ayrımı basınç tablosunda doğrudur. Konstriksiyonda diyastol yaklaşık 20 mmHg'de eşitlenir, RVEDP/RV sistolik = 0,5. Restriksiyonda LVEDP 26, RVEDP 16, pulmoner basınç daha yüksektir ve Kussmaul bayrağı yoktur.

### 16. Verimli ventrikül-arter eşleşmesi fazla dar ve fazla düşük bir banda çizilmiş

Dosya: `src/hemo-panel.js`, normal P-V açıklaması. "Ea/Ees yaklaşık 0,5 (0,3–0,7 arası verimli eşleşme)."

Yaklaşık 0,5 mekanik verim için uygun bir örnektir. Atım işi Ea/Ees yaklaşık 1 yakınında en yüksektir. Erişkin istirahat değerleri çoğu seride yaklaşık 0,5–1,2 arasındadır. 0,3 normal bir çalışma noktası değildir. Döngünün öğretim modeli olduğu ve hasta verisi olmadığı ayrıca yazılmıştır.

### 17. Guyton bazal adımda İngilizce, −45° ile DI'de S dalgasını bir tutuyor

Dosya: `src/ecg/guyton-data.js`, bölüm 12, adım 4, vektör açısı −45°.

Türkçe doğru: bu örnekte DI pozitif, DII ve DIII negatiftir. İngilizce terminal S'yi DI, DII ve DIII'te yazar. DI'de S, terminal vektörün yaklaşık −90° ve daha sağına kaymasını ister. Guyton bölüm 12'de geç bazal vektör sol ventrikül tabanına giderken DI pozitif, DII ve DIII negatif kalır. Kayıtlı `waves.lead1: -0.15` Türkçe cümle ve −45° ile çelişir. Ekrandaki uzuv derivasyonları açıdan projeksiyonla çiziliyorsa iz, Türkçe cümleyle uyumlu kalır. Saklı dalga değeri uyumsuzdur.

### 18. İngilizce re-entry cümlesi hızı yarıya indirmeden süreyi iki katına çıkarıyor

Aynı dosya, bölüm 13, kural 2. Türkçe: iletim hızı yarıya inince yol süresi iki katına çıkar. İngilizce: hız yavaşlarsa uyarı süresi iki katına çıkar. Süre, hız yarıya inmeden iki katına çıkmaz. Çizilen halka laboratuvarı tek yönlü blok ve dalga boyundan uzun yol ister. Guyton'un üç etkeninin her birinin zorunlu olmadığı notu yerindedir.

## Bölüm bölüm hüküm

| Bölüm | Hüküm |
|---|---|
| 01 Kaba anatomi | Çatışma: internodal yollar, fossa kenar adları, akış lejantı. Sinüs düğümü yeri, krista, Chiari ağı, koroner sinüs, Koch, His ve sağ dal tutarlı ve şematik diye işaretli. |
| 02 Sol atriyum ve apendiks | Tutarlı. Dört ven oksijenli kanı posterior duvara getirir. Apendiks anterolateralde, boynu LSPV önünde, Coumadin sırtıyla ayrılmış. Halka şematik ağız işaretidir. |
| 03 Sağ atriyum | Krista, sinüs düğümü ve Chiari tutarlı. Fossa kenar cümlesi 01 ile aynı nesnedir. |
| 04 Sağ ventrikül | Tutarlı. Giriş, trabeküllü apeks ve RVOT şematik öğretim bölgeleridir. |
| 05 Sol ventrikül | Tutarlı. ASE/AHA 16 segment (Lang, JASE 2015). Aort kapağı yönü anteroseptal segmentlerin ortasıdır. |
| 06 ASD ve VSD | Tutarlı. Yalnız sekundum fossa içindedir. Primum parsiyel AVSD'dir, iletim ekseni posteroinferiordur. Sinüs venosus ve koroner sinüs defektleri gerçek septumun dışındadır. Perimembranözde His posteroinferiyor, musküler inlette anterosüperiordur. |
| 07 Fizik muayene | Tutarlı. Lembo 1988 duyarlılık ve özgüllükleri özetle birebir. Yönler standart yatak başı öğretimiyle uyumludur. |
| 08 Koroner anjiyografi | Tutarlı. Sol ostium sinüs duvarının üst üçte birindendir. Spider, LAO kraniyal, RAO kraniyal ve RAO kaudal boşluk karşılıkları PCR-EAPCI düzeniyle uyumludur. Sağ dominans "çoğu hastada" kaydıyla verilmiştir. |
| 09 Kateter ve hemodinami | Basınç yönleri, Gorlin sabitleri (aort 44,3, mitral 37,7), Hakki, Fick iskeleti, Qp/Qs cebiri ve 2022 mPAP >20 mmHg tanımı tutarlıdır. Çatışma: PVR paydası, Fick ön doldurması, tamponad ve konstriksiyon solunum ölçeği, Ea/Ees bandı. |
| 10 Transseptal ve septostomi | Çatışma: lateral görünüm cümlesi ve duktus bağımlı örnekle statik balon. EHRA sınırları, floroskopi adımları ve trombüs uyarısı tutarlıdır. |
| 11 EP anatomi | Çatışma: summit için genellikle RBBB. CTI, Koch, WACA, çatı hattı, mitral istmus ve yavaş yol uçları tutarlıdır. Projeksiyon temas kanıtı değildir. Kavşak ritmi tek başına başarı değildir. |
| 12 Pacemaker | Tutarlı. RAA, LAO'da septal yön, sol dal bölgesi His-apeks çizgisinde His'in yaklaşık 1–1,5 cm distalinde, V1 qR veya Qr, CS leadi posterolateral vende. |
| 13 Bachmann | Tutarlı. Band yalıtılmış kablo değildir. Bu not, 01'deki internodal cümleyle çelişir. Floroskopi yakalamayı kanıtlamaz. |
| 14 TTE | Tutarlı, ASE düzeni. A4C aortu dışlar. Aralık dışı presetler açıklanmıştır. Ultrason simülatörü değildir. |
| 15 TEE | Tutarlı. 0° A1-P1, dört boşluk A2-P2, ilerletilmiş A3-P3, komissüral P3-A2-P1, uzun eksen 120–140° A2-P2. En-face haritada aort üstte, A1/P1 anterolateral. |
| 16 ICE | Çatışma: altı sektörün hepsinde ≥5 mm. Saat yönü dizisi tutarlıdır. |
| EPS WPW | Algoritma Arruda 1998 ile uyumlu. EASY-WPW %94'e karşı %75, 211 hasta, makalenin karşılaştırma cümlesiyle uyumlu (ham sayım ayrıca 197/211, %93). İngilizce DI ipucu yanlış okunabilir. Sayfa "her derivasyonda delta" der. DIII adımı tüm QRS R/S oranıdır. |
| EPS VES | Çatışma: negatif DI ve V3 yalnız ön RVOT. Oran penceresi ve uyarılar tutarlıdır. |
| EPS SVT | Çatışma: bölüm 9 tablosu. Manevra kartlarının septal sınırları tutarlıdır. |
| EPS manevra ve atriyal pacing | Tutarlı. AH sıçraması 10 ms kısaltmada ≥50 ms'dir ve AVNRT tanısı değildir. |
| EPS canlı olgular | Çatışma: sol lateral ORT eşikleri ve preeksite RR <250. Tipik ve atipik AVNRT, flutter, skar VT tutarlıdır. cSNRT >550 ms bir laboratuvar eşiğidir. Josephson çoğu yerde >525 ms kullanır. |
| EPS ileri olgular | Tutarlı. Sol posterior fasiküler VT (P1 tabandan apekse, P2 apeksten tabana, QRS sonrası retrograd His) ve BBRVT (His ve sağ dal her V'den önce, H-H değişimi V-V'den önce, sağ dal ablasyonundan sonra RBBB ve uzun HV). |
| EPS EGM temelleri | Tutarlı. PA 25–55, AH 55–125, HV 35–55 ms. HV katmanları tek başına pacing endikasyonu diye yazılmamıştır. Doğrulanmış infranodal blok cümlesi ESC 2021 çerçevesine uygundur. |
| EPS haritalama, substrat, AF, pace map | Tutarlı. Sinüs pace'i VT ile uyuşmayabilir ve yer yine istmus olabilir. PPI-TCL 0 devrededir. Uzun stim-QRS ve uzun PPI seyircidir. CFAE sürücü değil dalga kırılmasıdır. |
| Farmakoloji | Adenozin cümlesi dışında tutarlı. Ayrıntı aşağıdaki güvenlik listesindedir. |
| EKG (Guyton) | Çatışma: −45° İngilizcesi ve re-entry hız cümlesinin İngilizcesi. Aks, Einthoven ve kağıt hızı tutarlıdır. |

## Doğru kalan güvenlik ve yön kartları

- Sınıf IC iskemik ve yapısal kalpte kaçınılır (CAST).
- HFrEF dört sınıfı volüm tedavisinden ayrılmıştır: ARNI (sakubitril/valsartan) veya uygun değilse ACEI/ARB, kanıtlı beta bloker (karvedilol, bisoprolol, metoprolol süksinat), MRA, SGLT2. Digoksin sağkalım ilacı değildir. Finerenon ve vericiguatın listede olmaması, dört direk doğru söylendiği için çatışma değildir.
- Beta bloker şokta başlanmaz.
- ACEI ile ARNI birleştirilmez. Her iki geçiş yönünde en az 36 saat ara vardır.
- Nitrat ile PDE5 kontrendikedir. Sildenafil 24 saat ve tadalafil 48 saat yıkanma süreleri yazılmamıştır. Kontrendikasyon dururken bu bir eksikliktir, yanlış kural değildir.
- Dofetilid başlangıcı en az 3 gün yatış ve sürekli EKG ister. QTc sınırı, CrCl <20 mL/dk, hidroklorotiyazid ve verapamil kontrendikedir.
- Dronedaron kalıcı AF'de, yeni dekompanse semptomatik kalp yetersizliğinde ve NYHA IV'te kontrendikedir.
- Preeksite AF'de AV nodal bloker kontrendikedir.
- Koagülasyon: PT faktör VII ve ortak yol, aPTT faktör XII, XI, IX, VIII ve ortak yol, FXIII her ikisinin dışında. Warfarin oluşmuş faktörü silmez. INR DOAC ölçmez. Apiksaban Xa, dabigatran IIa. Normal PT ve aPTT anlamlı DOAC etkisini dışlamaz.
- Statin yüksek yoğunluk: atorvastatin 40–80 mg, rosuvastatin 20–40 mg, LDL'de yaklaşık ≥%50. Simvastatin 80 mg yeni başlangıç değildir.
- mPAP >20 mmHg pulmoner hipertansiyondur (2022 ESC/ERS). Eski ≥25 mmHg ve PVR >3 Wood eşiği tarihsel diye belirtilmiştir. PCWP ≤15 ve PVR >2 prekapiller, PCWP >15 postkapiller. DPG ≥7 ile PVR >2 kombine hastalık göstergesidir.
- Lembo sayıları: HOCM Valsalva 65/96, ayağa kalkma 95/84, çömelme 95/85, bacak kaldırma 85/91, handgrip 85/75. MR veya VSD handgrip 68/92, arteriyel oklüzyon 78/100, amil nitrit 80/90. Sağ taraf üfürümde inspirasyon 100/88. MVP'de handgrip, kaynaklar çeliştiği için dışarıda bırakılmıştır.
- Erişkin aks −30° ile +90° dahildir. LAD < −30°. RAD > +90°. Kağıt 25 mm/s, 1 mV = 10 mm, küçük kare 40 ms. PR 0,12–0,20 sn. QRS 0,06–0,10 sn.

## Hafif ifade sorunları

Bunlar tedavi kuralını tersine çevirmez.

- Guyton LBBB Türkçesi septum ve sağ ventrikülün "2–3 kat önce" uyarıldığını söyler. Dersin noktası sol ventrikül miyokard yayılımının çok daha uzun sürmesidir. İngilizce bunu daha doğru anlatır. −50° bir örnektir, zorunlu aks değildir.
- Tam blok satırının QRS alanı "geniş kaçış (Stokes-Adams)" der. Kaçış dar, kavşak kaynaklı da olabilir. Stokes-Adams senkop sendromudur.
- QT satırı 0,36–0,44 sn aralığını hız düzeltmeli QTc ile aynı nefeste birleştirir.
- WPW İngilizce DI ipucu, negatif veya izoelektrik deltayı sol serbest duvardan uzaklaşıyormuş gibi okutabilir. Türkçe nettir: vektör sol duvardan uzaklaşır, kaynak sol duvardır. Algoritma Türkçe ile uyumludur.
- WPW sayfa yönergesi her derivasyonda delta seçtirir. DIII kontrolü ve ipucu R>S ile R≤S'dir.
- Septal izoelektrik aVF yalnız mitral tarafa kodlanmıştır. Metin Arruda'nın triküspit tarafı açık bıraktığını söyler. Açıklanmış sadeleştirmedir.
- ASD öğretim satürasyonunda vena kava inferior (%64) vena kava süperiordan (%69) düşüktür. Normal senaryoda ilişki tersidir. Basamağın atriyumda olması doğrudur.
- Akut sol ventrikül yetersizliği de büyük v bayrağını kullanır (v 40, akut mitral yetersizlikte v 60). Yüksek sol atriyum basıncında işlevsel mitral yetersizlik ile bu dalga olabilir.
- Vazoaktif oklar nitel diye işaretlidir. Norepinefrin kalp hızını yalnız değişmez veya artar gösterir. Epinefrin SVR'si aralığın tamamında artar. Düşük doz epinefrin SVR'yi düşürebilir. Dobutamin 2–10 µg/kg/dk ACC kardiyojenik şok aralığı olarak ve evrensel tavan olmadığı yazılarak durur.
- Sınıf I EKG damgası bütün sınıf için "QRS genişler" der. Alt sınıf metni APD farkını ayrıca söyler. Lidokain normal dokuda genellikle QRS'i genişletmez.

## Bilerek şema bırakılmış olanlar

Koroner sinüs zamanları 40 ms. PVI'de dört halka. Duvar kesitleri histoloji değildir. Klasik kaskad, hücre temelli pıhtılaşmadan ayrıdır. Ekokardiyografi presetleri ultrason cihazı değildir. Hemodinami eğrileri hasta traseleri değildir. EASY-WPW'nin 7 bölgesi atlas yerleşimlerine indirgenmiştir (triküspit posterolateral sağ posteriora, anterolateral sağ anteriora). Vazoaktif oklar doz-yanıt eğrisi değildir. cSNRT >550 ms ile bazı metinlerdeki >525 ms aynı yöndedir.

## Bu turda yeniden açılmayanlar

Anjiyografide septal perforatörü tek projeksiyona kilitleyen bir cümle satır satır yeniden aranmadı. EASY-WPW şeklindeki sağ geç DIII satırı şekille yeniden karşılaştırılmadı. Sol lateral ORT'nin simüle sayısal PPI'si hesaplanmadı. İpucu, eşiği metin olarak septal kesime ait biçimde veriyor. ESC 2021 madde numarası kılavuz PDF'ine karşı açılmadı. İnfranodal blok cümlesi "doğrulanmış infranodal blok" diye sınırlı olduğu için kabul edildi.

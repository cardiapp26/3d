# Faz B, C ve D: kaynak matrisi, kurallar ve storyboard

**Tarih:** 30 Eylül 2026
**Dayanak:** `research/EASY_ECG_EP_OZGUN_GELISTIRME_RAPORU.md` bölüm 4 (Faz B-D) ve 6.
**Durum:** Faz B ve C uygulandı ve test edildi; Faz D için yalnız kaynak matrisi ve storyboard yazıldı (rapor, A-C ve EP uzman incelemesi bitmeden D'nin uygulanmamasını ister). Hiçbiri klinik olarak doğrulanmadı; EP uzman incelemesi yapılmadı.
**İçerik yazarı:** Claude (model). **Erişim tarihi:** 30 Eylül 2026, scite üzerinden özet, tam metin parçası veya atıf cümlesi. R numaraları `research/ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md` bölüm 13'teki listedir.

## 1. Faz B: dar QRS taşikardi görevi

### 1.1 Uygulama kararları

| Karar | Gerekçe |
|---|---|
| Görev EP panelinin Tanı sekmesinde; olgu gizli, sıralama tohumlu karıştırma | Rapor "ilk görünüm tanıyı saklar" der. Başlık yalnız görev numarası ve kanıt türünü gösterir; 3B zon yanıttan sonra açılır. |
| Olgular: tipik ve atipik AVNRT, sol lateral, inferior paraseptal ve para-Hisian gizli yol, PJRT, fokal AT | Rapor "mevcut AVNRT, AVRT, fokal AT ve PJRT olgularından" der; hepsinin etkileşimli manevra modeli (`ep-maneuver-sim.js`) vardır. |
| Manevralar yeni kayıt üretmez; `ep-maneuver-sim.js` olay modelini kullanır | Rapor "yeni kayıt gerekiyorsa olay modeline ekleyin; sabit metinle sahte etkileşim kurmayın" der. Görev yalnız sınıflama ekler. |
| Dört durum: destekler, aleyhine (dışlamaz), dışlamaz, yorumlanamaz | Rapor üç durumu ister. "Aleyhine, dışlamaz", "dışlamaz"ın alt türüdür; ekranda her zaman "dışlamaz" sözcüğüyle birlikte yazılır. Böylece bir gözlem hiçbir mekanizmayı tek başına dışlamaz. |
| Görev şeridinde (taşikardi ve manevra kayıtları) ablasyon kateteri (ABL d) yok: kanal, olay ve kaliper olarak | Hedefte duran kateter en erken A'yı verir; kanalın yalnız varlığı bile yol olgusunu ele verir. |
| Para-Hisian yol olgusunun septal VA'sı 40 ms'den 75 ms'ye düzeltildi | 40 ms, R9 ve B1'deki "septal VA < 70 ms ortodromik AVRT'yi dışlar" ifadesiyle çelişiyordu. `ep-cases.js` (ph-svt), `ep-maneuver-sim.js` (A dizisi, S-A 130 ms) ve olgu metni güncellendi. |

### 1.2 Kaynak matrisi (yeni kaynaklar)

| # | İddia (kural) | Kaynak | Kanıt | Destek ve istisna |
|---|---|---|---|---|
| B1 | Septal VA < 70 ms ortodromik AVRT'yi dışlar; uzun AV iletimli septal AT yine olasıdır. | Maruyama ve ark., J Cardiovasc Electrophysiol 2018;29:634, [10.1111/jce.13423](https://doi.org/10.1111/jce.13423) (R9'a atıfla) | Tartışma (özet sayfası) | Destekler. Bu projede "aleyhine, dışlamaz" olarak yumuşatıldı (B2). |
| B2 | Sol yollu AVRT'de VA ≤ 70 ms bazen görülür. | Nagashima ve ark., PACE 2016;39:1108, [10.1111/pace.12928](https://doi.org/10.1111/pace.12928) | Özet | "Dışlamaz" yumuşatmasının gerekçesi. |
| B3 | "A on V" (HA ≤ 70 ms) taşikardilerin çoğu AVNRT'dir; küçük bir kısmı AT, JT veya NV/NF yol aracılıdır; ayrım kapsamlı manevra ister. | Kanai ve ark., J Arrhythm 2026;42(2), [10.1002/joa3.70329](https://doi.org/10.1002/joa3.70329) | Özet ve giriş (açık tam metin) | Kısa VA'nın tipik AVNRT'yi desteklediğini ama tanı olmadığını gösterir. |
| B4 | Merkezi aktivasyon ve septal VA < 70 ms ayırıcı tanısı: AVNRT, JT, NV/NF yol. | Huseynova ve ark., J Cardiovasc Electrophysiol 2025;36:2427, [10.1111/jce.70005](https://doi.org/10.1111/jce.70005) | Tartışma (açık tam metin) | Destekler. |
| R9, R10 | His-refrakter PVC ile A'nın ilerlemesi retrograd yol lehine; negatif yanıt yolu dışlamaz. Overdrive sonrası A-A-V fokal AT lehine; pseudo-A-A-V tuzağı. | Veenhuyzen ve ark., PACE 2011 ve 2012 | Mevcut EP raporu bölüm 7 | Destekler. |
| R12 | PPI-TCL > 115 ms ve SA-VA > 85 ms atipik AVNRT lehine; septal yol karşılaştırmasıdır, bütün bölgeler için kesin eşik değildir. | Michaud ve ark., JACC 2001;38:1163 | Mevcut EP raporu bölüm 7 | Destekler; metin sınırı söyler. |
| R4 | Para-Hisian pacing'de extranodal yanıt septal yol lehine; nodal yanıt yolu dışlamaz (uzak veya decremental yol maskelenebilir). | Hirao ve ark., Circulation 1996;94:1027 | Mevcut EP raporu bölüm 7 | Destekler. |
| EP rapor bölüm 5 | CS ağzında en erken A: PJRT, atipik AVNRT, inferior paraseptal yol ve CS ağzı AT'si ayrılmaz. | Mevcut EP raporu ve R3, R5 | Mevcut CS ağzı karşılaştırma seti | Rapor bölüm 4B'deki "proksimal CS erken A'yı kesin tanıya çevirmeyin" uyarısının uygulaması. |

### 1.3 Sınıflama kuralları (kod: `src/ep-task.js`)

Taşikardi kaydı (olaylardan ölçülen VA (His), en erken A kanalı):

| Gözlem | T-AVNRT | A-AVNRT | AVRT | PJRT | AT | Kaynak |
|---|---|---|---|---|---|---|
| Septal VA < 70 ms | destekler | aleyhine | aleyhine | aleyhine | dışlamaz | B1-B4 |
| Septal VA ≥ 70 ms | aleyhine | dışlamaz | dışlamaz | dışlamaz | dışlamaz | B3 |
| En erken A CS 1-2 / 3-4 / 5-6 (eksantrik) | + yukarıdaki | dışlamaz | destekler | dışlamaz | dışlamaz | R3, R9 |
| En erken A HRA | + yukarıdaki | aleyhine | dışlamaz | aleyhine | destekler | R9, R10 |
| En erken A CS 9-10, VA ≥ 70 ms | yalnız not: ayrılmaz | | | | | EP rapor bölüm 5 |
| En erken A His, VA ≥ 70 ms | yalnız not: ayrılmaz | | | | | B3 |

Manevralar (`ep-maneuver-sim.js` sonucu):

| Sonuç | T-AVNRT | A-AVNRT | AVRT | PJRT | AT |
|---|---|---|---|---|---|
| His-refrakter PVC, A ilerledi | aleyhine | aleyhine | destekler | dışlamaz | dışlamaz |
| His-refrakter PVC, A gecikti | aleyhine | aleyhine | dışlamaz | destekler | dışlamaz |
| His-refrakter PVC, A değişmedi | dışlamaz | dışlamaz | dışlamaz | dışlamaz | dışlamaz |
| Overdrive V-A-V, PPI-TCL > 115 ve SA-VA > 85 | destekler | destekler | aleyhine | aleyhine | aleyhine |
| Overdrive V-A-V, ikisi de eşiğin altında | aleyhine | aleyhine | destekler | destekler | aleyhine |
| Overdrive V-A-V, karışık | dışlamaz | dışlamaz | dışlamaz | dışlamaz | aleyhine |
| Overdrive A-A-V | aleyhine | aleyhine | aleyhine | aleyhine | destekler |
| Para-Hisian extranodal | dışlamaz | dışlamaz | destekler | dışlamaz | dışlamaz |
| Para-Hisian nodal | dışlamaz | dışlamaz | dışlamaz | dışlamaz | dışlamaz |
| Yakalama yok, His refrakter değil, TCL'den hızlı değil, sonlandı, doğrudan A, yalnız His | yorumlanamaz (hepsi) |||||

### 1.4 Storyboard ve kabul

| Olgu | Taşikardi kaydı | Ayırıcı manevra | Beklenen kanıt |
|---|---|---|---|
| Tipik AVNRT | VA (His) 30 ms, His en erken | Overdrive | Kısa VA T-AVNRT'yi destekler; V-A-V uzun PPI-TCL/SA-VA AVNRT'yi destekler. |
| Atipik AVNRT | VA 215 ms, CS 9-10 en erken (tuzak) | Overdrive | Taşikardi kaydı ayırmaz; overdrive AVNRT'yi, uzun VA tipik olmayanı gösterir. |
| Sol lateral gizli yol | Eksantrik, CS 1-2 en erken | His-refrakter PVC | A ilerler; overdrive yol aracılı. |
| İnferior paraseptal yol | CS 9-10 en erken (tuzak) | Para-Hisian, His-PVC | Extranodal yanıt ve A ilerlemesi AVRT'yi destekler. |
| Para-Hisian yol | His en erken, VA 75 ms | Para-Hisian, His-PVC | AVRT'yi destekler. |
| PJRT | CS 9-10 en erken (tuzak) | His-refrakter PVC | A gecikmesi PJRT'yi (decremental yol) destekler. |
| Fokal AT | HRA en erken | Overdrive | A-A-V. |

Kabul (test: `scripts/test-ep-task.mjs`): her kararın kullandığı ölçüm olaylardan okunur; geçersiz koşul her mekanizmada "yorumlanamaz"dır; geçerli hiçbir kanıt doğru mekanizmayı "aleyhine" işaretlemez (420 manevra teslimi); her olgu taban kayıt ve üç varsayılan manevrayla en az bir kez desteklenir; mevcut olgu ve manevra testleri geçer.

## 2. Faz C: PAC / PVC kaynak bölgesi

### 2.1 Uygulama kararları

| Karar | Gerekçe |
|---|---|
| 12 derivasyon tek bir zaman değişkenli dipolden (`src/ecg12.js`) | Rapor "12 derivasyonun zaman ve polarite ilişkisi tutarlı" ister. Bütün derivasyonlar aynı vektörün izdüşümüdür; III = II - I ve aVR + aVL + aVF = 0 her örnekte test edilir. |
| V1-V3 ekseni hafif süperior (4. interkostal aralık) | Yalnız yatay düzlem izdüşümünde çıkış yolu PVC'lerinin bilinen deseni (DI'de S, V1'de rS, V2'de geçiş) fiziksel olarak üretilemiyordu. Şematik bir yaklaşım; gövde modeli değildir. |
| Özellikler sinyalden okunur, bölge desenleriyle eşlenir | Örnek, kendi bölgesinin etiketini taşımaz; değerlendirme her zaman çizilen sinyalden türetilir. |
| Güven düzeyi "orta" veya "düşük"; "kesin hedef" ve doğruluk yüzdesi yok | Rapor bölüm 4C. Tek tam eşleşme "orta"dır; örtüşme "düşük"tür. |
| Bilinçli örtüşmeler: RVOT (V3 geçiş) ile aort kökü, RSPV ile yüksek krista | C1, C6. Öğrenciye yüzey EKG'nin ayıramadığı çiftleri gösterir. |
| Skar karşı örneği: eski inferior MI, RBBB + süperior aks, geniş ve çentikli QRS | C8: yüzey EKG çıkışı gösterir, kritik istmus haritalama ve entrainment ile bulunur. |
| Atriyal örneklerde kateter aktivasyonu (HRA, His, CS 9-10, 5-6, 1-2) yanıttan sonra sinyal şeridinde; şeritteki yüzey P, 12 derivasyonla aynı dipolden | Rapor "harita kateter örnekleme sınırlamasını gösterir" ister: kateter odağa yakınsa A, P başlangıcından önce; değilse en erken kayıtlı A bile P'den sonra gelir. Yanıttan önce gösterilirse en erken kanal bölgeyi ele verir. |
| 3B'de bölge işaretçisi yanıttan sonra | Rapor "seçilen bölge 3B'de görünür" ister. |

### 2.2 Kaynak matrisi

| # | İddia | Kaynak | Kanıt | Destek ve istisna |
|---|---|---|---|---|
| C1 | LBBB + inferior aks idiyopatik VA çoğunlukla RVOT veya LVOT kaynaklıdır; V3 geçişli grupta ayrım zordur. | Liu ve ark., Cardiology 2023;149:137, [10.1159/000535811](https://doi.org/10.1159/000535811) | Giriş ve sonuç (açık tam metin) | Destekler (RVOT/LVOT örtüşmesi). |
| C2 | RBBB, geniş prekordiyal R ve inferior aks LVOT bölgelerinden; LBBB + inferior aks + V1/V2 geçişi süperior LV septum bazalinden; supravalvüler kaynakta DI'de S, V1/V2 geçişi, V5/V6'da S yok. | Miyaji ve ark., J Arrhythm 2006;22:58, [10.1016/s1880-4276(06)80009-8](https://doi.org/10.1016/s1880-4276(06)80009-8) (Hachiya ve ark.'na atıfla) | Tartışma (açık tam metin) | Aort kökü deseni (DI negatif, erken geçiş). |
| C3 | RBBB ve V1'de baskın R ile giden VT mitral anulusun mediosüperior kısmından. | Komori ve ark., Jpn Circ J 1998;62:629, [10.1253/jcj.62.629](https://doi.org/10.1253/jcj.62.629) (atıf cümlesi) | Tartışma | Mitral süperior deseni. |
| C4 | LBBB + süperior aks triküspit anulus VA'da sıktır; hastaların hepsinde DI ve aVL'de pozitif R. | Kawamura ve ark., J Cardiovasc Electrophysiol 2019;30:1914, [10.1111/jce.14103](https://doi.org/10.1111/jce.14103) | Özet | Triküspit anulus deseni. |
| C5 | Yapısal kalp hastalığı olmayanlarda sık kaynakların 12 derivasyon desenleri. | Cronin ve ark., 2019 HRS/EHRA/APHRS/LAHRS VA uzlaşısı, Heart Rhythm 2020;17:e155, [10.1016/j.hrthm.2019.03.014](https://doi.org/10.1016/j.hrthm.2019.03.014) | Şekil 3-4 açıklamaları | Çerçeve. |
| C6 | Fokal AT odakları krista, triküspit anulus, CS ağzı ve PV ağızlarında kümelenir; P dalgası algoritması; septal odaklarda örtüşme; RSPV'de sinüste bifazik V1'in taşikardide pozitifleşmesi (kristada görülmez). | Kistler ve ark., JACC 2006;48:1010, [10.1016/j.jacc.2006.03.058](https://doi.org/10.1016/j.jacc.2006.03.058) | Tartışma ve tablo parçası | Destekler. CS ağzı satırı tablo parçasından okundu (sütun başlıkları okunamadı): kısmi doğrulama. |
| C7 | RAA ve süperior triküspit anulus odaklarında V1 negatif, inferior derivasyonlar düşük pozitif; alçak krista odaklarında inferior negatif; P dalgasının uzaysal çözünürlüğü sınırlıdır; en erken endokardiyal aktivasyon P başlangıcına göre ölçülür. | Kistler ve ark., J Cardiovasc Electrophysiol 2007;18:367, [10.1111/j.1540-8167.2006.00754.x](https://doi.org/10.1111/j.1540-8167.2006.00754.x) | Tartışma ve yöntem (açık tam metin) | Destekler; örnekleme sınırı gösterimi. |
| C8 | VT istmusları anatomik engeller arasındadır; devrenin kritik bileşenleri entrainment haritalamasıyla belirlenir. | Cronin ve ark. 2019 (C5) | Tam metin parçası | Skar örneğinin "çıkış, istmus değil" notu. EasyECG raporu bölüm 3 aynı ilkeyi bu uzlaşıya dayandırır. |
| C9 | LAA odağı: DI negatif, inferior pozitif, aVL negatif, V1 çoğunlukla pozitif. | Kistler, J Cardiovasc Electrophysiol 2007;18:465 (editoryal), [10.1111/j.1540-8167.2007.00796.x](https://doi.org/10.1111/j.1540-8167.2007.00796.x) | Editoryal metni (özet sayfası) | Destekler. |

### 2.3 Storyboard ve kabul

| Örnek | Okunan özellikler | Olası bölgeler, güven |
|---|---|---|
| RVOT | LBBB, inferior aks, DI +, geçiş V4 | RVOT, orta |
| RVOT (V3 geçiş) | LBBB, inferior aks, DI ±, geçiş V3 | RVOT ve aort kökü, düşük (C1) |
| Aort kökü | V1 ±, inferior aks, DI -, geçiş V2 | Aort kökü, orta (C2) |
| Mitral süperior | RBBB, inferior aks | Mitral süperior, orta (C3) |
| Triküspit serbest duvar | LBBB, süperior aks, DI +, aVL + | Triküspit, orta (C4) |
| Skarlı inferior VT | RBBB, süperior aks, geniş çentikli QRS | LV inferior, orta + "çıkış, istmus değil" (C8) |
| Yüksek krista | inferior +, DI +, aVR -, V1 bifazik; HRA A, P'den 15 ms önce | Krista, orta; kateter odağa yakın |
| CS ağzı | inferior -, aVL +; CS 9-10 A, P'den 10 ms önce | CS ağzı, orta |
| Süperior TA / RAA | V1 -; HRA A, P'den 15 ms sonra | Süperior TA, orta; odak örneklenmemiş (C7) |
| RSPV | V1 +, inferior +; en erken His A, P'den 25 ms sonra | RSPV ve krista, düşük (C6); odak örneklenmemiş |
| LAA | DI -, aVL -, inferior +, V1 +; CS 1-2 A, P'den 25 ms sonra | LAA, orta (C9); odak örneklenmemiş |

Kabul (test: `scripts/test-ep-origin.mjs`): Einthoven ve artırılmış derivasyon toplamı her örnekte; özellikler çizilen sinyalden okunur; kaynak bölge her zaman olası bölgeler arasındadır; örtüşme düşük güven verir; skar örneği çıkış notunu taşır; P-A ölçümü olaylardan; metinlerde doğruluk yüzdesi yoktur.

## 3. Faz D: ileri olgular (1 Ekim 2026: kullanıcı talebiyle uygulandı)

Rapor, Faz A-C ve EP uzman incelemesi tamamlanmadan D'nin uygulanmamasını ister; kullanıcı 1 Ekim 2026'da açıkça uygulamayı istedi. Üç olgu `src/ep-cases-advanced.js` içinde uygulandı; doğrulanan satırlar R16-R28 olarak ana rapora taşındı. EP uzman incelemesi hâlâ yapılmadı; D7'nin klasik ölçütleri R26 (Caceres 1989) özetinden alındı, Sarkozy tam metni okunmadı.

### 3.1 Kaynak matrisi (aday)

| # | İddia | Kaynak | Durum |
|---|---|---|---|
| D1 | Para-Hisian AT: dar, bifazik (-/+) veya trifazik (+/-/+) P, inferior ve prekordiyal derivasyonlarda. | Madaffari ve ark., J Cardiovasc Electrophysiol 2016;27:175, [10.1111/jce.12847](https://doi.org/10.1111/jce.12847) | Özet okundu. |
| D2 | Adenozine duyarlı fokal reentran AT AV düğüm yakınından; nonkoroner veya sol koroner kusptan ablasyon edilebilen sol varyant. | Morishima ve ark., J Arrhythm 2008;24:209, [10.1016/s1880-4276(08)80030-0](https://doi.org/10.1016/s1880-4276(08)80030-0) (Iesaka ve diğerlerine atıfla) | Açık tam metin parçası. |
| D3 | "A on V" taşikardide AT: VOP sonrası V-A-A-V ve diferansiyel atriyal overdrive'da VA bağlanmasının yokluğu. | Kanai ve ark. 2026 (B3) | Açık tam metin. |
| D4 | Verapamil duyarlı idiyopatik LV VT: RBBB + süperior aks, eksitabl aralıklı reentri; diastolik Purkinje potansiyeli (P1) bazalden apekse, presistolik (P2) ters yönde; sol posterior fasikül seyirci olabilir; taşikardide AV dissosiyasyonu. | Morishima ve ark., J Cardiovasc Electrophysiol 2012;23:556, [10.1111/j.1540-8167.2011.02251.x](https://doi.org/10.1111/j.1540-8167.2011.02251.x) | Açık tam metin parçası. |
| D5 | Sol dal ana gövdesi devrenin parçası değildir; ablasyon pre-Purkinje potansiyelinde. | Nakagawa ve ark., J Arrhythm 2012;28:232, [10.1016/j.joa.2011.12.001](https://doi.org/10.1016/j.joa.2011.12.001) | Açık tam metin. |
| D6 | Fasiküler VT'lerin çoğu sol posterior fasiküler; QRS görece dar. | Puie ve ark., Eur J Med Res 2015;20, [10.1186/s40001-015-0156-y](https://doi.org/10.1186/s40001-015-0156-y) | Olgu ve derleme; oranlar birincil kaynaktan doğrulanmalı. |
| D7 | BBR-VT: sinüste uzamış HV; VA dissosiyasyonlu geniş QRS taşikardi; sağ dal potansiyelinde ablasyon. | Sarkozy ve ark., J Cardiovasc Electrophysiol 2006;17:902, [10.1111/j.1540-8167.2006.00468.x](https://doi.org/10.1111/j.1540-8167.2006.00468.x) | Özet. Klasik tanı ölçütleri (her V'den önce H, H-H değişiminin V-V'yi öncelemesi) birincil kaynaktan okunmadı. |
| D8 | Sağ dal ablasyonundan sonra interfasiküler reentri gelişebilir (tedavi sonlanımı tuzağı). | Blanck ve ark., J Cardiovasc Electrophysiol 2009;20:1279, [10.1111/j.1540-8167.2009.01459.x](https://doi.org/10.1111/j.1540-8167.2009.01459.x) | Özet. |

### 3.2 Olay storyboard'u (uygulama öncesi)

| Olgu | Taşikardi kaydı | Manevra / haritalama kanıtı | Ayırıcı tanı | Tedavi sonlanımı |
|---|---|---|---|---|
| Para-Hisian fokal AT | Dar QRS, uzun veya kısa RP, His kanalında en erken A; P dar bifazik (D1) | VOP sonrası V-A-A-V; His-refrakter PVC A'yı değiştirmez; diferansiyel atriyal pacing'de VA bağlanması yok (D3) | Septal yol AVRT, atipik AVNRT, JT | His komşuluğu: AV blok riski; nonkoroner kusp alternatifi (D2) metinde, ablasyon reçetesi yok |
| Sol posterior fasiküler VT | RBBB + süperior aks, QRS görece dar; AV dissosiyasyonu | LV septumda P1 (bazalden apekse, diastolik) ve P2 (presistolik, ters) dizisi; entrainment ile retrograd kolun LV miyokardı olduğu (D4) | Supraventriküler taşikardi + aberasyon, skar VT | Ablasyon sonrası indüklenemezlik ve fasiküler blok ekseni değişimi (doğrulanacak) |
| Dal bloğu reentrisi VT | LBBB tipi geniş QRS, her V'den önce H (doğrulanacak), sinüste uzun HV (D7) | H-H değişimi V-V'yi öncüler (doğrulanacak); sağ dal potansiyeli | Miyokardiyal VT, SVT + aberasyon | Sağ dal ablasyonu; ardından interfasiküler reentri tuzağı (D8) |

**Açık:** D satırlarının tamamı; BBR-VT klasik ölçütleri için birincil kaynak; fasiküler VT'de ablasyon sonlanımı; EP uzman incelemesi.

## 4. Açık kalanlar (B-D)

- EP uzman incelemesi (B ve C kuralları ve örnekleri dahil).
- B: sol yollu kısa VA ve NV/NF yollar için ayrı olgular; atriyal overdrive ve diferansiyel pacing görevin kapsamında değil.
- C: gövde geometrisi, yakın alan etkisi ve epikardiyal/supravalvüler alt bölgeler yok; CS ağzı P deseni kısmi doğrulandı (C6).
- D: bölüm 3'ün tamamı.

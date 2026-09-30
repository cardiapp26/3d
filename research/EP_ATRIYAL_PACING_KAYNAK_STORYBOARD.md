# Faz A: atriyal pacing ve preeksitasyon laboratuvarı

**Tarih:** 30 Eylül 2026
**Dayanak:** `research/EASY_ECG_EP_OZGUN_GELISTIRME_RAPORU.md`, bölüm 4 (Faz A) ve bölüm 6 (uygulama talimatı).
**Durum:** Kaynak matrisi ve storyboard koddan önce yazıldı; uygulama `src/ep-pacing-lab.js`, `src/ep-pacing-text.js`, `src/ep-pacing-panel.js` içinde. EP uzman incelemesi yapılmadı; içerik klinik olarak doğrulanmış sayılmaz.

## 1. Kapsam kararı

| Karar | Gerekçe |
|---|---|
| Laboratuvar, EP modülünün Manevralar sekmesinde ayrı panel | Rapor "mevcut EGM panelinde" ister; aynı çizici, kaliper, tam ekran ve olgu durumu kullanılır. |
| Senaryo olgudan gelir; kullanıcı substratı seçmez | Olgu kimliği Manevralar sekmesinde zaten açıktır, fakat laboratuvar sorusu atım düzeyindedir ("bu atım hangi yoldan iletildi?"). Substrat seçtirmek soruyu tek adımlık ezbere çevirirdi. |
| Desteklenen olgular: tipik AVNRT (çift AV nodal fizyoloji), sol lateral, inferior paraseptal ve superior paraseptal gizli AP, manifest sol lateral AP, fokal AT (normal AV düğüm) | Her biri için antegrad iletim ve tek echo modeli kaynakla savunulabilir. |
| Dışarıda: PJRT, atipik AVNRT, flutter | PJRT'nin decremental retrograd yolu bu modelde her uzun VA'da echo üretir ve olgunun "incessant" doğasını ayrıca modellemek gerekir; atipik AVNRT'de hızlı-yavaş echo ayrı mekanizmadır; flutter sırasında atriyal pacing ayrı bir protokoldür. |
| Dışarıda: decremental antegrad AP (Mahaim benzeri) | Rapor bunu birincil kaynak ve uzman onayına bağlar. Bu turda eklenmedi (P12). |
| Dışarıda: sürekli taşikardi indüksiyonu, dizi ortasında echo | Yalnız test atımından sonra tek echo modellenir; pencere echo'dan sonra biter. Metin bunu söyler. |
| Atriyal refrakter periyot sürüşe bağlı değil (sabit 200 ms) | Hıza bağlı atriyal refrakterlik doğrulanmadı; iddia üretmemek için sabit tutuldu. |
| `svtsimulator` kodu, CSS'i, vaka metni, eşiği kopyalanmadı | Lisans/menşe belirsiz; yalnız "S1×N + S2 + pacing yeri" kontrol fikri alındı. `runPaceTrain`, `getInterval`, `doDetectReentry` davranışlarının karşılığı yoktur: her süre olaylardan ölçülür. |

## 2. Klinik kaynak matrisi

Erişim tarihi hepsi için 30 Eylül 2026; kaynaklar scite üzerinden özet, tam metin parçası veya atıf cümlesiyle okundu. İçerik yazarı: Claude (model). EP uzman incelemesi: **yok**.

| # | İddia (uygulamada nerede) | Kaynak | Bölüm / kanıt | Destek ve istisna |
|---|---|---|---|---|
| P1 | AV düğüm iletim süresi, gelen uyarının erkenliğiyle (His'ten sonraki toparlanma süresi) üstel olarak uzar; hızlı pacing'de uzayan iletim bir sonraki toparlanmayı kısaltır (pozitif geri besleme). Modelde AH, toparlanma süresinin fonksiyonudur. | Billette ve ark., Circ Res 1988;62:790, [10.1161/01.res.62.4.790](https://doi.org/10.1161/01.res.62.4.790) | Giriş paragrafı (özet sayfasında): "slow recovery of nodal cell excitability ... conduction time to increase exponentially with prematurity"; hızlı hızda pozitif geri besleme. | Destekler. İstisna: çalışma izole tavşan kalbidir; "yorgunluk" ve "kolaylaştırma" modele alınmadı. |
| P2 | AV düğüm Wenckebach'ı: atriyal siklus düğümün fonksiyonel refrakter periyodunun altına inince PR/AH ilerleyici uzar ve bir atım bloke olur; normal düğümde atriyal pacing ile oluşturulabilir. | Billette ve Tadros, J Cardiovasc Electrophysiol 2011;22:1263, [10.1111/j.1540-8167.2011.02088.x](https://doi.org/10.1111/j.1540-8167.2011.02088.x) | Editoryal yorum, ilk paragraf. | Destekler. Modeldeki Wenckebach siklusu tasarlanmış değerdir. |
| P3 | Hızlı hıza bağlı Wenckebach döngüleri hızlı ve yavaş yolu sırayla kullanabilir. | Aynı editoryal (P2), Zhang ve Mazgalev'e atıfla | İlk paragraf. | Modelde çift fizyolojide dizi içinde yavaş yola geçip blok olan döngüyü açıklar. Özgün Zhang-Mazgalev çalışması okunmadı. |
| P4 | Normal AV düğümün yerleşik hızlı ve yavaş yolu vardır; S1S2 ve artan hız protokolleriyle değerlendirilir; yorum protokole ve seçilen indekse göre değişir. | Billette ve Tadros, Am J Physiol Heart 2014;306:H173, [10.1152/ajpheart.00516.2013](https://doi.org/10.1152/ajpheart.00516.2013) | Özet ve giriş. | Destekler: "AH sıçraması AVNRT tanısı değildir" uyarısı. İstisna: çerçeve büyük ölçüde deneysel veriye dayanır. |
| P5 | Çift AV nodal yol ve kesintili iletim eğrisi; yavaş yoldan antegrad iletimden sonra hızlı yoldan atriyuma dönen echo. | Denes ve ark., Circulation 1973;48:549, [10.1161/01.cir.48.3.549](https://doi.org/10.1161/01.cir.48.3.549) | Özet; atıf cümlesi: "propagated through the slow pathway and returned to the atrium via the fast pathway". | Destekler. Tam metin okunamadı (yalnız özet ve atıf parçası). |
| P6 | Hızlı yol blokuyla yavaş yol iletimi, hızlı yolun toparlanıp retrograd iletmesine izin verir; echo "kritik AH" ile ilişkilidir. | Denes ve ark., Circulation 1975;52:789, [10.1161/01.cir.52.5.789](https://doi.org/10.1161/01.cir.52.5.789) | Özet; yöntem ölçütü 3 (atıf parçası). | Destekler: modelde echo, yavaş yol iletimi ve tasarlanmış kritik AH (210 ms) birlikte olunca çizilir. Kritik AH kişiye göre değişir; 210 ms öğretim değeridir. |
| P7 | AH sıçraması tanımı: S2'de (veya sürüşte) 10 ms kısalmada AH'nin ≥50 ms artması. | Kanjwal, J Innov Card Rhythm Manag 2018;9:3425, [10.19102/icrm.2018.091105](https://doi.org/10.19102/icrm.2018.091105) | Giriş, tam metin parçası. | İkincil kaynaktaki yaygın tanım (kendi kaynağına atıfla). Birincil tanım makalesi bu turda okunmadı. |
| P8 | AVNRT'li hastaların bir kısmında sıçrama gösterilemez; sıçrama burst ve programlı pacing'de farklı hastalarda görülür. Tanım çocuklarda AVNRT'yi güvenilir öngörmez. | Bayraktarova ve ark., Indian Pacing Electrophysiol J 2018;18:49, [10.1016/j.ipej.2017.11.003](https://doi.org/10.1016/j.ipej.2017.11.003); Blurton ve ark., J Cardiovasc Electrophysiol 2006;17:638, [10.1111/j.1540-8167.2006.00452.x](https://doi.org/10.1111/j.1540-8167.2006.00452.x) | Özetler. | Destekler: "sıçrama yok = AVNRT yok" denmez; "sıçrama = AVNRT" denmez. |
| P9 | Tipik (decremental olmayan) AP'de S2 kısaldıkça A'dan QRS başlangıcına süre sabit kalır, AV düğüm gecikmesi arttıkça preeksitasyon artar. Decremental yollar farklı davranır. | Leong-Sit ve ark., J Cardiovasc Electrophysiol 2007;18:998, [10.1111/j.1540-8167.2007.00840.x](https://doi.org/10.1111/j.1540-8167.2007.00840.x) | Tartışma (özet sayfası). | Destekler. |
| P10 | Preeksitasyon miktarı AV düğüm ile AP iletimi arasındaki yarışla belirlenir. | Jorat ve ark., PACE 2006;29:1434, [10.1111/j.1540-8159.2006.00559.x](https://doi.org/10.1111/j.1540-8159.2006.00559.x) | Tartışma, tam metin parçası. | Destekler (füzyon kavramı). |
| P11 | S2 AP efektif refrakter periyoduna ulaşınca iletim yalnız AV düğümden olur; AH ve HV uzar, delta kaybolur; ardından ortodromik taşikardi başlayabilir. | Al Harbi ve ark., J Cardiovasc Electrophysiol 2016;27:494, [10.1111/jce.12862](https://doi.org/10.1111/jce.12862) | Olgu yorumu (özet sayfası). | Destekler. Modelde tek ortodromik echo çizilir, taşikardi sürmez. |
| P12 | Decremental antegrad (atriyofasiküler) yollar sinüste az/hiç preeksitasyon gösterip sağ atriyal pacing'de artan preeksitasyon ve decremental iletim gösterir. | Ellenbogen ve Vijayaraman, J Cardiovasc Electrophysiol 2005;16:135, [10.1046/j.1540-8167.2005.40702.x](https://doi.org/10.1046/j.1540-8167.2005.40702.x) | Yorum, madde 1-2. | **Kapsam dışı gerekçesi.** Bu senaryo uzman onayı olmadan eklenmedi. |
| P13 | AP yerini bulmak için sağ atriyum ve CS'den pacing yapılıp en kısa uyarı-delta aralığı aranır; hızlı atriyal pacing en fazla preeksitasyonu elde etmek için kullanılır. Sağdan sola uyarı yerinin değişmesi WPW'de QRS'i değiştirebilir. | Miles ve ark., Circulation 1986;74:493, [10.1161/01.cir.74.3.493](https://doi.org/10.1161/01.cir.74.3.493) (yöntem, atıf parçası); Lemery ve ark., Br Heart J 1987;58:324, [10.1136/hrt.58.4.324](https://doi.org/10.1136/hrt.58.4.324) (özet); Zaman ve ark., Circulation 1983;68:701, [10.1161/01.cir.68.4.701](https://doi.org/10.1161/01.cir.68.4.701) (giriş) | Belirtilen bölümler. | Destekler: pacing yeri S-delta aralığını ve preeksitasyonu değiştirir. Kaynaklar bunu bir yöntem olarak anlatır; bu modeldeki sayılar tasarlanmıştır. |
| P14 | Normal HV aralığı 35-55 ms (laboratuvar normal değeri). | Castellanos ve ark., Br Heart J 1977;39:38, [10.1136/hrt.39.1.38](https://doi.org/10.1136/hrt.39.1.38); Gupta ve ark., Br Heart J 1976;38:1343, [10.1136/hrt.38.12.1343](https://doi.org/10.1136/hrt.38.12.1343) | Yöntem bölümleri. | Destekler. Modeldeki HV 45 ms; preeksitasyonda His kanalındaki yerel V daha erken gelir ve ölçülen HV kısalır. |
| G | SVT, AVNRT/AVRT ve preeksitasyon çerçevesi | 2015 ACC/AHA/HRS SVT kılavuzu, [10.1016/j.jacc.2015.08.856](https://doi.org/10.1016/j.jacc.2015.08.856) (erratum: 10.1016/j.jacc.2016.11.014) | Kayıt kontrol edildi; bu turda ilgili paragraflar okunmadı. | Çerçeve; tek bir kural buna dayandırılmadı. |

EasyECG hiçbir satırda kaynak değildir (rapor bölüm 5).

## 3. Model ve tasarlanmış değerler

Tüm sayılar öğretim için tasarlanmıştır; ölçülmüş aralık veya klinik eşik değildir.

| Öğe | Değer | Not |
|---|---|---|
| Uyarı-yerel A (HRA / CS proksimal / CS distal) | Kanal başına tablo (`SITE_A`) | CS distalde CS 1-2 en erken, HRA'da HRA en erken. |
| Atriyal refrakter periyot | 200 ms | Sürüşten bağımsız (bölüm 1). |
| Tek AV düğüm | AH = 75 + 150·e^(−(RT−150)/100); RT < 150 ms blok | RT: His'ten bir sonraki His-A'ya süre (P1). |
| Çift fizyoloji, hızlı yol | AH = 78 + 40·e^(−(RT−230)/60); RT < 230 ms blok | |
| Çift fizyoloji, yavaş yol | AH = 170 + 120·e^(−(RT−140)/70); RT < 140 ms blok | Hızlı yol bloke olunca kullanılır (P5). |
| Yavaş-hızlı echo | Yavaş yol + AH ≥ 210 ms | Kritik AH öğretim değeri (P6). |
| HV | 45 ms | P14. |
| AP antegrad iletim | Atriyal uç + 40 ms, decremental değil | P9. |
| AP antegrad refrakter periyot | 270 ms (atriyal uçta ardışık aktivasyon aralığı) | P11. |
| Preeksitasyon derecesi | f = (normal V − AP V) / 120, 0-1 arası | P10; f ≥ 0,5 geniş QRS; f = 1 tam preeksitasyon. |
| AP retrograd echo | AP son aktivasyondan ≥ 250 ms sonra ventrikül ucu ve atriyal uçta atriyum toparlanmış (≥ 200 ms) | Gizli AP'de her iletilen atım AP'yi retrograd olarak "gizli" aktive eder. |

## 4. Storyboard (olay dizileri)

Varsayılan: S1 600 ms × 6, HRA. Testler bu satırları olaylardan doğrular (`scripts/test-ep-pacing.mjs`).

| # | Olgu / giriş | Olaylar | Ölçüm | Doğru yanıt ve gerekçe |
|---|---|---|---|---|
| 1 | Fokal AT (normal düğüm), S2 400 → 250 | Her S2'de A-H-V; AH sürekli uzar | AH artışı her 10 ms'de < 50 ms | AV düğüm. Sıçrama yok; tek yol ile çift yol tek atımdan ayrılmaz. |
| 2 | Fokal AT, S2 220 | A var, H ve V yok | Blok | İletim yok: AV düğüm refrakter. |
| 3 | Herhangi, S2 190 | S var, A yok | Yakalama yok | Soru sorulmaz: yakalamayan uyarıdan yol sonucu çıkmaz. |
| 4 | Fokal AT, artan pacing S1 350 | AH atımdan atıma uzar, bir A'dan sonra H yok, sonra kısa AH | Wenckebach | AV düğüm (blok atımı hariç). |
| 5 | Tipik AVNRT, S2 310 → 300 | AH 117 → 207 | ΔAH ≥ 50 ms / ΔS2 10 ms | 300'de yavaş yol. Karşılaştırma paneli sıçramayı olaylardan gösterir; "AVNRT tanısı değildir" (P4, P8). |
| 6 | Tipik AVNRT, S2 290 | Yavaş yol, AH ≥ 210, ardından konsantrik tek A (His en erken) | Echo | Yavaş yol; echo hızlı yoldan dönüş (P5, P6). Taşikardi modellenmedi. |
| 7 | Manifest sol AP, HRA S1 600 | Delta + dar-orta QRS; His kanalında HV 45 ms kalır, H-delta kısa | Füzyon | İkisi birlikte (P10). |
| 8 | Manifest sol AP, CS distal | S-delta kısa, delta büyük, His'te V H'den önce | Tam preeksitasyon | Aksesuar yol (P13). |
| 9 | Manifest sol AP, HRA S2 280 | AH uzar, delta aralığı sabit, preeksitasyon artar | f artışı | Aksesuar yol / füzyon ağırlığı artar (P9). |
| 10 | Manifest sol AP, HRA S2 260 | Delta yok, AH uzun, HV 45, ardından eksantrik tek A (CS 1-2 en erken) | AP refrakter + ortodromik echo | AV düğüm (P11). |
| 11 | Gizli sol lateral AP, S2 300 | Delta hiç yok; uzun AH sonrası eksantrik tek A | Retrograd echo | AV düğüm; delta yokluğu gizli yolu dışlamaz. |

## 5. Geri bildirim sözleşmesi

- Soru yalnız test atımı atriyumu yakaladıysa sorulur; aksi durumda sonuç "yorumlanamaz: yakalama koşulu".
- Yanıtlar: AV düğüm, AV düğüm (yavaş yol), aksesuar yol, ikisi birlikte (füzyon), iletim yok.
- Değerlendirme gözlenen olayları listeler (AH, HV, H-delta, S-delta, echo dizisi) ve ayırt edilemeyenleri söyler: tek atımdan hızlı/yavaş yol ayrımı; delta yokluğunun gizli AP'yi dışlamaması; sıçramanın AVNRT tanısı olmaması.
- "AV düğüm" yanıtı yavaş yol atımında da doğru sayılır; daha özgül yanıt için karşılaştırma önerilir. Hızlı yol atımına "yavaş yol" yanıtı yanlıştır.
- 3B iletim yolu yanıt verildikten sonra gösterilir (AV düğüm yolu, sol serbest duvar AP yolu, AP echo'da ortodromik devre).

## 6. Açık kalanlar

- EP uzman incelemesi (bütün matris ve storyboard).
- P5 ve P7 için birincil tam metin okuması; 2015 kılavuzunun ilgili paragrafları.
- Decremental antegrad yol (P12) ve atipik AVNRT echo'su.
- Pacing yerinin 3B'de işaretlenmesi (bu turda yalnız iletim yolları çizildi).
- Faz B-D (rapor bölüm 4) bu turda uygulanmadı.

# Farmakoloji modülü kaynak ve yöntem kaydı

Tarih: 2026-10-04. Hedef: EPS gibi ayrı, görsel ve etkileşimli kardiyovasküler farmakoloji eğitim sayfası. Adres: `/pharmacology/`. Alt başlıklar URL hash ile açılır; örnek: `/pharmacology/#/antiarrhythmics`.

## Girdiler ve içerik

Kullanıcı kaynakları yerelde okundu. PDF ve PPTX dosyaları siteye kopyalanmadı; metinler özgün TR/EN özetlerdir. Dosya kimlikleri ve SHA-256: `PHARMACOLOGY_PROVENANCE.json`. Kaynakların bölüm/slayt izi `src/pharmacology-data.js` içindeki `PHARMA_SOURCES` ve kartların `sources` alanında.

- `cardiac-drugs.pdf`: kardiyak elektrofizyoloji, Vaughan Williams sınıfları, antihipertansif ve hemostatik ilaçlar.
- `cardiovascular Reviews Pharmacology 7th edition.pdf`: PDF metadata başlığı **Lippincott Illustrated Reviews: Pharmacology**, yazar Karen Whalen. Yedinci baskı dosya adına dayanır; metadata baskıyı doğrulamaz. Kardiyovasküler bölüm 16–22, PK/PD kavramları.
- `s-action potentials-drugs.pptx`: 17 slayt; hücresel özellikler, Na/Ca/K akımları ve nodal/çalışan miyosit farkları.
- `s-antiaritmikler.pptx`: 25 slayt; sınıf I–IV, kanal hedefleri ve antiaritmik mekanizmalar.
- [Textbook of Cardiology: Cardiac Pharmacology](https://www.textbookofcardiology.org/wiki/Cardiac_Pharmacology): sınıf düzeni ve temel mekanizma karşılaştırmaları.

PDF numaraları basılı kitap sayfası değil, PDF sırasıdır. Sunumlardan slayt XML metni çıkarıldı; yalnız görsel içeren slaytlardan ek iddia üretilmedi. Kullanıcı girdileri değişmez; çıkarılan geçici metinler `/tmp` içinde.

## İçerik kararları

Dokuz konu: PK/PD, antihipertansifler, diüretikler, kalp yetersizliği, antiaritmikler, antianginaller, antitrombotikler, lipid düşürücüler, etkileşim ve güvenlik. Kartlar mekanizma, örnekler, klinik bağlam, önemli risk ve izlem bilgisi sunar. Hasta seçimi, dozlama ve reçete algoritması eklenmedi.

Eski kaynaklardaki genelleyici güvenlik ifadeleri aynen taşınmadı. Sotalol/QT, digoksin-elektrolit/böbrek, flekainid-yapısal/iskemik hastalık, ACE inhibitörü-ARNI geçişi ve HFrEF sınıfları güncel DailyMed ürün bilgileri ve AHA kılavuz sayfasıyla kontrol edildi. İncelenen bağlantılar uygulama kaynak listesinde. Wiki'deki CYP inhibisyonu genellemesi kullanılmadı; aktif substrat ile prodrug ayrımı korunur. Sunumlardaki QRS birim hataları veya amiodaron/sotalol için genel güvenlilik ifadeleri kullanılmadı.

Etki haritası anatomik ölçek değildir. Böbrek, karaciğer ve bağırsak hedefleri kardiyak sonuçlardan ayrılır. “Trombosit / pıhtı” grubunda trombosit aktivasyonu ile koagülasyon/fibrin farklı hedefler olarak açıklanır.

## Görsel model

- Organ haritası: özgün SVG. Hedef düğmeleri etki yerini seçer; ilaç etkinliği veya hasta yanıtı hesaplamaz.
- Elektriksel laboratuvar: ventriküler/nodal hücre, faz ve sınıf I–IV seçimi. Ventriküler faz 0 Na, faz 2 içe Ca/dışa K, faz 3 dışa K; nodal faz 0 Ca. Nodal faz 4 If/Ca ve otonom düzenleme. Dinlenimde net akım oku verilmez. Sınıf I alt grupları, non-DHP sınıf IV ve amiodaron çoklu hedef sınırları görünür.
- PK eğrisi: başlangıç konsantrasyonuna göre yüzde; `C(t)/C(0) = 2^(-t/t½)`. Tek bölmeli birinci derece eliminasyon, 0–24 saat, yarı ömür 1–12 saat. Emilim, tekrar doz ve aktif metabolit yok. İlaç/hasta verisi değil. Sayısal belirsizlik tahmini uygulanmaz; deterministik öğretim formülüdür.

## Doğrulama

- `npm run test:pharmacology`: kaynak kimlikleri, TR/EN alanları, soru yanıtları, arama, yarı ömür ve monoton azalış.
- `npm run test:pharmacology-browser`: ayrı sayfa ve header bağlantıları, URL alt başlıkları, organ ve AP düğmeleri, PK slider, arama, iki sınıf karşılaştırma, soru geri bildirimi, kaynak açılması, kalıcı TR/EN, 390 px görünüm.
- `npm run check`, `npm test`, `npm run build`: mevcut proje doğrulaması.
- Service worker testi üç bağımsız sayfanın çevrimdışı shell ayrımını denetler.

Kod bağımsız agent incelemesinden geçti; aynı model ailesiyle içerik kontrolü klinik uzman değerlendirmesinin yerini tutmaz. Eğitim materyalinin klinik geçerliliği doğrulanmış değildir.

Son doğrulama: `check`, `test` (140 PASS satırı), `build`, Farmakoloji tarayıcı testi ve mevcut 320 px mobil testi geçti. Ayrı type-checker/linter yapılandırılmamış. Genel `verify:browser` içinde mevcut sekiz grup geçti; ardından önceden eksik `test:ep-flow` scripti nedeniyle kapı tamamlanamadı. Farmakoloji testi ayrıca geçti ve kapı listesine eklendi.

## Koagülasyon görselinin entegrasyonu

Kullanıcının paylaştığı koagülasyon kaskadı, antitrombotik bölümünün başında özgün SVG/HTML bileşeni olarak yeniden çizildi. Referans görselin SHA-256 kimliği provenance dosyasındadır; görüntü dosyası dağıtılmadı. İntrinsik, ekstrinsik ve ortak yol; TF-VIIa'dan IX ve X'e bağlantılar; tenaz/protrombinaz; trombin amplifikasyonu; XIIIa ile fibrin stabilizasyonu gösterilir. Kalsiyum (IV) ve fosfolipid yüzey kofaktörleri açıklanır.

Görseldeki test bölümünde XIII yanlış biçimde PT/aPTT kapsamına alınmıştı. Doğrulanmış kapsam: PT, VII/X/V/II/I; aPTT, XII/XI/IX/VIII/X/V/II/I. XIII eksikliğinde her ikisi normal kalabilir; ayrı XIII aktivite değerlendirmesi gerekir ([ARUP FXIII](https://ltd.aruplab.com/api/ltd/pdf/377)). XII eksikliği ile kanama arasındaki ayrım ve normal testlerin her hastalığı dışlamaması [ARUP test değerlendirmesi](https://arupconsult.com/content/prolonged-clotting-time-evaluation) ile kontrol edildi.

Warfarin katmanı mevcut faktörlerin doğrudan inhibisyonunu değil vitamin K bağımlı işlevsel sentezi gösterir; protein C/S etkisi metinde açıklanır. UFH katmanı antitrombin aracılı başlıca Xa/IIa hedeflerini, apiksaban Xa'yı, dabigatran IIa'yı, alteplaz plazminojen-plazmin/fibrinolizi gösterir. Birbirleriyle eşdeğer biyolojik ya da laboratuvar yanıt varsayılmaz. Ürün etiketi bağlantıları `COAG_SOURCES` içindedir.

Bileşen `src/coagulation-data.js`, `src/coagulation-panel.js`, `src/coagulation.css` dosyalarındadır. Native düğmelerle klavye seçimi, kalıcı TR/EN test/ilaç seçimi, mobilde panel içinde yatay kaydırma ve sıfırlama vardır. Faktör rehberi ile kaynaklar açılır bölümlerdir. Birim ve tarayıcı testleri mevcut Farmakoloji komutlarına eklendi. Bağımsız kod incelemesinde engelleyici bulgu çıkmadı.

## Diüretik görselinin entegrasyonu

Paylaşılan zihin haritası, `/pharmacology/#/diuretics` içinde özgün SVG nefron ve altı sınıf seçimi olarak yeniden kuruldu. Segment seçimi, mekanizma, kullanım bağlamları, yan etkiler, izlem ve elektrolit karşılaştırması birlikte güncellenir. Serum potasyumu ve idrar kalsiyumu ayrı etiketlenir. TR/EN geçişi seçimi korur; tablo mobilde kendi alanında kayar.

Kaynaklar: kullanıcı PDF'lerinin diüretik bölümleri ve `src/diuretics-data.js` içindeki resmi ürün bilgileri, KDIGO, Endocrine Society ve amilorid çalışması. AKI genel endikasyon olarak verilmez; mannitol için anüri/pulmoner ödem sınırları ve başlangıç hacim genişlemesi açıklanır. Etakrinik asit sülfonamid değildir; lityuma bağlı NDI rolü amiloride özgülenir. Topikal dorzolamid ile sistemik asetazolamid ayrılır.

Doğrulama: `check`, `test` (140 PASS satırı), `build`, Farmakoloji Chrome testi geçti. Altı sınıf, segmentler, elektrolit yönleri, kaynak kimlikleri, dil geçişi, klavye odağı, sıfırlama ve 390 px taşma kontrol edildi.

## Loop diüretikleri mekanizma görseli

İkinci diüretik referansı (Netter loop şeması), loop sınıfında dört seçilebilir neden-sonuç adımına uyarlandı: NKCC2, lümen-pozitif voltaj/Ca-Mg, distal K-H kaybı, ürat/hacim/GFR. Yayın görseli dağıtılmadı. GFR'nin korunacağı/artacağı ve hipokalsemi olmayacağı kesin ifadeleri kullanılmadı. Doğrulanmış ürün bilgisi PK notları: furosemid tablet %64/terminal yaklaşık 2 saat (sağlıklı aç erkekler), torsemid yaklaşık %80/3,5 saat (normal bireyler), bumetanid 1–1,5 saat. Etakrinik asit için doğrulanmamış kesin PK oranları aktarılmadı; bu sınır arayüzde açıklanır. Kaynaklar bileşenin DailyMed listesinde.

## Kalp yetersizliği şeması

Kullanıcının kalp yetersizliği ilaç şeması `/pharmacology/#/heart-failure` içinde 3 görsel dal ve 10 seçilebilir grup olarak yeniden kuruldu. Kronik HFrEF dört temel sınıfı (ARNI/RAAS alternatifi, kanıtlı beta bloker, MRA, SGLT2) ile konjesyon giderme/seçilmiş ek tedavi ve akut/ileri hastalık desteği ayrılır. Mevcut temel sınıf kartları yeniden kullanıldı. HFpEF'ye aynı sağkalım hiyerarşisi uygulanmaz. Labetalol temel HFrEF beta blokeri olarak aktarılmadı. Nesiritid tarihsel bağlamda ASCEND-HF sonucuyla gösterilir; uzun süreli IV inotrop kullanımında köprü/palyatif istisnalar korunur. Digoksin kutusu elektrolit duyarlılığı, renal/ilaç etkileşimleri, akut toksisite hiperkalemisi ve Fab ayrımını açıklar; görseldeki lidokain/pacing sırası algoritmaya dönüştürülmedi.

Kaynaklar bileşende: 2024 ACC HFrEF consensus, 2022 AHA/ACC/HFSA guideline, DailyMed digoxin, ACC ASCEND-HF. Kullanıcı görseli dağıtılmadı; kimlik provenance dosyasında.

## Lipid yolakları görseli

Kullanıcının bağırsak/karaciğer/lipoprotein referansı `/pharmacology/#/lipids` içinde özgün SVG ve altı ilaç sınıfı ile uyarlandı. Statin (HMG-CoA redüktaz), ezetimib (NPC1L1), PCSK9 antikorları (LDL-R yıkımı/geri dönüşümü), safra asidi bağlayıcıları, fibrat (PPAR-α/LPL) ve niasin (VLDL) ayrı hedefleri vurgular. VLDL→IDL→LDL ve LPL ilişkili TG temizlenmesi bağlantıları çizildi. Tam metabolik model değildir; HDL/kalıntı yolları eksiksiz çizilmez ve bu sınır görünür. Niasinde AIM-HIGH sonucu, fibratlarda lipid değişimi/olay yararı ayrımı ve reçinelerde TG artışı/emilim etkileşimi açıklanır. İlaç/hasta kinetiği veya reçete algoritması yok.

Kaynaklar: kullanıcı Pharmacology PDF lipid bölümü, 2026 ACC/AHA dyslipidemia guideline, NHLBI AIM-HIGH ve DailyMed fenofibrat/kolestiramin. Üç mevcut lipid kartı yeniden kullanıldı; özgün referans görsel dağıtılmadı.

## İki dislipidemi referans tablosu

Lipid bölümüne ayrı aranabilir atlas eklendi: 11 ilaç grubu, genel/uzmanlık/tarihsel filtre, mekanizma-kullanım-güvenlik-izlem alanları. Reçeteli EPA+DHA ile ikosapent etil sonuç/güvenlik verileri ayrılır. Lomitapid HoFH, metreleptin genelleşmiş lipodistrofi bağlamında; mipomersen 2019 FDA etiketiyle tarihsel kart olarak sunulur. Erişim/pazarlama varsayılmaz.

ACC Lipid Manager 2026 Tablo 6 ile statin yoğunlukları kontrol edildi. Bunlar eşdeğer dozlar veya hasta dozu değildir. Friedewald öğretim hesabı mg/dL için TC−HDL−TG/5; non-HDL=TC−HDL. Negatif/geçersiz girişler reddedilir, HDL>TC reddedilir; TG≥400 veya negatif LDL tahmininde sonuç raporlanmaz. 2026 Martin/Hopkins veya Sampson/NIH tercihi ve açlık ölçümü sınırları görünür. Güncel tahminleyici uygulanmış gibi gösterilmez.

Görüntüdeki erken aile öyküsü eşitsizlikleri ve ABI yönü düzeltildi. Eski 7,5%/yaş tedavi akışı ve eşdeğer doz ezberi otomatik karar motoru yapılmadı. Statin yan etkileri sınıf BBW olarak etiketlenmez; FDA2021 gebelik değişikliği çoğu hastada bırakma sınırıyla açıklanır. Evrensel ALT/AST ilaç bırakma ve etkileşim doz sınırları kopyalanmadı.

Dislipidemi atlası doğrulaması: `check`, `npm test` (142 PASS), `build`, Chrome testi geçti. Arama/filtre, statin yoğunlukları, LDL400 sınırı, tutarsız/negatif girişler, TR/EN durum koruması ve 390px taşma kontrol edildi.

## Antianginal görsellerin entegrasyonu

İki kullanıcı şeması `/pharmacology/#/antianginals` içinde sekiz sınıf ve üç fenotip olarak özgün SVG/HTML ile yeniden kuruldu. Hız, kontraktilite, ön/ard yük, koroner tonus, diyastolik gerilim ve metabolik hedefler sınıfa göre vurgulanır. Obstrüktif/efor, vazospastik ve mikrovasküler bağlamlar bağımsız seçimdir; seçim ilaç önerisi üretmez. DHP ve non-DHP aynı hemodinamik kategoriye sıkıştırılmaz.

İvabradin görseldeki yanlış If artışı yerine inhibisyonuyla; AB anjina/ABD KY ruhsat ayrımıyla gösterilir. Ranolazin geç Na ilişkisi mekanizma belirsizliğiyle anlatılır; endotel onarımı kesin etki değildir. Nitrat PDE5/riociguat, non-DHP HFrEF/iletim, nikorandil ülser ve trimetazidin hareket/ağır renal kısıtları resmi kaynaklarla kontrol edildi. Eski amil nitrit/siyanür bölümü akut tedavi algoritması olarak aktarılmadı. Şema doz, etki büyüklüğü veya sağkalım simülasyonu değildir.

Kaynaklar: kullanıcı PDF Chapter20, 2024 ESC CCS, DailyMed nitrogliserin/ranolazin/ivabradin, EMA ivabradin/trimetazidin ve MHRA nikorandil. Referans görseller dağıtılmadı; SHA kimlikleri provenance dosyasında.

Antianginal doğrulama: `check`, `test` (143 PASS), `build` ve Chrome masaüstü/mobil testi geçti. Sekiz hedef eşlemesi, üç fenotip SVG görünümü, odak ve dil değişiminde seçim koruması denetlendi. Bağımsız kod incelemesinde düzeltme gerektiren kusur bulunmadı.

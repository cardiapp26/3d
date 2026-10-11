# Tıbbi tutarlılık denetimi

Tarih: 2026-10-09, ikinci geçiş. Kapsam: Cardia öğretim uygulaması. 3D stüdyo modları 01–16, `/eps/`, `/pharmacology/`, `/ecg/`. Kod değiştirilmedi. Bu belge tanı veya tedavi rehberi değildir. Uygulamanın kendi uyarısı içeriği şematik eğitim malzemesi sayar. O uyarı, yanlış bir doz cümlesini doğru yapmaz.

İlk geçiş aynı gün 18 çatışma yazmıştı. Kaynak o listeden sonra düzeltildiği için bu dosya o listeyi açık çatışma diye tutmuyor. İkinci geçiş, o 18 maddeyi güncel kaynakta yeniden okudu. Tutarlı bulunan güvenlik kartları ve bölümlerin tamamı bu turda satır satır yeniden açılmadı.

## Özet

İlk geçişteki 18 maddenin 17'si kullanıcıya görünen metinde kapanmış. Açık kalan tek ifade adenozin kartındaki parantezdir: AHA başlangıcı 3 mg diye doğru yazılır, ardından nakil ile santral yol birlikte "1 mg da yeterli olabilir" diye bırakılır.

İnternodal konuda klinik cümle düzelmiştir. Üç tüp hâlâ çizilir. Üzerine gelince başlık sinüs düğümüdür. Tüpün iç adı eski trakt adını taşır ve ekrana yazılmaz.

## Açık kalan

### Adenozin parantezi

Dosya: `src/pharmacology-data.js`, adenozin kartı (TR ve EN).

Periferik erişkin bolus 6 mg, gerekirse 1–2 dakika sonra 12 mg, hastaya yakın giriş ve hemen salin doğru. Nakil, santral kateter, dipiridamol veya karbamazepin için AHA'nın indirdiği başlangıç dozu 3 mg diye de doğru yazılmış.

Aynı cümlenin parantezi, nakil veya santral yolda 1 mg'ın yeterli olabileceğini söyler. Santral yol için indirilen başlangıç 3 mg'dır. 1 mg, denerve nakil kalbinin aşırı duyarlılığı nedeniyle bazı nakil protokollerinin alt sınırıdır. Santral yol ile aynı parantezde durması bu alt sınırı santral doza da yayar.

Aynı kartta doğru kalanlar: preeksite AF ve düzensiz geniş kompleks taşikardide vermemek, aktif bronkospazm, metilksantinin etkiyi azaltması, dipiridamolün etkiyi artırması, karbamazepinin AV bloğu ağırlaştırabilmesi.

## Kapanan 17 madde

| Eski çatışma | Şimdiki kaynak |
|---|---|
| Fossa kenar adları yer değiştirmişti | Üst kenar VKS, alt kenar VKİ. Anterosüperior kenar aort kökü ve nonkoroner sinüs. Anteroinferior kenar septal triküspit menteşesi ve CS ağzı. Arka kenar limbus ve LA serbest duvarı. |
| İnternodal yollar özelleşmiş trakt diye yazılmıştı | Klinik cümle: uyarı krista, fossa kenarları ve Bachmann boyunca sıradan atriyal miyokardadır. Yalıtılmış özelleşmiş trakt yoktur. Ayrıntı aşağıda. |
| Statik balon ile Rashkind birleşmişti | Statik bel kaybı (kalın septum veya şiddetli PH dekompresyonu) ile Rashkind çekme septostomisi (duktus bağımlı yenidoğanda LA'dan RA'ya) ayrılmış. |
| Septum lateralde hem görünmez hem ölçülür denmişti | Düz AP septumu profillemez. Değerlendirme LAO, RAO ve laterali birlikte kullanır. Lateral işaret durur: fossa, aort kökünden omurgaya çizilen yatay çizginin 3–5 mm altındadır. |
| LV summit "genellikle RBBB" diye kilitliydi | TR ve EN: QRS değişkendir. Erişilebilir lateral odakta RBBB olabilir. Erken geçişli LBBB, özellikle ulaşılamayan odakta sık veya daha sıktır. Süperior mitral anülüs ve sol küspis ile çakışma yazılı (Yamada 2010; Kuniewicz 2021). |
| ASD cihazı altı sektörün hepsinde ≥5 mm istiyordu | ≥5 mm süperior, inferiyor, posterior ve AV sektörlerde aranır. Anterosüperior (aort) kenar eksikliği sıktır ve diğer kenarlar tutuyorsa tek başına engel değildir. |
| Akış lejantı bütün venleri mavi sayıyordu | Kırmızı: sol kalp, pulmoner venler, aort, koroner arter. Mavi: sağ kalp, pulmoner arter, sistemik venler. |
| SVT kuralları kapıyı fazla kapatıyordu | Sinüs P'sinden farklı P yalnız sinüs düğümü reentrisini dışlar. Yukarıdan aşağı aktivasyon AVNRT ve AVRT'yi dışlar. Sabit AA ve değişken RP AVNRT ve AVRT'yi dışlar. İzoelektrik taban yalnız flutter'ı dışlar. A > V yalnız AVRT'yi, V > A ise AVRT ve atriyal ritimleri dışlar. |
| A > V ve V > A açıklaması ters mekanizma anlatıyordu | A > V: ventriküle ulaşmayan atriyal vuru AVRT devresini kırar. V > A: olağan mekanizma AVNRT'de üst ortak yol blokudur. Çift antegrat 1:2 iletim ve nodoventriküler devre seyrek kalanlar diye yazılır. |
| Dal bloğunda VA ≥30 ms serbest duvar eşiğiydi | Etiket ve gerekçe artık ≥35 ms (Coumel; Kerr serbest duvar eşiği). |
| Negatif DI ve V3 yalnız ön RVOT'a gidiyordu | V3 yaprağı ön RVOT, sol küspis ve summiti birlikte tutar. Geç geçiş yalnız ön RVOT'tadır. Erken geçiş sol küspis ve summittir. |
| Gizli sol lateral ORT'ye septal eşik yazılmıştı | His-refrakter PVC atriyumu öne çeker. V overdrive sonrası V-A-V. cPPI−TCL <110 ms. Sol serbest duvarda RV apeksten PPI−TCL çoğu kez >115 ms. Septal yollarda PPI−TCL ≤115 ve SA−VA ≤85 ms. |
| Preeksite AF eşiği <250 ms idi | ESC 2019 yüksek risk: SPERRI ≤250 ms ve yol ERP'si ≤250 ms. 250 ms üstü tek başına düşük risk değildir. |
| Şantta PVR sistemik akıma bölünüyordu | Qp/Qs >1 ise PVR paydası Qp'dir (`scenario.co` çarpı şant). SVR paydası Qs olarak kalır. |
| Fick kutusu şantta PA satürasyonunu SvO2 sanıyordu | Şant varsa ön doldurma karışık venözü kullanır. Şant yoksa PA satürasyonu kalır. |
| Tamponad inspirasyonunda LV tepe aortun altına iniyordu | Aşağıda yeniden hesaplandı. Tepe sırası düzelmiş. |
| Konstriksiyon yaklaşık 11 mmHg arter salınımı üretiyordu | Aşağıda yeniden hesaplandı. Salınım 10 mmHg eşiğinin altında. |
| Ea/Ees "0,3–0,7 verimli" bandı | Bu band `src/` içinde yok. P-V notu öğretim modeli olduğunu ve hasta verisi olmadığını söyler. |
| Guyton −45° İngilizcesi DI'de S yazıyordu | TR ve EN: DI pozitif, terminal S DII ve DIII'te. Kayıtlı `lead1` 0,28. |
| İngilizce re-entry hızı yarıya inmeden süreyi ikiye katlıyordu | "İletim hızı yarıya inerse uyarı süresi iki katına çıkar." |

VA >70 ms hâlâ yalnız tipik AVNRT'yi dışlar. Bu, laboratuvar kısaltmasıdır. Atipik dal kodda durur. Güvenlik tersine çevirmesi değildir.

## Yeniden hesap: tamponad ve konstriksiyon

Dosya: `src/hemodynamics.js`, `respirationAdjust`. Hedefler `src/hemo-scenarios.js` içindedir. Eğriler hasta traseleri değildir.

Tamponad hedefleri LV 95/16, aort 92/68. Bayraklar: künt y, eşit diyastol, pulsus, ventriküler interdependence. Pulsus, LV ve aort nabzını diyastolik tabana 0,4 katsayısıyla ezer. İnterdependence aynı ekseni bir kez daha 0,05 katsayısıyla ezer (ilk geçişteki 0,1 değil). Solunum salınımının taban kayması 2 mmHg'dir.

Tam inspirasyonda modelin LV sistolik tepesi 82,3 mmHg, aort tepesi 80,5 mmHg'dir. Aort tepesinin fazında LV 82,0 mmHg'dir (fark +1,5). Semilunar açıklık fazında (0,60) LV 79,3, aort 77,3 mmHg'dir. Kapak açıkken LV, kapanışa kadar aortun üstünde kalır. Ekspirasyonda aort tepesi 95,3 mmHg'dir. İnspirasyon düşüşü yaklaşık 14,8 mmHg'dir. Bu, pulsusun ≥10 mmHg tanımıyla aynı yöndedir.

Konstriksiyonda pulsus bayrağı yoktur. İnterdependence vardır. Aort hedefi 105/70. Ekspirasyon tepesi 108,9 mmHg, inspirasyon tepesi 101,4 mmHg, salınım 7,5 mmHg'dir. Bu, ≥10 mmHg pulsus tanımına girmez. Açık kapak penceresinde LV aortun üstünde kalır (inspirasyonda tepe 106,1 mmHg).

Tamponad tablosunun yönü durur: künt y, Kussmaul yok, karekök yok, eşit diyastol. Konstriksiyonda dik y, karekök ve eşit diyastol durur.

## İnternodal geometri

Kullanıcı kartı (`src/content.js`, sinüs düğümü) ve fizyoloji satırı (`src/physiology-text.js`) aynı şeyi söyler: internodal çizgiler tercihli yayılımdır, yalıtılmış üç özel kablo değildir. Bachmann notu bandın yalıtılmış kablo olmadığını ayrıca söyler.

`src/heart.js` üç tüpü hâlâ çizer ve iç adları Anterior internodal tract, Middle internodal tract (Wenckebach), Posterior internodal tract (Thorel) diye durur. Üçü de `sa` kimliğiyle kayıtlıdır. Üzerine gelince rozet, yapı sözlüğündeki sinüs düğümü başlığını gösterir. Bu iç adlar sahne etiketine bağlanmamıştır. Gören kişi üç ayrı çizgi görür. Aynı kart bunun şematik çizim olduğunu ve özelleşmiş trakt olmadığını yazar. Açıklanmış şemadır. İç ad, bir sonraki etiket bağlanırsa eski terimi geri getirir.

## Ekrana çıkmayan yorum

`src/transseptal.js` dosya başlığı, statik balonu hâlâ "Rashkind-type" diye anar. Kullanıcı adımı (`src/content.js`) iki tekniği ayırmıştır. Yorum ekranda yoktur.

## Bölüm bölüm hüküm

| Bölüm | Hüküm |
|---|---|
| 01 Kaba anatomi | Klinik cümle, fossa kenarları ve akış lejantı düzelmiş. Üç tüp açıklanmış şema olarak durur. Sinüs düğümü yeri, krista, Chiari ağı, koroner sinüs, Koch, His ve sağ dal ilk geçişte tutarlıydı. |
| 02 Sol atriyum ve apendiks | İlk geçişte tutarlı. Bu turda yeniden açılmadı. |
| 03 Sağ atriyum | Fossa kenar cümlesi düzelmiş. Krista, sinüs düğümü yeri ve Chiari ilk geçişte tutarlıydı. |
| 04 Sağ ventrikül | İlk geçişte tutarlı. Bu turda yeniden açılmadı. |
| 05 Sol ventrikül | İlk geçişte tutarlı. ASE/AHA 16 segment. Bu turda yeniden açılmadı. |
| 06 ASD ve VSD | İlk geçişte tutarlı. Bu turda yeniden açılmadı. |
| 07 Fizik muayene | İlk geçişte tutarlı. Lembo 1988 sayıları özetle birebir. Bu turda yeniden açılmadı. |
| 08 Koroner anjiyografi | İlk geçişte tutarlı. Bu turda yeniden açılmadı. |
| 09 Kateter ve hemodinami | PVR paydası, Fick ön doldurması, tamponad tepe sırası, konstriksiyon salınımı ve Ea/Ees bandı kapanmış. Basınç yönleri, Gorlin sabitleri ve 2022 mPAP >20 mmHg tanımı ilk geçişte tutarlıydı. |
| 10 Transseptal ve septostomi | Lateral cümle ve statik/Rashkind kullanıcı metni kapanmış. EHRA sınırları ilk geçişte tutarlıydı. Dosya başlığı yorumu ekrana çıkmaz. |
| 11 EP anatomi | Summit cümlesi TR ve EN'de kapanmış. CTI, Koch, WACA, çatı, mitral istmus ve yavaş yol ilk geçişte tutarlıydı. |
| 12 Pacemaker | İlk geçişte tutarlı. Bu turda yeniden açılmadı. |
| 13 Bachmann | Bandın yalıtılmış kablo olmadığı cümle, sinüs düğümü kartıyla artık aynı yöndedir. Floroskopi yakalamayı kanıtlamaz. |
| 14 TTE | İlk geçişte tutarlı. Bu turda yeniden açılmadı. |
| 15 TEE | İlk geçişte tutarlı. Bu turda yeniden açılmadı. |
| 16 ICE | ASD kenar cümlesi kapanmış. Saat yönü dizisi ilk geçişte tutarlıydı. |
| EPS WPW | İlk geçişte Arruda 1998 ile uyumlu. Sağ serbest duvar DII ayrımı duruyor. Bu turda algoritma yeniden açılmadı. |
| EPS VES | V3 çakışması ön RVOT, sol küspis ve summite açılmış. |
| EPS SVT | Sert dışlamalar ve A > V / V > A gerekçeleri kapanmış. Septal manevra sınırları ilk geçişte tutarlıydı. |
| EPS manevra ve atriyal pacing | İlk geçişte tutarlı. Bu turda yeniden açılmadı. |
| EPS canlı olgular | Sol lateral ORT ipucu ve SPERRI ≤250 kapanmış. Sayısal PPI bu turda hesaplanmadı. |
| EPS ileri olgular | İlk geçişte tutarlı. Bu turda yeniden açılmadı. |
| EPS EGM temelleri | İlk geçişte tutarlı. Bu turda yeniden açılmadı. |
| EPS haritalama, substrat, AF, pace map | İlk geçişte tutarlı. Bu turda yeniden açılmadı. |
| Farmakoloji | Adenozin parantezi açık. Güvenlik kartları ilk geçişte doğru yöndeydi ve bu turda yeniden açılmadı. |
| EKG (Guyton) | −45° cümlesi, kayıtlı DI dalgası ve re-entry hız cümlesi kapanmış. |

## İlk geçişte doğru bulunan ve bu turda yeniden açılmayan güvenlik kartları

- Sınıf IC iskemik ve yapısal kalpte kaçınılır (CAST).
- HFrEF direkleri volüm tedavisinden ayrıdır: ARNI veya uygun değilse ACEI/ARB, kanıtlı beta bloker (karvedilol, bisoprolol, metoprolol süksinat), MRA, SGLT2. Digoksin sağkalım ilacı değildir. Finerenon ve vericiguatın listede olmaması, direkler doğru söylendiği için çatışma sayılmamıştı.
- Beta bloker şokta başlanmaz.
- ACEI ile ARNI birleştirilmez. Her iki geçiş yönünde en az 36 saat ara vardır.
- Nitrat ile PDE5 kontrendikedir. Sildenafil ve tadalafil yıkanma saatleri yazılmamıştır. Kontrendikasyon dururken bu eksiklik yanlış kural değildir.
- Dofetilid başlangıcı en az 3 gün yatış ve sürekli EKG ister.
- Dronedaron kalıcı AF'de, yeni dekompanse semptomatik kalp yetersizliğinde ve NYHA IV'te kontrendikedir.
- Preeksite AF'de AV nodal bloker kontrendikedir.
- mPAP >20 mmHg pulmoner hipertansiyondur (2022 ESC/ERS). Eski ≥25 mmHg ve PVR >3 Wood eşiği tarihsel diye belirtilmiştir. PCWP ≤15 ve PVR >2 prekapiller, PCWP >15 postkapiller.
- Erişkin aks −30° ile +90° dahildir. LAD < −30°. RAD > +90°.

## İlk geçişin hafif ifade notları

Bu turda yeniden okunmadı. Tedavi kuralını tersine çevirmez diye bırakılmışlardı.

- Guyton LBBB Türkçesi septum ve sağ ventrikülün "2–3 kat önce" uyarıldığını söyler.
- Tam blok satırının QRS alanı "geniş kaçış (Stokes-Adams)" der. Kaçış dar da olabilir. Stokes-Adams senkop sendromudur.
- QT satırı 0,36–0,44 sn aralığını QTc ile aynı nefeste birleştirir.
- WPW İngilizce DI ipucu, negatif veya izoelektrik deltayı sol serbest duvardan uzaklaşıyormuş gibi okutabilir. Türkçe ve algoritma sol duvarı tutar.
- WPW yönergesi her derivasyonda delta seçtirir. DIII adımı tüm QRS R/S oranıdır.
- Septal izoelektrik aVF yalnız mitral tarafa kodlanmıştır. Metin Arruda'nın triküspit tarafı açık bıraktığını söyler.
- ASD öğretim satürasyonunda VKİ, VKS'den düşüktür. Basamak atriyumdadır.
- Akut sol ventrikül yetersizliği de büyük v bayrağını kullanır.
- Vazoaktif oklar nitel diye işaretlidir. Düşük doz epinefrin SVR'yi düşürebilir. Dobutamin 2–10 µg/kg/dk ACC kardiyojenik şok aralığı olarak yazılır.
- Sınıf I EKG damgası bütün sınıf için "QRS genişler" der. Lidokain normal dokuda genellikle QRS'i genişletmez.

## Bilerek şema bırakılmış olanlar

Koroner sinüs zamanları 40 ms. PVI'de dört halka. Duvar kesitleri histoloji değildir. Klasik kaskad, hücre temelli pıhtılaşmadan ayrıdır. Ekokardiyografi presetleri ultrason cihazı değildir. Hemodinami eğrileri hasta traseleri değildir. EASY-WPW'nin 7 bölgesi atlas yerleşimlerine indirgenmiştir. Vazoaktif oklar doz-yanıt eğrisi değildir. cSNRT >550 ms ile bazı metinlerdeki >525 ms aynı yöndedir. İnternodal üç tüp, karttaki cümleyle birlikte tercihli yol şemasıdır.

## Bu turda yeniden açılmayanlar

Anjiyografide septal perforatörü tek projeksiyona kilitleyen bir cümle aranmadı. EASY-WPW şeklindeki sağ geç DIII satırı şekille karşılaştırılmadı. Sol lateral ORT'nin simüle sayısal PPI'si hesaplanmadı. İpucu metni artık septal eşiği sol serbest duvardan ayırır. ESC 2021 madde numarası kılavuz PDF'ine karşı açılmadı. İnfranodal blok cümlesi "doğrulanmış infranodal blok" diye sınırlı olduğu için ilk geçişte kabul edilmişti.

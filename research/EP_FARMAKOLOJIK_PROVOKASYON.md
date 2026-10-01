# EP farmakolojik provokasyon, kaynak ve kapsam kaydı

Tarih: 2026-10-01. Yetki: `execute`, eğitim içeriği ve yerel doğrulama; yayın/commit yok.

## DEFINE

Soru: Atropin ve Isuprel manevralarının mekanizması, önce/sonra elektrogramı ve olası farklı indüksiyon sonuçları nasıl açık gösterilir?

Tamamlanma: TR/EN içerik, kaynak bağlantıları, deterministik sentetik EGM ve ölçüm karşılaştırması, ayrı echo/indüksiyon/indüklenememe örnekleri ve çalışan EP paneli. Hasta verisi, klinik kestirim, popülasyon analizi veya doz protokolü bu kapsamda yoktur. İstatistiksel hipotez/estimand uygulanmaz; veri seti yoktur.

## PLAN ve model kararları

Akış: birincil kaynakların erişilebilir metni → sınırlandırılmış klinik açıklama → deterministik eğitim parametreleri → A/H/V olayları → EGM ve önce/sonra tablo.

- Sinüs P-P/hız değişimi ve aynı pacing hızında AH/HV değişimi ayrı gösterilir. AH/HV karşılaştırmasında S1-S1 500 ms tutulur; hız etkisi ile ilaç etkisi karıştırılmaz.
- Sayılar yayınlardan aktarılmış hasta ölçümleri değildir. Tamamı açık etiketli sentetik eğitim parametreleridir; gerçek etki büyüklüğü, başarı oranı veya olasılık ifade etmez. İstatistiksel belirsizlik hesaplanmaz.
- Echo, indüklenen ve indüklenmeyen örnekler alternatif öğretim senaryolarıdır. Kullanıcı seçimi hasta yanıtını tahmin etmez.
- Tek atriyal echo sürdürülen SVT olarak etiketlenmez. İlaç yanıtı mekanizmayı tek başına tanımlamaz; indüklenememe aritmiyi dışlamaz.
- İzoproterenolün hızlı/yavaş yol iletim ve refrakterliği üzerindeki farklı etkileri indüksiyonu kolaylaştırabilir veya engelleyebilir. Her durumda indüksiyon gösteren model seçilmedi.
- Örnekte sabit HV, tüm hastalarda sabit HV veya infrahisiyen güvenlik sonucuna dönüştürülmez.
- İlaç dozu, infüzyon zamanı, uygulama önerisi ve evrensel yanıt yüzdesi eklenmez.

## FACT-CHECK: kaynak matrisi

| ID | Birincil kaynak | Desteklenen içerik | Erişim sınırı |
| --- | --- | --- | --- |
| F1 | Stellbrink et al., *Differential Effects of Atropine and Isoproterenol on Inducibility of Atrioventricular Nodal Reentrant Tachycardia* (2001), [DOI](https://doi.org/10.1023/A:1013258331023) | Randomize karşılaştırmada atropin ve izoproterenolün AVNRT indüklenebilirliğine farklı etkileri | Springer yayıncı sayfası/özet erişilebilir; tam metin incelenmedi. UI başarı yüzdesi kullanmaz. |
| F2 | Hatzinikolaou et al., *Isoprenaline and inducibility of atrioventricular nodal re-entrant tachycardia* (1998), [DOI](https://doi.org/10.1136/hrt.79.2.165), [PubMed 9538310](https://pubmed.ncbi.nlm.nih.gov/9538310/) | İzoproterenolün gruplara göre AVNRT indüksiyonunu kolaylaştırması veya önlemesi; yol özelliklerinin önemi | PubMed özeti erişilebilir; scite kaydının abstract içeriği, `contentDenied: true`. Tam metin kullanılmış gibi sunulmaz. |
| F3 | Akhtar et al., *Electrophysiologic effects of atropine on atrioventricular conduction studied by His bundle electrogram* (1974), [DOI](https://doi.org/10.1016/0002-9149(74)90313-0), [yayıncı özeti](https://www.sciencedirect.com/science/article/abs/pii/0002914974903130) | Atropin sonrası nodal iletim/refrakterlik değişimi | Yayıncı indeksli özet ve PubMed metadata doğrulandı; tam metin incelenmedi. |

Mekanizma ayrıca resmi ürün etiketleriyle kontrol edildi: atropin muskarinik antagonizması ve parasempatik inhibisyonu [DailyMed](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=a6fac578-c7bc-4b3c-a454-7889cc819118); Isuprel selektif olmayan beta-adrenerjik agonizması [FDA etiket 2022](https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/010515s033lbl.pdf). Ürün etiketi EP provokasyon senaryosunun klinik validasyonu olarak kullanılmaz.

Kaynak erişimi 2026-10-01 web araçlarıyla doğrulandı. F2 scite erişim sınırı ana ajanın kaynak kontrolünden aktarılmıştır; bu alt çalışma bağımsız scite sorgusu yapmadı. Kaynak doğrulaması insan klinik hakem incelemesi değildir.

## COMPUTE / VERIFY

Kod: `src/ep-pharma.js` (deterministik olay modeli), `src/ep-pharma-panel.js` (panel), `src/ep-pharma-text.js` (TR/EN ve kaynaklar). Kaynak metni model parametrelerini hasta verisine dönüştürmez. Random seed gerekmez; rastgelelik kullanılmaz.

Çalıştırılan doğrulamalar (2026-10-01):

```sh
node --check src/ep-pharma-text.js
node scripts/test-ep-pharma.mjs
npm run check
npm test
npm run build
npm run test:ep-flow
```

Sonuç: bütün komutlar başarılı (exit 0). İlaç testi 46 deterministik önce/sonra örneğini doğruladı. Tam birim testleri ve Vite 8.3.0 üretim derlemesi geçti. Chrome akışı TR/EN, seçim sonrası kayıt temizliği, masaüstü ve 390×844 mobil ilaç kontrollerini doğruladı. Mobil test uygulamanın mevcut Öğren panelini açarak çalışır. Bağımsız kod/kaynak incelemesinde saptanan Isuprel hız tutarsızlığı düzeltildi: sinüs örneğinde 500 ms pacing, 550 ms P-P’den hızlıdır; diğer provokasyon örneklerinin S1 protokolü 600 ms kalır. İnceleme sonrası açık bulgu yok. `git diff --check` başarılı. Ayrı lint/type-check yapılandırılmamış; `check` JavaScript sözdizimini denetler. Önemli kontroller: A/H/V sıra ve aralık tutarlılığı, aynı S1 hızında AH/HV ölçümü, tek echo ile tekrarlayan döngü ayrımı, noninduced negatif örnek, değişen seçim sonrası bayat EGM temizliği, TR/EN ve mobil görünüm.

## REPORT sınırı

Üretilen EGM eğitsel olay şemasıdır. Klinik elektrofizyoloji kayıtlarına karşı valide edilmemiştir. Modelin sabit değerleri hasta düzeyinde ölçüm, tanı veya ilaç yanıtı olasılığı değildir. Klinik kaynaklar nitel mekanizma açıklamasını destekler; sentetik sayılar için yayımlanmış etki tahmini iddiası yoktur.

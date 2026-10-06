# ECG aks incelemesi, 2026-10-06

Amaç: frontal QRS aksını altı ekstremite derivasyonu üzerinden doğru ve etkileşimli öğretmek. Gerçek hasta verisi kullanılmadı. Eğitim çizimleri tanısal doğrulama taşımaz.

## Kaynaklar

1. [AHA/ACCF/HRS Part III, 2009](https://www.jacc.org/doi/10.1016/j.jacc.2008.12.013): erişkin normal aralık −30°…+90°; sol/sağ sapma ve iletim bozuklukları. Circulation DOI: 10.1161/CIRCULATIONAHA.108.191095. Yayıncı arama metni ve PubMed bibliyografisi kontrol edildi; AHA tam metin isteği 403 döndü.
2. [AHA/ACCF/HRS Part I, 2007](https://doi.org/10.1161/CIRCULATIONAHA.106.180200): ekstremite elektrot farkları ve Goldberger terminali. AHA erişimi 403; aynı belgenin [PDF kopyası](https://fd.org.ua/wp-content/uploads/2019/03/AHA-ACCF-HRS-Recommendations-for-the-Standardization-and-Interpretation-of-the-Electrocardiogram-Part-I.pdf) arama metnindeki elektrot eşitlikleri kontrol edildi. Ölçek düzeltmesi aşağıdaki cebirden bağımsız türetildi.
3. [Zhao, Einthoven’s Triangle Revisited, 2022](https://arxiv.org/abs/2205.06772): eşkenar üçgen modelinin geometrik varsayımları. Ön baskı; klinik doğrulama kaynağı değildir.

## Matematik ve kararlar

Model: tek ortalama vektör, QRS net genliği A·s·cos(θ−α). Bipolar derivasyonlarda s=1, artırılmış derivasyonlarda s=√3/2. II=I+III, aVR=−(I+II)/2, aVL=I−II/2, aVF=II−I/2. Bu nedenle aVF=(√3/2)A·sinθ ve θ=atan2(2·aVF/√3,I). Eşit duyarlılık kullanan eski model Goldberger genlik ilişkilerini korumuyordu.

R ve S, net genliği sağlayacak şekilde yapay üretilir. Eşitlikler net QRS için doğrulanır; bütün zaman örneklerinde elektrot gerilim kimlikleri iddia edilmez. Gerçek EKG'de net genlik hesabına Q ve R′ de girer; alan temelli ortalama aksla sonuç farklılaşabilir.

İzoelektrik seçiminde duyarlılık normalize edilir. Altı yön 30° aralıklıdır; en yakın dik adayın bu modelde maksimum hatası 15°. İzoelektrik yaklaşım yaklaşık sonuç verir. Sıfır net toleransı 1e-9 mV, yalnız kayan nokta sınır hatalarını giderir; klinik eşik değildir. −180° ve +180° aynı yön olarak +180°'ye normalize edilir.

Sınır kuralı: −30°/+90° normal, −90° sol sapma, +180° sağ sapma. Kuzeybatı aralık −180°…−90°; uçlar komşu sınıflara atanır. Çocuk yaş aralıkları kapsam dışında. Tek aks hipertrofi, emboli veya fasiküler blok tanısı koydurmaz.

## Görseller

Hasta sağı/solu ve ayak yönü; renkli kategori seçimi; I/aVF/II canlı karar kartları; altı sentetik şerit; seçili derivasyon izdüşümü; normalize izdüşüm çubukları; hesap yönteminde dik bileşenler; sınır açı düğmeleri. Quiz sırasında kategori ve matematik görselleri gizlenir. Değerlendirilmiş tahmin kilitlenir. TR/EN durumu korunur.

## Doğrulama

`npm run check`, `npm test`, `npm run build`: PASS. Ayrı tip denetleyici/linter yapılandırılmamış; check, Node sözdizimi kontrolüdür.

Model: Einthoven/Goldberger eşitlikleri, tüm tam derece açılarda ters hesap, sınır sınıflaması, 15° izoelektrik hata sınırı ve quiz. Tarayıcı: Chrome masaüstü 1440×1000 ve mobil 390×844, sürükleme, klavye, izdüşüm, sınırlar, −180° eşdeğerliği, quiz gizliliği/kilit, dil, yatay taşma ve JS hata kontrolü.

Bağımsız kod incelemesi DOM sıralama sorununu buldu; düzeltildi ve tarayıcı testi tekrar geçti. Kaynak kontrolü aynı yazar ajan tarafından yapıldı; bağımsız klinik uzman incelemesi yapılmadı. Kaynak erişim sınırları yukarıda açıklandı. Kod kimlikleri ve ortam `provenance.json` içinde. Ekran görüntüleri test komutuyla yeniden üretilebilir; görünüm tarayıcıya bağlıdır, piksel eşitliği vaat edilmez.

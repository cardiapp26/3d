# WPW lokalizasyon incelemesi

Tarih: 2026-10-07. Kapsam: `/eps/#/wpw`. Kaynaklar yeniden okundu: `src/eps/wpw-loc-model.js`, `src/eps/wpw-loc-text.js`, `src/eps/wpw-loc-visual.js`, `scripts/eps/test-wpw-loc.mjs`, `src/eps/ap-boston-guide.js`. Kod değiştirilmedi.

Sağ serbest duvar kuralı Arruda 1998 adım 4 ile çelişiyor. Algoritma, harita örneği, bölge notları ve birim testi aVF polaritesine bakıp D2'yi kullanmıyor. Aynı projedeki `src/eps/ap-boston-guide.js` doğru ayrımı yazıyor. Adım 1 ve adım 2 Arruda ile uyumlu.

Kaynak, modülün kendi atfı: Arruda ve arkadaşları, J Cardiovasc Electrophysiol 1998;9:2–12. Adım 4 cümlesi PAFMJ 2018 aktarımında da aynı. Dalga şekilleri modülün dediği gibi şematik. Çelişki ölçülmüş bir trasede değil, öğretilen lokalizasyon kuralında.

## Sağ serbest duvar

Arruda adım 4, sol serbest duvar ve negatif D2 elendikten sonra:

- aVF'de pozitif delta: sağ anterior veya anterolateral.
- aVF izoelektrik ya da negatifse D2'ye bakılır. D2 pozitifse sağ lateral. D2 izoelektrikse sağ posterior veya posterolateral.

Kod (`wpw-loc-model.js`, 63–65. satırlar) D2'ye bakmadan şunu döndürüyor: aVF pozitif sağ anterior, izoelektrik sağ lateral, negatif sağ posterior. Türkçe ve İngilizce karar cümleleri ile bölge notları aynı üçlüye kilitli.

| Seçim | Kodun dediği | Arruda adım 4 |
|---|---|---|
| aVF pozitif | Sağ anterior | Sağ anterior. Uyumlu. |
| aVF izoelektrik, D2 pozitif | Sağ lateral | Sağ lateral. Yüklü `rightLateral` örneği bu yüzden tutuyor. |
| aVF izoelektrik, D2 izoelektrik | Sağ lateral | Sağ posterior veya posterolateral. |
| aVF negatif, D2 pozitif | Sağ posterior | Sağ lateral. Yüklü `rightPosterior` örneği bu: `{ d2: 'pos', avf: 'neg' }`. |
| aVF negatif, D2 izoelektrik | Sağ posterior | Sağ posterior. Sonuç tutuyor; kural metni yine eksik. |

`scripts/eps/test-wpw-loc.mjs` 32–35. satırlar bu yanlışı kilitliyor. Yorumu "negative aVF is posterior, never lateral". Düzeltmede test Arruda'ya göre değişmeli. Testi klinik hatayı saklayacak biçimde yeşile çekmemek gerekir. D2'nin izoelektrik seçeneği zaten "izoelektrik veya bifazik" diye etiketli. Boston rehberi iki fazlı D2'yi posterior veya posterolateral aday sayar. Adım 4 düzeltilirken bu etiket kullanılabilir.

## İzoelektrik aVF, septal kol

Arruda, septal adayda aVF izoelektrik deltayı posteroseptal triküspit anülüs ya da posteroseptal mitral anülüse yakın olabilecek bir bulgu olarak bırakır. Paragraf başka ayırıcı vermez. Kod 57. satırda yalnızca `posteroseptalMitral` döner. Arayüz de "aVF izoelektrik: posteroseptal, mitral anülüs tarafı" der. Birçok slayt izoelektrik aVF'yi mitrale indirger. Makalenin cümlesi bu kadar kesin değil.

## Sınır notları

D3 seçenekleri R > S anteroseptal, R ≤ S midseptal. Arruda gövdesi R > S için anteroseptal ve sağ anterior paraseptal, R < S için midseptal triküspit anülüs der. R = S ayrıca tanımlanmaz. Rodriguez 1993'te R/S oranı 1 midseptal lehine kullanılır, bu yüzden R ≤ S ters bir kural değil, eşitlik sınırının kapatılması. Pozitif aVF ve R > S kutusu tek başına "anteroseptal (His komşuluğu)" adından biraz geniş: sağ anterior paraseptal bölgeyi de içerir.

V1'de kod ve özet R ≥ S der. Makale gövdesi "R dalgası S'den büyük" diye yazar. Eşit genlikli sınır. Yönü değiştirmez.

## Başarı cümleleri

Posteroseptal grubun tamamı için "inferior derivasyonlardaki negatif delta kaybolur" yazılı (`wpw-loc-text.js`, yaklaşık 99 ve 216). Mitral posteroseptal kolunda aVF izoelektrik, D2 negatif değil. Kaybolacak bir negatif inferior delta yok.

Sol posterior başarı cümlesi de "inferior negatif delta" diyor. Sol posterior kutusu aVF negatif ile izoelektriği birlikte topluyor.

Üst septal başarı cümlesi anteroseptal ve midseptal için "D2, D3 ve aVF'deki pozitif delta kaybolur" diyor. Midseptal kol D3'te R ≤ S ile tanımlı. Arruda'da D3 ölçüsü başlangıç deltası değil, tüm QRS'in R/S oranıdır. Anteroseptal için pozitif D2 ve aVF doğru: Rodriguez 1993'te anteroseptal ve midseptal yolların hiçbiri iki veya daha fazla inferior derivasyonda negatif delta taşımıyordu.

## Josephson zamanlaması

Sağ duvar metni "Josephson triküspit anülüs yolları için en az 25 ms önerir" diyor. Projenin düzeltme planı (`WPW_DUZELTME_VE_GELISTIRME_PLANI.md`) Josephson s. 1224'ü yerel V'nin deltadan 10–30 ms önce gelmesi ve AV füzyon olarak aktarır. Çizim her bölgede 25 ms kullanıyor (`ablLeadBefore: 25`). Bu değer 10–30 aralığının içinde. Sol metin bunu "çizimde 25 ms" diye bağlıyor. "En az 25 ms" cümlesi 10–24 ms'yi dışlıyor ve ölçüyü yalnızca triküspit anülüse özelmiş gibi yazıyor.

## aVF ipucu ve sol posterior polarite

aVF ipucu "Ön-arka ekseni: pozitifse yol önde, negatifse arkada" diyor. İngilizcesi de "Anterior-posterior axis". aVF frontal inferior derivasyondur (+90°). Anüler ön-arka çıkarımları Arruda'da vekil olarak kullanılır. Adım 4, negatif aVF'yi tek başına posterior saymaz.

Sol posterior notu "D1 çoğu kez izoelektrik, aVL izoelektrik veya hafif pozitif" diyor. Harita örneği D1'de `negIso` seçiyor. Monitör (`SURFACE_POLARITY`) sol posteriorda D1 ve aVL'yi kullanıcının seçiminden bağımsız olarak izoelektrik çiziyor. Hafif pozitif aVL çizilemiyor. Arruda sol posterior ve posterolateral için D1'in frank negatif olmasına izin verir. Adım 1 negatif ile izoelektriği ayırmaz. aVL Arruda algoritmasında yoktur.

## ERP kaydırıcısı

250 ms ve altı dalı "Ablasyon önerilir" diyor. Not doğru yazılmış: ESC 2019 SVT yüksek risk ölçütleri SPERRI ≤250 ms, yol ERP'si ≤250 ms, birden fazla yol ve uyarılabilen yol aracılı taşikardi. Değerlendirme izoproterenol ile yapılır. Refrakter süre iletim hızı değildir. Kısa dal semptomu, diğer üç ölçütü ve izoproterenolu söylemiyor. ERP ≤250 risk katmanıdır. Semptomatik WPW ayrı bir ablasyon endikasyonudur. Model yorumundaki "conducts fast" kullanıcıya görünmez.

Pozitif D1 ile negatif D2, tek bir frontal vektörde aVF'yi negatif zorlar. Adım 2 aVF'yi okumadan subepikardiyal posteroseptal döner. Arruda da negatif D2'de durur. Algoritma imkansız frontal kombinasyonu ayrıca reddetmez.

## Artık kodda olmayan eski bulgular

Önceki nottaki şu maddeler güncel kaynakta yok:

- Anteroseptal ve midseptal örnekleri artık D2 pozitif ve aVF pozitif. Negatif veya izoelektrik D2 zorlamıyorlar.
- Pozitif D1, negatif D2 ve pozitif aVF örneği haritada yok.
- Sol posterior aVL negatif çizilmiyor. Monitör izoelektrik çiziyor.
- HV etiketleri kısa için <35 ms, normal için 35–55 ms. Ablasyon öncesi şematik HV 0, sonrası 50. Tam preeksitasyonda HV negatif olabilir. HV 0, deltanın His ile başladığı etiketli bir şema.
- Maskeli sol dal bloğu açıklaması ve LBBB çipi yalnızca sol lateral ders olgusunda açılıyor.
- Genel CS füzyon notu (`t.cs.note`) panelde kullanılmıyor. CS notu bölge profiline göre değişiyor ve septal ile sağı CS'nin ayıramayacağını söylüyor.

## Uyumlu kalanlar

Kısa PR, delta, geniş QRS. Adım 1: D1 negatif veya izoelektrik, ya da V1'de R ≥ S, sol serbest duvar. aVF pozitif sol lateral, negatif veya izoelektrik sol posterior. Adım 2: negatif D2, subepikardiyal posteroseptal. İpucu istisna olduğunu söylüyor. CS zamanları şematik ve öyle etiketlenmiş. His komşuluğunda kriyo ve AV blok riski, CS veya orta kardiyak ven için koroner anjiyografi düşüncesi, LAO kapak planı.

Öncelikli düzeltme: sağ serbest duvar kuralı, örneği, notları ve test kilidi Arruda adım 4'e göre değiştirilmeli.

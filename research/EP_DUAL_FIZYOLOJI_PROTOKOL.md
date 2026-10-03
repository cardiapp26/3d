# Dual AV düğüm fizyolojisi: canlı laboratuvar protokolleri

Kaynak: kullanıcının ders notu "DUAL FİZYOLOJİYİ GÖSTERME" (bölüm 1 ve 2, 2026-10-03). Bu not neyin uygulandığını ve sentetik modelin hangi değerleri verdiğini kaydeder; metin kaynaktan kopyalanmamıştır.

## Kaynaktaki iki gösterim

1. **İnkremental (artan hızda) atriyal pacing:** HRA'dan 560 ms ile başlanır, her 3 s'de siklus 10 ms kısaltılır. Uyarı ile QRS arası (PR) uzar; 1:1 iletimde PR'nin pacing siklusunu (PP) aşması yavaş yol iletimini düşündürür (AH > 180 ms ile birlikte, dolaylı işaret). Sonunda Wenckebach.
2. **Programlı atriyal uyarım:** S1 8 × 500 ms, S2 10'ar ms kısaltılır. 10 ms kısalmada AH'nin en az 50 ms uzaması AH sıçramasıdır (dual AV düğüm fizyolojisi). Daha erken S2'de QRS'in hemen ardından retrograd A (CS proksimalden distale): echo vuru.

## Uygulama (src/eps/ep-live-maneuvers.js, ep-live-panel.js)

- `avbcl` protokolü: `AVBCL_PLAN` = 560 ms'den 10 ms adım, adım başına yaklaşık 3 s, adımlar arasında duraklama yok (tek dizi); ilk AV nodal blokta (Wenckebach) dizi kesilir.
- Her adımda okunan: AH, PR (uyarıdan yüzey QRS'ine) ve PR > PP. H olayları geldikleri kavşak A'sını taşır (`aj`), bu yüzden bir sonraki uyarıdan sonra gelen uzun AH kendi atımına bağlanır.
- Özet: Wenckebach siklusu, adımlar arası AH sıçraması (≥ 50 ms) ve PR > PP'nin ilk görüldüğü siklus. PR > PP sıçramayla birlikteyse "yavaş yol iletimi, dual AV düğüm fizyolojisini destekler"; sıçrama yoksa "hızlı yolun dekremental uzaması da olabilir; tek başına kanıt değil" yazılır (sentetik modelde sol lateral gizli yol olgusu 260 ms'de sıçramasız PR > PP verir).
- `erp` protokolü: echo satırına retrograd A'nın CS dizilimi (konsantrik / eksantrik) eklendi.

## Model değerleri (sentetik, öğretim amaçlı)

| Olgu | Wenckebach | AH sıçraması | PR > PP |
|---|---|---|---|
| Normal iletim | 290 ms | yok | yok (en uzun AH 185 ms) |
| Tipik AVNRT (dual yol) | 250 ms | 370 ms (185 → 268 ms) | 350 ms'den itibaren (AH 272 ms) |

Programlı uyarımda (S1 600 ya da 500) tipik AVNRT olgusunda sıçrama, echo ve sürekli AVNRT aynı adımda (S2 370) görülür; S1 değeri sonucu değiştirmez çünkü modelde hızlı yol ERP'si sabittir. Echo'suz sıçrama ve ayrı echo, statik kütüphanede ayrı kliplerdir (`avnrt-ah-jump`, `avnrt-jump-echo`). Kaynaktaki hasta değerleri (Wenckebach 280 ms, AH 204 → 258 ms) modelle birebir eşlenmedi.

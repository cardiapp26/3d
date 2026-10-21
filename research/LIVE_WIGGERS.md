# Canlı Wiggers, sol kalp kesiti

Hemodinami → **Canlı Wiggers**. Sayfa: `/hemo/#/mode/cath`.

Özgün hareketli atlasın LA, mitral kapak/annülüs, LV, üç aort kapağı küspisi ve aortası görünür. Pulmoner arter, sağ kalp, koronerler ve diğer yardımcı yapılar bu sekmede gizlenir. Geometri silinmez.

## Etkileşim

- Oynat/Dondur; 40–140/dk kalp hızı; 0,25×/0,5×/1× izleme hızı.
- Evre düğmeleri, faz sürgüsü veya grafiğe dokunma: ortak döngü durur ve seçilen ana gider.
- Grafik klavyesi: sol/sağ ok gerçek RR süresinde %1, Shift ile %10; Home/End; Space oynat/dondur.
- LA/LV/Ao basınçları (mmHg), LV hacmi (ml), kapak durumu ve Wiggers imleci aynı döngü anını gösterir.
- TR/EN değişimi seçili anı korur. Mobilde kalp üstte, kaydırılabilir panel altta kalır.
- Sekmeden çıkış kamera, katmanlar, materyaller, opaklık, graft ve önceki ritim/hız/faz/oynatma durumunu geri yükler.

## Model ve kaynak

Tek saat `heart.getCycleState()` ve mevcut `cardiac-cycle.js`. Ek RAF/saat yok. `left-heart-pressures.js`, mevcut `wiggers.js` içindeki `DEFAULT_PROFILE`, doğrudan atriyal basınç, LV/aort basıncı ve LV hacmi fonksiyonlarını kullanır. Sayılar, eğriler ve 3D renk aynı kaynaktan gelir. Normal model kateter senaryosundan bağımsızdır; senaryo kontrolleri bu sekmede gizlidir.

Faz ile gerçek zaman mevcut `phaseToTime/timeToPhase` eşlemesiyle çevrilir. Kapaklar mevcut olay sınırlarını kullanır: mitral kapanması 0,45; aort açılması 0,53; aort kapanması 0,88; mitral açılması sonraki döngünün başlangıcı. Geç ejeksiyonda anlık ters gradyan tek başına aort kapağını kapatmaz. İzovolümik evrelerde iki kapak kapalı, LV hacmi sabittir.

Fizyolojik çerçeve: [OpenStax, Cardiac Cycle](https://openstax.org/books/anatomy-and-physiology-2e/pages/19-3-cardiac-cycle). Eğriler şematik öğretim modelidir; hasta kaydı veya doğrulanmış akışkanlar hesabı değildir.

## 3D temsil sınırları

Kesit düzlemi özgün mitral annülüs, aort kapağı ve LV apeksiyle ölçülür. Atlas ayrı ölçülmüş endokardiyal boşluk/duvar kalınlığı sağlamadığından kalan yerel yüzey basınç kaplaması taşır. Kırmızı ince kesit şeridi düzlem-yüzey kesişimidir. Işık/gölge geometriyi gösterir; kesin değer için mmHg etiketi kullanılır. Referans görsel 3D modelin yerine geçirilmemiştir.

Renk her bölgede aynı mutlak **0–140 mmHg** ölçeğidir; oksijenlenmeyi göstermez. LA değeri PCWP yerine geçirilmez. Etiketler deformasyon uygulandıktan sonra render sırasında özgün yüzey sınırına oturur. Sistem hareketi azalt tercihi korunur; faz seçimi kullanılabilir.

## Doğrulama

```sh
npm run test:live-wiggers
APP_URL=http://127.0.0.1:5196 npm run test:live-wiggers-browser
node scripts/test-hemo-panel.mjs
node scripts/test-wiggers.mjs
APP_URL=http://127.0.0.1:5196 npm run test:hemo-pv
npm run check
npm run build
```

Sayısal testler ortak basınç örneklerini, olay sınırlarını, zaman dönüşümünü, sabit izovolümik hacmi ve mutlak renk ölçeğini doğrular. Tarayıcı gerçek atlas deformasyonunu/shader rengini, yalnız sol kalbi, kapakları, kontrolleri, TR/EN, geri yükleme, aynı Cath moduna yeniden giriş ve mobil görünümü doğrular.

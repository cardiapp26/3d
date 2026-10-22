# Karotis ve periferik anjiyografi çizimleri

## Kapsam

Mevcut etkileşimli SVG atlaslarının yeniden çizimi. Karotis: ark, servikal damarlar, ICA segmentleri, Willis poligonu ve stenoz. Periferik: aortoiliak, femoral, runoff, visseral ve üst ekstremite görünümleri.

Damar merkez çizgileri boyunca daralan lümen, yumuşatılmış damar seyri, kemik ve organ konturları, okunabilir etiket bağlantıları. Mevcut yapı kimlikleri, bilgi kartları, klavye seçimi ve TR/EN desteği korunur. Görseller eğitim şemasıdır; hasta görüntüsü veya ölçülebilir anatomik model değildir.

## Anatomik kontrol kaynakları

- [Alt ekstremite BT anjiyografi anatomisi](https://pmc.ncbi.nlm.nih.gov/articles/PMC5381852/)
- [Popliteal arter dallanması, anjiyografik çalışma](https://pubmed.ncbi.nlm.nih.gov/16843754/)
- [Tibioperoneal trunkus, anjiyografik çalışma](https://pubmed.ncbi.nlm.nih.gov/16163854/)
- [İntrapetröz karotis dalları, radyoanatomik analiz](https://pubmed.ncbi.nlm.nih.gov/424573/)

## Yeniden doğrulama

```sh
npm run check:angio-vascular
npm run test:angio-vascular
APP_URL=http://127.0.0.1:5197 npm run test:angio-vascular-browser
npm run build
```

Tarayıcı testleri Chrome ve Playwright gerektirir. `PLAYWRIGHT_MODULE` değişkeni mevcut Playwright kurulumunun mutlak yolunu alır. Önce `npm run dev -- --host 127.0.0.1 --port 5197` çalıştırılır.

Genel `npm run check` ve `npm test` komutlarına damar atlası kontrolleri eklendi. Tarayıcı testleri tüm görünüm/modlarda yapı seçimini, klavyeyi, dil değişimini ve mobil taşmayı kontrol eder.

## Sonuç

- Genel syntax (`npm run check`), genel test (`npm test`) ve Vite build: PASS.
- Karotis: 5 görünüm, 50 yapı, ark varyantları, NASCET, klavye, TR/EN ve 390 px mobil: PASS.
- Periferik: 71 yapı, tüm görünüm/modlar, klavye, TR/EN ve mobil: PASS.
- Ark çıkış yüksekliği, dış ark tepesine göre LCCA çapı cinsinden sınıflama verisinden türetilir; regresyon testi bu oranı denetler.
- Bağımsız inceleme ark sınıflama sorununu yakaladı. Bu bulgu düzeltildi. İncelemenin son turu hesap kullanım limitinde durdu; kalan diff ve görsel kontrolü yerelde tamamlandı.
- Commit, push veya yayın yapılmadı.

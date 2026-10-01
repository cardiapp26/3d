# Dağıtım raporunun kaynak ve uygulama denetimi

Tarih: 2026-10-01 (Europe/Istanbul). İncelenen başlangıç: `98448cf`, `main` ve `origin/main` eşit, iş ağacı temiz. Kullanıcının yapıştırdığı rapor kod ve belgelerle karşılaştırıldı; doğrulanan yerel sorunlar düzeltildi. Bu işlem dağıtım, hukuki görüş, klinik uzman onayı veya tam WCAG denetimi değildir.

| İddia | Hüküm ve işlem |
|---|---|
| Atlas lisansı doğrulanmamış | İlk dosya incelemesi GLB metadata içinde yalnız Blender dışa aktarıcısını buldu; buradan dış üretici varsayımı yapılması hatalıydı. Kullanıcı 2026-10-01 tarihinde “atlası ben tasarladım” diyerek özgün tasarımın proje sahibine ait olduğunu açıkladı. Önceki bilinmeyen üretici/lisans bulgusu ve buna bağlı dağıtım engeli bu beyanla geçersiz kaldı. `ASSET_PROVENANCE.json` beyanı aktif GLB'nin tam SHA-256 kimliğine bağlar; `verify:license` ve Docker kapısı sahiplik kaydıyla dosya kimliğini kontrol eder, dış kaynak URL veya dış üretici lisansı istemez. Açık kaynak lisansı veya hukuki sertifikasyon verilmiş değildir. |
| Sabit isimler bir yıl immutable, SW cache-first; v9 damgası eski | Geçerli yapılandırma kusuru. Uzun cache yalnız `/assets/` içerik karması bulunan dosyalarda. Sabit adlar HTTP ve SW düzeyinde çevrimiçi yeniden doğrulanır, çevrimdışı aynı build'in son başarılı yanıtı kullanılır. Version JSON saklanmaz; SW kaydı HTTP cache'i kullanmaz. Metadata 1.10.0 / v10 / 2026-10-01 oldu. Sonraki yayınlar için tek `release:stamp` komutu ve tutarlılık testi var. “Her istemci kesin bir yıl eski SW'de kalır” çıkarımı aşırı kesin olur; gerçek canlı yanıt ve tarayıcı cache'i ayrıca ölçülmeli. |
| Gereksiz `heart.glb` dağıtılıyor | Geçerli. Aktif kod referansı yok. Dosya silinmeden tarihsel `research/before-coronary-fix/heart.glb` arşivine taşındı; yeni `dist/models` yalnız aktif atlası içerir. Arşiv Docker context'inden zaten hariç. |
| TEE sayısı 8/10 tutarsız | Geçerli. Baş yorum ve eko kayıtları 8 TTE + 10 TEE, toplam18 olarak hizalandı. Tarihsel16-preset test sonucu tarihsel kaldı. Test assertion açıklaması da güncellendi. |
| npm test browser/geometri/mobil içermez | Geçerli ayrım. Node testleri korunarak `verify:app` ve sekiz akışlı `verify:browser` kapısı eklendi. Chrome test ekran görüntüleri geçici klasöre gider. |
| Büyük dosyalar / dinleyici sızıntısı | Büyük dosyalar doğru: değişiklik sonrası main yaklaşık2037, content1835, heart1067 satır. Sızıntı raporda hipotez; kanıtlanan sızıntı yok. EP paneli `??=` ile bir kere kuruluyor, heart/hemo/exam dispose/destroy yolları mevcut; bu tam heap veya tüm yaşam döngüsü denetimi değildir. Davranışı değiştirmeden modüllere ayırma ayrı refaktör. |
| İş ağacı kirli; farmakoloji incelenmemiş | Başlangıç anında eski bilgi. EP/farmakoloji `98448cf` ile commit ve push edilmişti. 46 çift ilaç örneği, tüm birim testleri ve EP browser akışı geçti; kaynak/kod incelemesi tamamlandı. Klinik uzman onayı anlamına gelmez. Bu yeni düzeltmeler henüz commit edilmedi. |
| Erişilebilirlik kısmi, noscript yok | Noscript eksikliği geçerliydi; iki dilli mesaj eklendi. Klavye yapı seçimi zaten select ile yapılabilir. 3D nokta seçimi ve ekran okuyucu deneyimi için tam WCAG denetimi gerekir; rapordaki kısmi gözlem uygun, sertifikasyon sonucu yok. |
| Eski elipsoid ve eko P1'ler güncel hata değil | Kod ve mevcut karşı örnek testleri bunu destekliyor. Elipsoid raporuna ilk ekranda tarihsel banner eklendi. Eko testleri mevcut18 görünümü dört fazda kontrol ediyor. |

Rakip ürünlerin pazarlama sayıları ve bütün karşılaştırma tablosu bu kod denetiminde yeniden doğrulanmadı. Ürün sınırları (sentetik EGM, şematik PVI, geometrik eko, CFD/radyografik fizik yok, uzman değerlendirmesi eksik) güncel kaynak ve arayüzle uyumlu. Lisans veya klinik geçerlilik başka bir ürünle benzerliğinden çıkarılamaz.

Ek ölçülen kusur: Chrome akışında `ResizeObserver loop completed with undelivered notifications.` görüldü. Döngü paneli observer callback'inde üst workspace CSS yüksekliğini değiştirip daha sığ viewport observer'ını yeniden tetikliyordu. Parent layout yazımı requestAnimationFrame'e ertelendi, değişmeyen yükseklik yazılmıyor. Masaüstü/mobil regresyon testi önce kırmızı, düzeltme sonrası yeşil. Service-worker cache yazma kotası hatasının başarılı HTTP yanıtını bozmaması da negatif testle korunuyor.

## Doğrulama kaydı

- `npm run check`, `npm test`, `npm run build`: başarılı. Ayrı lint/type-check yapılandırılmamış; check JavaScript sözdizimi kontrolüdür.
- `node scripts/test-service-worker.mjs`: sabit ad yeniden doğrulama, hash cache, çevrimdışı fallback, cache sahipliği ve kota başarısızlığı karşı örnekleri başarılı.
- Sürüm damgalama geçici fixture üzerinde başarılı: 1.11.0 / v11 tüm işaretlere birlikte yazıldı; gerçek çalışma ağacı v10 kaldı.
- `npm run verify:browser`: ilk yedi akış geçti; bu tur resize uyarısını ortaya çıkardı. Düzeltme sonrası sekiz akışın tamamı exit0: resize, atlas/geometri, eko18 görünüm×4 faz, mobil320/390, mitral, atriyum, Bachmann ve EP. Son turda ResizeObserver uyarısı yok. Ekran görüntüleri geçici `cardia-verify-UGrNf4` klasörüne yazıldı; takip edilen eski ekran görüntüleri değişmedi.
- Bağımsız kod incelemesi sonrası açık kritik/yüksek/orta/düşük bulgu0. `git diff --check` başarılı. Dağıtım izni bu kod incelemesiyle verilmiş değildir.
- Tarihsel `npm run verify:license` sonucu: ilk, eksik sahiplik kaydıyla `BLOCKED asset distribution`, exit1. Kullanıcının özgün atlas tasarımı beyanı sonrasında bu engel kaldırıldı; güncel kapı beyanı ve `05f373a294ab809b9a628bc1474a66028642997330fddc553a33d4ac6409b757` SHA-256 kimliğini doğrular. Güncel `npm run verify:license` exit0, `PASS asset provenance`. Özgün eser için dış lisans/URL gerekmemesi, eksik beyan, değişen dosya ve ithal eserin yanlışlıkla özgün eser yoluna girememesi fixture testleriyle doğrulandı. Sahiplik düzeltmesi sonrası `npm test` ve `npm run build` tekrar başarılı.
- Docker motoru kapalı: `Cannot connect to the Docker daemon at unix:///Users/yh/.docker/run/docker.sock. Is the docker daemon running?` Bu yüzden gerçek nginx container/syntax/HTTP testleri çalıştırılamadı. `test:deployment` canlı nginx kontrolünü yapacak komut olarak eklendi; geçti iddiası yok.

Nginx direktif davranışı [resmî headers module](https://nginx.org/en/docs/http/ngx_http_headers_module.html) ile; SW registration cache seçeneği [MDN API belgesi](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register) ile kontrol edildi. Bu kaynaklar atlas lisansı veya klinik doğrulama sağlamaz.

## Kalan kapılar

Canlı nginx doğrulaması; eko ve ileri EP için klinik uzman turu. Özgün atlas için dış üretici/kaynak URL/lisans kapısı kalmadı; sahiplik beyanı ve dosya kimliği kayıtlı tutulmalı. Mobil test geçişi bütün WCAG şartlarını veya bellek sızıntısı yokluğunu kanıtlamaz. Canlı servis/CDN bu oturumda değiştirilmedi.

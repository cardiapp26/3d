# Canlı Wiggers

## Kapsam ve bitiş ölçütü

Hemodinamiye ayrı Canlı Wiggers sekmesi. Özgün hareketli atlas üzerinde yalnız LA, mitral kapak, LV, aort kapağı ve aorta görünür. Pulmoner arter ve sağ kalp bu görünümde gizli. Aynı döngü saati, basınç değerlerini, kesit rengini, kapakları ve Wiggers imlecini sürer. Sekmeden çıkışta kateter görünümü geri gelir.

## Aşamalar

1. Basınç çerçevesi ve TR/EN panel: `node scripts/test-live-wiggers.mjs`.
2. Özgün 3D kesit ve hemodinami entegrasyonu: hedef dosyalarda `node --check`, mevcut hemodinami testleri.
3. Tarayıcı: izolasyon, animasyon, durdurma/faz seçimi, dil, mobil ve çıkışta geri yükleme.
4. Bağımsız kod/fizyoloji incelemesi; `npm run check`, `npm test`, `npm run build`.

## Model sınırı

Atlas ayrı endokardiyal boşluk hacmi sağlamıyor. Kesitte görünen iç yüzler eğitim amaçlı basınç rengi taşır; hasta ölçümü veya ölçülmüş duvar kalınlığı değildir. LA basıncı doğrudan LA modelinden gelir, PCWP değildir. Renk tüm bölgelerde aynı 0–140 mmHg ölçeğidir; oksijenlenme göstermez.

## Durum, 2026-10-21

Tamamlandı. Yerel uygulamada Hemodinami → Canlı Wiggers. [Model ve kullanım](LIVE_WIGGERS.md).

VERIFY: `test:live-wiggers`, `test:live-wiggers-browser`, mevcut hemo-panel/Wiggers testleri, `test:hemo-pv`, `test:davinci`, `check` ve `build` geçti. Tarayıcı konsolunda hata yok; masaüstü ve 390×844 mobil ekran görüntüleri `/tmp/cardia-live-wiggers/` altında.

REVIEW: iki bağımsız kod incelemesinin bulguları giderildi. Görünürlükte eklenen false bayraklar, kamera/zoom, opaklığın iç durumu, graft, aynı Cath modunun yeniden seçilmesi, async hata geri alma ve çakışan klavye kısayolları düzeltildi. İlgili tarayıcı gerileme kontrolleri geçti.

Genel `npm test`, bağımsız mevcut PDA/segmentasyon değişikliğinde durdu: `AssertionError: pda: is an atlas structure, schematic overlays keep their own material` (`scripts/test-segmentation-view.mjs:14`). Bu işin değişikliği değil; ilgili dosyalar bu çalışma kapsamında değiştirilmedi. Zincirin ardından gelen `test:davinci` ayrıca çalıştırıldı ve geçti.

SHIP: dosyalar yerelde hazır. Commit/push veya yayın yapılmadı.

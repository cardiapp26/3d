# PacingSim (pacingsimulator.com) incelemesi ve CSP konsolu karşılaştırması

Tarih: 2026-10-28. Build 1.5.3 (25 Ekim 2026). Yalnız iş akışı ve öğretim fikirleri not edildi; kod, dalga modeli, metin ve görsel kopyalanmadı. Site kullanım koşulları kopyalamayı, türev işi ve ticari kullanımı yasaklıyor; bu not yalnız tasarım karşılaştırması içindir ve depoya girmez.

## Sayfa yapısı

- Üst çubuk: olgu seçimi, 5 adımlı faz çubuğu (Target, Pace map, Penetrate, Confirm, Accept), Instructor, Blind, Light.
- Sekmeler: Implant, Capture quiz, Criteria & sources, Case log, Guide.
- İpucu satırı: fazın tek cümlelik talimatı, "Guided case" turu (ilk ziyarette teklif), Keys (?).
- Sol kart: floroskopi. RAO 30 / LAO 40 düğmeleri, kalp tipi (horizontal, compact, vertical), HUD (projeksiyon, 7.5 p/s, floro süresi, AK mGy, DAP), "22 mm from TV summit", LAO'da kılıf açısı rozeti (ideal açıyla kıyas, yeşil/amber/kırmızı), katman kutuları (His/TV summit, His–apeks hattı, hedef sektör, uç-ring cetveli, dokuz bölme ızgarası), Fluoro (basılı tut, Space), Contrast puff (C), Auto-fluoro.
- Orta kart: EP kayıt. Sweep (erase bar) / Scroll, 25–200 mm/s, EKG ×0.6/×1/×1.6, EGM ×0.5–×4, Freeze & review, Analysis. 12 derivasyon + Tip 30–500 Hz + Tip 0.5–500 Hz (COI); V1 ve V6 sarı.
- Sağ kart: verdict kutusu (faz rengi: gri, mavi, amber, yeşil, kırmızı) + "Analyser: unipolar tip": canlı uç EGM, COI parantezi, empedans / COI / Stim–V6RWPT tur trendleri (küçük grafikler), koçluk satırları (CHECK / OK / NEXT), olay günlüğü (saat damgalı).
- Alt kontrol çubuğu (her zaman görünür): Lead (Rotate ×1, ×3 rapid, Unscrew, Forward support kutusu, Lead menüsü: lumenless 3830 / stylet-driven, Retract & reposition), Sheath (CCW, açı kaydırıcı, CW, Sheath & slack menüsü: withdraw, slit, deep breath), Pacing (ON, −, çıkış, +, ayarlar: pulse width 0.2–1.0, uni/bi, hız 60–140), Tests (Threshold, S1–S2 auto sweep / tek S2, Wait 5 min = COI sönümü), Finish case.
- Finish case: puan (0–100), floro süresi, AK, DAP, prosedür süresi, bölge sayısı, tur; madde madde ✓/✗ (ileti kanıtı, kılıf sonrası unipolar eşik, bipolar eşik, eşik < 1.5 V, çıkış ≥ 2× LBB eşiği, R dalgası > 4 mV, kılıf yarıldı, slack kontrolü, komplikasyon). Sonra "Follow-up clinic": gün 1 ve 6. hafta; cihaz eşiği, R dalgası, empedans, implant referansı, implant vs bugün 12 derivasyon, klinik eşik testi, 2 soruluk karar.
- Kayıt gözlemi: floro tuvali hareketsiz (son görüntü tutma); yalnız kayıt ve analizör tuvalleri sürekli çiziliyor. Canlılık hissi kayıt akışı, tur trendleri ve her turda değişen koçluk metninden geliyor.

## Fizyoloji detayları (gözlenen davranış)

- Başlangıç kılıf açısı 74° (anterior serbest duvar). CCW 5°/tık. İdeal açı kalp tipine göre (compact: 12°).
- Septumda dik olmayan kılıfla tur: 4 tur ilerleme yok (drill), sonra kateter travmasıyla yeni RBBB olayı.
- Turda: empedans 540 → 800+ Ω, COI 1 → 20 mV, V6RWPT 120 → 115 ms, QRS 152 → 148 ms. "No terminal R in V1 yet" koçluğu.
- Eşik testi: her 3 atımda bir, 0.25 V, 1.5 V altında 0.1 V. Her QRS geçişi günlüğe.
- Lumenless lead döndürülürken pacing durur; stylet-driven sürekli pace eder ama forward support ister.

## Olgu listesi ve sentetik üretilebilirlik (bizim model için)

Modelimiz (csp-model.mjs) olguyu `caseId` ile sabit koşullarla tanıyor (`scar`, `equal`, `slow`). On dört olguya çıkmak için olgu → parametre nesnesi dönüşümü gerekir. Önerilen parametreler: intrinsik ritim (sinüs / CHB kaçış / LBBB / RBBB), intrinsik QRS şablonu ve hız, skar çarpanı ve derinlik bandı, ileti erişimi, eşik oranı (ileti / miyokard), ERP çifti, V6RWPT ofseti, septum kalınlığı, sol dal seviyesi, travma olasılığı, füzyon.

| PacingSim olgusu | Bizde karşılığı | Üretilebilirlik | Gereken |
|---|---|---|---|
| Sinus node disease, narrow QRS | yok | kolay | intrinsik sinüs ritmi (P dalgası + dar QRS), pacing kapalıyken görünür |
| Complete heart block, narrow escape | baseline hasta metni var, ritim modeli yok | kolay | intrinsik hız 35–45, P ile ilişkisiz |
| LBBB, HFrEF (CRT) | yok | orta | intrinsik LBBB şablonu (V1 QS, V6 geniş çentikli R); düzeltme kriteri V6RWPT < 80 ms |
| LBBB, septal scar (hard) | scar | kolay (LBBB sonrası) | LBBB + skar çarpanı |
| Random patient | yok | kolay | tohumlu rastgele parametre seti, link ile paylaşılabilir |
| isopotential thresholds | equal | var | |
| selective capture unmasked | kısmen | kolay | ileti eşiği miyokardın çok altında; selektifte izoelektrik aralık + ayrı lokal EGM (onset 22 ms zaten var) |
| baseline RBBB | yok | orta | intrinsik RBBB şablonu; terminalR kriteri "burada yararsız" durumu |
| inverted refractoriness | slow'un tersi | kolay | conductionERP < muscleERP; S2'de önce miyokard düşer, selektif LBBP çıkar |
| dilated LV, borderline V6RWPT | yok | kolay | V6RWPT +12–18 ms ofseti; kriter "olası" kalır |
| LBB threshold above muscle threshold | yok | kolay | eşik oranı > 1; azalan çıkışta ns → LVSP (ΔV6RWPT ≥ 15 ms) |
| fusion with intrinsic conduction | yok | orta | intakt AV ileti + sinüs hızı pacing hızına yakın; paced ve intrinsik şablon karışımı, hız artınca kaybolur |
| LBBB, right bundle bumped | yok | orta | tur/torkta olasılıkla travma olayı; intrinsik ritim tam bloğa döner, pacing kapatılamaz |
| mid-septal scar stall | yok | kolay | derinlik .4–.6 bandında grip ~0; forward support veya yeniden konumlama ile aşılır |

Ek: kalp tipi (horizontal / compact / vertical) ANATOMY üzerinden lbb seviyesi ve ideal kılıf açısı ile kolay.

## Bizim konsolda eksik olan, özgün biçimde eklenebilecek dinamikler

1. Tur trendleri: empedans, COI, V6RWPT, QRS her turda küçük grafiklere; "önceki tur → bu tur" farkı.
2. Koçluk satırları: tek rehber cümle yerine 2–4 maddelik CHECK / OK / NEXT listesi (kılıf açısı, pace map, tur ilerlemesi, V1).
3. Verdict kutusu: faz rengi ve başlık ("Septumda, 7. tur: devam et").
4. Floroskopi: tur sırasında helix animasyonu, pulsed floro tuşu ve floro süresi sayacı, kontrast puff, LAO'da açı rozeti (ideal açıyla kıyas), kalp tipi seçimi.
5. Lead tipi: lumenless (tur sırasında pacing durur) / stylet-driven (forward support).
6. Kılıf ve slack adımları ile olgu bitirme puanı; takip kliniği (gün 1 / 6 hafta, eşik olgunlaşması, dislodgement).
7. Scroll modu ve 200 mm/s; EGM kazancı ×4.
8. Olay günlüğüne saat ve komplikasyon maddeleri; "Wait 5 min" ile COI sönümü.
9. Kör değerlendirmede seviye sorusu (LBB gövde / LAF / LSF / LPF).
10. Klavye kısayolları: Space floro, T eşik, S S1–S2, F dondur, P pacing, V projeksiyon, C kontrast, ↑/↓ çıkış.

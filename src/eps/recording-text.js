// Original teaching text adapted from Haq et al., Electrogram recording,
// IPEJ 2026 (CC BY 4.0), pp. 1–11. Section and figure numbers refer to it.
const f = (v, d = 2) => Number.isFinite(v) ? v.toFixed(d) : '∅';

export const RECORDING_TEXT = {
  tr: {
    lang: 'tr', tab: 'EGM Kayıt', title: 'EGM Kayıt Laboratuvarı', eyebrow: 'DOKUDAN EKRANA · 8 DERS',
    intro: 'Ekrandaki EGM kalbin ham sinyali değildir: alınır, büyütülür, sayısallaştırılır, filtrelenir. Her derste doku sabit kalır; yalnızca kayıt koşulunu değiştirir ve sinyalin neden değiştiğini görürsün.',
    basics: 'EGM Temelleri', mapping: 'Aktivasyon haritası', substrate: 'Substrat haritası',
    source: 'Kaynak: Haq ve ark. Electrogram recording. IPEJ 2026 · CC BY 4.0',
    disclaimer: 'Özgün sentetik öğretim sinyalleri; hasta kaydı veya ticari sistem algoritması değildir. Genlikler ve zamanlar klinik eşik olarak kullanılmaz.',
    lesson: 'Ders', of: '/', ref: 'Makalede', concept: 'Kavram', keyPoints: 'Akılda kalsın', pearl: 'Klinik inci',
    stepsTitle: 'Deney adımları', stepsHint: 'Adımı kendin yap ya da “Uygula”ya bas. Gözlem, koşul sağlanınca açılır.',
    apply: 'Uygula', observed: 'Gözlem', done: 'tamam', progress: 'adım tamamlandı',
    controlsTitle: 'Kayıt ayarları', liveTitle: 'Şu an ne görüyorsun?', metricsTitle: 'Ölçümler',
    checklistTitle: 'Gürültü avı · Tablo 1', checklistHint: 'Fiziksel önlemleri sırayla uygula; her biri modeldeki gürültü kaynağını değiştirir.',
    applied: 'Uygulandı', prev: '← Önceki ders', next: 'Sonraki ders →', restart: 'Dersi baştan al',
    quizTitle: 'Kendini sına', correct: 'Doğru.', wrong: 'Tekrar düşün.',
    off: 'Kapalı', on: 'Açık', play: 'Oynat', freeze: 'Dondur', caliper: 'Kaliper', clear: 'Kaliperi sil', mark: 'İşaret koy',
    caliperHelp: 'Kaliper açıkken kayıtta iki noktaya tıkla; ya da zaman imlecini klavyeyle ayarlayıp “İşaret koy”a bas.',
    signal: 'Eşzamanlı kayıtlar · aynı mV ölçeği', tissue: 'Doku ve elektrotlar', scenario: 'Doku / aktivasyon örneği',
    extra: {
      adc: 'ADC yakın görünüm · 222–262 ms · ham giriş ve ADC örnekleri',
      spectrum: 'Zaman-frekans · işlenmiş sinyal · göreli güç (0–1)',
      derivative: '−dV/dt · en yüksek nokta = LAT (en dik iniş)',
      orientation: 'Yön eğrisi · bipolar genlik ve bipol-dalga açısı',
      loop: 'Ortogonal voltaj döngüsü · Bx / By (mV) · ok: omni yönü, kesikli: sanal bipol'
    },
    scenarios: { passing: 'Geçen dalga', focus: 'Yüzeyel odak', breakthrough: 'Yüzeye çıkış (breakthrough)', purkinje: 'Keskin iletim potansiyeli', collision: 'Çarpışan dalgalar', 'shared-local': 'Ortak yerel aktivasyon', deep: 'Derin (epikardiyal) kaynak' },
    labels: { recordingType: 'Kayıt girişi', angle: 'Bipol-dalga açısı (°)', spacing: 'Elektrot aralığı (mm)', contact: 'İkinci elektrodun dokuyla teması', virtualAngle: 'Sanal bipol açısı (°)', hp: 'Yüksek geçiren, HPF (Hz)', lp: 'Alçak geçiren, LPF (Hz)', notch: 'Şebeke notch (Hz)', mains: 'Şebeke gürültüsü (mV)', mismatch: 'Girişler arası dengesizlik', sampleRate: 'ADC örnekleme (Hz)', bits: 'ADC çözünürlüğü (bit)', gain: 'Analog ön kazanç (×)', antiAlias: 'ADC öncesi anti-alias', display: 'Görüntü ölçeği (mV/satır)', zoom: 'Zaman büyütme', time: 'Zaman imleci (ms)' },
    traces: { raw: 'Ham giriş', filtered: 'İşlenmiş (filtre sonrası)', sampled: 'ADC çıkışı', u1: 'U1 (unipolar)', u2: 'U2 (unipolar)', bipolar: 'B = U1 − U2', fieldX: 'Bx (klik çifti 1)', fieldY: 'By (klik çifti 2)', omni: 'Omni, en büyük', virtual: 'Sanal bipol', far: 'Uzak alan bileşeni', multipolar: 'Komşu ortalaması çıkarılmış', tripolar: 'T = E2 − ½(E1 + E3)' },
    metrics: { clippedPercent: 'ADC’de kırpılan örnek', adcStep: 'ADC basamağı', levels: 'ADC seviye sayısı', nyquist: 'Nyquist frekansı', rawPp: 'Ham genlik (p-p)', filteredPp: 'İşlenmiş genlik (p-p)', sharpRaw: 'Keskin potansiyel, ham', sharpFiltered: 'Keskin potansiyel, işlenmiş', rawLat: 'LAT, ham', filteredLat: 'LAT, işlenmiş', latShift: 'LAT kayması', noiseRms: 'Kayıttaki gürültü (RMS)', morphRaw: 'Morfoloji, ham', morphFiltered: 'Morfoloji, işlenmiş', u1Pp: 'U1 yerel genlik', u2Pp: 'U2 yerel genlik', bipolarPp: 'Bipolar genlik', lagMs: 'Dalganın U1→U2 gecikmesi', deepUni: 'Derin potansiyel, U1', deepBi: 'Derin potansiyel, bipolar', bxPp: 'Bx genlik', byPp: 'By genlik', virtualPp: 'Sanal bipol genlik', omniPp: 'Omni genlik', direction: 'Omni yönü (klike göre)', farU1: 'U1’deki uzak alan', tripolarPp: 'Tripolar genlik', multipolarPp: 'Komşu çıkarımı genlik' },
    warnings: { 'nonplanar-source': 'Merkezdeki radyal kaynakta düzlemsel dalga varsayımı geçersiz: omni sonuç hesaplanmaz (∅).', 'deep-source': 'Derin kaynak düzlemsel değildir: omni sonuç hesaplanmaz.', 'planar-assumption': 'Omnipolar: tek, düzlemsel dalga ve yalnızca klik düzlemi varsayılır.', contact: 'İkinci elektrodun katkısı azaldı: bipolar sinyal tek kutup ağırlıklı.', collision: 'Dalga çarpışması: tek yön ve hız varsayımı geçersiz.', 'shared-local-loss': 'Ortak bileşen çıkarılırken gerçek yerel aktivasyon da kayboldu.', aliasing: 'Anti-alias kapalı: Nyquist üstü içerik yanlış frekansta görünebilir.', 'bandwidth-limited': 'ADC bant genişliği seçili LPF’nin altında; sonraki filtre kayıp içeriği geri getiremez.', clipping: 'Ön kazanç ADC aralığını aştı. Kırpılan bilgi görüntü ölçeğiyle geri gelmez.', 'reference-imbalance': 'Gürültü iki girişte eşit değil; ortak mod reddi eksik.' },
    checklist: [
      { id: 'stim', title: 'Pace yapılmıyorken stimülatörü elektrottan ayır', why: 'Bir elektroda bağlı akım kaynağı, akım vermese bile girişleri dengesizleştirir (Şekil 1).' },
      { id: 'interconnect', title: 'Kateter-bağlantı kutusu ara kablosunu değiştir', why: 'Tekrarlanan sterilizasyon blendajı bozar; inatçı gürültüyü çoğu zaman bu çözer.' },
      { id: 'cable', title: 'Sinyal kablolarını kısalt, yerden kaldır, güç kablolarını dik çaprazla', why: 'Uzun ve paralel kablolar anten gibi davranır, kapasitif ve endüktif karışma yaratır.' },
      { id: 'ground', title: 'Tek noktadan topraklama; AC cihazları ayrı topraklı askıya', why: 'Toprak döngüsünü önler, şebeke kuplajını azaltır.' },
      { id: 'unused', title: 'Kullanılmayan jumper ve konnektörleri çıkar ya da tam oturt', why: 'Boşta kalan pin anten gibi gürültü toplar.' },
      { id: 'surface', title: 'Kateterden önce yüzey EKG’yi notch kapalıyken incele', why: 'WCT unipolar kanalların referansıdır; gevşek bir yüzey elektrodu iki kaydı birden bozar. (Bu modelde bilgi amaçlı.)' }
    ],
    lessons: {
      chain: {
        title: 'Dokudan ekrana: kayıt zinciri', ref: '§2.1–2.6',
        concept: 'Hücre dışı potansiyel elektrot-doku arayüzünde kaydedilebilir sinyale dönüşür. His potansiyeli yaklaşık 100 µV olduğundan sinyal yaklaşık 5000 kat büyütülür; amplifikatör seçici değildir, gürültüyü de büyütür. Sonra ADC sinyali sayılara çevirir, filtreler bandı seçer ve ekran gösterir. Her basamak morfolojiyi değiştirebilir.',
        points: [
          'Örnekleme hızı ilgilenilen en yüksek frekansın en az 2 katı olmalı (Nyquist). EGM içeriği yaklaşık 500 Hz’e uzandığı için sistemler ≥1000 Hz örnekler; daha yavaşı keskin defleksiyonları yumuşatır veya yanlış frekansa taşır (aliasing).',
          'Bit derinliği seviye sayısıdır: 8 bit 256, 16 bit 65.536 seviye. Daha çok seviye, büyük sinyalin yanında küçük fraksiyone potansiyeli görünür kılar.',
          'Sinyal ADC aralığını aşarsa tepe kesilir (kırpılma, satürasyon). Genellikle aşırı ön kazançtan olur ve bilgi geri gelmez.'
        ],
        pearl: 'Görüntü kazancı ile kayıt kazancı farklıdır. Ekranda büyütmek kırpılmış tepeyi geri getirmez; ön kazancı düşürüp yeniden kaydet.',
        steps: [
          { do: 'Analog ön kazancı 16× yap.', see: 'ADC girişi ±2 mV aralığını aştı ve tepeler düzleşti. Kırpılan örnek oranına ve ADC yakın görünümüne bak.' },
          { do: 'Görüntü ölçeğini 1 mV/satır yap.', see: 'Çizim büyüdü ama kesik tepe hâlâ kesik, kırpılma oranı aynı. Görüntü ölçeği yalnızca ekrandır, kayda dokunmaz.' },
          { do: 'Kazancı 1×’e indir, ADC’yi 8 bite düşür.', see: '256 seviye: ADC basamağı büyüdü, yakın görünümde merdiven belirginleşti. Küçük keskin potansiyel basamak boyutuna yaklaşıyor.' },
          { do: 'Örneklemeyi 250 Hz yap, anti-alias filtresini kapat.', see: 'Nyquist 125 Hz. Keskin bileşen ya kayboldu ya da yanlış biçimde göründü (aliasing). Sonradan uygulanan dijital LPF bunu düzeltemez.' }
        ],
        live: (s, m) => m.clippedPercent > 0
          ? `Örneklerin %${f(m.clippedPercent)}’i ADC sınırında kesildi. Tepe bilgisi kayboldu; görüntü ölçeğini ne kadar değiştirsen de geri gelmez.`
          : !s.antiAlias && s.sampleRate < 1000
            ? `Örnekleme ${s.sampleRate} Hz, Nyquist ${m.nyquist} Hz ve anti-alias kapalı. Keskin içerik örnekler arasına düşüyor ya da sahte düşük frekans olarak görünüyor.`
            : s.sampleRate < 1000
              ? `Örnekleme ${s.sampleRate} Hz: anti-alias filtresi Nyquist üstünü önceden kesti. Aliasing yok ama keskin bileşen de yok.`
              : s.bits === 8
                ? `8 bit: 256 seviye, basamak ${f(m.adcStep, 1)} µV. Büyük sinyal sığıyor ama küçük potansiyeller basamaklara gömülüyor.`
                : `Temiz kayıt: ${2 ** s.bits} seviye, basamak ${f(m.adcStep, 2)} µV, Nyquist ${m.nyquist} Hz. Ham ve işlenmiş sinyal neredeyse aynı.`,
        quiz: [
          { q: 'ADC’de kırpılmış bir tepeyi hangisi geri getirir?', options: ['Görüntü ölçeğini büyütmek', 'Dijital LPF’yi açmak', 'Hiçbiri; ön kazancı düşürüp yeniden kaydetmek gerekir'], answer: 2, why: 'Kırpılma ADC’de olur; kaybolan örnekler sonraki hiçbir işlemle geri gelmez.' },
          { q: 'His veya Purkinje potansiyeli gibi keskin bir sinyal için en kritik ayar hangisidir?', options: ['Yeterli örnekleme hızı ve anti-alias filtresi', 'Daha büyük ekran', 'Notch filtresi'], answer: 0, why: 'Örnekleme ilgilenilen en yüksek frekansın en az iki katı olmalı; aksi halde keskin defleksiyon yumuşar veya sahte frekansa dönüşür.' }
        ]
      },
      filter: {
        title: 'Filtreler morfolojiyi değiştirir', ref: '§2.4 · Şekil 2, 3, 5',
        concept: 'HPF kesim frekansının altındaki yavaş içeriği (taban kayması, solunum, uzak alan) azaltır. LPF kesimin üstündeki hızlı içeriği azaltır. İkisi birlikte bant geçiren filtre oluşturur. Tipik intrakardiyak ayarlar bipolar için yaklaşık 16–500 Hz, unipolar için 2–240 Hz’dir.',
        points: [
          'HPF yükseldikçe yavaş defleksiyonlar silinir. 100 Hz gibi aşırı yüksek HPF’de EGM genliği ve süresi azalır, morfoloji bozulur (Şekil 2).',
          'LPF 120’den 500 Hz’e açıldıkça sağ dal potansiyeli keskinleşir; çevredeki sağlıklı ventrikül EGM’si az değişir, çünkü 120 Hz üstünde az içerik taşır (Şekil 3).',
          'Aynı elektrottan gelen aynı sinyal, yalnızca HPF 1 Hz yerine 30 Hz yapılarak daha dar ve “bipolar benzeri” görünür (Şekil 5).',
          'Nedensel filtreler zamanlamayı da kaydırır: LAT işareti filtreyle hareket edebilir.'
        ],
        pearl: 'Bir morfolojiyi yorumlamadan önce filtre bandını oku. İletim sistemi potansiyeli arıyorsan LPF’yi düşük tutma; ama yüksek LPF gürültüyü de artırır.',
        steps: [
          { do: 'HPF’yi 30 Hz’e yükselt.', see: 'Yavaş bileşenler (yaklaşık 335 ms’deki geç uzak alan dalgası, taban) silindi; sinyal daraldı ve keskinleşti. Elektrot aynı, yalnızca bant farklı (Şekil 5).' },
          { do: 'HPF’yi 100 Hz yap.', see: 'Genlik ve süre azaldı, morfoloji bozuldu (Şekil 2). LAT kaymasına bak: filtre zamanlamayı da değiştirdi.' },
          { do: 'HPF 16 Hz, LPF 120 Hz yap.', see: 'Yaklaşık 232 ms’deki keskin iletim potansiyeli küntleşti: “keskin potansiyel, işlenmiş” değeri hamın çok altında (Şekil 3).' },
          { do: 'LPF’yi 500 Hz’e aç.', see: 'Keskin potansiyel geri geldi; yüksek frekanslı bileşen artık geçiyor. Zaman-frekans haritasında üst bantlardaki güce bak.' }
        ],
        live: (s, m) => {
          const sharp = Number.isFinite(m.sharpFiltered) && Number.isFinite(m.sharpRaw)
            ? ` Keskin potansiyel hamın %${Math.round(100 * m.sharpFiltered / m.sharpRaw)}’i kadar görünüyor.` : '';
          const band = s.hp >= 70 ? ' HPF çok yüksek: genlik ve süre kısaldı, morfoloji bozuldu.'
            : s.hp >= 16 ? ' HPF yavaş içeriği (uzak alan, taban) siliyor.' : ' HPF düşük: yavaş içerik ve uzak alan korunuyor.';
          const lat = Number.isFinite(m.latShift) && Math.abs(m.latShift) >= 0.5 ? ` LAT ${f(m.latShift, 1)} ms kaydı.` : '';
          return `Bant ${s.hp}–${s.lp} Hz.${band}${s.lp <= 120 ? ' LPF düşük: keskin bileşenler küntleşiyor.' : ''}${sharp}${lat}`;
        },
        quiz: [
          { q: 'LPF 500’den 120 Hz’e indirilince en olası değişiklik?', options: ['Keskin iletim potansiyeli küntleşir', 'Uzak alan dalgası kaybolur', 'Sinyal hiç değişmez'], answer: 0, why: 'LPF yüksek frekansları keser. İletim sistemi potansiyelleri yüksek frekans içerir; sağlıklı miyokard sinyali daha az etkilenir (Şekil 3).' },
          { q: 'HPF 30 Hz yapılan unipolar sinyal neden bipolar gibi görünür?', options: ['Elektrot değişti', 'Düşük frekanslı içerik soyuldu, EGM daraldı', 'Referans elektrot değişti'], answer: 1, why: 'Şekil 5: aynı sinyal, yalnızca bant farklı. Kayıt düzenini görünüşten çıkarma; filtre ayarını oku.' }
        ]
      },
      noise: {
        title: 'Gürültü: önce kaynağı bul', ref: '§2.2, §3 · Şekil 1, 4 · Tablo 1',
        concept: 'Diferansiyel amplifikatör iki girişinin farkını büyütür, ikisinde eşit olanı reddeder (ortak mod reddi; CMRR 100.000:1 = 100 dB). Bu ret gürültüye değil simetriye bağlıdır: gürültü iki girişte eşit görülmelidir. Kuru veya gevşek elektrot, yarım takılı konnektör, yıpranmış kablo, farklı boyutta elektrotlar ya da bir elektroda bağlı stimülatör dengeyi bozar; ortak gürültünün bir kısmı farka dönüşür ve büyütülür.',
        points: [
          'CMRR frekans arttıkça düşer; düşük frekansta verilen değer 50–60 Hz ve üstündeki gerçek performansı abartır.',
          'Amplifikatör, iki elektroda neredeyse aynı anda ulaşan gerçek kardiyak sinyali de gürültüyle birlikte reddeder.',
          'Notch filtresi 50/60 Hz’i bastırır, ama bu frekans fizyolojik bant içindedir; morfolojiyi değiştirir (Şekil 4).'
        ],
        pearl: 'Notch son çaredir. Önce kaynağı bul ve ortadan kaldır: topraklama, blendaj, kablo düzeni, stimülatör bağlantısı (Tablo 1).',
        steps: [
          { do: 'Girişler arası dengesizliği 0,6 yap (örneğin bir elektroda stimülatör bağlı).', see: 'U1 ve U2 aynı 50 Hz gürültüyü taşıyordu, fark sıfırdı. Artık eşit değiller: gürültü bipolar kayıtta belirdi (Şekil 1).' },
          { do: 'Notch’u 60 Hz yap.', see: 'Gürültü azalmadı: şebeke 50 Hz, notch yanlış frekansta. Türkiye ve Avrupa’da 50 Hz, Kuzey Amerika’da 60 Hz.' },
          { do: 'Notch’u 50 Hz yap.', see: 'Gürültü bastırıldı ama işlenmiş kayıtta morfoloji hafifçe değişti; ham giriş ile karşılaştır (Şekil 4).' },
          { do: 'Notch’u kapat; dengesizliği “Gürültü avı” listesinden gider.', see: 'Kaynak düzelince gürültü filtresiz kayboldu ve morfoloji korundu. Doğru sıra budur.' }
        ],
        live: (s, m) => s.mains === 0
          ? 'Ortamda şebeke gürültüsü yok; kayıt temiz.'
          : s.mismatch === 0
            ? `U1 ve U2’de ${f(s.mains)} mV şebeke gürültüsü var, ama eşit. Bipolar kayıtta gürültü ${f(m.noiseRms, 3)} mV RMS: ortak mod reddi tam çalışıyor.`
            : s.notch === 50
              ? `Dengesizlik ${f(s.mismatch)} gürültüyü farka çeviriyor; 50 Hz notch onu bastırıyor ama morfolojiye de dokunuyor. Kaynağı düzeltmek daha iyi.`
              : s.notch === 60
                ? 'Notch 60 Hz, gürültü 50 Hz: filtre yanlış frekansta, gürültü olduğu gibi duruyor.'
                : `Dengesizlik ${f(s.mismatch)}: ortak gürültünün bu kadarı farka dönüştü. Bipolar kayıtta ${f(m.noiseRms, 3)} mV RMS gürültü.`,
        quiz: [
          { q: 'Ablasyon kateterinin distal elektroduna pacing stimülatörü bağlanınca, pace yapılmazken bile distal bipolar kanal gürültülendi. Neden?', options: ['Stimülatör sürekli akım veriyor', 'Akım kaynağı girişleri dengesizleştirdi; ortak gürültü farka dönüştü', 'Filtre ayarı değişti'], answer: 1, why: 'Ortak mod reddi simetriye bağlıdır. Stimülatörü ayırmak dengeyi geri getirir (Şekil 1).' },
          { q: '60 Hz gürültüye karşı ilk tercih?', options: ['Notch’u hemen açmak', 'Gürültü kaynağını bulup gidermek', 'HPF’yi 100 Hz yapmak'], answer: 1, why: 'Notch fizyolojik bantta çalışır ve morfolojiyi değiştirir; kaynak çözülmezse son çaredir (Şekil 4, Tablo 1).' }
        ]
      },
      unipolar: {
        title: 'Unipolar EGM: morfoloji ve LAT', ref: '§4 · Şekil 5',
        concept: 'Unipolar EGM, araştırıcı elektrot ile uzak bir referans arasındaki potansiyel farkıdır. Referans genellikle Wilson merkezi terminalidir: WCT = (RA + LA + LL)/3. Referans kalpten uzak olduğu için kayıt hem yakın hem uzak alanı görür. Fizyolojik anlamı veren düşük frekansları korumak için HPF çok düşük tutulur (genellikle ≤1–2 Hz).',
        points: [
          'Dalga yaklaşırken pozitif, elektrodun altında sıfırdan geçer, uzaklaşırken negatif: rS. Bu şekil dalganın hangi yönden geldiğine bağlı değildir.',
          'Tüm aktivasyon elektrottan uzaklaşıyorsa QS. Odak da breakthrough (yüzeye çıkış) da QS verir; QS tek başına kesin ablasyon hedefini göstermez.',
          'LAT, unipolar sinyalin en dik negatif eğimidir (−dV/dt maks); hücre içi aksiyon potansiyeli yükselişiyle çakışır.',
          'Yanıltıcı QS: dokuya değmeyen (yüzen) elektrot, fazla yüksek HPF (yalancı QS) ya da pozitif girişe bağlanmış referans.'
        ],
        pearl: 'QS gördüğünde temas, lokal empedans, eşlik eden bipolar ve filtre ayarını kontrol et; sonra çevre elektrotlarla birlikte yorumla.',
        steps: [
          { do: '“Geçen dalga” seçiliyken oynat ve dokudaki dalgayı imleçle izle.', see: 'Dalga yaklaşırken pozitif (r), elektrodun altından geçerken en dik iniş (LAT), uzaklaşırken negatif (S): rS.' },
          { do: 'Örneği “Yüzeyel odak” yap.', see: 'Tüm aktivasyon elektrottan uzaklaşıyor: başlangıçta pozitiflik yok, QS.' },
          { do: 'Örneği “Yüzeye çıkış (breakthrough)” yap.', see: 'Kayıt odakla birebir aynı. Elektrot gerçek kaynağın değil, dalganın yüzeye çıktığı noktanın üstünde olabilir (araya giren skar, kapak düzlemi, intramural kaynak).' },
          { do: '“Geçen dalga”ya dön ve HPF’yi 30 Hz yap.', see: 'Düşük frekans soyuldu; sinyal daraldı ve bipolar benzeri oldu. Unipolar için aşırı HPF morfolojiyi bozar ve yalancı QS’ye yol açabilir.' }
        ],
        live: (s, m) => {
          const morph = m.morphFiltered || m.morphRaw;
          const lat = Number.isFinite(m.filteredLat) ? ` LAT ${f(m.filteredLat, 1)} ms.` : '';
          const base = morph === 'QS'
            ? 'QS: elektrodun gördüğü tüm aktivasyon ondan uzaklaşıyor.' + (s.scenario === 'breakthrough' ? ' Bu bir çıkış noktası; kaynak başka yerde.' : s.scenario === 'focus' ? ' Burada gerçekten odak var; ama kayıt çıkış noktasından ayırt edilemez.' : '')
            : morph === 'rS' ? 'rS: dalga önce yaklaşıyor, sonra uzaklaşıyor; elektrot yayılım yolu üzerinde.' : 'Belirgin yerel defleksiyon yok.';
          return `${base}${lat}${s.hp >= 16 ? ` HPF ${s.hp} Hz unipolar için yüksek: morfoloji bipolar benzeri.` : ''}`;
        },
        quiz: [
          { q: 'Unipolar kayıtta QS görüldü. En doğru çıkarım?', options: ['Kesin ablasyon hedefi burası', 'Aktivasyon bu elektrottan uzaklaşıyor; odak ya da çıkış noktası olabilir', 'Elektrot mutlaka dokuyla temassız'], answer: 1, why: 'QS yalnızca gördüğü tüm aktivasyonun uzaklaştığını söyler. Breakthrough, reentride çıkış noktası veya yüzen elektrot da QS verebilir.' },
          { q: 'Unipolar LAT hangi noktadan işaretlenir?', options: ['En yüksek pozitif tepe', 'En dik negatif eğim (−dV/dt maks)', 'Sinyalin başlangıcı'], answer: 1, why: 'En dik iniş, elektrodun altındaki depolarizasyon cephesiyle çakışır.' }
        ]
      },
      bipolar: {
        title: 'Bipolar EGM: iki unipoların farkı', ref: '§5.1–5.2, §5.4 · Şekil 6, 8',
        concept: 'Bipolar EGM iki unipolar EGM’nin farkıdır; geleneksel olarak distal (+) eksi proksimal (−). Burada B = U1 − U2. İki elektrot da yerel sinyali örnekler. Uzak alan ve ortam gürültüsü iki elektroda neredeyse aynı ulaştığı için çıkarmada silinir (ortak mod reddi); yerel sinyal iki elektrotta farklı zamanda olduğu için kalır.',
        points: [
          'Bipolar morfoloji unipolar sinyalin zamana göre türevine benzer; LAT bipolar defleksiyonun tepesidir (pozitif ya da negatif).',
          'Elektrot boyutları farklıysa (ablasyon tipi 3,5–4 mm, halka 1–2 mm) uzak alanı farklı görürler; ret zayıflar. Küçük elektrotlar daha dar, keskin ve seçici sinyal verir (Şekil 8).',
          'Kateter dokuya dik dururken halka kan havuzunda kalır: bipolar sinyal neredeyse tamamen tip elektrodundan gelir.'
        ],
        pearl: 'Bipolar kaydı her zaman onu oluşturan iki unipolarla birlikte incele.',
        steps: [
          { do: 'U1 ve U2’de 50 Hz gürültüyü ve yaklaşık 335 ms’deki yavaş uzak alan dalgasını bul; sonra B’ye bak.', see: 'İki girişte eşit olan gürültü ve uzak alan farkta silindi; yalnızca iki elektrotta farklı zamanda olan yerel bileşen kaldı.' },
          { do: 'İkinci elektrodun temasını 0 yap.', see: 'U2 artık yerel sinyal görmüyor. B, U1’in yerel sinyalinin kendisi oldu: bipolar kaydı tek elektrot üretiyor (Şekil 6). Sessiz elektrot distal olsaydı B ters işaretli olurdu.' },
          { do: 'Teması 0,5 yap.', see: 'Kısmi temas: bipolar genlik ve şekil iki kutbun dengesizliğini yansıtıyor. Doku değişmedi, yalnızca temas.' }
        ],
        live: (s, m) => s.contact <= 0.1
          ? `U2 yerel sinyal görmüyor: B ≈ U1’in yerel bileşeni (${f(m.bipolarPp)} mV). Kayıt tek elektrottan geliyor.`
          : s.contact < 0.95
            ? `Temas %${Math.round(s.contact * 100)}: U2 zayıf, B tek kutup ağırlıklı (${f(m.bipolarPp)} mV).`
            : `U1 ve U2 aynı dalgayı ${f(m.lagMs, 1)} ms arayla görüyor. Ortak gürültü ve uzak alan silindi; B = ${f(m.bipolarPp)} mV.`,
        quiz: [
          { q: 'Bir elektrot ablasyon lezyonu içinde sessiz, diğeri canlı dokuda. Bipolar kayıt neye benzer?', options: ['İki sinyalin ortalamasına', 'Canlı elektrodun unipolar sinyaline (gerekirse ters işaretli)', 'Düz çizgiye'], answer: 1, why: 'B = U1 − U2. Sessiz elektrot katkı vermezse bipolar, tek kutbun unipolarıdır (Şekil 6).' },
          { q: 'Bipolar kayıtta uzak alan neden azalır?', options: ['İki elektroda neredeyse aynı ulaşır ve çıkarmada silinir', 'Filtre onu keser', 'Uzak alan hiç kaydedilmez'], answer: 0, why: 'Ortak mod reddi: iki girişte eşit olan reddedilir. Bu, elektrotlar yakın ve benzer boyutta olduğunda en iyi çalışır.' }
        ]
      },
      spacing: {
        title: 'Yön, aralık ve bipolar körlük', ref: '§5.3, §5.5 · Şekil 7, 9A',
        concept: 'Dalga iki elektrodu sırayla geçer; bipolar EGM bu zaman farkını yansıtır. Bipol ekseni yayılım yönüne paralelse genlik en büyük, dikse en küçüktür: buna bipolar körlük denir (Şekil 9A). Aralık da önemlidir: yakın elektrotlar aynı uzak alanı görüp siler; aralık açıldıkça ret zayıflar.',
        points: [
          'Anizotropik iletimde dik açı, sağlıklı dokuyu düşük voltaj gibi gösterebilir.',
          'Şekil 7: 3 mm aralıklı grid kateter derin/epikardiyal mid-diyastolik potansiyeli ortak mod reddiyle sildi; yaklaşık 20 mm aralıklı geniş bipoller aynı potansiyeli korudu.',
          'Makale aralık küçüldükçe EGM’nin daraldığını ve genliğin arttığını belirtir. Bu modelde aralık-genlik ilişkisi dalga şekline ve gecikmeye bağlıdır; evrensel tek yönlü bir kural olarak okunmamalı.'
        ],
        pearl: 'Düşük bipolar voltajı skar demeden önce kateter yönünü, teması ve aralığı sorgula.',
        steps: [
          { do: 'Bipol-dalga açısını 90° yap.', see: 'Dalga iki elektroda aynı anda ulaşıyor; fark sıfıra yakın. Doku değişmedi, bipolar “kör” oldu. Yön eğrisinde 90°’deki çukura bak.' },
          { do: 'Açıyı 0°, aralığı 10 mm yap.', see: 'Gecikme 20 ms: iki unipolar ayrı ayrı görünüyor, bipolar sinyal genişleyip iki parçaya ayrıldı.' },
          { do: 'Örneği “Derin kaynak” yap, aralığı 2 mm yap.', see: 'Yaklaşık 345 ms’deki derin potansiyel U1 ve U2’de var, ama dar bipolde neredeyse silindi: iki elektroda neredeyse aynı ulaşıyor.' },
          { do: 'Aralığı 10 mm yap.', see: 'Geniş bipol derin potansiyeli korudu (Şekil 7). Zayıf uzak alan reddi burada tanısal bilgi sağladı.' }
        ],
        live: (s, m) => {
          const blind = s.angle >= 80 && s.angle <= 100;
          const deep = s.scenario === 'deep' && Number.isFinite(m.deepBi)
            ? ` Derin potansiyel U1’de ${f(m.deepUni)} mV, bipolarda ${f(m.deepBi)} mV (%${Math.round(100 * m.deepBi / m.deepUni)} korundu).` : '';
          return `${blind ? `Bipol dalgaya neredeyse dik: genlik ${f(m.bipolarPp)} mV, bipolar körlük.` : `Açı ${s.angle}°, aralık ${s.spacing} mm, gecikme ${f(m.lagMs, 1)} ms: bipolar ${f(m.bipolarPp)} mV.`}${deep}`;
        },
        quiz: [
          { q: 'Kateter döndürülünce aynı bölgede bipolar voltaj düştü. İlk düşünce?', options: ['Yeni skar oluştu', 'Bipol dalgaya dik olabilir; yön ve teması kontrol et', 'Amplifikatör arızası'], answer: 1, why: 'Doku aynı; bipolar genlik kayıt geometrisiyle değişir (bipolar körlük).' },
          { q: 'Derin bir potansiyel dar bipolde yok, geniş bipolde var. Neden?', options: ['Geniş bipol uzak alanı daha az reddeder', 'Dar bipolün filtresi farklı', 'Potansiyel yalnızca geniş bipolde oluşur'], answer: 0, why: 'Yakın elektrotlara neredeyse aynı ulaşan sinyal ortak mod reddiyle silinir; geniş aralık bunu korur (Şekil 7).' }
        ]
      },
      omni: {
        title: 'Omnipolar EGM: bipolar körlüğü aşmak', ref: '§6.1 · Şekil 9A–B',
        concept: 'Üç unipolar elektrot dik açılı bir üçlü (klik) oluşturursa, tek bir aktivasyondan birbirine dik iki bipolar sinyal elde edilir (Şekil 9A). Bu iki sinyal vektör olarak birleştirilip iki boyutlu voltaj döngüsü çizilir; kateteri oynatmadan her açıda sanal bir bipolar (omnipol) hesaplanır. En büyük sinyal dalga yönüne hizalı olandır; bu açı yayılım yönünü de verir (Şekil 9B).',
        points: [
          'Varsayım: tek, düzlemsel, homojen ve sabit hızlı dalga, yeterli temas. Çarpışma, fraksiyonasyon veya keskin eğrilikte yön ve hız tahmini güvenilmez.',
          'Omni genlik tüm yönlerin en büyüğüdür; klasik bipolar düşük voltaj eşikleri skarı olduğundan az gösterir ve yeniden türetilmelidir.',
          'Omnipol yalnızca klik düzlemindeki bipol yönelimine bağımlılığı kaldırır. Morfolojisi dalga yönünden gerçekten bağımsız olan kayıt unipolardır.'
        ],
        pearl: 'Omni voltaj haritasında bipolar eşikle “skar yok” deme; eşik bu yöntem için yeniden kalibre edilmelidir.',
        steps: [
          { do: 'Klik dalgaya 70° dönük. Bx ve By genliklerini karşılaştır.', see: 'Dalgaya daha dik duran çift küçük, daha paralel olan büyük sinyal yazıyor: tek bir bipol yöne bağımlı (Şekil 9A).' },
          { do: 'Sanal bipol açısını kaydırarak en büyük sinyali bul.', see: 'Sanal bipol omni genliğine ulaştı. Bu açı, klike göre dalga yayılım yönüdür; döngüde kesikli çizgi uzun eksene hizalandı (Şekil 9B).' },
          { do: 'Klik açısını en az 30° değiştir.', see: 'Bx ve By değişti ama omni genlik aynı kaldı: klik düzlemindeki yönelim etkisi ortadan kalktı.' },
          { do: 'Örneği “Çarpışan dalgalar” yap.', see: 'İki dalga birlikte geçiyor: döngü bozuldu. Tek yön ve hız varsayımı geçersiz; yön okunu yorumlama.' }
        ],
        live: (s, m) => !Number.isFinite(m.omniPp)
          ? 'Merkezde radyal kaynak: düzlemsel dalga yok, omni hesaplanamaz (∅). Burada unipolar morfoloji (QS) daha bilgilendirici.'
          : s.scenario === 'collision'
            ? `Çarpışma: omni ${f(m.omniPp)} mV, ama yön (${m.direction}°) tek bir dalgayı temsil etmiyor.`
            : `Bx ${f(m.bxPp)} mV, By ${f(m.byPp)} mV; sanal bipol ${s.virtualAngle}°’de ${f(m.virtualPp)} mV. Omni ${f(m.omniPp)} mV, ${m.direction}° yönünde.${Math.abs(m.virtualPp - m.omniPp) < 0.03 * m.omniPp ? ' Sanal bipol en büyük yönde.' : ''}`,
        quiz: [
          { q: 'Dalga çarpışma bölgesinde omnipolar yön oku?', options: ['Güvenilir', 'Güvenilmez: tek düzlemsel dalga varsayımı bozulur', 'Daha da doğru olur'], answer: 1, why: 'Yöntem tek, düzlemsel, sabit hızlı dalga varsayar (§6.1.1).' },
          { q: 'Omni voltaj haritasında klasik bipolar skar eşiğini kullanmak?', options: ['Doğru, aynı ölçü', 'Yanlış: omni tüm yönlerin en büyüğü olduğu için skarı olduğundan az gösterir', 'Fark etmez'], answer: 1, why: 'Omni genlik klasik bipolardan büyüktür; düşük voltaj eşikleri yeniden türetilmelidir.' }
        ]
      },
      nearfield: {
        title: 'Yakın alanı ayırmak', ref: '§6.2 · Şekil 9C, 10 · Tablo 2',
        concept: 'Skarda küçük yerel potansiyeller uzak alan altında kaybolabilir. Uzamsal ayrım, sık aralıklı unipolar elektrotlarda uzak alanın neredeyse aynı zamanlama ve şekilde göründüğünü varsayar; ortak bileşeni tahmin edip merkezdeki unipolardan çıkarır. Tripolar (Laplasyen) EGM: T = E2 − ½(E1 + E3) (Şekil 10B). Multipolar EGM komşuları benzerliğe göre ağırlıklandırıp ortak bileşeni çıkarır (Şekil 10A). Frekans ayrımı ise yerel sinyalin keskin ve yüksek frekanslı olduğunu varsayar (Şekil 9C).',
        points: [
          'Sonuç, unipolar karakterini koruyan yerel bir sinyaldir.',
          'Sınır: birden çok elektroda neredeyse aynı anda ulaşan gerçek yerel aktivasyon (derin katmandan gelen ya da yoğun skarda yavaş sinyal) uzak alan sanılıp silinir.',
          'Yüksek frekans işlevsel önem demek değildir: skar VT’sinde tepe frekans kritik istmusu seyirci bölgelerden ayırmadı.',
          'Kanıt sınırlı: domuz kavram çalışmaları ve küçük gözlemsel seriler; klinik fayda kanıtlanmadı. Buradaki komşu çıkarımı basit ortalamadır, ticari PCA algoritması değildir.'
        ],
        pearl: 'İşlenmiş yakın alan sinyalini daima ham unipolarlarla birlikte incele.',
        steps: [
          { do: 'U1’de yaklaşık 335 ms’deki yavaş uzak alan dalgasını bul; tripolar ve komşu çıkarımında ona ne oldu?', see: 'Uzak alan bütün elektrotlarda aynı olduğu için silindi; yerel defleksiyon kaldı.' },
          { do: 'Örneği “Ortak yerel aktivasyon” yap.', see: 'Yerel sinyal bütün komşulara aynı anda ulaşıyor: işlenmiş kayıtlar düz çizgi. Gerçek yerel aktivasyon uzak alan sanılıp silindi.' },
          { do: 'Örneği “Keskin iletim potansiyeli” yap, zaman-frekans haritasına bak.', see: 'Keskin bileşen üst frekans bantlarında güç üretiyor. Bu yerel olduğunu düşündürür, ama kritik istmus kanıtı değildir.' }
        ],
        live: (s, m) => s.scenario === 'shared-local'
          ? `U1’de ${f(m.u1Pp)} mV gerçek yerel sinyal var; tripolar ${f(m.tripolarPp, 3)} mV, komşu çıkarımı ${f(m.multipolarPp, 3)} mV. Gerçek sinyal silindi.`
          : `U1’de ${f(m.farU1)} mV uzak alan var. Tripolar ${f(m.tripolarPp)} mV ve komşu çıkarımı ${f(m.multipolarPp)} mV yalnızca yerel bileşeni gösteriyor.`,
        quiz: [
          { q: 'Komşu elektrotlara eşzamanlı ulaşan gerçek yerel aktivasyona ne olur?', options: ['Her zaman korunur', 'Ortak bileşen sanılıp silinebilir', 'Daha büyük görünür'], answer: 1, why: 'Ortak sinyal her zaman uzak alan değildir (§6.2.2).' },
          { q: 'Tepe frekansı en yüksek bölge kritik VT istmusu mudur?', options: ['Evet, kesin', 'Hayır; yüksek frekans tek başına işlevsel önemi göstermez', 'Yalnızca bipolarda öyledir'], answer: 1, why: 'Skar VT’sinde tepe frekans kritik istmusu seyirci bölgelerden ayırmadı (§6.2.4).' }
        ]
      }
    }
  },
  en: {
    lang: 'en', tab: 'EGM Recording', title: 'EGM Recording Laboratory', eyebrow: 'FROM TISSUE TO SCREEN · 8 LESSONS',
    intro: 'The EGM on screen is not the raw signal from the heart: it is acquired, amplified, digitized and filtered. In each lesson the tissue stays fixed; you change only the recording condition and see why the signal changes.',
    basics: 'EGM basics', mapping: 'Activation map', substrate: 'Substrate map',
    source: 'Source: Haq et al. Electrogram recording. IPEJ 2026 · CC BY 4.0',
    disclaimer: 'Original synthetic teaching signals; neither patient recordings nor a commercial system algorithm. Amplitudes and timings are not clinical thresholds.',
    lesson: 'Lesson', of: '/', ref: 'In the paper', concept: 'Concept', keyPoints: 'Remember', pearl: 'Clinical pearl',
    stepsTitle: 'Experiment steps', stepsHint: 'Do the step yourself or press “Apply”. The observation opens when the condition is met.',
    apply: 'Apply', observed: 'Observation', done: 'done', progress: 'steps completed',
    controlsTitle: 'Recording settings', liveTitle: 'What are you seeing now?', metricsTitle: 'Measurements',
    checklistTitle: 'Noise hunt · Table 1', checklistHint: 'Apply the physical measures in turn; each changes the noise source in the model.',
    applied: 'Applied', prev: '← Previous lesson', next: 'Next lesson →', restart: 'Restart lesson',
    quizTitle: 'Test yourself', correct: 'Correct.', wrong: 'Think again.',
    off: 'Off', on: 'On', play: 'Play', freeze: 'Freeze', caliper: 'Caliper', clear: 'Clear caliper', mark: 'Place mark',
    caliperHelp: 'With calipers on, click two points on the recording, or set the time cursor with the keyboard and press “Place mark”.',
    signal: 'Simultaneous recordings · same mV scale', tissue: 'Tissue and electrodes', scenario: 'Tissue / activation example',
    extra: {
      adc: 'ADC close-up · 222–262 ms · raw input and ADC samples',
      spectrum: 'Time-frequency · processed signal · relative power (0–1)',
      derivative: '−dV/dt · highest point = LAT (steepest downstroke)',
      orientation: 'Orientation curve · bipolar amplitude versus bipole-wave angle',
      loop: 'Orthogonal voltage loop · Bx / By (mV) · arrow: omni direction, dashed: virtual bipole'
    },
    scenarios: { passing: 'Passing wave', focus: 'Superficial focus', breakthrough: 'Surface breakthrough', purkinje: 'Sharp conduction potential', collision: 'Colliding waves', 'shared-local': 'Shared local activation', deep: 'Deep (epicardial) source' },
    labels: { recordingType: 'Recording input', angle: 'Bipole-wave angle (°)', spacing: 'Electrode spacing (mm)', contact: 'Second electrode tissue contact', virtualAngle: 'Virtual bipole angle (°)', hp: 'High-pass, HPF (Hz)', lp: 'Low-pass, LPF (Hz)', notch: 'Mains notch (Hz)', mains: 'Mains interference (mV)', mismatch: 'Input imbalance', sampleRate: 'ADC sampling (Hz)', bits: 'ADC resolution (bit)', gain: 'Analog pre-gain (×)', antiAlias: 'Pre-ADC anti-alias', display: 'Display scale (mV/row)', zoom: 'Time zoom', time: 'Time cursor (ms)' },
    traces: { raw: 'Raw input', filtered: 'Processed (filtered)', sampled: 'ADC output', u1: 'U1 (unipolar)', u2: 'U2 (unipolar)', bipolar: 'B = U1 − U2', fieldX: 'Bx (clique pair 1)', fieldY: 'By (clique pair 2)', omni: 'Omni, maximal', virtual: 'Virtual bipole', far: 'Far-field component', multipolar: 'Neighbor mean subtracted', tripolar: 'T = E2 − ½(E1 + E3)' },
    metrics: { clippedPercent: 'ADC samples clipped', adcStep: 'ADC step', levels: 'ADC levels', nyquist: 'Nyquist frequency', rawPp: 'Raw amplitude (p-p)', filteredPp: 'Processed amplitude (p-p)', sharpRaw: 'Sharp potential, raw', sharpFiltered: 'Sharp potential, processed', rawLat: 'LAT, raw', filteredLat: 'LAT, processed', latShift: 'LAT shift', noiseRms: 'Noise in recording (RMS)', morphRaw: 'Morphology, raw', morphFiltered: 'Morphology, processed', u1Pp: 'U1 local amplitude', u2Pp: 'U2 local amplitude', bipolarPp: 'Bipolar amplitude', lagMs: 'Wave delay U1→U2', deepUni: 'Deep potential, U1', deepBi: 'Deep potential, bipolar', bxPp: 'Bx amplitude', byPp: 'By amplitude', virtualPp: 'Virtual bipole amplitude', omniPp: 'Omni amplitude', direction: 'Omni direction (to clique)', farU1: 'Far field in U1', tripolarPp: 'Tripolar amplitude', multipolarPp: 'Neighbor subtraction amplitude' },
    warnings: { 'nonplanar-source': 'The planar-wave assumption is invalid at a central radial source: omni result unavailable (∅).', 'deep-source': 'A deep source is not planar: omni result unavailable.', 'planar-assumption': 'Omnipolar: one planar wave within the clique plane is assumed.', contact: 'Reduced second-electrode contribution: the bipolar is dominated by one pole.', collision: 'Wave collision: a single direction and velocity assumption is invalid.', 'shared-local-loss': 'Shared-component subtraction also removed genuine local activation.', aliasing: 'Anti-alias off: content above Nyquist can appear at a false frequency.', 'bandwidth-limited': 'ADC bandwidth is below the selected LPF; later filtering cannot recover lost content.', clipping: 'Pre-gain exceeded the ADC range. Display scaling cannot restore clipped information.', 'reference-imbalance': 'Noise differs between inputs; common-mode rejection is incomplete.' },
    checklist: [
      { id: 'stim', title: 'Disconnect the stimulator from the electrode when not pacing', why: 'A current source attached to one electrode unbalances the inputs even without delivering current (Fig. 1).' },
      { id: 'interconnect', title: 'Replace the catheter-to-junction-box interconnect', why: 'Repeated resterilization degrades shielding; this often fixes intractable noise.' },
      { id: 'cable', title: 'Shorten signal cables, keep them off the floor, cross power cables perpendicularly', why: 'Long or parallel cables act as antennae and promote capacitive and inductive crosstalk.' },
      { id: 'ground', title: 'Single-point ground; AC devices on a separate earth-grounded boom', why: 'Avoids ground loops and reduces mains coupling.' },
      { id: 'unused', title: 'Remove or fully seat unused jumpers and connectors', why: 'An unplugged pin behaves as an antenna.' },
      { id: 'surface', title: 'Inspect the surface ECG with the notch off before catheters go in', why: 'WCT is the unipolar reference; one loose surface lead contaminates both recordings. (Informational in this model.)' }
    ],
    lessons: {
      chain: {
        title: 'From tissue to screen: the recording chain', ref: '§2.1–2.6',
        concept: 'The extracellular potential becomes a recordable signal at the electrode-tissue interface. A His potential is about 100 µV, so the signal is amplified about 5000-fold; amplification is nonselective and noise is amplified too. The ADC then converts it to numbers, filters select the band and the screen displays it. Every step can change morphology.',
        points: [
          'Sampling must be at least twice the highest frequency of interest (Nyquist). EGM content reaches about 500 Hz, so systems sample at ≥1000 Hz; slower sampling smooths sharp deflections or moves them to a false frequency (aliasing).',
          'Bit depth is the number of levels: 8 bit 256, 16 bit 65,536. More levels let small fractionated potentials be seen beside large signals.',
          'If the signal exceeds the ADC range, peaks are truncated (clipping, saturation). Excess pre-amplification is the usual cause, and the information does not return.'
        ],
        pearl: 'Display gain and recording gain differ. Enlarging on screen does not restore a clipped peak; reduce pre-gain and record again.',
        steps: [
          { do: 'Set analog pre-gain to 16×.', see: 'The ADC input exceeded ±2 mV and peaks flattened. Check the clipped-sample fraction and the ADC close-up.' },
          { do: 'Set display scale to 1 mV/row.', see: 'The drawing grew, but the truncated peak is still truncated and the clipped fraction is unchanged. Display scale affects only the screen.' },
          { do: 'Reduce gain to 1× and the ADC to 8 bit.', see: '256 levels: the ADC step grew and the staircase is visible in the close-up. The small sharp potential approaches the step size.' },
          { do: 'Sample at 250 Hz with the anti-alias filter off.', see: 'Nyquist is 125 Hz. The sharp component vanished or appeared distorted (aliasing). A later digital LPF cannot repair this.' }
        ],
        live: (s, m) => m.clippedPercent > 0
          ? `${f(m.clippedPercent)}% of samples were truncated at the ADC limit. Peak information is lost; no display scale will bring it back.`
          : !s.antiAlias && s.sampleRate < 1000
            ? `Sampling ${s.sampleRate} Hz, Nyquist ${m.nyquist} Hz, anti-alias off. Sharp content falls between samples or appears as a false low frequency.`
            : s.sampleRate < 1000
              ? `Sampling ${s.sampleRate} Hz: the anti-alias filter removed content above Nyquist first. No aliasing, but no sharp component either.`
              : s.bits === 8
                ? `8 bit: 256 levels, step ${f(m.adcStep, 1)} µV. The large signal fits, but small potentials sink into the steps.`
                : `Clean recording: ${2 ** s.bits} levels, step ${f(m.adcStep, 2)} µV, Nyquist ${m.nyquist} Hz. Raw and processed signals nearly match.`,
        quiz: [
          { q: 'Which restores a peak clipped by the ADC?', options: ['Enlarging the display scale', 'Enabling a digital LPF', 'Neither; reduce pre-gain and record again'], answer: 2, why: 'Clipping happens at the ADC; lost samples are not restored by any later step.' },
          { q: 'For a sharp His or Purkinje potential, which setting is most critical?', options: ['Adequate sampling rate and anti-alias filter', 'A bigger screen', 'Notch filter'], answer: 0, why: 'Sampling must be at least twice the highest frequency of interest; otherwise sharp deflections smooth out or alias.' }
        ]
      },
      filter: {
        title: 'Filters change morphology', ref: '§2.4 · Figs. 2, 3, 5',
        concept: 'A high-pass filter attenuates slow content below its cutoff (baseline wander, respiration, far field). A low-pass filter attenuates fast content above its cutoff. In series they form a band-pass filter. Typical intracardiac settings are about 16–500 Hz for bipolar and 2–240 Hz for unipolar.',
        points: [
          'As HPF rises, slow deflections disappear. At an excessive HPF such as 100 Hz, EGM amplitude and duration decrease and morphology distorts (Fig. 2).',
          'As LPF widens from 120 to 500 Hz the right bundle potential sharpens, while healthy ventricular EGMs change little because they carry limited content above 120 Hz (Fig. 3).',
          'The same signal from the same electrode looks narrower and “bipolar-like” when only the HPF changes from 1 to 30 Hz (Fig. 5).',
          'Causal filters also shift timing: the LAT mark can move with the filter.'
        ],
        pearl: 'Read the filter band before interpreting morphology. Do not keep LPF low when looking for conduction-system potentials; a high LPF also admits more noise.',
        steps: [
          { do: 'Raise HPF to 30 Hz.', see: 'Slow components (the late far-field wave near 335 ms, baseline) disappeared; the signal became narrower and sharper. Same electrode, different band (Fig. 5).' },
          { do: 'Set HPF to 100 Hz.', see: 'Amplitude and duration fell and morphology distorted (Fig. 2). Check the LAT shift: the filter changed timing too.' },
          { do: 'Set HPF 16 Hz and LPF 120 Hz.', see: 'The sharp conduction potential near 232 ms is blunted: “sharp potential, processed” is far below raw (Fig. 3).' },
          { do: 'Open LPF to 500 Hz.', see: 'The sharp potential returned; its high-frequency content now passes. Look at power in the upper bands of the time-frequency map.' }
        ],
        live: (s, m) => {
          const sharp = Number.isFinite(m.sharpFiltered) && Number.isFinite(m.sharpRaw)
            ? ` The sharp potential shows ${Math.round(100 * m.sharpFiltered / m.sharpRaw)}% of its raw size.` : '';
          const band = s.hp >= 70 ? ' HPF is very high: amplitude and duration shrank, morphology distorted.'
            : s.hp >= 16 ? ' HPF removes slow content (far field, baseline).' : ' HPF is low: slow content and far field are kept.';
          const lat = Number.isFinite(m.latShift) && Math.abs(m.latShift) >= 0.5 ? ` LAT moved ${f(m.latShift, 1)} ms.` : '';
          return `Band ${s.hp}–${s.lp} Hz.${band}${s.lp <= 120 ? ' LPF is low: sharp components are blunted.' : ''}${sharp}${lat}`;
        },
        quiz: [
          { q: 'Most likely change when LPF drops from 500 to 120 Hz?', options: ['A sharp conduction potential becomes blunted', 'The far-field wave disappears', 'Nothing changes'], answer: 0, why: 'LPF removes high frequencies. Conduction-system potentials contain them; healthy myocardium is less affected (Fig. 3).' },
          { q: 'Why does a unipolar signal at HPF 30 Hz look bipolar?', options: ['The electrode changed', 'Low-frequency content was stripped and the EGM narrowed', 'The reference changed'], answer: 1, why: 'Fig. 5: same signal, different band. Do not infer the configuration from appearance; read the filter settings.' }
        ]
      },
      noise: {
        title: 'Noise: find the source first', ref: '§2.2, §3 · Figs. 1, 4 · Table 1',
        concept: 'A differential amplifier magnifies the difference between its inputs and rejects what is identical at both (common-mode rejection; CMRR 100,000:1 = 100 dB). Rejection depends on symmetry, not on the noise itself: interference must be seen equally by both inputs. A dried or loose electrode, a partially seated connector, a degraded cable, electrodes of different size or a stimulator attached to one electrode break that balance; part of the common noise becomes differential and is amplified.',
        points: [
          'CMRR falls as frequency rises; a value quoted at low frequency overstates performance at 50–60 Hz and above.',
          'The amplifier also rejects genuine cardiac activity that reaches both electrodes near-simultaneously.',
          'A notch filter suppresses 50/60 Hz, but that frequency lies inside the physiologic band, so morphology changes (Fig. 4).'
        ],
        pearl: 'The notch is a last resort. Find and remove the source first: grounding, shielding, cable management, stimulator connection (Table 1).',
        steps: [
          { do: 'Set input imbalance to 0.6 (for example, a stimulator on one electrode).', see: 'U1 and U2 carried the same 50 Hz noise and the difference was zero. Now they differ: noise appears in the bipolar recording (Fig. 1).' },
          { do: 'Set the notch to 60 Hz.', see: 'Noise did not fall: mains is 50 Hz and the notch is at the wrong frequency. Europe and Türkiye use 50 Hz, North America 60 Hz.' },
          { do: 'Set the notch to 50 Hz.', see: 'Noise was suppressed but the processed morphology changed slightly; compare with the raw input (Fig. 4).' },
          { do: 'Turn the notch off; remove the imbalance from the “Noise hunt” list.', see: 'With the source fixed, noise disappeared without filtering and morphology was preserved. That is the right order.' }
        ],
        live: (s, m) => s.mains === 0
          ? 'No mains interference in the room; the recording is clean.'
          : s.mismatch === 0
            ? `U1 and U2 carry ${f(s.mains)} mV mains noise, but equally. Bipolar noise is ${f(m.noiseRms, 3)} mV RMS: common-mode rejection works fully.`
            : s.notch === 50
              ? `Imbalance ${f(s.mismatch)} turns noise into a difference; the 50 Hz notch suppresses it but also touches morphology. Fixing the source is better.`
              : s.notch === 60
                ? 'Notch at 60 Hz, noise at 50 Hz: the filter is at the wrong frequency and the noise remains.'
                : `Imbalance ${f(s.mismatch)}: this share of common noise became differential. Bipolar noise is ${f(m.noiseRms, 3)} mV RMS.`,
        quiz: [
          { q: 'With a pacing stimulator connected to the distal ablation electrode, the distal bipolar became noisy even without pacing. Why?', options: ['The stimulator delivers current continuously', 'The current source unbalanced the inputs; common noise became differential', 'The filter changed'], answer: 1, why: 'Common-mode rejection depends on symmetry. Disconnecting the stimulator restores balance (Fig. 1).' },
          { q: 'First choice against 60 Hz interference?', options: ['Turn on the notch immediately', 'Find and remove the noise source', 'Set HPF to 100 Hz'], answer: 1, why: 'The notch acts inside the physiologic band and changes morphology; it is a last resort (Fig. 4, Table 1).' }
        ]
      },
      unipolar: {
        title: 'Unipolar EGM: morphology and LAT', ref: '§4 · Fig. 5',
        concept: 'A unipolar EGM is the potential difference between an exploring electrode and a distant reference, usually the Wilson central terminal: WCT = (RA + LA + LL)/3. Because the reference is remote, the recording sees both near and far field. To keep the low frequencies that give it physiologic meaning, the HPF uses a very low cutoff (typically ≤1–2 Hz).',
        points: [
          'Positive as the wave approaches, crossing zero beneath the electrode, negative as it moves away: rS. The shape does not depend on the direction the wave comes from.',
          'If all activation moves away from the electrode: QS. Both a focus and a breakthrough give QS; QS alone cannot pinpoint an ablation target.',
          'LAT is the steepest negative slope of the unipolar signal (max −dV/dt); it coincides with the intracellular upstroke.',
          'Misleading QS: a floating electrode, an excessive HPF (pseudo-QS) or the reference connected to the positive input.'
        ],
        pearl: 'When you see QS, check contact, local impedance, the accompanying bipolar and the filter; then interpret with neighboring electrodes.',
        steps: [
          { do: 'With “Passing wave” selected, play and follow the wave in the tissue with the cursor.', see: 'Positive as the wave approaches (r), steepest downstroke beneath the electrode (LAT), negative as it leaves (S): rS.' },
          { do: 'Select “Superficial focus”.', see: 'All activation moves away from the electrode: no initial positivity, QS.' },
          { do: 'Select “Surface breakthrough”.', see: 'Identical to the focus. The electrode may sit over the point where the wave reaches the surface, not over the source (interposed scar, valve plane, intramural source).' },
          { do: 'Return to “Passing wave” and set HPF to 30 Hz.', see: 'Low frequencies were stripped; the signal narrowed and became bipolar-like. For unipolar recordings an excessive HPF distorts morphology and can create pseudo-QS.' }
        ],
        live: (s, m) => {
          const morph = m.morphFiltered || m.morphRaw;
          const lat = Number.isFinite(m.filteredLat) ? ` LAT ${f(m.filteredLat, 1)} ms.` : '';
          const base = morph === 'QS'
            ? 'QS: all activation seen by the electrode moves away from it.' + (s.scenario === 'breakthrough' ? ' This is an exit point; the source is elsewhere.' : s.scenario === 'focus' ? ' There is a true focus here, yet the recording cannot be told apart from an exit point.' : '')
            : morph === 'rS' ? 'rS: the wave approaches, then leaves; the electrode lies on the propagation path.' : 'No clear local deflection.';
          return `${base}${lat}${s.hp >= 16 ? ` HPF ${s.hp} Hz is high for unipolar: morphology looks bipolar.` : ''}`;
        },
        quiz: [
          { q: 'A unipolar recording shows QS. Best inference?', options: ['This is definitely the ablation target', 'Activation moves away from this electrode; it may be a focus or an exit', 'The electrode must be out of contact'], answer: 1, why: 'QS says only that all activation it sees moves away. Breakthrough, a reentry exit or a floating electrode can also give QS.' },
          { q: 'Where is unipolar LAT annotated?', options: ['Highest positive peak', 'Steepest negative slope (max −dV/dt)', 'Signal onset'], answer: 1, why: 'The steepest downstroke coincides with the depolarization front beneath the electrode.' }
        ]
      },
      bipolar: {
        title: 'Bipolar EGM: the difference of two unipolars', ref: '§5.1–5.2, §5.4 · Figs. 6, 8',
        concept: 'A bipolar EGM is the difference of two unipolar EGMs, conventionally distal (+) minus proximal (−). Here B = U1 − U2. Both electrodes sample the local signal. Far field and room noise reach both almost identically and cancel in the subtraction (common-mode rejection); the local signal arrives at different times and remains.',
        points: [
          'Bipolar morphology resembles the time derivative of the unipolar; LAT is the peak of the bipolar deflection (positive or negative).',
          'Electrodes of different size (3.5–4 mm tip, 1–2 mm ring) see different far fields and rejection weakens. Smaller electrodes give narrower, sharper, more selective signals (Fig. 8).',
          'With the catheter perpendicular to tissue, the ring sits in the blood pool: the bipolar comes almost entirely from the tip.'
        ],
        pearl: 'Always review a bipolar recording together with its two unipolars.',
        steps: [
          { do: 'Find the 50 Hz noise and the slow far-field wave near 335 ms in U1 and U2; then look at B.', see: 'Noise and far field equal at both inputs canceled; only the local component, timed differently at the two electrodes, remained.' },
          { do: 'Set second-electrode contact to 0.', see: 'U2 no longer sees local signal. B became U1’s local signal: one electrode produces the bipolar (Fig. 6). Had the silent electrode been distal, B would be inverted.' },
          { do: 'Set contact to 0.5.', see: 'Partial contact: bipolar amplitude and shape reflect the imbalance of the two poles. Tissue did not change, only contact.' }
        ],
        live: (s, m) => s.contact <= 0.1
          ? `U2 sees no local signal: B ≈ U1’s local component (${f(m.bipolarPp)} mV). The recording comes from one electrode.`
          : s.contact < 0.95
            ? `Contact ${Math.round(s.contact * 100)}%: U2 is weak and B is dominated by one pole (${f(m.bipolarPp)} mV).`
            : `U1 and U2 see the same wave ${f(m.lagMs, 1)} ms apart. Common noise and far field canceled; B = ${f(m.bipolarPp)} mV.`,
        quiz: [
          { q: 'One electrode is silent inside a lesion, the other on live tissue. The bipolar looks like?', options: ['The average of both', 'The live electrode’s unipolar (possibly inverted)', 'A flat line'], answer: 1, why: 'B = U1 − U2. If the silent electrode contributes nothing, the bipolar is one pole’s unipolar (Fig. 6).' },
          { q: 'Why is far field reduced in a bipolar recording?', options: ['It reaches both electrodes almost identically and cancels', 'A filter removes it', 'Far field is never recorded'], answer: 0, why: 'Common-mode rejection: what is equal at both inputs is rejected, best with close, similar-size electrodes.' }
        ]
      },
      spacing: {
        title: 'Orientation, spacing and bipolar blindness', ref: '§5.3, §5.5 · Figs. 7, 9A',
        concept: 'The wave passes the two electrodes in sequence; the bipolar EGM reflects that time offset. Amplitude is maximal when the bipole axis is parallel to propagation and minimal when perpendicular: bipolar blindness (Fig. 9A). Spacing matters too: close electrodes see the same far field and cancel it; wider spacing weakens rejection.',
        points: [
          'In anisotropic conduction a perpendicular angle can make healthy tissue look low voltage.',
          'Fig. 7: a 3-mm-spaced grid removed a deep/epicardial mid-diastolic potential through common-mode rejection; ~20-mm-spaced wide bipoles preserved it.',
          'The paper notes narrower, higher-amplitude EGMs as spacing decreases. In this model the spacing-amplitude relation depends on waveform and delay; do not read it as a universal monotonic rule.'
        ],
        pearl: 'Before calling low bipolar voltage scar, question catheter orientation, contact and spacing.',
        steps: [
          { do: 'Set the bipole-wave angle to 90°.', see: 'The wave reaches both electrodes simultaneously; the difference is near zero. Tissue is unchanged; the bipole went “blind”. Note the dip at 90° in the orientation curve.' },
          { do: 'Set angle 0° and spacing 10 mm.', see: 'Delay is 20 ms: the two unipolars appear separately and the bipolar widened and split.' },
          { do: 'Select “Deep source” and set spacing to 2 mm.', see: 'The deep potential near 345 ms is present in U1 and U2 but nearly canceled in the close bipole: it reaches both almost identically.' },
          { do: 'Set spacing to 10 mm.', see: 'The wide bipole preserved the deep potential (Fig. 7). Weak far-field rejection provided diagnostic information here.' }
        ],
        live: (s, m) => {
          const blind = s.angle >= 80 && s.angle <= 100;
          const deep = s.scenario === 'deep' && Number.isFinite(m.deepBi)
            ? ` Deep potential: ${f(m.deepUni)} mV in U1, ${f(m.deepBi)} mV bipolar (${Math.round(100 * m.deepBi / m.deepUni)}% kept).` : '';
          return `${blind ? `Bipole nearly perpendicular to the wave: ${f(m.bipolarPp)} mV, bipolar blindness.` : `Angle ${s.angle}°, spacing ${s.spacing} mm, delay ${f(m.lagMs, 1)} ms: bipolar ${f(m.bipolarPp)} mV.`}${deep}`;
        },
        quiz: [
          { q: 'After rotating the catheter, bipolar voltage fell at the same site. First thought?', options: ['New scar formed', 'The bipole may be perpendicular; check orientation and contact', 'Amplifier failure'], answer: 1, why: 'Tissue is the same; bipolar amplitude changes with recording geometry (bipolar blindness).' },
          { q: 'A deep potential is absent on a close bipole but present on a wide one. Why?', options: ['A wide bipole rejects far field less', 'The close bipole has a different filter', 'The potential arises only on the wide bipole'], answer: 0, why: 'A signal reaching close electrodes almost identically is removed by common-mode rejection; wide spacing preserves it (Fig. 7).' }
        ]
      },
      omni: {
        title: 'Omnipolar EGM: overcoming bipolar blindness', ref: '§6.1 · Figs. 9A–B',
        concept: 'Three unipolar electrodes in a right-angle triad (clique) give two perpendicular bipolar signals from one activation (Fig. 9A). Combining them as a vector yields a two-dimensional voltage loop; a virtual bipole (omnipole) can be computed at any angle without moving the catheter. The largest signal is aligned with the wave, and that angle gives propagation direction (Fig. 9B).',
        points: [
          'Assumption: one planar, homogeneous wave of constant velocity with adequate contact. Collision, fractionation or sharp curvature make direction and velocity unreliable.',
          'Omni amplitude is the maximum over all directions; conventional bipolar low-voltage cutoffs under-call scar and must be re-derived.',
          'The omnipole removes dependence on bipole orientation within the clique plane only. The recording whose morphology is truly direction-independent is the unipolar.'
        ],
        pearl: 'Do not call “no scar” on an omni voltage map with a bipolar cutoff; the threshold must be recalibrated for the method.',
        steps: [
          { do: 'The clique is rotated 70° to the wave. Compare Bx and By amplitudes.', see: 'The pair closer to perpendicular writes a small signal, the more parallel pair a large one: any single bipole is direction-dependent (Fig. 9A).' },
          { do: 'Sweep the virtual bipole angle to find the largest signal.', see: 'The virtual bipole reached omni amplitude. This angle is the propagation direction relative to the clique; the dashed line aligned with the loop’s long axis (Fig. 9B).' },
          { do: 'Change the clique angle by at least 30°.', see: 'Bx and By changed but omni amplitude stayed the same: orientation dependence within the clique plane is gone.' },
          { do: 'Select “Colliding waves”.', see: 'Two waves pass together: the loop is distorted. A single direction and velocity are invalid; do not interpret the arrow.' }
        ],
        live: (s, m) => !Number.isFinite(m.omniPp)
          ? 'Radial source at the center: no planar wave, omni unavailable (∅). Unipolar morphology (QS) is more informative here.'
          : s.scenario === 'collision'
            ? `Collision: omni ${f(m.omniPp)} mV, but its direction (${m.direction}°) does not represent a single wave.`
            : `Bx ${f(m.bxPp)} mV, By ${f(m.byPp)} mV; virtual bipole at ${s.virtualAngle}° gives ${f(m.virtualPp)} mV. Omni ${f(m.omniPp)} mV at ${m.direction}°.${Math.abs(m.virtualPp - m.omniPp) < 0.03 * m.omniPp ? ' The virtual bipole is at the maximal direction.' : ''}`,
        quiz: [
          { q: 'Omnipolar direction arrow in a collision zone?', options: ['Reliable', 'Unreliable: the single planar-wave assumption fails', 'Even more accurate'], answer: 1, why: 'The method assumes one planar wave of constant velocity (§6.1.1).' },
          { q: 'Using a conventional bipolar scar cutoff on an omni voltage map?', options: ['Correct, same measure', 'Wrong: omni is the maximum over directions, so scar is under-called', 'No difference'], answer: 1, why: 'Omni amplitude exceeds conventional bipolar; low-voltage cutoffs must be re-derived.' }
        ]
      },
      nearfield: {
        title: 'Separating the near field', ref: '§6.2 · Figs. 9C, 10 · Table 2',
        concept: 'In scar, small local potentials can be overwhelmed by far field. Spatial discrimination assumes far field has near-identical timing and shape across closely spaced unipolar electrodes; it estimates the shared component and subtracts it from the central unipolar. Tripolar (Laplacian) EGM: T = E2 − ½(E1 + E3) (Fig. 10B). The multipolar EGM weights neighbors by similarity before subtraction (Fig. 10A). Frequency discrimination instead assumes local signals are sharp and high frequency (Fig. 9C).',
        points: [
          'The result is a localized signal that keeps unipolar character.',
          'Limit: genuine local activation that reaches several electrodes near-simultaneously (from deeper layers, or slow signals in dense scar) is misclassified as far field and removed.',
          'High frequency is not functional relevance: in scar VT, peak frequency did not distinguish critical isthmus from bystander regions.',
          'Evidence is limited to swine proof-of-concept and small observational series; clinical benefit is unproven. The neighbor subtraction here is a plain mean, not the commercial PCA algorithm.'
        ],
        pearl: 'Always review the processed near-field signal together with the raw unipolars.',
        steps: [
          { do: 'Find the slow far-field wave near 335 ms in U1; what happened to it in the tripolar and neighbor subtraction?', see: 'Far field was identical at all electrodes and canceled; the local deflection remained.' },
          { do: 'Select “Shared local activation”.', see: 'The local signal reaches all neighbors at once: the processed recordings are flat. Genuine local activation was removed as if it were far field.' },
          { do: 'Select “Sharp conduction potential” and look at the time-frequency map.', see: 'The sharp component produces power in the upper bands. That suggests it is local, but it is not evidence of a critical isthmus.' }
        ],
        live: (s, m) => s.scenario === 'shared-local'
          ? `U1 has ${f(m.u1Pp)} mV of genuine local signal; tripolar ${f(m.tripolarPp, 3)} mV, neighbor subtraction ${f(m.multipolarPp, 3)} mV. The genuine signal was removed.`
          : `U1 contains ${f(m.farU1)} mV far field. Tripolar ${f(m.tripolarPp)} mV and neighbor subtraction ${f(m.multipolarPp)} mV show only the local component.`,
        quiz: [
          { q: 'What happens to genuine local activation reaching neighbors simultaneously?', options: ['It is always kept', 'It may be removed as a shared component', 'It looks larger'], answer: 1, why: 'A shared signal is not always far field (§6.2.2).' },
          { q: 'Is the site with the highest peak frequency the critical VT isthmus?', options: ['Yes, certainly', 'No; high frequency alone does not show functional relevance', 'Only on bipolar'], answer: 1, why: 'In scar VT, peak frequency did not separate critical isthmus from bystander sites (§6.2.4).' }
        ]
      }
    }
  }
};

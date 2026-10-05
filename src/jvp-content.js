/*
 * Text of the jugular venous pulse module, Turkish and English
 * (research/VENOZ_BASINC_FIZIK_MUAYENE_MODUL_RAPORU.md). Mechanisms are
 * teaching summaries; a pattern here is never a diagnosis.
 */

export const JVP_SOURCES = Object.freeze([
  'Ranganathan N, Sivaciyan V. CJC Open 2023; doi:10.1016/j.cjco.2022.11.016',
  'Stanford Medicine 25: Neck vein examination and wave forms',
  'Clinical Methods, 3rd ed.: The jugular venous pressure and pulse contour (NCBI NBK300)',
  'Merck Manual Professional: Tricuspid regurgitation; Tricuspid stenosis; Cardiovascular examination',
  'StatPearls: Cardiac tamponade (NCBI NBK431090)',
  'How far is the sternal angle from the mid-right atrium? (PMC1495124)'
]);

export const JVP_TEXT = Object.freeze({
  tr: {
    tab: 'Venöz basınç (JVP)', auscultation: 'Oskültasyon', maneuvers: 'Manevralar',
    heading: 'JUGULER VENÖZ NABIZ · ŞEMATİK SAĞ ATRİYUM BASINCI',
    scenario: 'Örüntü', compare: 'Normalle karşılaştır', labels: 'Dalga etiketleri', slow: 'Yavaş oynat',
    freeze: 'Dondur', play: 'Oynat', exp: 'Ekspiryum', insp: 'İnspiryum', respiration: 'Spontan solunum',
    axis: 'Şematik RA basıncı, mmHg', ecg: 'EKG (şematik)', tvOpen: 'triküspit açık', normalRef: 'normal (kesikli)',
    mean: 'Ortalama', bedside: 'Yatak başı', sternal: 'sternal açının üstünde',
    belowSternal: 'sternal açının altında (oturur pozisyonda görünmeyebilir)',
    bedsideNote: 'Sternal açı ile sağ atriyum arası 5 cm varsayımıyla yaklaşık dikey yükseklik (cm); bu mesafe vücut yapısı ve pozisyonla değişir. Boyundaki cm, mmHg ile aynı büyüklük değildir.',
    synthetic: 'Genlikler seçilmiş öğretim değerleridir.',
    waveCard: 'Dalga', pickWave: 'Bir dalga seçin: imleç o faza gider.',
    questions: 'Düşünme soruları',
    kussmaulNote: 'Bu örüntüde inspiryumda basınç düşmüyor, yükseliyor (Kussmaul).',
    respNormalNote: 'Spontan inspiryumda negatif göğüs içi basınçla venöz basınç düşer; sağ kalbe dönüş artar.',
    tamponadeRespNote: 'Tamponadda bu şema otomatik Kussmaul vermez: dolgun boyun venleri Kussmaul ile aynı şey değildir.',
    view: 'Görünüm', restart: 'Baştan başlat', exportCsv: 'CSV indir', seconds: 's',
    views: {
      beat: 'Tek atım (kalp döngüsü)', af: 'Ritim şeridi: atriyal fibrilasyon', avd: 'Ritim şeridi: AV dissosiyasyonu (cannon a)',
      ajr: 'Abdominojuguler test', ppv: 'Pozitif basınçlı ventilasyon'
    },
    strip: {
      heartNote: 'Şerit kendi saniye saatinde oynar; 3B kalp bu saatin ventrikül fazını izler. EKG, basınç, kapak bandı ve imleç aynı olay listesinden okunur.',
      af: { text: 'Düzensiz ventrikül yanıtı: RR aralıkları sabit bir tohumdan üretilir (aynı tohum, aynı dizi). Organize atriyal kasılma yok: a dalgası ve x inişi yok; EKG\'de P yerine fibrilasyon dalgaları. RR sınırları uzman onayı bekleyen öğretim değerleridir.', readout: (s, cur) => `RR ${Math.min(...s.clock.rrs).toFixed(2)}–${Math.max(...s.clock.rrs).toFixed(2)} s (tohum ${s.seed}) · bu atım RR ${cur.toFixed(2)} s` },
      avd: { text: 'Tam AV blok: atriyum ve ventrikül ayrı saatlerle kasılır. Atriyal kasılma triküspit açıkken gelirse sıradan a dalgası, kapalı kapağa (ventrikül sistolü) denk gelirse cannon a oluşur; bu yüzden cannon a aralıklıdır. Atriyal hızı değiştirince çakışma örüntüsü de değişir. Triküspit darlığındaki büyük a açık kapağa karşıdır, mekanizma farklıdır. 3B kalpte atriyumlar atriyal saati, ventriküller ventrikül saatini izler; P ile atriyal kasılma arasındaki gecikme şematiktir (şablon aralığı, yaklaşık 0,1 s).', readout: s => `Ventrikül ${s.ventricularRate}/dk · atriyum ${s.atrialRate.toFixed(0)}/dk · cannon a: ${s.atrial.filter(e => e.kind === 'cannon').length}/${s.atrial.length} atriyal kasılma`, atrialRate: 'Atriyal hız', cannon: 'cannon' },
      ajr: {
        text: 'Protokol (öğretim sürümü ajr-teaching-v1; Wiese 2000 derlemesine dayanır): 5 s başlangıç, göbek çevresine 10 s sabit bası (20–35 mmHg aralığında, burada 25), sonra bırakma. Pozitif sayılması için yükselişin basının son 5 saniyesi boyunca ≥ 4 cm sürmesi ve bırakınca ≥ 4 cm düşmesi gerekir. Her yükseliş pozitif değildir: normalde ilk saniyelerde geçici yükseliş olur ve bası sürerken geriler. Protokoller kaynaklar arasında farklıdır; eşikler uzman onayı bekliyor.',
        response: 'Yanıt', responses: { transient: 'Normal (geçici yükseliş)', sustained: 'Yüksek dolum basınçları (süren yükseliş)' },
        stages: { baseline: 'Başlangıç ölçümü', compression: 'Karın basısı', release: 'Bırakıldı', done: 'Değerlendirme' },
        band: 'karın basısı', extra: 'Karın basısı (mmHg)', threshold: 'başlangıç + 4 cm',
        positive: 'Protokole göre pozitif: yükseliş sürdü ve bırakınca düştü.', negative: 'Protokole göre negatif.', transientOnly: 'Başta eşiği geçen geçici yükseliş vardı ama bası sürerken kayboldu.',
        numbers: r => `tepe +${r.peakRiseCm.toFixed(1)} cm · son 5 s en az +${r.sustainedMinCm.toFixed(1)} cm · bırakınca düşüş ${r.fallCm.toFixed(1)} cm`,
        waiting: 'Değerlendirme bırakmadan 3 s sonra gösterilir.'
      },
      ppv: {
        text: 'Ayrı mod: spontan solunum kuralları buraya taşınmaz. Ventilatör inspiryumunda hava yolu ve plevra basıncı artar; atmosfere göre ölçülen sağ atriyum basıncı yükselir (spontan inspiryumun tersi). PEEP ekspiryum sonu düzeyini de yükseltir. Değer ekspiryum sonunda okunur. Varsayımlar: 12 soluk/dk, I:E 1:2, plato 20 cmH2O, hava yolu basıncının %35\'i plevraya iletilir (akciğer ve göğüs duvarı uyumuna bağlı; uzman onayı bekliyor). Yalnız normal örüntüyle gösterilir.',
        peep: 'PEEP', band: 'inspiryum', extra: 'Hava yolu basıncı (cmH2O)',
        readout: (s, breath) => `Ekspiryum sonu (okuma noktası): ${s.endExpiratory().toFixed(1)} mmHg · PEEP ${s.settings.peep} cmH2O · şu an: ${breath === 'insp' ? 'inspiryum' : 'ekspiryum'}`
      }
    },
    paramTitle: 'Parametre kaydı',
    paramStatus: { 'synthetic-teaching': 'öğretim değeri', 'synthetic-expert-review-pending': 'uzman onayı bekliyor' },
    waves: {
      a: { name: 'a dalgası', text: 'Sağ atriyum kasılmasıyla basınç yükselir. P dalgasından sonra, ventrikül sistolünden önce gelir. Atriyal fibrilasyonda organize a dalgası kaybolur.' },
      x: { name: 'x inişi', text: 'Atriyal gevşemeyle basınç düşer (a dalgasından hemen sonra). Bazı kaynaklar x ve x′ inişlerini tek “x” olarak adlandırır.' },
      c: { name: 'c dalgası', text: 'Erken ventrikül sistolünde kapanan triküspit kapak atriyuma doğru kabarır; boyun kaydında karotis iletimi de katkı verebilir. QRS/S1 çevresindedir; boyunda her zaman seçilemez.' },
      xp: { name: 'x′ inişi', text: 'Ventrikül sistolünde triküspit anulusu apekse doğru iner, atriyumun hacmi büyür ve basınç düşer. Basınç düşerken sağ atriyuma venöz akım artabilir: basınç ve akım ayrı büyüklüklerdir.' },
      v: { name: 'v dalgası', text: 'Triküspit kapalıyken venöz dönüşle dolan atriyumda basınç yükselir; kapak açılmadan hemen önce tepe yapar.' },
      y: { name: 'y inişi', text: 'Triküspit açılınca atriyum ventriküle boşalır ve basınç düşer (erken diyastol). Hızlı ve derin y erken doluşun serbest olduğunu, baskılanmış y erken doluşun kısıtlandığını düşündürür.' },
      cv: { name: 'c-v dalgası', text: 'Triküspit yetersizliğinde sistolde ventrikülden atriyuma geri akım olur; c ve v birleşir, sistolik x′ inişi kaybolur.' },
      cannon: { name: 'cannon a', text: 'Atriyum kapalı triküspit kapağa karşı kasılır (AV zamanlama bozukluğu, örneğin AV dissosiyasyon): büyük, ani basınç yükselişi. Triküspit darlığındaki büyük a dalgasıyla aynı mekanizma değildir; tam AV blokta aralıklı görülür.' }
    },
    scenarios: {
      normal: { title: 'Normal sinüs ritmi', text: 'Organize a, c ve v dalgaları; x/x′ ve y inişleri. Diğer örüntüler bununla karşılaştırılır.' },
      af: { title: 'Atriyal fibrilasyon', text: 'Organize atriyal kasılma olmadığından a dalgası ve x inişi kaybolur. Tek atım görünümü yalnız dalga biçimini gösterir; düzensiz RR için ritim şeridini açın.' },
      tr: { title: 'Triküspit yetersizliği', text: 'Sistolde geri akımla belirgin, birleşik c-v dalgası; sistolik x′ inişi kaybolur; ardından hızlı ve derin y. Belirgin TR örüntüsüdür; hafif TR boyunda böyle görünmeyebilir.' },
      ts: { title: 'Triküspit darlığı (sinüs ritmi)', text: 'Daralmış kapaktan boşalmaya direnç: büyük a dalgası ve yavaş, sığ y inişi. Atriyal fibrilasyon eşlik ederse büyük organize a beklenmez.' },
      constriction: { title: 'Konstriktif perikardit', text: 'Yüksek basınç; erken doluş hızlıdır, sonra perikard doluşu aniden durdurur: derin ve hızlı y, x′ korunur (M ya da W biçimi). Kussmaul bulgusu eşlik edebilir; zorunlu değildir. Ortalama basınç kateterizasyon modülündeki konstriksiyon senaryosuyla aynıdır.' },
      tamponade: { title: 'Kardiyak tamponad', text: 'Yüksek basınç; erken diyastolik doluş kısıtlandığından y inişi baskılanır veya kaybolur, sistolik x′ korunur ve belirgindir. Saf tamponadda Kussmaul beklenmez. Ortalama basınç kateterizasyon modülündeki tamponad senaryosuyla aynıdır.' },
      cannon: { title: 'Cannon a (ileri)', text: 'Tek bir atımda atriyal kasılma ventrikül sistolüne denk gelir; kapalı triküspide karşı büyük dalga oluşur. AV dissosiyasyonda aralıklıdır, her atımda görülmez; ayrı atriyal saat için AV dissosiyasyonu şeridini açın.' }
    },
    questions_list: [
      'Triküspit açıldığı halde y inişi neden belirgin değil?',
      'Büyük a ile cannon a arasındaki mekanizma farkı ne?',
      'Basınç düşerken venöz akım artabilir mi?',
      'Normal inspiryumda JVP azalırken sağ kalbe dönüş nasıl artıyor?',
      'Aynı ortalama basınçta iki farklı dalga biçimi ne anlatır?'
    ]
  },
  en: {
    tab: 'Venous pressure (JVP)', auscultation: 'Auscultation', maneuvers: 'Maneuvers',
    heading: 'JUGULAR VENOUS PULSE · SCHEMATIC RIGHT ATRIAL PRESSURE',
    scenario: 'Pattern', compare: 'Compare with normal', labels: 'Wave labels', slow: 'Slow motion',
    freeze: 'Freeze', play: 'Play', exp: 'Expiration', insp: 'Inspiration', respiration: 'Spontaneous breathing',
    axis: 'Schematic RA pressure, mmHg', ecg: 'ECG (schematic)', tvOpen: 'tricuspid open', normalRef: 'normal (dashed)',
    mean: 'Mean', bedside: 'Bedside', sternal: 'above the sternal angle',
    belowSternal: 'below the sternal angle (may not be visible sitting up)',
    bedsideNote: 'Approximate vertical height (cm) assuming 5 cm from the sternal angle to the right atrium; that distance varies with body build and position. Centimetres at the neck are not the same quantity as mmHg.',
    synthetic: 'Amplitudes are chosen teaching values.',
    waveCard: 'Wave', pickWave: 'Pick a wave: the cursor moves to its phase.',
    questions: 'Questions to think about',
    kussmaulNote: 'In this pattern the pressure does not fall on inspiration; it rises (Kussmaul).',
    respNormalNote: 'On spontaneous inspiration the negative intrathoracic pressure lowers the venous pressure while return to the right heart increases.',
    tamponadeRespNote: 'This schematic gives tamponade no automatic Kussmaul response: full neck veins are not the same as Kussmaul.',
    view: 'View', restart: 'Restart', exportCsv: 'Download CSV', seconds: 's',
    views: {
      beat: 'Single beat (cardiac cycle)', af: 'Rhythm strip: atrial fibrillation', avd: 'Rhythm strip: AV dissociation (cannon a)',
      ajr: 'Abdominojugular test', ppv: 'Positive pressure ventilation'
    },
    strip: {
      heartNote: 'The strip runs on its own clock in seconds; the 3D heart follows its ventricular phase. ECG, pressure, valve band and cursor are read from the same event list.',
      af: { text: 'Irregular ventricular response: RR intervals come from a fixed seed (same seed, same sequence). No organised atrial contraction: no a wave and no x descent; fibrillatory waves instead of P waves on the ECG. The RR limits are teaching values awaiting expert review.', readout: (s, cur) => `RR ${Math.min(...s.clock.rrs).toFixed(2)}–${Math.max(...s.clock.rrs).toFixed(2)} s (seed ${s.seed}) · this beat RR ${cur.toFixed(2)} s` },
      avd: { text: 'Complete AV block: atria and ventricles contract on separate clocks. An atrial contraction with the tricuspid valve open gives an ordinary a wave; one that meets the closed valve (ventricular systole) gives a cannon a, so cannon waves are intermittent. Changing the atrial rate changes the pattern. The large a of tricuspid stenosis is against an open valve: a different mechanism. In the 3D heart the atria follow the atrial clock and the ventricles the ventricular clock; the P to atrial contraction delay is schematic (the template interval, about 0.1 s).', readout: s => `Ventricles ${s.ventricularRate}/min · atria ${s.atrialRate.toFixed(0)}/min · cannon a: ${s.atrial.filter(e => e.kind === 'cannon').length}/${s.atrial.length} atrial contractions`, atrialRate: 'Atrial rate', cannon: 'cannon' },
      ajr: {
        text: 'Protocol (teaching version ajr-teaching-v1, based on the Wiese 2000 review): 5 s baseline, 10 s of firm periumbilical pressure (20–35 mmHg range, 25 here), then release. Positive requires a rise ≥ 4 cm held through the last 5 s of compression and a fall ≥ 4 cm on release. Not every rise is positive: normally a transient rise in the first seconds fades while pressure continues. Protocols differ between sources; thresholds await expert review.',
        response: 'Response', responses: { transient: 'Normal (transient rise)', sustained: 'Elevated filling pressures (sustained rise)' },
        stages: { baseline: 'Baseline', compression: 'Abdominal compression', release: 'Released', done: 'Judgement' },
        band: 'abdominal compression', extra: 'Abdominal pressure (mmHg)', threshold: 'baseline + 4 cm',
        positive: 'Positive by the protocol: the rise held and fell on release.', negative: 'Negative by the protocol.', transientOnly: 'An early transient rise crossed the threshold but faded while compression continued.',
        numbers: r => `peak +${r.peakRiseCm.toFixed(1)} cm · last 5 s at least +${r.sustainedMinCm.toFixed(1)} cm · fall on release ${r.fallCm.toFixed(1)} cm`,
        waiting: 'The judgement appears 3 s after release.'
      },
      ppv: {
        text: 'Separate mode: spontaneous breathing rules are not carried over. In ventilator inspiration airway and pleural pressures rise; right atrial pressure measured against atmosphere rises (the opposite of spontaneous inspiration). PEEP also raises the end-expiratory level. Read the value at end expiration. Assumptions: 12 breaths/min, I:E 1:2, plateau 20 cmH2O, 35% of airway pressure reaches the pleura (depends on lung and chest wall compliance; awaiting expert review). Shown with the normal pattern only.',
        peep: 'PEEP', band: 'inspiration', extra: 'Airway pressure (cmH2O)',
        readout: (s, breath) => `End expiration (reading point): ${s.endExpiratory().toFixed(1)} mmHg · PEEP ${s.settings.peep} cmH2O · now: ${breath === 'insp' ? 'inspiration' : 'expiration'}`
      }
    },
    paramTitle: 'Parameter record',
    paramStatus: { 'synthetic-teaching': 'teaching value', 'synthetic-expert-review-pending': 'awaiting expert review' },
    waves: {
      a: { name: 'a wave', text: 'Right atrial contraction raises the pressure. It follows the P wave and precedes ventricular systole. In atrial fibrillation the organised a wave is lost.' },
      x: { name: 'x descent', text: 'Atrial relaxation lowers the pressure, just after the a wave. Some sources call the x and x′ descents a single “x”.' },
      c: { name: 'c wave', text: 'In early ventricular systole the closing tricuspid valve bulges toward the atrium; carotid transmission may add to it in neck recordings. Around QRS/S1; not always visible at the neck.' },
      xp: { name: 'x′ descent', text: 'In ventricular systole the tricuspid annulus moves toward the apex, the atrium enlarges and its pressure falls. Venous flow into the atrium can rise while pressure falls: pressure and flow are different quantities.' },
      v: { name: 'v wave', text: 'With the tricuspid valve closed, venous return fills the atrium and its pressure rises, peaking just before the valve opens.' },
      y: { name: 'y descent', text: 'When the tricuspid valve opens the atrium empties into the ventricle and its pressure falls (early diastole). A rapid, deep y suggests unimpeded early filling; a blunted y suggests restricted early filling.' },
      cv: { name: 'c-v wave', text: 'In tricuspid regurgitation blood flows back into the atrium during systole: c and v merge and the systolic x′ descent is lost.' },
      cannon: { name: 'cannon a', text: 'The atrium contracts against a closed tricuspid valve (AV timing disorder, for example AV dissociation): a large, abrupt rise. Not the same mechanism as the large a of tricuspid stenosis; intermittent in complete heart block.' }
    },
    scenarios: {
      normal: { title: 'Normal sinus rhythm', text: 'Organised a, c and v waves; x/x′ and y descents. The other patterns are compared with this.' },
      af: { title: 'Atrial fibrillation', text: 'Without organised atrial contraction the a wave and the x descent are lost. The single-beat view shows the waveform only; open the rhythm strip for the irregular RR.' },
      tr: { title: 'Tricuspid regurgitation', text: 'Systolic backflow gives a prominent, merged c-v wave; the systolic x′ descent is lost; then a rapid, deep y. This is the marked TR pattern; mild TR may not look like this at the neck.' },
      ts: { title: 'Tricuspid stenosis (sinus rhythm)', text: 'Resistance to emptying through the narrowed valve: a large a wave and a slow, shallow y descent. With atrial fibrillation a large organised a is not expected.' },
      constriction: { title: 'Constrictive pericarditis', text: 'High pressure; early filling is rapid, then the pericardium stops it abruptly: a deep, rapid y with a preserved x′ (M or W shape). Kussmaul’s sign may accompany it; it is not obligatory. The mean pressure matches the constriction scenario of the catheterization module.' },
      tamponade: { title: 'Cardiac tamponade', text: 'High pressure; early diastolic filling is restricted, so the y descent is blunted or absent while the systolic x′ is preserved and prominent. Kussmaul’s sign is not expected in pure tamponade. The mean pressure matches the tamponade scenario of the catheterization module.' },
      cannon: { title: 'Cannon a (advanced)', text: 'In one beat atrial contraction falls into ventricular systole; a large wave forms against the closed tricuspid valve. In AV dissociation it is intermittent, not every beat; open the AV dissociation strip for separate atrial timing.' }
    },
    questions_list: [
      'Why is the y descent not prominent although the tricuspid valve opens?',
      'What is the difference in mechanism between a large a and a cannon a?',
      'Can venous flow increase while the pressure falls?',
      'How does return to the right heart rise while the JVP falls on normal inspiration?',
      'What do two different waveforms with the same mean pressure tell you?'
    ]
  }
});

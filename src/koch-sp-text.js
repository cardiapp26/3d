// Texts of the slow pathway mapping panel (koch-sp-panel.js). {r} = A:V ratio.
export const KOCH_SP_TEXT = Object.freeze({
  tr: {
    title: 'Yavaş yol haritalama',
    kicker: 'KOCH ÜÇGENİ · SİNÜS RİTMİ',
    intro: 'Şemaya tıklayın, ucu sürükleyin ya da ok tuşlarını kullanın. 3B kateter, floroskopi ve ablasyon sinyali birlikte değişir.',
    schematic: 'Koch üçgeni şeması (RAO bakış); kateter ucunu yerleştirmek için tıklayın',
    tipLabel: 'Ablasyon kateteri ucu',
    labels: { todaro: 'Todaro tendonu', annulus: 'Triküspit anulus', cs: 'CS', avn: 'AVN', his: 'His', fo: 'FO', ivc: 'IVC', fast: 'Hızlı yol', slow: 'Yavaş yol', tcv: 'TV' },
    legend: [['slow', 'Yavaş yol (hedef)'], ['fast', 'Hızlı yol girişi'], ['avn', 'Kompakt AVN'], ['his', 'His']],
    egm: 'Ablasyon kateteri kaydı',
    egmAria: 'Sentetik intrakardiyak kayıt: II, HRA, His, CS 9-10, CS 1-2, ablasyon distal ve proksimal',
    ratio: 'A:V (ABL d)',
    hisPotential: 'His potansiyeli',
    slowPotential: 'Yavaş yol potansiyeli',
    present: 'var',
    absent: 'yok',
    height: 'Yükseklik',
    heightValue: ['taban', 'alt', 'orta', 'üst', 'apeks'],
    zones: {
      target: 'Uygun bölge',
      atrial: 'Fazla atriyal',
      ventricular: 'Fazla ventriküler',
      cs: 'CS ağzı',
      mid: 'Orta septum',
      fast: 'Hızlı yol',
      his: 'His / AV düğüm'
    },
    advice: {
      target: 'Küçük, parçalı A ve büyük V (A:V {r}), His potansiyeli yok. Yavaş yol ablasyonu burada, tabandan başlar.',
      atrial: 'A büyük (A:V {r}): uç atriyal tarafta, Todaro ya da CS ağzına yakın. Ucu triküspit anulusa doğru ilerletin.',
      ventricular: 'A neredeyse yok (A:V {r}): uç anulusu geçmiş, ventrikül tarafında. Ucu biraz atriyuma geri çekin.',
      cs: 'Uç CS ağzında: A büyük, kateter sinüse kayabilir. Biraz öne, anulusa doğru gelin.',
      mid: 'Orta septum: AV düğüme yaklaşılıyor, AV blok riski artar. Önce tabandan deneyin; gerekirse kademeli yükselin.',
      fast: 'Hızlı yol girişi (Todaro üstü, fossa tarafı): RF burada hızlı yolu ve AV iletimini bozabilir. Kaçının.',
      his: 'His potansiyeli kayıtta: kompakt AV düğüm ve His bölgesi. RF tam AV blok yapabilir. Kaçının.'
    },
    target: 'Hedefe git',
    views: 'Floroskopide göster',
    rao: 'RAO 30 floro',
    lao: 'LAO 45 floro',
    view3d: '3B görünüm',
    viewHint: 'RAO kateterin yüksekliğini (His ile CS arası), LAO septal mi lateral mi durduğunu gösterir.',
    func: {
      title: 'Fonksiyonel haritalar (Sakamoto 2026)',
      hint: 'Bir katman seçin; (a) – (e) noktalarına tıklayın, ucu oraya götürür.',
      layers: { zones: 'Bölgeler', pf: 'Tepe frekansı', vectors: 'Aktivasyon vektörü', speed: 'Dalga hızı', landmarks: 'Kayıt noktaları a–e' },
      scale: ['düşük', 'yüksek'],
      takeaway: {
        zones: 'Ablasyon kararı için temel görünüm: yeşil yavaş yol hedefi, mavi hızlı yol girişi, kırmızı His ve kompakt AV düğüm.',
        pf: 'Neye bakıyoruz: tepe frekansı arka septumda, c noktası çevresinde en yüksek; başarılı ablasyon yerleri burada toplandı. Parçalı (fraksiyone) sinyallerin frekansı daha düşüktür.',
        vectors: 'Neye bakıyoruz: sinüs ritminde vektörler c noktasında birleşir (yavaş yol girişi). Üstte His\'e doğru çıkar, e çevresinde aşağı iner (bystander). Elmas: pivot noktası.',
        speed: 'Neye bakıyoruz: dalga hızı yavaş yol girişinde (c) en yüksek, buradan uzaklaştıkça azalır.',
        landmarks: 'a–e noktalarına tıklayın: uç oraya gider; sinyal, okuma ve nokta açıklaması değişir.'
      },
      read: { pf: 'Tepe frekansı (göreli)', speed: 'Dalga hızı (göreli)', vector: 'Vektör' },
      vectorKinds: { convergence: 'yakınsama noktası', converging: 'girişe yakınsıyor', ascending: 'yukarı (His yönü)', descending: 'aşağı', bystander: 'aşağı, bystander atriyal' },
      pivot: 'Pivot noktası: sinüs ritminde hastaların %60\'ında, başarılı ablasyon yerinden yaklaşık 10 mm uzakta; RIE\'nin derinliğine ve seyrine bağlı.',
      points: {
        a: ['a · His potansiyeli', 'Kompakt AV düğüm ve His bölgesi.'],
        b: ['b · Azalmış His potansiyeli', 'Düğüm–His geçiş bölgesi. RIE bu düzeyin altında kabul edilir.'],
        c: ['c · Giriş: yüksek tepe frekansı', 'Vektörler burada birleşir, dalga hızı en yüksek. Jackman potansiyelleri hep burada görüldü; başarılı ablasyon yeri.'],
        d: ['d · Düşük voltajlı köprünün dışı', 'Aynı yükseklik ama daha keskin elektrogram; RIE girişi değil.'],
        e: ['e · Bystander atriyal aktivasyon', 'Keskin atriyal potansiyel ve aşağı inen vektör. Pivot noktası olmayan olgularda daha sık.']
      },
      note: 'Sakamoto ve ark. (15 hasta, tipik slow-fast AVNRT, EnSite X): yüksek tepe frekanslı bölgeler arka septumdaydı ve başarılı yavaş yol ablasyon yerlerine denk geldi; parçalı (fraksiyone) elektrogramlarda tepe frekansı daha düşüktü. Katmanlar öğretim için sadeleştirilmiştir, hasta verisi değildir.',
      source: 'Sakamoto Y ve ark. Heart Rhythm O2 2026;7:1398-1399, doi:10.1016/j.hroo.2026.03.030.'
    },
    note: 'Öğretim modeli: sinyaller konuma göre kurgulanmıştır, hasta kaydı değildir. Tek başına konum kuralı değildir; gerçek ablasyonda floroskopi, sinyaller ve RF sırasında kavşak ritmi birlikte değerlendirilir.',
    source: 'Kaynak: Kardiyopedi AVNRT ablasyonu dersi; Jackman ve ark. N Engl J Med 1992; Haïssaguerre ve ark. Circulation 1992; Koch üçgeni şeması Mayo 2009 çiziminden uyarlanarak yeniden çizildi.'
  },
  en: {
    title: 'Slow pathway mapping',
    kicker: 'TRIANGLE OF KOCH · SINUS RHYTHM',
    intro: 'Click the schematic, drag the tip or use the arrow keys. The 3D catheter, fluoroscopy and the ablation signal change together.',
    schematic: 'Triangle of Koch schematic (RAO view); click to place the catheter tip',
    tipLabel: 'Ablation catheter tip',
    labels: { todaro: 'Tendon of Todaro', annulus: 'Tricuspid annulus', cs: 'CS', avn: 'AVN', his: 'His', fo: 'FO', ivc: 'IVC', fast: 'Fast pathway', slow: 'Slow pathway', tcv: 'TV' },
    legend: [['slow', 'Slow pathway (target)'], ['fast', 'Fast pathway input'], ['avn', 'Compact AVN'], ['his', 'His']],
    egm: 'Ablation catheter recording',
    egmAria: 'Synthetic intracardiac recording: II, HRA, His, CS 9-10, CS 1-2, ablation distal and proximal',
    ratio: 'A:V (ABL d)',
    hisPotential: 'His potential',
    slowPotential: 'Slow pathway potential',
    present: 'present',
    absent: 'absent',
    height: 'Height',
    heightValue: ['base', 'low', 'mid', 'high', 'apex'],
    zones: {
      target: 'Suitable site',
      atrial: 'Too atrial',
      ventricular: 'Too ventricular',
      cs: 'CS ostium',
      mid: 'Midseptum',
      fast: 'Fast pathway',
      his: 'His / AV node'
    },
    advice: {
      target: 'Small, fractionated A and a large V (A:V {r}), no His potential. Slow pathway ablation starts here, at the base.',
      atrial: 'Large A (A:V {r}): the tip is on the atrial side, near Todaro or the CS ostium. Advance it toward the tricuspid annulus.',
      ventricular: 'Almost no A (A:V {r}): the tip is past the annulus, on the ventricular side. Pull it back slightly toward the atrium.',
      cs: 'The tip is at the CS ostium: large A, and the catheter may slip into the sinus. Move a little forward, toward the annulus.',
      mid: 'Midseptum: approaching the AV node, the risk of AV block rises. Start at the base; move up step by step only if needed.',
      fast: 'Fast pathway input (above Todaro, on the fossa side): RF here can damage the fast pathway and AV conduction. Avoid.',
      his: 'A His potential is recorded: compact AV node and His region. RF can cause complete AV block. Avoid.'
    },
    target: 'Go to target',
    views: 'Show on fluoroscopy',
    rao: 'RAO 30 fluoro',
    lao: 'LAO 45 fluoro',
    view3d: '3D view',
    viewHint: 'RAO shows the height of the catheter (between His and CS), LAO whether it sits septal or lateral.',
    func: {
      title: 'Functional maps (Sakamoto 2026)',
      hint: 'Pick a layer; click points (a) to (e) to move the tip there.',
      layers: { zones: 'Zones', pf: 'Peak frequency', vectors: 'Activation vectors', speed: 'Wave speed', landmarks: 'Recording points a-e' },
      scale: ['low', 'high'],
      takeaway: {
        zones: 'The basic view for the ablation decision: green slow pathway target, blue fast pathway input, red His and compact AV node.',
        pf: 'What to look for: peak frequency is highest in the posterior septum around point c, where the successful ablation sites were. Fractionated signals have a lower frequency.',
        vectors: 'What to look for: in sinus rhythm the vectors converge at point c (the slow pathway entrance); above it they rise toward the His, around e they descend (bystander). Diamond: pivot point.',
        speed: 'What to look for: wave speed is highest at the slow pathway entrance (c) and falls with distance from it.',
        landmarks: 'Click points a to e: the tip moves there and the signal, reading and point note change.'
      },
      read: { pf: 'Peak frequency (relative)', speed: 'Wave speed (relative)', vector: 'Vector' },
      vectorKinds: { convergence: 'convergence point', converging: 'converging on the entrance', ascending: 'ascending (toward the His)', descending: 'descending', bystander: 'descending, bystander atrial' },
      pivot: 'Pivot point: seen in sinus rhythm in 60 % of patients, about 10 mm from the successful ablation site; it depends on the depth and course of the RIE.',
      points: {
        a: ['a · His bundle potential', 'Compact AV node and His region.'],
        b: ['b · Reduced His potential', 'The nodal-His transition zone. The RIE is presumed to lie below this level.'],
        c: ['c · Entrance: high peak frequency', 'Vectors converge here and wave speed is highest. Jackman potentials were seen here in every case; the successful ablation site.'],
        d: ['d · Outside the low-voltage bridge', 'The same height but a sharper electrogram; not the RIE entrance.'],
        e: ['e · Bystander atrial activation', 'Sharp atrial potentials and a descending vector. More frequent in cases without a pivot point.']
      },
      note: 'Sakamoto et al. (15 patients, typical slow-fast AVNRT, EnSite X): high peak frequency regions lay in the posterior septum and matched successful slow pathway ablation sites; fractionated electrograms had lower peak frequency. The layers are simplified for teaching and are not patient data.',
      source: 'Sakamoto Y et al. Heart Rhythm O2 2026;7:1398-1399, doi:10.1016/j.hroo.2026.03.030.'
    },
    note: 'Teaching model: signals are constructed from the position, not a patient recording. Not a localization rule on its own; real ablation weighs fluoroscopy, signals and junctional rhythm during RF together.',
    source: 'Source: Kardiyopedi AVNRT ablation lecture; Jackman et al. N Engl J Med 1992; Haïssaguerre et al. Circulation 1992; the Koch triangle schematic is redrawn after the Mayo 2009 illustration.'
  }
});

// Original schematic of the LEFT arm. Facing the patient, ulnar and medial
// lie toward image left. Radial and lateral lie toward image right.
// The chest-wall branch is the LIMA. Radial loop and high bifurcation are
// variant mode only. Distal radial access is in both modes.

const line = (kind, pts, w) => ({ type: 'line', kind, pts, w });
const circ = (kind, cx, cy, r) => ({ type: 'circle', kind, cx, cy, r });
const ell = (kind, cx, cy, rx, ry) => ({ type: 'ellipse', kind, cx, cy, rx, ry });
const both = (shapes) => ({ typical: shapes, variant: shapes });

const S = (spec) => spec;

const TYPICAL_RADIAL = [[408, 650], [470, 780], [510, 880], [528, 960], [536, 1040]];
const VARIANT_RADIAL = [[424, 520], [450, 540], [660, 620], [480, 720], [680, 560], [600, 800], [540, 900], [528, 960], [536, 1040]];

export const ARM = [
  S({
    id: 'subclavian',
    view: 'arm',
    modes: ['typical', 'variant'],
    kind: 'trunk',
    name: { tr: 'Subklavyan arter', en: 'Subclavian artery' },
    text: {
      tr: 'Bu çizim sol koldur. Sol subklavyan arter arkın solundan çıkar. Sağ subklavyan arter brakiosefalik kökten gelir. Birinci kısmın dalları vertebral, internal torasik, tiroservikal ve kostoservikal trunkustur. Aksiller arter birinci kaburganın dış kenarında başlar.',
      en: 'This drawing is the left arm. The left subclavian artery leaves the left side of the arch. The right subclavian artery comes from the brachiocephalic trunk. Branches of the first part are the vertebral artery, the internal thoracic artery, the thyrocervical trunk, and the costocervical trunk. The axillary artery begins at the lateral border of the first rib.'
    },
    pearl: {
      tr: 'Sağ subklavyanın distal dalları soldakiyle aynıdır. İkinci bir kol çizilmez. Femoral yoldan sol subklavyan angajmanı ark tipine bağlıdır. Tip III femoralden zorlaşır. Bu şema üç ark tipini çizmez. Ayrıntı görünüm notundadır.',
      en: 'The right subclavian artery has the same distal branches as the left. A second arm is not drawn. Femoral engagement of the left subclavian artery depends on arch type. Type III is difficult from the groin. This schematic does not draw the three arch types. The view note carries the detail.'
    },
    hit: { x: 270, y: 136 },
    label: { tr: 'Subklavyan', en: 'Subclavian', x: 200, y: 64, to: [220, 120] },
    draw: both([line('trunk', [[108, 78], [180, 112], [270, 136], [360, 156], [470, 168]], 16)])
  }),
  S({
    id: 'vertebral',
    view: 'arm',
    modes: ['typical', 'variant'],
    kind: 'artery',
    name: { tr: 'Vertebral arter', en: 'Vertebral artery' },
    text: {
      tr: 'Vertebral arter subklavyanın ilk büyük çıkan dalıdır. Genellikle C6 transvers foramenine girer ve servikal transvers foraminalardan yukarı çıkar. Karşı vertebralle birleşerek baziler arteri yapar. Çizimde yalnız proksimal kök vardır.',
      en: 'The vertebral artery is the first large ascending branch of the subclavian artery. It usually enters the C6 transverse foramen and ascends through the cervical transverse foramina. It joins the opposite vertebral artery to form the basilar artery. Only the proximal stem is drawn.'
    },
    pearl: {
      tr: 'Tiroservikal trunkusla karıştırılmamalıdır. Vertebral daha proksimaldedir ve foramene doğru dik çıkar. Subklavyan steal\'de enjeksiyon vertebral akımın yönünü sorar. Kök şematiktir, servikal segment bu sayfada yoktur.',
      en: 'Do not confuse it with the thyrocervical trunk. The vertebral artery is more proximal and rises steeply toward the foramen. In subclavian steal, injection asks which way the vertebral flow runs. The stem is schematic. The cervical segment is not on this page.'
    },
    hit: { x: 174, y: 76 },
    label: { tr: 'Vertebral', en: 'Vertebral', x: 40, y: 52, to: [172, 70] },
    draw: both([line('artery', [[180, 112], [168, 40]], 8)])
  }),
  S({
    id: 'internal-thoracic',
    view: 'arm',
    modes: ['typical', 'variant'],
    kind: 'artery',
    name: { tr: 'İnternal torasik arter (LIMA)', en: 'Internal thoracic artery (LIMA)' },
    text: {
      tr: 'İnternal torasik arter subklavyanın alt yüzünden iner ve kostal kıkırdakların arkasında seyreder. Sol tarafta koroner cerrahide LIMA adını alır. Bu çizim sol kol olduğu için göğüs duvarı dalı LIMA\'dır. Perikardiyofrenik ve anterior interkostal dalları vardır.',
      en: 'The internal thoracic artery descends from the inferior surface of the subclavian artery and runs behind the costal cartilages. On the left it is the LIMA of coronary surgery. Because this drawing is the left arm, the chest-wall branch is the LIMA. It gives pericardiacophrenic and anterior intercostal branches.'
    },
    pearl: {
      tr: 'LIMA grefti aranırken subklavyan ostium ve vertebral kök aynı enjeksiyonda görülür. Subklavyan darlığı greft akımını bozar. Sağ tarafta aynı dal RIMA\'dır. Burada ikinci kol çizilmez. Dal mediale, görüntünün soluna iner.',
      en: 'When a LIMA graft is sought, the subclavian ostium and the vertebral origin are seen on the same injection. A subclavian stenosis steals graft flow. On the right the same branch is the RIMA. A second arm is not drawn here. The branch descends medially, toward image left.'
    },
    hit: { x: 150, y: 460 },
    label: { tr: 'LIMA', en: 'LIMA', x: 48, y: 420, anchor: 'end', to: [160, 400] },
    draw: both([line('artery', [[270, 136], [200, 280], [150, 460], [124, 640]], 8)])
  }),
  S({
    id: 'thyrocervical',
    view: 'arm',
    modes: ['typical', 'variant'],
    kind: 'branch',
    name: { tr: 'Tiroservikal trunkus', en: 'Thyrocervical trunk' },
    text: {
      tr: 'Tiroservikal trunkus subklavyanın üst yüzünden, vertebral arterin distalinden çıkar. İnferior tiroid, transvers servikal ve supraskapular arterlere ayrılır. Boyun kökünde kısa bir yukarı giden gövdedir. Vertebralden daha lateraldedir.',
      en: 'The thyrocervical trunk leaves the superior surface of the subclavian artery, distal to the vertebral artery. It divides into the inferior thyroid, transverse cervical, and suprascapular arteries. It is a short ascending stem at the root of the neck. It lies lateral to the vertebral artery.'
    },
    pearl: {
      tr: 'AP\'de vertebral ile üst üste binebilir. Kökenin vertebralden daha distal ve daha lateral olması ayırır. Tiroid alt kutbu ve boyun kollateralleri buradan gelir. Şema üç dalı tek gövdede toplar.',
      en: 'On AP it can overlap the vertebral artery. Origin distal and lateral to the vertebral artery separates them. The inferior thyroid pole and neck collaterals come from here. The schematic gathers the three branches into one stem.'
    },
    hit: { x: 366, y: 110 },
    label: { tr: 'Tiroservikal', en: 'Thyrocervical', x: 250, y: 36, to: [366, 90] },
    draw: both([line('branch', [[360, 156], [372, 64]], 7)])
  }),
  S({
    id: 'costocervical',
    view: 'arm',
    modes: ['typical', 'variant'],
    kind: 'branch',
    name: { tr: 'Kostoservikal trunkus', en: 'Costocervical trunk' },
    text: {
      tr: 'Kostoservikal trunkus subklavyanın arka yüzünden kısa bir dal olarak çıkar. En yüksek interkostal arter ve derin servikal artere ayrılır. Birinci ve ikinci interkostal aralığa ve derin boyun kaslarına gider. AP\'de vertebral ve tiroservikalden ayrı, daha lateral bir köktür.',
      en: 'The costocervical trunk is a short branch from the posterior surface of the subclavian artery. It divides into the supreme intercostal artery and the deep cervical artery. It supplies the first and second intercostal spaces and the deep neck muscles. On AP it is a more lateral stem than the vertebral and thyrocervical branches.'
    },
    pearl: {
      tr: 'Arka dal olduğu için gerçek lateralde arkaya gider. Bu AP şemada yalnız kök ayrımı öğretilir. Kanama veya kollateral aranırken interkostal dolum bu trunkusu hatırlatır. Dal ince çizilir.',
      en: 'Because it is a posterior branch, a true lateral shows it going backward. This AP schematic only teaches how to separate the stem. Intercostal filling during a search for bleeding or collaterals should bring this trunk to mind. The branch is drawn thin.'
    },
    hit: { x: 485, y: 123 },
    label: { tr: 'Kostoservikal', en: 'Costocervical', x: 520, y: 48, to: [490, 110] },
    draw: both([line('branch', [[470, 168], [500, 78]], 6)])
  }),
  S({
    id: 'axillary',
    view: 'arm',
    modes: ['typical', 'variant'],
    kind: 'artery',
    name: { tr: 'Aksiller arter', en: 'Axillary artery' },
    text: {
      tr: 'Aksiller arter birinci kaburganın dış kenarından teres majorun alt kenarına kadar uzanır. Pektoralis minor üç kısma ayırır. Dallar superior torasik, torakoakromiyal, lateral torasik, subskapular, anterior ve posterior sirkumfleks humeral arterlerdir. Bu şemada dallar ayrı düğme değildir.',
      en: 'The axillary artery runs from the lateral border of the first rib to the lower border of teres major. Pectoralis minor divides it into three parts. Its branches are the superior thoracic, thoracoacromial, lateral thoracic, subscapular, and the anterior and posterior circumflex humeral arteries. Those branches are not separate buttons on this schematic.'
    },
    pearl: {
      tr: 'Omuz travması ve aksiller trombozda subskapular ve sirkumfleks dallar kollateraldir. Brakiyal arter teres majorun altında başlar. Şema tek bir devam çizgisidir. Dal sayımı Gray anatomisine göre metindedir.',
      en: 'In shoulder trauma and axillary thrombosis the subscapular and circumflex branches are collaterals. The brachial artery begins below teres major. The schematic is one continuous line. The branch count in the text follows Gray\'s Anatomy.'
    },
    hit: { x: 460, y: 280 },
    label: { tr: 'Aksiller', en: 'Axillary', x: 500, y: 280, to: [454, 300] },
    draw: both([line('artery', [[470, 168], [460, 280], [440, 400]], 14)])
  }),
  S({
    id: 'brachial',
    view: 'arm',
    modes: ['typical', 'variant'],
    kind: 'artery',
    name: { tr: 'Brakiyal arter', en: 'Brachial artery' },
    text: {
      tr: 'Brakiyal arter teres majorun alt kenarından dirsekteki bifurkasyona iner. Profunda brakii ve kollateral ulnar arterleri verir. Median sinir kolda artere komşudur. Dirsek çukurunda radiyal ve ulnar arterlere ayrılır. Tipik modda bifurkasyon dirsektedir.',
      en: 'The brachial artery descends from the lower border of teres major to its bifurcation at the elbow. It gives the profunda brachii and the ulnar collateral arteries. The median nerve neighbors the artery in the arm. In the cubital fossa it divides into the radial and ulnar arteries. In the typical mode the bifurcation is at the elbow.'
    },
    pearl: {
      tr: 'Yüksek radiyal çıkış, kabaca onda bir kişide, sık alıntılanan aralıkla %7–15, brakiyal veya aksiller arterden olur. Varyant modu bunu gösterir. Profunda brakii bu kartta ayrı düğme değildir. Dirsek çizgisi şematiktir.',
      en: 'A high origin of the radial artery, about one person in ten and commonly quoted at 7–15%, leaves the brachial or axillary artery. Variant mode shows that pattern. The profunda brachii is not a separate button on this card. The elbow line is schematic.'
    },
    hit: { x: 424, y: 520 },
    label: { tr: 'Brakiyal', en: 'Brachial', x: 250, y: 540, anchor: 'end', to: [420, 540] },
    draw: both([line('artery', [[440, 400], [424, 520], [408, 650]], 13)])
  }),
  S({
    id: 'radial',
    view: 'arm',
    modes: ['typical', 'variant'],
    kind: 'artery',
    name: { tr: 'Radiyal arter', en: 'Radial artery' },
    text: {
      tr: 'Radiyal arter önkolun lateralindedir. Bu sol kol şemasında lateral, görüntünün sağındadır. Distalde yüzeyelleşir ve nabız burada alınır. Derin palmar arkın asıl kaynağıdır. Anatomik enfiye çukurundan geçerek el bileğine iner. Tipik modda dirsekten çıkar.',
      en: 'The radial artery is on the lateral side of the forearm. On this left-arm schematic, lateral is image right. It becomes superficial distally, where the pulse is felt. It is the main source of the deep palmar arch. It passes through the anatomical snuffbox on the way to the wrist. In the typical mode it arises at the elbow.'
    },
    pearl: {
      tr: 'Yüzeyel palmar dal çoğu kez enfiye çukurunun proksimalinde ayrılır. Her zaman değil, sıklıkla. Distal radiyal giriş bu yüzden arkı koruyabilir. Normal bir Allen testi güncel radiyal pratikte şart değildir. Varyant modda arter yüksekten çıkıp önkolda loop yapar.',
      en: 'The superficial palmar branch often leaves proximal to the snuffbox. Often, not always. Distal radial access can therefore spare the arch. Contemporary radial practice does not require a normal Allen test. In variant mode the artery arises high and loops in the forearm.'
    },
    hit: { x: 510, y: 880 },
    hits: { typical: { x: 510, y: 880 }, variant: { x: 600, y: 800 } },
    label: { tr: 'Radiyal', en: 'Radial', x: 580, y: 860, to: [520, 900] },
    draw: {
      typical: [line('artery', TYPICAL_RADIAL, 9)],
      variant: [line('artery', VARIANT_RADIAL, 9)]
    }
  }),
  S({
    id: 'ulnar',
    view: 'arm',
    modes: ['typical', 'variant'],
    kind: 'artery',
    name: { tr: 'Ulnar arter', en: 'Ulnar artery' },
    text: {
      tr: 'Ulnar arter önkolun medialindedir. Bu sol kol şemasında medial, görüntünün solundadır. Önkolun daha kalın arteridir ve yüzeyel palmar arkın asıl kaynağıdır. Proksimalinden ortak interosseöz arter çıkar. Distalde ulnar sinirle komşudur.',
      en: 'The ulnar artery is on the medial side of the forearm. On this left-arm schematic, medial is image left. It is usually the larger forearm artery and the main source of the superficial palmar arch. The common interosseous artery leaves it proximally. Distally it neighbors the ulnar nerve.'
    },
    pearl: {
      tr: 'Radiyal girişimde ulnar arter yedek yoldur. Ulnar nabız daha derindedir. Yüksek bifurkasyonda bile ulnar arter çoğu kez dirsekten iner. Şema tek bir medial çizgidir.',
      en: 'During radial access the ulnar artery is the spare route. The ulnar pulse is deeper. Even with a high bifurcation, the ulnar artery usually still descends from the elbow. The schematic is one medial line.'
    },
    hit: { x: 290, y: 920 },
    label: { tr: 'Ulnar', en: 'Ulnar', x: 200, y: 860, anchor: 'end', to: [320, 860] },
    draw: both([line('artery', [[408, 650], [340, 780], [290, 920], [276, 1040]], 10)])
  }),
  S({
    id: 'interosseous',
    view: 'arm',
    modes: ['typical', 'variant'],
    kind: 'branch',
    name: { tr: 'İnterosseöz arter', en: 'Interosseous artery' },
    text: {
      tr: 'Ortak interosseöz arter proksimal ulnar arterden çıkar. Kısa bir gövdeden sonra anterior ve posterior interosseöz arterlere ayrılır. Anterior dal önkolun ön kompartımanında, posterior dal interosseöz membranı geçerek arka kompartımandadır. Bu şema tek bir trunkus çizer.',
      en: 'The common interosseous artery arises from the proximal ulnar artery. After a short trunk it divides into the anterior and posterior interosseous arteries. The anterior artery is in the flexor compartment. The posterior artery crosses the interosseous membrane into the extensor compartment. This schematic draws one trunk.'
    },
    pearl: {
      tr: 'Karttaki adlar: ortak interosseöz proksimal gövde, anterior ve posterior onun uç dallarıdır. Ayrı düğme yoktur. Radiyal veya ulnar tıkanıklıkta interosseöz kollateral ele dolum sağlayabilir. Çizgi iki kemik arasını temsil eder.',
      en: 'Names on this card: the common interosseous artery is the proximal trunk, and the anterior and posterior interosseous arteries are its end branches. There is no separate button. If the radial or ulnar artery occludes, an interosseous collateral can still fill the hand. The line stands for the course between the two bones.'
    },
    hit: { x: 370, y: 900 },
    label: { tr: 'İnterosseöz', en: 'Interosseous', x: 400, y: 930, to: [365, 960] },
    draw: both([line('branch', [[340, 780], [370, 900], [360, 1020]], 6)])
  }),
  S({
    id: 'superficial-arch',
    view: 'arm',
    modes: ['typical', 'variant'],
    kind: 'branch',
    name: { tr: 'Yüzeyel palmar ark', en: 'Superficial palmar arch' },
    text: {
      tr: 'Yüzeyel palmar ark esas olarak ulnar arterin devamıdır. Radiyal arterin yüzeyel palmar dalı çoğu kez arkı tamamlar. Derin arktan daha distaldedir. Ortak palmar dijital arterler buradan çıkar. Şemada ulnar uçtan ele doğru kıvrılan yaydır.',
      en: 'The superficial palmar arch is mainly the continuation of the ulnar artery. The superficial palmar branch of the radial artery often completes it. It lies distal to the deep arch. The common palmar digital arteries arise here. On the schematic it is the arc curving from the ulnar end into the hand.'
    },
    pearl: {
      tr: 'Yüzeyel palmar dal sık olarak enfiye çukurunun proksimalinde ayrılır. Bu her olguda böyle değildir. Arkın tamamlanması değişkendir. Tam olmayan ark radiyal girişimde el iskemisi riskini artırabilir. Allen testi yine de rutin şart değildir.',
      en: 'The superficial palmar branch often leaves proximal to the snuffbox. That is not true in every case. Completion of the arch is variable. An incomplete arch can raise the risk of hand ischemia during radial access. An Allen test is still not a routine requirement.'
    },
    hit: { x: 360, y: 1084 },
    label: { tr: 'Yüzeyel ark', en: 'Superficial arch', x: 300, y: 1110, to: [400, 1088] },
    draw: both([line('branch', [[276, 1040], [360, 1084], [470, 1092], [530, 1064]], 8)])
  }),
  S({
    id: 'deep-arch',
    view: 'arm',
    modes: ['typical', 'variant'],
    kind: 'branch',
    name: { tr: 'Derin palmar ark', en: 'Deep palmar arch' },
    text: {
      tr: 'Derin palmar ark esas olarak radiyal arterin devamıdır. Ulnar arterin derin dalı arkı tamamlar. Yüzeyel arktan daha proksimaldedir. Prensips pollisis ve radialis indisisi çoğu kez radiyal arterden, palmar metakarpal arterler derin arktan çıkar.',
      en: 'The deep palmar arch is mainly the continuation of the radial artery. The deep branch of the ulnar artery completes it. It lies proximal to the superficial arch. The princeps pollicis and radialis indicis arteries often arise from the radial artery, and the palmar metacarpal arteries arise from the deep arch.'
    },
    pearl: {
      tr: 'Distal radiyal girişte iğne derin arkın proksimalindeki radiyal segmenttedir. Yüzeyel dal çoktan ayrılmış olabilir. İki ark arasında proksimal-distal ilişki bu şemada öğretilir. Ölçek anatomik değildir.',
      en: 'In distal radial access the needle is in the radial segment proximal to the deep arch. The superficial branch may already have left. The proximal-to-distal relationship of the two arches is the teaching point. The scale is not anatomic.'
    },
    hit: { x: 430, y: 1016 },
    label: { tr: 'Derin ark', en: 'Deep arch', x: 410, y: 960, to: [430, 1016] },
    draw: both([line('branch', [[536, 1040], [430, 1016], [320, 1004]], 8)])
  }),
  S({
    id: 'distal-radial',
    view: 'arm',
    modes: ['typical', 'variant'],
    kind: 'marker',
    name: { tr: 'Distal radiyal giriş (enfiye çukuru)', en: 'Distal radial access (snuffbox)' },
    text: {
      tr: 'Anatomik enfiye çukuru, başparmak ekstansörleri arasındadır. Radyal sınır abdüktör pollisis longus ve ekstansör pollisis brevis, ulnar sınır ekstansör pollisis longustur. Taban skafoid ve trapeziumdur. Radiyal arter çukurun içinden geçer. İşaret her iki moddadır.',
      en: 'The anatomical snuffbox lies between the thumb extensors. The radial border is abductor pollicis longus and extensor pollicis brevis. The ulnar border is extensor pollicis longus. The floor is the scaphoid and the trapezium. The radial artery passes through the snuffbox. The marker is present in both modes.'
    },
    pearl: {
      tr: 'Kiemeneij 2017 sol distal transradiyal giriş için enfiye çukurunu tarif eder. Yüzeyel palmar dal çoğu kez bu noktanın proksimalinde ayrılmıştır. Normal Allen testi şart değildir. İşaret radiyal arterin üstündedir ve tıklanınca bu kart açılır.',
      en: 'Kiemeneij 2017 described the anatomical snuffbox for left distal transradial access. The superficial palmar branch has often already left proximal to this point. A normal Allen test is not required. The marker sits on the radial artery, and a click here opens this card.'
    },
    hit: { x: 528, y: 960 },
    label: { tr: 'Enfiye çukuru', en: 'Snuffbox', x: 560, y: 940, to: [528, 960] },
    draw: both([circ('marker', 528, 960, 9)])
  }),
  S({
    id: 'radial-loop',
    view: 'arm',
    modes: ['variant'],
    kind: 'variant',
    name: { tr: 'Radiyal loop', en: 'Radial loop' },
    text: {
      tr: 'Radiyal loop, radiyal arterin önkol proksimalinde kendi üzerine kıvrılmasıdır. Çoğu kez yüksek orijinle birliktedir. Tel loopun tepesinde takılır. Bu varyant modunda loop, brakiyal arterin ortasından çıkan radiyal yolun içinde, merkez işareti damar çizgisinin üstüne binmeyecek şekilde durur.',
      en: 'A radial loop is a turn of the radial artery on itself in the proximal forearm. It often travels with a high origin. A wire hangs up at the top of the loop. In this variant mode the loop sits inside the radial course that leaves the mid brachial artery, and the center marker is kept off the vessel line.'
    },
    pearl: {
      tr: 'Hidrofilik tel ve loopun yönü geçişi belirler. Zorlamayınca diseksiyon olmaz. Tipik modda bu işaret yoktur, çünkü normal radiyal arter dirsekten düz iner. Kesik elips loopun yerini öğretir, hasta anatomisi değildir.',
      en: 'A hydrophilic wire and the direction of the loop decide whether it can be crossed. Forcing the wire causes a dissection. Typical mode has no marker, because a usual radial artery descends straight from the elbow. The dashed ellipse teaches the site. It is not a patient\'s anatomy.'
    },
    hit: { x: 597, y: 650 },
    label: { tr: 'Loop', en: 'Loop', x: 620, y: 760, to: [600, 680] },
    draw: { variant: [ell('variant', 575, 650, 22, 16)] }
  }),
  S({
    id: 'high-bifurcation',
    view: 'arm',
    modes: ['variant'],
    kind: 'marker',
    name: { tr: 'Yüksek bifurkasyon', en: 'High bifurcation' },
    text: {
      tr: 'Yüksek bifurkasyonda radiyal arter dirseğin proksimalinden, brakiyal arterin ortasından veya daha yukarıdan çıkar. Sıklık kabaca onda birdir, serilerde çoğu kez %7–15 diye anılır. Bu şema orta brakiyal çıkışı gösterir. Ulnar arter dirsekten inmeyi sürdürür. İşaret yalnız varyant modundadır.',
      en: 'In a high bifurcation the radial artery arises proximal to the elbow, from the mid brachial artery or higher. The rate is about one in ten, commonly quoted as 7–15% in series. This schematic shows a mid-brachial origin. The ulnar artery still descends from the elbow. The marker exists only in variant mode.'
    },
    pearl: {
      tr: 'Bilek girişinde arter yine radiyaldir, fakat önkolda loop olabilir. Köken işareti radiyal çizginin üstünde ve ondan sonra boyanır, böylece çıkış noktası bu kartı açar. Radiyal arterin kendi noktası daha distaldedir. Aksiller çıkış da aynı ailenin uç örneğidir.',
      en: 'At the wrist the artery is still the radial artery, but a loop may sit in the forearm. The origin marker is painted after the radial line so a click at the takeoff opens this card. The radial artery\'s own hit point is farther distal. An axillary origin is the far end of the same family.'
    },
    hit: { x: 424, y: 520 },
    label: { tr: 'Yüksek çıkış', en: 'High origin', x: 470, y: 470, to: [424, 520] },
    draw: { variant: [circ('marker', 424, 520, 9)] }
  })
];

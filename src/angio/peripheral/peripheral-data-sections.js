// Axial schematic cross-sections. Anterior is up, lateral is image left, medial is image right.
// One button per level. Circles are teaching marks, not scaled lumens.

const ell = (kind, cx, cy, rx, ry) => ({ type: 'ellipse', kind, cx, cy, rx, ry });
const circ = (kind, cx, cy, r) => ({ type: 'circle', kind, cx, cy, r });
const rect = (x, y, w, h) => ({ type: 'rect', kind: 'frame', x, y, w, h, rx: 18 });
const txt = (tr, en, x, y, anchor = 'middle') => ({ type: 'text', tr, en, x, y, anchor });

const row = (y) => rect(28, y, 664, 200);

export const SECTIONS = [
  {
    id: 'xs-cfa-cfv',
    view: 'femoral',
    modes: ['xs'],
    kind: 'frame',
    name: { tr: 'Kesit: AFA ve AFV', en: 'Cross-section: CFA and CFV' },
    text: {
      tr: 'İnguinal ligaman düzeyinde aksiyel şema. Önden arkaya değil, bu karede yukarı ön, aşağı arka, sol lateral, sağ medialdir. Lateralden mediale NAVEL dizilimi: femoral sinir, ana femoral arter, ana femoral ven, boşluk ve lenf. Ven medialde ve arterden biraz arkadadır.',
      en: 'Axial schematic at the inguinal ligament. In this square, up is anterior, down is posterior, left is lateral, and right is medial. From lateral to medial the NAVEL order is femoral nerve, common femoral artery, common femoral vein, empty space, and lymphatics. The vein is medial and slightly posterior to the artery.'
    },
    pearl: {
      tr: 'Giriş arterin ön duvarındadır. İğne mediale kayarsa vene girer. Yüksek girişte bu komşuluk retroperitoneal dış iliyak segmente taşınır. Daireler ölçeksiz öğretim işaretleridir.',
      en: 'The puncture is through the anterior wall of the artery. If the needle drifts medial it enters the vein. A high stick moves this relationship into the retroperitoneal external iliac segment. The circles are unscaled teaching marks.'
    },
    hit: { x: 330, y: 118 },
    label: { tr: '1 · AFA / AFV', en: '1 · CFA / CFV', x: 48, y: 48, anchor: 'start' },
    draw: {
      xs: [
        row(20),
        circ('dot-nerve', 210, 124, 22),
        circ('dot-artery', 330, 118, 28),
        circ('dot-vein', 470, 146, 26),
        txt('Sinir', 'Nerve', 210, 176),
        txt('AFA', 'CFA', 330, 168),
        txt('AFV', 'CFV', 470, 192)
      ]
    }
  },
  {
    id: 'xs-gsv',
    view: 'femoral',
    modes: ['xs'],
    kind: 'frame',
    name: { tr: 'Kesit: VSM birleşimi', en: 'Cross-section: GSV junction' },
    text: {
      tr: 'Safenofemoral birleşim, inguinal ligamanın yaklaşık 2–4 cm distalinde, anteromedialdedir. Vena safena magna yüzeyel fasyanın üstünde, femoral kılıfın dışındadır. Ana femoral arter ve ven daha derindedir. Bu ven ponksiyon hedefi değildir.',
      en: 'The saphenofemoral junction lies about 2–4 cm distal to the inguinal ligament, on the anteromedial side. The great saphenous vein is superficial to the fascia and outside the femoral sheath. The common femoral artery and vein are deeper. This vein is not the puncture target.'
    },
    pearl: {
      tr: 'Yüzeyel veni arter sanıp girmeyin. Ultrason kesitinde safen veni komprese olur, arter nabız verir ve venin medialindedir. Şemada küçük anteromedial daire VSM\'dir.',
      en: 'Do not puncture the superficial vein thinking it is the artery. On ultrasound the saphenous vein compresses, while the artery pulses and lies lateral to the femoral vein. The small anteromedial circle is the GSV.'
    },
    hit: { x: 330, y: 360 },
    label: { tr: '2 · VSM birleşimi', en: '2 · GSV junction', x: 48, y: 264, anchor: 'start' },
    draw: {
      xs: [
        row(236),
        circ('dot-nerve', 210, 360, 20),
        circ('dot-artery', 330, 352, 28),
        circ('dot-vein', 468, 378, 26),
        circ('dot-vein', 548, 286, 14),
        txt('Sinir', 'Nerve', 210, 408),
        txt('AFA', 'CFA', 330, 400),
        txt('AFV', 'CFV', 468, 424),
        txt('VSM', 'GSV', 548, 318)
      ]
    }
  },
  {
    id: 'xs-sfa-dfa',
    view: 'femoral',
    modes: ['xs'],
    kind: 'frame',
    name: { tr: 'Kesit: SFA, profunda ve AFV', en: 'Cross-section: SFA, profunda, and CFV' },
    text: {
      tr: 'Bifurkasyonun hemen distalinde aksiyel şema. Süperfisyal femoral arter öndedir. Profunda femoris posterolateraldedir. Ana femoral ven posteromedialdedir. Femoral sinir bu düzeyde dallanmaya başladığı için tek gövde çizilmez.',
      en: 'Axial schematic just distal to the bifurcation. The superficial femoral artery is anterior. The profunda femoris is posterolateral. The common femoral vein is posteromedial. The femoral nerve is already dividing, so it is not drawn as one trunk.'
    },
    pearl: {
      tr: 'Alçak girişte iğne SFA veya profundaya gider. Ven hâlâ posteromedialdedir, bu yüzden fistül riski sürer. Femur başının sıkıştırma düzlemi bu seviyede kaybolur.',
      en: 'A low stick enters the SFA or the profunda. The vein is still posteromedial, so the fistula risk remains. The femoral head compression plane is lost at this level.'
    },
    hit: { x: 360, y: 530 },
    label: { tr: '3 · SFA / DFA / AFV', en: '3 · SFA / DFA / CFV', x: 48, y: 480, anchor: 'start' },
    draw: {
      xs: [
        row(452),
        circ('dot-artery', 360, 530, 26),
        circ('dot-artery', 230, 590, 22),
        circ('dot-vein', 510, 588, 26),
        txt('SFA', 'SFA', 360, 574),
        txt('Profunda', 'Profunda', 230, 632),
        txt('AFV', 'CFV', 510, 634)
      ]
    }
  },
  {
    id: 'xs-fv-dfv',
    view: 'femoral',
    modes: ['xs'],
    kind: 'frame',
    name: { tr: 'Kesit: FV ve DFV', en: 'Cross-section: FV and DFV' },
    text: {
      tr: 'Addüktör kanal (Hunter kanalı) düzeyinde aksiyel şema. Femoral ven, süperfisyal femoral arterin arkasındadır. Derin femoral ven, profunda ile birlikte posterolateralde ve kanalın dışındadır. Venöz birleşim çoğu kez arter bifurkasyonundan biraz daha distaldedir.',
      en: 'Axial schematic in the adductor (Hunter) canal. The femoral vein lies posterior to the superficial femoral artery. The deep femoral vein runs with the profunda, posterolateral and outside the canal. The venous confluence is often slightly distal to the arterial bifurcation.'
    },
    pearl: {
      tr: 'Bu düzeyde antegrad SFA girişinde ven doğrudan arka duvardadır. Çift ven bazen femoral venin yanında görülür. DFV\'yi femoral ven sanmak kollateral yolu yanlış okutur.',
      en: 'For an antegrade SFA puncture at this level the vein is directly behind the posterior wall. A paired vein is sometimes seen beside the femoral vein. Reading the DFV as the femoral vein misplaces the collateral path.'
    },
    hit: { x: 390, y: 748 },
    label: { tr: '4 · FV / DFV', en: '4 · FV / DFV', x: 48, y: 696, anchor: 'start' },
    draw: {
      xs: [
        row(668),
        circ('dot-artery', 390, 748, 26),
        circ('dot-vein', 390, 818, 24),
        circ('dot-artery', 230, 790, 20),
        circ('dot-vein', 188, 836, 18),
        txt('SFA', 'SFA', 390, 792),
        txt('FV', 'FV', 430, 848, 'start'),
        txt('DFA', 'DFA', 230, 828),
        txt('DFV', 'DFV', 150, 858)
      ]
    }
  },
  {
    id: 'xs-popliteal',
    view: 'femoral',
    modes: ['xs'],
    kind: 'frame',
    name: { tr: 'Kesit: popliteal', en: 'Cross-section: popliteal' },
    text: {
      tr: 'Diz arkasında aksiyel şema. Önden arkaya sıra: femur, popliteal arter kemiğe yaslanmış, popliteal ven arterin arkasında, tibial sinir venin daha arkasında. Yüzeyel yapı nörovasküler demetin arka tarafındadır.',
      en: 'Axial schematic behind the knee. From anterior to posterior: the femur, the popliteal artery against the bone, the popliteal vein behind the artery, and the tibial nerve farther posterior. The superficial tissues are on the posterior side of the neurovascular bundle.'
    },
    pearl: {
      tr: 'Pron popliteal girişte iğne önce tibial sinire, sonra vene, en son artere gelir. Bu sıra retrograd popliteal aksesin riskini açıklar. Kare aksiyel şemadır, lateral anjiyogram değildir.',
      en: 'In prone popliteal access the needle meets the tibial nerve, then the vein, and the artery last. That order explains the risk of retrograde popliteal access. The square is an axial schematic, not a lateral angiogram.'
    },
    hit: { x: 360, y: 980 },
    label: { tr: '5 · Popliteal', en: '5 · Popliteal', x: 48, y: 912, anchor: 'start' },
    draw: {
      xs: [
        row(884),
        ell('bone', 360, 930, 78, 28),
        circ('dot-artery', 360, 980, 22),
        circ('dot-vein', 360, 1024, 20),
        circ('dot-nerve', 360, 1058, 16),
        txt('Femur', 'Femur', 360, 936),
        txt('Arter', 'Artery', 400, 986, 'start'),
        txt('Ven', 'Vein', 400, 1030, 'start'),
        txt('Sinir', 'Nerve', 400, 1064, 'start')
      ]
    }
  }
];

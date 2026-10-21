// Original schematic coordinates for the aortoiliac map and the right groin.
// Angiographic orientation: image left is the patient's right.

const line = (kind, pts, w) => ({ type: 'line', kind, pts, w });
const poly = (kind, pts) => ({ type: 'poly', kind, pts });
const ell = (kind, cx, cy, rx, ry) => ({ type: 'ellipse', kind, cx, cy, rx, ry });
const circ = (kind, cx, cy, r) => ({ type: 'circle', kind, cx, cy, r });

const S = (spec) => spec;

const mir = ([x, y]) => [720 - x, y];
const FORK = [360, 220];
const R_CIA = [176, 392];
const R_IIA = [300, 500];
const R_ANT = [346, 592];
const R_POST = [262, 578];
const R_EIA = [118, 744];
const TAKE = [140, 610.2];
const R_IEA = [214, 468];
const R_DCIA = [28, 548];
const GROIN_BIF = [368, 452];

export const AORTOILIAC = [
  S({
    id: 'abdominal-aorta',
    view: 'aortoiliac',
    modes: ['map'],
    kind: 'trunk',
    name: { tr: 'Karın aortu', en: 'Abdominal aorta' },
    text: {
      tr: 'İnfrarenal karın aortu, AP anjiyografik yönelimde çizilir. Görüntünün solu hastanın sağıdır. Damar omur gövdelerinin önünde iner ve yaklaşık L4 düzeyinde iki ana iliyak artere ayrılır. Visseral ve renal dallar ayrı sekmededir. Aralıklar şematik eğitim geometrisidir.',
      en: 'Infrarenal abdominal aorta in AP angiographic orientation. Image left is the patient\'s right. The vessel descends in front of the vertebral bodies and divides near L4 into the common iliac arteries. Visceral and renal branches are on their own tab. Spacing is schematic teaching geometry.'
    },
    pearl: {
      tr: 'İliyak veya femoral girişimden önce inflow bu segmentte okunur. Karşı oblik iliyak bifurkasyon içindir. Kalsifikasyon, anevrizma veya trombüs tel ve cihaz seçimini değiştirir. Bu çizimde lezyon yoktur.',
      en: 'Read inflow on this segment before an iliac or femoral intervention. Contralateral oblique is for the iliac bifurcation. Calcification, aneurysm, or thrombus changes wire and device choice. This drawing has no lesion.'
    },
    hit: { x: 360, y: 132 },
    label: { tr: 'Karın aortu', en: 'Abdominal aorta', x: 400, y: 100, to: [360, 100] },
    draw: { map: [line('trunk', [[360, 44], FORK], 22)] }
  }),
  S({
    id: 'aortic-bifurcation',
    view: 'aortoiliac',
    modes: ['map'],
    kind: 'marker',
    name: { tr: 'Aort bifurkasyonu (L4)', en: 'Aortic bifurcation (L4)' },
    text: {
      tr: 'Aort bifurkasyonu erişkinde genellikle L4 gövdesi hizasındadır. İki ana iliyak arter buradan ayrılır. Median sakral arter çoğu kez bifurkasyonun arka yüzünden orta hatta iner. Yüzeyde göbek kabaca bu düzeye denk gelir; anjiyodaki işaret damarın kendisidir.',
      en: 'In adults the aortic bifurcation is usually at the L4 vertebral body. The two common iliac arteries leave here. The median sacral artery often descends in the midline from the posterior surface of the bifurcation. The umbilicus is only a rough surface landmark.'
    },
    pearl: {
      tr: 'AP projeksiyon bifurkasyon yüksekliğini ve median sakral arteri gösterir. İliyak ağızların üst üste binmesi karşı oblikle açılır. Bifurkasyon stent-greft veya kissing stent planında referans noktadır. Ölçü bu şemadan alınmaz.',
      en: 'AP shows bifurcation height and the median sacral artery. Overlap of the iliac origins is opened with a contralateral oblique. The bifurcation is a reference for stent-graft or kissing-stent planning. Do not measure from this schematic.'
    },
    hit: { x: 360, y: 220 },
    label: { tr: 'Bifurkasyon L4', en: 'Bifurcation L4', x: 400, y: 188, to: [369, 220] },
    draw: { map: [circ('marker', 360, 220, 9)] }
  }),
  S({
    id: 'common-iliac',
    view: 'aortoiliac',
    modes: ['map'],
    kind: 'artery',
    name: { tr: 'Ana iliyak arter', en: 'Common iliac artery' },
    text: {
      tr: 'Sağ ve sol ana iliyak arterler bifurkasyondan pelvik kenara, yaklaşık sakroiliyak eklem hizasına iner. Bu segmentin büyük adlandırılmış bir dalı yoktur. Uçta iç iliyak (hipogastrik) ve dış iliyak arterlere ayrılır. Her iki taraf tek karttadır.',
      en: 'Right and left common iliac arteries run from the bifurcation to the pelvic brim, near the sacroiliac joint. This segment has no large named branch. It ends by dividing into the internal iliac (hypogastric) and external iliac arteries. Both sides share one card.'
    },
    pearl: {
      tr: 'AP projeksiyonda iç ve dış iliyak ağızlar üst üste biner. Sağ bifurkasyon için LAO, sol için RAO, yaklaşık 20–30° karşı oblik ağzı açar. Darlık inflow hastalığıdır ve distal yatağı etkiler.',
      en: 'On AP, the internal and external iliac origins overlap. A contralateral oblique of about 20–30° opens the bifurcation: LAO for the right side, RAO for the left. Stenosis here is inflow disease and affects the distal bed.'
    },
    hit: { x: 268, y: 306 },
    label: { tr: 'Ana iliyak', en: 'Common iliac', x: 64, y: 310, to: [262, 312] },
    draw: {
      map: [
        line('artery', [FORK, R_CIA]),
        line('artery', [FORK, mir(R_CIA)])
      ]
    }
  }),
  S({
    id: 'internal-iliac',
    view: 'aortoiliac',
    modes: ['map'],
    kind: 'artery',
    name: { tr: 'İç iliyak arter (hipogastrik)', en: 'Internal iliac artery (hypogastric)' },
    text: {
      tr: 'İç iliyak arter, ana iliyak bifurkasyonundan pelvisin içine, dış iliyak artere göre posteromedial yönde iner. Kısa bir ana gövdeden sonra ön ve arka bölümlere ayrılır. Pelvis duvarını, gluteal bölgeyi ve pelvik organları besler.',
      en: 'The internal iliac artery leaves the common iliac bifurcation and turns into the pelvis, posteromedial to the external iliac artery. After a short trunk it divides into anterior and posterior divisions. It supplies the pelvic wall, gluteal region, and pelvic organs.'
    },
    pearl: {
      tr: 'Her iki iç iliyak arter ve mezenterik kollateraller birlikte kaybolursa pelvik ve barsak iskemi riski artar. Rekonstrüksiyonda en az bir iç iliyak akımını korumak klasik öğretidir. Şema her dalı tek tek çizmez.',
      en: 'Pelvic and bowel ischemia becomes a concern if both internal iliac arteries and the mesenteric collaterals are lost. Preserving flow in at least one internal iliac artery is the usual teaching during reconstruction. This schematic does not draw every branch.'
    },
    hit: { x: 238, y: 446 },
    label: { tr: 'İç iliyak', en: 'Internal iliac', x: 320, y: 468, to: [264, 468] },
    draw: {
      map: [
        line('artery', [R_CIA, R_IIA]),
        line('artery', [mir(R_CIA), mir(R_IIA)])
      ]
    }
  }),
  S({
    id: 'iia-anterior',
    view: 'aortoiliac',
    modes: ['map'],
    kind: 'branch',
    name: { tr: 'İç iliyak ön bölüm', en: 'Anterior division of the internal iliac' },
    text: {
      tr: 'Ön bölüm daha çok pelvik organlara gider. Klasik dallar umbilikal arter ve üst vezikal dallar, obturator arter, alt vezikal arter veya uterin ve vajinal arterler, orta rektal arter, iç pudendal arter ve alt gluteal arterdir. Çizimde bölümün yönü vardır, her dal ayrı düğme değildir.',
      en: 'The anterior division supplies the pelvic viscera. Classic branches are the umbilical artery with superior vesical branches, obturator artery, inferior vesical or uterine and vaginal arteries, middle rectal artery, internal pudendal artery, and inferior gluteal artery. The drawing shows the division, not a button for each branch.'
    },
    pearl: {
      tr: 'Ön bölüm kanaması veya embolizasyonunda organ ve pudendal dallar hatırlanır. Obturator arter bazen alt epigastrik arterden çıkar (corona mortis) ve pelvik cerrahide kanayabilir. Bu varyant şemada ayrı çizilmez.',
      en: 'Visceral and pudendal branches matter in anterior-division bleeding or embolization. The obturator artery sometimes arises from the inferior epigastric artery (corona mortis) and can bleed in pelvic surgery. That variant is not drawn separately.'
    },
    hit: { x: 323, y: 546 },
    label: { tr: 'Ön bölüm', en: 'Anterior div.', x: 360, y: 630, anchor: 'middle', to: [346, 592] },
    draw: {
      map: [
        line('branch', [R_IIA, R_ANT]),
        line('branch', [mir(R_IIA), mir(R_ANT)])
      ]
    }
  }),
  S({
    id: 'iia-posterior',
    view: 'aortoiliac',
    modes: ['map'],
    kind: 'branch',
    name: { tr: 'İç iliyak arka bölüm', en: 'Posterior division of the internal iliac' },
    text: {
      tr: 'Arka bölüm gövde duvarına gider. Dalları iliolumbar arter, lateral sakral arterler ve üst gluteal arterdir. Üst gluteal arter genellikle en kalın daldır, piriformis kasının üstünden pelvis dışına çıkar ve kalça kollaterallerine katılır.',
      en: 'The posterior division supplies the body wall. Its branches are the iliolumbar artery, lateral sacral arteries, and superior gluteal artery. The superior gluteal artery is usually the largest branch. It leaves the pelvis above piriformis and joins the hip collaterals.'
    },
    pearl: {
      tr: 'Üst gluteal arter, derin femoral arter ağıyla kalça çevresinde kollateral kurabilir. İliolumbar arter lomber ve derin sirkumfleks iliyak arterlerle bağlantı kurar. Bu yüzden tek taraflı iliyak tıkanıklıkta retrograd doluş görülebilir.',
      en: 'The superior gluteal artery can collateralize around the hip with the deep femoral network. The iliolumbar artery connects with lumbar arteries and the deep circumflex iliac artery. Unilateral iliac occlusion may therefore fill retrograde.'
    },
    hit: { x: 281, y: 539 },
    label: { tr: 'Arka bölüm', en: 'Posterior div.', x: 214, y: 676, to: [262, 576] },
    draw: {
      map: [
        line('branch', [R_IIA, R_POST]),
        line('branch', [mir(R_IIA), mir(R_POST)])
      ]
    }
  }),
  S({
    id: 'external-iliac',
    view: 'aortoiliac',
    modes: ['map'],
    kind: 'artery',
    name: { tr: 'Dış iliyak arter', en: 'External iliac artery' },
    text: {
      tr: 'Dış iliyak arter pelvik kenardan inguinal ligamana, psoas kasının medial kenarı boyunca iner. Ligamanın altından itibaren adı ana femoral arter olur. Distal adlandırılmış dalları alt epigastrik arter ve derin sirkumfleks iliyak arterdir.',
      en: 'The external iliac artery runs from the pelvic brim to the inguinal ligament along the medial border of psoas. Below the ligament its name becomes the common femoral artery. Its named distal branches are the inferior epigastric and deep circumflex iliac arteries.'
    },
    pearl: {
      tr: 'Dış iliyak tıkanıklığında kasık, alt epigastrik ve derin sirkumfleks iliyak kollateralleriyle retrograd dolabilir. Yüksek femoral giriş bu damarın retroperitoneal parçasına denk gelirse kanama retroperitona kaçar.',
      en: 'If the external iliac artery occludes, the groin may still fill retrograde through inferior epigastric and deep circumflex iliac collaterals. A high femoral puncture into this retroperitoneal segment bleeds into the retroperitoneum.'
    },
    hit: { x: 147, y: 568 },
    label: { tr: 'Dış iliyak', en: 'External iliac', x: 52, y: 430, to: [150, 550] },
    draw: {
      map: [
        line('artery', [R_CIA, R_EIA]),
        line('artery', [mir(R_CIA), mir(R_EIA)])
      ]
    }
  }),
  S({
    id: 'inferior-epigastric',
    view: 'aortoiliac',
    modes: ['map'],
    kind: 'branch',
    name: { tr: 'Alt epigastrik arter', en: 'Inferior epigastric artery' },
    text: {
      tr: 'Alt epigastrik arter, inguinal ligamanın hemen üstünde dış iliyak arterden çıkar, derin inguinal halkanın medialinden karın ön duvarında yukarı döner. Anjiyografide inguinal ligamanın işaretidir. Yüzeyel epigastrik arter küçük bir femoral daldır ve bu işareti vermez.',
      en: 'The inferior epigastric artery leaves the external iliac artery just above the inguinal ligament and turns up the anterior abdominal wall, medial to the deep inguinal ring. On angiography it marks the inguinal ligament. The superficial epigastric artery is a small femoral branch and is not this marker.'
    },
    pearl: {
      tr: 'Güvenli femoral giriş bu arterin çıkışının distalinde kalır. Çıkışın proksimalindeki giriş dış iliyak artere denk gelir ve retroperitoneal kanama riski taşır. Karşı tarafın arteri ayna görüntüsündedir.',
      en: 'A safe femoral puncture stays distal to this origin. A stick proximal to it enters the external iliac artery and risks retroperitoneal bleeding. The opposite artery is the mirror image.'
    },
    hit: { x: 177, y: 539 },
    label: { tr: 'A. epigastrica inf.', en: 'Inf. epigastric', x: 160, y: 732, to: [178, 537] },
    draw: {
      map: [
        line('branch', [TAKE, R_IEA]),
        line('branch', [mir(TAKE), mir(R_IEA)])
      ]
    }
  }),
  S({
    id: 'deep-circumflex-iliac',
    view: 'aortoiliac',
    modes: ['map'],
    kind: 'branch',
    name: { tr: 'Derin sirkumfleks iliyak arter', en: 'Deep circumflex iliac artery' },
    text: {
      tr: 'Derin sirkumfleks iliyak arter, alt epigastrik arterin yakınından dış iliyak arterin lateralinden çıkar ve spina iliaka anterior superiora, iliyak krest boyunca ilerler. Yüzeyel sirkumfleks iliyak arter ise küçük bir femoral daldır.',
      en: 'The deep circumflex iliac artery arises laterally from the external iliac artery near the inferior epigastric origin and runs toward the anterior superior iliac spine along the iliac crest. The superficial circumflex iliac artery is a different, small femoral branch.'
    },
    pearl: {
      tr: 'Lomber, iliolumbar ve sirkumfleks femoral arterlerle kollateral ağa katılır. Dış iliyak darlığında kasığı retrograd dolduran yollardan biridir. Şemada her iki taraf lateral yönde ayrılır.',
      en: 'It joins the collateral net with lumbar, iliolumbar, and circumflex femoral arteries. It is one route that can fill the groin retrograde when the external iliac artery is narrowed. Both sides leave laterally on this map.'
    },
    hit: { x: 84, y: 579 },
    label: { tr: 'A. circ. iliaca prof.', en: 'Deep circ. iliac', x: 16, y: 168, to: [28, 548] },
    draw: {
      map: [
        line('branch', [TAKE, R_DCIA]),
        line('branch', [mir(TAKE), mir(R_DCIA)])
      ]
    }
  }),
  S({
    id: 'median-sacral',
    view: 'aortoiliac',
    modes: ['map'],
    kind: 'small',
    name: { tr: 'Median sakral arter', en: 'Median sacral artery' },
    text: {
      tr: 'Median sakral arter, aort bifurkasyonunun arka yüzünden çıkan ince orta hat dalıdır. Sakrumun ön yüzünde inferiora iner. Lomber arterlerden ayrıdır. Çapı küçüktür ve şemada öğretmek için biraz belirgin çizilmiştir.',
      en: 'The median sacral artery is a small midline branch from the posterior surface of the aortic bifurcation. It descends on the front of the sacrum. It is not a lumbar artery. Its caliber is small, and the schematic makes it a little easier to see.'
    },
    pearl: {
      tr: 'AP aortografide bifurkasyonun orta hat işareti olarak işe yarar. Pelvik travma veya sakrum önü cerrahide kanama kaynağı olabilir. İnce olduğu için kontrastta kolayca gözden kaçar.',
      en: 'On an AP aortogram it is a midline marker of the bifurcation. It can bleed in pelvic trauma or presacral surgery. Because it is small, it is easy to miss in the contrast column.'
    },
    hit: { x: 360, y: 320 },
    label: { tr: 'Median sakral', en: 'Median sacral', x: 378, y: 370, to: [360, 370] },
    draw: { map: [line('small', [[360, 240], [360, 400]])] }
  })
];

export const FEMORAL_MAP = [
  S({
    id: 'high-stick',
    view: 'femoral',
    modes: ['map'],
    kind: 'risk',
    name: { tr: 'Yüksek giriş zonu', en: 'High puncture zone' },
    text: {
      tr: 'Yüksek giriş, alt epigastrik arter çıkışının proksimalindedir ve dış iliyak artere denk gelir. Bu segment inguinal ligamanın arkasında retroperitondadır. Kanama uylukta sınırlı bir hematom yerine retroperitoneal aralığa yayılabilir.',
      en: 'A high stick is proximal to the inferior epigastric origin and enters the external iliac artery. That segment lies in the retroperitoneum behind the inguinal ligament. Bleeding can spread in the retroperitoneal space instead of forming a contained thigh hematoma.'
    },
    pearl: {
      tr: 'Ligamanın anjiyografik işareti alt epigastrik arterin yukarı dönüşüdür. Kasık kıvrımı bu düzeyi güvenilir göstermez. Şişman veya yaşlı hastada floroskopide femur başına göre konum şarttır. Retroperitoneal kanama hipotansiyonla gelebilir.',
      en: 'The angiographic marker of the ligament is the upward turn of the inferior epigastric artery. The skin crease is an unreliable guide to this level. In patients with obesity or a lax groin, fluoroscopy relative to the femoral head is required. Retroperitoneal bleeding may present with hypotension.'
    },
    hit: { x: 430, y: 130 },
    label: { tr: 'Yüksek giriş', en: 'High stick', x: 40, y: 58, to: [360, 110] },
    draw: { map: [poly('risk', [[292, 78], [500, 96], [468, 196], [286, 176]])] }
  }),
  S({
    id: 'low-stick',
    view: 'femoral',
    modes: ['map'],
    kind: 'warn',
    name: { tr: 'Alçak giriş zonu', en: 'Low puncture zone' },
    text: {
      tr: 'Alçak giriş bifurkasyonun distalindedir. İğne süperfisyal femoral artere veya profunda femorise girer. Bu düzey femur başının sıkıştırma desteğinin dışına kayar. Sonuç yalancı anevrizma veya arteriovenöz fistül olabilir.',
      en: 'A low stick is distal to the bifurcation. The needle enters the superficial femoral artery or the profunda femoris. Compression then falls off the femoral head. The result can be a pseudoaneurysm or an arteriovenous fistula.'
    },
    pearl: {
      tr: 'Bifurkasyon bazen kasık kıvrımının oldukça proksimalindedir. Floroskopide femur başının alt kenarını geçmemek öğretilir. Alçak girişte ven hemen posteromedialdedir, fistül bu komşuluktan olur.',
      en: 'The bifurcation is sometimes well above the skin crease. Teaching is to stay above the lower edge of the femoral head on fluoroscopy. At a low stick the vein is immediately posteromedial, which is how a fistula forms.'
    },
    hit: { x: 455, y: 560 },
    label: { tr: 'Alçak giriş', en: 'Low stick', x: 530, y: 700, to: [470, 620] },
    draw: { map: [poly('warn', [[346, 478], [492, 498], [508, 648], [362, 626]])] }
  }),
  S({
    id: 'puncture-zone',
    view: 'femoral',
    modes: ['map'],
    kind: 'safe',
    name: { tr: 'İdeal ponksiyon bandı', en: 'Ideal puncture zone' },
    text: {
      tr: 'İdeal ortak femoral giriş üç koşulu birden karşılar: alt epigastrik arter çıkışının altında, femoral bifurkasyonun üstünde ve femur başının medial üçte biri üzerinde. Bant bu üçgeni şematik olarak boyar.',
      en: 'An ideal common femoral puncture meets three conditions at once: below the inferior epigastric origin, above the femoral bifurcation, and over the medial third of the femoral head. The band paints that zone schematically.'
    },
    pearl: {
      tr: 'Kemik destek, kılıf çekildikten sonra arteri veninden ayırarak basmayı sağlar. Sandoval 2017 ve Garrett 2005 çağdaş giriş öğretisinin kaynaklarıdır. Bant bir floroskopi görüntüsü değil, öğretim geometrisidir.',
      en: 'Bone backing lets compression separate the artery from the vein after the sheath is removed. Sandoval 2017 and Garrett 2005 are the sources used here for contemporary access teaching. The band is teaching geometry, not a fluoroscopic image.'
    },
    hit: { x: 445, y: 330 },
    label: { tr: 'Güvenli bant', en: 'Safe zone', x: 500, y: 210, to: [460, 280] },
    draw: { map: [poly('safe', [[304, 228], [462, 248], [474, 430], [324, 446]])] }
  }),
  S({
    id: 'femoral-head',
    view: 'femoral',
    modes: ['map'],
    kind: 'bone',
    name: { tr: 'Femur başı', en: 'Femoral head' },
    text: {
      tr: 'Sağ femur başı kasık haritasının kemiğidir. Görüntünün solu lateral, sağı medialdir. Ana femoral arter başın medial üçte biri üzerinden geçer. Baş, kompresyon için sert destektir.',
      en: 'The right femoral head is the bone on this groin map. Image left is lateral and image right is medial. The common femoral artery crosses the medial third of the head. The head is the firm backstop for compression.'
    },
    pearl: {
      tr: 'Garrett ve arkadaşları femoral başın floroskopik yerleşimini tarif eder. İğne ucu başın orta-alt medial kısmında, bifurkasyonun proksimalinde olmalıdır. Başın alt kenarının distali alçak giriştir.',
      en: 'Garrett and colleagues described fluoroscopic localization against the femoral head. The needle tip should sit over the mid to lower medial head, proximal to the bifurcation. Distal to the lower cortical edge is a low stick.'
    },
    hit: { x: 230, y: 360 },
    label: { tr: 'Femur başı', en: 'Femoral head', x: 150, y: 250, anchor: 'end', to: [180, 280] },
    draw: { map: [ell('bone', 300, 332, 126, 140)] }
  }),
  S({
    id: 'inguinal-ligament',
    view: 'femoral',
    modes: ['map'],
    kind: 'landmark',
    name: { tr: 'İnguinal ligaman', en: 'Inguinal ligament' },
    text: {
      tr: 'İnguinal ligaman spina iliaka anterior superiordan pubik tüberküle uzanır. Lateral uç daha yukarıdadır, medial uç hafif aşağıdadır. Dış iliyak arter ligamanın altında ana femoral arter adını alır.',
      en: 'The inguinal ligament runs from the anterior superior iliac spine to the pubic tubercle. The lateral end is higher and the medial end is slightly lower. Below the ligament the external iliac artery is named the common femoral artery.'
    },
    pearl: {
      tr: 'Cilt kıvrımı ligamanın yerini tutmaz. Anjiyodaki pratik işaret, ligamanın hemen üstünde yukarı dönen alt epigastrik arterdir. Bu çizgideki arter hâlâ retroperitoneal sayılır.',
      en: 'The skin crease does not stand in for the ligament. The practical angiographic marker is the inferior epigastric artery turning upward just above it. Artery at the line itself is still treated as retroperitoneal.'
    },
    hit: { x: 150, y: 196 },
    label: { tr: 'İnguinal ligaman', en: 'Inguinal ligament', x: 48, y: 118, to: [200, 196] },
    draw: { map: [line('landmark', [[48, 172], [660, 268]], 3)] }
  }),
  S({
    id: 'common-femoral',
    view: 'femoral',
    modes: ['map'],
    kind: 'artery',
    name: { tr: 'Ana femoral arter', en: 'Common femoral artery' },
    text: {
      tr: 'Ana femoral arter inguinal ligamandan femoral bifurkasyona kadar olan kısa segmenttir. Sağ kasıkta femur başının medial üçte biri üzerinde çizilir. Uçta süperfisyal femoral arter ve profunda femorise ayrılır.',
      en: 'The common femoral artery is the short segment from the inguinal ligament to the femoral bifurcation. On this right groin it lies over the medial third of the femoral head. It divides into the superficial femoral artery and the profunda femoris.'
    },
    pearl: {
      tr: 'Perkütan girişin hedef damarı budur. İpsilateral oblik 20–40° (sağ kasıkta RAO, sol kasıkta LAO) bifurkasyonu açar ve iğnenin tek lümende olduğunu gösterir. AP bazen profunda ağzını süperfisyal femoral arterin üzerine bindirir.',
      en: 'This is the target vessel for percutaneous access. An ipsilateral oblique of 20–40° (RAO for a right groin, LAO for a left groin) opens the bifurcation and shows that the needle is in one lumen. AP can lay the profunda origin over the superficial femoral artery.'
    },
    hit: { x: 374, y: 310 },
    label: { tr: 'A. femoralis comm.', en: 'CFA', x: 500, y: 330, to: [385, 300] },
    draw: { map: [line('artery', [[372, 186], [372, 280], [370, 370], GROIN_BIF], 16)] }
  }),
  S({
    id: 'femoral-bifurcation',
    view: 'femoral',
    modes: ['map'],
    kind: 'marker',
    name: { tr: 'Femoral bifurkasyon', en: 'Femoral bifurcation' },
    text: {
      tr: 'Femoral bifurkasyon ana femoral arterin süperfisyal femoral arter ve profunda femorise ayrıldığı noktadır. Profunda posterolaterale, süperfisyal femoral arter hafif mediale devam eder. Nokta şematik bir işarettir.',
      en: 'The femoral bifurcation is where the common femoral artery divides into the superficial femoral artery and the profunda femoris. The profunda turns posterolateral and the superficial femoral artery continues slightly medial. The dot is a schematic marker.'
    },
    pearl: {
      tr: 'Giriş bifurkasyonun proksimalinde kalmalıdır. İpsilateral oblik 20–40° iki ağzı ayırır. Circumfleks dalların ana femoral arterden erken çıkması bifurkasyon sanılabilir. Dalın uylukta aşağı devam edip etmediğine bakın.',
      en: 'The puncture should stay proximal to the bifurcation. Ipsilateral oblique 20–40° separates the two origins. An early circumflex branch from the common femoral artery can be mistaken for the bifurcation. See whether the branch continues down the thigh.'
    },
    hit: { x: 368, y: 452 },
    label: { tr: 'Bifurkasyon', en: 'Bifurcation', x: 500, y: 470, to: [380, 452] },
    draw: { map: [circ('marker', 368, 452, 8)] }
  }),
  S({
    id: 'femoral-sfa',
    view: 'femoral',
    modes: ['map'],
    kind: 'artery',
    name: { tr: 'Süperfisyal femoral arter', en: 'Superficial femoral artery' },
    text: {
      tr: 'Süperfisyal femoral arter, bifurkasyondan sonra uylukta devam eden damardır. Terminologia Anatomica bu damara femoral arter der. Anjiyografi dilinde süperfisyal femoral arter, profunda ayrımının distalindeki uyluk segmentidir. Haritada hafif medial iner.',
      en: 'The superficial femoral artery is the vessel that continues down the thigh after the bifurcation. Terminologia Anatomica calls it the femoral artery. In angiographic speech, superficial femoral artery means the thigh segment distal to the profunda. On the map it runs slightly medial.'
    },
    pearl: {
      tr: 'Alçak giriş çoğu kez bu damarın proksimaline olur. Femur başı burada bittiği için kompresyon zayıftır. Addüktör kanal ve dizaltı devamı bacak sekmesindedir.',
      en: 'A low stick often lands in the proximal part of this artery. The femoral head has ended here, so compression is poor. The adductor canal and the below-knee continuation are on the leg tab.'
    },
    hit: { x: 412, y: 640 },
    label: { tr: 'SFA', en: 'SFA', x: 470, y: 700, to: [420, 700] },
    draw: { map: [line('artery', [GROIN_BIF, [390, 550], [412, 650], [432, 760]], 13)] }
  }),
  S({
    id: 'profunda',
    view: 'femoral',
    modes: ['map'],
    kind: 'artery',
    name: { tr: 'Derin femoral arter', en: 'Profunda femoris' },
    text: {
      tr: 'Profunda femoris (derin femoral arter) bifurkasyondan posterolaterale ayrılır ve uyluğu besler. Süperfisyal femoral arter tıkandığında geniküler ağ üzerinden dizi dolduran başlıca kollateral yoldur. Çizim sağ kasığın lateraline gider.',
      en: 'The profunda femoris (deep femoral artery) leaves the bifurcation posterolaterally and supplies the thigh. When the superficial femoral artery occludes, it is the main collateral route that reconstitutes the popliteal artery through the genicular net. The drawing runs to the lateral side of the right groin.'
    },
    pearl: {
      tr: 'Profunda ağzına stent veya plak koymamak öğretilir, çünkü kollateral kapı kapanır. İpsilateral oblikte ağız süperfisyal femoral arterden ayrılır. Perforan dallar şemada ayrı düğme değildir.',
      en: 'Teaching is to avoid stenting or plating across the profunda origin, because that door feeds the collateral path. Ipsilateral oblique separates the origin from the superficial femoral artery. Perforating branches are not separate buttons.'
    },
    hit: { x: 270, y: 640 },
    label: { tr: 'Profunda', en: 'Profunda', x: 160, y: 680, anchor: 'end', to: [250, 680] },
    draw: { map: [line('artery', [GROIN_BIF, [320, 530], [270, 630], [228, 740]], 11)] }
  }),
  S({
    id: 'lateral-circumflex',
    view: 'femoral',
    modes: ['map'],
    kind: 'branch',
    name: { tr: 'Lateral sirkumfleks femoral arter', en: 'Lateral circumflex femoral artery' },
    text: {
      tr: 'Lateral sirkumfleks femoral arter çoğu kez profunda femorisin proksimalinden laterale çıkar. Çıkan, transvers ve inen dalları vardır. İnen dal diz çevresi kollaterallerine katılır. Çıkış yeri değişkendir, bazen ana femoral arterden gelir.',
      en: 'The lateral circumflex femoral artery usually leaves the proximal profunda femoris and runs laterally. It has ascending, transverse, and descending branches. The descending branch joins the genicular collaterals. The origin varies and is sometimes from the common femoral artery.'
    },
    pearl: {
      tr: 'Ana femoral arterden yüksek çıkış, bifurkasyonla karışır. Dal laterale gidip uylukta SFA gibi aşağı inmiyorsa circumflex düşünün. Derin sirkumfleks iliyak arterle de kollateral kurar.',
      en: 'A high origin from the common femoral artery mimics the bifurcation. If the branch runs lateral and does not continue down the thigh like the SFA, think circumflex. It also collateralizes with the deep circumflex iliac artery.'
    },
    hit: { x: 150, y: 468 },
    label: { tr: 'A. circ. fem. lat.', en: 'Lat. circumflex', x: 16, y: 400, to: [100, 440] },
    draw: { map: [line('branch', [[320, 530], [240, 492], [150, 458], [64, 428]])] }
  }),
  S({
    id: 'medial-circumflex',
    view: 'femoral',
    modes: ['map'],
    kind: 'branch',
    name: { tr: 'Medial sirkumfleks femoral arter', en: 'Medial circumflex femoral artery' },
    text: {
      tr: 'Medial sirkumfleks femoral arter femur boynunun medialinden dolaşır ve kalçanın kollateral ağına katılır. Çoğu anatomide profunda femorisin proksimalinden veya bazen ana femoral arterden çıkar. Şemada mediale yönelir.',
      en: 'The medial circumflex femoral artery curves along the medial femoral neck and joins the collateral net of the hip. In most bodies it arises from the proximal profunda femoris, sometimes from the common femoral artery. On the schematic it turns medial.'
    },
    pearl: {
      tr: 'Kalça cerrahisi ve femur boynu kırığında önemli bir kanama veya perfüzyon dalıdır. Anjiyografide ince mediale giden dal, profunda gövdesiyle karıştırılmamalıdır. Profunda aşağı ve laterale devam eder.',
      en: 'It matters for bleeding and perfusion in hip surgery and femoral neck fracture. A small medial branch should not be confused with the profunda trunk. The profunda trunk continues down and lateral.'
    },
    hit: { x: 500, y: 512 },
    label: { tr: 'A. circ. fem. med.', en: 'Med. circumflex', x: 548, y: 610, to: [580, 540] },
    draw: { map: [line('branch', [[320, 530], [410, 500], [510, 518], [610, 548]])] }
  })
];

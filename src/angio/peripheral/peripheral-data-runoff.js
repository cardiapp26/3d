// Right leg runoff, AP angiographic orientation.
// Image left is lateral (fibula side). Image right is medial.

const line = (kind, pts, w) => ({ type: 'line', kind, pts, w });
const poly = (kind, pts) => ({ type: 'poly', kind, pts });

const HIATUS = [408, 312];
const P1P2 = [418, 430];
const JOINT = [422, 560];
const AT_ORIGIN = [416, 700];
const TPT_END = [478, 768];
const DP = [236, 1168];
const PT_END = [552, 1140];

const S = (spec) => spec;

export const RUNOFF = [
  S({
    id: 'angiosome',
    view: 'runoff',
    modes: ['map'],
    kind: 'zone',
    name: { tr: 'Anjiyozom notu', en: 'Angiosome note' },
    text: {
      tr: 'Ayakta üç soluk bölge öğretme amaçlıdır. Posterior tibial arter plantar topuk (medial kalkaneal), medial ayak ve lateral orta-ön ayağı besler. Anterior tibial arter ve dorsalis pedis ayak sırtını besler. Peroneal arter anterolateral ayak bileği ve lateral topuğu perforanlarla besler. Normalde plantar arka kadar inmez.',
      en: 'Three faint zones are teaching marks. The posterior tibial artery supplies the plantar heel (medial calcaneal), the medial foot, and the lateral midfoot and forefoot. The anterior tibial artery and dorsalis pedis supply the dorsum. The peroneal artery supplies the anterolateral ankle and the lateral heel through perforators. It does not normally reach the plantar arch.'
    },
    pearl: {
      tr: 'Dizaltı girişimde yaranın hangi damardan beslendiği sorulur. Taylor ve Palmer 1987 anjiyozomu, Attinger 2006 alt ekstremite haritasını tarif eder. Doğrudan anjiyozom revaskülarizasyonunun her çalışmada üstün olduğu söylenemez. Diyabette choke damarları zayıftır. Bölgeler ölçekli yara haritası değildir.',
      en: 'Below-knee intervention asks which vessel feeds the wound. Taylor and Palmer 1987 described the angiosome, and Attinger 2006 mapped the lower extremity. Direct angiosome revascularization is not proven superior in every trial. Choke vessels are poor in diabetes. The zones are not a scaled wound map.'
    },
    hit: { x: 96, y: 1204 },
    label: { tr: 'Anjiyozom', en: 'Angiosome', x: 24, y: 1040, to: [96, 1204] },
    draw: {
      map: [
        poly('zone', [[48, 1172], [150, 1176], [142, 1244], [56, 1232]]),
        poly('zone', [[210, 1148], [300, 1156], [290, 1192], [204, 1184]]),
        poly('zone', [[608, 1208], [688, 1216], [680, 1240], [604, 1232]])
      ]
    }
  }),
  S({
    id: 'adductor-canal',
    view: 'runoff',
    modes: ['map'],
    kind: 'zone',
    name: { tr: 'Addüktör (Hunter) kanalı', en: 'Adductor (Hunter) canal' },
    text: {
      tr: 'Addüktör kanalı uyluğun alt medialindedir. Süperfisyal femoral arter, femoral ven ve safen sinirin bir dalı kanaldan geçer. Kanalın alt ağzı addüktör hiatusudur. Arter hiatusu geçince popliteal arter adını alır.',
      en: 'The adductor canal is in the distal medial thigh. The superficial femoral artery, the femoral vein, and a branch of the saphenous nerve pass through it. Its lower opening is the adductor hiatus. Once the artery leaves the hiatus it is named the popliteal artery.'
    },
    pearl: {
      tr: 'SFA tıkanıklığı çoğu kez kanalın distalinde, hiatus çevresindedir. Ven bu düzeyde arterin arkasındadır. Kesit sekmesindeki dördüncü kare bu komşuluğu gösterir. Bant kanalın yerini öğretir, kas sınırı değildir.',
      en: 'SFA occlusion is often in the distal canal, around the hiatus. At this level the vein is behind the artery. The fourth square on the cross-section control shows that relationship. The band teaches the canal location. It is not a muscle boundary.'
    },
    hit: { x: 500, y: 210 },
    label: { tr: 'Hunter kanalı', en: 'Hunter canal', x: 530, y: 160, to: [480, 200] },
    draw: { map: [poly('zone', [[348, 128], [500, 140], [508, 300], [340, 288]])] }
  }),
  S({
    id: 'sfa',
    view: 'runoff',
    modes: ['map'],
    kind: 'artery',
    name: { tr: 'Süperfisyal femoral arter', en: 'Superficial femoral artery' },
    text: {
      tr: 'Sağ bacak AP şemasında süperfisyal femoral arter uylukta addüktör kanalından hiatusa iner. Terminologia Anatomica adı femoral arterdir. Anjiyografi, profunda ayrımından hiatusa kadar olan segmente süperfisyal femoral arter demeye devam eder.',
      en: 'On this right-leg AP schematic the superficial femoral artery descends through the adductor canal to the hiatus. Terminologia Anatomica names it the femoral artery. Angiography still calls the segment from the profunda origin to the hiatus the superficial femoral artery.'
    },
    pearl: {
      tr: 'Uzun SFA oklüzyonunda distal doluş profunda ve geniküler kollaterallerden gelir. Reentry ve hiatus çevresi kalsifikasyon geçişi zorlaştırır. Çap bu çizimden ölçülmez.',
      en: 'In a long SFA occlusion the distal artery reconstitutes from profunda and genicular collaterals. Re-entry and calcification around the hiatus make crossing harder. Caliber is not measured from this drawing.'
    },
    hit: { x: 424, y: 180 },
    label: { tr: 'SFA', en: 'SFA', x: 300, y: 70, anchor: 'end', to: [410, 80] },
    draw: { map: [line('artery', [[430, 32], [424, 120], [416, 210], [410, 270], HIATUS], 14)] }
  }),
  S({
    id: 'pop-p1',
    view: 'runoff',
    modes: ['map'],
    kind: 'artery',
    name: { tr: 'Popliteal arter P1', en: 'Popliteal artery P1' },
    text: {
      tr: 'TASC II girişim dilinde P1, addüktör hiatusundan patellanın proksimal kenarına kadar olan popliteal segmenttir. Popliteal fossanın üstündedir. Üst geniküler arterler bu segmentin civarından çıkar.',
      en: 'In TASC II intervention language, P1 is the popliteal segment from the adductor hiatus to the proximal border of the patella. It lies above the popliteal fossa. The superior genicular arteries leave around this segment.'
    },
    pearl: {
      tr: 'P1 lezyonu uyluk SFA oklüzyonunun devamı gibi davranabilir. Diz eklemi hareketinin dışında olduğu için stent kararı P2\'den farklı düşünülür. Sınırlar şematiktir, filmde patella kenarına göre konur.',
      en: 'A P1 lesion can behave as the continuation of an SFA occlusion. Because it sits outside knee flexion, the stent decision is considered differently from P2. The borders here are schematic. On a film they are set against the patella.'
    },
    hit: { x: 430, y: 370 },
    label: { tr: 'P1', en: 'P1', x: 500, y: 400, to: [424, 400] },
    draw: { map: [line('artery', [HIATUS, [412, 360], P1P2], 13)] }
  }),
  S({
    id: 'pop-p2',
    view: 'runoff',
    modes: ['map'],
    kind: 'artery',
    name: { tr: 'Popliteal arter P2', en: 'Popliteal artery P2' },
    text: {
      tr: 'P2, patellanın proksimal kenarından diz eklem aralığının ortasına kadar olan segmenttir. Eklemin arkasından geçer. Orta geniküler arter ince bir eklem dalıdır ve ayrı düğme değildir. Bu kartta yalnızca anılır.',
      en: 'P2 runs from the proximal border of the patella to the center of the knee joint space. It passes behind the joint. The middle genicular artery is a small articular branch and is not its own button. It is named only in this card.'
    },
    pearl: {
      tr: 'P2, diz fleksiyonunun olduğu segmenttir. Buraya stent koymak kırılma ve restenoz riski nedeniyle son seçenek gibi öğretilir. Eklem çizgisi şemada yatay referanstır.',
      en: 'P2 is the segment that flexes with the knee. Stenting here is taught as a last resort because of fracture and restenosis. The joint line on the schematic is a horizontal reference.'
    },
    hit: { x: 420, y: 500 },
    label: { tr: 'P2', en: 'P2', x: 500, y: 500, to: [422, 520] },
    draw: { map: [line('artery', [P1P2, [420, 490], JOINT], 13)] }
  }),
  S({
    id: 'pop-p3',
    view: 'runoff',
    modes: ['map'],
    kind: 'artery',
    name: { tr: 'Popliteal arter P3', en: 'Popliteal artery P3' },
    text: {
      tr: 'P3, diz eklem aralığının ortasından anterior tibial arterin çıkışına kadar iner. Alt geniküler arterler bu segment civarındadır. Distal uçta anterior tibial arter laterale, tibioperoneal trunkus aşağıya ayrılır.',
      en: 'P3 descends from the center of the knee joint space to the origin of the anterior tibial artery. The inferior genicular arteries lie around this segment. At its end the anterior tibial artery turns lateral and the tibioperoneal trunk continues down.'
    },
    pearl: {
      tr: 'P3 ve tibioperoneal ağız, dizaltı girişimin kapısıdır. AP\'de anterior tibial ve peroneal çıkışlar üst üste binebilir. Lateral veya oblik projeksiyon onları ayırır.',
      en: 'P3 and the tibioperoneal origin are the gate to below-knee intervention. On AP the anterior tibial and peroneal origins can overlap. A lateral or oblique projection separates them.'
    },
    hit: { x: 420, y: 630 },
    label: { tr: 'P3', en: 'P3', x: 500, y: 640, to: [422, 640] },
    draw: { map: [line('artery', [JOINT, [420, 620], AT_ORIGIN], 12)] }
  }),
  S({
    id: 'gen-sl',
    view: 'runoff',
    modes: ['map'],
    kind: 'branch',
    name: { tr: 'Üst lateral geniküler arter', en: 'Superior lateral genicular artery' },
    text: {
      tr: 'Üst lateral geniküler arter popliteal arterden laterale, femur kondilinin üstünden dolaşır. Diz çevresi kollateral ağın parçasıdır. SFA veya P1 tıkanıklığında distali doldurabilir.',
      en: 'The superior lateral genicular artery leaves the popliteal artery and curves lateral above the femoral condyle. It is part of the genicular collateral net. It can reconstitute the artery beyond an SFA or P1 occlusion.'
    },
    pearl: {
      tr: 'Kollateralin hangi geniküler daldan geldiğini görmek, oklüzyonun seviyesini tahmin ettirir. Şemada lateral, görüntünün soludur. İnce dallar öğretim için ayrılmıştır.',
      en: 'Seeing which genicular branch reconstitutes the lumen helps place the occlusion. On this schematic, lateral is image left. The thin branches are separated for teaching.'
    },
    hit: { x: 240, y: 328 },
    label: { tr: 'Üst lat. gen.', en: 'Sup. lat. gen.', x: 70, y: 300, to: [180, 320] },
    draw: { map: [line('branch', [[412, 372], [320, 342], [230, 322], [150, 308]])] }
  }),
  S({
    id: 'gen-sm',
    view: 'runoff',
    modes: ['map'],
    kind: 'branch',
    name: { tr: 'Üst medial geniküler arter', en: 'Superior medial genicular artery' },
    text: {
      tr: 'Üst medial geniküler arter popliteal arterden mediale, femurun medial kondili üstüne gider. Karşı üst lateral dal ile diz ağında birleşir. Sağ bacakta görüntünün sağı medialdir.',
      en: 'The superior medial genicular artery leaves the popliteal artery and runs medial above the medial femoral condyle. It meets the opposite superior lateral branch in the genicular net. On the right leg, image right is medial.'
    },
    pearl: {
      tr: 'Medial kollateral, distal SFA oklüzyonunda popliteal arteri dolduran yollardan biridir. Çapı küçüktür. Seçici enjeksiyon olmadan ağı abartmayın.',
      en: 'The medial collateral is one route that refills the popliteal artery beyond a distal SFA occlusion. Its caliber is small. Do not over-read the net without a selective injection.'
    },
    hit: { x: 590, y: 336 },
    label: { tr: 'Üst med. gen.', en: 'Sup. med. gen.', x: 560, y: 280, to: [600, 328] },
    draw: { map: [line('branch', [[414, 380], [510, 348], [600, 328], [680, 316]])] }
  }),
  S({
    id: 'gen-il',
    view: 'runoff',
    modes: ['map'],
    kind: 'branch',
    name: { tr: 'Alt lateral geniküler arter', en: 'Inferior lateral genicular artery' },
    text: {
      tr: 'Alt lateral geniküler arter eklem çizgisi civarında laterale çıkar ve tibial plato ile fibula başı üzerinde dolaşır. Anterior tibial tekrar doluşuna katılabilir.',
      en: 'The inferior lateral genicular artery arises near the joint line, turns lateral, and curves over the tibial plateau and fibular head. It can contribute to reconstitution of the anterior tibial artery.'
    },
    pearl: {
      tr: 'P3 oklüzyonunda alt geniküler dallar krural arterleri ip gibi doldurabilir. Lateral projeksiyonda fibula başı ile ilişkisi daha okunaklıdır.',
      en: 'In a P3 occlusion the inferior genicular branches can refill a crural artery as a thin thread. Their relation to the fibular head is easier to read on a lateral projection.'
    },
    hit: { x: 230, y: 590 },
    label: { tr: 'Alt lat. gen.', en: 'Inf. lat. gen.', x: 24, y: 640, to: [160, 610] },
    draw: { map: [line('branch', [[420, 530], [320, 566], [220, 596], [130, 612]])] }
  }),
  S({
    id: 'gen-im',
    view: 'runoff',
    modes: ['map'],
    kind: 'branch',
    name: { tr: 'Alt medial geniküler arter', en: 'Inferior medial genicular artery' },
    text: {
      tr: 'Alt medial geniküler arter eklem çizgisi civarında mediale çıkar, tibia medial kondili altında dolaşır. Posterior tibial tekrar doluşuna katılabilir.',
      en: 'The inferior medial genicular artery arises near the joint line, turns medial, and curves below the medial tibial condyle. It can contribute to reconstitution of the posterior tibial artery.'
    },
    pearl: {
      tr: 'Medial alt dal, posterior tibial arterin proksimal oklüzyonunda ince bir köprü olabilir. Şemada dört geniküler dal öğretilir. Orta geniküler dal P2 kartındadır.',
      en: 'The inferior medial branch can be a thin bridge across a proximal posterior tibial occlusion. Four genicular arteries are taught on this map. The middle genicular branch is mentioned on the P2 card.'
    },
    hit: { x: 600, y: 600 },
    label: { tr: 'Alt med. gen.', en: 'Inf. med. gen.', x: 560, y: 680, to: [610, 608] },
    draw: { map: [line('branch', [[422, 542], [520, 578], [610, 608], [690, 626]])] }
  }),
  S({
    id: 'anterior-tibial',
    view: 'runoff',
    modes: ['map'],
    kind: 'artery',
    name: { tr: 'Anterior tibial arter', en: 'Anterior tibial artery' },
    text: {
      tr: 'Anterior tibial arter, popliteal arterin ilk krural dalıdır ve laterale, interosseöz membrandan bacağın ön kompartmanına geçer. Şemada görüntünün solunda, fibula tarafında aşağı iner. Ayak sırtında dorsalis pedis adını alır.',
      en: 'The anterior tibial artery is the first crural branch of the popliteal artery. It turns lateral through the interosseous membrane into the anterior compartment. On the schematic it descends on image left, the fibular side. On the dorsum of the foot it is named the dorsalis pedis.'
    },
    pearl: {
      tr: 'AP\'de proksimal anterior tibial arter peroneal arterin üzerine biner. Lateral projeksiyon ön kompartmanı arkadaki peroneal ve posterior tibial arterlerden ayırır. Ayak sırtı anjiyozomu bu damara aittir.',
      en: 'On AP the proximal anterior tibial artery overlaps the peroneal artery. A lateral projection separates the anterior compartment from the peroneal and posterior tibial arteries behind it. The dorsum angiosome belongs to this vessel.'
    },
    hit: { x: 280, y: 960 },
    label: { tr: 'A. tibialis ant.', en: 'Ant. tibial', x: 24, y: 860, to: [300, 900] },
    draw: { map: [line('artery', [AT_ORIGIN, [370, 800], [310, 920], [260, 1040], [240, 1120], DP], 9)] }
  }),
  S({
    id: 'tibioperoneal',
    view: 'runoff',
    modes: ['map'],
    kind: 'artery',
    name: { tr: 'Tibioperoneal trunkus', en: 'Tibioperoneal trunk' },
    text: {
      tr: 'Tibioperoneal trunkus, anterior tibial arter ayrıldıktan sonra popliteal arterin kısa devamıdır. Birkaç santimetre içinde peroneal arter ve posterior tibial artere ayrılır. Şemada kısa ve kalındır.',
      en: 'The tibioperoneal trunk is the short continuation of the popliteal artery after the anterior tibial artery has left. Within a few centimeters it divides into the peroneal and posterior tibial arteries. On the schematic it is short and relatively thick.'
    },
    pearl: {
      tr: 'Trunkus lezyonu hem peroneal hem posterior tibial yatağı kapatır. Anterior tibial arter ayrı çıktığı için açık kalabilir. Oblique veya lateral, trunkus bifürkasyonunu AP\'den daha iyi açar.',
      en: 'A trunk lesion closes both the peroneal and posterior tibial beds. The anterior tibial artery can stay open because it has already left. Oblique or lateral opens the trunk bifurcation better than AP.'
    },
    hit: { x: 456, y: 736 },
    label: { tr: 'TP trunkus', en: 'TP trunk', x: 520, y: 740, to: [460, 740] },
    draw: { map: [line('artery', [AT_ORIGIN, [446, 732], TPT_END], 11)] }
  }),
  S({
    id: 'peroneal',
    view: 'runoff',
    modes: ['map'],
    kind: 'artery',
    name: { tr: 'Peroneal arter', en: 'Peroneal artery' },
    text: {
      tr: 'Peroneal arter tibioperoneal trunkustan çıkar ve fibula boyunca, posterior tibial arter ile anterior tibial arterin arasında iner. Normalde ayak tabanındaki arka kadar devam etmez. Lateral topuğu ve ayak bileği perforanlarını besler.',
      en: 'The peroneal artery leaves the tibioperoneal trunk and descends along the fibula, between the posterior tibial and anterior tibial arteries. It does not normally continue into the plantar arch. It supplies the lateral heel and the ankle perforators.'
    },
    pearl: {
      tr: 'Posterior tibial ve anterior tibial arterler kapalıyken peroneal perforanlar ayağı canlı tutabilir. Distal peroneal artere stent, plantar arkı doğrudan açmaz. Anjiyozom kartındaki lateral topuk bölgesi bu dala aittir.',
      en: 'When the posterior tibial and anterior tibial arteries are closed, peroneal perforators can keep the foot alive. Stenting the distal peroneal artery does not directly open the plantar arch. The lateral-heel zone on the angiosome card belongs to this artery.'
    },
    hit: { x: 390, y: 980 },
    label: { tr: 'A. peronea', en: 'Peroneal', x: 424, y: 960, to: [404, 960] },
    draw: { map: [line('artery', [TPT_END, [430, 880], [392, 1000], [362, 1120]], 8)] }
  }),
  S({
    id: 'posterior-tibial',
    view: 'runoff',
    modes: ['map'],
    kind: 'artery',
    name: { tr: 'Posterior tibial arter', en: 'Posterior tibial artery' },
    text: {
      tr: 'Posterior tibial arter tibioperoneal trunkusun medial devamıdır. Bacakta derin arka kompartmanda, medial malleolün arkasından ayağa iner. Medial ve lateral plantar arterlere ayrılarak tabanı besler. Şemada görüntünün sağındadır.',
      en: 'The posterior tibial artery is the medial continuation of the tibioperoneal trunk. It runs in the deep posterior compartment and passes behind the medial malleolus into the foot. It divides into the medial and lateral plantar arteries. On the schematic it is on image right.'
    },
    pearl: {
      tr: 'Medial malleol arkası nabız, bu damarın yüzeyel işaretidir. Plantar topuk, medial ayak ve lateral orta-ön ayak anjiyozomları büyük ölçüde posterior tibial dallara aittir. Medial kalkaneal dal topuk yarasında hatırlanır.',
      en: 'The pulse behind the medial malleolus is the surface mark of this artery. The plantar heel, medial foot, and lateral midfoot and forefoot angiosomes belong largely to posterior tibial branches. The medial calcaneal branch matters for a heel wound.'
    },
    hit: { x: 530, y: 980 },
    label: { tr: 'A. tibialis post.', en: 'Post. tibial', x: 560, y: 860, to: [530, 940] },
    draw: { map: [line('artery', [TPT_END, [520, 880], [542, 1000], PT_END], 8)] }
  }),
  S({
    id: 'dorsalis-pedis',
    view: 'runoff',
    modes: ['map'],
    kind: 'branch',
    name: { tr: 'Ayak sırtı arteri', en: 'Dorsalis pedis' },
    text: {
      tr: 'Dorsalis pedis, anterior tibial arterin ayak sırtındaki devamıdır. Birinci intermetatarsal aralıktan tabana inen derin plantar dal, lateral plantar arterle plantar arkı tamamlar. Şema bu dönüşü öğretir.',
      en: 'The dorsalis pedis is the continuation of the anterior tibial artery on the dorsum of the foot. Its deep plantar artery descends through the first intermetatarsal space and completes the plantar arch with the lateral plantar artery. The schematic teaches that turn.'
    },
    pearl: {
      tr: 'Ayak sırtı nabzı bu damardır. Yokluğu her zaman oklüzyon değildir. Konjenital olarak ince olabilir veya peroneal perforan dominant olabilir. Plantar ark doluşuna bakın.',
      en: 'The dorsalis pedis pulse is this artery. Absence is not always occlusion. It can be congenitally small, or a peroneal perforator can be dominant. Look at filling of the plantar arch.'
    },
    hit: { x: 228, y: 1148 },
    label: { tr: 'A. dorsalis pedis', en: 'Dorsalis pedis', x: 24, y: 990, to: [236, 1140] },
    draw: { map: [line('branch', [[240, 1120], DP, [232, 1196]], 7)] }
  }),
  S({
    id: 'lateral-plantar',
    view: 'runoff',
    modes: ['map'],
    kind: 'branch',
    name: { tr: 'Lateral plantar arter', en: 'Lateral plantar artery' },
    text: {
      tr: 'Lateral plantar arter posterior tibial arterin daha büyük terminal dalıdır. Tabanı laterale ve öne geçer, derin plantar arkın ana parçası olur. Dorsalis pedisin derin plantar dalı ile birleşir.',
      en: 'The lateral plantar artery is the larger terminal branch of the posterior tibial artery. It crosses the sole laterally and forward and becomes the main part of the deep plantar arch. It meets the deep plantar artery of the dorsalis pedis.'
    },
    pearl: {
      tr: 'Lateral orta ve ön ayak yarasında hedef damar çoğu kez budur. Ark dolmuyorsa hem posterior tibial hem dorsalis pedis yolu düşünülür. Şemadaki kavis ölçeksizdir.',
      en: 'For a lateral midfoot or forefoot wound this is often the target vessel. If the arch does not fill, both the posterior tibial route and the dorsalis pedis route are considered. The curve on the schematic is not to scale.'
    },
    hit: { x: 400, y: 1190 },
    label: { tr: 'A. plantaris lat.', en: 'Lat. plantar', x: 400, y: 1088, to: [470, 1184] },
    draw: { map: [line('branch', [PT_END, [470, 1184], [370, 1210], [280, 1204]])] }
  }),
  S({
    id: 'medial-plantar',
    view: 'runoff',
    modes: ['map'],
    kind: 'branch',
    name: { tr: 'Medial plantar arter', en: 'Medial plantar artery' },
    text: {
      tr: 'Medial plantar arter posterior tibial arterin daha ince terminal dalıdır. Tabanın medial kenarında, ayak kemerinin iç yanında kalır. Başparmak tarafındaki cildi besler.',
      en: 'The medial plantar artery is the smaller terminal branch of the posterior tibial artery. It stays on the medial border of the sole, along the inner side of the instep. It supplies the skin on the great-toe side.'
    },
    pearl: {
      tr: 'Medial ayak ve başparmak tabanı yarasında bu dal hatırlanır. Lateral plantar arter gibi arkın ana gövdesi değildir. Şemada medialde, görüntünün sağında biter.',
      en: 'This branch is the one to remember for a medial foot or great-toe plantar wound. It is not the main stem of the arch the way the lateral plantar artery is. On the schematic it ends medially, on image right.'
    },
    hit: { x: 600, y: 1176 },
    label: { tr: 'A. plantaris med.', en: 'Med. plantar', x: 560, y: 1088, to: [600, 1176] },
    draw: { map: [line('branch', [PT_END, [600, 1176], [640, 1208]])] }
  }),
  S({
    id: 'plantar-arch',
    view: 'runoff',
    modes: ['map'],
    kind: 'branch',
    name: { tr: 'Plantar ark', en: 'Plantar arch' },
    text: {
      tr: 'Derin plantar ark, lateral plantar arter ile dorsalis pedisten inen derin plantar arterin birleşimidir. Metatarsal dallar arkdan çıkar. Şema bu birleşimi ayak tabanında gösterir.',
      en: 'The deep plantar arch is the union of the lateral plantar artery and the deep plantar artery descending from the dorsalis pedis. The metatarsal arteries leave the arch. The schematic shows that union in the sole.'
    },
    pearl: {
      tr: 'Arkın hangi uçtan dolduğu, dizaltı stratejiyi değiştirir. Yalnız peroneal doluş arkı garanti etmez. Tam ark her ayakta görülmez. Çizim tam ark varsayar ve bunu öğretir.',
      en: 'Which end fills the arch changes the below-knee strategy. Peroneal filling alone does not guarantee the arch. A complete arch is not present in every foot. The drawing assumes a complete arch in order to teach it.'
    },
    hit: { x: 250, y: 1210 },
    label: { tr: 'Plantar ark', en: 'Plantar arch', x: 400, y: 1240, to: [250, 1216] },
    draw: { map: [line('branch', [[280, 1204], [250, 1216], [220, 1200], [232, 1196]], 6)] }
  })
];

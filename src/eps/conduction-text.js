// Texts of the conduction system lesson (TR / EN): the structure cards, the "what if" scenarios,
// the summary table, the clinical notes, the corrections to the source schema and the sources.
// Numbers that the model also uses (rates, velocities, supply shares) live in conduction-model.js.

export const CONDUCTION_REFERENCES = Object.freeze([
  { id: 'C1', cite: 'Anderson RH, Ho SY. The architecture of the sinus node, the atrioventricular conduction axis, and the internodal atrial myocardium. J Cardiovasc Electrophysiol 1998;9:1233-1248', doi: '10.1111/j.1540-8167.1998.tb00097.x' },
  { id: 'C2', cite: 'Tretter JT et al. Behind the scenes in the triangle of Koch. Europace 2022;24:455-463', doi: '10.1093/europace/euab285' },
  { id: 'C3', cite: 'Durrer D et al. Total excitation of the isolated human heart. Circulation 1970;41:899-912', doi: '10.1161/01.CIR.41.6.899' },
  { id: 'C4', cite: 'Surawicz B et al. AHA/ACCF/HRS ECG recommendations, part III: intraventricular conduction disturbances. Circulation 2009;119:e235-e240', doi: '10.1161/CIRCULATIONAHA.108.191095' },
  { id: 'C5', cite: 'Bayés de Luna A et al. Interatrial blocks. A separate entity from left atrial enlargement: a consensus report. J Electrocardiol 2012;45:445-451', doi: '10.1016/j.jelectrocard.2012.06.029' },
  { id: 'C6', cite: 'Frink RJ, James TN. Normal blood supply to the human His bundle and proximal bundle branches. Circulation 1973;47:8-18', doi: '10.1161/01.CIR.47.1.8' },
  { id: 'C7', cite: 'Vikse J et al. Anatomical variations in the sinoatrial nodal artery: a meta-analysis. PLoS One 2016;11:e0148331', doi: '10.1371/journal.pone.0148331' },
  { id: 'C8', cite: 'Kusumoto FM et al. 2018 ACC/AHA/HRS bradycardia and conduction delay guideline. Circulation 2019;140:e382-e482', doi: '10.1161/CIR.0000000000000628' },
  { id: 'C9', cite: 'Demoulin JC, Kulbertus HE. Histopathological examination of concept of left hemiblock. Br Heart J 1972;34:807-814', doi: '10.1136/hrt.34.8.807' }
]);

const TR = {
  tab: 'İleti sistemi',
  eyebrow: 'İLETİ SİSTEMİ ANATOMİSİ',
  title: 'SA düğümünden Purkinje ağına: bir atımın yolu',
  intro: 'Gerçek atlas kalbinde ileti sisteminin her parçasına tıklayın: yeri, intrinsik hızı, ileti hızı, EKG karşılığı ve kanlanması kartta açılır. "Bir atım oynat" impulsu SA düğümünden kulakçıklara, AV düğüm gecikmesine, His demetine, dallara ve Purkinje ağına taşır; ventrikül aktivasyonu D2 ve V1 izleriyle eş zamanlı yayılır. Her yapı için "ya bozulursa?" düğmesi bloğun EKG etkisini gösterir.',
  schematicNote: 'İleti yolları atlas kalbin ölçülen geometrisine çizilmiş şematik tüplerdir; histolojik kesit değildir. Ventrikül ve kulakçık renkleri öğretim amaçlı aktivasyon sırasını gösterir.',
  structures: 'Yapılar',
  play: 'Bir atım oynat',
  playing: 'Oynatılıyor…',
  replay: 'Yeniden oynat',
  speed: 'Hız',
  speedOption: (x) => `${x}×`,
  supply: 'Kanlanma katmanı',
  labels: 'Etiketler',
  view3d: '3D atlas',
  view2d: '2D şema',
  views: { anterior: 'Ön', rao: 'RAO 30°', lao: 'LAO 45°', posterior: 'Arka' },
  viewLabel: 'Bakış',
  whatIf: 'Ya bozulursa?',
  whatIfNone: 'Bu yapı için ayrı bir blok senaryosu yok; nedeni kartta.',
  whatIfOn: 'Senaryo açık',
  backToNormal: 'Normal atıma dön',
  scenarioLabel: 'Senaryo',
  intervals: { pr: 'PR', ah: 'AH', hv: 'HV', p: 'P', qrs: 'QRS', rate: 'Hız' },
  intervalsNote: 'AH ve HV, EPS kateterinden (His elektrogramı) ölçülür; yüzey EKG\'sinde görünmez.',
  perMin: '/dk',
  ms: 'ms',
  lead: { II: 'D2', V1: 'V1' },
  traceLabel: 'D2 ve V1 izi, oynatma imleciyle',
  timeLabel: 'Zaman',
  phaseLabel: 'Şu an',
  steps: 'Atımın adımları',
  phases: {
    sa: 'SA düğümü uyarı üretir (yüzey EKG\'sinde görünmez)',
    atria: 'Kulakçıklar: önce RA, sonra Bachmann ile LA (P dalgası)',
    avn: 'AV düğüm gecikmesi (PR segmenti; EPS\'de AH)',
    pause: 'Duraklama: ventriküle uyarı ulaşmıyor, kaçış ritmi bekleniyor',
    his: 'His demeti fibröz iskeleti deler (HV başlar)',
    bundles: 'Sağ dal, sol dal ve fasiküller',
    purkinje: 'Septal lifler ve Purkinje ağı (QRS başlamak üzere)',
    ventricles: 'Ventriküller: septum soldan sağa, apeks, serbest duvarlar endokarttan epikarda, posterobazal en son (QRS)',
    repolarisation: 'Repolarizasyon (ST ve T)'
  },
  regions: { septum: 'Septum (soldan sağa)', apex: 'Apeks ve anteroseptal bölge', rvFree: 'RV serbest duvarı (endokarttan epikarda)', lvFree: 'LV serbest duvarı (endokarttan epikarda)', posterobasal: 'Posterobazal LV ve RVOT (en son)' },
  regionsRL: { septum: 'Septum (sağdan sola, LBBB)' },
  card: { location: 'Yer', rate: 'İntrinsik hız', velocity: 'İleti hızı', ecg: 'EKG karşılığı', supply: 'Kanlanma', function: 'İşlev', note: 'Şemaya düzeltme / not' },
  noPacemaker: 'Normalde pacemaker değildir',
  velocityUnit: 'm/sn',
  arteries: { rca: 'RCA', lcx: 'LCx', lad: 'LAD', regional: 'Bölgesel koroner alan' },
  legend: 'Renkler: RCA kırmızı, LCx mavi, LAD sarı; çizgili yapı çift kanlanma.',
  structure: {
    sa: {
      name: 'Sinüs düğümü (SA)', short: 'SA',
      location: 'Terminal oluk (sulcus terminalis) içinde, SVC ile RA birleşiminin anterolateralinde, epikardın hemen altında; krista terminalisin üst ucu.',
      function: 'Doğal pacemaker. Faz 4 diyastolik depolarizasyonu en hızlı olan hücreler; vagus ve sempatik tonus hızını belirler.',
      ecg: 'Kendi aktivitesi yüzey EKG\'sinde görünmez; P dalgasının başlangıcı kulakçıktan çıkışını gösterir.',
      supply: 'Sinüs düğümü arteri: klasik bilgi %60 RCA, %40 LCx; meta-analizde yaklaşık üçte iki RCA, beşte bir LCx, kalanında her ikisi (Vikse 2016).',
      note: 'Kaynak şemada "üst-arka RA duvarı" deniyor; düğüm aslında SVC-RA birleşiminin anterolateralinde, terminal olukta ve epikarda yakındır. Kalplerin bir kısmında at nalı biçimindedir ve sağ atriyal apendiks tepesinin (krest) iki yanına uzanır.'
    },
    internodal: {
      name: 'Düğümler arası yollar', short: 'İnternodal',
      location: 'RA içinde SA düğümünden AV düğüme: anterior, orta (Wenckebach) ve posterior (Thorel) yollar; krista terminalis ve septal kas boyunca.',
      function: 'Uyarıyı RA kasından AV düğüme hızlıca taşır.',
      ecg: 'P dalgasının ilk yarısı (RA) ve PR\'nin başlangıcı.',
      supply: 'RCA ve LCx\'in atriyal dalları.',
      note: 'Histolojide yalıtılmış özel "yollar" gösterilememiştir; tartışmalıdır. Uyarı, kas liflerinin dizilimi nedeniyle krista terminalis, Bachmann demeti ve septal kas boyunca tercihli olarak hızlı ilerler. Wenckebach ve Thorel adları tarihseldir. Yapıya özgü ayrı bir blok senaryosu bu yüzden yok.'
    },
    bachmann: {
      name: 'Bachmann demeti', short: 'Bachmann',
      location: 'SVC ağzının önünden kulakçıklar arası oluk boyunca LA ön duvarına ve LAA\'ya uzanan epikardiyal kas bandı.',
      function: 'Kulakçıklar arası ana ileti; LA\'nın erken ve eş zamanlı aktivasyonunu sağlar.',
      ecg: 'P dalgasının ikinci yarısı (LA). İletisi yavaşlarsa P ≥ 120 ms ve D2\'de çentikli (kısmi interatriyal blok).',
      supply: 'Çoğunlukla sinüs düğümü arteri ve atriyal dallar (RCA/LCx).',
      note: 'Özel ileti dokusu değil, düzenli dizilmiş çalışan atriyum kasıdır. İleri interatriyal blokta LA aşağıdan, retrograd aktive olur (alt derivasyonlarda ±P).'
    },
    avn: {
      name: 'AV düğüm', short: 'AVN',
      location: 'Koch üçgeninin tepesinde, RA tarafında interatriyal septumda: Todaro tendonu, triküspit septal yaprak tutunması ve koroner sinüs ağzı arasında.',
      function: 'Fizyolojik gecikme: ventriküller kasılmadan önce kulakçık sistolünün ventrikül dolumunu tamamlamasını sağlar; hızlı atriyal ritimlerde ventrikülü korur (dekremental ileti). Kaçış odağı.',
      ecg: 'PR segmentinin büyük kısmı. EPS\'de AH aralığı (normal yaklaşık 50-120 ms); PR 120-200 ms.',
      supply: 'AV düğüm arteri: kalplerin yaklaşık %80-90\'ında RCA (sağ dominans, krux), sol dominansta LCx.',
      note: 'Kaynakta gecikme 0,09-0,12 sn deniyor; bu AH düzeyindedir, PR ise ayrıca atriyum ve His-Purkinje (HV 35-55 ms) iletisini içerir. Fibröz iskeleti delen kısım düğümün kendisi değil, penetran His demetidir.'
    },
    his: {
      name: 'His demeti', short: 'His',
      location: 'AV düğümün devamı; santral fibröz cisim ve membranöz septum içinden geçip musküler septumun tepesine iner (NCC/RCC komissürünün altı).',
      function: 'Kulakçıklar ile ventriküller arasındaki tek normal kas bağlantısı. Yalıtılmıştır, hızlı iletir.',
      ecg: 'Yüzeyde görünmez; His elektrogramı. HV aralığı normal 35-55 ms.',
      supply: 'Ağırlıklı LAD septal perforatörleri, AV düğüm arterinden (RCA) katkı: çift kanlanma.',
      note: 'Aksesuar yollar (WPW) bu kuralın istisnasıdır. His altı (infra-Hisian) blok genellikle geniş ve yavaş kaçış ritmiyle seyreder; intra-Hisian blokta kaçış daha dar olabilir. İkisi de kalıcı pacing gerektirir.'
    },
    rbb: {
      name: 'Sağ dal', short: 'RBB',
      location: 'Septumun sağ yüzünde, endokardın altında iner; septomarjinal trabekülasyon ve moderatör bant ile anterior papiller kas tabanına ulaşır.',
      function: 'RV\'yi aktive eder; ince ve uzundur, bu yüzden kolay bloke olur.',
      ecg: 'QRS\'nin sağ (terminal) kuvvetleri. Blokta V1\'de rSR\', D1 ve V6\'da geniş S, QRS ≥ 120 ms.',
      supply: 'LAD septal perforatörleri (proksimalde AV düğüm arteri katkısı olabilir).',
      note: 'Moderatör bant sağ dalın RV serbest duvarına kısa yoludur; bu yüzden anterior papiller kas ve apikal trabeküler RV erken aktive olur.'
    },
    lbb: {
      name: 'Sol dal (ana gövde)', short: 'LBB',
      location: 'Membranöz septumun altında, septumun sol yüzünde yelpaze gibi açılır; anterior, posterior ve çoğu kalpte septal (median) liflere ayrılır.',
      function: 'LV\'yi ve septumu aktive eder.',
      ecg: 'Septal q dalgası ve normal dar QRS. Blokta septal q kaybolur, V1\'de QS veya rS, D1/V6\'da geniş çentikli R, QRS ≥ 120 ms.',
      supply: 'LAD septal perforatörleri ve AV düğüm arteri (RCA): çift kanlanma.',
      note: 'Üç fasiküllü (trifasiküler) model bir sadeleştirmedir; sol dal gerçekte geniş bir yelpazedir ve fasikül geometrisi kalpten kalbe değişir (Demoulin ve Kulbertus 1972).'
    },
    laf: {
      name: 'Sol anterior fasikül', short: 'LAF',
      location: 'İnce ve uzun; anterosüperior seyirle anterolateral papiller kas tabanına gider.',
      function: 'LV anterosüperior duvarını aktive eder.',
      ecg: 'Frontal aks. Blokta sol aks sapması (-45° ve ötesi), D2-D3-aVF\'de rS, aVL\'de qR.',
      supply: 'Ağırlıkla LAD septal perforatörleri: tek ana kaynak, iskemiye duyarlı.',
      note: 'Tek ana kanlanma ve ince yapı nedeniyle LAFB sık görülen fasiküler bloktur.'
    },
    lpf: {
      name: 'Sol posterior fasikül', short: 'LPF',
      location: 'Kalın ve kısa; posteroinferior seyirle posteromedial papiller kas tabanına gider.',
      function: 'LV inferoposterior duvarını aktive eder.',
      ecg: 'Blokta sağ aks sapması (+90° ile +180°), D1\'de rS, D3\'te qR (RVH ve lateral MI dışlanmalı).',
      supply: 'Çift kanlanma: LAD septal perforatörleri ve PDA (sağ dominantta RCA).',
      note: 'Kalın yapı ve çift kanlanma nedeniyle izole LPFB nadirdir; görülürse yaygın hastalık düşündürür.'
    },
    septal: {
      name: 'Septal lifler', short: 'Septal',
      location: 'Sol dalın septumun orta sol yüzüne dağılan erken lifleri.',
      function: 'Ventriküllerde ilk aktive olan bölge: septum soldan sağa depolarize olur.',
      ecg: 'D1, aVL, V5-V6\'da küçük septal q; V1\'de küçük başlangıç r dalgası.',
      supply: 'LAD septal perforatörleri.',
      note: 'Sol dal bloğunda septum sağdan sola aktive olur ve septal q kaybolur. İzole sol septal fasikül bloğu tartışmalıdır; ayrı senaryo yok, LBBB senaryosuna bakın.'
    },
    purkinje: {
      name: 'Purkinje ağı', short: 'Purkinje',
      location: 'Her iki ventrikülde endokardın altında yaygın ağ; apeks ve orta bölgede yoğun, bazal posterior LV ve RVOT\'ta seyrek.',
      function: 'En hızlı ileti: ventrikülleri neredeyse eş zamanlı aktive eder. Aktivasyon endokarttan epikarda ilerler.',
      ecg: 'Dar QRS (< 120 ms) ve QRS başlangıcı. Kaçış ritmi geniş QRS, 20-40/dk.',
      supply: 'Bulunduğu bölgenin koroner dalı; endokarda yakınlığı nedeniyle kavite kanından da beslenir.',
      note: 'Purkinje lifinin azaldığı posterobazal LV ve RVOT en son aktive olur (Durrer 1970).'
    }
  },
  scenario: {
    normal: { name: 'Normal sinüs atımı', effect: 'PR 160 ms, P 100 ms, QRS 90 ms; septal q D2\'de, küçük r V1\'de.' },
    sinusArrest: { name: 'Sinüs arresti', effect: 'SA düğümü uyarı üretmez: P yok. AV kavşaktan dar QRS\'li kaçış (40-60/dk); kulakçıklar retrograd aktive olur, D2\'de QRS sonrası ters P.' },
    interatrialBlock: { name: 'Kısmi interatriyal blok (Bachmann)', effect: 'Bachmann demetinde ileti yavaşlar, LA geç aktive olur: P ≥ 120 ms, D2\'de çift tümsekli; PR ve QRS değişmez. İleri blokta LA aşağıdan aktive olur ve alt derivasyonlarda P ±\'dir.' },
    firstDegree: { name: '1. derece AV blok', effect: 'AV düğümde ileti yavaşlar: PR 280 ms (AH uzar), HV ve QRS normal; her P iletilir.' },
    hisBlock: { name: 'His altı (infra-Hisian) tam blok', effect: 'Uyarı His\'i geçer ama iki dalda da durur: P\'ler 75/dk ile sürer, ventriküle iletilmez. Purkinje kaçışı 35/dk, geniş QRS (160 ms).' },
    rbbb: { name: 'Sağ dal bloğu', effect: 'RV septumdan geçerek geç aktive olur: QRS 140 ms, V1\'de rSR\', D2\'de geniş terminal S.' },
    lbbb: { name: 'Sol dal bloğu', effect: 'Septum sağdan sola, LV en son: QRS 150 ms, septal q yok, V1\'de geniş QS, D2\'de pozitif, sıklıkla çentikli R ve diskordan T. Klasik geniş çentikli R D1, aVL, V5-V6\'dadır.' },
    lafb: { name: 'Sol anterior fasikül bloğu', effect: 'Anterosüperior LV posterior fasikülden geç aktive olur: QRS 100 ms, D2\'de rS (sol aks sapması).' },
    lpfb: { name: 'Sol posterior fasikül bloğu', effect: 'İnferoposterior LV anterior fasikülden geç aktive olur: QRS 100 ms, D2\'de qR ve yüksek R (sağ aks sapması).' }
  },
  tableTitle: 'Özet tablo',
  tableHead: ['Yapı', 'Yer', 'İntrinsik hız', 'İleti hızı', 'İşlev', 'EKG karşılığı'],
  ventricularTitle: 'Ventrikül depolarizasyon sırası',
  ventricularOrder: [
    'Septum soldan sağa (sol dal septal lifleri): D1, aVL, V5-V6\'da septal q, V1\'de küçük r.',
    'Apeks ve anteroseptal bölge (Purkinje ağı en yoğun).',
    'Serbest duvarlar, endokarttan epikarda (Purkinje-kas bağlantıları endokardın altında).',
    'Posterobazal LV ve RVOT en son (Purkinje lifi az).'
  ],
  clinicalTitle: 'Klinik notlar: koroner kanlanma',
  clinical: [
    'İnferior MI (RCA): AV düğüm iskemisi ve vagal etki. Sinüs bradikardisi, 1. derece blok, Wenckebach, hatta dar QRS\'li kaçışla tam blok görülebilir; çoğu geçicidir, günler içinde düzelir.',
    'Anterior MI (LAD): His altı hasar. RBBB, LAFB, bifasiküler blok; Mobitz II veya geniş ve yavaş kaçışlı tam blok büyük infarktı gösterir, prognoz kötüdür, çoğu zaman kalıcı pacing gerekir.',
    'SA düğüm arteri RCA veya LCx\'ten çıktığından inferior ve lateral MI\'da sinüs düğümü disfonksiyonu olabilir.',
    'LPF\'nin çift kanlanması nedeniyle izole LPFB nadirdir; LAF ağırlıkla LAD\'den beslendiği için LAFB sıktır.'
  ],
  correctionsTitle: 'Kaynak şemaya yapılan düzeltmeler',
  corrections: [
    'SA düğümü: "üst-arka RA duvarı" yerine SVC-RA birleşiminin anterolateralinde, terminal olukta, epikarda yakın (Anderson ve Ho 1998).',
    'Düğümler arası yollar: yalıtılmış histolojik yollar gösterilmemiştir; ileti krista terminalis, Bachmann demeti ve septal kas boyunca tercihli ilerler.',
    'AV düğüm gecikmesi 0,09-0,12 sn, EPS\'de AH aralığına karşılık gelir (Koch üçgeni ve AV ekseni: Tretter 2022); PR (120-200 ms) atriyum ve His-Purkinje iletisini de içerir.',
    'Fibröz iskeleti delen yapı penetran His demetidir; AV ileti ekseni (düğüm + His) tek normal kas bağlantısıdır, aksesuar yollar istisnadır.',
    'Sol dal üç ayrı kablo değil bir yelpazedir; çoğu kalpte septal (median) lifler de vardır (Demoulin ve Kulbertus 1972).',
    'Sağ dal moderatör bantla RV apeksine değil, anterior papiller kas tabanına ulaşır.',
    'His, RBB ve LAF ağırlıkla LAD septal perforatörlerinden; LPF çift (LAD + PDA) kanlanır (Frink ve James 1973).'
  ],
  sourcesTitle: 'Kaynaklar',
  loading: 'Atlas kalbi yükleniyor…',
  failed: '3D atlas açılamadı; aynı etkileşimler 2D şemada.',
  fallback: 'WebGL kullanılamıyor; 2D şema gösteriliyor.',
  canvasLabel: 'Döndürülebilir 3D atlas kalbi ve ileti sistemi. Aynı seçimler yandaki yapı listesinden yapılabilir.',
  diagramLabel: 'İleti sisteminin 2D önden şeması. Yapılara tıklanabilir.',
  dragHint: 'Sürükle: döndür · Tekerlek / iki parmak: yakınlaştır · Tıkla: yapı seç',
  disclaimer: 'Öğretim amaçlı sentetik model; değerler normal aralıklardan seçilmiştir, tanıda kullanılmaz.'
};

const EN = {
  tab: 'Conduction system',
  eyebrow: 'CONDUCTION SYSTEM ANATOMY',
  title: 'From the SA node to the Purkinje network: the path of one beat',
  intro: 'Click any part of the conduction system on the real atlas heart: the card opens its location, intrinsic rate, conduction velocity, ECG correlate and blood supply. "Play one beat" carries the impulse from the SA node over the atria, through the AV nodal delay, the His bundle, the bundle branches and the Purkinje network; ventricular activation spreads in step with the lead II and V1 traces. The "what if" toggle of each structure shows the ECG effect of its block.',
  schematicNote: 'The conduction paths are schematic tubes drawn on the measured geometry of the atlas heart, not histological sections. Atrial and ventricular colours show the teaching activation order.',
  structures: 'Structures',
  play: 'Play one beat',
  playing: 'Playing…',
  replay: 'Play again',
  speed: 'Speed',
  speedOption: (x) => `${x}×`,
  supply: 'Blood supply overlay',
  labels: 'Labels',
  view3d: '3D atlas',
  view2d: '2D diagram',
  views: { anterior: 'Anterior', rao: 'RAO 30°', lao: 'LAO 45°', posterior: 'Posterior' },
  viewLabel: 'View',
  whatIf: 'What if it fails?',
  whatIfNone: 'No separate block scenario for this structure; the card says why.',
  whatIfOn: 'Scenario on',
  backToNormal: 'Back to the normal beat',
  scenarioLabel: 'Scenario',
  intervals: { pr: 'PR', ah: 'AH', hv: 'HV', p: 'P', qrs: 'QRS', rate: 'Rate' },
  intervalsNote: 'AH and HV are measured on the EPS catheter (His electrogram); the surface ECG does not show them.',
  perMin: '/min',
  ms: 'ms',
  lead: { II: 'II', V1: 'V1' },
  traceLabel: 'Lead II and V1 traces with the playback cursor',
  timeLabel: 'Time',
  phaseLabel: 'Now',
  steps: 'Steps of the beat',
  phases: {
    sa: 'The SA node fires (invisible on the surface ECG)',
    atria: 'Atria: the RA first, then the LA through Bachmann\'s bundle (P wave)',
    avn: 'AV nodal delay (PR segment; AH on the EPS catheter)',
    pause: 'Pause: no impulse reaches the ventricles, waiting for an escape rhythm',
    his: 'The His bundle pierces the fibrous skeleton (HV starts)',
    bundles: 'Right bundle, left bundle and fascicles',
    purkinje: 'Septal fibres and the Purkinje network (QRS about to start)',
    ventricles: 'Ventricles: septum left to right, apex, free walls endocardium to epicardium, posterobasal last (QRS)',
    repolarisation: 'Repolarisation (ST and T)'
  },
  regions: { septum: 'Septum (left to right)', apex: 'Apex and anteroseptal region', rvFree: 'RV free wall (endocardium to epicardium)', lvFree: 'LV free wall (endocardium to epicardium)', posterobasal: 'Posterobasal LV and RVOT (last)' },
  regionsRL: { septum: 'Septum (right to left, LBBB)' },
  card: { location: 'Location', rate: 'Intrinsic rate', velocity: 'Conduction velocity', ecg: 'ECG correlate', supply: 'Blood supply', function: 'Function', note: 'Correction / note on the schema' },
  noPacemaker: 'Not a pacemaker normally',
  velocityUnit: 'm/s',
  arteries: { rca: 'RCA', lcx: 'LCx', lad: 'LAD', regional: 'Regional coronary territory' },
  legend: 'Colours: RCA red, LCx blue, LAD yellow; a striped structure has a dual supply.',
  structure: {
    sa: {
      name: 'Sinus node (SA)', short: 'SA',
      location: 'In the terminal groove (sulcus terminalis), at the anterolateral junction of the SVC with the RA, just under the epicardium; the upper end of the crista terminalis.',
      function: 'The natural pacemaker: the cells with the fastest phase 4 diastolic depolarisation; vagal and sympathetic tone set its rate.',
      ecg: 'Its own activity is invisible on the surface ECG; the P onset marks the exit to the atrium.',
      supply: 'Sinus node artery: classically 60% RCA, 40% LCx; a meta-analysis found about two thirds RCA, one fifth LCx and both in the rest (Vikse 2016).',
      note: 'The source schema says "upper posterior RA wall"; the node lies anterolaterally at the SVC-RA junction, in the terminal groove close to the epicardium. In some hearts it is horseshoe-shaped, draped across the crest of the right atrial appendage.'
    },
    internodal: {
      name: 'Internodal routes', short: 'Internodal',
      location: 'Within the RA from the SA node to the AV node: anterior, middle (Wenckebach) and posterior (Thorel) routes, along the crista terminalis and the septal muscle.',
      function: 'Carry the impulse quickly through the RA muscle to the AV node.',
      ecg: 'The first half of the P wave (RA) and the start of PR.',
      supply: 'Atrial branches of the RCA and LCx.',
      note: 'Insulated specialised "tracts" have not been shown histologically and remain debated. Conduction is preferential because of fibre orientation along the crista terminalis, Bachmann\'s bundle and the septal muscle. Wenckebach and Thorel are historical names. Because these tracts are debated, there is no separate block scenario.'
    },
    bachmann: {
      name: 'Bachmann\'s bundle', short: 'Bachmann',
      location: 'Epicardial muscle band from in front of the SVC mouth along the interatrial groove to the anterior LA wall and the LAA.',
      function: 'The main interatrial connection: early and synchronous LA activation.',
      ecg: 'The second half of the P wave (LA). When its conduction slows, P ≥ 120 ms and notched in II (partial interatrial block).',
      supply: 'Mostly the sinus node artery and atrial branches (RCA/LCx).',
      note: 'Not specialised conduction tissue but well-aligned working atrial muscle. In advanced interatrial block the LA is activated retrogradely from below (±P in the inferior leads).'
    },
    avn: {
      name: 'AV node', short: 'AVN',
      location: 'At the apex of Koch\'s triangle, on the RA side of the interatrial septum, between the tendon of Todaro, the septal tricuspid leaflet hinge and the coronary sinus mouth.',
      function: 'Physiological delay that lets atrial systole complete ventricular filling before the ventricles contract; protects the ventricles from fast atrial rhythms (decremental conduction). An escape focus.',
      ecg: 'Most of the PR segment. AH interval on EPS (normal about 50-120 ms); PR 120-200 ms.',
      supply: 'AV nodal artery: the RCA in about 80-90% of hearts (right dominance, crux), the LCx in left dominance.',
      note: 'The source gives a delay of 0.09-0.12 s; that is the AH range, while PR also includes atrial and His-Purkinje conduction (HV 35-55 ms). The part that pierces the fibrous skeleton is the penetrating His bundle, not the node itself.'
    },
    his: {
      name: 'His bundle', short: 'His',
      location: 'Continues the AV node through the central fibrous body and the membranous septum onto the crest of the muscular septum (under the NCC/RCC commissure).',
      function: 'The only normal muscular connection between atria and ventricles; insulated and fast.',
      ecg: 'Invisible on the surface; His electrogram. HV interval normally 35-55 ms.',
      supply: 'Mainly LAD septal perforators, with a contribution from the AV nodal artery (RCA): dual supply.',
      note: 'Accessory pathways (WPW) are the exception to this rule. Infra-Hisian block usually comes with a wide slow escape rhythm; in intra-Hisian block the escape can be narrower. Both need permanent pacing.'
    },
    rbb: {
      name: 'Right bundle branch', short: 'RBB',
      location: 'Descends under the endocardium on the right side of the septum; through the septomarginal trabeculation and the moderator band to the base of the anterior papillary muscle.',
      function: 'Activates the RV; thin and long, so it blocks easily.',
      ecg: 'The right (terminal) QRS forces. With block, rSR\' in V1, broad S in I and V6, QRS ≥ 120 ms.',
      supply: 'LAD septal perforators (the AV nodal artery may add proximally).',
      note: 'The moderator band is the short route of the right bundle to the RV free wall, so the anterior papillary muscle and the apical trabecular RV activate early.'
    },
    lbb: {
      name: 'Left bundle branch (trunk)', short: 'LBB',
      location: 'Below the membranous septum, fans out on the left side of the septum into anterior, posterior and, in most hearts, septal (median) fibres.',
      function: 'Activates the LV and the septum.',
      ecg: 'The septal q wave and the normal narrow QRS. With block, no septal q, QS or rS in V1, broad notched R in I/V6, QRS ≥ 120 ms.',
      supply: 'LAD septal perforators and the AV nodal artery (RCA): dual supply.',
      note: 'The trifascicular model is a simplification; the left bundle is a broad fan and the fascicle geometry varies between hearts (Demoulin and Kulbertus 1972).'
    },
    laf: {
      name: 'Left anterior fascicle', short: 'LAF',
      location: 'Thin and long; runs anterosuperiorly to the base of the anterolateral papillary muscle.',
      function: 'Activates the anterosuperior LV wall.',
      ecg: 'Frontal axis. With block, left axis deviation (-45° or beyond), rS in II, III, aVF, qR in aVL.',
      supply: 'Mainly the LAD septal perforators: one main source, vulnerable to ischaemia.',
      note: 'One main supply and a thin structure make LAFB the common fascicular block.'
    },
    lpf: {
      name: 'Left posterior fascicle', short: 'LPF',
      location: 'Thick and short; runs posteroinferiorly to the base of the posteromedial papillary muscle.',
      function: 'Activates the inferoposterior LV wall.',
      ecg: 'With block, right axis deviation (+90° to +180°), rS in I, qR in III (exclude RVH and lateral MI).',
      supply: 'Dual: LAD septal perforators and the PDA (the RCA in right-dominant hearts).',
      note: 'Its thickness and dual supply make isolated LPFB rare; when present it suggests extensive disease.'
    },
    septal: {
      name: 'Septal fibres', short: 'Septal',
      location: 'Early fibres of the left bundle to the mid left septal surface.',
      function: 'The first ventricular region to activate: the septum depolarises from left to right.',
      ecg: 'Small septal q in I, aVL, V5-V6; small initial r in V1.',
      supply: 'LAD septal perforators.',
      note: 'In left bundle branch block the septum activates right to left and the septal q disappears. Isolated left septal fascicular block is debated; no separate scenario, see LBBB.'
    },
    purkinje: {
      name: 'Purkinje network', short: 'Purkinje',
      location: 'A wide subendocardial network in both ventricles; dense at the apex and mid region, sparse in the basal posterior LV and the RVOT.',
      function: 'The fastest conduction: activates the ventricles almost at once. Activation runs from endocardium to epicardium.',
      ecg: 'The narrow QRS (< 120 ms) and its onset. Escape rhythm: wide QRS, 20-40/min.',
      supply: 'The coronary branch of its region; close to the endocardium, it also draws on cavity blood.',
      note: 'The posterobasal LV and the RVOT, where Purkinje fibres are few, activate last (Durrer 1970).'
    }
  },
  scenario: {
    normal: { name: 'Normal sinus beat', effect: 'PR 160 ms, P 100 ms, QRS 90 ms; septal q in II, small r in V1.' },
    sinusArrest: { name: 'Sinus arrest', effect: 'The SA node does not fire: no P. Junctional escape with a narrow QRS (40-60/min); the atria activate retrogradely, an inverted P after the QRS in II.' },
    interatrialBlock: { name: 'Partial interatrial block (Bachmann)', effect: 'Slowed conduction in Bachmann\'s bundle, the LA activates late: P ≥ 120 ms, bifid in II; PR and QRS unchanged. In advanced block the LA is reached from below and P is ± in the inferior leads.' },
    firstDegree: { name: 'First-degree AV block', effect: 'Slower AV nodal conduction: PR 280 ms (long AH), normal HV and QRS; every P conducts.' },
    hisBlock: { name: 'Infra-Hisian complete block', effect: 'The impulse passes the His bundle but stops in both bundle branches: P waves go on at 75/min and do not reach the ventricles. Purkinje escape at 35/min, wide QRS (160 ms).' },
    rbbb: { name: 'Right bundle branch block', effect: 'The RV activates late across the septum: QRS 140 ms, rSR\' in V1, broad terminal S in II.' },
    lbbb: { name: 'Left bundle branch block', effect: 'Septum right to left, the LV last: QRS 150 ms, no septal q, broad QS in V1, a positive, often notched R and discordant T in II. The classic broad notched R is in I, aVL, V5-V6.' },
    lafb: { name: 'Left anterior fascicular block', effect: 'The anterosuperior LV activates late through the posterior fascicle: QRS 100 ms, rS in II (left axis deviation).' },
    lpfb: { name: 'Left posterior fascicular block', effect: 'The inferoposterior LV activates late through the anterior fascicle: QRS 100 ms, qR and a tall R in II (right axis deviation).' }
  },
  tableTitle: 'Summary table',
  tableHead: ['Structure', 'Location', 'Intrinsic rate', 'Conduction velocity', 'Function', 'ECG correlate'],
  ventricularTitle: 'Order of ventricular depolarisation',
  ventricularOrder: [
    'Septum left to right (septal fibres of the left bundle): septal q in I, aVL, V5-V6, small r in V1.',
    'Apex and anteroseptal region (where the Purkinje network is densest).',
    'Free walls, endocardium to epicardium (the Purkinje-muscle junctions are subendocardial).',
    'Posterobasal LV and RVOT last (few Purkinje fibres).'
  ],
  clinicalTitle: 'Clinical notes: coronary supply',
  clinical: [
    'Inferior MI (RCA): AV nodal ischaemia and vagal effect. Sinus bradycardia, first-degree block, Wenckebach, even complete block with a narrow junctional escape; mostly transient, resolving within days.',
    'Anterior MI (LAD): damage below the His bundle. RBBB, LAFB, bifascicular block; Mobitz II or complete block with a wide slow escape marks a large infarct, a poor prognosis and often the need for permanent pacing.',
    'The sinus node artery arises from the RCA or the LCx, so inferior and lateral MI can cause sinus node dysfunction.',
    'The dual supply of the LPF makes isolated LPFB rare; the LAF depends mainly on the LAD, so LAFB is common.'
  ],
  correctionsTitle: 'Corrections made to the source schema',
  corrections: [
    'SA node: not the "upper posterior RA wall" but anterolateral at the SVC-RA junction, in the terminal groove, close to the epicardium (Anderson and Ho 1998).',
    'Internodal routes: insulated histological tracts have not been shown; conduction is preferential along the crista terminalis, Bachmann\'s bundle and the septal muscle.',
    'The AV nodal delay of 0.09-0.12 s matches the AH interval on EPS (Koch\'s triangle and the AV axis: Tretter 2022); PR (120-200 ms) also includes atrial and His-Purkinje conduction.',
    'The structure that pierces the fibrous skeleton is the penetrating His bundle; the AV conduction axis (node + His) is the only normal muscular connection, accessory pathways are the exception.',
    'The left bundle is a fan, not three separate cables; most hearts also have septal (median) fibres (Demoulin and Kulbertus 1972).',
    'The right bundle reaches the base of the anterior papillary muscle through the moderator band, not the RV apex itself.',
    'His, RBB and LAF are supplied mainly by the LAD septal perforators; the LPF has a dual supply (LAD + PDA) (Frink and James 1973).'
  ],
  sourcesTitle: 'Sources',
  loading: 'Loading the atlas heart…',
  failed: 'The 3D atlas could not open; the same interactions are on the 2D diagram.',
  fallback: 'WebGL unavailable; showing the 2D diagram.',
  canvasLabel: 'Rotatable 3D atlas heart and conduction system. The same selections are available in the structure list beside it.',
  diagramLabel: 'Anterior 2D diagram of the conduction system. Structures can be clicked.',
  dragHint: 'Drag: rotate · Wheel / two fingers: zoom · Click: select a structure',
  disclaimer: 'Synthetic teaching model; values chosen from normal ranges, not for diagnosis.'
};

export const CONDUCTION_TEXT = Object.freeze({ tr: TR, en: EN });

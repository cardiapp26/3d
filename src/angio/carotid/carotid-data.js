export const word = (tr, en) => ({ tr, en });

export const VIEW_DEFS = [
  { id: 'arch', label: word('Aort arkı', 'Aortic arch'), short: word('Ark', 'Arch') },
  { id: 'cervical', label: word('Servikal karotis', 'Cervical carotid'), short: word('Boyun', 'Neck') },
  { id: 'ica', label: word('İKA segmentleri', 'ICA segments'), short: word('İKA', 'ICA') },
  { id: 'circle', label: word('Willis poligonu', 'Circle of Willis'), short: word('Willis', 'Willis') },
  { id: 'stenosis', label: word('Darlık ve stent', 'Stenosis and stenting'), short: word('Stent', 'Stent') }
];

export const SHELL_TEXT = {
  tr: {
    title: 'Cardia · Karotis ve Serebral Anjiyografi',
    eyebrow: 'Girişimsel anatomi laboratuvarı',
    heading: 'Karotis ve serebral anjiyografi',
    intro: 'Arktan intrakraniyal dolaşıma uzanan, özgün ve etkileşimli şematik öğretim geometrisi.',
    tabs: 'Anjiyografi görünümleri',
    detail: 'Yapı ayrıntısı',
    selectPrompt: 'Adını, anatomisini ve anjiyografik önemini görmek için bir damara dokunun.',
    anatomy: 'Anatomi',
    pearl: 'Anjiyografik önem',
    schematic: 'Şematik öğretim geometrisi',
    references: 'Kaynaklar',
    disclaimer: 'Şematik öğretim çizimidir, hasta görüntülemesi değildir; eğitim amaçlıdır.',
    projection: 'Projeksiyon',
    archType: 'Girişimsel ark tipi',
    variant: 'Dallanma varyantı',
    hover: 'Yapı adı',
    calculate: 'Hesapla'
  },
  en: {
    title: 'Cardia · Carotid and Cerebral Angiography',
    eyebrow: 'Interventional anatomy lab',
    heading: 'Carotid and cerebral angiography',
    intro: 'Original interactive schematic teaching geometry from aortic arch to intracranial circulation.',
    tabs: 'Angiography views',
    detail: 'Structure detail',
    selectPrompt: 'Select a vessel to see its name, anatomy, and angiographic relevance.',
    anatomy: 'Anatomy',
    pearl: 'Angiographic relevance',
    schematic: 'Schematic teaching geometry',
    references: 'References',
    disclaimer: 'Schematic teaching drawing, not patient imaging; for education.',
    projection: 'Projection',
    archType: 'Interventional arch type',
    variant: 'Branching variant',
    hover: 'Structure name',
    calculate: 'Calculate'
  }
};

const structure = (id, view, label, description, pearl, geometry = {}) => ({
  id, view, label, description, pearl, geometry
});

export const STRUCTURES = [
  structure('ascending-aorta', 'arch', word('Çıkan aorta', 'Ascending aorta'),
    word('Aort kökünden arkın dış kavsine yükselen ana damar.', 'Main vessel rising from the aortic root to the outer curve of the arch.'),
    word('Ark aortografisi dalların kökenini ve kateter yolunu tanımlar.', 'Arch aortography defines branch origins and catheter route.'),
    { kind: 'path', d: 'M112 278 C78 220 80 133 137 88 C189 47 289 52 333 105', width: 28 }),
  structure('bct', 'arch', word('Brakiyosefalik trunkus', 'Brachiocephalic trunk'),
    word('Normal soldan arkta ilk daldır; sağ ortak karotis ve sağ subklaviana ayrılır.', 'First branch of a normal left arch, dividing into right common carotid and right subclavian arteries.'),
    word('Köken yüksekliği ark tipi sınıflamasında referanstır.', 'Origin height anchors interventional arch type classification.'),
    { kind: 'path', d: 'M183 68 C180 45 166 28 142 16', width: 15 }),
  structure('rcca', 'arch', word('Sağ ortak karotis', 'Right common carotid'),
    word('Brakiyosefalik bifurkasyondan boyuna yükselir.', 'Ascends from the brachiocephalic bifurcation into the neck.'),
    word('Sağ karotis seçimi brakiyosefalik köken açısına bağlıdır.', 'Right carotid selection depends on brachiocephalic origin angle.'),
    { kind: 'path', d: 'M142 17 L118 -8', width: 11 }),
  structure('rsub', 'arch', word('Sağ subklavian arter', 'Right subclavian artery'),
    word('Brakiyosefalik trunkusun lateral dalıdır.', 'Lateral branch of the brachiocephalic trunk.'),
    word('Sağ vertebral arter genellikle proksimal segmentinden doğar.', 'Right vertebral artery usually arises from its proximal segment.'),
    { kind: 'path', d: 'M142 17 C110 23 82 31 55 49', width: 11 }),
  structure('lcca', 'arch', word('Sol ortak karotis', 'Left common carotid'),
    word('Normal arkta brakiyosefalik trunkus ile sol subklavian arasında ikinci daldır.', 'Second branch of the normal arch between brachiocephalic and left subclavian arteries.'),
    word('Ortak köken veya BCT kökenli varyantlarda seçim açısı keskinleşebilir.', 'A common origin or BCT origin can create a sharper selection angle.'),
    { kind: 'path', d: 'M237 61 C239 36 238 13 235 -9', width: 12 }),
  structure('lsub', 'arch', word('Sol subklavian arter', 'Left subclavian artery'),
    word('Normal arkın üçüncü dalıdır.', 'Third branch of a normal left arch.'),
    word('Sol vertebral kökeni ve posterior dolaşım erişimi için izlenir.', 'Followed for left vertebral origin and posterior circulation access.'),
    { kind: 'path', d: 'M290 76 C312 52 339 36 373 28', width: 12 }),
  structure('vertebrals', 'arch', word('Vertebral arterler', 'Vertebral arteries'),
    word('Genellikle her iki subklavian arterin ilk kısmından doğar ve servikal foraminalarda yükselir.', 'Usually arise from first part of each subclavian artery and ascend through cervical foramina.'),
    word('Sol vertebral arter doğrudan arktan çıkabilir.', 'Left vertebral artery may arise directly from the arch.'),
    { kind: 'path', d: 'M319 51 C320 24 312 5 301 -12 M87 34 C83 14 88 -2 99 -17', width: 7 }),

  structure('cca', 'cervical', word('Ortak karotis arter', 'Common carotid artery'),
    word('Karotis bifurkasyonuna kadar dal vermeden yükselir.', 'Ascends without branches to the carotid bifurcation.'),
    word('Bifurkasyon çoğunlukla C3–C4, tiroid kartilaj üst kenarı yakınındadır; düzey değişkendir.', 'Bifurcation is commonly near C3–C4 and upper thyroid cartilage border, with variable level.'),
    { kind: 'path', d: 'M196 324 C194 260 194 206 195 157', width: 18 }),
  structure('bulb', 'cervical', word('Karotis bulbusu', 'Carotid bulb'),
    word('İKA başlangıcındaki fizyolojik genişlemedir.', 'Physiologic widening at the ICA origin.'),
    word('Aterosklerotik plak ve NASCET darlık ölçümünün sık hedefidir.', 'Frequent site of atherosclerotic plaque and NASCET stenosis measurement.'),
    { kind: 'ellipse', cx: 184, cy: 137, rx: 17, ry: 27 }),
  structure('cervical-ica', 'cervical', word('Servikal iç karotis arter', 'Cervical internal carotid artery'),
    word('Servikal dal vermez; başlangıçta posterolateral, yukarıda daha medial seyreder.', 'Has no cervical branches, initially posterolateral and more medial superiorly.'),
    word('Dal vermeyen daha geniş arka damar İKA lehinedir.', 'A branchless, usually larger posterior vessel favors ICA.'),
    { kind: 'path', d: 'M184 123 C173 91 172 52 187 15', width: 13 }),
  ...[
    ['sup-thyroid', 'Superior tiroid arter', 'Superior thyroid artery', 171, 145],
    ['asc-pharyngeal', 'Asendan faringeal arter', 'Ascending pharyngeal artery', 217, 129],
    ['lingual', 'Lingual arter', 'Lingual artery', 232, 112],
    ['facial', 'Fasiyal arter', 'Facial artery', 244, 91],
    ['occipital', 'Oksipital arter', 'Occipital artery', 229, 72],
    ['post-auricular', 'Posterior auriküler arter', 'Posterior auricular artery', 238, 52],
    ['maxillary', 'Maksiller arter', 'Maxillary artery', 254, 31],
    ['superficial-temporal', 'Süperfisiyal temporal arter', 'Superficial temporal artery', 232, 12]
  ].map(([id, tr, en, x, y], index) => structure(id, 'cervical', word(tr, en),
    word(`EKA'nın ${index + 1}. klasik dalıdır.`, `Classic ECA branch ${index + 1} in order.`),
    word('EKA dal paterni, EKA ile dalsız İKA ayrımını destekler.', 'ECA branching pattern helps distinguish it from branchless ICA.'),
    { kind: 'branch', x, y, index })),

  ...[
    ['c1', 'C1 Servikal', 'C1 Cervical', 'Karotis bifurkasyonundan karotis kanalına kadar.', 'From carotid bifurcation to carotid canal.', 'Servikal dal yoktur.', 'No cervical branches.'],
    ['c2', 'C2 Petröz', 'C2 Petrous', 'Temporal kemik karotis kanalı içindeki dikey ve yatay seyir.', 'Vertical and horizontal course in petrous carotid canal.', 'Karotikotimpanik ve vidian dalları olabilir.', 'Caroticotympanic and vidian branches may arise.'],
    ['c3', 'C3 Laserum', 'C3 Lacerum', 'Foramen laserum üzerindeki kısa segment.', 'Short segment over foramen lacerum.', 'Arter foramen laserumu katetmez, üstünden geçer.', 'Artery passes over, not through, foramen lacerum.'],
    ['c4', 'C4 Kavernöz', 'C4 Cavernous', 'Kavernöz sinüs içinde karotis sifonunun ana kıvrımı.', 'Main carotid siphon curve within cavernous sinus.', 'Meningohipofizyal trunkus ve inferolateral trunkus dalları.', 'Meningohypophyseal trunk and inferolateral trunk branches.'],
    ['c5', 'C5 Klinoid', 'C5 Clinoid', 'Proksimal ve distal dural halkalar arasındaki kısa segment.', 'Short segment between proximal and distal dural rings.', 'Ekstradural-intradural geçiş için kritik sınır.', 'Critical extradural to intradural transition.'],
    ['c6', 'C6 Oftalmik', 'C6 Ophthalmic', 'Distal dural halkadan PComm kökenine kadar.', 'From distal dural ring to PComm origin.', 'Oftalmik ve süperior hipofizyal arterler.', 'Ophthalmic and superior hypophyseal arteries.'],
    ['c7', 'C7 Komünike', 'C7 Communicating', 'PComm kökeninden terminal İKA bifurkasyonuna kadar.', 'From PComm origin to terminal ICA bifurcation.', 'PComm ve anterior koroidal dallardan sonra ACA ve MCA terminal dalları.', 'PComm and anterior choroidal branches precede terminal ACA and MCA.']
  ].map(([id, tr, en, dtr, den, ptr, pen], index) => structure(id, 'ica', word(tr, en), word(dtr, den), word(ptr, pen), { kind: 'segment', index })),

  ...[
    ['a1', 'ACA A1', 'ACA A1', 'Terminal İKA ile AComm arasındaki prekomünike segment.', 'Precommunicating segment from terminal ICA to AComm.', 'Hipoplazi, karşı taraftan AComm doluşunu belirleyebilir.', 'Hypoplasia can determine cross-filling through AComm.'],
    ['acomm', 'Anterior komünikan arter', 'Anterior communicating artery', 'İki A1 segmentini birleştirir.', 'Connects both A1 segments.', 'Kollateral dolaşım ve anevrizma değerlendirmesinde anahtar.', 'Key for collateral flow and aneurysm assessment.'],
    ['a2', 'ACA A2', 'ACA A2', 'AComm distalindeki postkomünike ACA.', 'Postcommunicating ACA distal to AComm.', 'Perikallozal yola devam eder.', 'Continues toward pericallosal course.'],
    ['m1', 'MCA M1', 'MCA M1', "Terminal İKA'dan MCA bifurkasyonuna yatay segment.", 'Horizontal segment from terminal ICA to MCA bifurcation.', 'Lentikülostriat perforatörler M1’den doğar.', 'Lenticulostriate perforators arise from M1.'],
    ['mca-bif', 'MCA bifurkasyonu', 'MCA bifurcation', 'M1’in üst ve alt trunkuslara ayrıldığı nokta.', 'Point where M1 divides into superior and inferior trunks.', 'Erken bifurkasyon ve trifurkasyon varyantları olabilir.', 'Early bifurcation and trifurcation variants occur.'],
    ['m2', 'MCA M2', 'MCA M2', 'İnsula üzerindeki segmentler.', 'Segments over the insula.', 'İnsüler dallar sylvian fissürde seyreder.', 'Insular branches course within Sylvian fissure.'],
    ['m3', 'MCA M3', 'MCA M3', 'Operkulum boyunca uzanan segmentler.', 'Segments extending along the operculum.', 'Sylvian nokta, distal dallanma için anjiyografik işarettir.', 'Sylvian point is an angiographic landmark for distal branching.'],
    ['m4', 'MCA M4', 'MCA M4', 'Kortikal yüzey dalları.', 'Cortical surface branches.', 'Distal emboli için kortikal dal takibi gerekir.', 'Cortical branch tracking is needed for distal emboli.'],
    ['pcomm', 'Posterior komünikan arter', 'Posterior communicating artery', 'İKA ile PCA dolaşımını birleştirir.', 'Connects ICA and PCA circulations.', 'Fetal PCA varyantında PCA akımı baskın olarak İKA’dan gelir.', 'In fetal PCA, PCA flow is predominantly supplied by ICA.'],
    ['p1', 'PCA P1', 'PCA P1', 'Baziler tepeden PComm birleşimine kadar.', 'From basilar apex to PComm junction.', 'P1 hipoplazisi fetal PCA ile birlikte olabilir.', 'P1 hypoplasia may accompany fetal PCA.'],
    ['basilar', 'Baziler arter', 'Basilar artery', 'İki vertebral arterin birleşmesiyle oluşur.', 'Formed by union of both vertebral arteries.', 'Tepe noktasında iki PCA’ya ayrılır.', 'Divides into both PCAs at its apex.'],
    ['vertebral-circle', 'Vertebral arterler', 'Vertebral arteries', 'Posterior dolaşımın eş proksimal kaynakları.', 'Paired proximal sources of posterior circulation.', 'Dominans ve hipoplazi kateter seçimini etkiler.', 'Dominance and hypoplasia affect catheter selection.'],
    ['primitive', 'Persistan primitif anastomozlar', 'Persistent primitive anastomoses', 'Trigeminal, otik, hipoglossal ve proatlantal karotis-baziler bağlantılar nadiren kalıcı olabilir.', 'Trigeminal, otic, hypoglossal, and proatlantal carotid-basilar connections may rarely persist.', 'Planlama öncesi beklenmeyen posterior dolaşım doluşunu açıklayabilir.', 'Can explain unexpected posterior circulation filling before intervention.']
  ].map(([id, tr, en, dtr, den, ptr, pen], index) => structure(id, 'circle', word(tr, en), word(dtr, den), word(ptr, pen), { kind: 'circle', index })),

  structure('stenosis-cca', 'stenosis', word('Ortak karotis ekseni', 'Common carotid axis'),
    word('Kateter ve kılavuz sistemin proksimal destek hattı.', 'Proximal support line for catheter and guide system.'),
    word('Ark anatomisi ile birlikte cihaz desteğini belirler.', 'Works with arch anatomy to determine device support.'), { kind: 'axis' }),
  structure('stenosis-lesion', 'stenosis', word('İKA darlığı', 'ICA stenosis'),
    word('Minimal rezidüel lümen, distal normal İKA referansıyla NASCET yüzdesine dönüştürülür.', 'Minimal residual lumen is compared with normal distal ICA for NASCET percentage.'),
    word('Near-oklüzyonda distal kollaps sayısal yüzdeyi güvenilmez kılar; kategori ayrı belirtilmelidir.', 'Distal collapse in near occlusion makes a numeric percentage unreliable, so classify separately.'), { kind: 'lesion' }),
  structure('stenosis-distal', 'stenosis', word('Distal normal İKA', 'Normal distal ICA'),
    word('NASCET paydası için hastalıksız, paralel duvarlı distal referans segment.', 'Disease-free distal reference segment with parallel walls for NASCET denominator.'),
    word('ECST, tahmini orijinal bulbus çapını referans alır ve aynı lezyonda daha yüksek yüzde verebilir.', 'ECST uses estimated original bulb diameter and may yield a higher percentage for the same lesion.'), { kind: 'distal' })
];

export const ARCH_VARIANTS = [
  { id: 'normal', label: word('Normal üç dal', 'Normal three branches'), note: word('BCT, LCCA, LSCA.', 'BCT, LCCA, LSCA.') },
  { id: 'common', label: word('Ortak BCT-LCCA kökeni', 'Common BCT-LCCA origin'), note: word('En sık ark dallanma varyantıdır. Sıkça "bovine" denir; gerçek sığır arkı değildir.', 'Most common arch branching variant. Often called "bovine", but it is not true bovine anatomy.') },
  { id: 'lcca-bct', label: word('LCCA, BCT’den', 'LCCA from BCT'), note: word('LCCA, BCT proksimalinden dallanır.', 'LCCA branches from proximal BCT.') },
  { id: 'left-vertebral', label: word('İzole sol vertebral', 'Isolated left vertebral'), note: word('Sol vertebral, LCCA ile LSCA arasında arktan doğar.', 'Left vertebral arises from arch between LCCA and LSCA.') },
  { id: 'lusoria', label: word('Aberran sağ subklavian', 'Aberrant right subclavian'), note: word('Arteria lusoria son dal olarak distal arktan doğar.', 'Arteria lusoria arises last from distal arch.') },
  { id: 'right-arch', label: word('Sağ aort arkı', 'Right aortic arch'), note: word('Ayna görüntüsü veya aberan dallanma paternleri olabilir.', 'Mirror-image or aberrant branching patterns may occur.') }
];

export const ARCH_TYPES = [
  { id: 'I', label: 'I', depth: 0.65, rule: word('<1 CCA çapı', '<1 CCA diameter') },
  { id: 'II', label: 'II', depth: 1.5, rule: word('1–2 CCA çapı', '1–2 CCA diameters') },
  { id: 'III', label: 'III', depth: 2.5, rule: word('>2 CCA çapı', '>2 CCA diameters') }
];

export const REFERENCES = [
  'Bouthillier A, van Loveren HR, Keller JT. Segments of the internal carotid artery: a new classification. Neurosurgery. 1996;38:425–432. doi:10.1097/00006123-199603000-00001.',
  'North American Symptomatic Carotid Endarterectomy Trial Collaborators. Beneficial effect of carotid endarterectomy in symptomatic patients with high-grade carotid stenosis. N Engl J Med. 1991;325:445–453.',
  'Naylor R, et al. ESVS 2023 Clinical Practice Guidelines on the Management of Atherosclerotic Carotid and Vertebral Artery Disease. Eur J Vasc Endovasc Surg. 2023;65:7–111.',
  'Mazzolai L, et al. 2024 ESC Guidelines for the management of peripheral arterial and aortic diseases. Eur Heart J. 2024;45:3538–3700. doi:10.1093/eurheartj/ehae179.',
  'Standring S, ed. Gray\'s Anatomy: The Anatomical Basis of Clinical Practice. 42nd ed. Elsevier; 2020.',
  'Casserly IP, Sachar R, Yadav JS. Manual of Peripheral Vascular Intervention. Lippincott Williams & Wilkins; 2005.'
];

export const viewStructures = view => STRUCTURES.filter(item => item.view === view);
export const localize = (value, lang) => typeof value === 'string' ? value : value?.[lang] || value?.en || '';

export function calculateNascet(residual, distal) {
  const a = Number(residual);
  const b = Number(distal);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b <= 0 || a > b) return null;
  return Math.max(0, Math.min(100, (1 - a / b) * 100));
}

export function nascetCategory(percent, lang = 'tr') {
  if (!Number.isFinite(percent)) return word('Geçerli ölçüm girin', 'Enter valid measurements')[lang];
  if (percent < 50) return word('<%50, hafif', '<50%, mild')[lang];
  if (percent < 70) return word('%50–69, orta', '50–69%, moderate')[lang];
  if (percent < 100) return word('%70–99, ciddi', '70–99%, severe')[lang];
  return word('%100, oklüzyon', '100%, occlusion')[lang];
}

export function tortuosityClass(angle, lang = 'tr') {
  const value = Number(angle);
  if (value < 30) return word('Düze yakın', 'Nearly straight')[lang];
  if (value < 60) return word('Tortiyöz', 'Tortuous')[lang];
  if (value < 100) return word('Kink', 'Kinked')[lang];
  return word('Loop', 'Looped')[lang];
}

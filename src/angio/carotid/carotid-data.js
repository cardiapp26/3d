export const word = (tr, en) => ({ tr, en });
const ABERRAN_TR = 'Aberran';

export const VIEW_DEFS = [
  { id: 'arch', label: word('Aort arkı', 'Aortic arch'), short: word('Ark', 'Arch') },
  { id: 'cervical', label: word('Servikal karotis', 'Cervical carotid'), short: word('Boyun', 'Neck') },
  { id: 'ica', label: word('İKA segmentleri', 'ICA segments'), short: word('İKA', 'ICA') },
  { id: 'circle', label: word('Willis poligonu', 'Circle of Willis'), short: word('Willis', 'Willis') },
  { id: 'stenosis', label: word('Darlık ve stent', 'Stenosis and stenting'), short: word('Stent', 'Stent') }
];

export const SHELL_TEXT = {
  tr: {
    title: 'Cardia · Karotis ve Serebral Anjiyografi', eyebrow: 'Girişimsel anatomi laboratuvarı',
    heading: 'Karotis ve serebral anjiyografi',
    intro: 'Arktan intrakraniyal dolaşıma uzanan, özgün ve etkileşimli şematik öğretim geometrisi.',
    tabs: 'Anjiyografi görünümleri', detail: 'Yapı ayrıntısı',
    selectPrompt: 'Adını, anatomisini ve anjiyografik önemini görmek için bir damara dokunun.',
    anatomy: 'Anatomi', pearl: 'Anjiyografik önem', schematic: 'Şematik öğretim geometrisi',
    references: 'Kaynaklar', disclaimer: 'Şematik öğretim çizimidir, hasta görüntülemesi değildir; eğitim amaçlıdır.',
    projection: 'Projeksiyon', archType: 'Girişimsel ark tipi', variant: 'Dallanma varyantı', hover: 'Yapı adı', calculate: 'Hesapla'
  },
  en: {
    title: 'Cardia · Carotid and Cerebral Angiography', eyebrow: 'Interventional anatomy lab',
    heading: 'Carotid and cerebral angiography',
    intro: 'Original interactive schematic teaching geometry from aortic arch to intracranial circulation.',
    tabs: 'Angiography views', detail: 'Structure detail',
    selectPrompt: 'Select a vessel to see its name, anatomy, and angiographic relevance.',
    anatomy: 'Anatomy', pearl: 'Angiographic relevance', schematic: 'Schematic teaching geometry',
    references: 'References', disclaimer: 'Schematic teaching drawing, not patient imaging; for education.',
    projection: 'Projection', archType: 'Interventional arch type', variant: 'Branching variant', hover: 'Structure name', calculate: 'Calculate'
  }
};

const structure = (id, view, label, description, pearl, geometry = {}) => ({ id, view, label, description, pearl, geometry });

const subclavianBranch = (side, branch, trName, enName, trCourse, enCourse, trPearl, enPearl) => structure(
  `${side}-${branch}`, 'arch', word(`${side === 'r' ? 'Sağ' : 'Sol'} ${trName}`, `${side === 'r' ? 'Right' : 'Left'} ${enName}`),
  word(trCourse, enCourse), word(trPearl, enPearl), { kind: 'subclavian-branch', side, branch }
);

const ecaBranchData = [
  ['sup-thyroid', 'Süperior tiroid arter', 'Superior thyroid artery', 'anterior', 'anteriyor', 'Kaudale yönelen ön daldır; ana karotis veya bifurkasyondan da doğabilir.', 'Anterior branch directed caudally; it may also arise from the common carotid or bifurcation.'],
  ['asc-pharyngeal', 'Asendan faringeal arter', 'Ascending pharyngeal artery', 'medial', 'mediyal', 'Posteromediyal yükselen küçük daldır ve sıklıkla ilk EKA dalıdır.', 'Small posteromedial ascending branch and often the first ECA branch.'],
  ['lingual', 'Lingual arter', 'Lingual artery', 'anterior', 'anteriyor', 'Öne ilerler; fasiyal arterle yaklaşık %20 oranında lingofasiyal trunkus oluşturur.', 'Runs anteriorly; shares a linguofacial trunk with the facial artery in about 20%.'],
  ['facial', 'Fasiyal arter', 'Facial artery', 'anterior', 'anteriyor', 'Öne ve yukarı ilerler; lingual arterle ortak trunkustan doğabilir.', 'Runs anteriorly and superiorly; may arise with the lingual artery from a common trunk.'],
  ['occipital', 'Oksipital arter', 'Occipital artery', 'posterior', 'posteriyor', 'EKA arka yüzünden geriye yönelir.', 'Passes posteriorly from the back of the ECA.'],
  ['post-auricular', 'Posterior auriküler arter', 'Posterior auricular artery', 'posterior', 'posteriyor', 'Parotis içinde kulağın arkasına yönelen arka daldır.', 'Posterior branch running behind the ear within the parotid region.'],
  ['maxillary', 'Maksiller arter', 'Maxillary artery', 'terminal', 'terminal', 'Parotis içinde öne yönelen iki terminal EKA dalından biridir.', 'One of two terminal ECA branches, directed anteriorly within the parotid.'],
  ['superficial-temporal', 'Yüzeyel temporal arter', 'Superficial temporal artery', 'terminal', 'terminal', 'Parotis içinde yukarı devam eden iki terminal EKA dalından biridir.', 'One of two terminal ECA branches, continuing superiorly within the parotid.']
];

export const STRUCTURES = [
  structure('ascending-aorta', 'arch', word('Çıkan aorta', 'Ascending aorta'),
    word('Aort kökünden arkın proksimaline yükselir.', 'Rises from the aortic root to the proximal arch.'),
    word('Ark aortografisinde kateterin supraaortik dallara ulaştığı proksimal yoldur.', 'Proximal route by which the catheter reaches supra-aortic branches during arch aortography.'), { kind: 'path' }),
  structure('aortic-arch', 'arch', word('Aort arkı', 'Aortic arch'),
    word('Çıkan aortayı inen torasik aortaya bağlayan dışbükey kavistir.', 'Convex curve connecting the ascending and descending thoracic aorta.'),
    word('LAO 30–45° ark dallarının kökenlerini ayırır.', 'LAO 30–45° separates the arch branch origins.'), { kind: 'path' }),
  structure('descending-aorta', 'arch', word('İnen torasik aorta', 'Descending thoracic aorta'),
    word('Sol arkın distalinden hastanın solunda, anterior görünümde görüntünün sağında kaudale iner.', 'Descends caudally on the patient’s left, image right in an anterior view, from the distal left arch.'),
    word('Distal ark yönü kateter dönüşü ve destek hattını tanımlar.', 'Distal arch direction defines catheter turn and support.'), { kind: 'path' }),
  structure('bct', 'arch', word('Brakiyosefalik trunkus', 'Brachiocephalic trunk'),
    word('Normal sol arkta ilk ve en kalın daldır; sağ ana karotis ve sağ subklavyene ayrılır.', 'First and largest branch of a normal left arch, dividing into right common carotid and right subclavian arteries.'),
    word('Bifurkasyonu RAO 20–30° projeksiyonda açılır.', 'Its bifurcation opens in RAO 20–30°.'), { kind: 'path' }),
  structure('rcca', 'arch', word('Sağ ana karotis arter', 'Right common carotid artery'),
    word('Normal BCT anatomisinde torasik bölümü yoktur ve sağ sternoklaviküler eklem arkasında başlar; lusoria veya varyant dallanmada doğrudan arktan çıkıp torasik segment kazanabilir.', 'In normal BCT anatomy it has no thoracic part and begins behind the right sternoclavicular joint; with lusoria or aberrant branching it may arise directly from the arch and gain a thoracic segment.'),
    word('Normal BCT bifurkasyonunda RCCA-RSCA ayrımı RAO 20–30° projeksiyonda görülür.', 'At a normal BCT bifurcation, RAO 20–30° separates the RCCA from the RSCA.'), { kind: 'path' }),
  structure('rsub', 'arch', word('Sağ subklavyen arter', 'Right subclavian artery'),
    word('BCT’nin lateral dalıdır. Arteria lusoria varyantında distal arktan son dal olarak çıkar.', 'Lateral branch of the BCT. In arteria lusoria it arises last from the distal arch.'),
    word('Sağ radiyal girişte ilk supraaortik daldır; lusoria asendan aortaya ulaşmayı zorlaştırır.', 'First supra-aortic branch traversed in right radial access; lusoria makes ascending-aortic access difficult.'), { kind: 'path' }),
  structure('lcca', 'arch', word('Sol ana karotis arter', 'Left common carotid artery'),
    word('Normal arkta BCT ile sol subklavyen arasında ikinci daldır ve torasik bölümü vardır.', 'Second branch of a normal arch between the BCT and left subclavian, with a thoracic segment.'),
    word('Ortak köken, ters kıvrımlı kateter gerektiren keskin bir seçim açısı oluşturabilir.', 'A common origin may create a sharp selection angle requiring a reverse-curve catheter.'), { kind: 'path' }),
  structure('lsub', 'arch', word('Sol subklavyen arter', 'Left subclavian artery'),
    word('Normal sol arkın üçüncü dalıdır.', 'Third branch of a normal left arch.'),
    word('Proksimal darlık vertebral çalma ve kollar arasında >15 mmHg sistolik fark yapabilir.', 'Proximal stenosis may cause vertebral steal and an inter-arm systolic difference >15 mmHg.'), { kind: 'path' }),
  subclavianBranch('r', 'vertebral', 'vertebral arter', 'vertebral artery', 'Sağ subklavyenin ilk kısmından doğar; genellikle C6’dan başlayarak transvers foramenler içinde yükselir.', 'Arises from the first part of the right subclavian and ascends in the transverse foramina, usually entering at C6.', 'Posterior dolaşım ve subklavyen çalma değerlendirmesinde izlenir.', 'Followed for posterior circulation and subclavian steal.'),
  subclavianBranch('r', 'internal-thoracic', 'internal torasik arter', 'internal thoracic artery', 'Subklavyenin alt yüzünden çıkar ve ön göğüs duvarında kaudale iner.', 'Arises from the inferior subclavian surface and descends along the anterior chest wall.', 'Koroner baypas grefti olarak kullanıldığında proksimal subklavyen darlığı önemlidir.', 'Proximal subclavian stenosis matters when used as a coronary bypass graft.'),
  subclavianBranch('r', 'thyrocervical', 'tiroservikal trunkus', 'thyrocervical trunk', 'Vertebral kökenin lateralinde kısa trunkus olarak doğar.', 'Arises as a short trunk lateral to the vertebral origin.', 'Boyun ve skapular kollateraller embolizasyon planını etkiler.', 'Neck and scapular collaterals affect embolisation planning.'),
  subclavianBranch('r', 'costocervical', 'kostoservikal trunkus', 'costocervical trunk', 'Subklavyenin posterior yüzünden çıkar.', 'Arises from the posterior surface of the subclavian artery.', 'Derin servikal ve üst interkostal dolaşımla kollateral yapar.', 'Anastomoses with deep cervical and upper intercostal circulations.'),
  subclavianBranch('l', 'vertebral', 'vertebral arter', 'vertebral artery', 'Sol subklavyenin ilk kısmından doğar; genellikle C6’dan başlayarak transvers foramenler içinde yükselir.', 'Arises from the first part of the left subclavian and ascends in the transverse foramina, usually entering at C6.', 'Doğrudan aort arkından köken alabilir.', 'May arise directly from the aortic arch.'),
  subclavianBranch('l', 'internal-thoracic', 'internal torasik arter', 'internal thoracic artery', 'Subklavyenin alt yüzünden çıkar ve ön göğüs duvarında kaudale iner.', 'Arises from the inferior subclavian surface and descends along the anterior chest wall.', 'LIMA-LAD greftinde proksimal darlık koroner-subklavyen çalmaya yol açabilir.', 'Proximal stenosis may cause coronary-subclavian steal with a LIMA-LAD graft.'),
  subclavianBranch('l', 'thyrocervical', 'tiroservikal trunkus', 'thyrocervical trunk', 'Vertebral kökenin lateralinde kısa trunkus olarak doğar.', 'Arises as a short trunk lateral to the vertebral origin.', 'Servikal ve skapular dalları kollateral yollar oluşturur.', 'Its cervical and scapular branches form collateral routes.'),
  subclavianBranch('l', 'costocervical', 'kostoservikal trunkus', 'costocervical trunk', 'Subklavyenin posterior yüzünden çıkar.', 'Arises from the posterior surface of the subclavian artery.', 'Derin servikal ve üst interkostal dallar verir.', 'Gives deep cervical and upper intercostal branches.'),

  structure('cca', 'cervical', word('Ana karotis arter', 'Common carotid artery'),
    word('Karotis bifurkasyonuna kadar dal vermeden yükselir.', 'Ascends without branches to the carotid bifurcation.'),
    word('Bifurkasyon çoğunlukla C3–C4, tiroid kartilaj üst kenarı yakınındadır; düzey değişkendir.', 'Bifurcation is commonly near C3–C4 and the upper thyroid cartilage border, with variable level.'), { kind: 'path' }),
  structure('bulb', 'cervical', word('Karotis bulbusu', 'Carotid bulb'),
    word('İKA başlangıcındaki fizyolojik genişlemedir.', 'Physiologic widening at the ICA origin.'),
    word('Aterosklerotik plak ve NASCET darlık ölçümünün sık hedefidir.', 'Frequent site of atherosclerotic plaque and NASCET stenosis measurement.'), { kind: 'ellipse' }),
  structure('cervical-ica', 'cervical', word('Servikal iç karotis arter', 'Cervical internal carotid artery'),
    word('Servikal dal vermez; bulbus düzeyinde posterolateral başlayıp yukarıda daha mediyal seyreder.', 'Has no cervical branches; starts posterolateral at the bulb and becomes more medial superiorly.'),
    word('Dalsız, daha geniş posterior damar İKA lehinedir.', 'A branchless, usually larger posterior vessel favors ICA.'), { kind: 'path' }),
  ...ecaBranchData.map(([id, tr, en, groupEn, groupTr, dtr, den], index) => structure(id, 'cervical', word(tr, en),
    word(`${dtr} Klasik sayımda ${index + 1}. daldır; köken sırası değişkendir.`, `${den} Branch ${index + 1} in the classic listing; origin order varies.`),
    word(`EKA ${groupTr} dalıdır. EKA-İKA ve EKA-vertebral anastomozları kollateral olabilir, embolizasyonda tehlikelidir.`, `${groupEn[0].toUpperCase()}${groupEn.slice(1)} ECA branch. ECA-ICA and ECA-vertebral anastomoses provide collateral flow but are dangerous during embolisation.`),
    { kind: 'branch', index })),

  ...[
    ['c1', 'C1 Servikal', 'C1 Cervical', 'Karotis bifurkasyonundan karotis kanalına kadar.', 'From carotid bifurcation to carotid canal.', 'Servikal dal yoktur.', 'No cervical branches.'],
    ['c2', 'C2 Petröz', 'C2 Petrous', 'Temporal kemik karotis kanalı içindeki dikey ve yatay seyir.', 'Vertical and horizontal course in the petrous carotid canal.', 'Karotikotimpanik ve vidian dalları olabilir.', 'Caroticotympanic and vidian branches may arise.'],
    ['c3', 'C3 Laserum', 'C3 Lacerum', 'Foramen laserum üzerindeki kısa segment; petrolingual ligamanda sonlanır.', 'Short segment over foramen lacerum, ending at the petrolingual ligament.', 'Arter foramen laserumdan geçmez; üzerinden petrolingual ligamana kadar uzanır.', 'The artery passes over, not through, foramen lacerum, up to the petrolingual ligament.'],
    ['c4', 'C4 Kavernöz', 'C4 Cavernous', 'Kavernöz sinüs içinde karotis sifonunun posterior vertikal, horizontal ve anterior genu seyridir.', 'Posterior vertical, horizontal, and anterior genu course of the carotid siphon within the cavernous sinus.', 'Meningohipofizyal trunkus ve inferolateral trunkus dalları.', 'Meningohypophyseal trunk and inferolateral trunk branches.'],
    ['c5', 'C5 Klinoid', 'C5 Clinoid', 'Proksimal ve distal dural halkalar arasındaki kısa segment.', 'Short segment between proximal and distal dural rings.', 'Genellikle dal vermez; oftalmik arter nadiren C5’ten veya ekstradural doğabilir.', 'Usually branchless; the ophthalmic artery may rarely arise from C5 or extradurally.'],
    ['c6', 'C6 Oftalmik', 'C6 Ophthalmic', 'Distal dural halkadan PComm kökenine kadar.', 'From distal dural ring to PComm origin.', 'Oftalmik ve süperior hipofizyal arterler.', 'Ophthalmic and superior hypophyseal arteries.'],
    ['c7', 'C7 Komünikan', 'C7 Communicating', 'PComm kökeninden terminal İKA bifurkasyonuna kadar.', 'From PComm origin to terminal ICA bifurcation.', 'PComm ve anterior koroidal dallardan sonra ACA ve MCA terminal dalları.', 'PComm and anterior choroidal branches precede terminal ACA and MCA.']
  ].map(([id, tr, en, dtr, den, ptr, pen], index) => structure(id, 'ica', word(tr, en), word(dtr, den), word(ptr, pen), { kind: 'segment', index })),

  ...[
    ['a1', 'ACA A1', 'ACA A1', 'A1 prekomünikan segment terminal İKA ile AComm arasındadır.', 'A1 precommunicating segment runs from the ICA terminus to AComm.', 'Mediyal lentikülostriatlar A1’den, Heubner rekürren arteri A1-A2 bileşkesinden çıkar.', 'Medial lenticulostriates arise from A1; the recurrent artery of Heubner arises from the A1-A2 junction.'],
    ['acomm', 'Anterior komünikan arter', 'Anterior communicating artery', 'İki A1 segmentini birleştirir.', 'Connects both A1 segments.', 'Kollateral dolaşım ve anevrizma değerlendirmesinde anahtardır.', 'Key for collateral flow and aneurysm assessment.'],
    ['a2', 'ACA A2', 'ACA A2', 'A2 postkomünikan segment AComm’dan korpus kallozum rostrum-genu bileşkesine uzanır.', 'A2 postcommunicating segment runs from AComm to the rostrum-genu junction of the corpus callosum.', 'Orbitofrontal ve frontopolar dallar verir.', 'Gives orbitofrontal and frontopolar branches.'],
    ['m1', 'MCA M1', 'MCA M1', 'Sfenoidal segment, İKA terminalinden limen insula düzeyindeki genuya uzanır; erken postbifurkasyon trunkusları da M1’dir.', 'Sphenoidal segment from the ICA terminus to the genu at the limen insulae; early post-bifurcation trunks are still M1.', 'Klinik kullanım M1’i sıklıkla bifurkasyonda sonlandırır. Lateral lentikülostriatlar bifurkasyon öncesi ve sonrası M1’den çıkabilir.', 'Clinical usage often ends M1 at the bifurcation. Lateral lenticulostriates may arise from pre- and post-bifurcation M1.'],
    ['mca-bif', 'MCA bifurkasyonu', 'MCA bifurcation', 'M1’in üst ve alt trunkuslara ayrıldığı noktadır; çoğunlukla anatomik M1 sonundan önce yer alır.', 'Point where M1 divides into superior and inferior trunks, usually before the anatomical end of M1.', 'Erken bifurkasyon ve trifurkasyon varyantları olabilir.', 'Early bifurcation and trifurcation variants occur.'],
    ['m2', 'MCA M2', 'MCA M2', 'İnsula üzerindeki segmentlerdir.', 'Segments over the insula.', 'İnsüler dallar sylvian fissürde seyreder.', 'Insular branches course within the Sylvian fissure.'],
    ['m3', 'MCA M3', 'MCA M3', 'Operkulum boyunca uzanan segmentlerdir.', 'Segments extending along the operculum.', 'Sylvian nokta distal MCA dönüşünü işaretler.', 'Sylvian point marks the distal MCA turn.'],
    ['m4', 'MCA M4', 'MCA M4', 'Kortikal yüzey dallarıdır.', 'Cortical surface branches.', 'Distal emboliler için kortikal dal takibi gerekir.', 'Cortical branch tracking is needed for distal emboli.'],
    ['pcomm', 'Posterior komünikan arter', 'Posterior communicating artery', 'İKA ile PCA dolaşımını birleştirir.', 'Connects ICA and PCA circulations.', 'Fetal PCA’da PCA akımı baskın olarak İKA’dan gelir.', 'In fetal PCA, PCA flow is predominantly supplied by ICA.'],
    ['p1', 'PCA P1', 'PCA P1', 'Baziler tepeden PComm birleşimine kadar uzanır.', 'Runs from the basilar apex to the PComm junction.', 'Talamoperforatörler P1’den çıkar; Percheron arteri varyantı vardır. Fetal PCA sıklığı %10–30’dur.', 'Thalamoperforators arise from P1, including the artery of Percheron variant. Fetal PCA occurs in 10–30%.'],
    ['basilar', 'Baziler arter', 'Basilar artery', 'İki V4 vertebral arterin birleşmesiyle oluşur.', 'Formed by union of both V4 vertebral arteries.', 'AICA ve SCA dallarını verdikten sonra iki PCA’ya ayrılır.', 'Gives AICA and SCA branches before dividing into both PCAs.'],
    ['vertebral-circle', 'Vertebral arterler', 'Vertebral arteries', 'V1–V4 segmentleri vardır; V2 genellikle C6–C2 transvers foramenler içinde seyreder.', 'Have V1–V4 segments; V2 usually runs in the C6–C2 transverse foramina.', 'PICA çoğunlukla V4’ten çıkar; dominans ve hipoplazi kateter seçimini etkiler.', 'PICA usually arises from V4; dominance and hypoplasia affect catheter selection.'],
    ['primitive', 'Persistan primitif anastomozlar', 'Persistent primitive anastomoses', 'Karotis-vertebrobaziler embriyonik bağlantılar trigeminal (en sık, %0,1–0,6; kavernöz İKA ile baziler), hipoglossal (servikal İKA ile vertebral veya baziler), proatlantal (İKA veya EKA ile vertebral) ve otik (en nadir, varlığı tartışmalı) arterlerdir.', 'Carotid-vertebrobasilar embryonic connections include trigeminal (commonest, 0.1–0.6%; cavernous ICA to basilar), hypoglossal (cervical ICA to vertebral or basilar), proatlantal (ICA or ECA to vertebral), and otic (rarest, disputed) arteries.', 'Karotis darlığı veya stent embolisi bu bağlantılar üzerinden posterior dolaşıma ulaşabilir.', 'Carotid stenosis or stent emboli may reach the posterior circulation through these connections.']
  ].map(([id, tr, en, dtr, den, ptr, pen], index) => structure(id, 'circle', word(tr, en), word(dtr, den), word(ptr, pen), { kind: 'circle', index })),

  structure('stenosis-cca', 'stenosis', word('Ana karotis ekseni', 'Common carotid axis'),
    word('Kateter ve kılavuz sistemin proksimal destek hattıdır.', 'Proximal support line for catheter and guide system.'),
    word('Ark anatomisi ile birlikte cihaz desteğini belirler.', 'Works with arch anatomy to determine device support.'), { kind: 'axis' }),
  structure('stenosis-lesion', 'stenosis', word('İKA darlığı', 'ICA stenosis'),
    word('Minimal rezidüel lümen, distal normal İKA referansıyla NASCET yüzdesine dönüştürülür.', 'Minimal residual lumen is compared with normal distal ICA for NASCET percentage.'),
    word('Tama yakın oklüzyonda distal kollaps yüzdeyi güvenilmez kılar; ayrı kategori seçilmelidir.', 'Distal collapse in near-occlusion makes a numeric percentage unreliable; select a separate category.'), { kind: 'lesion' }),
  structure('stenosis-distal', 'stenosis', word('Distal normal İKA', 'Normal distal ICA'),
    word('NASCET paydası için hastalıksız, paralel duvarlı distal referans segmenttir.', 'Disease-free distal reference segment with parallel walls for the NASCET denominator.'),
    word('NASCET %50 yaklaşık ECST %75’e, NASCET %70 yaklaşık ECST %85’e karşılık gelir.', 'NASCET 50% approximates ECST 75%; NASCET 70% approximates ECST 85%.'), { kind: 'distal' })
];

export const ARCH_VARIANTS = [
  { id: 'normal', label: word('Normal üç dal', 'Normal three branches'), note: word('BCT, LCCA ve LSCA ayrı kökenlidir.', 'BCT, LCCA, and LSCA have separate origins.') },
  { id: 'common', label: word('Ortak BCT-LCCA kökeni', 'Common BCT-LCCA origin'), note: word('En sık varyanttır. “Bovin ark” adı yanlış adlandırmadır; gerçek sığır anatomisi değildir.', 'Most common variant. “Bovine arch” is a misnomer; this is not true bovine anatomy.') },
  { id: 'lcca-bct', label: word('LCCA, BCT’den', 'LCCA from BCT'), note: word('LCCA, BCT’nin proksimalinden ayrılır ve ortak bir trunkus görünümü oluşturur.', 'LCCA branches from the proximal BCT, producing a recognisable shared trunk.') },
  { id: 'left-vertebral', label: word('İzole sol vertebral', 'Isolated left vertebral'), note: word('Sol vertebral, LCCA ile LSCA arasında doğrudan arktan çıkar.', 'Left vertebral arises directly from the arch between LCCA and LSCA.') },
  { id: 'lusoria', label: word(`${ABERRAN_TR} sağ subklavyen`, 'Aberrant right subclavian'), note: word('Arteria lusoria (%0,5–2) sol subklavyenin distalinden son dal olarak çıkar, çoğunlukla özofagusun arkasından geçer; Kommerell divertikülü olabilir ve sağ radiyal yolu zorlaştırır.', 'Arteria lusoria (0.5–2%) arises last beyond the left subclavian, usually passes behind the oesophagus, may have a Kommerell diverticulum, and complicates right radial access.') },
  { id: 'right-arch', label: word('Sağ aort arkı', 'Right aortic arch'), note: word(`En sık tip ${ABERRAN_TR.toLocaleLowerCase('tr-TR')} sol subklavyenlidir; ayna görüntüsü dallanma doğumsal kalp hastalığı, özellikle Fallot tetralojisi ile ilişkilidir.`, 'The commonest type has an aberrant left subclavian; mirror-image branching is associated with congenital heart disease, especially tetralogy of Fallot.') }
];

export const ARCH_TYPES = [
  { id: 'I', label: 'I', depth: 0.65, rule: word('<1 LCCA çapı', '<1 LCCA diameter') },
  { id: 'II', label: 'II', depth: 1.5, rule: word('1–2 LCCA çapı', '1–2 LCCA diameters') },
  { id: 'III', label: 'III', depth: 2.5, rule: word('>2 LCCA çapı', '>2 LCCA diameters') }
];

export const REFERENCES = [
  'Bouthillier A, van Loveren HR, Keller JT. Segments of the internal carotid artery: a new classification. Neurosurgery. 1996;38(3):425–433. doi:10.1097/00006123-199603000-00001.',
  'Gibo H, Carver CC, Rhoton AL Jr, Lenkey C, Mitchell RJ. Microsurgical anatomy of the middle cerebral artery. J Neurosurg. 1981;54:151–169.',
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

export function nascetCategory(percent, lang = 'tr', nearOcclusion = false) {
  if (nearOcclusion) return word('Tama yakın oklüzyon (distal kollaps)', 'Near-occlusion (distal collapse)')[lang];
  if (!Number.isFinite(percent)) return word('Geçerli ölçüm girin', 'Enter valid measurements')[lang];
  if (percent < 50) return word('<%50', '<50%')[lang];
  if (percent < 70) return word('%50–69, orta', '50–69%, moderate')[lang];
  if (percent < 100) return word('%70–99, ağır (ileri derece)', '70–99%, severe')[lang];
  return word('%100, tam oklüzyon', '100%, occlusion')[lang];
}

export function formatNascetPercent(percent) {
  if (!Number.isFinite(percent)) return '';
  if (percent === 100) return '100.0';
  return (Math.floor((percent + Number.EPSILON) * 10) / 10).toFixed(1);
}

export function tortuosityClass(angle, lang = 'tr', coil = false) {
  if (coil) return word('Koil (halka), 360° seyir', 'Coil/loop, 360° course')[lang];
  const value = Number(angle);
  if (!Number.isFinite(value) || value < 0) return word('Geçersiz açı', 'Invalid angle')[lang];
  if (value < 30) return word('Düz', 'Straight')[lang];
  if (value <= 90) return word('Tortüöz', 'Tortuous')[lang];
  return word('Kinking (açılanma)', 'Kinking')[lang];
}

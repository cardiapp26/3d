import { initialLanguage } from './entry-language.js';

const atlas = 'Kardiyak anatomi atlası';
const av = 'Ho et al., 2003, PDF pp. 3–4';
const la = 'Ho et al., 2012, PDF pp. 2–3';
const rv = 'Anatomy for right ventricular lead implantation, PDF p. 2';

let currentLang = initialLanguage();

export function setContentLanguage(lang, options = {}) {
  currentLang = lang === 'en' ? 'en' : 'tr';
  if (typeof document !== 'undefined') document.documentElement.lang = currentLang;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('cardia_lang', currentLang);
      if (options.explicit) localStorage.setItem('cardia_lang_explicit', '1');
    } catch (_) {}
  }
}

export function hasExplicitLanguageChoice() {
  try {
    return localStorage.getItem('cardia_lang_explicit') === '1';
  } catch {
    return false;
  }
}

export function getContentLanguage() {
  return currentLang;
}

export const rawStructures = {
  ra: {
    tr: {
      title: 'Sağ atriyum • RA',
      description: 'Sistemik venöz kanı toplar. Düz venöz bileşeni terminal krestte (sulcus terminalis) pektinat kas bölgesiyle birleşir.',
      clinical: 'Koroner sinüs ostiyumu, triküspit septal anulusu ve Todaro tendonu Koch üçgenini sınırlar. Bunlar anatomik nirengi noktalarıdır, ileti dokusunun doğrudan gözle görünen sınırları değildir.'
    },
    en: {
      title: 'Right atrium • RA',
      description: 'Receives systemic venous blood. Its smooth venous component meets the pectinate muscle region at the terminal crest.',
      clinical: 'The coronary sinus ostium, tricuspid hinge and tendon of Todaro frame Koch’s triangle. These are landmarks, not visible outlines of conduction tissue.'
    },
    source: `${atlas}, PDF pp. 12–16; ${av}`
  },
  la: {
    tr: {
      title: 'Sol atriyum • LA',
      description: 'En posterior kardiyak odacıktır; pulmoner venlerden oksijenlenmiş kanı alır. Atriyal miyokardiyal kılıflar venlerin üzerine değişken biçimde uzanır. Sol atriyal apendiks anterolateral duvardan öne ve sola uzanır (halka işareti).',
      clinical: 'Pulmoner ven anatomisi değişkenlik gösterir. Posterior duvar, bu şematik modelde gösterilmeyen özofagus ile çok yakın komşuluktadır.'
    },
    en: {
      title: 'Left atrium • LA',
      description: 'The most posterior chamber receives pulmonary veins. Atrial muscle sleeves extend over the veins, with variable length and arrangement. The left atrial appendage projects anteriorly and to the left from the anterolateral wall (ring marker).',
      clinical: 'Pulmonary vein anatomy varies. The posterior wall lies near the esophagus, which is omitted from this schematic.'
    },
    source: `${la}; Ho et al., 2012, PDF p. 8`
  },
  laa: {
    tr: {
      title: 'Sol atriyal apendiks ağzı • LAA',
      description: 'Sol atriyumun anterolateral duvarından öne ve sola uzanan, çok loblu, pektinat kaslı trabeküle çıkıntı. Boynu sol süperior pulmoner ven ağzının önünde yer alır; ikisini sol lateral sırt (Coumadin sırtı) ayırır. Gövdesi pulmoner trunkusun solunda, sol AV olukta seyreden sirkumfleks arter ve büyük kardiyak venin üzerinde durur. Halka, atlas LA ağının ön lobunun ölçülen boynuna oturtulmuş şematik ağız işaretidir; atlasta ayrı apendiks düğümü yoktur.',
      clinical: 'Atriyal fibrilasyonda trombüsün en sık yeridir; perkütan LAA kapama cihazı ağız çapına (tipik 1,5–3 cm) ve derinliğe göre seçilir. Sol frenik sinir apendiks üzerinden geçer. Sol WACA halkasının ön kenarı sırt üzerinde, LSPV ile apendiks arasındaki dar alanda çizilir; burada kateter stabilitesi zordur.'
    },
    en: {
      title: 'Left atrial appendage orifice • LAA',
      description: 'A multilobed, trabeculated (pectinate) pouch projecting anteriorly and to the left from the anterolateral LA wall. Its neck lies in front of the left superior pulmonary vein ostium, separated from it by the left lateral ridge (Coumadin ridge); the body sits to the left of the pulmonary trunk, over the circumflex artery and great cardiac vein in the left AV groove. The ring is a schematic orifice marker fitted to the measured neck of the atlas LA anterior lobe; the atlas has no separate appendage node.',
      clinical: 'The commonest site of thrombus in atrial fibrillation; percutaneous LAA occluders are sized to the orifice diameter (typically 1.5–3 cm) and depth. The left phrenic nerve courses over the appendage. The anterior edge of the left WACA ring runs on the ridge, in the narrow zone between the LSPV and the appendage, where catheter stability is difficult.'
    },
    source: 'Ho et al., 2012 (left atrial anatomy); schematic ring on the measured atlas lobe'
  },
  'ausc-aortic': {
    tr: { title: 'Aort odağı • Sağ 2. interkostal aralık', description: 'Sternumun sağ kenarında 2. interkostal aralık. Aort darlığının ejeksiyon üfürümü burada en iyi duyulur ve karotislere yayılır; A2 bu odakta belirgindir.', clinical: 'Şematik odak: ölçülen pulmoner kapak seviyesi ve sternal orta hattan türetilmiştir, yüzey anatomisi ölçümü değildir.' },
    en: { title: 'Aortic area • 2nd right intercostal space', description: 'Right sternal border, 2nd intercostal space. The ejection murmur of aortic stenosis is loudest here and radiates to the carotids; A2 is prominent.', clinical: 'Schematic area derived from the measured pulmonary valve level and the sternal midline, not a surface anatomy measurement.' },
    source: 'Physical examination teaching; schematic projection'
  },
  'ausc-pulmonic': {
    tr: { title: 'Pulmoner odak • Sol 2. interkostal aralık', description: 'Sternumun sol kenarında 2. interkostal aralık. Pulmoner darlık, akım üfürümleri ve S2 ayrılması (A2-P2) burada değerlendirilir; P2 en iyi burada duyulur.', clinical: 'S2 ayrılması inspiryumda genişler; sabit geniş ayrılma ASD, paradoks ayrılma sol dal bloğu veya ciddi aort darlığı düşündürür. Şematik odak.' },
    en: { title: 'Pulmonic area • 2nd left intercostal space', description: 'Left sternal border, 2nd intercostal space. Pulmonic stenosis, flow murmurs and S2 splitting (A2-P2) are assessed here; P2 is heard best.', clinical: 'S2 splitting widens on inspiration; fixed wide splitting suggests ASD, paradoxical splitting LBBB or severe aortic stenosis. Schematic area.' },
    source: 'Physical examination teaching; schematic projection'
  },
  'ausc-erb': {
    tr: { title: 'Erb noktası • Sol 3. interkostal aralık', description: 'Sol parasternal 3. interkostal aralık. Aort yetersizliğinin dekreşendo diyastolik üfürümü (hasta öne eğilmiş, ekspiryumda) ve HOKM üfürümü burada iyi duyulur.', clinical: 'HOKM üfürümü karotise az yayılır, Valsalva ve ayağa kalkmakla artar; aort darlığı üfürümü ise karotise yayılır ve bu manevralarla azalır. Şematik odak.' },
    en: { title: "Erb's point • 3rd left intercostal space", description: 'Left parasternal 3rd intercostal space. The decrescendo diastolic murmur of aortic regurgitation (sitting forward, held expiration) and the HOCM murmur are well heard here.', clinical: 'The HOCM murmur radiates little to the carotids and grows with Valsalva and standing; the aortic stenosis murmur radiates to the carotids and softens with them. Schematic area.' },
    source: 'Physical examination teaching; schematic projection'
  },
  'ausc-tricuspid': {
    tr: { title: 'Triküspit odağı • Sol alt sternal kenar', description: 'Sol alt sternal kenar, 4.-5. interkostal aralık. Triküspit yetersizliği ve VSD üfürümleri burada duyulur; sağ kalp kaynaklı üfürümler inspiryumda artar (Carvallo).', clinical: 'Lembo 1988: inspiryumda artış, sağ kalp üfürümlerini diğerlerinden %100 duyarlılık ve %88 özgüllükle ayırdı. Şematik odak: ölçülen triküspit anulus seviyesinden türetilmiştir.' },
    en: { title: 'Tricuspid area • Lower left sternal border', description: 'Lower left sternal border, 4th-5th intercostal space. Tricuspid regurgitation and VSD murmurs are heard here; right-sided murmurs grow with inspiration (Carvallo).', clinical: 'Lembo 1988: augmentation with inspiration separated right-sided murmurs from all others with 100% sensitivity and 88% specificity. Schematic area derived from the measured tricuspid annulus level.' },
    source: 'Lembo et al., N Engl J Med 1988;318:1572-8; schematic projection'
  },
  'ausc-mitral': {
    tr: { title: 'Mitral odak • Apeks', description: 'Apeks, 5. interkostal aralık, midklaviküler hat. Mitral yetersizliği (aksillaya yayılır), mitral darlığı rulmanı, S3 ve S4 burada duyulur; düşük frekanslı sesler için sol lateral dekübitte çan kullanılır.', clinical: 'Mitral darlığında açılma sesi ve presistolik belirginleşme aranır; MVP\'de klik ayağa kalkınca S1\'e yaklaşır. Şematik odak: ölçülen LV apeksinden göğüs düzlemine yansıtılmıştır.' },
    en: { title: 'Mitral area • Apex', description: 'Apex, 5th intercostal space, midclavicular line. Mitral regurgitation (radiating to the axilla), the mitral stenosis rumble, S3 and S4 are heard here; use the bell in left lateral decubitus for low-pitched sounds.', clinical: 'In mitral stenosis look for an opening snap and presystolic accentuation; in MVP the click moves toward S1 on standing. Schematic area projected from the measured LV apex.' },
    source: 'Physical examination teaching; schematic projection'
  },
  rv: {
    tr: {
      title: 'Sağ ventrikül • RV',
      description: 'Giriş (inlet), trabeküle apikal kısım ve infundibulum/çıkış (outlet) bölümlerinden oluşan anterior odacıktır. Moderator band septomarijinal trabekülden anterior papiller kasa uzanır.',
      clinical: 'İzlenen bir lead pozisyonu gerçek septal fiksasyonu kanıtlamaz. Trabekülasyonlar, kapak aygıtı ve serbest duvar kalınlığı dikkate alınmalıdır.'
    },
    en: {
      title: 'Right ventricle • RV',
      description: 'An anterior chamber with inlet, trabeculated apical component and outlet. The moderator band crosses from the septomarginal trabeculation toward the anterior papillary muscle.',
      clinical: 'A projected lead position does not establish septal contact. Trabeculations, valve apparatus and a thin apical wall matter.'
    },
    source: rv
  },
  lv: {
    tr: {
      title: 'Sol ventrikül • LV',
      description: 'Sistemik pompalama odacığıdır; sağ ventrikülün arkasında ve solunda yer alır. Girişi mitral kapak, çıkışı ise aort kapağıdır.',
      clinical: 'Mitral-aortik fibröz devamlılık, santral fibröz gövde ve membranöz septum ile bitişiktir.'
    },
    en: {
      title: 'Left ventricle • LV',
      description: 'The systemic pumping chamber lies behind and to the left of the right ventricle. Its inlet is the mitral valve and its outlet leads to the aorta.',
      clinical: 'Mitral–aortic fibrous continuity adjoins the central fibrous body and membranous septum.'
    },
    source: `${atlas}, PDF pp. 38–39; ${rv}`
  },
  aorta: {
    tr: {
      title: 'Aort ve aort kökü',
      description: 'Sistemik arteriyel çıkış damarı. Aort kökü sol atriyumun önünde yer alır ve atriyal septal bölge ile yakın ilişkilidir.',
      clinical: 'Bu model uzaysal anatomik oryantasyonu gösterir; kateter angajmanı veya girişimsel güvenlik hedefi teşkil etmez.'
    },
    en: {
      title: 'Aorta & aortic root',
      description: 'The systemic arterial outlet. The aortic root is anterior to the left atrium and closely related to the atrial septal region.',
      clinical: 'This schematic shows spatial orientation, not a catheter engagement target.'
    },
    source: la
  },
  pa: {
    tr: {
      title: 'Pulmoner trunkus • PA',
      description: 'Sağ ventrikül çıkış yolu pulmoner dolaşıma devam eder. Pulmoner arter bifurkasyonu sol atriyum çatısına yakındır.',
      clinical: 'Sağ ventrikül çıkış yolu (RVOT) belirgin musküler mimariye ve kendine özgü elektrofizyolojik özelliklere sahiptir.'
    },
    en: {
      title: 'Pulmonary trunk • PA',
      description: 'The right ventricular outlet continues toward the pulmonary circulation. The pulmonary trunk bifurcation is near the left atrial roof.',
      clinical: 'The right ventricular outflow tract has a distinct muscular architecture.'
    },
    source: `${rv}; ${la}`
  },
  svc: {
    tr: {
      title: 'Vena kava süperior • SVC',
      description: 'Üst sistemik venöz kanı sağ atriyuma taşır. Miyokardiyal kılıflar ven duvarı üzerine uzanabilir.',
      clinical: 'Sinüs düğümü bölgesi ve terminal sulkus yakın anatomik komşulardır.'
    },
    en: {
      title: 'Superior vena cava • SVC',
      description: 'The superior caval vein enters the upper right atrium. Myocardial sleeves may extend onto its wall.',
      clinical: 'The sinus nodal region and terminal crest are nearby landmarks.'
    },
    source: `${atlas}, PDF pp. 15–17`
  },
  ivc: {
    tr: {
      title: 'Vena kava inferior • IVC',
      description: 'Alt sistemik venöz kanı sağ atriyum tabanına boşaltır. Eustachian kapağı ve kresti komşu anatomik yapılardır.',
      clinical: 'Kavotriküspit istmus (CTI), IVC orifisi ile triküspit anulusu arasında uzanır; tipik atriyal flatter ablasyonunun hedefidir.'
    },
    en: {
      title: 'Inferior vena cava • IVC',
      description: 'The inferior caval opening lies at the lower right atrium. The Eustachian valve and ridge are neighboring structures.',
      clinical: 'The cavotricuspid isthmus spans the region between the inferior caval opening and tricuspid hinge; its contour and thickness vary.'
    },
    source: 'İnferior sağ atriyal istmus anatomisi, PDF pp. 2–3'
  },
  'ts-sheath': {
    tr: {
      title: 'Transseptal kılıf + kılavuz tel',
      description: 'Femoral venden İVC yoluyla sağ atriyuma ilerletilen transseptal kılıf/dilatatör sistemi. Standart teknikte kılavuz tel önce SVC\'ye kadar ilerletilir; iğneli sistem sonra SVC\'den geriye çekilerek fossa ovalise oturtulur (pull-down).',
      clinical: 'İVC\'den SVC\'ye uzanan mavi hat bu hazırlık pozisyonudur; ponksiyon SVC\'de değil, geri çekilme sırasında fossa ovaliste yapılır. Şematik model.'
    },
    en: {
      title: 'Transseptal sheath + guidewire',
      description: 'The transseptal sheath/dilator system advanced from the femoral vein through the IVC into the right atrium. In the standard technique the guidewire is first parked in the SVC; the needle system is then withdrawn from the SVC onto the fossa ovalis (pull-down).',
      clinical: 'The blue line running from the IVC to the SVC is this staging position; the puncture happens at the fossa during pull-down, never in the SVC. Schematic model.'
    },
    source: 'Standard transseptal technique references; schematic'
  },
  'pigtail-cath': {
    tr: {
      title: 'Pigtail kateter • Aort kökü işareti',
      description: 'Femoral arterden retrograd ilerletilen, ucu kıvrık (pigtail) tanısal kateter. Transseptal ponksiyon sırasında nonkoroner cuspa (NCC) oturtulur ve floroskopide aort kökünü işaretler.',
      clinical: 'NCC interatriyal septuma komşudur: transseptal iğne her zaman pigtailin posteroinferiorunda kalmalıdır. Cusp halkaları: yeşil = LCC, turuncu = RCC, camgöbeği = NCC. Şematik model.'
    },
    en: {
      title: 'Pigtail catheter • Aortic root marker',
      description: 'A diagnostic catheter with a curled tip advanced retrogradely from the femoral artery. During transseptal puncture it is seated in the non-coronary cusp (NCC), marking the aortic root on fluoroscopy.',
      clinical: 'The NCC abuts the interatrial septum: the transseptal needle must stay posteroinferior to the pigtail. Cusp rings: green = LCC, orange = RCC, cyan = NCC. Schematic model.'
    },
    source: 'Standard transseptal technique references; schematic'
  },
  'cs-cath': {
    tr: {
      title: 'CS dekapolar kateter • AV oluk işareti',
      description: 'Femoral venden koroner sinüs ostiyumuna yerleştirilen 10 elektrotlu (dekapolar) tanısal EP kateteri. Koroner sinüs boyunca uzanarak floroskopide sol AV oluğu ve septumun inferior sınırını çizer.',
      clinical: 'Transseptal ponksiyonda fossa hedefi pigtail (anterosuperior sınır) ile CS kateteri (inferior sınır) arasında kalır. Elektrogramları AVNRT/AVRT tanısında da kullanılır. Şematik model.'
    },
    en: {
      title: 'CS decapolar catheter • AV groove marker',
      description: 'A 10-electrode (decapolar) diagnostic EP catheter placed from the femoral vein into the coronary sinus ostium. Lying along the CS, it outlines the left AV groove and the inferior septal border on fluoroscopy.',
      clinical: 'During transseptal puncture the fossa target sits between the pigtail (anterosuperior limit) and the CS catheter (inferior limit). Its electrograms also serve AVNRT/AVRT diagnosis. Schematic model.'
    },
    source: 'Standard EP catheter placement references; schematic'
  },
  'cath-ra': {
    tr: { title: 'RA istasyonu • ort < 5 mmHg', description: 'Sağ atriyum basıncı: a, c, v dalgaları, x ve y inişleri. O₂ satürasyonu %75.', clinical: 'Yüksek RA basıncı: sağ kalp yetersizliği, triküspit yetersizliği, tamponad veya konstriksiyon.' },
    en: { title: 'RA station • mean < 5 mmHg', description: 'Right atrial pressure: a, c and v waves with x and y descents. O₂ saturation 75%.', clinical: 'Raised RA pressure: right heart failure, tricuspid regurgitation, tamponade or constriction.' },
    source: 'Standard hemodynamic normals (adult, supine); schematic'
  },
  'cath-rv': {
    tr: { title: 'RV istasyonu • 25/5 mmHg', description: 'Sağ ventrikül sistolik < 25, diyastolik < 5 mmHg. O₂ %75.', clinical: 'RV sistolik basınç, pulmoner kapak darlığı yoksa PA sistolik basıncına eşittir.' },
    en: { title: 'RV station • 25/5 mmHg', description: 'Right ventricular systolic < 25, diastolic < 5 mmHg. O₂ 75%.', clinical: 'Without pulmonary stenosis, RV systolic pressure equals PA systolic pressure.' },
    source: 'Standard hemodynamic normals (adult, supine); schematic'
  },
  'cath-pa': {
    tr: { title: 'PA istasyonu • 25/10, ort < 15', description: 'Pulmoner arter sistolik < 25, diyastolik < 10, ortalama < 15 mmHg. O₂ %75.', clinical: 'Ortalama PA basıncı > 20 mmHg pulmoner hipertansiyon tanımıdır.' },
    en: { title: 'PA station • 25/10, mean < 15', description: 'Pulmonary artery systolic < 25, diastolic < 10, mean < 15 mmHg. O₂ 75%.', clinical: 'Mean PA pressure > 20 mmHg defines pulmonary hypertension.' },
    source: 'Standard hemodynamic normals (adult, supine); schematic'
  },
  'cath-wedge': {
    tr: { title: 'Wedge (PCWP) • ort < 12', description: 'Balon hedefi sol PA dalı üzerinde şematiktir; atlas küçük oklüzyon dalını içermez. Gerçek PCWP distal küçük dal oklüzyonunda LA basıncını gecikmeli ve sönümlü yansıtır. O₂ %97.', clinical: 'PCWP > 15 mmHg postkapiller (sol kalp kaynaklı) pulmoner hipertansiyonu düşündürür.' },
    en: { title: 'Wedge (PCWP) • mean < 12', description: 'Balloon target on the left PA branch is schematic; the atlas lacks the small occluded vessel. Actual PCWP reflects LA pressure through distal small-branch occlusion. O₂ 97%.', clinical: 'PCWP > 15 mmHg suggests post-capillary (left-heart) pulmonary hypertension.' },
    source: 'Standard hemodynamic normals (adult, supine); schematic'
  },
  'cath-lv': {
    tr: { title: 'LV istasyonu • 120/8 mmHg', description: 'Sol ventrikül sistolik < 120, diyastolik (LVEDP) < 8-12 mmHg. O₂ %95.', clinical: 'LVEDP yüksekliği diyastolik disfonksiyon veya volüm yükünü gösterir.' },
    en: { title: 'LV station • 120/8 mmHg', description: 'Left ventricular systolic < 120, diastolic (LVEDP) < 8-12 mmHg. O₂ 95%.', clinical: 'Raised LVEDP reflects diastolic dysfunction or volume load.' },
    source: 'Standard hemodynamic normals (adult, supine); schematic'
  },
  'cath-ao': {
    tr: { title: 'Aort istasyonu • 120/80 mmHg', description: 'Aort sistolik < 120, diyastolik < 80 mmHg; dikrotik çentik aort kapanışını gösterir. O₂ %95.', clinical: 'Geri çekmede LV-aort sistolik farkı aort darlığı gradyanıdır.' },
    en: { title: 'Aortic station • 120/80 mmHg', description: 'Aortic systolic < 120, diastolic < 80 mmHg; the dicrotic notch marks aortic closure. O₂ 95%.', clinical: 'On pull-back, the LV-aortic systolic difference is the aortic stenosis gradient.' },
    source: 'Standard hemodynamic normals (adult, supine); schematic'
  },
  'koch-triangle': {
    tr: { title: 'Koch üçgeni', description: 'Sağ atriyum alt septumunda; taban CS ostiyumu, kenarları Todaro tendonu ve triküspit septal yaprakçık menteşesi, apeksi kompakt AV düğüm.', clinical: 'Hem kaçınılacak bölgeyi (AV düğüm, hızlı yol) hem hedefi (yavaş yol) içerdiği için AVNRT ablasyonunun temel haritasıdır.' },
    en: { title: 'Triangle of Koch', description: 'Lower septal right atrium; base = CS ostium, sides = tendon of Todaro and the septal tricuspid hinge, apex = compact AV node.', clinical: 'Holds both the zone to avoid (AV node, fast pathway) and the target (slow pathway): the core map for AVNRT ablation.' },
    source: 'Koch triangle anatomy (Cardiac Physiology in Practice, Anatomy Spotlight); schematic'
  },
  'koch-todaro': {
    tr: { title: 'Todaro tendonu', description: 'Eustachian valf / sırtın devamı olan fibröz kordon; Koch üçgeninin posterosüperior kenarı, santral fibröz gövdeye uzanır.', clinical: 'Hızlı yol bu kenara komşu, apekse yakındır; yakın bölgede ablasyon PR uzaması veya AV blok riski taşır.' },
    en: { title: 'Tendon of Todaro', description: 'Fibrous cord continuing the Eustachian valve / ridge; the posterosuperior side of Koch\'s triangle, running to the central fibrous body.', clinical: 'The fast pathway lies next to it near the apex; ablating close by risks PR prolongation or AV block.' },
    source: 'Koch triangle anatomy (Cardiac Physiology in Practice, Anatomy Spotlight); schematic'
  },
  'koch-base': {
    tr: { title: 'CS ostiyumu (Koch tabanı)', description: 'Koroner sinüsün sağ atriyuma açıldığı ağız; Koch üçgeninin tabanı. Floroskopide proksimal CS elektrotları tabanı işaretler.', clinical: 'Yavaş yol tabanın hemen üstünde, CS ağzı ile triküspit septal yaprakçık arasındadır.' },
    en: { title: 'CS ostium (Koch base)', description: 'The opening of the coronary sinus into the right atrium; the base of Koch\'s triangle. On fluoroscopy the proximal CS electrodes mark it.', clinical: 'The slow pathway sits just above the base, between the CS ostium and the septal tricuspid leaflet.' },
    source: 'Koch triangle anatomy (Cardiac Physiology in Practice, Anatomy Spotlight); schematic'
  },
  'koch-avnode': {
    tr: { title: 'Kompakt AV düğüm (Koch apeksi)', description: 'Koch üçgeninin apeksinde, triküspit septal menteşesinin membranöz septumla birleştiği yerde; His demeti buradan santral fibröz gövdeyi deler. Floroskopide His kateteri apeksi gösterir.', clinical: 'Bu bölgeye ablasyon kalıcı tam AV blok yapar: kesin kaçınılacak bölge.' },
    en: { title: 'Compact AV node (Koch apex)', description: 'At the apex of Koch\'s triangle, where the septal tricuspid hinge meets the membranous septum; the His bundle penetrates the central fibrous body from here. On fluoroscopy the His catheter marks the apex.', clinical: 'Ablation here causes permanent complete AV block: strictly the zone to avoid.' },
    source: 'Koch triangle anatomy (Cardiac Physiology in Practice, Anatomy Spotlight); schematic'
  },
  'koch-fast': {
    tr: { title: 'Hızlı yol (kaçınılacak bölge)', description: 'Todaro tendonuna komşu, apeksin hemen altındaki süperior atriyal giriş; tipik AVNRT\'de retrograd kol.', clinical: 'Hızlı yol modifikasyonu yüksek AV blok riski nedeniyle günümüzde tercih edilmez.' },
    en: { title: 'Fast pathway (zone to avoid)', description: 'Superior atrial input next to the tendon of Todaro, just below the apex; the retrograde limb in typical AVNRT.', clinical: 'Fast-pathway modification is avoided today because of the high AV block risk.' },
    source: 'Koch triangle anatomy (Cardiac Physiology in Practice, Anatomy Spotlight); schematic'
  },
  'koch-slow': {
    tr: { title: 'Yavaş yol (ablasyon hedefi)', description: 'İnferior atrial giriş; CS ostiyumu ile triküspit septal yaprakçığı arasında, Koch tabanına yakın. Tipik AVNRT\'de antegrad kol.', clinical: 'Tipik AVNRT\'de standart hedef: tabandan başlayıp apekse doğru kademeli RF uygulanır, junctional ritim başarı işaretidir.' },
    en: { title: 'Slow pathway (ablation target)', description: 'Inferior atrial input between the CS ostium and the septal tricuspid leaflet, near the base of Koch\'s triangle; the antegrade limb in typical AVNRT.', clinical: 'The standard target in typical AVNRT: RF starts at the base and moves stepwise toward the apex; junctional rhythm marks success.' },
    source: 'Koch triangle anatomy (Cardiac Physiology in Practice, Anatomy Spotlight); schematic'
  },
  'cti-line': {
    tr: { title: 'CTI ablasyon hattı', description: 'Triküspit anulusunun inferior kenarından (LAO saat 6) İVC ağzına uzanan lineer RF hattı; CS ostiyumunun lateralinde, santral istmusta.', clinical: 'Tipik flatterde hedef çift yönlü istmus blokudur; kalın Eustachian sırtı ve subeustachian cep başarıyı zorlaştırabilir.' },
    en: { title: 'CTI ablation line', description: 'Linear RF line from the inferior tricuspid annulus (6 o\'clock in LAO) to the IVC orifice, across the central isthmus lateral to the CS ostium.', clinical: 'In typical flutter the goal is bidirectional isthmus block; a thick Eustachian ridge or a sub-Eustachian pouch can make it harder.' },
    source: 'Standard EP ablation anatomy; schematic'
  },
  'pvi-waca': {
    tr: { title: 'WACA / PVI halkası', description: 'Aynı taraftaki pulmoner ven çiftinin çevresinde, ostiyumların dışında antrumda çizilen çevresel RF halkası.', clinical: 'Hedef giriş ve çıkış bloku; posterior duvarda özofagus, sağ venlerde frenik sinir riski.' },
    en: { title: 'WACA / PVI ring', description: 'Circumferential RF ring around an ipsilateral pulmonary vein pair, placed on the antrum outside the ostia.', clinical: 'Goal: entrance and exit block; esophageal risk on the posterior wall, phrenic nerve risk at the right veins.' },
    source: 'Standard EP ablation anatomy; schematic'
  },
  'la-roof-line': {
    tr: { title: 'LA çatı hattı', description: 'Sol ve sağ süperior pulmoner venleri LA tavanında birleştiren lineer lezyon.', clinical: 'Çatıya bağlı makro-reentran atriyal flatterde kullanılır; blok, posterior duvarın kaudo-kraniyal aktivasyonuyla doğrulanır.' },
    en: { title: 'LA roof line', description: 'Linear lesion joining the left and right superior pulmonary veins across the LA roof.', clinical: 'Used for roof-dependent macro-reentrant flutter; block is confirmed by caudocranial activation of the posterior wall.' },
    source: 'Standard EP ablation anatomy; schematic'
  },
  'mitral-isthmus-line': {
    tr: { title: 'Mitral istmus hattı', description: 'LIPV ostiyumundan lateral mitral anulusa uzanan lineer lezyon.', clinical: 'Perimitral flatterde kullanılır; blok için sıklıkla koroner sinüs içinden uygulama gerekir, sirkumfleks artere yakındır.' },
    en: { title: 'Mitral isthmus line', description: 'Linear lesion from the LIPV ostium to the lateral mitral annulus.', clinical: 'Used for perimitral flutter; block often needs ablation from inside the coronary sinus, close to the circumflex artery.' },
    source: 'Standard EP ablation anatomy; schematic'
  },
  amc: {
    tr: {
      title: 'Aorto-mitral devamlılık • AMC',
      description: 'AMC, mitral anulusun anteromedial yüzünün aort kapağına doğru devamı olarak tanımlanır. Mitral ön yaprakçık ile sol ve nonkoroner aortik yaprakçıklar arasındaki fibröz perdedir (aorto-mitral perde).',
      clinical: 'Aktif atlas AMC için kayıtlı bir mesh içermez. Bu öğe yalnız referans notudur; sarı veya yüzeysel bir 3B perde gösterilmez.'
    },
    en: {
      title: 'Aorto-mitral continuity • AMC',
      description: 'The AMC is defined as the continuation of the anteromedial aspect of the mitral annulus to the aortic valve: the fibrous curtain between the anterior mitral leaflet and the left and non-coronary aortic leaflets.',
      clinical: 'The active atlas has no registered AMC mesh. This entry is a reference note only; no invented 3D curtain is displayed.'
    },
    source: 'Ho et al., valve anatomy reviews; reference note, no registered mesh'
  },
  diaphragm: {
    tr: {
      title: 'Diyafram',
      description: 'Kalbin üzerine oturduğu ana solunum kası. Sağ hemidiyafram karaciğer nedeniyle daha yüksektir. Şematik kubbe gösterimi.',
      clinical: 'İnferior duvar (diyafragmatik yüz) enfarktları ve frenik sinir hasarı sonrası diyafram paralizisi klinik ilişkileridir.'
    },
    en: {
      title: 'Diaphragm',
      description: 'The main respiratory muscle on which the heart rests. The right hemidiaphragm sits higher because of the liver. Schematic dome.',
      clinical: 'Relevant to inferior (diaphragmatic) wall infarcts and to diaphragmatic paralysis after phrenic nerve injury.'
    },
    source: 'Schematic context'
  },
  phrenic: {
    tr: {
      title: 'Frenik sinirler',
      description: 'Sağ frenik sinir SVC lateralinden sağ atriyum yan duvarı boyunca (sağ pulmoner venlerin önünden) diyaframa iner; sol frenik sinir aort arkusu ve sol atriyal apendiks/LV lateral duvarı üzerinden seyreder.',
      clinical: 'Sağ frenik: RSPV izolasyonu ve SVC ablasyonunda hasar riski (kryobalonda frenik pacing ile izlenir). Sol frenik: LAA kapatma ve LV lateral epikardiyal lead yerleşiminde önemlidir. Şematik seyir.'
    },
    en: {
      title: 'Phrenic nerves',
      description: 'The right phrenic nerve descends lateral to the SVC along the right atrial wall (in front of the right pulmonary veins) to the diaphragm; the left phrenic courses over the aortic arch and the LAA / lateral LV wall.',
      clinical: 'Right phrenic: at risk in RSPV isolation and SVC ablation (monitored with phrenic pacing during cryoballoon). Left phrenic: relevant to LAA closure and lateral epicardial LV leads. Schematic course.'
    },
    source: 'Sánchez-Quintana et al., phrenic nerve anatomy; schematic'
  },
  vertebrae: {
    tr: {
      title: 'Vertebra kolonu',
      description: 'Kalbin arkasındaki torasik omurga; floroskopide temel derinlik ve orta hat referansıdır. Silik şematik gösterim.',
      clinical: 'AP projeksiyonda omurga orta hattı, kateter pozisyonlarının sağ/sol değerlendirmesinde referans alınır.'
    },
    en: {
      title: 'Vertebral column',
      description: 'The thoracic spine behind the heart; a basic depth and midline reference in fluoroscopy. Faint schematic.',
      clinical: 'In the AP projection the spine marks the midline used to judge right/left catheter positions.'
    },
    source: 'Schematic context'
  },
  'mitral-annulus': {
    tr: {
      title: 'Mitral anulus',
      description: 'Sol atriyum ile sol ventrikül arasındaki D-şekilli, eyer (saddle) geometrili fibröz halka. Anterior segmenti aorto-mitral devamlılığa (AMC) katılır.',
      clinical: 'Anuloplasti halkaları ve perkütan mitral tamir (TEER) anulus geometrisine göre planlanır. Şematik halka.'
    },
    en: {
      title: 'Mitral annulus',
      description: 'The D-shaped, saddle-form fibrous ring between the left atrium and ventricle. Its anterior segment joins the aorto-mitral continuity.',
      clinical: 'Annuloplasty rings and transcatheter mitral repair (TEER) are planned around annular geometry. Schematic ring.'
    },
    source: 'Ho et al., mitral annulus anatomy; schematic'
  },
  'tricuspid-annulus': {
    tr: {
      title: 'Triküspit anulus',
      description: 'Sağ atriyum ile sağ ventrikül arasındaki non-planar, oval fibröz halka; septal segmenti Koch üçgeninin tabanını yapar.',
      clinical: 'Fonksiyonel triküspit yetersizliğinde anulus dilatasyonu tipiktir; CTI hattı anulusun inferior kenarına komşudur. Şematik halka.'
    },
    en: {
      title: 'Tricuspid annulus',
      description: 'The non-planar oval fibrous ring between the right atrium and ventricle; its septal segment forms the base of Koch\'s triangle.',
      clinical: 'Annular dilation drives functional tricuspid regurgitation; the CTI line abuts the inferior annulus. Schematic ring.'
    },
    source: 'Ho et al., tricuspid annulus anatomy; schematic'
  },
  lm: {
    tr: {
      title: 'Sol ana koroner arter • LM',
      description: 'Aort kökünün sol koroner sinüs duvarındaki ostiyumdan çıkar; LAD ve LCX dallarına ayrılır.',
      clinical: 'Ostiyum yaprakçık üzerinde değildir. Gösterilen damar başlangıcının kaynak modelle anatomik eşleşmesi bağımsız doğrulanmamıştır.'
    },
    en: {
      title: 'Left main coronary artery • LM',
      description: 'Arises from the left aortic sinus ostium and bifurcates into the LAD and LCX arteries.',
      clinical: 'The coronary ostium is located in the sinus wall, not on the leaflet. Preserves uniform coordinate registration with the atlas.'
    },
    source: 'Joshi et al., 2010, PMC2815286; mini atlas, PDF p. 7'
  },
  lad: {
    tr: {
      title: 'Sol ön inen arter • LAD',
      description: 'LM bifurkasyonundan sonra ön interventriküler olukta RV ile LV arasında apekse doğru ilerler.',
      clinical: 'Ön interventriküler oluk, atriyoventriküler oluktan farklıdır. Damar geometrisinin kaynak atlasla uyumu korunmuştur.'
    },
    en: {
      title: 'Left anterior descending artery • LAD',
      description: 'Travels down the anterior interventricular groove from the LM bifurcation toward the cardiac apex.',
      clinical: 'Supplies the anterior ventricular septum and anterior LV wall via septal and diagonal branches.'
    },
    source: 'Kardiyak anatomi atlası, PDF p. 7'
  },
  lcx: {
    tr: {
      title: 'Sol sirkumfleks arter • LCX',
      description: 'LM bifurkasyonundan ayrılır; sol atriyum ile sol ventrikül arasındaki sol atriyoventriküler olukta arkaya döner.',
      clinical: 'Sol ventrikül yan duvarına marjinal dallar verir. Modelin dal dağılımı bireysel anatominin doğrulanmış karşılığı değildir.'
    },
    en: {
      title: 'Left circumflex artery • LCX',
      description: 'Originates from the LM bifurcation and courses along the left atrioventricular groove toward the posterior base.',
      clinical: 'Gives off obtuse marginal branches supplying the LV lateral free wall.'
    },
    source: 'Kardiyak anatomi atlası, PDF p. 7'
  },
  rca: {
    tr: {
      title: 'Sağ koroner arter • RCA',
      description: 'Sağ koroner sinüs duvarından çıkar; sağ atriyum ile sağ ventrikül arasındaki sağ atriyoventriküler oluk boyunca ilerler.',
      clinical: 'Ostiyum sağ koroner yaprakçık üzerinde değildir. Ana RCA ile RV yüzeyine inen akut marjinal dalları ayırt edin.'
    },
    en: {
      title: 'Right coronary artery • RCA',
      description: 'Arises from the right aortic sinus and travels along the right atrioventricular sulcus toward the cardiac crux.',
      clinical: 'Supplies the right ventricle, inferior LV wall, and in most patients gives rise to the posterior descending artery (PDA).'
    },
    source: 'Joshi et al., 2010, PMC2815286; mini atlas, PDF p. 7'
  },
  cs: {
    tr: {
      title: 'Koroner sinüs ana gövdesi • CS Trunk',
      description: 'İnferior atriyoventriküler olukta yer alan, miyokardiyal venöz kanın %75\'ini toplayıp Thebesian kapağı yoluyla sağ atriyuma boşaltan ana toplayıcı venöz kanaldır.',
      clinical: 'Ostiyumu Koch üçgeninin tabanını belirler. Biventriküler pacing (CRT) sol ventrikül lead yerleşimi ve elektrofizyolojik haritalama kateterleri için birincil vasküler giriş yoludur.'
    },
    en: {
      title: 'Coronary sinus main trunk • CS Trunk',
      description: 'The primary venous collector in the posterior atrioventricular groove that drains ~75% of cardiac venous blood into the right atrium via the Thebesian valve.',
      clinical: 'Its ostium frames the base of Koch’s triangle. Crucial vascular gateway for cardiac resynchronization therapy (CRT) lead delivery and EP mapping.'
    },
    source: 'Coronary sinus and cardiac venous anatomy, PDF p. 3; Ho et al., 2012, PDF pp. 2–3'
  },
  sa: {
    tr: {
      title: 'Sinoatriyal düğüm (SA) • Şematik',
      description: 'Sağ atriyum üst posterolateral duvarında, SVC giriş bileşkesinde (sulcus terminalis) yer alan birincil doğal pacemaker merkezidir.',
      clinical: 'Elektriksel uyarılar internodal yollar ve Bachmann demeti aracılığıyla atriyumlara ve AV düğüme iletilir. Not: Bu geometri atlas mesh\'i değil, şematik bir 3D çizimdir.'
    },
    en: {
      title: 'Sinoatrial node (SA) • Schematic',
      description: 'The primary cardiac pacemaker, located subepicardially at the junction of the superior vena cava and right atrium.',
      clinical: 'Impulses propagate across internodal pathways and Bachmann bundle toward the AV node. Note: This geometry is a schematic 3D illustration, not an atlas mesh.'
    },
    source: `${atlas}, PDF pp. 15–17; Ho et al., 2003, PDF p. 1`
  },
  bachmann: {
    modelType: 'schematic',
    tr: {
      title: 'Bachmann demeti • Şematik',
      description: 'Sağ ve sol atriyumun ön-üst çatısını birbirine bağlayan geniş subepikardiyal kas bandıdır. Çevre atriyal miyokardla devamlılık gösterir; yalıtılmış bir kablo değildir.',
      clinical: 'Bachmann bölgesi pacing lead’i sağ atriyumun üst anteroseptal bölgesine endokardiyal olarak yerleşir; epikardiyal bandın içine ilerletilmez. Floroskopik konum doğrudan demet yakalanmasını kanıtlamaz; yüzey EKG’si ve intrakardiyak elektrogramlarla değerlendirme gerekir.'
    },
    en: {
      title: 'Bachmann bundle • Schematic',
      description: 'A broad subepicardial muscular band connects the anterior-superior roofs of the right and left atria. It is continuous with surrounding atrial myocardium, not an insulated cable.',
      clinical: 'Bachmann bundle area pacing places an endocardial lead in the high right atrial anteroseptal region, not through the epicardial band. Fluoroscopic position does not prove direct bundle capture; surface ECG and intracardiac electrograms are needed for assessment.'
    },
    source: 'Fontenla et al., 2026, doi:10.1016/j.jaccas.2026.108795; PMC10637835'
  },
  av: {
    tr: {
      title: 'Atriyoventriküler düğüm (AV) • Şematik',
      description: 'Sağ atriyum septal duvarında, Koch üçgeninin apeksinde (Todaro tendonu, triküspit septal anulusu ve koroner sinüs ostiyumu arasında) yer alır.',
      clinical: 'Atriyumlardan ventriküllere geçişte fizyolojik gecikmeyi sağlar. AVNRT kateter ablasyonunda yavaş yol hedefi bu bölgenin inferoposteriorundadır. Şematik çizimdir.'
    },
    en: {
      title: 'Atrioventricular node (AV) • Schematic',
      description: 'Located in the subendocardium of the right atrial septum at the apex of the triangle of Koch.',
      clinical: 'Provides physiological delay for ventricular filling. Slow-pathway ablation for AVNRT targets its inferoposterior margin. Note: Schematic illustration.'
    },
    source: av
  },
  his: {
    tr: {
      title: 'His demeti & İleti dalları • Şematik',
      description: 'AV düğümden doğan His demeti santral fibröz gövdeyi delerek interventriküler septum krestine geçer; Sağ Demet Dalı (RBB) ve Sol Demet Dalı (LBB) olarak ikiye ayrılır.',
      clinical: 'RBB moderator band ile RV apekse uzanır; LBB sol ventrikülde fasiküllere ayrılarak Purkinje ağı ile ventriküler senkron kasılmayı yönetir. Şematik 3D modeldir.'
    },
    en: {
      title: 'Bundle of His & Purkinje system • Schematic',
      description: 'Arises from the AV node, penetrates the central fibrous body, and bifurcates along the crest of the muscular interventricular septum into RBB and LBB.',
      clinical: 'RBB courses toward the moderator band; LBB arborizes into fascicles over the LV septum. Critical for physiological conduction pacing. Note: Schematic 3D illustration.'
    },
    source: av
  },
  fossa: {
    tr: {
      title: 'Fossa ovalis',
      description: 'İnteratriyal septumun ince, çökük membranıdır. Transseptal iğne buradan sol atriyuma geçer.',
      clinical: 'Non-koroner kuspun altında ve arkasındadır. Üst kenar aort köküne, alt kenar triküspit anulusuna, arka kenar sol atriyum serbest duvarına yakındır. Şematik membran.'
    },
    en: {
      title: 'Fossa ovalis',
      description: 'The thin depressed membrane of the interatrial septum. The transseptal needle crosses here into the left atrium.',
      clinical: 'It lies inferior and posterior to the non-coronary cusp. The superior rim is near the aortic root, the inferior rim near the tricuspid annulus, and the posterior rim near the left atrial free wall. Schematic membrane.'
    },
    source: 'Fossa ovalis relations to the non-coronary cusp and tricuspid annulus'
  },
  mitral: {
    tr: {
      title: 'Mitral kapak • Sol AV kapak',
      description: 'Sol atriyumu sol ventriküle bağlayan iki yaprakçıklı (anterior ve posterior) atriyoventriküler kapaktır.',
      clinical: 'Atlas düğümü yalnız posterior yaprakçığı içerir. Ön yaprakçık, ölçülmüş anulusun boş yayına oturan şematik bir yelkendir. Korda yoktur.'
    },
    en: {
      title: 'Mitral valve • Left AV valve',
      description: 'Marks the left atrioventricular junction, connecting the left atrial vestibule to the ventricular inlet.',
      clinical: 'The atlas node contains only the posterior leaflet. The anterior leaflet is a schematic sail on the uncovered arc of the measured annulus. Chordae are not included.'
    },
    source: 'Ho et al., 2012, PDF p. 7; mini atlas, PDF pp. 38–39'
  },
  'mitral-posterior': {
    tr: {
      title: 'Posterior mitral yaprakçık • PML',
      description: 'Mitral kapağın mural yaprakçığıdır. Anulus çevresinin büyük bölümünü tutar. Serbest kenar klinikte P1, P2 ve P3 taraklarına ayrılır.',
      clinical: 'Atlas parçası tek posterior yaprakçıktır; taraklar ayrı mesh değildir. Korda yoktur.'
    },
    en: {
      title: 'Posterior mitral leaflet • PML',
      description: 'The mural leaflet of the mitral valve. It occupies most of the annular circumference. Its free edge is divided clinically into P1, P2 and P3 scallops.',
      clinical: 'The atlas part is a single posterior leaflet; the scallops are not separate meshes. Chordae are not included.'
    },
    source: 'Ho et al., 2012, PDF p. 7; mini atlas, PDF pp. 38–39'
  },
  'mitral-anterior': {
    tr: {
      title: 'Anterior mitral yaprakçık • AML · şematik',
      description: 'Aort kapağı ile fibröz devamlılığı olan ön yaprakçıktır. Anulus çevresinin kısa bir yayını, kapak alanının büyük bölümünü tutar.',
      clinical: 'Atlas düğümü yoktur. Parça, ölçülmüş anulusun posterior yaprakçığın karşı yayına oturan şematik bir yelkendir. Korda yoktur.'
    },
    en: {
      title: 'Anterior mitral leaflet • AML · schematic',
      description: 'The anterior leaflet is in fibrous continuity with the aortic valve. It takes a short arc of the annulus and most of the leaflet area.',
      clinical: 'The atlas has no anterior leaflet node. This part is a schematic sail on the annular arc opposite the posterior leaflet. Chordae are not included.'
    },
    source: 'Ho et al., 2012, PDF p. 7; mini atlas, PDF pp. 38–39'
  },
  tricuspid: {
    tr: {
      title: 'Triküspit kapak • Sağ AV kapak',
      description: 'Sağ atriyum ile sağ ventrikül arasındaki üç yaprakçıklı (anterior, posterior, septal) kapak aygıtıdır.',
      clinical: 'Atlas septal ve inferior yaprakçıkları içerir. Anterior yaprakçık, ölçülmüş anulusun boş yayına oturan şematik bir yelkendir. Septal menteşe Koch üçgeninin sınırıdır.'
    },
    en: {
      title: 'Tricuspid valve • Right AV valve',
      description: 'The right atrioventricular valve has septal, anterior and inferior leaflets with chordal attachments to the ventricular apparatus.',
      clinical: 'The atlas contains the septal and inferior leaflets. The anterior leaflet is a schematic sail on the uncovered arc of the measured annulus. The septal hinge is a landmark for Koch’s triangle.'
    },
    source: `${rv}; ${av}`
  },
  'tricuspid-septal': {
    tr: {
      title: 'Septal triküspit yaprakçık',
      description: 'Triküspit kapağın septal yaprakçığıdır. Menteşesi septum üzerindedir ve Koch üçgeninin bir kenarını oluşturur.',
      clinical: 'Atlas parçasıdır. Septal menteşe, AV düğüm ve His demetine en yakın yaprakçık kenarıdır. Korda yoktur.'
    },
    en: {
      title: 'Septal tricuspid leaflet',
      description: 'The septal leaflet of the tricuspid valve. Its hinge lies on the septum and forms one side of the triangle of Koch.',
      clinical: 'Atlas part. The septal hinge is the leaflet edge closest to the AV node and the bundle of His. Chordae are not included.'
    },
    source: `${rv}; ${av}`
  },
  'tricuspid-inferior': {
    tr: {
      title: 'İnferior triküspit yaprakçık',
      description: 'Triküspit kapağın diyafragmatik yaprakçığıdır. Cerrahi metinlerde posterior yaprakçık olarak da geçer.',
      clinical: 'Atlas düğümünün adı inferior yaprakçıktır. Bu, posterior yaprakçıkla aynı parçadır; dördüncü bir yaprakçık yoktur. Korda yoktur.'
    },
    en: {
      title: 'Inferior tricuspid leaflet',
      description: 'The diaphragmatic leaflet of the tricuspid valve. Surgical texts also call it the posterior leaflet.',
      clinical: 'The atlas node is named the inferior leaflet. It is the same leaflet as the posterior leaflet, not a fourth cusp. Chordae are not included.'
    },
    source: `${rv}; ${av}`
  },
  'tricuspid-anterior': {
    tr: {
      title: 'Anterior triküspit yaprakçık · şematik',
      description: 'Triküspit kapağın en geniş yaprakçığıdır. Anterosüperior anulus boyunca sağ ventrikül serbest duvarına uzanır.',
      clinical: 'Atlas yalnız septal ve inferior yaprakçıkları içerir. Bu parça, ölçülmüş anulusun boş yayına oturan şematik bir yelkendir. Korda yoktur.'
    },
    en: {
      title: 'Anterior tricuspid leaflet · schematic',
      description: 'The largest tricuspid leaflet. It runs along the anterosuperior annulus toward the right ventricular free wall.',
      clinical: 'The atlas contains only the septal and inferior leaflets. This part is a schematic sail on the uncovered arc of the measured annulus. Chordae are not included.'
    },
    source: `${rv}; ${av}`
  },
  lcc: {
    tr: {
      title: 'Sol koroner yaprakçık • LCC',
      description: 'Aort kapağının sol koroner yaprakçığıdır; sol koroner sinüs, komşu aort kökü duvarındaki genişlemedir.',
      clinical: 'Kaynak parça yaprakçıktır, sinüs duvarı değildir. LM ostiyumu sinüs duvarında yer alır.'
    },
    en: {
      title: 'Left coronary leaflet • LCC',
      description: 'The left coronary cusp of the aortic valve; the left coronary sinus is the adjacent aortic root dilation.',
      clinical: 'The source mesh is the valve cusp, not the sinus wall or coronary ostium.'
    },
    source: 'Joshi et al., 2010, PMC2815286'
  },
  rcc: {
    tr: {
      title: 'Sağ koroner yaprakçık • RCC',
      description: 'Aort kapağının sağ koroner yaprakçığıdır. RCA komşu sağ koroner sinüs duvarından doğar.',
      clinical: 'Yaprakçık ile sinüs aynı yapı değildir. Kaynak parça yaprakçık geometrisidir.'
    },
    en: {
      title: 'Right coronary leaflet • RCC',
      description: 'The right coronary cusp of the aortic valve. The RCA ostium arises from the adjacent right sinus wall.',
      clinical: 'The source part represents the valve leaflet, distinct from the aortic wall.'
    },
    source: 'Nasr & El Tahlawi, 2018, PMC6172585'
  },
  ncc: {
    tr: {
      title: 'Nonkoroner yaprakçık • NCC',
      description: 'Aort kapağının nonkoroner yaprakçığıdır. Komşu sinüsten olağan anatomide koroner arter çıkmaz.',
      clinical: 'İnteratrial septum ve membranöz septum ile yakın komşuluktadır.'
    },
    en: {
      title: 'Non-coronary leaflet • NCC',
      description: 'The non-coronary cusp of the aortic valve. In typical anatomy, no coronary artery arises from its sinus.',
      clinical: 'Closely related to the membranous septum and interatrial septum.'
    },
    source: 'Joshi et al., 2010, PMC2815286'
  },
  gcv: {
    tr: {
      title: 'Büyük kardiyak ven • GCV (Anterior & Sol AV dalı)',
      description: 'Apeks ve anterior interventriküler olukta LAD komşuluğunda başlar; sol AV oluğa (LCx komşuluğuna) kıvrılarak Vieussens kapağı seviyesinde koroner sinüse devam eder.',
      clinical: 'Sol anterior ve lateral ventrikül duvarının venöz drenajını sağlar. CRT lead implantasyonunda anterolateral/lateral venöz hedef sunar.'
    },
    en: {
      title: 'Great cardiac vein • GCV (Anterior & circumflex branch)',
      description: 'Originates at the cardiac apex in the anterior interventricular groove alongside the LAD, then curves into the left AV groove to continue as the coronary sinus at the valve of Vieussens.',
      clinical: 'Drains the anterior and lateral LV myocardium; provides critical anterolateral venous access for CRT pacing leads.'
    },
    source: 'Ho et al., 2012, PDF p. 3'
  },
  mcv: {
    tr: {
      title: 'Orta kardiyak ven • MCV (Posterior interventriküler dal)',
      description: 'Apeksten başlayarak inferior (posterior) interventriküler olukta PDA ile birlikte bazale doğru uzanır ve koroner sinüs ostiyumu yakınına dökülür.',
      clinical: 'İnferior sol ventrikül duvarı ve posterior interventriküler septumun venöz drenajını sağlar; posteroseptal elektrofizyolojik ablasyonda anatomik kılavuzdur.'
    },
    en: {
      title: 'Middle cardiac vein • MCV (Posterior interventricular branch)',
      description: 'Ascends in the posterior interventricular sulcus alongside the posterior descending artery to drain into the terminal coronary sinus near its ostium.',
      clinical: 'Drains the diaphragmatic LV wall and posterior septum; serves as an anatomical landmark in posteroseptal arrhythmia ablation.'
    },
    source: 'Coronary sinus and cardiac venous anatomy, PDF pp. 4–5'
  },
  piv: {
    tr: {
      title: 'Sol ventrikül posterior veni • PVLV / PIV',
      description: 'Sol ventrikülün serbest diyafragmatik/inferolateral duvarı üzerinden yükselerek koroner sinüse dökülen geniş venöz daldır (Vena posterior ventriculi sinistri).',
      clinical: 'Kardiyak resenkronizasyon tedavisinde (CRT) sol ventrikül epikardiyal pacing lead’i için en sık tercih edilen primer venöz kanaldır.'
    },
    en: {
      title: 'Posterior vein of left ventricle • PVLV / PIV',
      description: 'Ascends across the inferolateral/posterior wall of the left ventricle to drain directly into the coronary sinus.',
      clinical: 'Primary anatomical conduit frequently targeted for left ventricular lead placement in cardiac resynchronization therapy (CRT).'
    },
    source: 'Coronary sinus and cardiac venous anatomy, PDF pp. 3–5; Ho et al., 2012'
  },
  'cardiac-veins': {
    tr: {
      title: 'Kardiyak venler ağı (Koroner venöz sistem)',
      description: 'Kalbin venöz drenaj ağı; koroner sinüs ana gövdesi (CS), büyük kardiyak ven (GCV), orta kardiyak ven (MCV) ve ventriküler posterior venlerden (PVLV) oluşur.',
      clinical: 'Venöz dalların sayısı, çapı ve dallanma açıları kişiden kişiye yüksek varyasyon gösterir; CRT öncesi venografi ile haritalanır.'
    },
    en: {
      title: 'Cardiac venous system (Coronary venous network)',
      description: 'The cardiac venous network comprising the coronary sinus trunk (CS), great cardiac vein (GCV), middle cardiac vein (MCV), and posterior ventricular tributaries (PVLV).',
      clinical: 'Branch topology, caliber, and take-off angles show high individual variation; evaluated pre-procedurally by occlusive venography.'
    },
    source: 'Coronary sinus and cardiac venous anatomy, PDF pp. 3–5'
  },
  pv: {
    tr: {
      title: 'Pulmoner venler (4 ana pulmoner ven ostiyumu)',
      description: 'Akciğerlerden oksijenlenmiş kanı sol atriyumun posterior duvarına ileten dört ana vendir: LSPV, LIPV, RSPV, RIPV.',
      clinical: 'Ven ostiyumları etrafındaki miyokardiyal kılıflar atriyal fibrilasyon tetikleyicilerinin ana kaynağıdır; geniş antral izolasyon (PVI/WACA) uygulanır.'
    },
    en: {
      title: 'Pulmonary veins (Four pulmonary vein ostia)',
      description: 'Four pulmonary veins (LSPV, LIPV, RSPV, RIPV) delivering oxygenated blood from the pulmonary capillary beds to the posterior left atrium.',
      clinical: 'Myocardial sleeves extending onto the veno-atrial junctions are the primary source of ectopic triggers for atrial fibrillation.'
    },
    source: 'Ho et al., 2012, PDF pp. 2–3'
  },
  lspv: {
    tr: {
      title: 'Sol süperior pulmoner ven • LSPV',
      description: 'Sol akciğerin üst lobundan oksijenlenmiş kanı sol atriyumun posterosüperior duvarına iletir. Ağzının hemen önünde sol lateral sırt (Coumadin sırtı) ve sol atriyal apendiks ağzı bulunur.',
      clinical: 'Atriyal fibrilasyon (AF) kateter ablasyonunda aritmojenik tetikleyici odakların en sık izlendiği ostiyumdur; geniş antral dairesel ablasyon (WACA) ile izole edilir.'
    },
    en: {
      title: 'Left superior pulmonary vein • LSPV',
      description: 'Drains oxygenated blood from the left upper lung lobe into the posterosuperior left atrium. The left lateral ridge (Coumadin ridge) and the appendage orifice lie just anterior to its ostium.',
      clinical: 'Most common site of arrhythmogenic triggers in atrial fibrillation; targeted by wide antral circumferential ablation (WACA).'
    },
    source: 'Ho et al., 2012, PDF pp. 2–3'
  },
  lipv: {
    tr: {
      title: 'Sol inferior pulmoner ven • LIPV',
      description: 'Sol akciğerin alt lobundan gelen venöz kanı sol atriyumun arka-alt duvarına boşaltır.',
      clinical: 'Arkasında özofagus ve inen torasik aort bulunur; izolasyonda özofagus ısı takibi ve enerji titrasyonu gerekir.'
    },
    en: {
      title: 'Left inferior pulmonary vein • LIPV',
      description: 'Drains the left lower lung lobe into the posteroinferior aspect of the left atrium.',
      clinical: 'The esophagus and the descending thoracic aorta lie behind it; esophageal temperature monitoring and energy titration are needed during isolation.'
    },
    source: 'Ho et al., 2012, PDF pp. 2–3'
  },
  rspv: {
    tr: {
      title: 'Sağ süperior pulmoner ven • RSPV',
      description: 'Sağ akciğer üst ve orta lobundan gelen kanı sol atriyum arka çatısının sağ sınırına iletir.',
      clinical: 'Süperior vena kava ve sağ frenik sinir ile çok yakın anterior komşuluk gösterir. Balon kriyoablasyon sırasında sağ frenik sinir hasarını önlemek için sürekli diyafram uyarımı (pacing) ile monitörizasyon zorunludur.'
    },
    en: {
      title: 'Right superior pulmonary vein • RSPV',
      description: 'Drains the right upper and middle lobes into the right-superior aspect of the posterior left atrium.',
      clinical: 'Intimately related anteriorly to the superior vena cava and right phrenic nerve; diaphragmatic pacing is mandatory during cryoballoon ablation to avoid phrenic palsy.'
    },
    source: 'Ho et al., 2012, PDF pp. 2–3; ACC/HRS guidelines'
  },
  ripv: {
    tr: {
      title: 'Sağ inferior pulmoner ven • RIPV',
      description: 'Sağ akciğer alt lobundan sol atriyumun tabanına dökülen en inferomedial pulmoner vendir.',
      clinical: 'Fossa ovalis ve interatriyal septumun hemen posteriorunda seyreder; transseptal ponksiyon iğnesinin posteriora fazla yönelmesi durumunda potansiyel yaralanma riski taşır.'
    },
    en: {
      title: 'Right inferior pulmonary vein • RIPV',
      description: 'Enters the most inferior and medial aspect of the posterior left atrial wall from the right lower lung lobe.',
      clinical: 'Located directly posterior to the fossa ovalis and interatrial septum; caution is required during transseptal puncture to avoid posterior wall trajectory.'
    },
    source: 'Ho et al., 2012, PDF pp. 2–3'
  },
  septal: {
    tr: {
      title: 'Septal koroner dallar',
      description: 'LAD\'den dik açıyla ayrılarak interventriküler septumu perfore eden arteriyel dallardır.',
      clinical: 'İnterventriküler septumun anterior üçte ikisini ve iletim sisteminin bir bölümünü besler.'
    },
    en: {
      title: 'Septal perforating branches',
      description: 'Branches arising at right angles from the LAD penetrating the interventricular septum.',
      clinical: 'Supply the anterior two-thirds of the ventricular septum and proximal conduction bundles.'
    },
    source: 'ACC/AHA coronary definitions, 2014'
  },
  rpl: {
    tr: {
      title: 'Sağ posterolateral dal • RPL',
      description: 'Sağ koroner sistemin crux cordis sonrasında sol ventrikül diyafram yüzeyine verdiği daldır.',
      clinical: 'Sağ koroner dominansı gösteren anatomi durumlarında inferior LV duvarını besler.'
    },
    en: {
      title: 'Right posterolateral branch • RPL',
      description: 'Distal branch of the dominant RCA continuing past the crux over the posterior left ventricular surface.',
      clinical: 'Supplies the diaphragmatic surface of the left ventricle in right-dominant coronary systems.'
    },
    source: 'ACC/AHA coronary definitions, 2014'
  },
  'rv-papillary': {
    tr: {
      title: 'RV papiller kasları',
      description: 'Triküspit kapak yaprakçıklarına korda tendinea ile bağlanan sağ ventrikül kas yapılarıdır (anterior, posterior, septal).',
      clinical: 'Anterior papiller kas moderator band ile ilişkilidir; ventrikül geometrisi ve kapak koaptasyonunda rol oynar.'
    },
    en: {
      title: 'RV papillary muscles',
      description: 'Muscular projections within the right ventricle supporting the tricuspid valve leaflets via chordae tendineae.',
      clinical: 'The anterior papillary muscle receives the moderator band carrying the right bundle branch.'
    },
    source: 'Anatomy for right ventricular lead implantation, PDF p. 2'
  },
  'lv-papillary': {
    tr: {
      title: 'LV papiller kasları',
      description: 'Mitral kapağı destekleyen anterolateral ve posteromedial sol ventrikül papiller kaslarıdır.',
      clinical: 'Ventriküler kontraksiyon sırasında mitral yaprakçıkların sol atriyuma prolabe olmasını engeller.'
    },
    en: {
      title: 'LV papillary muscles',
      description: 'Anterolateral and posteromedial muscular pillars inside the left ventricle supporting the mitral valve.',
      clinical: 'Prevent systolic prolapse of mitral leaflets into the left atrium during ventricular ejection.'
    },
    source: `${atlas}, PDF pp. 38–39`
  },
  'pulmonary-valve': {
    tr: {
      title: 'Pulmoner kapak • RV çıkışı',
      description: 'Sağ ventrikül çıkış yolu ile pulmoner trunkus arasındaki üç semilunar yaprakçıklı kapaktır.',
      clinical: 'Aort kapağının anteriorunda ve süperiorunda yer alır; aralarında musküler infundibulum bulunur.'
    },
    en: {
      title: 'Pulmonary valve • RV outlet',
      description: 'A trileaflet semilunar valve separating the right ventricular outflow tract from the pulmonary trunk.',
      clinical: 'Located anterior and superior to the aortic valve, separated by a complete muscular infundibulum.'
    },
    source: 'Anatomy for right ventricular lead implantation, PDF p. 2'
  },
  micro: {
    tr: {
      title: 'Miyokard • Kavramsal mikroyapı',
      description: 'Çalışan kardiyomiyositler ve özelleşmiş ileti hücreleri birbiriyle bağlantılı doku mimarisini oluşturur.',
      clinical: 'Bu şema bir doku kesiti veya histoloji örneği değildir; kavramsal hücresel organizasyonu göstermek amacıyla tasarlanmıştır.'
    },
    en: {
      title: 'Myocardium • Conceptual micro view',
      description: 'Working cardiac myocytes and specialized conduction myocytes form distinct, connected tissue systems.',
      clinical: 'This enlarged diagram is not histology or a measured fiber field. Designed as an educational conceptual visualization.'
    },
    source: 'Ho et al., 2003, PDF pp. 4–5; Ho et al., 2012, PDF p. 6'
  }
};

export const structures = new Proxy({}, {
  get(target, prop) {
    const raw = rawStructures[prop];
    if (!raw) return undefined;
    const loc = raw[currentLang] || raw.tr || raw.en || {};
    return {
      title: loc.title || raw.title || '',
      description: loc.description || raw.description || '',
      clinical: loc.clinical || raw.clinical || '',
      source: raw.source || '',
      modelType: raw.modelType
    };
  },
  has(target, prop) {
    return prop in rawStructures;
  },
  ownKeys() {
    return Reflect.ownKeys(rawStructures);
  },
  getOwnPropertyDescriptor(target, prop) {
    if (prop in rawStructures) {
      return { configurable: true, enumerable: true, value: this.get(target, prop) };
    }
    return undefined;
  }
});

export const rawLessons = {
  cath: {
    tr: {
      title: 'Kardiyak kateterizasyon • Basınç ve oksimetri',
      intro: 'Sağ kalp (Swan-Ganz) ve sol kalp kateterizasyonunda her istasyonun normal basınç eğrisi, değer aralığı ve oksijen satürasyonu; eğriler EKG ve Wiggers saatiyle senkron. İlerleme çubuğu kateteri ilerletir; istasyon noktalarına tıklayın.',
      steps: [
        { title: 'Sağ atriyum (RA)', text: 'Femoral ven → İVC → RA. Normal ortalama < 5 mmHg, O₂ %75. a dalgası atriyal sistol (P\'den sonra), c dalgası triküspit kapanışında kapağın RA\'ya bombelenmesi, v dalgası sistolde venöz doluş; x ve y inişleri. Yüksek RA: sağ kalp yetersizliği, triküspit yetersizliği (büyük v), tamponad/konstriksiyon (belirgin y).', landmark: 'ra', view: 'anterior' },
        { title: 'Sağ ventrikül (RV)', text: 'Kateter triküspitten RV\'ye geçer. Normal sistolik < 25, diyastolik < 5 mmHg, O₂ %75. Diyastolik basınç düşük başlar, atriyal sistolle yükselir (RVEDP). Ventriküler ektopi kateter temasına bağlı sık görülür.', landmark: 'rv', view: 'rao' },
        { title: 'Pulmoner arter + wedge (PCWP)', text: 'RV çıkış yolu ve pulmoner kapaktan PA\'ya. Normal sistolik < 25, diyastolik < 10, ortalama < 15 mmHg; diyastolde dikrotik çentik görülür. Balon distal dalda şişirilince wedge (PCWP) ölçülür: ortalama < 12 mmHg, LA basıncını gecikmeli ve sönümlü yansıtır (a ve v dalgaları). O₂: PA %75, wedge %97.', landmark: 'pa', view: 'anterior' },
        { title: 'Sol kalp (retrograd) • LV ve aort', text: 'Femoral arter → aort → aort kapağı → LV. Normal LV sistolik < 120, diyastolik (LVEDP) < 8-12 mmHg; aort sistolik < 120, diyastolik < 80 mmHg, O₂ %95. Geri çekme (pull-back) sırasında LV-aort sistolik farkı aort darlığı gradyanını verir.', landmark: 'lv', view: 'lao' },
        { title: 'Oksimetri özeti ve şant taraması', text: 'Sağ kalp satürasyonları %75 civarında, sol kalp %95-97. Sağ tarafta istasyonlar arasında ≥ %7 (atriyal seviyede) veya ≥ %5 (ventriküler/PA) satürasyon artışı soldan sağa şantı düşündürür (ASD, VSD, PDA). Qp/Qs = (SaO₂ − SvO₂) / (SpvO₂ − SpaO₂).', landmark: 'la', view: 'anterior' }
      ]
    },
    en: {
      title: 'Cardiac catheterization • Pressures and oximetry',
      intro: 'Normal pressure tracing, value range and oxygen saturation at each right-heart (Swan-Ganz) and left-heart station, synchronized with the ECG and Wiggers clock. The progress slider advances the catheter; click the station markers.',
      steps: [
        { title: 'Right atrium (RA)', text: 'Femoral vein → IVC → RA. Normal mean < 5 mmHg, O₂ 75%. a wave = atrial systole (after P), c wave = tricuspid closure bulging into the RA, v wave = systolic venous filling; x and y descents. Raised RA: right heart failure, tricuspid regurgitation (large v), tamponade/constriction (prominent y).', landmark: 'ra', view: 'anterior' },
        { title: 'Right ventricle (RV)', text: 'The catheter crosses the tricuspid valve. Normal systolic < 25, diastolic < 5 mmHg, O₂ 75%. Diastolic pressure starts low and rises with atrial systole (RVEDP). Catheter-induced ventricular ectopy is common.', landmark: 'rv', view: 'rao' },
        { title: 'Pulmonary artery + wedge (PCWP)', text: 'Through the RV outflow tract and pulmonary valve into the PA. Normal systolic < 25, diastolic < 10, mean < 15 mmHg, with a diastolic dicrotic notch. Inflating the balloon in a distal branch gives the wedge (PCWP): mean < 12 mmHg, a damped, delayed reflection of LA pressure (a and v waves). O₂: PA 75%, wedge 97%.', landmark: 'pa', view: 'anterior' },
        { title: 'Left heart (retrograde) • LV and aorta', text: 'Femoral artery → aorta → aortic valve → LV. Normal LV systolic < 120, diastolic (LVEDP) < 8-12 mmHg; aortic systolic < 120, diastolic < 80 mmHg, O₂ 95%. On pull-back, the LV-aortic systolic difference gives the aortic stenosis gradient.', landmark: 'lv', view: 'lao' },
        { title: 'Oximetry summary and shunt run', text: 'Right-heart saturations run near 75%, left-heart 95-97%. A step-up of ≥ 7% (atrial level) or ≥ 5% (ventricular/PA) between right-sided stations suggests a left-to-right shunt (ASD, VSD, PDA). Qp/Qs = (SaO₂ − SvO₂) / (SpvO₂ − SpaO₂).', landmark: 'la', view: 'anterior' }
      ]
    }
  },
  angiography: {
    tr: {
      title: 'Floroskopik koroner anatomi',
      intro: 'Klinik floroskopi ve anjiyografi projeksiyonları altında koroner arterlerin uzaysal oryantasyonu ve dallanma modelleri.',
      steps: [
        {
          title: 'Aort Kökü ve Sol Ana Koroner (LM)',
          text: 'Sol koroner ostiyum, Valsalva sol sinüsünün üst 1/3 duvarından köken alır (yaprakçık üzerinde değildir). LAO Cranial projeksiyonda aort kökü ve LM gövdesi kranial açılanmayla netleşir.',
          landmark: 'lm',
          view: 'lao_cranial'
        },
        {
          title: 'LM Bifurkasyonu ("Spider" Görünümü)',
          text: 'LAO 45° · CAU 30° ("Spider" veya örümcek projeksiyonu), sol ana koroner bifurkasyonunu, LAD (ön inen) ve LCx (sirkumfleks) ostiyumlarını üst üste binmeden (foreshortening olmadan) açığa çıkarır.',
          landmark: 'lad',
          view: 'spider'
        },
        {
          title: 'LAD ve Septal Perforatörler (RAO Cranial)',
          text: 'RAO 30° · CRA 30° görünümü, LAD gövdesini ve interventriküler septuma dik inen septal perforatör dalları uzatarak anterior miyokardiyumun perfüzyon yatağını sergiler.',
          landmark: 'lad',
          view: 'rao_cranial'
        },
        {
          title: 'Sağ Koroner Arter (RCA) ve Crux (LAO)',
          text: 'LAO 45° görünümünde RCA sağ atriyoventriküler olukta tipik "C" kavisini çizer; distalinde PDA (posterior inen dal) ve posterolateral (RPL) dallarına ayrılarak crux cordis bölgesine ulaşır.',
          landmark: 'rca',
          view: 'lao'
        }
      ]
    },
    en: {
      title: 'Fluoroscopic coronary anatomy',
      intro: 'Spatial orientation and arborization of the coronary tree under standard clinical fluoroscopic projections.',
      steps: [
        {
          title: 'Aortic root & Left Main (LM)',
          text: 'The left coronary ostium arises from the upper third of the left aortic sinus wall. The LAO Cranial view elongates the aortic root and the left main coronary trunk.',
          landmark: 'lm',
          view: 'lao_cranial'
        },
        {
          title: 'LM bifurcation ("Spider" view)',
          text: 'LAO 45° · CAU 30° (the "Spider" projection) displays the LM bifurcation into the LAD and LCx without foreshortening, critical for bifurcation stenting and ostial evaluation.',
          landmark: 'lad',
          view: 'spider'
        },
        {
          title: 'LAD & septal perforators (RAO Cranial)',
          text: 'RAO 30° · CRA 30° projects the anterior interventricular groove along its long axis, clearly displaying diagonal branches and septal perforators supplying the bundle branches.',
          landmark: 'lad',
          view: 'rao_cranial'
        },
        {
          title: 'Right Coronary (RCA) & Crux (LAO)',
          text: 'LAO 45° reveals the classic "C-curve" of the RCA coursing down the right AV groove to the crux cordis, dividing into posterior descending (PDA) and posterolateral (RPL) branches.',
          landmark: 'rca',
          view: 'lao'
        }
      ]
    }
  },
  ablation: {
    tr: {
      title: 'Elektrofizyoloji (EP) • Ablasyon hedefleri',
      intro: 'Aritmi substratlarının anatomik temeli: Kavotriküspit istmus, Koch üçgeni ve pulmoner ven antrum izolasyonu.',
      steps: [
        {
          title: 'Kavotriküspit İstmus (CTI) • Atriyal Flatter',
          text: 'Kavotriküspit istmus (CTI), triküspit anulusunun inferior kenarı ile İVC ağzı arasındaki sağ atriyum tabanıdır; tipik saat yönü tersi atriyal flatter devresinin zorunlu geçididir. Standart lezyon hattı LAO projeksiyonunda saat 6 hizasında (santral istmus), CS ostiyumunun lateralinden anulustan İVC\'ye çekilir; hedef çift yönlü istmus blokudur. Mavi halka ölçülen İVC ağzını gösterir (atlasta İVC mesh\'i yoktur).',
          landmark: 'ivc',
          view: 'lao'
        },
        {
          title: 'Koch Üçgeni ve Yavaş Yol • AVNRT',
          text: 'Koch üçgeni sağ atriyumun alt septal bölgesindedir. Taban: koroner sinüs (CS) ostiyumu (yeşil). Posterosüperior kenar: Eustachian sırtının devamı olan Todaro tendonu (beyaz). Anterior kenar: triküspit septal yaprakçığının menteşesi (turkuaz). Apeks: kompakt AV düğüm / His (kırmızı; ablasyon kalıcı AV blok yapar). Hızlı yol Todaro\'ya komşu, apeksin hemen altındadır (turuncu, kaçınılacak bölge). Yavaş yol CS ostiyumu ile septal yaprakçık arasında, tabana yakındır (yeşil, AVNRT ablasyon hedefi). Floroskopide RAO projeksiyonu üçgeni en iyi gösterir: taban proksimal CS elektrotlarından çizilen yatay hat, apeks His kateteri, anterior kenar His\'ten tabana inen dikey hat (TV septal yaprakçığı).',
          landmark: 'av',
          view: 'rao'
        },
        {
          title: 'Pulmoner Ven İzolasyonu (WACA / PVI) • AF',
          text: 'AF tetikleyicilerinin çoğu pulmoner ven miyokard kılıflarından kaynaklanır. WACA\'da aynı taraftaki ven çiftleri (LSPV+LIPV, RSPV+RIPV) ostiyumların birkaç mm dışında, antrumdan geniş çevresel halkayla izole edilir; hedef giriş ve çıkış blokudur. Posterior duvarda özofagus (termal hasar, atriyo-özofageal fistül), sağ venlerde sağ frenik sinir (kryobalonda frenik pacing ile izlenir) risklidir.',
          landmark: 'la',
          view: 'posterior'
        },
        {
          title: 'Kombine EP Haritası & Lineer Hatlar',
          text: 'Tüm hedefler bir arada. Çatı hattı iki süperior veni LA tavanında birleştirir (çatıya bağlı flatter). Mitral istmus hattı LIPV\'den lateral mitral anulusa uzanır (perimitral flatter); blok için çoğu zaman koroner sinüs içinden de uygulama gerekir, sirkumfleks arter yakındır. Sağda CTI hattı ve Koch üçgeni. Doğal iletim bariyerleri (crista terminalis, fossa ovalis, venöz ostiyumlar) makro-reentry devrelerini yönlendirir.',
          landmark: 'la',
          view: 'posterior'
        }
      ]
    },
    en: {
      title: 'Electrophysiology (EP) • Ablation targets',
      intro: 'Anatomical basis of arrhythmia substrates: Cavotricuspid isthmus, Triangle of Koch, and pulmonary vein antral isolation.',
      steps: [
        {
          title: 'Cavotricuspid Isthmus (CTI) • Atrial Flutter',
          text: 'The cavotricuspid isthmus (CTI) is the right atrial floor between the inferior tricuspid annulus and the IVC orifice, the obligatory corridor of typical counterclockwise flutter. The standard lesion line runs at 6 o\'clock in LAO (central isthmus), lateral to the CS ostium, from the annulus to the IVC; the goal is bidirectional isthmus block. The blue ring marks the measured IVC orifice (the atlas has no IVC mesh).',
          landmark: 'ivc',
          view: 'lao'
        },
        {
          title: 'Triangle of Koch & Slow Pathway • AVNRT',
          text: 'The triangle of Koch lies in the lower septal right atrium. Base: the coronary sinus (CS) ostium (green). Posterosuperior side: the tendon of Todaro, continuing the Eustachian ridge (white). Anterior side: the hinge of the septal tricuspid leaflet (cyan). Apex: the compact AV node / His (red; ablation causes permanent AV block). The fast pathway runs next to Todaro just below the apex (orange, zone to avoid). The slow pathway lies between the CS ostium and the septal leaflet near the base (green, the AVNRT ablation target). On fluoroscopy the RAO view shows the triangle best: base = a horizontal line through the proximal CS electrodes, apex = the His catheter, anterior side = the vertical drop from His to the base (septal tricuspid leaflet).',
          landmark: 'av',
          view: 'rao'
        },
        {
          title: 'Wide Area Circumferential Ablation (WACA) • AF',
          text: 'Most AF triggers arise in the pulmonary vein myocardial sleeves. WACA isolates each ipsilateral pair (LSPV+LIPV, RSPV+RIPV) with a wide antral ring a few mm outside the ostia; the goal is entrance and exit block. Watch the esophagus behind the posterior wall (thermal injury, atrio-esophageal fistula) and the right phrenic nerve near the right veins (monitored with phrenic pacing during cryoballoon).',
          landmark: 'la',
          view: 'posterior'
        },
        {
          title: 'Comprehensive EP Substrate & Linear Sets',
          text: 'All targets together. The roof line joins the two superior veins across the LA roof (roof-dependent flutter). The mitral isthmus line runs from the LIPV to the lateral mitral annulus (perimitral flutter); block often needs lesions from inside the coronary sinus, and the circumflex artery lies close. On the right: the CTI line and Koch\'s triangle. Natural barriers (crista terminalis, oval fossa, venous orifices) channel macro-reentrant circuits.',
          landmark: 'la',
          view: 'posterior'
        }
      ]
    }
  },
  pacemaker: {
    tr: {
      title: 'Kardiyak implante edilebilir elektronik cihazlar (CIED)',
      intro: 'Transvenöz pacing leadleri ve fizyolojik ileti sistemi uyarımı (CSP/LBBAP ve CRT). İlerleme çubuğunu kaydırarak lead ilerletilmesini gözlemleyin.',
      steps: [
        {
          title: 'Sağ Atriyal (RA) Lead • Apendiks Fiksasyonu',
          text: 'Subklavyan/sefalik venöz girişten SVC yoluyla sağ atriyuma ulaşır. Aktif fiksasyonlu vida ucu (helix) pektinat kasların zengin olduğu sağ atriyal apendikse (RAA) veya lateral duvara tutturulur.',
          landmark: 'ra',
          view: 'anterior'
        },
        {
          title: 'Sağ Ventrikül (RV) Septal Lead',
          text: 'Triküspit kapağı geçerek sağ ventriküle ilerler. İnce apeks yerine uç interventriküler septumun orta bölümünün RV yüzüne aktif fiksasyonla tutturulur: perforasyon riski azalır ve pacing kaynaklı dissenkroni sınırlanır. LAO projeksiyonunda uç septuma (omurgaya doğru) bakmalıdır; RAO\'da apeks ile His arasında durur.',
          landmark: 'rv',
          view: 'lao'
        },
        {
          title: 'Fizyolojik İleti Sistemi Pacing (CSP / LBBAP)',
          text: 'Lead, His\'in yaklaşık 1-1,5 cm distalinde, RAO 30\'da His ile RV apeksi arasındaki hat üzerinde septumun RV yüzüne girer ve septumdan transseptal olarak vidalanır; uç LV subendokardında, sol dal (LBB) bölgesinde durur. Doğal ileti sistemini yakaladığı için dar QRS ve fizyolojik senkronizasyon sağlar. Yakalama işaretleri: V1\'de qR/Qr (sağ dal bloku paterni), kısa ve sabit stimulus-LV aktivasyon zamanı. Lead ucunun septumun içine gömüldüğüne dikkat edin.',
          landmark: 'his',
          view: 'rao'
        },
        {
          title: 'Sol Ventrikül CRT Lead • Koroner Sinüs',
          text: 'Koroner sinüs ostiyumundan girilir, sinüs gövdesinde sola ilerler ve sol ventrikülün posterior venine döner. Kuadripolar uç posterolateral serbest duvarda kalır. Büyük kardiyak venin anterior oluğa giden devamı bu hedef değildir.',
          landmark: 'cs',
          view: 'posterior'
        }
      ]
    },
    en: {
      title: 'Cardiac implantable electronic devices (CIED)',
      intro: 'Transvenous pacing leads and physiological conduction system pacing (CSP/LBBAP and CRT). Use the progress slider to trace lead advancement.',
      steps: [
        {
          title: 'Right Atrial (RA) Lead • Appendage Fixation',
          text: 'Introduced via subclavian/cephalic venous access down the SVC into the right atrium. The active-fixation helical screw tip anchors securely in the pectinate trabeculae of the right atrial appendage (RAA).',
          landmark: 'ra',
          view: 'anterior'
        },
        {
          title: 'Right Ventricular (RV) Septal Lead',
          text: 'Crosses the tricuspid valve into the RV. Instead of the thin apex, the tip is actively fixed to the RV side of the mid interventricular septum: lower perforation risk and less pacing-induced dyssynchrony. In LAO the tip should point toward the septum (the spine); in RAO it sits between the apex and the His.',
          landmark: 'rv',
          view: 'lao'
        },
        {
          title: 'Conduction System Pacing (CSP / LBBAP)',
          text: 'The lead enters the RV side of the septum about 1-1.5 cm distal to the His, on the His-to-RV-apex line in RAO 30, and is screwed transseptally until the tip rests in the LV subendocardium at the left bundle branch (LBB) area. Recruiting the native conduction system gives a narrow QRS and physiological synchrony. Capture markers: qR/Qr in V1 (RBBB pattern) and a short, stable stimulus-to-LV activation time. Note the lead tip buried inside the septum.',
          landmark: 'his',
          view: 'rao'
        },
        {
          title: 'Left Ventricular CRT Lead • Coronary Sinus',
          text: 'The CRT lead enters the coronary sinus ostium, runs along the sinus, and turns into the posterior vein of the left ventricle. The quadripolar tip rests on the posterolateral free wall. It does not follow the great cardiac vein into the anterior interventricular groove.',
          landmark: 'cs',
          view: 'posterior'
        }
      ]
    }
  },
  bachmann: {
    tr: {
      title: 'Bachmann demeti anatomisi ve bölge pacing',
      intro: 'Atriyumlar arası kas bandını ve sağ atriyumdan endokardiyal bölge pacing yaklaşımını karşılaştırın. Geometri şematiktir; floroskopik yerleşim elektriksel yakalanmayı kanıtlamaz.',
      steps: [
        {
          title: 'Anatomi • Ön-üst atriyal kas bandı',
          text: 'Bachmann demeti sağ atriyumdan sol atriyum çatısına uzanan geniş subepikardiyal miyokard bandıdır. Renkli bant anatomik ilişkiyi gösterir; gerçek floroskopide ayrı bir yapı olarak görülmez. Bu adımda pacing lead’i gösterilmez.',
          landmark: 'bachmann',
          view: 'bachmann_roof'
        },
        {
          title: 'Karşılaştırma • RAA lead’i, LAO 40°',
          text: 'Sağ atriyal apendiks (RAA) lead’i anterior yerleşimi temsil eder. Referans LAO 40° görünümünde uç sternum yönüne, görüntünün soluna bakar. Bunu sonraki adımlardaki üst septal bölge lead’i ile karşılaştırın; kişiye özgü anatomi projeksiyonu değiştirir.',
          landmark: 'ra',
          view: 'lao40'
        },
        {
          title: 'Bachmann bölgesi • AP projeksiyonu',
          text: 'Lead SVC üzerinden sağ atriyuma ulaşır ve üst anteroseptal bölgenin endokardiyal yüzeyinde sonlanır. AP görünümünde distal yönelim RAA örneğine göre daha medialdir. Bu model epikardiyal bandın içine vida ilerlemesini veya doğrudan demet yakalanmasını simüle etmez.',
          landmark: 'bachmann',
          view: 'ap'
        },
        {
          title: 'Bachmann bölgesi • LAO 40° ve elektriksel değerlendirme',
          text: 'Referans LAO 40° görünümünde üst septal bölge lead’i RAA lead’ine göre daha posteriora, omurga yönüne bakar. Projeksiyon tek başına demet yakalanmasını kanıtlamaz. P dalgası morfolojisi ve süresi ile intrakardiyak elektrogramlar birlikte değerlendirilmelidir; model elektriksel yakalanma ölçümü yapmaz.',
          landmark: 'bachmann',
          view: 'lao40'
        }
      ]
    },
    en: {
      title: 'Bachmann bundle anatomy and area pacing',
      intro: 'Compare the interatrial muscular band with right atrial endocardial area pacing. Geometry is schematic; fluoroscopic placement does not establish electrical capture.',
      steps: [
        {
          title: 'Anatomy • Anterior-superior atrial band',
          text: 'Bachmann bundle is a broad subepicardial myocardial band extending from the right atrium to the left atrial roof. The colored band shows anatomical relationships; it is not separately visible on clinical fluoroscopy. No pacing lead is shown in this step.',
          landmark: 'bachmann',
          view: 'bachmann_roof'
        },
        {
          title: 'Comparison • RAA lead, LAO 40°',
          text: 'The right atrial appendage (RAA) lead represents an anterior position. In the reference LAO 40° projection, its tip points toward the sternum, on the left of the image. Compare this with the high septal region lead in the following steps; individual anatomy affects the projection.',
          landmark: 'ra',
          view: 'lao40'
        },
        {
          title: 'Bachmann bundle area • AP projection',
          text: 'The lead reaches the right atrium through the SVC and terminates on the endocardial surface of the high anteroseptal region. In AP, its distal orientation is more medial than the RAA example. This model does not simulate screw advancement into the epicardial band or direct bundle capture.',
          landmark: 'bachmann',
          view: 'ap'
        },
        {
          title: 'Bachmann bundle area • LAO 40° and electrical assessment',
          text: 'In the reference LAO 40° projection, the high septal region lead points more posteriorly, toward the spine, than the RAA lead. Projection alone does not prove bundle capture. P-wave morphology and duration must be assessed alongside intracardiac electrograms; this model does not measure electrical capture.',
          landmark: 'bachmann',
          view: 'lao40'
        }
      ]
    }
  },
  transseptal: {
    tr: {
      title: 'Transseptal ponksiyon & balon atriyal septostomi',
      intro: 'İnteratriyal septum (fossa ovalis) üzerinden perkütan sol atriyum erişimi: femoral venöz giriş, floroskopik konumlandırma açıları, septal geçiş ve balon septostomi. C-Arm panelinden LAO/RAO açılarını simüle edin; ilerleme çubuğu kateter/iğne ilerletmesini animasyonlar.',
      steps: [
        {
          title: 'Perkütan giriş • Femoral ven → İVC → RA',
          text: 'Giriş yeri: sağ femoral ven (perkütan Seldinger tekniği). Kılavuz tel ve kılıf İVC üzerinden sağ atriyuma, oradan SVC seviyesine ilerletilir. Floroskopi: AP 0° projeksiyonda tel omurga sağında İVC-RA hattını izler. İlerleme çubuğu ile rotayı takip edin.',
          landmark: 'ra',
          view: 'anterior'
        },
        {
          title: 'Fossa ovalis konumlandırma • Tenting (LAO 45°)',
          text: 'SVC hazırlık konumundan geri çekilen transseptal sistemin son konumu gösterilir: kılıf İVC ve sağ atriyumdan fossaya uzanır; SVC\'deki önceki konum aynı anda çizilmez. İğne ucu iki "atlama" (aorta, limbus) sonrası fossa ovalise oturur ve membranı çadırlaştırır (tenting). Floroskopik işaret kateterleri: aort köküne retrograd yerleştirilen mavi pigtail kateter nonkoroner cuspa (NCC) oturur ve aort kökünü işaretler; iğne her zaman pigtailin posteroinferiorunda kalmalıdır. Koyu mavi dekapolar CS kateteri koroner sinüs boyunca uzanır ve AV oluğu (septumun alt sınırını) gösterir. Cusp halkaları: yeşil = LCC, turuncu = RCC, camgöbeği = NCC (pigtail yuvası). Açılar: LAO 45° septumu en face gösterir; RAO 30° tanjansiyel değerlendirir. Kırmızı işaretler tehlike bölgeleri: aort kökü ve posterior LA duvarı.',
          landmark: 'la',
          view: 'lao'
        },
        {
          title: 'Septal geçiş • İğne + tel LA\'ya (RAO 30°)',
          text: 'Basınç eğrisi ve kontrast ile LA doğrulandıktan sonra iğne fossa ovalisi geçer; kılavuz tel sol üst pulmoner vene (LSPV) yönlendirilir. RAO 30° projeksiyonda iğnenin posterior duvara değil LA ortasına yöneldiği doğrulanır. Aksesuar: TEE/ICE eşliği güvenliği artırır.',
          landmark: 'la',
          view: 'rao'
        },
        {
          title: 'Balon atriyal septostomi (statik balon)',
          text: 'Yerleşik interatriyal defekti genişletmek için (ör. duktus bağımlı dolaşım, pulmoner hipertansiyonda dekompresyon) balon septum hizasında şişirilir; septumun oluşturduğu bel (waist) kaybolana dek dilatasyon yapılır. İlerleme çubuğu balon şişirmeyi simüle eder. Floroskopi: AP 0° veya hafif LAO ile balon beli izlenir.',
          landmark: 'ra',
          view: 'anterior'
        }
      ]
    },
    en: {
      title: 'Transseptal puncture & balloon atrial septostomy',
      intro: 'Percutaneous left atrial access across the interatrial septum (fossa ovalis): femoral venous entry, fluoroscopic positioning angles, septal crossing, and balloon septostomy. Simulate LAO/RAO gantry angles from the C-Arm panel; the progress slider animates catheter/needle advancement.',
      steps: [
        {
          title: 'Percutaneous access • Femoral vein → IVC → RA',
          text: 'Access site: right femoral vein (percutaneous Seldinger technique). The guidewire and sheath are advanced via the IVC into the right atrium and up to the SVC. Fluoroscopy: in AP 0° the wire tracks the IVC-RA line to the right of the spine. Use the progress slider to trace the route.',
          landmark: 'ra',
          view: 'anterior'
        },
        {
          title: 'Fossa ovalis positioning • Tenting (LAO 45°)',
          text: 'The final position after withdrawal from the SVC is shown: the sheath runs from the IVC through the right atrium to the fossa; its earlier SVC position is not drawn at the same time. The needle tip drops over two "jumps" (aortic mound, limbus) onto the fossa ovalis and tents the membrane. Fluoroscopic landmark catheters: a blue retrograde pigtail seats in the non-coronary cusp (NCC), marking the aortic root; the needle must always stay posteroinferior to the pigtail. The dark-blue decapolar CS catheter lines the coronary sinus, outlining the AV groove (inferior septal border). Cusp rings: green = LCC, orange = RCC, cyan = NCC (pigtail seat). Angles: LAO 45° shows the septum en face; RAO 30° profiles it tangentially. Red markers flag danger zones: the aortic root and the posterior LA wall.',
          landmark: 'la',
          view: 'lao'
        },
        {
          title: 'Septal crossing • Needle + wire into the LA (RAO 30°)',
          text: 'After LA confirmation by pressure waveform and contrast, the needle crosses the fossa ovalis and the guidewire is directed into the left superior pulmonary vein (LSPV). RAO 30° confirms the needle points into the LA body rather than the posterior wall. Adjunct TEE/ICE guidance improves safety.',
          landmark: 'la',
          view: 'rao'
        },
        {
          title: 'Balloon atrial septostomy (static balloon)',
          text: 'To enlarge an interatrial communication (e.g. duct-dependent circulations, decompression in pulmonary hypertension), the balloon is inflated across the septum and dilated until the septal waist resolves. The progress slider simulates balloon inflation. Fluoroscopy: watch the balloon waist in AP 0° or shallow LAO.',
          landmark: 'ra',
          view: 'anterior'
        }
      ]
    }
  },
  hemodynamics: {
    tr: {
      title: 'İnteraktif hemodinami • Basınç eğrileri ve hesaplamalar',
      intro: 'Sağ ve sol kalp basınç eğrileri aynı kalp döngüsü saatinde, EKG ve 3B kapak hareketiyle senkron çizilir. Senaryo seçin, kanalları üst üste bindirin, solunumu açın, ekstrasistol tetikleyin; gradyan, kapak alanı, direnç ve şant hesapları anlık güncellenir. Eğriler ders kitabı tipinde şematik şekillerdir, hasta kaydı değildir.',
      steps: [
        { title: 'Ölçüm tekniği ve normal değerler', text: 'Sıfırlama ve seviyeleme flebostatik eksende (orta göğüs) yapılır; değerler ekspiryum sonunda okunur. Sıvı dolu sistemde aşırı sönümleme dalgayı yuvarlar, yetersiz sönümleme ve kateter kırbacı sahte tepeler üretir. Normal: RA ort < 5, RV 25/5, PA 25/10 ort < 15, PCWP ort < 12, LV 120/8, aort 120/80 mmHg.', scenario: 'normal', channels: ['ra', 'ao'], beats: 2, respiration: true, landmark: 'cath-ra', view: 'anterior' },
        { title: 'Sağ atriyum dalgaları', text: 'a dalgası P dalgasını izleyen atriyal kasılmadır; c dalgası triküspit kapanışında kapağın RA\'ya bombelenmesi, x inişi atriyal gevşeme ve anulusun aşağı çekilmesi, v dalgası sistolde venöz doluş, y inişi triküspit açılmasıyla boşalmadır. Solunumu açın: inspiryumda tüm basınçlar birkaç mmHg düşer.', scenario: 'normal', channels: ['ra'], beats: 2, respiration: true, landmark: 'cath-ra', view: 'rao' },
        { title: 'Sağ ventrikül ve pulmoner arter', text: 'RV diyastolik basıncı erken diyastolde en düşüktür, yavaş yükselir ve atriyal kasılma ile RVEDP\'ye ulaşır (QRS başlangıcı). PA eğrisinde dikrotik çentik pulmoner kapak kapanışını gösterir; normalde PA diyastolik basıncı PCWP\'nin birkaç mmHg üstündedir.', scenario: 'normal', channels: ['rv', 'pa'], beats: 2, respiration: false, landmark: 'cath-pa', view: 'anterior' },
        { title: 'Kama basıncı (PCWP) ve sol atriyum', text: 'Balon distal PA dalını tıkayınca sol atriyum basıncı gecikmeli (kaynaklara göre 50–150 ms) ve sönümlenmiş olarak yansır: a ve v dalgaları, x ve y inişleri. Gerçek kama için dalga şekli, PA\'dan daha düşük ortalama ve arteriyel düzeyde satürasyon (> %95) birlikte aranır. Diyastolde LV ile PCWP çakışır; aradaki fark mitral gradyanıdır.', scenario: 'normal', channels: ['lv', 'pcwp'], beats: 2, respiration: false, landmark: 'cath-wedge', view: 'rao' },
        { title: 'Sol ventrikül ve aort', text: 'LV basıncı izovolümetrik kasılmada dik yükselir, aort kapağı açılınca iki eğri üst üste biner, S2\'de dikrotik çentikle ayrılır. Aort diyastolik basıncı bir sonraki açılışa dek iner. Geri çekmede LV sistolik ile aort sistolik farkı tepe-tepe gradyandır; periferde sistolik yükselir, ortalama korunur (amplifikasyon).', scenario: 'normal', channels: ['lv', 'ao'], beats: 2, respiration: false, landmark: 'cath-lv', view: 'lao' },
        { title: 'Debi, dirençler ve şant taraması', text: 'Fick: CO = VO₂ / (Hb × 1,36 × 10 × (SaO₂ − SvO₂)); VO₂ ölçülmezse 125 mL/dk/m² varsayılır. PVR = (mPAP − PCWP) / CO (Wood), SVR = (MAP − RA) / CO × 80 (dyn). Karışık venöz = (3 SVC + IVC) / 4; RA\'da ≥ %7, RV veya PA\'da ≥ %5 basamak artışı soldan sağa şantı gösterir. Bu ASD senaryosunda Qp/Qs yaklaşık 2\'dir; hesaplayıcıları açın.', scenario: 'asd_left_to_right', channels: ['ra', 'pa'], beats: 2, respiration: false, calculators: true, landmark: 'cath-ra', view: 'anterior' },
        { title: 'Aort darlığı', text: 'Ejeksiyon boyunca LV aortun üzerindedir; boyalı alan ortalama gradyandır. Aort eğrisi geç ve yavaş tepe yapar (parvus et tardus). Gorlin: alan = akım / (44,3 × √ortalama gradyan), akım = CO / (KH × SEP). PVC düğmesine basın: sabit darlıkta ekstrasistol sonrası atımda gradyan da aort nabız basıncı da artar.', scenario: 'aortic_stenosis_severe', channels: ['lv', 'ao'], beats: 3, respiration: false, landmark: 'cath-ao', view: 'lao' },
        { title: 'Hipertrofik obstrüktif kardiyomiyopati', text: 'Dinamik obstrüksiyonda aort eğrisi erken tepe (spike), sistol ortasında çöküş ve ikinci kubbe (dome) gösterir; gradyan ejeksiyonun ortasında ve sonunda oluşur. PVC düğmesine basın: ekstrasistol sonrası atımda gradyan artarken aort nabız basıncı düşer (Brockenbrough-Braunwald-Morrow işareti), sabit aort darlığının tersi.', scenario: 'hocm', channels: ['lv', 'ao'], beats: 3, respiration: false, landmark: 'cath-lv', view: 'lao' },
        { title: 'Mitral darlığı', text: 'Diyastol boyunca PCWP LV\'nin üstünde kalır; boyalı alan ortalama diyastolik gradyandır. Gorlin sabiti 37,7, akım penceresi diyastolik doluş süresidir (DFP); taşikardi ve atriyal fibrilasyon DFP\'yi kısaltıp gradyanı büyütür. Kama gecikmesi düzeltilmezse gradyan abartılır.', scenario: 'mitral_stenosis_severe', channels: ['lv', 'pcwp'], beats: 2, respiration: false, landmark: 'cath-wedge', view: 'rao' },
        { title: 'Mitral yetersizliği', text: 'Sistolde sol atriyuma kaçan kan kama eğrisinde dev v dalgası yapar; v dalgası ortalama PCWP\'nin iki katını aşarsa anlamlıdır. Kompliyan, kronik genişlemiş atriyumda v dalgası küçük kalabilir; akut yetersizlikte belirgindir. Aynı dev v dalgası akut LV yetersizliğinde de görülür.', scenario: 'mitral_regurgitation_severe', channels: ['lv', 'pcwp'], beats: 2, respiration: false, landmark: 'cath-wedge', view: 'rao' },
        { title: 'Aort yetersizliği', text: 'Kronik ciddi AY\'de nabız basıncı genişler, aort diyastolik basıncı düşer, LVEDP yükselir; diyastol sonunda LV ve aort basınçları birbirine yaklaşır. Akut ciddi AY\'de LVEDP aort diyastoliğine eşitlenir, mitral erken kapanır ve nabız basıncı beklendiği kadar geniş olmayabilir.', scenario: 'aortic_regurgitation_severe', channels: ['lv', 'ao'], beats: 2, respiration: false, landmark: 'cath-ao', view: 'lao' },
        { title: 'Konstriktif perikardit', text: 'Diyastolik basınçlar yüksek ve 5 mmHg içinde eşitlenmiştir; ventrikül eğrisinde erken dip ve plato (kare kök işareti), RA\'da belirgin y inişi. Solunumu açın: inspiryumda LV sistolik düşer, RV sistolik yükselir (ventriküler bağımlılık, uyumsuz değişim); RA basıncı düşmez, hatta artar (Kussmaul).', scenario: 'constrictive_pericarditis', channels: ['lv', 'rv'], beats: 4, respiration: true, landmark: 'cath-rv', view: 'anterior' },
        { title: 'Restriktif kardiyomiyopati', text: 'Dip-plato benzer görünür ama diyastolik basınçlar eşit değildir: LVEDP, RVEDP\'yi 5 mmHg\'den fazla aşar, PA sistolik sık sık 50 mmHg\'yi geçer. Solunumla LV ve RV sistolik basınçları aynı yönde değişir (uyumlu). Konstriksiyondan ayrımda bu iki bulgu esastır.', scenario: 'restrictive_cardiomyopathy', channels: ['lv', 'rv'], beats: 4, respiration: true, landmark: 'cath-lv', view: 'anterior' },
        { title: 'Kardiyak tamponad', text: 'Perikard basıncı diyastolik basınçları eşitler; RA\'da y inişi silinir (ventriküler doluş sınırlıdır), x inişi korunur. Debi düşük, kalp hızı yüksektir. Solunumu açın: inspiryumda aort sistolik basıncı 10 mmHg\'den fazla düşer (pulsus paradoksus). Perikardiyosentez sonrası y inişi geri döner.', scenario: 'tamponade', channels: ['ra', 'ao'], beats: 4, respiration: true, landmark: 'cath-ra', view: 'anterior' },
        { title: 'Pulmoner hipertansiyon', text: 'mPAP > 20 mmHg pulmoner hipertansiyondur (2022 ESC/ERS; eski kaynaklar ≥ 25 mmHg ve PVR > 3 WU kullanır); PCWP ≤ 15 ve PVR > 2 WU ise prekapiller, PCWP > 15 ise postkapiller. TPG = mPAP − PCWP, DPG = PA diyastolik − PCWP; DPG ≥ 7 ve PVR > 2 WU kombine pre- ve postkapiller hastalığı gösterir. Senaryoyu izole postkapiller PH ile karşılaştırın.', scenario: 'precapillary_ph', channels: ['pa', 'pcwp'], beats: 2, respiration: false, landmark: 'cath-pa', view: 'anterior' },
        { title: 'Sağ ventrikül infarktı ve akut sol kalp yetersizliği', text: 'RV infarktında RA basıncı yükselir, y inişi küner, RA/PCWP oranı 0,8\'i aşar ve Kussmaul görülebilir; PA ve PCWP görece düşüktür. Akut LV yetersizliği senaryosunda ise PCWP dev v dalgasıyla yüksek, debi düşük ve karışık venöz satürasyon azalmıştır.', scenario: 'rv_infarct', channels: ['ra', 'pcwp'], beats: 3, respiration: true, landmark: 'cath-ra', view: 'rao' }
      ]
    },
    en: {
      title: 'Interactive hemodynamics • Pressure tracings and calculations',
      intro: 'Right and left heart pressure tracings are drawn on the shared cardiac clock, in step with the ECG and the 3D valve motion. Pick a scenario, overlay channels, switch respiration on, trigger a PVC; gradients, valve areas, resistances and shunt ratios update live. The curves are textbook-style schematic shapes, not patient recordings.',
      steps: [
        { title: 'Measurement technique and normal values', text: 'Zero and level at the phlebostatic axis (mid-chest); read values at end-expiration. In fluid-filled systems overdamping rounds the waveform, underdamping and catheter whip create false peaks. Normal: RA mean < 5, RV 25/5, PA 25/10 mean < 15, PCWP mean < 12, LV 120/8, aorta 120/80 mmHg.', scenario: 'normal', channels: ['ra', 'ao'], beats: 2, respiration: true, landmark: 'cath-ra', view: 'anterior' },
        { title: 'Right atrial waves', text: 'The a wave is atrial contraction following the P wave; the c wave is the tricuspid bulging into the RA at closure, the x descent atrial relaxation with annular descent, the v wave venous filling during systole, the y descent emptying as the tricuspid opens. Switch respiration on: all pressures fall a few mmHg with inspiration.', scenario: 'normal', channels: ['ra'], beats: 2, respiration: true, landmark: 'cath-ra', view: 'rao' },
        { title: 'Right ventricle and pulmonary artery', text: 'RV diastolic pressure is lowest in early diastole, rises slowly and reaches the RVEDP with atrial contraction (QRS onset). The PA dicrotic notch marks pulmonary valve closure; normally PA diastolic pressure sits a few mmHg above the PCWP.', scenario: 'normal', channels: ['rv', 'pa'], beats: 2, respiration: false, landmark: 'cath-pa', view: 'anterior' },
        { title: 'Wedge pressure (PCWP) and the left atrium', text: 'With the balloon occluding a distal PA branch, left atrial pressure is transmitted delayed (50–150 ms depending on the source) and damped: a and v waves, x and y descents. A true wedge is confirmed by the waveform, a mean below the PA pressure and an arterial-level saturation (> 95%). In diastole LV and PCWP superimpose; any separation is the mitral gradient.', scenario: 'normal', channels: ['lv', 'pcwp'], beats: 2, respiration: false, landmark: 'cath-wedge', view: 'rao' },
        { title: 'Left ventricle and aorta', text: 'LV pressure rises steeply during isovolumetric contraction; once the aortic valve opens the two curves superimpose and separate again at S2 with the dicrotic notch. Aortic diastolic pressure decays until the next opening. On pullback the LV-to-aortic systolic difference is the peak-to-peak gradient; peripherally systolic pressure rises while the mean is preserved (amplification).', scenario: 'normal', channels: ['lv', 'ao'], beats: 2, respiration: false, landmark: 'cath-lv', view: 'lao' },
        { title: 'Output, resistances and shunt run', text: 'Fick: CO = VO₂ / (Hb × 1.36 × 10 × (SaO₂ − SvO₂)); when VO₂ is not measured, 125 mL/min/m² is assumed. PVR = (mPAP − PCWP) / CO (Wood units), SVR = (MAP − RA) / CO × 80 (dyn). Mixed venous = (3 SVC + IVC) / 4; a step-up of ≥ 7% at the RA or ≥ 5% at the RV or PA indicates a left-to-right shunt. In this ASD scenario Qp/Qs is about 2; open the calculators.', scenario: 'asd_left_to_right', channels: ['ra', 'pa'], beats: 2, respiration: false, calculators: true, landmark: 'cath-ra', view: 'anterior' },
        { title: 'Aortic stenosis', text: 'LV stays above the aorta throughout ejection; the shaded area is the mean gradient. The aortic upstroke is slow and late-peaking (parvus et tardus). Gorlin: area = flow / (44.3 × √mean gradient), flow = CO / (HR × SEP). Press PVC: in fixed stenosis the post-extrasystolic beat raises both the gradient and the aortic pulse pressure.', scenario: 'aortic_stenosis_severe', channels: ['lv', 'ao'], beats: 3, respiration: false, landmark: 'cath-ao', view: 'lao' },
        { title: 'Hypertrophic obstructive cardiomyopathy', text: 'In dynamic obstruction the aortic tracing shows an early spike, a mid-systolic dip and a second dome; the gradient develops in mid and late ejection. Press PVC: on the post-extrasystolic beat the gradient increases while the aortic pulse pressure falls (Brockenbrough-Braunwald-Morrow sign), the opposite of fixed aortic stenosis.', scenario: 'hocm', channels: ['lv', 'ao'], beats: 3, respiration: false, landmark: 'cath-lv', view: 'lao' },
        { title: 'Mitral stenosis', text: 'PCWP stays above the LV throughout diastole; the shaded area is the mean diastolic gradient. The Gorlin constant is 37.7 and the flow window is the diastolic filling period (DFP); tachycardia and atrial fibrillation shorten the DFP and raise the gradient. An uncorrected wedge delay overestimates the gradient.', scenario: 'mitral_stenosis_severe', channels: ['lv', 'pcwp'], beats: 2, respiration: false, landmark: 'cath-wedge', view: 'rao' },
        { title: 'Mitral regurgitation', text: 'Blood regurgitating into the left atrium in systole produces a giant v wave on the wedge tracing; a v wave exceeding twice the mean PCWP is significant. A compliant, chronically dilated atrium may show only a small v wave; acute regurgitation shows a prominent one. The same giant v wave appears in acute LV failure.', scenario: 'mitral_regurgitation_severe', channels: ['lv', 'pcwp'], beats: 2, respiration: false, landmark: 'cath-wedge', view: 'rao' },
        { title: 'Aortic regurgitation', text: 'In chronic severe AR the pulse pressure widens, aortic diastolic pressure falls and the LVEDP rises; LV and aortic pressures approach each other at end-diastole. In acute severe AR the LVEDP equilibrates with aortic diastolic pressure, the mitral valve closes prematurely and the pulse pressure may not be as wide as expected.', scenario: 'aortic_regurgitation_severe', channels: ['lv', 'ao'], beats: 2, respiration: false, landmark: 'cath-ao', view: 'lao' },
        { title: 'Constrictive pericarditis', text: 'Diastolic pressures are elevated and equalized within 5 mmHg; the ventricular tracing shows an early dip and plateau (square-root sign), the RA a prominent y descent. Switch respiration on: with inspiration LV systolic pressure falls while RV systolic rises (ventricular interdependence, discordant change); RA pressure fails to fall or even rises (Kussmaul).', scenario: 'constrictive_pericarditis', channels: ['lv', 'rv'], beats: 4, respiration: true, landmark: 'cath-rv', view: 'anterior' },
        { title: 'Restrictive cardiomyopathy', text: 'The dip-and-plateau looks similar, but diastolic pressures are not equal: LVEDP exceeds RVEDP by more than 5 mmHg and PA systolic pressure often exceeds 50 mmHg. With respiration LV and RV systolic pressures change in the same direction (concordant). These two findings separate it from constriction.', scenario: 'restrictive_cardiomyopathy', channels: ['lv', 'rv'], beats: 4, respiration: true, landmark: 'cath-lv', view: 'anterior' },
        { title: 'Cardiac tamponade', text: 'Pericardial pressure equalizes the diastolic pressures; the RA y descent is lost (ventricular filling is restricted) while the x descent is preserved. Output is low and heart rate high. Switch respiration on: aortic systolic pressure falls by more than 10 mmHg with inspiration (pulsus paradoxus). After pericardiocentesis the y descent returns.', scenario: 'tamponade', channels: ['ra', 'ao'], beats: 4, respiration: true, landmark: 'cath-ra', view: 'anterior' },
        { title: 'Pulmonary hypertension', text: 'mPAP > 20 mmHg defines pulmonary hypertension (2022 ESC/ERS; older sources use ≥ 25 mmHg and PVR > 3 WU); with PCWP ≤ 15 and PVR > 2 WU it is pre-capillary, with PCWP > 15 post-capillary. TPG = mPAP − PCWP, DPG = PA diastolic − PCWP; DPG ≥ 7 with PVR > 2 WU indicates combined pre- and post-capillary disease. Compare with the isolated post-capillary PH scenario.', scenario: 'precapillary_ph', channels: ['pa', 'pcwp'], beats: 2, respiration: false, landmark: 'cath-pa', view: 'anterior' },
        { title: 'Right ventricular infarction and acute left heart failure', text: 'In RV infarction RA pressure rises, the y descent is blunted, the RA/PCWP ratio exceeds 0.8 and Kussmaul may appear; PA and PCWP are relatively low. In the acute LV failure scenario the PCWP is high with a giant v wave, output is low and mixed venous saturation falls.', scenario: 'rv_infarct', channels: ['ra', 'pcwp'], beats: 3, respiration: true, landmark: 'cath-ra', view: 'rao' }
      ]
    }
  },
  exam: {
    tr: {
      title: 'Fizik muayene • Oskültasyon ve dinamik manevralar',
      intro: 'Üfürümü seçin, manevrayı uygulayın: model, manevranın ön yük, art yük, kontraktilite, kalp hızı ve sağ kalbe dönüş üzerindeki etkisinden üfürümün artıp azaldığını hesaplar ve ders kitabı tablosu ile karşılaştırır. Fonokardiyogram EKG ve 3B kalp ile aynı döngü saatindedir. Bu modül zamanla genişletilecek; yeni bulgu ve manevralar veri tablosuna eklenir.',
      steps: [
        { title: 'Oskültasyon odakları ve S2 ayrılması', text: 'Göğüs duvarındaki beş odak (A, P, E, T, M) şematik olarak işaretlidir. İnspiryumda sağ kalbe dönüş artar, P2 gecikir ve S2 ayrılması genişler; ekspiryumda daralır. Normal ayrılma pulmoner odakta duyulur.', finding: 'innocent', maneuver: 'inspiration', area: 'pulmonic', view: 'anterior' },
        { title: 'Solunum: sağ mı sol mu?', text: 'Sağ kalp üfürümleri inspiryumda artar (Carvallo), ekspiryumda azalır. Lembo 1988: bu yanıt sağ kalp üfürümlerini %100 duyarlılık, %88 özgüllükle ayırır. Sol kalp üfürümlerinin çoğu inspiryumda azalır, ekspiryumda artar (Lembo: AS %75, HOKM %90, MY %67, VSD %70 azalma).', finding: 'tricuspid_regurgitation', maneuver: 'inspiration', area: 'tricuspid', view: 'anterior' },
        { title: 'HOKM: dinamik LVOT obstrüksiyonu', text: 'Hipertrofik septum ile sistolde öne hareket eden anterior mitral yaprakçık (SAM) çıkış yolunu daraltır. Gradyan sabit değildir: LV küçüldükçe, aort basıncı düştükçe ve kontraktilite arttıkça büyür. İstirahatte ≥ 30 mmHg obstrüktif, provokasyonla ≥ 50 mmHg semptomatik hastada septal redüksiyon eşiğidir.', finding: 'hocm', maneuver: 'rest', area: 'erb', view: 'anterior' },
        { title: 'HOKM: Valsalva ve ayağa kalkma', text: 'Valsalva ıkınma fazında venöz dönüş ve LV boyutu düşer; ayağa kalkınca kan bacaklarda göllenir. İkisi de gradyanı ve üfürümü artırır. Lembo 1988: Valsalva ile artış Se %65, Sp %96; çömelmeden ayağa kalkışta artış Se %95, Sp %84.', finding: 'hocm', maneuver: 'valsalva_strain', area: 'erb', view: 'anterior' },
        { title: 'HOKM: çömelme, bacak kaldırma, el sıkma', text: 'Çömelme venöz dönüşü ve sistemik direnci birlikte artırır, bacak kaldırma LV\'yi doldurur, el sıkma art yükü artırır: üçü de obstrüksiyonu ve üfürümü azaltır. Lembo 1988: çömelmede azalma Se %95, Sp %85; pasif bacak kaldırmada Se %85, Sp %91; el sıkmada Se %85, Sp %75.', finding: 'hocm', maneuver: 'squat', area: 'erb', view: 'anterior' },
        { title: 'Ekstrasistol sonrası atım: HOKM mi aort darlığı mı?', text: 'Kompansatuvar duraklamadan sonraki atımda doluş ve kontraktilite artar. Sabit aort darlığında üfürüm ve nabız basıncı artar; HOKM\'de gradyan artarken aort nabız basıncı düşer (Brockenbrough-Braunwald-Morrow). Mitral yetersizliği bu atımda değişmez.', finding: 'hocm', maneuver: 'post_pvc', area: 'erb', view: 'anterior' },
        { title: 'Aort darlığı', text: 'Kapaktan geçen akım arttıkça (çömelme, bacak kaldırma, ekstrasistol sonrası, amil nitrit) üfürüm artar; Valsalva ve ayağa kalkmakla azalır. Karotise yayılır. Lembo 1988: hiçbir manevra tek başına tanı koydurmadı, tanı dışlamayla kondu.', finding: 'aortic_stenosis', maneuver: 'squat', area: 'aortic', view: 'anterior' },
        { title: 'Mitral yetersizliği ve VSD: art yük manevraları', text: 'El sıkma ve geçici arteriyel oklüzyon art yükü artırıp geri kaçışı büyütür; amil nitrit azaltır. Lembo 1988: el sıkmada artış Se %68, Sp %92; arteriyel oklüzyonda Se %78, Sp %100; amil nitritle azalma Se %80, Sp %90 (MY veya VSD).', finding: 'mitral_regurgitation', maneuver: 'handgrip', area: 'mitral', view: 'anterior' },
        { title: 'Mitral kapak prolapsusu', text: 'Şiddetten çok zamanlama değişir: LV küçüldükçe (Valsalva, ayağa kalkma) klik S1\'e yaklaşır ve üfürüm uzar; LV büyüdükçe (çömelme, bacak kaldırma) klik gecikir ve üfürüm kısalır. El sıkma için kaynaklar çelişir (Lembo: üfürümü erkene alır).', finding: 'mvp', maneuver: 'valsalva_strain', area: 'mitral', view: 'anterior' },
        { title: 'Aort yetersizliği', text: 'Yüksek frekanslı dekreşendo diyastolik üfürüm; hasta öne eğilmiş, ekspiryumda nefes tutarken diyafram ile Erb noktasında dinlenir. El sıkma, çömelme ve arteriyel oklüzyon artırır, amil nitrit azaltır.', finding: 'aortic_regurgitation', maneuver: 'handgrip', area: 'erb', view: 'anterior' },
        { title: 'Mitral darlığı', text: 'Açılma sesinden sonra düşük frekanslı rulman ve sinüs ritminde presistolik belirginleşme. Sol lateral dekübitte apekste çan ile dinlenir; kısa egzersiz veya amil nitrit belirginleştirir. Atriyal fibrilasyonda presistolik belirginleşme kaybolur.', finding: 'mitral_stenosis', maneuver: 'left_lateral', area: 'mitral', view: 'anterior' },
        { title: 'Masum üfürüm', text: 'Kısa, hafif, erken tepeli ejeksiyon üfürümü; S2 ayrılması normal, başka anormal ses yok. Ayağa kalkınca ve Valsalva ile azalır. Yüksek dereceli (≥ 3/6), diyastolik, holosistolik veya yayılan üfürüm masum sayılmaz.', finding: 'innocent', maneuver: 'stand', area: 'erb', view: 'anterior' }
      ]
    },
    en: {
      title: 'Physical examination • Auscultation and dynamic maneuvers',
      intro: 'Pick a murmur and apply a maneuver: the model computes whether the murmur grows or softens from the maneuver\'s effect on preload, afterload, contractility, heart rate and right-heart return, and compares it with the textbook table. The phonocardiogram shares the cycle clock with the ECG and the 3D heart. This module will keep growing; new findings and maneuvers are data table entries.',
      steps: [
        { title: 'Auscultation areas and S2 splitting', text: 'The five chest-wall areas (A, P, E, T, M) are marked schematically. With inspiration right-heart return rises, P2 is delayed and S2 splitting widens; it narrows on expiration. Normal splitting is heard at the pulmonic area.', finding: 'innocent', maneuver: 'inspiration', area: 'pulmonic', view: 'anterior' },
        { title: 'Respiration: right or left?', text: 'Right-sided murmurs grow with inspiration (Carvallo) and soften with expiration. Lembo 1988: this response identified right-sided murmurs with 100% sensitivity and 88% specificity. Most left-sided murmurs fall with inspiration and rise with expiration (Lembo: AS 75%, HCM 90%, MR 67%, VSD 70% decrease).', finding: 'tricuspid_regurgitation', maneuver: 'inspiration', area: 'tricuspid', view: 'anterior' },
        { title: 'HOCM: dynamic LVOT obstruction', text: 'The hypertrophied septum and the anterior mitral leaflet moving forward in systole (SAM) narrow the outflow tract. The gradient is not fixed: it grows as the LV gets smaller, aortic pressure falls and contractility rises. At rest ≥ 30 mmHg is obstructive; ≥ 50 mmHg with provocation is the septal reduction threshold in symptomatic patients.', finding: 'hocm', maneuver: 'rest', area: 'erb', view: 'anterior' },
        { title: 'HOCM: Valsalva and standing', text: 'The Valsalva strain phase lowers venous return and LV size; on standing blood pools in the legs. Both raise the gradient and the murmur. Lembo 1988: louder with Valsalva Se 65%, Sp 96%; louder on squat-to-stand Se 95%, Sp 84%.', finding: 'hocm', maneuver: 'valsalva_strain', area: 'erb', view: 'anterior' },
        { title: 'HOCM: squatting, leg raise, handgrip', text: 'Squatting raises venous return and systemic resistance together, leg raise fills the LV, handgrip raises afterload: all three relieve the obstruction and soften the murmur. Lembo 1988: softer on squatting Se 95%, Sp 85%; passive leg raise Se 85%, Sp 91%; handgrip Se 85%, Sp 75%.', finding: 'hocm', maneuver: 'squat', area: 'erb', view: 'anterior' },
        { title: 'The beat after a PVC: HOCM or aortic stenosis?', text: 'After the compensatory pause filling and contractility rise. In fixed aortic stenosis the murmur and the pulse pressure increase; in HOCM the gradient rises while the aortic pulse pressure falls (Brockenbrough-Braunwald-Morrow). Mitral regurgitation does not change on that beat.', finding: 'hocm', maneuver: 'post_pvc', area: 'erb', view: 'anterior' },
        { title: 'Aortic stenosis', text: 'The murmur grows with flow across the valve (squatting, leg raise, the beat after a PVC, amyl nitrite) and softens with Valsalva and standing. It radiates to the carotids. Lembo 1988: no single maneuver identified it; the diagnosis was made by exclusion.', finding: 'aortic_stenosis', maneuver: 'squat', area: 'aortic', view: 'anterior' },
        { title: 'Mitral regurgitation and VSD: afterload maneuvers', text: 'Handgrip and transient arterial occlusion raise afterload and the regurgitant flow; amyl nitrite lowers it. Lembo 1988: louder with handgrip Se 68%, Sp 92%; with arterial occlusion Se 78%, Sp 100%; softer with amyl nitrite Se 80%, Sp 90% (MR or VSD).', finding: 'mitral_regurgitation', maneuver: 'handgrip', area: 'mitral', view: 'anterior' },
        { title: 'Mitral valve prolapse', text: 'Timing changes more than loudness: as the LV gets smaller (Valsalva, standing) the click moves toward S1 and the murmur lengthens; as it enlarges (squatting, leg raise) the click is delayed and the murmur shortens. Sources disagree on handgrip (Lembo: makes the murmur earlier).', finding: 'mvp', maneuver: 'valsalva_strain', area: 'mitral', view: 'anterior' },
        { title: 'Aortic regurgitation', text: 'A high-pitched decrescendo diastolic murmur; listen at Erb\'s point with the diaphragm, patient sitting forward in held expiration. Handgrip, squatting and arterial occlusion increase it, amyl nitrite decreases it.', finding: 'aortic_regurgitation', maneuver: 'handgrip', area: 'erb', view: 'anterior' },
        { title: 'Mitral stenosis', text: 'A low-pitched rumble after an opening snap with presystolic accentuation in sinus rhythm. Listen with the bell at the apex in left lateral decubitus; brief exercise or amyl nitrite bring it out. Presystolic accentuation disappears in atrial fibrillation.', finding: 'mitral_stenosis', maneuver: 'left_lateral', area: 'mitral', view: 'anterior' },
        { title: 'Innocent murmur', text: 'A short, soft, early-peaking ejection murmur with normal S2 splitting and no other abnormal sounds. It softens on standing and with Valsalva. A murmur that is loud (≥ 3/6), diastolic, holosystolic or radiating is not innocent.', finding: 'innocent', maneuver: 'stand', area: 'erb', view: 'anterior' }
      ]
    }
  }

};

export const lessons = new Proxy({}, {
  get(target, prop) {
    const raw = rawLessons[prop];
    if (!raw) return undefined;
    return raw[currentLang] || raw.tr || raw.en;
  },
  has(target, prop) {
    return prop in rawLessons;
  },
  ownKeys() {
    return Reflect.ownKeys(rawLessons);
  },
  getOwnPropertyDescriptor(target, prop) {
    if (prop in rawLessons) {
      return { configurable: true, enumerable: true, value: this.get(target, prop) };
    }
    return undefined;
  }
});

export const uiTranslations = {
  tr: {
    brandSubtitle: 'ANATOMİ STÜDYOSU',
    headerTitle: 'İnteraktif 3D Kardiyak Atlas',
    shortcutsBtn: 'Kısayollar',
    referencesBtn: 'Hakkında ve kaynaklar',
    referencesTitle: 'Hakkında ve kaynaklar',
    madeBy: 'Yapım: Dr. Yusuf Hoşoğlu',
    contactLead: 'İletişim:',
    referencesIntro: 'Metinler seçilmiş kaynaklara dayanır. Sayfa numaraları, belirtildiyse PDF sayfasıdır. Denetim ve sınırlar: SOURCES.md.',
    referencesLimits: 'Model sınırları: Kalp ve damar örgüleri aynı yerel cardiovascular.glb dosyasındadır. Üst yazar ve lisans doğrulanmamıştır; HuBMAP atfı yoktur. Hücre çizimleri ve atım şematiktir. Anatomi kaynak taraması klinik simülatör geçerliliği kurmaz.',
    closeDialog: 'Kapat ×',
    workspaceEyebrow: 'ÇALIŞMA ALANI',
    workspaceTitle: 'Kalbin anatomisi.',
    workspaceMuted: 'Yapıyı keşfedin. İlişkileri anlayın.',
    modes: [
      ['anatomy', '01', 'Genel anatomi'],
      ['angiography', '02', 'Anjiyografi'],
      ['ablation', '03', 'Ablasyon anatomisi'],
      ['pacemaker', '04', 'Pacemaker leadi'],
      ['transseptal', '05', 'Transseptal & septostomi'],
      ['bachmann', '06', 'Bachmann demeti & pacing'],
      ['cath', '07', 'Kardiyak kateterizasyon'],
      ['hemodynamics', '08', 'İnteraktif hemodinami'],
      ['exam', '09', 'Fizik muayene']
    ],
    layersHeading: 'ANATOMİK KATMANLAR',
    chambers: 'Odacıklar (Chambers)',
    vessels: 'Büyük damarlar',
    coronaries: 'Koroner arterler',
    valves: 'Kapak yapıları (Valves)',
    veins: 'Venler (Veins)',
    conduction: 'İleti sistemi (Conduction)',
    veinsBtn: 'Venler',
    veinsHiddenBtn: 'Venler (Gizli)',
    conductionBtn: 'İleti',
    conductionHiddenBtn: 'İleti (Gizli)',
    valvesBtn: 'Kapaklar',
    valvesHiddenBtn: 'Kapaklar (Gizli)',
    wallClosed: 'Kapalı',
    wallSection: 'kesit',
    wallToolsSummary: 'Duvar açma pencereleri',
    wallToolsNote: 'Atlas duvarları ayrı segmentlemiyor. Bu kontroller bölgesel geometrik kesitlerdir; endokard / miyokard / epikard katmanları değildir.',
    wallRv: 'RV ön / serbest duvar yönü',
    wallLv: 'LV lateral duvar yönü',
    wallLa: 'LA posterior duvar yönü',
    wallRa: 'RA lateral duvar yönü',
    restoreWalls: 'Duvarları geri getir',
    rootWindowNote: 'Kesit üst aort duvarını gizler. Kusp, sinüs duvarı ve ostium farklı yapılardır.',
    explorerPrefix: 'İNCELEME',
    viewerHint: 'Sürükle: döndür · Kaydır: yakınlaştır · Tıkla: incele',
    modeShortcut: 'Öğrenme modu (1 anatomi … 6 Bachmann)',
    flowShortcut: 'Kan akışını aç veya kapat',
    carmTitle: 'C-ARM GANTRY',
    carmPill: 'ANJİOGRAFİ',
    obliqueLabel: 'OBLİK DÖNÜŞ (LAO / RAO)',
    angulationLabel: 'ANGÜLASYON (CRA / CAU)',
    carmPresetsTitle: 'STANDART PROJEKSİYONLAR',
    carmQuickTogglesTitle: 'HIZLI KATMAN KONTROLLERİ',
    fluoroBtn: 'Floroskopi Modu',
    fluoroDockBtn: 'Floroskopi',
    fluoroDockTitle: 'Floroskopi Modu (X-ışını simülasyonu)',
    fluoroShortcut: 'Floroskopi Modunu aç veya kapat',
    resetBtn: 'Sıfırla',
    beatAnimate: '♡ Kalp atımı',
    beatPause: '♡ Atımı durdur',
    opacityLabel: 'Saydamlık',
    coronaryToolsHeading: 'KORONER İNCELEME',
    coronarySystemLabel: 'Koroner filtre',
    rootWindowLabel: 'Aort kökü penceresi',
    provenanceAtlas: 'ANATOMİK ATLAS / SEÇİLİ YAPI',
    provenanceSchematic: 'ŞEMATİK KAVRAM / 3D İLLÜSTRASYON',
    provenanceReference: 'REFERANS NOTU / KAYITLI MESH YOK',
    nextLandmark: 'Sonraki nirengi →',
    restartExploration: 'Yeniden başlat ↺',
    keyboardHelpTitle: 'Klavye Kısayolları',
    carmDragHint: 'Paneli serbestçe taşımak için sürükleyin',
    leadProgressLabel: 'Lead ilerletme / Yerleşim',
    leadProgressNote: '3D transvenöz lead modelleri ve fizyolojik ileti sistemi (CSP/LBBAP) hedefleri eğitim amaçlı modellenmiştir.',
    flowToggleBtn: '🩸 Akış',
    flowToggleTitle: 'Kan akışı partiküllerini aç/kapat (F)',
    flowLegendTitle: 'Oksijenlenme: Kırmızı (Sol kalp / Aort / Koroner arter) · Mavi (Sağ kalp / Pulmoner arter / Venöz sistem)',
    cycleDisclaimer: 'Wiggers döngüsü · Şematik akış · Eğitim modeli (CFD / Tanısal simülasyon değildir)',
    ecgCaption: 'Şematik DII EKG · tanı kaydı değildir',
    tsCathHeading: 'TRANSSEPTAL KATETERLERİ',
    tsCathPigtail: 'Pigtail (Aort Kökü)',
    tsCathCs: 'CS Kateteri (AV Oluk)',
    tsCathSheath: 'Kılıf & İğne (Sheath)',
    tsCathWire: 'Kılavuz Tel (Guidewire)',
    tsCathBalloon: 'Septostomi Balonu',
    tsCathIas: 'Fossa Ovalis & Septum',
    tsCathReset: 'Kateterleri Sıfırla',
    updateBtn: 'Güncelle',
    upTitle: 'Yeni sürüm hazır',
    upDesc: 'Cardia güncellendi. Yeni özellikleri ve düzeltmeleri almak için yenileyin.',
    upVersionLabel: 'Sürüm',
    upLater: 'Sonra',
    upReload: 'Güncellemek için yenile',
    upChecking: 'Denetleniyor…',
    upUpToDate: 'Cardia güncel (En son sürüm) ✓',
    upFound: 'Yeni sürüm mevcut!',
    upReloading: 'Yenileniyor…',
    upOfflineReady: 'Çevrimdışı kullanıma hazır ✓',
    resizerTitle: 'Sağ paneli genişletmek için sürükleyin · Sıfırlamak için çift tıklayın',
    resizerAria: 'Sağ paneli genişlet veya daralt'
  },
  en: {
    brandSubtitle: 'ANATOMY STUDIO',
    headerTitle: 'Interactive 3D Cardiac Atlas',
    shortcutsBtn: 'Shortcuts',
    referencesBtn: 'About and sources',
    referencesTitle: 'About and sources',
    madeBy: 'Made by: Dr. Yusuf Hoşoğlu',
    contactLead: 'Contact:',
    referencesIntro: 'Descriptions are grounded in selected sources. Page numbers refer to PDF pages where specified. Audit and limitations: SOURCES.md.',
    referencesLimits: 'Model limitations: Heart and vascular meshes come from the same local cardiovascular.glb. Its upstream author and license have not been verified; this is not attributed to HuBMAP. Cell diagrams and beating remain illustrative. Anatomical source review does not establish clinical simulator validity.',
    closeDialog: 'Close ×',
    workspaceEyebrow: 'YOUR WORKSPACE',
    workspaceTitle: 'Inside the heart.',
    workspaceMuted: 'Explore structure. Understand relationships.',
    modes: [
      ['anatomy', '01', 'Gross anatomy'],
      ['angiography', '02', 'Angiography'],
      ['ablation', '03', 'Ablation anatomy'],
      ['pacemaker', '04', 'Pacemaker leads'],
      ['transseptal', '05', 'Transseptal & septostomy'],
      ['bachmann', '06', 'Bachmann bundle & pacing'],
      ['cath', '07', 'Cardiac catheterization'],
      ['hemodynamics', '08', 'Interactive hemodynamics'],
      ['exam', '09', 'Physical examination']
    ],
    layersHeading: 'ANATOMICAL LAYERS',
    chambers: 'Chambers',
    vessels: 'Great vessels',
    coronaries: 'Coronary arteries',
    valves: 'Valves & leaflets',
    veins: 'Cardiac veins',
    conduction: 'Conduction system',
    veinsBtn: 'Veins',
    veinsHiddenBtn: 'Veins (Hidden)',
    conductionBtn: 'Conduction',
    conductionHiddenBtn: 'Conduction (Hidden)',
    valvesBtn: 'Valves',
    valvesHiddenBtn: 'Valves (Hidden)',
    wallClosed: 'Closed',
    wallSection: 'cut',
    wallToolsSummary: 'Wall section windows',
    wallToolsNote: 'The atlas does not segment wall layers. These controls are regional geometric sections, not endocardium, myocardium, or epicardium.',
    wallRv: 'RV anterior / free-wall direction',
    wallLv: 'LV lateral wall direction',
    wallLa: 'LA posterior wall direction',
    wallRa: 'RA lateral wall direction',
    restoreWalls: 'Restore wall windows',
    rootWindowNote: 'The section hides the superior aortic wall. Cusp, sinus wall, and ostium are different structures.',
    explorerPrefix: 'EXPLORER',
    viewerHint: 'Drag to rotate · Scroll to zoom · Click to inspect',
    modeShortcut: 'Switch learning mode (1 anatomy through 6 Bachmann)',
    flowShortcut: 'Toggle blood flow',
    carmTitle: 'C-ARM GANTRY',
    carmPill: 'ANGIOGRAPHY',
    obliqueLabel: 'OBLIQUE ROTATION (LAO / RAO)',
    angulationLabel: 'ANGULATION (CRA / CAU)',
    carmPresetsTitle: 'STANDARD PROJECTIONS',
    carmQuickTogglesTitle: 'QUICK LAYER TOGGLES',
    fluoroBtn: 'Fluoroscopy Mode',
    fluoroDockBtn: 'Fluoroscopy',
    fluoroDockTitle: 'Fluoroscopy Mode (X-ray simulation)',
    fluoroShortcut: 'Toggle fluoroscopy mode',
    resetBtn: 'Reset view',
    beatAnimate: '♡ Animate beat',
    beatPause: '♡ Pause beat',
    opacityLabel: 'Opacity',
    coronaryToolsHeading: 'CORONARY REVIEW',
    coronarySystemLabel: 'Coronary system',
    rootWindowLabel: 'Aortic root viewing cut',
    provenanceAtlas: 'ATLAS / SELECTED STRUCTURE',
    provenanceSchematic: 'SCHEMATIC CONCEPT / 3D ILLUSTRATION',
    provenanceReference: 'REFERENCE NOTE / NO REGISTERED MESH',
    nextLandmark: 'Next landmark →',
    restartExploration: 'Restart exploration ↺',
    keyboardHelpTitle: 'Keyboard Shortcuts',
    carmDragHint: 'Drag to freely reposition panel',
    leadProgressLabel: 'Lead advancement / Placement',
    leadProgressNote: '3D transvenous lead models and physiological conduction system pacing (CSP/LBBAP) targets are modeled for clinical education.',
    flowToggleBtn: '🩸 Flow',
    flowToggleTitle: 'Toggle blood flow particles (F)',
    flowLegendTitle: 'Oxygenation: Red (Left heart / Aorta / Coronaries) · Blue (Right heart / Pulmonary artery / Veins)',
    cycleDisclaimer: 'Wiggers cycle · Schematic flow · Educational model (Not CFD / diagnostic simulation)',
    ecgCaption: 'Schematic lead II ECG · not a diagnostic tracing',
    tsCathHeading: 'TRANSSEPTAL CATHETERS',
    tsCathPigtail: 'Pigtail (Aortic Root)',
    tsCathCs: 'CS Catheter (AV Groove)',
    tsCathSheath: 'Sheath & Needle',
    tsCathWire: 'Guidewire',
    tsCathBalloon: 'Septostomy Balloon',
    tsCathIas: 'Fossa Ovalis & Septum',
    tsCathReset: 'Reset Catheters',
    updateBtn: 'Update',
    upTitle: 'New version ready',
    upDesc: 'Cardia has been updated. Reload to pick up new features and fixes.',
    upVersionLabel: 'Version',
    upLater: 'Later',
    upReload: 'Reload to update',
    upChecking: 'Checking…',
    upUpToDate: 'Cardia is up to date ✓',
    upFound: 'New version available!',
    upReloading: 'Reloading…',
    upOfflineReady: 'Ready for offline use ✓',
    resizerTitle: 'Drag to resize right panel · Double-click to reset',
    resizerAria: 'Resize right panel'
  }
};

export function getTranslation(key) {
  const dict = uiTranslations[currentLang] || uiTranslations.tr;
  return dict[key] ?? uiTranslations.tr[key] ?? key;
}

export function getUiModes() {
  const dict = uiTranslations[currentLang] || uiTranslations.tr;
  return dict.modes || uiTranslations.tr.modes;
}

const viewerTitles = {
  tr: {
    anatomy: 'Yeni bir bakış.',
    micro: 'Kastan hücreye.',
    angiography: 'Projeksiyonu oku.',
    ablation: 'Nirengi noktalarını işaretle.',
    pacemaker: 'Leadi izle.',
    transseptal: 'Septumu geç.',
    bachmann: 'Bachmann: anatomi ve atriyal pacing.',
    hemodynamics: 'Basınç eğrisini oku.',
    exam: 'Dinle, manevrayı yap.'
  },
  en: {
    anatomy: 'A new perspective.',
    micro: 'From muscle to cell.',
    angiography: 'Read the projection.',
    ablation: 'Map the landmarks.',
    pacemaker: 'Trace the lead.',
    transseptal: 'Cross the septum.',
    bachmann: 'Bachmann: anatomy and atrial pacing.',
    hemodynamics: 'Read the pressure tracing.',
    exam: 'Listen, then maneuver.'
  }
};

export function getViewerTitle(mode) {
  const table = viewerTitles[currentLang] || viewerTitles.tr;
  return table[mode] || table.anatomy;
}

const angioCopy = {
  tr: {
    spider: 'SPIDER VIEW · Sol ana koroner (LMCA) bifurkasyonu, ostial LAD ve LCx',
    rao_cranial: 'RAO CRANIAL · LAD orta-distal gövdesi ve diagonal (D1, D2) dallar',
    lao_cranial: 'LAO CRANIAL · LAD septal dallar ve distal RCA / crux / PDA',
    rao_caudal: 'RAO CAUDAL · LCx gövdesi ve obtüz marjinal (OM) dallar',
    ap_cranial: 'AP CRANIAL · LAD gövdesinin uzatılmış projeksiyonu',
    ap_caudal: 'AP CAUDAL · Sol ana koroner ve sirkumfleks ostiyumu',
    lao: 'LAO 45 · Sağ koroner arter (RCA) C kıvrımı ve orta segment',
    rao: 'RAO 30 · RCA düz profil, akut marjinal dallar',
    lateral: 'LATERAL 90° · Sol lateral görünüm, LIMA grefti ve mid-LAD',
    anterior: 'ANTERIOR (AP) · Anteroposterior temel kardiyak referans',
    posterior: 'POSTERIOR · Kalbin arka yüzeyi ve sol atriyum venöz girişi',
    custom: angles => `Özel açı · ${angles.laoRaoStr} · ${angles.craCauStr}`
  },
  en: {
    spider: 'SPIDER VIEW · Left main bifurcation and ostial LAD / LCx',
    rao_cranial: 'RAO CRANIAL · Mid-distal LAD and diagonal branches',
    lao_cranial: 'LAO CRANIAL · LAD septals and distal RCA / crux / PDA',
    rao_caudal: 'RAO CAUDAL · LCx body and obtuse marginal branches',
    ap_cranial: 'AP CRANIAL · Elongated LAD body',
    ap_caudal: 'AP CAUDAL · Left main and circumflex ostium',
    lao: 'LAO 45 · RCA C-curve and mid segment',
    rao: 'RAO 30 · Straight RCA profile and acute marginal branches',
    lateral: 'LATERAL 90° · Left lateral view, LIMA graft and mid-LAD',
    anterior: 'ANTERIOR (AP) · Anteroposterior reference',
    posterior: 'POSTERIOR · Posterior surface and left atrial venous inflow',
    custom: angles => `Custom angle · ${angles.laoRaoStr} · ${angles.craCauStr}`
  }
};

export function getAngioDescription(key, angles) {
  const table = angioCopy[currentLang] || angioCopy.tr;
  const value = table[key];
  if (typeof value === 'function') {
    return value(angles || { laoRaoStr: '', craCauStr: '' });
  }
  return value || '';
}

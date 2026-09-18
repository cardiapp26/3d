const atlas = 'Kardiyak anatomi atlası';
const av = 'Ho et al., 2003, PDF pp. 3–4';
const la = 'Ho et al., 2012, PDF pp. 2–3';
const rv = 'Anatomy for right ventricular lead implantation, PDF p. 2';

let currentLang = (typeof localStorage !== 'undefined' && localStorage.getItem('cardia_lang')) || 'tr';

export function setContentLanguage(lang) {
  currentLang = lang === 'en' ? 'en' : 'tr';
  if (typeof localStorage !== 'undefined') {
    try { localStorage.setItem('cardia_lang', currentLang); } catch (_) {}
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
      description: 'En posterior kardiyak odacıktır; pulmoner venlerden oksijenlenmiş kanı alır. Atriyal miyokardiyal kılıflar venlerin üzerine değişken biçimde uzanır.',
      clinical: 'Pulmoner ven anatomisi değişkenlik gösterir. Posterior duvar, bu şematik modelde gösterilmeyen özofagus ile çok yakın komşuluktadır.'
    },
    en: {
      title: 'Left atrium • LA',
      description: 'The most posterior chamber receives pulmonary veins. Atrial muscle sleeves extend over the veins, with variable length and arrangement.',
      clinical: 'Pulmonary vein anatomy varies. The posterior wall lies near the esophagus, which is omitted from this schematic.'
    },
    source: `${la}; Ho et al., 2012, PDF p. 8`
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
      title: 'Koroner sinüs • CS',
      description: 'İnferior atriyoventriküler olukta yer alan ve kardiyak venöz kanı sağ atriyuma boşaltan geniş venöz kanaldır.',
      clinical: 'Ostiyumu Koch üçgeninin tabanını belirlemeye yardımcı olur. Sol ventrikül lead yerleşimi ve elektrofizyolojik haritalama için kritik giriş yoludur.'
    },
    en: {
      title: 'Coronary sinus • CS',
      description: 'A venous channel in the inferior atrioventricular groove that opens into the right atrium near the inferior caval opening.',
      clinical: 'Its ostium helps identify Koch’s triangle. The Thebesian valve and venous anatomy are variable; key conduit for CRT lead placement.'
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
  mitral: {
    tr: {
      title: 'Mitral kapak • Sol AV kapak',
      description: 'Sol atriyumu sol ventriküle bağlayan iki yaprakçıklı (anterior ve posterior) atriyoventriküler kapaktır.',
      clinical: 'Mitral anulusu ile sol inferior pulmoner ven arasındaki mitral istmus, atriyal fibrilasyon ablasyonunda önemli bir çizgidir.'
    },
    en: {
      title: 'Mitral valve • Left AV valve',
      description: 'Marks the left atrioventricular junction, connecting the left atrial vestibule to the ventricular inlet.',
      clinical: 'The mitral isthmus is an atrial region between the left inferior pulmonary vein orifice and mitral annulus; it is not a valve leaflet.'
    },
    source: 'Ho et al., 2012, PDF p. 7; mini atlas, PDF pp. 38–39'
  },
  tricuspid: {
    tr: {
      title: 'Triküspit kapak • Sağ AV kapak',
      description: 'Sağ atriyum ile sağ ventrikül arasındaki üç yaprakçıklı (anterior, posterior, septal) kapak aygıtıdır.',
      clinical: 'Septal yaprakçık insersiyonu Koch üçgeninin anterosüperior sınırını oluşturur. Pacemaker lead geçişlerinde kapak aparatusu incelenmelidir.'
    },
    en: {
      title: 'Tricuspid valve • Right AV valve',
      description: 'The right atrioventricular valve has septal, anterior and inferior leaflets with chordal attachments to the ventricular apparatus.',
      clinical: 'The septal hinge is a landmark for Koch’s triangle. Lead paths must be understood in relation to the valve and subvalvar apparatus.'
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
      title: 'Büyük kardiyak ven • GCV',
      description: 'Ön interventriküler olukta LAD ile birlikte ilerleyen ve koroner sinüsle devam eden ana venöz yapıdır.',
      clinical: 'Arter ağacıyla karıştırılmamalıdır. CRT lead yerleşiminde anterolateral venöz hedef sağlar.'
    },
    en: {
      title: 'Great cardiac vein • GCV',
      description: 'Ascends in the anterior interventricular groove alongside the LAD, then curves into the left AV groove to form the coronary sinus.',
      clinical: 'Key anatomical route for left ventricular epicardial pacing leads.'
    },
    source: 'Ho et al., 2012, PDF p. 3'
  },
  mcv: {
    tr: {
      title: 'Orta kardiyak ven • MCV',
      description: 'İnferior (posterior) interventriküler olukta PDA ile birlikte ilerleyen kardiyak vendir.',
      clinical: 'Koroner sinüs ostiyumuna yakın birleşir; inferior miyokardiyal venöz drenajı sağlar.'
    },
    en: {
      title: 'Middle cardiac vein • MCV',
      description: 'Courses in the posterior interventricular sulcus alongside the posterior descending artery to drain into the coronary sinus.',
      clinical: 'Provides venous access to the basal inferior LV and posterior septum.'
    },
    source: 'Coronary sinus and cardiac venous anatomy, PDF pp. 4–5'
  },
  'cardiac-veins': {
    tr: {
      title: 'Kardiyak venler ağı',
      description: 'Kalbin venöz drenaj ağı; koroner sinüs ve ona katılan ventriküler venlerden oluşur.',
      clinical: 'Dalların sayısı, çapı ve seyri kişiden kişiye yüksek değişkenlik gösterir.'
    },
    en: {
      title: 'Cardiac venous system',
      description: 'The cardiac venous network comprising tributary veins draining into the coronary sinus.',
      clinical: 'Individual branch topology and angulation vary significantly across patients.'
    },
    source: 'Coronary sinus and cardiac venous anatomy, PDF pp. 3–5'
  },
  pv: {
    tr: {
      title: 'Pulmoner venler',
      description: 'Akciğerlerden oksijenlenmiş kanı sol atriyumun posterior duvarına ileten dört ana vendir.',
      clinical: 'Ven ostiyumları etrafındaki miyokardiyal kılıflar atriyal fibrilasyon tetikleyicilerinin ana kaynağıdır.'
    },
    en: {
      title: 'Pulmonary veins',
      description: 'Typically four veins entering the posterior left atrium, carrying oxygenated blood from the lungs.',
      clinical: 'Myocardial sleeves at the veno-atrial junctions are the primary source of triggers for atrial fibrillation.'
    },
    source: 'Ho et al., 2012, PDF pp. 2–3'
  },
  om: {
    tr: {
      title: 'Obtüz marjinal dal • OM',
      description: 'LCX sisteminden ayrılarak sol ventrikülün serbest lateral duvarına uzanan marjinal arter dalıdır.',
      clinical: 'Sol ventrikül lateral duvar perfüzyonunu incelerken temel referans daldır.'
    },
    en: {
      title: 'Obtuse marginal branch • OM',
      description: 'Branch arising from the LCX artery coursing over the lateral obtuse margin of the left ventricle.',
      clinical: 'Key target in coronary revascularization for lateral LV perfusion.'
    },
    source: 'ACC/AHA coronary definitions, 2014'
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
      source: raw.source || ''
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
  angiography: {
    tr: {
      title: 'Koroner köken ve seyir',
      intro: 'Referans anatomi incelemesi. Kateter gösterilmez; anatomi oryantasyonu ve anjiyografik izdüşüm ilişkisini inceleyin.',
      steps: [
        { title: 'Aort kökü ve LM', text: 'LM sol koroner sinüs duvarından çıkar. Yaprakçık, sinüs duvarı ve ostiyum ayrı yapılardır.', landmark: 'lm' },
        { title: 'LM bifurkasyonu', text: 'Sol ana koroner arterin LAD ve LCX olarak ayrılmasını inceleyin; LAD ön interventriküler oluğa yönelir.', landmark: 'lad' },
        { title: 'LAD ile LCX ayrımı', text: 'LAD ventriküller arasında apekse iner; LCX sol atriyoventriküler olukta arkaya döner.', landmark: 'lcx' },
        { title: 'RCA seyri', text: 'RCA sağ koroner sinüsten sağ atriyoventriküler oluğa ilerler. Ana gövdeyi marjinal dallardan ayırın.', landmark: 'rca' }
      ]
    },
    en: {
      title: 'Coronary origins & courses',
      intro: 'Reference anatomical examination. No catheter engagement simulated; study spatial orientation under fluoroscopic projections.',
      steps: [
        { title: 'Aortic root & LM', text: 'The LM arises from the left sinus wall. Leaflet, sinus wall, and ostium are distinct structures.', landmark: 'lm' },
        { title: 'LM bifurcation', text: 'Examine the division of the left main into the LAD and LCX branches; LAD heads down the anterior groove.', landmark: 'lad' },
        { title: 'LAD & LCX pathways', text: 'LAD descends to the apex; LCX courses posteriorly along the left atrioventricular sulcus.', landmark: 'lcx' },
        { title: 'RCA trajectory', text: 'RCA travels from the right aortic sinus down the right atrioventricular groove.', landmark: 'rca' }
      ]
    }
  },
  ablation: {
    tr: {
      title: 'EP anatomi • Ablasyon nirengileri',
      intro: 'Kritik elektrofizyolojik anatomik bölgeleri tanıyın. İşaretleme enerji verilmesi veya lezyon simülasyonu değildir.',
      steps: [
        { title: 'Sağ atriyal nirengiler', text: 'Vena kava inferior orifisi ile triküspit kapak anulusunu bulun. Arasındaki kavotriküspit istmus ablasyon hedefidir.', landmark: 'ivc' },
        { title: 'Koch üçgeni', text: 'Üçgenin apeksinde AV düğüm bölgesini, tabanında koroner sinüs ağzını ayırt edin.', landmark: 'av' },
        { title: 'Pulmoner ven kılıfları', text: 'Posterior sol atriyuma dönün. Pulmoner venlerin etrafındaki atriyal miyokard kılıflarını inceleyin.', landmark: 'la' },
        { title: 'İleti fizyolojisi', text: 'Ablasyon kavramları anatomi yanında elektriksel haritalama gerektirir.', landmark: 'his' }
      ]
    },
    en: {
      title: 'EP anatomy • Ablation landmarks',
      intro: 'Identify key electrophysiological landmarks. Highlighting a region does not simulate energy delivery or lesion formation.',
      steps: [
        { title: 'Right atrial landmarks', text: 'Locate the inferior caval opening and tricuspid hinge framing the cavotricuspid isthmus.', landmark: 'ivc' },
        { title: 'Triangle of Koch', text: 'Identify the AV node near the apex and the coronary sinus opening at the base.', landmark: 'av' },
        { title: 'Pulmonary vein sleeves', text: 'Rotate to the posterior left atrium to observe myocardial sleeves around pulmonary veins.', landmark: 'la' },
        { title: 'Physiological correlation', text: 'Clinical ablation requires electrograms and electrical verification beyond static anatomy.', landmark: 'his' }
      ]
    }
  },
  pacemaker: {
    tr: {
      title: 'Pacing lead • Anatomi rehberi',
      intro: 'Referans anatomi eğitimi. Doğrulanmış bir kateter yolu veya fiksasyon simülasyonu içermez.',
      steps: [
        { title: 'Venöz giriş', text: 'Vena kava süperior sağ atriyuma açılır. Lead venöz yol boyunca ilerler.', landmark: 'svc' },
        { title: 'Kapak düzlemi', text: 'Sağ atriyum, triküspit kapak ve sağ ventrikül giriş ilişkisini gözlemleyin.', landmark: 'tricuspid' },
        { title: 'RV bölgeleri', text: 'Giriş yolu, apeks, septum ve çıkış yolunu (RVOT) ayırt edin.', landmark: 'rv' },
        { title: 'İleti sistemi pacing', text: 'His demeti ve sol dal alanı fizyolojik iletim için hedeflenen bölgelerdir.', landmark: 'his' }
      ]
    },
    en: {
      title: 'Pacing lead • Anatomy walkthrough',
      intro: 'Reference anatomical walkthrough. No validated lead trajectory or fixation simulation provided.',
      steps: [
        { title: 'Venous entry', text: 'The superior vena cava opens into the right atrium, providing primary transvenous access.', landmark: 'svc' },
        { title: 'Valve plane', text: 'Observe the spatial relationship between right atrium, tricuspid valve, and RV inlet.', landmark: 'tricuspid' },
        { title: 'RV regions', text: 'Distinguish RV inlet, apex, muscular septum, and outflow tract.', landmark: 'rv' },
        { title: 'Conduction pacing', text: 'The bundle of His and left bundle branch area serve as physiological pacing targets.', landmark: 'his' }
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
    referencesBtn: 'Kaynaklar ↗',
    workspaceEyebrow: 'ÇALIŞMA ALANI',
    workspaceTitle: 'Kalbin anatomisi.',
    workspaceMuted: 'Yapıyı keşfedin. İlişkileri anlayın.',
    modes: [
      ['anatomy', '01', 'Genel anatomi'],
      ['micro', '02', 'Mikroyapı'],
      ['angiography', '03', 'Anjiyografi'],
      ['ablation', '04', 'Ablasyon anatomisi'],
      ['pacemaker', '05', 'Pacemaker telleri']
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
    restoreWalls: 'Duvarları geri getir',
    carmTitle: 'C-ARM GANTRY',
    carmPill: 'ANJİOGRAFİ',
    obliqueLabel: 'OBLİK DÖNÜŞ (LAO / RAO)',
    angulationLabel: 'ANGÜLASYON (CRA / CAU)',
    carmPresetsTitle: 'STANDART PROJEKSİYONLAR',
    carmQuickTogglesTitle: 'HIZLI KATMAN KONTROLLERİ',
    fluoroBtn: 'Floroskopi Modu',
    resetBtn: 'Sıfırla',
    beatAnimate: '♡ Kalp atımı',
    beatPause: '♡ Atımı durdur',
    opacityLabel: 'Saydamlık',
    coronarySystemLabel: 'Koroner filtre',
    rootWindowLabel: 'Aort kökü penceresi',
    provenanceAtlas: 'ANATOMİK ATLAS / SEÇİLİ YAPI',
    provenanceSchematic: 'ŞEMATİK KAVRAM / 3D İLLÜSTRASYON',
    provenanceReference: 'REFERANS NOTU / KAYITLI MESH YOK',
    nextLandmark: 'Sonraki nirengi →',
    restartExploration: 'Yeniden başlat ↺',
    keyboardHelpTitle: 'Klavye Kısayolları',
    carmDragHint: 'Paneli serbestçe taşımak için sürükleyin'
  },
  en: {
    brandSubtitle: 'ANATOMY STUDIO',
    headerTitle: 'Interactive 3D Cardiac Atlas',
    shortcutsBtn: 'Shortcuts',
    referencesBtn: 'References ↗',
    workspaceEyebrow: 'YOUR WORKSPACE',
    workspaceTitle: 'Inside the heart.',
    workspaceMuted: 'Explore structure. Understand relationships.',
    modes: [
      ['anatomy', '01', 'Gross anatomy'],
      ['micro', '02', 'Microstructure'],
      ['angiography', '03', 'Angiography'],
      ['ablation', '04', 'Ablation anatomy'],
      ['pacemaker', '05', 'Pacemaker leads']
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
    restoreWalls: 'Restore wall windows',
    carmTitle: 'C-ARM GANTRY',
    carmPill: 'ANGIOGRAPHY',
    obliqueLabel: 'OBLIQUE ROTATION (LAO / RAO)',
    angulationLabel: 'ANGULATION (CRA / CAU)',
    carmPresetsTitle: 'STANDARD PROJECTIONS',
    carmQuickTogglesTitle: 'QUICK LAYER TOGGLES',
    fluoroBtn: 'Fluoroscopy Mode',
    resetBtn: 'Reset view',
    beatAnimate: '♡ Animate beat',
    beatPause: '♡ Pause beat',
    opacityLabel: 'Opacity',
    coronarySystemLabel: 'Coronary system',
    rootWindowLabel: 'Aortic root viewing cut',
    provenanceAtlas: 'ATLAS / SELECTED STRUCTURE',
    provenanceSchematic: 'SCHEMATIC CONCEPT / 3D ILLUSTRATION',
    provenanceReference: 'REFERENCE NOTE / NO REGISTERED MESH',
    nextLandmark: 'Next landmark →',
    restartExploration: 'Restart exploration ↺',
    keyboardHelpTitle: 'Keyboard Shortcuts',
    carmDragHint: 'Drag to freely reposition panel'
  }
};

export function getTranslation(key) {
  const dict = uiTranslations[currentLang] || uiTranslations.tr;
  return dict[key] ?? uiTranslations.tr[key] ?? key;
}


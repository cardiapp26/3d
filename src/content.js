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
  amc: {
    tr: {
      title: 'Aorto-mitral devamlılık • AMC',
      description: 'AMC, mitral anulusun anteromedial yüzünün aort kapağına doğru devamı olarak tanımlanır. Mitral ön yaprakçık ile sol ve nonkoroner aortik yaprakçıklar arasındaki fibröz perdedir (aorto-mitral perde).',
      clinical: 'AMC bölgesi bazı ventriküler aritmilerin ve aort-mitral bileşke taşikardilerinin kaynağıdır; kapak cerrahisi ve perkütan girişimlerde (TAVI, mitral tamir) kritik komşuluktur. Şematik gösterim.'
    },
    en: {
      title: 'Aorto-mitral continuity • AMC',
      description: 'The AMC is defined as the continuation of the anteromedial aspect of the mitral annulus to the aortic valve: the fibrous curtain between the anterior mitral leaflet and the left and non-coronary aortic leaflets.',
      clinical: 'The AMC can harbor ventricular arrhythmias and junctional tachycardias; it is a critical neighborhood in valve surgery and percutaneous interventions (TAVI, mitral repair). Schematic illustration.'
    },
    source: 'Ho et al., valve anatomy reviews; schematic'
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
          text: 'IVC alt kenarı ile triküspit kapak anulusu arasındaki isthmus hattı, tipik saat-yönü-tersi atriyal flatter devresinin zorunlu geçididir. Radyofrekans lezyon hattı ile çift yönlü iletim bloku hedeflenir.',
          landmark: 'ivc',
          view: 'lao'
        },
        {
          title: 'Koch Üçgeni ve Yavaş Yol • AVNRT',
          text: 'Todaro tendonu, triküspit septal menteşesi ve koroner sinüs (CS) ostiyumu Koch üçgenini sınırlar. Apeksinde kompakt AV düğüm (kalıcı blok riski), CS ağzı tabanında ise güvenli Yavaş Yol (Slow Pathway) ablasyon hedefi yer alır.',
          landmark: 'av',
          view: 'rao'
        },
        {
          title: 'Pulmoner Ven İzolasyonu (WACA / PVI) • AF',
          text: 'Atriyal fibrilasyon tetikleyicilerini izole etmek için sol atriyum posterior duvarında sol ve sağ pulmoner ven çiftleri geniş çevresel halkalarla (WACA) elektriksel olarak izole edilir. Özofagus ve frenik sinir komşuluklarına dikkat edilir.',
          landmark: 'la',
          view: 'posterior'
        },
        {
          title: 'Kombine EP Haritası & Lineer Hatlar',
          text: 'Atriyal çatı hattı (roof line), mitral istmus ve koroner sinüs ilişkileri. Kompleks atriyal taşikardilerde anatomik engeller (crista terminalis, fossa ovalis, venöz ostiyumlar) iletim bariyeri oluşturur.',
          landmark: 'his',
          view: 'root'
        }
      ]
    },
    en: {
      title: 'Electrophysiology (EP) • Ablation targets',
      intro: 'Anatomical basis of arrhythmia substrates: Cavotricuspid isthmus, Triangle of Koch, and pulmonary vein antral isolation.',
      steps: [
        {
          title: 'Cavotricuspid Isthmus (CTI) • Atrial Flutter',
          text: 'The isthmus between the inferior caval orifice and the tricuspid valve annulus forms the obligatory slow conduction corridor of counterclockwise atrial flutter. A contiguous linear RF lesion achieves bidirectional block.',
          landmark: 'ivc',
          view: 'lao'
        },
        {
          title: 'Triangle of Koch & Slow Pathway • AVNRT',
          text: 'Bounded by the Tendon of Todaro, septal tricuspid hinge, and CS ostium. The apex hosts the compact AV node (danger of heart block); the inferior base near the CS ostium is the target for slow-pathway modulation.',
          landmark: 'av',
          view: 'rao'
        },
        {
          title: 'Wide Area Circumferential Ablation (WACA) • AF',
          text: 'Circumferential antral lesion sets around ipsilateral pulmonary vein pairs in the posterior left atrium disconnect arrhythmogenic pulmonary vein triggers, with vigilance for the retrocardiac esophagus and phrenic nerve.',
          landmark: 'la',
          view: 'posterior'
        },
        {
          title: 'Comprehensive EP Substrate & Linear Sets',
          text: 'Integrated view of roof lines, mitral isthmus, and coronary sinus connections. Natural anatomic barriers (crista terminalis, oval fossa, venous orifices) channel reentrant circuits.',
          landmark: 'his',
          view: 'root'
        }
      ]
    }
  },
  pacemaker: {
    tr: {
      title: 'Kardiyak implante edilebilir elektronik cihazlar (CIED)',
      intro: 'Transvenöz pacing telleri ve fizyolojik ileti sistemi uyarımı (CSP/LBBAP ve CRT). İlerleme çubuğunu kaydırarak lead ilerletilmesini gözlemleyin.',
      steps: [
        {
          title: 'Sağ Atriyal (RA) Lead • Apendiks Fiksasyonu',
          text: 'Subklavyan/sefalik venöz girişten SVC yoluyla sağ atriyuma ulaşır. Aktif fiksasyonlu vida ucu (helix) pektinat kasların zengin olduğu sağ atriyal apendikse (RAA) veya lateral duvara tutturulur.',
          landmark: 'ra',
          view: 'anterior'
        },
        {
          title: 'Sağ Ventrikül (RV) Septal Lead',
          text: 'Triküspit kapağı geçerek sağ ventriküle ilerler. Apikal perforasyon ve dissenkroni riskini azaltmak için elektrot interventriküler septumun orta/apikal yüzeyine hedeflenir.',
          landmark: 'rv',
          view: 'lao'
        },
        {
          title: 'Fizyolojik İleti Sistemi Pacing (CSP / LBBAP)',
          text: 'Membranöz septum ve His demeti düzeyinden interventriküler septuma derin vidalanarak sol dalı (LBB) doğrudan uyarır. Doğal Purkinje ağını aktive ederek dar QRS ve fizyolojik ventrikül senkronizasyonu sağlar.',
          landmark: 'his',
          view: 'rao'
        },
        {
          title: 'Sol Ventrikül CRT Lead • Koroner Sinüs',
          text: 'Kardiyak Resenkronizasyon Tedavisi (CRT) için koroner sinüs (CS) ostiyumundan girilerek büyük kardiyak ven üzerinden sol ventrikül lateral/posterolateral serbest duvar venine kuadripolar lead yerleştirilir.',
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
          text: 'Traverses the tricuspid valve into the RV. The mid-interventricular septum is preferred over the thin apex to minimize perforation risk and decrease pacing-induced electromechanical dyssynchrony.',
          landmark: 'rv',
          view: 'lao'
        },
        {
          title: 'Conduction System Pacing (CSP / LBBAP)',
          text: 'Screws deeply into the basal interventricular septum to recruit the Left Bundle Branch directly. Bypasses proximal conduction blocks, recruiting the intrinsic Purkinje network for a narrow, physiological QRS.',
          landmark: 'his',
          view: 'rao'
        },
        {
          title: 'Left Ventricular CRT Lead • Coronary Sinus',
          text: 'In Cardiac Resynchronization Therapy (CRT), a quadripolar lead cannulates the Coronary Sinus ostium, advancing into a posterolateral cardiac vein along the LV free wall to restore biventricular synchrony.',
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
          text: 'Transseptal sistem SVC\'den geriye çekilirken iğne ucu iki "atlama" (aorta, limbus) sonrası fossa ovalise oturur ve membranı çadırlaştırır (tenting). Floroskopik işaret kateterleri: aort köküne retrograd yerleştirilen mavi pigtail kateter nonkoroner cuspa (NCC) oturur ve aort kökünü işaretler; iğne her zaman pigtailin posteroinferiorunda kalmalıdır. Koyu mavi dekapolar CS kateteri koroner sinüs boyunca uzanır ve AV oluğu (septumun alt sınırını) gösterir. Cusp halkaları: yeşil = LCC, turuncu = RCC, camgöbeği = NCC (pigtail yuvası). Açılar: LAO 45° septumu en face gösterir; RAO 30° tanjansiyel değerlendirir. Kırmızı işaretler tehlike bölgeleri: aort kökü ve posterior LA duvarı.',
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
          text: 'As the transseptal system is withdrawn from the SVC, the needle tip drops over two "jumps" (aortic mound, limbus) onto the fossa ovalis and tents the membrane. Fluoroscopic landmark catheters: a blue retrograde pigtail seats in the non-coronary cusp (NCC), marking the aortic root; the needle must always stay posteroinferior to the pigtail. The dark-blue decapolar CS catheter lines the coronary sinus, outlining the AV groove (inferior septal border). Cusp rings: green = LCC, orange = RCC, cyan = NCC (pigtail seat). Angles: LAO 45° shows the septum en face; RAO 30° profiles it tangentially. Red markers flag danger zones: the aortic root and the posterior LA wall.',
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
      ['pacemaker', '05', 'Pacemaker telleri'],
      ['transseptal', '06', 'Transseptal & septostomi'],
      ['bachmann', '07', 'Bachmann demeti & pacing']
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
    carmDragHint: 'Paneli serbestçe taşımak için sürükleyin',
    leadProgressLabel: 'Lead ilerletme / Yerleşim',
    leadProgressNote: '3D transvenöz lead modelleri ve fizyolojik ileti sistemi (CSP/LBBAP) hedefleri eğitim amaçlı modellenmiştir.'
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
      ['pacemaker', '05', 'Pacemaker leads'],
      ['transseptal', '06', 'Transseptal & septostomy'],
      ['bachmann', '07', 'Bachmann bundle & pacing']
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
    carmDragHint: 'Drag to freely reposition panel',
    leadProgressLabel: 'Lead advancement / Placement',
    leadProgressNote: '3D transvenous lead models and physiological conduction system pacing (CSP/LBBAP) targets are modeled for clinical education.'
  }
};

export function getTranslation(key) {
  const dict = uiTranslations[currentLang] || uiTranslations.tr;
  return dict[key] ?? uiTranslations.tr[key] ?? key;
}

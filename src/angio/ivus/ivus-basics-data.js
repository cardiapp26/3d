// Texts of the IVUS basics workspace (ivus-basics.js): how sound becomes an image, the two
// catheter systems, the grey-scale vocabulary with the adventitia as reference, reading a normal
// vessel from inside out, and the examination workflow. Summarised in our own words from the
// teaching sources listed in BASICS_SOURCES.

const L = (tr, en) => ({ tr, en });

export const BASICS_TEXT = {
  kicker: L('IVUS TEMELLERİ · SESTEN GÖRÜNTÜYE', 'IVUS BASICS · FROM SOUND TO IMAGE'),
  intro: L('IVUS, damar içinden gönderilen yüksek frekanslı sesin dokulardan dönen ekosuyla 360° kesit çizer. Anjiyografi lümenin yalnız 2B gölgesini verir; IVUS lümeni ve damar duvarını birlikte gösterir.',
    'IVUS draws a 360° cross-section from high-frequency sound sent from inside the vessel and the echoes that tissues return. Angiography gives only a 2D silhouette of the lumen; IVUS shows the lumen and the vessel wall together.'),
  frameTitle: L('Etkileşimli IVUS karesi', 'Interactive IVUS frame'),
  frameHint: L('Kareye tıkla: yapı, adventisyaya göre eko ve saat konumu yazılır. Okuma adımları içten dışa ilerler.', 'Click the frame: the structure, its echo against the adventitia and its clock position appear. The reading steps go from inside out.'),
  system: L('Sistem', 'System'), preset: L('Kare', 'Frame'), clock: L('Saat kadranı', 'Clock face'), sweep: L('Görüntünün oluşumu', 'Image formation'),
  steps: L('İçten dışa okuma', 'Read from inside out'), prev: L('Önceki', 'Previous'), next: L('Sonraki', 'Next'), reset: L('Temizle', 'Clear'),
  probe: L('Seçilen nokta', 'Probed point'), probeEmpty: L('Karede bir noktaya tıkla.', 'Click a point on the frame.'),
  aline: L('A-hattı: bu ışın boyunca dönen eko', 'A-line: the echo returning along this beam'), depth: L('derinlik (mm)', 'depth (mm)'),
  measures: L('Ölçümler', 'Measurements'), lumenArea: L('Lümen alanı', 'Lumen area'), eemArea: L('EEM alanı', 'EEM area'), burden: L('Plak + media yükü', 'Plaque + media burden'),
  eelDiam: L('EEM çapı (EEL–EEL)', 'EEM diameter (EEL to EEL)'), midDiam: L('Media ortası–media ortası', 'Mid-media to mid-media'),
  eelNote: L('EEL’i (media’nın dış sınırı) bul; IEL lümene, EEL adventisyaya bakar. Standart sistemlerde media’dan media’ya ölçmek yaklaşık aynı sonucu verir; fark stent seçimi için önemsizdir.', 'Find the EEL (the outer edge of the media); the IEL faces the lumen, the EEL the adventitia. On standard systems, measuring media to media gives almost the same result; the difference does not matter for stent sizing.'),
  clockAt: L('saat', "o'clock"),
  systemsTitle: L('İki IVUS sistemi', 'The two IVUS systems'),
  grayTitle: L('IVUS dili: gri ton', 'The IVUS language: grey scale'),
  grayLead: L('Parlaklığı adventisyaya göre söyle: daha koyusu hipoekoik veya anekoik, daha parlağı hiperekoik. Arkasında gölge bırakan parlak yapı kalsiyum veya metaldir.', 'Describe brightness against the adventitia: darker is hypoechoic or anechoic, brighter is hyperechoic. A bright structure that casts a shadow behind it is calcium or metal.'),
  workflowTitle: L('İnceleme akışı', 'Examination workflow'),
  sources: L('Kaynaklar', 'Sources')
};

export const BASICS_SYSTEMS = [
  { id: 'rotational-60', label: L('Rotasyonel 60 MHz (HD)', 'Rotational 60 MHz (HD)') },
  { id: 'rotational-40', label: L('Rotasyonel 40 MHz', 'Rotational 40 MHz') },
  { id: 'phased-20', label: L('Faz dizili 20 MHz', 'Phased array 20 MHz') }
];

export const BASICS_PRESETS = [
  { id: 'normal', label: L('Normal koroner', 'Normal coronary') },
  { id: 'fibrous', label: L('Fibröz plak, saat 2–6', 'Fibrous plaque, 2 to 6 o’clock') },
  { id: 'calcium', label: L('Yüzeyel kalsiyum ve gölge', 'Superficial calcium and shadow') },
  { id: 'mixed', label: L('Karışık (fibrolipid) plak', 'Mixed (fibrofatty) plaque') },
  { id: 'nodule', label: L('Kalsifik nodül', 'Calcified nodule') },
  { id: 'attenuated', label: L('Atenüe plak', 'Attenuated plaque') },
  { id: 'thrombus', label: L('Trombüs', 'Thrombus') },
  { id: 'hematoma', label: L('İntramural hematom', 'Intramural hematoma') },
  { id: 'dissection', label: L('Diseksiyon: gerçek ve yalancı lümen', 'Dissection: true and false lumen') },
  { id: 'stent', label: L('Stent: apoze ve malapoze strutlar', 'Stent: apposed and malapposed struts') },
  { id: 'sidebranch', label: L('Yan dal', 'Side branch') },
  { id: 'nurd', label: L('NURD artefaktı', 'NURD artifact') }
];

/** Structures: name and what to say about them. */
export const STRUCTURES = {
  catheter: L('IVUS kateteri: siyah daire. Tel yönlendirmesi nedeniyle damarın ortasında ya da kenarında durabilir.', 'IVUS catheter: a black circle. Wire bias may put it in the middle of the vessel or against one side.'),
  ringdown: L('Ring-down: kateterin hemen çevresindeki parlak halka (yakın alan artefaktı); faz dizili sistemde daha kalındır.', 'Ring-down: the bright halo right around the catheter (a near-field artifact); thicker on phased array.'),
  wire: L('Kılavuz tel: çok parlak nokta, arkasında siyah gölge. Rotasyonel kateterde tel transdüserin önünde dışarı çıktığı için görülür.', 'Guidewire: a very bright spot with a black shadow behind it. On rotational catheters the wire exits in front of the transducer, so it shows.'),
  wireShadow: L('Tel gölgesi: tel sesi geçirmez, arkasındaki duvar okunamaz.', 'Wire shadow: the wire blocks sound, so the wall behind it cannot be read.'),
  lumen: L('Lümen: hareketli kan benekleri (eritrositler). Frekans arttıkça kan daha parlak görünür.', 'Lumen: moving blood speckle (red cells). Blood looks brighter at higher frequency.'),
  intima: L('İntima: en içteki ince, parlak çizgi; normalde zor seçilir.', 'Intima: the thin, bright innermost line; often hard to see in a normal vessel.'),
  media: L('Media: koyu (hipoekoik) bant; IEL ile EEL arasında kalır.', 'Media: a dark (hypoechoic) band between the IEL and the EEL.'),
  adventitia: L('Adventisya: dıştaki parlak halka; parlaklık referansıdır.', 'Adventitia: the bright outer ring; the brightness reference.'),
  periadventitia: L('Periadventisyal doku: yağ ve bağ dokusu, giderek sönen benekler.', 'Periadventitial tissue: fat and connective tissue, speckle fading with depth.'),
  fibrous: L('Fibröz plak: adventisya kadar ya da daha parlak (hiperekoik), arkasında gölge yok.', 'Fibrous plaque: as bright as the adventitia or brighter (hyperechoic), no shadow behind it.'),
  lipid: L('Lipidden zengin alan: adventisyadan koyu (hipoekoik).', 'Lipid-rich area: darker than the adventitia (hypoechoic).'),
  calcium: L('Kalsiyum: çok parlak ön kenar ve arkasında akustik gölge; arkası ölçülemez.', 'Calcium: a very bright leading edge with an acoustic shadow behind it; what lies behind cannot be measured.'),
  calciumShadow: L('Akustik gölge: ses kalsiyumu, metali ya da nodülü geçemez; bu siyahlık doku değil, sinyal yokluğudur.', 'Acoustic shadow: sound cannot pass calcium, metal or a nodule; this black is no signal, not tissue.'),
  reverberation: L('Reverberasyon: ses kalsiyum ile transdüser arasında gidip gelir, kalsiyumun arkasında eşit aralıklı parlak yaylar çizer. Yoğun, yüzeyel kalsiyumu düşündürür.', 'Reverberation: sound bounces between the calcium and the transducer and draws evenly spaced bright arcs behind the calcium. It suggests dense, superficial calcium.'),
  nodule: L('Kalsifik nodül: lümene çıkıntı yapan, düzensiz yüzeyli parlak kalsiyum; arkası gölgeli. Yüzeyinde trombüs olabilir, stentin tam açılmasını kısıtlayabilir.', 'Calcified nodule: bright calcium with an irregular surface bulging into the lumen, shadow behind it. Thrombus may sit on its surface; it can limit stent expansion.'),
  attenuated: L('Atenüe plak: yüzeyde parlak kenar olmadan, içinde sinyalin giderek kaybolduğu hipoekoik plak. Lipidden zengin nekrotik çekirdeği düşündürür; PKG’de distal embolizasyon ve no-reflow riski artar.', 'Attenuated plaque: a hypoechoic plaque in which the signal fades without a bright leading edge. It suggests a lipid-rich necrotic core; distal embolization and no-reflow are more likely during PCI.'),
  attenuation: L('Atenüasyon: sinyal, kalsiyumdaki gibi parlak bir ön kenar olmadan yavaşça söner; bu onu kalsiyum gölgesinden ayırır.', 'Attenuation: the signal fades slowly without the bright leading edge of calcium; that is how it differs from a calcium shadow.'),
  thrombus: L('Trombüs: lümen içinde loblu, kenarı düzensiz, benekli kitle; kandan biraz daha ekojen, adventisyadan koyu. Akış ve klinikle birlikte yorumla.', 'Thrombus: a lobulated, irregular, speckled mass inside the lumen; a little more echogenic than blood, darker than the adventitia. Interpret together with flow and the clinical picture.'),
  hematoma: L('İntramural hematom: duvar içinde hilal biçimli, homojen alan; lümeni içten iter ve daraltır. Diseksiyonun ilerlemesiyle oluşabilir.', 'Intramural hematoma: a homogeneous crescent within the wall that pushes the lumen inward and narrows it. It can follow a propagating dissection.'),
  flap: L('Diseksiyon flebi: lümen içinde serbest duran ince, parlak çizgi (yırtılmış intima ve plak).', 'Dissection flap: a thin bright line hanging free in the lumen (torn intima and plaque).'),
  trueLumen: L('Gerçek lümen: çevresinde üç katmanlı duvar seçilen lümen; kateter normalde buradadır ve yan dallar bu lümenden çıkar.', 'True lumen: the lumen surrounded by the three-layered wall; the catheter normally sits here and side branches leave from it.'),
  falseLumen: L('Yalancı lümen: flep ile media arasında, duvar katmanları olmayan kan dolu alan.', 'False lumen: a blood-filled space between the flap and the media, without the wall layers around it.'),
  strut: L('Apoze stent strutu: duvara yaslanmış kısa, parlak yay; arkasında küçük gölge.', 'Apposed stent strut: a short bright arc against the wall with a small shadow behind it.'),
  malapposedStrut: L('Malapoze strut: strut ile damar duvarı arasında kan var, strut duvara değmiyor. Büyük damarlarda ve proksimal kenarda aranır.', 'Malapposed strut: blood lies between the strut and the wall; the strut does not touch it. Look for it in large vessels and at the proximal edge.'),
  sideBranch: L('Yan dal: duvarda boşluk ve dışarı açılan ikinci lümen; o yayda duvar katmanları kesintiye uğrar.', 'Side branch: a gap in the wall and a second lumen opening outward; the wall layers stop over that arc.'),
  nurd: L('NURD: kateter şaftı takılıp sonra hızlanınca bir sektör gerilir ve yana bulanıklaşır. Yalnız rotasyonel sistemde görülür.', 'NURD: the catheter shaft sticks and then whips, so one sector is stretched and smeared sideways. Seen only on rotational systems.')
};
export const STRUCTURE_NAMES = {
  catheter: L('Kateter', 'Catheter'), ringdown: L('Ring-down', 'Ring-down'), wire: L('Kılavuz tel', 'Guidewire'), wireShadow: L('Tel gölgesi', 'Wire shadow'),
  lumen: L('Lümen (kan)', 'Lumen (blood)'), intima: L('İntima', 'Intima'), media: L('Media', 'Media'), adventitia: L('Adventisya', 'Adventitia'),
  periadventitia: L('Periadventisya', 'Periadventitia'), fibrous: L('Fibröz plak', 'Fibrous plaque'), lipid: L('Lipidden zengin plak', 'Lipid-rich plaque'),
  calcium: L('Kalsiyum', 'Calcium'), calciumShadow: L('Akustik gölge', 'Acoustic shadow'),
  reverberation: L('Reverberasyon', 'Reverberation'), nodule: L('Kalsifik nodül', 'Calcified nodule'), attenuated: L('Atenüe plak', 'Attenuated plaque'),
  attenuation: L('Atenüasyon', 'Attenuation'), thrombus: L('Trombüs', 'Thrombus'), hematoma: L('İntramural hematom', 'Intramural hematoma'),
  flap: L('Diseksiyon flebi', 'Dissection flap'), trueLumen: L('Gerçek lümen', 'True lumen'), falseLumen: L('Yalancı lümen', 'False lumen'),
  strut: L('Apoze strut', 'Apposed strut'), malapposedStrut: L('Malapoze strut', 'Malapposed strut'), sideBranch: L('Yan dal', 'Side branch'), nurd: L('NURD', 'NURD')
};

/** Grey-scale categories with their IVUS examples. */
export const ECHO_CATEGORIES = [
  { id: 'anechoic', swatch: '#050505', name: L('Anekoik', 'Anechoic'), text: L('Eko yok ya da çok az: siyah. Sıvı veya lipidden zengin alanlar; kan ise hareketli benekler nedeniyle koyu gri görünebilir.', 'Little or no echo: black. Fluid or lipid-rich areas; blood may look dark grey because of moving red cells.') },
  { id: 'hypoechoic', swatch: '#3a3a3a', name: L('Hipoekoik', 'Hypoechoic'), text: L('Adventisyadan koyu gri, ama eko var. Örnek: media, lipidden zengin (yumuşak) plak.', 'Darker grey than the adventitia, but echoes are present. Example: the media, lipid-rich (soft) plaque.') },
  { id: 'hyperechoic', swatch: '#d9d9d9', name: L('Hiperekoik', 'Hyperechoic'), text: L('Güçlü eko: parlak beyaz. Örnek: fibröz plak.', 'Strong echo: bright white. Example: fibrous plaque.') },
  { id: 'shadowed', swatch: 'linear-gradient(90deg,#fff 0 30%,#000 30%)', name: L('Gölgeli hiperekoik', 'Hyperechoic with shadow'), text: L('Çok parlak, arkasında siyah akustik gölge. Koronerde kalsiyum veya metal (stent strutu, tel).', 'Very bright with a black acoustic shadow behind it. In coronaries: calcium or metal (stent struts, wires).') },
  { id: 'mixed', swatch: 'repeating-linear-gradient(90deg,#d9d9d9 0 6px,#3a3a3a 6px 12px)', name: L('Karışık', 'Mixed'), text: L('Anekoik, hipoekoik ve hiperekoik alanlar bir arada. Örnek: fibrolipid veya fibrokalsifik plak.', 'Anechoic, hypoechoic and hyperechoic areas together. Example: fibrofatty or fibrocalcific plaque.') }
];
export const ECHO_LABEL = {
  anechoic: L('anekoik', 'anechoic'), hypoechoic: L('hipoekoik (adventisyadan koyu)', 'hypoechoic (darker than adventitia)'), hyperechoic: L('hiperekoik (adventisyadan parlak ya da eşit)', 'hyperechoic (as bright as or brighter than adventitia)'),
  shadowed: L('gölgeli hiperekoik', 'hyperechoic with shadow'), mixed: L('karışık', 'mixed'), reference: L('parlaklık referansı', 'brightness reference'),
  blood: L('kan beneği (anekoik zeminde)', 'blood speckle (on an anechoic background)'), shadow: L('sinyal yok (gölge)', 'no signal (shadow)'), artifact: L('artefakt', 'artifact')
};

/** Reading order from inside out. */
export const READING_STEPS = [
  { id: 'catheter', label: L('Kateter', 'Catheter') },
  { id: 'wire', label: L('Tel', 'Wire'), rotationalOnly: true },
  { id: 'lumen', label: L('Lümen ve kan', 'Lumen and blood') },
  { id: 'intima', label: L('İntima', 'Intima') },
  { id: 'media', label: L('Media', 'Media') },
  { id: 'adventitia', label: L('Adventisya', 'Adventitia') },
  { id: 'eel', label: L('EEL ve ölçüm', 'EEL and measurement') }
];

/** Rotational (mechanical) against phased array (solid state). */
export const SYSTEM_ROWS = [
  [L('Transdüser', 'Transducer'), L('Tek kristal, fiziksel olarak döner (sürücü şaft)', 'One crystal that physically rotates (drive shaft)'), L('360° dizili çok sayıda sabit eleman, elektronik anahtarlama', 'Many stationary elements around 360°, switched electronically')],
  [L('Frekans', 'Frequency'), L('40–60 MHz', '40–60 MHz'), L('20 MHz', '20 MHz')],
  [L('Çözünürlük / penetrasyon', 'Resolution / penetration'), L('Daha yüksek çözünürlük, daha az penetrasyon', 'Higher resolution, less penetration'), L('Daha düşük çözünürlük, daha derin penetrasyon', 'Lower resolution, deeper penetration')],
  [L('Monoray ve tel', 'Monorail and wire'), L('Kısa monoray; tel transdüserin distalinden çıkar, tel artefaktı görülür', 'Short monorail; the wire exits distal to the transducer, so a wire artifact shows'), L('Uzun monoray; tel transdüserin proksimalinden çıkar, tel artefaktı yok', 'Long monorail; the wire exits proximal to the transducer, no wire artifact')],
  [L('Hazırlık', 'Preparation'), L('Havayı çıkarmak için dikkatli flush; motor sürücü ünitesine (MDU) takılır, tık sesi duyulur; çalışırken döner sesi gelir', 'Careful flushing to remove air; connected to the motor drive unit (MDU) with a click; it whirs while running'), L('Tak ve çalıştır: flush ve MDU gerekmez', 'Plug and play: no flushing, no MDU')],
  [L('Pullback', 'Pullback'), L('Otomatik pullback önerilir; longitudinal görünüm ve lezyon uzunluğu ölçümü için gerekir', 'Automatic pullback recommended; needed for the longitudinal view and lesion length'), L('Manuel pullback; longitudinal görünüm olur ama uzunluk ölçülemez (anjiyografi koregistrasyonu yoksa)', 'Manual pullback; a longitudinal view is possible, but length cannot be measured (unless co-registered with angiography)')],
  [L('Tipik artefakt', 'Typical artifact'), L('Tel gölgesi, NURD (düzensiz dönme)', 'Wire shadow, NURD (non-uniform rotation)'), L('Belirgin ring-down halkası; NURD yok', 'Prominent ring-down halo; no NURD')]
];

export const WORKFLOW = [
  { title: L('Hazırlık', 'Preparation'), text: L('Kateter hazırlığı, kılavuz tel, antikoagülasyon ve intrakoroner nitrogliserin: her PKG’deki gibi. Nitrogliserin spazmı önler, damar boyutu doğru ölçülür.', 'Catheter preparation, guidewire, anticoagulation and intracoronary nitroglycerin, as in any PCI. Nitroglycerin prevents spasm so the vessel size is measured correctly.') },
  { title: L('Üç çekim', 'Three runs'), text: L('PKG öncesi lezyonu değerlendirip planlamak, PKG sırasında ilerlemeyi ve sonraki adımı görmek, PKG sonrası sonucu değerlendirmek için.', 'Before PCI to assess the lesion and plan, during PCI to review progress and the next step, after PCI to assess the result.') },
  { title: L('Başlangıç noktası', 'Starting point'), text: L('Pullback’e lezyonun veya stentin 10–20 mm distalinden başla.', 'Start the pullback 10–20 mm distal to the lesion or the stent.') },
  { title: L('Aorto-ostiyal lezyon', 'Aorto-ostial lesion'), text: L('Sol ana veya RCA ostiyumu için kılavuz kateteri ağızdan geri çek (disengage); yoksa ostiyum kateterin içinde kalır.', 'For the left main or RCA ostium, disengage the guide catheter; otherwise the ostium stays inside the catheter.') },
  { title: L('Ekran', 'Screen'), text: L('Ortada kesit, altta ya da yanda longitudinal görünüm, kenarda ölçümler. Yerleşim sisteme göre değişir; temel kavramlar aynıdır.', 'Cross-section in the middle, longitudinal view below or beside it, measurements at the side. The layout varies by system; the core concepts are the same.') }
];

export const BASICS_SOURCES = [
  { text: 'Sayed A. IVUS Masterclass, Module 1: IVUS Basics (video, 2026)', url: 'https://www.youtube.com/watch?v=fZg_tstX_Tc' },
  { text: 'Mintz GS et al. ACC Clinical Expert Consensus Document on IVUS. J Am Coll Cardiol 2001;37:1478-92', url: 'https://doi.org/10.1016/S0735-1097(01)01175-5' },
  { text: 'Räber L et al. Clinical use of intracoronary imaging, Part 1 (EAPCI consensus). EuroIntervention 2018;14:656-77', url: 'https://doi.org/10.4244/EIJY18M06_01' }
];

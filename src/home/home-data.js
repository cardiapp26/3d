// Cardia welcome page content: module cards grouped by domain, principles and questions.
// Plain data (no DOM) so Node tests can check links, thumbnails and wording.

const w = (tr, en) => Object.freeze({ tr, en });

/** Card tones (CSS classes in home.css). */
export const TONES = Object.freeze(['sand', 'moss', 'slate', 'rose', 'amber']);

/** Domains in display order; each card names its domain. */
export const DOMAINS = Object.freeze([
  { id: 'anatomy', tone: 'sand', label: w('Anatomi ve muayene', 'Anatomy and examination') },
  { id: 'cath', tone: 'moss', label: w('Kateter laboratuvarı ve hemodinami', 'Cath lab and hemodynamics') },
  { id: 'imaging', tone: 'slate', label: w('Görüntüleme ve damar içi', 'Imaging and intravascular') },
  { id: 'rhythm', tone: 'rose', label: w('Ritim ve elektrofizyoloji', 'Rhythm and electrophysiology') },
  { id: 'drugs', tone: 'amber', label: w('Farmakoloji', 'Pharmacology') }
]);

/**
 * Module cards. `path` is root-relative (the welcome page is the site root); `thumb` is the
 * file name in src/home/thumbs; `badge` is optional ('new' or '3d').
 */
export const HOME_MODULES = Object.freeze([
  {
    id: 'anatomy', domain: 'anatomy', path: './#/mode/anatomy', thumb: 'anatomy', badge: '3d',
    kicker: w('3B kalp atlası', '3D heart atlas'),
    name: w('3B Anatomi', '3D Anatomy'),
    points: [w('Odacıklar, kapaklar, koroner ağaç', 'Chambers, valves, coronary tree'), w('Kalp atımı, akım ve Wiggers', 'Heartbeat, flow and Wiggers'), w('Septal defektler ve kesitler', 'Septal defects and sections')]
  },
  {
    id: 'exam', domain: 'anatomy', path: './exam/', thumb: 'exam', badge: '3d',
    kicker: w('Yatak başı muayene', 'Bedside examination'),
    name: w('Fizik Muayene', 'Physical Exam'),
    points: [w('Oskültasyon odakları ve üfürümler', 'Auscultation points and murmurs'), w('JVP, nabızlar ve manevralar', 'JVP, pulses and maneuvers')]
  },
  {
    id: 'hemo', domain: 'cath', path: './hemo/', thumb: 'hemo', badge: '3d',
    kicker: w('Sağ ve sol kalp kateterizasyonu', 'Right and left heart catheterization'),
    name: w('Hemodinami', 'Hemodynamics'),
    points: [w('Basınç eğrileri ve oksimetri', 'Pressure waveforms and oximetry'), w('Basınç-hacim döngüsü', 'Pressure-volume loop')]
  },
  {
    id: 'angio', domain: 'cath', path: './angio/', thumb: 'angio',
    kicker: w('C-kol stüdyosu', 'C-arm studio'),
    name: w('Koroner Anjiyografi', 'Coronary Angiography'),
    points: [w('LAO/RAO, kraniyal ve kaudal projeksiyonlar', 'LAO/RAO, cranial and caudal projections'), w('Kontrast enjeksiyonu ve skopi', 'Contrast injection and fluoroscopy')]
  },
  {
    id: 'angio-3d', domain: 'cath', path: './angio/3d/', thumb: 'angio-3d', badge: '3d',
    kicker: w('Koroner ağaç', 'Coronary tree'),
    name: w('3B Koroner Anatomi', '3D Coronary Anatomy'),
    points: [w('Segmentler ve dominans', 'Segments and dominance'), w('Projeksiyonla örtüşme ve kısalma', 'Overlap and foreshortening by projection')]
  },
  {
    id: 'angio-physiology', domain: 'cath', path: './angio/physiology/', thumb: 'angio-physiology', badge: 'new',
    kicker: w('Basınç teli laboratuvarı', 'Pressure-wire lab'),
    name: w('Koroner Fizyoloji', 'Coronary Physiology'),
    points: [w('FFR, iFR ve geri çekme (PPG)', 'FFR, iFR and pullback (PPG)'), w('Termodilüsyon: CFR, IMR, Rμ', 'Thermodilution: CFR, IMR, Rμ'), w('Anjiyografik sensör görünümü', 'Angiographic sensor view')]
  },
  {
    id: 'angio-carotid', domain: 'cath', path: './angio/carotid/', thumb: 'angio-carotid',
    kicker: w('Ark, boyun ve Willis', 'Arch, neck and Willis'),
    name: w('Karotis Anjiyografi', 'Carotid Angiography'),
    points: [w('Ark tipleri ve İKA segmentleri', 'Arch types and ICA segments'), w('DSA ve darlık ölçümü', 'DSA and stenosis grading')]
  },
  {
    id: 'angio-peripheral', domain: 'cath', path: './angio/peripheral/', thumb: 'angio-peripheral',
    kicker: w('Alt ve üst ekstremite', 'Lower and upper limb'),
    name: w('Periferik Anjiyografi', 'Peripheral Angiography'),
    points: [w('Aortoiliyak, femoropopliteal, diz altı', 'Aortoiliac, femoropopliteal, below the knee'), w('Viseral arterler ve yol haritası', 'Visceral arteries and roadmap')]
  },
  {
    id: 'echo', domain: 'imaging', path: './echo/', thumb: 'echo',
    kicker: w('TTE, TEE ve ICE', 'TTE, TEE and ICE'),
    name: w('Ekokardiyografi', 'Echocardiography'),
    points: [w('Standart pencereler ve kesitler', 'Standard windows and views'), w('Prob açısı ile canlı görüntü', 'Live image from the probe angle')]
  },
  {
    id: 'angio-ivus', domain: 'imaging', path: './angio/ivus/', thumb: 'angio-ivus', badge: 'new',
    kicker: w('İntravasküler ultrason', 'Intravascular ultrasound'),
    name: w('Koroner IVUS', 'Coronary IVUS'),
    points: [w('3B damar ve stent modeli', '3D vessel and stent model'), w('Küçük stent, POT ve apozisyon', 'Undersized stent, POT and apposition'), w('Segment bazlı normal MLA', 'Normal MLA by segment')]
  },
  {
    id: 'ecg', domain: 'rhythm', path: './ecg/', thumb: 'ecg',
    kicker: w('On iki derivasyon', 'Twelve leads'),
    name: w('EKG', 'ECG'),
    points: [w('Vektörden derivasyona', 'From vector to lead'), w('Ritim ve iletim bozuklukları', 'Rhythm and conduction disorders')]
  },
  {
    id: 'eps', domain: 'rhythm', path: './eps/', thumb: 'eps',
    kicker: w('Elektrofizyoloji laboratuvarı', 'Electrophysiology lab'),
    name: w('EPS Laboratuvarı', 'EPS Laboratory'),
    points: [w('Canlı intrakardiyak kayıt', 'Live intracardiac recording'), w('Programlı uyarı ve manevralar', 'Programmed stimulation and maneuvers'), w('Haritalama, ablasyon, CSP/LBBAP', 'Mapping, ablation, CSP/LBBAP')]
  },
  {
    id: 'ep-anatomy', domain: 'rhythm', path: './eps/anatomy/', thumb: 'ep-anatomy', badge: '3d',
    kicker: w('Girişimsel EP anatomisi', 'Interventional EP anatomy'),
    name: w('3B EP Anatomisi', '3D EP Anatomy'),
    points: [w('Transseptal geçiş ve Koch üçgeni', 'Transseptal access and Koch triangle'), w('Kalp pili elektrotları, Bachmann', 'Pacemaker leads, Bachmann')]
  },
  {
    id: 'pharmacology', domain: 'drugs', path: './pharmacology/', thumb: 'pharmacology',
    kicker: w('Kardiyovasküler ilaçlar', 'Cardiovascular drugs'),
    name: w('Farmakoloji', 'Pharmacology'),
    points: [w('Hedef haritası ve aksiyon potansiyeli', 'Target map and action potential'), w('Sınıf karşılaştırma ve etkileşimler', 'Class comparison and interactions')]
  }
]);

export const BADGES = Object.freeze({ new: w('Yeni', 'New'), '3d': w('3B', '3D') });

export const HOME_TEXT = Object.freeze({
  title: w('Cardia · Etkileşimli kardiyoloji stüdyosu', 'Cardia · Interactive cardiology studio'),
  navModules: w('Modüller', 'Modules'),
  navHow: w('Nasıl çalışır', 'How it works'),
  navFaq: w('Sorular', 'Questions'),
  navOpen: w('3B Anatomi\'yi aç', 'Open 3D Anatomy'),
  heroTitle: w('Kalbi\nçalışırken\nöğren', 'Learn the\nheart while\nit works'),
  heroLead: w(
    'Anatomiden kateter laboratuvarına, EKG\'den elektrofizyolojiye ve farmakolojiye on dört etkileşimli modül. Hepsi tarayıcıda çalışır; açılı projeksiyonlar, basınçlar, kesitler ve kayıtlar canlı modellerden gelir.',
    'Fourteen interactive modules from anatomy to the cath lab, from the ECG to electrophysiology and pharmacology. Everything runs in the browser; projections, pressures, sections and recordings come from live models.'
  ),
  heroCta: w('3B anatomiyle başla', 'Start with 3D anatomy'),
  heroAll: w('Tüm modüller', 'All modules'),
  heroNote: w('Ücretsiz · Kurulum ve hesap yok · Türkçe / English', 'Free · No install or account · Türkçe / English'),
  modulesTitle: w('Tüm modüller', 'All modules'),
  open: w('Aç', 'Open'),
  howTitle: w('Bir parametreyi değiştir,\ngerisi onu izlesin.', 'Change one parameter,\nthe rest follows.'),
  principles: [
    { title: w('Resim değil, model', 'Models, not pictures'), text: w('EKG, basınç eğrileri, IVUS kesitleri ve elektrogramlar çalışan modellerden üretilir. Darlığı, basıncı ya da stent çapını değiştirdiğinizde ölçümler buna göre yanıt verir.', 'ECGs, pressure curves, IVUS frames and electrograms come from running models. Change a stenosis, a pressure or a stent diameter and the measurements answer.') },
    { title: w('Tek anatomi, her modülde', 'One anatomy in every module'), text: w('3B kalp atlası; anjiyografi, eko, EP anatomisi ve muayene modüllerinde aynı yapılarla kullanılır. Projeksiyon, örtüşme ve kısalma gerçek odadaki gibi davranır.', 'The 3D heart atlas is shared by angiography, echo, EP anatomy and examination. Projections, overlap and foreshortening behave like the room.') },
    { title: w('Kılavuza dayalı, açıklamalı', 'Guideline based, explained'), text: w('Eşikler ve hesaplar kaynağıyla birlikte gösterilir (ESC, ACC/AHA, EAPCI, ASE). Vakalar ve kısa notlar, sonucun neden öyle çıktığını anlatır.', 'Cut-offs and calculators show their source (ESC, ACC/AHA, EAPCI, ASE). Cases and short notes explain why the result came out that way.') }
  ],
  faqTitle: w('Sorular', 'Questions'),
  faq: [
    { q: w('Cardia ücretli mi?', 'Is Cardia paid?'), a: w('Hayır. Tüm modüller ücretsizdir ve hesap gerektirmez.', 'No. Every module is free and needs no account.') },
    { q: w('Hasta bakımında kullanılabilir mi?', 'Can it be used for patient care?'), a: w('Hayır. Cardia bir eğitim aracıdır, tıbbi cihaz değildir. Doz, eşik ve hesaplar güncel kılavuzlar ve kurum protokolleriyle doğrulanmalıdır.', 'No. Cardia is an education tool, not a medical device. Doses, cut-offs and calculators must be checked against current guidelines and local protocols.') },
    { q: w('Kimler için?', 'Who is it for?'), a: w('Tıp öğrencileri, asistan ve yan dal hekimleri, kateter ve EP laboratuvarı ekipleri ve onlara eğitim verenler.', 'Medical students, residents and fellows, cath and EP lab teams, and the people who teach them.') },
    { q: w('Telefonda çalışır mı?', 'Does it work on a phone?'), a: w('Evet; tüm sayfalar telefona uyum sağlar. 3B modüller ve laboratuvar konsolları geniş ekranda daha rahat kullanılır.', 'Yes; every page adapts to phones. The 3D modules and lab consoles are easier on a larger screen.') },
    { q: w('Verilerim nereye gidiyor?', 'Where does my data go?'), a: w('Dil tercihi, son açılan ders ve kişisel notlar yalnız tarayıcınızda saklanır. Hesap ya da reklam yoktur.', 'Language, the last lesson and personal notes stay in your browser. There is no account and no advertising.') },
    { q: w('Çevrimdışı kullanılabilir mi?', 'Does it work offline?'), a: w('Açtığınız sayfalar önbelleğe alınır; bağlantı kesildiğinde de yeniden açılabilir.', 'Pages you open are cached and reopen when the connection drops.') }
  ],
  disclaimer: w('Şematik eğitim simülatörüdür; gerçek hasta kaydı veya tıbbi cihaz değildir. Klinik karar amacıyla kullanılamaz.', 'Schematic education simulator; not patient data or a medical device. Not for clinical decisions.')
});

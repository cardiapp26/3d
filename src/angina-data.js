// Educational mechanism map. No patient-specific treatment or dosing algorithm.
const text = (tr, en) => ({ tr, en });

export const ANGINA_SOURCES = [
  { id: 'pharma7-angina', title: 'Lippincott Illustrated Reviews: Pharmacology, 7th edition, Chapter 20' },
  { id: 'esc-ccs-2024', title: '2024 ESC Guidelines for the management of chronic coronary syndromes', url: 'https://academic.oup.com/eurheartj/article/45/36/3415/7743115' },
  { id: 'nitroglycerin-label', title: 'DailyMed: nitroglycerin prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=041f127e-5166-4484-bc1a-0a373d1187ae' },
  { id: 'ranolazine-label', title: 'DailyMed: ranolazine prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=989e1688-a0b5-4297-bf91-234de2a0b445' },
  { id: 'ivabradine-ema', title: 'EMA: Procoralan', url: 'https://www.ema.europa.eu/en/medicines/human/EPAR/procoralan' },
  { id: 'ivabradine-us', title: 'DailyMed: Corlanor prescribing information', url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=92018a65-38f6-45f7-91d4-a34921b81d0d' },
  { id: 'nicorandil-mhra', title: 'MHRA: nicorandil, second-line use and ulcer complications', url: 'https://www.gov.uk/drug-safety-update/nicorandil-ikorel-now-second-line-treatment-for-angina-risk-of-ulcer-complications' },
  { id: 'nicorandil-smpc', title: 'Nicorandil: Summary of Product Characteristics', url: 'https://www.medicines.org.uk/emc/product/652/smpc' },
  { id: 'trimetazidine-ema', title: 'EMA: trimetazidine referral', url: 'https://www.ema.europa.eu/en/medicines/human/referrals/trimetazidine' },
];

export const ANGINA_DRUGS = [
  {
    id: 'nitrate', name: text('Organik nitratlar', 'Organic nitrates'),
    examples: text('Nitrogliserin; izosorbid mononitrat / dinitrat', 'Nitroglycerin; isosorbide mononitrate / dinitrate'),
    targets: ['preload', 'coronary'],
    mechanism: text('NO-cGMP yolu düz kası gevşetir. Venodilatasyon ön yükü ve miyokardın oksijen gereksinimini azaltır; koroner dilatasyon da oluşur.', 'NO-cGMP signalling relaxes smooth muscle. Venodilation reduces preload and myocardial oxygen demand; coronary dilation also occurs.'),
    context: text('Formülasyona göre atak rahatlatma veya semptom önleme; vazospastik anjinada da kullanılır. Sabit darlığı ortadan kaldırmaz.', 'Depending on formulation, attack relief or symptom prevention; also used in vasospastic angina. Does not remove fixed stenosis.'),
    risk: text('Baş ağrısı, hipotansiyon, refleks taşikardi ve tolerans. PDE5 inhibitörleri veya riociguat ile birlikte kullanım kontrendikedir.', 'Headache, hypotension, reflex tachycardia and tolerance. Concomitant PDE5 inhibitors or riociguat are contraindicated.'),
    monitor: text('Kan basıncı, ortostatik yakınmalar, semptom yanıtı ve etkileşen ilaçlar; tolerans yönetimi formülasyona göre değerlendirilir.', 'Blood pressure, orthostatic symptoms, symptom response and interacting medicines; tolerance management depends on formulation.'),
    sourceIds: ['pharma7-angina', 'nitroglycerin-label'],
  },
  {
    id: 'beta', name: text('Beta blokerler', 'Beta blockers'), examples: text('Metoprolol; bisoprolol; atenolol', 'Metoprolol; bisoprolol; atenolol'),
    targets: ['rate', 'contractility'],
    mechanism: text('Beta-adrenerjik blokaj kalp hızını ve kasılma gücünü azaltır; oksijen gereksinimi düşer.', 'Beta-adrenergic blockade reduces heart rate and contractility, lowering oxygen demand.'),
    context: text('Eforla ilişkili anjina semptomlarında kullanılır. Vazospastik anjinada uygun olmayabilir; semptom rahatlaması her hastada sağkalım yararı anlamına gelmez.', 'Used for exertional angina symptoms. May be unsuitable in vasospastic angina; symptom relief does not imply survival benefit in every patient.'),
    risk: text('Bradikardi, AV blok, yorgunluk; özellikle nonselektif ajanlarda bronkospazm. Verapamil / diltiazem ile iletim baskılanması artabilir; ani kesilme rebound anjinaya yol açabilir.', 'Bradycardia, AV block and fatigue; bronchospasm especially with nonselective agents. Verapamil / diltiazem may compound conduction suppression; abrupt withdrawal can cause rebound angina.'),
    monitor: text('Kalp hızı, kan basıncı, gerektiğinde EKG, solunum yakınmaları ve semptom yanıtı.', 'Heart rate, blood pressure, ECG when indicated, respiratory symptoms and symptom response.'), sourceIds: ['pharma7-angina', 'esc-ccs-2024'],
  },
  {
    id: 'dhp', name: text('Dihidropiridin KKB', 'Dihydropyridine CCBs'), examples: text('Amlodipin; uzun etkili nifedipin', 'Amlodipine; long-acting nifedipine'), targets: ['afterload', 'coronary'],
    mechanism: text('Damar düz kasındaki L-tipi Ca²⁺ kanallarını bloke eder. Arteriyoler dilatasyon ard yükü azaltır; koroner spazmı gevşetir.', 'Blocks vascular smooth-muscle L-type Ca²⁺ channels. Arteriolar dilation lowers afterload and relieves coronary spasm.'),
    context: text('Efor anjinası ve vazospastik anjina. Etki ağırlıkla damarsaldır; tüm KKB’ler kalp hızını azaltmaz.', 'Exertional and vasospastic angina. Effects are predominantly vascular; not all CCBs reduce heart rate.'),
    risk: text('Periferik ödem, baş ağrısı, flushing ve hipotansiyon. Kısa etkili nifedipin koroner hastalıkta uygun bir rutin seçenek değildir.', 'Peripheral oedema, headache, flushing and hypotension. Short-acting nifedipine is not an appropriate routine choice in coronary disease.'),
    monitor: text('Kan basıncı, ödem ve anjina sıklığı.', 'Blood pressure, oedema and angina frequency.'), sourceIds: ['pharma7-angina', 'esc-ccs-2024'],
  },
  {
    id: 'nondhp', name: text('Non-dihidropiridin KKB', 'Non-dihydropyridine CCBs'), examples: text('Verapamil; diltiazem', 'Verapamil; diltiazem'), targets: ['rate', 'contractility', 'coronary'],
    mechanism: text('L-tipi Ca²⁺ kanallarını bloke ederek SA / AV düğümünü ve kasılmayı baskılar; koroner vazodilatasyon da sağlar.', 'Blocks L-type Ca²⁺ channels, suppressing SA / AV nodal activity and contractility; also produces coronary vasodilation.'),
    context: text('Seçilmiş efor veya vazospastik anjinada semptom kontrolü. HFrEF’de kontrendikedir.', 'Symptom control in selected exertional or vasospastic angina. Contraindicated in HFrEF.'),
    risk: text('Bradikardi, AV blok, hipotansiyon; verapamil ile kabızlık. Beta blokerle birlikte iletim / kasılma baskılanması; ivabradinle birlikte kullanım kontrendikedir.', 'Bradycardia, AV block and hypotension; constipation with verapamil. Additive conduction / contractility suppression with beta blockers; concomitant ivabradine is contraindicated.'),
    monitor: text('Kalp hızı, kan basıncı, EKG ve kalp yetersizliği bulguları; eşlik eden ilaçlar.', 'Heart rate, blood pressure, ECG and signs of heart failure; concomitant medicines.'), sourceIds: ['pharma7-angina', 'esc-ccs-2024', 'ivabradine-ema'],
  },
  {
    id: 'ranolazine', name: text('Ranolazin', 'Ranolazine'), examples: text('Ranolazin', 'Ranolazine'), targets: ['diastolic'],
    mechanism: text('Geç Na⁺ akımını inhibe edebilir; Na⁺ / Ca²⁺ yükünü azaltma diyastolik gevşemeyle ilişkilendirilir. Bu mekanizmanın anjina yararıyla ilişkisi kesin değildir.', 'Can inhibit late Na⁺ current; reducing Na⁺ / Ca²⁺ loading is linked to diastolic relaxation. The relationship of this mechanism to angina benefit remains uncertain.'),
    context: text('Kronik anjinada semptom kontrolü; hız veya basınç düşüşünün sınırlayıcı olduğu durumlarda değerlendirilebilir. Kanıtlanmış endotel onarımı olarak gösterilmez.', 'Symptom control in chronic angina; may be considered when lowering heart rate or pressure is limiting. Not presented as proven endothelial repair.'),
    risk: text('QT uzaması, baş dönmesi, kabızlık; CYP3A etkileşimleri. Güçlü CYP3A inhibitörleri / indükleyicileri ve karaciğer sirozu kontrendikasyonlardır.', 'QT prolongation, dizziness and constipation; CYP3A interactions. Strong CYP3A inhibitors / inducers and liver cirrhosis are contraindications.'),
    monitor: text('QT / EKG gereksinimi, böbrek fonksiyonu, karaciğer hastalığı ve etkileşim listesi.', 'QT / ECG needs, renal function, liver disease and interaction list.'), sourceIds: ['pharma7-angina', 'ranolazine-label'],
  },
  {
    id: 'ivabradine', name: text('İvabradin', 'Ivabradine'), examples: text('İvabradin', 'Ivabradine'), targets: ['rate'],
    mechanism: text('Sinüs düğümünde If akımını inhibe eder, artırmaz. Kalp hızını azaltır; doğrudan negatif inotropik etki ana mekanizma değildir.', 'Inhibits, rather than increases, sinus-node If current. Reduces heart rate; direct negative inotropy is not the principal mechanism.'),
    context: text('AB’de seçilmiş sinüs ritmindeki stabil anjina için ruhsatlıdır. ABD etiketi kalp yetersizliği içindir; anjina endikasyonu değildir. Anjina için infarkt / ölüm azalması gösterilmemiştir.', 'EU authorisation includes selected stable angina in sinus rhythm. The US label covers heart failure, not an angina indication. Reduced infarction / mortality has not been shown for angina.'),
    risk: text('Bradikardi, atriyal fibrilasyon ve ışıklı görsel fenomenler. Verapamil / diltiazem ve güçlü CYP3A inhibitörleriyle kullanım kontrendikedir.', 'Bradycardia, atrial fibrillation and luminous visual phenomena. Verapamil / diltiazem and strong CYP3A inhibitors are contraindicated.'),
    monitor: text('Sinüs ritmi, kalp hızı, EKG, görsel yakınmalar ve etkileşimler.', 'Sinus rhythm, heart rate, ECG, visual symptoms and interactions.'), sourceIds: ['ivabradine-ema', 'ivabradine-us'],
  },
  {
    id: 'nicorandil', name: text('Nikorandil', 'Nicorandil'), examples: text('Nikorandil', 'Nicorandil'), targets: ['afterload', 'preload', 'coronary'],
    mechanism: text('ATP-duyarlı K⁺ kanallarını açar ve nitrat benzeri etki gösterir. Arteriyel / venöz dilatasyon ve koroner gevşeme sağlar.', 'Opens ATP-sensitive K⁺ channels and has nitrate-like activity. Produces arterial / venous dilation and coronary relaxation.'),
    context: text('Ruhsatlı olduğu ülkelerde, ilk seçenekler yetersiz veya tolere edilemediğinde stabil anjina için değerlendirilir.', 'Where authorised, considered for stable angina when initial options are inadequate or not tolerated.'),
    risk: text('Baş ağrısı ve hipotansiyon; ciddi deri, mukoza, göz veya gastrointestinal ülserler, perforasyon / kanama olabilir. PDE5 inhibitörleri ve riociguat ile birlikte kullanılmaz.', 'Headache and hypotension; serious skin, mucosal, eye or gastrointestinal ulcers can cause perforation / bleeding. Do not combine with PDE5 inhibitors or riociguat.'),
    monitor: text('Kan basıncı, ülser / ağız yarası / gastrointestinal yakınmalar ve etkileşimler.', 'Blood pressure, ulcers / mouth sores / gastrointestinal symptoms and interactions.'), sourceIds: ['esc-ccs-2024', 'nicorandil-mhra', 'nicorandil-smpc'],
  },
  {
    id: 'trimetazidine', name: text('Trimetazidin', 'Trimetazidine'), examples: text('Trimetazidin', 'Trimetazidine'), targets: ['metabolic'],
    mechanism: text('Miyokard enerji metabolizmasını yağ asidi oksidasyonundan glukoz kullanımına kaydıran metabolik modülatör; belirgin hız / basınç düşüşü hedeflenmez.', 'Metabolic modulator shifting myocardial energy metabolism from fatty-acid oxidation towards glucose use; substantial rate / pressure reduction is not the target.'),
    context: text('EMA’ya göre stabil anjinada ilk tedaviler yetersiz veya tolere edilemiyorsa yalnız ek semptom tedavisi. Akut atak ilacı değildir.', 'Under EMA restrictions, only add-on symptom therapy for stable angina when initial therapy is inadequate or not tolerated. Not an acute-attack medicine.'),
    risk: text('Parkinson hastalığı, parkinsonizm ve ilişkili hareket bozukluklarında; ağır böbrek yetersizliğinde kontrendikedir.', 'Contraindicated in Parkinson disease, parkinsonism and related movement disorders, and severe renal impairment.'),
    monitor: text('Böbrek fonksiyonu, tremor, yürüme / hareket değişikliği ve semptom yanıtı.', 'Renal function, tremor, gait / movement changes and symptom response.'), sourceIds: ['trimetazidine-ema'],
  },
];

// Cardiovascular Pathophysiology Studio: stations, didactic models, and bilingual content.
// High-yield clinical pathophysiology and mechanics integrated with interactive simulations.

const t = (tr, en) => ({ tr, en });

export const PATHOPHYS_GROUPS = [
  {
    id: 'mechanics',
    label: t('I. Ventrikül Mekaniği, Döngü ve Oskültasyon', 'I. Ventricular Mechanics, Cycle & Auscultation')
  },
  {
    id: 'coronary',
    label: t('II. Koroner Dolaşım, Aterom ve İskemi', 'II. Coronary Circulation, Atheroma & Ischemia')
  },
  {
    id: 'myocardial-pericardial',
    label: t('III. Kalp Yetersizliği, Miyokard ve Perikard', 'III. Heart Failure, Myocardium & Pericardium')
  },
  {
    id: 'valvular-arrhythmia-congenital',
    label: t('IV. Kapak, Aritmi, Damar Basıncı ve Doğuştan Şantlar', 'IV. Valvular, Arrhythmia, Vascular & Congenital')
  }
];

export const PATHOPHYS_STATIONS = [
  // GRUP I: VENTRİKÜL MEKANİĞİ VE DÖNGÜ
  {
    id: 'pv-loop',
    num: '01',
    group: 'mechanics',
    title: t('Basınç-Hacim (PV) Döngüsü ve Ventrikül Mekaniği', 'Pressure-Volume (PV) Loop and Ventricular Mechanics'),
    shortTitle: t('PV Döngüsü', 'PV Loop'),
    intro: t(
      'Suga ve Sagawa zamanla değişen elastans çerçevesi: Ön-yük, ard-yük, kontraktilite (Ees) ve diyastolik sertlik (EDPVR) arasındaki etkileşimi canlı inceleyin.',
      'Time-varying elastance framework of Suga and Sagawa: interactively explore preload, afterload, inotropy (Ees) and diastolic stiffness (EDPVR).'
    )
  },
  {
    id: 'loads',
    num: '02',
    group: 'mechanics',
    title: t('Ön Yük ve Ard Yük', 'Preload and Afterload'),
    shortTitle: t('Ön Yük / Ard Yük', 'Preload / Afterload'),
    intro: t(
      'Atan sol ventrikül kesiti ve kas şeridi benzetmesiyle ön yük ile ard yükü ayırın; basınç, boşluk yarıçapı ve duvar kalınlığının duvar stresine etkisini canlı izleyin.',
      'Separate preload from afterload with a beating LV section and a muscle-strip analogy; watch how pressure, cavity radius and wall thickness change wall stress.'
    )
  },
  {
    id: 'starling-laplace',
    num: '03',
    group: 'mechanics',
    title: t('Frank-Starling Yasası ve Laplace Duvar Stresi', 'Frank-Starling Law and Laplace Wall Stress'),
    shortTitle: t('Starling ve Laplace', 'Starling & Laplace'),
    intro: t(
      'Miyofilament sarkomer gerim-uzunluk ilişkisi ile intrakaviter basınç, lümen yarıçapı ve duvar kalınlığının (Laplace yasası: σ = P·r / 2h) belirlediği duvar stresini ve ventriküler yeniden yapılanmayı simüle edin.',
      'Simulate sarcomere length-tension relations and myocardial wall stress determined by cavity pressure, radius and wall thickness (Laplace law: σ = P·r / 2h).'
    )
  },
  {
    id: 'physiology',
    num: '04',
    group: 'mechanics',
    title: t('Görsel Fizyoloji Rehberi ve Pompa Eğrileri', 'Visual Physiology Guide & Pump Curves'),
    shortTitle: t('Fizyoloji Rehberi', 'Physiology Guide'),
    intro: t(
      'Pompa eğrileri (sağ ve sol doluş, otonom tonus, arter basıncı), basınç-hacim döngüsünün evreleri ve işi, Wiggers olayları.',
      'Pump curves (right and left filling, autonomic tone, arterial pressure), the phases and work of the pressure-volume loop, and Wiggers events.'
    )
  },
  {
    id: 'wiggers',
    num: '05',
    group: 'mechanics',
    title: t('Canlı Wiggers Diyagramı ve Kalp Sesleri', 'Live Wiggers Diagram and Heart Sounds'),
    shortTitle: t('Canlı Wiggers', 'Live Wiggers'),
    intro: t(
      'Sol ve sağ kalp basınçları, LV hacmi, kalp sesleri (S1, S2, S3, S4) ve EKG aynı döngü saatinde: oynatın, dondurun, kalp hızını değiştirin ya da döngüde gezinin.',
      'Left and right heart pressures, LV volume, heart sounds (S1, S2, S3, S4) and the ECG on one cardiac clock: play, freeze, change the heart rate or scrub through the cycle.'
    )
  },

  // GRUP II: KORONER DOLAŞIM, ATEROM VE İSKEMİ
  {
    id: 'atherogenesis',
    num: '06',
    group: 'coronary',
    title: t('Aterogenez Biyolojisi, Plak Evrimi ve Kümülatif Maruziyet', 'Atherogenesis Biology, Plaque Evolution & Cumulative Exposure'),
    shortTitle: t('Aterom ve Plak Evrimi', 'Atheroma & Plaque Evolution'),
    intro: t(
      'Normal endotelden subendotelyal ApoB tutulumuna, köpük hücrelerinden fibröz kılıf ve ince kılıflı plak (TCFA) rüptürüne çok aşamalı biyolojik tuval (Borén, Averna ve Ference katkılarıyla).',
      'Multi-stage biological canvas spanning healthy intima, subendothelial apoB retention, foam cells, fibrous cap, and thin-cap fibroatheroma (TCFA) rupture.'
    )
  },
  {
    id: 'ischemic-cascade',
    num: '07',
    group: 'coronary',
    title: t('İskemik Kalp Hastalığı, MVO2 ve İskemik Kaskad', 'Ischemic Heart Disease, MVO2 and the Ischemic Cascade'),
    shortTitle: t('İskemik Kaskad & MVO2', 'Ischemic Cascade & MVO2'),
    intro: t(
      'Miyokard oksijen arz-talep terazisi (MVO2) ile zamansal iskemik kaskad simülatörü (perfüzyon uyuşmazlığı -> diyastolik gevşeme kusuru -> sistolik duvar kusuru -> EKG ST-T kaymaları -> angina pektoris).',
      'Myocardial oxygen supply-demand balance (MVO2) and the temporal ischemic cascade simulator (perfusion deficit -> diastolic relaxation failure -> systolic dyskinesia -> ECG ST-T shifts -> clinical angina).'
    )
  },

  // GRUP III: KALP YETERSİZLİĞİ, MİYOKARD VE PERİKARD
  {
    id: 'heart-failure',
    num: '08',
    group: 'myocardial-pericardial',
    title: t('Kalp Yetersizliği: HFrEF vs HFpEF, Nörohormonlar ve Kardiyomiyopatiler', 'Heart Failure: HFrEF vs HFpEF, Neurohormones & Cardiomyopathies'),
    shortTitle: t('Kalp Yetersizliği & KMP', 'Heart Failure & CMP'),
    intro: t(
      'Sistolik (HFrEF) ve diyastolik (HFpEF) yetersizlik, Frank-Starling kompansasyon sınırı, SNS/RAAS kısır döngüsü ve kardiyomiyopati fenotipleri (DCM, HCM dinamik LVOT/SAM obstrüksiyonu, RCM karekök trasesi).',
      'Systolic (HFrEF) vs diastolic (HFpEF) failure, Frank-Starling compensation limits, SNS/RAAS vicious cycle, and cardiomyopathy phenotypes (DCM, HCM with dynamic LVOT/SAM, RCM square-root sign).'
    )
  },
  {
    id: 'pericardial',
    num: '09',
    group: 'myocardial-pericardial',
    title: t('Perikard Patofizyolojisi: Kardiyak Tamponad ve Konstriksiyon', 'Pericardial Pathophysiology: Cardiac Tamponade & Constriction'),
    shortTitle: t('Perikard: Tamponad & Konstriksiyon', 'Pericardium: Tamponade & Constriction'),
    intro: t(
      'Perikardiyal kompliyans eğrisi, tamponadda biventriküler etkileşim ve Pulsus Paradoxus (>10 mmHg düşüş, silinmiş y-inişi); konstriktif perikarditte karekök (dip-and-plateau) basınç dalgası ve Kussmaul belirtisi.',
      'Pericardial compliance curve, ventricular interdependence in cardiac tamponade with Pulsus Paradoxus (>10 mmHg drop, blunted y-descent), and constrictive pericarditis square-root wave with Kussmaul’s sign.'
    )
  },
  {
    id: 'myocardial-ckm',
    num: '10',
    group: 'myocardial-pericardial',
    title: t('Özelleşmiş Miyokard Stresi: Takotsubo, CKM Enerjetikleri ve Lenfatikler', 'Specialized Myocardial Stress: Takotsubo, CKM Energetics & Lymphatics'),
    shortTitle: t('Takotsubo & CKM', 'Takotsubo & CKM'),
    intro: t(
      'Omerovic (2026) Takotsubo katekolamin fırtınası ve β2-AR Gs→Gi sinyal anahtarı; Zelniker ve Braunwald (2026) SGLT2i miyokardiyal NHE-1/keton kardiyoproteksiyonu; Brakenhielm (2026) kardiyak lenfatik ödem drenajı.',
      'Interactive simulation of Takotsubo apical ballooning (beta-2 Gs-to-Gi switch), SGLT2i cardio-kidney-metabolic (CKM) energetics, and cardiac lymphatic VEGFC/VEGFR3 edema clearance.'
    )
  },
  {
    id: 'forrester',
    num: '11',
    group: 'myocardial-pericardial',
    title: t('Akut Kardiyojenik Şok ve Forrester Hemodinamiği', 'Acute Cardiogenic Shock and Forrester Hemodynamics'),
    shortTitle: t('Forrester Şok Matrisi', 'Forrester Shock Matrix'),
    intro: t(
      'Kardiyak İndeks (Perfüzyon: Sıcak/Soğuk) ve Pulmoner Kapiller Uç Basıncı (Konjesyon: Kuru/Islak) 2×2 matrisi: Klinik hemodinamik hedefler ve acil tedavi yanıtları.',
      'Cardiac Index (Perfusion: Warm/Cold) vs Pulmonary Capillary Wedge Pressure (Congestion: Dry/Wet) 2×2 matrix: Clinical subsets, targets and emergency interventions.'
    )
  },

  // GRUP IV: KAPAK, ARİTMİ, DAMAR BASINCI VE DOĞUŞTAN ŞANTLAR
  {
    id: 'valvular',
    num: '12',
    group: 'valvular-arrhythmia-congenital',
    title: t('Kapak Hastalıkları, Basınç Gradyanları ve Dinamik Oskültasyon', 'Valvular Disease, Pressure Gradients & Dynamic Auscultation'),
    shortTitle: t('Kapak Gradyanları & Oskültasyon', 'Valvular Gradients & Auscultation'),
    intro: t(
      'Aort darlığı, aort yetersizliği, mitral darlığı ve mitral yetersizliğinde eşzamanlı basınç dalgaları, Gorlin alanları, yatak başı oskültasyon sesleri ve dinamik manevralar (Valsalva, çömelme, el sıkma).',
      'Simultaneous LV, LA and aortic pressure waveforms in AS, AR, MS and MR with transvalvular gradients, bedside murmurs, and dynamic maneuvers (Valsalva, squatting, handgrip).'
    )
  },
  {
    id: 'electrophys',
    num: '13',
    group: 'valvular-arrhythmia-congenital',
    title: t('Aritmi Mekanizmaları: Otomatisite, Tetiklenen Aktivite ve Reentri', 'Arrhythmia Mechanisms: Automaticity, Triggered Activity & Reentry'),
    shortTitle: t('Aritmi Mekanizmaları', 'Arrhythmia Mechanisms'),
    intro: t(
      'Ventriküler ve nodal aksiyon potansiyelleri, erken ve gecikmiş artı-depolarizasyonlar (EAD/DAD), tek yönlü blok ve reentri üçlüsü; modern fizyolojik Sol Dal Alanı Uyarımı (LBBAP/CSP).',
      'Ventricular vs nodal action potentials, early and delayed afterdepolarizations (EAD/DAD), unidirectional block and the reentry triad; modern Conduction System Pacing (LBBAP/CSP).'
    )
  },
  {
    id: 'hypertension-vascular',
    num: '14',
    group: 'valvular-arrhythmia-congenital',
    title: t('Hipertansiyon Patofizyolojisi, Guyton Basınç-Natriürezi ve Arteriyel Sertlik', 'Hypertension Pathophysiology, Guyton Pressure-Natriuresis & Arterial Stiffness'),
    shortTitle: t('Hipertansiyon & PWV', 'Hypertension & PWV'),
    intro: t(
      'BP = CO x SVR hemodinamiği, Guyton renal basınç-natriürezi eğrisi, direnç arteriyolü yeniden yapılanması ve aortik nabız dalgası hızı (PWV) dalga yansıması augmentasyonu.',
      'BP = CO x SVR hemodynamics, Guyton renal pressure-natriuresis shifting, resistance arteriole remodeling, and aortic pulse wave velocity (PWV) reflection augmentation.'
    )
  },
  {
    id: 'pah-rv',
    num: '15',
    group: 'valvular-arrhythmia-congenital',
    title: t('Pulmoner Arteriyel Hipertansiyon (PAH) ve Sağ Kalp Eşleşmesi', 'Pulmonary Arterial Hypertension (PAH) and Right Ventricular Coupling'),
    shortTitle: t('Pulmoner HT & Sağ Kalp', 'PAH & Right Heart'),
    intro: t(
      'Ghofrani 4-yolak pulmoner vasküler yeniden yapılanma modeli (BMPR2/Aktivin, endotelin, NO-sGC ve prostasiklin), pleksiform arteriyopati, interventriküler septumun sola kayması (D-şekilli LV) ve RV-PA eşleşmesi.',
      'Four-pathway pulmonary vascular remodeling (BMPR2/Activin signaling, Endothelin-1, NO-sGC-cGMP, Prostacyclin), plexiform arteriopathy, biventricular D-shape interdependence, and RV-PA coupling.'
    )
  },
  {
    id: 'achd-shunts',
    num: '16',
    group: 'valvular-arrhythmia-congenital',
    title: t('Erişkin Doğuştan Kalp Hastalıkları (ACHD), Şant Dinamiği ve Eisenmenger', 'Adult Congenital Heart Disease (ACHD), Shunt Dynamics & Eisenmenger'),
    shortTitle: t('Doğuştan Şantlar (ACHD)', 'Congenital Shunts (ACHD)'),
    intro: t(
      'ASD, VSD ve PDA kusurlarında sol-sağ şant hacmi, Qp/Qs oranı, odacık aşırı yükü, pulmoner vasküler direnç artışıyla Eisenmenger sendromu (sağ-sol ters şant, siyanoz) ve perkütan kapama kriterleri.',
      'Left-to-right shunt mechanics in ASD, VSD and PDA: Qp/Qs calculation, volume/pressure chamber overload, progression to Eisenmenger reversal with cyanosis, and transcatheter closure.'
    )
  }
];

export const PV_SCENARIOS = [
  {
    id: 'normal',
    name: t('Normal Referans', 'Normal Reference'),
    desc: t('Normal ventrikül kontraktilitesi, normal arteriyel kompliyans ve fizyolojik dolum.', 'Normal inotropy, arterial elastance, and physiological diastolic filling.'),
    params: { edv: 130, ees: 2.34, ea: 1.11, stiffness: 0.025, edp: 10 }
  },
  {
    id: 'hfref',
    name: t('HFrEF (Sistolik Kalp Yetersizliği)', 'HFrEF (Systolic Heart Failure)'),
    desc: t('Çökmüş kontraktilite (düşük Ees), kompanse edici dilatasyon (yüksek EDV) ve düşmüş vuru hacmi / EF.', 'Depressed inotropy (low Ees), compensatory chamber dilation, and low EF.'),
    params: { edv: 220, ees: 0.65, ea: 1.85, stiffness: 0.02, edp: 28 }
  },
  {
    id: 'hfpef',
    name: t('HFpEF (Diyastolik Kalp Yetersizliği)', 'HFpEF (Diastolic Heart Failure)'),
    desc: t('Belirgin artmış miyokardiyal sertlik (dik EDPVR), normal EDV ancak yüksek dolum basıncı ve konjesyon.', 'Steep diastolic EDPVR curve, elevated filling pressures despite normal cavity volume.'),
    params: { edv: 115, ees: 3.4, ea: 2.1, stiffness: 0.046, edp: 26 }
  },
  {
    id: 'as',
    name: t('Aort Darlığı (Basınç Yükü)', 'Aortic Stenosis (Pressure Overload)'),
    desc: t('Transvalvüler direnç nedeniyle çok yüksek tepe ventrikül basıncı, artmış ard-yük ve sekonder hipertrofi.', 'Elevated intraventricular systolic pressure, high afterload, and concentric remodeling.'),
    params: { edv: 125, ees: 3.5, ea: 2.7, stiffness: 0.032, edp: 20, valve: 'as' }
  },
  {
    id: 'ar',
    name: t('Aort Yetersizliği (Hacim + Basınç Yükü)', 'Aortic Regurgitation (Combined Load)'),
    desc: t('Diyastolde aorttan ventriküle geri kaçış: Devasa EDV, geniş nabız basıncı ve izovolümetrik gevşeme kaybı.', 'Diastolic aortic regurgitant volume: marked LV dilation, wide pulse pressure, no true isovolumic relaxation.'),
    params: { edv: 235, ees: 1.85, ea: 1.05, stiffness: 0.018, edp: 16, valve: 'ar' }
  },
  {
    id: 'mr',
    name: t('Mitral Yetersizliği (Düşük Dirençli Kaçış)', 'Mitral Regurgitation (Low-Impedance Leak)'),
    desc: t('Sistol başında sol atriyuma kaçış (izovolümetrik kasılma fazı silinir), yüksek toplam debi ama azalmış ileri debi.', 'Early systolic regurgitation into the low-pressure left atrium, abolishing isovolumic contraction.'),
    params: { edv: 165, ees: 2.4, ea: 0.95, stiffness: 0.028, edp: 24, valve: 'mr' }
  },
  {
    id: 'inotrope',
    name: t('Pozitif İnotrop / Egzersiz', 'Positive Inotrope / Exercise'),
    desc: t('Artmış kontraktilite (dikleşmiş Ees), sola kaymış sistol sonu hacmi ve yüksek ejeksiyon fraksiyonu.', 'Enhanced contractility (steeper Ees), reduced end-systolic volume, and high EF.'),
    params: { edv: 135, ees: 4.4, ea: 1.35, stiffness: 0.025, edp: 11 }
  },
  {
    id: 'hypovolemia',
    name: t('Hipovolemik Şok (Ön-yük Kaybı)', 'Hypovolemic Shock (Preload Depletion)'),
    desc: t('Yetersiz venöz dönüş (düşük EDV), çökmüş vuru hacmi ve kompanse edici taşikardi/vazokonstriksiyon.', 'Depleted venous return (low EDV), small stroke volume, and high systemic vascular resistance.'),
    params: { edv: 78, ees: 2.34, ea: 1.6, stiffness: 0.025, edp: 3 }
  }
];

export const FORRESTER_PROFILES = [
  {
    id: 'profile-1',
    name: t('Profil I: Sıcak ve Kuru (Normal / Kompanse)', 'Profile I: Warm & Dry (Normal / Compensated)'),
    ci: 2.8, pcwp: 12,
    quadrant: 'I',
    status: t('Perfüzyon Yeterli · Pulmoner Konjesyon Yok', 'Adequate Perfusion · No Congestion'),
    clinical: t('Ekstremiteler sıcak, bilinç açık, akciğerler temiz, ortopne/ödem yok.', 'Warm extremities, clear lungs, no orthopnea or peripheral edema.'),
    management: t('Tıbbi tedavi optimizasyonu (GDMT titrasyonu), elektif izlem.', 'Optimize guideline-directed medical therapy (GDMT), outpatient follow-up.')
  },
  {
    id: 'profile-2',
    name: t('Profil II: Sıcak ve Islak (Pulmoner Konjestif KY)', 'Profile II: Warm & Wet (Pulmonary Congestion)'),
    ci: 2.5, pcwp: 24,
    quadrant: 'II',
    status: t('Perfüzyon Yeterli · Akut Pulmoner Konjesyon', 'Adequate Perfusion · Pulmonary Congestion'),
    clinical: t('Akut dispne, iki taraflı bazal raller, juguler venöz dolgunluk (JVD), S3 gallop, periferik ödem.', 'Dyspnea, bilateral pulmonary crackles, elevated JVP, S3 gallop, peripheral edema.'),
    management: t('İntravenöz loop diüretik (furosemid), vazodilatatör (nitrogliserin), sistolik KB > 110 mmHg ise ACEi/ARNI.', 'IV loop diuretics, intravenous vasodilators (nitroglycerin), titrate decongestion.')
  },
  {
    id: 'profile-3',
    name: t('Profil III: Soğuk ve Kuru (Hipovolemik / Düşük Debi)', 'Profile III: Cold & Dry (Hypoperfusion without Congestion)'),
    ci: 1.7, pcwp: 11,
    quadrant: 'III',
    status: t('Doku Hipoperfüzyonu · Konjesyon Yok (Düşük Dolum)', 'Hypoperfusion · No Congestion (Low Filling)'),
    clinical: t('Soğuk soluk ekstremiteler, zayıf nabızlar, oligüri, prerenal azotemi, akciğerler temiz.', 'Cool pale extremities, weak pulses, oliguria, prerenal azotemia, clear lungs.'),
    management: t('Dikkatli sıvı yükleme (250-500 mL kristalloid), aşırı diürezden kaçınma, gerekirse inotrop desteği.', 'Careful fluid challenge, reduce over-diuresis, evaluate inotropic support if unresponsive.')
  },
  {
    id: 'profile-4',
    name: t('Profil IV: Soğuk ve Islak (Kardiyojenik Şok)', 'Profile IV: Cold & Wet (Cardiogenic Shock)'),
    ci: 1.5, pcwp: 26,
    quadrant: 'IV',
    status: t('Doku Hipoperfüzyonu + Ağır Pulmoner Konjesyon', 'Severe Hypoperfusion + Severe Congestion'),
    clinical: t('Hipotansiyon, soğuk terli ekstremiteler, laktik asidoz, bilinç bulanıklığı, yoğun raller, oligüri.', 'Hypotension, cold clammy extremities, lactic acidosis, altered mentation, dense crackles, anuria.'),
    management: t('İnotropik destek (dobutamin / milrinon), vazopressör (noradrenalin), mekanik dolaşım desteği (Impella / IABP / ECMO).', 'Inotropes, norepinephrine for MAP maintenance, early mechanical circulatory support (MCS).')
  }
];

export const ATHEROMA_STAGES = [
  {
    stage: 1,
    id: 'endothelial',
    title: t('Evre 1: Endotelyal Disfonksiyon ve ApoB Transsitozu', 'Stage 1: Endothelial Dysfunction & ApoB Transcytosis'),
    desc: t(
      'Bifürkasyon ve eğriliklerde bozulmuş laminar shear stress, endotel geçirgenliğini artırır. SR-BI ve ALK1 aracılı transsitoz ile dolaşımdaki apoB-100 taşıyan partiküller (LDL, VLDL kalıntıları, Lp(a)) subendotelyal intimaya geçer (Borén et al., Nat Rev Cardiol 2025).',
      'Disturbed shear stress at arterial bifurcations impairs endothelial NO and promotes SR-BI/ALK1-mediated transcytosis of circulating apoB-100 lipoproteins (LDL, remnants, Lp(a)) into the intima (Borén et al., Nat Rev Cardiol 2025).'
    ),
    features: [
      t('ApoB partikül akısı (<70 nm çaplı LDL, remnant ve Lp(a) girişi)', 'ApoB particle influx (<70 nm LDL, remnants, and Lp(a) entry)'),
      t('Endotelyal eNOS / nitrik oksit (NO) biyoyararlanım kaybı', 'Loss of endothelial eNOS / nitric oxide (NO) bioavailability'),
      t('VCAM-1, ICAM-1 ve E-selektin adezyon ekspresyonu', 'VCAM-1, ICAM-1 and E-selectin leukocyte adhesion upregulation')
    ]
  },
  {
    stage: 2,
    id: 'retention',
    title: t('Evre 2: Subendotelyal Retansiyon ve Oksidatif Modifikasyon', 'Stage 2: Subendothelial Retention & Oxidative Modification'),
    desc: t(
      'İntimaya giren apoB partiküllerindeki pozitif yüklü lizin/arjinin rezidüleri, arter matriksindeki proteoglikanların (biglikan, versikan) negatif yüklü kondroitin sülfat yan zincirlerine elektrostatik olarak bağlanıp hapsolur. Küçük yoğun LDL (sdLDL) ve Lp(a) en yüksek retansiyon afinitesine sahiptir.',
      'Positively charged apoB residues bind electrostatically to negatively charged glycosaminoglycan chains of intimal proteoglycans (biglycan, versican). Small dense LDL (sdLDL) and Lp(a) exhibit the strongest retention.'
    ),
    features: [
      t('Proteoglikan-ApoB elektrostatik tuzağı (Retansiyon hipotezi)', 'Proteoglycan-apoB electrostatic trapping (Response-to-retention)'),
      t('ROS ve 12/15-lipooksijenaz ile oxLDL ve okside fosfolipid (OxPL) oluşumu', 'ROS and lipoxygenase-driven oxLDL and oxidized phospholipid (OxPL) generation'),
      t('Endotelden MCP-1 (CCL2) kemokin salınımı', 'Endothelial MCP-1 (CCL2) chemokine gradient secretion')
    ]
  },
  {
    stage: 3,
    id: 'foamcell',
    title: t('Evre 3: Makrofaj Göçü, Köpük Hücresi ve NLRP3 İnflamazomu', 'Stage 3: Macrophage Recruitment, Foam Cells & NLRP3 Inflammasome'),
    desc: t(
      'İntimaya geçen monositler makrofajlara dönüşür; CD36 ve SR-A çöpçü reseptörleri negatif geri-bildirim olmaksızın oxLDL yutarak köpük hücrelerini oluşturur. Hücre içi serbest kolesterol kristalleşmesi lizozomal hasar yaparak NLRP3 inflamazomunu ve IL-1β / IL-18 kaskadını ateşler.',
      'Recruited monocytes differentiate into macrophages that engulf oxLDL via scavenger receptors (CD36, SR-A) without feedback inhibition. Intracellular cholesterol crystals trigger lysosomal damage and NLRP3 inflammasome IL-1β/IL-18 activation.'
    ),
    features: [
      t('CD36 / SR-A aracılı doyumsuz oxLDL fagositozu', 'Unregulated CD36 / SR-A scavenger receptor oxLDL uptake'),
      t('Kolesterol kristalleri ve NLRP3 -> IL-1β / IL-6 / CRP aksı', 'Cholesterol crystals activating NLRP3 -> IL-1β / IL-6 / CRP axis'),
      t('Otoimmün T-hücresi (Th1 / IFN-γ) çapraz aktivasyonu (Porsch 2024)', 'Adaptive Th1 / IFN-gamma pro-inflammatory amplification (Porsch 2024)')
    ]
  },
  {
    stage: 4,
    id: 'fibrous',
    title: t('Evre 4: Fibroaterom, Nekrotik Çekirdek ve Kusurlu Efferositoz', 'Stage 4: Fibroatheroma, Necrotic Core & Defective Efferocytosis'),
    desc: t(
      'Medyadan göç eden düz kas hücreleri (VSMC) koruyucu kollajenöz fibröz kılıfı örer. Ancak aşırı yüklenen köpük hücrelerinin sekonder nekrozu ve ölü hücrelerin temizlenememesi (kusurlu efferositoz) lipidden zengin, hücresiz ve yüksek trombojenik nekrotik çekirdeği büyütür.',
      'Phenotype-switched VSMCs synthesize a protective collagenous fibrous cap, while macrophage apoptosis and defective efferocytosis expand the lipid-rich, tissue-factor-laden acellular necrotic core.'
    ),
    features: [
      t('VSMC göçü ve Tip I/III kollajen fibröz kılıf sentezi', 'VSMC migration and Type I/III collagen fibrous cap synthesis'),
      t('Kusurlu efferositoz (MerTK kaybı) ve büyüyen nekrotik çekirdek', 'Defective efferocytosis (MerTK cleavage) expanding the necrotic core'),
      t('Mikrokalsifikasyonlar ve kırılgan vasa vasorum neovaskülarizasyonu', 'Spotty microcalcifications and leaky intraplaque vasa vasorum')
    ]
  },
  {
    stage: 5,
    id: 'rupture',
    title: t('Evre 5: İnce Kılıflı Fibroaterom (TCFA) Rüptürü ve Tromboz', 'Stage 5: Thin-Cap Fibroatheroma (TCFA) Rupture & Thrombosis'),
    desc: t(
      'Makrofajlardan salınan MMP-1/8/13 kollajenazları fibröz kılıfı eritir ve IFN-γ VSMC kollajen sentezini baskılar. Kılıf <65 µm (TCFA) altına indiğinde mekanik duvar stresiyle yırtılır; doku faktörü (TF) kanla temas ederek trombosit agregasyonu ve akut tıkayıcı fibrin trombüsünü başlatır.',
      'Macrophage MMPs degrade cap collagen while IFN-gamma halts VSMC synthesis. Once cap thickness drops below 65 µm (TCFA), biomechanic shoulder stress causes rupture, exposing tissue factor to trigger occlusive arterial thrombosis.'
    ),
    features: [
      t('MMP-1/8/13 kollajenolizi ve kritik ince kılıf (<65 µm TCFA)', 'MMP-1/8/13 collagenolysis producing thin-cap fibroatheroma (<65 µm)'),
      t('Doku faktörü (TF) + Antifosfolipid/β2GPI trombojenik amplifikasyonu (Rashedi 2026)', 'Tissue factor exposure + antiphospholipid/beta2-GPI thrombotic amplification (Rashedi 2026)'),
      t('Akut lümen tıkanması ve Miyokard İnfarktüsü (STEMI / NSTEMI)', 'Acute luminal thrombosis causing Myocardial Infarction (ACS)')
    ]
  }
];

export const ATHEROMA_MODIFIERS = [
  {
    id: 'physiological',
    name: t('Standart / İzole Hiperkolesterolemi', 'Standard / Isolated Hypercholesterolaemia'),
    source: 'Borén et al. 2025 · Ference et al. 2024',
    apoBMult: 1.0,
    inflamMult: 1.0,
    thrombMult: 1.0,
    summary: t(
      'Plak gelişimi doğrudan plazma ApoB konsantrasyonu ve maruziyet süresiyle (kümülatif LDL-yıl) orantılıdır.',
      'Plaque progression scales linearly with plasma apoB concentration and cumulative exposure duration (LDL-years).'
    )
  },
  {
    id: 'masld',
    name: t('MASLD / Hepatik Steatoz + İnsülin Direnci', 'MASLD / Hepatic Steatosis + Insulin Resistance'),
    source: 'Averna, Hussain & Norata (Nat Rev Cardiol 2026)',
    apoBMult: 1.45,
    inflamMult: 1.35,
    thrombMult: 1.15,
    summary: t(
      'Karaciğer yağlanması (MASLD) de novo lipogenezi ve büyük VLDL1 sekresyonunu artırır; CETP aracılı değişimle proteoglikanlara çok sıkı bağlanan aterojenik küçük-yoğun LDL (sdLDL) ve trigliseridden zengin kalıntı (remnant) akısı patlar.',
      'Hepatic steatosis (MASLD) drives VLDL1 overproduction and CETP-mediated remodeling into highly retentive small dense LDL (sdLDL) and cholesterol-enriched remnants.'
    )
  },
  {
    id: 'autoimmune',
    name: t('Otoimmünite / Psoriazis / Kardiyodermatoloji', 'Autoimmune / Psoriasis / Cardiodermatology'),
    source: 'Porsch & Binder (2024) · Gelfand et al. (2025)',
    apoBMult: 1.1,
    inflamMult: 2.1,
    thrombMult: 1.4,
    summary: t(
      'Sistemik otoimmün hastalıklar (SLE, Romatoid Artrit) ve şiddetli psoriazis (kardiyodermatoloji aksı); IL-17, TNF, IFN-γ ve NETozis yoluyla endotel bariyerini bozar, efferositozu felç eder ve normal LDL düzeylerinde bile hızlanmış TCFA rüptürüne yol açar.',
      'Systemic autoimmunity (SLE, RA) and psoriasis amplify IL-17/TNF/IFN-gamma signaling and neutrophil NETosis, accelerating fibrous cap thinning even at moderate LDL levels.'
    )
  },
  {
    id: 'aps',
    name: t('Antifosfolipid Sendromu (aPL / Anti-β2GPI)', 'Antiphospholipid Syndrome (aPL / Anti-β2GPI)'),
    source: 'Rashedi et al. (Nat Rev Cardiol 2026)',
    apoBMult: 1.05,
    inflamMult: 1.65,
    thrombMult: 2.4,
    summary: t(
      'Anti-β2-glikoprotein I ve antikardiyolipin antikorları endotel yüzeyindeki TLR4/ApoER2 reseptörlerine bağlanarak eNOS’u susturur, kompleman (C5a) ve Doku Faktörü (TF) ekspresyonunu tetikler; oxLDL-β2GPI kompleksleri makrofaj köpükleşmesini ve akut arteriyel trombozu katlar.',
      'Anti-beta2-GPI antibodies engage endothelial TLR4/ApoER2 to suppress eNOS, activate complement, upregulate Tissue Factor, and form immunogenic oxLDL-beta2GPI complexes.'
    )
  }
];

// ISCHEMIC CASCADE & MVO2 DETERMINANTS
export const ISCHEMIA_CASCADE_STAGES = [
  {
    stage: 1,
    id: 'perfusion',
    title: t('1. Perfüzyon Uyuşmazlığı ve Biyokimyasal Değişim', '1. Perfusion Mismatch & Biochemical Shift'),
    time: t('Saniyeler içinde (0 - 10 sn)', 'Within seconds (0 - 10 sec)'),
    desc: t(
      'Koroner kan akımı miyokard oksijen ihtiyacını karşılayamadığında (Arz < Talep), dakikalar içinde aerobik metabolizma durur; anaerobik glikoliz ile laktat üretimi artar, intraselüler pH hızla asidoza kayar ve kreatin fosfat / ATP havuzu tükenir.',
      'When coronary supply falls below myocardial demand, aerobic metabolism arrests within seconds; anaerobic glycolysis produces lactate, intracellular pH drops, and high-energy phosphagen stores are rapidly depleted.'
    ),
    findings: t('Hücresel ATP düşüşü, laktat artışı, mikrovasküler vazodilatasyon (adenozin salınımı).', 'Intracellular ATP depletion, lactate accumulation, endogenous adenosine release.')
  },
  {
    stage: 2,
    id: 'diastolic',
    title: t('2. Diyastolik Gevşeme Bozukluğu (Lüzitropi Kaybı)', '2. Diastolic Relaxation Impairment (Loss of Lusitropy)'),
    time: t('10 - 20 saniye', '10 - 20 seconds'),
    desc: t(
      'Miyokardiyal gevşeme (lüzitropi) ATP bağımlı aktif bir süreçtir! SERCA2a pompası kalsiyumu sarkoplazmik retikuluma geri çekmek için enerji bulamaz. Sitoplazmik kalsiyum yüksek kalır; gevşeme gecikir, sol ventrikül diyastol sonu basıncı (LVEDP) fırlar ve sol atriyuma geri yansıyarak dispneye neden olur.',
      'Myocardial relaxation is an active ATP-dependent process. Failure of SERCA2a to resequester Ca2+ into the sarcoplasmic reticulum delays relaxation, precipitously elevating LV end-diastolic pressure (LVEDP) and causing early dyspnea.'
    ),
    findings: t('LVEDP artışı (>18 mmHg), pulmoner venöz konjesyon, S4 galop sesi.', 'Elevated LVEDP (>18 mmHg), pulmonary venous congestion, S4 gallop.')
  },
  {
    stage: 3,
    id: 'systolic',
    title: t('3. Sistolik Kasılma Kusuru ve Duvar Hareketi Anomalisi', '3. Systolic Wall Motion Abnormality (Hypokinesia to Akinesia)'),
    time: t('20 - 30 saniye', '20 - 30 seconds'),
    desc: t(
      'ATP tükenmesi aktomiyozin çapraz köprü döngüsünü durdurur. İskemik miyokard segmenti aktif kasılmayı keser; önce hipokinezi (azalmış kasılma), ardından akinezi (sıfır kasılma) ve şiddetli iskemide çevre intrakaviter basıncın etkisiyle sistolde dışa bombeleşme (diskinezi) izlenir.',
      'Depleted ATP halts actomyosin cross-bridge cycling. The ischemic myocardial zone ceases active contraction, progressing from hypokinesia to akinesia and paradoxical systolic ballooning (dyskinesia).'
    ),
    findings: t('Bölgesel duvar hareket kusuru (Ekokardiyografi), fırlatma fraksiyonunda (EF) geçici düşüş.', 'Regional wall motion abnormality on echo, transient reduction in ejection fraction.')
  },
  {
    stage: 4,
    id: 'ecg',
    title: t('4. Elektrokardiyografik (EKG) Değişiklikler', '4. Electrocardiographic (ECG) Manifestations'),
    time: t('30 - 60 saniye', '30 - 60 seconds'),
    desc: t(
      'İntraselüler asidoz ve Na+/K+ ATPaz pompa yetersizliği istirahat membran potansiyelini depolarize eder, aksiyon potansiyel süresini kısaltır. İskemik ve normal doku arasında yaralanma akımı (current of injury) doğar: Subendokardiyal iskemide ST çökmesi ve T negatifliği; transmural iskemide ise ST elevasyonu görülür.',
      'Loss of Na+/K+ ATPase activity and acidosis depolarize the resting membrane potential, creating a diastolic current of injury: ST-segment depression in subendocardial ischemia versus ST-segment elevation in transmural ischemia.'
    ),
    findings: t('Subendokardiyal iskemi: ST çökmesi (≥1 mm), T negatifliği. Transmural STEMI: ST elevasyonu.', 'Subendocardial: ST depression (≥1 mm), T-wave inversion. Transmural: ST elevation (STEMI).')
  },
  {
    stage: 5,
    id: 'angina',
    title: t('5. Klinik Angina Pektoris (Göğüs Ağrısı)', '5. Clinical Angina Pectoris (Chest Discomfort)'),
    time: t('> 60 saniye (Kaskadın en son halkası)', '> 60 seconds (Final step of the cascade)'),
    desc: t(
      'İskemik dokuda biriken adenozin, bradikinin, laktat ve serotonin; kardiyak sempatik afferent C-liflerini ve T1-T4 spinal gangliyonlarını uyarır. Hasta retrosternal baskı, sıkışma, sol kola veya alt çeneye yayılan tipik angina pektoris ağrısını hisseder. (Önemli not: Ağrı iskemik hasar başladıktan dakikalar sonra ortaya çıkar; sessiz iskemi bu evre olmaksızın seyreder!).',
      'Locally generated adenosine, bradykinin, and serotonin excite cardiac sympathetic afferent C-fibres transmitting through T1-T4 spinal segments, perceived as retrosternal pressure radiating to the left arm or jaw. (Crucial: Pain is the final threshold of the cascade; silent ischemia occurs if this threshold is not reached).'
    ),
    findings: t('Retrosternal baskı/yanma, sol kola/çeneye yayılım, istirahatle veya nitrogliserinle rahatlama.', 'Retrosternal squeezing/pressure, radiation to arm/jaw, relief with rest or nitroglycerin.')
  }
];

export const MVO2_DETERMINANTS = {
  demand: [
    { id: 'hr', name: t('Kalp Hızı (Kronotropi)', 'Heart Rate (Chronotropy)'), effect: t('Dakikadaki kasılma sayısı arttıkça ATP ve oksijen sarfiyatı doğrusal artar.', 'Linear increase in ATP and O2 consumption per unit time.') },
    { id: 'wall_stress', name: t('Sistolik Duvar Gerilimi (Laplace: σ = P·r / 2h)', 'Systolic Wall Stress (Laplace: σ = P·r / 2h)'), effect: t('Yüksek sistolik arter basıncı (P) veya dilate ventrikül (r) duvar gerilimini patlatır.', 'Elevated intraventricular pressure (P) or dilated radius (r) escalates wall stress.') },
    { id: 'contractility', name: t('Miyokardiyal Kontraktilite (İnotropi)', 'Myocardial Contractility (Inotropy)'), effect: t('Miyofilament çapraz köprü dönüş hızı ve kalsiyum döngüsü enerji tüketir.', 'Cross-bridge turnover velocity and cycling consume high energy.') }
  ],
  supply: [
    { id: 'diastole_time', name: t('Diyastol Süresi', 'Diastolic Perfusion Time'), effect: t('Sol ventrikül subendokardiyumu yalnızca diyastolde beslenir; taşikardi diyastolü kısaltır.', 'LV subendocardium is perfused almost exclusively in diastole; tachycardia shortens diastole.') },
    { id: 'coronary_cpp', name: t('Koroner Perfüzyon Basıncı (CPP = Ao_diyastolik - LVEDP)', 'Coronary Perfusion Pressure (CPP = Ao_diastolic - LVEDP)'), effect: t('Diyastolik aort basıncı ile sol ventrikül dolum basıncı arasındaki farktır.', 'Driving pressure gradient between diastolic aortic pressure and LVEDP.') },
    { id: 'coronary_resistance', name: t('Koroner Vasküler Direnç (Otoregülasyon)', 'Coronary Vascular Resistance (Autoregulation)'), effect: t('Metabolik vazodilatasyon (adenozin, NO); aterosklerozda darlık ve endotel disfonksiyonu.', 'Metabolic vasodilators (adenosine, NO); blunted by atherosclerotic stenosis.') }
  ]
};

// PERICARDIAL DISORDERS (TAMPONADE VS CONSTRICTION)
export const PERICARDIAL_DISORDERS = [
  {
    id: 'normal',
    name: t('Normal Perikard', 'Normal Pericardium'),
    desc: t('Normal esnek fibroseröz perikard (15-50 mL seröz sıvı). Biyomekanik rezerv dolmadan intrakardiyak basınca direnç göstermez.', 'Compliant fibroserous sac containing 15-50 mL fluid, accommodating physiologic volume swings without compressive constraint.'),
    fluid: 25,
    pressure: 0,
    pulsus: 4,
    jvp: { x: 'normal', y: 'normal', kussmaul: false }
  },
  {
    id: 'tamponade_acute',
    name: t('Akut Kardiyak Tamponad (Hemoperikardiyum)', 'Acute Cardiac Tamponade (Hemopericardium)'),
    desc: t('Aort diseksiyonu veya miyokard rüptürü sonrası dakikalar içinde 150-250 mL kan birikir. Perikard esneyemez; basınç hızla 15-25 mmHg seviyesine fırlar, sağ ventrikül diyastolik kollapsa uğrar.', 'Rapid accumulation of 150-250 mL blood (aortic dissection, rupture) exhausts reserve volume, spiking intrapericardial pressure to 15-25 mmHg and collapsing thin-walled right chambers.'),
    fluid: 200,
    pressure: 20,
    pulsus: 22,
    jvp: { x: 'prominent', y: 'absent_blunted', kussmaul: false }
  },
  {
    id: 'tamponade_chronic',
    name: t('Kronik Kardiyak Tamponad (Malignite / Tüberküloz)', 'Chronic Cardiac Tamponade (Malignant / TB)'),
    desc: t('Haftalar/aylar içinde perikard yavaşça esner ve yeniden şekillenir; 1000-1500 mL sıvı tolere edilebilir. Ancak kritik gerilme sınırına ulaşıldığında ani dekompansasyon ve tamponad gelişir.', 'Slow fluid accumulation over weeks allows pericardial remodeling, tolerating up to 1500 mL before reaching the steep portion of the compliance curve where tamponade ensues.'),
    fluid: 850,
    pressure: 16,
    pulsus: 18,
    jvp: { x: 'prominent', y: 'absent_blunted', kussmaul: false }
  },
  {
    id: 'constriction',
    name: t('Konstriktif Perikardit (Kalsifiye Rijit Zırh)', 'Constrictive Pericarditis (Rigid Calcified Armor)'),
    desc: t('Kronik enflamasyon sonrası perikard fibrotik, kalsifiye bir zırha dönüşür. Sıvı azdır ancak kalp sert bir kutu içine hapsolmuştur. Erken diyastolde dolum çok hızlı başlar fakat orta diyastolde aniden durur (karekök trasesi).', 'Fibrotic, calcified, inelastic pericardial shell encasing the heart. Diastolic filling is rapid in early diastole but abruptly halted in mid-diastole (dip-and-plateau / square-root sign).'),
    fluid: 40,
    pressure: 18,
    pulsus: 6,
    jvp: { x: 'prominent', y: 'sharp_deep', kussmaul: true }
  }
];

// HEART FAILURE & CARDIOMYOPATHY PHENOTYPES
export const HF_PHENOTYPES = [
  {
    id: 'normal',
    name: t('Normal Ventrikül Referansı', 'Normal Reference Ventricle'),
    ef: '60%',
    edv: 120,
    esv: 48,
    wallThickness: 'Normal (10 mm)',
    lvedp: '8-10 mmHg',
    pcwp: '10 mmHg',
    gallop: t('Yok', 'None'),
    mechanism: t('Normal sistolik kasılma, normal diyastolik lüzitropi, fizyolojik duvar gerilimi.', 'Normal systolic elastance, normal diastolic compliance, balanced wall stress.')
  },
  {
    id: 'hfref',
    name: t('HFrEF (Sistolik Kalp Yetersizliği / Eksantrik Dilatasyon)', 'HFrEF (Systolic HF / Eccentric Remodeling)'),
    ef: '28%',
    edv: 240,
    esv: 172,
    wallThickness: 'İncelmiş / Orantısız (8-9 mm)',
    lvedp: '26 mmHg',
    pcwp: '25 mmHg',
    gallop: t('S3 Galopu (Hızlı doluşta aşırı hacim çalkantısı)', 'S3 Gallop (Volume overload sloshing into dilated LV)'),
    mechanism: t('Miyosit kaybı veya iskemi -> primer kontraktilite çöküşü (düşük Ees). Kompansatuar eksantrik dilatasyon Laplace duvar stresini patlatır (σ = P·r / 2h). Frank-Starling iniş koluna geçilir.', 'Primary loss of inotropy. Cavity dilation dramatically increases wall stress (Laplace). Ventricle operates on the flat, descending limb of the Frank-Starling curve.')
  },
  {
    id: 'hfpef',
    name: t('HFpEF (Diyastolik Kalp Yetersizliği / Konsantrik Hipertrofi)', 'HFpEF (Diastolic HF / Concentric Remodeling)'),
    ef: '58%',
    edv: 105,
    esv: 44,
    wallThickness: 'Belirgin Kalınlaşmış (14-16 mm)',
    lvedp: '24 mmHg',
    pcwp: '22 mmHg',
    gallop: t('S4 Galopu (Sert duvara atriyal vuru)', 'S4 Gallop (Atrial kick against stiff noncompliant wall)'),
    mechanism: t('Kronik hipertansiyon/yaşlanma -> konsantrik miyosit hipertrofisi ve interstisyel fibrozis. EDV normaldir ancak pasif diyastolik eğri (EDPVR) aşırı dikleşmiştir; küçük hacim artışı bile devasa basınç yaratır.', 'Concentric remodeling and titin hypophosphorylation stiffen the myocardium. EDPVR is steep; small volume increments cause dramatic pressure surges into lungs.')
  },
  {
    id: 'hcm',
    name: t('Hipertrofik Kardiyomiyopati (HCM / Dinamik LVOT & SAM)', 'Hypertrophic Cardiomyopathy (HCM / Dynamic LVOT & SAM)'),
    ef: '72%',
    edv: 95,
    esv: 26,
    wallThickness: 'Asimetrik Septal Hipertrofi (22 mm)',
    lvedp: '22 mmHg',
    pcwp: '18 mmHg',
    gallop: t('S4 Galopu + Kreşendo-Dekreşendo Üfürüm', 'S4 Gallop + Dynamic Ejection Murmur'),
    mechanism: t('Sarkomer mutasyonları (MYH7, MYBPC3) -> kaotik miyosit dizilimi (disarray), asimetrik septal kalınlaşma. Sistolde fırlayan kanın yarattığı Venturi etkisi mitral ön yaprakçığı septuma çeker (SAM), dinamik LVOT obstrüksiyonu doğar!', 'Sarcomere mutations cause asymmetric septal hypertrophy. High-velocity systolic ejection creates a Venturi drag that pulls the anterior mitral leaflet toward the septum (SAM), obstructing LVOT.')
  },
  {
    id: 'dcm',
    name: t('Dilate Kardiyomiyopati (DCM / 4-Odacık Genişlemesi)', 'Dilated Cardiomyopathy (DCM / 4-Chamber Dilation)'),
    ef: '22%',
    edv: 270,
    esv: 210,
    wallThickness: 'İncelmiş Globüler Duvar',
    lvedp: '28 mmHg',
    pcwp: '26 mmHg',
    gallop: t('S3 Galopu + Fonksiyonel Mitral/Triküspit Yetersizliği', 'S3 Gallop + Functional MR/TR'),
    mechanism: t('Toksik (alkol/kemoterapi), viral miyokardit veya genetik (titin mutasyonu). Ventrikül elipsoid formdan küre formuna döner. Papiller kas ayrışması fonksiyonel mitral kaçak yaratır.', 'Spherical chamber remodeling with diffuse hypokinesia. Papillary muscle displacement causes tethering and functional mitral regurgitation, worsening forward output.')
  },
  {
    id: 'rcm',
    name: t('Restriktif Kardiyomiyopati (RCM / Amiloidoz & Karekök Trasesi)', 'Restrictive Cardiomyopathy (RCM / Amyloid & Square-Root)'),
    ef: '52%',
    edv: 98,
    esv: 47,
    wallThickness: 'Rijit Homojen Kalınlaşma (15 mm)',
    lvedp: '26 mmHg',
    pcwp: '25 mmHg',
    gallop: t('S4 veya S3 + İki Taraflı Devasa Atriyal Büyüme', 'S4 or S3 + Biatrial Dilatation'),
    mechanism: t('Amiloid fibrilleri, sarkoid granülomları veya hemokromatozis demiri miyositler arasına çöker. Ventrikül boyutları küçüktür ancak duvarlar tahta gibi serttir. Erken dolum sonrası basınç birden plato çizer (karekök işareti).', 'Amyloid or fibrotic infiltration turns myocardium rigid. Normal LV dimensions but massive biatrial enlargement. Diastolic pressure exhibits abrupt mid-diastolic arrest (dip-and-plateau).')
  }
];

// DYNAMIC AUSCULTATION MANEUVERS
export const VALVULAR_MANEUVERS = [
  {
    id: 'valsalva',
    name: t('Valsalva Manevrası (Faza 2: Gerilme / Strain)', 'Valsalva Maneuver (Phase 2 Strain)'),
    effect: t('İntratorasik basınç artar -> Venöz dönüş ve Ön Yük (Preload) azalır; LV hacmi küçülür.', 'Increased intrathoracic pressure decreases venous return and preload; reduces LV volume.'),
    murmurs: t('Çoğu organik üfürüm (AS, MR, AR) AZALIR; HCM ve MVP üfürümleri ARTAR ve öne kayar!', 'Most murmurs (AS, MR, AR) DECREASE; HCM and MVP murmurs INCREASE and become more prolonged!')
  },
  {
    id: 'squatting',
    name: t('Çömelme (Squatting)', 'Squatting Maneuver'),
    effect: t('Femoral venler sıkışır -> Venöz dönüş ve Ön Yük (Preload) ARTAR; sistemik direnç (Ard Yük) ARTAR.', 'Compression of femoral vessels increases preload and systemic vascular resistance (afterload).'),
    murmurs: t('AS, AR ve MR üfürümleri ARTAR; HCM üfürümü belirgin AZALIR; MVP klik/üfürümü gecikir!', 'Murmurs of AS, AR, and MR INCREASE; HCM murmur DECREASES markedly; MVP click delays!')
  },
  {
    id: 'handgrip',
    name: t('El Sıkma (İzometrik Handgrip)', 'Isometric Handgrip Maneuver'),
    effect: t('Periferik arteriyel direnç ve Ard Yük (Afterload) belirgin ARTAR.', 'Substantial increase in systemic vascular resistance (afterload) and arterial pressure.'),
    murmurs: t('Geri kaçış üfürümleri (MR, AR, VSD) belirgin ARTAR; AS üfürümü hafif azalır; HCM üfürümü AZALIR!', 'Regurgitant murmurs (MR, AR, VSD) INCREASE; AS murmur decreases slightly; HCM murmur DECREASES!')
  }
];

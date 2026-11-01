// Cardiovascular Pathophysiology Studio: stations, didactic models, and bilingual content.
// Grounded in Nature Reviews Cardiology (2024-2026) and Physiological Reviews:
// Suga-Sagawa elastance, Frank-Starling, Laplace wall stress, Boren (2025) apoB retention,
// Ference & Braunwald (2024) cumulative LDL exposure, Averna (2026) MASLD-dyslipidemia,
// Porsch (2024) & Gelfand (2025) immuno-atherogenesis, Rashedi (2026) antiphospholipid thrombosis,
// Masenga (2025) salt sensitivity, Sayer (2025) & Min (2025) hypertension & pulse wave reflection,
// Ghofrani (2025) PAH & BMPR2/Activin signaling, Omerovic (2026) Takotsubo syndrome,
// Zelniker & Braunwald (2026) SGLT2i CKM protection, Brakenhielm (2026) cardiac lymphatics,
// Park & Fishman (2026) & Lee (2026) conduction system & CSP, Cepas-Guillen (2025) ACHD shunts.

const t = (tr, en) => ({ tr, en });

export const PATHOPHYS_GROUPS = [
  {
    id: 'mechanics',
    label: t('I. Ventrikül Mekaniği ve Döngü', 'I. Ventricular Mechanics & Cycle')
  },
  {
    id: 'vascular',
    label: t('II. Vasküler Biyoloji, Aterom ve Basınç', 'II. Vascular Biology, Atheroma & Pressure')
  },
  {
    id: 'myocardial',
    label: t('III. Miyokard, Metabolizma ve İleti', 'III. Myocardium, Metabolism & Conduction')
  },
  {
    id: 'structural',
    label: t('IV. Kapak, Doğuştan Şant ve Akut Şok', 'IV. Valvular, Congenital Shunts & Shock')
  }
];

export const PATHOPHYS_STATIONS = [
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
    title: t('Görsel Fizyoloji Rehberi', 'Visual Physiology Guide'),
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
    title: t('Canlı Wiggers Diyagramı', 'Live Wiggers Diagram'),
    shortTitle: t('Canlı Wiggers', 'Live Wiggers'),
    intro: t(
      'Sol ve sağ kalp basınçları, LV hacmi ve EKG aynı döngü saatinde: oynatın, dondurun, kalp hızını değiştirin ya da döngüde gezinin.',
      'Left and right heart pressures, LV volume and the ECG on one cardiac clock: play, freeze, change the heart rate or scrub through the cycle.'
    )
  },
  {
    id: 'atherogenesis',
    num: '06',
    group: 'vascular',
    title: t('Aterogenez, Kümülatif LDL, MASLD ve İmmüno-Tromboz Kanvası', 'Atherogenesis, Cumulative LDL, MASLD and Immuno-Thrombosis Canvas'),
    shortTitle: t('Aterom ve LDL Kanvası', 'Atheroma & LDL Canvas'),
    intro: t(
      'Borén (2025), Ference ve Braunwald (2024), Averna (2026), Porsch (2024) ve Rashedi (2026) ışığında: Karaciğer steatozundan (MASLD) ApoB retansiyonuna, kümülatif LDL maruziyet eğrisinden otoimmün/aPL aracılı plak yırtılmasına canlı çoklu-organ sahnesi.',
      'Interactive multi-organ canvas integrating hepatic steatosis (MASLD) VLDL overproduction, subendothelial apoB retention, cumulative LDL-years plaque threshold, and autoimmune/antiphospholipid thrombosis.'
    )
  },
  {
    id: 'hypertension-vascular',
    num: '07',
    group: 'vascular',
    title: t('Hipertansiyon, Tuz Duyarlılığı ve Arteryel Dalga Yansıması', 'Hypertension, Salt Sensitivity and Arterial Wave Reflection'),
    shortTitle: t('Hipertansiyon ve PWV', 'Hypertension & PWV'),
    intro: t(
      'Masenga (2025), Sayer (2025) ve Min (2025) çerçevesi: Renal sodyum tutulumu (basınç natriürezi), endotelin/aldosteron ekseni, direnç arteriyolü yeniden yapılanması ve aortik nabız dalgası hızı (PWV) augmentasyon simülatörü.',
      'Explore renal pressure-natriuresis shifting, neurohormonal/endothelin activation, resistance arteriole remodeling, aortic pulse wave velocity (PWV) reflection augmentation, and novel antihypertensive targets.'
    )
  },
  {
    id: 'pah-rv',
    num: '08',
    group: 'vascular',
    title: t('Pulmoner Arteriyel Hipertansiyon (PAH) ve Sağ Kalp Eşleşmesi', 'Pulmonary Arterial Hypertension (PAH) and Right Ventricular Coupling'),
    shortTitle: t('Pulmoner HT ve Sağ Kalp', 'PAH & Right Heart'),
    intro: t(
      'Ghofrani (2025) 4-yolak modeli: BMPR2/Activin-Inhibin dengesizliği (sotatercept hedefi), endotelin, NO-sGC-cGMP ve prostasiklin yolakları; pleksiform arteriyoler obliterasyon ve interventriküler septumun sola (D-şekilli LV) kayması.',
      'Four-pathway pulmonary vascular remodeling (BMPR2/Activin signaling, Endothelin-1, NO-sGC-cGMP, Prostacyclin), plexiform arteriopathy, and biventricular D-shape interdependence.'
    )
  },
  {
    id: 'myocardial-ckm',
    num: '09',
    group: 'myocardial',
    title: t('Takotsubo Sendromu, CKM (SGLT2i) ve Kardiyak Lenfatikler', 'Takotsubo Syndrome, CKM (SGLT2i) and Cardiac Lymphatics'),
    shortTitle: t('Takotsubo, CKM ve Lenfatik', 'Takotsubo, CKM & Lymphatics'),
    intro: t(
      'Omerovic (2026) Takotsubo katekolamin fırtınası ve β2-AR Gs→Gi sinyal anahtarı; Zelniker ve Braunwald (2026) SGLT2i miyokardiyal NHE-1/keton kardiyoproteksiyonu; Brakenhielm (2026) kardiyak lenfatik ödem drenajı ve fibrozis çözünümü.',
      'Interactive simulation of Takotsubo apical ballooning (beta-2 Gs-to-Gi switch), SGLT2i cardio-kidney-metabolic (CKM) energetics, and cardiac lymphatic VEGFC/VEGFR3 edema clearance.'
    )
  },
  {
    id: 'electrophys',
    num: '10',
    group: 'myocardial',
    title: t('Aksiyon Potansiyeli, İleti Sistemi (CCS) ve Fizyolojik Pacing', 'Action Potential, Conduction System (CCS) and Physiological Pacing'),
    shortTitle: t('İleti Sistemi ve Aritmi', 'Conduction & Arrhythmia'),
    intro: t(
      'Park ve Fishman (2026) ile Lee (2026) ışığında: Ventrikül/nodal iyon akımları (EAD, DAD, reentry), nodal (Tbx3/Hcn4) vs hızlı ileti (Nkx2-5/Scn5a/Cx40) genetik mimarisi ve LBBB dissenkronisinin Sol Dal Alanı Uyarımı (LBBAP/CSP) ile restorasyonu.',
      'Cellular action potentials (EAD, DAD, reentry), transcriptional architecture of the cardiac conduction system, and mechanical resynchronization via Conduction System Pacing (LBBAP/HBP).'
    )
  },
  {
    id: 'valvular',
    num: '11',
    group: 'structural',
    title: t('Kapak Hastalıkları ve Basınç Gradyanları', 'Valvular Disease and Pressure Gradients'),
    shortTitle: t('Kapak Gradyanları', 'Valvular Gradients'),
    intro: t(
      'Aort darlığı, aort yetersizliği, mitral darlığı ve mitral yetersizliğinde eşzamanlı sol ventrikül, sol atriyum ve aort basınç dalgaları, tepe/ortalama gradyanlar ve hacim aşırı yükü.',
      'Simultaneous LV, LA and aortic pressure waveforms in aortic stenosis, aortic regurgitation, mitral stenosis and mitral regurgitation with transvalvular gradients.'
    )
  },
  {
    id: 'achd-shunts',
    num: '12',
    group: 'structural',
    title: t('Erişkin Doğuştan Kalp Hastalıkları (ACHD) ve Şant Dinamiği', 'Adult Congenital Heart Disease (ACHD) and Shunt Dynamics'),
    shortTitle: t('Doğuştan Şantlar (ACHD)', 'Congenital Shunts (ACHD)'),
    intro: t(
      'Cepas-Guillén (2025) çerçevesi: ASD, VSD ve PDA kusurlarında Qp/Qs şant akışı, odacık hacim/basınç aşırı yükü, pulmoner vasküler hastalık gelişimiyle Eisenmenger sendromu (sağ-sol şant tersinmesi ve siyanoz) ve transkateter kapama kriterleri.',
      'Interactive 4-chamber shunt simulator for ASD, VSD, and PDA: live Qp/Qs calculation, chamber overload, progression to Eisenmenger reversal with systemic cyanosis, and transcatheter closure eligibility.'
    )
  },
  {
    id: 'forrester',
    num: '13',
    group: 'structural',
    title: t('Akut Kalp Yetersizliği ve Forrester Hemodinamiği', 'Acute Heart Failure and Forrester Hemodynamics'),
    shortTitle: t('Forrester Matrisi', 'Forrester Matrix'),
    intro: t(
      'Kardiyak İndeks (Perfüzyon: Sıcak/Soğuk) ve Pulmoner Kapiller Uç Basıncı (Konjesyon: Kuru/Islak) 2×2 matrisi: Klinik fenotipler, hemodinamik hedefler ve acil tedavi yanıtları.',
      'Cardiac Index (Perfusion: Warm/Cold) vs Pulmonary Capillary Wedge Pressure (Congestion: Dry/Wet) 2×2 matrix: Clinical subsets, targets and emergency interventions.'
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
    name: t('Otoimmünite / Psoriazis / SLE İnflamasyonu', 'Autoimmune / Psoriasis / SLE Inflammation'),
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

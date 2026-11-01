// Cardiovascular Pathophysiology Studio: stations, didactic models, and bilingual content.
// Time-varying elastance, Frank-Starling tension, Laplace stress, atheroma biology,
// cardiac arrhythmogenesis, and Forrester hemodynamic subsets.

const t = (tr, en) => ({ tr, en });

export const PATHOPHYS_STATIONS = [
  {
    id: 'pv-loop',
    num: '01',
    title: t('Basınç-Hacim (PV) Döngüsü ve Ventrikül Mekaniği', 'Pressure-Volume (PV) Loop and Ventricular Mechanics'),
    shortTitle: t('PV Döngüsü', 'PV Loop'),
    intro: t(
      'Suga ve Sagawa zamanla değişen elastans çerçevesi: Ön-yük, ard-yük, kontraktilite (Ees) ve diyastolik sertlik (EDPVR) arasındaki etkileşimi canlı inceleyin.',
      'Time-varying elastance framework of Suga and Sagawa: interactively explore preload, afterload, inotropy (Ees) and diastolic stiffness (EDPVR).'
    )
  },
  {
    id: 'starling-laplace',
    num: '02',
    title: t('Frank-Starling Yasası ve Laplace Duvar Stresi', 'Frank-Starling Law and Laplace Wall Stress'),
    shortTitle: t('Starling ve Laplace', 'Starling & Laplace'),
    intro: t(
      'Miyofilament sarkomer gerim-uzunluk ilişkisi ile intrakaviter basınç, lümen yarıçapı ve duvar kalınlığının (Laplace yasası: σ = P·r / 2h) belirlediği duvar stresini ve ventriküler yeniden yapılanmayı simüle edin.',
      'Simulate sarcomere length-tension relations and myocardial wall stress determined by cavity pressure, radius and wall thickness (Laplace law: σ = P·r / 2h).'
    )
  },
  {
    id: 'atherogenesis',
    num: '03',
    title: t('Aterogenez ve Plak Biyolojisi', 'Atherogenesis and Plaque Biology'),
    shortTitle: t('Aterom ve Plak', 'Atheroma & Plaque'),
    intro: t(
      'Endotelyal disfonksiyon ve apoB transsitozundan subendotelyal retansiyona, köpük hücresi birikiminden MMP kaynaklı fibröz kılıf incelmesi ve akut plak rüptürüne kadar 5 evreli aterom kaskadı.',
      'The 5-stage atheroma cascade: endothelial dysfunction, apoB particle retention, foam cell formation, necrotic core expansion, and MMP-driven fibrous cap rupture.'
    )
  },
  {
    id: 'electrophys',
    num: '04',
    title: t('Kardiyak Aksiyon Potansiyeli ve Aritmojenezi', 'Cardiac Action Potential and Arrhythmogenesis'),
    shortTitle: t('Aksiyon Potansiyeli', 'Action Potential'),
    intro: t(
      'Ventrikül ve nodal aksiyon potansiyeli iyon akımları (INa, ICa,L, IK, If) ile erken ard-depolarizasyonlar (EAD), geç ard-depolarizasyonlar (DAD) ve tek yönlü bloklu reentry devreleri.',
      'Ventricular and nodal action potential ion currents (INa, ICa,L, IK, If) alongside early afterdepolarizations (EAD), delayed afterdepolarizations (DAD), and reentry circuits.'
    )
  },
  {
    id: 'forrester',
    num: '05',
    title: t('Akut Kalp Yetersizliği ve Forrester Hemodinamiği', 'Acute Heart Failure and Forrester Hemodynamics'),
    shortTitle: t('Forrester Matrisi', 'Forrester Matrix'),
    intro: t(
      'Kardiyak İndeks (Perfüzyon: Sıcak/Soğuk) ve Pulmoner Kapiller Uç Basıncı (Konjesyon: Kuru/Islak) 2×2 matrisi: Klinik fenotipler, hemodinamik hedefler ve acil tedavi yanıtları.',
      'Cardiac Index (Perfusion: Warm/Cold) vs Pulmonary Capillary Wedge Pressure (Congestion: Dry/Wet) 2×2 matrix: Clinical subsets, targets and emergency interventions.'
    )
  },
  {
    id: 'valvular',
    num: '06',
    title: t('Kapak Hastalıkları ve Basınç Gradyanları', 'Valvular Disease and Pressure Gradients'),
    shortTitle: t('Kapak Gradyanları', 'Valvular Gradients'),
    intro: t(
      'Aort darlığı, aort yetersizliği, mitral darlığı ve mitral yetersizliğinde eşzamanlı sol ventrikül, sol atriyum ve aort basınç dalgaları, tepe/ortalama gradyanlar ve hacim aşırı yükü.',
      'Simultaneous LV, LA and aortic pressure waveforms in aortic stenosis, aortic regurgitation, mitral stenosis and mitral regurgitation with transvalvular gradients.'
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
    title: t('Evre 1: Endotelyal Disfonksiyon ve Transsitoz', 'Stage 1: Endothelial Dysfunction & Transcytosis'),
    desc: t(
      'Bifürkasyon ve eğriliklerde bozulmuş laminar shear stress, endotel geçirgenliğini artırır. VCAM-1 ve ICAM-1 adezyon molekülleri eksprese edilir; apoB içeren lipoproteinler endoteli geçerek subendotelyal boşluğa girer.',
      'Disturbed shear stress at arterial bifurcations enhances endothelial permeability. VCAM-1 and ICAM-1 are upregulated; circulating apoB lipoproteins cross into the subendothelial space.'
    ),
    features: [
      t('ApoB partikül girişi (LDL, Lp(a), Remnant)', 'ApoB particle influx (LDL, Lp(a), remnants)'),
      t('Endotelyal nitrik oksit (NO) sentezi azalması', 'Reduced endothelial nitric oxide (NO) bioavailability'),
      t('Lökosit adezyon reseptör aktivasyonu', 'Leukocyte adhesion receptor activation')
    ]
  },
  {
    stage: 2,
    id: 'retention',
    title: t('Evre 2: Subendotelyal Retansiyon ve Oksidasyon', 'Stage 2: Subendothelial Retention & Oxidation'),
    desc: t(
      'İntimaya giren apoB partikülleri, matriks proteoglikanlarının negatif yüklü yan zincirlerine bağlanarak hapsolur (retansiyon). Dolaşımdan yalıtılan lipidler reaktif oksijen türevleriyle (ROS) okside olarak oxLDL haline gelir.',
      'Retained apoB particles bind to negatively charged glycosaminoglycan chains of extracellular proteoglycans. Entrapped lipids undergo oxidation by ROS into pro-inflammatory oxLDL.'
    ),
    features: [
      t('Proteoglikan retansiyonu ( Williams & Tabas hipotezi)', 'Proteoglycan binding (response-to-retention hypothesis)'),
      t('Minimal okside ve tam okside LDL (oxLDL)', 'Minimally modified and fully oxidized LDL (oxLDL)'),
      t('Monosit kemotaktik protein-1 (MCP-1) salınımı', 'Monocyte chemoattractant protein-1 (MCP-1) release')
    ]
  },
  {
    stage: 3,
    id: 'foamcell',
    title: t('Evre 3: Makrofaj Göçü ve Köpük Hücresi (Fatty Streak)', 'Stage 3: Macrophage Recruitment & Foam Cells (Fatty Streak)'),
    desc: t(
      'MCP-1 gradyanını izleyen monositler intimaya girer ve makrofajlara farklılaşır. Çöpçü reseptörler (SR-A, CD36) negatif geri-bildirimsiz olarak oxLDL yutarak köpük hücrelerine (foam cells) dönüşür ve yağlı çizgilenme (fatty streak) oluşur.',
      'Recruited monocytes differentiate into macrophages in the intima. Scavenger receptors (SR-A, CD36) ingest oxLDL without cholesterol-dependent downregulation, creating lipid-laden foam cells.'
    ),
    features: [
      t('Doyumsuz oxLDL fagositozu', 'Unregulated oxLDL scavenger phagocytosis'),
      t('Köpük hücresi kümeleri (Fatty streak)', 'Foam cell aggregates (Fatty streak formation)'),
      t('Lokal sitokin üretimi (TNF-α, IL-1β, IL-6)', 'Local pro-inflammatory cytokine secretion')
    ]
  },
  {
    stage: 4,
    id: 'fibrous',
    title: t('Evre 4: Fibröz Kılıf ve Nekrotik Çekirdek (Aterom)', 'Stage 4: Fibroatheroma & Necrotic Core'),
    desc: t(
      'Medyadaki vasküler düz kas hücreleri (VSMC) intimaya göç ederek kollajen matriks sentezler ve fibröz kılıfı (fibrous cap) kurar. Merkezdeki köpük hücrelerinin apoptozu ve kusurlu temizlenme (efferosite bozukluğu) serbest kolesterol zengini nekrotik çekirdeği doğurur.',
      'Vascular smooth muscle cells (VSMCs) migrate into the intima to lay down a protective collagenous fibrous cap. Defective efferocytosis and foam cell necrosis generate the acellular lipid core.'
    ),
    features: [
      t('Kollajenöz koruyucu fibröz kılıf', 'Protective collagen fibrous cap formed by VSMCs'),
      t('Apoptoz ve nekrotik kolesterol çekirdeği', 'Necrotic core with extracellular cholesterol crystals'),
      t('Anjiyogenez (kırılgan vasa vasorum mikrodamarları)', 'Adventitial neovascularization with fragile intraplaque capillaries')
    ]
  },
  {
    stage: 5,
    id: 'rupture',
    title: t('Evre 5: Fibröz Kılıf Yırtılması ve Akut Tromboz', 'Stage 5: Plaque Rupture & Acute Thrombosis'),
    desc: t(
      'İntraplak makrofajlardan salınan matriks metalloproteinazlar (MMP-1, MMP-8, MMP-13) fibröz kılıf kollajenini eritir. Kılıf kritik kalınlığın (<65 µm) altına indiğinde kan basıncı stresiyle yırtılır; nekrotik doku faktörü trombositlerle temas ederek akut lümen tıkayıcı trombüsü tetikler.',
      'Activated macrophages secrete matrix metalloproteinases (MMPs) degrading interstitial collagen. Thin-cap fibroatheroma (<65 µm) ruptures under tensile stress, exposing tissue factor to trigger acute thrombosis.'
    ),
    features: [
      t('İncelmiş kılıf (Thin-cap fibroatheroma <65 µm)', 'Thin-cap fibroatheroma (TCFA <65 µm)'),
      t('Doku faktörü (TF) maruziyeti ve tromboz', 'Tissue factor exposure driving platelet activation and fibrin clot'),
      t('Akut koroner sendrom (STEMI / NSTEMI)', 'Acute luminal occlusion causing myocardial infarction')
    ]
  }
];

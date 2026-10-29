// Cardiac CT Studio · Clinical Cases, CAD-RADS 2.0, TAVI Structural Planning, Artifacts & Calculators
// Bilingual (TR / EN) educational dataset modeled on SCCT / CAD-RADS 2.0 / ESC / ACC consensus standards.

const w = (tr, en) => Object.freeze({ tr, en });

export const SHELL_TEXT = Object.freeze({
  tr: {
    title: 'Cardia · Kardiyak BT Stüdyosu (Koroner BTA · CAD-RADS 2.0 · TAVI · CT-FFR)',
    heading: 'Kardiyak BT (CCTA) ve Yapısal Kalp Görüntüleme Stüdyosu',
    subtitle: 'Çok düzlemli rekonstrüksiyon (MPR), eğrisel düzlemsel reformasyon (CPR), Hounsfield Ünitesi (HU) doku karakterizasyonu, CAD-RADS 2.0 raporlama, Agatston kalsiyum skoru, CT-FFR ve TAVI aort kökü planlamasını tek konsolda simüle edin.',
    disclaimer: 'Şematik eğitim simülatörüdür; gerçek hasta DICOM kaydı veya tıbbi cihaz değildir. Tüm BT kesitleri, HU atenüasyon değerleri ve ölçümler yayınlanmış SCCT / ESC kılavuz modellerinden sentezlenmiştir. Klinik karar amacıyla kullanılamaz.'
  },
  en: {
    title: 'Cardia · Cardiac CT Studio (Coronary CTA · CAD-RADS 2.0 · TAVI · CT-FFR)',
    heading: 'Cardiac CT (CCTA) & Structural Heart Imaging Studio',
    subtitle: 'Simulate multi-planar reconstruction (MPR), curved planar reformation (CPR), Hounsfield Unit (HU) tissue characterization, CAD-RADS 2.0 reporting, Agatston calcium scoring, CT-FFR, and TAVI aortic root planning in a unified console.',
    disclaimer: 'Schematic teaching simulator; not a patient DICOM recording or medical device. All CT cross-sections, HU attenuation values, and measurements are synthesized from published SCCT / ESC guideline models. Not for clinical decisions.'
  }
});

export const WORKSPACE_MODES = Object.freeze([
  {
    id: 'realct',
    label: w('Gerçek BT · Toraks Segmentasyonu', 'Real CT · Chest Segmentation'),
    badge: w('TOTALSEGMENTATOR · 20 YAPI', 'TOTALSEGMENTATOR · 20 STRUCTURES')
  },
  {
    id: 'workstation',
    label: w('MPR / CPR & CT-FFR İstasyonu', 'MPR / CPR & CT-FFR Workstation'),
    badge: w('AKSİYEL · CPR · HU', 'AXIAL · CPR · HU')
  },
  {
    id: 'coronary',
    label: w('CAD-RADS 2.0 & Yüksek Riskli Plak', 'CAD-RADS 2.0 & High-Risk Plaque'),
    badge: w('SCCT · AGATSTON', 'SCCT · AGATSTON')
  },
  {
    id: 'structural',
    label: w('Yapısal Kalp · TAVI & LAA Planlama', 'Structural Heart · TAVI & LAA Planning'),
    badge: w('ANÜLÜS · S-EĞRİSİ', 'ANNULUS · S-CURVE')
  },
  {
    id: 'calculators',
    label: w('Artefaktlar, Fizik & Hesaplayıcılar', 'Artifacts, Physics & Calculators'),
    badge: w('5 ARTEFAKT · 5 HESAP', '5 ARTIFACTS · 5 CALCS')
  }
]);

export const WINDOW_PRESETS = Object.freeze([
  {
    id: 'cta-angio',
    label: w('BTA Anjiyo (W:800 L:250 HU)', 'CTA Angio (W:800 L:250 HU)'),
    width: 800,
    level: 250,
    note: w('Kontrastlı koroner lümen (300–450 HU) ile yumuşak ve kalsifik plak ayrımı için standart pencere.', 'Standard window to differentiate contrast-enhanced coronary lumen (300–450 HU) from non-calcified and calcified plaque.')
  },
  {
    id: 'calcium-sharp',
    label: w('Kalsiyum / Stent Keskin (W:1500 L:400 HU)', 'Calcium / Stent Sharp (W:1500 L:400 HU)'),
    width: 1500,
    level: 400,
    note: w('Kalsiyum ve metal stent parlamasını (blooming) azaltarak gerçek lümen açıklığını gösterir.', 'Reduces calcium and metallic stent blooming artifact to reveal true residual lumen patency.')
  },
  {
    id: 'myocardium-perf',
    label: w('Miyokard & Perfüzyon (W:300 L:100 HU)', 'Myocardium & Perfusion (W:300 L:100 HU)'),
    width: 300,
    level: 100,
    note: w('Subendokardiyal hipoperfüzyon defektlerini (40–60 HU), skar dokusunu ve intrakardiyak trombüsü belirginleştirir.', 'Highlights subendocardial hypoperfusion defects (40–60 HU), scar tissue, and intracardiac thrombus.')
  },
  {
    id: 'noncontrast-cac',
    label: w('Kontrastsız Agatston CAC (W:400 L:80 HU)', 'Non-Contrast Agatston CAC (W:400 L:80 HU)'),
    width: 400,
    level: 80,
    note: w('130 HU eşiği üzerindeki koroner kalsifikasyonları Agatston skorlaması için vurgular.', 'Highlights coronary calcifications above the 130 HU threshold for Agatston scoring.')
  }
]);

export const ANATOMICAL_LEVELS = Object.freeze([
  {
    id: 'great-vessels',
    zMm: 20,
    label: w('Düzey 1 · Büyük Damarlar & PA Bifurkasyonu (z=20 mm)', 'Level 1 · Great Vessels & PA Bifurcation (z=20 mm)'),
    structures: w('Çıkan Aort (AAo), İnen Aort (DAo), Ana Pulmoner Arter (MPA), Sağ/Sol PA, SVC', 'Ascending Aorta (AAo), Descending Aorta (DAo), Main Pulmonary Artery (MPA), RPA/LPA, SVC')
  },
  {
    id: 'aortic-root-ostia',
    zMm: 48,
    label: w('Düzey 2 · Aort Kökü, Koroner Ostiumlar & LAA (z=48 mm)', 'Level 2 · Aortic Root, Coronary Ostia & LAA (z=48 mm)'),
    structures: w('Valsalva Sinüsleri (RCC, LCC, NCC), LMCA → LAD/LCx, RCA Ostiumu, Sol Atriyum & LAA', 'Sinuses of Valsalva (RCC, LCC, NCC), LMCA → LAD/LCx, RCA Ostium, Left Atrium & LAA')
  },
  {
    id: 'four-chamber-mid',
    zMm: 78,
    label: w('Düzey 3 · Orta Ventrikül 4-Boşluk & Orta LAD/RCA (z=78 mm)', 'Level 3 · Mid-Ventricle 4-Chamber & Mid LAD/RCA (z=78 mm)'),
    structures: w('LV, RV, RA, LA, İnterventriküler Septum, Orta LAD, AV Olukta RCA ve LCx', 'LV, RV, RA, LA, Interventricular Septum, Mid LAD, RCA and LCx in AV Groove')
  },
  {
    id: 'apical-diaphragm',
    zMm: 105,
    label: w('Düzey 4 · Kardiyak Apeks & Distal PDA (z=105 mm)', 'Level 4 · Cardiac Apex & Distal PDA (z=105 mm)'),
    structures: w('LV Apeksi, RV Apeksi, Distal LAD, Posterior İnen Arter (PDA), Perikard', 'LV Apex, RV Apex, Distal LAD, Posterior Descending Artery (PDA), Pericardium')
  }
]);

export const CLINICAL_CT_CASES = Object.freeze([
  {
    id: 'normal-ccta',
    tag: 'CT-1',
    vessel: 'LAD',
    defaultZMm: 48,
    name: w('Normal Koroner BTA (CAD-RADS 0 · Agatston 0)', 'Normal Coronary CTA (CAD-RADS 0 · Agatston 0)'),
    cadRads: 'CAD-RADS 0',
    cacScore: 0,
    plaqueBurdenTier: 'P0',
    maxStenosisPct: 0,
    ffrCtDistal: 0.96,
    plaqueHu: 365,
    plaqueType: 'none',
    hrpFeatures: [],
    remodelingIndex: 1.0,
    brief: w(
      'Atipik göğüs ağrısı ile başvuran 48 yaşında hasta. Kalp hızı 56/dk (prospektif %75 diyastaz tetikleme). Tüm epikardiyal koroner arterler düzgün konturlu ve tam açık.',
      '48-year-old patient with atypical chest pain. Heart rate 56 bpm (prospective 75% diastasis gating). All epicardial coronary arteries are smooth and widely patent.'
    ),
    teaching: w(
      'CAD-RADS 0 (Darlık %0, CAC = 0): Koroner BTA’nın negatif prediktif değeri (NPV) >%99’dur. Obstrüktif KAH güvenle dışlanır; ek stres testi veya invaziv anjiyografi gerekmez.',
      'CAD-RADS 0 (0% stenosis, CAC = 0): Coronary CTA carries a negative predictive value (NPV) >99%. Obstructive CAD is reliably excluded without further downstream testing.'
    )
  },
  {
    id: 'lad-hrp-napkin',
    tag: 'CT-2',
    vessel: 'LAD',
    defaultZMm: 48,
    name: w('Proksimal LAD Yüksek Riskli Plak (HRP · Peçete Halkası)', 'Proximal LAD High-Risk Vulnerable Plaque (HRP · Napkin-Ring Sign)'),
    cadRads: 'CAD-RADS 4A / P2 / HRP / I+',
    cacScore: 42,
    plaqueBurdenTier: 'P2',
    maxStenosisPct: 76,
    ffrCtDistal: 0.71,
    plaqueHu: 18,
    plaqueType: 'lipid-hrp',
    hrpFeatures: ['lap-lt-30', 'positive-remodeling', 'spotty-ca', 'napkin-ring'],
    remodelingIndex: 1.21,
    brief: w(
      'Eforla göğüs ağrısı olan 54 yaşında hasta. Proksimal LAD’de %76 lümen darlığı oluşturan, merkezinde 18 HU düşük atenüasyonlu lipid çekirdek ve çevresinde hiperdens halka (Napkin-Ring) içeren plak.',
      '54-year-old with exertional angina. Proximal LAD shows a 76% stenosis caused by a low-attenuation core (18 HU) surrounded by a hyperdense rim (Napkin-Ring sign).'
    ),
    teaching: w(
      'SCCT Yüksek Riskli Plak (HRP) 4 temel kriteri: (1) Düşük Atenüasyonlu Plak (<30 HU), (2) Pozitif Remodeling (RI ≥1.10), (3) Noktasal Kalsifikasyon (Spotty Ca <3 mm), (4) Peçete Halkası İşareti (Napkin-Ring). ≥2 kriter varlığında rapor "/HRP" değiştiricisi alır; bu plaklarda akut koroner olay riski artar. Distal FFR_CT = 0.71 (≤0.75) lezyona özgü iskemiyi doğrular. P2 burada segment tutulum skorundan (SIS 3–4) gelir; tek başına CAC 42 P1 olurdu.',
      'The 4 SCCT High-Risk Plaque (HRP) features are: (1) Low-Attenuation Plaque (<30 HU), (2) Positive Remodeling (RI ≥1.10), (3) Spotty Calcification (<3 mm), and (4) Napkin-Ring Sign. Presence of ≥2 features adds the "/HRP" modifier; such plaques carry a higher risk of acute coronary events. Distal FFR_CT = 0.71 (≤0.75) confirms lesion-specific ischemia. P2 here comes from segment involvement (SIS 3–4); CAC 42 alone would be P1.'
    )
  },
  {
    id: 'multivessel-cac',
    tag: 'CT-3',
    vessel: 'LAD',
    defaultZMm: 48,
    name: w('Yaygın Kalsifik Çok Damar Hastalığı (CAC 680 · Blooming Artefaktı)', 'Extensive Calcified Multivessel CAD (CAC 680 · Blooming Artifact)'),
    cadRads: 'CAD-RADS 4B / P3',
    cacScore: 680,
    plaqueBurdenTier: 'P3',
    maxStenosisPct: 82,
    ffrCtDistal: 0.68,
    plaqueHu: 890,
    plaqueType: 'calcified',
    hrpFeatures: [],
    remodelingIndex: 0.98,
    brief: w(
      'Agatston skoru 680 (301–999, P3 ciddi plak yükü). Standart yumuşak pencerede (W:800) kalsiyum parlaması (blooming) nedeniyle orta LAD lümeni tam tıkalı gibi görünüyor.',
      'Agatston score 680 (301–999, P3 severe plaque burden). On standard soft windowing (W:800), calcium blooming makes the mid-LAD lumen appear nearly occluded.'
    ),
    teaching: w(
      'Kalsiyum parlaması (Blooming): Yüksek yoğunluklu kalsiyum (>400–1000 HU) kısmi hacim etkisiyle olduğundan geniş görünür ve darlık derecesini abartır (yalancı pozitif). Pencereyi "Kalsiyum / Stent Keskin (W:1500 L:400 HU)" moduna alarak gerçek rezidü lümeni inceleyin.',
      'Calcium blooming: High-density calcified plaques (>400–1000 HU) appear artificially enlarged due to partial volume averaging, overestimating stenosis severity. Switch to the "Calcium / Stent Sharp (W:1500 L:400 HU)" window preset to inspect the true residual lumen.'
    )
  },
  {
    id: 'anomalous-rca-acaos',
    tag: 'CT-4',
    vessel: 'RCA',
    defaultZMm: 48,
    name: w('Malign İnterarteriyel Anormal RCA (R-ACAOS · Slit-Like Ostium)', 'Malignant Interarterial Anomalous RCA (R-ACAOS · Slit-Like Ostium)'),
    cadRads: 'CAD-RADS 0 / E (Anomali)',
    cacScore: 0,
    plaqueBurdenTier: 'P0',
    maxStenosisPct: 58,
    ffrCtDistal: 0.77,
    plaqueHu: 340,
    plaqueType: 'anomaly',
    hrpFeatures: [],
    remodelingIndex: 1.0,
    brief: w(
      'Koşu sırasında senkop geçiren 22 yaşında sporcu. Sağ koroner arter (RCA), sol Valsalva sinüsünden (LCC) dar açıyla (<25°) çıkıyor ve Aort ile Pulmoner Arter (MPA) arasından (interarteriyel / intramural) geçiyor.',
      '22-year-old athlete with exertional syncope. The RCA arises from the left coronary sinus (LCC) at an acute takeoff angle (<25°) and courses between the Aorta and Pulmonary Artery (interarterial / intramural).'
    ),
    teaching: w(
      'Koroner anomalilerde altın standart tanı yöntemi Kardiyak BT’dir. Yüksek riskli (malign) anatomik özellikler: (1) İnterarteriyel seyir (Aort–PA arası), (2) İntramural aort duvarı içi segment, (3) Yarık şeklinde (Slit-like) ostium, (4) Akut çıkış açısı (<45°), (5) Proksimal hipoplazi ve egzersizde dinamik sıkışma. CAD-RADS raporuna "/E" (Non-aterosklerotik istisna) eklenir.',
      'Cardiac CT is the gold standard for coronary artery anomalies. High-risk (malignant) anatomical features include: (1) Interarterial course between the Aorta and PA, (2) Intramural proximal course, (3) Slit-like ostium, (4) Acute takeoff angle (<45°), and (5) Proximal hypoplasia with dynamic compression during exercise. Reported with the CAD-RADS "/E" modifier.'
    )
  },
  {
    id: 'lad-myocardial-bridge-ct',
    tag: 'CT-5',
    vessel: 'LAD',
    defaultZMm: 78,
    name: w('Derin İntramiyokardiyal LAD Köprüleme (Miyokardiyal Bridge)', 'Deep Intramyocardial LAD Bridging (Myocardial Bridge)'),
    cadRads: 'CAD-RADS 2 / E',
    cacScore: 12,
    plaqueBurdenTier: 'P1',
    maxStenosisPct: 35,
    ffrCtDistal: 0.84,
    plaqueHu: 65,
    plaqueType: 'bridge',
    hrpFeatures: [],
    remodelingIndex: 1.0,
    brief: w(
      'Orta LAD segmenti epikardiyal yağ dokusundan çıkıp sağ-sol ventrikül arası miyokard içine 3.4 mm derinlikte ve 24 mm uzunlukta gömülüyor. Proksimal girişte hafif fibröz plak mevcut.',
      'Mid-LAD dives out of the epicardial fat into the interventricular myocardium at 3.4 mm depth for a 24 mm tunnel. Mild fibrous plaque sits just proximal to the tunnel entrance.'
    ),
    teaching: w(
      'BT’de miyokardiyal köprüleme: <2 mm yüzeyel, ≥2 mm derin (>5 mm çok derin) olarak sınıflandırılır. Sistol fazında (%40 R-R) dinamik lümen sıkışması (milking) görülürken diyastazda (%75 R-R) lümen çapı normale döner. Köprü proksimalinde yüksek makaslama stresi nedeniyle sıklıkla aterosklerotik plak gelişir.',
      'On Cardiac CT, myocardial bridges are classified as superficial (<2 mm) or deep (≥2 mm, very deep >5 mm). End-systolic phase (40% R-R) demonstrates dynamic luminal milking, whereas mid-diastasis (75% R-R) shows luminal recovery. Atherosclerosis characteristically develops just proximal to the tunneled segment.'
    )
  },
  {
    id: 'cabg-graft-patency',
    tag: 'CT-6',
    vessel: 'LAD',
    defaultZMm: 48,
    name: w('Post-CABG Greft Açıklık Değerlendirmesi (LIMA Açık · SVG Darlığı)', 'Post-CABG Graft Patency Assessment (Patent LIMA · Stenotic SVG)'),
    cadRads: 'CAD-RADS 3 / P3 / G',
    cacScore: 490,
    plaqueBurdenTier: 'P3',
    maxStenosisPct: 62,
    ffrCtDistal: 0.78,
    plaqueHu: 110,
    plaqueType: 'graft',
    hrpFeatures: [],
    remodelingIndex: 1.04,
    brief: w(
      'CABG öyküsü olan hastada geniş kraniokauda tarama alanı (subklavyen arterden apeks altına). LIMA–LAD anastomozu tam açık; Aort–OM safen ven greftinde (SVG) %62 orta dereceli dejeneratif darlık.',
      'Post-CABG patient scanned with extended craniocaudal coverage. LIMA–LAD graft and anastomosis are widely patent; the Ao–OM saphenous vein graft (SVG) shows a 62% moderate degenerative stenosis.'
    ),
    teaching: w(
      'CABG hastalarında BTA, greft gövdelerini değerlendirmede çok yüksek doğruluğa (>%95) sahiptir. CAD-RADS 2.0’da "/G" değiştiricisi kullanılırken greft ile beslenen doğal proksimal koronerdeki kronik tıkanıklık yerine greftin kendisi ve anastomoz distali (run-off) esas alınarak derece belirlenir.',
      'In post-CABG patients, CCTA achieves >95% accuracy for graft body patency. When applying the CAD-RADS "/G" modifier, grading reflects the bypass graft and distal native runoff rather than the bypassed proximal native occlusion.'
    )
  },
  {
    id: 'tavi-aortic-root',
    tag: 'CT-7',
    vessel: 'LMCA',
    defaultZMm: 48,
    name: w('TAVI Öncesi Aort Kökü, Anülüs Planimetrisi & Koroner Yükseklik', 'Pre-TAVI Aortic Root, Annulus Planimetry & Coronary Height'),
    cadRads: 'CAD-RADS 2 / P3',
    cacScore: 310,
    plaqueBurdenTier: 'P3',
    maxStenosisPct: 40,
    ffrCtDistal: 0.89,
    plaqueHu: 620,
    plaqueType: 'tavi',
    hrpFeatures: [],
    remodelingIndex: 1.0,
    taviMetrics: {
      annulusAreaMm2: 468,
      annulusPerimMm: 77.6,
      dMinMm: 21.8,
      dMaxMm: 27.1,
      lcaHeightMm: 11.6,
      rcaHeightMm: 14.4,
      sovDiamMm: 31.8,
      lvotCa: 'mild'
    },
    brief: w(
      'Ciddi kalsifik aort darlığı olan 79 yaşında TAVI adayı. Sistolik (%35 R-R) fazda 3 kaspın en alt menteşe noktalarından geçen Sanal Bazal Halka (Virtual Basal Ring) alanı 468 mm², çevresi 77.6 mm.',
      '79-year-old TAVI candidate with severe calcific aortic stenosis. At end-systole (35% R-R), the Virtual Basal Ring (nadir of all 3 cusps) measures 468 mm² in area and 77.6 mm in perimeter.'
    ),
    teaching: w(
      'TAVI anülüs ölçümü konformasyonel genişleme nedeniyle mutlaka sistolde (%30–40 R-R) yapılır. Alan türevli çap = 24.4 mm, çevre türevli çap = 24.7 mm: alan 468 mm² ile 26 mm balonla genişleyen kapak (430–546 mm² aralığı), çevre 77.6 mm ile 29 mm kendiliğinden genişleyen kapak (72.3–81.7 mm aralığı). Koroner ostium yüksekliği <10 mm ve Valsalva sinüsü <30 mm olduğunda koroner obstrüksiyon riski artar; asıl belirleyici sanal kapak-koroner mesafesidir (VTC <4 mm riskli). Burada LCA = 11.6 mm, SOV 31.8 mm: düşük risk.',
      'TAVI annular sizing must be performed in systole (30–40% R-R), when the annulus is largest. Area-derived diameter is 24.4 mm and perimeter-derived diameter is 24.7 mm: area 468 mm² fits a 26 mm balloon-expandable valve (430–546 mm²), perimeter 77.6 mm a 29 mm self-expanding valve (72.3–81.7 mm). Coronary obstruction risk rises when coronary height is <10 mm and the sinus of Valsalva is <30 mm; the virtual valve-to-coronary distance is the stronger predictor (VTC <4 mm high risk). Here LCA = 11.6 mm and SOV 31.8 mm: low risk.'
    )
  },
  {
    id: 'laa-vein-mapping',
    tag: 'CT-8',
    vessel: 'LCX',
    defaultZMm: 48,
    name: w('Sol Atriyal Apendiks (LAA) Trombüs vs Staz (Geç Faz 60 sn BT)', 'Left Atrial Appendage (LAA) Thrombus vs Stasis (Delayed 60s CT)'),
    cadRads: 'CAD-RADS 1 / P1',
    cacScore: 28,
    plaqueBurdenTier: 'P1',
    maxStenosisPct: 20,
    ffrCtDistal: 0.94,
    plaqueHu: 55,
    plaqueType: 'laa',
    hrpFeatures: [],
    remodelingIndex: 1.0,
    brief: w(
      'AF ablasyonu ve LAA kapama öncesi BT. Erken arteriyel fazda "Tavuk Kanadı (Chicken-Wing)" morfolojili LAA ucunda dolum defekti izlenirken, 60. saniye geç faz çekimde tamamen homojen kontrastlanma görülüyor.',
      'Pre-AF ablation and LAA occlusion CT. Early arterial phase shows a filling defect in the tip of a Chicken-Wing LAA, which completely opacifies on the 60-second delayed acquisition.'
    ),
    teaching: w(
      'Erken arteriyel fazda LAA içindeki yavaş akım (dolaşım stazı / SEC) sıklıkla trombüsü taklit eder (yalancı pozitif). Enjeksiyondan 60 saniye sonra alınan geç faz BT’de defekt kaybolursa stazdır; geç fazda da sebat eden dolum defekti trombüs lehinedir. Geç faz eklendiğinde BT’nin trombüsü dışlamadaki negatif prediktif değeri yaklaşık %99’dur; şüphede TEE ile doğrulanır.',
      'On early arterial-phase CCTA, sluggish flow (circulatory stasis) frequently mimics LAA thrombus. A 60-second delayed-phase scan differentiates pseudo-filling defect (complete delayed opacification) from thrombus (defect that persists on delayed images). With a delayed phase, CT excludes LAA thrombus with a negative predictive value of about 99%; confirm with TEE when in doubt.'
    )
  },
  {
    id: 'triple-rule-out-pe',
    tag: 'CT-9',
    vessel: 'RCA',
    defaultZMm: 20,
    name: w('Akut Göğüs Ağrısı "Triple Rule-Out" (Pulmoner Emboli & RV Yüklenmesi)', 'Acute Chest Pain "Triple Rule-Out" (Pulmonary Embolism & RV Strain)'),
    cadRads: 'CAD-RADS 1 / P1',
    cacScore: 15,
    plaqueBurdenTier: 'P1',
    maxStenosisPct: 18,
    ffrCtDistal: 0.95,
    plaqueHu: 48,
    plaqueType: 'pe',
    hrpFeatures: [],
    remodelingIndex: 1.0,
    brief: w(
      'Acil serviste akut göğüs ağrısı ve dispne. Bifazik kontrast protokolüyle aynı anda Pulmoner Arterler, Aort ve Koronerler görüntülendi: Sağ ana pulmoner arterde trombüs (45 HU) ve 4-boşluk kesitte RV/LV çap oranı 1.35.',
      'Emergency department acute chest pain and dyspnea. Biphasic contrast protocol opacifies the pulmonary arteries, aorta, and coronaries simultaneously: right main pulmonary artery thrombus (45 HU) with an axial RV/LV diameter ratio of 1.35.'
    ),
    teaching: w(
      'Triple Rule-Out BTA: Koroner darlık ve akut aort diseksiyonunu dışlarken sağ ana pulmoner arterde akut emboliyi yakaladı. Aksiyel 4-boşluk kesitte RV/LV kısa eksen oranının ≥1.0 olması, interventriküler septumun sola doğru düzleşmesi veya bombeleşmesi ve kontrastın IVC’ye reflüsü BT’de sağ ventrikül disfonksiyonunun (orta-yüksek riskli PE) göstergeleridir.',
      'Triple Rule-Out CTA excluded acute coronary occlusion and aortic dissection while diagnosing acute pulmonary embolism. On axial 4-chamber CT, an RV/LV diameter ratio ≥1.0, septal flattening or bowing toward the LV, and IVC contrast reflux indicate acute RV pressure overload.'
    )
  },
  {
    id: 'pericardial-constriction',
    tag: 'CT-10',
    vessel: 'RCA',
    defaultZMm: 78,
    name: w('Kalsifik Konstriktif Perikardit (Yumurta Kabuğu Perikard ≥4 mm)', 'Calcific Constrictive Pericarditis (Eggshell Pericardium ≥4 mm)'),
    cadRads: 'CAD-RADS 1 / P1',
    cacScore: 35,
    plaqueBurdenTier: 'P1',
    maxStenosisPct: 22,
    ffrCtDistal: 0.93,
    plaqueHu: 920,
    plaqueType: 'pericardium',
    hrpFeatures: [],
    remodelingIndex: 1.0,
    brief: w(
      'Sağ kalp yetersizliği ve Kussmaul bulgusu olan hasta. BT’de sağ ventrikül serbest duvarı ve atriyoventriküler oluğu saran 5.5 mm kalınlığında yoğun kalsifik perikard plakları, tübüler (koni) biçimli ventriküller ve genişlemiş IVC.',
      'Patient with right heart failure and Kussmaul sign. CT reveals 5.5 mm thick dense pericardial calcification encasing the RV free wall and AV groove, tubular ventricles, and a dilated IVC.'
    ),
    teaching: w(
      'Perikardiyal kalsifikasyonu ve kalınlığı (normal <2 mm, patolojik ≥4 mm) göstermede en duyarlı görüntüleme yöntemi Kardiyak BT’dir. Cerrahi perikardiyektomi öncesinde kalsifikasyonun miyokarda invazyon derinliğini ve komşu RCA/LAD seyriyle ilişkisini haritalamak için zorunludur.',
      'Cardiac CT is the most sensitive modality for detecting pericardial calcification and thickness (normal <2 mm, abnormal ≥4 mm). Preoperative CT mapping defines myocardial invasion depth and proximity to the RCA and LAD prior to pericardiectomy.'
    )
  }
]);

export const CAD_RADS_TABLE = Object.freeze([
  {
    code: '0',
    stenosis: w('%0', '0%'),
    label: w('Yok (Normal)', 'Absent (Normal)'),
    workup: w('Obstrüktif KAH dışlandı; ek kardiyak tetkik gerekmez.', 'Obstructive CAD excluded; no further cardiac workup required.')
  },
  {
    code: '1',
    stenosis: w('%1–24', '1–24%'),
    label: w('Minimal Non-Obstrüktif', 'Minimal Non-Obstructive'),
    workup: w('Kardiyovasküler risk faktörü kontrolü ve koruyucu statin değerlendirmesi.', 'Preventive risk factor modification and statin consideration.')
  },
  {
    code: '2',
    stenosis: w('%25–49', '25–49%'),
    label: w('Hafif Non-Obstrüktif', 'Mild Non-Obstructive'),
    workup: w('Önleyici medikal tedavi (plak yükü P1–P4 yoğunluğuna göre statin/ASA).', 'Preventive pharmacotherapy guided by P1–P4 overall plaque burden.')
  },
  {
    code: '3',
    stenosis: w('%50–69', '50–69%'),
    label: w('Orta Dereceli Darlık', 'Moderate Stenosis'),
    workup: w('Fonksiyonel iskemi testi (CT-FFR, BT-Perfüzyon veya stres görüntüleme) ve optimal medikal tedavi.', 'Consider functional ischemia assessment (CT-FFR, CT-Perfusion, or stress testing) plus optimal medical therapy.')
  },
  {
    code: '4A',
    stenosis: w('%70–99 (1–2 damar)', '70–99% (1–2 vessels)'),
    label: w('Ciddi Darlık', 'Severe Stenosis (1–2 vessels)'),
    workup: w('İnvaziv koroner anjiyografi (İKA) veya lezyona özgü fonksiyonel değerlendirme + anti-anginal tedavi.', 'Invasive coronary angiography (ICA) or functional viability/ischemia testing plus anti-anginal therapy.')
  },
  {
    code: '4B',
    stenosis: w('Sol Ana (LM) ≥%50 veya 3 Damar ≥%70', 'Left Main (LM) ≥50% or 3-Vessel ≥70%'),
    label: w('Sol Ana veya Yaygın 3 Damar Ciddi KAH', 'Left Main ≥50% or 3-Vessel ≥70%'),
    workup: w('İnvaziv koroner anjiyografi ve Kalp Takımı (PCI vs CABG) revaskülarizasyon değerlendirmesi.', 'Invasive coronary angiography and Heart Team revascularization evaluation.')
  },
  {
    code: '5',
    stenosis: w('%100 (Tam Tıkanıklık)', '100% (Total Occlusion)'),
    label: w('Total Koroner Oklüzyon (CTO / Akut)', 'Total Coronary Occlusion'),
    workup: w('Klinik tabloya göre canlılık (viyabilite) / iskemi değerlendirmesi ve İKA.', 'Viability/ischemia testing and invasive angiography depending on clinical presentation.')
  }
]);

export const ARTIFACT_CATALOG = Object.freeze([
  {
    id: 'blooming',
    name: w('Kalsiyum & Stent Parlaması (Blooming Artifact)', 'Calcium & Stent Blooming Artifact'),
    mechanism: w('Çok yoğun kalsifik plakların (>400 HU) veya metal stent stratlarının kısmi hacim ortalaması (partial volume averaging) ve nokta yayılım fonksiyonu nedeniyle çevre piksellere taşması.', 'Partial volume averaging and point-spread function spillover from high-attenuation calcium (>400 HU) or metallic stent struts into adjacent lumen voxels.'),
    impact: w('Kalsifik plak olduğundan daha büyük görünür ve komşu lümen darlığı aşırı tahmin edilir (Yalancı Pozitif obstrüksiyon).', 'Calcified plaque appears artificially enlarged, causing overestimation of luminal stenosis (False-Positive obstruction).'),
    fix: w('Keskin rekonstrüksiyon filtresi (Sharp / Bone kernel), geniş pencere ayarı (W:1500 L:400 HU), iteratif rekonstrüksiyon veya Foton Sayıcı BT (PCD-CT) kullanın.', 'Apply a sharp convolution kernel, widen window settings (W:1500 L:400 HU), use iterative reconstruction, or utilize Photon-Counting CT.')
  },
  {
    id: 'stair-step',
    name: w('Basamaklanma / Kayıt Hatası (Stair-Step Misregistration)', 'Stair-Step Misregistration Artifact'),
    mechanism: w('Çoklu kalp atımıyla (multi-beat) yapılan taramalarda aritmi, VES veya kalp hızı değişkenliği nedeniyle ardışık dedektör dilimlerinin farklı kardiyak fazlarda birleşmesi.', 'In multi-beat acquisitions, heart rate variability or ectopy causes adjacent detector slabs to be acquired at slightly different cardiac phases.'),
    impact: w('Uzunlamasına (CPR/koronal) kesitlerde damar duvarında yatay basamak kayması oluşur; gerçek darlık veya diseksiyonu taklit edebilir.', 'Produces a horizontal step-off across the vessel on longitudinal/CPR views, mimicking a focal stenosis or dissection.'),
    fix: w('Tarama öncesi IV/oral beta-bloker ile kalp hızını <60/dk düzeyinde sabitleyin, EKG düzenleme (beat-rejection) uygulayın veya geniş dedektörlü tek atım (single-beat) tarama yapın.', 'Stabilize HR <60 bpm with beta-blockade, edit out ectopic ECG gates, or use wide-detector single-beat / high-pitch acquisition.')
  },
  {
    id: 'beam-hardening',
    name: w('Işın Sertleşmesi (Beam Hardening / Karanlık Bant)', 'Beam Hardening Streak Artifact'),
    mechanism: w('Polikromatik X-ışını demetinin SVC/Sağ Atriyumdaki yoğun kontrasttan veya kalp pili elektrodundan geçerken düşük enerjili fotonlarını kaybetmesi.', 'Low-energy photons are preferentially absorbed by dense contrast in the SVC/RA or metallic leads, hardening the remaining X-ray beam.'),
    impact: w('Yoğun yapıların komşuluğunda (özellikle RCA ve inferobazal LV duvarında) karanlık çizgiler oluşarak miyokardiyal hipoperfüzyonu veya yumuşak plağı taklit eder.', 'Creates dark streaks across the adjacent RCA or inferobasal myocardium, mimicking a non-calcified plaque or perfusion defect.'),
    fix: w('Kontrast arkasına 40–50 mL salin kovalayıcı (saline chaser) ekleyerek SVC/RA’yı yıkayın ve çift enerjili monokromatik (70–100 keV) rekonstrüksiyon kullanın.', 'Use a 40–50 mL saline chaser bolus to wash dense contrast out of the SVC/RA, and apply dual-energy virtual monoenergetic reconstruction.')
  },
  {
    id: 'motion-blur',
    name: w('Koroner Hareket Bulanıklığı (Kuyruklu Yıldız / Çift Lümen)', 'Coronary Motion Blur (Comet-Tail / Double Lumen)'),
    mechanism: w('Özellikle hızı yüksek olan sağ koroner arterin (RCA) tarama penceresi içinde hareket etmesi ve zamansal çözünürlüğün (temporal resolution) yetersiz kalması.', 'Rapid spatial translation of the RCA during the acquisition window exceeding scanner temporal resolution.'),
    impact: w('Aksiyel kesitte damar hilal/kuyruklu yıldız gibi dağılır, sınırları silinir ve lümen değerlendirilemez (CAD-RADS N).', 'Vessel borders appear blurred with crescentic tails or double contours, rendering the segment non-diagnostic (CAD-RADS N).'),
    fix: w('HR <65/dk ise %75 orta-diyastaz, HR >70/dk ise %40 sistol sonu fazında yeniden rekonstrükte edin ve hareket düzeltme (motion-correction) algoritmasını açın.', 'Reconstruct at 75% mid-diastasis (if HR <65 bpm) or 40% end-systole (if HR >70 bpm) and apply vendor intracycle motion-correction algorithms.')
  },
  {
    id: 'poor-opacification',
    name: w('Yetersiz Kontrast Opasifikasyonu (<250 HU / İnspiratuvar IVC Akımı)', 'Suboptimal Arterial Opacification (<250 HU / Inspiratory IVC Inflow)'),
    mechanism: w('Yanlış bolus-tracking zamanlaması, düşük enjeksiyon hızı (<5 mL/sn) veya derin inspirasyonda IVC’den gelen kontrastsız kanın sağ kalbe dolup bolusu seyreltmesi (kontrastın geçici kesintisi).', 'Mistimed bolus tracking, low flow rate (<5 mL/s), or deep inspiration drawing unopacified IVC blood into the right heart (transient interruption of contrast).'),
    impact: w('Koroner lümen atenüasyonu <250 HU kalır, sinyal/gürültü oranı düşer ve yumuşak plaklar gözden kaçar.', 'Coronary lumen attenuation drops below 250 HU, degrading contrast-to-noise ratio and obscuring non-calcified plaques.'),
    fix: w('18G antekübital damar yolu ile 5–6 mL/sn yüksek iyot konsantrasyonlu kontrast verin ve hastaya derin nefes almadan, ıkınmadan orta düzey nefes tutmayı öğretin.', 'Inject high-iodine contrast at 5–6 mL/s via an 18G antecubital IV and coach a moderate breath-hold without deep inspiration or straining.')
  }
]);

export const CALCULATOR_CARDS = Object.freeze([
  {
    id: 'cad-rads-gen',
    category: w('SCCT Standart Raporlama', 'SCCT Standardized Reporting'),
    title: w('CAD-RADS 2.0 Otomatik Kodlayıcı & Klinik Yönetim', 'CAD-RADS 2.0 Automated Encoder & Clinical Management'),
    formulaText: 'CAD-RADS [0..5] / [P1..P4 Plak Yükü] / [HRP · I · S · G · E Değiştiriciler]',
    thresholds: w('P1 hafif: CAC 1–100 (SIS ≤2) · P2 orta: 101–300 (SIS 3–4) · P3 ciddi: 301–999 (SIS 5–7) · P4 yaygın: >1000 (SIS ≥8)', 'P1 mild: CAC 1–100 (SIS ≤2) · P2 moderate: 101–300 (SIS 3–4) · P3 severe: 301–999 (SIS 5–7) · P4 extensive: >1000 (SIS ≥8)'),
    inputs: [
      { key: 'maxStenosisPct', label: w('En yüksek darlık (%)', 'Max coronary stenosis (%)'), defaultVal: 72, min: 0, max: 100, step: 1 },
      { key: 'lmOr3v', label: w('LM ≥%50 veya 3-Damar ≥%70 (0/1)', 'LM ≥50% or 3-Vessel ≥70% (0/1)'), defaultVal: 0, min: 0, max: 1, step: 1 },
      { key: 'cacScore', label: w('Agatston CAC Skoru', 'Agatston CAC Score'), defaultVal: 185, min: 0, max: 3000, step: 10 },
      { key: 'hrpCount', label: w('HRP özelliği sayısı (0–4)', 'HRP feature count (0–4)'), defaultVal: 2, min: 0, max: 4, step: 1 },
      { key: 'ffrCt', label: w('FFR_CT değeri (≤0.75 I+, 0.76–0.80 I±)', 'FFR_CT value (≤0.75 I+, 0.76–0.80 I±)'), defaultVal: 0.73, min: 0.4, max: 1.0, step: 0.01 }
    ]
  },
  {
    id: 'agatston-cac',
    category: w('Kontrastsız Kalsiyum Skorlama', 'Non-Contrast Calcium Scoring'),
    title: w('Agatston Lezyon Skoru & Yoğunluk Katsayısı (130–400+ HU)', 'Agatston Lesion Score & Density Weighting (130–400+ HU)'),
    formulaText: 'Agatston = Alan (mm²) × Yoğunluk Katsayısı (130–199:1, 200–299:2, 300–399:3, ≥400:4)',
    thresholds: w('0: Çok düşük risk · 1–99: Hafif · ≥100: Statin lehine · CAD-RADS P: 1–100 P1, 101–300 P2, 301–999 P3, >1000 P4', '0: Very low risk · 1–99: Mild · ≥100: favours statin · CAD-RADS P: 1–100 P1, 101–300 P2, 301–999 P3, >1000 P4'),
    inputs: [
      { key: 'areaMm2', label: w('Kalsifik plak alanı (mm²)', 'Calcified plaque area (mm²)'), defaultVal: 18.5, min: 1.0, max: 250.0, step: 0.5 },
      { key: 'peakHu', label: w('Maksimum piksel yoğunluğu (HU)', 'Peak pixel attenuation (HU)'), defaultVal: 440, min: 100, max: 1600, step: 10 },
      { key: 'otherVesselsCac', label: w('Diğer damarların toplam CAC skoru', 'Other vessels combined CAC'), defaultVal: 140, min: 0, max: 2500, step: 10 }
    ]
  },
  {
    id: 'tavi-sizing',
    category: w('Yapısal Kalp · TAVI Planlama', 'Structural Heart · TAVI Planning'),
    title: w('TAVI Aortik Anülüs Çapı, Kapak Boyutu & %Oversizing', 'TAVI Aortic Annulus Diameter, Valve Size & %Oversizing'),
    formulaText: 'D_alan = 2 × √(Alan / π)   ·   D_çevre = Çevre / π   ·   %Oversizing = [(THV_alan / Anülüs_alan) - 1] × 100',
    thresholds: w('Balonla genişleyen kapak alana göre (20/23/26/29 mm: 273–345 / 338–430 / 430–546 / 540–683 mm²) · Kendiliğinden genişleyen kapak çevreye göre (23/26/29/34 mm: 56.5–62.8 / 62.8–72.3 / 72.3–81.7 / 81.7–94.2 mm) · LCA <10 mm veya VTC <4 mm riskli', 'Balloon-expandable by area (20/23/26/29 mm: 273–345 / 338–430 / 430–546 / 540–683 mm²) · Self-expanding by perimeter (23/26/29/34 mm: 56.5–62.8 / 62.8–72.3 / 72.3–81.7 / 81.7–94.2 mm) · LCA <10 mm or VTC <4 mm high risk'),
    inputs: [
      { key: 'annAreaMm2', label: w('Sistolik anülüs alanı (mm²)', 'Systolic annulus area (mm²)'), defaultVal: 468, min: 250, max: 850, step: 5 },
      { key: 'annPerimMm', label: w('Sistolik anülüs çevresi (mm)', 'Systolic annulus perimeter (mm)'), defaultVal: 77.6, min: 55, max: 105, step: 0.5 },
      { key: 'lcaHeightMm', label: w('Sol koroner ostium yüksekliği (mm)', 'LCA ostial height (mm)'), defaultVal: 11.6, min: 4.0, max: 24.0, step: 0.2 },
      { key: 'vtcMm', label: w('Sanal Kapak-Koroner mesafesi VTC (mm)', 'Virtual Valve-to-Coronary VTC (mm)'), defaultVal: 4.8, min: 1.5, max: 10.0, step: 0.2 }
    ]
  },
  {
    id: 'hrp-remodeling',
    category: w('Plak Karakterizasyonu (SCCT)', 'Plaque Characterization (SCCT)'),
    title: w('Yüksek Riskli Plak (HRP) & Glagov Remodeling İndeksi', 'High-Risk Plaque (HRP) & Glagov Remodeling Index'),
    formulaText: 'RI = Alan_lezyon_dış / Alan_referans_dış   ·   HRP (+) = [Min HU <30, RI ≥1.10, Spotty Ca, Napkin-Ring] ≥ 2 kriter',
    thresholds: w('Min HU <30: Lipid zengin nekrotik çekirdek · RI ≥1.10: Pozitif yeniden yapılanma · ≥2 kriter: CAD-RADS /HRP değiştiricisi', 'Min HU <30: Lipid-rich necrotic core · RI ≥1.10: Positive remodeling · ≥2 features: CAD-RADS /HRP modifier'),
    inputs: [
      { key: 'lesionVesselArea', label: w('Lezyon dış damar alanı (mm²)', 'Lesion outer vessel area (mm²)'), defaultVal: 15.8, min: 4.0, max: 35.0, step: 0.2 },
      { key: 'refVesselArea', label: w('Referans dış damar alanı (mm²)', 'Reference outer vessel area (mm²)'), defaultVal: 12.6, min: 4.0, max: 35.0, step: 0.2 },
      { key: 'minPlaqueHu', label: w('Minimum plak atenüasyonu (HU)', 'Minimum plaque attenuation (HU)'), defaultVal: 18, min: -40, max: 400, step: 2 },
      { key: 'spottyOrNapkin', label: w('Spotty Ca + Napkin-Ring sayısı (0–2)', 'Spotty Ca + Napkin-Ring count (0–2)'), defaultVal: 1, min: 0, max: 2, step: 1 }
    ]
  },
  {
    id: 'radiation-dose',
    category: w('BT Fizik & Radyasyon Dozu (ALARA)', 'CT Physics & Radiation Dose (ALARA)'),
    title: w('DLP → Efektif Doz (mSv) & Kontrast Hacmi Hesaplayıcı', 'DLP → Effective Dose (mSv) & Contrast Volume Calculator'),
    formulaText: 'Efektif Doz (mSv) = DLP (mGy·cm) × k   (Göğüs k=0.014 · Kardiyak spesifik k=0.026)',
    thresholds: w('Yüksek pitch spiral: ~0.5–1.5 mSv · Prospektif tetikleme: ~2–4 mSv · Retrospektif sarmal (4D TAVI): ~8–14 mSv', 'High-pitch spiral: ~0.5–1.5 mSv · Prospective triggering: ~2–4 mSv · Retrospective helical (4D TAVI): ~8–14 mSv'),
    inputs: [
      { key: 'dlp', label: w('Doz-Uzunluk Çarpımı DLP (mGy·cm)', 'Dose-Length Product DLP (mGy·cm)'), defaultVal: 145, min: 20, max: 1500, step: 5 },
      { key: 'flowRateMlSec', label: w('Kontrast akım hızı (mL/sn)', 'Contrast flow rate (mL/s)'), defaultVal: 5.5, min: 3.0, max: 8.0, step: 0.5 },
      { key: 'injectionSec', label: w('Enjeksiyon süresi (sn)', 'Injection duration (s)'), defaultVal: 11, min: 5, max: 22, step: 1 }
    ]
  }
]);

export const REFERENCES = Object.freeze([
  'Cury RC, Leipsic J, Abbara S, et al. CAD-RADS 2.0 - 2022 Coronary Artery Disease-Reporting and Data System: An Expert Consensus Document of the SCCT, ACC, ACR, and NASCI. J Cardiovasc Comput Tomogr. 2022;16(6):536–557.',
  'Agatston AS, Janowitz WR, Hildner FJ, et al. Quantification of coronary artery calcium using ultrafast computed tomography. J Am Coll Cardiol. 1990;15(4):827–832.',
  'Blanke P, Weir-McCall JR, Achenbach S, et al. Computed Tomography Imaging in the Context of Transcatheter Aortic Valve Implantation (TAVI/TAVR): An Expert Consensus Document of the SCCT. JACC Cardiovasc Imaging. 2019;12(1):1–24.',
  'Motoyama S, Ito H, Sarai M, et al. Plaque Characterization by Coronary Computed Tomography Angiography and the Likelihood of Acute Coronary Events in Mid-Term Follow-Up. J Am Coll Cardiol. 2015;66(4):337–346.',
  'Nørgaard BL, Leipsic J, Gaur S, et al. Diagnostic performance of noninvasive fractional flow reserve derived from coronary computed tomography angiography in suspected coronary artery disease: the NXT trial. J Am Coll Cardiol. 2014;63(12):1145–1155.',
  'SCOT-HEART Investigators. Coronary CT Angiography and 5-Year Risk of Myocardial Infarction. N Engl J Med. 2018;379(10):924–933.',
  'Douglas PS, Hoffmann U, Patel MR, et al. Outcomes of Anatomical versus Functional Testing for Coronary Artery Disease (PROMISE). N Engl J Med. 2015;372(14):1291–1300.',
  'Korsholm K, Berti S, Iriart X, et al. Expert Recommendations on Cardiac Computed Tomography for Planning Transcatheter Left Atrial Appendage Occlusion. JACC Cardiovasc Interv. 2020;13(3):277–292.'
]);

// Coronary Angiography (Cath Lab) 3D Anatomy, Standard Projections, Arterial Systems & Lesions
// Aligned with AngioView.com, SCAI, and Kern's Cardiac Catheterization Handbook

export const CORONARY_SYSTEMS = [
  { id: 'left', nameTr: 'Sol Koroner Sistem (LCA)', nameEn: 'Left Coronary System (LCA)', icon: '🩸' },
  { id: 'right', nameTr: 'Sağ Koroner Sistem (RCA)', nameEn: 'Right Coronary System (RCA)', icon: '🫀' },
  { id: 'lima', nameTr: 'LIMA → LAD Grefti', nameEn: 'LIMA → LAD Bypass Graft', icon: '🪡' },
  { id: 'svg-om', nameTr: 'Safin Ven Grefti (SVG → OM)', nameEn: 'Saphenous Vein (SVG → OM)', icon: '🩺' },
  { id: 'svg-pda', nameTr: 'Safin Ven Grefti (SVG → PDA)', nameEn: 'Saphenous Vein (SVG → PDA)', icon: '🔬' }
];

// Standard Angiographic Cath-Lab Projections (with exact alpha = RAO/LAO, beta = Cranial/Caudal)
// Alpha convention: > 0 = LAO, < 0 = RAO, 0 = AP
// Beta convention: > 0 = Cranial (CRA), < 0 = Caudal (CAU), 0 = Straight
export const STANDARD_ANGIO_VIEWS = [
  // LEFT CORONARY SYSTEM (LCA)
  {
    id: 'lao-caudal',
    system: 'left',
    name: 'LAO Caudal ("Spider")',
    short: 'Spider',
    alpha: 45,
    beta: -35,
    targetTr: 'Sol Ana Koroner (LMCA) Bifurkasyonu & Proksimal LAD / LCx',
    targetEn: 'LMCA Bifurcation & Proximal LAD / LCx',
    purposeTr: 'LMCA gövdesini ve LAD/LCx bifurkasyonunu "örümcek" şeklinde üst üste binmeksizin (overlap olmadan) açar; ostial lezyonları değerlendirmede altın standarttır.',
    purposeEn: 'Opens the LMCA bifurcation and proximal LAD/LCx origins without overlap in a characteristic "spider" shape; gold standard for ostial and bifurcation assessment.',
    optimalFor: ['LMCA', 'pLAD', 'pLCx', 'RI']
  },
  {
    id: 'rao-caudal',
    system: 'left',
    name: 'RAO Caudal',
    short: 'RAO Caud',
    alpha: -30,
    beta: -30,
    targetTr: 'Sirkumfleks (LCx) Gövdesi, Obtüz Marjinal (OM) Dallar & Proksimal LAD',
    targetEn: 'LCx Main Body, OM Branches & Proximal LAD',
    purposeTr: 'LCx ve Obtüz Marjinal dalları ekranın sağ-altına doğru uzatarak açar; omurga gölgesi kalbin sağına düşer ve LCx net izlenir.',
    purposeEn: 'Projects the circumflex and obtuse marginal branches inferiorly and elongated; spine falls to the right, clearing the LCx.',
    optimalFor: ['pLCx', 'dLCx', 'OM1', 'OM2']
  },
  {
    id: 'ap-caudal',
    system: 'left',
    name: 'AP Caudal',
    short: 'AP Caud',
    alpha: 0,
    beta: -30,
    targetTr: 'Sol Ana Koroner ve Proksimal LCx Ostiyumu',
    targetEn: 'LMCA & Proximal LCx Ostium',
    purposeTr: 'Dönüş açısı olmaksızın sadece kaudal eğim verir; yatay kalplerde LMCA ve sirkumfleks başlangıcını minimal distorsiyonla gösterir.',
    purposeEn: 'Pure caudal tilt without rotation; displays LMCA and circumflex takeoff with minimal rotational distortion in horizontal hearts.',
    optimalFor: ['LMCA', 'pLCx']
  },
  {
    id: 'ap-cranial',
    system: 'left',
    name: 'AP Cranial',
    short: 'AP Cran',
    alpha: 0,
    beta: 40,
    targetTr: 'LAD Gövdesi, Orta-Distal Segmentler ve Diagonal Dallanmalar',
    targetEn: 'LAD Trunk, Mid-Distal Segments & Diagonals',
    purposeTr: 'LAD’yi dikey düzlemde uzatarak diafragma gölgesinden yukarı taşır; orta ve distal LAD lezyonlarını ve diagonal bifurkasyonları açar.',
    purposeEn: 'Elongates the LAD vertically above the diaphragm; clears mid and distal LAD lesions and diagonal bifurcation points.',
    optimalFor: ['mLAD', 'dLAD', 'D1', 'D2']
  },
  {
    id: 'lao-cranial',
    system: 'left',
    name: 'LAO Cranial',
    short: 'LAO Cran',
    alpha: 40,
    beta: 35,
    targetTr: 'Orta-Distal LAD, Septal Dallar ve Apeks Dönüşü',
    targetEn: 'Mid-Distal LAD, Septal Branches & Apex Wrap',
    purposeTr: 'LAD septal perforatör dallarını (S1, S2) sola, diagonalleri sağa ayırarak LAD gövdesini açar; LAD apeks kıvrımını mükemmel sergiler.',
    purposeEn: 'Separates septal perforators (left) from diagonals (right), profiling the mid-distal LAD trunk and apex wrap-around.',
    optimalFor: ['mLAD', 'dLAD', 'S1', 'S2', 'D1']
  },
  {
    id: 'rao-cranial',
    system: 'left',
    name: 'RAO Cranial',
    short: 'RAO Cran',
    alpha: -30,
    beta: 30,
    targetTr: 'LAD Orta-Distal Segmenti ve Diagonal (D1, D2) Dallanmaları',
    targetEn: 'Mid-Distal LAD & Diagonal Branch Takeoffs',
    purposeTr: 'LAD’nin orta ve distal kısmını uzatır; diagonal dallar ekranın sağına doğru belirgin açılır (stent uzunluğu tayini için idealdir).',
    purposeEn: 'Elongates the mid and distal LAD with diagonals projecting to the right; ideal for lesion length and stent sizing.',
    optimalFor: ['pLAD', 'mLAD', 'D1', 'D2']
  },
  {
    id: 'left-lateral',
    system: 'left',
    name: 'Left Lateral (90°)',
    short: 'Lateral',
    alpha: 90,
    beta: 0,
    targetTr: 'Ön Duvar (LAD) ve Arka Duvar (LCx) Tam Ayrımı & Apeks',
    targetEn: 'Complete Anterior (LAD) vs Posterior (LCx) Separation',
    purposeTr: 'LAD anterior göğüs duvarı boyunca öne, LCx ise arkaya projekte olur; LIMA greft anastomozu ve mid-LAD için mükemmel profil verir.',
    purposeEn: 'LAD runs along the anterior chest border while LCx runs posteriorly; excellent profile for LIMA anastomosis and mid-LAD.',
    optimalFor: ['pLAD', 'mLAD', 'dLAD', 'LIMA']
  },

  // RIGHT CORONARY SYSTEM (RCA)
  {
    id: 'rca-lao',
    system: 'right',
    name: 'LAO Straight (RCA)',
    short: 'LAO 45',
    alpha: 45,
    beta: 0,
    targetTr: 'RCA Ostiyumu, Proksimal ve Orta RCA ("C-Loop" Profili)',
    targetEn: 'RCA Ostium, Proximal & Mid RCA ("C-Loop" Profile)',
    purposeTr: 'Sağ koroner arterin klasik "C" şeklindeki seyrini bütünüyle gösterir; ostial ve proksimal RCA darlıklarında birincil açıdır.',
    purposeEn: 'Displays the classic "C-loop" contour of the RCA; primary view for ostial engagement, proximal and mid RCA lesions.',
    optimalFor: ['pRCA', 'mRCA']
  },
  {
    id: 'rca-rao',
    system: 'right',
    name: 'RAO Straight (RCA)',
    short: 'RAO 30',
    alpha: -30,
    beta: 0,
    targetTr: 'Orta RCA Gövdesi, Akut Marjinal Dallar ve Crux Öncesi',
    targetEn: 'Mid RCA Body, Acute Marginals & Pre-Crux',
    purposeTr: 'Orta RCA segmentini omurga süperpozisyonu olmaksızın uzatır; LAO ile birlikte eksantrik plakların değerlendirilmesini tamamlar.',
    purposeEn: 'Elongates mid-RCA free from spine overlap; complements the LAO view for eccentric plaque assessment.',
    optimalFor: ['mRCA', 'AM', 'dRCA']
  },
  {
    id: 'rca-lao-cranial',
    system: 'right',
    name: 'LAO Cranial (RCA)',
    short: 'LAO Cran (RCA)',
    alpha: 40,
    beta: 30,
    targetTr: 'Distal RCA Crux Cordis, PDA ve PLB Bifurkasyonu',
    targetEn: 'Distal RCA Crux, PDA & PLB Bifurcation',
    purposeTr: 'Distal RCA\'nın arka interventriküler oluğa döndüğü Crux bölgesini ve PDA/PLB ayrımını ("ters U" veya "L" şeklinde) mükemmel açar.',
    purposeEn: 'Opens the crux cordis and PDA/PLB bifurcation into an "inverted U" or "L-shape"; prevents crux foreshortening.',
    optimalFor: ['dRCA', 'Crux', 'PDA', 'PLB']
  },
  {
    id: 'rca-ap-cranial',
    system: 'right',
    name: 'AP Cranial (RCA)',
    short: 'AP Cran (RCA)',
    alpha: 0,
    beta: 30,
    targetTr: 'Distal RCA ve Arka İnen Arter (PDA) Seyri',
    targetEn: 'Distal RCA & Posterior Descending Artery (PDA)',
    purposeTr: 'PDA\'nın arka interventriküler oluk boyunca apekse doğru inişini diafragma gölgesi üzerinden uzatarak sergiler.',
    purposeEn: 'Visualizes the descent of the PDA along the posterior interventricular groove towards the apex.',
    optimalFor: ['dRCA', 'PDA']
  },

  // BYPASS GRAFTS (CABG)
  {
    id: 'lima-rao-cranial',
    system: 'lima',
    name: 'RAO Cranial (LIMA → LAD)',
    short: 'RAO Cran (LIMA)',
    alpha: -30,
    beta: 30,
    targetTr: 'LIMA Gövdesi, LAD Anastomozu ve LAD Distal Yatağı',
    targetEn: 'LIMA Body, LAD Anastomosis & Distal LAD Bed',
    purposeTr: 'LIMA greftinin LAD üzerine döküldüğü anastomoz hattını ve distal LAD dolumunu uzatarak değerlendirir.',
    purposeEn: 'Profiles the LIMA-to-LAD anastomosis and demonstrates distal runoff into the recipient LAD.',
    optimalFor: ['LIMA', 'mLAD', 'dLAD']
  },
  {
    id: 'lima-lao-cranial',
    system: 'lima',
    name: 'LAO Cranial (LIMA → LAD)',
    short: 'LAO Cran (LIMA)',
    alpha: 40,
    beta: 35,
    targetTr: 'LIMA Anastomozu ve Retrograd LAD Dolumu',
    targetEn: 'LIMA Anastomosis & Retrograde LAD Runoff',
    purposeTr: 'Anastomozun hem antegrad distal LAD\'ye hem de retrograd proksimal LAD\'ye kan akımını net gösterir.',
    purposeEn: 'Shows bidirectional filling into both distal LAD and retrograde proximal LAD stump.',
    optimalFor: ['LIMA', 'pLAD', 'dLAD']
  },
  {
    id: 'svg-om-rao-caudal',
    system: 'svg-om',
    name: 'RAO Caudal (SVG → OM)',
    short: 'RAO Caud (SVG)',
    alpha: -30,
    beta: -30,
    targetTr: 'Safin Greft Gövdesi, OM Anastomozu & Serbest Kenar',
    targetEn: 'SVG Body, OM Anastomosis & Lateral Margin',
    purposeTr: 'Aorttan çıkan safin greftin kalbin sol kenarına dönerek Obtüz Marjinal dal ile yaptığı anastomozu açar.',
    purposeEn: 'Profiles the SVG as it sweeps across the heart’s lateral margin to connect with the obtuse marginal.',
    optimalFor: ['SVG_OM', 'OM1', 'OM2']
  },
  {
    id: 'svg-om-spider',
    system: 'svg-om',
    name: 'LAO Caudal "Spider" (SVG → OM)',
    short: 'Spider (SVG)',
    alpha: 45,
    beta: -35,
    targetTr: 'SVG-OM Distal Anastomoz Ayrımı',
    targetEn: 'SVG-OM Distal Anastomotic Clearance',
    purposeTr: 'Safin greftin OM anastomozundaki lezyonları ve yerli LCx damar yatağını süperpozisyonsuz ayırır.',
    purposeEn: 'Eliminates overlap between the graft hood, native circumflex, and the recipient marginal branch.',
    optimalFor: ['SVG_OM', 'OM1', 'pLCx']
  },
  {
    id: 'svg-pda-lao',
    system: 'svg-pda',
    name: 'LAO Cranial (SVG → PDA)',
    short: 'LAO Cran (SVG)',
    alpha: 40,
    beta: 30,
    targetTr: 'Safin Greft → PDA / Crux Anastomozu',
    targetEn: 'SVG → PDA / Crux Anastomosis',
    purposeTr: 'Crux cordis üzerine yapılan safin greft anastomozunu ve PDA/PLB ayrımını en açık şekilde sergiler.',
    purposeEn: 'Best projection to evaluate the SVG-to-crux or SVG-to-PDA anastomosis without vessel foreshortening.',
    optimalFor: ['SVG_PDA', 'PDA', 'PLB']
  }
];

// 3D Coronary Centerlines & Segment Geometries
// Coordinates in anatomical space: +X = Left, +Y = Superior (Cranial), +Z = Anterior
export const CORONARY_VESSEL_TREES = {
  left: [
    {
      id: 'LMCA',
      nameTr: 'Sol Ana Koroner Arter (LMCA)',
      nameEn: 'Left Main Coronary Artery (LMCA)',
      ahaSegment: 5,
      caliberMm: 4.6,
      color: '#ef4444',
      points: [
        [-0.25, 0.95, 0.22],
        [-0.55, 0.92, 0.35],
        [-0.85, 0.88, 0.48]
      ]
    },
    {
      id: 'pLAD',
      parent: 'LMCA',
      nameTr: 'Proksimal LAD (pLAD)',
      nameEn: 'Proximal LAD (pLAD)',
      ahaSegment: 6,
      caliberMm: 3.9,
      color: '#f87171',
      points: [
        [-0.85, 0.88, 0.48],
        [-0.82, 0.62, 0.82],
        [-0.72, 0.30, 1.08]
      ]
    },
    {
      id: 'mLAD',
      parent: 'pLAD',
      nameTr: 'Orta LAD (mLAD)',
      nameEn: 'Mid LAD (mLAD)',
      ahaSegment: 7,
      caliberMm: 3.3,
      color: '#f87171',
      points: [
        [-0.72, 0.30, 1.08],
        [-0.54, -0.15, 1.26],
        [-0.34, -0.62, 1.32]
      ]
    },
    {
      id: 'dLAD',
      parent: 'mLAD',
      nameTr: 'Distal LAD & Apeks (dLAD)',
      nameEn: 'Distal LAD & Apex (dLAD)',
      ahaSegment: 8,
      caliberMm: 2.3,
      color: '#f87171',
      points: [
        [-0.34, -0.62, 1.32],
        [-0.14, -1.02, 1.24],
        [0.02, -1.34, 1.04],
        [0.10, -1.50, 0.78]
      ]
    },
    {
      id: 'D1',
      parent: 'pLAD',
      nameTr: 'Birinci Diagonal Dal (D1)',
      nameEn: 'First Diagonal Branch (D1)',
      ahaSegment: 9,
      caliberMm: 2.6,
      color: '#fb923c',
      points: [
        [-0.82, 0.58, 0.86],
        [-1.18, 0.32, 0.94],
        [-1.52, -0.04, 0.84],
        [-1.74, -0.38, 0.68]
      ]
    },
    {
      id: 'D2',
      parent: 'mLAD',
      nameTr: 'İkinci Diagonal Dal (D2)',
      nameEn: 'Second Diagonal Branch (D2)',
      ahaSegment: 10,
      caliberMm: 2.0,
      color: '#fb923c',
      points: [
        [-0.54, -0.15, 1.26],
        [-0.92, -0.38, 1.14],
        [-1.28, -0.62, 0.94],
        [-1.48, -0.88, 0.72]
      ]
    },
    {
      id: 'S1',
      parent: 'pLAD',
      nameTr: 'Birinci Septal Perforatör (S1)',
      nameEn: 'First Septal Perforator (S1)',
      ahaSegment: 9.1,
      caliberMm: 2.0,
      color: '#fbbf24',
      points: [
        [-0.84, 0.66, 0.78],
        [-0.62, 0.46, 0.44],
        [-0.42, 0.26, 0.14],
        [-0.28, 0.06, -0.12]
      ]
    },
    {
      id: 'S2',
      parent: 'mLAD',
      nameTr: 'İkinci Septal Perforatör (S2)',
      nameEn: 'Second Septal Perforator (S2)',
      ahaSegment: 9.2,
      caliberMm: 1.6,
      color: '#fbbf24',
      points: [
        [-0.64, 0.06, 1.18],
        [-0.44, -0.08, 0.78],
        [-0.28, -0.24, 0.48],
        [-0.18, -0.38, 0.22]
      ]
    },
    {
      id: 'pLCx',
      parent: 'LMCA',
      nameTr: 'Proksimal Sirkumfleks (pLCx)',
      nameEn: 'Proximal Circumflex (pLCx)',
      ahaSegment: 11,
      caliberMm: 3.6,
      color: '#38bdf8',
      points: [
        [-0.85, 0.88, 0.48],
        [-1.28, 0.84, 0.30],
        [-1.64, 0.74, 0.02]
      ]
    },
    {
      id: 'OM1',
      parent: 'pLCx',
      nameTr: 'Birinci Obtüz Marjinal (OM1)',
      nameEn: 'First Obtuse Marginal (OM1)',
      ahaSegment: 12,
      caliberMm: 2.8,
      color: '#60a5fa',
      points: [
        [-1.38, 0.80, 0.22],
        [-1.78, 0.44, 0.20],
        [-2.04, -0.02, 0.10],
        [-2.12, -0.46, -0.06],
        [-1.98, -0.86, -0.22]
      ]
    },
    {
      id: 'dLCx',
      parent: 'pLCx',
      nameTr: 'Distal Sirkumfleks (dLCx)',
      nameEn: 'Distal Circumflex (dLCx)',
      ahaSegment: 13,
      caliberMm: 2.5,
      color: '#38bdf8',
      points: [
        [-1.64, 0.74, 0.02],
        [-1.84, 0.48, -0.38],
        [-1.74, 0.18, -0.78],
        [-1.48, -0.12, -1.08]
      ]
    },
    {
      id: 'OM2',
      parent: 'dLCx',
      nameTr: 'İkinci Obtüz Marjinal (OM2)',
      nameEn: 'Second Obtuse Marginal (OM2)',
      ahaSegment: 14,
      caliberMm: 2.1,
      color: '#60a5fa',
      points: [
        [-1.84, 0.48, -0.38],
        [-2.04, 0.08, -0.44],
        [-2.08, -0.32, -0.54],
        [-1.92, -0.72, -0.64]
      ]
    },
    {
      id: 'RI',
      parent: 'LMCA',
      nameTr: 'Ramus Intermedius (RI)',
      nameEn: 'Intermediate Branch (Ramus)',
      ahaSegment: 17,
      caliberMm: 2.4,
      color: '#c084fc',
      points: [
        [-0.85, 0.88, 0.48],
        [-1.24, 0.52, 0.60],
        [-1.54, 0.12, 0.56],
        [-1.68, -0.28, 0.42]
      ]
    }
  ],

  right: [
    {
      id: 'pRCA',
      nameTr: 'Proksimal RCA (pRCA)',
      nameEn: 'Proximal RCA (pRCA)',
      ahaSegment: 1,
      caliberMm: 4.2,
      color: '#34d399',
      points: [
        [0.48, 1.04, 0.44],
        [0.84, 0.88, 0.54],
        [1.18, 0.64, 0.54]
      ]
    },
    {
      id: 'Conus',
      parent: 'pRCA',
      nameTr: 'Konus Dalı',
      nameEn: 'Conus Branch',
      ahaSegment: 1.1,
      caliberMm: 1.8,
      color: '#a7f3d0',
      points: [
        [0.54, 1.04, 0.50],
        [0.34, 0.98, 0.84],
        [0.08, 0.88, 1.08]
      ]
    },
    {
      id: 'SNA',
      parent: 'pRCA',
      nameTr: 'Sinüs Düğümü Arteri (SNA)',
      nameEn: 'Sinus Node Artery (SNA)',
      ahaSegment: 1.2,
      caliberMm: 1.9,
      color: '#fde047',
      points: [
        [0.58, 1.04, 0.44],
        [0.74, 1.24, 0.20],
        [0.84, 1.48, -0.10],
        [0.68, 1.64, -0.38]
      ]
    },
    {
      id: 'mRCA',
      parent: 'pRCA',
      nameTr: 'Orta RCA (mRCA)',
      nameEn: 'Mid RCA (mRCA)',
      ahaSegment: 2,
      caliberMm: 3.7,
      color: '#34d399',
      points: [
        [1.18, 0.64, 0.54],
        [1.38, 0.24, 0.44],
        [1.44, -0.22, 0.24],
        [1.34, -0.62, -0.02]
      ]
    },
    {
      id: 'AM',
      parent: 'mRCA',
      nameTr: 'Akut Marjinal Dal (AM)',
      nameEn: 'Acute Marginal Branch (AM)',
      ahaSegment: 2.1,
      caliberMm: 2.3,
      color: '#6ee7b7',
      points: [
        [1.40, 0.08, 0.34],
        [1.24, -0.22, 0.74],
        [0.94, -0.56, 1.04],
        [0.64, -0.86, 1.14]
      ]
    },
    {
      id: 'dRCA',
      parent: 'mRCA',
      nameTr: 'Distal RCA (dRCA)',
      nameEn: 'Distal RCA (dRCA)',
      ahaSegment: 3,
      caliberMm: 3.3,
      color: '#34d399',
      points: [
        [1.34, -0.62, -0.02],
        [1.08, -0.86, -0.36],
        [0.74, -0.96, -0.66],
        [0.28, -1.02, -0.82]
      ]
    },
    {
      id: 'PDA',
      parent: 'dRCA',
      nameTr: 'Posterior Desendan Arter (PDA)',
      nameEn: 'Posterior Descending Artery (PDA)',
      ahaSegment: 4,
      caliberMm: 2.9,
      color: '#10b981',
      points: [
        [0.28, -1.02, -0.82],
        [0.14, -1.16, -0.56],
        [0.04, -1.32, -0.26],
        [-0.04, -1.46, 0.08],
        [-0.06, -1.56, 0.38]
      ]
    },
    {
      id: 'PLB',
      parent: 'dRCA',
      nameTr: 'Posterolateral Dal (PLB)',
      nameEn: 'Posterolateral Branch (PLB)',
      ahaSegment: 16,
      caliberMm: 2.5,
      color: '#10b981',
      points: [
        [0.28, -1.02, -0.82],
        [-0.02, -0.96, -0.92],
        [-0.42, -0.86, -0.96],
        [-0.82, -0.82, -0.86],
        [-1.16, -0.82, -0.66]
      ]
    },
    {
      id: 'AVNA',
      parent: 'dRCA',
      nameTr: 'AV Düğüm Arteri (AVNA)',
      nameEn: 'AV Node Artery (AVNA)',
      ahaSegment: 3.1,
      caliberMm: 1.5,
      color: '#fde047',
      points: [
        [0.28, -1.02, -0.82],
        [0.24, -0.72, -0.76],
        [0.18, -0.52, -0.62]
      ]
    }
  ],

  lima: [
    {
      id: 'LIMA',
      nameTr: 'Sol İnternal Mamariyen Arter (LIMA)',
      nameEn: 'Left Internal Mammary Artery (LIMA)',
      ahaSegment: 20,
      caliberMm: 3.3,
      color: '#38bdf8',
      points: [
        [-0.78, 1.78, -0.22],
        [-0.74, 1.22, 0.38],
        [-0.68, 0.62, 0.84],
        [-0.58, 0.06, 1.14],
        [-0.54, -0.15, 1.26] // Anastomosis with mid-LAD
      ]
    },
    {
      id: 'mLAD_recipient',
      parent: 'LIMA',
      nameTr: 'Alıcı LAD (Distal Akım)',
      nameEn: 'Recipient LAD (Distal Runoff)',
      ahaSegment: 7,
      caliberMm: 3.0,
      color: '#f87171',
      points: [
        [-0.54, -0.15, 1.26],
        [-0.34, -0.62, 1.32],
        [-0.14, -1.02, 1.24],
        [0.02, -1.34, 1.04]
      ]
    },
    {
      id: 'pLAD_stump',
      parent: 'LIMA',
      nameTr: 'Proksimal LAD (Retrograd Akım)',
      nameEn: 'Proximal LAD (Retrograde Flow)',
      ahaSegment: 6,
      caliberMm: 2.6,
      color: '#f87171',
      dashed: true,
      points: [
        [-0.54, -0.15, 1.26],
        [-0.72, 0.30, 1.08]
      ]
    }
  ],

  'svg-om': [
    {
      id: 'SVG_OM',
      nameTr: 'Safin Ven Grefti (SVG → OM)',
      nameEn: 'Saphenous Vein Graft (SVG → OM)',
      ahaSegment: 21,
      caliberMm: 4.0,
      color: '#a855f7',
      points: [
        [0.02, 1.38, 0.38],
        [-0.58, 1.28, 0.34],
        [-1.18, 0.98, 0.24],
        [-1.68, 0.52, 0.16],
        [-1.78, 0.44, 0.20] // Anastomosis with OM1
      ]
    },
    {
      id: 'OM1_recipient',
      parent: 'SVG_OM',
      nameTr: 'Alıcı OM1 Dalı',
      nameEn: 'Recipient OM1 Branch',
      ahaSegment: 12,
      caliberMm: 2.8,
      color: '#60a5fa',
      points: [
        [-1.78, 0.44, 0.20],
        [-2.04, -0.02, 0.10],
        [-2.12, -0.46, -0.06],
        [-1.98, -0.86, -0.22]
      ]
    }
  ],

  'svg-pda': [
    {
      id: 'SVG_PDA',
      nameTr: 'Safin Ven Grefti (SVG → PDA)',
      nameEn: 'Saphenous Vein Graft (SVG → PDA)',
      ahaSegment: 22,
      caliberMm: 4.0,
      color: '#a855f7',
      points: [
        [0.10, 1.38, 0.38],
        [0.58, 1.22, 0.44],
        [1.08, 0.78, 0.20],
        [1.18, 0.02, -0.28],
        [0.74, -0.68, -0.58],
        [0.28, -1.02, -0.82] // Anastomosis with Crux / PDA
      ]
    },
    {
      id: 'PDA_recipient',
      parent: 'SVG_PDA',
      nameTr: 'Alıcı PDA Damar Yatağı',
      nameEn: 'Recipient PDA Vessel Bed',
      ahaSegment: 4,
      caliberMm: 2.8,
      color: '#10b981',
      points: [
        [0.28, -1.02, -0.82],
        [0.14, -1.16, -0.56],
        [0.04, -1.32, -0.26],
        [-0.04, -1.46, 0.08]
      ]
    }
  ]
};

// Clinical Lesions Catalog (Interactive Stenosis Simulator)
export const CLINICAL_LESIONS = [
  {
    id: 'none',
    system: 'left',
    nameTr: 'Normal Koroner Anatomi (Darlık Yok)',
    nameEn: 'Normal Coronary Anatomy (No Stenosis)',
    vesselId: null,
    pct: 0,
    descTr: 'Düzgün konturlu lümen; intraluminal dolum defekti veya aterosklerotik darlık izlenmemektedir.',
    descEn: 'Smooth luminal borders; no intraluminal filling defects or atherosclerotic stenosis.'
  },
  {
    id: 'lm_bifurcation',
    system: 'left',
    nameTr: 'Sol Ana Koroner (LMCA) Distal Bifurkasyon Darlığı (Medina 1,1,1)',
    nameEn: 'LMCA Distal Bifurcation Stenosis (Medina 1,1,1)',
    vesselId: 'LMCA',
    pct: 85,
    posFraction: 0.90,
    bestViewId: 'lao-caudal',
    avoidViewId: 'ap-cranial',
    descTr: 'Sol ana koroner arter gövde sonu, ostial LAD ve ostial LCx tutulumlu trifurke/bifurke kritik darlık. "Spider" (LAO Caudal) açısında tam açılırken, kranial açılarda aşırı kısalma (foreshortening) nedeniyle gizlenebilir.',
    descEn: 'Critical true bifurcation stenosis involving distal LMCA, ostial LAD, and ostial LCx. Cleared in the "Spider" (LAO Caudal) view; obscured by foreshortening in cranial views.'
  },
  {
    id: 'lad_proximal',
    system: 'left',
    nameTr: 'Proksimal LAD Kritik Darlığı (%85 D1 Öncesi)',
    nameEn: 'Proximal LAD Critical Stenosis (85% pre-D1)',
    vesselId: 'pLAD',
    pct: 85,
    posFraction: 0.45,
    bestViewId: 'rao-cranial',
    avoidViewId: 'lao-caudal',
    descTr: 'D1 ve S1 ayrımı öncesinde yüksek dereceli darlık. RAO Cranial ve AP Cranial projeksiyonlarında uzatılarak net seçilir; kaudal açılarda LAD üst üste biner.',
    descEn: 'High-grade lesion before D1/S1 takeoffs. Profiling is optimal in RAO Cranial and AP Cranial; caudal views cause severe vessel overlap.'
  },
  {
    id: 'lad_diagonal_medina',
    system: 'left',
    nameTr: 'Mid LAD & D1 Bifurkasyon Darlığı (Medina 0,1,1)',
    nameEn: 'Mid LAD & D1 Bifurcation Lesion (Medina 0,1,1)',
    vesselId: 'mLAD',
    pct: 80,
    posFraction: 0.20,
    bestViewId: 'lao-cranial',
    avoidViewId: 'lao-caudal',
    descTr: 'Mid LAD gövdesi ve D1 çıkışını tutan gerçek bifurkasyon lezyonu. LAO Cranial projeksiyonunda D1 sağa, septaller sola açılarak ayrım açısı (bifurcation angle) tam ölçülür.',
    descEn: 'True bifurcation lesion involving mid LAD and D1 ostium. LAO Cranial separates D1 from septals for accurate bifurcation angle measurement.'
  },
  {
    id: 'lcx_ostial',
    system: 'left',
    nameTr: 'Ostial LCx Eksantrik Darlığı (%90)',
    nameEn: 'Ostial LCx Eccentric Stenosis (90%)',
    vesselId: 'pLCx',
    pct: 90,
    posFraction: 0.15,
    bestViewId: 'lao-caudal',
    avoidViewId: 'rao-cranial',
    descTr: 'LMCA\'dan hemen ayrılış noktasında sirkumfleks ostiyum darlığı. Yalnızca LAO Caudal ("Spider") ve RAO Caudal açılarında tam profil verir.',
    descEn: 'Circumflex ostial lesion immediately at LMCA takeoff. Optimal profile achieved in LAO Caudal ("Spider") and RAO Caudal views.'
  },
  {
    id: 'rca_mid_eccentric',
    system: 'right',
    nameTr: 'Orta RCA Eksantrik Darlığı (%90 C-Loop Plak)',
    nameEn: 'Mid RCA Eccentric Stenosis (90% C-Loop Plaque)',
    vesselId: 'mRCA',
    pct: 90,
    posFraction: 0.50,
    bestViewId: 'rca-rao',
    avoidViewId: 'rca-ap-cranial',
    descTr: 'Eksantrik aterom plağı: LAO 45 görünümünde darlık hafif görünürken (%40 yanılsama), dik projeksiyon olan RAO 30 düz görünümünde darlık %90 olarak tam ciddiyetiyle ortaya çıkar.',
    descEn: 'Eccentric atheroma: appears mild (~40%) in LAO 45 due to orthogonal projection, but reveals true 90% severity in the perpendicular RAO 30 view.'
  },
  {
    id: 'rca_crux_bifurcation',
    system: 'right',
    nameTr: 'Distal RCA Crux & PDA/PLB Bifurkasyon Lezyonu',
    nameEn: 'Distal RCA Crux & PDA/PLB Bifurcation Lesion',
    vesselId: 'dRCA',
    pct: 85,
    posFraction: 0.85,
    bestViewId: 'rca-lao-cranial',
    avoidViewId: 'rca-rao',
    descTr: 'Sağ koroner arterin Crux bölgesinde PDA ve PLB\'ye ayrıldığı noktada lezyon. Yalnızca LAO Cranial projeksiyonunda "ters U" anatomisi açılarak bifurkasyon değerlendirilebilir.',
    descEn: 'Stenosis at the crux cordis where RCA bifurcates into PDA and PLB. Only LAO Cranial unfolds the "inverted U" anatomy to profile both branches.'
  }
];

// Helper to calculate 3D Euclidean distance between two points
export function distance3D(p1, p2) {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  const dz = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

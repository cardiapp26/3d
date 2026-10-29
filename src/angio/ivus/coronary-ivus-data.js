// Coronary IVUS Lab · Intravascular Ultrasound Clinical Cases, Tissue Atlas, Artifacts & Calculators
// Bilingual (TR / EN) educational dataset modeled on EAPCI / ACC / ULTIMATE / IVUS-XPL consensus standards.

const w = (tr, en) => Object.freeze({ tr, en });

export const SHELL_TEXT = Object.freeze({
  tr: {
    title: 'Cardia · Koroner IVUS Laboratuvarı (İntravasküler Ultrason & PCI Optimizasyonu)',
    heading: 'Koroner İntravasküler Ultrason (IVUS) ve PCI Rehberlik Laboratuvarı',
    subtitle: 'EEM ve lümen sınırlarını (MLA, plak yükü), plak morfolojisini (yumuşak, fibröz, kalsifik ark, kalsifiye nodül), sol ana koroner (LMCA) bifurkasyon kriterlerini ve ULTIMATE / IVUS-XPL optimal stent açılım hedeflerini canlı B-mod ve uzunlamasına (L-mod) geri çekme üzerinde simüle edin.',
    disclaimer: 'Şematik eğitim simülatörüdür; gerçek hasta kaydı veya tıbbi cihaz değildir. Tüm IVUS kesitleri, geri çekme profilleri ve ölçümleri yayınlanmış intravasküler görüntüleme kılavuzlarından sentezlenmiştir. Klinik karar amacıyla kullanılamaz.'
  },
  en: {
    title: 'Cardia · Coronary IVUS Lab (Intravascular Ultrasound & PCI Optimization)',
    heading: 'Coronary Intravascular Ultrasound (IVUS) & PCI Guidance Laboratory',
    subtitle: 'Simulate EEM and lumen planimetry (MLA, plaque burden), plaque morphology (soft, fibrous, calcium arc, calcified nodule), left main (LMCA) bifurcation criteria, and ULTIMATE / IVUS-XPL optimal stent expansion targets on live B-mode and longitudinal (L-mode) pullback views.',
    disclaimer: 'Schematic teaching simulator; not a patient recording or medical device. All IVUS cross-sections, pullback profiles, and measurements are synthesized from published intravascular imaging guidelines. Not for clinical decisions.'
  }
});

export const WORKSPACE_MODES = Object.freeze([
  {
    id: 'console',
    label: w('IVUS Geri Çekme Konsolu', 'IVUS Pullback Console'),
    badge: w('B-MOD & L-MOD', 'B-MODE & L-MODE')
  },
  {
    id: 'morphology',
    label: w('Plak Morfolojisi & Kalsiyum Skoru', 'Plaque Morphology & Calcium Score'),
    badge: w('DOKU & LMCA', 'TISSUE & LMCA')
  },
  {
    id: 'artifacts',
    label: w('Artefaktlar & Görüntüleme Tuzakları', 'Artifacts & Imaging Pitfalls'),
    badge: w('KALİTE KONTROL', 'QA & QUIZ')
  },
  {
    id: 'calculator',
    label: w('Boyutlandırma & PCI Hesaplayıcıları', 'Sizing & PCI Calculators'),
    badge: w('ULTIMATE · KANG', 'ULTIMATE · KANG')
  }
]);

export const TRANSDUCER_MODES = Object.freeze([
  {
    id: 'rotational-60',
    label: w('60 MHz HD Rotasyonel (Mekanik)', '60 MHz HD Rotational (Mechanical)'),
    freqMhz: 60,
    axialResUm: 22,
    penetrationMm: 5.5,
    hasWireShadow: true,
    note: w('Yüksek aksiyel çözünürlük (~22 µm); kılavuz tel kateter dışında seyrettiği için dar bir tel akustik gölgesi (wire artifact) izlenir.', 'High axial resolution (~22 µm); guidewire runs alongside the catheter, producing a narrow wire acoustic shadow.')
  },
  {
    id: 'rotational-40',
    label: w('40 MHz Standart Rotasyonel', '40 MHz Standard Rotational'),
    freqMhz: 40,
    axialResUm: 38,
    penetrationMm: 7.0,
    hasWireShadow: true,
    note: w('Klasik 40 MHz mekanik transdüser; dengeli doku penetrasyonu ve çözünürlük sunar.', 'Classic 40 MHz mechanical transducer; balanced tissue penetration and resolution.')
  },
  {
    id: 'phased-20',
    label: w('20 MHz Katı Hal (Phased-Array)', '20 MHz Solid-State (Phased-Array)'),
    freqMhz: 20,
    axialResUm: 80,
    penetrationMm: 10.0,
    hasWireShadow: false,
    note: w('64 elemanlı elektronik dizilim; koaksiyel monorail lümen sayesinde tel gölgesi ve NURD oluşmaz, derin penetrasyon sağlar ancak yakın alanda ring-down halkası belirgindir.', '64-element electronic array; coaxial lumen eliminates wire shadow and NURD with deep penetration, though near-field ring-down is prominent.')
  }
]);

export const CLINICAL_CASES = Object.freeze([
  {
    id: 'lad-fibrocalcific',
    tag: 'IVUS-1',
    vessel: 'LAD',
    segment: w('Proksimal-Orta LAD', 'Proximal-Mid LAD'),
    name: w('Fokal Fibrokalsifik LAD Darlığı (Klasik PCI Planlama)', 'Focal Fibrocalcific LAD Stenosis (Classic PCI Sizing)'),
    pullbackLengthMm: 40,
    distalRefMm: 6,
    mlaMm: 20,
    proxRefMm: 34,
    distalRef: { eemDiamMm: 3.6, lumenDiamMm: 3.15 },
    proxRef: { eemDiamMm: 4.2, lumenDiamMm: 3.65 },
    lesion: {
      centerMm: 20,
      lengthMm: 12,
      minLumenDiamMm: 1.65,
      maxLumenDiamMm: 1.95,
      eemDiamMm: 3.95,
      eccentricity: 0.42,
      plaqueType: 'fibrocalcific',
      calciumArcDeg: 135,
      calciumSuperficial: true,
      calciumLengthMm: 4.0,
      calcifiedNodule: false,
      attenuationArcDeg: 0,
      thrombus: false,
      dissectionArcDeg: 0,
      halfMoonBridge: false
    },
    sideBranches: [
      { posMm: 13, clockHour: 2, name: w('D1 Diyagonal Dal', 'D1 Diagonal Branch') },
      { posMm: 29, clockHour: 7, name: w('S1 Septal Dal', 'S1 Septal Perforator') }
    ],
    brief: w(
      'Kararlı anginası olan hastada orta LAD segmentinde anjiyografik %70 darlık. Distal ve proksimal referans segmentlerini (plak yükü <50%), MLA kesitini ve 135° yüzeyel kalsifik arkı değerlendirin.',
      'Stable angina patient with 70% mid-LAD angiographic stenosis. Evaluate distal and proximal reference landing zones (plaque burden <50%), the MLA frame, and the 135° superficial calcium arc.'
    ),
    teaching: w(
      'Kalsiyum arkı <270° (135°), 360° halka veya kalsifiye nodül yok ve damar çapı ≥3.5 mm olduğundan IVUS kalsiyum skoru (Zhang 2021) uygulanmaz; yüksek basınçlı NC balon predilatasyonu ile tam stent açılımı beklenir. EAPCI kuralı: ortalama distal EEM (≈3.6 mm) en yakın 0.25 mm’ye aşağı yuvarlanır → 3.5 mm DES; lümen bazlı yöntem: distal ortalama lümen (≈3.2 mm) + 0–0.25 mm → 3.25 mm. Proksimal referans lümeni ≈3.55 mm olduğundan 3.5 mm NC balon ile POT uygundur.',
      'With a calcium arc <270° (135°), no 360° ring or calcified nodule, and vessel diameter ≥3.5 mm, the IVUS calcium score (Zhang 2021) does not apply; high-pressure NC balloon predilatation should allow full stent expansion. EAPCI rule: mean distal EEM (~3.6 mm) rounded down to the nearest 0.25 mm gives a 3.5 mm DES; lumen-based: distal mean lumen (~3.2 mm) + 0–0.25 mm gives 3.25 mm. With a proximal reference lumen of ~3.55 mm, POT with a 3.5 mm NC balloon is appropriate.'
    )
  },
  {
    id: 'lmca-bifurcation',
    tag: 'IVUS-2',
    vessel: 'LMCA-LAD',
    segment: w('Distal Sol Ana Koroner (LMCA) → Ostial LAD', 'Distal Left Main (LMCA) → Ostial LAD'),
    name: w('Distal Sol Ana Koroner (LMCA) Bifurkasyon Darlığı (Kang Kriterleri)', 'Distal Left Main (LMCA) Bifurcation Stenosis (Kang Criteria)'),
    pullbackLengthMm: 40,
    distalRefMm: 7,
    mlaMm: 24,
    proxRefMm: 35,
    distalRef: { eemDiamMm: 3.9, lumenDiamMm: 3.4 },
    proxRef: { eemDiamMm: 5.1, lumenDiamMm: 4.35 },
    lesion: {
      centerMm: 24,
      lengthMm: 10,
      minLumenDiamMm: 2.15,
      maxLumenDiamMm: 2.45,
      eemDiamMm: 4.75,
      eccentricity: 0.52,
      plaqueType: 'fibrocalcific',
      calciumArcDeg: 110,
      calciumSuperficial: true,
      calciumLengthMm: 3.5,
      calcifiedNodule: false,
      attenuationArcDeg: 0,
      thrombus: false,
      dissectionArcDeg: 0,
      halfMoonBridge: false
    },
    sideBranches: [
      { posMm: 21, clockHour: 5, name: w('LCx Ostiumu (Karina / POC)', 'LCx Ostium (Carina / POC)') }
    ],
    brief: w(
      'Anjiyografide belirsiz (%45–55) distal LMCA darlığı. LAD’den LMCA ostiumuna geri çekme (pullback) ile minimal lümen alanını (MLA) ve karina (POC) tutulumunu ölçün.',
      'Angiographically intermediate (45–55%) distal LMCA stenosis. Pull back from LAD into the LMCA ostium to measure MLA and carina (POC) involvement.'
    ),
    teaching: w(
      'Distal LMCA MLA ≈ 4.1 mm² (Asya eşiği <4.5 mm², Park 2014; Batı eşiği <6.0 mm², LITRO) ve plak yükü %77 ((17.72 − 4.14) / 17.72). Karina (akım ayırıcı, saat 5 yönü) korunmuş, plak karinanın karşısındaki lateral duvarda (eksantrik). LMCA PCI sonrası hedef MSA değerleri (Kang 5-6-7-8 kuralı): LCx ostiumu >5 mm², LAD ostiumu >6 mm², POC >7 mm², distal LMCA >8 mm².',
      'Distal LMCA MLA is ~4.1 mm² (Asian cut-off <4.5 mm², Park 2014; Western cut-off <6.0 mm², LITRO) with 77% plaque burden ((17.72 − 4.14) / 17.72). The carina (flow divider, 5 o’clock) is spared while plaque sits on the lateral wall opposite the flow divider. Post-PCI MSA targets (Kang 5-6-7-8 rule): LCx ostium >5 mm², LAD ostium >6 mm², POC >7 mm², distal LMCA >8 mm².'
    )
  },
  {
    id: 'lad-concentric-ca-360',
    tag: 'IVUS-3',
    vessel: 'LAD',
    segment: w('Orta LAD (Ağır, Neredeyse Çepeçevre Kalsiyum)', 'Mid LAD (Heavy, Near-Circumferential Calcium)'),
    name: w('320° Yüzeyel Kalsiyum (IVUS Kalsiyum Skoru 2/4 · IVL/Rota Adayı)', '320° Superficial Calcium (IVUS Calcium Score 2/4 · IVL/Rota Candidate)'),
    pullbackLengthMm: 40,
    distalRefMm: 6,
    mlaMm: 19,
    proxRefMm: 33,
    distalRef: { eemDiamMm: 3.3, lumenDiamMm: 2.9 },
    proxRef: { eemDiamMm: 3.6, lumenDiamMm: 3.15 },
    lesion: {
      centerMm: 19,
      lengthMm: 14,
      minLumenDiamMm: 1.5,
      maxLumenDiamMm: 1.62,
      eemDiamMm: 3.35,
      eccentricity: 0.12,
      plaqueType: 'calcified',
      calciumArcDeg: 320,
      calciumSuperficial: true,
      calciumLengthMm: 7.5,
      calcifiedNodule: false,
      attenuationArcDeg: 0,
      thrombus: false,
      dissectionArcDeg: 0,
      halfMoonBridge: false
    },
    sideBranches: [
      { posMm: 27, clockHour: 3, name: w('D2 Diyagonal Dal', 'D2 Diagonal Branch') }
    ],
    brief: w(
      'Orta LAD’de yoğun radyoopak lezyon. IVUS’ta lümeni neredeyse çepeçevre saran parlak hiperekoik kalsiyum yayını, akustik gölgelenmeyi ve çoklu reverberasyon halkalarını inceleyin.',
      'Radiopaque mid-LAD lesion. Inspect the near-circumferential bright hyperechoic calcium arc, dorsal acoustic shadowing, and concentric reverberation arcs.'
    ),
    teaching: w(
      'IVUS Kalsiyum Skoru (Zhang 2021) = 2/4: (1) >270° yüzeyel kalsiyum, >5 mm uzunlukta (320°, 7.5 mm) (+1), (2) 360° kalsiyum halkası yok (0), (3) kalsifiye nodül yok (0), (4) damar çapı <3.5 mm (3.3 mm) (+1). Skor yükseldikçe stent açılımı kötüleşir (en yüksek risk skor 4); skor ≥2 olduğunda doğrudan stent implantasyonu yerine önce İntravasküler Litotripsi (IVL) veya Rotablasyon ile plak modifikasyonu önerilir.',
      'IVUS Calcium Score (Zhang 2021) = 2/4: (1) >270° superficial calcium over >5 mm (320°, 7.5 mm) (+1), (2) no 360° calcium ring (0), (3) no calcified nodule (0), (4) vessel diameter <3.5 mm (3.3 mm) (+1). Higher scores predict worse stent expansion (score 4 carries the highest risk); with a score ≥2, plaque modification (IVL or Rotational/Orbital Atherectomy) is recommended before stenting.'
    )
  },
  {
    id: 'rca-attenuated-acs',
    tag: 'IVUS-4',
    vessel: 'RCA',
    segment: w('Orta RCA (AKS Sorumlu Lezyon)', 'Mid RCA (ACS Culprit Lesion)'),
    name: w('Atenüe (Lipid Zengin) Plak, Pozitif Remodeling & Trombüs', 'Attenuated (Lipid-Rich) Plaque, Positive Remodeling & Thrombus'),
    pullbackLengthMm: 40,
    distalRefMm: 7,
    mlaMm: 20,
    proxRefMm: 34,
    distalRef: { eemDiamMm: 3.8, lumenDiamMm: 3.35 },
    proxRef: { eemDiamMm: 4.1, lumenDiamMm: 3.6 },
    lesion: {
      centerMm: 20,
      lengthMm: 13,
      minLumenDiamMm: 1.75,
      maxLumenDiamMm: 2.05,
      eemDiamMm: 4.65,
      eccentricity: 0.58,
      plaqueType: 'attenuated',
      calciumArcDeg: 0,
      calciumSuperficial: false,
      calciumLengthMm: 0,
      calcifiedNodule: false,
      attenuationArcDeg: 155,
      thrombus: true,
      dissectionArcDeg: 0,
      halfMoonBridge: false
    },
    sideBranches: [
      { posMm: 11, clockHour: 8, name: w('RV Dalı', 'RV Marginal Branch') }
    ],
    brief: w(
      'NSTEMI hastasında orta RCA lezyonu. Kalsiyum olmamasına rağmen derin dokuların görülmesini engelleyen "geri saçılım sönümlenmesi" (attenuated plaque), dışa doğru genişlemiş EEM (Glagov pozitif remodeling) ve lümene uzanan lobüle trombüsü inceleyin.',
      'NSTEMI culprit lesion in mid-RCA. Observe backward ultrasound attenuation without bright calcium, outward EEM expansion (Glagov positive remodeling), and intraluminal lobulated thrombus.'
    ),
    teaching: w(
      'Kalsiyum olmaksızın derin akustik gölgelenme (attenuated plaque) büyük nekrotik/lipid çekirdeği ve kolesterol kristallerini gösterir. Remodeling İndeksi bir alan oranıdır (lezyon EEM alanı / ortalama referans EEM alanı = 16.98 / 12.27 mm² ≈ 1.38 > 1.05) ve belirgin pozitif remodeling kanıtıdır; agresif yüksek basınçlı post-dilatasyonda "no-reflow" (distal embolizasyon) riski yüksektir.',
      'Ultrasound attenuation without bright calcium indicates a large necrotic/lipid core with cholesterol crystals. The Remodeling Index, an area ratio (lesion EEM area / mean reference EEM area = 16.98 / 12.27 mm² ≈ 1.38 > 1.05), confirms positive remodeling; aggressive over-dilatation carries a high risk of distal embolization and no-reflow.'
    )
  },
  {
    id: 'lcx-calcified-nodule',
    tag: 'IVUS-5',
    vessel: 'LCX',
    segment: w('Proksimal LCx (Açılanan Segment)', 'Proximal LCx (Hinge Segment)'),
    name: w('Lümene Protrüze Kalsifiye Nodül (Eruptive Calcified Nodule)', 'Eruptive Calcified Nodule Protruding into Lumen'),
    pullbackLengthMm: 40,
    distalRefMm: 7,
    mlaMm: 21,
    proxRefMm: 33,
    distalRef: { eemDiamMm: 3.4, lumenDiamMm: 2.95 },
    proxRef: { eemDiamMm: 3.8, lumenDiamMm: 3.3 },
    lesion: {
      centerMm: 21,
      lengthMm: 9,
      minLumenDiamMm: 1.6,
      maxLumenDiamMm: 2.25,
      eemDiamMm: 3.65,
      eccentricity: 0.65,
      plaqueType: 'nodule',
      calciumArcDeg: 95,
      calciumSuperficial: true,
      calciumLengthMm: 5.5,
      calcifiedNodule: true,
      attenuationArcDeg: 0,
      thrombus: false,
      dissectionArcDeg: 0,
      halfMoonBridge: false
    },
    sideBranches: [
      { posMm: 15, clockHour: 4, name: w('OM1 Obtus Marjinal', 'OM1 Obtuse Marginal') }
    ],
    brief: w(
      'Düzgün içbükey kalsifik ark yerine lümene doğru dışbükey (konveks), düzensiz yüzeyli parlak kalsifik kitle uzanımı ve arkasında keskin akustik gölge.',
      'Instead of a smooth concave calcium arc, a convex irregular bright calcific mass protrudes into the lumen with sharp dorsal acoustic shadowing.'
    ),
    teaching: w(
      'Kalsifiye nodül (CN): Özellikle menteşe hareketi yapan (hinge) RCA ve LCx segmentlerinde görülür. Standart balonlarla ezilmesi zordur, eksantrik stent deformasyonu ve hedef lezyon yetersizliği (TLF) riskini artırır; IVUS Kalsiyum Skoruna +1 puan ekler.',
      'Calcified nodule (CN): Common in hinge-motion RCA/LCx segments. Resistant to conventional balloon dilatation, predisposing to asymmetric stent expansion and higher target lesion failure (TLF); adds +1 point to the IVUS Calcium Score.'
    )
  },
  {
    id: 'lad-stent-underexpansion',
    tag: 'IVUS-6',
    vessel: 'LAD',
    segment: w('Orta LAD (Önceki Stent Bölgesi)', 'Mid LAD (Prior Stented Segment)'),
    name: w('Stent Az Açılımı (Underexpansion · MSA 3.3 mm² / Kalsifik Halka)', 'Stent Underexpansion (MSA 3.3 mm² over Heavy Calcium)'),
    pullbackLengthMm: 40,
    distalRefMm: 6,
    mlaMm: 20,
    proxRefMm: 34,
    distalRef: { eemDiamMm: 3.5, lumenDiamMm: 3.05 },
    proxRef: { eemDiamMm: 3.9, lumenDiamMm: 3.45 },
    lesion: {
      centerMm: 20,
      lengthMm: 12,
      minLumenDiamMm: 1.9,
      maxLumenDiamMm: 2.15,
      eemDiamMm: 3.7,
      eccentricity: 0.25,
      plaqueType: 'calcified',
      calciumArcDeg: 260,
      calciumSuperficial: true,
      calciumLengthMm: 6.0,
      calcifiedNodule: false,
      attenuationArcDeg: 0,
      thrombus: false,
      dissectionArcDeg: 0,
      halfMoonBridge: false,
      preStented: true,
      preStentExpansionRatio: 0.64,
      preStentMalappositionMm: 0
    },
    sideBranches: [],
    brief: w(
      '3 ay önce stent takılan hastada tekrarlayan angina. IVUS’ta stent stratları damar duvarına temas ediyor (apozisyon tam) ancak arkadaki 260° kalsiyum nedeniyle stent kum saati gibi dar kalmış (MSA ≈ 3.3 mm²).',
      'Recurrent angina 3 months after stenting. On IVUS, stent struts touch the intima (well apposed) but are constricted into an hourglass waist (MSA ~3.3 mm²) by 260° underlying calcium.'
    ),
    teaching: w(
      'Underexpansion (Az açılım) ≠ Malapposition (Duvara değmeme)! Burada stratlar duvara yapışıktır ancak MSA (3.3 mm²), distal referans lümen alanının yalnızca ≈%44’üdür (ULTIMATE hedefi: distal referans lümenin >%90’ı veya MSA >5.0 mm²; EAPCI: >%80, non-LM MSA >5.5 mm²). Stent trombozu ve restenozun en güçlü öngördürücüsü underexpansion’dır; yüksek basınçlı NC balon veya IVL ile düzeltilmelidir.',
      'Underexpansion ≠ Malapposition! Here the struts touch the wall, but MSA (3.3 mm²) is only ~44% of the distal reference lumen area (ULTIMATE target: >90% of distal reference lumen or MSA >5.0 mm²; EAPCI: >80%, non-LM MSA >5.5 mm²). Underexpansion is the strongest predictor of stent thrombosis and restenosis; treat with high-pressure NC balloon or IVL.'
    )
  },
  {
    id: 'rca-stent-malapposition',
    tag: 'IVUS-7',
    vessel: 'RCA',
    segment: w('Proksimal RCA (Ektatik Proksimal Kenar)', 'Proximal RCA (Ectatic Proximal Edge)'),
    name: w('Akut Stent Malapozisyonu (Duvara Değmeyen Stratlar · POT Eksikliği)', 'Acute Stent Malapposition (Unapposed Struts · Missing POT)'),
    pullbackLengthMm: 40,
    distalRefMm: 7,
    mlaMm: 18,
    proxRefMm: 31,
    distalRef: { eemDiamMm: 3.6, lumenDiamMm: 3.2 },
    proxRef: { eemDiamMm: 4.8, lumenDiamMm: 4.35 },
    lesion: {
      centerMm: 18,
      lengthMm: 14,
      minLumenDiamMm: 3.05,
      maxLumenDiamMm: 3.25,
      eemDiamMm: 4.35,
      eccentricity: 0.22,
      plaqueType: 'fibrous',
      calciumArcDeg: 45,
      calciumSuperficial: false,
      calciumLengthMm: 2.0,
      calcifiedNodule: false,
      attenuationArcDeg: 0,
      thrombus: false,
      dissectionArcDeg: 0,
      halfMoonBridge: false,
      preStented: true,
      preStentExpansionRatio: 0.94,
      preStentMalappositionMm: 0.72,
      preStentDiamMm: 3.25
    },
    sideBranches: [],
    brief: w(
      'Distal çapa (3.25 mm) göre seçilen stent, geniş proksimal RCA segmentinde (4.35 mm lümen) havada asılı kalmış. Stratların arkasında kan beneklenmesi (blood speckle) izleniyor.',
      'A stent sized to the distal vessel (3.25 mm) floats inside the large proximal RCA lumen (4.35 mm). Blood speckle is visible behind the unapposed stent struts.'
    ),
    teaching: w(
      'Akut stent malapozisyonu: Stratlar ile intima arasında >0.4 mm (400 µm) aksiyel boşluk ve >1 mm uzunluk anlamlı kabul edilir (bu eşikler OCT çalışmalarından türetilmiştir ve ULTIMATE optimal PCI kriterlerinin parçası değildir). Çözüm: Proksimal referans çapına uygun (4.25–4.5 mm) kısa NC balon ile Proksimal Optimizasyon Tekniği (POT) uygulanmasıdır.',
      'Significant acute malapposition is defined as an axial strut-to-vessel gap >0.4 mm (400 µm) extending >1 mm longitudinally (thresholds derived from OCT studies; not part of the ULTIMATE optimal PCI criteria). Fix: Perform Proximal Optimization Technique (POT) with a 4.25–4.5 mm NC balloon.'
    )
  },
  {
    id: 'lad-edge-dissection',
    tag: 'IVUS-8',
    vessel: 'LAD',
    segment: w('Distal Stent Kenarı (LAD)', 'Distal Stent Edge (LAD)'),
    name: w('Distal Stent Kenarı Mediyal Diseksiyon & İntramural Hematom', 'Distal Stent Edge Medial Dissection & Intramural Hematoma'),
    pullbackLengthMm: 40,
    distalRefMm: 8,
    mlaMm: 14,
    proxRefMm: 34,
    distalRef: { eemDiamMm: 3.3, lumenDiamMm: 2.85 },
    proxRef: { eemDiamMm: 3.8, lumenDiamMm: 3.35 },
    lesion: {
      centerMm: 14,
      lengthMm: 8,
      minLumenDiamMm: 1.7,
      maxLumenDiamMm: 2.45,
      eemDiamMm: 3.55,
      eccentricity: 0.62,
      plaqueType: 'dissection',
      calciumArcDeg: 40,
      calciumSuperficial: false,
      calciumLengthMm: 1.5,
      calcifiedNodule: false,
      attenuationArcDeg: 0,
      thrombus: false,
      dissectionArcDeg: 105,
      dissectionMedia: true,
      halfMoonBridge: false
    },
    sideBranches: [],
    brief: w(
      'Stent implantasyonu sonrası distal kenarda (14. mm) plak yükü yüksek (%62) alana iniş yapılması sonucu gelişen 105° mediyal flep ve yalancı lümende hilal şeklinde intramural hematom.',
      'Following stent deployment into a plaque-rich distal landing zone (62% plaque burden), a 105° medial dissection flap and crescentic intramural hematoma compress the true lumen at 14 mm.'
    ),
    teaching: w(
      'ULTIMATE optimal PCI kriteri yalnızca uzunluğu >3 mm olan, media tabakasını tutan kenar diseksiyonunun olmamasını ister. EAPCI 2018’e göre majör kenar diseksiyonu: (1) Çevresel ark ≥60°, (2) Uzunluk ≥3 mm, (3) Media tutulumu veya (4) Rezidüel lümen alanı <4.0 mm². Bu olguda 105° media tutulumlu flep >3 mm boyunca uzanıyor ve hematom gerçek lümeni sıkıştırıyor; ek distal stent ile kapatılmalıdır.',
      'The ULTIMATE optimal PCI criterion only requires no edge dissection involving the media with length >3 mm. Per EAPCI 2018, a major edge dissection is: (1) Circumferential arc ≥60°, (2) Length ≥3 mm, (3) Involvement of the media, or (4) Residual lumen area <4.0 mm². Here a 105° media-involving flap extends >3 mm and the hematoma compresses the true lumen; cover it with an additional distal stent.'
    )
  },
  {
    id: 'lad-myocardial-bridge',
    tag: 'IVUS-9',
    vessel: 'LAD',
    segment: w('Orta LAD (İntramiyokardiyal Tünel)', 'Mid LAD (Intramyocardial Tunnel)'),
    name: w('Miyokardiyal Köprüleme ("Yarım Ay / Half-Moon" İşareti)', 'Myocardial Bridging ("Half-Moon" Halo Sign)'),
    pullbackLengthMm: 40,
    distalRefMm: 7,
    mlaMm: 21,
    proxRefMm: 34,
    distalRef: { eemDiamMm: 3.2, lumenDiamMm: 2.85 },
    proxRef: { eemDiamMm: 3.7, lumenDiamMm: 3.3 },
    lesion: {
      centerMm: 21,
      lengthMm: 15,
      minLumenDiamMm: 1.85,
      maxLumenDiamMm: 2.55,
      eemDiamMm: 3.15,
      eccentricity: 0.28,
      plaqueType: 'bridge',
      calciumArcDeg: 0,
      calciumSuperficial: false,
      calciumLengthMm: 0,
      calcifiedNodule: false,
      attenuationArcDeg: 0,
      thrombus: false,
      dissectionArcDeg: 0,
      halfMoonBridge: true
    },
    sideBranches: [],
    brief: w(
      'Orta LAD segmentinde sistolik sıkışma (milking) ve IVUS’ta adventisya dış sınırında tüm kardiyak siklus boyunca izlenen ekolüsen (karanlık) "Yarım Ay (Half-Moon)" miyokard bandı.',
      'Systolic compression (milking) in the mid-LAD accompanied by an echolucent dark "Half-Moon" band external to the adventitia persisting throughout the cardiac cycle.'
    ),
    teaching: w(
      'IVUS’ta "Half-Moon" işareti miyokardiyal köprüleme için patognomoniktir. Tünel segmentinin kendisinde ateroskleroz nadirdir ancak köprünün hemen proksimalinde yüksek duvar gerilimi nedeniyle sıklıkla plak gelişir. Köprü içine stent konulması strat kırılması, restenoz ve perforasyon riski nedeniyle önerilmez.',
      'The echolucent "Half-Moon" sign external to the vessel adventitia is pathognomonic for myocardial bridging on IVUS. Atherosclerosis typically forms just proximal to the bridge rather than inside the tunnel. Stenting inside a myocardial bridge is avoided due to high rates of strut fracture, restenosis, and perforation.'
    )
  },
  {
    id: 'normal-vessel-ref',
    tag: 'IVUS-10',
    vessel: 'LAD',
    segment: w('Proksimal-Orta LAD (Normal Duvar)', 'Proximal-Mid LAD (Normal Wall)'),
    name: w('Normal Trilaminer Koroner Arter (İntima · Media · Adventisya)', 'Normal Trilaminar Coronary Artery (Intima · Media · Adventitia)'),
    pullbackLengthMm: 40,
    distalRefMm: 7,
    mlaMm: 20,
    proxRefMm: 34,
    distalRef: { eemDiamMm: 3.4, lumenDiamMm: 3.1 },
    proxRef: { eemDiamMm: 4.0, lumenDiamMm: 3.65 },
    lesion: {
      centerMm: 20,
      lengthMm: 8,
      minLumenDiamMm: 3.15,
      maxLumenDiamMm: 3.3,
      eemDiamMm: 3.65,
      eccentricity: 0.08,
      plaqueType: 'normal',
      calciumArcDeg: 0,
      calciumSuperficial: false,
      calciumLengthMm: 0,
      calcifiedNodule: false,
      attenuationArcDeg: 0,
      thrombus: false,
      dissectionArcDeg: 0,
      halfMoonBridge: false
    },
    sideBranches: [
      { posMm: 16, clockHour: 2, name: w('D1 Diyagonal Dal', 'D1 Diagonal Branch') }
    ],
    brief: w(
      'Normal 3 tabakalı arter duvarı: (1) Parlak iç halka (İntima / İEM), (2) Koyu ekolüsen orta halka (Media düz kas tabakası), (3) Parlak dış soğan zarı halkası (Adventisya / EEM).',
      'Normal 3-layered arterial wall: (1) Bright inner ring (Intima / IEM), (2) Dark echolucent middle ring (Media smooth muscle), (3) Bright outer onion-skin ring (Adventitia / EEM).'
    ),
    teaching: w(
      'Media tabakası kollajen ve elastinden fakir, homojen düz kas hücrelerinden oluştuğu için ultrasonu yansıtmaz ve koyu (ekolüsen) bir halka olarak görünür. IVUS planimetrisinde dış sınır (EEM) media ile adventisya arasındaki keskin arayüzden (leading-edge) çizilir; media kalınlığı plak alanına dahil edilir.',
      'Because the tunica media consists of homogeneous smooth muscle with minimal collagen, it appears as a dark echolucent ring. On IVUS planimetry, the EEM border is traced at the leading edge between the dark media and bright adventitia; the area between the lumen and EEM borders (intima + media) is reported as plaque + media area.'
    )
  }
]);

export const MORPHOLOGY_ATLAS = Object.freeze([
  {
    id: 'normal-trilaminar',
    name: w('Normal 3 Tabakalı Damar Duvarı', 'Normal Trilaminar Vessel Wall'),
    echogenicity: w('İntima parlak · Media koyu (ekolüsen) · Adventisya parlak', 'Intima bright · Media dark (echolucent) · Adventitia bright'),
    shadowing: w('Yok (Yalnızca kılavuz tel gölgesi 15–20°)', 'None (Guidewire shadow only, 15–20°)'),
    clinical: w('Sağlıklı iniş bölgesi (landing zone): İntimal kalınlık <0.3 mm, plak yükü <30–50%.', 'Healthy stent landing zone: Intimal thickness <0.3 mm, plaque burden <30–50%.')
  },
  {
    id: 'fibrous-plaque',
    name: w('Fibröz Plak (Fibrous Plaque)', 'Fibrous Plaque'),
    echogenicity: w('Adventisyaya benzer (orta düzey) homojen ekojenite', 'Homogeneous intermediate echogenicity similar to adventitia'),
    shadowing: w('Akustik gölgelenme yok (EEM sınırı net seçilir)', 'No acoustic shadowing (EEM border clearly visible)'),
    clinical: w('Kollajen ve elastin liflerinden zengin kararlı plak; balon dilatasyonuna öngörülebilir yanıt verir.', 'Collagen- and elastin-rich stable plaque; responds predictably to balloon dilatation.')
  },
  {
    id: 'soft-attenuated',
    name: w('Yumuşak / Atenüe (Lipid Zengin) Plak', 'Soft / Attenuated (Lipid-Rich) Plaque'),
    echogenicity: w('Adventisyadan daha düşük ekojenite + derin sinyal sönümlenmesi', 'Lower echogenicity than adventitia + deep backward signal attenuation'),
    shadowing: w('Kalsiyum olmaksızın derin gölgelenme (EEM sınırını gizler)', 'Deep shadowing without bright leading calcium (obscures EEM border)'),
    clinical: w('Büyük nekrotik çekirdek / fibroaterom; stent kenarı bu bölgeye bırakılırsa kenar diseksiyonu, aşırı dilate edilirse no-reflow riski yüksektir.', 'Large necrotic core / fibroatheroma; landing a stent edge here risks edge dissection, and aggressive post-dilatation risks distal embolization / no-reflow.')
  },
  {
    id: 'superficial-calcium',
    name: w('Yüzeyel Kalsifik Plak (Superficial Calcium)', 'Superficial Calcified Plaque'),
    echogenicity: w('Adventisyadan çok daha parlak (fildişi beyazı) ön kenar yay', 'Ivory-white leading edge much brighter than adventitia'),
    shadowing: w('Keskin akustik gölgelenme + eş aralıklı reverberasyon yayları', 'Sharp dorsal acoustic shadowing + concentric reverberation arcs'),
    clinical: w('Kalsiyum kalınlığı IVUS ile ölçülemez (ultrason geçemez), ancak yay açısı (°), uzunluğu (mm) ve yüzeyelliği (lümen komşuluğu) ölçülerek Kalsiyum Skoru (0–4) hesaplanır.', 'Calcium thickness cannot be measured by IVUS (ultrasound is reflected), but arc (°), length (mm), and superficial location determine the IVUS Calcium Score (0–4).')
  },
  {
    id: 'calcified-nodule',
    name: w('Kalsifiye Nodül (Calcified Nodule)', 'Calcified Nodule'),
    echogenicity: w('Lümene doğru konveks/düzensiz çıkıntı yapan parlak kalsifik odak', 'Convex, irregular bright calcific mass protruding into the lumen'),
    shadowing: w('Nodül arkasında keskin akustik gölgelenme', 'Sharp dorsal acoustic shadowing behind the nodule'),
    clinical: w('Eksantrik stent az açılımı ve geç hedef lezyon yetersizliği (TLF) ile yakından ilişkilidir; rotablasyon/orbital aterektomi veya IVL değerlendirilmelidir.', 'Strongly associated with eccentric stent underexpansion and late target lesion failure; consider atherectomy or IVL.')
  },
  {
    id: 'dissection-hematoma',
    name: w('Diseksiyon & İntramural Hematom', 'Dissection & Intramural Hematoma'),
    echogenicity: w('Lümende hareketli intimal/mediyal flep + media içinde hilal şeklinde kan birikimi', 'Mobile intimal/medial flap + crescent-shaped blood accumulation within the media'),
    shadowing: w('Yok; EEM dışa doğru genişlerken gerçek lümen basıya uğrar', 'None; EEM bulges outward while the true lumen is compressed'),
    clinical: w('EAPCI 2018 majör kenar diseksiyonu (ark ≥60°, uzunluk ≥3 mm, media tutulumu veya rezidüel lümen <4.0 mm²) ek stent ile örtülmelidir; ULTIMATE yalnızca >3 mm media tutulumlu diseksiyon olmamasını ister.', 'Cover an EAPCI 2018 major edge dissection (arc ≥60°, length ≥3 mm, media involvement, or residual lumen <4.0 mm²) with an additional stent; ULTIMATE only requires no media-involving dissection >3 mm.')
  }
]);

export const ARTIFACT_CATALOG = Object.freeze([
  {
    id: 'nurd',
    name: w('NURD (Non-Uniform Rotational Distortion)', 'NURD (Non-Uniform Rotational Distortion)'),
    mechanism: w('Mekanik rotasyonel IVUS kateterlerinde (40/60 MHz) tahrik şaftının kıvrımlı damarda, dar kılavuz kateterde veya aşırı sıkılmış Y-konnektör (Tuohy-Borst) valfinde sürtünerek bir fazda yavaşlayıp diğerinde hızlanması.', 'In mechanical rotational IVUS catheters (40/60 MHz), friction on the drive cable from vessel tortuosity, acute guide bend, or an over-tightened Tuohy-Borst hemostatic valve causes uneven angular rotation.'),
    appearance: w('Kesitin bir kadranında dokular yelpaze gibi uzamış/bulanıklaşmış (smeared) ve sıkışmış görünür; yalnızca mekanik kateterlerde olur, elektronik (20 MHz) kateterlerde görülmez.', 'One sector of the cross-section appears stretched/smeared like a fan while the opposite sector is compressed; occurs only with mechanical catheters, never solid-state.'),
    fix: w('Hemostatik valfi (Tuohy-Borst) gevşetin, kılavuz kateteri koaksiyel hale getirin ve motor kızak hattındaki bükülmeleri düzeltin.', 'Loosen the Tuohy-Borst hemostatic valve, straighten the motor sled cable, and improve guide catheter coaxiality.')
  },
  {
    id: 'ringdown-stasis',
    name: w('Ring-Down Halkası & Kan Stazı (Ekojenik Kan)', 'Ring-Down Halo & Blood Speckle Stasis'),
    mechanism: w('Transdüser kristallerinin yüksek genlikli yakın alan titreşimi (ring-down) ve dar darlıklarda eritrositlerin rulo (rouleaux) oluşturarak parlak beneklenme yapması.', 'High-amplitude near-field transducer oscillation (ring-down) combined with red blood cell rouleaux aggregation during slow flow across tight stenoses.'),
    appearance: w('Kateter etrafında parlak beyaz halka ve lümen içinde yumuşak plak veya trombüsü taklit eden yoğun benekli ekojenite; lümen sınırının seçilmesini zorlaştırır.', 'Bright white halo around the catheter and dense echogenic blood speckle inside the lumen that mimics soft plaque or thrombus, obscuring the intimal border.'),
    fix: w('20 MHz kateterlerde Ring-Down çıkarma (subtraction) yapın ve kılavuz kateterden 3–5 mL salin/kontrast yıkaması (Flush) yaparak lümeni temizleyin.', 'Perform ring-down subtraction on solid-state catheters and inject a 3–5 mL saline flush through the guide catheter to clear blood speckle.')
  },
  {
    id: 'wire-shadow',
    name: w('Kılavuz Tel (Guidewire) Akustik Gölgesi', 'Guidewire Acoustic Shadowing'),
    mechanism: w('Monorail (hızlı değişim) kateterlerde 0.014" metalik kılavuz telin ultrason probunun hemen yanında seyrederek dar bir açıda ses dalgalarını tam yansıtması.', 'In monorail catheters, the 0.014" metallic guidewire sits alongside the imaging core and reflects ultrasound across a narrow sector.'),
    appearance: w('Lümen içinde parlak noktasal tel ekosunun arkasında 15°–25° dar kama şeklinde karanlık gölge ve kısa reverberasyonlar; yüzeyel kalsiyum veya yan dal ile karıştırılmamalıdır.', 'A narrow 15°–25° wedge shadow with short reverberations behind a bright point-like wire echo inside the lumen; must not be confused with focal calcium.'),
    fix: w('Geri çekme boyunca telin lümendeki izini takip edin; tel gölgesi dar (<25°) ve katetere yakındır, kalsiyum ise damar duvarında geniş yay çizer.', 'Track the wire continuously on pullback; wire shadow is narrow (<25°) and originates inside the lumen near the catheter, unlike mural calcium.')
  },
  {
    id: 'reverberation',
    name: w('Akustik Reverberasyon (Çoklu Konsantrik Yaylar)', 'Acoustic Reverberation (Concentric Ghost Arcs)'),
    mechanism: w('Ultrason dalgalarının çok güçlü bir yansıtıcı (yüzeyel kalsiyum veya metal stent stratı) ile transdüser arasında ileri-geri sekmesi.', 'Ultrasound waves bouncing back and forth repeatedly between a strong reflector (dense calcium or metal stent struts) and the transducer.'),
    appearance: w('Gerçek kalsiyum yayının veya stent stratının arkasında, akustik gölgenin içinde transdüser mesafesinin tam katlarında (2×d, 3×d) hayalet yaylar görülür.', 'False ghost arcs appear inside the dark acoustic shadow behind calcium or stent struts at exact integer multiples (2×d, 3×d) of the transducer-to-reflector distance.'),
    fix: w('Gölge içindeki ikinci ve üçüncü yayların gerçek doku veya dış duvar (EEM) olmadığını bilin; EEM sınırını komşu gölgesiz kadranlardan enterpole edin.', 'Recognize that secondary arcs inside a shadow are ghost echoes, not the true EEM; interpolate the EEM contour from adjacent shadow-free quadrants.')
  },
  {
    id: 'oblique-slicing',
    name: w('Oblik Kesit (Koaksiyel Olmayan Kateter)', 'Oblique Slicing (Non-Coaxial Catheter)'),
    mechanism: w('Keskin damar kıvrımlarında veya geniş ostiumlarda (LMCA/RCA) IVUS kateterinin damar uzun eksenine eğik açıyla durması.', 'In vessel bends or wide ostia (LMCA/RCA), the IVUS catheter lies at an oblique angle relative to the vessel centerline.'),
    appearance: w('Dairesel damar kesiti yapay olarak eliptik/oval görünür; maksimum çap (Dmax) ve kesit alanı (EEM / MLA) olduğundan büyük ölçülür.', 'A circular vessel cross-section appears artificially elliptical; maximum diameter (Dmax) and cross-sectional area (EEM / MLA) are overestimated.'),
    fix: w('Eliptik kesitlerde aşırı büyük stent seçmemek için her zaman minimum çapı (Dmin) esas alın; LMCA değerlendirmesinde koaksiyel kateter pozisyonu sağlayın.', 'Always rely on minimum diameter (Dmin) rather than Dmax or area when the slice is elliptical to avoid stent oversizing.')
  }
]);

export const CALCULATOR_CARDS = Object.freeze([
  {
    id: 'normal-mla',
    category: w('Normal Anatomi & İskemik MLA Eşiği', 'Normal Anatomy & Ischemic MLA Cut-off'),
    title: w('Normal lümen alanı & MLA eşiği (segment bazlı)', 'Normal lumen area & MLA cut-off (by segment)'),
    formulaText: 'A_normal = π × (D_ref / 2)²   ·   AS (%) = (1 − MLA / A_normal) × 100   ·   MLD = 2 × √(MLA / π)',
    thresholds: w(
      'Normal lümen çapı: LM 4.5 · pLAD 3.7 · mLAD ≈2.8 · dLAD 1.9 · pLCx ≈3.4 · pRCA ≈3.9 mm (Dodge 1992) · Non-LM iskemik MLA (FIRST, RVD’ye göre): RVD <3.0: 2.4 · 3.0–3.5: 2.7 · >3.5: 3.6 mm² · LM: Batı 6.0 (LITRO) · Asya 4.5 (Park 2014) · IVUS MLA, FFR/iFR’nin yerini tutmaz',
      'Normal lumen diameter: LM 4.5 · pLAD 3.7 · mLAD ≈2.8 · dLAD 1.9 · pLCx ≈3.4 · pRCA ≈3.9 mm (Dodge 1992) · Non-LM ischemic MLA (FIRST, by RVD): RVD <3.0: 2.4 · 3.0–3.5: 2.7 · >3.5: 3.6 mm² · LM: Western 6.0 (LITRO) · Asian 4.5 (Park 2014) · IVUS MLA does not replace FFR/iFR'
    ),
    inputs: [
      { key: 'segment', label: w('Segment (0=LM, 1=pLAD, 2=mLAD, 3=dLAD, 4=D1, 5=pLCx, 6=dLCx, 7=OM1, 8=pRCA, 9=mRCA, 10=dRCA, 11=PDA)', 'Segment (0=LM, 1=pLAD, 2=mLAD, 3=dLAD, 4=D1, 5=pLCx, 6=dLCx, 7=OM1, 8=pRCA, 9=mRCA, 10=dRCA, 11=PDA)'), defaultVal: 1, min: 0, max: 11, step: 1 },
      { key: 'refDiam', label: w('Referans damar çapı (mm; 0 = segmentin normal değeri)', 'Reference vessel diameter (mm; 0 = normal value for the segment)'), defaultVal: 0, min: 0, max: 6.0, step: 0.05 },
      { key: 'mla', label: w('Ölçülen MLA (mm²)', 'Measured MLA (mm²)'), defaultVal: 3.2, min: 0.5, max: 20.0, step: 0.1 },
      { key: 'asian', label: w('Asya popülasyonu (0=Hayır, 1=Evet; yalnızca LM)', 'Asian population (0=No, 1=Yes; LM only)'), defaultVal: 0, min: 0, max: 1, step: 1 }
    ]
  },
  {
    id: 'plaque-remodeling',
    category: w('Planimetri & Glagov Yeniden Yapılanma', 'Planimetry & Glagov Remodeling'),
    title: w('Plak Yükü (PB) · Remodeling İndeksi (RI) · Eksantrisite', 'Plaque Burden (PB) · Remodeling Index (RI) · Eccentricity'),
    formulaText: 'PB (%) = [(EEM_area − Lumen_area) / EEM_area] × 100   ·   RI = EEM_area,lesion / mean EEM_area,ref ((prox + distal) / 2)',
    thresholds: w('Non-LM MLA <2.8–3.0 mm² (özgüllüğü düşük; IVUS MLA, FFR/iFR’nin yerini tutmaz) · Plak yükü ≥%70 yüksek risk (PROSPECT) · Stent iniş bölgesi PB <%50 · RI >1.05 Pozitif Remodeling', 'Non-LM MLA <2.8–3.0 mm² (low specificity; IVUS MLA does not replace FFR/iFR) · Plaque burden ≥70% high-risk (PROSPECT) · Landing zone PB <50% · RI >1.05 Positive Remodeling'),
    inputs: [
      { key: 'eemArea', label: w('Lezyon EEM alanı (mm²)', 'Lesion EEM area (mm²)'), defaultVal: 12.4, min: 3.0, max: 35.0, step: 0.2 },
      { key: 'lumenArea', label: w('Lezyon Lümen alanı / MLA (mm²)', 'Lesion Lumen area / MLA (mm²)'), defaultVal: 2.6, min: 0.8, max: 25.0, step: 0.1 },
      { key: 'refEemArea', label: w('Ortalama referans EEM alanı ((proks + distal) / 2, mm²)', 'Mean reference EEM area ((prox + distal) / 2, mm²)'), defaultVal: 11.2, min: 3.0, max: 35.0, step: 0.2 },
      { key: 'dMin', label: w('Minimum lümen çapı Dmin (mm)', 'Minimum lumen diameter Dmin (mm)'), defaultVal: 1.65, min: 0.8, max: 6.0, step: 0.05 },
      { key: 'dMax', label: w('Maksimum lümen çapı Dmax (mm)', 'Maximum lumen diameter Dmax (mm)'), defaultVal: 2.05, min: 0.8, max: 6.5, step: 0.05 }
    ]
  },
  {
    id: 'stent-sizing',
    category: w('EAPCI / ULTIMATE Stent Boyutlandırma', 'EAPCI / ULTIMATE Stent Sizing'),
    title: w('Distal EEM & Lümen Bazlı Stent ve POT Balon Seçimi', 'Distal EEM & Lumen-Guided Stent and POT Balloon Selection'),
    formulaText: 'D_EEM = floor(mean distal EEM / 0.25) × 0.25   ·   D_lumen = mean distal lumen + 0–0.25   ·   D_stent = min(D_EEM, mean distal lumen + 0.5)   ·   D_POT ≈ mean proximal lumen',
    thresholds: w('EAPCI EEM bazlı: ortalama distal EEM en yakın 0.25 mm’ye aşağı yuvarlanır · Lümen bazlı: ortalama distal lümen + 0–0.25 mm (mevcut stent boyuna) · Öneri: EEM bazlı değer, distal lümen + 0.5 mm ile sınırlandırılır · POT: proksimal referans lümen çapı', 'EAPCI EEM-based: mean distal EEM rounded down to the nearest 0.25 mm · Lumen-based: mean distal lumen + 0–0.25 mm (to the available stent size) · Recommendation: EEM-based size capped at distal lumen + 0.5 mm · POT: proximal reference lumen diameter'),
    inputs: [
      { key: 'distEemD', label: w('Distal referans EEM çapı (mm)', 'Distal reference EEM diameter (mm)'), defaultVal: 3.6, min: 2.0, max: 6.0, step: 0.05 },
      { key: 'distLumD', label: w('Distal referans Lümen çapı (mm)', 'Distal reference Lumen diameter (mm)'), defaultVal: 3.1, min: 1.75, max: 5.5, step: 0.05 },
      { key: 'proxEemD', label: w('Proksimal referans EEM çapı (mm)', 'Proximal reference EEM diameter (mm)'), defaultVal: 4.2, min: 2.25, max: 6.5, step: 0.05 },
      { key: 'proxLumD', label: w('Proksimal referans Lümen çapı (mm)', 'Proximal reference Lumen diameter (mm)'), defaultVal: 3.65, min: 2.0, max: 6.0, step: 0.05 },
      { key: 'lesionLen', label: w('İnişten inişe uzunluk (mm)', 'Landing-to-landing length (mm)'), defaultVal: 22, min: 8, max: 60, step: 1 }
    ]
  },
  {
    id: 'calcium-score',
    category: w('Kalsiyum Modifikasyon Kararı (Zhang 2021)', 'Calcium Modification Decision (Zhang 2021)'),
    title: w('IVUS Kalsiyum Skoru (0–4 Puan · IVL / Rotablasyon)', 'IVUS Calcium Score (0–4 Points · IVL / Atherectomy)'),
    formulaText: 'Skor = [Ark >270° & uzunluk >5 mm (+1)] + [360° kalsiyum (+1)] + [Kalsifiye nodül (+1)] + [Damar çapı <3.5 mm (+1)]',
    thresholds: w('Skor yalnızca >270° kalsiyumlu lezyonlarda geçerlidir (ark ≤270°: uygulanamaz, standart NC balon hazırlığı genellikle yeterli) · Skor 0–1: Yüksek basınçlı NC/Cutting balon · Skor ≥2: Stent öncesi plak modifikasyonu (IVL veya Aterektomi) önerilir · Skor 4: en yüksek az açılım riski', 'The score applies only to lesions with >270° calcium (arc ≤270°: not applicable, standard NC balloon preparation usually suffices) · Score 0–1: High-pressure NC/Cutting balloon · Score ≥2: Plaque modification (IVL or Rotational/Orbital Atherectomy) recommended before stenting · Score 4: highest underexpansion risk'),
    inputs: [
      { key: 'caArcDeg', label: w('Yüzeyel kalsiyum açısı (°)', 'Superficial calcium arc (°)'), defaultVal: 290, min: 0, max: 360, step: 5 },
      { key: 'caLenMm', label: w('Yüzeyel kalsiyum uzunluğu (mm)', 'Superficial calcium length (mm)'), defaultVal: 6.0, min: 0, max: 30, step: 0.5 },
      { key: 'hasNodule', label: w('Kalsifiye nodül (0=Yok, 1=Var)', 'Calcified nodule (0=No, 1=Yes)'), defaultVal: 0, min: 0, max: 1, step: 1 },
      { key: 'vesselEemMm', label: w('Damar (EEM) çapı (mm)', 'Vessel (EEM) diameter (mm)'), defaultVal: 3.25, min: 2.0, max: 5.5, step: 0.05 }
    ]
  },
  {
    id: 'ultimate-pci',
    category: w('Post-PCI Optimizasyon (ULTIMATE / IVUS-XPL)', 'Post-PCI Optimization (ULTIMATE / IVUS-XPL)'),
    title: w('Optimal Stent Açılımı Kontrol Listesi (MSA · Kenar · Apozisyon)', 'Optimal Stent Expansion Checklist (MSA · Edge · Apposition)'),
    formulaText: 'ULTIMATE: (1) MSA >5.0 mm² | >90% distal ref lumen · (2) edge (5 mm) PB <50% · (3) no media dissection >3 mm   ·   IVUS-XPL: MSA > distal ref lumen',
    thresholds: w('ULTIMATE: 3 kriterin tamamı sağlanırsa Optimal PCI (1 yıllık TVF %1.6 vs %4.4) · EAPCI: >%80 (non-LM MSA >5.5 mm²) · IVUS-XPL: MSA > distal referans lümen alanı · Malapozisyon (0.4 mm aksiyel, >1 mm uzunluk) OCT çalışmalarından türetilmiş ayrı bir kontroldür', 'ULTIMATE: meeting all 3 criteria defines Optimal IVUS-guided PCI (1-year TVF 1.6% vs 4.4%) · EAPCI: >80% (non-LM MSA >5.5 mm²) · IVUS-XPL: MSA > distal reference lumen area · Malapposition (0.4 mm axial, >1 mm length) is a separate OCT-derived check'),
    inputs: [
      { key: 'msaMm2', label: w('Minimum Stent Alanı MSA (mm²)', 'Minimum Stent Area MSA (mm²)'), defaultVal: 5.6, min: 1.5, max: 18.0, step: 0.1 },
      { key: 'distRefLumMm2', label: w('Distal referans lümen alanı (mm²)', 'Distal reference lumen area (mm²)'), defaultVal: 6.2, min: 2.0, max: 18.0, step: 0.1 },
      { key: 'edgePbPct', label: w('Stent kenarı (5 mm) plak yükü (%)', 'Stent edge (5 mm) plaque burden (%)'), defaultVal: 42, min: 10, max: 85, step: 1 },
      { key: 'edgeDissectMm', label: w('Media tutulumlu kenar diseksiyon uzunluğu (mm)', 'Media-involving edge dissection length (mm)'), defaultVal: 0, min: 0, max: 10, step: 0.5 },
      { key: 'malappMm', label: w('Maks malapozisyon mesafesi (mm)', 'Max malapposition gap (mm)'), defaultVal: 0.15, min: 0, max: 2.0, step: 0.05 }
    ]
  },
  {
    id: 'lmca-kang',
    category: w('Sol Ana Koroner (LMCA) Bifurkasyon', 'Left Main (LMCA) Bifurcation'),
    title: w('LMCA İskemi Eşiği & Kang 5-6-7-8 Stent Hedefleri', 'LMCA Ischemic Cutoff & Kang 5-6-7-8 Stent Targets'),
    formulaText: 'Kang Kuralı (Min Stent Alanı): LCx Ostium >5 mm² · LAD Ostium >6 mm² · POC >7 mm² · Distal LMCA >8 mm²',
    thresholds: w('Pre-PCI LMCA MLA: <4.5 mm² revaskülarizasyon endikasyonu, 4.5–6.0 mm² gri zon (FFR/klinik), ≥6.0 mm² güvenli erteleme (LITRO)', 'Pre-PCI LMCA MLA: <4.5 mm² revascularize, 4.5–6.0 mm² gray zone (FFR/clinical), ≥6.0 mm² safe to defer (LITRO)'),
    inputs: [
      { key: 'preLmMla', label: w('Pre-PCI LMCA MLA (mm²)', 'Pre-PCI LMCA MLA (mm²)'), defaultVal: 4.3, min: 2.0, max: 15.0, step: 0.1 },
      { key: 'lcxOstMsa', label: w('Post-PCI LCx Ostium MSA (mm²)', 'Post-PCI LCx Ostium MSA (mm²)'), defaultVal: 5.4, min: 2.0, max: 12.0, step: 0.1 },
      { key: 'ladOstMsa', label: w('Post-PCI LAD Ostium MSA (mm²)', 'Post-PCI LAD Ostium MSA (mm²)'), defaultVal: 6.6, min: 2.5, max: 14.0, step: 0.1 },
      { key: 'pocMsa', label: w('Post-PCI Karina / POC MSA (mm²)', 'Post-PCI Carina / POC MSA (mm²)'), defaultVal: 7.8, min: 3.0, max: 16.0, step: 0.1 },
      { key: 'distLmMsa', label: w('Post-PCI Distal LMCA MSA (mm²)', 'Post-PCI Distal LMCA MSA (mm²)'), defaultVal: 9.2, min: 4.0, max: 20.0, step: 0.1 }
    ]
  }
]);

export const REFERENCES = Object.freeze([
  'Mintz GS, Nissen SE, Anderson WD, et al. ACC Clinical Expert Consensus Document on Standards for Acquisition, Measurement and Reporting of Intravascular Ultrasound Studies (IVUS). J Am Coll Cardiol. 2001;37(5):1478–1492.',
  'Räber L, Mintz GS, Koskinas KC, et al. Clinical use of intracoronary imaging. Part 1: guidance and optimization of coronary interventions. An EAPCI Expert Consensus Document. Eur Heart J. 2018;39(35):3281–3300.',
  'Zhang J, Gao X, Kan J, et al. Intravascular Ultrasound Versus Angiography-Guided Drug-Eluting Stent Implantation: The ULTIMATE Trial. J Am Coll Cardiol. 2018;72(24):3126–3137.',
  'Hong SJ, Kim BK, Shin DH, et al. Effect of Intravascular Ultrasound-Guided vs Angiography-Guided Everolimus-Eluting Stent Implantation: The IVUS-XPL Randomized Clinical Trial. JAMA. 2015;314(20):2155–2163.',
  'Lee JM, Choi KH, Song YB, et al. Intravascular Imaging-Guided or Angiography-Guided Complex PCI (RENOVATE-COMPLEX-PCI). N Engl J Med. 2023;388(18):1668–1679.',
  'Kang SJ, Ahn JM, Song H, et al. Comprehensive intravascular ultrasound assessment of stent area and its impact on restenosis and adverse cardiac events in 403 patients with unprotected left main disease. Circ Cardiovasc Interv. 2011;4(6):562–569.',
  'de la Torre Hernandez JM, Hernández Hernandez F, Alfonso F, et al. Prospective application of pre-defined intravascular ultrasound criteria for assessment of intermediate left main coronary artery lesions (LITRO). J Am Coll Cardiol. 2011;58(4):351–358.',
  'Fujino A, Mintz GS, Matsumura M, et al. A new optical coherence tomography-based calcium scoring system to predict stent underexpansion. EuroIntervention. 2018;13(18):e2182–e2189.',
  'Zhang M, Matsumura M, Usui E, et al. Intravascular ultrasound-derived calcium score to predict stent expansion in severely calcified lesions. Circ Cardiovasc Interv. 2021;14(10):e010296.',
  'Stone GW, Maehara A, Lansky AJ, et al. A prospective natural-history study of coronary atherosclerosis (PROSPECT). N Engl J Med. 2011;364(3):226–235.',
  'Ge J, Erbel R, Rupprecht HJ, et al. Comparison of intravascular ultrasound and angiography in the assessment of myocardial bridging. Circulation. 1994;89(4):1725–1732.',
  'Waksman R, Legutko J, Singh J, et al. FIRST: Fractional Flow Reserve and Intravascular Ultrasound Relationship Study. J Am Coll Cardiol. 2013;61(9):917–923.',
  'Dodge JT Jr, Brown BG, Bolson EL, Dodge HT. Lumen diameter of normal human coronary arteries. Circulation. 1992;86(1):232–246.',
  'Park SJ, Ahn JM, Kang SJ, et al. Intravascular ultrasound-derived minimal lumen area criteria for functionally significant left main coronary artery stenosis. JACC Cardiovasc Interv. 2014;7(8):868–874.'
]);

// Coronary Physiology Lab · Clinical Scenarios, Modalities, Artifacts & References
// Bilingual (TR / EN) educational dataset modeled on invasive cath-lab physiology standards.

const w = (tr, en) => Object.freeze({ tr, en });

export const SHELL_TEXT = Object.freeze({
  tr: {
    title: 'Cardia · Koroner Fizyoloji Laboratuvarı (FFR · Termodilüsyon · Doppler)',
    heading: 'Koroner Fizyoloji ve Mikrodolaşım Laboratuvarı',
    subtitle: 'Epikardiyal darlıklardan mikrovasküler disfonksiyona (INOCA/ANOCA) ve vazospazma kadar invaziv koroner fizyoloji protokollerini adım adım uygulayın, geri çekme (pullback) eğrilerini ve hemodinamik indeksleri canlı simüle edin.',
    disclaimer: 'Şematik eğitim simülatörüdür; gerçek hasta kaydı veya tıbbi cihaz değildir. Tüm basınç, termodilüsyon ve Doppler eğrileri yayınlanmış fizyolojik modellerden türetilmiştir. Klinik karar amacıyla kullanılamaz.'
  },
  en: {
    title: 'Cardia · Coronary Physiology Lab (FFR · Thermodilution · Doppler)',
    heading: 'Coronary Physiology and Microcirculation Laboratory',
    subtitle: 'Practice invasive coronary physiology step by step from epicardial stenoses to microvascular dysfunction (INOCA/ANOCA) and vasospasm; simulate pullback curves and hemodynamic indices in real time.',
    disclaimer: 'Schematic teaching simulator; not a patient recording or medical device. All pressure, thermodilution, and Doppler tracings are synthesized from published physiological models. Not for clinical decisions.'
  }
});

export const WORKSPACE_MODES = Object.freeze([
  {
    id: 'lab',
    label: w('Klinik Laboratuvar', 'Clinical Lab'),
    badge: w('4 ÖLÇÜM MODÜLÜ', '4 MODALITIES')
  },
  {
    id: 'simulator',
    label: w('Nedensel Simülatör', 'Hemodynamic Simulator'),
    badge: w('BASINÇ – AKIM', 'PRESSURE – FLOW')
  },
  {
    id: 'pitfalls',
    label: w('Artefaktlar & Tuzaklar', 'Pitfalls & Artifacts'),
    badge: w('DALGA ANALİZİ', 'WAVEFORM QA')
  },
  {
    id: 'calculator',
    label: w('Formüller & Hesaplayıcı', 'Formulas & Calculator'),
    badge: w('DENKLEMLER', 'EQUATIONS')
  }
]);

export const PHYSIOLOGY_MODALITIES = Object.freeze([
  {
    id: 'epicardial',
    title: w('Epikardiyal', 'Epicardial'),
    subtitle: w('FFR · iFR/NHPR · Pullback · PPG · Sanal PCI', 'FFR · iFR/NHPR · Pullback · PPG · Virtual PCI'),
    summary: w(
      'Basınç teli ile aortik (Pa) ve distal koroner (Pd) basınçları ölçer. Maksimal hiperemide FFR (≤0.80 anlamlı) ve istirahatte diyastolik NHPR/iFR (≤0.89 anlamlı) hesaplanır; geri çekme (pullback) ile fokal, diffüz veya seri darlık paterni (PPG) ayrıştırılır.',
      'Measures aortic (Pa) and distal coronary (Pd) pressures with a pressure wire. Computes FFR at maximal hyperemia (≤0.80 significant) and resting diastolic NHPR/iFR (≤0.89 significant); pullback differentiates focal, diffuse, and serial disease patterns (PPG).'
    )
  },
  {
    id: 'bolus',
    title: w('Bolus Termodilüsyon', 'Bolus Thermodilution'),
    subtitle: w('Tmn · CFR · IMR · IMRcorr · RRR · MRR', 'Tmn · CFR · IMR · IMRcorr · RRR · MRR'),
    summary: w(
      'Oda sıcaklığında 3 mL salin bolus enjeksiyonlarıyla ortalama geçiş süresini (Tmn, s) ölçer. İstirahat ve hiperemi Tmn oranından CFR (<2.5 anormal) ve distal basınç çarpımından mikrovasküler direnç indeksi IMR (≥25 anormal) elde edilir.',
      'Measures mean transit time (Tmn, s) using brisk 3 mL room-temperature saline injections. Computes CFR (<2.5 abnormal) from the resting-to-hyperemic Tmn ratio and the index of microcirculatory resistance IMR (≥25 abnormal).'
    )
  },
  {
    id: 'continuous',
    title: w('Sürekli Termodilüsyon', 'Continuous Thermodilution'),
    subtitle: w('Q (mL/dk) · Rμ (WU) · CFR · MRR', 'Q (mL/min) · Rμ (WU) · CFR · MRR'),
    summary: w(
      'Yan delikli infüzyon mikrokateteri ile 10 mL/dk (istirahat) ve 20 mL/dk (hiperemi) hızında salin infüzyonu yapılır. Distal karışım sıcaklığı (T) ve kateter ucu infüzat sıcaklığı (Ti) üzerinden mutlak koroner akım (Q) ve mikrovasküler direnç (Rμ) doğrudan hesaplanır.',
      'Infuses room-temperature saline through a side-hole microcatheter at 10 mL/min (rest) and 20 mL/min (hyperemia). Directly calculates absolute volumetric coronary flow (Q) and microvascular resistance (Rμ) from distal mixture temperature (T) and infusate tip temperature (Ti).'
    )
  },
  {
    id: 'doppler',
    title: w('Doppler & Asetilkolin', 'Doppler & Acetylcholine'),
    subtitle: w('APV · CFR · HMR · HSR · ACh Provokasyonu', 'APV · CFR · HMR · HSR · ACh Provocation'),
    summary: w(
      'Doppler teli ile ortalama zirve akım hızını (APV, cm/s) kaydeder. Adenozin ile endotelden bağımsız CFR ve HMR ölçülür; kademeli intrakoroner Asetilkolin (ACh) testi ile endotel disfonksiyonu, epikardiyal spazm ve mikrovasküler spazm değerlendirilir.',
      'Records average peak velocity (APV, cm/s) with a Doppler sensor wire. Assesses endothelium-independent CFR and HMR with adenosine, and tests endothelial dysfunction, epicardial spasm, and microvascular spasm via graded intracoronary Acetylcholine (ACh).'
    )
  }
]);

export const CORONARY_TERRITORIES = Object.freeze([
  { id: 'LAD', label: 'LAD', scaleFlow: 1.0, refQRest: '50–100', refQHyp: '175–350', refRmuHyp: '200–470', defaultInfRest: 10, defaultInfHyp: 20 },
  { id: 'LCX', label: 'LCx', scaleFlow: 0.72, refQRest: '40–75', refQHyp: '120–240', refRmuHyp: '300–680', defaultInfRest: 8, defaultInfHyp: 15 },
  { id: 'RCA', label: 'RCA', scaleFlow: 0.85, refQRest: '45–90', refQHyp: '140–290', refRmuHyp: '250–550', defaultInfRest: 8, defaultInfHyp: 15 }
]);

export const HYPEREMIC_AGENTS = Object.freeze([
  { id: 'iv-adenosine', label: w('IV Adenozin (140 µg/kg/dk infüzyon)', 'IV Adenosine (140 µg/kg/min infusion)'), sustained: true },
  { id: 'ic-adenosine', label: w('İK Adenozin (bolus)', 'IC Adenosine (bolus)'), sustained: false },
  { id: 'ic-papaverine', label: w('İK Papaverin', 'IC Papaverine'), sustained: true }
]);

export const CLINICAL_CASES = Object.freeze([
  {
    id: 'focal-lad',
    tag: 'C1',
    modalities: ['epicardial', 'bolus', 'continuous'],
    vessel: 'LAD',
    name: w('Fokal Orta-LAD Darlığı', 'Focal Mid-LAD Stenosis'),
    cuff: [138, 78],
    heartRate: 68,
    lesions: [{ id: 'mid-lad', posMm: 38, lengthMm: 8, stenosisPct: 76, ffrDrop: 0.45, label: w('Orta LAD Fokal Plak', 'Mid-LAD Focal Plaque') }],
    diffuseLoss: 0.03,
    micro: { qRestBase: 68, imr: 16, rmuRest: 1380, rmuHyp: 310 },
    artifact: 'none',
    brief: w(
      'Anjiyografide orta LAD segmentinde %75–80 fokal darlık izleniyor. Hiperemik FFR, iFR ve geri çekme (pullback) eğrisini değerlendirin.',
      'Angiography shows a tight 75–80% focal stenosis in the mid-LAD. Evaluate hyperemic FFR, iFR, and the pressure pullback curve.'
    ),
    hint: w(
      'IV adenozin altında geri çekme (Pull back) yaparak 38. mm hizasındaki keskin basınç sıçrayışını (step-up) ve yüksek PPG indeksini (≥0.62) gözlemleyin.',
      'Perform a pullback under IV adenosine to observe the sharp pressure step-up at 38 mm and high PPG index (≥0.62).'
    ),
    takeaway: w(
      'Fokal hastalık (PPG ≥0.62): Basınç kaybının tamamına yakını kısa bir segmentte toplanmıştır. Sanal PCI ile stent yerleştirildiğinde FFR normale döner ve trans-stent gradyan (TSG) sıfıra yaklaşır.',
      'Focal disease (PPG ≥0.62): Almost all pressure loss is concentrated across a short segment. Virtual PCI stenting restores FFR to normal with a near-zero trans-stent gradient (TSG).'
    )
  },
  {
    id: 'normal-coronary',
    tag: 'C2',
    modalities: ['epicardial', 'bolus', 'continuous', 'doppler'],
    vessel: 'LAD',
    name: w('Normal Epikardiyal ve Mikrovasküler Fonksiyon', 'Normal Epicardial and Microvascular Function'),
    cuff: [126, 72],
    heartRate: 64,
    lesions: [],
    diffuseLoss: 0.03,
    micro: { qRestBase: 70, imr: 14, rmuRest: 1398, rmuHyp: 325 },
    doppler: {
      apvRest: 22,
      apvHyp: 89,
      diamMm: 2.8,
      achResponse: [
        { dose: 'low', flowDeltaPct: 28, diamDeltaPct: 3, angina: false, ecg: 'normal' },
        { dose: 'mid', flowDeltaPct: 68, diamDeltaPct: 6, angina: false, ecg: 'normal' },
        { dose: 'high', flowDeltaPct: 105, diamDeltaPct: 8, angina: false, ecg: 'normal' }
      ],
      ntgDiamDeltaPct: 22
    },
    artifact: 'none',
    brief: w(
      'Anjiyografik olarak düzgün konturlu koroner arter. Normal epikardiyal basınç oranlarını, termodilüsyon akım rezervini ve normal endotel yanıtını doğrulayın.',
      'Angiographically smooth coronary artery. Confirm normal epicardial pressure ratios, thermodilution flow reserve, and normal endothelial response.'
    ),
    hint: w(
      'FFR >0.95, CFR >2.5, IMR <25, Rμ <470 WU ve Asetilkolin ile koroner kan akımında (CBF) >%50 artış beklenir.',
      'Expect FFR >0.95, CFR >2.5, IMR <25, Rμ <470 WU, and >50% CBF increase with Acetylcholine.'
    ),
    takeaway: w(
      'Normal koroner fizyoloji: Hem epikardiyal iletim hem de endotelden bağımsız (adenozin) ve endotele bağımlı (ACh) mikrovasküler fonksiyon korunmuştur.',
      'Normal coronary physiology: Both epicardial conductance and endothelium-independent (adenosine) plus endothelium-dependent (ACh) microvascular function are preserved.'
    )
  },
  {
    id: 'diffuse-lad',
    tag: 'C3',
    modalities: ['epicardial', 'bolus', 'continuous'],
    vessel: 'LAD',
    name: w('Diffüz Aterosklerotik Hastalık', 'Diffuse Atherosclerotic Disease'),
    cuff: [146, 80],
    heartRate: 70,
    lesions: [],
    diffuseLoss: 0.25,
    micro: { qRestBase: 64, imr: 17, rmuRest: 1420, rmuHyp: 350 },
    artifact: 'none',
    brief: w(
      'Damar boyunca belirgin tek bir darlık olmaksızın uzun segment ince kalibrasyon ve düzensizlik. Distal FFR anlamlı düşük (0.75) ölçülüyor.',
      'Long-segment vessel irregularity without a single dominant stenosis. Distal FFR measures significantly low (0.75).'
    ),
    hint: w(
      'Geri çekme (Pull back) sırasında basıncın tek bir basamak yerine proksimalden distale kademeli olarak düştüğünü (PPG <0.62) izleyin.',
      'During pullback, observe pressure falling gradually along the entire vessel length without a focal step (PPG <0.62).'
    ),
    takeaway: w(
      'Diffüz hastalık (PPG <0.62): Anormal FFR her zaman fokal stent endikasyonu anlamına gelmez. Tek bir kısa stent FFR değerini yeterince düzeltemez; optimal medikal tedavi veya uzun segment stratejisi değerlendirilmelidir.',
      'Diffuse disease (PPG <0.62): An abnormal FFR does not automatically mean a focal stent will succeed. A single short stent recovers little FFR; medical therapy or dedicated surgical/long-segment strategy is preferred.'
    )
  },
  {
    id: 'serial-lad',
    tag: 'C4',
    modalities: ['epicardial'],
    vessel: 'LAD',
    name: w('Seri (Ardışık) İki Lezyon Etkileşimi', 'Serial (Tandem) Lesions Interaction'),
    cuff: [140, 78],
    heartRate: 72,
    lesions: [
      { id: 'prox-lad', posMm: 22, lengthMm: 7, stenosisPct: 70, ffrDrop: 0.22, label: w('Proksimal LAD Lezyonu', 'Proximal LAD Lesion') },
      { id: 'dist-lad', posMm: 54, lengthMm: 7, stenosisPct: 68, ffrDrop: 0.18, label: w('Distal LAD Lezyonu', 'Distal LAD Lesion') }
    ],
    diffuseLoss: 0.03,
    micro: { qRestBase: 65, imr: 15, rmuRest: 1400, rmuHyp: 330 },
    artifact: 'none',
    brief: w(
      'Proksimal ve distal LAD segmentlerinde ardışık iki ciddi darlık. Her darlık diğerinin üzerinden geçen maksimal hiperemik akımı kısıtlar.',
      'Two tandem stenoses in the proximal and distal LAD. Each lesion limits maximal hyperemic flow across the other.'
    ),
    hint: w(
      'Pullback eğrisinde iki ayrı basamak (step-up) görülür. Sanal PCI panelinde büyük basamağı önce stentleyip kalan lezyonun gerçek gradyanının nasıl arttığını inceleyin.',
      'Pullback reveals two distinct steps. Use Virtual PCI to stent the larger step first and see how the remaining lesion gradient unmasks.'
    ),
    takeaway: w(
      'Seri lezyonlarda her bir darlık maksimal akımı azalttığı için tek başına oluşturacağı basınç kaybını maskeler. En büyük ΔFFR basamağına sahip lezyon önce tedavi edilmeli ve ardından FFR tekrar ölçülmelidir.',
      'In serial lesions, reduced flow masks the true standalone severity of each stenosis. Treat the lesion with the largest ΔFFR step first, then re-measure.'
    )
  },
  {
    id: 'structural-cmd',
    tag: 'C5',
    modalities: ['epicardial', 'bolus', 'continuous', 'doppler'],
    vessel: 'LAD',
    name: w('Yapısal Mikrovasküler Disfonksiyon (Structural CMD)', 'Structural Microvascular Dysfunction (Structural CMD)'),
    cuff: [134, 76],
    heartRate: 68,
    lesions: [],
    diffuseLoss: 0.05,
    micro: { qRestBase: 62, imr: 34, rmuRest: 1490, rmuHyp: 615 },
    doppler: {
      apvRest: 21,
      apvHyp: 38,
      diamMm: 2.7,
      achResponse: [
        { dose: 'low', flowDeltaPct: 22, diamDeltaPct: 2, angina: false, ecg: 'normal' },
        { dose: 'mid', flowDeltaPct: 48, diamDeltaPct: 4, angina: false, ecg: 'normal' },
        { dose: 'high', flowDeltaPct: 65, diamDeltaPct: 5, angina: false, ecg: 'normal' }
      ],
      ntgDiamDeltaPct: 20
    },
    artifact: 'none',
    brief: w(
      'Efor anginası ve pozitif iskemi testi olan hastada obstrüktif epikardiyal darlık yok (INOCA). FFR normal (0.95) ancak mikrodolaşım direnci yüksek.',
      'Exertional angina and positive stress test with non-obstructive epicardial arteries (INOCA). FFR is normal (0.95) but minimal microvascular resistance is elevated.'
    ),
    hint: w(
      'Bolus veya Sürekli Termodilüsyon sekmesine geçerek düşük CFR (<2.0–2.5), yüksek IMR (≥25) ve yüksek hiperemik Rμ (>470 WU) değerlerini doğrulayın.',
      'Switch to Bolus or Continuous Thermodilution to confirm reduced CFR (<2.0–2.5), elevated IMR (≥25), and elevated hyperemic Rμ (>470 WU).'
    ),
    takeaway: w(
      'Yapısal CMD: Normal FFR yalnızca epikardiyal darlığı dışlar, miyokardiyal iskemiyi dışlamaz. Kapiller seyrelme veya arteriyoler yeniden yapılanma nedeniyle minimal mikrovasküler direnç (IMR ≥25, Rμ >470 WU) yüksektir ve CFR ile MRR düşüktür.',
      'Structural CMD: A normal FFR rules out epicardial obstruction, not myocardial ischemia. Capillary rarefaction or arteriolar remodeling raises minimal resistance (IMR ≥25, Rμ >470 WU) and lowers CFR and MRR.'
    )
  },
  {
    id: 'functional-cmd',
    tag: 'C6',
    modalities: ['bolus', 'continuous', 'doppler'],
    vessel: 'LAD',
    name: w('Fonksiyonel CMD (Yüksek İstirahat Akımı)', 'Functional CMD (High Resting Flow)'),
    cuff: [148, 84],
    heartRate: 78,
    lesions: [],
    diffuseLoss: 0.04,
    micro: { qRestBase: 135, imr: 22, rmuRest: 760, rmuHyp: 390 },
    doppler: {
      apvRest: 36,
      apvHyp: 68,
      diamMm: 2.8,
      achResponse: [
        { dose: 'low', flowDeltaPct: 25, diamDeltaPct: 2, angina: false, ecg: 'normal' },
        { dose: 'mid', flowDeltaPct: 52, diamDeltaPct: 4, angina: false, ecg: 'normal' },
        { dose: 'high', flowDeltaPct: 72, diamDeltaPct: 6, angina: false, ecg: 'normal' }
      ],
      ntgDiamDeltaPct: 21
    },
    artifact: 'none',
    brief: w(
      'Obstrüktif darlığı olmayan hastada yüksek istirahat metabolik talebi nedeniyle bazal koroner akım artmış durumda.',
      'Non-obstructive coronary arteries with elevated baseline myocardial oxygen demand driving high resting coronary flow.'
    ),
    hint: w(
      'Hiperemik direnç (IMR <25, Rμ_hyp normal) korunmuş olmasına rağmen istirahat akımı yüksek (Tmn_rest kısa, Q_rest yüksek) olduğu için CFR (<2.5) düşüktür.',
      'Although hyperemic resistance is normal (IMR <25, normal Rμ_hyp), elevated resting flow (short Tmn_rest, high Q_rest) exhausts vasodilatory reserve and lowers CFR (<2.5).'
    ),
    takeaway: w(
      'Fonksiyonel CMD: Mikrovasküler yatak maksimal olarak genişleyebilmektedir (IMR <25), ancak istirahatte zaten vazodilate olduğu için akım rezervi (CFR) tükenmiştir.',
      'Functional CMD: The microcirculation can dilate normally at peak hyperemia (IMR <25), but baseline vasodilation at rest leaves little reserve (low CFR).'
    )
  },
  {
    id: 'doppler-endothelial',
    tag: 'D1',
    modalities: ['doppler'],
    vessel: 'LAD',
    name: w('Endotel Disfonksiyonu (Korunmuş CFR)', 'Endothelial Dysfunction (Preserved CFR)'),
    cuff: [136, 78],
    heartRate: 66,
    lesions: [],
    diffuseLoss: 0.04,
    micro: { qRestBase: 64, imr: 16, rmuRest: 1380, rmuHyp: 330 },
    doppler: {
      apvRest: 22,
      apvHyp: 76,
      diamMm: 2.8,
      achResponse: [
        { dose: 'low', flowDeltaPct: 8, diamDeltaPct: -5, angina: false, ecg: 'normal' },
        { dose: 'mid', flowDeltaPct: 16, diamDeltaPct: -14, angina: false, ecg: 'normal' },
        { dose: 'high', flowDeltaPct: 24, diamDeltaPct: -28, angina: false, ecg: 'normal' }
      ],
      ntgDiamDeltaPct: 21
    },
    artifact: 'none',
    brief: w(
      'Adenozin yanıtı normal (CFR >2.5) olan hastada Asetilkolin provokasyonu ile nitrik oksit (NO) aracılı vazodilatasyon test ediliyor.',
      'Patient with normal adenosine response (CFR >2.5) undergoing Acetylcholine provocation to test nitric-oxide-mediated endothelial vasodilation.'
    ),
    hint: w(
      'ACh low → mid → high dozlarını uygulayın: CBF artışı <%50 kalır ve epikardiyal çapta >%20 daralma gelişir.',
      'Administer ACh low → mid → high doses: CBF rises by <50% accompanied by >20% epicardial diameter constriction.'
    ),
    takeaway: w(
      'Endotel disfonksiyonu: Adenozin düz kas hücresini doğrudan gevşetirken, Asetilkolin sağlam endotelden NO salınımına ihtiyaç duyar. Endotel hasarında ACh paradoksal vazokonstriksiyon (>%20 çap kaybı) ve yetersiz akım artışı (<%50 ΔCBF) yapar.',
      'Endothelial dysfunction: Adenosine relaxes vascular smooth muscle directly, whereas Acetylcholine requires intact endothelial NO release. Impaired endothelium causes paradoxical vasoconstriction (>20% diameter loss) and blunted flow increase (<50% ΔCBF).'
    )
  },
  {
    id: 'doppler-epispasm',
    tag: 'D2',
    modalities: ['doppler'],
    vessel: 'LAD',
    name: w('Epikardiyal Koroner Vazospazm (Prinzmetal)', 'Epicardial Coronary Vasospasm (Prinzmetal)'),
    cuff: [130, 74],
    heartRate: 70,
    lesions: [],
    diffuseLoss: 0.04,
    micro: { qRestBase: 65, imr: 16, rmuRest: 1360, rmuHyp: 320 },
    doppler: {
      apvRest: 23,
      apvHyp: 82,
      diamMm: 2.9,
      achResponse: [
        { dose: 'low', flowDeltaPct: 18, diamDeltaPct: -8, angina: false, ecg: 'normal' },
        { dose: 'mid', flowDeltaPct: 12, diamDeltaPct: -32, angina: false, ecg: 'normal' },
        { dose: 'high', flowDeltaPct: -64, diamDeltaPct: -92, angina: true, ecg: 'st-elevation' }
      ],
      ntgDiamDeltaPct: 24
    },
    artifact: 'none',
    brief: w(
      'İstirahat ve sabaha karşı göğüs ağrısı atakları olan hastada normal bazal anjiyografi. Yüksek doz ACh ile epikardiyal spazm provokasyonu.',
      'Rest and early-morning chest pain episodes with normal baseline angiography. High-dose ACh provocation for epicardial spasm.'
    ),
    hint: w(
      'ACh yüksek dozda ≥%90 epikardiyal daralma, göğüs ağrısı ve EKG ST yükselmesi gelişir; İK Nitrogliserin ile spazmı çözün.',
      'High-dose ACh triggers ≥90% epicardial constriction, chest pain, and ST elevation; reverse immediately with IC Nitroglycerin.'
    ),
    takeaway: w(
      'Epikardiyal vazospazm (COVADIS kriterleri): ACh ile ≥%90 lümen daralması + tipik anginanın tetiklenmesi + iskemik EKG değişikliği (ST yükselmesi/çökmesi). Kalsiyum kanal blokerleri ve uzun etkili nitratlarla tedavi edilir.',
      'Epicardial vasospasm (COVADIS criteria): ≥90% lumen constriction with ACh + reproduction of angina + ischemic ECG shift. Treated with calcium-channel blockers and nitrates.'
    )
  },
  {
    id: 'doppler-microspasm',
    tag: 'D3',
    modalities: ['doppler'],
    vessel: 'LAD',
    name: w('Mikrovasküler Spazm', 'Microvascular Spasm'),
    cuff: [128, 74],
    heartRate: 68,
    lesions: [],
    diffuseLoss: 0.04,
    micro: { qRestBase: 64, imr: 18, rmuRest: 1400, rmuHyp: 350 },
    doppler: {
      apvRest: 22,
      apvHyp: 78,
      diamMm: 2.8,
      achResponse: [
        { dose: 'low', flowDeltaPct: 6, diamDeltaPct: -4, angina: false, ecg: 'normal' },
        { dose: 'mid', flowDeltaPct: -5, diamDeltaPct: -12, angina: false, ecg: 'normal' },
        { dose: 'high', flowDeltaPct: -36, diamDeltaPct: -24, angina: true, ecg: 'st-depression' }
      ],
      ntgDiamDeltaPct: 20
    },
    artifact: 'none',
    brief: w(
      'ACh provokasyonu sırasında epikardiyal arterde ≥%90 spazm olmaksızın tipik göğüs ağrısı, ST çökmesi ve akım hızında düşüş gelişen olgu.',
      'ACh provocation reproducing typical chest pain, ST depression, and reduced flow without ≥90% epicardial constriction.'
    ),
    hint: w(
      'ACh high dozunda epikardiyal çap daralması <%90 kalırken (yalnızca -%24), mikrodolaşım spazmı nedeniyle akım düşer, angina ve ST depresyonu oluşur.',
      'At high-dose ACh, epicardial constriction remains <90% (-24%), while arteriolar spasm reduces flow and triggers angina with ST depression.'
    ),
    takeaway: w(
      'Mikrovasküler spazm: Epikardiyal çapta ≥%90 daralma olmadan ACh ile anginanın ve iskemik EKG değişikliklerinin (ST çökmesi) tetiklenmesidir.',
      'Microvascular spasm: Reproduction of angina and ischemic ECG changes (ST depression) during ACh without ≥90% epicardial vasoconstriction.'
    )
  },
  {
    id: 'artifact-drift',
    tag: 'A1',
    modalities: ['epicardial'],
    vessel: 'LAD',
    name: w('Artefakt · Sensör Sürüklenmesi (Signal Drift)', 'Artifact · Sensor Signal Drift'),
    cuff: [136, 76],
    heartRate: 68,
    lesions: [{ id: 'mid-lad-mod', posMm: 34, lengthMm: 6, stenosisPct: 55, ffrDrop: 0.11, label: w('Orta LAD Orta Darlık', 'Mid-LAD Intermediate Plaque') }],
    diffuseLoss: 0.03,
    micro: { qRestBase: 68, imr: 15, rmuRest: 1380, rmuHyp: 320 },
    artifact: 'drift',
    brief: w(
      'Orta dereceli LAD lezyonu. Ölçüm sonunda sensörü kılavuz kateter ucuna geri çektiğinizde Pd/Pa değerinin 1.00 olmadığını fark ediyorsunuz.',
      'Intermediate LAD lesion. Upon pulling the sensor back to the guide catheter tip, Pd/Pa no longer reads 1.00.'
    ),
    hint: w(
      'Dalga formları ve dikrotik çentik korunmuş ancak Pd eğrisi paralel olarak aşağı kaymış (-6 mmHg drift). Yeniden Equalize yapın.',
      'Waveform morphology and dicrotic notches remain intact, but Pd has shifted downward in parallel (-6 mmHg drift). Re-equalize.'
    ),
    takeaway: w(
      'Sensör drifti: Kateter ucunda Pd/Pa 0.98–1.02 aralığı dışındaysa ölçüm geçersizdir. Negatif drift FFR değerini yapay olarak düşük (yalancı pozitif) gösterir; ostiumda tekrar Equalize edilmelidir.',
      'Sensor drift: If guide-tip Pd/Pa is outside 0.98–1.02, the measurement is invalid. Downward drift makes FFR falsely low; re-equalize at the guide tip and repeat.'
    )
  },
  {
    id: 'artifact-vent',
    tag: 'A2',
    modalities: ['epicardial'],
    vessel: 'LAD',
    name: w('Artefakt · Ventrikülerize Pa (Derin/Wedged Kılavuz Kateter)', 'Artifact · Ventricularized Pa (Deep/Wedged Guide)'),
    cuff: [142, 80],
    heartRate: 68,
    lesions: [{ id: 'prox-lad-sig', posMm: 28, lengthMm: 7, stenosisPct: 72, ffrDrop: 0.21, label: w('Proksimal LAD Darlığı', 'Proximal LAD Stenosis') }],
    diffuseLoss: 0.03,
    micro: { qRestBase: 68, imr: 15, rmuRest: 1380, rmuHyp: 320 },
    artifact: 'vent',
    brief: w(
      'Proksimal darlıkta kılavuz kateter koroner ostiuma derin oturmuş (wedged). Aortik Pa dalgasının diyastolik çöküşüne dikkat edin.',
      'Guide catheter is deeply engaged (wedged) in the coronary ostium. Notice the diastolic dip and loss of dicrotic notch on the Pa waveform.'
    ),
    hint: w(
      'Derin oturan kateter akımı kısıtlar ve Pa ortalamasını düşürerek FFR değerini yapay olarak yüksek (>0.80, yalancı negatif) gösterir. "Kateteri Geri Çek (Disengage)" butonuna basın.',
      'A wedged guide restricts inflow and lowers mean Pa, making FFR read falsely high (>0.80, false negative). Click "Disengage guide".'
    ),
    takeaway: w(
      'Ventrikülerize Pa: Kateter ostiumu tıkadığında Pa düşer ve FFR yalancı yüksek (false negative) çıkar. Ölçüm sırasında kılavuz kateter ostiumdan hafifçe geri çekilmelidir (disengage).',
      'Ventricularized Pa: Ostial wedging lowers mean Pa and causes a false-negative (artificially high) FFR. Disengage the guide catheter slightly while keeping the wire distal.'
    )
  },
  {
    id: 'artifact-damp',
    tag: 'A3',
    modalities: ['epicardial'],
    vessel: 'LAD',
    name: w('Artefakt · Sönümlenmiş Pa (Kateterde Kontrast / Hava)', 'Artifact · Damped Pa (Contrast / Air in Guide)'),
    cuff: [140, 78],
    heartRate: 68,
    lesions: [{ id: 'mid-lad-sig', posMm: 34, lengthMm: 7, stenosisPct: 70, ffrDrop: 0.19, label: w('Orta LAD Darlığı', 'Mid-LAD Stenosis') }],
    diffuseLoss: 0.03,
    micro: { qRestBase: 68, imr: 15, rmuRest: 1380, rmuHyp: 320 },
    artifact: 'damp',
    brief: w(
      'Tel ilerletilirken verilen visköz kontrast madde kılavuz kateter içinde kaldı. Pa dalgası yuvarlaklaştı ve dikrotik çentik kayboldu.',
      'Viscous contrast medium remained inside the guide catheter after wire positioning. The Pa waveform is rounded with no dicrotic notch.'
    ),
    hint: w(
      'Sönümlenmiş (damped) Pa ortalama basıncı düşük okuyarak FFR değerini yapay yükseltir. "Kateteri Yıka (Flush)" butonuna basın.',
      'Damped Pa underestimates true aortic pressure and pushes FFR artificially upward. Click "Flush guide" with saline.'
    ),
    takeaway: w(
      'Sönümlenmiş Pa (Damping): Kateter içindeki kontrast, kan pıhtısı veya hava kabarcığı yüksek frekanslı bileşenleri sönümler. Her ölçümden önce kateter salin ile yıkanmalı ve keskin dikrotik çentik doğrulanmalıdır.',
      'Damped Pa: Contrast, blood, or air bubbles in the guide damp the aortic waveform and falsely elevate FFR. Always flush the guide with saline and verify a crisp dicrotic notch before equalizing or recording.'
    )
  }
]);

export const ARTIFACT_CATALOG = Object.freeze([
  {
    id: 'drift',
    name: w('Sensör Sürüklenmesi (Signal Drift)', 'Sensor Signal Drift'),
    effectOnFfr: w('Yalancı düşük veya yüksek FFR (kayma yönüne göre)', 'Falsely low or high FFR (depends on drift direction)'),
    why: w('Piezoelektrik/optik basınç sensöründe sıcaklık veya nem kaynaklı sıfır noktası kayması.', 'Thermal or moisture-related zero-offset shift of the pressure sensor over time.'),
    recognize: w('Pa ve Pd dalga şekilleri ve dikrotik çentikler birebir korunur ancak Pd eğrisi paralel olarak yukarı/aşağı kaymıştır; kateter ucunda Pd/Pa ≠ 1.00 (0.98–1.02 dışı).', 'Pa and Pd waveform shapes and dicrotic notches remain identical, but Pd shifts in parallel; at the guide tip Pd/Pa is outside 0.98–1.02.'),
    fix: w('Sensörü kılavuz kateter ucuna çekin, hattı yıkayın, yeniden Equalize yapın ve ölçümü tekrarlayın.', 'Pull sensor back to the guide tip, flush the line, re-equalize, and repeat the measurement.')
  },
  {
    id: 'vent',
    name: w('Ventrikülerize Pa (Derin / Wedged Kateter)', 'Ventricularized Pa (Deep / Wedged Guide)'),
    effectOnFfr: w('Yalancı yüksek FFR (Yalancı Negatif · Ciddi darlığı maskeler)', 'Falsely high FFR (False Negative · Masks severe stenosis)'),
    why: w('Kılavuz kateterin sol ana koroner veya ostial darlığa derin oturarak koroner giriş akımını tıkaması.', 'Deep seating of the guide catheter into the ostium or an ostial plaque, obstructing coronary inflow.'),
    recognize: w('Pa dalgasında diyastolik çökme (ventrikül eğrisine benzeme), dikrotik çentik kaybı ve manşon basıncına göre düşük Pa.', 'Diastolic dip on the Pa tracing resembling a ventricular waveform, loss of dicrotic notch, and Pa lower than cuff pressure.'),
    fix: w('Teli distalde sabit tutarak kılavuz kateteri aortaya doğru 2–3 mm geri çekin (Disengage guide) ve tekrar ölçün.', 'Disengage the guide catheter 2–3 mm back into the aorta while holding the wire distal, then re-measure.')
  },
  {
    id: 'damp',
    name: w('Sönümlenmiş Pa (Kateterde Kontrast / Hava)', 'Damped Pa (Contrast / Air in Line)'),
    effectOnFfr: w('Yalancı yüksek FFR (Yalancı Negatif)', 'Falsely high FFR (False Negative)'),
    why: w('Kılavuz kateter lümeninde visköz kontrast madde, kan veya manifold hattında hava kabarcığı kalması.', 'Viscous contrast medium, blood in the guide lumen, or air bubbles in the manifold tubing.'),
    recognize: w('Pa dalgası düşük genlikli sinüzoidal/yuvarlak şekil alır, sistolik tepe düşer ve dikrotik çentik silinir.', 'Pa tracing becomes a rounded, low-amplitude sine wave with reduced systolic peak and absent dicrotic notch.'),
    fix: w('Kılavuz kateteri ve basınç hattını normal salin ile yıkayın (Flush guide), bağlantıları kontrol edin ve yeniden Equalize yapın.', 'Flush the guide catheter and pressure line with saline, check connections, and re-equalize.')
  },
  {
    id: 'whip',
    name: w('Tel Kamçılanması (Wire Whipping Artifact)', 'Wire Whipping Artifact'),
    effectOnFfr: w('Yapay sistolik dikenler nedeniyle hatalı Pd/Pa ve iFR', 'Erroneous Pd/Pa and iFR due to artificial systolic spikes'),
    why: w('Distal basınç sensörünün kıvrımlı bir segmentte veya yan dal ağzında her sistolde damar duvarına çarpması.', 'Distal pressure sensor striking the vessel wall or a branch carina during each systolic contraction.'),
    recognize: w('Yeşil/mavi Pd eğrisinde sistol başında dar ve keskin pozitif dikenler (spike) görülür.', 'Sharp, narrow high-frequency systolic spikes superimposed on the distal Pd waveform.'),
    fix: w('Basınç telini 2–3 mm ileri (+2 mm) veya geri (-2 mm) konumlandırarak sensörü duvar temasından kurtarın.', 'Reposition the pressure wire 2–3 mm forward (+2 mm) or backward (-2 mm) away from the vessel wall.')
  },
  {
    id: 'leak',
    name: w('Hemostatik Valf Kaçağı (Open Y-Connector Leak)', 'Hemostatic Valve Leak (Open Y-Connector)'),
    effectOnFfr: w('Equalize öncesi yalancı yüksek; açık valfle Equalize edilirse kapandıktan sonra yalancı düşük', 'Falsely high before equalization; falsely low if equalized while leaking and then closed'),
    why: w('Y-konnektör (Tuohy-Borst) valfinin veya manifold musluğunun tam kapatılmaması nedeniyle aortik basınç kaybı.', 'Incomplete sealing of the Y-connector hemostatic valve or manifold stopcock causing aortic pressure loss.'),
    recognize: w('Dalga formu şekli nispeten korunurken konsol Pa değeri manşon kan basıncından 10–15 mmHg düşük okunur.', 'Console Pa reads 10–15 mmHg lower than non-invasive cuff pressure despite preserved waveform contour.'),
    fix: w('Tel introdüserini çıkarın, hemostatik valfi kapatın (Check connections) ve ostiumda yeniden Equalize yapın.', 'Remove the wire introducer needle, tighten the hemostatic valve, and re-equalize at the ostium.')
  }
]);

export const CALCULATOR_CARDS = Object.freeze([
  {
    id: 'ffr-nhpr',
    category: w('Epikardiyal Basınç Oranları', 'Epicardial Pressure Ratios'),
    title: w('FFR & İstirahat Pd/Pa (NHPR)', 'FFR & Resting Pd/Pa (NHPR)'),
    formulaText: 'FFR = Pd,hyp / Pa,hyp   ·   FFR_full = (Pd,hyp - Pv) / (Pa,hyp - Pv)',
    thresholds: w('FFR ≤0.80 iskemi (0.75–0.80 gri zon) · iFR/dNHPR ≤0.89 anlamlı · Post-PCI FFR ≥0.90 optimal', 'FFR ≤0.80 ischemic (0.75–0.80 gray zone) · iFR/dNHPR ≤0.89 significant · Post-PCI FFR ≥0.90 optimal'),
    inputs: [
      { key: 'paRest', label: w('Pa istirahat (mmHg)', 'Pa rest (mmHg)'), defaultVal: 96, min: 40, max: 200, step: 1 },
      { key: 'pdRest', label: w('Pd istirahat (mmHg)', 'Pd rest (mmHg)'), defaultVal: 86, min: 20, max: 200, step: 1 },
      { key: 'paHyp', label: w('Pa hiperemi (mmHg)', 'Pa hyperemia (mmHg)'), defaultVal: 90, min: 40, max: 200, step: 1 },
      { key: 'pdHyp', label: w('Pd hiperemi (mmHg)', 'Pd hyperemia (mmHg)'), defaultVal: 66, min: 15, max: 200, step: 1 },
      { key: 'pv', label: w('Pv / Sağ Atriyum (mmHg)', 'Pv / Right Atrium (mmHg)'), defaultVal: 5, min: 0, max: 30, step: 1 }
    ]
  },
  {
    id: 'ppg-collet',
    category: w('Geri Çekme (Pullback) Paterni', 'Pullback Pattern Analysis'),
    title: w('PPG (Pullback Pressure Gradient · Collet 2019)', 'PPG (Pullback Pressure Gradient · Collet 2019)'),
    formulaText: 'PPG = [ (Max ΔFFR_20mm / ΔFFR_vessel) + (1 - L_functional / L_total) ] / 2',
    thresholds: w('PPG ≥0.62 Fokal ağırlıklı hastalık (PCI’dan yüksek fayda) · PPG <0.62 Diffüz ağırlıklı hastalık', 'PPG ≥0.62 Predominantly focal disease (high PCI benefit) · PPG <0.62 Predominantly diffuse disease'),
    inputs: [
      { key: 'maxDelta20', label: w('20 mm’de Maks ΔFFR', 'Max ΔFFR in 20 mm'), defaultVal: 0.28, min: 0.01, max: 0.70, step: 0.01 },
      { key: 'totalDelta', label: w('Toplam ΔFFR (1 - FFR)', 'Total ΔFFR (1 - FFR)'), defaultVal: 0.34, min: 0.05, max: 0.80, step: 0.01 },
      { key: 'funcLenMm', label: w('Fonksiyonel hastalık uzunluğu (mm)', 'Functional disease length (mm)'), defaultVal: 18, min: 2, max: 100, step: 1 },
      { key: 'totalLenMm', label: w('Toplam damar uzunluğu (mm)', 'Total vessel length (mm)'), defaultVal: 80, min: 30, max: 120, step: 1 }
    ]
  },
  {
    id: 'bolus-thermo',
    category: w('Bolus Termodilüsyon', 'Bolus Thermodilution'),
    title: w('Bolus CFR · IMR · Yong Düzeltilmiş IMR · RRR', 'Bolus CFR · IMR · Yong Corrected IMR · RRR'),
    formulaText: 'CFR = Tmn,rest / Tmn,hyp · IMR = Pd,hyp × Tmn,hyp · IMR_corr = Pa,hyp × Tmn,hyp × (1.35 × FFR - 0.32)',
    thresholds: w('CFR_bolus <2.5 anormal (2.0–2.4 gri zon) · IMR ≥25 anormal (CMD)', 'CFR_bolus <2.5 abnormal (2.0–2.4 gray zone) · IMR ≥25 abnormal (CMD)'),
    inputs: [
      { key: 'tmnRest', label: w('Tmn istirahat (s)', 'Tmn rest (s)'), defaultVal: 0.84, min: 0.10, max: 3.00, step: 0.02 },
      { key: 'tmnHyp', label: w('Tmn hiperemi (s)', 'Tmn hyperemia (s)'), defaultVal: 0.28, min: 0.08, max: 2.50, step: 0.02 },
      { key: 'paHyp', label: w('Pa hiperemi (mmHg)', 'Pa hyperemia (mmHg)'), defaultVal: 90, min: 40, max: 180, step: 1 },
      { key: 'pdHyp', label: w('Pd hiperemi (mmHg)', 'Pd hyperemia (mmHg)'), defaultVal: 82, min: 20, max: 180, step: 1 },
      { key: 'pdRest', label: w('Pd istirahat (mmHg)', 'Pd rest (mmHg)'), defaultVal: 92, min: 30, max: 190, step: 1 }
    ]
  },
  {
    id: 'cont-thermo',
    category: w('Sürekli Termodilüsyon & MRR', 'Continuous Thermodilution & MRR'),
    title: w('Mutlak Akım (Q) · Mikrovasküler Direnç (Rμ) · MRR', 'Absolute Flow (Q) · Microvascular Resistance (Rμ) · MRR'),
    formulaText: 'Q = 1.08 × (Ti / T) × Qi   ·   Rμ = Pd / Q (WU)   ·   MRR = (CFR / FFR) × (Pa,rest / Pa,hyp)',
    thresholds: w('LAD Q_hyp 175–350 mL/dk · Rμ,hyp 200–470 WU · CFR_cont <2.0 anormal · MRR <2.3 CMD olası (≥3.0 normal)', 'LAD Q_hyp 175–350 mL/min · Rμ,hyp 200–470 WU · CFR_cont <2.0 abnormal · MRR <2.3 CMD likely (≥3.0 normal)'),
    inputs: [
      { key: 'qiRest', label: w('Qi istirahat (mL/dk)', 'Qi rest (mL/min)'), defaultVal: 10, min: 6, max: 15, step: 1 },
      { key: 'tiRest', label: w('Ti istirahat (°C)', 'Ti rest (°C)'), defaultVal: -3.10, min: -8.0, max: -0.5, step: 0.05 },
      { key: 'tRest', label: w('T distal istirahat (°C)', 'T distal rest (°C)'), defaultVal: -0.48, min: -3.0, max: -0.05, step: 0.02 },
      { key: 'qiHyp', label: w('Qi hiperemi (mL/dk)', 'Qi hyperemia (mL/min)'), defaultVal: 20, min: 10, max: 30, step: 1 },
      { key: 'tiHyp', label: w('Ti hiperemi (°C)', 'Ti hyperemia (°C)'), defaultVal: -3.35, min: -8.0, max: -0.5, step: 0.05 },
      { key: 'tHyp', label: w('T distal hiperemi (°C)', 'T distal hyperemia (°C)'), defaultVal: -0.35, min: -3.0, max: -0.05, step: 0.02 },
      { key: 'paRest', label: w('Pa istirahat (mmHg)', 'Pa rest (mmHg)'), defaultVal: 96, min: 40, max: 190, step: 1 },
      { key: 'paHyp', label: w('Pa hiperemi (mmHg)', 'Pa hyperemia (mmHg)'), defaultVal: 88, min: 40, max: 190, step: 1 },
      { key: 'pdHyp', label: w('Pd hiperemi (mmHg)', 'Pd hyperemia (mmHg)'), defaultVal: 78, min: 20, max: 190, step: 1 }
    ]
  },
  {
    id: 'doppler-ach',
    category: w('Doppler & Endotel Fonksiyonu', 'Doppler & Endothelial Function'),
    title: w('Doppler CFR · HMR · HSR · ACh Akım Yanıtı (CBF)', 'Doppler CFR · HMR · HSR · ACh Flow Response (CBF)'),
    formulaText: 'CFR_dop = APV_hyp / APV_rest · HMR = Pd,hyp / APV_hyp · CBF = 0.5 × APV × π × (D/2)²',
    thresholds: w('CFR_dop ≥2.5 normal · HMR ≥2.5 mmHg·s/cm anormal · HSR >0.80 iskemi · ACh ΔCBF ≥+%50 normal', 'CFR_dop ≥2.5 normal · HMR ≥2.5 mmHg·s/cm abnormal · HSR >0.80 ischemic · ACh ΔCBF ≥+50% normal'),
    inputs: [
      { key: 'apvRest', label: w('APV istirahat (cm/s)', 'APV rest (cm/s)'), defaultVal: 22, min: 5, max: 80, step: 1 },
      { key: 'apvHyp', label: w('APV hiperemi (cm/s)', 'APV hyperemia (cm/s)'), defaultVal: 78, min: 10, max: 180, step: 1 },
      { key: 'paHyp', label: w('Pa hiperemi (mmHg)', 'Pa hyperemia (mmHg)'), defaultVal: 92, min: 40, max: 190, step: 1 },
      { key: 'pdHyp', label: w('Pd hiperemi (mmHg)', 'Pd hyperemia (mmHg)'), defaultVal: 84, min: 20, max: 190, step: 1 },
      { key: 'diamRest', label: w('Bazal damar çapı D (mm)', 'Baseline diameter D (mm)'), defaultVal: 2.8, min: 1.2, max: 5.0, step: 0.1 },
      { key: 'apvAch', label: w('APV ACh zirve (cm/s)', 'APV peak ACh (cm/s)'), defaultVal: 38, min: 4, max: 140, step: 1 },
      { key: 'diamAch', label: w('ACh damar çapı D_ACh (mm)', 'ACh diameter D_ACh (mm)'), defaultVal: 2.9, min: 0.3, max: 5.0, step: 0.1 }
    ]
  }
]);

export const REFERENCES = Object.freeze([
  'Pijls NHJ, de Bruyne B, Peels K, et al. Measurement of fractional flow reserve to assess the functional severity of coronary-artery stenoses. N Engl J Med. 1996;334(26):1703–1708.',
  'Tonino PAL, De Bruyne B, Pijls NHJ, et al. Fractional flow reserve versus angiography for guiding percutaneous coronary intervention (FAME). N Engl J Med. 2009;360(3):213–224.',
  'De Bruyne B, Pijls NHJ, Kalesan B, et al. Fractional flow reserve-guided PCI versus medical therapy in stable coronary disease (FAME 2). N Engl J Med. 2012;367(11):991–1001.',
  'Götberg M, Christiansen EH, Gudmundsdottir IJ, et al. Instantaneous wave-free ratio versus fractional flow reserve to guide PCI (iFR-SWEDEHEART). N Engl J Med. 2017;376(19):1813–1823.',
  'Davies JE, Sen S, Dehbi HM, et al. Use of the instantaneous wave-free ratio or fractional flow reserve in PCI (DEFINE-FLAIR). N Engl J Med. 2017;376(19):1824–1834.',
  'Collet C, Sonck J, Vandeloo B, et al. Measurement of hyperemic pullback pressure gradients to characterize patterns of coronary atherosclerosis. J Am Coll Cardiol. 2019;74(14):1772–1784.',
  'Collet C, Munhoz D, Mizukami T, et al. Influence of pathophysiological patterns of coronary artery disease on immediate percutaneous coronary intervention outcomes (PPG Global). Circulation. 2024;150(8):586–597.',
  'Fearon WF, Balsam LB, Farouque HM, et al. Novel index for invasively assessing the coronary microcirculation (IMR). Circulation. 2003;107(25):3129–3132.',
  'De Bruyne B, Pijls NHJ, Gallinoro E, et al. Microvascular resistance reserve for assessment of coronary microvascular function (MRR). J Am Coll Cardiol. 2021;78(15):1541–1549.',
  'Belmonte M, Gallinoro E, Pijls NHJ, et al. Measuring absolute coronary flow and microvascular resistance by thermodilution. J Am Coll Cardiol. 2024;83(6):699–709.',
  'Ford TJ, Stanley B, Good R, et al. Stratified medical therapy using invasive coronary function testing in angina: the CorMicA trial. J Am Coll Cardiol. 2018;72(23):2841–2855.',
  'Kunadian V, Chieffo A, Camici PG, et al. An EAPCI expert consensus document on ischaemia with non-obstructive coronary arteries (INOCA). Eur Heart J. 2020;41(37):3504–3520.'
]);

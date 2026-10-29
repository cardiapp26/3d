// Severe valve disease teaching data, Doppler envelope model and quantification math.
// Pure module: no DOM access, safe to import from node.

/** Reference RR interval (ms) at 72 bpm; timing fractions are defined at this rate. */
export const REF_RR_MS = 60000 / 72;

const R = {
  accaha: 'Otto CM, et al. 2020 ACC/AHA Guideline for the Management of Patients With Valvular Heart Disease. Circulation. 2021;143:e72–e227.',
  esc25: 'Praz F, et al. 2025 ESC/EACTS Guidelines for the management of valvular heart disease. Eur Heart J. 2025;46:4635–4736. doi:10.1093/eurheartj/ehaf194',
  esc21: 'Vahanian A, et al. 2021 ESC/EACTS Guidelines for the management of valvular heart disease. Eur Heart J. 2022;43:561–632.',
  as17: 'Baumgartner H, et al. Recommendations on the echocardiographic assessment of aortic valve stenosis: a focused update from the EACVI and the ASE. J Am Soc Echocardiogr. 2017;30:372–392.',
  sten09: 'Baumgartner H, et al. Echocardiographic assessment of valve stenosis: EAE/ASE recommendations for clinical practice. J Am Soc Echocardiogr. 2009;22:1–23.',
  reg17: 'Zoghbi WA, et al. Recommendations for noninvasive evaluation of native valvular regurgitation. J Am Soc Echocardiogr. 2017;30:303–371.',
  hatle: 'Hatle L, Angelsen B, Tromsdal A. Noninvasive assessment of atrioventricular pressure half-time by Doppler ultrasound. Circulation. 1979;60:1096–1104.',
  dd16: 'Nagueh SF, et al. Recommendations for the evaluation of left ventricular diastolic function by echocardiography: an update from the ASE and EACVI. J Am Soc Echocardiogr. 2016;29:277–314.',
  coapt: 'Stone GW, et al. Transcatheter mitral-valve repair in patients with heart failure. N Engl J Med. 2018;379:2307–2318.',
};

const MORPH0 = { thickening: 0, calcification: 0, opening: 1, doming: false, flail: false, prolapse: false, coaptationGapMm: 0, tethering: false, commissuralFusion: false };
const morph = (o) => ({ ...MORPH0, ...o });
const W_A5C = { tr: 'Apikal 5 boşluk', en: 'Apical 5-chamber' };
const W_A4C = { tr: 'Apikal 4 boşluk', en: 'Apical 4-chamber' };

/** Default PW channels (normal physiology); lesions override per channel id. */
const DEFAULT_CHANNELS = {
  'pw-lvot': [{ k: 'eject', role: 'lvot', v: -1.0, peak: 0.33, p: 1.0, i: 1, click: true }],
  'pw-mitral': [{ k: 'inflow', role: 'inflow', E: 0.8, A: 0.5, dt: 190, i: 1, click: true }],
  'pw-pulm-vein': [{ k: 'pv', role: 'pv', S: 0.55, D: 0.45, Ar: -0.25, i: 1 }],
  'pw-desc-aorta': [
    { k: 'eject', role: 'ao-fwd', v: -1.0, peak: 0.28, p: 1.2, i: 1 },
    { k: 'aoRev', role: 'ao-rev', v0: 0.16, holo: false, i: 0.8 },
  ],
};
const DEFAULT_TIMING = { ejStart: 0.08, ejEnd: 0.42, mrStart: 0.035, ivrtMs: 75 };

const LESION_DATA = [
  {
    id: 'normal', valve: null, kind: null,
    label: { tr: 'Normal kapaklar', en: 'Normal valves' }, short: { tr: 'Normal', en: 'Normal' },
    jet: null, morphology: morph({}),
    remodeling: { laIndexMlM2: 28, lvEdDiamMm: 48, lvEsDiamMm: 30, lvWallMm: 9, efPct: 62, sPapMmHg: 25 },
    doppler: {
      mode: 'CW', window: W_A5C, vmaxMs: 1.2, mainRole: 'av', timing: {}, pw: ['pw-mitral', 'pw-lvot', 'pw-pulm-vein'],
      channels: { cw: [
        { k: 'eject', role: 'av', v: -1.2, peak: 0.33, p: 1.0, i: 0.9, click: true },
        { k: 'inflow', role: 'inflow', E: 0.8, A: 0.5, dt: 190, i: 0.6, click: true },
      ] },
    },
    inputs: { lvotDiamCm: 2.1, bsaM2: 1.8 },
    teaching: {
      tr: 'Normal değerler: mitral E ~0,8 m/s, A ~0,5 m/s (E/A 0,8–2), LVOT tepe hızı ~1,0 m/s, aort kapağı ~1,2 m/s. Spektral Doppler hızı ses ışınının akıma paralel hizalanmasına bağlıdır; açı 20° üzerine çıkarsa hız ve gradyan küçük ölçülür.',
      en: 'Normal values: mitral E ~0.8 m/s, A ~0.5 m/s (E/A 0.8–2), LVOT peak velocity ~1.0 m/s, aortic valve ~1.2 m/s. Spectral Doppler velocity depends on aligning the beam parallel to flow; above 20° of misalignment velocity and gradient are underestimated.',
    },
    references: [R.dd16, R.as17],
  },
  {
    id: 'as-severe', valve: 'aortic-valve', kind: 'stenosis',
    label: { tr: 'Ciddi aort darlığı', en: 'Severe aortic stenosis' }, short: { tr: 'Ciddi AD', en: 'Severe AS' },
    jet: { phase: 'systole', direction: 'antegrade', from: 'lv', to: 'aorta', eccentric: 0, widthFrac: 0.3, lengthFrac: 0.6 },
    morphology: morph({ thickening: 0.8, calcification: 0.9, opening: 0.25 }),
    remodeling: { laIndexMlM2: 40, lvEdDiamMm: 46, lvEsDiamMm: 29, lvWallMm: 14, efPct: 60, sPapMmHg: 35 },
    doppler: {
      mode: 'CW', window: W_A5C, vmaxMs: 4.6, mainRole: 'av', timing: { ejEnd: 0.45 }, pw: ['pw-lvot'],
      channels: {
        cw: [
          { k: 'eject', role: 'av', v: -4.6, peak: 0.5, p: 0.65, i: 1, click: true },
          { k: 'eject', role: 'lvot', v: -1.0, peak: 0.35, p: 1.0, i: 0.55 },
          { k: 'inflow', role: 'inflow', E: 0.6, A: 0.85, dt: 260, i: 0.45 },
        ],
        'pw-lvot': [{ k: 'eject', role: 'lvot', v: -1.0, peak: 0.35, p: 1.0, i: 1, click: true }],
        'pw-mitral': [{ k: 'inflow', role: 'inflow', E: 0.6, A: 0.85, dt: 260, i: 1, click: true }],
      },
    },
    inputs: { lvotDiamCm: 2.1, bsaM2: 1.8 },
    teaching: {
      tr: 'Yaşlıda en sık neden kalsifik dejeneratif üç yaprakçıklı kapak, gençte biküspit kapaktır. Ciddi AD\'de CW zarfı yuvarlak ve geç tepelidir; Vmax\'ı kaçırmamak için apikal, sağ parasternal ve suprasternal pencerelerin hepsi denenmelidir. Tuzaklar: LVOT çapındaki hata AVA\'ya karesiyle yansır; EF <%50 olan düşük akım-düşük gradyanlı AD\'de dobutamin stres eko, korunmuş EF\'li paradoksal düşük akımda (SVi <35 mL/m²) BT kalsiyum skoru gerekir. Girişim: semptomatik ciddi AD veya EF <%50 ise kapak replasmanı (SAVR ya da TAVI).',
      en: 'Calcific degeneration of a trileaflet valve is the usual cause in the elderly, a bicuspid valve in younger adults. In severe AS the CW envelope is rounded and late-peaking; interrogate apical, right parasternal and suprasternal windows so Vmax is not missed. Pitfalls: an LVOT diameter error is squared in the AVA; low-flow low-gradient AS with EF <50% needs dobutamine stress echo, and paradoxical low flow with preserved EF (SVi <35 mL/m²) needs a CT calcium score. Intervention: symptomatic severe AS or EF <50% warrants valve replacement (SAVR or TAVI).',
    },
    references: [R.as17, R.accaha, R.esc25],
  },
  {
    id: 'ar-severe', valve: 'aortic-valve', kind: 'regurgitation',
    label: { tr: 'Ciddi aort yetersizliği', en: 'Severe aortic regurgitation' }, short: { tr: 'Ciddi AY', en: 'Severe AR' },
    jet: { phase: 'diastole', direction: 'regurgitant', from: 'aorta', to: 'lv', eccentric: 0, widthFrac: 0.7, lengthFrac: 0.85 },
    morphology: morph({ thickening: 0.3, calcification: 0.2, coaptationGapMm: 4 }),
    remodeling: { laIndexMlM2: 40, lvEdDiamMm: 70, lvEsDiamMm: 52, lvWallMm: 10, efPct: 52, sPapMmHg: 35 },
    doppler: {
      mode: 'CW', window: W_A5C, vmaxMs: 4.5, phtMs: 180, mainRole: 'ar', timing: { ejEnd: 0.43 }, pw: ['pw-desc-aorta', 'pw-lvot'],
      channels: {
        cw: [
          { k: 'ar', role: 'ar', v0: 4.5, pht: 180, i: 0.95 },
          { k: 'eject', role: 'lvot', v: -1.9, peak: 0.3, p: 0.9, i: 0.85, click: true },
          { k: 'inflow', role: 'inflow', E: 0.9, A: 0.4, dt: 160, i: 0.4 },
        ],
        'pw-lvot': [{ k: 'eject', role: 'lvot', v: -1.5, peak: 0.3, p: 0.9, i: 1, click: true }],
        'pw-desc-aorta': [
          { k: 'eject', role: 'ao-fwd', v: -1.4, peak: 0.26, p: 1.1, i: 1 },
          { k: 'aoRev', role: 'ao-rev', v0: 0.65, end: 0.28, holo: true, i: 0.9 },
        ],
      },
    },
    inputs: { lvotDiamCm: 2.3, vcMm: 7, jetWidthPct: 70, pisaRadiusCm: 0.9, aliasingCms: 40 },
    teaching: {
      tr: 'Nedenler: biküspit kapak, aort kökü genişlemesi (anüloaortik ektazi), endokardit ve romatizmal hastalık. Ciddi AY\'de vena kontrakta >6 mm, jet genişliği/LVOT ≥%65, basınç yarı zamanı <200 ms ve inen aortada holodiyastolik ters akım (diyastol sonu hız >20 cm/s) görülür; LV eksantrik hipertrofiyle genişler. Tuzak: PHT LV diyastolik basıncına da bağlıdır; akut AY\'de çok kısa, kronik kompanse AY\'de ya da vazodilatör tedavide uzun ölçülebilir. Girişim: semptom, EF ≤%55 veya LVESD >50 mm (LVESDi >25 mm/m²).',
      en: 'Causes: bicuspid valve, aortic root dilatation (annuloaortic ectasia), endocarditis and rheumatic disease. Severe AR shows a vena contracta >6 mm, jet width/LVOT ≥65%, pressure half-time <200 ms and holodiastolic flow reversal in the descending aorta (end-diastolic velocity >20 cm/s); the LV dilates with eccentric hypertrophy. Pitfall: PHT also depends on LV diastolic pressure; it is very short in acute AR and may lengthen in chronic compensated AR or on vasodilators. Intervention: symptoms, EF ≤55% or LVESD >50 mm (LVESDi >25 mm/m²).',
    },
    references: [R.reg17, R.accaha, R.esc25],
  },
  {
    id: 'ms-severe', valve: 'mitral', kind: 'stenosis',
    label: { tr: 'Ciddi mitral darlığı (romatizmal)', en: 'Severe mitral stenosis (rheumatic)' }, short: { tr: 'Ciddi MD', en: 'Severe MS' },
    jet: { phase: 'diastole', direction: 'antegrade', from: 'la', to: 'lv', eccentric: 0, widthFrac: 0.35, lengthFrac: 0.7 },
    morphology: morph({ thickening: 0.8, calcification: 0.4, opening: 0.3, doming: true, commissuralFusion: true }),
    remodeling: { laIndexMlM2: 70, lvEdDiamMm: 44, lvEsDiamMm: 28, lvWallMm: 9, efPct: 60, sPapMmHg: 54 },
    doppler: {
      mode: 'CW', window: W_A4C, vmaxMs: 2.4, phtMs: 200, mainRole: 'inflow', timing: { ivrtMs: 55 }, pw: [],
      channels: {
        cw: [
          { k: 'inflow', role: 'inflow', E: 2.4, A: 0.55, pht: 200, rise: 60, i: 1, click: true },
          { k: 'eject', role: 'lvot', v: -0.9, peak: 0.33, p: 1.0, i: 0.45 },
        ],
        'pw-mitral': [{ k: 'inflow', role: 'inflow', E: 2.4, A: 0.55, pht: 200, rise: 60, i: 1, click: true }],
        'pw-lvot': [{ k: 'eject', role: 'lvot', v: -0.9, peak: 0.33, p: 1.0, i: 1, click: true }],
        'pw-pulm-vein': [{ k: 'pv', role: 'pv', S: 0.4, D: 0.4, Ar: -0.3, i: 1 }],
      },
    },
    inputs: { trVmaxMs: 3.4, rapMmHg: 8 },
    teaching: {
      tr: 'Erişkinde neredeyse her zaman romatizmaldir: komissüral füzyon, ön yaprakçıkta diyastolik kubbeleşme (hokey sopası görünümü) ve kısıtlı arka yaprakçık tipiktir. MVA = 220/PHT; ortalama gradyan kalp hızına ve akıma bağlıdır, AF\'de en az 5 vurunun ortalaması alınır. Tuzak: PHT balon valvotomiden hemen sonra, eşlik eden belirgin AY\'de ve LV kompliyansı bozuksa (LVH, ileri yaş) güvenilmez; o zaman planimetri (2D/3D) referanstır. Girişim: MVA ≤1,5 cm² olan semptomatik hastada uygun anatomide perkütan mitral komissürotomi.',
      en: 'In adults it is almost always rheumatic: commissural fusion, diastolic doming of the anterior leaflet ("hockey stick") and a restricted posterior leaflet are typical. MVA = 220/PHT; the mean gradient depends on heart rate and flow, so average at least 5 beats in AF. Pitfall: PHT is unreliable immediately after balloon valvotomy, with significant AR and with abnormal LV compliance (LVH, old age); planimetry (2D/3D) is then the reference. Intervention: symptomatic patient with MVA ≤1.5 cm² and favourable anatomy, percutaneous mitral commissurotomy.',
    },
    references: [R.sten09, R.hatle, R.accaha, R.esc25],
  },
  {
    id: 'mr-severe-primary', valve: 'mitral', kind: 'regurgitation',
    label: { tr: 'Ciddi primer mitral yetersizliği (P2 flail)', en: 'Severe primary mitral regurgitation (flail P2)' },
    short: { tr: 'Ciddi primer MY', en: 'Severe primary MR' },
    jet: { phase: 'systole', direction: 'regurgitant', from: 'lv', to: 'la', eccentric: 0.6, widthFrac: 0.6, lengthFrac: 0.95 },
    morphology: morph({ thickening: 0.3, calcification: 0.1, flail: true, prolapse: true, coaptationGapMm: 5 }),
    remodeling: { laIndexMlM2: 65, lvEdDiamMm: 62, lvEsDiamMm: 41, lvWallMm: 9, efPct: 62, sPapMmHg: 45 },
    doppler: {
      mode: 'CW', window: W_A4C, vmaxMs: 5.5, mainRole: 'mr', timing: { ivrtMs: 45 }, pw: ['pw-pulm-vein', 'pw-mitral'],
      channels: {
        cw: [
          { k: 'mr', role: 'mr', v: -5.5, p: 0.45, i: 1 },
          { k: 'inflow', role: 'inflow', E: 1.5, A: 0.6, dt: 150, i: 0.8, click: true },
        ],
        'pw-mitral': [{ k: 'inflow', role: 'inflow', E: 1.5, A: 0.6, dt: 150, i: 1, click: true }],
        'pw-lvot': [{ k: 'eject', role: 'lvot', v: -0.95, peak: 0.33, p: 1.0, i: 1, click: true }],
        'pw-pulm-vein': [{ k: 'pv', role: 'pv', S: -0.45, D: 0.85, Ar: -0.3, i: 1 }],
      },
    },
    inputs: { lvotDiamCm: 2.1, vcMm: 8, pisaRadiusCm: 1.0, aliasingCms: 40 },
    teaching: {
      tr: 'Dejeneratif (miksomatöz) hastalıkta en sık lezyon P2 flail\'dir; flail arka yaprakçık jeti öne, septuma ve aort köküne doğru yönelir. Ciddi primer MY: vena kontrakta ≥7 mm, EROA ≥0,40 cm², regürjitan volüm ≥60 mL, RF ≥%50, pulmoner vende sistolik ters akım ve yoğun CW zarfı (büyük v dalgasında erken tepeli, üçgen). Tuzak: duvara yapışan eksantrik (Coanda) jetin renkli alanı şiddeti küçük gösterir; geç sistolik prolapsusta tek karelik PISA EROA\'yı abartır. Girişim: semptom, EF ≤%60 veya LVESD ≥40 mm; yeni AF ya da sPAB >50 mmHg kararı destekler, onarım tercih edilir.',
      en: 'In degenerative (myxomatous) disease a flail P2 is the commonest lesion; a flail posterior leaflet directs the jet anteriorly, towards the septum and aortic root. Severe primary MR: vena contracta ≥7 mm, EROA ≥0.40 cm², regurgitant volume ≥60 mL, RF ≥50%, systolic pulmonary vein flow reversal and a dense CW envelope (early-peaking, triangular with a large v wave). Pitfall: a wall-hugging (Coanda) eccentric jet looks small on colour area; single-frame PISA overestimates EROA in late-systolic prolapse. Intervention: symptoms, EF ≤60% or LVESD ≥40 mm; new AF or sPAP >50 mmHg support surgery, repair preferred.',
    },
    references: [R.reg17, R.accaha, R.esc25],
  },
  {
    id: 'mr-severe-secondary', valve: 'mitral', kind: 'regurgitation',
    label: { tr: 'Ciddi sekonder (ventriküler) mitral yetersizliği', en: 'Severe secondary (ventricular) mitral regurgitation' },
    short: { tr: 'Ciddi sekonder MY', en: 'Severe secondary MR' },
    jet: { phase: 'systole', direction: 'regurgitant', from: 'lv', to: 'la', eccentric: 0, widthFrac: 0.55, lengthFrac: 0.8 },
    morphology: morph({ thickening: 0.1, opening: 0.8, tethering: true, coaptationGapMm: 2 }),
    remodeling: { laIndexMlM2: 55, lvEdDiamMm: 66, lvEsDiamMm: 56, lvWallMm: 8, efPct: 30, sPapMmHg: 50 },
    doppler: {
      mode: 'CW', window: W_A4C, vmaxMs: 4.3, mainRole: 'mr', timing: { ivrtMs: 40 }, pw: ['pw-pulm-vein', 'pw-mitral'],
      channels: {
        cw: [
          { k: 'mr', role: 'mr', v: -4.3, p: 0.35, i: 0.95 },
          { k: 'inflow', role: 'inflow', E: 1.1, A: 0.35, dt: 120, i: 0.7, click: true },
        ],
        'pw-mitral': [{ k: 'inflow', role: 'inflow', E: 1.1, A: 0.35, dt: 120, i: 1, click: true }],
        'pw-lvot': [{ k: 'eject', role: 'lvot', v: -0.65, peak: 0.3, p: 1.0, i: 1, click: true }],
        'pw-pulm-vein': [{ k: 'pv', role: 'pv', S: 0.22, D: 0.7, Ar: -0.3, i: 1 }],
      },
    },
    inputs: { lvotDiamCm: 2.0, vcMm: 7, pisaRadiusCm: 0.8, aliasingCms: 40, trVmaxMs: 3.3, rapMmHg: 8 },
    teaching: {
      tr: 'İskemik veya dilate kardiyomiyopatide LV yeniden şekillenmesi papiller kasları dışa çekerek yapısal olarak normal yaprakçıkları gerer (tethering); jet çoğunlukla santraldir. Orifis hilal (eliptik) biçimli olduğundan PISA EROA\'yı küçük ölçer; ESC kılavuzları bu durumda EROA ≥0,30 cm² ve düşük akımda RVol ≥45 mL\'yi ciddi kabul ederken 2020 ACC/AHA ≥0,40 cm² / ≥60 mL kullanır. Şiddet yüke bağlıdır; değerlendirme optimal kılavuz tedavisi (gerekirse CRT) sonrası yapılmalıdır. Girişim: tedaviye rağmen semptomatik ciddi sekonder MY\'de uygun hastada TEER (COAPT ölçütleri) ya da KABG ile eşzamanlı cerrahi.',
      en: 'In ischaemic or dilated cardiomyopathy LV remodelling displaces the papillary muscles and tethers structurally normal leaflets; the jet is usually central. The orifice is crescentic (elliptical), so PISA underestimates EROA; ESC guidelines accept EROA ≥0.30 cm² and, with low flow, RVol ≥45 mL as severe, while the 2020 ACC/AHA guideline uses ≥0.40 cm² / ≥60 mL. Severity is load dependent; grade it after optimised guideline-directed therapy (and CRT if indicated). Intervention: persistent symptomatic severe secondary MR despite therapy, TEER in selected patients (COAPT criteria) or surgery combined with CABG.',
    },
    references: [R.reg17, R.esc25, R.esc21, R.accaha, R.coapt],
  },
];

const BY_ID = new Map(LESION_DATA.map((l) => [l.id, l]));

/** @param {string} id @returns {object} raw lesion data (falls back to normal). */
export function getLesion(id) {
  return BY_ID.get(id) || BY_ID.get('normal');
}

// ---------- Math ----------

const round = (v, d = 0) => { const f = 10 ** d; return Math.round(v * f) / f; };

/** Simplified Bernoulli: peak pressure gradient (mmHg) = 4 v². @param {number} vMs velocity m/s */
export function bernoulliGradient(vMs) {
  return round(4 * vMs * vMs, 1);
}

/**
 * Mean gradient from envelope samples (m/s) during flow: mean of 4v², not 4 * mean(v)².
 * @param {number[]} samples equally spaced velocities over the ejection/filling period
 */
export function meanGradientFromEnvelope(samples) {
  if (!samples || !samples.length) return 0;
  const sum = samples.reduce((acc, v) => acc + 4 * v * v, 0);
  return round(sum / samples.length, 1);
}

/**
 * Continuity equation AVA.
 * @param {{lvotDiamCm:number, lvotVtiCm:number, avVtiCm:number}} p
 * @returns {{lvotAreaCm2:number, avaCm2:number}}
 */
export function aorticValveAreaContinuity({ lvotDiamCm, lvotVtiCm, avVtiCm }) {
  const area = Math.PI * (lvotDiamCm / 2) ** 2;
  return { lvotAreaCm2: round(area, 2), avaCm2: round((area * lvotVtiCm) / avVtiCm, 2) };
}

/** Dimensionless index (velocity ratio) LVOT VTI / AV VTI. @param {{lvotVti:number, avVti:number}} p */
export function dimensionlessIndex({ lvotVti, avVti }) {
  return round(lvotVti / avVti, 2);
}

/** Hatle formula: MVA (cm²) = 220 / PHT (ms). */
export function mitralAreaPht(phtMs) {
  return round(220 / phtMs, 2);
}

/**
 * PISA: EROA = 2π r² Va / Vpeak, RVol = EROA × VTI.
 * @param {{radiusCm:number, aliasingCms:number, peakVelCms:number, vtiCm:number}} p
 * @returns {{eroaCm2:number, rvolMl:number}}
 */
export function pisa({ radiusCm, aliasingCms, peakVelCms, vtiCm }) {
  const eroa = (2 * Math.PI * radiusCm * radiusCm * aliasingCms) / peakVelCms;
  return { eroaCm2: round(eroa, 2), rvolMl: round(eroa * vtiCm, 0) };
}

/** Regurgitant fraction (%) = RVol / total stroke volume × 100. */
export function regurgitantFraction(rvol, totalStrokeVol) {
  return round((100 * rvol) / totalStrokeVol, 0);
}

/**
 * PHT from a linear deceleration: PHT = (1 - 1/√2) × Vpeak / slope (≈ 0.29 × DT).
 * @param {{peakVelMs:number, decelSlopeMs2:number}} p slope in m/s²
 * @returns {{phtMs:number, decelTimeMs:number}}
 */
export function phtFromDecel({ peakVelMs, decelSlopeMs2 }) {
  return {
    phtMs: round((1000 * (1 - Math.SQRT1_2) * peakVelMs) / decelSlopeMs2, 0),
    decelTimeMs: round((1000 * peakVelMs) / decelSlopeMs2, 0),
  };
}

// ---------- Envelope model ----------

const clampHr = (hr) => Math.min(180, Math.max(30, hr || 72));
const rrFromHr = (hr) => 60000 / clampHr(hr);
const sysMs = (frac, rr) => frac * REF_RR_MS * Math.sqrt(rr / REF_RR_MS);
const MV_CLOSE_MS = 30;

function halfSine(t, a, b) {
  return t <= a || t >= b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a));
}

/** Skewed half-sine: peak at u = peak, p < 1 rounder, p > 1 sharper. */
function ejectShape(u, peak, p) {
  if (u <= 0 || u >= 1) return 0;
  const a = Math.log(0.5) / Math.log(peak);
  return Math.sin(Math.PI * u ** a) ** p;
}

function decelWave(dt, v0, rise, slope) {
  if (dt < 0) return 0;
  if (dt < rise) return v0 * Math.sin((Math.PI / 2) * (dt / rise));
  return Math.max(0, v0 - slope * (dt - rise));
}

/** Deceleration slope in m/s per ms from PHT or deceleration time. */
const slopeOf = (v0, c) => (c.pht ? ((1 - Math.SQRT1_2) * v0) / c.pht : v0 / c.dt);

function timingMs(lesion, rr) {
  const tm = { ...DEFAULT_TIMING, ...lesion.doppler.timing };
  const ejEnd = sysMs(tm.ejEnd, rr);
  const mvOpen = ejEnd + tm.ivrtMs;
  return { ejStart: sysMs(tm.ejStart, rr), ejEnd, mrStart: sysMs(tm.mrStart, rr), mrEnd: mvOpen - 5, mvOpen };
}

function inflowAt(c, t, rr, T, af) {
  if (t < T.mvOpen || t > rr + MV_CLOSE_MS) return 0;
  const e = decelWave(t - T.mvOpen, c.E, c.rise || 80, slopeOf(c.E, c));
  const a = af || !c.A ? 0 : c.A * halfSine(t, rr - 125, rr + 20);
  const close = t > rr ? 1 - (t - rr) / MV_CLOSE_MS : 1;
  return (e + a) * close;
}

function arAt(c, t, rr, T) {
  const start = T.ejEnd + 8;
  if (t < start || t > rr + T.ejStart) return 0;
  return decelWave(t - start, c.v0, 25, slopeOf(c.v0, c));
}

function pvAt(c, t, rr, T, af) {
  const sAmp = af && c.S > 0 ? c.S * 0.6 : c.S;
  const s = sAmp * halfSine(t, sysMs(0.05, rr), T.ejEnd + 40);
  const d = c.D * halfSine(t, T.mvOpen + 15, T.mvOpen + 245);
  const ar = af ? 0 : c.Ar * halfSine(t, rr - 110, rr + 10);
  return s + d + ar;
}

function aoRevAt(c, t, rr, T) {
  const start = T.ejEnd + 10;
  if (!c.holo) return c.v0 * halfSine(t, start, start + 90);
  const end = rr + T.ejStart;
  if (t < start || t > end) return 0;
  const dt = t - start;
  if (dt < 40) return c.v0 * Math.sin((Math.PI / 2) * (dt / 40));
  return c.v0 + ((c.end - c.v0) * (dt - 40)) / (end - start - 40);
}

function componentAt(c, tMs, rr, T, af, prev) {
  if (c.k === 'eject') {
    const a = c.t ? sysMs(c.t[0], rr) : T.ejStart;
    const b = c.t ? sysMs(c.t[1], rr) : T.ejEnd;
    return c.v * ejectShape((tMs - a) / (b - a), c.peak, c.p);
  }
  if (c.k === 'mr') return c.v * ejectShape((tMs - T.mrStart) / (T.mrEnd - T.mrStart), 0.5, c.p);
  // Diastolic flows can spill over the QRS from the previous beat.
  const fn = { inflow: inflowAt, ar: arAt, pv: pvAt, aoRev: aoRevAt }[c.k];
  if (!fn) return 0;
  const now = fn(c, tMs, rr, T, af);
  const tail = fn(c, tMs + prev.rr, prev.rr, prev.T, af);
  return Math.abs(tail) > Math.abs(now) ? tail : now;
}

/** Channel ids available for every lesion. */
export const DOPPLER_CHANNELS = ['cw', 'pw-lvot', 'pw-mitral', 'pw-pulm-vein', 'pw-desc-aorta'];

function channelSpec(lesion, channel) {
  const own = lesion.doppler.channels[channel];
  return own || DEFAULT_CHANNELS[channel] || lesion.doppler.channels.cw;
}

/**
 * All spectral components at a time point.
 * @param {string} lesionId
 * @param {number} tFrac fraction of the RR interval (QRS at 0)
 * @param {string} [channel='cw']
 * @param {{hr?:number, af?:boolean, prevHr?:number}} [opts] prevHr: rate of the preceding beat (irregular rhythm)
 * @returns {{role:string, v:number, intensity:number, click:boolean}[]}
 */
export function dopplerComponents(lesionId, tFrac, channel = 'cw', opts = {}) {
  const lesion = getLesion(lesionId);
  const rr = rrFromHr(opts.hr);
  const T = timingMs(lesion, rr);
  const prevRr = opts.prevHr ? rrFromHr(opts.prevHr) : rr;
  const prev = { rr: prevRr, T: prevRr === rr ? T : timingMs(lesion, prevRr) };
  const tMs = (((tFrac % 1) + 1) % 1) * rr;
  return channelSpec(lesion, channel).map((c) => ({
    role: c.role, v: componentAt(c, tMs, rr, T, !!opts.af, prev), intensity: c.i, click: !!c.click,
  }));
}

/**
 * Signed velocity (m/s, positive toward the transducer) of the dominant envelope.
 * @param {string} lesionId @param {number} tFrac @param {string} [channel='cw'] @param {{hr?:number, af?:boolean}} [opts]
 */
export function dopplerVelocity(lesionId, tFrac, channel = 'cw', opts = {}) {
  return dopplerComponents(lesionId, tFrac, channel, opts)
    .reduce((best, c) => (Math.abs(c.v) > Math.abs(best) ? c.v : best), 0);
}

/**
 * Samples of one component role over one RR (periodic, so wrapped diastolic flow is included).
 * @returns {{peak:number, peakFrac:number, vtiCm:number, meanGradient:number, samples:number[]}}
 */
export function envelopeStats(lesionId, role, channel = 'cw', opts = {}, n = 1600) {
  const rrS = rrFromHr(opts.hr) / 1000;
  const flow = [];
  let peak = 0; let peakFrac = 0; let vti = 0;
  for (let i = 0; i < n; i += 1) {
    const f = i / n;
    const c = dopplerComponents(lesionId, f, channel, opts).find((x) => x.role === role);
    const v = c ? c.v : 0;
    if (Math.abs(v) > Math.abs(peak)) { peak = v; peakFrac = f; }
    vti += Math.abs(v) * 100 * (rrS / n);
    if (Math.abs(v) > 0.02) flow.push(v);
  }
  return { peak, peakFrac, vtiCm: round(vti, 1), meanGradient: meanGradientFromEnvelope(flow), samples: flow };
}

// ---------- Measurement rows ----------

const STATUS_HI = (sev, mod, mild, strict = false) => (v) => {
  const ge = (x) => (strict ? v > x : v >= x);
  if (ge(sev)) return 'severe';
  if (ge(mod)) return 'moderate';
  return v >= mild ? 'mild' : 'normal';
};
const STATUS_LO = (sev, mod, mild, strict = false) => (v) => {
  if (strict ? v < sev : v <= sev) return 'severe';
  if (v <= mod) return 'moderate';
  return v <= mild ? 'mild' : 'normal';
};
const row = (key, tr, en, value, unit, thrTr, thrEn, grade) => ({
  key, label: { tr, en }, value, unit, threshold: { tr: thrTr, en: thrEn }, status: grade(value),
});
const sPap = (inp) => round(4 * inp.trVmaxMs ** 2 + inp.rapMmHg, 0);
const lvotArea = (d) => Math.PI * (d / 2) ** 2;

function rowsAS(l) {
  const av = envelopeStats(l.id, 'av', 'cw');
  const lv = envelopeStats(l.id, 'lvot', 'pw-lvot');
  const { avaCm2 } = aorticValveAreaContinuity({ lvotDiamCm: l.inputs.lvotDiamCm, lvotVtiCm: lv.vtiCm, avVtiCm: av.vtiCm });
  const vmax = round(Math.abs(av.peak), 1);
  const svi = round((lvotArea(l.inputs.lvotDiamCm) * lv.vtiCm) / l.inputs.bsaM2, 0);
  return [
    row('vmax', 'Aortik tepe hız (Vmax)', 'Aortic peak velocity (Vmax)', vmax, 'm/s', 'Ciddi: ≥4,0 m/s', 'Severe: ≥4.0 m/s', STATUS_HI(4, 3, 2.6)),
    row('peakPg', 'Tepe gradyan', 'Peak gradient', bernoulliGradient(vmax), 'mmHg', 'Ciddi: ≥64 mmHg (4v²)', 'Severe: ≥64 mmHg (4v²)', STATUS_HI(64, 36, 27)),
    row('meanPg', 'Ortalama gradyan', 'Mean gradient', round(av.meanGradient, 0), 'mmHg', 'Ciddi: ≥40 mmHg', 'Severe: ≥40 mmHg', STATUS_HI(40, 20, 10)),
    row('ava', 'AVA (süreklilik denklemi)', 'AVA (continuity equation)', avaCm2, 'cm²', 'Ciddi: <1,0 cm²', 'Severe: <1.0 cm²', STATUS_LO(1.0, 1.5, 2.0, true)),
    row('avai', 'İndekslenmiş AVA', 'Indexed AVA', round(avaCm2 / l.inputs.bsaM2, 2), 'cm²/m²', 'Ciddi: <0,6 cm²/m²', 'Severe: <0.6 cm²/m²', STATUS_LO(0.6, 0.85, 1.1, true)),
    row('dvi', 'Boyutsuz indeks (DVI)', 'Dimensionless index (DVI)', dimensionlessIndex({ lvotVti: lv.vtiCm, avVti: av.vtiCm }), '', 'Ciddi: <0,25', 'Severe: <0.25', STATUS_LO(0.25, 0.5, 0.75, true)),
    row('svi', 'Atım hacmi indeksi', 'Stroke volume index', svi, 'mL/m²', 'Düşük akım: <35 mL/m²', 'Low flow: <35 mL/m²', (v) => (v < 35 ? 'moderate' : 'normal')),
  ];
}

function rowsAR(l) {
  const ar = envelopeStats(l.id, 'ar', 'cw');
  const lv = envelopeStats(l.id, 'lvot', 'pw-lvot');
  const p = pisa({ radiusCm: l.inputs.pisaRadiusCm, aliasingCms: l.inputs.aliasingCms, peakVelCms: Math.abs(ar.peak) * 100, vtiCm: ar.vtiCm });
  const lvotSv = lvotArea(l.inputs.lvotDiamCm) * lv.vtiCm;
  const T = timingMs(l, REF_RR_MS);
  const edv = dopplerComponents(l.id, (T.ejStart - 5) / REF_RR_MS, 'pw-desc-aorta').find((c) => c.role === 'ao-rev').v;
  const pht = l.doppler.channels.cw[0].pht;
  return [
    row('vc', 'Vena kontrakta', 'Vena contracta', l.inputs.vcMm, 'mm', 'Ciddi: >6 mm', 'Severe: >6 mm', STATUS_HI(6, 3, 0.1, true)),
    row('jetLvot', 'Jet genişliği / LVOT', 'Jet width / LVOT', l.inputs.jetWidthPct, '%', 'Ciddi: ≥%65', 'Severe: ≥65%', STATUS_HI(65, 25, 1)),
    row('pht', 'Basınç yarı zamanı (PHT)', 'Pressure half-time (PHT)', pht, 'ms', 'Ciddi: <200 ms', 'Severe: <200 ms', (v) => (v < 200 ? 'severe' : v <= 500 ? 'moderate' : 'mild')),
    row('edv', 'İnen aorta diyastol sonu ters akım', 'Descending aorta end-diastolic reversal', round(edv * 100, 0), 'cm/s', 'Ciddi: holodiyastolik, >20 cm/s', 'Severe: holodiastolic, >20 cm/s', (v) => (v > 20 ? 'severe' : v > 10 ? 'moderate' : 'normal')),
    row('eroa', 'Efektif regürjitan orifis alanı (PISA)', 'Effective regurgitant orifice area (PISA)', p.eroaCm2, 'cm²', 'Ciddi: ≥0,30 cm²', 'Severe: ≥0.30 cm²', STATUS_HI(0.3, 0.1, 0.01)),
    row('rvol', 'Regürjitan volüm', 'Regurgitant volume', p.rvolMl, 'mL', 'Ciddi: ≥60 mL', 'Severe: ≥60 mL', STATUS_HI(60, 30, 1)),
    row('rf', 'Regürjitan fraksiyon', 'Regurgitant fraction', regurgitantFraction(p.rvolMl, lvotSv), '%', 'Ciddi: ≥%50', 'Severe: ≥50%', STATUS_HI(50, 30, 1)),
  ];
}

function rowsMS(l) {
  const mi = envelopeStats(l.id, 'inflow', 'cw');
  const c = l.doppler.channels.cw[0];
  const { phtMs } = phtFromDecel({ peakVelMs: c.E, decelSlopeMs2: slopeOf(c.E, c) * 1000 });
  return [
    row('mva', 'MVA (220/PHT)', 'MVA (220/PHT)', mitralAreaPht(phtMs), 'cm²', 'Ciddi: ≤1,5 cm² (çok ciddi ≤1,0)', 'Severe: ≤1.5 cm² (very severe ≤1.0)', STATUS_LO(1.5, 2.0, 4.0)),
    row('pht', 'Basınç yarı zamanı (PHT)', 'Pressure half-time (PHT)', phtMs, 'ms', 'Ciddi: ≥150 ms (çok ciddi ≥220)', 'Severe: ≥150 ms (very severe ≥220)', STATUS_HI(150, 110, 70)),
    row('meanPg', 'Ortalama gradyan', 'Mean gradient', round(mi.meanGradient, 0), 'mmHg', 'Destekleyici: >10 mmHg (normal kalp hızında)', 'Supportive: >10 mmHg (at normal heart rate)', STATUS_HI(10.01, 5, 2)),
    row('peakE', 'Tepe E hızı', 'Peak E velocity', round(mi.peak, 1), 'm/s', 'Ciddi MD\'de genellikle >2 m/s', 'Usually >2 m/s in severe MS', STATUS_HI(2, 1.5, 1.2)),
    row('spap', 'Sistolik pulmoner arter basıncı', 'Systolic pulmonary artery pressure', sPap(l.inputs), 'mmHg', 'Destekleyici: >50 mmHg', 'Supportive: >50 mmHg', STATUS_HI(50.01, 36, 36)),
  ];
}

function rowsMR(l, secondary) {
  const mr = envelopeStats(l.id, 'mr', 'cw');
  const lv = envelopeStats(l.id, 'lvot', 'pw-lvot');
  const mi = envelopeStats(l.id, 'inflow', 'pw-mitral');
  const p = pisa({ radiusCm: l.inputs.pisaRadiusCm, aliasingCms: l.inputs.aliasingCms, peakVelCms: Math.abs(mr.peak) * 100, vtiCm: mr.vtiCm });
  const fwd = lvotArea(l.inputs.lvotDiamCm) * lv.vtiCm;
  const pvS = round(channelSpec(l, 'pw-pulm-vein')[0].S * 100, 0);
  const [eSev, rSev] = secondary ? [0.3, 45] : [0.4, 60];
  const eThr = secondary
    ? ['Ciddi: ≥0,30 cm² (ESC, eliptik orifis); ACC/AHA 2020 ≥0,40', 'Severe: ≥0.30 cm² (ESC, elliptical orifice); ACC/AHA 2020 ≥0.40']
    : ['Ciddi: ≥0,40 cm²', 'Severe: ≥0.40 cm²'];
  const rThr = secondary
    ? ['Ciddi: ≥45 mL (ESC, düşük akım); ACC/AHA 2020 ≥60', 'Severe: ≥45 mL (ESC, low flow); ACC/AHA 2020 ≥60']
    : ['Ciddi: ≥60 mL', 'Severe: ≥60 mL'];
  const rows = [
    row('vc', 'Vena kontrakta', 'Vena contracta', l.inputs.vcMm, 'mm', 'Ciddi: ≥7 mm', 'Severe: ≥7 mm', STATUS_HI(7, 3, 0.1)),
    row('eroa', 'Efektif regürjitan orifis alanı (PISA)', 'Effective regurgitant orifice area (PISA)', p.eroaCm2, 'cm²', eThr[0], eThr[1], STATUS_HI(eSev, 0.2, 0.01)),
    row('rvol', 'Regürjitan volüm', 'Regurgitant volume', p.rvolMl, 'mL', rThr[0], rThr[1], STATUS_HI(rSev, 30, 1)),
    row('rf', 'Regürjitan fraksiyon', 'Regurgitant fraction', regurgitantFraction(p.rvolMl, p.rvolMl + fwd), '%', 'Ciddi: ≥%50', 'Severe: ≥50%', STATUS_HI(50, 30, 1)),
    row('peakE', 'Mitral E hızı', 'Mitral E velocity', round(mi.peak, 1), 'm/s', 'Destekleyici: >1,2 m/s (E baskın)', 'Supportive: >1.2 m/s (E dominant)', STATUS_HI(1.21, 1.0, 0.5)),
    row('pvS', 'Pulmoner ven S dalgası', 'Pulmonary vein S wave', pvS, 'cm/s', 'Ciddi: sistolik ters akım (S <0)', 'Severe: systolic flow reversal (S <0)', (v) => (v < 0 ? 'severe' : v < 35 ? 'moderate' : 'normal')),
  ];
  if (secondary) rows.push(row('spap', 'Sistolik pulmoner arter basıncı', 'Systolic pulmonary artery pressure', sPap(l.inputs), 'mmHg', 'Destekleyici: >50 mmHg', 'Supportive: >50 mmHg', STATUS_HI(50.01, 36, 36)));
  return rows;
}

function rowsNormal(l) {
  const av = envelopeStats(l.id, 'av', 'cw');
  const mi = envelopeStats(l.id, 'inflow', 'pw-mitral');
  const vmax = round(Math.abs(av.peak), 1);
  return [
    row('vmax', 'Aortik tepe hız', 'Aortic peak velocity', vmax, 'm/s', 'Normal: <2,6 m/s', 'Normal: <2.6 m/s', STATUS_HI(4, 3, 2.6)),
    row('meanPg', 'Aortik ortalama gradyan', 'Aortic mean gradient', round(av.meanGradient, 0), 'mmHg', 'Normal: <10 mmHg', 'Normal: <10 mmHg', STATUS_HI(40, 20, 10)),
    row('peakE', 'Mitral E hızı', 'Mitral E velocity', round(mi.peak, 1), 'm/s', 'Normal: ~0,6–1,0 m/s', 'Normal: ~0.6–1.0 m/s', (v) => (v > 1.2 ? 'mild' : 'normal')),
  ];
}

const ROW_BUILDERS = {
  normal: rowsNormal, 'as-severe': rowsAS, 'ar-severe': rowsAR, 'ms-severe': rowsMS,
  'mr-severe-primary': (l) => rowsMR(l, false), 'mr-severe-secondary': (l) => rowsMR(l, true),
};

/**
 * Quantify a lesion from its own consistent example inputs and envelope model.
 * @param {string} id
 * @returns {{id:string, measurements:object[]}}
 */
export function evaluateLesion(id) {
  const l = getLesion(id);
  return { id: l.id, measurements: ROW_BUILDERS[l.id](l) };
}

/** Lesion catalogue with computed measurement rows. */
export const VALVE_LESIONS = LESION_DATA.map((l) => Object.freeze({ ...l, measurements: evaluateLesion(l.id).measurements }));

// ---------- Colour Doppler overlay parameters ----------

const COLOR_EXTRA = {
  'as-severe': { mosaic: true, pisa: null, vcMm: null },
  'ar-severe': { mosaic: true, pisa: { radiusCm: 0.9, aliasingCms: 40, side: 'aorta' }, vcMm: 7 },
  'ms-severe': { mosaic: true, pisa: { radiusCm: 1.0, aliasingCms: 35, side: 'la', angleDeg: 120 }, vcMm: null },
  'mr-severe-primary': { mosaic: true, pisa: { radiusCm: 1.0, aliasingCms: 40, side: 'lv' }, vcMm: 8 },
  'mr-severe-secondary': { mosaic: true, pisa: { radiusCm: 0.8, aliasingCms: 40, side: 'lv', hemiellipse: true }, vcMm: 7 },
};

/**
 * Data for a colour Doppler jet overlay. phaseWindow is [start, end] in RR fractions; end > 1 wraps into the next beat.
 * @param {string} lesionId
 */
export function lesionColorJet(lesionId) {
  const l = getLesion(lesionId);
  const base = { lesionId: l.id, active: false, aliasingCms: 60, mosaic: false, pisa: null, vcMm: null, phaseWindow: null };
  if (!l.jet) return base;
  const T = timingMs(l, REF_RR_MS);
  const f = (ms) => round(ms / REF_RR_MS, 3);
  const windows = {
    'lv>aorta': [f(T.ejStart), f(T.ejEnd)],
    'lv>la': [f(T.mrStart), f(T.mrEnd)],
    'aorta>lv': [f(T.ejEnd + 8), f(REF_RR_MS + T.ejStart)],
    'la>lv': [f(T.mvOpen), f(REF_RR_MS + MV_CLOSE_MS)],
  };
  return {
    ...base, ...COLOR_EXTRA[l.id], active: true,
    phase: l.jet.phase, direction: l.jet.direction, from: l.jet.from, to: l.jet.to,
    eccentric: l.jet.eccentric, wallHugging: Math.abs(l.jet.eccentric) > 0.4,
    widthFrac: l.jet.widthFrac, lengthFrac: l.jet.lengthFrac,
    phaseWindow: windows[`${l.jet.from}>${l.jet.to}`],
  };
}

// Interactive STEMI & Reciprocal ST-Depression Camera Viewpoint Studio
// Models how the transmural ST-injury vector (V_ST) points toward the infarcted myocardial wall:
//   - Camera leads facing the infarct hemisphere (cos Δθ > 0) record ST ELEVATION (STE ↑)
//   - Camera leads on the opposite hemisphere (cos Δθ < 0, ~180° away) record RECIPROCAL ST DEPRESSION (STD ↓, mirror image)

const NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}, text = '') {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) el.setAttribute(k, String(v));
  }
  if (text) el.textContent = text;
  return el;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function normDeg(deg) {
  let d = ((deg + 180) % 360 + 360) % 360 - 180;
  if (d === -180) d = 180;
  return d;
}

function degDiff(a, b) {
  return Math.abs(normDeg(a - b));
}

// Camera stations positioned around the heart (combining frontal hexaxial + key precordial/posterior viewpoints)
export const STEMI_CAMERA_STATIONS = [
  {
    id: 'aVR',
    label: 'aVR',
    angle: -150,
    orbitAngle: -142,
    plane: 'frontal',
    color: '#ef4444',
    posName: { tr: 'Sağ Omuz (−150°)', en: 'Right Shoulder (−150°)' },
    wallView: { tr: 'Bazal kavite / sağ üst bakış', en: 'Basal cavity / right superior view' }
  },
  {
    id: 'V7_V9',
    label: 'V7–V9',
    angle: -152,
    orbitAngle: 162,
    plane: 'precordial',
    color: '#14b8a6',
    posName: { tr: 'Posterior Sırt (V7–V9)', en: 'Posterior Back (V7–V9)' },
    wallView: { tr: 'İnferobazal (posterior) duvar: V1–V3’ün 180° karşısı', en: 'Inferobasal (posterior) wall: 180° opposite V1–V3' }
  },
  {
    id: 'aVL',
    label: 'aVL',
    angle: -30,
    orbitAngle: -32,
    plane: 'frontal',
    color: '#f59e0b',
    posName: { tr: 'Sol Omuz (−30°)', en: 'Left Shoulder (−30°)' },
    wallView: { tr: 'Yüksek lateral duvar (ve İnferior MI resiprokal aynası)', en: 'High lateral wall (& Inferior MI reciprocal mirror)' }
  },
  {
    id: 'I',
    label: 'I',
    angle: 0,
    orbitAngle: 0,
    plane: 'frontal',
    color: '#10b981',
    posName: { tr: 'Sol Kol Yatay (0°)', en: 'Left Arm Horizontal (0°)' },
    wallView: { tr: 'Lateral sol ventrikül duvarı', en: 'Lateral LV wall' }
  },
  {
    id: 'V2_V3',
    label: 'V1–V3',
    angle: 28,
    orbitAngle: 30,
    plane: 'precordial',
    color: '#ec4899',
    posName: { tr: 'Ön Göğüs Duvarı (V1–V3)', en: 'Anterior Chest Wall (V1–V3)' },
    wallView: { tr: 'Anterior-septal duvar (ve Posterior MI resiprokal aynası)', en: 'Anteroseptal wall (& Posterior MI reciprocal mirror)' }
  },
  {
    id: 'II',
    label: 'II',
    angle: 60,
    orbitAngle: 60,
    plane: 'frontal',
    color: '#f97316',
    posName: { tr: 'Sol Bacak / Apeks (+60°)', en: 'Left Leg / Apex (+60°)' },
    wallView: { tr: 'İnferolateral-apikal duvar (LCx > RCA)', en: 'Inferolateral-apical wall (LCx > RCA)' }
  },
  {
    id: 'aVF',
    label: 'aVF',
    angle: 90,
    orbitAngle: 90,
    plane: 'frontal',
    color: '#a855f7',
    posName: { tr: 'Alt Dikey Duvar (+90°)', en: 'Inferior Vertical (+90°)' },
    wallView: { tr: 'Diyafragmatik inferior duvar', en: 'Diaphragmatic inferior wall' }
  },
  {
    id: 'III',
    label: 'III',
    angle: 120,
    orbitAngle: 122,
    plane: 'frontal',
    color: '#3b82f6',
    posName: { tr: 'Sağ-Alt İnferior (+120°)', en: 'Right-Inferior (+120°)' },
    wallView: { tr: 'Sağ-inferior duvar (RCA baskın, aVL ile 150° karşıt)', en: 'Right-inferior wall (RCA dominant, 150° opposite aVL)' }
  }
];

export const STEMI_PHASES = [
  {
    id: 'hyperacute',
    order: 1,
    name: { tr: '1. Hiperakut Evre (Dakikalar)', en: '1. Hyperacute Phase (Minutes)' },
    stFactor: 0.65,
    tBoost: 0.55,
    qDepth: 0.0,
    tInvert: 0.0,
    desc: {
      tr: 'Koroner tıkanmanın ilk dakikaları: İskemik bölgede hücre dışı K⁺ artışı ve aksiyon potansiyeli kısalmasıyla yüksek, geniş tabanlı "hiperakut T dalgaları" ve erken J-noktası yükselmesi başlar.',
      en: 'First minutes of occlusion: Local extracellular K⁺ rise and action potential shortening produce tall, broad-based hyperacute T waves and early J-point elevation.'
    }
  },
  {
    id: 'acute',
    order: 2,
    name: { tr: '2. Akut Tam Kat Hasar (Saatler)', en: '2. Acute Transmural Injury (Hours)' },
    stFactor: 1.0,
    tBoost: 0.32,
    qDepth: 0.14,
    tInvert: 0.0,
    desc: {
      tr: 'Belirgin ST hasar akımı (Current of Injury): Enfarktüs duvarına bakan kameralar konveks ST elevasyonu (STE ↑), karşı duvardan bakan kameralar ise resiprokal ST depresyonu (STD ↓) kaydeder.',
      en: 'Pronounced Current of Injury: Cameras facing the infarct wall record convex ST elevation (STE ↑), while cameras on the opposite wall record reciprocal ST depression (STD ↓).'
    }
  },
  {
    id: 'subacute',
    order: 3,
    name: { tr: '3. Subakut / Nekroz Evresi (Saatler–Günler)', en: '3. Subacute / Necrosis Phase (Hours–Days)' },
    stFactor: 0.72,
    tBoost: 0.0,
    qDepth: 0.42,
    tInvert: 0.34,
    desc: {
      tr: 'Miyokard nekrozu oturdukça elektriksel olarak ölü pencereden uzaklaşan ilk vektörler patolojik Q dalgası (posterior MI’da V1–V2’de resiprokal yüksek R dalgası) ve bifazik/negatif T dalgası oluşturur.',
      en: 'As myocardial necrosis develops, forces turn away from the electrically silent window, producing pathological Q waves (or tall reciprocal R waves in V1–V2 for posterior MI) and terminal T inversion.'
    }
  }
];

export const STEMI_TERRITORIES = [
  {
    id: 'inferior_rca',
    pailsLetter: 'I',
    shortLabel: { tr: 'İnferior STEMI (RCA)', en: 'Inferior STEMI (RCA)' },
    title: { tr: 'Akut İnferior STEMI: Sağ Koroner Arter (RCA)', en: 'Acute Inferior STEMI: Right Coronary Artery (RCA)' },
    culprit: { tr: 'Sağ Koroner Arter (RCA, %80–85)', en: 'Right Coronary Artery (RCA, 80–85%)' },
    wallName: { tr: 'Sağ-Alt (Diyafragmatik / İnferoseptal) Duvar', en: 'Right-Inferior (Diaphragmatic / Inferoseptal) Wall' },
    injuryAngle: 112,
    primaryLead: 'III',
    reciprocalLead: 'aVL',
    directLeads: ['III', 'aVF', 'II'],
    reciprocalLeads: ['aVL', 'I'],
    infarctPatch: 'M 250 318 C 282 332, 326 322, 344 292 C 330 272, 294 282, 250 318 Z',
    infarctCenter: { x: 302, y: 306 },
    occludedVessel: 'rca',
    occlusionPoint: { x: 245, y: 248 },
    clinicalRule: {
      tr: 'RCA tıkanmasında ST hasar vektörü sağ-aşağıya (+110°..+120°, Derivasyon III’e) yönelir: STE(III) > STE(II) olur ve −30°’deki aVL kamerasında derin resiprokal ST depresyonu görülür.',
      en: 'In RCA occlusion, the ST injury vector points inferiorly and rightward (+110°..+120° toward Lead III): STE(III) > STE(II) with marked reciprocal ST depression in aVL (−30°).'
    },
    reciprocalWhy: {
      tr: 'aVL (−30°) kamerası, +112° yönündeki inferior ST hasar vektörüne 142° ters açıdan bakar (cos 142° ≈ −0.79). Bu nedenle III’teki ST yükselmesinin ayna görüntüsü aVL’de ST çökmesi olarak yazılır.',
      en: 'Camera aVL (−30°) views the +112° inferior ST injury vector from 142° away (cos 142° ≈ −0.79), recording the inverted mirror image of Lead III’s ST elevation as ST depression.'
    }
  },
  {
    id: 'inferior_lcx',
    pailsLetter: 'I',
    shortLabel: { tr: 'İnferior STEMI (LCx)', en: 'Inferior STEMI (LCx)' },
    title: { tr: 'Akut İnferolateral STEMI: Sirkumfleks Arter (LCx)', en: 'Acute Inferolateral STEMI: Left Circumflex (LCx)' },
    culprit: { tr: 'Sol Sirkumfleks Arter (Dominant LCx, %15–20)', en: 'Left Circumflex Artery (Dominant LCx, 15–20%)' },
    wallName: { tr: 'Sol-Alt (İnferolateral / Apikal) Duvar', en: 'Left-Inferior (Inferolateral / Apical) Wall' },
    injuryAngle: 68,
    primaryLead: 'II',
    reciprocalLead: 'aVR',
    directLeads: ['II', 'aVF', 'III'],
    reciprocalLeads: ['aVR', 'V2_V3'],
    infarctPatch: 'M 286 322 C 332 326, 366 292, 364 252 C 344 256, 314 286, 286 322 Z',
    infarctCenter: { x: 336, y: 294 },
    occludedVessel: 'lcx',
    occlusionPoint: { x: 346, y: 215 },
    clinicalRule: {
      tr: 'LCx tıkanmasında ST vektörü aşağı-sola (+60°..+75°, Derivasyon II’ye) kayar: STE(II) ≥ STE(III) olur; aVL’de ST depresyonu genellikle yoktur veya izoelektriktir, resiprokal çökme aVR ve V1–V2’de izlenir.',
      en: 'In LCx occlusion, the ST vector shifts inferiorly and leftward (+60°..+75° toward Lead II): STE(II) ≥ STE(III), aVL lacks deep ST depression, and reciprocal depression appears in aVR and V1–V2.'
    },
    reciprocalWhy: {
      tr: 'LCx hasar vektörü (+68°) aVL (−30°) ile neredeyse dik açıya (~98°) yaklaştığı için aVL’de derin çökme yapmaz; tam karşıdaki aVR (−150°) kamerası ise belirgin resiprokal ST depresyonu kaydeder.',
      en: 'Because the +68° LCx injury vector is nearly perpendicular (~98°) to aVL (−30°), aVL is spared deep depression while opposite camera aVR (−150°) records reciprocal ST depression.'
    }
  },
  {
    id: 'high_lateral',
    pailsLetter: 'L',
    shortLabel: { tr: 'Yüksek Lateral (D1/LCx)', en: 'High Lateral (D1/LCx)' },
    title: { tr: 'Yüksek Lateral STEMI: 1. Diyagonal (D1) / OM Dalı', en: 'High Lateral STEMI: 1st Diagonal (D1) / OM Branch' },
    culprit: { tr: 'LAD 1. Diyagonal Dal (D1) veya LCx Obtus Marjinal (OM)', en: 'LAD 1st Diagonal (D1) or LCx Obtuse Marginal (OM)' },
    wallName: { tr: 'Yüksek Anterolateral Sol Ventrikül Duvarı', en: 'High Anterolateral LV Wall' },
    injuryAngle: -28,
    primaryLead: 'aVL',
    reciprocalLead: 'III',
    directLeads: ['aVL', 'I'],
    reciprocalLeads: ['III', 'aVF'],
    infarctPatch: 'M 332 182 C 362 198, 374 238, 358 268 C 340 248, 330 214, 332 182 Z',
    infarctCenter: { x: 354, y: 224 },
    occludedVessel: 'd1',
    occlusionPoint: { x: 332, y: 196 },
    clinicalRule: {
      tr: 'PAILS Kuralı (Lateral → Septal/İnferior): Sol omuz kameraları (I ve aVL) yüksek lateral duvardaki ST elevasyonunu doğrudan görürken, alttaki III ve aVF kameraları resiprokal ST depresyonu kaydeder.',
      en: 'PAILS Rule (Lateral → Septal/Inferior): Left shoulder cameras (I and aVL) directly view high lateral ST elevation, while inferior cameras (III and aVF) record reciprocal ST depression.'
    },
    reciprocalWhy: {
      tr: 'ST hasar vektörü sol omuza (−28°) yöneldiğinde, sağ-alttaki Derivasyon III (+120°) kamerası vektörün kuyruğunu (148° karşı açı) görür ve ayna görüntüsü olarak ST depresyonu çizer.',
      en: 'When the ST injury vector points toward the left shoulder (−28°), Lead III (+120°) views the tail of the vector (148° away) and draws mirror-image ST depression.'
    }
  },
  {
    id: 'anterior_lad',
    pailsLetter: 'A',
    shortLabel: { tr: 'Anterior STEMI (LAD)', en: 'Anterior STEMI (LAD)' },
    title: { tr: 'Akut Anterior STEMI: Proksimal Sol Ön İnen Arter (LAD)', en: 'Acute Anterior STEMI: Proximal LAD Occlusion' },
    culprit: { tr: 'Proksimal Sol Ön İnen Arter (LAD, D1/S1 öncesi)', en: 'Proximal Left Anterior Descending Artery (LAD)' },
    wallName: { tr: 'Anterior ve Anteroseptal Sol Ventrikül Duvarı', en: 'Anterior & Anteroseptal LV Wall' },
    injuryAngle: 24,
    primaryLead: 'V2_V3',
    reciprocalLead: 'III',
    directLeads: ['V2_V3', 'I', 'aVL'],
    reciprocalLeads: ['III', 'aVF', 'II'],
    infarctPatch: 'M 278 206 C 318 206, 348 242, 336 286 C 304 286, 276 250, 278 206 Z',
    infarctCenter: { x: 310, y: 248 },
    occludedVessel: 'lad',
    occlusionPoint: { x: 298, y: 204 },
    clinicalRule: {
      tr: 'PAILS Kuralı (Anterior → İnferior): Ön göğüs kameraları (V1–V4) ve yüksek lateral kameralar (I, aVL) ST elevasyonu kaydederken; proksimal LAD tıkanmasında inferior kameralarda (II, III, aVF) resiprokal ST depresyonu görülür.',
      en: 'PAILS Rule (Anterior → Inferior): Precordial anterior cameras (V1–V4) and high lateral leads (I, aVL) record ST elevation, while inferior leads (II, III, aVF) show reciprocal ST depression in proximal LAD occlusion.'
    },
    reciprocalWhy: {
      tr: 'Proksimal LAD tıkanması hem ön duvarı hem de yüksek bazal-anterior septumu etkilediği için ST vektörü öne ve yukarı-sola çekilir; alttan bakan III ve aVF kameraları bu vektörün arkasında kalır.',
      en: 'Proximal LAD occlusion injures both the anterior wall and basal-anterior septum, pulling the ST vector anteriorly and superiorly away from inferior cameras III and aVF.'
    }
  },
  {
    id: 'posterior_mi',
    pailsLetter: 'P',
    shortLabel: { tr: 'Posterior STEMI (V7–V9)', en: 'Posterior STEMI (V7–V9)' },
    title: { tr: 'Akut Posterior (İnferobazal) STEMI: Ayna Görüntüsü', en: 'Acute Posterior (Inferobasal) STEMI: Mirror Image' },
    culprit: { tr: 'LCx veya RCA Posterior İnen Dal (PDA)', en: 'LCx or RCA Posterior Descending Artery (PDA)' },
    wallName: { tr: 'Posterior (İnferobazal / Sırt) Sol Ventrikül Duvarı', en: 'Posterior (Inferobasal / Dorsal) LV Wall' },
    injuryAngle: -152,
    primaryLead: 'V7_V9',
    reciprocalLead: 'V2_V3',
    directLeads: ['V7_V9', 'III'],
    reciprocalLeads: ['V2_V3'],
    infarctPatch: 'M 252 194 C 284 182, 316 196, 314 232 C 284 236, 258 218, 252 194 Z',
    infarctCenter: { x: 284, y: 208 },
    occludedVessel: 'pda',
    occlusionPoint: { x: 274, y: 202 },
    clinicalRule: {
      tr: 'PAILS Kuralı (Posterior → Anterior V1–V3): Standart 12 derivasyonda kalbin sırtına doğrudan bakan elektrot yoktur! Ön göğüsteki V1–V3 kameraları posterior enfarktüsü 180° tersten görür: Horizontal ST depresyonu + Uzun/Geniş R dalgası + Pozitif dik T dalgası ("Ayna Testi"). Doğrulamak için sırta V7–V9 bağlanır.',
      en: 'PAILS Rule (Posterior → Anterior V1–V3): Standard 12-lead ECG has no electrode directly on the back! Anterior V1–V3 cameras view posterior infarction from 180° opposite: Horizontal ST depression + Tall R wave + Upright T wave ("Mirror Test"). Confirm with posterior leads V7–V9.'
    },
    reciprocalWhy: {
      tr: 'Hasar vektörü tam arkaya (sırta, V7–V9 yönüne) yönelir. Ön göğüsteki V1–V3 kameraları bu vektörün tam kuyruğuna (180° karşıt) baktığı için V7–V9’daki ST elevasyonu + Q dalgasını, V1–V3’te ST depresyonu + yüksek R dalgası olarak ters çevirir.',
      en: 'The injury vector points directly posteriorly toward V7–V9. Anterior cameras V1–V3 look at the tail of this vector (180° opposite), inverting V7–V9’s ST elevation and Q wave into V1–V3 ST depression and tall R waves.'
    }
  }
];

/**
 * Computes the ST-segment projection (-1..+1) for a camera at `cameraAngleDeg`
 * given a territory (`territoryId` or custom `injuryAngleDeg`).
 */
export function stemiProjectionForCamera(territoryId, cameraIdOrAngle, customInjuryAngle = null) {
  const territory = STEMI_TERRITORIES.find(t => t.id === territoryId) || STEMI_TERRITORIES[0];
  const station = typeof cameraIdOrAngle === 'string'
    ? STEMI_CAMERA_STATIONS.find(s => s.id === cameraIdOrAngle)
    : null;
  const camAngle = station ? station.angle : Number(cameraIdOrAngle);
  const injAngle = customInjuryAngle !== null ? Number(customInjuryAngle) : territory.injuryAngle;

  // Base cosine projection between camera axis and ST injury vector
  const deltaRad = ((camAngle - injAngle) * Math.PI) / 180;
  let proj = Math.cos(deltaRad);

  // Precordial/horizontal plane adjustments when user hasn't overridden injuryAngle manually
  if (customInjuryAngle === null && station) {
    if (territory.id === 'anterior_lad') {
      if (station.id === 'V2_V3') proj = 1.0;
      else if (station.id === 'aVL' || station.id === 'I') proj = 0.58;
      else if (station.id === 'III') proj = -0.68;
      else if (station.id === 'aVF') proj = -0.58;
      else if (station.id === 'II') proj = -0.45;
      else if (station.id === 'V7_V9') proj = -0.75;
    } else if (territory.id === 'posterior_mi') {
      if (station.id === 'V7_V9') proj = 0.96;
      else if (station.id === 'V2_V3') proj = -0.96;
      else if (station.id === 'III' || station.id === 'aVF') proj = 0.42;
      else if (station.id === 'aVL') proj = -0.35;
    }
  }

  return clamp(proj, -1, 1);
}

/**
 * Generates an ECG waveform sample (in mV) at normalized beat time u in [0, 1]
 * incorporating both normal P-QRS-T dipole projection and acute STEMI injury current.
 */
export function stemiWaveSample(u, {
  cameraAngleDeg = 60,
  stProjection = 0.8,
  stMagnitudeMv = 0.30,
  phaseId = 'acute',
  invertMirror = false
} = {}) {
  const phase = STEMI_PHASES.find(p => p.id === phaseId) || STEMI_PHASES[1];
  const g = (c, w, a) => a * Math.exp(-(((u - c) / w) ** 2));

  // Normal underlying P, Q, R, S, T baseline projection for the camera angle
  const rad = (cameraAngleDeg * Math.PI) / 180;
  const meanAxisRad = (58 * Math.PI) / 180;
  const qrsAlign = Math.cos(rad - meanAxisRad);

  const pWave = 0.13 * Math.cos(rad - (58 * Math.PI) / 180) * Math.exp(-(((u - 0.16) / 0.036) ** 2));

  // Pathological Q wave (or tall reciprocal R wave when stProjection < 0 in subacute/acute phase)
  const necroSign = stProjection >= 0 ? -1 : 1;
  const pathQ = necroSign * Math.abs(stProjection) * phase.qDepth * g(0.328, 0.016, 1.0);

  const normalQ = -0.10 * qrsAlign * g(0.33, 0.011, 1.0);
  const rAmp = qrsAlign >= 0 ? (0.35 + 0.72 * qrsAlign) : (0.18 * (1 + qrsAlign));
  const sAmp = qrsAlign >= 0 ? (0.14 * (1 - qrsAlign)) : (0.32 + 0.65 * Math.abs(qrsAlign));

  // In subacute/acute STEMI, direct leads lose R height while reciprocal leads (like V1-V2 in Posterior MI) gain R height
  const rMod = clamp(rAmp - Math.max(0, stProjection) * phase.qDepth * 0.45 + Math.max(0, -stProjection) * phase.qDepth * 0.55, 0.08, 1.25);
  const qrs = pathQ + normalQ + g(0.368, 0.014, rMod) - g(0.402, 0.015, sAmp);

  // ST-segment plateau + hyperacute/coved dome between J-point (u ≈ 0.415) and T-wave end (u ≈ 0.74)
  const stShift = stProjection * stMagnitudeMv * phase.stFactor;
  const stOnset = 1 / (1 + Math.exp(-(u - 0.405) / 0.009));
  const stOffset = 1 / (1 + Math.exp((u - 0.695) / 0.028));
  const stWindow = stOnset * stOffset;
  const covedDome = g(0.515, 0.075, stShift * 0.35);
  const stComponent = (stShift * stWindow) + covedDome;

  // T wave: hyperacute tall T in phase 1/2, terminal inversion in phase 3
  const baseT = 0.24 * qrsAlign * g(0.625, 0.058, 1.0);
  const hyperT = stProjection * (stMagnitudeMv * 1.35 + 0.16) * phase.tBoost * g(0.60, 0.062, 1.0);
  const termInvertT = -stProjection * phase.tInvert * g(0.665, 0.038, 1.0);

  const total = pWave + qrs + stComponent + baseT + hyperT + termInvertT;
  return invertMirror ? -total : total;
}

export function stemiWavePath(x0, yBase, width, gainPxPerMv, opts = {}, samples = 180) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const x = x0 + u * width;
    const mv = stemiWaveSample(u, opts);
    const y = yBase - mv * gainPxPerMv;
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

export function classifyStRole(stMv) {
  if (stMv >= 0.08) return 'ste';
  if (stMv <= -0.08) return 'std';
  return 'iso';
}

export function createStemiCameraLab({
  mount,
  getLang = () => 'tr',
  state = {},
  onTerritoryChange = null
}) {
  if (state.territoryId === undefined) state.territoryId = 'inferior_rca';
  if (state.phaseId === undefined) state.phaseId = 'acute';
  if (state.selectedLead === undefined) state.selectedLead = 'III';
  if (state.stMagnitudeMv === undefined) state.stMagnitudeMv = 0.30; // 3.0 mm
  if (state.customInjuryAngle === undefined) state.customInjuryAngle = null;
  if (state.mirrorFlip === undefined) state.mirrorFlip = false;
  if (state.tourPlaying === undefined) state.tourPlaying = false;

  let tourTimer = null;
  const tr = (trText, enText) => (getLang() === 'en' ? enText : trText);

  const root = document.createElement('section');
  root.className = 'scam-studio';
  root.dataset.scam = 'studio';
  mount.append(root);

  function getActiveTerritory() {
    return STEMI_TERRITORIES.find(t => t.id === state.territoryId) || STEMI_TERRITORIES[0];
  }

  function getActivePhase() {
    return STEMI_PHASES.find(p => p.id === state.phaseId) || STEMI_PHASES[1];
  }

  function getEffectiveInjuryAngle() {
    const t = getActiveTerritory();
    return state.customInjuryAngle !== null ? state.customInjuryAngle : t.injuryAngle;
  }

  function stopTour() {
    state.tourPlaying = false;
    if (tourTimer) {
      clearInterval(tourTimer);
      tourTimer = null;
    }
  }

  function toggleTour() {
    if (state.tourPlaying) {
      stopTour();
      updateUI();
      return;
    }
    state.tourPlaying = true;
    const order = ['III', 'aVF', 'II', 'aVL', 'I', 'V2_V3', 'V7_V9', 'aVR'];
    let idx = Math.max(0, order.indexOf(state.selectedLead));
    tourTimer = setInterval(() => {
      idx = (idx + 1) % order.length;
      state.selectedLead = order[idx];
      updateUI();
    }, 1500);
    updateUI();
  }

  function selectTerritory(territoryId, notify = true) {
    stopTour();
    const territory = STEMI_TERRITORIES.find(t => t.id === territoryId) || STEMI_TERRITORIES[0];
    state.territoryId = territory.id;
    state.customInjuryAngle = null;
    state.selectedLead = territory.primaryLead;
    updateUI();
    if (notify && typeof onTerritoryChange === 'function') {
      onTerritoryChange(territory.id);
    }
  }

  // Build static scaffold
  root.innerHTML = `
    <div class="scam-header">
      <div class="scam-title-wrap">
        <span class="scam-kicker" data-scam-kicker></span>
        <h3 class="scam-title" data-scam-title></h3>
        <p class="scam-subtitle" data-scam-subtitle></p>
      </div>
      <div class="scam-header-actions">
        <button type="button" class="scam-action-btn" data-scam-action="mirror"></button>
        <button type="button" class="scam-action-btn" data-scam-action="tour"></button>
      </div>
    </div>

    <div class="scam-territory-bar" role="group" data-scam-territories></div>

    <div class="scam-phase-bar" role="group" data-scam-phases></div>

    <div class="scam-body-grid">
      <div class="scam-stage-card">
        <div class="scam-svg-wrap">
          <svg viewBox="0 0 620 520" class="scam-stage-svg" role="img" data-scam-stage></svg>
        </div>
        <div class="scam-slider-bar">
          <div class="scam-slider-group">
            <label class="scam-slider-label" for="scam-vector-slider">
              <span data-scam-vec-label></span>
              <strong data-scam-vec-out></strong>
            </label>
            <input type="range" id="scam-vector-slider" class="scam-range" min="-180" max="180" step="1" data-scam-slider="angle" />
          </div>
          <div class="scam-slider-group">
            <label class="scam-slider-label" for="scam-mag-slider">
              <span data-scam-mag-label></span>
              <strong data-scam-mag-out></strong>
            </label>
            <input type="range" id="scam-mag-slider" class="scam-range" min="0.10" max="0.50" step="0.05" data-scam-slider="mag" />
          </div>
        </div>
      </div>

      <div class="scam-monitors-col">
        <div class="scam-dual-monitors">
          <div class="scam-monitor-card scam-monitor-direct">
            <div class="scam-monitor-head">
              <span class="scam-monitor-badge" data-scam-direct-badge></span>
              <strong class="scam-monitor-metric" data-scam-direct-metric></strong>
            </div>
            <svg viewBox="0 0 380 148" class="scam-monitor-svg" data-scam-direct-svg></svg>
            <p class="scam-monitor-caption" data-scam-direct-caption></p>
          </div>

          <div class="scam-monitor-card scam-monitor-reciprocal">
            <div class="scam-monitor-head">
              <span class="scam-monitor-badge" data-scam-recip-badge></span>
              <strong class="scam-monitor-metric" data-scam-recip-metric></strong>
            </div>
            <svg viewBox="0 0 380 148" class="scam-monitor-svg" data-scam-recip-svg></svg>
            <p class="scam-monitor-caption" data-scam-recip-caption></p>
          </div>
        </div>

        <div class="scam-clinical-box" data-scam-readout></div>

        <div class="scam-pails-card">
          <div class="scam-pails-head">
            <strong data-scam-pails-title></strong>
            <span data-scam-pails-sub></span>
          </div>
          <div class="scam-pails-grid" data-scam-pails-grid></div>
        </div>
      </div>
    </div>
  `;

  const kickerEl = root.querySelector('[data-scam-kicker]');
  const titleEl = root.querySelector('[data-scam-title]');
  const subtitleEl = root.querySelector('[data-scam-subtitle]');
  const mirrorBtn = root.querySelector('[data-scam-action="mirror"]');
  const tourBtn = root.querySelector('[data-scam-action="tour"]');
  const territoryBar = root.querySelector('[data-scam-territories]');
  const phaseBar = root.querySelector('[data-scam-phases]');
  const stageSvg = root.querySelector('[data-scam-stage]');
  const vecLabel = root.querySelector('[data-scam-vec-label]');
  const vecOut = root.querySelector('[data-scam-vec-out]');
  const magLabel = root.querySelector('[data-scam-mag-label]');
  const magOut = root.querySelector('[data-scam-mag-out]');
  const angleSlider = root.querySelector('[data-scam-slider="angle"]');
  const magSlider = root.querySelector('[data-scam-slider="mag"]');
  const directBadge = root.querySelector('[data-scam-direct-badge]');
  const directMetric = root.querySelector('[data-scam-direct-metric]');
  const directSvg = root.querySelector('[data-scam-direct-svg]');
  const directCaption = root.querySelector('[data-scam-direct-caption]');
  const recipBadge = root.querySelector('[data-scam-recip-badge]');
  const recipMetric = root.querySelector('[data-scam-recip-metric]');
  const recipSvg = root.querySelector('[data-scam-recip-svg]');
  const recipCaption = root.querySelector('[data-scam-recip-caption]');
  const readoutEl = root.querySelector('[data-scam-readout]');
  const pailsTitle = root.querySelector('[data-scam-pails-title]');
  const pailsSub = root.querySelector('[data-scam-pails-sub]');
  const pailsGrid = root.querySelector('[data-scam-pails-grid]');

  mirrorBtn.addEventListener('click', () => {
    state.mirrorFlip = !state.mirrorFlip;
    updateUI();
  });

  tourBtn.addEventListener('click', toggleTour);

  angleSlider.addEventListener('input', () => {
    stopTour();
    state.customInjuryAngle = Number(angleSlider.value);
    updateUI();
  });

  magSlider.addEventListener('input', () => {
    state.stMagnitudeMv = Number(magSlider.value);
    updateUI();
  });

  function renderButtons() {
    const lang = getLang() === 'en' ? 'en' : 'tr';
    territoryBar.replaceChildren();
    for (const t of STEMI_TERRITORIES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `scam-territory-btn ${t.id === state.territoryId ? 'is-active' : ''}`;
      btn.dataset.scamTerritory = t.id;
      btn.setAttribute('aria-pressed', String(t.id === state.territoryId));
      btn.innerHTML = `<span class="scam-terr-tag">${t.pailsLetter}</span><span>${t.shortLabel[lang]}</span>`;
      btn.addEventListener('click', () => selectTerritory(t.id, true));
      territoryBar.append(btn);
    }

    phaseBar.replaceChildren();
    for (const p of STEMI_PHASES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `scam-phase-btn ${p.id === state.phaseId ? 'is-active' : ''}`;
      btn.dataset.scamPhase = p.id;
      btn.setAttribute('aria-pressed', String(p.id === state.phaseId));
      btn.textContent = p.name[lang];
      btn.addEventListener('click', () => {
        state.phaseId = p.id;
        updateUI();
      });
      phaseBar.append(btn);
    }

    const pailsItems = [
      {
        letter: 'P → A',
        targetId: 'posterior_mi',
        title: tr('Posterior → Anterior (V1–V3)', 'Posterior → Anterior (V1–V3)'),
        detail: tr('V7–V9 STE ↑  ⇄  V1–V3 Resiprokal STD ↓ + Uzun R', 'V7–V9 STE ↑  ⇄  V1–V3 Reciprocal STD ↓ + Tall R')
      },
      {
        letter: 'A → I',
        targetId: 'anterior_lad',
        title: tr('Anterior → İnferior (II, III, aVF)', 'Anterior → Inferior (II, III, aVF)'),
        detail: tr('V1–V4, I, aVL STE ↑  ⇄  III, aVF Resiprokal STD ↓', 'V1–V4, I, aVL STE ↑  ⇄  III, aVF Reciprocal STD ↓')
      },
      {
        letter: 'I → L',
        targetId: 'inferior_rca',
        title: tr('İnferior → Lateral (aVL, I)', 'Inferior → Lateral (aVL, I)'),
        detail: tr('III, aVF, II STE ↑  ⇄  aVL (−30°), I Resiprokal STD ↓', 'III, aVF, II STE ↑  ⇄  aVL (−30°), I Reciprocal STD ↓')
      },
      {
        letter: 'L → S/I',
        targetId: 'high_lateral',
        title: tr('Lateral → Septal / İnferior (III, aVF)', 'Lateral → Septal / Inferior (III, aVF)'),
        detail: tr('I, aVL (−30°) STE ↑  ⇄  III (+120°), aVF Resiprokal STD ↓', 'I, aVL (−30°) STE ↑  ⇄  III (+120°), aVF Reciprocal STD ↓')
      }
    ];

    pailsGrid.replaceChildren();
    for (const item of pailsItems) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `scam-pails-item ${item.targetId === state.territoryId ? 'is-active' : ''}`;
      btn.dataset.scamPails = item.targetId;
      btn.innerHTML = `
        <span class="scam-pails-badge">${item.letter}</span>
        <span class="scam-pails-text">
          <strong>${item.title}</strong>
          <small>${item.detail}</small>
        </span>
      `;
      btn.addEventListener('click', () => selectTerritory(item.targetId, true));
      pailsGrid.append(btn);
    }
  }

  function drawMonitorWave(svg, station, stProj, isReciprocalCard = false, directRefOpts = null) {
    svg.replaceChildren();
    const W = 380;
    const H = 148;
    const padX = 14;
    const padY = 12;
    const plotW = W - padX * 2;
    const plotH = H - padY * 2;
    const base = padY + plotH * 0.56;
    const gain = 68;

    svg.append(svgEl('rect', { x: padX, y: padY, width: plotW, height: plotH, rx: 8, fill: '#0b1322', stroke: '#1e293b' }));

    for (let x = padX; x <= padX + plotW; x += 14) {
      const major = (x - padX) % 70 === 0;
      svg.append(svgEl('line', {
        x1: x, y1: padY, x2: x, y2: padY + plotH,
        stroke: major ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.06)',
        'stroke-width': major ? 1 : 0.6
      }));
    }
    for (let y = padY; y <= padY + plotH; y += 14) {
      const major = (y - padY) % 70 === 0;
      svg.append(svgEl('line', {
        x1: padX, y1: y, x2: padX + plotW, y2: y,
        stroke: major ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.06)',
        'stroke-width': major ? 1 : 0.6
      }));
    }

    // Isoelectric TP baseline
    svg.append(svgEl('line', {
      x1: padX, y1: base, x2: padX + plotW, y2: base,
      stroke: 'rgba(226,232,240,0.34)', 'stroke-dasharray': '4 4', 'stroke-width': 1.1
    }));
    svg.append(svgEl('text', {
      x: padX + 6, y: base - 5, fill: '#94a3b8', 'font-size': '9.5', 'font-weight': '600'
    }, 'TP 0 mV'));

    const phase = getActivePhase();
    const stMv = stProj * state.stMagnitudeMv * phase.stFactor;
    const role = classifyStRole(stMv);
    const traceColor = role === 'ste' ? '#f87171' : role === 'std' ? '#38bdf8' : '#cbd5e1';

    const waveOpts = {
      cameraAngleDeg: station.angle,
      stProjection: stProj,
      stMagnitudeMv: state.stMagnitudeMv,
      phaseId: state.phaseId,
      invertMirror: false
    };

    const beatW = plotW * 0.46;
    for (let b = 0; b < 2; b++) {
      const xStart = padX + 10 + b * (beatW + 10);
      // Highlight J-ST area between u=0.41 and u=0.66
      const jX = xStart + 0.415 * beatW;
      const stEndX = xStart + 0.66 * beatW;
      const jMv = stemiWaveSample(0.45, waveOpts);
      const jY = base - jMv * gain;

      if (Math.abs(stMv) >= 0.05) {
        svg.append(svgEl('rect', {
          x: Math.min(jX, stEndX),
          y: Math.min(base, jY),
          width: Math.abs(stEndX - jX),
          height: Math.max(2, Math.abs(base - jY)),
          fill: stMv > 0 ? 'rgba(239,68,68,0.22)' : 'rgba(56,189,248,0.22)',
          rx: 2
        }));
      }

      const d = stemiWavePath(xStart, base, beatW, gain, waveOpts, 150);
      svg.append(svgEl('path', {
        d,
        fill: 'none',
        stroke: traceColor,
        'stroke-width': 2.5,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }));

      // J-point marker on first beat
      if (b === 0) {
        svg.append(svgEl('circle', {
          cx: jX, cy: jY, r: 4,
          fill: traceColor, stroke: '#0f172a', 'stroke-width': 1.4
        }));
        svg.append(svgEl('text', {
          x: (jX + stEndX) * 0.5 + 8,
          y: stMv >= 0 ? Math.max(22, jY - 8) : Math.min(padY + plotH - 6, jY + 14),
          'text-anchor': 'middle',
          fill: traceColor,
          'font-size': '10',
          'font-weight': '800'
        }, `J (${stMv >= 0 ? '+' : ''}${(stMv * 10).toFixed(1)} mm)`));
      }

      // If mirrorFlip is enabled on the reciprocal card, overlay the 180°-inverted mirror curve!
      if (isReciprocalCard && state.mirrorFlip) {
        const mirrorD = stemiWavePath(xStart, base, beatW, gain, { ...waveOpts, invertMirror: true }, 150);
        svg.append(svgEl('path', {
          d: mirrorD,
          fill: 'none',
          stroke: '#fbbf24',
          'stroke-width': 1.9,
          'stroke-dasharray': '5 3',
          opacity: 0.92
        }));
      }
    }

    if (isReciprocalCard && state.mirrorFlip) {
      svg.append(svgEl('text', {
        x: padX + plotW - 8,
        y: padY + 15,
        'text-anchor': 'end',
        fill: '#fbbf24',
        'font-size': '10',
        'font-weight': '700'
      }, tr(' Kesikli sarı: 180° ters çevrilmiş ayna eğrisi (STE ile çakışır)', ' Dashed gold: 180° inverted mirror trace (matches STE)')));
    }
  }

  function drawStageSvg() {
    stageSvg.replaceChildren();
    const territory = getActiveTerritory();
    const phase = getActivePhase();
    const injAngle = getEffectiveInjuryAngle();
    const injRad = (injAngle * Math.PI) / 180;

    const cx = 310;
    const cy = 262;
    const orbitR = 172;

    const defs = svgEl('defs');
    const bgGrad = svgEl('radialGradient', { id: 'scam-bg-grad', cx: '50%', cy: '50%', r: '55%' });
    bgGrad.append(
      svgEl('stop', { offset: '0%', 'stop-color': '#1e293b', 'stop-opacity': '0.95' }),
      svgEl('stop', { offset: '100%', 'stop-color': '#090f1d', 'stop-opacity': '1' })
    );
    const infGlow = svgEl('radialGradient', { id: 'scam-inf-glow', cx: '50%', cy: '50%', r: '50%' });
    infGlow.append(
      svgEl('stop', { offset: '0%', 'stop-color': '#ef4444', 'stop-opacity': '0.85' }),
      svgEl('stop', { offset: '100%', 'stop-color': '#ef4444', 'stop-opacity': '0.0' })
    );
    defs.append(bgGrad, infGlow);
    stageSvg.append(defs);

    stageSvg.append(svgEl('rect', { x: 0, y: 0, width: 620, height: 520, rx: 16, fill: 'url(#scam-bg-grad)' }));

    // Draw Positive (STE) Hemisphere Arc vs Negative (Reciprocal STD) Hemisphere Arc
    const arcPath = (startAngleDeg, endAngleDeg, r) => {
      const a0 = (startAngleDeg * Math.PI) / 180;
      const a1 = (endAngleDeg * Math.PI) / 180;
      const x0 = cx + r * Math.cos(a0);
      const y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    };

    // STE hemisphere (-90° to +90° around injuryAngle)
    stageSvg.append(svgEl('path', {
      d: arcPath(injAngle - 86, injAngle + 86, orbitR),
      fill: 'none',
      stroke: 'rgba(239,68,68,0.34)',
      'stroke-width': 12,
      'stroke-linecap': 'round'
    }));
    // Reciprocal STD hemisphere (+94° to +266° around injuryAngle)
    stageSvg.append(svgEl('path', {
      d: arcPath(injAngle + 94, injAngle + 266, orbitR),
      fill: 'none',
      stroke: 'rgba(56,189,248,0.30)',
      'stroke-width': 12,
      'stroke-linecap': 'round'
    }));

    // Zero-potential dividing line perpendicular to injuryAngle
    const perpRad = injRad + Math.PI / 2;
    stageSvg.append(svgEl('line', {
      x1: cx - orbitR * Math.cos(perpRad),
      y1: cy - orbitR * Math.sin(perpRad),
      x2: cx + orbitR * Math.cos(perpRad),
      y2: cy + orbitR * Math.sin(perpRad),
      stroke: 'rgba(148,163,184,0.28)',
      'stroke-dasharray': '5 5',
      'stroke-width': 1.2
    }));

    // Orbit ring
    stageSvg.append(svgEl('circle', {
      cx, cy, r: orbitR,
      fill: 'none', stroke: 'rgba(148,163,184,0.24)', 'stroke-width': 1.4
    }));

    // Selected camera viewing cone
    const selectedStation = STEMI_CAMERA_STATIONS.find(s => s.id === state.selectedLead) || STEMI_CAMERA_STATIONS[0];
    const camRad = ((selectedStation.orbitAngle ?? selectedStation.angle) * Math.PI) / 180;
    const camX = cx + orbitR * Math.cos(camRad);
    const camY = cy + orbitR * Math.sin(camRad);
    const spread = 0.34;
    const c1x = cx + 66 * Math.cos(camRad - spread);
    const c1y = cy + 66 * Math.sin(camRad - spread);
    const c2x = cx + 66 * Math.cos(camRad + spread);
    const c2y = cy + 66 * Math.sin(camRad + spread);
    stageSvg.append(svgEl('polygon', {
      points: `${camX.toFixed(1)},${camY.toFixed(1)} ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)}`,
      fill: selectedStation.color,
      opacity: '0.14'
    }));

    // Anatomical Heart Illustration at Center
    const heartG = svgEl('g', { class: 'scam-heart-group' });
    // Great vessels
    heartG.append(
      svgEl('path', {
        d: 'M 292 184 C 290 148, 322 142, 330 174 L 326 198 Z',
        fill: '#b91c1c', stroke: '#7f1d1d', 'stroke-width': 1.5
      }),
      svgEl('path', {
        d: 'M 268 192 C 266 158, 286 156, 292 186 Z',
        fill: '#2563eb', stroke: '#1e3a8a', 'stroke-width': 1.5
      }),
      // Right atrium
      svgEl('path', {
        d: 'M 268 195 C 236 198, 228 235, 250 256 L 278 245 Z',
        fill: '#3b82f6', 'fill-opacity': '0.78', stroke: '#1d4ed8', 'stroke-width': 1.5
      }),
      // Left atrium
      svgEl('path', {
        d: 'M 326 190 C 355 190, 364 220, 344 240 L 316 232 Z',
        fill: '#ef4444', 'fill-opacity': '0.80', stroke: '#991b1b', 'stroke-width': 1.5
      }),
      // Ventricular body
      svgEl('path', {
        d: 'M 250 246 C 234 282, 260 322, 304 328 C 344 333, 370 296, 362 254 C 354 225, 334 214, 306 216 C 280 218, 260 230, 250 246 Z',
        fill: '#dc2626', stroke: '#7f1d1d', 'stroke-width': 2
      }),
      // RV anterior overlay
      svgEl('path', {
        d: 'M 254 246 C 246 278, 266 312, 304 322 C 306 286, 298 252, 286 226 Z',
        fill: '#b91c1c', 'fill-opacity': '0.74'
      })
    );

    // Highlighted Infarct Wall Zone + Pulsing Glow
    heartG.append(
      svgEl('circle', {
        cx: territory.infarctCenter.x,
        cy: territory.infarctCenter.y,
        r: 36,
        fill: 'url(#scam-inf-glow)'
      }),
      svgEl('path', {
        d: territory.infarctPatch,
        fill: '#450a0a',
        'fill-opacity': '0.82',
        stroke: '#fbbf24',
        'stroke-width': 2.2,
        'stroke-dasharray': '4 2'
      })
    );

    // Coronary arteries schematic (RCA, LAD, LCx)
    const vessels = {
      rca: 'M 284 205 C 254 220, 240 256, 262 298 C 276 314, 298 320, 314 316',
      lad: 'M 308 200 C 302 228, 308 266, 326 312',
      d1: 'M 306 222 C 328 220, 346 232, 358 252',
      lcx: 'M 310 198 C 338 205, 356 228, 354 268',
      pda: 'M 284 198 C 276 212, 278 232, 288 250'
    };
    for (const [vid, d] of Object.entries(vessels)) {
      const isCulprit = vid === territory.occludedVessel;
      heartG.append(svgEl('path', {
        d,
        fill: 'none',
        stroke: isCulprit ? '#fbbf24' : 'rgba(254,202,202,0.45)',
        'stroke-width': isCulprit ? 3.2 : 1.6,
        'stroke-linecap': 'round'
      }));
    }

    // Thrombus / occlusion marker on culprit vessel
    heartG.append(
      svgEl('circle', {
        cx: territory.occlusionPoint.x,
        cy: territory.occlusionPoint.y,
        r: 6.5,
        fill: '#ef4444',
        stroke: '#fef08a',
        'stroke-width': 2
      }),
      svgEl('text', {
        x: territory.occlusionPoint.x,
        y: territory.occlusionPoint.y + 3,
        'text-anchor': 'middle',
        fill: '#ffffff',
        'font-size': '8.5',
        'font-weight': '900'
      }, '✕')
    );

    stageSvg.append(heartG);

    // Draw ST Injury Vector Arrow (pointing from heart center toward injuryAngle)
    const vecLen = 96;
    const vx = cx + vecLen * Math.cos(injRad);
    const vy = cy + vecLen * Math.sin(injRad);
    const headSize = 11;
    const h1x = vx - headSize * Math.cos(injRad - 0.45);
    const h1y = vy - headSize * Math.sin(injRad - 0.45);
    const h2x = vx - headSize * Math.cos(injRad + 0.45);
    const h2y = vy - headSize * Math.sin(injRad + 0.45);

    stageSvg.append(
      svgEl('line', {
        x1: cx, y1: cy, x2: vx, y2: vy,
        stroke: '#fbbf24', 'stroke-width': 4, 'stroke-linecap': 'round'
      }),
      svgEl('polygon', {
        points: `${vx.toFixed(1)},${vy.toFixed(1)} ${h1x.toFixed(1)},${h1y.toFixed(1)} ${h2x.toFixed(1)},${h2y.toFixed(1)}`,
        fill: '#fbbf24'
      }),
      svgEl('text', {
        x: cx + (vecLen + 22) * Math.cos(injRad),
        y: cy + (vecLen + 22) * Math.sin(injRad) + 4,
        'text-anchor': 'middle',
        fill: '#fef08a',
        'font-size': '10.5',
        'font-weight': '800'
      }, `V_ST (${injAngle >= 0 ? '+' : ''}${injAngle}°)`)
    );

    // Opposite (Reciprocal) Vector Tail dashed line
    const rx = cx - (vecLen * 0.82) * Math.cos(injRad);
    const ry = cy - (vecLen * 0.82) * Math.sin(injRad);
    stageSvg.append(
      svgEl('line', {
        x1: cx, y1: cy, x2: rx, y2: ry,
        stroke: '#38bdf8', 'stroke-width': 2.4, 'stroke-dasharray': '5 4'
      })
    );

    // Render all 8 Camera Stations around the heart
    for (const st of STEMI_CAMERA_STATIONS) {
      const rad = ((st.orbitAngle ?? st.angle) * Math.PI) / 180;
      const sx = cx + orbitR * Math.cos(rad);
      const sy = cy + orbitR * Math.sin(rad);
      const proj = stemiProjectionForCamera(territory.id, st.id, state.customInjuryAngle);
      const stMv = proj * state.stMagnitudeMv * phase.stFactor;
      const role = classifyStRole(stMv);
      const isSelected = st.id === state.selectedLead;
      const isRecipTarget = st.id === territory.reciprocalLead && state.customInjuryAngle === null;

      const g = svgEl('g', {
        class: `scam-station ${isSelected ? 'is-selected' : ''} role-${role}`,
        role: 'button',
        tabindex: '0',
        'data-scam-station': st.id,
        'aria-label': `${st.label} (${stMv >= 0 ? '+' : ''}${(stMv * 10).toFixed(1)} mm)`,
        'aria-pressed': String(isSelected)
      });

      const ringStroke = role === 'ste' ? '#ef4444' : role === 'std' ? '#38bdf8' : '#64748b';
      const fillBg = isSelected ? st.color : '#0f172a';

      // Outer halo for STE or Reciprocal STD
      if (isSelected || isRecipTarget || role !== 'iso') {
        g.append(svgEl('circle', {
          cx: sx, cy: sy, r: isSelected ? 27 : 22,
          fill: role === 'ste' ? 'rgba(239,68,68,0.16)' : role === 'std' ? 'rgba(56,189,248,0.16)' : 'transparent',
          stroke: isSelected ? '#ffffff' : ringStroke,
          'stroke-width': isSelected ? 2.4 : 1.4,
          'stroke-dasharray': role === 'std' && !isSelected ? '3 2' : null
        }));
      }

      g.append(svgEl('circle', {
        cx: sx, cy: sy, r: 17,
        fill: fillBg,
        stroke: st.color,
        'stroke-width': 2.2
      }));

      g.append(svgEl('text', {
        x: sx, y: sy + 4,
        'text-anchor': 'middle',
        fill: isSelected ? '#090f1d' : '#f8fafc',
        'font-size': st.label.length > 3 ? '9.5' : '11',
        'font-weight': '800'
      }, st.label));

      // Mini ST badge + mini waveform card outside the orbit
      const cardDist = orbitR + 54;
      const bx = clamp(cx + cardDist * Math.cos(rad), 52, 568);
      const by = clamp(cy + cardDist * Math.sin(rad), 34, 486);

      const badgeG = svgEl('g', { transform: `translate(${(bx - 38).toFixed(1)}, ${(by - 20).toFixed(1)})` });
      badgeG.append(svgEl('rect', {
        x: 0, y: 0, width: 76, height: 40, rx: 7,
        fill: 'rgba(15, 23, 42, 0.92)',
        stroke: isSelected ? '#ffffff' : ringStroke,
        'stroke-width': isSelected ? 1.8 : 1.1
      }));

      const miniPath = stemiWavePath(5, 22, 66, 20, {
        cameraAngleDeg: st.angle,
        stProjection: proj,
        stMagnitudeMv: state.stMagnitudeMv,
        phaseId: state.phaseId
      }, 48);

      badgeG.append(svgEl('path', {
        d: miniPath,
        fill: 'none',
        stroke: role === 'ste' ? '#f87171' : role === 'std' ? '#38bdf8' : '#cbd5e1',
        'stroke-width': 1.7
      }));

      const mmText = `${stMv >= 0 ? '+' : ''}${(stMv * 10).toFixed(1)}mm ${role === 'ste' ? '↑' : role === 'std' ? '↓' : ''}`;
      badgeG.append(svgEl('text', {
        x: 38, y: 36,
        'text-anchor': 'middle',
        fill: role === 'ste' ? '#fca5a5' : role === 'std' ? '#7dd3fc' : '#94a3b8',
        'font-size': '8.5',
        'font-weight': '700'
      }, mmText.trim()));

      g.append(badgeG);

      const pickStation = () => {
        stopTour();
        state.selectedLead = st.id;
        updateUI();
      };
      g.addEventListener('click', pickStation);
      g.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pickStation();
        }
      });

      stageSvg.append(g);
    }

    // Top legend inside stage SVG
    stageSvg.append(
      svgEl('text', { x: 18, y: 24, fill: '#fca5a5', 'font-size': '11', 'font-weight': '700' },
        tr('● Kırmızı Yarı-Küre: Enfarktüse Doğrudan Bakış (STE ↑)', '● Red Hemisphere: Direct View of Infarct (STE ↑)')),
      svgEl('text', { x: 18, y: 42, fill: '#7dd3fc', 'font-size': '11', 'font-weight': '700' },
        tr('● Mavi Yarı-Küre: Karşıt Bakış / Resiprokal Ayna (STD ↓)', '● Blue Hemisphere: Opposite View / Reciprocal Mirror (STD ↓)'))
    );
  }

  function updateUI() {
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const territory = getActiveTerritory();
    const phase = getActivePhase();
    const injAngle = getEffectiveInjuryAngle();

    kickerEl.textContent = tr(
      'STEMI LOKALİZASYONU · HASAR VEKTÖRÜ VE RESİPROKAL AYNA KAMERALARI',
      'STEMI LOCALIZATION · INJURY VECTOR & RECIPROCAL MIRROR CAMERAS'
    );
    titleEl.textContent = tr(
      'STEMI ve Resiprok Değişimler: Kameralar Enfarktüsü Nasıl Görür?',
      'STEMI & Reciprocal Changes: How Do Leads View the Infarct?'
    );
    subtitleEl.textContent = tr(
      'Tam kat (transmural) iskemi/enfarktüste ST hasar vektörü (V_ST) hasarlı duvara doğru yönelir. Enfarktüs duvarına bakan (+) kameralar ST elevasyonu (STE ↑), karşı duvardan (~180°) bakan kameralar ise resiprokal ST depresyonu (STD ↓, ayna görüntüsü) kaydeder.',
      'In transmural ischemia/infarction, the ST injury vector (V_ST) points toward the injured wall. Cameras facing the infarct record ST elevation (STE ↑), while cameras on the opposite wall (~180° away) record reciprocal ST depression (STD ↓, mirror image).'
    );

    mirrorBtn.textContent = state.mirrorFlip
      ? tr('🪞 Ayna Testi Açık (180° Ters Eğri Gösteriliyor)', '🪞 Mirror Test Active (180° Inverted Trace Shown)')
      : tr('🪞 Ayna Testi: Resiprokal Eğriyi 180° Çevir', '🪞 Mirror Test: Flip Reciprocal Trace 180°');
    mirrorBtn.classList.toggle('is-active', state.mirrorFlip);
    mirrorBtn.setAttribute('aria-pressed', String(state.mirrorFlip));

    tourBtn.textContent = state.tourPlaying
      ? tr('⏸ Kamera Turunu Durdur', '⏸ Pause Camera Tour')
      : tr('▶ 8 Kamerayı Sırayla Dolaş', '▶ Tour All 8 Cameras');
    tourBtn.classList.toggle('is-active', state.tourPlaying);
    tourBtn.setAttribute('aria-pressed', String(state.tourPlaying));

    vecLabel.textContent = tr('ST Hasar Vektörü Açısı (V_ST):', 'ST Injury Vector Angle (V_ST):');
    vecOut.textContent = `${injAngle >= 0 ? '+' : ''}${injAngle}°`;
    angleSlider.value = String(injAngle);

    magLabel.textContent = tr('Hasar Akımı Şiddeti (ST Kayması):', 'Injury Current Magnitude (ST Shift):');
    magOut.textContent = `${(state.stMagnitudeMv * 10).toFixed(1)} mm (${state.stMagnitudeMv.toFixed(2)} mV)`;
    magSlider.value = String(state.stMagnitudeMv);

    pailsTitle.textContent = tr('PAILS Resiprokal Kuralı (Hızlı Seçim)', 'PAILS Reciprocal Mnemonic (Quick Select)');
    pailsSub.textContent = tr('Bir bölgeye tıklayarak doğrudan STE ve resiprokal STD kameralarını karşılaştırın:', 'Click a region to compare direct STE and reciprocal STD cameras:');

    renderButtons();
    drawStageSvg();

    // Update Direct & Reciprocal Monitors
    const selectedStation = STEMI_CAMERA_STATIONS.find(s => s.id === state.selectedLead) || STEMI_CAMERA_STATIONS[0];
    const selectedProj = stemiProjectionForCamera(territory.id, selectedStation.id, state.customInjuryAngle);
    const selectedStMv = selectedProj * state.stMagnitudeMv * phase.stFactor;

    // Choose opposite partner camera: if selected is already the reciprocal lead, pair with primaryLead; otherwise pair with reciprocalLead (or most opposite station if custom angle)
    let partnerStation = STEMI_CAMERA_STATIONS.find(s => s.id === territory.reciprocalLead) || STEMI_CAMERA_STATIONS[1];
    if (state.customInjuryAngle !== null) {
      const oppAngle = normDeg(selectedStation.angle + 180);
      partnerStation = STEMI_CAMERA_STATIONS.reduce((best, s) =>
        degDiff(s.angle, oppAngle) < degDiff(best.angle, oppAngle) ? s : best,
      STEMI_CAMERA_STATIONS[0]);
    } else if (selectedStation.id === territory.reciprocalLead) {
      partnerStation = STEMI_CAMERA_STATIONS.find(s => s.id === territory.primaryLead) || STEMI_CAMERA_STATIONS[0];
    }

    const partnerProj = stemiProjectionForCamera(territory.id, partnerStation.id, state.customInjuryAngle);
    const partnerStMv = partnerProj * state.stMagnitudeMv * phase.stFactor;

    directBadge.textContent = `📷 ${selectedStation.label} · ${selectedStation.posName[lang]}`;
    directMetric.textContent = `ST: ${selectedStMv >= 0 ? '+' : ''}${(selectedStMv * 10).toFixed(1)} mm (${selectedStMv >= 0 ? '+' : ''}${selectedStMv.toFixed(2)} mV)`;
    directCaption.textContent = `${selectedStation.wallView[lang]} · cos Δθ = ${selectedProj >= 0 ? '+' : ''}${selectedProj.toFixed(2)}`;
    drawMonitorWave(directSvg, selectedStation, selectedProj, false);

    recipBadge.textContent = `🪞 ${partnerStation.label} · ${partnerStation.posName[lang]}`;
    recipMetric.textContent = `ST: ${partnerStMv >= 0 ? '+' : ''}${(partnerStMv * 10).toFixed(1)} mm (${partnerStMv >= 0 ? '+' : ''}${partnerStMv.toFixed(2)} mV)`;
    recipCaption.textContent = `${tr('Karşıt / Resiprokal Kamera', 'Opposite / Reciprocal Camera')} · cos Δθ = ${partnerProj >= 0 ? '+' : ''}${partnerProj.toFixed(2)}`;
    drawMonitorWave(recipSvg, partnerStation, partnerProj, true);

    // Clinical readout card
    const directList = territory.directLeads.map(id => {
      const s = STEMI_CAMERA_STATIONS.find(x => x.id === id);
      return s ? s.label : id;
    }).join(', ');
    const recipList = territory.reciprocalLeads.map(id => {
      const s = STEMI_CAMERA_STATIONS.find(x => x.id === id);
      return s ? s.label : id;
    }).join(', ');

    readoutEl.innerHTML = `
      <div class="scam-readout-top">
        <div>
          <span class="scam-readout-tag">${territory.culprit[lang]}</span>
          <h4>${territory.title[lang]}</h4>
        </div>
        <span class="scam-phase-pill">${phase.name[lang]}</span>
      </div>
      <div class="scam-lead-pills-row">
        <div class="scam-pill-box scam-pill-ste">
          <span>${tr('Doğrudan ST Elevasyonu (STE ↑):', 'Direct ST Elevation (STE ↑):')}</span>
          <strong>${directList}</strong>
        </div>
        <div class="scam-pill-box scam-pill-std">
          <span>${tr('Resiprokal ST Depresyonu (STD ↓):', 'Reciprocal ST Depression (STD ↓):')}</span>
          <strong>${recipList}</strong>
        </div>
      </div>
      <p class="scam-rule-text"><strong>${tr('Klinik Kural:', 'Clinical Rule:')}</strong> ${territory.clinicalRule[lang]}</p>
      <p class="scam-why-text"><strong>${tr('Neden Resiprokal Çökme Olur?', 'Why Reciprocal Depression Occurs:')}</strong> ${territory.reciprocalWhy[lang]}</p>
      <p class="scam-phase-text"><strong>${tr('Evre Özelliği:', 'Phase Feature:')}</strong> ${phase.desc[lang]}</p>
    `;
  }

  updateUI();

  return {
    selectTerritory(id) {
      selectTerritory(id, false);
    },
    sync() {
      updateUI();
    },
    destroy() {
      stopTour();
      root.remove();
    }
  };
}

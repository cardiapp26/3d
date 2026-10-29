// Interactive Clinical ECG Simulator & Unlocked ECGLens Premium Suite
// Combines ECGSweep live-tracing calibrated monitor + ECGLens 3D-Heart Conduction Scrubber,
// 38-Condition & Pharmacology Library, and Premium Lead-Selection & Missed/Flagged Study Hub.

export const CONDUCTION_STAGES = [
  { id: 'sa', startMs: 0, endMs: 35, color: '#fbbf24', wave: 'P Başlangıcı', tr: 'SA Düğümü', en: 'SA Node', vel: '0.05 m/s', descTr: 'Sağ atriyum üst-arka duvarında (SVC-RA bileşkesi) spontan faz-4 depolarizasyon ile uyarının doğuşu.', descEn: 'Spontaneous phase-4 pacemaker depolarization at the superior posterolateral RA (SVC-RA junction).' },
  { id: 'atria', startMs: 35, endMs: 115, color: '#f59e0b', wave: 'P Dalgası', tr: 'Atriyal Yayılım', en: 'Atrial Spread', vel: '~1.0 m/s', descTr: 'İnternodal yollar ve Bachmann demeti ile sağ ve sol atriyumun depolarizasyonu (P dalgası; vektör +60°).', descEn: 'Right and left atrial activation via internodal tracts and Bachmann bundle, inscribing the P wave (+60°).' },
  { id: 'avn', startMs: 115, endMs: 205, color: '#fb7185', wave: 'PR Segmenti', tr: 'AV Düğüm', en: 'AV Node', vel: '~0.05 m/s', descTr: 'Koch üçgeninde ~90 ms fizyolojik iletim gecikmesi (izoelektrik PR segmenti); ventrikül doluşuna zaman tanır.', descEn: 'Physiological ~90 ms delay in the triangle of Koch (isoelectric PR segment), optimizing ventricular filling.' },
  { id: 'his', startMs: 205, endMs: 225, color: '#a78bfa', wave: 'QRS Başlangıcı', tr: 'His Demeti', en: 'Bundle of His', vel: '1.5–2 m/s', descTr: 'Fibröz iskeleti (santral fibröz cisim) delerek ventriküler septuma geçen tek elektriksel köprü.', descEn: 'Penetrates the central fibrous body as the sole normal electrical bridge from atria to ventricles.' },
  { id: 'branches', startMs: 225, endMs: 255, color: '#818cf8', wave: 'Septal q / r', tr: 'Dal & Fasiküller', en: 'Bundle Branches', vel: '2–3 m/s', descTr: 'Sol dal septumu soldan sağa uyarır (V1’de r, V6’da septal q), ardından sağ ve sol dallar apikale iner.', descEn: 'Left-to-right septal activation (r in V1, q in V6) followed by rapid descent along RBB, LAF, and LPF.' },
  { id: 'purkinje', startMs: 255, endMs: 320, color: '#34d399', wave: 'QRS Kompleksi', tr: 'Purkinje & Miyokard', en: 'Purkinje & Myocardium', vel: '3–4 m/s', descTr: 'Subendokardiyal Purkinje ağından epikarda doğru biventriküler depolarizasyon (ana QRS kompleksi).', descEn: 'Rapid subendocardial Purkinje spread followed by endo-to-epicardial ventricular activation (main QRS).' },
  { id: 'repol', startMs: 320, endMs: 860, color: '#38bdf8', wave: 'ST Segmenti & T', tr: 'Repolarizasyon', en: 'Repolarization', vel: 'Faz 2–3', descTr: 'Epikarddan endokarda doğru ventriküler repolarizasyon (T dalgası QRS ile konkordandır) ve diyastolik dinlenme.', descEn: 'Epicardial-to-endocardial ventricular recovery inscribing the T wave and returning to phase-4 baseline.' }
];

const STAGE_BY_ID = Object.fromEntries(CONDUCTION_STAGES.map(stg => [stg.id, stg]));

/**
 * Conduction timeline of one beat in beat phase, on the same positions as the
 * synthesized trace (sampleConditionLeadMv: P around 0.16, QRS at 0.30, T near
 * 0.48). Rhythms without an organized sinus P (AF, flutter, AVNRT, VT, complete
 * block) have no SA-node or atrial-spread stage; VF and torsades have none.
 */
export function conductionTimeline(cond) {
  const m = cond.morph || {};
  const prShift = ((m.prMs || cond.pr || 160) - 160) / 1000;
  const pCenter = Math.max(0.08, 0.16 - prShift * 0.45);
  const halfQrs = Math.max(0.04, (0.04 * (cond.qrs || 90)) / 90);
  const qOn = 0.30 - halfQrs, qOff = 0.30 + halfQrs;
  const tEnd = Math.min(0.78, Math.max(0.5, 0.30 + (0.28 * (cond.qt || 400)) / 400));
  const atrial = m.afib ? 'fibrillation' : m.flutter ? 'flutter' : (m.chb || m.avnrt || m.vt) ? 'none' : 'sinus';
  return { pOn: pCenter - 0.05, pOff: pCenter + 0.05, hisOn: qOn - 0.012, qOn, qOff, tEnd, atrial, chaotic: Boolean(m.vfib || m.torsades), dropped: b => (m.mobitz1 && b % 4 === 3) || (m.mobitz2 && b % 3 === 2) };
}

/** Stage (CONDUCTION_STAGES id, or 'fibrillation' / 'flutter' for disorganized atria) and scrubber ms at a beat phase. */
export function conductionAt(tl, phase, beatIdx = 0) {
  if (tl.chaotic) return { id: null, ms: null };
  const lin = (a, b, m0, m1) => m0 + ((phase - a) / Math.max(1e-6, b - a)) * (m1 - m0);
  const ventricular = !tl.dropped(beatIdx);
  if (ventricular && phase >= tl.hisOn && phase < tl.qOn) return { id: 'his', ms: lin(tl.hisOn, tl.qOn, 205, 225) };
  if (ventricular && phase >= tl.qOn && phase < tl.qOn + 0.3 * (tl.qOff - tl.qOn)) return { id: 'branches', ms: lin(tl.qOn, tl.qOn + 0.3 * (tl.qOff - tl.qOn), 225, 255) };
  if (ventricular && phase >= tl.qOn && phase < tl.qOff) return { id: 'purkinje', ms: lin(tl.qOn + 0.3 * (tl.qOff - tl.qOn), tl.qOff, 255, 320) };
  if (ventricular && phase >= tl.qOff && phase < tl.tEnd) return { id: 'repol', ms: lin(tl.qOff, tl.tEnd, 320, 860) };
  if (tl.atrial === 'sinus') {
    if (phase >= tl.pOn && phase < tl.pOn + 0.012) return { id: 'sa', ms: lin(tl.pOn, tl.pOn + 0.012, 0, 35) };
    if (phase >= tl.pOn + 0.012 && phase < tl.pOff) return { id: 'atria', ms: lin(tl.pOn + 0.012, tl.pOff, 35, 115) };
    if (phase >= tl.pOff && phase < tl.hisOn) return { id: 'avn', ms: lin(tl.pOff, tl.hisOn, 115, 205) };
    return { id: null, ms: null };
  }
  if (tl.atrial === 'fibrillation' || tl.atrial === 'flutter') return { id: tl.atrial, ms: null };
  return { id: null, ms: null };
}

// Simulator views (one tab row).
const SIM_MODES = Object.freeze([
  { id: 'simulator', tr: 'Canlı monitör', en: 'Live monitor' },
  { id: '12lead', tr: '12 derivasyon', en: '12-lead' },
  { id: 'skillstat', tr: '6 sn ritim', en: '6-second rhythm' },
  { id: 'compass', tr: 'Adım adım okuma', en: 'Step-by-step reading' },
  { id: 'study', tr: 'Alıştırma', en: 'Practice' }
]);

export const CLINICAL_CATEGORIES = [
  { id: 'ischemia', tr: 'İskemi & STEMI Eşdeğerleri', en: 'Ischemia & STEMI Equivalents' },
  { id: 'arrhythmia', tr: 'Aritmiler', en: 'Arrhythmias' },
  { id: 'conduction', tr: 'İletim & Dal Blokları', en: 'Conduction & Blocks' },
  { id: 'channelopathy', tr: 'Kanalopati & Genetik', en: 'Channelopathies & Genetic' },
  { id: 'structural', tr: 'Perikardiyal & Yapısal', en: 'Pericardial & Structural' },
  { id: 'pharmacology', tr: 'Farmakoloji & Elektrolit', en: 'Pharmacology & Electrolytes' }
];

export const CLINICAL_CONDITIONS = [
  // 1. ISCHEMIA & MI
  {
    id: 'anterior_stemi', cat: 'ischemia', color: '#ef4444',
    tr: 'Anterior STEMI (LAD Oklüzyonu)', en: 'Anterior STEMI (LAD Occlusion)',
    hr: 88, pr: 160, qrs: 96, qt: 380, axis: 45, culprit: 'LAD',
    affectedLeads: ['V1', 'V2', 'V3', 'V4'], reciprocalLeads: ['II', 'III', 'aVF'],
    morph: { stV1V4: 0.32, stInf: -0.14, hyperT: true, qAnt: true },
    pearlTr: 'V1–V4’te konveks (mezartaşı) ST elevasyonu, hiperakut T dalgaları ve II, III, aVF’de resiprokal ST çökmesi. Proksimal LAD tıkanıklığında aVR/V1 STE ve I/aVL katılımı görülür.',
    pearlEn: 'Convex ST elevation in V1–V4 with hyperacute T waves and reciprocal ST depression in II, III, aVF from acute LAD occlusion.'
  },
  {
    id: 'de_winter', cat: 'ischemia', color: '#f97316',
    tr: 'de Winter T-Dalgası Paterni (STEMI Eşdeğeri)', en: 'de Winter T-Wave Pattern (STEMI Equivalent)',
    hr: 84, pr: 156, qrs: 92, qt: 375, axis: 50, culprit: 'LAD',
    affectedLeads: ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'aVR'], reciprocalLeads: ['II', 'III', 'aVF'],
    morph: { deWinter: true, stV1V4: -0.18, tallT: 0.55, stAvr: 0.12 },
    pearlTr: 'Proksimal LAD suboklüzyonu! V1–V6’da J noktasında 1–3 mm yukarı eğimli (upsloping) ST çökmesi + uzun, simetrik, sivri devasa T dalgaları + aVR’de hafif ST elevasyonu. Acil kateterizasyon gerektirir!',
    pearlEn: 'Acute proximal LAD occlusion equivalent: upsloping J-point ST depression (1–3 mm) in V1–V6 transitioning into tall, symmetric hyperacute T waves with mild aVR STE.'
  },
  {
    id: 'wellens', cat: 'ischemia', color: '#eab308',
    tr: 'Wellens Sendromu (Tip A Bifazik / Tip B Derin T)', en: 'Wellens Syndrome (Critical Proximal LAD)',
    hr: 70, pr: 162, qrs: 88, qt: 410, axis: 52, culprit: 'LAD',
    affectedLeads: ['V2', 'V3', 'V4'], reciprocalLeads: [],
    morph: { wellens: true, invertTV2V4: true },
    pearlTr: 'Göğüs ağrısı geçtikten sonra V2–V3’te (V4’e uzanan) bifazik (Tip A) veya derin simetrik negatif (Tip B) T dalgaları. R progresyonu korunmuştur ve patolojik Q yoktur. Efor testi KONTRENDİKEDİR (masif anterior MI riski)!',
    pearlEn: 'Biphasic (Type A) or deep symmetric inverted (Type B) T waves in V2–V4 during a pain-free state with preserved R waves. Critical proximal LAD stenosis—stress testing is contraindicated!'
  },
  {
    id: 'inferior_stemi', cat: 'ischemia', color: '#ef4444',
    tr: 'İnferior STEMI (RCA Oklüzyonu)', en: 'Inferior STEMI (RCA Occlusion)',
    hr: 62, pr: 188, qrs: 92, qt: 400, axis: 78, culprit: 'RCA',
    affectedLeads: ['II', 'III', 'aVF'], reciprocalLeads: ['I', 'aVL'],
    morph: { stInf: 0.30, stLat: -0.18 },
    pearlTr: 'II, III ve aVF’de ST elevasyonu + I ve aVL’de zorunlu resiprokal ST çökmesi. Derivasyon III’teki STE > Derivasyon II olması ve I’de derin resiprokal STD sağ koroner arter (RCA) tıkanıklığını gösterir (V4R çekilmelidir!).',
    pearlEn: 'ST elevation in II, III, aVF with reciprocal ST depression in I and aVL. STE in III > II strongly favors RCA culprit over LCx (always check V4R for RV infarction).'
  },
  {
    id: 'lateral_stemi', cat: 'ischemia', color: '#f97316',
    tr: 'Yüksek Lateral / Sirkumfleks STEMI (LCx)', en: 'Lateral STEMI (LCx / Diagonal Occlusion)',
    hr: 80, pr: 158, qrs: 90, qt: 380, axis: -15, culprit: 'LCx',
    affectedLeads: ['I', 'aVL', 'V5', 'V6'], reciprocalLeads: ['III', 'aVF'],
    morph: { stLat: 0.25, stInf: -0.15 },
    pearlTr: 'I, aVL, V5 ve V6’da ST elevasyonu; III ve aVF’de resiprokal ST çökmesi (Güney Afrika Bayrağı işareti: I, aVL, V2 STE + III STD → Birinci Diyagonal dal tıkanıklığı).',
    pearlEn: 'ST elevation in lateral leads (I, aVL, V5, V6) with reciprocal inferior ST depression in III and aVF.'
  },
  {
    id: 'posterior_mi', cat: 'ischemia', color: '#ec4899',
    tr: 'İzole Posterior MI (V1–V3 Ayna Görüntüsü)', en: 'Posterior MI (V1–V3 Mirror Image / V7–V9 STE)',
    hr: 76, pr: 164, qrs: 94, qt: 390, axis: 55, culprit: 'LCx',
    affectedLeads: ['V1', 'V2', 'V3'], reciprocalLeads: [],
    morph: { postMi: true, stV1V4: -0.24, tallRV1V2: true },
    pearlTr: 'V1–V3’te horizontal ST çökmesi + yüksek ve geniş R dalgası (R/S > 1, patolojik Q’nun ayna görüntüsü) + pozitif dik T dalgası. Doğrulama için V7–V9 posterior derivasyonlarda ≥0.5 mm STE aranır.',
    pearlEn: 'Horizontal ST depression in V1–V3 accompanied by tall broad R waves (R/S > 1) and upright precordial T waves. Confirm with ≥0.5 mm STE in posterior leads V7–V9.'
  },
  {
    id: 'sgarbossa_lbbb', cat: 'ischemia', color: '#dc2626',
    tr: 'Sgarbossa & Smith-Modifiye LBBB + STEMI', en: 'Sgarbossa / Smith-Modified LBBB + Acute MI',
    hr: 86, pr: 170, qrs: 148, qt: 430, axis: -25, culprit: 'LAD',
    affectedLeads: ['V1', 'V2', 'V3', 'V5', 'V6'], reciprocalLeads: [],
    morph: { lbbb: true, sgarbossa: true, stV1V4: 0.35 },
    pearlTr: 'LBBB varlığında akut oklüzyon tanı kriterleri: (1) QRS ile aynı yönde (konkordan) ≥1 mm STE (5 puan), (2) V1–V3’te konkordan ≥1 mm STD (3 puan), (3) Smith-Modifiye: Diskordan STE / S dalgası oranı ≥ %25 (|STE/S| ≥ 0.25).',
    pearlEn: 'Acute MI in LBBB: Concordant STE ≥1 mm (5 pts), concordant STD ≥1 mm in V1–V3 (3 pts), or Smith-Modified discordant STE/S-wave ratio ≥25%.'
  },

  // 2. ARRHYTHMIAS
  {
    id: 'normal_sinus', cat: 'arrhythmia', color: '#10b981',
    tr: 'Normal Sinüs Ritmi (NSR)', en: 'Normal Sinus Rhythm (NSR)',
    hr: 72, pr: 160, qrs: 88, qt: 380, axis: 58, culprit: 'None',
    affectedLeads: ['II', 'V1', 'V6'], reciprocalLeads: [],
    morph: {},
    pearlTr: 'Her QRS önünde düzenli P dalgası (I ve II’de pozitif, aVR’de negatif, V1’de bifazik), sabit PR aralığı (120–200 ms), dar QRS (<120 ms) ve düzenli R-R aralıkları (60–100/dk).',
    pearlEn: 'Upright P waves in I, II, aVF and inverted in aVR, 1:1 AV conduction, constant PR interval (120–200 ms), narrow QRS (<120 ms), regular rate 60–100 bpm.'
  },
  {
    id: 'afib', cat: 'arrhythmia', color: '#38bdf8',
    tr: 'Atriyal Fibrilasyon (AFib)', en: 'Atrial Fibrillation (Irregularly Irregular)',
    hr: 118, pr: 0, qrs: 88, qt: 340, axis: 50, culprit: 'None',
    affectedLeads: ['V1', 'II'], reciprocalLeads: [],
    morph: { afib: true, irregular: true },
    pearlTr: 'Belirgin P dalgalarının yokluğu, V1 ve II’de kaotik fibrilasyon (f) dalgaları (350–600/dk) ve tamamen düzensiz (irregularly irregular) R-R aralıkları.',
    pearlEn: 'Absence of distinct P waves, fibrillatory baseline (f waves), and irregularly irregular narrow QRS complexes.'
  },
  {
    id: 'afib_chb', cat: 'arrhythmia', color: '#f59e0b',
    tr: 'AFib + Tam AV Blok (Düzenli Kaçış Ritmi / Digoksin)', en: 'AFib with Complete Heart Block (Regularized Escape)',
    hr: 42, pr: 0, qrs: 96, qt: 440, axis: 55, culprit: 'None',
    affectedLeads: ['II', 'V1'], reciprocalLeads: [],
    morph: { afib: true, regularEscape: true },
    pearlTr: 'Atriyal fibrilasyon zemini sürerken ventrikül hızının yavaş ve TAMAMEN DÜZENLİ hale gelmesi! AV düğüm tam bloke olmuştur ve kavşak/ventrikül kaçış odağı devralmıştır. Klasik Digoksin Toksisitesi imzasıdır!',
    pearlEn: 'Fibrillatory baseline with a slow, paradoxically REGULAR ventricular escape rhythm—pathognomonic for complete AV block during AFib (classic digoxin toxicity clue!).'
  },
  {
    id: 'aflutter_2to1', cat: 'arrhythmia', color: '#06b6d4',
    tr: 'Atriyal Flutter (2:1 AV İletim · ~150/dk)', en: 'Atrial Flutter with 2:1 AV Conduction (~150 bpm)',
    hr: 150, pr: 0, qrs: 88, qt: 310, axis: 60, culprit: 'None',
    affectedLeads: ['II', 'III', 'aVF', 'V1'], reciprocalLeads: [],
    morph: { flutter: true },
    pearlTr: 'Kavotriküspit istmus (CTI) makro-reentrisi (~300/dk atriyal hız). İnferior derivasyonlarda (II, III, aVF) testere dişi (F) dalgaları ve V1’de pozitif F dalgaları. ~150/dk sabit dar QRS taşikardide ilk akla gelmelidir!',
    pearlEn: 'Cavotricuspid isthmus macro-reentry (~300 bpm atrial rate) with sawtooth flutter (F) waves in II, III, aVF and 2:1 conduction yielding a fixed ~150 bpm ventricular rate.'
  },
  {
    id: 'avnrt', cat: 'arrhythmia', color: '#8b5cf6',
    tr: 'AVNRT (Supraventriküler Taşikardi · Pseudo-r’ V1)', en: 'SVT (Typical Slow-Fast AVNRT)',
    hr: 176, pr: 0, qrs: 84, qt: 290, axis: 48, culprit: 'None',
    affectedLeads: ['V1', 'II', 'III', 'aVF'], reciprocalLeads: [],
    morph: { avnrt: true },
    pearlTr: 'AV düğüm yavaş-hızlı yol reentrisi: Düzenli dar QRS taşikardi, retrograd P dalgası QRS içine gizlenir veya hemen sonunda V1’de "pseudo-r’" ve II/III/aVF’de "pseudo-S" oluşturur (RP < 70 ms).',
    pearlEn: 'Regular narrow-complex tachycardia where retrograde atrial activation produces a pseudo-r’ at the terminal QRS in V1 and pseudo-S in inferior leads (RP < 70 ms).'
  },
  {
    id: 'mono_vt', cat: 'arrhythmia', color: '#ef4444',
    tr: 'Monomorfik Ventriküler Taşikardi (VT)', en: 'Monomorphic Ventricular Tachycardia (VT)',
    hr: 168, pr: 0, qrs: 164, qt: 360, axis: -110, culprit: 'None',
    affectedLeads: ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'aVR'], reciprocalLeads: [],
    morph: { vt: true },
    pearlTr: 'Geniş QRS taşikardi (>140 ms), AV disosiyasyon, füzyon/yakalama (capture) vuruları, prekordiyal konkordans (V1–V6 tümü pozitif veya negatif), Brugada RS > 100 ms ve Vereckei aVR’de başlangıç R dalgası.',
    pearlEn: 'Wide-complex tachycardia featuring AV dissociation, fusion/capture beats, precordial concordance, Brugada RS >100 ms, and dominant initial R in aVR.'
  },
  {
    id: 'torsades', cat: 'arrhythmia', color: '#ec4899',
    tr: 'Torsades de Pointes (Polimorfik VT + Uzun QT)', en: 'Torsades de Pointes (Polymorphic VT)',
    hr: 210, pr: 0, qrs: 155, qt: 520, axis: 0, culprit: 'None',
    affectedLeads: ['II', 'V2', 'V5'], reciprocalLeads: [],
    morph: { torsades: true },
    pearlTr: 'Uzun QT zemininde R-on-T ve "uzun-kısa" (long-short) diziyle başlayan, QRS ekseninin izoelektrik hat etrafında burgu gibi döndüğü polimorfik VT. İlk basamak tedavi: IV Magnezyum Sülfat (2 g) + Overdrive Pacing!',
    pearlEn: 'Polymorphic VT with QRS peaks twisting around the isoelectric baseline, triggered by EADs in Long QT. First-line stable therapy: IV Magnesium Sulfate + overdrive pacing.'
  },
  {
    id: 'vfib', cat: 'arrhythmia', color: '#dc2626',
    tr: 'Ventriküler Fibrilasyon (VF · Kardiyak Arrest)', en: 'Ventricular Fibrillation (VF)',
    hr: 0, pr: 0, qrs: 0, qt: 0, axis: 0, culprit: 'None',
    affectedLeads: ['II', 'V1', 'V5'], reciprocalLeads: [],
    morph: { vfib: true },
    pearlTr: 'Organize P, QRS veya T dalgası yoktur; düzensiz frekans ve genlikte kaotik fibrilasyon dalgaları. Kalp debisi sıfırdır — derhal yüksek kaliteli KPR ve asenkron Defibrilasyon uygulanmalıdır!',
    pearlEn: 'Chaotic, disorganized electrical oscillations without identifiable QRS complexes. Zero cardiac output—requires immediate CPR and unsynchronized defibrillation.'
  },

  // 3. CONDUCTION DISORDERS
  {
    id: 'avb_1', cat: 'conduction', color: '#38bdf8',
    tr: '1. Derece AV Blok (PR > 200 ms)', en: '1st Degree AV Block (PR > 200 ms)',
    hr: 66, pr: 280, qrs: 88, qt: 390, axis: 55, culprit: 'None',
    affectedLeads: ['II', 'V1'], reciprocalLeads: [],
    morph: { prMs: 280 },
    pearlTr: 'PR aralığı > 200 ms (1 büyük kareden uzun) olup her P dalgası düşme olmaksızın (1:1) QRS’e iletilir. Genellikle AV düğüm düzeyinde yavaşlamayı yansıtır.',
    pearlEn: 'Fixed PR interval prolongation (>200 ms, >1 large box) with intact 1:1 AV conduction and no dropped beats.'
  },
  {
    id: 'mobitz_1', cat: 'conduction', color: '#f59e0b',
    tr: '2. Derece AVB Mobitz Tip I (Wenckebach)', en: '2nd Degree AV Block Mobitz I (Wenckebach)',
    hr: 58, pr: 220, qrs: 88, qt: 400, axis: 52, culprit: 'None',
    affectedLeads: ['II', 'V1'], reciprocalLeads: [],
    morph: { mobitz1: true },
    pearlTr: 'PR aralığı her vuruda progresif uzar, R-R aralığı kısalır ve sonunda bir P dalgası bloke olur (QRS düşer → grup vuruları). Blok düzeyi AV düğümdür; genellikle selimdir ve atropine yanıt verir.',
    pearlEn: 'Progressive PR prolongation culminating in a non-conducted P wave (grouped beating). Usually nodal (supra-Hisian) and responsive to vagolytic therapy.'
  },
  {
    id: 'mobitz_2', cat: 'conduction', color: '#ef4444',
    tr: '2. Derece AVB Mobitz Tip II (İnfra-Hisian)', en: '2nd Degree AV Block Mobitz II (Infra-Hisian)',
    hr: 48, pr: 170, qrs: 132, qt: 420, axis: -15, culprit: 'None',
    affectedLeads: ['II', 'V1', 'V6'], reciprocalLeads: [],
    morph: { mobitz2: true },
    pearlTr: 'İletilen vurularda PR aralığı SABİTTİR; öncesinde PR uzaması olmadan aniden P dalgaları bloke olur. Blok His-Purkinje düzeyindedir, tam bloğa ilerleme riski yüksektir — Kalıcı Kalp Pili endikedir!',
    pearlEn: 'Constant PR intervals across conducted beats with sudden, unpredictable dropped QRS complexes. Infra-Hisian pathology requiring permanent pacemaker implantation.'
  },
  {
    id: 'avb_3', cat: 'conduction', color: '#dc2626',
    tr: '3. Derece (Tam) AV Blok · AV Disosiyasyon', en: '3rd Degree (Complete) AV Block',
    hr: 38, pr: 0, qrs: 142, qt: 460, axis: -30, culprit: 'None',
    affectedLeads: ['II', 'V1'], reciprocalLeads: [],
    morph: { chb: true },
    pearlTr: 'Atriyumlar ve ventriküller birbirinden tamamen bağımsızdır (P-P düzenli ~80/dk, R-R düzenli kaçış ritmi ~30–45/dk). Hiçbir P dalgası ventriküle iletilmez (tam AV disosiyasyon).',
    pearlEn: 'Complete electrical dissociation between atria (regular P-P) and ventricles (slower regular escape R-R) with continuously varying P-QRS relationships.'
  },
  {
    id: 'rbbb', cat: 'conduction', color: '#818cf8',
    tr: 'Sağ Dal Bloğu (RBBB · V1 rsR’ Tavşan Kulağı)', en: 'Right Bundle Branch Block (RBBB)',
    hr: 72, pr: 160, qrs: 138, qt: 400, axis: 65, culprit: 'None',
    affectedLeads: ['V1', 'V2', 'I', 'V6'], reciprocalLeads: [],
    morph: { rbbb: true },
    pearlTr: 'QRS ≥ 120 ms, V1–V2’de gecikmiş sağ ventrikül aktivasyonunu gösteren "rsR’" (M paterni / tavşan kulağı) + sekonder T negatifliği ve I, aVL, V5–V6’da geniş, çentikli/künt S dalgası.',
    pearlEn: 'QRS ≥120 ms with terminal rsR’ ("M-shaped") complex in V1–V2 and wide, slurred terminal S waves in lateral leads I, aVL, V5–V6.'
  },
  {
    id: 'lbbb', cat: 'conduction', color: '#a78bfa',
    tr: 'Sol Dal Bloğu (LBBB · V1 Derin QS, V6 Çentikli R)', en: 'Left Bundle Branch Block (LBBB)',
    hr: 74, pr: 168, qrs: 146, qt: 420, axis: -20, culprit: 'None',
    affectedLeads: ['V1', 'V2', 'I', 'aVL', 'V5', 'V6'], reciprocalLeads: [],
    morph: { lbbb: true },
    pearlTr: 'QRS ≥ 120 ms, I, aVL, V5–V6’da normal septal q kaybı + geniş/çentikli monofazik R dalgası, V1–V3’te derin rS veya QS kompleksi ve uygun diskordans (ST-T vektörü ana QRS yönünün tersinedir).',
    pearlEn: 'QRS ≥120 ms, absence of septal q waves in I/V5–V6, broad notched monophasic R in lateral leads, deep QS/rS in V1–V3, and appropriate ST-T discordance.'
  },
  {
    id: 'lafb_ashman', cat: 'conduction', color: '#34d399',
    tr: 'Sol Anterior Hemiblok (LAFB) & Ashman Fenomeni', en: 'LAFB (qR in I/aVL, rS in II/III/aVF) & Ashman',
    hr: 76, pr: 160, qrs: 104, qt: 385, axis: -55, culprit: 'None',
    affectedLeads: ['I', 'aVL', 'II', 'III', 'aVF'], reciprocalLeads: [],
    morph: { lafb: true },
    pearlTr: 'LAFB: Sol aks sapması (−45° ile −90°), I ve aVL’de qR, II, III, aVF’de derin rS (SIII > SII). Ashman Fenomeni ise uzun R-R sonrası gelen erken vurunun sağ dalın refrakter periyoduna denk gelerek RBBB aberasyonu göstermesidir.',
    pearlEn: 'LAFB produces left axis deviation (−45° to −90°) with qR in I/aVL and rS in II/III/aVF. Ashman phenomenon produces RBBB aberrancy following a long-short RR cycle.'
  },

  // 4. CHANNELOPATHIES & GENETIC (Phase 0–4 Cardiac Ion Channelopathies Atlas)
  {
    id: 'brugada_1', cat: 'channelopathy', color: '#f43f5e',
    tr: 'Brugada Sendromu (BrS1: SCN5A ↓INa · BrS5: KCNE3/KCND3 ↑Ito)', en: 'Brugada Syndrome (BrS1: SCN5A ↓INa · BrS5: KCNE3/KCND3 ↑Ito)',
    hr: 70, pr: 185, qrs: 114, qt: 390, axis: 60, culprit: 'None',
    affectedLeads: ['V1', 'V2'], reciprocalLeads: [],
    morph: { brugada: true },
    pearlTr: 'Faz 0 INa kaybı (SCN5A: BrS1, SIDS) veya Faz 1 Ito artışı (KCNE3: BrS5, KCND3: BrS) / Faz 2 ICa kaybı: RVOT epikardiyal Faz 1 çentiği derinleşir → V1–V2’de ≥2 mm Coved (köpekbalığı yüzgeci) ST elevasyonu ve negatif T. Ateş derhal düşürülmeli; Sınıf IC ilaçlar kontrendikedir!',
    pearlEn: 'Loss of Phase 0 INa (SCN5A: BrS1) or gain of Phase 1 Ito (KCNE3: BrS5, KCND3: BrS) deepens the RVOT epicardial notch, producing ≥2 mm coved STE and negative T in V1–V2.'
  },
  {
    id: 'lqts', cat: 'channelopathy', color: '#a855f7',
    tr: 'LQT1 (KCNQ1) / LQT5 (KCNE1) & JLN1/JLN2 (Faz 3 ↓IKs · Geniş T)', en: 'LQT1 (KCNQ1) / LQT5 (KCNE1) & JLN1/2 (Phase 3 ↓IKs · Broad T)',
    hr: 64, pr: 160, qrs: 88, qt: 520, axis: 55, culprit: 'None',
    affectedLeads: ['II', 'V2', 'V3', 'V4', 'V5'], reciprocalLeads: [],
    morph: { lqts: true },
    pearlTr: 'Faz 3 yavaş gecikmiş doğrultucu potasyum akımı (IKs) kaybı (KCNQ1: LQTS1, JLN1, SIDS; KCNE1: LQTS5, JLN2): Geniş tabanlı (broad-based) uzun T dalgası ve QTc > 480–520 ms. Yüzme ve egzersiz (adrenerjik deşarj) Torsades tetikler; Jervell ve Lange-Nielsen (JLN1/2) sendromunda konjenital bilateral sağırlık eşlik eder (Beta-bloker: Nadolol/Propranolol 1. tercih!).',
    pearlEn: 'Phase 3 slow K+ current (IKs) loss-of-function (KCNQ1: LQTS1, JLN1, SIDS; KCNE1: LQTS5, JLN2) produces broad-based prolonged T waves and exercise/swimming-triggered Torsades (JLN includes congenital deafness).'
  },
  {
    id: 'lqt2_kcnh2', cat: 'channelopathy', color: '#c084fc',
    tr: 'LQT2 (KCNH2 / hERG) & LQT6 (KCNE2 · Faz 3 ↓IKr · Çentikli Bifid T)', en: 'LQT2 (KCNH2) & LQT6 (KCNE2 · Phase 3 ↓IKr · Notched Bifid T)',
    hr: 62, pr: 162, qrs: 88, qt: 530, axis: 52, culprit: 'None',
    affectedLeads: ['II', 'V2', 'V3', 'V4'], reciprocalLeads: [],
    morph: { lqts: true, lqt2Bifid: true },
    pearlTr: 'Faz 3 hızlı gecikmiş doğrultucu potasyum akımı (IKr) kaybı (KCNH2: LQTS2, SIDS; KCNE2: LQTS6, SIDS): Düşük genlikli, çentikli/iki hörgüçlü (bifid/notched) T dalgaları ve QTc > 500 ms. Ani işitsel uyaran (çalar saat/telefon zili) ve postpartum dönemde erken ard-depolarizasyon (EAD) ile Torsades de Pointes tetiklenir!',
    pearlEn: 'Phase 3 rapid K+ current (IKr) loss-of-function (KCNH2: LQTS2, SIDS; KCNE2: LQTS6, SIDS) causes low-amplitude notched/bifid T waves and auditory/alarm-triggered Torsades de Pointes.'
  },
  {
    id: 'lqt3_scn5a', cat: 'channelopathy', color: '#f97316',
    tr: 'LQT3 (SCN5A Geç ↑INa,L) & SIDS (Uzun İzoelektrik ST + Geç Sivri T)', en: 'LQT3 (SCN5A Late ↑INa,L) & SIDS (Long Flat ST + Late Peaked T)',
    hr: 54, pr: 168, qrs: 92, qt: 540, axis: 58, culprit: 'None',
    affectedLeads: ['II', 'V2', 'V3', 'V5'], reciprocalLeads: [],
    morph: { lqts: true, lqt3Late: true },
    pearlTr: 'SCN5A (Faz 0/2 sodyum kanalı) inaktivasyon kusuru sonucu kalıcı geç sodyum akımı (↑INa,L): Çok uzun, düz izoelektrik ST segmenti ve oldukça geç başlayan dar/sivri T dalgası. Uykuda ve bradikardide ölümcül aritmi / Ani Bebek Ölümü Sendromu (SIDS) yapar; Meksiletin / Flekainid geç Na+ akımını bloke ederek QTc’yi kısaltır!',
    pearlEn: 'Gain-of-function persistent late Na+ current (SCN5A: LQT3, SIDS) prolongs Phase 2 plateau, creating a long flat isoelectric ST segment with a late-appearing peaked T wave (bradycardia/sleep-triggered; responsive to Mexiletine).'
  },
  {
    id: 'lqts8_timothy', cat: 'channelopathy', color: '#e11d48',
    tr: 'Timothy Sendromu (LQTS8: CACNA1C ↑ICa,L · Faz 2 & T Alternansı)', en: 'Timothy Syndrome (LQTS8: CACNA1C ↑ICa,L · Macroscopic T Alternans)',
    hr: 58, pr: 174, qrs: 92, qt: 575, axis: 50, culprit: 'None',
    affectedLeads: ['V2', 'V3', 'V4', 'V5', 'II'], reciprocalLeads: [],
    morph: { lqts: true, timothyAlternans: true },
    pearlTr: 'Faz 2 L-tipi kalsiyum kanalı (CACNA1C: Cav1.2) kapanma kusuru (↑ICa,L): Aksiyon potansiyeli Faz 2 platosu aşırı uzar (QTc > 560–600 ms), vurudan vuruya makroskopik T-dalgası alternansı, 2:1 fonksiyonel AV blok, sindaktili ve otizm spektrumu ile seyreden en ağır LQTS alt tipidir (LQTS8).',
    pearlEn: 'Phase 2 L-type Ca2+ channel gain-of-function (CACNA1C: LQTS8) causes extreme QT prolongation, beat-to-beat macroscopic T-wave alternans, functional 2:1 AV block, and syndactyly.'
  },
  {
    id: 'ats1_lqt7_kcnj2', cat: 'channelopathy', color: '#10b981',
    tr: 'Andersen-Tawil (LQTS7/ATS1: KCNJ2 ↓IK1) & CPVT3 (Dev U + Bidireksiyonel VT)', en: 'Andersen-Tawil (LQTS7/ATS1: KCNJ2 ↓IK1) & CPVT3 (Giant U + Bi-VT)',
    hr: 68, pr: 162, qrs: 92, qt: 480, axis: 55, culprit: 'None',
    affectedLeads: ['V2', 'V3', 'V4', 'II'], reciprocalLeads: [],
    morph: { ats1UWave: true },
    pearlTr: 'Faz 3 sonu ve Faz 4 içe doğrultucu K+ kanalı (IK1 — KCNJ2: LQTS7, ATS1, CPVT3, DAVD1; KCNJ3: LQTS13) fonksiyon kaybı: V2–V3’te dev U dalgası (uzamış QU / QTu), hipo/hiperkalemik periyodik paralizi, dismorfik yüz ve DAD kaynaklı Bidireksiyonel VT (CPVT3)!',
    pearlEn: 'Phase 3/4 inward rectifier IK1 loss-of-function (KCNJ2: LQTS7, ATS1, CPVT3, DAVD1; KCNJ3: LQTS13) causes prominent giant U waves (long QTu), periodic paralysis, and bidirectional VT.'
  },
  {
    id: 'sqts', cat: 'channelopathy', color: '#06b6d4',
    tr: 'Kısa QT Sendromu (SQTS1: KCNH2 ↑IKr · SQT2: KCNQ1 ↑IKs · SQT3: KCNJ2 ↑IK1)', en: 'Short QT Syndrome (SQTS1: KCNH2 ↑IKr · SQT2: KCNQ1 · SQT3: KCNJ2)',
    hr: 68, pr: 150, qrs: 84, qt: 280, axis: 58, culprit: 'None',
    affectedLeads: ['V2', 'V3', 'V4'], reciprocalLeads: [],
    morph: { sqts: true },
    pearlTr: 'Faz 3 potasyum kanallarında fonksiyon artışı (KCNH2: SQTS1/AF2, KCNQ1: SQT2/AF1, KCNJ2: SQT3/AF4): Aksiyon potansiyeli süresi aşırı kısalır (QTc < 340 ms), ST segmenti kaybolur ve QRS bitiminden hemen sonra dar tabanlı, uzun sivri T dalgaları yükselir. Kinidin QTc’yi uzatarak VF’den korur!',
    pearlEn: 'Gain-of-function K+ channelopathy (KCNH2: SQTS1, KCNQ1: SQT2, KCNJ2: SQT3) with QTc <340 ms, absent ST segment, tall narrow peaked T waves, and high risk of AFib and VF (treated with Quinidine).'
  },
  {
    id: 'ers_jwave', cat: 'channelopathy', color: '#38bdf8',
    tr: 'Erken Repolarizasyon Sendromu (ERS: KCNJ8 ↑IK,ATP / CACNA1C ↓ICa,L · J Dalgası)', en: 'Early Repolarization Syndrome (ERS: KCNJ8 / CACNA1C · J-Wave Notch)',
    hr: 58, pr: 158, qrs: 88, qt: 370, axis: 62, culprit: 'None',
    affectedLeads: ['II', 'III', 'aVF', 'V4', 'V5', 'V6'], reciprocalLeads: [],
    morph: { ersJWave: true },
    pearlTr: 'Faz 1/2 transmural repolarizasyon gradyenti (KCNJ8: ERS & AF10 ATP-duyarlı K+ akımı artışı; CACNA1C Faz 2 ↓ICa,L): İnferior (II, III, aVF) ve lateral (V4–V6) derivasyonlarda QRS sonunda belirgin çentikli J dalgası (≥0.1 mV, "balık oltası / fish-hook") ve konkav ST yüksekliği.',
    pearlEn: 'KCNJ8 (IK,ATP gain-of-function: ERS, AF10) or Phase 2 ↓ICa,L produces prominent notched/slurred J waves (fish-hook pattern ≥1 mm) in inferior/lateral leads.'
  },
  {
    id: 'sss_pccd_af_scn5a', cat: 'channelopathy', color: '#fbbf24',
    tr: 'Hasta Sinüs (SSS), İletim Hastalığı (PCCD: SCN5A) & Ailesel AF (KCNA5: AF7 ↑IKur)', en: 'Sick Sinus (SSS), PCCD (SCN5A ↓INa) & Familial AF (KCNA5: AF7 ↑IKur)',
    hr: 48, pr: 235, qrs: 134, qt: 410, axis: -35, culprit: 'None',
    affectedLeads: ['II', 'V1', 'V6'], reciprocalLeads: [],
    morph: { sssPccd: true, prMs: 235 },
    pearlTr: 'SCN5A (↓INa) mutasyonları SA düğüm çıkışını ve His-Purkinje iletimini yavaşlatarak Hasta Sinüs Sendromu (SSS), İlerleyici Kardiyak İletim Hastalığı (PCCD / Lenègre-Lev: PR uzaması + geniş QRS) ve Ailesel AF (FA3) yapar. Atriyal spesifik IKur kanalı (KCNA5: AF7) mutasyonları ise erken Faz 3’ü bozarak ailesel AFib tetikler.',
    pearlEn: 'Loss-of-function SCN5A (↓INa) causes Sick Sinus Syndrome (SSS), Progressive Cardiac Conduction Disease (PCCD: prolonged PR + wide QRS), and FA3, while atrial IKur (KCNA5) causes Familial AF7.'
  },
  {
    id: 'wpw', cat: 'channelopathy', color: '#f59e0b',
    tr: 'Wolff-Parkinson-White (WPW · Kent Demeti & Delta)', en: 'Wolff-Parkinson-White (WPW Pre-Excitation)',
    hr: 76, pr: 95, qrs: 132, qt: 395, axis: 30, culprit: 'None',
    affectedLeads: ['I', 'II', 'V2', 'V4', 'V5', 'V6'], reciprocalLeads: [],
    morph: { wpw: true, prMs: 95 },
    pearlTr: 'Aksesuar AV yol (Kent demeti) ventrikülü erken uyarır: Kısa PR (<120 ms), QRS başlangıcında yavaş yükselen "Delta dalgası" ve geniş QRS (>110 ms). Pre-eksite AFib’de AV düğüm blokerleri (Adenozin, Verapamil, Digoksin, Beta-bloker) KONTRENDİKEDİR (VF riski; Prokainamid veya Kardiyoversiyon seçilir)!',
    pearlEn: 'Short PR (<120 ms), slurred initial QRS upstroke (delta wave), and widened QRS. In pre-excited AFib, AV nodal blockers (adenosine, CCBs, digoxin) are contraindicated!'
  },
  {
    id: 'arvc_hcm', cat: 'channelopathy', color: '#ec4899',
    tr: 'ARVC (Epsilon Dalgası) & HKMP (Hançer Q + Dev T)', en: 'ARVC (Epsilon Wave V1–V3) & HCM (Dagger Q)',
    hr: 68, pr: 164, qrs: 110, qt: 405, axis: 40, culprit: 'None',
    affectedLeads: ['V1', 'V2', 'V3', 'I', 'aVL', 'V5', 'V6'], reciprocalLeads: [],
    morph: { arvcHcm: true },
    pearlTr: 'ARVC: V1–V3’te QRS bitiminde küçük çentik ("Epsilon dalgası" — gecikmiş RV aktivasyonu) + V1–V3 T negatifliği. HKMP: Septal hipertrofiye bağlı I, aVL, V5–V6’da derin dar "hançer (dagger) Q" dalgaları ve apikal HKMP’de (Yamaguchi) V3–V5 dev simetrik negatif T dalgaları.',
    pearlEn: 'ARVC shows post-excitation Epsilon waves and T inversions in V1–V3. HCM displays deep narrow septal "dagger Q" waves laterally and giant T inversions in apical HCM.'
  },

  // 5. PERICARDIAL & STRUCTURAL
  {
    id: 'pericarditis', cat: 'structural', color: '#10b981',
    tr: 'Akut Perikardit (Yaygın Konkav STE + PR Çökmesi)', en: 'Acute Pericarditis (Diffuse Concave STE + PR Shift)',
    hr: 96, pr: 152, qrs: 86, qt: 360, axis: 58, culprit: 'None',
    affectedLeads: ['I', 'II', 'III', 'aVF', 'V2', 'V3', 'V4', 'V5', 'V6'], reciprocalLeads: ['aVR', 'V1'],
    morph: { pericarditis: true },
    pearlTr: 'Koroner sulama alanına uymayan YAYGIN konkav (eyer şeklinde) ST elevasyonu + PR segment çökmesi + aVR’de resiprokal PR elevasyonu ve ST çökmesi + Spodick işareti (TP segmentinin aşağı eğimi).',
    pearlEn: 'Diffuse concave ("saddle-shaped") ST elevation with PR depression across multiple territories, reciprocal PR elevation in aVR, and downsloping TP segment (Spodick sign).'
  },
  {
    id: 'tamponade', cat: 'structural', color: '#f59e0b',
    tr: 'Kardiyak Tamponad (Elektriksel Alternans + Düşük Voltaj)', en: 'Cardiac Tamponade (Electrical Alternans)',
    hr: 116, pr: 150, qrs: 86, qt: 340, axis: 55, culprit: 'None',
    affectedLeads: ['II', 'V1', 'V2', 'V3', 'V4'], reciprocalLeads: [],
    morph: { alternans: true },
    pearlTr: 'Klasik triad: (1) Sinüs taşikardisi, (2) Düşük QRS voltajı (perikardiyal sıvı yalıtımı) ve (3) Elektriksel Alternans — kalbin sıvı dolu kese içinde her atımda sarkaç gibi sallanmasına bağlı vurudan vuruya QRS genlik/eksen değişimi!',
    pearlEn: 'Sinus tachycardia, diffuse low QRS voltage, and beat-to-beat QRS amplitude alternation (Electrical Alternans) caused by the swinging heart in a large effusion.'
  },
  {
    id: 'pulmonary_embolism', cat: 'structural', color: '#38bdf8',
    tr: 'Akut Pulmoner Emboli (S1Q3T3 + Sağ Ventrikül Yüklenmesi)', en: 'Acute Pulmonary Embolism (S1Q3T3 & RV Strain)',
    hr: 112, pr: 155, qrs: 102, qt: 350, axis: 105, culprit: 'None',
    affectedLeads: ['I', 'III', 'V1', 'V2', 'V3'], reciprocalLeads: [],
    morph: { pe: true },
    pearlTr: 'En sık bulgu sinüs taşikardisidir. Akut kor pulmonale (RV basınç yüklenmesi): McGinn-White S1Q3T3 paterni (I’de derin S, III’te Q ve negatif T), sağ aks sapması, yeni RBBB ve V1–V4’te sağ ventrikül strain T negatiflikleri.',
    pearlEn: 'Sinus tachycardia (most common), acute RV strain with T-wave inversions in V1–V4, right axis deviation, incomplete/complete RBBB, and the McGinn-White S1Q3T3 pattern.'
  },
  {
    id: 'lvh_strain', cat: 'structural', color: '#8b5cf6',
    tr: 'Sol Ventrikül Hipertrofisi (LVH + Repolarizasyon Strain)', en: 'Left Ventricular Hypertrophy (LVH + Strain)',
    hr: 70, pr: 168, qrs: 102, qt: 400, axis: -10, culprit: 'None',
    affectedLeads: ['V1', 'V2', 'V5', 'V6', 'I', 'aVL'], reciprocalLeads: [],
    morph: { lvh: true },
    pearlTr: 'Sokolow-Lyon: SV1 + RV5/V6 > 35 mm; Cornell: RaVL + SV3 > 28 mm (E) / > 20 mm (K). Lateral derivasyonlarda (I, aVL, V5–V6) asimetrik aşağı eğimli ST çökmesi ve T negatifliği (LV strain paterni).',
    pearlEn: 'Increased voltage criteria (Sokolow-Lyon SV1 + RV5/6 >35 mm; Cornell RaVL + SV3 >28/20 mm) with asymmetric downsloping lateral ST depression and T inversion (LV strain).'
  },
  {
    id: 'lv_aneurysm_sarcoid', cat: 'structural', color: '#f97316',
    tr: 'LV Anevrizması (Kalıcı STE + QS) & Endokardit/Sarkoidoz AVB', en: 'LV Aneurysm (Persistent STE) & Sarcoid/Endocarditis',
    hr: 74, pr: 230, qrs: 110, qt: 400, axis: 30, culprit: 'LAD',
    affectedLeads: ['V1', 'V2', 'V3', 'V4'], reciprocalLeads: [],
    morph: { aneurysm: true, prMs: 230 },
    pearlTr: 'LV Anevrizması: Geçirilmiş MI sonrası V1–V4’te derin QS dalgaları + kalıcı ST elevasyonu (ancak dinamik hiperakut T veya resiprokal STD yoktur; T/QRS oranı < 0.36). Enfektif Endokarditte yeni gelişen PR uzaması/AV blok AORT KÖKÜ PERİVALVÜLER APSESİ için alarmdır!',
    pearlEn: 'LV Aneurysm shows deep anterior QS complexes with persistent STE and low T/QRS ratio (<0.36). New AV block in endocarditis warns of aortic root perivalvular abscess!'
  },

  // 6. PHARMACOLOGY & ELECTROLYTES (ECGLens Premium Pharmacology Library)
  {
    id: 'hyperkalemia', cat: 'pharmacology', color: '#ef4444',
    tr: 'Hiperkalemi Evreleri (Çadır T → PR Uzaması → Sine-Wave)', en: 'Hyperkalemia Progression (Peaked T → Sine Wave)',
    hr: 64, pr: 230, qrs: 148, qt: 360, axis: 60, culprit: 'None',
    affectedLeads: ['V2', 'V3', 'V4', 'II'], reciprocalLeads: [],
    morph: { hyperK: true, prMs: 230 },
    pearlTr: 'K+ > 5.5: Dar tabanlı sivri "Eyfel/Çadır" T dalgaları → K+ > 6.5: P dalgası düzleşir, PR uzar → K+ > 7.5: QRS genişler, P kaybolur (sinoventriküler ritim) → K+ > 8.5: Sinüs dalgası (Sine-wave) ve VF/Asistoli. İlk ilaç: IV Kalsiyum Glukonat (membran stabilizasyonu)!',
    pearlEn: 'Tall narrow-based peaked T waves → P flattening & PR prolongation → bizarre QRS widening → Sine-wave pattern. Immediate therapy: IV Calcium Gluconate!'
  },
  {
    id: 'hypokalemia', cat: 'pharmacology', color: '#38bdf8',
    tr: 'Hipokalemi (Belirgin U Dalgası, ST Çökmesi ve T-U Füzyonu)', en: 'Hypokalemia (Prominent U Waves & T-U Fusion)',
    hr: 68, pr: 168, qrs: 92, qt: 460, axis: 55, culprit: 'None',
    affectedLeads: ['V2', 'V3', 'V4', 'II'], reciprocalLeads: [],
    morph: { hypoK: true },
    pearlTr: 'T dalgası düzleşir/negatifleşir, ST çöker ve V2–V3’te T dalgasından sonra belirgin "U dalgası" ortaya çıkar. Şiddetli hipokalemide T ve U birleşerek (T-U füzyonu / uzamış QU aralığı) psödo-uzun QT ve Torsades de Pointes yaratır.',
    pearlEn: 'ST depression, T-wave flattening, and prominent U waves in V2–V4 merging into T-U fusion (prolonged QU interval).'
  },
  {
    id: 'digoxin', cat: 'pharmacology', color: '#f59e0b',
    tr: 'Digoksin Etkisi (Salvador Dali Kepçe ST) vs Toksisitesi', en: 'Digoxin Effect (Scooped ST) vs Digoxin Toxicity',
    hr: 62, pr: 210, qrs: 88, qt: 340, axis: 50, culprit: 'None',
    affectedLeads: ['I', 'V4', 'V5', 'V6', 'II'], reciprocalLeads: [],
    morph: { digoxin: true, prMs: 210 },
    pearlTr: 'Terapötik Digoksin Etkisi: Na+/K+-ATPaz inhibisyonu ve vagal tonus artışıyla "Salvador Dali bıyığı / kepçe (scooped)" ST çökmesi ve kısa QT (toksisite değildir!). Digoksin Toksisitesi ise: Artmış otomatizma + AV blok = Bloklu Atriyal Taşikardi (PAT with block), Düzenli AFib veya Bidireksiyonel VT!',
    pearlEn: 'Therapeutic digoxin causes "Salvador Dali mustache" scooped lateral ST depression and shortened QT. Toxicity causes Enhanced Automaticity + AV Block (AT with block, bidirectional VT).'
  },
  {
    id: 'class_1c_na', cat: 'pharmacology', color: '#a78bfa',
    tr: 'Sınıf IA / IC Antiartmikler & TCA (Na+ Kanal Bloğu · Faz 0)', en: 'Class IA/IC Drugs & TCA Overdose (Na+ Block)',
    hr: 98, pr: 195, qrs: 144, qt: 450, axis: 125, culprit: 'None',
    affectedLeads: ['aVR', 'V1', 'V2', 'V5'], reciprocalLeads: [],
    morph: { naBlock: true },
    pearlTr: 'Flekainid / Propafenon (IC, kullanım-bağımlı hızlı kalp hızında QRS genişlemesi; yapısal kalp hastalığında CAST çalışması nedeniyle kontrendike!) ve Trisiklik Antidepresan (TCA) zehirlenmesi: QRS > 100 ms + aVR’de > 3 mm terminal R dalgası. Tedavi: IV Sodyum Bikarbonat!',
    pearlEn: 'Fast Na+ channel (phase 0) blockade widens the QRS (use-dependent with Class IC) and produces a prominent terminal R wave >3 mm in aVR in TCA toxicity (treat with IV NaHCO3).'
  },
  {
    id: 'class_3_k', cat: 'pharmacology', color: '#ec4899',
    tr: 'Sınıf III Antiartmikler (Amiodaron vs Sotalol / Dofetilid · IKr)', en: 'Class III Antiarrhythmics (Amiodarone vs Sotalol)',
    hr: 56, pr: 190, qrs: 98, qt: 495, axis: 50, culprit: 'None',
    affectedLeads: ['II', 'V2', 'V3', 'V5'], reciprocalLeads: [],
    morph: { lqts: true, prMs: 190 },
    pearlTr: 'IKr (hERG) potasyum kanalı blokajı Faz-3 repolarizasyonu uzatarak QTc’yi uzatır. Sotalol ve Dofetilid "ters kullanım bağımlılığı" (reverse use-dependence) gösterir: Bradikardide QT çok daha fazla uzar ve Torsades riski fırlar! Amiodaron ise transmural dispersiyonu azalttığı için QT uzatsa da Torsades nadirdir.',
    pearlEn: 'IKr blockade prolongs phase 3 and QTc. Sotalol/dofetilide exhibit reverse use-dependence (worse QT prolongation at slow heart rates), whereas amiodarone rarely triggers Torsades.'
  },
  {
    id: 'cocaine_adenosine', cat: 'pharmacology', color: '#10b981',
    tr: 'Kokain Koroner Vazospazmı & Adenozin AV Düğüm Bloğu', en: 'Cocaine Vasospasm & Adenosine AV Nodal Block',
    hr: 108, pr: 165, qrs: 112, qt: 390, axis: 60, culprit: 'LAD',
    affectedLeads: ['V2', 'V3', 'V4', 'II'], reciprocalLeads: [],
    morph: { stV1V4: 0.22, tallT: 0.42 },
    pearlTr: 'Kokain: Sempatomimetik alfa-adrenerjik koroner vazospazm (geçici STEMI) + Sınıf I benzeri Na+ kanal bloğu (QRS genişlemesi). Kokain ilişkili göğüs ağrısında saf Beta-blokerlerden kaçınılır (karşılanmamış alfa-vazospazm); Benzodiazepin + Nitrat kullanılır.',
    pearlEn: 'Cocaine induces alpha-adrenergic coronary vasospasm (transient STEMI) plus Na+ channel blockade. Treat with benzodiazepines and nitrates; avoid pure beta-blockers.'
  }
];

export const PREMIUM_STUDY_QUESTIONS = [
  {
    id: 'q_ant_stemi_leads',
    type: 'lead-selection',
    condId: 'anterior_stemi',
    titleTr: 'Derivasyon Seçim Antrenmanı: Akut Proksimal LAD Oklüzyonu',
    titleEn: 'Lead-Selection Drill: Acute Proximal LAD Occlusion',
    promptTr: 'Akut Anterior STEMI (LAD tıkanıklığı) olgusunda primer ST elevasyonu beklenen 4 prekordiyal derivasyonu 12-derivasyon ızgarasından seçin:',
    promptEn: 'Select the 4 anterior precordial leads that show primary ST-segment elevation in an acute Anterior STEMI (LAD occlusion):',
    targetLeads: ['V1', 'V2', 'V3', 'V4'],
    explainTr: 'V1–V2 anteroseptal, V3–V4 ise anteroapikal sol ventrikül duvarını görür ve LAD oklüzyonunda primer konveks ST elevasyonu sergiler (II, III, aVF’de ise resiprokal ST çökmesi izlenir).'
  },
  {
    id: 'q_inf_stemi_recip',
    type: 'lead-selection',
    condId: 'inferior_stemi',
    titleTr: 'Derivasyon Seçim Antrenmanı: İnferior STEMI ResiprokalDerivasyonları',
    titleEn: 'Lead-Selection Drill: Inferior STEMI Reciprocal Leads',
    promptTr: 'II, III ve aVF’de ST elevasyonu olan bir İnferior STEMI hastasında ZORUNLU RESİPROKAL ST ÇÖKMESİ (ayna görüntüsü) görülen 2 yüksek lateral derivasyonu seçin:',
    promptEn: 'In a patient with Inferior STEMI (STE in II, III, aVF), select the 2 high-lateral leads that show obligatory reciprocal ST depression:',
    targetLeads: ['I', 'aVL'],
    explainTr: 'İnferior (II, III, aVF; +60°..+120°) yaralanma vektörü yüksek lateral derivasyonlardan (I: 0°, aVL: −30°) uzaklaştığı için I ve aVL’de resiprokal ST çökmesi görülür ve perikardit ayrımında altın değerindedir.'
  },
  {
    id: 'q_lat_stemi_leads',
    type: 'lead-selection',
    condId: 'lateral_stemi',
    titleTr: 'Derivasyon Seçim Antrenmanı: Lateral LCx / Diyagonal Bölgesi',
    titleEn: 'Lead-Selection Drill: Lateral Territory Leads',
    promptTr: 'Sol ventrikül lateral duvarını gören 4 komşu (contiguous) lateral derivasyonu seçin:',
    promptEn: 'Select all 4 contiguous lateral leads that view the left ventricular lateral wall (LCx / Diagonal territory):',
    targetLeads: ['I', 'aVL', 'V5', 'V6'],
    explainTr: 'Yüksek lateral (I, aVL) ve alt-apikal lateral (V5, V6) derivasyonlar sol ventrikül yan duvarını görür ve LCx / diyagonal dal tıkanıklığında ST elevasyonu gösterir.'
  },
  {
    id: 'q_de_winter_mcq',
    type: 'mcq',
    condId: 'de_winter',
    titleTr: 'Klinik Vaka Sorusu: STEMI Eşdeğeri Tanıma',
    titleEn: 'Clinical Case MCQ: STEMI Equivalent Recognition',
    promptTr: '54 yaşında erkek hasta şiddetli retrosternal göğüs ağrısıyla başvuruyor. EKG’de V1–V6’da J noktasında 2 mm yukarı eğimli (upsloping) ST çökmesi, uzun simetrik sivri T dalgaları ve aVR’de 1 mm ST elevasyonu mevcut. En doğru yaklaşım nedir?',
    promptEn: 'A 54-year-old man presents with crushing chest pain. ECG shows 2 mm upsloping J-point ST depression in V1–V6 with tall symmetric T waves and 1 mm STE in aVR. What is the diagnosis and management?',
    options: [
      { id: 'a', tr: 'Normal varyant / Erken repolarizasyon — poliklinik kontrolü', en: 'Normal variant / Early repolarization — outpatient follow-up' },
      { id: 'b', tr: 'de Winter T-Dalgası Paterni (Akut Proksimal LAD Oklüzyonu) — Acil Kateterizasyon (STEMI Eşdeğeri)', en: 'de Winter Pattern (Acute Proximal LAD Occlusion) — Emergent PCI (STEMI Equivalent)', correct: true },
      { id: 'c', tr: 'Akut Perikardit — Kolşisin ve NSAİİ tedavisi', en: 'Acute Pericarditis — Colchicine and NSAID therapy' },
      { id: 'd', tr: 'Eforlu EKG testi ile iskemi araştırılması', en: 'Exercise treadmill stress testing to evaluate ischemia' }
    ],
    explainTr: 'de Winter paterni (%2 anterior MI olgusunda görülür) akut proksimal LAD tıkanıklığının bir STEMI eşdeğeridir; klasik ST elevasyonu beklenmeden derhal kateter laboratuvarına alınmalıdır.'
  },
  {
    id: 'q_afib_chb_mcq',
    type: 'mcq',
    condId: 'afib_chb',
    titleTr: 'Farmakoloji & Aritmi Kliniği: Düzenli Hale Gelen AFib',
    titleEn: 'Pharmacology & Arrhythmia: Regularized AFib',
    promptTr: 'Kronik AFib ve kalp yetersizliği nedeniyle Digoksin ve Furosemid kullanan 74 yaşında hastada bulantı, sarı-yeşil görme ve nabzın 42/dk tamamen DÜZENLİ olduğu saptanıyor. EKG’de fibrilasyon zemini sürerken R-R aralıkları eşit. Tanınız nedir?',
    promptEn: 'A 74-year-old on Digoxin for chronic AFib presents with nausea, xanthopsia, and a regular pulse of 42 bpm. ECG shows fibrillatory waves with strictly regular R-R intervals. What is the mechanism?',
    options: [
      { id: 'a', tr: 'Spontan Normal Sinüs Ritmine Dönüş', en: 'Spontaneous conversion to Normal Sinus Rhythm' },
      { id: 'b', tr: 'Digoksin Toksisitesine Bağlı AFib + Tam AV Blok ve Düzenli Kavşak Kaçış Ritmi', en: 'Digoxin Toxicity causing AFib with Complete AV Block and Regular Junctional Escape', correct: true },
      { id: 'c', tr: 'Mobitz Tip I (Wenckebach) AV Blok', en: 'Mobitz Type I (Wenckebach) AV Block' },
      { id: 'd', tr: 'Terapötik Digoksin Etkisi (Salvador Dali bulgusu)', en: 'Benign therapeutic Digoxin effect' }
    ],
    explainTr: 'AFib zemininde R-R aralıklarının tamamen düzenli ve yavaş hale gelmesi, AV düğümün tam bloke olduğunu ve aşağıdan düzenli bir kavşak/ventrikül kaçış odağının ritmi devraldığını gösterir (Digoksin toksisitesi için patognomoniktir!).'
  },
  {
    id: 'q_sgarbossa_mcq',
    type: 'mcq',
    condId: 'sgarbossa_lbbb',
    titleTr: 'İleri EKG Kriteri: LBBB Zemininde Akut MI (Smith-Modifiye Sgarbossa)',
    titleEn: 'Advanced Criteria: Acute MI in LBBB (Smith-Modified Sgarbossa)',
    promptTr: 'Bilinen Sol Dal Bloğu (LBBB) olan ve akut göğüs ağrısıyla gelen hastada aşağıdaki EKG bulgularından hangisi akut koroner oklüzyonu (Sgarbossa / Smith-Modifiye pozitifliğini) DOĞRULAR?',
    promptEn: 'Which finding confirms acute coronary occlusion in a patient with known LBBB and ischemic chest pain?',
    options: [
      { id: 'a', tr: 'V1–V3’te derin QS dalgası ile birlikte 2 mm diskordan ST elevasyonu (STE/S oranı = 0.10)', en: '2 mm discordant STE in V1–V3 with a 20 mm S wave (STE/S ratio = 0.10)' },
      { id: 'b', tr: 'Herhangi bir derivasyonda QRS ile aynı yönde (konkordan) ≥1 mm ST elevasyonu VEYA diskordan |STE/S| oranının ≥ 0.25 olması', en: 'Concordant STE ≥1 mm in any lead OR discordant |STE/S| ratio ≥ 0.25', correct: true },
      { id: 'c', tr: 'I ve V6’da septal q dalgasının bulunmaması', en: 'Absence of septal q waves in leads I and V6' },
      { id: 'd', tr: 'QRS süresinin 140 ms olması', en: 'QRS duration of 140 ms' }
    ],
    explainTr: 'LBBB’de uygun diskordans normaldir; ancak QRS ile aynı yönde (konkordan) ≥1 mm STE (5 puan), V1–V3’te konkordan ≥1 mm STD (3 puan) veya Smith-Modifiye kriterine göre aşırı diskordan STE (|STE/S| ≥ %25) akut oklüzyonu kanıtlar.'
  }
];

export const STUDY_TAGS = [
  { id: 'wrong', tr: '❌ Yanlış Yaptım', en: '❌ Got it wrong' },
  { id: 'revisit', tr: '🔁 Tekrar Et', en: '🔁 Revisit topic' },
  { id: 'lucky', tr: '🎲 Şans Tahmini', en: '🎲 Lucky guess' },
  { id: 'confusing', tr: '🧩 Kafa Karıştırıcı', en: '🧩 Confusing' },
  { id: 'highyield', tr: '⭐ Yüksek Verimli', en: '⭐ High-yield' }
];

export const SKILLSTAT_COLUMNS = [
  { col: 0, tr: '1. Sinüs Düğümü (6)', en: '1. Sinus Node (6)' },
  { col: 1, tr: '2. Atriyal Ritimler (5)', en: '2. Atrial Rhythms (5)' },
  { col: 2, tr: '3. AV Bloklar (5)', en: '3. AV Blocks (5)' },
  { col: 3, tr: '4. Kavşak & Gezici (5)', en: '4. Junctional & Wandering (5)' },
  { col: 4, tr: '5. Ventriküler & Pil (6)', en: '5. Ventricular & Paced (6)' }
];

export const SKILLSTAT_27_RHYTHMS = [
  // Col 0: Sinus Node (6)
  { id: 'R1', col: 0, hr: 72, tr: 'Normal Sinüs Ritmi', en: 'Sinus Rhythm', titleTr: 'Düzenli Sinüs Ritmi (NSR · 60–100/dk)', titleEn: 'Regular Sinus Rhythm (NSR · 60–100/min)', descTr: 'Erişkinde en sık normal ritim (60–100/dk). Derivasyon II’de her dar QRS önünde pozitif P dalgası, sabit PR (0.12–0.20 sn) ve eşit R-R aralıkları görülür.', descEn: 'Most common normal adult rhythm (60–100/min) with upright P waves in Lead II preceding every narrow QRS and regular R-R intervals.' },
  { id: 'R2', col: 0, hr: 48, tr: 'Sinüs Bradikardisi', en: 'Sinus Bradycardia', titleTr: 'Sinüs Bradikardisi (<60/dk)', titleEn: 'Sinus Bradycardia (<60/min)', descTr: 'SA düğüm ateşleme hızı <60/dk. Sporcularda ve uykuda fizyolojiktir; vagal hipertonus, inferior MI veya Hasta Sinüs Sendromunda görülür. Semptomatikse IV Atropin (0.5–1 mg) verilir.', descEn: 'Sinus rate <60/min with upright P waves in Lead II and narrow QRS. May be athletic, vagal, or due to Sick Sinus Syndrome.' },
  { id: 'R3', col: 0, hr: 138, tr: 'Sinüs Taşikardisi', en: 'Sinus Tachycardia', titleTr: 'Sinüs Taşikardisi (100–150/dk)', titleEn: 'Sinus Tachycardia (100–150/min)', descTr: 'Ağrı, ateş, hipovolemi, hipoksi veya sempatik deşarja sekonder SA düğüm hızlanması (>100/dk). Her QRS önünde pozitif P dalgası vardır; altta yatan neden tedavi edilir.', descEn: 'Result of increased sympathetic tone (pain, fever, hypovolemia) with upright P waves and narrow QRS typically <150/min.' },
  { id: 'R4', col: 0, hr: 78, tr: 'Sinüs Aritmisi', en: 'Sinus Arrhythmia', titleTr: 'Solunumsal Sinüs Aritmisi', titleEn: 'Respiratory Sinus Arrhythmia', descTr: 'P dalga morfolojisi ve PR aralığı sabitken R-R aralıklarının solunumla fazik değişimi: İnspirasyonda vagal tonus azalır (hızlanır), ekspirasyonda artar (yavaşlar).', descEn: 'Benign phasic R-R variation that speeds up with inspiration and slows down with expiration while maintaining normal P waves and PR.' },
  { id: 'R5', col: 0, hr: 48, tr: 'Sinüs Çıkış Bloğu', en: 'Sinus Exit Block', titleTr: 'Sinoatriyal (SA) Çıkış Bloğu', titleEn: 'Sinus Exit Block (SA Block)', descTr: 'SA düğüm zamanında uyarı üretir ancak uyarı perinodal dokudan atriyuma çıkamaz. Oluşan duraklama (pause) süresi önceki P-P aralığının TAM KATIDIR (2× P-P)!', descEn: 'SA impulse is blocked from exiting into the atria. Key hallmark: the pause length is an EXACT multiple (2×) of the basic P-P interval.' },
  { id: 'R6', col: 0, hr: 54, tr: 'Sinüs Arresti (Pause)', en: 'Sinus Arrest', titleTr: 'Sinüs Arresti / Sinüs Duraklaması', titleEn: 'Sinus Arrest (Sinus Pause)', descTr: 'SA düğümün geçici olarak uyarı üretememesidir. Sinüs çıkış bloğunun aksine, oluşan duraklama süresi önceki P-P aralıklarının tam katı DEĞİLDİR!', descEn: 'SA node fails to fire transiently. Unlike Sinus Exit Block, the resulting pause is NOT an exact multiple of the underlying P-P interval.' },

  // Col 1: Atrial Rhythms (5)
  { id: 'R7', col: 1, hr: 84, tr: 'NSR + PAC (Atriyal Ekstra)', en: 'NSR with PAC', titleTr: 'Sinüs Ritmi + Prematüre Atriyal Kompleks (PAC)', titleEn: 'NSR with Premature Atrial Complexes (PAC)', descTr: 'Atriyal ektopik odaktan beklenen sinüs vurusundan erken çıkan uyarı: Farklı/sivri/bifazik P’ dalgası + dar QRS ve tam olmayan (inkomplet) kompanzatuvar duraklama.', descEn: 'Early ectopic atrial impulse producing an abnormal premature P’ wave followed by a narrow QRS and an incomplete pause.' },
  { id: 'R8', col: 1, hr: 180, tr: 'SVT (180/dk)', en: 'SVT', titleTr: 'Supraventriküler Taşikardi (SVT · 170–230/dk)', titleEn: 'Supraventricular Tachycardia (SVT · 170–230/min)', descTr: 'Düzenli, çok hızlı (170–230/dk) dar QRS taşikardi; P dalgaları genellikle önceki T dalgası veya QRS içine gizlenmiştir. Vagal manevra ve IV Adenozin (6 mg → 12 mg) ile sonlandırılır.', descEn: 'Rapid, regular narrow-QRS tachycardia (170–230/min) with buried P waves. First-line: vagal maneuvers and IV Adenosine.' },
  { id: 'R9', col: 1, hr: 90, tr: 'Atriyal Fibrilasyon', en: 'Atrial Fibrillation', titleTr: 'Atriyal Fibrilasyon (AFib)', titleEn: 'Atrial Fibrillation (AFib)', descTr: 'Belirgin P dalgaları yoktur; kaotik fibrilasyon (f) dalgaları ve tamamen düzensiz (irregularly irregular) R-R aralıkları karakteristiktir. Atriyal katkı (kick) kaybolur ve >48 saatte tromboemboli riski artar.', descEn: 'Chaotic fibrillatory baseline with absent P waves and irregularly irregular narrow QRS complexes.' },
  { id: 'R10', col: 1, hr: 75, tr: 'Atriyal Flutter (4:1)', en: 'Atrial Flutter', titleTr: 'Atriyal Flutter (Testere Dişi F Dalgaları)', titleEn: 'Atrial Flutter (Sawtooth F Waves)', descTr: 'Atriyal makro-reentri (~300/dk) sonucu izoelektrik hat yerine karakteristik "testere dişi" (sawtooth) F dalgaları görülür (2:1 iletimde 150/dk, 4:1 iletimde 75/dk).', descEn: 'Atrial macro-reentry (~300/min) producing classic sawtooth flutter (F) waves with 2:1 (150 bpm) or 4:1 (75 bpm) AV conduction.' },
  { id: 'R28', col: 1, hr: 60, tr: 'Atriyal Kalp Pili (Paced)', en: 'Paced Atrial', titleTr: 'Atriyal Pace Ritmi (AAI Pacemaker)', titleEn: 'Paced Atrial Rhythm', descTr: 'Elektronik kalp pilinin sağ atriyumu uyarması: Her P dalgasının hemen önünde dikey ince "pace spike" çizgisi, ardından P dalgası ve hastanın kendi doğal dar QRS kompleksi gelir.', descEn: 'Electronic atrial pacing showing a vertical pacemaker spike immediately before each P wave, followed by an intrinsic narrow QRS.' },

  // Col 2: AV Blocks (5)
  { id: 'R22', col: 2, hr: 74, tr: 'NSR + 1° AV Blok', en: 'NSR with 1° AVB', titleTr: '1. Derece AV Blok (PR > 0.20 sn)', titleEn: 'NSR with First Degree AV Block', descTr: 'AV kavşakta iletim gecikmesi nedeniyle PR aralığı > 0.20 sn (5 küçük kareden uzun) ve sabittir; her P dalgası QRS ile 1:1 eşleşir (düşen vuru yoktur).', descEn: 'Constant prolonged PR interval >0.20 seconds (>1 large box) with 1:1 AV conduction and no dropped QRS complexes.' },
  { id: 'R23', col: 2, hr: 48, tr: '2° AV Blok Tip I', en: '2° AVB Type I', titleTr: '2. Derece AV Blok Tip I (Wenckebach / Mobitz I)', titleEn: 'Second Degree AV Block Type I (Wenckebach)', descTr: 'PR aralığı her siklusta kademeli olarak uzar ve sonunda bir P dalgası ventriküle iletilemez (QRS düşer → grup vuruları). Genellikle AV düğüm düzeyindedir.', descEn: 'Cyclical progressive lengthening of the PR interval followed by a dropped QRS complex (grouped beating).' },
  { id: 'R24', col: 2, hr: 60, tr: '2° AV Blok Tip II', en: '2° AVB Type II', titleTr: '2. Derece AV Blok Tip II (Mobitz II)', titleEn: 'Second Degree AV Block Type II (Mobitz II)', descTr: 'İletilen vurularda PR aralığı SABİTTİR (uzama yoktur), ancak aralıklı olarak P dalgası sonrası QRS düşer. His-Purkinje düzeyinde ciddi bloktur; tam bloğa ilerleyebilir (Pacemaker gerekir!).', descEn: 'Fixed PR intervals on conducted beats with sudden intermittent dropped QRS complexes. Infra-nodal block requiring pacemaker.' },
  { id: 'R11', col: 2, hr: 38, tr: '2° AV Blok (2:1 İletim)', en: '2° AVB 2:1', titleTr: '2:1 İletimli 2. Derece AV Blok', titleEn: 'Second Degree AV Block with 2:1 Conduction', descTr: 'Her iki P dalgasından yalnızca biri QRS oluşturur (2 P : 1 QRS). İletilen vurularda PR aralığı sabittir; belirgin bradikardi ve düşük debi riski taşır.', descEn: 'Every alternate P wave is blocked (2 P waves per 1 QRS complex) with a constant PR interval on conducted beats.' },
  { id: 'R25', col: 2, hr: 36, tr: '3° Tam AV Blok', en: '3° AV Block', titleTr: '3. Derece (Tam) AV Blok · AV Disosiyasyon', titleEn: 'Third Degree (Complete) AV Block', descTr: 'Yalnız (lonely) P dalgaları kendi hızında yürürken ventriküller bağımsız yavaş bir kaçış odağıyla (30–40/dk) çalışır; PR aralıkları tamamen kaotiktir (AV disosiyasyon).', descEn: 'Complete AV dissociation with independent "lonely" P waves, chaotic PR relationships, and a slow ventricular/junctional escape rhythm.' },

  // Col 3: Junctional & Wandering (5)
  { id: 'R12', col: 3, hr: 84, tr: 'NSR + PJC (Kavşak Ekstra)', en: 'NSR with PJC', titleTr: 'Prematüre Kavşak Kompleksi (PJC)', titleEn: 'Premature Junctional Complex (PJC)', descTr: 'AV kavşaktaki irritabl odaktan erken çıkan dar QRS: Derivasyon II’de P dalgası negatiftir (ters), QRS içine gizlenmiştir veya PR < 0.12 sn kısadır.', descEn: 'Early narrow QRS complex arising from the AV junction with an inverted or absent P wave in Lead II (or PR <0.12 s).' },
  { id: 'R13', col: 3, hr: 48, tr: 'Kavşak (Junctional) Ritmi', en: 'Junctional Rhythm', titleTr: 'Kavşak Kaçış Ritmi (Junctional · 40–60/dk)', titleEn: 'Junctional Escape Rhythm (40–60/min)', descTr: 'SA düğüm sustuğunda AV kavşağın doğal kaçış hızıyla (40–60/dk) ritmi devralmasıdır. Derivasyon II’de P dalgası yoktur veya negatif (retrograd) olup QRS dar görünür.', descEn: 'AV junction escape pacemaker firing at 40–60/min with absent or inverted P waves in Lead II and narrow QRS complexes.' },
  { id: 'R14', col: 3, hr: 82, tr: 'Hızlanmış Kavşak Ritmi', en: 'Accel Junctional', titleTr: 'Hızlanmış Kavşak Ritmi (60–100/dk)', titleEn: 'Accelerated Junctional Rhythm (60–100/min)', descTr: 'AV kavşak otomatizmasının artmasıyla (digoksin toksisitesi, iskemi, katekolaminler) kavşak hızının 60–100/dk arasına çıkmasıdır; negatif/gizli P ve dar QRS izlenir.', descEn: 'Enhanced AV junctional automaticity at 60–100/min with inverted/absent P waves and narrow QRS.' },
  { id: 'R15', col: 3, hr: 186, tr: 'Kavşak Taşikardisi (JT)', en: 'Junctional Tachy', titleTr: 'Kavşak Taşikardisi (Junctional Tachycardia >100/dk)', titleEn: 'Junctional Tachycardia (>100/min)', descTr: 'AV kavşaktan kaynaklanan >100/dk (burada 186/dk) hızlı ritim; her dar QRS kompleksinin hemen içinde/sonunda ters (negatif) P dalgası seçilir.', descEn: 'Rapid AV junctional rhythm (>100/min) with inverted retrograde P waves buried in or just after each narrow QRS.' },
  { id: 'R27', col: 3, hr: 78, tr: 'Gezici Kalp Pili (Wandering)', en: 'Wandering Pacemaker', titleTr: 'Gezici Atriyal Pacemaker (Wandering Pacemaker)', titleEn: 'Wandering Atrial Pacemaker (WAP)', descTr: 'Uyarı odağının SA düğüm, atriyumlar ve AV kavşak arasında gezmesi sonucu EN AZ 3 FARKLI P DALGA MORFOLOJİSİ (pozitif, düz/izoelektrik, negatif) ve değişen PR aralıkları görülür (<100/dk; >100/dk ise MAT denir).', descEn: 'Pacemaker shifts between SA node, atria, and AV junction producing ≥3 distinct P-wave morphologies with narrow QRS.' },

  // Col 4: Ventricular & Paced Ventricular (6)
  { id: 'R16', col: 4, hr: 68, tr: 'NSR + PVC (Ventriküler Ekstra)', en: 'NSR with PVC', titleTr: 'Sinüs Ritmi + Prematüre Ventriküler Kompleks (PVC / VES)', titleEn: 'Sinus Rhythm with Premature Ventricular Complex (PVC)', descTr: 'Ventrikülden erken çıkan geniş ve tuhaf şekilli QRS (≥0.12 sn), ST-T dalgası ana QRS yönünün tersinedir (diskordan) ve tam kompanzatuvar duraklama izlenir.', descEn: 'Early wide bizarre QRS complex (≥0.12 s) without a preceding P wave and with a discordant T wave.' },
  { id: 'R17', col: 4, hr: 36, tr: 'İdiyoventriküler Ritim (IVR)', en: 'Idioventricular', titleTr: 'İdiyoventriküler Kaçış Ritmi (IVR · 20–40/dk)', titleEn: 'Idioventricular Rhythm (IVR · 20–40/min)', descTr: 'SA ve AV düğüm devre dışı kaldığında Purkinje/ventrikül kaçış odağının 20–40/dk hızda geniş QRS’li düzenli vurular üretmesidir (Atropin verilmez, hızlandırıcı ajan/pacing uygulanır).', descEn: 'Ventricular escape rhythm at 20–40/min with regular wide QRS complexes and absent P waves.' },
  { id: 'R18', col: 4, hr: 84, tr: 'Hızlanmış IVR (AIVR)', en: 'Accelerated IVR', titleTr: 'Hızlanmış İdiyoventriküler Ritim (AIVR · 41–100/dk)', titleEn: 'Accelerated Idioventricular Rhythm (AIVR · 41–100/min)', descTr: '41–100/dk hızda düzenli geniş QRS’li ventriküler ritim. Miyokard enfarktüsünde tromboliz/PCI sonrası koroner reperfüzyonun klasik göstergesidir; genellikle selimdir.', descEn: 'Ventricular rhythm at 41–100/min (faster than IVR, slower than VT), classic after coronary reperfusion.' },
  { id: 'R19', col: 4, hr: 210, tr: 'Ventriküler Taşikardi (VT)', en: 'VTach', titleTr: 'Monomorfik Ventriküler Taşikardi (VTach)', titleEn: 'Ventricular Tachycardia (VTach)', descTr: 'Hızlı (>100/dk, burada 210/dk), düzenli, geniş QRS’li ventriküler taşikardi. Hemodinamik bozulma ve VF’ye dönüşüm riski yüksektir! Nabızlı/stabilse Amiodaron veya Senkronize Kardiyoversiyon; nabızsızsa Defibrilasyon!', descEn: 'Rapid wide-QRS ventricular tachycardia risking hemodynamic collapse and transition into VFib.' },
  { id: 'R20', col: 4, hr: 0, tr: 'Ventriküler Fibrilasyon (VF)', en: 'VFib', titleTr: 'Ventriküler Fibrilasyon (VFib · Kardiyak Arrest)', titleEn: 'Ventricular Fibrillation (VFib)', descTr: 'Ventriküllerde organize kasılma ve QRS olmaksızın kaotik elektriksel titreşim (kalp debisi = 0). Kaba (coarse ≥3 mm) VF defibrilasyona daha iyi yanıt verir; derhal KPR + Defibrilasyon!', descEn: 'Chaotic ventricular electrical activity with zero cardiac output. Immediate CPR and unsynchronized defibrillation required!' },
  { id: 'R26', col: 4, hr: 80, tr: 'Ventriküler Kalp Pili (VVI)', en: 'Paced Ventricular', titleTr: 'Ventriküler Pace Ritmi (VVI Pacemaker)', titleEn: 'Paced Ventricular Rhythm', descTr: 'Elektronik kalp pilinin doğrudan ventrikülü uyarması: Her geniş QRS kompleksinin hemen önünde keskin dikey bir "pace spike" çizgisi ve ardından geniş QRS + diskordan T dalgası görülür.', descEn: 'Electronic ventricular pacing showing a sharp vertical pacemaker spike immediately preceding each wide QRS complex.' }
];

// Synthesize authentic Lead II voltage (mV) at time tSec for any of the 27 SkillStat Classic rhythms
export function sampleSkillStatLeadIIMv(rhyId, tSec) {
  const gauss = (x, mu, s, a) => a * Math.exp(-0.5 * Math.pow((x - mu) / s, 2));
  const stdBeat = (p, pAmp = 0.14, pMu = 0.16, qrsW = 0.012, rAmp = 0.92, tAmp = 0.26) => {
    let v = 0;
    if (pAmp !== 0) v += gauss(p, pMu, 0.024, pAmp);
    v += gauss(p, 0.285, 0.008, -0.09);
    v += gauss(p, 0.30, qrsW, rAmp);
    v += gauss(p, 0.316, 0.009, -0.18);
    v += gauss(p, 0.48, 0.042, tAmp);
    return v;
  };
  const wideVentBeat = (p, rAmp = 0.95) => {
    return gauss(p, 0.28, 0.018, 0.22) + gauss(p, 0.32, 0.032, rAmp) + gauss(p, 0.365, 0.022, -0.45) + gauss(p, 0.52, 0.055, -0.35);
  };

  if (rhyId === 'R20') {
    // VFib
    return 0.42 * Math.sin(tSec * 23) * Math.cos(tSec * 11) + 0.26 * Math.sin(tSec * 37 + 1.2);
  }
  if (rhyId === 'R19') {
    // VTach (210 bpm)
    const p = (tSec / (60 / 210)) % 1;
    return wideVentBeat(p, 1.05);
  }
  if (rhyId === 'R17') {
    // Idioventricular (36 bpm)
    const p = (tSec / (60 / 36)) % 1;
    return wideVentBeat(p, 0.92);
  }
  if (rhyId === 'R18') {
    // Accelerated IVR (84 bpm)
    const p = (tSec / (60 / 84)) % 1;
    return wideVentBeat(p, 0.92);
  }
  if (rhyId === 'R26') {
    // Paced Ventricular (80 bpm): sharp vertical spike before wide QRS
    const p = (tSec / (60 / 80)) % 1;
    const spike = gauss(p, 0.245, 0.0032, 1.15) + gauss(p, 0.250, 0.0032, -0.45);
    return spike + wideVentBeat(p, 0.88);
  }
  if (rhyId === 'R28') {
    // Paced Atrial (60 bpm): sharp vertical spike before P wave + narrow QRS
    const p = (tSec / 1.0) % 1;
    const spike = gauss(p, 0.125, 0.0032, 0.95) + gauss(p, 0.130, 0.0032, -0.35);
    return spike + stdBeat(p, 0.15, 0.16);
  }
  if (rhyId === 'R4') {
    // Sinus Arrhythmia: respiratory cycle warps time smoothly
    const warped = tSec + 0.22 * Math.sin(tSec * 1.05);
    const p = (warped / (60 / 78)) % 1;
    return stdBeat(p);
  }
  if (rhyId === 'R5') {
    // Sinus Exit Block: every 4th beat is dropped (exact 2x P-P pause!)
    const rr = 60 / 72;
    const beatIdx = Math.floor(tSec / rr);
    const p = (tSec % rr) / rr;
    if (beatIdx % 4 === 2) return 0;
    return stdBeat(p);
  }
  if (rhyId === 'R6') {
    // Sinus Arrest: non-multiple pause (1.65x P-P)
    const cycleSec = (tSec % 4.65);
    const beats = [0.1, 0.92, 1.74, 3.25, 4.07];
    let v = 0;
    for (const b0 of beats) {
      const p = (cycleSec - b0) / 0.82;
      if (p >= 0 && p < 1) v += stdBeat(p);
    }
    return v;
  }
  if (rhyId === 'R7') {
    // NSR with PAC: early beat with peaked abnormal P' wave
    const cycleSec = (tSec % 3.4);
    const beats = [
      { t: 0.05, pAmp: 0.14, pMu: 0.16 },
      { t: 0.88, pAmp: 0.14, pMu: 0.16 },
      { t: 1.42, pAmp: 0.24, pMu: 0.18 }, // Premature Atrial Complex (PAC)
      { t: 2.48, pAmp: 0.14, pMu: 0.16 }
    ];
    let v = 0;
    for (const b of beats) {
      const p = (cycleSec - b.t) / 0.82;
      if (p >= 0 && p < 1) v += stdBeat(p, b.pAmp, b.pMu);
    }
    return v;
  }
  if (rhyId === 'R12') {
    // NSR with PJC: early narrow beat with inverted P wave and short PR
    const cycleSec = (tSec % 3.4);
    const beats = [
      { t: 0.05, pAmp: 0.14, pMu: 0.16 },
      { t: 0.88, pAmp: 0.14, pMu: 0.16 },
      { t: 1.44, pAmp: -0.15, pMu: 0.22 }, // Premature Junctional Complex (PJC)
      { t: 2.48, pAmp: 0.14, pMu: 0.16 }
    ];
    let v = 0;
    for (const b of beats) {
      const p = (cycleSec - b.t) / 0.82;
      if (p >= 0 && p < 1) v += stdBeat(p, b.pAmp, b.pMu);
    }
    return v;
  }
  if (rhyId === 'R16') {
    // NSR with PVC: every 3rd beat is an early wide PVC
    const cycleSec = (tSec % 3.5);
    const sinusTs = [0.05, 0.90, 2.55];
    let v = 0;
    for (const t0 of sinusTs) {
      const p = (cycleSec - t0) / 0.82;
      if (p >= 0 && p < 1) v += stdBeat(p);
    }
    const pvcP = (cycleSec - 1.46) / 0.82;
    if (pvcP >= 0 && pvcP < 1) v += wideVentBeat(pvcP, 1.05);
    return v;
  }
  if (rhyId === 'R8') {
    // SVT (180 bpm): narrow rapid regular, P buried
    const p = (tSec / (60 / 180)) % 1;
    return stdBeat(p, 0, 0.16, 0.011, 0.95, 0.24);
  }
  if (rhyId === 'R9') {
    // Atrial Fibrillation
    const fWave = 0.065 * (Math.sin(tSec * 36) + 0.65 * Math.cos(tSec * 59));
    const cycleSec = (tSec % 3.8);
    const rTimes = [0.12, 0.62, 1.38, 1.84, 2.72, 3.25];
    let v = fWave;
    for (const t0 of rTimes) {
      const p = (cycleSec - t0) / 0.7;
      if (p >= 0 && p < 1) v += stdBeat(p, 0);
    }
    return v;
  }
  if (rhyId === 'R10') {
    // Atrial Flutter (4:1 at 75 bpm): sawtooth F waves at 300/min (5 Hz)
    const saw = ((tSec * 5.0) % 1) - 0.5;
    const rr = 60 / 75;
    const p = (tSec % rr) / rr;
    return -0.17 * saw + stdBeat(p, 0, 0.16, 0.012, 0.90, 0.18);
  }
  if (rhyId === 'R22') {
    // NSR with 1st degree AVB (PR = 0.28s)
    const rr = 60 / 74;
    const p = (tSec % rr) / rr;
    return stdBeat(p, 0.15, 0.07);
  }
  if (rhyId === 'R23') {
    // 2° AVB Type I (Wenckebach)
    const rr = 60 / 72;
    const beatIdx = Math.floor(tSec / rr);
    const p = (tSec % rr) / rr;
    const step = beatIdx % 4;
    const pWave = gauss(p, 0.12, 0.024, 0.15);
    if (step === 3) return pWave; // Dropped QRS
    const qrsShift = step * 0.055;
    return pWave + gauss(p, 0.28 + qrsShift, 0.012, 0.92) - gauss(p, 0.296 + qrsShift, 0.009, 0.18) + gauss(p, 0.46 + qrsShift, 0.04, 0.25);
  }
  if (rhyId === 'R24') {
    // 2° AVB Type II (fixed PR, dropped every 4th QRS)
    const rr = 60 / 75;
    const beatIdx = Math.floor(tSec / rr);
    const p = (tSec % rr) / rr;
    if (beatIdx % 4 === 3) return gauss(p, 0.16, 0.024, 0.15);
    return stdBeat(p, 0.15, 0.16);
  }
  if (rhyId === 'R11') {
    // 2° AVB 2:1 (every 2nd P dropped)
    const pRr = 60 / 76;
    const beatIdx = Math.floor(tSec / pRr);
    const p = (tSec % pRr) / pRr;
    if (beatIdx % 2 === 1) return gauss(p, 0.16, 0.024, 0.15);
    return stdBeat(p, 0.15, 0.16);
  }
  if (rhyId === 'R25') {
    // 3° Complete AV Block: P waves at 82 bpm, escape QRS at 36 bpm
    const pPhase = (tSec / (60 / 82)) % 1;
    const vPhase = (tSec / (60 / 36)) % 1;
    return gauss(pPhase, 0.20, 0.024, 0.16) + wideVentBeat(vPhase, 0.88);
  }
  if (rhyId === 'R13' || rhyId === 'R14' || rhyId === 'R15') {
    // Junctional Rhythm (48), Accel Junctional (82), Junctional Tachy (186): inverted P in Lead II
    const rate = rhyId === 'R13' ? 48 : rhyId === 'R14' ? 82 : 186;
    const rr = 60 / rate;
    const p = (tSec % rr) / rr;
    return stdBeat(p, -0.14, 0.22);
  }
  if (rhyId === 'R27') {
    // Wandering Pacemaker: P wave cycles through upright (+0.16), flat/biphasic (0.02), and inverted (-0.15)
    const rr = 60 / 78;
    const beatIdx = Math.floor(tSec / rr);
    const p = (tSec % rr) / rr;
    const pAmps = [0.16, 0.03, -0.15, 0.11];
    const pMus = [0.15, 0.18, 0.21, 0.16];
    return stdBeat(p, pAmps[beatIdx % 4], pMus[beatIdx % 4]);
  }

  // Default Sinus Rhythm (R1: 72, R2: 48, R3: 138)
  const rhy = SKILLSTAT_27_RHYTHMS.find(r => r.id === rhyId) || SKILLSTAT_27_RHYTHMS[0];
  const rr = 60 / Math.max(30, rhy.hr || 72);
  const p = (tSec % rr) / rr;
  return stdBeat(p);
}

const LEAD_NAMES_12 = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
const LEAD_ANGLES = { I: 0, II: 60, III: 120, aVR: -150, aVL: -30, aVF: 90, V1: -115, V2: -75, V3: -35, V4: 10, V5: 35, V6: 50 };

function loadStudyState() {
  try {
    const raw = localStorage.getItem('ecglens_premium_study_v1');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { answered: {}, missedIds: [], tags: {} };
}

function saveStudyState(st) {
  try {
    localStorage.setItem('ecglens_premium_study_v1', JSON.stringify(st));
  } catch (_) {}
}

// Synthesize single-cycle voltage (mV) for any lead and clinical condition at phase t in [0, 1)
export function sampleConditionLeadMv(cond, lead, phase, beatIndex = 0, hrOverride = null) {
  const m = cond.morph || {};
  const hr = hrOverride || cond.hr || 72;

  // Ventricular fibrillation: chaotic multi-sine oscillation
  if (m.vfib) {
    const t = (beatIndex + phase) * 6.283;
    return 0.42 * Math.sin(t * 3.7) * Math.cos(t * 1.9) + 0.25 * Math.sin(t * 6.3 + 1.1);
  }

  // Torsades de Pointes: twisting polymorphic envelope
  if (m.torsades) {
    const t = (beatIndex + phase) * 6.283;
    const env = Math.sin(t * 0.45);
    return 0.85 * env * Math.sin(t * 4.2);
  }

  const gauss = (x, mu, s, a) => a * Math.exp(-0.5 * Math.pow((x - mu) / s, 2));

  // Lead projection polarity factor
  const axisRad = ((cond.axis || 58) * Math.PI) / 180;
  const leadDeg = LEAD_ANGLES[lead] ?? 60;
  const leadRad = (leadDeg * Math.PI) / 180;
  let proj = Math.cos(axisRad - leadRad);
  if (lead === 'V1') proj = -0.65;
  else if (lead === 'V2') proj = -0.35;
  else if (lead === 'V3') proj = 0.15;
  else if (lead === 'V4') proj = 0.72;
  else if (lead === 'V5') proj = 0.92;
  else if (lead === 'V6') proj = 0.85;

  let v = 0;

  // 1. Atrial activity (P wave or Flutter or Fibrillation)
  const prShift = ((m.prMs || cond.pr || 160) - 160) / 1000;
  const pCenter = Math.max(0.08, 0.16 - prShift * 0.45);

  if (m.afib) {
    // Integer harmonics (5 and 8 cycles per beat) ensure C-infinity phase continuity across every beat boundary
    const fTheta = (beatIndex + phase) * 6.283185307179586;
    const fAmp = lead === 'V1' || lead === 'II' ? 0.062 : 0.036;
    v += fAmp * (Math.sin(fTheta * 5) + 0.55 * Math.cos(fTheta * 8));
  } else if (m.flutter) {
    const saw = ((phase * 4) % 1);
    const fSign = ['II', 'III', 'aVF'].includes(lead) ? -1 : lead === 'V1' ? 1 : -0.4;
    v += fSign * (0.16 * (saw - 0.5));
  } else if (m.chb) {
    // Dissociated P waves marching through at independent rate
    const pPhase = ((beatIndex * 1.73 + phase * 1.73) % 1);
    const pPol = lead === 'aVR' ? -1 : 1;
    v += gauss(pPhase, 0.2, 0.025, 0.14 * pPol);
  } else if (!m.avnrt && !m.vt) {
    const pPol = lead === 'aVR' ? -1 : lead === 'V1' ? 0.4 : 1;
    let pMu = pCenter;
    if (m.mobitz1) {
      const cycle = beatIndex % 4;
      pMu = Math.max(0.05, 0.17 - cycle * 0.035);
    }
    v += gauss(phase, pMu, 0.024, 0.13 * pPol);
    if (lead === 'V1') v += gauss(phase, pMu + 0.022, 0.018, -0.07);
  }

  // Dropped QRS check for Mobitz I (every 4th beat) or Mobitz II (every 3rd beat)
  if ((m.mobitz1 && (beatIndex % 4 === 3)) || (m.mobitz2 && (beatIndex % 3 === 2))) {
    return v;
  }

  // PR depression in Pericarditis
  if (m.pericarditis && phase > 0.18 && phase < 0.27) {
    v += (lead === 'aVR' || lead === 'V1') ? 0.08 : -0.08;
  }

  // 2. QRS Complex
  const qrsCenter = 0.30;
  let qrsScale = 1.0;
  if (m.alternans) {
    qrsScale = (beatIndex % 2 === 0) ? 0.82 : 0.42;
  } else if (m.lvh && ['V1', 'V2', 'V5', 'V6', 'I', 'aVL'].includes(lead)) {
    qrsScale = 1.65;
  }

  // WPW Delta wave slurred upstroke
  if (m.wpw) {
    v += gauss(phase, qrsCenter - 0.032, 0.022, 0.32 * Math.sign(proj || 1));
  }

  if (m.rbbb) {
    if (lead === 'V1' || lead === 'V2') {
      // rsR' rabbit ears in V1-V2
      v += gauss(phase, qrsCenter - 0.018, 0.011, 0.28);
      v += gauss(phase, qrsCenter, 0.012, -0.22);
      v += gauss(phase, qrsCenter + 0.028, 0.018, 0.78);
    } else if (['I', 'aVL', 'V5', 'V6'].includes(lead)) {
      // Wide slurred S in lateral leads
      v += gauss(phase, qrsCenter - 0.01, 0.013, 0.75);
      v += gauss(phase, qrsCenter + 0.028, 0.022, -0.38);
    } else {
      v += gauss(phase, qrsCenter, 0.016, 0.75 * proj);
    }
  } else if (m.lbbb) {
    if (['V1', 'V2', 'V3'].includes(lead)) {
      // Deep broad QS in V1-V3
      v += gauss(phase, qrsCenter + 0.01, 0.026, -1.05);
    } else if (['I', 'aVL', 'V5', 'V6'].includes(lead)) {
      // Broad notched monophasic R in lateral leads
      v += gauss(phase, qrsCenter - 0.012, 0.016, 0.72);
      v += gauss(phase, qrsCenter + 0.024, 0.018, 0.78);
    } else {
      v += gauss(phase, qrsCenter + 0.008, 0.024, 0.75 * proj);
    }
  } else if (m.vt) {
    // Wide bizarre ventricular complex
    const vtPol = lead === 'aVR' ? 1 : -0.85;
    v += gauss(phase, qrsCenter, 0.036, 1.05 * vtPol);
  } else if (m.hyperK) {
    // Broadened QRS in hyperkalemia
    v += gauss(phase, qrsCenter, 0.028, 0.72 * proj);
  } else {
    // Standard narrow QRS with optional pathological Q or tall R in V1-V2
    if (m.qAnt && ['V1', 'V2', 'V3', 'V4'].includes(lead)) {
      v += gauss(phase, qrsCenter - 0.014, 0.014, -0.55);
      v += gauss(phase, qrsCenter + 0.006, 0.013, 0.35);
    } else if (m.aneurysm && ['V1', 'V2', 'V3', 'V4'].includes(lead)) {
      v += gauss(phase, qrsCenter, 0.020, -0.95);
    } else if (m.postMi && ['V1', 'V2', 'V3'].includes(lead)) {
      // Tall broad R wave in V1-V3 (mirror of posterior Q)
      v += gauss(phase, qrsCenter - 0.004, 0.015, 0.82);
      v += gauss(phase, qrsCenter + 0.018, 0.013, -0.22);
    } else if (m.pe && (lead === 'I' || lead === 'III')) {
      // S1Q3T3 pattern
      if (lead === 'I') {
        v += gauss(phase, qrsCenter - 0.008, 0.012, 0.55);
        v += gauss(phase, qrsCenter + 0.014, 0.014, -0.48);
      } else {
        v += gauss(phase, qrsCenter - 0.015, 0.013, -0.38);
        v += gauss(phase, qrsCenter + 0.004, 0.013, 0.62);
      }
    } else if (m.arvcHcm && ['I', 'aVL', 'V5', 'V6'].includes(lead)) {
      // Deep narrow "dagger Q" in lateral leads
      v += gauss(phase, qrsCenter - 0.016, 0.009, -0.52);
      v += gauss(phase, qrsCenter + 0.002, 0.014, 1.15);
    } else {
      v += gauss(phase, qrsCenter - 0.015, 0.010, -0.09 * Math.sign(proj || 1));
      v += gauss(phase, qrsCenter, 0.015, 0.92 * proj * qrsScale);
      v += gauss(phase, qrsCenter + 0.016, 0.011, -0.18 * Math.sign(proj || 1));
    }

    // AVNRT pseudo-r' in V1 / pseudo-S in II/III/aVF
    if (m.avnrt) {
      if (lead === 'V1') v += gauss(phase, qrsCenter + 0.026, 0.008, 0.24);
      if (['II', 'III', 'aVF'].includes(lead)) v += gauss(phase, qrsCenter + 0.026, 0.008, -0.24);
    }

    // ARVC Epsilon wave in V1-V3
    if (m.arvcHcm && ['V1', 'V2', 'V3'].includes(lead)) {
      v += gauss(phase, qrsCenter + 0.036, 0.007, 0.16);
    }

    // TCA / Na+ block terminal R wave in aVR
    if (m.naBlock && lead === 'aVR') {
      v += gauss(phase, qrsCenter + 0.024, 0.016, 0.46);
    }

    // SSS / PCCD (SCN5A loss-of-function): broadened notched QRS conduction delay
    if (m.sssPccd) {
      v += gauss(phase, qrsCenter + 0.022, 0.016, -0.26 * Math.sign(proj || 1));
    }

    // Early Repolarization Syndrome (ERS: KCNJ8 / CACNA1C): fish-hook J-wave notch at QRS-ST junction
    if (m.ersJWave && ['II', 'III', 'aVF', 'V4', 'V5', 'V6'].includes(lead)) {
      v += gauss(phase, qrsCenter + 0.024, 0.0085, 0.26);
      v += gauss(phase, 0.38, 0.048, 0.12);
    }
  }

  // 3. ST Segment & T Wave
  let stShift = 0;
  if (m.stV1V4 && ['V1', 'V2', 'V3', 'V4'].includes(lead)) stShift = m.stV1V4;
  if (m.stInf && ['II', 'III', 'aVF'].includes(lead)) stShift = m.stInf;
  if (m.stLat && ['I', 'aVL', 'V5', 'V6'].includes(lead)) stShift = m.stLat;
  if (m.stAvr && lead === 'aVR') stShift = m.stAvr;
  if (m.pericarditis) {
    stShift = (lead === 'aVR' || lead === 'V1') ? -0.14 : 0.18;
  }
  if (m.brugada && (lead === 'V1' || lead === 'V2')) {
    // Coved STE descending into inverted T
    v += gauss(phase, 0.37, 0.045, 0.38);
    v += gauss(phase, 0.47, 0.035, -0.28);
    return v;
  }
  if (m.aneurysm && ['V1', 'V2', 'V3', 'V4'].includes(lead)) {
    stShift = 0.22;
  }

  // Apply ST plateau between QRS end and T peak
  if (stShift !== 0) {
    v += gauss(phase, 0.39, 0.055, stShift);
  }

  // Digoxin scooped ST ("Salvador Dali mustache")
  if (m.digoxin && ['I', 'II', 'V4', 'V5', 'V6'].includes(lead)) {
    v += gauss(phase, 0.38, 0.045, -0.18);
  }

  // T-wave center & morphology
  let tCenter = 0.48;
  let tWidth = 0.042;
  let tAmp = 0.28 * Math.sign(proj || 1);
  if (lead === 'aVR') tAmp = -0.24;

  // Channelopathy-specific repolarization (LQT1/JLN, LQT2 bifid, LQT3 late, LQTS8 Timothy alternans, ATS1/LQT7 U wave, SQTS)
  if (m.lqt2Bifid) {
    // LQT2 (KCNH2 / KCNE2 ↓IKr): notched / bifid double-humped T wave
    const pol = lead === 'aVR' ? -1 : Math.sign(proj || 1);
    v += gauss(phase, 0.51, 0.032, 0.19 * pol);
    v += gauss(phase, 0.60, 0.034, 0.24 * pol);
    return v;
  }
  if (m.lqt3Late) {
    // LQT3 (SCN5A late ↑INa,L): long flat isoelectric ST segment + late narrow peaked T wave
    tCenter = 0.64;
    tWidth = 0.032;
    tAmp = (lead === 'aVR' ? -0.34 : 0.38 * Math.sign(proj || 1));
  } else if (m.timothyAlternans) {
    // LQTS8 Timothy syndrome (CACNA1C ↑ICa,L): extreme QT prolongation + beat-to-beat macroscopic T-wave alternans
    tCenter = 0.63;
    tWidth = 0.054;
    const altPol = (beatIndex % 2 === 0) ? 1 : -0.65;
    tAmp = 0.44 * altPol * (lead === 'aVR' ? -1 : Math.sign(proj || 1));
  } else if (m.ats1UWave) {
    // Andersen-Tawil (LQTS7 / ATS1 / CPVT3: KCNJ2 ↓IK1): normal-width T wave + prominent giant U wave at 0.64
    tCenter = 0.47;
    tWidth = 0.038;
    const uPol = lead === 'aVR' ? -1 : 1;
    v += gauss(phase, 0.63, 0.042, 0.28 * uPol);
  } else if (m.lqts) {
    // LQT1 / JLN1-2 (KCNQ1 / KCNE1 ↓IKs): broad-based prolonged T wave
    tCenter = 0.57;
    tWidth = 0.068;
    tAmp = (lead === 'aVR' ? -0.30 : 0.34 * Math.sign(proj || 1));
  } else if (m.sqts) {
    // SQTS1-3 (KCNH2 / KCNQ1 / KCNJ2 ↑IK): virtually absent ST segment + tall narrow peaked T wave
    tCenter = 0.375;
    tWidth = 0.021;
    tAmp = 0.54 * Math.sign(proj || 1);
  }

  if (m.hyperT && ['V1', 'V2', 'V3', 'V4'].includes(lead)) {
    tAmp = 0.58;
    tWidth = 0.045;
  } else if (m.deWinter && ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'].includes(lead)) {
    tAmp = 0.64;
    tWidth = 0.036;
  } else if (m.wellens && ['V2', 'V3', 'V4'].includes(lead)) {
    // Biphasic then deep symmetric inverted T
    v += gauss(phase, 0.42, 0.022, 0.14);
    tAmp = -0.45;
    tCenter = 0.49;
  } else if (m.hyperK) {
    // Tall narrow-based tented T wave
    tAmp = lead === 'aVR' ? -0.55 : 0.68;
    tWidth = 0.024;
  } else if (m.hypoK) {
    // Flattened T + Prominent U wave at 0.62
    tAmp = 0.08 * Math.sign(proj || 1);
    v += gauss(phase, 0.59, 0.038, 0.22 * Math.sign(proj || 1));
  } else if (m.postMi && ['V1', 'V2', 'V3'].includes(lead)) {
    tAmp = 0.38;
  } else if ((m.pe || m.arvcHcm || m.rbbb) && ['V1', 'V2', 'V3'].includes(lead)) {
    tAmp = -0.28;
  } else if (m.lvh && ['I', 'aVL', 'V5', 'V6'].includes(lead)) {
    v += gauss(phase, 0.40, 0.04, -0.14);
    tAmp = -0.32;
  } else if (m.lbbb && !m.sgarbossa) {
    // Appropriate discordance in LBBB
    tAmp = ['V1', 'V2', 'V3'].includes(lead) ? 0.32 : -0.28;
    v += gauss(phase, 0.39, 0.05, ['V1', 'V2', 'V3'].includes(lead) ? 0.16 : -0.14);
  }

  v += gauss(phase, tCenter, tWidth, tAmp);
  return v;
}

// ============================================================================
// CARDIAC CHANNELOPATHIES ATLAS — PHASE 0–4 ION CURRENTS, GENES & SYNDROMES
// ============================================================================

export const CHANNELOPATHY_ACRONYMS = [
  { code: 'AF', en: 'Atrial fibrillation (AF1, AF2, FA3, AF4, AF5, AF7, AF10)', tr: 'Ailesel Atriyal Fibrilasyon (AF1–AF10)' },
  { code: 'BrS', en: 'Brugada syndrome (BrS1: SCN5A, BrS5: KCNE3, KCND3)', tr: 'Brugada Sendromu (BrS1, BrS5)' },
  { code: 'ERS', en: 'Early repolarization syndrome (KCNJ8, CACNA1C)', tr: 'Erken Repolarizasyon Sendromu (J Dalgası)' },
  { code: 'JLN', en: 'Jervell and Lange-Nielsen syndrome (JLN1: KCNQ1, JLN2: KCNE1)', tr: 'Jervell ve Lange-Nielsen Sendromu (Uzun QT + Sağırlık)' },
  { code: 'LQT', en: 'Long QT syndrome (LQTS1–3, LQTS5–8, LQTS13)', tr: 'Uzun QT Sendromu (LQTS1–13)' },
  { code: 'SQT', en: 'Short QT syndrome (SQTS1: KCNH2, SQT2: KCNQ1, SQT3: KCNJ2)', tr: 'Kısa QT Sendromu (SQTS1–3)' },
  { code: 'SIDS', en: 'Sudden Infant Death Syndrome (SCN5A, KCNH2, KCNE2, KCNQ1)', tr: 'Ani Bebek Ölümü Sendromu (SIDS)' },
  { code: 'SSS', en: 'Sick Sinus Syndrome (SCN5A)', tr: 'Hasta Sinüs Sendromu (SSS)' },
  { code: 'PCCD', en: 'Progressive cardiac conduction Disease (SCN5A / Lenègre-Lev)', tr: 'İlerleyici Kardiyak İletim Hastalığı (PCCD)' },
  { code: 'ATS1 / CPVT3', en: 'Andersen-Tawil Syndrome 1 & Catecholaminergic Polymorphic VT 3 (KCNJ2)', tr: 'Andersen-Tawil (ATS1) & Bidireksiyonel VT (CPVT3)' }
];

export const CARDIAC_CHANNELOPATHY_NODES = [
  {
    id: 'phase0_ina',
    phase: 'Phase 0',
    current: 'INa',
    direction: 'inward', // Red channel: Na+ influx
    genes: ['SCN5A'],
    boxLines: ['SCN5A: LQTS (LQT3),', 'BrS1, SIDS, FA3,', 'SSS, PCCD'],
    syndromes: ['LQT3', 'BrS1', 'SIDS', 'FA3 (AF3)', 'SSS', 'PCCD'],
    condId: 'lqt3_scn5a',
    altCondIds: ['brugada_1', 'sss_pccd_af_scn5a'],
    titleTr: 'Faz 0 Hızlı Sodyum Akımı (INa · SCN5A — Nav1.5)',
    titleEn: 'Phase 0 Fast Inward Sodium Current (INa · SCN5A — Nav1.5)',
    mechTr: 'Fonksiyon kaybı (↓INa) Faz 0 çıkış eğimini (dV/dtmax) düşürerek Brugada Tip 1 (BrS1), Hasta Sinüs Sendromu (SSS), İlerleyici İletim Hastalığı (PCCD) ve Ailesel AF (FA3) yapar. İnaktivasyon kusuru (kalıcı geç ↑INa,L) ise Faz 2 platosunu uzatarak LQT3 ve SIDS oluşturur.',
    mechEn: 'Loss-of-function (↓INa) reduces Phase 0 upstroke velocity causing BrS1, SSS, PCCD, and FA3. Gain-of-function persistent late Na+ current (↑INa,L) prolongs the plateau causing LQT3 and SIDS.',
    apOverlayPath: 'M 38 232 L 74 232 L 78 62 L 92 98 C 145 96, 205 98, 250 112 C 276 138, 294 188, 312 232 L 350 232'
  },
  {
    id: 'phase1_ito',
    phase: 'Phase 1',
    current: 'Ito',
    direction: 'outward', // Green channel: K+ efflux
    genes: ['KCNE3', 'KCND3'],
    boxLines: ['KCNE3: BrS5', 'KCND3: BrS'],
    syndromes: ['BrS5', 'BrS (BrS9)'],
    condId: 'brugada_1',
    altCondIds: ['ers_jwave'],
    titleTr: 'Faz 1 Geçici Dışa Potasyum Akımı (Ito · KCNE3 / KCND3 — Kv4.3)',
    titleEn: 'Phase 1 Transient Outward K+ Current (Ito · KCNE3 / KCND3 — Kv4.3)',
    mechTr: 'KCNE3 (BrS5) ve KCND3 (BrS) fonksiyon artışı mutasyonları sağ ventrikül çıkım yolu (RVOT) epikardında Faz 1 Ito çentiğini ("spike-and-dome") derinleştirir; V1–V2’de Coved ST elevasyonu ve Faz-2 reentrisi (VF) yaratır.',
    mechEn: 'Gain-of-function in KCNE3 (BrS5) or KCND3 (BrS) accentuates the epicardial Phase 1 Ito notch in RVOT, creating transmural dispersion and Brugada Type 1 ST elevation in V1–V2.',
    apOverlayPath: 'M 38 232 L 74 232 L 78 58 L 94 136 C 118 98, 152 104, 182 118 C 208 148, 224 195, 244 232 L 350 232'
  },
  {
    id: 'phase2_ica',
    phase: 'Phase 2',
    current: 'INa / ICa,L',
    direction: 'inward', // Red channels: Ca2+ & late Na+ influx
    genes: ['CACNA1C', 'CACNB2b'],
    boxLines: ['Phase 2: LQTS8, BrS, ERS'],
    syndromes: ['LQTS8 (Timothy)', 'BrS3/4', 'ERS'],
    condId: 'lqts8_timothy',
    altCondIds: ['ers_jwave', 'brugada_1'],
    titleTr: 'Faz 2 Plato İçeri Kalsiyum & Geç Sodyum Akımı (ICa,L / INa · CACNA1C)',
    titleEn: 'Phase 2 Plateau Inward Ca2+ & Late Na+ Currents (ICa,L / INa · CACNA1C)',
    mechTr: 'L-tipi Ca2+ kanalı (CACNA1C) fonksiyon artışı (↑ICa,L) Faz 2 platosunu aşırı uzatarak Timothy Sendromu (LQTS8: ekstrem QTc + T alternansı + sindaktili) yapar; fonksiyon kaybı (↓ICa,L) ise platosu çökertip Brugada (BrS) ve Erken Repolarizasyon Sendromu (ERS) oluşturur.',
    mechEn: 'Gain-of-function in L-type Ca2+ current (↑ICa,L) causes Timothy Syndrome (LQTS8) with extreme Phase 2 prolongation and T-wave alternans; loss-of-function (↓ICa,L) causes Brugada (BrS) and Early Repolarization Syndrome (ERS).',
    apOverlayPath: 'M 38 232 L 74 232 L 78 58 L 92 94 C 155 88, 220 92, 265 110 C 292 142, 310 192, 328 232 L 350 232'
  },
  {
    id: 'phase3_ikur',
    phase: 'Early Phase 3',
    current: 'IKur',
    direction: 'outward', // Green channel: K+ efflux
    genes: ['KCNA5'],
    boxLines: ['KCNA5: AF7'],
    syndromes: ['AF7'],
    condId: 'sss_pccd_af_scn5a',
    altCondIds: ['afib'],
    titleTr: 'Erken Faz 3 Ultra-Hızlı Gecikmiş Doğrultucu K+ Akımı (IKur · KCNA5 — Kv1.5)',
    titleEn: 'Early Phase 3 Ultra-Rapid Delayed Rectifier K+ Current (IKur · KCNA5 — Kv1.5)',
    mechTr: 'Atriyal miyokarda özgü Kv1.5 (KCNA5) kanalını kodlar. Mutasyonları atriyal aksiyon potansiyeli süresini ve efektif refrakter periyodu (ERP) bozarak genç yaşta izole Ailesel Atriyal Fibrilasyon Tip 7 (AF7) gelişimine yol açar.',
    mechEn: 'Encodes the atrial-selective Kv1.5 channel. Mutations alter atrial repolarization and effective refractory period (ERP), causing Familial Atrial Fibrillation Type 7 (AF7).',
    apOverlayPath: 'M 38 232 L 74 232 L 78 58 L 92 96 C 118 102, 145 122, 172 156 C 194 188, 210 212, 226 232 L 350 232'
  },
  {
    id: 'phase3_ikr',
    phase: 'Phase 3 (IKr)',
    current: 'IKr',
    direction: 'outward', // Green channel: K+ efflux
    genes: ['KCNH2', 'KCNE2'],
    boxLines: ['KCNH2: LQTS2, SIDS, SQTS1, AF2', 'KCNE2: LQTS6, SIDS, AF5'],
    syndromes: ['LQTS2', 'LQTS6', 'SIDS', 'SQTS1', 'AF2', 'AF5'],
    condId: 'lqt2_kcnh2',
    altCondIds: ['sqts'],
    titleTr: 'Faz 3 Hızlı Gecikmiş Doğrultucu K+ Akımı (IKr · KCNH2 / KCNE2 — hERG)',
    titleEn: 'Phase 3 Rapid Delayed Rectifier K+ Current (IKr · KCNH2 / KCNE2 — hERG)',
    mechTr: 'KCNH2 (hERG alfa alt birimi) ve KCNE2 (MiRP1 beta alt birimi) fonksiyon kaybı (↓IKr) Faz 3 repolarizasyonu yavaşlatarak çentikli (bifid) T dalgalı LQTS2, LQTS6 ve SIDS yapar (ayrıca ilaç ilişkili Uzun QT hedefidir). Fonksiyon artışı (↑IKr) ise SQTS1 ve AF2/AF5 oluşturur.',
    mechEn: 'Loss-of-function in KCNH2 (LQTS2, SIDS) or KCNE2 (LQTS6, SIDS) slows Phase 3 repolarization producing bifid/notched T waves and auditory-triggered TdP. Gain-of-function (↑IKr) causes Short QT (SQTS1) and AF2/AF5.',
    apOverlayPath: 'M 38 232 L 74 232 L 78 58 L 92 96 C 132 98, 174 108, 212 134 C 244 158, 272 196, 302 232 L 350 232'
  },
  {
    id: 'phase3_iks',
    phase: 'Phase 3 (IKs)',
    current: 'IKs',
    direction: 'outward', // Green channel: K+ efflux
    genes: ['KCNQ1', 'KCNE1'],
    boxLines: ['KCNQ1: LQTS1, JLN1, SIDS, SQT2, AF1', 'KCNE1: LQTS5, JLN2'],
    syndromes: ['LQTS1', 'LQTS5', 'JLN1', 'JLN2', 'SIDS', 'SQT2', 'AF1'],
    condId: 'lqts',
    altCondIds: ['sqts'],
    titleTr: 'Faz 3 Yavaş Gecikmiş Doğrultucu K+ Akımı (IKs · KCNQ1 / KCNE1 — Kv7.1)',
    titleEn: 'Phase 3 Slow Delayed Rectifier K+ Current (IKs · KCNQ1 / KCNE1 — Kv7.1)',
    mechTr: 'KCNQ1 ve KCNE1 normalde sempatik (beta-adrenerjik) uyarı sırasında kalp hızlandığında QT’yi kısaltır. Kaybı (↓IKs) egzersiz/yüzme ile tetiklenen geniş tabanlı T dalgalı LQTS1, LQTS5, SIDS ve sağırlıkla giden Jervell ve Lange-Nielsen (JLN1/JLN2) yapar; artışı (↑IKs) SQT2 ve AF1 yapar.',
    mechEn: 'KCNQ1 (Kv7.1) and KCNE1 (minK) mediate adrenergic QT shortening. Loss-of-function causes broad-based T waves in LQTS1, LQTS5, SIDS, and Jervell and Lange-Nielsen (JLN1/JLN2 with deafness); gain-of-function causes SQT2 and AF1.',
    apOverlayPath: 'M 38 232 L 74 232 L 78 58 L 92 96 C 136 98, 182 112, 224 146 C 258 176, 284 206, 310 232 L 350 232'
  },
  {
    id: 'phase4_ik1',
    phase: 'Phase 3/4',
    current: 'IK1 / IK,ATP',
    direction: 'outward', // Green channel: K+ efflux stabilizing -85 mV
    genes: ['KCNJ2', 'KCNJ3', 'KCNJ8'],
    boxLines: ['KCNJ2: LQTS7, SQT3, AF4, CPVT3, ATS1, DAVD1', 'KCNJ3: LQTS13   KCNJ8: ERS   KCNJ8: AF10'],
    syndromes: ['LQTS7 (ATS1)', 'SQT3', 'AF4', 'CPVT3', 'DAVD1', 'LQTS13', 'ERS', 'AF10'],
    condId: 'ats1_lqt7_kcnj2',
    altCondIds: ['ers_jwave', 'sqts'],
    titleTr: 'Faz 3 Sonu & Faz 4 İçe Doğrultucu K+ Akımı (IK1 · KCNJ2 / KCNJ3 / KCNJ8 — Kir2.1)',
    titleEn: 'Late Phase 3 & Phase 4 Inward Rectifier K+ Current (IK1 · KCNJ2 / KCNJ3 / KCNJ8)',
    mechTr: 'KCNJ2 (Kir2.1) −85 mV dinlenim membran potansiyelini korur ve Faz 3’ü sonlandırır: Kaybı (↓IK1) Andersen-Tawil Sendromu (ATS1 / LQTS7: dev U dalgası, periyodik paralizi), CPVT3 (Bidireksiyonel VT) ve DAVD1 yapar; artışı (↑IK1) SQT3 ve AF4 yapar. KCNJ3 LQTS13; KCNJ8 (Kir6.1 IK,ATP) ise ERS ve AF10 yapar.',
    mechEn: 'KCNJ2 (Kir2.1) stabilizes the −85 mV resting potential and terminal Phase 3: loss-of-function causes Andersen-Tawil Syndrome (ATS1/LQTS7 with giant U waves), CPVT3 (bidirectional VT), and DAVD1; gain-of-function causes SQT3 and AF4. KCNJ3 causes LQTS13; KCNJ8 causes ERS and AF10.',
    apOverlayPath: 'M 38 232 L 74 232 L 78 58 L 92 96 C 122 98, 158 108, 186 142 C 206 172, 222 204, 240 220 C 262 208, 286 218, 314 232 L 350 232'
  }
];

export function buildChannelopathyApSvg(activeNodeId = 'phase0_ina', isTr = true) {
  const activeNode = CARDIAC_CHANNELOPATHY_NODES.find(n => n.id === activeNodeId) || CARDIAC_CHANNELOPATHY_NODES[0];
  const isAct = id => activeNode.id === id;

  // Helper to draw a double-barrel transmembrane ion channel icon (red for inward Na+/Ca2+, green for outward K+)
  const drawChannelGate = (cx, cy, angleDeg, isOutward, active, arrowDx, arrowDy) => {
    const fillCol = isOutward ? (active ? '#34d399' : '#10b981') : (active ? '#f87171' : '#ef4444');
    const strokeCol = active ? '#ffffff' : (isOutward ? '#059669' : '#b91c1c');
    const arrowCol = isOutward ? '#6ee7b7' : '#fca5a5';
    return `
      <g transform="translate(${cx},${cy})" ${active ? 'filter="url(#chanGlow)"' : ''}>
        <g transform="rotate(${angleDeg})">
          <rect x="-11" y="-12" width="8" height="24" rx="2.5" fill="${fillCol}" stroke="${strokeCol}" stroke-width="${active ? '1.8' : '1.1'}" opacity="${active ? '1' : '0.88'}"/>
          <rect x="3" y="-12" width="8" height="24" rx="2.5" fill="${fillCol}" stroke="${strokeCol}" stroke-width="${active ? '1.8' : '1.1'}" opacity="${active ? '1' : '0.88'}"/>
        </g>
        <line x1="${-arrowDx * 0.7}" y1="${-arrowDy * 0.7}" x2="${arrowDx}" y2="${arrowDy}" stroke="${arrowCol}" stroke-width="${active ? '2.4' : '1.7'}" marker-end="url(#${isOutward ? 'arrowGreen' : 'arrowRed'})"/>
      </g>
    `;
  };

  return `
    <svg viewBox="0 0 680 410" class="chan-ap-svg" role="img" aria-label="${isTr ? 'Kardiyak Kanalopatiler: Faz 0-4 Aksiyon Potansiyeli, İyon Kanalları ve Genetik Sendromlar' : 'Cardiac Channelopathies: Phase 0-4 Action Potential, Ion Channels & Genetic Syndromes'}">
      <defs>
        <radialGradient id="chanBgGrad" cx="45%" cy="50%" r="65%">
          <stop offset="0%" stop-color="#0f1d32"/>
          <stop offset="100%" stop-color="#060c17"/>
        </radialGradient>
        <filter id="chanGlow" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="3.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <marker id="arrowRed" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#fca5a5"/>
        </marker>
        <marker id="arrowGreen" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#6ee7b7"/>
        </marker>
      </defs>

      <!-- Dark Studio Background -->
      <rect x="0" y="0" width="680" height="410" rx="12" fill="url(#chanBgGrad)"/>

      <!-- Title Banner -->
      <text x="20" y="28" fill="#34d399" font-size="16" font-weight="800" letter-spacing="0.03em">
        ${isTr ? 'Kardiyak Kanalopatiler (Faz 0–4 Aksiyon Potansiyeli & Gen Haritası)' : 'Cardiac Channelopathies (Phase 0–4 Action Potential & Gene Atlas)'}
      </text>

      <!-- Top-Right Syndrome Legend Box (Exact Match to Reference Diagram) -->
      <g transform="translate(382, 38)">
        <rect x="0" y="0" width="284" height="122" rx="6" fill="rgba(15, 23, 42, 0.92)" stroke="rgba(148, 163, 184, 0.35)" stroke-width="1.2"/>
        <text x="10" y="16" fill="#38bdf8" font-size="9.5" font-weight="800">AF</text>
        <text x="48" y="16" fill="#e2e8f0" font-size="9.5">${isTr ? 'Atrial fibrillation (Ailesel AF1–AF10)' : 'Atrial fibrillation'}</text>
        <text x="10" y="29" fill="#f43f5e" font-size="9.5" font-weight="800">BrS</text>
        <text x="48" y="29" fill="#e2e8f0" font-size="9.5">${isTr ? 'Brugada syndrome (BrS1, BrS5)' : 'Brugada syndrome'}</text>
        <text x="10" y="42" fill="#38bdf8" font-size="9.5" font-weight="800">ERS</text>
        <text x="48" y="42" fill="#e2e8f0" font-size="9.5">${isTr ? 'Early repolarization syndrome (J dalgası)' : 'Early repolarization syndrome'}</text>
        <text x="10" y="55" fill="#a855f7" font-size="9.5" font-weight="800">JLN</text>
        <text x="48" y="55" fill="#e2e8f0" font-size="9.5">${isTr ? 'Jervell & Lange-Nielsen (Uzun QT + Sağırlık)' : 'Jervell and Lange-Nielsen syndrome'}</text>
        <text x="10" y="68" fill="#c084fc" font-size="9.5" font-weight="800">LQT</text>
        <text x="48" y="68" fill="#e2e8f0" font-size="9.5">${isTr ? 'Long QT syndrome (LQTS1–13)' : 'Long QT syndrome'}</text>
        <text x="10" y="81" fill="#06b6d4" font-size="9.5" font-weight="800">SQT</text>
        <text x="48" y="81" fill="#e2e8f0" font-size="9.5">${isTr ? 'Short QT syndrome (SQTS1–3)' : 'Short QT syndrome'}</text>
        <text x="10" y="94" fill="#fb923c" font-size="9.5" font-weight="800">SIDS</text>
        <text x="48" y="94" fill="#e2e8f0" font-size="9.5">${isTr ? 'Sudden Infant Death Syndrome' : 'Sudden Infant Death Syndrome'}</text>
        <text x="10" y="106" fill="#fbbf24" font-size="9.5" font-weight="800">SSS</text>
        <text x="48" y="106" fill="#e2e8f0" font-size="9.5">${isTr ? 'Sick Sinus Syndrome (Hasta Sinüs)' : 'Sick Sinus Syndrome'}</text>
        <text x="10" y="118" fill="#f59e0b" font-size="9.5" font-weight="800">PCCD</text>
        <text x="48" y="118" fill="#e2e8f0" font-size="9.5">${isTr ? 'Progressive cardiac conduction Disease' : 'Progressive cardiac conduction Disease'}</text>
      </g>

      <!-- Resting Potential -85 mV Baseline -->
      <line x1="38" y1="352" x2="365" y2="352" stroke="rgba(148, 163, 184, 0.35)" stroke-width="1.5" stroke-dasharray="4,4"/>
      <text x="10" y="355" fill="#94a3b8" font-size="11" font-weight="800">−85 mV</text>

      <!-- Normal Ventricular Action Potential Trajectory (Phase 0 -> 1 -> 2 -> 3 -> 4) -->
      <path d="M 38 352 L 74 352 L 78 148 L 94 184 C 132 182, 166 194, 198 228 C 224 262, 238 308, 250 352 L 355 352"
            fill="none" stroke="#10b981" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>

      <!-- Active Channelopathy Mutated AP Trajectory Overlay (Dashed Gold/Rose) -->
      <path d="${activeNode.apOverlayPath}" transform="translate(0, 120)"
            fill="none" stroke="#fbbf24" stroke-width="2.6" stroke-dasharray="6,4" opacity="0.92" filter="url(#chanGlow)"/>

      <!-- Phase Labels Along the Action Potential Curve -->
      <text x="24" y="256" fill="#f8fafc" font-size="11" font-weight="800">Phase 0</text>
      <text x="36" y="142" fill="#f8fafc" font-size="11" font-weight="800">Phase 1</text>
      <text x="122" y="132" fill="#f8fafc" font-size="11" font-weight="800">Phase 2</text>
      <text x="252" y="218" fill="#f8fafc" font-size="11" font-weight="800">Phase 3</text>
      <text x="298" y="372" fill="#f8fafc" font-size="11" font-weight="800">Phase 4</text>

      <!-- Transmembrane Ion Channels on the AP Curve -->
      <!-- 1. Phase 0 INa (Red, Horizontal Inward) -->
      ${drawChannelGate(78, 302, 90, false, isAct('phase0_ina'), 28, 0)}
      <text x="112" y="306" fill="#fca5a5" font-size="11" font-weight="800">I<tspan dy="3" font-size="8.5">Na</tspan></text>

      <!-- 2. Phase 1 Ito (Green, Vertical Outward Up) -->
      ${drawChannelGate(92, 174, 0, true, isAct('phase1_ito'), 0, -48)}
      <text x="78" y="118" fill="#6ee7b7" font-size="11" font-weight="800">I<tspan dy="3" font-size="8.5">to</tspan></text>
      <text x="86" y="202" fill="#6ee7b7" font-size="10.5" font-weight="700">K⁺</text>

      <!-- 3. Phase 2 INa & ICa,L (Red, Vertical Inward Down) -->
      ${drawChannelGate(126, 184, 0, false, isAct('phase2_ica'), 0, 32)}
      <text x="115" y="156" fill="#fca5a5" font-size="10.5" font-weight="800">I<tspan dy="3" font-size="8">Na</tspan></text>
      ${drawChannelGate(164, 192, 0, false, isAct('phase2_ica'), 0, 34)}
      <text x="155" y="156" fill="#fca5a5" font-size="10.5" font-weight="800">I<tspan dy="3" font-size="8">Ca</tspan></text>

      <!-- 4. Early Phase 3 IKur (Green, Diagonal Outward) -->
      ${drawChannelGate(204, 218, -38, true, isAct('phase3_ikur'), 28, -24)}
      <text x="238" y="188" fill="#6ee7b7" font-size="11" font-weight="800">I<tspan dy="3" font-size="8.5">Kur</tspan></text>

      <!-- 5. Mid Phase 3 IKr (Green, Horizontal Outward Right) -->
      ${drawChannelGate(230, 260, 90, true, isAct('phase3_ikr'), 34, 0)}
      <text x="272" y="255" fill="#6ee7b7" font-size="11" font-weight="800">I<tspan dy="3" font-size="8.5">Kr</tspan></text>
      <text x="176" y="258" fill="#6ee7b7" font-size="10.5" font-weight="700">K⁺</text>

      <!-- 6. Late Phase 3 IKs (Green, Horizontal Outward Right) -->
      ${drawChannelGate(242, 308, 90, true, isAct('phase3_iks'), 34, 0)}
      <text x="282" y="302" fill="#6ee7b7" font-size="11" font-weight="800">I<tspan dy="3" font-size="8.5">Ks</tspan></text>

      <!-- 7. Phase 4 IK1 (Green, Vertical Outward Up at Resting Potential) -->
      ${drawChannelGate(274, 352, 0, true, isAct('phase4_ik1'), 0, -34)}
      <text x="284" y="328" fill="#6ee7b7" font-size="11" font-weight="800">I<tspan dy="3" font-size="8.5">K1</tspan></text>

      <!-- CLICKABLE GENE & SYNDROME CALLOUT BOXES (7 Nodes) -->
      <!-- Box 1: KCNE3 / KCND3 (Ito) -->
      <g class="chan-svg-node" data-chan-node="phase1_ito" style="cursor:pointer">
        <rect x="96" y="42" width="112" height="40" rx="5"
              fill="${isAct('phase1_ito') ? 'rgba(16, 185, 129, 0.28)' : 'rgba(30, 41, 59, 0.9)'}"
              stroke="${isAct('phase1_ito') ? '#34d399' : '#64748b'}" stroke-width="${isAct('phase1_ito') ? '2' : '1.2'}"/>
        <text x="104" y="59" fill="#f8fafc" font-size="10.5" font-weight="800">KCNE3: BrS5</text>
        <text x="104" y="74" fill="#cbd5e1" font-size="10.5" font-weight="700">KCND3: BrS</text>
      </g>

      <!-- Box 2: Phase 2 LQTS8, BrS, ERS -->
      <g class="chan-svg-node" data-chan-node="phase2_ica" style="cursor:pointer">
        <rect x="174" y="102" width="136" height="28" rx="5"
              fill="${isAct('phase2_ica') ? 'rgba(244, 63, 94, 0.28)' : 'rgba(30, 41, 59, 0.9)'}"
              stroke="${isAct('phase2_ica') ? '#fb7185' : '#64748b'}" stroke-width="${isAct('phase2_ica') ? '2' : '1.2'}"/>
        <text x="182" y="120" fill="#f8fafc" font-size="10.5" font-weight="800">LQTS8, BrS, ERS</text>
      </g>

      <!-- Box 3: KCNA5: AF7 (IKur) -->
      <g class="chan-svg-node" data-chan-node="phase3_ikur" style="cursor:pointer">
        <rect x="268" y="170" width="96" height="26" rx="5"
              fill="${isAct('phase3_ikur') ? 'rgba(16, 185, 129, 0.28)' : 'rgba(30, 41, 59, 0.9)'}"
              stroke="${isAct('phase3_ikur') ? '#34d399' : '#64748b'}" stroke-width="${isAct('phase3_ikur') ? '2' : '1.2'}"/>
        <text x="276" y="187" fill="#f8fafc" font-size="10.5" font-weight="800">KCNA5: AF7</text>
      </g>

      <!-- Box 4: KCNH2 & KCNE2 (IKr) -->
      <g class="chan-svg-node" data-chan-node="phase3_ikr" style="cursor:pointer">
        <rect x="308" y="232" width="246" height="40" rx="5"
              fill="${isAct('phase3_ikr') ? 'rgba(168, 85, 247, 0.28)' : 'rgba(30, 41, 59, 0.9)'}"
              stroke="${isAct('phase3_ikr') ? '#c084fc' : '#64748b'}" stroke-width="${isAct('phase3_ikr') ? '2' : '1.2'}"/>
        <text x="316" y="248" fill="#f8fafc" font-size="10.5" font-weight="800">KCNH2: LQTS2, SIDS, SQTS1, AF2</text>
        <text x="316" y="264" fill="#cbd5e1" font-size="10.5" font-weight="700">KCNE2: LQTS6, SIDS, AF5</text>
      </g>

      <!-- Box 5: KCNQ1 & KCNE1 (IKs) -->
      <g class="chan-svg-node" data-chan-node="phase3_iks" style="cursor:pointer">
        <rect x="308" y="282" width="268" height="40" rx="5"
              fill="${isAct('phase3_iks') ? 'rgba(168, 85, 247, 0.28)' : 'rgba(30, 41, 59, 0.9)'}"
              stroke="${isAct('phase3_iks') ? '#c084fc' : '#64748b'}" stroke-width="${isAct('phase3_iks') ? '2' : '1.2'}"/>
        <text x="316" y="298" fill="#f8fafc" font-size="10.5" font-weight="800">KCNQ1: LQTS1, JLN1, SIDS, SQT2, AF1</text>
        <text x="316" y="314" fill="#cbd5e1" font-size="10.5" font-weight="700">KCNE1: LQTS5, JLN2</text>
      </g>

      <!-- Box 6: KCNJ2, KCNJ3, KCNJ8 (IK1 / IK,ATP) -->
      <g class="chan-svg-node" data-chan-node="phase4_ik1" style="cursor:pointer">
        <rect x="308" y="332" width="356" height="42" rx="5"
              fill="${isAct('phase4_ik1') ? 'rgba(16, 185, 129, 0.28)' : 'rgba(30, 41, 59, 0.9)'}"
              stroke="${isAct('phase4_ik1') ? '#34d399' : '#64748b'}" stroke-width="${isAct('phase4_ik1') ? '2' : '1.2'}"/>
        <text x="316" y="348" fill="#f8fafc" font-size="10.5" font-weight="800">KCNJ2: LQTS7, SQT3, AF4, CPVT3, ATS1, DAVD1</text>
        <text x="316" y="365" fill="#cbd5e1" font-size="10" font-weight="700">KCNJ3: LQTS13 · KCNJ8: ERS · KCNJ8: AF10</text>
      </g>

      <!-- Box 7: SCN5A (Phase 0 INa) -->
      <g class="chan-svg-node" data-chan-node="phase0_ina" style="cursor:pointer">
        <rect x="96" y="346" width="138" height="52" rx="5"
              fill="${isAct('phase0_ina') ? 'rgba(244, 63, 94, 0.28)' : 'rgba(30, 41, 59, 0.9)'}"
              stroke="${isAct('phase0_ina') ? '#fb7185' : '#64748b'}" stroke-width="${isAct('phase0_ina') ? '2' : '1.2'}"/>
        <text x="104" y="362" fill="#f8fafc" font-size="10.5" font-weight="800">SCN5A: LQTS (LQT3),</text>
        <text x="104" y="377" fill="#cbd5e1" font-size="10" font-weight="700">BrS1, SIDS, FA3,</text>
        <text x="104" y="391" fill="#cbd5e1" font-size="10" font-weight="700">SSS, PCCD</text>
      </g>

      <!-- Legend for Solid vs Dashed AP Curve -->
      <line x1="382" y1="176" x2="408" y2="176" stroke="#10b981" stroke-width="3.5"/>
      <text x="415" y="179" fill="#cbd5e1" font-size="10" font-weight="700">${isTr ? 'Normal Ventrikül AP Eğrisi' : 'Normal Ventricular AP'}</text>
      <line x1="382" y1="194" x2="408" y2="194" stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="5,3"/>
      <text x="415" y="197" fill="#fde68a" font-size="10" font-weight="700">${isTr ? `Seçili Kanalopati AP (${activeNode.current})` : `Channelopathy AP (${activeNode.current})`}</text>
    </svg>
  `;
}

// ============================================================================
// EKG COMPASS (ekgcompass.com) — 9-STEP SYSTEMATIC ECG INTERPRETER,
// LIVE SERUM ELECTROLYTE (K+ / Ca2+) MORPHING & 5-STEP RHYTHM STRIP TUNER
// ============================================================================

export const COMPASS_9_STEPS = [
  {
    step: 1,
    id: 'tech',
    tr: '1. Teknik Kalite & Kalibrasyon',
    en: '1. Technical Quality & Calibration',
    descTr: 'Önce kalibrasyon darbesini (10 mm/mV), kağıt hızını (25 mm/sn) ve izoelektrik paraziti doğrulayın.',
    descEn: 'Verify standard calibration (10 mm/mV), paper speed (25 mm/s), and baseline signal quality before measuring.'
  },
  {
    step: 2,
    id: 'leads',
    tr: '2. Derivasyon Doğrulama & Ters Bağlantı',
    en: '2. Lead Reversal & Dextrocardia Screen',
    descTr: 'aVR pozitifliği, prekordiyal R progresyonu (LA/RA tersliği vs Dekstrokardi) ve P(DI) > P(DII) (LA/LL tersliği) kontrolü.',
    descEn: 'Screen aVR polarity, precordial R-wave progression (LA/RA reversal vs true Dextrocardia), and P(I) > P(II) (LA/LL reversal).'
  },
  {
    step: 3,
    id: 'rhythm',
    tr: '3. Ritim & P-QRS İlişkisi',
    en: '3. Rhythm & P-QRS Relationship',
    descTr: 'R-R düzenliliği, P dalga morfolojisi (sinüs, testere dişi, fibrilatuar, ≥3 odak MAT) ve AV iletim oranı.',
    descEn: 'Assess R-R regularity, P-wave morphology (sinus, sawtooth, fibrillatory, ≥3 shapes MAT), and P-to-QRS relationship.'
  },
  {
    step: 4,
    id: 'rate',
    tr: '4. Kalp Hızı (Ventriküler & Atriyal)',
    en: '4. Heart Rate (Ventricular & Atrial)',
    descTr: 'Ventriküler hız (<60 bradi, 60–100 normal, >100 taşi) ve bağımsız atriyal hız (Flutter ~300/dk).',
    descEn: 'Measure ventricular rate (<60 brady, 60–100 normal, >100 tachy) and independent atrial rate if AV block/flutter.'
  },
  {
    step: 5,
    id: 'axis',
    tr: '5. Elektriksel Aks & DII Eşitlik Bozucusu',
    en: '5. Electrical Axis & Lead II Tie-Breaker',
    descTr: 'DI (+) ve aVF (−) olduğunda DII pozitifse fizyolojik sol aks (0°..−30°), DII negatifse gerçek patolojik Sol Aks Sapması (< −30°, LAFB)!',
    descEn: 'When Lead I is (+) and aVF is (−), Lead II acts as the tie-breaker: II (+) = physiologic 0°..−30°; II (−) = true LAD < −30° (LAFB)!'
  },
  {
    step: 6,
    id: 'intervals',
    tr: '6. PR, QRS & Çift QTc (Bazett / Fridericia)',
    en: '6. Intervals & Dual QTc (Bazett / Fridericia)',
    descTr: 'PR (120–200 ms), QRS (<120 ms), WPW Delta dalgası ve aşırı hızlarda Fridericia QTc düzeltmesi.',
    descEn: 'Measure PR (120–200 ms), QRS (<120 ms), WPW delta wave, and dual Bazett + Fridericia QTc calculation.'
  },
  {
    step: 7,
    id: 'qrs_lvh',
    tr: '7. QRS Morfolojisi & Sokolow-Lyon / Cornell LVH',
    en: '7. QRS Morphology & LVH Calculators',
    descTr: 'RBBB/LBBB, Bifasiküler/Trifasiküler blok uyarısı ve canlı Sokolow-Lyon (SV1+RV5/6 ≥35mm) & Cornell LVH hesabı.',
    descEn: 'Evaluate bundle branch blocks, Bifascicular/Trifascicular alerts, and live Sokolow-Lyon & Cornell LVH voltage criteria.'
  },
  {
    step: 8,
    id: 'stt_sgarbossa',
    tr: '8. Bölgesel ST-T, Özel Paternler & Sgarbossa',
    en: '8. Regional ST-T, Special Patterns & Sgarbossa',
    descTr: 'Koroner bölge ST yüksekliği/çökmesi, Wellens/de Winter/Brugada ve LBBB/Paced ritimde Smith-Modifiye Sgarbossa.',
    descEn: 'Contiguous territory ST elevation/depression, Wellens/de Winter/Brugada patterns, and Smith-Modified Sgarbossa in LBBB/Paced.'
  },
  {
    step: 9,
    id: 'context',
    tr: '9. Önceki EKG, Semptomlar, Elektrolit & İlaçlar',
    en: '9. Prior ECG, Symptoms, Electrolytes & Meds',
    descTr: 'Eski EKG karşılaştırması, göğüs ağrısı/senkop, Troponin, K⁺/Ca²⁺/Mg²⁺ ve Digoksin/QT uzatan ilaç entegrasyonu.',
    descEn: 'Synthesize prior ECG comparison, symptoms, troponin, serum electrolytes (K⁺/Ca²⁺), and cardioactive medications.'
  }
];

export function createDefaultCompassState() {
  return {
    // Step 1: Technical
    calibration: '10', // '10' | '5' | '20'
    paperSpeed: '25', // '25' | '50'
    artifact: 'clean', // 'clean' | 'tremor' | 'ac60' | 'wander' | 'loose'
    // Step 2: Lead verification
    avrPositive: 'no', // 'no' | 'yes'
    precordialProg: 'normal', // 'normal' | 'poor' | 'reversed'
    pTallerLeadI: 'no', // 'no' | 'yes'
    flatLimbLead: 'none', // 'none' | 'leadI' | 'leadII' | 'leadIII'
    // Step 3: Rhythm
    regularity: 'regular', // 'regular' | 'reg_irreg' | 'irreg_irreg'
    pWave: 'sinus', // 'sinus' | 'absent_fib' | 'flutter_sawtooth' | 'multimorph_mat' | 'retrograde'
    pQrsRel: 'one_to_one', // 'one_to_one' | 'wenckebach' | 'mobitz2' | 'av_dissociation'
    // Step 4: Rate
    ventRateBpm: 74,
    atrialRateBpm: 74,
    // Step 5: Axis (with Lead II tie-breaker)
    leadI: 'pos', // 'pos' | 'neg'
    avf: 'pos', // 'pos' | 'neg'
    leadII: 'pos', // 'pos' | 'neg'
    // Step 6: Intervals
    prMs: 160,
    qrsMs: 88,
    qtMs: 380,
    deltaWave: 'no', // 'no' | 'yes'
    // Step 7: QRS & LVH
    bundleMorph: 'normal', // 'normal' | 'rbbb' | 'lbbb' | 'ivcd' | 'tall_r_v1' | 'low_voltage' | 'paced'
    sv1Mm: 10,
    rv56Mm: 14,
    ravlMm: 6,
    sv3Mm: 8,
    sex: 'male', // 'male' | 'female'
    // Step 8: ST-T & Sgarbossa
    steTerritory: 'none', // 'none' | 'anterior' | 'inferior' | 'lateral' | 'posterior' | 'avr_diffuse'
    stdTerritory: 'none', // 'none' | 'inferior' | 'lateral' | 'v1_v3' | 'diffuse_subendo'
    specialPattern: 'none', // 'none' | 'wellens' | 'de_winter' | 'brugada_1' | 'pericarditis' | 'osborn_j' | 's1q3t3' | 'dali_digoxin' | 'peaked_t'
    sgarbossaConcordantSte: 'no',
    sgarbossaConcordantStdV1V3: 'no',
    sgarbossaDiscordantRatio: 0.12,
    // Step 9: Clinical Context
    priorEcg: 'unchanged', // 'unchanged' | 'new_changes' | 'no_prior'
    symptom: 'none', // 'none' | 'chest_pain' | 'syncope' | 'dyspnea' | 'palpitations'
    troponin: 'normal', // 'normal' | 'elevated'
    potassium: 'normal', // 'normal' | 'hypo' | 'hyper'
    meds: 'none' // 'none' | 'digoxin' | 'qt_prolonging' | 'bb_ccb' | 'tca'
  };
}

export const COMPASS_SAMPLE_CASES = [
  {
    id: 'normal',
    tr: '✓ Tümünü Normal İşaretle',
    en: '✓ Mark Everything Normal',
    condId: 'normal_sinus',
    patch: createDefaultCompassState()
  },
  {
    id: 'stemi',
    tr: '🚨 Ön Duvar STEMI (Proksimal LAD)',
    en: '🚨 Anterior STEMI (Proximal LAD)',
    condId: 'anterior_stemi',
    patch: {
      ...createDefaultCompassState(),
      ventRateBpm: 94,
      atrialRateBpm: 94,
      leadI: 'pos',
      avf: 'neg',
      leadII: 'neg', // LAFB from septal perforator ischemia
      qrsMs: 104,
      qtMs: 390,
      precordialProg: 'poor',
      steTerritory: 'anterior',
      stdTerritory: 'inferior',
      priorEcg: 'new_changes',
      symptom: 'chest_pain',
      troponin: 'elevated'
    }
  },
  {
    id: 'nstemi',
    tr: '⚠️ LMCA / Çok Damar Subendokardiyal İskemi (aVR STE)',
    en: '⚠️ LMCA / Multivessel Subendocardial Ischemia (aVR STE)',
    condId: 'wellens_lad',
    patch: {
      ...createDefaultCompassState(),
      ventRateBpm: 98,
      atrialRateBpm: 98,
      steTerritory: 'avr_diffuse',
      stdTerritory: 'diffuse_subendo',
      specialPattern: 'wellens',
      priorEcg: 'new_changes',
      symptom: 'chest_pain',
      troponin: 'elevated'
    }
  },
  {
    id: 'afib_rvr',
    tr: '⚡ Hızlı Ventrikül Yanıtlı AFib (AFib RVR)',
    en: '⚡ Atrial Fibrillation with RVR',
    condId: 'afib_rvr',
    patch: {
      ...createDefaultCompassState(),
      regularity: 'irreg_irreg',
      pWave: 'absent_fib',
      ventRateBpm: 142,
      atrialRateBpm: 450,
      qtMs: 310,
      symptom: 'palpitations'
    }
  },
  {
    id: 'wpw_afib',
    tr: '🛑 Pre-Eksite AFib (WPW + AFib — AV Bloker Kontrendike!)',
    en: '🛑 Pre-Excited AFib (WPW + AFib — Avoid AV Blockers!)',
    condId: 'wpw_syndrome',
    patch: {
      ...createDefaultCompassState(),
      regularity: 'irreg_irreg',
      pWave: 'absent_fib',
      ventRateBpm: 185,
      atrialRateBpm: 480,
      prMs: 95,
      qrsMs: 148,
      deltaWave: 'yes',
      symptom: 'syncope'
    }
  },
  {
    id: 'hyperkalemia',
    tr: '🧪 Ağır Hiperkalemi (K⁺ > 6.8 mEq/L)',
    en: '🧪 Severe Hyperkalemia (K⁺ > 6.8 mEq/L)',
    condId: 'hyperkalemia_severe',
    patch: {
      ...createDefaultCompassState(),
      ventRateBpm: 58,
      atrialRateBpm: 58,
      prMs: 228,
      qrsMs: 152,
      specialPattern: 'peaked_t',
      potassium: 'hyper'
    }
  },
  {
    id: 'lara_reversal',
    tr: '🔌 Sol/Sağ Kol (LA/RA) Elektrot Tersliği',
    en: '🔌 Left/Right Arm (LA/RA) Lead Reversal',
    condId: 'normal_sinus',
    patch: {
      ...createDefaultCompassState(),
      avrPositive: 'yes',
      precordialProg: 'normal',
      leadI: 'neg',
      avf: 'pos',
      leadII: 'pos'
    }
  }
];

export function evaluateCompassInterpretation(cs, isTr = true) {
  const s = { ...createDefaultCompassState(), ...(cs || {}) };
  const blockingAlerts = [];
  const differentials = [];

  // 1. Technical & Lead Reversal Blocking Checks (Steps 1 & 2)
  if (s.avrPositive === 'yes' && s.precordialProg !== 'reversed') {
    blockingAlerts.push({
      code: 'LARA_REVERSAL',
      tr: '🔌 TEKNİK UYARI (BLOKLAYICI): aVR pozitif ve DI negatif, ancak prekordiyal V1–V6 R progresyonu KORUNMUŞ → Klasik Sol Kol / Sağ Kol (LA/RA) Elektrot Tersliği! Yorumlamadan önce elektrotları düzeltip EKG’yi tekrar çekin.',
      en: '🔌 TECHNICAL BLOCKER: Positive aVR with negative Lead I, but normal V1–V6 R-wave progression → Classic Left/Right Arm (LA/RA) Limb Lead Reversal! Correct electrodes and repeat ECG before clinical interpretation.'
    });
    differentials.push({
      urgency: 'HIGH',
      title: isTr ? 'LA/RA Ekstremite Elektrot Tersliği (Teknik Hata)' : 'LA/RA Limb Lead Reversal (Technical Artifact)',
      detail: isTr
        ? 'aVR pozitifliği + normal V1–V6 R progresyonu dekstrokardiyi dışlar ve LA/RA kablo karışıklığını kanıtlar.'
        : 'Positive aVR with normal V1–V6 R progression rules out dextrocardia and confirms LA/RA cable swap.'
    });
  } else if (s.avrPositive === 'yes' && s.precordialProg === 'reversed') {
    blockingAlerts.push({
      code: 'DEXTROCARDIA',
      tr: '🫀 KONJENİTAL UYARI: aVR pozitif + V1’den V6’ya R dalga amplitüdü giderek KÜÇÜLÜYOR (Ters R Progresyonu) → Gerçek Dekstrokardi (Situs Inversus)! Sağ taraf prekordiyal derivasyonlarla (V1R–V6R) tekrar çekin.',
      en: '🫀 ANATOMIC ALERT: Positive aVR + decreasing R-wave amplitude from V1 to V6 (Reversed Progression) → True Dextrocardia! Repeat with right-sided precordial leads (V1R–V6R).'
    });
    differentials.push({
      urgency: 'MEDIUM',
      title: isTr ? 'Gerçek Dekstrokardi (Ters Prekordiyal R Progresyonu)' : 'True Dextrocardia (Reversed Precordial R Progression)',
      detail: isTr
        ? 'LA/RA tersliğinden farkı V1–V6’da R dalgasının sönümlenmesidir.'
        : 'Distinguished from LA/RA reversal by loss of R-wave progression across V1–V6.'
    });
  }

  if (s.pTallerLeadI === 'yes') {
    blockingAlerts.push({
      code: 'LALL_REVERSAL',
      tr: '🔌 TEKNİK UYARI: Sinüs ritminde DI’deki P dalgası DII’den daha yüksek ve DIII ters → Sol Kol / Sol Bacak (LA/LL) Elektrot Tersliği şüphesi!',
      en: '🔌 TECHNICAL ALERT: P wave in Lead I taller than Lead II with inverted Lead III → Suspect Left Arm / Left Leg (LA/LL) Lead Reversal!'
    });
  }

  if (s.flatLimbLead !== 'none') {
    blockingAlerts.push({
      code: 'RL_SWAP',
      tr: `🔌 TOPRAK ELEKTROT HATASI: ${s.flatLimbLead.toUpperCase()} derivasyonunda sıfıra yakın düz çizgi (Pseudosasistoli) → Sağ Bacak (RL) nötr elektrodu kol/bacak elektroduyla yer değiştirmiş!`,
      en: `🔌 RL GROUND SWAP: Near-flatline in ${s.flatLimbLead.toUpperCase()} → Right Leg (RL) ground electrode swapped with an active limb electrode!`
    });
  }

  if (s.calibration !== '10' || s.paperSpeed !== '25') {
    blockingAlerts.push({
      code: 'NON_STANDARD_CAL',
      tr: `⚙️ KALİBRASYON UYARISI: Çekim standart dışı (${s.paperSpeed} mm/sn, ${s.calibration} mm/mV). Voltaj (LVH) ve süre (PR/QRS/QT) ölçümlerini oranlayarak düzeltin!`,
      en: `⚙️ CALIBRATION WARNING: Non-standard settings (${s.paperSpeed} mm/s, ${s.calibration} mm/mV). Scale voltage (LVH) and interval measurements accordingly!`
    });
  }

  // 2. Step 5: Electrical Axis with Lead II Tie-Breaker
  let axisCode = 'NORMAL';
  let axisLabelTr = 'Normal Elektriksel Aks (0° ile +90° arası)';
  let axisLabelEn = 'Normal Electrical Axis (0° to +90°)';
  if (s.leadI === 'pos' && s.avf === 'pos') {
    axisCode = 'NORMAL';
  } else if (s.leadI === 'pos' && s.avf === 'neg') {
    if (s.leadII === 'pos') {
      axisCode = 'PHYSIOLOGIC_LEFT';
      axisLabelTr = 'Fizyolojik Sol Aks (0° ile −30° arası — DII Pozitif: Normal Varyant, LAFB Değil!)';
      axisLabelEn = 'Physiologic Leftward Axis (0° to −30° — Lead II Positive: Normal Variant, NOT LAFB!)';
    } else {
      axisCode = 'TRUE_LAD';
      axisLabelTr = 'Patolojik Sol Aks Sapması (−30° ile −90° arası — DII Negatif: LAFB / İnferior MI / LVH araştırın)';
      axisLabelEn = 'Pathological Left Axis Deviation (−30° to −90° — Lead II Negative: Evaluate LAFB / Inferior MI)';
    }
  } else if (s.leadI === 'neg' && s.avf === 'pos') {
    axisCode = 'RAD';
    axisLabelTr = 'Sağ Aks Sapması (+90° ile +180° arası — RVH / LPFB / PE / Lateral MI / LA-RA Tersliği)';
    axisLabelEn = 'Right Axis Deviation (+90° to +180° — Evaluate RVH / LPFB / PE / Lateral MI / Lead Reversal)';
  } else {
    axisCode = 'EXTREME_NW';
    axisLabelTr = 'Ekstrem Kuzeybatı Aks (−90° ile −180° — VT, Hiperkalemi veya Elektrot Tersliği!)';
    axisLabelEn = 'Extreme Northwest Axis (−90° to −180° — Suspect VT, Severe Hyperkalemia, or Lead Reversal!)';
  }

  // 3. Step 6: Dual QTc Calculator (Bazett + Fridericia)
  const hr = Math.max(25, Math.min(260, Number(s.ventRateBpm) || 74));
  const rrSec = 60 / hr;
  const qtMs = Math.max(200, Math.min(720, Number(s.qtMs) || 380));
  const qtcBazettMs = Math.round(qtMs / Math.sqrt(rrSec));
  const qtcFridericiaMs = Math.round(qtMs / Math.cbrt(rrSec));
  const preferredQtcMs = (hr < 60 || hr > 100) ? qtcFridericiaMs : qtcBazettMs;
  const qtcLimit = s.sex === 'female' ? 460 : 450;
  const qtcProlonged = preferredQtcMs >= qtcLimit;
  const qtcCriticalTdp = preferredQtcMs >= 500;

  if (qtcCriticalTdp) {
    differentials.push({
      urgency: 'CRITICAL',
      title: isTr ? `Kritik QTc Uzaması (${preferredQtcMs} ms ≥ 500 ms) — Torsades de Pointes Riski!` : `Critical QTc Prolongation (${preferredQtcMs} ms ≥ 500 ms) — High TdP Risk!`,
      detail: isTr
        ? `Bazett: ${qtcBazettMs} ms · Fridericia: ${qtcFridericiaMs} ms. QT uzatan ilaçları kesin, IV MgSO₄ ve K⁺ > 4.0 mEq/L hedefli replasman yapın.`
        : `Bazett: ${qtcBazettMs} ms · Fridericia: ${qtcFridericiaMs} ms. Stop QT-prolonging drugs, administer IV MgSO₄, and replete K⁺ > 4.0 mEq/L.`
    });
  }

  // 4. Step 7: Sokolow-Lyon & Cornell LVH + Bifascicular / Trifascicular Block Alerts
  const sokolowMm = (Number(s.sv1Mm) || 0) + (Number(s.rv56Mm) || 0);
  const sokolowPos = sokolowMm >= 35;
  const cornellMm = (Number(s.ravlMm) || 0) + (Number(s.sv3Mm) || 0);
  const cornellThreshold = s.sex === 'female' ? 20 : 28;
  const cornellPos = cornellMm > cornellThreshold;
  const lvhPositive = sokolowPos || cornellPos;

  const isBifascicular = s.bundleMorph === 'rbbb' && (axisCode === 'TRUE_LAD' || axisCode === 'RAD');
  const isTrifascicular = isBifascicular && Number(s.prMs) > 200;

  if (isTrifascicular) {
    differentials.push({
      urgency: 'HIGH',
      title: isTr ? 'Trifasiküler Blok (RBBB + Fasiküler Blok + 1° AV Blok)' : 'Incomplete Trifascicular Block (RBBB + Fascicular Block + PR > 200 ms)',
      detail: isTr
        ? 'Senkop varlığında tam AV bloğa ilerleme açısından yüksek risklidir; acil elektrofizyolojik / kalıcı pil değerlendirmesi gerekir.'
        : 'High risk of progression to complete heart block, especially with syncope; urgent pacing evaluation required.'
    });
  } else if (isBifascicular) {
    differentials.push({
      urgency: 'MEDIUM',
      title: isTr
        ? `Bifasiküler Blok (RBBB + ${axisCode === 'TRUE_LAD' ? 'LAFB' : 'LPFB'})`
        : `Bifascicular Block (RBBB + ${axisCode === 'TRUE_LAD' ? 'LAFB' : 'LPFB'})`,
      detail: isTr
        ? 'İletim sistemi üç fasikülünden ikisinde blok mevcut; PR mesafesini ve senkop öyküsünü izleyin.'
        : 'Two of three His-Purkinje fascicles are blocked; monitor PR interval and clinical syncope history.'
    });
  }

  // 5. Step 3 & 6: Rhythm & Pre-Excitation Differentials
  if (s.regularity === 'irreg_irreg' && s.pWave === 'absent_fib' && s.deltaWave === 'yes') {
    differentials.push({
      urgency: 'CRITICAL',
      title: isTr ? '🛑 Pre-Eksite Atriyal Fibrilasyon (WPW + AFib) — AV Düğüm Blokeri VERMEYİN!' : '🛑 Pre-Excited AFib (WPW + AFib) — DO NOT Give AV Nodal Blockers!',
      detail: isTr
        ? 'Adenozin, Diltiazem, Verapamil, Beta-bloker ve Digoksin aksesuar yoldan 1:1 iletimi hızlandırıp VF’yi tetikler! Prokainamid, İbutilid veya Senkronize Kardiyoversiyon uygulayın.'
        : 'Adenosine, CCBs, Beta-blockers, and Digoxin are CONTRAINDICATED (precipitate VF via accessory pathway). Use Procainamide, Ibutilide, or Synchronized Cardioversion.'
    });
  } else if (s.regularity === 'irreg_irreg' && s.pWave === 'absent_fib') {
    differentials.push({
      urgency: hr > 110 ? 'HIGH' : 'MEDIUM',
      title: isTr ? `Atriyal Fibrilasyon (${hr > 100 ? 'Hızlı Ventrikül Yanıtlı — RVR' : 'Kontrollü Hız'})` : `Atrial Fibrillation (${hr > 100 ? 'with RVR' : 'Rate-Controlled'})`,
      detail: isTr
        ? 'Düzensiz R-R ve seçilemeyen P dalgaları. Altta yatan tetikleyicileri (iskemi, sepsis, PE, tirotoksikoz) ve CHA₂DS₂-VASc antikoagülasyon endikasyonunu değerlendirin.'
        : 'Irregularly irregular R-R without distinct P waves. Evaluate triggers and CHA₂DS₂-VASc anticoagulation.'
    });
  } else if (s.pWave === 'flutter_sawtooth') {
    differentials.push({
      urgency: 'MEDIUM',
      title: isTr ? `Atriyal Flutter (Atriyal Hız ~${s.atrialRateBpm} bpm)` : `Atrial Flutter (Atrial Rate ~${s.atrialRateBpm} bpm)`,
      detail: isTr
        ? 'İnferior derivasyonlarda (II, III, aVF) kavotriküspit istmus (CTI) bağımlı testere dişi F dalgaları.'
        : 'Classic cavotricuspid isthmus (CTI) sawtooth flutter waves in inferior leads (II, III, aVF).'
    });
  } else if (s.pQrsRel === 'av_dissociation') {
    differentials.push({
      urgency: 'CRITICAL',
      title: isTr ? (hr > 100 ? 'Ventriküler Taşikardi (AV Dissosiyasyon Kanıtlı)' : '3. Derece (Tam) AV Blok') : (hr > 100 ? 'Ventricular Tachycardia (with AV Dissociation)' : '3rd-Degree (Complete) AV Block'),
      detail: isTr
        ? (hr > 100 ? 'Geniş QRS taşikardide AV dissosiyasyon VT için %100 spesifiktir.' : 'Atriyum ve ventriküller birbirinden tamamen bağımsız; acil transkütan/transvenöz pil hazırlığı yapın.')
        : (hr > 100 ? 'AV dissociation in a wide-complex tachycardia is 100% specific for VT.' : 'Complete failure of AV conduction with independent escape rhythm; prepare pacing.')
    });
  }

  // 6. Step 8: Territory ST-T, Special Patterns & Smith-Modified Sgarbossa
  const sgarbossaActive = s.bundleMorph === 'lbbb' || s.bundleMorph === 'paced';
  const sgarbossaPositive = sgarbossaActive && (
    s.sgarbossaConcordantSte === 'yes' ||
    s.sgarbossaConcordantStdV1V3 === 'yes' ||
    Number(s.sgarbossaDiscordantRatio) >= 0.25
  );

  if (sgarbossaPositive) {
    differentials.push({
      urgency: 'CRITICAL',
      title: isTr ? '🚨 LBBB / Paced Ritimde Akut Koroner Oklüzyon (Smith-Modifiye Sgarbossa POZİTİF)' : '🚨 Acute Coronary Occlusion in LBBB/Paced (Smith-Modified Sgarbossa POSITIVE)',
      detail: isTr
        ? 'Konkordan STE ≥1mm, V1–V3 konkordan STD ≥1mm veya aşırı diskordan STE (|STE/S| ≥ 0.25) akut STEMI eşdeğeridir!'
        : 'Concordant STE ≥1mm, V1–V3 concordant STD ≥1mm, or excessive discordant STE (|STE/S| ≥ 0.25) confirms acute OMI!'
    });
  }

  if (s.steTerritory === 'anterior') {
    differentials.push({
      urgency: 'CRITICAL',
      title: isTr ? '🚨 Akut Ön Duvar STEMI (Proksimal/Mid LAD Oklüzyonu)' : '🚨 Acute Anterior STEMI (Proximal/Mid LAD Occlusion)',
      detail: isTr
        ? 'V1–V4 ST elevasyonu + resiprokal inferior ST depresyonu. Acil Primer PKG aktivasyonu!'
        : 'V1–V4 ST elevation with reciprocal inferior ST depression. Activate emergent primary PCI!'
    });
  } else if (s.steTerritory === 'inferior') {
    differentials.push({
      urgency: 'CRITICAL',
      title: isTr ? '🚨 Akut İnferior STEMI (RCA / LCx — V4R Sağ Ventrikül Derivasyonu Çekin!)' : '🚨 Acute Inferior STEMI (RCA / LCx — Obtain V4R!)',
      detail: isTr
        ? 'II, III, aVF ST elevasyonu + aVL resiprokal çökme. Nitrat vermeden önce V4R ile sağ ventrikül MI dışlayın!'
        : 'II, III, aVF ST elevation with reciprocal aVL depression. Check V4R for RV infarction before giving nitrates!'
    });
  } else if (s.steTerritory === 'avr_diffuse' && s.stdTerritory === 'diffuse_subendo') {
    differentials.push({
      urgency: 'CRITICAL',
      title: isTr ? '⚠️ Sol Ana Koroner (LMCA) / Proksimal 3-Damar Subendokardiyal İskemi' : '⚠️ Left Main (LMCA) / Severe 3-Vessel Subendocardial Ischemia',
      detail: isTr
        ? 'Yaygın (≥6 derivasyon) yatay/aşağı eğimli ST çökmesi + aVR > V1 ST yüksekliği.'
        : 'Widespread (≥6 leads) ST depression with reciprocal ST elevation in aVR > V1.'
    });
  }

  if (s.specialPattern === 'wellens') {
    differentials.push({
      urgency: 'HIGH',
      title: isTr ? 'Wellens Sendromu (Kritik Proksimal LAD Stenozu — Efor Testi KONTRENDİKE!)' : 'Wellens Syndrome (Critical Proximal LAD Stenosis — Do NOT Stress Test!)',
      detail: isTr
        ? 'Ağrısız dönemde V2–V3 bifazik (Tip A) veya derin simetrik negatif (Tip B) T dalgaları; efor testi ölümcül ön duvar MI tetikler.'
        : 'Biphasic (Type A) or deep symmetric inverted (Type B) V2–V3 T waves in pain-free state; stress testing is contraindicated.'
    });
  } else if (s.specialPattern === 'de_winter') {
    differentials.push({
      urgency: 'CRITICAL',
      title: isTr ? 'de Winter T Dalgaları (Akut Proksimal LAD Tam Oklüzyonu — STEMI Eşdeğeri)' : 'de Winter T Waves (Acute Proximal LAD OMI — STEMI Equivalent)',
      detail: isTr
        ? 'V1–V6 yukarı eğimli J-noktası ST çökmesi + uzun simetrik hiperakut T dalgaları.'
        : 'Upsloping J-point ST depression V1–V6 flowing into tall symmetric hyperacute T waves.'
    });
  } else if (s.specialPattern === 'brugada_1') {
    differentials.push({
      urgency: 'HIGH',
      title: isTr ? 'Brugada Tip 1 Paterni (Coved STE ≥ 2 mm V1–V2 — SCN5A Kanalopatisi)' : 'Brugada Type 1 Pattern (Coved STE ≥ 2 mm in V1–V2)',
      detail: isTr
        ? 'Ateşi agresif düşürün, Sınıf IC ajanlardan kaçının ve senkop/aile öyküsü varsa ICD değerlendirin.'
        : 'Treat fever aggressively, avoid sodium-channel blockers, and evaluate for ICD if symptomatic.'
    });
  } else if (s.specialPattern === 'peaked_t' || s.potassium === 'hyper') {
    differentials.push({
      urgency: Number(s.qrsMs) >= 120 ? 'CRITICAL' : 'HIGH',
      title: isTr ? 'Hiperkalemi EKG Bulguları (Sivri Çadır T / QRS Genişlemesi)' : 'Hyperkalemia ECG Manifestations (Tented T / QRS Widening)',
      detail: isTr
        ? 'QRS genişlemesi veya P düzleşmesi varsa İLK adım IV Kalsiyum Glukonat (membran stabilizasyonu), ardından İnsülin+Dekstroz!'
        : 'If QRS widening or loss of P waves is present, administer IV Calcium Gluconate FIRST for membrane stabilization!'
    });
  } else if (s.specialPattern === 'pericarditis') {
    differentials.push({
      urgency: 'MEDIUM',
      title: isTr ? 'Akut Perikardit (Yaygın Konkav STE + PR Çökmesi + Spodick İşareti)' : 'Acute Pericarditis (Diffuse Concave STE + PR Depression + Spodick Sign)',
      detail: isTr
        ? 'Koroner sulkusa uymayan yaygın STE, aVR’de resiprokal PR yüksekliği ve aVL’de resiprokal ST çökmesi olmaması.'
        : 'Diffuse concave STE without reciprocal depression in aVL, accompanied by PR depression (and PR elevation in aVR).'
    });
  }

  if (s.meds === 'tca' && Number(s.qrsMs) >= 100) {
    differentials.push({
      urgency: 'CRITICAL',
      title: isTr ? 'Trisiklik Antidepresan (TCA) Toksisitesi (Na⁺ Kanal Blokajı — QRS ≥ 100 ms)' : 'Tricyclic Antidepressant (TCA) Sodium-Channel Toxicity (QRS ≥ 100 ms)',
      detail: isTr
        ? 'aVR’de terminal R > 3 mm + QRS ≥ 100 ms nöbet ve ventriküler aritmi habercisidir; derhal IV Sodyum Bikarbonat (NaHCO₃) bolusu verin!'
        : 'Terminal R in aVR > 3 mm + QRS ≥ 100 ms predicts seizures and VT; administer IV Sodium Bicarbonate immediately!'
    });
  }

  if (differentials.length === 0) {
    differentials.push({
      urgency: 'LOW',
      title: isTr ? 'Normal Sinüs Ritmi & Normal 12-Derivasyon EKG' : 'Normal Sinus Rhythm & Normal 12-Lead ECG',
      detail: isTr
        ? 'Teknik kalite uygun, normal aks, normal PR/QRS/QTc süreleri ve akut iskemik ST-T değişikliği saptanmadı.'
        : 'Technically adequate tracing, normal axis, normal intervals, and no acute ischemic ST-T abnormality.'
    });
  }

  // Sort differentials by urgency
  const rank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  differentials.sort((a, b) => (rank[a.urgency] ?? 9) - (rank[b.urgency] ?? 9));

  // Build Copy-Ready Structured Clinical Report
  const reportText = isTr
    ? [
        `=== 🧭 EKG COMPASS 9-ADIM SİSTEMATİK KLİNİK EKG RAPORU ===`,
        `1. TEKNİK & KALİBRASYON: ${s.paperSpeed} mm/sn, ${s.calibration} mm/mV, Sinyal: ${s.artifact}.`,
        `2. DERİVASYON DOĞRULAMA: aVR Pozitif=${s.avrPositive}, Prekordiyal R Progresyonu=${s.precordialProg}${blockingAlerts.length ? ' [⚠️ BLOKLAYICI UYARI MEVCUT]' : ' (Uygun)'}.`,
        `3-4. RİTİM & HIZ: Ventriküler Hız ${hr} bpm (Atriyal ${s.atrialRateBpm} bpm), Düzen: ${s.regularity}, P Dalgası: ${s.pWave}, AV İlişki: ${s.pQrsRel}.`,
        `5. ELEKTRİKSEL AKS: ${axisLabelTr}.`,
        `6. ARALIKLAR: PR ${s.prMs} ms, QRS ${s.qrsMs} ms, QT ${qtMs} ms (Bazett QTc: ${qtcBazettMs} ms | Fridericia QTcF: ${qtcFridericiaMs} ms${qtcProlonged ? ' — UZAMIŞ' : ''}).`,
        `7. QRS & VOLTAJ: Morfoloji=${s.bundleMorph}, Sokolow-Lyon=${sokolowMm} mm (${sokolowPos ? 'LVH+' : 'Normal'}), Cornell=${cornellMm} mm (${cornellPos ? 'LVH+' : 'Normal'}).`,
        `8. ST-T & ÖZEL PATERN: STE=${s.steTerritory}, STD=${s.stdTerritory}, Özel Patern=${s.specialPattern}${sgarbossaPositive ? ', Modifiye Sgarbossa POZİTİF' : ''}.`,
        `9. KLİNİK SENTEZ / SONUÇ: ${differentials.map(d => `[${d.urgency}] ${d.title}`).join(' | ')}`
      ].join('\n')
    : [
        `=== 🧭 EKG COMPASS 9-STEP SYSTEMATIC CLINICAL ECG REPORT ===`,
        `1. TECHNICAL: ${s.paperSpeed} mm/s, ${s.calibration} mm/mV, Artifact: ${s.artifact}.`,
        `2. LEAD VERIFICATION: aVR Positive=${s.avrPositive}, Precordial R Progression=${s.precordialProg}${blockingAlerts.length ? ' [⚠️ BLOCKING ALERT PRESENT]' : ' (Verified)'}.`,
        `3-4. RHYTHM & RATE: Ventricular ${hr} bpm (Atrial ${s.atrialRateBpm} bpm), Regularity: ${s.regularity}, P-Wave: ${s.pWave}, AV Rel: ${s.pQrsRel}.`,
        `5. ELECTRICAL AXIS: ${axisLabelEn}.`,
        `6. INTERVALS: PR ${s.prMs} ms, QRS ${s.qrsMs} ms, QT ${qtMs} ms (Bazett QTc: ${qtcBazettMs} ms | Fridericia QTcF: ${qtcFridericiaMs} ms${qtcProlonged ? ' — PROLONGED' : ''}).`,
        `7. QRS & VOLTAGE: Morphology=${s.bundleMorph}, Sokolow-Lyon=${sokolowMm} mm (${sokolowPos ? 'LVH+' : 'Normal'}), Cornell=${cornellMm} mm (${cornellPos ? 'LVH+' : 'Normal'}).`,
        `8. ST-T & SPECIAL PATTERN: STE=${s.steTerritory}, STD=${s.stdTerritory}, Pattern=${s.specialPattern}${sgarbossaPositive ? ', Modified Sgarbossa POSITIVE' : ''}.`,
        `9. CLINICAL IMPRESSION: ${differentials.map(d => `[${d.urgency}] ${d.title}`).join(' | ')}`
      ].join('\n');

  return {
    blockingAlerts,
    axisInfo: {
      code: axisCode,
      label: isTr ? axisLabelTr : axisLabelEn
    },
    qtcInfo: {
      rrSec: Number(rrSec.toFixed(2)),
      qtcBazettMs,
      qtcFridericiaMs,
      preferredQtcMs,
      prolonged: qtcProlonged,
      criticalTdp: qtcCriticalTdp,
      rateCaveat: hr < 60 || hr > 100
    },
    lvhInfo: {
      sokolowMm,
      sokolowPos,
      cornellMm,
      cornellPos,
      lvhPositive,
      isBifascicular,
      isTrifascicular
    },
    sgarbossaInfo: {
      active: sgarbossaActive,
      positive: sgarbossaPositive
    },
    differentials,
    reportText
  };
}

// Continuous Serum Electrolyte (K+ 2.0..8.5 mEq/L, Ca2+ 6.0..13.5 mg/dL) Waveform Synthesizer
export function sampleElectrolyteLeadIIMv(kMeq = 4.2, caMgDl = 9.4, tSec = 0) {
  const gauss = (x, mu, sig, amp) => amp * Math.exp(-0.5 * Math.pow((x - mu) / sig, 2));
  const k = Math.max(2.0, Math.min(8.5, Number(kMeq) || 4.2));
  const ca = Math.max(6.0, Math.min(13.5, Number(caMgDl) || 9.4));

  // Sine-wave pre-arrest pattern when K+ >= 7.8 mEq/L
  if (k >= 7.8) {
    const blend = Math.min(1, (k - 7.8) / 0.6);
    const sineMv = 0.88 * Math.sin(tSec * 2 * Math.PI * 1.05) + 0.18 * Math.sin(tSec * 2 * Math.PI * 2.1);
    if (blend >= 0.85) return sineMv;
  }

  const hr = k > 6.8 ? 54 : k < 3.0 ? 84 : 72;
  const rrSec = 60 / hr;
  const phase = ((tSec % rrSec) + rrSec) % rrSec / rrSec;

  // P wave attenuates and PR lengthens as K+ rises above 6.2 mEq/L
  const pScale = k <= 5.8 ? 1.0 : Math.max(0, 1 - (k - 5.8) / 1.3);
  const pCenter = k <= 5.8 ? 0.15 : Math.max(0.08, 0.15 - (k - 5.8) * 0.03);

  // QRS widens progressively when K+ > 6.2 mEq/L
  const qrsScaleW = k <= 6.0 ? 1.0 : 1.0 + (k - 6.0) * 1.45;

  // Ca2+ shifts the ST-segment duration (T-wave center):
  // Hypocalcemia (<8.0) prolongs ST plateau; Hypercalcemia (>10.8) shortens ST plateau
  const caShift = (9.4 - ca) * 0.025; // positive when Ca is low -> later T wave
  const tCenter = Math.max(0.42, Math.min(0.68, 0.52 + caShift));

  // T-wave amplitude & width depend strongly on K+:
  // Hyperkalemia -> tall, narrow-based tented T wave
  // Hypokalemia -> flattened/inverted T wave + prominent U wave at phase ~0.70
  let tAmp = 0.28;
  let tWidth = 0.048;
  if (k > 5.3) {
    tAmp = 0.28 + (k - 5.3) * 0.34;
    tWidth = Math.max(0.020, 0.048 - (k - 5.3) * 0.011);
  } else if (k < 3.5) {
    tAmp = Math.max(-0.08, 0.28 - (3.5 - k) * 0.24);
    tWidth = 0.052;
  }

  let mv = 0;
  // P wave
  mv += gauss(phase, pCenter, 0.025, 0.14 * pScale);
  // Q-R-S complex
  mv += gauss(phase, 0.285, 0.006 * qrsScaleW, -0.10);
  mv += gauss(phase, 0.305, 0.009 * qrsScaleW, 1.05);
  mv += gauss(phase, 0.328, 0.008 * qrsScaleW, -0.22 * (k > 6.2 ? 1.6 : 1.0));

  // Osborn-like J wave in severe hypercalcemia (Ca2+ >= 12.0 mg/dL)
  if (ca >= 11.8) {
    mv += gauss(phase, 0.345, 0.012, (ca - 11.5) * 0.16);
  }

  // ST depression in hypokalemia
  if (k < 3.4) {
    mv += gauss(phase, 0.41, 0.045, -(3.4 - k) * 0.13);
  }

  // T wave
  mv += gauss(phase, tCenter, tWidth, tAmp);

  // Prominent U wave in hypokalemia (K+ < 3.5 mEq/L)
  if (k < 3.5) {
    const uAmp = (3.5 - k) * 0.26;
    mv += gauss(phase, tCenter + 0.14, 0.038, uAmp);
  }

  return mv;
}

// 5-Step Rhythm Strip Analyzer & Source "Tuner" (ekgcompass.com/rhythm)
export function evaluateRhythmTuner5Step(tunerState, isTr = true) {
  const t = {
    reg: 'regular', // 'regular' | 'reg_irreg' | 'irreg_irreg'
    pwave: 'upright_1to1', // 'upright_1to1' | 'sawtooth' | 'absent_fib' | 'multimorph' | 'more_p' | 'dissociated'
    qrs: 'narrow', // 'narrow' | 'wide'
    rate: 'normal', // 'brady' | 'normal' | 'tachy_100_150' | 'tachy_gt150'
    ...(tunerState || {})
  };

  let originChamber = isTr ? 'SA Düğümü (Sinoatriyal)' : 'SA Node (Sinoatrial)';
  let established = [];
  let ruledOut = [];

  if (t.reg === 'irreg_irreg') {
    originChamber = isTr ? 'Atriyal / Çok Odaklı Atriyal' : 'Atrial / Multifocal Atrial';
    if (t.pwave === 'absent_fib') {
      established.push(
        t.qrs === 'wide'
          ? (isTr ? 'Dal Bloklu AFib veya Pre-Eksite AFib (WPW)' : 'AFib with Aberrancy/BBB or Pre-Excited AFib (WPW)')
          : (isTr ? 'Atriyal Fibrilasyon (AFib)' : 'Atrial Fibrillation (AFib)')
      );
      ruledOut.push(isTr ? 'Sinüs Ritmi, Klasik AVNRT, Sabit İletimli Flutter' : 'Sinus Rhythm, Typical AVNRT, Fixed-Ratio Flutter');
    } else if (t.pwave === 'multimorph') {
      established.push(
        t.rate === 'tachy_100_150' || t.rate === 'tachy_gt150'
          ? (isTr ? 'Multifokal Atriyal Taşikardi (MAT — ≥3 P şekli, Hız >100)' : 'Multifocal Atrial Tachycardia (MAT — ≥3 P shapes, HR >100)')
          : (isTr ? 'Gezici Atriyal Pacemaker (WAP — ≥3 P şekli, Hız <100)' : 'Wandering Atrial Pacemaker (WAP — ≥3 P shapes, HR <100)')
      );
      ruledOut.push(isTr ? 'AFib (seçilebilir P var), Monomorfik VT' : 'AFib (distinct P waves present), Monomorphic VT');
    } else {
      established.push(isTr ? 'Değişken AV İletimli Atriyal Flutter' : 'Atrial Flutter with Variable AV Block');
      ruledOut.push(isTr ? 'Tam AV Blok (düzenli kaçış ritmi beklenir)' : 'Complete AV Block (regular escape expected)');
    }
  } else if (t.reg === 'reg_irreg') {
    originChamber = isTr ? 'AV Düğüm (Grup Atımlar) veya Ektopik Bigemini' : 'AV Node (Group Beating) or Ectopic Bigeminy';
    established.push(
      isTr
        ? '2° AV Blok Tip I (Wenckebach Grup Atımları) veya Ventriküler/Atriyal Bigemini'
        : '2nd-Degree AV Block Type I (Wenckebach Group Beating) or Bigeminy/Trigeminy'
    );
    ruledOut.push(isTr ? 'AFib (tamamen düzensizdir), Normal Sinüs' : 'AFib (chaotically irregular), Normal Sinus');
  } else {
    // Regular R-R
    if (t.qrs === 'wide' && (t.rate === 'tachy_100_150' || t.rate === 'tachy_gt150')) {
      originChamber = isTr ? 'Ventriküler Miyokard / His-Purkinje' : 'Ventricular Myocardium / His-Purkinje';
      established.push(
        isTr
          ? 'Monomorfik Ventriküler Taşikardi (VT — Aksi kanıtlanana kadar!) / Aberran SVT'
          : 'Monomorphic Ventricular Tachycardia (VT — Until proven otherwise!) / SVT with Aberrancy'
      );
      ruledOut.push(isTr ? 'Normal dar QRS SVT, AFib' : 'Narrow-complex SVT, AFib');
    } else if (t.pwave === 'sawtooth') {
      originChamber = isTr ? 'Sağ Atriyum (Kavotriküspit İstmus)' : 'Right Atrium (Cavotricuspid Isthmus)';
      established.push(isTr ? '2:1 veya 4:1 Sabit İletimli Atriyal Flutter' : 'Atrial Flutter with Fixed (2:1 or 4:1) AV Conduction');
      ruledOut.push(isTr ? 'AFib, Sinüs Taşikardisi' : 'AFib, Sinus Tachycardia');
    } else if (t.pwave === 'dissociated') {
      originChamber = isTr ? 'AV Tam Blok + Kavşak/Ventrikül Kaçış Odağı' : 'Complete AV Block + Junctional/Ventricular Escape';
      established.push(
        t.qrs === 'narrow'
          ? (isTr ? '3° Tam AV Blok (His Üstü Dar QRS Kavşak Kaçışlı, 40–60/dk)' : '3rd-Degree AV Block with Narrow Junctional Escape (40–60 bpm)')
          : (isTr ? '3° Tam AV Blok (İnfra-Hisian Geniş QRS Ventriküler Kaçışlı, 20–40/dk)' : '3rd-Degree AV Block with Wide Ventricular Escape (20–40 bpm)')
      );
      ruledOut.push(isTr ? '1:1 Sinüs İletimi, Wenckebach' : '1:1 Sinus Conduction, Wenckebach');
    } else if (t.rate === 'tachy_gt150' && t.qrs === 'narrow') {
      originChamber = isTr ? 'AV Kavşak Re-entrisi (AVNRT / AVRT)' : 'AV Nodal / Accessory Re-entry (AVNRT / AVRT)';
      established.push(isTr ? 'Paroksismal SVT (AVNRT / Orhodromik AVRT)' : 'Paroxysmal SVT (AVNRT / Orthodromic AVRT)');
      ruledOut.push(isTr ? 'Ventriküler Taşikardi (QRS dar)' : 'Ventricular Tachycardia (QRS is narrow)');
    } else if (t.rate === 'brady') {
      originChamber = isTr ? 'SA Düğümü veya AV Kavşak' : 'SA Node or AV Junction';
      established.push(isTr ? 'Sinüs Bradikardisi veya Kavşak (Junctional) Kaçış Ritmi' : 'Sinus Bradycardia or Junctional Escape Rhythm');
      ruledOut.push(isTr ? 'Taşiaritmiler (SVT / VT / RVR)' : 'Tachyarrhythmias (SVT / VT / RVR)');
    } else {
      originChamber = isTr ? 'SA Düğümü (Normal İletim)' : 'SA Node (Normal Conduction)';
      established.push(
        t.rate === 'tachy_100_150'
          ? (isTr ? 'Sinüs Taşikardisi (100–150/dk)' : 'Sinus Tachycardia (100–150 bpm)')
          : (isTr ? 'Normal Sinüs Ritmi (60–100/dk)' : 'Normal Sinus Rhythm (60–100 bpm)')
      );
      ruledOut.push(isTr ? 'AFib, Atriyal Flutter, VT, Tam AV Blok' : 'AFib, Atrial Flutter, VT, Complete Heart Block');
    }
  }

  return { originChamber, established, ruledOut };
}

export function createClinicalEcgSimulator({ mount, getLang = () => 'tr', initialCollapsed = false }) {
  const studyState = loadStudyState();
  const st = {
    mode: 'simulator', // 'simulator' | '12lead' | 'study' | 'skillstat' | 'compass'
    collapsed: Boolean(initialCollapsed),
    // Opens on normal sinus rhythm; lessons that teach a finding select it (guyton-studio.js).
    catId: 'arrhythmia',
    condId: 'normal_sinus',
    activeLead: 'II',
    running: true,
    blindMode: false, // "Read It Yourself" (ECGSweep feature)
    soundOn: false,
    paperSpeed: 25, // 25 or 50 mm/s
    hrOverride: null,
    noiseLevel: 0.0,
    conductionMs: 265, // 0..860 ms scrubber
    scrubberSpeed: 1,
    chanNodeId: 'phase0_ina', // Active node in Cardiac Channelopathies Phase 0-4 AP diagram
    rightPanelMode: 'auto', // 'auto' | 'heart' | 'channelopathy'
    // Study Hub state
    studyFilter: 'all', // 'all' | 'missed' | 'flagged'
    questionIdx: 0,
    selectedLeads: [],
    selectedMcq: null,
    graded: false,
    // SkillStat Classic 6-Second Simulator & Game state
    skillstatSubMode: 'learn', // 'learn' | 'game'
    skillstatRhyId: 'R1',
    skillstatDynamic: true,
    skillstatShowGrid: true,
    skillstatHoverFrozen: false,
    skillstatDifficulty: 'novice', // 'novice' (3 attempts) | 'practitioner' (1 attempt)
    skillstatDurationSec: 60,
    skillstatRemainingSec: 60,
    skillstatGameActive: false,
    skillstatTargetRhyId: 'R1',
    skillstatAttemptsLeft: 3,
    skillstatWrongPicks: [],
    skillstatCorrectPick: null,
    skillstatTotalRhythms: 0,
    skillstatCorrectCount: 0,
    skillstatAttemptsTotal: 0,
    skillstatFeedback: '',
    skillstatFeedbackType: 'info',
    // EKG Compass (ekgcompass.com) 9-Step Interpreter + Electrolyte/Rhythm Tuner state
    compassSubMode: 'interpret', // 'interpret' | 'electrolyte_tuner'
    compassActiveStep: 1, // 1..9
    compassSampleId: 'stemi',
    compassState: { ...COMPASS_SAMPLE_CASES[1].patch },
    compassCopied: false,
    compassKMeq: 4.2,
    compassCaMgDl: 9.4,
    compassStenosisPct: 0,
    compassTuner: {
      reg: 'regular',
      pwave: 'upright_1to1',
      qrs: 'narrow',
      rate: 'normal'
    }
  };

  const root = document.createElement('section');
  root.className = 'clin-sim-shell';
  root.setAttribute('aria-label', 'Interactive Clinical ECG Simulator & Unlocked ECGLens Suite');
  mount.prepend(root);

  let rafId = null;
  let sweepSec = 12.0;
  let lastTs = 0;
  let gameTickAccum = 0;
  let audioCtx = null;
  let lastBeepBeat = -1;

  function getActiveCondition() {
    return CLINICAL_CONDITIONS.find(c => c.id === st.condId) || CLINICAL_CONDITIONS[0];
  }

  function getActiveSkillStatRhythm() {
    const id = st.skillstatSubMode === 'game' && st.skillstatGameActive ? st.skillstatTargetRhyId : st.skillstatRhyId;
    return SKILLSTAT_27_RHYTHMS.find(r => r.id === id) || SKILLSTAT_27_RHYTHMS[0];
  }

  function pickNextSkillStatGameRhythm() {
    const pool = SKILLSTAT_27_RHYTHMS.filter(r => r.id !== st.skillstatTargetRhyId);
    const chosen = pool[Math.floor(Math.random() * pool.length)] || SKILLSTAT_27_RHYTHMS[0];
    st.skillstatTargetRhyId = chosen.id;
    st.skillstatWrongPicks = [];
    st.skillstatCorrectPick = null;
    st.skillstatAttemptsLeft = st.skillstatDifficulty === 'novice' ? 3 : 1;
    st.skillstatTotalRhythms += 1;
  }

  function getActiveStage(ms) {
    return CONDUCTION_STAGES.find(s => ms >= s.startMs && ms <= s.endMs) || CONDUCTION_STAGES[CONDUCTION_STAGES.length - 1];
  }

  function playQrsBeep() {
    if (!st.soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.065);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.07);
    } catch (_) {}
  }

  function buildHeartCoronarySvg(cond, stage, isTr) {
    const culprit = st.blindMode ? 'None' : (cond.culprit || 'None');
    const ladActive = culprit.includes('LAD') || culprit.includes('LMCA');
    const lcxActive = culprit.includes('LCx') || culprit.includes('LMCA');
    const rcaActive = culprit.includes('RCA');

    const saActive = stage.id === 'sa';
    const atriaActive = stage.id === 'atria';
    const avnActive = stage.id === 'avn';
    const hisActive = stage.id === 'his';
    const branchActive = stage.id === 'branches';
    const purkActive = stage.id === 'purkinje';
    const repolActive = stage.id === 'repol';

    return `
      <svg viewBox="0 0 360 250" class="clin-heart-svg" role="img" aria-label="${isTr ? '3B Kalp İletim Yolu ve Koroner Arter Haritası' : '3D Heart Conduction & Coronary Artery Map'}">
        <defs>
          <radialGradient id="heartStudioBg" cx="50%" cy="52%" r="60%">
            <stop offset="0%" stop-color="#0f1d32"/>
            <stop offset="65%" stop-color="#080f1d"/>
            <stop offset="100%" stop-color="#030712"/>
          </radialGradient>
          <linearGradient id="myoLvGrad" x1="20%" y1="15%" x2="85%" y2="90%">
            <stop offset="0%" stop-color="${ladActive || lcxActive ? '#7f1d1d' : '#334155'}"/>
            <stop offset="55%" stop-color="${ladActive || lcxActive ? '#450a0a' : '#1e293b'}"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
          <linearGradient id="myoRvGrad" x1="15%" y1="20%" x2="80%" y2="90%">
            <stop offset="0%" stop-color="${rcaActive ? '#7f1d1d' : '#293548'}"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
          <linearGradient id="aortaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f87171"/>
            <stop offset="100%" stop-color="#991b1b"/>
          </linearGradient>
          <linearGradient id="svcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#60a5fa"/>
            <stop offset="100%" stop-color="#1e3a8a"/>
          </linearGradient>
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="ischemiaGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Studio Backdrop + Subtle Polar Coordinate Grid -->
        <rect x="0" y="0" width="360" height="250" rx="10" fill="url(#heartStudioBg)"/>
        <circle cx="176" cy="142" r="92" fill="none" stroke="rgba(56, 189, 248, 0.07)" stroke-dasharray="3,4"/>
        <circle cx="176" cy="142" r="64" fill="none" stroke="rgba(56, 189, 248, 0.06)"/>

        <!-- Great Vessels: SVC (Blue), Aortic Arch (Red), Pulmonary Trunk (Slate-Blue) -->
        <path d="M 118 36 L 118 68 C 118 74, 134 74, 134 68 L 134 36 Z" fill="url(#svcGrad)" opacity="0.72" stroke="#60a5fa" stroke-width="1"/>
        <path d="M 156 66 C 154 28, 204 24, 210 56 C 212 64, 196 68, 192 58 C 190 42, 170 42, 170 64 Z" fill="url(#aortaGrad)" opacity="0.85" stroke="#fca5a5" stroke-width="1.2"/>
        <path d="M 146 68 C 146 48, 182 46, 206 58" fill="none" stroke="#64748b" stroke-width="6" stroke-linecap="round" opacity="0.55"/>

        <!-- Epicardial Silhouette Outer Shadow -->
        <path d="M 122 58 C 84 64, 72 104, 86 144 C 98 188, 136 226, 184 236 C 234 228, 272 182, 262 128 C 256 90, 236 60, 196 56 Z"
              fill="rgba(15, 23, 42, 0.92)" stroke="rgba(148, 163, 184, 0.28)" stroke-width="1.5"/>

        <!-- Right Atrium (RA) & Left Atrium (LA) with Atrial Depolarization Glow -->
        <path d="M 134 58 C 94 60, 78 96, 92 128 C 104 140, 132 138, 150 124 C 152 98, 146 74, 134 58 Z"
              fill="${atriaActive ? 'rgba(245, 158, 11, 0.34)' : 'rgba(30, 41, 59, 0.82)'}"
              stroke="${atriaActive ? '#fbbf24' : '#475569'}" stroke-width="${atriaActive ? '2.2' : '1.4'}"/>
        <path d="M 192 56 C 232 52, 256 80, 248 114 C 236 128, 208 126, 184 116 C 182 94, 186 72, 192 56 Z"
              fill="${atriaActive ? 'rgba(245, 158, 11, 0.34)' : 'rgba(30, 41, 59, 0.82)'}"
              stroke="${atriaActive ? '#fbbf24' : '#475569'}" stroke-width="${atriaActive ? '2.2' : '1.4'}"/>

        <!-- Right Ventricle (RV) & Inferior Territory -->
        <path d="M 96 130 C 88 174, 118 220, 180 232 C 178 190, 170 152, 154 126 Z"
              fill="${purkActive ? 'rgba(16, 185, 129, 0.25)' : 'url(#myoRvGrad)'}"
              stroke="${rcaActive ? '#ef4444' : purkActive ? '#34d399' : '#64748b'}" stroke-width="1.8"/>

        <!-- Left Ventricle (LV) Thick Myocardial Wall & Apex -->
        <path d="M 156 124 C 172 154, 178 190, 182 232 C 238 224, 270 172, 250 116 C 226 126, 190 124, 156 124 Z"
              fill="${repolActive ? 'rgba(56, 189, 248, 0.24)' : purkActive ? 'rgba(16, 185, 129, 0.28)' : 'url(#myoLvGrad)'}"
              stroke="${ladActive || lcxActive ? '#ef4444' : repolActive ? '#38bdf8' : purkActive ? '#34d399' : '#94a3b8'}" stroke-width="2.2"/>

        <!-- Interventricular Septum (IVS) Muscular Band -->
        <path d="M 154 124 C 166 156, 174 192, 180 230"
              fill="none" stroke="${branchActive ? '#818cf8' : 'rgba(148, 163, 184, 0.35)'}" stroke-width="5" stroke-linecap="round"/>

        <!-- Regional Myocardial Ischemia / Infarct Territory Highlight Overlay -->
        ${ladActive ? `
          <ellipse cx="188" cy="186" rx="34" ry="40" transform="rotate(-14 188 186)"
                   fill="rgba(239, 68, 68, 0.26)" stroke="rgba(248, 113, 113, 0.55)" stroke-dasharray="4,3" filter="url(#ischemiaGlow)"/>
        ` : ''}
        ${lcxActive ? `
          <ellipse cx="234" cy="154" rx="22" ry="34" transform="rotate(18 234 154)"
                   fill="rgba(239, 68, 68, 0.26)" stroke="rgba(248, 113, 113, 0.55)" stroke-dasharray="4,3" filter="url(#ischemiaGlow)"/>
        ` : ''}
        ${rcaActive ? `
          <ellipse cx="144" cy="198" rx="34" ry="24" transform="rotate(24 144 198)"
                   fill="rgba(239, 68, 68, 0.26)" stroke="rgba(248, 113, 113, 0.55)" stroke-dasharray="4,3" filter="url(#ischemiaGlow)"/>
        ` : ''}

        <!-- EPICARDIAL CORONARY ARTERY TREE (RCA + AM + PDA, LMCA + LAD + D1/D2 + Septals, LCx + OM1/OM2) -->
        <!-- 1. Right Coronary Artery (RCA) + Acute Marginal (AM) + Posterior Descending (PDA) -->
        <g stroke="${rcaActive ? '#ef4444' : 'rgba(248, 113, 113, 0.42)'}" fill="none" stroke-linecap="round" ${rcaActive ? 'filter="url(#nodeGlow)"' : ''}>
          <path d="M 158 58 C 120 66, 90 104, 102 162 C 110 198, 144 220, 176 226" stroke-width="${rcaActive ? '3.5' : '1.8'}"/>
          <path d="M 100 138 C 114 152, 126 168, 132 184" stroke-width="${rcaActive ? '2.2' : '1.2'}"/>
          <path d="M 136 212 C 150 202, 160 194, 168 186" stroke-width="${rcaActive ? '2.0' : '1.1'}"/>
        </g>
        <text x="58" y="164" fill="${rcaActive ? '#fca5a5' : '#64748b'}" font-size="9.5" font-weight="800">RCA</text>

        <!-- 2. Left Main (LMCA) + LAD + Diagonal (D1, D2) + Septal Perforators -->
        <g stroke="${ladActive ? '#ef4444' : 'rgba(248, 113, 113, 0.48)'}" fill="none" stroke-linecap="round" ${ladActive ? 'filter="url(#nodeGlow)"' : ''}>
          <path d="M 184 56 L 180 72" stroke-width="${ladActive || lcxActive ? '4.2' : '2.4'}"/>
          <path d="M 180 72 C 176 106, 172 156, 180 228" stroke-width="${ladActive ? '3.8' : '2.0'}"/>
          <!-- D1 & D2 Diagonal Branches across Anterior-Lateral LV -->
          <path d="M 176 112 C 194 126, 210 144, 220 166" stroke-width="${ladActive ? '2.4' : '1.3'}"/>
          <path d="M 175 148 C 192 162, 206 178, 214 196" stroke-width="${ladActive ? '2.1' : '1.2'}"/>
          <!-- Septal Perforators into IVS -->
          <path d="M 176 104 L 164 114 M 175 132 L 163 142 M 176 162 L 165 170" stroke-width="${ladActive ? '1.8' : '1.0'}" opacity="0.85"/>
        </g>
        <text x="186" y="206" fill="${ladActive ? '#fca5a5' : '#64748b'}" font-size="9.5" font-weight="800">LAD · D1</text>

        <!-- 3. Left Circumflex (LCx) + Obtuse Marginal (OM1, OM2) -->
        <g stroke="${lcxActive ? '#ef4444' : 'rgba(248, 113, 113, 0.42)'}" fill="none" stroke-linecap="round" ${lcxActive ? 'filter="url(#nodeGlow)"' : ''}>
          <path d="M 180 72 C 218 82, 254 114, 248 172" stroke-width="${lcxActive ? '3.5' : '1.8'}"/>
          <path d="M 226 100 C 232 126, 232 152, 226 178" stroke-width="${lcxActive ? '2.3' : '1.2'}"/>
          <path d="M 244 128 C 246 150, 242 172, 234 190" stroke-width="${lcxActive ? '2.0' : '1.1'}"/>
        </g>
        <text x="256" y="144" fill="${lcxActive ? '#fca5a5' : '#64748b'}" font-size="9.5" font-weight="800">LCx · OM</text>

        <!-- Culprit Thrombus / Plaque Occlusion Marker -->
        ${ladActive ? `
          <circle cx="177" cy="102" r="6.5" fill="rgba(239, 68, 68, 0.35)" stroke="#fef08a" stroke-width="1.8"/>
          <circle cx="177" cy="102" r="2.8" fill="#fef08a"/>
        ` : rcaActive ? `
          <circle cx="104" cy="126" r="6.5" fill="rgba(239, 68, 68, 0.35)" stroke="#fef08a" stroke-width="1.8"/>
          <circle cx="104" cy="126" r="2.8" fill="#fef08a"/>
        ` : lcxActive ? `
          <circle cx="222" cy="96" r="6.5" fill="rgba(239, 68, 68, 0.35)" stroke="#fef08a" stroke-width="1.8"/>
          <circle cx="222" cy="96" r="2.8" fill="#fef08a"/>
        ` : ''}

        <!-- CARDIAC CONDUCTION SYSTEM OVERLAY (7 STAGES: SA -> Internodal/Bachmann -> AVN -> His -> RBBB/LAFB/LPFB -> Purkinje) -->
        <!-- Internodal Pathways & Bachmann's Bundle -->
        <path d="M 112 76 C 126 94, 140 108, 154 118 M 112 76 C 118 98, 134 114, 154 118 M 112 76 C 152 60, 196 62, 226 82"
              fill="none" stroke="${atriaActive ? '#fbbf24' : 'rgba(251, 191, 36, 0.45)'}"
              stroke-width="${atriaActive ? '2.8' : '1.5'}" stroke-dasharray="3,2" ${atriaActive ? 'filter="url(#nodeGlow)"' : ''}/>

        <!-- Penetrating Bundle of His -->
        <line x1="154" y1="118" x2="162" y2="136"
              stroke="${hisActive ? '#c4b5fd' : '#818cf8'}"
              stroke-width="${hisActive ? '4.2' : '2.4'}" stroke-linecap="round" ${hisActive ? 'filter="url(#nodeGlow)"' : ''}/>

        <!-- Right Bundle Branch (RBBB) + Left Bundle Branch (LAFB & LPFB Fascicles) -->
        <path d="M 162 136 C 150 166, 138 192, 124 206 M 162 136 C 186 162, 210 188, 226 202 M 172 152 C 192 144, 214 146, 232 158"
              fill="none" stroke="${branchActive ? '#a5b4fc' : 'rgba(129, 140, 248, 0.55)'}"
              stroke-width="${branchActive ? '3.2' : '1.8'}" stroke-linecap="round" ${branchActive ? 'filter="url(#nodeGlow)"' : ''}/>

        <!-- Subendocardial Purkinje Fiber Arborization -->
        <path d="M 124 206 C 108 196, 102 174, 108 154 M 116 196 L 126 182 M 226 202 C 244 188, 248 162, 240 138 M 234 188 L 218 176"
              fill="none" stroke="${purkActive ? '#34d399' : 'rgba(52, 211, 153, 0.5)'}"
              stroke-width="${purkActive ? '3.0' : '1.6'}" stroke-dasharray="2,2" ${purkActive ? 'filter="url(#nodeGlow)"' : ''}/>

        <!-- SA Node (Sinoatrial Pacemaker) -->
        <circle cx="112" cy="76" r="${saActive ? '7.5' : '5.2'}"
                fill="${saActive ? '#fde047' : '#f59e0b'}" stroke="#ffffff" stroke-width="1.6"
                ${saActive ? 'filter="url(#nodeGlow)"' : ''}/>
        <text x="68" y="74" fill="#fde68a" font-size="9.5" font-weight="800">SA</text>

        <!-- AV Node (Atrioventricular Delay Gate) -->
        <circle cx="154" cy="118" r="${avnActive ? '7.0' : '4.8'}"
                fill="${avnActive ? '#fda4af' : '#f43f5e'}" stroke="#ffffff" stroke-width="1.6"
                ${avnActive ? 'filter="url(#nodeGlow)"' : ''}/>
        <text x="122" y="122" fill="#fda4af" font-size="9.5" font-weight="800">AVN</text>

        <!-- Top Telemetry HUD Bar -->
        <rect x="8" y="8" width="344" height="24" rx="6" fill="rgba(9, 14, 23, 0.88)" stroke="rgba(56, 189, 248, 0.28)"/>
        <circle cx="22" cy="20" r="4.8" fill="${stage.color}"/>
        <text x="34" y="24" fill="#f8fafc" font-size="10.5" font-weight="800">
          ${isTr ? stage.tr : stage.en} (${stage.startMs}–${stage.endMs} ms · ${stage.wave})
        </text>
        <text x="342" y="24" fill="#38bdf8" font-size="10" font-weight="700" text-anchor="end">${stage.vel}</text>
      </svg>
    `;
  }

  let smoothedDt = 1 / 60;

  // Smooth C-infinity monotonic beat-phase mapper for regular & irregular (AFib/MAT) rhythms
  function mapContinuousBeatPhase(tSec, rrSec, isIrregular) {
    const safeT = Math.max(0, tSec);
    const baseU = safeT / rrSec;
    // Strictly positive derivative du/d(baseU) = 1 + 0.238*cos(1.7*baseU) - 0.261*sin(2.9*baseU - 0.5) > 0.50
    const u = isIrregular
      ? baseU + 0.14 * Math.sin(baseU * 1.7) + 0.09 * Math.cos(baseU * 2.9 - 0.5)
      : baseU;
    const beatIdx = Math.floor(u);
    const phase = u - beatIdx;
    return { beatIdx, phase };
  }

  // Peak-preserving sub-pixel supersampler (prevents R-wave vertical bobbing & baseline shimmer)
  function sampleSmoothLeadMv(cond, lead, centerSec, pixelWindowSec, rrSec, hr) {
    const isIrreg = Boolean(cond.morph?.irregular);
    const evalAt = t => {
      const { beatIdx, phase } = mapContinuousBeatPhase(t, rrSec, isIrreg);
      return { mv: sampleConditionLeadMv(cond, lead, phase, beatIdx, hr), phase };
    };
    const c = evalAt(centerSec);
    const l = evalAt(centerSec - pixelWindowSec * 0.36);
    const r = evalAt(centerSec + pixelWindowSec * 0.36);
    // Inside QRS complex window, preserve exact extremum (R peak or S nadir)
    if (c.phase > 0.23 && c.phase < 0.37) {
      let best = c.mv;
      if (Math.abs(l.mv) > Math.abs(best)) best = l.mv;
      if (Math.abs(r.mv) > Math.abs(best)) best = r.mv;
      return best;
    }
    // Outside QRS complex, apply 3-tap Gaussian anti-aliasing filter
    return 0.25 * l.mv + 0.50 * c.mv + 0.25 * r.mv;
  }

  function renderCanvasFrame() {
    const canvas = root.querySelector('#clin-sim-canvas');
    if (!canvas) return;

    // HiDPI Retina backing store setup (once per canvas element)
    const logicalW = Number(canvas.dataset.logicalW || canvas.getAttribute('width') || 760);
    const logicalH = Number(canvas.dataset.logicalH || canvas.getAttribute('height') || 310);
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    if (!canvas.dataset.logicalW) {
      canvas.dataset.logicalW = String(logicalW);
      canvas.dataset.logicalH = String(logicalH);
    }
    if (canvas.width !== Math.round(logicalW * dpr) || canvas.height !== Math.round(logicalH * dpr)) {
      canvas.width = Math.round(logicalW * dpr);
      canvas.height = Math.round(logicalH * dpr);
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const W = logicalW;
    const H = logicalH;
    const cond = getActiveCondition();
    const hr = st.hrOverride || cond.hr || 72;
    const isTr = getLang() === 'tr';

    // SKILLSTAT SIX-SECOND ECG SIMULATOR CLASSIC RENDERER
    if (st.mode === 'skillstat') {
      const rhy = getActiveSkillStatRhythm();
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, W, H);

      if (st.skillstatShowGrid) {
        // 6-second strip = 30 large boxes (each large box = 0.20s, 5 large boxes = 1.0s)
        const boxW = W / 30;
        const smallW = boxW / 5;
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.24)';
        ctx.beginPath();
        for (let x = 0; x <= W; x += smallW) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
        for (let y = 0; y <= H; y += smallW) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
        ctx.stroke();

        ctx.lineWidth = 1.15;
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.38)';
        ctx.beginPath();
        for (let i = 0; i <= 30; i++) {
          const x = i * boxW;
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
        }
        for (let y = 0; y <= H; y += boxW) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
        ctx.stroke();

        // Top 1.0 sec & 3.0 sec & 6.0 sec Six-Second Ruler Markers (SkillStat Signature)
        ctx.fillStyle = '#0f172a';
        ctx.font = '800 10.5px ui-monospace, SFMono-Regular, monospace';
        for (let sec = 0; sec <= 6; sec++) {
          const sx = (sec / 6) * (W - 24) + 12;
          ctx.fillStyle = sec % 3 === 0 ? '#dc2626' : '#0284c7';
          ctx.fillRect(sx - 1, 6, 2.2, sec % 3 === 0 ? 12 : 8);
          ctx.fillText(`${sec}.0s`, Math.min(W - 32, Math.max(4, sx - 12)), 28);
        }
        ctx.fillStyle = '#0369a1';
        ctx.fillText(isTr ? '1 Büyük Kare = 0.20 sn · 5 Büyük Kare = 1.0 sn · 6 Sn Şerit (R Sayısı × 10 = HR)' : '1 Large Box = 0.20s · 5 Large Boxes = 1.0s · 6-Second Strip (R Count × 10 = HR)', 14, H - 10);
      }

      // Draw 6-second Lead II waveform with stationary calibrated paper + smooth sweep bar (zero scroll jitter)
      const yMid = H * 0.54;
      const pxPerMv = 54;
      const spanSec = 6.0;
      const dtPx = spanSec / W;
      const activeSweepSec = st.skillstatHoverFrozen ? (st.skillstatFrozenAtSec ?? sweepSec) : sweepSec;
      const sweepHeadX = ((activeSweepSec % spanSec) / spanSec) * W;

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      let penDown = false;
      for (let x = 0; x < W; x += 0.75) {
        if (st.skillstatDynamic && !st.skillstatHoverFrozen && x > sweepHeadX && x < sweepHeadX + 18) {
          penDown = false;
          continue;
        }
        const relSec = (x / W) * spanSec;
        const tC = st.skillstatDynamic
          ? Math.max(0, Math.floor(activeSweepSec / spanSec) * spanSec + relSec - (x > sweepHeadX ? spanSec : 0))
          : relSec;
        const mC = sampleSkillStatLeadIIMv(rhy.id, tC);
        const mL = sampleSkillStatLeadIIMv(rhy.id, Math.max(0, tC - dtPx * 0.35));
        const mR = sampleSkillStatLeadIIMv(rhy.id, tC + dtPx * 0.35);
        let mv = 0.25 * mL + 0.50 * mC + 0.25 * mR;
        if (Math.abs(mC) > 0.35 || Math.abs(mL) > 0.35 || Math.abs(mR) > 0.35) {
          mv = Math.abs(mL) > Math.abs(mC) ? mL : mC;
          if (Math.abs(mR) > Math.abs(mv)) mv = mR;
        }
        const y = yMid - mv * pxPerMv;
        if (!penDown) {
          ctx.moveTo(x, y);
          penDown = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      if (st.skillstatDynamic && !st.skillstatHoverFrozen) {
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(sweepHeadX, yMid, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (st.skillstatHoverFrozen) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
        ctx.fillRect(W - 225, 8, 215, 24);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '800 11px ui-sans-serif, system-ui, sans-serif';
        ctx.fillText(isTr ? '❄️ ŞERİT DONDURULDU (Hover Freeze)' : '❄️ STRIP FROZEN (Hover Freeze)', W - 215, 24);
      }
      return;
    }

    // Draw Warm Calibrated ECG Paper Grid
    ctx.fillStyle = '#fff9f5';
    ctx.fillRect(0, 0, W, H);

    // Minor 1mm grid (4px) and Major 5mm grid (20px)
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.22)';
    ctx.beginPath();
    for (let x = 0; x <= W; x += 4) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y <= H; y += 4) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    ctx.lineWidth = 1.1;
    ctx.strokeStyle = 'rgba(225, 29, 72, 0.32)';
    ctx.beginPath();
    for (let x = 0; x <= W; x += 20) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y <= H; y += 20) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    // EKG COMPASS LIVE ELECTROLYTE (K+ / Ca2+) WAVEFORM RENDERER (Stationary Grid + Smooth Sweep Head)
    if (st.mode === 'compass' && st.compassSubMode === 'electrolyte_tuner') {
      const yMid = H * 0.56;
      const pxPerMv = 54;
      const spanSec = 4.8;
      const sweepHeadX = 14 + ((sweepSec % spanSec) / spanSec) * (W - 28);

      ctx.fillStyle = '#0f172a';
      ctx.font = '800 12px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText(
        isTr
          ? `CANLI SERUM ELEKTROLİT DALGASI (DII) · K⁺: ${st.compassKMeq.toFixed(1)} mEq/L · Ca²⁺: ${st.compassCaMgDl.toFixed(1)} mg/dL`
          : `LIVE SERUM ELECTROLYTE TRACE (LEAD II) · K⁺: ${st.compassKMeq.toFixed(1)} mEq/L · Ca²⁺: ${st.compassCaMgDl.toFixed(1)} mg/dL`,
        14,
        20
      );

      ctx.strokeStyle = st.compassKMeq >= 7.5 ? '#dc2626' : st.compassKMeq >= 6.0 || st.compassKMeq <= 3.0 ? '#d97706' : '#0f172a';
      ctx.lineWidth = 2.35;
      ctx.beginPath();
      let penDown = false;
      for (let x = 14; x < W - 14; x += 0.75) {
        if (st.running && x > sweepHeadX && x < sweepHeadX + 20) {
          penDown = false;
          continue;
        }
        const relSec = ((x - 14) / (W - 28)) * spanSec;
        const sampleSec = Math.floor(sweepSec / spanSec) * spanSec + relSec - (x > sweepHeadX ? spanSec : 0);
        const mv = sampleElectrolyteLeadIIMv(st.compassKMeq, st.compassCaMgDl, Math.max(0, sampleSec));
        const y = yMid - mv * pxPerMv;
        if (!penDown) {
          ctx.moveTo(x, y);
          penDown = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      if (st.running) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(sweepHeadX, yMid, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    if (st.mode === '12lead' || st.mode === 'study' || (st.mode === 'compass' && st.compassSubMode === 'interpret')) {
      // 12-Lead Standard 4x3 Grid + Rhythm Strip II at Bottom
      // Uses stationary calibrated ECG paper + synchronized sweep head so waveforms never shimmer/jitter!
      const cols = 4;
      const rows = 3;
      const cellW = W / cols;
      const rowH = (H - 68) / rows;
      const order = [
        ['I', 'aVR', 'V1', 'V4'],
        ['II', 'aVL', 'V2', 'V5'],
        ['III', 'aVF', 'V3', 'V6']
      ];

      ctx.strokeStyle = 'rgba(15, 23, 42, 0.18)';
      ctx.lineWidth = 1;
      for (let c = 1; c < cols; c++) {
        ctx.beginPath(); ctx.moveTo(c * cellW, 0); ctx.lineTo(c * cellW, H - 68); ctx.stroke();
      }
      for (let r = 1; r <= rows; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * rowH); ctx.lineTo(W, r * rowH); ctx.stroke();
      }

      const rrSec = 60 / Math.max(30, hr);
      const cellSpanSec = st.paperSpeed === 50 ? 1.25 : 2.5;
      const stripSpanSec = st.paperSpeed === 50 ? 5.0 : 10.0;
      const sweepFrac = (sweepSec % stripSpanSec) / stripSpanSec;
      const stripSweepX = 8 + sweepFrac * (W - 16);

      order.forEach((rowLeads, rIdx) => {
        rowLeads.forEach((ld, cIdx) => {
          const x0 = cIdx * cellW;
          const yMid = rIdx * rowH + rowH * 0.56;
          const isAffected = !st.blindMode && st.mode !== 'study' && cond.affectedLeads.includes(ld);
          const isRecip = !st.blindMode && st.mode !== 'study' && cond.reciprocalLeads.includes(ld);

          if (isAffected) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
            ctx.fillRect(x0 + 1, rIdx * rowH + 1, cellW - 2, rowH - 2);
          } else if (isRecip) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
            ctx.fillRect(x0 + 1, rIdx * rowH + 1, cellW - 2, rowH - 2);
          }

          ctx.fillStyle = isAffected ? '#dc2626' : isRecip ? '#0284c7' : '#0f172a';
          ctx.font = '800 12px ui-sans-serif, system-ui, sans-serif';
          ctx.fillText(ld, x0 + 8, rIdx * rowH + 16);

          const usableW = cellW - 8;
          const dtPx = cellSpanSec / usableW;
          const colStartSec = cIdx * cellSpanSec;

          ctx.strokeStyle = isAffected ? '#b91c1c' : '#111827';
          ctx.lineWidth = 1.75;
          ctx.beginPath();
          let penDown = false;
          for (let px = 4; px < cellW - 4; px += 0.75) {
            const screenX = x0 + px;
            if (st.running && screenX > stripSweepX && screenX < stripSweepX + 14) {
              penDown = false;
              continue;
            }
            const relSec = colStartSec + ((px - 4) / usableW) * cellSpanSec;
            const sampleSec = Math.floor(sweepSec / stripSpanSec) * stripSpanSec + relSec - (screenX > stripSweepX ? stripSpanSec : 0);
            let mv = sampleSmoothLeadMv(cond, ld, Math.max(0, sampleSec), dtPx, rrSec, hr);
            // Simulate LA/RA limb reversal visually if active in Compass
            if (st.mode === 'compass' && st.compassState.avrPositive === 'yes' && st.compassState.precordialProg !== 'reversed') {
              if (ld === 'I' || ld === 'aVR' || ld === 'aVL') mv = -mv;
            }
            const y = yMid - mv * 30;
            if (!penDown) {
              ctx.moveTo(screenX, y);
              penDown = true;
            } else {
              ctx.lineTo(screenX, y);
            }
          }
          ctx.stroke();
        });
      });

      const ryMid = H - 32;
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 11.5px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText(isTr ? `RİTİM ŞERİDİ: II (${st.paperSpeed} mm/sn · 10 mm/mV)` : `RHYTHM STRIP: II (${st.paperSpeed} mm/s · 10 mm/mV)`, 8, H - 52);

      const stripUsableW = W - 16;
      const stripDtPx = stripSpanSec / stripUsableW;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.85;
      ctx.beginPath();
      let stripPen = false;
      for (let x = 8; x < W - 8; x += 0.75) {
        if (st.running && x > stripSweepX && x < stripSweepX + 16) {
          stripPen = false;
          continue;
        }
        const relSec = ((x - 8) / stripUsableW) * stripSpanSec;
        const sampleSec = Math.floor(sweepSec / stripSpanSec) * stripSpanSec + relSec - (x > stripSweepX ? stripSpanSec : 0);
        const mv = sampleSmoothLeadMv(cond, 'II', Math.max(0, sampleSec), stripDtPx, rrSec, hr);
        const y = ryMid - mv * 24;
        if (!stripPen) {
          ctx.moveTo(x, y);
          stripPen = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      if (st.running) {
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(stripSweepX, 2);
        ctx.lineTo(stripSweepX, H - 4);
        ctx.stroke();
      }
      return;
    }

    // LIVE SWEEP MONITOR MODE (ECGSweep + ECGLens Conduction Highlighting)
    const yMid = H * 0.56;
    const pxPerMv = 42;
    const speedFactor = st.paperSpeed === 50 ? 3.2 : 6.0;
    const rrSec = 60 / Math.max(30, hr);

    // 1mV Calibration Pulse at left
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(8, yMid);
    ctx.lineTo(14, yMid);
    ctx.lineTo(14, yMid - pxPerMv);
    ctx.lineTo(30, yMid - pxPerMv);
    ctx.lineTo(30, yMid);
    ctx.lineTo(36, yMid);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '800 12.5px ui-sans-serif, system-ui, sans-serif';
    const titleLabel = st.blindMode
      ? (isTr ? '🔒 KENDİN OKU MODU (Tanı Gizli)' : '🔒 READ IT YOURSELF MODE (Diagnosis Hidden)')
      : (isTr ? cond.tr : cond.en);
    ctx.fillText(`${st.activeLead} · ${titleLabel}`, 44, 20);
    ctx.font = '700 11px ui-monospace, SFMono-Regular, monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText(`${st.paperSpeed} mm/s · 10 mm/mV`, W - 135, 20);

    const usableW = W - 56;
    const dtPx = speedFactor / usableW;
    const sweepHeadX = 44 + ((sweepSec % speedFactor) / speedFactor) * usableW;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.25;
    ctx.beginPath();
    let penDown = false;

    for (let x = 44; x < W - 12; x += 0.75) {
      if (st.running && x > sweepHeadX && x < sweepHeadX + 24) {
        penDown = false;
        continue;
      }
      const relSec = ((x - 44) / usableW) * speedFactor;
      const sampleSec = Math.floor(sweepSec / speedFactor) * speedFactor + relSec - (x > sweepHeadX ? speedFactor : 0);
      const safeSec = Math.max(0, sampleSec);
      let mv = sampleSmoothLeadMv(cond, st.activeLead, safeSec, dtPx, rrSec, hr);
      if (st.noiseLevel > 0) {
        // Spatially locked to sampleSec so already-drawn trace never vibrates on paper
        mv += st.noiseLevel * (Math.sin(safeSec * 190 + x * 0.65) * 0.55);
      }
      const y = yMid - mv * pxPerMv;
      if (!penDown) {
        ctx.moveTo(x, y);
        penDown = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    if (st.running) {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(sweepHeadX, yMid, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Conduction band under the trace: each column shows the stage of the same
    // instant as the trace above it (same time axis, same beat-phase mapper).
    const bandY = H - 24;
    const tl = conductionTimeline(cond);
    const isIrreg = Boolean(cond.morph?.irregular);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.06)';
    ctx.fillRect(44, bandY, W - 56, 14);
    let headBeat = null, playheadX = sweepHeadX, bestGap = Infinity;
    for (let x = 44; x < W - 12; x += 1) {
      if (st.running && x > sweepHeadX && x < sweepHeadX + 24) continue;
      const relSec = ((x - 44) / usableW) * speedFactor;
      const sampleSec = Math.max(0, Math.floor(sweepSec / speedFactor) * speedFactor + relSec - (x > sweepHeadX ? speedFactor : 0));
      const { beatIdx, phase } = mapContinuousBeatPhase(sampleSec, rrSec, isIrreg);
      const at = conductionAt(tl, phase, beatIdx);
      if (x <= sweepHeadX) headBeat = beatIdx;
      if (!st.running && at.ms !== null && beatIdx === headBeat && Math.abs(at.ms - st.conductionMs) < bestGap) { bestGap = Math.abs(at.ms - st.conductionMs); playheadX = x; }
      if (!at.id) continue;
      if (at.id === 'fibrillation' || at.id === 'flutter') {
        // Disorganized atria: a hatched band, no SA node or atrial-spread sequence.
        ctx.fillStyle = (Math.floor(x / 3) % 2) ? '#f59e0b40' : '#f59e0b18';
      } else ctx.fillStyle = `${STAGE_BY_ID[at.id].color}66`;
      ctx.fillRect(x, bandY, 1, 14);
    }
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, bandY - 6);
    ctx.lineTo(playheadX, bandY + 16);
    ctx.stroke();
  }

  function stepAnimation(ts) {
    if (!lastTs) lastTs = ts;
    const rawDt = Math.min(0.05, Math.max(0.001, (ts - lastTs) / 1000));
    lastTs = ts;
    smoothedDt = smoothedDt * 0.85 + rawDt * 0.15;
    const dt = smoothedDt;

    if (st.mode === 'skillstat' && st.skillstatSubMode === 'game' && st.skillstatGameActive) {
      gameTickAccum += rawDt;
      if (gameTickAccum >= 1.0) {
        gameTickAccum -= 1.0;
        st.skillstatRemainingSec = Math.max(0, st.skillstatRemainingSec - 1);
        const timerNode = root.querySelector('#skillstat-timer-val');
        if (timerNode) {
          const mins = String(Math.floor(st.skillstatRemainingSec / 60)).padStart(2, '0');
          const secs = String(st.skillstatRemainingSec % 60).padStart(2, '0');
          timerNode.textContent = `${mins}:${secs}`;
        }
        if (st.skillstatRemainingSec === 0) {
          st.skillstatGameActive = false;
          const isTr = getLang() === 'tr';
          const pct = st.skillstatTotalRhythms > 0 ? Math.round((st.skillstatCorrectCount / st.skillstatTotalRhythms) * 100) : 0;
          st.skillstatFeedback = isTr
            ? `🏁 Süre Doldu! Skorunuz: %${pct} (${st.skillstatCorrectCount} / ${st.skillstatTotalRhythms} ritim doğru, toplam ${st.skillstatAttemptsTotal} deneme).`
            : `🏁 Time Up! Final Score: ${pct}% (${st.skillstatCorrectCount} / ${st.skillstatTotalRhythms} rhythms correct in ${st.skillstatAttemptsTotal} attempts).`;
          st.skillstatFeedbackType = 'ok';
          render();
        }
      }
    }

    if (st.running && !st.collapsed) {
      // Slow motion slows the sweep itself, so the trace and the conduction stay together.
      sweepSec += dt * st.scrubberSpeed;
      const cond = getActiveCondition();
      const hr = st.hrOverride || cond.hr || 72;
      const rrSec = 60 / Math.max(30, hr);
      const currentBeat = Math.floor(sweepSec / rrSec);
      const beatPhase = (sweepSec % rrSec) / rrSec;
      if (beatPhase > 0.28 && beatPhase < 0.34 && currentBeat !== lastBeepBeat) {
        lastBeepBeat = currentBeat;
        playQrsBeep();
      }
      const { beatIdx: nowBeat, phase: nowPhase } = mapContinuousBeatPhase(sweepSec, rrSec, Boolean(cond.morph?.irregular));
      const now = conductionAt(conductionTimeline(cond), nowPhase, nowBeat);
      if (now.ms !== null) st.conductionMs = Math.round(now.ms);
      const scrubInput = root.querySelector('#clin-conduction-slider');
      const scrubLabel = root.querySelector('#clin-conduction-ms-val');
      if (scrubInput) scrubInput.value = String(st.conductionMs);
      if (scrubLabel) scrubLabel.textContent = `${st.conductionMs} ms`;
      renderCanvasFrame();
    }
    rafId = requestAnimationFrame(stepAnimation);
  }

  function renderCompassStepBody(isTr, compassEval) {
    const cs = st.compassState;
    const step = st.compassActiveStep;

    if (step === 1) {
      return `
        <div class="compass-field-grid">
          <div class="compass-field-box">
            <label>${isTr ? '1A. Kalibrasyon (Standart = 10 mm/mV):' : '1A. Calibration (Standard = 10 mm/mV):'}</label>
            <div class="clin-lead-pills">
              ${[
                { v: '10', tr: '10 mm/mV (Standart)', en: '10 mm/mV (Standard)' },
                { v: '5', tr: '5 mm/mV (Yarım)', en: '5 mm/mV (Half)' },
                { v: '20', tr: '20 mm/mV (Çift)', en: '20 mm/mV (Double)' }
              ].map(o => `<button type="button" class="clin-lead-pill ${cs.calibration === o.v ? 'active' : ''}" data-compass-set="calibration:${o.v}">${isTr ? o.tr : o.en}</button>`).join('')}
            </div>
          </div>
          <div class="compass-field-box">
            <label>${isTr ? '1B. Kağıt Hızı (Standart = 25 mm/sn):' : '1B. Paper Speed (Standard = 25 mm/s):'}</label>
            <div class="clin-lead-pills">
              ${[
                { v: '25', tr: '25 mm/sn (Standart)', en: '25 mm/s (Standard)' },
                { v: '50', tr: '50 mm/sn (2x Hızlı)', en: '50 mm/s (Double Speed)' }
              ].map(o => `<button type="button" class="clin-lead-pill ${cs.paperSpeed === o.v ? 'active' : ''}" data-compass-set="paperSpeed:${o.v}">${isTr ? o.tr : o.en}</button>`).join('')}
            </div>
          </div>
          <div class="compass-field-box">
            <label>${isTr ? '1C. İzoelektrik Hat & Artefakt:' : '1C. Baseline & Artifact:'}</label>
            <div class="clin-lead-pills">
              ${[
                { v: 'clean', tr: 'Temiz Hat', en: 'Clean' },
                { v: 'tremor', tr: 'Kas Tremoru (Parkinson/Titreme)', en: 'Muscle Tremor' },
                { v: 'wander', tr: 'Solunum Gezinmesi', en: 'Baseline Wander' },
                { v: 'loose', tr: 'Gevşek Elektrot', en: 'Loose Electrode' }
              ].map(o => `<button type="button" class="clin-lead-pill ${cs.artifact === o.v ? 'active' : ''}" data-compass-set="artifact:${o.v}">${isTr ? o.tr : o.en}</button>`).join('')}
            </div>
          </div>
        </div>
      `;
    }

    if (step === 2) {
      return `
        <div class="compass-field-grid">
          <div class="compass-field-box">
            <label>${isTr ? '2A. aVR Derivasyonunda QRS/P Baskın Pozitif mi?' : '2A. Is aVR Predominantly Positive?'}</label>
            <div class="clin-lead-pills">
              <button type="button" class="clin-lead-pill ${cs.avrPositive === 'no' ? 'active' : ''}" data-compass-set="avrPositive:no">${isTr ? 'Hayır (Normal Negatif aVR)' : 'No (Normal Negative aVR)'}</button>
              <button type="button" class="clin-lead-pill ${cs.avrPositive === 'yes' ? 'active' : ''}" data-compass-set="avrPositive:yes">${isTr ? '⚠️ Evet (aVR Pozitif!)' : '⚠️ Yes (aVR Positive!)'}</button>
            </div>
          </div>
          <div class="compass-field-box">
            <label>${isTr ? '2B. V1–V6 Prekordiyal R Dalgası Progresyonu (LA/RA Tersliği vs Dekstrokardi Ayrımı):' : '2B. V1–V6 Precordial R Progression (LA/RA Reversal vs Dextrocardia):'}</label>
            <div class="clin-lead-pills">
              <button type="button" class="clin-lead-pill ${cs.precordialProg === 'normal' ? 'active' : ''}" data-compass-set="precordialProg:normal">${isTr ? 'Normal (V1→V5 Büyüyor = LA/RA Tersliği)' : 'Normal (Grows V1→V5 = LA/RA Swap)'}</button>
              <button type="button" class="clin-lead-pill ${cs.precordialProg === 'poor' ? 'active' : ''}" data-compass-set="precordialProg:poor">${isTr ? 'Zayıf R Progresyonu (V3 R < 3mm)' : 'Poor R Progression (R in V3 < 3mm)'}</button>
              <button type="button" class="clin-lead-pill ${cs.precordialProg === 'reversed' ? 'active' : ''}" data-compass-set="precordialProg:reversed">${isTr ? 'Ters (V1→V6 Küçülüyor = Dekstrokardi!)' : 'Reversed (Shrinks V1→V6 = Dextrocardia!)'}</button>
            </div>
          </div>
          <div class="compass-field-box">
            <label>${isTr ? '2C. P(DI) > P(DII) mi? (LA/LL Tersliği) & Düz Çizgi (RL Toprak Tersliği):' : '2C. P(I) > P(II) (LA/LL Swap) & Flatline Limb Lead (RL Ground Swap):'}</label>
            <div class="clin-lead-pills">
              <button type="button" class="clin-lead-pill ${cs.pTallerLeadI === 'no' ? 'active' : ''}" data-compass-set="pTallerLeadI:no">${isTr ? 'Normal P(DII) > P(DI)' : 'Normal P(II) > P(I)'}</button>
              <button type="button" class="clin-lead-pill ${cs.pTallerLeadI === 'yes' ? 'active' : ''}" data-compass-set="pTallerLeadI:yes">${isTr ? '⚠️ P(DI) > P(DII) (LA/LL Tersliği)' : '⚠️ P(I) > P(II) (LA/LL Reversal)'}</button>
              <button type="button" class="clin-lead-pill ${cs.flatLimbLead === 'none' ? 'active' : ''}" data-compass-set="flatLimbLead:none">${isTr ? 'Düz Derivasyon Yok' : 'No Flat Limb Lead'}</button>
              <button type="button" class="clin-lead-pill ${cs.flatLimbLead === 'leadIII' ? 'active' : ''}" data-compass-set="flatLimbLead:leadIII">${isTr ? '⚠️ DIII Düz Çizgi (RL Tersliği)' : '⚠️ Flat Lead III (RL Swap)'}</button>
            </div>
          </div>
        </div>
      `;
    }

    if (step === 3) {
      return `
        <div class="compass-field-grid">
          <div class="compass-field-box">
            <label>${isTr ? '3A. R-R Düzenliliği:' : '3A. R-R Regularity:'}</label>
            <div class="clin-lead-pills">
              <button type="button" class="clin-lead-pill ${cs.regularity === 'regular' ? 'active' : ''}" data-compass-set="regularity:regular">${isTr ? 'Düzenli (Regular)' : 'Regular'}</button>
              <button type="button" class="clin-lead-pill ${cs.regularity === 'reg_irreg' ? 'active' : ''}" data-compass-set="regularity:reg_irreg">${isTr ? 'Düzenli Düzensiz (Grup Atım / Bigemini)' : 'Regularly Irregular (Group Beating)'}</button>
              <button type="button" class="clin-lead-pill ${cs.regularity === 'irreg_irreg' ? 'active' : ''}" data-compass-set="regularity:irreg_irreg">${isTr ? 'Düzensiz Düzensiz (AFib / MAT)' : 'Irregularly Irregular (AFib / MAT)'}</button>
            </div>
          </div>
          <div class="compass-field-box">
            <label>${isTr ? '3B. P Dalgası Morfolojisi:' : '3B. P-Wave Morphology:'}</label>
            <div class="clin-lead-pills">
              <button type="button" class="clin-lead-pill ${cs.pWave === 'sinus' ? 'active' : ''}" data-compass-set="pWave:sinus">${isTr ? 'Sinüs P (+ DII, − aVR)' : 'Sinus P (+ II, − aVR)'}</button>
              <button type="button" class="clin-lead-pill ${cs.pWave === 'absent_fib' ? 'active' : ''}" data-compass-set="pWave:absent_fib">${isTr ? 'Yok / Fibrilatuar (AFib)' : 'Absent / Fibrillatory (AFib)'}</button>
              <button type="button" class="clin-lead-pill ${cs.pWave === 'flutter_sawtooth' ? 'active' : ''}" data-compass-set="pWave:flutter_sawtooth">${isTr ? 'Testere Dişi F Dalgası (Flutter)' : 'Sawtooth Flutter Waves'}</button>
              <button type="button" class="clin-lead-pill ${cs.pWave === 'multimorph_mat' ? 'active' : ''}" data-compass-set="pWave:multimorph_mat">${isTr ? '≥3 Farklı P Şekli (MAT/WAP)' : '≥3 Distinct P Shapes (MAT)'}</button>
            </div>
          </div>
          <div class="compass-field-box">
            <label>${isTr ? '3C. P : QRS İletim İlişkisi:' : '3C. P-to-QRS Relationship:'}</label>
            <div class="clin-lead-pills">
              <button type="button" class="clin-lead-pill ${cs.pQrsRel === 'one_to_one' ? 'active' : ''}" data-compass-set="pQrsRel:one_to_one">1:1</button>
              <button type="button" class="clin-lead-pill ${cs.pQrsRel === 'wenckebach' ? 'active' : ''}" data-compass-set="pQrsRel:wenckebach">${isTr ? 'Uzayan PR + Düşen QRS (Wenckebach)' : 'Prolonging PR + Drop (Wenckebach)'}</button>
              <button type="button" class="clin-lead-pill ${cs.pQrsRel === 'mobitz2' ? 'active' : ''}" data-compass-set="pQrsRel:mobitz2">${isTr ? 'Sabit PR + Düşen QRS (Mobitz II)' : 'Constant PR + Drop (Mobitz II)'}</button>
              <button type="button" class="clin-lead-pill ${cs.pQrsRel === 'av_dissociation' ? 'active' : ''}" data-compass-set="pQrsRel:av_dissociation">${isTr ? 'AV Dissosiyasyon (Tam Blok / VT)' : 'AV Dissociation (CHB / VT)'}</button>
            </div>
          </div>
        </div>
      `;
    }

    if (step === 4) {
      return `
        <div class="compass-field-grid">
          <div class="compass-field-box">
            <label>${isTr ? `4A. Ventriküler Hız: ${cs.ventRateBpm} bpm` : `4A. Ventricular Rate: ${cs.ventRateBpm} bpm`}</label>
            <input type="range" id="compass-vent-hr" min="28" max="240" value="${cs.ventRateBpm}" style="width:100%" />
            <div class="clin-lead-pills" style="margin-top:6px">
              ${[42, 74, 118, 150, 185].map(v => `<button type="button" class="clin-lead-pill ${Number(cs.ventRateBpm) === v ? 'active' : ''}" data-compass-num="ventRateBpm:${v}">${v} bpm</button>`).join('')}
            </div>
          </div>
          <div class="compass-field-box">
            <label>${isTr ? `4B. Atriyal Hız: ${cs.atrialRateBpm} bpm (Flutter = ~300/dk)` : `4B. Atrial Rate: ${cs.atrialRateBpm} bpm`}</label>
            <input type="range" id="compass-atrial-hr" min="40" max="500" value="${cs.atrialRateBpm}" style="width:100%" />
            <div class="clin-lead-pills" style="margin-top:6px">
              ${[74, 150, 300, 450].map(v => `<button type="button" class="clin-lead-pill ${Number(cs.atrialRateBpm) === v ? 'active' : ''}" data-compass-num="atrialRateBpm:${v}">${v} bpm</button>`).join('')}
            </div>
          </div>
        </div>
      `;
    }

    if (step === 5) {
      return `
        <div class="compass-field-grid">
          <div class="compass-field-box">
            <label>${isTr ? '5A. Derivasyon I (Sol Yan) Net QRS Yönü:' : '5A. Lead I Net QRS Polarity:'}</label>
            <div class="clin-lead-pills">
              <button type="button" class="clin-lead-pill ${cs.leadI === 'pos' ? 'active' : ''}" data-compass-set="leadI:pos">${isTr ? '+ Pozitif (Yukarı)' : '+ Positive (Upright)'}</button>
              <button type="button" class="clin-lead-pill ${cs.leadI === 'neg' ? 'active' : ''}" data-compass-set="leadI:neg">${isTr ? '− Negatif (Aşağı)' : '− Negative (Downward)'}</button>
            </div>
          </div>
          <div class="compass-field-box">
            <label>${isTr ? '5B. Derivasyon aVF (İnferior) Net QRS Yönü:' : '5B. Lead aVF Net QRS Polarity:'}</label>
            <div class="clin-lead-pills">
              <button type="button" class="clin-lead-pill ${cs.avf === 'pos' ? 'active' : ''}" data-compass-set="avf:pos">${isTr ? '+ Pozitif (Yukarı)' : '+ Positive (Upright)'}</button>
              <button type="button" class="clin-lead-pill ${cs.avf === 'neg' ? 'active' : ''}" data-compass-set="avf:neg">${isTr ? '− Negatif (Aşağı)' : '− Negative (Downward)'}</button>
            </div>
          </div>
          <div class="compass-field-box">
            <label>${isTr ? '5C. Derivasyon II Eşitlik Bozucusu (0°..−30° Normal vs < −30° Gerçek Sol Aks Sapması):' : '5C. Lead II Tie-Breaker (0°..−30° Normal vs < −30° True LAD):'}</label>
            <div class="clin-lead-pills">
              <button type="button" class="clin-lead-pill ${cs.leadII === 'pos' ? 'active' : ''}" data-compass-set="leadII:pos">${isTr ? 'DII Pozitif (0°..−30° Normal Aks)' : 'Lead II Positive (0°..−30° Normal)'}</button>
              <button type="button" class="clin-lead-pill ${cs.leadII === 'neg' ? 'active' : ''}" data-compass-set="leadII:neg">${isTr ? 'DII Negatif (< −30° Gerçek LAD / LAFB!)' : 'Lead II Negative (< −30° True LAD / LAFB!)'}</button>
            </div>
          </div>
        </div>
        <div class="compass-calc-banner">
          🧭 <strong>${isTr ? 'Hesaplanan Aks:' : 'Computed Axis:'}</strong> ${compassEval.axisInfo.label}
        </div>
      `;
    }

    if (step === 6) {
      const q = compassEval.qtcInfo;
      return `
        <div class="compass-field-grid">
          <div class="compass-field-box">
            <label>${isTr ? `6A. PR Aralığı: ${cs.prMs} ms (Normal: 120–200 ms)` : `6A. PR Interval: ${cs.prMs} ms (Normal: 120–200 ms)`}</label>
            <div class="clin-lead-pills">
              ${[95, 160, 230].map(v => `<button type="button" class="clin-lead-pill ${Number(cs.prMs) === v ? 'active' : ''}" data-compass-num="prMs:${v}">${v} ms</button>`).join('')}
            </div>
          </div>
          <div class="compass-field-box">
            <label>${isTr ? `6B. QRS Süresi: ${cs.qrsMs} ms & WPW Delta Dalgası` : `6B. QRS Duration: ${cs.qrsMs} ms & WPW Delta Wave`}</label>
            <div class="clin-lead-pills">
              ${[88, 112, 138, 156].map(v => `<button type="button" class="clin-lead-pill ${Number(cs.qrsMs) === v ? 'active' : ''}" data-compass-num="qrsMs:${v}">${v} ms</button>`).join('')}
              <button type="button" class="clin-lead-pill ${cs.deltaWave === 'yes' ? 'active' : ''}" data-compass-set="deltaWave:${cs.deltaWave === 'yes' ? 'no' : 'yes'}">
                ${cs.deltaWave === 'yes' ? (isTr ? '⚡ Delta Dalgası: VAR (WPW)' : '⚡ Delta Wave: YES') : (isTr ? 'Delta Dalgası: Yok' : 'Delta Wave: No')}
              </button>
            </div>
          </div>
          <div class="compass-field-box">
            <label>${isTr ? `6C. Ölçülen QT: ${cs.qtMs} ms (Hız: ${cs.ventRateBpm} bpm, RR: ${q.rrSec} sn)` : `6C. Measured QT: ${cs.qtMs} ms (HR: ${cs.ventRateBpm} bpm)`}</label>
            <div class="clin-lead-pills">
              ${[320, 380, 440, 510].map(v => `<button type="button" class="clin-lead-pill ${Number(cs.qtMs) === v ? 'active' : ''}" data-compass-num="qtMs:${v}">${v} ms</button>`).join('')}
            </div>
          </div>
        </div>
        <div class="compass-calc-banner ${q.criticalTdp ? 'danger' : q.prolonged ? 'warn' : ''}">
          🧮 <strong>Bazett QTc: ${q.qtcBazettMs} ms</strong> · <strong>Fridericia QTcF: ${q.qtcFridericiaMs} ms</strong>
          ${q.rateCaveat ? `<span style="margin-left:8px;color:#fbbf24">(${isTr ? 'HR <60 veya >100 olduğu için Fridericia QTcF esas alındı!' : 'Fridericia preferred due to HR <60 or >100!'})</span>` : ''}
        </div>
      `;
    }

    if (step === 7) {
      const lv = compassEval.lvhInfo;
      return `
        <div class="compass-field-grid">
          <div class="compass-field-box">
            <label>${isTr ? '7A. QRS Dal Bloğu / Morfoloji Paterni:' : '7A. QRS Bundle Branch / Morphology Pattern:'}</label>
            <div class="clin-lead-pills">
              ${[
                { v: 'normal', tr: 'Normal Dar QRS', en: 'Normal Narrow' },
                { v: 'rbbb', tr: 'Sağ Dal Bloğu (RBBB)', en: 'RBBB (rSR\' V1)' },
                { v: 'lbbb', tr: 'Sol Dal Bloğu (LBBB)', en: 'LBBB (Deep S V1)' },
                { v: 'tall_r_v1', tr: 'V1’de Uzun R (R/S ≥ 1)', en: 'Tall R in V1 (R/S ≥ 1)' },
                { v: 'paced', tr: 'Ventriküler Paced', en: 'Ventricular Paced' },
                { v: 'low_voltage', tr: 'Düşük Voltaj', en: 'Low Voltage' }
              ].map(o => `<button type="button" class="clin-lead-pill ${cs.bundleMorph === o.v ? 'active' : ''}" data-compass-set="bundleMorph:${o.v}">${isTr ? o.tr : o.en}</button>`).join('')}
            </div>
          </div>
          <div class="compass-field-box">
            <label>${isTr ? `7B. Sokolow-Lyon LVH (SV1 + RV5/6 = ${lv.sokolowMm} mm; Kriter ≥ 35 mm):` : `7B. Sokolow-Lyon LVH (SV1 + RV5/6 = ${lv.sokolowMm} mm; ≥ 35 mm):`}</label>
            <div class="clin-lead-pills">
              <button type="button" class="clin-lead-pill ${lv.sokolowMm < 35 ? 'active' : ''}" data-compass-lvh="normal">${isTr ? 'Normal Voltaj (10 + 14 = 24 mm)' : 'Normal Voltage (24 mm)'}</button>
              <button type="button" class="clin-lead-pill ${lv.sokolowMm >= 35 ? 'active' : ''}" data-compass-lvh="high">${isTr ? '⚡ LVH Pozitif (SV1 18 + RV5 22 = 40 mm)' : '⚡ LVH Positive (40 mm ≥ 35 mm)'}</button>
            </div>
          </div>
          <div class="compass-field-box">
            <label>${isTr ? `7C. Cornell LVH (RaVL + SV3 = ${lv.cornellMm} mm; Erkek >28 / Kadın >20 mm):` : `7C. Cornell LVH (RaVL + SV3 = ${lv.cornellMm} mm):`}</label>
            <div class="clin-lead-pills">
              <button type="button" class="clin-lead-pill ${cs.sex === 'male' ? 'active' : ''}" data-compass-set="sex:male">${isTr ? 'Erkek (>28 mm)' : 'Male (>28 mm)'}</button>
              <button type="button" class="clin-lead-pill ${cs.sex === 'female' ? 'active' : ''}" data-compass-set="sex:female">${isTr ? 'Kadın (>20 mm)' : 'Female (>20 mm)'}</button>
            </div>
          </div>
        </div>
        <div class="compass-calc-banner ${lv.isTrifascicular ? 'danger' : lv.isBifascicular || lv.lvhPositive ? 'warn' : ''}">
          📐 <strong>Sokolow-Lyon: ${lv.sokolowMm} mm (${lv.sokolowPos ? 'LVH+' : 'Normal'})</strong> ·
          <strong>Cornell: ${lv.cornellMm} mm (${lv.cornellPos ? 'LVH+' : 'Normal'})</strong>
          ${lv.isTrifascicular ? ` · 🚨 <strong>${isTr ? 'TRİFASİKÜLER BLOK UYARISI!' : 'TRIFASCICULAR BLOCK ALERT!'}</strong>` : lv.isBifascicular ? ` · ⚠️ <strong>${isTr ? 'BİFASİKÜLER BLOK!' : 'BIFASCICULAR BLOCK!'}</strong>` : ''}
        </div>
      `;
    }

    if (step === 8) {
      return `
        <div class="compass-field-grid">
          <div class="compass-field-box">
            <label>${isTr ? '8A. Bölgesel ST Elevasyonu (STE):' : '8A. Regional ST Elevation (STE) Territory:'}</label>
            <div class="clin-lead-pills">
              ${[
                { v: 'none', tr: 'STE Yok', en: 'No STE' },
                { v: 'anterior', tr: 'Ön Duvar (V1–V4 · LAD)', en: 'Anterior (V1–V4 · LAD)' },
                { v: 'inferior', tr: 'İnferior (II, III, aVF · RCA)', en: 'Inferior (II, III, aVF · RCA)' },
                { v: 'lateral', tr: 'Lateral (I, aVL, V5–V6 · LCx)', en: 'Lateral (I, aVL, V5–V6 · LCx)' },
                { v: 'avr_diffuse', tr: 'aVR STE + Yaygın STD (LMCA)', en: 'aVR STE + Diffuse STD (LMCA)' }
              ].map(o => `<button type="button" class="clin-lead-pill ${cs.steTerritory === o.v ? 'active' : ''}" data-compass-set="steTerritory:${o.v}">${isTr ? o.tr : o.en}</button>`).join('')}
            </div>
          </div>
          <div class="compass-field-box">
            <label>${isTr ? '8B. Özel Klinik Sendrom / T-Dalgası Paterni:' : '8B. Special Clinical Syndrome / T-Wave Pattern:'}</label>
            <div class="clin-lead-pills">
              ${[
                { v: 'none', tr: 'Özel Patern Yok', en: 'None' },
                { v: 'wellens', tr: 'Wellens (V2–V3 Bifazik/Derin T)', en: 'Wellens (V2–V3 T Inversion)' },
                { v: 'de_winter', tr: 'de Winter (Yukarı STD + Dev T)', en: 'de Winter T Waves' },
                { v: 'brugada_1', tr: 'Brugada Tip 1 (V1–V2 Coved)', en: 'Brugada Type 1' },
                { v: 'peaked_t', tr: 'Çadır Sivri T (Hiperkalemi)', en: 'Peaked Tented T (HyperK)' },
                { v: 'pericarditis', tr: 'Yaygın Konkav STE + PR Çökmesi (Perikardit)', en: 'Pericarditis (Diffuse STE + PR Dep)' }
              ].map(o => `<button type="button" class="clin-lead-pill ${cs.specialPattern === o.v ? 'active' : ''}" data-compass-set="specialPattern:${o.v}">${isTr ? o.tr : o.en}</button>`).join('')}
            </div>
          </div>
          <div class="compass-field-box">
            <label>${isTr ? '8C. LBBB / Paced Ritimde Smith-Modifiye Sgarbossa Kriterleri:' : '8C. Smith-Modified Sgarbossa in LBBB / Ventricular Paced:'}</label>
            <div class="clin-lead-pills">
              <button type="button" class="clin-lead-pill ${cs.sgarbossaConcordantSte === 'yes' ? 'active' : ''}" data-compass-set="sgarbossaConcordantSte:${cs.sgarbossaConcordantSte === 'yes' ? 'no' : 'yes'}">
                ${isTr ? 'Konkordan STE ≥ 1 mm (5p)' : 'Concordant STE ≥ 1 mm (5pt)'}
              </button>
              <button type="button" class="clin-lead-pill ${cs.sgarbossaConcordantStdV1V3 === 'yes' ? 'active' : ''}" data-compass-set="sgarbossaConcordantStdV1V3:${cs.sgarbossaConcordantStdV1V3 === 'yes' ? 'no' : 'yes'}">
                ${isTr ? 'V1–V3 Konkordan STD ≥ 1 mm (3p)' : 'V1–V3 Concordant STD ≥ 1 mm (3pt)'}
              </button>
              <button type="button" class="clin-lead-pill ${Number(cs.sgarbossaDiscordantRatio) >= 0.25 ? 'active' : ''}" data-compass-num="sgarbossaDiscordantRatio:${Number(cs.sgarbossaDiscordantRatio) >= 0.25 ? 0.12 : 0.30}">
                ${isTr ? '|STE / S| ≥ 0.25 (Smith Oranı)' : '|STE / S| ≥ 0.25 (Smith Ratio)'}
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // Step 9: Clinical Context
    return `
      <div class="compass-field-grid">
        <div class="compass-field-box">
          <label>${isTr ? '9A. Önceki EKG ile Karşılaştırma & Semptom:' : '9A. Prior ECG Comparison & Primary Symptom:'}</label>
          <div class="clin-lead-pills">
            ${[
              { v: 'unchanged', tr: 'Eski EKG ile Aynı', en: 'Unchanged from Prior' },
              { v: 'new_changes', tr: '🚨 Yeni İskemik/Ritim Değişikliği', en: '🚨 New Acute Changes' },
              { v: 'no_prior', tr: 'Eski EKG Yok', en: 'No Prior Available' }
            ].map(o => `<button type="button" class="clin-lead-pill ${cs.priorEcg === o.v ? 'active' : ''}" data-compass-set="priorEcg:${o.v}">${isTr ? o.tr : o.en}</button>`).join('')}
          </div>
        </div>
        <div class="compass-field-box">
          <label>${isTr ? '9B. Klinik Semptom & Serum Potasyum:' : '9B. Presenting Symptom & Serum Potassium:'}</label>
          <div class="clin-lead-pills">
            ${[
              { v: 'none', tr: 'Asemptomatik', en: 'Asymptomatic' },
              { v: 'chest_pain', tr: 'Göğüs Ağrısı (Anjina)', en: 'Chest Pain' },
              { v: 'syncope', tr: 'Senkop / Presenkop', en: 'Syncope' },
              { v: 'palpitations', tr: 'Çarpıntı', en: 'Palpitations' }
            ].map(o => `<button type="button" class="clin-lead-pill ${cs.symptom === o.v ? 'active' : ''}" data-compass-set="symptom:${o.v}">${isTr ? o.tr : o.en}</button>`).join('')}
          </div>
        </div>
        <div class="compass-field-box">
          <label>${isTr ? '9C. Kardiyoaktif İlaçlar / Toksikoloji:' : '9C. Cardioactive Medications / Toxicology:'}</label>
          <div class="clin-lead-pills">
            ${[
              { v: 'none', tr: 'İlaç Yok', en: 'None' },
              { v: 'digoxin', tr: 'Digoksin', en: 'Digoxin' },
              { v: 'qt_prolonging', tr: 'QT Uzatan İlaçlar', en: 'QT-Prolonging Agents' },
              { v: 'tca', tr: 'TCA (Na⁺ Kanal Blokajı)', en: 'TCA Overdose (Na⁺ Block)' }
            ].map(o => `<button type="button" class="clin-lead-pill ${cs.meds === o.v ? 'active' : ''}" data-compass-set="meds:${o.v}">${isTr ? o.tr : o.en}</button>`).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    const lang = getLang();
    const isTr = lang === 'tr';
    const cond = getActiveCondition();
    const hr = st.hrOverride || cond.hr || 72;
    const rrMs = hr > 0 ? Math.round(60000 / hr) : 0;
    const qtMs = cond.qt || 380;
    const qtcfMs = rrMs > 0 ? Math.round(qtMs / Math.cbrt(rrMs / 1000)) : 0;
    const activeStage = getActiveStage(st.conductionMs);

    const allQuestions = PREMIUM_STUDY_QUESTIONS;
    const filteredQuestions = allQuestions.filter(q => {
      if (st.studyFilter === 'missed') return studyState.missedIds.includes(q.id);
      if (st.studyFilter === 'flagged') return (studyState.tags[q.id] || []).length > 0;
      return true;
    });
    const activeQuestion = filteredQuestions[st.questionIdx % Math.max(1, filteredQuestions.length)] || allQuestions[0];
    if (st.mode === 'study' && activeQuestion) {
      st.condId = activeQuestion.condId;
    }

    const totalAnswered = Object.keys(studyState.answered).length;
    const totalCorrect = Object.values(studyState.answered).filter(Boolean).length;
    const accuracyPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 100;

    const activeSkillRhy = getActiveSkillStatRhythm();
    const skillMins = String(Math.floor(st.skillstatRemainingSec / 60)).padStart(2, '0');
    const skillSecs = String(st.skillstatRemainingSec % 60).padStart(2, '0');
    const skillScorePct = st.skillstatTotalRhythms > 0
      ? Math.round((st.skillstatCorrectCount / st.skillstatTotalRhythms) * 100)
      : 0;
    const skillAttemptPct = st.skillstatAttemptsTotal > 0
      ? Math.round((st.skillstatCorrectCount / st.skillstatAttemptsTotal) * 100)
      : 0;

    const compassEval = evaluateCompassInterpretation(st.compassState, isTr);
    const activeCompassStepObj = COMPASS_9_STEPS.find(s => s.step === st.compassActiveStep) || COMPASS_9_STEPS[0];
    const tunerEval = evaluateRhythmTuner5Step(st.compassTuner, isTr);
    const ffrVal = Math.max(0.28, Number((1.0 - Math.pow(st.compassStenosisPct / 100, 2.15) * 0.72).toFixed(2)));
    const timiGrade = st.compassStenosisPct >= 99 ? 'TIMI 0 (Tam Oklüzyon)' : st.compassStenosisPct >= 90 ? 'TIMI 1 (Zayıf Akım)' : st.compassStenosisPct >= 70 ? 'TIMI 2 (Gecikmiş Dolum)' : 'TIMI 3 (Normal Perfüzyon)';

    root.innerHTML = `
      <div class="clin-sim-topbar">
        <div class="clin-sim-brand">
          <span class="clin-sim-pulse-dot" aria-hidden="true"></span>
          <span class="clin-sim-brand-title">
            ${isTr ? 'Klinik EKG simülatörü' : 'Clinical ECG simulator'}
          </span>
        </div>

        <div class="clin-sim-mode-tabs" role="tablist" aria-label="${isTr ? 'Simülatör görünümü' : 'Simulator view'}">
          ${SIM_MODES.map(m => `
            <button type="button" role="tab" aria-selected="${st.mode === m.id}" class="clin-sim-mode-btn ${st.mode === m.id ? 'active' : ''}" data-sim-mode="${m.id}">${isTr ? m.tr : m.en}</button>
          `).join('')}
          <button type="button" class="clin-sim-collapse-btn" data-sim-collapse="true">
            ${st.collapsed ? (isTr ? '▼ Simülatörü Aç' : '▼ Expand Simulator') : (isTr ? '▲ Küçült' : '▲ Minimize')}
          </button>
        </div>
      </div>

      <div class="clin-sim-body ${st.collapsed ? 'is-collapsed' : ''}">
        ${st.mode === 'compass' ? `
          <!-- EKG COMPASS (ekgcompass.com) — 9-STEP SYSTEMATIC ECG INTERPRETER + ELECTROLYTE & RHYTHM TUNER -->
          <div class="skillstat-head-bar">
            <div class="skillstat-stat-group">
              <button type="button" class="clin-tool-btn ${st.compassSubMode === 'interpret' ? 'active' : ''}" data-compass-submode="interpret">
                🧭 ${isTr ? '9-Adım Sistematik EKG Yorumlayıcı (/interpret)' : '9-Step Systematic ECG Interpreter (/interpret)'}
              </button>
              <button type="button" class="clin-tool-btn ${st.compassSubMode === 'electrolyte_tuner' ? 'active' : ''}" data-compass-submode="electrolyte_tuner">
                🧪 ${isTr ? 'Canlı Elektrolit (K⁺/Ca²⁺), Koroner FFR & 5-Adım Ritim Pusulası' : 'Live Electrolyte (K⁺/Ca²⁺), Coronary FFR & 5-Step Rhythm Tuner'}
              </button>
            </div>
            ${st.compassSubMode === 'interpret' ? `
              <div class="skillstat-stat-group">
                ${COMPASS_SAMPLE_CASES.map(sc => `
                  <button type="button" class="clin-lead-pill ${st.compassSampleId === sc.id ? 'active' : ''}" data-compass-sample="${sc.id}">
                    ${isTr ? sc.tr : sc.en}
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          ${st.compassSubMode === 'interpret' ? `
            ${compassEval.blockingAlerts.map(al => `
              <div class="compass-blocking-banner" role="alert">
                ${isTr ? al.tr : al.en}
              </div>
            `).join('')}

            <!-- 9-Step Progress Stepper -->
            <div class="compass-stepper-row" role="tablist" aria-label="EKG Compass 9 Steps">
              ${COMPASS_9_STEPS.map(sObj => `
                <button type="button" class="compass-step-pill ${st.compassActiveStep === sObj.step ? 'active' : ''}" data-compass-step="${sObj.step}">
                  <span class="compass-step-num">${sObj.step}</span>
                  <span>${isTr ? sObj.tr.replace(/^\d+\.\s*/, '') : sObj.en.replace(/^\d+\.\s*/, '')}</span>
                </button>
              `).join('')}
            </div>

            <div class="clin-stage-grid">
              <!-- Left Column: Active Step Interactive Worksheet + Live 12-Lead Reference Canvas -->
              <div class="clin-monitor-card">
                <div class="compass-step-card">
                  <div class="compass-step-header">
                    <div>
                      <h4>${isTr ? activeCompassStepObj.tr : activeCompassStepObj.en}</h4>
                      <p>${isTr ? activeCompassStepObj.descTr : activeCompassStepObj.descEn}</p>
                    </div>
                    <div class="clin-toolbar-group">
                      <button type="button" class="clin-tool-btn" data-compass-prev-step="true">◀ ${isTr ? 'Önceki' : 'Prev'}</button>
                      <button type="button" class="clin-tool-btn active" data-compass-next-step="true">${isTr ? 'Sonraki Adım' : 'Next Step'} ▶</button>
                    </div>
                  </div>
                  ${renderCompassStepBody(isTr, compassEval)}
                </div>

                <div class="clin-canvas-box">
                  <canvas id="clin-sim-canvas" width="760" height="270"></canvas>
                </div>
              </div>

              <!-- Right Column: Live Evolving Differential Diagnosis Engine + Copy-Ready Structured ECG Report -->
              <div class="clin-heart-card">
                <div class="compass-diff-section">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <h4 style="margin:0;font-size:13.5px;color:#38bdf8">
                      🧠 ${isTr ? 'Canlı Evrimleşen Ayırıcı Tanı Listesi' : 'Live Evolving Differential Diagnoses'}
                    </h4>
                    <span class="clin-study-tag">${compassEval.differentials.length} ${isTr ? 'Bulgu' : 'Findings'}</span>
                  </div>
                  <div class="compass-diff-list">
                    ${compassEval.differentials.map(d => `
                      <div class="compass-diff-card urgency-${d.urgency.toLowerCase()}">
                        <div class="compass-diff-top">
                          <span class="compass-urgency-badge ${d.urgency.toLowerCase()}">${d.urgency}</span>
                          <strong>${d.title}</strong>
                        </div>
                        <p>${d.detail}</p>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <div class="compass-report-box">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <strong style="font-size:12px;color:#cbd5e1">
                      📋 ${isTr ? 'Kopyalanabilir Sistematik Klinik EKG Raporu' : 'Copy-Ready Systematic Clinical ECG Report'}
                    </strong>
                    <button type="button" class="clin-tool-btn ${st.compassCopied ? 'active' : ''}" data-compass-copy="true">
                      ${st.compassCopied ? (isTr ? '✅ Kopyalandı!' : '✅ Copied!') : (isTr ? '📋 Raporu Kopyala' : '📋 Copy Report')}
                    </button>
                  </div>
                  <pre class="compass-report-pre" id="compass-report-text">${compassEval.reportText}</pre>
                </div>
              </div>
            </div>
          ` : `
            <!-- SUB-MODE 2: LIVE SERUM ELECTROLYTE (K+ / Ca2+) MORPHING + CORONARY FFR/TIMI + 5-STEP RHYTHM TUNER -->
            <div class="clin-stage-grid">
              <div class="clin-monitor-card">
                <div class="clin-canvas-box">
                  <canvas id="clin-sim-canvas" width="760" height="240"></canvas>
                </div>

                <div class="compass-field-grid" style="margin-top:8px;">
                  <div class="compass-field-box">
                    <label for="compass-k-slider">
                      🧪 <strong>${isTr ? `Serum Potasyum (K⁺): ${st.compassKMeq.toFixed(1)} mEq/L` : `Serum Potassium (K⁺): ${st.compassKMeq.toFixed(1)} mEq/L`}</strong>
                      <span style="font-size:11px;color:#94a3b8"> (Normal: 3.5–5.0)</span>
                    </label>
                    <input type="range" id="compass-k-slider" min="2.2" max="8.4" step="0.2" value="${st.compassKMeq}" style="width:100%" />
                    <div class="clin-lead-pills" style="margin-top:6px;">
                      ${[
                        { v: 2.5, tr: '2.5 (Hipokalemi: U Dalgası)', en: '2.5 (HypoK: U Wave)' },
                        { v: 4.2, tr: '4.2 (Normal K⁺)', en: '4.2 (Normal K⁺)' },
                        { v: 6.2, tr: '6.2 (Sivri Çadır T)', en: '6.2 (Peaked T)' },
                        { v: 7.2, tr: '7.2 (P Kaybı + Geniş QRS)', en: '7.2 (Wide QRS)' },
                        { v: 8.2, tr: '8.2 (🚨 Sinüzoidal Dalga!)', en: '8.2 (🚨 Sine Wave!)' }
                      ].map(p => `<button type="button" class="clin-lead-pill ${Math.abs(st.compassKMeq - p.v) < 0.15 ? 'active' : ''}" data-compass-k="${p.v}">${isTr ? p.tr : p.en}</button>`).join('')}
                    </div>
                  </div>

                  <div class="compass-field-box">
                    <label for="compass-ca-slider">
                      🦴 <strong>${isTr ? `Serum Kalsiyum (Ca²⁺): ${st.compassCaMgDl.toFixed(1)} mg/dL` : `Serum Calcium (Ca²⁺): ${st.compassCaMgDl.toFixed(1)} mg/dL`}</strong>
                      <span style="font-size:11px;color:#94a3b8"> (Normal: 8.5–10.2)</span>
                    </label>
                    <input type="range" id="compass-ca-slider" min="6.2" max="13.4" step="0.2" value="${st.compassCaMgDl}" style="width:100%" />
                    <div class="clin-lead-pills" style="margin-top:6px;">
                      ${[
                        { v: 6.6, tr: '6.6 (Hipokalsemi: Uzun ST/QTc)', en: '6.6 (HypoCa: Long ST)' },
                        { v: 9.4, tr: '9.4 (Normal Ca²⁺)', en: '9.4 (Normal Ca²⁺)' },
                        { v: 12.8, tr: '12.8 (Hiperkalsemi: Kısa ST + Osborn J)', en: '12.8 (HyperCa: Short ST + J)' }
                      ].map(p => `<button type="button" class="clin-lead-pill ${Math.abs(st.compassCaMgDl - p.v) < 0.15 ? 'active' : ''}" data-compass-ca="${p.v}">${isTr ? p.tr : p.en}</button>`).join('')}
                    </div>
                  </div>

                  <div class="compass-field-box">
                    <label for="compass-stenosis-slider">
                      🫀 <strong>${isTr ? `Epikardiyal Koroner Stenoz: %${st.compassStenosisPct} → FFR: ${ffrVal} (${timiGrade})` : `Coronary Stenosis: ${st.compassStenosisPct}% → FFR: ${ffrVal} (${timiGrade})`}</strong>
                    </label>
                    <input type="range" id="compass-stenosis-slider" min="0" max="100" step="5" value="${st.compassStenosisPct}" style="width:100%" />
                    <div class="compass-calc-banner ${ffrVal <= 0.80 ? 'danger' : ''}" style="margin-top:6px;">
                      ${ffrVal <= 0.80
                        ? (isTr ? `🚨 Hemodinamik Anlamlı Darlık (FFR ${ffrVal} ≤ 0.80) · ${timiGrade} — Revaskülarizasyon Endike!` : `🚨 Hemodynamically Significant Stenosis (FFR ${ffrVal} ≤ 0.80) · ${timiGrade}`)
                        : (isTr ? `✅ Korunmuş Koroner Akım Rezervi (FFR ${ffrVal} > 0.80) · ${timiGrade}` : `✅ Preserved Coronary Flow Reserve (FFR ${ffrVal} > 0.80) · ${timiGrade}`)}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column: 5-Step Rhythm Strip Tuner (/rhythm) -->
              <div class="clin-heart-card">
                <h4 style="margin:0 0 6px 0;font-size:14px;color:#38bdf8">
                  🎛️ ${isTr ? '5-Adım Ritim Şeridi Ayarlayıcısı ("Rhythm Tuner" /rhythm)' : '5-Step Rhythm Strip Tuner (/rhythm)'}
                </h4>
                <div class="compass-field-grid">
                  <div class="compass-field-box">
                    <label>${isTr ? '1. R-R Düzenliliği:' : '1. R-R Regularity:'}</label>
                    <div class="clin-lead-pills">
                      ${[
                        { v: 'regular', tr: 'Düzenli', en: 'Regular' },
                        { v: 'reg_irreg', tr: 'Grup Atım / Bigemini', en: 'Regularly Irregular' },
                        { v: 'irreg_irreg', tr: 'Tamamen Düzensiz', en: 'Irregularly Irregular' }
                      ].map(o => `<button type="button" class="clin-lead-pill ${st.compassTuner.reg === o.v ? 'active' : ''}" data-tuner-set="reg:${o.v}">${isTr ? o.tr : o.en}</button>`).join('')}
                    </div>
                  </div>
                  <div class="compass-field-box">
                    <label>${isTr ? '2. P Dalgaları & AV İlişkisi:' : '2. P Waves & AV Relationship:'}</label>
                    <div class="clin-lead-pills">
                      ${[
                        { v: 'upright_1to1', tr: '1:1 Sinüs P', en: '1:1 Upright P' },
                        { v: 'sawtooth', tr: 'Testere Dişi F', en: 'Sawtooth Flutter' },
                        { v: 'absent_fib', tr: 'P Yok (Fibrilasyon)', en: 'Absent / Fib' },
                        { v: 'multimorph', tr: '≥3 Farklı P (MAT)', en: '≥3 P Shapes (MAT)' },
                        { v: 'dissociated', tr: 'AV Dissosiyasyon', en: 'AV Dissociated' }
                      ].map(o => `<button type="button" class="clin-lead-pill ${st.compassTuner.pwave === o.v ? 'active' : ''}" data-tuner-set="pwave:${o.v}">${isTr ? o.tr : o.en}</button>`).join('')}
                    </div>
                  </div>
                  <div class="compass-field-box">
                    <label>${isTr ? '3. QRS Genişliği & 4. Kalp Hızı:' : '3. QRS Width & 4. Heart Rate:'}</label>
                    <div class="clin-lead-pills">
                      <button type="button" class="clin-lead-pill ${st.compassTuner.qrs === 'narrow' ? 'active' : ''}" data-tuner-set="qrs:narrow">${isTr ? 'Dar QRS (<120 ms)' : 'Narrow (<120 ms)'}</button>
                      <button type="button" class="clin-lead-pill ${st.compassTuner.qrs === 'wide' ? 'active' : ''}" data-tuner-set="qrs:wide">${isTr ? 'Geniş QRS (≥120 ms)' : 'Wide (≥120 ms)'}</button>
                      <button type="button" class="clin-lead-pill ${st.compassTuner.rate === 'brady' ? 'active' : ''}" data-tuner-set="rate:brady">&lt;60</button>
                      <button type="button" class="clin-lead-pill ${st.compassTuner.rate === 'normal' ? 'active' : ''}" data-tuner-set="rate:normal">60–100</button>
                      <button type="button" class="clin-lead-pill ${st.compassTuner.rate === 'tachy_100_150' ? 'active' : ''}" data-tuner-set="rate:tachy_100_150">100–150</button>
                      <button type="button" class="clin-lead-pill ${st.compassTuner.rate === 'tachy_gt150' ? 'active' : ''}" data-tuner-set="rate:tachy_gt150">&gt;150</button>
                    </div>
                  </div>
                </div>

                <div class="clin-clinical-pearl-box" style="margin-top:10px;border-left-color:#10b981;">
                  <h4>5. ${isTr ? 'Ritim Kaynağı (Tuner Odağı):' : 'Rhythm Source (Tuner Origin):'} <span style="color:#34d399">${tunerEval.originChamber}</span></h4>
                  <p style="margin:0 0 6px 0"><strong>✅ ${isTr ? 'Kanıtlanan / Olası Ritim:' : 'Established Suspects:'}</strong> ${tunerEval.established.join(' · ')}</p>
                  <p style="margin:0;color:#94a3b8;font-size:11.5px"><strong>❌ ${isTr ? 'Dışlanan Ritimler:' : 'Ruled Out:'}</strong> ${tunerEval.ruledOut.join(' · ')}</p>
                </div>
              </div>
            </div>
          `}
        ` : st.mode === 'skillstat' ? `
          <!-- SKILLSTAT SIX-SECOND ECG SIMULATOR CLASSIC (LEARN + 60s TIMED GAME) -->
          <div class="skillstat-head-bar">
            <div class="skillstat-stat-group">
              <button type="button" class="clin-tool-btn ${st.skillstatSubMode === 'learn' ? 'active' : ''}" data-skillstat-submode="learn">
                📖 ${isTr ? 'LEARN (27 Ritmi Keşfet & İncele)' : 'LEARN (Explore 27 Rhythms)'}
              </button>
              <button type="button" class="clin-tool-btn ${st.skillstatSubMode === 'game' ? 'active' : ''}" data-skillstat-submode="game">
                🎮 ${isTr ? 'GAME (60-Sn Zamanlı Ritim Tanıma Oyunu)' : 'GAME (60-Sec Timed Rhythm Challenge)'}
              </button>
              <span class="skillstat-hr-badge">
                ❤️ HR: <strong>${activeSkillRhy.hr > 0 ? `${activeSkillRhy.hr} bpm` : '0 (VFib)'}</strong>
              </span>
            </div>

            <div class="skillstat-stat-group">
              <button type="button" class="clin-tool-btn ${st.skillstatDynamic ? 'active' : ''}" data-skillstat-dynamic="true">
                ${st.skillstatDynamic ? (isTr ? '🌊 Dinamik (Akan Şerit)' : '🌊 Dynamic Strip') : (isTr ? '📌 Statik (Sabit 6-Sn)' : '📌 Static 6-Sec')}
              </button>
              <button type="button" class="clin-tool-btn ${st.skillstatShowGrid ? 'active' : ''}" data-skillstat-grid="true">
                📏 ${st.skillstatShowGrid ? (isTr ? 'Izgara: AÇIK (0.2s / 1.0s)' : 'Grid: ON (0.2s / 1.0s)') : (isTr ? 'Izgara: KAPALI' : 'Grid: OFF')}
              </button>
              <button type="button" class="clin-tool-btn ${st.soundOn ? 'active' : ''}" data-sim-sound="true">
                🔊 ${isTr ? 'QRS Sesi' : 'QRS Beep'}
              </button>
            </div>
          </div>

          ${st.skillstatSubMode === 'game' ? `
            <div class="skillstat-head-bar" style="background:rgba(15,23,42,0.92)">
              <div class="skillstat-stat-group">
                <span class="skillstat-timer-badge">
                  ⏱️ <span id="skillstat-timer-val">${skillMins}:${skillSecs}</span>
                </span>
                <span class="skillstat-score-pill">
                  ${isTr ? 'Ritim:' : 'Rhythms:'} <strong>${st.skillstatTotalRhythms}</strong>
                </span>
                <span class="skillstat-score-pill">
                  ${isTr ? 'Doğru:' : 'Correct:'} <strong style="color:#34d399">${st.skillstatCorrectCount} (%${skillScorePct})</strong>
                </span>
                <span class="skillstat-score-pill">
                  ${isTr ? 'Deneme:' : 'Attempts:'} <strong>${st.skillstatAttemptsTotal} (%${skillAttemptPct})</strong>
                </span>
              </div>

              <div class="skillstat-stat-group">
                <button type="button" class="clin-lead-pill ${st.skillstatDifficulty === 'novice' ? 'active' : ''}" data-skillstat-diff="novice">
                  ${isTr ? 'Novice (3 Hak)' : 'Novice (3 Tries)'}
                </button>
                <button type="button" class="clin-lead-pill ${st.skillstatDifficulty === 'practitioner' ? 'active' : ''}" data-skillstat-diff="practitioner">
                  ${isTr ? 'Practitioner (1 Hak)' : 'Practitioner (1 Try)'}
                </button>
                ${[60, 120, 180].map(sec => `
                  <button type="button" class="clin-lead-pill ${st.skillstatDurationSec === sec ? 'active' : ''}" data-skillstat-dur="${sec}">${sec / 60} dk</button>
                `).join('')}
                <button type="button" class="clin-sim-mode-btn active" data-skillstat-start="true">
                  ${st.skillstatGameActive ? (isTr ? '🔄 Oyunu Sıfırla / Yeni Ritim' : '🔄 Reset / Next') : (isTr ? '▶ Oyunu Başlat (PLAY)' : '▶ Start Game (PLAY)')}
                </button>
              </div>
            </div>
          ` : ''}

          <!-- 6-Second Lead II Monitor Strip (Hover freezes strip automatically!) -->
          <div class="clin-canvas-box" id="skillstat-canvas-wrap" title="${isTr ? 'İmleci şerit üzerine getirerek dondurabilirsiniz (Hover to Freeze)' : 'Hover cursor over strip to freeze tracing'}">
            <canvas id="clin-sim-canvas" width="760" height="220"></canvas>
          </div>

          ${st.skillstatSubMode === 'learn' ? `
            <div class="clin-clinical-pearl-box" style="margin-top:4px;">
              <h4>${isTr ? activeSkillRhy.titleTr : activeSkillRhy.titleEn} · <span style="color:#34d399">${activeSkillRhy.hr > 0 ? `${activeSkillRhy.hr} bpm` : 'VFib'}</span></h4>
              <p style="margin:0">${isTr ? activeSkillRhy.descTr : activeSkillRhy.descEn}</p>
            </div>
          ` : st.skillstatFeedback ? `
            <div class="skillstat-feedback-banner ${st.skillstatFeedbackType}">
              ${st.skillstatFeedback}
            </div>
          ` : ''}

          <!-- 5-Column 27-Rhythm Matrix (SkillStat Classic Layout: cols = [6, 5, 5, 5, 6]) -->
          <div class="skillstat-matrix-5col" role="group" aria-label="SkillStat 27 Cardiac Rhythms Matrix">
            ${SKILLSTAT_COLUMNS.map(colObj => {
              const colRhythms = SKILLSTAT_27_RHYTHMS.filter(r => r.col === colObj.col);
              return `
                <div class="skillstat-col">
                  <div class="skillstat-col-title">${isTr ? colObj.tr : colObj.en}</div>
                  ${colRhythms.map(r => {
                    let btnCls = '';
                    if (st.skillstatSubMode === 'learn' && st.skillstatRhyId === r.id) {
                      btnCls = 'active';
                    } else if (st.skillstatSubMode === 'game') {
                      if (st.skillstatCorrectPick === r.id) btnCls = 'game-correct';
                      else if (st.skillstatWrongPicks.includes(r.id)) btnCls = 'game-wrong';
                    }
                    return `
                      <button type="button" class="skillstat-rhy-btn ${btnCls}" data-skillstat-rhy="${r.id}">
                        <span>${isTr ? r.tr : r.en}</span>
                      </button>
                    `;
                  }).join('')}
                </div>
              `;
            }).join('')}
          </div>
        ` : st.mode !== 'study' ? `
          <!-- One pattern picker, grouped by category; the arrows step through the list. -->
          <div class="clin-sim-pattern-row">
            <label class="clin-sim-pattern">
              <span>${isTr ? 'EKG paterni' : 'ECG pattern'}</span>
              <select data-sim-pattern>
                ${CLINICAL_CATEGORIES.map(cat => `
                  <optgroup label="${isTr ? cat.tr : cat.en}" data-sim-cat="${cat.id}">
                    ${CLINICAL_CONDITIONS.filter(c => c.cat === cat.id).map(c => `<option value="${c.id}" data-sim-cond="${c.id}"${c.id === st.condId ? ' selected' : ''}>${isTr ? c.tr : c.en}</option>`).join('')}
                  </optgroup>
                `).join('')}
              </select>
            </label>
            <span class="clin-sim-pattern-dot" style="background:${cond.color}" aria-hidden="true"></span>
            <button type="button" class="clin-tool-btn" data-sim-pattern-step="-1" aria-label="${isTr ? 'Önceki patern' : 'Previous pattern'}">◀</button>
            <button type="button" class="clin-tool-btn" data-sim-pattern-step="1" aria-label="${isTr ? 'Sonraki patern' : 'Next pattern'}">▶</button>
          </div>

          <!-- Live Digital Telemetry Readout Strip (ECGSweep Style) -->
          <div class="clin-telemetry-strip">
            <div class="clin-tele-cell ${hr > 100 || hr < 55 ? 'warn' : ''}">
              <span class="clin-tele-label">HR (BPM)</span>
              <span class="clin-tele-val">${hr > 0 ? hr : 'VF / 0'}</span>
            </div>
            <div class="clin-tele-cell">
              <span class="clin-tele-label">R-R (MS)</span>
              <span class="clin-tele-val">${rrMs > 0 ? rrMs : '—'}</span>
            </div>
            <div class="clin-tele-cell ${(cond.pr > 200 || (cond.pr > 0 && cond.pr < 120)) ? 'warn' : ''}">
              <span class="clin-tele-label">PR (MS)</span>
              <span class="clin-tele-val">${cond.pr > 0 ? cond.pr : (isTr ? 'Yok / Diss.' : 'Absent')}</span>
            </div>
            <div class="clin-tele-cell ${cond.qrs >= 120 ? 'danger' : ''}">
              <span class="clin-tele-label">QRS (MS)</span>
              <span class="clin-tele-val">${cond.qrs > 0 ? cond.qrs : '—'}</span>
            </div>
            <div class="clin-tele-cell ${qtcfMs >= 470 || qtcfMs < 340 ? 'danger' : ''}">
              <span class="clin-tele-label">QT / QTcF</span>
              <span class="clin-tele-val">${qtMs > 0 ? `${qtMs}/${qtcfMs}` : '—'}</span>
            </div>
            <div class="clin-tele-cell">
              <span class="clin-tele-label">${isTr ? 'AKS (°)' : 'AXIS (°)'}</span>
              <span class="clin-tele-val">${cond.axis}°</span>
            </div>
            <div class="clin-tele-cell ${cond.culprit !== 'None' ? 'danger' : ''}">
              <span class="clin-tele-label">${isTr ? 'SORUMLU DAMAR' : 'CULPRIT ARTERY'}</span>
              <span class="clin-tele-val">${st.blindMode ? '???' : (cond.culprit === 'None' ? (isTr ? 'Koroner Dışı' : 'Non-Coronary') : cond.culprit)}</span>
            </div>
          </div>

          <!-- Split Stage: Left = Calibrated Sweep/12-Lead Monitor, Right = 3D Heart + Conduction & Clinical Pearls -->
          <div class="clin-stage-grid">
            <div class="clin-monitor-card">
              <div class="clin-monitor-toolbar">
                <div class="clin-toolbar-group">
                  <button type="button" class="clin-tool-btn ${st.running ? 'active' : ''}" data-sim-toggle-run="true">
                    ${st.running ? (isTr ? '⏸ Durdur (Freeze)' : '⏸ Freeze Trace') : (isTr ? '▶ Canlı Akış' : '▶ Resume Sweep')}
                  </button>
                  <button type="button" class="clin-tool-btn ${st.paperSpeed === 50 ? 'active' : ''}" data-sim-speed="true">
                    ⚡ ${st.paperSpeed} mm/s
                  </button>
                  <button type="button" class="clin-tool-btn ${st.soundOn ? 'active' : ''}" data-sim-sound="true">
                    🔊 ${isTr ? 'QRS Sesi' : 'QRS Beep'}
                  </button>
                </div>

                <div class="clin-toolbar-group">
                  <button type="button" class="clin-tool-btn ${st.blindMode ? 'blind-active' : ''}" data-sim-blind="true">
                    ${st.blindMode ? (isTr ? '👁️ Çözümü Göster (Show Answer)' : '👁️ Show The Answer') : (isTr ? '🙈 Kendin Oku (Read It Yourself)' : '🙈 Read It Yourself')}
                  </button>
                </div>
              </div>

              <div class="clin-canvas-box">
                <canvas id="clin-sim-canvas" width="760" height="310"></canvas>
              </div>

              <!-- Interactive Sliders & Lead Selector -->
              <div class="clin-controls-bar">
                <div class="clin-ctrl-item">
                  <label for="clin-hr-slider">
                    <span>${isTr ? 'Kalp Hızı (BPM):' : 'Heart Rate (BPM):'}</span>
                    <strong id="clin-hr-val">${hr} bpm</strong>
                  </label>
                  <input type="range" id="clin-hr-slider" min="32" max="210" value="${hr}" />
                </div>

                <div class="clin-ctrl-item">
                  <label for="clin-noise-slider">
                    <span>${isTr ? 'Artefakt / Kas Gürültüsü:' : 'Baseline Noise (mV):'}</span>
                    <strong id="clin-noise-val">${st.noiseLevel.toFixed(2)} mV</strong>
                  </label>
                  <input type="range" id="clin-noise-slider" min="0" max="0.20" step="0.02" value="${st.noiseLevel}" />
                </div>

                <div class="clin-ctrl-item">
                  <label><span>${isTr ? 'Aktif Derivasyon:' : 'Active Monitor Lead:'}</span></label>
                  <div class="clin-lead-pills">
                    ${LEAD_NAMES_12.map(ld => `
                      <button type="button" class="clin-lead-pill ${ld === st.activeLead ? 'active' : ''}" data-sim-lead="${ld}">${ld}</button>
                    `).join('')}
                  </div>
                </div>
              </div>

              <!-- 7-Stage Conduction Pathway Timeline Scrubber (ECGLens Feature) -->
              <div class="clin-scrubber-box">
                <div class="clin-scrubber-head">
                  <span class="clin-scrubber-title">
                    ⚡ ${isTr ? '7 Aşamalı Kardiyak İletim Zaman Çizelgesi (SA → AV → His-Purkinje):' : '7-Stage Cardiac Conduction Scrubber:'}
                    <strong id="clin-conduction-ms-val" style="color:${activeStage.color}">${st.conductionMs} ms</strong>
                  </span>
                  <div class="clin-toolbar-group">
                    ${[0.25, 0.5, 1].map(sp => `
                      <button type="button" class="clin-lead-pill ${st.scrubberSpeed === sp ? 'active' : ''}" data-scrub-speed="${sp}">${sp}×</button>
                    `).join('')}
                  </div>
                </div>
                <input type="range" id="clin-conduction-slider" min="0" max="860" value="${st.conductionMs}" style="width:100%;accent-color:${activeStage.color}" />
                ${(() => {
                  const atrial = conductionTimeline(cond).atrial;
                  const noSinus = atrial !== 'sinus';
                  const why = atrial === 'fibrillation'
                    ? (isTr ? 'Atriyal fibrilasyon: organize SA düğümü ve atriyal yayılım yok; atriyumlar fibrilatuvar (bantta taralı), AV düğüm düzensiz iletir.' : 'Atrial fibrillation: no organized SA-node firing or atrial spread; the atria fibrillate (hatched in the band) and the AV node conducts irregularly.')
                    : atrial === 'flutter'
                      ? (isTr ? 'Atriyal flutter: makro-reentran atriyal döngü; SA düğümü evresi yok (bantta taralı).' : 'Atrial flutter: macro-reentrant atrial circuit; no SA-node stage (hatched in the band).')
                      : (isTr ? 'Bu ritimde sinüs kaynaklı organize P dalgası yok; SA ve atriyal evreler gösterilmez.' : 'No organized sinus P wave in this rhythm; the SA and atrial stages are not shown.');
                  return `
                <div class="clin-stage-pills">
                  ${CONDUCTION_STAGES.map(stg => {
                    const off = noSinus && (stg.id === 'sa' || stg.id === 'atria');
                    const on = !off && stg.id === activeStage.id;
                    return `
                    <button type="button" class="clin-stage-pill ${on ? 'active' : ''}"
                            style="${on ? `background:${stg.color}` : ''}"
                            data-stage-jump="${Math.round((stg.startMs + stg.endMs) / 2)}"${off ? ` disabled title="${why}"` : ''}>
                      ${isTr ? stg.tr : stg.en}
                    </button>`;
                  }).join('')}
                </div>
                ${noSinus ? `<p class="clin-stage-note">${why}</p>` : ''}`;
                })()}
              </div>
            </div>

            <!-- Right Column: Interactive 3D-Styled Heart OR Phase 0-4 Cardiac Channelopathies AP Atlas + Clinical Pearls -->
            <div class="clin-heart-card">
              ${(() => {
                const showChanAp = st.rightPanelMode === 'channelopathy' || (st.rightPanelMode === 'auto' && st.catId === 'channelopathy');
                const activeChanNode = CARDIAC_CHANNELOPATHY_NODES.find(n => n.id === st.chanNodeId) || CARDIAC_CHANNELOPATHY_NODES[0];
                return `
                  <!-- Channelopathies live in the ECG left panel; the AP atlas shows here for channelopathy conditions. -->

                  ${showChanAp ? `
                  <section class="clin-chan-section" aria-labelledby="clin-chan-heading">
                    <h4 class="clin-chan-heading" id="clin-chan-heading">${isTr ? 'Kanalopatiler · Faz 0–4 aksiyon potansiyeli ve gen atlası' : 'Channelopathies · Phase 0–4 action potential and gene atlas'}</h4>
                  ` : ''}
                  <div class="clin-heart-svg-wrap" id="clin-heart-svg-mount">
                    ${showChanAp ? buildChannelopathyApSvg(st.chanNodeId, isTr) : buildHeartCoronarySvg(cond, activeStage, isTr)}
                  </div>

                  ${showChanAp ? `
                    <div class="clin-chan-node-pills" role="group" aria-label="${isTr ? 'Faz 0–4 İyon Kanalı Seçimi' : 'Select Phase 0–4 Ion Channel'}">
                      ${CARDIAC_CHANNELOPATHY_NODES.map(n => `
                        <button type="button" class="clin-chan-pill ${n.id === activeChanNode.id ? 'active' : ''} ${n.direction}" data-chan-node="${n.id}">
                          <span class="clin-chan-pill-dot"></span>
                          <span>${n.phase}: <strong>${n.current}</strong> (${n.genes.join('/')})</span>
                        </button>
                      `).join('')}
                    </div>
                    <div class="clin-chan-detail-box">
                      <div class="clin-chan-detail-title">${isTr ? activeChanNode.titleTr : activeChanNode.titleEn}</div>
                      <p class="clin-chan-detail-desc">${isTr ? activeChanNode.mechTr : activeChanNode.mechEn}</p>
                      <div class="clin-chan-syndrome-tags">
                        ${activeChanNode.syndromes.map(s => `<span class="clin-chan-syn-tag">${s}</span>`).join('')}
                      </div>
                    </div>
                  </section>
                  ` : ''}
                `;
              })()}

              <!-- The ECG pattern card belongs to the trace; beside the channelopathy atlas it shows only for a channelopathy pattern. -->
              <div class="clin-clinical-pearl-box" ${(st.rightPanelMode === 'channelopathy' || (st.rightPanelMode === 'auto' && st.catId === 'channelopathy')) && cond.cat !== 'channelopathy' ? 'hidden' : ''}>
                <h4>
                  ${st.blindMode
                    ? (isTr ? '🔒 Kör Okuma Modu Aktif — Önce Kendiniz Yorumlayın!' : '🔒 Blind Reading Mode — Interpret the Trace First!')
                    : (isTr ? cond.tr : cond.en)}
                </h4>
                <p>
                  ${st.blindMode
                    ? (isTr
                        ? 'P dalgası varlığını, P:QRS ilişkisini, PR ve QRS sürelerini, ST segment kaymalarını ve sorumlu koroner arteri tahmin ettikten sonra "Çözümü Göster" butonuna tıklayın.'
                        : 'Inspect P waves, PR/QRS intervals, ST-segment shifts, and contiguous lead territories, then click "Show The Answer".')
                    : (isTr ? cond.pearlTr : cond.pearlEn)}
                </p>

                ${!st.blindMode ? `
                  <div class="clin-criteria-grid">
                    <div class="clin-crit-item">
                      <strong>${isTr ? 'Primer Derivasyonlar' : 'Primary Leads'}</strong>
                      <span style="color:#34d399;font-weight:700">${cond.affectedLeads.join(', ') || '—'}</span>
                    </div>
                    <div class="clin-crit-item">
                      <strong>${isTr ? 'Resiprokal Derivasyonlar' : 'Reciprocal Leads'}</strong>
                      <span style="color:#38bdf8;font-weight:700">${cond.reciprocalLeads.join(', ') || (isTr ? 'Yok' : 'None')}</span>
                    </div>
                    <div class="clin-crit-item">
                      <strong>${isTr ? 'İletim Aşaması (' + st.conductionMs + ' ms)' : 'Conduction Stage (' + st.conductionMs + ' ms)'}</strong>
                      <span style="color:${activeStage.color};font-weight:700">${isTr ? activeStage.tr : activeStage.en}</span>
                    </div>
                    <div class="clin-crit-item">
                      <strong>${isTr ? 'Hız & Dalga Karşılığı' : 'Velocity & ECG Wave'}</strong>
                      <span>${activeStage.vel} · ${activeStage.wave}</span>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        ` : `
          <!-- UNLOCKED ECGLENS PREMIUM STUDY HUB MODE -->
          <div class="clin-study-grid">
            <div class="clin-monitor-card">
              <div class="clin-monitor-toolbar">
                <div class="clin-toolbar-group">
                  <button type="button" class="clin-tool-btn ${st.studyFilter === 'all' ? 'active' : ''}" data-study-filter="all">
                    📚 ${isTr ? `Tüm Sorular (${allQuestions.length})` : `All Questions (${allQuestions.length})`}
                  </button>
                  <button type="button" class="clin-tool-btn ${st.studyFilter === 'missed' ? 'active' : ''}" data-study-filter="missed">
                    🔁 ${isTr ? `Yanlışlarımı Tekrar Çöz (${studyState.missedIds.length})` : `Missed Review (${studyState.missedIds.length})`}
                  </button>
                  <button type="button" class="clin-tool-btn ${st.studyFilter === 'flagged' ? 'active' : ''}" data-study-filter="flagged">
                    🔖 ${isTr ? `İşaretli Sorular (${Object.keys(studyState.tags).filter(k => (studyState.tags[k] || []).length > 0).length})` : 'Flagged Questions'}
                  </button>
                </div>

                <div class="clin-toolbar-group">
                  <span style="font-size:12px;font-weight:800;color:#34d399">
                    🎯 ${isTr ? `Doğruluk: %${accuracyPct} (${totalCorrect}/${totalAnswered})` : `Accuracy: ${accuracyPct}% (${totalCorrect}/${totalAnswered})`}
                  </span>
                </div>
              </div>

              <div class="clin-canvas-box">
                <canvas id="clin-sim-canvas" width="760" height="310"></canvas>
              </div>
            </div>

            <div class="clin-heart-card">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
                <span class="clin-study-tag">
                  ${activeQuestion.type === 'lead-selection'
                    ? (isTr ? '12-DERİVASYON SEÇİM DRİLL' : 'LEAD-SELECTION DRILL')
                    : (isTr ? 'KLİNİK TANI SORUSU' : 'CLINICAL DIAGNOSIS MCQ')}
                </span>
                <div class="clin-toolbar-group">
                  <button type="button" class="clin-tool-btn" data-study-prev="true">◀</button>
                  <span style="font-size:11.5px;font-weight:700">${(st.questionIdx % Math.max(1, filteredQuestions.length)) + 1} / ${filteredQuestions.length}</span>
                  <button type="button" class="clin-tool-btn" data-study-next="true">▶</button>
                </div>
              </div>

              <h4 style="margin:0 0 6px 0;font-size:14px;color:#38bdf8">${isTr ? activeQuestion.titleTr : activeQuestion.titleEn}</h4>
              <p style="margin:0 0 10px 0;font-size:12.5px;line-height:1.5;color:#e2e8f0">${isTr ? activeQuestion.promptTr : activeQuestion.promptEn}</p>

              ${activeQuestion.type === 'lead-selection' ? `
                <div class="clin-lead-drill-grid">
                  ${LEAD_NAMES_12.map(ld => {
                    const isSel = st.selectedLeads.includes(ld);
                    const isTarget = activeQuestion.targetLeads.includes(ld);
                    let cls = '';
                    if (st.graded) {
                      if (isSel && isTarget) cls = 'correct';
                      else if (isSel && !isTarget) cls = 'wrong';
                      else if (!isSel && isTarget) cls = 'missed';
                    } else if (isSel) {
                      cls = 'selected';
                    }
                    return `<button type="button" class="clin-drill-lead-btn ${cls}" data-drill-lead="${ld}">${ld}</button>`;
                  }).join('')}
                </div>
                <button type="button" class="clin-sim-mode-btn active" style="width:100%;justify-content:center;margin-top:6px;" data-drill-submit="true">
                  ✔ ${isTr ? 'Derivasyon Seçimini Kontrol Et' : 'Check Selected Leads'}
                </button>
              ` : `
                <div class="clin-mcq-options">
                  ${activeQuestion.options.map(opt => {
                    let cls = '';
                    if (st.graded) {
                      if (opt.correct) cls = 'correct';
                      else if (st.selectedMcq === opt.id) cls = 'wrong';
                    }
                    return `
                      <button type="button" class="clin-mcq-btn ${cls}" data-mcq-opt="${opt.id}">
                        ${isTr ? opt.tr : opt.en}
                      </button>
                    `;
                  }).join('')}
                </div>
              `}

              ${st.graded ? `
                <div class="clin-clinical-pearl-box" style="border-left-color:#10b981;margin-top:10px;">
                  <h4>${isTr ? 'Klinik Açıklama & Mekanizma' : 'Clinical Explanation'}</h4>
                  <p>${isTr ? activeQuestion.explainTr : activeQuestion.explainTr}</p>
                </div>
              ` : ''}

              <!-- ECGLens Study Bookmark Tags -->
              <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(148,163,184,0.16)">
                <span style="font-size:11px;font-weight:700;color:#94a3b8">${isTr ? 'Soruyu Etiketle (Kaydedilir):' : 'Tag Question for Review:'}</span>
                <div class="clin-tag-row">
                  ${STUDY_TAGS.map(tg => {
                    const activeTags = studyState.tags[activeQuestion.id] || [];
                    const isTagged = activeTags.includes(tg.id);
                    return `
                      <button type="button" class="clin-tag-chip ${isTagged ? 'active' : ''}" data-study-tag="${tg.id}">
                        ${isTr ? tg.tr : tg.en}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
          </div>
        `}
      </div>
    `;

    bindEvents(activeQuestion, filteredQuestions.length);
    renderCanvasFrame();
  }

  function bindEvents(activeQuestion, filteredCount) {
    const isTr = getLang() === 'tr';

    // Mode tabs
    root.querySelectorAll('[data-sim-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.mode = btn.dataset.simMode;
        st.collapsed = false;
        render();
      });
    });

    // EKG Compass sub-mode & 9-step controls
    root.querySelectorAll('[data-compass-submode]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.compassSubMode = btn.dataset.compassSubmode;
        render();
      });
    });

    root.querySelectorAll('[data-compass-sample]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sampleId = btn.dataset.compassSample;
        const found = COMPASS_SAMPLE_CASES.find(s => s.id === sampleId);
        if (found) {
          st.compassSampleId = found.id;
          st.condId = found.condId;
          st.compassState = { ...found.patch };
          st.compassCopied = false;
          render();
        }
      });
    });

    root.querySelectorAll('[data-compass-step]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.compassActiveStep = Number(btn.dataset.compassStep);
        render();
      });
    });

    root.querySelector('[data-compass-prev-step]')?.addEventListener('click', () => {
      st.compassActiveStep = st.compassActiveStep <= 1 ? 9 : st.compassActiveStep - 1;
      render();
    });

    root.querySelector('[data-compass-next-step]')?.addEventListener('click', () => {
      st.compassActiveStep = st.compassActiveStep >= 9 ? 1 : st.compassActiveStep + 1;
      render();
    });

    root.querySelectorAll('[data-compass-set]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [k, v] = btn.dataset.compassSet.split(':');
        if (k) {
          st.compassState[k] = v;
          st.compassSampleId = 'custom';
          render();
        }
      });
    });

    root.querySelectorAll('[data-compass-num]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [k, v] = btn.dataset.compassNum.split(':');
        if (k) {
          st.compassState[k] = Number(v);
          st.compassSampleId = 'custom';
          render();
        }
      });
    });

    root.querySelectorAll('[data-compass-lvh]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.compassLvh === 'high') {
          st.compassState.sv1Mm = 18;
          st.compassState.rv56Mm = 22;
          st.compassState.ravlMm = 15;
          st.compassState.sv3Mm = 16;
        } else {
          st.compassState.sv1Mm = 10;
          st.compassState.rv56Mm = 14;
          st.compassState.ravlMm = 6;
          st.compassState.sv3Mm = 8;
        }
        st.compassSampleId = 'custom';
        render();
      });
    });

    root.querySelector('#compass-vent-hr')?.addEventListener('input', e => {
      st.compassState.ventRateBpm = Number(e.target.value);
      render();
    });

    root.querySelector('#compass-atrial-hr')?.addEventListener('input', e => {
      st.compassState.atrialRateBpm = Number(e.target.value);
      render();
    });

    root.querySelector('[data-compass-copy]')?.addEventListener('click', () => {
      const reportEl = root.querySelector('#compass-report-text');
      const txt = reportEl ? reportEl.textContent : '';
      try {
        navigator.clipboard?.writeText(txt);
      } catch (_) {}
      st.compassCopied = true;
      render();
    });

    // EKG Compass Electrolyte & Coronary FFR sliders + 5-Step Rhythm Tuner
    root.querySelector('#compass-k-slider')?.addEventListener('input', e => {
      st.compassKMeq = Number(e.target.value);
      render();
    });

    root.querySelectorAll('[data-compass-k]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.compassKMeq = Number(btn.dataset.compassK);
        render();
      });
    });

    root.querySelector('#compass-ca-slider')?.addEventListener('input', e => {
      st.compassCaMgDl = Number(e.target.value);
      render();
    });

    root.querySelectorAll('[data-compass-ca]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.compassCaMgDl = Number(btn.dataset.compassCa);
        render();
      });
    });

    root.querySelector('#compass-stenosis-slider')?.addEventListener('input', e => {
      st.compassStenosisPct = Number(e.target.value);
      render();
    });

    root.querySelectorAll('[data-tuner-set]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [k, v] = btn.dataset.tunerSet.split(':');
        if (k) {
          st.compassTuner[k] = v;
          render();
        }
      });
    });

    // SkillStat Classic sub-mode & controls
    root.querySelectorAll('[data-skillstat-submode]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.skillstatSubMode = btn.dataset.skillstatSubmode;
        if (st.skillstatSubMode === 'game' && !st.skillstatGameActive) {
          st.skillstatRemainingSec = st.skillstatDurationSec;
          st.skillstatTotalRhythms = 0;
          st.skillstatCorrectCount = 0;
          st.skillstatAttemptsTotal = 0;
          pickNextSkillStatGameRhythm();
          st.skillstatGameActive = true;
          st.skillstatFeedback = isTr
            ? '🎮 Oyun Başladı! Yukarıdaki 6 saniyelik EKG şeridini inceleyin ve aşağıdaki 27 ritimden doğru olanı seçin.'
            : '🎮 Game Started! Inspect the 6-second ECG strip above and click the matching rhythm from the 27 options below.';
          st.skillstatFeedbackType = 'info';
        }
        render();
      });
    });

    root.querySelector('[data-skillstat-dynamic]')?.addEventListener('click', () => {
      st.skillstatDynamic = !st.skillstatDynamic;
      render();
    });

    root.querySelector('[data-skillstat-grid]')?.addEventListener('click', () => {
      st.skillstatShowGrid = !st.skillstatShowGrid;
      render();
    });

    root.querySelectorAll('[data-skillstat-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.skillstatDifficulty = btn.dataset.skillstatDiff;
        st.skillstatAttemptsLeft = st.skillstatDifficulty === 'novice' ? 3 : 1;
        render();
      });
    });

    root.querySelectorAll('[data-skillstat-dur]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.skillstatDurationSec = Number(btn.dataset.skillstatDur);
        st.skillstatRemainingSec = st.skillstatDurationSec;
        render();
      });
    });

    root.querySelector('[data-skillstat-start]')?.addEventListener('click', () => {
      st.skillstatRemainingSec = st.skillstatDurationSec;
      st.skillstatTotalRhythms = 0;
      st.skillstatCorrectCount = 0;
      st.skillstatAttemptsTotal = 0;
      pickNextSkillStatGameRhythm();
      st.skillstatGameActive = true;
      st.skillstatFeedback = isTr
        ? '🎮 Yeni Oyun Başladı! Aşağıdaki 27 ritimden doğru olanı seçin.'
        : '🎮 New Game Started! Click the matching rhythm below.';
      st.skillstatFeedbackType = 'info';
      render();
    });

    // Hover-to-Freeze on the SkillStat 6-second strip
    const skillWrap = root.querySelector('#skillstat-canvas-wrap');
    skillWrap?.addEventListener('pointerenter', () => {
      st.skillstatHoverFrozen = true;
      renderCanvasFrame();
    });
    skillWrap?.addEventListener('pointerleave', () => {
      st.skillstatHoverFrozen = false;
      renderCanvasFrame();
    });

    // Clicking any of the 27 SkillStat Rhythm buttons
    root.querySelectorAll('[data-skillstat-rhy]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pickedId = btn.dataset.skillstatRhy;
        if (st.skillstatSubMode === 'learn') {
          st.skillstatRhyId = pickedId;
          render();
          return;
        }
        // Game Mode logic
        if (!st.skillstatGameActive) {
          st.skillstatGameActive = true;
          st.skillstatRemainingSec = st.skillstatDurationSec;
          pickNextSkillStatGameRhythm();
        }
        st.skillstatAttemptsTotal += 1;
        const targetObj = SKILLSTAT_27_RHYTHMS.find(r => r.id === st.skillstatTargetRhyId) || SKILLSTAT_27_RHYTHMS[0];
        if (pickedId === st.skillstatTargetRhyId) {
          st.skillstatCorrectCount += 1;
          st.skillstatCorrectPick = pickedId;
          st.skillstatFeedback = isTr
            ? `✅ Doğru! "${targetObj.tr}" (${targetObj.hr} bpm) — Sıradaki ritim yüklendi!`
            : `✅ Correct! "${targetObj.en}" (${targetObj.hr} bpm) — Next rhythm loaded!`;
          st.skillstatFeedbackType = 'ok';
          pickNextSkillStatGameRhythm();
        } else {
          if (!st.skillstatWrongPicks.includes(pickedId)) st.skillstatWrongPicks.push(pickedId);
          st.skillstatAttemptsLeft -= 1;
          if (st.skillstatAttemptsLeft <= 0) {
            st.skillstatFeedback = isTr
              ? `❌ Yanlış! Doğru ritim "${targetObj.tr}" idi. Sıradaki ritme geçildi.`
              : `❌ Missed! The rhythm was "${targetObj.en}". Moving to next rhythm.`;
            st.skillstatFeedbackType = 'err';
            pickNextSkillStatGameRhythm();
          } else {
            st.skillstatFeedback = isTr
              ? `⚠️ Tekrar deneyin! (${st.skillstatAttemptsLeft} hakkınız kaldı — İpucu: ${targetObj.descTr.slice(0, 85)}...)`
              : `⚠️ Try again! (${st.skillstatAttemptsLeft} tries left — Hint: ${targetObj.descEn.slice(0, 85)}...)`;
            st.skillstatFeedbackType = 'err';
          }
        }
        render();
      });
    });

    // Collapse toggle
    root.querySelector('[data-sim-collapse]')?.addEventListener('click', () => {
      st.collapsed = !st.collapsed;
      render();
    });

    // Pattern picker (grouped by category) and its previous / next arrows.
    function choosePattern(condId) {
      const next = CLINICAL_CONDITIONS.find(c => c.id === condId);
      if (!next) return;
      if (next.cat === 'channelopathy' && next.cat !== st.catId && st.rightPanelMode === 'heart') st.rightPanelMode = 'auto';
      st.catId = next.cat;
      st.condId = next.id;
      st.hrOverride = null;
      const matchNode = CARDIAC_CHANNELOPATHY_NODES.find(n => n.condId === st.condId) ||
                        CARDIAC_CHANNELOPATHY_NODES.find(n => (n.altCondIds || []).includes(st.condId));
      if (matchNode) st.chanNodeId = matchNode.id;
      render();
      root.querySelector('[data-sim-pattern]')?.focus();
    }
    root.querySelector('[data-sim-pattern]')?.addEventListener('change', e => choosePattern(e.target.value));
    root.querySelectorAll('[data-sim-pattern-step]').forEach(btn => {
      btn.addEventListener('click', () => {
        const order = CLINICAL_CATEGORIES.flatMap(cat => CLINICAL_CONDITIONS.filter(c => c.cat === cat.id));
        const at = order.findIndex(c => c.id === st.condId);
        choosePattern(order[(at + Number(btn.dataset.simPatternStep) + order.length) % order.length].id);
      });
    });

    // Right panel view switcher (3D Heart vs Phase 0-4 Channelopathies AP)
    root.querySelectorAll('[data-right-panel]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.rightPanelMode = btn.dataset.rightPanel;
        render();
      });
    });

    // Phase 0-4 Channelopathy interactive SVG boxes & channel pills
    root.querySelectorAll('[data-chan-node]').forEach(el => {
      el.addEventListener('click', () => {
        const nodeId = el.getAttribute('data-chan-node');
        const node = CARDIAC_CHANNELOPATHY_NODES.find(n => n.id === nodeId);
        if (!node) return;
        st.chanNodeId = node.id;
        st.catId = 'channelopathy';
        if (node.condId) {
          st.condId = node.condId;
          st.hrOverride = null;
        }
        render();
      });
    });

    // Toolbar controls
    root.querySelector('[data-sim-toggle-run]')?.addEventListener('click', () => {
      st.running = !st.running;
      render();
    });

    root.querySelector('[data-sim-speed]')?.addEventListener('click', () => {
      st.paperSpeed = st.paperSpeed === 25 ? 50 : 25;
      render();
    });

    root.querySelector('[data-sim-sound]')?.addEventListener('click', () => {
      st.soundOn = !st.soundOn;
      render();
    });

    root.querySelector('[data-sim-blind]')?.addEventListener('click', () => {
      st.blindMode = !st.blindMode;
      render();
    });

    // Sliders
    const hrSlider = root.querySelector('#clin-hr-slider');
    hrSlider?.addEventListener('input', e => {
      st.hrOverride = Number(e.target.value);
      const hrVal = root.querySelector('#clin-hr-val');
      if (hrVal) hrVal.textContent = `${st.hrOverride} bpm`;
      renderCanvasFrame();
    });

    const noiseSlider = root.querySelector('#clin-noise-slider');
    noiseSlider?.addEventListener('input', e => {
      st.noiseLevel = Number(e.target.value);
      const nVal = root.querySelector('#clin-noise-val');
      if (nVal) nVal.textContent = `${st.noiseLevel.toFixed(2)} mV`;
      renderCanvasFrame();
    });

    // Lead pills
    root.querySelectorAll('[data-sim-lead]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.activeLead = btn.dataset.simLead;
        render();
      });
    });

    // Conduction scrubber
    const condSlider = root.querySelector('#clin-conduction-slider');
    condSlider?.addEventListener('input', e => {
      st.running = false;
      st.conductionMs = Number(e.target.value);
      render();
    });

    root.querySelectorAll('[data-stage-jump]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.running = false;
        st.conductionMs = Number(btn.dataset.stageJump);
        render();
      });
    });

    root.querySelectorAll('[data-scrub-speed]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.scrubberSpeed = Number(btn.dataset.scrubSpeed);
        render();
      });
    });

    // Study Hub interactions
    root.querySelectorAll('[data-study-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.studyFilter = btn.dataset.studyFilter;
        st.questionIdx = 0;
        st.selectedLeads = [];
        st.selectedMcq = null;
        st.graded = false;
        render();
      });
    });

    root.querySelector('[data-study-prev]')?.addEventListener('click', () => {
      st.questionIdx = (st.questionIdx - 1 + Math.max(1, filteredCount)) % Math.max(1, filteredCount);
      st.selectedLeads = [];
      st.selectedMcq = null;
      st.graded = false;
      render();
    });

    root.querySelector('[data-study-next]')?.addEventListener('click', () => {
      st.questionIdx = (st.questionIdx + 1) % Math.max(1, filteredCount);
      st.selectedLeads = [];
      st.selectedMcq = null;
      st.graded = false;
      render();
    });

    root.querySelectorAll('[data-drill-lead]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (st.graded) return;
        const ld = btn.dataset.drillLead;
        if (st.selectedLeads.includes(ld)) {
          st.selectedLeads = st.selectedLeads.filter(x => x !== ld);
        } else {
          st.selectedLeads = [...st.selectedLeads, ld];
        }
        render();
      });
    });

    root.querySelector('[data-drill-submit]')?.addEventListener('click', () => {
      if (!activeQuestion) return;
      st.graded = true;
      const targets = activeQuestion.targetLeads || [];
      const exactMatch = targets.length === st.selectedLeads.length && targets.every(t => st.selectedLeads.includes(t));
      studyState.answered[activeQuestion.id] = exactMatch;
      if (!exactMatch && !studyState.missedIds.includes(activeQuestion.id)) {
        studyState.missedIds.push(activeQuestion.id);
      } else if (exactMatch) {
        studyState.missedIds = studyState.missedIds.filter(id => id !== activeQuestion.id);
      }
      saveStudyState(studyState);
      render();
    });

    root.querySelectorAll('[data-mcq-opt]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!activeQuestion || st.graded) return;
        st.selectedMcq = btn.dataset.mcqOpt;
        st.graded = true;
        const chosen = activeQuestion.options.find(o => o.id === st.selectedMcq);
        const isRight = Boolean(chosen?.correct);
        studyState.answered[activeQuestion.id] = isRight;
        if (!isRight && !studyState.missedIds.includes(activeQuestion.id)) {
          studyState.missedIds.push(activeQuestion.id);
        } else if (isRight) {
          studyState.missedIds = studyState.missedIds.filter(id => id !== activeQuestion.id);
        }
        saveStudyState(studyState);
        render();
      });
    });

    root.querySelectorAll('[data-study-tag]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!activeQuestion) return;
        const tagId = btn.dataset.studyTag;
        const cur = studyState.tags[activeQuestion.id] || [];
        studyState.tags[activeQuestion.id] = cur.includes(tagId)
          ? cur.filter(t => t !== tagId)
          : [...cur, tagId];
        saveStudyState(studyState);
        render();
      });
    });
  }

  render();
  rafId = requestAnimationFrame(stepAnimation);

  return {
    render,
    selectCategory(catId, condId, chanNodeId) {
      st.collapsed = false;
      st.mode = 'simulator';
      st.catId = catId;
      if (condId) st.condId = condId;
      if (chanNodeId) {
        st.chanNodeId = chanNodeId;
      } else if (condId) {
        const matchNode = CARDIAC_CHANNELOPATHY_NODES.find(n => n.condId === condId) ||
                          CARDIAC_CHANNELOPATHY_NODES.find(n => (n.altCondIds || []).includes(condId));
        if (matchNode) st.chanNodeId = matchNode.id;
      }
      render();
    },
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      root.remove();
    }
  };
}

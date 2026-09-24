import { CYCLE_SYNC as S } from './cardiac-cycle.js';
import { lvotGradient, physiologyOf } from './exam-physiology.js';

// Auscultation findings for the physical examination module. Each finding is
// one table entry: where it is heard, its timing and shape on the cardiac
// clock (physiologic phase u, the same clock as the ECG, Wiggers and 3D
// motion), its Levine grade at rest, and how strongly its intensity depends on
// each determinant in exam-physiology.js. `expected` is the textbook response
// table the model is tested against; `lembo` holds bedside accuracy from
// Lembo et al., N Engl J Med 1988;318:1572-8 (50 patients with systolic
// murmurs), where the study reports it.

export const RESPONSE_THRESHOLD = 0.12;   // |score| below this reads as unchanged

export const AUSCULTATION_AREAS = Object.freeze({
  aortic: { label: { en: 'Aortic area (2nd right intercostal space)', tr: 'Aort odağı (sağ 2. interkostal aralık)' }, short: 'A' },
  pulmonic: { label: { en: 'Pulmonic area (2nd left intercostal space)', tr: 'Pulmoner odak (sol 2. interkostal aralık)' }, short: 'P' },
  erb: { label: { en: "Erb's point (3rd left intercostal space)", tr: 'Erb noktası (sol 3. interkostal aralık)' }, short: 'E' },
  tricuspid: { label: { en: 'Tricuspid area (lower left sternal border)', tr: 'Triküspit odağı (sol alt sternal kenar)' }, short: 'T' },
  mitral: { label: { en: 'Mitral area (apex, 5th intercostal space, midclavicular line)', tr: 'Mitral odak (apeks, 5. interkostal aralık, midklaviküler hat)' }, short: 'M' }
});

const f = (id, def) => Object.freeze({ id, sounds: [], expected: {}, ...def });

// expected: '+' louder (or longer for MVP), '-' softer (or shorter), '0' unchanged;
// an array lists acceptable textbook answers; missing = not a standard test.
export const FINDINGS = Object.freeze({
  hocm: f('hocm', {
    label: { en: 'Hypertrophic obstructive cardiomyopathy (dynamic LVOT obstruction)', tr: 'Hipertrofik obstrüktif kardiyomiyopati (dinamik LVOT obstrüksiyonu)' },
    kind: 'systolic', side: 'left', area: 'erb', radiation: { en: 'Lower left sternal border and apex; little radiation to the carotids', tr: 'Sol alt sternal kenar ve apeks; karotislere az yayılır' },
    shape: 'ejection', peak: 0.72, grade: 3, pitch: 'medium', sounds: ['S4'],
    lvot: { restGradient: 40 },
    sensitivity: { lvSize: -1.1, afterload: -0.6, contractility: 0.6, rightReturn: -0.4 },
    expected: { valsalva_strain: '+', stand: '+', squat: '-', leg_raise: '-', handgrip: '-', arterial_occlusion: ['-', '0'], amyl_nitrite: '+', post_pvc: '+', phenylephrine: '-', inspiration: '-', exercise: '+' },
    lembo: {
      valsalva_strain: { sens: 65, spec: 96, direction: '+' },
      stand: { sens: 95, spec: 84, direction: '+' },
      squat: { sens: 95, spec: 85, direction: '-' },
      leg_raise: { sens: 85, spec: 91, direction: '-' },
      handgrip: { sens: 85, spec: 75, direction: '-' }
    },
    teaching: {
      en: 'The murmur tracks the LVOT gradient: anything that makes the LV smaller (less preload), lowers aortic pressure or raises contractility brings the septum and the anterior mitral leaflet (SAM) together and makes it louder. Carotid upstroke is brisk and bifid, unlike aortic stenosis.',
      tr: 'Üfürüm LVOT gradyanını izler: LV\'yi küçülten (ön yükü azaltan), aort basıncını düşüren veya kontraktiliteyi artıran her şey septum ile anterior mitral yaprakçığı (SAM) yaklaştırır ve üfürümü artırır. Karotis nabzı hızlı yükselir ve çift tepelidir; aort darlığının tersidir.'
    }
  }),
  aortic_stenosis: f('aortic_stenosis', {
    label: { en: 'Aortic stenosis', tr: 'Aort darlığı' },
    kind: 'systolic', side: 'left', area: 'aortic', radiation: { en: 'Both carotids; often to the apex (Gallavardin)', tr: 'Her iki karotise; sıklıkla apekse (Gallavardin)' },
    shape: 'ejection', peak: 0.74, grade: 3, pitch: 'harsh', sounds: ['S4', 'soft_A2'],
    sensitivity: { preload: 0.9, contractility: 0.5, afterload: -0.3, rightReturn: -0.25 },
    expected: { valsalva_strain: '-', stand: '-', squat: '+', leg_raise: ['+', '0'], handgrip: ['-', '0'], arterial_occlusion: ['-', '0'], amyl_nitrite: ['+', '0'], post_pvc: '+', inspiration: '-' },
    teaching: {
      en: 'A flow murmur across a fixed orifice: louder when more blood crosses the valve (squatting, leg raise, the beat after a PVC, amyl nitrite) and softer with Valsalva or standing. In Lembo\'s study no single maneuver identified it; it was diagnosed by exclusion. Unlike right-sided murmurs, it falls with inspiration (75% of observations) and rises with expiration. Late peaking, a soft A2 and a slow carotid upstroke mean severe stenosis.',
      tr: 'Sabit bir açıklıktan geçen akım üfürümüdür: kapaktan daha çok kan geçtiğinde artar (çömelme, bacak kaldırma, ekstrasistol sonrası atım, amil nitrit), Valsalva veya ayağa kalkmakla azalır. Lembo çalışmasında hiçbir manevra tek başına tanı koydurmadı, dışlama ile tanındı. Geç tepe, zayıf A2 ve yavaş karotis yükselişi ciddi darlığı düşündürür.'
    }
  }),
  mitral_regurgitation: f('mitral_regurgitation', {
    label: { en: 'Mitral regurgitation (primary)', tr: 'Mitral yetersizliği (primer)' },
    kind: 'systolic', side: 'left', area: 'mitral', radiation: { en: 'Left axilla', tr: 'Sol aksilla' },
    shape: 'holosystolic', grade: 3, pitch: 'blowing', sounds: ['S3'],
    sensitivity: { afterload: 0.9, preload: 0.3, rightReturn: -0.3 },
    // Lembo Table 1: stand and squat responses of MR were varied (40/30/30%).
    expected: { valsalva_strain: '-', stand: ['-', '0'], squat: ['+', '0'], leg_raise: ['+', '0'], handgrip: '+', arterial_occlusion: '+', amyl_nitrite: '-', post_pvc: '0', inspiration: '-' },
    lembo: {
      handgrip: { sens: 68, spec: 92, direction: '+', note: 'MR or VSD' },
      arterial_occlusion: { sens: 78, spec: 100, direction: '+', note: 'MR or VSD' },
      amyl_nitrite: { sens: 80, spec: 90, direction: '-', note: 'MR or VSD' }
    },
    teaching: {
      en: 'Regurgitant flow rises with afterload: handgrip and transient arterial occlusion make it louder, amyl nitrite softer. It is not louder in the beat after a PVC, which separates it from aortic stenosis. MR and VSD respond in parallel to every maneuver.',
      tr: 'Geri kaçış akımı art yükle artar: el sıkma ve geçici arteriyel oklüzyon üfürümü artırır, amil nitrit azaltır. Ekstrasistol sonrası atımda artmaz; bu, aort darlığından ayırır. MY ve VSD tüm manevralara paralel yanıt verir.'
    }
  }),
  vsd: f('vsd', {
    label: { en: 'Ventricular septal defect (restrictive)', tr: 'Ventriküler septal defekt (restriktif)' },
    kind: 'systolic', side: 'left', area: 'tricuspid', radiation: { en: 'Across the precordium; often a thrill', tr: 'Prekordiyum boyunca; sıklıkla tril' },
    shape: 'holosystolic', grade: 4, pitch: 'harsh',
    sensitivity: { afterload: 0.9, preload: 0.6, rightReturn: -0.3 },
    expected: { handgrip: '+', arterial_occlusion: '+', amyl_nitrite: '-', squat: '+', valsalva_strain: '-', inspiration: '-' },
    lembo: {
      handgrip: { sens: 68, spec: 92, direction: '+', note: 'MR or VSD' },
      arterial_occlusion: { sens: 78, spec: 100, direction: '+', note: 'MR or VSD' },
      amyl_nitrite: { sens: 80, spec: 90, direction: '-', note: 'MR or VSD' }
    },
    teaching: {
      en: 'Left-to-right flow driven by the LV-RV systolic pressure difference: louder with higher systemic pressure. The smaller the defect, the louder and harsher the murmur can be.',
      tr: 'LV-RV sistolik basınç farkıyla oluşan soldan sağa akım: sistemik basınç arttıkça artar. Defekt küçüldükçe üfürüm daha sert ve yüksek olabilir.'
    }
  }),
  mvp: f('mvp', {
    label: { en: 'Mitral valve prolapse (click and late systolic murmur)', tr: 'Mitral kapak prolapsusu (klik ve geç sistolik üfürüm)' },
    kind: 'systolic', side: 'left', area: 'mitral', radiation: { en: 'Apex, sometimes axilla', tr: 'Apeks, bazen aksilla' },
    shape: 'late-systolic', grade: 2, pitch: 'medium', sounds: ['click'],
    metric: 'duration',
    sensitivity: { lvSize: -1.0 },
    expected: { valsalva_strain: '+', stand: '+', squat: '-', leg_raise: '-', amyl_nitrite: '+' },
    teaching: {
      en: 'Timing, not loudness, is the sign: a smaller LV lets the leaflets prolapse earlier, so the click moves toward S1 and the murmur lengthens (Valsalva, standing, amyl nitrite). A larger LV delays the click and shortens the murmur (squatting, leg raise). Handgrip is not listed: Lembo 1988 groups it with the maneuvers that make the murmur earlier, while other teaching sources say it delays the click.',
      tr: 'Bulgu şiddet değil zamanlamadır: küçülen LV\'de yaprakçıklar daha erken prolabe olur, klik S1\'e yaklaşır ve üfürüm uzar (Valsalva, ayağa kalkma, amil nitrit). Büyüyen LV kliki geciktirir ve üfürümü kısaltır (çömelme, bacak kaldırma). El sıkma listede yok: Lembo 1988 onu üfürümü erkene alan manevralarla birlikte sayar, başka kaynaklar ise kliki geciktirdiğini söyler.'
    }
  }),
  aortic_regurgitation: f('aortic_regurgitation', {
    label: { en: 'Aortic regurgitation', tr: 'Aort yetersizliği' },
    kind: 'diastolic', side: 'left', area: 'erb', radiation: { en: 'Left sternal border; sitting up, leaning forward, held expiration', tr: 'Sol sternal kenar; oturur, öne eğilmiş, ekspiryumda nefes tutarak' },
    shape: 'early-diastolic', grade: 2, pitch: 'high', sounds: [],
    sensitivity: { afterload: 0.9, preload: 0.2, hr: -0.3 },
    expected: { handgrip: '+', squat: '+', arterial_occlusion: '+', amyl_nitrite: '-', valsalva_strain: '-', stand: '-', phenylephrine: '+', inspiration: '0' },
    teaching: {
      en: 'A high-pitched decrescendo diastolic murmur that grows with the aorta-to-LV diastolic gradient: handgrip, squatting and arterial occlusion raise it, amyl nitrite lowers it. Best heard with the diaphragm, patient sitting forward in held expiration.',
      tr: 'Aort-LV diyastolik gradyanıyla artan yüksek frekanslı dekreşendo diyastolik üfürüm: el sıkma, çömelme ve arteriyel oklüzyon artırır, amil nitrit azaltır. Diyafram ile, hasta öne eğilmiş, ekspiryumda nefes tutarken en iyi duyulur.'
    }
  }),
  mitral_stenosis: f('mitral_stenosis', {
    label: { en: 'Mitral stenosis', tr: 'Mitral darlığı' },
    kind: 'diastolic', side: 'left', area: 'mitral', radiation: { en: 'Localized to the apex', tr: 'Apekste lokalize' },
    shape: 'rumble', grade: 2, pitch: 'low', sounds: ['loud_S1', 'opening_snap'],
    sensitivity: { hr: 0.3, preload: 0.4, contractility: 0.5, proximity: 1.0 },
    expected: { left_lateral: '+', exercise: '+', amyl_nitrite: '+', valsalva_strain: '-', stand: '-', squat: '+', leg_raise: '+', inspiration: '0' },
    teaching: {
      en: 'A low-pitched rumble after an opening snap, with presystolic accentuation in sinus rhythm. Heard with the bell at the apex in left lateral decubitus; brief exercise or amyl nitrite (more flow, faster rate) bring it out. A shorter A2-to-opening-snap interval means a higher LA pressure.',
      tr: 'Açılma sesinden sonra başlayan düşük frekanslı rulman, sinüs ritminde presistolik belirginleşme ile. Apekste, sol lateral dekübitte çan ile duyulur; kısa egzersiz veya amil nitrit (daha çok akım, daha hızlı kalp) belirginleştirir. A2-açılma sesi aralığının kısalması daha yüksek LA basıncını gösterir.'
    }
  }),
  tricuspid_regurgitation: f('tricuspid_regurgitation', {
    label: { en: 'Tricuspid regurgitation', tr: 'Triküspit yetersizliği' },
    kind: 'systolic', side: 'right', area: 'tricuspid', radiation: { en: 'Right sternal border, epigastrium; large v waves in the neck', tr: 'Sağ sternal kenar, epigastrium; boyunda büyük v dalgaları' },
    shape: 'holosystolic', grade: 2, pitch: 'blowing',
    sensitivity: { rightReturn: 1.0, contractility: 0.2 },
    expected: { inspiration: '+', expiration: '-', valsalva_strain: '-', valsalva_release: '+', leg_raise: '+', handgrip: '0', arterial_occlusion: '0', amyl_nitrite: '+' },
    lembo: {
      inspiration: { sens: 100, spec: 88, direction: '+', note: 'any right-sided murmur' },
      expiration: { sens: 100, spec: 88, direction: '-', note: 'any right-sided murmur' }
    },
    teaching: {
      en: 'Carvallo sign: louder with inspiration as venous return to the right heart rises. After Valsalva release right-sided murmurs recover within 1-2 beats, before left-sided ones.',
      tr: 'Carvallo işareti: sağ kalbe venöz dönüş arttıkça inspiryumda artar. Valsalva bırakıldığında sağ kalp üfürümleri 1-2 atımda, sol kalptekilerden önce geri gelir.'
    }
  }),
  pulmonic_stenosis: f('pulmonic_stenosis', {
    label: { en: 'Pulmonic stenosis', tr: 'Pulmoner darlık' },
    kind: 'systolic', side: 'right', area: 'pulmonic', radiation: { en: 'Left shoulder and back', tr: 'Sol omuz ve sırt' },
    shape: 'ejection', peak: 0.72, grade: 3, pitch: 'harsh', sounds: ['ejection_click', 'wide_split'],
    sensitivity: { rightReturn: 0.8, contractility: 0.4 },
    expected: { inspiration: '+', expiration: '-', valsalva_strain: '-', amyl_nitrite: '+', post_pvc: '+' },
    lembo: {
      inspiration: { sens: 100, spec: 88, direction: '+', note: 'any right-sided murmur' },
      expiration: { sens: 100, spec: 88, direction: '-', note: 'any right-sided murmur' }
    },
    teaching: {
      en: 'An ejection murmur that grows with inspiration. The pulmonary ejection click is the only right-sided sound that softens with inspiration; S2 splits widely with a soft, late P2.',
      tr: 'İnspiryumla artan ejeksiyon üfürümü. Pulmoner ejeksiyon kliki inspiryumla azalan tek sağ kalp sesidir; S2 geniş ayrılır, P2 zayıf ve gecikmiştir.'
    }
  }),
  innocent: f('innocent', {
    label: { en: 'Innocent (flow) murmur', tr: 'Masum (akım) üfürümü' },
    kind: 'systolic', side: 'left', area: 'erb', radiation: { en: 'None', tr: 'Yayılmaz' },
    shape: 'ejection', peak: 0.62, grade: 2, pitch: 'musical',
    sensitivity: { preload: 0.5, rightReturn: 0.3, contractility: 0.4 },
    expected: { stand: '-', valsalva_strain: '-', leg_raise: '+', exercise: '+' },
    teaching: {
      en: 'Short, soft (grade 1-2), early-peaking, with normal S2 splitting and no other abnormal sounds. It softens on standing or with Valsalva and grows with fever, anemia, exercise or pregnancy.',
      tr: 'Kısa, hafif (derece 1-2), erken tepeli; S2 ayrılması normal ve başka anormal ses yok. Ayağa kalkınca veya Valsalva ile azalır; ateş, anemi, egzersiz veya gebelikte artar.'
    }
  })
});

export const FINDING_IDS = Object.freeze(Object.keys(FINDINGS));

/** Linear response score of a finding to a physiologic state. */
export function responseScore(findingId, physio) {
  const finding = FINDINGS[findingId];
  if (!finding) return 0;
  return Object.entries(finding.sensitivity).reduce((sum, [key, weight]) => sum + weight * (physio[key] || 0), 0);
}

/**
 * Response of a finding to a maneuver.
 * @returns {{ score: number, direction: '+'|'-'|'0', grade: number, lvotGradient: number|null, clickPhase: number|null }}
 */
export function respond(findingId, maneuverId, level = 1) {
  const finding = FINDINGS[findingId];
  const physio = physiologyOf(maneuverId, level);
  const score = responseScore(findingId, physio);
  const direction = score > RESPONSE_THRESHOLD ? '+' : score < -RESPONSE_THRESHOLD ? '-' : '0';
  // Levine grade moves about one step per 0.5 of score, within 1..6.
  const grade = finding.metric === 'duration'
    ? finding.grade
    : Math.max(1, Math.min(6, Math.round((finding.grade + score * 2) * 2) / 2));
  return {
    score,
    direction,
    grade,
    lvotGradient: finding.lvot ? lvotGradient(finding.lvot.restGradient, physio) : null,
    clickPhase: finding.sounds.includes('click') ? mvpClickPhase(physio) : null,
    physio
  };
}

/** Whether a computed direction matches the textbook entry (null when untested). */
export function matchesExpected(findingId, maneuverId, direction) {
  const expected = FINDINGS[findingId]?.expected[maneuverId];
  if (expected === undefined) return null;
  return Array.isArray(expected) ? expected.includes(direction) : expected === direction;
}

// ---------------------------------------------------------------------------
// Phonocardiogram on the shared cardiac clock.
// ---------------------------------------------------------------------------

const MID_SYSTOLE = (S.ejectionStart + S.ivrStart) / 2;

/** MVP click phase: mid-systole at rest, earlier as the LV gets smaller. */
export function mvpClickPhase(physio) {
  const click = MID_SYSTOLE + 0.09 * physio.lvSize;
  return Math.min(S.ivrStart - 0.06, Math.max(S.ivcStart + 0.05, click));
}

/**
 * Heart sounds (u, relative loudness 0..1, label) for a finding in a state.
 * S2 splitting widens with inspiration (P2 later).
 */
export function heartSoundEvents(findingId, physio, { rhythm = 'sinus' } = {}) {
  const finding = FINDINGS[findingId];
  const sounds = new Set(finding?.sounds || []);
  const split = sounds.has('wide_split') ? 0.05 + 0.02 * Math.max(0, physio.rightReturn) : 0.012 + 0.03 * Math.max(0, physio.rightReturn);
  const events = [
    { u: S.avClosed, amp: sounds.has('loud_S1') ? 1 : 0.8, label: 'S1', width: 0.012 },
    { u: S.ivrStart, amp: sounds.has('soft_A2') ? 0.35 : 0.75, label: 'A2', width: 0.01 },
    { u: S.ivrStart + split, amp: 0.45, label: 'P2', width: 0.009 }
  ];
  if (sounds.has('S3')) events.push({ u: 0.08, amp: 0.35 + 0.2 * Math.max(0, physio.proximity), label: 'S3', width: 0.012 });
  if (sounds.has('S4') && rhythm !== 'afib') events.push({ u: 0.41, amp: 0.35 + 0.2 * Math.max(0, physio.proximity), label: 'S4', width: 0.01 });
  if (sounds.has('opening_snap')) events.push({ u: 0.03, amp: 0.6, label: 'OS', width: 0.006 });
  if (sounds.has('click')) events.push({ u: mvpClickPhase(physio), amp: 0.55, label: 'C', width: 0.006 });
  if (sounds.has('ejection_click')) events.push({ u: S.ejectionStart + 0.012, amp: 0.5 - 0.3 * Math.max(0, physio.rightReturn), label: 'EC', width: 0.006 });
  return events;
}

const bell = (u, center, width) => Math.exp(-(((u - center) / width) ** 2));

/**
 * Murmur envelope (0..1) at phase u for a finding in a physiologic state,
 * scaled by its current Levine grade (grade 6 = 1).
 */
export function murmurEnvelope(findingId, u, physio, { rhythm = 'sinus' } = {}) {
  const finding = FINDINGS[findingId];
  if (!finding) return 0;
  const uu = ((u % 1) + 1) % 1;
  const score = responseScore(findingId, physio);
  const grade = finding.metric === 'duration' ? finding.grade : Math.max(1, Math.min(6, finding.grade + score * 2));
  const level = grade / 6;
  const start = S.ejectionStart + 0.01;
  const end = S.ivrStart - 0.005;
  switch (finding.shape) {
    case 'ejection': {
      if (uu < start || uu > end) return 0;
      // Dynamic obstruction and severe stenosis peak later as they worsen.
      const peak = Math.min(end - 0.04, finding.peak + (finding.lvot ? 0.03 * Math.max(0, score) : 0));
      const width = uu < peak ? peak - start : end - peak;
      return level * (1 - Math.abs(uu - peak) / width) ** 1.3;
    }
    case 'holosystolic':
      return uu >= S.avClosed + 0.004 && uu <= S.ivrStart ? level * 0.9 : 0;
    case 'late-systolic': {
      const click = mvpClickPhase(physio);
      return uu >= click && uu <= S.ivrStart ? level * (0.6 + 0.4 * (uu - click) / (S.ivrStart - click)) : 0;
    }
    case 'early-diastolic': {
      const t = uu >= S.ivrStart ? uu - S.ivrStart : uu + 1 - S.ivrStart;
      const span = 0.42;
      return t <= span ? level * (1 - t / span) : 0;
    }
    case 'rumble': {
      if (uu < 0.035 || uu >= S.avClosed) return 0;
      const early = uu < 0.32 ? 1 - 0.6 * (uu - 0.035) / 0.285 : 0.4;
      const presystolic = rhythm === 'afib' ? 0 : 0.8 * bell(uu, 0.425, 0.03);
      return level * Math.min(1, early + presystolic);
    }
    default:
      return 0;
  }
}

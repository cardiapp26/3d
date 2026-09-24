// Bedside maneuvers as physiologic perturbations, and the dynamic LV outflow
// tract (LVOT) obstruction model they drive. The physical examination module
// is data driven: a maneuver is a vector of relative changes (-1..+1) in a
// few determinants; every finding (exam-findings.js) declares how strongly it
// depends on each determinant. New maneuvers or findings are one table entry.
//
// Determinants (relative to rest, dimensionless):
//   preload       LV filling / end-diastolic volume (venous return to the left heart)
//   rightReturn   systemic venous return to the right heart
//   afterload     systemic arterial resistance / aortic pressure
//   contractility LV inotropy
//   hr            heart rate
//   proximity     how close the apex is to the chest wall (left lateral decubitus)
// lvSize is derived: a smaller LV brings the mitral apparatus and septum
// together (more LVOT obstruction, earlier MVP click).

export const DETERMINANTS = Object.freeze(['preload', 'rightReturn', 'afterload', 'contractility', 'hr', 'proximity']);

const zero = Object.freeze(Object.fromEntries(DETERMINANTS.map(k => [k, 0])));

const maneuver = (id, en, tr, delta, extra = {}) => Object.freeze({
  id,
  label: { en, tr },
  delta: Object.freeze({ ...zero, ...delta }),
  onsetSec: 4,
  holdSec: 6,
  ...extra
});

// Directions follow standard physical diagnosis teaching (Lembo et al.,
// N Engl J Med 1988;318:1572-8 for systolic murmurs; Braunwald's Heart
// Disease, physical examination chapter). Magnitudes are teaching weights.
export const MANEUVERS = Object.freeze({
  rest: maneuver('rest', 'Rest (supine)', 'İstirahat (sırtüstü)', {}, { onsetSec: 0, holdSec: 0 }),
  inspiration: maneuver('inspiration', 'Inspiration', 'İnspiryum',
    { rightReturn: 0.7, preload: -0.1, hr: 0.1 },
    { onsetSec: 1.5, holdSec: 2, note: { en: 'Negative intrathoracic pressure draws blood into the right heart; left filling falls slightly a few beats later.', tr: 'Negatif göğüs içi basınç sağ kalbe dönüşü artırır; sol doluş birkaç atım sonra hafifçe azalır.' } }),
  expiration: maneuver('expiration', 'Expiration', 'Ekspiryum',
    { rightReturn: -0.4, preload: 0.05 },
    { onsetSec: 1.5, holdSec: 2 }),
  valsalva_strain: maneuver('valsalva_strain', 'Valsalva (strain, phase II)', 'Valsalva (ıkınma, faz II)',
    { rightReturn: -0.8, preload: -0.8, afterload: -0.2, hr: 0.4 },
    { onsetSec: 3, holdSec: 10, note: { en: 'Forced expiration against a closed glottis raises intrathoracic pressure: venous return, LV size and stroke volume fall; heart rate rises.', tr: 'Kapalı glottise karşı zorlu ekspiryum göğüs içi basıncı artırır: venöz dönüş, LV boyutu ve atım hacmi düşer, kalp hızı artar.' } }),
  valsalva_release: maneuver('valsalva_release', 'Valsalva release (phase IV)', 'Valsalva bırakma (faz IV)',
    { rightReturn: 0.6, preload: 0.3, afterload: 0.3, hr: -0.3 },
    { onsetSec: 1, holdSec: 4, note: { en: 'Right-sided murmurs return first (1-2 beats), left-sided ones after 4-6 beats; blood pressure overshoots and heart rate slows.', tr: 'Sağ kalp üfürümleri önce (1-2 atım), sol kalp üfürümleri 4-6 atım sonra geri döner; kan basıncı aşar, kalp hızı yavaşlar.' } }),
  stand: maneuver('stand', 'Squat to stand', 'Çömelmeden ayağa kalkma',
    { rightReturn: -0.6, preload: -0.6, afterload: -0.1, hr: 0.3 },
    { onsetSec: 2, holdSec: 8, note: { en: 'Blood pools in the legs: venous return and LV size fall abruptly.', tr: 'Kan bacaklarda göllenir: venöz dönüş ve LV boyutu aniden azalır.' } }),
  squat: maneuver('squat', 'Stand to squat', 'Ayaktan çömelme',
    { rightReturn: 0.5, preload: 0.5, afterload: 0.5 },
    { onsetSec: 2, holdSec: 8, note: { en: 'Venous return and systemic resistance rise together (kinked femoral arteries): LV size and afterload increase.', tr: 'Venöz dönüş ve sistemik direnç birlikte artar (femoral arterler kıvrılır): LV boyutu ve art yük artar.' } }),
  leg_raise: maneuver('leg_raise', 'Passive leg raise', 'Pasif bacak kaldırma',
    { rightReturn: 0.5, preload: 0.4 },
    { onsetSec: 3, holdSec: 8 }),
  handgrip: maneuver('handgrip', 'Isometric handgrip', 'İzometrik el sıkma',
    { afterload: 0.7, hr: 0.3, contractility: 0.1 },
    { onsetSec: 5, holdSec: 20, note: { en: 'Sustained grip (about 1 minute at 30-50% of maximum) raises blood pressure and systemic resistance.', tr: 'Sürekli sıkma (yaklaşık 1 dakika, maksimumun %30-50\'si) kan basıncını ve sistemik direnci artırır.' } }),
  arterial_occlusion: maneuver('arterial_occlusion', 'Transient arterial occlusion', 'Geçici arteriyel oklüzyon',
    { afterload: 0.6 },
    { onsetSec: 2, holdSec: 20, note: { en: 'Cuffs on both arms inflated 20 mmHg above systolic for 20 seconds raise afterload without the tachycardia of handgrip.', tr: 'İki kola sistoliğin 20 mmHg üstünde 20 saniye şişirilen manşonlar, el sıkmanın taşikardisi olmadan art yükü artırır.' } }),
  amyl_nitrite: maneuver('amyl_nitrite', 'Amyl nitrite inhalation', 'Amil nitrit inhalasyonu',
    { afterload: -0.8, preload: -0.3, hr: 0.6, contractility: 0.3, rightReturn: 0.2 },
    { onsetSec: 15, holdSec: 30, note: { en: 'Arterial vasodilation (first 30 s) with reflex tachycardia and higher output; venous return falls later.', tr: 'Arteriyel vazodilatasyon (ilk 30 sn), refleks taşikardi ve artmış debi; venöz dönüş daha sonra düşer.' } }),
  post_pvc: maneuver('post_pvc', 'Beat after a PVC', 'Ekstrasistol sonrası atım',
    { preload: 0.4, contractility: 0.6, afterload: -0.2 },
    { onsetSec: 0, holdSec: 1, note: { en: 'The compensatory pause lengthens filling and post-extrasystolic potentiation raises contractility; aortic diastolic pressure is lower at that beat.', tr: 'Kompansatuvar duraklama doluşu uzatır, ekstrasistol sonrası potansiyasyon kontraktiliteyi artırır; o atımda aort diyastolik basıncı daha düşüktür.' } }),
  phenylephrine: maneuver('phenylephrine', 'Phenylephrine', 'Fenilefrin',
    { afterload: 0.8, hr: -0.3 },
    { onsetSec: 20, holdSec: 60 }),
  left_lateral: maneuver('left_lateral', 'Left lateral decubitus', 'Sol lateral dekübit',
    { proximity: 1 },
    { onsetSec: 2, holdSec: 10, note: { en: 'Brings the apex to the chest wall: listen with the bell for mitral stenosis, S3 and S4.', tr: 'Apeksi göğüs duvarına yaklaştırır: mitral darlığı, S3 ve S4 için çan ile dinleyin.' } }),
  exercise: maneuver('exercise', 'Brief exercise', 'Kısa egzersiz',
    { hr: 0.8, contractility: 0.6, preload: 0.2, rightReturn: 0.3, afterload: -0.2 },
    { onsetSec: 10, holdSec: 20 })
});

export const MANEUVER_IDS = Object.freeze(Object.keys(MANEUVERS));

/** Physiologic state at `level` (0..1) of a maneuver, with lvSize derived. */
export function physiologyOf(maneuverId, level = 1) {
  const m = MANEUVERS[maneuverId] || MANEUVERS.rest;
  const k = Math.max(0, Math.min(1, level));
  const state = Object.fromEntries(DETERMINANTS.map(key => [key, m.delta[key] * k]));
  // LV size: filling enlarges it, afterload keeps it larger in systole,
  // contractility empties it further.
  state.lvSize = state.preload + 0.4 * state.afterload - 0.4 * state.contractility;
  return state;
}

/** Ramp, hold and recovery durations (seconds) of a maneuver. */
export function maneuverSpans(maneuverId) {
  const m = MANEUVERS[maneuverId] || MANEUVERS.rest;
  if (m.id === 'rest') return [0, 0, 0];
  const onset = Math.max(0.001, m.onsetSec);
  return [onset, m.holdSec, Math.max(1, onset)];
}

/** Maneuver level (0..1) t seconds after starting: ramp, hold, recover. */
export function maneuverLevel(maneuverId, t) {
  const [onset, hold, recover] = maneuverSpans(maneuverId);
  if (onset === 0 || t < 0) return 0;
  if (t < onset) return t / onset;
  if (t < onset + hold) return 1;
  return Math.max(0, 1 - (t - onset - hold) / recover);
}

// ---------------------------------------------------------------------------
// Dynamic LVOT obstruction (hypertrophic obstructive cardiomyopathy).
// The gradient depends on the distance between the septum and the anterior
// mitral leaflet: it grows as the LV gets smaller (less preload), as aortic
// pressure falls (less afterload) and as contractility rises. Rest classes
// follow the usual thresholds: < 30 mmHg non-obstructive at rest, >= 30
// obstructive at rest, >= 50 mmHg provoked is the threshold for septal
// reduction in refractory symptoms.
// ---------------------------------------------------------------------------

export const LVOT_THRESHOLDS = Object.freeze({ obstructive: 30, severe: 50 });

/**
 * Peak instantaneous LVOT gradient in mmHg.
 * @param {number} restGradient gradient at rest (mmHg)
 * @param {{ preload: number, afterload: number, contractility: number, lvSize: number }} physio
 */
export function lvotGradient(restGradient, physio) {
  const drive = -1.1 * physio.lvSize - 0.6 * physio.afterload + 0.6 * physio.contractility;
  // Latent obstruction (tiny rest gradient) can still be provoked; floor 5 mmHg.
  const base = Math.max(5, restGradient);
  return Math.min(180, base * Math.exp(drive));
}

/** Classification label for an LVOT gradient (mmHg). */
export function lvotClass(gradient) {
  if (gradient >= LVOT_THRESHOLDS.severe) return 'severe';
  if (gradient >= LVOT_THRESHOLDS.obstructive) return 'obstructive';
  return 'non-obstructive';
}

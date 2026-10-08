/*
 * Atypical Accessory Pathways & Unusual Electrophysiologic Phenomena
 * based on Reginald T. Ho MD (2019, Chapters 11 & 22) and Sternick EB (2003).
 * Synthetic teaching timelines on a millisecond scale; fiducial events stand
 * for measured onsets and electrograms.
 */
import { surfaceBeat, merge, ev, far, mono, CH_SVT } from './ep-beats.js';
import { cal, ref, measure } from './ep-caliper.js';

export const ATYPICAL_PHENOMENA_SOURCE = 'https://pubmed.ncbi.nlm.nih.gov/15851159/'; // Sternick 2003 / Ho 2019

export const ATYPICAL_PHENOMENA_EXAMPLES = Object.freeze([
  ['ap-mahaim', 'Atipik AP: Mahaim (Atriyofasiküler) Lifi ve M Potansiyeli', 'Atypical AP: Mahaim (Atriofascicular) Fiber and M Potential'],
  ['ep-supernormality', 'Sıradışı Fenomen: Süpernormal İleti (Paradoksal QRS)', 'Unusual Phenomenon: Supernormal Conduction (Paradoxical QRS)']
].map(Object.freeze));

const CH_MAHAIM = ['ecg-ii', 'ecg-v1', 'hra', 'his-d', 'abl-d', 'cs-910', 'cs-12', 'rv'];

// ---------------------------------------------------------------------------
// 1. Mahaim Fiber (Atriofascicular pathway) during antidromic tachycardia (TCL = 340 ms)
// Antegrade over the Mahaim pathway to the distal right bundle branch (LBBB pattern).
// Retrograde up the AV node/His bundle (concentric retrograde atrial sequence).
// ABL at the lateral tricuspid annulus records an M-potential (M) 40 ms before V.
// HV interval is short/zero (HV = 0 to -5 ms) because ventricular activation precedes
// or coincides with retrograde His penetration.
// ---------------------------------------------------------------------------
const mahaimBeat = (v) => {
  const m = v - 40;  // Mahaim potential on lateral annulus 40 ms prior to V
  const hRetro = v + 15; // His retrogradely penetrated
  const aRetro = hRetro + 105; // Concentric retrograde A
  return merge(surfaceBeat(v, { wide: true }), {
    'abl-d': [
      ev('A', m - 35, 0.4, 5),   // Local atrial potential
      ev('M', m, 0.75, 3),       // Sharp Mahaim potential (ablation target)
      ev('V', v, 0.8, 6)         // Local ventricular potential (M-V = 40 ms)
    ],
    hra: [ev('A', aRetro + 25, 0.8), far('V', v + 25, 0.3)],
    'his-d': [ev('V', v, 0.85), ev('H', hRetro, 0.45, 4), ev('A', aRetro, 0.6)],
    'cs-910': [ev('A', aRetro + 15, 0.7), far('V', v + 20, 0.35)],
    'cs-12': [ev('A', aRetro + 45, 0.65), far('V', v + 25, 0.35)],
    rv: [ev('V', v - 10, 0.95)] // RV apex early due to right fascicular insertion
  });
};

// ---------------------------------------------------------------------------
// 2. Supernormal Conduction (Ho 2019 Chapter 22 Figs 22-1 & 22-2)
// Baseline rhythm: sinus with Right Bundle Branch Block (RBBB, wide QRS = 140 ms).
// P-P = 800 ms.
// At t = 1180 ms, a critically timed PAC (coupling interval = 380 ms) arrives
// exactly during the supernormal period of the right bundle branch.
// Conduction accelerates through the recovering right bundle -> QRS PARADOXICALLY
// NARROWS to normal duration (90 ms)!
// ---------------------------------------------------------------------------
const supernormalSinusRbbb = (t) => {
  const aHis = t + 35;
  const h = aHis + 80;
  const v = h + 45;
  return merge(surfaceBeat(v, { p: t, wide: true }), {
    hra: [ev('A', t, 0.9), far('V', v + 15, 0.25)],
    'his-p': [ev('A', aHis - 3, 0.6), ev('H', h, 0.35, 4), ev('V', v, 0.7)],
    'his-d': [ev('A', aHis, 0.35), ev('H', h, 0.75, 4), ev('V', v, 0.9)],
    'cs-910': [ev('A', t + 45, 0.8), far('V', v + 20, 0.35)],
    'cs-56': [ev('A', t + 60, 0.7), far('V', v + 22, 0.35)],
    'cs-12': [ev('A', t + 75, 0.7), far('V', v + 25, 0.35)],
    rv: [ev('V', v + 35, 0.9)] // Delayed RV activation in RBBB
  });
};

const supernormalNarrowBeat = (t) => {
  const aHis = t + 40;
  const h = aHis + 105; // Decremental AH on premature beat
  const v = h + 45;     // Normal HV
  return merge(surfaceBeat(v, { p: t, wide: false }), { // PARADOXICAL NARROW QRS!
    hra: [ev('A', t, 0.9), far('V', v + 10, 0.25)],
    'his-p': [ev('A', aHis - 3, 0.6), ev('H', h, 0.35, 4), ev('V', v, 0.7)],
    'his-d': [ev('A', aHis, 0.35), ev('H', h, 0.75, 4), ev('V', v, 0.9)],
    'cs-910': [ev('A', t + 45, 0.8), far('V', v + 15, 0.35)],
    'cs-56': [ev('A', t + 60, 0.7), far('V', v + 18, 0.35)],
    'cs-12': [ev('A', t + 75, 0.7), far('V', v + 20, 0.35)],
    rv: [ev('V', v - 5, 0.9)] // Normal simultaneous RV activation
  });
};

const recordings = {};

recordings['ap-mahaim'] = {
  id: 'ap-mahaim', mechanism: 'ap-left-manifest', windowMs: 2200, channels: CH_MAHAIM,
  events: merge(
    mahaimBeat(200),
    mahaimBeat(540),
    mahaimBeat(880),
    mahaimBeat(1220),
    mahaimBeat(1560),
    mahaimBeat(1900)
  ),
  markers: [
    { t: 540, label: { tr: 'Antidromik taşikardi (LBBB morfolojisi, TCL 340 ms)', en: 'Antidromic tachycardia (LBBB morphology, TCL 340 ms)' } },
    { t: 840, label: { tr: 'ABL: Triküspit anulusunda keskin M potansiyeli (M-V 40 ms)', en: 'ABL: Sharp M potential on tricuspid annulus (M-V 40 ms)' } }
  ],
  calipers: [
    cal('TCL', ref('rv', 'V', 0), ref('rv', 'V', 1), 'rv'),
    cal('M-V', ref('abl-d', 'M', 2), ref('abl-d', 'V', 2), 'abl-d'),
    cal('V-A (retrograd)', ref('his-d', 'V', 2), ref('his-d', 'A', 2), 'his-d')
  ],
  derivedMeasurements: []
};

recordings['ep-supernormality'] = {
  id: 'ep-supernormality', mechanism: 'sinus', windowMs: 2600, channels: CH_SVT,
  events: merge(
    supernormalSinusRbbb(100),
    supernormalSinusRbbb(900),
    supernormalNarrowBeat(1280), // Critically timed PAC at supernormal period
    supernormalSinusRbbb(2000)
  ),
  markers: [
    { t: 900, label: { tr: 'Temel ritim: Sinüs + Sağ Dal Bloğu (Geniş QRS)', en: 'Baseline: Sinus + Right Bundle Branch Block (Wide QRS)' } },
    { t: 1280, label: { tr: 'Erken PAC: Süpernormal periyotta paradoksal daralma!', en: 'Premature PAC: Paradoxical narrowing in supernormal period!' } }
  ],
  calipers: [
    cal('P-P (Sinüs)', ref('ecg-ii', 'P', 0), ref('ecg-ii', 'P', 1), 'ecg-ii'),
    cal('P1-P2 (PAC)', ref('ecg-ii', 'P', 1), ref('ecg-ii', 'P', 2), 'ecg-ii'),
    cal('HV', ref('his-d', 'H', 2), ref('his-d', 'V', 2), 'his-d')
  ],
  derivedMeasurements: []
};

/** Fresh copy so caliper/recorder callers cannot mutate other examples. */
export function atypicalPhenomenaRecording(id) {
  return recordings[id] ? structuredClone({ markers: [], ...recordings[id] }) : null;
}

export function atypicalPhenomenaMeasurements(recording) {
  if (!recording) return {};
  const values = Object.fromEntries(recording.calipers.map((c) => [c.label, measure(recording, c)]));
  for (const { label, subtract: [a, b] } of recording.derivedMeasurements || []) {
    values[label] = values[a] == null || values[b] == null ? null : values[a] - values[b];
  }
  return values;
}

export const ATYPICAL_PHENOMENA_TEXT = Object.freeze({
  'ap-mahaim': {
    tr: 'Mahaim (Atriyofasiküler) Lifi ve M Potansiyeli (Ho 2019 Bölüm 11, Şekil 11-30/11-34, Sternick 2003): Mahaim yolları sağ atriyum serbest duvarı ile sağ dal arborizasyonu arasında yer alır; sadece antegrad ve dekremental iletim özelliğine sahiptir (retrograd iletmez). Antidromik reentran taşikardi sırasında antegrad kol Mahaim lifi üzerinden sağ ventriküle indiği için yüzey EKG\'de sol dal bloğu (LBBB) morfolojisi görülür; retrograd kol ise AV düğüm-His eksenini kullanır (konsantrik atriyal aktivasyon). Ablasyon kateteri lateral triküspit anulusunda yerel atriyal ve ventriküler sinyaller arasında keskin bir Mahaim potansiyeli (M potansiyeli, burada M-V = 40 ms) kaydeder. M potansiyelinin hedeflenmesi yolu başarıyla ablate eder.',
    en: 'Mahaim (Atriofascicular) Fiber and M Potential (Ho 2019 Chapter 11, Figs 11-30/11-34, Sternick 2003): Mahaim fibers originate along the right atrial free wall/tricuspid annulus and insert distally into the right bundle branch system; they exhibit exclusively antegrade, decremental conduction without retrograde conduction. During antidromic reciprocating tachycardia, antegrade conduction down the Mahaim pathway produces a classic left bundle branch block (LBBB) pattern, while retrograde conduction ascends the normal His-Purkinje and AV nodal trunk. The ablation catheter at the lateral tricuspid annulus records a distinct, sharp Mahaim potential (M potential, here M-V = 40 ms) preceding local ventricular activation. Eliminating this M potential achieves curative ablation.',
    source: 'https://pubmed.ncbi.nlm.nih.gov/15851159/'
  },
  'ep-supernormality': {
    tr: 'Sıradışı Elektrofizyolojik Fenomen: Süpernormal İleti (Ho 2019 Bölüm 22, Şekil 22-1 ve 22-2): Dal bloğu (burada sağ dal bloğu, RBBB) zemininde, repolarizasyonun tam sonundaki kısa ve kritik bir zaman penceresinde gelen prematüre bir uyarının paradoksal olarak daha iyi iletilmesi ve QRS\'in tamamen daralarak normale dönmesidir. Aksiyon potansiyelinin 3. fazının hemen sonunda hücrelerin uyarılma eşiği geçici olarak dinlenim membran potansiyelinden daha negatiftir (süpernormal periyot). Bu kritik pencereye denk gelen atriyal erken vuru (burada P1-P2 = 380 ms) bloke daldan hızla iletilerek QRS\'i normale döndürür.',
    en: 'Unusual Electrophysiologic Phenomenon: Supernormal Conduction (Ho 2019 Chapter 22, Figs 22-1 & 22-2): In a patient with baseline bundle branch block (here RBBB), a critically timed premature impulse falling into a brief, narrow window at the end of phase 3 repolarization conducts paradoxically faster and restores a completely normal, narrow QRS complex. During this supernormal excitability phase, the membrane potential is close to threshold, allowing an otherwise blocked bundle branch to conduct unexpectedly.',
    source: 'https://pubmed.ncbi.nlm.nih.gov/15851159/'
  }
});

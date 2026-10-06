import { atrialPacedBeat, svtBeat, A_TYPICAL, merge, ev, far } from './ep-beats.js';
import { cal, ref } from './ep-caliper.js';

export const ECTOR_SOURCE = 'https://doi.org/10.1093/ehjcr/ytaa129';
export const ECTOR_EXAMPLE = Object.freeze(['avnrt-ector-induction', 'AVNRT indüksiyonu: Ector 2020, Şekil 3', 'AVNRT induction: Ector 2020, Figure 3']);
const stimuli = [200, 720, 1220, 1700];
const ah = [80, 90, 240, 250];
const lastV = stimuli[3] + 40 + ah[3] + 45;
const parts = stimuli.map((s, i) => atrialPacedBeat(s, ah[i]));
// Retrograde A after the fourth paced beat initiates sustained tachycardia.
// Only the A events are added here: the conducted H and V already exist.
parts.push(Object.fromEntries(Object.entries(svtBeat(lastV, A_TYPICAL))
  .map(([ch, events]) => [ch, events.filter((e) => e.type === 'A')])));
parts.push(...[lastV + 320, lastV + 640, lastV + 960, lastV + 1280].map((v) => svtBeat(v, A_TYPICAL)));
const events = merge(...parts);
// Source Figure 3 has no RV catheter. The conduction ladder uses surface II V.
delete events.rv;
events['ecg-i'] = events['ecg-ii'].map((e) => ({ ...e, amp: e.amp * 0.8 }));
for (const [ch, gain] of [['his-3', 0.8], ['his-2', 0.9]]) events[ch] = events['his-d'].map((e) => ({ ...e, amp: e.amp * gain }));
for (const [ch, dt] of [['cs-78', 57], ['cs-34', 72]]) {
  const paced = stimuli.map((s) => ev('A', s + dt, 0.7));
  const retro = events['his-d'].filter((e) => e.type === 'A' && e.t > lastV).map((e) => ev('A', e.t + (ch === 'cs-78' ? 14 : 30), 0.7));
  const vs = events['his-d'].filter((e) => e.type === 'V').map((e) => far('V', e.t + 20, 0.35, 8));
  events[ch] = merge({ [ch]: [...paced, ...retro, ...vs] })[ch];
}
for (const [ch, gain] of [['abl-p', 0.3], ['abl-d', 0.18]]) events[ch] = events['his-d']
  .filter((e) => e.type !== 'H').map((e) => ({ ...e, amp: e.type === 'A' ? gain : 0.9 }));

const recording = {
  id: ECTOR_EXAMPLE[0], mechanism: 'avnrt-typical', windowMs: 3550, preserveChannelOrder: true,
  channels: ['ecg-i', 'ecg-ii', 'ecg-v1', 'hra', 'his-p', 'his-3', 'his-2', 'his-d', 'abl-p', 'abl-d', 'cs-910', 'cs-78', 'cs-56', 'cs-34', 'cs-12'],
  channelLabels: { hra: 'RAA', 'cs-910': 'CS p 9-10', 'cs-12': 'CS d 1-2' }, events,
  markers: stimuli.map((t, i) => ({ t, label: { tr: `S${i + 1}: ${i < 2 ? 'FP' : 'SP'}`, en: `S${i + 1}: ${i < 2 ? 'FP' : 'SP'}` } }))
    .concat([{ t: lastV + 30, label: { tr: 'Retrograd A → AVNRT', en: 'Retrograde A → AVNRT' } }]),
  calipers: [
    cal('AH FP', ref('his-d', 'A', 1), ref('his-d', 'H', 1)),
    cal('AH SP', ref('his-d', 'A', 2), ref('his-d', 'H', 2)),
    cal('HV', ref('his-d', 'H', 3), ref('his-d', 'V', 3)),
    cal('VA', ref('his-d', 'V', 4), ref('his-d', 'A', 5)),
    cal('TCL', ref('his-d', 'V', 4), ref('his-d', 'V', 5))
  ], derivedMeasurements: [{ label: 'ΔAH FP→SP', subtract: ['AH SP', 'AH FP'] }]
};
export const ectorRecording = (id) => id === recording.id ? structuredClone(recording) : null;
export const ECTOR_TEXT = {
  tr: {
    description: 'Ector ve ark. (2020), Şekil 3, s. 4 temel alınmıştır. İlk iki paced atım FP üzerinden, üçüncü ve dördüncü atım AH uzamasıyla SP üzerinden iletilir. Dördüncü atımdan sonra retrograd FP dönüşü slow-fast AVNRT başlatır. Buradaki dalgalar ve tüm sayısal süreler şematik rekonstrüksiyondur; hastanın özgün kaydından dijitize edilmedi. Makalenin acil EKG hızı 192/dk, bu rekonstrüksiyonun TCL’siyle eşitlenmedi.',
    legend: 'S: pacing stimulus (makalede P); A: atriyal elektrogram; H: His potansiyeli; V: ventriküler elektrogram; FP: hızlı yol; SP: yavaş yol. RAA: sağ atriyal apendiks pacing kateteri; His p/3/2/d: dört His bipolü; ABL p/d: ablasyon bipolleri; CS p→d: koroner sinüs proksimal→distal. Yüzey P dalgası ile makaledeki pacing P işareti farklıdır.',
    stages: ['1–2: Atriyal pacing, kısa AH, antegrad FP iletimi.', '3–4: Pacing hızlanır, AH belirgin uzar, antegrad SP iletimi.', '4 sonrası: Uyarısız retrograd A geri döner; ardından düzenli slow-fast AVNRT sürer. Taşikardide A ve V birbirine yakındır.']
  },
  en: {
    description: 'Based on Ector et al. (2020), Figure 3, p. 4. The first two paced beats conduct through FP; the third and fourth conduct through SP with longer AH. Retrograde FP return after the fourth beat initiates slow-fast AVNRT. Waveforms and all numerical timings here are schematic reconstructions, not digitized patient data. The emergency ECG rate of 192/min is not assigned to this reconstructed TCL.',
    legend: 'S: pacing stimulus (P in the paper); A: atrial electrogram; H: His potential; V: ventricular electrogram; FP: fast pathway; SP: slow pathway. RAA: right atrial appendage pacing catheter; His p/3/2/d: four His bipoles; ABL p/d: ablation bipoles; CS p→d: coronary sinus proximal→distal. Surface P waves differ from the paper’s pacing P marker.',
    stages: ['1–2: Atrial pacing, short AH, antegrade FP conduction.', '3–4: Faster pacing, marked AH prolongation, antegrade SP conduction.', 'After 4: An unstimulated retrograde A returns, followed by sustained regular slow-fast AVNRT. A and V are close in tachycardia.']
  }
};

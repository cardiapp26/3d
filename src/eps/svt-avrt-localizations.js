import { svtBeat, merge } from './ep-beats.js';
import { ref, cal } from './ep-caliper.js';

// Designed activation delays after His-d V, not patient measurements.
// All locations use the same TCL to isolate differences in atrial sequence.
// HRA is not a local right annular electrode; Halo and ABL supply that detail.
export const AVRT_LOCALIZATIONS = Object.freeze([
  {
    id: 'avrt-left-anterolateral', names: ['Sol anterolateral', 'Left anterolateral'], earliest: 'cs-12',
    offsets: { 'abl-d': 85, 'cs-12': 90, 'cs-34': 104, 'cs-56': 119, 'cs-78': 133, 'cs-910': 148, 'his-p': 145, 'his-d': 147, hra: 160 },
    notes: ['Boston sunumu slayt 7–8 ile karşılaştırma: distal CS erken, proksimale doğru gecikiyor. Bu tasarlanmış CS dizilimi anterolateral ile lateral girişi tek başına ayıramaz; annüler haritalama gerekir.', 'Comparison with Boston slides 7–8: distal CS is early, with delays toward proximal CS. This designed sequence alone cannot separate anterolateral from lateral insertion; annular mapping is required.']
  },
  {
    id: 'avrt-left-posterolateral', names: ['Sol posterolateral', 'Left posterolateral'], earliest: 'cs-34',
    offsets: { 'abl-d': 85, 'cs-34': 90, 'cs-12': 102, 'cs-56': 105, 'cs-78': 121, 'cs-910': 137, 'his-p': 145, 'his-d': 147, hra: 160 },
    notes: ['Boston sunumu slayt 6 ile karşılaştırma: bu kurguda CS 3-4 erken, iki yöne yayılım var. Posterior CS 5-6 ve anterolateral distal CS örnekleriyle karşılaştırın. Elektrot yerleşimi ve oblik girişler nedeniyle çift numarası evrensel lokalizasyon ölçütü değildir.', 'Comparison with Boston slide 6: CS 3-4 is early in this design, with spread in both directions. Compare with posterior CS 5-6 and anterolateral distal CS examples. Electrode placement and oblique insertions prevent pair numbers from being universal localization criteria.']
  },
  {
    id: 'avrt-left-posterior', names: ['Sol posterior', 'Left posterior'], earliest: 'cs-56',
    offsets: { 'abl-d': 85, 'cs-56': 90, 'cs-34': 100, 'cs-78': 105, 'cs-12': 115, 'cs-910': 125, 'his-p': 138, 'his-d': 140, hra: 155 },
    notes: ['CS 5-6 erken; aktivasyon CS boyunca iki yöne yayılıyor. Sol lateral örnekteki distal CS başlangıcıyla karşılaştırın.', 'CS 5-6 is early; activation spreads in both directions along CS. Compare with the distal CS onset in the left lateral example.']
  },
  {
    id: 'avrt-right-lateral', names: ['Sağ lateral', 'Right lateral'], earliest: 'halo-56',
    offsets: { 'abl-d': 85, 'halo-56': 90, 'halo-78': 102, 'halo-34': 104, 'halo-910': 115, 'halo-12': 120, hra: 124, 'his-p': 128, 'his-d': 130, 'cs-910': 138, 'cs-78': 148, 'cs-56': 158, 'cs-34': 170, 'cs-12': 180 },
    notes: ['Sağ lateral annülüste lokal ABL ve Halo 5-6 erken. HRA lokal annüler elektrot değildir. CS proksimalden distale aktive oluyor.', 'Local ABL and Halo 5-6 are early on the right lateral annulus. HRA is not a local annular electrode. CS activates from proximal to distal.']
  },
  {
    id: 'avrt-right-posterolateral', names: ['Sağ posterolateral', 'Right posterolateral'], earliest: 'halo-12',
    offsets: { 'abl-d': 85, 'halo-12': 90, 'halo-34': 103, 'cs-910': 108, 'halo-56': 117, 'his-p': 128, 'his-d': 130, 'cs-78': 120, 'cs-56': 134, 'halo-78': 135, 'cs-34': 148, 'halo-910': 153, 'cs-12': 162, hra: 165 },
    notes: ['Alt lateral triküspit annülüste lokal ABL ve Halo 1-2 erken; proksimal CS de erken görünebilir. Inferior paraseptal örnekten ayrım için annüler haritalamayı karşılaştırın.', 'Local ABL and Halo 1-2 are early on the low lateral tricuspid annulus; proximal CS can also appear early. Compare annular mapping with the inferior paraseptal example.']
  },
  {
    id: 'avrt-midseptal', names: ['Midseptal', 'Midseptal'], earliest: 'his-p',
    offsets: { 'abl-d': 85, 'his-p': 100, 'his-d': 102, 'cs-910': 112, 'cs-78': 124, hra: 130, 'cs-56': 136, 'cs-34': 148, 'cs-12': 160 },
    notes: ['Lokal septal ABL, His atriyal sinyalinden önce geliyor. His/proksimal CS dizilimi para-Hisian yol ve AVNRT ile örtüşebilir; tek dizilim kesin yer tayini yapmaz.', 'Local septal ABL precedes the His atrial signal. His/proximal CS sequence can overlap with para-Hisian pathways and AVNRT; one sequence cannot establish the exact site.']
  }
].map((s) => Object.freeze({ ...s, offsets: Object.freeze(s.offsets), names: Object.freeze(s.names), notes: Object.freeze(s.notes) })));

export const AVRT_LOCALIZATION_SOURCE = 'https://pubmed.ncbi.nlm.nih.gov/3584720/';
const recordings = new Map(AVRT_LOCALIZATIONS.map((s) => {
  const events = merge(...[180, 580, 980, 1380].map((v) => svtBeat(v, s.offsets, { ablV: 0 })));
  const channels = ['ecg-ii', 'ecg-v1', 'hra', 'his-p', 'his-d', 'cs-910', 'cs-78', 'cs-56', 'cs-34', 'cs-12',
    ...Object.keys(s.offsets).filter((ch) => ch.startsWith('halo-')), 'rv', 'abl-d'];
  const calipers = [cal('TCL', ref('his-d', 'V', 1), ref('his-d', 'V', 2)),
    cal('VA septal', ref('his-d', 'V', 1), ref('his-d', 'A', 1)),
    cal('VA local', ref('abl-d', 'V', 1), ref('abl-d', 'A', 1)),
    cal('VA earliest', ref('his-d', 'V', 1), ref('abl-d', 'A', 1), 'abl-d')];
  return [s.id, Object.freeze({ id: s.id, mechanism: 'avrt-orthodromic', windowMs: 1700, channels, events, calipers, markers: [] })];
}));
export const avrtLocalizationRecording = (id) => recordings.get(id) || null;

// Texts of the conduction-system section of the Cell chapter (ecg-cell-cascade.js): cell names,
// typical values, and per phase the ions that enter and leave with the ECG moment it matches.
// Values: Katz, Physiology of the Heart; Grant, Circulation 2009;120:1773; Mangoni and Nargeot,
// Physiol Rev 2008;88:919.

export const CASCADE_TEXT = {
  tr: {
    title: 'İleti sistemi boyunca aksiyon potansiyelleri, iyonlar ve EKG',
    lead: 'SA düğümden ventriküle her hücrenin aksiyon potansiyeli aynı zaman ekseninde, altta DII. İmleci oynat veya grafikte sürükle; bir hücreye tıklayınca membranında o an giren ve çıkan iyonları görürsün.',
    cell: 'Hücre', tone: 'Otonom tonus', vagal: 'Vagal', sympathetic: 'Sempatik', neutral: 'Nötr', ivabradine: 'İvabradin (If blokajı)',
    play: 'Oynat', pause: 'Durdur', speed: 'Hız', time: 'Atım içi zaman',
    cells: { sa: 'SA düğüm', atrial: 'Atriyum', av: 'AV düğüm', purkinje: 'Purkinje', ventricle: 'Ventrikül' },
    readouts: { rate: 'Kalp hızı', rr: 'RR', pr: 'PR', qt: 'QT', rest: 'Dinlenim / MDP', threshold: 'Eşik', peak: 'Tepe', dvdt: 'Faz 0 hızı (tipik)', apd: 'AP süresi', cv: 'İleti hızı (tipik)', intrinsic: 'İntrensek hız' },
    phase: 'Faz', ecg: 'EKG', enters: 'İçe giren', leaves: 'Dışa çıkan', channels: 'Kanallar',
    outside: 'Hücre dışı · Na⁺ 140 · Ca²⁺ 2 · K⁺ 4 mM', inside: 'Hücre içi · Na⁺ 10 · K⁺ 140 mM',
    into: 'içe', out: 'dışa', now: 'Şu an EKG’de', silent: 'yüzey EKG’de görünmez',
    regions: { P: 'P dalgası', PR: 'PR segmenti', QRS: 'QRS', ST: 'ST segmenti', T: 'T dalgası', TP: 'TP (diyastol)' },
    note: 'Şematik eğitim modeli: dalga şekilleri ve akım yoğunlukları tipik literatür değerlerinden çizilir (Katz; Grant 2009; Mangoni ve Nargeot 2008); çözülmüş iyon modeli değildir. Faz 0 hızı ve ileti hızı tipik aralıklardır. Aşağıdaki ventrikül laboratuvarı nicel modeldir.',
    pump: 'Na⁺/K⁺ pompası: 3 Na⁺ dışa, 2 K⁺ içe', ncx: 'NCX: 1 Ca²⁺ dışa, 3 Na⁺ içe'
  },
  en: {
    title: 'Action potentials along the conduction system, ions and the ECG',
    lead: 'Each cell from the SA node to the ventricle on one time axis, lead II below. Play the cursor or drag on the chart; click a cell to see which ions enter and leave its membrane at that moment.',
    cell: 'Cell', tone: 'Autonomic tone', vagal: 'Vagal', sympathetic: 'Sympathetic', neutral: 'Neutral', ivabradine: 'Ivabradine (If block)',
    play: 'Play', pause: 'Pause', speed: 'Speed', time: 'Time in the beat',
    cells: { sa: 'SA node', atrial: 'Atrium', av: 'AV node', purkinje: 'Purkinje', ventricle: 'Ventricle' },
    readouts: { rate: 'Heart rate', rr: 'RR', pr: 'PR', qt: 'QT', rest: 'Rest / MDP', threshold: 'Threshold', peak: 'Peak', dvdt: 'Phase 0 speed (typical)', apd: 'AP duration', cv: 'Conduction (typical)', intrinsic: 'Intrinsic rate' },
    phase: 'Phase', ecg: 'ECG', enters: 'Enters', leaves: 'Leaves', channels: 'Channels',
    outside: 'Outside · Na⁺ 140 · Ca²⁺ 2 · K⁺ 4 mM', inside: 'Inside · Na⁺ 10 · K⁺ 140 mM',
    into: 'in', out: 'out', now: 'Now on the ECG', silent: 'silent on the surface ECG',
    regions: { P: 'P wave', PR: 'PR segment', QRS: 'QRS', ST: 'ST segment', T: 'T wave', TP: 'TP (diastole)' },
    note: 'Schematic teaching model: waveforms and current intensities are drawn from typical published values (Katz; Grant 2009; Mangoni and Nargeot 2008); it is not a solved ionic model. Phase 0 speed and conduction velocity are typical ranges. The ventricular lab below is the quantitative model.',
    pump: 'Na⁺/K⁺ pump: 3 Na⁺ out, 2 K⁺ in', ncx: 'NCX: 1 Ca²⁺ out, 3 Na⁺ in'
  }
};

/** Typical values per cell: phase 0 dV/dt, conduction velocity and intrinsic rate. */
export const CELL_FACTS = {
  sa: { dvdt: '1–10 V/s', cv: '0,02–0,05 m/s', intrinsic: { tr: '60–100/dk', en: '60–100/min' } },
  atrial: { dvdt: '150–300 V/s', cv: '0,5–1 m/s', intrinsic: { tr: 'yok', en: 'none' } },
  av: { dvdt: '5–15 V/s', cv: '0,02–0,05 m/s', intrinsic: { tr: '40–60/dk', en: '40–60/min' } },
  purkinje: { dvdt: '500–800 V/s', cv: '2–4 m/s', intrinsic: { tr: '20–40/dk', en: '20–40/min' } },
  ventricle: { dvdt: '200–300 V/s', cv: '0,3–1 m/s', intrinsic: { tr: 'yok', en: 'none' } }
};

const row = (phase, ecg, enters, leaves, text) => ({ phase, ecg, enters, leaves, text });

/** Phase table per cell, TR and EN. */
export const PHASES = {
  tr: {
    sa: [
      row(4, 'TP ve P öncesi', 'Na⁺ (If, HCN4); geç fazda Ca²⁺ (ICaT); NCX ile 3 Na⁺', 'K⁺ azalır (IK kapanır); vagalde IKACh ile K⁺ artar', 'Diyastolik depolarizasyon: sabit dinlenim yok, MDP −60 mV’dan eşiğe (−40 mV) kendiliğinden yükselir. Eğim hızı belirler: sempatik If ve ICaL’yi artırır, vagal IKACh ile MDP’yi düşürür ve eğimi azaltır.'),
      row(0, 'P’den hemen önce (görünmez)', 'Ca²⁺ (ICaL, Cav1.3/1.2)', '', 'Yavaş çıkış: hızlı Na⁺ kanalları −60 mV’da inaktif olduğundan çıkışı L tipi Ca²⁺ akımı yapar. SA düğüm ateşlemesi küçük kütle nedeniyle yüzey EKG’de görünmez; P dalgası atriyumun aktivasyonudur.'),
      row(3, 'P ve PR', '', 'K⁺ (IKr, IKs)', 'ICaL inaktive olur, K⁺ akımları membranı MDP’ye döndürür. Faz 1 ve 2 yoktur.')
    ],
    atrial: [
      row(0, 'P dalgası', 'Na⁺ (INa, SCN5A)', '', 'Hızlı Na⁺ girişi; aktivasyon atriyumda yayıldıkça P dalgası çizilir.'),
      row(1, 'P', '', 'K⁺ (Ito, IKur)', 'Erken hızlı repolarizasyon; IKur atriyuma özgüdür (AF’de ilaç hedefi).'),
      row(2, 'PR segmenti', 'Ca²⁺ (ICaL)', 'K⁺ (IKur, IKr)', 'Kısa, eğimli plato; atriyal AP ventrikülden kısa ve üçgen biçimlidir.'),
      row(3, 'QRS içinde (Ta dalgası gizli)', '', 'K⁺ (IKr, IKs, IK1)', 'Atriyal repolarizasyon QRS’e denk geldiği için genellikle görülmez.'),
      row(4, 'TP', 'Na⁺/K⁺ pompası ile 2 K⁺', 'K⁺ (IK1; vagalde IKACh); pompa ile 3 Na⁺', 'Sabit dinlenim yaklaşık −80 mV; IK1 korur.')
    ],
    av: [
      row(4, 'TP ve P', 'Na⁺ (If, zayıf)', 'K⁺ azalır', 'Yavaş diyastolik depolarizasyon; kendi hızı 40–60/dk, normalde atriyumdan gelen dalga daha önce yakalar.'),
      row(0, 'PR segmenti (AV gecikmesi)', 'Ca²⁺ (ICaL)', '', 'Çıkışı Ca²⁺ yapar; yavaş çıkış yavaş iletim demektir. PR’nin büyük kısmı bu gecikmedir. Vagal uzatır (AV blok), sempatik kısaltır.'),
      row(3, 'QRS ve ST', '', 'K⁺ (IKr)', 'Repolarizasyondan sonra da refrakter kalır (repolarizasyon sonrası refrakterlik); hızlı atriyal ritimlerde ventrikülü korur.')
    ],
    purkinje: [
      row(4, 'TP', 'Na⁺ (If, zayıf)', 'K⁺ (IK1)', 'Yavaş eğim, kendi hızı 20–40/dk: üst odaklar susarsa kaçış ritmi buradan çıkar (geniş QRS).'),
      row(0, 'QRS’den hemen önce (H-V)', 'Na⁺ (INa, en hızlı)', '', 'En hızlı çıkış ve en hızlı ileti (2–4 m/s): ventrikülü neredeyse aynı anda uyarır, QRS dar kalır. His-Purkinje aktivasyonu yüzey EKG’de görünmez.'),
      row(1, 'QRS başı', '', 'K⁺ (Ito)', 'Belirgin çentik (spike-and-dome).'),
      row(2, 'ST segmenti', 'Ca²⁺ (ICaL), Na⁺ (geç INa)', 'K⁺ (IKr, IKs)', 'En uzun plato: erken atımlara karşı korur; uzun QT’de erken ardıl depolarizasyon (EAD) ve torsades burada başlar.'),
      row(3, 'T sonu (U dalgasıyla ilişkili)', '', 'K⁺ (IKr, IKs, IK1)', 'Ventrikülden daha geç repolarize olur.')
    ],
    ventricle: [
      row(0, 'QRS', 'Na⁺ (INa)', '', 'Hızlı Na⁺ girişi; ventriküler depolarizasyon QRS’i çizer.'),
      row(1, 'J noktası', '', 'K⁺ (Ito)', 'Epikardda daha belirgin çentik; J dalgası ve Brugada ile ilişkili.'),
      row(2, 'ST segmenti', 'Ca²⁺ (ICaL); NCX ile Na⁺', 'K⁺ (IKs, IKr); NCX ile Ca²⁺', 'Plato: tüm hücreler benzer voltajda olduğundan akım farkı yok, ST izoelektrik.'),
      row(3, 'T dalgası', '', 'K⁺ (IKr, IKs, IK1)', 'Epikard endokarddan önce repolarize olur; bu yüzden T, QRS ile aynı yöndedir.'),
      row(4, 'TP', 'Na⁺/K⁺ pompası ile 2 K⁺', 'K⁺ (IK1); pompa ile 3 Na⁺', 'Sabit dinlenim yaklaşık −85 mV; IK1 korur, hiperkalemi bu değeri yükseltir.')
    ]
  },
  en: {
    sa: [
      row(4, 'TP, before the P', 'Na⁺ (If, HCN4); late Ca²⁺ (ICaT); 3 Na⁺ via NCX', 'less K⁺ (IK closing); more K⁺ via IKACh with vagal tone', 'Diastolic depolarization: no stable rest, the membrane drifts from the MDP (−60 mV) to threshold (−40 mV) by itself. The slope sets the rate: sympathetic tone raises If and ICaL, vagal tone lowers the MDP via IKACh and flattens the slope.'),
      row(0, 'just before the P (silent)', 'Ca²⁺ (ICaL, Cav1.3/1.2)', '', 'Slow upstroke: fast Na⁺ channels are inactivated at −60 mV, so the L-type Ca²⁺ current makes the upstroke. The SA node is too small to show on the surface ECG; the P wave is atrial activation.'),
      row(3, 'P and PR', '', 'K⁺ (IKr, IKs)', 'ICaL inactivates and K⁺ currents return the membrane to the MDP. There are no phases 1 and 2.')
    ],
    atrial: [
      row(0, 'P wave', 'Na⁺ (INa, SCN5A)', '', 'Fast Na⁺ entry; the P wave is drawn as activation spreads through the atria.'),
      row(1, 'P', '', 'K⁺ (Ito, IKur)', 'Early fast repolarization; IKur is atrial-specific (a drug target in AF).'),
      row(2, 'PR segment', 'Ca²⁺ (ICaL)', 'K⁺ (IKur, IKr)', 'A short, sloping plateau; the atrial action potential is shorter and more triangular than the ventricular one.'),
      row(3, 'inside the QRS (hidden Ta wave)', '', 'K⁺ (IKr, IKs, IK1)', 'Atrial repolarization coincides with the QRS, so it is usually not seen.'),
      row(4, 'TP', '2 K⁺ via the Na⁺/K⁺ pump', 'K⁺ (IK1; IKACh with vagal tone); 3 Na⁺ via the pump', 'Stable rest about −80 mV, held by IK1.')
    ],
    av: [
      row(4, 'TP and P', 'Na⁺ (If, weak)', 'less K⁺', 'Slow diastolic depolarization; own rate 40–60/min, normally captured earlier by the atrial wave.'),
      row(0, 'PR segment (AV delay)', 'Ca²⁺ (ICaL)', '', 'Ca²⁺ makes the upstroke; a slow upstroke means slow conduction. Most of the PR is this delay. Vagal tone lengthens it (AV block), sympathetic tone shortens it.'),
      row(3, 'QRS and ST', '', 'K⁺ (IKr)', 'Stays refractory beyond repolarization (post-repolarization refractoriness), which protects the ventricles during fast atrial rhythms.')
    ],
    purkinje: [
      row(4, 'TP', 'Na⁺ (If, weak)', 'K⁺ (IK1)', 'A slow slope, own rate 20–40/min: if higher pacemakers fail, the escape rhythm comes from here (wide QRS).'),
      row(0, 'just before the QRS (H-V)', 'Na⁺ (INa, fastest)', '', 'Fastest upstroke and fastest conduction (2–4 m/s): the ventricles are activated almost at once, so the QRS stays narrow. His-Purkinje activation is silent on the surface ECG.'),
      row(1, 'start of the QRS', '', 'K⁺ (Ito)', 'A clear notch (spike and dome).'),
      row(2, 'ST segment', 'Ca²⁺ (ICaL), Na⁺ (late INa)', 'K⁺ (IKr, IKs)', 'The longest plateau: protects against premature beats; in long QT, early afterdepolarizations (EADs) and torsades start here.'),
      row(3, 'end of T (linked to the U wave)', '', 'K⁺ (IKr, IKs, IK1)', 'Repolarizes later than the ventricle.')
    ],
    ventricle: [
      row(0, 'QRS', 'Na⁺ (INa)', '', 'Fast Na⁺ entry; ventricular depolarization draws the QRS.'),
      row(1, 'J point', '', 'K⁺ (Ito)', 'A deeper notch in the epicardium; linked to J waves and Brugada.'),
      row(2, 'ST segment', 'Ca²⁺ (ICaL); Na⁺ via NCX', 'K⁺ (IKs, IKr); Ca²⁺ via NCX', 'Plateau: all cells sit at a similar voltage, so no current flows between them and the ST is isoelectric.'),
      row(3, 'T wave', '', 'K⁺ (IKr, IKs, IK1)', 'The epicardium repolarizes before the endocardium, so the T follows the QRS direction.'),
      row(4, 'TP', '2 K⁺ via the Na⁺/K⁺ pump', 'K⁺ (IK1); 3 Na⁺ via the pump', 'Stable rest about −85 mV, held by IK1; hyperkalemia raises it.')
    ]
  }
};

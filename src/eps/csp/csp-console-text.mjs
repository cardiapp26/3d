/** Texts of the CSP implant console (csp-panel.mjs implant page). Teaching wording; the
 * cut-offs named in the criteria follow the EHRA 2023 / ESC 2025 framing as used in this model. */
export const CONSOLE_TEXT = {
  tr: {
    intro: 'Yeri seç, kılıfı septuma dik getir, tur tur vidala; her adımda canlı kayıttan kanıt topla.',
    stages: ['Hedef', 'Pace map', 'Vidala', 'Doğrula', 'Kabul'],
    patient: {
      baseline: '74 y, tam AV blok, dar QRS kaçış ritmi. LBBAP planlandı.',
      slow: '68 y, uzun PR ve yavaş ileti: süre ölçümleri sınırda kalabilir.',
      equal: '70 y: miyokard ve ileti dokusu eşikleri çakışık; eşik testi geçiş göstermeyebilir.',
      scar: '66 y, septal skar: helix zor ilerler, ileti dokusuna erişim yok.'
    },
    views: { rao: 'RAO 30°', lao: 'LAO 40°', septum: 'Septum kesiti' },
    fluoro: { fromHis: "His'ten", drag: "Ucu His–apeks hattı boyunca sürükle", apex: 'Apeks', angle: 'Septal normale açı', lbb: 'Sol dal' },
    guides: 'His–apeks hattı', target: 'Hedef bölge',
    live: 'Canlı kayıt', freeze: 'Dondur', run: 'Devam', speed: 'Hız', layout: 'Görünüm', layouts: { all: '12 derivasyon + EGM', focus: 'II, III, V1, V6 + EGM' },
    ecgGain: 'EKG ×', egmGain: 'EGM ×', tip: 'Uç EGM', coi: 'Uç (COI)',
    analyser: 'Analizör · unipolar uç', readouts: { output: 'Çıkış', impedance: 'Empedans', coi: 'COI', v6Rwpt: 'Stim–V6RWPT', interpeak: 'V6–V1 interpeak', qrsDuration: 'QRS', turns: 'Tur', depth: 'Derinlik' },
    criteriaTitle: 'Yakalanma kriterleri (EHRA 2023 / ESC 2025)',
    groups: { depth: 'Derinlik (önkoşul)', proof: 'İleti sistemi kanıtı: biri kesin olunca yeterli', support: 'Destekleyici', safety: 'Güvenlik' },
    status: { met: 'kesin', likely: 'olası', not: 'yok', untested: 'bakılmadı' },
    criteria: {
      terminalR: ['V1’de terminal r′ (Qr, rSR′)', 'Derinlik önkoşulu; her turdan sonra bakılır. Tek başına ileti sistemi kanıtı değildir.'],
      v6Rwpt: ['Stim–V6RWPT ≤ 74 ms', 'Dar QRS veya izole RBBB için kesin sınır. 75–85 ms gri bölgedir: destekler, kanıtlamaz.'],
      interpeak: ['V6–V1 interpeak > 44 ms', 'Kesin sınır. 33–44 ms gri bölge. V1’de terminal r′ yoksa ölçülmez.'],
      transition: ['Unipolar geçiş: azalan çıkış veya S1–S2', 'ns-LBBP → s-LBBP (V6RWPT sabit, izoelektrik aralık eklenir) ya da ns-LBBP → LVSP (V6RWPT ≥ 10 ms uzar). Bipolar test sayılmaz.'],
      fixation: ['Vidalamada RBBB paternli fiksasyon atımları', 'Kayıtta görülen atımdan işaretlenir; uç geri çözülünce silinir. Destekleyici bulgu.'],
      safety: ['Empedans ≥ 450 Ω, COI ≥ 3 mV', 'Empedans heliks girdikçe yükselir; perforasyonda 200 Ω’dan fazla düşer ve COI kaybolur.']
    },
    guide: {
      offAnterior: 'Uç septumda değil, RV serbest duvarında: geniş QRS, V1’de çentik yok. LAO’da kılıfı saat yönü tersine çevir.',
      offPosterior: 'Uç septumun arka kenarından kaymış. LAO’da kılıfı saat yönünde çevir.',
      turnCcw: 'Kılıf septuma dik değil. LAO’da saat yönü tersine biraz daha çevir; açı 0’a yaklaşmalı.',
      turnCw: 'Kılıf septuma dik değil. LAO’da saat yönünde biraz çevir; açı 0’a yaklaşmalı.',
      tooHigh: 'Uç His’e çok yakın. RAO’da ucu His–apeks hattı boyunca apekse doğru sürükle.',
      tooLow: 'Uç çok apikal. RAO’da ucu His’e doğru sürükle.',
      paceMapOk: 'Pace map uygun: V1’de W (QRS ortasında çentik), II pozitif, III negatif ya da izoelektrik. Tur atmaya başla.',
      keepTurning: 'Tur at; her turdan sonra V1’e ve empedansa bak. V1’deki çentik QRS sonuna doğru kayar.',
      watchV1: 'Derinleşiyor: çentik QRS sonuna yaklaştı. Tek tur at, sonra kayda bak.',
      lvsp: 'V1’de terminal r′ var: LV septumundasın (LVSP), ileti sistemi kanıtı henüz yok. Tek tur daha dikkatle düşünülebilir.',
      deepNoProof: 'Derin septumdasın ama V1’de terminal r′ yok. Kayda bak; gerekirse yarım tur ilerle.',
      confirmTest: 'Kesin kanıt var. Eşik testi yap: eşiği ölç ve azalan çıkışta geçişi gör.',
      likelyTest: 'Ölçümler gri bölgede, kesin değil. Eşik testi veya S1–S2 ile geçiş ara; yoksa tek tur daha düşünülebilir.',
      acceptable: 'Kanıt kesin, eşik ölçüldü. Lead’i kabul edebilirsin.',
      fixSettings: 'Kanıt kesin ama kabul koşulu eksik: unipolar, eşik ≤ 1,5 V ve çıkış eşiğin en az 2 katı olmalı.',
      impedanceDrop: 'Empedans düşüyor: perforasyona yakınsın. Tur atmayı bırak, gerekirse yarım tur geri çöz.',
      drilling: 'Helix dönüyor ama ilerlemiyor: kılıf açısı çok büyük.',
      perforation: 'Perforasyon: yakalanma kaybı ve ani empedans düşüşü. Geri çöz.',
      accepted: 'Lead kabul edildi. Özet aşağıda.'
    },
    events: {
      case: 'Olgu yüklendi: {name}', rotate: 'Tur ×{n}: derinlik {d} mm', drilling: 'Helix ilerlemiyor (kılıf açısı büyük)',
      perforation: 'Septum aşıldı: empedans düştü, yakalanma kayboldu', withdrawn: 'Uç yeniden septum içinde', unscrew: 'Yarım tur geri: {d} mm',
      reposition: 'Lead geri çekildi; yeni yer seçilebilir', locked: 'Lead vidalı: yer veya kılıf değiştirmek için önce yeniden konumla',
      pacingOn: 'Pacing açık', pacingOff: 'Pacing kapalı', fixation: 'Fiksasyon atımı', fixationRbbb: 'Fiksasyon atımı, V1’de RBBB paterni',
      thresholdStart: 'Eşik testi başladı: her 3 atımda çıkış azalır', transition: 'Eşik testi: {from} → {to} V geçiş, {kind} (ΔV6RWPT {dv6} ms)',
      thresholdDone: 'Eşik testi bitti: eşik {v} V', thresholdNone: 'Eşik testi bitti: 0,1 V’de de yakalanma sürüyor',
      accepted: 'Lead kabul edildi', acceptRefused: 'Kabul edilemez: {reasons}', output: 'Çıkış {v} V'
    },
    kinds: { toSelective: 'nonselektif → selektif', toLvsp: 'nonselektif → LV septal', other: 'morfoloji değişti, kanıt değil' },
    acceptReasons: { depth: 'uç LV septal derinlikte değil ya da septum aşılmış', polarity: 'kayıt unipolar değil', threshold: 'eşik ölçülmedi', thresholdHigh: 'eşik 1,5 V üzerinde', margin: 'çıkış eşiğin 2 katından az', proof: 'kesin ileti sistemi kanıtı yok' },
    log: 'Olay günlüğü',
    controls: {
      lead: 'Lead', rotate: 'Tur ×1', rapid: 'Tur ×3', unscrew: 'Yarım tur geri', reposition: 'Yeniden konumla',
      sheath: 'Kılıf', ccw: '↺ Saat yönü tersi', cw: 'Saat yönü ↻', pacing: 'Pacing', tests: 'Testler', accept: 'Kabul et',
      keys: 'Klavye: R tur, Shift+R üç tur, U geri, ← → kılıf'
    },
    teacher: 'Eğitmen ayarları (doğrudan)', teacherLabels: { level: 'His → apeks (0–1)', angle: 'Septal normale açı (°)', depth: 'Septum kalınlığına göre derinlik', rate: 'Pacing hızı (bpm)' },
    summary: 'Olgu özeti', verdict: { lbbp: 'Sol dal alanı pacing: ileti sistemi kanıtı var', lvsp: 'LV septal pacing: ileti sistemi kanıtı yok', septal: 'Derin septal / RV septal pacing', perforated: 'Perforasyon' },
    summaryRows: { turns: 'Tur', depthMm: 'Derinlik (mm)', threshold: 'Eşik (V)', proof: 'Kesin kanıt kriteri' },
    review: 'Atım incelemesi (seçili test atımı)'
  },
  en: {
    intro: 'Choose the site, bring the sheath perpendicular to the septum, screw in turn by turn; collect evidence from the live recording at every step.',
    stages: ['Target', 'Pace map', 'Screw in', 'Confirm', 'Accept'],
    patient: {
      baseline: '74 y, complete AV block, narrow-QRS escape rhythm. LBBAP planned.',
      slow: '68 y, long PR and slow conduction: the timing criteria may be borderline.',
      equal: '70 y: coincident myocardial and conduction-tissue thresholds; the threshold test may show no transition.',
      scar: '66 y, septal scar: the helix advances poorly and conduction tissue is out of reach.'
    },
    views: { rao: 'RAO 30°', lao: 'LAO 40°', septum: 'Septal section' },
    fluoro: { fromHis: 'from the His', drag: 'Drag the tip along the His–apex line', apex: 'Apex', angle: 'Angle to septal normal', lbb: 'Left bundle' },
    guides: 'His–apex line', target: 'Target zone',
    live: 'Live recording', freeze: 'Freeze', run: 'Run', speed: 'Speed', layout: 'Layout', layouts: { all: '12-lead + EGM', focus: 'II, III, V1, V6 + EGM' },
    ecgGain: 'ECG ×', egmGain: 'EGM ×', tip: 'Tip EGM', coi: 'Tip (COI)',
    analyser: 'Analyser · unipolar tip', readouts: { output: 'Output', impedance: 'Impedance', coi: 'COI', v6Rwpt: 'Stim–V6RWPT', interpeak: 'V6–V1 interpeak', qrsDuration: 'QRS', turns: 'Turns', depth: 'Depth' },
    criteriaTitle: 'Capture criteria (EHRA 2023 / ESC 2025)',
    groups: { depth: 'Depth (prerequisite)', proof: 'Conduction-system proof: any one definitive criterion', support: 'Supportive', safety: 'Safety' },
    status: { met: 'definitive', likely: 'likely', not: 'no', untested: 'not checked' },
    criteria: {
      terminalR: ['Terminal r′ in V1 (Qr, rSR′)', 'Depth prerequisite; check after every turn. Not proof of conduction-system capture on its own.'],
      v6Rwpt: ['Stim–V6RWPT ≤ 74 ms', 'Definitive cut-off for narrow QRS or isolated RBBB. 75–85 ms is a grey band: supportive, not proof.'],
      interpeak: ['V6–V1 interpeak > 44 ms', 'Definitive cut-off. 33–44 ms is a grey band. Not measured without a terminal r′ in V1.'],
      transition: ['Unipolar transition: decremental output or S1–S2', 'ns-LBBP → s-LBBP (V6RWPT unchanged, an isoelectric interval appears) or ns-LBBP → LVSP (V6RWPT prolongs ≥ 10 ms). A bipolar test does not count.'],
      fixation: ['RBBB-pattern fixation beats while screwing', 'Marked from a beat seen in the recording; cleared when the tip is backed out. Supportive.'],
      safety: ['Impedance ≥ 450 Ω, COI ≥ 3 mV', 'Impedance rises as the helix engages; perforation drops it by more than 200 Ω and the COI is lost.']
    },
    guide: {
      offAnterior: 'The tip is on the RV free wall, not the septum: wide QRS, no notch in V1. Torque the sheath counter-clockwise in LAO.',
      offPosterior: 'The tip slipped off the posterior septal edge. Torque the sheath clockwise in LAO.',
      turnCcw: 'The sheath is not perpendicular to the septum. Torque a little more counter-clockwise in LAO; the angle should approach 0.',
      turnCw: 'The sheath is not perpendicular to the septum. Torque a little clockwise in LAO; the angle should approach 0.',
      tooHigh: 'The tip is too close to the His. In RAO drag it along the His–apex line toward the apex.',
      tooLow: 'The tip is too apical. In RAO drag it toward the His.',
      paceMapOk: 'Good pace map: a W in V1 (mid-QRS notch), II positive, III negative or isoelectric. Start rotating.',
      keepTurning: 'Rotate; check V1 and the impedance after every turn. The V1 notch moves toward the end of the QRS.',
      watchV1: 'Getting deep: the notch is near the end of the QRS. One turn, then read the recording.',
      lvsp: 'Terminal r′ in V1: you are in the LV septum (LVSP), no conduction-system proof yet. One more careful turn may be considered.',
      deepNoProof: 'Deep in the septum but no terminal r′ in V1. Read the recording; advance half a turn if needed.',
      confirmTest: 'Definitive proof present. Run a threshold test: measure the threshold and watch the transition on decremental output.',
      likelyTest: 'Timing in the grey band, not definitive. Look for a transition with a threshold test or S1–S2; otherwise one more turn may be considered.',
      acceptable: 'Proof definitive, threshold measured. You can accept the lead.',
      fixSettings: 'Proof definitive but an acceptance condition is missing: unipolar, threshold ≤ 1.5 V and output at least 2× the threshold.',
      impedanceDrop: 'Impedance is falling: you are close to perforation. Stop rotating; unscrew half a turn if needed.',
      drilling: 'The helix spins without advancing: the sheath angle is too large.',
      perforation: 'Perforation: loss of capture and a sudden impedance drop. Unscrew.',
      accepted: 'Lead accepted. Summary below.'
    },
    events: {
      case: 'Case loaded: {name}', rotate: 'Turn ×{n}: depth {d} mm', drilling: 'Helix not advancing (sheath angle too large)',
      perforation: 'Septum crossed: impedance fell, capture lost', withdrawn: 'Tip back inside the septum', unscrew: 'Half turn back: {d} mm',
      reposition: 'Lead withdrawn; a new site can be chosen', locked: 'Lead fixed: reposition before changing the site or the sheath',
      pacingOn: 'Pacing on', pacingOff: 'Pacing off', fixation: 'Fixation beat', fixationRbbb: 'Fixation beat, RBBB pattern in V1',
      thresholdStart: 'Threshold test started: output steps down every 3 beats', transition: 'Threshold test: {from} → {to} V transition, {kind} (ΔV6RWPT {dv6} ms)',
      thresholdDone: 'Threshold test done: threshold {v} V', thresholdNone: 'Threshold test done: still capturing at 0.1 V',
      accepted: 'Lead accepted', acceptRefused: 'Cannot accept: {reasons}', output: 'Output {v} V'
    },
    kinds: { toSelective: 'nonselective → selective', toLvsp: 'nonselective → LV septal', other: 'morphology changed, not proof' },
    acceptReasons: { depth: 'tip not at LV septal depth or septum crossed', polarity: 'recording not unipolar', threshold: 'threshold not measured', thresholdHigh: 'threshold above 1.5 V', margin: 'output below 2× the threshold', proof: 'no definitive conduction-system proof' },
    log: 'Event log',
    controls: {
      lead: 'Lead', rotate: 'Turn ×1', rapid: 'Turn ×3', unscrew: 'Half turn back', reposition: 'Reposition',
      sheath: 'Sheath', ccw: '↺ CCW', cw: 'CW ↻', pacing: 'Pacing', tests: 'Tests', accept: 'Accept',
      keys: 'Keys: R turn, Shift+R three turns, U back, ← → sheath'
    },
    teacher: 'Instructor settings (direct)', teacherLabels: { level: 'His → apex (0–1)', angle: 'Angle to septal normal (°)', depth: 'Depth relative to septal thickness', rate: 'Pacing rate (bpm)' },
    summary: 'Case summary', verdict: { lbbp: 'Left bundle branch area pacing: conduction-system proof present', lvsp: 'LV septal pacing: no conduction-system proof', septal: 'Deep septal / RV septal pacing', perforated: 'Perforation' },
    summaryRows: { turns: 'Turns', depthMm: 'Depth (mm)', threshold: 'Threshold (V)', proof: 'Definitive proof criteria' },
    review: 'Beat review (selected test beat)'
  }
};

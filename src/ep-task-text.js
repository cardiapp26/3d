/*
 * TR/EN text of the narrow QRS tachycardia task (ep-task.js). Source ids
 * refer to research/EP_FAZ_BCD_KAYNAK_STORYBOARD.md (B1-B4) and the EP
 * report list (R4, R9, R10, R12).
 */
export const TASK_TEXT = Object.freeze({
  tr: {
    heading: 'Görev: dar QRS taşikardi',
    intro: 'Olgu gizli. Taşikardi kaydını oku, manevra uygula; her kanıt beş mekanizmaya karşı sınıflanır. Sonra mekanizmayı seç.',
    start: 'Yeni görev', baseline: 'Taşikardi kaydı', task: (n) => `Görev ${n}`,
    mechanisms: { 'avnrt-typical': 'Tipik AVNRT', 'avnrt-atypical': 'Atipik AVNRT', avrt: 'Ortodromik AVRT', pjrt: 'PJRT', 'focal-at': 'Fokal AT' },
    short: { 'avnrt-typical': 'T-AVNRT', 'avnrt-atypical': 'A-AVNRT', avrt: 'AVRT', pjrt: 'PJRT', 'focal-at': 'AT' },
    states: { supports: 'destekler', against: 'aleyhine, dışlamaz', neutral: 'dışlamaz', uninterpretable: 'yorumlanamaz' },
    legend: '↑ destekler · ↓ aleyhine, dışlamaz · – dışlamaz · ? yorumlanamaz',
    kinds: { baseline: 'Taşikardi kaydı', 'his-pvc': 'His-refrakter PVC', 'v-overdrive': 'Ventriküler overdrive', 'para-his': 'Para-Hisian pacing' },
    evidenceHead: 'Kanıt',
    earliest: 'en erken A',
    notes: {
      shortSeptalVa: 'Septal VA 70 ms\'nin altında: ortodromik AVRT aleyhine, tipik AVNRT lehine. Sol yollu AVRT\'de ≤70 ms bildirilmiştir; AT ve nodoventriküler yollar da kısa VA verebilir (B1-B3).',
      septalVaLong: 'Septal VA 70 ms veya daha uzun: tipik AVNRT için alışılmadık (aleyhine, dışlamaz).',
      eccentric: 'En erken A distal veya orta CS\'de (eksantrik): sol serbest duvar yolu lehine. Sol AT ve atipik AVNRT\'nin sol uzantısı da eksantrik olabilir.',
      hraEarliest: 'En erken A HRA\'da: septum ve anulus dışındaki bir odak (fokal AT) lehine; AVNRT ve septal yolun retrograd çıkışıyla uyuşmaz.',
      csOstiumTrap: 'En erken A CS ağzında, VA uzun: PJRT, atipik AVNRT, inferior paraseptal yol ve CS ağzı AT\'si aynı en erken A\'yı verebilir. Bu kayıt ayırmaz; manevra gerekir.',
      septalEarliest: 'En erken A His bölgesinde, septal VA ≥ 70 ms: septal yol, AVNRT ve para-Hisian AT bu kayıtla ayrılmaz; manevra gerekir.',
      overdriveNodal: 'PPI-TCL > 115 ms ve SA-VA > 85 ms: AVNRT lehine. Değerler septal yol karşılaştırmasından gelir; her bölge için kesin eşik değildir (R12).',
      overdrivePathway: 'PPI-TCL ≤ 115 ms ve SA-VA ≤ 85 ms: devre ventriküle yakın, yol aracılı taşikardi (AVRT, PJRT) lehine (R12).',
      overdriveMixed: 'PPI-TCL ve SA-VA farklı yönde: bu manevra iki grubu ayırmadı.'
    },
    answer: 'Mekanizma', submit: 'Yanıtla', choose: 'Seçin',
    grades: {
      correct: 'Doğru.',
      partial: 'Kısmen: PJRT de ortodromik AVRT\'dir; decremental retrograd yol (His-refrakter PVC\'de A\'nın gecikmesi) onu ayırır.',
      incorrect: 'Kayıttaki mekanizma farklı.'
    },
    reveal: (name, mechanism) => `Olgu: ${name} (${mechanism}).`,
    support: (n, m, total) => `Toplanan ${total} kanıttan ${n} tanesi doğru mekanizmayı destekledi, ${m} tanesi aleyhineydi.`,
    noSupport: 'Toplanan kanıt doğru mekanizmayı desteklemedi; ayırmak için başka manevra gerekirdi.',
    title: (n, kind) => `Görev ${n}: ${kind}`,
    limits: 'Sınıflama kaynaklardaki ölçütlerin öğretim uyarlamasıdır, tanı algoritması değildir; tek bir gözlem tanıya çevrilmez. Kaynaklar: research/EP_FAZ_BCD_KAYNAK_STORYBOARD.md.'
  },
  en: {
    heading: 'Task: narrow QRS tachycardia',
    intro: 'The case is hidden. Read the tachycardia recording and deliver maneuvers; each piece of evidence is classified against five mechanisms. Then choose the mechanism.',
    start: 'New task', baseline: 'Tachycardia recording', task: (n) => `Task ${n}`,
    mechanisms: { 'avnrt-typical': 'Typical AVNRT', 'avnrt-atypical': 'Atypical AVNRT', avrt: 'Orthodromic AVRT', pjrt: 'PJRT', 'focal-at': 'Focal AT' },
    short: { 'avnrt-typical': 'T-AVNRT', 'avnrt-atypical': 'A-AVNRT', avrt: 'AVRT', pjrt: 'PJRT', 'focal-at': 'AT' },
    states: { supports: 'supports', against: 'argues against, does not exclude', neutral: 'does not exclude', uninterpretable: 'uninterpretable' },
    legend: '↑ supports · ↓ argues against, does not exclude · – does not exclude · ? uninterpretable',
    kinds: { baseline: 'Tachycardia recording', 'his-pvc': 'His-refractory PVC', 'v-overdrive': 'Ventricular overdrive', 'para-his': 'Para-Hisian pacing' },
    evidenceHead: 'Evidence',
    earliest: 'earliest A',
    notes: {
      shortSeptalVa: 'Septal VA below 70 ms: argues against orthodromic AVRT, favors typical AVNRT. VA of 70 ms or less has been reported in AVRT over a left-sided pathway; AT and nodoventricular pathways can also give a short VA (B1-B3).',
      septalVaLong: 'Septal VA of 70 ms or more: unusual for typical AVNRT (argues against, does not exclude).',
      eccentric: 'Earliest A on the distal or mid CS (eccentric): favors a left free wall pathway. A left AT and the leftward extension of atypical AVNRT can also be eccentric.',
      hraEarliest: 'Earliest A on the HRA: favors a focus away from the septum and annuli (focal AT); it does not fit AVNRT or the retrograde exit of a septal pathway.',
      csOstiumTrap: 'Earliest A at the CS ostium with a long VA: PJRT, atypical AVNRT, an inferior paraseptal pathway and a CS ostium AT can give the same earliest A. This recording does not separate them; a maneuver is needed.',
      septalEarliest: 'Earliest A in the His region with a septal VA of 70 ms or more: a septal pathway, AVNRT and a para-Hisian AT are not separated by this recording; a maneuver is needed.',
      overdriveNodal: 'PPI-TCL above 115 ms and SA-VA above 85 ms: favors AVNRT. The values come from the septal pathway comparison and are not strict cutoffs for every zone (R12).',
      overdrivePathway: 'PPI-TCL of 115 ms or less and SA-VA of 85 ms or less: the circuit is close to the ventricle, favoring a pathway-mediated tachycardia (AVRT, PJRT) (R12).',
      overdriveMixed: 'PPI-TCL and SA-VA point in different directions: this maneuver did not separate the two groups.'
    },
    answer: 'Mechanism', submit: 'Answer', choose: 'Choose',
    grades: {
      correct: 'Correct.',
      partial: 'Partly: PJRT is also an orthodromic AVRT; the decremental retrograde pathway (the A delayed by a His-refractory PVC) sets it apart.',
      incorrect: 'The recorded mechanism is different.'
    },
    reveal: (name, mechanism) => `Case: ${name} (${mechanism}).`,
    support: (n, m, total) => `Of ${total} pieces of evidence, ${n} supported the correct mechanism and ${m} argued against it.`,
    noSupport: 'The evidence gathered did not support the correct mechanism; another maneuver was needed to separate it.',
    title: (n, kind) => `Task ${n}: ${kind}`,
    limits: 'The classification is a teaching adaptation of published criteria, not a diagnostic algorithm; no single observation becomes a diagnosis. Sources: research/EP_FAZ_BCD_KAYNAK_STORYBOARD.md.'
  }
});

// Texts of the SVT algorithm tab (svt-dx-panel.js). Content follows the
// Kardiyopedi SVT lecture series (basic electrophysiology of SVT, the
// excluding and diagnosing EP findings, the diagnostic algorithm); the
// wording and the grouping are this tab's own teaching summary.

export const SVT_DX_TEXT = {
  tr: {
    tab: 'SVT algoritması',
    practice: 'Alıştırma: gizli olguda tanı koy (manevralarla) →',
    heading: 'Dar QRS taşikardi: bulgu aday listesini daraltır',
    intro: 'Bir bulgu seçin: kapıyı kapattığı mekanizmalar elenir, destekledikleri öne çıkar. Seçmediğiniz bulgu hiçbir şeyi değiştirmez.',
    reset: 'Sıfırla',
    candidates: 'Aday mekanizmalar',
    reasons: 'Neden elendi / öne çıktı',
    noReasons: 'Henüz bulgu seçilmedi: yedi mekanizmanın hepsi açık.',
    status: { possible: 'olası', favored: 'öne çıktı', excluded: 'elendi' },
    conflict: 'Seçilen bulgular listedeki her mekanizmayı eliyor: bulgular birbiriyle çelişiyor ya da ritim bu listenin dışında (örneğin nodoventriküler taşikardi).',
    single: (name) => `Tek aday kaldı: ${name}.`,
    steps: { ecg: 'Yüzey EKG', drug: 'Karotis masajı / adenozin', ep: 'EFÇ' },
    because: 'nedeni',
    mechanisms: {
      avnrtTyp: { name: 'Tipik AVNRT', note: 'yavaş-hızlı; kısa RP, VA kısa' },
      avnrtAtyp: { name: 'Atipik AVNRT', note: 'hızlı-yavaş; uzun RP' },
      avrt: { name: 'Ortodromik AVRT', note: 'hızlı retrograd yol; kısa RP, VA uzun' },
      avrtSlow: { name: 'Yavaş retrograd yollu AVRT (PJRT benzeri)', note: 'uzun RP' },
      at: { name: 'Atriyal taşikardi', note: 'odak atriyumda; AV iletiden bağımsız' },
      snrt: { name: 'Sinüs nodu reentran taşikardisi', note: 'P sinüs P\'siyle aynı; hız genelde ~180' },
      flutter: { name: 'Atriyal flutter', note: 'testere dişi dalgalar' }
    },
    groups: {
      av: {
        title: 'P ile QRS arasında birebir ilişki',
        hint: 'AVRT için her atriyal vurunun ventrikülü izlemesi gerekir.',
        options: {
          oneToOne: { label: 'Birebir (1:1)', why: 'Hepsine izin verir.' },
          aMoreV: { label: 'A > V (AV blok, taşikardi sürüyor)', why: 'AVRT olamaz: ventrikül devrenin zorunlu parçasıdır, ventriküle iletilemeyen atriyal vuru devreyi kırar.' },
          vMoreA: { label: 'V > A', why: 'AVRT ve atriyal ritimler olamaz; olağan mekanizma AVNRT\'de üst ortak yol blokudur (seyrek olarak çift antegrat yol ile 1:2 iletim ya da nodoventriküler devreler kalabilir).' }
        }
      },
      pseudo: {
        title: 'Taşikardide pseudo r\' (V1) veya pseudo s (inferior)',
        hint: 'Taşikardi bitince kaybolan, QRS\'in hemen arkasındaki retrograd P.',
        options: {
          present: { label: 'Var', why: 'Retrograd P QRS\'e gömülü: tipik AVNRT lehine.' },
          absent: { label: 'Yok', why: 'Ayırt ettirmez; RP mesafesine bakılır.' }
        }
      },
      rp: {
        title: 'RP ile PR karşılaştırması',
        hint: 'RP > PR uzun RP, RP < PR kısa RP taşikardi.',
        options: {
          short: { label: 'Kısa RP', why: 'Atipik AVNRT ve yavaş retrograd yollu AVRT uzun RP verir, elenir. Kalanlar: tipik AVNRT, AVRT, uzun PR\'li AT, SNRT.' },
          long: { label: 'Uzun RP', why: 'Tipik AVNRT ve hızlı retrograd yollu AVRT kısa RP verir, elenir. Kalanlar: atipik AVNRT, yavaş yollu AVRT, AT, SNRT.' }
        }
      },
      va: {
        title: 'VA aralığı (EFÇ)',
        hint: 'Ventrikülden en erken retrograd atriyal aktivasyona süre; sınır 70 ms.',
        options: {
          lt70: { label: 'VA < 70 ms', why: 'Ventrikül miyokardı ve aksesuar yol üzerinden bu kadar kısa sürede dönüş olmaz: AVRT elenir; uzun VA veren atipik AVNRT de elenir.' },
          gt70: { label: 'VA > 70 ms', why: 'Tipik AVNRT\'nin retrograd hızlı yolu bu kadar yavaş değildir: elenir.' }
        }
      },
      adeno: {
        title: 'Karotis masajı veya adenozin yanıtı',
        hint: 'Geçici AV blok oluşturur; taşikardinin AV noda bağımlı olup olmadığını gösterir.',
        options: {
          terminatesP: { label: 'P dalgasıyla sonlandı', why: 'Atriyal ritimler AV iletinin kesilmesiyle durmaz: AT, SNRT ve flutter elenir.' },
          terminatesQRS: { label: 'QRS ile sonlandı', why: 'Ayrım yaptırmaz: hepsi olabilir.' },
          blockPersists: { label: 'Blok oldu, taşikardi sürdü', why: 'AVRT olamaz. Aradaki dalgalara bakın.' }
        }
      },
      waves: {
        title: 'Blok sırasında görünen atriyal dalgalar',
        hint: 'Yalnızca blok olup taşikardi sürdüğünde sorulur.',
        options: {
          sawtooth: { label: 'Testere dişi dalgalar', why: 'Atriyal flutter tanısı.' },
          isoelectric: { label: 'İzoelektrik hatlı P dalgaları', why: 'Flutter elenir; AT veya SNRT devam eder. AVNRT\'nin 2:1 blokla sürmesi çok seyrektir.' }
        }
      },
      pwave: {
        title: 'P dalgası biçimi (taşikardi yavaşlayınca)',
        hint: 'Hastanın sinüs P\'si bilinmeli.',
        options: {
          negInferior: { label: 'İnferiorda (II, III, aVF) negatif, retrograd', why: 'SNRT elenir. AVNRT, AVRT ya da alt atriyum kökenli AT kalır.' },
          differs: { label: 'Sinüs P\'sinden farklı', why: 'SNRT elenir; retrograd P (AVNRT/AVRT) veya ektopik atriyal odak (AT) kalır.' },
          sinusLike: { label: 'Sinüs P\'siyle aynı, hız genelde ~180', why: 'SNRT düşündürür; retrograd P olsaydı inferiorda negatif olurdu.' }
        }
      },
      activation: {
        title: 'Atriyal aktivasyon yönü (EFÇ)',
        hint: 'AVNRT ve AVRT atriyumu aşağıdan yukarı, retrograd aktive eder.',
        options: {
          superiorInferior: { label: 'Yukarıdan aşağıya', why: 'AVNRT ve AVRT\'de aktivasyon retrograttır (aşağıdan yukarı); bunlar elenir. AT veya SNRT kalır.' }
        }
      },
      aaPr: {
        title: 'AA sabit, RP/PR değişken (EFÇ)',
        hint: 'Atriyal siklus uzunluğu sabit kalırken sürelerin döngüden döngüye değişmesi.',
        options: {
          aaConstRpVariable: { label: 'AA sabit, RP değişken', why: 'Zorunlu VA ilişkisi kalkar: AVNRT ve AVRT elenir. Değişken bloklu AT, flutter veya SNRT kalabilir.' }
        }
      },
      bbb: {
        title: 'Dal bloğunda VA süresi (EFÇ)',
        hint: 'Taşikardi sırasında gelişen dal bloğunda VA ve siklus uzunluğuna bakın.',
        options: {
          vaPlus30: { label: 'VA ≥ 35 ms uzadı', why: 'Blokaj olan tarafta serbest duvar aksesuar yol vardır (Coumel; Kerr eşiği ≥ 35 ms): AVNRT ve atriyal ritimler elenir.' },
          noChange: { label: 'VA değişmedi', why: 'Elemez: AVNRT, septal ya da karşı taraf yolu olabilir.' }
        }
      },
      ending: {
        title: 'Sonlanma biçimi (EFÇ)',
        hint: 'Taşikardi tekrar tekrar nasıl bitiyor?',
        options: {
          nonPrematureA: { label: 'Erken gelmeyen A ile', why: 'Atriyal odak ventriküle iletilememeyle durmaz: AT (ve diğer atriyal ritimler) elenir.' },
          qrs: { label: 'QRS ile', why: 'Ayrım yaptırmaz.' }
        }
      }
    },
    source: 'Derleme: Kardiyopedi SVT ders serisi. Öğretim aracıdır, hasta karar aracı değildir.'
  },
  en: {
    tab: 'SVT algorithm',
    practice: 'Practice: diagnose a hidden case (with maneuvers) →',
    heading: 'Narrow QRS tachycardia: each finding narrows the candidate list',
    intro: 'Pick a finding: the mechanisms it rules out are crossed off and the ones it supports come forward. A finding you do not pick changes nothing.',
    reset: 'Reset',
    candidates: 'Candidate mechanisms',
    reasons: 'Why excluded / favored',
    noReasons: 'No finding picked yet: all seven mechanisms are open.',
    status: { possible: 'possible', favored: 'favored', excluded: 'excluded' },
    conflict: 'The findings picked exclude every mechanism in the list: they contradict each other, or the rhythm is outside this list (for example nodoventricular tachycardia).',
    single: (name) => `One candidate left: ${name}.`,
    steps: { ecg: 'Surface ECG', drug: 'Carotid massage / adenosine', ep: 'EP study' },
    because: 'because',
    mechanisms: {
      avnrtTyp: { name: 'Typical AVNRT', note: 'slow-fast; short RP, short VA' },
      avnrtAtyp: { name: 'Atypical AVNRT', note: 'fast-slow; long RP' },
      avrt: { name: 'Orthodromic AVRT', note: 'fast retrograde pathway; short RP, long VA' },
      avrtSlow: { name: 'AVRT with a slow retrograde pathway (PJRT-like)', note: 'long RP' },
      at: { name: 'Atrial tachycardia', note: 'focus in the atrium; independent of AV conduction' },
      snrt: { name: 'Sinus node reentrant tachycardia', note: 'P wave as the sinus P; rate usually ~180' },
      flutter: { name: 'Atrial flutter', note: 'saw-tooth waves' }
    },
    groups: {
      av: {
        title: 'One-to-one relation between P and QRS',
        hint: 'AVRT needs every atrial beat to be followed by a ventricular one.',
        options: {
          oneToOne: { label: 'One to one (1:1)', why: 'Allows all of them.' },
          aMoreV: { label: 'A > V (AV block, tachycardia goes on)', why: 'Not AVRT: the ventricle is an obligatory part of the circuit; an atrial beat failing to reach the ventricle breaks the circuit.' },
          vMoreA: { label: 'V > A', why: 'Not AVRT and not an atrial rhythm; typical AVNRT mechanism is block in the upper common pathway (rarely dual antegrade with 1:2 conduction or nodoventricular circuits remain).' }
        }
      },
      pseudo: {
        title: 'Pseudo r\' (V1) or pseudo s (inferior) in tachycardia',
        hint: 'A retrograde P just behind the QRS that disappears when the tachycardia ends.',
        options: {
          present: { label: 'Present', why: 'Retrograde P buried in the QRS: favors typical AVNRT.' },
          absent: { label: 'Absent', why: 'Does not separate; look at the RP interval.' }
        }
      },
      rp: {
        title: 'RP against PR',
        hint: 'RP > PR is long RP, RP < PR is short RP tachycardia.',
        options: {
          short: { label: 'Short RP', why: 'Atypical AVNRT and AVRT with a slow retrograde pathway give a long RP, so they go. Left: typical AVNRT, AVRT, AT with a long PR, SNRT.' },
          long: { label: 'Long RP', why: 'Typical AVNRT and AVRT with a fast retrograde pathway give a short RP, so they go. Left: atypical AVNRT, slow-pathway AVRT, AT, SNRT.' }
        }
      },
      va: {
        title: 'VA interval (EP study)',
        hint: 'From the ventricle to the earliest retrograde atrial activation; cut-off 70 ms.',
        options: {
          lt70: { label: 'VA < 70 ms', why: 'Ventricular muscle plus an accessory pathway cannot return that fast: AVRT goes; atypical AVNRT, with its long VA, goes too.' },
          gt70: { label: 'VA > 70 ms', why: 'The fast retrograde limb of typical AVNRT is not that slow: it goes.' }
        }
      },
      adeno: {
        title: 'Response to carotid massage or adenosine',
        hint: 'A transient AV block shows whether the tachycardia depends on the AV node.',
        options: {
          terminatesP: { label: 'Ended with a P wave', why: 'Atrial rhythms do not stop when AV conduction fails: AT, SNRT and flutter go.' },
          terminatesQRS: { label: 'Ended with a QRS', why: 'Does not separate: any of them.' },
          blockPersists: { label: 'Block, tachycardia continues', why: 'Not AVRT. Look at the waves in between.' }
        }
      },
      waves: {
        title: 'Atrial waves seen during the block',
        hint: 'Asked only when the block occurred and the tachycardia continued.',
        options: {
          sawtooth: { label: 'Saw-tooth waves', why: 'Atrial flutter.' },
          isoelectric: { label: 'P waves with an isoelectric baseline', why: 'Not flutter; AT or SNRT goes on. AVNRT carrying on with 2:1 block is very rare.' }
        }
      },
      pwave: {
        title: 'P wave shape (once the tachycardia is slowed)',
        hint: 'The sinus P of the patient has to be known.',
        options: {
          negInferior: { label: 'Negative in the inferior leads (II, III, aVF), retrograde', why: 'SNRT goes. AVNRT, AVRT or low atrial AT remain.' },
          differs: { label: 'Different from the sinus P', why: 'SNRT goes; could be retrograde P (AVNRT/AVRT) or an ectopic atrial focus (AT).' },
          sinusLike: { label: 'Same as the sinus P, rate usually ~180', why: 'Suggests SNRT; a retrograde P would be negative inferiorly.' }
        }
      },
      activation: {
        title: 'Direction of atrial activation (EP study)',
        hint: 'AVNRT and AVRT activate the atrium retrogradely, from below upward.',
        options: {
          superiorInferior: { label: 'From above downward', why: 'Atrial activation is retrograde in AVNRT and AVRT, so they are excluded; AT or SNRT remain.' }
        }
      },
      aaPr: {
        title: 'AA constant, RP/PR variable (EP study)',
        hint: 'The atrial cycle length holds while the intervals change from cycle to cycle.',
        options: {
          aaConstRpVariable: { label: 'AA constant, RP variable', why: 'Fixed VA relationship is absent: AVNRT and AVRT are excluded. AT, flutter with variable block, or SNRT remain.' }
        }
      },
      bbb: {
        title: 'VA during bundle branch block (EP study)',
        hint: 'Watch VA and the cycle length when a bundle branch block appears in tachycardia.',
        options: {
          vaPlus30: { label: 'VA lengthens by ≥ 35 ms with BBB', why: 'A free-wall accessory pathway on the blocked side (Coumel; Kerr threshold ≥ 35 ms): AVNRT and atrial rhythms go.' },
          noChange: { label: 'VA unchanged', why: 'Excludes nothing: AVNRT, a septal or a contralateral pathway.' }
        }
      },
      ending: {
        title: 'How it ends (EP study)',
        hint: 'How does the tachycardia end again and again?',
        options: {
          nonPrematureA: { label: 'With a non-premature A', why: 'An atrial focus does not stop when conduction to the ventricle fails: AT (and other atrial rhythms) go.' },
          qrs: { label: 'With a QRS', why: 'Does not separate.' }
        }
      }
    },
    source: 'Compiled from the Kardiyopedi SVT lecture series. A teaching tool, not a patient decision aid.'
  }
};

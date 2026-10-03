// Texts of the live EP laboratory (ep-live-panel.js): substrate names,
// expert hints with an induction protocol, RF targets and lesion results,
// and the diagnosis quiz. Teaching wording on designed model values.

// CS sequence of a retrograde echo A (ep-live-maneuvers.js csSequence).
const ECHO_SEQUENCE = {
  tr: { concentric: 'CS proksimalden distale, konsantrik', eccentric: 'eksantrik' },
  en: { concentric: 'CS proximal to distal, concentric', eccentric: 'eccentric' }
};

export const LIVE_TEXT = {
  tr: {
    caseLabel: 'Substrat', hidden: '? Gizli olgu', surprise: 'Gizli olgu', diagnose: 'Tanı koy', hints: 'İpuçları',
    question: 'Bu kayıtta substrat / mekanizma nedir?', correct: 'Doğru.', wrong: (name) => `Yanlış. Doğru yanıt: ${name}.`,
    run: 'Dondur', resume: 'Devam', speed: 'Tarama', review: 'Geri sar', calipers: 'Kaliper', waves: 'Dalga adları', ladder: 'Ladder diyagram', ladderLocked: 'Gizli olguda tanı verilince gösterilir (mekanizmayı açık eder).', ladderLabel: 'Ladder diyagram: atriyum, AV düğüm ve ventrikül aktivasyonu ile iletim yolları',
    stim: 'Stimülatör', site: 'Uyarı yeri', s1: 'S1 (ms)', n: 'S1 sayısı', pace: 'Uyar (S1 + ekstra)', burst: 'Burst (yalnız S1)',
    pacePause: 'Uyar ve dondur', stop: 'Uyarıyı durdur', shock: 'Kardiyoversiyon',
    sites: { hra: 'HRA', 'cs-prox': 'CS proksimal', 'cs-dist': 'CS distal', rv: 'RV apeks' },
    ablation: 'Ablasyon', target: 'Kateter ucu', rfOn: 'RF başlat', rfOff: 'RF durdur',
    rfRunning: (name) => `RF uygulanıyor: ${name}. Lezyon yaklaşık 4 s sürekli RF ile tamamlanır.`,
    targets: {
      'slow-pathway': 'Yavaş yol (CS ağzı önü)', 'compact-node': 'Kompakt AV düğüm / His', 'left-lateral': 'Sol lateral mitral anulus',
      posteroseptal: 'Posteroseptal (CS ağzı çevresi)', cti: 'Kavotriküspit istmus', 'la-focus': 'Sol atriyal odak (sol üst PV)', 'vt-isthmus': 'VT istmusu (LV skar sınırı)'
    },
    effects: {
      sp: 'Lezyon: yavaş yol ablate edildi.', 'av-block': 'Lezyon: tam AV blok. Ventriküler kaçış ritmi.', ap: 'Lezyon: aksesuar yol ablate edildi.',
      cti: 'Lezyon: CTI bloğu oluştu.', focus: 'Lezyon: odak ablate edildi.', isthmus: 'Lezyon: VT istmusu ablate edildi.', none: 'Lezyon: bu bölgede hedef doku yok; etki olmadı.'
    },
    intervals: 'Son atım', none: 'yok', frozen: 'Donduruldu: geri sarmak için kaydırın; ölçüm için Kaliper.',
    hint: 'Uyarı dizisi şimdiden 300 ms sonra başlar. Ekstrastimulus 0 ise kullanılmaz.',
    rate: 'Oynatma hızı',
    maneuvers: 'Manevralar', hisPvc: 'His-refrakter PVC', vOverdrive: 'V overdrive (TCL − 30)', aOverdrive: 'Atriyal overdrive (TCL − 20)',
    needTachy: 'Önce bir taşikardi başlatın: TCL ölçülemedi.', maneuverRunning: 'Manevra uygulanıyor; sonuç birkaç atım sonra.',
    pvc: {
      advanced: (d) => `His-refrakter PVC: atriyum ${-d} ms erken geldi. His refrakterken atriyum ilerledi: aksesuar yol var ve retrograd iletiyor (AVNRT dışlanır).`,
      delayed: (d) => `His-refrakter PVC: atriyum ${d} ms geç geldi. Dekremental aksesuar yol ile uyumlu (PJRT tipi).`,
      unchanged: () => 'His-refrakter PVC: atriyal zamanlama değişmedi. Aksesuar yol kanıtı yok (AVNRT veya AT ile uyumlu; yol tek başına dışlanmaz).',
      'terminated-no-a': () => 'His-refrakter PVC: taşikardi atriyuma ulaşmadan sonlandı. Aksesuar yol devrenin parçası (AVRT).'
    },
    overdrive: (r) => `TCL ${r.tcl} · pacing ${r.pacedCl} · PPI ${r.ppi ?? 'yok'} · PPI−TCL ${r.ppiTcl ?? 'yok'}${r.saVa != null ? ` · SA−VA ${r.saVa}` : ''}${r.response ? ` · yanıt ${r.response === 'VAAV' ? 'V-A-A-V' : 'V-A-V'}` : ''}`,
    verdict: {
      avnrt: 'PPI−TCL > 115 ve SA−VA > 85 ms: AVNRT ile uyumlu.', avrt: 'PPI−TCL ≤ 115 ve SA−VA ≤ 85 ms: AVRT (ortodromik) ile uyumlu.',
      at: 'V-A-A-V yanıtı: atriyal taşikardi ile uyumlu.', indeterminate: 'Ölçütler çelişkili: tek başına karar verdirmez.',
      notEntrained: 'Atriyum pacing siklusuna yakalanmadı (VA blok veya dissosiyasyon): yanıt yorumlanamaz.',
      terminated: 'Taşikardi pacing ile sonlandı: yanıt yorumlanamaz.', notCaptured: 'Uyarılar yakalamadı.',
      inCircuit: 'PPI−TCL ≤ 30 ms: pacing yeri devrenin içinde.', outside: 'PPI−TCL > 30 ms: pacing yeri devrenin dışında.'
    },
    protocols: 'Protokoller', protocolStart: 'Protokolü başlat', protocolStop: 'Protokolü durdur',
    protocolKinds: { avbcl: 'İnkremental atriyal pacing (560 ms\'den 10\'ar ms, AV blok siklusu)', erp: 'Programlı atriyal ekstrastimulus (ERP)', snrt: 'Sinüs düğümü toparlanma zamanı (SNRT)' },
    rowAvbcl: (r) => `S1 ${r.cl}: ${r.block ? 'blok (Wenckebach)' : `1:1, AH ${r.ah}, PR ${r.pr}${r.prOverPp ? ' > PP' : ''}`}`,
    rowErp: (r) => `S2 ${r.s2}: ${!r.capture ? 'atriyal yakalama yok' : r.ah == null ? 'AV nodal blok' : `AH ${r.ah}`}${r.echo ? `, echo${r.echoSequence ? ` (${ECHO_SEQUENCE.tr[r.echoSequence]})` : ''}` : ''}${r.sustained ? ', taşikardi' : ''}`,
    rowSnrt: (r) => `Son uyarıdan ilk sinüs atımına: ${r.snrt ?? 'yok'} ms`,
    sumAvbcl: (x) => [
      x.avbcl ? `AV blok siklusu (Wenckebach): ${x.avbcl} ms.` : 'Denenen aralıkta AV blok yok.',
      x.jump ? `AH sıçraması ${x.jump} ms'de (10 ms kısalmada ≥ 50 ms).` : '',
      !x.prOverPp ? `PR hiçbir adımda PP'yi aşmadı (en uzun AH ${x.maxAh} ms).`
        : x.jump ? `PR, PP'yi ${x.prOverPp} ms'de aştı (AH ${x.prAh} ms): uyarı yavaş yoldan iniyor; dual AV düğüm fizyolojisini destekler.`
          : `PR, PP'yi ${x.prOverPp} ms'de aştı (AH ${x.prAh} ms) ama AH sıçraması yok: hızlı yolun dekremental uzaması da olabilir; tek başına dual yol kanıtı değil.`
    ].filter(Boolean).join(' '),
    sumErp: (x) => `AERP ${x.aerp ?? '< 200'} ms · AV nodal ERP ${x.avnErp ?? 'ölçülmedi'} ms${x.jump ? ` · AH sıçraması S2 ${x.jump}` : ''}${x.echo ? ` · echo S2 ${x.echo}${x.echoSequence ? ` (${ECHO_SEQUENCE.tr[x.echoSequence]})` : ''}` : ''}${x.induced ? ` · taşikardi S2 ${x.induced} (protokol durdu)` : ''}`,
    sumSnrt: (x) => `SNRT ${x.snrt ?? 'yok'} ms · düzeltilmiş SNRT ${x.csnrt ?? 'yok'} ms: ${x.abnormal ? 'uzun (> 550 ms), sinüs düğümü disfonksiyonu ile uyumlu' : 'normal (≤ 550 ms)'}.`,
    protocolRunning: 'Protokol sürüyor; oynatma hızını artırabilirsiniz.',
    delivered: (txt) => `Verildi: ${txt}`, shocked: 'Senkronize DC şok verildi.', stopped: 'Uyarı durduruldu.'
  },
  en: {
    caseLabel: 'Substrate', hidden: '? Hidden case', surprise: 'Hidden case', diagnose: 'Diagnose', hints: 'Hints',
    question: 'What is the substrate / mechanism of this recording?', correct: 'Correct.', wrong: (name) => `Incorrect. The answer: ${name}.`,
    run: 'Freeze', resume: 'Run', speed: 'Sweep', review: 'Review', calipers: 'Calipers', waves: 'Wave names', ladder: 'Ladder diagram', ladderLocked: 'Shown once the hidden case is answered (it names the mechanism).', ladderLabel: 'Ladder diagram: atrial, AV nodal and ventricular activation and the conduction routes',
    stim: 'Stimulator', site: 'Pacing site', s1: 'S1 (ms)', n: 'S1 count', pace: 'Pace (S1 + extras)', burst: 'Burst (S1 only)',
    pacePause: 'Pace and freeze', stop: 'Stop pacing', shock: 'Cardiovert',
    sites: { hra: 'HRA', 'cs-prox': 'CS proximal', 'cs-dist': 'CS distal', rv: 'RV apex' },
    ablation: 'Ablation', target: 'Catheter tip', rfOn: 'Start RF', rfOff: 'Stop RF',
    rfRunning: (name) => `RF on: ${name}. A lesion needs about 4 s of continuous RF.`,
    targets: {
      'slow-pathway': 'Slow pathway (anterior to the CS ostium)', 'compact-node': 'Compact AV node / His', 'left-lateral': 'Left lateral mitral annulus',
      posteroseptal: 'Posteroseptal (around the CS ostium)', cti: 'Cavotricuspid isthmus', 'la-focus': 'Left atrial focus (left superior PV)', 'vt-isthmus': 'VT isthmus (LV scar border)'
    },
    effects: {
      sp: 'Lesion: slow pathway ablated.', 'av-block': 'Lesion: complete AV block. Ventricular escape rhythm.', ap: 'Lesion: accessory pathway ablated.',
      cti: 'Lesion: CTI block.', focus: 'Lesion: focus ablated.', isthmus: 'Lesion: VT isthmus ablated.', none: 'Lesion: no target tissue here; no effect.'
    },
    intervals: 'Last beat', none: 'n/a', frozen: 'Frozen: scroll back with the slider; measure with Calipers.',
    hint: 'A train starts 300 ms from now. An extrastimulus of 0 is off.',
    rate: 'Playback',
    maneuvers: 'Maneuvers', hisPvc: 'His-refractory PVC', vOverdrive: 'V overdrive (TCL − 30)', aOverdrive: 'Atrial overdrive (TCL − 20)',
    needTachy: 'Induce a tachycardia first: no TCL to measure.', maneuverRunning: 'Maneuver running; result after a few beats.',
    pvc: {
      advanced: (d) => `His-refractory PVC: atrium ${-d} ms early. The atrium advanced with the His refractory: an accessory pathway conducts retrogradely (excludes AVNRT).`,
      delayed: (d) => `His-refractory PVC: atrium ${d} ms late. Consistent with a decremental accessory pathway (PJRT type).`,
      unchanged: () => 'His-refractory PVC: atrial timing unchanged. No evidence of an accessory pathway (consistent with AVNRT or AT; does not exclude a pathway by itself).',
      'terminated-no-a': () => 'His-refractory PVC: the tachycardia ended without reaching the atrium. The accessory pathway is part of the circuit (AVRT).'
    },
    overdrive: (r) => `TCL ${r.tcl} · pacing ${r.pacedCl} · PPI ${r.ppi ?? 'n/a'} · PPI−TCL ${r.ppiTcl ?? 'n/a'}${r.saVa != null ? ` · SA−VA ${r.saVa}` : ''}${r.response ? ` · response ${r.response === 'VAAV' ? 'V-A-A-V' : 'V-A-V'}` : ''}`,
    verdict: {
      avnrt: 'PPI−TCL > 115 and SA−VA > 85 ms: consistent with AVNRT.', avrt: 'PPI−TCL ≤ 115 and SA−VA ≤ 85 ms: consistent with (orthodromic) AVRT.',
      at: 'V-A-A-V response: consistent with atrial tachycardia.', indeterminate: 'Criteria disagree: no decision on their own.',
      notEntrained: 'The atrium did not follow the pacing cycle (VA block or dissociation): response not interpretable.',
      terminated: 'Pacing ended the tachycardia: response not interpretable.', notCaptured: 'The stimuli did not capture.',
      inCircuit: 'PPI−TCL ≤ 30 ms: the pacing site is in the circuit.', outside: 'PPI−TCL > 30 ms: the pacing site is outside the circuit.'
    },
    protocols: 'Protocols', protocolStart: 'Start protocol', protocolStop: 'Stop protocol',
    protocolKinds: { avbcl: 'Incremental atrial pacing (from 560 ms in 10 ms steps, AV block cycle length)', erp: 'Programmed atrial extrastimuli (ERP)', snrt: 'Sinus node recovery time (SNRT)' },
    rowAvbcl: (r) => `S1 ${r.cl}: ${r.block ? 'block (Wenckebach)' : `1:1, AH ${r.ah}, PR ${r.pr}${r.prOverPp ? ' > PP' : ''}`}`,
    rowErp: (r) => `S2 ${r.s2}: ${!r.capture ? 'no atrial capture' : r.ah == null ? 'AV nodal block' : `AH ${r.ah}`}${r.echo ? `, echo${r.echoSequence ? ` (${ECHO_SEQUENCE.en[r.echoSequence]})` : ''}` : ''}${r.sustained ? ', tachycardia' : ''}`,
    rowSnrt: (r) => `Last stimulus to the first sinus beat: ${r.snrt ?? 'n/a'} ms`,
    sumAvbcl: (x) => [
      x.avbcl ? `AV block cycle length (Wenckebach): ${x.avbcl} ms.` : 'No AV block in the tested range.',
      x.jump ? `AH jump at ${x.jump} ms (≥ 50 ms for a 10 ms shorter cycle).` : '',
      !x.prOverPp ? `The PR never exceeded the PP (longest AH ${x.maxAh} ms).`
        : x.jump ? `The PR exceeded the PP at ${x.prOverPp} ms (AH ${x.prAh} ms): conduction goes down the slow pathway; supports dual AV nodal physiology.`
          : `The PR exceeded the PP at ${x.prOverPp} ms (AH ${x.prAh} ms) without an AH jump: decremental fast-pathway delay is also possible; not proof of dual pathways on its own.`
    ].filter(Boolean).join(' '),
    sumErp: (x) => `AERP ${x.aerp ?? '< 200'} ms · AV nodal ERP ${x.avnErp ?? 'not reached'} ms${x.jump ? ` · AH jump at S2 ${x.jump}` : ''}${x.echo ? ` · echo at S2 ${x.echo}${x.echoSequence ? ` (${ECHO_SEQUENCE.en[x.echoSequence]})` : ''}` : ''}${x.induced ? ` · tachycardia at S2 ${x.induced} (protocol stopped)` : ''}`,
    sumSnrt: (x) => `SNRT ${x.snrt ?? 'n/a'} ms · corrected SNRT ${x.csnrt ?? 'n/a'} ms: ${x.abnormal ? 'prolonged (> 550 ms), consistent with sinus node dysfunction' : 'normal (≤ 550 ms)'}.`,
    protocolRunning: 'Protocol running; you can raise the playback speed.',
    delivered: (txt) => `Delivered: ${txt}`, shocked: 'Synchronized DC shock delivered.', stopped: 'Pacing stopped.'
  }
};

/** Substrate names (also the quiz choices) and hints, per case id. */
export const LIVE_CASE_TEXT = {
  normal: {
    tr: { name: 'Normal iletim', hints: ['AH 55–125, HV 35–55 ms; PP = RR, 1:1 AV iletim.', 'Atriyal ekstrastimulusta AH sıçraması yok; hiçbir protokol taşikardi başlatmaz.', 'RV pacingde retrograd A konsantrik: AV düğüm üzerinden.'] },
    en: { name: 'Normal conduction', hints: ['AH 55–125, HV 35–55 ms; PP = RR, 1:1 AV conduction.', 'No AH jump with atrial extrastimuli; no protocol induces a tachycardia.', 'With RV pacing the retrograde A is concentric: over the AV node.'] }
  },
  'avnrt-typical': {
    tr: { name: 'Tipik AVNRT (yavaş-hızlı)', hints: ['HRA S1 600 + S2, 10\'ar ms kısaltın: hızlı yol ERP\'sinde (S2 ~370 ms) AH en az 50 ms sıçrar.', 'İnkremental pacing protokolünde (560 ms\'den 10\'ar ms): ~370 ms\'de AH sıçrar, ~350 ms\'den itibaren PR > PP (uyarı yavaş yoldan iner).', 'Sıçramadan sonra tipik AVNRT: VA ≤ 70 ms (burada ~30); A ve V neredeyse eşzamanlı.', 'Retrograd aktivasyon konsantrik: His\'te A en erken, CS proksimalden distale.', 'Ablasyon: yavaş yol (CS ağzının önü); RF sırasında kavşak atımları beklenen bir işarettir.', 'Kompakt düğüm / His bölgesinde RF tam AV bloğa yol açar.', 'Manevralar: His-refrakter PVC etkisiz; V overdrive sonrası V-A-V, PPI−TCL > 115, SA−VA > 85 ms.'] },
    en: { name: 'Typical AVNRT (slow-fast)', hints: ['HRA S1 600 + S2, shorten by 10 ms: at the fast-pathway ERP (S2 ~370 ms) the AH jumps by at least 50 ms.', 'With the incremental pacing protocol (from 560 ms in 10 ms steps): the AH jumps at ~370 ms and from ~350 ms the PR exceeds the PP (conduction down the slow pathway).', 'After the jump, typical AVNRT: VA ≤ 70 ms (here ~30); A and V almost simultaneous.', 'Concentric retrograde activation: earliest A at the His, CS proximal to distal.', 'Ablation: slow pathway (anterior to the CS ostium); junctional beats during RF are an expected sign.', 'RF at the compact node / His causes complete AV block.', 'Maneuvers: His-refractory PVC has no effect; after V overdrive V-A-V, PPI−TCL > 115, SA−VA > 85 ms.'] }
  },
  'avnrt-atypical': {
    tr: { name: 'Atipik AVNRT (hızlı-yavaş)', hints: ['RV pacing ile başlar: retrograd iletim yavaş yoldan, VA uzun (~270 ms).', 'Uzun RP taşikardi; en erken A CS ağzında ama dizilim konsantrik.', 'PJRT\'den ayırım: His-refrakter PVC atriyumu değiştirmez; V overdrive sonrası V-A-V, PPI−TCL > 115 ve SA−VA > 85 ms (VA pacing siklusundan uzun olsa da yalancı V-A-A-V\'ye dikkat).', 'Ablasyon hedefi tipik AVNRT\'deki gibi yavaş yol bölgesidir.'] },
    en: { name: 'Atypical AVNRT (fast-slow)', hints: ['Induced by RV pacing: retrograde conduction over the slow pathway, long VA (~270 ms).', 'Long RP tachycardia; earliest A at the CS ostium but the sequence is concentric.', 'Versus PJRT: a His-refractory PVC leaves the atrium unchanged; after V overdrive V-A-V, PPI−TCL > 115 and SA−VA > 85 ms (beware of a pseudo-V-A-A-V when the VA exceeds the pacing cycle).', 'The ablation target is the slow-pathway region, as in typical AVNRT.'] }
  },
  'ort-left': {
    tr: { name: 'ORT, gizli sol lateral aksesuar yol', hints: ['Sinüste preeksitasyon yok (gizli yol); VA yalnız taşikardide görünür.', 'RV S2 ~250 ya da atriyal S2 ~260 ile ORT başlar.', 'Retrograd aktivasyon eksantrik: CS distal en erken, sonra proksimal ve His.', 'VA ≥ 70 ms (burada ~130): tipik AVNRT\'den uzun.', 'Ablasyon: sol lateral mitral anulus, en erken retrograd A.', 'Manevralar: His-refrakter PVC atriyumu öne çeker; V overdrive sonrası V-A-V, PPI−TCL ≤ 115, SA−VA ≤ 85 ms.'] },
    en: { name: 'ORT, concealed left lateral accessory pathway', hints: ['No pre-excitation in sinus rhythm (concealed pathway); a VA appears only in tachycardia.', 'RV S2 ~250 or atrial S2 ~260 induces ORT.', 'Eccentric retrograde activation: distal CS first, then proximal and the His.', 'VA ≥ 70 ms (here ~130): longer than in typical AVNRT.', 'Ablation: left lateral mitral annulus, at the earliest retrograde A.', 'Maneuvers: a His-refractory PVC advances the atrium; after V overdrive V-A-V, PPI−TCL ≤ 115, SA−VA ≤ 85 ms.'] }
  },
  pjrt: {
    tr: { name: 'PJRT (dekremental posteroseptal yol)', hints: ['Yavaş ve dekremental ileten posteroseptal aksesuar yol: VA uzun (~210 ms), uzun RP.', 'En erken A CS ağzında; atriyal veya ventriküler S2 ile kolayca başlar.', 'Klinikte sıklıkla sürekli (incessant) seyreder; taşikardiye bağlı kardiyomiyopati yapabilir.', 'Ablasyon: posteroseptal bölge (CS ağzı çevresi).'] },
    en: { name: 'PJRT (decremental posteroseptal pathway)', hints: ['A slowly and decrementally conducting posteroseptal pathway: long VA (~210 ms), long RP.', 'Earliest A at the CS ostium; atrial or ventricular S2 induces it easily.', 'Clinically often incessant; it can cause tachycardia-induced cardiomyopathy.', 'Ablation: posteroseptal region (around the CS ostium).'] }
  },
  'wpw-left': {
    tr: { name: 'WPW, manifest sol lateral yol (preeksite AF)', hints: ['Sinüste kısa HV (~14 ms) ve delta dalgası: manifest preeksitasyon.', 'Hızlı atriyal pacing (≤ 250 ms) AF başlatır: düzensiz, geniş QRS\'li preeksite AF.', 'En kısa preeksite RR < 250 ms yüksek risk göstergesidir.', 'AV nodal blokörler kontrendike; kardiyoversiyon ya da aksesuar yol ablasyonu.', 'Yol ablasyonundan sonra AF dar QRS ile sürer; kardiyoversiyon sinüse döndürür.'] },
    en: { name: 'WPW, manifest left lateral pathway (pre-excited AF)', hints: ['Short HV (~14 ms) and a delta wave in sinus rhythm: manifest pre-excitation.', 'Rapid atrial pacing (≤ 250 ms) starts AF: irregular, wide pre-excited AF.', 'A shortest pre-excited RR < 250 ms marks high risk.', 'AV nodal blockers are contraindicated; cardioversion or pathway ablation.', 'After pathway ablation AF continues with narrow QRS; cardioversion restores sinus rhythm.'] }
  },
  'at-focal': {
    tr: { name: 'Fokal atriyal taşikardi (sol atriyum)', hints: ['HRA burst ≤ 330 ms sonrasında odak ateşlenir: AT siklusu ~380 ms.', 'Eksantrik atriyal aktivasyon: CS distal erken, HRA geç (sol atriyal odak).', 'AV düğüm devrede değil: VA değişken. V overdrive atriyumu yakaladıktan sonra durdurulunca V-A-A-V yanıtı.', 'Otomatik odak kardiyoversiyonla sonlanmaz, şoktan sonra yeniden ateşler; odak ablasyonu gerekir.'] },
    en: { name: 'Focal atrial tachycardia (left atrium)', hints: ['After an HRA burst ≤ 330 ms the focus fires: AT cycle ~380 ms.', 'Eccentric atrial activation: distal CS early, HRA late (left atrial focus).', 'The AV node is not in the circuit: variable VA. V overdrive, stopped once the atrium is entrained, gives a V-A-A-V response.', 'An automatic focus is not ended by cardioversion and fires again after the shock; focus ablation is needed.'] }
  },
  'flutter-cti': {
    tr: { name: 'Tipik (CTI bağımlı) atriyal flutter', hints: ['Hızlı atriyal pacing (≤ 260 ms) tipik flutter başlatır: atriyal siklus 240 ms.', '2:1 AV iletim: ventrikül siklusu 480 ms; DII\'de negatif testere dişi F dalgaları.', 'Septum ve CS proksimalden distale önce, yüksek lateral RA siklusun ortasında (saat yönünün tersi).', 'CTI ablasyonu flutterı sonlandırır ve yeniden başlatılamaz kılar.', 'Atriyal overdrive (entrainment): CS proksimal ve lateral RA\'da PPI−TCL ≤ 30 ms (devre içi), CS distalde > 100 ms (devre dışı).'] },
    en: { name: 'Typical (CTI-dependent) atrial flutter', hints: ['Rapid atrial pacing (≤ 260 ms) induces typical flutter: atrial cycle 240 ms.', '2:1 AV conduction: ventricular cycle 480 ms; negative saw-tooth F waves in II.', 'Septum and CS proximal to distal first, the high lateral RA mid-cycle (counterclockwise).', 'CTI ablation ends the flutter and makes it non-inducible.', 'Atrial overdrive (entrainment): PPI−TCL ≤ 30 ms at the proximal CS and lateral RA (in the circuit), > 100 ms at the distal CS (outside).'] }
  },
  'sinus-node-disease': {
    tr: { name: 'Sinüs düğümü disfonksiyonu', hints: ['Sinüs hızı yavaş (siklus 1000 ms); AV iletim normal.', 'SNRT protokolü: HRA 600 ms × 30 sonrası ilk sinüs atımı geç gelir.', 'Düzeltilmiş SNRT (SNRT − sinüs siklusu) > 550 ms anormaldir; burada belirgin uzun.', 'Hiçbir protokol taşikardi başlatmaz.'] },
    en: { name: 'Sinus node dysfunction', hints: ['Slow sinus rate (cycle 1000 ms); normal AV conduction.', 'SNRT protocol: after HRA 600 ms × 30 the first sinus beat comes late.', 'A corrected SNRT (SNRT − sinus cycle) > 550 ms is abnormal; here clearly prolonged.', 'No protocol induces a tachycardia.'] }
  },
  'vt-scar': {
    tr: { name: 'Skar ilişkili monomorfik VT', hints: ['RV S1 + S2 + S3 (≤ 300 ms) ile başlar: geniş QRS, siklus ~380 ms.', 'AV dissosiyasyon: sinüs A\'ları VT\'den bağımsız; arada dar capture atımları.', 'His V\'den sonra (retrograd) ya da hiç görülmez.', 'Kardiyoversiyon sonlandırır; ablasyon hedefi skar istmusudur.', 'RV apeksten entrainment: PPI−TCL > 30 ms (devre dışı). TCL − 80 ms ile hızlı pacing (ATP) VT\'yi sonlandırabilir.'] },
    en: { name: 'Scar-related monomorphic VT', hints: ['RV S1 + S2 + S3 (≤ 300 ms) induces it: wide QRS, cycle ~380 ms.', 'AV dissociation: sinus A waves independent of the VT; occasional narrow capture beats.', 'The His appears after the V (retrograde) or not at all.', 'Cardioversion ends it; the ablation target is the scar isthmus.', 'Entrainment from the RV apex: PPI−TCL > 30 ms (outside the circuit). Fast pacing at TCL − 80 ms (ATP) can end the VT.'] }
  }
};

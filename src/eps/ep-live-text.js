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
    run: 'Dondur', resume: 'Devam', speed: 'Tarama', review: 'Geri sar', calipers: 'Kaliper', waves: 'Dalga adları', ladder: 'Ladder diyagram', links: 'Kanalda ladder', linksTitle: 'Her aktivasyonun HRA, His, CS ve RV sinyallerini birleştirir; iletim çizgileri gizli olguda tanı verilince gösterilir.', ladderLocked: 'Gizli olguda tanı verilince gösterilir (mekanizmayı açık eder).', ladderLabel: 'Ladder diyagram: atriyum, AV düğüm ve ventrikül aktivasyonu ile iletim yolları',
    stim: 'Stimülatör', site: 'Uyarı yeri', s1: 'S1 (ms)', n: 'S1 sayısı', pace: 'Uyar (S1 + ekstra)', burst: 'Burst (yalnız S1)',
    pacePause: 'Uyar ve dondur', stop: 'Uyarıyı durdur', shock: 'Kardiyoversiyon',
    sites: { hra: 'HRA', 'cs-prox': 'CS 9-10 (proksimal)', 'cs-78': 'CS 7-8', 'cs-56': 'CS 5-6', 'cs-34': 'CS 3-4', 'cs-dist': 'CS 1-2 (distal)', cti: 'CTI (ABL d)', rv: 'RV apeks' },
    step: 'Dekrement (ms)', limit: 'Alt sınır (ms)', rest: 'Dinlenme (s)', hr: 'Hız', perMin: 'dk',
    drugTitle: 'İlaçlar ve eğitmen', drugs: { iso: 'İzoproterenol', atropine: 'Atropin' }, coachEmpty: 'Bir dekrement protokolü çalıştırın ya da ilaç verin; bulgu ve sonraki adım burada yazılır.',
    caliperRead: (c) => (c.a == null ? 'Kaliper: ilk çizgi için şeride tıklayın.' : c.b == null ? 'Kaliper: ikinci çizgi için tıklayın.'
      : `Kaliper: ${Math.abs(c.b - c.a)} ms${c.b !== c.a ? ` · ${Math.round(60000 / Math.abs(c.b - c.a))} /dk` : ''} (yeni ölçüm için tekrar tıklayın)`),
    coach: {
      syncS1: (n) => `İlk dizi yakalamadı: S1 ${n.s1} ms sinüs siklusuna (${n.sinusCl} ms) çok yakın. S1'i sinüs siklusunun en az 40 ms altına indirin.`,
      induced: (n) => `${n.label} ${n.coupling} ms ile taşikardi başladı. VA aralığı ve CS dizilimine bakın; His-refrakter PVC ve V overdrive ile mekanizmayı ayırın.`,
      inducedOnDrug: (n) => `İlaç altında ${n.label} ${n.coupling} ms ile taşikardi başladı: bazalde indüklenmeyen substrat ilaçla ortaya çıktı. Ablasyon sonrası da ilaç altında indüksiyon denenmeli.`,
      echoOnly: (n) => `${n.label} ${n.coupling} ms'de echo var ama taşikardi sürmedi: retrograd hızlı yol ikinci dönüşte refrakter. ${n.drug ? `${{ iso: 'İzoproterenol', atropine: 'Atropin' }[n.drug]} ile dekrementi tekrarlayın (S1 sinüs siklusunun altında, ör. 500).` : 'İki ilaç da verildi: S3 ekleyin ya da S1 400 deneyin.'}`,
      jumpOnly: (n) => `${n.label} ${n.coupling} ms'de AH sıçraması: ikili AV nodal fizyoloji. Echo yok: retrograd hızlı yol zayıf. ${n.drug ? `${{ iso: 'İzoproterenol', atropine: 'Atropin' }[n.drug]} ile tekrarlayın (S1 sinüs siklusunun altında).` : 'S3 ekleyin ya da S1 400 deneyin.'}`,
      noDual: () => 'Sıçrama ve echo yok: bu protokolde ikili AV nodal fizyoloji görülmedi. Farklı S1 (ör. 400) ya da S3 deneyin; klinik şüphe sürüyorsa izoproterenol.',
      noVa: (n) => `RV uyarıda retrograd A yok (VA blok): AVNRT ve ortodromik AVRT olasılığı azalır, dışlanmaz.${n.drug ? ` ${{ iso: 'İzoproterenol', atropine: 'Atropin' }[n.drug]} altında tekrar test edin (S1 sinüs siklusunun altında, ör. 500).` : ''}`,
      vaNodal: (n) => `Retrograd A konsantrik ve His en erken: AV düğüm üzerinden.${n.vaBlock != null ? ` VA blok S2 ${n.vaBlock} ms.` : ''}`,
      vaEccentric: () => 'Retrograd A eksantrik, CS distal en erken: sol lateral aksesuar yol lehine. His-refrakter PVC ile doğrulayın.',
      vaSeptalAp: () => 'Retrograd A en erken CS ağzında: posteroseptal aksesuar yol ya da yavaş yol. His-refrakter PVC ile ayırın.',
      drugOn: (n) => `${{ iso: 'İzoproterenol', atropine: 'Atropin' }[n.drug]} başladı, sinüs siklusu ${n.sinusCl} ms. ${n.drug === 'iso' ? 'Atriyum, AV düğüm (antegrad ve retrograd), His-Purkinje, ventrikül ve aksesuar yol refrakterliği kısaldı.' : 'Vagal tonus kalktı: sinüs düğümü ve AV düğüm iletimi kolaylaştı.'} Uyarıyı S1 sinüs siklusunun altında tekrarlayın.`,
      drugOff: (n) => `${{ iso: 'İzoproterenol', atropine: 'Atropin' }[n.drug]} kesildi, sinüs siklusu ${n.sinusCl} ms.`
    },
    gain: 'Kazanç', gainAll: 'Tüm kanallar', gainDown: 'Kazancı azalt', gainUp: 'Kazancı artır', gainHint: 'Kanal adına tıklayınca kazanç o kanala geçer.',
    pageFirst: 'En eski sayfa', pagePrev: 'Önceki sayfa', pageNext: 'Sonraki sayfa', pageLast: 'Şimdiki sayfa',
    pageAt: (s) => (s ? `${s.toFixed(1)} s geride` : 'şimdi'),
    amp: (ch, v) => (v >= 5 ? `${ch} tepe-tepe ≥ 5 mV (satürasyon)` : `${ch} tepe-tepe ${v.toFixed(2)} mV`),
    progStart: 'Otomatik dekrement', progStop: 'Dekrementi durdur', contStart: 'Sürekli pacing', contStop: 'Sürekli pacingi durdur',
    needExtra: 'Otomatik dekrement için S2 gerekir (S2 > 0).',
    progRunning: 'Programlı uyarı sürüyor: her dizide son ekstrastimulus bir adım kısalır; yakalama kaybı, taşikardi ya da alt sınırda durur.',
    contOn: (site, cl) => `Sürekli pacing: ${site}, ${cl} ms (${Math.round(60000 / cl)}/dk). S1 değişince bir sonraki uyarıdan geçerli; durdurana kadar sürer.`,
    progRow: (r) => `${r.label} ${r.coupling}: ${!r.capture ? (r.sustained ? 'yakalama yok (taşikardi sürüyor)' : 'yakalama yok (refrakter)')
      : r.ventricular ? (r.va == null ? 'VA blok' : `VA ${r.va}${r.jump ? ' (retrograd sıçrama)' : ''}`)
        : r.ah == null ? 'AV nodal blok' : `A-H ${r.ah}${r.jump ? ' (sıçrama)' : ''}`}${r.echo ? ', echo' : ''}${r.sustained ? ', taşikardi başladı' : ''}`,
    progSum: (x) => [
      // A refractory period not reached is named only when the run went down to the lower limit.
      x.erp != null || x.reason === 'limit' ? `${x.ventricular ? 'VERP' : 'AERP'} ${x.erp ?? 'ulaşılmadı'}` : '',
      x.ventricular ? (x.vaBlock != null ? `VA blok ${x.vaBlock}` : '') : x.nodeErp != null || x.reason === 'limit' ? `AV nodal ERP ${x.nodeErp ?? 'ulaşılmadı'}` : '',
      x.jump ? `sıçrama ${x.label} ${x.jump}` : '', x.echo ? `echo ${x.label} ${x.echo}` : '', x.induced ? `taşikardi ${x.label} ${x.induced}` : ''
    ].filter(Boolean).join(' · ') + `. ${{ induced: 'Taşikardi başladığı için durdu.', erp: 'Refrakter periyoda ulaşıldı.', limit: 'Alt sınıra ulaşıldı.', stopped: 'Durduruldu.' }[x.reason] || ''}`,
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
    hint: 'Uyarı dizisi şimdiden 300 ms sonra başlar. Ekstrastimulus 0 ise kullanılmaz. Otomatik dekrement son ekstrastimulusu her dizide kısaltır; dizi son spontan atıma senkron başlar.',
    rate: 'Oynatma hızı',
    maneuvers: 'Manevralar', hisPvc: 'His-refrakter PVC', vOverdrive: 'V overdrive (TCL − 30)', aOverdrive: 'Atriyal overdrive (TCL − 20)',
    needTachy: 'Önce bir taşikardi başlatın: TCL ölçülemedi.', maneuverRunning: 'Manevra uygulanıyor; sonuç birkaç atım sonra.',
    pvc: {
      advanced: (d) => `His-refrakter PVC: atriyum ${-d} ms erken geldi. His refrakterken atriyum ilerledi: aksesuar yol var ve retrograd iletiyor (AVNRT dışlanır).`,
      delayed: (d) => `His-refrakter PVC: atriyum ${d} ms geç geldi. Dekremental aksesuar yol ile uyumlu (PJRT tipi).`,
      unchanged: () => 'His-refrakter PVC: atriyal zamanlama değişmedi. Aksesuar yol kanıtı yok (AVNRT veya AT ile uyumlu; yol tek başına dışlanmaz).',
      'terminated-no-a': () => 'His-refrakter PVC: taşikardi atriyuma ulaşmadan sonlandı. Aksesuar yol devrenin parçası (AVRT).'
    },
    overdrive: (r) => `TCL ${r.tcl} · pacing ${r.pacedCl} · PPI ${r.ppi ?? 'yok'} · PPI−TCL ${r.ppiTcl ?? 'yok'}${r.cppiTcl != null ? ` · AH(SVT) ${r.ahTachy} · AH(return) ${r.ahReturn} · cPPI−TCL ${r.cppiTcl} ms` : ''}${r.saVa != null ? ` · SA−VA ${r.saVa}` : ''}${r.deltaHa != null ? ` · ΔHA ${r.deltaHa > 0 ? `+${r.deltaHa}` : r.deltaHa} ms` : ''}${r.response ? ` · yanıt ${r.response === 'VAAV' ? 'V-A-A-V' : 'V-A-V'}` : ''}`,
    vaLink: (v) => `VA(SVT) ${v.vaTachy} · VA(dönüş) ${v.vaReturn} · ΔVA ${v.deltaVa} ms`,
    verdict: {
      avnrt: 'Uzun dönüş aralığı AVNRT lehine olabilir; sol serbest duvar veya yavaş aksesuar yol dışlanmaz. cPPI düzeltmesi ilk dönüş AH ile taşikardi AH farkını çıkarır (110 ms çalışma eşiği).', avrt: 'Kısa dönüş ölçütleri veya cPPI−TCL <110 ms ortodromik AVRT lehine; tek manevra kesin tanı değildir.',
      at: 'V-A-A-V yanıtı: atriyal taşikardi ile uyumlu.', indeterminate: 'Ölçütler çelişkili: tek başına karar verdirmez.',
      notEntrained: 'Atriyum pacing siklusuna yakalanmadı (VA blok veya dissosiyasyon): yanıt yorumlanamaz.',
      terminated: 'Taşikardi pacing ile sonlandı: yanıt yorumlanamaz.', notCaptured: 'Uyarılar yakalamadı.',
      inCircuit: 'PPI−TCL ≤ 30 ms: pacing yeri devrenin içinde.', outside: 'PPI−TCL > 30 ms: pacing yeri devrenin dışında.',
      vaLinked: 'ΔVA < 10 ms (VA bağlı): AVNRT veya ORT lehine (AT\'de ilk dönüş VA pacing yerine göre değişir).',
      vaUnlinked: 'ΔVA ≥ 10 ms (VA bağımsız): atriyal taşikardi lehine (retrograd VA sabit bir iletim yoluna bağlı değil).'
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
    delivered: (txt) => `Verildi: ${txt}`, shocked: 'Senkronize DC şok verildi.', stopped: 'Uyarı durduruldu.', stoppedRhythm: (bpm) => `Uyarı durdu ama ritim sürüyor (~${bpm}/dk): pacing ile başlayan taşikardi kendi kendine devam eder. Sonlandırmak için hızlı pacing (burst, ATP) ya da kardiyoversiyon uygulayın.`,
    circuitBtn: 'Halka (LAO)', circuitHint: 'Sağ atriyumu LAO açısından, triküspit halkaya karşıdan gösterir: flutter devresi ve DII aynı renklerle.',
    circuit: {
      title: 'Sağ atriyum, LAO: triküspit halka',
      note: 'Şematik LAO görünümü. Dalga cephesinin zamanı His ve HRA elektrogramlarından okunur; F dalgasının her parçası cephenin o an bulunduğu bölümün rengindedir. CS sol atriyumu kaydeder.',
      aria: 'Sağ atriyumun LAO şeması: triküspit halka çevresinde dalga cephesi',
      traceAria: 'DII derivasyonu: F dalgası, flutter devresinin bölümlerine göre renkli',
      traceLabel: 'DII · F dalgası renkli',
      segments: { septum: 'Septum: aşağıdan yukarı (CS ağzından His\'e)', roof: 'Üst ön duvar: SVC\'nin önünden geçiş', lateral: 'Lateral duvar: yukarıdan aşağı', cti: 'CTI: yavaş iletim (istmus)' },
      segmentsCw: { septum: 'Septum: yukarıdan aşağı (His\'ten CS ağzına)', roof: 'Üst ön duvar: SVC\'nin önünden geçiş', lateral: 'Lateral duvar: aşağıdan yukarı', cti: 'CTI: septumdan laterale, yavaş iletim' },
      blockCheck: (x) => `Blok kontrolü, ${x.siteName}: ${x.site === 'cti' ? 'CS ağzı' : 'ABL d (lateral)'} ${x.interval} ms${x.hraFirst ? ', HRA önce' : ''} → ${x.block ? 'istmus bloklu (bu yönde); öbür yönü de deneyin.' : 'istmus iletiyor.'}`,
      front: (seg) => `Dalga cephesi: ${seg}`,
      noReentry: (origin) => (origin ? `Makro-reentri yok · son atriyal aktivasyon: ${origin}` : 'Makro-reentri yok'),
      origins: { circuit: 'flutter devresi', sinus: 'sinüs düğümü', hra: 'HRA pacing', cti: 'CTI pacing (ABL d)', cs: 'CS (pacing ya da sol atriyum)', septal: 'septum (retrograd)', left: 'sol atriyum', af: 'AF (düzensiz dalgacıklar)', other: 'başka bir odak' },
      replay: 'Son 2 döngüyü yavaş oynat', replayStop: 'Durdur',
      entraining: (site, pcl) => `Entrainment, ${site}${pcl ? `, PCL ${pcl} ms` : ''}: ortodromik cephe (renkli) devreyi sürer, antidromik cephe (beyaz) önündeki dalgayla çarpışır.`,
      entrainResult: (x) => `${x.siteName}: PPI ${x.ppi} ms, PPI−TCL ${x.ppiTcl} ms → ${x.verdict === 'inCircuit' ? 'devre içi' : 'devre dışı'}${{
        concealed: '; gizli füzyon: F dalgası ve iç aktivasyon sırası flutter ile aynı (korunan istmus).',
        manifest: '; manifest füzyon: pacing sırasında yüzey dalgası değişir (antidromik cephe devreden taşar).',
        none: '; dalga devreye CS ağzından girer ve aynı yoldan döner.'
      }[x.fusion] ?? '.'}`,
      labels: { ta: 'TA', svc: 'SVC', ivc: 'IVC', kt: 'KT', es: 'ÖS', cs: 'CS', his: 'His', hra: 'HRA', abl: 'ABL', lesion: 'Hat', septal: 'Septal', lateral: 'Lateral', lao: 'LAO' }
    },
  },
  en: {
    caseLabel: 'Substrate', hidden: '? Hidden case', surprise: 'Hidden case', diagnose: 'Diagnose', hints: 'Hints',
    question: 'What is the substrate / mechanism of this recording?', correct: 'Correct.', wrong: (name) => `Incorrect. The answer: ${name}.`,
    run: 'Freeze', resume: 'Run', speed: 'Sweep', review: 'Review', calipers: 'Calipers', waves: 'Wave names', ladder: 'Ladder diagram', links: 'Ladder on channels', linksTitle: 'Joins the HRA, His, CS and RV signals of each activation; the conduction lines show once the hidden case is answered.', ladderLocked: 'Shown once the hidden case is answered (it names the mechanism).', ladderLabel: 'Ladder diagram: atrial, AV nodal and ventricular activation and the conduction routes',
    stim: 'Stimulator', site: 'Pacing site', s1: 'S1 (ms)', n: 'S1 count', pace: 'Pace (S1 + extras)', burst: 'Burst (S1 only)',
    pacePause: 'Pace and freeze', stop: 'Stop pacing', shock: 'Cardiovert',
    sites: { hra: 'HRA', 'cs-prox': 'CS 9-10 (proximal)', 'cs-78': 'CS 7-8', 'cs-56': 'CS 5-6', 'cs-34': 'CS 3-4', 'cs-dist': 'CS 1-2 (distal)', cti: 'CTI (ABL d)', rv: 'RV apex' },
    step: 'Decrement (ms)', limit: 'Lower limit (ms)', rest: 'Rest (s)', hr: 'Rate', perMin: 'min',
    drugTitle: 'Drugs and coach', drugs: { iso: 'Isoproterenol', atropine: 'Atropine' }, coachEmpty: 'Run a decremental protocol or give a drug; the finding and the next step appear here.',
    caliperRead: (c) => (c.a == null ? 'Calipers: click the strip for the first line.' : c.b == null ? 'Calipers: click for the second line.'
      : `Calipers: ${Math.abs(c.b - c.a)} ms${c.b !== c.a ? ` · ${Math.round(60000 / Math.abs(c.b - c.a))} bpm` : ''} (click again to measure anew)`),
    coach: {
      syncS1: (n) => `The first drive did not capture: S1 ${n.s1} ms is too close to the sinus cycle (${n.sinusCl} ms). Pace at least 40 ms below the sinus cycle.`,
      induced: (n) => `${n.label} ${n.coupling} ms induced a tachycardia. Read the VA interval and the CS sequence; separate the mechanisms with a His-refractory PVC and V overdrive.`,
      inducedOnDrug: (n) => `On the drug, ${n.label} ${n.coupling} ms induced a tachycardia: a substrate not inducible at baseline came out. After ablation, test inducibility on the drug too.`,
      echoOnly: (n) => `An echo at ${n.label} ${n.coupling} ms but no sustained tachycardia: the retrograde fast pathway is refractory on the second turn. ${n.drug ? `Repeat the decrement on ${{ iso: 'isoproterenol', atropine: 'atropine' }[n.drug]} (S1 below the sinus cycle, e.g. 500).` : 'Both drugs given: add S3 or try S1 400.'}`,
      jumpOnly: (n) => `AH jump at ${n.label} ${n.coupling} ms: dual AV nodal physiology. No echo: a weak retrograde fast pathway. ${n.drug ? `Repeat on ${{ iso: 'isoproterenol', atropine: 'atropine' }[n.drug]} (S1 below the sinus cycle).` : 'Add S3 or try S1 400.'}`,
      noDual: () => 'No jump and no echo: this protocol shows no dual AV nodal physiology. Try another S1 (e.g. 400) or S3; if clinical suspicion remains, isoproterenol.',
      noVa: (n) => `No retrograde A with RV pacing (VA block): AVNRT and orthodromic AVRT become less likely, not excluded.${n.drug ? ` Test again on ${{ iso: 'isoproterenol', atropine: 'atropine' }[n.drug]} (S1 below the sinus cycle, e.g. 500).` : ''}`,
      vaNodal: (n) => `Concentric retrograde A with the His earliest: over the AV node.${n.vaBlock != null ? ` VA block at S2 ${n.vaBlock} ms.` : ''}`,
      vaEccentric: () => 'Eccentric retrograde A, distal CS earliest: favours a left lateral accessory pathway. Confirm with a His-refractory PVC.',
      vaSeptalAp: () => 'Earliest retrograde A at the CS ostium: a posteroseptal accessory pathway or the slow pathway. Separate them with a His-refractory PVC.',
      drugOn: (n) => `${{ iso: 'Isoproterenol', atropine: 'Atropine' }[n.drug]} started, sinus cycle ${n.sinusCl} ms. ${n.drug === 'iso' ? 'Atrial, AV nodal (antegrade and retrograde), His-Purkinje, ventricular and accessory pathway refractoriness shortened.' : 'Vagal tone removed: easier sinus node and AV nodal conduction.'} Pace again with S1 below the sinus cycle.`,
      drugOff: (n) => `${{ iso: 'Isoproterenol', atropine: 'Atropine' }[n.drug]} stopped, sinus cycle ${n.sinusCl} ms.`
    },
    gain: 'Gain', gainAll: 'All channels', gainDown: 'Lower gain', gainUp: 'Raise gain', gainHint: 'Click a channel name to adjust its gain.',
    pageFirst: 'Oldest page', pagePrev: 'Previous page', pageNext: 'Next page', pageLast: 'Current page',
    pageAt: (s) => (s ? `${s.toFixed(1)} s back` : 'now'),
    amp: (ch, v) => (v >= 5 ? `${ch} peak-to-peak ≥ 5 mV (saturated)` : `${ch} peak-to-peak ${v.toFixed(2)} mV`),
    progStart: 'Auto decrement', progStop: 'Stop decrement', contStart: 'Continuous pacing', contStop: 'Stop continuous pacing',
    needExtra: 'Auto decrement needs an S2 (S2 > 0).',
    progRunning: 'Programmed stimulation running: the last extrastimulus shortens one step per drive; it stops at loss of capture, a tachycardia or the lower limit.',
    contOn: (site, cl) => `Continuous pacing: ${site}, ${cl} ms (${Math.round(60000 / cl)}/min). A new S1 applies from the next stimulus; it runs until stopped.`,
    progRow: (r) => `${r.label} ${r.coupling}: ${!r.capture ? (r.sustained ? 'no capture (tachycardia running)' : 'no capture (refractory)')
      : r.ventricular ? (r.va == null ? 'VA block' : `VA ${r.va}${r.jump ? ' (retrograde jump)' : ''}`)
        : r.ah == null ? 'AV nodal block' : `A-H ${r.ah}${r.jump ? ' (jump)' : ''}`}${r.echo ? ', echo' : ''}${r.sustained ? ', tachycardia started' : ''}`,
    progSum: (x) => [
      x.erp != null || x.reason === 'limit' ? `${x.ventricular ? 'VERP' : 'AERP'} ${x.erp ?? 'not reached'}` : '',
      x.ventricular ? (x.vaBlock != null ? `VA block ${x.vaBlock}` : '') : x.nodeErp != null || x.reason === 'limit' ? `AV nodal ERP ${x.nodeErp ?? 'not reached'}` : '',
      x.jump ? `jump ${x.label} ${x.jump}` : '', x.echo ? `echo ${x.label} ${x.echo}` : '', x.induced ? `tachycardia ${x.label} ${x.induced}` : ''
    ].filter(Boolean).join(' · ') + `. ${{ induced: 'Stopped: a tachycardia started.', erp: 'Refractory period reached.', limit: 'Lower limit reached.', stopped: 'Stopped.' }[x.reason] || ''}`,
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
    hint: 'A train starts 300 ms from now. An extrastimulus of 0 is off. Auto decrement shortens the last extrastimulus each drive; each drive starts in step with the last spontaneous beat.',
    rate: 'Playback',
    maneuvers: 'Maneuvers', hisPvc: 'His-refractory PVC', vOverdrive: 'V overdrive (TCL − 30)', aOverdrive: 'Atrial overdrive (TCL − 20)',
    needTachy: 'Induce a tachycardia first: no TCL to measure.', maneuverRunning: 'Maneuver running; result after a few beats.',
    pvc: {
      advanced: (d) => `His-refractory PVC: atrium ${-d} ms early. The atrium advanced with the His refractory: an accessory pathway conducts retrogradely (excludes AVNRT).`,
      delayed: (d) => `His-refractory PVC: atrium ${d} ms late. Consistent with a decremental accessory pathway (PJRT type).`,
      unchanged: () => 'His-refractory PVC: atrial timing unchanged. No evidence of an accessory pathway (consistent with AVNRT or AT; does not exclude a pathway by itself).',
      'terminated-no-a': () => 'His-refractory PVC: the tachycardia ended without reaching the atrium. The accessory pathway is part of the circuit (AVRT).'
    },
    overdrive: (r) => `TCL ${r.tcl} · pacing ${r.pacedCl} · PPI ${r.ppi ?? 'n/a'} · PPI−TCL ${r.ppiTcl ?? 'n/a'}${r.cppiTcl != null ? ` · AH(SVT) ${r.ahTachy} · AH(return) ${r.ahReturn} · cPPI−TCL ${r.cppiTcl} ms` : ''}${r.saVa != null ? ` · SA−VA ${r.saVa}` : ''}${r.deltaHa != null ? ` · ΔHA ${r.deltaHa > 0 ? `+${r.deltaHa}` : r.deltaHa} ms` : ''}${r.response ? ` · response ${r.response === 'VAAV' ? 'V-A-A-V' : 'V-A-V'}` : ''}`,
    vaLink: (v) => `VA(SVT) ${v.vaTachy} · VA(return) ${v.vaReturn} · ΔVA ${v.deltaVa} ms`,
    verdict: {
      avnrt: 'A long return interval can favor AVNRT; left free-wall or slow accessory pathways are not excluded. cPPI subtracts first-return AH minus tachycardia AH (110 ms study threshold).', avrt: 'Short return criteria or cPPI−TCL <110 ms favor orthodromic AVRT; one maneuver is not diagnostic.',
      at: 'V-A-A-V response: consistent with atrial tachycardia.', indeterminate: 'Criteria disagree: no decision on their own.',
      notEntrained: 'The atrium did not follow the pacing cycle (VA block or dissociation): response not interpretable.',
      terminated: 'Pacing ended the tachycardia: response not interpretable.', notCaptured: 'The stimuli did not capture.',
      inCircuit: 'PPI−TCL ≤ 30 ms: the pacing site is in the circuit.', outside: 'PPI−TCL > 30 ms: the pacing site is outside the circuit.',
      vaLinked: 'ΔVA < 10 ms (VA linked): favors AVNRT or ORT (in AT the first return VA varies with the pacing site).',
      vaUnlinked: 'ΔVA ≥ 10 ms (VA unlinked): favors atrial tachycardia (the return VA is not fixed to a retrograde pathway).'
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
    delivered: (txt) => `Delivered: ${txt}`, shocked: 'Synchronized DC shock delivered.', stopped: 'Pacing stopped.', stoppedRhythm: (bpm) => `Pacing stopped but the rhythm continues (~${bpm}/min): a tachycardia started by pacing runs on by itself. Terminate it with rapid pacing (burst, ATP) or cardioversion.`,
    circuitBtn: 'Ring (LAO)', circuitHint: 'Shows the right atrium in LAO, en face on the tricuspid annulus: the flutter circuit and lead II in the same colours.',
    circuit: {
      title: 'Right atrium, LAO: tricuspid annulus',
      note: 'Schematic LAO view. The front is timed from the His and HRA electrograms; each part of the F wave takes the colour of the limb the front is in at that moment. The CS records the left atrium.',
      aria: 'LAO diagram of the right atrium: the wavefront around the tricuspid annulus',
      traceAria: 'Lead II: the F wave coloured by the limbs of the flutter circuit',
      traceLabel: 'II · F wave coloured',
      segments: { septum: 'Septum: caudocranial (CS ostium to His)', roof: 'Anterior roof: across in front of the SVC', lateral: 'Lateral wall: craniocaudal', cti: 'CTI: slow conduction (isthmus)' },
      segmentsCw: { septum: 'Septum: craniocaudal (His to CS ostium)', roof: 'Anterior roof: across in front of the SVC', lateral: 'Lateral wall: caudocranial', cti: 'CTI: septal to lateral, slow conduction' },
      blockCheck: (x) => `Block check, ${x.siteName}: ${x.site === 'cti' ? 'CS ostium' : 'ABL d (lateral)'} ${x.interval} ms${x.hraFirst ? ', high RA first' : ''} → ${x.block ? 'isthmus blocked (this direction); pace the other side too.' : 'the isthmus conducts.'}`,
      front: (seg) => `Wavefront: ${seg}`,
      noReentry: (origin) => (origin ? `No macro-reentry · latest atrial activation: ${origin}` : 'No macro-reentry'),
      origins: { circuit: 'the flutter circuit', sinus: 'sinus node', hra: 'HRA pacing', cti: 'CTI pacing (ABL d)', cs: 'CS (pacing or left atrium)', septal: 'septum (retrograde)', left: 'left atrium', af: 'AF (disorganized wavelets)', other: 'another focus' },
      replay: 'Replay the last 2 cycles slowly', replayStop: 'Stop',
      entraining: (site, pcl) => `Entrainment, ${site}${pcl ? `, PCL ${pcl} ms` : ''}: the orthodromic front (coloured) drives the circuit, the antidromic one (white) collides with the wave ahead of it.`,
      entrainResult: (x) => `${x.siteName}: PPI ${x.ppi} ms, PPI−TCL ${x.ppiTcl} ms → ${x.verdict === 'inCircuit' ? 'in the circuit' : 'outside the circuit'}${{
        concealed: '; concealed fusion: the F wave and the intracardiac sequence equal the flutter (protected isthmus).',
        manifest: '; manifest fusion: the surface wave changes during pacing (the antidromic front leaves the circuit).',
        none: '; the wave joins the circuit at the CS ostium and comes back the same way.'
      }[x.fusion] ?? '.'}`,
      labels: { ta: 'TA', svc: 'SVC', ivc: 'IVC', kt: 'CT', es: 'ER', cs: 'CS', his: 'His', hra: 'HRA', abl: 'ABL', lesion: 'Line', septal: 'Septal', lateral: 'Lateral', lao: 'LAO' }
    },
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
  'avnrt-jump': {
    tr: { name: 'İkili AV nodal fizyoloji (indüklenmeyen)', hints: ['HRA S1 600 + S2, 10\'ar ms kısaltın: ~370 ms\'de AH en az 50 ms sıçrar (ikili AV nodal fizyoloji).', 'Bazalde echo ve taşikardi yok: retrograd hızlı yol zayıf (uzun retrograd ERP).', 'İzoproterenol altında (S1 500) sıçramadan sonra echo atımları görülür; taşikardi için ikinci ilaç ve daha kısa S1 gerekir.', 'Yalnız sıçrama ablasyon endikasyonu değildir; belgelenmiş klinik taşikardi ile birlikte değerlendirilir.'] },
    en: { name: 'Dual AV nodal physiology (non-inducible)', hints: ['HRA S1 600 + S2 shortened by 10 ms: at ~370 ms the AH jumps by at least 50 ms (dual AV nodal physiology).', 'No echo and no tachycardia at baseline: a weak retrograde fast pathway (long retrograde ERP).', 'On isoproterenol (S1 500) echo beats follow the jump; a tachycardia needs the second drug and a shorter S1.', 'A jump alone is no indication for ablation; weigh it with a documented clinical tachycardia.'] }
  },
  'avnrt-echo': {
    tr: { name: 'AVNRT: yalnız echo (ilaçla indüklenen)', hints: ['Bazalde S2 ~370 ms\'de sıçrama ve tek echo atımı; taşikardi sürmez.', 'Echo, yavaş yoldan inip hızlı yoldan dönen tek döngüdür; ikinci dönüşte retrograd hızlı yol hâlâ refrakterdir.', 'İzoproterenol (S1 500) ya da atropin ile S2 dekrementi tipik AVNRT başlatır.', 'Ablasyon: yavaş yol (CS ağzı önü); sonrasında ilaç altında da indüklenmemeli.'] },
    en: { name: 'AVNRT: echo only (inducible on a drug)', hints: ['At baseline a jump and a single echo beat at S2 ~370 ms; no sustained tachycardia.', 'An echo is one turn down the slow and up the fast pathway; on the second turn the retrograde fast pathway is still refractory.', 'On isoproterenol (S1 500) or atropine the S2 decrement induces typical AVNRT.', 'Ablation: slow pathway (anterior to the CS ostium); afterwards it should not be inducible on the drug either.'] }
  },
  'avnrt-atypical': {
    tr: { name: 'Atipik AVNRT (hızlı-yavaş)', hints: ['RV pacing ile başlar: retrograd iletim yavaş yoldan, VA uzun (~270 ms).', 'Uzun RP taşikardi; en erken A CS ağzında ama dizilim konsantrik.', 'PJRT\'den ayırım: His-refrakter PVC atriyumu değiştirmez; V overdrive sonrası V-A-V, PPI−TCL > 115 ve SA−VA > 85 ms (VA pacing siklusundan uzun olsa da yalancı V-A-A-V\'ye dikkat).', 'Ablasyon hedefi tipik AVNRT\'deki gibi yavaş yol bölgesidir.'] },
    en: { name: 'Atypical AVNRT (fast-slow)', hints: ['Induced by RV pacing: retrograde conduction over the slow pathway, long VA (~270 ms).', 'Long RP tachycardia; earliest A at the CS ostium but the sequence is concentric.', 'Versus PJRT: a His-refractory PVC leaves the atrium unchanged; after V overdrive V-A-V, PPI−TCL > 115 and SA−VA > 85 ms (beware of a pseudo-V-A-A-V when the VA exceeds the pacing cycle).', 'The ablation target is the slow-pathway region, as in typical AVNRT.'] }
  },
  'ort-left': {
    tr: { name: 'ORT, concealed sol lateral aksesuar yol', hints: ['Sinüste preeksitasyon yok (concealed yol); VA yalnız taşikardide görünür.', 'RV S2 ~250 ya da atriyal S2 ~260 ile ORT başlar.', 'Retrograd aktivasyon eksantrik: CS distal en erken, sonra proksimal ve His.', 'VA ≥ 70 ms (burada ~130): tipik AVNRT\'den uzun.', 'Ablasyon: sol lateral mitral anulus, en erken retrograd A.', 'Manevralar: His-refrakter PVC atriyumu öne çeker; V overdrive sonrası V-A-V yanıtı, cPPI−TCL < 110 ms (sol serbest duvar yolunda RV apeksten PPI−TCL > 115 ms çıkabilir; septal yollarda PPI−TCL ≤ 115, SA−VA ≤ 85 ms).'] },
    en: { name: 'ORT, concealed left lateral accessory pathway', hints: ['No pre-excitation in sinus rhythm (concealed pathway); a VA appears only in tachycardia.', 'RV S2 ~250 or atrial S2 ~260 induces ORT.', 'Eccentric retrograde activation: distal CS first, then proximal and the His.', 'VA ≥ 70 ms (here ~130): longer than in typical AVNRT.', 'Ablation: left lateral mitral annulus, at the earliest retrograde A.', 'Maneuvers: a His-refractory PVC advances the atrium; after V overdrive V-A-V response, cPPI−TCL < 110 ms (with a left free-wall pathway RV apical PPI−TCL is often > 115 ms; septal pathways show PPI−TCL ≤ 115, SA−VA ≤ 85 ms).'] }
  },
  pjrt: {
    tr: { name: 'PJRT (dekremental posteroseptal yol)', hints: ['Yavaş ve dekremental ileten posteroseptal aksesuar yol: VA uzun (~210 ms), uzun RP.', 'En erken A CS ağzında; atriyal veya ventriküler S2 ile kolayca başlar.', 'Klinikte sıklıkla sürekli (incessant) seyreder; taşikardiye bağlı kardiyomiyopati yapabilir.', 'Ablasyon: posteroseptal bölge (CS ağzı çevresi).'] },
    en: { name: 'PJRT (decremental posteroseptal pathway)', hints: ['A slowly and decrementally conducting posteroseptal pathway: long VA (~210 ms), long RP.', 'Earliest A at the CS ostium; atrial or ventricular S2 induces it easily.', 'Clinically often incessant; it can cause tachycardia-induced cardiomyopathy.', 'Ablation: posteroseptal region (around the CS ostium).'] }
  },
  'wpw-left': {
    tr: { name: 'WPW, manifest sol lateral yol (preeksite AF)', hints: ['Sinüste kısa HV (~14 ms) ve delta dalgası: manifest preeksitasyon.', 'Hızlı atriyal pacing (≤ 250 ms) AF başlatır: düzensiz, geniş QRS\'li preeksite AF.', 'En kısa preeksite RR ≤ 250 ms yüksek risk göstergesidir.', 'AV nodal blokörler kontrendike; kardiyoversiyon ya da aksesuar yol ablasyonu.', 'Yol ablasyonundan sonra AF dar QRS ile sürer; kardiyoversiyon sinüse döndürür.'] },
    en: { name: 'WPW, manifest left lateral pathway (pre-excited AF)', hints: ['Short HV (~14 ms) and a delta wave in sinus rhythm: manifest pre-excitation.', 'Rapid atrial pacing (≤ 250 ms) starts AF: irregular, wide pre-excited AF.', 'A shortest pre-excited RR ≤ 250 ms marks high risk.', 'AV nodal blockers are contraindicated; cardioversion or pathway ablation.', 'After pathway ablation AF continues with narrow QRS; cardioversion restores sinus rhythm.'] }
  },
  'at-focal': {
    tr: { name: 'Fokal atriyal taşikardi (sol atriyum)', hints: ['HRA burst ≤ 330 ms sonrasında odak ateşlenir: AT siklusu ~380 ms.', 'Eksantrik atriyal aktivasyon: CS distal erken, HRA geç (sol atriyal odak).', 'AV düğüm devrede değil: VA değişken. V overdrive atriyumu yakaladıktan sonra durdurulunca V-A-A-V yanıtı.', 'Otomatik odak kardiyoversiyonla sonlanmaz, şoktan sonra yeniden ateşler; odak ablasyonu gerekir.'] },
    en: { name: 'Focal atrial tachycardia (left atrium)', hints: ['After an HRA burst ≤ 330 ms the focus fires: AT cycle ~380 ms.', 'Eccentric atrial activation: distal CS early, HRA late (left atrial focus).', 'The AV node is not in the circuit: variable VA. V overdrive, stopped once the atrium is entrained, gives a V-A-A-V response.', 'An automatic focus is not ended by cardioversion and fires again after the shock; focus ablation is needed.'] }
  },
  'flutter-cti': {
    tr: { name: 'Tipik (CTI bağımlı) atriyal flutter', hints: ['Hızlı atriyal pacing (≤ 260 ms) tipik flutter başlatır: atriyal siklus 240 ms.', '2:1 AV iletim: ventrikül siklusu 480 ms; DII\'de negatif testere dişi F dalgaları.', 'Septum ve CS proksimalden distale önce, yüksek lateral RA His\'ten yaklaşık 75 ms sonra, en son yavaş CTI (saat yönünün tersi); Halka (LAO) görünümü devreyi DII ile birlikte gösterir.', 'CTI ablasyonu flutterı sonlandırır ve yeniden başlatılamaz kılar.', 'Atriyal overdrive (entrainment): CS proksimal ve lateral RA\'da PPI−TCL ≤ 30 ms (devre içi), CS distalde > 100 ms (devre dışı).'] },
    en: { name: 'Typical (CTI-dependent) atrial flutter', hints: ['Rapid atrial pacing (≤ 260 ms) induces typical flutter: atrial cycle 240 ms.', '2:1 AV conduction: ventricular cycle 480 ms; negative saw-tooth F waves in II.', 'Septum and CS proximal to distal first, the high lateral RA about 75 ms after the His, the slow CTI last (counterclockwise); the Ring (LAO) view shows the circuit with lead II.', 'CTI ablation ends the flutter and makes it non-inducible.', 'Atrial overdrive (entrainment): PPI−TCL ≤ 30 ms at the proximal CS and lateral RA (in the circuit), > 100 ms at the distal CS (outside).'] }
  },
  'flutter-cw': {
    tr: { name: 'Ters tipik (saat yönünde) CTI flutter', hints: ['Hızlı atriyal pacing (≤ 260 ms) başlatır: atriyal siklus 240 ms.', 'DII\'de geniş pozitif F dalgaları, V1\'de negatif.', 'His\'ten CS ağzına iner, istmusu septumdan laterale geçer, lateral duvardan yukarı çıkar (Halka görünümünde saat yönünde).', 'Devre aynı: CTI ablasyonu bu flutterı da sonlandırır.', 'CS proksimal, HRA ve CTI\'de PPI−TCL ≤ 30 ms, CS distalde > 100 ms.'] },
    en: { name: 'Reverse typical (clockwise) CTI flutter', hints: ['Rapid atrial pacing (≤ 260 ms) induces it: atrial cycle 240 ms.', 'Broad positive F waves in II, negative in V1.', 'Down the septum from the His to the CS ostium, across the isthmus septal to lateral, up the lateral wall (clockwise on the Ring view).', 'Same circuit: CTI ablation ends this flutter too.', 'PPI−TCL ≤ 30 ms at the proximal CS, HRA and CTI, > 100 ms at the distal CS.'] }
  },
  'va-block': {
    tr: { name: 'Retrograd VA blok', hints: ['RV pacing ve RV ekstrastimulusta retrograd A yok: VA dissosiyasyon, sinüs P dalgaları kendi hızında sürer.', 'VA iletim yokluğu AVNRT ve ortodromik AVRT olasılığını azaltır, dışlamaz.', 'İzoproterenol altında RV S1 500 ile 1:1 konsantrik VA (~145 ms) ortaya çıkar; daha kısa S2\'de VA blok.', 'Atropin bu modelde retrograd iletimi açmaya yetmez.'] },
    en: { name: 'Retrograde VA block', hints: ['No retrograde A with RV pacing or RV extrastimuli: VA dissociation, the sinus P waves go on at their own rate.', 'Absent VA conduction makes AVNRT and orthodromic AVRT less likely, not impossible.', 'On isoproterenol, RV S1 500 brings out 1:1 concentric VA (~145 ms); VA block at a shorter S2.', 'In this model atropine alone does not open retrograde conduction.'] }
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

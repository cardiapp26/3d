// Texts of the live EP laboratory (ep-live-panel.js): substrate names,
// expert hints with an induction protocol, RF targets and lesion results,
// and the diagnosis quiz. Teaching wording on designed model values.

export const LIVE_TEXT = {
  tr: {
    caseLabel: 'Substrat', hidden: '? Gizli olgu', surprise: 'Gizli olgu', diagnose: 'Tanı koy', hints: 'İpuçları',
    question: 'Bu kayıtta substrat / mekanizma nedir?', correct: 'Doğru.', wrong: (name) => `Yanlış. Doğru yanıt: ${name}.`,
    run: 'Dondur', resume: 'Devam', speed: 'Tarama', review: 'Geri sar', calipers: 'Kaliper',
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
    delivered: (txt) => `Verildi: ${txt}`, shocked: 'Senkronize DC şok verildi.', stopped: 'Uyarı durduruldu.'
  },
  en: {
    caseLabel: 'Substrate', hidden: '? Hidden case', surprise: 'Hidden case', diagnose: 'Diagnose', hints: 'Hints',
    question: 'What is the substrate / mechanism of this recording?', correct: 'Correct.', wrong: (name) => `Incorrect. The answer: ${name}.`,
    run: 'Freeze', resume: 'Run', speed: 'Sweep', review: 'Review', calipers: 'Calipers',
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
    tr: { name: 'Tipik AVNRT (yavaş-hızlı)', hints: ['HRA S1 600 + S2, 10\'ar ms kısaltın: hızlı yol ERP\'sinde (~380 ms) AH en az 50 ms sıçrar.', 'Sıçramadan sonra tipik AVNRT: VA ≤ 70 ms (burada ~30); A ve V neredeyse eşzamanlı.', 'Retrograd aktivasyon konsantrik: His\'te A en erken, CS proksimalden distale.', 'Ablasyon: yavaş yol (CS ağzının önü); RF sırasında kavşak atımları beklenen bir işarettir.', 'Kompakt düğüm / His bölgesinde RF tam AV bloğa yol açar.'] },
    en: { name: 'Typical AVNRT (slow-fast)', hints: ['HRA S1 600 + S2, shorten by 10 ms: at the fast-pathway ERP (~380 ms) the AH jumps by at least 50 ms.', 'After the jump, typical AVNRT: VA ≤ 70 ms (here ~30); A and V almost simultaneous.', 'Concentric retrograde activation: earliest A at the His, CS proximal to distal.', 'Ablation: slow pathway (anterior to the CS ostium); junctional beats during RF are an expected sign.', 'RF at the compact node / His causes complete AV block.'] }
  },
  'avnrt-atypical': {
    tr: { name: 'Atipik AVNRT (hızlı-yavaş)', hints: ['RV pacing ile başlar: retrograd iletim yavaş yoldan, VA uzun (~270 ms).', 'Uzun RP taşikardi; en erken A CS ağzında ama dizilim konsantrik.', 'PJRT\'den ayırım: PJRT\'de aksesuar yol vardır; His-refrakter PVC ve overdrive yanıtları faz 3\'te.', 'Ablasyon hedefi tipik AVNRT\'deki gibi yavaş yol bölgesidir.'] },
    en: { name: 'Atypical AVNRT (fast-slow)', hints: ['Induced by RV pacing: retrograde conduction over the slow pathway, long VA (~270 ms).', 'Long RP tachycardia; earliest A at the CS ostium but the sequence is concentric.', 'Versus PJRT: PJRT uses an accessory pathway; His-refractory PVC and overdrive responses come in phase 3.', 'The ablation target is the slow-pathway region, as in typical AVNRT.'] }
  },
  'ort-left': {
    tr: { name: 'ORT, gizli sol lateral aksesuar yol', hints: ['Sinüste preeksitasyon yok (gizli yol); VA yalnız taşikardide görünür.', 'RV S2 ~250 ya da atriyal S2 ~260 ile ORT başlar.', 'Retrograd aktivasyon eksantrik: CS distal en erken, sonra proksimal ve His.', 'VA ≥ 70 ms (burada ~130): tipik AVNRT\'den uzun.', 'Ablasyon: sol lateral mitral anulus, en erken retrograd A.'] },
    en: { name: 'ORT, concealed left lateral accessory pathway', hints: ['No pre-excitation in sinus rhythm (concealed pathway); a VA appears only in tachycardia.', 'RV S2 ~250 or atrial S2 ~260 induces ORT.', 'Eccentric retrograde activation: distal CS first, then proximal and the His.', 'VA ≥ 70 ms (here ~130): longer than in typical AVNRT.', 'Ablation: left lateral mitral annulus, at the earliest retrograde A.'] }
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
    tr: { name: 'Fokal atriyal taşikardi (sol atriyum)', hints: ['HRA burst ≤ 330 ms sonrasında odak ateşlenir: AT siklusu ~380 ms.', 'Eksantrik atriyal aktivasyon: CS distal erken, HRA geç (sol atriyal odak).', 'AV düğüm devrede değil: VA değişken; V overdrive sonrası V-A-A-V yanıtı faz 3\'te.', 'Otomatik odak kardiyoversiyonla sonlanmaz, şoktan sonra yeniden ateşler; odak ablasyonu gerekir.'] },
    en: { name: 'Focal atrial tachycardia (left atrium)', hints: ['After an HRA burst ≤ 330 ms the focus fires: AT cycle ~380 ms.', 'Eccentric atrial activation: distal CS early, HRA late (left atrial focus).', 'The AV node is not in the circuit: variable VA; the V-A-A-V response after V overdrive comes in phase 3.', 'An automatic focus is not ended by cardioversion and fires again after the shock; focus ablation is needed.'] }
  },
  'flutter-cti': {
    tr: { name: 'Tipik (CTI bağımlı) atriyal flutter', hints: ['Hızlı atriyal pacing (≤ 260 ms) tipik flutter başlatır: atriyal siklus 240 ms.', '2:1 AV iletim: ventrikül siklusu 480 ms; DII\'de negatif testere dişi F dalgaları.', 'Septum ve CS proksimalden distale önce, yüksek lateral RA siklusun ortasında (saat yönünün tersi).', 'CTI ablasyonu flutterı sonlandırır ve yeniden başlatılamaz kılar.'] },
    en: { name: 'Typical (CTI-dependent) atrial flutter', hints: ['Rapid atrial pacing (≤ 260 ms) induces typical flutter: atrial cycle 240 ms.', '2:1 AV conduction: ventricular cycle 480 ms; negative saw-tooth F waves in II.', 'Septum and CS proximal to distal first, the high lateral RA mid-cycle (counterclockwise).', 'CTI ablation ends the flutter and makes it non-inducible.'] }
  },
  'vt-scar': {
    tr: { name: 'Skar ilişkili monomorfik VT', hints: ['RV S1 + S2 + S3 (≤ 300 ms) ile başlar: geniş QRS, siklus ~380 ms.', 'AV dissosiyasyon: sinüs A\'ları VT\'den bağımsız; arada dar capture atımları.', 'His V\'den sonra (retrograd) ya da hiç görülmez.', 'Kardiyoversiyon sonlandırır; ablasyon hedefi skar istmusudur.'] },
    en: { name: 'Scar-related monomorphic VT', hints: ['RV S1 + S2 + S3 (≤ 300 ms) induces it: wide QRS, cycle ~380 ms.', 'AV dissociation: sinus A waves independent of the VT; occasional narrow capture beats.', 'The His appears after the V (retrograde) or not at all.', 'Cardioversion ends it; the ablation target is the scar isthmus.'] }
  }
};

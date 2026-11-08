// Text of the endovascular procedure panel (peripheral-intervention-panel.js), Turkish and English.

const ACCESS_TR = {
  'femoral-retro': 'Retrograd CFA (aynı taraf)',
  'femoral-contra': 'Karşı CFA, crossover',
  'femoral-ante': 'Antegrad CFA (aynı taraf)',
  'femoral-bilat': 'Bilateral retrograd CFA',
  radial: 'Sol radiyal / brakiyal',
  pedal: 'Retrograd pedal / tibial'
};
const ACCESS_EN = {
  'femoral-retro': 'Retrograde CFA (same side)',
  'femoral-contra': 'Contralateral CFA, up-and-over',
  'femoral-ante': 'Antegrade CFA (same side)',
  'femoral-bilat': 'Bilateral retrograde CFA',
  radial: 'Left radial / brachial',
  pedal: 'Retrograde pedal / tibial'
};

const PREP_TR = { predil: 'Küçük balonla ön dilatasyon', scoring: 'Skorlama balonu', ivl: 'İntravasküler litotripsi (IVL)', orbital: 'Orbital aterektomi', directional: 'Direksiyonel aterektomi' };
const PREP_EN = { predil: 'Undersized balloon predilation', scoring: 'Scoring balloon', ivl: 'Intravascular lithotripsy (IVL)', orbital: 'Orbital atherectomy', directional: 'Directional atherectomy' };
const BALLOON_TR = { semi: 'Yarı uyumlu', nc: 'Uyumsuz (NC)', dcb: 'İlaç kaplı balon (DCB)' };
const BALLOON_EN = { semi: 'Semi-compliant', nc: 'Non-compliant (NC)', dcb: 'Drug-coated balloon (DCB)' };
const STENT_TR = { se: 'Kendiliğinden açılan nitinol', be: 'Balonla açılan', covered: 'Kaplı stent (stent greft)' };
const STENT_EN = { se: 'Self-expanding nitinol', be: 'Balloon-expandable', covered: 'Covered stent (stent graft)' };
const DISSECTION_TR = { none: 'yok', minor: 'hafif (tip A-B)', major: 'belirgin (tip C)', 'flow-limiting': 'akımı kısıtlayan (tip D-F)' };
const DISSECTION_EN = { none: 'none', minor: 'minor (type A-B)', major: 'major (type C)', 'flow-limiting': 'flow-limiting (type D-F)' };

const NOTE_TR = {
  ivlLowCalcium: 'Kalsiyum az: IVL bu lezyonda beklenen faydayı sağlamaz.',
  atherectomyBed: 'Bu yatakta aterektomi rutin bir seçenek değildir.',
  noFilter: 'Embolik koruma filtresi olmadan aterektomi distal emboli riski taşır.',
  cfaNoStent: 'CFA stent için genellikle kaçınılan bölgedir (kalça hareketi, ileride kasık girişi). Endarterektomi veya aterektomi ile DCB tercih edilir.',
  tibialBailout: 'Dizaltında stent çoğunlukla kurtarma (bail-out) amaçlıdır.',
  profundaStent: 'Profundada stent nadiren gerekir: PTA veya aterektomi tercih edilir, stent kurtarma amaçlıdır.',
  beCrush: 'Femoropopliteal segment dış basıya ve bükülmeye açıktır: balonla açılan stent ezilebilir, nitinol tercih edilir.',
  seOstial: 'Ostial lezyonda radyal kuvvet ve hassas yerleşim için balonla açılan stent tercih edilir.',
  undersized: 'Stent referans çaptan küçük: yetersiz açılma ve malapozisyon riski.',
  oversized: 'Stent fazla büyük: damar hasarı ve rüptür riski.',
  geographicMiss: 'Stent lezyonun tamamını örtmüyor (coğrafi kaçırma).'
};
const NOTE_EN = {
  ivlLowCalcium: 'Little calcium: IVL will not give its expected benefit here.',
  atherectomyBed: 'Atherectomy is not a routine option in this bed.',
  noFilter: 'Atherectomy without an embolic protection filter risks distal embolization.',
  cfaNoStent: 'The CFA is usually avoided for stents (hip motion, future groin access). Endarterectomy, or atherectomy with DCB, is preferred.',
  tibialBailout: 'Below the knee, stents are mostly for bail-out.',
  profundaStent: 'The profunda rarely needs a stent: angioplasty or atherectomy is preferred, a stent is for bail-out.',
  beCrush: 'The femoropopliteal segment bends and is compressed: a balloon-expandable stent can be crushed, nitinol is preferred.',
  seOstial: 'For an ostial lesion, a balloon-expandable stent gives radial force and precise placement.',
  undersized: 'Stent smaller than the reference: underexpansion and malapposition risk.',
  oversized: 'Stent too large: vessel injury and rupture risk.',
  geographicMiss: 'The stent does not cover the whole lesion (geographic miss).'
};

const FEEDBACK_TR = {
  fbAccessBest: 'Giriş yolu bu lezyon için önerilen yoldu.',
  fbAccessOk: 'Giriş yolu uygulanabilirdi ama ilk tercih değildi.',
  fbWireOff: 'Tel çapı bu damar yatağı için ilk tercih değildi.',
  fbNoCalciumPrep: 'Ağır kalsiyumda lezyon hazırlığı (IVL veya aterektomi) yapılmadı: bel kırılmayabilir, recoil artar.',
  fbNoGradient: 'Tedavi öncesi basınç gradyanı ölçülmedi: hemodinamik önemi kanıtlanmadı.',
  fbCfaStent: 'CFA\'ya stent konuldu: bu bölge genellikle stentten kaçınılan bölgedir.',
  fbDcbOk: 'DCB sonrası rezidü ≤%30 ve akımı kısıtlayan diseksiyon yok: stentsiz strateji uygun.',
  fbEmbolization: 'Distal emboli şüphesi: distal yatak kontrol edilmeli, aspirasyon gerekebilir.',
  fbPerforationSealed: 'Rüptür kaplı stentle kapatıldı.',
  fbPerforationOpen: 'Kontrast ekstravazasyonu sürüyor: balonla tamponat ve kaplı stent gerekir.',
  fbDissection: 'Akımı kısıtlayan diseksiyon sürüyor: stentle kapatılmalı.'
};
const FEEDBACK_EN = {
  fbAccessBest: 'The access route was the recommended one for this lesion.',
  fbAccessOk: 'The access route was workable but not the first choice.',
  fbWireOff: 'The wire size was not the first choice for this bed.',
  fbNoCalciumPrep: 'Severe calcium without lesion preparation (IVL or atherectomy): the waist may not break and recoil increases.',
  fbNoGradient: 'No pressure gradient before treatment: hemodynamic significance was not shown.',
  fbCfaStent: 'A stent was placed in the CFA: this segment is usually avoided for stents.',
  fbDcbOk: 'After DCB the residual is ≤30% with no flow-limiting dissection: a no-stent strategy fits.',
  fbEmbolization: 'Suspected distal embolization: check the runoff, aspiration may be needed.',
  fbPerforationSealed: 'The rupture was sealed with a covered stent.',
  fbPerforationOpen: 'Contrast extravasation persists: balloon tamponade and a covered stent are needed.',
  fbDissection: 'A flow-limiting dissection persists: it should be stented.'
};

const ACCESS_NOTES_TR = {
  'leriche-tasc-d': { 'femoral-bilat': 'Öpüşen (kissing) stentler için iki kasıktan giriş; telle aşağıdan geçilemezse sol brakiyal/radiyal eklenir.', radial: 'Yukarıdan antegrad geçiş için yardımcı yol.', 'femoral-contra': 'Tıkalı bifurkasyonun üzerinden crossover yapılamaz.', 'femoral-ante': 'Antegrad giriş lezyonun distalinde kalır.' },
  'right-cia-ostial': { 'femoral-retro': 'Kısa, düz yol; ostial stent için iyi destek.', 'femoral-ante': 'Antegrad giriş lezyonun distalinde kalır.' },
  'cfa-bifurcation-plaque': { 'femoral-contra': 'Hastalıklı kasığa girilmez; karşı taraftan crossover.', 'femoral-retro': 'Kalsifik CFA plağına ponksiyon: kanama ve diseksiyon riski.', 'femoral-ante': 'Ponksiyon yeri tam lezyonun üzerinde.' },
  'profunda-ostial-stenosis': { 'femoral-contra': 'Crossover kılıfla profunda ağzına iyi açı.', 'femoral-retro': 'Retrograd giriş profundaya yönlenemez.' },
  'sfa-hunter-cto': { 'femoral-contra': 'Crossover kılıfla SFA tıkanıklığına antegrad yaklaşım.', 'femoral-ante': 'Kısa mesafe, iyi itme gücü.', pedal: 'Antegrad geçiş başarısız olursa retrograd kurtarma yolu.', radial: 'Mesafe çok uzun: çoğu cihaz SFA\'ya yetişmez.' },
  'btk-at-clti': { 'femoral-ante': 'Dizaltına en kısa ve en destekli yol.', pedal: 'Antegrad geçiş başarısızsa retrograd yol.', radial: 'Mesafe çok uzun: dizaltına ulaşılamaz.' },
  'renal-ostial-ras': { 'femoral-retro': 'Renal kılavuz kateterle standart yol.' },
  'celiac-sma-mesenteric': { radial: 'Yukarıdan girişte SMA\'nın aşağı açısı kolay kanülasyon sağlar.' },
  'subclavian-steal': { 'femoral-retro': 'Arkus üzerinden antegrad yaklaşım.', radial: 'Retrograd yaklaşım; tıkanıklıkta iki yönlü giriş.' }
};
const ACCESS_NOTES_EN = {
  'leriche-tasc-d': { 'femoral-bilat': 'Both groins for kissing stents; add left brachial or radial if the wire will not cross from below.', radial: 'Helper route for antegrade crossing from above.', 'femoral-contra': 'Cannot go up and over an occluded bifurcation.', 'femoral-ante': 'Antegrade access lies distal to the lesion.' },
  'right-cia-ostial': { 'femoral-retro': 'Short, straight route with good support for an ostial stent.', 'femoral-ante': 'Antegrade access lies distal to the lesion.' },
  'cfa-bifurcation-plaque': { 'femoral-contra': 'Avoid the diseased groin; come up and over from the other side.', 'femoral-retro': 'Puncture through calcified CFA plaque: bleeding and dissection risk.', 'femoral-ante': 'The puncture site sits on the lesion.' },
  'profunda-ostial-stenosis': { 'femoral-contra': 'A crossover sheath gives a good angle to the profunda origin.', 'femoral-retro': 'Retrograde access cannot be steered into the profunda.' },
  'sfa-hunter-cto': { 'femoral-contra': 'Antegrade approach to the SFA occlusion through a crossover sheath.', 'femoral-ante': 'Short distance, good pushability.', pedal: 'Retrograde bail-out if antegrade crossing fails.', radial: 'Too far: most devices will not reach the SFA.' },
  'btk-at-clti': { 'femoral-ante': 'Shortest, best-supported route below the knee.', pedal: 'Retrograde route if antegrade crossing fails.', radial: 'Too far: below-the-knee vessels are out of reach.' },
  'renal-ostial-ras': { 'femoral-retro': 'Standard route with a renal guiding catheter.' },
  'celiac-sma-mesenteric': { radial: 'From above, the downward SMA angle makes cannulation easy.' },
  'subclavian-steal': { 'femoral-retro': 'Antegrade approach over the arch.', radial: 'Retrograde approach; two-way access for an occlusion.' }
};

export const PERI_INTERVENTION_TEXT = {
  tr: {
    title: 'Endovasküler girişim',
    intro: 'Seçili lezyonda adım adım: giriş, basınç gradyanı, lezyon hazırlığı, balon, stent ve tamamlama anjiyografisi.',
    scope: 'Şematik eğitim modeli. Balon uyumu, recoil, kalsiyum modifikasyonu ve gradyan basitleştirilmiş fizik ve sezgisel kurallardır; cihaz kullanım talimatı veya doğrulanmış veri değildir. İşlem planlaması ya da cihaz seçimi için kullanılmaz.',
    pickLesion: 'Girişim için yukarıdan bir lezyon senaryosu seçin.',
    severity: 'Darlık derecesi', severityHelp: 'En dar noktadaki çap darlığı yüzdesi. Değiştirmek işlemi baştan başlatır.', occluded: 'Tıkalı',
    qca: { ref: 'REF Ø', mld: 'MLD', ds: '% DS', flow: 'AKIM' },
    flow: { brisk: 'Hızlı', slow: 'Yavaş', none: 'Yok', extravasation: 'Ekstravazasyon' },
    lesionMeta: (s) => `${s.lengthMm} mm uzunluk · referans Ø ${s.refMm} mm · kalsiyum ${['yok', 'hafif', 'orta', 'ağır'][s.calcium]}`,
    steps: ['Giriş ve tel', 'Pullback gradyanı', 'Lezyon hazırlığı', 'Balon anjiyoplasti', 'Stent', 'Tamamlama anjiyografisi'],
    access: 'Giriş', accessNames: ACCESS_TR, accessNotes: ACCESS_NOTES_TR,
    rating: { best: 'Önerilen', ok: 'Uygulanabilir', avoid: 'Kaçının' },
    wire: 'Tel', wireNames: { '0.035': '0.035" (destek, iliyak/aortik)', '0.018': '0.018" (femoropopliteal)', '0.014': '0.014" (dizaltı, renal/visseral)' },
    advanceWire: (w) => `${w}" teli ilerlet`, wireCrossed: 'Tel lezyonu geçti.',
    gradientIntro: 'Uç delikli 5F kateter tel üzerinden; eşzamanlı aort basıncı referans.',
    advanceCatheter: 'Kateteri lezyonun ötesine ilerlet', pullbackBtn: 'Geri çek (dinlenme)', ntgBtn: 'NTG 200 µg intraarteriyel ver',
    gradientReadout: (g) => `Tepe sistolik gradyan ${g.gradient} mmHg · Pd/Pa ${g.pdPa.toFixed(2)} · ${g.significant ? 'hemodinamik anlamlı' : 'anlamlı değil'}`,
    gradientRule: 'İliyak ölçüt: dinlenmede ≥10 mmHg veya vazodilatör sonrası ≥20 mmHg.',
    aortic: 'Aort', distal: 'Distal',
    device: 'Cihaz', prepNames: PREP_TR, cycles: 'Döngü', cycleOpt: (n) => `${n} (${n * 30} darbe)`, crown: 'Taç (orbit) boyutu', filter: 'Embolik koruma filtresi',
    treat: 'Lezyonu tedavi et', calciumNow: (c) => `Etkin kalsiyum: ${c.toFixed(1)} / 3`,
    balloon: 'Balon', balloonNames: BALLOON_TR, diameter: 'Çap (mm)', length: 'Uzunluk (mm)', position: 'Konum',
    positionBalloon: 'Balonu yerleştir', pressure: 'Basınç', toNominal: 'Nominale', toRbp: 'RBP\'ye', deflateBtn: 'Söndür',
    balloonSpec: (b) => `Nominal ${b.nominal} atm · RBP ${b.rbp} atm`,
    balloonIdle: 'Balon yerleştirilmedi', balloonReady: 'Balon yerinde, şişirmeye hazır',
    balloonInflated: (p, d, waist) => `${p} atm · balon Ø ${d} mm${waist ? ' · bel (waist) sürüyor' : ''}`,
    miss: (mm) => `Lezyonun ${Math.round(mm)} mm'si açıkta`,
    stent: 'Stent', stentType: 'Tip', stentNames: STENT_TR, deployStent: 'Stenti yerleştir', stentDeployed: 'Stent yerleştirildi.',
    notes: NOTE_TR,
    runCompletion: 'Tamamlama anjiyografisi çek',
    outcome: { success: 'Başarılı sonuç', suboptimal: 'Yetersiz sonuç', complication: 'Komplikasyon' },
    completionLine: (c) => `Rezidü %${c.pct} · akım ${c.flow} · gradyan ${c.gradient} mmHg`,
    feedback: FEEDBACK_TR,
    logTitle: 'İşlem günlüğü', reset: 'İşlemi sıfırla', logEmpty: 'Henüz adım yok.',
    log: {
      wireFailAccess: (d) => `${ACCESS_TR[d.access]} bu lezyona uygun değil; tel ilerletilemedi.`,
      wireFailSize: (d) => `${d.wire}" tel dizaltı arterde ilerlemez; 0.014" seçin.`,
      wireCross: (d) => `${ACCESS_TR[d.access]} ile ${d.wire}" tel lezyonu geçti${d.wireFit === 'off' ? ' (tel çapı ilk tercih değil)' : ''}.`,
      wireCrossCto: (d) => `${ACCESS_TR[d.access]} ile tıkanıklık destek kateteri ve ${d.wire}" telle geçildi (subintimal kanal olabilir).`,
      catheterBeyond: () => 'Kateter lezyonun ötesinde.',
      gradientRest: (g) => `Dinlenme gradyanı ${g.gradient} mmHg (Pd/Pa ${g.pdPa.toFixed(2)}).`,
      gradientNtg: (g) => `NTG sonrası gradyan ${g.gradient} mmHg.`,
      prepDone: (d) => `${PREP_TR[d.device]}${d.device === 'ivl' ? `, ${d.cycles} döngü` : d.device === 'orbital' ? `, ${d.crown} mm taç` : ''}: darlık %${d.pct}, etkin kalsiyum ${d.calcium.toFixed(1)}.${d.notes.map((n) => ` ${NOTE_TR[n]}`).join('')}`,
      balloonPositioned: (d) => `${BALLOON_TR[d.type]} ${d.diameter}×${d.length} mm balon yerleştirildi${d.miss > 0 ? `, lezyonun ${Math.round(d.miss)} mm'si açıkta` : ''}.`,
      balloonDeflated: (d) => `${d.pressure} atm'de balon Ø ${d.dMax} mm${d.waist ? ', bel kırılmadı' : ''}; recoil %${d.recoil}, rezidü %${d.pct}, diseksiyon ${DISSECTION_TR[d.dissection]}.${d.rupture ? ' Rüptür: kontrast ekstravazasyonu!' : ''}${d.dcbResult === 'ok' ? ' DCB ölçütleri karşılandı.' : d.dcbResult === 'needs-stent' ? ' DCB ölçütleri karşılanmadı: stent düşünün.' : ''}`,
      stentDeployed: (d) => `${STENT_TR[d.type]} ${d.diameter}×${d.length} mm stent: rezidü %${d.pct}.${d.notes.map((n) => ` ${NOTE_TR[n]}`).join('')}${d.rupture ? ' Rüptür!' : ''}`,
      completion: (d) => `Tamamlama: rezidü %${d.pct}, gradyan ${d.gradient} mmHg.`
    },
    dissection: DISSECTION_TR
  },
  en: {
    title: 'Endovascular intervention',
    intro: 'Step by step on the selected lesion: access, pressure gradient, lesion preparation, balloon, stent and the completion angiogram.',
    scope: 'Schematic teaching model. Balloon compliance, recoil, calcium modification and the gradient are simplified physics and heuristics, not device instructions for use or validated data. Not for procedural planning or device selection.',
    pickLesion: 'Pick a lesion scenario above to intervene on.',
    severity: 'Degree of narrowing', severityHelp: 'Percent diameter stenosis at the tightest point. Changing it restarts the procedure.', occluded: 'Occluded',
    qca: { ref: 'REF Ø', mld: 'MLD', ds: '% DS', flow: 'FLOW' },
    flow: { brisk: 'Brisk', slow: 'Slow', none: 'None', extravasation: 'Extravasation' },
    lesionMeta: (s) => `${s.lengthMm} mm long · reference Ø ${s.refMm} mm · ${['no', 'mild', 'moderate', 'severe'][s.calcium]} calcification`,
    steps: ['Access and wire', 'Pullback gradient', 'Lesion preparation', 'Balloon angioplasty', 'Stent', 'Completion angiogram'],
    access: 'Access', accessNames: ACCESS_EN, accessNotes: ACCESS_NOTES_EN,
    rating: { best: 'Recommended', ok: 'Workable', avoid: 'Avoid' },
    wire: 'Wire', wireNames: { '0.035': '0.035" (support, iliac/aortic)', '0.018': '0.018" (femoropopliteal)', '0.014': '0.014" (below the knee, renal/visceral)' },
    advanceWire: (w) => `Advance ${w}" wire`, wireCrossed: 'The wire crossed the lesion.',
    gradientIntro: '5F end-hole catheter over the wire, with simultaneous aortic pressure as the reference.',
    advanceCatheter: 'Advance catheter beyond lesion', pullbackBtn: 'Pull back (rest)', ntgBtn: 'Give NTG 200 µg intra-arterial',
    gradientReadout: (g) => `Peak systolic gradient ${g.gradient} mmHg · Pd/Pa ${g.pdPa.toFixed(2)} · ${g.significant ? 'hemodynamically significant' : 'not significant'}`,
    gradientRule: 'Iliac criterion: ≥10 mmHg at rest or ≥20 mmHg after a vasodilator.',
    aortic: 'Aortic', distal: 'Distal',
    device: 'Device', prepNames: PREP_EN, cycles: 'Cycles', cycleOpt: (n) => `${n} (${n * 30} pulses)`, crown: 'Crown (orbit) size', filter: 'Embolic protection filter',
    treat: 'Treat lesion', calciumNow: (c) => `Effective calcium: ${c.toFixed(1)} / 3`,
    balloon: 'Balloon', balloonNames: BALLOON_EN, diameter: 'Diameter (mm)', length: 'Length (mm)', position: 'Position',
    positionBalloon: 'Position balloon', pressure: 'Pressure', toNominal: 'To nominal', toRbp: 'To RBP', deflateBtn: 'Deflate',
    balloonSpec: (b) => `Nominal ${b.nominal} atm · RBP ${b.rbp} atm`,
    balloonIdle: 'No balloon positioned', balloonReady: 'Balloon in place, ready to inflate',
    balloonInflated: (p, d, waist) => `${p} atm · balloon Ø ${d} mm${waist ? ' · waist persists' : ''}`,
    miss: (mm) => `${Math.round(mm)} mm of the lesion uncovered`,
    stent: 'Stent', stentType: 'Type', stentNames: STENT_EN, deployStent: 'Deploy stent', stentDeployed: 'Stent deployed.',
    notes: NOTE_EN,
    runCompletion: 'Run completion angiogram',
    outcome: { success: 'Successful result', suboptimal: 'Suboptimal result', complication: 'Complication' },
    completionLine: (c) => `Residual ${c.pct}% · flow ${c.flow} · gradient ${c.gradient} mmHg`,
    feedback: FEEDBACK_EN,
    logTitle: 'Procedure log', reset: 'Reset procedure', logEmpty: 'No steps yet.',
    log: {
      wireFailAccess: (d) => `${ACCESS_EN[d.access]} does not suit this lesion; the wire could not be advanced.`,
      wireFailSize: (d) => `A ${d.wire}" wire will not track below the knee; choose 0.014".`,
      wireCross: (d) => `${d.wire}" wire crossed the lesion from ${ACCESS_EN[d.access]}${d.wireFit === 'off' ? ' (wire size not first choice)' : ''}.`,
      wireCrossCto: (d) => `The occlusion was crossed from ${ACCESS_EN[d.access]} with a support catheter and ${d.wire}" wire (the channel may be subintimal).`,
      catheterBeyond: () => 'Catheter beyond the lesion.',
      gradientRest: (g) => `Resting gradient ${g.gradient} mmHg (Pd/Pa ${g.pdPa.toFixed(2)}).`,
      gradientNtg: (g) => `Gradient after NTG ${g.gradient} mmHg.`,
      prepDone: (d) => `${PREP_EN[d.device]}${d.device === 'ivl' ? `, ${d.cycles} cycles` : d.device === 'orbital' ? `, ${d.crown} mm crown` : ''}: stenosis ${d.pct}%, effective calcium ${d.calcium.toFixed(1)}.${d.notes.map((n) => ` ${NOTE_EN[n]}`).join('')}`,
      balloonPositioned: (d) => `${BALLOON_EN[d.type]} ${d.diameter}×${d.length} mm balloon positioned${d.miss > 0 ? `, ${Math.round(d.miss)} mm of the lesion uncovered` : ''}.`,
      balloonDeflated: (d) => `At ${d.pressure} atm the balloon reached Ø ${d.dMax} mm${d.waist ? ', waist not broken' : ''}; recoil ${d.recoil}%, residual ${d.pct}%, dissection ${DISSECTION_EN[d.dissection]}.${d.rupture ? ' Rupture: contrast extravasation!' : ''}${d.dcbResult === 'ok' ? ' DCB criteria met.' : d.dcbResult === 'needs-stent' ? ' DCB criteria not met: consider a stent.' : ''}`,
      stentDeployed: (d) => `${STENT_EN[d.type]} ${d.diameter}×${d.length} mm stent: residual ${d.pct}%.${d.notes.map((n) => ` ${NOTE_EN[n]}`).join('')}${d.rupture ? ' Rupture!' : ''}`,
      completion: (d) => `Completion: residual ${d.pct}%, gradient ${d.gradient} mmHg.`
    },
    dissection: DISSECTION_EN
  }
};

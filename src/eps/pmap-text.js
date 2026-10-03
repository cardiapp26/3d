// Texts of the pace mapping panel (pmap-panel.js): scenarios, named sites,
// controls, the reading and the pitfall each scenario teaches. Written for
// this teaching grid after a lecture on pace mapping principles and pitfalls
// (J. Cooper, arrhythmia education video series); numbers are the grid's
// own, not clinical values.

export const PMAP_TEXT = {
  tr: {
    tab: 'Pace map',
    heading: 'Pace mapping',
    intro: 'Kateteri haritada bir noktaya koyun (tıklayın ya da ok tuşları): o noktadan pacing ile oluşan QRS (sarı), klinik atımın şablonuyla (yeşil) 12 derivasyonda karşılaştırılır. Eşleşme, QRS başlangıcına hizalanmış korelasyonların ortalamasıdır.',
    scenario: 'Senaryo', template: 'Klinik şablon', site: 'Noktaya git', output: 'Pacing çıkışı', ci: 'Eşleşme aralığı (ms)', mode: 'Ritim',
    sitePick: 'Seçin…',
    outputs: { threshold: 'Eşik (en düşük yakalayan)', mid: '5 mA', high: '10 mA' },
    modes: { sinus: 'Sinüs ritminde (pace map)', vt: 'VT sırasında (entrainment)' },
    templates: { pvc: 'Klinik PVC', vt1: 'VT 1', vt2: 'VT 2 (aynı devre, ters yön)' },
    fusion: 'Füzyonlu atım', scoremap: 'Eşleşme haritası', truth: 'Gerçek kaynağı göster',
    clinicalCi: 'klinik',
    readout: {
      score: 'Eşleşme (12 derivasyon)', sqrs: 'Stim-QRS', paced: 'Paced QRS süresi', clinical: 'Klinik QRS süresi',
      tcl: 'VT siklusu', ppi: 'PPI - TCL', purkinje: 'Purkinje potansiyeli', purkinjeValue: (ms) => (ms >= 0 ? `QRS'ten ${ms} ms önce` : `QRS'ten ${-ms} ms sonra`),
      weak: 'Uymayan derivasyonlar', none: 'yok', captured: 'Yakalanan doku'
    },
    capturedKinds: { wall: 'miyokard', pap: 'papiller kas', channel: 'skar içi kanal', purkinje: 'Purkinje' },
    verdict: {
      good: 'Çok iyi eşleşme: 12 derivasyonda aynı morfoloji.',
      close: 'Benzer ama aynı değil: yakın olabilirsiniz; her çentiği karşılaştırın.',
      poor: 'Uyumsuz morfoloji.',
      none: 'QRS yok: yakalama yok ya da dalga skardan çıkamıyor.'
    },
    warn: {
      long: 'Uzun stim-QRS (40 ms üstü): uyarı yavaş iletim kanalında başlıyor. Tek başına doğru ablasyon yeri anlamına gelmez.',
      output: 'Çıkış eşik üstünde: sanal elektrot birden çok dokuyu yakalıyor. Morfolojiyi eşikte değerlendirin.',
      contact: 'Kateter iki ayrı yüzeye temas ediyor (papiller kas ve serbest duvar): yakalanan doku tek bir nokta değil.',
      fast: 'Pacing klinik eşleşme aralığından belirgin hızlı: henüz toparlanmamış doku dalgayı saptırır.',
      fusion: 'Füzyon: atım saf paced değil, sinüs dalgası ile karışık. Arka arkaya aynı morfolojiyi görmeden karşılaştırmayın.',
      purkinje: 'Purkinje ile birlikte lokal miyokard da yakalanıyor: doğru yerde bile pace map tam uymayabilir.',
      scar: 'Yoğun skar: yakalama yok.'
    },
    legend: (lo) => `eşleşme: kırmızı en iyi, mor ${lo} % altı`,
    ecgTitle: 'Yeşil: klinik şablon · Sarı: pacing (QRS başlangıcına hizalı) · çizgi: stimulus',
    ecgTitleShort: 'Yeşil: şablon · Sarı: pacing · çizgi: stimulus',
    segments: { septal: 'Septum', anterior: 'Anterior', lateral: 'Lateral', inferior: 'İnferior' },
    base: 'Baz', apex: 'Apeks',
    scenarios: {
      focal: {
        name: 'Fokal PVC, düzgün miyokard',
        sites: { origin: 'Kaynak', near: 'Kaynağın 1 cm yakını', far: 'Uzak nokta' },
        lesson: 'Temel ilke: aynı noktadan başlayan dalga aynı yolla yayılır ve aynı QRS\'i verir. Kateteri gezdirin: eşleşme kaynağa yaklaştıkça artar ve yalnız birkaç mm içinde %97 üstüne çıkar. Düzgün miyokardda çıkışı artırmak QRS\'i pek değiştirmez. Eşleşme aralığını kısaltın (340 ve 280 ms): toparlanmamış bir bant dalgayı saptırır ve aynı noktadan farklı QRS çıkar. "Füzyonlu atım" bir sinüs dalgasının karışmasını gösterir.',
        truth: 'Kaynak: anterior duvar, bazal bölge. Uzun refrakter bant anterior ile lateral duvar arasında.'
      },
      papillary: {
        name: 'Papiller kas PVC',
        sites: { base: 'Papiller kas tabanı (kaynak)', tip: 'Papiller kas ucu', between: 'Papiller kas ile duvar arası', wall: 'Bitişik duvar' },
        lesson: 'PVC papiller kasın içinden çıkar ve kası tabanından terk eder. Ucundan eşikte pacing de aynı yolla çıkar: eşleşme iyi, stim-QRS daha uzun. Kateter birkaç mm kayıp hem papiller kasa hem serbest duvara değdiğinde eşleşme düşer; doğru yerin hemen yanında olsanız da uzak görünürsünüz. Papiller kasta 5 ve 10 mA bitişik duvarı da yakalar: her noktada eşiğe inin.',
        truth: 'Kaynak: papiller kasın tabana yakın kısmı. Papiller kas duvara yalnız tabanından bağlı; yanındaki duvar elektriksel olarak ayrı.'
      },
      fascicular: {
        name: 'Fasiküler PVC / VT',
        sites: { origin: 'Kaynak (sol posterior fasikül)', septum: 'Orta septum' },
        lesson: 'Purkinje kaynaklı atım ağın uçlarından birçok noktadan aynı anda miyokarda çıkar: QRS dardır. Kaynağın üstünden pacing hem Purkinje lifini hem altındaki lokal miyokardı yakalar; eşikte bile ayırmak neredeyse imkânsızdır. Bu yüzden doğru yerde bile eşleşme tam değildir; eşleşme haritasında hiçbir nokta tam uymaz. Burada aktivasyon haritalaması (en erken Purkinje potansiyeli) daha güvenilirdir.',
        truth: 'Kaynak: sol posterior fasikülün orta kısmı; proksimal ağ yalıtılmış, miyokarda distal uçlardan bağlanıyor.'
      },
      scar: {
        name: 'Skar ilişkili VT',
        sites: { isthmus: 'Kritik isthmus (orta)', deep: 'İsthmus, çıkışa yakın', exit: 'Çıkış (skar kenarı)', bystander: 'Bystander kanal', strand: 'Bitişik ayrı demet', remote: 'Uzak normal miyokard' },
        lesson: 'Voltaj haritasında tek renk görünen skar; içinde ayrı ayrı iletken demetler taşır. Sinüs ritminde isthmustan pacing iki uçtan (giriş ve çıkış) birden çıkar: QRS VT\'ye uymaz, oysa burası doğru ablasyon yeridir. Aynı noktada "VT sırasında" seçin: giriş fonksiyonel blokta, QRS birebir uyar ve PPI - TCL 0 olur. Bystander kanal uzun stim-QRS ile birebir uyar ama devrede değildir (PPI - TCL uzun). Çıkışa yakın isthmusta eşikte uyum varken 5-10 mA bitişik demeti yakalar: stim-QRS birden kısalır, QRS değişir. Eşleşme aralığını 340 ms\'ye indirin: çıkış kanalı toparlanamaz ve dalga girişten çıkar (VT 2 morfolojisi).',
        truth: 'Devre: giriş (E, yavaş) ile çıkış (X) arasındaki isthmus, skar çevresinden geri döner. Bystander kanal çıkış tarafına bağlı çıkmaz sokak. Bitişik demet isthmusa dokunur ama bağlı değil; skarın ince olduğu yerden (Y) hemen çıkar.'
      }
    },
    source: 'Kavramlar: pace mapping ilkeleri ve tuzakları (J. Cooper, aritmi eğitim video dizisi): sanal elektrot ve çıkış, eşikte pacing, eşleşme aralığı, füzyon ve temas, papiller kas, fasiküler kaynak, skarda bystander, çoklu çıkış ve fonksiyonel blok. Izgara, QRS ve sayılar öğretim için tasarlanmıştır.'
  },
  en: {
    tab: 'Pace map',
    heading: 'Pace mapping',
    intro: 'Put the catheter on a point of the map (click, or the arrow keys): the QRS paced from there (yellow) is compared with the clinical template (green) in twelve leads. The match is the mean of the correlations aligned at QRS onset.',
    scenario: 'Scenario', template: 'Clinical template', site: 'Go to a site', output: 'Pacing output', ci: 'Coupling interval (ms)', mode: 'Rhythm',
    sitePick: 'Choose…',
    outputs: { threshold: 'Threshold (lowest that captures)', mid: '5 mA', high: '10 mA' },
    modes: { sinus: 'In sinus rhythm (pace map)', vt: 'During VT (entrainment)' },
    templates: { pvc: 'Clinical PVC', vt1: 'VT 1', vt2: 'VT 2 (same circuit, reverse direction)' },
    fusion: 'Fused beat', scoremap: 'Match map', truth: 'Show the true source',
    clinicalCi: 'clinical',
    readout: {
      score: 'Match (12 leads)', sqrs: 'Stim-QRS', paced: 'Paced QRS duration', clinical: 'Clinical QRS duration',
      tcl: 'VT cycle length', ppi: 'PPI - TCL', purkinje: 'Purkinje potential', purkinjeValue: (ms) => (ms >= 0 ? `${ms} ms before the QRS` : `${-ms} ms after the QRS`),
      weak: 'Leads that differ', none: 'none', captured: 'Captured tissue'
    },
    capturedKinds: { wall: 'myocardium', pap: 'papillary muscle', channel: 'channel in scar', purkinje: 'Purkinje' },
    verdict: {
      good: 'Excellent match: the same morphology in all twelve leads.',
      close: 'Similar but not the same: you may be close; compare every notch.',
      poor: 'Different morphology.',
      none: 'No QRS: no capture, or the wave cannot leave the scar.'
    },
    warn: {
      long: 'Long stim-QRS (over 40 ms): the stimulus starts in a slowly conducting channel. On its own it does not mark the ablation site.',
      output: 'Output above threshold: the virtual electrode captures more than one tissue. Judge the morphology at threshold.',
      contact: 'The catheter touches two separate surfaces (papillary muscle and free wall): the captured tissue is not one point.',
      fast: 'Pacing clearly faster than the clinical coupling interval: tissue not yet recovered diverts the wave.',
      fusion: 'Fusion: not a pure paced beat but one mixed with the sinus wave. Compare only after the same morphology repeats.',
      purkinje: 'Local myocardium is captured with the Purkinje fibre: even at the right site the pace map may not match fully.',
      scar: 'Dense scar: no capture.'
    },
    legend: (lo) => `match: red best, purple below ${lo} %`,
    ecgTitle: 'Green: clinical template · Yellow: paced (aligned at QRS onset) · line: stimulus',
    ecgTitleShort: 'Green: template · Yellow: paced · line: stimulus',
    segments: { septal: 'Septal', anterior: 'Anterior', lateral: 'Lateral', inferior: 'Inferior' },
    base: 'Base', apex: 'Apex',
    scenarios: {
      focal: {
        name: 'Focal PVC, smooth myocardium',
        sites: { origin: 'Source', near: '1 cm from the source', far: 'Remote site' },
        lesson: 'The principle: a wave starting at the same point spreads the same way and gives the same QRS. Move the catheter: the match rises toward the source and passes 97 % only within a few mm. In smooth myocardium a higher output hardly changes the QRS. Shorten the coupling interval (340 and 280 ms): a band not yet recovered diverts the wave and the same site gives another QRS. "Fused beat" shows a sinus wave mixing in.',
        truth: 'Source: anterior wall, basal region. The band with a long refractory period lies between the anterior and lateral walls.'
      },
      papillary: {
        name: 'Papillary muscle PVC',
        sites: { base: 'Papillary muscle base (source)', tip: 'Papillary muscle tip', between: 'Between the papillary muscle and the wall', wall: 'Adjacent wall' },
        lesson: 'The PVC arises inside the papillary muscle and leaves it at its base. Pacing at threshold from the tip leaves the same way: a good match with a longer stim-QRS. When the catheter slips a few mm and touches both the papillary muscle and the free wall, the match drops: right beside the correct site you look far away. On the papillary muscle 5 and 10 mA also capture the adjacent wall: go down to threshold at every site.',
        truth: 'Source: the papillary muscle near its base. The papillary muscle joins the wall at its base only; the wall beside it is electrically separate.'
      },
      fascicular: {
        name: 'Fascicular PVC / VT',
        sites: { origin: 'Source (left posterior fascicle)', septum: 'Mid septum' },
        lesson: 'A Purkinje beat leaves the network at many points at once: the QRS is narrow. Pacing over the source captures the Purkinje fibre and the local myocardium beneath it; even at threshold they can hardly be separated. So even at the right site the match is incomplete, and no point of the match map fits fully. Activation mapping (the earliest Purkinje potential) is more reliable here.',
        truth: 'Source: the middle of the left posterior fascicle; the proximal network is insulated and joins the myocardium at its distal ends.'
      },
      scar: {
        name: 'Scar-related VT',
        sites: { isthmus: 'Critical isthmus (middle)', deep: 'Isthmus near the exit', exit: 'Exit (scar border)', bystander: 'Bystander channel', strand: 'Adjacent separate strand', remote: 'Remote normal myocardium' },
        lesson: 'Scar that looks uniform on a voltage map holds separate conducting strands. In sinus rhythm, pacing in the isthmus leaves through both ends (entrance and exit): the QRS does not match the VT, yet this is the right ablation site. Choose "During VT" at the same site: the entrance is in functional block, the QRS matches exactly and PPI - TCL is 0. A bystander channel matches exactly with a long stim-QRS but is not in the circuit (long PPI - TCL). At the isthmus near the exit the match holds at threshold, while 5-10 mA capture the adjacent strand: the stim-QRS suddenly shortens and the QRS changes. Lower the coupling interval to 340 ms: the exit channel cannot recover and the wave leaves through the entrance (the VT 2 morphology).',
        truth: 'Circuit: the isthmus between the entrance (E, slow) and the exit (X), returning around the scar. The bystander channel is a dead end on the exit side. The adjacent strand touches the isthmus but is not connected; it leaves at once where the scar is thin (Y).'
      }
    },
    source: 'Concepts: pace mapping principles and pitfalls (J. Cooper, arrhythmia education video series): virtual electrode and output, pacing at threshold, coupling interval, fusion and contact, papillary muscle, fascicular source, bystanders in scar, multiple exits and functional block. Grid, QRS and numbers are designed for teaching.'
  }
};

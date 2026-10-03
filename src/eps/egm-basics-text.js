// Texts of the EGM basics tab (egm-basics-panel.js): short captions beside
// diagrams. Content follows an introductory lecture on intracardiac
// electrograms and the EP laboratory (J. Cooper, arrhythmia education video
// series), with the caveats a learner needs; numbers are the tab's own
// teaching values.

export const BASICS_TEXT = {
  tr: {
    tab: 'EGM temelleri',
    heading: 'İntrakardiyak elektrogram temelleri',
    intro: 'Her kartta bir şemayı oynatın: dalga cephesi, filtre, kateter, aralık, blok seviyesi, dekremental iletim.',
    play: 'Oynat', pause: 'Duraklat',
    poles: {
      title: 'Bir dalga, iki kayıt',
      source: 'Dalga', origin: 'Elektrodun altında başlıyor (odak)', passing: 'Elektrodun yanından geçiyor',
      angle: 'Yön (çift eksenine göre)', spacing: 'Kutup aralığı', far: 'Uzak alan (uzak odacık)',
      unipolar: 'Unipolar', bipolar: 'Bipolar', farName: 'uzak alan', local: 'yerel',
      chips: { morphology: 'Unipolar şekil', amp: 'Bipolar yerel sinyal (unipolar = 100)', ratio: 'Bipolar uzak alan / unipolar uzak alan' },
      note: 'Bipolar uzak alanı belirgin azaltır, silmez. Dalga çift eksenine dik gelirse yerel sinyal de kaybolur.',
      qsHint: 'Odakta başlayan dalga: saf QS (yaklaşma fazı yok).'
    },
    filters: {
      title: 'Filtre bandı sinyali nasıl bozar',
      hp: 'Alt sınır (Hz)', lp: 'Üst sınır (Hz)', raw: 'ham', filtered: 'filtreli',
      presets: 'Standart', bipolarPreset: 'Bipolar 30-500', unipolarPreset: 'Unipolar geniş bant',
      chips: { qs: 'QS korunuyor', overshoot: 'Dönüş sapması', slope: 'En dik iniş', wander: 'Taban oynaması' },
      yes: 'evet', no: 'hayır',
      note: 'Bipolar 30-500 Hz. Unipolarda alt sınır düşük tutulur (laboratuvara göre 0,05 ile 1 Hz); yüksek alt sınır QS\'i bozar.'
    },
    catheters: {
      title: 'Dört kateter, ne kaydeder',
      pick: 'Bir katetere dokunun',
      items: {
        hra: { name: 'HRA', where: 'Yüksek sağ atriyum', lines: ['Erken atriyal potansiyel (A).', 'Sinüs nodunun kendisini değil, yakın bölgesini kaydeder.', 'Atriyal pacing.'] },
        his: { name: 'HIS', where: 'Koch üçgeni tepesi, triküspit septal anulus', lines: ['A, H, V sırası. H süresi yaklaşık 15-25 ms.', 'Anlamlı His için A ve V\'nin birlikte görünmesi gerekir.', 'AH ve HV, blok seviyesi.'] },
        cs: { name: 'CS', where: 'Koroner sinüs, AV oluk', lines: ['Sol atriyum (A) ve sol ventrikül (V) birlikte.', 'Sinüste proksimalden distale aktivasyon.', 'Sol atriyal sıra, sol aksesuar yol.'] },
        rv: { name: 'RVA', where: 'Sağ ventrikül apeksi', lines: ['Ventriküler potansiyel (V).', 'Ventriküler pacing.', 'VA iletimi.'] }
      }
    },
    intervals: {
      title: 'PA, AH, HV: normal aralıklar',
      pa: 'PA', ah: 'AH', hv: 'HV',
      what: { pa: 'sağ atriyal iletim', ah: 'AV düğüm, dekremental ve otonom duyarlı', hv: 'His-Purkinje, sabit' },
      states: { short: 'kısa', normal: 'normal', long: 'uzun', borderline: 'sınırda', high: 'çok uzun' },
      hvLimits: 'HV: 55 ms üstü sınırda, 70 ms üstü anormal, 100 ms ve üstü yüksek risk.'
    },
    block: {
      title: 'Blok hangi seviyede?',
      cases: {
        normal: 'Normal iletim',
        'nodal-first-degree': 'Birinci derece (uzun AH)',
        'wenckebach-nodal': 'Wenckebach, dar QRS',
        'intra-his': 'His içi blok (H bölünmüş)',
        'mobitz2-infra': 'Mobitz 2, geniş QRS',
        'mobitz1-infra': 'Mobitz 1 şekli, geniş QRS'
      },
      flow: { a: 'A', h: 'H', hh: 'H\'', v: 'V' },
      flowTitle: 'Bloke atımda: yeşil görülen, kırmızı görülmeyen sinyal',
      levels: {
        normal: ['Blok yok', 'A, H, V sırayla; aralıklar normal.'],
        delay: ['AV düğümde gecikme', 'Blok yok; AH uzun. Seviye düğüm.'],
        nodal: ['AV düğüm', 'A var, H yok. AH vuru vuru uzar. Genelde iyi seyirli.'],
        intraHis: ['His içi', 'H var, H\' ve V yok. Bölünmüş His burada seviyeyi belirler.'],
        infraHis: ['His altı', 'A ve H var, V yok. Kalıcı pil endikasyonu güçlü; aciliyet semptoma ve riske göre.']
      },
      caveat: 'Seviye yüzey EKG\'den kesin çıkmaz: geniş QRS\'li Mobitz 1 sıklıkla His altıdır. Karar A-H-V kaydıyla verilir.'
    },
    decremental: {
      title: 'Dekremental AV düğüm ve AH sıçraması',
      a1a2: 'A1-A2 (ms)', dual: 'Yavaş yol var', play: 'A2\'yi öne çek',
      chips: { ah: 'AH', path: 'Yol', jump: 'En büyük adım' },
      paths: { fast: 'hızlı', slow: 'yavaş' },
      block: 'İletim yok (düğüm ERP)',
      jumpNote: '10 ms\'lik adımda AH 50 ms ve üstü uzarsa sıçrama: yavaş yola geçiş.'
    },
    source: 'Kavramlar: intrakardiyak elektrogram ve EP laboratuvarına giriş (J. Cooper, aritmi eğitim video dizisi). Sinyaller ve sayılar öğretim için tasarlanmıştır.'
  },
  en: {
    tab: 'EGM basics',
    heading: 'Intracardiac electrogram basics',
    intro: 'Play one diagram per card: wavefront, filter, catheter, interval, block level, decremental conduction.',
    play: 'Play', pause: 'Pause',
    poles: {
      title: 'One wave, two recordings',
      source: 'Wave', origin: 'Starts under the electrode (focus)', passing: 'Passes the electrode',
      angle: 'Direction (to the pair axis)', spacing: 'Pole spacing', far: 'Far field (distant chamber)',
      unipolar: 'Unipolar', bipolar: 'Bipolar', farName: 'far field', local: 'local',
      chips: { morphology: 'Unipolar shape', amp: 'Bipolar local signal (unipolar = 100)', ratio: 'Bipolar far field / unipolar far field' },
      note: 'Bipolar reduces far field markedly; it does not erase it. A wave crossing the pair axis at a right angle loses the local signal too.',
      qsHint: 'A wave starting at the focus: pure QS (no approach phase).'
    },
    filters: {
      title: 'How the filter band changes the signal',
      hp: 'High-pass (Hz)', lp: 'Low-pass (Hz)', raw: 'raw', filtered: 'filtered',
      presets: 'Standard', bipolarPreset: 'Bipolar 30-500', unipolarPreset: 'Unipolar wide band',
      chips: { qs: 'QS preserved', overshoot: 'Rebound', slope: 'Steepest downstroke', wander: 'Baseline wander' },
      yes: 'yes', no: 'no',
      note: 'Bipolar 30-500 Hz. Unipolar keeps the high-pass low (0.05 to 1 Hz depending on the laboratory); a high cut-off breaks the QS.'
    },
    catheters: {
      title: 'Four catheters, what each records',
      pick: 'Touch a catheter',
      items: {
        hra: { name: 'HRA', where: 'High right atrium', lines: ['Early atrial potential (A).', 'Near the sinus node region, not the node itself.', 'Atrial pacing.'] },
        his: { name: 'HIS', where: 'Apex of the triangle of Koch, tricuspid septal annulus', lines: ['A, H, V in order. H lasts about 15-25 ms.', 'A meaningful His needs A and V together.', 'AH and HV, block level.'] },
        cs: { name: 'CS', where: 'Coronary sinus, AV groove', lines: ['Left atrium (A) and left ventricle (V) together.', 'Proximal to distal activation in sinus.', 'Left atrial sequence, left accessory pathway.'] },
        rv: { name: 'RVA', where: 'Right ventricular apex', lines: ['Ventricular potential (V).', 'Ventricular pacing.', 'VA conduction.'] }
      }
    },
    intervals: {
      title: 'PA, AH, HV: normal ranges',
      pa: 'PA', ah: 'AH', hv: 'HV',
      what: { pa: 'right atrial conduction', ah: 'AV node, decremental and autonomic', hv: 'His-Purkinje, fixed' },
      states: { short: 'short', normal: 'normal', long: 'long', borderline: 'borderline', high: 'very long' },
      hvLimits: 'HV: above 55 ms borderline, above 70 ms abnormal, 100 ms or more high risk.'
    },
    block: {
      title: 'At what level is the block?',
      cases: {
        normal: 'Normal conduction',
        'nodal-first-degree': 'First degree (long AH)',
        'wenckebach-nodal': 'Wenckebach, narrow QRS',
        'intra-his': 'Intra-His block (split H)',
        'mobitz2-infra': 'Mobitz 2, wide QRS',
        'mobitz1-infra': 'Mobitz 1 pattern, wide QRS'
      },
      flow: { a: 'A', h: 'H', hh: 'H\'', v: 'V' },
      flowTitle: 'In the blocked beat: green seen, red absent',
      levels: {
        normal: ['No block', 'A, H, V in order; intervals normal.'],
        delay: ['Delay in the AV node', 'No block; long AH. The level is the node.'],
        nodal: ['AV node', 'A with no H. AH lengthens beat by beat. Usually benign.'],
        intraHis: ['Intra-His', 'H seen, H\' and V absent. A split His sets the level here.'],
        infraHis: ['Infra-His', 'A and H seen, V absent. A strong permanent pacing indication; urgency depends on symptoms and risk.']
      },
      caveat: 'The surface ECG does not settle the level: Mobitz 1 with a wide QRS is often infra-Hisian. The A-H-V recording decides.'
    },
    decremental: {
      title: 'The decremental AV node and the AH jump',
      a1a2: 'A1-A2 (ms)', dual: 'Slow pathway present', play: 'Bring A2 earlier',
      chips: { ah: 'AH', path: 'Pathway', jump: 'Largest step' },
      paths: { fast: 'fast', slow: 'slow' },
      block: 'No conduction (node ERP)',
      jumpNote: 'AH lengthening by 50 ms or more in a 10 ms step is a jump: conduction moved to the slow pathway.'
    },
    source: 'Concepts: introduction to intracardiac electrograms and the EP laboratory (J. Cooper, arrhythmia education video series). Signals and numbers are designed for teaching.'
  }
};

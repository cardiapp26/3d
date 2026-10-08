// Texts of the mapping basics panel (emap-panel.js): the controls, the
// reading at the catheter, the reasons a map can mislead, and the
// experiments to try. Written after Cardiac Mapping, 5th ed. (Shenasa,
// Hindricks, Callans, Miller, Josephson; Wiley 2019): chapter 7 (Ng, Roney,
// Cantwell, Peters: fundamentals of cardiac mapping), chapter 16 (new
// high-density and automated mapping systems) and chapter 21 (contact
// force). The patch and its numbers are the model's own.

export const EMAP_TEXT = {
  tr: {
    tab: 'Harita temelleri',
    heading: 'Elektroanatomik haritalamanın temelleri',
    intro: 'Aynı doku, farklı ölçüm: 36 × 24 mm\'lik bir miyokard yamasında skar ve içinden geçen 1 mm\'lik canlı bir kanal var. Harita, kateterin, temasın, dalga yönünün, nokta sayısının ve LAT işaretleme kuralının ürünüdür. Haritaya tıklayarak kateteri taşıyın.',
    map: 'Harita', catheter: 'Kateter', orientation: 'Bipol yönü', wave: 'Pacing (dalga yönü)', contact: 'Temas', spacing: 'Nokta aralığı', annotation: 'LAT işaretleme', site: 'Noktaya git',
    sitePick: 'Seçin…',
    maps: { bipolar: 'Bipolar voltaj', unipolar: 'Unipolar voltaj', lat: 'Aktivasyon (LAT)' },
    catheters: { ablation: 'Ablasyon: 3,5 mm uç + halka', pentaray: 'Yüksek yoğunluk: 0,8 mm², 2 mm aralık', orion: 'Mini sepet: 0,4 mm², 2,5 mm aralık' },
    orientations: { x: 'Yatay (soldan sağa)', y: 'Dikey (yukarıdan aşağı)', best: 'İki yönün büyüğü (çok elektrotlu)' },
    waves: { left: 'Soldan (yatay dalga)', top: 'Yukarıdan (dikey dalga)' },
    contacts: { good: 'İyi temas', light: 'Hafif temas', poor: 'Zayıf temas' },
    spacings: { 1: '1 mm (yüksek yoğunluk)', 3: '3 mm', 6: '6 mm (seyrek)' },
    annotations: { firstSharp: 'Bipolar: ilk keskin tepe', maxPeak: 'Bipolar: en büyük tepe', unipolar: 'Unipolar: en dik iniş (-dV/dt)' },
    truth: 'Gerçek dokuyu göster', points: 'Noktaları göster',
    legend: {
      bipolar: 'kırmızı < 0,5 mV · ara renkler 0,5-1,5 mV · mor > 1,5 mV · gri: nokta yok',
      unipolar: 'kırmızı düşük · mor yüksek (unipolar far-field\'ı da görür) · gri: nokta yok',
      lat: (min, max) => `en erken ${min} ms · en geç ${max} ms · gri: nokta yok ya da sinyal yok`
    },
    traceTitle: 'Kateterde kayıt: distal unipolar (mavi) ve bipolar (beyaz); yeşil çizgi gerçek lokal aktivasyon',
    marks: { truth: 'gerçek', firstSharp: 'ilk keskin', maxPeak: 'en büyük', unipolar: 'uni -dV/dt' },
    tissues: { healthy: 'sağlam miyokard', border: 'sınır zonu', scar: 'yoğun skar', channel: 'canlı kanal' },
    sites: { healthy: 'Sağlam miyokard', border: 'Sınır zonu', channel: 'Kanal ortası', scar: 'Yoğun skar', channelEnd: 'Kanal girişi' },
    readout: {
      tissue: 'Gerçek doku', bipolar: 'Bipolar voltaj', unipolar: 'Unipolar voltaj', reads: 'Haritada görünen', truth: 'Gerçek LAT',
      firstSharp: 'İlk keskin tepe', maxPeak: 'En büyük tepe', unipolarLat: 'Unipolar -dV/dt', spread: 'Yöntemler arası fark', channel: 'Kanalın görünen kısmı', points: 'Harita noktası',
      classes: { scar: 'skar', border: 'sınır zonu', normal: 'normal' }
    },
    verdict: {
      right: 'Harita bu noktada dokuyu doğru gösteriyor.',
      falseScar: 'Bu nokta canlı doku, ama voltajı skar eşiğinin altında okunuyor.',
      falseLow: 'Bu nokta sağlam doku, ama voltajı düşük okunuyor (sahte sınır zonu ya da skar).',
      noise: 'Yoğun skar: gürültü düzeyinde sinyal, LAT işaretlenmez.',
      causes: {
        catheter: 'Büyük elektrot geniş alanı ortalar ve far-field\'a duyarlıdır; ince kanal skar gibi görünür.',
        contact: 'Temas zayıf: elektrot dokudan uzaklaştıkça voltaj hızla düşer.',
        orientation: 'Bipol dalga cephesine paralel: iki elektrot aynı anda aktive olur, fark küçüktür. Başka yönden pacing ya da çok elektrotlu kateter bunu giderir.',
        spacing: 'Nokta seyrek: interpolasyon aradaki kanalı kapatır.'
      }
    },
    lesson: 'Denenecekler: (1) Kateteri "Ablasyon" yapın: kanal skar içinde kaybolur; "Mini sepet"e geçin, aynı yerde kanal görünür (Bölüm 16, Şekil 16.1). (2) Pacing\'i "Yukarıdan" yapın: yatay bipol sağlam dokuda bile düşük voltaj okur; "İki yönün büyüğü" bunu düzeltir. (3) Temas zayıfladıkça voltaj düşer: düşük voltaj her zaman skar değildir. (4) Nokta aralığını 6 mm yapın: kanal interpolasyonda kaybolur. (5) LAT haritasında işaretleme kuralını değiştirin: sağlam dokuda yöntemler birkaç ms içinde uyuşur, kanal girişindeki çift bileşenli sinyalde onlarca ms ayrışır.',
    source: 'Kaynak: Cardiac Mapping, 5. baskı (Wiley 2019): Bölüm 7 (unipolar LAT = en dik negatif eğim; bipolar sinyal far-field\'ı azaltır ama dalga yönüne duyarlıdır; bipolarde ilk keskin near-field tepe tercih edilir), Bölüm 16 (≥ 3,5 mm elektrot uzamsal çözünürlüğü düşürür; < 1 mm elektrot ve ≤ 2,5 mm aralık skar sanılan yerde canlı doku gösterebilir; başka yerden pacing dalga yönü etkisini giderir), Bölüm 21 (temas kuvveti; ablasyonda hedef 20 g, 10-30 g). Yama ve sayılar öğretim için tasarlanmıştır.'
  },
  en: {
    tab: 'Mapping basics',
    heading: 'Basics of electroanatomical mapping',
    intro: 'Same tissue, different measurement: a 36 × 24 mm patch of myocardium holds a scar with a 1 mm surviving channel through it. The map is a product of the catheter, the contact, the wavefront direction, the number of points and the LAT annotation rule. Click the map to move the catheter.',
    map: 'Map', catheter: 'Catheter', orientation: 'Bipole direction', wave: 'Pacing (wavefront)', contact: 'Contact', spacing: 'Point spacing', annotation: 'LAT annotation', site: 'Go to site',
    sitePick: 'Choose…',
    maps: { bipolar: 'Bipolar voltage', unipolar: 'Unipolar voltage', lat: 'Activation (LAT)' },
    catheters: { ablation: 'Ablation: 3.5 mm tip + ring', pentaray: 'High density: 0.8 mm², 2 mm spacing', orion: 'Mini basket: 0.4 mm², 2.5 mm spacing' },
    orientations: { x: 'Horizontal (left to right)', y: 'Vertical (top to bottom)', best: 'Larger of both (multielectrode)' },
    waves: { left: 'From the left (horizontal wave)', top: 'From the top (vertical wave)' },
    contacts: { good: 'Good contact', light: 'Light contact', poor: 'Poor contact' },
    spacings: { 1: '1 mm (high density)', 3: '3 mm', 6: '6 mm (sparse)' },
    annotations: { firstSharp: 'Bipolar: first sharp peak', maxPeak: 'Bipolar: largest peak', unipolar: 'Unipolar: steepest downstroke (-dV/dt)' },
    truth: 'Show the true tissue', points: 'Show the points',
    legend: {
      bipolar: 'red < 0.5 mV · middle colours 0.5-1.5 mV · purple > 1.5 mV · grey: no point',
      unipolar: 'red low · purple high (the unipolar also sees the far field) · grey: no point',
      lat: (min, max) => `earliest ${min} ms · latest ${max} ms · grey: no point or no signal`
    },
    traceTitle: 'Recording at the catheter: distal unipolar (blue) and bipolar (white); green line the true local activation',
    marks: { truth: 'true', firstSharp: 'first sharp', maxPeak: 'largest', unipolar: 'uni -dV/dt' },
    tissues: { healthy: 'healthy myocardium', border: 'border zone', scar: 'dense scar', channel: 'surviving channel' },
    sites: { healthy: 'Healthy myocardium', border: 'Border zone', channel: 'Channel centre', scar: 'Dense scar', channelEnd: 'Channel entrance' },
    readout: {
      tissue: 'True tissue', bipolar: 'Bipolar voltage', unipolar: 'Unipolar voltage', reads: 'Reads on the map as', truth: 'True LAT',
      firstSharp: 'First sharp peak', maxPeak: 'Largest peak', unipolarLat: 'Unipolar -dV/dt', spread: 'Spread between rules', channel: 'Channel seen on the map', points: 'Map points',
      classes: { scar: 'scar', border: 'border zone', normal: 'normal' }
    },
    verdict: {
      right: 'The map shows the tissue correctly here.',
      falseScar: 'This site is viable tissue, but its voltage reads below the scar cut-off.',
      falseLow: 'This site is healthy tissue, but its voltage reads low (a false border zone or scar).',
      noise: 'Dense scar: a signal at the noise level, no LAT is annotated.',
      causes: {
        catheter: 'A large electrode averages a wide area and is sensitive to far field; a narrow channel looks like scar.',
        contact: 'Poor contact: voltage falls quickly as the electrode moves off the tissue.',
        orientation: 'The bipole lies along the wavefront: both electrodes activate together and the difference is small. Pacing from another site or a multielectrode catheter overcomes this.',
        spacing: 'Sparse points: interpolation closes over the channel between them.'
      }
    },
    lesson: 'Try: (1) Set the catheter to "Ablation": the channel disappears into the scar; switch to "Mini basket" and the channel shows at the same place (chapter 16, figure 16.1). (2) Pace "From the top": a horizontal bipole reads low voltage even in healthy tissue; "Larger of both" fixes it. (3) Voltage falls as contact weakens: low voltage is not always scar. (4) Set the point spacing to 6 mm: the channel is lost in the interpolation. (5) On the LAT map change the annotation rule: the rules agree within a few ms in healthy tissue and differ by tens of ms on the double-component signal at the channel entrance.',
    source: 'Source: Cardiac Mapping, 5th ed. (Wiley 2019): chapter 7 (unipolar LAT = steepest negative slope; the bipolar signal reduces far field but depends on wavefront direction; the first sharp near-field bipolar peak is preferred), chapter 16 (electrodes ≥ 3.5 mm lower spatial resolution; electrodes < 1 mm with ≤ 2.5 mm spacing can show viable tissue where scar was recorded; pacing from another site overcomes wavefront direction), chapter 21 (contact force; target 20 g, 10-30 g during ablation). The patch and its numbers are designed for teaching.'
  }
};

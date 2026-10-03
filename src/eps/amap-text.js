// Texts of the activation mapping panel (amap-panel.js): scenarios, what to
// try, the pitfall each one teaches and the true mechanism. Written for this
// teaching grid after a lecture on activation mapping basics, pitfalls and
// windowing (J. Cooper, arrhythmia education video series); numbers are the
// grid's own, not clinical values.

export const AMAP_TEXT = {
  tr: {
    tab: 'Haritalama',
    heading: 'Aktivasyon haritası',
    intro: 'Sabit bir referansa göre her noktanın lokal aktivasyon zamanı (LAT) ölçülür; en erken kırmızı, en geç mor gösterilir. Harita yalnız örneklenen noktaları ve yalnız pencereye düşen sinyalleri kullanır.',
    scenario: 'Senaryo', reference: 'Referans', window: 'Pencere (window of interest)', region: 'Haritalanan bölge', scale: 'Renk ölçeği',
    windows: { symmetric: 'Simetrik (± siklusun yarısı)', dePonti: 'De Ponti (orta diyastolden)', mgh: 'MGH (P başlangıcından 40 ms önce)', manual: 'Elle' },
    left: 'Sol kenar (ms)', width: 'Genişlik (% siklus)',
    regions: { ra: 'Yalnız sağ atriyum', both: 'İki atriyum' },
    scales: { even: 'Eşit', compressed: 'Kırmızı daraltılmış' },
    artifact: 'Hatalı nokta ekle', truth: 'Gerçek mekanizmayı göster',
    noDiastole: 'Elektriksel diyastol yok (aktivasyon süresi siklusa eşit ya da uzun): De Ponti penceresi tanımlanamaz.',
    readout: {
      tcl: 'Taşikardi siklusu (X)', act: 'Odacık aktivasyon süresi (Y)',
      easy: 'X, Y\'den belirgin uzun: arada elektriksel diyastol var, pencere neredeyse her yerde doğru çalışır.',
      hard: 'Y, X\'e yaklaşıyor: pencere erken sinyalleri kesebilir ya da komşu atımı katabilir.',
      impossible: 'Y, X\'ten uzun: atımlar üst üste biniyor; hiçbir pencere her noktayı kendi atımına atayamaz.',
      reentry: 'Makroreentrede aktivasyon kesintisizdir: pencere nereye konursa kırmızı oraya kayar; devre erken-geç buluşmasıyla tanınır.',
      windowLabel: 'Pencere', wide: 'Pencere siklustan uzun: komşu atımlar mutlaka katılır.',
      red: 'Kırmızı bölge', eml: 'Erken-geç buluşma', yes: 'var', no: 'yok',
      wrong: 'Komşu atımdan zaman atanan nokta', unannotated: 'Pencereye düşmeyen nokta'
    },
    legendTimes: (min, max) => `en erken ${min} ms · en geç ${max} ms`,
    timeline: { title: 'Zaman çizelgesi: her nokta, ardışık üç atımda', prev: 'önceki atım', cur: 'ilgilenilen atım', next: 'sonraki atım', ref: 'referans', win: 'pencere' },
    scenarios: {
      'focal-ra': {
        name: 'Fokal AT, sağ atriyum yüksek lateral',
        lesson: 'Temel harita. Siklus uzun, aktivasyon hızlı: aralarında diyastol var. Referansı değiştirin: sayılar değişir ama renk haritası aynı kalır. Kırmızıyı daraltan ölçek odağı noktaya indirir. "Hatalı nokta ekle" ile tek bir yanlış LAT\'in kırmızıyı nasıl taşıdığını görün.',
        truth: 'Odak: sağ atriyum yüksek lateral duvar (krista bölgesi). Dalga oradan iki atriyuma yayılır.'
      },
      'focal-la': {
        name: 'Fokal AT, sol atriyum (septuma yakın)',
        lesson: 'Önce yalnız sağ atriyumu haritalayın: en erken alan septumda görünür. Harita yalnız örneklenen noktaların en erkenini gösterir; septumda en erken alan, karşı tarafın da haritalanması gerektiğini düşündürmelidir. Sonra iki atriyumu birlikte haritalayın.',
        truth: 'Odak: sol atriyum, septuma yakın mitral anulus önü. Sağ atriyum septumdan geç aktive olur.'
      },
      flutter: {
        name: 'CTI bağımlı flatter (makroreentre)',
        lesson: 'Kırmızı ile morun yan yana geldiği bir erken-geç buluşma görülür: devre bütün siklusu kaplar. Referansı (CS 5-6, Krista) ya da pencereyi değiştirin: buluşma yeri kayar. Buluşma çizgisi ablasyon yerini göstermez; hedef anatomik olarak en kısa ve uygun hat olan CTI\'dır. Devreyi entrainment doğrular.',
        truth: 'Triküspit anulus çevresinde dönen makroreentre; CTI\'dan geçer. Devre siklusu modelde ölçülür.'
      },
      'focal-cti-line': {
        name: 'Fokal AT, eski CTI ablasyon hattı',
        lesson: 'Odak CTI\'nın medial tarafında ve önceki flatter ablasyonundan kalan blok hattı var. Hattın iki yanında kırmızı ile mor yan yana gelir: makroreentre gibi görünür ama taşikardi fokaldir. Ayrım için entrainment gerekir: lateral istmustan PPI uzundur.',
        truth: 'Odak: CTI medialinde östaki sırtı bölgesi. Geç aktivasyon pasiftir; dalga bloğun etrafından triküspit anulusu dolaşarak lateral istmusa ulaşır.'
      },
      'slow-scar': {
        name: 'Fokal AT, skar ve yavaş iletim',
        lesson: 'Skar çevresinde iletim yavaş; iki atriyumun aktivasyon süresi siklustan uzun. Simetrik pencerede odak geç, uzak alanlar erken görünür; birden çok kırmızı alan ve sahte erken-geç buluşmalar çıkar. Pencereyi kaydırın, De Ponti ve MGH\'yi deneyin: hiçbiri her noktayı kendi atımına atayamaz. Yalnız sağ atriyumu haritalamak burada haritayı netleştirir. Zaman çizelgesinde pencereye hangi atımın girdiğine bakın.',
        truth: 'Odak: sağ atriyum üst septal bölge, SVC yanı. Sol atriyumdaki skar alanları iletimi yavaşlatır; bir atım bitmeden sonraki başlar.'
      }
    },
    source: 'Kavramlar: aktivasyon haritalamanın temelleri, tuzaklar ve pencere seçimi (J. Cooper, aritmi eğitim video dizisi); De Ponti ve MGH pencere yöntemleri. Izgara ve sayılar öğretim için tasarlanmıştır.'
  },
  en: {
    tab: 'Mapping',
    heading: 'Activation map',
    intro: 'Each point\'s local activation time (LAT) is measured against a stable reference; the earliest shows red, the latest purple. The map uses only the sampled points and only the signals that fall in the window.',
    scenario: 'Scenario', reference: 'Reference', window: 'Window of interest', region: 'Mapped region', scale: 'Colour scale',
    windows: { symmetric: 'Symmetric (± half the cycle)', dePonti: 'De Ponti (from mid diastole)', mgh: 'MGH (40 ms before P onset)', manual: 'Manual' },
    left: 'Left edge (ms)', width: 'Width (% of cycle)',
    regions: { ra: 'Right atrium only', both: 'Both atria' },
    scales: { even: 'Even', compressed: 'Narrowed red' },
    artifact: 'Add a wrong point', truth: 'Show the true mechanism',
    noDiastole: 'No electrical diastole (activation time equals or exceeds the cycle): the De Ponti window cannot be defined.',
    readout: {
      tcl: 'Tachycardia cycle length (X)', act: 'Chamber activation time (Y)',
      easy: 'X clearly longer than Y: there is electrical diastole, almost any window works.',
      hard: 'Y approaches X: the window may clip early signals or take in the adjacent beat.',
      impossible: 'Y longer than X: beats overlap; no window can assign every point to its own beat.',
      reentry: 'Activation is continuous in macroreentry: red follows wherever the window is placed; the circuit shows as early meeting late.',
      windowLabel: 'Window', wide: 'Window longer than the cycle: adjacent beats are bound to be included.',
      red: 'Red regions', eml: 'Early meets late', yes: 'present', no: 'none',
      wrong: 'Points timed from an adjacent beat', unannotated: 'Points outside the window'
    },
    legendTimes: (min, max) => `earliest ${min} ms · latest ${max} ms`,
    timeline: { title: 'Timeline: every point over three consecutive beats', prev: 'previous beat', cur: 'beat of interest', next: 'next beat', ref: 'reference', win: 'window' },
    scenarios: {
      'focal-ra': {
        name: 'Focal AT, high lateral right atrium',
        lesson: 'The basic map. Long cycle, fast activation: there is diastole in between. Change the reference: the numbers change but the colour map does not. The narrowed-red scale shrinks the focus to a point. "Add a wrong point" shows how one wrong LAT moves the red.',
        truth: 'Focus: high lateral right atrium (crista region). The wave spreads from there to both atria.'
      },
      'focal-la': {
        name: 'Focal AT, left atrium (near the septum)',
        lesson: 'Map the right atrium only first: the earliest area appears on the septum. The map only shows the earliest of the sampled points; an earliest area on the septum should prompt mapping the other side. Then map both atria.',
        truth: 'Focus: left atrium near the septum, anterior to the mitral annulus. The right atrium activates late from the septum.'
      },
      flutter: {
        name: 'CTI-dependent flutter (macroreentry)',
        lesson: 'Red lies next to purple, early meets late: the circuit fills the whole cycle. Change the reference (CS 5-6, crista) or the window: the meeting point moves. That border does not mark the ablation site; the target is the CTI, the shortest suitable line anatomically. Entrainment confirms the circuit.',
        truth: 'Macroreentry around the tricuspid annulus through the CTI. The cycle length is measured on the grid.'
      },
      'focal-cti-line': {
        name: 'Focal AT with an old CTI ablation line',
        lesson: 'The focus is medial to the CTI and a block line remains from a previous flutter ablation. Red meets purple across the line: it looks like macroreentry but the tachycardia is focal. Entrainment separates them: the PPI from the lateral isthmus is long.',
        truth: 'Focus: the Eustachian ridge region medial to the CTI. The late activation is passive; the wave reaches the lateral isthmus around the tricuspid annulus.'
      },
      'slow-scar': {
        name: 'Focal AT with scar and slow conduction',
        lesson: 'Conduction is slow around scar; activating both atria takes longer than the cycle. With a symmetric window the focus looks late and distant areas early; several red areas and false early-meets-late borders appear. Shift the window, try De Ponti and MGH: none assigns every point to its own beat. Mapping the right atrium only clarifies the map here. Watch on the timeline which beat enters the window.',
        truth: 'Focus: upper septal right atrium beside the SVC. Scar in the left atrium slows conduction; the next beat starts before the last one ends.'
      }
    },
    source: 'Concepts: activation mapping basics, pitfalls and window selection (J. Cooper, arrhythmia education video series); De Ponti and MGH window methods. Grid and numbers are designed for teaching.'
  }
};

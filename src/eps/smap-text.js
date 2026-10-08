// Texts of the substrate mapping panel (smap-panel.js): scenarios, maps,
// electrogram kinds, the entrainment classification and the ablation
// strategies with the evidence behind each. Written after Cardiac Mapping,
// 5th ed. (Shenasa, Hindricks, Callans, Miller, Josephson; Wiley 2019):
// chapter 69 (Romero et al., substrate ablation), chapter 72 (Josephson,
// Almendral et al., resetting and entrainment) and chapter 79 (mapping and
// ablation of VT in coronary artery disease). Grid numbers are the model's
// own, not clinical values.

export const SMAP_TEXT = {
  tr: {
    tab: 'Substrat',
    heading: 'Skar VT: substrat ve entrainment haritalama',
    intro: 'İyileşmiş bir infarktın sol ventrikül haritası. Sinüs ritminde (ya da RV pacing ile) voltaj ve elektrogramlar substratı gösterir; VT sırasında entrainment, kateterin devredeki yerini söyler. Haritaya tıklayın ya da ok tuşlarıyla kateteri taşıyın.',
    scenario: 'Senaryo', map: 'Harita', scarCut: 'Skar eşiği (bipolar)', normalCut: 'Normal eşiği (bipolar)', rhythm: 'Ritim', strategy: 'Ablasyon stratejisi', site: 'Noktaya git',
    sitePick: 'Seçin…',
    maps: { bipolar: 'Bipolar voltaj', unipolar: 'Unipolar voltaj', lat: 'Aktivasyon (LAT)' },
    rhythms: { sinus: 'Sinüs ritmi', rv: 'RV apeks pacing', vt: 'VT sırasında entrainment' },
    strategies: {
      none: 'Ablasyon yok',
      clinical: 'Klinik VT (entrainment ile)',
      lp: 'Geç potansiyeller (LP)',
      dechanneling: 'Skar dechanneling',
      core: 'Core isolation',
      homogenization: 'Skar homojenizasyonu'
    },
    tags: 'LP / LAVA etiketleri', truth: 'Kanalları ve devreyi göster',
    legend: {
      bipolar: (scar, normal) => `kırmızı < ${scar} mV (skar) · ara renkler sınır zonu · mor > ${normal} mV (normal)`,
      unipolar: 'kırmızı düşük · mor ≥ 8,27 mV (LV unipolar normal)',
      lat: (min, max) => `en erken ${min} ms · en geç ${max} ms`,
      latVt: 'QRS başlangıcına göre; kırmızı erken, mor geç (devre: erken-geç buluşması)',
      tagLp: 'LP', tagLava: 'LAVA', lesion: 'lezyon'
    },
    egmTitle: (rhythm) => `Lokal bipolar EGM (beyaz) ve DII (yeşil), ${rhythm}`,
    ecgTitle: 'VT QRS (yeşil) ve entrainment sırasında QRS (sarı); dikey çizgi: stimulus',
    readout: {
      bipolar: 'Bipolar voltaj', unipolar: 'Unipolar voltaj', egm: 'EGM', duration: 'EGM süresi', far: 'Far-field', near: 'Near-field', qrsEnd: 'QRS sonu',
      tcl: 'VT siklusu (TCL)', pcl: 'Pacing siklusu', ppi: 'PPI', ppiDiff: 'PPI - TCL', match: 'QRS eşleşmesi', sqrs: 'S-QRS', egmQrs: 'EGM-QRS', delta: 'S-QRS - EGM-QRS', ratio: 'S-QRS / TCL',
      cls: 'Sınıf', josephson: 'Josephson ölçütleri', yes: 'karşılanıyor', no: 'karşılanmıyor',
      lesions: 'Lezyon (piksel)', vt: 'Klinik VT', inducible: 'indüklenebilir', notInducible: 'indüklenemez', residualLp: 'Kalan LP', residualLava: 'Kalan LAVA', exitBlock: 'Core içinden pacing', blocked: 'exit block', notBlocked: 'dışarı iletiliyor'
    },
    kinds: {
      normal: 'Normal: yüksek voltaj, kısa ve keskin.',
      abnormal: 'Anormal: düşük voltaj ya da uzun, fraksiyone sinyal.',
      lava: 'LAVA: far-field\'dan ayrık, keskin near-field; QRS içinde.',
      lp: 'Geç potansiyel (LP): izoelektrik aralıktan sonra, QRS bittikten sonra gelen ayrık near-field.',
      none: 'Sinyal yok: yoğun skar ya da lezyon (gürültü düzeyi).'
    },
    unipolarLow: 'Unipolar voltaj 8,27 mV\'un altında: bipolar normal olsa da derin (epikardiyal) substrat düşünülmeli.',
    classes: {
      exit: 'Exit (S-QRS/TCL < 0,3): concealed füzyon, PPI = TCL. Devrenin çıkışı.',
      central: 'Central isthmus (0,3-0,5): concealed füzyon, PPI = TCL. En iyi ablasyon hedefi.',
      proximal: 'Proximal isthmus (0,5-0,7): concealed füzyon, PPI = TCL. Girişe yakın.',
      inner: 'Inner loop (> 0,7): concealed füzyon, PPI = TCL; uzak bir iç halka.',
      outer: 'Outer loop: PPI = TCL ama manifest füzyon. Devrede, korunmuş değil; ablasyon hedefi değil.',
      adjacent: 'Komşu bystander: concealed füzyon ama PPI uzun. Isthmusa bağlı çıkmaz yol; S-QRS, EGM-QRS\'ten uzun.',
      remote: 'Uzak bystander: manifest füzyon ve uzun PPI. Devrenin dışında.',
      noCapture: 'Yakalama yok: yoğun skar ya da lezyon.',
      noVt: 'Klinik VT indüklenemiyor (isthmus kesildi ya da devre yok).'
    },
    scenarios: {
      ischemic: {
        name: 'İnferolateral eski MI (skar VT)',
        lesson: 'Önce bipolar haritaya bakın: 0,5 mV eşikte skar tek bir kırmızı alan. Skar eşiğini 0,2 mV\'a indirin: skarın içinden geçen kanallar (koridorlar) görünür (Arenal). LP / LAVA etiketlerini açın: geç potansiyeller kanallarda toplanır. Sonra ritmi "VT sırasında entrainment" yapın ve noktaları gezin: isthmusta concealed füzyon ve PPI = TCL, bystander\'da concealed ama uzun PPI, outer loop\'ta manifest füzyon. Son olarak stratejileri karşılaştırın.',
        truth: 'Isthmus skarın ortasından geçer (sol uçta yavaş giriş, sağda çıkış); ortasından aşağıya çıkmaz bir bystander kol ayrılır. Üstteki ayrı kanal klinik VT\'ye katılmaz ama geç potansiyel verir: başka bir VT\'nin substratı olabilir.',
        sites: { exit: 'Exit', central: 'Central isthmus', proximal: 'Proximal isthmus', bystander: 'Bystander kol', strand: 'Ayrı kanal', outerLoop: 'Outer loop (skar üstü)', border: 'Sınır zonu', remote: 'Uzak septum' }
      },
      nicm: {
        name: 'NICM: epikardiyal bazolateral substrat',
        lesson: 'Endokardiyal bipolar harita bazolateral duvarda normal görünür (> 1,5 mV). Unipolar haritaya geçin: aynı bölgede unipolar voltaj 8,27 mV\'un altında. Unipolar elektrot daha geniş ve derin bir alanı gördüğü için endokardiyal unipolar düşük voltaj epikardiyal substratı düşündürür (Hutchinson).',
        truth: 'Skar epikardiyal ve intramural; endokard korunmuş. Ablasyon için epikardiyal haritalama gerekebilir (epikardda düşük voltaj < 1,0 mV).',
        sites: { epicardial: 'Bazolateral duvar', edge: 'Bölge kenarı', remote: 'Uzak septum' }
      }
    },
    strategyText: {
      none: 'Strateji seçerek lezyon setini ve sonucunu görün.',
      clinical: 'Yalnız klinik VT: VT sırasında Josephson ölçütlerini (PPI - TCL ≤ 10 ms, concealed füzyon, S-QRS = EGM-QRS, S-QRS < %70 TCL) karşılayan isthmus noktaları. Klinik VT durur ama diğer kanallar yerinde kalır. VISTA çalışmasında 12 ayda VT nüksü klinik ablasyonda %48,3, substrat ablasyonunda %15,5.',
      lp: 'Geç potansiyellerin ablasyonu (sinüs ve RV pacing). Vergara: LP\'lerin tamamen kaldırılması sonrası nüks %9,5, kısmi kaldırmada %75.',
      dechanneling: 'Kanal girişleri: sinüs ritminde gecikmiş bileşeni en erken olan uçlar, 0,5-1,5 mV bölgesinde. Girişler kesilince kanalların içi elektriksel olarak ayrılır. Berruezo: yalnız dechanneling ile daha kısa işlem, iki yılda olaysız sağkalım %80.',
      core: 'Yoğun skarı çevreleyen lezyon halkası; son nokta içeriden pacing ile (20 mA, 2 ms) exit block. Tzou: core isolation %84 hastada sağlandı, sağlananlarda VT\'siz sağkalım daha iyi.',
      homogenization: 'Skardaki bütün anormal elektrogramların ablasyonu (gürültü düzeyindeki yoğun skar hariç). En çok lezyon; hiçbir kanal ve geç potansiyel kalmaz. Di Biase: elektrik fırtınasında homojenizasyonla nüks %19, sınırlı ablasyonda %47.'
    },
    source: 'Kaynak: Cardiac Mapping, 5. baskı (Shenasa, Hindricks, Callans, Miller, Josephson; Wiley 2019), Bölüm 69 (substrat ablasyonu), 72 (resetting ve entrainment), 79 (koroner arter hastalığında VT). Voltaj eşikleri: Marchlinski (bipolar 0,5 / 1,5 mV), unipolar LV 8,27 mV. Izgara ve sayılar öğretim için tasarlanmıştır.'
  },
  en: {
    tab: 'Substrate',
    heading: 'Scar VT: substrate and entrainment mapping',
    intro: 'A left ventricular map of a healed infarct. In sinus rhythm (or with RV pacing) voltage and electrograms show the substrate; during the VT, entrainment tells where the catheter sits in the circuit. Click the map or move the catheter with the arrow keys.',
    scenario: 'Scenario', map: 'Map', scarCut: 'Scar cut-off (bipolar)', normalCut: 'Normal cut-off (bipolar)', rhythm: 'Rhythm', strategy: 'Ablation strategy', site: 'Go to site',
    sitePick: 'Choose…',
    maps: { bipolar: 'Bipolar voltage', unipolar: 'Unipolar voltage', lat: 'Activation (LAT)' },
    rhythms: { sinus: 'Sinus rhythm', rv: 'RV apical pacing', vt: 'Entrainment during VT' },
    strategies: {
      none: 'No ablation',
      clinical: 'Clinical VT (entrainment guided)',
      lp: 'Late potentials (LP)',
      dechanneling: 'Scar dechanneling',
      core: 'Core isolation',
      homogenization: 'Scar homogenization'
    },
    tags: 'LP / LAVA tags', truth: 'Show channels and circuit',
    legend: {
      bipolar: (scar, normal) => `red < ${scar} mV (scar) · middle colours border zone · purple > ${normal} mV (normal)`,
      unipolar: 'red low · purple ≥ 8.27 mV (normal LV unipolar)',
      lat: (min, max) => `earliest ${min} ms · latest ${max} ms`,
      latVt: 'From QRS onset; red early, purple late (the circuit: early meets late)',
      tagLp: 'LP', tagLava: 'LAVA', lesion: 'lesion'
    },
    egmTitle: (rhythm) => `Local bipolar EGM (white) and lead II (green), ${rhythm}`,
    ecgTitle: 'VT QRS (green) and QRS during entrainment (yellow); vertical line: stimulus',
    readout: {
      bipolar: 'Bipolar voltage', unipolar: 'Unipolar voltage', egm: 'EGM', duration: 'EGM duration', far: 'Far field', near: 'Near field', qrsEnd: 'QRS end',
      tcl: 'VT cycle length (TCL)', pcl: 'Pacing cycle', ppi: 'PPI', ppiDiff: 'PPI - TCL', match: 'QRS match', sqrs: 'S-QRS', egmQrs: 'EGM-QRS', delta: 'S-QRS - EGM-QRS', ratio: 'S-QRS / TCL',
      cls: 'Class', josephson: 'Josephson criteria', yes: 'met', no: 'not met',
      lesions: 'Lesions (pixels)', vt: 'Clinical VT', inducible: 'inducible', notInducible: 'not inducible', residualLp: 'LP left', residualLava: 'LAVA left', exitBlock: 'Pacing inside the core', blocked: 'exit block', notBlocked: 'conducts out'
    },
    kinds: {
      normal: 'Normal: high voltage, short and sharp.',
      abnormal: 'Abnormal: low voltage or a long, fractionated signal.',
      lava: 'LAVA: a sharp near field distinct from the far field; within the QRS.',
      lp: 'Late potential (LP): an isolated near field after an isoelectric interval, after the end of the QRS.',
      none: 'No signal: dense scar or a lesion (noise level).'
    },
    unipolarLow: 'Unipolar voltage below 8.27 mV: even with a normal bipolar signal, consider a deep (epicardial) substrate.',
    classes: {
      exit: 'Exit (S-QRS/TCL < 0.3): concealed fusion, PPI = TCL. The circuit exit.',
      central: 'Central isthmus (0.3-0.5): concealed fusion, PPI = TCL. The best ablation target.',
      proximal: 'Proximal isthmus (0.5-0.7): concealed fusion, PPI = TCL. Near the entrance.',
      inner: 'Inner loop (> 0.7): concealed fusion, PPI = TCL; a remote inner loop.',
      outer: 'Outer loop: PPI = TCL but manifest fusion. In the circuit, not protected; not an ablation target.',
      adjacent: 'Adjacent bystander: concealed fusion but a long PPI. A dead end attached to the isthmus; S-QRS longer than EGM-QRS.',
      remote: 'Remote bystander: manifest fusion and a long PPI. Outside the circuit.',
      noCapture: 'No capture: dense scar or a lesion.',
      noVt: 'The clinical VT is not inducible (isthmus cut, or no circuit).'
    },
    scenarios: {
      ischemic: {
        name: 'Old inferolateral MI (scar VT)',
        lesson: 'Start with the bipolar map: at 0.5 mV the scar is one red area. Lower the scar cut-off to 0.2 mV: channels (corridors) through the scar appear (Arenal). Turn on the LP / LAVA tags: late potentials gather in the channels. Then set the rhythm to "Entrainment during VT" and walk the sites: concealed fusion and PPI = TCL in the isthmus, concealed but a long PPI at the bystander, manifest fusion in the outer loop. Finally compare the strategies.',
        truth: 'The isthmus crosses the middle of the scar (slow entrance on the left, exit on the right); a dead-end bystander branch leaves its middle downwards. The separate channel above takes no part in the clinical VT but gives late potentials: it may be the substrate of another VT.',
        sites: { exit: 'Exit', central: 'Central isthmus', proximal: 'Proximal isthmus', bystander: 'Bystander branch', strand: 'Separate channel', outerLoop: 'Outer loop (above the scar)', border: 'Border zone', remote: 'Remote septum' }
      },
      nicm: {
        name: 'NICM: epicardial basolateral substrate',
        lesson: 'The endocardial bipolar map looks normal over the basolateral wall (> 1.5 mV). Switch to the unipolar map: the same area is below 8.27 mV. The unipolar electrode sees a wider and deeper field, so endocardial unipolar low voltage suggests an epicardial substrate (Hutchinson).',
        truth: 'The scar is epicardial and intramural; the endocardium is spared. Ablation may need epicardial mapping (epicardial low voltage < 1.0 mV).',
        sites: { epicardial: 'Basolateral wall', edge: 'Edge of the area', remote: 'Remote septum' }
      }
    },
    strategyText: {
      none: 'Choose a strategy to see its lesion set and result.',
      clinical: 'Clinical VT only: isthmus sites meeting the Josephson criteria during the VT (PPI - TCL ≤ 10 ms, concealed fusion, S-QRS = EGM-QRS, S-QRS < 70 % of TCL). The clinical VT stops but the other channels stay. In VISTA, VT recurrence at 12 months was 48.3 % after clinical ablation and 15.5 % after substrate ablation.',
      lp: 'Ablation of late potentials (sinus and RV pacing). Vergara: recurrence 9.5 % after complete LP abolition, 75 % after partial abolition.',
      dechanneling: 'Channel entrances: the ends with the earliest delayed component in sinus rhythm, in the 0.5-1.5 mV zone. Cutting the entrances disconnects the channels. Berruezo: dechanneling alone gave shorter procedures and 80 % event-free survival at two years.',
      core: 'A lesion ring around the dense scar; endpoint exit block on pacing inside (20 mA, 2 ms). Tzou: core isolation achieved in 84 %, with better VT-free survival when achieved.',
      homogenization: 'Ablation of every abnormal electrogram in the scar (not the dense scar at the noise level). The most lesions; no channel or late potential is left. Di Biase: in electrical storm, recurrence 19 % with homogenization versus 47 % with limited ablation.'
    },
    source: 'Source: Cardiac Mapping, 5th ed. (Shenasa, Hindricks, Callans, Miller, Josephson; Wiley 2019), chapters 69 (substrate ablation), 72 (resetting and entrainment), 79 (VT in coronary artery disease). Voltage cut-offs: Marchlinski (bipolar 0.5 / 1.5 mV), unipolar LV 8.27 mV. Grid and numbers are designed for teaching.'
  }
};

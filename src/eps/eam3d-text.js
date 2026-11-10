/*
 * Bilingual (TR / EN) copy for the 3D EAM whole-heart simulation
 * and probabilistic circuit-finding workstation (eam3d-panel.js, eam3d-atlas.js).
 */
export const EAM3D_TEXT = Object.freeze({
  tr: {
    tab: '3B elektroanatomik harita',
    title: '3B Elektroanatomik Haritalama ve Devre Bulucu',
    intro: 'Atriyumlar, ventriküller ve His-Purkinje ileti ağı tek bir 3B modelde: intrakardiyak kateterler (DUO, CS, HRA, His, RV, HD Grid), canlı elektrogramlar, programlı stimülasyon, 3B ablasyon ve olasılıksal devre modelleme.',
    rails: {
      case: 'Vaka',
      map: 'Harita',
      ablate: 'Ablasyon',
      survey: 'Devre Bul'
    },
    status: {
      running: 'ÇALIŞIYOR',
      frozen: 'DONDURULDU',
      pacing: 'PACING AKTİF'
    },
    views: {
      ap: 'AP',
      rao30: 'RAO 30',
      lao30: 'LAO 30',
      pa: 'PA',
      xray: 'X-ray'
    },
    rhythmBox: {
      title: 'RİTİM VE SENARYO',
      scenario: 'Klinik senaryo',
      mapMode: '3B Harita modu',
      importMap: 'Harita İçe Aktar'
    },
    scenarios: {
      avnrt: 'AVNRT (Tipik yavaş-hızlı)',
      sinus: 'Sinüs ritmi (Normal iletim)',
      'flutter-typical': 'Tipik Atriyal Flutter (CTI saat yönü tersi)',
      'atrial-scar-flutter': 'Atriyal Skar Flutter (Sol/Biatriyal)',
      'avrt-left': 'Ortodromik AVRT (Sol lateral aksesuar yol)',
      'vt-ischemic': 'İskemik Skar VT (LV inferolateral istmus)',
      'pvc-rvot': 'RVOT Septal VES / PVC (Fokal çıkış)',
      af: 'Atriyal Fibrilasyon (Yüksek yoğunluklu biatriyal rotor/dalga)'
    },
    mapModes: {
      live: 'Canlı Dalga (Vm yayılımı)',
      lat: 'Aktivasyon Haritası (LAT izokronal)',
      voltage: 'Substrat Voltaj Haritası (Bipolar mV)',
      phase: 'Faz / Rotor Haritası (Hilbert fazı)'
    },
    mappingBox: {
      title: 'HARİTALAMA',
      catheter: 'Haritalama kateteri',
      catheters: {
        pentaray: 'PENTARAY NAV ECO (20 kutup, 2-6-2 mm · CARTO)',
        hdgrid: 'Advisor HD Grid X (16 kutup, 3 mm · EnSite)'
      },
      chamber: 'Haritalanacak boşluk',
      chambers: { ra: 'Sağ atriyum', la: 'Sol atriyum', rv: 'Sağ ventrikül', lv: 'Sol ventrikül' },
      systems: {
        carto: 'CARTO renk düzeni: kırmızı en erken / düşük voltaj, mor en geç / sağlıklı',
        ensite: 'EnSite renk düzeni: beyaz en erken, mor en geç; voltajda <0.5 mV gri (skar), mor sağlıklı'
      },
      start: 'Haritalamayı başlat',
      stop: 'Haritalamayı durdur',
      resume: 'Haritalamaya devam et',
      reset: 'Haritayı sil',
      idle: 'Henüz nokta alınmadı. Harita modları tüm yüzeyde ideal haritayı gösteriyor.',
      how: 'Kateter duvarda gezer; her kabul edilen atımda temas eden bipoller birer nokta verir. Yüzey yalnızca noktaların çevresinde renklenir, alınmamış bölge gri kalır.',
      afNote: 'AF\'de siklus kararsız: aktivasyon (LAT) noktaları kabul edilmez, yalnızca voltaj toplanır.',
      done: 'Harita tamamlandı. Aktivasyon ve voltaj modları arasında geçebilir, yeni harita için silebilirsiniz.',
      stats: (s) =>
        `${s.pointsUsed} nokta kullanıldı (${s.pointsTaken} alındı, ${s.pointsTaken - s.pointsUsed} temassız) · LAT ${s.latPoints} · kaplama %${s.coveragePct} · ${s.beats} atım · ${s.seconds} sn` +
        (s.latRange ? ` · LAT ${s.latRange[0]} .. ${s.latRange[1]} ms (ref: KS)` : '') +
        ` · düşük voltaj (<0.5 mV) %${s.lowVoltagePct} · ${s.electrodes} elektrot, ${s.bipoles} bipol, dolgu eşiği ${s.fillMm} mm`
    },
    atriaBox: {
      title: 'ATRİYUMLAR',
      ra: 'Sağ atriyum (RA)',
      la: 'Sol atriyum (LA)',
      hd: 'Yüksek yoğunluklu atriyum',
      cv: 'İletim hızı (mm/ms)',
      restitution: 'Restitüsyon',
      rateAdaptation: 'Hız adaptasyonu',
      afRemodelling: 'AF yeniden şekillenme',
      reset: 'Atriyumları sıfırla'
    },
    ventriclesBox: {
      title: 'VENTRİKÜLLER',
      visible: 'Ventriküller',
      walls: {
        all: 'Tümü',
        endo: 'Endo',
        mid: 'Mid',
        epi: 'Epi',
        'hide-epi': 'Epi gizle'
      },
      hd: 'Yüksek yoğunluklu mesh',
      vtMesh: 'VT-çalışma mesh (skar + kanal)',
      cv: 'İletim hızı (mm/ms)',
      restitution: 'Restitüsyon',
      reset: 'Ventrikülleri sıfırla'
    },
    hisBox: {
      title: 'HİS-PURKİNJE AĞI',
      show: 'İleti sistemini göster',
      participates: 'Ağ ektopi ve aritmiye katılır'
    },
    ablationBox: {
      applied: 'Uygulandı (Blok)',
      lines: {
        'slow-pathway': 'Koch üçgeni yavaş yol ablasyonu (AVNRT)',
        'cti-line': 'Kavotriküspit istmus (CTI) hattı (Tipik Flutter)',
        'la-anterior-roof': 'LA anteriyor tavan (Roof) hattı (Atipik Flutter)',
        'mitral-isthmus': 'Lateral mitral istmus hattı (Perimitral / Sol AP)',
        'posterior-box': 'LA posteriyor duvar kutu izolasyonu (AF)',
        'vt-isthmus-dechannel': 'LV inferolateral skar istmus dechanneling (İskemik VT)',
        'rvot-focus': 'RVOT anteroseptal fokal ablasyon (RVOT PVC)'
      }
    },
    surveyBox: {
      title: 'Vaka haritasından potansiyel devrelere (Find the Circuit)',
      intro: 'Voltaj haritasını içe aktarın, 10–1.000 koşuluk olasılık motoru ile potansiyel reentran devreleri tarayın ve minimal müdahale hatlarını karşılaştırın.',
      preset: 'Voltaj haritası kaynağı',
      presets: {
        'biatrial-scar': 'Biatriyal Post-PVI Skar Haritası (LA + RA)',
        'vt-scar': 'İskemik LV İnferolateral VT Skar Haritası',
        'custom-import': 'İçe Aktarılan Vaka Voltaj Görüntüsü'
      },
      runs: 'Tarama koşu sayısı',
      runBtn: 'Devre Taramasını Başlat (Survey)',
      showRibbons: '3B Devre Şeritlerini Göster',
      circuitsTitle: 'Saptanan Potansiyel Devreler',
      linesTitle: 'Önerilen Minimal Müdahale Hatları',
      applyLine: 'Hattı Uygula',
      map3d: {
        legendTitle: 'Haritadaki devreler',
        legendHint: 'Renkli halka = olası reentri yolu, ok = dönüş yönü. Bir devreye tıklayın: en iyi görünüm açılır, yolu ve kesen hat yazılır.',
        blocked: 'Bloklu',
        cutBy: 'Kesen hat',
        circuits: {
          'circuit-1-mitral': { short: 'Perimitral', how: 'Sol atriyumda mitral anülüsün çevresinde döner (LAO\'da anülüs karşıdan görülür).' },
          'circuit-2-roof': { short: 'LA tavan', how: 'Sol pulmoner venlerin çevresinde, LA tavanı ve arka duvar üzerinden döner.' },
          'circuit-3-posterior-fig8': { short: 'LA arka duvar, sekiz', how: 'LA arka duvarında, pulmoner venler arasında iki halkalı sekiz şekli.' },
          'circuit-4-anterior-scar': { short: 'LA ön skar', how: 'LA ön duvarındaki düşük voltajlı koridorun çevresinde döner.' },
          'circuit-5-cti': { short: 'CTI / triküspit', how: 'Sağ atriyumda triküspit anülüs çevresinde döner, CTI\'dan geçer (tipik flutter).' },
          'circuit-6-vt-isthmus': { short: 'LV skar istmusu', how: 'LV inferolateral skarın içindeki yavaş iletim kanalından geçip skar kenarından döner (VT).' }
        },
        landmarks: {
          mv: 'Mitral anülüs',
          tv: 'Triküspit anülüs',
          cs: 'KS ağzı',
          cti: 'CTI',
          roof: 'LA tavanı',
          posterior: 'LA arka duvar',
          scar: 'LV skar',
          lspv: 'LSPV',
          lipv: 'LIPV',
          rspv: 'RSPV',
          ripv: 'RIPV'
        }
      },
      blocked: 'Bloklu',
      conducting: 'İletimde',
      isthmus: 'İstmus',
      circuitNames: {
        'circuit-1-mitral': '1 · Perimitral (Mitral anülüs çevresi)',
        'circuit-2-roof': '2 · LA Tavan bağımlı (PV üstü makroreentri)',
        'circuit-3-posterior-fig8': '3 · LA Posteriyor duvar sekiz-figürü',
        'circuit-4-anterior-scar': '4 · LA Anteriyor düşük voltaj koridoru',
        'circuit-5-cti': '5 · Sağ atriyal CTI / Triküspit halkası',
        'circuit-6-vt-isthmus': '6 · LV İnferolateral diyastolik skar istmusu'
      },
      sustainedSummary: (count, runs, pct) => `${runs} koşuda ${count} sürdürülebilir reentri (%${pct})`
    },
    viewport: {
      myoOpacity: 'Miyokard opaklığı',
      condOpacity: 'İleti/Kateter opaklığı',
      pointReadout: 'Nokta okuması: yüzeye tıklayın; haritalama kateteri oraya taşınır',
      tissues: { normal: 'Normal doku', border: 'Sınır zon', scar: 'Skar', channel: 'İleti kanalı' },
      legendLive: 'Canlı Vm: Beyaz cephe -> Turuncu depolarize -> Kehribar dinlenme',
      legendLat: 'LAT (CARTO): Kırmızı (en erken) -> Sarı -> Yeşil -> Mavi -> Mor (en geç)',
      legendLat_ensite: 'LAT (EnSite): Beyaz (en erken) -> Kırmızı -> Sarı -> Yeşil -> Mavi -> Mor (en geç)',
      legendVoltage_ensite: 'Bipolar Voltaj (EnSite): Gri skar (<0.5 mV) -> Kırmızı -> Sarı -> Yeşil -> Mavi -> Mor (>1.5 mV)',
      legendVoltage: 'Bipolar Voltaj (CARTO): <0.5 mV Kırmızı (skar) · 0.5-1.5 mV Sınır · >1.5 mV Mor (sağlıklı) · Gri yoğun skar',
      legendPhase: 'Faz Haritası: -π .. +π rotor fazı ve faz tekillikleri'
    },
    polygraph: {
      cl: 'CL',
      bpm: 'atım/dk',
      atrial: 'A',
      ventricular: 'V',
      irregular: 'düzensiz',
      record: 'KAYIT',
      canvasLabel: 'Canlı çok kanallı intrakardiyak elektrogram ve yüzey EKG monitörü'
    },
    stim: {
      start: 'BAŞLAT',
      stop: 'DURDUR',
      modes: {
        pace: 'PACE',
        burst: 'BURST',
        s1s2: 'S1-S2'
      },
      bcl: 'S1 / BCL (ms)',
      s2: 'S2 (ms)',
      channel: 'Pacing kanalı',
      output: '10.0 mA · 2.0 ms',
      deliver: 'Stim Uygula',
      openRf: 'RF ablasyon paneli ▸',
      backToStim: '◂ Stimülatör',
      verdicts: {
        overdriveEntrained: (ppi, diff) => `Overdrive entrainment: PPI = ${ppi} ms, PPI - TCL = ${diff} ms (${diff <= 30 ? 'devre içi' : 'devreye uzak'}).`,
        overdriveTerminated: () => 'Overdrive burst pacing reentran devreyi kırdı -> Sinüs ritmi sağlandı.',
        underdrivePacing: () => 'Pacing hızı taşikardi döngüsünden yavaş (underdrive); devre yakalanmadı.',
        ahJumpInducedAvnrt: () => 'S2 hızlı yolda blok oldu, yavaş yoldan iletildi (AH sıçraması) -> Tipik AVNRT tetiklendi!',
        effectiveRefractory: () => 'S2 efektif refrakter periyoda (ERP) düştü -> Yakalama yok.',
        extrastimulusCaptured: () => 'Ekstrastimülüs dokuyu yakaladı ve döngüyü sıfırladı.',
        fixedPacing: () => 'Sabit hızda (S1) komuta pacing aktif.'
      }
    }
  },
  en: {
    tab: '3D electroanatomic map',
    title: '3D Electroanatomical Mapping & Circuit Finder',
    intro: 'Atria, ventricles, and the His-Purkinje conduction system in one 3D model: intracardiac catheters (DUO, CS, HRA, His, RV, HD Grid), live electrograms, programmed stimulation, 3D ablation, and probabilistic circuit modeling.',
    rails: {
      case: 'Case',
      map: 'Map',
      ablate: 'Ablate',
      survey: 'Find Circuit'
    },
    status: {
      running: 'RUNNING',
      frozen: 'FROZEN',
      pacing: 'PACING'
    },
    views: {
      ap: 'AP',
      rao30: 'RAO 30',
      lao30: 'LAO 30',
      pa: 'PA',
      xray: 'X-ray'
    },
    rhythmBox: {
      title: 'RHYTHM & SCENARIO',
      scenario: 'Clinical scenario',
      mapMode: '3D Map mode',
      importMap: 'Import map'
    },
    scenarios: {
      avnrt: 'AVNRT (Typical slow-fast)',
      sinus: 'Sinus rhythm (Normal conduction)',
      'flutter-typical': 'Typical Atrial Flutter (CCW CTI)',
      'atrial-scar-flutter': 'Atrial Scar Flutter (Left/Biatrial)',
      'avrt-left': 'Orthodromic AVRT (Left lateral pathway)',
      'vt-ischemic': 'Ischemic Scar VT (LV inferolateral isthmus)',
      'pvc-rvot': 'RVOT Septal PVC (Focal outflow origin)',
      af: 'Atrial Fibrillation (High-density biatrial rotors/wavelets)'
    },
    mapModes: {
      live: 'Live Wavefront (Vm spread)',
      lat: 'Activation Map (Isochronal LAT)',
      voltage: 'Substrate Voltage Map (Bipolar mV)',
      phase: 'Phase / Rotor Map (Hilbert phase)'
    },
    mappingBox: {
      title: 'MAPPING',
      catheter: 'Mapping catheter',
      catheters: {
        pentaray: 'PENTARAY NAV ECO (20 poles, 2-6-2 mm · CARTO)',
        hdgrid: 'Advisor HD Grid X (16 poles, 3 mm · EnSite)'
      },
      chamber: 'Chamber to map',
      chambers: { ra: 'Right atrium', la: 'Left atrium', rv: 'Right ventricle', lv: 'Left ventricle' },
      systems: {
        carto: 'CARTO colours: red earliest / low voltage, purple latest / healthy',
        ensite: 'EnSite colours: white earliest, purple latest; on voltage <0.5 mV is grey (scar), purple healthy'
      },
      start: 'Start mapping',
      stop: 'Stop mapping',
      resume: 'Resume mapping',
      reset: 'Clear map',
      idle: 'No points yet. The map modes show the ideal map over the whole surface.',
      how: 'The catheter roves over the wall; on every accepted beat each bipole in contact gives one point. The surface is coloured only around acquired points, the rest stays grey.',
      afNote: 'The cycle is unstable in AF: activation (LAT) points are refused, only voltage is collected.',
      done: 'Map complete. Switch between activation and voltage, or clear it to map again.',
      stats: (s) =>
        `${s.pointsUsed} points used (${s.pointsTaken} taken, ${s.pointsTaken - s.pointsUsed} no contact) · LAT ${s.latPoints} · coverage ${s.coveragePct}% · ${s.beats} beats · ${s.seconds} s` +
        (s.latRange ? ` · LAT ${s.latRange[0]} .. ${s.latRange[1]} ms (ref: CS)` : '') +
        ` · low voltage (<0.5 mV) ${s.lowVoltagePct}% · ${s.electrodes} electrodes, ${s.bipoles} bipoles, fill threshold ${s.fillMm} mm`
    },
    atriaBox: {
      title: 'ATRIA',
      ra: 'Right atrium',
      la: 'Left atrium',
      hd: 'High-density atria',
      cv: 'Conduction velocity (mm/ms)',
      restitution: 'Restitution',
      rateAdaptation: 'Rate adaptation',
      afRemodelling: 'AF remodelling',
      reset: 'Reset atria'
    },
    ventriclesBox: {
      title: 'VENTRICLES',
      visible: 'Ventricles',
      walls: {
        all: 'All',
        endo: 'Endo',
        mid: 'Mid',
        epi: 'Epi',
        'hide-epi': 'Hide epi'
      },
      hd: 'High-density mesh',
      vtMesh: 'VT-study mesh (fine, slow)',
      cv: 'Conduction velocity (mm/ms)',
      restitution: 'Restitution',
      reset: 'Reset ventricles'
    },
    hisBox: {
      title: 'HIS-PURKINJE',
      show: 'Show the conduction system',
      participates: 'Network takes part in ectopy and arrhythmia'
    },
    ablationBox: {
      applied: 'Applied (Blocked)',
      lines: {
        'slow-pathway': 'Triangle of Koch slow pathway ablation (AVNRT)',
        'cti-line': 'Cavotricuspid isthmus (CTI) line (Typical Flutter)',
        'la-anterior-roof': 'LA anterior roof line (Atypical Scar Flutter)',
        'mitral-isthmus': 'Lateral mitral isthmus line (Perimitral / Left AP)',
        'posterior-box': 'LA posterior wall box isolation (AF)',
        'vt-isthmus-dechannel': 'LV inferolateral scar isthmus dechanneling (Ischemic VT)',
        'rvot-focus': 'RVOT anteroseptal focal ablation (RVOT PVC)'
      }
    },
    surveyBox: {
      title: 'From a case map to potential circuits',
      intro: 'Import a case voltage map, use the probability engine across 10–1,000 runs to survey potential circuits, and compare minimal-intervention ablation lines.',
      preset: 'Voltage map source',
      presets: {
        'biatrial-scar': 'Biatrial Post-PVI Scar Map (LA + RA)',
        'vt-scar': 'Ischemic LV Inferolateral VT Scar Map',
        'custom-import': 'Imported Case Voltage Map Screenshot'
      },
      runs: 'Survey runs',
      runBtn: 'Run Circuit Survey',
      showRibbons: 'Show 3D Circuit Ribbons',
      circuitsTitle: 'Surveyed Potential Circuits',
      linesTitle: 'Proposed Minimal Intervention Lines',
      applyLine: 'Apply Line',
      map3d: {
        legendTitle: 'Circuits on the map',
        legendHint: 'Coloured loop = possible reentry path, arrow = direction of rotation. Click a circuit: the best view opens, with its path and the line that cuts it.',
        blocked: 'Blocked',
        cutBy: 'Cut by',
        circuits: {
          'circuit-1-mitral': { short: 'Perimitral', how: 'Turns around the mitral annulus in the left atrium (LAO shows the annulus en face).' },
          'circuit-2-roof': { short: 'LA roof', how: 'Turns around the left pulmonary veins, over the LA roof and down the posterior wall.' },
          'circuit-3-posterior-fig8': { short: 'LA posterior, figure of eight', how: 'Two loops on the LA posterior wall, between the pulmonary veins.' },
          'circuit-4-anterior-scar': { short: 'LA anterior scar', how: 'Turns around a low-voltage corridor on the LA anterior wall.' },
          'circuit-5-cti': { short: 'CTI / tricuspid', how: 'Turns around the tricuspid annulus in the right atrium, through the CTI (typical flutter).' },
          'circuit-6-vt-isthmus': { short: 'LV scar isthmus', how: 'Runs through the slow channel inside the LV inferolateral scar and returns around its border (VT).' }
        },
        landmarks: {
          mv: 'Mitral annulus',
          tv: 'Tricuspid annulus',
          cs: 'CS os',
          cti: 'CTI',
          roof: 'LA roof',
          posterior: 'LA posterior wall',
          scar: 'LV scar',
          lspv: 'LSPV',
          lipv: 'LIPV',
          rspv: 'RSPV',
          ripv: 'RIPV'
        }
      },
      blocked: 'Blocked',
      conducting: 'Conducting',
      isthmus: 'Isthmus',
      circuitNames: {
        'circuit-1-mitral': '1 · Perimitral (Mitral annulus macroreentry)',
        'circuit-2-roof': '2 · LA Roof-dependent macroreentry',
        'circuit-3-posterior-fig8': '3 · LA Posterior wall figure-of-eight',
        'circuit-4-anterior-scar': '4 · LA Anterior low-voltage corridor',
        'circuit-5-cti': '5 · Right atrial CTI / Tricuspid annulus',
        'circuit-6-vt-isthmus': '6 · LV Inferolateral diastolic scar isthmus'
      },
      sustainedSummary: (count, runs, pct) => `${count} sustained circuits across ${runs} runs (${pct}%)`
    },
    viewport: {
      myoOpacity: 'Myocardium opacity',
      condOpacity: 'Conduction/Catheter opacity',
      pointReadout: 'Point readout: click the surface; the mapping catheter moves there',
      tissues: { normal: 'Normal tissue', border: 'Border zone', scar: 'Scar', channel: 'Conducting channel' },
      legendLive: 'Live Vm: White wavefront -> Orange depolarized -> Amber resting',
      legendLat: 'LAT (CARTO): Red (earliest) -> Yellow -> Green -> Blue -> Purple (latest)',
      legendLat_ensite: 'LAT (EnSite): White (earliest) -> Red -> Yellow -> Green -> Blue -> Purple (latest)',
      legendVoltage_ensite: 'Bipolar Voltage (EnSite): Grey scar (<0.5 mV) -> Red -> Yellow -> Green -> Blue -> Purple (>1.5 mV)',
      legendVoltage: 'Bipolar Voltage (CARTO): <0.5 mV Red (scar) · 0.5-1.5 mV Border · >1.5 mV Purple (healthy) · Grey dense scar',
      legendPhase: 'Phase Map: -π .. +π rotor phase & phase singularities'
    },
    polygraph: {
      cl: 'CL',
      bpm: 'bpm',
      atrial: 'A',
      ventricular: 'V',
      irregular: 'irregular',
      record: 'RECORD',
      canvasLabel: 'Live multichannel intracardiac electrogram and surface ECG monitor'
    },
    stim: {
      start: 'START',
      stop: 'STOP',
      modes: {
        pace: 'PACE',
        burst: 'BURST',
        s1s2: 'S1-S2'
      },
      bcl: 'S1 / BCL (ms)',
      s2: 'S2 (ms)',
      channel: 'Pacing channel',
      output: '10.0 mA · 2.0 ms',
      deliver: 'Deliver Stim',
      openRf: 'RF ablation panel ▸',
      backToStim: '◂ Stimulator',
      verdicts: {
        overdriveEntrained: (ppi, diff) => `Overdrive entrainment: PPI = ${ppi} ms, PPI - TCL = ${diff} ms (${diff <= 30 ? 'in circuit' : 'out of circuit'}).`,
        overdriveTerminated: () => 'Overdrive burst pacing interrupted the reentrant circuit -> Sinus rhythm restored.',
        underdrivePacing: () => 'Pacing cycle slower than tachycardia cycle (underdrive); circuit not entrained.',
        ahJumpInducedAvnrt: () => 'S2 blocked in fast pathway and conducted via slow pathway (AH jump) -> Typical AVNRT induced!',
        effectiveRefractory: () => 'S2 fell inside the effective refractory period (ERP) -> Non-capture.',
        extrastimulusCaptured: () => 'Extrastimulus captured tissue and reset the cycle.',
        fixedPacing: () => 'Fixed-rate (S1) drive pacing active.'
      }
    }
  }
});

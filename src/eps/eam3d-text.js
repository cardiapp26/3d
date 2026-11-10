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
      pointReadout: 'Nokta okuması: yüzeye tıklayın; HD Grid oraya taşınır',
      tissues: { normal: 'Normal doku', border: 'Sınır zon', scar: 'Skar', channel: 'İleti kanalı' },
      legendLive: 'Canlı Vm: Beyaz cephe -> Turuncu depolarize -> Kehribar dinlenme',
      legendLat: 'LAT İzokronal: Kırmızı (en erken) -> Sarı -> Yeşil -> Mavi -> Mor (en geç)',
      legendVoltage: 'Bipolar Voltaj: Gri yoğun skar · <0.5 mV Kırmızı (kanal) · 0.5-1.5 mV Sınır · >1.5 mV Normal (Mor)',
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
      pointReadout: 'Point readout: click the surface; the HD Grid moves there',
      tissues: { normal: 'Normal tissue', border: 'Border zone', scar: 'Scar', channel: 'Conducting channel' },
      legendLive: 'Live Vm: White wavefront -> Orange depolarized -> Amber resting',
      legendLat: 'Isochronal LAT: Red (earliest) -> Yellow -> Green -> Blue -> Purple (latest)',
      legendVoltage: 'Bipolar Voltage: Grey dense scar · <0.5 mV Red (channel) · 0.5-1.5 mV Border · >1.5 mV Normal (Purple)',
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

// Texts of the AF mapping panel (afmap-panel.js): scenarios, maps,
// resolutions, ablation and its outcome, and the reading at the catheter.
// Written after Cardiac Mapping, 5th ed. (Shenasa, Hindricks, Callans,
// Miller, Josephson; Wiley 2019): chapter 38 (Narayan et al., rotor
// mapping), chapter 52 (electrogram-based mapping and ablation in AF:
// CFAE, dominant frequency) and chapter 53 (Saeed, Berenfeld, Oral: phase
// mapping). The medium and its numbers are the model's own.

export const AFMAP_TEXT = {
  tr: {
    tab: 'AF haritalama',
    heading: 'AF haritalama: rotor, faz, DF ve CFAE',
    intro: '48 × 48 mm\'lik bir atriyal doku yaprağında üç saniyelik AF. Aynı kayıttan dört harita çıkar: anlık aktivasyon, faz (Hilbert) ve faz singülariteleri (PS), dominant frekans (DF) ve fraksiyonasyon (CFE-mean). Haritaya tıklayarak kateterin yerini seçin.',
    scenario: 'Senaryo', map: 'Harita', resolution: 'Elektrot çözünürlüğü', ablation: 'Ablasyon', site: 'Noktaya git',
    sitePick: 'Seçin…',
    sites: { core: 'Rotor çekirdeği', fibrosis: 'Fibrotik yama', periphery: 'Uzak doku', centre: 'Merkez', edge: 'Kenar' },
    maps: { activation: 'Anlık aktivasyon', phase: 'Faz ve PS', df: 'Dominant frekans (DF)', cfae: 'Fraksiyonasyon (CFE-mean)' },
    resolutions: { full: 'Yüksek çözünürlük (her mm)', basket: 'Basket 64 kutup (6 mm aralık)', basketPoor: 'Basket, elektrotların yarısı temassız' },
    ablations: { none: 'Yok', core: 'Rotor çekirdeğine disk (4 mm)', line: 'Çekirdekten kenara hat', cfae: 'CFAE bölgesine disk (6 mm)' },
    play: 'Oynat', pause: 'Durdur', truth: 'Gerçek PS\'yi göster', time: 'Zaman',
    legend: {
      activation: 'koyu: dinlenim · sarı: aktive doku',
      phase: 'renk çemberi: faz (-π…π) · beyaz halka: gerçek PS · sarı ×: haritanın bulduğu PS',
      df: (lo, hi) => `DF ${lo}-${hi} Hz · kırmızı yüksek, mor düşük`,
      cfae: 'kırmızı: CFE-mean < 120 ms (CFAE) · mor: uzun aralık · gri: sinyal yok (iletim bloğu)'
    },
    traceTitle: 'Kateterde unipolar EGM (3 s); çentikler: defleksiyonlar. Sağda güç spektrumu ve DF.',
    readout: {
      df: 'DF', regularity: 'Düzenlilik indeksi', cfe: 'CFE-mean', cfae: 'CFAE', beats: 'Defleksiyon (3 s)', yes: 'evet', no: 'hayır',
      truePs: 'Gerçek PS (kare başına)', mappedPs: 'Haritadaki PS (kare başına)', precision: 'Haritadaki PS\'nin gerçeğe yakın olanı', core: 'Rotor çekirdeği', spread: 'Çekirdek gezinmesi',
      outcome: 'Ablasyon sonrası'
    },
    outcomes: { persists: 'AF sürüyor', organized: 'Düzenli reentriye döndü (organize AT benzeri)', terminated: 'AF sonlandı' },
    verdicts: {
      rotorCore: 'Rotor çekirdeği bölgesi: periyodik ve hızlı, fraksiyone değil. Faz haritasında tüm renkler bu noktanın çevresinde döner.',
      cfaeSite: 'Fraksiyone sinyal (CFAE): dalga kırılması ve fibrilatuvar iletim bölgesi. Sürücü değil.',
      driven: 'Rotorun 1:1 sürdüğü doku: DF rotorla aynı, düzenli.',
      slowed: 'Fibrilatuvar iletim: bu bölge rotoru 1:1 izleyemiyor, DF daha düşük.',
      wavelets: 'Çoklu dalgacık: PS\'ler kısa ömürlü ve gezgin; sabit bir sürücü yok.',
      falsePs: 'Haritadaki PS\'lerin çoğu gerçekte yok: elektrot aralığı ve interpolasyon sahte rotor üretir.'
    },
    scenarios: {
      rotor: {
        name: 'Kararlı rotor + fibrotik yama',
        lesson: 'Faz haritasını oynatın: renkler tek bir noktanın etrafında döner, bu noktada faz tanımsızdır (PS). DF haritasına geçin: rotor ve 1:1 sürdüğü doku en yüksek DF\'yi gösterir; fibrotik yamada DF düşer (fibrilatuvar iletim). CFAE haritasında fraksiyonasyon yalnız yamadadır: sürücü değil, dalga kırılmasıdır. Çözünürlüğü "Basket" yapın: tek rotorun yanında sahte PS\'ler belirir. Son olarak ablasyonları karşılaştırın.',
        truth: 'Rotor yaprağın sol orta bölümünde, birkaç milimetre içinde gezinerek döner. Sağdaki yamada iletken olmayan şeritler ve uzun refrakterlik vardır.'
      },
      wavelets: {
        name: 'Çoklu dalgacık (spiral kırılması)',
        lesson: 'Faz haritasında aynı anda çok sayıda PS doğar, gezinir ve söner. DF haritası düzensizdir ve kalıcı bir maksimum yoktur. Tek bir noktaya yapılan ablasyon AF\'yi durdurmaz.',
        truth: 'Kırılan spiraller sürekli yeni dalgacıklar üretir; hiçbiri uzun yaşamaz.'
      }
    },
    ablationText: {
      none: 'Bir ablasyon seçin: model aynı andan başlayıp kaydı lezyonlarla sürdürür.',
      core: 'Rotor çekirdeğine disk: dalga lezyonun çevresine tutunur. AF düzenli bir reentriye dönebilir (kitapta: rotor bölgesinde ablasyonla AF\'nin organize AT\'ye dönmesi).',
      line: 'Çekirdekten iletmeyen kenara uzanan hat: spiralin ucu sınırla birleşir ve döngü kapanır. AF sonlanır.',
      cfae: 'CFAE bölgesinin ablasyonu: fraksiyonasyon kaybolur ama rotor yerinde döner, AF sürer. CFAE özgül değildir (Bölüm 52).'
    },
    source: 'Kaynak: Cardiac Mapping, 5. baskı (Wiley 2019). Bölüm 53: faz Hilbert dönüşümüyle hesaplanır, genlik değişiminden etkilenmez; tüm faz aralığını kaplayan dönüşün merkezi PS\'dir; basket kateterde elektrot aralığı aliasing yapar, elektrotların %50\'ye varanında temas olmayabilir. Bölüm 52: CFAE = < 120 ms ortalama siklus ya da ≥ 2 defleksiyon; yüksek DF bölgeleri periyodik ve fraksiyonesizdir, yanlarındaki fraksiyonasyon dalga kırılmasıdır; meta-analizde PVI\'ye CFAE eklemenin yararı yalnız paroksismal olmayan AF\'de (RR 1,35). Bölüm 38: FIRM, 64 kutuplu basket; CONFIRM\'de bir yılda AF\'siz %82,4, FIRM\'e kör %44,9; bazı serilerde daha düşük (Buch: %38). Ortam ve sayılar öğretim için tasarlanmıştır.'
  },
  en: {
    tab: 'AF mapping',
    heading: 'AF mapping: rotor, phase, DF and CFAE',
    intro: 'Three seconds of AF in a 48 × 48 mm sheet of atrial muscle. Four maps come from the same recording: the instantaneous activation, the phase (Hilbert) with its phase singularities (PS), the dominant frequency (DF) and the fractionation (CFE-mean). Click the map to place the catheter.',
    scenario: 'Scenario', map: 'Map', resolution: 'Electrode resolution', ablation: 'Ablation', site: 'Go to site',
    sitePick: 'Choose…',
    sites: { core: 'Rotor core', fibrosis: 'Fibrotic patch', periphery: 'Remote tissue', centre: 'Centre', edge: 'Edge' },
    maps: { activation: 'Instantaneous activation', phase: 'Phase and PS', df: 'Dominant frequency (DF)', cfae: 'Fractionation (CFE-mean)' },
    resolutions: { full: 'High resolution (every mm)', basket: 'Basket 64 poles (6 mm apart)', basketPoor: 'Basket, half the electrodes out of contact' },
    ablations: { none: 'None', core: 'Disc on the rotor core (4 mm)', line: 'Line from the core to the edge', cfae: 'Disc on the CFAE area (6 mm)' },
    play: 'Play', pause: 'Pause', truth: 'Show the true PS', time: 'Time',
    legend: {
      activation: 'dark: rest · yellow: activated tissue',
      phase: 'colour wheel: phase (-π…π) · white ring: true PS · yellow ×: PS found by the map',
      df: (lo, hi) => `DF ${lo}-${hi} Hz · red high, purple low`,
      cfae: 'red: CFE-mean < 120 ms (CFAE) · purple: long interval · grey: no signal (conduction block)'
    },
    traceTitle: 'Unipolar EGM at the catheter (3 s); ticks: deflections. Right: power spectrum and DF.',
    readout: {
      df: 'DF', regularity: 'Regularity index', cfe: 'CFE-mean', cfae: 'CFAE', beats: 'Deflections (3 s)', yes: 'yes', no: 'no',
      truePs: 'True PS (per frame)', mappedPs: 'PS on the map (per frame)', precision: 'Map PS close to a true one', core: 'Rotor core', spread: 'Core wandering',
      outcome: 'After ablation'
    },
    outcomes: { persists: 'AF persists', organized: 'Turned into a regular reentry (organized AT-like)', terminated: 'AF terminated' },
    verdicts: {
      rotorCore: 'Rotor core region: periodic and fast, not fractionated. On the phase map every colour turns around this point.',
      cfaeSite: 'Fractionated signal (CFAE): wavebreak and fibrillatory conduction. Not the driver.',
      driven: 'Tissue the rotor drives 1:1: same DF as the rotor, regular.',
      slowed: 'Fibrillatory conduction: this area cannot follow the rotor 1:1, a lower DF.',
      wavelets: 'Multiple wavelets: PS are short-lived and wandering; there is no fixed driver.',
      falsePs: 'Most PS on the map do not exist: electrode spacing and interpolation create false rotors.'
    },
    scenarios: {
      rotor: {
        name: 'Stable rotor + fibrotic patch',
        lesson: 'Play the phase map: the colours turn around one point where the phase is undefined (PS). Switch to the DF map: the rotor and the tissue it drives 1:1 show the highest DF; in the fibrotic patch DF falls (fibrillatory conduction). On the CFAE map fractionation lies only in the patch: wavebreak, not the driver. Set the resolution to "Basket": false PS appear beside the single rotor. Finally compare the ablations.',
        truth: 'The rotor turns in the left middle of the sheet, wandering within a few millimetres. The patch on the right holds non-conducting strands and a longer refractory period.'
      },
      wavelets: {
        name: 'Multiple wavelets (spiral breakup)',
        lesson: 'On the phase map many PS appear, wander and vanish at once. The DF map is patchy without a lasting maximum. Ablation at one point does not stop the AF.',
        truth: 'Breaking spirals keep producing new wavelets; none lives long.'
      }
    },
    ablationText: {
      none: 'Choose an ablation: the model continues the recording from the same moment with the lesions.',
      core: 'A disc on the rotor core: the wave anchors around the lesion. AF may turn into a regular reentry (in the book: AF organizing into AT on ablation at a rotor site).',
      line: 'A line from the core to the non-conducting edge: the spiral tip joins the boundary and the loop closes. AF terminates.',
      cfae: 'Ablation of the CFAE area: the fractionation goes but the rotor keeps turning and AF persists. CFAE is not specific (chapter 52).'
    },
    source: 'Source: Cardiac Mapping, 5th ed. (Wiley 2019). Chapter 53: the phase is computed with the Hilbert transform, independent of amplitude changes; the centre of a turn covering the whole phase range is a PS; with basket catheters electrode spacing causes aliasing and up to 50 % of electrodes may lack contact. Chapter 52: CFAE = mean cycle < 120 ms or ≥ 2 deflections; high-DF sites are periodic without fractionation, fractionation beside them is wavebreak; in meta-analysis adding CFAE to PVI helped only non-paroxysmal AF (RR 1.35). Chapter 38: FIRM, a 64-pole basket; in CONFIRM 82.4 % AF-free at one year versus 44.9 % FIRM-blinded; lower in some series (Buch: 38 %). The medium and its numbers are designed for teaching.'
  }
};

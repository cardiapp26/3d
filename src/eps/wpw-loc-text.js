// Texts of the WPW localization tab (wpw-loc-panel.js). Content follows the
// Kardiyopedi WPW lectures (accessory pathway localization, WPW ablation,
// left lateral manifest and concealed pathway videos); the grouping and the
// wording are this tab's own teaching summary. Times of the coronary sinus
// card are teaching values.

export const WPW_LOC_TEXT = {
  tr: {
    tab: 'WPW lokalizasyon',
    heading: 'WPW: delta dalgasından aksesuar yola, ablasyondan önce ve sonra',
    intro: 'Delta dalgası, aksesuar yolun ventriküle girdiği yerden uzaklaşan bir vektördür: o yöne bakan derivasyonda negatif, karşı derivasyonlarda pozitif. Klasik üçlü: kısa PR, delta dalgası, geniş QRS.',
    source: 'Derleme: Kardiyopedi WPW dersleri; lokalizasyon: Arruda algoritması (J Cardiovasc Electrophysiol 1998;9:2-12); yüzey ve ablasyon ölçütleri: Josephson\'s Clinical Cardiac Electrophysiology, 2025, bölüm 8 ve 11; risk: ESC 2019 SVT kılavuzu. Öğretim aracıdır, hasta karar aracı değildir.',
    page: {
      navigation: 'WPW öğrenme bölümleri', loc: 'Lokalizasyon', cs: 'CS ve ablasyon', risk: 'Refrakter dönem',
      mapTitle: 'Aksesuar yol atlası', mapNote: 'LAO benzeri kapak düzlemi, yaklaşık öğretim bölgeleri. Haritada veya listede bölge seçin: ilgili EKG örneği yüklenir. Dalga şekilleri seçenekleri anlatan şemalardır; hasta EKG’si değildir. Numara sırası karar sırası değildir.',
      allLeads: 'Tüm derivasyonları göster', guided: 'Adım adım okumaya dön', read: 'Şimdi okuyun', decisions: 'karar tamamlandı', complete: 'Algoritma tamamlandı; önerilen bölge haritada işaretli.'
    },
    loc: {
      title: 'Yüzey EKG ile lokalizasyon',
      hint: 'Derivasyonlardaki delta dalgasını seçin; algoritma bir sonraki bakılacak derivasyonu söyler.',
      reset: 'Sıfırla',
      unset: 'bakılmadı',
      leads: {
        d1: { name: 'D1', hint: 'İlk bakılacak derivasyon. İlk 20 ms\'deki delta negatif veya izoelektrikse vektör sol serbest duvardan uzaklaşıyor.', options: { negIso: 'Negatif veya izoelektrik', pos: 'Pozitif' } },
        v1: { name: 'V1', hint: 'D1 pozitifse: R ≥ S sol serbest duvar, izoelektrik veya negatif delta septal, pozitif delta ama R < S sağ serbest duvar.', options: { rGtS: 'Pozitif delta, R ≥ S', sGtR: 'Pozitif delta, R < S', isoNeg: 'İzoelektrik veya negatif' } },
        d2: { name: 'D2', hint: 'Negatif delta subepikardiyal posteroseptal yolu (CS, orta kardiyak ven) düşündürür; istisnaları vardır.', options: { pos: 'Pozitif', iso: 'İzoelektrik veya bifazik', neg: 'Negatif' } },
        avf: { name: 'aVF', hint: 'Ön-arka ekseni: pozitifse yol önde, negatifse arkada.', options: { pos: 'Pozitif', iso: 'İzoelektrik (artı eksi)', neg: 'Negatif' } },
        d3: { name: 'D3', hint: 'aVF pozitif septal yolda anteroseptal ile midseptali ayırır.', options: { rGtS: 'R > S', rLtS: 'R ≤ S' } }
      },
      means: {
        leftFreeWall: 'D1 negatif veya izoelektrik: sol serbest duvar.',
        notLeftByI: 'D1 pozitif: V1\'e bakın.',
        leftFreeWallV1: 'V1\'de R ≥ S: sol serbest duvar.',
        leftAnterior: 'aVF pozitif: sol lateral veya anterolateral.',
        leftPosterior: 'aVF negatif veya izoelektrik: sol posterior veya posterolateral.',
        septalCandidate: 'V1 izoelektrik veya negatif: septal aday; D2\'ye bakın.',
        rightCandidate: 'V1 pozitif ama R < S: sağ serbest duvar adayı; D2\'ye bakın.',
        epicardial: 'D2 negatif: subepikardiyal posteroseptal (CS veya orta kardiyak ven).',
        notEpicardial: 'D2 negatif değil: aVF\'ye bakın.',
        posteroseptalTricuspid: 'aVF negatif: posteroseptal, triküspit anülüs tarafı.',
        posteroseptalMitral: 'aVF izoelektrik: posteroseptal, mitral anülüs tarafı.',
        superiorSeptum: 'aVF pozitif: anteroseptal veya midseptal; D3\'e bakın.',
        anteroseptal: 'D3\'te R > S: anteroseptal (His komşuluğu).',
        midseptal: 'D3\'te R ≤ S: midseptal.',
        rightAnterior: 'aVF pozitif: sağ anterior veya anterolateral.',
        rightLateral: 'aVF izoelektrik: sağ lateral.',
        rightPosterior: 'aVF negatif: sağ posterior veya posterolateral.'
      },
      next: 'Sıradaki derivasyon:',
      stalled: 'Bu bulgu birleşimi derste sınıflandırılmıyor; aynı derivasyonları yeniden değerlendirin.',
      result: 'Aksesuar yol yeri',
      sites: {
        leftLateral: { name: 'Sol lateral veya anterolateral', note: 'D1 (ya da V1 R ≥ S) sol serbest duvar, aVF pozitif. D1 ve aVL\'de negatif delta beklenir.' },
        leftPosterior: { name: 'Sol posterior veya posterolateral', note: 'Sol serbest duvar, aVF negatif veya izoelektrik. D1 çoğu kez izoelektrik, aVL izoelektrik veya hafif pozitif.' },
        posteroseptalEpi: { name: 'Posteroseptal, subepikardiyal (CS / orta kardiyak ven)', note: 'D1 pozitif, V1 sağ serbest duvar ya da septal biçimde, D2 negatif. Ablasyon CS içinden gerekebilir.' },
        posteroseptalTricuspid: { name: 'Posteroseptal, triküspit anülüs', note: 'V1 izoelektrik veya negatif, D2 negatif değil, aVF negatif.' },
        posteroseptalMitral: { name: 'Posteroseptal, mitral anülüs', note: 'V1 izoelektrik veya negatif, D2 negatif değil, aVF izoelektrik.' },
        midseptal: { name: 'Midseptal', note: 'Septal, aVF pozitif, D3\'te R ≤ S.' },
        anteroseptal: { name: 'Anteroseptal', note: 'Septal, aVF pozitif, D3\'te R > S. D1, D2 ve aVF\'de pozitif delta; His komşuluğu.' },
        rightAnterior: { name: 'Sağ anterior veya anterolateral', note: 'V1 pozitif delta ama R < S, aVF pozitif.' },
        rightLateral: { name: 'Sağ lateral', note: 'V1 pozitif delta ama R < S, aVF izoelektrik.' },
        rightPosterior: { name: 'Sağ posterior veya posterolateral', note: 'V1 pozitif delta ama R < S, aVF negatif.' }
      }
    },
    cs: {
      title: 'CS aktivasyonu ve ablasyon (sinüs ritmi)',
      hint: 'Septum önce uyarılırsa proksimal erken olur; sol lateral yol varsa en erken ventrikül distalde görülür.',
      phases: { normal: 'Aksesuar yol yok', before: 'Seçili yol, ablasyondan önce', after: 'Ablasyondan sonra' },
      normalTitle: 'Normal iletim (aksesuar yol yok)',
      channels: { cs910: 'CS 9-10 (proksimal)', cs78: 'CS 7-8', cs56: 'CS 5-6', cs34: 'CS 3-4', cs12: 'CS 1-2 (distal)' },
      earliest: 'En erken ventrikül',
      order: { proximal: 'proksimalden distale', distal: 'distalden proksimale', middle: 'ortadan iki yöne' },
      mapNote: 'Bölge seçin; yanındaki CS grafiği birlikte güncellenir. Zamanlar şematik eğitim değerleridir, ölçülmüş kayıt değildir.',
      profiles: {
        normal: 'Yol yokken veya başarılı ablasyondan sonra proksimalden distale örnek aktivasyon gösterilir.',
        lateral: 'Sol lateral örnekte CS 1-2 erken, yayılım distalden proksimale. Zamanlar şematiktir.',
        posterior: 'Sol posterior örnekte orta CS erken ve yayılım iki yönlü çizilmiştir. Erken çift kateter konumuna ve yol girişine göre değişir.',
        proximal: 'Bu bölge için proksimal erken örnek gösterilir. CS tek başına septal ve sağ serbest duvar bölgelerini ayıramaz; His ve triküspit anülüs kayıtları gerekir.'
      },
      note: 'Distalde A ile V iç içe: atriyal elektrogramın hemen arkasından gelen erken V, yolun sol lateralde olduğunu gösterir.'
    },
    abl: {
      chips: { delta: 'Delta dalgası', pr: 'PR', hv: 'HV', ablLead: 'ABL d yerel V, deltaya göre', lbbb: 'Sol dal bloğu görünümü', csFirst: 'CS\'te en erken V' },
      channels: { d1: 'D1', avl: 'aVL', his: 'His (HBE)', abl: 'ABL d' },
      monitor: 'Şematik EP kaydı (eğitim zamanlamaları, ölçülmüş kayıt değil). Kesik çizgi: delta veya QRS başlangıcı. Etiketler: P, δ delta, QRS, T; intrakardiyak A atriyum, H His, V ventrikül.',
      hvShort: 'kısa (<35 ms); delta His ile birlikte başlar', hvNormal: 'normal (35–55 ms)', earlier: 'önce', fused: 'A ve V iç içe', notApplicable: 'yol yok',
      present: 'var', absent: 'yok', shortPr: 'kısa', normalPr: 'normal',
      hidden: 'gizli (preeksitasyon maskeliyor)', shown: 'belirgin',
      steps: {
        left: [
          'Hedef: mitral anülüste en erken yerel V, deltadan önce (çizimde 25 ms); kısa yerel AV ve yol potansiyeli güçlü hedef bulgularıdır.',
          'Erişim: retrograd aortik yolla sol ventrikülden ya da transseptal yolla sol atriyumdan.',
          'RF verildikten birkaç saniye içinde delta kaybolur; sol lateral yolda D1 ve aVL\'deki negatif delta gider, sol posteriorda inferior derivasyonlardaki negatif delta.',
          'CS sırası normale döner: önce proksimal, sonra distal; HV normal aralığa (35–55 ms) çıkar.'
        ],
        posteroseptal: [
          'Hedef: CS ağzı çevresi ve triküspit ya da mitral anülüsün posteroseptal kısmı; deltadan önce gelen yerel V.',
          'D2\'de negatif delta varsa yol subepikardiyal olabilir: hedef CS içi veya orta kardiyak ven; koroner artere yakınlık nedeniyle koroner anjiyografi düşünülür.',
          'Başarıda inferior derivasyonlardaki negatif delta kaybolur.',
          'His kaydında HV normale döner (35–55 ms); CS proksimalden başlar.'
        ],
        superiorSeptal: [
          'Hedef: His komşuluğunda deltadan önce gelen yerel V; His kateteri de aynı erken V\'yi görür, iki kayıt yan yana.',
          'Kompakt AV düğüm ve His yakın olduğundan AV blok riski artar; enerji kontrollü verilir, kriyoablasyon seçilebilir.',
          'Başarıda D2, D3 ve aVF\'deki pozitif delta kaybolur, QRS daralır.',
          'HV normale döner (35–55 ms); AV iletim ablasyon sırasında ve sonrasında izlenir.'
        ],
        right: [
          'Hedef: triküspit anülüste deltadan önce gelen yerel V; Josephson triküspit anülüs yolları için en az 25 ms önerir. Kısa yerel AV ve yol potansiyeli de hedefi destekler.',
          'Erişim femoral venden; anülüste temas için uzun ya da yönlendirilebilir kılıf yardımcı olur.',
          'Başarıda V1\'deki derin S ve delta kaybolur, dar QRS döner.',
          'CS proksimalden başlar: CS sağ serbest duvar yollarını ayırmaz, anülüs haritası gerekir.'
        ]
      },
      masked: 'Ders hastası (sol lateral yol): hastada baştan sol dal bloğu vardı; sol lateral yol sol ventrikülü erken uyardığı için görünmüyordu. Yol ablasyonla kapanınca ortaya çıktı: komplikasyon değil, maskenin düşmesi.'
    },
    risk: {
      title: 'Antegrad refrakter periyot',
      label: 'Aksesuar yolun antegrad efektif refrakter periyodu',
      short: '250 ms ve altı: yüksek risk özelliği. Yol kısa aralıkla yeniden uyarılabilir; AF sırasında hızlı ventrikül yanıtı olasıdır. Ablasyon önerilir.',
      long: '250 ms üstü tek başına düşük risk demek değildir: SPERRI, birden fazla yol ve uyarılabilen AVRT de bakılır; değerlendirme izoproterenol ile yapılır.',
      note: 'ESC 2019 SVT kılavuzunda yüksek risk ölçütleri: AF\'de en kısa preeksite RR (SPERRI) ≤250 ms, yolun ERP\'si ≤250 ms, birden fazla yol ve uyarılabilen yol aracılı taşikardi. Refrakter süre iletim hızı değildir. Derste hastanın yolunun ERP\'si 210 ms idi ve ablasyon yapıldı.'
    }
  },
  en: {
    tab: 'WPW localization',
    heading: 'WPW: from the delta wave to the pathway, before and after ablation',
    intro: 'The delta wave is a vector moving away from where the accessory pathway enters the ventricle: negative in the lead looking at that site, positive in the leads opposite. The classic triad: short PR, delta wave, wide QRS.',
    source: 'Compiled from the Kardiyopedi WPW lectures; localization: the Arruda algorithm (J Cardiovasc Electrophysiol 1998;9:2-12); surface and ablation criteria: Josephson\'s Clinical Cardiac Electrophysiology, 2025, chapters 8 and 11; risk: ESC 2019 SVT guideline. A teaching tool, not a patient decision aid.',
    page: {
      navigation: 'WPW learning sections', loc: 'Localization', cs: 'CS and ablation', risk: 'Refractory period',
      mapTitle: 'Accessory pathway atlas', mapNote: 'LAO-like valve plane, approximate teaching regions. Select a region on the map or list to load its ECG example. Waveforms illustrate the options, not patient ECGs. Numbers are not decision order.',
      allLeads: 'Show all leads', guided: 'Back to guided reading', read: 'Read now', decisions: 'decisions completed', complete: 'Algorithm complete; suggested region highlighted on the map.'
    },
    loc: {
      title: 'Localization on the surface ECG',
      hint: 'Pick the delta wave in each lead; the algorithm names the next lead to read.',
      reset: 'Reset',
      unset: 'not read',
      leads: {
        d1: { name: 'Lead I', hint: 'Read first. A negative or isoelectric delta in the first 20 ms points away from the left free wall.', options: { negIso: 'Negative or isoelectric', pos: 'Positive' } },
        v1: { name: 'V1', hint: 'With a positive lead I: R ≥ S left free wall, isoelectric or negative delta septal, positive delta with R < S right free wall.', options: { rGtS: 'Positive delta, R ≥ S', sGtR: 'Positive delta, R < S', isoNeg: 'Isoelectric or negative' } },
        d2: { name: 'Lead II', hint: 'A negative delta suggests a subepicardial posteroseptal pathway (CS, middle cardiac vein); there are exceptions.', options: { pos: 'Positive', iso: 'Isoelectric or biphasic', neg: 'Negative' } },
        avf: { name: 'aVF', hint: 'Anterior-posterior axis: positive means anterior, negative posterior.', options: { pos: 'Positive', iso: 'Isoelectric (plus minus)', neg: 'Negative' } },
        d3: { name: 'Lead III', hint: 'Separates anteroseptal from midseptal when aVF is positive.', options: { rGtS: 'R > S', rLtS: 'R ≤ S' } }
      },
      means: {
        leftFreeWall: 'Lead I negative or isoelectric: left free wall.',
        notLeftByI: 'Lead I positive: read V1.',
        leftFreeWallV1: 'R ≥ S in V1: left free wall.',
        leftAnterior: 'aVF positive: left lateral or anterolateral.',
        leftPosterior: 'aVF negative or isoelectric: left posterior or posterolateral.',
        septalCandidate: 'V1 isoelectric or negative: septal candidate; read lead II.',
        rightCandidate: 'V1 positive with R < S: right free wall candidate; read lead II.',
        epicardial: 'Lead II negative: subepicardial posteroseptal (CS or middle cardiac vein).',
        notEpicardial: 'Lead II not negative: read aVF.',
        posteroseptalTricuspid: 'aVF negative: posteroseptal, tricuspid annulus side.',
        posteroseptalMitral: 'aVF isoelectric: posteroseptal, mitral annulus side.',
        superiorSeptum: 'aVF positive: anteroseptal or midseptal; read lead III.',
        anteroseptal: 'R > S in lead III: anteroseptal (next to the His).',
        midseptal: 'R ≤ S in lead III: midseptal.',
        rightAnterior: 'aVF positive: right anterior or anterolateral.',
        rightLateral: 'aVF isoelectric: right lateral.',
        rightPosterior: 'aVF negative: right posterior or posterolateral.'
      },
      next: 'Next lead to read:',
      stalled: 'This combination is not classified in the lecture; read the same leads again.',
      result: 'Pathway site',
      sites: {
        leftLateral: { name: 'Left lateral or anterolateral', note: 'Lead I (or V1 R ≥ S) left free wall, aVF positive. A negative delta in I and aVL is expected.' },
        leftPosterior: { name: 'Left posterior or posterolateral', note: 'Left free wall, aVF negative or isoelectric. Lead I often isoelectric, aVL isoelectric or slightly positive.' },
        posteroseptalEpi: { name: 'Posteroseptal, subepicardial (CS / middle cardiac vein)', note: 'Lead I positive, V1 septal or right free wall pattern, lead II negative. Ablation may need the CS.' },
        posteroseptalTricuspid: { name: 'Posteroseptal, tricuspid annulus', note: 'V1 isoelectric or negative, lead II not negative, aVF negative.' },
        posteroseptalMitral: { name: 'Posteroseptal, mitral annulus', note: 'V1 isoelectric or negative, lead II not negative, aVF isoelectric.' },
        midseptal: { name: 'Midseptal', note: 'Septal, aVF positive, R ≤ S in lead III.' },
        anteroseptal: { name: 'Anteroseptal', note: 'Septal, aVF positive, R > S in lead III. Positive delta in I, II and aVF; next to the His.' },
        rightAnterior: { name: 'Right anterior or anterolateral', note: 'V1 positive delta with R < S, aVF positive.' },
        rightLateral: { name: 'Right lateral', note: 'V1 positive delta with R < S, aVF isoelectric.' },
        rightPosterior: { name: 'Right posterior or posterolateral', note: 'V1 positive delta with R < S, aVF negative.' }
      }
    },
    cs: {
      title: 'CS activation and ablation (sinus rhythm)',
      hint: 'If the septum is activated first the proximal channel is early; with a left lateral pathway the earliest ventricle is distal.',
      phases: { normal: 'No accessory pathway', before: 'Selected pathway, before ablation', after: 'After ablation' },
      normalTitle: 'Normal conduction (no accessory pathway)',
      channels: { cs910: 'CS 9-10 (proximal)', cs78: 'CS 7-8', cs56: 'CS 5-6', cs34: 'CS 3-4', cs12: 'CS 1-2 (distal)' },
      earliest: 'Earliest ventricle',
      order: { proximal: 'proximal to distal', distal: 'distal to proximal', middle: 'middle to both ends' },
      mapNote: 'Select a region to update the adjacent CS tracing. Timings are schematic teaching values, not measured recordings.',
      profiles: {
        normal: 'Without a pathway or after successful ablation, an illustrative proximal-to-distal sequence is shown.',
        lateral: 'In this left lateral example CS 1-2 is early, spreading distal to proximal. Timings are schematic.',
        posterior: 'This left posterior example illustrates early middle CS with spread in both directions. The earliest pair depends on catheter position and pathway insertion.',
        proximal: 'An illustrative proximal-first sequence is shown for this region. CS alone cannot distinguish septal and right free wall regions; His and tricuspid annular recordings are needed.'
      },
      note: 'A and V run together distally: an early V right behind the atrial electrogram places the pathway on the left lateral wall.'
    },
    abl: {
      chips: { delta: 'Delta wave', pr: 'PR', hv: 'HV', ablLead: 'ABL d local V versus delta', lbbb: 'Left bundle branch block pattern', csFirst: 'Earliest V on the CS' },
      channels: { d1: 'Lead I', avl: 'aVL', his: 'His (HBE)', abl: 'ABL d' },
      monitor: 'Schematic EP recording (teaching timings, not a measured recording). Dashed line: delta or QRS onset. Labels: P, δ delta, QRS, T; intracardiac A atrium, H His, V ventricle.',
      hvShort: 'short (<35 ms); the delta starts with His activation', hvNormal: 'normal (35–55 ms)', earlier: 'earlier', fused: 'A and V merged', notApplicable: 'no pathway',
      present: 'present', absent: 'absent', shortPr: 'short', normalPr: 'normal',
      hidden: 'hidden (masked by pre-excitation)', shown: 'visible',
      steps: {
        left: [
          'Target: the earliest local V on the mitral annulus, ahead of the delta (25 ms here); a short local AV and a pathway potential are strong target findings.',
          'Access: into the left ventricle by the retrograde aortic route, or into the left atrium transseptally.',
          'Within seconds of RF the delta vanishes: the negative delta in I and aVL with a left lateral pathway, the negative inferior delta with a left posterior one.',
          'The CS sequence returns to normal, proximal then distal; HV returns to the normal range (35–55 ms).'
        ],
        posteroseptal: [
          'Target: around the CS ostium and the posteroseptal tricuspid or mitral annulus; a local V ahead of the delta.',
          'A negative delta in lead II suggests a subepicardial pathway: the target may be inside the CS or the middle cardiac vein, and coronary angiography is considered for the nearby artery.',
          'Success removes the negative delta in the inferior leads.',
          'On the His recording HV returns to normal (35–55 ms); the CS starts proximally.'
        ],
        superiorSeptal: [
          'Target: a local V ahead of the delta next to the His bundle; the His catheter records the same early V, the two side by side.',
          'The compact AV node and His are close, so the AV block risk is higher; energy is given with care and cryoablation may be chosen.',
          'Success removes the positive delta in II, III and aVF and narrows the QRS.',
          'HV returns to normal (35–55 ms); AV conduction is watched during and after ablation.'
        ],
        right: [
          'Target: a local V ahead of the delta on the tricuspid annulus; Josephson advises at least 25 ms for tricuspid annular pathways. A short local AV and a pathway potential also support the target.',
          'Access from the femoral vein; a long or steerable sheath helps contact on the annulus.',
          'Success removes the deep S and delta in V1 and the narrow QRS returns.',
          'The CS starts proximally: the CS does not separate right free wall pathways, an annular map is needed.'
        ]
      },
      masked: 'Lecture patient (left lateral pathway): the patient had a left bundle branch block all along; the left lateral pathway, exciting the left ventricle early, hid it. It appeared when the pathway was closed: not a complication, the mask falling.'
    },
    risk: {
      title: 'Anterograde refractory period',
      label: 'Anterograde effective refractory period of the pathway',
      short: '250 ms or less: a high-risk feature. The pathway can be re-excited at short intervals; a fast ventricular response during AF is possible. Ablation is recommended.',
      long: 'Over 250 ms is not low risk on its own: SPERRI, multiple pathways and inducible AVRT are checked too, with isoproterenol.',
      note: 'High-risk criteria in the ESC 2019 SVT guideline: shortest pre-excited RR in AF (SPERRI) ≤250 ms, pathway ERP ≤250 ms, multiple pathways and inducible pathway-mediated tachycardia. Refractoriness is not conduction speed. In the lecture the patient\'s pathway ERP was 210 ms and it was ablated.'
    }
  }
};

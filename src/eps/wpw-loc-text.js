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
    source: 'Derleme: Kardiyopedi WPW dersleri (aksesuar yol lokalizasyonu, WPW ablasyonu); ablasyon ölçütleri: Josephson\'s Clinical Cardiac Electrophysiology, 2025, bölüm 11 (aksesuar yol ablasyonu). Öğretim aracıdır, hasta karar aracı değildir.',
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
        d1: { name: 'D1', hint: 'Sol koldaki derivasyon; sol ventrikül serbest duvar yolundan vektör uzaklaşır.', options: { negIso: 'Negatif veya izoelektrik', pos: 'Pozitif' } },
        v1: { name: 'V1', hint: 'İlk bakılacak derivasyon. Sol yolda vektör V1\'e yaklaşır; septumda sol ventrikül kitlesi baskın olduğundan V1 negatif veya izoelektrik olur.', options: { rGtS: 'Pozitif delta, R > S', sGtR: 'Pozitif delta, S > R', isoNeg: 'İzoelektrik veya negatif' } },
        d2: { name: 'D2 (+60 derece)', hint: 'Orta kardiyak ven bölgesine bakar; epikardiyal yollar sık burada olur.', options: { pos: 'Pozitif', negIso: 'Negatif veya izoelektrik' } },
        avf: { name: 'aVF', hint: 'Arka-ön ekseni: pozitifse yol önde, negatifse arkada.', options: { pos: 'Pozitif', iso: 'İzoelektrik (artı eksi)', neg: 'Negatif' } },
        d3: { name: 'D3', hint: 'Septal yollarda ön ve orta septumu ayırır.', options: { rGtS: 'R > S', rLtS: 'Küçük R, büyük S' } }
      },
      means: {
        leftSide: 'V1\'de R > S: vektör soldan sağa, sol taraflı yol.',
        leftVentricle: 'D1 negatif veya izoelektrik: sol ventrikül serbest duvarı.',
        rightFreeWall: 'V1\'de pozitif delta ama S > R: önce V1\'e yaklaşır, sonra sol ventrikül kitlesiyle uzaklaşır; sağ serbest duvar.',
        septalCandidate: 'V1 izoelektrik veya negatif: septal aday; D2\'ye bakın.',
        septal: 'D2 de negatif veya izoelektrik: septal yol.',
        anterior: 'aVF pozitif: ön.',
        posterior: 'aVF negatif: arka.',
        notAnterior: 'aVF pozitif değil: D2\'ye bakın.',
        notPosterior: 'aVF negatif değil: D3\'e bakın.',
        annulus: 'aVF izoelektrik: mitral veya trikuspit anulus komşuluğu.',
        lateral: 'D2 pozitif: lateral duvar.',
        mid: 'D3\'te küçük R, büyük S: orta septum.'
      },
      next: 'Sıradaki derivasyon:',
      stalled: 'Bu bulgu birleşimi derste sınıflandırılmıyor; aynı derivasyonları yeniden değerlendirin.',
      result: 'Aksesuar yol yeri',
      sites: {
        leftLateral: { name: 'Sol lateral veya anterolateral', note: 'D1 negatif veya izoelektrik, V1 R > S, aVF pozitif.' },
        leftPosterior: { name: 'Sol posterior veya posterolateral', note: 'D1 negatif veya izoelektrik, V1 R > S, aVF negatif.' },
        posteroseptal: { name: 'Posteroseptal', note: 'V1 ve D2 negatif veya izoelektrik, aVF negatif.' },
        septalAnnulus: { name: 'Septal, mitral veya trikuspit anulus komşuluğu', note: 'V1 ve D2 negatif veya izoelektrik, aVF izoelektrik.' },
        midseptal: { name: 'Midseptal', note: 'Septal, aVF pozitif, D3\'te küçük R ve büyük S.' },
        anteroseptal: { name: 'Anteroseptal', note: 'Septal, aVF pozitif, D3\'te R > S.' },
        rightAnterior: { name: 'Sağ anterior veya anterolateral', note: 'V1 pozitif delta ama S > R, aVF pozitif.' },
        rightLateral: { name: 'Sağ lateral serbest duvar', note: 'V1 pozitif delta ama S > R, aVF pozitif değil, D2 pozitif.' },
        rightPosterior: { name: 'Sağ posterior veya posterolateral', note: 'V1 pozitif delta ama S > R, aVF ve D2 pozitif değil.' }
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
      hvShort: 'kısa veya sıfır (delta His ile birlikte başlar)', hvNormal: 'normal (<55 ms)', earlier: 'önce', fused: 'A ve V iç içe', notApplicable: 'yol yok',
      present: 'var', absent: 'yok', shortPr: 'kısa', normalPr: 'normal',
      hidden: 'gizli (preeksitasyon maskeliyor)', shown: 'belirgin',
      steps: {
        left: [
          'Hedef: mitral anülüste deltadan önce gelen en erken yerel V (çizimde 25 ms); A ile V iç içe, CS distalindeki V\'den bile erken.',
          'Erişim: retrograd aortik yolla sol ventrikülden ya da transseptal yolla sol atriyumdan.',
          'RF verildikten birkaç saniye içinde delta kaybolur; D1 ve aVL\'deki negatif delta gider.',
          'CS sırası normale döner: önce proksimal, sonra distal; HV normal aralığa çıkar.'
        ],
        septal: [
          'Hedef: septal anülüste (CS ağzı çevresi ya da His komşuluğu) deltadan önce gelen yerel V.',
          'His ve kompakt AV düğüme yakınlık nedeniyle enerji kontrollü verilir; anteroseptal ve midseptal yollarda AV blok riski artar, kriyoablasyon seçilebilir.',
          'Başarıda inferior derivasyonlardaki negatif delta kaybolur, QRS daralır.',
          'His kaydında HV normale döner; CS yine proksimalden başlar.'
        ],
        right: [
          'Hedef: triküspit anülüste deltadan en az 25 ms önce gelen yerel V (Josephson); A ile V iç içe.',
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
      short: 'Kısa (250 ms ve altı): yol hızlı iletir, ablasyon lehine.',
      long: 'Uzun (250 ms üstü): asemptomatik hastada ablasyon yapmamak bir seçenek olabilir.',
      note: 'Derste hastanın yolunun refrakter periyodu 210 ms idi ve ablasyon yapıldı.'
    }
  },
  en: {
    tab: 'WPW localization',
    heading: 'WPW: from the delta wave to the pathway, before and after ablation',
    intro: 'The delta wave is a vector moving away from where the accessory pathway enters the ventricle: negative in the lead looking at that site, positive in the leads opposite. The classic triad: short PR, delta wave, wide QRS.',
    source: 'Compiled from the Kardiyopedi WPW lectures (accessory pathway localization, WPW ablation); ablation criteria: Josephson\'s Clinical Cardiac Electrophysiology, 2025, chapter 11 (accessory pathway ablation). A teaching tool, not a patient decision aid.',
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
        d1: { name: 'D1', hint: 'The left arm lead; a vector leaves it for a left ventricular free wall pathway.', options: { negIso: 'Negative or isoelectric', pos: 'Positive' } },
        v1: { name: 'V1', hint: 'The first lead to read. A left pathway sends the vector toward V1; at the septum the left ventricular mass dominates, so V1 is negative or isoelectric.', options: { rGtS: 'Positive delta, R > S', sGtR: 'Positive delta, S > R', isoNeg: 'Isoelectric or negative' } },
        d2: { name: 'D2 (+60 degrees)', hint: 'Faces the middle cardiac vein region, where epicardial pathways often sit.', options: { pos: 'Positive', negIso: 'Negative or isoelectric' } },
        avf: { name: 'aVF', hint: 'Posterior-anterior axis: positive means anterior, negative posterior.', options: { pos: 'Positive', iso: 'Isoelectric (plus-minus)', neg: 'Negative' } },
        d3: { name: 'D3', hint: 'Among septal pathways it separates the anterior from the mid septum.', options: { rGtS: 'R > S', rLtS: 'Small R, large S' } }
      },
      means: {
        leftSide: 'R > S in V1: the vector goes from left to right, a left-sided pathway.',
        leftVentricle: 'D1 negative or isoelectric: the left ventricular free wall.',
        rightFreeWall: 'A positive delta in V1 but S > R: first toward V1, then away with the left ventricular mass; right free wall.',
        septalCandidate: 'V1 isoelectric or negative: a septal candidate; read D2.',
        septal: 'D2 negative or isoelectric as well: a septal pathway.',
        anterior: 'aVF positive: anterior.',
        posterior: 'aVF negative: posterior.',
        notAnterior: 'aVF not positive: read D2.',
        notPosterior: 'aVF not negative: read D3.',
        annulus: 'aVF isoelectric: next to the mitral or tricuspid annulus.',
        lateral: 'D2 positive: lateral wall.',
        mid: 'Small R and large S in D3: mid septum.'
      },
      next: 'Next lead to read:',
      stalled: 'This combination is not classified in the lecture; read the same leads again.',
      result: 'Pathway site',
      sites: {
        leftLateral: { name: 'Left lateral or anterolateral', note: 'D1 negative or isoelectric, V1 R > S, aVF positive.' },
        leftPosterior: { name: 'Left posterior or posterolateral', note: 'D1 negative or isoelectric, V1 R > S, aVF negative.' },
        posteroseptal: { name: 'Posteroseptal', note: 'V1 and D2 negative or isoelectric, aVF negative.' },
        septalAnnulus: { name: 'Septal, next to the mitral or tricuspid annulus', note: 'V1 and D2 negative or isoelectric, aVF isoelectric.' },
        midseptal: { name: 'Midseptal', note: 'Septal, aVF positive, small R and large S in D3.' },
        anteroseptal: { name: 'Anteroseptal', note: 'Septal, aVF positive, R > S in D3.' },
        rightAnterior: { name: 'Right anterior or anterolateral', note: 'V1 positive delta but S > R, aVF positive.' },
        rightLateral: { name: 'Right lateral free wall', note: 'V1 positive delta but S > R, aVF not positive, D2 positive.' },
        rightPosterior: { name: 'Right posterior or posterolateral', note: 'V1 positive delta but S > R, neither aVF nor D2 positive.' }
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
      hvShort: 'short or zero (the delta starts with His activation)', hvNormal: 'normal (<55 ms)', earlier: 'earlier', fused: 'A and V merged', notApplicable: 'no pathway',
      present: 'present', absent: 'absent', shortPr: 'short', normalPr: 'normal',
      hidden: 'hidden (masked by pre-excitation)', shown: 'visible',
      steps: {
        left: [
          'Target: the earliest local V on the mitral annulus, ahead of the delta wave (25 ms here); A and V merged, earlier than the V on the distal CS.',
          'Access: into the left ventricle by the retrograde aortic route, or into the left atrium transseptally.',
          'Within a few seconds of RF the delta wave vanishes; the negative delta in lead I and aVL goes.',
          'The CS sequence returns to normal, proximal then distal; the HV interval becomes normal.'
        ],
        septal: [
          'Target: a local V ahead of the delta wave on the septal annulus (around the CS ostium or next to the His).',
          'Energy is given with care near the His bundle and compact AV node; anteroseptal and midseptal pathways carry a higher AV block risk, and cryoablation may be chosen.',
          'Success removes the negative delta in the inferior leads and narrows the QRS.',
          'On the His recording the HV interval returns to normal; the CS still starts proximally.'
        ],
        right: [
          'Target: a local V at least 25 ms ahead of the delta wave on the tricuspid annulus (Josephson); A and V merged.',
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
      short: 'Short (250 ms or less): the pathway conducts fast, favors ablation.',
      long: 'Long (over 250 ms): in an asymptomatic patient, not ablating can be an option.',
      note: 'In the lecture the patient\'s pathway had a refractory period of 210 ms and was ablated.'
    }
  }
};

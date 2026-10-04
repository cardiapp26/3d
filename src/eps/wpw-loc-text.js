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
    source: 'Derleme: Kardiyopedi WPW dersleri (aksesuar yol lokalizasyonu, WPW ablasyonu). Öğretim aracıdır, hasta karar aracı değildir.',
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
      title: 'Koroner sinüste ventrikül aktivasyonu (sinüs ritmi)',
      hint: 'Septum önce uyarılırsa proksimal erken olur; sol lateral yol varsa en erken ventrikül distalde görülür.',
      phases: { normal: 'Aksesuar yol yok', before: 'Sol lateral yol, ablasyondan önce', after: 'Ablasyondan sonra' },
      channels: { cs910: 'CS 9-10 (proksimal)', cs78: 'CS 7-8', cs56: 'CS 5-6', cs34: 'CS 3-4', cs12: 'CS 1-2 (distal)' },
      earliest: 'En erken ventrikül',
      order: { proximal: 'proksimalden distale', distal: 'distalden proksimale' },
      note: 'Distalde A ile V iç içe: atriyal elektrogramın hemen arkasından gelen erken V, yolun sol lateralde olduğunu gösterir.'
    },
    abl: {
      title: 'Ablasyondan önce ve sonra aynı hasta',
      phases: { before: 'Ablasyondan önce', after: 'Ablasyondan sonra' },
      chips: { delta: 'Delta dalgası', pr: 'PR', lbbb: 'Sol dal bloğu görünümü', csFirst: 'CS\'te en erken V' },
      present: 'var', absent: 'yok', shortPr: 'kısa', normalPr: 'normal',
      hidden: 'gizli (preeksitasyon maskeliyor)', shown: 'belirgin',
      steps: [
        'Hedef: kateter ucunda en erken ventrikül aktivasyonu; CS distalindeki V\'den bile erken, A ve V iç içe.',
        'Sol yola retrograd aortik yolla sol ventriküle girilerek ulaşıldı.',
        'RF verildikten birkaç saniye içinde preeksitasyon kayboldu.',
        'CS sırası tersine döndü: önce proksimal, sonra distal.'
      ],
      masked: 'Hastada baştan sol dal bloğu vardı; sol lateral yol sol ventrikülü erken uyardığı için görünmüyordu. Yol ablasyonla kapanınca ortaya çıktı: komplikasyon değil, maskenin düşmesi.'
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
    source: 'Compiled from the Kardiyopedi WPW lectures (accessory pathway localization, WPW ablation). A teaching tool, not a patient decision aid.',
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
      title: 'Ventricular activation on the coronary sinus (sinus rhythm)',
      hint: 'If the septum is activated first the proximal channel is early; with a left lateral pathway the earliest ventricle is distal.',
      phases: { normal: 'No accessory pathway', before: 'Left lateral pathway, before ablation', after: 'After ablation' },
      channels: { cs910: 'CS 9-10 (proximal)', cs78: 'CS 7-8', cs56: 'CS 5-6', cs34: 'CS 3-4', cs12: 'CS 1-2 (distal)' },
      earliest: 'Earliest ventricle',
      order: { proximal: 'proximal to distal', distal: 'distal to proximal' },
      note: 'A and V run together distally: an early V right behind the atrial electrogram places the pathway on the left lateral wall.'
    },
    abl: {
      title: 'The same patient before and after ablation',
      phases: { before: 'Before ablation', after: 'After ablation' },
      chips: { delta: 'Delta wave', pr: 'PR', lbbb: 'Left bundle branch block pattern', csFirst: 'Earliest V on the CS' },
      present: 'present', absent: 'absent', shortPr: 'short', normalPr: 'normal',
      hidden: 'hidden (masked by pre-excitation)', shown: 'visible',
      steps: [
        'Target: the earliest ventricular activation at the catheter tip; earlier than the V on the distal CS, with A and V merged.',
        'The pathway was reached through the left ventricle by the retrograde aortic route.',
        'Within a few seconds of RF the pre-excitation vanished.',
        'The CS sequence reversed: proximal first, then distal.'
      ],
      masked: 'The patient had a left bundle branch block all along; the left lateral pathway, exciting the left ventricle early, hid it. It appeared when the pathway was closed: not a complication, the mask falling.'
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

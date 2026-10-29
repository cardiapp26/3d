// Sequence teaching text (TR/EN) after Kramer CM, et al. JCMR 2020;22:17.

export const SEQUENCES = [
  {
    id: 'cine', label: { tr: 'Cine bSSFP', en: 'Cine bSSFP' },
    purpose: { tr: 'Ventrikül boyutları, hacimleri ve global/bölgesel sistolik işlev.', en: 'Ventricular size, volumes and global and regional systolic function.' },
    how: {
      tr: ['1,5 T’de standart cine yöntemidir; kan-miyokart kontrastı yüksek olduğu için seçilir.', '3 T’de rezonans dışı (off-resonance) bantlanma artefaktı sık; gerekirse spoiled GRE cine alternatiftir.', 'Uzun eksenler (2CH, 3CH, 4CH) ve bazalden apekse SAX yığını; kesit 6–8 mm, aralık 2–4 mm.', 'Zamansal çözünürlük ≤45 ms; nefes tutarak, EKG tetiklemeli.'],
      en: ['The default cine method at 1.5 T, chosen for its high blood-myocardium contrast.', 'At 3 T off-resonance banding artifacts are common; spoiled GRE cine is the alternative.', 'Long axes (2CH, 3CH, 4CH) plus a base-to-apex SAX stack; 6–8 mm slices with 2–4 mm gaps.', 'Temporal resolution ≤45 ms; breath-held, ECG-gated.']
    },
    measures: { tr: 'SAX yığınından disk toplamıyla (Simpson) EDV, ESV, SV, EF ve kütle; uzun eksenlerde bölgesel duvar hareketi.', en: 'EDV, ESV, SV, EF and mass by disc summation (Simpson) of the SAX stack; regional wall motion on long axes.' },
    pitfall: { tr: 'Bazal kesitte LV ile LA ayrımı: mitral düzleminin üstündeki kesit (LA) hacme eklenirse EDV ve EF hatalı olur; uzun eksenlerle çapraz kontrol edin.', en: 'Basal slice selection: including a slice above the mitral plane (LA) corrupts EDV and EF; cross-check with the long axes.' }
  },
  {
    id: 'lge', label: { tr: 'LGE', en: 'LGE' },
    purpose: { tr: 'Odak skar ve fibrozun saptanması ve dağılımının (iskemik/non-iskemik) ayrımı.', en: 'Detection of focal scar or fibrosis and its pattern (ischaemic versus non-ischaemic).' },
    how: {
      tr: ['Gadolinyum sonrası en az 10 dk; cine ile aynı düzlemler (SAX yığını ve uzun eksenler).', 'Doz 0,1–0,2 mmol/kg; stres/istirahat perfüzyonu yapıldıysa ikinci enjeksiyondan yaklaşık 5 dk sonra.', 'İnversiyon zamanı (TI) normal miyokardı sıfırlayacak şekilde TI tarama (TI scout) ile seçilir.', 'PSIR seçeneği TI seçimine daha az duyarlıdır; aritmide tek atım (single-shot) alınabilir.'],
      en: ['At least 10 min after gadolinium; same planes as cine (SAX stack and long axes).', 'Dose 0.1–0.2 mmol/kg; if stress/rest perfusion was done, about 5 min after the second injection.', 'Inversion time (TI) is chosen to null normal myocardium using a TI scout.', 'PSIR is less sensitive to TI choice; single-shot imaging helps with arrhythmia.']
    },
    measures: { tr: 'Odak tutulumun yeri, yaygınlığı ve transmuralitesi (canlılık).', en: 'Location, extent and transmurality of focal enhancement (viability).' },
    pitfall: { tr: 'Yanlış TI normal miyokardı gri bırakır ve skarı taklit edebilir ya da gizleyebilir; LGE göreceli olduğu için yaygın fibroz kaçabilir (T1/ECV gerekir).', en: 'A wrong TI leaves normal myocardium grey and can mimic or hide scar; LGE is relative, so diffuse fibrosis may be missed (needs T1/ECV).' }
  },
  {
    id: 't1', label: { tr: 'Nativ T1 / ECV', en: 'Native T1 / ECV' },
    purpose: { tr: 'Kontrastsız miyokart T1 değeri ve hücre dışı hacim oranı (ECV) ile yaygın doku değişikliği.', en: 'Contrast-free myocardial T1 and extracellular volume fraction (ECV) for diffuse tissue change.' },
    how: {
      tr: ['Nativ T1: kontrast verilmeden MOLLI veya eşdeğeri; en az bir SAX (genellikle orta) kesit.', 'ECV: kontrast öncesi ve kontrasttan 10–30 dk sonra T1 haritası ve aynı gün hematokrit.', 'ECV = (1 − Hct) × (ΔR1 miyokart / ΔR1 kan), R1 = 1/T1.', 'Normal değerler sahaya, alan gücüne ve sekansa özgüdür; yerel referans aralığı kullanılır.'],
      en: ['Native T1: no contrast, MOLLI or equivalent; at least one SAX (usually mid) slice.', 'ECV: T1 maps before and 10–30 min after contrast plus a same-day haematocrit.', 'ECV = (1 − Hct) × (ΔR1 myocardium / ΔR1 blood), with R1 = 1/T1.', 'Normal values are site-, field strength- and sequence-specific; use a local reference range.']
    },
    measures: { tr: 'Miyokart T1 (ms) ve ECV (%); amiloidoz, yaygın fibroz, demir ve yağ birikiminde değişir.', en: 'Myocardial T1 (ms) and ECV (%); altered in amyloidosis, diffuse fibrosis, iron and fat deposition.' },
    pitfall: { tr: 'Kan havuzu ile kısmi hacim etkisi T1 değerini yükseltir: ROI’yi septum orta duvarına, sınırlardan uzak çizin.', en: 'Partial volume with the blood pool raises T1: place the ROI in the mid-wall septum, away from borders.' }
  },
  {
    id: 't2', label: { tr: 'T2 haritalama', en: 'T2 mapping' },
    purpose: { tr: 'Miyokart ödemini (serbest su artışı) gösteren ayrı bir sekans.', en: 'A separate sequence that shows myocardial oedema (increased free water).' },
    how: {
      tr: ['T1’den bağımsız, ayrı alınır: T2 hazırlıklı SSFP (veya eşdeğeri) haritalama.', 'Kontrast gerekmez; SAX kesitleri, gerekirse uzun eksenler.', 'Akut miyokardit, akut MI, kalp nakli reddi ve sarkoidozda ödem arayışında kullanılır.'],
      en: ['Acquired separately from T1: T2-prepared SSFP (or equivalent) mapping.', 'No contrast needed; SAX slices, plus long axes when required.', 'Used to look for oedema in acute myocarditis, acute MI, transplant rejection and sarcoidosis.']
    },
    measures: { tr: 'Miyokart T2 (ms); bölgesel veya yaygın artış ödemi düşündürür.', en: 'Myocardial T2 (ms); a regional or global rise suggests oedema.' },
    pitfall: { tr: 'Hareket ve kısmi hacim haritayı bozar; normal değer sahaya ve sekansa özgüdür.', en: 'Motion and partial volume distort the map; the normal value is site- and sequence-specific.' }
  },
  {
    id: 'pc', label: { tr: 'Faz kontrast', en: 'Phase contrast' },
    purpose: { tr: 'Hız ve akım ölçümü; morfoloji için değil.', en: 'Velocity and flow measurement, not morphology.' },
    how: {
      tr: ['Kapak veya büyük damara dik, düzlem içinden geçen (through-plane) akım kodlaması.', 'Örnek: aort kapağının hemen üstü, ana pulmoner arter.', 'VENC beklenen tepe hızın biraz üstüne ayarlanır; altında kalırsa katlanma (aliasing) olur.', 'Retrospektif EKG tetiklemeyle tüm kardiyak döngü.'],
      en: ['Through-plane velocity encoding perpendicular to the valve or great vessel.', 'Example: just above the aortic valve, main pulmonary artery.', 'Set VENC just above the expected peak velocity; below it, aliasing occurs.', 'Retrospective ECG gating covers the whole cycle.']
    },
    measures: { tr: 'Tepe hız, ileri ve geri akım hacmi, atım hacmi, yetersizlik fraksiyonu ve Qp/Qs.', en: 'Peak velocity, forward and backward flow volumes, stroke volume, regurgitant fraction and Qp/Qs.' },
    pitfall: { tr: 'Düzlem jete dik değilse tepe hız düşük ölçülür; arka plan faz kayması akım hacmini saptırır.', en: 'A plane not perpendicular to the jet underestimates peak velocity; background phase offset biases flow volumes.' }
  },
  {
    id: 'perfusion', label: { tr: 'Perfüzyon', en: 'Perfusion' },
    purpose: { tr: 'Stres altında miyokart perfüzyon defektinin (iskemi) saptanması.', en: 'Detection of stress-induced myocardial perfusion defects (ischaemia).' },
    how: {
      tr: ['İlk geçiş (first pass) görüntüleme, genellikle vazodilatör stres altında.', 'Her atımda üç SAX kesit: bazal, orta ve apikal.', 'Doz 0,05–0,1 mmol/kg, 3–7 ml/s hızla ve ardından serum fizyolojik.', 'SCMR 2020: istirahat perfüzyonu çoğu zaman az katkı sağlar, mümkünse atlanabilir.'],
      en: ['First-pass imaging, usually under vasodilator stress.', 'Three SAX slices every heartbeat: basal, mid and apical.', 'Dose 0.05–0.1 mmol/kg at 3–7 ml/s followed by a saline flush.', 'SCMR 2020: rest perfusion often adds little and may be omitted where possible.']
    },
    measures: { tr: 'Koroner alana uyan subendokardiyal veya transmural geç/az tutulum; sinyal-zaman eğrisi.', en: 'Subendocardial or transmural hypoenhancement in a coronary territory; signal-time curve.' },
    pitfall: { tr: 'Koyu halka (dark rim) artefaktı: kontrast gelişinde birkaç atım süren, koroner alana uymayan ince subendokardiyal koyu bant.', en: 'Dark-rim artifact: a thin subendocardial dark band lasting a few beats at contrast arrival, not matching a coronary territory.' }
  },
  {
    id: 'mra', label: { tr: '3D CE-MRA', en: '3D CE-MRA' },
    purpose: { tr: 'Aort ve pulmoner arterlerin üç boyutlu kontrastlı anjiyografisi.', en: 'Three-dimensional contrast-enhanced angiography of the aorta and pulmonary arteries.' },
    how: {
      tr: ['3D spoiled GRE, nefes tutarak; arteryel ilk geçişe zamanlanır (test bolusu veya bolus izleme).', 'Kilogram başına doz (genellikle 0,1–0,2 mmol/kg).', 'Koarktasyon, anevrizma, diseksiyon ve konjenital kalp hastalığı değerlendirmesi.'],
      en: ['3D spoiled GRE, breath-held; timed to the arterial first pass (test bolus or bolus tracking).', 'Weight-based dose (commonly 0.1–0.2 mmol/kg).', 'Used for coarctation, aneurysm, dissection and congenital heart disease.']
    },
    measures: { tr: 'Damar anatomisi ve çapları (çok düzlemli yeniden yapılandırmada).', en: 'Vessel anatomy and diameters (on multiplanar reformats).' },
    pitfall: { tr: 'MIP duvarı ve lümen içi ayrıntıyı gizler; çaplar MIP’te değil MPR veya kaynak görüntülerde ölçülür. Geç zamanlamada venöz kontaminasyon olur.', en: 'MIP hides wall and intraluminal detail; measure diameters on MPR or source images, not MIP. Late timing causes venous contamination.' }
  }
];

export const LGE_PATTERNS = [
  { id: 'subendo', group: 'ischaemic', label: { tr: 'Subendokardiyal (iskemik)', en: 'Subendocardial (ischaemic)' } },
  { id: 'transmural', group: 'ischaemic', label: { tr: 'Transmural (iskemik)', en: 'Transmural (ischaemic)' } },
  { id: 'midwall', group: 'non-ischaemic', label: { tr: 'Orta duvar (non-iskemik)', en: 'Mid-wall (non-ischaemic)' } },
  { id: 'epicardial', group: 'non-ischaemic', label: { tr: 'Epikardiyal (non-iskemik)', en: 'Epicardial (non-ischaemic)' } }
];

export const LGE_NOTES = {
  ischaemic: { tr: 'İskemik: subendokarttan başlar, bir koroner arter alanına uyar (burada LAD: anterior ve anteroseptal).', en: 'Ischaemic: starts at the subendocardium and follows a coronary territory (here LAD: anterior and anteroseptal).' },
  'non-ischaemic': { tr: 'Non-iskemik: subendokardı korur; orta duvar (ör. septum) veya epikardiyal (ör. inferolateral, miyokardit) dağılım.', en: 'Non-ischaemic: spares the subendocardium; mid-wall (e.g. septum) or epicardial (e.g. inferolateral, myocarditis) pattern.' }
};

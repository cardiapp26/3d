/*
 * Text of the electrophysiological anatomy cases, Turkish and English
 * (research/ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md). Diagnosis clips
 * carry a neutral description and a separate evidence text so the first
 * screen does not give the diagnosis away (report section 4). Every number in
 * these texts is a designed synthetic timing, not a measured interval.
 */

export const EP_DISCLAIMER = Object.freeze({
  tr: 'Sentetik kayıt: klinik kayıt değildir, karar kuralı vermez.',
  en: 'Synthetic strip: not a clinical recording and not a decision rule.'
});

export const EP_CITATION_NOTE = Object.freeze({
  tr: 'Kaynak numaraları raporun 13. bölümüne gider (research/ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md).',
  en: 'Reference numbers point to section 13 of the report (research/ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md).'
});

export const EP_TEXT = Object.freeze({
  tr: {
    eyebrow: 'ELEKTROFİZYOLOJİK ANATOMİ · SENTETİK KAYIT',
    sections: { diagnosis: 'Tanı', maneuver: 'Manevralar', treatment: 'Tedavi' },
    caseLabel: 'Olgu', clipLabel: 'Kayıt',
    evidenceShow: 'Kanıtı göster', evidenceHide: 'Kanıtı gizle',
    neutralTitle: 'Taşikardi kaydı (mekanizma gizli)',
    neutralPrompt: 'Önce kendiniz değerlendirin: en erken atriyal aktivasyon hangi kanalda? VA kısa mı, uzun mu? Dizilim konsantrik mi, eksantrik mi? Tek kayıt kesin tanı vermez; "Kanıtı göster" mekanizma yorumunu açar.',
    csCompare: 'CS ağzı karşılaştırması: tipik AVNRT, atipik AVNRT, inferior paraseptal AP ve PJRT kayıtlarında proksimal CS erken A benzer görünebilir. Erken proksimal A tek başına yetmez; ayrım manevrayla yapılır.',
    results: { valid: 'Geçerli manevra', invalidCapture: 'Yorumlanamaz: yakalama yok', insufficientEvidence: 'Yetersiz kanıt' },
    maneuverFields: { goal: 'Amaç', precondition: 'Ön koşul', expected: 'Beklenen yanıt', inference: 'Çıkarım', pitfall: 'Tuzak' },
    endpointLabel: 'Elektriksel sonlanım',
    measures: 'Ölçümler (olaylardan)', sources: 'Kaynaklar'
  },
  en: {
    eyebrow: 'ELECTROPHYSIOLOGICAL ANATOMY · SYNTHETIC RECORDING',
    sections: { diagnosis: 'Diagnosis', maneuver: 'Maneuvers', treatment: 'Treatment' },
    caseLabel: 'Case', clipLabel: 'Recording',
    evidenceShow: 'Show evidence', evidenceHide: 'Hide evidence',
    neutralTitle: 'Tachycardia recording (mechanism hidden)',
    neutralPrompt: 'Assess it yourself first: which channel has the earliest atrial activation? Is VA short or long? Is the sequence concentric or eccentric? One recording never gives a definite diagnosis; "Show evidence" opens the mechanism reading.',
    csCompare: 'CS ostium comparison: typical AVNRT, atypical AVNRT, an inferior paraseptal pathway and PJRT can all show a similar early proximal CS A. Early proximal A alone is not enough; the maneuvers separate them.',
    results: { valid: 'Valid maneuver', invalidCapture: 'Uninterpretable: no capture', insufficientEvidence: 'Insufficient evidence' },
    maneuverFields: { goal: 'Goal', precondition: 'Precondition', expected: 'Expected response', inference: 'Inference', pitfall: 'Pitfall' },
    endpointLabel: 'Electrical endpoint',
    measures: 'Measurements (from the events)', sources: 'Sources'
  }
});


/** Zone names and risk notes (report section 5 matrix); zones are schematic atlas regions. */
export const EP_ZONE_TEXT = Object.freeze({
  'left-free-wall': {
    tr: { name: 'Sol lateral / sol serbest duvar (mitral anulus)', risk: 'Distal CS\'de erken A tek başına kesin hedef veya AP katılımı değildir. Transseptal ve retrograd aortik erişim farkı ayrıca öğretilir.' },
    en: { name: 'Left lateral / left free wall (mitral annulus)', risk: 'An early distal CS A alone is neither the definite target nor proof of participation. Transseptal versus retrograde aortic access is taught separately.' }
  },
  'left-anterolateral': {
    tr: { name: 'Sol anterior / anterolateral (mitral anulus)', risk: '"Bütün sol AP\'ler CS 1-2" yanlıştır; CS dizisi tek başına yetersiz kalabilir.' },
    en: { name: 'Left anterior / anterolateral (mitral annulus)', risk: '"All left pathways are CS 1-2" is wrong; the CS sequence alone can be insufficient.' }
  },
  'left-posterolateral': {
    tr: { name: 'Sol posterior / posterolateral (mitral anulus)', risk: 'Oblik yol nedeniyle antegrad ve retrograd en erken noktalar farklı olabilir.' },
    en: { name: 'Left posterior / posterolateral (mitral annulus)', risk: 'With an oblique pathway the earliest antegrade and retrograde points can differ.' }
  },
  'right-lateral': {
    tr: { name: 'Sağ lateral / anterolateral (triküspit anulus)', risk: 'HRA\'nın erken oluşu yalnız kateterin ilgili insersiyona yakınlığıyla anlamlıdır; sağ annüler harita veya Halo gerekebilir.' },
    en: { name: 'Right lateral / anterolateral (tricuspid annulus)', risk: 'An early HRA matters only for how close that catheter sits to the insertion; an annular map or Halo may be needed.' }
  },
  'right-posterior-inferior': {
    tr: { name: 'Sağ posterior / inferior (triküspit anulus)', risk: 'Proksimal CS referansı tüm sağ serbest duvarı örneklemez; sağ inferior anulus ile CS ağzı ayrılmalıdır.' },
    en: { name: 'Right posterior / inferior (tricuspid annulus)', risk: 'A proximal CS reference does not sample the whole right free wall; the right inferior annulus and the CS ostium must be separated.' }
  },
  'superior-paraseptal': {
    tr: { name: 'Superior paraseptal / para-Hisian (geleneksel anteroseptal)', risk: 'AV blok riski: ileti sistemi komşuluğu. H sinyalinin yakın/uzak alan ayrımı yapılmalı; RF/kriyo seçenekleri kavramsal karşılaştırılır.' },
    en: { name: 'Superior paraseptal / para-Hisian (traditional anteroseptal)', risk: 'AV block risk: conduction system neighbourhood. Near versus far field H must be separated; RF and cryo are compared conceptually.' }
  },
  'mid-paraseptal': {
    tr: { name: 'Orta paraseptal (geleneksel midseptal)', risk: 'AV düğüm çevresi risk alanıdır; görünüm AVNRT ile çakışabilir, katılım manevrası gerekir.' },
    en: { name: 'Mid paraseptal (traditional midseptal)', risk: 'The AV node neighbourhood is a risk area; the picture can overlap AVNRT and a participation maneuver is needed.' }
  },
  'inferior-paraseptal': {
    tr: { name: 'Inferior paraseptal (geleneksel posteroseptal)', risk: 'CS ağzı, Koch yavaş yol hedefi ve AP aynı yapı değildir. Sağ endokardiyal, sol endokardiyal ve venöz kaynaklar ayrı haritalanır.' },
    en: { name: 'Inferior paraseptal (traditional posteroseptal)', risk: 'The CS ostium, the Koch slow pathway target and the pathway are not the same structure. Right endocardial, left endocardial and venous sources are mapped separately.' }
  },
  'koch-slow-pathway': {
    tr: { name: 'Koch üçgeni: yavaş yol / septal istmus', risk: 'Kompakt AV düğüm apekstedir; junctional ritim sırasında yeni VA blok enerjiyi durdurma uyarısıdır.' },
    en: { name: 'Triangle of Koch: slow pathway / septal isthmus', risk: 'The compact AV node sits at the apex; new VA block during junctional rhythm is a warning to stop energy delivery.' }
  },
  'koch-inferior-extensions': {
    tr: { name: 'Koch bölgesi: inferior nodal uzantılar', risk: 'Atipik AVNRT\'de retrograd yavaş yol bu bölgededir; AV düğüm komşuluğu risk alanıdır.' },
    en: { name: 'Koch region: inferior nodal extensions', risk: 'In atypical AVNRT the retrograde slow pathway sits here; the AV node neighbourhood is a risk area.' }
  },
  'crista-terminalis': {
    tr: { name: 'Krista terminalis (fokal AT kaynağı)', risk: 'Fokal AT\'nin en sık kaynağıdır (kristal taşikardi). Anulus AP zonu değildir; 3B görünümde ölçülen kristanın üst üçte biri işaretlenir. Uzun RP görünümü atipik AVNRT ve PJRT ile çakışır.' },
    en: { name: 'Crista terminalis (focal AT source)', risk: 'The commonest source of focal AT (cristal tachycardia). It is not an annular pathway zone; the 3D view marks the upper third of the measured crista. Its long RP picture overlaps atypical AVNRT and PJRT.' }
  },
  'cavotricuspid-isthmus': {
    tr: { name: 'Kavotriküspit istmus (CTI)', risk: 'Triküspit anulus ile İVK ağzı arasındaki sağ atriyum tabanı; tipik flutterin yavaş iletim koridoru. CS ağzı ve Koch bölgesi komşudur; hat yeri şematiktir.' },
    en: { name: 'Cavotricuspid isthmus (CTI)', risk: 'The right atrial floor between the tricuspid annulus and the IVC orifice; the slow conduction corridor of typical flutter. The CS ostium and the Koch region are next to it; the line position is schematic.' }
  },
  'cs-mcv': {
    tr: { name: 'CS / orta kardiyak ven bağlantısı', risk: 'Koroner komşuluk ve ven hasarı: özel risk katmanı. Model gerçek arter-hedef uzaklığı veya termal hasar hesaplamaz; normal görünen CS bağlantıyı dışlamaz.' },
    en: { name: 'CS / middle cardiac vein connection', risk: 'Coronary neighbourhood and venous injury: a separate risk layer. The model computes no real artery distance or thermal injury; a normal-looking CS does not exclude the connection.' }
  },
  'lv-posterior-septum': {
    tr: { name: 'LV posterior septum, posterior fasikül ağı (şematik)', risk: 'Fasiküler VT\'nin ablasyon hedefi P1/P2 potansiyelleriyle bulunur; işaret şematik bölgedir, haritalanmış devre değildir. Sol dal hasarı risk katmanıdır (R21, R23).' },
    en: { name: 'LV posterior septum, posterior fascicular network (schematic)', risk: 'The ablation target of fascicular VT is found with the P1/P2 potentials; the marker is a schematic region, not a mapped circuit. Left bundle injury is the risk layer (R21, R23).' }
  },
  'right-bundle': {
    tr: { name: 'Sağ dal (His-Purkinje, şematik)', risk: 'Sağ dal ablasyonu BBR devresini keser; kalıcı pacemaker gereksinimi ve ardından interfasiküler reentri gelişimi ayrı risklerdir (R26, R28).' },
    en: { name: 'Right bundle branch (His-Purkinje, schematic)', risk: 'Right bundle ablation interrupts the BBR circuit; permanent pacing need and subsequent interfascicular reentry are separate risks (R26, R28).' }
  },
  'pv-antrum': {
    tr: { name: 'Pulmoner ven antrumu (şematik halkalar)', risk: 'Hedef ven ağzı değil antrumdur; ven içinde enerji PV stenozu riskidir. Halkalar şematiktir, lezyon seti modellenmez; özofagus ve frenik komşuluğu ayrı risk katmanıdır (R30).' },
    en: { name: 'Pulmonary vein antrum (schematic rings)', risk: 'The target is the antrum, not the vein lumen; energy inside the vein risks PV stenosis. The rings are schematic and no lesion set is modeled; esophageal and phrenic neighbourhood is a separate risk layer (R30).' }
  }
});

/** Maneuver cards: goal / precondition / expected / inference / pitfall (report section 7). */
export const EP_MANEUVERS = Object.freeze({
  'his-pvc': {
    tr: {
      name: 'His-refrakter PVC',
      goal: 'Aksesuar yolun taşikardi devresine katılıp katılmadığını sınamak.',
      precondition: 'Uyarı His refrakterken verilmeli ve ventrikül yakalaması doğrulanmalı.',
      expected: 'A ilerler veya gecikir, devre resetlenir ya da araya yeni A girmeden taşikardi sonlanır.',
      inference: 'A ilerlemesi retrograd bağlantı lehinedir; reset veya uygun terminasyon katılım için daha güçlü kanıttır.',
      pitfall: 'Negatif yanıt AP\'yi dışlamaz. A ilerlese de sonraki siklus değişmiyorsa bystander bağlantı düşünülür; nadiren nodofasiküler bağlantı benzer yanıt verir.'
    },
    en: {
      name: 'His-refractory PVC',
      goal: 'Test whether an accessory pathway participates in the tachycardia circuit.',
      precondition: 'The stimulus must fall while the His is refractory, with confirmed ventricular capture.',
      expected: 'A advances or delays, the circuit resets, or the tachycardia terminates without an intervening A.',
      inference: 'Advancing the A favors a retrograde connection; reset or appropriate termination is stronger evidence of participation.',
      pitfall: 'A negative response does not exclude a pathway. If A advances but the next cycle is unchanged, consider a bystander; rarely a nodofascicular connection mimics the response.'
    }
  },
  'a-extra': {
    tr: {
      name: 'Atriyal ekstrastimulus',
      goal: 'AV düğüm iletim eğrisini taramak: AH\'de ani uzama (sıçrama), echo ve AVNRT indüksiyonunu aramak; AP antegrad iletimini değerlendirmek.',
      precondition: 'Sabit sürüş dizisi (S1) yakalanmalı; S2 atriyumu yakalamalı ve zamanlaması doğrulanmalı.',
      expected: 'Kritik erkenlikte AH\'nin ani uzaması (yavaş yola geçiş); bazen tek atriyal echo veya taşikardi indüksiyonu.',
      inference: 'AH sıçraması ve echo çift AV nodal fizyolojiyi gösterir.',
      pitfall: 'AH sıçraması tek başına klinik AVNRT kanıtı değildir; çift fizyoloji taşikardisiz de bulunabilir.'
    },
    en: {
      name: 'Atrial extrastimulus',
      goal: 'Scan the AV nodal conduction curve: look for a sudden AH prolongation (jump), an echo and AVNRT induction; assess antegrade pathway conduction.',
      precondition: 'The drive train (S1) must capture; S2 must capture the atrium with verified timing.',
      expected: 'A sudden AH prolongation at the critical coupling interval (shift to the slow pathway); sometimes a single atrial echo or induction.',
      inference: 'An AH jump with an echo shows dual AV nodal physiology.',
      pitfall: 'An AH jump alone is not proof of clinical AVNRT; dual physiology exists without tachycardia.'
    }
  },
  'a-incremental': {
    tr: {
      name: 'Artan hızda atriyal pacing',
      goal: 'AV düğümün hıza bağlı iletimini izlemek: AH\'nin atımdan atıma uzaması, Wenckebach siklusu; AP varsa preeksitasyonun hızla değişimi.',
      precondition: 'Her uyarı atriyumu yakalamalı; siklus her adımda sabit tutulmalı.',
      expected: 'Siklus kısaldıkça AH uzar; düğümün 1:1 sınırının altında AH ilerleyici uzayıp bir atım bloke olur. Decremental olmayan yolda uyarı-delta sabit kalır.',
      inference: 'Wenckebach siklusu düğümün hıza bağlı iletimini gösterir; preeksitasyonun artması düğüm gecikmesinin yolu öne çıkardığını gösterir.',
      pitfall: 'Tek bir Wenckebach siklusu tanı değildir; otonom tonus ve ilaçlar siklusu değiştirir. Dizi içinde yavaş yola geçiş de olabilir (çift yol Wenckebach\'ı).'
    },
    en: {
      name: 'Incremental atrial pacing',
      goal: 'Follow rate-dependent AV nodal conduction: beat-to-beat AH prolongation and the Wenckebach cycle length; with a pathway, how preexcitation changes with rate.',
      precondition: 'Every stimulus must capture the atrium; hold each cycle length steady.',
      expected: 'The AH lengthens as the cycle shortens; below the node\'s 1:1 limit the AH lengthens progressively until a beat blocks. Over a non-decremental pathway the stimulus-to-delta stays constant.',
      inference: 'The Wenckebach cycle length reflects rate-dependent nodal conduction; rising preexcitation shows nodal delay unmasking the pathway.',
      pitfall: 'One Wenckebach cycle length is not a diagnosis; autonomic tone and drugs shift it. A shift to the slow pathway can occur within the train (dual pathway Wenckebach).'
    }
  },
  'v-overdrive': {
    tr: {
      name: 'Ventriküler overdrive pacing',
      goal: 'Taşikardiyi entrain edip V-A-V / A-A-V yanıtını, PPI ve SA-VA farkını değerlendirmek.',
      precondition: 'Taşikardi entrain edilmeli ve pacing atımları yakalanmalı; yakalama yoksa hesap yapılmaz.',
      expected: 'Entrainment sonrası V-A-V yanıtı; PPI-TCL ve SA-VA ölçülür.',
      inference: 'Klasik çalışmada PPI-TCL > 115 ms ve SA-VA > 85 ms atipik AVNRT lehineydi; karşılaştırma septal AP-ORT iledir, bütün zonlara kesin eşik değildir.',
      pitfall: 'Pseudo-A-A-V, decremental yollar ve pacing sonrası AH uzaması hesabı bozar; düzeltilmiş/düzeltilmemiş PPI ayrı adlandırılmalıdır.'
    },
    en: {
      name: 'Ventricular overdrive pacing',
      goal: 'Entrain the tachycardia and read the V-A-V / A-A-V response, PPI and SA-VA difference.',
      precondition: 'The tachycardia must be entrained with captured paced beats; without capture nothing is computed.',
      expected: 'A V-A-V response after entrainment; PPI-TCL and SA-VA are measured.',
      inference: 'In the classic study PPI-TCL > 115 ms and SA-VA > 85 ms favored atypical AVNRT; the comparison was against septal AP-ORT and the numbers are not universal cutoffs.',
      pitfall: 'Pseudo-A-A-V, decremental pathways and post-pacing AH prolongation break the numbers; corrected and uncorrected PPI must be named separately.'
    }
  },
  'para-his': {
    tr: {
      name: 'Para-Hisian pacing (sinüste; entrainment değil)',
      goal: 'Retrograd iletimin AV düğüm üzerinden mi, septal aksesuar yol üzerinden mi olduğunu ayırmak.',
      precondition: 'Her iki atımda da ventrikül yakalaması sürmeli; doğrudan atriyal capture dışlanmalı; saf His capture ve dal hastalığı ayrıca kontrol edilmelidir. "VA" yerine doğru S-A ölçümü kullanılır.',
      expected: 'His/RB capture kaybolurken S-A uzuyor ve dizi korunuyorsa nodal yanıt; S-A ve dizi değişmiyorsa extranodal (yol) yanıt.',
      inference: 'Extranodal yanıt septal AP lehinedir; dizinin değişmesi birleşik iletimi düşündürür.',
      pitfall: '"Nodal yanıt = AP yok" kuralı kullanılmaz: uzak sol yol veya yavaş retrograd AP nodal iletim tarafından maskelenebilir. Sinüsteki para-Hisian pacing, taşikardi sırasındaki para-Hisian entrainment ile aynı test değildir.'
    },
    en: {
      name: 'Para-Hisian pacing (in sinus; not entrainment)',
      goal: 'Separate retrograde conduction over the AV node from conduction over a septal accessory pathway.',
      precondition: 'Ventricular capture must persist on both beats; direct atrial capture must be excluded; pure His capture and bundle branch disease are checked separately. The correct S-A measurement is used, not a loose "VA".',
      expected: 'If losing His/RB capture lengthens the S-A with a preserved sequence, the response is nodal; an unchanged S-A and sequence is extranodal.',
      inference: 'An extranodal response favors a septal pathway; a changing sequence suggests combined conduction.',
      pitfall: 'The rule "nodal response = no pathway" is not used: a far left-sided or slowly conducting pathway can be masked by nodal conduction. Para-Hisian pacing in sinus is not the same test as para-Hisian entrainment during tachycardia.'
    }
  },
  'entrain-cti': {
    tr: {
      name: 'CTI\'den entrainment (flutter sırasında)',
      goal: 'Kavotriküspit istmusun flutter devresinin parçası olup olmadığını göstermek.',
      precondition: 'Siklus uzunluğu kararlı olmalı; pacing TCL\'den biraz kısa (10-20 ms) seçilir; her uyarı atriyumu yakalamalı ve bütün kanallar pacing siklusuna uymalı (entrainment). PPI pacing yapılan noktada ölçülür.',
      expected: 'Pacing sırasında aktivasyon dizisi flutter dizisiyle aynıdır; son uyarıdan sonra pacing yerindeki ilk dönüş (PPI) TCL\'ye yakındır.',
      inference: 'PPI TCL\'ye yakınsa pacing noktası devrenin içindedir ve flutter isthmusa bağımlı sayılır. Burada PPI-TCL 10 ms.',
      pitfall: 'PPI-TCL farkı için sık kullanılan değer 20 ms civarıdır ama kesin eşik değildir: pacing gücü ve hızı PPI\'yi değiştirebilir, antiaritmik ilaç altında dönüş uzayabilir. Yakalama yoksa ya da pacing flutteri sonlandırırsa PPI ölçülmez. Flutterin pacing ile sonlanması tanısal değildir.'
    },
    en: {
      name: 'Entrainment from the CTI (during flutter)',
      goal: 'Show whether the cavotricuspid isthmus is part of the flutter circuit.',
      precondition: 'A stable cycle length; pacing a little faster than the TCL (10-20 ms); every stimulus captures the atrium and every channel follows the paced cycle (entrainment). The PPI is measured at the pacing site.',
      expected: 'During pacing the activation sequence matches the flutter sequence; after the last stimulus the first return at the pacing site (PPI) is close to the TCL.',
      inference: 'A PPI close to the TCL places the pacing site in the circuit: the flutter is isthmus dependent. Here PPI-TCL is 10 ms.',
      pitfall: 'The PPI-TCL difference is often taught around 20 ms but it is not a strict threshold: pacing output and rate can change the PPI, and antiarrhythmic drugs can prolong the return. Without capture, or if pacing terminates the flutter, no PPI is measured. Termination by pacing is not diagnostic.'
    }
  },
  'v-decrement': {
    tr: {
      name: 'Farklı hızlarda ventriküler pacing',
      goal: 'Retrograd iletimin decremental olup olmadığını görmek.',
      precondition: 'Her iki pacing hızında da ventrikül yakalaması ve retrograd iletim olmalı.',
      expected: 'Hız arttıkça S-A uzuyorsa retrograd iletim decrementaldir.',
      inference: 'Decremental retrograd iletim PJRT/decremental AP ile uyumludur: "bütün AP\'ler nondecremental" kuralına karşı örnektir.',
      pitfall: 'Geç ve konsantrik A tek başına nodal mekanizma kanıtı değildir; decremental AP nodal iletimi taklit edebilir.'
    },
    en: {
      name: 'Ventricular pacing at two rates',
      goal: 'See whether retrograde conduction is decremental.',
      precondition: 'Both pacing rates need ventricular capture and retrograde conduction.',
      expected: 'S-A lengthening at the faster rate means decremental retrograde conduction.',
      inference: 'Decremental retrograde conduction fits PJRT / a decremental pathway: the counterexample to "all pathways are nondecremental".',
      pitfall: 'A late, concentric A alone does not prove a nodal mechanism; a decremental pathway can mimic nodal conduction.'
    }
  }
,
  'entrain-rv': {
    tr: {
      name: 'RV\'den entrainment (VT sırasında)',
      goal: 'Taşikardinin eksitabl aralıklı reentri olduğunu ve devrenin pacing yerine uzaklığını göstermek.',
      precondition: 'Siklus uzunluğu kararlı olmalı; pacing TCL\'den 20-40 ms kısa seçilir; her uyarı ventrikülü yakalamalı ve devrenin potansiyel dizisi (burada P1) pacing siklusuna uymalı.',
      expected: 'P1 dizisi pacing hızına uyar ve yönü değişmez (ortodromik yakalama); son uyarıdan sonra VT kendi siklusuyla sürer.',
      inference: 'Devre eksitabl aralıklı reentridir. PPI-TCL pacing yerinin devreye uzaklığını yansıtır; RV apeksinde uzun kalması devrenin LV septumunda olduğuyla uyumludur (R21).',
      pitfall: 'Füzyon okunmadan "devrede" sonucu çıkarılamaz; sonlanan veya resetlenmeyen tren tanısal değildir. Değerler öğretim örneğidir, eşik değildir.'
    },
    en: {
      name: 'Entrainment from the RV (during VT)',
      goal: 'Show that the tachycardia is reentry with an excitable gap and how far the circuit sits from the pacing site.',
      precondition: 'The cycle length must be stable; pace 20-40 ms below the TCL; every stimulus must capture the ventricle and the circuit potential sequence (P1 here) must follow the paced cycle.',
      expected: 'The P1 sequence follows the paced rate without changing direction (orthodromic capture); after the last stimulus the VT resumes at its own cycle length.',
      inference: 'The circuit is reentry with an excitable gap. PPI-TCL reflects the distance from the pacing site to the circuit; a long value at the RV apex fits a circuit on the LV septum (R21).',
      pitfall: 'Without reading fusion no "in the circuit" conclusion is drawn; a terminated or non-reset train is not diagnostic. The values are teaching examples, not thresholds.'
    }
  }
});

const D = EP_DISCLAIMER;

/** Per-case names, evidence and endpoints; per-clip titles and texts. */
export const EP_CASE_TEXT = Object.freeze({
  'avnrt-typical': {
    tr: {
      name: 'Tipik AVNRT (slow-fast)',
      endpoint: 'Klinik AVNRT\'nin yeniden indüklenememesi ve AV iletimin korunması. Junctional ritim tek başına başarı sonlanımı değildir (R2).'
    },
    en: {
      name: 'Typical AVNRT (slow-fast)',
      endpoint: 'Noninducibility of the clinical AVNRT with preserved AV conduction. Junctional rhythm alone is not a success endpoint (R2).'
    }
  },
  'avnrt-atypical': {
    tr: { name: 'Atipik AVNRT', endpoint: 'Retrograd yavaş yol iletiminin kaybı ve antegrad AV iletimin kayıtla gösterilmesi; yeniden indüklenememe (R1, R2).' },
    en: { name: 'Atypical AVNRT', endpoint: 'Loss of retrograde slow pathway conduction with antegrade AV conduction shown on a recording; noninducibility (R1, R2).' }
  },
  'ap-left-lateral': {
    tr: { name: 'Sol lateral concealed AP', endpoint: 'AP üzerinden retrograd iletimin kaybı; kalan konsantrik nodal VA iletimi başarısız ablasyon değildir (R4).' },
    en: { name: 'Left lateral concealed pathway', endpoint: 'Loss of retrograde conduction over the pathway; remaining concentric nodal VA conduction is not a failed ablation (R4).' }
  },
  'ap-inf-paraseptal': {
    tr: { name: 'Inferior paraseptal concealed AP', endpoint: 'AP iletiminin kaybı. CS ağzı, Koch yavaş yol hedefi ve AP aynı yapı değildir; venöz/koroner komşuluk ayrı risk katmanıdır (R6, R7).' },
    en: { name: 'Inferior paraseptal concealed pathway', endpoint: 'Loss of pathway conduction. The CS ostium, the Koch slow pathway target and the pathway are not the same structure; venous and coronary neighborhood is a separate risk layer (R6, R7).' }
  },
  pjrt: {
    tr: { name: 'PJRT (decremental retrograd AP)', endpoint: 'Decremental retrograd yol iletiminin kaybı; uzun RP ayırıcı tanısı (atipik AVNRT, AT) manevralarla yapılır (R4).' },
    en: { name: 'PJRT (decremental retrograde pathway)', endpoint: 'Loss of the decremental retrograde pathway; the long RP differential (atypical AVNRT, AT) rests on maneuvers (R4).' }
  },
  'focal-at': {
    tr: { name: 'Fokal atriyal taşikardi (krista)', endpoint: 'Odak aktivitesinin kaybı; bu katalogda tedavi klibi yoktur, olgu tanı ve manevra ayrımı için eklenmiştir (R9, R10).' },
    en: { name: 'Focal atrial tachycardia (cristal)', endpoint: 'Loss of the focus; this catalog carries no treatment clip for it, the case exists for the diagnostic and maneuver contrast (R9, R10).' }
  },
  'ap-parahisian': {
    tr: { name: 'Superior paraseptal (para-Hisian) concealed AP', endpoint: 'AP retrograd iletiminin kaybı ile normal ileti sisteminin ayrı değerlendirilmesi: işlem sonrası AH/HV korunmuştur. İleti sistemine komşuluk AV blok riski taşır; RF/kriyo seçimi burada kavramsaldır (R5).' },
    en: { name: 'Superior paraseptal (para-Hisian) concealed pathway', endpoint: 'Loss of retrograde pathway conduction assessed separately from the normal conduction system: AH/HV are preserved after the procedure. The conduction system neighbourhood carries AV block risk; RF versus cryo is conceptual here (R5).' }
  },
  'flutter-cti': {
    tr: { name: 'Tipik (saat yönü tersi) CTI bağımlı flutter', endpoint: 'Çift yönlü CTI bloğu: proksimal CS pacing\'inde lateral duvar yukarıdan aşağı aktive olur ve Halo 1-2\'ye ulaşma süresi uzar; düşük lateral RA pacing\'inde CS ağzı geç aktive olur; hat üzerinde geniş ayrık çift potansiyel. Flutterin sonlanması tek başına sonlanım değildir. Tai 2002 (32 hasta) çift potansiyel aralığı ≥ 100 ms ve istmus geçiş süresinde ≥ %50 artışı kullandı; küçük bir çalışmadır, otomatik eşik olarak kullanılmaz (R15).' },
    en: { name: 'Typical (counterclockwise) CTI-dependent flutter', endpoint: 'Bidirectional CTI block: with proximal CS pacing the lateral wall activates from the top down and the time to Halo 1-2 lengthens; with low lateral RA pacing the CS ostium activates late; widely split double potentials along the line. Termination of the flutter alone is not an endpoint. Tai 2002 (32 patients) used a double potential interval of 100 ms or more and a transisthmus time increase of 50% or more; it is a small study and not an automatic threshold (R15).' }
  },
  'ap-left-manifest': {
    tr: { name: 'Manifest sol lateral AP (WPW paterni)', endpoint: 'Mevcut AP iletim yönlerinin ortadan kalkması. Yalnız delta kaybı retrograd iletimi değerlendirmez; ayrı retrograd test gerekir (R3).' },
    en: { name: 'Manifest left lateral pathway (WPW pattern)', endpoint: 'Loss of the pathway\'s existing conduction directions. Delta loss alone does not assess retrograde conduction; a separate retrograde test is needed (R3).' }
  }
,
  'at-parahisian': {
    tr: { name: 'Para-Hisian fokal AT', endpoint: 'AT odağının kaybı. En erken A His bölgesindedir; sağ taraftan RF AV blok riski taşır ve nonkoroner kusp haritalaması alternatif penceredir. Bu katalog ablasyon reçetesi vermez; harita klibi karşılaştırma içindir (R18, R19, R20).' },
    en: { name: 'Para-Hisian focal AT', endpoint: 'Loss of the focus. The earliest A sits in the His region; right-sided RF carries AV block risk and noncoronary cusp mapping is the alternative window. This catalog gives no ablation prescription; the mapping clip is a comparison (R18, R19, R20).' }
  },
  'fascicular-vt': {
    tr: { name: 'Sol posterior fasiküler VT (verapamil duyarlı)', endpoint: 'VT\'nin yeniden indüklenememesi. Hedef P1/P2 potansiyel dizisiyle bulunur; sinüste antegrad Purkinje potansiyeli korunur ve HV değişmez. Sonlanım ölçütleri uzman incelemesi bekler (R21, R25).' },
    en: { name: 'Left posterior fascicular VT (verapamil sensitive)', endpoint: 'Noninducibility of the VT. The target is found with the P1/P2 potential sequence; the antegrade Purkinje potential and the HV are preserved in sinus. The endpoint criteria await expert review (R21, R25).' }
  },
  'bbr-vt': {
    tr: { name: 'Dal bloğu reentrisi (BBR) VT', endpoint: 'Sağ dal ablasyonuyla devrenin kesilmesi: sinüste RB potansiyeli kaybolur, QRS RBBB tipine döner ve HV uzar. Tuzak: ardından interfasiküler reentri gelişebilir; kalıcı pacing gereksinimi ayrı risktir (R26, R28).' },
    en: { name: 'Bundle branch reentry (BBR) VT', endpoint: 'Interruption of the circuit by right bundle ablation: the sinus RB potential disappears, the QRS turns RBBB and the HV lengthens. Pitfall: interfascicular reentry can follow; permanent pacing need is a separate risk (R26, R28).' }
  }
  ,'af-pvi': {
    tr: { name: 'AF: pulmoner ven izolasyonu', endpoint: 'Her venin giriş bloğu: Lasso kanalında ven potansiyellerinin kaybı (R30, R31). Bu egzersizde dört halkanın tamamlanması sinüse döner; klinikte AF sonlanımı garanti değildir ve geç rekonneksiyon nüksün başlıca nedenidir (R30).' },
    en: { name: 'AF: pulmonary vein isolation', endpoint: 'Entrance block of each vein: loss of the vein potentials on the Lasso channel (R30, R31). In this exercise completing all four rings returns sinus; clinically AF termination is not guaranteed and late reconnection is the main cause of recurrence (R30).' }
  }
});

export const EP_CLIP_TEXT = Object.freeze({
  'avnrt-typ-svt': {
    tr: {
      title: 'Dar QRS taşikardi, kısa septal VA',
      neutral: `${D.tr} TCL 360 ms. A ve V ilişkisini, en erken A kanalını ve VA süresini kendiniz ölçün.`,
      evidence: 'Retrograd A konsantriktir (en erken His/proksimal CS) ve septal VA çok kısadır (30 ms). Bu örüntü tipik slow-fast AVNRT\'yi destekler; septal AP dışlamak için His-refrakter PVC gerekir. Tek kayıt kesin tanı vermez.'
    },
    en: {
      title: 'Narrow QRS tachycardia, short septal VA',
      neutral: `${D.en} TCL 360 ms. Measure the A-V relation, the earliest A channel and the VA time yourself.`,
      evidence: 'Retrograde A is concentric (earliest on His / proximal CS) with a very short septal VA (30 ms). The pattern supports typical slow-fast AVNRT; a His-refractory PVC is needed against a septal pathway. One recording never proves the diagnosis.'
    }
  },
  'avnrt-typ-hispvc': {
    tr: { title: 'His-refrakter PVC: yanıt yok', text: `${D.tr} His refrakterken verilen PVC atriyal zamanlamayı değiştirmiyor (A-A = TCL = 360 ms). Negatif yanıt AP'yi dışlamaz; septal AP olasılığı düşer ama sıfırlanmaz.` },
    en: { title: 'His-refractory PVC: no response', text: `${D.en} The PVC delivered while the His is refractory leaves atrial timing unchanged (A-A = TCL = 360 ms). A negative response does not exclude a pathway; it lowers, not removes, the septal AP likelihood.` }
  },
  'avnrt-typ-vop': {
    tr: { title: 'Ventriküler overdrive: V-A-V, PPI', text: `${D.tr} RV'den 320 ms ile entrainment sonrası yanıt V-A-V. PPI 510 ms, TCL 360 ms: PPI-TCL 150 ms. Eşikler septal AP-ORT karşılaştırmasından gelir (R12); burada AVNRT lehine yorumlanır, kesin kural değildir.` },
    en: { title: 'Ventricular overdrive: V-A-V, PPI', text: `${D.en} After entrainment at 320 ms from the RV the response is V-A-V. PPI 510 ms, TCL 360 ms: PPI-TCL 150 ms. The thresholds come from the septal AP-ORT comparison (R12); here they favor AVNRT, they are not a strict rule.` }
  },
  'avnrt-typ-vop-noncapture': {
    tr: { title: 'Overdrive: yakalama yok', text: `${D.tr} Uyarılar ventrikülü yakalamıyor; taşikardi kendi TCL'siyle sürüyor. Entrainment yok: PPI ve SA-VA hesaplanmaz, manevra yorumlanamaz.` },
    en: { title: 'Overdrive: no capture', text: `${D.en} The stimuli fail to capture the ventricle; the tachycardia continues at its own TCL. No entrainment: PPI and SA-VA are not computed and the maneuver is uninterpretable.` }
  },
  sinus: {
    tr: { title: 'Sinüs ritmi: AH ve HV', text: `${D.tr} Sinüs ritminde aktivasyon önce HRA'da görülür, sonra His kanallarına ve CS'de proksimalden distale yayılır. His d kanalında A, keskin H ve V: AH yaklaşık 80 ms, HV yaklaşık 45 ms. Değerler öğretim amaçlı yaklaşık değerlerdir.` },
    en: { title: 'Sinus rhythm: AH and HV', text: `${D.en} In sinus rhythm activation appears first on HRA, then on the His channels and along the CS from proximal to distal. His d shows A, a sharp H and V: AH about 80 ms, HV about 45 ms. The numbers are teaching approximations.` }
  },
  'slow-target': {
    tr: { title: 'Yavaş yol hedefi (ABL d)', text: `${D.tr} Ablasyon kateteri Koch üçgeninin alt kısmında, CS ağzı ile triküspit halka arasındadır. ABL d kanalında küçük, bazen iki bileşenli (fragmante) A ve büyük V vardır; His potansiyeli görülmez. Hedef seçimi anatomi ile elektrogramın birlikte değerlendirilmesine dayanır; sabit bir A:V oranı karar kuralı değildir.` },
    en: { title: 'Slow pathway target (ABL d)', text: `${D.en} The ablation catheter sits in the inferior Koch triangle between the CS ostium and the tricuspid annulus. ABL d shows a small, sometimes two-component (fragmented) A and a large V, with no His potential. Target choice relies on anatomy plus the electrogram together; a fixed A:V ratio is not a decision rule.` }
  },
  'junctional-rf': {
    tr: { title: 'RF sırasında junctional ritim', text: `${D.tr} Yavaş yol bölgesine RF uygulanırken junctional atımlar görülebilir: H'yi V izler, V'den kısa süre sonra retrograd A gelir (VA yaklaşık 70 ms, konsantrik). Junctional ritim tek başına başarı göstergesi değildir; temel sonlanım, AV iletim korunarak AVNRT'nin indüklenememesidir (R2).` },
    en: { title: 'Junctional rhythm during RF', text: `${D.en} Junctional beats may appear while RF is delivered at the slow pathway: V follows H, and a retrograde A follows V (VA about 70 ms, concentric). Junctional rhythm alone does not establish success; the key endpoint is noninducibility of AVNRT with preserved AV conduction (R2).` }
  },
  'junctional-va-block': {
    tr: { title: 'Junctional ritim sırasında yeni VA blok (uyarı)', text: `${D.tr} Junctional ritim sırasında (siklus yaklaşık 470 ms) ikinci atımda V'den sonra retrograd A gelmiyor. Tipik slow-fast AVNRT'de önceden mevcut VA iletiminin RF sırasında yeni kaybı enerjiyi durdurma uyarısıdır; kesin AV blok kanıtı değildir. Atipik AVNRT'de aynı görünüm retrograd yavaş yolun kaybıyla da oluşabilir (R1). Siklus süresi ayrı, bağlamlı bir özelliktir; tek başına otomatik tehlike sınırı değildir. Antegrad AV iletim ayrıca gösterilmelidir: son atım sinüs atımıdır ve AH/HV korunmuştur. "VA blok güvenlidir" genellemesi de yapılmaz.` },
    en: { title: 'New VA block during junctional rhythm (warning)', text: `${D.en} During junctional rhythm (cycle about 470 ms) the second beat has V with no retrograde A. In typical slow-fast AVNRT, new loss of previously present VA conduction during RF is a warning to stop energy delivery; it is not proof of AV block. In atypical AVNRT the same picture can come from loss of the retrograde slow pathway (R1). The cycle length is a separate, contextual feature, not an automatic danger threshold by itself. Antegrade AV conduction must be shown separately: the last beat is a sinus beat with preserved AH/HV. The reverse claim "VA block is safe" is not made either.` }
  },
  'avnrt-atyp-svt': {
    tr: {
      title: 'Uzun RP taşikardi, proksimal CS erken A',
      neutral: `${D.tr} TCL 380 ms, RP uzun. En erken A kanalını ve VA süresini ölçün; bu görünümün kaç mekanizması olabilir?`,
      evidence: 'En erken retrograd A CS 9-10 komşuluğundadır ve VA uzundur (185 ms). Atipik AVNRT ile uyumludur; ama inferior paraseptal AP ve PJRT benzer dizilim verebilir. Ayrım zaman dizisiyle değil manevrayla yapılır (CS ağzı karşılaştırması).'
    },
    en: {
      title: 'Long RP tachycardia, early proximal CS A',
      neutral: `${D.en} TCL 380 ms, long RP. Measure the earliest A channel and the VA time; how many mechanisms could look like this?`,
      evidence: 'Earliest retrograde A sits near CS 9-10 with a long VA (185 ms). Compatible with atypical AVNRT; an inferior paraseptal pathway and PJRT can give a similar sequence. Maneuvers, not the time series, separate them (CS ostium comparison).'
    }
  },
  'avnrt-atyp-vablock': {
    tr: { title: 'Junctional VA blok', text: `${D.tr} Atipik AVNRT ablasyonunda junctional ritim sırasında retrograd A kayboluyor. Burada bu, retrograd yavaş yolun ortadan kalkmasıyla uyumludur ve tipik AVNRT'deki uyarıyla aynı anlamı taşımaz (R1). Antegrad AV iletim son sinüs atımında AH/HV ile ayrıca gösterilmiştir.` },
    en: { title: 'Junctional VA block', text: `${D.en} During slow pathway ablation of atypical AVNRT the retrograde A disappears in junctional rhythm. Here that fits loss of the retrograde slow pathway and does not carry the same meaning as the warning in typical AVNRT (R1). Antegrade AV conduction is shown separately on the final sinus beat with its AH/HV.` }
  },
  'ap-ll-svt': {
    tr: {
      title: 'Dar QRS taşikardi, eksantrik A',
      neutral: `${D.tr} TCL 360 ms. CS dizilimini proksimalden distale izleyin: en erken A nerede? ABL kateteri mitral anulustadır.`,
      evidence: 'Retrograd A eksantriktir: en erken distal CS (55 ms) ve anulustaki ABL lokal A daha da erken (45 ms). Sol serbest duvar yolu üzerinden ortodromik AVRT\'yi destekler. Distal CS\'de erken A tek başına kesin hedef veya AP katılımı değildir; katılım His-refrakter PVC ile sınanır.'
    },
    en: {
      title: 'Narrow QRS tachycardia, eccentric A',
      neutral: `${D.en} TCL 360 ms. Follow the CS sequence from proximal to distal: where is the earliest A? The ABL catheter sits on the mitral annulus.`,
      evidence: 'Retrograde A is eccentric: earliest on distal CS (55 ms), with the annular ABL local A earlier still (45 ms). It supports orthodromic AVRT over a left free wall pathway. An early distal CS A alone is neither the definite target nor proof of participation; participation is tested with a His-refractory PVC.'
    }
  },
  'ap-ll-hispvc': {
    tr: { title: 'His-refrakter PVC: A ilerliyor', text: `${D.tr} His refrakterken verilen PVC bütün atriyal kanallarda A'yı 25 ms ilerletiyor (A-A 335 < TCL 360) ve sonraki siklus da ilerliyor. Retrograd AP katılımı için güçlü kanıt. A ilerleyip sonraki siklus değişmeseydi bystander bağlantı düşünülürdü.` },
    en: { title: 'His-refractory PVC: A advances', text: `${D.en} The PVC delivered while the His is refractory advances the A on every atrial channel by 25 ms (A-A 335 < TCL 360) and the following cycle advances with it. Strong evidence of retrograde pathway participation. Had the A advanced without changing the next cycle, a bystander connection would be considered.` }
  },
  'ap-ll-post-retro': {
    tr: { title: 'Ablasyon sonrası retrograd test', text: `${D.tr} RV pacing ile retrograd aktivasyon artık konsantrik ve geç (S-A 140 ms, en erken His komşuluğu): AP üzerinden retrograd iletim kaybolmuş. Kalan nodal VA iletimi normal bir bulgudur; başarısız AP ablasyonu diye etiketlenmez.` },
    en: { title: 'Post-ablation retrograde test', text: `${D.en} With RV pacing the retrograde activation is now concentric and late (S-A 140 ms, earliest near the His): retrograde conduction over the pathway is gone. Remaining nodal VA conduction is a normal finding, not a failed pathway ablation.` }
  },
  'ap-ips-svt': {
    tr: {
      title: 'Uzun VA taşikardi, CS ağzında erken A',
      neutral: `${D.tr} TCL 380 ms. ABL kateteri CS ağzı komşuluğundadır. En erken A'yı bulun ve atipik AVNRT kaydıyla karşılaştırın.`,
      evidence: 'En erken A CS ağzı komşuluğundaki ABL\'dedir (45 ms), proksimal CS onu izler. Inferior paraseptal concealed AP ile uyumludur; atipik AVNRT çok benzer dizilim verir. Zaman dizisiyle tanı seçilmez: His-refrakter PVC katılımı gösterir. CS ağzı, Koch yavaş yol hedefi ve AP aynı yapı değildir.'
    },
    en: {
      title: 'Long VA tachycardia, early A at the CS ostium',
      neutral: `${D.en} TCL 380 ms. The ABL catheter sits next to the CS ostium. Find the earliest A and compare with the atypical AVNRT recording.`,
      evidence: 'Earliest A is on the ABL next to the CS ostium (45 ms), with proximal CS just behind. It fits an inferior paraseptal concealed pathway; atypical AVNRT gives a very similar sequence. The time series does not pick the diagnosis: the His-refractory PVC shows participation. The CS ostium, the Koch slow pathway target and the pathway are not the same structure.'
    }
  },
  'ap-ips-hispvc': {
    tr: { title: 'His-refrakter PVC: A ilerliyor', text: `${D.tr} PVC, A'yı 20 ms ilerletiyor (A-A 360 < TCL 380) ve sonraki siklusu da çekiyor: septal görünümlü taşikardide AP katılımı. Bu ayrım atipik AVNRT karşılaştırmasının çözüm adımıdır.` },
    en: { title: 'His-refractory PVC: A advances', text: `${D.en} The PVC advances the A by 20 ms (A-A 360 < TCL 380) and pulls the next cycle with it: pathway participation in a septal-looking tachycardia. This is the resolving step of the atypical AVNRT comparison.` }
  },
  'pjrt-svt': {
    tr: {
      title: 'Kesintisiz uzun RP taşikardi',
      neutral: `${D.tr} TCL 420 ms, RP uzun, en erken A proksimal CS komşuluğunda. Atipik AVNRT kaydıyla yan yana değerlendirin.`,
      evidence: 'Uzun RP ve konsantrik-posteroseptal erken A: PJRT ile uyumludur ama atipik AVNRT ve fokal AT ile çakışır. Geç ve konsantrik A nodal mekanizma için tek başına yeterli değildir (R4); ayrım decremental retrograd iletimin gösterilmesiyle yapılır.'
    },
    en: {
      title: 'Incessant long RP tachycardia',
      neutral: `${D.en} TCL 420 ms, long RP, earliest A near the proximal CS. Read it side by side with the atypical AVNRT recording.`,
      evidence: 'Long RP with a concentric posteroseptal early A: fits PJRT but overlaps atypical AVNRT and focal AT. A late concentric A alone is not enough for a nodal mechanism (R4); the separation comes from showing decremental retrograde conduction.'
    }
  },
  'pjrt-vpace': {
    tr: { title: 'İki hızda V pacing: decremental retrograd', text: `${D.tr} 500 ms pacing'de S-A 160 ms; 380 ms'de S-A 210 ms'ye uzuyor: retrograd iletim decremental. "Bütün AP'ler nondecremental" kuralına karşı örnek (R4). Her iki hızda da yakalama doğrulanmıştır.` },
    en: { title: 'V pacing at two rates: decremental retrograde', text: `${D.en} At 500 ms pacing the S-A is 160 ms; at 380 ms it lengthens to 210 ms: retrograde conduction is decremental. The counterexample to "all pathways are nondecremental" (R4). Capture is confirmed at both rates.` }
  },
  'avnrt-dual-echo': {
    tr: { title: 'Atriyal ekstrastimulus: AH sıçraması ve echo', text: `${D.tr} 600 ms sürüşte AH 80 ms; erken S2'de AH aniden 180 ms'ye uzuyor (sıçrama: yavaş yola geçiş) ve tek atriyal echo dönüyor. Çift AV nodal fizyoloji bulgusudur; taşikardi başlamadı. AH sıçraması tek başına klinik AVNRT kanıtı değildir.` },
    en: { title: 'Atrial extrastimulus: AH jump and echo', text: `${D.en} On the 600 ms drive the AH is 80 ms; at the premature S2 it jumps to 180 ms (shift to the slow pathway) and a single atrial echo returns. This is dual AV nodal physiology; no tachycardia started. An AH jump alone is not proof of clinical AVNRT.` }
  },
  'ap-lm-avrt': {
    tr: {
      title: 'Aynı yol ile ortodromik AVRT',
      neutral: `${D.tr} Dar QRS taşikardi, TCL 340 ms. QRS'i sinüs kaydıyla karşılaştırın; CS dizilimini ve HV'yi ölçün.`,
      evidence: 'QRS dar ve delta yok: antegrad kol AV düğüm/His-Purkinje (HV 45 ms). Retrograd A eksantrik, en erken distal CS: retrograd kol sol lateral AP. Ortodromik AVRT ile uyumludur; sinüsteki WPW paterni taşikardinin zeminidir, kendisi değildir (R3).'
    },
    en: {
      title: 'Orthodromic AVRT over the same pathway',
      neutral: `${D.en} Narrow QRS tachycardia, TCL 340 ms. Compare the QRS with the sinus recording; measure the CS sequence and the HV.`,
      evidence: 'The QRS is narrow with no delta: the antegrade limb is the AV node / His-Purkinje (HV 45 ms). Retrograde A is eccentric, earliest on distal CS: the retrograde limb is the left lateral pathway. Consistent with orthodromic AVRT; the sinus WPW pattern is the substrate, not the tachycardia itself (R3).'
    }
  },
  'af-preexcited': {
    tr: {
      title: 'Preeksitasyonlu AF (acil durum olgusu)',
      neutral: `${D.tr} Düzensiz taşikardi; QRS genişliği atımdan atıma değişiyor. RR aralıklarını ve en kısa RR'yi ölçün. Düzenli dar QRS taşikardi algoritması bu kayda uygulanmaz.`,
      evidence: 'Düzensiz düzensiz ritim, değişken preeksitasyon ve bir dar (füzyon) atım: preeksitasyonlu AF. AV düğümü bloke eden ilaçlar ve intravenöz amiodaron burada zarar verebilir; hemodinamik durum ve kardiyoversiyon birlikte değerlendirilir, bu model doz veya otomatik tedavi önerisi vermez (R3). En kısa preeksite RR (SPERRI) burada 220 ms; ESC metni SPERRI ve AP ERP için ≤ 250 ms özelliklerini ölçüm ve provokasyon koşullarıyla birlikte kullanır, tek eşik otomatik hükme çevrilmez (R14).'
    },
    en: {
      title: 'Preexcited AF (emergency case)',
      neutral: `${D.en} Irregular tachycardia; the QRS width changes beat to beat. Measure the RR intervals and the shortest RR. The regular narrow QRS algorithm does not apply to this recording.`,
      evidence: 'Irregularly irregular rhythm, varying preexcitation and one narrow (fusion) beat: preexcited AF. AV node blocking drugs and intravenous amiodarone can harm here; hemodynamics and cardioversion are weighed together, and this model gives no dose or automatic treatment advice (R3). The shortest preexcited RR (SPERRI) is 220 ms here; the ESC text uses SPERRI and AP ERP features of 250 ms or less together with their measurement and provocation conditions, and a single threshold is never an automatic verdict (R14).'
    }
  },
  'avnrt-typ-parahis': {
    tr: { title: 'Para-Hisian pacing: nodal yanıt', text: `${D.tr} İlk uyarı His ve RV'yi birlikte yakalıyor (S-A 100 ms); ikincisinde His capture kayboluyor, S-A 145 ms'ye uzuyor ve retrograd dizi değişmiyor: nodal yanıt desteklenir. "Nodal yanıt = AP yok" kuralı kullanılmaz; uzak veya yavaş retrograd yol maskelenebilir (R4). Her iki atımda ventrikül yakalaması doğrulanmıştır.` },
    en: { title: 'Para-Hisian pacing: nodal response', text: `${D.en} The first stimulus captures His and RV together (S-A 100 ms); on the second His capture is lost, the S-A lengthens to 145 ms and the retrograde sequence is unchanged: a nodal response is supported. The rule "nodal response = no pathway" is not used; a far or slowly conducting pathway can be masked (R4). Ventricular capture is confirmed on both beats.` }
  },
  'ap-ips-parahis': {
    tr: { title: 'Para-Hisian pacing: extranodal yanıt', text: `${D.tr} His capture kaybolduğunda S-A değişmiyor (95 ms) ve dizi korunuyor: retrograd iletim His-Purkinje'den bağımsız, septal aksesuar yol üzerinden. Doğrudan atriyal capture dışlanmıştır; S-A ölçümü stimulustan atriyal olaya yapılır (R4).` },
    en: { title: 'Para-Hisian pacing: extranodal response', text: `${D.en} When His capture is lost the S-A does not change (95 ms) and the sequence is preserved: retrograde conduction is independent of the His-Purkinje system, over the septal accessory pathway. Direct atrial capture is excluded; the S-A is measured from the stimulus to the atrial event (R4).` }
  },
  'ap-lm-antidromic': {
    tr: {
      title: 'Antidromik AVRT (geniş QRS)',
      neutral: `${D.tr} Geniş QRS taşikardi, TCL 320 ms. QRS morfolojisini sinüs kaydıyla karşılaştırın; retrograd A dizisini ölçün. VT ayırıcı tanıda durur.`,
      evidence: 'QRS tam preeksite ve sinüsteki delta ile aynı yöndedir: antegrad kol aksesuar yol. Retrograd A konsantrik (en erken His komşuluğu): retrograd kol AV düğüm. Antidromik AVRT ile uyumludur; VT ile ayrım tek kayıtla yapılmaz, katılım manevraları gerekir (R3).'
    },
    en: {
      title: 'Antidromic AVRT (wide QRS)',
      neutral: `${D.en} Wide QRS tachycardia, TCL 320 ms. Compare the QRS morphology with the sinus recording; measure the retrograde A sequence. VT stays in the differential.`,
      evidence: 'The QRS is fully preexcited, in the same direction as the sinus delta: the antegrade limb is the accessory pathway. Retrograde A is concentric (earliest near the His): the retrograde limb is the AV node. Consistent with antidromic AVRT; VT is not separated on one recording, participation maneuvers are needed (R3).'
    }
  },
  'at-svt': {
    tr: {
      title: 'Fokal atriyal taşikardi (krista)',
      neutral: `${D.tr} Uzun RP taşikardi, TCL 400 ms. En erken A hangi kanalda? CS ağzı karşılaştırma setindeki kayıtlarla yan yana değerlendirin.`,
      evidence: 'En erken A HRA\'dadır (krista bölgesi) ve uzun RP verir: fokal AT ile uyumludur. Geç ve konsantrik A nodal mekanizma kanıtı olmadığı gibi, erken HRA da tek başına odak kanıtı değildir; VOP sonrası A-A-V yanıtı ayrımı destekler (R9, R10).'
    },
    en: {
      title: 'Focal atrial tachycardia (cristal)',
      neutral: `${D.en} Long RP tachycardia, TCL 400 ms. Which channel has the earliest A? Read it next to the CS ostium comparison recordings.`,
      evidence: 'The earliest A is on HRA (the crista region) with a long RP: consistent with focal AT. Just as a late concentric A does not prove a nodal mechanism, an early HRA alone does not prove a focus; the A-A-V response after overdrive supports the separation (R9, R10).'
    }
  },
  'at-vop': {
    tr: { title: 'Ventriküler overdrive: A-A-V yanıtı', text: `${D.tr} Pacing kesildikten sonra dizi A-A-V: son paced atımın retrograd A'sını, V gelmeden odağın kendi A'sı izliyor. Fokal AT lehinedir; AVNRT/AVRT tipik olarak V-A-V verir. Pseudo-A-A-V tuzağı karttadır; yanıt ancak yakalama ve entrainment doğrulanmışsa yorumlanır (R9, R10).` },
    en: { title: 'Ventricular overdrive: A-A-V response', text: `${D.en} After pacing stops the sequence is A-A-V: the focus fires its own A after the last paced beat's retrograde A, before any V. It favors focal AT; AVNRT/AVRT typically give V-A-V. The pseudo-A-A-V trap is on the card; the response is read only with confirmed capture and entrainment (R9, R10).` }
  },
  'at-vop-terminated': {
    tr: { title: 'Overdrive: taşikardi sonlandı (tanısal değil)', text: `${D.tr} Pacing sırasında taşikardi durdu; pacing sonrası sinüs ritmi geliyor. A-A-V veya V-A-V dizisi okunamaz: yanıt tanısal değildir. Yeniden indüklenip manevra tekrarlanmalıdır.` },
    en: { title: 'Overdrive: tachycardia terminated (not diagnostic)', text: `${D.en} The tachycardia stopped during pacing; sinus rhythm follows. No A-A-V or V-A-V sequence can be read: the response is not diagnostic. The tachycardia must be reinduced and the maneuver repeated.` }
  },
  'flutter-svt': {
    tr: {
      title: 'Makroreentran atriyal taşikardi, 2:1 iletim',
      neutral: `${D.tr} TCL 240 ms, 2:1 AV iletim. Halo üzerindeki aktivasyon yönünü ve CS ağzının zamanlamasını okuyun.`,
      evidence: 'Aktivasyon septumdan yukarı çıkar (CS ağzı, sonra His), lateral duvardan aşağı iner (Halo 9-10\'dan 1-2\'ye 100 ms) ve istmustan CS ağzına döner: saat yönü tersi tipik flutter dizisi ile uyumludur. İstmus bağımlılığı dizi ile değil, CTI\'den entrainment ile gösterilir.'
    },
    en: {
      title: 'Macroreentrant atrial tachycardia, 2:1 conduction',
      neutral: `${D.en} TCL 240 ms, 2:1 AV conduction. Read the activation direction along the Halo and the timing of the CS ostium.`,
      evidence: 'Activation climbs the septum (CS ostium, then His), descends the lateral wall (Halo 9-10 to 1-2 in 100 ms) and returns through the isthmus to the CS ostium: consistent with the counterclockwise typical flutter sequence. Isthmus dependence is shown by entrainment from the CTI, not by the sequence.'
    }
  },
  'flutter-entrain-cti': {
    tr: { title: 'CTI\'den entrainment: PPI ≈ TCL', text: `${D.tr} ABL CTI üzerinde, 225 ms ile pacing (TCL 240'tan 15 ms kısa). Her kanal pacing siklusuna uyuyor ve dizi flutterle aynı. Son uyarıdan sonra pacing yerindeki ilk dönüş PPI 250 ms: PPI-TCL 10 ms. İstmus devrededir. Değerler olaylardan ölçülür; eşik kesin değildir.` },
    en: { title: 'Entrainment from the CTI: PPI close to TCL', text: `${D.en} ABL on the CTI, pacing at 225 ms (15 ms shorter than the 240 ms TCL). Every channel follows the paced cycle with the flutter sequence. After the last stimulus the first return at the pacing site, the PPI, is 250 ms: PPI-TCL 10 ms. The isthmus is in the circuit. The values are measured from the events; the threshold is not strict.` }
  },
  'flutter-entrain-noncapture': {
    tr: { title: 'Entrainment denemesi: yakalama yok', text: `${D.tr} Uyarılar atriyumu yakalamıyor; flutter kendi 240 ms siklusuyla sürüyor. Entrainment yok: PPI ölçülmez, manevra yorumlanamaz.` },
    en: { title: 'Entrainment attempt: no capture', text: `${D.en} The stimuli fail to capture the atrium; the flutter continues at its own 240 ms cycle. No entrainment: no PPI is measured and the maneuver is uninterpretable.` }
  },
  'flutter-entrain-terminated': {
    tr: { title: 'Entrainment denemesi: flutter sonlandı', text: `${D.tr} Pacing treni flutteri sonlandırdı; ardından sinüs ritmi. Dönüş siklusu olmadığından PPI ölçülemez. Sonlanma istmus bağımlılığını kanıtlamaz.` },
    en: { title: 'Entrainment attempt: flutter terminated', text: `${D.en} The pacing train terminated the flutter; sinus rhythm follows. With no return cycle there is no PPI. Termination does not prove isthmus dependence.` }
  },
  'cti-cs-pacing-before': {
    tr: { title: 'Ablasyon öncesi: proksimal CS pacing', text: `${D.tr} Proksimal CS'den pacing: dalga istmustan geçer, Halo 1-2 erken (90 ms) aktive olur ve lateral duvarda yukarıdan gelen dalgayla çarpışır. İstmusta iletim vardır.` },
    en: { title: 'Before ablation: proximal CS pacing', text: `${D.en} Pacing from the proximal CS: the wavefront crosses the isthmus, Halo 1-2 activates early (90 ms) and collides on the lateral wall with the wave coming from above. The isthmus conducts.` }
  },
  'cti-cs-pacing-after': {
    tr: { title: 'Ablasyon sonrası: proksimal CS pacing', text: `${D.tr} Aynı pacing'de lateral duvar yukarıdan aşağı aktive oluyor (Halo 9-10'dan 1-2'ye) ve Halo 1-2'ye ulaşma 210 ms'ye uzuyor; hat üzerinde çift potansiyel aralığı 120 ms. Saat yönünde (CS'den laterale) blok ile uyumlu. Çift yönlü blok için düşük lateral RA pacing'i ayrıca gerekir.` },
    en: { title: 'After ablation: proximal CS pacing', text: `${D.en} With the same pacing the lateral wall activates from the top down (Halo 9-10 to 1-2) and the time to Halo 1-2 lengthens to 210 ms; the double potential interval on the line is 120 ms. Consistent with block from the CS side to the lateral side. Bidirectional block also needs low lateral RA pacing.` }
  },
  'cti-lowlat-pacing-after': {
    tr: { title: 'Ablasyon sonrası: düşük lateral RA pacing', text: `${D.tr} Halo 1-2'den pacing: dalga lateral duvardan yukarı, tavandan ve septumdan aşağı iner; CS ağzı 185 ms'de geç aktive olur. Diğer yönde de blok ile uyumlu: iki kayıt birlikte çift yönlü bloğu gösterir. Diferansiyel pacing ayrıca kullanılabilir.` },
    en: { title: 'After ablation: low lateral RA pacing', text: `${D.en} Pacing from Halo 1-2: the wave climbs the lateral wall, crosses the roof and descends the septum; the CS ostium activates late at 185 ms. Consistent with block in the other direction too: the two recordings together show bidirectional block. Differential pacing can be added.` }
  },
  'ph-svt': {
    tr: {
      title: 'Dar QRS taşikardi, kısa septal VA',
      neutral: `${D.tr} TCL 330 ms. En erken A kanalını ve VA'yı ölçün; tipik AVNRT kaydıyla karşılaştırın.`,
      evidence: 'En erken A His kanalındadır, septal VA 75 ms: His komşuluğunda retrograd iletim. Septal VA 70 ms\'nin altında olsaydı ortodromik AVRT aleyhine olurdu (R9); 70 ms\'nin üstü yolu kanıtlamaz, yalnız olanaklı bırakır. Tipik AVNRT ile ayrım para-Hisian pacing ve His-refrakter PVC gibi manevralarla yapılır. His komşuluğu AV blok riski demektir.'
    },
    en: {
      title: 'Narrow QRS tachycardia, short septal VA',
      neutral: `${D.en} TCL 330 ms. Measure the earliest A channel and the VA; compare with the typical AVNRT recording.`,
      evidence: 'The earliest A is on the His channel with a septal VA of 75 ms: retrograde conduction next to the His. A septal VA below 70 ms would argue against orthodromic AVRT (R9); above 70 ms does not prove a pathway, it only leaves one possible. Maneuvers such as para-Hisian pacing and a His-refractory PVC separate it from typical AVNRT. His proximity means AV block risk.'
    }
  },
  'ph-parahis-extranodal': {
    tr: { title: 'Para-Hisian pacing: extranodal yanıt', text: `${D.tr} İlk uyarı His+RV'yi, ikincisi yalnız RV'yi yakalıyor (dar ve geniş QRS). S-A iki atımda da 60 ms ve dizi aynı: retrograd iletim His-Purkinje'den bağımsız, septal yol üzerinden. V yakalaması iki atımda da sürüyor ve doğrudan A yakalaması yok.` },
    en: { title: 'Para-Hisian pacing: extranodal response', text: `${D.en} The first stimulus captures His+RV, the second RV only (narrow versus wide QRS). The S-A is 60 ms on both beats with the same sequence: retrograde conduction is independent of the His-Purkinje system, over the septal pathway. Ventricular capture persists on both beats and there is no direct atrial capture.` }
  },
  'ph-parahis-nodal-ha': {
    tr: { title: 'Karşılaştırma: nodal yanıt, S-A ve H-A', text: `${D.tr} Ablasyon sonrası aynı test: His capture kaybolunca S-A 100'den 145 ms'ye uzuyor ama H-A 55 ms'de sabit ve dizi korunuyor. Nodal yanıt: retrograd iletim His üzerinden. S-A ile H-A ayrı ölçülür; uzayan S-A tek başına yolu kanıtlamaz. "Nodal yanıt = AP yok" kuralı yine kullanılmaz.` },
    en: { title: 'Comparison: nodal response, S-A and H-A', text: `${D.en} The same test after ablation: when His capture is lost the S-A lengthens from 100 to 145 ms but the H-A stays at 55 ms with the same sequence. A nodal response: retrograde conduction runs through the His. S-A and H-A are measured separately; a longer S-A alone proves nothing about a pathway. The rule "nodal response = no pathway" is still not used.` }
  },
  'ph-parahis-direct-a': {
    tr: { title: 'Para-Hisian pacing: doğrudan A yakalaması', text: `${D.tr} Yüksek çıkışta uyarı atriyumu da doğrudan yakalıyor: A uyarıyla hemen birlikte (S-A 12 ms). Retrograd iletim ölçülemez; test yorumlanamaz. Çıkış azaltılıp kateter konumu düzeltilerek tekrarlanmalıdır.` },
    en: { title: 'Para-Hisian pacing: direct atrial capture', text: `${D.en} At high output the stimulus also captures the atrium directly: the A comes with the stimulus (S-A 12 ms). Retrograde conduction cannot be measured; the test is uninterpretable. Repeat with lower output and a corrected catheter position.` }
  },
  'ph-post': {
    tr: { title: 'Ablasyon sonrası sinüs: ileti sistemi korunmuş', text: `${D.tr} AH 80 ms, HV 45 ms: normal ileti sistemi korunmuş. AP'nin retrograd iletimi ayrıca test edilir (para-Hisian karşılaştırma klibi).` },
    en: { title: 'Post-ablation sinus: conduction system preserved', text: `${D.en} AH 80 ms, HV 45 ms: the normal conduction system is preserved. Retrograde pathway conduction is tested separately (the para-Hisian comparison clip).` }
  },
  'ap-lm-uni-site1': {
    tr: { title: 'Aday nokta 1: bipolar iyi, unipolar rS', text: `${D.tr} Bipolar kayıtta lokal V deltadan 12 ms önce ve A-V sürekli görünüyor. Aynı elektrottan unipolar kayıt ise rS: önce küçük pozitif, sonra negatif. Dalga cepheye bu noktaya başka yerden geliyor; insersiyon burada değil. İyi görünen bipolar kayıt unipolarla yeniden değerlendirilir (R8).` },
    en: { title: 'Candidate site 1: good bipolar, unipolar rS', text: `${D.en} The bipolar recording shows the local V 12 ms before the delta with continuous A-V. The unipolar recording from the same electrode is rS: a small positive then a negative deflection. The wavefront arrives here from elsewhere; the insertion is not here. A good-looking bipolar recording is re-read with the unipolar one (R8).` }
  },
  'ap-lm-uni-site2': {
    tr: { title: 'Aday nokta 2: unipolar QS', text: `${D.tr} Lokal V deltadan 20 ms önce ve unipolar kayıt QS (yalnız negatif, keskin başlangıç): aktivasyon bu noktadan uzaklaşıyor. İnsersiyona daha yakın aday. QS ve A-V sürekliliği tek başına başarılı hedef garantisi değildir (R8).` },
    en: { title: 'Candidate site 2: unipolar QS', text: `${D.en} The local V is 20 ms before the delta and the unipolar recording is QS (purely negative, sharp onset): activation moves away from this point. A closer candidate for the insertion. QS and A-V continuity alone do not guarantee a successful target (R8).` }
  },
  'ap-lm-sinus': {
    tr: {
      title: 'Sinüste preeksitasyon (delta)',
      neutral: `${D.tr} Sinüs ritmi. Yüzey QRS başlangıcını, His zamanını ve anulustaki ABL lokal V'yi ayrı ayrı işaretleyin.`,
      evidence: 'Yüzeyde delta ile QRS erken başlıyor; H-delta 25 ms (kısa görünür HV) ve ABL lokal V deltadan 15 ms önce (V-delta -15). Ventrikül, AP ile normal sistemin füzyonuyla aktive oluyor: delta erken bileşendir, His üzerinden gelen aktivasyon geç bileşendir. WPW paterni ile aritmili WPW sendromu ayrı kavramlardır (R3). Sinüste delta yokluğu tek başına concealed AP kanıtı değildir.'
    },
    en: {
      title: 'Preexcitation in sinus (delta)',
      neutral: `${D.en} Sinus rhythm. Mark the surface QRS onset, the His time and the annular ABL local V separately.`,
      evidence: 'The surface QRS starts early with a delta; H-delta is 25 ms (short apparent HV) and the ABL local V precedes the delta by 15 ms (V-delta -15). The ventricle activates by fusion of the pathway and the normal system: the delta is the early component, His-mediated activation the late one. A WPW pattern and arrhythmic WPW syndrome are separate concepts (R3). Absent delta in sinus alone does not prove a concealed pathway.'
    }
  },
  'ap-lm-post': {
    tr: { title: 'Ablasyon sonrası sinüs', text: `${D.tr} Delta kaybolmuş, QRS dar, HV 45 ms'ye dönmüş. Yalnız delta kaybı retrograd iletimi değerlendirmez: retrograd test ayrı kayıtta yapılır (R3).` },
    en: { title: 'Post-ablation sinus', text: `${D.en} The delta is gone, the QRS is narrow and HV is back to 45 ms. Delta loss alone does not assess retrograde conduction: the retrograde test is a separate recording (R3).` }
  },
  'ap-lm-post-retro': {
    tr: { title: 'Ablasyon sonrası retrograd test', text: `${D.tr} RV pacing'de retrograd A konsantrik ve geç: AP'nin retrograd bacağı da yok. İki yön ayrı ayrı değerlendirildi; sonlanım budur.` },
    en: { title: 'Post-ablation retrograde test', text: `${D.en} With RV pacing the retrograde A is concentric and late: the retrograde limb of the pathway is gone too. Both directions were assessed separately; that is the endpoint.` }
  }
,
  'pat-svt': {
    tr: {
      title: 'Uzun RP taşikardi, en erken A His bölgesinde',
      neutral: `${D.tr} TCL 420 ms. En erken A kanalını, VA süresini ve P morfolojisinin dar olduğunu kendiniz okuyun.`,
      evidence: 'Uzun RP, en erken A His kanallarında, dar P: para-Hisian fokal AT ile septal yol ve atipik AVNRT bu kayıtla ayrılmaz; manevra gerekir (R16, R19). Tek kayıt kesin tanı vermez.'
    },
    en: {
      title: 'Long RP tachycardia, earliest A in the His region',
      neutral: `${D.en} TCL 420 ms. Read the earliest A channel, the VA time and the narrow P morphology yourself.`,
      evidence: 'Long RP, earliest A on the His channels, narrow P: a para-Hisian focal AT, a septal pathway and atypical AVNRT are not separated by this recording; maneuvers are needed (R16, R19). One recording never proves the diagnosis.'
    }
  },
  'pat-hispvc': {
    tr: { title: 'His-refrakter PVC: A değişmedi', text: `${D.tr} His refrakterken verilen PVC atriyal zamanlamayı değiştirmiyor (A-A = TCL = 420 ms). Yanıtsızlık yol katılımını desteklemez; AT ve AVNRT bu kanıtla ayrılmaz (R9).` },
    en: { title: 'His-refractory PVC: A unchanged', text: `${D.en} The PVC delivered while the His is refractory leaves atrial timing unchanged (A-A = TCL = 420 ms). The absent response does not support pathway participation; AT and AVNRT are not separated by it (R9).` }
  },
  'pat-vop-dissoc': {
    tr: { title: 'Ventriküler overdrive: VA dissosiyasyonu', text: `${D.tr} RV pacing sırasında atriyal hız değişmiyor (A-A 420 ms) ve pacing sonrası odak kendi siklusuyla sürüyor: V-A bağlantısı yok. Atriyum devreye zorunlu bağlı değildir; fokal AT lehine güçlü kanıttır (R18). AVNRT nadiren benzer görünebilir; sonuç tek başına kesinleştirmez.` },
    en: { title: 'Ventricular overdrive: VA dissociation', text: `${D.en} During RV pacing the atrial rate does not change (A-A 420 ms) and after pacing the focus continues at its own cycle: there is no V-A linking. The atrium is not an obligatory part of a circuit; strong evidence for focal AT (R18). AVNRT can rarely look similar; the result alone is not final.` }
  },
  'pat-ncc-map': {
    tr: { title: 'Haritalama: nonkoroner kusp penceresi', text: `${D.tr} ABL nonkoroner kuspta: lokal A yüzey P başlangıcından 15 ms önce ve sağ para-Hisian A kadar erken (R20). Kusp penceresi His komşuluğundaki AV blok riskine alternatif erişimdir; bu klip karşılaştırma içindir, ablasyon reçetesi vermez (R17, R19).` },
    en: { title: 'Mapping: the noncoronary cusp window', text: `${D.en} The ABL sits in the noncoronary cusp: the local A precedes the surface P onset by 15 ms and is as early as the right para-Hisian A (R20). The cusp window is the alternative access to the AV block risk of the His neighbourhood; this clip is a comparison, not an ablation prescription (R17, R19).` }
  },
  'pat-post': {
    tr: { title: 'İşlem sonrası sinüs', text: `${D.tr} AT yok; AH 80 ms ve HV 45 ms korunmuş. İleti sisteminin korunması para-Hisian bölgede ayrı sonlanım katmanıdır (R19).` },
    en: { title: 'Post-procedure sinus', text: `${D.en} No AT; AH 80 ms and HV 45 ms are preserved. Preserved conduction is a separate endpoint layer in the para-Hisian region (R19).` }
  },
  'fvt-vt': {
    tr: {
      title: 'Fasiküler VT: P1 diastolik, P2 presistolik',
      neutral: `${D.tr} Geniş ama görece dar QRS taşikardi, TCL 340 ms. LVS kanallarındaki diastolik ve presistolik potansiyellerin yönünü, His zamanını ve atriyal diziyi kendiniz okuyun.`,
      evidence: 'AV dissosiyasyonu var (sinüs A-A 880 ms, V\'den bağımsız). LV septumda P1 bazalden apekse diastolde, P2 apeksten bazale presistolde; His retrograd (H, V başlangıcından sonra). Verapamil duyarlı posterior fasiküler VT ile uyumludur; SVT + aberasyon bu kayıtla dışlanır çünkü atriyum bağımsızdır (R21, R22). Tek kayıt kesin tanı vermez.'
    },
    en: {
      title: 'Fascicular VT: diastolic P1, presystolic P2',
      neutral: `${D.en} A relatively narrow wide QRS tachycardia, TCL 340 ms. Read the direction of the diastolic and presystolic potentials on the LVS channels, the His timing and the atrial sequence yourself.`,
      evidence: 'AV dissociation is present (sinus A-A 880 ms, independent of the V). On the LV septum P1 runs base to apex in diastole and P2 apex to base presystolic; the His is retrograde (H after QRS onset). The pattern fits verapamil-sensitive posterior fascicular VT; SVT with aberrancy is excluded by the independent atrium (R21, R22). One recording never proves the diagnosis.'
    }
  },
  'fvt-entrain': {
    tr: { title: 'RV\'den entrainment: eksitabl aralıklı reentri', text: `${D.tr} 310 ms pacing P1 dizisini aynı yönde pacing hızına uyduruyor (ortodromik yakalama) ve tren sonrası VT 340 ms ile sürüyor. PPI-TCL yaklaşık 58 ms: RV apeksi devrenin dışında, devre LV septumunda (R21). Füzyon ve reset okunmadan sonuç çıkarılamaz; değerler öğretim örneğidir.` },
    en: { title: 'Entrainment from the RV: reentry with an excitable gap', text: `${D.en} Pacing at 310 ms makes the P1 sequence follow the paced rate in the same direction (orthodromic capture) and the VT resumes at 340 ms after the train. PPI-TCL is about 58 ms: the RV apex is outside the circuit, which sits on the LV septum (R21). No conclusion without reading fusion and reset; the values are teaching examples.` }
  },
  'fvt-post': {
    tr: { title: 'Ablasyon sonrası sinüs: Purkinje korunmuş', text: `${D.tr} P1 bölgesine ablasyon sonrası sinüste HV 45 ms ve LVS kanallarında antegrad Purkinje potansiyeli lokal V\'den önce: normal ileti korunmuş. Kalıcı sonlanım yeniden indüklenememedir; aks değişimi ölçütü uzman incelemesi bekler (R25).` },
    en: { title: 'Post-ablation sinus: Purkinje preserved', text: `${D.en} After ablation at the P1 site the sinus HV is 45 ms and the LVS channels show the antegrade Purkinje potential before the local V: normal conduction is preserved. The durable endpoint is noninducibility; the axis change criterion awaits expert review (R25).` }
  },
  'bbr-sinus': {
    tr: {
      title: 'Sinüs: ileti gecikmesi ve uzun HV',
      neutral: `${D.tr} Sinüs ritmi. AH, HV ve sağ dal (RB) potansiyelinin zamanını kendiniz ölçün; QRS\'in geniş olduğunu not edin.`,
      evidence: 'HV 85 ms (uzamış) ve QRS\'te spesifik olmayan ileti gecikmesi: His-Purkinje hastalığı. Bu zemin dal bloğu reentrisinin ön koşuludur; dilate kardiyomiyopatide sıktır (R26). Tek kayıt tanı koymaz.'
    },
    en: {
      title: 'Sinus: conduction delay and a long HV',
      neutral: `${D.en} Sinus rhythm. Measure the AH, the HV and the right bundle (RB) potential timing yourself; note the wide QRS.`,
      evidence: 'HV 85 ms (prolonged) with a nonspecific intraventricular delay: His-Purkinje disease. This substrate is the precondition of bundle branch reentry and is common in dilated cardiomyopathy (R26). One recording never makes the diagnosis.'
    }
  },
  'bbr-vt': {
    tr: {
      title: 'Geniş QRS taşikardi: her V\'den önce H ve RB',
      neutral: `${D.tr} LBBB tipi geniş QRS taşikardi, TCL 320 ms. Her V\'den önce H ve RB potansiyeli var mı, atriyal dizi bağımsız mı: kendiniz okuyun.`,
      evidence: 'Her V\'yi H ve ardından RB potansiyeli önceler; VT sırasında HV sinüstekinden kısadır veya benzerdir ve atriyum dissosiyedir. Devre His-Purkinje makroreentrisidir: antegrad sağ dal, retrograd sol dal (R26, R27). Miyokardiyal VT\'de H genellikle V içinde kaybolur; tek kayıt kesinleştirmez.'
    },
    en: {
      title: 'Wide QRS tachycardia: H and RB before every V',
      neutral: `${D.en} An LBBB-type wide QRS tachycardia, TCL 320 ms. Is every V preceded by an H and an RB potential, and is the atrial sequence independent: read it yourself.`,
      evidence: 'Every V is preceded by an H and then an RB potential; the HV during VT is similar to or shorter than sinus and the atrium is dissociated. The circuit is His-Purkinje macroreentry: antegrade right bundle, retrograde left bundle (R26, R27). In myocardial VT the H is usually buried in the V; one recording is never final.'
    }
  },
  'bbr-hh-vv': {
    tr: {
      title: 'Siklus salınımı: H-H değişimi V-V\'yi öncüler',
      neutral: `${D.tr} Aynı VT, siklus uzunluğu salınıyor. H-H ve V-V aralıklarını sırayla ölçüp hangisinin öncülük ettiğini kendiniz okuyun.`,
      evidence: 'Siklus değişiminde H-H aralığındaki değişim aynı dönüşün V-V\'sinde yeniden görülür: His aktivasyonu ventrikülü öncüler, devre His-Purkinje sistemindedir (R26). Miyokardiyal VT\'de V-V değişimi H\'yi sürükler; ilişki terstir.'
    },
    en: {
      title: 'Cycle wobble: the H-H change precedes the V-V',
      neutral: `${D.en} The same VT with an oscillating cycle length. Measure the successive H-H and V-V intervals and read which one leads.`,
      evidence: 'With cycle length change the H-H variation reappears in the V-V of the same return: His activation leads the ventricle, so the circuit lives in the His-Purkinje system (R26). In myocardial VT the V-V change drives the H; the relation is reversed.'
    }
  },
  'af-pvi-baseline': {
    tr: {
      title: 'AF ve pulmoner ven potansiyelleri',
      neutral: `${D.tr} Yüzeyde düzensiz RR ve f dalgaları. Lasso (PV) kanalındaki keskin, hızlı potansiyelleri ve uzak alan atriyal sinyali kendiniz ayırın.`,
      evidence: 'Düzensiz dar QRS ritmi ve atriyal kanallarda f dalgaları: AF. Lasso kanalındaki keskin, hızlı potansiyeller ven kası kaynaklı yakın alan PV potansiyelleridir; AF tetikleyicileri çoğunlukla pulmoner venlerden çıkar (R29). İzolasyonun okunuşu Tedavi sekmesindeki egzersizdedir (R30, R31).'
    },
    en: {
      title: 'AF and pulmonary vein potentials',
      neutral: `${D.en} Irregular RR and f waves on the surface. Separate the sharp fast potentials on the Lasso (PV) channel from the far-field atrial signal yourself.`,
      evidence: 'An irregular narrow QRS rhythm with f waves on the atrial channels: AF. The sharp fast Lasso potentials are near-field PV potentials from the vein musculature; AF triggers mostly arise from the pulmonary veins (R29). Reading isolation lives in the Treatment tab exercise (R30, R31).'
    }
  },
  'bbr-post': {
    tr: { title: 'Sağ dal ablasyonu sonrası sinüs', text: `${D.tr} RB potansiyeli kayboldu, QRS RBBB tipine döndü ve HV 100 ms\'ye uzadı: devre kesildi. Tuzaklar ayrı izlenir: interfasiküler reentri gelişebilir ve ileti rezervi azaldıysa kalıcı pacing gerekebilir (R27, R28).` },
    en: { title: 'Sinus after right bundle ablation', text: `${D.en} The RB potential is gone, the QRS turned RBBB and the HV lengthened to 100 ms: the circuit is interrupted. The pitfalls are followed separately: interfascicular reentry can develop and permanent pacing may be needed if conduction reserve is low (R27, R28).` }
  }
});

/** Interactive maneuver text (ep-maneuver-sim.js): controls, feedback and one explanation per result reason. */
export const EP_SIM_TEXT = Object.freeze({
  tr: {
    heading: 'Manevrayı sen uygula', maneuver: 'Manevra', site: 'Pacing yeri', timing: 'Uyarı zamanı (H\'ye göre)', pcl: 'Pacing siklusu', output: 'Çıkış / yakalama',
    deliver: 'Uyar', retry: 'Yeniden dene', tcl: 'TCL',
    maneuvers: { 'his-pvc': 'His-refrakter PVC', 'v-overdrive': 'Ventriküler overdrive', 'para-his': 'Para-Hisian pacing (sinüste)' },
    sites: { 'rv-apex': 'RV apeks', 'rv-base': 'RV bazal' },
    outputs: { standard: 'Yüksek sonra düşük çıkış (His+RV, yalnız RV)', 'direct-a': 'Çok yüksek çıkış / atriyuma yakın', 'pure-his': 'Yalnız His yakalama' },
    feedback: { capture: 'Ventrikül yakalama', hisRefractory: 'His refrakter', entrained: 'Entrainment', directA: 'Doğrudan A yakalama', rvCapture: 'RV yakalama', yes: 'var', no: 'yok' },
    results: { valid: 'Tanısal sonuç', invalidCapture: 'Yorumlanamaz: yakalama koşulu', insufficientEvidence: 'Tanısal değil' },
    reasons: {
      aUnchanged: 'His refrakterken verilen PVC A zamanlamasını değiştirmedi: bu siklusta yol katılımı gösterilmedi. Negatif yanıt AP\'yi dışlamaz.',
      aAdvanced: 'His refrakterken A ilerledi ve sonraki siklus da ilerledi: retrograd yol katılımı lehine güçlü kanıt.',
      aDelayed: 'His refrakterken A gecikti ve siklus uzadı: decremental retrograd yolun katılımı lehine.',
      hisNotRefractory: 'Uyarı H\'den önce geldi: His henüz refrakter değil, yanıt His üzerinden gelmiş olabilir. A değişse de tanısal değil; uyarıyı H\'den sonraya alın.',
      pvcNoCapture: 'Uyarı ventrikül refrakterken geldi ve yakalamadı. Tanısal değil; uyarıyı öne alın.',
      VAV: 'Son pacing atımından sonra V-A-V dizisi. PPI-TCL ve SA-VA olaylardan ölçüldü; klasik değerler (PPI-TCL > 115 ms, SA-VA > 85 ms atipik AVNRT lehine) septal AP-ORT karşılaştırmasından gelir, bütün zonlara kesin eşik değildir (R12). İki pacing yerini karşılaştırmak diferansiyel RV pacing\'dir.',
      AAV: 'Pacing sonrası A-A-V dizisi: fokal AT lehine. Pseudo-A-A-V (uzun VA ile son retrograd A\'nın yanlış sayılması) tuzağına dikkat.',
      notFaster: 'Pacing siklusu TCL\'den kısa değil: entrainment olamaz, PPI hesaplanmaz. Siklusu TCL\'nin 10-40 ms altına alın.',
      terminated: 'Pacing taşikardiyi sonlandırdı: dönüş dizisi yok, sonuç tanısal değil. Daha uzun siklusla tekrar deneyin.',
      nodal: 'His yakalaması kaybolunca S-A uzadı, dizi aynı: nodal yanıt. Uzak sol yol veya yavaş (decremental) retrograd yol nodal iletimle maskelenebilir; "AP yok" sonucu çıkarılmaz.',
      extranodal: 'His yakalaması kaybolunca S-A değişmedi ve dizi aynı: extranodal yanıt, septal yol lehine.',
      directA: 'Uyarı atriyumu doğrudan yakaladı: A uyarıyla birlikte. Retrograd iletim ölçülemez; yorumlanamaz.',
      pureHis: 'Yalnız His yakalandı, lokal RV miyokardı yakalanmadı: karşılaştırmanın V yakalama koşulu yok; yorumlanamaz.'
    }
  },
  en: {
    heading: 'Run the maneuver yourself', maneuver: 'Maneuver', site: 'Pacing site', timing: 'Stimulus time (relative to H)', pcl: 'Pacing cycle length', output: 'Output / capture',
    deliver: 'Deliver', retry: 'Try again', tcl: 'TCL',
    maneuvers: { 'his-pvc': 'His-refractory PVC', 'v-overdrive': 'Ventricular overdrive', 'para-his': 'Para-Hisian pacing (in sinus)' },
    sites: { 'rv-apex': 'RV apex', 'rv-base': 'RV base' },
    outputs: { standard: 'High then low output (His+RV, RV only)', 'direct-a': 'Very high output / near the atrium', 'pure-his': 'His-only capture' },
    feedback: { capture: 'Ventricular capture', hisRefractory: 'His refractory', entrained: 'Entrainment', directA: 'Direct atrial capture', rvCapture: 'RV capture', yes: 'yes', no: 'no' },
    results: { valid: 'Diagnostic result', invalidCapture: 'Uninterpretable: capture condition', insufficientEvidence: 'Not diagnostic' },
    reasons: {
      aUnchanged: 'The PVC delivered while the His is refractory left the atrial timing unchanged: no pathway participation shown in this cycle. A negative response does not exclude a pathway.',
      aAdvanced: 'With the His refractory the A advanced and the next cycle advanced with it: strong evidence of retrograde pathway participation.',
      aDelayed: 'With the His refractory the A was delayed and the cycle lengthened: favors participation of a decremental retrograde pathway.',
      hisNotRefractory: 'The stimulus came before the H: the His is not yet refractory and the response may have used the His. Even if the A changes it is not diagnostic; move the stimulus after the H.',
      pvcNoCapture: 'The stimulus fell in refractory ventricle and did not capture. Not diagnostic; deliver it earlier.',
      VAV: 'A V-A-V sequence after the last paced beat. PPI-TCL and SA-VA are measured from the events; the classic values (PPI-TCL > 115 ms, SA-VA > 85 ms favoring atypical AVNRT) come from the septal AP-ORT comparison and are not strict cutoffs for every zone (R12). Comparing two pacing sites is differential RV pacing.',
      AAV: 'An A-A-V sequence after pacing: favors focal AT. Beware the pseudo-A-A-V trap (a long VA making the last retrograde A look like a second A).',
      notFaster: 'The pacing cycle length is not shorter than the TCL: no entrainment is possible and no PPI is computed. Pace 10-40 ms below the TCL.',
      terminated: 'Pacing terminated the tachycardia: there is no return sequence and the result is not diagnostic. Try again with a longer cycle length.',
      nodal: 'When His capture was lost the S-A lengthened with the same sequence: a nodal response. A far left-sided or slowly conducting (decremental) retrograde pathway can be masked by nodal conduction; no "no pathway" conclusion is drawn.',
      extranodal: 'When His capture was lost the S-A stayed the same with the same sequence: an extranodal response, favoring a septal pathway.',
      directA: 'The stimulus captured the atrium directly: the A comes with the stimulus. Retrograde conduction cannot be measured; uninterpretable.',
      pureHis: 'Only the His was captured, not the local RV myocardium: the ventricular capture condition of the comparison is missing; uninterpretable.'
    }
  }
});

/**
 * Annotated comparison cards shown with the evidence of a diagnosis clip:
 * focal AT against AVNRT/AVRT, antidromic AVRT against VT. Rows are teaching
 * contrasts, not a scoring rule.
 */
export const EP_COMPARE = Object.freeze({
  'at-svt': {
    tr: { title: 'Fokal AT, AVNRT ve ortodromik AVRT', head: ['', 'Fokal AT', 'AVNRT', 'Ortodromik AVRT'], rows: [
      ['En erken A', 'Odak (burada HRA, krista)', 'Septal (His / CS ağzı)', 'Yolun atriyal ucu'],
      ['V overdrive sonrası', 'A-A-V', 'V-A-V', 'V-A-V'],
      ['VA linking (farklı pacing hızları)', 'Yok, VA değişken', 'Var', 'Var'],
      ['His-refrakter PVC', 'Etkisiz', 'Etkisiz', 'A ilerler / reset'],
      ['AV blok ile taşikardi', 'Sürebilir', 'Nadiren sürer', 'Süremez (V devrede)']
    ] },
    en: { title: 'Focal AT, AVNRT and orthodromic AVRT', head: ['', 'Focal AT', 'AVNRT', 'Orthodromic AVRT'], rows: [
      ['Earliest A', 'The focus (here HRA, crista)', 'Septal (His / CS ostium)', 'Atrial end of the pathway'],
      ['After V overdrive', 'A-A-V', 'V-A-V', 'V-A-V'],
      ['VA linking (different pacing rates)', 'Absent, variable VA', 'Present', 'Present'],
      ['His-refractory PVC', 'No effect', 'No effect', 'A advances / reset'],
      ['Tachycardia with AV block', 'Can continue', 'Rarely continues', 'Cannot continue (V in the circuit)']
    ] }
  },
  'ap-lm-antidromic': {
    tr: { title: 'Geniş QRS taşikardi: antidromik AVRT mı, VT mi?', head: ['', 'Antidromik AVRT', 'VT'], rows: [
      ['QRS', 'Tam preeksite, sinüs deltasıyla uyumlu', 'Preeksitasyonla ilişkisiz morfoloji'],
      ['His', 'Retrograd, V\'den sonra', 'Ayrışık veya retrograd'],
      ['A:V ilişkisi', '1:1 zorunlu (atriyum devrede)', 'AV dissosiyasyon olabilir'],
      ['Atriyal uyarı', 'Taşikardiyi resetleyebilir', 'Genellikle etkilemez'],
      ['Sonuç', 'Tek morfoloji kesin tanı vermez; manevra ve öykü birlikte', 'Tek morfoloji kesin tanı vermez']
    ] },
    en: { title: 'Wide QRS tachycardia: antidromic AVRT or VT?', head: ['', 'Antidromic AVRT', 'VT'], rows: [
      ['QRS', 'Fully preexcited, matching the sinus delta', 'Morphology unrelated to preexcitation'],
      ['His', 'Retrograde, after the V', 'Dissociated or retrograde'],
      ['A:V relation', '1:1 required (atrium in the circuit)', 'AV dissociation possible'],
      ['Atrial stimulus', 'Can reset the tachycardia', 'Usually no effect'],
      ['Conclusion', 'One morphology gives no definite diagnosis; maneuvers and history together', 'One morphology gives no definite diagnosis']
    ] }
  }
});


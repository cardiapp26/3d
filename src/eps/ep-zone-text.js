// Pathway zone names and risk notes. Shared by the EPS laboratory (case
// texts, 2D schematic) and the 3D simulator (ep-zones.js arcs), so the 3D
// page does not load the case texts.

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
    tr: { name: 'Krista terminalis (fokal AT kaynağı)', risk: 'Fokal AT\'nin en sık kaynağıdır (kristal taşikardi). Anulus AP zonu değildir; şemada kristanın sağ atriyum lateral duvarındaki seyri işaretlenir. Uzun RP görünümü atipik AVNRT ve PJRT ile çakışır.' },
    en: { name: 'Crista terminalis (focal AT source)', risk: 'The commonest source of focal AT (cristal tachycardia). It is not an annular pathway zone; the schematic marks the course of the crista along the lateral right atrial wall. Its long RP picture overlaps atypical AVNRT and PJRT.' }
  },
  'cavotricuspid-isthmus': {
    tr: { name: 'Kavotriküspit istmus (CTI)', risk: 'Triküspit anulus ile IVC ağzı arasındaki sağ atriyum tabanı; tipik flutterin yavaş iletim koridoru. CS ağzı ve Koch bölgesi komşudur; hat yeri şematiktir.' },
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

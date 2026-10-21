import * as THREE from 'three';

/*
 * RV segmentation of Miyazaki et al., The Right Ventricular Outflow Tract,
 * Part 1 (JACC Case Rep 2026;31(36):109418), Figure 2: inflow, outflow and
 * apical trabeculated regions, and the three outflow structures that encircle
 * the inferior border of the outflow: supraventricular crest, septomarginal
 * trabeculation and moderator band.
 * - Supraventricular crest: the inner-curvature fold between the tricuspid and
 *   pulmonary valves, facing the right coronary aortic sinus (it lifts the
 *   pulmonary valve away from the tricuspid valve).
 * - Septomarginal trabeculation: the septal band from below the crest to the
 *   septal origin of the moderator band.
 * The atlas RV has no trabeculations; these are teaching regions derived from
 * measured landmarks (valve centres, the RCC, the moderator band insertion),
 * not segmented tissue.
 */
export const CREST_T = [0.33, 0.8];       // share of the tricuspid-to-pulmonary valve axis
export const CREST_SIDE = 0.35;           // cosine toward the RCC across the axis
export const CREST_RADIUS = 0.5;          // max distance from the valve axis, as a share of the axis length
export const SMT_WIDTH = 0.17;            // half-width of the septomarginal band
export const FIG2_COLORS = Object.freeze({
  inflow: '#6fa8dc', outflow: '#f1c232', apical: '#93c47d', wall: '#9a7a76', crest: '#e07b39', smt: '#c0507e'
});
const TRIPARTITE = { inlet: 'inflow', rvot: 'outflow', apical: 'apical' };

const v3 = (pos, i) => new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));

/** Distance from p to the segment ab. */
export function segmentDistance(p, a, b) {
  const ab = b.clone().sub(a), t = THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1);
  return p.distanceTo(a.clone().addScaledVector(ab, t));
}

/**
 * @param {{ rvGeometry: THREE.BufferGeometry, regionParts: { names: object[], byVertex: ArrayLike<number> },
 *   tvCenter: THREE.Vector3, pvCenter: THREE.Vector3, rccCenter: THREE.Vector3, mbSeptal: THREE.Vector3,
 *   nearLv: (p: THREE.Vector3) => boolean }} input
 * @returns {{ ids: string[], byVertex: Int8Array, anchors: { crest: THREE.Vector3, smtTop: THREE.Vector3, mbSeptal: THREE.Vector3 } }}
 */
export function rvFigure2Regions({ rvGeometry, regionParts, tvCenter, pvCenter, rccCenter, mbSeptal, nearLv }) {
  const ids = ['inflow', 'outflow', 'apical', 'wall', 'crest', 'smt'];
  const pos = rvGeometry.attributes.position, byVertex = new Int8Array(pos.count);
  const axis = pvCenter.clone().sub(tvCenter), span = axis.length();
  const unit = axis.clone().normalize();
  const across = (p) => { const v = p.clone().sub(tvCenter); return v.addScaledVector(unit, -v.dot(unit)); };
  const inner = across(rccCenter).normalize();
  const crestPoints = [];
  for (let i = 0; i < pos.count; i++) {
    const p = v3(pos, i), t = p.clone().sub(tvCenter).dot(unit) / span, r = across(p);
    const key = regionParts.names[regionParts.byVertex[i]]?.key?.replace('rv-', '');
    let id = TRIPARTITE[key] || 'wall';
    if (t > CREST_T[0] && t < CREST_T[1] && r.length() < CREST_RADIUS * span && r.clone().normalize().dot(inner) > CREST_SIDE) {
      id = 'crest';
      crestPoints.push(p);
    }
    byVertex[i] = ids.indexOf(id);
  }
  // The septomarginal band starts at the septal (LV-facing) foot of the crest.
  const septalCrest = crestPoints.filter((p) => nearLv(p));
  const pickFrom = septalCrest.length ? septalCrest : crestPoints;
  const smtTop = pickFrom.length
    ? pickFrom.reduce((best, p) => (p.distanceTo(mbSeptal) < best.distanceTo(mbSeptal) ? p : best), pickFrom[0])
    : tvCenter.clone().lerp(pvCenter, 0.5);
  for (let i = 0; i < pos.count; i++) {
    if (ids[byVertex[i]] === 'crest') continue;
    const p = v3(pos, i);
    if (nearLv(p) && segmentDistance(p, smtTop, mbSeptal) < SMT_WIDTH) byVertex[i] = ids.indexOf('smt');
  }
  const crest = crestPoints.length ? crestPoints.reduce((s, p) => s.add(p), new THREE.Vector3()).divideScalar(crestPoints.length) : smtTop.clone();
  return { ids, byVertex, anchors: { crest, smtTop, mbSeptal: mbSeptal.clone() } };
}

const name = (tr, en, abbr) => ({ tr, en, abbr });
export const FIG2_NAMES = {
  inflow: name('Giriş (inflow) bölgesi', 'Inflow region', 'Inflow'),
  outflow: name('Çıkış (outflow) bölgesi', 'Outflow region', 'Outflow'),
  apical: name('Apikal trabeküler bölge', 'Apical trabeculated region', 'Apex'),
  wall: name('RV duvarı', 'RV wall', 'RV'),
  crest: name('Supraventriküler krista', 'Supraventricular crest', 'SVC'),
  smt: name('Septomarjinal trabekülasyon', 'Septomarginal trabeculation', 'SMT')
};

/** Paper (attitudinal) names next to the atlas names. */
export const FIG2_LABELS = {
  leaflets: {
    septal: { tr: 'Septal yaprakçık', en: 'Septal leaflet' },
    inferior: { tr: 'İnferior yaprakçık', en: 'Inferior leaflet' },
    anterior: { tr: 'Süperior (anterior) yaprakçık', en: 'Superior (anterior) leaflet' }
  },
  sinuses: {
    'Right semilunar leaflet of pulmonary valve': { tr: 'Sağ komşu pulmoner sinüs', en: 'Right adjacent pulmonary sinus' },
    'Left semilunar leaflet of pulmonary valve': { tr: 'Sol komşu pulmoner sinüs', en: 'Left adjacent pulmonary sinus' },
    'Anterior semilunar leaflet of pulmonary valve': { tr: 'Komşu olmayan pulmoner sinüs', en: 'Non-adjacent pulmonary sinus' }
  },
  papillary: {
    'Anterior papillary muscle of right ventricle': { tr: 'Anterior papiller kas', en: 'Anterior papillary muscle' },
    'Inferior papillary muscle of right ventricle': { tr: 'İnferior papiller kas', en: 'Inferior papillary muscle' },
    'Septal papillary muscle of right ventricle': { tr: 'Medial (septal) papiller kas', en: 'Medial (septal) papillary muscle' }
  },
  band: { tr: 'Moderatör bant', en: 'Moderator band' }
};

export const FIG2_TEXT = {
  tr: {
    toggle: 'RV bölümleri ve çıkış yapıları',
    intro: 'Serbest duvar kaldırılmış, önden bakış (Miyazaki 2026). Sağ ventrikül üç bölgeye ayrılır: giriş, çıkış ve apikal trabeküler bölge. Üç çıkış yapısı, yani supraventriküler krista, septomarjinal trabekülasyon ve moderatör bant, çıkış yolunun alt sınırını girişin üstünde çevreler.',
    legend: 'Renkler',
    items: [
      ['crest', 'Triküspit ile pulmoner kapak arasındaki kas kıvrımı; sağ koroner aort sinüsünü örten endokard yüzeyi düzdür ve pulmoner kapağı triküspit kapaktan yükseltir. RVOT kesitinde posterolateral serbest duvar ile aynı yapıdır.'],
      ['smt', 'Septum üzerinde kristanın altından moderatör bandın çıktığı yere inen bant; proksimal sağ dal bunun içindedir ve medial papiller kas buradan çıkar. RVOT kesitinde septal duvar ile aynı yapıdır.'],
      ['band', 'Septomarjinal trabekülasyondan anterior papiller kasa uzanır; giriş ile apikal trabeküler bölge arasındaki üst sınırdadır ve sağ dalı taşır.']
    ],
    clinical: [
      'Apikal bölgede boşluğu kat eden kaba, kalın trabeküller kateter ve lead manipülasyonunu zorlaştırır; ama leadless pacemaker için tutunma sağlayıp yer değiştirmeyi önleyebilir.',
      'Giriş ve çıkış bölgelerinde boşluğu kat eden trabekül yoktur: kateter kolay hareket eder, ancak leadless pacemaker için tutunma zayıftır ve triküspit kapakla etkileşim riski artar.'
    ],
    names: 'Adlandırma: makale konum (attitudinal) adlarını kullanır. Atlastaki anterior triküspit yaprakçık = süperior yaprakçık; pulmoner kapakçıklar sağ = sağ komşu, sol = sol komşu, anterior = komşu olmayan sinüs. Atlastaki septal papiller kas, konumuna göre makaledeki medial papiller kasa karşılık gelir.',
    limits: 'Atlas RV iç yüzeyi düzdür; trabeküller gösterilemez. Krista ve septomarjinal trabekülasyon, kapak merkezleri, sağ koroner sinüs ve moderatör bant ucundan türetilmiş öğretim bölgeleridir.'
  },
  en: {
    toggle: 'RV regions and outflow structures',
    intro: 'Free wall removed, anterior view (Miyazaki 2026). The right ventricle has three regions: inflow, outflow and apical trabeculated. Three outflow structures, the supraventricular crest, septomarginal trabeculation and moderator band, encircle the inferior border of the outflow above the inflow.',
    legend: 'Colours',
    items: [
      ['crest', 'Muscular fold between the tricuspid and pulmonary valves; its endocardium over the right coronary aortic sinus is smooth and it lifts the pulmonary valve away from the tricuspid valve. In the RVOT section it is the posterolateral free wall.'],
      ['smt', 'Septal band from below the crest to the septal origin of the moderator band; it houses the proximal right bundle and gives rise to the medial papillary muscle. In the RVOT section it is the septal wall.'],
      ['band', 'Runs from the septomarginal trabeculation to the anterior papillary muscle at the superior margin between inflow and apical trabeculated region; it carries the right bundle.']
    ],
    clinical: [
      'Coarse, thick trabeculations crossing the apical region hinder catheter and lead manipulation, yet may anchor a leadless pacemaker against dislodgement.',
      'Inflow and outflow regions lack traversing trabeculations: catheters move easily, but a leadless pacemaker has little anchoring and a higher risk of interacting with the tricuspid valve.'
    ],
    names: 'Naming: the paper uses attitudinal names. Atlas anterior tricuspid leaflet = superior leaflet; pulmonary cusps right = right adjacent, left = left adjacent, anterior = non-adjacent sinus. By position, the atlas septal papillary muscle corresponds to the paper’s medial papillary muscle.',
    limits: 'The atlas RV endocardium is smooth; trabeculations cannot be shown. The crest and septomarginal trabeculation are teaching regions derived from the valve centres, right coronary sinus and moderator band insertion.'
  }
};

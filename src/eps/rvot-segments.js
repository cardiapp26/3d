// RVOT segments seen from above, with neighbours and procedural meaning.
// Sources: Miyazaki et al., The Right Ventricular Outflow Tract, Part 1
// (JACC Case Rep 2026;31(36):109418, doi 10.1016/j.jaccas.2026.109418),
// Figures 2-13; Aronis, The RVOT Is a Neighborhood (editorial comment,
// JACC Case Rep 2026;31(36):110024, doi 10.1016/j.jaccas.2026.110024).
// Original schematic: angles and radii are teaching placements, not measured.
const NS = 'http://www.w3.org/2000/svg';
const s = (doc, tag, attrs = {}, text = '') => {
  const n = doc.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (text) n.textContent = text;
  return n;
};

export const RVOT_SEGMENT_SOURCES = Object.freeze([
  { id: 'miyazaki', title: 'Miyazaki et al. · The right ventricular outflow tract, part 1 (JACC Case Rep 2026)', url: 'https://doi.org/10.1016/j.jaccas.2026.109418' },
  { id: 'aronis', title: 'Aronis · The RVOT is a neighborhood: from descriptive to interventional anatomy (JACC Case Rep 2026)', url: 'https://doi.org/10.1016/j.jaccas.2026.110024' }
]);

// Superior view, anterior up, patient right on the viewer's right (as when
// looking down from the head). Angles in SVG degrees: 0 right, 90 down.
const CENTER = [185, 170];
const RING = [50, 84];
export const RVOT_SEGMENTS = Object.freeze([
  { id: 'anterior', short: 'A', from: 232, to: 308, level: 'high' },
  { id: 'lateral', short: 'L', from: 308, to: 378, level: 'high' },
  { id: 'posterolateral', short: 'PL', from: 18, to: 92, level: 'high' },
  { id: 'posterior', short: 'P', from: 92, to: 146, level: 'high' },
  { id: 'medial', short: 'M', from: 146, to: 232, level: 'high' },
  { id: 'septal', short: 'S', from: 100, to: 214, level: 'low' }
]);
/** VES examples drawn on this view: region id -> marker position. */
export const RVOT_SEGMENT_SITES = Object.freeze({ 'rvot-free': [214, 92], 'rvot-septal': [104, 254], 'lv-summit': [236, 318] });
/** Segments each VES example belongs to, for the example's anatomy note. */
export const SEGMENTS_FOR_SITE = Object.freeze({ 'rvot-free': ['anterior', 'lateral', 'posterolateral'], 'rvot-septal': ['septal', 'medial', 'posterior'], 'lv-summit': ['posterior'] });

const polar = (deg, r) => { const a = deg * Math.PI / 180; return [CENTER[0] + r * Math.cos(a), CENTER[1] + r * Math.sin(a)]; };
function arcPath(from, to, r1, r2) {
  const [ax, ay] = polar(from, r2), [bx, by] = polar(to, r2), [cx, cy] = polar(to, r1), [dx, dy] = polar(from, r1);
  const large = to - from > 180 ? 1 : 0;
  return `M${ax.toFixed(1)} ${ay.toFixed(1)} A${r2} ${r2} 0 ${large} 1 ${bx.toFixed(1)} ${by.toFixed(1)} L${cx.toFixed(1)} ${cy.toFixed(1)} A${r1} ${r1} 0 ${large} 0 ${dx.toFixed(1)} ${dy.toFixed(1)}Z`;
}

/** Draw the segment ring, pulmonary sinuses and neighbours; segments are buttons. */
export function renderRvotSegments(doc, svg, { t, segment, variant = 'present', onSegment }) {
  const T = t.rvotSeg;
  const scene = s(doc, 'g', { class: 'rvot-seg-scene' });
  scene.append(s(doc, 'rect', { x: 5, y: 5, width: 356, height: 361, rx: 16, class: 'ves-map-frame' }));
  // Neighbours around the ring.
  scene.append(s(doc, 'line', { x1: 40, y1: 38, x2: 330, y2: 38, class: 'rvot-seg-wall' }));
  const caption = (x, y, text, cls = 'ves-map-caption') => scene.append(s(doc, 'text', { x, y, class: cls, 'text-anchor': 'middle' }, text));
  caption(185, 30, T.neighbours.chest);
  scene.append(s(doc, 'circle', { cx: 296, cy: 268, r: 40, class: 'rvot-seg-aorta' }));
  caption(296, 262, T.neighbours.aorta); caption(296, 276, 'R · L · N', 'ves-map-tiny');
  scene.append(s(doc, 'path', { d: 'M330 60 Q350 110 338 168', class: 'rvot-seg-rca' }));
  caption(318, 56, T.neighbours.rca, 'ves-map-tiny');
  scene.append(s(doc, 'path', { d: 'M52 96 Q40 160 62 228', class: 'rvot-seg-lad' }));
  scene.append(s(doc, 'text', { x: 16, y: 86, class: 'ves-map-tiny', 'text-anchor': 'start', style: 'text-anchor:start' }, T.neighbours.lad));
  scene.append(s(doc, 'ellipse', { cx: 168, cy: 318, rx: 52, ry: 18, class: 'rvot-seg-summit' }));
  caption(168, 322, T.neighbours.summit, 'ves-map-tiny');
  caption(70, 300, T.neighbours.lvot, 'ves-map-tiny');
  // Pulmonary root with right-adjacent, left-adjacent and nonadjacent sinuses (Fig. 13 alignment).
  scene.append(s(doc, 'circle', { cx: CENTER[0], cy: CENTER[1], r: RING[0] - 4, class: 'rvot-seg-root' }));
  for (const [deg, label] of [[345, 'r'], [122, 'l'], [212, 'n']]) {
    const [x, y] = polar(deg, 24);
    scene.append(s(doc, 'circle', { cx: x, cy: y, r: 15, class: 'rvot-seg-sinus' }), s(doc, 'text', { x, y: y + 4, class: 'ves-map-caption', 'text-anchor': 'middle' }, label));
  }
    // Orientation.
  caption(185, 344, `${T.root} · ${T.levelNote}`, 'ves-map-tiny');
  caption(185, 358, T.compass, 'ves-map-tiny');
  svg.append(scene);

  for (const seg of RVOT_SEGMENTS) {
    const low = seg.level === 'low';
    const absent = seg.id === 'posterior' && variant === 'absent';
    const r1 = low ? RING[1] + 8 : RING[0], r2 = low ? RING[1] + 26 : RING[1];
    const group = s(doc, 'g', { tabindex: 0, role: 'button', class: 'rvot-seg', 'data-rvot-segment': seg.id, 'data-level': seg.level,
      'data-absent': absent, 'aria-pressed': segment === seg.id, 'aria-label': `${T.segments[seg.id].name}${absent ? ` · ${T.absentShort}` : ''}` });
    group.append(s(doc, 'title', {}, T.segments[seg.id].name), s(doc, 'path', { d: arcPath(seg.from, seg.to, r1, r2), class: 'rvot-seg-arc' }));
    const [lx, ly] = polar((seg.from + seg.to) / 2, (r1 + r2) / 2);
    group.append(s(doc, 'text', { x: lx, y: ly + 4, class: 'rvot-seg-label', 'text-anchor': 'middle' }, absent ? '–' : seg.short));
    group.addEventListener('click', () => onSegment(seg.id));
    group.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSegment(seg.id); } });
    svg.append(group);
  }
}

const seg = (name, neighbour, surface, procedure, device, figures) => ({ name, neighbour, surface, procedure, device, figures });
export const RVOT_SEGMENT_TEXT = {
  tr: {
    view: 'RVOT SEGMENTLERİ',
    title: 'RVOT segmentleri · üstten bakış',
    intro: 'RVOT düz bir tüp değil; pulmoner kökü kaldıran konik bir yapıdır. Yüksek (subpulmoner) düzeyde serbest duvar 5 segmentle kökü çevreler; 6. segment olan septal duvar daha aşağıda, mediyal ve posterior serbest duvarın altındadır. Her segmentin bir komşusu ve kendine özgü işlem riski vardır. Bir segmente tıkla.',
    root: 'Merkez: pulmoner kök (r, l, n sinüsleri)', compass: 'ön ↑ · hasta sağı →', levelNote: 'Kesikli dış yay: septal duvar, daha alt düzeyde',
    absentShort: 'bu kalpte yok',
    neighbours: { chest: 'ön göğüs duvarı · V2 (sol parasternal)', aorta: 'aort kökü', rca: 'sağ AV oluk · RCA', lad: 'ön IV oluk · LAD, AIV, S1', summit: 'LV summit', lvot: 'LVOT ↙' },
    fields: { neighbour: 'Komşu', surface: 'Endokard yüzeyi', procedure: 'Ablasyon', device: 'Cihaz / ileti sistemi', figures: 'Şekil' },
    variantTitle: 'Posterior serbest duvar',
    variants: { present: 'Var · “yükselmiş infundibulum”', absent: 'Yok · pulmoner kök LV summit ile devamlı' },
    variantNote: {
      present: 'İnce fibroadipöz doku posterior serbest duvarı LV summit’ten ayırır. LV summit’in septal kenarına RVOT’un posterior serbest duvarından ulaşılabilir; burası mediyal duvarla birlikte perforasyon riski taşıyan ikinci bölgedir.',
      absent: 'Ara doku planı yok; sol komşu pulmoner sinüsü destekleyen miyokardiyal hilal doğrudan LV summit’e tutunur. Septal kenara sol komşu sinüsün tabanından (“candy cane” yaklaşımı) ulaşılır; ara doku olmadığı için enerji daha etkili lezyon yapabilir. Ross işleminde otogreft alımı zorlaşabilir.'
    },
    general: [
      'Pulmoner kök 3 sinüs (r: sağ komşu, l: sol komşu, n: komşu olmayan) ve her sinüsün tabanında miyokardiyal hilal içerir; kapak üstü “candy cane” ablasyonunun substratı budur. Hilallerin arasındaki 3 interleaflet üçgenin tabanına yönelik ablasyonda ince yaprakçıkları korumak için kapak altından yaklaşılır; ICE bu ayrıntıları tanımaya yardım eder.',
      'Sağ-arka RVOT endokardı düzdür (supraventriküler krista): boşluksuz haritalanır ama kateter zor sabitlenir. Sol-ön RVOT trabekülerdir: kateter girintilere sıkışabilir; steam pop ve perforasyon riski artar, boşluksuz ablasyon zorlaşır.',
      'Endokardiyal çıkış, intramural kaynaktan bir segment uzakta olabilir; septal koroner ven haritalaması ve ven veya summit yaklaşımları endokardiyal ablasyonun başarısız olduğu yerde işe yarayabilir (Aronis).',
      'Odaksal pulsed field ablasyonda başlıca güvenlik sorunu termal değil vaskülerdir: koroner artere yaklaşık 5 mm içinde enerji geçici koroner spazm yapmıştır. Çıkış yolunda işlemden önce koroner değerlendirme önerilir (Aronis).'
    ],
    segments: {
      anterior: seg('Anterior serbest duvar', 'Ön göğüs duvarı; sol sternal kenarın arkası, V2 (4. interkostal aralık) bu bölgeye yakın ama bireysel farklılık büyük.', 'Sol-ön RVOT trabeküler; epikardiyal yağ genellikle ince ve değişken.', 'Brugada sendromunda epikardiyal substrat bu ön duvardadır; yağın kalınlığı epikardiyal haritalamayı etkiler. Kapak düzeyinde n–r interleaflet üçgeninin altına uzanır.', 'Anterior ve mediyal serbest duvar RVOT’un en ince duvarlarıdır; fiksasyon vidası derinliği ve perforasyon riski segment segment değerlendirilir.', 'Şekil 1, 3, 4, 13'),
      lateral: seg('Lateral serbest duvar', 'Sağ atriyoventriküler oluk; kalın epikardiyal yağ, proksimal RCA ve konus dalı.', 'Sağ-arka yüzeye geçişte düzleşir.', 'r sinüsünün en alt noktasının (nadir) altına uzanır. Komşu RCA ve konus dalı nedeniyle enerji öncesi koroner mesafe izlenir.', 'Düz çıkış yolu leadless pacemaker için zayıf tutunma sağlar; yer değiştirme riski.', 'Şekil 1, 4, 5'),
      posterolateral: seg('Posterolateral serbest duvar', 'Sağ koroner aort sinüsü (RCC); arada ince fibroadipöz doku. RCA bu duvarın lateralinden çıkar.', 'Düz; supraventriküler krista ile aynı yapı. Boşluksuz haritalanır, kateter zor sabitlenir.', 'Bu duvardan kaynaklanan aritmiler teknik olarak sağ koroner sinüsten de ablate edilebilir. r–l interleaflet üçgeninin altına uzanır.', 'Supraventriküler krista pulmoner kapağı triküspit kapaktan yükseltir.', 'Şekil 4, 5, 6, 9'),
      posterior: seg('Posterior serbest duvar', 'LV summit’in septal kenarı; R–L aort interleaflet üçgenine yakın. Kısa bir duvardır.', 'Değişken; bazı kalplerde hiç yoktur (aşağıdaki varyant).', 'LV summit’e giden yol: summit’in septal kenarına bu duvardan ulaşılabilir. Yükselmiş infundibulum mediyal duvardan sonra ikinci perforasyon riski bölgesidir. l sinüsünün nadirinin altına uzanır.', 'Varyant, LV summit septal kenarına hangi yoldan ulaşılacağını değiştirir.', 'Şekil 7, 10, 11, 12'),
      medial: seg('Mediyal serbest duvar', 'Ön interventriküler oluk: LAD, ön interventriküler ven (AIV) ve ilk septal perforatör.', 'İnce ve trabeküler.', 'Perforasyon ve LAD’de termal/mekanik hasar riski en yüksek bölge. Koroner mesafe izlenir; pulsed field ablasyonda vasküler risk öne çıkar. n sinüsünün nadirinin altına uzanır.', 'En ince duvarlardan; aktif fiksasyon derinliği dikkat ister.', 'Şekil 4, 6, 8'),
      septal: seg('Septal duvar', 'LVOT; septal duvar RVOT’un posteroinferiorundadır ve LV bazal anteroseptal segmentinin sağ yüzüne karşılık gelir.', 'Septomarginal trabekülasyon ile aynı yapı; distalde moderatör bandı, proksimalde mediyal papiller kası verir.', 'Proksimal sağ dal septomarginal trabekülasyondadır: bu segmentte ablasyon sağ dal bloğu yapabilir. İlk septal dal mediyal serbest duvar ile septal duvar sınırından girer; septal arterler ve venler intramural haritalama ve ablasyon için kanal olabilir.', 'Membranöz septum ve mediyal papiller kas ileti eksenini gösterir: septal lead yerleşimi ve ileti sistemi pacing’i için önemli. Apikal trabeküller leadless pacemaker’ı sabitler, düz çıkış yolu sabitlemez.', 'Şekil 2, 6, 8, 9')
    },
    sites: { 'rvot-free': 'RVOT serbest duvar örneği bu görünümde anterior, lateral ve posterolateral segmentlere karşılık gelir.', 'rvot-septal': 'RVOT septal örneği septal duvar ile mediyal/posterior serbest duvar sınırına karşılık gelir.', 'lv-summit': 'LV summit, posterior serbest duvarın komşusudur; septal kenarına RVOT’tan veya sol komşu pulmoner sinüsten ulaşılabilir.' },
    note: 'Özgün şematik çizim; açılar ve kalınlıklar ölçülmüş değildir. Miyazaki ve ark. (2026) ile Aronis (2026) editoryalinden özetlenmiştir; kaynak şekilleri kopyalanmadı.'
  },
  en: {
    view: 'RVOT SEGMENTS',
    title: 'RVOT segments · superior view',
    intro: 'The RVOT is not a simple tube but a cone that lifts the pulmonary root. At the high subpulmonary level the free wall encircles the root in 5 segments; the 6th, the septal wall, lies lower, beneath the medial and posterior free walls. Each segment has a neighbour and its own procedural risk. Click a segment.',
    root: 'Centre: pulmonary root (r, l, n sinuses)', compass: 'ant ↑ · patient right →', levelNote: 'Dashed outer arc: septal wall, at a lower level',
    absentShort: 'absent in this heart',
    neighbours: { chest: 'anterior chest wall · V2 (left parasternal)', aorta: 'aortic root', rca: 'right AV groove · RCA', lad: 'AIV groove · LAD, AIV, S1', summit: 'LV summit', lvot: 'LVOT ↙' },
    fields: { neighbour: 'Neighbour', surface: 'Endocardial surface', procedure: 'Ablation', device: 'Devices / conduction', figures: 'Figure' },
    variantTitle: 'Posterior free wall',
    variants: { present: 'Present · “elevated infundibulum”', absent: 'Absent · pulmonary root continuous with LV summit' },
    variantNote: {
      present: 'A thin fibroadipose plane separates the posterior free wall from the LV summit. The septal margin of the LV summit can be approached from the posterior free wall of the RVOT; with the medial wall, this is the second region of perforation risk.',
      absent: 'No intervening tissue plane; the myocardial crescent supporting the left adjacent pulmonary sinus attaches directly to the LV summit. The septal margin is approached from the bottom of the left adjacent sinus (candy-cane approach); without intervening tissue, energy can create lesions more effectively. Harvesting the pulmonary autograft for a Ross procedure can be challenging.'
    },
    general: [
      'The pulmonary root has 3 sinuses (r: right adjacent, l: left adjacent, n: nonadjacent), each supported by a myocardial crescent, the substrate of supravalvular candy-cane ablation. Ablation at the base of the 3 interleaflet triangles between them needs a subvalvular approach to protect the thin leaflets; ICE helps recognize these details.',
      'The right posterior RVOT endocardium is smooth (supraventricular crest): it maps without gaps but catheters are hard to stabilize. The left anterior RVOT is trabeculated: catheters can be trapped in recesses, raising steam pop and perforation risk and making gapless ablation difficult.',
      'An endocardial breakout can lie a full segment away from an intramural origin; septal coronary venous mapping and venous or summit approaches can succeed where endocardial ablation alone does not (Aronis).',
      'With focal pulsed field ablation the main safety concern is vascular rather than thermal: energy within about 5 mm of a coronary artery has produced transient spasm. Coronary assessment before treating the outflow tract is recommended (Aronis).'
    ],
    segments: {
      anterior: seg('Anterior free wall', 'Anterior chest wall, behind the left sternal border; V2 (4th intercostal space) lies near this region with wide individual variation.', 'Left anterior RVOT is trabeculated; epicardial fat is generally thin and variable.', 'The epicardial substrate of Brugada syndrome lies on this anterior wall; fat thickness affects epicardial mapping. At valve level it extends beneath the n–r interleaflet triangle.', 'Anterior and medial free walls are the thinnest in the RVOT; fixation-helix depth and perforation risk are judged segment by segment.', 'Figs. 1, 3, 4, 13'),
      lateral: seg('Lateral free wall', 'Right atrioventricular groove: thick epicardial fat, proximal RCA and conus branch.', 'Becomes smooth toward the right posterior surface.', 'Extends beneath the nadir of the r sinus. With the RCA and conus branch nearby, track coronary distance before energy delivery.', 'The smooth outflow gives a leadless pacemaker little purchase; dislodgement risk.', 'Figs. 1, 4, 5'),
      posterolateral: seg('Posterolateral free wall', 'Right coronary aortic sinus (RCC) across a thin fibroadipose plane; the RCA emerges lateral to this wall.', 'Smooth; identical to the supraventricular crest. Maps without gaps, catheters are hard to stabilize.', 'Arrhythmias from this wall can technically be ablated from the right coronary sinus. Extends beneath the r–l interleaflet triangle.', 'The supraventricular crest elevates the pulmonary valve away from the tricuspid valve.', 'Figs. 4, 5, 6, 9'),
      posterior: seg('Posterior free wall', 'Septal margin of the LV summit, close to the R–L aortic interleaflet triangle. A short wall.', 'Variable; absent in some hearts (variant below).', 'A route to the LV summit: its septal margin can be approached from this wall. The elevated infundibulum is the second perforation-risk region after the medial wall. Extends beneath the nadir of the l sinus.', 'The variant changes the route to the septal margin of the LV summit.', 'Figs. 7, 10, 11, 12'),
      medial: seg('Medial free wall', 'Anterior interventricular groove: LAD, anterior interventricular vein (AIV) and first septal perforator.', 'Thin and trabeculated.', 'Highest risk of perforation and thermal/mechanical LAD injury. Track coronary distance; with pulsed field ablation the vascular risk dominates. Extends beneath the nadir of the n sinus.', 'Among the thinnest walls; active fixation depth needs care.', 'Figs. 4, 6, 8'),
      septal: seg('Septal wall', 'LVOT; the septal wall is posteroinferior to the RVOT and corresponds to the right side of the LV basal anteroseptal segment.', 'Identical to the septomarginal trabeculation; gives rise to the moderator band distally and the medial papillary muscle proximally.', 'The proximal right bundle runs in the septomarginal trabeculation: ablation here risks right bundle branch block. The first septal branch enters at the border between the medial free wall and septal wall; septal arteries and veins can serve intramural mapping and ablation.', 'The membranous septum and medial papillary muscle mark the conduction axis: relevant to septal lead placement and conduction system pacing. Apical trabeculations anchor a leadless pacemaker; the smooth outflow does not.', 'Figs. 2, 6, 8, 9')
    },
    sites: { 'rvot-free': 'In this view the RVOT free-wall example corresponds to the anterior, lateral and posterolateral segments.', 'rvot-septal': 'The septal RVOT example corresponds to the septal wall at the border of the medial/posterior free walls.', 'lv-summit': 'The LV summit neighbours the posterior free wall; its septal margin is reached from the RVOT or the left adjacent pulmonary sinus.' },
    note: 'Original schematic; angles and thicknesses are not measured. Summarized from Miyazaki et al. (2026) and the Aronis (2026) editorial; source figures are not reproduced.'
  }
};

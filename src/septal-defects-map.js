import { DEFECT_TYPES } from './septal-defects-data.js';

const NS = 'http://www.w3.org/2000/svg';
export const MAP_WORDS = {
  tr: { ra: 'Sağ atriyumdan şematik görünüm', rv: 'Sağ ventrikülden şematik görünüm', scale: 'Konum şeması; ölçekli değildir', svc: 'SVC', ivc: 'IVC', rupv: 'Sağ üst PV', fossa: 'Fossa ovalis', limbus: 'Limbus', tv: 'Triküspit anülüs', csOstium: 'KS ostiyumu', eustachian: 'Eustachian valf', sup: 'Süp', ant: 'Ant', inlet: 'TV (giriş)', pv: 'Pulmoner kapak', aorta: 'Aort kökü (arkada)', membranous: 'Membranöz septum', moderator: 'Moderatör bant', trabecular: 'Trabeküler septum', crest: 'Supraventriküler krista', antPap: 'Ön papiller', left: 'Sol' },
  en: { ra: 'Schematic right atrial view', rv: 'Schematic right ventricular view', scale: 'Location diagram; not to scale', svc: 'SVC', ivc: 'IVC', rupv: 'Right upper PV', fossa: 'Oval fossa', limbus: 'Limbus', tv: 'Tricuspid annulus', csOstium: 'CS ostium', eustachian: 'Eustachian valve', sup: 'Sup', ant: 'Ant', inlet: 'TV (inlet)', pv: 'Pulmonary valve', aorta: 'Aortic root (behind)', membranous: 'Membranous septum', moderator: 'Moderator band', trabecular: 'Trabecular septum', crest: 'Supraventricular crest', antPap: 'Ant. papillary', left: 'Left' },
};

/**
 * Authored schematic placements (viewBox 0 0 290 248), not measured anatomy.
 * Atrial map: right lateral view of the opened RA, superior up, anterior to
 * the right. Fossa central, limbus a horseshoe open toward the IVC, tricuspid
 * orifice anteroinferior, CS ostium between the IVC and the tricuspid orifice
 * one septal isthmus from it, primum defect on the AV valve margin.
 */
const SITES = {
  'asd-secundum': { x: 122, y: 116 },
  'asd-primum': { x: 166, y: 150 },
  'asd-sinus-superior': { x: 112, y: 54 },
  'asd-sinus-inferior': { x: 85, y: 194 },
  'asd-coronary-sinus': { x: 146, y: 196, rx: 17, ry: 9 },
  // Ventricular map: RV opened from the front, superior up, patient's left
  // to the right. Perimembranous between the septomarginal limbs under the
  // crest (aortic root behind), inlet beneath the septal tricuspid leaflet,
  // outlet directly under the pulmonary valve above the crest, muscular in
  // the trabecular septum.
  'vsd-perimembranous': { x: 128, y: 102 },
  'vsd-muscular': { x: 112, y: 182 },
  'vsd-inlet': { x: 84, y: 128 },
  'vsd-outlet': { x: 188, y: 62 },
};

function svg(tag, attrs, text) {
  const out = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) out.setAttribute(key, String(value));
  if (text != null) out.textContent = text;
  return out;
}

function atrialLandmarks(map, w) {
  const label = (x, y, text, anchor = 'middle') => map.append(svg('text', { x, y, 'text-anchor': anchor }, text));
  map.append(svg('path', { d: 'M107 38 C63 49 48 91 54 139 C56 186 90 218 139 220 C193 219 216 182 218 135 C220 89 194 49 158 41 Z', class: 'defect-map-tissue' }));
  // Caval veins: SVC superior (slightly posterior), IVC posteroinferior.
  map.append(svg('path', { d: 'M100 12 L100 48 M124 12 L124 46 M72 200 L72 238 M98 202 L98 238', class: 'defect-map-vessel' }));
  map.append(svg('path', { d: 'M34 72 Q70 68 104 58', class: 'defect-map-vessel defect-map-vessel-thin' }));
  // Tricuspid orifice: anteroinferior, inside the atrial outline.
  map.append(svg('ellipse', { cx: 194, cy: 170, rx: 24, ry: 34, class: 'defect-map-orifice' }));
  // Oval fossa and its limbus: a horseshoe over the superior, anterior and
  // posterior margins, open inferiorly toward the IVC.
  map.append(svg('ellipse', { cx: 122, cy: 116, rx: 28, ry: 36, class: 'defect-map-fossa' }));
  map.append(svg('path', { d: 'M90.8 138 A36 44 0 1 1 153.2 138', class: 'defect-map-limbus' }));
  // Eustachian valve guards the IVC mouth and runs toward the CS ostium,
  // which sits between the IVC and the tricuspid orifice.
  map.append(svg('path', { d: 'M98 206 Q118 216 136 204', class: 'defect-map-valve' }));
  map.append(svg('ellipse', { cx: 146, cy: 196, rx: 11, ry: 8, class: 'defect-map-sinus' }));
  label(112, 9, w.svc); label(85, 247, w.ivc); label(8, 64, w.rupv, 'start'); label(118, 170, w.fossa);
  label(152, 70, w.limbus, 'start'); label(246, 126, w.tv); label(150, 224, w.csOstium); label(104, 238, w.eustachian, 'start');
  // Orientation.
  map.append(svg('path', { d: 'M246 238 L246 220 M246 238 L264 238', class: 'defect-map-axis' }));
  map.append(svg('text', { x: 246, y: 216, 'text-anchor': 'middle', class: 'defect-map-axis-label' }, w.sup));
  map.append(svg('text', { x: 267, y: 241, 'text-anchor': 'start', class: 'defect-map-axis-label' }, w.ant));
}

function ventricularLandmarks(map, w) {
  const label = (x, y, text, anchor = 'middle') => map.append(svg('text', { x, y, 'text-anchor': anchor }, text));
  map.append(svg('path', { d: 'M79 79 Q128 45 192 40 Q236 79 221 149 Q198 216 143 227 Q84 207 59 149 Q48 114 79 79 Z', class: 'defect-map-tissue' }));
  // Aortic root behind the membranous septum (seen through the crest region).
  map.append(svg('ellipse', { cx: 128, cy: 92, rx: 27, ry: 19, class: 'defect-map-fossa' }));
  map.append(svg('ellipse', { cx: 128, cy: 102, rx: 13, ry: 10, class: 'defect-map-membranous' }));
  // Septomarginal trabeculation: body down the septum, limbs clasping the
  // supraventricular crest; moderator band to the anterior papillary muscle.
  map.append(svg('path', { d: 'M104 88 Q126 112 132 140 L128 200 M176 78 Q150 104 132 140 M128 175 L204 162', class: 'defect-map-band' }));
  map.append(svg('path', { d: 'M104 88 Q140 60 176 78', class: 'defect-map-crest' }));
  map.append(svg('ellipse', { cx: 212, cy: 160, rx: 9, ry: 14, class: 'defect-map-papillary' }));
  // Tricuspid (inlet) and pulmonary (outlet) valves.
  map.append(svg('path', { d: 'M56 134 Q60 86 104 76', class: 'defect-map-junction' }));
  map.append(svg('path', { d: 'M160 46 Q190 28 216 56', class: 'defect-map-junction defect-map-outflow' }));
  map.append(svg('path', { d: 'M104 62 L118 92', class: 'defect-map-leader' }));
  label(4, 100, w.inlet, 'start'); label(200, 22, w.pv); label(92, 40, w.crest);
  label(60, 58, w.membranous, 'start'); label(168, 116, w.aorta, 'start');
  label(142, 202, w.moderator, 'start'); label(224, 140, w.antPap, 'start'); label(150, 242, w.trabecular);
  map.append(svg('path', { d: 'M246 238 L246 220 M246 238 L264 238', class: 'defect-map-axis' }));
  map.append(svg('text', { x: 246, y: 216, 'text-anchor': 'middle', class: 'defect-map-axis-label' }, w.sup));
  map.append(svg('text', { x: 267, y: 241, 'text-anchor': 'start', class: 'defect-map-axis-label' }, w.left));
}

/** Schematic septal map: all sites of the family, the selected one opened. */
export function defectMap(item, lang) {
  const w = MAP_WORDS[lang];
  const atrial = item.family === 'asd';
  const map = svg('svg', { viewBox: '0 0 290 248', role: 'img', 'aria-label': `${atrial ? w.ra : w.rv}: ${item.title[lang]}. ${w.scale}.` });
  if (atrial) atrialLandmarks(map, w); else ventricularLandmarks(map, w);
  for (const sibling of DEFECT_TYPES.filter(other => other.family === item.family && other.id !== item.id)) {
    const s = SITES[sibling.id];
    map.append(svg('ellipse', { cx: s.x, cy: s.y, rx: s.rx || 11, ry: s.ry || 11, class: 'defect-map-site' }));
    map.append(svg('text', { x: s.x, y: s.y + 3, 'text-anchor': 'middle', class: 'defect-map-code' }, sibling.mark));
  }
  const s = SITES[item.id];
  map.append(svg('ellipse', { cx: s.x, cy: s.y, rx: (s.rx || 13) + 5, ry: (s.ry || 13) + 5, class: 'defect-map-glow' }));
  map.append(svg('ellipse', { cx: s.x, cy: s.y, rx: s.rx || 13, ry: s.ry || 13, class: 'defect-map-hole' }));
  map.append(svg('text', { x: s.x, y: s.y + 3.5, 'text-anchor': 'middle', class: 'defect-map-code selected' }, item.mark));
  return map;
}

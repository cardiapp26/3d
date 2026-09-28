import { DEFECT_TYPES } from './septal-defects-data.js';

const NS = 'http://www.w3.org/2000/svg';
export const MAP_WORDS = {
  tr: { ra: 'Sağ atriyumdan şematik görünüm', rv: 'Sağ ventrikülden şematik görünüm', scale: 'Konum şeması; ölçekli değildir', svc: 'SVC', ivc: 'IVC', rupv: 'Sağ üst PV', fossa: 'Fossa ovalis', limbus: 'Limbus', tv: 'Triküspit anülüs', csOstium: 'KS ostiyumu', inlet: 'TV (giriş)', pv: 'Pulmoner kapak', aorta: 'Aort kökü (arkada)', membranous: 'Membranöz', moderator: 'Moderatör bant', trabecular: 'Trabeküler septum' },
  en: { ra: 'Schematic right atrial view', rv: 'Schematic right ventricular view', scale: 'Location diagram; not to scale', svc: 'SVC', ivc: 'IVC', rupv: 'Right upper PV', fossa: 'Oval fossa', limbus: 'Limbus', tv: 'Tricuspid annulus', csOstium: 'CS ostium', inlet: 'TV (inlet)', pv: 'Pulmonary valve', aorta: 'Aortic root (behind)', membranous: 'Membranous', moderator: 'Moderator band', trabecular: 'Trabecular septum' },
};

/** Authored schematic placements (viewBox 0 0 290 248), not measured anatomy. */
const SITES = {
  'asd-secundum': { x: 136, y: 119 },
  'asd-primum': { x: 168, y: 168 },
  'asd-sinus-superior': { x: 112, y: 58 },
  'asd-sinus-inferior': { x: 98, y: 186 },
  'asd-coronary-sinus': { x: 190, y: 200, rx: 17, ry: 9 },
  'vsd-perimembranous': { x: 128, y: 100 },
  'vsd-muscular': { x: 112, y: 182 },
  'vsd-inlet': { x: 84, y: 126 },
  'vsd-outlet': { x: 186, y: 64 },
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
  map.append(svg('path', { d: 'M96 17 L96 52 M120 17 L120 48 M77 186 L77 228 M102 200 L102 228', class: 'defect-map-vessel' }));
  map.append(svg('path', { d: 'M40 78 Q72 74 100 66', class: 'defect-map-vessel defect-map-vessel-thin' }));
  map.append(svg('ellipse', { cx: 136, cy: 119, rx: 33, ry: 44, class: 'defect-map-fossa' }));
  map.append(svg('path', { d: 'M104 104 A33 44 0 0 1 168 104', class: 'defect-map-limbus' }));
  map.append(svg('path', { d: 'M196 62 Q252 128 200 214', class: 'defect-map-junction' }));
  map.append(svg('ellipse', { cx: 190, cy: 200, rx: 11, ry: 8, class: 'defect-map-sinus' }));
  label(108, 13, w.svc); label(87, 243, w.ivc); label(36, 66, w.rupv, 'start'); label(136, 152, w.fossa);
  label(172, 86, w.limbus, 'start'); label(236, 245, w.tv); label(196, 224, w.csOstium);
}

function ventricularLandmarks(map, w) {
  const label = (x, y, text, anchor = 'middle') => map.append(svg('text', { x, y, 'text-anchor': anchor }, text));
  map.append(svg('path', { d: 'M79 79 Q128 45 192 40 Q236 79 221 149 Q198 216 143 227 Q84 207 59 149 Q48 114 79 79 Z', class: 'defect-map-tissue' }));
  map.append(svg('path', { d: 'M108 84 Q128 108 132 140 L128 200 M180 70 Q150 100 132 140 M128 175 L205 160', class: 'defect-map-band' }));
  map.append(svg('ellipse', { cx: 150, cy: 84, rx: 16, ry: 11, class: 'defect-map-fossa' }));
  map.append(svg('ellipse', { cx: 128, cy: 100, rx: 13, ry: 10, class: 'defect-map-membranous' }));
  map.append(svg('path', { d: 'M56 134 Q60 84 112 72', class: 'defect-map-junction' }));
  map.append(svg('path', { d: 'M160 46 Q190 28 216 56', class: 'defect-map-junction defect-map-outflow' }));
  label(36, 44, w.inlet, 'start'); label(200, 22, w.pv); label(126, 62, w.aorta);
  label(166, 104, w.membranous, 'start'); label(214, 150, w.moderator, 'start'); label(150, 240, w.trabecular);
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

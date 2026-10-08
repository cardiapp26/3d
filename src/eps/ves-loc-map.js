import { VES_REGIONS } from './ves-loc-model.js';

// Two original anatomical schematics for the PVC workbook. Basal view: the
// ventricular base seen from above with the atria removed, anterior up and
// the patient's right on the viewer's left. Cutaway: a long-axis section with
// the RV on the viewer's left. Drawn by hand for teaching; nothing here is
// registered to the 3D atlas or to patient imaging.
const NS = 'http://www.w3.org/2000/svg';
/** Basal view rendered from the app's own 3D heart (scripts/eps/render-ves-atlas.cjs). */
const BASAL_3D = new URL('./assets/ves-basal-3d.webp', import.meta.url).href;
const BASAL_3D_SIZE = [720, 731];
// Image-pixel hotspots of the basal teaching regions on that render; the script prints
// projected starting points, these are hand-adjusted onto the structures.
const BASAL_3D_SITES = Object.freeze({ 'rvot-septal': [452, 246], 'rvot-free': [236, 148], 'lvot-cusp': [468, 392], 'lv-summit': [292, 332], 'para-his': [577, 372], tricuspid: [636, 466], mitral: [334, 578], crux: [548, 586] });
const BASAL_3D_LABELS = Object.freeze([[330, 118, 'PV'], [470, 456, 'Ao'], [678, 410, 'TA'], [410, 690, 'MA'], [600, 348, 'His'], [600, 598, 'CS'], [214, 440, 'LAD'], [120, 520, 'GCV'], [690, 700, 'R'], [30, 700, 'L']]);
const s = (doc, tag, attrs = {}, text = '') => {
  const node = doc.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (text !== '') node.textContent = text;
  return node;
};
const polar = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];
const arc = (cx, cy, r, from, to) => {
  const [x0, y0] = polar(cx, cy, r, from), [x1, y1] = polar(cx, cy, r, to);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};
let uidCounter = 0;

/** Shared gradients and the marker shadow; ids are unique per rendered SVG. */
function defs(doc, uid) {
  const d = s(doc, 'defs');
  const stops = (id, list, radial = false) => {
    const g = s(doc, radial ? 'radialGradient' : 'linearGradient', radial ? { id, cx: '50%', cy: '45%', r: '65%' } : { id, x1: 0, y1: 0, x2: 1, y2: 1 });
    for (const [offset, color, opacity = 1] of list) g.append(s(doc, 'stop', { offset, 'stop-color': color, 'stop-opacity': opacity }));
    d.append(g);
  };
  stops(`${uid}-myo`, [['0%', '#4a5f52'], ['100%', '#2a3b32']]);
  stops(`${uid}-cavity`, [['0%', '#10201a'], ['100%', '#0a1512']], true);
  stops(`${uid}-rvot`, [['0%', '#3e5547'], ['55%', '#2f4238'], ['100%', '#1f2f27']]);
  stops(`${uid}-root`, [['0%', '#2a3f36'], ['100%', '#14241d']], true);
  stops(`${uid}-vessel`, [['0%', '#f0a7a0'], ['100%', '#c96f68']]);
  const f = s(doc, 'filter', { id: `${uid}-shadow`, x: '-50%', y: '-50%', width: '200%', height: '200%' });
  f.append(s(doc, 'feDropShadow', { dx: 0, dy: 1.5, stdDeviation: 2, 'flood-color': '#000', 'flood-opacity': .55 }));
  d.append(f);
  const halo = s(doc, 'filter', { id: `${uid}-halo`, x: '-80%', y: '-80%', width: '260%', height: '260%' });
  halo.append(s(doc, 'feGaussianBlur', { stdDeviation: 4 }));
  d.append(halo);
  return d;
}

function label(doc, parent, x, y, text, cls = 'ves-map-caption', leader = null) {
  if (leader) parent.append(s(doc, 'line', { x1: leader[0], y1: leader[1], x2: x, y2: y, class: 'ves-map-lead' }));
  parent.append(s(doc, 'text', { x, y, class: cls }, text));
}

/** Basal valve plane: aorta in the centre, pulmonary valve anterior-left, tricuspid right, mitral left. */
function basalView(doc, g, uid, t) {
  const AO = [205, 135], AOR = 40, PV = [262, 58], PVR = 25, TA = [100, 214], MA = [268, 215];
  // Right ventricular outflow: wraps anterior to the aortic root from the tricuspid side to the pulmonary valve.
  g.append(s(doc, 'path', { d: 'M62 158 Q46 66 124 44 Q186 28 232 50 L240 74 Q200 78 176 98 Q152 120 150 148 Z', class: 'ves-map-rvot', fill: `url(#${uid}-rvot)` }));
  for (let i = 0; i < 5; i++) g.append(s(doc, 'path', { d: `M${74 + i * 6} ${150 - i * 14} Q${90 + i * 10} ${88 - i * 6} ${150 + i * 10} ${64 - i * 2}`, class: 'ves-map-fiber' }));
  // Annuli as fibrous rings with a thick myocardial margin.
  for (const [[cx, cy], rx, ry] of [[TA, 62, 66], [MA, 60, 62]]) {
    g.append(s(doc, 'ellipse', { cx, cy, rx: rx + 9, ry: ry + 9, class: 'ves-map-myo', fill: `url(#${uid}-myo)` }));
    g.append(s(doc, 'ellipse', { cx, cy, rx, ry, class: 'ves-map-cavity', fill: `url(#${uid}-cavity)` }));
    g.append(s(doc, 'ellipse', { cx, cy, rx, ry, class: 'ves-map-ring' }));
  }
  // Tricuspid: three leaflets closed in a Y; mitral: anterior and posterior leaflets, P1-P3 scallops.
  for (const deg of [-55, 65, 185]) { const [x, y] = polar(TA[0], TA[1], 58, deg); g.append(s(doc, 'line', { x1: TA[0], y1: TA[1], x2: x, y2: y, class: 'ves-map-leaflet' })); }
  g.append(s(doc, 'path', { d: 'M218 190 Q268 236 318 192', class: 'ves-map-leaflet' }));
  for (const deg of [50, 90, 130]) { const [x0, y0] = polar(MA[0], MA[1], 60, deg), [x1, y1] = polar(MA[0], MA[1], 52, deg); g.append(s(doc, 'line', { x1: x0, y1: y0, x2: x1, y2: y1, class: 'ves-map-leaflet' })); }
  label(doc, g, 236, 262, 'P1', 'ves-map-tiny'); label(doc, g, 268, 266, 'P2', 'ves-map-tiny'); label(doc, g, 302, 258, 'P3', 'ves-map-tiny');
  // Aorto-mitral continuity, the fibrous trigones and the central fibrous body.
  g.append(s(doc, 'path', { d: 'M178 170 Q205 184 236 168 L250 160 Q226 180 208 182 Q190 184 170 180 Z', class: 'ves-map-fibrous' }));
  g.append(s(doc, 'circle', { cx: 176, cy: 176, r: 5, class: 'ves-map-trigone' }), s(doc, 'circle', { cx: 244, cy: 165, r: 4.5, class: 'ves-map-trigone' }));
  // Aortic root: three sinuses with their commissures; the coronary ostia on RCC and LCC.
  g.append(s(doc, 'circle', { cx: AO[0], cy: AO[1], r: AOR + 8, class: 'ves-map-myo', fill: `url(#${uid}-myo)` }));
  g.append(s(doc, 'circle', { cx: AO[0], cy: AO[1], r: AOR, class: 'ves-map-root', fill: `url(#${uid}-root)` }));
  for (const [from, to] of [[-150, -30], [-30, 90], [90, 210]]) g.append(s(doc, 'path', { d: arc(AO[0], AO[1], AOR - 7, from + 6, to - 6), class: 'ves-map-cusp' }));
  for (const deg of [-30, 90, 210]) { const [x, y] = polar(AO[0], AO[1], AOR, deg); g.append(s(doc, 'line', { x1: AO[0], y1: AO[1], x2: x, y2: y, class: 'ves-map-commissure' })); }
  label(doc, g, 205, 112, 'RCC', 'ves-map-tiny'); label(doc, g, 226, 154, 'LCC', 'ves-map-tiny'); label(doc, g, 184, 154, 'NCC', 'ves-map-tiny');
  // Pulmonary valve, anterior and to the left of the aorta.
  g.append(s(doc, 'circle', { cx: PV[0], cy: PV[1], r: PVR + 6, class: 'ves-map-myo', fill: `url(#${uid}-myo)` }));
  g.append(s(doc, 'circle', { cx: PV[0], cy: PV[1], r: PVR, class: 'ves-map-root', fill: `url(#${uid}-root)` }));
  for (const deg of [-90, 30, 150]) { const [x, y] = polar(PV[0], PV[1], PVR, deg); g.append(s(doc, 'line', { x1: PV[0], y1: PV[1], x2: x, y2: y, class: 'ves-map-commissure' })); }
  // Coronary veins: CS from its os along the posterior mitral annulus, GCV up the lateral wall into the AIV; MCV from the crux.
  g.append(s(doc, 'path', { d: 'M172 288 Q232 322 300 292 Q358 262 354 190 Q350 132 310 106 Q294 96 284 90', class: 'ves-map-vein' }));
  g.append(s(doc, 'path', { d: 'M196 300 Q192 318 198 336', class: 'ves-map-vein' }));
  g.append(s(doc, 'ellipse', { cx: 172, cy: 288, rx: 7, ry: 5, class: 'ves-map-os' }));
  // Coronary arteries: RCA from the RCC ostium, in front of the RVOT base, around the tricuspid annulus to the crux; left main from the LCC to the LAD (anterior) and LCx (mitral annulus).
  for (const d of ['M190 100 Q126 102 74 136 Q20 180 28 250 Q58 322 142 320 Q172 316 188 302', 'M236 120 L280 100', 'M280 100 Q300 72 316 36', 'M280 100 Q328 126 334 188 Q336 232 310 266', 'M300 64 L324 90', 'M24 214 L10 218']) {
    g.append(s(doc, 'path', { d, class: 'ves-map-artery-shadow' }), s(doc, 'path', { d, class: 'ves-map-artery', stroke: `url(#${uid}-vessel)` }));
  }
  g.append(s(doc, 'circle', { cx: 190, cy: 100, r: 3, class: 'ves-map-ostium' }), s(doc, 'circle', { cx: 236, cy: 120, r: 3, class: 'ves-map-ostium' }));
  // Conduction: compact AV node/His at the apex of Koch's triangle beside the central fibrous body.
  g.append(s(doc, 'path', { d: 'M164 172 L168 162 L174 170', class: 'ves-map-his-line' }), s(doc, 'circle', { cx: 168, cy: 166, r: 5, class: 'ves-map-his' }));
  // Labels.
  label(doc, g, 116, 96, 'RVOT', 'ves-map-label'); label(doc, g, 262, 60, 'PV', 'ves-map-label');
  label(doc, g, 100, 216, 'TA', 'ves-map-label'); label(doc, g, 268, 216, 'MA', 'ves-map-label'); label(doc, g, 205, 136, 'Ao', 'ves-map-label');
  label(doc, g, 146, 158, 'His', 'ves-map-caption'); label(doc, g, 150, 306, 'CS os', 'ves-map-caption', [166, 292]);
  label(doc, g, 330, 30, 'LAD', 'ves-map-caption', [316, 38]); label(doc, g, 318, 290, 'LCx', 'ves-map-caption', [312, 268]);
  label(doc, g, 26, 160, 'RCA', 'ves-map-caption', [58, 160]); label(doc, g, 334, 318, 'CS', 'ves-map-caption', [304, 292]);
  label(doc, g, 222, 336, 'MCV', 'ves-map-caption'); label(doc, g, 352, 150, 'GCV', 'ves-map-caption', [352, 170]);
  label(doc, g, 183, 28, t.base, 'ves-map-title');
  label(doc, g, 22, 334, 'R', 'ves-map-axis'); label(doc, g, 346, 334, 'L', 'ves-map-axis'); label(doc, g, 183, 46, 'ANT', 'ves-map-axis'); label(doc, g, 110, 336, 'POST', 'ves-map-axis');
}

/** Long-axis cutaway: RV on the viewer's left, LV on the right, apex down. */
function cutawayView(doc, g, uid, t) {
  // Epicardium and the two cavities; the septum is the myocardium between them.
  g.append(s(doc, 'path', { d: 'M440 96 Q412 190 470 282 Q530 348 616 336 Q738 314 748 188 Q754 70 660 54 Q588 44 548 60 Q490 66 440 96 Z', class: 'ves-map-myo', fill: `url(#${uid}-myo)` }));
  g.append(s(doc, 'path', { d: 'M466 118 Q440 198 496 272 Q536 304 574 290 Q560 232 566 162 Q568 120 554 98 Q506 92 466 118 Z', class: 'ves-map-cavity', fill: `url(#${uid}-cavity)` }));
  g.append(s(doc, 'ellipse', { cx: 656, cy: 198, rx: 62, ry: 106, class: 'ves-map-cavity', fill: `url(#${uid}-cavity)` }));
  for (let i = 0; i < 7; i++) g.append(s(doc, 'path', { d: `M${580 + i} ${120 + i * 26} q6 6 0 12`, class: 'ves-map-fiber' }));
  // RV trabeculae and the moderator band running from the septum to the anterior papillary muscle.
  for (const d of ['M480 150 q10 8 0 16', 'M470 200 q12 6 0 14', 'M498 236 q10 6 0 12', 'M520 262 q10 6 0 12']) g.append(s(doc, 'path', { d, class: 'ves-map-trabecula' }));
  g.append(s(doc, 'path', { d: 'M566 206 Q520 228 476 262', class: 'ves-map-muscle' }));
  g.append(s(doc, 'path', { d: 'M460 250 Q470 238 484 250 Q486 270 470 276 Q456 270 460 250 Z', class: 'ves-map-papillary' }));
  // Base: tricuspid and mitral annuli with leaflets, chordae to the two LV papillary muscles, outflow stubs.
  g.append(s(doc, 'path', { d: 'M470 96 L556 96', class: 'ves-map-ring' }), s(doc, 'path', { d: 'M476 96 Q492 128 506 132 M550 96 Q538 126 520 130', class: 'ves-map-leaflet' }));
  g.append(s(doc, 'path', { d: 'M606 96 L716 96', class: 'ves-map-ring' }), s(doc, 'path', { d: 'M608 96 Q626 150 646 160 M714 96 Q704 140 684 150', class: 'ves-map-leaflet' }));
  g.append(s(doc, 'path', { d: 'M632 300 Q648 262 666 248 Q676 268 668 292 Q654 310 632 300 Z', class: 'ves-map-papillary' }));
  g.append(s(doc, 'path', { d: 'M716 228 Q702 196 690 180 Q676 198 684 222 Q700 236 716 228 Z', class: 'ves-map-papillary' }));
  for (const d of ['M646 160 L660 248', 'M652 160 L666 248', 'M684 150 L690 180', 'M678 150 L688 180']) g.append(s(doc, 'path', { d, class: 'ves-map-chordae' }));
  g.append(s(doc, 'path', { d: 'M578 96 Q584 70 582 46 Q594 36 610 44 Q608 70 608 96 Z', class: 'ves-map-outflow' }), s(doc, 'path', { d: 'M468 96 Q462 70 466 48 Q480 36 494 46 Q492 70 492 96 Z', class: 'ves-map-outflow' }));
  // Conduction system: His at the membranous septum; RBB to the moderator band; LBB splitting into anterior and posterior fascicles.
  g.append(s(doc, 'circle', { cx: 590, cy: 104, r: 5, class: 'ves-map-his' }));
  g.append(s(doc, 'path', { d: 'M586 108 Q574 160 566 206', class: 'ves-map-purkinje' }));
  g.append(s(doc, 'path', { d: 'M594 108 Q604 130 608 150', class: 'ves-map-purkinje' }));
  g.append(s(doc, 'path', { d: 'M608 150 Q640 160 684 180', class: 'ves-map-purkinje' }), s(doc, 'path', { d: 'M608 150 Q612 210 636 262', class: 'ves-map-purkinje' }));
  // Labels.
  label(doc, g, 500, 170, 'RV', 'ves-map-label'); label(doc, g, 660, 128, 'LV', 'ves-map-label'); label(doc, g, 618, 330, 'Apex', 'ves-map-caption');
  label(doc, g, 595, 66, 'Ao', 'ves-map-caption'); label(doc, g, 479, 66, 'PA', 'ves-map-caption');
  label(doc, g, 513, 84, 'TV', 'ves-map-tiny'); label(doc, g, 661, 84, 'MV', 'ves-map-tiny');
  label(doc, g, 586, 236, 'IVS', 'ves-map-tiny'); label(doc, g, 612, 122, 'His', 'ves-map-caption');
  label(doc, g, 520, 300, 'RBB', 'ves-map-tiny', [560, 214]); label(doc, g, 730, 160, 'LAF', 'ves-map-tiny', [700, 172]); label(doc, g, 730, 290, 'LPF', 'ves-map-tiny', [630, 250]);
  label(doc, g, 430, 300, 'Mod. band', 'ves-map-tiny', [478, 262]); label(doc, g, 700, 320, 'PM', 'ves-map-tiny', [660, 296]); label(doc, g, 740, 230, 'AL', 'ves-map-tiny', [714, 220]);
  label(doc, g, 568, 28, t.chambers, 'ves-map-title');
}

/** The 3D render as the basal background; markers follow BASAL_3D_SITES. */
function basal3dView(doc, g, t) {
  const [w, h] = BASAL_3D_SIZE;
  g.append(s(doc, 'rect', { x: 0, y: 0, width: w, height: h, rx: 24, class: 'ves-map-frame' }));
  g.append(s(doc, 'image', { href: BASAL_3D, x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'xMidYMid meet' }));
  for (const [x, y, text] of BASAL_3D_LABELS) label(doc, g, x, y, text, 'ves-map-caption ves-map-caption-3d');
  label(doc, g, w / 2, 34, `${t.base} · 3D`, 'ves-map-title ves-map-title-3d');
}

export function renderVesMap(doc, svg, { t, selected, candidates = [], onSelect, position = null, view = 'base', atlas3d = false }) {
  const uid = `vesmap${++uidCounter}`;
  const photo = view === 'base' && atlas3d;
  svg.replaceChildren(s(doc, 'title', {}, t.map), defs(doc, uid));
  svg.setAttribute('aria-label', `${t.map}: ${t[view]}${photo ? ' · 3D' : ''}`); svg.setAttribute('role', 'group');
  svg.setAttribute('viewBox', photo ? `0 0 ${BASAL_3D_SIZE[0]} ${BASAL_3D_SIZE[1]}` : view === 'base' ? '0 0 370 350' : '380 0 380 350');
  svg.setAttribute('data-ves-atlas', photo ? '3d' : 'svg');
  const scene = s(doc, 'g', { 'aria-hidden': 'true' });
  if (photo) basal3dView(doc, scene, t);
  else {
    scene.append(s(doc, 'rect', { x: 5, y: 5, width: 356, height: 339, rx: 16, class: 'ves-map-frame' }), s(doc, 'rect', { x: 382, y: 5, width: 371, height: 339, rx: 16, class: 'ves-map-frame' }));
    if (view === 'base') basalView(doc, scene, uid, t); else cutawayView(doc, scene, uid, t);
  }
  svg.append(scene);
  const scale = photo ? 2 : 1;   // the render's viewBox is about twice the schematic's
  for (const region of VES_REGIONS) {
    if (region.view !== view) continue;
    const [x, y] = photo ? BASAL_3D_SITES[region.id] : region.xy;
    const group = s(doc, 'g', { tabindex: 0, role: 'button', class: 'ves-map-site', 'data-ves-map-site': region.id,
      'aria-label': `${t.example}: ${t.sites[region.id].name}`, 'aria-pressed': selected === region.id,
      'data-candidate': candidates.includes(region.id) });
    group.append(s(doc, 'title', {}, t.sites[region.id].name),
      s(doc, 'circle', { cx: x, cy: y, r: 18 * scale, class: 'ves-map-halo', filter: `url(#${uid}-halo)` }),
      s(doc, 'circle', { cx: x, cy: y, r: 13 * scale, filter: `url(#${uid}-shadow)` }),
      s(doc, 'text', { x, y: y + 4 * scale, 'font-size': 12 * scale }, region.number));
    group.addEventListener('click', () => onSelect(region.id));
    group.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(region.id); } });
    svg.append(group);
    if (selected === region.id && position) {
      const offset = { near: [17, 8], adjacent: [30, -18], remote: [30, 27] }[position].map(v => v * scale);
      svg.append(s(doc, 'line', { x1: x + offset[0], y1: y + offset[1], x2: x + offset[0] + 14 * scale, y2: y + offset[1] - 22 * scale, class: 'ves-map-abl-shaft' }),
        s(doc, 'circle', { cx: x + offset[0], cy: y + offset[1], r: 5 * scale, class: 'ves-map-abl', 'data-ves-electrode': position }),
        s(doc, 'text', { x: x + offset[0], y: y + offset[1] + 17 * scale, class: photo ? 'ves-map-caption ves-map-caption-3d' : 'ves-map-caption' }, 'ABL'));
    }
  }
}

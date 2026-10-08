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
  // Aortic root: right, left and non-coronary sinuses with their commissures; coronary ostia in the R and L sinuses.
  g.append(s(doc, 'circle', { cx: AO[0], cy: AO[1], r: AOR + 8, class: 'ves-map-myo', fill: `url(#${uid}-myo)` }));
  g.append(s(doc, 'circle', { cx: AO[0], cy: AO[1], r: AOR, class: 'ves-map-root', fill: `url(#${uid}-root)` }));
  for (const [from, to] of [[-150, -30], [-30, 90], [90, 210]]) g.append(s(doc, 'path', { d: arc(AO[0], AO[1], AOR - 7, from + 6, to - 6), class: 'ves-map-cusp' }));
  for (const deg of [-30, 90, 210]) { const [x, y] = polar(AO[0], AO[1], AOR, deg); g.append(s(doc, 'line', { x1: AO[0], y1: AO[1], x2: x, y2: y, class: 'ves-map-commissure' })); }
  // Interleaflet triangles below each commissure: muscular between R and L, fibrous towards the
  // membranous septum (N-R) and the aorto-mitral curtain (L-N) (John et al., Heart Rhythm 2026).
  for (const [deg, cls] of [[-30, 'ves-map-ilt-muscle'], [90, 'ves-map-ilt-fibrous'], [210, 'ves-map-ilt-fibrous']]) {
    const [x0, y0] = polar(AO[0], AO[1], AOR - 2, deg), [x1, y1] = polar(AO[0], AO[1], AOR + 9, deg - 9), [x2, y2] = polar(AO[0], AO[1], AOR + 9, deg + 9);
    g.append(s(doc, 'path', { d: `M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} Z`, class: cls }));
  }
  // Ventriculo-infundibular fold between the posterior septal RVOT and the right sinus.
  g.append(s(doc, 'path', { d: arc(AO[0], AO[1], AOR + 13, -160, -70), class: 'ves-map-vif' }));
  label(doc, g, 205, 112, 'R', 'ves-map-tiny'); label(doc, g, 226, 154, 'L', 'ves-map-tiny'); label(doc, g, 184, 154, 'N', 'ves-map-tiny');
  label(doc, g, 254, 104, 'ILT', 'ves-map-tiny', [240, 113]); label(doc, g, 150, 90, 'VIF', 'ves-map-tiny', [166, 100]);
  // Pulmonary valve, anterior and to the left of the aorta.
  g.append(s(doc, 'circle', { cx: PV[0], cy: PV[1], r: PVR + 6, class: 'ves-map-myo', fill: `url(#${uid}-myo)` }));
  g.append(s(doc, 'circle', { cx: PV[0], cy: PV[1], r: PVR, class: 'ves-map-root', fill: `url(#${uid}-root)` }));
  for (const deg of [-90, 30, 150]) { const [x, y] = polar(PV[0], PV[1], PVR, deg); g.append(s(doc, 'line', { x1: PV[0], y1: PV[1], x2: x, y2: y, class: 'ves-map-commissure' })); }
  // Coronary veins: CS from its os along the posterior mitral annulus, GCV up the lateral wall into the AIV; MCV from the crux.
  g.append(s(doc, 'path', { d: 'M172 288 Q232 322 300 292 Q358 262 354 190 Q350 132 310 106 Q294 96 284 90', class: 'ves-map-vein' }));
  g.append(s(doc, 'path', { d: 'M196 300 Q192 318 198 336', class: 'ves-map-vein' }));
  g.append(s(doc, 'ellipse', { cx: 172, cy: 288, rx: 7, ry: 5, class: 'ves-map-os' }));
  // Coronary arteries: RCA from the right sinus ostium, in front of the RVOT base, around the tricuspid annulus to the crux; left main from the left sinus to the LAD (anterior) and LCx (mitral annulus).
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

/** Four-chamber-style long-axis cutaway: RV on the viewer's left, LV on the right, apex down. */
function cutawayView(doc, g, uid, t) {
  // Epicardium; RV and LV cavities; the myocardium between them is the septum.
  g.append(s(doc, 'path', { d: 'M424 94 C406 170 438 256 516 308 C556 332 588 340 606 334 C652 318 722 272 740 192 C752 132 738 94 716 86 L640 90 L586 92 Z', class: 'ves-map-myo', fill: `url(#${uid}-myo)` }));
  g.append(s(doc, 'path', { d: 'M454 100 C440 172 462 238 518 284 C546 302 568 298 570 280 C562 228 564 162 568 104 Z', class: 'ves-map-endo', fill: `url(#${uid}-cavity)` }));
  g.append(s(doc, 'path', { d: 'M640 98 C694 98 716 146 712 196 C706 258 664 300 622 310 C598 300 588 268 588 222 C588 160 592 116 604 104 Z', class: 'ves-map-endo', fill: `url(#${uid}-cavity)` }));
  // Base: aortic root over the septal crest, tricuspid and mitral annuli with leaflets.
  g.append(s(doc, 'path', { d: 'M588 100 C582 76 590 54 602 48 L626 48 C638 54 646 76 640 100', class: 'ves-map-outflow' }));
  for (const [x1, x2] of [[456, 566], [642, 714]]) g.append(s(doc, 'line', { x1, y1: 98, x2, y2: 98, class: 'ves-map-ring' }));
  for (const d of ['M460 100 Q470 128 494 142', 'M564 102 Q560 128 546 140', 'M644 100 Q648 130 664 150', 'M712 100 Q708 128 696 146']) g.append(s(doc, 'path', { d, class: 'ves-map-valve-leaflet' }));
  // Papillary muscles: RV anterior (moderator band insertion), LV anterolateral and posteromedial.
  const pm = [
    'M498 258 C502 248 514 246 520 254 C522 266 512 274 502 270 Z',
    'M712 198 C700 198 690 212 688 228 C694 238 708 238 714 228 Z',
    'M612 290 C618 272 634 262 650 266 C656 280 646 296 628 302 Z'
  ];
  for (const d of pm) g.append(s(doc, 'path', { d, class: 'ves-map-papillary' }));
  for (const d of ['M509 250 L494 142', 'M664 150 L692 214', 'M696 146 L704 202', 'M664 150 L640 266', 'M696 146 L648 268']) g.append(s(doc, 'path', { d, class: 'ves-map-chordae' }));
  g.append(s(doc, 'path', { d: 'M568 232 Q542 238 514 256', class: 'ves-map-muscle' }));
  // Conduction: His at the membranous septum; RBB down the RV septal surface into the moderator band; LBB fanning into LAF and LPF.
  g.append(s(doc, 'path', { d: 'M582 116 C572 158 570 198 566 230 Q540 238 514 254', class: 'ves-map-purkinje' }));
  g.append(s(doc, 'path', { d: 'M592 118 C600 136 604 148 606 160', class: 'ves-map-purkinje' }));
  g.append(s(doc, 'path', { d: 'M606 160 Q650 172 692 214', class: 'ves-map-purkinje' }), s(doc, 'path', { d: 'M606 160 C602 206 610 248 630 276', class: 'ves-map-purkinje' }));
  g.append(s(doc, 'circle', { cx: 587, cy: 112, r: 4.5, class: 'ves-map-his' }));
  // Labels.
  label(doc, g, 510, 196, 'RV', 'ves-map-label'); label(doc, g, 660, 206, 'LV', 'ves-map-label');
  label(doc, g, 614, 78, 'Ao', 'ves-map-caption'); label(doc, g, 511, 90, 'TV', 'ves-map-tiny'); label(doc, g, 678, 90, 'MV', 'ves-map-tiny');
  label(doc, g, 579, 190, 'IVS', 'ves-map-tiny ves-map-vertical');
  label(doc, g, 556, 124, 'His', 'ves-map-caption', [583, 114]);
  label(doc, g, 470, 214, 'RBB', 'ves-map-tiny', [566, 206]); label(doc, g, 452, 304, 'Mod. band', 'ves-map-tiny', [520, 250]);
  label(doc, g, 668, 160, 'LAF', 'ves-map-tiny'); label(doc, g, 666, 250, 'LPF', 'ves-map-tiny', [614, 248]);
  label(doc, g, 738, 252, 'ALPM', 'ves-map-tiny', [712, 232]); label(doc, g, 692, 318, 'PMPM', 'ves-map-tiny', [644, 294]);
  label(doc, g, 548, 336, 'Apex', 'ves-map-caption', [596, 332]);
  label(doc, g, 568, 26, t.chambers, 'ves-map-title');
}

/**
 * Aortic root opened at the L-N commissure and laid flat, seen from the lumen (original
 * drawing after the anatomy reviewed by John et al., Heart Rhythm 2026): crown-shaped
 * semilunar hinges, sinotubular junction, ventriculo-arterial junction and the virtual
 * basal ring; interleaflet triangles; muscle at the bases of the R and L sinuses; the
 * membranous septum and His beneath the R-N triangle; aorto-mitral continuity beneath N and L.
 */
const ROOT_COMMISSURES = [20, 130, 240, 350], ROOT_NADIRS = [75, 185, 295], ROOT_STJ = 70, ROOT_RING = 250;
export const ROOT_SITES = Object.freeze({ 'rvot-septal': [150, 40], 'lvot-cusp': [130, 214], 'lv-summit': [64, 292], 'para-his': [266, 306] });
function rootView(doc, g, uid, t) {
  const [c0, c1, c2, c3] = ROOT_COMMISSURES, [n0, n1, n2] = ROOT_NADIRS;
  const scallop = (a, n, b) => `C${a + 10} 200 ${n - 15} ${ROOT_RING} ${n} ${ROOT_RING} C${n + 15} ${ROOT_RING} ${b - 10} 200 ${b} ${ROOT_STJ}`;
  const hinge = `M${c0} ${ROOT_STJ} ${scallop(c0, n0, c1)} ${scallop(c1, n1, c2)} ${scallop(c2, n2, c3)}`;
  // Ventricular side below the hinges: LV outflow muscle under L and R, membranous septum, mitral curtain.
  g.append(s(doc, 'rect', { x: 14, y: ROOT_STJ, width: 342, height: 262, rx: 10, class: 'ves-map-myo', fill: `url(#${uid}-myo)` }));
  g.append(s(doc, 'path', { d: `M262 ${ROOT_RING} Q300 ${ROOT_RING + 8} 356 ${ROOT_RING} L356 332 L262 332 Z`, class: 'ves-map-fibrous-band' }));
  g.append(s(doc, 'path', { d: `M14 ${ROOT_RING} Q24 ${ROOT_RING + 6} 36 ${ROOT_RING} L36 332 L14 332 Z`, class: 'ves-map-fibrous-band' }));
  g.append(s(doc, 'ellipse', { cx: 238, cy: 270, rx: 26, ry: 14, class: 'ves-map-membranous' }));
  // Aortic wall above the hinges (the three sinuses), with the sinotubular junction on top.
  g.append(s(doc, 'path', { d: `${hinge} L${c3} ${ROOT_STJ - 34} L${c0} ${ROOT_STJ - 34} Z`, class: 'ves-map-aortic-wall' }));
  // Interleaflet triangles: between two hinges, apex at the commissure, base at the virtual ring.
  const ilt = (a, n, c, m) => `M${c} ${ROOT_STJ} C${c - 10} 200 ${n + 15} ${ROOT_RING} ${n} ${ROOT_RING} L${m} ${ROOT_RING} C${m - 15} ${ROOT_RING} ${c + 10} 200 ${c} ${ROOT_STJ} Z`;
  g.append(s(doc, 'path', { d: ilt(c0, n0, c1, n1), class: 'ves-map-ilt-muscle', 'data-ves-ilt': 'r-l' }));
  g.append(s(doc, 'path', { d: ilt(c1, n1, c2, n2), class: 'ves-map-ilt-fibrous', 'data-ves-ilt': 'r-n' }));
  // Muscular support at the bases of the L and R sinuses (below the ventriculo-arterial junction).
  for (const [a, n, b] of [[c0 + 18, n0, c1 - 4], [c1 + 4, n1, c2 - 20]]) g.append(s(doc, 'path', { d: `M${a} 196 Q${n} 214 ${b} 196 Q${n + (b - a) / 6} ${ROOT_RING - 8} ${n} ${ROOT_RING - 4} Q${n - (b - a) / 6} ${ROOT_RING - 8} ${a} 196 Z`, class: 'ves-map-sinus-muscle' }));
  g.append(s(doc, 'path', { d: hinge, class: 'ves-map-hinge' }));
  g.append(s(doc, 'line', { x1: c0, y1: ROOT_STJ, x2: c3, y2: ROOT_STJ, class: 'ves-map-stj' }));
  g.append(s(doc, 'path', { d: `M${c0} 196 Q${n0} 214 ${c1} 192 Q${n1} 212 ${c2 - 20} 198 Q${(c2 + c3) / 2} 226 ${c3} 214`, class: 'ves-map-vaj' }));
  g.append(s(doc, 'line', { x1: c0, y1: ROOT_RING, x2: c3, y2: ROOT_RING, class: 'ves-map-basal-ring' }));
  // Coronary ostia in the R and L sinuses, close to the sinotubular junction.
  g.append(s(doc, 'circle', { cx: n1 - 6, cy: ROOT_STJ + 22, r: 5, class: 'ves-map-ostium' }), s(doc, 'circle', { cx: n0 + 8, cy: ROOT_STJ + 26, r: 5, class: 'ves-map-ostium' }));
  // His at the crest of the muscular septum under the membranous septum; the infra-aortic LAF branch under the right sinus.
  g.append(s(doc, 'path', { d: 'M238 292 C214 300 182 296 156 282', class: 'ves-map-purkinje' }));
  g.append(s(doc, 'circle', { cx: 238, cy: 292, r: 5, class: 'ves-map-his' }));
  // RVOT infundibulum: anterior to the R and L sinuses, outside the wall.
  g.append(s(doc, 'rect', { x: 34, y: 28, width: 200, height: 26, rx: 13, class: 'ves-map-rvot-band' }));
  // Labels.
  label(doc, g, 75, 116, 'L', 'ves-map-label'); label(doc, g, 185, 116, 'R', 'ves-map-label'); label(doc, g, 295, 116, 'N', 'ves-map-label');
  label(doc, g, 76, 46, 'RVOT', 'ves-map-caption'); label(doc, g, 300, 64, 'STJ', 'ves-map-tiny');
  label(doc, g, 336, 230, 'VAJ', 'ves-map-tiny'); label(doc, g, 96, 264, t.rootRing, 'ves-map-tiny');
  label(doc, g, 130, 158, 'R-L ILT', 'ves-map-tiny'); label(doc, g, 240, 158, 'R-N ILT', 'ves-map-tiny');
  label(doc, g, 306, 264, t.rootMembranous, 'ves-map-tiny', [262, 268]); label(doc, g, 214, 322, 'His', 'ves-map-caption', [234, 296]);
  label(doc, g, 120, 318, t.rootFascicle, 'ves-map-tiny', [160, 284]); label(doc, g, 318, 330, t.rootMitral, 'ves-map-tiny');
  label(doc, g, 112, 100, 'LCA', 'ves-map-tiny', [86, 96]); label(doc, g, 200, 100, 'RCA', 'ves-map-tiny', [183, 92]);
  label(doc, g, 185, 24, t.root, 'ves-map-title');
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
  svg.setAttribute('viewBox', photo ? `0 0 ${BASAL_3D_SIZE[0]} ${BASAL_3D_SIZE[1]}` : view === 'chambers' ? '380 0 380 350' : '0 0 370 350');
  svg.setAttribute('data-ves-atlas', photo ? '3d' : 'svg');
  const scene = s(doc, 'g', { 'aria-hidden': 'true' });
  if (photo) basal3dView(doc, scene, t);
  else {
    scene.append(view === 'chambers' ? s(doc, 'rect', { x: 382, y: 5, width: 371, height: 339, rx: 16, class: 'ves-map-frame' }) : s(doc, 'rect', { x: 5, y: 5, width: 356, height: 339, rx: 16, class: 'ves-map-frame' }));
    if (view === 'base') basalView(doc, scene, uid, t); else if (view === 'root') rootView(doc, scene, uid, t); else cutawayView(doc, scene, uid, t);
  }
  svg.append(scene);
  const scale = photo ? 2 : 1;   // the render's viewBox is about twice the schematic's
  for (const region of VES_REGIONS) {
    // The opened root reuses the basal examples that sit at or next to the aortic sinuses.
    const at = view === 'root' ? ROOT_SITES[region.id] : region.view !== view ? null : photo ? BASAL_3D_SITES[region.id] : region.xy;
    if (!at) continue;
    const [x, y] = at;
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

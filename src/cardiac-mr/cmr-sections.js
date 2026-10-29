// Original anatomical schematics of the standard CMR views (SVG strings, no DOM).
// Shapes are built in each view's long-axis frame so they agree with the
// landmarks used for planning.
import {
  AXIAL, TWO_CH, THREE_CH, FOUR_CH, SAX, LV_ENDO_PROFILE,
  frameOf, mitralCentre, tricuspidCentre, aorticCentre, ellipseInFrame, polar,
  add, sub, scale, unit, normal, profileAt, saxAorticValveCentre
} from './cmr-geometry.js';
import { STRUCTURES, ORIENTATION } from './cardiac-mr-data.js';
import { smoothPath, polyPath, circle, label, text, svgOpen, pt } from './cmr-svg.js';

export const VIEWBOX = '0 0 360 300';
const LV_EPI_PROFILE = [[-0.02, 42], [0.12, 52], [0.35, 55], [0.6, 49], [0.8, 36], [0.94, 16], [1, 0]];

const name = (id, lang) => STRUCTURES[id].short[lang];
const lab = (o, id, at, opts) => (o.labels ? label(id, name(id, o.lang), at, opts) : '');

/** LV outline in a long-axis frame from a half-width profile (symmetric unless overridden). */
function lvOutline(frame, profile, kw, startPlus, endMinus) {
  const body = profile.slice(1, -1);
  const tip = profile[profile.length - 1];
  const plus = body.map(([s, w]) => frame.at(s, w * kw));
  const minus = body.slice().reverse().map(([s, w]) => frame.at(s, -w * kw));
  const pts = [startPlus, ...plus, frame.at(tip[0], 0), ...minus, endMinus];
  return `${smoothPath(pts, false)}Z`;
}

/** Closed mitral or tricuspid leaflets: two curves meeting slightly inside the ventricle. */
function leaflets(hingeA, hingeB, towards, depth = 12) {
  const c = add(scale(add(hingeA, hingeB), 0.5), scale(unit(towards), depth));
  const ctrl = (h) => add(scale(add(h, c), 0.5), scale(unit(towards), depth * 0.15));
  return `<path class="cmr-valve" d="M${pt(hingeA)}Q${pt(ctrl(hingeA))} ${pt(c)}M${pt(hingeB)}Q${pt(ctrl(hingeB))} ${pt(c)}"/>`;
}

function atrium(points) { return `<path class="cmr-atrium" d="${smoothPath(points)}"/>`; }

function longAxisLV(frame, view, kw = 1) {
  const loc = p => frame.local(p);
  const [plusHinge, minusHinge] = loc(view.mitralA).w > 0 ? [view.mitralA, view.mitralB] : [view.mitralB, view.mitralA];
  const epiPlus = frame.at(loc(plusHinge).s - 0.02, LV_EPI_PROFILE[0][1] * kw);
  const epiMinus = frame.at(loc(minusHinge).s - 0.02, -LV_EPI_PROFILE[0][1] * kw);
  return `<path class="cmr-myo" d="${lvOutline(frame, LV_EPI_PROFILE, kw, epiPlus, epiMinus)}"/>`
    + `<path class="cmr-cav" d="${lvOutline(frame, LV_ENDO_PROFILE, kw, plusHinge, minusHinge)}"/>`
    + leaflets(view.mitralA, view.mitralB, frame.u, 12);
}

const epiW = (s, kw) => profileAt(LV_EPI_PROFILE, s) * kw;

// ---------------------------------------------------------------------------

export function renderAxial(o) {
  const f = frameOf(mitralCentre(AXIAL), AXIAL.apex);
  const kw = 0.85;
  const t = ORIENTATION[o.lang];
  const rvLocal = [[-0.1, -44], [0.15, -48], [0.4, -50], [0.6, -45], [0.78, -36], [0.62, -64], [0.4, -84], [0.15, -96], [-0.1, -92]];
  const rv = rvLocal.map(([s, w]) => f.at(s, w));
  const la = ellipseInFrame(f, -30 / f.L, 6, 30, 34);
  const ra = ellipseInFrame(frameOf({ x: 112, y: 170 }, { x: 112, y: 200 }), 0, 0, 32, 34);
  const dao = { x: 232, y: 248 };
  const spine = { x: 190, y: 270 };
  return `<ellipse class="cmr-body" cx="180" cy="162" rx="160" ry="128"/>`
    + `<ellipse class="cmr-lung" cx="88" cy="150" rx="56" ry="86"/><ellipse class="cmr-lung" cx="290" cy="170" rx="44" ry="80"/>`
    + circle(spine, 17, 'cmr-bone') + circle(dao, 12, 'cmr-vessel')
    + atrium(ra) + atrium(la)
    + `<path class="cmr-cav" d="${smoothPath(rv)}"/><path class="cmr-rvwall" d="${smoothPath(rv.slice(4), false)}"/>`
    + longAxisLV(f, AXIAL, kw)
    + text({ x: 180, y: 22 }, t.anterior, 'cmr-orient') + text({ x: 6, y: 165 }, t.right, 'cmr-orient', 'start') + text({ x: 354, y: 165 }, t.left, 'cmr-orient', 'end')
    + lab(o, 'lv', f.at(0.58, 22)) + lab(o, 'rv', f.at(0.35, -70)) + lab(o, 'la', f.at(-30 / f.L, 24)) + lab(o, 'ra', { x: 110, y: 172 })
    + lab(o, 'dao', { x: 262, y: 270 }, { target: dao })
    + lab(o, 'spine', { x: 164, y: 292 }, { anchor: 'end' })
    + lab(o, 'apex', { x: 314, y: 112 }, { target: AXIAL.apex })
    + lab(o, 'mv', { x: 276, y: 226 }, { target: mitralCentre(AXIAL) });
}

export function render2ch(o) {
  const v = TWO_CH;
  const f = frameOf(mitralCentre(v), v.apex);
  const laR = 44;
  const la = ellipseInFrame(f, -laR / f.L, -2, laR, 46);
  const laa = ellipseInFrame(f, -0.12, 52, 9, 15);
  return atrium(laa) + atrium(la) + longAxisLV(f, v)
    + lab(o, 'lv', f.at(0.5, 20)) + lab(o, 'la', f.at(-laR / f.L, 22))
    + lab(o, 'laa', { x: 190, y: 40 }, { target: f.at(-0.12, 58) })
    + lab(o, 'mv', { x: 294, y: 196 }, { target: mitralCentre(v) })
    + lab(o, 'wall-ant', { x: 112, y: 104 }, { target: f.at(0.42, 48) })
    + lab(o, 'wall-inf', { x: 232, y: 250 }, { target: f.at(0.45, -48) })
    + lab(o, 'apex', { x: 118, y: 268 }, { target: v.apex, anchor: 'start' });
}

export function render4ch(o) {
  const v = FOUR_CH;
  const f = frameOf(mitralCentre(v), v.apex);
  const kw = 0.9;
  const septal = [0.15, 0.35, 0.55, 0.7].map(s => f.at(s, epiW(s, kw) + 3));
  const rvApex = f.at(0.76, epiW(0.76, kw) + 6);
  const freeWall = [{ x: 140, y: 230 }, { x: 102, y: 198 }, { x: 82, y: 156 }];
  const rv = [v.tricuspidA, ...septal, rvApex, ...freeWall, v.tricuspidB];
  const laR = 40;
  const la = ellipseInFrame(f, -laR / f.L, -4, laR, 45);
  const raC = add(tricuspidCentre(v), { x: -4, y: -40 });
  const ra = ellipseInFrame(frameOf(raC, add(raC, { x: 0, y: 10 })), 0, 0, 38, 40);
  return atrium(ra) + atrium(la)
    + `<path class="cmr-cav" d="${smoothPath(rv)}"/><path class="cmr-rvwall" d="${smoothPath([rvApex, ...freeWall, v.tricuspidB], false)}"/>`
    + longAxisLV(f, v, kw) + leaflets(v.tricuspidA, v.tricuspidB, { x: 0.2, y: 1 }, 11)
    + lab(o, 'lv', f.at(0.45, 0)) + lab(o, 'rv', { x: 128, y: 180 })
    + lab(o, 'la', f.at(-laR / f.L, -4)) + lab(o, 'ra', raC)
    + lab(o, 'mv', { x: 268, y: 132 }, { target: mitralCentre(v), anchor: 'start' })
    + lab(o, 'tv', { x: 42, y: 140 }, { target: tricuspidCentre(v) })
    + lab(o, 'ivs', { x: 104, y: 272 }, { target: f.at(0.6, epiW(0.6, kw) - 6) })
    + lab(o, 'wall-lat', { x: 306, y: 196 }, { target: f.at(0.45, -epiW(0.45, kw) + 6) })
    + lab(o, 'apex', { x: 260, y: 288 }, { target: v.apex, anchor: 'start' });
}

/** Three-chamber: asymmetric LV whose anteroseptal side runs into the aortic valve. */
export function render3ch(o) {
  const v = THREE_CH;
  const f = frameOf(mitralCentre(v), v.apex);
  const at = ([s, w]) => f.at(s, w);
  const endo = [v.aorticB, ...[[0.22, 64], [0.38, 50], [0.6, 38], [0.8, 25], [0.93, 9], [0.955, 0], [0.93, -9], [0.8, -24], [0.6, -36], [0.35, -42], [0.14, -40]].map(at), v.mitralB];
  const epi = [at([0.135, 91]), ...[[0.22, 80], [0.38, 63], [0.6, 50], [0.8, 36], [0.94, 16], [1, 0], [0.94, -16], [0.8, -36], [0.6, -49], [0.35, -55], [0.12, -52], [-0.03, -42]].map(at)];
  const tAcross = unit(sub(v.aorticB, v.aorticA));
  const d = normal(tAcross);
  const dir = d.y < 0 ? d : scale(d, -1);
  const wall = (h, out, sign) => [[18, 8], [42, 3], [64, 1], [170, 4]].map(([k, b]) => add(h, add(scale(dir, k), scale(out, sign * b))));
  const root = [v.aorticA, ...wall(v.aorticA, tAcross, -1), ...wall(v.aorticB, tAcross, 1).reverse(), v.aorticB];
  const laR = 46;
  const la = ellipseInFrame(f, -laR / f.L, -14, laR, 40);
  const avc = aorticCentre(v);
  return atrium(la) + `<path class="cmr-vessel" d="${smoothPath(root.slice(0, 5), false)}L${smoothPath(root.slice(5), false).slice(1)}Z"/>`
    + `<path class="cmr-myo" d="${smoothPath(epi, false)}L${pt(v.mitralB)}L${pt(v.mitralA)}L${pt(v.aorticA)}L${pt(v.aorticB)}Z"/>`
    + `<path class="cmr-cav" d="${smoothPath(endo, false)}L${pt(v.mitralA)}L${pt(v.aorticA)}Z"/>`
    + leaflets(v.mitralA, v.mitralB, f.u, 12) + leaflets(v.aorticA, v.aorticB, scale(dir, -1), 6)
    + lab(o, 'lv', f.at(0.5, 0)) + lab(o, 'la', f.at(-laR / f.L, -14)) + lab(o, 'ao', add(avc, scale(dir, 70)))
    + lab(o, 'av', { x: 104, y: 52 }, { target: avc })
    + lab(o, 'lvot', { x: 108, y: 92 }, { target: f.at(0.17, 54) })
    + lab(o, 'wall-as', { x: 62, y: 146 }, { target: f.at(0.47, 52) })
    + lab(o, 'wall-il', { x: 238, y: 256 }, { target: f.at(0.47, -45) })
    + lab(o, 'mv', { x: 304, y: 204 }, { target: mitralCentre(v) })
    + lab(o, 'apex', { x: 52, y: 272 }, { target: v.apex });
}

// ---------------------------------------------------------------------------
// Short axis (viewed from the apex: RV on image left, anterior up).

/** Geometric parts of a SAX slice, reused by the sequence schematics. */
export function saxParts(level = 'mid') {
  const c = SAX.centre;
  const L = SAX.levels[level];
  const [a, b] = L.rv;
  const inner = [];
  const outer = [];
  for (let th = b; th >= a; th -= 4) inner.push(polar(c, th, L.epi + 2));
  for (let th = a; th <= b; th += 4) {
    const t = (th - a) / (b - a);
    outer.push(polar(c, th, L.epi + 2 + L.rvDepth * Math.sin(Math.PI * t) ** 0.8));
  }
  return { c, ...L, rvCavity: polyPath([...inner, ...outer]), rvWall: polyPath(outer.map((p) => add(p, scale(unit(sub(p, c)), 3))), false) };
}

export function saxBase(level, cls = {}) {
  const p = saxParts(level);
  const k = { myo: 'cmr-myo', cav: 'cmr-cav', rv: 'cmr-cav', rvWall: 'cmr-rvwall', ...cls };
  return `<path class="${k.rv}" d="${p.rvCavity}"/><path class="${k.rvWall}" d="${p.rvWall}"/>`
    + circle(p.c, p.epi, k.myo) + circle(p.c, p.endo, k.cav);
}

function papillary(cls = 'cmr-pap') {
  const { anterolateral: al, posteromedial: pm } = SAX.papillary;
  return circle(polar(SAX.centre, al.theta, al.r), 8.5, cls) + circle(polar(SAX.centre, pm.theta, pm.r), 8.5, cls);
}

export function renderSax(o) {
  const c = SAX.centre;
  const { anterolateral: al, posteromedial: pm } = SAX.papillary;
  return saxBase('mid') + papillary()
    + lab(o, 'lv', { x: c.x, y: c.y }) + lab(o, 'rv', polar(c, 282, 90))
    + lab(o, 'ivs', { x: 36, y: 186 }, { target: polar(c, 255, 53) })
    + lab(o, 'rvip-ant', { x: 58, y: 34 }, { target: polar(c, SAX.rvInsertion.anterior, 62) })
    + lab(o, 'rvip-inf', { x: 58, y: 266 }, { target: polar(c, SAX.rvInsertion.inferior, 62) })
    + lab(o, 'wall-ant', { x: c.x + 10, y: 78 }) + lab(o, 'wall-inf', { x: c.x + 6, y: 230 })
    + lab(o, 'wall-lat', { x: 306, y: 150 })
    + lab(o, 'pm-al', { x: 298, y: 94 }, { target: polar(c, al.theta, al.r) })
    + lab(o, 'pm-pm', { x: 298, y: 212 }, { target: polar(c, pm.theta, pm.r) });
}

/** Basal SAX with LVOT/aortic valve and the mitral orifice (source of the 3CH). */
export function renderBasalSax(o) {
  const c = SAX.centre;
  const av = saxAorticValveCentre();
  const toAv = unit(sub(av, c));
  const across = normal(toAv);
  const o0 = add(c, scale(toAv, -8));
  const mv = (sign) => `M${pt(add(o0, scale(across, -28)))}Q${pt(add(o0, scale(toAv, sign * 14)))} ${pt(add(o0, scale(across, 28)))}`;
  const cusps = [0, 120, 240].map(th => `M${pt(av)}L${pt(polar(av, th + 20, SAX.aorticValve.radius - 3))}`).join('');
  return saxBase('basal')
    + `<path class="cmr-lvot" d="M${pt(add(c, scale(toAv, 30)))}L${pt(av)}"/>`
    + circle(av, SAX.aorticValve.radius, 'cmr-vessel') + `<path class="cmr-valve" d="${cusps}"/>`
    + `<path class="cmr-valve" d="${mv(1)}${mv(-1)}"/>`
    + lab(o, 'lv', polar(c, 100, 40)) + lab(o, 'rv', polar(c, 245, 92))
    + lab(o, 'av', { x: 70, y: 36 }, { target: av })
    + lab(o, 'lvot', { x: 46, y: 140 }, { target: add(c, scale(toAv, 50)) })
    + lab(o, 'mv', { x: 236, y: 274 }, { target: add(o0, scale(toAv, -11)) });
}

export const RENDERERS = { axial: renderAxial, '2ch': render2ch, '3ch': render3ch, '4ch': render4ch, sax: renderSax, basal: renderBasalSax };

/** Full SVG for a view; `overlay` is extra markup drawn on top (planning lines). */
export function sectionSvg(id, { lang = 'tr', labels = true, overlay = '', title = '' } = {}) {
  const body = RENDERERS[id]({ lang, labels });
  return `${svgOpen(VIEWBOX, `role="img" aria-label="${title}" data-cmr-view="${id}" class="cmr-svg"`)}<rect class="cmr-bg" width="360" height="300"/>${body}${overlay}</svg>`;
}

// Angiographic (fluoroscopic) view of the coronary physiology lab: an original schematic
// 3D coronary tree projected with the C-arm angles, the pressure wire with its sensor, the
// case lesions on the measured vessel and an optional Pd/Pa co-registration map.
// Coordinates are in cm around the heart centre (+x patient left, +y superior, +z anterior);
// they are teaching geometry, not reconstructed patient anatomy.
import { samplePullbackRatio } from './coronary-physiology-sim.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const P = (x, y, z) => [x, y, z];

// Measured vessel centrelines start at the ostium: 0 mm of the console is the ostium, so
// the 0-80 mm pullback axis and the lesion positions (posMm) map onto arc length (1 cm = 10 mm).
const LEFT_MAIN = [P(0.3, 2.4, 0.6), P(0.8, 2.4, 0.85), P(1.2, 2.3, 1.0)];
const LAD = [...LEFT_MAIN, P(1.6, 1.7, 2.2), P(1.85, 0.6, 2.85), P(2.0, -0.7, 2.85), P(1.95, -1.9, 2.35), P(1.6, -2.75, 1.5), P(1.0, -2.9, 0.6)];
const LCX = [...LEFT_MAIN, P(2.0, 2.15, 0.3), P(2.75, 1.65, -0.6), P(3.05, 0.85, -1.5), P(2.8, 0.0, -2.35), P(2.2, -0.6, -2.85)];
const RCA = [P(-1.0, 2.2, 1.0), P(-1.75, 2.05, 1.45), P(-2.55, 1.2, 1.5), P(-3.0, 0.05, 0.95), P(-2.9, -1.05, -0.2), P(-2.05, -1.6, -1.6), P(-1.05, -1.7, -2.3), P(-0.3, -1.65, -2.5)];

// Side branches (not measured): [id, label, points, diameter cm].
const LEFT_BRANCHES = [
  ['d1', 'D1', [P(1.62, 1.6, 2.25), P(2.4, 1.15, 2.1), P(3.0, 0.35, 1.6), P(3.25, -0.4, 1.1)], 0.22],
  ['d2', 'D2', [P(1.9, 0.2, 2.9), P(2.65, -0.35, 2.45), P(3.05, -1.15, 1.85)], 0.18],
  ['s1', 'S1', [P(1.58, 1.75, 2.15), P(1.2, 1.2, 1.7), P(0.9, 0.55, 1.35)], 0.12],
  ['s2', 'S2', [P(1.84, 0.7, 2.8), P(1.4, 0.15, 2.2), P(1.15, -0.45, 1.8)], 0.1],
  ['om1', 'OM1', [P(2.78, 1.6, -0.65), P(3.45, 0.75, -0.3), P(3.75, -0.35, -0.25), P(3.7, -1.25, -0.35)], 0.22],
  ['om2', 'OM2', [P(3.0, 0.7, -1.65), P(3.35, -0.35, -1.5), P(3.25, -1.35, -1.25)], 0.18],
  ['lcx-pl', 'PL', [P(2.5, -0.3, -2.6), P(2.1, -1.2, -2.6)], 0.13]
];
const RIGHT_BRANCHES = [
  ['conus', 'Konus', [P(-1.7, 2.06, 1.47), P(-1.15, 2.05, 2.05), P(-0.45, 1.95, 2.45)], 0.12],
  ['rv-br', 'RV', [P(-2.8, 0.7, 1.35), P(-2.05, 0.1, 2.2), P(-1.3, -0.35, 2.6)], 0.12],
  ['am', 'AM', [P(-2.97, -0.6, 0.35), P(-2.15, -1.35, 1.55), P(-1.25, -1.9, 2.15)], 0.15],
  ['pda', 'PDA', [P(-1.0, -1.7, -2.3), P(-0.25, -2.25, -1.55), P(0.45, -2.75, -0.55), P(0.95, -3.0, 0.35)], 0.18],
  ['plb', 'PLB', [P(-0.3, -1.65, -2.5), P(0.55, -1.4, -2.85), P(1.35, -1.0, -2.95)], 0.16]
];
// Guiding catheter: down the descending aorta, over the arch, into the ostium (JL / JR shape).
const GUIDE = {
  left: [P(-0.2, 7.5, -3.2), P(-0.6, 5.6, -1.6), P(-1.05, 4.5, -0.2), P(-1.0, 3.3, 0.5), P(-0.4, 2.7, 0.75), P(0.3, 2.4, 0.6)],
  right: [P(-0.2, 7.5, -3.2), P(-0.6, 5.6, -1.6), P(-1.0, 4.4, -0.1), P(-0.95, 3.2, 0.55), P(-1.0, 2.2, 1.0)]
};

const MEASURED = { LAD: { path: LAD, side: 'left', d0: 0.42, d1: 0.17 }, LCX: { path: LCX, side: 'left', d0: 0.42, d1: 0.2 }, RCA: { path: RCA, side: 'right', d0: 0.36, d1: 0.2 } };

/** Standard projections for each measured vessel (alpha: + LAO / - RAO, beta: + CRA / - CAU). */
export const FLUORO_PROJECTIONS = Object.freeze({
  LAD: [{ alpha: -30, beta: 30 }, { alpha: 40, beta: 30 }, { alpha: 0, beta: 40 }, { alpha: 90, beta: 0 }],
  LCX: [{ alpha: -30, beta: -30 }, { alpha: 45, beta: -30 }, { alpha: 0, beta: -30 }],
  RCA: [{ alpha: 30, beta: 0 }, { alpha: -30, beta: 0 }, { alpha: 0, beta: 30 }]
});

/** Same convention as the carotid skopi: LAO rotates posterior structures to the screen right, CRA lifts the view. */
export function projectPoint(p, alpha = 0, beta = 0) {
  const a = clamp(alpha, -90, 90) * Math.PI / 180, b = clamp(beta, -45, 45) * Math.PI / 180;
  const x = p[0] * Math.cos(a) - p[2] * Math.sin(a), z = p[0] * Math.sin(a) + p[2] * Math.cos(a);
  const y = p[1] * Math.cos(b) - z * Math.sin(b), depth = p[1] * Math.sin(b) + z * Math.cos(b);
  const persp = 14 / (14 + depth * 0.25);
  return { u: x * persp, v: -y * persp, depth };
}

/** Catmull-Rom samples of a 3D polyline with cumulative arc length in mm. */
export function sampleCenterline(points, stepsPerSegment = 14) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i], p2 = points[i + 1];
    const p0 = points[i - 1] || p1.map((v, k) => 2 * v - p2[k]);
    const p3 = points[i + 2] || p2.map((v, k) => 2 * v - p1[k]);
    for (let j = 0; j < stepsPerSegment; j++) {
      const t = j / stepsPerSegment, t2 = t * t, t3 = t2 * t;
      out.push(p1.map((v, k) => 0.5 * (2 * v + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * v + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * v - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push([...points.at(-1)]);
  let mm = 0;
  return out.map((p, i) => {
    if (i) mm += Math.hypot(...p.map((v, k) => v - out[i - 1][k])) * 10;
    return { p, mm };
  });
}

/** Lumen diameter factor (1 = reference) at mm along the measured vessel for the case lesions. */
export function lumenFactor(caseObj, mm, state = {}) {
  const stented = new Set(state.stentedIds || []);
  let f = 1;
  for (const lesion of caseObj?.lesions || []) {
    const sigma = Math.max(1.5, (lesion.lengthMm || 6) / 2.6);
    const g = Math.exp(-((mm - lesion.posMm) ** 2) / (2 * sigma * sigma));
    const severity = stented.has(lesion.id) ? (state.underexpanded ? 0.22 : 0) : (lesion.stenosisPct || 50) / 100;
    f = Math.min(f, 1 - severity * g);
  }
  // Diffuse disease: irregular, gently narrowed lumen along the vessel.
  const diffuse = caseObj?.diffuseLoss || 0;
  if (diffuse > 0.08 && mm > 8) {
    const beading = 0.5 + 0.5 * Math.sin(mm * 0.62) * Math.sin(mm * 0.23 + 1);
    f *= 1 - Math.min(0.5, diffuse * 2) * (0.35 + 0.65 * beading);
  }
  return clamp(f, 0.08, 1);
}

/** Colour for a Pd/Pa value on the co-registration map. */
export function ratioColor(r) {
  if (r > 0.9) return '#2fbf71';
  if (r > 0.8) return '#f2b134';
  return '#e5484d';
}

let noise = null;
function noiseLayer(w, h) {
  if (noise && noise.width === w && noise.height === h) return noise;
  noise = Object.assign(document.createElement('canvas'), { width: w, height: h });
  const n = noise.getContext('2d'), img = n.createImageData(w, h);
  let s = 1234567;
  for (let i = 0; i < img.data.length; i += 4) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const v = 120 + (s % 30);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 26;
  }
  n.putImageData(img, 0, 0);
  return noise;
}

function strokePath(ctx, pts, width, color) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (const q of pts.slice(1)) ctx.lineTo(q.x, q.y);
  ctx.stroke();
}

/**
 * Draws the angiographic view. Returns the projected measured path (screen x, y, mm) and the
 * lesion anchors for hit testing. options: { caseObj, state, lang, alpha, beta, view }.
 * view: 'cine' (contrast), 'fluoro' (no contrast: wire only over a faint roadmap) or 'map' (Pd/Pa co-registration).
 */
export function renderCoronaryFluoro(canvas, options = {}) {
  const ctx = canvas?.getContext?.('2d');
  if (!ctx) return { path: [], lesions: [] };
  const { caseObj = {}, state = {}, lang = 'tr' } = options;
  const isTr = lang !== 'en';
  const view = ['cine', 'fluoro', 'map'].includes(options.view) ? options.view : 'cine';
  const alpha = Number(options.alpha) || 0, beta = Number(options.beta) || 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = Math.max(240, canvas.clientWidth || 640), cssH = Math.max(200, canvas.clientHeight || 380);
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) { canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = cssW, h = cssH;
  const measured = MEASURED[state.vessel] || MEASURED[caseObj.vessel] || MEASURED.LAD;
  const side = measured.side;

  // Frame the projected coronary tree (the guide may leave the top edge, as on a real run).
  const branches = side === 'left' ? LEFT_BRANCHES : RIGHT_BRANCHES;
  const otherTrunks = side === 'left' ? [state.vessel === 'LCX' ? LAD : LCX] : [];
  const framed = [...measured.path, ...otherTrunks.flat(), ...branches.flatMap(b => b[2])].map(p => projectPoint(p, alpha, beta));
  const us = framed.map(q => q.u), vs = framed.map(q => q.v);
  const [u0, u1, v0, v1] = [Math.min(...us), Math.max(...us), Math.min(...vs), Math.max(...vs)];
  const scale = Math.min((w * 0.78) / Math.max(1, u1 - u0), (h * 0.74) / Math.max(1, v1 - v0));
  const cx = w / 2 - ((u0 + u1) / 2) * scale, cy = h / 2 - ((v0 + v1) / 2) * scale;
  // Lumen widths: a 4-5 mm left main is about 12-14 px on a 380 px frame.
  const thick = scale * 0.62;
  const toScreen = (p) => { const q = projectPoint(p, alpha, beta); return { x: cx + q.u * scale, y: cy + q.v * scale, depth: q.depth }; };

  // X-ray field: grey, vignetted, with the spine and a soft diaphragm.
  const bg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.15, w / 2, h / 2, Math.max(w, h) * 0.75);
  bg.addColorStop(0, '#b9bec1'); bg.addColorStop(1, '#6f767b');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const spine = [toScreen(P(-0.2, 6, -4.5)), toScreen(P(-0.2, -6, -4.5))];
  ctx.save(); ctx.globalAlpha = 0.18; strokePath(ctx, spine, 2.2 * scale, '#3c4246');
  ctx.globalAlpha = 0.12;
  for (let y = -5.5; y <= 5.5; y += 1.15) { const a = toScreen(P(-1.1, y, -4.5)), b = toScreen(P(0.7, y, -4.5)); strokePath(ctx, [a, b], 0.12 * scale, '#2b3034'); }
  ctx.restore();
  const dia = ctx.createLinearGradient(0, h * 0.78, 0, h);
  dia.addColorStop(0, 'rgba(60,66,70,0)'); dia.addColorStop(1, 'rgba(60,66,70,0.35)');
  ctx.fillStyle = dia; ctx.fillRect(0, h * 0.78, w, h * 0.22);

  const contrast = view !== 'fluoro';
  const vesselInk = (depth) => `rgba(24,29,33,${contrast ? clamp(0.82 - depth * 0.015, 0.6, 0.9) : 0.07})`;

  // Guiding catheter (radiopaque, always visible).
  const guide = sampleCenterline(GUIDE[side], 10).map(s => toScreen(s.p));
  strokePath(ctx, guide, Math.max(2.5, 0.2 * thick), 'rgba(30,34,37,0.75)');

  // Side branches and the non-measured tree.
  for (const trunk of otherTrunks) {
    const pts = sampleCenterline(trunk).map(s => toScreen(s.p));
    strokePath(ctx, pts, 0.3 * thick, vesselInk(pts[0].depth));
  }
  for (const [, , pts, d] of branches) {
    const sp = sampleCenterline(pts, 10).map(s => toScreen(s.p));
    strokePath(ctx, sp, d * thick, vesselInk(sp[0].depth));
  }

  // Measured vessel: tapered lumen with the case lesions (contrast column), stents, map.
  const samples = sampleCenterline(measured.path, 18);
  const total = samples.at(-1).mm;
  const screen = samples.map(s => ({ ...toScreen(s.p), mm: s.mm }));
  for (let i = 1; i < screen.length; i++) {
    const mm = screen[i].mm, t = mm / total;
    const d = (measured.d0 + (measured.d1 - measured.d0) * t) * lumenFactor(caseObj, mm, state);
    const color = view === 'map' && mm <= 80
      ? ratioColor(samplePullbackRatio(caseObj, mm, { hyperemia: true, stentedIds: state.stentedIds || [], underexpanded: state.underexpanded }))
      : vesselInk(screen[i].depth);
    ctx.save(); if (view === 'map') ctx.globalAlpha = 0.9;
    strokePath(ctx, [screen[i - 1], screen[i]], Math.max(1.2, d * thick), color);
    ctx.restore();
  }
  const at = (mm) => {
    const m = clamp(mm, 0, total);
    const i = Math.max(1, screen.findIndex(s => s.mm >= m));
    const a = screen[i - 1], b = screen[i], f = (m - a.mm) / ((b.mm - a.mm) || 1);
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, nx: -(b.y - a.y), ny: b.x - a.x };
  };
  const stented = new Set(state.stentedIds || []);
  for (const lesion of caseObj.lesions || []) {
    if (!stented.has(lesion.id)) continue;
    const half = (lesion.lengthMm || 8) / 2 + 3;
    ctx.save(); ctx.globalAlpha = 0.85;
    for (let mm = lesion.posMm - half; mm <= lesion.posMm + half; mm += 1.6) {
      const a = at(mm), b = at(mm + 1.6), len = Math.hypot(a.nx, a.ny) || 1, r = measured.d0 * 0.55 * thick;
      const ox = a.nx / len * r, oy = a.ny / len * r;
      strokePath(ctx, [{ x: a.x + ox, y: a.y + oy }, { x: b.x - ox, y: b.y - oy }], 1, '#20262a');
      strokePath(ctx, [{ x: a.x - ox, y: a.y - oy }, { x: b.x + ox, y: b.y + oy }], 1, '#20262a');
    }
    ctx.restore();
  }

  // Pressure wire: through the guide, down the vessel; the sensor sits 30 mm from the
  // radiopaque tip (Doppler wire: at the tip). Pullback moves the whole wire.
  const sensorMm = clamp(Number(state.sensorMm) || 0, 0, 80);
  const tipMm = Math.min(total, sensorMm + (state.modality === 'doppler' ? 0 : 30));
  const wirePts = [...guide, ...screen.filter(s => s.mm <= tipMm)];
  strokePath(ctx, wirePts, 1.1, 'rgba(18,22,25,0.9)');
  const tipStart = screen.filter(s => s.mm >= sensorMm && s.mm <= tipMm);
  if (tipStart.length > 1) strokePath(ctx, tipStart, 2.4, 'rgba(10,12,14,0.95)');
  if (state.device === 'mc') {
    const mcPts = [...guide, ...screen.filter(s => s.mm <= Math.max(6, sensorMm - 4))];
    strokePath(ctx, mcPts, 2.6, 'rgba(34,40,44,0.55)');
  }
  const s = at(sensorMm);
  const ratio = samplePullbackRatio(caseObj, sensorMm, { hyperemia: state.hyperemia !== false, stentedIds: state.stentedIds || [], underexpanded: state.underexpanded, microcatheter: state.device === 'mc' });
  ctx.fillStyle = '#ffd166'; ctx.strokeStyle = '#1b1f22'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(s.x, s.y, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Labels: lesions, sensor readout, projection, disclaimer.
  ctx.font = '600 11px system-ui, sans-serif'; ctx.textBaseline = 'middle';
  const lesionAnchors = [];
  const label = (x, y, text, fill = 'rgba(12,16,20,0.82)', ink = '#f8fafc') => {
    const pad = 5, tw = ctx.measureText(text).width, bx = clamp(x, 4, w - tw - 2 * pad - 4), by = clamp(y, 12, h - 12);
    ctx.fillStyle = fill; ctx.fillRect(bx, by - 9, tw + 2 * pad, 18); ctx.fillStyle = ink; ctx.fillText(text, bx + pad, by);
  };
  for (const lesion of caseObj.lesions || []) {
    const a = at(lesion.posMm);
    lesionAnchors.push({ id: lesion.id, x: a.x, y: a.y });
    if (state.showLesionLabels === false) continue;
    const pct = stented.has(lesion.id) ? (isTr ? 'stent' : 'stent') : `%${lesion.stenosisPct}`;
    // Leader out along the vessel normal, on the side away from the tree, so the narrowing stays visible.
    const len = Math.hypot(a.nx, a.ny) || 1;
    let nx = a.nx / len, ny = a.ny / len;
    if ((a.x - cx) * nx + (a.y - cy) * ny < 0) { nx = -nx; ny = -ny; }
    // The vessel selector can move the case lesion onto another artery: then drop the case's vessel name.
    const name = state.vessel && caseObj.vessel && state.vessel !== caseObj.vessel ? (isTr ? 'Lezyon' : 'Lesion') : pick(lesion.label, lang);
    const text = `${name} · ${pct}`, tw = ctx.measureText(text).width + 10;
    const ex = a.x + nx * 46, ey = a.y + ny * 46;
    ctx.strokeStyle = 'rgba(255,209,102,0.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(a.x + nx * 8, a.y + ny * 8); ctx.lineTo(ex, ey); ctx.stroke();
    label(nx >= 0 ? ex + 2 : ex - tw - 2, ey, text, 'rgba(255,209,102,0.92)', '#1b1f22');
  }
  if ((caseObj.diffuseLoss || 0) > 0.08 && !(caseObj.lesions || []).length && state.showLesionLabels !== false) {
    const a = at(45), len = Math.hypot(a.nx, a.ny) || 1;
    let nx = a.nx / len, ny = a.ny / len;
    if ((a.x - cx) * nx + (a.y - cy) * ny < 0) { nx = -nx; ny = -ny; }
    const text = isTr ? 'Diffüz hastalık · düzensiz lümen' : 'Diffuse disease · irregular lumen';
    const tw = ctx.measureText(text).width + 10, ex = a.x + nx * 46, ey = a.y + ny * 46;
    ctx.strokeStyle = 'rgba(255,209,102,0.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(a.x + nx * 8, a.y + ny * 8); ctx.lineTo(ex, ey); ctx.stroke();
    label(nx >= 0 ? ex + 2 : ex - tw - 2, ey, text, 'rgba(255,209,102,0.92)', '#1b1f22');
  }
  label(s.x + 10, s.y + 16, `${isTr ? 'Sensör' : 'Sensor'} ${Math.round(sensorMm)} mm · Pd/Pa ${ratio.toFixed(2)}`);
  ctx.font = '600 12px ui-monospace, monospace'; ctx.fillStyle = '#111518';
  const angle = `${Math.abs(alpha) < 1 ? 'AP' : `${alpha > 0 ? 'LAO' : 'RAO'} ${Math.abs(alpha)}°`}${Math.abs(beta) < 1 ? '' : ` · ${beta > 0 ? 'CRA' : 'CAU'} ${Math.abs(beta)}°`}`;
  ctx.fillText(`${view === 'fluoro' ? (isTr ? 'SKOPİ' : 'FLUORO') : view === 'map' ? (isTr ? 'Pd/Pa HARİTASI' : 'Pd/Pa MAP') : 'CINE'} · ${angle}`, 12, 16);
  ctx.font = '10px system-ui, sans-serif'; ctx.fillStyle = 'rgba(17,21,24,0.8)';
  ctx.fillText(isTr ? 'Özgün şematik anjiyografi · Hasta görüntüsü değil · Ölçeksiz' : 'Original schematic angiography · Not patient imaging · Not to scale', 12, h - 12);
  if (view === 'map') {
    const items = [['> 0.90', '#2fbf71'], ['0.81–0.90', '#f2b134'], ['≤ 0.80', '#e5484d']];
    items.forEach(([t, c], i) => { ctx.fillStyle = c; ctx.fillRect(w - 92, 10 + i * 16, 10, 10); ctx.fillStyle = '#111518'; ctx.fillText(t, w - 78, 15 + i * 16); });
  }
  ctx.drawImage(noiseLayer(Math.round(w), Math.round(h)), 0, 0, w, h);
  return { path: screen.filter(p => p.mm <= 80).map(p => ({ x: p.x, y: p.y, mm: p.mm })), lesions: lesionAnchors, sensor: { x: s.x, y: s.y, mm: sensorMm, ratio } };
}

/** Nearest measured-path position (mm, 0-80) to a screen point, or null when farther than `tolerance` px. */
export function nearestPathMm(path, x, y, tolerance = 22) {
  let best = null, dist = Infinity;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i], dx = b.x - a.x, dy = b.y - a.y;
    const t = clamp(((x - a.x) * dx + (y - a.y) * dy) / ((dx * dx + dy * dy) || 1), 0, 1);
    const d = Math.hypot(x - a.x - t * dx, y - a.y - t * dy);
    if (d < dist) { dist = d; best = a.mm + (b.mm - a.mm) * t; }
  }
  return dist <= tolerance ? clamp(Math.round(best), 0, 80) : null;
}

function pick(text, lang) {
  if (!text || typeof text === 'string') return text || '';
  return text[lang] || text.tr || text.en || '';
}

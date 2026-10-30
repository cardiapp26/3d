/**
 * Frontal section of the heart for the Ashman lab: myocardium with its cavities, valves and
 * great vessels, and the conduction system from the SA node to the Purkinje network. The early
 * atrial beat (P') spreads over the atria as a wavefront, waits in the AV node, runs down the
 * bundles, stops at a refractory bundle and reaches the blocked side late, across the septum.
 * Shapes are drawn in a 400 x 340 design space and scaled to the canvas.
 */
import { fitCanvas } from './ecg-paper.js';
import { HV } from './ecg-ashman-model.js';

const VIEW = Object.freeze({ w: 400, h: 340 });
const SHAPE = Object.freeze({
  epi: 'M58,200 C50,262 150,328 285,322 C345,305 368,225 345,152 C362,118 348,72 302,62 C270,55 235,58 215,72 L175,72 C135,50 70,62 48,115 C36,150 42,185 58,200 Z',
  right: 'M85,92 C110,78 150,80 172,92 L180,172 L182,182 C196,210 222,250 262,282 C248,292 226,298 200,296 C130,292 80,252 76,214 L74,208 C60,175 60,120 85,92 Z',
  left: 'M214,86 C240,74 290,74 320,86 C338,100 338,130 330,152 C340,190 330,262 284,296 C262,262 236,226 218,188 L212,172 L210,140 Z',
  atria: 'M0,0 L400,0 L400,148 L330,152 L216,178 L182,182 L74,208 L0,214 Z',
  ventricles: 'M0,214 L74,208 L182,182 L216,178 L330,152 L400,148 L400,340 L0,340 Z',
  svc: 'M100,76 L100,0 L140,0 L140,66 Z'
});
const VESSELS = Object.freeze([
  { d: 'M232,96 C236,62 252,44 286,38 L336,34', width: 24, color: '#2b3352' },
  { d: 'M184,96 C176,44 192,16 226,12 C258,9 272,24 272,58', width: 26, color: '#4b2433' }
]);
const PATHS = Object.freeze({
  his: [[188, 170], [197, 180], [205, 192]],
  rbb: [[205, 192], [200, 204], [219, 232], [240, 258], [200, 266], [142, 266]],
  lbb: [[205, 192], [214, 199], [224, 210]],
  laf: [[224, 210], [254, 204], [290, 196], [318, 196]],
  lpf: [[224, 210], [236, 236], [262, 258], [300, 262]],
  septal: [[230, 222], [246, 246]]
});
const TRACTS = Object.freeze([
  [[128, 70], [168, 92], [186, 166]], [[128, 70], [150, 130], [186, 168]],
  [[128, 70], [96, 130], [140, 180], [186, 170]], [[128, 70], [200, 76], [262, 78], [340, 104]]
]);
const PURKINJE = Object.freeze({
  lv: [[[318, 196], [334, 180]], [[318, 196], [328, 222]], [[300, 262], [320, 244]], [[300, 262], [298, 286]], [[300, 262], [280, 282]], [[246, 246], [266, 276], [282, 292]], [[254, 204], [262, 186]]],
  rv: [[[142, 266], [116, 248]], [[142, 266], [124, 286]], [[142, 266], [164, 288]], [[240, 258], [232, 282]], [[219, 232], [204, 246]]]
});
const NODE = Object.freeze({ sa: [128, 70], avn: [188, 170], pac: [346, 108] });
/** Where each chamber's activation starts: through its own bundle, or late across the septum. */
const SOURCES = Object.freeze({
  lv: { own: [[246, 246], [318, 196], [300, 262]], late: [[236, 238]], reach: [120, 160] },
  rv: { own: [[142, 266], [240, 258]], late: [[220, 236]], reach: [130, 180] }
});
const COLOR = Object.freeze({ fast: '#fde047', slow: '#fb923c', atria: '251,191,36', ventricles: '251,113,133', block: '#ef4444' });

/** Point at fraction f along a polyline, and its direction there. */
function along(pts, f) {
  const seg = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
  let need = Math.max(0, Math.min(1, f)) * total;
  for (let i = 0; i < seg.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    if (need <= seg[i]) { const u = need / seg[i]; return { x: ax + (bx - ax) * u, y: ay + (by - ay) * u, dx: (bx - ax) / seg[i], dy: (by - ay) / seg[i] }; }
    need -= seg[i];
  }
  const [ax, ay] = pts.at(-2), [bx, by] = pts.at(-1), d = Math.hypot(bx - ax, by - ay);
  return { x: bx, y: by, dx: (bx - ax) / d, dy: (by - ay) / d };
}

/** Progress (0..1, or null) of each part of the early beat at time t. */
export function conductionAt(pac, t) {
  const prog = (a, b) => (t < a ? null : Math.min(1, (t - a) / (b - a)));
  const out = { atria: prog(pac.a - 50, pac.a + 40), avn: null, his: null, rbb: null, lbb: null, laf: null, lpf: null, lv: null, rv: null, septal: null, blockedAt: {} };
  if (pac.h == null) { out.avn = prog(pac.a, pac.a + 60); out.blockedAt.avn = t >= pac.a + 60; return out; }
  out.avn = prog(pac.a, pac.h); out.his = prog(pac.h, pac.h + 12);
  if (pac.pattern === 'blocked-hps') { out.blockedAt.rbb = out.blockedAt.lbb = t >= pac.h + 12; return out; }
  const b = pac.bundles, dur = x => 34 + 50 * (x.state === 'slow' ? x.degree : 0);
  for (const k of ['rbb', 'lbb']) {
    if (b[k].state === 'block') out.blockedAt[k] = t >= pac.h + 14;
    else out[k] = prog(pac.h + 12, pac.h + 12 + dur(b[k]));
  }
  if (out.lbb === 1) {
    const lbbEnd = pac.h + 12 + dur(b.lbb);
    if (b.laf.state === 'block') out.blockedAt.laf = t >= lbbEnd; else out.laf = prog(lbbEnd, lbbEnd + 20);
    out.lpf = prog(lbbEnd, lbbEnd + 22);
  }
  const v = pac.h + HV;
  out.lv = b.lbb.state === 'block' ? prog(v + 60, v + 140) : prog(v, v + 70);
  out.rv = b.rbb.state === 'block' ? prog(v + 60, v + 140) : prog(v + 5, v + 70);
  if (b.rbb.state === 'block' || b.lbb.state === 'block') out.septal = prog(v + 10, v + 80);
  return out;
}

const line = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };

function drawAnatomy(ctx) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = '#2b3352'; ctx.fill(new Path2D(SHAPE.svc));
  for (const v of VESSELS) { ctx.strokeStyle = v.color; ctx.lineWidth = v.width; ctx.stroke(new Path2D(v.d)); }
  const muscle = ctx.createLinearGradient(60, 50, 330, 330);
  muscle.addColorStop(0, '#6b3242'); muscle.addColorStop(.55, '#4d2230'); muscle.addColorStop(1, '#341520');
  ctx.fillStyle = muscle; ctx.fill(new Path2D(SHAPE.epi));
  ctx.strokeStyle = 'rgba(244,163,180,.35)'; ctx.lineWidth = 1.4; ctx.stroke(new Path2D(SHAPE.epi));
  for (const k of ['right', 'left']) {
    const p = new Path2D(SHAPE[k]);
    ctx.fillStyle = '#120b13'; ctx.fill(p);
    ctx.strokeStyle = 'rgba(190,90,110,.55)'; ctx.lineWidth = 1.2; ctx.stroke(p);
  }
  // Fibrous annuli and valve leaflets.
  ctx.strokeStyle = 'rgba(226,213,190,.75)'; ctx.lineWidth = 2;
  for (const [a, b] of [[[74, 208], [100, 226]], [[182, 182], [170, 208]], [[218, 182], [236, 206]], [[330, 152], [316, 178]]]) { line(ctx, [a, b]); ctx.stroke(); }
  ctx.fillStyle = 'rgba(226,213,190,.9)';
  for (const [x, y] of [[74, 208], [182, 182], [216, 178], [330, 152]]) { ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill(); }
  ctx.font = '700 15px system-ui, sans-serif'; ctx.fillStyle = 'rgba(203,213,225,.22)'; ctx.textAlign = 'center';
  for (const [s, x, y] of [['RA', 112, 136], ['LA', 276, 116], ['RV', 140, 232], ['LV', 300, 232]]) ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}

/** Spreading wavefronts from sources, clipped to the myocardium of one region. */
function drawWave(ctx, region, sources, p, rgb, reach) {
  if (p == null || p <= 0) return;
  ctx.save();
  const muscle = new Path2D(SHAPE.epi); muscle.addPath(new Path2D(SHAPE.right)); muscle.addPath(new Path2D(SHAPE.left));
  ctx.clip(muscle, 'evenodd'); ctx.clip(new Path2D(SHAPE[region]));
  ctx.globalCompositeOperation = 'lighten';
  const r = Math.max(4, p * reach), front = p < 1;
  for (const [x, y] of sources) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r + 5);
    g.addColorStop(0, `rgba(${rgb},.42)`);
    g.addColorStop(Math.max(0, (r - 14) / (r + 5)), `rgba(${rgb},.34)`);
    g.addColorStop(r / (r + 5), `rgba(${rgb},${front ? .95 : .34})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.fillRect(x - r - 6, y - r - 6, 2 * r + 12, 2 * r + 12);
  }
  ctx.restore();
}

function drawCable(ctx, pts, p, color) {
  ctx.strokeStyle = 'rgba(15,23,42,.9)'; ctx.lineWidth = 5.5; line(ctx, pts); ctx.stroke();
  ctx.strokeStyle = 'rgba(148,163,184,.55)'; ctx.lineWidth = 2.6; line(ctx, pts); ctx.stroke();
  if (p == null || p <= 0) return;
  const n = 28, lit = [];
  for (let i = 0; i <= n; i++) { const q = along(pts, (i / n) * p); lit.push([q.x, q.y]); }
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 10;
  ctx.strokeStyle = color; ctx.lineWidth = 3.4; line(ctx, lit); ctx.stroke();
  ctx.restore();
  if (p < 1) {
    const { x, y } = along(pts, p), g = ctx.createRadialGradient(x, y, 0, x, y, 9);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.35, color); g.addColorStop(1, 'rgba(253,224,71,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
  }
}

function drawPurkinje(ctx, side, p) {
  for (const twig of PURKINJE[side]) {
    ctx.strokeStyle = p > 0 ? `rgba(253,224,71,${(.25 + .6 * p).toFixed(2)})` : 'rgba(148,163,184,.3)';
    ctx.lineWidth = 1.3; line(ctx, twig); ctx.stroke();
  }
}

function drawBlock(ctx, pts, f) {
  const { x, y, dx, dy } = along(pts, f), nx = -dy * 10, ny = dx * 10;
  ctx.save(); ctx.shadowColor = COLOR.block; ctx.shadowBlur = 12;
  ctx.strokeStyle = COLOR.block; ctx.lineWidth = 4.5; ctx.lineCap = 'butt';
  for (const o of [-2.6, 2.6]) { line(ctx, [[x + nx + dx * o, y + ny + dy * o], [x - nx + dx * o, y - ny + dy * o]]); ctx.stroke(); }
  ctx.restore();
  return [x + nx * 1.2, y + ny * 1.2];
}

/** Chevrons across the septum, from the side that conducts to the blocked side. */
function drawSeptal(ctx, p, toRight) {
  const from = toRight ? [208, 226] : [250, 240], to = toRight ? [250, 240] : [208, 226];
  ctx.strokeStyle = '#fda4af'; ctx.lineWidth = 2.4;
  for (let i = 0; i < 3; i++) {
    const f = Math.min(p, (i + 1) / 3); if (f <= i / 3) break;
    const x = from[0] + (to[0] - from[0]) * f, y = from[1] + (to[1] - from[1]) * f, s = toRight ? 1 : -1;
    line(ctx, [[x - 6 * s, y - 6], [x, y], [x - 6 * s, y + 6]]); ctx.stroke();
  }
}

function drawNode(ctx, [x, y], active, r = 6) {
  if (active) { const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6); g.addColorStop(0, 'rgba(251,191,36,.9)'); g.addColorStop(1, 'rgba(251,191,36,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = active ? '#fbbf24' : '#94a3b8'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function drawStar(ctx, [x, y], r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * .45 : r; ctx.lineTo(x + q * Math.cos(a), y + q * Math.sin(a)); }
  ctx.closePath(); ctx.fillStyle = '#fbbf24'; ctx.fill(); ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.2; ctx.stroke();
}

/** A label with a dark halo and an optional leader line to its anchor (screen pixels). */
function tag(ctx, s, [x, y], { anchor = null, align = 'left', color = '#e2e8f0', weight = 600 } = {}) {
  if (anchor) { ctx.strokeStyle = 'rgba(203,213,225,.45)'; ctx.lineWidth = 1; line(ctx, [[x + (align === 'right' ? 2 : -2), y - 4], anchor]); ctx.stroke(); }
  ctx.font = `${weight} 11px system-ui, sans-serif`; ctx.textAlign = align; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(11,18,32,.92)'; ctx.lineWidth = 3.5; ctx.strokeText(s, x, y);
  ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.textAlign = 'left';
}

function drawSystem(ctx, pac, c) {
  ctx.setLineDash([2, 4]); ctx.strokeStyle = c.atria != null ? 'rgba(251,191,36,.55)' : 'rgba(148,163,184,.3)'; ctx.lineWidth = 1.4;
  for (const tr of TRACTS) { line(ctx, tr); ctx.stroke(); }
  ctx.setLineDash([]);
  const tone = k => (pac.bundles?.[k]?.state === 'slow' ? COLOR.slow : COLOR.fast);
  drawPurkinje(ctx, 'lv', c.lv ?? 0); drawPurkinje(ctx, 'rv', c.rv ?? 0);
  drawCable(ctx, PATHS.his, c.his, COLOR.fast);
  drawCable(ctx, PATHS.rbb, c.rbb, tone('rbb'));
  drawCable(ctx, PATHS.lbb, c.lbb, tone('lbb'));
  drawCable(ctx, PATHS.laf, c.laf, tone('laf'));
  drawCable(ctx, PATHS.lpf, c.lpf, COLOR.fast);
  drawCable(ctx, PATHS.septal, c.lpf, COLOR.fast);
  drawNode(ctx, NODE.sa, false, 4.5);
  drawNode(ctx, NODE.avn, c.avn != null && c.avn < 1 && !c.blockedAt.avn, 6.5);
  drawStar(ctx, NODE.pac, c.atria != null && c.atria < 1 ? 9 : 7);
}

/** The conduction system with the early beat at time t. */
export function drawConduction(canvas, pac, t, text) {
  const fit = fitCanvas(canvas); if (!fit) return;
  const { ctx, w, h } = fit, k = Math.min(w / VIEW.w, h / VIEW.h), ox = (w - VIEW.w * k) / 2, oy = (h - VIEW.h * k) / 2;
  const xy = ([x, y]) => [ox + x * k, oy + y * k];
  const bg = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * .7);
  bg.addColorStop(0, '#111a2e'); bg.addColorStop(1, '#070c17');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const c = conductionAt(pac, t), b = pac.bundles, blocks = [];
  ctx.save(); ctx.translate(ox, oy); ctx.scale(k, k);
  drawAnatomy(ctx);
  drawWave(ctx, 'atria', [NODE.pac], c.atria, COLOR.atria, 300);
  for (const side of ['lv', 'rv']) {
    const lateSide = b?.[side === 'lv' ? 'lbb' : 'rbb']?.state === 'block', src = SOURCES[side];
    drawWave(ctx, 'ventricles', lateSide ? src.late : src.own, c[side], COLOR.ventricles, src.reach[lateSide ? 1 : 0]);
  }
  drawSystem(ctx, pac, c);
  if (c.blockedAt.avn) blocks.push(drawBlock(ctx, PATHS.his, .05));
  if (c.blockedAt.rbb) blocks.push(drawBlock(ctx, PATHS.rbb, .22));
  if (c.blockedAt.lbb) blocks.push(drawBlock(ctx, PATHS.lbb, .55));
  if (c.blockedAt.laf) blocks.push(drawBlock(ctx, PATHS.laf, .25));
  if (c.septal > 0) drawSeptal(ctx, c.septal, b.lbb.state === 'block');
  ctx.restore();
  drawLabels(ctx, { xy, w, h, text, c, b, blocks, since: Math.round(t - pac.a) });
}

function drawLabels(ctx, { xy, w, h, text, c, b, blocks, since }) {
  tag(ctx, text.sa, xy([70, 48]), { anchor: xy([124, 68]), align: 'right' });
  tag(ctx, 'P′', xy([362, 92]), { color: '#fcd34d', weight: 700 });
  tag(ctx, text.avn, xy([150, 152]), { anchor: xy([184, 166]), align: 'right' });
  tag(ctx, text.his, xy([236, 170]), { anchor: xy([200, 184]) });
  tag(ctx, text.rbb, xy([104, 322]), { anchor: xy([142, 270]), align: 'right' });
  tag(ctx, text.lbb, xy([258, 226]), { anchor: xy([222, 208]) });
  tag(ctx, text.laf, xy([364, 196]), { anchor: xy([322, 196]) });
  tag(ctx, text.lpf, xy([358, 276]), { anchor: xy([304, 264]) });
  for (const p of blocks) { const [x, y] = xy(p); tag(ctx, text.block, [x + 6, y + 4], { color: '#fca5a5', weight: 700 }); }
  if (c.septal > .25) {
    const toRight = b.lbb.state === 'block';
    tag(ctx, text.septal, xy(toRight ? [280, 256] : [176, 214]), { color: '#fda4af', weight: 700, align: toRight ? 'left' : 'right' });
  }
  ctx.font = '600 11px ui-monospace, monospace'; ctx.textAlign = 'right'; ctx.fillStyle = '#94a3b8';
  ctx.fillText(`P′ ${since >= 0 ? '+' : '−'}${Math.abs(since)} ms`, w - 8, h - 8); ctx.textAlign = 'left';
}

// Animated schematics for the preload/afterload explorer (hemo-loads.js).
// A beating LV cross-section fills from the LA and empties into the aorta;
// wall colour follows the instantaneous Laplace stress and the wall thins as
// the cavity grows (constant wall area). A muscle-strip inset shows the
// classic isolated-muscle definitions: preload stretches the resting strip,
// afterload is the weight the strip must lift once it contracts.
import { wallStress } from './hemo-loads-model.js';

const NS = 'http://www.w3.org/2000/svg';
const CYCLE_MS = 3600;
const SCALE = 16;
const CX = 166, CY = 134;
const LA = { x: 46, y: 40 }, AO = { x: 292, y: 22 };
const MITRAL_ANGLE = Math.atan2(LA.y - CY, LA.x - CX);
const AORTIC_ANGLE = Math.atan2(AO.y - CY, AO.x - CX);
const PARTICLES = 7;
const MAX_RATIO = 2.5;

const svg = (tag, attrs = {}, text) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text) n.textContent = text;
  return n;
};
const set = (n, attrs) => { for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); };
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
const clamp01 = k => Math.min(1, Math.max(0, k));
const polar = (r, a) => ({ x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) });

// Timelines: rf = cavity radius / chosen r, pf = pressure / chosen P.
// `hold` marks the instant the explorer's numbers describe.
const SEGMENTS = {
  preload: [
    { to: 0.5, phase: 'filling', flow: 'in', rf: [0.7, 1], pf: [0.15, 1] },
    { to: 0.72, phase: 'endDiastole', hold: true, rf: [1, 1], pf: [1, 1] },
    { to: 0.8, phase: 'isovolumic', rf: [1, 1], pf: [1, 2.5] },
    { to: 0.94, phase: 'ejection', flow: 'out', rf: [1, 0.7], pf: [2.5, 2.5] },
    { to: 1, phase: 'relaxation', rf: [0.7, 0.7], pf: [2.5, 0.15] }
  ],
  afterload: [
    { to: 0.12, phase: 'isovolumic', rf: [1.2, 1.2], pf: [0.08, 1] },
    { to: 0.3, phase: 'ejection', flow: 'out', rf: [1.2, 1], pf: [1, 1] },
    { to: 0.5, phase: 'selected', flow: 'out', hold: true, rf: [1, 1], pf: [1, 1] },
    { to: 0.64, phase: 'ejection', flow: 'out', rf: [1, 0.82], pf: [1, 0.95] },
    { to: 0.74, phase: 'relaxation', rf: [0.82, 0.82], pf: [0.95, 0.08] },
    { to: 1, phase: 'filling', flow: 'in', rf: [0.82, 1.2], pf: [0.08, 0.08] }
  ]
};

export function cycleFrame(mode, u) {
  const segments = SEGMENTS[mode];
  let from = 0;
  for (const s of segments) {
    if (u <= s.to) {
      const k = ease(clamp01((u - from) / (s.to - from)));
      return { phase: s.phase, flow: s.flow || null, hold: Boolean(s.hold), rf: lerp(...s.rf, k), pf: lerp(...s.pf, k) };
    }
    from = s.to;
  }
  return cycleFrame(mode, 0);
}

// Wall area is conserved: a larger cavity means a thinner wall.
export function geometryAt(values, rf) {
  const inner = values.r * rf;
  const area = (values.r + values.h) ** 2 - values.r ** 2;
  return { inner, h: Math.sqrt(inner ** 2 + area) - inner };
}

function stressColour(ratio) {
  const k = clamp01(ratio / MAX_RATIO);
  const stops = [[0, [234, 196, 176]], [0.4, [215, 131, 112]], [1, [150, 28, 34]]];
  const i = k <= stops[1][0] ? 0 : 1;
  const [a, ca] = stops[i], [b, cb] = stops[i + 1];
  const t = (k - a) / (b - a);
  return `rgb(${ca.map((c, j) => Math.round(lerp(c, cb[j], t))).join(',')})`;
}

function arrowPath(x0, y0, x1, y1, head = 4.5) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  const p = s => `${x1 - head * Math.cos(a) + s * head * 0.7 * Math.sin(a)},${y1 - head * Math.sin(a) - s * head * 0.7 * Math.cos(a)}`;
  return `M${x0},${y0} L${x1},${y1} M${p(-1)} L${x1},${y1} L${p(1)}`;
}

function tensionPath(angle, radius, len) {
  // Tangential double arrow along the wall midline.
  const c = polar(radius, angle), t = angle + Math.PI / 2;
  const a = { x: c.x - len * Math.cos(t), y: c.y - len * Math.sin(t) };
  const b = { x: c.x + len * Math.cos(t), y: c.y + len * Math.sin(t) };
  return `${arrowPath(c.x, c.y, a.x, a.y, 4)} ${arrowPath(c.x, c.y, b.x, b.y, 4)}`;
}

function buildHeart() {
  const root = svg('svg', { viewBox: '0 0 320 268', role: 'img', class: 'load-scene' });
  const title = svg('title');
  const inflow = svg('path', { d: `M${LA.x},${LA.y} L${CX},${CY}`, stroke: '#c96f62', 'stroke-width': 20, 'stroke-linecap': 'round', fill: 'none', opacity: 0.55 });
  const outflow = svg('path', { d: `M${CX},${CY} L${AO.x},${AO.y}`, stroke: '#c0574d', 'stroke-width': 22, 'stroke-linecap': 'round', fill: 'none', opacity: 0.7 });
  const laBody = svg('ellipse', { cx: LA.x, cy: LA.y, rx: 32, ry: 22, fill: '#dc9f92', stroke: '#a1554d', 'stroke-width': 1.2 });
  const laText = svg('text', { x: LA.x, y: LA.y + 4, 'text-anchor': 'middle', class: 'scene-tag' }, 'LA');
  const aoText = svg('text', { x: AO.x - 4, y: AO.y + 30, 'text-anchor': 'middle', class: 'scene-tag' }, 'Ao');
  const ghost = svg('g', { class: 'scene-ghost' });
  const ghostInner = svg('circle', { cx: CX, cy: CY, fill: 'none', stroke: '#546560', 'stroke-dasharray': '3 4', 'stroke-width': 1 });
  const ghostOuter = svg('circle', { cx: CX, cy: CY, fill: 'none', stroke: '#546560', 'stroke-dasharray': '3 4', 'stroke-width': 1 });
  ghost.append(ghostInner, ghostOuter);
  const wall = svg('circle', { cx: CX, cy: CY, stroke: '#7d3631', 'stroke-width': 1.2 });
  const cavity = svg('circle', { cx: CX, cy: CY, fill: '#f4d5cc', stroke: '#9b4b42', 'stroke-width': 1 });
  const valves = [MITRAL_ANGLE, AORTIC_ANGLE].map(angle => {
    const gap = svg('path', { stroke: '#f4d5cc', 'stroke-width': 13, fill: 'none' });
    const leaflets = svg('path', { stroke: '#5b2c28', 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' });
    return { angle, gap, leaflets };
  });
  const pressure = svg('path', { class: 'scene-pressure', fill: 'none' });
  const tension = svg('path', { class: 'scene-tension', fill: 'none' });
  const particles = Array.from({ length: PARTICLES }, () => svg('circle', { r: 3.2, fill: '#8f1d22', opacity: 0 }));
  const radiusLine = svg('path', { stroke: '#263e3b', 'stroke-width': 1.5, 'stroke-dasharray': '2 2' });
  const radiusText = svg('text', { class: 'load-dim', 'text-anchor': 'start' }, 'r');
  const thickText = svg('text', { class: 'load-dim', 'text-anchor': 'middle' }, 'h');
  const gauge = svg('g', { transform: `translate(${AO.x - 22},${AO.y + 62})` });
  const needle = svg('line', { x1: 0, y1: 0, x2: 0, y2: -14, stroke: '#1f3d4a', 'stroke-width': 2, 'stroke-linecap': 'round' });
  const gaugeText = svg('text', { y: 30, 'text-anchor': 'middle', class: 'scene-tag' });
  gauge.append(svg('circle', { r: 18, fill: '#fdfbf6', stroke: '#6e8b95', 'stroke-width': 1.3 }),
    svg('path', { d: 'M-13,7 A15,15 0 1 1 13,7', fill: 'none', stroke: '#c9d6d9', 'stroke-width': 3 }),
    needle, svg('circle', { r: 2.5, fill: '#1f3d4a' }), gaugeText);
  const phaseBadge = svg('g', { transform: 'translate(10,250)' });
  const phaseBg = svg('rect', { x: 0, y: -14, rx: 9, height: 20, class: 'scene-phase-bg' });
  const phaseText = svg('text', { x: 9, y: 0, class: 'scene-phase' });
  phaseBadge.append(phaseBg, phaseText);
  root.append(title, inflow, outflow, laBody, laText, aoText, wall, cavity, ...valves.flatMap(v => [v.gap, v.leaflets]),
    ghost, pressure, tension, radiusLine, radiusText, thickText, ...particles, gauge, phaseBadge);
  return { root, title, wall, cavity, ghostInner, ghostOuter, valves, pressure, tension, particles, radiusLine, radiusText, thickText, needle, gaugeText, phaseBg, phaseText };
}

function buildMuscle() {
  const root = svg('svg', { viewBox: '0 0 320 132', role: 'img', class: 'load-muscle' });
  const title = svg('title');
  const ceiling = svg('path', { d: 'M58,14 L162,14', stroke: '#546560', 'stroke-width': 3 });
  const hatch = svg('path', { d: Array.from({ length: 9 }, (_, i) => `M${62 + i * 12},14 l-7,-8`).join(' '), stroke: '#8a9a94', 'stroke-width': 1 });
  const strip = svg('rect', { x: 98, y: 14, width: 24, rx: 8, fill: '#c9665a', stroke: '#8f3b35', 'stroke-width': 1.2 });
  const bands = svg('path', { stroke: '#f1c3b6', 'stroke-width': 1.2, opacity: 0.85 });
  const hook = svg('line', { x1: 110, x2: 110, stroke: '#263e3b', 'stroke-width': 1.6 });
  const weight = svg('path', { fill: '#405a52', stroke: '#22332e', 'stroke-width': 1 });
  const weightText = svg('text', { x: 110, 'text-anchor': 'middle', class: 'muscle-weight' });
  const shelf = svg('g');
  shelf.append(svg('path', { d: 'M62,0 L158,0', stroke: '#8a6d4b', 'stroke-width': 4 }),
    svg('path', { d: 'M70,0 L70,14 M150,0 L150,14', stroke: '#8a6d4b', 'stroke-width': 2 }));
  const ruler = svg('path', { stroke: '#9aa79f', 'stroke-width': 1, 'stroke-dasharray': '2 3' });
  const caption = svg('text', { x: 178, y: 30, class: 'muscle-caption' });
  const lines = [0, 1, 2, 3].map(i => svg('tspan', { x: 178, dy: i ? 16 : 0 }));
  caption.append(...lines);
  const state = svg('text', { x: 178, y: 106, class: 'muscle-state' });
  const restMark = svg('path', { stroke: '#426d80', 'stroke-width': 1.2, 'stroke-dasharray': '3 3' });
  root.append(title, ceiling, hatch, ruler, restMark, shelf, strip, bands, hook, weight, weightText, caption, state);
  return { root, title, strip, bands, hook, weight, weightText, shelf, ruler, lines, state, restMark };
}

function drawWeight(m, x, top, ratio) {
  const w = 18 + 18 * clamp01(ratio / MAX_RATIO), hgt = 14 + 10 * clamp01(ratio / MAX_RATIO);
  set(m.weight, { d: `M${x - w / 2 + 4},${top} L${x + w / 2 - 4},${top} L${x + w / 2},${top + hgt} L${x - w / 2},${top + hgt} Z` });
  set(m.weightText, { y: top + hgt / 2 + 4 });
  return hgt;
}

function drawMuscle(m, mode, frame, ratio) {
  // Lengths in px. Resting strip 46 px; preload stretches it before contraction.
  const contracting = ['isovolumic', 'ejection', 'selected'].includes(frame.phase);
  const k = clamp01(ratio / MAX_RATIO);
  let length, onShelf = false;
  if (mode === 'preload') {
    const stretched = 46 + 34 * k;
    length = frame.phase === 'ejection' ? lerp(stretched, stretched * 0.8, clamp01((frame.rf - 1) / -0.3)) : stretched;
    if (frame.phase === 'filling') length = lerp(46, stretched, clamp01((frame.rf - 0.7) / 0.3));
  } else {
    // Afterload: weight rests on a shelf, so the resting strip is not stretched.
    // During ejection the strip lifts it; a heavier weight is lifted less.
    const maxLift = 30 * (1 - k * 0.85);
    const lift = frame.phase === 'ejection' || frame.phase === 'selected' ? clamp01((1.2 - frame.rf) / 0.38) * maxLift : 0;
    length = 64 - lift; onShelf = lift < 0.5;
  }
  const top = 14, bottom = top + length;
  set(m.strip, { y: top, height: length, width: contracting ? 28 : 24, x: contracting ? 96 : 98 });
  const n = 6, gap = length / n;
  set(m.bands, { d: Array.from({ length: n - 1 }, (_, i) => `M${contracting ? 99 : 101},${top + gap * (i + 1)} L${contracting ? 121 : 119},${top + gap * (i + 1)}`).join(' ') });
  set(m.hook, { y1: bottom, y2: bottom + 10 });
  const hgt = drawWeight(m, 110, bottom + 10, ratio);
  const shelfY = mode === 'afterload' ? 14 + 64 + 10 + hgt : -100;
  m.shelf.setAttribute('transform', `translate(0,${shelfY})`);
  m.shelf.style.display = mode === 'afterload' ? '' : 'none';
  set(m.restMark, { d: mode === 'preload' ? 'M84,60 L136,60' : '' });
  set(m.ruler, { d: mode === 'preload' ? `M90,60 L90,${bottom}` : '' });
  return { onShelf, contracting };
}

export function createLoadScene({ signal } = {}) {
  const heart = buildHeart();
  const muscle = buildMuscle();
  const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let state = null, start = performance.now(), raf = 0, timer = 0, frozenAt = null;

  function render(now) {
    if (!state) return;
    const { mode, values, base, text } = state;
    const u = frozenAt ?? ((now - start) % CYCLE_MS) / CYCLE_MS;
    const frame = cycleFrame(mode, u);
    const g = geometryAt(values, frame.rf);
    const p = values.p * frame.pf;
    const sigma = wallStress({ p, r: g.inner, h: g.h });
    const ratio = sigma / wallStress(base);
    const inner = g.inner * SCALE, outer = (g.inner + g.h) * SCALE;
    set(heart.wall, { r: outer, fill: stressColour(ratio) });
    set(heart.cavity, { r: inner });
    set(heart.ghostInner, { r: base.r * SCALE });
    set(heart.ghostOuter, { r: (base.r + base.h) * SCALE });
    for (const v of heart.valves) {
      const open = (v.angle === MITRAL_ANGLE && frame.flow === 'in') || (v.angle === AORTIC_ANGLE && frame.flow === 'out');
      const a = polar(inner - 1, v.angle), b = polar(outer + 1, v.angle);
      set(v.gap, { d: `M${a.x},${a.y} L${b.x},${b.y}`, opacity: open ? 1 : 0 });
      const t = v.angle + Math.PI / 2, w = 7;
      const hinge = s => polar(inner, v.angle + s * w / Math.max(inner, 1));
      const tip = s => (open
        ? { x: hinge(s).x - 9 * Math.cos(v.angle), y: hinge(s).y - 9 * Math.sin(v.angle) }
        : { x: polar(inner, v.angle).x + s * 0.5 * Math.cos(t), y: polar(inner, v.angle).y + s * 0.5 * Math.sin(t) });
      set(v.leaflets, { d: [-1, 1].map(s => `M${hinge(s).x},${hinge(s).y} L${tip(s).x},${tip(s).y}`).join(' ') });
    }
    // Blue arrows: cavity pressure pushing the wall outward (length grows with P).
    const len = Math.min(6 + p / 220 * 22, Math.max(inner - 8, 4) * 0.55);
    set(heart.pressure, { d: [Math.PI / 4, (3 * Math.PI) / 4, Math.PI * 0.5 + Math.PI].map(a => {
      const tip = polar(inner - 3, a), tail = polar(inner - 3 - len, a);
      return arrowPath(tail.x, tail.y, tip.x, tip.y);
    }).join(' ') });
    // Dark arrows: wall stress resisting it (length grows with sigma).
    const tlen = 4 + 13 * clamp01(ratio / MAX_RATIO);
    set(heart.tension, { d: [0, Math.PI].map(a => tensionPath(a, (inner + outer) / 2, tlen)).join(' ') });
    const rEnd = polar(inner, Math.PI / 2);
    set(heart.radiusLine, { d: `M${CX},${CY} L${rEnd.x},${rEnd.y}` });
    set(heart.radiusText, { x: CX + 5, y: CY + inner / 2 + 4 });
    const hPos = polar(outer + 9, Math.PI * 0.8);
    set(heart.thickText, { x: hPos.x, y: hPos.y + 4 });
    const flowPath = frame.flow === 'in' ? [LA, { x: CX, y: CY }] : frame.flow === 'out' ? [{ x: CX, y: CY }, AO] : null;
    heart.particles.forEach((c, i) => {
      if (!flowPath || reduced) return set(c, { opacity: 0 });
      const s = (((now - start) / 900) + i / PARTICLES) % 1;
      set(c, { cx: lerp(flowPath[0].x, flowPath[1].x, s), cy: lerp(flowPath[0].y, flowPath[1].y, s), opacity: s < 0.08 || s > 0.92 ? 0 : 0.9 });
    });
    const sweep = clamp01(p / 220);
    const na = (-135 + 270 * sweep) * Math.PI / 180;
    set(heart.needle, { x2: 14 * Math.sin(na), y2: -14 * Math.cos(na) });
    heart.gaugeText.textContent = `P ${Math.round(p)}`;
    heart.phaseText.textContent = text.phases[frame.phase];
    heart.phaseBg.setAttribute('width', String(18 + text.phases[frame.phase].length * 6.1));
    heart.phaseBg.classList.toggle('is-hold', frame.hold);
    heart.title.textContent = text.sceneTitle;

    const load = wallStress(values) / wallStress(base);
    const m = drawMuscle(muscle, mode, frame, load);
    muscle.weightText.textContent = `${load.toFixed(1)}×`;
    const cap = text.muscle[mode];
    muscle.lines.forEach((l, i) => { l.textContent = cap[i] || ''; });
    muscle.state.textContent = mode === 'afterload'
      ? (m.contracting ? (m.onShelf ? text.muscleState.tension : text.muscleState.lift) : text.muscleState.rest)
      : (m.contracting ? text.muscleState.contract : text.muscleState.stretch);
    muscle.title.textContent = text.muscleTitle;
  }

  function loop(now) {
    raf = 0; timer = 0;
    if (signal?.aborted) return;
    if (heart.root.isConnected && heart.root.getClientRects().length) {
      render(now);
      raf = requestAnimationFrame(loop);
    } else {
      timer = setTimeout(() => loop(performance.now()), 400);
    }
  }

  signal?.addEventListener('abort', () => { cancelAnimationFrame(raf); clearTimeout(timer); });
  return {
    heart: heart.root,
    muscle: muscle.root,
    update(next) {
      const modeChanged = state?.mode !== next.mode;
      state = next;
      if (modeChanged) start = performance.now();
      if (reduced) { frozenAt = next.mode === 'preload' ? 0.6 : 0.4; render(performance.now()); return; }
      if (!raf && !timer) loop(performance.now());
      else render(performance.now());
    }
  };
}

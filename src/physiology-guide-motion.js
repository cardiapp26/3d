// Live layer of the visual physiology guide. The static drawings live in
// physiology-guide.js; this module holds the beat tracker on the shared cycle
// clock, the ECG pen strip and the per-topic animators. Animators build their
// moving SVG nodes once per static draw and then only call setAttribute on
// each clock frame.
import { CYCLE_SYNC, phaseToTime, timeToPhase } from './cardiac-cycle.js';
import { ventricularSample } from './physiology-model.js';
import { cycleShape } from './pathophysiology/cycle-clock.js';

const NS = 'http://www.w3.org/2000/svg';
export const BPM = 72;
export const RR_MS = 60000 / BPM;
const wrap = x => ((x % 1) + 1) % 1;
const clamp01 = x => Math.min(1, Math.max(0, x));

export function sv(tag, attrs = {}, text) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text) n.textContent = text;
  return n;
}
export const polyPath = points => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
const setText = (node, text) => { if (node.textContent !== text) node.textContent = text; };
const setLive = (node, on) => node.classList.toggle('is-live', on);

// Electrical anchors on the cycle (cardiac-cycle.js timing at 72/min).
const QRS_TAU = phaseToTime(CYCLE_SYNC.qrsOnset, BPM);
const P_ONSET_TAU = phaseToTime(CYCLE_SYNC.pPeak, BPM) - 45 / RR_MS;
const msAfter = (u, tau0) => wrap(phaseToTime(u, BPM) - tau0) * RR_MS;
export const msSinceQrs = u => msAfter(u, QRS_TAU);
export const msSinceP = u => msAfter(u, P_ONSET_TAU);

/** Fraction of the ejection window completed at phase u (0 before, 1 after). */
export const ejectFraction = u => clamp01((u - CYCLE_SYNC.ejectionStart) / (CYCLE_SYNC.ivrStart - CYCLE_SYNC.ejectionStart));

/** Point at arc-length fraction f along a polyline. */
export function pointAlong(points, f) {
  const segs = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  let left = clamp01(f) * segs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) {
    if (left <= segs[i] || i === segs.length - 1) {
      const k = segs[i] ? Math.min(1, left / segs[i]) : 0, [a, b] = [points[i], points[i + 1]];
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
    left -= segs[i];
  }
  return points[0];
}

/** Absolute area (shoelace) of a polygon of { v, p } points, in mmHg·ml. */
export function loopArea(points) {
  let sum = 0;
  points.forEach((a, i) => { const b = points[(i + 1) % points.length]; sum += a.v * b.p - b.v * a.p; });
  return Math.abs(sum) / 2;
}

// Irregularly irregular RR in AF: a deterministic pseudo-random spread
// (about 520 to 1150 ms) so every visit shows the same sequence.
const hash = n => { const x = Math.sin(n * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); };
const afRr = index => RR_MS * (0.62 + 0.76 * hash(index));

/**
 * Beat tracker on the clock. In sinus rhythm the beat-local phase u follows
 * the clock; in AF each beat gets its own RR, so u runs faster or slower.
 * Paused or scrubbed: u locks to the clock phase.
 */
export function createBeatTracker() {
  let rhythm = 'sinus', last = null, u = 0;
  let beats = [{ start: 0, rr: RR_MS, index: 0, rhythm: 'sinus' }];
  const current = () => beats[beats.length - 1];
  const snapshot = () => { const b = current(); return { u, rr: b.rr, beat: b.index, time: b.start + phaseToTime(u, BPM) * b.rr, rhythm: b.rhythm }; };
  function nextBeat() {
    const b = current(), index = b.index + 1, rr = rhythm === 'afib' ? afRr(index) : RR_MS;
    beats = [...beats.slice(-11), { start: b.start + b.rr, rr, index, rhythm }];
  }
  function advance(phase) {
    let d = wrap(phase - last);
    if (d > 0.5) d = 0;
    u += d * RR_MS / current().rr;
    while (u >= 1) { u -= 1; nextBeat(); }
  }
  return {
    snapshot,
    update(state, nextRhythm = 'sinus') {
      rhythm = nextRhythm;
      if (state.playing && last != null) advance(state.phase); else u = state.phase;
      last = state.phase;
      return snapshot();
    },
    /** Beat-local phase and rhythm at absolute time T (ms, real time within each RR) from the recent beats, or null. */
    at(T) {
      for (let i = beats.length - 1; i >= 0; i--) {
        const b = beats[i];
        if (T >= b.start) return { u: timeToPhase(Math.min(0.9999, (T - b.start) / b.rr), BPM), rhythm: b.rhythm };
      }
      return null;
    }
  };
}

/** Sweeping pen strip (monitor style): new trace left of the pen, old trace right of a small gap. */
export function createPenStrip(parent, { x, y, w, h, windowMs = 2600, lo = -0.4, hi = 1.4 }) {
  const trace = sv('path', { class: 'phys-pen-trace' }), pen = sv('circle', { r: 3.5, class: 'phys-pen-dot' });
  parent.append(sv('rect', { x, y, width: w, height: h, class: 'phys-pen-bg' }), trace, pen);
  const N = 260, GAP = 0.035, yOf = v => y + h - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo) * h;
  return {
    update(now, valueAt) {
      const sweep = Math.floor(now / windowMs), pos = (now - sweep * windowMs) / windowMs;
      let d = '', lift = true;
      for (let i = 0; i <= N; i++) {
        const f = i / N, T = (f <= pos ? sweep : sweep - 1) * windowMs + f * windowMs;
        const v = f > pos && f < pos + GAP ? null : valueAt(T);
        if (v == null) { lift = true; continue; }
        d += `${lift ? 'M' : 'L'}${(x + f * w).toFixed(1)} ${yOf(v).toFixed(1)}`;
        lift = false;
      }
      trace.setAttribute('d', d);
      const v = valueAt(now) ?? 0;
      pen.setAttribute('cx', (x + pos * w).toFixed(1)); pen.setAttribute('cy', yOf(v).toFixed(1));
    }
  };
}

/* ---------- Ionic phases: AP pen with ion arrows ---------- */
const AP = { x0: 64, x1: 560, top: 42, bottom: 206, lo: -100, hi: 40 };
const apX = ms => AP.x0 + ms / RR_MS * (AP.x1 - AP.x0);
const apY = mv => AP.bottom - (mv - AP.lo) / (AP.hi - AP.lo) * (AP.bottom - AP.top);
const AP_PHASES = [[0, 8], [8, 35], [35, 180], [180, 310], [310, RR_MS]];
const IONS = [
  { key: 'na', name: 'Na⁺', x: 150, inward: true, peak: 1, color: '#dc9142' },
  { key: 'ca', name: 'Ca²⁺', x: 305, inward: true, peak: 0.32, color: '#467daa' },
  { key: 'k', name: 'K⁺', x: 460, inward: false, peak: 0.57, color: '#c45252' }
];
const MEMBRANE = { top: 262, bottom: 282, from: 236, to: 310 };
const voltageAt = ms => (ms >= 0 && ms <= 360 ? ventricularSample(ms).voltage : -90);
const currentAt = (key, ms) => (ms >= 0 && ms <= 360 ? Math.abs(ventricularSample(ms)[key]) : 0);
// Peak hold over 80 ms so the 8 ms Na⁺ burst stays visible at playback speed.
const heldCurrent = (key, ms) => Math.max(...[0, 20, 40, 60, 80].map(s => currentAt(key, ms - s)));
const apPhaseAt = ms => AP_PHASES.findIndex(([a, b]) => ms >= a && ms < b);

function drawApAxes(svg, step, label) {
  for (const mv of [-90, -60, -30, 0, 30]) {
    svg.append(sv('path', { d: `M${AP.x0} ${apY(mv)}H${AP.x1}`, class: 'phys-grid' }));
    label(svg, AP.x0 - 6, apY(mv) + 4, String(mv), { 'text-anchor': 'end' });
  }
  AP_PHASES.forEach(([a, b], i) => {
    svg.append(sv('rect', { x: apX(a), y: AP.top, width: Math.max(2, apX(b) - apX(a)), height: AP.bottom - AP.top, class: i === step ? 'phys-ap-band is-active' : 'phys-ap-band' }));
    label(svg, i === 0 ? apX(a) - 4 : (apX(a) + apX(Math.min(b, 420))) / 2, AP.top - 6, String(i), { 'text-anchor': 'middle', class: 'phys-ap-num' });
  });
  for (const ms of [0, 200, 400, 600, 800]) label(svg, apX(ms), AP.bottom + 18, String(ms), { 'text-anchor': 'middle' });
  label(svg, AP.x1 + 14, AP.bottom + 18, 'ms', { 'text-anchor': 'end' });
  label(svg, 8, 24, 'mV');
  const ghost = Array.from({ length: 181 }, (_, i) => { const ms = i * 2; return [apX(ms), apY(voltageAt(ms))]; });
  svg.append(sv('path', { d: `${polyPath(ghost)}H${AP.x1}`, class: 'phys-ap-ghost' }));
}

function drawIonChannel(svg, ion, label) {
  const g = sv('g', { class: 'phys-ion', 'data-ion': ion.key });
  const [y0, y1] = ion.inward ? [MEMBRANE.from, MEMBRANE.to] : [MEMBRANE.to, MEMBRANE.from], dir = ion.inward ? 1 : -1;
  g.append(sv('rect', { x: ion.x - 11, y: MEMBRANE.top - 6, width: 22, height: MEMBRANE.bottom - MEMBRANE.top + 12, rx: 6, class: 'phys-ion-channel' }));
  g.append(sv('path', { d: `M${ion.x} ${y0}V${y1} M${ion.x - 6} ${y1 - 9 * dir}L${ion.x} ${y1}L${ion.x + 6} ${y1 - 9 * dir}`, stroke: ion.color, class: 'phys-ion-arrow' }));
  const dots = [0, 1, 2].map(() => { const c = sv('circle', { cx: ion.x, cy: y0, r: 4, fill: ion.color, class: 'phys-ion-dot' }); g.append(c); return c; });
  svg.append(g);
  label(svg, ion.x + 16, ion.inward ? MEMBRANE.from + 10 : MEMBRANE.to - 2, ion.name, { fill: ion.color, class: 'phys-ion-name' });
  return { ion, g, dots, y0, y1 };
}

/** Static ionic-phase drawing plus its live updater. */
export function drawIonicTopic(svg, { step, tr, label }) {
  drawApAxes(svg, step, label);
  svg.append(sv('rect', { x: AP.x0, y: MEMBRANE.top, width: AP.x1 - AP.x0, height: MEMBRANE.bottom - MEMBRANE.top, class: 'phys-ion-membrane' }));
  label(svg, AP.x1, MEMBRANE.top - 6, tr('Hücre dışı', 'Outside'), { 'text-anchor': 'end' });
  label(svg, AP.x1, MEMBRANE.bottom + 16, tr('Hücre içi', 'Inside'), { 'text-anchor': 'end' });
  const channels = IONS.map(ion => drawIonChannel(svg, ion, label));
  const pen = sv('path', { class: 'phys-ap-pen' }), tip = sv('circle', { r: 5, class: 'phys-pen-dot' });
  const readout = sv('text', { x: AP.x1, y: 24, 'text-anchor': 'end', class: 'phys-live-text' });
  svg.append(pen, tip, readout);
  return snap => {
    const ms = msSinceQrs(snap.u), n = Math.max(1, Math.ceil(ms / 3));
    const pts = Array.from({ length: n + 1 }, (_, i) => { const t = ms * i / n; return [apX(t), apY(voltageAt(t))]; });
    pen.setAttribute('d', polyPath(pts));
    tip.setAttribute('cx', apX(ms).toFixed(1)); tip.setAttribute('cy', apY(voltageAt(ms)).toFixed(1));
    for (const ch of channels) updateIonChannel(ch, ms);
    setText(readout, `${tr('Faz', 'Phase')} ${apPhaseAt(ms)} · ${Math.round(voltageAt(ms))} mV · ${Math.round(ms)} ms`);
  };
}

function updateIonChannel({ ion, g, dots, y0, y1 }, ms) {
  const a = clamp01(heldCurrent(ion.key, ms) / ion.peak);
  g.setAttribute('opacity', (0.14 + 0.86 * a).toFixed(2));
  dots.forEach((dot, k) => {
    const f = wrap(ms / 150 + k / 3);
    dot.setAttribute('cy', (y0 + (y1 - y0) * f).toFixed(1));
    dot.setAttribute('opacity', (a * Math.sin(Math.PI * f)).toFixed(2));
  });
}

/* ---------- Calcium: Ca²⁺ tokens and sarcomere ---------- */
// Stage windows in ms after QRS onset (AP upstroke): trigger entry, release,
// troponin binding / cross-bridges, SERCA reuptake, NCX extrusion.
const CA_STAGES = [[0, 70], [20, 170], [60, 380], [180, 620], [240, 680]];
const TOKENS = 4;

function drawSarcomere(svg, tr) {
  const g = sv('g', { class: 'phys-sarcomere' });
  const parts = { zl: sv('path', { class: 'phys-z' }), zr: sv('path', { class: 'phys-z' }), al: sv('path', { class: 'phys-actin' }), ar: sv('path', { class: 'phys-actin' }) };
  g.append(sv('path', { d: 'M486 262H550 M486 270H550 M486 278H550', class: 'phys-myosin' }), parts.al, parts.ar, parts.zl, parts.zr);
  svg.append(g, sv('text', { x: 518, y: 238, 'text-anchor': 'middle' }, tr('Sarkomer', 'Sarcomere')));
  return contraction => {
    const half = 66 - 18 * contraction, l = 518 - half, r = 518 + half;
    parts.zl.setAttribute('d', `M${l.toFixed(1)} 248V292`); parts.zr.setAttribute('d', `M${r.toFixed(1)} 248V292`);
    parts.al.setAttribute('d', `M${l.toFixed(1)} 258h46 M${l.toFixed(1)} 266h46 M${l.toFixed(1)} 274h46 M${l.toFixed(1)} 282h46`);
    parts.ar.setAttribute('d', `M${r.toFixed(1)} 258h-46 M${r.toFixed(1)} 266h-46 M${r.toFixed(1)} 274h-46 M${r.toFixed(1)} 282h-46`);
  };
}

/** Ca²⁺ tokens along each stage path; stage nodes glow while their window is open. */
export function createCalciumLive(svg, { stages, paths, tr }) {
  const tokens = paths.map(() => Array.from({ length: TOKENS }, () => { const c = sv('circle', { r: 4.5, class: 'phys-ca-token' }); svg.append(c); return c; }));
  const owners = new Map();
  stages.forEach((nodes, i) => nodes.forEach(n => owners.set(n, [...(owners.get(n) || []), i])));
  const sarcomere = drawSarcomere(svg, tr);
  const readout = sv('text', { x: 585, y: 316, 'text-anchor': 'end', class: 'phys-live-text' });
  svg.append(readout);
  return snap => {
    const ms = msSinceQrs(snap.u), open = CA_STAGES.map(([a, b]) => ms >= a && ms < b);
    tokens.forEach((list, i) => list.forEach((dot, k) => {
      const [a, b] = CA_STAGES[i], f = (ms - a) / (b - a) * 1.35 - k * 0.12, on = f >= 0 && f <= 1;
      const [x, y] = pointAlong(paths[i], f);
      dot.setAttribute('cx', x.toFixed(1)); dot.setAttribute('cy', y.toFixed(1)); dot.setAttribute('opacity', on ? '1' : '0');
    }));
    owners.forEach((ids, node) => setLive(node, ids.some(i => open[i])));
    const contraction = cycleShape(snap.u).contraction;
    sarcomere(contraction);
    setText(readout, `${Math.round(ms)} ms · ${tr('kısalma', 'shortening')} ${Math.round(contraction * 100)}%`);
  };
}

/* ---------- Conduction: activation wave and ECG pen ---------- */
// Wavefront route, [ms after P onset, point]; shared trunk then two branches.
const TRUNK = [[0, [81, 59]], [22, [192, 59]], [32, [272, 84]], [40, [262, 140]], [110, [300, 140]], [122, [306, 210]], [140, [306, 242]]];
const BRANCHES = [[[165, [183, 280]], [205, [150, 340]]], [[165, [454, 280]], [205, [490, 340]]]];
const LIT = { sa: [0, 60], transitional: [12, 70], av: [30, 122], his: [112, 165], branches: [150, 215], purkinje: [180, 245] };

function routePoint(route, ms) {
  if (ms <= route[0][0]) return route[0][1];
  for (let i = 1; i < route.length; i++) {
    const [t1, p1] = route[i], [t0, p0] = route[i - 1];
    if (ms <= t1) { const k = (ms - t0) / (t1 - t0); return [p0[0] + (p1[0] - p0[0]) * k, p0[1] + (p1[1] - p0[1]) * k]; }
  }
  return route[route.length - 1][1];
}

function conductionStage(ms, tr) {
  if (ms < 32) return tr('SA → atriyumlar', 'SA → atria');
  if (ms < 112) return tr('AV düğüm gecikmesi', 'AV nodal delay');
  if (ms < 150) return 'His';
  if (ms < 190) return tr('Sağ / sol dal', 'Right / left branch');
  if (ms < 250) return tr('Purkinje → ventrikül', 'Purkinje → ventricles');
  return tr('Repolarizasyon · diyastol', 'Repolarization · diastole');
}

/** Purkinje fan under each branch (static), returns its nodes. */
export function drawPurkinje(svg, label) {
  const nodes = [183, 454].map(cx => {
    const d = [-48, -24, 0, 24, 48].map(dx => `M${cx} 312Q${cx + dx * 0.4} 326 ${cx + dx} 342`).join(' ');
    const n = sv('path', { d, class: 'phys-purkinje' }); svg.append(n); return n;
  });
  label(svg, 300, 338, 'Purkinje', { 'text-anchor': 'middle' });
  return nodes;
}

/** Activation wave SA → atria → AV node → His → branches → Purkinje, with a live lead II pen. */
export function createConductionLive(svg, { nodes, tracker, ecg, tr }) {
  const atrial = sv('circle', { cx: 81, cy: 59, r: 10, class: 'phys-atrial-wave' });
  const fronts = BRANCHES.map(() => sv('circle', { r: 7, class: 'phys-wavefront' }));
  const readout = sv('text', { x: 585, y: 22, 'text-anchor': 'end', class: 'phys-live-text' });
  svg.append(atrial, ...fronts, readout, sv('text', { x: 20, y: 392 }, 'II'));
  const strip = createPenStrip(svg, { x: 64, y: 362, w: 494, h: 62 });
  const valueAt = T => { const at = tracker.at(T); return at ? ecg(at.u, at.rhythm) : null; };
  return snap => {
    const ms = msSinceP(snap.u);
    atrial.setAttribute('r', (10 + Math.min(ms, 95) * 2.1).toFixed(1));
    atrial.setAttribute('opacity', ms < 95 ? (0.45 * (1 - ms / 95)).toFixed(2) : '0');
    fronts.forEach((dot, i) => {
      const [x, y] = routePoint([...TRUNK, ...BRANCHES[i]], ms);
      dot.setAttribute('cx', x.toFixed(1)); dot.setAttribute('cy', y.toFixed(1)); dot.setAttribute('opacity', ms < 225 ? '1' : '0');
    });
    for (const [key, [a, b]] of Object.entries(LIT)) for (const n of nodes[key] || []) setLive(n, ms >= a && ms < b);
    setText(readout, `${Math.round(ms)} ms · ${conductionStage(ms, tr)}`);
    strip.update(snap.time, valueAt);
  };
}

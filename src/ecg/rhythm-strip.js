// Six-second rhythm strip with a ladder diagram for the arrhythmia gallery.
// Events come from ecg-lab-model.js (rhythmEvents); here they are paired
// (which P conducts to which QRS), drawn on calibrated ECG paper with the
// P waves marked, and laid out on A / AV / V rows for orientation.
// Teaching drawings, not patient recordings.
import { rhythmEvents } from './ecg-lab-model.js';

export const STRIP_SECONDS = 6;
const PR_WINDOW = [0.1, 0.36];          // s: a P conducts if a QRS follows within this window
const FLUTTER_CYCLE = 0.2;              // s: 300/min atrial flutter in ecg-lab-model.js

/**
 * Atrial and ventricular events and how they relate.
 * atrial: [{ at, kind: 'p' | 'f' | 'F', conducted: boolean, qrs?: index }]
 * ventricular: [{ at, width, pvc, origin: 'conducted' | 'escape' | 'ectopic' | 'af' }]
 */
export function rhythmLadder(kind) {
  const { p, q } = rhythmEvents(kind);
  const ventricular = q.map(e => ({ ...e, origin: e.pvc ? 'ectopic' : kind === 'complete' ? 'escape' : kind === 'af' ? 'af' : 'conducted' }));
  if (kind === 'af') return { atrial: [], ventricular, fibrillation: true };
  if (kind === 'flutter') {
    const atrial = [];
    for (let at = 0; at < STRIP_SECONDS; at += FLUTTER_CYCLE) atrial.push({ at, kind: 'F', conducted: false });
    ventricular.forEach((v, i) => {
      const f = atrial.filter(a => a.at <= v.at - 0.12).pop();
      if (f) { f.conducted = true; f.qrs = i; }
    });
    return { atrial, ventricular, fibrillation: false };
  }
  const used = new Set();
  const atrial = p.map(at => {
    if (kind === 'complete') return { at, kind: 'p', conducted: false, dissociated: true };
    const i = ventricular.findIndex((v, k) => !used.has(k) && v.origin === 'conducted' && v.at - at >= PR_WINDOW[0] && v.at - at <= PR_WINDOW[1]);
    if (i < 0) return { at, kind: 'p', conducted: false };
    used.add(i);
    return { at, kind: 'p', conducted: true, qrs: i, pr: ventricular[i].at - at };
  });
  return { atrial, ventricular, fibrillation: false };
}

// mV at time t (s). P waves are drawn as smooth 0.2 mV domes so they read clearly.
export function stripSample(t, kind, ladder = rhythmLadder(kind)) {
  const g = (c, w, a) => a * Math.exp(-(((t - c) / w) ** 2));
  let mv = 0;
  if (kind === 'af') mv += 0.05 * Math.sin(t * 47) + 0.035 * Math.sin(t * 83 + 1) + 0.02 * Math.sin(t * 131 + 2);
  if (kind === 'flutter') { const u = (t / FLUTTER_CYCLE) % 1; mv += u < 0.75 ? 0.06 - 0.28 * (u / 0.75) : -0.22 + 0.28 * ((u - 0.75) / 0.25); }
  for (const a of ladder.atrial) if (a.kind === 'p') mv += g(a.at + 0.045, 0.024, 0.2);
  for (const v of ladder.ventricular) {
    const s = v.at;
    if (v.pvc) mv += g(s + 0.04, 0.03, -0.35) + g(s + 0.08, 0.035, 1.25) + g(s + 0.32, 0.08, -0.45);
    else if (v.width > 0.1) mv += g(s + 0.035, 0.022, 0.95) + g(s + 0.085, 0.025, -0.35) + g(s + 0.36, 0.07, 0.3);
    else mv += g(s + 0.012, 0.007, -0.1) + g(s + 0.03, 0.009, 1.15) + g(s + 0.05, 0.009, -0.3) + g(s + 0.29, 0.06, 0.32);
  }
  return mv;
}

const NS = 'http://www.w3.org/2000/svg';
const node = (tag, attrs = {}, text) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  return n;
};

const LAYOUT = Object.freeze({ x: 54, w: 690, top: 34, paperMm: 30, ladderTop: 208, row: 30 });

/** Draw the strip and ladder into `svg` (viewBox 0 0 760 320). `t` maps TR/EN labels. */
export function drawRhythmStrip(svg, kind, t) {
  const ladder = rhythmLadder(kind);
  const pxPerS = LAYOUT.w / STRIP_SECONDS, mm = pxPerS / 25, h = LAYOUT.paperMm * mm, base = LAYOUT.top + h * 0.62;
  const X = s => LAYOUT.x + s * pxPerS, Y = mv => base - mv * 10 * mm;
  svg.replaceChildren();
  svg.setAttribute('viewBox', '0 0 760 320');
  // Paper: 1 mm and 5 mm boxes at 25 mm/s, 10 mm/mV.
  const minor = [], major = [];
  for (let i = 0; i * mm <= LAYOUT.w + 0.1; i++) (i % 5 ? minor : major).push(`M${(LAYOUT.x + i * mm).toFixed(1)},${LAYOUT.top}v${h.toFixed(1)}`);
  for (let i = 0; i * mm <= h + 0.1; i++) (i % 5 ? minor : major).push(`M${LAYOUT.x},${(LAYOUT.top + i * mm).toFixed(1)}h${LAYOUT.w}`);
  svg.append(node('rect', { x: LAYOUT.x, y: LAYOUT.top, width: LAYOUT.w, height: h, class: 'rs-paper' }),
    node('path', { d: minor.join(''), class: 'rs-grid-minor' }), node('path', { d: major.join(''), class: 'rs-grid-major' }));
  // P bands behind the trace, coloured by conduction.
  for (const a of ladder.atrial) {
    if (a.kind !== 'p') continue;
    const cls = a.dissociated ? 'rs-p-dissociated' : a.conducted ? 'rs-p-conducted' : 'rs-p-blocked';
    svg.append(node('rect', { x: X(a.at - 0.01), y: LAYOUT.top, width: (0.11 * pxPerS).toFixed(1), height: h, class: `rs-p-band ${cls}` }));
  }
  const pts = [];
  for (let i = 0; i <= LAYOUT.w * 2; i++) { const s = (i / (LAYOUT.w * 2)) * STRIP_SECONDS; pts.push(`${i ? 'L' : 'M'}${X(s).toFixed(1)},${Y(stripSample(s, kind, ladder)).toFixed(1)}`); }
  svg.append(node('path', { d: pts.join(''), class: 'rs-trace' }));
  // Marks right above the waves.
  for (const a of ladder.atrial) {
    if (a.kind !== 'p') continue;
    const cls = a.dissociated ? 'rs-mark-dissociated' : a.conducted ? 'rs-mark-p' : 'rs-mark-blocked';
    svg.append(node('text', { x: X(a.at + 0.045), y: Y(0.2) - 6, class: `rs-mark ${cls}`, 'text-anchor': 'middle' }, a.conducted || a.dissociated ? 'P' : 'P×'));
    if (a.conducted) {
      const y = base + 6 * mm;
      svg.append(node('path', { d: `M${X(a.at)},${y - 4}v4H${X(a.at + a.pr)}v-4`, class: 'rs-pr' }),
        node('text', { x: (X(a.at) + X(a.at + a.pr)) / 2, y: y + 11, class: 'rs-pr-text', 'text-anchor': 'middle' }, `${Math.round(a.pr * 1000)}`));
    }
  }
  if (kind === 'flutter') for (const a of ladder.atrial) svg.append(node('text', { x: X(a.at + 0.15), y: LAYOUT.top + h - 7, class: 'rs-mark rs-mark-f', 'text-anchor': 'middle' }, 'F'));
  if (kind === 'af') svg.append(node('text', { x: X(0.08), y: LAYOUT.top + h - 7, class: 'rs-mark rs-mark-f' }, t.fWaves));
  for (const v of ladder.ventricular) {
    const peak = v.pvc ? 0.08 : v.width > 0.1 ? 0.035 : 0.03;
    svg.append(node('text', { x: X(v.at + peak), y: LAYOUT.top + 11, class: `rs-mark ${v.pvc ? 'rs-mark-pvc' : 'rs-mark-r'}`, 'text-anchor': 'middle' }, v.pvc ? 'PVC' : 'R'));
  }
  for (let s = 0; s <= STRIP_SECONDS; s++) svg.append(node('text', { x: X(s), y: LAYOUT.top + h + 13, class: 'rs-sec', 'text-anchor': 'middle' }, `${s} s`));

  // Ladder: A, AV, V rows.
  const L = LAYOUT.ladderTop, R = LAYOUT.row, aTop = L, avTop = L + R, vTop = L + 2 * R, bottom = L + 3 * R;
  for (const [y, label] of [[aTop, 'A'], [avTop, 'AV'], [vTop, 'V']]) {
    svg.append(node('rect', { x: LAYOUT.x, y, width: LAYOUT.w, height: R, class: 'rs-row' }), node('text', { x: LAYOUT.x - 8, y: y + R / 2 + 4, class: 'rs-row-label', 'text-anchor': 'end' }, label));
  }
  svg.append(node('text', { x: LAYOUT.x, y: L - 6, class: 'rs-ladder-title' }, t.ladder));
  if (ladder.fibrillation) {
    const zig = [];
    for (let s = 0; s <= STRIP_SECONDS; s += 0.04) zig.push(`${zig.length ? 'L' : 'M'}${X(s).toFixed(1)},${(aTop + R / 2 + (zig.length % 2 ? -8 : 8)).toFixed(1)}`);
    svg.append(node('path', { d: zig.join(''), class: 'rs-ladder-f' }));
  }
  for (const a of ladder.atrial) {
    const x = X(a.at + (a.kind === 'p' ? 0.02 : 0));
    svg.append(node('line', { x1: x, y1: aTop + 3, x2: x, y2: avTop, class: a.kind === 'F' ? 'rs-ladder-a rs-ladder-flutter' : a.dissociated ? 'rs-ladder-a rs-ladder-dissociated' : 'rs-ladder-a' }));
    if (a.conducted) {
      const v = ladder.ventricular[a.qrs], xv = X(v.at);
      svg.append(node('line', { x1: x, y1: avTop, x2: xv, y2: vTop, class: 'rs-ladder-av' }), node('line', { x1: xv, y1: vTop, x2: xv, y2: bottom - 3, class: 'rs-ladder-v' }));
    } else if (!a.dissociated) {
      const xb = x + (a.kind === 'F' ? 0.06 : 0.07) * pxPerS;
      svg.append(node('line', { x1: x, y1: avTop, x2: xb, y2: avTop + R * 0.55, class: 'rs-ladder-av rs-ladder-blocked' }),
        node('line', { x1: xb - 5, y1: avTop + R * 0.55, x2: xb + 5, y2: avTop + R * 0.55, class: 'rs-ladder-block' }));
    }
  }
  for (const v of ladder.ventricular) {
    if (v.origin === 'conducted') continue;
    const xv = X(v.at);
    if (v.origin === 'af') {
      svg.append(node('line', { x1: xv - 0.08 * pxPerS, y1: avTop + 2, x2: xv, y2: vTop, class: 'rs-ladder-av' }), node('line', { x1: xv, y1: vTop, x2: xv, y2: bottom - 3, class: 'rs-ladder-v' }));
    } else {
      // Escape or ectopic beat: starts in the V row (dot) and spreads.
      svg.append(node('circle', { cx: xv, cy: vTop + R * 0.55, r: 4, class: v.origin === 'ectopic' ? 'rs-ladder-ectopic' : 'rs-ladder-escape' }),
        node('line', { x1: xv, y1: vTop + 3, x2: xv, y2: bottom - 3, class: 'rs-ladder-v' }));
    }
  }
  return ladder;
}

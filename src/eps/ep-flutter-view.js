/*
 * LAO view of the right atrium for the live EP laboratory (ep-live-panel.js): the tricuspid
 * annulus en face with the SVC, IVC, crista terminalis, Eustachian ridge, CS ostium and the HRA,
 * His and CS catheters. During typical flutter the wavefront circles the annulus with its wake,
 * coloured by the limb of the circuit it is in, and lead II beside it is drawn in the same
 * colours (ep-flutter-circuit.js gives the timing), so each part of the F wave shows where the
 * front was. Without a flutter cycle the latest atrial activation is shown at its origin.
 * Frozen strips can replay the last cycles slowly. Colours live in style.css.
 */
import { CIRCUIT_SEGMENTS, CIRCUIT_SITES, circuitClock, circuitAngle, lastActivation, leadIiTrace, entrainmentAt } from './ep-flutter-circuit.js';

const NS = 'http://www.w3.org/2000/svg';
const MAP = Object.freeze({ w: 300, h: 236, cx: 150, cy: 118, squash: 0.86, rTa: 44, rIn: 52, rMid: 67, rOut: 82 });
const TRACE = Object.freeze({ w: 300, h: 96, mid: 50, mvPx: 120, pad: 6 });
const WAKE = Object.freeze({ share: 0.55, pieces: 28 });     // wake: the part of the cycle behind the front
const HIT_MS = 30;                                           // catheter tip lit this long after its A
const PULSE_MS = 160;                                        // origin pulse of a non-flutter activation
const REPLAY = Object.freeze({ cycles: 2, rate: 0.12 });     // frozen replay: cycles shown, playback speed
const SPOTS = Object.freeze({ sinus: [330, 100], hra: [CIRCUIT_SITES.hra, MAP.rOut - 4], cs: [CIRCUIT_SITES.csOs, 94], cti: [CIRCUIT_SITES.cti, MAP.rMid], septal: [70, MAP.rIn + 6], left: [60, 128] });
// CS pacing sites on the CS catheter (proximal 9-10 at the ostium); entrainment drawing sizes.
const CS_SITE_INDEX = Object.freeze({ 'cs-prox': 0, 'cs-78': 1, 'cs-56': 2, 'cs-34': 3, 'cs-dist': 4 });
const ENTRAIN = Object.freeze({ wake: 0.3, pulseMs: 90, collideR: 16, collideMs: 70 });
const CS_PATH = Object.freeze([[150, 94], [128, 112], [102, 122], [76, 126], [56, 128]]);
const nextFrame = (fn) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : 0);
const cancelFrame = (id) => { if (id && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id); };

/** Point at a clock angle (degrees, 0 = 12 o'clock, clockwise) and radius on the map. */
const at = (deg, r) => {
  const a = (deg * Math.PI) / 180;
  return [MAP.cx + r * Math.sin(a), MAP.cy - r * Math.cos(a) * MAP.squash];
};
const fmt = (list) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
/** Points of an arc from angle a to b (either direction) at radius r. */
function arc(a, b, r, step = 3) {
  const n = Math.max(2, Math.ceil(Math.abs(b - a) / step));
  return Array.from({ length: n + 1 }, (_, i) => at(a + ((b - a) * i) / n, r));
}

/**
 * @param {Document} doc
 * @param {{ text: () => object }} opts text: the current language's `circuit` texts (ep-live-text.js)
 */
export function createFlutterView(doc, { text }) {
  const svg = (tag, attrs = {}, parent = null) => {
    const n = doc.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    if (parent) parent.append(n);
    return n;
  };
  const html = (tag, cls = '', attrs = {}) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    return n;
  };

  const element = html('section', 'ep-live-circuit', { 'data-ep-live-circuit-view': '' });
  const head = html('div', 'ep-circ-head');
  const title = html('h4', 'ep-circ-title');
  const replayBtn = html('button', 'ep-circ-replay', { type: 'button', 'data-ep-live-circuit-replay': '' });
  head.append(title, replayBtn);
  const side = html('div', 'ep-circ-side');
  const front = html('p', 'ep-circ-front', { 'data-ep-live-circuit-front': '' });
  const entrainLine = html('p', 'ep-circ-entrain', { 'data-ep-live-circuit-entrain': '', 'aria-live': 'polite' });
  const legend = html('ul', 'ep-circ-legend');
  const note = html('p', 'ep-circ-note');
  const body = html('div', 'ep-circ-body');
  element.append(head, body);
  element.hidden = true;       // the panel shows it; the drawing is built the first time it is visible

  // ---- Static anatomy (built once, on first show) ----
  let parts = null;
  function build() {
    if (parts) return parts;
    const map = svg('svg', { viewBox: `0 0 ${MAP.w} ${MAP.h}`, class: 'ep-circ-map', role: 'img' });
    const trace = svg('svg', { viewBox: `0 0 ${TRACE.w} ${TRACE.h}`, class: 'ep-circ-trace', role: 'img' });
    side.append(trace, front, entrainLine, legend, note);
    body.append(map, side);
    const labels = {};
    const label = (key, [x, y], cls = 'ep-circ-label', anchor = 'middle') => { labels[key] = svg('text', { x: x.toFixed(1), y: y.toFixed(1), class: cls, 'text-anchor': anchor }, map); };
    svg('ellipse', { cx: MAP.cx, cy: MAP.cy, rx: MAP.rMid, ry: MAP.rMid * MAP.squash, class: 'ep-circ-corridor', 'stroke-width': MAP.rOut - MAP.rIn }, map);
    for (const s of CIRCUIT_SEGMENTS) svg('polyline', { points: fmt(arc(s.from, s.to, MAP.rMid)), class: `ep-circ-limb seg-${s.id}` }, map);
    svg('ellipse', { cx: MAP.cx, cy: MAP.cy, rx: MAP.rTa, ry: MAP.rTa * MAP.squash, class: 'ep-circ-ta' }, map);
    label('ta', [MAP.cx, MAP.cy + 4], 'ep-circ-label ep-circ-label-ta');
    const vessel = (deg, r, rad, key) => { const [x, y] = at(deg, r); svg('circle', { cx: x, cy: y, r: rad, class: 'ep-circ-vessel' }, map); label(key, [x, y + 3.5]); };
    vessel(332, 104, 14, 'svc');
    vessel(204, 106, 15, 'ivc');
    svg('polyline', { points: fmt(arc(318, 214, 96)), class: 'ep-circ-barrier' }, map);
    label('kt', at(266, 108));
    svg('polyline', { points: fmt(arc(194, 158, 95)), class: 'ep-circ-barrier' }, map);
    label('es', at(176, 110));
    const [ox, oy] = at(CIRCUIT_SITES.csOs, 94);
    svg('ellipse', { cx: ox, cy: oy, rx: 6, ry: 4.5, class: 'ep-circ-os' }, map);
    // Catheters: CS from its ostium around the mitral side, His across the septum, HRA on the lateral wall.
    svg('polyline', { points: fmt(CS_PATH.map(([a, r]) => at(a, r))), class: 'ep-circ-cath' }, map);
    const csDots = ['cs-910', 'cs-78', 'cs-56', 'cs-34', 'cs-12'].map((ch, i) => [ch, svg('circle', { cx: at(...CS_PATH[i])[0], cy: at(...CS_PATH[i])[1], r: 3, class: 'ep-circ-tip' }, map)]);
    label('cs', at(92, 138));
    const [hx, hy] = at(CIRCUIT_SITES.his, MAP.rIn + 4), [hx0, hy0] = at(CIRCUIT_SITES.his, 134);
    svg('line', { x1: hx0, y1: hy0, x2: hx, y2: hy, class: 'ep-circ-cath' }, map);
    const hisTip = svg('circle', { cx: hx, cy: hy, r: 3.5, class: 'ep-circ-tip' }, map);
    label('his', at(CIRCUIT_SITES.his + 8, 126), 'ep-circ-label', 'start');
    const [rx, ry] = at(CIRCUIT_SITES.hra, MAP.rOut - 4), [rx0, ry0] = at(CIRCUIT_SITES.hra + 22, 136);
    svg('line', { x1: rx0, y1: ry0, x2: rx, y2: ry, class: 'ep-circ-cath' }, map);
    const hraTip = svg('circle', { cx: rx, cy: ry, r: 3.5, class: 'ep-circ-tip' }, map);
    label('hra', at(CIRCUIT_SITES.hra + 26, 128), 'ep-circ-label', 'end');
    // Ablation catheter up from the IVC to the mid isthmus (ABL d: the CTI pacing site).
    const [ax, ay] = at(CIRCUIT_SITES.cti, MAP.rMid), [ax0, ay0] = at(212, 140);
    svg('line', { x1: ax0, y1: ay0, x2: ax, y2: ay, class: 'ep-circ-cath ep-circ-abl' }, map);
    const ablTip = svg('circle', { cx: ax, cy: ay, r: 3.5, class: 'ep-circ-tip' }, map);
    label('abl', at(218, 132), 'ep-circ-label', 'end');
    label('septal', [MAP.w - 6, 14], 'ep-circ-side-label', 'end');
    label('lateral', [6, 14], 'ep-circ-side-label', 'start');
    label('lao', [6, MAP.h - 6], 'ep-circ-side-label', 'start');
    const arrows = svg('g', { class: 'ep-circ-arrows' }, map);
    for (const deg of [105, 8, 268, 172]) {
      const [x, y] = at(deg, MAP.rMid), [x2, y2] = at(deg - 6, MAP.rMid);
      const ang = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
      svg('path', { d: 'M-4,-4 L4,0 L-4,4', transform: `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${ang.toFixed(1)})`, class: 'ep-circ-arrow' }, arrows);
    }
    const live = svg('g', { class: 'ep-circ-live' }, map);
    parts = { map, trace, labels, arrows, live, tips: [['his-d', hisTip], ['hra', hraTip], ['abl-d', ablTip], ...csDots] };
    applyText();
    return parts;
  }

  // ---- State ----
  let props = null;            // last update: { events, t, running, tcl }
  let replay = null;           // { to, t, last, raf }: replayed time, its end and the frame
  let shown = { active: false, segment: null, angle: null, origin: null, spot: null };
  let frontText = '';
  let entrainText = '';
  let entrainNow = null;       // entrainment at the painted time (ep-flutter-circuit.js entrainmentAt)

  /** A front's wake: where it was over the last `span` ms, fading backwards (dir -1: an antidromic front). */
  function drawWake(live, phase, tcl, span, cls, dir = 1) {
    const pieces = Math.max(2, Math.round((WAKE.pieces * span) / (tcl * WAKE.share)));
    const dt = span / pieces;
    for (let k = pieces; k >= 1; k--) {
      const a = circuitAngle(phase - dir * k * dt, tcl), b = circuitAngle(phase - dir * (k - 1) * dt, tcl);
      const [x1, y1] = at(a.angle, MAP.rMid), [x2, y2] = at(b.angle, MAP.rMid);
      svg('line', { x1, y1, x2, y2, class: `${cls(b)}`, opacity: (1 - k / (pieces + 1)).toFixed(2) }, live);
    }
  }
  function drawHead(live, angle, cls, mark = false) {
    const [x, y] = at(angle, MAP.rMid);
    svg('circle', { cx: x, cy: y, r: 11, class: `ep-circ-glow ${cls}` }, live);
    svg('circle', { cx: x, cy: y, r: 5.5, class: `ep-circ-head ${cls}`, ...(mark ? { 'data-ep-live-circuit-head': '' } : {}) }, live);
  }
  /** Paced fronts during entrainment, their collisions and the route in from the left atrium. */
  function drawEntrainment(live, ent, tcl) {
    const site = SPOTS[ent.site === 'hra' ? 'hra' : ent.site === 'cti' ? 'cti' : 'cs'];
    const spot = CS_SITE_INDEX[ent.site] != null ? CS_PATH[CS_SITE_INDEX[ent.site]] : site;
    if (ent.stimAge < ENTRAIN.pulseMs) {
      const [x, y] = at(...spot), p = ent.stimAge / ENTRAIN.pulseMs;
      svg('circle', { cx: x, cy: y, r: (5 + 16 * p).toFixed(1), class: 'ep-circ-pulse', opacity: (1 - p).toFixed(2) }, live);
    }
    if (ent.path != null) {
      // Along the CS catheter from the paced bipole to the ostium.
      const i = CS_SITE_INDEX[ent.site], f = i * (1 - ent.path), k = Math.floor(f), w = f - k;
      const a = CS_PATH[k], b = CS_PATH[Math.min(k + 1, CS_PATH.length - 1)];
      const [x, y] = at(a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w);
      svg('circle', { cx: x, cy: y, r: 5, class: 'ep-circ-head ep-circ-paced' }, live);
    }
    for (const fr of ent.fronts) {
      const span = Math.min(tcl * ENTRAIN.wake, fr.age);
      if (fr.kind === 'anti') {
        drawWake(live, fr.phase, tcl, span, () => 'ep-circ-wake ep-circ-anti', -1);
        drawHead(live, fr.angle, 'ep-circ-anti');
      } else {
        drawWake(live, fr.phase, tcl, span, (b) => `ep-circ-wake seg-${b.segment}`);
        drawHead(live, fr.angle, `seg-${fr.segment}`, fr.kind !== 'flutter');
      }
    }
    for (const c of ent.collisions) {
      const [x, y] = at(c.angle, MAP.rMid), p = Math.min(1, c.age / ENTRAIN.collideMs);
      svg('circle', { cx: x, cy: y, r: (6 + ENTRAIN.collideR * p).toFixed(1), class: 'ep-circ-collide', opacity: (1 - p).toFixed(2) }, live);
    }
  }

  function drawMap(clock, events, t) {
    const { live, arrows, tips } = parts;
    live.replaceChildren();
    const now = clock(t);
    for (const [ch, dot] of tips) {
      const hit = (events[ch] || []).some((e) => e.type === 'A' && e.t <= t && t - e.t < HIT_MS);
      dot.classList.toggle('is-hit', hit);
    }
    if (now) {
      arrows.style.display = '';
      drawWake(live, now.tau, now.tcl, now.tcl * WAKE.share, (b) => `ep-circ-wake seg-${b.segment}`);
      drawHead(live, now.angle, `seg-${now.segment}`, true);
      shown = { active: true, segment: now.segment, angle: Math.round(now.angle), origin: 'flutter', spot: 'circuit', entrain: summary(entrainNow) };
      return;
    }
    if (entrainNow && (entrainNow.fronts.length || entrainNow.path != null)) {
      arrows.style.display = '';
      drawEntrainment(live, entrainNow, props.tcl || 240);
      const lead = entrainNow.fronts.filter((f) => f.kind === 'ortho').at(-1);
      shown = { active: false, segment: lead?.segment ?? null, angle: lead ? Math.round(lead.angle) : null, origin: entrainNow.site, spot: 'paced', entrain: summary(entrainNow) };
      return;
    }
    arrows.style.display = 'none';
    const act = lastActivation(events, t);
    shown = { active: false, segment: null, angle: null, origin: act?.origin ?? null, spot: act?.spot ?? null, entrain: summary(entrainNow) };
    const spot = act && SPOTS[act.spot];
    if (!spot || t - act.t > PULSE_MS) return;
    const [x, y] = at(...spot), p = (t - act.t) / PULSE_MS;
    svg('circle', { cx: x, cy: y, r: (6 + 34 * p).toFixed(1), class: 'ep-circ-pulse', opacity: (1 - p).toFixed(2) }, live);
  }
  const summary = (ent) => (ent ? { site: ent.site, pcl: ent.pcl, fronts: ent.fronts.map((f) => f.kind), collisions: ent.collisions.length, ppi: ent.ppi, ppiTcl: ent.ppiTcl, verdict: ent.verdict, fusion: ent.fusion, pacing: ent.pacing } : null);

  function drawTrace(events, t, tcl) {
    const { trace } = parts;
    trace.replaceChildren();
    const span = (tcl || 240) * 2.5;
    const samples = leadIiTrace(events, t - span, t, 150, { tcl, ppiExtra: props.ppiExtra });
    const x = (s) => TRACE.pad + ((s.t - (t - span)) / span) * (TRACE.w - 2 * TRACE.pad);
    const y = (v) => Math.min(TRACE.h - 2, Math.max(2, TRACE.mid - v * TRACE.mvPx));
    svg('line', { x1: TRACE.pad, y1: TRACE.mid, x2: TRACE.w - TRACE.pad, y2: TRACE.mid, class: 'ep-circ-base' }, trace);
    svg('polyline', { points: fmt(samples.map((s) => [x(s), y(s.full)])), class: 'ep-circ-full' }, trace);
    // The F wave alone, cut where the front changes limb.
    let run = [];
    const flush = (seg) => { if (run.length > 1 && seg) svg('polyline', { points: fmt(run), class: `ep-circ-f seg-${seg}` }, trace); };
    samples.forEach((s, i) => {
      const prev = samples[i - 1];
      if (prev && prev.segment !== s.segment) { run.push([x(s), y(s.f)]); flush(prev.segment); run = []; }
      run.push([x(s), y(s.f)]);
    });
    flush(samples[samples.length - 1].segment);
    const last = samples[samples.length - 1];
    if (last.segment) svg('circle', { cx: x(last), cy: y(last.f), r: 3.5, class: `ep-circ-pen seg-${last.segment}` }, trace);
    const tx = text();
    svg('text', { x: TRACE.pad, y: 12, class: 'ep-circ-label', 'text-anchor': 'start' }, trace).textContent = tx.traceLabel;
  }

  function paint() {
    if (!props || element.hidden) return;
    build();
    const t = replay ? replay.t : props.t;
    const clock = circuitClock(props.events, { tcl: props.tcl });
    entrainNow = entrainmentAt(props.events, t, { tcl: props.tcl || 240, ppiExtra: props.ppiExtra });
    drawMap(clock, props.events, t);
    drawTrace(props.events, t, clock(t)?.tcl ?? props.tcl);
    const tx = text();
    const site = entrainNow ? tx.sites[entrainNow.site] ?? entrainNow.site : '';
    const next = shown.active ? tx.front(tx.segments[shown.segment])
      : shown.spot === 'paced' ? tx.entraining(site, entrainNow.pcl)
        : tx.noReentry(shown.spot ? tx.origins[shown.spot] ?? tx.origins.other : null);
    if (next !== frontText) { frontText = next; front.textContent = next; }
    const result = entrainNow?.verdict ? tx.entrainResult({ ...entrainNow, siteName: site }) : '';
    if (result !== entrainText) { entrainText = result; entrainLine.textContent = result; entrainLine.hidden = !result; }
    replayBtn.hidden = props.running || !clock(props.t);
    replayBtn.textContent = replay ? tx.replayStop : tx.replay;
    replayBtn.setAttribute('aria-pressed', String(Boolean(replay)));
  }

  function stopReplay() {
    if (!replay) return;
    cancelFrame(replay.raf);
    replay = null;
  }
  function startReplay() {
    if (!props) return;
    const tcl = circuitClock(props.events, { tcl: props.tcl })(props.t)?.tcl ?? props.tcl ?? 240;
    replay = { to: props.t, t: props.t - tcl * REPLAY.cycles, last: null, raf: 0 };
    const step = (wall) => {
      if (!replay) return;
      if (!element.isConnected || element.hidden) { stopReplay(); paint(); return; }
      if (replay.last != null) replay.t = Math.min(replay.to, replay.t + (wall - replay.last) * REPLAY.rate);
      replay.last = wall;
      paint();
      if (replay.t >= replay.to) { stopReplay(); paint(); return; }
      replay.raf = nextFrame(step);
    };
    replay.raf = nextFrame(step);
    paint();
  }
  replayBtn.addEventListener('click', () => { if (replay) { stopReplay(); paint(); } else startReplay(); });

  /** Texts of the built drawing in the current language. */
  function applyText() {
    const tx = text();
    note.textContent = tx.note;
    parts.map.setAttribute('aria-label', tx.aria);
    parts.trace.setAttribute('aria-label', tx.traceAria);
    for (const [key, node] of Object.entries(parts.labels)) node.textContent = tx.labels[key] ?? key;
    legend.replaceChildren(...CIRCUIT_SEGMENTS.map((s) => {
      const li = html('li', `seg-${s.id}`);
      li.append(html('span', 'ep-circ-swatch'), doc.createTextNode(tx.segments[s.id]));
      return li;
    }));
    frontText = '';
    entrainText = null;
  }

  function render() {
    title.textContent = text().title;
    if (!parts) return;
    applyText();
    paint();
  }

  return {
    element,
    render,
    /** New strip state: the events around t (absolute ms), the time shown and whether the monitor runs. */
    update(next) {
      const moved = !props || next.t !== props.t || next.running !== props.running;
      props = next;
      if (moved) stopReplay();
      paint();
    },
    /** Test hook: what is shown. */
    state: () => ({ ...shown, replaying: Boolean(replay), visible: !element.hidden }),
    /** Replay at once to its end (test hook). */
    replayNow() { startReplay(); if (replay) { replay.t = replay.to; stopReplay(); paint(); } },
    destroy: stopReplay
  };
}

/*
 * "Follow the impulse": a schematic frontal four-chamber heart that shows where the impulse is at
 * the strip's time (ep-impulse.js gives the timeline). Wavefronts spread over the atria and the
 * ventricles, conduction runs along the AV nodal pathways, the His-Purkinje system and an
 * accessory pathway in the ladder's colours, block shows in the node, flutter circles the
 * tricuspid annulus and AF breaks into wavelets. Play, pause, speed and step through one cycle;
 * every time change is reported (onTime) so the host strip draws its cursor at the same moment.
 */
import { IMPULSE_VIEW, ROUTES, SITES, FLUTTER_RING, impulseTimeline, impulseAt, impulseSteps, stepText, flutterAngle, pointAlong } from './ep-impulse.js';
import { LADDER_STYLE } from './ep-ladder.js';

const NS = 'http://www.w3.org/2000/svg';
const SPEEDS = Object.freeze([0.1, 0.25, 0.5, 1]);
const R_ATRIUM = 230, R_VENTRICLE = 200, R_WAVELET = 30;
const SHAPES = Object.freeze({
  ra: 'M60,40 C30,48 26,140 50,146 L176,146 L176,58 C150,36 95,34 60,40 Z',
  la: 'M186,58 C215,40 300,40 322,62 C334,90 330,140 320,146 L186,146 Z',
  rv: 'M50,154 L178,154 L196,292 C150,284 66,250 50,154 Z',
  lv: 'M186,154 L322,154 C332,226 272,284 204,294 Z'
});
const VESSELS = Object.freeze(['M58,42 L58,8 L92,8 L92,38', 'M296,44 L310,22', 'M322,60 L344,46', 'M326,110 L348,112', 'M314,138 L334,154']);
const LABELS = Object.freeze([['RA', 104, 100], ['LA', 262, 104], ['RV', 108, 214], ['LV', 262, 214]]);
const TEXT = {
  tr: { play: 'Oynat', pause: 'Duraklat', prev: '‹ Önceki adım', next: 'Sonraki adım ›', speed: 'Hız', title: 'Uyarıyı izle', steps: 'Bir döngünün adımları', aria: 'Şematik kalp: uyarının şeritteki zamanda bulunduğu yer', none: 'Bu kayıtta izlenecek iletim yok.', sa: 'SA', avn: 'AVN', cs: 'CS', cti: 'CTİ', note: 'Şematik ön görünüm; yollar ladder diyagramından okunur.' },
  en: { play: 'Play', pause: 'Pause', prev: '‹ Previous step', next: 'Next step ›', speed: 'Speed', title: 'Follow the impulse', steps: 'Steps of one cycle', aria: 'Schematic heart: where the impulse is at the strip time', none: 'No conduction to follow in this recording.', sa: 'SA', avn: 'AVN', cs: 'CS', cti: 'CTI', note: 'Schematic frontal view; routes are read from the ladder.' }
};

const svg = (doc, tag, attrs = {}) => {
  const n = doc.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
};
const html = (doc, tag, cls = '', attrs = {}) => {
  const n = doc.createElement(tag);
  if (cls) n.className = cls;
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
};
const pts = (list) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
/** The first fraction p of a route (from its end when reverse). */
function partial(route, p, reverse) {
  const list = reverse ? [...route].reverse() : route;
  if (p <= 0) return [list[0]];
  const head = pointAlong(list, p);
  const out = [list[0]];
  let acc = 0;
  const total = list.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - list[i - 1][0], q[1] - list[i - 1][1]) : 0), 0);
  for (let i = 1; i < list.length; i++) {
    acc += Math.hypot(list[i][0] - list[i - 1][0], list[i][1] - list[i - 1][1]);
    if (acc / total >= p) break;
    out.push(list[i]);
  }
  out.push(head);
  return out;
}

function buildHeart(doc) {
  const root = svg(doc, 'svg', { viewBox: `0 0 ${IMPULSE_VIEW.w} ${IMPULSE_VIEW.h}`, class: 'impulse-heart', role: 'img' });
  const defs = svg(doc, 'defs');
  const clip = (id, keys) => { const c = svg(doc, 'clipPath', { id }); for (const k of keys) c.append(svg(doc, 'path', { d: SHAPES[k] })); defs.append(c); };
  const grad = (id, rgb) => {
    const g = svg(doc, 'radialGradient', { id });
    for (const [off, a] of [[0, 0.1], [0.78, 0.32], [0.94, 0.75], [1, 0.95]]) g.append(svg(doc, 'stop', { offset: off, 'stop-color': `rgb(${rgb})`, 'stop-opacity': a }));
    defs.append(g);
  };
  const uid = `imp${Math.random().toString(36).slice(2, 8)}`;
  clip(`${uid}-atria`, ['ra', 'la']); clip(`${uid}-ventricles`, ['rv', 'lv']);
  grad(`${uid}-fa`, '251, 191, 36'); grad(`${uid}-fv`, '251, 113, 133');
  root.append(defs);
  for (const d of VESSELS) root.append(svg(doc, 'path', { d, class: 'impulse-vessel' }));
  for (const k of Object.keys(SHAPES)) root.append(svg(doc, 'path', { d: SHAPES[k], class: `impulse-chamber impulse-${k}` }));
  root.append(svg(doc, 'path', { d: 'M124,141 C170,156 250,158 318,140', class: 'impulse-cs' }));
  const atria = svg(doc, 'g', { 'clip-path': `url(#${uid}-atria)` });
  const ventricles = svg(doc, 'g', { 'clip-path': `url(#${uid}-ventricles)` });
  const routes = svg(doc, 'g', { class: 'impulse-routes' });
  for (const k of ['fast', 'slow', 'his', 'lbb', 'rbb']) routes.append(svg(doc, 'polyline', { points: pts(ROUTES[k]), class: `impulse-route impulse-route-${k}` }));
  const ap = svg(doc, 'polyline', { class: 'impulse-route impulse-route-ap', points: '' });
  const ring = svg(doc, 'ellipse', { cx: FLUTTER_RING.cx, cy: FLUTTER_RING.cy, rx: FLUTTER_RING.rx, ry: FLUTTER_RING.ry, class: 'impulse-ring' });
  routes.append(ap, ring);
  const live = svg(doc, 'g', { class: 'impulse-live' });
  const marks = svg(doc, 'g', { class: 'impulse-marks' });
  marks.append(svg(doc, 'circle', { cx: SITES.sa[0], cy: SITES.sa[1], r: 4.5, class: 'impulse-node' }), svg(doc, 'circle', { cx: 170, cy: 138, r: 4.5, class: 'impulse-node' }));
  const labels = svg(doc, 'g', { class: 'impulse-labels' });
  const label = (text, x, y, cls = '') => { const t = svg(doc, 'text', { x, y, class: cls }); t.textContent = text; labels.append(t); return t; };
  for (const [name, x, y] of LABELS) label(name, x, y, 'impulse-chamber-label');
  const nodeLabels = { sa: label('SA', 88, 40), avn: label('AVN', 146, 134), cs: label('CS', 112, 158), cti: label('CTI', 98, 152, 'impulse-cti') };
  root.append(atria, ventricles, routes, live, marks, labels);
  return { root, atria, ventricles, live, ap, ring, nodeLabels, grad: { a: `url(#${uid}-fa)`, v: `url(#${uid}-fv)` } };
}

/**
 * @param {Document} doc
 * @param {{ getLang?: () => string, onTime?: (ms: number) => void }} [options]
 */
export function createImpulseView(doc, { getLang = () => 'tr', onTime = () => {} } = {}) {
  const element = html(doc, 'section', 'impulse-view', { 'data-impulse-view': '' });
  const heart = buildHeart(doc);
  const side = html(doc, 'div', 'impulse-side');
  const head = html(doc, 'h5', 'impulse-title');
  const bar = html(doc, 'div', 'impulse-bar');
  const play = html(doc, 'button', 'amap-toggle', { type: 'button', 'data-impulse-play': '' });
  const prev = html(doc, 'button', 'amap-toggle', { type: 'button', 'data-impulse-prev': '' });
  const next = html(doc, 'button', 'amap-toggle', { type: 'button', 'data-impulse-next': '' });
  const speedLabel = html(doc, 'label', 'impulse-speed');
  const speedText = html(doc, 'span');
  const speed = html(doc, 'select', '', { 'data-impulse-speed': '' });
  for (const s of SPEEDS) { const o = html(doc, 'option'); o.value = String(s); o.textContent = `${s}×`; speed.append(o); }
  speed.value = '0.25';
  speedLabel.append(speedText, speed);
  bar.append(play, prev, next, speedLabel);
  const caption = html(doc, 'p', 'impulse-caption', { 'data-impulse-caption': '', 'aria-live': 'polite' });
  const stepsHead = html(doc, 'p', 'impulse-steps-head');
  const stepsList = html(doc, 'ol', 'impulse-steps', { 'data-impulse-steps': '' });
  const note = html(doc, 'p', 'impulse-note');
  side.append(head, bar, caption, stepsHead, stepsList, note);
  element.append(heart.root, side);

  let timeline = null, steps = [], stepEls = [], now = 0, playing = false, frame = null, lastTick = 0, lastReport = 0;
  const T = () => TEXT[getLang() === 'en' ? 'en' : 'tr'];

  function drawRoute(group, route, p, reverse, color, dash) {
    const line = partial(route, p, reverse);
    group.append(svg(doc, 'polyline', { points: pts(line), class: 'impulse-active', stroke: color, 'stroke-dasharray': dash.join(' ') }));
    const [x, y] = line.at(-1);
    group.append(svg(doc, 'circle', { cx: x, cy: y, r: 3.6, class: 'impulse-head', fill: color }));
  }
  function drawPath(it) {
    const style = LADDER_STYLE[it.link] || LADDER_STYLE.fast;
    const group = heart.live;
    if (!it.active) return;
    const p = it.progress;
    if (it.route === 'hps') {
      drawRoute(group, ROUTES.his, Math.min(1, p / 0.3), false, style.color, style.dash);
      if (p > 0.3) for (const b of ['lbb', 'rbb']) drawRoute(group, ROUTES[b], (p - 0.3) / 0.7, false, style.color, style.dash);
      return;
    }
    if (it.viaHis) {
      drawRoute(group, ROUTES.his, Math.min(1, p / 0.3), true, style.color, style.dash);
      if (p > 0.3) drawRoute(group, ROUTES[it.route], (p - 0.3) / 0.7, true, style.color, style.dash);
      return;
    }
    drawRoute(group, ROUTES[it.route], p, it.reverse, style.color, style.dash);
  }
  function front(group, seeds, r, fill, opacity) {
    for (const [x, y] of seeds) group.append(svg(doc, 'circle', { cx: x, cy: y, r: Math.max(0.5, r), fill, opacity: opacity.toFixed(3), class: 'impulse-front' }));
  }

  function drawAt(t) {
    heart.atria.replaceChildren(); heart.ventricles.replaceChildren(); heart.live.replaceChildren();
    const state = timeline ? impulseAt(timeline, t) : [];
    for (const it of state) {
      const fade = it.active ? 1 : it.recovery * 0.35;   // refractory tissue fades back
      if (it.kind === 'atrium') front(heart.atria, it.seeds, it.progress * R_ATRIUM, heart.grad.a, fade);
      else if (it.kind === 'ventricle') front(heart.ventricles, it.seeds, it.progress * R_VENTRICLE, heart.grad.v, fade);
      else if (it.kind === 'wavelet') front(heart.atria, [jitter(it)], it.progress * R_WAVELET, heart.grad.a, fade);
      else if (it.kind === 'path') drawPath(it);
      else if (it.kind === 'block') drawBlock(it);
      else if (it.kind === 'flutter') drawFlutter(it, t);
    }
    const current = steps.reduce((best, s, i) => (s.t <= t + 1 && (best < 0 || s.t >= steps[best].t) ? i : best), -1);
    // At a step the caption names that step; between steps, the latest wavefront that is still moving.
    const shown = state.filter((it) => it.active && it.kind !== 'flutter' && it.kind !== 'wavelet').sort((a, b) => b.t0 - a.t0)[0];
    const atStep = current >= 0 && t - steps[current].t < 12 ? steps[current].text : null;
    const words = atStep || (shown ? stepText(shown, getLang(), timeline.mechanism) : steps[0]?.text || T().none);
    caption.textContent = `t = ${Math.round(t)} ms · ${words}`;
    stepEls.forEach((b, i) => b.setAttribute('aria-current', String(i === current)));
  }
  function jitter(it) {
    const a = (it.seed * 2.399) % (2 * Math.PI);
    return [it.site[0] + 16 * Math.cos(a), it.site[1] + 12 * Math.sin(a)];
  }
  function drawBlock(it) {
    const o = it.active ? 1 - it.progress * 0.6 : 0;
    if (o <= 0) return;
    const [x, y] = it.at;
    for (const d of [`M${x - 7},${y - 7} L${x + 7},${y + 7}`, `M${x + 7},${y - 7} L${x - 7},${y + 7}`]) heart.live.append(svg(doc, 'path', { d, class: 'impulse-block', opacity: o.toFixed(2) }));
  }
  function drawFlutter(it, t) {
    const { cx, cy, rx, ry } = FLUTTER_RING;
    const at = (a) => [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
    const head = flutterAngle(it, t);
    const tail = [];
    for (let k = 0; k <= 24; k++) tail.push(at(head + (k / 24) * (Math.PI * 1.1)));   // the wake behind the counter-clockwise head
    heart.live.append(svg(doc, 'polyline', { points: pts(tail.reverse()), class: 'impulse-flutter-wake' }));
    const [x, y] = at(head);
    heart.live.append(svg(doc, 'circle', { cx: x, cy: y, r: 5, class: 'impulse-flutter-head' }));
    front(heart.atria, [[x, y]], 26, heart.grad.a, 0.9);
  }

  function setTime(ms, { report = true } = {}) {
    if (!timeline) return;
    now = Math.min(timeline.windowMs, Math.max(0, ms));
    drawAt(now);
    if (report) onTime(Math.round(now));
  }
  function tick(stamp) {
    frame = null;
    if (!playing || !timeline) return;
    if (!element.isConnected || element.offsetParent === null) { pause(); return; }
    const dt = lastTick ? Math.min(100, stamp - lastTick) : 16;
    lastTick = stamp;
    now += dt * Number(speed.value);
    if (now > timeline.windowMs) now = 0;
    drawAt(now);
    if (stamp - lastReport >= 33) { lastReport = stamp; onTime(Math.round(now)); }
    frame = globalThis.requestAnimationFrame?.(tick) ?? null;
  }
  function start() {
    if (!timeline || playing) return;
    playing = true; lastTick = 0;
    labels();
    frame = globalThis.requestAnimationFrame?.(tick) ?? null;
  }
  function pause() {
    const was = playing;
    playing = false;
    if (frame != null) globalThis.cancelAnimationFrame?.(frame);
    frame = null;
    labels();
    if (was && timeline) onTime(Math.round(now));   // the strip cursor stops where the heart stopped
  }
  function goStep(dir) {
    if (!steps.length) return;
    pause();
    const order = steps.map((s, i) => ({ t: s.t, i })).sort((a, b) => a.t - b.t);
    const target = dir > 0 ? order.find((s) => s.t > now + 1) || order[0] : [...order].reverse().find((s) => s.t < now - 1) || order.at(-1);
    setTime(target.t);
  }
  play.addEventListener('click', () => (playing ? pause() : start()));
  prev.addEventListener('click', () => goStep(-1));
  next.addEventListener('click', () => goStep(1));

  function labels() {
    const L = T();
    head.textContent = L.title;
    play.textContent = playing ? L.pause : L.play;
    play.setAttribute('aria-pressed', String(playing));
    prev.textContent = L.prev; next.textContent = L.next; speedText.textContent = L.speed;
    stepsHead.textContent = L.steps; note.textContent = L.note;
    heart.root.setAttribute('aria-label', L.aria);
    heart.nodeLabels.avn.textContent = L.avn; heart.nodeLabels.cti.textContent = L.cti;
  }

  /** Show a recording: its ladder gives the routes; the time moves to the first step. */
  function show({ recording, ladder, mechanism = null, pathwayZone = null }) {
    pause();
    timeline = recording && ladder ? impulseTimeline(recording, ladder, { mechanism, pathwayZone }) : null;
    steps = timeline ? impulseSteps(timeline, getLang()) : [];
    const apItem = timeline?.items.find((it) => it.kind === 'path' && it.route.startsWith('ap-'));
    heart.ap.setAttribute('points', apItem ? pts(ROUTES[apItem.route]) : '');
    const flutter = Boolean(timeline?.items.some((it) => it.kind === 'flutter'));
    heart.ring.style && (heart.ring.style.display = flutter ? '' : 'none');
    heart.nodeLabels.cti.style && (heart.nodeLabels.cti.style.display = flutter ? '' : 'none');
    stepButtons();
    labels();
    const first = [...steps].sort((a, b) => a.t - b.t)[0];
    now = first ? first.t : 0;
    drawAt(now);
  }

  function stepButtons() {
    stepEls = steps.map((s, i) => {
      const b = html(doc, 'button', 'impulse-step', { type: 'button', 'data-impulse-step': i });
      b.textContent = s.text;
      b.addEventListener('click', () => { pause(); setTime(s.t); });
      return b;
    });
    stepsList.replaceChildren(...stepEls.map((b) => { const li = html(doc, 'li'); li.append(b); return li; }));
  }

  labels();
  return {
    element, show, pause, play: start,
    /** Move to a time without reporting it back (the host already shows it). */
    setTime: (ms) => setTime(ms, { report: false }),
    render: () => {
      labels();
      if (!timeline) return;
      steps = impulseSteps(timeline, getLang());
      stepButtons();
      drawAt(now);
    },
    getState: () => ({ time: Math.round(now), playing, steps: steps.map((s) => ({ ...s })), apZone: timeline?.apZone || null }),
    destroy() { pause(); element.remove(); }
  };
}

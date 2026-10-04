// Slow pathway mapping panel for the Koch steps of the ablation lesson: a 2D
// triangle of Koch (RAO view, redrawn after the Mayo 2009 illustration) where
// the ablation tip is placed, the synthetic recording of that site and its
// reading. The site drives the 3D catheter through onSite (heart.setKochTip).
import './koch-sp.css';
import { DEFAULT_SITE, assessSite, clampSite, sitePoint, siteZone } from './koch-sp-model.js';
import { EGM_BEATS, EGM_CHANNELS, EGM_TIMES, EGM_WINDOW_MS, channelTrace } from './koch-sp-egm.js';
import { KOCH_SP_TEXT } from './koch-sp-text.js';

const NS = 'http://www.w3.org/2000/svg';
// Triangle corners in the schematic (viewBox 320 x 250), same roles as the 3D frame.
const FRAME = Object.freeze({ todaro: [62, 202], csOs: [140, 212], hinge: [212, 214], apex: [236, 58] });
const lerp2 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
const toXY = site => sitePoint(site, FRAME, lerp2);
const GRID = 20;
const ZONE_FILL = { target: ['#30d158', 0.42], fast: ['#38a7e8', 0.42], his: ['#ff6a3d', 0.34], mid: ['#f5b83d', 0.18] };
const KEY_STEP = 0.04;
const EGM = Object.freeze({ width: 640, left: 58, top: 16, row: 33, gain: 13 });

const svg = (tag, attrs = {}, text) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  return n;
};
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

/** Site whose schematic point is nearest to (x, y): coarse grid, then a local refinement. */
export function siteAt(x, y) {
  const dist = s => { const [px, py] = toXY(s); return (px - x) ** 2 + (py - y) ** 2; };
  let best = { u: 0, v: 0 }, bd = Infinity;
  for (let i = 0; i <= 50; i++) for (let j = 0; j <= 50; j++) {
    const s = { u: i / 50, v: j / 50 }, d = dist(s);
    if (d < bd) { bd = d; best = s; }
  }
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
    const s = clampSite({ u: best.u + i * 0.005, v: best.v + j * 0.005 }), d = dist(s);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}

function buildSchematic() {
  const root = svg('svg', { viewBox: '0 0 320 250', class: 'ksp-schematic', role: 'img' });
  const title = svg('title');
  const bg = svg('path', { d: 'M8,40 Q10,8 60,8 L292,8 Q314,10 314,40 L314,236 Q312,248 290,248 L30,248 Q8,246 8,220 Z', class: 'ksp-wall' });
  const tv = svg('path', { d: `M${FRAME.hinge} L${FRAME.apex} L300,34 Q316,140 304,236 L230,240 Z`, class: 'ksp-tv' });
  const fo = svg('ellipse', { cx: 98, cy: 92, rx: 40, ry: 27, class: 'ksp-fo' });
  const ivc = svg('ellipse', { cx: 42, cy: 236, rx: 30, ry: 12, class: 'ksp-ivc' });
  const cells = svg('g', { class: 'ksp-zones' });
  for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
    const [u0, u1, v0, v1] = [i / GRID, (i + 1) / GRID, j / GRID, (j + 1) / GRID];
    const fill = ZONE_FILL[siteZone({ u: (u0 + u1) / 2, v: (v0 + v1) / 2 })];
    if (!fill) continue;
    const pts = [[u0, v0], [u0, v1], [u1, v1], [u1, v0]].map(([u, v]) => toXY({ u, v }).map(n => n.toFixed(1)).join(','));
    cells.append(svg('polygon', { points: pts.join(' '), fill: fill[0], 'fill-opacity': fill[1] }));
  }
  const base = svg('path', { d: `M${FRAME.todaro} L${FRAME.hinge}`, class: 'ksp-base' });
  const todaro = svg('path', { d: `M${FRAME.todaro} Q${lerp2(FRAME.todaro, FRAME.apex, 0.5).map((n, k) => n - (k ? 14 : -6)).join(',')} ${FRAME.apex}`, class: 'ksp-todaro' });
  const hinge = svg('path', { d: `M${FRAME.hinge} L${FRAME.apex}`, class: 'ksp-hinge' });
  const cs = svg('circle', { cx: FRAME.csOs[0], cy: FRAME.csOs[1] + 8, r: 12, class: 'ksp-cs' });
  const [ax, ay] = toXY({ u: 0.86, v: 0.55 });
  const avn = svg('ellipse', { cx: ax, cy: ay, rx: 13, ry: 8, transform: `rotate(-62 ${ax} ${ay})`, class: 'ksp-avn' });
  const his = svg('path', { d: `M${FRAME.apex} Q252,44 270,36`, class: 'ksp-his' });
  const catheter = svg('path', { class: 'ksp-catheter' });
  const tip = svg('g', { class: 'ksp-tip', tabindex: '0', role: 'slider' });
  tip.append(svg('circle', { r: 11, class: 'ksp-tip-halo' }), svg('circle', { r: 6.5, class: 'ksp-tip-dot' }));
  const labels = {};
  // Pathway labels sit beside their zones (computed from the same site map).
  const at = (u, v, dx, dy) => toXY({ u, v }).map((n, k) => n + (k ? dy : dx));
  const place = { todaro: [72, 150, 'start'], annulus: [266, 196, 'middle'], cs: [140, 244, 'middle'], avn: [212, 104, 'end'], his: [272, 30, 'start'],
    fo: [98, 96, 'middle'], ivc: [42, 240, 'middle'], fast: [...at(0.6, 0.1, -6, 4), 'end'], slow: [...at(0.3, 0.6, -10, 6), 'end'], tcv: [286, 120, 'middle'] };
  for (const [id, [x, y, anchor]] of Object.entries(place)) labels[id] = svg('text', { x, y, 'text-anchor': anchor, class: `ksp-label ksp-label-${id}` });
  root.append(title, bg, tv, fo, ivc, cells, base, todaro, hinge, cs, avn, his, ...Object.values(labels), catheter, tip);
  return { root, title, catheter, tip, labels };
}

function buildEgm() {
  const height = EGM.top + EGM.row * EGM_CHANNELS.length + 8;
  const root = svg('svg', { viewBox: `0 0 ${EGM.width} ${height}`, class: 'ksp-egm', role: 'img' });
  const title = svg('title');
  const x = t => EGM.left + (t / EGM_WINDOW_MS) * (EGM.width - EGM.left - 6);
  const t0 = EGM_BEATS[0];
  const ablRow = EGM_CHANNELS.findIndex(c => c.id === 'abld');
  root.append(title, svg('rect', { x: 0, y: EGM.top + ablRow * EGM.row - 2, width: EGM.width, height: EGM.row * 2, class: 'ksp-egm-band' }),
    svg('line', { x1: x(t0), x2: x(t0), y1: 4, y2: height - 4, class: 'ksp-egm-p' }),
    svg('line', { x1: x(t0 + EGM_TIMES.qrs), x2: x(t0 + EGM_TIMES.qrs), y1: 4, y2: height - 4, class: 'ksp-egm-q' }));
  const traces = {};
  EGM_CHANNELS.forEach((c, i) => {
    const y = EGM.top + i * EGM.row + EGM.row / 2;
    root.append(svg('text', { x: 6, y: y + 4, class: 'ksp-egm-label', fill: c.color }, c.label));
    traces[c.id] = svg('path', { class: 'ksp-egm-trace', stroke: c.color, 'data-channel': c.id });
    root.append(traces[c.id]);
  });
  const ay = EGM.top + ablRow * EGM.row - 1;
  root.append(svg('text', { x: x(t0 + EGM_TIMES.ablA), y: ay, class: 'ksp-egm-mark', 'text-anchor': 'middle' }, 'A'),
    svg('text', { x: x(t0 + EGM_TIMES.ablV), y: ay, class: 'ksp-egm-mark', 'text-anchor': 'middle' }, 'V'));
  return { root, title, traces, x };
}

export function createKochSpPanel({ mount, getLang = () => 'tr', onSite = () => {}, onView = () => {} } = {}) {
  if (!mount) throw new Error('createKochSpPanel: mount is required');
  let site = { ...DEFAULT_SITE }, active = false;
  const t = () => KOCH_SP_TEXT[getLang() === 'en' ? 'en' : 'tr'];
  const element = el('section', 'ksp');
  const kicker = el('p', 'ksp-kicker'), title = el('h4', 'ksp-title'), intro = el('p', 'ksp-intro');
  const schematic = buildSchematic();
  const legend = el('ul', 'ksp-legend');
  const status = el('div', 'ksp-status');
  status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const zoneBadge = el('strong', 'ksp-zone'), advice = el('p', 'ksp-advice');
  const facts = el('dl', 'ksp-facts');
  status.append(zoneBadge, facts, advice);
  const egmTitle = el('p', 'ksp-egm-title');
  const egm = buildEgm();
  const actions = el('div', 'ksp-actions');
  const button = (id, onClick) => { const b = el('button'); b.type = 'button'; b.dataset.kspAction = id; b.addEventListener('click', onClick); actions.append(b); return b; };
  const targetBtn = button('target', () => setSite(DEFAULT_SITE));
  const raoBtn = button('rao', () => onView('koch_rao', true));
  const laoBtn = button('lao', () => onView('koch_lao', true));
  const view3dBtn = button('3d', () => onView(null, false));
  const viewHint = el('p', 'ksp-hint'), note = el('p', 'ksp-note'), source = el('p', 'ksp-source');
  // Wide panel: schematic beside the reading and the recording (koch-sp.css).
  const figure = el('div', 'ksp-figure'), side = el('div', 'ksp-side');
  figure.append(schematic.root, legend);
  side.append(status, egmTitle, egm.root, actions, viewHint);
  const layout = el('div', 'ksp-layout');
  layout.append(figure, side);
  element.append(kicker, title, intro, layout, note, source);
  mount.append(element);

  function renderSite() {
    const a = assessSite(site), text = t();
    const [x, y] = toXY(site);
    schematic.tip.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
    schematic.catheter.setAttribute('d', `M14,252 Q${(x * 0.35 + 20).toFixed(1)},${(y * 0.25 + 190).toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`);
    const height = text.heightValue[Math.min(4, Math.floor(site.u * 5))];
    schematic.tip.setAttribute('aria-valuetext', `${text.zones[a.zone]}; ${text.height}: ${height}; ${text.ratio} ${a.ratioText}`);
    element.dataset.zone = a.zone;
    zoneBadge.textContent = text.zones[a.zone];
    zoneBadge.dataset.zone = a.zone;
    const rows = [[text.ratio, a.ratioText], [text.hisPotential, a.his > 0.08 ? text.present : text.absent], [text.slowPotential, a.slowPotential > 0.35 ? text.present : text.absent], [text.height, height]];
    facts.replaceChildren(...rows.flatMap(([k, v]) => [el('dt', '', k), el('dd', '', v)]));
    advice.textContent = text.advice[a.zone].replace('{r}', a.ratioText);
    for (const c of EGM_CHANNELS) {
      const d = channelTrace(c.id, a).map((s, i) => `${i ? 'L' : 'M'}${egm.x(s.t).toFixed(1)},${(EGM.top + EGM_CHANNELS.indexOf(c) * EGM.row + EGM.row / 2 - s.y * EGM.gain).toFixed(1)}`).join('');
      egm.traces[c.id].setAttribute('d', d);
    }
    return a;
  }

  function render() {
    const text = t();
    kicker.textContent = text.kicker; title.textContent = text.title; intro.textContent = text.intro;
    schematic.title.textContent = text.schematic;
    schematic.root.setAttribute('aria-label', text.schematic);
    schematic.tip.setAttribute('aria-label', text.tipLabel);
    for (const [id, node] of Object.entries(schematic.labels)) node.textContent = text.labels[id];
    legend.replaceChildren(...text.legend.map(([kind, label]) => { const li = el('li', '', label); li.dataset.legend = kind; return li; }));
    egmTitle.textContent = text.egm;
    egm.title.textContent = text.egmAria;
    egm.root.setAttribute('aria-label', text.egmAria);
    targetBtn.textContent = text.target; raoBtn.textContent = text.rao; laoBtn.textContent = text.lao; view3dBtn.textContent = text.view3d;
    actions.setAttribute('aria-label', text.views);
    viewHint.textContent = text.viewHint; note.textContent = text.note; source.textContent = text.source;
    renderSite();
  }

  function setSite(next, { silent = false } = {}) {
    site = clampSite(next);
    const a = renderSite();
    if (!silent) onSite({ ...site }, a);
    return a;
  }

  // Pointer: click or drag anywhere on the schematic moves the tip there.
  let dragging = false;
  const fromEvent = event => {
    const m = schematic.root.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(m.inverse());
    return siteAt(p.x, p.y);
  };
  schematic.root.addEventListener('pointerdown', event => {
    const s = fromEvent(event);
    if (!s) return;
    dragging = true;
    schematic.root.setPointerCapture?.(event.pointerId);
    setSite(s);
  });
  schematic.root.addEventListener('pointermove', event => { if (dragging) { const s = fromEvent(event); if (s) setSite(s); } });
  const stop = () => { dragging = false; };
  schematic.root.addEventListener('pointerup', stop);
  schematic.root.addEventListener('pointercancel', stop);
  // Keyboard: up/down change the height, left/right move toward Todaro / the annulus.
  schematic.tip.addEventListener('keydown', event => {
    const delta = { ArrowUp: [KEY_STEP, 0], ArrowDown: [-KEY_STEP, 0], ArrowLeft: [0, -KEY_STEP], ArrowRight: [0, KEY_STEP] }[event.key];
    if (!delta) return;
    event.preventDefault();
    setSite({ u: site.u + delta[0], v: site.v + delta[1] });
  });

  render();
  element.hidden = true;
  return {
    element,
    setActive(on) { active = Boolean(on); element.hidden = !active; mount.hidden = !active; },
    setLanguage() { render(); },
    setSite,
    getState: () => ({ active, site: { ...site }, ...assessSite(site) })
  };
}

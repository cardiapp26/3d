// QRS genesis lab: a frontal heart section whose myocardium colours as the
// activation wave spreads, the instantaneous vector and the QRS loop it
// draws, and six leads (I, II, III, aVF, V1, V6) traced from the same vector
// on ECG paper. Time runs 0-80 ms by slider, play or the five textbook steps.
// Model: qrs-vector-model.js. Schematic teaching drawing.
import './qrs-vector-lab.css';
import { QRS_MS, activationTime, createQrsModel } from './qrs-vector-model.js';

const NS = 'http://www.w3.org/2000/svg';
const LEADS = Object.freeze([
  { id: 'I', color: '#38bdf8' }, { id: 'II', color: '#4ade80' }, { id: 'III', color: '#a78bfa' },
  { id: 'aVF', color: '#facc15' }, { id: 'V1', color: '#f472b6' }, { id: 'V6', color: '#fb923c' }
]);
// Beat timing on the strips (ms): P, QRS onset, T.
const BEAT = Object.freeze({ p: 70, qrs: 170, t: 400, window: 560 });
const MM = 3.2;
const MS_PER_MM = 10;                         // 100 mm/s: the QRS is stretched to be read
const STRIP_MM = 26;
const TILT = -38;                                 // long axis: base upper left, apex lower right
const ORIGIN = [168, 118];
const VEC_SCALE = 70;
const PLAY_MS = 4200;                             // one QRS played over ~4 s

const T = {
  tr: {
    title: 'QRS nasıl oluşur: aktivasyon, vektör ve derivasyonlar',
    time: 'QRS içi zaman (ms)', play: 'Oynat', pause: 'Duraklat', steps: 'Adımlar',
    heart: 'Frontal kalp kesiti: depolarize olan miyokard koyulaşır, sarı bant dalga cephesidir',
    legend: [['rest', 'Dinlenimde'], ['front', 'Dalga cephesi'], ['done', 'Depolarize'], ['vector', 'Anlık vektör'], ['loop', 'QRS halkası']],
    labels: { ra: 'RA', la: 'LA', rv: 'RV', lv: 'LV', septum: 'Septum', his: 'His', apex: 'Apeks' },
    leads: 'Derivasyonlar · aynı vektörün izdüşümleri · 100 mm/s (QRS büyütülmüş) · 10 mm/mV',
    now: 'şimdi', mean: 'Ortalama QRS aksı',
    note: 'Şematik öğretim modeli. Frontal derivasyonlar (I, II, III, aVF) tek bir anlık vektörün izdüşümüdür; her an I + III = II. V1/V6 aynı adımların yatay düzlem öğretim değerlerinden çizilir. Aktivasyon zamanları klasik sırayı gösterir (sol septum → apeks/endokard → serbest duvarlar → bazal bölgeler); ölçülmüş harita değildir.'
  },
  en: {
    title: 'How the QRS forms: activation, vector and leads',
    time: 'Time within QRS (ms)', play: 'Play', pause: 'Pause', steps: 'Steps',
    heart: 'Frontal heart section: depolarized myocardium darkens, the yellow band is the wavefront',
    legend: [['rest', 'Resting'], ['front', 'Wavefront'], ['done', 'Depolarized'], ['vector', 'Instantaneous vector'], ['loop', 'QRS loop']],
    labels: { ra: 'RA', la: 'LA', rv: 'RV', lv: 'LV', septum: 'Septum', his: 'His', apex: 'Apex' },
    leads: 'Leads · projections of the same vector · 100 mm/s (QRS stretched) · 10 mm/mV',
    now: 'now', mean: 'Mean QRS axis',
    note: 'Schematic teaching model. The frontal leads (I, II, III, aVF) are projections of one instantaneous vector; I + III = II at every instant. V1/V6 come from the horizontal-plane teaching values of the same steps. Activation times show the classic order (left septum → apex/endocardium → free walls → basal regions); not a measured map.'
  }
};

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
const fmtDeg = a => `${a > 0 ? '+' : a < 0 ? '−' : ''}${Math.abs(Math.round(a))}°`;

// Ventricular geometry in long-axis coordinates (x: toward the patient's left, y: base 0 → apex).
const LV_IN = { cx: 46, cy: 6, a: 30, b: 132 };
const LV_OUT = { cx: 44, cy: 4, a: 60, b: 162 };
const RV_IN = { cx: -14, cy: 2, a: 62, b: 112 };
const RV_OUT = { cx: -14, cy: 0, a: 72, b: 124 };
const inside = (e, x, y) => ((x - e.cx) / e.a) ** 2 + ((y - e.cy) / e.b) ** 2 <= 1;
const ellipseRadius = (e, x, y) => Math.hypot((x - e.cx) / e.a, (y - e.cy) / e.b);
const halfEllipse = e => `M${e.cx - e.a},${e.cy} A${e.a},${e.b} 0 0 0 ${e.cx + e.a},${e.cy} Z`;

/** Myocardial sample sites with their region and activation time. */
function myocardialSites(step = 5.5) {
  const sites = [];
  for (let y = 2; y < LV_OUT.cy + LV_OUT.b; y += step) for (let x = -90; x < 106; x += step) {
    const inLvWall = inside(LV_OUT, x, y) && !inside(LV_IN, x, y);
    const inRvWall = inside(RV_OUT, x, y) && !inside(RV_IN, x, y) && !inside(LV_OUT, x, y);
    if (!inLvWall && !inRvWall) continue;
    const apical = Math.min(1, y / 150);
    let region, depth;
    if (inRvWall) { region = 'rv'; depth = (ellipseRadius(RV_IN, x, y) - 1) / (ellipseRadius(RV_OUT, x, y) - ellipseRadius(RV_IN, x, y) + 1e-6); }
    else if (x < LV_IN.cx - LV_IN.a * 0.55 && y < 120 && inside(RV_IN, x, y)) { region = 'septum'; depth = (LV_IN.cx - LV_IN.a - x) / (LV_IN.cx - LV_IN.a - (LV_OUT.cx - LV_OUT.a)); }
    else { region = 'lv'; const r0 = ellipseRadius(LV_IN, x, y); depth = (r0 - 1) / (LV_OUT.a / LV_IN.a - 1); }
    sites.push({ x, y, region, act: activationTime(region, Math.min(1, Math.max(0, depth)), apical) });
  }
  return sites;
}

function buildHeart() {
  const root = svg('svg', { viewBox: '0 0 360 340', class: 'vql-heart', role: 'img' });
  const title = svg('title');
  const defs = svg('defs');
  const clip = svg('clipPath', { id: 'vql-base-clip' });
  clip.append(svg('rect', { x: -120, y: 0, width: 260, height: 220 }));
  // Activation cells are clipped to the ventricular walls for smooth edges.
  const wallClip = svg('clipPath', { id: 'vql-wall-clip' });
  wallClip.append(svg('path', { d: halfEllipse(RV_OUT) }), svg('path', { d: halfEllipse(LV_OUT) }));
  defs.append(clip, wallClip);
  root.append(title, defs);
  const body = svg('g', { transform: `translate(${ORIGIN}) rotate(${TILT})` });
  // Atria and great vessels above the base (not activated in this model).
  body.append(svg('ellipse', { cx: -38, cy: -30, rx: 46, ry: 34, class: 'vql-atrium' }),
    svg('ellipse', { cx: 58, cy: -36, rx: 40, ry: 28, class: 'vql-atrium' }),
    svg('path', { d: 'M8,-26 C10,-70 30,-92 58,-96', class: 'vql-vessel' }));
  const ventricles = svg('g', { 'clip-path': 'url(#vql-base-clip)' });
  ventricles.append(svg('path', { d: halfEllipse(RV_OUT), class: 'vql-myo' }), svg('path', { d: halfEllipse(LV_OUT), class: 'vql-myo' }));
  const cells = svg('g', { class: 'vql-cells', 'clip-path': 'url(#vql-wall-clip)' });
  const sites = myocardialSites(4.4).map(s => {
    const c = svg('circle', { cx: s.x, cy: s.y, r: 3.4 });
    cells.append(c);
    return { ...s, node: c };
  });
  // Cavities over the cells; the RV cavity stops at the septum (LV outline over it).
  const cavities = svg('g', { 'clip-path': 'url(#vql-base-clip)' });
  const rvCavityClip = svg('clipPath', { id: 'vql-rv-cavity' });
  rvCavityClip.append(svg('path', { d: `M-140,-10 H${LV_OUT.cx - LV_OUT.a} V230 H-140 Z` }));
  defs.append(rvCavityClip);
  cavities.append(svg('path', { d: halfEllipse(RV_IN), class: 'vql-cavity', 'clip-path': 'url(#vql-rv-cavity)' }),
    svg('path', { d: halfEllipse(LV_IN), class: 'vql-cavity' }),
    svg('path', { d: halfEllipse(LV_OUT), class: 'vql-outline' }));
  // Conduction: AV node, His, bundle branches.
  const conduction = svg('g', { class: 'vql-conduction' });
  conduction.append(svg('circle', { cx: 2, cy: -10, r: 4 }),
    svg('path', { d: 'M2,-10 L4,22' }),
    svg('path', { d: 'M4,22 C10,60 22,100 40,128 M18,64 C30,72 52,70 70,60' }),
    svg('path', { d: 'M4,22 C-6,60 -14,92 -22,104' }));
  body.append(ventricles, cells, cavities, conduction);
  const labels = {};
  for (const [id, x, y] of [['ra', -38, -26], ['la', 58, -32], ['rv', -50, 52], ['lv', 46, 70], ['septum', -4, 60], ['his', 14, 8], ['apex', 44, 176]]) {
    labels[id] = svg('text', { x, y, class: `vql-label vql-label-${id}`, 'text-anchor': 'middle', transform: `rotate(${-TILT} ${x} ${y})` });
    body.append(labels[id]);
  }
  root.append(body);
  // Vector overlay in screen orientation, centred on the ventricles.
  const tilt = (TILT * Math.PI) / 180, [lx, ly] = [24, 78];
  const cx = ORIGIN[0] + lx * Math.cos(tilt) - ly * Math.sin(tilt), cy = ORIGIN[1] + lx * Math.sin(tilt) + ly * Math.cos(tilt);
  const centre = svg('g', { transform: `translate(${cx.toFixed(1)},${cy.toFixed(1)})` });
  const loop = svg('path', { class: 'vql-loop' });
  const ghostLoop = svg('path', { class: 'vql-loop-ghost' });
  const arrow = svg('line', { x1: 0, y1: 0, class: 'vql-vector' });
  const head = svg('path', { class: 'vql-vector-head' });
  const meanArrow = svg('line', { x1: 0, y1: 0, class: 'vql-mean' });
  centre.append(ghostLoop, meanArrow, loop, arrow, head, svg('circle', { r: 3, class: 'vql-origin' }));
  root.append(centre);
  return { root, title, sites, labels, loop, ghostLoop, arrow, head, meanArrow };
}

function buildStrip(lead) {
  const card = el('div', 'vql-strip');
  card.dataset.lead = lead.id;
  const w = (BEAT.window / MS_PER_MM) * MM, h = STRIP_MM * MM;
  const s = svg('svg', { viewBox: `0 0 ${w} ${h}`, class: 'vql-strip-svg', 'aria-hidden': 'true' });
  const minor = [], major = [];
  for (let x = 0; x <= w + 0.1; x += MM) (Math.round(x / MM) % 5 ? minor : major).push(`M${x.toFixed(1)},0V${h}`);
  for (let y = 0; y <= h + 0.1; y += MM) (Math.round(y / MM) % 5 ? minor : major).push(`M0,${y.toFixed(1)}H${w}`);
  const band = svg('rect', { y: 0, height: h, class: 'vql-band' });
  const full = svg('path', { class: 'vql-trace-ghost' });
  const done = svg('path', { class: 'vql-trace', stroke: lead.color });
  const cursor = svg('line', { y1: 0, y2: h, class: 'vql-cursor' });
  const dot = svg('circle', { r: 3.2, fill: lead.color, class: 'vql-dot' });
  s.append(svg('path', { d: minor.join(''), class: 'vql-grid-minor' }), svg('path', { d: major.join(''), class: 'vql-grid-major' }), band, full, done, cursor, dot);
  const head = el('span', 'vql-strip-head');
  const name = el('span', 'vql-strip-name', lead.id);
  name.style.color = lead.color;
  const value = el('span', 'vql-strip-value');
  head.append(name, value);
  card.append(head, s);
  return { card, full, done, cursor, dot, band, value, w, h };
}

/** QRS genesis lab for the ch12_vectors topic; `steps` are the five textbook vectors. */
export function createQrsVectorLab({ mount, getLang = () => 'tr', steps, state = {} }) {
  const model = createQrsModel(steps);
  const st = Object.assign({ time: model.stepTimes[2], playing: false }, state);
  st.playing = false;
  const t = () => T[getLang() === 'en' ? 'en' : 'tr'];
  const lang = () => (getLang() === 'en' ? 'en' : 'tr');
  const root = el('section', 'vql ecg-lab');
  const heading = el('h3', 'vql-title');
  const controls = el('div', 'vql-controls');
  const stepBar = el('div', 'vql-steps'); stepBar.setAttribute('role', 'group');
  const stepBtns = steps.map((s, i) => {
    const b = el('button'); b.type = 'button'; b.dataset.step = String(i);
    b.addEventListener('click', () => { st.playing = false; st.time = model.stepTimes[i]; render(); b.focus(); });
    stepBar.append(b); return b;
  });
  const play = el('button', 'vql-play'); play.type = 'button'; play.dataset.labAction = 'play';
  play.addEventListener('click', () => { st.playing = !st.playing; if (st.playing && st.time >= QRS_MS) st.time = 0; last = null; render(); if (st.playing) raf = requestAnimationFrame(tick); });
  const sliderRow = el('label', 'vql-slider');
  const sliderLabel = el('span'), out = el('output'), input = el('input');
  input.type = 'range'; input.min = '0'; input.max = String(QRS_MS); input.step = '1'; input.dataset.labParam = 'time';
  input.addEventListener('input', () => { st.playing = false; st.time = Number(input.value); render(); });
  sliderRow.append(sliderLabel, out, input);
  controls.append(play, stepBar, sliderRow);

  const main = el('div', 'vql-main');
  const heart = buildHeart();
  const figure = el('figure', 'vql-figure');
  const legend = el('ul', 'vql-legend');
  figure.append(heart.root, legend);
  const side = el('div', 'vql-side');
  const leadsTitle = el('p', 'vql-leads-title');
  const stripGrid = el('div', 'vql-strips');
  const strips = Object.fromEntries(LEADS.map(l => { const s = buildStrip(l); stripGrid.append(s.card); return [l.id, s]; }));
  const detail = el('div', 'vql-detail');
  side.append(leadsTitle, stripGrid, detail);
  main.append(figure, side);
  const result = el('p', 'ecg-lab-result vql-result'); result.setAttribute('role', 'status'); result.setAttribute('aria-live', 'polite');
  const note = el('p', 'vql-note');
  root.append(heading, controls, main, result, note);
  mount.append(root);

  // Static parts: the full loop (ghost), mean axis and the complete traces.
  const loopPath = upTo => {
    const pts = [];
    for (let ms = 0; ms <= upTo; ms += 1) { const f = model.frontal(ms); pts.push(`${pts.length ? 'L' : 'M'}${(f.x * VEC_SCALE).toFixed(1)},${(f.y * VEC_SCALE).toFixed(1)}`); }
    return pts.join('');
  };
  heart.ghostLoop.setAttribute('d', loopPath(QRS_MS));
  const meanAxis = model.meanAxis();
  const [mx, my] = [Math.cos((meanAxis * Math.PI) / 180) * VEC_SCALE * 1.15, Math.sin((meanAxis * Math.PI) / 180) * VEC_SCALE * 1.15];
  heart.meanArrow.setAttribute('x2', mx.toFixed(1)); heart.meanArrow.setAttribute('y2', my.toFixed(1));
  const xAt = ms => (ms / MS_PER_MM) * MM;
  const beat = (id, ms) => {
    const g = (c, w, a) => a * Math.exp(-(((ms - c) / w) ** 2));
    const pAxis = { I: 0.09, II: 0.14, III: 0.06, aVF: 0.11, V1: 0.05, V6: 0.08 }[id];
    const tWave = { I: 0.18, II: 0.28, III: 0.1, aVF: 0.2, V1: -0.05, V6: 0.25 }[id];
    return g(BEAT.p, 26, pAxis) + model.lead(id, ms - BEAT.qrs) + g(BEAT.t, 58, tWave);
  };
  const tracePath = (s, id, from, to) => {
    const mid = s.h * 0.58, pts = [];
    for (let ms = from; ms <= to; ms += 2) pts.push(`${pts.length ? 'L' : 'M'}${xAt(ms).toFixed(1)},${(mid - beat(id, ms) * 10 * MM).toFixed(1)}`);
    return pts.join('');
  };
  for (const l of LEADS) {
    const s = strips[l.id];
    s.full.setAttribute('d', tracePath(s, l.id, 0, BEAT.window));
    s.band.setAttribute('x', xAt(BEAT.qrs).toFixed(1)); s.band.setAttribute('width', xAt(QRS_MS).toFixed(1));
  }

  let raf = null, last = null;
  function tick(now) {
    if (!st.playing) { raf = null; return; }
    if (last !== null) st.time += ((now - last) / PLAY_MS) * QRS_MS;
    last = now;
    if (st.time >= QRS_MS) { st.time = QRS_MS; st.playing = false; }
    render();
    if (st.playing) raf = requestAnimationFrame(tick);
  }

  function render() {
    const text = t(), time = Math.min(QRS_MS, Math.max(0, st.time));
    heading.textContent = text.title;
    play.textContent = st.playing ? text.pause : text.play;
    play.setAttribute('aria-pressed', String(st.playing));
    stepBar.setAttribute('aria-label', text.steps);
    const stepIndex = model.stepAt(time);
    stepBtns.forEach((b, i) => {
      b.textContent = `${steps[i].time} · ${steps[i].name[lang()].replace(/\s*\(.*\)$/, '')}`;
      b.setAttribute('aria-pressed', String(Math.abs(time - model.stepTimes[i]) < 0.5));
    });
    sliderLabel.textContent = text.time;
    input.value = String(Math.round(time));
    out.textContent = `${Math.round(time)} ms`;
    heart.title.textContent = text.heart;
    heart.root.setAttribute('aria-label', text.heart);
    for (const [id, node] of Object.entries(heart.labels)) node.textContent = text.labels[id];
    for (const s of heart.sites) {
      const state = time < s.act ? 'rest' : time - s.act < 5 ? 'front' : 'done';
      if (s.node.dataset.state !== state) { s.node.dataset.state = state; s.node.setAttribute('class', `vql-cell is-${state}`); }
    }
    const f = model.frontal(time);
    const vx = f.x * VEC_SCALE, vy = f.y * VEC_SCALE;
    heart.arrow.setAttribute('x2', vx.toFixed(1)); heart.arrow.setAttribute('y2', vy.toFixed(1));
    const len = Math.hypot(vx, vy);
    if (len > 6) {
      const ux = vx / len, uy = vy / len, bx = vx - ux * 9, by = vy - uy * 9;
      heart.head.setAttribute('d', `M${vx},${vy} L${bx - uy * 5},${by + ux * 5} L${bx + uy * 5},${by - ux * 5} Z`);
    } else heart.head.setAttribute('d', '');
    heart.loop.setAttribute('d', loopPath(time));
    legend.replaceChildren(...text.legend.map(([k, v]) => { const li = el('li', '', v); li.dataset.legend = k; return li; }));
    leadsTitle.textContent = text.leads;
    for (const l of LEADS) {
      const s = strips[l.id], ms = BEAT.qrs + time, mid = s.h * 0.58;
      s.done.setAttribute('d', tracePath(s, l.id, BEAT.qrs - 4, BEAT.qrs + time));
      s.cursor.setAttribute('x1', xAt(ms).toFixed(1)); s.cursor.setAttribute('x2', xAt(ms).toFixed(1));
      const v = model.lead(l.id, time);
      s.dot.setAttribute('cx', xAt(ms).toFixed(1)); s.dot.setAttribute('cy', (mid - beat(l.id, ms) * 10 * MM).toFixed(1));
      s.value.textContent = `${text.now} ${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)} mV`;
    }
    const step = steps[stepIndex];
    detail.replaceChildren(el('strong', '', `${step.time} · ${step.name[lang()]}`), el('p', '', step.details[lang()]));
    const I = model.lead('I', time), II = model.lead('II', time), III = model.lead('III', time);
    result.textContent = `${(time / 1000).toFixed(3)} s · ${step.time} ${step.name[lang()]} · ${fmtDeg(f.angle)} · I + III − II = ${(I + III - II).toFixed(3)} · ${text.mean} ${fmtDeg(meanAxis)}`;
    note.textContent = text.note;
    Object.assign(state, { time: st.time });
  }

  render();
  return {
    element: root,
    sync() { render(); },
    destroy() { if (raf !== null) cancelAnimationFrame(raf); st.playing = false; root.remove(); },
    getState: () => ({ time: st.time, playing: st.playing, frontal: model.frontal(st.time), meanAxis })
  };
}

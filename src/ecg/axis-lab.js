// Frontal axis lab: find the QRS axis from the six limb leads. Hexaxial wheel
// with a draggable vector, the six leads drawn on ECG paper from that vector,
// three reading methods (quadrant, isoelectric lead, net I/aVF) and a quiz.
// Model: axis-model.js. Teaching drawings, not patient recordings.
import './axis-lab.css';
import { LIMB_LEADS, LEAD_ANGLE, angleError, axisCategory, axisFromNet, gradeAnswer, isoelectric, limbLeads, normAngle, pickCandidate, projection, quadrant, quizAxis } from './axis-model.js';

const NS = 'http://www.w3.org/2000/svg';
const C = 180, RING = 128;
const LEAD_COLOR = { I: '#38bdf8', II: '#4ade80', III: '#a78bfa', aVR: '#f87171', aVL: '#fb923c', aVF: '#facc15' };
const CAT_COLOR = { normal: '#22c55e', left: '#f59e0b', right: '#3b82f6', extreme: '#ef4444' };
const CAT_RANGE = { normal: [-30, 90], left: [-90, -30], right: [90, 180], extreme: [-180, -90] };
const MM = 4;                        // px per mm on the lead strips (10 mm/mV, 25 mm/s)
const STRIP_MS = 2250;               // three beats
const BEAT_MS = 760;
const STRIP_MM = 28;                 // ±1.4 mV

const T = {
  tr: {
    modes: ['Keşfet', 'Kendini dene'], presets: 'Örnekler', slider: 'Frontal QRS aksı (°)',
    cat: { normal: 'Normal aks', left: 'Sol aks sapması', right: 'Sağ aks sapması', extreme: 'Aşırı (kuzeybatı) aks' },
    wheel: 'Hekzaksiyel sistem: oku sürükleyin veya bir derivasyona tıklayın',
    leadsTitle: 'Ekstremite derivasyonları · 25 mm/s · 10 mm/mV', net: 'net',
    pick: 'Derivasyona tıklayın: aks okunun o derivasyon üzerindeki izdüşümü çizilir.',
    projection: (id, p) => `${id}: izdüşüm ${p >= 0 ? '+' : '−'}${Math.abs(p).toFixed(2)} → QRS ${p > 0.15 ? 'pozitif (R baskın)' : p < -0.15 ? 'negatif (S/QS baskın)' : 'izoelektrik (R ≈ S)'}`,
    methods: ['1 · Kadran (I + aVF)', '2 · İzoelektrik derivasyon', '3 · Derece hesabı'],
    m1: (i, f, ii, q) => [
      `I ${i >= 0 ? 'pozitif' : 'negatif'}: aks ${i >= 0 ? 'hastanın soluna bakar (−90° ile +90° arası)' : 'hastanın sağına bakar (+90° ile 180° ya da −90° ile −180° arası)'}.`,
      `aVF ${f >= 0 ? 'pozitif' : 'negatif'}: aks ${f >= 0 ? 'alt yarıda (0° ile 180°)' : 'üst yarıda (0° ile −180°)'}.`,
      ...(i >= 0 && f < 0 ? [`I+ / aVF− bölgesi 0° ile −90° arası: II ${ii >= 0 ? 'pozitif → aks −30° ile 0° arası, normal' : 'negatif → aks −30°\'den daha sol, sol aks sapması'}.`] : []),
      `Sonuç: ${q}.`],
    qText: { normal: '0° ile +90° (normal)', 'normal-left': '−30° ile 0° (normal, sola yönelim)', left: '−30° ile −90° (sol aks sapması)', right: '+90° ile 180° (sağ aks sapması)', extreme: '−90° ile 180° (aşırı aks)' },
    m2: (lead, c1, c2, tallest, axis) => [
      `En izoelektrik (R ≈ S) derivasyon: ${lead}. Aks bu derivasyona diktir.`,
      `Dik olan iki yön: ${fmt(c1)} ve ${fmt(c2)}.`,
      `En pozitif derivasyon ${tallest}; ona yakın olan seçilir: aks ≈ ${fmt(axis)}.`],
    m3: (ni, nf, axis) => [
      `Net QRS = R − S (mm). I: ${signed(ni)} mm, aVF: ${signed(nf)} mm.`,
      `I (0°) ve aVF (+90°) birbirine diktir: aks = atan2(aVF, I) = atan2(${signed(nf)}, ${signed(ni)}) ≈ ${fmt(axis)}.`,
      'Pratikte: önce kadranı bulun, sonra izoelektrik derivasyonla dereceyi daraltın; hesap kontrol içindir.'],
    quizIntro: 'Aks gizlendi. Altı derivasyonu okuyun, oku tahmininize çevirin ve kontrol edin.',
    check: 'Kontrol et', next: 'Yeni EKG', your: 'Tahmininiz', truth: 'Gerçek aks',
    verdict: { correct: 'Doğru', close: 'Yakın', wrong: 'Uzak' },
    score: (c, n) => `Skor: ${c}/${n}`,
    errorText: (e, same) => `Hata ${Math.round(e)}°${same ? '; kategori doğru.' : '; kategori farklı.'}`,
    cause: 'Klinik bağlam',
    note: 'Öğretim modeli: tek ortalama QRS vektörü; R − S izdüşümle orantılı çizilir. Gerçek EKG\'de q dalgaları, dal blokları ve göğüs pozisyonu morfolojiyi değiştirir. Normal aralık −30° ile +90° (bazı kaynaklar +100°\'e kadar). Aks tek başına tanı koydurmaz.'
  },
  en: {
    modes: ['Explore', 'Test yourself'], presets: 'Examples', slider: 'Frontal QRS axis (°)',
    cat: { normal: 'Normal axis', left: 'Left axis deviation', right: 'Right axis deviation', extreme: 'Extreme (northwest) axis' },
    wheel: 'Hexaxial system: drag the arrow or click a lead',
    leadsTitle: 'Limb leads · 25 mm/s · 10 mm/mV', net: 'net',
    pick: 'Click a lead: the projection of the axis arrow on that lead is drawn.',
    projection: (id, p) => `${id}: projection ${p >= 0 ? '+' : '−'}${Math.abs(p).toFixed(2)} → QRS ${p > 0.15 ? 'positive (R dominant)' : p < -0.15 ? 'negative (S/QS dominant)' : 'isoelectric (R ≈ S)'}`,
    methods: ['1 · Quadrant (I + aVF)', '2 · Isoelectric lead', '3 · Degree calculation'],
    m1: (i, f, ii, q) => [
      `I ${i >= 0 ? 'positive' : 'negative'}: the axis points to the patient's ${i >= 0 ? 'left (between −90° and +90°)' : 'right (+90° to 180° or −90° to −180°)'}.`,
      `aVF ${f >= 0 ? 'positive' : 'negative'}: the axis is in the ${f >= 0 ? 'lower half (0° to 180°)' : 'upper half (0° to −180°)'}.`,
      ...(i >= 0 && f < 0 ? [`I+ / aVF− lies between 0° and −90°: II ${ii >= 0 ? 'positive → axis −30° to 0°, normal' : 'negative → beyond −30°, left axis deviation'}.`] : []),
      `Result: ${q}.`],
    qText: { normal: '0° to +90° (normal)', 'normal-left': '−30° to 0° (normal, leftward)', left: '−30° to −90° (left axis deviation)', right: '+90° to 180° (right axis deviation)', extreme: '−90° to 180° (extreme axis)' },
    m2: (lead, c1, c2, tallest, axis) => [
      `Most isoelectric (R ≈ S) lead: ${lead}. The axis is perpendicular to it.`,
      `The two perpendicular directions: ${fmt(c1)} and ${fmt(c2)}.`,
      `The most positive lead is ${tallest}; take the direction nearer to it: axis ≈ ${fmt(axis)}.`],
    m3: (ni, nf, axis) => [
      `Net QRS = R − S (mm). I: ${signed(ni)} mm, aVF: ${signed(nf)} mm.`,
      `I (0°) and aVF (+90°) are perpendicular: axis = atan2(aVF, I) = atan2(${signed(nf)}, ${signed(ni)}) ≈ ${fmt(axis)}.`,
      'In practice: find the quadrant first, then narrow the degree with the isoelectric lead; the calculation is a check.'],
    quizIntro: 'The axis is hidden. Read the six leads, turn the arrow to your estimate and check.',
    check: 'Check', next: 'New ECG', your: 'Your estimate', truth: 'True axis',
    verdict: { correct: 'Correct', close: 'Close', wrong: 'Off' },
    score: (c, n) => `Score: ${c}/${n}`,
    errorText: (e, same) => `Error ${Math.round(e)}°${same ? '; category right.' : '; different category.'}`,
    cause: 'Clinical context',
    note: 'Teaching model: one mean QRS vector; R − S is drawn proportional to the projection. In real ECGs q waves, bundle branch blocks and chest position change the morphology. Normal range −30° to +90° (some sources up to +100°). The axis alone is not a diagnosis.'
  }
};
const fmt = a => `${a > 0 ? '+' : a < 0 ? '−' : ''}${Math.abs(Math.round(a))}°`;
const signed = x => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(1)}`;

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
const polar = (r, a) => [C + r * Math.cos((a * Math.PI) / 180), C + r * Math.sin((a * Math.PI) / 180)];
const arc = (r1, r2, a0, a1) => {
  const [x0, y0] = polar(r2, a0), [x1, y1] = polar(r2, a1), [x2, y2] = polar(r1, a1), [x3, y3] = polar(r1, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${x0},${y0} A${r2},${r2} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${r1},${r1} 0 ${large} 0 ${x3},${y3} Z`;
};

// One beat of a limb lead (mV) for the axis: P axis fixed at +60°, T concordant with QRS.
function leadSample(time, lead) {
  const t = time % BEAT_MS;
  const g = (c, w, a) => a * Math.exp(-(((t - c) / w) ** 2));
  const p = projection(60, lead.angle) * 0.14;
  return g(110, 28, p) + g(196, 9, lead.r) + g(222, 9, -lead.s) + g(470, 62, lead.p * 0.32);
}

function buildWheel(onAngle) {
  const root = svg('svg', { viewBox: '0 0 360 360', class: 'axl-wheel', role: 'img' });
  const title = svg('title');
  root.append(title, svg('circle', { cx: C, cy: C, r: RING, class: 'axl-disc' }));
  for (const [cat, [a0, a1]] of Object.entries(CAT_RANGE)) root.append(svg('path', { d: arc(RING + 2, RING + 12, a0, a1), fill: CAT_COLOR[cat], 'fill-opacity': 0.75, 'data-cat': cat }));
  const quadrantShade = svg('path', { class: 'axl-quadrant' });
  root.append(quadrantShade);
  for (let a = -150; a <= 180; a += 30) {
    const [x, y] = polar(RING + 26, a);
    root.append(svg('text', { x, y: y + 4, class: 'axl-deg', 'text-anchor': 'middle' }, fmt(a)));
  }
  const leadLines = {};
  for (const l of LIMB_LEADS) {
    const [x1, y1] = polar(RING, l.angle), [x2, y2] = polar(RING, l.angle + 180);
    const g = svg('g', { class: 'axl-lead', 'data-wheel-lead': l.id, tabindex: '-1' });
    g.append(svg('line', { x1: C, y1: C, x2: x1, y2: y1, stroke: LEAD_COLOR[l.id], class: 'axl-pos' }),
      svg('line', { x1: C, y1: C, x2, y2, stroke: LEAD_COLOR[l.id], class: 'axl-neg' }),
      svg('circle', { cx: x1, cy: y1, r: 3.5, fill: LEAD_COLOR[l.id] }));
    const [lx, ly] = polar(RING - 16, l.angle - 7);
    g.append(svg('text', { x: lx, y: ly + 4, class: 'axl-lead-label', fill: LEAD_COLOR[l.id], 'text-anchor': 'middle' }, `${l.id}+`));
    root.append(g);
    leadLines[l.id] = g;
  }
  const iso = svg('g', { class: 'axl-iso' });
  const projectionG = svg('g', { class: 'axl-projection' });
  const truth = svg('g', { class: 'axl-arrow axl-arrow-truth' });
  const user = svg('g', { class: 'axl-arrow axl-arrow-user', tabindex: '0', role: 'slider' });
  for (const arrow of [truth, user]) arrow.append(svg('line', { x1: C, y1: C }), svg('path', {}), svg('circle', { r: 9, class: 'axl-handle' }));
  root.append(iso, projectionG, truth, user, svg('circle', { cx: C, cy: C, r: 3.5, class: 'axl-centre' }));
  let dragging = false;
  const angleAt = e => {
    const m = root.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    if (Math.hypot(p.x - C, p.y - C) < 8) return null;
    return normAngle(Math.round((Math.atan2(p.y - C, p.x - C) * 180) / Math.PI));
  };
  root.addEventListener('pointerdown', e => {
    const lead = e.target.closest('[data-wheel-lead]');
    const a = angleAt(e);
    if (lead && !e.target.closest('.axl-arrow')) { onAngle(null, lead.dataset.wheelLead); return; }
    if (a === null) return;
    dragging = true; root.setPointerCapture?.(e.pointerId); onAngle(a);
  });
  root.addEventListener('pointermove', e => { if (dragging) { const a = angleAt(e); if (a !== null) onAngle(a); } });
  root.addEventListener('pointerup', () => { dragging = false; });
  root.addEventListener('pointercancel', () => { dragging = false; });
  return { root, title, leadLines, quadrantShade, iso, projectionG, truth, user };
}

function setArrow(g, angle, show) {
  g.style.display = show ? '' : 'none';
  if (!show) return;
  const [x, y] = polar(RING - 6, angle), [hx, hy] = polar(RING - 20, angle);
  const n = [-Math.sin((angle * Math.PI) / 180), Math.cos((angle * Math.PI) / 180)];
  const [line, head, handle] = g.children;
  line.setAttribute('x2', hx); line.setAttribute('y2', hy);
  head.setAttribute('d', `M${x},${y} L${hx + n[0] * 7},${hy + n[1] * 7} L${hx - n[0] * 7},${hy - n[1] * 7} Z`);
  handle.setAttribute('cx', x); handle.setAttribute('cy', y);
}

function buildLeadCard(lead, onPick) {
  const card = el('button', 'axl-strip');
  card.type = 'button'; card.dataset.lead = lead.id;
  const w = (STRIP_MS / 40) * MM, h = STRIP_MM * MM;
  const s = svg('svg', { viewBox: `0 0 ${w} ${h}`, class: 'axl-strip-svg', 'aria-hidden': 'true' });
  const grid = [];
  for (let x = 0; x <= w + 0.1; x += MM) grid.push(`M${x.toFixed(1)},0V${h}`);
  for (let y = 0; y <= h + 0.1; y += MM) grid.push(`M0,${y.toFixed(1)}H${w}`);
  const major = [];
  for (let x = 0; x <= w + 0.1; x += MM * 5) major.push(`M${x.toFixed(1)},0V${h}`);
  for (let y = 0; y <= h + 0.1; y += MM * 5) major.push(`M0,${y.toFixed(1)}H${w}`);
  const trace = svg('path', { class: 'axl-trace' });
  s.append(svg('path', { d: grid.join(''), class: 'axl-grid-minor' }), svg('path', { d: major.join(''), class: 'axl-grid-major' }), trace);
  const head = el('span', 'axl-strip-head');
  const label = el('span', 'axl-strip-label', lead.id);
  label.style.color = LEAD_COLOR[lead.id];
  const rMark = el('span', 'axl-mm');
  const net = el('span', 'axl-strip-net');
  head.append(label, rMark, net);
  card.append(head, s);
  card.addEventListener('click', () => onPick(lead.id));
  return { card, trace, rMark, net, w, h };
}

/** Axis lab for the ch12_axis topic. `conditions` are the topic presets (guyton-data.js). */
export function createAxisLab({ mount, getLang = () => 'tr', conditions = [], state = {} }) {
  const st = Object.assign({ angle: 59, mode: 'explore', method: 0, lead: null, cond: 'normal', quizSeed: 0, guess: 0, answered: false, score: 0, tries: 0 }, state);
  const t = () => T[getLang() === 'en' ? 'en' : 'tr'];
  const root = el('section', 'axl ecg-lab');
  const top = el('div', 'axl-top');
  const modeSeg = el('div', 'axl-seg'); modeSeg.setAttribute('role', 'group');
  const modeBtns = ['explore', 'quiz'].map(id => { const b = el('button'); b.type = 'button'; b.dataset.axisMode = id; b.addEventListener('click', () => { st.mode = id; st.answered = false; if (id === 'quiz') st.guess = 0; render(); }); modeSeg.append(b); return b; });
  const presets = el('div', 'axl-chips'); presets.setAttribute('role', 'group');
  const presetBtns = conditions.map(c => { const b = el('button'); b.type = 'button'; b.dataset.cond = c.id; b.addEventListener('click', () => { st.cond = c.id; st.angle = c.angle; st.mode = 'explore'; render(); }); presets.append(b); return b; });
  top.append(modeSeg, presets);

  const main = el('div', 'axl-main');
  const wheel = buildWheel((a, leadId) => {
    if (leadId) { st.lead = st.lead === leadId ? null : leadId; render(); return; }
    if (st.mode === 'quiz') { if (!st.answered) { st.guess = Math.round(a / 5) * 5; render(); } return; }
    st.angle = a; st.cond = null; render();
  });
  const wheelBox = el('figure', 'axl-wheel-box');
  const wheelCaption = el('figcaption', 'axl-caption');
  wheelBox.append(wheel.root, wheelCaption);
  const side = el('div', 'axl-side');
  const leadsTitle = el('p', 'axl-leads-title');
  const stripGrid = el('div', 'axl-strips');
  const cards = {};
  for (const l of LIMB_LEADS) { const c = buildLeadCard(l, id => { st.lead = st.lead === id ? null : id; render(); }); cards[l.id] = c; stripGrid.append(c.card); }
  const projText = el('p', 'axl-proj');
  side.append(leadsTitle, stripGrid, projText);
  main.append(wheelBox, side);

  const sliderRow = el('label', 'axl-slider');
  const sliderLabel = el('span'), out = el('output'), input = el('input');
  input.type = 'range'; input.min = '-180'; input.max = '180'; input.step = '1'; input.dataset.labParam = 'angle';
  input.addEventListener('input', () => { if (st.mode === 'quiz') { if (!st.answered) st.guess = Number(input.value); } else { st.angle = Number(input.value); st.cond = null; } render(); });
  sliderRow.append(sliderLabel, out, input);
  const result = el('p', 'ecg-lab-result axl-result'); result.setAttribute('role', 'status'); result.setAttribute('aria-live', 'polite');

  const quizBar = el('div', 'axl-quiz');
  const quizText = el('p', 'axl-quiz-text'), checkBtn = el('button'), nextBtn = el('button'), score = el('span', 'axl-score');
  checkBtn.type = nextBtn.type = 'button'; checkBtn.dataset.axisAction = 'check'; nextBtn.dataset.axisAction = 'next';
  checkBtn.addEventListener('click', () => { if (st.answered) return; st.answered = true; st.tries += 1; if (gradeAnswer(st.guess, quizAxis(st.quizSeed)).verdict === 'correct') st.score += 1; render(); });
  nextBtn.addEventListener('click', () => { st.quizSeed += 1; st.answered = false; st.guess = 0; render(); });
  quizBar.append(quizText, checkBtn, nextBtn, score);

  const method = el('div', 'axl-method');
  const methodTabs = el('div', 'axl-seg axl-method-tabs'); methodTabs.setAttribute('role', 'tablist');
  const methodBtns = [0, 1, 2].map(i => { const b = el('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.axisMethod = String(i); b.addEventListener('click', () => { st.method = i; render(); }); methodTabs.append(b); return b; });
  const methodBody = el('ol', 'axl-steps');
  method.append(methodTabs, methodBody);
  const cause = el('div', 'axl-cause'), note = el('p', 'axl-note');
  root.append(top, main, sliderRow, result, quizBar, method, cause, note);
  mount.append(root);

  // Keyboard on the arrow handle: ±5°.
  wheel.user.addEventListener('keydown', e => {
    const d = { ArrowRight: 5, ArrowDown: 5, ArrowLeft: -5, ArrowUp: -5 }[e.key];
    if (!d) return;
    e.preventDefault();
    if (st.mode === 'quiz') { if (!st.answered) st.guess = normAngle(st.guess + d); } else { st.angle = normAngle(st.angle + d); st.cond = null; }
    render();
  });

  function drawOverlays(axis, leads, show) {
    wheel.iso.replaceChildren(); wheel.projectionG.replaceChildren(); wheel.quadrantShade.setAttribute('d', '');
    for (const [id, g] of Object.entries(wheel.leadLines)) { g.classList.toggle('is-picked', id === st.lead); g.classList.remove('is-iso'); }
    if (!show) return;
    const byId = Object.fromEntries(leads.map(l => [l.id, l]));
    if (st.method === 0) {
      const q = quadrant(byId.I.net, byId.aVF.net, byId.II.net);
      const [a0, a1] = q.range;
      wheel.quadrantShade.setAttribute('d', arc(0.01, RING, a0, a1));
    } else if (st.method === 1) {
      const { lead, candidates } = isoelectric(leads);
      const [x1, y1] = polar(RING, candidates[0]), [x2, y2] = polar(RING, candidates[1]);
      wheel.iso.append(svg('line', { x1, y1, x2, y2, class: 'axl-perp' }));
      wheel.leadLines[lead.id].classList.add('is-iso');
      for (const c of candidates) { const [x, y] = polar(RING, c); wheel.iso.append(svg('circle', { cx: x, cy: y, r: 5, class: 'axl-cand' })); }
    }
    const lead = st.lead ? byId[st.lead] : null;
    if (lead) {
      const [tx, ty] = polar(RING - 6, axis), [fx, fy] = polar((RING - 6) * lead.p, lead.angle);
      wheel.projectionG.append(svg('line', { x1: tx, y1: ty, x2: fx, y2: fy, class: 'axl-drop' }),
        svg('line', { x1: C, y1: C, x2: fx, y2: fy, class: lead.p >= 0 ? 'axl-proj-pos' : 'axl-proj-neg' }));
    }
  }

  function drawStrips(leads, show) {
    for (const l of leads) {
      const c = cards[l.id], mid = c.h / 2, pts = [];
      for (let ms = 0; ms <= STRIP_MS; ms += 4) pts.push(`${pts.length ? 'L' : 'M'}${((ms / 40) * MM).toFixed(1)},${(mid - leadSample(ms, l) * 10 * MM).toFixed(1)}`);
      c.trace.setAttribute('d', pts.join(''));
      c.trace.setAttribute('stroke', st.lead === l.id ? LEAD_COLOR[l.id] : '#1f2937');
      c.card.setAttribute('aria-pressed', String(st.lead === l.id));
      c.card.setAttribute('aria-label', `${l.id}: R ${(l.r * 10).toFixed(1)} mm, S ${(l.s * 10).toFixed(1)} mm`);
      const n = l.net * 10;
      c.rMark.textContent = `R ${(l.r * 10).toFixed(0)} · S ${(l.s * 10).toFixed(0)}`;
      c.net.textContent = show || st.mode === 'quiz' ? `${t().net} ${signed(n)} mm` : '';
      c.net.dataset.sign = Math.abs(n) < 1.5 ? 'iso' : n > 0 ? 'pos' : 'neg';
    }
  }

  function render() {
    const text = t(), quiz = st.mode === 'quiz';
    const axis = quiz ? quizAxis(st.quizSeed) : st.angle;
    const leads = limbLeads(axis);
    const byId = Object.fromEntries(leads.map(l => [l.id, l]));
    const revealed = !quiz || st.answered;
    root.dataset.mode = st.mode;
    modeSeg.setAttribute('aria-label', text.modes.join(' / '));
    modeBtns.forEach((b, i) => { b.textContent = text.modes[i]; b.setAttribute('aria-pressed', String(b.dataset.axisMode === st.mode)); });
    presets.setAttribute('aria-label', text.presets);
    presetBtns.forEach((b, i) => { b.textContent = conditions[i].name[getLang() === 'en' ? 'en' : 'tr'].replace(/\s*\(.*\)$/, '') + ` (${fmt(conditions[i].angle)})`; b.setAttribute('aria-pressed', String(!quiz && st.cond === conditions[i].id)); });
    wheel.title.textContent = text.wheel; wheel.root.setAttribute('aria-label', text.wheel);
    wheelCaption.textContent = text.wheel;
    leadsTitle.textContent = text.leadsTitle;
    setArrow(wheel.truth, axis, revealed);
    setArrow(wheel.user, quiz ? st.guess : axis, true);
    wheel.user.classList.toggle('is-guess', quiz);
    wheel.user.setAttribute('aria-valuenow', String(quiz ? st.guess : axis));
    wheel.user.setAttribute('aria-valuetext', fmt(quiz ? st.guess : axis));
    wheel.user.setAttribute('aria-label', quiz ? text.your : text.slider);
    drawOverlays(axis, leads, revealed);
    drawStrips(leads, revealed);
    projText.textContent = st.lead && revealed ? text.projection(st.lead, byId[st.lead].p) : text.pick;
    sliderLabel.textContent = quiz ? text.your : text.slider;
    input.value = String(quiz ? st.guess : axis);
    out.textContent = fmt(quiz ? st.guess : axis);
    const cat = axisCategory(axis);
    result.dataset.cat = revealed ? cat : '';
    result.textContent = revealed ? `${fmt(axis)} · ${text.cat[cat]}` : text.quizIntro;
    quizBar.hidden = !quiz;
    checkBtn.textContent = text.check; nextBtn.textContent = text.next; checkBtn.disabled = st.answered;
    score.textContent = text.score(st.score, st.tries);
    if (quiz && st.answered) {
      const g = gradeAnswer(st.guess, axis);
      quizText.textContent = `${text.verdict[g.verdict]} · ${text.your} ${fmt(st.guess)}, ${text.truth} ${fmt(axis)} · ${text.errorText(g.error, g.sameCategory)}`;
      quizText.dataset.verdict = g.verdict;
    } else { quizText.textContent = ''; quizText.dataset.verdict = ''; }
    methodBtns.forEach((b, i) => { b.textContent = text.methods[i]; b.setAttribute('aria-selected', String(st.method === i)); });
    method.hidden = !revealed;
    const ni = byId.I.net * 10, nf = byId.aVF.net * 10;
    let steps;
    if (st.method === 0) { const q = quadrant(byId.I.net, byId.aVF.net, byId.II.net); steps = text.m1(byId.I.net, byId.aVF.net, byId.II.net, text.qText[q.id]); }
    else if (st.method === 1) { const iso = isoelectric(leads); const pick = pickCandidate(iso.candidates, leads); steps = text.m2(iso.lead.id, iso.candidates[0], iso.candidates[1], pick.tallest.id, pick.axis); }
    else steps = text.m3(ni, nf, axisFromNet(ni, nf));
    methodBody.replaceChildren(...steps.map(s => el('li', '', s)));
    const cond = !quiz && conditions.find(c => c.id === st.cond);
    cause.hidden = !cond;
    if (cond) { const lang = getLang() === 'en' ? 'en' : 'tr'; cause.replaceChildren(el('strong', '', `${text.cause}: ${cond.name[lang]}`), el('p', '', cond.causes[lang])); }
    note.textContent = text.note;
    Object.assign(state, st);
  }

  render();
  return { element: root, destroy() { root.remove(); }, sync({ angle } = {}) { if (Number.isFinite(angle)) { st.angle = normAngle(angle); st.mode = 'explore'; render(); } }, getState: () => ({ ...st, axisError: angleError(st.guess, quizAxis(st.quizSeed)) }) };
}

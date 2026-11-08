// Whiteboard P-V loop lessons: anatomy of the loop, increased afterload and
// decreased lusitropy, redrawn as animated step-through mini-lessons on the
// shared cardiac cycle clock. Numbers come from the teaching P-V model
// (hemo-pv-model.js); the checklists are verified against it.
import { PV_V0, pvParams, pvModelLoop } from '../hemo-pv-model.js';
import { createCycleClock, createMotionBar, cyclePhaseAt, loopPointAt, tweenValues } from './cycle-clock.js';
if (typeof document !== 'undefined') import('./pv-lessons.css');

// ---------------------------------------------------------------------------
// Pure helpers (no DOM), exported for unit tests.
// ---------------------------------------------------------------------------

/** Model inputs per lesson (normal preset; only one parameter changes). */
export const LESSON_PARAMS = Object.freeze({
  anatomy: Object.freeze({ base: Object.freeze({}) }),
  // Acute rise in arterial elastance with preload (EDV) held, before any Frank-Starling compensation.
  afterload: Object.freeze({ key: 'ea', base: Object.freeze({ ea: 1.11 }), next: Object.freeze({ ea: 2.0 }) }),
  // Stiffer ventricle with EDV held: the steeper EDPVR' sets a higher EDP; systole is untouched.
  lusitropy: Object.freeze({ key: 'stiffness', base: Object.freeze({ stiffness: 0.025 }), next: Object.freeze({ stiffness: 0.042 }) })
});

/** Loop for a lesson input on the normal preset. */
export function lessonLoop(input = {}) {
  return pvModelLoop(pvParams(input, 'normal'));
}

const pointAt = (loop, u) => loopPointAt(loop.points, u);

/** Valve events and pressures of a loop: the four corners, systolic (peak) and diastolic (AV opening) pressure. */
export function loopLandmarks(loop) {
  const { phases } = loop;
  const avOpen = pointAt(loop, phases.ejection[0]);
  return {
    mvClose: { v: loop.edv, p: loop.edp, u: phases.ivc[0] },
    avOpen: { ...avOpen, u: phases.ejection[0] },
    avClose: { v: loop.esv, p: loop.esp, u: phases.ivr[0] },
    mvOpen: { ...pointAt(loop, 0), u: 0 },
    sbp: loop.peak,
    dbp: avOpen.p
  };
}

const METRICS = ['edv', 'esv', 'sv', 'esp', 'edp', 'sbp', 'dbp'];
const metricsOf = loop => {
  const lm = loopLandmarks(loop);
  return { edv: loop.edv, esv: loop.esv, sv: loop.sv, esp: loop.esp, edp: loop.edp, sbp: lm.sbp, dbp: lm.dbp };
};

/** "What changed" table: { metric: { from, to, delta } } between two lesson inputs. */
export function lessonDelta(baseInput, nextInput) {
  const a = metricsOf(lessonLoop(baseInput)), b = metricsOf(lessonLoop(nextInput));
  return Object.fromEntries(METRICS.map(k => [k, { from: a[k], to: b[k], delta: b[k] - a[k] }]));
}

// A change below this is "no change" (mL or mmHg); above RISE it counts as a rise or fall.
const SAME = 1, RISE = 2;

/** Afterload checklist checked against the model: ESV up, SBP (and DBP) up, SV down. */
export function afterloadChecklist(d = lessonDelta(LESSON_PARAMS.afterload.base, LESSON_PARAMS.afterload.next)) {
  return [
    { key: 'esv', ok: d.esv.delta > RISE },
    { key: 'sbp', ok: d.sbp.delta > RISE && d.dbp.delta > RISE },
    { key: 'sv', ok: d.sv.delta < -RISE }
  ];
}

/** Lusitropy checklist checked against the model: EDV unchanged, EDP up, SV / ESV / ESP unchanged. */
export function lusitropyChecklist(d = lessonDelta(LESSON_PARAMS.lusitropy.base, LESSON_PARAMS.lusitropy.next)) {
  const p = LESSON_PARAMS.lusitropy;
  return [
    { key: 'lusi', ok: p.next.stiffness > p.base.stiffness },
    { key: 'edv', ok: Math.abs(d.edv.delta) < SAME },
    { key: 'edp', ok: d.edp.delta > RISE },
    { key: 'same', ok: [d.sv, d.esv, d.esp].every(m => Math.abs(m.delta) < SAME) }
  ];
}

/** Frank-Starling curve (EDP on x, SV on y) for a diastolic stiffness, sampled over EDV. */
export function starlingCurve(stiffness, edvFrom = 70, edvTo = 190, step = 4) {
  const out = [];
  for (let edv = edvFrom; edv <= edvTo; edv += step) {
    const loop = lessonLoop({ edv, stiffness });
    out.push({ edv, edp: loop.edp, sv: loop.sv });
  }
  return out;
}

/** EDV at which a ventricle of this stiffness reaches the given EDP (bisection on the model EDPVR). */
export function edvAtEdp(stiffness, edp) {
  let lo = 60, hi = 280;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (lessonLoop({ edv: mid, stiffness }).edp > edp) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

/** The 8 anatomy steps in cycle order (valve events and phases) with the clock phase each one points at. */
export function anatomySteps(loop = lessonLoop()) {
  const { ivc, ejection, ivr } = loop.phases;
  const mid = ([a, b]) => (a + b) / 2;
  return [
    { key: 'mvClose', kind: 'event', u: ivc[0] },
    { key: 'ivc', kind: 'phase', u: mid(ivc) },
    { key: 'avOpen', kind: 'event', u: ejection[0] },
    { key: 'ejection', kind: 'phase', u: mid(ejection) },
    { key: 'avClose', kind: 'event', u: ivr[0] },
    { key: 'ivr', kind: 'phase', u: mid(ivr) },
    { key: 'mvOpen', kind: 'event', u: 0 },
    { key: 'filling', kind: 'phase', u: ivc[0] / 2 }
  ];
}

const EVENT_WINDOW = 0.03;
const wrapDist = (a, b) => { const d = Math.abs(a - b) % 1; return Math.min(d, 1 - d); };

/** Anatomy step key at clock phase u: a valve event when the point is on it, otherwise the phase. */
export function stepKeyAt(u, loop) {
  const ev = anatomySteps(loop).find(s => s.kind === 'event' && wrapDist(u, s.u) < EVENT_WINDOW);
  return ev ? ev.key : cyclePhaseAt(u, loop.phases);
}

/** Tween progress 0..1 of a lesson parameter on screen. */
export function lessonProgress(lessonId, shown) {
  const p = LESSON_PARAMS[lessonId];
  if (!p || !p.key) return 0;
  const k = (shown[p.key] - p.base[p.key]) / (p.next[p.key] - p.base[p.key]);
  return Math.min(1, Math.max(0, k));
}

// ---------------------------------------------------------------------------
// Text (TR / EN)
// ---------------------------------------------------------------------------

const T = {
  title: { tr: 'Tahta dersleri', en: 'Whiteboard lessons' },
  intro: { tr: 'Tahtadaki üç P-V döngüsü dersi, adım adım ve canlı.', en: 'The three P-V loop lessons from the board, step by step and live.' },
  tabs: {
    anatomy: { tr: '1. Döngünün anatomisi', en: '1. Anatomy of the loop' },
    afterload: { tr: '2. Ard yük artışı', en: '2. Increased afterload' },
    lusitropy: { tr: '3. Lusitropi azalması', en: '3. Decreased lusitropy' }
  },
  clock: { tr: 'Kalp döngüsü:', en: 'Cardiac cycle:' },
  pressure: { tr: 'BASINÇ (mmHg)', en: 'PRESSURE (mmHg)' },
  volume: { tr: 'HACİM (mL)', en: 'VOLUME (mL)' },
  prev: { tr: '◀ Önceki', en: '◀ Previous' },
  next: { tr: 'Sonraki ▶', en: 'Next ▶' },
  playAfter: { tr: 'Ard yükü artır', en: 'Increase afterload' },
  playLusi: { tr: 'Lusitropiyi azalt', en: 'Reduce lusitropy' },
  reverse: { tr: 'Geri al', en: 'Reverse' },
  done: { tr: 'tamam', en: 'done' },
  pending: { tr: 'bekliyor', en: 'pending' },
  starling: { tr: 'Frank-Starling: EDP ve SV', en: 'Frank-Starling: EDP vs SV' },
  noRise: { tr: 'EDP yükselemezse', en: 'If EDP cannot rise' },
  table: { tr: 'Ne değişti? (model)', en: 'What changed? (model)' },
  metric: { tr: 'Ölçüt', en: 'Metric' },
  before: { tr: 'Önce', en: 'Before' },
  after: { tr: 'Sonra', en: 'After' }
};

const LABELS = {
  mvClose: { tr: 'MK kapanır|(diyastol sonu noktası)', en: 'MV closes|(end-diastolic point)' },
  avOpen: { tr: 'AK açılır|(aort diyastolik basıncı)', en: 'AV opens|(aortic diastolic pressure)' },
  avClose: { tr: 'AK kapanır = ESP', en: 'AV closes = ESP' },
  mvOpen: { tr: 'MK açılır', en: 'MV opens' },
  filling: { tr: 'Ventrikül doluşu', en: 'Ventricular filling' },
  ivc: { tr: 'İzovolümik kasılma', en: 'Isovolumic contraction' },
  ejection: { tr: 'Sistolik ejeksiyon', en: 'Systolic ejection' },
  ivr: { tr: 'İzovolümik gevşeme', en: 'Isovolumic relaxation' }
};

const STEP_TEXT = {
  mvClose: { tr: 'Diyastol sonu noktası: LV basıncı sol atriyumu geçer ve mitral kapak kapanır; EDV ve EDP burada okunur.', en: 'End-diastolic point: LV pressure exceeds left atrial pressure and the mitral valve closes; EDV and EDP are read here.' },
  ivc: { tr: 'İzovolümik kasılma: dört kapak da kapalı, hacim EDV\'de sabit kalırken basınç hızla yükselir.', en: 'Isovolumic contraction: all four valves are closed, volume stays at EDV while pressure rises steeply.' },
  avOpen: { tr: 'Aort kapağı açılır: LV basıncı aortun diyastolik basıncına ulaşır.', en: 'Aortic valve opens: LV pressure reaches the aortic diastolic pressure.' },
  ejection: { tr: 'Sistolik ejeksiyon: kan aorta atılır, hacim EDV\'den ESV\'ye iner; tepe basınç sistolik kan basıncına yakındır.', en: 'Systolic ejection: blood leaves into the aorta, volume falls from EDV to ESV; the peak approximates systolic blood pressure.' },
  avClose: { tr: 'Aort kapağı kapanır: sistol sonu noktası (ESP) ESPVR doğrusunun üzerindedir; ESV ve ESP burada okunur.', en: 'Aortic valve closes: the end-systolic point (ESP) lies on the ESPVR line; ESV and ESP are read here.' },
  ivr: { tr: 'İzovolümik gevşeme: kapaklar yine kapalı, hacim ESV\'de sabitken basınç düşer.', en: 'Isovolumic relaxation: valves closed again, volume stays at ESV while pressure falls.' },
  mvOpen: { tr: 'Mitral kapak açılır: LV basıncı sol atriyum basıncının altına iner ve doluş başlar.', en: 'Mitral valve opens: LV pressure drops below left atrial pressure and filling begins.' },
  filling: { tr: 'Ventrikül doluşu: hacim ESV\'den EDV\'ye çıkar, basınç EDPVR boyunca hafifçe artar. SV = EDV − ESV.', en: 'Ventricular filling: volume rises from ESV to EDV, pressure creeps up along the EDPVR. SV = EDV − ESV.' }
};

const CHECK_TEXT = {
  afterload: {
    esv: { tr: 'ESV ↑ (ESV → ESV′)', en: 'ESV ↑ (ESV → ESV′)' },
    sbp: { tr: 'Sistolik KB ↑ (diyastolik KB ↑)', en: 'SBP ↑ (DBP ↑)' },
    sv: { tr: 'SV ↓', en: 'SV ↓' }
  },
  lusitropy: {
    lusi: { tr: '↓ Lusitropi (EDPVR → EDPVR′, daha dik)', en: '↓ Lusitropy (EDPVR → EDPVR′, steeper)' },
    edv: { tr: 'EDV değişmez', en: 'EDV unchanged' },
    edp: { tr: 'EDP ↑', en: 'EDP ↑' },
    same: { tr: 'SV, ESV ve ESP değişmez', en: 'No change in SV, ESV or ESP' }
  }
};

const NOTES = {
  afterload: { tr: 'Kontraktilite değişmediği için ESPVR aynı kalır; Ea doğrusu dikleşir ve yeni sistol sonu noktası aynı ESPVR üzerinde sağa ve yukarı kayar. EDV sabit tutuldu (akut durum, Frank-Starling telafisinden önce).', en: 'Contractility is unchanged, so the ESPVR stays put; the Ea line steepens and the new end-systolic point slides up and right along the same ESPVR. EDV is held (the acute picture, before any Frank-Starling compensation).' },
  lusitropy: { tr: 'Daha sert ventrikül: aynı EDV için daha yüksek EDP gerekir. Sistol etkilenmediği için SV, ESV ve ESP aynıdır; bedeli yüksek dolum basıncıdır (pulmoner konjesyon riski). EDP yükselemezse EDV ve dolayısıyla SV düşer.', en: 'Stiffer ventricle: the same EDV now needs a higher EDP. Systole is untouched, so SV, ESV and ESP stay the same; the cost is a higher filling pressure (risk of pulmonary congestion). If EDP cannot rise, EDV and therefore SV fall.' }
};

const METRIC_TEXT = {
  edv: 'EDV (mL)', esv: 'ESV (mL)', sv: 'SV (mL)', esp: 'ESP (mmHg)', edp: 'EDP (mmHg)',
  sbp: { tr: 'Sistolik KB (mmHg)', en: 'SBP (mmHg)' }, dbp: { tr: 'Diyastolik KB (mmHg)', en: 'DBP (mmHg)' }
};

// ---------------------------------------------------------------------------
// SVG drawing
// ---------------------------------------------------------------------------

const W = 520, H = 380, PAD = { l: 70, r: 16, t: 22, b: 52 }, X_MAX = 200, Y_MAX = 200;
const toX = v => PAD.l + (v / X_MAX) * (W - PAD.l - PAD.r);
const toY = p => H - PAD.b - (p / Y_MAX) * (H - PAD.t - PAD.b);
const f1 = n => n.toFixed(1);
const r0 = n => String(Math.round(n));
const pts = (list, fx, fy) => list.map(s => `${f1(fx(s))},${f1(fy(s))}`).join(' ');
const line = (x1, y1, x2, y2, cls) => `<line class="${cls}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"/>`;
const text = (x, y, str, cls, anchor = 'start', extra = '') => `<text class="${cls}" x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}"${extra}>${str}</text>`;
/** Text whose '|' separators become stacked lines. */
const lines = (x, y, str, cls, anchor) => `<text class="${cls}" x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}">${str.split('|')
  .map((part, i) => `<tspan x="${f1(x)}" dy="${i ? '1.15em' : 0}">${part}</tspan>`).join('')}</text>`;

/** Push label positions apart so neighbours keep at least `gap` px (input order is kept). */
function spread(values, gap) {
  const order = values.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < order.length; k++) order[k].y = Math.max(order[k].y, order[k - 1].y + gap);
  const out = []; order.forEach(o => { out[o.i] = o.y; }); return out;
}

function frame(t) {
  return line(PAD.l, H - PAD.b, W - PAD.r, H - PAD.b, 'pvl-axis') + line(PAD.l, PAD.t, PAD.l, H - PAD.b, 'pvl-axis')
    + text((PAD.l + W - PAD.r) / 2, H - 8, t(T.volume), 'pvl-axis-title', 'middle')
    + text(14, (PAD.t + H - PAD.b) / 2, t(T.pressure), 'pvl-axis-title', 'middle', ` transform="rotate(-90 14 ${f1((PAD.t + H - PAD.b) / 2)})"`);
}

/** Volume-axis landmarks [{v, label, cls}] with drop lines from y-values. */
function volumeTicks(items) {
  const rows = items.map((it, i) => items.slice(0, i).some(o => Math.abs(toX(o.v) - toX(it.v)) < 46) ? 1 : 0);
  return items.map((it, i) => line(toX(it.v), toY(it.p ?? 0), toX(it.v), H - PAD.b + 4, `pvl-drop ${it.cls || ''}`)
    + text(toX(it.v), H - PAD.b + 16 + rows[i] * 13, `${it.label} ${r0(it.v)}`, `pvl-tick ${it.cls || ''}`, 'middle')).join('');
}

/** Pressure-axis landmarks [{p, v, label, cls}] with lines to the loop. */
function pressureTicks(items) {
  const ys = spread(items.map(it => toY(it.p) + 4), 12);
  return items.map((it, i) => line(PAD.l - 4, toY(it.p), toX(it.v), toY(it.p), `pvl-drop ${it.cls || ''}`)
    + text(PAD.l - 6, ys[i], `${it.label} ${r0(it.p)}`, `pvl-tick ${it.cls || ''}`, 'end')).join('');
}

const loopPath = (loop, cls) => `<polygon class="${cls}" points="${pts(loop.points, s => toX(s.v), s => toY(s.p))}"/>`;
const espvrLine = (loop, cls = 'pvl-espvr') => {
  const v2 = Math.min(X_MAX - 20, PV_V0 + (Y_MAX - 10) / loop.ees);
  return line(toX(PV_V0), toY(0), toX(v2), toY(loop.espvr(v2)), cls);
};
const eaLine = (loop, cls) => line(toX(loop.edv), toY(0), toX(loop.esv), toY(loop.esp), cls);
function edpvrCurve(loop, cls) {
  const list = [];
  for (let v = PV_V0; v <= X_MAX - 6; v += 3) { const p = loop.edpvr(v); if (p > Y_MAX - 30) break; list.push({ v, p }); }
  return `<polyline class="${cls}" points="${pts(list, s => toX(s.v), s => toY(s.p))}"/>`;
}
/** Horizontal double arrow for the stroke volume above a loop. */
function svArrow(loop, label, cls) {
  const y = toY(Math.min(Y_MAX - 8, loop.peak + 12));
  return `<g class="pvl-sv ${cls}">${line(toX(loop.esv), y, toX(loop.edv), y, 'pvl-sv-line')}`
    + `<path d="M${f1(toX(loop.esv) + 7)},${f1(y - 4)} L${f1(toX(loop.esv))},${f1(y)} L${f1(toX(loop.esv) + 7)},${f1(y + 4)}M${f1(toX(loop.edv) - 7)},${f1(y - 4)} L${f1(toX(loop.edv))},${f1(y)} L${f1(toX(loop.edv) - 7)},${f1(y + 4)}"/>`
    + text((toX(loop.esv) + toX(loop.edv)) / 2, y - 6, `${label} ${r0(loop.sv)} mL`, 'pvl-tick', 'middle') + '</g>';
}

/** Anatomy annotations: valve-event dots and phase labels, each with a data key the live layer lights up. */
function anatomyNotes(loop, t) {
  const lm = loopLandmarks(loop);
  const ev = (key, q, dx, dy, anchor) => `<g class="pvl-note" data-note="${key}"><circle cx="${f1(toX(q.v))}" cy="${f1(toY(q.p))}" r="4.5"/>`
    + lines(toX(q.v) + dx, toY(q.p) + dy, t(LABELS[key]), 'pvl-label', anchor) + '</g>';
  const ph = (key, x, y, anchor, extra = '') => `<g class="pvl-note" data-note="${key}">${text(x, y, t(LABELS[key]), 'pvl-label pvl-phase', anchor, extra)}</g>`;
  const midP = (lm.avOpen.p + loop.edp) / 2;
  const ivrP = loop.esp * 0.6;
  return ev('mvClose', lm.mvClose, 8, -2, 'start') + ev('avOpen', lm.avOpen, 8, -4, 'start')
    + ev('avClose', lm.avClose, -8, -8, 'end') + ev('mvOpen', lm.mvOpen, -8, -6, 'end')
    + ph('filling', toX((loop.esv + loop.edv) / 2), toY(loop.edp) - 10, 'middle')
    + ph('ivc', toX(loop.edv) - 10, toY(midP), 'middle', ` transform="rotate(-90 ${f1(toX(loop.edv) - 10)} ${f1(toY(midP))})"`)
    + ph('ejection', toX((loop.esv + loop.edv) / 2), toY(loop.peak) + 22, 'middle')
    + ph('ivr', toX(loop.esv) + 16, toY(ivrP), 'middle', ` transform="rotate(-90 ${f1(toX(loop.esv) + 16)} ${f1(toY(ivrP))})"`);
}

function drawAnatomy(loop, t) {
  const lm = loopLandmarks(loop);
  return edpvrCurve(loop, 'pvl-edpvr pvl-faint') + espvrLine(loop, 'pvl-espvr pvl-faint') + loopPath(loop, 'pvl-loop')
    + svArrow(loop, 'SV', '')
    + volumeTicks([{ v: loop.esv, p: loop.esp, label: 'ESV' }, { v: loop.edv, p: loop.edp, label: 'EDV' }])
    + pressureTicks([{ p: loop.esp, v: loop.esv, label: 'ESP' }, { p: loop.edp, v: loop.edv, label: 'EDP' }, { p: lm.dbp, v: lm.avOpen.v, label: 'DBP', cls: 'pvl-soft' }])
    + anatomyNotes(loop, t);
}

function drawAfterload(base, cur) {
  const lb = loopLandmarks(base), lc = loopLandmarks(cur);
  return espvrLine(cur) + eaLine(base, 'pvl-ea pvl-ghost-line') + eaLine(cur, 'pvl-ea')
    + loopPath(base, 'pvl-loop pvl-ghost') + loopPath(cur, 'pvl-loop')
    + svArrow(base, 'SV', 'pvl-sv-ghost') + svArrow(cur, 'SV′', '')
    + text(toX(PV_V0 + 22) + 8, toY(cur.espvr(PV_V0 + 22)) + 4, 'ESPVR', 'pvl-curve-label pvl-red')
    + text(toX(cur.edv) + 4, toY(14), 'Ea′', 'pvl-curve-label pvl-blue')
    + volumeTicks([{ v: base.esv, p: base.esp, label: 'ESV', cls: 'pvl-soft' }, { v: cur.esv, p: cur.esp, label: 'ESV′' }, { v: cur.edv, label: 'EDV' }])
    + pressureTicks([{ p: lb.sbp, v: base.edv - base.sv / 2, label: 'SBP', cls: 'pvl-soft' }, { p: lc.sbp, v: cur.edv - cur.sv / 2, label: 'SBP′' }, { p: lc.dbp, v: cur.edv, label: 'DBP′' }]);
}

function drawLusitropy(base, cur) {
  return espvrLine(cur, 'pvl-espvr pvl-faint') + edpvrCurve(base, 'pvl-edpvr') + edpvrCurve(cur, 'pvl-edpvr pvl-edpvr-new')
    + loopPath(base, 'pvl-loop pvl-ghost') + loopPath(cur, 'pvl-loop')
    + text(toX(X_MAX - 30), toY(base.edpvr(X_MAX - 30)) + 14, 'EDPVR', 'pvl-curve-label pvl-orange', 'end')
    + text(toX(cur.edv + 8), toY(Math.min(Y_MAX - 40, cur.edpvr(cur.edv + 22))), 'EDPVR′', 'pvl-curve-label pvl-red')
    + volumeTicks([{ v: cur.esv, p: cur.esp, label: 'ESV' }, { v: cur.edv, p: cur.edp, label: 'EDV' }])
    + pressureTicks([{ p: cur.esp, v: cur.esv, label: 'ESP' }, { p: base.edp, v: base.edv, label: 'EDP', cls: 'pvl-soft' }, { p: cur.edp, v: cur.edv, label: 'EDP′' }]);
}

// Frank-Starling inset (EDP on x, SV on y).
const SW = 300, SH = 240, SP = { l: 44, r: 12, t: 14, b: 40 }, S_EDP = 32, S_SV = 120;
const sx = e => SP.l + (e / S_EDP) * (SW - SP.l - SP.r);
const sy = s => SH - SP.b - (s / S_SV) * (SH - SP.t - SP.b);
const STARLING_CACHE = new Map();
const cachedCurve = s => { const k = s.toFixed(4); if (!STARLING_CACHE.has(k)) STARLING_CACHE.set(k, starlingCurve(s)); return STARLING_CACHE.get(k); };

function drawStarling(shown, k, t) {
  const p = LESSON_PARAMS.lusitropy;
  const curve = (s, cls) => `<polyline class="${cls}" points="${pts(cachedCurve(s).filter(q => q.edp <= S_EDP), q => sx(q.edp), q => sy(q.sv))}"/>`;
  const cur = lessonLoop(shown), base = lessonLoop(p.base);
  let out = line(SP.l, SH - SP.b, SW - SP.r, SH - SP.b, 'pvl-axis') + line(SP.l, SP.t, SP.l, SH - SP.b, 'pvl-axis')
    + text((SP.l + SW - SP.r) / 2, SH - 8, 'EDP (mmHg)', 'pvl-axis-title', 'middle')
    + text(12, (SP.t + SH - SP.b) / 2, 'SV (mL)', 'pvl-axis-title', 'middle', ` transform="rotate(-90 12 ${f1((SP.t + SH - SP.b) / 2)})"`);
  [0, 10, 20, 30].forEach(e => { out += text(sx(e), SH - SP.b + 14, String(e), 'pvl-num', 'middle'); });
  [0, 40, 80, 120].forEach(s => { out += text(SP.l - 6, sy(s) + 4, String(s), 'pvl-num', 'end'); });
  out += curve(p.base.stiffness, 'pvl-fs pvl-fs-base') + curve(p.next.stiffness, 'pvl-fs pvl-fs-new');
  out += line(sx(base.edp), sy(base.sv), sx(cur.edp), sy(cur.sv), 'pvl-fs-shift');
  out += `<circle class="pvl-fs-dot pvl-fs-dot-base" cx="${f1(sx(base.edp))}" cy="${f1(sy(base.sv))}" r="4"/>`;
  if (k >= 0.99) {
    const noRise = lessonLoop({ edv: edvAtEdp(p.next.stiffness, base.edp), stiffness: p.next.stiffness });
    out += `<circle class="pvl-fs-dot pvl-fs-dot-alt" cx="${f1(sx(noRise.edp))}" cy="${f1(sy(noRise.sv))}" r="5"/>`
      + text(sx(noRise.edp) + 4, sy(noRise.sv) + 18, `${t(T.noRise)}: SV ${r0(noRise.sv)}`, 'pvl-tick pvl-soft');
  }
  out += `<circle class="pvl-fs-dot" cx="${f1(sx(cur.edp))}" cy="${f1(sy(cur.sv))}" r="6"/>`;
  return out;
}

// ---------------------------------------------------------------------------
// Lab
// ---------------------------------------------------------------------------

const LESSONS = ['anatomy', 'afterload', 'lusitropy'];
const CHECK_AT = { afterload: [0.3, 0.6, 0.9], lusitropy: [0.15, 0.4, 0.65, 0.95] };

function template(id) {
  const tabs = LESSONS.map(l => `<button type="button" role="tab" class="preset-pill pvl-tab" id="${id}-tab-${l}" aria-controls="${id}-panel" data-lesson="${l}"></button>`).join('');
  return `
    <header class="pvl-head"><h3 data-t="title"></h3><p data-t="intro"></p></header>
    <div class="preset-pill-group pvl-tabs" role="tablist" data-tablist>${tabs}</div>
    <div class="pvl-panel" role="tabpanel" id="${id}-panel" data-panel>
      <div class="pvl-boards">
        <div class="pvl-board">
          <svg viewBox="0 0 ${W} ${H}" class="pvl-svg" role="img" data-main-svg>
            <g data-static></g>
            <g data-live><polyline class="pvl-trace" data-trace/><circle class="pvl-dot" r="7" data-dot/></g>
          </svg>
        </div>
        <div class="pvl-board pvl-starling" data-starling-board hidden>
          <h4 data-t="starling"></h4>
          <svg viewBox="0 0 ${SW} ${SH}" class="pvl-svg" role="img" data-starling-svg><g data-starling></g></svg>
        </div>
      </div>
      <div class="pvl-side">
        <div class="pvl-steps" data-steps>
          <div class="pvl-step-nav">
            <button type="button" class="preset-pill" data-prev></button>
            <span class="pvl-step-count" data-step-count></span>
            <button type="button" class="preset-pill" data-next></button>
          </div>
          <p class="pvl-step-text" data-step-text aria-live="polite"></p>
        </div>
        <div class="pvl-change" data-change hidden>
          <div class="pvl-actions">
            <button type="button" class="preset-pill active" data-play></button>
            <button type="button" class="preset-pill" data-reverse></button>
          </div>
          <ol class="pvl-checklist" data-checklist></ol>
          <p class="pvl-note-text" data-note-text></p>
          <table class="pvl-table" data-table></table>
        </div>
      </div>
    </div>`;
}

let instanceCount = 0;

export function createPvLessonsLab({ container, lang = 'tr' } = {}) {
  if (!container) throw new Error('createPvLessonsLab: container is required');
  let currentLang = lang === 'en' ? 'en' : 'tr';
  const t = o => (typeof o === 'string' ? o : o[currentLang]);
  const id = `pvl-${++instanceCount}`;
  const root = document.createElement('section');
  root.className = 'pathophys-lab pv-lessons-lab';
  root.innerHTML = template(id);
  const $ = s => root.querySelector(s);
  const clock = createCycleClock({ bpm: 75, speed: 0.5 });
  const bar = createMotionBar(clock, { getLang: () => currentLang, label: T.clock });
  $('[data-tablist]').after(bar.element);
  container.append(root);

  let lesson = 'anatomy', shown = { ...LESSON_PARAMS.anatomy.base }, loop = lessonLoop(shown);
  let stepIndex = 0, liveKey = null, cancelTween = () => {};

  function setLesson(next) {
    cancelTween();
    lesson = next;
    shown = { ...LESSON_PARAMS[next].base };
    liveKey = null;
    renderAll();
  }

  function renderTabs() {
    root.querySelectorAll('[data-lesson]').forEach(btn => {
      const on = btn.dataset.lesson === lesson;
      btn.textContent = t(T.tabs[btn.dataset.lesson]);
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', String(on));
      btn.tabIndex = on ? 0 : -1;
    });
    $('[data-panel]').setAttribute('aria-labelledby', `${id}-tab-${lesson}`);
  }

  function drawStatic() {
    loop = lessonLoop(shown);
    const base = lessonLoop(LESSON_PARAMS[lesson].base);
    const body = lesson === 'anatomy' ? drawAnatomy(loop, t) : lesson === 'afterload' ? drawAfterload(base, loop) : drawLusitropy(base, loop);
    $('[data-static]').innerHTML = frame(t) + body;
    $('[data-main-svg]').setAttribute('aria-label', `${t(T.tabs[lesson])}: EDV ${r0(loop.edv)} mL, ESV ${r0(loop.esv)} mL, SV ${r0(loop.sv)} mL, ESP ${r0(loop.esp)} mmHg, EDP ${r0(loop.edp)} mmHg`);
    if (lesson === 'lusitropy') {
      $('[data-starling]').innerHTML = drawStarling(shown, lessonProgress(lesson, shown), t);
      $('[data-starling-svg]').setAttribute('aria-label', `${t(T.starling)}: EDP ${r0(loop.edp)} mmHg, SV ${r0(loop.sv)} mL`);
    }
    renderChecklist();
    clock.refresh();
  }

  function renderChecklist() {
    if (lesson === 'anatomy') return;
    const k = lessonProgress(lesson, shown);
    const items = lesson === 'afterload' ? afterloadChecklist() : lusitropyChecklist();
    const d = lessonDelta(LESSON_PARAMS[lesson].base, LESSON_PARAMS[lesson].next);
    const value = key => (d[key] ? ` <small>${r0(d[key].from)} → ${r0(d[key].to)}</small>` : '');
    $('[data-checklist]').innerHTML = items.map((it, i) => {
      const done = k >= CHECK_AT[lesson][i] && it.ok;
      return `<li class="${done ? 'is-done' : ''}"><span class="pvl-check" aria-hidden="true">${done ? '✓' : '○'}</span>`
        + `<span>${t(CHECK_TEXT[lesson][it.key])}${value(it.key)}</span><span class="pvl-sr">(${t(done ? T.done : T.pending)})</span></li>`;
    }).join('');
  }

  function renderTable() {
    const d = lessonDelta(LESSON_PARAMS[lesson].base, LESSON_PARAMS[lesson].next);
    const rows = METRICS.map(m => `<tr><th scope="row">${t(METRIC_TEXT[m])}</th><td>${r0(d[m].from)}</td><td>${r0(d[m].to)}</td>`
      + `<td class="${Math.abs(d[m].delta) < SAME ? 'pvl-same' : 'pvl-diff'}">${d[m].delta >= 0 ? '+' : ''}${r0(d[m].delta)}</td></tr>`).join('');
    $('[data-table]').innerHTML = `<caption>${t(T.table)}</caption><thead><tr><th scope="col">${t(T.metric)}</th>`
      + `<th scope="col">${t(T.before)}</th><th scope="col">${t(T.after)}</th><th scope="col">Δ</th></tr></thead><tbody>${rows}</tbody>`;
  }

  function renderSide() {
    const anatomy = lesson === 'anatomy';
    $('[data-steps]').hidden = !anatomy;
    $('[data-change]').hidden = anatomy;
    $('[data-starling-board]').hidden = lesson !== 'lusitropy';
    root.classList.toggle('pvl-has-starling', lesson === 'lusitropy');
    $('[data-prev]').textContent = t(T.prev);
    $('[data-next]').textContent = t(T.next);
    if (anatomy) { renderStep(); return; }
    $('[data-play]').textContent = t(lesson === 'afterload' ? T.playAfter : T.playLusi);
    $('[data-reverse]').textContent = t(T.reverse);
    $('[data-note-text]').textContent = t(NOTES[lesson]);
    renderTable();
  }

  function renderStep() {
    const steps = anatomySteps(loop);
    $('[data-step-count]').textContent = `${stepIndex + 1} / ${steps.length}`;
    $('[data-step-text]').textContent = t(STEP_TEXT[steps[stepIndex].key]);
  }

  function renderAll() {
    root.querySelectorAll('[data-t]').forEach(n => { n.textContent = t(T[n.dataset.t]); });
    renderTabs();
    renderSide();
    drawStatic();
  }

  function goStep(delta) {
    const steps = anatomySteps(loop);
    stepIndex = (stepIndex + delta + steps.length) % steps.length;
    clock.seek(steps[stepIndex].u);
    renderStep();
  }

  function animateTo(which) {
    cancelTween();
    cancelTween = tweenValues(shown, { ...LESSON_PARAMS[lesson][which] }, values => { shown = values; drawStatic(); }, 1800);
  }

  function drawLive(state) {
    const u = state.phase, pt = loopPointAt(loop.points, u), phase = cyclePhaseAt(u, loop.phases);
    const dot = $('[data-dot]');
    dot.setAttribute('cx', f1(toX(pt.v)));
    dot.setAttribute('cy', f1(toY(pt.p)));
    const start = { filling: 0, ivc: loop.phases.ivc[0], ejection: loop.phases.ejection[0], ivr: loop.phases.ivr[0] }[phase];
    const trace = loop.points.filter(s => s.u >= start && s.u <= u).concat([pt]);
    $('[data-trace]').setAttribute('points', pts(trace, s => toX(s.v), s => toY(s.p)));
    bar.render(state, phase);
    if (lesson !== 'anatomy') return;
    const key = stepKeyAt(u, loop);
    if (key === liveKey) return;
    liveKey = key;
    root.querySelectorAll('[data-note]').forEach(n => n.classList.toggle('is-lit', n.dataset.note === key));
    if (state.playing) {
      stepIndex = anatomySteps(loop).findIndex(s => s.key === key);
      renderStep();
    }
  }

  // Lit labels must be re-applied after the static layer is redrawn.
  const relight = () => { liveKey = null; drawLive(clock.getState()); };

  function onTabKey(e) {
    const i = LESSONS.indexOf(lesson);
    const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: LESSONS.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    setLesson(LESSONS[(map[e.key] + LESSONS.length) % LESSONS.length]);
    relight();
    $(`#${id}-tab-${lesson}`).focus();
  }

  const listeners = [
    [$('[data-tablist]'), 'click', e => { const b = e.target.closest('[data-lesson]'); if (b) { setLesson(b.dataset.lesson); relight(); } }],
    [$('[data-tablist]'), 'keydown', onTabKey],
    [$('[data-prev]'), 'click', () => goStep(-1)],
    [$('[data-next]'), 'click', () => goStep(1)],
    [$('[data-play]'), 'click', () => animateTo('next')],
    [$('[data-reverse]'), 'click', () => animateTo('base')]
  ];
  listeners.forEach(([el, type, fn]) => el.addEventListener(type, fn));

  renderAll();
  const unsubscribe = clock.subscribe(drawLive);

  return {
    updateLanguage(next) {
      currentLang = next === 'en' ? 'en' : 'tr';
      bar.setLanguage();
      renderAll();
      relight();
    },
    /** Inspection hook for tests: lesson, parameter progress and loop numbers on screen. */
    getState: () => ({ lesson, progress: lessonProgress(lesson, shown), phase: clock.getState().phase, edv: loop.edv, esv: loop.esv, sv: loop.sv, esp: loop.esp, edp: loop.edp }),
    destroy() {
      cancelTween();
      unsubscribe();
      clock.destroy();
      listeners.forEach(([el, type, fn]) => el.removeEventListener(type, fn));
      root.remove();
    }
  };
}

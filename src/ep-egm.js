// Synthetic intracardiac electrogram (EGM) strip for the AVNRT slow pathway lesson.
// It is a teaching schematic built from Gaussian-derivative spikes, never a
// clinical recording and never a decision rule.

/** Recorder channels, top to bottom. */
export const EGM_CHANNELS = Object.freeze([
  { id: 'hra', label: 'HRA' }, { id: 'his-p', label: 'His p' }, { id: 'his-d', label: 'His d' },
  { id: 'cs-p', label: 'CS 9-10' }, { id: 'cs-d', label: 'CS 1-2' }, { id: 'abl-d', label: 'ABL d' }
].map(Object.freeze));

/** Scenario ids in lesson order. */
export const EGM_SCENARIOS = Object.freeze(['sinus', 'slow-target', 'junctional-rf', 'junctional-va-block']);

const WINDOW_MS = 1200;
const AH = 80;
const HV = 45;
const VA = 70;

// Colours of the 3D catheters: His magenta, CS blue, ABL purple; HRA (not drawn in 3D) grey.
const COLORS = {
  hra: '#c9d6cf', 'his-p': '#f0abfc', 'his-d': '#e879f9', 'cs-p': '#7fb2ff', 'cs-d': '#5b8cff', 'abl-d': '#b99bff'
};

const BUTTON_LABELS = {
  sinus: { tr: 'Sinüs', en: 'Sinus' },
  'slow-target': { tr: 'Yavaş yol', en: 'Slow pathway' },
  'junctional-rf': { tr: 'RF junctional', en: 'RF junctional' },
  'junctional-va-block': { tr: 'VA blok', en: 'VA block' }
};

// Near-field: sharp and large. Far-field: broad and small.
function ev(type, t, amp, sigma = 5, far = false) {
  return { type, t, amp, sigma, far };
}

function sinusBeat(t0, fragmented) {
  const aHis = t0 + 35;
  const h = aHis + AH;
  const v = h + HV;
  // At the slow pathway the local A is small (sometimes two components), V is large, no H.
  const ablA = fragmented
    ? [ev('A', t0 + 46, 0.2, 4), ev('A', t0 + 62, 0.16, 4)]
    : [ev('A', t0 + 48, 0.24, 5)];
  return {
    kind: 'sinus',
    vaBlock: false,
    his: { a: aHis, h, v },
    events: {
      hra: [ev('A', t0, 0.9), ev('V', v + 10, 0.22, 15, true)],
      'his-p': [ev('A', aHis - 3, 0.6), ev('H', h, 0.35, 4), ev('V', v, 0.7, 6)],
      'his-d': [ev('A', aHis, 0.35), ev('H', h, 0.75, 4), ev('V', v, 0.9)],
      'cs-p': [ev('A', t0 + 45, 0.8), ev('V', v + 15, 0.45, 6)],
      'cs-d': [ev('A', t0 + 75, 0.7), ev('V', v + 25, 0.5, 6)],
      'abl-d': [...ablA, ev('V', v + 5, 0.8)]
    }
  };
}

// Junctional beat: H then V, retrograde A earliest on His / proximal CS (concentric).
function junctionalBeat(h, vaBlock) {
  const v = h + HV;
  const a = v + VA;
  const retro = (list) => (vaBlock ? [] : list);
  return {
    kind: 'junctional',
    vaBlock,
    his: { a: vaBlock ? null : a, h, v },
    events: {
      hra: [ev('V', v + 10, 0.22, 15, true), ...retro([ev('A', a + 40, 0.9)])],
      'his-p': [ev('H', h, 0.35, 4), ev('V', v, 0.7, 6), ...retro([ev('A', a - 2, 0.6)])],
      'his-d': [ev('H', h, 0.75, 4), ev('V', v, 0.9), ...retro([ev('A', a, 0.35)])],
      'cs-p': [ev('V', v + 15, 0.45, 6), ...retro([ev('A', a + 6, 0.8)])],
      'cs-d': [ev('V', v + 25, 0.5, 6), ...retro([ev('A', a + 28, 0.7)])],
      'abl-d': [ev('V', v + 5, 0.8), ...retro([ev('A', a + 4, 0.22)])]
    }
  };
}

const DISCLAIMER = { tr: 'Sentetik kayıt: klinik kayıt değildir.', en: 'Synthetic strip: not a clinical recording.' };

const DEFS = {
  sinus: {
    beats: [sinusBeat(100, false), sinusBeat(700, false)],
    intervals: { cl: 600, ah: AH, hv: HV, pa: 35, pr: 35 + AH + HV },
    rf: false,
    title: { tr: 'Sinüs ritmi: AH ve HV', en: 'Sinus rhythm: AH and HV' },
    text: {
      tr: `${DISCLAIMER.tr} Sinüs ritminde aktivasyon önce HRA'da görülür, ardından His kanallarına ve CS'de proksimalden distale yayılır. His d kanalında sırasıyla A, keskin H ve V izlenir: AH yaklaşık ${AH} ms (AV düğüm iletimi), HV yaklaşık ${HV} ms (His-Purkinje iletimi). Değerler öğretim amaçlı yaklaşık değerlerdir, karar kuralı değildir.`,
      en: `${DISCLAIMER.en} In sinus rhythm activation appears first on HRA, then on the His channels and along the CS from proximal to distal. His d shows A, a sharp H, then V: AH about ${AH} ms (AV nodal conduction) and HV about ${HV} ms (His-Purkinje conduction). The numbers are teaching approximations, not a decision rule.`
    }
  },
  'slow-target': {
    beats: [sinusBeat(100, true), sinusBeat(700, true)],
    intervals: { cl: 600, ah: AH, hv: HV, ablAtoV: 0.25 },
    rf: false,
    title: { tr: 'Yavaş yol hedefi (ABL d)', en: 'Slow pathway target (ABL d)' },
    text: {
      tr: `${DISCLAIMER.tr} Ablasyon kateteri Koch üçgeninin alt kısmında, koroner sinüs ağzı ile triküspit halka arasındaki yavaş yol bölgesindedir. ABL d kanalında küçük, bazen iki bileşenli (fragmante) A ve büyük V vardır; His potansiyeli görülmez. Hedef seçimi anatomi ile elektrogramın birlikte değerlendirilmesine dayanır; sabit bir A:V oranı karar kuralı değildir.`,
      en: `${DISCLAIMER.en} The ablation catheter sits in the inferior Koch triangle, in the slow pathway region between the coronary sinus ostium and the tricuspid annulus. ABL d shows a small, sometimes two-component (fragmented) A and a large V, with no His potential. Target choice relies on anatomy plus the electrogram together; a fixed A:V ratio is not a decision rule.`
    }
  },
  'junctional-rf': {
    beats: [junctionalBeat(130, false), junctionalBeat(870, false)],
    intervals: { cl: 740, hv: HV, va: VA },
    rf: true,
    title: { tr: 'RF sırasında junctional ritim', en: 'Junctional rhythm during RF' },
    text: {
      tr: `${DISCLAIMER.tr} Yavaş yol bölgesine RF uygulanırken junctional atımlar görülebilir: His kanalında H ve ardından V, V'den kısa süre sonra da retrograd A gelir (VA yaklaşık ${VA} ms, 1:1 VA iletim). En erken retrograd A His ve proksimal CS'dedir, HRA daha geç aktive olur (konsantrik). Junctional ritim tek başına başarı göstergesi değildir; temel sonlanım, AV iletim korunarak AVNRT'nin indüklenememesidir. Bu şerit karar kuralı değildir.`,
      en: `${DISCLAIMER.en} Junctional beats may appear while RF is delivered at the slow pathway: on the His channel H is followed by V, and a retrograde A follows shortly after V (VA about ${VA} ms, 1:1 VA conduction). Earliest retrograde A is on His and proximal CS, HRA activates later (concentric). Junctional rhythm alone does not establish success; the key endpoint is noninducibility of AVNRT with preserved AV conduction. This strip is not a decision rule.`
    }
  },
  'junctional-va-block': {
    beats: [junctionalBeat(70, false), junctionalBeat(540, true), junctionalBeat(1010, false)],
    intervals: { cl: 470, hv: HV, va: VA, vaBlockBeats: [1] },
    rf: true,
    title: { tr: 'Junctional ritim + VA blok (uyarı)', en: 'Junctional rhythm + VA block (warning)' },
    text: {
      tr: `${DISCLAIMER.tr} RF sırasında hızlı junctional ritim vardır (siklus yaklaşık 470 ms) ve ikinci atımda V'den sonra retrograd A gelmez: VA blok. RF sırasında VA blok veya hızlı junctional ritim, enerjiyi durdurma uyarısıdır; AV iletim hasarı riski vardır. Bu şerit öğretim amaçlıdır, karar kuralı değildir.`,
      en: `${DISCLAIMER.en} Fast junctional rhythm appears during RF (cycle about 470 ms) and the second beat has V with no retrograde A: VA block. VA block or fast junctional rhythm during RF is a warning to stop energy delivery, because AV conduction is at risk. This strip is for teaching, not a decision rule.`
    }
  }
};

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

const SCENARIOS = new Map(EGM_SCENARIOS.map((id) => [id, deepFreeze({ id, windowMs: WINDOW_MS, ...DEFS[id] })]));

// Flat per-channel event lists so sampling does not walk the beat tree.
const EVENTS = new Map(EGM_SCENARIOS.map((id) => [id, new Map(EGM_CHANNELS.map((ch) => (
  [ch.id, SCENARIOS.get(id).beats.flatMap((beat) => beat.events[ch.id])]
)))]));

const CHANNEL_INDEX = new Map(EGM_CHANNELS.map((ch, i) => [ch.id, i]));

/**
 * Frozen description of a synthetic EGM scenario.
 * @param {string} id one of EGM_SCENARIOS
 * @returns {object|null} { id, windowMs, rf, beats, intervals, title, text } or null
 */
export function egmScenario(id) {
  return SCENARIOS.get(id) || null;
}

// Derivative-of-Gaussian spike, normalised so the peak equals amp.
function biphasic(t, center, sigma, amp) {
  const x = (t - center) / sigma;
  if (Math.abs(x) > 6) return 0;
  return -amp * x * Math.exp(0.5 - 0.5 * x * x);
}

// Deterministic baseline: sums of sines, seeded by channel index.
function baseline(t, seed, rf) {
  let n = 0.012 * Math.sin(t * 0.169 + seed * 1.7)
    + 0.007 * Math.sin(t * 0.531 + seed * 0.9)
    + 0.01 * Math.sin(t * 0.0123 + seed);
  if (rf) n += 0.03 * Math.sin(t * 2.03 + seed) * Math.sin(t * 0.047);
  return n;
}

/**
 * Synthetic EGM value for one channel at time tMs within the scenario window.
 * @returns {number} finite, roughly -1..1; 0 for unknown ids
 */
export function egmSample(scenarioId, channelId, tMs) {
  const list = EVENTS.get(scenarioId)?.get(channelId);
  const t = Number(tMs);
  if (!list || !Number.isFinite(t)) return 0;
  // RF artifact rides only on the ablation channel.
  const rf = SCENARIOS.get(scenarioId).rf && channelId === 'abl-d';
  let value = baseline(t, CHANNEL_INDEX.get(channelId), rf);
  for (const e of list) value += biphasic(t, e.t, e.sigma, e.amp);
  return value;
}

const LABEL_W = 58;
const HEADER_H = 18;
const FOOTER_H = 16;
const FONT = '10px ui-monospace, monospace';

const pick = (obj, lang) => (lang === 'en' ? obj.en : obj.tr);

function tag(ctx, text, x, y, color) {
  const w = ctx.measureText(text)?.width || text.length * 6;
  ctx.fillStyle = 'rgba(14, 24, 21, 0.85)';
  ctx.fillRect(x - 2, y - 9, w + 4, 11);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function polyline(ctx, points, color, lineWidth = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();
}

// Labels hang off the shared H tick (AH to its left, HV to its right) so they never overlap.
function bracket(ctx, x0, x1, y, label, color, align = 'center') {
  polyline(ctx, [[x0, y - 4], [x0, y], [x1, y], [x1, y - 4]], color);
  const w = ctx.measureText(label)?.width || label.length * 6;
  const x = align === 'right' ? x1 - w - 2 : align === 'left' ? x0 + 2 : (x0 + x1 - w) / 2;
  tag(ctx, label, x, y + 11, color);
}

function drawCalipers(ctx, scenario, lang, geo) {
  const row = geo.rowTop(CHANNEL_INDEX.get('his-d'));
  const bottom = row + geo.rowH - 4;
  ctx.font = '9px ui-monospace, monospace';
  for (const beat of scenario.beats) {
    const { a, h, v } = beat.his;
    if (beat.kind === 'sinus') {
      bracket(ctx, geo.x(a), geo.x(h), bottom - 10, `AH ${h - a}`, '#ffeca8', 'right');
      bracket(ctx, geo.x(h), geo.x(v), bottom - 10, `HV ${v - h}`, '#ffeca8', 'left');
      continue;
    }
    tag(ctx, 'V', geo.x(v) - 3, row + 9, '#d7f5e4');
    if (beat.vaBlock) {
      tag(ctx, lang === 'en' ? 'VA block' : 'VA blok', geo.x(v) + 10, bottom - 2, '#ff8a65');
      continue;
    }
    tag(ctx, 'A', geo.x(a) - 3, row + 9, '#d7f5e4');
    bracket(ctx, geo.x(v), geo.x(a), bottom - 10, `VA ${a - v}`, '#ffeca8');
  }
}

function drawFrame(ctx, width, height, scenario, lang, geo) {
  ctx.fillStyle = '#0e1815';
  ctx.fillRect(0, 0, width, height);
  // Faint grid: one vertical line every 100 ms.
  ctx.strokeStyle = 'rgba(120, 170, 150, 0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let t = 0; t <= scenario.windowMs; t += 100) {
    const x = Math.round(geo.x(t)) + 0.5;
    ctx.moveTo(x, HEADER_H);
    ctx.lineTo(x, height - FOOTER_H);
  }
  ctx.stroke();
  ctx.font = FONT;
  ctx.textBaseline = 'middle';
  EGM_CHANNELS.forEach((ch, i) => {
    ctx.fillStyle = COLORS[ch.id];
    ctx.fillText(ch.label, 6, geo.rowTop(i) + geo.rowH / 2);
  });
  ctx.textBaseline = 'alphabetic';
  if (width >= 520) {
    ctx.fillStyle = '#9fc7b6';
    ctx.fillText(pick(scenario.title, lang), LABEL_W, 13);
  }
  ctx.font = 'bold 13px ui-monospace, monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255, 214, 120, 0.6)';
  ctx.fillText(lang === 'en' ? 'SYNTHETIC · not a clinical recording' : 'SENTETİK · klinik kayıt değil', width - 6, 14);
  ctx.textAlign = 'left';
  // Scale bar: 100 ms, bottom left.
  const y = height - 5;
  polyline(ctx, [[geo.x(0), y], [geo.x(100), y]], '#d7f5e4', 1.5);
  ctx.font = FONT;
  ctx.fillStyle = '#d7f5e4';
  ctx.fillText('100 ms', geo.x(100) + 6, y + 3);
}

/**
 * Draw the synthetic EGM strip on a canvas (DPR aware, dark recorder look).
 * @param {HTMLCanvasElement} canvas
 * @param {string} scenarioId
 * @param {{ lang?: string, cursor?: number|null }} [options] cursor is a 0..1 fraction of the window
 */
export function drawEgm(canvas, scenarioId, { lang = 'tr', cursor = null } = {}) {
  const width = canvas?.clientWidth;
  const height = canvas?.clientHeight;
  if (!(width >= 2) || !(height >= 2)) return;
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.floor(width * dpr)) canvas.width = Math.floor(width * dpr);
  if (canvas.height !== Math.floor(height * dpr)) canvas.height = Math.floor(height * dpr);
  const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  if (!ctx) return;
  const scenario = SCENARIOS.get(scenarioId) || SCENARIOS.get('sinus');
  const plotW = Math.max(1, width - LABEL_W - 6);
  const rowH = (height - HEADER_H - FOOTER_H) / EGM_CHANNELS.length;
  const geo = { rowH, rowTop: (i) => HEADER_H + i * rowH, x: (t) => LABEL_W + (t / scenario.windowMs) * plotW };
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  drawFrame(ctx, width, height, scenario, lang, geo);

  const gain = rowH * 0.42;
  const steps = Math.max(120, Math.floor(plotW));
  ctx.lineWidth = 1.3;
  ctx.lineJoin = 'round';
  EGM_CHANNELS.forEach((ch, i) => {
    const mid = geo.rowTop(i) + rowH / 2;
    ctx.strokeStyle = COLORS[ch.id];
    ctx.beginPath();
    for (let s = 0; s <= steps; s++) {
      const t = (s / steps) * scenario.windowMs;
      const y = mid - egmSample(scenario.id, ch.id, t) * gain;
      if (s === 0) ctx.moveTo(geo.x(t), y);
      else ctx.lineTo(geo.x(t), y);
    }
    ctx.stroke();
  });
  drawCalipers(ctx, scenario, lang, geo);

  if (typeof cursor === 'number' && Number.isFinite(cursor)) {
    const x = geo.x(Math.min(1, Math.max(0, cursor)) * scenario.windowMs);
    polyline(ctx, [[x, HEADER_H], [x, height - FOOTER_H]], 'rgba(255, 236, 168, 0.85)', 1.2);
  }
}

/**
 * Build the synthetic EGM panel inside mount.
 * @param {HTMLElement} mount
 * @param {{ getLang?: () => string, onScenario?: (id: string) => void }} [options]
 * @returns {{ setScenario, getScenario, setLanguage, draw, show, hide, element }|null}
 */
export function createEgmPanel(mount, { getLang, onScenario } = {}) {
  const doc = mount?.ownerDocument || globalThis.document;
  if (!mount || !doc) return null;
  let lang = (typeof getLang === 'function' && getLang()) || 'tr';
  let scenarioId = 'sinus';
  let cursor = null;

  const el = (tagName, className) => {
    const node = doc.createElement(tagName);
    if (className) node.className = className;
    return node;
  };
  const root = el('section', 'egm-panel');
  const eyebrow = el('p', 'eyebrow');
  const title = el('h3', 'egm-title');
  const row = el('div', 'egm-scenarios');
  row.setAttribute('role', 'group');
  const buttons = EGM_SCENARIOS.map((id) => {
    const button = el('button');
    button.type = 'button';
    button.setAttribute('data-egm-scenario', id);
    button.addEventListener('click', () => {
      setScenario(id);
      if (typeof onScenario === 'function') onScenario(id);
    });
    row.appendChild(button);
    return button;
  });
  const canvas = el('canvas', 'egm-canvas');
  canvas.setAttribute('role', 'img');
  const text = el('p', 'egm-text');
  root.append(eyebrow, title, row, canvas, text);
  mount.appendChild(root);

  const redraw = () => drawEgm(canvas, scenarioId, { lang, cursor });

  function render() {
    const scenario = SCENARIOS.get(scenarioId);
    eyebrow.textContent = lang === 'en' ? 'SYNTHETIC ELECTROGRAM' : 'SENTETİK ELEKTROGRAM';
    title.textContent = pick(scenario.title, lang);
    text.textContent = pick(scenario.text, lang);
    row.setAttribute('aria-label', lang === 'en' ? 'EGM scenario' : 'EGM senaryosu');
    canvas.setAttribute('aria-label', `${lang === 'en' ? 'Synthetic electrogram strip, not a clinical recording' : 'Sentetik elektrogram şeridi, klinik kayıt değil'}: ${pick(scenario.title, lang)}`);
    buttons.forEach((button, i) => {
      const id = EGM_SCENARIOS[i];
      button.textContent = pick(BUTTON_LABELS[id], lang);
      button.setAttribute('aria-pressed', String(id === scenarioId));
    });
    redraw();
  }

  function setScenario(id) {
    if (!SCENARIOS.has(id)) return;
    scenarioId = id;
    render();
  }

  render();
  return {
    element: root,
    setScenario,
    getScenario: () => scenarioId,
    setLanguage(next) {
      lang = next === 'en' ? 'en' : 'tr';
      render();
    },
    draw(cycleState) {
      const phase = cycleState?.phase;
      cursor = typeof phase === 'number' && Number.isFinite(phase) ? phase : null;
      redraw();
    },
    show() { root.hidden = false; redraw(); },
    hide() { root.hidden = true; }
  };
}

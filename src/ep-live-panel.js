/*
 * Live EP recording system: a continuously sweeping multichannel monitor
 * driven by the conduction model (ep-live-model.js), with a programmable
 * stimulator (site, S1 × N, S2-S4, burst, pace and pause), DC cardioversion,
 * freeze and review of the last 30 s, sweep speed, interval readout and
 * vertical calipers. The strip is drawn by drawEgm on the visible window.
 */
import { drawEgm, timeAtX, channelAtY } from './ep-egm.js';
import { LIVE_CASES, LIVE_CHANNELS, LIVE_SITES, createLiveHeart, planTrain, liveIntervals } from './ep-live-model.js';
import { CALIPER_SNAP_MS, noCaliper, snapTime, placeCaliper, caliperText } from './ep-user-caliper.js';

const PX_PER_MM = 3.78;            // CSS pixels per millimetre (96 dpi)
const SPEEDS = [25, 50, 100];      // sweep, mm/s
const REVIEW_MS = 30000;           // frozen history that can be scrolled back
const KEEP_MS = 45000;             // event memory kept by the model
// Animation frame helpers that also load outside a browser (unit tests).
const nextFrame = (fn) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : 0);
const cancelFrame = (id) => { if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id); };

const TEXT = {
  tr: {
    caseLabel: 'Substrat', run: 'Dondur', resume: 'Devam', speed: 'Tarama', review: 'Geri sar', calipers: 'Kaliper',
    stim: 'Stimülatör', site: 'Uyarı yeri', s1: 'S1 (ms)', n: 'S1 sayısı', pace: 'Uyar (S1 + ekstra)', burst: 'Burst (yalnız S1)',
    pacePause: 'Uyar ve dondur', stop: 'Uyarıyı durdur', shock: 'Kardiyoversiyon',
    sites: { hra: 'HRA', 'cs-prox': 'CS proksimal', 'cs-dist': 'CS distal', rv: 'RV apeks' },
    cases: { normal: 'Normal iletim', 'avnrt-typical': 'Çift AV nodal yol (AVNRT substratı)', 'ort-left': 'Gizli sol lateral aksesuar yol', 'wpw-left': 'Manifest sol lateral aksesuar yol (WPW)' },
    intervals: 'Son atım', none: 'yok', frozen: 'Donduruldu: geri sarmak için kaydırın; ölçüm için Kaliper.',
    hint: 'Uyarı dizisi şimdiden 300 ms sonra başlar. Ekstrastimulus 0 ise kullanılmaz.',
    delivered: (txt) => `Verildi: ${txt}`, shocked: 'Senkronize DC şok verildi; sinüs ritmi bekleniyor.', stopped: 'Uyarı durduruldu.'
  },
  en: {
    caseLabel: 'Substrate', run: 'Freeze', resume: 'Run', speed: 'Sweep', review: 'Review', calipers: 'Calipers',
    stim: 'Stimulator', site: 'Pacing site', s1: 'S1 (ms)', n: 'S1 count', pace: 'Pace (S1 + extras)', burst: 'Burst (S1 only)',
    pacePause: 'Pace and freeze', stop: 'Stop pacing', shock: 'Cardiovert',
    sites: { hra: 'HRA', 'cs-prox': 'CS proximal', 'cs-dist': 'CS distal', rv: 'RV apex' },
    cases: { normal: 'Normal conduction', 'avnrt-typical': 'Dual AV nodal pathways (AVNRT substrate)', 'ort-left': 'Concealed left lateral accessory pathway', 'wpw-left': 'Manifest left lateral accessory pathway (WPW)' },
    intervals: 'Last beat', none: 'n/a', frozen: 'Frozen: scroll back with the slider; measure with Calipers.',
    hint: 'A train starts 300 ms from now. An extrastimulus of 0 is off.',
    delivered: (txt) => `Delivered: ${txt}`, shocked: 'Synchronized DC shock delivered; sinus rhythm expected.', stopped: 'Pacing stopped.'
  }
};

export function createLivePanel(doc, { getLang = () => 'tr' } = {}) {
  const el = (tag, cls, attrs = {}) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const T = () => TEXT[getLang() === 'en' ? 'en' : 'tr'];
  const state = { caseId: 'avnrt-typical', active: false, running: true, speed: 25, rate: 1, back: 0, frozenAt: null, pauseAt: null, caliperOn: false, caliper: noCaliper(), status: '' };
  let heart = createLiveHeart(state.caseId);
  let simNow = 0, lastWall = null, raf = 0, lastTrim = 0, drawn = null;

  const root = el('section', 'ep-live', { 'data-ep-live': '' });
  const caseRow = el('label', 'ep-case'); const caseName = el('span'); const caseSelect = el('select', '', { 'data-ep-live-case': '' });
  caseRow.append(caseName, caseSelect);
  const canvas = el('canvas', 'ep-live-canvas', { role: 'img' });
  const bar = el('div', 'ep-view');
  const runBtn = el('button', 'ep-size', { type: 'button', 'data-ep-live-run': '' });
  const speedSel = el('select', '', { 'data-ep-live-speed': '' });
  const review = el('input', '', { type: 'range', min: '0', max: String(REVIEW_MS), step: '50', 'data-ep-live-review': '' });
  const calBtn = el('button', 'ep-size', { type: 'button', 'data-ep-live-caliper': '' });
  bar.append(runBtn, speedSel, review, calBtn);
  const readout = el('p', 'ep-live-readout', { 'data-ep-live-intervals': '' });
  const info = el('p', 'ep-live-info', { 'aria-live': 'polite' });

  const stimBox = el('section', 'ep-pace ep-live-stim');
  const stimTitle = el('h4', 'ep-pace-title');
  const fieldLabels = [];
  const field = (key, input) => { const l = el('label', 'ep-pace-field'); const s = el('span'); fieldLabels.push([s, key]); l.append(s, input); return l; };
  const num = (key, value, min, max) => el('input', '', { type: 'number', min: String(min), max: String(max), step: '10', value: String(value), 'data-ep-live-stim': key });
  const siteSel = el('select', '', { 'data-ep-live-stim': 'site' });
  const inputs = { s1: num('s1', 600, 200, 1500), n: num('n', 8, 1, 20), s2: num('s2', 370, 0, 1000), s3: num('s3', 0, 0, 1000), s4: num('s4', 0, 0, 1000) };
  inputs.n.step = '1';
  const grid = el('div', 'ep-live-grid');
  grid.append(field('site', siteSel), field('s1', inputs.s1), field('n', inputs.n), field('S2', inputs.s2), field('S3', inputs.s3), field('S4', inputs.s4));
  const actions = el('div', 'ep-pace-actions');
  const button = (key, cls) => { const b = el('button', cls, { type: 'button', 'data-ep-live-action': key }); actions.append(b); return b; };
  const paceBtn = button('pace', 'ep-pace-deliver'), burstBtn = button('burst', 'ep-pace-retry'), pausePaceBtn = button('pace-pause', 'ep-pace-retry'), stopBtn = button('stop', 'ep-pace-retry'), shockBtn = button('shock', 'ep-pace-retry ep-live-shock');
  const hint = el('p', 'ep-pace-note');
  stimBox.append(stimTitle, grid, actions, hint);
  root.append(caseRow, bar, canvas, readout, info, stimBox);

  const spanMs = () => {
    const plot = Math.max(200, (canvas.clientWidth || 800) - 64);
    return (plot / (state.speed * PX_PER_MM)) * 1000;
  };
  const viewEnd = () => (state.running ? simNow : state.frozenAt - state.back);

  function setCase(id) {
    state.caseId = LIVE_CASES[id] ? id : 'normal';
    heart = createLiveHeart(state.caseId);
    simNow = 0; lastTrim = 0; state.back = 0; state.caliper = noCaliper(); state.status = '';
    advance(2500);   // open on a few sinus beats
    if (!state.running) state.frozenAt = simNow;
    render();
  }

  /** Advance the simulation by ms (also the test hook; the animation loop calls it per frame). */
  function advance(ms) {
    simNow += ms;
    heart.advanceTo(simNow);
    if (state.pauseAt != null && simNow >= state.pauseAt) { state.pauseAt = null; freeze(true); }
    if (simNow - lastTrim > 5000) { heart.trim(simNow - KEEP_MS); lastTrim = simNow; }
  }

  function freeze(flag) {
    state.running = !flag;
    state.frozenAt = flag ? simNow : null;
    state.back = 0;
    if (!flag) state.caliper = noCaliper();
    lastWall = null;
    render();
    if (state.running && state.active) loop();
  }

  function deliver(kind) {
    const s1 = Number(inputs.s1.value), n = Number(inputs.n.value);
    const extras = kind === 'burst' ? [] : ['s2', 's3', 's4'].map((k) => Number(inputs[k].value) || 0);
    const train = planTrain({ site: siteSel.value, start: simNow + 300, s1, n, extras });
    if (!train.length) return;
    if (!state.running) freeze(false);
    heart.stimulate(train);
    const used = extras.filter((x) => x > 0);
    state.status = T().delivered(`${T().sites[siteSel.value]} S1 ${s1} × ${n}${used.length ? ` + ${used.map((x, i) => `S${i + 2} ${x}`).join(', ')}` : ''}`);
    state.pauseAt = kind === 'pace-pause' ? train[train.length - 1].t + 1600 : null;
    render();
  }

  paceBtn.addEventListener('click', () => deliver('pace'));
  burstBtn.addEventListener('click', () => deliver('burst'));
  pausePaceBtn.addEventListener('click', () => deliver('pace-pause'));
  stopBtn.addEventListener('click', () => { heart.stopPacing(); state.pauseAt = null; state.status = T().stopped; render(); });
  shockBtn.addEventListener('click', () => { if (!state.running) freeze(false); heart.cardiovert(simNow + 50); state.status = T().shocked; render(); });
  runBtn.addEventListener('click', () => freeze(state.running));
  speedSel.addEventListener('change', () => { state.speed = Number(speedSel.value) || 25; render(); });
  review.addEventListener('input', () => { state.back = Number(review.value); state.caliper = noCaliper(); draw(); });
  calBtn.addEventListener('click', () => { state.caliperOn = !state.caliperOn; state.caliper = noCaliper(); render(); });
  caseSelect.addEventListener('change', () => setCase(caseSelect.value));
  canvas.addEventListener('click', (event) => {
    if (!state.caliperOn || !drawn) return;
    const rect = canvas.getBoundingClientRect();
    const local = timeAtX(event.clientX - rect.left, drawn);
    if (local == null) return;
    const from = viewEnd() - spanMs();
    const ch = channelAtY(event.clientY - rect.top, drawn);
    const radius = Math.max(CALIPER_SNAP_MS, (6 * (drawn.to - drawn.from)) / drawn.plotW);
    const t = snapTime({ events: heart.events(from + local - radius, from + local + radius) }, from + local, ch ? [ch] : LIVE_CHANNELS, radius);
    state.caliper = placeCaliper(state.caliper, t);
    render();
  });

  function draw() {
    const span = spanMs(), end = viewEnd(), from = end - span;
    const raw = heart.events(from - 80, end + 80);
    const events = Object.fromEntries(Object.entries(raw).map(([ch, list]) => [ch, list.map((e) => ({ ...e, t: e.t - from }))]));
    const local = state.caliperOn ? { a: state.caliper.a == null ? null : state.caliper.a - from, b: state.caliper.b == null ? null : state.caliper.b - from } : null;
    drawn = drawEgm(canvas, { id: 'live', channels: LIVE_CHANNELS, windowMs: span, events, calipers: [], markers: [] }, { lang: getLang(), channels: LIVE_CHANNELS, caliper: local }) || drawn;
    const iv = liveIntervals(heart.events(end - 2500, end));
    const t = T(), f = (v) => (v == null ? t.none : `${v} ms`);
    readout.textContent = `${t.intervals}: PP ${f(iv.pp)} · RR ${f(iv.rr)} · AH ${f(iv.ah)} · HV ${f(iv.hv)} · VA ${f(iv.va)}`;
  }

  function render() {
    const t = T(), lang = getLang() === 'en' ? 'en' : 'tr';
    caseName.textContent = t.caseLabel;
    caseSelect.replaceChildren(...Object.keys(LIVE_CASES).map((id) => { const o = doc.createElement('option'); o.value = id; o.textContent = t.cases[id]; return o; }));
    caseSelect.value = state.caseId;
    siteSel.replaceChildren(...LIVE_SITES.map((id) => { const o = doc.createElement('option'); o.value = id; o.textContent = t.sites[id]; return o; }));
    siteSel.value = siteSel.dataset.value || 'hra';
    speedSel.replaceChildren(...SPEEDS.map((v) => { const o = doc.createElement('option'); o.value = String(v); o.textContent = `${v} mm/s`; return o; }));
    speedSel.value = String(state.speed);
    speedSel.setAttribute('aria-label', t.speed);
    runBtn.textContent = state.running ? t.run : t.resume;
    runBtn.setAttribute('aria-pressed', String(!state.running));
    review.disabled = state.running;
    review.value = String(state.back);
    review.setAttribute('aria-label', t.review);
    calBtn.textContent = t.calipers;
    calBtn.setAttribute('aria-pressed', String(state.caliperOn));
    stimTitle.textContent = t.stim;
    for (const [span, key] of fieldLabels) span.textContent = t[key] || key;
    paceBtn.textContent = t.pace; burstBtn.textContent = t.burst; pausePaceBtn.textContent = t.pacePause; stopBtn.textContent = t.stop; shockBtn.textContent = t.shock;
    hint.textContent = t.hint;
    info.textContent = state.caliperOn ? caliperText(state.caliper, lang) : !state.running ? t.frozen : state.status;
    canvas.setAttribute('aria-label', lang === 'en' ? 'Live electrogram monitor' : 'Canlı elektrogram monitörü');
    draw();
  }
  siteSel.addEventListener('change', () => { siteSel.dataset.value = siteSel.value; });

  function loop() {
    cancelFrame(raf);
    const step = (wall) => {
      if (!state.active || !state.running) return;
      if (lastWall != null) advance(Math.min(100, wall - lastWall) * state.rate);
      lastWall = wall;
      draw();
      raf = nextFrame(step);
    };
    raf = nextFrame(step);
  }

  setCase(state.caseId);
  return {
    element: root,
    render,
    setActive(flag) {
      state.active = Boolean(flag);
      root.hidden = !state.active;
      lastWall = null;
      if (state.active) { render(); if (state.running) loop(); } else cancelFrame(raf);
    },
    /** Test hooks: deterministic stepping without the animation loop. */
    advance(ms) { advance(ms); if (!state.running) { state.frozenAt = simNow; state.back = 0; } draw(); },
    getState: () => ({ caseId: state.caseId, running: state.running, speed: state.speed, now: simNow, caliper: state.caliperOn ? { ...state.caliper } : null }),
    intervals: () => liveIntervals(heart.events(viewEnd() - 2500, viewEnd())),
    setCase
  };
}

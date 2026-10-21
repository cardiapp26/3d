import { CARDIAC_INTERVALS, timeToPhase } from './cardiac-cycle.js';
import { drawWiggers, wiggersPhaseAt } from './wiggers.js';
import { leftHeartFrame, pressureColor, PRESSURE_TICKS } from './left-heart-pressures.js';
import { rightHeartFrame, RIGHT_EVENTS } from './right-heart-pressures.js';

const COPY = {
  tr: {
    title: 'Canlı Wiggers', subtitle: 'Sol kalp · normal basınç modeli',
    subtitles: { left: 'Sol kalp · normal basınç modeli', right: 'Sağ kalp · normal basınç modeli', both: 'Sol ve sağ kalp · aynı döngü saati' },
    side: 'Görünüm', sides: { left: 'Sol kalp', right: 'Sağ kalp', both: 'İkisi birlikte' },
    ra: 'Sağ atriyum', rv: 'Sağ ventrikül', pa: 'Pulmoner arter', tricuspid: 'Triküspit kapak', pulmonary: 'Pulmoner kapak',
    rightDiagram: 'Sağ kalp basınçları · 0–30 mmHg', rightChart: 'Sağ kalp basınç diyagramı. Bir zamana gitmek için tıklayın.',
    rightNote: 'Pulmoner kapak aort kapağından biraz önce açılır, biraz sonra kapanır (P2, A2’den sonra). Sağ ve sol aynı saat ve aynı renk ölçeğini kullanır.',
    infoRight: {
      'rapid-filling': 'Triküspit açık, pulmoner kapak kapalı. RA-RV basınç farkıyla RV dolar; RA basıncı y inişini yapar.',
      diastasis: 'Triküspit açık. RA, RV ve diyastolik basınçlar birbirine yakındır.',
      'atrial-systole': 'Sağ atriyal kasılma a dalgasını oluşturur (normalde RA’da a dalgası v’den büyüktür).',
      'isovolumetric-contraction': 'Triküspit kapanmıştır; RV basıncı PA diyastolik basıncına (~10 mmHg) ulaşınca pulmoner kapak açılır.',
      'ventricular-ejection': 'Pulmoner kapak açık. Düşük dirençli dolaşım: RV ve PA ~25 mmHg tepe yapar.',
      'isovolumetric-relaxation': 'Pulmoner kapak kapanmıştır (P2). RV basıncı RA’nın altına inince triküspit açılır.'
    },
    play: 'Oynat', pause: 'Dondur', bpm: 'Kalp hızı', speed: 'İzleme hızı', phase: 'Döngüde gezin',
    la: 'Sol atriyum', lv: 'Sol ventrikül', ao: 'Aorta', volume: 'LV hacmi',
    mitral: 'Mitral kapak', aortic: 'Aort kapağı', open: 'Açık', closed: 'Kapalı',
    diagram: 'Basınç, hacim ve EKG', chart: 'Wiggers diyagramı. Bir zamana gitmek için tıklayın veya ok tuşlarını kullanın.',
    time: 'Zaman', elapsed: 'Geçen süre', ms: 'ms', rate: '/dk',
    scale: 'Basınç rengi · mmHg', scaleNote: 'Tüm boşluklarda aynı mutlak ölçek. Renk oksijenlenmeyi göstermez.',
    normal: 'Şematik eğitim modeli; hasta kaydı değildir. LA, sol atriyum basıncıdır; wedge/PCWP değildir.',
    scrub: 'Diyagrama tıklayın veya faz sürgüsünü kaydırın. Grafik, 3D kalp ve kapaklar aynı döngü saatini kullanır.',
    intervals: 'Döngü evreleri', legend: 'Eğri anahtarı', pressure: 'Basınç',
    laStrip: 'LA basıncı · 0–20 mmHg ölçeğinde a, c ve v dalgaları', laStripLabel: 'Sol atriyum basınç şeridi',
    info: {
      'rapid-filling': 'Mitral açık, aort kapağı kapalı. LA-LV basınç farkıyla LV hızla dolar.',
      diastasis: 'Mitral açık. Dolum yavaşlar; hız arttıkça bu evrenin süresi kısalır.',
      'atrial-systole': 'Atriyal kasılma a dalgasını ve son doluşu oluşturur.',
      'isovolumetric-contraction': 'Mitral kapanmıştır (S1), aort kapağı henüz açılmamıştır. Hacim sabitken LV basıncı yükselir.',
      'ventricular-ejection': 'Aort kapağı açık, mitral kapalı. LV hacmi azalır; aort ve LV basıncı birlikte yükselip düşer.',
      'isovolumetric-relaxation': 'Aort kapağı kapanmıştır (S2). İki kapak kapalıyken LV basıncı düşer, hacim sabittir.'
    }
  },
  en: {
    title: 'Live Wiggers', subtitle: 'Left heart · normal pressure model',
    subtitles: { left: 'Left heart · normal pressure model', right: 'Right heart · normal pressure model', both: 'Left and right heart · one cycle clock' },
    side: 'View', sides: { left: 'Left heart', right: 'Right heart', both: 'Both together' },
    ra: 'Right atrium', rv: 'Right ventricle', pa: 'Pulmonary artery', tricuspid: 'Tricuspid valve', pulmonary: 'Pulmonary valve',
    rightDiagram: 'Right-heart pressures · 0–30 mmHg', rightChart: 'Right-heart pressure diagram. Click a time to seek.',
    rightNote: 'The pulmonary valve opens slightly before and closes slightly after the aortic valve (P2 after A2). Both sides share one clock and one color scale.',
    infoRight: {
      'rapid-filling': 'Tricuspid open, pulmonary valve closed. The RA-RV pressure difference fills the RV; RA pressure shows the y descent.',
      diastasis: 'Tricuspid open. RA and RV diastolic pressures are nearly equal.',
      'atrial-systole': 'Right atrial contraction produces the a wave (normally RA a exceeds v).',
      'isovolumetric-contraction': 'Tricuspid has closed; the pulmonary valve opens when RV pressure reaches PA diastolic (~10 mmHg).',
      'ventricular-ejection': 'Pulmonary valve open. Low-resistance circuit: RV and PA peak near 25 mmHg.',
      'isovolumetric-relaxation': 'Pulmonary valve has closed (P2). The tricuspid opens when RV falls below RA.'
    },
    play: 'Play', pause: 'Freeze', bpm: 'Heart rate', speed: 'Playback speed', phase: 'Scrub cycle',
    la: 'Left atrium', lv: 'Left ventricle', ao: 'Aorta', volume: 'LV volume',
    mitral: 'Mitral valve', aortic: 'Aortic valve', open: 'Open', closed: 'Closed',
    diagram: 'Pressure, volume and ECG', chart: 'Wiggers diagram. Click a time or use arrow keys to seek.',
    time: 'Time', elapsed: 'Elapsed', ms: 'ms', rate: '/min',
    scale: 'Pressure color · mmHg', scaleNote: 'Same absolute scale in every chamber. Color does not indicate oxygenation.',
    normal: 'Schematic teaching model; not a patient recording. LA is left atrial pressure, not wedge/PCWP.',
    scrub: 'Click the diagram or drag the phase slider. Chart, 3D heart and valves share one cycle clock.',
    intervals: 'Cycle phases', legend: 'Curve legend', pressure: 'Pressure',
    laStrip: 'LA pressure · a, c and v waves on a 0–20 mmHg scale', laStripLabel: 'Left atrial pressure strip',
    info: {
      'rapid-filling': 'Mitral open, aortic valve closed. The LA-LV pressure difference drives rapid ventricular filling.',
      diastasis: 'Mitral open. Filling slows; this interval shortens as heart rate rises.',
      'atrial-systole': 'Atrial contraction produces the a wave and completes ventricular filling.',
      'isovolumetric-contraction': 'Mitral has closed (S1); aortic valve has not opened. LV pressure rises at constant volume.',
      'ventricular-ejection': 'Aortic valve open, mitral closed. LV volume falls while aortic and LV pressures rise then fall.',
      'isovolumetric-relaxation': 'Aortic valve has closed (S2). LV pressure falls at constant volume with both valves closed.'
    }
  }
};

const LA_MAX = 20;
const LA_WAVES = Object.freeze([['a', 'atrial-systole'], ['c', 'isovolumetric-contraction'], ['v', 'isovolumetric-relaxation']]);

/** LA pressure over one cycle on a 0-20 mmHg scale, same time axis as the Wiggers chart, a/c/v peaks marked. */
export function laStripSamples(frame, count = 240) {
  const samples = [];
  for (let i = 0; i <= count; i++) {
    const tau = i / count;
    const f = leftHeartFrame({ phase: timeToPhase(Math.min(tau, 0.999999), frame.bpm), bpm: frame.bpm, rhythm: frame.rhythm });
    samples.push({ tau, la: f.la, intervalId: f.intervalId });
  }
  const peaks = LA_WAVES.map(([name, id]) => {
    const inside = samples.filter(sample => sample.intervalId === id);
    return inside.length ? { name, ...inside.reduce((best, sample) => (sample.la > best.la ? sample : best)) } : null;
  }).filter(Boolean);
  return { samples, peaks };
}

function drawLaStrip(canvas, frame) {
  const ratio = globalThis.devicePixelRatio || 1;
  const width = canvas.clientWidth || 600, height = canvas.clientHeight || 90;
  if (canvas.width !== Math.round(width * ratio)) { canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const left = 8, right = width - 8, top = 10, bottom = height - 14;
  const X = tau => left + tau * (right - left), Y = mmHg => bottom - Math.min(LA_MAX, Math.max(0, mmHg)) / LA_MAX * (bottom - top);
  ctx.strokeStyle = '#e3e8e4'; ctx.lineWidth = 1;
  for (const mmHg of [0, 10, 20]) { ctx.beginPath(); ctx.moveTo(left, Y(mmHg)); ctx.lineTo(right, Y(mmHg)); ctx.stroke(); }
  ctx.fillStyle = '#6b7a72'; ctx.font = '10px system-ui, sans-serif';
  ctx.fillText('20', left + 2, Y(20) + 10); ctx.fillText('mmHg', right - 34, Y(20) + 10);
  const { samples, peaks } = laStripSamples(frame);
  ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 2; ctx.beginPath();
  samples.forEach((sample, i) => (i ? ctx.lineTo(X(sample.tau), Y(sample.la)) : ctx.moveTo(X(sample.tau), Y(sample.la))));
  ctx.stroke();
  ctx.fillStyle = '#5b3a1a'; ctx.font = '700 12px system-ui, sans-serif'; ctx.textAlign = 'center';
  for (const peak of peaks) ctx.fillText(peak.name, Math.min(right - 8, Math.max(left + 8, X(peak.tau))), Y(peak.la) - 5);
  ctx.textAlign = 'start';
  const cursor = X(frame.elapsedMs / frame.cycleMs);
  ctx.strokeStyle = '#d23b3b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cursor, top - 4); ctx.lineTo(cursor, bottom); ctx.stroke();
}

const RIGHT_MAX = 30;
const RIGHT_CURVES = Object.freeze([['pa', '#3f6fb5'], ['rv', '#1f3f7a'], ['ra', '#6fa0d8']]);

/** RA, RV and PA over one cycle on the same time axis as the Wiggers chart. */
export function rightStripSamples(frame, count = 240) {
  const samples = [];
  for (let i = 0; i <= count; i++) {
    const tau = i / count;
    const f = rightHeartFrame({ phase: timeToPhase(Math.min(tau, 0.999999), frame.bpm), bpm: frame.bpm });
    samples.push({ tau, ra: f.ra, rv: f.rv, pa: f.pa });
  }
  return samples;
}

function drawRightStrip(canvas, frame) {
  const ratio = globalThis.devicePixelRatio || 1;
  const width = canvas.clientWidth || 600, height = canvas.clientHeight || 150;
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) { canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const left = 8, right = width - 8, top = 10, bottom = height - 14;
  const X = tau => left + tau * (right - left), Y = mmHg => bottom - Math.min(RIGHT_MAX, Math.max(0, mmHg)) / RIGHT_MAX * (bottom - top);
  ctx.strokeStyle = '#e3e8e4'; ctx.lineWidth = 1;
  for (const mmHg of [0, 10, 20, 30]) { ctx.beginPath(); ctx.moveTo(left, Y(mmHg)); ctx.lineTo(right, Y(mmHg)); ctx.stroke(); }
  ctx.fillStyle = '#6b7a72'; ctx.font = '10px system-ui, sans-serif';
  ctx.fillText('30', left + 2, Y(30) + 10); ctx.fillText('10', left + 2, Y(10) - 2); ctx.fillText('mmHg', right - 34, Y(30) + 10);
  // Pulmonary valve window.
  const tauOf = phase => rightHeartFrame({ phase, bpm: frame.bpm }).elapsedMs / frame.cycleMs;
  const po = X(tauOf(RIGHT_EVENTS.pulmonaryOpen)), pc = X(tauOf(RIGHT_EVENTS.pulmonaryClose));
  ctx.fillStyle = 'rgba(63,111,181,.08)'; ctx.fillRect(po, top, pc - po, bottom - top);
  const samples = rightStripSamples(frame);
  for (const [key, color] of RIGHT_CURVES) {
    ctx.strokeStyle = color; ctx.lineWidth = key === 'rv' ? 2.2 : 1.8; ctx.beginPath();
    samples.forEach((sample, i) => (i ? ctx.lineTo(X(sample.tau), Y(sample[key])) : ctx.moveTo(X(sample.tau), Y(sample[key]))));
    ctx.stroke();
  }
  ctx.font = '700 11px system-ui, sans-serif';
  const peakOf = key => samples.reduce((best, sample) => (sample[key] > best[key] ? sample : best));
  for (const [key, color] of RIGHT_CURVES) {
    const at = key === 'ra' ? samples[Math.round(samples.length * 0.92)] : peakOf(key);
    ctx.fillStyle = color; ctx.textAlign = 'center';
    ctx.fillText(key.toUpperCase(), Math.min(right - 12, Math.max(left + 12, X(at.tau) + (key === 'pa' ? 18 : key === 'rv' ? -16 : 0))), Y(at[key]) - 5);
  }
  ctx.textAlign = 'start';
  const cursor = X(frame.elapsedMs / frame.cycleMs);
  ctx.strokeStyle = '#d23b3b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cursor, top - 4); ctx.lineTo(cursor, bottom); ctx.stroke();
}

/** UI consumes the native heart clock. All playback mutations go through callbacks. */
export function createLiveWiggersPanel(mount, options = {}) {
  const doc = mount?.ownerDocument || globalThis.document;
  if (!doc || !mount) throw new TypeError('Live Wiggers needs a DOM mount');
  let lang = options.getLang?.() === 'en' ? 'en' : 'tr';
  let active = false;
  let current = options.getCycleState?.() || { phase: 0, bpm: 72, playing: false, speed: 1 };
  let side = ['left', 'right', 'both'].includes(options.side) ? options.side : 'left';
  const frameOf = state => ({ ...rightHeartFrame(state), ...leftHeartFrame(state) });
  let lastFrame = frameOf(current);
  const root = doc.createElement('section');
  root.className = 'live-wiggers';
  root.setAttribute('data-live-wiggers', '');
  root.hidden = true;
  const create = (tag, className, parent = root) => {
    const el = doc.createElement(tag);
    if (className) el.className = className;
    parent.appendChild(el);
    return el;
  };
  const title = create('h2', 'live-wiggers__title');
  const subtitle = create('p', 'live-wiggers__subtitle');
  const sideRow = create('div', 'live-wiggers__sides');
  sideRow.setAttribute('role', 'group');
  const sideButtons = ['left', 'right', 'both'].map(value => {
    const button = create('button', '', sideRow);
    button.type = 'button'; button.setAttribute('data-live-side', value);
    button.addEventListener('click', () => setSide(value, true));
    return { button, value };
  });
  const controls = create('div', 'live-wiggers__controls');
  const play = create('button', 'live-wiggers__play', controls);
  play.type = 'button';
  const bpmLabel = create('label', 'live-wiggers__control', controls);
  const bpmText = create('span', '', bpmLabel);
  const bpm = create('input', '', bpmLabel);
  bpm.type = 'range'; bpm.min = '40'; bpm.max = '140'; bpm.step = '1';
  const bpmValue = create('output', '', bpmLabel);
  const speedLabel = create('label', 'live-wiggers__control', controls);
  const speedText = create('span', '', speedLabel);
  const speed = create('select', '', speedLabel);
  for (const value of [0.25, 0.5, 1]) {
    const option = create('option', '', speed);
    option.value = String(value); option.textContent = `${value}×`;
  }
  const values = create('div', 'live-wiggers__pressures');
  const readouts = {};
  for (const key of ['la', 'lv', 'ao', 'ra', 'rv', 'pa']) {
    const card = create('div', 'live-wiggers__pressure', values);
    card.setAttribute('data-pressure', key);
    const label = create('span', 'live-wiggers__pressure-name', card);
    const number = create('strong', 'live-wiggers__pressure-value', card);
    const unit = create('span', 'live-wiggers__unit', card);
    unit.textContent = 'mmHg';
    readouts[key] = { card, label, number };
  }
  const status = create('div', 'live-wiggers__status');
  const phaseName = create('strong', 'live-wiggers__phase', status);
  const volume = create('span', '', status);
  const valveRow = create('div', 'live-wiggers__valves');
  const mitral = create('span', '', valveRow);
  const aortic = create('span', '', valveRow);
  const tricuspid = create('span', '', valveRow);
  const pulmonary = create('span', '', valveRow);
  const info = create('p', 'live-wiggers__info');
  const infoRight = create('p', 'live-wiggers__info live-wiggers__info--right');
  const phaseLabel = create('label', 'live-wiggers__scrub');
  const phaseText = create('span', '', phaseLabel);
  const phase = create('input', '', phaseLabel);
  phase.type = 'range'; phase.min = '0'; phase.max = '0.999'; phase.step = '0.001';
  const time = create('output', 'live-wiggers__time', phaseLabel);
  const presets = create('div', 'live-wiggers__presets');
  const phaseButtons = CARDIAC_INTERVALS.map(interval => {
    const button = create('button', '', presets);
    button.type = 'button'; button.setAttribute('data-interval', interval.id);
    // The middle of the interval shows its typical pressures (the start is the boundary event).
    button.addEventListener('click', () => seek((interval.start + interval.end) / 2));
    return { button, interval };
  });
  const plotTitle = create('h3', 'live-wiggers__plot-title');
  const curveLegend = create('div', 'live-wiggers__curve-legend');
  const curveLabels = {};
  for (const key of ['la', 'lv', 'ao']) {
    const label = create('span', `live-wiggers__curve-${key}`, curveLegend);
    curveLabels[key] = label;
  }
  const canvas = create('canvas', 'live-wiggers__canvas');
  canvas.setAttribute('role', 'slider'); canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('aria-valuemin', '0'); canvas.setAttribute('aria-valuemax', '100');
  const axis = create('div', 'live-wiggers__axis');
  // LA on its own scale: on the 0-140 mmHg chart its a, c and v waves are flat.
  const laTitle = create('h4', 'live-wiggers__la-title');
  const laCanvas = create('canvas', 'live-wiggers__la');
  laCanvas.setAttribute('role', 'img');
  laCanvas.setAttribute('data-live-wiggers-la', '');
  // Right heart on its own 0-30 mmHg scale, same time axis.
  const rightTitle = create('h4', 'live-wiggers__la-title live-wiggers__right-title');
  const rightCanvas = create('canvas', 'live-wiggers__right');
  rightCanvas.setAttribute('role', 'slider'); rightCanvas.setAttribute('tabindex', '0');
  rightCanvas.setAttribute('data-live-wiggers-right', '');
  const rightNote = create('p', 'live-wiggers__note live-wiggers__right-note');
  const scale = create('div', 'live-wiggers__scale');
  const scaleTitle = create('strong', '', scale);
  const gradient = create('div', 'live-wiggers__gradient', scale);
  gradient.style.background = `linear-gradient(90deg, ${PRESSURE_TICKS.map(p => `${pressureColor(p)} ${p / 140 * 100}%`).join(', ')})`;
  gradient.setAttribute('aria-hidden', 'true');
  const ticks = create('div', 'live-wiggers__ticks', scale);
  for (const p of PRESSURE_TICKS) create('span', '', ticks).textContent = String(p);
  const scaleNote = create('p', 'live-wiggers__note', scale);
  const scrubNote = create('p', 'live-wiggers__note');
  const disclaimer = create('p', 'live-wiggers__disclaimer');
  mount.appendChild(root);

  function callback(name, value) {
    options[name]?.(value);
    current = options.getCycleState?.() || current;
    draw(current);
  }
  function seek(value) {
    if (!active) return;
    options.onPlaying?.(false);
    callback('onSeek', value);
  }
  play.addEventListener('click', () => { if (active) callback('onPlaying', !current.playing); });
  bpm.addEventListener('input', () => { if (active) callback('onBpm', Number(bpm.value)); });
  speed.addEventListener('change', () => { if (active) callback('onSpeed', Number(speed.value)); });
  phase.addEventListener('input', () => seek(Number(phase.value)));
  let dragging = false;
  const seekPointer = event => seek(wiggersPhaseAt(canvas, event.clientX, lastFrame.bpm));
  canvas.addEventListener('pointerdown', event => {
    if (!active) return;
    dragging = true;
    canvas.setPointerCapture?.(event.pointerId);
    seekPointer(event);
  });
  canvas.addEventListener('pointermove', event => { if (dragging && active) seekPointer(event); });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  const seekRight = event => {
    const box = rightCanvas.getBoundingClientRect();
    const tau = Math.max(0, Math.min(0.999999, (event.clientX - box.left - 8) / Math.max(1, box.width - 16)));
    seek(timeToPhase(tau, lastFrame.bpm));
  };
  rightCanvas.addEventListener('pointerdown', event => {
    if (!active) return;
    dragging = true;
    rightCanvas.setPointerCapture?.(event.pointerId);
    seekRight(event);
  });
  rightCanvas.addEventListener('pointermove', event => { if (dragging && active) seekRight(event); });
  rightCanvas.addEventListener('pointerup', () => { dragging = false; });
  rightCanvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('keydown', event => {
    const step = event.shiftKey ? 0.1 : 0.01;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const tau = lastFrame.elapsedMs / lastFrame.cycleMs;
      seek(timeToPhase(Math.max(0, Math.min(0.999999, tau + (event.key === 'ArrowRight' ? step : -step))), lastFrame.bpm));
    } else if (event.key === 'Home') { event.preventDefault(); seek(0); }
    else if (event.key === 'End') { event.preventDefault(); seek(0.999); }
    else if (event.key === ' ') { event.preventDefault(); if (active) callback('onPlaying', !current.playing); }
  });

  function localize() {
    const c = COPY[lang];
    root.setAttribute('lang', lang);
    title.textContent = c.title; subtitle.textContent = c.subtitles[side];
    sideRow.setAttribute('aria-label', c.side);
    for (const { button, value } of sideButtons) button.textContent = c.sides[value];
    rightTitle.textContent = c.rightDiagram; rightCanvas.setAttribute('aria-label', c.rightChart); rightNote.textContent = c.rightNote;
    bpmText.textContent = c.bpm; speedText.textContent = c.speed; phaseText.textContent = c.phase;
    bpm.setAttribute('aria-label', c.bpm); speed.setAttribute('aria-label', c.speed);
    phase.setAttribute('aria-label', c.phase); canvas.setAttribute('aria-label', c.chart);
    presets.setAttribute('aria-label', c.intervals);
    curveLegend.setAttribute('aria-label', c.legend);
    plotTitle.textContent = c.diagram;
    for (const key of ['la', 'lv', 'ao']) curveLabels[key].textContent = `${key.toUpperCase()} · ${c[key]}`;
    for (const key of Object.keys(readouts)) readouts[key].label.textContent = `${key.toUpperCase()} · ${c[key]}`;
    for (const { button, interval } of phaseButtons) button.textContent = lang === 'tr' ? interval.nameTr : interval.name;
    scaleTitle.textContent = c.scale; scaleNote.textContent = c.scaleNote;
    scrubNote.textContent = c.scrub; disclaimer.textContent = c.normal;
    laTitle.textContent = c.laStrip; laCanvas.setAttribute('aria-label', c.laStripLabel);
  }

  // Left elements hide on 'right', right elements hide on 'left'.
  const LEFT_ONLY = () => [plotTitle, curveLegend, canvas, axis, laTitle, laCanvas, mitral, aortic, info, readouts.la.card, readouts.lv.card, readouts.ao.card];
  const RIGHT_ONLY = () => [rightTitle, rightCanvas, rightNote, tricuspid, pulmonary, infoRight, readouts.ra.card, readouts.rv.card, readouts.pa.card];
  function applySide() {
    root.setAttribute('data-side', side);
    for (const el of LEFT_ONLY()) el.hidden = side === 'right';
    for (const el of RIGHT_ONLY()) el.hidden = side === 'left';
    for (const { button, value } of sideButtons) button.setAttribute('aria-pressed', String(value === side));
    subtitle.textContent = COPY[lang].subtitles[side];
  }
  function setSide(value, notify = false) {
    const next = ['left', 'right', 'both'].includes(value) ? value : 'left';
    if (next === side) return;
    side = next;
    applySide();
    if (notify) options.onSide?.(side);
    draw(current);
  }

  function draw(state = current) {
    current = state || current;
    lastFrame = frameOf(current);
    const f = lastFrame, c = COPY[lang];
    play.textContent = current.playing && !current.reducedMotion ? c.pause : c.play;
    play.setAttribute('aria-pressed', String(Boolean(current.playing && !current.reducedMotion)));
    bpm.value = String(f.bpm); bpmValue.textContent = `${f.bpm} ${c.rate}`;
    speed.value = String(current.speed || 1);
    phase.value = String(f.phase);
    phaseName.textContent = lang === 'tr' ? f.interval.nameTr : f.interval.name;
    volume.textContent = `${side === 'left' ? c.volume : side === 'right' ? c.volume.replace('LV', 'RV') : c.volume.replace('LV', 'LV/RV')}: ${f.volume.toFixed(0)} ml`;
    mitral.textContent = `${c.mitral}: ${f.mitralOpen ? c.open : c.closed}`;
    aortic.textContent = `${c.aortic}: ${f.aorticOpen ? c.open : c.closed}`;
    mitral.setAttribute('data-open', String(f.mitralOpen)); aortic.setAttribute('data-open', String(f.aorticOpen));
    tricuspid.textContent = `${c.tricuspid}: ${f.tricuspidOpen ? c.open : c.closed}`;
    pulmonary.textContent = `${c.pulmonary}: ${f.pulmonaryOpen ? c.open : c.closed}`;
    tricuspid.setAttribute('data-open', String(f.tricuspidOpen)); pulmonary.setAttribute('data-open', String(f.pulmonaryOpen));
    info.textContent = c.info[f.intervalId];
    infoRight.textContent = c.infoRight[f.intervalId];
    time.textContent = `${c.elapsed}: ${f.elapsedMs.toFixed(0)} / ${f.cycleMs.toFixed(0)} ${c.ms}`;
    axis.textContent = `0 ${c.ms} · ${c.time} → ${f.cycleMs.toFixed(0)} ${c.ms} (${f.bpm} ${c.rate})`;
    canvas.setAttribute('aria-valuenow', String(Math.round(f.elapsedMs / f.cycleMs * 100)));
    canvas.setAttribute('aria-valuetext', `${phaseName.textContent}; LA ${f.la.toFixed(1)}, LV ${f.lv.toFixed(1)}, Ao ${f.ao.toFixed(1)} mmHg`);
    rightCanvas.setAttribute('aria-valuenow', String(Math.round(f.elapsedMs / f.cycleMs * 100)));
    rightCanvas.setAttribute('aria-valuetext', `${phaseName.textContent}; RA ${f.ra.toFixed(1)}, RV ${f.rv.toFixed(1)}, PA ${f.pa.toFixed(1)} mmHg`);
    for (const key of Object.keys(readouts)) {
      readouts[key].number.textContent = f[key].toFixed(1);
      readouts[key].card.style.setProperty('--pressure-color', pressureColor(f[key]));
    }
    for (const { button, interval } of phaseButtons) button.setAttribute('aria-pressed', String(interval.id === f.intervalId));
    if (active && globalThis.window && canvas.getContext?.('2d')) {
      if (side !== 'right') {
        drawWiggers(canvas, { ...current, phase: f.phase, bpm: f.bpm, interval: f.interval }, lang);
        drawLaStrip(laCanvas, f);
      }
      if (side !== 'left') drawRightStrip(rightCanvas, f);
    }
    return f;
  }
  localize();
  applySide();
  draw(current);
  return {
    element: root,
    setActive(value) {
      active = Boolean(value); root.hidden = !active; dragging = false;
      if (active) draw(options.getCycleState?.() || current);
    },
    tick(state) { if (active) return draw(state); return lastFrame; },
    setLanguage(value) { lang = value === 'en' ? 'en' : 'tr'; localize(); draw(current); },
    draw,
    setSide: value => setSide(value, false),
    getSide: () => side,
    getState: () => ({ active, lang, side, frame: { ...lastFrame }, playing: Boolean(current.playing) })
  };
}

import './physiology-guide.css';
import { PHYSIOLOGY_TEXT as TXT } from './physiology-text.js';
import { ventricularSample, pumpOutput, pressureLoadFactor, AUTONOMIC, MMHG_ML_TO_J } from './physiology-model.js';
import { pvParams, pvModelLoop } from './hemo-pv-model.js';
import { aorticPressure, atrialPressure, ventricularPressure, ventricularVolume, ecgValue, heartSounds } from './wiggers.js';
import { CARDIAC_INTERVALS, phaseToTime, timeToPhase } from './cardiac-cycle.js';
import { createCycleClock, createMotionBar, cycleShape, loopPointAt, tweenValues } from './pathophysiology/cycle-clock.js';
import { sv, polyPath as path, BPM, RR_MS, createBeatTracker, createPenStrip, drawIonicTopic, createCalciumLive, createConductionLive, drawPurkinje, ejectFraction, loopArea } from './physiology-guide-motion.js';
function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
const label = (svg, x, y, text, attrs = {}) => svg.append(sv('text', { x, y, ...attrs }, text));
function chart(svg, { xmin, xmax, ymin, ymax, xlabel, ylabel, series, marker }) {
  svg.replaceChildren();
  const x = v => 64 + (v - xmin) / (xmax - xmin) * 494, y = v => 263 - (v - ymin) / (ymax - ymin) * 205;
  for (let i = 0; i <= 4; i++) {
    const xx = xmin + (xmax - xmin) * i / 4, yy = ymin + (ymax - ymin) * i / 4;
    svg.append(sv('path', { d: `M64 ${y(yy)}H558 M${x(xx)} 58V263`, class: 'phys-grid' }));
    label(svg, 57, y(yy) + 4, Number(yy.toFixed(1)).toString(), { 'text-anchor': 'end' });
    label(svg, x(xx), 282, Number(xx.toFixed(1)).toString(), { 'text-anchor': 'middle' });
  }
  label(svg, 64, 25, ylabel); label(svg, 311, 307, xlabel, { 'text-anchor': 'middle' });
  series.forEach(({ fn, color, name }, j) => {
    const points = Array.from({ length: 251 }, (_, i) => { const xx = xmin + (xmax - xmin) * i / 250; return [x(xx), y(fn(xx))]; });
    svg.append(sv('path', { d: path(points), stroke: color, class: 'phys-line' }));
    label(svg, 80 + j * 150, 45, name, { fill: color });
  });
  if (marker) svg.append(sv('circle', { cx: x(marker[0]), cy: y(marker[1]), r: 6, class: 'phys-marker' }));
  return { x, y };
}
export function createIonicCurrents({ getLang }) {
  const element = el('section', 'phys-currents'), heading = el('h3'), svg = sv('svg', { viewBox: '0 0 600 245', role: 'img' }), note = el('p');
  // Informational atrial layer, separate from the ventricular current simulation.
  const atrial = el('details', 'phys-atrial-currents'), atrialSummary = el('summary'), atrialNote = el('p');
  const atrialSvg = sv('svg', { viewBox: '0 0 600 85', role: 'img' });
  atrialSvg.append(sv('path', { d: 'M180 70V15 M173 25L180 15L187 25', stroke: '#8260a5', fill: 'none', 'stroke-width': 4 }));
  label(atrialSvg, 200, 40, 'IKur · Kv1.5 · K⁺');
  const source = el('a', '', 'Wettwer et al. (2004)');
  source.href = 'https://pubmed.ncbi.nlm.nih.gov/15477405/';
  atrial.append(atrialSummary, atrialSvg, atrialNote, source);
  element.append(heading, svg, note, atrial);
  return { element, render(cell, phase) {
    const en = getLang() === 'en';
    element.hidden = cell !== 'ventricular';
    heading.textContent = en ? 'Ionic currents accompanying the selected phase' : 'Seçili faza eşlik eden iyon akımları';
    atrialSummary.textContent = en ? 'Atrial comparison: IKur (optional)' : 'Atriyal karşılaştırma: IKur (isteğe bağlı)';
    atrialSvg.setAttribute('aria-label', en ? 'Atrial IKur: outward potassium current, direction only' : 'Atriyal IKur: dışa potasyum akımı, yalnızca yön gösterimi');
    atrialNote.textContent = en
      ? 'Human atrial repolarization includes IKur (Kv1.5), unlike the ventricular model above. Atrial plateau shape and duration differ from ventricular tissue; IKur blockade effects depend on rate and atrial remodeling. Arrow shows direction only, with no measured amplitude or simulated atrial waveform. Class IC drugs primarily block INa; an IKur mechanism does not establish atrial-selective protection for flecainide or propafenone.'
      : 'İnsan atriyal repolarizasyonuna IKur (Kv1.5) katılır; yukarıdaki ventrikül modeli bu akımı içermez. Atriyal plato biçimi ve süresi ventrikülden farklıdır; IKur blokajının etkisi hıza ve atriyal yeniden yapılanmaya bağlıdır. Ok yalnızca yönü gösterir; ölçülmüş genlik veya atriyal dalga simülasyonu değildir. Sınıf IC ilaçların temel hedefi INa’dır; IKur mekanizması flekainid veya propafenon için atriyuma özgü koruma kanıtı oluşturmaz.';
    svg.replaceChildren();
    svg.setAttribute('aria-label', en ? 'Relative inward sodium/calcium and outward potassium currents; schematic 360 ms cycle' : 'İçe Na/Ca, dışa K akımları; şematik 360 ms döngü');
    const x = ms => 78 + ms / 360 * 468, y = value => 105 - value * 90;
    svg.append(sv('path', { d: 'M78 15V205 M78 105H546', class: 'phys-grid' }));
    const ranges = { 0: [0, 8], 1: [8, 35], 2: [35, 180], 3: [180, 310], 4: [310, 360] }, [a, b] = ranges[phase] || ranges[4];
    svg.append(sv('rect', { x: x(a), y: 15, width: x(b) - x(a), height: 190, class: 'phys-phase-band' }));
    for (const [key, color, name] of [['na', '#dc9142', 'I Na'], ['ca', '#467daa', 'I Ca,L'], ['k', '#c45252', 'I to / I Kr / I Ks']]) {
      svg.append(sv('path', { d: path(Array.from({ length: 361 }, (_, ms) => [x(ms), y(ventricularSample(ms)[key])])), class: 'phys-line', stroke: color }));
      label(svg, key === 'na' ? 120 : key === 'ca' ? 235 : 365, key === 'k' ? 35 : key === 'na' ? 205 : 153, name, { fill: color });
    }
    label(svg, 10, 55, en ? 'Outward +' : 'Dışa +'); label(svg, 10, 176, en ? 'Inward −' : 'İçe −');
    for (const ms of [0, 100, 200, 300, 360]) label(svg, x(ms), 226, String(ms), { 'text-anchor': 'middle' });
    label(svg, 575, 226, 'ms', { 'text-anchor': 'end' });
    note.textContent = en ? 'Relative current amplitudes, not pA/pF measurements. Upward = outward positive charge, downward = inward. Phase 1: Ito; plateau: inward ICa,L balances outward K; phase 3: IKr/IKs. IK1 stabilizes rest and contributes to late repolarization; omitted from this simplified current plot. Na/K-ATPase maintains gradients, not the rapid phase-3 repolarizing current.' : 'Genlikler göreli; pA/pF ölçümü değildir. Yukarı: pozitif yük dışa, aşağı: içe. Faz 1: Ito; plato: içe ICa,L ile dışa K dengesi; faz 3: IKr/IKs. IK1 dinlenimi kararlı tutar, geç repolarizasyona katkı verir; sade akım grafiğinde çizilmedi. Na/K-ATPaz gradyanları sürdürür; hızlı faz-3 repolarizasyon akımı değildir.';
  } };
}
const VIEWBOX = { wiggers: '0 0 600 600', conduction: '0 0 600 440', pump: '0 0 600 400', ionic: '0 0 600 330' };
const ECG_LANE = { lo: -0.4, hi: 1.4 };
const DEFAULT_TOPICS = ['pump', 'pv', 'wiggers', 'ionic', 'calcium', 'conduction'];
const setAttrs = (node, attrs) => { for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v); };

/** Clock, beat tracker, motion bar and visibility gate shared by every topic. */
function createGuideMotion({ getLang, getRhythm, signal }) {
  const clock = createCycleClock({ bpm: BPM, speed: 0.5 }), tracker = createBeatTracker();
  const bar = createMotionBar(clock, { getLang, label: { tr: 'Atım döngüsü', en: 'Beat cycle' } });
  let live = null, visible = true, cancelTween = () => {};
  const frame = state => {
    if (!visible) return;
    const snap = tracker.update(state, getRhythm());
    bar.render(state, cycleShape(snap.u).phase);
    live?.(snap, state);
  };
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) clock.refresh();
  }) : null;
  let unsubscribe = () => {};
  function destroy() { unsubscribe(); cancelTween(); observer?.disconnect(); clock.destroy(); }
  signal?.addEventListener('abort', destroy, { once: true });
  return {
    clock, tracker, bar, destroy,
    start(element) { observer?.observe(element); unsubscribe = clock.subscribe(frame); },
    setLive(fn) { live = fn; fn?.(tracker.snapshot(), clock.getState()); },
    tween(from, to, onFrame) { cancelTween(); cancelTween = tweenValues(from, to, onFrame, 450); },
    stopTween() { cancelTween(); cancelTween = () => {}; }
  };
}

export function createPhysiologyGuide({ topics = DEFAULT_TOPICS, lang = 'tr', signal } = {}) {
  let language = lang === 'en' ? 'en' : 'tr', topic = topics[0], step = 0, pumpMode = 'filling', tone = 'normal', pressure = 2, arterial = 100, rhythm = 'sinus';
  let pumpShown = null, cycleInput = null;
  const element = el('section', 'phys-guide'), title = el('h3'), tabs = el('div', 'phys-tabs'), controls = el('div', 'phys-controls'), svg = sv('svg', { viewBox: '0 0 600 330', role: 'img', class: 'phys-diagram' });
  const caption = el('p', 'phys-caption'), output = el('p', 'phys-output'), explanation = el('p', 'phys-explain'), extra = el('p', 'phys-extra'), caveat = el('p', 'phys-caveat');
  output.setAttribute('role', 'status');
  const topicButtons = {};
  const tr = (a, b) => language === 'en' ? b : a, tx = value => value[language];
  const motion = createGuideMotion({ getLang: () => language, getRhythm: () => topic === 'wiggers' ? rhythm : 'sinus', signal });
  const button = (parent, key, text, fn) => { const b = el('button', '', text); b.type = 'button'; if (key) b.dataset.physControl = key; b.addEventListener('click', fn, { signal }); parent.append(b); return b; };
  topics.forEach(id => { const b = button(tabs, null, '', () => { topic = id; step = 0; render(); }); b.dataset.physTopic = id; topicButtons[id] = b; });
  const sources = el('details', 'phys-sources'), summary = el('summary'); sources.append(summary);
  for (const [name, url] of [
    ['Bers · Ca²⁺ coupling (2002)', 'https://doi.org/10.1038/415198a'],
    ['Anderson et al. · AV axis (1998)', 'https://pubmed.ncbi.nlm.nih.gov/9835269/'],
    ['Suga · PVA / energy (1979)', 'https://doi.org/10.1152/ajpheart.1979.236.3.H498'],
    ['Ventricular ion channels (2021)', 'https://doi.org/10.1152/physrev.00024.2019']
  ]) { const a = el('a', '', name); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; sources.append(a); }
  element.append(title, tabs, motion.bar.element, controls, svg, caption, output, explanation, extra, caveat, sources);
  function slider(key, text, min, max, value, change) {
    const row = el('label', 'phys-slider'), name = el('span', '', text), input = el('input'), out = el('output', '', String(value));
    Object.assign(input, { type: 'range', min: String(min), max: String(max), value: String(value), step: '1' }); input.dataset.physParam = key;
    input.setAttribute('aria-label', text); input.addEventListener('input', () => { change(Number(input.value)); draw(); out.textContent = input.value; }, { signal });
    row.append(name, out, input); controls.append(row);
    return { input, out };
  }
  function render() {
    const focused = controls.contains(document.activeElement) ? document.activeElement : null;
    const focusKey = focused?.dataset.physControl;
    const focusParam = focused?.dataset.physParam;
    title.textContent = tx(TXT.title); tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', title.textContent);
    for (const [id, b] of Object.entries(topicButtons)) { b.textContent = tx(TXT.topics[id]); b.setAttribute('aria-pressed', String(id === topic)); }
    controls.replaceChildren(); cycleInput = null;
    const chooseSteps = labels => labels.forEach((text, i) => { const b = button(controls, `step-${i}`, text, () => { step = i; render(); }); b.setAttribute('aria-pressed', String(step === i)); });
    if (topic === 'ionic') chooseSteps(TXT.ionic.map(tx));
    if (topic === 'calcium') chooseSteps(TXT.calcium.map(tx));
    if (topic === 'conduction') chooseSteps(TXT.conduction.map(tx));
    if (topic === 'pump') renderPumpControls();
    if (topic === 'pv') chooseSteps([tr('A–B · Doluş', 'A–B · Filling'), tr('B–C · İVK', 'B–C · IVC'), tr('C–D · Ejeksiyon', 'C–D · Ejection'), tr('D–A · İVG', 'D–A · IVR'), 'EW / PE']);
    if (topic === 'wiggers') {
      cycleInput = slider('cycle', tr('Atım içi zaman (%)', 'Time within beat (%)'), 0, 99, step, v => { step = v; motion.clock.seek(timeToPhase(v / 100, BPM)); });
      for (const id of ['sinus', 'afib']) { const b = button(controls, id, id === 'sinus' ? tr('Sinüs', 'Sinus') : 'AF', () => { rhythm = id; render(); }); b.setAttribute('aria-pressed', String(rhythm === id)); }
    }
    summary.textContent = tr('Kaynaklar ve kapsam', 'Sources and scope'); caveat.textContent = tx(TXT.designed);
    draw();
    if (focusKey || focusParam) {
      const replacement = [...controls.querySelectorAll('button,input')].find(n => focusKey ? n.dataset.physControl === focusKey : n.dataset.physParam === focusParam);
      replacement?.focus({ preventScroll: true });
    }
  }
  function renderPumpControls() {
    for (const [id, text] of [['filling', tr('Sağ / sol · doluş', 'Right / left · filling')], ['tone', tr('Otonom uyarı', 'Autonomic tone')], ['pressure', tr('Arter basıncı', 'Arterial pressure')]]) {
      const b = button(controls, id, text, () => { pumpMode = id; render(); }); b.setAttribute('aria-pressed', String(id === pumpMode));
    }
    if (pumpMode === 'tone') for (const id of Object.keys(AUTONOMIC)) {
      const names = { sympathetic: tr('Güçlü sempatik', 'Strong sympathetic'), normal: tr('Normal sempatik', 'Normal sympathetic'), zero: tr('Sempatik yok', 'No sympathetic'), parasympathetic: tr('Vagal uyarı', 'Vagal stimulation') };
      const b = button(controls, id, names[id], () => { tone = id; render(); }); b.setAttribute('aria-pressed', String(tone === id));
    }
    const isPressure = pumpMode === 'pressure';
    slider(isPressure ? 'arterial' : 'filling', isPressure ? tr('Arter basıncı (mmHg)', 'Arterial pressure (mmHg)') : tr('Atriyal doluş basıncı (mmHg)', 'Atrial filling pressure (mmHg)'), isPressure ? 0 : -4, isPressure ? 250 : 16, isPressure ? arterial : pressure, v => { if (isPressure) arterial = v; else pressure = v; });
  }
  function draw() {
    motion.stopTween();
    svg.replaceChildren(); svg.setAttribute('viewBox', VIEWBOX[topic] || '0 0 600 330');
    svg.setAttribute('aria-label', tx(TXT.topics[topic])); caption.textContent = ''; output.textContent = ''; explanation.textContent = ''; extra.textContent = '';
    output.setAttribute('aria-live', 'polite');
    const drawers = { ionic: drawIonic, calcium: drawCalcium, conduction: drawConduction, pump: drawPump, pv: drawPv, wiggers: drawWiggers };
    const live = drawers[topic]?.() || null;
    output.dataset.physOutput = topic;
    output.hidden = !output.textContent;
    extra.hidden = !extra.textContent;
    motion.setLive(live);
  }
  function box(x, y, w, h, text, active = false) { const rect = sv('rect', { x, y, width: w, height: h, rx: 12, class: active ? 'phys-box is-active' : 'phys-box' }); svg.append(rect); label(svg, x + w / 2, y + h / 2 + 5, text, { 'text-anchor': 'middle' }); return rect; }
  function arrow(points, active) {
    const cls = active ? 'phys-arrow is-active' : 'phys-arrow', [x, y] = points[points.length - 1], [a, b] = points[points.length - 2], angle = Math.atan2(y - b, x - a);
    const line = sv('path', { d: path(points), class: cls });
    const head = sv('path', { d: path([[x - 10 * Math.cos(angle) + 5 * Math.sin(angle), y - 10 * Math.sin(angle) - 5 * Math.cos(angle)], [x, y], [x - 10 * Math.cos(angle) - 5 * Math.sin(angle), y - 10 * Math.sin(angle) + 5 * Math.cos(angle)]]), class: cls });
    svg.append(line, head); return [line, head];
  }
  function drawIonic() {
    caption.textContent = tx(TXT.ionic[step]); explanation.textContent = tx(TXT.ionicNotes[step]); extra.textContent = tx(TXT.ionicExtra);
    return drawIonicTopic(svg, { step, tr, label });
  }
  function drawCalcium() {
    svg.append(sv('path', { d: 'M15 80H180V190Q220 240 260 190V80H585', class: 'phys-membrane' }));
    label(svg, 35, 40, tr('Hücre dışı Ca²⁺', 'Extracellular Ca²⁺')); label(svg, 192, 120, 'T-tubule');
    const sr = box(75, 120, 95, 75, 'SR · Ca²⁺', step === 1 || step === 3), trop = box(286, 145, 132, 65, 'Troponin C', step === 2), work = box(290, 242, 125, 50, tr('Kasılma · ATP', 'Contraction · ATP'), step === 2);
    const ncx = box(392, 33, 100, 38, 'NCX', step === 4), nak = box(500, 33, 85, 38, 'Na/K ATP', step === 4);
    const paths = [[[220, 30], [220, 105], [175, 105]], [[170, 162], [220, 205], [286, 177]], [[352, 210], [352, 242]], [[306, 130], [260, 101], [146, 123]], [[415, 144], [440, 77], [440, 13]]];
    const arrows = paths.map((pts, i) => arrow(pts, step === i));
    label(svg, 212, 62, 'L-type', { fill: '#547ca6' }); label(svg, 195, 261, 'RyR2 · spark', { 'text-anchor': 'middle' });
    label(svg, 302, 98, 'SERCA2a · ATP'); label(svg, 442, 125, 'Ca²⁺ out / Na⁺ in');
    explanation.textContent = tx(TXT.calciumNotes[step]); caption.textContent = tx(TXT.calcium[step]);
    const stages = [arrows[0], [sr, ...arrows[1]], [trop, work, ...arrows[2]], [sr, ...arrows[3]], [ncx, nak, ...arrows[4]]];
    return createCalciumLive(svg, { stages, paths, tr });
  }
  function drawConduction() {
    const sa = box(24, 38, 115, 42, 'SA', step === 0), trans = box(195, 38, 150, 42, tr('Geçiş lifleri', 'Transitional'), step === 1), av = box(230, 119, 100, 42, 'AV node', step === 1);
    svg.append(sv('rect', { x: 28, y: 175, width: 540, height: 22, class: 'phys-fibrous' })); label(svg, 65, 169, tr('Fibröz AV iskeleti', 'Fibrous AV skeleton'));
    const his = box(260, 207, 92, 35, 'His', step === 2), rb = box(115, 273, 135, 39, tr('Sağ dal', 'Right branch'), step === 3), lb = box(387, 273, 135, 39, tr('Sol dal', 'Left branch'), step === 3);
    arrow([[140, 59], [190, 59]], step === 0); arrow([[270, 80], [280, 119]], step === 1); arrow([[280, 161], [305, 207]], step === 2); arrow([[305, 242], [183, 273]], step === 3); arrow([[305, 242], [454, 273]], step === 3);
    const purkinje = drawPurkinje(svg, label);
    caption.textContent = tx(TXT.conduction[step]); explanation.textContent = tx(TXT.conductionNotes[step]);
    extra.textContent = tr('0,03 s = 30 ms · 0,12 s = 120 ms · 0,16 s = 160 ms. Başlangıç SA düğümüdür; bu toplam sürelerden AH/HV çıkarılamaz.', '0.03 s = 30 ms · 0.12 s = 120 ms · 0.16 s = 160 ms. Origin is the SA node; these totals cannot be read as AH/HV.');
    const nodes = { sa: [sa], transitional: [trans], av: [av], his: [his], branches: [rb, lb], purkinje };
    return createConductionLive(svg, { nodes, tracker: motion.tracker, ecg: ecgValue, tr });
  }
  function pumpSeries() {
    const colors = ['#c85263', '#467dac', '#829766', '#ce9f55'];
    if (pumpMode === 'pressure') return [{ fn: p => 5 * pressureLoadFactor(p), color: colors[0], name: tr('Basınç-yük örneği', 'Pressure-load example') }];
    if (pumpMode === 'filling') return ['right', 'left'].map((side, i) => ({ fn: p => pumpOutput(p, { side }), color: colors[i], name: side === 'right' ? tr('Sağ ventrikül', 'Right ventricle') : tr('Sol ventrikül', 'Left ventricle') }));
    return Object.keys(AUTONOMIC).map((id, i) => ({ fn: p => pumpOutput(p, { tone: id }), color: colors[i], name: { sympathetic: tr('Sempatik ↑', 'Sympathetic ↑'), normal: tr('Normal', 'Normal'), zero: tr('Sempatik 0', 'Sympathetic 0'), parasympathetic: tr('Vagal', 'Vagal') }[id] }));
  }
  function drawPump() {
    const isPressure = pumpMode === 'pressure', value = isPressure ? 5 * pressureLoadFactor(arterial) : pumpOutput(pressure, { tone: pumpMode === 'tone' ? tone : 'normal' });
    const target = { x: isPressure ? arterial : pressure, y: value }, from = pumpShown?.mode === pumpMode ? pumpShown : target;
    const map = chart(svg, { xmin: isPressure ? 0 : -4, xmax: isPressure ? 250 : 16, ymin: 0, ymax: isPressure ? 6 : pumpMode === 'tone' ? 25 : 15, xlabel: isPressure ? tr('Arter basıncı (mmHg)', 'Arterial pressure (mmHg)') : tr('İlgili atriyum basıncı (mmHg)', 'Corresponding atrial pressure (mmHg)'), ylabel: tr('Debi (L/dk)', 'Output (L/min)'), series: pumpSeries(), marker: [from.x, from.y] });
    const marker = svg.querySelector('.phys-marker'), guide = sv('path', { class: 'phys-drop' });
    svg.insertBefore(guide, marker);
    const place = p => { pumpShown = { mode: pumpMode, x: p.x, y: p.y }; setAttrs(marker, { cx: map.x(p.x).toFixed(1), cy: map.y(p.y).toFixed(1) }); guide.setAttribute('d', `M${map.x(p.x).toFixed(1)} 263V${map.y(p.y).toFixed(1)}H64`); };
    place(from);
    if (from !== target) motion.tween(from, target, place); else place(target);
    output.textContent = `${tr('Örnek', 'Example')}: ${value.toFixed(1)} ${tr('L/dk', 'L/min')}`;
    explanation.textContent = tx(isPressure ? TXT.pressureNote : pumpMode === 'tone' ? TXT.toneNote : TXT.pumpNote);
    return createPumpChamber(isPressure ? 5 : 13);
  }
  function createPumpChamber(normal) {
    const heart = sv('path', { d: 'M-15 -24C-27 -6 -19 16 0 26C19 16 27 -6 15 -24Z', class: 'phys-chamber' });
    const drops = Array.from({ length: 9 }, () => sv('circle', { r: 4, cy: 360, class: 'phys-flow-dot' }));
    svg.append(sv('path', { d: 'M132 360H558', class: 'phys-flow-lane' }), heart, ...drops);
    label(svg, 64, 395, tr('Atan ventrikül · ileri akım', 'Beating ventricle · forward flow'));
    return snap => {
      const amp = Math.min(1.4, (pumpShown?.y ?? 0) / normal), squeeze = cycleShape(snap.u).contraction;
      heart.setAttribute('transform', `translate(100 360) scale(${(1 - 0.22 * squeeze * Math.min(1, amp)).toFixed(3)})`);
      const offset = (snap.beat + ejectFraction(snap.u)) * 0.3 * amp;
      drops.forEach((dot, i) => { const f = ((offset + i / drops.length) % 1 + 1) % 1; setAttrs(dot, { cx: (140 + f * 410).toFixed(1), opacity: amp > 0.02 ? (0.35 + 0.65 * Math.sin(Math.PI * f)).toFixed(2) : '0' }); });
    };
  }
  function drawPv() {
    const loop = pvModelLoop(pvParams());
    const x = v => 64 + v / 180 * 490, y = p => 265 - p / 150 * 205;
    chart(svg, { xmin: 0, xmax: 180, ymin: 0, ymax: 150, xlabel: tr('LV hacmi (ml)', 'LV volume (ml)'), ylabel: 'LV · mmHg', series: [] });
    if (step === 4) {
      const pe = Array.from({ length: 50 }, (_, i) => { const v = loop.v0 + (loop.esv - loop.v0) * i / 49; return [x(v), y(loop.espvr(v))]; });
      pe.push(...Array.from({ length: 50 }, (_, i) => { const v = loop.esv - (loop.esv - loop.v0) * i / 49; return [x(v), y(loop.edpvr(v))]; }));
      svg.append(sv('path', { d: path(pe) + 'Z', class: 'phys-pe' })); label(svg, x(32), y(25), 'PE');
    }
    svg.append(sv('path', { d: path(loop.points.map(q => [x(q.v), y(q.p)])) + 'Z', class: 'phys-ew' }));
    const fill = sv('path', { class: 'phys-ew-live' }); svg.append(fill); label(svg, x(90), y(55), 'EW / SW');
    for (const [fn, name, color] of [[loop.espvr, 'ESPVR', '#859469'], [loop.edpvr, 'EDPVR', '#4d84a4']]) {
      const points = Array.from({ length: 100 }, (_, i) => { const v = loop.v0 + i * 1.5; return [v, fn(v)]; }).filter(([v, p]) => v <= 180 && p <= 150).map(([v, p]) => [x(v), y(p)]);
      svg.append(sv('path', { d: path(points), class: 'phys-line', stroke: color })); label(svg, name === 'ESPVR' ? 310 : 425, name === 'ESPVR' ? 48 : 190, name, { fill: color });
    }
    const phases = [[0, .45], [.45, .53], [.53, .88], [.88, 1]];
    if (step < 4) { const [a, b] = phases[step]; const pts = loop.points.filter(q => q.u >= a && q.u <= b); svg.append(sv('path', { d: path(pts.map(q => [x(q.v), y(q.p)])), class: 'phys-focus' })); }
    const corners = [loop.points[0], loop.points[Math.round(.45 * loop.points.length)], loop.points[Math.round(.53 * loop.points.length)], loop.points[Math.round(.88 * loop.points.length)]];
    corners.forEach((q, i) => { svg.append(sv('circle', { cx: x(q.v), cy: y(q.p), r: 4, class: 'phys-marker' })); label(svg, x(q.v) + (i < 2 ? -14 : 14), y(q.p) - 8, 'ABCD'[i]); });
    output.textContent = `EDV ${loop.edv.toFixed(0)} − ESV ${loop.esv.toFixed(0)} = SV ${loop.sv.toFixed(0)} ml · SW ${loop.strokeWork.toFixed(0)} mmHg·ml ≈ ${(loop.strokeWork * MMHG_ML_TO_J).toFixed(2)} J`;
    explanation.textContent = step === 4 ? tx(TXT.energy) : tx(TXT.pvNotes[step]);
    extra.textContent = tr('Bağımsız normal öğretim döngüsü. Hacim, kontraktilite ve arteriyel yükü değiştirmek için ana P-V sekmesindeki etkileşimli modeli kullanın.', 'Independent normal teaching loop. Use the main P-V tab’s interactive model to change volume, contractility and arterial load.');
    return createPvLive(loop, x, y, fill);
  }
  function createPvLive(loop, x, y, fill) {
    const dot = sv('circle', { r: 7, class: 'phys-live-dot' }), readout = sv('text', { x: 558, y: 40, 'text-anchor': 'end', class: 'phys-live-text' });
    svg.append(dot, readout);
    return snap => {
      const q = loopPointAt(loop.points, snap.u), done = [...loop.points.filter(p => p.u <= snap.u), q];
      fill.setAttribute('d', done.length > 2 ? path(done.map(p => [x(p.v), y(p.p)])) + 'Z' : '');
      setAttrs(dot, { cx: x(q.v).toFixed(1), cy: y(q.p).toFixed(1) });
      const work = done.length > 2 ? loopArea(done) : 0;
      readout.textContent = `${tr('İş birikimi', 'Work so far')} ${work.toFixed(0)} / ${loop.strokeWork.toFixed(0)} mmHg·ml`;
    };
  }
  function drawWiggersLanes(x) {
    const lanes = [
      { y: 40, h: 175, lo: 0, hi: 140, name: 'mmHg', lines: [[aorticPressure, '#bc8b43', tr('Aort', 'Ao')], [ventricularPressure, '#ca5264', 'LV'], [atrialPressure, '#66865d', 'LA']] },
      { y: 235, h: 85, lo: 40, hi: 140, name: 'ml', lines: [[ventricularVolume, '#427fa7', 'LV']] },
      { y: 341, h: 60, lo: ECG_LANE.lo, hi: ECG_LANE.hi, name: 'ECG', lines: [[ecgValue, '#596748', 'II']] }
    ];
    const dots = [];
    for (const lane of lanes) {
      const y = v => lane.y + lane.h - (v - lane.lo) / (lane.hi - lane.lo) * lane.h;
      svg.append(sv('rect', { x: 88, y: lane.y, width: 465, height: lane.h, class: 'phys-lane' }));
      label(svg, 7, lane.y + 16, lane.name); label(svg, 83, lane.y + 9, String(lane.hi), { 'text-anchor': 'end' }); label(svg, 83, lane.y + lane.h, String(lane.lo), { 'text-anchor': 'end' });
      lane.lines.forEach(([fn, color, name], j) => {
        svg.append(sv('path', { d: path(Array.from({ length: 401 }, (_, i) => { const t = i / 400; return [x(t), y(fn(timeToPhase(t, BPM), rhythm))]; })), class: 'phys-line', stroke: color }));
        label(svg, 160 + j * 110, lane.y - 8, name, { fill: color });
        dots.push({ fn, y, node: sv('circle', { r: 4.5, fill: color, class: 'phys-trace-dot' }) });
      });
    }
    return dots;
  }
  function drawWiggers() {
    const tau = step / 100, x = v => 88 + v * 465, dots = drawWiggersLanes(x);
    for (const [at, name] of [[0, 'A'], [.45, 'B / S1'], [.53, 'C'], [.88, 'D / S2']]) { const xx = x(phaseToTime(at, BPM)); svg.append(sv('path', { d: `M${xx} 32V405`, class: 'phys-event' })); label(svg, xx, 24, name, { 'text-anchor': 'middle' }); }
    for (const [at, name] of [[.405, 'a'], [.46, 'c'], [.99, 'v']]) if (rhythm !== 'afib' || name !== 'a') label(svg, x(phaseToTime(at, BPM)), 205, name, { fill: '#42633c' });
    label(svg, 7, 433, 'PCG'); svg.append(sv('path', { d: 'M88 451H553', class: 'phys-grid' }));
    for (const sound of heartSounds(rhythm)) { const xx = x(phaseToTime(sound.u, BPM)); svg.append(sv('path', { d: `M${xx - 4} 451l2 -12l3 24l3 -24l3 12`, class: sound.optional ? 'phys-optional' : 'phys-sound' })); label(svg, xx, 478, sound.optional ? `(${sound.id})` : sound.id, { 'text-anchor': 'middle' }); }
    for (const t of [0, .25, .5, .75, 1]) label(svg, x(t), 501, String(Math.round(t * 60000 / BPM)), { 'text-anchor': 'middle' });
    label(svg, 577, 501, 'ms', { 'text-anchor': 'end' });
    const cursor = sv('path', { d: `M${x(tau)} 30V480`, class: 'phys-cursor' });
    svg.append(cursor, ...dots.map(d => d.node));
    explanation.textContent = tx(TXT.wiggers);
    caption.textContent = tr('A: mitral açılır · B: mitral kapanır · C: aort açılır · D: aort kapanır. Sabit örnek hız: 72/dk.', 'A: mitral opens · B: mitral closes · C: aortic opens · D: aortic closes. Fixed example rate: 72/min.')
      + (rhythm === 'afib' ? tr(' AF: RR düzensiz; atriyal kasılma (a dalgası) ve S4 yok.', ' AF: irregular RR; no atrial kick (a wave) and no S4.') : '');
    output.textContent = wiggersReadout(tau, timeToPhase(tau, BPM), RR_MS);
    return createWiggersLive({ x, dots, cursor });
  }
  function wiggersReadout(tau, u, rr) {
    const interval = CARDIAC_INTERVALS.find(p => u >= p.start && u < p.end);
    const name = interval ? language === 'en' ? interval.name : interval.nameTr : '';
    return `${Math.round(tau * rr)} ms · ${name}${rhythm === 'afib' ? ` · RR ${Math.round(rr)} ms` : ''}`;
  }
  function createWiggersLive({ x, dots, cursor }) {
    label(svg, 7, 556, tr('Ritim', 'Rhythm')); label(svg, 7, 572, 'II');
    const rr = sv('text', { x: 553, y: 524, 'text-anchor': 'end', class: 'phys-live-text' });
    svg.append(rr);
    const strip = createPenStrip(svg, { x: 88, y: 530, w: 465, h: 58, windowMs: 3200, ...ECG_LANE });
    const valueAt = T => { const at = motion.tracker.at(T); return at ? ecgValue(at.u, at.rhythm) : null; };
    return (snap, state) => {
      const tau = phaseToTime(snap.u, BPM), xx = x(tau).toFixed(1);
      cursor.setAttribute('d', `M${xx} 30V480`);
      for (const d of dots) setAttrs(d.node, { cx: xx, cy: d.y(d.fn(snap.u, rhythm)).toFixed(1) });
      strip.update(snap.time, valueAt);
      rr.textContent = `RR ${Math.round(snap.rr)} ms`;
      output.setAttribute('aria-live', state.playing ? 'off' : 'polite');
      if (!state.playing) return;
      step = Math.min(99, Math.round(tau * 100));
      if (cycleInput && document.activeElement !== cycleInput.input) { cycleInput.input.value = String(step); cycleInput.out.textContent = String(step); }
      const text = wiggersReadout(tau, snap.u, snap.rr);
      if (output.textContent !== text) output.textContent = text;
    };
  }
  render();
  motion.start(element);
  return {
    element,
    setLanguage(next) { const value = next === 'en' ? 'en' : 'tr'; if (language !== value) { language = value; motion.bar.setLanguage(); render(); } },
    destroy: motion.destroy
  };
}

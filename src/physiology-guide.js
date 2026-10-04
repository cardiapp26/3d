import './physiology-guide.css';
import { PHYSIOLOGY_TEXT as TXT } from './physiology-text.js';
import { ventricularSample, pumpOutput, pressureLoadFactor, AUTONOMIC, MMHG_ML_TO_J } from './physiology-model.js';
import { pvParams, pvModelLoop } from './hemo-pv-model.js';
import { aorticPressure, atrialPressure, ventricularPressure, ventricularVolume, ecgValue, heartSounds } from './wiggers.js';
import { CARDIAC_INTERVALS, phaseToTime, timeToPhase } from './cardiac-cycle.js';
const NS = 'http://www.w3.org/2000/svg';
function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
function sv(tag, attrs = {}, text) { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (text) n.textContent = text; return n; }
const path = points => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
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
  element.append(heading, svg, note);
  return { element, render(cell, phase) {
    const en = getLang() === 'en';
    element.hidden = cell !== 'ventricular';
    heading.textContent = en ? 'Ionic currents accompanying the selected phase' : 'Seçili faza eşlik eden iyon akımları';
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
export function createPhysiologyGuide({ topics = ['pump', 'pv', 'wiggers'], lang = 'tr', signal } = {}) {
  let language = lang === 'en' ? 'en' : 'tr', topic = topics[0], step = 0, pumpMode = 'filling', tone = 'normal', pressure = 2, arterial = 100, rhythm = 'sinus';
  const element = el('section', 'phys-guide'), title = el('h3'), tabs = el('div', 'phys-tabs'), controls = el('div', 'phys-controls'), svg = sv('svg', { viewBox: '0 0 600 330', role: 'img', class: 'phys-diagram' });
  const caption = el('p', 'phys-caption'), output = el('p', 'phys-output'), explanation = el('p', 'phys-explain'), extra = el('p', 'phys-extra'), caveat = el('p', 'phys-caveat');
  output.setAttribute('role', 'status');
  const topicButtons = {};
  const tr = (a, b) => language === 'en' ? b : a, tx = value => value[language];
  const button = (parent, key, text, fn) => { const b = el('button', '', text); b.type = 'button'; if (key) b.dataset.physControl = key; b.addEventListener('click', fn, { signal }); parent.append(b); return b; };
  topics.forEach(id => { const b = button(tabs, null, '', () => { topic = id; step = 0; render(); }); b.dataset.physTopic = id; topicButtons[id] = b; });
  const sources = el('details', 'phys-sources'), summary = el('summary'); sources.append(summary);
  for (const [name, url] of [
    ['Bers · Ca²⁺ coupling (2002)', 'https://doi.org/10.1038/415198a'],
    ['Anderson et al. · AV axis (1998)', 'https://pubmed.ncbi.nlm.nih.gov/9835269/'],
    ['Suga · PVA / energy (1979)', 'https://doi.org/10.1152/ajpheart.1979.236.3.H498'],
    ['Ventricular ion channels (2021)', 'https://doi.org/10.1152/physrev.00024.2019']
  ]) { const a = el('a', '', name); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; sources.append(a); }
  element.append(title, tabs, controls, svg, caption, output, explanation, extra, caveat, sources);
  function slider(key, text, min, max, value, change) {
    const row = el('label', 'phys-slider'), name = el('span', '', text), input = el('input'), out = el('output', '', String(value));
    Object.assign(input, { type: 'range', min: String(min), max: String(max), value: String(value), step: '1' }); input.dataset.physParam = key;
    input.setAttribute('aria-label', text); input.addEventListener('input', () => { change(Number(input.value)); draw(); out.textContent = input.value; }, { signal });
    row.append(name, out, input); controls.append(row);
  }
  function render() {
    const focused = controls.contains(document.activeElement) ? document.activeElement : null;
    const focusKey = focused?.dataset.physControl;
    const focusParam = focused?.dataset.physParam;
    title.textContent = tx(TXT.title); tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', title.textContent);
    for (const [id, b] of Object.entries(topicButtons)) { b.textContent = tx(TXT.topics[id]); b.setAttribute('aria-pressed', String(id === topic)); }
    controls.replaceChildren();
    const chooseSteps = labels => labels.forEach((text, i) => { const b = button(controls, `step-${i}`, text, () => { step = i; render(); }); b.setAttribute('aria-pressed', String(step === i)); });
    if (topic === 'calcium') chooseSteps(TXT.calcium.map(tx));
    if (topic === 'conduction') chooseSteps(TXT.conduction.map(tx));
    if (topic === 'pump') {
      for (const [id, text] of [['filling', tr('Sağ / sol · doluş', 'Right / left · filling')], ['tone', tr('Otonom uyarı', 'Autonomic tone')], ['pressure', tr('Arter basıncı', 'Arterial pressure')]]) {
        const b = button(controls, id, text, () => { pumpMode = id; render(); }); b.setAttribute('aria-pressed', String(id === pumpMode));
      }
      if (pumpMode === 'tone') for (const id of Object.keys(AUTONOMIC)) {
        const names = { sympathetic: tr('Güçlü sempatik', 'Strong sympathetic'), normal: tr('Normal sempatik', 'Normal sympathetic'), zero: tr('Sempatik yok', 'No sympathetic'), parasympathetic: tr('Vagal uyarı', 'Vagal stimulation') };
        const b = button(controls, id, names[id], () => { tone = id; render(); }); b.setAttribute('aria-pressed', String(tone === id));
      }
      slider(pumpMode === 'pressure' ? 'arterial' : 'filling', pumpMode === 'pressure' ? tr('Arter basıncı (mmHg)', 'Arterial pressure (mmHg)') : tr('Atriyal doluş basıncı (mmHg)', 'Atrial filling pressure (mmHg)'), pumpMode === 'pressure' ? 0 : -4, pumpMode === 'pressure' ? 250 : 16, pumpMode === 'pressure' ? arterial : pressure, v => { if (pumpMode === 'pressure') arterial = v; else pressure = v; });
    }
    if (topic === 'pv') chooseSteps([tr('A–B · Doluş', 'A–B · Filling'), tr('B–C · İVK', 'B–C · IVC'), tr('C–D · Ejeksiyon', 'C–D · Ejection'), tr('D–A · İVG', 'D–A · IVR'), 'EW / PE']);
    if (topic === 'wiggers') {
      slider('cycle', tr('Atım içi zaman (%)', 'Time within beat (%)'), 0, 99, step, v => { step = v; });
      for (const id of ['sinus', 'afib']) { const b = button(controls, id, id === 'sinus' ? tr('Sinüs', 'Sinus') : 'AF', () => { rhythm = id; render(); }); b.setAttribute('aria-pressed', String(rhythm === id)); }
    }
    summary.textContent = tr('Kaynaklar ve kapsam', 'Sources and scope'); caveat.textContent = tx(TXT.designed);
    draw();
    if (focusKey || focusParam) {
      const replacement = [...controls.querySelectorAll('button,input')].find(n => focusKey ? n.dataset.physControl === focusKey : n.dataset.physParam === focusParam);
      replacement?.focus({ preventScroll: true });
    }
  }
  function draw() {
    svg.replaceChildren(); svg.setAttribute('viewBox', topic === 'wiggers' ? '0 0 600 520' : '0 0 600 330');
    svg.setAttribute('aria-label', tx(TXT.topics[topic])); caption.textContent = ''; output.textContent = ''; explanation.textContent = ''; extra.textContent = '';
    if (topic === 'calcium') drawCalcium();
    if (topic === 'conduction') drawConduction();
    if (topic === 'pump') drawPump();
    if (topic === 'pv') drawPv();
    if (topic === 'wiggers') drawWiggers();
    output.dataset.physOutput = topic;
    output.hidden = !output.textContent;
    extra.hidden = !extra.textContent;
  }
  function box(x, y, w, h, text, active = false) { svg.append(sv('rect', { x, y, width: w, height: h, rx: 12, class: active ? 'phys-box is-active' : 'phys-box' })); label(svg, x + w / 2, y + h / 2 + 5, text, { 'text-anchor': 'middle' }); }
  function arrow(points, active) { svg.append(sv('path', { d: path(points), class: active ? 'phys-arrow is-active' : 'phys-arrow' })); const [x,y] = points[points.length-1], [a,b] = points[points.length-2], angle = Math.atan2(y-b,x-a); svg.append(sv('path', { d: path([[x-10*Math.cos(angle)+5*Math.sin(angle),y-10*Math.sin(angle)-5*Math.cos(angle)],[x,y],[x-10*Math.cos(angle)-5*Math.sin(angle),y-10*Math.sin(angle)+5*Math.cos(angle)]]), class: active ? 'phys-arrow is-active' : 'phys-arrow' })); }
  function drawCalcium() {
    svg.append(sv('path', { d: 'M15 80H180V190Q220 240 260 190V80H585', class: 'phys-membrane' }));
    label(svg, 35, 40, tr('Hücre dışı Ca²⁺', 'Extracellular Ca²⁺')); label(svg, 192, 120, 'T-tubule');
    box(75, 120, 95, 75, 'SR · Ca²⁺', step === 1 || step === 3); box(286, 145, 132, 65, 'Troponin C', step === 2); box(290, 242, 125, 50, tr('Kasılma · ATP', 'Contraction · ATP'), step === 2);
    box(392, 33, 100, 38, 'NCX', step === 4); box(500, 33, 85, 38, 'Na/K ATP', step === 4);
    arrow([[220, 30], [220, 105], [175, 105]], step === 0); label(svg, 212, 62, 'L-type', { fill: '#547ca6' });
    arrow([[170, 162], [220, 205], [286, 177]], step === 1); label(svg, 195, 261, 'RyR2 · spark', { 'text-anchor': 'middle' });
    arrow([[352, 210], [352, 242]], step === 2);
    arrow([[306, 130], [260, 101], [146, 123]], step === 3); label(svg, 302, 98, 'SERCA2a · ATP');
    arrow([[415, 144], [440, 77], [440, 13]], step === 4); label(svg, 442, 125, 'Ca²⁺ out / Na⁺ in');
    explanation.textContent = tx(TXT.calciumNotes[step]); caption.textContent = tx(TXT.calcium[step]);
  }
  function drawConduction() {
    box(24, 38, 115, 42, 'SA', step === 0); box(195, 38, 150, 42, tr('Geçiş lifleri', 'Transitional'), step === 1); box(230, 119, 100, 42, 'AV node', step === 1);
    svg.append(sv('rect', { x: 28, y: 175, width: 540, height: 22, class: 'phys-fibrous' })); label(svg, 65, 169, tr('Fibröz AV iskeleti', 'Fibrous AV skeleton'));
    box(260, 207, 92, 35, 'His', step === 2); box(115, 273, 135, 39, tr('Sağ dal', 'Right branch'), step === 3); box(387, 273, 135, 39, tr('Sol dal', 'Left branch'), step === 3);
    arrow([[140, 59], [190, 59]], step === 0); arrow([[270, 80], [280, 119]], step === 1); arrow([[280, 161], [305, 207]], step === 2); arrow([[305, 242], [183, 273]], step === 3); arrow([[305, 242], [454, 273]], step === 3);
    caption.textContent = tx(TXT.conduction[step]); explanation.textContent = tx(TXT.conductionNotes[step]);
    extra.textContent = tr('0,03 s = 30 ms · 0,12 s = 120 ms · 0,16 s = 160 ms. Başlangıç SA düğümüdür; bu toplam sürelerden AH/HV çıkarılamaz.', '0.03 s = 30 ms · 0.12 s = 120 ms · 0.16 s = 160 ms. Origin is the SA node; these totals cannot be read as AH/HV.');
  }
  function drawPump() {
    const colors = ['#c85263', '#467dac', '#829766', '#ce9f55'];
    let series;
    if (pumpMode === 'pressure') series = [{ fn: p => 5 * pressureLoadFactor(p), color: colors[0], name: tr('Basınç-yük örneği', 'Pressure-load example') }];
    else if (pumpMode === 'filling') series = ['right', 'left'].map((side, i) => ({ fn: p => pumpOutput(p, { side }), color: colors[i], name: side === 'right' ? tr('Sağ ventrikül', 'Right ventricle') : tr('Sol ventrikül', 'Left ventricle') }));
    else series = Object.keys(AUTONOMIC).map((id, i) => ({ fn: p => pumpOutput(p, { tone: id }), color: colors[i], name: { sympathetic: tr('Sempatik ↑', 'Sympathetic ↑'), normal: tr('Normal', 'Normal'), zero: tr('Sempatik 0', 'Sympathetic 0'), parasympathetic: tr('Vagal', 'Vagal') }[id] }));
    const isPressure = pumpMode === 'pressure', value = isPressure ? 5 * pressureLoadFactor(arterial) : pumpOutput(pressure, { tone: pumpMode === 'tone' ? tone : 'normal' });
    chart(svg, { xmin: isPressure ? 0 : -4, xmax: isPressure ? 250 : 16, ymin: 0, ymax: isPressure ? 6 : pumpMode === 'tone' ? 25 : 15, xlabel: isPressure ? tr('Arter basıncı (mmHg)', 'Arterial pressure (mmHg)') : tr('İlgili atriyum basıncı (mmHg)', 'Corresponding atrial pressure (mmHg)'), ylabel: tr('Debi (L/dk)', 'Output (L/min)'), series, marker: [isPressure ? arterial : pressure, value] });
    output.textContent = `${tr('Örnek', 'Example')}: ${value.toFixed(1)} ${tr('L/dk', 'L/min')}`;
    explanation.textContent = tx(isPressure ? TXT.pressureNote : pumpMode === 'tone' ? TXT.toneNote : TXT.pumpNote);
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
    svg.append(sv('path', { d: path(loop.points.map(q => [x(q.v), y(q.p)])) + 'Z', class: 'phys-ew' })); label(svg, x(90), y(55), 'EW / SW');
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
  }
  function drawWiggers() {
    const tau = step / 100, u = timeToPhase(tau, 72), x = v => 88 + v * 465;
    const lanes = [
      { y: 40, h: 175, lo: 0, hi: 140, name: 'mmHg', lines: [[aorticPressure, '#bc8b43', tr('Aort', 'Ao')], [ventricularPressure, '#ca5264', 'LV'], [atrialPressure, '#66865d', 'LA']] },
      { y: 235, h: 85, lo: 40, hi: 140, name: 'ml', lines: [[ventricularVolume, '#427fa7', 'LV']] },
      { y: 341, h: 60, lo: -.4, hi: 1.4, name: 'ECG', lines: [[ecgValue, '#596748', 'II']] }
    ];
    for (const lane of lanes) {
      const y = v => lane.y + lane.h - (v - lane.lo) / (lane.hi - lane.lo) * lane.h;
      svg.append(sv('rect', { x: 88, y: lane.y, width: 465, height: lane.h, class: 'phys-lane' }));
      label(svg, 7, lane.y + 16, lane.name); label(svg, 83, lane.y + 9, String(lane.hi), { 'text-anchor': 'end' }); label(svg, 83, lane.y + lane.h, String(lane.lo), { 'text-anchor': 'end' });
      lane.lines.forEach(([fn, color, name], j) => {
        svg.append(sv('path', { d: path(Array.from({ length: 401 }, (_, i) => { const t = i / 400; return [x(t), y(fn(timeToPhase(t, 72), rhythm))]; })), class: 'phys-line', stroke: color }));
        label(svg, 160 + j * 110, lane.y - 8, name, { fill: color });
      });
    }
    for (const [at, name] of [[0, 'A'], [.45, 'B / S1'], [.53, 'C'], [.88, 'D / S2']]) { const xx = x(phaseToTime(at,72)); svg.append(sv('path', { d: `M${xx} 32V405`, class: 'phys-event' })); label(svg, xx, 24, name, { 'text-anchor': 'middle' }); }
    for (const [at,name] of [[.405,'a'],[.46,'c'],[.99,'v']]) if (rhythm !== 'afib' || name !== 'a') label(svg,x(phaseToTime(at,72)),205,name,{fill:'#42633c'});
    label(svg, 7, 433, 'PCG'); svg.append(sv('path', { d: 'M88 451H553', class: 'phys-grid' }));
    for (const sound of heartSounds(rhythm)) { const xx = x(phaseToTime(sound.u,72)); svg.append(sv('path', { d: `M${xx-4} 451l2 -12l3 24l3 -24l3 12`, class: sound.optional ? 'phys-optional' : 'phys-sound' })); label(svg, xx, 478, sound.optional ? `(${sound.id})` : sound.id, { 'text-anchor': 'middle' }); }
    for (const t of [0,.25,.5,.75,1]) label(svg,x(t),501,String(Math.round(t*60000/72)),{'text-anchor':'middle'});
    label(svg,577,501,'ms',{'text-anchor':'end'});
    svg.append(sv('path', { d: `M${x(tau)} 30V480`, class: 'phys-cursor' }));
    const interval = CARDIAC_INTERVALS.find(p => u >= p.start && u < p.end);
    output.textContent = `${Math.round(tau*60000/72)} ms · ${interval ? language === 'en' ? interval.name : interval.nameTr : ''}`;
    explanation.textContent = tx(TXT.wiggers);
    caption.textContent = tr('A: mitral açılır · B: mitral kapanır · C: aort açılır · D: aort kapanır. Sabit örnek hız: 72/dk.', 'A: mitral opens · B: mitral closes · C: aortic opens · D: aortic closes. Fixed example rate: 72/min.');
  }
  render();
  return { element, setLanguage(next) { const value = next === 'en' ? 'en' : 'tr'; if (language !== value) { language = value; render(); } } };
}

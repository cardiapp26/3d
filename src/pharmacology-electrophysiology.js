import { CHANNELS, FLUX, PUMP, createIonFlow } from './ep-ion-flow.js';
import { createIonicCurrents, createPhysiologyGuide } from './physiology-guide.js';
import { createConductionView } from './ep-conduction.js';

const PHASES = {
  ventricular: {
    0: ['Hızlı Na⁺ girişi', 'Rapid Na⁺ influx'],
    1: ['Erken repolarizasyon: geçici dışa K⁺ akımı', 'Early repolarization: transient outward K⁺ current'],
    2: ['Plato: içe Ca²⁺ ve dışa K⁺ akımlarının dengesi', 'Plateau: balance of inward Ca²⁺ and outward K⁺ currents'],
    3: ['Repolarizasyon: dışa K⁺ akımları', 'Repolarization: outward K⁺ currents'],
    4: ['Kararlı dinlenim potansiyeli', 'Stable resting potential'],
  },
  nodal: {
    0: ['Yükseliş: başlıca L tipi Ca²⁺ girişi', 'Upstroke: mainly L-type Ca²⁺ influx'],
    3: ['Repolarizasyon: dışa K⁺ akımları', 'Repolarization: outward K⁺ currents'],
    4: ['Spontan depolarizasyon: If ve Ca²⁺ akımları; otonom düzenleme', 'Spontaneous depolarization: If and Ca²⁺ currents; autonomic regulation'],
  },
};
/** Textbook surface-ECG correlates (qualitative). Nodal events are not visible on the surface ECG. */
const ECG_LINK = {
  ventricular: { 0: ['QRS kompleksi', 'QRS complex'], 1: ['J noktası', 'J point'], 2: ['ST segmenti', 'ST segment'], 3: ['T dalgası', 'T wave'], 4: ['TQ aralığı (diyastol)', 'TQ interval (diastole)'] },
  nodal: { 0: ['P dalgasından hemen önce; yüzey EKG’de görünmez', 'Just before the P wave; not visible on the surface ECG'], 3: ['Yüzey EKG’de doğrudan görünmez', 'Not directly visible on the surface ECG'], 4: ['Diyastol boyunca; yüzey EKG’de görünmez', 'Through diastole; not visible on the surface ECG'] },
};
const CLASSES = {
  I: ['Na⁺ kanal blokajı', 'Na⁺ channel blockade', 'ventricular', 0, 'Na⁺', 'in'],
  II: ['β blokajı: nodal otomatiklik ve iletim', 'β blockade: nodal automaticity and conduction', 'nodal', 4, 'β₁', 'signal'],
  III: ['K⁺ kanal blokajı: repolarizasyon uzaması', 'K⁺ channel blockade: prolonged repolarization', 'ventricular', 3, 'K⁺', 'out'],
  IV: ['Verapamil / diltiazem: nodal Ca²⁺ blokajı', 'Verapamil / diltiazem: nodal Ca²⁺ blockade', 'nodal', 0, 'Ca²⁺', 'in'],
};
/** Channel each class blocks; class II lowers nodal If/Ca²⁺ via β₁ rather than plugging a pore. */
const BLOCKS = { I: ['na'], III: ['k'], IV: ['ca'], II: [] };
const BETA_DAMPING = 0.4;

const CURVES = {
  ventricular: 'M55 190 H140 L150 42 L177 66 L330 76 Q370 85 405 190 H595',
  nodal: 'M55 190 Q120 183 175 140 Q195 44 225 45 Q272 50 310 190 Q375 183 430 140 Q450 44 480 45 Q527 50 565 190',
};
const DRUG_CURVES = {
  I: 'M55 190 H140 L164 54 L188 71 L336 79 Q380 89 416 190 H595',
  III: 'M55 190 H140 L150 42 L177 66 L392 76 Q442 85 482 190 H595',
  II: 'M55 190 Q140 187 210 140 Q230 44 260 45 Q307 50 345 190 Q445 187 515 140 Q535 44 565 45 Q590 48 600 80',
  IV: 'M55 190 Q135 186 200 140 Q228 56 262 53 Q306 57 344 190 Q435 186 500 140 Q528 56 562 53 Q588 56 600 90',
};
const FOCUS = {
  ventricular: { 0: 'M140 190 L150 42', 1: 'M150 42 L177 66', 2: 'M177 66 L330 76', 3: 'M330 76 Q370 85 405 190', 4: 'M405 190 H595' },
  nodal: { 0: 'M175 140 Q195 44 225 45', 3: 'M225 45 Q272 50 310 190', 4: 'M310 190 Q375 183 430 140' },
};
const PHASE_LABELS = {
  ventricular: { 0: [128, 112], 1: [172, 44], 2: [252, 62], 3: [390, 124], 4: [500, 180] },
  nodal: { 0: [176, 96], 3: [282, 112], 4: [364, 176] },
};
/**
 * One schematic cardiac cycle u∈[0,1): [phase, start, end, AP cursor path]. Order follows the
 * textbook sequence (P → QRS → ST → T → diastole); spacing is illustrative, not measured.
 */
const TIMELINE = {
  ventricular: [[4, 0, 0.22, 'M55 190 H140'], [0, 0.22, 0.245], [1, 0.245, 0.27], [2, 0.27, 0.45], [3, 0.45, 0.6], [4, 0.6, 1]],
  nodal: [[0, 0, 0.05], [3, 0.05, 0.35], [4, 0.35, 1]],
};
/** ECG landmarks on the same u axis; drug overlays change only the interval named in mark. */
const ECG_BASE = { p0: 0.05, p1: 0.13, q: 0.22, s: 0.265, tEnd: 0.6 };
const ECG_DRUG = {
  I: { change: { s: 0.3 }, mark: ['q', 's'], label: ['QRS genişler', 'QRS widens'] },
  II: { change: { q: 0.27, s: 0.315, tEnd: 0.65 }, mark: ['p0', 'q'], label: ['PR uzar; hız azalır', 'PR lengthens; rate slows'] },
  III: { change: { tEnd: 0.7 }, mark: ['q', 'tEnd'], label: ['QT uzar', 'QT prolongs'] },
  IV: { change: { q: 0.27, s: 0.315, tEnd: 0.65 }, mark: ['p0', 'q'], label: ['PR uzar; hız azalır', 'PR lengthens; rate slows'] },
};
const MECH = { atrialSystole: [0.13, 0.22], ventricularSystole: [0.235, 0.6] };
/**
 * Approximate textbook membrane potentials (mV) used only for axis ticks and the gauge:
 * ventricular myocyte rest ≈ −90, peak ≈ +20, plateau near 0; SA nodal max diastolic ≈ −60,
 * threshold ≈ −40, peak ≈ +10. y0/y1 map curve pixels to these values.
 */
const MV_SCALE = {
  ventricular: { y0: 190, mv0: -90, y1: 42, mv1: 20, ticks: [20, 0, -90] },
  nodal: { y0: 190, mv0: -60, y1: 45, mv1: 10, ticks: [10, 0, -40, -60] },
};
const toMv = (cellId, y) => { const m = MV_SCALE[cellId]; return m.mv0 + (m.y0 - y) * (m.mv1 - m.mv0) / (m.y0 - m.y1); };
const toY = (cellId, mv) => { const m = MV_SCALE[cellId]; return m.y0 - (mv - m.mv0) * (m.y0 - m.y1) / (m.mv1 - m.mv0); };
const CYCLE_SECONDS = { normal: 3.6, slow: 7.2 };
const ux = u => 96 + u * 526;

function ecgPath(m) {
  const tPeak = m.tEnd - 0.07, st = m.tEnd - 0.14;
  return `M${ux(0)} 70 H${ux(m.p0)} Q${ux((m.p0 + m.p1) / 2)} 54 ${ux(m.p1)} 70 H${ux(m.q)}`
    + ` L${ux(m.q + (m.s - m.q) * 0.25)} 76 L${ux(m.q + (m.s - m.q) * 0.5)} 8 L${ux(m.q + (m.s - m.q) * 0.8)} 84 L${ux(m.s)} 70`
    + ` H${ux(st)} Q${ux(tPeak)} 40 ${ux(m.tEnd)} 70 H${ux(1)}`;
}

const MARKUP = `<span class="pharmaep-eyebrow"></span><h2></h2><p class="pharmaep-intro"></p>
  <div class="pharmaep-cells" role="group"></div><div class="pharmaep-classes" role="group"></div>
  <div class="pharmaep-player"><button type="button" class="pharmaep-play"></button><button type="button" class="pharmaep-speed"></button><svg class="pharmaep-gauge" viewBox="0 0 120 70" role="img"><title></title><path d="M12 62A48 48 0 0 1 108 62" fill="none" stroke="#c7d1c0" stroke-width="8" stroke-linecap="round"/><line class="pharmaep-needle" x1="60" y1="62" x2="60" y2="20" stroke="#b5452f" stroke-width="3.5" stroke-linecap="round"/><circle cx="60" cy="62" r="5" fill="#35302e"/><text class="pharmaep-mv" x="60" y="48" text-anchor="middle" font-size="15" font-weight="700" fill="#35302e"></text></svg><span class="pharmaep-now" aria-live="polite"></span></div>
  <div class="pharmaep-stage">
    <svg class="pharmaep-chart" viewBox="0 0 640 250" role="img"><title></title>
      <rect width="640" height="250" rx="24" fill="#f4f5ec"/>
      <path d="M45 30 V205 H605" fill="none" stroke="#9eae95" stroke-width="2"/>
      <g class="pharmaep-ticks" font-size="12" fill="#62735d" text-anchor="end"></g>
      <path class="pharmaep-curve" fill="none" stroke="#527354" stroke-width="5" stroke-linejoin="round"/>
      <path class="pharmaep-focus" fill="none" stroke="#d3953f" stroke-width="9" stroke-linecap="round"/>
      <path class="pharmaep-drug" fill="none" stroke="#b5452f" stroke-width="3.5" stroke-dasharray="9 6"/>
      <g class="pharmaep-phase-hits"></g><g class="pharmaep-phase-nums"></g>
      <circle class="pharmaep-cursor" r="9" fill="#fff" stroke="#b5452f" stroke-width="4"/>
      <g class="pharmaep-legend" font-size="13"><path d="M440 22H470" stroke="#527354" stroke-width="4"/><text x="476" y="27" class="pharmaep-legend-base"></text><path d="M440 42H470" stroke="#b5452f" stroke-width="3.5" stroke-dasharray="7 5"/><text x="476" y="47" class="pharmaep-legend-drug"></text></g>
      <text class="pharmaep-axis" x="410" y="235" fill="#62735d" font-size="13"></text>
      <text class="pharmaep-yaxis" x="55" y="25" fill="#62735d" font-size="13"></text>
    </svg>
    <svg class="pharmaep-ecg" viewBox="0 0 640 170" role="img"><title></title>
      <defs><pattern id="pharmaep-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#f0c9c0"/></pattern></defs>
      <rect width="640" height="170" rx="14" fill="#fff7f3"/><rect x="10" y="4" width="620" height="100" fill="url(#pharmaep-grid)"/>
      <path class="pharmaep-ecg-base" fill="none" stroke="#35302e" stroke-width="2.6" stroke-linejoin="round"/>
      <path class="pharmaep-ecg-drug" fill="none" stroke="#b5452f" stroke-width="2.4" stroke-dasharray="7 5"/>
      <g class="pharmaep-ecg-waves" font-size="13" font-weight="700" fill="#7b5a52" text-anchor="middle"></g>
      <g class="pharmaep-ecg-mark"><path fill="none" stroke="#b5452f" stroke-width="2.5"/><text font-size="13" font-weight="700" fill="#b5452f"/></g>
      <g class="pharmaep-mech"></g>
      <line class="pharmaep-ecg-cursor" y1="4" y2="164" stroke="#b5452f" stroke-width="2.5"/>
    </svg>
  </div>
  <details class="pharmaep-conduction" open><summary></summary><div data-ep-conduction></div></details>
  <div class="pharmaep-phases" role="group"></div>
  <div class="pharmaep-readout" aria-live="polite"><strong></strong><p></p><p class="pharmaep-ecg-link"></p></div>
  <svg class="pharmaep-channel" viewBox="0 0 640 200" role="img"><title></title>
    <g class="pharmaep-bilayer"></g><g class="pharmaep-charges"></g><g class="pharmaep-pores"></g>
    <path class="pharmaep-ion-arrow" fill="none"/><path class="pharmaep-ion-arrow-secondary" fill="none"/>
    <text class="pharmaep-outside" x="14" y="12" fill="#65735e" font-size="12"></text>
    <text class="pharmaep-inside" x="14" y="196" fill="#65735e" font-size="12"></text>
    <text class="pharmaep-ion" x="626" y="12" text-anchor="end" fill="#354d38" font-size="13"></text>
  </svg><p class="pharmaep-beta"></p><small class="pharmaep-caveat"></small>`;

export function createPharmacologyElectrophysiology({ mount, getLang = () => 'tr' }) {
  let cell = 'ventricular', phase = 0, selectedClass = 'I';
  let u = 0.22, playing = false, speed = 'normal', visible = true, last = 0;
  const root = document.createElement('section');
  root.className = 'pharmaep';
  root.innerHTML = MARKUP;
  mount.append(root);
  const $ = selector => root.querySelector(selector);
  const t = (tr, en) => getLang() === 'en' ? en : tr;
  const currents = createIonicCurrents({ getLang });
  const physiology = createPhysiologyGuide({ topics: ['calcium', 'conduction'], lang: getLang() });
  root.insertBefore(currents.element, $('.pharmaep-conduction'));
  root.append(physiology.element);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  buildMembrane();
  const flow = createIonFlow($('.pharmaep-channel'), { reducedMotion });
  const conduction = createConductionView({ mount: $('[data-ep-conduction]'), getLang, onSeek: value => { u = value; phase = timelineSegment()[0]; playing = false; refresh(); } });
  const cellButtons = {}, classButtons = {};
  for (const id of ['ventricular', 'nodal']) {
    cellButtons[id] = addButton('.pharmaep-cells', () => { cell = id; if (!(phase in PHASES[cell])) phase = TIMELINE[cell][0][0]; seekPhase(phase); });
  }
  for (const id of Object.keys(CLASSES)) classButtons[id] = addButton('.pharmaep-classes', () => setClass(id));
  $('.pharmaep-play').addEventListener('click', () => { playing = !playing; last = 0; refresh(); });
  $('.pharmaep-speed').addEventListener('click', () => { speed = speed === 'normal' ? 'slow' : 'normal'; refresh(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }).observe(root);
  requestAnimationFrame(tick);

  function addButton(selector, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.addEventListener('click', onClick);
    $(selector).append(button);
    return button;
  }
  function buildMembrane() {
    const bilayer = $('.pharmaep-bilayer'), poreX = Object.values(CHANNELS).map(item => item.x);
    for (let x = 18; x < 630; x += 15) {
      if (poreX.some(px => Math.abs(px - x) < 26) || Math.abs(PUMP.x - x) < 30) continue;
      bilayer.insertAdjacentHTML('beforeend', `<circle cx="${x}" cy="74" r="6" fill="#d9b48a"/><circle cx="${x}" cy="126" r="6" fill="#d9b48a"/><path d="M${x - 2} 80V98M${x + 2} 80V98M${x - 2} 102V120M${x + 2} 102V120" stroke="#c8b49a" stroke-width="1.4"/>`);
    }
    $('.pharmaep-pores').insertAdjacentHTML('beforeend', `<g class="pharmaep-pump"><circle cx="${PUMP.x}" cy="100" r="24"/><g class="pharmaep-pump-rotor"><path d="M${PUMP.x} 84a16 16 0 0 1 14 8M${PUMP.x} 116a16 16 0 0 1 -14 -8"/><path d="M${PUMP.x + 14} 92l1 -7M${PUMP.x - 14} 108l-1 7"/></g><circle cx="${PUMP.x}" cy="100" r="4" fill="#fff"/>
      <text x="${PUMP.x}" y="44" text-anchor="middle" class="pharmaep-pump-label"></text><text x="${PUMP.x}" y="162" text-anchor="middle" class="pharmaep-pump-sub"></text><text x="${PUMP.x}" y="176" text-anchor="middle" class="pharmaep-pump-sub2"></text></g>`);
    const charges = $('.pharmaep-charges');
    for (const x of [30, 150, 270, 390, 510, 620]) charges.insertAdjacentHTML('beforeend', `<text class="is-out" x="${x}" y="60" text-anchor="middle"></text><text class="is-in" x="${x}" y="150" text-anchor="middle"></text>`);
    for (const [id, item] of Object.entries(CHANNELS)) {
      $('.pharmaep-pores').insertAdjacentHTML('beforeend', `<g data-channel="${id}">
        <rect x="${item.x - 24}" y="62" width="16" height="76" rx="7"/><rect x="${item.x + 8}" y="62" width="16" height="76" rx="7"/>
        <path class="pharmaep-gate" d="M${item.x - 9} 100H${item.x + 9}"/>
        <g class="pharmaep-plug"><circle cx="${item.x}" cy="${item.dir === 'in' ? 64 : 136}" r="12"/><path d="M${item.x - 6} ${item.dir === 'in' ? 58 : 130}l12 12m0-12l-12 12"/></g>
        <text x="${item.x}" y="${item.dir === 'in' ? 160 : 52}" text-anchor="middle"></text></g>`);
    }
  }
  function timelineSegment() {
    return TIMELINE[cell].find(([, start, end]) => u >= start && u < end) || TIMELINE[cell][0];
  }
  function seekPhase(value) {
    phase = Number(value);
    const segment = TIMELINE[cell].filter(([p]) => p === phase).pop();
    u = segment ? segment[1] + (segment[2] - segment[1]) * 0.35 : 0;
    playing = false;
    refresh();
  }
  function setClass(id) {
    if (!CLASSES[id]) return;
    selectedClass = id;
    cell = CLASSES[id][2];
    seekPhase(CLASSES[id][3]);
  }
  function tick(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (visible) {
      if (playing && !reducedMotion) {
        u = (u + dt / CYCLE_SECONDS[speed]) % 1;
        const next = timelineSegment()[0];
        if (next !== phase) { phase = next; refresh(); } else drawCursors();
      }
      flow.step(dt);
    }
    requestAnimationFrame(tick);
  }
  function drawCursors() {
    const segment = timelineSegment();
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', segment[3] || FOCUS[cell][segment[0]]);
    $('.pharmaep-chart').append(path);
    const length = path.getTotalLength(), point = path.getPointAtLength(length * (u - segment[1]) / (segment[2] - segment[1]));
    path.remove();
    $('.pharmaep-cursor').setAttribute('cx', point.x); $('.pharmaep-cursor').setAttribute('cy', point.y);
    const mv = toMv(cell, point.y);
    $('.pharmaep-mv').textContent = `≈ ${Math.round(mv / 5) * 5} mV`;
    const span = MV_SCALE[cell], frac = (mv - span.mv0) / (span.mv1 - span.mv0);
    const angle = (-80 + frac * 160) * Math.PI / 180;
    $('.pharmaep-needle').setAttribute('x2', 60 + Math.sin(angle) * 40); $('.pharmaep-needle').setAttribute('y2', 62 - Math.cos(angle) * 40);
    drawCharges(mv);
    conduction.update(u);
    $('.pharmaep-ecg-cursor').setAttribute('x1', ux(u)); $('.pharmaep-ecg-cursor').setAttribute('x2', ux(u));
    const systole = u >= MECH.ventricularSystole[0] && u < MECH.ventricularSystole[1];
    const atrial = u >= MECH.atrialSystole[0] && u < MECH.atrialSystole[1];
    $('.pharmaep-now').textContent = `${t('Faz', 'Phase')} ${phase} · ${systole ? t('Ventrikül sistolü', 'Ventricular systole') : t('Ventrikül diyastolü', 'Ventricular diastole')}${atrial ? ` · ${t('atriyal sistol', 'atrial systole')}` : ''}`;
  }
  function drawCharges(mv) {
    // Inside negative at rest; shown reversed through the depolarized state (upstroke and plateau).
    const reversed = mv > -30;
    root.querySelectorAll('.pharmaep-charges .is-out').forEach(node => { node.textContent = reversed ? '− −' : '+ +'; });
    root.querySelectorAll('.pharmaep-charges .is-in').forEach(node => { node.textContent = reversed ? '+ +' : '− −'; });
    $('.pharmaep-charges').classList.toggle('is-reversed', reversed);
  }
  function drawTicks() {
    $('.pharmaep-ticks').innerHTML = MV_SCALE[cell].ticks.map(mv => {
      const y = toY(cell, mv);
      return `<text x="40" y="${y + 4}">${mv > 0 ? '+' : ''}${mv}</text>${mv === 0 ? `<path d="M45 ${y}H605" stroke="#9eae95" stroke-dasharray="6 6"/>` : ''}`;
    }).join('') + '<text x="40" y="22">mV</text>';
  }
  function drawPhaseControls() {
    const hits = $('.pharmaep-phase-hits'), nums = $('.pharmaep-phase-nums');
    hits.replaceChildren(); nums.replaceChildren();
    for (const [value, d] of Object.entries(FOCUS[cell])) {
      const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hit.setAttribute('d', d);
      hit.addEventListener('click', () => seekPhase(value));
      hits.append(hit);
      const [x, y] = PHASE_LABELS[cell][value];
      const num = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      num.classList.toggle('is-active', Number(value) === phase);
      num.innerHTML = `<circle cx="${x}" cy="${y}" r="12"/><text x="${x}" y="${y + 5}" text-anchor="middle">${value}</text>`;
      num.addEventListener('click', () => seekPhase(value));
      nums.append(num);
    }
    const mount = $('.pharmaep-phases');
    mount.replaceChildren();
    for (const value of Object.keys(PHASES[cell])) {
      const button = addButton('.pharmaep-phases', () => { seekPhase(value); mount.querySelector(`[data-phase="${value}"]`)?.focus(); });
      button.textContent = `${t('Faz', 'Phase')} ${value}`;
      button.dataset.phase = value;
      button.setAttribute('aria-pressed', String(phase === Number(value)));
    }
  }
  function drawEcg() {
    const effect = ECG_DRUG[selectedClass], drug = { ...ECG_BASE, ...effect.change };
    $('.pharmaep-ecg-base').setAttribute('d', ecgPath(ECG_BASE));
    $('.pharmaep-ecg-drug').setAttribute('d', ecgPath(drug));
    const [a, b] = effect.mark.map(key => ux(drug[key]));
    $('.pharmaep-ecg-mark path').setAttribute('d', `M${a} 92V98H${b}V92`);
    const label = $('.pharmaep-ecg-mark text');
    label.setAttribute('x', Math.min(b + 8, 520)); label.setAttribute('y', 100);
    label.textContent = `${t('Sınıf', 'Class')} ${selectedClass}: ${effect.label[getLang() === 'en' ? 1 : 0]}`;
    const waves = [['P', (ECG_BASE.p0 + ECG_BASE.p1) / 2, 48], ['QRS', (ECG_BASE.q + ECG_BASE.s) / 2, 6 + 14], ['T', ECG_BASE.tEnd - 0.07, 34]];
    $('.pharmaep-ecg-waves').innerHTML = waves.map(([name, at, y]) => `<text x="${ux(at) + (name === 'QRS' ? 26 : 0)}" y="${y}">${name}</text>`).join('');
    const band = (from, to, y, cls, label) => `<rect class="${cls}" x="${ux(from)}" y="${y}" width="${ux(to) - ux(from)}" height="20" rx="5"/><text x="${(ux(from) + ux(to)) / 2}" y="${y + 14}" text-anchor="middle">${label}</text>`;
    const vs = MECH.ventricularSystole, as = MECH.atrialSystole;
    $('.pharmaep-mech').innerHTML = `<text class="pharmaep-mech-row" x="14" y="124">${t('Atriyum', 'Atria')}</text><text class="pharmaep-mech-row" x="14" y="150">${t('Ventrikül', 'Ventricle')}</text>`
      + band(as[0], as[1], 110, 'is-systole', t('sistol', 'systole'))
      + band(0, vs[0], 136, 'is-diastole', '') + band(vs[0], vs[1], 136, 'is-systole', t('sistol', 'systole')) + band(vs[1], 1, 136, 'is-diastole', t('diyastol', 'diastole'));
    $('.pharmaep-ecg title').textContent = t('Şematik EKG, mekanik sistol/diyastol ve sınıf etkisi', 'Schematic ECG, mechanical systole/diastole and class effect');
  }
  function drawMembrane() {
    const blocks = BLOCKS[selectedClass], flux = { ...FLUX[cell][phase] };
    if (selectedClass === 'II' && cell === 'nodal') for (const id of ['hcn', 'ca']) if (flux[id]) flux[id] *= BETA_DAMPING;
    const blocked = blocks.filter(id => flux[id]);
    flow.setState(flux, blocked);
    root.querySelectorAll('[data-channel]').forEach(node => {
      const id = node.dataset.channel;
      node.classList.toggle('is-open', Boolean(flux[id]));
      node.classList.toggle('is-blocked', blocks.includes(id));
      node.classList.toggle('is-hidden', id === 'hcn' && cell !== 'nodal');
      node.querySelector('text').textContent = CHANNELS[id].ion;
    });
    $('.pharmaep-beta').textContent = selectedClass === 'II'
      ? t('Sınıf II kanal tıkamaz: β₁ blokajı cAMP’yi azaltır; nodal If ve Ca²⁺ akımı zayıflar (akış yavaşlar).', 'Class II plugs no pore: β₁ blockade lowers cAMP, weakening nodal If and Ca²⁺ current (flow slows).')
      : '';
  }
  function updateLegacyArrows() {
    // Static net-flow arrows kept for assistive summaries and existing checks.
    const resting = cell === 'ventricular' && phase === 4, plateau = cell === 'ventricular' && phase === 2;
    const outward = phase === 3 || (cell === 'ventricular' && phase === 1);
    $('.pharmaep-ion-arrow').setAttribute('d', resting ? '' : plateau ? 'M312 25 V134' : outward ? 'M320 134 V25' : 'M320 25 V134');
    $('.pharmaep-ion-arrow-secondary').setAttribute('d', plateau ? 'M328 134 V25' : '');
    let ion = outward ? 'K⁺' : cell === 'ventricular' && phase === 0 ? 'Na⁺' : 'Ca²⁺';
    if (phase === 4) ion = cell === 'nodal' ? 'If / Ca²⁺' : 'K⁺ · IK₁';
    if (plateau) ion = 'Ca²⁺ ↘ / K⁺ ↗';
    $('.pharmaep-ion').textContent = ion;
  }
  function refresh() {
    const en = getLang() === 'en', drug = CLASSES[selectedClass];
    $('.pharmaep-eyebrow').textContent = t('ELEKTRİKSEL HEDEF LABORATUVARI', 'ELECTRICAL TARGET LAB');
    $('h2').textContent = t('İyon → faz → EKG → mekanik', 'Ion → phase → ECG → mechanics');
    $('.pharmaep-intro').textContent = t('Oynatın veya faz seçin: iyon akışı, aksiyon potansiyeli, EKG ve sistol/diyastol aynı zaman çizgisinde ilerler.', 'Play or pick a phase: ion flow, action potential, ECG and systole/diastole move on one timeline.');
    cellButtons.ventricular.textContent = t('Ventriküler miyosit', 'Ventricular myocyte');
    cellButtons.nodal.textContent = t('Nodal hücre', 'Nodal cell');
    for (const [id, button] of Object.entries(cellButtons)) button.setAttribute('aria-pressed', String(cell === id));
    for (const [id, button] of Object.entries(classButtons)) {
      button.textContent = `${t('Sınıf', 'Class')} ${id} · ${CLASSES[id][4]}`;
      button.setAttribute('aria-pressed', String(selectedClass === id));
    }
    $('.pharmaep-play').textContent = playing ? t('❚❚ Duraklat', '❚❚ Pause') : t('▶ Oynat', '▶ Play');
    $('.pharmaep-play').setAttribute('aria-pressed', String(playing));
    $('.pharmaep-play').disabled = reducedMotion;
    $('.pharmaep-speed').textContent = speed === 'normal' ? t('Yavaşlat', 'Slow down') : t('Normal hız', 'Normal speed');
    $('.pharmaep-curve').setAttribute('d', CURVES[cell]);
    $('.pharmaep-focus').setAttribute('d', FOCUS[cell][phase]);
    const drugOnCell = drug[2] === cell;
    $('.pharmaep-drug').setAttribute('d', drugOnCell ? DRUG_CURVES[selectedClass] : '');
    $('.pharmaep-legend-base').textContent = t('Başlangıç', 'Baseline');
    $('.pharmaep-legend-drug').textContent = drugOnCell ? `${t('Sınıf', 'Class')} ${selectedClass}` : t('Bu hücrede gösterilmez', 'Not shown for this cell');
    $('.pharmaep-chart title').textContent = t('Kavramsal aksiyon potansiyeli ve seçili faz', 'Conceptual action potential and selected phase');
    $('.pharmaep-axis').textContent = t('Zaman → (ölçeksiz)', 'Time → (not to scale)');
    $('.pharmaep-yaxis').textContent = t('Membran potansiyeli (yaklaşık, ders kitabı değerleri)', 'Membrane potential (approximate textbook values)');
    $('.pharmaep-gauge title').textContent = t('Yaklaşık membran potansiyeli', 'Approximate membrane potential');
    $('.pharmaep-pump-label').textContent = 'Na⁺/K⁺-ATPaz';
    $('.pharmaep-pump-sub').textContent = t('3 Na⁺ dışarı', '3 Na⁺ out');
    $('.pharmaep-pump-sub2').textContent = t('2 K⁺ içeri · ATP', '2 K⁺ in · ATP');
    conduction.refresh();
    $('.pharmaep-conduction summary').textContent = t('İleti sistemi, vektör ve derivasyonlar (Einthoven)', 'Conduction system, vector and leads (Einthoven)');
    drawTicks(); drawPhaseControls(); drawEcg(); drawMembrane(); updateLegacyArrows(); drawCursors();
    currents.render(cell, phase);
    physiology.setLanguage(getLang());
    $('.pharmaep-readout strong').textContent = `${t('Faz', 'Phase')} ${phase}: ${PHASES[cell][phase][en ? 1 : 0]}`;
    const relevance = drug[2] === cell && drug[3] === phase;
    $('.pharmaep-readout p').textContent = `${drug[en ? 1 : 0]}. ${relevance
      ? t('Seçili faz, bu sınıfın temel hedeflerinden biri.', 'Selected phase is a principal target of this class.')
      : t('Seçili faz bu sınıfın burada gösterilen temel hedefi değil.', 'Selected phase is not the principal target illustrated for this class.')}`;
    $('.pharmaep-ecg-link').textContent = `${t('EKG karşılığı', 'ECG correlate')}: ${ECG_LINK[cell][phase][en ? 1 : 0]}`;
    $('.pharmaep-channel title').textContent = t('Seçili fazda açık kanallar ve iyon akış yönü', 'Open channels and ion flow direction in the selected phase');
    $('.pharmaep-outside').textContent = t('Hücre dışı · Na⁺, Ca²⁺ yüksek', 'Extracellular · high Na⁺, Ca²⁺');
    $('.pharmaep-inside').textContent = t('Hücre içi · K⁺ yüksek', 'Intracellular · high K⁺');
    $('.pharmaep-caveat').textContent = t('Şematik eğitim modeli; eğriler, akış hızları ve zaman aralıkları ölçüm değildir. Faz-EKG ve EKG-sistol eşleşmeleri nitel ders kitabı ilişkileridir. Sınıf I alt grupları AP süresini farklı etkiler. Sınıf IV burada non-dihidropiridinleri gösterir. Amiodaron gibi ilaçlar birden fazla sınıf etkisi taşır.', 'Schematic education model; curves, flow rates and time spacing are not measurements. Phase-ECG and ECG-systole pairings are qualitative textbook relations. Class I subgroups differ in AP duration effects. Class IV here means non-dihydropyridines. Drugs such as amiodarone have multiple class effects.');
  }
  refresh();
  return { refresh, setClass };
}

// Hall et al. (1980), doi:10.1152/ajprenal.1980.239.3.F271.
// These weights choreograph a qualitative sequence, with no clinical units.
const STAGES = [
  { at: 0, raas: 0, output: 0 },
  { at: 0.18, raas: 0, output: 0.08 },
  { at: 0.38, raas: -1, output: 0.30 },
  { at: 0.59, raas: -1, output: 2.8 },
  { at: 0.80, raas: -0.8, output: 1 }
];
const METRICS = ['volume', 'pressure', 'raas', 'output'];
const VOLUME_SCALE = 2.7;

export function saltRaasFrame(progress, scenario) {
  const t = Math.min(1, Math.max(0, progress));
  const stage = STAGES.findLastIndex(frame => frame.at <= t);
  const target = STAGES[stage];
  const previous = STAGES[Math.max(0, stage - 1)];
  const next = STAGES[stage + 1] ?? { at: 1, output: target.output };
  const end = next.at;
  const blend = Math.min(1, (t - target.at) / ((end - target.at) * 0.75));
  const direction = scenario === 'low' ? -1 : 1;
  let retained = 0;
  let output = 0;
  for (let i = 0; i <= stage; i++) {
    const left = STAGES[i], right = STAGES[i + 1] ?? next;
    const elapsed = Math.min(t, right.at) - left.at;
    output = left.output + (right.output - left.output) * elapsed / (right.at - left.at);
    // Relative sodium retained is the area between intake and urinary output.
    retained += elapsed * (1 - (left.output + output) / 2);
  }
  const signed = weight => weight === 0 ? 0 : direction * weight;
  const volume = signed(retained * VOLUME_SCALE);
  return { stage, intake: direction, volume, pressure: volume, raas: signed(previous.raas + (target.raas - previous.raas) * blend), output: signed(output) };
}

const COPY = {
  tr: {
    kicker: 'BÖBREK · ARTERİYEL BASINÇ',
    title: 'Tuz alımı değişince kan basıncı nasıl dengelenir?',
    intro: 'Bir tuz değişiminden sonra sodyum dengesini, hücre dışı hacmi, arteriyel basıncı ve renin-anjiyotensin yanıtını birlikte izleyin.',
    high: 'Tuz alımı ↑', low: 'Tuz alımı ↓', scenarios: 'Tuz senaryosu',
    play: 'Oynat', pause: 'Duraklat', replay: 'Yeniden oynat', scrub: 'Uyum sürecinde gezin',
    artwork: 'Tuz alımı, dolaşım, böbrek ve idrarla sodyum atılımı',
    intake: 'Tuz alımı', circulation: 'Dolaşım', kidney: 'Böbrek', urine: 'İdrar',
    steps: ['Alım', 'Hacim ve basınç', 'Renin ve Ang II', 'Böbrek yanıtı', 'Yeni denge'],
    metrics: ['Hücre dışı hacim', 'Arteriyel basınç', 'Renin / Ang II', 'İdrarla Na⁺ atılımı'],
    levels: { base: 'Başlangıca yakın', up: '↑ Daha yüksek', down: '↓ Daha düşük', near: 'Başlangıca yaklaşır' },
    highStages: [
      ['Tuz alımı artar', 'Bir süre sodyum alımı idrarla atılımı aşar. Geçici pozitif sodyum dengesi oluşur.'],
      ['Hacim ve arteriyel basınç yükselir', 'Tutulan sodyuma su eşlik eder. Hücre dışı sıvı hacmi genişler ve arteriyel basınç yükselme eğilimi gösterir.'],
      ['Renin ve anjiyotensin II azalır', 'Böbrek perfüzyon basıncı ve makula densaya ulaşan NaCl arttığında renin salınımı baskılanır. Anjiyotensin II azalır.'],
      ['Böbrek daha fazla sodyum atar', 'Yüksek perfüzyon basıncı natriürezi destekler. Anjiyotensin II azalınca geri emilim de azalır. Atılım bir süre alımı aşarsa biriken sodyum ve su azalır.'],
      ['Yüksek alımda yeni denge kurulur', 'Atılım yüksek alıma yetişir. Hacim ve basınç başlangıca yaklaşabilir. Denge, atılımın eski düzeyine dönmesi anlamına gelmez.']
    ],
    lowStages: [
      ['Tuz alımı azalır', 'Bir süre idrarla sodyum atılımı alımı aşar. Geçici negatif sodyum dengesi oluşur.'],
      ['Hacim ve arteriyel basınç düşer', 'Net sodyum ve su kaybıyla hücre dışı hacim azalır. Arteriyel basınç düşme eğilimi gösterir.'],
      ['Renin ve anjiyotensin II artar', 'Düşük böbrek perfüzyon basıncı ve makula densaya ulaşan NaCl’nin azalması renin salınımını uyarır. Anjiyotensin II artar.'],
      ['Böbrek sodyum ve suyu korur', 'Anjiyotensin II geri emilimi destekler. Düşük perfüzyon basıncı natriürezi azaltır. Atılım bir süre alımın altında kalırsa kaybedilen sodyum ve su yerine konur.'],
      ['Düşük alımda yeni denge kurulur', 'Atılım daha düşük alımla eşleşir. Sodyum ve suyun korunması hacmi ve basıncı başlangıca yaklaştırır.']
    ],
    note: 'Nitel eğitim şeması. Zaman, oklar ve parçacıklar temsili. Tuz duyarlılığında basınç yanıtı daha belirgin olabilir.',
    sources: 'Fizyoloji kaynakları'
  },
  en: {
    kicker: 'KIDNEY · ARTERIAL PRESSURE',
    title: 'How does blood pressure adapt to a change in salt intake?',
    intro: 'Follow sodium balance, extracellular volume, arterial pressure and the renin–angiotensin response after a change in salt intake.',
    high: 'Salt intake ↑', low: 'Salt intake ↓', scenarios: 'Salt scenario',
    play: 'Play', pause: 'Pause', replay: 'Replay', scrub: 'Scrub the adaptation',
    artwork: 'Salt intake, circulation, kidney and urinary sodium excretion',
    intake: 'Salt intake', circulation: 'Circulation', kidney: 'Kidney', urine: 'Urine',
    steps: ['Intake', 'Volume and pressure', 'Renin and Ang II', 'Renal response', 'New balance'],
    metrics: ['Extracellular volume', 'Arterial pressure', 'Renin / Ang II', 'Urinary Na⁺ excretion'],
    levels: { base: 'Near baseline', up: '↑ Above baseline', down: '↓ Below baseline', near: 'Approaches baseline' },
    highStages: [
      ['Salt intake increases', 'Sodium intake initially exceeds urinary excretion. A temporary positive sodium balance develops.'],
      ['Volume and arterial pressure rise', 'Water accompanies retained sodium. Extracellular fluid volume expands and arterial pressure tends to rise.'],
      ['Renin and angiotensin II fall', 'Higher renal perfusion pressure and greater NaCl delivery to the macula densa suppress renin release. Angiotensin II falls.'],
      ['The kidney excretes more sodium', 'Higher perfusion pressure promotes natriuresis. Lower angiotensin II reduces reabsorption. When excretion briefly exceeds intake, retained sodium and water fall.'],
      ['A new balance at higher intake', 'Excretion catches up with higher intake. Volume and pressure can approach baseline while sodium excretion remains elevated.']
    ],
    lowStages: [
      ['Salt intake decreases', 'Urinary sodium excretion initially exceeds intake. A temporary negative sodium balance develops.'],
      ['Volume and arterial pressure fall', 'Net sodium and water loss reduces extracellular volume. Arterial pressure tends to fall.'],
      ['Renin and angiotensin II rise', 'Lower renal perfusion pressure and reduced NaCl delivery to the macula densa stimulate renin release. Angiotensin II rises.'],
      ['The kidney conserves sodium and water', 'Angiotensin II supports reabsorption. Lower perfusion pressure also reduces natriuresis. When excretion briefly falls below intake, lost sodium and water are replaced.'],
      ['A new balance at lower intake', 'Excretion matches the lower intake. Sodium and water conservation brings volume and pressure closer to baseline.']
    ],
    note: 'Qualitative teaching diagram. Timing, arrows and particles are illustrative. Blood pressure can respond more strongly in salt sensitivity.',
    sources: 'Physiology sources'
  }
};

const TRACKS = {
  intake: { path: 'M134 127 C166 127 170 108 205 108', color: '#ffd39c' },
  blood: { path: 'M305 108 C347 108 349 129 387 129', color: '#ff9e91' },
  urine: { path: 'M432 153 C448 184 469 187 514 187', color: '#7be3d0' }
};
let sceneId = 0;

function diagram() {
  const prefix = `raas-${++sceneId}`;
  const fill = name => `url(#${prefix}-${name})`;
  return `<svg viewBox="0 0 600 236" class="raas-svg" role="img">
    <defs>
      <linearGradient id="${prefix}-artery" x2="0" y2="1">
        <stop stop-color="#e98276"/><stop offset="1" stop-color="#a73c51"/>
      </linearGradient>
      <radialGradient id="${prefix}-kidney" cx=".34" cy=".32" r=".72">
        <stop stop-color="#e99f88"/><stop offset=".7" stop-color="#b75259"/><stop offset="1" stop-color="#783c4d"/>
      </radialGradient>
      <linearGradient id="${prefix}-salt" x2="0" y2="1">
        <stop stop-color="#fff0d3"/><stop offset="1" stop-color="#e3a86e"/>
      </linearGradient>
      <radialGradient id="${prefix}-glow"><stop stop-color="#348c86" stop-opacity=".42"/><stop offset="1" stop-color="#348c86" stop-opacity="0"/></radialGradient>
      <marker id="${prefix}-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M1 1 L6 4 L1 7" fill="none" stroke="#80b2ad" stroke-width="1.2"/>
      </marker>
    </defs>
    <rect width="600" height="236" rx="13" fill="#142e32"/>
    <ellipse cx="306" cy="120" rx="240" ry="118" fill="${fill('glow')}"/>
    <path d="M28 41H572 M28 195H572" stroke="#48716e" stroke-opacity=".43"/>
    <ellipse cx="83" cy="152" rx="53" ry="16" fill="#182b2d"/>
    <path d="M39 142 Q83 158 128 142 L121 158 Q83 174 45 158 Z" fill="#517673"/>
    <path d="M39 142 Q83 153 128 142 Q115 128 104 126 L93 111 L82 121 L71 113 L61 127 Q50 128 39 142Z" fill="${fill('salt')}"/>
    <g fill="#fff6dd" opacity=".8">
      <path d="M64 132 l6 -7 7 5 -5 7Z M87 128 l6 -10 7 10 -6 7Z M106 137 l5 -6 8 4 -8 7Z"/>
      <circle cx="53" cy="139" r="2"/><circle cx="85" cy="139" r="2.5"/><circle cx="97" cy="141" r="1.7"/>
    </g>
    <ellipse data-raas-volume cx="253" cy="109" rx="68" ry="52" fill="#72c9c5" opacity=".22"/>
    <g data-raas-artery>
      <path d="M207 78 C235 73 272 74 298 83 V137 C271 146 234 143 207 139Z" fill="${fill('artery')}" stroke="#f39a8a" stroke-width="1.4"/>
      <ellipse cx="298" cy="110" rx="18" ry="28" fill="#f0a28b" stroke="#ffc5ae" stroke-width="1.5"/>
      <ellipse cx="298" cy="110" rx="12" ry="19" fill="#702f46"/>
      <path d="M215 85 Q250 80 284 88 M216 131 Q250 138 284 132" fill="none" stroke="#ffc1a9" stroke-opacity=".68" stroke-width="2"/>
      <path d="M226 108 h12 l6 -9 7 20 7 -13 h16" fill="none" stroke="#ffe3cf" stroke-width="2" stroke-linejoin="round"/>
    </g>
    <circle data-raas-halo cx="435" cy="120" r="52" fill="#dec089" opacity=".15"/>
    <path d="M454 73 C478 80 490 107 478 136 C466 165 439 180 414 165 C394 153 402 141 415 131 C429 121 419 110 409 102 C394 85 425 61 454 73Z"
      fill="${fill('kidney')}" stroke="#ffc0a7" stroke-width="1.6"/>
    <path d="M451 84 C470 92 476 112 466 136 C458 154 442 167 427 158 C418 153 423 145 432 136 C441 127 436 113 426 104 C411 92 431 76 451 84Z" fill="#863c52"/>
    <path d="M457 90 L440 115 L469 111 L442 128 L460 142 L437 137 L444 157 L427 147" fill="#d5897a" stroke="#f1a590" stroke-width="1.2"/>
    <path d="M454 105 Q443 120 436 128 M453 137 L436 128 C428 137 426 146 432 153" fill="none" stroke="#f5c58e" stroke-width="4" stroke-linecap="round"/>
    ${Object.entries(TRACKS).map(([id, { path, color }]) => `<g>
      <path data-raas-track="${id}" d="${path}" fill="none" stroke="#80b2ad" stroke-width="1.6" stroke-dasharray="4 4" marker-end="${fill('arrow')}"/>
      ${Array.from({ length: 5 }, () => `<circle data-raas-particle="${id}" r="3" fill="${color}"/>`).join('')}
    </g>`).join('')}
    <path d="M541 163 C535 175 526 181 526 189 A15 15 0 0 0 556 189 C556 181 547 174 541 163Z" fill="#6abfba" stroke="#b5f0df" stroke-width="1.2"/>
    <path d="M534 186 Q530 194 537 197" fill="none" stroke="#d8fff1" stroke-linecap="round" stroke-width="1.7"/>
    <g fill="#e9f4ef" font-family="system-ui, sans-serif" font-size="17" font-weight="700" text-anchor="middle">
      <text x="83" y="65" data-raas-copy="intake"></text>
      <text x="253" y="65" data-raas-copy="circulation"></text>
      <text x="440" y="65" data-raas-copy="kidney"></text>
      <text x="541" y="224" data-raas-copy="urine"></text>
    </g>
  </svg>`;
}

export function createSaltRaasLab({ container, lang = 'tr' }) {
  const root = document.createElement('section');
  root.className = 'pathophys-card raas-lab';
  root.dataset.saltRaasLab = '';
  root.innerHTML = `
    <header class="raas-header"><p data-raas-copy="kicker"></p><h3 data-raas-copy="title"></h3><p data-raas-copy="intro"></p></header>
    <div class="raas-toolbar">
      <div class="preset-pill-group" data-raas-scenarios role="group">
        <button class="preset-pill" type="button" data-raas-scenario="high" data-raas-copy="high"></button>
        <button class="preset-pill" type="button" data-raas-scenario="low" data-raas-copy="low"></button>
      </div>
      <button class="preset-pill raas-play" type="button" data-raas-play></button>
    </div>
    ${diagram()}
    <div class="raas-metrics">${METRICS.map(key => `<div><span data-raas-metric="${key}"></span><strong data-raas-value="${key}"></strong></div>`).join('')}</div>
    <label class="raas-scrub"><span data-raas-copy="scrub"></span><input type="range" min="0" max="1000" value="0" data-raas-scrub></label>
    <ol class="raas-steps">${STAGES.map((_, index) => `<li><button type="button" data-raas-step="${index}"><span>${index + 1}</span><b></b></button></li>`).join('')}</ol>
    <div class="raas-explainer" aria-live="polite"><h4 data-raas-title></h4><p data-raas-detail></p></div>
    <p class="raas-note" data-raas-copy="note"></p>
    <details class="raas-sources"><summary data-raas-copy="sources"></summary>
      <a href="https://doi.org/10.1152/ajprenal.1980.239.3.F271" target="_blank" rel="noopener noreferrer">Hall et al. · 1980</a>
      <a href="https://pubmed.ncbi.nlm.nih.gov/2012204/" target="_blank" rel="noopener noreferrer">Lorenz et al. · 1991</a>
      <a href="https://pubmed.ncbi.nlm.nih.gov/3970209/" target="_blank" rel="noopener noreferrer">Roman &amp; Cowley · 1985</a>
    </details>`;
  container.append(root);
  const $ = selector => root.querySelector(selector);
  const scrub = $('[data-raas-scrub]');
  const play = $('[data-raas-play]');
  const steps = [...root.querySelectorAll('[data-raas-step]')];
  const modes = [...root.querySelectorAll('[data-raas-scenario]')];
  const readouts = METRICS.map(key => [key, $(`[data-raas-value="${key}"]`)]);
  const volume = $('[data-raas-volume]');
  const artery = $('[data-raas-artery]');
  const halo = $('[data-raas-halo]');
  const tracks = Object.keys(TRACKS).map(id => {
    const path = $(`[data-raas-track="${id}"]`);
    return { id, path, length: path.getTotalLength(), particles: [...root.querySelectorAll(`[data-raas-particle="${id}"]`)] };
  });
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t = COPY[lang] ?? COPY.tr;
  let scenario = 'high', progress = 0, playing = false, raf = null, last = null, shownStage = -1;
  const duration = 13500;

  function paint() {
    const frame = saltRaasFrame(progress, scenario);
    scrub.value = String(Math.round(progress * 1000));
    volume.setAttribute('rx', 68 + 12 * frame.volume);
    volume.setAttribute('ry', 52 + 8 * frame.volume);
    artery.setAttribute('transform', `translate(253 109) scale(1 ${1 + 0.15 * frame.pressure}) translate(-253 -109)`);
    halo.setAttribute('opacity', 0.15 + 0.12 * frame.raas);
    for (const { id, path, length, particles } of tracks) {
      const intensity = id === 'intake' ? frame.intake : id === 'urine' ? frame.output : frame.pressure;
      particles.forEach((particle, index) => {
        const position = path.getPointAtLength(((progress * 6 + index / particles.length) % 1) * length);
        particle.setAttribute('cx', position.x);
        particle.setAttribute('cy', position.y);
        particle.setAttribute('opacity', Math.max(0.09, Math.min(1, 0.76 + 0.35 * intensity - index * 0.14)));
      });
    }
    if (frame.stage === shownStage) return;
    shownStage = frame.stage;
    root.dataset.raasStage = frame.stage;
    const [title, detail] = t[`${scenario}Stages`][frame.stage];
    $('[data-raas-title]').textContent = title;
    $('[data-raas-detail]').textContent = detail;
    scrub.setAttribute('aria-valuetext', title);
    steps.forEach((button, index) => {
      if (index === frame.stage) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    const sign = frame.intake;
    for (const [key, node] of readouts) {
      const isVolumeOrPressure = key === 'volume' || key === 'pressure';
      const near = frame.stage === STAGES.length - 1 && isVolumeOrPressure;
      const value = key === 'raas' ? sign * STAGES[frame.stage].raas : frame.stage === 0 ? 0 : sign;
      node.textContent = t.levels[near ? 'near' : value === 0 ? 'base' : value > 0 ? 'up' : 'down'];
    }
  }

  function syncPlayback() {
    play.textContent = playing ? t.pause : progress === 1 ? t.replay : t.play;
    play.setAttribute('aria-pressed', String(playing));
  }

  function stop() {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
    last = null;
    playing = false;
    syncPlayback();
  }

  function tick(now) {
    raf = null;
    if (last !== null) progress = Math.min(1, progress + Math.min(now - last, 100) / duration);
    last = now;
    paint();
    if (progress === 1) stop();
    else raf = requestAnimationFrame(tick);
  }

  function start() {
    if (playing) return;
    if (progress === 1) progress = 0;
    playing = true;
    syncPlayback();
    paint();
    raf = requestAnimationFrame(tick);
  }

  function seek(next) {
    stop();
    progress = next;
    syncPlayback();
    paint();
  }

  function updateLanguage(next) {
    t = COPY[next] ?? COPY.tr;
    root.querySelectorAll('[data-raas-copy]').forEach(node => { node.textContent = t[node.dataset.raasCopy]; });
    $('[data-raas-scenarios]').setAttribute('aria-label', t.scenarios);
    $('.raas-svg').setAttribute('aria-label', t.artwork);
    steps.forEach((node, index) => { node.querySelector('b').textContent = t.steps[index]; });
    METRICS.forEach((key, index) => { $(`[data-raas-metric="${key}"]`).textContent = t.metrics[index]; });
    syncPlayback();
    shownStage = -1;
    paint();
  }

  function syncScenario() {
    modes.forEach(button => {
      const selected = button.dataset.raasScenario === scenario;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  modes.forEach(button => button.addEventListener('click', () => {
    scenario = button.dataset.raasScenario;
    shownStage = -1;
    syncScenario();
    seek(0);
    if (!reduced) start();
  }));
  steps.forEach((button, index) => button.addEventListener('click', () => {
    const start = STAGES[index].at;
    const end = STAGES[index + 1]?.at ?? 1;
    seek(start + (end - start) * 0.8);
  }));
  scrub.addEventListener('input', () => seek(Number(scrub.value) / 1000));
  play.addEventListener('click', () => playing ? stop() : start());
  syncScenario();
  updateLanguage(lang);
  if (!reduced) start();

  return { updateLanguage, destroy() { stop(); root.remove(); } };
}

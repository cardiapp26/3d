import { T, VASO_DRUGS as DRUGS, VASO_SCENARIOS as SCENARIOS, VASO_SOURCES as SOURCES, vasoPath } from './vasoactive-data.js';
import './vasoactive.css';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Visual metadata for the 10 vasoactive drugs (qualitative teaching visual bars & receptor badges)
const DRUG_VISUALS = {
  norepinephrine: {
    role: T('İlk Seçenek İnopressör', 'First-Line Inopressor'),
    tone: '#1f6f54',
    svrScore: 90,
    coScore: 62,
    hrScore: 55,
    lumenR: 13,
    pumpScale: 1.08,
    receptors: ['α₁ +++', 'β₁ ++']
  },
  vasopressin: {
    role: T('Katekolamin Dışı Vazopressör', 'Non-Catecholamine Pressor'),
    tone: '#2b6cb0',
    svrScore: 88,
    coScore: 44,
    hrScore: 50,
    lumenR: 13,
    pumpScale: 0.96,
    receptors: ['V₁a +++']
  },
  dobutamine: {
    role: T('İnotrop (İnodilatör Eğilimli)', 'Inotrope (Inodilator Tendency)'),
    tone: '#c05621',
    svrScore: 34,
    coScore: 92,
    hrScore: 74,
    lumenR: 24,
    pumpScale: 1.22,
    receptors: ['β₁ +++', 'β₂ ++']
  },
  milrinone: {
    role: T('PDE-3 İnodilatör', 'PDE-3 Inodilator'),
    tone: '#9c4221',
    svrScore: 22,
    coScore: 88,
    hrScore: 62,
    lumenR: 27,
    pumpScale: 1.20,
    receptors: ['PDE-3 ⊣ (↑cAMP)']
  },
  epinephrine: {
    role: T('Güçlü İnopressör (β₁/β₂/α₁)', 'Potent Inopressor (β₁/β₂/α₁)'),
    tone: '#b83280',
    svrScore: 76,
    coScore: 95,
    hrScore: 90,
    lumenR: 16,
    pumpScale: 1.25,
    receptors: ['β₁ +++', 'α₁ ++', 'β₂ ++']
  },
  phenylephrine: {
    role: T('Saf α₁ Vazokonstriktör', 'Pure α₁ Vasoconstrictor'),
    tone: '#2c5282',
    svrScore: 94,
    coScore: 38,
    hrScore: 34,
    lumenR: 11,
    pumpScale: 0.92,
    receptors: ['α₁ +++']
  },
  dopamine: {
    role: T('Doza Bağlı Katekolamin', 'Dose-Dependent Catecholamine'),
    tone: '#744210',
    svrScore: 68,
    coScore: 74,
    hrScore: 88,
    lumenR: 18,
    pumpScale: 1.12,
    receptors: ['D₁', 'β₁ ++', 'α₁ (yüksek doz)']
  },
  angiotensin: {
    role: T('RAAS Peptid Vazopressör', 'RAAS Peptide Vasopressor'),
    tone: '#285e61',
    svrScore: 90,
    coScore: 50,
    hrScore: 50,
    lumenR: 13,
    pumpScale: 1.0,
    receptors: ['AT₁ +++']
  },
  levosimendan: {
    role: T('Ca²⁺ Duyarlılaştırıcı İnodilatör', 'Ca²⁺ Sensitizer Inodilator'),
    tone: '#6b46c1',
    svrScore: 28,
    coScore: 82,
    hrScore: 58,
    lumenR: 26,
    pumpScale: 1.18,
    receptors: ['Troponin C', 'KATP (damar)']
  },
  metaraminol: {
    role: T('Periferik α Ağırlıklı Pressör', 'Peripheral α-Dominant Pressor'),
    tone: '#2f855a',
    svrScore: 78,
    coScore: 46,
    hrScore: 40,
    lumenR: 15,
    pumpScale: 0.96,
    receptors: ['α₁ ++', 'Dolaylı NE']
  }
};

// Hemodynamic & POCUS teaching profiles for the 5 shock scenarios
const SCENARIO_VISUALS = {
  septic: {
    badge: T('Distributif / Vazoplejik', 'Distributive / Vasoplegic'),
    color: '#c05621',
    svr: { val: 26, label: T('SVR ↓↓ (Vazodilatasyon)', 'SVR ↓↓ (Vasodilation)') },
    co: { val: 72, label: T('CO ↑ / Normal (Erken) veya ↓ (Geç)', 'CO ↑ / Normal (Early) or ↓ (Late)') },
    preload: { val: 38, label: T('Göreli Hipovolemi / Kapiller Kaçış', 'Relative Hypovolemia / Capillary Leak') },
    pocus: T('Hiperdinamik LV (erken) veya septik kardiyomiyopati; IVC değişken', 'Hyperdynamic LV (early) or septic cardiomyopathy; variable IVC')
  },
  cardiogenic: {
    badge: T('Pompa Yetersizliği', 'Pump Failure'),
    color: '#9b2c2c',
    svr: { val: 84, label: T('SVR ↑↑ (Kompansatuvar)', 'SVR ↑↑ (Compensatory)') },
    co: { val: 24, label: T('CO / CI ↓↓ (Düşük Debi)', 'CO / CI ↓↓ (Low Output)') },
    preload: { val: 88, label: T('CVP / PCWP ↑↑ (Konjesyon)', 'CVP / PCWP ↑↑ (Congestion)') },
    pocus: T('Bozulmuş LV/RV sistolik fonksiyon, B-çizgileri (akciğer konjesyonu), dilate IVC', 'Depressed LV/RV systolic function, lung B-lines (congestion), plethoric IVC')
  },
  hypovolemic: {
    badge: T('Önyük / Hacim Kaybı', 'Preload / Volume Loss'),
    color: '#b7791f',
    svr: { val: 86, label: T('SVR ↑↑ (Vazokonstriksiyon)', 'SVR ↑↑ (Vasoconstriction)') },
    co: { val: 30, label: T('CO ↓↓ (Düşük Atım Hacmi)', 'CO ↓↓ (Low Stroke Volume)') },
    preload: { val: 16, label: T('CVP / PCWP ↓↓ (Boş Kavite)', 'CVP / PCWP ↓↓ (Empty Tank)') },
    pocus: T('Küçük, hiperkinetik "öpüşen" LV duvarları ve kollabe IVC', 'Small, hyperkinetic "kissing" LV walls and collapsible IVC')
  },
  obstructive: {
    badge: T('Mekanik Engel', 'Mechanical Obstruction'),
    color: '#6b46c1',
    svr: { val: 82, label: T('SVR ↑↑', 'SVR ↑↑') },
    co: { val: 22, label: T('CO ↓↓ (Akım Engeli)', 'CO ↓↓ (Outflow/Inflow Block)') },
    preload: { val: 90, label: T('CVP ↑↑ (Tamponad / PE / Tansiyon PTX)', 'CVP ↑↑ (Tamponade / PE / Tension PTX)') },
    pocus: T('Perikardiyal efüzyon + RV diyastolik kollaps, masif PE’de D-shape RV veya kayıp plevral kayma', 'Pericardial effusion + RV diastolic collapse, D-shaped RV in PE, or absent lung sliding')
  },
  mixed: {
    badge: T('Kombine Şok', 'Combined Shock'),
    color: '#2b6cb0',
    svr: { val: 45, label: T('SVR ↓ / Değişken', 'SVR ↓ / Variable') },
    co: { val: 36, label: T('CO ↓ (Pompa + Tonus Bozuk)', 'CO ↓ (Pump + Tone Impaired)') },
    preload: { val: 62, label: T('Değişken Dolum Basınçları', 'Variable Filling Pressures') },
    pocus: T('Tekrarlayan POCUS ile LV/RV kontraktilitesi ve sıvı toleransının seri takibi', 'Serial POCUS to track LV/RV contractility and fluid tolerance simultaneously')
  }
};

export function createVasoactivePanel({ mount, getLang = () => 'tr' }) {
  let profile = 'pressure', scenario = 'septic', selected = 'norepinephrine', view = 'algorithm';
  const root = document.createElement('div');
  root.className = 'vasolab';
  mount.replaceChildren(root);

  root.innerHTML = `
    <header class="vaso-hero">
      <div class="vaso-hero-copy">
        <p class="vaso-eyebrow"></p>
        <h2></h2>
        <p class="vaso-intro"></p>
      </div>
      <div class="vaso-formula-pill">
        <span class="vaso-formula-eq">MAP ≈ CO × SVR + CVP</span>
        <small class="vaso-formula-sub"></small>
      </div>
    </header>

    <nav class="vaso-views"></nav>

    <section data-vaso-page="algorithm">
      <div class="vaso-step-grid">
        <div class="vaso-entry">
          <div class="vaso-step-head">
            <span class="vaso-step-icon">🩸</span>
            <strong></strong>
          </div>
          <p></p>
          <div class="vaso-target-chips" data-vaso-targets-strip></div>
        </div>
        <div class="vaso-assess">
          <div class="vaso-step-head">
            <span class="vaso-step-icon">🫀</span>
            <h3></h3>
          </div>
          <p></p>
          <div class="vaso-pocus-chips" data-vaso-pocus-strip></div>
        </div>
      </div>

      <div class="vaso-interactive-bench">
        <div class="vaso-bench-top">
          <div class="vaso-bench-title">
            <span class="vaso-bench-kicker" data-vaso-bench-kicker></span>
            <h4 data-vaso-bench-heading></h4>
          </div>
          <div class="vaso-quick-scenarios" data-vaso-quick-scenarios></div>
        </div>

        <div class="vaso-bench-grid">
          <div class="vaso-sim-stage">
            <svg class="vaso-sim-svg" viewBox="0 0 640 270" role="img" data-vaso-sim-svg></svg>
          </div>
          <div class="vaso-gauges-card" data-vaso-gauges></div>
        </div>
      </div>

      <div class="vaso-profiles-header" data-vaso-profiles-label></div>
      <div class="vaso-profiles"></div>
      <div class="vaso-flags"></div>

      <div class="vaso-result" role="status">
        <div class="vaso-result-main">
          <div class="vaso-result-copy">
            <span class="vaso-result-kicker" data-vaso-result-kicker></span>
            <h3></h3>
            <p class="vaso-result-lead"></p>
            <div class="vaso-agents-wrap">
              <span class="vaso-agents-label" data-vaso-agents-label></span>
              <div class="vaso-agents"></div>
            </div>
            <p class="vaso-context"></p>
          </div>
          <div class="vaso-result-preview" data-vaso-result-preview></div>
        </div>
      </div>
    </section>

    <section data-vaso-page="drugs" hidden>
      <div class="vaso-spectrum-bar" data-vaso-spectrum></div>
      <div class="vaso-drugs"></div>
      <div class="vaso-drug-layout">
        <div class="vaso-map-card">
          <svg class="vaso-map" viewBox="0 0 600 330" role="img">
            <defs>
              <marker id="vaso-head" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0 0L8 4L0 8Z" fill="#315f50"/>
              </marker>
              <radialGradient id="vaso-heart-glow" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stop-color="#e56b55" stop-opacity="0.32"/>
                <stop offset="100%" stop-color="#e56b55" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <rect x="10" y="10" width="580" height="310" rx="20" fill="#f3f7ee" stroke="#d5e0cd"/>
            <circle cx="165" cy="154" r="78" fill="url(#vaso-heart-glow)" data-map-heart-halo/>
            <path d="M165 106C112 42 52 94 88 152L165 232L242 152C278 94 218 42 165 106Z" class="vaso-heart"/>
            <path d="M285 118H356Q384 118 400 140T448 162H566 M285 182H356Q384 182 400 160T448 138H566" class="vaso-vessel" data-map-vessel-path/>
            <circle cx="515" cy="150" r="28" fill="#e6efe2" stroke="#6c8c77" stroke-width="2.5"/>
            <circle cx="515" cy="150" r="16" fill="#c97a63" fill-opacity="0.35" stroke="#b85d43" stroke-width="3" data-map-lumen/>
            <path d="M222 150H298" class="vaso-flow" marker-end="url(#vaso-head)"/>
            <text x="165" y="42" text-anchor="middle" font-weight="700" data-map="pump"></text>
            <text x="436" y="64" text-anchor="middle" font-weight="700" data-map="vessel"></text>
            <text x="165" y="266" text-anchor="middle" font-weight="700" data-map="co"></text>
            <text x="436" y="266" text-anchor="middle" font-weight="700" data-map="svr"></text>
            <text x="436" y="94" text-anchor="middle" font-weight="700" fill="#8b6e3e" data-map="target"></text>
            <g data-map-badges></g>
          </svg>
          <div class="vaso-bars-card" data-vaso-drug-bars></div>
        </div>
        <article class="vaso-drug">
          <div class="vaso-drug-head">
            <div>
              <span class="vaso-drug-role" data-vaso-drug-role></span>
              <h3></h3>
            </div>
            <p class="vaso-target"></p>
          </div>
          <div class="vaso-effects"></div>
          <h4 data-field="context"></h4>
          <p data-value="context"></p>
          <h4 data-field="risk"></h4>
          <p data-value="risk"></p>
          <details class="vaso-dose"><summary></summary><p></p><small></small></details>
          <div class="vaso-drug-sources"></div>
        </article>
      </div>
      <p class="vaso-legend"></p>
    </section>

    <section data-vaso-page="scenarios" hidden>
      <div class="vaso-scenarios"></div>
      <div class="vaso-scenario-grid">
        <article class="vaso-scenario">
          <span class="vaso-scenario-badge" data-vaso-scen-badge></span>
          <h3></h3>
          <p></p>
          <strong></strong>
          <div class="vaso-scenario-pocus" data-vaso-scen-pocus></div>
          <button type="button" data-vaso-return></button>
        </article>
        <div class="vaso-scenario-visual" data-vaso-scen-bars></div>
      </div>
    </section>

    <section class="vaso-monitor"><h3></h3><div></div></section>
    <details class="vaso-corrections"><summary></summary><ul></ul></details>
    <details class="vaso-sources"><summary></summary><ul></ul></details>
  `;

  const $ = s => root.querySelector(s);
  const text = (selector, value) => { $(selector).textContent = value; };
  const tr = x => x[getLang() === 'en' ? 'en' : 'tr'];
  const effectText = effect => effect.includes('dose-dependent') ? tr(T('Doza bağlı', 'Dose-dependent')) : effect.includes('variable') ? tr(T('Değişken', 'Variable')) : effect;
  const targetText = target => target.includes('α dominant') ? tr(T('α ağırlıklı', 'α dominant')) : target;

  const buttons = (parent, entries, action, attr) => new Map(entries.map(([id, title]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset[attr] = id;
    b.addEventListener('click', () => action(id));
    $(parent).append(b);
    return [id, { b, title }];
  }));

  const views = buttons('.vaso-views', [
    ['algorithm', T('01 · Seçim haritası', '01 · Selection map')],
    ['drugs', T('02 · İlaç hedefleri', '02 · Drug targets')],
    ['scenarios', T('03 · Şok senaryoları', '03 · Shock scenarios')]
  ], id => { view = id; refresh(); }, 'vasoView');

  const profiles = buttons('.vaso-profiles', [
    ['pressure', T('Basınç düşük → damar tonusu', 'Low pressure → vascular tone')],
    ['output', T('Basınç yeterli, debi düşük → pompa', 'Adequate pressure, low output → pump')],
    ['both', T('Basınç + debi düşük → birlikte değerlendir', 'Low pressure + output → assess both')]
  ], id => {
    profile = id;
    selected = vasoPath({ profile, scenario }).agents[0];
    refresh();
  }, 'vasoProfile');

  // Enhance profile buttons with persistent icon/subtitle spans while keeping button text accessible
  const profileIcons = {
    pressure: { icon: '🩸', tag: 'SVR ↓ → α₁ / V₁a', tone: 'tone' },
    output: { icon: '🫀', tag: 'CO ↓ → β₁ / PDE-3', tone: 'pump' },
    both: { icon: '⚡', tag: 'SVR ↓ + CO ↓ → α₁ + β₁', tone: 'both' }
  };

  const drugs = buttons('.vaso-drugs', DRUGS.map(d => [d.id, d.name]), id => { selected = id; refresh(); }, 'vasoDrug');
  const scenarios = buttons('.vaso-scenarios', SCENARIOS.map(s => [s.id, s.name]), id => { scenario = id; refresh(); }, 'vasoScenario');

  const flags = new Map();
  for (const [id, title] of [
    ['escalating', T('Artan noradrenalin ihtiyacı', 'Escalating norepinephrine')],
    ['tachy', T('Taşiaritmi', 'Tachyarrhythmia')],
    ['renal', T('Böbrek işlevi bozuk', 'Renal impairment')]
  ]) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    const span = document.createElement('span');
    input.type = 'checkbox';
    input.dataset.vasoFlag = id;
    input.addEventListener('change', refresh);
    label.append(input, span);
    $('.vaso-flags').append(label);
    flags.set(id, { input, span, title });
  }

  $('[data-vaso-return]').addEventListener('click', () => {
    view = 'algorithm';
    refresh();
    $('.vaso-profiles button[aria-pressed=true]').focus();
  });

  function sourceLink(id) {
    const a = document.createElement('a');
    a.href = SOURCES[id].url;
    a.textContent = SOURCES[id].title;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  }

  for (const id of Object.keys(SOURCES)) {
    const li = document.createElement('li');
    li.append(sourceLink(id));
    $('.vaso-sources ul').append(li);
  }

  function renderAlgorithmVisualBench(path, activeScenario) {
    const sv = SCENARIO_VISUALS[scenario] || SCENARIO_VISUALS.septic;
    const primaryDrugId = path.agents[0] || 'norepinephrine';
    const hasAdjunct = path.adjunct.length > 0;
    const isBoth = profile === 'both' && path.kind !== 'cause';
    const isOutput = profile === 'output' && path.kind !== 'cause';
    const isCause = path.kind === 'cause';

    text('[data-vaso-bench-kicker]', tr(T('ETKİLEŞİMLİ HEMODİNAMİK SİMÜLASYON TEZGAHI', 'INTERACTIVE HEMODYNAMIC BENCH')));
    text('[data-vaso-bench-heading]', `${tr(activeScenario.name)} · ${tr(sv.badge)}`);

    // Quick scenario selector pills on page 01
    const quickWrap = $('[data-vaso-quick-scenarios]');
    quickWrap.replaceChildren(...SCENARIOS.map(sc => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `vaso-quick-scen-btn ${sc.id === scenario ? 'is-active' : ''}`;
      btn.setAttribute('aria-pressed', String(sc.id === scenario));
      btn.textContent = tr(sc.name);
      btn.addEventListener('click', () => {
        scenario = sc.id;
        refresh();
      });
      return btn;
    }));

    // Draw interactive SVG bench: Left (Heart Pump) -> Middle (MAP = CO x SVR) -> Right (Vascular Tone Pipe)
    const simSvg = $('[data-vaso-sim-svg]');
    const pumpActive = isOutput || isBoth;
    const toneActive = !isOutput || isBoth;
    const lumenRadius = isOutput ? 24 : hasAdjunct ? 11 : 14;
    const strokeWidthVessel = isOutput ? 8 : hasAdjunct ? 16 : 13;

    const pumpTitle = tr(T('POMPA (KONTRAKTİLİTE)', 'PUMP (CONTRACTILITY)'));
    const pipeTitle = tr(T('DAMAR TONUSU (SVR)', 'VASCULAR TONE (SVR)'));
    const mapLabel = tr(T('HEDEF PERFÜZYON & MAP', 'TARGET PERFUSION & MAP'));
    const clickHintPump = tr(T('Pompa profilini seçmek için tıkla', 'Click to select Pump profile'));
    const clickHintPipe = tr(T('Damar tonusu profilini seçmek için tıkla', 'Click to select Vascular Tone profile'));

    const activeAgentNames = [...path.agents, ...path.adjunct]
      .map(id => tr(DRUGS.find(x => x.id === id).name))
      .join(' + ');

    simSvg.innerHTML = `
      <defs>
        <linearGradient id="vaso-bench-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f7faf2"/>
          <stop offset="100%" stop-color="#ebf2e4"/>
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="628" height="258" rx="16" fill="url(#vaso-bench-bg)" stroke="#cddbc4"/>

      <!-- Left Clickable Zone: Cardiac Pump -->
      <g class="vaso-sim-hotspot" data-vaso-sim-pick="output" role="button" tabindex="0" aria-label="${esc(clickHintPump)}">
        <rect x="18" y="20" width="192" height="230" rx="14" fill="${pumpActive ? '#fff3eb' : '#ffffff'}" stroke="${pumpActive ? '#c05621' : '#d2decb'}" stroke-width="${pumpActive ? '2.5' : '1.4'}"/>
        <text x="114" y="42" text-anchor="middle" font-size="10.5" font-weight="800" fill="#7c5836">${esc(pumpTitle)}</text>
        <circle cx="114" cy="118" r="46" fill="${pumpActive ? 'rgba(229,107,85,0.18)' : 'rgba(119,147,108,0.12)'}"/>
        <path d="M114 86 C80 44, 40 78, 66 118 L114 166 L162 118 C188 78, 148 44, 114 86 Z"
              fill="${pumpActive ? '#e07a5f' : '#c7d8be'}"
              stroke="${pumpActive ? '#9c4221' : '#5f7d63'}"
              stroke-width="2.5"/>
        <text x="114" y="122" text-anchor="middle" font-size="11" font-weight="800" fill="${pumpActive ? '#ffffff' : '#2d4a3e'}">
          ${pumpActive ? 'β₁ / PDE-3 ↑↑' : 'CO / SV'}
        </text>
        <rect x="36" y="182" width="156" height="24" rx="7" fill="${pumpActive ? '#fbe3d3' : '#eef3e8'}"/>
        <text x="114" y="198" text-anchor="middle" font-size="9.5" font-weight="700" fill="#304c40">
          ${esc(tr(sv.co.label))}
        </text>
        <text x="114" y="234" text-anchor="middle" font-size="10" fill="#68806c">
          ${pumpActive ? '✓ ' + esc(tr(T('İnotropi Etkin', 'Inotropy Active'))) : esc(tr(T('Tıkla → Pompa Yolu', 'Click → Pump Path')))}
        </text>
      </g>

      <!-- Center Zone: MAP = CO x SVR Bridge & Arterial Waveform -->
      <g>
        <rect x="224" y="20" width="192" height="230" rx="14" fill="#ffffff" stroke="#cbd8c3" stroke-width="1.5"/>
        <text x="320" y="42" text-anchor="middle" font-size="10.5" font-weight="800" fill="#315f50">${esc(mapLabel)}</text>

        <!-- Simulated Arterial Pressure Waveform Box -->
        <rect x="238" y="54" width="164" height="74" rx="9" fill="#13251e" stroke="#2c4c3e"/>
        <line x1="238" y1="94" x2="402" y2="94" stroke="rgba(167,243,208,0.28)" stroke-dasharray="3 3"/>
        <text x="245" y="68" font-size="9" font-weight="700" fill="#6ee7b7">MAP ≥ 65 mmHg</text>
        <path d="M244 108 L256 108 L264 68 L272 88 L276 82 L288 108 L302 108 L310 68 L318 88 L322 82 L334 108 L348 108 L356 68 L364 88 L368 82 L380 108 L396 108"
              fill="none" stroke="${isCause ? '#f6ad55' : '#34d399'}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>

        <!-- Active Pathway Pill -->
        <rect x="238" y="140" width="164" height="44" rx="9" fill="${isCause ? '#fffaf0' : '#eef5ec'}" stroke="${isCause ? '#dd6b20' : '#84a587'}"/>
        <text x="320" y="157" text-anchor="middle" font-size="9.5" font-weight="700" fill="#5b705e">
          ${esc(isCause ? tr(T('Öncelik: Nedeni Düzelt', 'Priority: Fix Cause First')) : tr(T('Seçili Ajan(lar)', 'Selected Agent(s)')))}
        </text>
        <text x="320" y="174" text-anchor="middle" font-size="${activeAgentNames.length > 24 ? '9.2' : '11'}" font-weight="800" fill="#1f4437">
          ${esc(activeAgentNames)}
        </text>

        <text x="320" y="208" text-anchor="middle" font-size="10" font-weight="700" fill="#4a6657">
          ${esc(tr(T('Yaş ≥65 (SSC 2026): 60–65 mmHg', 'Age ≥65 (SSC 2026): 60–65 mmHg')))}
        </text>
        <text x="320" y="232" text-anchor="middle" font-size="9.5" fill="#718474">
          ${esc(tr(T('Kapiller dolum · Laktat · İdrar · Bilinç', 'Cap refill · Lactate · Urine · Mentation')))}
        </text>
      </g>

      <!-- Right Clickable Zone: Vascular Tone (SVR) -->
      <g class="vaso-sim-hotspot" data-vaso-sim-pick="pressure" role="button" tabindex="0" aria-label="${esc(clickHintPipe)}">
        <rect x="430" y="20" width="192" height="230" rx="14" fill="${toneActive ? '#eef7f2' : '#ffffff'}" stroke="${toneActive ? '#2f6f55' : '#d2decb'}" stroke-width="${toneActive ? '2.5' : '1.4'}"/>
        <text x="526" y="42" text-anchor="middle" font-size="10.5" font-weight="800" fill="#2f6f55">${esc(pipeTitle)}</text>

        <!-- Cross-section & longitudinal arteriole -->
        <path d="M448 102 Q486 ${102 + (24 - lumenRadius) * 0.5} 524 102 M448 138 Q486 ${138 - (24 - lumenRadius) * 0.5} 524 138"
              fill="none" stroke="${toneActive ? '#2f6f55' : '#8fa693'}" stroke-width="${strokeWidthVessel}" stroke-linecap="round"/>
        <circle cx="564" cy="120" r="30" fill="#dfece3" stroke="#4d7c65" stroke-width="2.2"/>
        <circle cx="564" cy="120" r="${lumenRadius}" fill="#d96b52" fill-opacity="0.42" stroke="#b84a32" stroke-width="3"/>
        <text x="486" y="124" text-anchor="middle" font-size="10.5" font-weight="800" fill="#1f4437">
          ${hasAdjunct ? 'α₁ + V₁a ↑↑' : toneActive ? 'α₁ Tonus ↑' : 'SVR'}
        </text>

        <rect x="448" y="182" width="156" height="24" rx="7" fill="${toneActive ? '#dDF0E6' : '#eef3e8'}"/>
        <text x="526" y="198" text-anchor="middle" font-size="9.5" font-weight="700" fill="#304c40">
          ${esc(tr(sv.svr.label))}
        </text>
        <text x="526" y="234" text-anchor="middle" font-size="10" fill="#68806c">
          ${toneActive ? '✓ ' + esc(tr(T('Vazopressör Etkin', 'Vasopressor Active'))) : esc(tr(T('Tıkla → Basınç Yolu', 'Click → Pressure Path')))}
        </text>
      </g>
    `;

    simSvg.querySelectorAll('[data-vaso-sim-pick]').forEach(node => {
      const pick = () => {
        profile = node.dataset.vasoSimPick;
        selected = vasoPath({ profile, scenario }).agents[0];
        refresh();
      };
      node.addEventListener('click', pick);
      node.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pick();
        }
      });
    });

    // Render Right-side Hemodynamic Gauges & POCUS summary for active scenario
    const gaugesEl = $('[data-vaso-gauges]');
    const dv = DRUG_VISUALS[primaryDrugId] || DRUG_VISUALS.norepinephrine;
    gaugesEl.innerHTML = `
      <div class="vaso-gauge-head">
        <strong>${esc(tr(T('Hemodinamik Profil & POCUS Özeti', 'Hemodynamic Profile & POCUS Summary')))}</strong>
        <span class="vaso-scen-pill" style="background:${sv.color}1a;color:${sv.color};border-color:${sv.color}4d">${esc(tr(sv.badge))}</span>
      </div>
      <div class="vaso-gauge-rows">
        <div class="vaso-gauge-row">
          <div class="vaso-gauge-meta">
            <span>${esc(tr(T('Sistemik Damar Direnci (SVR)', 'Systemic Vascular Resistance (SVR)')))}</span>
            <strong>${esc(tr(sv.svr.label))}</strong>
          </div>
          <div class="vaso-bar-track"><div class="vaso-bar-fill" style="width:${sv.svr.val}%;background:#2f6f55"></div></div>
        </div>
        <div class="vaso-gauge-row">
          <div class="vaso-gauge-meta">
            <span>${esc(tr(T('Kardiyak Debi / Pompa (CO / CI)', 'Cardiac Output / Pump (CO / CI)')))}</span>
            <strong>${esc(tr(sv.co.label))}</strong>
          </div>
          <div class="vaso-bar-track"><div class="vaso-bar-fill" style="width:${sv.co.val}%;background:#c05621"></div></div>
        </div>
        <div class="vaso-gauge-row">
          <div class="vaso-gauge-meta">
            <span>${esc(tr(T('Dolum / Önyük (CVP / PCWP)', 'Filling / Preload (CVP / PCWP)')))}</span>
            <strong>${esc(tr(sv.preload.label))}</strong>
          </div>
          <div class="vaso-bar-track"><div class="vaso-bar-fill" style="width:${sv.preload.val}%;background:#2b6cb0"></div></div>
        </div>
      </div>
      <div class="vaso-pocus-note">
        <strong>🔍 POCUS / Echo:</strong> <span>${esc(tr(sv.pocus))}</span>
      </div>
      <div class="vaso-receptor-chips">
        <span class="vaso-rec-caption">${esc(tr(T('Aktif Reseptör Hedefleri:', 'Active Receptor Targets:')))}</span>
        ${dv.receptors.map(r => `<span class="vaso-rec-chip">${esc(r)}</span>`).join('')}
        ${hasAdjunct ? `<span class="vaso-rec-chip vaso-rec-adjunct">+ V₁a (Vazopressin)</span>` : ''}
      </div>
    `;
  }

  function refresh() {
    text('.vaso-eyebrow', tr(T('HEMODİNAMİK DESTEK LABORATUVARI', 'HEMODYNAMIC SUPPORT LAB')));
    text('header h2', tr(T('Basınç mı, pompa mı, ikisi mi?', 'Pressure, pump, or both?')));
    text('.vaso-intro', tr(T(
      'Erişkin şokta seçim mantığını keşfet. Profil bir öğretim varsayımıdır; hasta tanısı veya otomatik reçete oluşturulmaz.',
      'Explore adult shock selection logic. Profiles are teaching assumptions; no patient diagnosis or automatic prescription.'
    )));
    text('.vaso-formula-sub', tr(T(
      'Basınç (MAP) tek başına doku perfüzyonunu kanıtlamaz',
      'Pressure (MAP) alone does not prove tissue perfusion'
    )));

    for (const [id, { b, title }] of views) {
      b.textContent = tr(title);
      b.setAttribute('aria-pressed', String(view === id));
      $(`[data-vaso-page=${id}]`).hidden = view !== id;
    }

    for (const [id, { b, title }] of profiles) {
      const meta = profileIcons[id];
      b.textContent = `${meta.icon} ${tr(title)} (${meta.tag})`;
      b.setAttribute('aria-pressed', String(profile === id));
    }

    for (const [id, { b, title }] of drugs) {
      b.textContent = tr(title);
      b.setAttribute('aria-pressed', String(selected === id));
    }

    for (const [id, { b, title }] of scenarios) {
      b.textContent = tr(title);
      b.setAttribute('aria-pressed', String(scenario === id));
    }

    for (const { span, title } of flags.values()) {
      span.textContent = tr(title);
    }

    text('.vaso-entry strong', tr(T('01 · Hipotansiyon / hipoperfüzyonu tanı', '01 · Recognize hypotension / hypoperfusion')));
    text('.vaso-entry p', tr(T(
      'MAP tek başına yeterli değil: mental durum, kapiller dolum, idrar ve laktat eğilimini birlikte değerlendir. Septik şok başlangıç MAP hedefi 65 mmHg; ≥65 yaşta SSC 2026, 60–65 mmHg aralığını önerir. Hedef bireyselleştirilir.',
      'Assess mentation, capillary refill, urine and lactate trend together. Initial septic-shock MAP target: 65 mmHg; SSC 2026 suggests 60–65 mmHg at age ≥65. Individualize targets.'
    )));

    const targetBadges = [
      T('MAP ≥ 65 mmHg (Genel)', 'MAP ≥ 65 mmHg (Standard)'),
      T('MAP 60–65 mmHg (≥65 Yaş · SSC 2026)', 'MAP 60–65 mmHg (Age ≥65 · SSC 2026)'),
      T('Kapiller Dolum + Laktat Trendi', 'Capillary Refill + Lactate Trend'),
      T('İdrar ≥ 0,5 mL/kg/sa', 'Urine ≥ 0.5 mL/kg/h')
    ];
    $('[data-vaso-targets-strip]').innerHTML = targetBadges.map(b => `<span class="vaso-mini-chip">${esc(tr(b))}</span>`).join('');

    text('.vaso-assess h3', tr(T('02 · Hemodinamik profili değerlendir', '02 · Assess hemodynamic profile')));
    text('.vaso-assess p', tr(T(
      'Neden, POCUS/eko ile LV–RV ve volüm durumu, ritim, konjesyon, perfüzyon. Soğuk ekstremite = yüksek SVR varsayımı güvenilir değil. Sıvı yanıtı ve toleransını yeniden değerlendir.',
      'Cause, echo/POCUS LV–RV and volume status, rhythm, congestion and perfusion. Cold extremities do not reliably establish high SVR. Reassess fluid responsiveness and tolerance.'
    )));

    const pocusBadges = [
      T('LV / RV Kontraktilite', 'LV / RV Contractility'),
      T('IVC & Sıvı Toleransı', 'IVC & Fluid Tolerance'),
      T('Akciğer B-Çizgileri (Konjesyon)', 'Lung B-Lines (Congestion)'),
      T('Perikard / Obstrüksiyon', 'Pericardium / Obstruction')
    ];
    $('[data-vaso-pocus-strip]').innerHTML = pocusBadges.map(b => `<span class="vaso-mini-chip vaso-mini-chip-blue">${esc(tr(b))}</span>`).join('');

    text('[data-vaso-profiles-label]', tr(T(
      '03 · Baskın hemodinamik sorunu ve klinik değiştiricileri seçin:',
      '03 · Select dominant hemodynamic problem and clinical modifiers:'
    )));

    const path = vasoPath({ profile, scenario, escalating: flags.get('escalating').input.checked });
    const s = SCENARIOS.find(x => x.id === scenario);

    renderAlgorithmVisualBench(path, s);

    text('[data-vaso-result-kicker]', tr(T('AKTİF KARAR YOLU VE AJAN SEÇİMİ', 'ACTIVE DECISION PATHWAY & AGENT SELECTION')));
    text('.vaso-result h3', `${tr(s.name)} · ${tr(
      path.kind === 'cause'
        ? T('Önce nedeni düzelt', 'Correct cause first')
        : profile === 'both'
        ? T('Basınç desteği + seçilmiş inotropi', 'Pressure support + selected inotropy')
        : profile === 'output'
        ? T('Yeterli basınçta inotropiyi değerlendir', 'Assess inotropy at adequate pressure')
        : T('Vazopressör yolu', 'Vasopressor pathway')
    )}`);

    text('.vaso-result-lead', tr(
      path.kind === 'cause'
        ? T('İlaçlar geçici destek olabilir; altta yatan nedeni tedavi etmenin yerine geçmez. Noradrenalin ancak süren hipotansiyonda seçilmiş köprü desteği.', 'Drugs may bridge care, never replace cause treatment. Norepinephrine is a selected bridge only for persistent hypotension.')
        : profile === 'both'
        ? T('İki ilaç herkes için gerekli değildir. Seçilmiş hastada perfüzyon, basınç ve pompa yanıtı birlikte izlenir.', 'Two drugs are not needed by everyone. Reassess perfusion, pressure and pump response together in selected patients.')
        : profile === 'output'
        ? T('İnotropi: kardiyak disfonksiyon ve yeterli volüm/basınca rağmen süren hipoperfüzyon koşulunda. MAP mevcut vazopressörle korunuyorsa dobutamin ona eklenir; yerine geçmez.', 'Inotropy requires cardiac dysfunction and persistent hypoperfusion despite adequate volume and pressure. If a pressor maintains MAP, dobutamine is added to it, not substituted.')
        : T('Noradrenalin basınç yolunun temel örneği. Artan gereksinimde septik şok için vazopressin eklenmesi değerlendirilir.', 'Norepinephrine is the base pressure-path example; consider adjunct vasopressin with escalating needs in septic shock.')
    ));

    text('[data-vaso-agents-label]', tr(T('Önerilen Ajan(lar) — Hedef kartını açmak için tıklayın:', 'Pathway Agent(s) — Click to open target card:')));

    $('.vaso-agents').replaceChildren(...[...path.agents, ...path.adjunct].map(id => {
      const drugObj = DRUGS.find(d => d.id === id);
      const dv = DRUG_VISUALS[id] || DRUG_VISUALS.norepinephrine;
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.vasoAgent = id;
      b.innerHTML = `<span class="vaso-agent-name">${esc(tr(drugObj.name))}</span> <small class="vaso-agent-rec">${esc(targetText(drugObj.target))}</small>`;
      b.style.borderColor = dv.tone;
      b.addEventListener('click', () => {
        selected = id;
        view = 'drugs';
        refresh();
        $('.vaso-drugs button[aria-pressed=true]').focus();
      });
      return b;
    }));

    const notes = [tr(s.cause)];
    if (scenario === 'septic') notes.push(tr(T('MAP yine yetersizse adrenalin; kardiyak disfonksiyonda adrenalin de alternatif.', 'If MAP remains inadequate, epinephrine; also an alternative with cardiac dysfunction.')));
    if (flags.get('tachy').input.checked) notes.push(tr(T('Taşiaritmi: katekolamin yükü ve nedenleri kontrol et; fenilefrin düşük debiyi kötüleştirebilir.', 'Tachyarrhythmia: reassess catecholamines and causes; phenylephrine may worsen low output.')));
    if (flags.get('renal').input.checked) notes.push(tr(T('Böbrek: milrinon birikir; ürün bilgisine göre hız azaltımı gerekir.', 'Renal impairment: milrinone accumulates; label-directed rate reduction required.')));
    text('.vaso-context', notes.join(' · '));

    // Render live Drug Mini-Preview Card on the right of `.vaso-result`
    const previewDrugId = [...path.agents, ...path.adjunct].includes(selected) ? selected : path.agents[0];
    const previewDrug = DRUGS.find(x => x.id === previewDrugId) || DRUGS[0];
    const previewVis = DRUG_VISUALS[previewDrug.id] || DRUG_VISUALS.norepinephrine;
    $('[data-vaso-result-preview]').innerHTML = `
      <div class="vaso-preview-top">
        <span class="vaso-preview-role">${esc(tr(previewVis.role))}</span>
        <strong>${esc(tr(previewDrug.name))} (${esc(targetText(previewDrug.target))})</strong>
      </div>
      <div class="vaso-preview-metrics">
        <div><span>SVR</span><strong>${esc(effectText(previewDrug.effects[0]))}</strong></div>
        <div><span>CO</span><strong>${esc(effectText(previewDrug.effects[1]))}</strong></div>
        <div><span>HR</span><strong>${esc(effectText(previewDrug.effects[2]))}</strong></div>
      </div>
      <p class="vaso-preview-dose">${esc(tr(previewDrug.dose))}</p>
    `;

    // Page 02: Drug Targets & Spectrum
    const d = DRUGS.find(x => x.id === selected);
    const dVis = DRUG_VISUALS[d.id] || DRUG_VISUALS.norepinephrine;
    text('[data-vaso-drug-role]', tr(dVis.role));
    text('.vaso-drug h3', tr(d.name));
    text('.vaso-target', targetText(d.target));

    // Render Vasopressor <-> Inodilator Spectrum Strip
    const spectrumOrder = [
      { id: 'phenylephrine', tag: 'α₁' },
      { id: 'vasopressin', tag: 'V₁a' },
      { id: 'angiotensin', tag: 'AT₁' },
      { id: 'metaraminol', tag: 'α' },
      { id: 'norepinephrine', tag: 'α₁>β₁' },
      { id: 'dopamine', tag: 'D/β/α' },
      { id: 'epinephrine', tag: 'β₁/α₁/β₂' },
      { id: 'dobutamine', tag: 'β₁>β₂' },
      { id: 'levosimendan', tag: 'TnC/KATP' },
      { id: 'milrinone', tag: 'PDE-3' }
    ];
    const specEl = $('[data-vaso-spectrum]');
    specEl.innerHTML = `
      <div class="vaso-spec-labels">
        <span>◀ ${esc(tr(T('Saf Vazopressör (SVR ↑↑)', 'Pure Vasopressor (SVR ↑↑)')))}</span>
        <span>${esc(tr(T('İnopressör (SVR ↑ + CO ↑)', 'Inopressor (SVR ↑ + CO ↑)')))}</span>
        <span>${esc(tr(T('İnodilatör (CO ↑↑ + SVR ↓)', 'Inodilator (CO ↑↑ + SVR ↓)')))} ▶</span>
      </div>
      <div class="vaso-spec-track">
        ${spectrumOrder.map(item => {
          const drugItem = DRUGS.find(x => x.id === item.id);
          const active = item.id === selected;
          return `<button type="button" class="vaso-spec-node ${active ? 'is-active' : ''}" data-vaso-spec-pick="${item.id}">
            <strong>${esc(tr(drugItem.name))}</strong>
            <small>${esc(item.tag)}</small>
          </button>`;
        }).join('')}
      </div>
    `;
    specEl.querySelectorAll('[data-vaso-spec-pick]').forEach(btn => {
      btn.addEventListener('click', () => {
        selected = btn.dataset.vasoSpecPick;
        refresh();
      });
    });

    $('.vaso-effects').replaceChildren(...d.effects.map((effect, i) => {
      const e = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = effectText(effect);
      const label = document.createElement('span');
      label.textContent = ['SVR', 'CO', 'HR'][i];
      e.append(strong, label);
      return e;
    }));

    for (const key of ['context', 'risk']) {
      text(`[data-field=${key}]`, tr(key === 'context' ? T('Klinik bağlam', 'Clinical context') : T('Risk / izlem', 'Risk / monitoring')));
      text(`[data-value=${key}]`, tr(d[key]));
    }
    text('.vaso-dose summary', tr(T('Kaynak doz bilgisi · erişkin IV', 'Source dose information · adult IV')));
    text('.vaso-dose p', tr(d.dose));
    text('.vaso-dose small', tr(T(
      'Karşılaştırmalı kaynak bilgisi; başlangıç, yükleme, seyreltme ve titrasyon protokolü değildir. Kurum protokolü ve ürün bilgisi gerekir.',
      'Comparative reference information, not starting/loading, dilution or titration protocol. Use local protocols and product information.'
    )));
    $('.vaso-drug-sources').replaceChildren(...d.sources.map(sourceLink));

    text('[data-map=pump]', tr(T('Kalp / kontraktilite', 'Heart / contractility')));
    text('[data-map=vessel]', tr(T('Sistemik damar tonusu', 'Systemic vascular tone')));
    text('[data-map=co]', `CO ${effectText(d.effects[1])}`);
    text('[data-map=svr]', `SVR ${effectText(d.effects[0])}`);
    text('[data-map=target]', targetText(d.target));

    const lumenEl = $('[data-map-lumen]');
    if (lumenEl) lumenEl.setAttribute('r', String(dVis.lumenR));

    const badgesG = $('[data-map-badges]');
    if (badgesG) {
      badgesG.innerHTML = dVis.receptors.map((rec, idx) => {
        const x = 115 + idx * 125;
        return `<g transform="translate(${x}, 288)">
          <rect x="0" y="0" width="112" height="24" rx="12" fill="#315f50"/>
          <text x="56" y="16" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="700">${esc(rec)}</text>
        </g>`;
      }).join('');
    }

    $('[data-vaso-drug-bars]').innerHTML = `
      <div class="vaso-dbar-row">
        <span>SVR (${esc(effectText(d.effects[0]))})</span>
        <div class="vaso-bar-track"><div class="vaso-bar-fill" style="width:${dVis.svrScore}%;background:#2f6f55"></div></div>
      </div>
      <div class="vaso-dbar-row">
        <span>CO (${esc(effectText(d.effects[1]))})</span>
        <div class="vaso-bar-track"><div class="vaso-bar-fill" style="width:${dVis.coScore}%;background:#c05621"></div></div>
      </div>
      <div class="vaso-dbar-row">
        <span>HR (${esc(effectText(d.effects[2]))})</span>
        <div class="vaso-bar-track"><div class="vaso-bar-fill" style="width:${dVis.hrScore}%;background:#b83280"></div></div>
      </div>
    `;

    $('.vaso-map').setAttribute('aria-label', `${tr(d.name)}: ${targetText(d.target)}; SVR ${effectText(d.effects[0])}, CO ${effectText(d.effects[1])}, HR ${effectText(d.effects[2])}`);
    $('.vaso-heart').classList.toggle('is-active', d.effects[1].includes('↑'));
    $('.vaso-vessel').classList.toggle('is-active', d.effects[0].includes('↑'));
    text('.vaso-legend', tr(T(
      'Oklar tipik yönü gösterir; etki büyüklüğü, doz-yanıt veya sağkalım faydası değildir. MAP ≈ CO × SVR + CVP; yalnız MAP yükselmesi perfüzyon düzeldi demek değildir.',
      'Arrows show typical directions, not magnitude, dose-response or survival benefit. MAP ≈ CO × SVR + CVP; a higher MAP alone does not prove restored perfusion.'
    )));

    // Page 03: Shock Scenarios
    const scenVis = SCENARIO_VISUALS[s.id] || SCENARIO_VISUALS.septic;
    text('[data-vaso-scen-badge]', tr(scenVis.badge));
    text('.vaso-scenario h3', tr(s.name));
    text('.vaso-scenario p', tr(s.detail));
    text('.vaso-scenario strong', tr(s.cause));
    text('[data-vaso-scen-pocus]', `POCUS / Echo: ${tr(scenVis.pocus)}`);
    text('[data-vaso-return]', tr(T('Bu senaryoyu seçim haritasında aç', 'Open this scenario in selection map')));

    $('[data-vaso-scen-bars]').innerHTML = `
      <h4>${esc(tr(T('Beklenen Hemodinamik Patern', 'Expected Hemodynamic Pattern')))}</h4>
      <div class="vaso-gauge-rows">
        <div class="vaso-gauge-row">
          <div class="vaso-gauge-meta"><span>SVR</span><strong>${esc(tr(scenVis.svr.label))}</strong></div>
          <div class="vaso-bar-track"><div class="vaso-bar-fill" style="width:${scenVis.svr.val}%;background:#2f6f55"></div></div>
        </div>
        <div class="vaso-gauge-row">
          <div class="vaso-gauge-meta"><span>CO / CI</span><strong>${esc(tr(scenVis.co.label))}</strong></div>
          <div class="vaso-bar-track"><div class="vaso-bar-fill" style="width:${scenVis.co.val}%;background:#c05621"></div></div>
        </div>
        <div class="vaso-gauge-row">
          <div class="vaso-gauge-meta"><span>CVP / PCWP</span><strong>${esc(tr(scenVis.preload.label))}</strong></div>
          <div class="vaso-bar-track"><div class="vaso-bar-fill" style="width:${scenVis.preload.val}%;background:#2b6cb0"></div></div>
        </div>
      </div>
    `;

    text('.vaso-monitor h3', tr(T('Yanıtı tekrar değerlendir', 'Reassess response')));
    const monitors = [
      T('Basınç + perfüzyon', 'Pressure + perfusion'),
      T('İdrar eğilimi; yaklaşık ≥0,5 ml/kg/saat sık kullanılan izlem eşiği, tek hedef değil', 'Urine trend; ≥0.5 ml/kg/h is a common monitoring threshold, not sole target'),
      T('Laktat eğilimi + kapiller dolum + mental durum', 'Lactate trend + capillary refill + mentation'),
      T('EKG/aritmi, iskemi, periferik damar yolu', 'ECG/arrhythmia, ischemia, peripheral access'),
      T('POCUS/LV–RV, volüm, elektrolitler; stabil oldukça desteği azalt', 'POCUS/LV–RV, volume, electrolytes; reduce support as stable')
    ];
    $('.vaso-monitor > div').replaceChildren(...monitors.map((m, i) => {
      const p = document.createElement('p');
      p.textContent = `0${i + 1} · ${tr(m)}`;
      return p;
    }));

    text('.vaso-corrections summary', tr(T('Referans görselde yapılan düzeltmeler', 'Corrections to supplied image')));
    const corrections = [
      T('Anjiyotensin II: görseldeki 0,01–0,08 aralık/birim eşleşmesi ürün bilgisine uymuyor; GIAPREZA başlangıcı 20 ng/kg/dk.', 'Angiotensin II: image’s 0.01–0.08 range/unit pairing does not match labeling; GIAPREZA starts at 20 ng/kg/min.'),
      T('Her şokta rutin sıvı veya iki ilaç yok. Konjesyon, sıvı yanıtı ve temel neden önce değerlendirilir.', 'Neither routine fluids nor two drugs apply to every shock. Assess congestion, fluid response and underlying cause.'),
      T('Fenilefrin taşiaritmi için otomatik çözüm değil. Levosimendan septik şokta önerilmez; dopamin renal koruma için kullanılmaz.', 'Phenylephrine is not an automatic tachyarrhythmia solution. Levosimendan is discouraged in septic shock; dopamine is not used for renal protection.'),
      T('Aralıklar ürün ve bağlama göre değişir; görseldeki tüm aralıklar evrensel protokol olarak aktarılmadı. SSC 2026 yaşa bağlı MAP hedefi eklendi.', 'Ranges vary by product and context; image ranges were not copied as universal protocols. SSC 2026 age-specific MAP target added.')
    ];
    $('.vaso-corrections ul').innerHTML = corrections.map(x => `<li>${esc(tr(x))}</li>`).join('');
    text('.vaso-sources summary', tr(T('Kaynaklar · kontrol: 4 Ekim 2026', 'Sources · checked 4 October 2026')));
  }

  refresh();
  return { refresh };
}

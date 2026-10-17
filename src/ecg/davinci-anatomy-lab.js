// Da Vinci Anatomy Corner: 12-Lead Electrocardiographic Anatomy Interactive Studio
// Based on Bradfield EP, Rimmer M, Miyazaki Y, Hanna P, Hayase JH, Do DH, Xu S, Yamagami S, Shivkumar K, Mori S.
// "12-Lead Electrocardiographic Anatomy." JACC: Case Reports / Da Vinci Anatomy Corner, 2025.
// UCLA Wallace A. McAlpine & Amara-Yad Project Collections.

import './davinci-anatomy-lab.css';

const NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}, text = '') {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) el.setAttribute(k, String(v));
  }
  if (text) el.textContent = text;
  return el;
}

export function createDaVinciAnatomyLab({ mount, getLang = () => 'tr', state = {} }) {
  const st = Object.assign({
    tab: 'cabrera', // 'cabrera' | 'heights' | 'nomenclature' | 'atrial' | 'icns'
    cabreraMode: 'cabrera', // 'cabrera' | 'standard'
    cabreraScenario: 'rvot_shift', // 'rvot_shift' | 'sinus_p' | 'mi_contiguous'
    rvotFocus: 0.5, // 0: posterolateral free wall -> 1: medial free wall
    heightPlane: 'superior', // 'superior' (V1-V2) | 'middle' (V3) | 'inferior' (V4-V6)
    nomenclatureTopic: 'fascicles', // 'fascicles' | 'papillary' | 'bundles'
    pvSite: 'RSPV', // 'RSPV' | 'RIPV' | 'LSPV' | 'LIPV' | 'RAA' | 'LAA'
    icnsSgp: 'all', // 'all' | 'vrasgp' | 'vlasgp' | 'ldsgp' | 'mdsgp' | 'drasgp' | 'rcsgp' | 'lcsgp'
    cnaTarget: 'sa_node' // 'sa_node' | 'av_node' | 'marshall'
  }, state);

  const root = document.createElement('section');
  root.className = 'davinci-lab';

  const tr = (trText, enText) => getLang() === 'en' ? enText : trText;

  function render() {
    root.replaceChildren();
    const lang = getLang();
    const isTr = lang === 'tr';

    // Top Header
    const header = document.createElement('header');
    header.className = 'davinci-header';
    header.innerHTML = `
      <div class="davinci-badge-row">
        <span class="davinci-badge">JACC 2025 · DA VINCI KÖŞESİ</span>
        <span class="davinci-ref-tag">UCLA McAlpine & Amara-Yad Koleksiyonu</span>
      </div>
      <h3 class="davinci-title">${tr('12 Derivasyonlu EKG Anatomisi ve 3 Boyutlu Uzaysal İlişkiler', '12-Lead Electrocardiographic Anatomy & 3D Spatial Relations')}</h3>
      <p class="davinci-subtitle">
        ${tr(
          'Bradfield, Shivkumar ve Mori (2025) tarafından tanımlanan uzaysal EKG ilkeleri: Cabrera panoramik sıralaması, prekordiyal elektrotların dikey düzlem farkları, Valentine yanılgısına karşı gerçek anatomik isimlendirme ve atriyal kitle bağlamı.',
          'Spatial ECG principles by Bradfield, Shivkumar, and Mori (2025): Cabrera sequence/panoramic format, precordial height differences across vertical planes, attitudinally appropriate vs Valentine nomenclature, and atrial mass context.'
        )}
      </p>
    `;

    // Sub-Navigation Tabs
    const subNav = document.createElement('nav');
    subNav.className = 'davinci-nav';
    subNav.setAttribute('role', 'tablist');

    const tabs = [
      { id: 'cabrera', title: tr('1. Cabrera Panoramik Sıralama', '1. Cabrera Panoramic Sequence'), fig: 'Fig 2, 10, 11' },
      { id: 'heights', title: tr('2. Prekordiyal 3D Yükseklik Seviyeleri', '2. Precordial 3D Height Differences'), fig: 'Fig 3, 4, 5, 6' },
      { id: 'nomenclature', title: tr('3. Anatomik İsimlendirme vs Valentine', '3. Anatomical vs Valentine Terms'), fig: 'Fig 7, 8' },
      { id: 'atrial', title: tr('4. Atriyal Kitle & PV Pacemap', '4. Atrial Mass & PV Pacemaps'), fig: 'Fig 9' },
      { id: 'icns', title: tr('5. İntrinsik Otonom Sistem (ICNS · Da Vinci #2)', '5. Intrinsic Autonomic System (ICNS · Da Vinci #2)'), fig: 'Aksu 2021' }
    ];

    tabs.forEach(t => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `davinci-nav-btn ${st.tab === t.id ? 'active' : ''}`;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(st.tab === t.id));
      btn.innerHTML = `<span class="nav-ch">${t.fig}</span><span class="nav-label">${t.title}</span>`;
      btn.addEventListener('click', () => {
        st.tab = t.id;
        render();
      });
      subNav.append(btn);
    });

    root.append(header, subNav);

    // Dynamic Body Area
    const contentArea = document.createElement('div');
    contentArea.className = 'davinci-content';

    if (st.tab === 'cabrera') renderCabreraTab(contentArea, isTr);
    else if (st.tab === 'heights') renderHeightsTab(contentArea, isTr);
    else if (st.tab === 'nomenclature') renderNomenclatureTab(contentArea, isTr);
    else if (st.tab === 'atrial') renderAtrialTab(contentArea, isTr);
    else if (st.tab === 'icns') renderIcnsTab(contentArea, isTr);

    root.append(contentArea);
  }

  // --- SUB-MODULE 1: CABRERA SEQUENCE & PANORAMIC DISPLAY ---
  function renderCabreraTab(container, isTr) {
    const card = document.createElement('div');
    card.className = 'davinci-card';

    card.innerHTML = `
      <div class="davinci-card-head">
        <div>
          <h4>${isTr ? 'Cabrera Sıralaması (Panoramik Gösterim) ve Korrelatif Değişiklikler' : 'Cabrera Sequence (Panoramic Display) & Correlative Limb Changes'}</h4>
          <p class="davinci-card-desc">
            ${isTr
              ? 'Geleneksel ekstremite dizilimi (I, II, III, aVR, aVL, aVF) anatomik olarak kopuktur. aVR derivasyonu ters çevrilerek (−aVR) sol üstten (+−30°) sağ alta (+120°) 30° aralıklarla kesintisiz bir anatomik açı zinciri kurulur (aVL → I → −aVR → II → aVF → III). Ekstremite derivasyonlarındaki değişimler tek tek değil, bu ortak korrelatif kuralla okunmalıdır.'
              : 'Conventional limb lead ordering (I, II, III, aVR, aVL, aVF) is anatomically fragmented. By vertically flipping aVR into −aVR (+30°), a contiguous 30° panoramic display is formed (aVL → I → −aVR → II → aVF → III). Limb lead changes must not be read individually, but via this correlative anatomical rule.'}
          </p>
        </div>
        <div class="davinci-toggle-row">
          <button type="button" class="davinci-chip-btn ${st.cabreraMode === 'cabrera' ? 'active' : ''}" data-cab-mode="cabrera">
            ${isTr ? '✓ Cabrera Panoramik' : '✓ Cabrera Panoramic'}
          </button>
          <button type="button" class="davinci-chip-btn ${st.cabreraMode === 'standard' ? 'active' : ''}" data-cab-mode="standard">
            ${isTr ? 'Geleneksel Standart' : 'Conventional Standard'}
          </button>
        </div>
      </div>

      <div class="davinci-scenario-bar">
        <span class="davinci-bar-label">${isTr ? 'Klinik Senaryo Seçimi:' : 'Clinical Scenario:'}</span>
        <button type="button" class="davinci-action-btn ${st.cabreraScenario === 'rvot_shift' ? 'active' : ''}" data-scenario="rvot_shift">
          ${isTr ? 'RVOT PVC Odak Kayması (Fig 2)' : 'RVOT PVC Focus Shift (Fig 2)'}
        </button>
        <button type="button" class="davinci-action-btn ${st.cabreraScenario === 'sinus_p' ? 'active' : ''}" data-scenario="sinus_p">
          ${isTr ? 'Normal Sinüs P Vektörü (Fig 11C)' : 'Normal Sinus P Vector (Fig 11C)'}
        </button>
        <button type="button" class="davinci-action-btn ${st.cabreraScenario === 'mi_contiguous' ? 'active' : ''}" data-scenario="mi_contiguous">
          ${isTr ? 'STEMI Komşu Derivasyon Dağılımı (Fig 11D)' : 'STEMI Contiguous Distribution (Fig 11D)'}
        </button>
      </div>

      <div class="davinci-interactive-area" id="cabrera-stage"></div>
    `;

    container.append(card);

    // Event listeners
    card.querySelectorAll('[data-cab-mode]').forEach(b => {
      b.addEventListener('click', () => {
        st.cabreraMode = b.dataset.cabMode;
        renderCabreraTab(container, isTr);
      });
    });

    card.querySelectorAll('[data-scenario]').forEach(b => {
      b.addEventListener('click', () => {
        st.cabreraScenario = b.dataset.scenario;
        renderCabreraTab(container, isTr);
      });
    });

    const stage = card.querySelector('#cabrera-stage');
    renderCabreraStage(stage, isTr);
  }

  function renderCabreraStage(stage, isTr) {
    stage.replaceChildren();

    // Cabrera order vs standard order
    const cabreraLeads = [
      { id: 'aVL', angle: -30, label: 'aVL', deg: '−30°', color: '#38bdf8', region: isTr ? 'Yüksek Lateral' : 'High Lateral' },
      { id: 'I', angle: 0, label: 'I', deg: '0°', color: '#60a5fa', region: isTr ? 'Sol Lateral' : 'Left Lateral' },
      { id: '-aVR', angle: 30, label: '−aVR', deg: '+30°', color: '#34d399', region: isTr ? 'Ters aVR' : 'Inverted aVR' },
      { id: 'II', angle: 60, label: 'II', deg: '+60°', color: '#f59e0b', region: isTr ? 'Sol Alt / Apeks' : 'Inferior-Left' },
      { id: 'aVF', angle: 90, label: 'aVF', deg: '+90°', color: '#f97316', region: isTr ? 'İnferior / Diyafragmatik' : 'Inferior' },
      { id: 'III', angle: 120, label: 'III', deg: '+120°', color: '#ef4444', region: isTr ? 'Sağ Alt' : 'Inferior-Right' }
    ];

    const standardLeads = [
      { id: 'I', angle: 0, label: 'I', deg: '0°', color: '#60a5fa', region: isTr ? 'Sol Lateral' : 'Left Lateral' },
      { id: 'II', angle: 60, label: 'II', deg: '+60°', color: '#f59e0b', region: isTr ? 'Sol Alt / Apeks' : 'Inferior-Left' },
      { id: 'III', angle: 120, label: 'III', deg: '+120°', color: '#ef4444', region: isTr ? 'Sağ Alt' : 'Inferior-Right' },
      { id: 'aVR', angle: -150, label: 'aVR', deg: '−150°', color: '#2dd4bf', region: isTr ? 'Sağ Omuz' : 'Right Shoulder' },
      { id: 'aVL', angle: -30, label: 'aVL', deg: '−30°', color: '#38bdf8', region: isTr ? 'Yüksek Lateral' : 'High Lateral' },
      { id: 'aVF', angle: 90, label: 'aVF', deg: '+90°', color: '#f97316', region: isTr ? 'İnferior' : 'Inferior' }
    ];

    const leads = st.cabreraMode === 'cabrera' ? cabreraLeads : standardLeads;

    // Controls for scenarios
    const controlWrap = document.createElement('div');
    controlWrap.className = 'davinci-scenario-controls';

    if (st.cabreraScenario === 'rvot_shift') {
      controlWrap.innerHTML = `
        <label class="davinci-slider-label">
          <span>${isTr ? 'RVOT Aritmi Odağı Konumu (Sağ → Sol Kayma):' : 'RVOT Arrhythmia Focus (Right → Left Shift):'}</span>
          <strong id="rvot-pos-text">${st.rvotFocus < 0.35 ? (isTr ? 'Posterolateral Serbest Duvar (Sarı Yıldız)' : 'Posterolateral Free Wall (Yellow Star)') : st.rvotFocus > 0.65 ? (isTr ? 'Mediyal Serbest Duvar (Kırmızı Yıldız)' : 'Medial Free Wall (Red Star)') : (isTr ? 'Orta Serbest Duvar' : 'Mid Free Wall')}</strong>
          <input type="range" min="0" max="1" step="0.05" value="${st.rvotFocus}" id="rvot-focus-slider" />
        </label>
      `;
    }

    stage.append(controlWrap);

    // Strips grid
    const stripsGrid = document.createElement('div');
    stripsGrid.className = 'davinci-strips-grid';

    // Lead calculations based on scenario
    function computeLeadValues() {
      // RVOT focus angle shifts from ~ +95° (posterolateral) to +65° (medial)
      const vectorAngle = st.cabreraScenario === 'rvot_shift'
        ? 95 - st.rvotFocus * 30
        : st.cabreraScenario === 'sinus_p'
        ? 58
        : 65; // MI

      return leads.map(l => {
        const rad = ((vectorAngle - l.angle) * Math.PI) / 180;
        let amp = Math.cos(rad);
        if (l.id === 'aVR') amp = -Math.cos(((vectorAngle - 30) * Math.PI) / 180);
        return { ...l, amp, vectorAngle };
      });
    }

    function renderStrips() {
      stripsGrid.replaceChildren();
      const calculated = computeLeadValues();

      calculated.forEach(l => {
        const stripBox = document.createElement('div');
        stripBox.className = 'davinci-strip-card';
        stripBox.style.setProperty('--lead-theme', l.color);

        const isTransition = Math.abs(l.amp) < 0.25;
        const isMax = Math.abs(l.amp) > 0.88;

        stripBox.innerHTML = `
          <div class="davinci-strip-head">
            <span class="lead-pill" style="background:${l.color}22;color:${l.color};border:1px solid ${l.color}55;">${l.label}</span>
            <span class="lead-deg">${l.deg}</span>
            <span class="lead-region">${l.region}</span>
            <span class="lead-metric ${l.amp >= 0 ? 'pos' : 'neg'}">${l.amp >= 0 ? '+' : ''}${l.amp.toFixed(2)}</span>
          </div>
          <div class="davinci-strip-canvas-wrap">
            <svg viewBox="0 0 160 80" class="davinci-strip-svg">
              <rect x="0" y="0" width="160" height="80" fill="#fdf4f2" />
              <!-- Grid lines -->
              <line x1="0" y1="40" x2="160" y2="40" stroke="#f0b9af" stroke-width="0.8" />
              <line x1="0" y1="20" x2="160" y2="20" stroke="#fcdad3" stroke-width="0.5" />
              <line x1="0" y1="60" x2="160" y2="60" stroke="#fcdad3" stroke-width="0.5" />
              <!-- Waveform -->
              <path d="${generateWavePath(l.id, l.amp, st.cabreraScenario)}" fill="none" stroke="${l.color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              ${isTransition ? `<text x="80" y="74" text-anchor="middle" font-size="9" font-weight="700" fill="#7c3aed">${isTr ? 'Geçiş (R/S≈1)' : 'Transition (R/S≈1)'}</text>` : ''}
              ${isMax ? `<text x="80" y="74" text-anchor="middle" font-size="9" font-weight="700" fill="#15803d">${isTr ? 'En Yüksek R' : 'Tallest R'}</text>` : ''}
            </svg>
          </div>
        `;
        stripsGrid.append(stripBox);
      });
    }

    renderStrips();
    stage.append(stripsGrid);

    // Callout / Clinical Explanation Box
    const callout = document.createElement('div');
    callout.className = 'davinci-callout';

    if (st.cabreraScenario === 'rvot_shift') {
      callout.innerHTML = `
        <strong>${isTr ? 'Anatomik Korrelasyon Kuralı (Bradfield & Mori, Fig 2 & 10):' : 'Anatomical Correlative Rule (Bradfield & Mori, Fig 2 & 10):'}</strong>
        <p>
          ${isTr
            ? 'Aritmi odağı RVOT serbest duvarında posterolateralden mediyale kaydığında yayılım vektörü saat yönünde döner. Bu durum Cabrera panoramik sıralamasında sıralı olarak izlenir: <strong>I derivasyonunda Q genliği artar, II\'de R azalır, III\'te R artar, aVR\'de Q azalır, aVL\'de Q artar</strong>. Geleneksel sıralamada bu geçişler darmadağınıkken, Cabrera sıralamasında geçiş bölgesi (R/S = 1.0) vektöre tam dik doğrultuyu doğrudan gösterir.'
            : 'As the arrhythmia focus shifts right-to-left from posterolateral to medial RVOT free wall, the propagation vector rotates clockwise. In Cabrera sequence, this manifests consecutively: <strong>Q-wave in lead I increases, R in II decreases, R in III increases, Q in aVR decreases, Q in aVL increases</strong>. Cabrera sequence makes the perpendicular transition zone (R/S = 1.0) immediately obvious.'}
        </p>
      `;
    } else if (st.cabreraScenario === 'sinus_p') {
      callout.innerHTML = `
        <strong>${isTr ? 'Sinüs P Dalgası Panoramik Yayılımı (Fig 11C):' : 'Normal Sinus P-Wave Panoramic Vector (Fig 11C):'}</strong>
        <p>
          ${isTr
            ? 'Sinüs düğümü sağ atriyum çatısında kava-atriyal bileşkede yer alır. Depolarizasyon aşağı ve sola doğru (+54° ile +60°) yayılır. Cabrera sıralamasında Derivasyon II (+60°) bu vektörle tam paralel olduğundan en dik ve pozitif P dalgasını yazdırır. aVL (−30°) bu aksa dik olduğundan izoelektrik veya bifaziktir.'
            : 'The SA node lies at the superior cava-atrial junction; activation spreads inferiorly and leftward (+54° to +60°). In Cabrera format, Lead II (+60°) aligns directly with this vector, recording the tallest upright P-wave, while aVL (−30°) is nearly perpendicular, appearing equiphasic or flat.'}
        </p>
      `;
    } else {
      callout.innerHTML = `
        <strong>${isTr ? 'STEMI İskemi Dağılımı ve Komşu Derivasyonlar (Fig 11D):' : 'STEMI Ischemic Distribution & Contiguous Leads (Fig 11D):'}</strong>
        <p>
          ${isTr
            ? 'Cabrera panoramik dizilimi, koroner anatomiyi doğrudan yansıtır: Sol lateral duvar (aVL, I) LCx/LAD dağılımını; inferior duvar (II, aVF, III) ise RCA/LCx dağılımını gösterir. aVR\'nin −aVR olarak entegre edilmesi lateral ve inferior kutuplar arasında kesintisiz bir anatomik geçiş oluşturur.'
            : 'Cabrera format directly reflects coronary arterial anatomy: Lateral leads (aVL, I) represent LCx/diagonal territories, whereas contiguous inferior leads (II, aVF, III) map RCA/LCx territories without jumping across unrelated channels.'}
        </p>
      `;
    }

    stage.append(callout);

    // Bind slider
    const slider = stage.querySelector('#rvot-focus-slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        st.rvotFocus = Number(e.target.value);
        const text = stage.querySelector('#rvot-pos-text');
        if (text) {
          text.textContent = st.rvotFocus < 0.35
            ? (isTr ? 'Posterolateral Serbest Duvar (Sarı Yıldız)' : 'Posterolateral Free Wall (Yellow Star)')
            : st.rvotFocus > 0.65
            ? (isTr ? 'Mediyal Serbest Duvar (Kırmızı Yıldız)' : 'Medial Free Wall (Red Star)')
            : (isTr ? 'Orta Serbest Duvar' : 'Mid Free Wall');
        }
        renderStrips();
      });
    }
  }

  // --- SUB-MODULE 2: PRECORDIAL 3D HEIGHT DIFFERENCES ---
  function renderHeightsTab(container, isTr) {
    const card = document.createElement('div');
    card.className = 'davinci-card';

    card.innerHTML = `
      <div class="davinci-card-head">
        <div>
          <h4>${isTr ? 'Prekordiyal Derivasyonların 3 Boyutlu Yükseklik Seviyeleri (V1–V6 Düzlem Farkı)' : 'Precordial Lead 3D Height Differences (Non-Planar Geometry)'}</h4>
          <p class="davinci-card-desc">
            ${isTr
              ? 'Tıbbi literatürde prekordiyal derivasyonlar sıklıkla tek bir yatay düzlemde gösterilir (Fig 3). Oysa V1–V6 tek bir düzlemde DEĞİLDİR! V1/V2 göğüs kafesinde üst seviyede (4. İKB), V3 orta seviyede ve V4–V6 alt seviyede (5. İKB) yer alır. Kalp tabanından apekse olan bu dikey seviye farkı, EKG dalga morfolojilerini belirleyen temel anatomik gerçektir.'
              : 'Literature frequently depicts precordial leads on a single horizontal plane (Fig 3). In reality, V1-V6 do NOT lie on a flat plane! V1/V2 occupy a superior level (4th ICS), V3 a middle level, and V4-V6 an inferior level (5th ICS). Recognizing this vertical level difference is essential to explain clinical precordial waveforms.'}
          </p>
        </div>
      </div>

      <div class="davinci-plane-selector">
        <button type="button" class="davinci-plane-btn ${st.heightPlane === 'superior' ? 'active' : ''}" data-plane="superior">
          <span class="plane-tag">${isTr ? 'ÜST DÜZLEM' : 'SUPERIOR PLANE'}</span>
          <strong>V1 & V2</strong>
          <small>${isTr ? 'RVOT, LV Summit, RCS, Krista' : 'RVOT, LV Summit, RCS, Crest'}</small>
        </button>
        <button type="button" class="davinci-plane-btn ${st.heightPlane === 'middle' ? 'active' : ''}" data-plane="middle">
          <span class="plane-tag">${isTr ? 'ORTA DÜZLEM' : 'MIDDLE PLANE'}</span>
          <strong>V3</strong>
          <small>${isTr ? 'Anterior İnterventriküler Oluk' : 'Anterior Interventricular Groove'}</small>
        </button>
        <button type="button" class="davinci-plane-btn ${st.heightPlane === 'inferior' ? 'active' : ''}" data-plane="inferior">
          <span class="plane-tag">${isTr ? 'ALT DÜZLEM' : 'INFERIOR PLANE'}</span>
          <strong>V4, V5 & V6</strong>
          <small>${isTr ? 'Apeks, İnferoseptal Çıkıntı, Papiller Kas' : 'Apex, Inferoseptal Process, Pap M'}</small>
        </button>
      </div>

      <div class="davinci-grid-2col" style="margin-top:16px;">
        <div class="davinci-subcard">
          <h5>${isTr ? '3D Toraks ve Kalp Düzlem Kesiti' : '3D Thoracic & Cardiac Plane Section'}</h5>
          <div class="davinci-svg-wrap">
            <svg viewBox="0 0 460 320" class="davinci-plane-svg" id="plane-svg"></svg>
          </div>
        </div>

        <div class="davinci-subcard" id="plane-details-card"></div>
      </div>
    `;

    container.append(card);

    card.querySelectorAll('[data-plane]').forEach(b => {
      b.addEventListener('click', () => {
        st.heightPlane = b.dataset.plane;
        renderHeightsTab(container, isTr);
      });
    });

    renderPlaneGraphic(card.querySelector('#plane-svg'), isTr);
    renderPlaneDetails(card.querySelector('#plane-details-card'), isTr);
  }

  function renderPlaneGraphic(svg, isTr) {
    svg.replaceChildren();

    // Background thorax outline in 3D-ish perspective
    svg.append(
      svgEl('rect', { x: 0, y: 0, width: 460, height: 320, rx: 10, fill: '#0b1623' }),
      svgEl('path', { d: 'M70 30 C150 15, 310 15, 390 30 C430 110, 430 220, 390 290 C310 305, 150 305, 70 290 C30 220, 30 110, 70 30 Z', fill: '#132337', stroke: '#2e4966', 'stroke-width': 1.6 })
    );

    // Cut planes indicated with semi-transparent trapezoids
    const planes = [
      { id: 'superior', y: 75, label: isTr ? 'Üst Düzlem (V1-V2: 4. İKB)' : 'Superior Plane (V1-V2: 4th ICS)', color: '#38bdf8' },
      { id: 'middle', y: 145, label: isTr ? 'Orta Düzlem (V3)' : 'Middle Plane (V3)', color: '#a78bfa' },
      { id: 'inferior', y: 215, label: isTr ? 'Alt Düzlem (V4-V6: 5. İKB)' : 'Inferior Plane (V4-V6: 5th ICS)', color: '#f59e0b' }
    ];

    planes.forEach(p => {
      const active = st.heightPlane === p.id;
      const g = svgEl('g', { class: `plane-group ${active ? 'is-active' : ''}` });

      // Translucent slice
      g.append(
        svgEl('polygon', {
          points: `55,${p.y - 12} 405,${p.y - 12} 375,${p.y + 22} 85,${p.y + 22}`,
          fill: active ? `${p.color}28` : 'rgba(30, 41, 59, 0.4)',
          stroke: active ? p.color : '#334155',
          'stroke-width': active ? 2 : 1,
          'stroke-dasharray': active ? 'none' : '4 3'
        }),
        svgEl('text', { x: 95, y: p.y + 14, fill: active ? '#ffffff' : '#64748b', 'font-size': '11', 'font-weight': active ? '700' : '500' }, p.label)
      );
      svg.append(g);
    });

    // Anatomical Heart in center
    const heartG = svgEl('g', { id: 'heart-structures' });
    heartG.append(
      // Left ventricle mass
      svgEl('ellipse', { cx: 240, cy: 165, rx: 75, ry: 90, fill: '#6b2d42', stroke: '#9b4763', 'stroke-width': 2 }),
      // Right ventricle anterior
      svgEl('path', { d: 'M180 120 C190 70, 240 75, 270 115 C265 170, 210 200, 180 160 Z', fill: '#4a2432', stroke: '#7d384f', 'stroke-width': 1.8 }),
      // Aortic root & RCS
      svgEl('circle', { cx: 235, cy: 95, r: 19, fill: '#78350f', stroke: '#f59e0b', 'stroke-width': 1.8 }),
      svgEl('text', { x: 235, y: 99, 'text-anchor': 'middle', fill: '#fef08a', 'font-size': '10', 'font-weight': '700' }, 'Ao / R')
    );

    // Highlighting current structures based on selected plane
    if (st.heightPlane === 'superior') {
      heartG.append(
        // V1 & V2 electrodes
        svgEl('circle', { cx: 165, cy: 68, r: 10, fill: '#38bdf8', stroke: '#ffffff', 'stroke-width': 2 }),
        svgEl('text', { x: 165, y: 72, 'text-anchor': 'middle', fill: '#0f172a', 'font-size': '9', 'font-weight': '800' }, 'V1'),
        svgEl('circle', { cx: 205, cy: 70, r: 10, fill: '#38bdf8', stroke: '#ffffff', 'stroke-width': 2 }),
        svgEl('text', { x: 205, y: 74, 'text-anchor': 'middle', fill: '#0f172a', 'font-size': '9', 'font-weight': '800' }, 'V2'),
        // LV summit star
        svgEl('path', { d: 'M250 82 L254 90 L263 92 L256 97 L258 106 L250 101 L242 106 L244 97 L237 92 L246 90 Z', fill: '#22c55e', stroke: '#ffffff', 'stroke-width': 1 }),
        svgEl('text', { x: 275, y: 92, fill: '#4ade80', 'font-size': '10', 'font-weight': '700' }, isTr ? 'LV Summit / RVOT' : 'LV Summit / RVOT')
      );
    } else if (st.heightPlane === 'middle') {
      heartG.append(
        // V3 electrode
        svgEl('circle', { cx: 200, cy: 142, r: 10, fill: '#a78bfa', stroke: '#ffffff', 'stroke-width': 2 }),
        svgEl('text', { x: 200, y: 146, 'text-anchor': 'middle', fill: '#0f172a', 'font-size': '9', 'font-weight': '800' }, 'V3'),
        svgEl('line', { x1: 195, y1: 115, x2: 245, y2: 220, stroke: '#c084fc', 'stroke-width': 2, 'stroke-dasharray': '4 3' }),
        svgEl('text', { x: 260, y: 155, fill: '#c084fc', 'font-size': '10', 'font-weight': '700' }, isTr ? 'Ant. İnterventriküler Oluk' : 'Ant. IV Groove')
      );
    } else {
      heartG.append(
        // V4, V5, V6
        svgEl('circle', { cx: 220, cy: 212, r: 10, fill: '#f59e0b', stroke: '#ffffff', 'stroke-width': 2 }),
        svgEl('text', { x: 220, y: 216, 'text-anchor': 'middle', fill: '#0f172a', 'font-size': '9', 'font-weight': '800' }, 'V4'),
        svgEl('circle', { cx: 295, cy: 214, r: 10, fill: '#f59e0b', stroke: '#ffffff', 'stroke-width': 2 }),
        svgEl('text', { x: 295, y: 218, 'text-anchor': 'middle', fill: '#0f172a', 'font-size': '9', 'font-weight': '800' }, 'V5'),
        svgEl('circle', { cx: 355, cy: 216, r: 10, fill: '#f59e0b', stroke: '#ffffff', 'stroke-width': 2 }),
        svgEl('text', { x: 355, y: 220, 'text-anchor': 'middle', fill: '#0f172a', 'font-size': '9', 'font-weight': '800' }, 'V6'),
        // Inferoseptal process & inferomedial Pap M
        svgEl('circle', { cx: 235, cy: 225, r: 6, fill: '#38bdf8', stroke: '#ffffff', 'stroke-width': 1.5 }),
        svgEl('text', { x: 250, y: 242, fill: '#7dd3fc', 'font-size': '10', 'font-weight': '700' }, isTr ? 'İnferoseptal Çıkıntı / Pap Kas' : 'Inferoseptal Process / Pap M'),
        // Left lung intervening buffer
        svgEl('path', { d: 'M305 170 C345 180, 365 240, 340 270 C320 260, 290 220, 305 170 Z', fill: 'rgba(56, 189, 248, 0.12)', stroke: '#38bdf8', 'stroke-width': 1, 'stroke-dasharray': '3 3' }),
        svgEl('text', { x: 335, y: 190, fill: '#94a3b8', 'font-size': '9' }, isTr ? 'Sol Akciğer Engeli' : 'Left Lung')
      );
    }

    svg.append(heartG);
  }

  function renderPlaneDetails(card, isTr) {
    if (st.heightPlane === 'superior') {
      card.innerHTML = `
        <span class="davinci-badge-green">${isTr ? 'Üst Düzlem Morfolojisi (Fig 4A & 5)' : 'Superior Plane Morphology (Fig 4A & 5)'}</span>
        <h5 style="margin:8px 0 4px;font-size:15px;color:#f8fafc;">${isTr ? 'V1 & V2: LV Summit ve RVOT' : 'V1 & V2: LV Summit & RVOT'}</h5>
        <p style="font-size:12.5px;line-height:1.55;color:#cbd5e1;margin:0 0 10px;">
          ${isTr
            ? 'V1 ve V2 göğüs kafesinde 4. kaburgalar arası aralıkta, ventriküler kitlenin en üst seviyesindedir. RVOT, LVOT ve aort kökünün hemen önündedir. LV summit (apeks yönünde aşağı uzanan) ve septum kretinden kaynaklanan ventriküler aritmiler bu elektrotların tam altında başlayıp aşağıya doğru ilerler.'
            : 'V1 and V2 are positioned at the 4th intercostal space, aligning with the superior level of the ventricular mass anterior to the RVOT, LVOT, and aortic root. Arrhythmias originating from the LV summit or septal crest propagate downward away from these superior electrodes.'}
        </p>
        <div class="davinci-metric-box">
          <strong>${isTr ? 'EKG Sonucu:' : 'ECG Result:'}</strong>
          <span>${isTr ? 'Derin S Dalgası (V1–V2 negatifliği) ve İnferior Aks (+90° civarı)' : 'Deep S-Wave (V1–V2 negativity) with Inferior Axis'}</span>
        </div>
      `;
    } else if (st.heightPlane === 'middle') {
      card.innerHTML = `
        <span class="davinci-badge-green">${isTr ? 'Orta Düzlem Morfolojisi (Fig 4B)' : 'Middle Plane Morphology (Fig 4B)'}</span>
        <h5 style="margin:8px 0 4px;font-size:15px;color:#f8fafc;">${isTr ? 'V3: Anterior İnterventriküler Oluk' : 'V3: Anterior IV Groove'}</h5>
        <p style="font-size:12.5px;line-height:1.55;color:#cbd5e1;margin:0 0 10px;">
          ${isTr
            ? 'V3 dikey olarak V2 ile V4 arasında geçiş seviyesindedir. Anterior interventriküler oluk üzerinde yer alır. Normal kalplerde QRS geçiş bölgesi (R/S = 1.0) bu seviyede oluşur. V3 geçişi erken (V2) veya geç (V4-V5) olduğunda elektriksel veya anatomik rotasyon göstergesidir.'
            : 'V3 occupies an intermediate vertical height between V2 and V4 along the anterior interventricular groove. The normal QRS transition zone (R/S = 1.0) typically coincides with this plane.'}
        </p>
        <div class="davinci-metric-box">
          <strong>${isTr ? 'EKG Sonucu:' : 'ECG Result:'}</strong>
          <span>${isTr ? 'Bifazik RS Dalgası · R/S Geçiş Seviyesi' : 'Equiphasic RS Wave · Normal Transition Level'}</span>
        </div>
      `;
    } else {
      card.innerHTML = `
        <span class="davinci-badge-green">${isTr ? 'Alt Düzlem Morfolojisi (Fig 4B, 5 & 8C)' : 'Inferior Plane Morphology (Fig 4B, 5 & 8C)'}</span>
        <h5 style="margin:8px 0 4px;font-size:15px;color:#f8fafc;">${isTr ? 'V4–V6: Apeks, İnferoseptal Çıkıntı & İnferomediyal Papiller Kas' : 'V4–V6: Apex, Inferoseptal Process & Inferomedial Pap M'}</h5>
        <p style="font-size:12.5px;line-height:1.55;color:#cbd5e1;margin:0 0 10px;">
          ${isTr
            ? 'V4–V6 5. kaburgalar arası aralıkta, ventrikül kitlesinin alt (diyafragmatik) seviyesindedir. İnferomediyal papiller kas ve LV inferoseptal çıkıntısı bu alt düzlemde yer alır. Buradan kaynaklanan aritmiler yukarı doğru yayıldığı için V4–V6 derivasyonlarında Q dalgası ve süperolateral aks sapması üretir. Ayrıca sol akciğer araya girdiği için V5–V6 voltajları mesafeden etkilenir.'
            : 'V4-V6 sit at the 5th intercostal space, capturing the inferior/diaphragmatic level of the ventricular mass. The inferomedial papillary muscle and basal inferoseptal process lie on this inferior plane, generating Q-waves in V4-V6 and a superolateral axis when ectopic impulses travel upward.'}
        </p>
        <div class="davinci-metric-box">
          <strong>${isTr ? 'EKG Sonucu:' : 'ECG Result:'}</strong>
          <span>${isTr ? 'V4–V6\'da Q Dalgası Oluşumu ve Süperolateral Aks' : 'Q-Wave in V4–V6 with Superolateral Axis'}</span>
        </div>
      `;
    }
  }

  // --- SUB-MODULE 3: ATTITUDINALLY APPROPRIATE ANATOMY VS VALENTINE ---
  function renderNomenclatureTab(container, isTr) {
    const card = document.createElement('div');
    card.className = 'davinci-card';

    card.innerHTML = `
      <div class="davinci-card-head">
        <div>
          <h4>${isTr ? 'Anatomik İsimlendirme Doğruları vs "Valentine" Yanılgısı (Fig 7 & 8)' : 'Attitudinally Appropriate Anatomy vs Valentine Nomenclature (Fig 7 & 8)'}</h4>
          <p class="davinci-card-desc">
            ${isTr
              ? 'Kalbi tebrik kartlarındaki gibi apeksi aşağıda dik duran bir "Valentine" organı olarak düşünmek (sol atriyum sanki sol yandaymış, anterior fasikül öndeymiş gibi) elektrofizyolojide derin kafa karışıklıklarına yol açar. Kalp göğüs içinde oblik yatar: Sağ ventrikül ANTERIOR, Sol atriyum POSTERIOR organdır.'
              : 'Viewing the heart as a Valentine card standing on its apex creates major clinical confusion. The heart lies obliquely in the chest: Right ventricle is ANTERIOR, Left atrium is POSTERIOR.'}
          </p>
        </div>
      </div>

      <div class="davinci-nomenclature-tabs">
        <button type="button" class="davinci-chip-btn ${st.nomenclatureTopic === 'fascicles' ? 'active' : ''}" data-nom="fascicles">
          ${isTr ? '1. Sol Dal Fasikülleri (LAFB Aksı)' : '1. Left Bundle Fascicles (LAFB)'}
        </button>
        <button type="button" class="davinci-chip-btn ${st.nomenclatureTopic === 'papillary' ? 'active' : ''}" data-nom="papillary">
          ${isTr ? '2. Papiller Kaslar (VT Morfolojisi)' : '2. Papillary Muscles (VT/PVC)'}
        </button>
        <button type="button" class="davinci-chip-btn ${st.nomenclatureTopic === 'bundles' ? 'active' : ''}" data-nom="bundles">
          ${isTr ? '3. Sağ vs Sol Dal Blokları (V1 Polaritesi)' : '3. Bundle Branches (V1 Polarity)'}
        </button>
      </div>

      <div class="davinci-comparison-table-wrap" id="nom-table"></div>
    `;

    container.append(card);

    card.querySelectorAll('[data-nom]').forEach(b => {
      b.addEventListener('click', () => {
        st.nomenclatureTopic = b.dataset.nom;
        renderNomenclatureTab(container, isTr);
      });
    });

    renderNomContent(card.querySelector('#nom-table'), isTr);
  }

  function renderNomContent(container, isTr) {
    container.replaceChildren();

    if (st.nomenclatureTopic === 'fascicles') {
      container.innerHTML = `
        <div class="davinci-comp-grid">
          <div class="davinci-comp-box valentine">
            <span class="comp-badge bad">❌ ${isTr ? 'Valentine Yanılgısı' : 'Valentine Misnomer'}</span>
            <h6>${isTr ? '"Sol Anterior Fasikül"' : '"Left Anterior Fascicle"'}</h6>
            <p>${isTr ? 'Fasikülün sanki öne (anterior) doğru gittiği varsayılır. Bu durumda "Sol Anterior Fasikül Bloğu (LAFB)" olduğunda neden SÜPERİOR AKS SAPMASI (−30° ila −90°) geliştiği açıklanamaz.' : 'Assumes the fascicle runs forward anteriorly. Fails to explain why an "anterior" fascicular block causes superior-axis deviation.'}</p>
          </div>
          <div class="davinci-comp-box anatomical">
            <span class="comp-badge good">✓ ${isTr ? 'Gerçek Anatomik İsimlendirme' : 'Attitudinally Appropriate Anatomy'}</span>
            <h6>${isTr ? 'SÜPERİOR FASİKÜL (Superior Fascicle)' : 'SUPERIOR FASCICLE'}</h6>
            <p>${isTr ? 'Fasikül anteriyora değil, doğrudan SÜPERİOR (yukarı) seyreder. Bu fasikül bloke olduğunda aktivasyon önce inferior fasikülle aşağı iner, oradan yukarı/süperiora yayılır. Bu yüzden SÜPERİOR AKS SAPMASI gelişir!' : 'The fascicle runs superiorly. When blocked, activation descends via the inferior fascicle and spreads upward, producing a logical SUPERIOR-AXIS deviation!'}</p>
          </div>
        </div>
        <div class="davinci-callout" style="margin-top:12px;">
          <strong>${isTr ? 'Klinik İpucu (Bradfield & Mori Fig 8A-B):' : 'Clinical Pearl (Bradfield & Mori Fig 8A-B):'}</strong>
          <p>${isTr ? 'Sol anterior fasikül aslında SÜPERİOR fasiküldür; Sol posterior fasikül ise İNFERİOR fasiküldür. "LAFB = Süperior fasikül bloğu = Süperior aks sapması". Bu anatomik gerçek EKG mantığını kusursuzlaştırır.' : 'Left anterior fascicle is anatomically the SUPERIOR fascicle, and posterior is INFERIOR. "LAFB = Superior fascicular block = Superior-axis deviation". True anatomy makes the axis deviation intuitive.'}</p>
        </div>
      `;
    } else if (st.nomenclatureTopic === 'papillary') {
      container.innerHTML = `
        <div class="davinci-comp-grid">
          <div class="davinci-comp-box valentine">
            <span class="comp-badge bad">❌ ${isTr ? 'Valentine Yanılgısı' : 'Valentine Misnomer'}</span>
            <h6>${isTr ? '"Anterolateral ve Posteromediyal"' : '"Anterolateral & Posteromedial"'}</h6>
            <p>${isTr ? 'Papiller kasları anterolateral ve posteromediyal olarak adlandırmak, bu kaslardan kaynaklanan ventriküler taşikardi ve PVC\'lerin ekstremite ve prekordiyal akslarını öngörmeyi zorlaştırır.' : 'Naming papillary muscles anterolateral and posteromedial fails to correlate with their real ventricular activation vectors.'}</p>
          </div>
          <div class="davinci-comp-box anatomical">
            <span class="comp-badge good">✓ ${isTr ? 'Gerçek Anatomik İsimlendirme' : 'Attitudinally Appropriate Anatomy'}</span>
            <h6>${isTr ? 'SÜPEROLATERAL ve İNFEROMEDİYAL' : 'SUPEROLATERAL & INFEROMEDIAL'}</h6>
            <p>${isTr ? 'Kaslar dikey olarak süperolateral (üst düzlem) ve inferomediyal (alt düzlem) konumdadır. İnferomediyal papiller kas aritmisi süperolateral aks ve V4–V6\'da Q dalgası üretir.' : 'Muscles sit vertically as superolateral (superior plane) and inferomedial (inferior plane). An inferomedial Pap M focus yields a superolateral axis and Q waves in V4-V6.'}</p>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="davinci-comp-grid">
          <div class="davinci-comp-box valentine">
            <span class="comp-badge bad">❌ ${isTr ? 'Valentine Yanılgısı' : 'Valentine Misnomer'}</span>
            <h6>${isTr ? '"Sağ Dal ve Sol Dal (Yatay)"' : '"Right & Left Bundles (Horizontal)"'}</h6>
            <p>${isTr ? 'Dalların yan yana sağ ve sol düzlemde olduğu zannedilir. Oysa bu bakış V1 derivasyonundaki pozitif/negatif blok polaritelerini net izah edemez.' : 'Depicts bundles as strictly right vs left side-by-side, obscuring the primary anteroposterior projection.'}</p>
          </div>
          <div class="davinci-comp-box anatomical">
            <span class="comp-badge good">✓ ${isTr ? 'Gerçek Anatomik İsimlendirme' : 'Attitudinally Appropriate Anatomy'}</span>
            <h6>${isTr ? 'ANTERİOR (Sağ Dal) ve POSTERİOR (Sol Dal)' : 'ANTERIOR (Right) & POSTERIOR (Left)'}</h6>
            <p>${isTr ? 'Sağ dal interventriküler septumun ANTERİOR yüzünde, sol dal ise POSTERİOR kitleye yayılır. Sağ dal bloğu (RBBB) aktivasyonu öne yöneltip V1\'de pozitif (rsR\') yapar; Sol dal bloğu (LBBB) arkaya yöneltip V1\'de derin negatif (QS) yapar!' : 'Right bundle lies ANTERIOR on the septum; Left bundle supplies the POSTERIOR LV mass. RBBB directs activation anteriorly (tall upright R in V1); LBBB directs it posteriorly (deep QS in V1)!'}</p>
          </div>
        </div>
      `;
    }
  }

  // --- SUB-MODULE 4: ATRIAL MASS & PV PACEMAPS ---
  function renderAtrialTab(container, isTr) {
    const card = document.createElement('div');
    card.className = 'davinci-card';

    card.innerHTML = `
      <div class="davinci-card-head">
        <div>
          <h4>${isTr ? 'Atriyal Kitle Bağlamı ve Pulmoner Ven Pacemap Analizi (Fig 9)' : 'Atrial Mass Context & Pulmonary Vein Pacemaps (Fig 9)'}</h4>
          <p class="davinci-card-desc">
            ${isTr
              ? 'Pulmoner venler (PV) sol atriyumun arka çatısında (dome/roof) yer alır. Atriyal kitle bağlamında bakıldığında pulmoner ven antrumu süperior konumdadır. Bu nedenle alt pulmoner venlerden (RIPV, LIPV) yapılan uyarılar bile İNFERİOR AKS (pozitif P) gösterir. Pulmoner venlerin kitle içindeki yeri P dalgası genliğini ve süresini belirler.'
              : 'The pulmonary veins enter at the dome/roof of the left atrium, which is anatomically superior within the context of the atrial mass. Consequently, pacing even from inferior pulmonary veins (RIPV, LIPV) produces an INFERIOR P-wave axis (upright P in II/aVF).'}
          </p>
        </div>
      </div>

      <div class="davinci-pv-selector">
        ${['RSPV', 'RIPV', 'LSPV', 'LIPV', 'RAA', 'LAA'].map(site => `
          <button type="button" class="davinci-chip-btn ${st.pvSite === site ? 'active' : ''}" data-pv="${site}">
            ${site}
          </button>
        `).join('')}
      </div>

      <div class="davinci-grid-2col" style="margin-top:16px;">
        <div class="davinci-subcard">
          <h5>${isTr ? 'Atriyal Anatomi ve Uyarı Odağı' : 'Atrial Anatomy & Pacing Focus'}</h5>
          <div class="davinci-svg-wrap">
            <svg viewBox="0 0 420 280" class="davinci-pv-svg" id="pv-svg"></svg>
          </div>
        </div>

        <div class="davinci-subcard" id="pv-details-card"></div>
      </div>
    `;

    container.append(card);

    card.querySelectorAll('[data-pv]').forEach(b => {
      b.addEventListener('click', () => {
        st.pvSite = b.dataset.pv;
        renderAtrialTab(container, isTr);
      });
    });

    renderPvGraphic(card.querySelector('#pv-svg'), isTr);
    renderPvDetails(card.querySelector('#pv-details-card'), isTr);
  }

  function renderPvGraphic(svg, isTr) {
    svg.replaceChildren();

    // Background
    svg.append(svgEl('rect', { x: 0, y: 0, width: 420, height: 280, rx: 10, fill: '#0a1520' }));

    // Posterior view of Atria
    const g = svgEl('g', { id: 'atria-mesh' });
    // Left atrium body (posterior)
    g.append(
      svgEl('ellipse', { cx: 210, cy: 145, rx: 95, ry: 65, fill: '#3b2438', stroke: '#75486d', 'stroke-width': 2 }),
      svgEl('text', { x: 210, y: 150, 'text-anchor': 'middle', fill: '#d8b4e2', 'font-size': '11', 'font-weight': '700' }, isTr ? 'Sol Atriyum (LA Çatısı)' : 'Left Atrium (Roof)')
    );

    // 4 Pulmonary Vein Orifices
    const pvs = [
      { id: 'RSPV', cx: 145, cy: 110, label: 'RSPV', color: '#facc15' },
      { id: 'RIPV', cx: 145, cy: 175, label: 'RIPV', color: '#ef4444' },
      { id: 'LSPV', cx: 275, cy: 110, label: 'LSPV', color: '#ec4899' },
      { id: 'LIPV', cx: 275, cy: 175, label: 'LIPV', color: '#3b82f6' },
      { id: 'RAA', cx: 75, cy: 140, label: 'RAA', color: '#ffffff' },
      { id: 'LAA', cx: 345, cy: 135, label: 'LAA', color: '#22c55e' }
    ];

    pvs.forEach(p => {
      const isSelected = st.pvSite === p.id;
      const pvG = svgEl('g', { class: 'pv-dot-group', cursor: 'pointer' });
      pvG.append(
        svgEl('circle', {
          cx: p.cx,
          cy: p.cy,
          r: isSelected ? 18 : 13,
          fill: isSelected ? p.color : `${p.color}44`,
          stroke: isSelected ? '#ffffff' : p.color,
          'stroke-width': isSelected ? 2.8 : 1.5
        }),
        svgEl('text', {
          x: p.cx,
          y: p.cy + 4,
          'text-anchor': 'middle',
          fill: isSelected ? '#0f172a' : '#ffffff',
          'font-size': '9',
          'font-weight': '800'
        }, p.label)
      );
      pvG.addEventListener('click', () => {
        st.pvSite = p.id;
        render();
      });
      g.append(pvG);
    });

    svg.append(g);
  }

  function renderPvDetails(card, isTr) {
    const data = {
      RSPV: {
        title: isTr ? 'Sağ Süperior Pulmoner Ven (RSPV)' : 'Right Superior Pulmonary Vein (RSPV)',
        iiAmp: '+0.18 mV (En Yüksek Pozitif P)',
        v1Polarity: '+ (Düşük genlikli pozitif)',
        duration: isTr ? 'Dar (Septuma yakın, atriyal senkroni hızlı)' : 'Narrow (Near septum, rapid synchrony)',
        desc: isTr ? 'Süperior konumdadır; aşağı doğru yayılım Derivasyon II\'de belirgin yüksek P üretir. Atriyal septuma bitişik olduğundan her iki atriyum hızla senkronize olur ve P dalga süresi dardır.' : 'Superiorly located; downward propagation creates tall upright P in II. Adjacent to atrial septum, synchronizing both atria rapidly.'
      },
      RIPV: {
        title: isTr ? 'Sağ İnferior Pulmoner Ven (RIPV)' : 'Right Inferior Pulmonary Vein (RIPV)',
        iiAmp: '+0.11 mV (Pozitif P)',
        v1Polarity: '+ (RSPV\'den daha yüksek pozitif!)',
        duration: isTr ? 'Orta-dar süre' : 'Intermediate duration',
        desc: isTr ? 'İnferior ven olmasına rağmen atriyal kitle çatısında kaldığından P dalgası II\'de pozitiftir (inferior aks). Posteroinferior yerleşimi nedeniyle V1 elektroduna doğru daha dik bakar ve V1 pozitifliği RSPV\'den daha belirgindir.' : 'Although an inferior vein, it sits on the atrial roof relative to total mass, maintaining an inferior axis. Due to posteroinferior alignment, V1 positive amplitude is greater than RSPV.'
      },
      LSPV: {
        title: isTr ? 'Sol Süperior Pulmoner Ven (LSPV)' : 'Left Superior Pulmonary Vein (LSPV)',
        iiAmp: '+0.16 mV (Pozitif P)',
        v1Polarity: '+ / − (Bifazik)',
        duration: isTr ? 'Geniş (Septumdan ve SA düğümden uzak)' : 'Wide (Far from septum and SA node)',
        desc: isTr ? 'Sol venler atriyal septumdan ve sağ atriyumdan uzaktır; sol atriyum önce, sağ atriyum sonra aktive olur. Bu nedenle sol ven pacemap\'lerinde P dalga süresi belirgin şekilde geniştir.' : 'Left PVs lie far from the septum; delayed right atrial activation widens the overall P-wave duration.'
      },
      LIPV: {
        title: isTr ? 'Sol İnferior Pulmoner Ven (LIPV)' : 'Left Inferior Pulmonary Vein (LIPV)',
        iiAmp: '+0.10 mV (Pozitif P)',
        v1Polarity: '+ / − (Bifazik)',
        duration: isTr ? 'Geniş süre' : 'Wide duration',
        desc: isTr ? 'LSPV\'ye göre daha alt seviyede olduğundan II\'deki P dalga genliği LSPV\'den düşüktür ancak yine de pozitiftir.' : 'Lower amplitude in II than LSPV, but retains upright polarity due to superior roof position.'
      },
      RAA: {
        title: isTr ? 'Sağ Atriyal Apendiks (RAA)' : 'Right Atrial Appendage (RAA)',
        iiAmp: isTr ? 'Düşük pozitif veya bifazik' : 'Low positive or biphasic',
        v1Polarity: '− (Negatif P!)',
        duration: isTr ? 'Dar süre' : 'Narrow duration',
        desc: isTr ? 'RAA doğrudan V1 elektrodunun arkasındadır. Buradan başlayan aktivasyon V1\'den uzaklaşarak arkaya ve sola gider, bu nedenle V1\'de net NEGATİF P dalgası oluşturur.' : 'RAA sits directly posterior to V1. Pacing creates wavefront moving away from V1, producing negative P deflection.'
      },
      LAA: {
        title: isTr ? 'Sol Atriyal Apendiks (LAA)' : 'Left Atrial Appendage (LAA)',
        iiAmp: isTr ? 'Pozitif P' : 'Upright P',
        v1Polarity: isTr ? 'Geniş bifazik' : 'Wide biphasic',
        duration: isTr ? 'Geniş süre' : 'Wide duration',
        desc: isTr ? 'LAA sol üsttedir. aVL derivasyonundan (−30°) uzaklaşan yayılım nedeniyle aVL\'de tipik NEGATİF P dalgası karakteristiktir.' : 'LAA sits superior-left. Activation receding from aVL produces characteristic negative P deflection in aVL.'
      }
    };

    const d = data[st.pvSite] || data.RSPV;

    card.innerHTML = `
      <span class="davinci-badge-green">${st.pvSite} Pacemap</span>
      <h5 style="margin:8px 0 4px;font-size:15px;color:#f8fafc;">${d.title}</h5>
      <p style="font-size:12.5px;line-height:1.55;color:#cbd5e1;margin:0 0 10px;">${d.desc}</p>
      <div class="davinci-metrics-stack">
        <div class="davinci-metric-box">
          <strong>${isTr ? 'Derivasyon II P Polaritesi & Genliği:' : 'Lead II P Amplitude:'}</strong>
          <span>${d.iiAmp}</span>
        </div>
        <div class="davinci-metric-box">
          <strong>${isTr ? 'V1 Polaritesi:' : 'V1 Polarity:'}</strong>
          <span>${d.v1Polarity}</span>
        </div>
        <div class="davinci-metric-box">
          <strong>${isTr ? 'P Dalga Süresi:' : 'P Duration:'}</strong>
          <span>${d.duration}</span>
        </div>
      </div>
    `;
  }

  // --- SUB-MODULE 5: INTRINSIC CARDIAC AUTONOMIC NERVOUS SYSTEM (ICNS) ---
  // Aksu T, Gupta D, Pauza DH. "Anatomy and Physiology of Intrinsic Cardiac Autonomic Nervous System."
  // JACC: Case Reports 2021;3(4):625–629 (Da Vinci Anatomy Card #2).
  function renderIcnsTab(container, isTr) {
    const card = document.createElement('div');
    card.className = 'davinci-card';

    const sgpData = {
      vrasgp: {
        code: 'VRAsGP',
        name: isTr ? 'Ventral Sağ Atriyal Subpleksus' : 'Ventral Right Atrial Subplexus',
        color: '#3b82f6',
        course: isTr ? 'Sağ atriyumun ön yüzünde seyreder; SVC-RA bileşkesinden sinüs düğümünün ön kısmına uzanır ve ventral interatriyal krest üzerinden sol atriyuma geçer.' : 'Located on the anterior RA; courses from the SVC-RA junction to the anterior SA node, extending across the ventral crest to the LA.',
        innervation: isTr ? 'Sinüs düğümü ön yüzü, ventral sağ atriyal miyokard.' : 'Anterior aspect of the SA node, ventral right atrial myocardium.',
        cnaNote: isTr ? 'Ventral krest ve sinüs düğümü çevresindeki ablasyonlarda sinüs hızında kalıcı artış sağlar.' : 'Modulates baseline sinus rate during anterior ganglion ablation.'
      },
      vlasgp: {
        code: 'VLAsGP',
        name: isTr ? 'Ventral Sol Atriyal Subpleksus' : 'Ventral Left Atrial Subplexus',
        color: '#22c55e',
        course: isTr ? 'Sol atriyumun ön ve çatı yüzeyinde yayılır; interatriyal oluk üzerinde VRAsGP ile anastomozlaşır.' : 'Distributed on the ventral surface and roof of the LA; communicates with VRAsGP across the interatrial crest.',
        innervation: isTr ? 'Sol atriyum ön duvarı, Bachmann demeti lifleri ve superior LA miyokardı.' : 'Anterior LA wall, Bachmann bundle region, and superior LA myocardium.',
        cnaNote: isTr ? 'Bachmann demeti ablasyonunda ve AF tetikleyicilerinde otonom modülasyon sunar.' : 'Modulates anterior LA conduction and AF trigger vulnerability.'
      },
      ldsgp: {
        code: 'LDsGP',
        name: isTr ? 'Sol Dorsal Subpleksus' : 'Left Dorsal Subplexus',
        color: '#ef4444',
        course: isTr ? 'Sol atriyum arka yüzünde, LSPV/LIPV antrumu ile sol atriyoventriküler sulkus arasında uzanarak dorsal LV serbest duvarına iner.' : 'Courses on the posterior LA between the left pulmonary veins and left AV groove down toward dorsal LV.',
        innervation: isTr ? 'LSPV, LIPV, Marshall ligamenti, lateral ve posterior LA, sol ventrikül arka yüzü.' : 'LSPV, LIPV, ligament of Marshall, posterior LA, and dorsal LV.',
        cnaNote: isTr ? 'Marshall veni/ligamenti ve LSGP (sol superior GP) ile örtüşür. AF ablasyonunda ve sempatik-parasempatik hiperaktiviteyi kırmada kritiktir.' : 'Overlaps the ligament of Marshall and LSGP (superior left GP); critical in AF ablation.'
      },
      mdsgp: {
        code: 'MDsGP',
        name: isTr ? 'Orta Dorsal Subpleksus' : 'Middle Dorsal Subplexus',
        color: '#f97316',
        course: isTr ? 'Sol atriyumun arka-üst çatısından başlar, Waterston interatriyal oluğu boyunca crux cordise ve ventriküllerin arka yüzüne iner.' : 'Extends from posterosuperior LA along Waterston groove down to the crux cordis and posterior ventricles.',
        innervation: isTr ? 'Sağ ve sol pulmoner ven antrumları, posterior interatriyal septum, AV düğüm ve crux cordis bölgesi.' : 'PV antrums, posterior interatrial groove, AV node, and crux cordis.',
        cnaNote: isTr ? 'Crux cordis ganglion kümesi (P-IS GP) ile birleşir; AV düğüm vagal iletiminin (dromotropi) ana nöral yoludur.' : 'Merges into the crux cordis GP (P-IS GP); primary conduit for vagal AV nodal deceleration.'
      },
      drasgp: {
        code: 'DRAsGP',
        name: isTr ? 'Dorsal Sağ Atriyal Subpleksus' : 'Dorsal Right Atrial Subplexus',
        color: '#ec4899',
        course: isTr ? 'SVC arka kökü, sağ atriyum arka-üst yüzeyi ve interatriyal olukta yerleşir; sinüs düğümünün arka yüzüne ve RAA’ya lifler verir.' : 'Situated at the dorsal root of the SVC and posterosuperior RA; sends branches to the posterior SA node.',
        innervation: isTr ? 'Sinüs düğümü arka bölgesi, krista terminalis superioru, posterior interatriyal septum.' : 'Posterior SA node, superior crista terminalis, and posterior interatrial septum.',
        cnaNote: isTr ? 'Klinik RSGP (SVC-Ao yağ yastıkçığı) ganglionları ile doğrudan eşleşir; sinüs arrestini önlemede primer kardiyonöroablasyon hedefidir.' : 'Directly corresponds to the clinical RSGP (SVC-Ao fat pad); primary target for cardioinhibitory sinus arrest.'
      },
      rcsgp: {
        code: 'RCsGP',
        name: isTr ? 'Sağ Koroner Subpleksus' : 'Right Coronary Subplexus',
        color: '#d946ef',
        course: isTr ? 'Sağ atriyoventriküler olukta, sağ koroner arter (RCA) boyunca seyreder; triküspit anülüsü ve RV inferior serbest duvarına ulaşır.' : 'Courses along the right AV sulcus alongside the RCA; reaches the tricuspid annulus and inferior RV.',
        innervation: isTr ? 'Triküspit anülüsü, sağ AV bileşke, RV inferior ve posterior miyokardı.' : 'Tricuspid annulus, right AV junction, inferior RV myocardium.',
        cnaNote: isTr ? 'İnferior MI sırasında vagal Bezold–Jarisch refleksinin (şiddetli bradikardi ve hipotansiyon) afferent/efferent liflerini barındırır.' : 'Carries afferent/efferent fibers mediating the Bezold–Jarisch reflex during inferior MI.'
      },
      lcsgp: {
        code: 'LCsGP',
        name: isTr ? 'Sol Koroner Subpleksus' : 'Left Coronary Subplexus',
        color: '#b45309',
        course: isTr ? 'Sol atriyoventriküler olukta, LCx arteri ve koroner sinüs boyunca dolanır; lateral mitral anülüsünü çevreler.' : 'Courses in the left AV sulcus alongside the LCx and CS; encircles the lateral mitral annulus.',
        innervation: isTr ? 'Mitral anülüs, koroner sinüs kılıfı, lateral LA ve sol ventrikül lateral duvarı.' : 'Mitral annulus, CS sleeve, lateral LA, and lateral LV.',
        cnaNote: isTr ? 'Koroner sinüs veya mitral istmus ablasyonlarında etkilenir; PV otonomik tonusunu modüle eder.' : 'Influenced during CS and mitral isthmus ablation; modulates PV and lateral LV autonomic tone.'
      }
    };

    const cnaData = {
      sa_node: {
        title: isTr ? 'RSGP (SVC-Ao Yağ Yastıkçığı) · Sinüs Düğümü Selektif Denervasyonu' : 'RSGP (SVC-Ao Fat Pad) · Selective SA Node Denervation',
        targetGps: 'DRAsGP & VRAsGP (Süperior Sağ Atriyal GP / RSGP)',
        indication: isTr ? 'Kardiyoinhibituvar Vazovagal Senkop (VVS Tip 2A/2B), Sinüs Arresti, Şiddetli Semptomatik Sinüs Bradikardisi' : 'Cardioinhibitory Vasovagal Syncope (VVS Type 2A/2B), Sinus Arrest, Severe Sinus Bradycardia',
        hfsResponse: isTr ? 'Yüksek Frekanslı Stimülasyon (HFS, 20 Hz, 12 V): Belirgin sinüs duraklaması (>3–5 saniye asistoli) veya ani sinüs arresti.' : 'High-Frequency Stimulation (HFS, 20 Hz, 12 V): Profound sinus pause (>3–5s asystole) or acute sinus arrest.',
        cnaEndpoint: isTr ? 'İstirahat sinüs hızında %20–30 artış; vagal uyarılara ve HFS’ye bağlı bradikardik yanıtın tamamen kaybolması. AV iletim ve PR aralığı DEĞİŞMEZ!' : 'Sustained 20–30% increase in baseline sinus rate; abolition of vagal sinus arrest. PR interval and AV nodal conduction are UNCHANGED!',
        endocardialSite: isTr ? 'Sağ atriyum çatısı: SVC-aort oluğu hizasında, krista terminalis superiorunun hemen medial/septal yüzeyi.' : 'High septal/anteromedial RA roof: facing the SVC-aortic groove, medial to superior crista terminalis.'
      },
      av_node: {
        title: isTr ? 'P-IS GP (Crux Cordis / IVC-LA Yağ Yastıkçığı) · AV Düğüm Selektif Denervasyonu' : 'P-IS GP (Crux Cordis / IVC-LA Fat Pad) · Selective AV Node Denervation',
        targetGps: 'MDsGP & Posterior İnteratriyal Septal GP (P-IS GP / Crux Cordis GP)',
        indication: isTr ? 'Fonksiyonel Vagal Paroksismal AV Blok (2. veya 3. derece AV Blok), Vagal Senkopta AV Blok Komponenti' : 'Functional Vagally Mediated Paroxysmal AV Block (2nd/3rd degree), AV Block component of VVS',
        hfsResponse: isTr ? 'HFS Uyarısı: Sinüs ritmi sürerken ventriküler yanıtsızlık ve tam AV blok (P dalgaları var, ventrikül asistolisi).' : 'HFS Delivery: Complete AV block with ventricular arrest while sinus rhythm persists (dissociated P waves).',
        cnaEndpoint: isTr ? 'Vagal AV bloğun tamamen engellenmesi; AV Wenckebach siklus uzunluğunun kısalması ve AH aralığının kısalması. Sinüs hızı DEĞİŞMEZ!' : 'Complete abolition of vagal AV block; shortening of AV Wenckebach cycle length and AH interval. Sinus rate is UNCHANGED!',
        endocardialSite: isTr ? 'Posteroseptal RA/LA: Koroner sinüs ostiyumu çevresi, inferior interatriyal septum ve sol atriyal posteromedial taban.' : 'Posteroseptal RA/LA: around the coronary sinus ostium, inferoposterior septum, and crux cordis.'
      },
      marshall: {
        title: isTr ? 'LSGP & Marshall Ligamenti · AF Otonomik Tetikleyici Substratı' : 'LSGP & Ligament of Marshall · AF Autonomic Trigger Substrate',
        targetGps: 'LDsGP & LSGP (Sol Süperior GP / Marshall Traktı)',
        indication: isTr ? 'Paroksismal Atriyal Fibrilasyon, Marshall kaynaklı ektopik odaklar, Pulmoner Ven Otonomik Hiperaktivitesi' : 'Paroxysmal Atrial Fibrillation, Marshall-mediated triggers, PV Autonomic Hyperactivity',
        hfsResponse: isTr ? 'HFS Uyarısı: LSPV bölgesinde fraksiyone elektrogramlar, refrakter periyotta belirgin kısalma ve AF indüksiyonu.' : 'HFS Delivery: Fractionated electrograms, localized ERP shortening, and immediate induction of atrial fibrillation.',
        cnaEndpoint: isTr ? 'Adrenerjik ve kolinerjik liflerin denervasyonu; Marshall veni alkol ablasyonu veya RF ablasyon ile AF tetikleyicilerinin yok edilmesi.' : 'Denervation of local autonomic inputs; elimination of Marshall AF triggers via RF or ethanol infusion.',
        endocardialSite: isTr ? 'LSPV antrumu ile sol atriyal apendiks (LAA) arasındaki krista / sırt (Marshall katlantısı).' : 'Ridge between the LSPV antrum and the left atrial appendage (fold of Marshall).'
      }
    };

    const activeCna = cnaData[st.cnaTarget] || cnaData.sa_node;
    const selectedSgp = st.icnsSgp !== 'all' ? sgpData[st.icnsSgp] : null;

    card.innerHTML = `
      <div class="davinci-card-head">
        <div>
          <h4>${isTr ? 'İntrinsik Kardiyak Otonom Sinir Sistemi (ICNS) ve Kardiyonöroablasyon (CNA)' : 'Intrinsic Cardiac Autonomic Nervous System (ICNS) & Cardioneuroablation (CNA)'}</h4>
          <span class="davinci-card-cite">Da Vinci Anatomy Card #2: Tolga Aksu, Dhiraj Gupta, Dainius H. Pauza (JACC: Case Reports 2021; 3:625–629)</span>
        </div>
      </div>

      <div class="davinci-callout info">
        <p>
          ${isTr
            ? '<strong>Otonomik Nöral Mimari:</strong> Sempatik sistem preganglionik lifleri torasik medulla spinalisten (T1–T5) köken alıp paravertebral sempatik zincir ganglionlarında sinaps yapar; postganglionik miyelinsiz lifler kalbe ulaşır. Buna karşılık, parasempatik sistemde vagus siniri (Kraniyal Sinir X, Nucleus ambiguus ve DMNV) preganglionik lifleri doğrudan kalp yüzeyindeki epikardiyal yağ yastıkçıkları içine taşır. Ganglionlu pleksuslar (GP) kalbin epikardında yer alır; postganglionik kolinerjik aksonlar oldukça kısadır (<1–2 mm) ve doğrudan yerel miyokard/düğümleri innerve eder.'
            : '<strong>Autonomic Neural Architecture:</strong> Sympathetic preganglionics originate in T1–T5 thoracic spinal segments and synapse in paravertebral chain ganglia; long unmyelinated postganglionics innervate cardiac tissue. Conversely, parasympathetic vagal fibers (CN X, Nucleus ambiguus & DMNV) travel as long preganglionics to synapse within intrinsic epicardial ganglionated plexuses (GPs) embedded in atrial fat pads. Postganglionic cholinergic axons are very short (<1–2 mm), exerting exquisite local control over the sinus and AV nodes.'
          }
        </p>
      </div>

      <!-- Section A: 7 Human Epicardiac Ganglionated Subplexuses (Pauza et al.) -->
      <div class="davinci-control-group">
        <label class="davinci-group-label">
          ${isTr ? 'A. Pauza İnsan Epikardiyal Ganglionlu Subpleksusları (7 sGP):' : 'A. Pauza 7 Human Epicardiac Ganglionated Subplexuses (sGPs):'}
        </label>
        <div class="davinci-btn-row">
          <button type="button" class="davinci-chip-btn ${st.icnsSgp === 'all' ? 'active' : ''}" data-sgp="all">
            ${isTr ? 'Tümü (7 sGP)' : 'All (7 sGPs)'}
          </button>
          ${Object.entries(sgpData).map(([id, d]) => `
            <button type="button" class="davinci-chip-btn ${st.icnsSgp === id ? 'active' : ''}" data-sgp="${id}" style="border-left: 3px solid ${d.color}">
              <span style="color:${d.color};font-weight:700">${d.code}</span> · ${d.name.split(' ')[0]}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="davinci-anatomy-grid">
        ${selectedSgp ? `
          <div class="davinci-grid-card" style="border-top: 3px solid ${selectedSgp.color}; grid-column: 1 / -1">
            <h5 style="color:${selectedSgp.color}">
              <span class="davinci-badge" style="background:${selectedSgp.color}22;color:${selectedSgp.color};border-color:${selectedSgp.color}55">${selectedSgp.code}</span>
              ${selectedSgp.name}
            </h5>
            <p><strong>${isTr ? 'Epikardiyal Seyir:' : 'Epicardial Course:'}</strong> ${selectedSgp.course}</p>
            <p><strong>${isTr ? 'Primer İnnervasyon:' : 'Primary Innervation:'}</strong> ${selectedSgp.innervation}</p>
            <p><strong>${isTr ? 'Klinik / Girişimsel Önem:' : 'Clinical / Ablation Significance:'}</strong> ${selectedSgp.cnaNote}</p>
          </div>
        ` : `
          <div class="davinci-grid-card" style="grid-column: 1 / -1">
            <h5>${isTr ? 'Pauza Sınıflaması: Kalp Çevresindeki 7 Epikardiyal Ağ' : 'Pauza Classification: 7 Epicardiac Neural Subplexuses'}</h5>
            <p>${isTr
              ? 'Pauza ve ark. (Anat Rec 2000) insan kalbinde 7 anatomik subpleksus (sGP) haritalamıştır: <strong>VRAsGP</strong> (Mavi, Ventral RA), <strong>VLAsGP</strong> (Yeşil, Ventral LA), <strong>LDsGP</strong> (Kırmızı, Sol dorsal / Marshall), <strong>MDsGP</strong> (Turuncu, Orta dorsal / Crux cordis), <strong>DRAsGP</strong> (Pembe, Dorsal RA / RSGP), <strong>RCsGP</strong> (Macenta, Sağ AV oluk / RCA), <strong>LCsGP</strong> (Kahverengi, Sol AV oluk / LCx). Yukarıdaki butonlarla her birinin seyrini ve innervasyon alanını inceleyebilirsiniz.'
              : 'Pauza et al. (Anat Rec 2000) mapped 7 distinct sGPs across the human epicardium: <strong>VRAsGP</strong> (Blue, Ventral RA), <strong>VLAsGP</strong> (Green, Ventral LA), <strong>LDsGP</strong> (Red, Left dorsal / Marshall), <strong>MDsGP</strong> (Orange, Middle dorsal / Crux cordis), <strong>DRAsGP</strong> (Pink, Dorsal RA / RSGP), <strong>RCsGP</strong> (Magenta, Right AV sulcus / RCA), <strong>LCsGP</strong> (Brown, Left AV sulcus / LCx). Use the buttons above to inspect each subplexus.'
            }</p>
          </div>
        `}
      </div>

      <!-- Section B: Cardioneuroablation (CNA) Functional Targets -->
      <div class="davinci-control-group" style="margin-top: 14px">
        <label class="davinci-group-label">
          ${isTr ? 'B. Kardiyonöroablasyon (CNA) Fonksiyonel Hedefleri ve Elektrofizyolojik Yanıtlar:' : 'B. Cardioneuroablation (CNA) Functional Targets & Electrophysiological Endpoints:'}
        </label>
        <div class="davinci-btn-row">
          <button type="button" class="davinci-chip-btn ${st.cnaTarget === 'sa_node' ? 'active' : ''}" data-cna="sa_node">
            🎯 ${isTr ? 'Sinüs Düğümü Hedefi (RSGP / SVC-Ao)' : 'SA Node Target (RSGP / SVC-Ao)'}
          </button>
          <button type="button" class="davinci-chip-btn ${st.cnaTarget === 'av_node' ? 'active' : ''}" data-cna="av_node">
            🎯 ${isTr ? 'AV Düğüm Hedefi (P-IS GP / Crux Cordis)' : 'AV Node Target (P-IS GP / Crux)'}
          </button>
          <button type="button" class="davinci-chip-btn ${st.cnaTarget === 'marshall' ? 'active' : ''}" data-cna="marshall">
            🎯 ${isTr ? 'Marshall & AF Substratı (LSGP)' : 'Marshall & AF Substrate (LSGP)'}
          </button>
        </div>
      </div>

      <!-- CNA Neural Circuit SVG Schematic -->
      <div class="davinci-svg-stage">
        <svg viewBox="0 0 680 220" class="davinci-stage-svg" role="img" aria-label="ICNS CNA Neural Circuit Diagram">
          <defs>
            <marker id="icns-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8"/>
            </marker>
            <marker id="icns-arrow-gold" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#facc15"/>
            </marker>
            <filter id="cna-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Brainstem Nuclei -->
          <rect x="20" y="70" width="120" height="80" rx="8" fill="#1e293b" stroke="#64748b" stroke-width="1.8"/>
          <text x="80" y="95" fill="#f8fafc" font-size="11" font-weight="700" text-anchor="middle">Beyin Sapı / Vagus</text>
          <text x="80" y="112" fill="#94a3b8" font-size="9" text-anchor="middle">Nuc. Ambiguus</text>
          <text x="80" y="126" fill="#94a3b8" font-size="9" text-anchor="middle">DMNV (N. Vagus X)</text>

          <!-- Vagus Nerve Pathway -->
          <path d="M 140 100 C 190 70, 220 50, 260 50" fill="none" stroke="${st.cnaTarget === 'sa_node' ? '#facc15' : '#38bdf8'}" stroke-width="${st.cnaTarget === 'sa_node' ? '3' : '1.8'}" stroke-dasharray="4,3" marker-end="url(#icns-arrow)"/>
          <path d="M 140 110 C 190 110, 220 110, 260 110" fill="none" stroke="${st.cnaTarget === 'marshall' ? '#facc15' : '#38bdf8'}" stroke-width="${st.cnaTarget === 'marshall' ? '3' : '1.8'}" stroke-dasharray="4,3" marker-end="url(#icns-arrow)"/>
          <path d="M 140 120 C 190 150, 220 170, 260 170" fill="none" stroke="${st.cnaTarget === 'av_node' ? '#facc15' : '#38bdf8'}" stroke-width="${st.cnaTarget === 'av_node' ? '3' : '1.8'}" stroke-dasharray="4,3" marker-end="url(#icns-arrow)"/>

          <!-- Ganglia / Fat Pads -->
          <!-- 1. RSGP (SVC-Ao) -->
          <g transform="translate(260, 30)">
            <rect x="0" y="0" width="165" height="40" rx="6" fill="${st.cnaTarget === 'sa_node' ? '#854d0e' : '#1e293b'}" stroke="${st.cnaTarget === 'sa_node' ? '#facc15' : '#ec4899'}" stroke-width="${st.cnaTarget === 'sa_node' ? '2.5' : '1.5'}" ${st.cnaTarget === 'sa_node' ? 'filter="url(#cna-glow)"' : ''}/>
            <circle cx="12" cy="20" r="5" fill="#ec4899"/>
            <text x="24" y="18" fill="#f8fafc" font-size="10.5" font-weight="700">RSGP (SVC-Ao Fat Pad)</text>
            <text x="24" y="32" fill="#cbd5e1" font-size="8.5">DRAsGP / Superior Right GP</text>
          </g>

          <!-- 2. LSGP (Marshall / LSPV) -->
          <g transform="translate(260, 90)">
            <rect x="0" y="0" width="165" height="40" rx="6" fill="${st.cnaTarget === 'marshall' ? '#854d0e' : '#1e293b'}" stroke="${st.cnaTarget === 'marshall' ? '#facc15' : '#ef4444'}" stroke-width="${st.cnaTarget === 'marshall' ? '2.5' : '1.5'}" ${st.cnaTarget === 'marshall' ? 'filter="url(#cna-glow)"' : ''}/>
            <circle cx="12" cy="20" r="5" fill="#ef4444"/>
            <text x="24" y="18" fill="#f8fafc" font-size="10.5" font-weight="700">LSGP (Marshall / LSPV)</text>
            <text x="24" y="32" fill="#cbd5e1" font-size="8.5">LDsGP / Superior Left GP</text>
          </g>

          <!-- 3. P-IS GP (Crux Cordis / IVC-LA) -->
          <g transform="translate(260, 150)">
            <rect x="0" y="0" width="165" height="40" rx="6" fill="${st.cnaTarget === 'av_node' ? '#854d0e' : '#1e293b'}" stroke="${st.cnaTarget === 'av_node' ? '#facc15' : '#f97316'}" stroke-width="${st.cnaTarget === 'av_node' ? '2.5' : '1.5'}" ${st.cnaTarget === 'av_node' ? 'filter="url(#cna-glow)"' : ''}/>
            <circle cx="12" cy="20" r="5" fill="#f97316"/>
            <text x="24" y="18" fill="#f8fafc" font-size="10.5" font-weight="700">P-IS GP (Crux Cordis)</text>
            <text x="24" y="32" fill="#cbd5e1" font-size="8.5">MDsGP / IVC-LA Fat Pad</text>
          </g>

          <!-- Postganglionic Links to Target Nodes -->
          <path d="M 425 50 L 515 50" fill="none" stroke="${st.cnaTarget === 'sa_node' ? '#facc15' : '#ec4899'}" stroke-width="${st.cnaTarget === 'sa_node' ? '2.5' : '1.5'}" marker-end="url(#icns-arrow)"/>
          <path d="M 425 110 C 470 110, 480 70, 515 65" fill="none" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="3,3"/>
          <path d="M 425 170 L 515 170" fill="none" stroke="${st.cnaTarget === 'av_node' ? '#facc15' : '#f97316'}" stroke-width="${st.cnaTarget === 'av_node' ? '2.5' : '1.5'}" marker-end="url(#icns-arrow)"/>

          <!-- Target End Organs -->
          <!-- Sinoatrial Node -->
          <g transform="translate(520, 30)">
            <rect x="0" y="0" width="140" height="40" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="1.8"/>
            <circle cx="16" cy="20" r="6" fill="#38bdf8"/>
            <text x="30" y="18" fill="#f8fafc" font-size="11" font-weight="700">Sinüs Düğümü (SA)</text>
            <text x="30" y="32" fill="#38bdf8" font-size="9" font-weight="600">Negatif Kronotropi</text>
          </g>

          <!-- Atrioventricular Node -->
          <g transform="translate(520, 150)">
            <rect x="0" y="0" width="140" height="40" rx="6" fill="#1e293b" stroke="#e0a92a" stroke-width="1.8"/>
            <circle cx="16" cy="20" r="6" fill="#e0a92a"/>
            <text x="30" y="18" fill="#f8fafc" font-size="11" font-weight="700">AV Düğüm (AVN)</text>
            <text x="30" y="32" fill="#e0a92a" font-size="9" font-weight="600">Negatif Dromotropi</text>
          </g>
        </svg>
      </div>

      <!-- CNA Details Card -->
      <div class="davinci-anatomy-grid" style="margin-top: 10px">
        <div class="davinci-grid-card" style="grid-column: 1 / -1; border-left: 4px solid #facc15">
          <h5 style="color: #facc15">${activeCna.title}</h5>
          <p><strong>${isTr ? 'İlgili Pauza Subpleksusu / Ganglion:' : 'Associated Pauza Subplexus / Ganglia:'}</strong> ${activeCna.targetGps}</p>
          <p><strong>${isTr ? 'Klinik Endikasyon:' : 'Clinical Indication:'}</strong> ${activeCna.indication}</p>
          <p><strong>${isTr ? 'Yüksek Frekanslı Stimülasyon (HFS) Yanıtı:' : 'HFS Stimulation Response:'}</strong> <span style="color:#ef4444">${activeCna.hfsResponse}</span></p>
          <p><strong>${isTr ? 'Ablasyon Son Noktası (CNA Endpoint):' : 'Ablation Endpoint:'}</strong> <span style="color:#4ade80">${activeCna.cnaEndpoint}</span></p>
          <p><strong>${isTr ? 'Endokardiyal Kateter Giriş Bölgesi:' : 'Endocardial Catheter Approach:'}</strong> ${activeCna.endocardialSite}</p>
        </div>
      </div>

      <!-- 3D Heart Model Action Banner -->
      <div class="davinci-lead-banner">
        <div class="davinci-banner-content">
          <h4>${isTr ? '3 Boyutlu Kalp Modelinde ICNS Katmanını Görüntüleyin' : 'View the ICNS Layer on the 3D Heart Model'}</h4>
          <p>${isTr
            ? '3D anatomik model üzerinde 7 epikardiyal subpleksusu, sinir yollarını, ganglion küme auralarını ve CNA ablasyon hedeflerini dinamik olarak inceleyin.'
            : 'Explore the 7 human epicardiac subplexuses, ganglion clusters, and CNA targets directly on the interactive 3D heart model.'
          }</p>
        </div>
        <button type="button" class="davinci-banner-btn btn-goto-3d-icns">
          ${isTr ? '⚡ 3D Kalp Modelinde ICNS İncele' : '⚡ Inspect ICNS in 3D Heart'}
        </button>
      </div>
    `;

    // Event listeners for sGP buttons
    card.querySelectorAll('[data-sgp]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.icnsSgp = btn.dataset.sgp;
        render();
      });
    });

    // Event listeners for CNA buttons
    card.querySelectorAll('[data-cna]').forEach(btn => {
      btn.addEventListener('click', () => {
        st.cnaTarget = btn.dataset.cna;
        render();
      });
    });

    // Event listener for 3D navigation
    card.querySelector('.btn-goto-3d-icns')?.addEventListener('click', () => {
      window.location.hash = '#/mode/anatomy';
      setTimeout(() => {
        const icnsBox = document.querySelector('input[data-layer="icns"]');
        if (icnsBox && !icnsBox.checked) {
          icnsBox.checked = true;
          icnsBox.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, 150);
    });

    container.append(card);
  }

  // Wave path helper for mini strip SVGs
  function generateWavePath(leadId, amp, scenario) {
    const baseline = 40;
    const rHeight = amp * 28;
    const pHeight = amp * 6;

    if (scenario === 'sinus_p') {
      return `M 10,${baseline} C 30,${baseline} 40,${baseline - pHeight * 2} 55,${baseline} L 75,${baseline} L 78,${baseline + 4} L 83,${baseline - 18} L 88,${baseline + 6} L 92,${baseline} C 115,${baseline} 125,${baseline - 10} 145,${baseline}`;
    }

    // PVC / VT wave with deep S or tall R
    if (amp >= 0) {
      return `M 15,${baseline} L 55,${baseline} L 60,${baseline + 4} L 80,${baseline - rHeight} L 96,${baseline + 6} L 102,${baseline} C 120,${baseline} 130,${baseline - 8} 145,${baseline}`;
    } else {
      return `M 15,${baseline} L 55,${baseline} L 62,${baseline - 6} L 80,${baseline - rHeight} L 96,${baseline - 3} L 102,${baseline} C 120,${baseline} 130,${baseline + 8} 145,${baseline}`;
    }
  }

  mount.appendChild(root);
  render();

  return {
    render,
    destroy() {
      root.remove();
    }
  };
}

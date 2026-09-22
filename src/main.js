import * as THREE from 'three';
import './style.css';
import {createHeart} from './heart.js';
import {structures,lessons,setContentLanguage,getContentLanguage,getTranslation,getUiModes,getViewerTitle,getAngioDescription} from './content.js';
import {LESSON_TISSUE_OPACITY} from './layer-defaults.js';
import {drawEcgTrace, formatValveSync} from './ecg-trace.js';

document.documentElement.lang = getContentLanguage();

const modes = [
  ['anatomy', '01'],
  ['angiography', '02'],
  ['ablation', '03'],
  ['pacemaker', '04'],
  ['transseptal', '05'],
  ['bachmann', '06']
];

const app = document.querySelector('#app');
app.innerHTML = `
<header>
  <a class="brand" href="#/">✳ <strong>CARDIA</strong><span data-i18n="brandSubtitle">${getTranslation('brandSubtitle')}</span></a>
  <div class="header-right">
    <span class="dot"></span> <span data-i18n="headerTitle">${getTranslation('headerTitle')}</span>
    <button id="lang-btn" class="lang-btn" title="Dili değiştir / Switch language">${getContentLanguage().toUpperCase()}</button>
    <button id="shortcuts-btn" title="Keyboard shortcuts (?)"><span data-i18n="shortcutsBtn">${getTranslation('shortcutsBtn')}</span> <kbd>?</kbd></button>
    <button id="sources"><span data-i18n="referencesBtn">${getTranslation('referencesBtn')}</span></button>
  </div>
</header>
<div class="workspace">
  <aside>
    <div class="eyebrow" data-i18n="workspaceEyebrow">${getTranslation('workspaceEyebrow')}</div>
    <h1 data-i18n="workspaceTitle">${getTranslation('workspaceTitle')}</h1>
    <p class="muted" data-i18n="workspaceMuted">${getTranslation('workspaceMuted')}</p>
    <nav aria-label="Learning modes">
      ${getUiModes().map(([id,n,t])=>`<button class="mode ${id==='anatomy'?'active':''}" data-mode="${id}"><span>${n}</span><span class="mode-label">${t}</span> <kbd class="mode-kbd">${n.replace(/^0/,'')}</kbd><b>↗</b></button>`).join('')}
    </nav>
    <section id="layers">
      <div class="section-heading"><span data-i18n="layersHeading">${getTranslation('layersHeading')}</span> <span>08</span></div>
      <label class="layer"><i style="background:#c76260"></i><span data-i18n="chambers">${getTranslation('chambers')}</span><input type="checkbox" data-layer="chambers" checked></label>
      <div class="layer-subgroup">
        ${[
          ['lv', 'Left ventricle (LV)', '#9b3238'],
          ['rv', 'Right ventricle (RV)', '#a43d42'],
          ['la', 'Left atrium (LA)', '#b55157'],
          ['ra', 'Right atrium (RA)', '#aa484e']
        ].map(([id, t, c]) => `<label class="layer sublayer"><i style="background:${c}"></i>${t}<input type="checkbox" data-layer="${id}" checked></label>`).join('')}
      </div>
      <details class="wall-tools" open><summary data-i18n="wallToolsSummary">${getTranslation('wallToolsSummary')}</summary><p data-i18n="wallToolsNote">${getTranslation('wallToolsNote')}</p>
      ${[['rv','wallRv'],['lv','wallLv'],['la','wallLa'],['ra','wallRa']].map(([id,key])=>`<label for="wall-${id}"><span data-i18n="${key}">${getTranslation(key)}</span><output id="wall-value-${id}">${getTranslation('wallClosed')}</output></label><input id="wall-${id}" data-wall="${id}" type="range" min="0" max="80" value="0" aria-label="${getTranslation(key)}">`).join('')}
      <button id="restore-walls" data-i18n="restoreWalls">${getTranslation('restoreWalls')}</button></details>
      ${[
        ['vessels', 'vessels', '#729fca'],
        ['coronaries', 'coronaries', '#ebba70']
      ].map(([id, key, c]) => `<label class="layer"><i style="background:${c}"></i><span data-i18n="${key}">${getTranslation(key)}</span><input type="checkbox" data-layer="${id}" checked></label>`).join('')}
      <label class="layer"><i style="background:#5187a0"></i><span data-i18n="veins">${getTranslation('veins')}</span><input type="checkbox" data-layer="veins" checked></label>
      <div class="layer-subgroup">
        ${[
          ['cs', 'Koroner sinüs (CS Trunk)', '#5187a0'],
          ['gcv', 'Büyük kardiyak ven (GCV)', '#679db2'],
          ['mcv', 'Orta kardiyak ven (MCV)', '#679db2'],
          ['piv', 'Sol ventrikül posterior veni (PVLV)', '#679db2'],
          ['pv', 'Pulmoner venler (LSPV/LIPV/RSPV/RIPV)', '#b9827a'],
          ['svc', 'Vena kava süperior (SVC)', '#62889c'],
          ['ivc', 'Vena kava inferior (IVC)', '#62889c']
        ].map(([id, t, c]) => `<label class="layer sublayer"><i style="background:${c}"></i>${t}<input type="checkbox" data-layer="${id}" checked></label>`).join('')}
      </div>
      ${[
        ['conduction', 'conduction', '#f5df76'],
        ['bachmann', null, '#f6b64b']
      ].map(([id, key, c]) => `<label class="layer"><i style="background:${c}"></i>${key ? `<span data-i18n="${key}">${getTranslation(key)}</span>` : 'Bachmann'}<input type="checkbox" data-layer="${id}" checked></label>`).join('')}
      ${[
        ['pa-faint', 'Pulmoner arteri silikleştir', '#9fc2d0', false]
      ].map(([id, t, c, on]) => `<label class="layer"><i style="background:${c}"></i>${t}<input type="checkbox" data-layer="${id}"${on ? ' checked' : ''}></label>`).join('')}
      ${[
        ['diaphragm', 'Diyafram', '#c98f76', true],
        ['phrenic', 'Frenik sinirler', '#e8e29a', false],
        ['vertebrae', 'Vertebra kolonu (silik)', '#bdb7ac', true]
      ].map(([id, t, c, on]) => `<label class="layer"><i style="background:${c}"></i>${t}<input type="checkbox" data-layer="${id}"${on ? ' checked' : ''}></label>`).join('')}
      <label class="layer"><i style="background:#e74c3c"></i>Kan akışı (Yollar ve partiküller)<input type="checkbox" data-layer="flow" checked></label>
      <label class="layer"><i style="background:#d6c7bc"></i><span data-i18n="valves">${getTranslation('valves')}</span><input type="checkbox" data-layer="valves" checked></label>
      <div class="layer-subgroup">
        ${[
          ['aortic-valve', 'Aort kapağı (LCC, RCC, NCC)', '#d9c5a8'],
          ['mitral', 'Mitral kapak', '#e2d5c4'],
          ['mitral-posterior', 'PML · atlas yaprakçığı', '#efe6d8'],
          ['mitral-anterior', 'AML · şematik', '#f4efe4'],
          ['tricuspid', 'Triküspit kapak', '#e2d5c4'],
          ['tricuspid-septal', 'TV septal yaprakçık', '#efe6d8'],
          ['tricuspid-inferior', 'TV inferior yaprakçık', '#efe6d8'],
          ['tricuspid-anterior', 'TV anterior · şematik', '#f4efe4'],
          ['mitral-annulus', 'Mitral anulus', '#f5f3ea'],
          ['tricuspid-annulus', 'Triküspit anulus', '#f5f3ea'],
          ['pulmonary-valve', 'Pulmoner kapak', '#e2d5c4'],
          ['papillary', 'Papiller kaslar (RV / LV)', '#b57368']
        ].map(([id, t, c]) => `<label class="layer sublayer"><i style="background:${c}"></i>${t}<input type="checkbox" data-layer="${id}" checked></label>`).join('')}
      </div>
      <label class="slider-label"><span data-i18n="opacityLabel">${getTranslation('opacityLabel')}</span> <span id="opacity-value">100%</span></label>
      <input id="opacity" aria-label="${getTranslation('opacityLabel')}" type="range" min="15" max="100" value="100">
      <div class="coronary-tools"><div class="section-heading" data-i18n="coronaryToolsHeading">${getTranslation('coronaryToolsHeading')}</div><label for="coronary-system"><span data-i18n="coronarySystemLabel">${getTranslation('coronarySystemLabel')}</span></label><select id="coronary-system"><option value="all">Tüm anatomi</option><option value="both">İki koroner sistem</option><option value="left">Sol sistem · LM / LAD / LCx</option><option value="right">Sağ sistem · RCA</option></select><label class="layer"><input id="root-window" type="checkbox"> <span data-i18n="rootWindowLabel">${getTranslation('rootWindowLabel')}</span></label><small data-i18n="rootWindowNote">${getTranslation('rootWindowNote')}</small></div>
    </section>
    <div class="aside-bottom">
      <span class="outline-icon">i</span>
      <p>Atlas anatomy + conceptual lessons<br><small>Not for clinical decision-making</small></p>
    </div>
  </aside>
  <main>
    <div class="viewer-top">
      <div>
        <div class="eyebrow" id="mode-label">${getTranslation('explorerPrefix')} / ${getUiModes()[0][2].toUpperCase()}</div>
        <h2 id="viewer-title">${getViewerTitle('anatomy')}</h2>
      </div>
      <div class="top-badges">
        <span id="hover-badge" class="hover-badge" hidden></span>
        <span class="pill">ATLAS MESH · SHARED COORDINATES</span>
      </div>
    </div>
    <div id="viewport" aria-label="Interactive 3D heart. Drag to rotate, scroll to zoom."></div>

    <div class="view-controls" aria-label="Camera presets">
      ${[['anterior','Anterior','A'],['posterior','Posterior','P'],['rao','RAO','R'],['lao','LAO','L'],['spider','Spider','S'],['root','Root & Cusps','O']].map(([id,t,k])=>`<button data-view="${id}" class="${id==='anterior'?'selected':''}">${t} <kbd>${k}</kbd></button>`).join('')}
      <button id="carm-toggle-dock" class="carm-dock-btn" title="C-Arm Gantry & Joystick Paneli">📐 C-Arm <kbd>C</kbd></button>
      <button id="reset" title="Reset camera (0)">↺</button>
    </div>
    <div id="cycle-panel" class="cycle-panel">
      <div class="cycle-top-row">
        <div class="cycle-play-group">
          <button id="beat" class="cycle-play-btn" aria-pressed="false">♡ Animate beat <kbd>Space</kbd></button>
          <button id="flow-toggle" class="cycle-flow-btn active" aria-pressed="true" title="${getTranslation('flowToggleTitle')}">${getTranslation('flowToggleBtn')} <kbd>F</kbd></button>
          <span id="cycle-interval-name" class="cycle-badge">Rapid ventricular filling</span>
          <span id="cycle-phase-val" class="cycle-phase-tag">%0</span>
        </div>
        <div class="cycle-rate-group">
          <div class="flow-legend" title="Oksijenlenme: Kırmızı (Sol kalp / Aort / Koroner arter) · Mavi (Sağ kalp / Pulmoner arter / Venöz sistem)">
            <span class="flow-dot oxy"></span><span class="flow-dot-label">O₂⁺</span>
            <span class="flow-dot deoxy"></span><span class="flow-dot-label">O₂⁻</span>
          </div>
          <div class="cycle-bpm-wrap">
            <span class="cycle-label">BPM:</span>
            <strong id="cycle-bpm-val">72</strong>
            <input type="range" id="cycle-bpm" min="30" max="200" value="72" step="1" title="Heart rate (30-200 BPM)">
          </div>
          <div class="cycle-presets">
            <button class="cycle-preset-btn" data-bpm="60" title="Resting heart rate">60</button>
            <button class="cycle-preset-btn active" data-bpm="72" title="Normal heart rate">72</button>
            <button class="cycle-preset-btn" data-bpm="150" title="Exercise heart rate">150</button>
          </div>
          <select id="cycle-rhythm" class="cycle-rhythm-select" title="Cardiac rhythm preset">
            <option value="sinus" selected>Normal Sinus</option>
            <option value="bradycardia">Sinus Bradycardia</option>
            <option value="tachycardia">Sinus Tachycardia</option>
            <option value="afib">AFib Concept</option>
          </select>
        </div>
      </div>
      <div class="cycle-timeline-wrap">
        <input type="range" id="cycle-scrubber" min="0" max="100" value="0" step="0.2" aria-label="Cardiac cycle phase timeline">
      </div>
      <div class="ecg-strip">
        <canvas id="ecg-canvas" aria-label="${getTranslation('ecgCaption')}"></canvas>
        <span class="ecg-caption" data-i18n="ecgCaption">${getTranslation('ecgCaption')}</span>
        <span id="ecg-valve-state" class="ecg-valves"></span>
      </div>
    </div>
    <div class="viewer-bottom">
      <span data-i18n="viewerHint">${getTranslation('viewerHint')}</span>
      <span class="cycle-disclaimer">${getTranslation('cycleDisclaimer')}</span>
    </div>
    <div id="scene-note">Hasta sağı önden görünümde soldadır. Koronerler ve odacıklar aynı atlas koordinatlarını kullanır.</div>
  </main>
  <article>
    <!-- C-ARM FLUOROSCOPY & GANTRY JOYSTICK PANEL -->
    <div id="carm-panel" class="carm-panel collapsed" aria-label="C-Arm Angiografi Gantry Kontrolü">
      <div class="carm-header" id="carm-header">
        <div class="carm-title-group">
          <span class="carm-led-pulse"></span>
          <span class="carm-title-text" data-i18n="carmTitle">${getTranslation('carmTitle')}</span>
          <span class="carm-pill" data-i18n="carmPill">${getTranslation('carmPill')}</span>
        </div>
        <div class="carm-angle-badge" id="carm-angle-badge">AP 0° · 0°</div>
        <button id="carm-toggle-btn" class="carm-icon-btn" title="Paneli Küçült / Büyüt">+</button>
      </div>

      <div class="carm-content" id="carm-content">
        <div class="carm-readout-strip">
          <div class="readout-card">
            <span class="readout-sub" data-i18n="obliqueLabel">${getTranslation('obliqueLabel')}</span>
            <span class="readout-digit" id="readout-lao-rao">AP 0°</span>
          </div>
          <div class="readout-card">
            <span class="readout-sub" data-i18n="angulationLabel">${getTranslation('angulationLabel')}</span>
            <span class="readout-digit" id="readout-cra-cau">0°</span>
          </div>
        </div>

        <div class="carm-desc-box" id="carm-projection-desc">${getAngioDescription('anterior')}</div>

        <!-- 2D JOYSTICK TRACKPAD -->
        <div class="carm-control-row">
          <div class="joystick-wrapper">
            <div class="joy-label joy-top">CRANIAL (+45°)</div>
            <div class="joy-label joy-bottom">CAUDAL (-45°)</div>
            <div class="joy-label joy-left">RAO (90°)</div>
            <div class="joy-label joy-right">LAO (90°)</div>
            <div class="joystick-pad" id="joystick-pad" title="Açıları joystick gibi ayarlamak için sürükleyin">
              <div class="joy-axis joy-axis-h"></div>
              <div class="joy-axis joy-axis-v"></div>
              <div class="joy-grid-ring joy-ring-30"></div>
              <div class="joy-grid-ring joy-ring-45"></div>
              <div class="joy-origin"></div>
              <div class="joystick-puck" id="joystick-puck"></div>
            </div>
          </div>

          <div class="nudge-cluster">
            <button class="nudge-btn nudge-up" data-nudge="cra" title="Cranial +5°">▲ CRA</button>
            <div class="nudge-mid-row">
              <button class="nudge-btn" data-nudge="rao" title="RAO +5°">◀ RAO</button>
              <button class="nudge-btn nudge-center" id="carm-center-btn" title="Sıfırla (AP 0° / 0°)">AP</button>
              <button class="nudge-btn" data-nudge="lao" title="LAO +5°">LAO ▶</button>
            </div>
            <button class="nudge-btn" data-nudge="cau" title="Caudal -5°">▼ CAU</button>
          </div>
        </div>

        <!-- ANGIOGRAPHY PRESET BUTTONS -->
        <div class="carm-presets-title" data-i18n="carmPresetsTitle">${getTranslation('carmPresetsTitle')}</div>
        <div class="carm-presets-grid">
          <button class="angio-btn" data-angio="spider" title="Sol Ana Koroner (LMCA) Bifurkasyonu & Ostial LAD/LCx">
            <span class="angio-name">Spider</span><span class="angio-deg">LAO 45 / CAU 30</span>
          </button>
          <button class="angio-btn" data-angio="rao_cranial" title="LAD Orta-Distal ve Diagonaller (D1, D2)">
            <span class="angio-name">RAO Cranial</span><span class="angio-deg">RAO 30 / CRA 30</span>
          </button>
          <button class="angio-btn" data-angio="lao_cranial" title="LAD Septal Dallar & Distal RCA Crux/PDA">
            <span class="angio-name">LAO Cranial</span><span class="angio-deg">LAO 45 / CRA 30</span>
          </button>
          <button class="angio-btn" data-angio="rao_caudal" title="LCx Gövdesi ve Obtüz Marjinal (OM) Dallar">
            <span class="angio-name">RAO Caudal</span><span class="angio-deg">RAO 30 / CAU 20</span>
          </button>
          <button class="angio-btn" data-angio="ap_cranial" title="LAD Gövdesinin Uzatılmış Görünümü">
            <span class="angio-name">AP Cranial</span><span class="angio-deg">AP 0 / CRA 35</span>
          </button>
          <button class="angio-btn" data-angio="ap_caudal" title="Sol Ana Koroner ve Proksimal LCx">
            <span class="angio-name">AP Caudal</span><span class="angio-deg">AP 0 / CAU 30</span>
          </button>
          <button class="angio-btn" data-angio="lao" title="RCA C-Loop Profili & Orta RCA">
            <span class="angio-name">LAO 45</span><span class="angio-deg">RCA C-Loop</span>
          </button>
          <button class="angio-btn" data-angio="rao" title="RCA Akut Marjinal Dallar & Orta Segment">
            <span class="angio-name">RAO 30</span><span class="angio-deg">RCA Düz</span>
          </button>
          <button class="angio-btn" data-angio="lateral" title="Sol Yan / LIMA Grefti ve Mid LAD">
            <span class="angio-name">Lateral</span><span class="angio-deg">LAO 90 / 0</span>
          </button>
        </div>

        <div class="carm-footer">
          <button id="fluoroscopy-toggle" class="fluoro-btn" aria-pressed="false">
            <span class="fluoro-icon">☢</span> <span data-i18n="fluoroBtn">${getTranslation('fluoroBtn')}</span>
          </button>
          <div class="carm-quick-actions">
            <button id="carm-veins-toggle" class="carm-sub-btn active" title="Venöz sistemi (SVC, IVC, PV, CS, GCV) gizle / göster">
              <span class="carm-sub-icon">🩸</span> Venler
            </button>
            <button id="carm-conduction-toggle" class="carm-sub-btn active" title="Kalp ileti sistemini (SA, AV, His-Purkinje) gizle / göster">
              <span class="carm-sub-icon">⚡</span> İleti
            </button>
            <button id="carm-valves-toggle" class="carm-sub-btn active" title="Kapak ve papiller yapıları gizle / göster">
              <span class="carm-sub-icon">🤍</span> Kapaklar
            </button>
          </div>
          <div id="catheter-toggles" class="carm-quick-actions" hidden>
            <button id="toggle-pigtail" class="carm-sub-btn active" aria-pressed="true" title="Aortik pigtail kateterini (NCC) gizle / göster">
              <span class="carm-sub-icon">🔵</span> Pigtail
            </button>
            <button id="toggle-cs-cath" class="carm-sub-btn active" aria-pressed="true" title="CS dekapolar diagnostik kateterini gizle / göster">
              <span class="carm-sub-icon">💙</span> CS kateter
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="eyebrow">STRUCTURE SPOTLIGHT</div>
    <div class="structure-index">01 / ANATOMY</div>
    <h2 id="structure-title">Left ventricle</h2>
    <div class="divider"></div>
    <p id="description"></p>
    <div class="clinical">
      <div class="eyebrow">WHY IT MATTERS</div>
      <p id="clinical"></p>
    </div>
    <label class="eyebrow" for="structure-select">INSPECT STRUCTURE</label>
    <select id="structure-select"></select>
    <section id="lesson" hidden>
      <div class="divider"></div>
      <div class="eyebrow">GUIDED EXPLORATION</div>
      <h3 id="lesson-title"></h3>
      <p id="lesson-intro"></p>
      <div id="steps"></div>
      <div id="step-detail"></div>
      <button class="primary" id="next-step">Next landmark →</button>
      <label class="slider-label" for="progress" id="progress-label">Lead ilerletme / Yerleşim <span id="progress-value">100%</span></label>
      <input id="progress" type="range" min="0" max="100" value="100">
      <small id="progress-note">3D transvenöz lead modelleri ve fizyolojik ileti sistemi (CSP/LBBAP) hedefleri eğitim amaçlı modellenmiştir.</small>
    </section>
  </article>
</div>
<footer>
  <span>CARDIAC ANATOMY, CONNECTED.</span>
  <span>Gross structure <i>→</i> Tissue <i>→</i> Intervention</span>
  <span>LOCAL STUDY EDITION / 01</span>
</footer>

<dialog id="references">
  <button id="close-dialog">Close ×</button>
  <h2>Reference library</h2>
  <p>Descriptions grounded in selected supplied PDFs. Page numbers refer to PDF pages where specified. Full audit and limitations: SOURCES.md.</p>
  <div id="reference-list"></div>
  <p><strong>Model limitations:</strong> Heart and vascular meshes now come from the same local cardiovascular.glb. Its upstream author and license have not been verified; this is not attributed to HuBMAP. Cell diagrams and beating remain illustrative. Anatomical source review does not establish clinical simulator validity.</p>
</dialog>

<dialog id="shortcuts-modal">
  <button id="close-shortcuts">Close ×</button>
  <h2 data-i18n="keyboardHelpTitle">${getTranslation('keyboardHelpTitle')}</h2>
  <p class="muted">Fast navigation inspired by neuroanatomy atlas conventions.</p>
  <div class="shortcuts-grid">
    <div class="shortcut-row"><kbd>1</kbd>–<kbd>6</kbd><span data-i18n="modeShortcut">${getTranslation('modeShortcut')}</span></div>
    <div class="shortcut-row"><kbd>A</kbd><span>Anterior View</span></div>
    <div class="shortcut-row"><kbd>P</kbd><span>Posterior View</span></div>
    <div class="shortcut-row"><kbd>R</kbd><span>RAO (Right Anterior Oblique)</span></div>
    <div class="shortcut-row"><kbd>L</kbd><span>LAO (Left Anterior Oblique)</span></div>
    <div class="shortcut-row"><kbd>S</kbd><span>Spider View (LAO 45° / CAU 30° LMCA Angiography)</span></div>
    <div class="shortcut-row"><kbd>C</kbd><span>Toggle C-Arm Angiography Gantry & Joystick</span></div>
    <div class="shortcut-row"><kbd>O</kbd><span>Aortic Root & Cusps View</span></div>
    <div class="shortcut-row"><kbd>0</kbd><span>Reset Camera View</span></div>
    <div class="shortcut-row"><kbd>Space</kbd><span>Toggle Heartbeat Animation</span></div>
    <div class="shortcut-row"><kbd>F</kbd><span data-i18n="flowShortcut">${getTranslation('flowShortcut')}</span></div>
    <div class="shortcut-row"><kbd>N</kbd> / <kbd>→</kbd><span>Next Landmark (Guided Lesson)</span></div>
    <div class="shortcut-row"><kbd>?</kbd><span>Show / Hide Shortcuts Dialog</span></div>
  </div>
</dialog>
`;

const select = document.querySelector('#structure-select');
for (const [id, s] of Object.entries(structures)) {
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = s.title;
  select.append(opt);
}

const hoverBadge = document.querySelector('#hover-badge');
let currentSelectedId = 'lv';
let mode = 'anatomy', step = 0, beating = false;
let isUpdatingRoute = false;

function resolveStructureId(id) {
  return ({
    'pulmonary': 'pa',
    'pulmonary-veins': 'pv',
    'coronary-sinus': 'cs',
    'pvlv': 'piv',
    'myocyte': 'micro',
    'nucleus': 'micro',
    'sarcomere': 'micro',
    'disc': 'micro',
    'aortic-valve': 'aorta',
    'sinus-of-valsalva': 'rcc',
    'left-coronary-cusp': 'lcc',
    'right-coronary-cusp': 'rcc',
    'non-coronary-cusp': 'ncc'
  })[id] || id;
}

function inspect(id, flyTo = true, updateUrl = true) {
  const cleanId = resolveStructureId(id);
  const s = structures[cleanId];
  if (!s) return;
  currentSelectedId = cleanId;
  select.value = cleanId;

  for (const [target, key] of [['structure-title', 'title'], ['description', 'description'], ['clinical', 'clinical']]) {
    const el = document.getElementById(target);
    if (el) el.textContent = s[key] || '';
  }

  heart?.selectStructure(cleanId, flyTo);
  const stMatch = heart?.getState().structures.find(item => item.id === cleanId);
  const indexEl = document.querySelector('.structure-index');
  if (indexEl) {
    if (stMatch) {
      if (stMatch.provenance === 'schematic') {
        indexEl.textContent = getTranslation('provenanceSchematic');
        indexEl.dataset.provenance = 'schematic';
      } else {
        indexEl.textContent = getTranslation('provenanceAtlas');
        indexEl.dataset.provenance = 'atlas';
      }
    } else {
      indexEl.textContent = getTranslation('provenanceReference');
      indexEl.dataset.provenance = 'reference';
    }
  }

  if (updateUrl && !isUpdatingRoute) {
    syncUrl();
  }
}

function onHoverStructure(id) {
  if (!id) {
    hoverBadge.hidden = true;
    return;
  }
  const cleanId = resolveStructureId(id);
  const s = structures[cleanId];
  if (s) {
    hoverBadge.textContent = s.title;
    hoverBadge.hidden = false;
  } else {
    hoverBadge.hidden = true;
  }
}

let heart;
try {
  heart = createHeart(
    document.querySelector('#viewport'),
    (id) => inspect(id, true, true),
    onHoverStructure,
    (angles) => updateJoystickFromCamera(angles)
  );
  window.heart = heart;
} catch (error) {
  document.querySelector('#viewport').innerHTML = '<div class="error">3D view unavailable. Enable WebGL or use a supported browser. Anatomy notes and guided lessons remain available.</div>';
  console.error(error);
}

function updateCycleUI(state) {
  if (!state) return;
  beating = state.playing;
  const isTr = getContentLanguage() === 'tr';
  const beatBtn = document.querySelector('#beat');
  if (beatBtn) {
    beatBtn.setAttribute('aria-pressed', String(state.playing));
    const label = state.playing ? getTranslation('beatPause') : getTranslation('beatAnimate');
    beatBtn.innerHTML = `${label} <kbd>Space</kbd>`;
  }
  const scrubber = document.querySelector('#cycle-scrubber');
  if (scrubber && document.activeElement !== scrubber) {
    scrubber.value = (state.phase * 100).toFixed(1);
  }
  const phaseTag = document.querySelector('#cycle-phase-val');
  if (phaseTag) {
    phaseTag.textContent = `%${Math.round(state.phase * 100)}`;
  }
  const badge = document.querySelector('#cycle-interval-name');
  if (badge && state.interval) {
    badge.textContent = isTr ? state.interval.nameTr : state.interval.name;
  }
  const valveState = document.querySelector('#ecg-valve-state');
  if (valveState) valveState.textContent = formatValveSync(state.interval, isTr ? 'tr' : 'en');
  const bpmVal = document.querySelector('#cycle-bpm-val');
  if (bpmVal) {
    bpmVal.textContent = state.bpm;
  }
  const bpmSlider = document.querySelector('#cycle-bpm');
  if (bpmSlider && document.activeElement !== bpmSlider) {
    bpmSlider.value = state.bpm;
  }
  const rhythmSelect = document.querySelector('#cycle-rhythm');
  if (rhythmSelect && document.activeElement !== rhythmSelect) {
    rhythmSelect.value = state.rhythm;
  }
  document.querySelectorAll('.cycle-preset-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.bpm) === state.bpm);
  });
  drawEcgTrace(document.querySelector('#ecg-canvas'), state);
}

heart?.subscribeCycle(updateCycleUI);
heart?.ready.then(() => inspect(currentSelectedId, false, false)).catch(error => console.error('Atlas loading failed:', error));
select.addEventListener('change', () => inspect(select.value));
function formatWallReadout(value) {
  const amount = Number(value);
  return amount ? `${amount}% ${getTranslation('wallSection')}` : getTranslation('wallClosed');
}

document.querySelectorAll('[data-wall]').forEach(input => input.addEventListener('input', () => {
  heart?.setWallCut(input.dataset.wall, Number(input.value) / 100);
  const out = document.querySelector(`#wall-value-${input.dataset.wall}`);
  if (out) out.textContent = formatWallReadout(input.value);
}));
document.querySelector('#restore-walls').addEventListener('click', () => {
  document.querySelectorAll('[data-wall]').forEach(input => {
    input.value = 0;
    heart?.setWallCut(input.dataset.wall, 0);
    const out = document.querySelector(`#wall-value-${input.dataset.wall}`);
    if (out) out.textContent = formatWallReadout(0);
  });
});
document.querySelector('#coronary-system').addEventListener('change', e => {heart?.setCoronarySystem(e.target.value);const value=e.target.value==='all'?100:20;heart?.setOpacity(value/100);document.querySelector('#opacity').value=value;document.querySelector('#opacity-value').textContent=`${value}%`;});
document.querySelector('#root-window').addEventListener('change', e => heart?.setRootWindow(e.target.checked));

function showStep() {
  const isPacemaker = mode === 'pacemaker';
  const isBachmann = mode === 'bachmann';
  const isTransseptal = mode === 'transseptal';
  const hasProgress = isPacemaker || isTransseptal || (isBachmann && step > 0);
  const progressEl = document.querySelector('#progress');
  const progressLabel = document.querySelector('#progress-label');
  const progressNote = document.querySelector('#progress-note');
  if (progressEl) progressEl.hidden = !hasProgress;
  if (progressLabel) progressLabel.hidden = !hasProgress;
  if (progressNote) progressNote.hidden = !hasProgress;
  const cathToggles = document.querySelector('#catheter-toggles');
  if (cathToggles) cathToggles.hidden = !isTransseptal;

  const lesson = lessons[mode];
  if (!lesson) return;
  const s = lesson.steps[step];
  document.querySelector('#step-detail').textContent = s.text;
  document.querySelector('#steps').innerHTML = lesson.steps.map((st, i) => `<button data-step="${i}" class="${i === step ? 'current' : ''}">${i + 1}. ${st.title}</button>`).join('');
  const isLast = step === lesson.steps.length - 1;
  const nextBtnText = isLast ? getTranslation('restartExploration') : getTranslation('nextLandmark');
  document.querySelector('#next-step').textContent = nextBtnText;

  if (hasProgress) {
    if (progressEl) progressEl.value = 100;
    document.querySelector('#progress-value').textContent = '100%';
    heart?.setProgress(1.0);
    if (isBachmann) heart?.setBachmannStep(step);
    else if (isPacemaker) heart?.setPacemakerStep(step);
    else heart?.setTransseptalStep(step);
  } else if (isBachmann) {
    heart?.setBachmannStep(step);
  } else if (mode === 'ablation') {
    heart?.setAblationStep(step);
  }

  if (s.view) {
    heart?.setView(s.view, true);
  }
  if (s.landmark) {
    inspect(s.landmark, !s.view, true);
  }
}

const carmPanel = document.querySelector('#carm-panel');
const carmToggleBtn = document.querySelector('#carm-toggle-btn');
const carmDockBtn = document.querySelector('#carm-toggle-dock');
const carmHeader = document.querySelector('#carm-header');

function setCarmPanelOpen(open) {
  if (!carmPanel) return;
  carmPanel.classList.toggle('collapsed', !open);
  if (carmToggleBtn) carmToggleBtn.textContent = open ? '−' : '+';
}

function toggleCarmPanel() {
  if (!carmPanel) return;
  const isCollapsed = carmPanel.classList.contains('collapsed');
  setCarmPanelOpen(isCollapsed);
}

carmToggleBtn?.addEventListener('click', toggleCarmPanel);
carmDockBtn?.addEventListener('click', toggleCarmPanel);

function setMode(newMode, updateUrl = true) {
  mode = newMode;
  step = 0;
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  heart?.setMode(mode);
  document.querySelector('main .pill').textContent = mode === 'bachmann'
    ? 'BACHMANN · SCHEMATIC ANATOMY & PACING'
    : 'ATLAS MESH · SHARED COORDINATES';

  if (mode === 'angiography' || mode === 'transseptal' || mode === 'bachmann') {
    setCarmPanelOpen(true);
  } else {
    setCarmPanelOpen(false);
  }

  const opacity = lessons[mode] ? Math.round(LESSON_TISSUE_OPACITY * 100) : 100;
  document.querySelector('#opacity').value = opacity;
  document.querySelector('#opacity-value').textContent = `${opacity}%`;
  heart?.setOpacity(opacity / 100);
  document.querySelector('#viewer-title').textContent = getViewerTitle(mode);

  const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
  if (activeBtn) {
    const modeName = activeBtn.querySelector('.mode-label')?.textContent || '';
    document.querySelector('#mode-label').textContent = `${getTranslation('explorerPrefix')} / ${modeName.toUpperCase()}`;
  }

  document.querySelector('#layers').hidden = mode === 'micro';
  document.querySelector('#lesson').hidden = !lessons[mode];

  if (lessons[mode]) {
    document.querySelector('#lesson-title').textContent = lessons[mode].title;
    document.querySelector('#lesson-intro').textContent = lessons[mode].intro;
    showStep();
  } else {
    inspect(mode === 'micro' ? 'micro' : 'lv', true, false);
  }

  if (updateUrl && !isUpdatingRoute) {
    syncUrl();
  }
}

// URL Hash Routing
function syncUrl() {
  const hash = `#/mode/${mode}?structure=${currentSelectedId}`;
  if (window.location.hash !== hash) {
    history.replaceState(null, '', hash);
  }
}

function handleHashChange() {
  const hash = window.location.hash;
  if (!hash || hash === '#/') return;

  isUpdatingRoute = true;
  try {
    const match = hash.match(/#\/mode\/([a-z]+)/i);
    const targetMode = match ? match[1] : null;

    const urlParams = new URLSearchParams(hash.split('?')[1] || '');
    const targetStructure = urlParams.get('structure') || (hash.match(/#\/structure\/([a-z0-9_-]+)/i)?.[1]);

    if (targetMode && modes.some(([id]) => id === targetMode)) {
      if (targetMode !== mode) setMode(targetMode, false);
    }

    if (targetStructure && structures[targetStructure]) {
      inspect(targetStructure, true, false);
    }
  } finally {
    isUpdatingRoute = false;
  }
}

window.addEventListener('hashchange', handleHashChange);
if (window.location.hash && window.location.hash !== '#/') {
  // Deferred: a lesson-mode deep link triggers setView -> joystick sync,
  // which reads consts (pad, puck) declared later in this module (TDZ crash).
  queueMicrotask(handleHashChange);
} else {
  inspect('lv', false, true);
}

document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  setMode(button.dataset.mode);
}));

const chambersBox = document.querySelector('[data-layer="chambers"]');
const subBoxes = ['lv', 'rv', 'la', 'ra'].map(id => document.querySelector(`[data-layer="${id}"]`)).filter(Boolean);

chambersBox?.addEventListener('change', () => {
  const isChecked = chambersBox.checked;
  subBoxes.forEach(b => {
    b.checked = isChecked;
  });
  heart?.setLayer('chambers', isChecked);
});

subBoxes.forEach(b => {
  b.addEventListener('change', () => {
    heart?.setLayer(b.dataset.layer, b.checked);
    if (chambersBox) {
      const anyChecked = subBoxes.some(x => x.checked);
      const allChecked = subBoxes.every(x => x.checked);
      chambersBox.checked = allChecked;
      chambersBox.indeterminate = anyChecked && !allChecked;
    }
  });
});

document.querySelectorAll('[data-layer]:not([data-layer="chambers"]):not([data-layer="lv"]):not([data-layer="rv"]):not([data-layer="la"]):not([data-layer="ra"]):not([data-layer="veins"]):not([data-layer="conduction"]):not([data-layer="valves"]):not([data-layer="aortic-valve"]):not([data-layer="mitral"]):not([data-layer="tricuspid"]):not([data-layer="pulmonary-valve"]):not([data-layer="papillary"]):not([data-layer="flow"])').forEach(el => {
  el.addEventListener('change', () => heart?.setLayer(el.dataset.layer, el.checked));
});

// C-Arm panel is docked in the Structure Spotlight column; header click toggles collapse.
carmHeader?.addEventListener('click', e => {
  if (e.target.closest('button')) return;
  toggleCarmPanel();
});

// Quick toggles for Veins and Conduction System
let veinsVisible = true;
const carmVeinsToggle = document.querySelector('#carm-veins-toggle');
const veinsCheckbox = document.querySelector('input[data-layer="veins"]');

function setVeinsState(visible) {
  veinsVisible = visible;
  heart?.setVeinsVisible(veinsVisible);
  if (veinsCheckbox) veinsCheckbox.checked = veinsVisible;
  document.querySelectorAll('[data-layer="cs"], [data-layer="gcv"], [data-layer="mcv"], [data-layer="piv"], [data-layer="pv"], [data-layer="svc"], [data-layer="ivc"]').forEach(cb => {
    cb.checked = visible;
  });
  if (carmVeinsToggle) {
    carmVeinsToggle.classList.toggle('active', veinsVisible);
    carmVeinsToggle.innerHTML = `<span class="carm-sub-icon">🩸</span> ${veinsVisible ? getTranslation('veinsBtn') : getTranslation('veinsHiddenBtn')}`;
  }
}

carmVeinsToggle?.addEventListener('click', () => {
  setVeinsState(!veinsVisible);
});
veinsCheckbox?.addEventListener('change', () => {
  setVeinsState(veinsCheckbox.checked);
});

let conductionVisible = true;
const carmConductionToggle = document.querySelector('#carm-conduction-toggle');
const conductionCheckbox = document.querySelector('input[data-layer="conduction"]');

function setConductionState(visible) {
  conductionVisible = visible;
  heart?.setConductionVisible(conductionVisible);
  if (conductionCheckbox) conductionCheckbox.checked = conductionVisible;
  if (carmConductionToggle) {
    carmConductionToggle.classList.toggle('active', conductionVisible);
    carmConductionToggle.innerHTML = `<span class="carm-sub-icon">⚡</span> ${conductionVisible ? getTranslation('conductionBtn') : getTranslation('conductionHiddenBtn')}`;
  }
}

carmConductionToggle?.addEventListener('click', () => {
  setConductionState(!conductionVisible);
});
conductionCheckbox?.addEventListener('change', () => {
  setConductionState(conductionCheckbox.checked);
});

let valvesVisible = true;
const carmValvesToggle = document.querySelector('#carm-valves-toggle');
const valvesCheckbox = document.querySelector('input[data-layer="valves"]');
const valveSubBoxes = ['aortic-valve', 'mitral', 'mitral-posterior', 'mitral-anterior', 'tricuspid', 'tricuspid-septal', 'tricuspid-inferior', 'tricuspid-anterior', 'mitral-annulus', 'tricuspid-annulus', 'pulmonary-valve', 'papillary'].map(id => document.querySelector(`input[data-layer="${id}"]`)).filter(Boolean);

function setValvesState(visible) {
  valvesVisible = visible;
  heart?.setValvesVisible(valvesVisible);
  if (valvesCheckbox) {
    valvesCheckbox.checked = valvesVisible;
    valvesCheckbox.indeterminate = false;
  }
  valveSubBoxes.forEach(b => b.checked = valvesVisible);
  if (carmValvesToggle) {
    carmValvesToggle.classList.toggle('active', valvesVisible);
    carmValvesToggle.innerHTML = `<span class="carm-sub-icon">🤍</span> ${valvesVisible ? getTranslation('valvesBtn') : getTranslation('valvesHiddenBtn')}`;
  }
}

valvesCheckbox?.addEventListener('change', () => {
  setValvesState(valvesCheckbox.checked);
});

valveSubBoxes.forEach(b => {
  b.addEventListener('change', () => {
    heart?.setLayer(b.dataset.layer, b.checked);
    if (valvesCheckbox) {
      const anyChecked = valveSubBoxes.some(x => x.checked);
      const allChecked = valveSubBoxes.every(x => x.checked);
      valvesCheckbox.checked = allChecked;
      valvesCheckbox.indeterminate = anyChecked && !allChecked;
      valvesVisible = anyChecked;
      if (carmValvesToggle) {
        carmValvesToggle.classList.toggle('active', valvesVisible);
        carmValvesToggle.innerHTML = `<span class="carm-sub-icon">🤍</span> ${valvesVisible ? getTranslation('valvesBtn') : getTranslation('valvesHiddenBtn')}`;
      }
    }
  });
});

carmValvesToggle?.addEventListener('click', () => {
  setValvesState(!valvesVisible);
});

let isDraggingPuck = false;
const pad = document.querySelector('#joystick-pad');
const puck = document.querySelector('#joystick-puck');

function setPuckFromAngles(laoRao, craCau) {
  if (!pad || !puck || isDraggingPuck) return;
  const rect = pad.getBoundingClientRect();
  const halfW = (rect.width || 116) / 2 - 11;
  const halfH = (rect.height || 84) / 2 - 11;

  const px = THREE.MathUtils.clamp((laoRao / 90) * halfW, -halfW, halfW);
  const py = THREE.MathUtils.clamp((-craCau / 45) * halfH, -halfH, halfH);

  puck.style.transform = `translate(${px}px, ${py}px)`;
}

function handleJoystickPointer(e) {
  if (!pad) return;
  const rect = pad.getBoundingClientRect();
  const halfW = rect.width / 2;
  const halfH = rect.height / 2;
  const cx = rect.left + halfW;
  const cy = rect.top + halfH;

  const dx = THREE.MathUtils.clamp(e.clientX - cx, -halfW, halfW);
  const dy = THREE.MathUtils.clamp(e.clientY - cy, -halfH, halfH);

  const laoRao = Math.round((dx / halfW) * 90);
  const craCau = Math.round((-dy / halfH) * 45);

  const puckX = THREE.MathUtils.clamp((dx / halfW) * (halfW - 11), -(halfW - 11), halfW - 11);
  const puckY = THREE.MathUtils.clamp((dy / halfH) * (halfH - 11), -(halfH - 11), halfH - 11);
  puck.style.transform = `translate(${puckX}px, ${puckY}px)`;

  heart?.setAngioProjection(laoRao, craCau, false);
}

pad?.addEventListener('pointerdown', e => {
  isDraggingPuck = true;
  pad.setPointerCapture(e.pointerId);
  handleJoystickPointer(e);
});

pad?.addEventListener('pointermove', e => {
  if (!isDraggingPuck) return;
  handleJoystickPointer(e);
});

const stopPuckDrag = e => {
  if (!isDraggingPuck) return;
  isDraggingPuck = false;
  try { pad.releasePointerCapture(e.pointerId); } catch (_) {}
};
pad?.addEventListener('pointerup', stopPuckDrag);
pad?.addEventListener('pointercancel', stopPuckDrag);

document.querySelectorAll('[data-nudge]').forEach(btn => {
  btn.addEventListener('click', () => {
    const current = heart?.getAngioAngles() || { laoRao: 0, craCau: 0 };
    let { laoRao, craCau } = current;
    const nudge = btn.dataset.nudge;
    if (nudge === 'cra') craCau = Math.min(45, craCau + 5);
    else if (nudge === 'cau') craCau = Math.max(-45, craCau - 5);
    else if (nudge === 'lao') laoRao = Math.min(90, laoRao + 5);
    else if (nudge === 'rao') laoRao = Math.max(-90, laoRao - 5);
    heart?.setAngioProjection(laoRao, craCau, true);
  });
});

document.querySelector('#carm-center-btn')?.addEventListener('click', () => {
  heart?.setAngioProjection(0, 0, true);
});

document.querySelectorAll('[data-angio]').forEach(btn => {
  btn.addEventListener('click', () => {
    const angioKey = btn.dataset.angio;
    heart?.setView(angioKey, true);
    document.querySelectorAll('[data-angio]').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('selected', b.dataset.view === angioKey));
    const angioText = getAngioDescription(angioKey);
    if (angioText) {
      const descEl = document.querySelector('#carm-projection-desc');
      if (descEl) descEl.textContent = angioText;
    }
  });
});

let fluoroActive = false;
const fluoroBtn = document.querySelector('#fluoroscopy-toggle');
fluoroBtn?.addEventListener('click', () => {
  fluoroActive = !fluoroActive;
  heart?.setFluoroscopy(fluoroActive);
  fluoroBtn.setAttribute('aria-pressed', String(fluoroActive));
  fluoroBtn.classList.toggle('active', fluoroActive);
  document.querySelector('main')?.classList.toggle('fluoroscopy-active', fluoroActive);
});

function updateJoystickFromCamera(angles) {
  const { laoRao, craCau, laoRaoStr, craCauStr, label } = angles;
  const badge = document.querySelector('#carm-angle-badge');
  if (badge) badge.textContent = label;
  const laoRaoEl = document.querySelector('#readout-lao-rao');
  if (laoRaoEl) laoRaoEl.textContent = laoRaoStr;
  const craCauEl = document.querySelector('#readout-cra-cau');
  if (craCauEl) craCauEl.textContent = craCauStr;

  setPuckFromAngles(laoRao, craCau);

  const presets = {
    spider: { laoRao: 45, craCau: -30 },
    rao_cranial: { laoRao: -30, craCau: 30 },
    lao_cranial: { laoRao: 45, craCau: 30 },
    rao_caudal: { laoRao: -30, craCau: -20 },
    ap_cranial: { laoRao: 0, craCau: 35 },
    ap_caudal: { laoRao: 0, craCau: -30 },
    lao: { laoRao: 45, craCau: 0 },
    rao: { laoRao: -30, craCau: 0 },
    lateral: { laoRao: 90, craCau: 0 },
    anterior: { laoRao: 0, craCau: 0 }
  };
  let matchedPreset = null;
  for (const [key, p] of Object.entries(presets)) {
    if (Math.abs(laoRao - p.laoRao) <= 4 && Math.abs(craCau - p.craCau) <= 4) {
      matchedPreset = key;
      break;
    }
  }

  document.querySelectorAll('[data-angio]').forEach(b => {
    b.classList.toggle('active', b.dataset.angio === matchedPreset);
  });

  const descEl = document.querySelector('#carm-projection-desc');
  if (descEl) {
    if (matchedPreset && getAngioDescription(matchedPreset)) {
      descEl.textContent = getAngioDescription(matchedPreset);
    } else {
      descEl.textContent = getAngioDescription('custom', { laoRaoStr, craCauStr });
    }
  }
}

function setCameraPreset(viewName) {
  heart?.setView(viewName, true);
  if (viewName === 'root') document.querySelector('#root-window').checked = true;
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('selected', b.dataset.view === viewName));
  const presetText = getAngioDescription(viewName);
  if (presetText) {
    const descEl = document.querySelector('#carm-projection-desc');
    if (descEl) descEl.textContent = presetText;
  }
}

document.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', () => {
  setCameraPreset(el.dataset.view);
}));

document.querySelector('#opacity').addEventListener('input', e => {
  heart?.setOpacity(Number(e.target.value) / 100);
  document.querySelector('#opacity-value').textContent = `${e.target.value}%`;
});

function toggleBeat() {
  const state = heart?.getCycleState();
  const nextPlaying = !state?.playing;
  heart?.setBeating(nextPlaying);
}

document.querySelector('#beat').addEventListener('click', toggleBeat);

function toggleFlow() {
  const nextVisible = !heart?.getFlowVisible();
  heart?.setFlowVisible(nextVisible);
  const flowBtn = document.querySelector('#flow-toggle');
  if (flowBtn) {
    flowBtn.classList.toggle('active', nextVisible);
    flowBtn.setAttribute('aria-pressed', String(nextVisible));
  }
  const flowBox = document.querySelector('input[data-layer="flow"]');
  if (flowBox) flowBox.checked = nextVisible;
}

document.querySelector('#flow-toggle')?.addEventListener('click', toggleFlow);

const flowCheckbox = document.querySelector('input[data-layer="flow"]');
if (flowCheckbox) {
  flowCheckbox.addEventListener('change', e => {
    heart?.setFlowVisible(e.target.checked);
    const flowBtn = document.querySelector('#flow-toggle');
    if (flowBtn) {
      flowBtn.classList.toggle('active', e.target.checked);
      flowBtn.setAttribute('aria-pressed', String(e.target.checked));
    }
  });
}

document.querySelector('#cycle-scrubber')?.addEventListener('input', e => {
  heart?.seekCycle(Number(e.target.value) / 100);
});

document.querySelector('#cycle-bpm')?.addEventListener('input', e => {
  heart?.setBpm(Number(e.target.value));
});

document.querySelectorAll('.cycle-preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    heart?.setBpm(Number(btn.dataset.bpm));
  });
});

document.querySelector('#cycle-rhythm')?.addEventListener('change', e => {
  heart?.setRhythm(e.target.value);
});

function resetAll() {
  setMode('anatomy');
  heart?.reset();
  const rw = document.querySelector('#root-window');
  if (rw) rw.checked = false;
  const cs = document.querySelector('#coronary-system');
  if (cs) cs.value = 'all';

  const opacityEl = document.querySelector('#opacity');
  if (opacityEl) opacityEl.value = 100;
  const opacityValEl = document.querySelector('#opacity-value');
  if (opacityValEl) opacityValEl.textContent = '100%';
  heart?.setOpacity(1);

  document.querySelectorAll('[data-wall]').forEach(input => {
    input.value = 0;
    const out = document.querySelector(`#wall-value-${input.dataset.wall}`);
    if (out) out.textContent = formatWallReadout(0);
  });

  setVeinsState(true);
  setConductionState(true);
  setValvesState(true);
  syncLayerCheckboxesFromHeart();

  fluoroActive = false;
  if (fluoroBtn) {
    fluoroBtn.setAttribute('aria-pressed', 'false');
    fluoroBtn.classList.remove('active');
  }
  document.querySelector('main')?.classList.remove('fluoroscopy-active');

  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('selected', b.dataset.view === 'anterior'));
  document.querySelectorAll('[data-angio]').forEach(b => b.classList.remove('active'));

  const flowBtn = document.querySelector('#flow-toggle');
  if (flowBtn) {
    flowBtn.classList.add('active');
    flowBtn.setAttribute('aria-pressed', 'true');
  }
  const flowBox = document.querySelector('input[data-layer="flow"]');
  if (flowBox) flowBox.checked = true;

  const descEl = document.querySelector('#carm-projection-desc');
  if (descEl) descEl.textContent = getAngioDescription('anterior');
}

function syncLayerCheckboxesFromHeart() {
  const vis = heart?.getState().visibility;
  if (!vis) return;
  document.querySelectorAll('input[data-layer]').forEach(el => {
    const id = el.dataset.layer;
    if (Object.prototype.hasOwnProperty.call(vis, id)) {
      el.checked = vis[id] !== false;
      el.indeterminate = false;
    }
  });
  if (chambersBox) {
    const anyChecked = subBoxes.some(box => box.checked);
    const allChecked = subBoxes.every(box => box.checked);
    chambersBox.checked = allChecked;
    chambersBox.indeterminate = anyChecked && !allChecked;
  }
  if (valvesCheckbox) {
    const anyChecked = valveSubBoxes.some(box => box.checked);
    const allChecked = valveSubBoxes.length > 0 && valveSubBoxes.every(box => box.checked);
    valvesCheckbox.checked = allChecked;
    valvesCheckbox.indeterminate = anyChecked && !allChecked;
  }
}

document.querySelector('#reset')?.addEventListener('click', resetAll);

function applyChromeTranslations() {
  document.documentElement.lang = getContentLanguage();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = getTranslation(el.dataset.i18n);
  });
  const labels = new Map(getUiModes().map(([id, , label]) => [id, label]));
  document.querySelectorAll('[data-mode]').forEach(btn => {
    const labelEl = btn.querySelector('.mode-label');
    const label = labels.get(btn.dataset.mode);
    if (labelEl && label) labelEl.textContent = label;
  });
  const title = document.querySelector('#viewer-title');
  if (title) title.textContent = getViewerTitle(mode);
  const opacityInput = document.querySelector('#opacity');
  if (opacityInput) opacityInput.setAttribute('aria-label', getTranslation('opacityLabel'));
  const wallKeys = { rv: 'wallRv', lv: 'wallLv', la: 'wallLa', ra: 'wallRa' };
  document.querySelectorAll('[data-wall]').forEach(input => {
    const key = wallKeys[input.dataset.wall];
    if (key) input.setAttribute('aria-label', getTranslation(key));
    const out = document.querySelector(`#wall-value-${input.dataset.wall}`);
    if (out) out.textContent = formatWallReadout(input.value);
  });
  const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
  const modeName = activeBtn?.querySelector('.mode-label')?.textContent || '';
  const modeLabel = document.querySelector('#mode-label');
  if (modeLabel && modeName) modeLabel.textContent = `${getTranslation('explorerPrefix')} / ${modeName.toUpperCase()}`;
  const angles = heart?.getAngioAngles?.();
  if (angles) updateJoystickFromCamera(angles);
}

function updateLanguageUI() {
  applyChromeTranslations();
  const currentLang = getContentLanguage();
  const langBtn = document.querySelector('#lang-btn');
  if (langBtn) langBtn.textContent = currentLang.toUpperCase();

  const flowBtn = document.querySelector('#flow-toggle');
  if (flowBtn) {
    flowBtn.innerHTML = `${getTranslation('flowToggleBtn')} <kbd>F</kbd>`;
    flowBtn.title = getTranslation('flowToggleTitle');
  }
  const disclaimerEl = document.querySelector('.cycle-disclaimer');
  if (disclaimerEl) {
    disclaimerEl.textContent = getTranslation('cycleDisclaimer');
  }
  const flowLegendEl = document.querySelector('.flow-legend');
  if (flowLegendEl) {
    flowLegendEl.title = getTranslation('flowLegendTitle');
  }

  const selectEl = document.querySelector('#structure-select');
  if (selectEl) {
    const prevVal = selectEl.value || currentSelectedId;
    selectEl.innerHTML = '';
    for (const [id, s] of Object.entries(structures)) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = s.title;
      selectEl.append(opt);
    }
    selectEl.value = prevVal;
  }

  inspect(currentSelectedId, false, false);

  if (lessons[mode]) {
    const lessonTitleEl = document.querySelector('#lesson-title');
    if (lessonTitleEl) lessonTitleEl.textContent = lessons[mode].title;
    const lessonIntroEl = document.querySelector('#lesson-intro');
    if (lessonIntroEl) lessonIntroEl.textContent = lessons[mode].intro;
    showStep();
  }

  if (carmVeinsToggle) {
    carmVeinsToggle.innerHTML = `<span class="carm-sub-icon">🩸</span> ${veinsVisible ? getTranslation('veinsBtn') : getTranslation('veinsHiddenBtn')}`;
  }
  if (carmConductionToggle) {
    carmConductionToggle.innerHTML = `<span class="carm-sub-icon">⚡</span> ${conductionVisible ? getTranslation('conductionBtn') : getTranslation('conductionHiddenBtn')}`;
  }
  if (carmValvesToggle) {
    carmValvesToggle.innerHTML = `<span class="carm-sub-icon">🤍</span> ${valvesVisible ? getTranslation('valvesBtn') : getTranslation('valvesHiddenBtn')}`;
  }

  const progressLabelEl = document.querySelector('#progress-label');
  if (progressLabelEl) {
    const val = document.querySelector('#progress')?.value || 100;
    progressLabelEl.innerHTML = `${getTranslation('leadProgressLabel')} <span id="progress-value">${Math.round(val)}%</span>`;
  }
  const progressNoteEl = document.querySelector('#progress-note');
  if (progressNoteEl) {
    progressNoteEl.textContent = getTranslation('leadProgressNote');
  }
  updateCycleUI(heart?.getCycleState());
}

document.querySelector('#lang-btn')?.addEventListener('click', () => {
  const newLang = getContentLanguage() === 'tr' ? 'en' : 'tr';
  setContentLanguage(newLang);
  updateLanguageUI();
});

for (const [btnId, key] of [['#toggle-pigtail', 'pigtail'], ['#toggle-cs-cath', 'cs']]) {
  const btn = document.querySelector(btnId);
  btn?.addEventListener('click', () => {
    const on = !btn.classList.contains('active');
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', String(on));
    heart?.setCatheterVisible(key, on);
  });
}

document.querySelector('#progress').addEventListener('input', e => {
  heart?.setProgress(Number(e.target.value) / 100);
  document.querySelector('#progress-value').textContent = `${Math.round(e.target.value)}%`;
});

function nextLandmark() {
  if (lessons[mode]) {
    step = (step + 1) % lessons[mode].steps.length;
    showStep();
  }
}

document.querySelector('#next-step').addEventListener('click', nextLandmark);

document.querySelector('#steps').addEventListener('click', e => {
  const b = e.target.closest('[data-step]');
  if (b) {
    step = Number(b.dataset.step);
    showStep();
  }
});

// Dialogs
const dialog = document.querySelector('#references');
for (const source of new Set(Object.values(structures).map(s => s.source))) {
  const p = document.createElement('p');
  p.textContent = source;
  document.querySelector('#reference-list').append(p);
}
document.querySelector('#sources').addEventListener('click', () => dialog.showModal());
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());

const shortcutsModal = document.querySelector('#shortcuts-modal');
document.querySelector('#shortcuts-btn').addEventListener('click', () => shortcutsModal.showModal());
document.querySelector('#close-shortcuts').addEventListener('click', () => shortcutsModal.close());

// Keyboard shortcuts (1-5, A, P, R, L, S, C, 0, Space, ?, N)
window.addEventListener('keydown', e => {
  if (dialog.open || shortcutsModal.open) return;
  // Keep text inputs and native dialog controls independent of scene shortcuts.
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

  const key = e.key;

  if (key >= '1' && key <= '7') {
    const modeIndex = parseInt(key, 10) - 1;
    if (modes[modeIndex]) {
      setMode(modes[modeIndex][0]);
    }
  } else if (key === 'a' || key === 'A') {
    setCameraPreset('anterior');
  } else if (key === 'p' || key === 'P') {
    setCameraPreset('posterior');
  } else if (key === 'r' || key === 'R') {
    setCameraPreset('rao');
  } else if (key === 'l' || key === 'L') {
    setCameraPreset('lao');
  } else if (key === 's' || key === 'S') {
    setCameraPreset('spider');
  } else if (key === 'c' || key === 'C') {
    toggleCarmPanel();
  } else if (key === 'o' || key === 'O') {
    setCameraPreset('root');
  } else if (key === '0') {
    resetAll();
  } else if (key === ' ') {
    e.preventDefault();
    toggleBeat();
  } else if (key === 'f' || key === 'F') {
    toggleFlow();
  } else if (key === '?' || key === '/') {
    if (shortcutsModal.open) shortcutsModal.close();
    else shortcutsModal.showModal();
  } else if (key === 'n' || key === 'N' || key === 'ArrowRight') {
    if (lessons[mode]) nextLandmark();
  }
});

// Respect prefers-reduced-motion
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
if (motionQuery.matches) {
  heart?.setReducedMotion(true);
}
motionQuery.addEventListener('change', e => {
  heart?.setReducedMotion(e.matches);
});

applyChromeTranslations();

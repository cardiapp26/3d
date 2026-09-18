import * as THREE from 'three';
import './style.css';
import {createHeart} from './heart.js';
import {structures,lessons,setContentLanguage,getContentLanguage,getTranslation} from './content.js';

const modes = [
  ['anatomy','01','Gross anatomy'],
  ['micro','02','Microstructure'],
  ['angiography','03','Angiography'],
  ['ablation','04','Ablation anatomy'],
  ['pacemaker','05','Pacemaker leads']
];

const app = document.querySelector('#app');
app.innerHTML = `
<header>
  <a class="brand" href="#/">✳ <strong>CARDIA</strong><span>ANATOMY STUDIO</span></a>
  <div class="header-right">
    <span class="dot"></span> Interactive 3D Cardiac Atlas
    <button id="lang-btn" class="lang-btn" title="Dili değiştir / Switch language">${getContentLanguage().toUpperCase()}</button>
    <button id="shortcuts-btn" title="Keyboard shortcuts (?)">Shortcuts <kbd>?</kbd></button>
    <button id="sources">References ↗</button>
  </div>
</header>
<div class="workspace">
  <aside>
    <div class="eyebrow">YOUR WORKSPACE</div>
    <h1>Inside the heart.</h1>
    <p class="muted">Explore structure. Understand relationships.</p>
    <nav aria-label="Learning modes">
      ${modes.map(([id,n,t])=>`<button class="mode ${id==='anatomy'?'active':''}" data-mode="${id}"><span>${n}</span>${t} <kbd class="mode-kbd">${n.replace('0','')}</kbd><b>↗</b></button>`).join('')}
    </nav>
    <section id="layers">
      <div class="section-heading">ANATOMICAL LAYERS <span>08</span></div>
      <label class="layer"><i style="background:#c76260"></i>Chambers<input type="checkbox" data-layer="chambers" checked></label>
      <div class="layer-subgroup">
        ${[
          ['lv', 'Left ventricle (LV)', '#9b3238'],
          ['rv', 'Right ventricle (RV)', '#a43d42'],
          ['la', 'Left atrium (LA)', '#b55157'],
          ['ra', 'Right atrium (RA)', '#aa484e']
        ].map(([id, t, c]) => `<label class="layer sublayer"><i style="background:${c}"></i>${t}<input type="checkbox" data-layer="${id}" checked></label>`).join('')}
      </div>
      <details class="wall-tools" open><summary>Duvar açma pencereleri</summary><p>Atlas duvarları ayrı segmentlemiyor. Bu kontroller bölgesel geometrik kesitlerdir; endokard / miyokard / epikard katmanları değildir.</p>
      ${[['rv','RV ön / serbest duvar yönü'],['lv','LV lateral duvar yönü'],['la','LA posterior duvar yönü'],['ra','RA lateral duvar yönü']].map(([id,label])=>`<label for="wall-${id}">${label}<output id="wall-value-${id}">Kapalı</output></label><input id="wall-${id}" data-wall="${id}" type="range" min="0" max="80" value="0" aria-label="${label}">`).join('')}
      <button id="restore-walls">Duvarları geri getir</button></details>
      ${[
        ['vessels', 'Great vessels (Büyük damarlar)', '#729fca'],
        ['coronaries', 'Coronary circulation (Koronerler)', '#ebba70'],
        ['veins', 'Venöz sistem (Venler)', '#5187a0'],
        ['conduction', 'İleti sistemi (SA, AV, His)', '#f5df76']
      ].map(([id, t, c]) => `<label class="layer"><i style="background:${c}"></i>${t}<input type="checkbox" data-layer="${id}" checked></label>`).join('')}
      <label class="layer"><i style="background:#d6c7bc"></i>Kapak yapıları (Valves)<input type="checkbox" data-layer="valves" checked></label>
      <div class="layer-subgroup">
        ${[
          ['aortic-valve', 'Aort kapağı (LCC, RCC, NCC)', '#d9c5a8'],
          ['mitral', 'Mitral kapak', '#e2d5c4'],
          ['tricuspid', 'Triküspit kapak', '#e2d5c4'],
          ['pulmonary-valve', 'Pulmoner kapak', '#e2d5c4'],
          ['papillary', 'Papiller kaslar (RV / LV)', '#b57368']
        ].map(([id, t, c]) => `<label class="layer sublayer"><i style="background:${c}"></i>${t}<input type="checkbox" data-layer="${id}" checked></label>`).join('')}
      </div>
      <label class="slider-label">Tissue opacity <span id="opacity-value">100%</span></label>
      <input id="opacity" aria-label="Tissue opacity" type="range" min="15" max="100" value="100">
      <div class="coronary-tools"><div class="section-heading">KORONER İNCELEME</div><label for="coronary-system">Damar sistemi</label><select id="coronary-system"><option value="all">Tüm anatomi</option><option value="both">İki koroner sistem</option><option value="left">Sol sistem · LM / LAD / LCx</option><option value="right">Sağ sistem · RCA</option></select><label class="layer"><input id="root-window" type="checkbox"> Aort kökü kesiti</label><small>Kesit üst aort duvarını gizler. Kusp, sinüs duvarı ve ostium farklı yapılardır.</small></div>
    </section>
    <div class="aside-bottom">
      <span class="outline-icon">i</span>
      <p>Atlas anatomy + conceptual lessons<br><small>Not for clinical decision-making</small></p>
    </div>
  </aside>
  <main>
    <div class="viewer-top">
      <div>
        <div class="eyebrow" id="mode-label">EXPLORER / GROSS ANATOMY</div>
        <h2 id="viewer-title">A new perspective.</h2>
      </div>
      <div class="top-badges">
        <span id="hover-badge" class="hover-badge" hidden></span>
        <span class="pill">ATLAS MESH · SHARED COORDINATES</span>
      </div>
    </div>
    <div id="viewport" aria-label="Interactive 3D heart. Drag to rotate, scroll to zoom."></div>

    <!-- C-ARM FLUOROSCOPY & GANTRY JOYSTICK PANEL -->
    <div id="carm-panel" class="carm-panel collapsed" aria-label="C-Arm Angiografi Gantry Kontrolü">
      <div class="carm-header" id="carm-header" title="Paneli serbestçe taşımak için sürükleyin">
        <div class="carm-title-group">
          <span class="carm-drag-handle" title="Paneli sürükleyip taşıyın">⋮⋮</span>
          <span class="carm-led-pulse"></span>
          <span class="carm-title-text">C-ARM GANTRY</span>
          <span class="carm-pill">ANJİOGRAFİ</span>
        </div>
        <div class="carm-angle-badge" id="carm-angle-badge">AP 0° · 0°</div>
        <button id="carm-toggle-btn" class="carm-icon-btn" title="Paneli Küçült / Büyüt">+</button>
      </div>

      <div class="carm-content" id="carm-content">
        <div class="carm-readout-strip">
          <div class="readout-card">
            <span class="readout-sub">OBLİK DÖNÜŞ (LAO / RAO)</span>
            <span class="readout-digit" id="readout-lao-rao">AP 0°</span>
          </div>
          <div class="readout-card">
            <span class="readout-sub">ANGÜLASYON (CRA / CAU)</span>
            <span class="readout-digit" id="readout-cra-cau">0°</span>
          </div>
        </div>

        <div class="carm-desc-box" id="carm-projection-desc">Anteroposterior (AP) Referans Görünümü</div>

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
        <div class="carm-presets-title">STANDART PROJEKSİYONLAR</div>
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
            <span class="fluoro-icon">☢</span> Floroskopi X-Ray Modu
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
        </div>
      </div>
    </div>

    <div class="view-controls" aria-label="Camera presets">
      ${[['anterior','Anterior','A'],['posterior','Posterior','P'],['rao','RAO','R'],['lao','LAO','L'],['spider','Spider','S'],['root','Root & Cusps','O']].map(([id,t,k])=>`<button data-view="${id}" class="${id==='anterior'?'selected':''}">${t} <kbd>${k}</kbd></button>`).join('')}
      <button id="carm-toggle-dock" class="carm-dock-btn" title="C-Arm Gantry & Joystick Paneli">📐 C-Arm <kbd>C</kbd></button>
      <button id="reset" title="Reset camera (0)">↺</button>
    </div>
    <div class="viewer-bottom">
      <span>↔ Drag to rotate <em>·</em> Scroll to zoom <em>·</em> Click to inspect & focus</span>
      <div class="viewer-actions">
        <button id="beat" aria-pressed="false">♡ Animate beat <kbd>Space</kbd></button>
      </div>
    </div>
    <div id="scene-note">Hasta sağı önden görünümde soldadır. Koronerler ve odacıklar aynı atlas koordinatlarını kullanır.</div>
  </main>
  <article>
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
      <label class="slider-label" for="progress">Path preview <span id="progress-value">0%</span></label>
      <input id="progress" type="range" min="0" max="100" value="0">
      <small>Eski kateter yolları bu atlasla kayıtlı değil; gösterilmiyor. Bu bölüm anatomik rehberdir, işlem simülasyonu değildir.</small>
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
  <h2>Keyboard Shortcuts</h2>
  <p class="muted">Fast navigation inspired by neuroanatomy atlas conventions.</p>
  <div class="shortcuts-grid">
    <div class="shortcut-row"><kbd>1</kbd>–<kbd>5</kbd><span>Switch Learning Mode (Anatomy, Micro, Angio, Ablation, Pacemaker)</span></div>
    <div class="shortcut-row"><kbd>A</kbd><span>Anterior View</span></div>
    <div class="shortcut-row"><kbd>P</kbd><span>Posterior View</span></div>
    <div class="shortcut-row"><kbd>R</kbd><span>RAO (Right Anterior Oblique)</span></div>
    <div class="shortcut-row"><kbd>L</kbd><span>LAO (Left Anterior Oblique)</span></div>
    <div class="shortcut-row"><kbd>S</kbd><span>Spider View (LAO 45° / CAU 30° LMCA Angiography)</span></div>
    <div class="shortcut-row"><kbd>C</kbd><span>Toggle C-Arm Angiography Gantry & Joystick</span></div>
    <div class="shortcut-row"><kbd>O</kbd><span>Aortic Root & Cusps View</span></div>
    <div class="shortcut-row"><kbd>0</kbd><span>Reset Camera View</span></div>
    <div class="shortcut-row"><kbd>Space</kbd><span>Toggle Heartbeat Animation</span></div>
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
    'pulmonary-veins': 'la',
    'coronary-sinus': 'cs',
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
heart?.ready.then(() => inspect(currentSelectedId, false, false)).catch(error => console.error('Atlas loading failed:', error));
select.addEventListener('change', () => inspect(select.value));
document.querySelectorAll('[data-wall]').forEach(input => input.addEventListener('input', () => {heart?.setWallCut(input.dataset.wall, Number(input.value)/100);document.querySelector(`#wall-value-${input.dataset.wall}`).textContent = Number(input.value) ? `${input.value}% kesit` : 'Kapalı';}));
document.querySelector('#restore-walls').addEventListener('click', () => {document.querySelectorAll('[data-wall]').forEach(input => {input.value=0;heart?.setWallCut(input.dataset.wall,0);document.querySelector(`#wall-value-${input.dataset.wall}`).textContent='Kapalı';});});
document.querySelector('#coronary-system').addEventListener('change', e => {heart?.setCoronarySystem(e.target.value);const value=e.target.value==='all'?100:20;heart?.setOpacity(value/100);document.querySelector('#opacity').value=value;document.querySelector('#opacity-value').textContent=`${value}%`;});
document.querySelector('#root-window').addEventListener('change', e => heart?.setRootWindow(e.target.checked));

function showStep() {
  document.querySelector('#progress').hidden = true;
  document.querySelector('label[for=progress]').hidden = true;
  const lesson = lessons[mode];
  if (!lesson) return;
  const s = lesson.steps[step];
  document.querySelector('#step-detail').textContent = s.text;
  document.querySelector('#steps').innerHTML = lesson.steps.map((st, i) => `<button data-step="${i}" class="${i === step ? 'current' : ''}">${i + 1}. ${st.title}</button>`).join('');
  document.querySelector('#next-step').textContent = step === lesson.steps.length - 1 ? 'Restart exploration ↺' : 'Next landmark →';
  const p = step / (lesson.steps.length - 1);
  document.querySelector('#progress').value = p * 100;
  document.querySelector('#progress-value').textContent = `${Math.round(p * 100)}%`;
  heart?.setProgress(p);
  if (s.landmark) inspect(s.landmark, true, true);
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

  if (mode === 'angiography') {
    setCarmPanelOpen(true);
  } else {
    setCarmPanelOpen(false);
  }

  const opacity = lessons[mode] ? 28 : 100;
  document.querySelector('#opacity').value = opacity;
  document.querySelector('#opacity-value').textContent = `${opacity}%`;
  document.querySelector('#viewer-title').textContent = {
    anatomy: 'A new perspective.',
    micro: 'From muscle to cell.',
    angiography: 'Read the projection.',
    ablation: 'Map the landmarks.',
    pacemaker: 'Trace the lead.'
  }[mode] || 'Inside the heart.';

  const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
  if (activeBtn) {
    document.querySelector('#mode-label').textContent = `EXPLORER / ${activeBtn.textContent.split('↗')[0].replace(/[0-9]/g, '').trim().toUpperCase()}`;
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

    if (targetMode && ['anatomy', 'micro', 'angiography', 'ablation', 'pacemaker'].includes(targetMode)) {
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
  handleHashChange();
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

document.querySelectorAll('[data-layer]:not([data-layer="chambers"]):not([data-layer="lv"]):not([data-layer="rv"]):not([data-layer="la"]):not([data-layer="ra"]):not([data-layer="veins"]):not([data-layer="conduction"]):not([data-layer="valves"]):not([data-layer="aortic-valve"]):not([data-layer="mitral"]):not([data-layer="tricuspid"]):not([data-layer="pulmonary-valve"]):not([data-layer="papillary"])').forEach(el => {
  el.addEventListener('change', () => heart?.setLayer(el.dataset.layer, el.checked));
});

// --- C-Arm Angiography Gantry & 2D Joystick Logic ---
const angioDescriptions = {
  spider: 'SPIDER VIEW • Sol Ana Koroner (LMCA) bifurkasyonu, osteal LAD & LCx lezyonları için altın standart',
  rao_cranial: 'RAO CRANIAL • LAD orta-distal gövdesi ve diagonal (D1, D2) dalların ayrılması',
  lao_cranial: 'LAO CRANIAL • LAD septal dallar ve distal RCA / crux / PDA bifurkasyonu',
  rao_caudal: 'RAO CAUDAL • LCx gövdesi ve obtüz marjinal (OM) dalların açılması',
  ap_cranial: 'AP CRANIAL • LAD gövdesinin uzatılmış (elongated) projeksiyonu',
  ap_caudal: 'AP CAUDAL • Sol ana koroner ve sirkumfleks arter ostiyumu',
  lao: 'LAO 45 • Sağ koroner arter (RCA) "C" kıvrımı ve orta segment',
  rao: 'RAO 30 • RCA düz profil, akut marjinal dallar',
  lateral: 'LATERAL 90° • Sol lateral görünüm, LIMA grefti ve mid-LAD',
  anterior: 'ANTERIOR (AP) • Anteroposterior temel kardiyak referans',
  posterior: 'POSTERIOR • Kalbin arka yüzeyi ve sol atriyum venöz girişi'
};

// Draggable C-Arm Gantry Panel
let isDraggingPanel = false;
const panelDragOffset = { x: 0, y: 0 };

carmPanel?.addEventListener('pointerdown', e => e.stopPropagation());
carmPanel?.addEventListener('wheel', e => e.stopPropagation());

carmHeader?.addEventListener('pointerdown', e => {
  if (e.target.closest('#carm-toggle-btn') || e.target.closest('button')) return;
  isDraggingPanel = true;
  carmPanel.classList.add('is-dragging');
  carmHeader.setPointerCapture(e.pointerId);
  e.stopPropagation();
  e.preventDefault();

  const panelRect = carmPanel.getBoundingClientRect();
  const mainEl = document.querySelector('main');
  const mainRect = mainEl ? mainEl.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  panelDragOffset.x = e.clientX - panelRect.left;
  panelDragOffset.y = e.clientY - panelRect.top;
});

carmHeader?.addEventListener('pointermove', e => {
  if (!isDraggingPanel || !carmPanel) return;
  e.stopPropagation();
  e.preventDefault();

  const mainEl = document.querySelector('main');
  const mainRect = mainEl ? mainEl.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  const panelRect = carmPanel.getBoundingClientRect();

  let newLeft = e.clientX - mainRect.left - panelDragOffset.x;
  let newTop = e.clientY - mainRect.top - panelDragOffset.y;

  const maxLeft = Math.max(10, mainRect.width - panelRect.width - 10);
  const maxTop = Math.max(10, mainRect.height - panelRect.height - 10);
  newLeft = Math.max(10, Math.min(maxLeft, newLeft));
  newTop = Math.max(10, Math.min(maxTop, newTop));

  carmPanel.style.left = `${newLeft}px`;
  carmPanel.style.top = `${newTop}px`;
  carmPanel.style.bottom = 'auto';
  carmPanel.style.right = 'auto';
});

const stopPanelDrag = e => {
  if (!isDraggingPanel) return;
  isDraggingPanel = false;
  carmPanel?.classList.remove('is-dragging');
  try { carmHeader?.releasePointerCapture(e.pointerId); } catch (_) {}
};
carmHeader?.addEventListener('pointerup', stopPanelDrag);
carmHeader?.addEventListener('pointercancel', stopPanelDrag);

// Quick toggles for Veins and Conduction System
let veinsVisible = true;
const carmVeinsToggle = document.querySelector('#carm-veins-toggle');
const veinsCheckbox = document.querySelector('input[data-layer="veins"]');

function setVeinsState(visible) {
  veinsVisible = visible;
  heart?.setVeinsVisible(veinsVisible);
  if (veinsCheckbox) veinsCheckbox.checked = veinsVisible;
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
const valveSubBoxes = ['aortic-valve', 'mitral', 'tricuspid', 'pulmonary-valve', 'papillary'].map(id => document.querySelector(`input[data-layer="${id}"]`)).filter(Boolean);

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
        carmValvesToggle.innerHTML = `<span class="carm-sub-icon">🤍</span> ${valvesVisible ? 'Kapaklar' : 'Kapaklar (Gizli)'}`;
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
    if (angioDescriptions[angioKey]) {
      const descEl = document.querySelector('#carm-projection-desc');
      if (descEl) descEl.textContent = angioDescriptions[angioKey];
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
    if (matchedPreset && angioDescriptions[matchedPreset]) {
      descEl.textContent = angioDescriptions[matchedPreset];
    } else {
      descEl.textContent = `Özel Açı • ${laoRaoStr} · ${craCauStr}`;
    }
  }
}

function setCameraPreset(viewName) {
  heart?.setView(viewName, true);
  if (viewName === 'root') document.querySelector('#root-window').checked = true;
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('selected', b.dataset.view === viewName));
  if (angioDescriptions[viewName]) {
    const descEl = document.querySelector('#carm-projection-desc');
    if (descEl) descEl.textContent = angioDescriptions[viewName];
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
  beating = !beating;
  heart?.setBeating(beating);
  const btn = document.querySelector('#beat');
  btn.setAttribute('aria-pressed', String(beating));
  btn.innerHTML = beating ? '♡ Pause beat <kbd>Space</kbd>' : '♡ Animate beat <kbd>Space</kbd>';
}

document.querySelector('#beat').addEventListener('click', toggleBeat);

function resetAll() {
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
    if (out) out.textContent = getTranslation('wallClosed') || 'Kapalı';
  });

  if (chambersBox) {
    chambersBox.checked = true;
    chambersBox.indeterminate = false;
  }
  subBoxes.forEach(b => { b.checked = true; });

  document.querySelectorAll('[data-layer]').forEach(el => {
    el.checked = true;
    if (el.indeterminate !== undefined) el.indeterminate = false;
  });

  setVeinsState(true);
  setConductionState(true);
  setValvesState(true);

  fluoroActive = false;
  if (fluoroBtn) {
    fluoroBtn.setAttribute('aria-pressed', 'false');
    fluoroBtn.classList.remove('active');
  }
  document.querySelector('main')?.classList.remove('fluoroscopy-active');

  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('selected', b.dataset.view === 'anterior'));
  document.querySelectorAll('[data-angio]').forEach(b => b.classList.remove('active'));

  const descEl = document.querySelector('#carm-projection-desc');
  if (descEl) descEl.textContent = angioDescriptions.anterior;
}

document.querySelector('#reset')?.addEventListener('click', resetAll);

function updateLanguageUI() {
  const currentLang = getContentLanguage();
  const langBtn = document.querySelector('#lang-btn');
  if (langBtn) langBtn.textContent = currentLang.toUpperCase();

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

  document.querySelectorAll('[data-wall]').forEach(input => {
    const out = document.querySelector(`#wall-value-${input.dataset.wall}`);
    if (out && input.value === '0') {
      out.textContent = getTranslation('wallClosed') || 'Kapalı';
    }
  });

  if (carmVeinsToggle) {
    carmVeinsToggle.innerHTML = `<span class="carm-sub-icon">🩸</span> ${veinsVisible ? getTranslation('veinsBtn') : getTranslation('veinsHiddenBtn')}`;
  }
  if (carmConductionToggle) {
    carmConductionToggle.innerHTML = `<span class="carm-sub-icon">⚡</span> ${conductionVisible ? getTranslation('conductionBtn') : getTranslation('conductionHiddenBtn')}`;
  }
  if (carmValvesToggle) {
    carmValvesToggle.innerHTML = `<span class="carm-sub-icon">🤍</span> ${valvesVisible ? getTranslation('valvesBtn') : getTranslation('valvesHiddenBtn')}`;
  }
}

document.querySelector('#lang-btn')?.addEventListener('click', () => {
  const newLang = getContentLanguage() === 'tr' ? 'en' : 'tr';
  setContentLanguage(newLang);
  updateLanguageUI();
});

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

  if (key >= '1' && key <= '5') {
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
  } else if (key === '?' || key === '/') {
    if (shortcutsModal.open) shortcutsModal.close();
    else shortcutsModal.showModal();
  } else if (key === 'n' || key === 'N' || key === 'ArrowRight') {
    if (lessons[mode]) nextLandmark();
  }
});


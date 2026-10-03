import { createSeptalDefectsPanel } from './septal-defects-panel.js';
import { createPanelShell } from './panel-shell.js';
import { createHeaderTabs } from './header-tabs.js';
import { createQuickSearch, rememberMode } from './quick-search.js';
import { createPractice } from './practice.js';
import { DEFECT_TYPES } from './septal-defects-data.js';
import * as THREE from 'three';
import './style.css';
import {createHeart} from './heart.js';
import {structures,rawStructures,uiTranslations,lessons,setContentLanguage,getContentLanguage,hasExplicitLanguageChoice,getTranslation,getUiModes,getAngioDescription} from './content.js';
import { fetchCountryCode, languageForCountry } from './entry-language.js';
import {LESSON_TISSUE_OPACITY} from './layer-defaults.js';
import {drawEcgTrace, formatValveSync, ecgPhaseAt} from './ecg-trace.js';
import {drawWiggers, formatCycleTiming, wiggersPhaseAt} from './wiggers.js';
import { createHemoMode } from './hemo-mode.js';
import { createExamMode } from './exam-mode.js';
import { createEpPanel } from './ep-panel.js';
import { createEchoMode } from './echo-mode.js';
import {initUpdater, updateUpdaterLanguage} from './updater.js';
import { CHAMBER_MODES, chamberMode, inChamberMode } from './chamber-modes.js';

document.documentElement.lang = getContentLanguage();

// Mode list grouped by learning domain. Mode numbers follow this displayed
// order (content.js carries the same numbers); keys 1-9 open modes 01-09.
const MODE_GROUPS = [
  ['modeGroupAnatomy', ['anatomy', 'atria', 'ra', 'rv', 'lv', 'defects']],
  ['modeGroupPhysiology', ['cath', 'exam']],
  ['modeGroupIntervention', ['angiography']],
  ['modeGroupEp', ['transseptal', 'ablation', 'pacemaker', 'bachmann']],
  ['modeGroupImaging', ['echo', 'tee', 'ice']]
];
// Title with the named side branch under the pointer (coronary branches).
const withBranch = (title, branch) => (branch ? `${title} · ${branch[getContentLanguage()] || branch.en}` : title);

// TTE and TEE are one echo module; the mode fixes the modality.
const ECHO_MODALITY = { echo: 'tte', tee: 'tee', ice: 'ice' };
const modes = MODE_GROUPS.flatMap(([, ids]) => ids).map((id, i) => [id, String(i + 1).padStart(2, '0')]);
const MODE_KEYS = 9;
// Modes whose lesson steps appear as menu entries under the mode itself.
// true lists every step; a function picks the steps to list (the hemodynamics
// mode lists its right heart catheterisation and pressure-volume loop chapters).
const MODE_SUBSTEPS = { ablation: true, cath: step => Boolean(step.menu || step.pvLoop) };

// Right-panel tabs and phone sheets; created once the panels exist.
let panelShell = null;
// Header mode menus and the Layers / Tools drawer (tablet and desktop).
let headerTabs = null;
// Explore / Learn / Test yourself loop; created with the panel shell.
let practice = null;

// Left-panel tools of a single-chamber mode: focus buttons and the wall section slider.
function chamberToolsMarkup(id, { chamber, focus, regions }) {
  const wallKey = `wall${chamber[0].toUpperCase()}${chamber.slice(1)}`;
  return `<section id="${id}-tools" class="chamber-tools" data-chamber-mode="${id}" hidden>
      ${focus.map(([target, key]) => `<button data-chamber-focus="${target}" data-i18n="${key}">${getTranslation(key)}</button>`).join('')}
      ${regions ? `<label class="layer"><i style="background:linear-gradient(90deg,#e06666,#f1c232,#6fa8dc)"></i><span data-i18n="ventricleRegions">${getTranslation('ventricleRegions')}</span><input type="checkbox" data-ventricle-regions checked></label>` : ''}
      <label class="slider-label"><span data-i18n="${wallKey}">${getTranslation(wallKey)}</span><output id="${id}-cut-${chamber}">0%</output></label><input data-chamber-wall="${chamber}" aria-label="${chamber.toUpperCase()} wall section" type="range" min="0" max="80" value="0">
    </section>`;
}

function resetChamberWalls() {
  document.querySelectorAll('[data-chamber-wall]').forEach(input => {
    input.value = 0;
    const out = input.closest('.chamber-tools')?.querySelector('output');
    if (out) out.textContent = '0%';
  });
}

function renderModeNav() {
  const byId = new Map(getUiModes().map(entry => [entry[0], entry]));
  // Only modes 01-09 have a single-key shortcut.
  const button = ([id, n, t]) => `<button class="mode ${id === 'anatomy' ? 'active' : ''}" data-mode="${id}"><span>${n}</span><span class="mode-label">${t}</span> ${Number(n) <= MODE_KEYS ? `<kbd class="mode-kbd">${Number(n)}</kbd>` : ''}<b>↗</b></button>`;
  const grouped = new Set(MODE_GROUPS.flatMap(([, ids]) => ids));
  const rest = getUiModes().filter(([id]) => !grouped.has(id));
  // Each group is a header tab with a drop-down menu; on phones the tab hides
  // and the label heads the list in the Modes sheet.
  // Lesson steps listed directly in the menu, under their mode (the EP
  // group lists the electrophysiological anatomy chapters).
  const subSteps = id => {
    const pick = MODE_SUBSTEPS[id];
    if (!pick) return '';
    return (lessons[id]?.steps || []).map((st, i) => (pick === true || pick(st)
      ? `<button class="mode mode-substep" data-mode="${id}" data-mode-step="${i}"><span class="mode-substep-name">${st.title}</span></button>` : '')).join('');
  };
  const group = ([key, ids]) => `<div class="mode-group" data-mode-group="${key}">
      <button type="button" class="mode-group-tab" aria-haspopup="true" aria-expanded="false" aria-controls="menu-${key}"><span class="mode-group-name" data-i18n="${key}">${getTranslation(key)}</span><span class="mode-group-current"></span><span class="mode-group-caret" aria-hidden="true">▾</span></button>
      <div class="mode-group-label" data-i18n="${key}">${getTranslation(key)}</div>
      <div class="mode-group-menu" id="menu-${key}">${ids.filter(id => byId.has(id)).map(id => button(byId.get(id)) + subSteps(id)).join('')}</div>
    </div>`;
  return MODE_GROUPS.map(group).join('') + rest.map(button).join('');
}
function layerRow(id, key, color, checked = true) {
  return `<label class="layer"><i style="background:${color}"></i><span data-i18n="${key}">${getTranslation(key)}</span><input type="checkbox" data-layer="${id}"${checked ? ' checked' : ''}></label>`;
}
// A layer with substructures: the disclosure button opens the list, the
// checkbox toggles visibility; both are separate controls.
function layerGroup(id, color, children) {
  const subId = `layer-sub-${id}`;
  return `<div class="layer-group" data-group="${id}">
      <div class="layer layer-group-head"><button type="button" class="group-toggle" aria-expanded="false" aria-controls="${subId}" title="${getTranslation('groupToggle')}"><span class="group-caret" aria-hidden="true">▸</span><i style="background:${color}"></i><span data-i18n="${id}">${getTranslation(id)}</span><small class="group-count" data-group-count="${id}">${children.length}/${children.length}</small></button><input type="checkbox" data-layer="${id}" checked aria-label="${getTranslation(id)}"></div>
      <div class="layer-subgroup" id="${subId}" hidden>${children.map(([cid, key, c]) => `<label class="layer sublayer"><i style="background:${c}"></i><span data-i18n="${key}">${getTranslation(key)}</span><input type="checkbox" data-layer="${cid}" checked></label>`).join('')}</div>
    </div>`;
}

// Short dock labels on narrow screens so Ant, Post, RAO and LAO fit without scrolling.
const VIEW_SHORT = { anterior: 'Ant', posterior: 'Post' };
const app = document.querySelector('#app');
app.innerHTML = `
<header>
  <a class="brand" href="#/">✳ <strong>CARDIA</strong><span data-i18n="brandSubtitle">${getTranslation('brandSubtitle')}</span></a>
  <div id="header-search" class="header-search"></div>
  <div class="header-right">
    <span class="dot"></span> <span data-i18n="headerTitle">${getTranslation('headerTitle')}</span>
    <button id="lang-btn" class="lang-btn" title="Dili değiştir / Switch language">${getContentLanguage().toUpperCase()}</button>
    <button id="header-update-btn" class="header-update-btn" title="Güncellemeleri denetle / Check for updates">
      <span class="update-btn-icon">↺</span>
      <span class="update-label" data-i18n="updateBtn">${getTranslation('updateBtn')}</span>
      <span id="header-update-dot" class="update-dot" style="display:none;"></span>
    </button>
    <button id="shortcuts-btn" title="Keyboard shortcuts (?)"><span data-i18n="shortcutsBtn">${getTranslation('shortcutsBtn')}</span> <kbd>?</kbd></button>
    <button id="sources"><span data-i18n="referencesBtn">${getTranslation('referencesBtn')}</span></button>
  </div>
</header>
<div id="header-tabs" class="header-tabs" role="toolbar">
  <nav id="mode-nav" aria-label="Learning modes">${renderModeNav()}</nav>
  <div class="drawer-tabs">
    <button type="button" class="drawer-tab" data-drawer="layers" aria-expanded="false" aria-controls="mobile-aside-sheet"><span class="drawer-tab-icon" aria-hidden="true">◧</span><span class="drawer-tab-label"></span></button>
    <button type="button" class="drawer-tab" data-drawer="tools" aria-expanded="false" aria-controls="mobile-aside-sheet" hidden><span class="drawer-tab-icon" aria-hidden="true">⚒</span><span class="drawer-tab-label"></span></button>
  </div>
</div>
<div class="workspace">
  <aside id="mobile-aside-sheet">
    <div id="aside-search" class="aside-search"></div>
    <section id="defect-tools" hidden></section>
    ${Object.entries(CHAMBER_MODES).map(([id, c]) => chamberToolsMarkup(id, c)).join('')}
    <section id="ep-tools" class="ep-tools" hidden>
      <div class="section-heading"><span data-i18n="epToolsHeading">${getTranslation('epToolsHeading')}</span></div>
      <div class="ep-view-row">${[['koch_rao','RAO 30'],['koch_lao','LAO 45']].map(([id,t])=>`<button type="button" data-ep-view="${id}" aria-pressed="false">Koch · ${t}</button>`).join('')}</div>
      ${[['his','epHisCath','#d946ef',true],['cs','epCsCath','#3b82f6',true],['lesions','epLesions','#ff3b30',false]].map(([id,key,color,on])=>`<label class="layer"><i style="background:${color}"></i><span data-i18n="${key}">${getTranslation(key)}</span><input type="checkbox" data-ep-optional="${id}"${on?' checked':''}></label>`).join('')}
      <p class="ep-note" data-i18n="epNote">${getTranslation('epNote')}</p>
    </section>
    <section id="layers">
      <div class="section-heading"><span data-i18n="layersHeading">${getTranslation('layersHeading')}</span></div>
      ${layerGroup('chambers', '#c76260', [['lv','layerLv','#9b3238'],['rv','layerRv','#a43d42'],['la','layerLa','#b55157'],['ra','layerRa','#aa484e'],['laa','layerLaa','#d9a066']])}
      <details class="wall-tools"><summary data-i18n="wallToolsSummary">${getTranslation('wallToolsSummary')}</summary>
      ${[['rv','wallRv'],['lv','wallLv'],['la','wallLa'],['ra','wallRa']].map(([id,key])=>`<label for="wall-${id}"><span data-i18n="${key}">${getTranslation(key)}</span><output id="wall-value-${id}">${getTranslation('wallClosed')}</output></label><input id="wall-${id}" data-wall="${id}" aria-label="${getTranslation(key)}" type="range" min="0" max="80" value="0">`).join('')}
      <button id="restore-walls" data-i18n="restoreWalls">${getTranslation('restoreWalls')}</button></details>
      ${layerRow('vessels', 'vessels', '#729fca')}
      ${layerRow('coronaries', 'coronaries', '#ebba70')}
      ${layerGroup('veins', '#5187a0', [['cs','layerCs','#5187a0'],['gcv','layerGcv','#679db2'],['mcv','layerMcv','#679db2'],['piv','layerPiv','#679db2'],['pv','layerPv','#b9827a'],['svc','layerSvc','#62889c'],['ivc','layerIvc','#62889c']])}
      ${layerRow('conduction', 'conduction', '#f5df76')}
      ${layerRow('bachmann', 'layerBachmann', '#f6b64b')}
      ${layerGroup('valves', '#d6c7bc', [['aortic-valve','layerAorticValve','#d9c5a8'],['mitral','layerMitral','#e2d5c4'],['mitral-posterior','layerMitralPost','#efe6d8'],['mitral-anterior','layerMitralAnt','#f4efe4'],['tricuspid','layerTricuspid','#e2d5c4'],['tricuspid-septal','layerTvSeptal','#efe6d8'],['tricuspid-inferior','layerTvInferior','#efe6d8'],['tricuspid-anterior','layerTvAnterior','#f4efe4'],['mitral-annulus','layerMitralAnnulus','#f5f3ea'],['tricuspid-annulus','layerTricuspidAnnulus','#f5f3ea'],['pulmonary-valve','layerPulmonaryValve','#e2d5c4'],['papillary','layerPapillary','#b57368']])}
      ${layerRow('flow', 'layerFlow', '#e74c3c', false)}
      <details class="layer-advanced"><summary data-i18n="advancedLayers">${getTranslation('advancedLayers')}</summary>
      ${layerRow('pa-faint', 'layerPaFaint', '#9fc2d0', false)}
      ${layerRow('diaphragm', 'layerDiaphragm', '#c98f76')}
      ${layerRow('phrenic', 'layerPhrenic', '#e8e29a', false)}
      ${layerRow('vertebrae', 'layerVertebrae', '#bdb7ac')}
      </details>
      <div class="coronary-tools"><div class="section-heading" data-i18n="coronaryToolsHeading">${getTranslation('coronaryToolsHeading')}</div><label for="coronary-system"><span data-i18n="coronarySystemLabel">${getTranslation('coronarySystemLabel')}</span></label><select id="coronary-system">${[['all','coronaryAll'],['both','coronaryBoth'],['left','coronaryLeft'],['right','coronaryRight']].map(([v,k])=>`<option value="${v}" data-i18n="${k}">${getTranslation(k)}</option>`).join('')}</select><label class="layer"><input id="root-window" type="checkbox"> <span data-i18n="rootWindowLabel">${getTranslation('rootWindowLabel')}</span></label></div>
      <div id="transseptal-layers" class="transseptal-tools" hidden>
        <div class="section-heading" data-i18n="tsCathHeading">${getTranslation('tsCathHeading')}</div>
        <label class="layer"><i style="background:#3aa0ff"></i><span data-i18n="tsCathPigtail">${getTranslation('tsCathPigtail')}</span><input type="checkbox" data-ts-cath="pigtail" checked></label>
        <label class="layer"><i style="background:#2a66d8"></i><span data-i18n="tsCathCs">${getTranslation('tsCathCs')}</span><input type="checkbox" data-ts-cath="cs" checked></label>
        <label class="layer"><i style="background:#52b788"></i><span data-i18n="tsCathSheath">${getTranslation('tsCathSheath')}</span><input type="checkbox" data-ts-cath="sheath" checked></label>
        <label class="layer"><i style="background:#f4a261"></i><span data-i18n="tsCathWire">${getTranslation('tsCathWire')}</span><input type="checkbox" data-ts-cath="wire" checked></label>
        <label class="layer"><i style="background:#e76f51"></i><span data-i18n="tsCathBalloon">${getTranslation('tsCathBalloon')}</span><input type="checkbox" data-ts-cath="balloon" checked></label>
        <label class="layer"><i style="background:#4ade80"></i><span data-i18n="tsCathIas">${getTranslation('tsCathIas')}</span><input type="checkbox" data-ts-cath="ias" checked></label>
      </div>
    </section>
    <div class="aside-bottom">
      <span class="outline-icon">i</span>
      <p><span data-i18n="asideDisclaimer">${getTranslation('asideDisclaimer')}</span><br><small data-i18n="asideDisclaimerSmall">${getTranslation('asideDisclaimerSmall')}</small></p>
    </div>
  </aside>
  <main>
    <div class="myo-control" id="myo-control">
      <button id="myo-toggle" class="myo-btn" aria-pressed="false" title="Dış miyokardı saydamlaştır (M)">◐ Miyokard <kbd>M</kbd></button>
      <input id="myo-opacity" type="range" min="15" max="100" value="100" aria-label="${getTranslation('opacityLabel')}">
      <output id="myo-value">100%</output>
    </div>
    <div id="practice-banner" class="practice-banner" hidden></div>
    <div class="viewer-top">
      <div class="top-badges">
        <span id="scene-context" class="scene-context" aria-live="polite"></span>
        <span id="hover-badge" class="hover-badge" hidden></span>
      </div>
    </div>
    <div id="viewport" aria-label="Interactive 3D heart. Drag to rotate, scroll to zoom."></div>

    <div class="view-controls" aria-label="Camera presets">
      <div class="view-presets">
      ${[['anterior','Anterior','A'],['posterior','Posterior','P'],['rao','RAO','R'],['lao','LAO','L'],['spider','Spider','S'],['root','Root','O']].map(([id,t,k])=>`<button data-view="${id}" class="${id==='anterior'?'selected':''}" title="${id==='root'?'Root & Cusps':t} (${k})">${VIEW_SHORT[id]?`<span class="view-long">${t}</span><span class="view-short">${VIEW_SHORT[id]}</span>`:t} <kbd>${k}</kbd></button>`).join('')}
      <button data-view="mitral" title="Mitral scallops · A1–A3 / P1–P3">Mitral</button>
      </div>
      <div class="view-tools">
      <button id="carm-toggle-dock" class="carm-dock-btn" title="C-Arm & Joystick Paneli">📐 C-Arm <kbd>C</kbd></button>
      <button id="fluoro-toggle-dock" class="fluoro-dock-btn" title="${getTranslation('fluoroDockTitle')}" aria-pressed="false">☢ <span data-i18n="fluoroDockBtn">${getTranslation('fluoroDockBtn')}</span> <kbd>X</kbd></button>
      <button id="fluoro-contours-toggle" class="fluoro-contours-btn" title="${getTranslation('fluoroContoursTitle')}" aria-pressed="true" hidden><span data-i18n="fluoroContours">${getTranslation('fluoroContours')}</span></button>
      <button id="reset" title="Reset camera (0)">↺</button>
      </div>
    </div>
    <div id="cycle-panel" class="cycle-panel">
      <div class="cycle-top-row">
        <div class="cycle-play-group">
          <button id="beat" class="cycle-play-btn" aria-pressed="false">♡ Animate beat <kbd>Space</kbd></button>
          <button id="flow-toggle" class="cycle-flow-btn" aria-pressed="false" title="${getTranslation('flowToggleTitle')}">${getTranslation('flowToggleBtn')} <kbd>F</kbd></button>
          <button id="wiggers-toggle" class="cycle-flow-btn" aria-pressed="false" title="Wiggers diyagramı (basınç / hacim / EKG)">Wiggers <kbd>W</kbd></button>
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
      <div id="wiggers-strip" class="wiggers-strip" hidden>
        <canvas id="wiggers-canvas" aria-label="Wiggers diagram"></canvas>
        <span id="wiggers-timing" class="wiggers-timing"></span>
      </div>
      <div class="ecg-strip">
        <canvas id="ecg-canvas" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="${getTranslation('ecgScrubHint')}" title="${getTranslation('ecgScrubHint')}"></canvas>
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
  <div id="panel-resizer" class="panel-resizer" role="separator" aria-orientation="vertical" aria-label="${getTranslation('resizerAria')}" tabindex="0" title="${getTranslation('resizerTitle')}">
    <div class="resizer-handle"></div>
  </div>
  <article>
    <!-- C-ARM FLUOROSCOPY & JOYSTICK PANEL -->
    <div id="carm-panel" class="carm-panel collapsed" aria-label="C-Arm Anjiyografi Kontrolü">
      <button id="carm-edge-tab" class="carm-edge-tab" type="button" aria-controls="carm-content" aria-expanded="false" title="C-Arm & Joystick Paneli"><span data-i18n="carmTitle">${getTranslation('carmTitle')}</span></button>
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
          <div id="catheter-toggles" class="carm-catheter-container" hidden>
            <div class="carm-section-subtitle" data-i18n="tsCathHeading">${getTranslation('tsCathHeading')}</div>
            <div class="carm-catheter-grid">
              <button id="toggle-pigtail" data-cath="pigtail" class="carm-sub-btn active" aria-pressed="true" title="Aortik pigtail kateteri (NCC)">
                <span class="carm-sub-icon">🔵</span> Pigtail
              </button>
              <button id="toggle-cs-cath" data-cath="cs" class="carm-sub-btn active" aria-pressed="true" title="CS dekapolar diagnostik kateteri">
                <span class="carm-sub-icon">💙</span> CS
              </button>
              <button id="toggle-sheath" data-cath="sheath" class="carm-sub-btn active" aria-pressed="true" title="Transseptal kılıf ve iğne">
                <span class="carm-sub-icon">💉</span> Kılıf/İğne
              </button>
              <button id="toggle-wire" data-cath="wire" class="carm-sub-btn active" aria-pressed="true" title="Sol atriyal kılavuz tel">
                <span class="carm-sub-icon">〰️</span> Tel
              </button>
              <button id="toggle-balloon" data-cath="balloon" class="carm-sub-btn active" aria-pressed="true" title="Septostomi balonu">
                <span class="carm-sub-icon">🎈</span> Balon
              </button>
              <button id="toggle-ias" data-cath="ias" class="carm-sub-btn active" aria-pressed="true" title="Fossa ovalis & septum">
                <span class="carm-sub-icon">🎯</span> Fossa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="structure-index">01 / ANATOMY</div>
    <section id="context-note" class="context-note" hidden aria-live="polite">
      <div class="eyebrow" data-i18n="contextNoteTitle">${getTranslation('contextNoteTitle')}</div>
      <div id="context-note-body"></div>
    </section>
    <div id="structure-info">
      <h2 id="structure-title">Left ventricle</h2>
      <div class="divider"></div>
      <p id="description"></p>
      <div class="clinical">
        <div class="eyebrow" data-i18n="whyItMatters">${getTranslation('whyItMatters')}</div>
        <p id="clinical"></p>
      </div>
      <label class="eyebrow" for="structure-select" data-i18n="inspectStructure">${getTranslation('inspectStructure')}</label>
      <select id="structure-select"></select>
    </div>
    <section id="defect-details" class="defect-details-mount" hidden></section>
    <section id="lesson" hidden>
      <div id="echo-panel" class="echo-panel-mount" hidden></div>
      <div id="egm-panel" class="egm-panel-mount" hidden></div>
      <div id="hemo-panel" class="hemo-panel-mount" hidden></div>
      <div class="divider"></div>
      <div class="eyebrow" data-i18n="guidedLearning">${getTranslation('guidedLearning')}</div>
      <h3 id="lesson-title"></h3>
      <p id="lesson-intro"></p>
      <div id="steps"></div>
      <div id="step-detail"></div>
      <div id="exam-panel" class="exam-panel-mount" hidden></div>
      <button class="primary" id="next-step">${getTranslation('nextLandmark')}</button>
      <label class="slider-label" for="progress" id="progress-label">${getTranslation('leadProgressLabel')} <span id="progress-value">100%</span></label>
      <input id="progress" type="range" min="0" max="100" value="100">
      <small id="progress-note">${getTranslation('leadProgressNote')}</small>
    </section>
  </article>
</div>
<footer>
  <span>CARDIAC ANATOMY, CONNECTED.</span>
  <span>Gross structure <i>→</i> Tissue <i>→</i> Intervention</span>
  <span>LOCAL STUDY EDITION / 01</span>
</footer>
<p class="site-disclaimer" role="note" data-i18n="siteDisclaimer">${getTranslation('siteDisclaimer')}</p>

<dialog id="references">
  <button id="close-dialog" data-i18n="closeDialog">${getTranslation('closeDialog')}</button>
  <h2 data-i18n="referencesTitle">${getTranslation('referencesTitle')}</h2>
  <div id="reference-selected"></div>
  <div class="about-block">
    <p data-i18n="madeBy">${getTranslation('madeBy')}</p>
    <p><span data-i18n="contactLead">${getTranslation('contactLead')}</span> <a href="mailto:adycovs@gmail.com">adycovs@gmail.com</a></p>
  </div>
  <p class="dialog-disclaimer" data-i18n="siteDisclaimer">${getTranslation('siteDisclaimer')}</p>
  <p data-i18n="referencesIntro">${getTranslation('referencesIntro')}</p>
  <div id="reference-list"></div>
  <p data-i18n="referencesLimits">${getTranslation('referencesLimits')}</p>
</dialog>

<dialog id="shortcuts-modal">
  <button id="close-shortcuts">Close ×</button>
  <h2 data-i18n="keyboardHelpTitle">${getTranslation('keyboardHelpTitle')}</h2>
  <p class="muted">Fast navigation inspired by neuroanatomy atlas conventions.</p>
  <div class="shortcuts-grid">
    <div class="shortcut-row"><kbd>1</kbd>–<kbd>9</kbd><span data-i18n="modeShortcut">${getTranslation('modeShortcut')}</span></div>
    <div class="shortcut-row"><kbd>A</kbd><span>Anterior View</span></div>
    <div class="shortcut-row"><kbd>P</kbd><span>Posterior View</span></div>
    <div class="shortcut-row"><kbd>R</kbd><span>RAO (Right Anterior Oblique)</span></div>
    <div class="shortcut-row"><kbd>L</kbd><span>LAO (Left Anterior Oblique)</span></div>
    <div class="shortcut-row"><kbd>S</kbd><span>Spider View (LAO 45° / CAU 30° LMCA Angiography)</span></div>
    <div class="shortcut-row"><kbd>C</kbd><span>Toggle C-Arm Angiography & Joystick</span></div>
    <div class="shortcut-row"><kbd>X</kbd><span data-i18n="fluoroShortcut">${getTranslation('fluoroShortcut')}</span></div>
    <div class="shortcut-row"><kbd>O</kbd><span>Aortic Root & Cusps View</span></div>
    <div class="shortcut-row"><kbd>0</kbd><span>Reset Camera View</span></div>
    <div class="shortcut-row"><kbd>Space</kbd><span>Toggle Heartbeat Animation</span></div>
    <div class="shortcut-row"><kbd>F</kbd><span data-i18n="flowShortcut">${getTranslation('flowShortcut')}</span></div>
    <div class="shortcut-row"><kbd>N</kbd> / <kbd>→</kbd><span>Next Landmark (Guided Lesson)</span></div>
    <div class="shortcut-row"><kbd>?</kbd><span>Show / Hide Shortcuts Dialog</span></div>
  </div>
</dialog>

<!-- ── APP UPDATE PROMPT (wiz3 style) ────────────────────── -->
<div id="update-prompt" class="update-prompt-card" hidden role="status" aria-live="polite">
  <div class="up-card-head">
    <div class="up-head-title">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span id="up-title" data-i18n="upTitle">${getTranslation('upTitle')}</span>
    </div>
    <button id="up-close" class="up-close-btn" type="button" title="Kapat" aria-label="Kapat">✕</button>
  </div>
  <div class="up-card-body">
    <p id="up-text" class="up-text" data-i18n="upDesc">${getTranslation('upDesc')}</p>
    <p class="up-version-tag">
      <span data-i18n="upVersionLabel">${getTranslation('upVersionLabel')}</span>: <code id="up-version-val"></code>
    </p>
    <div class="up-actions">
      <button id="up-later" class="up-btn up-btn-later" type="button" data-i18n="upLater">${getTranslation('upLater')}</button>
      <button id="up-reload" class="up-btn up-btn-primary" type="button">
        <svg id="up-reload-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        <span id="up-reload-text" data-i18n="upReload">${getTranslation('upReload')}</span>
      </button>
    </div>
  </div>
</div>

<div id="toast" class="app-toast" hidden></div>
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

function inspect(id, flyTo = true, updateUrl = true, branch = null) {
  if (typeof id === 'string' && id.startsWith('ausc-')) examMode?.focusArea(id.slice(5));
  // A 3D catheter station adds its channel to the hemodynamics tracing.
  if (typeof id === 'string' && id.startsWith('cath-')) hemoMode?.focusStation(id);
  const cleanId = resolveStructureId(id);
  const defect = DEFECT_TYPES.find(d => d.id === cleanId);
  if(mode==='defects'&&!defect)return;
  if(defect&&mode!=='defects'){setMode('defects',false);}
  if(defect)defectPanel.select(cleanId);
  if (!inChamberMode(mode, cleanId)) return;
  const s = structures[cleanId];
  if (!s) return;
  currentSelectedId = cleanId;
  select.value = cleanId;

  for (const [target, key] of [['structure-title', 'title'], ['description', 'description'], ['clinical', 'clinical']]) {
    const el = document.getElementById(target);
    if (el) el.textContent = key === 'title' ? withBranch(s.title, branch) : s[key] || '';
  }

  heart?.selectStructure(cleanId, flyTo);
  updateSceneContext();
  const listed = heart?.getState().structures || [];
  const stMatch = defect ? { provenance: 'schematic' } : listed.find(item => item.id === cleanId) || listed.find(item => item.valveId === cleanId);
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
  panelShell?.setStructure({ title: withBranch(s.title, branch), source: s.source, provenance: indexEl?.dataset.provenance || '' });

  if (updateUrl && !isUpdatingRoute) {
    syncUrl();
  }
}

function onHoverStructure(id, branch = null) {
  // Test yourself: no name on hover, it would give the answer away.
  if (!id || practice?.hidesLabels()) {
    hoverBadge.hidden = true;
    return;
  }
  const cleanId = resolveStructureId(id);
  const s = structures[cleanId];
  if (s) {
    hoverBadge.textContent = withBranch(s.title, branch);
    hoverBadge.hidden = false;
  } else {
    hoverBadge.hidden = true;
  }
}

let heart;
try {
  heart = createHeart(
    document.querySelector('#viewport'),
    (id, branch) => { inspect(id, true, true, branch); practice?.onScenePick(resolveStructureId(id)); },
    onHoverStructure,
    (angles) => updateJoystickFromCamera(angles)
  );
  window.heart = heart;
} catch (error) {
  document.querySelector('#viewport').innerHTML = '<div class="error">3D view unavailable. Enable WebGL or use a supported browser. Anatomy notes and guided lessons remain available.</div>';
  console.error(error);
}

// The bottom bars (hint row, camera presets, viewport inset) stack on top of
// the cycle panel and the layers drawer ends above them; publish its live
// height on the workspace so CSS can position both.
const cyclePanelEl = document.querySelector('#cycle-panel');
const workspaceEl = document.querySelector('.workspace');
if (cyclePanelEl && workspaceEl) {
  const syncCycleHeight = () => {
    const height = `${cyclePanelEl.offsetHeight}px`;
    if (workspaceEl.style.getPropertyValue('--cycle-h') !== height) workspaceEl.style.setProperty('--cycle-h', height);
  };
  // Updating the parent changes the shallower viewport observed by Three.js.
  // Defer that layout write until the next frame, outside observer delivery.
  let cycleResizeFrame = 0;
  new ResizeObserver(() => {
    if (cycleResizeFrame) return;
    cycleResizeFrame = requestAnimationFrame(() => { cycleResizeFrame = 0; syncCycleHeight(); });
  }).observe(cyclePanelEl);
  syncCycleHeight();
}

let lastCycleState = null;

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
  const ecgCanvas = document.querySelector('#ecg-canvas');
  drawEcgTrace(ecgCanvas, state, {
    reserveLeft: (document.querySelector('.ecg-caption')?.offsetWidth || 0) + 12,
    reserveRight: (valveState?.offsetWidth || 0) + 12,
  });
  ecgCanvas?.setAttribute('aria-valuenow', String(Math.round(state.phase * 100)));
  lastCycleState = state;
  hemoMode?.tick(state);
  examMode?.tick(state);
  if (egmPanel && !egmMount.hidden) egmPanel.draw(state);
  echoMode?.tick(state);
  const wigStrip = document.querySelector('#wiggers-strip');
  if (wigStrip && !wigStrip.hidden) {
    drawWiggers(document.querySelector('#wiggers-canvas'), state, isTr ? 'tr' : 'en');
    const timing = document.querySelector('#wiggers-timing');
    if (timing) timing.textContent = formatCycleTiming(state.bpm, isTr ? 'tr' : 'en');
  }
}

// Synthetic EGM strip of the ablation lesson (steps with an `egm` scenario); built on first use.
const egmMount = document.querySelector('#egm-panel');
let egmPanel = null;
function syncEgm(lessonStep) {
  const scenario = mode === 'ablation' ? lessonStep?.egm : null;
  egmMount.hidden = !scenario;
  // Like echo: the signal panel comes first, so the structure card above the lesson steps its aside.
  if (scenario) document.documentElement.dataset.epOpen = 'true'; else delete document.documentElement.dataset.epOpen;
  if (!scenario) { heart?.setEpZone?.(null); heart?.pvi?.setActive?.(false); return; }
  egmPanel ??= createEpPanel(egmMount, {
    getLang: () => (getContentLanguage() === 'tr' ? 'tr' : 'en'),
    // 3D arc of the active case's pathway zone (hidden while the diagnosis view is neutral).
    onZone: (zoneId, extra) => heart?.setEpZone?.(zoneId, extra),
    // PVI exercise lesion rings (pvi-lab.js) of the Treatment tab.
    getPvi: () => heart?.pvi || null
  });
  window.cardiaEp = egmPanel;   // test and console hook, like window.cardiaExam
  egmPanel?.openLesson(scenario);
  egmMount.scrollIntoView?.({ block: 'start' });   // the panel is the first thing in the aside
}
// Built before the cycle subscription: subscribeCycle calls updateCycleUI at once.
const hemoMode = heart ? createHemoMode({
  heart,
  mount: document.querySelector('#hemo-panel'),
  getLang: () => (getContentLanguage() === 'tr' ? 'tr' : 'en'),
  onFocus: station => inspect(`cath-${station === 'pcwp' ? 'wedge' : station}`, false, false)
}) : null;
const examMode = heart ? createExamMode({
  heart,
  mount: document.querySelector('#exam-panel'),
  getLang: () => (getContentLanguage() === 'tr' ? 'tr' : 'en'),
  onArea: areaId => inspect(`ausc-${areaId}`, false, false)
}) : null;
const echoMode = heart ? createEchoMode({
  heart,
  mount: document.querySelector('#echo-panel'),
  getLang: () => (getContentLanguage() === 'tr' ? 'tr' : 'en')
}) : null;
const defectPanel = createSeptalDefectsPanel({
  mount: document.querySelector('#defect-tools'),
  mountDetails: document.querySelector('#defect-details'),
  getLang: getContentLanguage,
  onSelect: id => inspect(id), onFocus: id => inspect(id)
});
panelShell = createPanelShell({ getLang: getContentLanguage });
headerTabs = createHeaderTabs({ getLang: getContentLanguage });

const findingsPanel = panelShell.addTab({ id: 'findings', label: { tr: 'Bulgu', en: 'Findings' }, onShow: () => practice?.refresh() });
practice = createPractice({
  mount: document.querySelector('#panel-learn'),
  findings: findingsPanel,
  banner: document.querySelector('#practice-banner'),
  getLang: getContentLanguage,
  getTitle: id => structures[id]?.title || id,
  onStart: () => {
    if (mode !== 'anatomy') setMode('anatomy');
    hoverBadge.hidden = true;
    panelShell?.closeSheet();
  },
  onReveal: id => inspect(id, true)
});
// Test hooks, like window.heart: let browser tests drive scene picks and the echo module.
window.cardiaPractice = practice;
window.cardiaEcho = echoMode;
window.cardiaExam = examMode;

// Quick search: modes and structures by name or abbreviation, both languages.
function otherLang() { return getContentLanguage() === 'en' ? 'tr' : 'en'; }
function searchItems() {
  const modeGroupOf = id => MODE_GROUPS.find(([, ids]) => ids.includes(id))?.[0];
  const otherModes = new Map((uiTranslations[otherLang()]?.modes || []).map(([id, , label]) => [id, label]));
  const modes = getUiModes().map(([id, n, label]) => ({ kind: 'mode', id, label, alt: otherModes.get(id), meta: `${n} · ${modeGroupOf(id) ? getTranslation(modeGroupOf(id)) : ''}` }));
  const items = [...select.options].map(option => ({ kind: 'structure', id: option.value, label: option.text, alt: rawStructures[option.value]?.[otherLang()]?.title }));
  return [...modes, ...items];
}
function searchModeGroups() {
  const modes = new Map(searchItems().filter(item => item.kind === 'mode').map(item => [item.id, item]));
  return MODE_GROUPS.map(([key, ids]) => [getTranslation(key), ids.map(id => modes.get(id)).filter(Boolean)]);
}
// Make a found structure visible and focus it: leave a mode that cannot show
// it, switch its layer and checkbox on, open its group, then inspect.
function pickStructure(id) {
  const option = [...select.options].find(o => o.value === id);
  if (option?.disabled) setMode('anatomy');
  const turnOn = box => { if (box && !box.checked) { box.checked = true; box.dispatchEvent(new Event('change', { bubbles: true })); } };
  const layer = heart?.getState().structures.find(item => item.id === id || item.valveId === id)?.layer;
  if (layer) turnOn(document.querySelector(`input[data-layer="${layer}"]`));
  const box = document.querySelector(`input[data-layer="${CSS.escape(id)}"]`);
  if (box) {
    const group = box.closest('.layer-group');
    const parent = group?.querySelector('.layer-group-head input');
    if (parent && !parent.checked && !parent.indeterminate) turnOn(parent);
    turnOn(box);
    const toggle = group?.querySelector('.group-toggle');
    if (toggle && toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
  }
  inspect(id, true);
  if (panelShell?.isMobile()) panelShell.open('learn');
}
function onSearchPick(item) {
  if (item.kind === 'mode') {
    panelShell?.closeSheet();
    setMode(item.id);
  } else pickStructure(item.id);
}
const quickSearches = ['#header-search', '#aside-search'].map(sel => document.querySelector(sel)).filter(Boolean).map(mount => createQuickSearch({
  mount, getLang: getContentLanguage, getItems: searchItems, getModeGroups: searchModeGroups, getMode: () => mode, onPick: onSearchPick
}));
function focusQuickSearch() {
  if (panelShell?.isMobile()) {
    panelShell.open('modes');
    quickSearches[1]?.focus();
  } else quickSearches[0]?.focus();
}
heart?.subscribeCycle(updateCycleUI);
heart?.ready.then(() => {
  // Lesson overlays are built only once the atlas exists; a deep link or a
  // reload inside a lesson selected its mode before that, so re-apply it.
  if (mode !== 'anatomy') {
    heart.setMode(mode);
    if (lessons[mode]) showStep();
  }
  inspect(currentSelectedId, Boolean(chamberMode(mode)) || mode === 'defects', false);
}).catch(error => console.error('Atlas loading failed:', error));
select.addEventListener('change', () => inspect(select.value));
function formatWallReadout(value) {
  const amount = Number(value);
  return amount ? `${amount}% ${getTranslation('wallSection')}` : getTranslation('wallClosed');
}

document.querySelectorAll('[data-wall]').forEach(input => input.addEventListener('input', () => {
  heart?.setWallCut(input.dataset.wall, Number(input.value) / 100);
  const out = document.querySelector(`#wall-value-${input.dataset.wall}`);
  if (out) out.textContent = formatWallReadout(input.value);
  updateContextNote();
}));
document.querySelector('#restore-walls').addEventListener('click', () => {
  document.querySelectorAll('[data-wall]').forEach(input => {
    input.value = 0;
    heart?.setWallCut(input.dataset.wall, 0);
    const out = document.querySelector(`#wall-value-${input.dataset.wall}`);
    if (out) out.textContent = formatWallReadout(0);
  });
  resetChamberWalls();
  updateContextNote();
});
document.querySelector('#coronary-system').addEventListener('change', e => {heart?.setCoronarySystem(e.target.value);setTissueOpacity(e.target.value==='all'?100:20);});
document.querySelector('#root-window').addEventListener('change', e => {heart?.setRootWindow(e.target.checked);updateContextNote();});

// relabel: only the language changed; keep the step's interactive state
// (echo probe and task, EGM scenario, tissue opacity).
function showStep({ relabel = false } = {}) {
  const isPacemaker = mode === 'pacemaker';
  const isBachmann = mode === 'bachmann';
  const isTransseptal = mode === 'transseptal';
  const isCath = mode === 'cath';
  const hasProgress = isPacemaker || isTransseptal || isCath || (isBachmann && step > 0);
  const progressEl = document.querySelector('#progress');
  const progressLabel = document.querySelector('#progress-label');
  const progressNote = document.querySelector('#progress-note');
  if (progressEl) progressEl.hidden = !hasProgress;
  if (progressLabel) progressLabel.hidden = !hasProgress;
  if (progressNote) progressNote.hidden = !hasProgress;
  const cathToggles = document.querySelector('#catheter-toggles');
  if (cathToggles) cathToggles.hidden = !isTransseptal;
  const tsLayers = document.querySelector('#transseptal-layers');
  if (tsLayers) tsLayers.hidden = !isTransseptal;

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
    else if (!isCath) heart?.setTransseptalStep(step);
    // Catheterization: the step's channels choose the catheter stage (hemo-mode.js).
  } else if (isBachmann) {
    heart?.setBachmannStep(step);
  } else if (mode === 'ablation') {
    heart?.setAblationStep(step);
    syncEpTools(s.view);
    if (!relabel) setTissueOpacity(String(s.view).startsWith('koch_') ? KOCH_TISSUE_PERCENT : Math.round(LESSON_TISSUE_OPACITY * 100));
  }

  if (isTransseptal) {
    syncCatheterUI();
  }

  if (!relabel) syncEgm(s);
  if (isCath) hemoMode?.applyStep(s);
  if (mode === 'exam') examMode?.applyStep(s);
  if (ECHO_MODALITY[mode] && !relabel) echoMode?.applyStep(s.echo);

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
const carmEdgeTab = document.querySelector('#carm-edge-tab');

function setCarmPanelOpen(open) {
  if (!carmPanel) return;
  carmPanel.classList.toggle('collapsed', !open);
  if (carmToggleBtn) carmToggleBtn.textContent = open ? '−' : '+';
  carmEdgeTab?.setAttribute('aria-expanded', String(open));
}

function toggleCarmPanel() {
  if (!carmPanel) return;
  const isCollapsed = carmPanel.classList.contains('collapsed');
  setCarmPanelOpen(isCollapsed);
}

carmToggleBtn?.addEventListener('click', toggleCarmPanel);
carmDockBtn?.addEventListener('click', toggleCarmPanel);
carmEdgeTab?.addEventListener('click', toggleCarmPanel);

function filterAtrialOptions() {
  for (const option of select.options) {
    if (mode === 'defects') {
      option.hidden = option.disabled = !DEFECT_TYPES.some(d => d.id === option.value);
    } else if (chamberMode(mode)) {
      option.hidden = option.disabled = !inChamberMode(mode, option.value);
    } else {
      option.hidden = option.disabled = false;
    }
  }
}
// Ablation (Koch step): close-up projections and optional layers.
function syncEpTools(view = null) {
  const optional = heart?.getEpOptional?.() || {};
  document.querySelectorAll('[data-ep-optional]').forEach(box => { box.checked = Boolean(optional[box.dataset.epOptional]); });
  document.querySelectorAll('[data-ep-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.epView === view)));
}
// The close-ups look through the free walls at the septum: fainter tissue.
const KOCH_TISSUE_PERCENT = 15;
document.querySelectorAll('[data-ep-view]').forEach(button => button.addEventListener('click', () => {
  // The close-ups frame Koch's triangle: go to the Koch step first if another target is shown.
  if (mode === 'ablation' && ![1, 4].includes(step)) { step = 1; showStep(); }
  setTissueOpacity(KOCH_TISSUE_PERCENT);
  heart?.setView(button.dataset.epView, true);
  syncEpTools(button.dataset.epView);
}));
document.querySelectorAll('[data-ep-optional]').forEach(box => box.addEventListener('change', () => heart?.setEpOptional(box.dataset.epOptional, box.checked)));
document.querySelectorAll('[data-chamber-focus]').forEach(button => button.addEventListener('click', () => inspect(button.dataset.chamberFocus)));
document.querySelectorAll('[data-ventricle-regions]').forEach(box => box.addEventListener('change', () => {
  heart?.setVentricleRegions(box.checked);
  document.querySelectorAll('[data-ventricle-regions]').forEach(other => { other.checked = box.checked; });
}));
document.querySelectorAll('[data-chamber-wall]').forEach(input => input.addEventListener('input', () => {
  const id = input.dataset.chamberWall;
  heart?.setWallCut(id, Number(input.value) / 100);
  const out = input.closest('.chamber-tools')?.querySelector('output');
  if (out) out.textContent = `${input.value}%`;
  const wallInput = document.querySelector(`[data-wall=${id}]`);
  if (wallInput) wallInput.value = input.value;
  const wallVal = document.querySelector(`#wall-value-${id}`);
  if (wallVal) wallVal.textContent = formatWallReadout(input.value);
  updateContextNote();
}));
// Layer groups start collapsed; the disclosure opens the substructure list,
// the checkbox keeps toggling visibility. The count shows visible children.
function updateLayerGroupCounts() {
  document.querySelectorAll('.layer-group').forEach(group => {
    const boxes = [...group.querySelectorAll('.layer-subgroup input[type=checkbox]')];
    const out = group.querySelector('[data-group-count]');
    if (out) out.textContent = `${boxes.filter(box => box.checked).length}/${boxes.length}`;
  });
}
document.querySelectorAll('.group-toggle').forEach(button => button.addEventListener('click', () => {
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(open));
  const list = document.getElementById(button.getAttribute('aria-controls'));
  if (list) list.hidden = !open;
}));
document.querySelector('#layers')?.addEventListener('change', updateLayerGroupCounts);

// The active mode and selection are written on the scene itself, so a
// screenshot always says what it shows (report section 13).
function updateSceneContext() {
  const el = document.querySelector('#scene-context');
  if (!el) return;
  const entry = getUiModes().find(([id]) => id === mode);
  const selected = currentSelectedId && structures[currentSelectedId]?.title;
  el.textContent = [entry && `${entry[1]} · ${entry[2]}`, selected && `${getTranslation('sceneSelected')}: ${selected}`].filter(Boolean).join(' · ');
}

// Explanations live in the right panel; the left panel keeps controls only.
function updateContextNote() {
  updateSceneContext();
  const box = document.querySelector('#context-note');
  const body = document.querySelector('#context-note-body');
  if (!box || !body) return;
  const notes = [];
  if (chamberMode(mode)) notes.push(chamberMode(mode).note);
  const cut = [...document.querySelectorAll('[data-wall], [data-chamber-wall]')].some(input => Number(input.value) > 0);
  if (cut) notes.push('wallToolsNote');
  if (document.querySelector('#root-window')?.checked) notes.push('rootWindowNote');
  body.replaceChildren(...notes.map(key => {
    const p = document.createElement('p');
    p.dataset.i18n = key;
    p.textContent = getTranslation(key);
    return p;
  }));
  box.hidden = notes.length === 0;
}

function setMode(newMode, updateUrl = true) {
  // The example lesson runs in general anatomy; leaving it ends the task.
  if (newMode !== 'anatomy' && practice?.isActive()) practice.setStyle('explore');
  mode = newMode;
  rememberMode(newMode);
  step = 0;
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode && b.dataset.modeStep === undefined));
  heart?.setMode(mode);
  const isDefects = mode === 'defects';
  const isEcho = Boolean(ECHO_MODALITY[mode]);
  if(isDefects){defectPanel.show();setFluoroscopyActive(false);}else defectPanel.hide();
  document.querySelector('#cycle-panel').hidden=isDefects;
  const structInfoEl = document.querySelector('#structure-info');
  // Echo: the sector, controls and feedback come first; the structure card would push them down.
  if (structInfoEl) structInfoEl.hidden = isDefects || isEcho;
  const structureIndexEl = document.querySelector('.structure-index');
  if (structureIndexEl) structureIndexEl.hidden = isEcho;

  if (mode === 'cath') hemoMode?.enter(); else hemoMode?.exit();
  // Like the EP panel: the hemodynamics panel heads the lesson column, the structure card steps aside.
  if (mode === 'cath') document.documentElement.dataset.hemoOpen = 'true'; else delete document.documentElement.dataset.hemoOpen;
  if (mode === 'exam') examMode?.enter(); else examMode?.exit();
  if (isEcho) echoMode?.enter(ECHO_MODALITY[mode]); else echoMode?.exit();
  // Mode-scoped styling (echo: no C-arm panel, no anatomy practice switcher).
  document.documentElement.dataset.appMode = mode;
  // Practice (Free / Guided / Test) and its Findings tab belong to the structure-picking anatomy modes;
  // the lesson modes (angiography, EP, pacemaker, ...) have their own steps, so those controls stay hidden.
  const usesPractice = mode === 'anatomy' || Boolean(chamberMode(mode));
  document.documentElement.dataset.practice = usesPractice ? 'on' : 'off';
  panelShell?.setTabVisible('findings', usesPractice);
  // The C-Arm is a drawer hidden at the right edge in every mode; the edge tab, the dock button or C opens it.
  setCarmPanelOpen(false);

  const opacity = lessons[mode] ? Math.round(LESSON_TISSUE_OPACITY * 100) : 100;
  setTissueOpacity(opacity);

  document.querySelector('#layers').hidden = mode === 'micro' || Boolean(chamberMode(mode)) || mode === 'defects';
  document.querySelectorAll('.chamber-tools').forEach(section => { section.hidden = section.dataset.chamberMode !== mode; });
  document.querySelector('#ep-tools').hidden = mode !== 'ablation';
  if (mode !== 'ablation') { egmMount.hidden = true; delete document.documentElement.dataset.epOpen; }
  if (mode === 'ablation') syncEpTools();
  updateContextNote();
  panelShell?.refresh();
  headerTabs?.refresh();
  filterAtrialOptions();
  document.querySelectorAll(`.chamber-tools[data-chamber-mode="${mode}"] [data-chamber-wall]`).forEach(input => {
    const value = Math.round((heart?.getState().wallCuts[input.dataset.chamberWall] || 0) * 100);
    input.value = value;
    const out = input.closest('.chamber-tools').querySelector('output');
    if (out) out.textContent = `${value}%`;
  });
  document.querySelector('#lesson').hidden = !lessons[mode];

  if (lessons[mode]) {
    document.querySelector('#lesson-title').textContent = lessons[mode].title;
    document.querySelector('#lesson-intro').textContent = lessons[mode].intro;
    showStep();
  } else {
    inspect(mode === 'micro' ? 'micro' : chamberMode(mode) ? chamberMode(mode).chamber : mode === 'defects' ? defectPanel.getSelected() : 'lv', true, false);
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
    // The former hemodynamics mode is part of catheterization now.
    const targetMode = match ? (match[1] === 'hemodynamics' ? 'cath' : match[1]) : null;

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
  // A lesson-step entry (the EP chapters in the menu) opens the mode at that step.
  if (button.dataset.modeStep !== undefined) {
    step = Math.max(0, Math.min((lessons[button.dataset.mode]?.steps.length || 1) - 1, Number(button.dataset.modeStep) || 0));
    showStep();
  }
}));

const chambersBox = document.querySelector('[data-layer="chambers"]');
const subBoxes = ['lv', 'rv', 'la', 'ra', 'laa'].map(id => document.querySelector(`[data-layer="${id}"]`)).filter(Boolean);

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
const fluoroDockBtn = document.querySelector('#fluoro-toggle-dock');
// Anatomy contours over the fluoroscopy image (fluoro-contours.js), on by default.
const fluoroContoursBtn = document.querySelector('#fluoro-contours-toggle');
fluoroContoursBtn?.addEventListener('click', () => {
  const on = fluoroContoursBtn.getAttribute('aria-pressed') !== 'true';
  fluoroContoursBtn.setAttribute('aria-pressed', String(on));
  heart?.setFluoroContours(on);
});

function setFluoroscopyActive(active) {
  fluoroActive = Boolean(active);
  heart?.setFluoroscopy(fluoroActive);
  if (fluoroBtn) {
    fluoroBtn.setAttribute('aria-pressed', String(fluoroActive));
    fluoroBtn.classList.toggle('active', fluoroActive);
  }
  if (fluoroDockBtn) {
    fluoroDockBtn.setAttribute('aria-pressed', String(fluoroActive));
    fluoroDockBtn.classList.toggle('active', fluoroActive);
  }
  document.querySelector('main')?.classList.toggle('fluoroscopy-active', fluoroActive);
  if (fluoroContoursBtn) fluoroContoursBtn.hidden = !fluoroActive;
}

function toggleFluoroscopy() {
  if(mode==='defects')return;
  setFluoroscopyActive(!fluoroActive);
}

fluoroBtn?.addEventListener('click', toggleFluoroscopy);
fluoroDockBtn?.addEventListener('click', toggleFluoroscopy);

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
  if (viewName === 'mitral') {
    if (mode !== 'anatomy') setMode('anatomy');
    inspect('mitral', false);
  }
  heart?.setView(viewName, true);
  if (viewName === 'root') { document.querySelector('#root-window').checked = true; updateContextNote(); }
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

// Tissue opacity has one control (the viewport myocardium slider and its
// toggle); every caller routes through setTissueOpacity.
let myoRestoreOpacity = 30;
function setTissueOpacity(percent) {
  const value = Math.round(Math.min(100, Math.max(15, Number(percent) || 100)));
  heart?.setOpacity(value / 100);
  const myo = document.querySelector('#myo-opacity');
  if (myo) myo.value = value;
  const myoLabel = document.querySelector('#myo-value');
  if (myoLabel) myoLabel.textContent = `${value}%`;
  const btn = document.querySelector('#myo-toggle');
  if (btn) {
    btn.classList.toggle('active', value < 100);
    btn.setAttribute('aria-pressed', String(value < 100));
  }
}
function toggleMyocardium() {
  const current = Number(document.querySelector('#myo-opacity')?.value || 100);
  if (current < 100) {
    myoRestoreOpacity = current;
    setTissueOpacity(100);
  } else {
    setTissueOpacity(myoRestoreOpacity);
  }
}
document.querySelector('#myo-opacity')?.addEventListener('input', e => setTissueOpacity(e.target.value));
document.querySelector('#myo-toggle')?.addEventListener('click', toggleMyocardium);

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

const wiggersToggle = document.querySelector('#wiggers-toggle');
function setWiggersOpen(open) {
  const strip = document.querySelector('#wiggers-strip');
  if (!strip || !wiggersToggle) return;
  strip.hidden = !open;
  wiggersToggle.classList.toggle('active', open);
  wiggersToggle.setAttribute('aria-pressed', String(open));
  const state = lastCycleState || heart?.getCycleState?.();
  if (open && state) {
    const isTr = getContentLanguage() === 'tr';
    drawWiggers(document.querySelector('#wiggers-canvas'), state, isTr ? 'tr' : 'en');
    const timing = document.querySelector('#wiggers-timing');
    if (timing) timing.textContent = formatCycleTiming(state.bpm, isTr ? 'tr' : 'en');
  }
}
wiggersToggle?.addEventListener('click', () => {
  setWiggersOpen(document.querySelector('#wiggers-strip')?.hidden);
});

// The ECG cursor is draggable: the heart follows the phase under the pointer.
// Playback pauses while dragging and resumes on release.
const ecgStrip = document.querySelector('#ecg-canvas');
let ecgDrag = null;
function ecgSeek(e) {
  const bpm = heart?.getCycleState?.().bpm || 72;
  heart?.seekCycle(ecgPhaseAt(ecgStrip, e.clientX, bpm));
}
ecgStrip?.addEventListener('pointerdown', e => {
  const playing = Boolean(heart?.getCycleState?.().playing);
  if (playing) heart?.setBeating(false);
  ecgDrag = { resume: playing };
  try { ecgStrip.setPointerCapture(e.pointerId); } catch (_) {}
  ecgSeek(e);
});
ecgStrip?.addEventListener('pointermove', e => { if (ecgDrag) ecgSeek(e); });
const ecgRelease = () => { if (ecgDrag?.resume) heart?.setBeating(true); ecgDrag = null; };
ecgStrip?.addEventListener('pointerup', ecgRelease);
ecgStrip?.addEventListener('pointercancel', ecgRelease);
ecgStrip?.addEventListener('keydown', e => {
  const step = { ArrowRight: 0.01, ArrowUp: 0.01, ArrowLeft: -0.01, ArrowDown: -0.01, PageUp: 0.1, PageDown: -0.1 }[e.key];
  if (step === undefined) return;
  e.preventDefault();
  e.stopPropagation();
  const phase = heart?.getCycleState?.().phase || 0;
  heart?.seekCycle(((phase + step) % 1 + 1) % 1);
});

// Click / drag on the diagram scrubs the cycle phase.
const wiggersCanvas = document.querySelector('#wiggers-canvas');
let wiggersDragging = false;
function wiggersSeek(e) {
  const bpm = heart?.getCycleState?.().bpm || 72;
  heart?.seekCycle(wiggersPhaseAt(wiggersCanvas, e.clientX, bpm));
}
wiggersCanvas?.addEventListener('pointerdown', e => {
  wiggersDragging = true;
  try { wiggersCanvas.setPointerCapture(e.pointerId); } catch (_) {}
  wiggersSeek(e);
});
wiggersCanvas?.addEventListener('pointermove', e => { if (wiggersDragging) wiggersSeek(e); });
wiggersCanvas?.addEventListener('pointerup', () => { wiggersDragging = false; });
wiggersCanvas?.addEventListener('pointercancel', () => { wiggersDragging = false; });

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

  setTissueOpacity(100);

  document.querySelectorAll('[data-wall]').forEach(input => {
    input.value = 0;
    const out = document.querySelector(`#wall-value-${input.dataset.wall}`);
    if (out) out.textContent = formatWallReadout(0);
  });
  resetChamberWalls();

  setVeinsState(true);
  setConductionState(true);
  setValvesState(true);
  syncLayerCheckboxesFromHeart();

  setFluoroscopyActive(false);

  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('selected', b.dataset.view === 'anterior'));
  document.querySelectorAll('[data-angio]').forEach(b => b.classList.remove('active'));

  const flowBtn = document.querySelector('#flow-toggle');
  if (flowBtn) {
    flowBtn.classList.remove('active');
    flowBtn.setAttribute('aria-pressed', 'false');
  }
  const flowBox = document.querySelector('input[data-layer="flow"]');
  if (flowBox) flowBox.checked = false;

  const descEl = document.querySelector('#carm-projection-desc');
  if (descEl) descEl.textContent = getAngioDescription('anterior');
  updateContextNote();
  updateLayerGroupCounts();
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
  updateLayerGroupCounts();
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
    // Menu lesson-step entries follow the lesson language.
    if (btn.dataset.modeStep !== undefined) {
      const title = lessons[btn.dataset.mode]?.steps[Number(btn.dataset.modeStep)]?.title;
      const nameEl = btn.querySelector('.mode-substep-name');
      if (nameEl && title) nameEl.textContent = title;
    }
  });
  const opacityInput = document.querySelector('#myo-opacity');
  if (opacityInput) opacityInput.setAttribute('aria-label', getTranslation('opacityLabel'));
  document.querySelectorAll('.layer-group').forEach(group => {
    group.querySelector('.layer-group-head input')?.setAttribute('aria-label', getTranslation(group.dataset.group));
    group.querySelector('.group-toggle')?.setAttribute('title', getTranslation('groupToggle'));
  });
  updateContextNote();
  const wallKeys = { rv: 'wallRv', lv: 'wallLv', la: 'wallLa', ra: 'wallRa' };
  document.querySelectorAll('[data-wall]').forEach(input => {
    const key = wallKeys[input.dataset.wall];
    if (key) input.setAttribute('aria-label', getTranslation(key));
    const out = document.querySelector(`#wall-value-${input.dataset.wall}`);
    if (out) out.textContent = formatWallReadout(input.value);
  });
  const angles = heart?.getAngioAngles?.();
  if (angles) updateJoystickFromCamera(angles);
  const resizer = document.querySelector('#panel-resizer');
  if (resizer) {
    resizer.title = getTranslation('resizerTitle');
    resizer.setAttribute('aria-label', getTranslation('resizerAria'));
  }
}

function updateLanguageUI() {
  defectPanel.refresh();
  panelShell?.refresh();
  quickSearches.forEach(search => search.refresh());
  practice?.refresh();
  applyChromeTranslations();
  headerTabs?.refresh();
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
  const fluoroDock = document.querySelector('#fluoro-toggle-dock');
  if (fluoroDock) {
    fluoroDock.title = getTranslation('fluoroDockTitle');
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
    filterAtrialOptions();
  }

  inspect(currentSelectedId, false, false);

  if (lessons[mode]) {
    const lessonTitleEl = document.querySelector('#lesson-title');
    if (lessonTitleEl) lessonTitleEl.textContent = lessons[mode].title;
    const lessonIntroEl = document.querySelector('#lesson-intro');
    if (lessonIntroEl) lessonIntroEl.textContent = lessons[mode].intro;
    showStep({ relabel: true });
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
  updateUpdaterLanguage();
  hemoMode?.setLanguage(getContentLanguage() === 'tr' ? 'tr' : 'en');
  examMode?.setLanguage(getContentLanguage() === 'tr' ? 'tr' : 'en');
  egmPanel?.setLanguage(getContentLanguage() === 'tr' ? 'tr' : 'en');
  echoMode?.setLanguage(getContentLanguage() === 'tr' ? 'tr' : 'en');
  updateCycleUI(heart?.getCycleState());
}

document.querySelector('#lang-btn')?.addEventListener('click', () => {
  const newLang = getContentLanguage() === 'tr' ? 'en' : 'tr';
  setContentLanguage(newLang, { explicit: true });
  updateLanguageUI();
});

async function applyCountryLanguage() {
  if (hasExplicitLanguageChoice()) return;
  try {
    const code = await fetchCountryCode();
    if (hasExplicitLanguageChoice()) return;
    const lang = languageForCountry(code);
    if (lang === getContentLanguage()) return;
    setContentLanguage(lang);
    updateLanguageUI();
  } catch {
    /* Keep the timezone guess when the country lookup does not answer. */
  }
}
applyCountryLanguage();

function syncCatheterUI() {
  const vis = heart?.getCatheterVisibility?.() || {
    pigtail: true, cs: true, sheath: true, wire: false, balloon: false, ias: true
  };
  document.querySelectorAll('[data-cath]').forEach(btn => {
    const key = btn.dataset.cath;
    const on = !!vis[key];
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', String(on));
  });
  document.querySelectorAll('[data-ts-cath]').forEach(cb => {
    const key = cb.dataset.tsCath;
    cb.checked = !!vis[key];
  });
}

document.querySelector('#catheter-toggles')?.addEventListener('click', e => {
  const btn = e.target.closest('[data-cath]');
  if (!btn) return;
  const key = btn.dataset.cath;
  const currentVis = heart?.getCatheterVisibility?.() || {};
  const next = !currentVis[key];
  heart?.setCatheterVisible(key, next);
  syncCatheterUI();
});

document.querySelector('#transseptal-layers')?.addEventListener('change', e => {
  const cb = e.target.closest('[data-ts-cath]');
  if (!cb) return;
  const key = cb.dataset.tsCath;
  heart?.setCatheterVisible(key, cb.checked);
  syncCatheterUI();
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
document.querySelector('#sources').addEventListener('click', () => {
  // The selected structure's own source opens the dialog, above the full list.
  panelShell?.renderSources(document.querySelector('#reference-selected'));
  dialog.showModal();
});
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());

const shortcutsModal = document.querySelector('#shortcuts-modal');
document.querySelector('#shortcuts-btn').addEventListener('click', () => shortcutsModal.showModal());
document.querySelector('#close-shortcuts').addEventListener('click', () => shortcutsModal.close());

// Keyboard shortcuts (1-9, A, P, R, L, S, C, 0, Space, ?, N)
window.addEventListener('keydown', e => {
  if (dialog.open || shortcutsModal.open) return;
  if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    focusQuickSearch();
    return;
  }
  // Keep text inputs and native dialog controls independent of scene shortcuts.
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

  const key = e.key;

  if (key >= '1' && key <= '9') {
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
  } else if (key === 'm' || key === 'M') {
    toggleMyocardium();
  } else if (key === 'w' || key === 'W') {
    setWiggersOpen(document.querySelector('#wiggers-strip')?.hidden);
  } else if (key === 'c' || key === 'C') {
    toggleCarmPanel();
  } else if (key === 'x' || key === 'X') {
    toggleFluoroscopy();
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

function initPanelResizer() {
  const resizer = document.querySelector('#panel-resizer');
  const workspace = document.querySelector('.workspace');
  const article = document.querySelector('article');
  if (!resizer || !workspace || !article) return;

  const STORAGE_KEY = 'cardia_article_w';
  const MIN_WIDTH = 260;
  const DEFAULT_WIDTH = window.innerWidth >= 1500 ? 350 : 320;
  // The EP signal module is about the strip: its panel defaults to two thirds
  // of the workspace (style.css) and keeps its own width while dragged.
  const signalMode = () => document.documentElement.dataset.appMode === 'ablation';
  const widthVar = () => (signalMode() ? '--article-w-ep' : '--article-w');
  const storageKey = () => (signalMode() ? `${STORAGE_KEY}_ep` : STORAGE_KEY);
  const maxWidth = () => {
    const maxAllowed = Math.max(MIN_WIDTH, workspace.clientWidth - 320 - 8);
    return signalMode() ? maxAllowed : Math.min(800, maxAllowed);
  };

  for (const [key, name] of [[STORAGE_KEY, '--article-w'], [`${STORAGE_KEY}_ep`, '--article-w-ep']]) {
    try {
      const parsed = parseInt(localStorage.getItem(key) || '', 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_WIDTH) workspace.style.setProperty(name, `${parsed}px`);
    } catch (_) {}
  }

  let isDragging = false;
  let startX = 0;
  let startWidth = 0;
  let rafId = null;

  function updateWidth(targetWidth) {
    workspace.style.setProperty(widthVar(), `${targetWidth}px`);
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    isDragging = true;
    startX = e.clientX;
    startWidth = article.getBoundingClientRect().width;
    resizer.classList.add('is-dragging');
    workspace.classList.add('is-resizing');
    resizer.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const targetWidth = Math.round(Math.min(maxWidth(), Math.max(MIN_WIDTH, startWidth - dx)));

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      updateWidth(targetWidth);
      rafId = null;
    });
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    resizer.classList.remove('is-dragging');
    workspace.classList.remove('is-resizing');
    try {
      resizer.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const currentWidth = Math.round(article.getBoundingClientRect().width);
    if (currentWidth >= MIN_WIDTH) {
      try {
        localStorage.setItem(storageKey(), String(currentWidth));
      } catch (_) {}
    }
  }

  function onDoubleClick() {
    // Back to the default: 320/350 px, or two thirds in the EP signal module.
    if (signalMode()) workspace.style.removeProperty('--article-w-ep');
    else workspace.style.setProperty('--article-w', `${DEFAULT_WIDTH}px`);
    try {
      localStorage.removeItem(storageKey());
    } catch (_) {}
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const currentWidth = article.getBoundingClientRect().width;
      const step = e.shiftKey ? 40 : 15;
      const delta = e.key === 'ArrowLeft' ? step : -step;
      const targetWidth = Math.round(Math.min(maxWidth(), Math.max(MIN_WIDTH, currentWidth + delta)));
      updateWidth(targetWidth);
      try {
        localStorage.setItem(storageKey(), String(targetWidth));
      } catch (_) {}
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onDoubleClick();
    }
  }

  resizer.addEventListener('pointerdown', onPointerDown);
  resizer.addEventListener('pointermove', onPointerMove);
  resizer.addEventListener('pointerup', onPointerUp);
  resizer.addEventListener('pointercancel', onPointerUp);
  resizer.addEventListener('dblclick', onDoubleClick);
  resizer.addEventListener('keydown', onKeyDown);
}

applyChromeTranslations();
initUpdater();
initPanelResizer();

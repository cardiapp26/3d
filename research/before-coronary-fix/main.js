import './style.css';
import {createHeart} from './heart.js';
import {structures,lessons} from './content.js';

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
      <div class="section-heading">ANATOMICAL LAYERS <span>09</span></div>
      <label class="layer"><i style="background:#c76260"></i>Chambers<input type="checkbox" data-layer="chambers" checked></label>
      <div class="layer-subgroup">
        ${[
          ['lv', 'Left ventricle (LV)', '#9b3238'],
          ['rv', 'Right ventricle (RV)', '#a43d42'],
          ['la', 'Left atrium (LA)', '#b55157'],
          ['ra', 'Right atrium (RA)', '#aa484e']
        ].map(([id, t, c]) => `<label class="layer sublayer"><i style="background:${c}"></i>${t}<input type="checkbox" data-layer="${id}" checked></label>`).join('')}
      </div>
      ${[
        ['vessels', 'Great vessels', '#729fca'],
        ['coronaries', 'Coronary circulation', '#ebba70'],
        ['conduction', 'Conduction system', '#b9d87e'],
        ['valves', 'Valves', '#d6c7bc']
      ].map(([id, t, c]) => `<label class="layer"><i style="background:${c}"></i>${t}<input type="checkbox" data-layer="${id}" checked></label>`).join('')}
      <label class="slider-label">Tissue opacity <span id="opacity-value">85%</span></label>
      <input id="opacity" aria-label="Tissue opacity" type="range" min="15" max="100" value="85">
    </section>
    <div class="aside-bottom">
      <span class="outline-icon">i</span>
      <p>Educational schematic<br><small>Not for clinical decision-making</small></p>
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
        <span class="pill">SCHEMATIC 3D MODEL</span>
      </div>
    </div>
    <div id="viewport" aria-label="Interactive 3D heart. Drag to rotate, scroll to zoom."></div>
    <div class="view-controls" aria-label="Camera presets">
      ${[['anterior','Anterior','A'],['posterior','Posterior','P'],['rao','RAO','R'],['lao','LAO','L'],['root','Root & Cusps','O']].map(([id,t,k])=>`<button data-view="${id}" class="${id==='anterior'?'selected':''}">${t} <kbd>${k}</kbd></button>`).join('')}
      <button id="reset" title="Reset camera (0)">↺</button>
    </div>
    <div class="viewer-bottom">
      <span>↔ Drag to rotate <em>·</em> Scroll to zoom <em>·</em> Click to inspect & focus</span>
      <div class="viewer-actions">
        <button id="beat" aria-pressed="false">♡ Animate beat <kbd>Space</kbd></button>
      </div>
    </div>
    <div id="scene-note">Patient right appears on viewer left in anterior view. Geometry, motion and fly-to focus are illustrative.</div>
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
    <div class="reference">
      <div class="eyebrow">SOURCE NOTE</div>
      <p id="source"></p>
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
      <small>Illustrative path; no collision, force, fluoroscopy physics, or tissue-response model.</small>
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
  <p><strong>Model limitations:</strong> Procedural schematic, not a segmented human heart. Microscopic scale, spatial relationships, catheter motion and beating are illustrative. This app does not certify procedural competence.</p>
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
    'pulmonary-valve': 'pa',
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

  for (const [target, key] of [['structure-title', 'title'], ['description', 'description'], ['clinical', 'clinical'], ['source', 'source']]) {
    document.getElementById(target).textContent = s[key] || '';
  }

  heart?.selectStructure(cleanId, flyTo);

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
  heart = createHeart(document.querySelector('#viewport'), (id) => inspect(id, true, true), onHoverStructure);
} catch (error) {
  document.querySelector('#viewport').innerHTML = '<div class="error">3D view unavailable. Enable WebGL or use a supported browser. Anatomy notes and guided lessons remain available.</div>';
  console.error(error);
}

function showStep() {
  document.querySelector('#progress').hidden = mode === 'ablation';
  document.querySelector('label[for=progress]').hidden = mode === 'ablation';
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

function setMode(newMode, updateUrl = true) {
  mode = newMode;
  step = 0;
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  heart?.setMode(mode);

  const opacity = lessons[mode] ? 28 : 85;
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

document.querySelectorAll('[data-layer]:not([data-layer="chambers"]):not([data-layer="lv"]):not([data-layer="rv"]):not([data-layer="la"]):not([data-layer="ra"])').forEach(el => {
  el.addEventListener('change', () => heart?.setLayer(el.dataset.layer, el.checked));
});

function setCameraPreset(viewName) {
  heart?.setView(viewName, true);
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('selected', b.dataset.view === viewName));
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

document.querySelector('#reset').addEventListener('click', () => {
  heart?.reset();
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('selected', b.dataset.view === 'anterior'));
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

// Keyboard shortcuts (1-5, A, P, R, L, 0, Space, ?, N)
window.addEventListener('keydown', e => {
  // Don't trigger if user is in an input or dialog is open
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
  } else if (key === 'o' || key === 'O') {
    setCameraPreset('root');
  } else if (key === '0') {
    heart?.reset();
    document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('selected', b.dataset.view === 'anterior'));
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


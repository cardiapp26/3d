// Standalone Echocardiography Module (TTE, TEE, ICE) Entry Point
import { createHeart } from '../heart.js';
import { mountSiteHeader } from '../site-header.js';
import { createEchoViewControls } from './echo-view-controls.js';
import { createPersonalNotes } from '../personal-notes.js';
import { createEchoMode } from '../echo-mode.js';
import { initialLanguage, rememberLanguage } from '../entry-language.js';
import { linkToLastRoute } from '../entry-route.js';
import { createPathologyPanel } from './echo-pathology-panel.js';
import './echo-studio.css';

const params = new URLSearchParams(location.search);
let lang = ['tr', 'en'].includes(params.get('lang')) ? params.get('lang') : initialLanguage();
// Notes drawer (right edge), created once the header exists.
let notes = null;

// Modality from URL query param, hash, or default to TTE
function parseInitialModality() {
  const qMod = params.get('modality');
  if (qMod && ['tte', 'tee', 'ice'].includes(qMod.toLowerCase())) return qMod.toLowerCase();
  const hash = location.hash;
  if (hash.includes('tee')) return 'tee';
  if (hash.includes('ice')) return 'ice';
  return 'tte';
}

let currentModality = parseInitialModality();

const TEXTS = {
  tr: {
    title: 'Cardia · Ekokardiyografi Stüdyosu (TTE, TEE & ICE)',
    beatPause: '⏸ Durdur',
    beatPlay: '▶ Oynat',
    look: 'Düzleme bak',
    labels: { hint: 'Üç görünüm aynı düzlemi gösterir: 3D kalp ve prob, eko sektörü ve bu düzlemin anatomisi.', anatomy3d: '3D anatomi', plane: 'Bu düzlemdeki anatomi', views: 'Görünümler', probe: 'Prob ve kateter konumu', handle: 'Kumanda', inImage: 'Bu görüntüde', pathology: 'Kapak patolojisi', thisView: 'Bu görünüm', reference: 'Gerçek eko kaydı', limits: 'Model sınırları' },
    disclaimer: 'Eğitim ve simülasyon amaçlıdır. EACVI/ASE kılavuzları (Lang 2015, Hahn 2013) ve PCR-EAPCI ICE konsensusu temel alınarak TTE (transtorasik), TEE (transözofajiyal multiplan) ve ICE (intrakardiyak ekokardiyografi) kesitleri 3D kalp geometrisinden anlık düzlem kesme algoritmasıyla modellenmiştir. Klinik tanı ve tedavi için uzman kardiyolog değerlendirmesi şarttır.'
  },
  en: {
    title: 'Cardia · Echocardiography Studio (TTE, TEE & ICE)',
    beatPause: '⏸ Freeze',
    beatPlay: '▶ Play',
    look: 'Face the plane',
    labels: { hint: 'All three views show one plane: the 3D heart with the probe, the echo sector and the anatomy of this plane.', anatomy3d: '3D anatomy', plane: 'Anatomy in this plane', views: 'Views', probe: 'Probe and catheter position', handle: 'Handle', inImage: 'In this image', pathology: 'Valve pathology', thisView: 'This view', reference: 'Recorded echo', limits: 'Model limits' },
    disclaimer: 'For educational and simulation purposes. Modeled after EACVI/ASE standards (Lang 2015, Hahn 2013) and the PCR-EAPCI ICE consensus. TTE, multiplane TEE, and ICE sections are rendered in real time from dynamic 3D cardiac surfaces via planar geometric clipping. Clinical decisions require licensed specialist assessment.'
  }
};

const text = (selector, val) => {
  const el = document.querySelector(selector);
  if (el) el.textContent = val;
};

// 1. Initialize 3D Heart Engine & Viewport
const viewport = document.querySelector('#viewport');
let heart = null;
try {
  heart = createHeart(
    viewport,
    () => {},
    () => {},
    () => {}
  );
  window.heart = heart;
} catch (err) {
  if (viewport) {
    viewport.innerHTML = '<div class="error" style="color:#f87171;padding:24px;">3D WebGL görünümü başlatılamadı.</div>';
  }
  console.error('Heart engine initialization failed:', err);
}

// 2. Initialize Echocardiography Mode in the Studio Panel
const echoMount = document.querySelector('#echo-panel');
let echoMode = null;
if (heart && echoMount) {
  // Studio layout: each part of the echo panel has its own place on the page (echo-panel.js slots).
  const slots = Object.fromEntries([...document.querySelectorAll('[data-echo-slot]')].map(node => [node.dataset.echoSlot, node]));
  echoMode = createEchoMode({
    heart,
    mount: echoMount,
    getLang: () => lang,
    slots
  });
  window.cardiaEcho = echoMode;
}

// Severe valve lesions: lesion on the echo image, colour and spectral Doppler, quantification.
const pathologyMount = document.querySelector('[data-echo-pathology]');
const pathology = pathologyMount && echoMode ? createPathologyPanel(pathologyMount, { echo: echoMode, heart, getLang: () => lang }) : null;

// Myocardium opacity and fullscreen / zoom / reset over the 3D viewport.
const viewControls = createEchoViewControls({
  container: document.querySelector('.echo-viewport-container'),
  heart,
  getLang: () => lang
});


// 3. UI Synchronization & Shell Texts
function renderShell() {
  const t = TEXTS[lang];
  viewControls.setLanguage(lang);
  document.documentElement.lang = lang;
  document.title = t.title;

  mountSiteHeader(document.querySelector('.site-header'), lang);
  notes?.refresh();
  linkToLastRoute(document);
  pathology?.render();
  text('[data-echo-disclaimer]', t.disclaimer);
  document.querySelectorAll('[data-echo-text]').forEach(node => { node.textContent = t.labels[node.dataset.echoText] || node.textContent; });

  const lookBtn = document.querySelector('[data-echo-action="look"]');
  if (lookBtn) lookBtn.textContent = t.look;

  document.querySelectorAll('[data-echo-lang]').forEach(btn => {
    const isAct = btn.dataset.echoLang === lang;
    btn.classList.toggle('active', isAct);
    btn.setAttribute('aria-pressed', String(isAct));
  });
}

// 4. Cardiac Cycle UI Controls & Subscriptions
const beatBtn = document.querySelector('#beat');
const cycleSlider = document.querySelector('#cycle-slider');
const cycleLabel = document.querySelector('#cycle-label');

function updateCycleUI(cycleState) {
  if (!cycleState) return;
  const isPlaying = cycleState.playing;
  if (beatBtn) {
    beatBtn.setAttribute('aria-pressed', String(isPlaying));
    beatBtn.textContent = isPlaying ? TEXTS[lang].beatPause : TEXTS[lang].beatPlay;
  }
  if (cycleSlider && document.activeElement !== cycleSlider) {
    cycleSlider.value = String(cycleState.phase);
  }
  if (cycleLabel) {
    cycleLabel.textContent = `%${Math.round(cycleState.phase * 100)}`;
  }
}

if (heart) {
  heart.subscribeCycle(state => {
    echoMode?.tick(state);
    pathology?.tick(state);
    updateCycleUI(state);
  });
}

// Beat Play/Pause button
if (beatBtn && heart) {
  beatBtn.addEventListener('click', () => {
    const cur = heart.getCycleState()?.playing;
    heart.setBeating(!cur);
  });
}

// Cycle Phase Slider scrubbing
if (cycleSlider && heart) {
  cycleSlider.addEventListener('input', e => {
    const phase = Number(e.target.value);
    heart.seekCycle(phase);
    if (cycleLabel) cycleLabel.textContent = `%${Math.round(phase * 100)}`;
  });
}

// Camera Preset View Buttons
document.querySelectorAll('[data-cam]').forEach(btn => {
  btn.addEventListener('click', () => {
    const cam = btn.dataset.cam;
    if (heart && cam) heart.setView(cam, true);
  });
});

// Look at Imaging Plane Button
const lookAtPlaneBtn = document.querySelector('[data-echo-action="look"]');
if (lookAtPlaneBtn) {
  lookAtPlaneBtn.addEventListener('click', () => {
    const res = echoMode?.getResult();
    if (heart && res && res.frame) {
      heart.lookAlong(res.frame.origin, res.frame.normal, res.frame.beam, echoMode.getState().depth);
    }
  });
}

// Modality & View Synchronization with test suite hooks
document.querySelectorAll('[data-mode]').forEach(btn => {
  btn.addEventListener('click', () => {
    const m = btn.dataset.mode;
    if (m === 'anatomy') {
      window.location.href = '../';
      return;
    }
    const targetModality = m === 'echo' ? 'tte' : m;
    currentModality = targetModality;
    echoMode?.enter(targetModality);
  });
});

// Language Switch Event
document.querySelectorAll('[data-echo-lang]').forEach(btn => {
  btn.addEventListener('click', () => {
    const next = btn.dataset.echoLang;
    if (next === lang) return;
    lang = next;
    rememberLanguage(lang);

    const url = new URL(location.href);
    url.searchParams.delete('lang');
    history.replaceState(null, '', url);

    renderShell();
    echoMode?.setLanguage(lang);
    updateCycleUI(heart?.getCycleState());
  });
});

// Language toggle button (#lang-btn compatibility hook for test harnesses)
const langBtnCompat = document.createElement('button');
langBtnCompat.id = 'lang-btn';
langBtnCompat.style.display = 'none';
langBtnCompat.setAttribute('aria-hidden', 'true');
langBtnCompat.addEventListener('click', () => {
  const next = lang === 'tr' ? 'en' : 'tr';
  lang = next;
  rememberLanguage(lang);
  renderShell();
  echoMode?.setLanguage(lang);
});
document.body.appendChild(langBtnCompat);

// 5. Model Loading & Initial Enter
renderShell();
notes = createPersonalNotes({ getLang: () => lang });

if (heart?.ready) {
  heart.ready
    .then(() => {
      heart.setBeating(true);
      echoMode?.enter(currentModality);
      const initialView = params.get('view');
      if (initialView) {
        echoMode?.selectView(initialView);
      }
    })
    .catch(err => {
      console.error('Failed to load anatomical model for echo studio:', err);
    });
} else {
  heart?.setBeating(true);
  echoMode?.enter(currentModality);
}

// Service worker for offline capability
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../sw.js', { scope: '../', updateViaCache: 'none' })
    .catch(err => console.warn('Echo offline cache unavailable', err));
}

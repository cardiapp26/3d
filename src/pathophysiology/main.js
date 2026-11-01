// Cardiovascular Pathophysiology Studio: coordinator & navigation
import { initialLanguage, rememberLanguage } from '../entry-language.js';
import { mountSiteHeader } from '../site-header.js';
import { PATHOPHYS_STATIONS, PATHOPHYS_GROUPS } from './pathophysiology-data.js';

import { createPVLoopLab } from './pv-loop-lab.js';
import { createScenarioPvLoop } from './scenario-pv-loop.js';
import { createLoadsLab } from './loads-lab.js';
import { createPhysiologyLab } from './physiology-lab.js';
import { createWiggersLab } from './wiggers-lab.js';
import { createStarlingLaplaceLab } from './starling-laplace-lab.js';
import { createAtherogenesisLab } from './atherogenesis-lab.js';
import { createIschemicCascadeLab } from './ischemic-cascade-lab.js';
import { createHeartFailureLab } from './heart-failure-lab.js';
import { createPericardialLab } from './pericardial-lab.js';
import { createElectrophysLab } from './electrophys-lab.js';
import { createForresterLab } from './forrester-lab.js';
import { createValvularLab } from './valvular-lab.js';
import { createHypertensionLab } from './hypertension-lab.js';
import { createPahRvLab } from './pah-rv-lab.js';
import { createMyocardialCkmLab } from './myocardial-ckm-lab.js';
import { createAchdShuntsLab } from './achd-shunts-lab.js';

import './pathophysiology.css';
import { createLearningStudio } from './learning-studio.js';

const params = new URLSearchParams(window.location.search);
let lang = ['tr', 'en'].includes(params.get('lang')) ? params.get('lang') : initialLanguage();

let currentStationId = getStationFromHash();
let activeLabInstance = null;
let learningStudio = null;
let experimentRecords = {};
function markProgress(records = experimentRecords) {
  experimentRecords = records;
  document.querySelectorAll('[data-station]').forEach(button => { button.dataset.experimentComplete = String(Boolean(records[button.dataset.station]?.completed)); });
}

const LAB_FACTORIES = {
  'pv-loop': createPvStation,
  'loads': createLoadsLab,
  'starling-laplace': createStarlingLaplaceLab,
  'physiology': createPhysiologyLab,
  'wiggers': createWiggersLab,
  'atherogenesis': createAtherogenesisLab,
  'ischemic-cascade': createIschemicCascadeLab,
  'heart-failure': createHeartFailureLab,
  'pericardial': createPericardialLab,
  'myocardial-ckm': createMyocardialCkmLab,
  'forrester': createForresterLab,
  'valvular': createValvularLab,
  'electrophys': createElectrophysLab,
  'hypertension-vascular': createHypertensionLab,
  'pah-rv': createPahRvLab,
  'achd-shunts': createAchdShuntsLab
};

/** P-V station: the interactive elastance lab, then the loop of the catheter scenarios. */
function createPvStation(opts) {
  const lab = createPVLoopLab(opts);
  const scenarioLoop = createScenarioPvLoop({ lang: opts.lang });
  opts.container.append(scenarioLoop.element);
  return {
    updateLanguage(next) { lab.updateLanguage?.(next); scenarioLoop.setLanguage(next); },
    destroy() { lab.destroy?.(); scenarioLoop.destroy(); }
  };
}

function getStationFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  const found = PATHOPHYS_STATIONS.find(s => s.id === hash);
  return found ? found.id : PATHOPHYS_STATIONS[0].id;
}

function updateStaticText() {
  document.documentElement.lang = lang;
  const isTr = lang === 'tr';

  // Eyebrow
  const eyebrow = document.querySelector('[data-pathophys-eyebrow]');
  if (eyebrow) {
    eyebrow.textContent = isTr ? 'Kardiyovasküler Stüdyo' : 'Cardiovascular Studio';
  }

  // Sidebar title & subtitle
  const title = document.querySelector('[data-pathophys-title]');
  if (title) {
    title.textContent = isTr ? 'Patofizyoloji' : 'Pathophysiology';
  }

  const subtitle = document.querySelector('[data-pathophys-subtitle]');
  if (subtitle) {
    subtitle.textContent = isTr
      ? 'Hücresel elektrofizyolojiden ventriküler mekaniğe, aterom biyolojisinden kapak ve hemodinamiğe etkileşimli modeller.'
      : 'Interactive didactic models spanning cellular electrophysiology, ventricular mechanics, atheroma biology, and hemodynamics.';
  }

  const note = document.querySelector('[data-pathophys-note]');
  if (note) {
    note.textContent = isTr
      ? 'Grafik ve parametreleri canlı değiştirerek klinik sonuçları eşzamanlı gözlemleyebilirsiniz.'
      : 'Interact with graphs and sliders in real time to observe downstream hemodynamic sequelae.';
  }

  const disclaimer = document.querySelector('[data-pathophys-disclaimer]');
  if (disclaimer) {
    disclaimer.textContent = isTr
      ? 'Cardia Patofizyoloji Stüdyosu · Kardiyoloji eğitimi ve simülasyon amaçlıdır. Klinik tanı ve tedavi protokollerinin yerine geçmez.'
      : 'Cardia Pathophysiology Studio · Designed for cardiology medical education and simulation. Not intended as a clinical decision system.';
  }

  // Station info
  const station = PATHOPHYS_STATIONS.find(s => s.id === currentStationId) || PATHOPHYS_STATIONS[0];
  const stationNum = document.querySelector('[data-pathophys-station-num]');
  if (stationNum) {
    stationNum.textContent = `${isTr ? 'İSTASYON' : 'STATION'} ${station.num}`;
  }

  const stationTitle = document.querySelector('[data-pathophys-station-title]');
  if (stationTitle) {
    stationTitle.textContent = station.title[lang];
  }

  const stationIntro = document.querySelector('[data-pathophys-station-intro]');
  if (stationIntro) {
    stationIntro.textContent = station.intro[lang];
  }

  // Language buttons
  document.querySelectorAll('[data-pathophys-lang]').forEach(btn => {
    const active = btn.dataset.pathophysLang === lang;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function renderNav() {
  const nav = document.querySelector('[data-pathophys-nav]');
  if (!nav) return;

  nav.innerHTML = PATHOPHYS_GROUPS.map(group => `
    <p class="pathophys-nav-group">${group.label[lang]}</p>
    ${PATHOPHYS_STATIONS.filter(st => st.group === group.id).map(st => `
    <button type="button" class="pathophys-nav-item ${st.id === currentStationId ? 'active' : ''}" data-station="${st.id}">
      <span class="nav-item-num">${st.num}</span>
      <span class="nav-item-text">${st.shortTitle[lang]}</span>
    </button>`).join('')}
  `).join('');

  markProgress();
  nav.querySelectorAll('[data-station]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.station;
      if (targetId !== currentStationId) {
        currentStationId = targetId;
        window.location.hash = `#${targetId}`;
        switchStation(targetId);
      }
    });
  });
}

function switchStation(stationId) {
  currentStationId = stationId;
  const content = document.querySelector('[data-pathophys-content]');
  if (!content) return;

  learningStudio?.destroy();
  activeLabInstance?.destroy?.();
  content.innerHTML = '';
  activeLabInstance = null;

  const factory = LAB_FACTORIES[stationId] || LAB_FACTORIES['pv-loop'];
  activeLabInstance = factory({ container: content, lang });
  learningStudio = createLearningStudio({ container: content, station: PATHOPHYS_STATIONS.find(s => s.id === stationId), lang, onProgress: markProgress });

  updateStaticText();
  renderNav();
}

function initLanguage() {
  document.querySelectorAll('[data-pathophys-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      const newLang = btn.dataset.pathophysLang;
      if (newLang === lang) return;

      lang = newLang;
      rememberLanguage(lang);

      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url.toString());

      // Update Header
      const header = document.querySelector('.site-header');
      if (header) {
        mountSiteHeader(header, lang);
      }

      updateStaticText();
      renderNav();

      if (activeLabInstance) {
        if (typeof activeLabInstance.updateLanguage === 'function') {
          activeLabInstance.updateLanguage(lang);
        }
        if (typeof activeLabInstance.setLanguage === 'function') {
          activeLabInstance.setLanguage(lang);
        }
      }
      learningStudio?.updateLanguage(lang);
    });
  });
}

function init() {
  const header = document.querySelector('.site-header');
  if (header) {
    mountSiteHeader(header, lang);
  }

  initLanguage();
  updateStaticText();
  renderNav();
  switchStation(currentStationId);

  window.addEventListener('hashchange', () => {
    const newStation = getStationFromHash();
    if (newStation !== currentStationId) {
      switchStation(newStation);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

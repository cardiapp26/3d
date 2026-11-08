// Cardiovascular Pathophysiology Studio: coordinator & navigation
import { initialLanguage, rememberLanguage } from '../entry-language.js';
import { mountSiteHeader } from '../site-header.js';
import { PATHOPHYS_STATIONS, PATHOPHYS_GROUPS } from './pathophysiology-data.js';

import { createPVLoopLab } from './pv-loop-lab.js';
import { createScenarioPvLoop } from './scenario-pv-loop.js';
import { createPvLessonsLab } from './pv-lessons-lab.js';
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
import { createRegurgitationLab } from './regurgitation-lab.js';
import { createAcuteValveHemoLab } from './acute-valve-hemo-lab.js';
import { createHypertensionLab } from './hypertension-lab.js';
import { createSaltRaasLab } from './salt-raas-lab.js';
import { createPahRvLab } from './pah-rv-lab.js';
import { createMyocardialCkmLab } from './myocardial-ckm-lab.js';
import { createAchdShuntsLab } from './achd-shunts-lab.js';
import { createVesselWallLab } from './vessel-wall-lab.js';

import './pathophysiology.css';
import './salt-raas.css';
import './vessel-wall.css';
import { createVisualInteraction } from './visual-interaction.js';

const params = new URLSearchParams(window.location.search);
let lang = ['tr', 'en'].includes(params.get('lang')) ? params.get('lang') : initialLanguage();

let currentStationId = getStationFromHash();
let activeLabInstance = null;
let visualInteraction = null;

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
  'valvular': createValvularStation,
  'electrophys': createElectrophysLab,
  'hypertension-vascular': createVascularStation,
  'pah-rv': createPahRvLab,
  'achd-shunts': createAchdShuntsLab
};

/** P-V station: the interactive elastance lab, the loop of the catheter scenarios, then the whiteboard lessons. */
const PV_TABS = [
  { id: 'explore', label: { tr: 'Serbest keşif', en: 'Free exploration' } },
  { id: 'scenarios', label: { tr: 'Kateter senaryoları', en: 'Catheter scenarios' } },
  { id: 'anatomy', lesson: true, label: { tr: '1. Döngünün anatomisi', en: '1. Anatomy of the loop' } },
  { id: 'afterload', lesson: true, label: { tr: '2. Artmış ard yük', en: '2. Increased afterload' } },
  { id: 'lusitropy', lesson: true, label: { tr: '3. Azalmış lusitropi', en: '3. Decreased lusitropy' } }
];

/**
 * P-V loop station: one card, one row of tabs. Free exploration (presets, sliders, readouts),
 * the catheter scenarios' loops and the three step-by-step lessons used to sit one under another.
 */
function createPvStation(opts) {
  let lang = opts.lang === 'en' ? 'en' : 'tr';
  const tabBar = document.createElement('div');
  tabBar.className = 'preset-pill-group pv-station-tabs';
  tabBar.setAttribute('role', 'tablist');
  const hosts = { explore: document.createElement('div'), scenarios: document.createElement('div'), lessons: document.createElement('div') };
  hosts.lessons.className = 'pv-station-lessons';
  opts.container.append(tabBar, hosts.explore, hosts.scenarios, hosts.lessons);
  const lab = createPVLoopLab({ ...opts, container: hosts.explore, mount: hosts.explore });
  const scenarioLoop = createScenarioPvLoop({ lang });
  hosts.scenarios.append(scenarioLoop.element);
  const lessons = createPvLessonsLab({ container: hosts.lessons, lang });
  const buttons = PV_TABS.map(tab => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'preset-pill';
    b.setAttribute('role', 'tab');
    b.dataset.pvTab = tab.id;
    b.addEventListener('click', () => show(tab.id));
    return b;
  });
  tabBar.append(...buttons);
  let current = 'explore';
  function show(id) {
    current = id;
    const tab = PV_TABS.find(t => t.id === id);
    hosts.explore.hidden = id !== 'explore';
    hosts.scenarios.hidden = id !== 'scenarios';
    hosts.lessons.hidden = !tab.lesson;
    if (tab.lesson) hosts.lessons.querySelector(`.pvl-tab[data-lesson="${id}"]`)?.click();
    buttons.forEach(b => {
      const on = b.dataset.pvTab === id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    });
  }
  function label() { buttons.forEach((b, i) => { b.textContent = PV_TABS[i].label[lang]; }); }
  label();
  show(current);
  return {
    updateLanguage(next) { lang = next === 'en' ? 'en' : 'tr'; label(); lab.updateLanguage?.(next); scenarioLoop.setLanguage(next); lessons.updateLanguage(next); },
    destroy() { lab.destroy?.(); scenarioLoop.destroy(); lessons.destroy(); }
  };
}

/** Valvular station: the lesion lab (own host, it re-renders its container), then acute vs chronic MR/AR and acute valvular emergency hemodynamics. */
function createValvularStation(opts) {
  const host = document.createElement('div');
  opts.container.append(host);
  const lab = createValvularLab({ ...opts, container: host });
  const regurg = createRegurgitationLab({ container: opts.container, lang: opts.lang });
  const acute = createAcuteValveHemoLab({ container: opts.container, lang: opts.lang });
  return {
    updateLanguage(next) { lab.updateLanguage?.(next); regurg.updateLanguage(next); acute.updateLanguage(next); },
    destroy() { lab.destroy?.(); regurg.destroy(); acute.destroy(); }
  };
}

/** Vascular station: salt adaptation, wave reflection and vessel wall stress. */
function createVascularStation(opts) {
  const raas = createSaltRaasLab(opts);
  const lab = createHypertensionLab(opts);
  const wall = createVesselWallLab({ container: opts.container, lang: opts.lang });
  return {
    updateLanguage(next) { raas.updateLanguage(next); lab.updateLanguage?.(next); wall.setLanguage(next); },
    destroy() { raas.destroy(); lab.destroy?.(); wall.destroy(); }
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

  // The station list starts at once; the page title stays for screen readers only.
  const title = document.querySelector('[data-pathophys-title]');
  if (title) {
    title.textContent = isTr ? 'Patofizyoloji' : 'Pathophysiology';
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

  visualInteraction?.destroy();
  activeLabInstance?.destroy?.();
  content.innerHTML = '';
  activeLabInstance = null;

  const factory = LAB_FACTORIES[stationId] || LAB_FACTORIES['pv-loop'];
  activeLabInstance = factory({ container: content, lang });
  visualInteraction = createVisualInteraction({ container: content, lang });

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
      visualInteraction?.updateLanguage(lang);
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

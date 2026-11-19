import { createHemodynamics } from './hemodynamics.js';
import { createHemoPanel } from './hemo-panel.js';
import { CATH_STEP } from './cath-lab.js';
import { hemoJvpScenario } from './jvp-physiology.js';

// Glue between the catheterization lesson, the 3D cath lab and the
// hemodynamics panel (one module: catheterization and hemodynamics). The
// panel is built the first time the mode is entered; lesson steps set a
// scenario, the overlaid channels, beats and respiration, and the channels
// choose how far the catheters are advanced. Picking a 3D station adds its
// channel. The scenario's heart rate drives the shared cycle clock so the 3D
// beat, the ECG and the tracings agree; the previous rate is restored when
// the mode is left.

// Which catheter stage of the cath lab (cath-lab.js CATH_STEP) shows the
// station a channel measures.
const STATION_STEP = Object.freeze({
  ra: CATH_STEP.ra, rv: CATH_STEP.rv, pa: CATH_STEP.pa, pcwp: CATH_STEP.pa, lv: CATH_STEP.left, ao: CATH_STEP.left
});
const BOTH_CATHETERS = CATH_STEP.both;
// Shunt run sites (hemo-shunt-run.js) with a catheter course of their own;
// the other sites use the stage of their pressure station.
const SITE_STEP = Object.freeze({ ivc: CATH_STEP.ivc, svc: CATH_STEP.svc, pv: CATH_STEP.pulmonaryVein });
// 3D station pick ids to shunt run sites. The caval and pulmonary vein
// stations exist only for sampling, so a click there always draws the sample.
const PICK_SITE = Object.freeze({
  'cath-svc': 'svc', 'cath-ivc': 'ivc', 'cath-ra': 'ra', 'cath-rv': 'rv', 'cath-pa': 'pa', 'cath-wedge': 'pcwp',
  'cath-pv': 'pv', 'cath-ao': 'ao'
});
const SAMPLING_ONLY_SITES = Object.freeze(['svc', 'ivc', 'pv']);
// 3D station pick ids (cath-lab.js) to panel channels.
const PICK_STATION = Object.freeze({
  'cath-ra': 'ra', 'cath-rv': 'rv', 'cath-pa': 'pa', 'cath-wedge': 'pcwp', 'cath-lv': 'lv', 'cath-ao': 'ao'
});
const MAX_CHANNELS = 3;
const JVP_LINK = Object.freeze({ tr: 'Boyunda aynı olgu: juguler venöz nabız →', en: 'Same case at the bedside: jugular venous pulse →' });

/**
 * @param {{ heart: object, mount: HTMLElement, getLang: () => 'tr'|'en', onFocus?: (station: string) => void,
 *   onOpenJvp?: (jvpScenario: string) => void }} deps
 *   onOpenJvp: a scenario the JVP model shares (normal, constriction, tamponade) opens the same case there.
 */
export function createHemoMode({ heart, mount, getLang, onFocus, onOpenJvp }) {
  let hemo = null;
  let panel = null;
  let jvpLink = null;
  function renderJvpLink() {
    if (!jvpLink) return;
    const target = onOpenJvp && hemo ? hemoJvpScenario(hemo.getScenario().id) : null;
    jvpLink.hidden = !target;
    jvpLink.textContent = JVP_LINK[getLang() === 'en' ? 'en' : 'tr'];
  }
  let active = false;
  let previousBpm = null;

  function ensurePanel() {
    if (panel) return panel;
    hemo = createHemodynamics('normal');
    panel = createHemoPanel(mount, {
      hemo,
      lang: getLang(),
      getCycleState: () => heart.getCycleState(),
      onScenarioChange() {
        heart.setBpm(hemo.getScenario().hr);
        renderJvpLink();
      },
      // Toggling channels in the panel advances or withdraws the 3D catheters.
      onChannelsChange(channels) {
        showStations(channels);
      },
      onStationFocus(station) {
        showStations(panel.getChannels());
        onFocus?.(station);
      },
      // A shunt run sample: the catheter takes the course to that site.
      onSample(site) {
        heart.setCathStep(SITE_STEP[site.id] ?? STATION_STEP[site.channel]);
        onFocus?.(site.id);
      }
    });
    jvpLink = document.createElement('button');
    jvpLink.type = 'button';
    jvpLink.className = 'hemo-crosslink';
    jvpLink.dataset.hemoAction = 'jvp';
    jvpLink.addEventListener('click', () => { const target = hemoJvpScenario(hemo.getScenario().id); if (target) onOpenJvp?.(target); });
    mount.append(jvpLink);
    renderJvpLink();
    return panel;
  }

  function showStations(channels) {
    if (!channels?.length) return;
    const stages = channels.map(station => STATION_STEP[station]).filter(stage => stage !== undefined);
    if (!stages.length) return;
    const left = stages.includes(STATION_STEP.lv);
    const right = stages.filter(stage => stage !== STATION_STEP.lv);
    // Both circuits show both catheters; otherwise the catheter is advanced
    // as far as the deepest station in view.
    heart.setCathStep(left && right.length ? BOTH_CATHETERS : Math.max(...stages));
  }

  return {
    enter() {
      if (!active) previousBpm = heart.getCycleState()?.bpm ?? null;
      active = true;
      ensurePanel();
      mount.hidden = false;
    },
    /** Station targets of the active scenario (the Wiggers strip draws the same pressures). */
    getStations() { return active && hemo ? hemo.getScenario().stations : null; },
    exit() {
      if (active && previousBpm !== null) heart.setBpm(previousBpm);
      active = false;
      mount.hidden = true;
    },
    /** Apply a lesson step; a language switch (`relabel`) only refreshes the step title, so the scenario the user chose stays. */
    applyStep(step, { relabel = false } = {}) {
      const p = ensurePanel();
      if (relabel) { p.setHint?.(step.title || ''); return; }
      if (step.scenario) {
        p.setScenario(step.scenario);
        heart.setBpm(hemo.getScenario().hr);
      }
      if (step.channels) p.setChannels(step.channels);
      if (step.beats) p.setBeats(step.beats);
      p.setRespiration(Boolean(step.respiration));
      p.setHint?.(step.title || '');
      p.setCalculatorsOpen?.(Boolean(step.calculators));
      showStations(step.channels);
      renderJvpLink();
      p.draw(heart.getCycleState());
    },
    /** A 3D station was picked (pick id `cath-ra`, `cath-wedge`, ...). */
    focusStation(pickId) {
      const station = PICK_STATION[pickId];
      if (!active || !station) return;
      const p = ensurePanel();
      const current = p.getChannels();
      if (current.includes(station)) return;
      const next = [...current, station].slice(-MAX_CHANNELS);
      p.setChannels(next);
      showStations(next);
    },
    /**
     * The user clicked a 3D station. A sampling-only station (SVC, IVC,
     * pulmonary vein) draws its sample and opens the shunt run; the pressure
     * stations do so while the shunt run is open.
     */
    pickStation(pickId) {
      const siteId = PICK_SITE[pickId];
      if (!active || !siteId) return;
      const run = ensurePanel().getShuntRun();
      if (!run.element.open && !SAMPLING_ONLY_SITES.includes(siteId)) return;
      if (run.sample(siteId)) run.element.open = true;
    },
    tick(state) {
      if (active && panel) panel.draw(state);
    },
    setLanguage(lang) {
      panel?.setLanguage(lang);
      renderJvpLink();
    },
    isActive: () => active,
    getModel: () => hemo
  };
}

import { createHemodynamics } from './hemodynamics.js';
import { createHemoPanel } from './hemo-panel.js';

// Glue between the catheterization lesson, the 3D cath lab and the
// hemodynamics panel (one module: catheterization and hemodynamics). The
// panel is built the first time the mode is entered; lesson steps set a
// scenario, the overlaid channels, beats and respiration, and the channels
// choose how far the catheters are advanced. Picking a 3D station adds its
// channel. The scenario's heart rate drives the shared cycle clock so the 3D
// beat, the ECG and the tracings agree; the previous rate is restored when
// the mode is left.

// Which catheter stage of the cath lab shows the station a channel measures
// (cath-lab.js: 0 RA, 1 RV, 2 PA + wedge, 3 left heart, 4 both catheters).
const STATION_STEP = Object.freeze({ ra: 0, rv: 1, pa: 2, pcwp: 2, lv: 3, ao: 3 });
const BOTH_CATHETERS = 4;
// 3D station pick ids (cath-lab.js) to panel channels.
const PICK_STATION = Object.freeze({
  'cath-ra': 'ra', 'cath-rv': 'rv', 'cath-pa': 'pa', 'cath-wedge': 'pcwp', 'cath-lv': 'lv', 'cath-ao': 'ao'
});
const MAX_CHANNELS = 3;

/**
 * @param {{ heart: object, mount: HTMLElement, getLang: () => 'tr'|'en', onFocus?: (station: string) => void }} deps
 */
export function createHemoMode({ heart, mount, getLang, onFocus }) {
  let hemo = null;
  let panel = null;
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
      },
      // Toggling channels in the panel advances or withdraws the 3D catheters.
      onChannelsChange(channels) {
        showStations(channels);
      },
      onStationFocus(station) {
        showStations(panel.getChannels());
        onFocus?.(station);
      }
    });
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
    exit() {
      if (active && previousBpm !== null) heart.setBpm(previousBpm);
      active = false;
      mount.hidden = true;
    },
    /** Apply a lesson step: { scenario, channels, beats, respiration, calculators, title }. */
    applyStep(step) {
      const p = ensurePanel();
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
    tick(state) {
      if (active && panel) panel.draw(state);
    },
    setLanguage(lang) {
      panel?.setLanguage(lang);
    },
    isActive: () => active,
    getModel: () => hemo
  };
}

import { createHemodynamics } from './hemodynamics.js';
import { createHemoPanel } from './hemo-panel.js';

// Glue between the lesson UI, the 3D cath lab and the hemodynamics panel.
// The panel is built the first time the mode is entered; lesson steps set a
// scenario, the overlaid channels, beats and respiration. The scenario's
// heart rate drives the shared cycle clock so the 3D beat, the ECG and the
// tracings agree; the previous rate is restored when the mode is left.

// Which catheter stage of the cath lab shows the station a channel measures.
const STATION_STEP = Object.freeze({ ra: 0, rv: 1, pa: 2, pcwp: 2, lv: 3, ao: 3 });

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
      onStationFocus(station) {
        if (station in STATION_STEP) heart.setCathStep(STATION_STEP[station]);
        onFocus?.(station);
      }
    });
    return panel;
  }

  function showStations(channels) {
    if (!channels?.length) return;
    const stages = new Set(channels.map(station => STATION_STEP[station]).filter(stage => stage !== undefined));
    // Both circuits: the overview stage shows right and left catheters together.
    heart.setCathStep(stages.size > 1 && stages.has(3) ? 4 : [...stages][0]);
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

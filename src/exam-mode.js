import { createExamPanel } from './exam-panel.js';
import { createJvpPanel } from './jvp-panel.js';
import { JVP_TEXT } from './jvp-content.js';

// Glue between the lesson UI, the 3D auscultation markers and the physical
// examination panels: auscultation and the jugular venous pulse, as two
// sub-tabs. Built the first time the mode is entered; lesson steps pick the
// finding, the maneuver and the auscultation area, or (`jvp`) the venous
// pattern, the breathing phase and a wave.

/**
 * @param {{ heart: object, mount: HTMLElement, getLang: () => 'tr'|'en', onArea?: (areaId: string) => void }} deps
 */
export function createExamMode({ heart, mount, getLang, onArea }) {
  let panel = null, jvp = null, tabs = null;
  let active = false, view = 'auscultation';
  const sections = {};

  function ensurePanel() {
    if (panel) return panel;
    tabs = document.createElement('div');
    tabs.className = 'exam-subtabs';
    tabs.setAttribute('role', 'tablist');
    for (const id of ['auscultation', 'jvp']) {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.dataset.examView = id;
      tab.addEventListener('click', () => showView(id));
      tabs.append(tab);
      sections[id] = document.createElement('div');
      sections[id].className = `exam-view exam-view-${id}`;
    }
    mount.append(tabs, sections.auscultation, sections.jvp);
    panel = createExamPanel(sections.auscultation, {
      lang: getLang(),
      getCycleState: () => heart.getCycleState(),
      onAreaFocus(areaId) {
        heart.highlightAuscultation(areaId);
        onArea?.(areaId);
      }
    });
    jvp = createJvpPanel(sections.jvp, {
      getLang,
      getCycleState: () => heart.getCycleState(),
      onSeek: (phase, options) => heart.seekCycle(phase, options),
      onFreeze: frozen => heart.setBeating(!frozen),
      onSlow: slow => heart.setCycleSpeed(slow ? 0.35 : 1)
    });
    showView(view);
    return panel;
  }

  function showView(id) {
    view = id;
    if (!tabs) return;
    const lang = getLang() === 'en' ? 'en' : 'tr';
    for (const tab of tabs.children) {
      const on = tab.dataset.examView === id;
      tab.textContent = JVP_TEXT[lang][tab.dataset.examView === 'jvp' ? 'tab' : 'auscultation'];
      tab.setAttribute('aria-selected', String(on));
    }
    sections.auscultation.hidden = id !== 'auscultation';
    sections.jvp.hidden = id !== 'jvp';
    if (id === 'jvp') { panel?.setAudioEnabled?.(false); heart.highlightAuscultation(null); jvp.draw(heart.getCycleState()); }
    else jvp?.pause();
  }

  return {
    enter() {
      active = true;
      ensurePanel();
      mount.hidden = false;
    },
    exit() {
      active = false;
      mount.hidden = true;
      panel?.setAudioEnabled?.(false);
      jvp?.reset();
      heart.highlightAuscultation(null);
    },
    /** Apply a lesson step: { finding, maneuver, area, title } or { jvp: { view, scenario, respiration, wave, response, peep, atrialRate } }. */
    applyStep(step) {
      const p = ensurePanel();
      if (step.jvp) {
        showView('jvp');
        jvp.apply(step.jvp);
        return;
      }
      showView('auscultation');
      if (step.finding) p.setFinding(step.finding);
      if (step.maneuver) p.setManeuver(step.maneuver, { autoplay: false });
      if (step.area) p.setArea(step.area);
      // The 3D focus follows the panel: the step's area, else the finding's own area.
      heart.highlightAuscultation(p.getArea());
      p.setHint(step.title || '');
      p.draw(heart.getCycleState());
    },
    /** A 3D auscultation marker was picked (pickId `ausc-<area>`). */
    focusArea(areaId) {
      if (!panel) return;
      showView('auscultation');
      panel.setArea(areaId);
      heart.highlightAuscultation(areaId);
    },
    tick(state) {
      if (!active || !panel) return;
      if (view === 'jvp') jvp.draw(state); else panel.draw(state);
    },
    setLanguage(lang) {
      panel?.setLanguage(lang);
      jvp?.setLanguage(lang);
      showView(view);
    },
    getView: () => view,
    getJvp: () => jvp,
    isActive: () => active
  };
}

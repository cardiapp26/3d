import { createExamPanel } from './exam-panel.js';

// Glue between the lesson UI, the 3D auscultation markers and the physical
// examination panel. Built the first time the mode is entered; lesson steps
// pick the finding, the maneuver and the auscultation area.

/**
 * @param {{ heart: object, mount: HTMLElement, getLang: () => 'tr'|'en', onArea?: (areaId: string) => void }} deps
 */
export function createExamMode({ heart, mount, getLang, onArea }) {
  let panel = null;
  let active = false;

  function ensurePanel() {
    if (panel) return panel;
    panel = createExamPanel(mount, {
      lang: getLang(),
      getCycleState: () => heart.getCycleState(),
      onAreaFocus(areaId) {
        heart.highlightAuscultation(areaId);
        onArea?.(areaId);
      }
    });
    return panel;
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
      heart.highlightAuscultation(null);
    },
    /** Apply a lesson step: { finding, maneuver, area, title }. */
    applyStep(step) {
      const p = ensurePanel();
      if (step.finding) p.setFinding(step.finding);
      if (step.maneuver) p.setManeuver(step.maneuver, { autoplay: false });
      if (step.area) {
        p.setArea(step.area);
        heart.highlightAuscultation(step.area);
      }
      p.setHint(step.title || '');
      p.draw(heart.getCycleState());
    },
    /** A 3D auscultation marker was picked (pickId `ausc-<area>`). */
    focusArea(areaId) {
      if (!panel) return;
      panel.setArea(areaId);
      heart.highlightAuscultation(areaId);
    },
    tick(state) {
      if (active && panel) panel.draw(state);
    },
    setLanguage(lang) {
      panel?.setLanguage(lang);
    },
    isActive: () => active
  };
}

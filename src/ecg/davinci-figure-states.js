// Each figure panel of Bradfield et al. (2025) rebuilt as a state of our own model: the
// workbench topic, its controls, the atlas camera and tissue opacity. The figure cards draw the
// 3D atlas and the ECG strips from these states instead of reproducing the paper's images.
// `compare` is a second state whose strips are drawn as a dashed grey reference (paper's A vs B).
import { workbenchSignals } from './davinci-model.js';

const cab = (extra = {}) => ({ tab: 'cabrera', cabreraMode: 'cabrera', cabreraScenario: 'rvot_shift', rvotFocus: .5, cameraView: 'anterior', opacity: .8, ...extra });
const heights = (extra = {}) => ({ tab: 'heights', heightPlane: 'superior', focusSite: 'summit', bodyShift: 0, cameraView: 'anterior', opacity: .8, ...extra });
const nom = (extra = {}) => ({ tab: 'nomenclature', nomenclatureTopic: 'fascicles', cameraView: 'anterior', opacity: .8, ...extra });
const atrial = (extra = {}) => ({ tab: 'atrial', pvSite: 'RSPV', cameraView: 'posterior', opacity: .8, ...extra });

export const FIGURE_PANEL_STATES = Object.freeze({
  1: {
    A: cab({ cabreraMode: 'standard', selectedLead: 'II', opacity: .9 }),
    B: cab({ cabreraMode: 'standard', selectedLead: 'aVR', opacity: .28 })
  },
  2: {
    A: cab({ rvotFocus: 0, selectedLead: 'I', opacity: .5 }),
    'B-C': cab({ rvotFocus: 1, selectedLead: 'I', opacity: .5, compare: cab({ rvotFocus: 0 }) })
  },
  3: {
    A: heights({ heightPlane: 'middle', selectedLead: 'V3', opacity: .7 }),
    'B-C': heights({ cameraView: 'superior', selectedLead: 'V6', opacity: .7 })
  },
  4: {
    A: heights({ focusSite: 'superolateral', cameraView: 'left', selectedLead: 'V1', opacity: .45 }),
    B: heights({ heightPlane: 'inferior', focusSite: 'inferomedial', cameraView: 'left', selectedLead: 'V5', opacity: .45 })
  },
  5: {
    'A-B': heights({ cameraView: 'left', selectedLead: 'V2', opacity: .3, compare: heights({ focusSite: 'inferoseptal' }) }),
    C: heights({ selectedLead: 'V2', opacity: .6 }),
    D: heights({ heightPlane: 'inferior', focusSite: 'inferoseptal', selectedLead: 'V5', opacity: .6 })
  },
  6: {
    'A-C': heights({ heightPlane: 'middle', bodyShift: .3, cameraView: 'left', selectedLead: 'V3', opacity: .6 }),
    D: heights({ heightPlane: 'middle', bodyShift: -.3, selectedLead: 'V3', opacity: .6 })
  },
  7: {
    A: nom({ cameraView: 'left', selectedLead: 'aVF' }),
    B: nom({ cameraView: 'posterior', selectedLead: 'aVF' }),
    C: nom({ nomenclatureTopic: 'papillary', focusSite: 'superolateral', cameraView: 'left', selectedLead: 'V3', opacity: .5 })
  },
  8: {
    'A-B': nom({ selectedLead: 'aVL', opacity: .55 }),
    C: nom({ nomenclatureTopic: 'papillary', focusSite: 'inferomedial', selectedLead: 'V4', opacity: .5, compare: nom({ nomenclatureTopic: 'papillary', focusSite: 'superolateral' }) }),
    D: nom({ nomenclatureTopic: 'bundles', bundleSide: 'right', cameraView: 'superior', selectedLead: 'V1', opacity: .45, compare: nom({ nomenclatureTopic: 'bundles', bundleSide: 'left' }) })
  },
  9: {
    A: atrial({ pvSite: 'LAA', selectedLead: 'aVL', compare: atrial({ pvSite: 'RAA' }) }),
    'B-C': atrial({ pvSite: 'RIPV', selectedLead: 'V1', compare: atrial({ pvSite: 'RSPV' }) })
  },
  10: {
    A: cab({ cabreraMode: 'standard', rvotFocus: 1, selectedLead: 'aVR' }),
    B: cab({ rvotFocus: 1, selectedLead: '-aVR' })
  },
  11: {
    'A-B': cab({ rvotFocus: 1, selectedLead: 'III', opacity: .6 }),
    C: cab({ cabreraScenario: 'sinus_p', selectedLead: 'II', opacity: .6 }),
    D: cab({ cabreraScenario: 'mi_contiguous', selectedLead: 'aVF', opacity: .6 })
  },
  12: {
    A: heights({ cameraView: 'superior', opacity: .9, selectedLead: 'V3' }),
    'B-C': heights({ heightPlane: 'middle', cameraView: 'left', opacity: .45, selectedLead: 'V3' })
  }
});

/** Model state of one figure panel; falls back to the figure's first panel. */
export function figurePanelState(num, panelId) {
  const panels = FIGURE_PANEL_STATES[num];
  if (!panels) return null;
  return panels[panelId] || Object.values(panels)[0];
}

/** Strips of a panel state, plus the dashed comparison strips when the panel has one. */
export function figurePanelSignals(state) {
  const signals = workbenchSignals(state.tab, state);
  const compare = state.compare ? workbenchSignals(state.compare.tab, state.compare) : null;
  return signals.map(s => ({ ...s, compare: compare?.find(c => c.id === s.id) || null }));
}

/** Workbench target for "Show in the lab": the panel state without the drawing-only fields. */
export function figurePanelTarget(state) {
  const { compare, ...target } = state;
  return { ...target, daBaseline: compare ? { tab: compare.tab, signals: workbenchSignals(compare.tab, compare) } : null };
}

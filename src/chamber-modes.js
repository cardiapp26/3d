// Single-chamber anatomy modes (Anatomy menu): the scene shows one chamber
// with its own parts, the left panel focus buttons and a wall section slider;
// the ventricles also colour their wall regions (`regions`).
// `ids` lists both mesh ids (heart.js visibility) and the structure ids of the
// panel (leaflets, landmarks), so one list serves the scene and the picker.
export const CHAMBER_MODES = Object.freeze({
  atria: {
    chamber: 'la', note: 'atriaNote', flyDistance: 3.1,
    ids: ['la', 'laa', 'coumadin-ridge'],
    focus: [['la', 'atriaFocusLa'], ['laa', 'atriaFocusLaa']]
  },
  ra: {
    chamber: 'ra', note: 'raNote', flyDistance: 3.1,
    ids: ['ra', 'crista-terminalis', 'eustachian-valve', 'chiari-network'],
    focus: [['ra', 'raFocusRa'], ['eustachian-valve', 'raFocusEustachian'], ['chiari-network', 'raFocusChiari']]
  },
  rv: {
    chamber: 'rv', note: 'rvNote', flyDistance: 4.6, regions: true,
    ids: ['rv', 'tricuspid', 'tricuspid-septal', 'tricuspid-inferior', 'tricuspid-anterior', 'tricuspid-annulus', 'pulmonary-valve', 'rv-papillary', 'moderator-band'],
    focus: [['rv', 'rvFocusRv'], ['tricuspid', 'rvFocusTv'], ['pulmonary-valve', 'rvFocusPv'], ['moderator-band', 'rvFocusMb']]
  },
  lv: {
    chamber: 'lv', note: 'lvNote', flyDistance: 4.6, regions: true,
    ids: ['lv', 'mitral', 'mitral-posterior', 'mitral-anterior', 'mitral-annulus', 'lcc', 'rcc', 'ncc', 'lv-papillary'],
    focus: [['lv', 'lvFocusLv'], ['mitral', 'lvFocusMv'], ['lv-papillary', 'lvFocusPm']]
  }
});

/** The chamber mode config, or null for any other mode. */
export const chamberMode = (mode) => (Object.hasOwn(CHAMBER_MODES, mode) ? CHAMBER_MODES[mode] : null);

/** True when `id` belongs to the chamber shown in `mode` (any id passes outside a chamber mode). */
export const inChamberMode = (mode, id) => {
  const config = chamberMode(mode);
  return !config || config.ids.includes(id);
};

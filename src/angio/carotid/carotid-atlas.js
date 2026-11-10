import { createPeripheralAtlas } from '../peripheral/peripheral-atlas.js';

// Region windows in the original Cardia atlas coordinate system (metres).
// ICA source meshes are not segmented C1-C7; no fabricated segment picking.
export const CAROTID_ATLAS_REGIONS = {
  arch: { match: /^(Aortic arch|Ascending aorta|Descending thoracic aorta|Brachiocephalic trunk|Left common carotid artery|Right common carotid artery|Left subclavian artery|Right subclavian artery|Vertebral artery)/, y: [1.30, 1.48] },
  cervical: { match: /common carotid artery|Internal carotid artery|External carotid artery|Superior thyroid artery|Ascending pharyngeal artery|Lingual artery|Facial artery|Occipital artery|Posterior auricular artery|Maxillary artery|Superficial temporal artery/, y: [1.42, 1.60] },
  ica: { match: /Internal carotid artery|Ophthalmic artery|Anterior choroidal artery|Posterior communicating artery|Middle cerebral artery \(M1|Anterior cerebral artery/, y: [1.50, 1.64] },
  circle: { match: /Internal carotid artery|cerebral artery|communicating artery|Basilar artery|Vertebral artery|cerebellar artery/, y: [1.57, 1.66] }
};

export function createCarotidAtlas(options) {
  return createPeripheralAtlas({ ...options, regions: CAROTID_ATLAS_REGIONS, identify: (name, view) => {
    if (view === 'arch') return ({ 'Aortic arch': 'aortic-arch', 'Ascending aorta': 'ascending-aorta', 'Brachiocephalic trunk': 'bct', 'Left common carotid artery': 'lcca', 'Right common carotid artery': 'rcca', 'Left subclavian artery': 'lsub', 'Right subclavian artery': 'rsub' })[name] || null;
    if (view === 'cervical' && /common carotid artery/.test(name)) return 'cca';
    if (view === 'circle') {
      if (name === 'Anterior communicating artery') return 'acomm';
      if (/^Posterior communicating artery/.test(name)) return 'pcomm';
      if (/^Middle cerebral artery \(M1/.test(name)) return 'm1';
    }
    return null;
  } });
}

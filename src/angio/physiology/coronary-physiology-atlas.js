import { atlasParts } from '../../atlas.js';
import { createPeripheralAtlas } from '../peripheral/peripheral-atlas.js';

// Reuse the coronary identities used by the angiography module, not new centerlines.
const names = side => new Set(Object.entries(atlasParts)
  .filter(([, part]) => part.layer === 'coronaries' && part.system === side)
  .map(([name]) => name));
const left = names('left'), right = names('right');
export const PHYSIOLOGY_ATLAS_REGIONS = {
  LAD: { match: { test: name => left.has(name) }, y: [0, 2] },
  LCX: { match: { test: name => left.has(name) }, y: [0, 2] },
  RCA: { match: { test: name => right.has(name) }, y: [0, 2] }
};

export function createPhysiologyAtlas(options) {
  return createPeripheralAtlas({ ...options, regions: PHYSIOLOGY_ATLAS_REGIONS,
    identify: name => atlasParts[name]?.id || null });
}

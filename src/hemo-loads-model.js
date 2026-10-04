// Norton JM (2001), pp. 54, 58–60. Independent spherical teaching model.
// P is transmural pressure; r and h use the same length unit. No patient fit.
export const LOAD_BASE = Object.freeze({
  preload: Object.freeze({ p: 10, r: 3, h: 1 }),
  afterload: Object.freeze({ p: 120, r: 2.5, h: 1.2 })
});
export function wallStress({ p, r, h }) {
  if (![p, r, h].every(Number.isFinite) || p < 0 || r <= 0 || h <= 0) throw new RangeError('Expected finite P ≥ 0, r > 0 and h > 0');
  return p * r / (2 * h);
}
export const LOAD_CASES = Object.freeze({
  baseline: { preload: LOAD_BASE.preload, afterload: LOAD_BASE.afterload },
  pressure: { preload: { p: 20, r: 3, h: 1 }, afterload: { p: 180, r: 2.5, h: 1.2 } },
  dilation: { preload: { p: 10, r: 4, h: 1 }, afterload: { p: 120, r: 3.5, h: 1.2 } },
  thickening: { preload: { p: 10, r: 3, h: 1.5 }, afterload: { p: 120, r: 2.5, h: 1.8 } }
});

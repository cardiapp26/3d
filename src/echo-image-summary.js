import { visibleRuns } from './echo-training.js';

/*
 * What the current echo image shows, for the studio's "In this image" list
 * and the orientation line under the anatomy panel. Pure functions on the
 * section (image-plane coordinates: x to screen right, y down the beam, in
 * atlas units) and the probe frame (world axes: +x patient left, +y
 * superior, +z anterior).
 */
export const CM_PER_UNIT = 3.7;      // the atlas scale (mesh-utils.js, measured AV annuli)
const MIN_RUN = 0.08;                // shorter visible contour: not listed
const SIDE_BAND = 0.12;              // |mean x| / depth below this: centre of the image
const AXIS_SHARE = 0.35;             // a world axis is named when its share of the direction exceeds this

/**
 * Structures inside the sector, nearest first.
 * @returns {{ id: string, side: 'left'|'centre'|'right', near: number, far: number }[]} near / far in cm
 */
export function imageStructures(section, sectorAngle, depth, { minLength = MIN_RUN } = {}) {
  const out = [];
  for (const [id, runs] of Object.entries(visibleRuns(section || { contours: [] }, sectorAngle, depth))) {
    let length = 0, sumX = 0, near = Infinity, far = 0;
    for (const run of runs) {
      for (let i = 0; i < run.length; i++) {
        const r = Math.hypot(run[i][0], run[i][1]);
        near = Math.min(near, r);
        far = Math.max(far, r);
        if (i === 0) continue;
        const seg = Math.hypot(run[i][0] - run[i - 1][0], run[i][1] - run[i - 1][1]);
        length += seg;
        sumX += seg * (run[i][0] + run[i - 1][0]) / 2;
      }
    }
    if (length < minLength) continue;
    const meanX = sumX / length / depth;
    const side = meanX < -SIDE_BAND ? 'left' : meanX > SIDE_BAND ? 'right' : 'centre';
    out.push({ id, side, near: near * CM_PER_UNIT, far: far * CM_PER_UNIT });
  }
  return out.sort((a, b) => a.near - b.near);
}

const AXES = [['left', 'right'], ['cranial', 'caudal'], ['anterior', 'posterior']];

/** Anatomical words for a world direction, largest component first: ['anterior', 'left']. */
export function directionWords(v) {
  const n = Math.hypot(...v) || 1;
  return v.map((c, i) => ({ c: c / n, i }))
    .filter(({ c }) => Math.abs(c) >= AXIS_SHARE)
    .sort((a, b) => Math.abs(b.c) - Math.abs(a.c))
    .map(({ c, i }) => AXES[i][c > 0 ? 0 : 1]);
}

/** Where screen right (the lateral axis) and screen down (the beam) point in the patient. */
export function planeOrientation(frame) {
  return { right: directionWords(frame.lateral), down: directionWords(frame.beam) };
}

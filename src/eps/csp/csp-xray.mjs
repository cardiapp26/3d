/** The CSP lead in the 3D atlas: sheath and lead positions in atlas coordinates, projected onto the
 * atlas fluoroscopy images (csp-fluoro-<view>.webp) through the camera matrices saved with them
 * (csp-atlas-geometry.mjs). Both views come from one 3D position, so RAO and LAO agree.
 *
 * The septal site follows the procedure level along the atlas septum from the His (0) to the RV
 * apex (1). The sheath direction is the septal normal turned about the LAO viewing axis by the
 * sheath angle relative to the perpendicular, so the turn reads as the clock angle in LAO. The tip
 * goes into the septum by the procedure's depth ratio of the atlas wall. Pure functions.
 */
import { ATLAS_GEOMETRY as G } from './csp-atlas-geometry.mjs';

const APPROACH = .27;          // the sheath end sits about 1 cm back in the RV cavity (atlas units)
const RING_BACK = .27;         // ring electrode about 1 cm proximal of the tip

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => Math.hypot(a[0], a[1], a[2]);
const unit = a => mul(a, 1 / (len(a) || 1));
const lerp3 = (a, b, t) => add(a, mul(sub(b, a), t));
/** Rodrigues rotation of v about the unit axis k. */
const rotate = (v, k, angle) => add(add(mul(v, Math.cos(angle)), mul(cross(k, v), Math.sin(angle))), mul(k, dot(k, v) * (1 - Math.cos(angle))));

export const VIEWS = Object.freeze(Object.keys(G.views));

/** Atlas point -> image fractions [x, y] (0..1 over the square image). */
export function project(viewId, [x, y, z]) {
  const v = G.views[viewId], e = v.matrix;
  const w = e[3] * x + e[7] * y + e[11] * z + e[15];
  const nx = (e[0] * x + e[4] * y + e[8] * z + e[12]) / w, ny = (e[1] * x + e[5] * y + e[9] * z + e[13]) / w;
  return [((nx + 1) / 2 * v.canvas.w - v.crop.l) / v.crop.side, ((1 - ny) / 2 * v.canvas.h - v.crop.t) / v.crop.side];
}

/** Camera viewing direction of a view in atlas coordinates (the clip w row is the forward axis). */
const forwardOf = viewId => { const e = G.views[viewId].matrix; return unit([e[3], e[7], e[11]]); };

/** RV and LV sides of the septum at a level (0 His .. 1 apex), interpolated between measured sites. */
export function septalSite(level) {
  const s = G.landmarks.septum, f = Math.max(0, Math.min(1, level)) * (s.length - 1), i = Math.min(s.length - 2, Math.floor(f)), t = f - i;
  return { rv: lerp3(s[i].rv, s[i + 1].rv, t), lv: lerp3(s[i].lv, s[i + 1].lv, t) };
}

// Turning direction: a negative (clockwise, anterior) sheath angle must look steeper (toward 12 o'clock) in LAO.
const LAO_AXIS = forwardOf(VIEWS.includes('lao') ? 'lao' : VIEWS[0]);
const TURN_SIGN = (() => {
  const site = septalSite(.3), n = unit(sub(site.lv, site.rv));
  const up = d => project('lao', add(site.rv, mul(d, .3)))[1];
  return up(rotate(n, LAO_AXIS, -.2)) < up(rotate(n, LAO_AXIS, .2)) ? 1 : -1;
})();

/**
 * Sheath and lead in atlas coordinates.
 * @param {{ level: number, rel: number, depthRatio: number }} pose rel: sheath angle to the septal normal (deg)
 * @returns {{ path: number[][], approach: number[], tip: number[], ring: number[], entry: number[], normal: number[], dir: number[] }}
 */
export function leadPose({ level, rel, depthRatio }) {
  const site = septalSite(level), wall = sub(site.lv, site.rv), normal = unit(wall);
  const dir = rotate(normal, LAO_AXIS, (TURN_SIGN * rel * Math.PI) / 180);
  const approach = sub(site.rv, mul(normal, APPROACH));
  // The tip reaches the wall along the sheath direction (further when it meets the wall obliquely), then goes in.
  const reach = APPROACH / Math.max(.35, Math.cos((rel * Math.PI) / 180));
  const surface = add(approach, mul(dir, reach));
  const tip = add(surface, mul(dir, Math.max(0, depthRatio) * len(wall)));
  const ring = add(tip, mul(dir, -Math.min(RING_BACK, reach + Math.max(0, depthRatio) * len(wall))));
  const L = G.landmarks;
  return { path: [L.svc, L.highSvc, L.ra, L.tv, approach], approach, tip, ring, entry: surface, normal, dir };
}

/** Level (0..1) of the septal site nearest an image point (x, y in fractions) in a view. */
export function levelAtImage(viewId, x, y) {
  const s = G.landmarks.septum;
  let best = 0, bestD = Infinity;
  for (let i = 0; i < s.length - 1; i++) {
    const a = project(viewId, s[i].rv), b = project(viewId, s[i + 1].rv);
    const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    const d = Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y);
    if (d < bestD) { bestD = d; best = (i + t) / (s.length - 1); }
  }
  return best;
}

/** Image points of the overlays: His tag, the RV septal line (His to apex), the RV outline. */
export function landmarksOn(viewId) {
  return {
    his: project(viewId, G.landmarks.his), apex: project(viewId, G.landmarks.apex),
    septalLine: G.landmarks.septum.map(s => project(viewId, s.rv)), rvHull: G.views[viewId].rvHull,
    centre: project(viewId, lerp3(G.landmarks.tv, G.landmarks.apex, .5))
  };
}

/*
 * Point-by-point mapping of the 3D EAM workstation (pure).
 *
 * Models how a high-density catheter builds a map: the catheter is laid on the wall, every
 * accepted beat each electrode pair in contact contributes one point (local activation time
 * against a stable reference, bipolar voltage), and the surface is coloured only within the
 * fill threshold of an acquired point. Unmapped wall stays grey.
 *
 * Catheter geometry follows the published electrode layouts:
 * - PENTARAY NAV ECO (Biosense Webster / J&J, CARTO 3): 5 soft splines, 4 electrodes each
 *   (20 poles), 2-6-2 mm spacing.
 * - Advisor HD Grid X (Abbott, EnSite X): 4 splines, 4 electrodes each (16 poles), 3 mm
 *   equidistant, bipoles along and across the splines.
 */

/** Millimetres per unit of the normalized atlas frame (longest heart side = 3.3 units). */
export const MM_PER_UNIT = 36;

// Each system draws its maps with its own colour convention. Both use the usual bipolar
// voltage window: below `voltageWindow[0]` is scar, above `voltageWindow[1]` is healthy.
export const MAP_PALETTES = Object.freeze({
  // CARTO: red = earliest activation / low voltage, purple = latest / healthy. Voltage below
  // the window stays red; grey is kept for dense scar without a local signal.
  carto: Object.freeze({
    lat: Object.freeze(['#ff0000', '#ff7a00', '#ffee00', '#00d82c', '#00d0ff', '#0030ff', '#9000ff']),
    voltage: Object.freeze(['#ff0000', '#ff7a00', '#ffee00', '#00d82c', '#00d0ff', '#0030ff', '#9000ff']),
    voltageWindow: Object.freeze([0.5, 1.5]),
    belowWindow: '#ff0000',
    scar: '#808080',
    unmapped: '#6b7280'
  }),
  // EnSite: white = earliest activation, then red through blue to purple = latest. On the
  // voltage map everything below the window is grey (scar) and purple is healthy. The
  // unmapped shell is a dark slate so it cannot be mistaken for grey scar.
  ensite: Object.freeze({
    lat: Object.freeze(['#ffffff', '#ff0000', '#ff8a00', '#ffe600', '#00c81e', '#00c8ff', '#0000ff', '#7800c8']),
    voltage: Object.freeze(['#ff0000', '#ff8a00', '#ffe600', '#00c81e', '#00c8ff', '#0000ff', '#7800c8']),
    voltageWindow: Object.freeze([0.5, 1.5]),
    belowWindow: '#a6a6a6',
    scar: '#a6a6a6',
    unmapped: '#2f3b4f'
  })
});

/**
 * Where a bipolar voltage falls on a system's voltage scale.
 * @returns {{ below: boolean, t: number }} `below` = under the window (scar colour); `t` = 0..1 inside it
 */
export function voltageScale(system, bipolarMv) {
  const [low, high] = MAP_PALETTES[system].voltageWindow;
  return { below: bipolarMv < low, t: Math.max(0, Math.min(1, (bipolarMv - low) / (high - low))) };
}

const PENTARAY_RADII_MM = Object.freeze([5, 7, 13, 15]); // 2-6-2 mm along each spline
const HD_GRID_PITCH_MM = 3;

function pentarayLayout() {
  const points = [];
  for (let spline = 0; spline < 5; spline++) {
    const angle = (spline * 2 * Math.PI) / 5;
    PENTARAY_RADII_MM.forEach((r, index) => {
      points.push({ x: Number((r * Math.cos(angle)).toFixed(3)), y: Number((r * Math.sin(angle)).toFixed(3)), spline, index });
    });
  }
  return points;
}

function hdGridLayout() {
  const points = [];
  for (let spline = 0; spline < 4; spline++) {
    for (let index = 0; index < 4; index++) {
      points.push({ x: (index - 1.5) * HD_GRID_PITCH_MM, y: (spline - 1.5) * HD_GRID_PITCH_MM, spline, index });
    }
  }
  return points;
}

// Bipoles as pairs of electrode indices (spline * 4 + index).
const alongSpline = (splines, pairs) =>
  Array.from({ length: splines }, (_, s) => pairs.map(([a, b]) => [s * 4 + a, s * 4 + b])).flat();
const acrossSplines = () =>
  Array.from({ length: 3 }, (_, s) => Array.from({ length: 4 }, (_, i) => [s * 4 + i, (s + 1) * 4 + i])).flat();

export const MAPPING_CATHETERS = Object.freeze({
  pentaray: Object.freeze({
    id: 'pentaray',
    system: 'carto',
    color: '#f59e0b',
    splines: 5,
    electrodes: Object.freeze(pentarayLayout()),
    // Closely spaced 2 mm pairs on every spline.
    bipoles: Object.freeze(alongSpline(5, [[0, 1], [2, 3]])),
    polygraphLabels: Object.freeze(['Penta A1-2', 'Penta A3-4', 'Penta B1-2'])
  }),
  hdgrid: Object.freeze({
    id: 'hdgrid',
    system: 'ensite',
    // EnSite draws the grid paddle in the catheter's own green.
    color: '#22c55e',
    splines: 4,
    electrodes: Object.freeze(hdGridLayout()),
    // HD Wave: bipoles along and across the splines, so wavefront direction does not hide signals.
    bipoles: Object.freeze([...alongSpline(4, [[0, 1], [1, 2], [2, 3]]), ...acrossSplines()]),
    polygraphLabels: Object.freeze(['Grid A1-A2', 'Grid A2-A3', 'Grid A3-A4'])
  })
});

export const MAPPING_CATHETER_IDS = Object.freeze(Object.keys(MAPPING_CATHETERS));
export const MAPPING_CHAMBERS = Object.freeze(['ra', 'la', 'rv', 'lv']);

// Acquisition settings, in the range used clinically.
export const MAPPING_SETTINGS = Object.freeze({
  // Colour is projected onto the shell only this close to an acquired point.
  fillThresholdMm: 6,
  // An electrode farther than this from the wall is not in contact; its point is rejected.
  contactMm: 3.5,
  // Beat-to-beat LAT scatter of a clean bipolar signal, and of a fractionated one.
  latNoiseMs: 3,
  latNoiseFractionatedMs: 9,
  voltageNoise: 0.15,
  // Cycle length must be stable for activation points; AF fails this and maps voltage only.
  stabilityMs: 20
});

/** Deterministic random numbers in [0, 1) (mulberry32), so a mapping run can be replayed. */
export function createRng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample from two uniform samples (Box-Muller). */
function gaussian(rng) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-9, rng()))) * Math.cos(2 * Math.PI * rng());
}

/**
 * Local activation time relative to the reference electrogram. In reentry the whole cycle is
 * mapped, so the value is wrapped into a window of interest of one cycle centred on the
 * reference ("early meets late"); focal and sinus rhythms are not wrapped.
 */
export function relativeLat(lat, refLat, tcl, reentrant) {
  const d = lat - refLat;
  if (!reentrant) return d;
  return ((((d + tcl / 2) % tcl) + tcl) % tcl) - tcl / 2;
}

/**
 * One accepted beat with the catheter at rest on the wall.
 * @param {object} beat
 * @param {{ pos: number[], wallMm: number }[]} beat.electrodes electrode positions and distance to the wall
 * @param {number[][]} beat.bipoles electrode index pairs
 * @param {(pos: number[]) => { lat: number, bipolar: number, tissue: string }} beat.truthAt tissue under a point
 * @param {{ tcl: number, reentrant: boolean, stableCycle: boolean, refLat: number }} beat.rhythm
 * @param {() => number} beat.rng
 * @returns {{ pos: number[], lat: number | null, bipolar: number, accepted: boolean, reason: string | null }[]}
 */
export function acquireBeat({ electrodes, bipoles, truthAt, rhythm, rng }) {
  return bipoles.map(([a, b]) => {
    const ea = electrodes[a];
    const eb = electrodes[b];
    const pos = [(ea.pos[0] + eb.pos[0]) / 2, (ea.pos[1] + eb.pos[1]) / 2, (ea.pos[2] + eb.pos[2]) / 2];
    const wallMm = Math.max(ea.wallMm, eb.wallMm);
    if (wallMm > MAPPING_SETTINGS.contactMm) return { pos, lat: null, bipolar: 0, accepted: false, reason: 'no-contact' };

    const truth = truthAt(pos);
    const fractionated = truth.tissue === 'border' || truth.tissue === 'channel';
    // Signal falls off as the pair lifts from the wall.
    const contactGain = 1 - 0.5 * (wallMm / MAPPING_SETTINGS.contactMm);
    const bipolar = Math.max(0.03, truth.bipolar * contactGain * (1 + MAPPING_SETTINGS.voltageNoise * gaussian(rng)));
    const sigma = fractionated ? MAPPING_SETTINGS.latNoiseFractionatedMs : MAPPING_SETTINGS.latNoiseMs;
    // Dense scar has no reliable local signal to annotate; an unstable cycle gives no LAT either.
    const latValid = rhythm.stableCycle && truth.tissue !== 'scar';
    const lat = latValid
      ? Math.round(relativeLat(truth.lat + sigma * gaussian(rng), rhythm.refLat, rhythm.tcl, rhythm.reentrant))
      : null;
    return { pos, lat, bipolar: Number(bipolar.toFixed(2)), accepted: true, reason: null };
  });
}

/** Running totals of a mapping session. */
export function summarizeSession({ points, mappedVertices, totalVertices, beats, elapsedMs }) {
  const accepted = points.filter((p) => p.accepted);
  const lats = accepted.map((p) => p.lat).filter((v) => v !== null);
  return {
    beats,
    elapsedMs,
    pointsTaken: points.length,
    pointsUsed: accepted.length,
    latPoints: lats.length,
    coveragePct: totalVertices > 0 ? Math.round((mappedVertices / totalVertices) * 100) : 0,
    latRange: lats.length ? [Math.min(...lats), Math.max(...lats)] : null,
    lowVoltagePct: accepted.length ? Math.round((accepted.filter((p) => p.bipolar < 0.5).length / accepted.length) * 100) : 0
  };
}

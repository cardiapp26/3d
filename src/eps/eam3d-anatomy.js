/*
 * Fixed anatomy and lab set-up of the 3D EAM workstation (pure data, no physiology):
 * scenario and view lists, default tissue levers, anchor points, the six catheters with their
 * electrodes, the 26 polygraph channels, pacing sites and the predefined RF ablation lines.
 * Coordinates live in the normalized 3D atlas frame (see eam3d-model.js).
 */
import { ATLAS_CONDUCTION as C } from '../ecg/ecg-atlas-conduction.js';

export const EAM3D_SCENARIOS = Object.freeze([
  'avnrt',
  'sinus',
  'flutter-typical',
  'atrial-scar-flutter',
  'avrt-left',
  'vt-ischemic',
  'pvc-rvot',
  'af'
]);

export const EAM3D_MAP_MODES = Object.freeze(['live', 'lat', 'voltage', 'phase']);
export const EAM3D_WALL_LAYERS = Object.freeze(['all', 'endo', 'mid', 'epi', 'hide-epi']);
export const EAM3D_VIEWS = Object.freeze(['ap', 'rao30', 'lao30', 'pa', 'xray']);
export const EAM3D_SURVEY_RUNS = Object.freeze([10, 100, 1000]);

export const DEFAULT_LEVERS = Object.freeze({
  raVisible: true,
  laVisible: true,
  highDensityAtria: false,
  atrialCv: 0.90,
  atrialRestitution: 1.00,
  rateAdaptation: 0.80,
  afRemodelling: 0.00,
  ventriclesVisible: true,
  wallLayer: 'all',
  highDensityVentricles: false,
  vtStudyMesh: false,
  ventricularCv: 0.61,
  ventricularRestitution: 1.00,
  showConduction: true,
  conductionParticipates: true,
  myocardiumOpacity: 42,
  conductionOpacity: 70
});

// 3D anchor coordinates in the normalized atlas frame.
export const ANCHORS = Object.freeze({
  sa: C.sa,
  avn: C.avn,
  hisStart: C.his[0],
  hisEnd: C.his[C.his.length - 1],
  csOstium: [-0.74, -0.18, -0.22],
  ctiMid: [-0.92, -0.58, -0.05],
  tvCenter: [-0.62, -0.05, 0.22],
  mvCenter: [0.18, 0.02, -0.25],
  rvApex: C.purkinjeRv[C.purkinjeRv.length - 1],
  lvApex: C.purkinjeLaf[C.purkinjeLaf.length - 1],
  rvotSeptum: [-0.18, 0.72, 0.62],
  lvInferolateralScar: [0.76, -0.36, -0.34],
  laRoofMid: [-0.18, 1.08, -0.56],
  mitralIsthmus: [0.34, 0.14, -0.58],
  laPosterior: [-0.12, 0.35, -0.82]
});

// 3D Catheter trajectories and electrode positions.
function arcRing(center, rx, ry, rz, count, startDeg, endDeg, tiltZ = 0.18) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const u = count > 1 ? i / (count - 1) : 0;
    const rad = ((startDeg + (endDeg - startDeg) * u) * Math.PI) / 180;
    pts.push([
      Number((center[0] + rx * Math.cos(rad)).toFixed(3)),
      Number((center[1] + ry * Math.sin(rad)).toFixed(3)),
      Number((center[2] + rz * Math.sin(rad * 0.7) + tiltZ * Math.cos(rad)).toFixed(3))
    ]);
  }
  return pts;
}

const DUO_ELECTRODES = Object.freeze(
  arcRing([-0.98, 0.05, 0.22], 0.56, 0.68, 0.26, 20, -145, 145, 0.15)
);

const CS_ELECTRODES = Object.freeze([
  [-0.72, -0.16, -0.22], [-0.62, -0.17, -0.28],
  [-0.46, -0.15, -0.36], [-0.34, -0.13, -0.41],
  [-0.18, -0.09, -0.47], [-0.05, -0.05, -0.50],
  [0.10, 0.01, -0.52],   [0.21, 0.06, -0.51],
  [0.32, 0.14, -0.47],   [0.41, 0.22, -0.42]
]);

const HRA_ELECTRODES = Object.freeze([
  [-1.02, 1.18, 0.18],
  [-0.96, 1.02, 0.22],
  [-0.91, 0.86, 0.25],
  [-0.86, 0.72, 0.26]
]);

const HIS_ELECTRODES = Object.freeze([
  [-0.44, 0.32, 0.24],
  [-0.54, 0.28, 0.17],
  [-0.63, 0.22, 0.10],
  [-0.71, 0.14, 0.04]
]);

const RV_ELECTRODES = Object.freeze([
  [0.22, -0.92, 1.12],
  [0.14, -0.80, 0.98],
  [0.05, -0.66, 0.84],
  [-0.06, -0.52, 0.70]
]);

/** Build the 16 electrodes of the 4x4 High-Density Mapping Grid around a 3D focus point. */
export function buildHdGridElectrodes(center = ANCHORS.lvInferolateralScar) {
  const electrodes = [];
  const spacing = 0.065;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      electrodes.push([
        Number((center[0] + (col - 1.5) * spacing).toFixed(3)),
        Number((center[1] + (row - 1.5) * spacing).toFixed(3)),
        Number((center[2] + 0.04).toFixed(3))
      ]);
    }
  }
  return electrodes;
}

export const EAM3D_CATHETERS = Object.freeze({
  duo: { id: 'duo', color: '#38bdf8', radius: 0.018, electrodes: DUO_ELECTRODES },
  cs: { id: 'cs', color: '#e879f9', radius: 0.017, electrodes: CS_ELECTRODES },
  hra: { id: 'hra', color: '#facc15', radius: 0.017, electrodes: HRA_ELECTRODES },
  his: { id: 'his', color: '#4ade80', radius: 0.017, electrodes: HIS_ELECTRODES },
  rv: { id: 'rv', color: '#fb923c', radius: 0.018, electrodes: RV_ELECTRODES },
  grid: { id: 'grid', color: '#a855f7', radius: 0.013, electrodes: buildHdGridElectrodes() }
});

const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];

// 26 live polygraph channels of the recording screen. `electrodes` are the indices of the
// two poles of each bipole on its catheter, so the 3D map can flash exactly that pair.
export const EAM3D_CHANNELS = Object.freeze([
  { id: 'II', label: 'II', color: '#f1f5f9', kind: 'surface', catheter: null, pos: [0, 0, 0] },
  { id: 'V1', label: 'V1', color: '#f1f5f9', kind: 'surface', catheter: null, pos: [0, 0, 0] },
  ...Array.from({ length: 10 }, (_, idx) => {
    const pair = 10 - idx; // 19-20 down to 1-2
    const e0 = DUO_ELECTRODES[(pair - 1) * 2];
    const e1 = DUO_ELECTRODES[(pair - 1) * 2 + 1];
    return {
      id: `duo-${pair * 2 - 1}-${pair * 2}`,
      label: `DUO ${pair * 2 - 1}-${pair * 2}`,
      color: '#38bdf8',
      kind: 'atrial',
      catheter: 'duo',
      electrodes: [(pair - 1) * 2, (pair - 1) * 2 + 1],
      pos: midpoint(e0, e1)
    };
  }),
  ...Array.from({ length: 5 }, (_, idx) => {
    const pair = 5 - idx; // 9-10 down to 1-2
    const e0 = CS_ELECTRODES[(5 - pair) * 2];
    const e1 = CS_ELECTRODES[(5 - pair) * 2 + 1];
    return {
      id: `cs-${pair * 2 - 1}-${pair * 2}`,
      label: `CS ${pair * 2 - 1}-${pair * 2}`,
      color: '#e879f9',
      kind: 'cs',
      catheter: 'cs',
      electrodes: [(5 - pair) * 2, (5 - pair) * 2 + 1],
      pos: midpoint(e0, e1)
    };
  }),
  { id: 'hra-d', label: 'HRA d', color: '#facc15', kind: 'atrial', catheter: 'hra', electrodes: [0, 1], pos: midpoint(HRA_ELECTRODES[0], HRA_ELECTRODES[1]) },
  { id: 'hra-p', label: 'HRA p', color: '#facc15', kind: 'atrial', catheter: 'hra', electrodes: [2, 3], pos: midpoint(HRA_ELECTRODES[2], HRA_ELECTRODES[3]) },
  { id: 'his-d', label: 'His d', color: '#4ade80', kind: 'his', catheter: 'his', electrodes: [0, 1], pos: midpoint(HIS_ELECTRODES[0], HIS_ELECTRODES[1]) },
  { id: 'his-p', label: 'His p', color: '#4ade80', kind: 'his', catheter: 'his', electrodes: [2, 3], pos: midpoint(HIS_ELECTRODES[2], HIS_ELECTRODES[3]) },
  { id: 'grid-a12', label: 'Grid A1-A2', color: '#a855f7', kind: 'grid', catheter: 'grid', electrodes: [0, 1], offset: [0, 0, 0], pos: ANCHORS.lvInferolateralScar },
  { id: 'grid-a23', label: 'Grid A2-A3', color: '#a855f7', kind: 'grid', catheter: 'grid', electrodes: [1, 2], offset: [0.06, 0, 0], pos: [ANCHORS.lvInferolateralScar[0] + 0.06, ANCHORS.lvInferolateralScar[1], ANCHORS.lvInferolateralScar[2]] },
  { id: 'grid-a34', label: 'Grid A3-A4', color: '#a855f7', kind: 'grid', catheter: 'grid', electrodes: [2, 3], offset: [0.12, 0, 0], pos: [ANCHORS.lvInferolateralScar[0] + 0.12, ANCHORS.lvInferolateralScar[1], ANCHORS.lvInferolateralScar[2]] },
  { id: 'rv-d', label: 'RV d', color: '#fb923c', kind: 'ventricular', catheter: 'rv', electrodes: [0, 1], pos: midpoint(RV_ELECTRODES[0], RV_ELECTRODES[1]) },
  { id: 'rv-p', label: 'RV p', color: '#fb923c', kind: 'ventricular', catheter: 'rv', electrodes: [2, 3], pos: midpoint(RV_ELECTRODES[2], RV_ELECTRODES[3]) }
]);

export const PACING_CHANNELS = Object.freeze([
  { id: 'rv-d', label: 'RV d', chamber: 'rv', pos: midpoint(RV_ELECTRODES[0], RV_ELECTRODES[1]) },
  { id: 'hra-d', label: 'HRA d', chamber: 'ra', pos: midpoint(HRA_ELECTRODES[0], HRA_ELECTRODES[1]) },
  { id: 'cs-9-10', label: 'CS 9-10', chamber: 'ra', pos: midpoint(CS_ELECTRODES[0], CS_ELECTRODES[1]) },
  { id: 'cs-1-2', label: 'CS 1-2', chamber: 'la', pos: midpoint(CS_ELECTRODES[8], CS_ELECTRODES[9]) },
  { id: 'duo-9-10', label: 'DUO 9-10', chamber: 'ra', pos: midpoint(DUO_ELECTRODES[8], DUO_ELECTRODES[9]) },
  { id: 'grid-a12', label: 'Grid A1-A2', chamber: 'lv', pos: ANCHORS.lvInferolateralScar }
]);

// Predefined 3D ablation lines and lesion sets.
export const EAM3D_ABLATION_LINES = Object.freeze({
  'slow-pathway': {
    id: 'slow-pathway',
    chamber: 'ra',
    lengthMm: 11,
    terminates: ['avnrt'],
    points: [[-0.72, -0.14, -0.16], [-0.68, -0.06, -0.10], [-0.64, 0.02, -0.04], [-0.60, 0.08, 0.01]]
  },
  'cti-line': {
    id: 'cti-line',
    chamber: 'ra',
    lengthMm: 28,
    terminates: ['flutter-typical'],
    points: [[-0.76, -0.44, 0.08], [-0.84, -0.54, 0.01], [-0.94, -0.64, -0.08], [-1.04, -0.76, -0.18]]
  },
  'la-anterior-roof': {
    id: 'la-anterior-roof',
    chamber: 'la',
    lengthMm: 24,
    terminates: ['atrial-scar-flutter'],
    points: [[-0.45, 1.05, -0.48], [-0.24, 1.12, -0.52], [-0.02, 1.10, -0.54], [0.22, 1.02, -0.50]]
  },
  'mitral-isthmus': {
    id: 'mitral-isthmus',
    chamber: 'la',
    lengthMm: 31,
    terminates: ['atrial-scar-flutter', 'avrt-left'],
    points: [[0.26, 0.42, -0.62], [0.32, 0.26, -0.56], [0.36, 0.12, -0.49], [0.40, -0.02, -0.42]]
  },
  'posterior-box': {
    id: 'posterior-box',
    chamber: 'la',
    lengthMm: 38,
    terminates: ['af'],
    points: [[-0.42, 0.65, -0.78], [-0.12, 0.68, -0.84], [0.18, 0.64, -0.80], [0.22, 0.25, -0.78], [-0.38, 0.24, -0.76]]
  },
  'vt-isthmus-dechannel': {
    id: 'vt-isthmus-dechannel',
    chamber: 'lv',
    lengthMm: 19,
    terminates: ['vt-ischemic'],
    points: [[0.64, -0.28, -0.32], [0.72, -0.34, -0.35], [0.81, -0.40, -0.36], [0.89, -0.46, -0.34]]
  },
  'rvot-focus': {
    id: 'rvot-focus',
    chamber: 'rv',
    lengthMm: 8,
    terminates: ['pvc-rvot'],
    points: [[-0.22, 0.70, 0.60], [-0.18, 0.73, 0.63], [-0.14, 0.75, 0.61]]
  }
});

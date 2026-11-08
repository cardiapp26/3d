/*
 * Four-chamber 3D electroanatomical mapping (EAM) and whole-heart
 * simulation model (pure). Coordinates live in the normalized 3D atlas frame
 * (chamber bounds centred, longest side 3.3, matching conduction-atlas.js).
 *
 * Computes:
 * 1. Vertex-level activation time (ms), membrane potential U(v, t), bipolar/unipolar
 *    substrate voltage (mV) and phase (-pi..+pi) for RA, LA, RV and LV meshes.
 * 2. 3D positions and electrode coordinates of the six laboratory catheters
 *    (DUO 20-pole halo, CS 10-pole, HRA, His, RV apex, steerable 4x4 HD Grid).
 * 3. Live scrolling multichannel electrograms (II, V1, DUO 19-20..1-2, CS 9-10..1-2,
 *    HRA, His, Grid A1-A4, RV) computed from the current physiological state.
 * 4. Programmed stimulation (PACE, BURST overdrive, S1-S2 extrastimulus) from any
 *    catheter bipole and 3D RF ablation lines that block circuits in real time.
 * 5. Probabilistic circuit modeling ("Find the circuit"): Monte Carlo survey across
 *    10-1,000 runs over a 3D voltage map, ranking candidate reentrant circuits and
 *    comparing minimal-intervention ablation lines by length (mm) and interruption %.
 */
import { ATLAS_CONDUCTION as C } from '../ecg/ecg-atlas-conduction.js';
import { ATLAS_CONDUCTION_EXTRAS as X } from './conduction-atlas-extras.js';

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

// 23 live polygraph channels of the recording screen.
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
      pos: midpoint(e0, e1)
    };
  }),
  { id: 'hra-d', label: 'HRA d', color: '#facc15', kind: 'atrial', catheter: 'hra', pos: midpoint(HRA_ELECTRODES[0], HRA_ELECTRODES[1]) },
  { id: 'hra-p', label: 'HRA p', color: '#facc15', kind: 'atrial', catheter: 'hra', pos: midpoint(HRA_ELECTRODES[2], HRA_ELECTRODES[3]) },
  { id: 'his-d', label: 'His d', color: '#4ade80', kind: 'his', catheter: 'his', pos: midpoint(HIS_ELECTRODES[0], HIS_ELECTRODES[1]) },
  { id: 'his-p', label: 'His p', color: '#4ade80', kind: 'his', catheter: 'his', pos: midpoint(HIS_ELECTRODES[2], HIS_ELECTRODES[3]) },
  { id: 'grid-a12', label: 'Grid A1-A2', color: '#a855f7', kind: 'grid', catheter: 'grid', pos: ANCHORS.lvInferolateralScar },
  { id: 'grid-a23', label: 'Grid A2-A3', color: '#a855f7', kind: 'grid', catheter: 'grid', pos: [ANCHORS.lvInferolateralScar[0] + 0.06, ANCHORS.lvInferolateralScar[1], ANCHORS.lvInferolateralScar[2]] },
  { id: 'grid-a34', label: 'Grid A3-A4', color: '#a855f7', kind: 'grid', catheter: 'grid', pos: [ANCHORS.lvInferolateralScar[0] + 0.12, ANCHORS.lvInferolateralScar[1], ANCHORS.lvInferolateralScar[2]] },
  { id: 'rv-d', label: 'RV d', color: '#fb923c', kind: 'ventricular', catheter: 'rv', pos: midpoint(RV_ELECTRODES[0], RV_ELECTRODES[1]) },
  { id: 'rv-p', label: 'RV p', color: '#fb923c', kind: 'ventricular', catheter: 'rv', pos: midpoint(RV_ELECTRODES[2], RV_ELECTRODES[3]) }
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

const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Base cycle length (ms) and mechanism metadata of each scenario, adjusted by tissue levers. */
export function scenarioSpec(scenarioId, levers = DEFAULT_LEVERS, ablatedLines = new Set()) {
  const lv = { ...DEFAULT_LEVERS, ...levers };
  // If an ablation line has terminated the active arrhythmia, revert to sinus rhythm.
  for (const lineId of ablatedLines) {
    const line = EAM3D_ABLATION_LINES[lineId];
    if (line && line.terminates.includes(scenarioId)) {
      return scenarioSpec('sinus', lv, new Set());
    }
  }
  const aScale = 0.90 / Math.max(0.25, lv.atrialCv);
  const vScale = 0.61 / Math.max(0.20, lv.ventricularCv);
  const specs = {
    avnrt: {
      id: 'avnrt',
      tcl: Math.round(392 * (0.7 + 0.3 * aScale)),
      atrialOrigin: ANCHORS.avn,
      laOrigin: ANCHORS.csOstium,
      ventricularOrigin: 'his-purkinje',
      hisOffset: 12,
      vOffset: 48,
      reentrant: true,
      chamberFocus: 'biatrial'
    },
    sinus: {
      id: 'sinus',
      tcl: 833,
      atrialOrigin: ANCHORS.sa,
      laOrigin: X.bachmann[X.bachmann.length - 1],
      ventricularOrigin: 'his-purkinje',
      hisOffset: 155,
      vOffset: 198,
      reentrant: false,
      chamberFocus: 'four-chamber'
    },
    'flutter-typical': {
      id: 'flutter-typical',
      tcl: Math.round(240 * aScale),
      atrialOrigin: ANCHORS.ctiMid,
      laOrigin: ANCHORS.csOstium,
      ventricularOrigin: 'his-purkinje',
      hisOffset: 110,
      vOffset: 150,
      reentrant: true,
      macroRing: { center: [-0.95, 0.02, 0.16], normal: 'ccw' },
      chamberFocus: 'ra'
    },
    'atrial-scar-flutter': {
      id: 'atrial-scar-flutter',
      tcl: Math.round(265 * aScale),
      atrialOrigin: ANCHORS.laRoofMid,
      laOrigin: ANCHORS.laRoofMid,
      ventricularOrigin: 'his-purkinje',
      hisOffset: 125,
      vOffset: 165,
      reentrant: true,
      macroRing: { center: [-0.15, 0.45, -0.55], normal: 'cw' },
      chamberFocus: 'la'
    },
    'avrt-left': {
      id: 'avrt-left',
      tcl: Math.round(350 * (0.5 * aScale + 0.5 * vScale)),
      atrialOrigin: CS_ELECTRODES[8],
      laOrigin: CS_ELECTRODES[8],
      ventricularOrigin: 'his-purkinje',
      hisOffset: -115,
      vOffset: -70,
      reentrant: true,
      chamberFocus: 'four-chamber'
    },
    'vt-ischemic': {
      id: 'vt-ischemic',
      tcl: Math.round(320 * vScale),
      atrialOrigin: ANCHORS.avn,
      laOrigin: ANCHORS.csOstium,
      ventricularOrigin: ANCHORS.lvInferolateralScar,
      hisOffset: 180,
      vOffset: 0,
      reentrant: true,
      chamberFocus: 'lv'
    },
    'pvc-rvot': {
      id: 'pvc-rvot',
      tcl: Math.round(540 * (0.85 + 0.15 * vScale)),
      atrialOrigin: ANCHORS.sa,
      laOrigin: X.bachmann[X.bachmann.length - 1],
      ventricularOrigin: ANCHORS.rvotSeptum,
      hisOffset: 140,
      vOffset: 0,
      reentrant: false,
      chamberFocus: 'rv'
    },
    af: {
      id: 'af',
      tcl: Math.round(168 * (1 - 0.18 * lv.afRemodelling)),
      atrialOrigin: ANCHORS.laPosterior,
      laOrigin: ANCHORS.laPosterior,
      ventricularOrigin: 'his-purkinje',
      hisOffset: 95,
      vOffset: 138,
      reentrant: true,
      chamberFocus: 'biatrial'
    }
  };
  return specs[scenarioId] || specs.avnrt;
}

/**
 * Compute local activation time (LAT in ms within one cycle), bipolar voltage (mV),
 * unipolar voltage (mV) and tissue class ('normal' | 'border' | 'scar' | 'channel')
 * at any 3D point [x, y, z] on a given chamber ('ra' | 'la' | 'rv' | 'lv').
 */
export function evaluateVertex3d(point, chamber, scenarioId, levers = DEFAULT_LEVERS, ablatedLines = new Set()) {
  const lv = { ...DEFAULT_LEVERS, ...levers };
  const spec = scenarioSpec(scenarioId, lv, ablatedLines);
  const atrial = chamber === 'ra' || chamber === 'la';

  // 1. Substrate / scar model (3D spatial patches)
  let bipolar = atrial ? 2.4 : 3.8;
  let unipolar = atrial ? 4.6 : 10.2;
  let tissue = 'normal';
  let tag = null;

  // Check proximity to any placed RF ablation line first
  for (const lineId of ablatedLines) {
    const line = EAM3D_ABLATION_LINES[lineId];
    if (!line) continue;
    for (const lp of line.points) {
      if (dist3(point, lp) < 0.12) {
        bipolar = 0.06;
        unipolar = 1.2;
        tissue = 'scar';
      }
    }
  }

  if (tissue !== 'scar') {
    if ((scenarioId === 'vt-ischemic' || lv.vtStudyMesh) && chamber === 'lv') {
      const dScar = dist3(point, ANCHORS.lvInferolateralScar);
      // Conducting diastolic isthmus corridor through the middle of the scar
      const inChannel = Math.abs(point[1] - ANCHORS.lvInferolateralScar[1]) < 0.065 && dScar < 0.42;
      if (inChannel) {
        bipolar = 0.34;
        unipolar = 4.2;
        tissue = 'channel';
        tag = Math.abs(point[0] - ANCHORS.lvInferolateralScar[0]) < 0.08 ? 'lp' : 'lava';
      } else if (dScar < 0.38) {
        bipolar = 0.14;
        unipolar = 3.1;
        tissue = 'scar';
      } else if (dScar < 0.58) {
        bipolar = 0.92;
        unipolar = 6.4;
        tissue = 'border';
        tag = 'lava';
      }
    } else if ((scenarioId === 'atrial-scar-flutter' || scenarioId === 'af' || lv.afRemodelling > 0.25) && atrial) {
      const dRoof = dist3(point, ANCHORS.laRoofMid);
      const dPost = dist3(point, ANCHORS.laPosterior);
      const inIsthmus = Math.abs(point[0] - ANCHORS.laRoofMid[0]) < 0.06 && dRoof < 0.34;
      if (inIsthmus) {
        bipolar = 0.28;
        unipolar = 1.9;
        tissue = 'channel';
      } else if (dRoof < 0.28 || dPost < 0.26) {
        bipolar = 0.18;
        unipolar = 1.4;
        tissue = 'scar';
      } else if (dRoof < 0.46 || dPost < 0.44) {
        bipolar = 0.74;
        unipolar = 2.6;
        tissue = 'border';
      }
    }
  }

  // 2. Local activation time (LAT in ms within [0, tcl))
  let lat = 0;
  if (atrial) {
    if (spec.id === 'flutter-typical' && chamber === 'ra') {
      const ang = Math.atan2(point[1] - (-0.05), point[0] - (-0.95));
      const norm = ((-ang + Math.PI) / (2 * Math.PI)) % 1;
      lat = Math.round(norm * spec.tcl);
    } else if (spec.id === 'atrial-scar-flutter') {
      const ang = Math.atan2(point[1] - 0.45, point[0] - (-0.15));
      const norm = ((ang + Math.PI) / (2 * Math.PI)) % 1;
      lat = Math.round(norm * spec.tcl);
    } else if (spec.id === 'af') {
      // Multi-rotor spatial phase pattern on biatrial surface
      const theta1 = Math.atan2(point[1] - ANCHORS.laPosterior[1], point[0] - ANCHORS.laPosterior[0]);
      const theta2 = Math.atan2(point[2] - ANCHORS.laRoofMid[2], point[1] - ANCHORS.laRoofMid[1]);
      const wave = (((theta1 + theta2 * 0.7) / (2 * Math.PI)) % 1 + 1) % 1;
      lat = Math.round(wave * spec.tcl);
    } else {
      const src = chamber === 'ra' ? spec.atrialOrigin : spec.laOrigin;
      const delay = chamber === 'la' && spec.id === 'sinus' ? 28 : 0;
      const d = dist3(point, src);
      const cvFactor = (tissue === 'channel' ? 0.35 : tissue === 'border' ? 0.65 : 1) * (lv.atrialCv / 0.90);
      lat = Math.round(delay + (d * 68) / Math.max(0.2, cvFactor));
    }
  } else {
    // Ventricular activation
    if (spec.ventricularOrigin === 'his-purkinje') {
      const exits = chamber === 'lv'
        ? [C.laf[C.laf.length - 1], C.lpf[C.lpf.length - 1], ANCHORS.lvApex]
        : [C.rbb[3], ANCHORS.rvApex];
      const dMin = Math.min(...exits.map((e) => dist3(point, e)));
      const cvFactor = (tissue === 'channel' ? 0.3 : tissue === 'border' ? 0.6 : 1) * (lv.ventricularCv / 0.61);
      lat = Math.round(((spec.vOffset + (dMin * 52) / Math.max(0.2, cvFactor)) % spec.tcl + spec.tcl) % spec.tcl);
    } else {
      // Focal PVC (RVOT) or scar-related VT exit
      const d = dist3(point, spec.ventricularOrigin);
      const slow = tissue === 'channel' ? 0.28 : tissue === 'border' ? 0.55 : 1;
      const cvFactor = slow * (lv.ventricularCv / 0.61);
      lat = Math.round((d * 92) / Math.max(0.18, cvFactor));
      if (spec.reentrant) lat = ((lat % spec.tcl) + spec.tcl) % spec.tcl;
    }
  }

  return { lat, bipolar: Number(bipolar.toFixed(2)), unipolar: Number(unipolar.toFixed(2)), tissue, tag, tcl: spec.tcl };
}

/**
 * Compute instantaneous normalized membrane potential U in [0, 1] and phase in [-pi, pi]
 * at simulation clock `timeMs` for a vertex with `lat` and `tcl`.
 */
export function vertexWaveState(lat, tcl, timeMs, chamber = 'ra', tissue = 'normal', pacings = []) {
  if (tissue === 'scar') return { u: 0, phase: -Math.PI, front: false };
  const apd = chamber === 'ra' || chamber === 'la' ? Math.min(135, tcl * 0.52) : Math.min(220, tcl * 0.62);
  let age = (((timeMs - lat) % tcl) + tcl) % tcl;

  // Check if an active pacing stimulus wavefront reaches this vertex earlier
  for (const p of pacings) {
    const dt = timeMs - p.t0 - p.travelMs;
    if (dt >= 0 && dt < age) age = dt;
  }

  const front = age >= 0 && age <= 24;
  let u = 0;
  if (age >= 0 && age < 14) u = age / 14;
  else if (age >= 14 && age < apd) u = 1 - ((age - 14) / Math.max(1, apd - 14)) * 0.72;
  else if (age >= apd && age < apd + 45) u = 0.28 * (1 - (age - apd) / 45);

  const phase = -Math.PI + (Math.min(age, tcl) / Math.max(1, tcl)) * (2 * Math.PI);
  return { u: Number(u.toFixed(3)), phase: Number(phase.toFixed(3)), front };
}

/**
 * Compute the 23 live polygraph channel samples at a given `timeMs` (or over a window),
 * plus which 3D catheter electrodes are currently depolarizing (`litChannels`).
 */
export function sampleChannelsAt(timeMs, scenarioId, levers = DEFAULT_LEVERS, ablatedLines = new Set(), stimState = null) {
  const spec = scenarioSpec(scenarioId, levers, ablatedLines);
  // Effective cycle length follows burst pacing when burst pacing is active and capturing.
  const burstActive = stimState?.active && stimState.mode === 'burst' && stimState.bclMs >= 180;
  const effTcl = burstActive ? stimState.bclMs : spec.tcl;
  const phaseMs = ((timeMs % effTcl) + effTcl) % effTcl;
  const values = {};
  const lit = new Set();

  const bipoleWave = (dt, amp = 1.0, width = 16, fractionated = false) => {
    // Wrap dt around [-effTcl/2, effTcl/2]
    let d = ((dt + effTcl / 2) % effTcl + effTcl) % effTcl - effTcl / 2;
    if (Math.abs(d) <= 18) lit.add('current');
    if (Math.abs(d) > width * 2.6) return 0;
    const x = d / (width * 0.45);
    let w = -x * Math.exp(-0.5 * x * x) * amp * 1.65;
    if (fractionated) {
      const x2 = (d - 9) / 3.2, x3 = (d + 8) / 2.8;
      w = w * 0.45 + Math.sin(d * 1.1) * Math.exp(-0.5 * (x2 * x2)) * 0.38 - Math.cos(d * 0.9) * Math.exp(-0.5 * (x3 * x3)) * 0.32;
    }
    return Number(w.toFixed(4));
  };

  for (const ch of EAM3D_CHANNELS) {
    if (ch.kind === 'surface') {
      // Surface ECG synthesized from atrial P/F wave + ventricular QRS + T wave
      const vPeak = ((spec.vOffset % effTcl) + effTcl) % effTcl;
      const dv = ((phaseMs - vPeak + effTcl / 2) % effTcl + effTcl) % effTcl - effTcl / 2;
      const da = ((phaseMs - 22 + effTcl / 2) % effTcl + effTcl) % effTcl - effTcl / 2;
      const wideQrs = scenarioId === 'vt-ischemic' || scenarioId === 'pvc-rvot' || burstActive;
      const qrsW = wideQrs ? 28 : 13;
      const qrsSign = ch.id === 'V1' ? (scenarioId === 'vt-ischemic' ? 0.85 : -0.75) : (scenarioId === 'pvc-rvot' ? 1.25 : 0.95);
      const qrs = Math.exp(-0.5 * (dv / qrsW) ** 2) * qrsSign - Math.exp(-0.5 * ((dv - qrsW * 0.9) / (qrsW * 0.7)) ** 2) * (0.35 * qrsSign);
      const tWave = Math.exp(-0.5 * ((dv - 125) / 36) ** 2) * (wideQrs ? -0.28 * qrsSign : 0.26 * qrsSign);
      const pWave = scenarioId === 'flutter-typical'
        ? 0.18 * Math.sin((2 * Math.PI * phaseMs) / effTcl)
        : scenarioId === 'af'
          ? 0.06 * Math.sin(timeMs * 0.043) + 0.05 * Math.cos(timeMs * 0.071)
          : Math.exp(-0.5 * (da / 16) ** 2) * (scenarioId === 'avnrt' ? -0.14 : 0.16);
      values[ch.id] = Number((pWave + qrs + tWave).toFixed(4));
      continue;
    }

    const chamber = ch.kind === 'ventricular' ? 'rv' : ch.kind === 'grid' ? (scenarioId === 'vt-ischemic' ? 'lv' : 'la') : ch.catheter === 'cs' ? 'la' : 'ra';
    const vInfo = evaluateVertex3d(ch.pos, chamber, scenarioId, levers, ablatedLines);
    const localLat = burstActive
      ? Math.round((dist3(ch.pos, PACING_CHANNELS.find((p) => p.id === stimState.channel)?.pos || ANCHORS.rvApex) * 65) % effTcl)
      : vInfo.lat % effTcl;
    const dt = phaseMs - localLat;
    const frac = vInfo.tissue === 'channel' || vInfo.tissue === 'border' || scenarioId === 'af';
    const amp = vInfo.tissue === 'scar' ? 0.08 : frac ? 0.55 : 1.0;
    let sig = bipoleWave(dt, amp, frac ? 22 : 13, frac);

    // His channel carries both A, H and V deflections
    if (ch.kind === 'his') {
      const hLat = ((spec.hisOffset % effTcl) + effTcl) % effTcl;
      const vLat = ((spec.vOffset % effTcl) + effTcl) % effTcl;
      sig += bipoleWave(phaseMs - hLat, 0.55, 7, false) + bipoleWave(phaseMs - vLat, 0.95, 14, false);
    }
    // CS channels also show a smaller far-field V deflection
    if (ch.kind === 'cs') {
      const vLat = (((spec.vOffset + 18) % effTcl) + effTcl) % effTcl;
      sig += bipoleWave(phaseMs - vLat, 0.38, 15, false);
    }
    // Pacing spike artifact on the stimulated channel
    if (burstActive && ch.id === stimState.channel && phaseMs < 8) {
      sig = phaseMs < 4 ? 1.8 : -1.6;
    }

    if (Math.abs(((dt + effTcl / 2) % effTcl + effTcl) % effTcl - effTcl / 2) <= 18) {
      lit.add(ch.id);
    }
    values[ch.id] = Number(sig.toFixed(4));
  }

  return {
    timeMs,
    tcl: effTcl,
    bpm: Math.round(60000 / Math.max(120, effTcl)),
    values,
    litChannels: [...lit]
  };
}

/**
 * Evaluate the effect of a programmed stimulation maneuver (PACE, BURST overdrive, or S1-S2)
 * delivered from `channelId` on the active 3D substrate.
 */
export function runStimManeuver({ scenarioId, mode = 'burst', channelId = 'rv-d', bclMs = 352, s2Ms = 280, levers = DEFAULT_LEVERS, ablatedLines = new Set() }) {
  const spec = scenarioSpec(scenarioId, levers, ablatedLines);
  const pacer = PACING_CHANNELS.find((p) => p.id === channelId) || PACING_CHANNELS[0];
  const dCircuit = dist3(pacer.pos, spec.atrialOrigin);
  const ppiExtra = Math.round(dCircuit * 78 + (scenarioId === 'avnrt' && pacer.chamber === 'rv' ? 128 : 18));
  const ppi = spec.tcl + ppiExtra;

  if (mode === 's1s2') {
    if (scenarioId === 'sinus' && s2Ms >= 240 && s2Ms <= 320 && !ablatedLines.has('slow-pathway')) {
      return {
        outcome: 'induced',
        nextScenario: 'avnrt',
        ppi: null,
        ppiMinusTcl: null,
        ahJump: true,
        summaryCode: 'ahJumpInducedAvnrt'
      };
    }
    return {
      outcome: s2Ms < 210 ? 'refractory' : 'captured',
      nextScenario: scenarioId,
      ppi: null,
      ppiMinusTcl: null,
      ahJump: s2Ms <= 310,
      summaryCode: s2Ms < 210 ? 'effectiveRefractory' : 'extrastimulusCaptured'
    };
  }

  if (mode === 'burst') {
    const overdrive = bclMs < spec.tcl;
    const terminate = overdrive && bclMs <= spec.tcl - 55 && spec.reentrant && scenarioId !== 'af';
    return {
      outcome: terminate ? 'terminated' : overdrive ? 'entrained' : 'underdrive',
      nextScenario: terminate ? 'sinus' : scenarioId,
      ppi,
      ppiMinusTcl: ppi - spec.tcl,
      inCircuit: ppi - spec.tcl <= 30,
      summaryCode: terminate ? 'overdriveTerminated' : overdrive ? 'overdriveEntrained' : 'underdrivePacing'
    };
  }

  return {
    outcome: 'paced',
    nextScenario: scenarioId,
    ppi: bclMs,
    ppiMinusTcl: 0,
    inCircuit: false,
    summaryCode: 'fixedPacing'
  };
}

/**
 * Probabilistic Circuit Modeling ("Find the circuit" workflow):
 * Surveys potential reentrant circuits across `runs` (10, 100, or 1000) over the 3D substrate,
 * filters out circuits interrupted by `ablatedLines`, and ranks minimal-intervention lines.
 */
export function runCircuitSurvey({ mapPreset = 'biatrial-scar', runs = 100, levers = DEFAULT_LEVERS, ablatedLines = new Set() } = {}) {
  const lv = { ...DEFAULT_LEVERS, ...levers };
  const cvScale = 0.90 / Math.max(0.3, lv.atrialCv);

  // Candidate 3D reentrant circuits on the mapped anatomy (matching the 6 circuits in circuit-finding.jpg)
  const candidates = [
    {
      id: 'circuit-1-mitral',
      number: 1,
      color: '#ec4899',
      chamber: 'la',
      baseWeight: mapPreset === 'vt-scar' ? 0.04 : 0.34,
      tclMs: Math.round(255 * cvScale),
      isthmusMm: 14,
      blockedBy: ['mitral-isthmus'],
      ribbon3d: [
        [0.18, 0.32, -0.35], [0.36, 0.14, -0.52], [0.28, -0.18, -0.44],
        [0.02, -0.24, -0.32], [-0.14, 0.04, -0.26], [0.18, 0.32, -0.35]
      ]
    },
    {
      id: 'circuit-2-roof',
      number: 2,
      color: '#ef4444',
      chamber: 'la',
      baseWeight: mapPreset === 'vt-scar' ? 0.02 : 0.26,
      tclMs: Math.round(270 * cvScale),
      isthmusMm: 11,
      blockedBy: ['la-anterior-roof'],
      ribbon3d: [
        [-0.36, 0.88, -0.48], [-0.12, 1.08, -0.56], [0.18, 0.92, -0.52],
        [0.14, 0.45, -0.68], [-0.22, 0.42, -0.66], [-0.36, 0.88, -0.48]
      ]
    },
    {
      id: 'circuit-3-posterior-fig8',
      number: 3,
      color: '#10b981',
      chamber: 'la',
      baseWeight: mapPreset === 'vt-scar' ? 0.02 : 0.16,
      tclMs: Math.round(242 * cvScale),
      isthmusMm: 9,
      blockedBy: ['la-anterior-roof', 'posterior-box'],
      ribbon3d: [
        [-0.28, 0.72, -0.74], [-0.04, 0.52, -0.82], [0.22, 0.68, -0.74],
        [0.18, 0.28, -0.76], [-0.24, 0.26, -0.74], [-0.28, 0.72, -0.74]
      ]
    },
    {
      id: 'circuit-4-anterior-scar',
      number: 4,
      color: '#eab308',
      chamber: 'la',
      baseWeight: mapPreset === 'vt-scar' ? 0.01 : 0.11,
      tclMs: Math.round(288 * cvScale),
      isthmusMm: 12,
      blockedBy: ['la-anterior-roof', 'mitral-isthmus'],
      ribbon3d: [
        [-0.24, 0.96, -0.42], [0.08, 0.84, -0.40], [0.28, 0.48, -0.48],
        [-0.06, 0.54, -0.50], [-0.24, 0.96, -0.42]
      ]
    },
    {
      id: 'circuit-5-cti',
      number: 5,
      color: '#38bdf8',
      chamber: 'ra',
      baseWeight: mapPreset === 'vt-scar' ? 0.03 : 0.09,
      tclMs: Math.round(238 * cvScale),
      isthmusMm: 18,
      blockedBy: ['cti-line'],
      ribbon3d: [
        [-0.78, -0.46, 0.12], [-1.18, -0.10, 0.22], [-1.06, 0.52, 0.18],
        [-0.66, 0.24, 0.06], [-0.78, -0.46, 0.12]
      ]
    },
    {
      id: 'circuit-6-vt-isthmus',
      number: 6,
      color: '#a855f7',
      chamber: 'lv',
      baseWeight: mapPreset === 'vt-scar' ? 0.88 : 0.04,
      tclMs: Math.round(318 * (0.61 / Math.max(0.25, lv.ventricularCv))),
      isthmusMm: 8,
      blockedBy: ['vt-isthmus-dechannel'],
      ribbon3d: [
        [0.62, -0.24, -0.30], [0.76, -0.36, -0.35], [0.90, -0.48, -0.32],
        [0.78, -0.68, -0.12], [0.54, -0.48, -0.14], [0.62, -0.24, -0.30]
      ]
    }
  ];

  const activeCircuits = candidates.map((c) => {
    const interrupted = c.blockedBy.some((lineId) => ablatedLines.has(lineId));
    const weight = interrupted ? 0 : c.baseWeight;
    const count = Math.round(weight * runs);
    return {
      ...c,
      interrupted,
      sustainedCount: count,
      frequencyPct: Number(((count / Math.max(1, runs)) * 100).toFixed(1))
    };
  });

  const totalSustained = activeCircuits.reduce((s, c) => s + c.sustainedCount, 0);

  // Proposed intervention lines compared by length (mm) and share of sustained circuits interrupted
  const proposedLines = Object.values(EAM3D_ABLATION_LINES)
    .filter((line) => ['la-anterior-roof', 'mitral-isthmus', 'cti-line', 'posterior-box', 'vt-isthmus-dechannel'].includes(line.id))
    .map((line) => {
      const blocked = activeCircuits.filter((c) => !c.interrupted && c.blockedBy.includes(line.id));
      const blockedRuns = blocked.reduce((s, c) => s + c.sustainedCount, 0);
      const sharePct = totalSustained > 0 ? Math.round((blockedRuns / totalSustained) * 100) : 0;
      const efficiency = Number((sharePct / Math.max(1, line.lengthMm)).toFixed(2));
      return {
        id: line.id,
        chamber: line.chamber,
        lengthMm: line.lengthMm,
        applied: ablatedLines.has(line.id),
        circuitsBlocked: blocked.map((c) => c.number),
        interruptedSharePct: sharePct,
        efficiency,
        points: line.points
      };
    })
    .sort((a, b) => b.interruptedSharePct - a.interruptedSharePct || a.lengthMm - b.lengthMm);

  return {
    mapPreset,
    runs,
    totalSustained,
    sustainedPct: Math.round((totalSustained / Math.max(1, runs)) * 100),
    circuits: activeCircuits,
    proposedLines
  };
}

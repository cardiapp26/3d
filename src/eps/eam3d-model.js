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
 *    Atria and ventricles run on separate clocks, so flutter conducts 2:1 and
 *    atrial fibrillation gives an irregular ventricular response.
 * 4. Programmed stimulation (PACE, BURST overdrive, S1-S2 extrastimulus) from any
 *    catheter bipole and 3D RF ablation lines that block circuits in real time.
 * 5. Probabilistic circuit modeling ("Find the circuit"): Monte Carlo survey across
 *    10-1,000 runs over a 3D voltage map, ranking candidate reentrant circuits and
 *    comparing minimal-intervention ablation lines by length (mm) and interruption %.
 */
import { ATLAS_CONDUCTION as C } from '../ecg/ecg-atlas-conduction.js';
import { ATLAS_CONDUCTION_EXTRAS as X } from './conduction-atlas-extras.js';
import {
  DEFAULT_LEVERS,
  ANCHORS,
  EAM3D_CATHETERS,
  EAM3D_CHANNELS,
  PACING_CHANNELS,
  EAM3D_ABLATION_LINES,
} from './eam3d-anatomy.js';

// One import surface for the workstation: anatomy data and the circuit survey live in their own
// modules and are re-exported here.
export * from './eam3d-anatomy.js';
export { runCircuitSurvey } from './eam3d-survey-model.js';

const CS_ELECTRODES = EAM3D_CATHETERS.cs.electrodes;

const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// Irregularly irregular RR intervals (ms) of the ventricular response in atrial fibrillation.
const AF_RR_MS = Object.freeze([520, 680, 440, 760, 600, 480, 720, 560, 640, 500]);
const AF_RR_TOTAL_MS = AF_RR_MS.reduce((s, v) => s + v, 0);
const AF_RR_MIN_MS = Math.min(...AF_RR_MS);
const AF_RR_MEAN_MS = Math.round(AF_RR_TOTAL_MS / AF_RR_MS.length);

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
      // Typical slow-fast: His leads, then atria and ventricles fire almost together (VA < 70 ms).
      hisOffset: -45,
      vOffset: -5,
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
      avRatio: 2,
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
      avRatio: 2,
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
      hisOffset: 35,
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
      hisOffset: 40,
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
      hisOffset: 20,
      vOffset: 63,
      irregularV: true,
      reentrant: true,
      chamberFocus: 'biatrial'
    }
  };
  const spec = specs[scenarioId] || specs.avnrt;
  const avRatio = spec.avRatio || 1;
  // vTcl: ventricular cycle. The AV node filters flutter 2:1 and AF irregularly (mean RR).
  return { ...spec, avRatio, irregularV: Boolean(spec.irregularV), vTcl: spec.irregularV ? AF_RR_MEAN_MS : spec.tcl * avRatio };
}

/**
 * Clock of one chamber group at `timeMs`: ms since its last cycle start (`phase`), the running
 * cycle length and the previous one. Atria follow the tachycardia cycle; ventricles follow
 * `vTcl`, or the irregular RR sequence in atrial fibrillation.
 */
export function chamberClock(spec, chamber, timeMs) {
  const atrial = chamber === 'ra' || chamber === 'la';
  if (atrial || !spec.irregularV) {
    const cycle = atrial ? spec.tcl : spec.vTcl;
    return { phase: ((timeMs % cycle) + cycle) % cycle, cycle, prevCycle: cycle };
  }
  let rest = ((timeMs % AF_RR_TOTAL_MS) + AF_RR_TOTAL_MS) % AF_RR_TOTAL_MS;
  for (let i = 0; i < AF_RR_MS.length; i++) {
    if (rest < AF_RR_MS[i]) {
      return { phase: rest, cycle: AF_RR_MS[i], prevCycle: AF_RR_MS[(i + AF_RR_MS.length - 1) % AF_RR_MS.length] };
    }
    rest -= AF_RR_MS[i];
  }
  return { phase: 0, cycle: AF_RR_MS[0], prevCycle: AF_RR_MS[AF_RR_MS.length - 1] };
}

/** Ms since the tissue with local activation time `lat` last fired on `clock`. */
export function activationAge(lat, clock) {
  const d = clock.phase - lat;
  if (d >= 0) return d;
  // First beat of a pacing train: there is no earlier beat, the tissue has not fired yet.
  if (!Number.isFinite(clock.prevCycle)) return Infinity;
  const prev = Math.max(1, clock.prevCycle);
  return ((d % prev) + prev) % prev;
}

/** Signed ms from the nearest activation (past or coming) of tissue with `lat` on `clock`. */
export function nearestActivationDelta(lat, clock) {
  const d = clock.phase - lat;
  let best = d;
  for (const cand of [d + clock.prevCycle, d - clock.cycle]) {
    if (Number.isFinite(cand) && Math.abs(cand) < Math.abs(best)) best = cand;
  }
  return best;
}

/**
 * Action potential duration (ms). `restitution` scales the resting APD; `rateAdaptation`
 * (0..1) sets how much it shortens at short cycles. It never exceeds 80% of the cycle.
 */
export function actionPotentialMs(chamber, cycle, levers = DEFAULT_LEVERS) {
  const lv = { ...DEFAULT_LEVERS, ...levers };
  const atrial = chamber === 'ra' || chamber === 'la';
  const rest = (atrial ? 150 : 250) * (atrial ? lv.atrialRestitution : lv.ventricularRestitution);
  const shortening = Math.max(0, Math.min(0.6, 1 - cycle / 600));
  const adapted = rest * (1 - (atrial ? lv.rateAdaptation : 0.8) * shortening);
  return Math.max(40, Math.min(adapted, cycle * 0.8));
}

/** Normalized membrane potential 0..1 at `age` ms after local activation. */
export function waveLevel(age, apd) {
  if (age < 0) return 0;
  if (age < 14) return age / 14;
  if (age < apd) return 1 - ((age - 14) / Math.max(1, apd - 14)) * 0.72;
  if (age < apd + 45) return 0.28 * (1 - (age - apd) / 45);
  return 0;
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
      // Without the Purkinje network the impulse leaves the His bundle at the septum and
      // spreads slowly from muscle to muscle.
      const viaPurkinje = lv.conductionParticipates;
      const exits = !viaPurkinje
        ? [ANCHORS.hisEnd]
        : chamber === 'lv'
          ? [C.laf[C.laf.length - 1], C.lpf[C.lpf.length - 1], ANCHORS.lvApex]
          : [C.rbb[3], ANCHORS.rvApex];
      const dMin = Math.min(...exits.map((e) => dist3(point, e)));
      const cvFactor = (tissue === 'channel' ? 0.3 : tissue === 'border' ? 0.6 : 1) * (lv.ventricularCv / 0.61);
      const spread = (dMin * (viaPurkinje ? 52 : 96)) / Math.max(0.2, cvFactor);
      // AF beats are irregular: keep the LAT inside the shortest RR instead of wrapping on the mean.
      lat = spec.irregularV
        ? Math.round(Math.min(AF_RR_MIN_MS - 20, spec.vOffset + spread))
        : Math.round(((spec.vOffset + spread) % spec.vTcl + spec.vTcl) % spec.vTcl);
    } else {
      // Focal PVC (RVOT) or scar-related VT exit
      const d = dist3(point, spec.ventricularOrigin);
      const slow = tissue === 'channel' ? 0.28 : tissue === 'border' ? 0.55 : 1;
      const cvFactor = slow * (lv.ventricularCv / 0.61);
      lat = Math.round((d * 92) / Math.max(0.18, cvFactor));
      if (spec.reentrant) lat = ((lat % spec.vTcl) + spec.vTcl) % spec.vTcl;
    }
  }

  return { lat, bipolar: Number(bipolar.toFixed(2)), unipolar: Number(unipolar.toFixed(2)), tissue, tag, tcl: atrial ? spec.tcl : spec.vTcl };
}

/**
 * Compute instantaneous normalized membrane potential U in [0, 1] and phase in [-pi, pi]
 * at simulation clock `timeMs` for a vertex with `lat` and `tcl`.
 */
export function vertexWaveState(lat, tcl, timeMs, chamber = 'ra', tissue = 'normal', pacings = [], levers = DEFAULT_LEVERS) {
  if (tissue === 'scar') return { u: 0, phase: -Math.PI, front: false };
  let age = (((timeMs - lat) % tcl) + tcl) % tcl;

  // Check if an active pacing stimulus wavefront reaches this vertex earlier
  for (const p of pacings) {
    const dt = timeMs - p.t0 - p.travelMs;
    if (dt >= 0 && dt < age) age = dt;
  }

  const u = waveLevel(age, actionPotentialMs(chamber, tcl, levers));
  const phase = -Math.PI + (Math.min(age, tcl) / Math.max(1, tcl)) * (2 * Math.PI);
  return { u: Number(u.toFixed(3)), phase: Number(phase.toFixed(3)), front: age <= WAVEFRONT_MS };
}

/** Width (ms) of the bright leading edge drawn on the live map. */
export const WAVEFRONT_MS = 24;

const isVentricular = (chamber) => chamber === 'rv' || chamber === 'lv';

/** Where the HD Grid sits until the user moves it: over the LV inferolateral scar. */
export const DEFAULT_GRID_SITE = Object.freeze({ pos: ANCHORS.lvInferolateralScar, chamber: 'lv' });

/**
 * Stimulus train of a pacing maneuver, in ms from its first spike.
 * BURST / PACE: eight stimuli at `bclMs`. S1-S2: four S1 beats (drive >= 400 ms), then S2.
 * `captured[i]` says whether spike i depolarizes tissue or only leaves an artifact.
 */
export function buildStimTrain({ mode = 'burst', channelId = 'rv-d', bclMs = 352, s2Ms = 280, captures = true, s2Captures = true, gridSite = DEFAULT_GRID_SITE } = {}) {
  const listed = PACING_CHANNELS.find((p) => p.id === channelId) || PACING_CHANNELS[0];
  // Pacing from the HD Grid starts wherever the grid sits now.
  const pacer = listed.id.startsWith('grid') && gridSite ? { ...listed, pos: gridSite.pos, chamber: gridSite.chamber } : listed;
  const extra = mode === 's1s2';
  const drive = Math.max(extra ? 400 : 160, bclMs);
  const spikes = extra
    ? [0, drive, 2 * drive, 3 * drive, 3 * drive + s2Ms]
    : Array.from({ length: 8 }, (_, i) => i * drive);
  const last = spikes.length - 1;
  return Object.freeze({
    mode,
    channel: pacer.id,
    chamber: pacer.chamber,
    pos: pacer.pos,
    spikes: Object.freeze(spikes),
    captured: Object.freeze(spikes.map((_, i) => captures && (!extra || i < last || s2Captures))),
    durationMs: spikes[last] + (extra ? 320 : drive)
  });
}

/** Clock of the paced rhythm `tRel` ms into a train; null while no stimulus has captured. */
export function pacedClock(train, tRel) {
  let idx = -1;
  for (let i = 0; i < train.spikes.length; i++) {
    if (train.captured[i] && train.spikes[i] <= tRel) idx = i;
  }
  if (idx < 0) return null;
  let next = -1;
  for (let i = idx + 1; i < train.spikes.length && next < 0; i++) if (train.captured[i]) next = i;
  let prev = -1;
  for (let i = idx - 1; i >= 0 && prev < 0; i--) if (train.captured[i]) prev = i;
  const cycle = next >= 0 ? train.spikes[next] - train.spikes[idx] : train.durationMs - train.spikes[idx];
  return {
    phase: tRel - train.spikes[idx],
    cycle,
    // Infinity: the first captured stimulus has no paced beat before it.
    prevCycle: prev >= 0 ? train.spikes[idx] - train.spikes[prev] : Infinity
  };
}

/** Local activation time (ms after the stimulus) of a paced beat, with AV / VA delay across the AV ring. */
export function pacedLat(point, chamber, train) {
  const crossesAv = isVentricular(train.chamber) !== isVentricular(chamber);
  const delay = !crossesAv ? 0 : isVentricular(train.chamber) ? 90 : 150;
  return Math.round(dist3(point, train.pos) * 65 + delay);
}

const SPIKE_MS = 8;

function bipoleWave(d, amp = 1.0, width = 16, fractionated = false) {
  if (Math.abs(d) > width * 2.6) return 0;
  const x = d / (width * 0.45);
  const w = -x * Math.exp(-0.5 * x * x) * amp * 1.65;
  if (!fractionated) return w;
  const x2 = (d - 9) / 3.2;
  const x3 = (d + 8) / 2.8;
  return w * 0.45 + Math.sin(d * 1.1) * Math.exp(-0.5 * (x2 * x2)) * 0.38 - Math.cos(d * 0.9) * Math.exp(-0.5 * (x3 * x3)) * 0.32;
}

/**
 * Build a sampler for the 26 polygraph channels of one rhythm. The per-channel tissue
 * lookups are done once; the returned function is cheap to call for every time sample.
 * With `stim` (a buildStimTrain result) `timeMs` counts from the first stimulus.
 */
export function createChannelSampler(scenarioId, levers = DEFAULT_LEVERS, ablatedLines = new Set(), { stim = null, gridSite = DEFAULT_GRID_SITE } = {}) {
  const lv = { ...DEFAULT_LEVERS, ...levers };
  const spec = scenarioSpec(scenarioId, lv, ablatedLines);
  const grid = gridSite || DEFAULT_GRID_SITE;
  const wrapV = (ms) => ((ms % spec.vTcl) + spec.vTcl) % spec.vTcl;
  const ventPaced = Boolean(stim) && isVentricular(stim.chamber);

  const sites = EAM3D_CHANNELS.filter((ch) => ch.kind !== 'surface').map((ch) => {
    const onGrid = ch.catheter === 'grid';
    const pos = onGrid ? [grid.pos[0] + ch.offset[0], grid.pos[1] + ch.offset[1], grid.pos[2] + ch.offset[2]] : ch.pos;
    const chamber = onGrid ? grid.chamber : ch.kind === 'ventricular' ? 'rv' : ch.catheter === 'cs' ? 'la' : 'ra';
    const info = evaluateVertex3d(pos, chamber, scenarioId, lv, ablatedLines);
    const fractionated = info.tissue === 'channel' || info.tissue === 'border' || (spec.id === 'af' && !isVentricular(chamber));
    return {
      ch,
      ventricular: isVentricular(chamber),
      lat: info.lat,
      pacedLat: stim ? pacedLat(pos, chamber, stim) : 0,
      fractionated,
      amp: info.tissue === 'scar' ? 0.08 : fractionated ? 0.55 : 1.0
    };
  });

  return (timeMs) => {
    const paced = stim ? pacedClock(stim, timeMs) : null;
    const aClock = paced || chamberClock(spec, 'ra', timeMs);
    const vClock = paced || chamberClock(spec, 'lv', timeMs);
    const hLat = paced ? (ventPaced ? 30 : 110) : wrapV(spec.hisOffset);
    const vLat = paced ? (ventPaced ? 22 : 155) : wrapV(spec.vOffset);
    const aPeak = paced ? (ventPaced ? 125 : 20) : 22;
    const spikeAge = stim ? stim.spikes.reduce((age, sp) => (timeMs >= sp && timeMs < sp + SPIKE_MS ? timeMs - sp : age), -1) : -1;
    const values = {};
    const lit = [];

    const wideQrs = paced ? ventPaced : spec.id === 'vt-ischemic' || spec.id === 'pvc-rvot' || !lv.conductionParticipates;
    const qrsW = wideQrs ? 28 : 13;
    const dv = nearestActivationDelta(vLat, vClock);
    const da = nearestActivationDelta(aPeak, aClock);
    const aFrac = aClock.phase / Math.max(1, aClock.cycle);

    for (const ch of EAM3D_CHANNELS) {
      if (ch.kind !== 'surface') continue;
      // Surface ECG synthesized from atrial P / F wave + ventricular QRS + T wave
      const v1 = ch.id === 'V1';
      const qrsSign = v1 ? (spec.id === 'vt-ischemic' && !paced ? 0.85 : -0.75) : spec.id === 'pvc-rvot' && !paced ? 1.25 : 0.95;
      const qrs = Math.exp(-0.5 * (dv / qrsW) ** 2) * qrsSign - Math.exp(-0.5 * ((dv - qrsW * 0.9) / (qrsW * 0.7)) ** 2) * (0.35 * qrsSign);
      const tWave = Math.exp(-0.5 * ((dv - 125) / 36) ** 2) * (wideQrs ? -0.28 * qrsSign : 0.26 * qrsSign);
      let pWave;
      if (paced) pWave = Math.exp(-0.5 * (da / 16) ** 2) * (ventPaced ? -0.14 : 0.16);
      // Typical flutter in II: slow downslope, sharp upstroke (sawtooth). V1: discrete positive waves.
      else if (spec.id === 'flutter-typical') pWave = v1 ? 0.1 * Math.sin(2 * Math.PI * aFrac) : 0.2 * (1 - 2 * aFrac);
      else if (spec.id === 'atrial-scar-flutter') pWave = 0.1 * Math.sin(2 * Math.PI * aFrac);
      else if (spec.id === 'af') pWave = 0.06 * Math.sin(timeMs * 0.043) + 0.05 * Math.cos(timeMs * 0.071);
      else pWave = Math.exp(-0.5 * (da / 16) ** 2) * (spec.id === 'avnrt' || spec.id === 'vt-ischemic' ? -0.14 : 0.16);
      const artifact = spikeAge >= 0 && spikeAge < 4 ? 0.5 : 0;
      values[ch.id] = Number((pWave + qrs + tWave + artifact).toFixed(4));
    }

    for (const site of sites) {
      const { ch } = site;
      const d = nearestActivationDelta(paced ? site.pacedLat : site.lat, site.ventricular ? vClock : aClock);
      let sig = bipoleWave(d, site.amp, site.fractionated ? 22 : 13, site.fractionated);
      // His channel carries A, H and V deflections
      if (ch.kind === 'his') {
        sig += bipoleWave(nearestActivationDelta(hLat, vClock), 0.55, 7) + bipoleWave(nearestActivationDelta(vLat, vClock), 0.95, 14);
      }
      // CS channels also show a smaller far-field V deflection
      if (ch.kind === 'cs') sig += bipoleWave(nearestActivationDelta(vLat + 18, vClock), 0.38, 15);
      // Pacing spike artifact on the stimulated channel
      if (spikeAge >= 0 && ch.id === stim.channel) sig = spikeAge < 4 ? 1.8 : -1.6;
      if (Math.abs(d) <= 18) lit.push(ch.id);
      values[ch.id] = Number(sig.toFixed(4));
    }

    const vTcl = paced ? paced.cycle : spec.vTcl;
    return {
      timeMs,
      tcl: paced ? paced.cycle : spec.tcl,
      vTcl,
      bpm: Math.round(60000 / Math.max(120, vTcl)),
      pacing: Boolean(paced),
      values,
      litChannels: lit
    };
  };
}

/**
 * Compute the 26 live polygraph channel samples at one `timeMs`, plus the bipoles the
 * wavefront is passing right now (`litChannels`). For many samples of the same rhythm use
 * createChannelSampler once instead.
 */
export function sampleChannelsAt(timeMs, scenarioId, levers = DEFAULT_LEVERS, ablatedLines = new Set(), stimState = null, { gridSite = DEFAULT_GRID_SITE } = {}) {
  return createChannelSampler(scenarioId, levers, ablatedLines, { stim: stimState, gridSite })(timeMs);
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
        captures: true,
        s2Captures: true,
        summaryCode: 'ahJumpInducedAvnrt'
      };
    }
    return {
      outcome: s2Ms < 210 ? 'refractory' : 'captured',
      nextScenario: scenarioId,
      ppi: null,
      ppiMinusTcl: null,
      ahJump: s2Ms <= 310,
      captures: true,
      s2Captures: s2Ms >= 210,
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
      captures: overdrive,
      summaryCode: terminate ? 'overdriveTerminated' : overdrive ? 'overdriveEntrained' : 'underdrivePacing'
    };
  }

  return {
    outcome: 'paced',
    nextScenario: scenarioId,
    ppi: bclMs,
    ppiMinusTcl: 0,
    inCircuit: false,
    captures: bclMs < spec.tcl,
    summaryCode: 'fixedPacing'
  };
}

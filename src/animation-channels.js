/**
 * Cardia Animation Channels Controller
 * Deterministic, channel-based anatomical motion synchronized with CardiacCycle.
 * Chamber motion is a schematic volume change. Vertices on the valve plane stay
 * put so leaflet hinges are not pulled off the atlas orifice.
 */

import { CYCLE_SYNC as SYNC } from './cardiac-cycle.js';

/**
 * Computes normalized channel weights (0..1) for any phase in [0, 1).
 * Valve open/close times are the same marks as the ECG (P, QRS, T/S2).
 */
export function computeChannelWeights(phase) {
  const p = ((phase % 1) + 1) % 1;

  // P wave / atrial systole. Contraction ends as the AV valves finish closing.
  let atrialContraction = 0;
  if (p >= SYNC.atrialStart && p < SYNC.atrialEnd) {
    const t = (p - SYNC.atrialStart) / (SYNC.atrialEnd - SYNC.atrialStart);
    atrialContraction = Math.sin(Math.PI * t);
  }

  // QRS starts isovolumetric contraction. Pressure falls back to baseline at S2,
  // the start of isovolumetric relaxation, so the ventricle is relaxed while both valves are shut.
  let ventricularContraction = 0;
  if (p >= SYNC.ivcStart && p < SYNC.ivrStart) {
    if (p < SYNC.ejectionPeak) {
      const t = (p - SYNC.ivcStart) / (SYNC.ejectionPeak - SYNC.ivcStart);
      ventricularContraction = Math.sin((Math.PI / 2) * t);
    } else {
      const t = (p - SYNC.ejectionPeak) / (SYNC.ivrStart - SYNC.ejectionPeak);
      ventricularContraction = Math.cos((Math.PI / 2) * t);
    }
  }

  // AV valves stay shut through isovolumetric contraction, ejection, and isovolumetric relaxation.
  // They reopen only with the next rapid filling, after the cycle wraps.
  let avValveOpening = 0;
  if (p < SYNC.avCloseStart) {
    if (p < SYNC.fillingOpenEnd) {
      avValveOpening = Math.sin((Math.PI / 2) * (p / SYNC.fillingOpenEnd));
    } else {
      avValveOpening = 1;
    }
  } else if (p < SYNC.avClosed) {
    const t = (p - SYNC.avCloseStart) / (SYNC.avClosed - SYNC.avCloseStart);
    avValveOpening = Math.cos((Math.PI / 2) * t);
  }

  // Semilunar valves open after QRS, at ejection, and finish closing at S2 / isovolumetric relaxation.
  let semilunarValveOpening = 0;
  if (p >= SYNC.ejectionStart && p < SYNC.ivrStart) {
    if (p < SYNC.semilunarOpen) {
      const t = (p - SYNC.ejectionStart) / (SYNC.semilunarOpen - SYNC.ejectionStart);
      semilunarValveOpening = Math.sin((Math.PI / 2) * t);
    } else if (p < SYNC.semilunarCloseStart) {
      semilunarValveOpening = 1;
    } else {
      const t = (p - SYNC.semilunarCloseStart) / (SYNC.ivrStart - SYNC.semilunarCloseStart);
      semilunarValveOpening = Math.cos((Math.PI / 2) * t);
    }
  }

  let chordaeTension = 0;
  if (p >= SYNC.avClosed && p < SYNC.ivrStart) {
    chordaeTension = ventricularContraction;
  }

  return {
    phase: p,
    atrialContraction,
    ventricularContraction,
    avValveOpening,
    semilunarValveOpening,
    chordaeTension
  };
}

function rememberRest(mesh) {
  const attr = mesh.geometry?.attributes?.position;
  if (!attr) return null;
  if (!mesh.userData.restPosition) {
    mesh.userData.restPosition = new Float32Array(attr.array);
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    mesh.userData.motion = {
      minY: box.min.y,
      maxY: box.max.y,
      cx: (box.min.x + box.max.x) / 2,
      cz: (box.min.z + box.max.z) / 2
    };
  }
  return attr;
}

export function leafletOffset(x, y, z, opening, center, maxR, kind) {
  const amount = Math.max(0, Math.min(1, opening));
  const dx = x - center.x;
  const dz = z - center.z;
  const radial = Math.hypot(dx, dz);
  const safeR = Math.max(maxR, 1e-4);
  const fromHinge = Math.max(0, 1 - radial / safeR);
  const k = amount * fromHinge * fromHinge;
  const nx = radial > 1e-6 ? dx / radial : 0;
  const nz = radial > 1e-6 ? dz / radial : 0;
  const flare = safeR * (kind === 'semilunar' ? 0.22 : 0.16) * k;
  const yShift = safeR * (kind === 'semilunar' ? 0.06 : -0.1) * k;
  return [x + nx * flare, y + yShift, z + nz * flare];
}

function writeLeaflet(mesh, opening, center, maxR, kind) {
  const attr = rememberRest(mesh);
  if (!attr) return;
  const rest = mesh.userData.restPosition;
  const out = attr.array;
  for (let i = 0; i < rest.length; i += 3) {
    const next = leafletOffset(rest[i], rest[i + 1], rest[i + 2], opening, center, maxR, kind);
    out[i] = next[0];
    out[i + 1] = next[1];
    out[i + 2] = next[2];
  }
  attr.needsUpdate = true;
}

function writeChamber(mesh, weight, lockAtMaxY) {
  const attr = rememberRest(mesh);
  if (!attr) return;
  const rest = mesh.userData.restPosition;
  const { minY, maxY, cx, cz } = mesh.userData.motion;
  const height = Math.max(1e-4, maxY - minY);
  const out = attr.array;
  const radial = lockAtMaxY ? 0.11 : 0.08;
  const axial = lockAtMaxY ? 0.07 : 0.05;
  const amount = Math.max(0, Math.min(1, weight));
  for (let i = 0; i < rest.length; i += 3) {
    const x = rest[i];
    const y = rest[i + 1];
    const z = rest[i + 2];
    const fromValve = lockAtMaxY ? (maxY - y) / height : (y - minY) / height;
    const k = amount * fromValve * fromValve;
    out[i] = x - (x - cx) * radial * k;
    out[i + 1] = lockAtMaxY ? y + (maxY - y) * axial * k : y + (minY - y) * axial * k;
    out[i + 2] = z - (z - cz) * radial * k;
  }
  attr.needsUpdate = true;
}

/**
 * Creates an anatomical animation channel controller attached to a Heart instance.
 */
const VALVE_GROUPS = [
  { ids: ['lcc', 'rcc', 'ncc'], kind: 'semilunar', channel: 'semilunarValveOpening' },
  { ids: ['pulmonary-valve'], kind: 'semilunar', channel: 'semilunarValveOpening' },
  { ids: ['mitral'], kind: 'av', channel: 'avValveOpening' },
  { ids: ['tricuspid'], kind: 'av', channel: 'avValveOpening' }
];

export function createAnimationChannels({ meshMap }) {
  const valveCache = new Map();

  function deform(id, weight, lockAtMaxY) {
    for (const mesh of meshMap.get(id) || []) writeChamber(mesh, weight, lockAtMaxY);
  }

  function valveGroup(ids) {
    const key = ids.join('|');
    if (valveCache.has(key)) return valveCache.get(key);
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;
    const meshes = [];
    for (const id of ids) {
      for (const mesh of meshMap.get(id) || []) {
        if (!rememberRest(mesh)) continue;
        meshes.push(mesh);
        const box = mesh.geometry.boundingBox;
        minX = Math.min(minX, box.min.x);
        minY = Math.min(minY, box.min.y);
        minZ = Math.min(minZ, box.min.z);
        maxX = Math.max(maxX, box.max.x);
        maxY = Math.max(maxY, box.max.y);
        maxZ = Math.max(maxZ, box.max.z);
      }
    }
    if (!meshes.length) {
      valveCache.set(key, null);
      return null;
    }
    const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: (minZ + maxZ) / 2 };
    let maxR = 1e-4;
    for (const mesh of meshes) {
      const rest = mesh.userData.restPosition;
      for (let i = 0; i < rest.length; i += 3) {
        const radial = Math.hypot(rest[i] - center.x, rest[i + 2] - center.z);
        if (radial > maxR) maxR = radial;
      }
    }
    const group = { meshes, center, maxR };
    valveCache.set(key, group);
    return group;
  }

  function applyValves(weights) {
    for (const group of VALVE_GROUPS) {
      const pose = valveGroup(group.ids);
      if (!pose) continue;
      const opening = weights[group.channel];
      for (const mesh of pose.meshes) writeLeaflet(mesh, opening, pose.center, pose.maxR, group.kind);
    }
  }

  /**
   * Chamber volume and leaflet pose share computeChannelWeights with the ECG.
   */
  function applyChannels(cycleState) {
    if (!cycleState || cycleState.reducedMotion) {
      reset();
      return;
    }
    const weights = computeChannelWeights(cycleState.phase);
    deform('lv', weights.ventricularContraction, true);
    deform('rv', weights.ventricularContraction, true);
    deform('la', weights.atrialContraction, false);
    deform('ra', weights.atrialContraction, false);
    applyValves(weights);
    return weights;
  }

  function restoreMesh(mesh) {
    const attr = mesh.geometry?.attributes?.position;
    const rest = mesh.userData.restPosition;
    if (attr && rest) {
      attr.array.set(rest);
      attr.needsUpdate = true;
    }
    mesh.scale.set(1, 1, 1);
    mesh.position.set(0, 0, 0);
  }

  function reset() {
    for (const id of ['lv', 'rv', 'la', 'ra', 'lcc', 'rcc', 'ncc', 'pulmonary-valve', 'mitral', 'tricuspid', 'lv-papillary', 'rv-papillary']) {
      for (const mesh of meshMap.get(id) || []) restoreMesh(mesh);
    }
  }

  return {
    applyChannels,
    computeChannelWeights,
    reset
  };
}

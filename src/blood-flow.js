/**
 * Cardia Blood-Flow Visualization
 * Synchronized with CardiacCycle & Animation Channels.
 * Implements Phase 4 of GEMINI_DEVELOPMENT_PLAN.md.
 *
 * NOTE: This is an educational visual model illustrating directional flow pathways
 * and Wiggers cycle synchronization. It is not computational fluid dynamics (CFD)
 * or patient-specific hemodynamics.
 */

import * as THREE from 'three';
import { computeChannelWeights } from './animation-channels.js';

// Define flow streams with Catmull-Rom 3D control points
export const FLOW_STREAMS = [
  // 1. Right Heart Inflow: SVC -> RA -> Tricuspid -> RV
  {
    id: 'svc-ra-rv',
    type: 'deoxygenated',
    points: [
      [-1.08, 1.95, -0.16],
      [-1.05, 1.40, 0.05],
      [-1.03, 0.40, 0.12],
      [-0.85, -0.15, 0.15],
      [-0.65, -0.69, 0.22],
      [-0.30, -0.80, 0.50],
      [0.05, -0.95, 0.75]
    ],
    gating: (w) => 0.15 + 1.2 * w.avValveOpening + 0.7 * w.atrialContraction,
    baseSpeed: 0.35,
    weight: 1.0
  },
  // 2. Right Heart Inflow: IVC -> RA -> Tricuspid -> RV
  {
    id: 'ivc-ra-rv',
    type: 'deoxygenated',
    points: [
      [-0.95, -1.25, -0.10],
      [-1.00, -0.60, 0.05],
      [-1.03, 0.00, 0.12],
      [-0.80, -0.35, 0.18],
      [-0.65, -0.69, 0.22],
      [-0.30, -0.80, 0.50],
      [0.05, -0.95, 0.75]
    ],
    gating: (w) => 0.15 + 1.2 * w.avValveOpening + 0.7 * w.atrialContraction,
    baseSpeed: 0.35,
    weight: 0.8
  },
  // 3. Right Ventricular Ejection: RV -> RVOT -> Pulmonary Valve -> PA -> Left PA
  {
    id: 'rv-pa-left',
    type: 'deoxygenated',
    points: [
      [0.05, -0.95, 0.75],
      [0.00, -0.30, 0.65],
      [0.15, 0.35, 0.72],
      [0.30, 0.76, 0.79],
      [0.22, 1.20, 0.30],
      [0.07, 1.51, -0.31],
      [0.45, 1.62, -0.55]
    ],
    gating: (w) => 0.05 + 2.8 * w.semilunarValveOpening,
    baseSpeed: 0.45,
    weight: 1.0
  },
  // 4. Right Ventricular Ejection: RV -> RVOT -> Pulmonary Valve -> PA -> Right PA
  {
    id: 'rv-pa-right',
    type: 'deoxygenated',
    points: [
      [0.05, -0.95, 0.75],
      [0.00, -0.30, 0.65],
      [0.15, 0.35, 0.72],
      [0.30, 0.76, 0.79],
      [0.22, 1.20, 0.30],
      [0.07, 1.51, -0.31],
      [-0.35, 1.60, -0.50]
    ],
    gating: (w) => 0.05 + 2.8 * w.semilunarValveOpening,
    baseSpeed: 0.45,
    weight: 0.9
  },
  // 5. Left Heart Inflow: LSPV -> LA -> Mitral -> LV
  {
    id: 'lspv-la-lv',
    type: 'oxygenated',
    points: [
      [0.67, 0.75, -0.91],
      [0.40, 0.55, -0.65],
      [-0.05, 0.27, -0.37],
      [0.25, -0.05, -0.45],
      [0.48, -0.31, -0.50],
      [0.60, -0.65, -0.20],
      [0.85, -1.15, 0.10]
    ],
    gating: (w) => 0.15 + 1.2 * w.avValveOpening + 0.7 * w.atrialContraction,
    baseSpeed: 0.35,
    weight: 1.0
  },
  // 6. Left Heart Inflow: LIPV -> LA -> Mitral -> LV
  {
    id: 'lipv-la-lv',
    type: 'oxygenated',
    points: [
      [0.60, 0.06, -1.30],
      [0.35, 0.15, -0.85],
      [-0.05, 0.27, -0.37],
      [0.25, -0.05, -0.45],
      [0.48, -0.31, -0.50],
      [0.60, -0.65, -0.20],
      [0.85, -1.15, 0.10]
    ],
    gating: (w) => 0.15 + 1.2 * w.avValveOpening + 0.7 * w.atrialContraction,
    baseSpeed: 0.35,
    weight: 0.7
  },
  // 7. Left Heart Inflow: RSPV -> LA -> Mitral -> LV
  {
    id: 'rspv-la-lv',
    type: 'oxygenated',
    points: [
      [-1.43, 0.88, -0.85],
      [-0.80, 0.60, -0.60],
      [-0.05, 0.27, -0.37],
      [0.25, -0.05, -0.45],
      [0.48, -0.31, -0.50],
      [0.60, -0.65, -0.20],
      [0.85, -1.15, 0.10]
    ],
    gating: (w) => 0.15 + 1.2 * w.avValveOpening + 0.7 * w.atrialContraction,
    baseSpeed: 0.35,
    weight: 0.9
  },
  // 8. Left Heart Inflow: RIPV -> LA -> Mitral -> LV
  {
    id: 'ripv-la-lv',
    type: 'oxygenated',
    points: [
      [-1.00, 0.10, -1.34],
      [-0.60, 0.18, -0.85],
      [-0.05, 0.27, -0.37],
      [0.25, -0.05, -0.45],
      [0.48, -0.31, -0.50],
      [0.60, -0.65, -0.20],
      [0.85, -1.15, 0.10]
    ],
    gating: (w) => 0.15 + 1.2 * w.avValveOpening + 0.7 * w.atrialContraction,
    baseSpeed: 0.35,
    weight: 0.7
  },
  // 9. Left Ventricular Ejection: LV -> LVOT -> Aortic Valve -> Aorta Arch -> Descending Aorta
  {
    id: 'lv-aorta',
    type: 'oxygenated',
    points: [
      [0.85, -1.15, 0.10],
      [0.65, -0.60, 0.10],
      [0.35, -0.10, 0.05],
      [0.05, 0.35, -0.05],
      [-0.24, 0.69, -0.01],
      [-0.18, 1.40, -0.15],
      [-0.30, 2.36, -0.70],
      [-0.50, 2.10, -1.30]
    ],
    gating: (w) => 0.05 + 2.9 * w.semilunarValveOpening,
    baseSpeed: 0.48,
    weight: 1.6
  },
  // 10. Coronary Arterial Circulation: Aortic Root -> LM -> LAD
  {
    id: 'coronary-lad',
    type: 'oxygenated',
    points: [
      [-0.05, 0.80, -0.06],
      [0.16, 1.02, -0.06],
      [0.45, 0.60, 0.35],
      [0.75, -0.07, 0.91],
      [0.82, -0.70, 0.70],
      [0.85, -1.05, 0.30]
    ],
    // Coronary perfusion occurs predominantly during diastole (low ventricular pressure)
    gating: (w) => 0.20 + 1.1 * (1.0 - w.ventricularContraction),
    baseSpeed: 0.28,
    weight: 0.6
  },
  // 11. Coronary Arterial Circulation: Aortic Root -> LM -> LCx
  {
    id: 'coronary-lcx',
    type: 'oxygenated',
    points: [
      [0.16, 1.02, -0.06],
      [0.60, 0.55, -0.15],
      [0.96, -0.08, -0.20],
      [1.15, -0.60, -0.55]
    ],
    gating: (w) => 0.20 + 1.1 * (1.0 - w.ventricularContraction),
    baseSpeed: 0.28,
    weight: 0.5
  },
  // 12. Coronary Arterial Circulation: Right Aortic Root -> RCA -> RPL
  {
    id: 'coronary-rca',
    type: 'oxygenated',
    points: [
      [-0.25, 0.75, 0.15],
      [-0.50, 0.40, 0.30],
      [-0.14, -0.10, 0.38],
      [0.30, -0.75, 0.25],
      [0.72, -1.18, -0.23]
    ],
    gating: (w) => 0.20 + 1.1 * (1.0 - w.ventricularContraction),
    baseSpeed: 0.28,
    weight: 0.6
  },
  // 13. Cardiac Vein Drainage: GCV -> CS -> RA
  {
    id: 'coronary-gcv',
    type: 'deoxygenated',
    points: [
      [0.80, -0.85, 0.55],
      [0.99, -0.28, 0.17],
      [0.85, -0.30, -0.40],
      [-0.03, -0.51, -0.68],
      [-0.50, -0.45, -0.40],
      [-0.80, -0.30, -0.10]
    ],
    // Venous drainage assisted by systolic myocardial squeeze
    gating: (w) => 0.35 + 0.85 * w.ventricularContraction,
    baseSpeed: 0.25,
    weight: 0.6
  },
  // 14. Cardiac Vein Drainage: MCV -> CS -> RA
  {
    id: 'coronary-mcv',
    type: 'deoxygenated',
    points: [
      [0.65, -1.15, 0.05],
      [0.42, -1.03, 0.30],
      [0.20, -0.75, -0.25],
      [-0.03, -0.51, -0.68],
      [-0.50, -0.45, -0.40],
      [-0.80, -0.30, -0.10]
    ],
    gating: (w) => 0.35 + 0.85 * w.ventricularContraction,
    baseSpeed: 0.25,
    weight: 0.5
  },
  // 15. Cardiac Vein Drainage: PIV (PVLV) -> CS -> RA
  {
    id: 'coronary-piv',
    type: 'deoxygenated',
    points: [
      [1.08, -0.76, -0.25],
      [0.65, -0.65, -0.50],
      [-0.03, -0.51, -0.68],
      [-0.50, -0.45, -0.40],
      [-0.80, -0.30, -0.10]
    ],
    gating: (w) => 0.35 + 0.85 * w.ventricularContraction,
    baseSpeed: 0.25,
    weight: 0.5
  }
];

export function createBloodFlow(options = {}) {
  const group = new THREE.Group();
  group.name = 'Blood Flow Pathways';
  group.userData = { id: 'blood-flow', layer: 'flow', provenance: 'schematic' };

  // Prepare curves
  const streams = FLOW_STREAMS.map(s => {
    const vPoints = s.points.map(p => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(vPoints, false, 'centripetal', 0.5);
    return {
      ...s,
      curve,
      length: curve.getLength()
    };
  });

  const TOTAL_DEOXY_CAPACITY = 240;
  const TOTAL_OXY_CAPACITY = 240;

  // Materials
  const matDeoxy = new THREE.MeshStandardMaterial({
    color: 0x3498db,
    emissive: 0x1d6fa5,
    emissiveIntensity: 0.85,
    roughness: 0.25,
    metalness: 0.15,
    toneMapped: false
  });

  const matOxy = new THREE.MeshStandardMaterial({
    color: 0xe74c3c,
    emissive: 0xb03a2e,
    emissiveIntensity: 0.85,
    roughness: 0.25,
    metalness: 0.15,
    toneMapped: false
  });

  // Particle geometry (sphere)
  const geomParticle = new THREE.SphereGeometry(0.034, 10, 10);

  const meshDeoxy = new THREE.InstancedMesh(geomParticle, matDeoxy, TOTAL_DEOXY_CAPACITY);
  meshDeoxy.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  meshDeoxy.name = 'Deoxygenated Flow Particles';

  const meshOxy = new THREE.InstancedMesh(geomParticle, matOxy, TOTAL_OXY_CAPACITY);
  meshOxy.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  meshOxy.name = 'Oxygenated Flow Particles';

  group.add(meshDeoxy);
  group.add(meshOxy);

  // Allocate particles per stream according to weights
  function buildParticleAllocation(streamsList, capacity) {
    const totalWeight = streamsList.reduce((acc, s) => acc + s.weight, 0);
    const particles = [];
    let allocated = 0;

    streamsList.forEach((s, sIdx) => {
      const count = Math.max(4, Math.round((s.weight / totalWeight) * capacity));
      for (let i = 0; i < count && allocated < capacity; i++) {
        // Distribute initial phase uniformly along curve with slight jitter
        const t = (i / count + (Math.random() * 0.04)) % 1.0;
        particles.push({
          stream: s,
          streamIdx: sIdx,
          t,
          baseScale: 0.9 + Math.random() * 0.25
        });
        allocated++;
      }
    });

    // Fill any remainder
    while (allocated < capacity) {
      const s = streamsList[allocated % streamsList.length];
      particles.push({
        stream: s,
        streamIdx: allocated % streamsList.length,
        t: Math.random(),
        baseScale: 1.0
      });
      allocated++;
    }

    return particles;
  }

  const deoxyStreams = streams.filter(s => s.type === 'deoxygenated');
  const oxyStreams = streams.filter(s => s.type === 'oxygenated');

  const deoxyParticles = buildParticleAllocation(deoxyStreams, TOTAL_DEOXY_CAPACITY);
  const oxyParticles = buildParticleAllocation(oxyStreams, TOTAL_OXY_CAPACITY);

  const dummy = new THREE.Object3D();
  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();

  let visible = true;
  let lowPower = false;

  function updateInstances(mesh, particles, weights, dtMs, bpm, countLimit) {
    const count = lowPower ? Math.floor(countLimit / 2) : countLimit;
    mesh.count = count;
    const bpmScale = bpm / 72;
    const dtSec = dtMs / 1000;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const s = p.stream;

      // Calculate speed through stream's cardiac-cycle gating
      const gate = s.gating(weights);
      const effectiveSpeed = s.baseSpeed * gate * bpmScale;

      // Advance normalized position along curve
      if (dtMs > 0) {
        p.t = (p.t + (effectiveSpeed * dtSec * 1.8) / s.length) % 1.0;
        if (p.t < 0) p.t += 1.0;
      }

      // Sample curve position and tangent
      s.curve.getPointAt(p.t, point);
      s.curve.getTangentAt(p.t, tangent);

      dummy.position.copy(point);
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);

      // Taper particle size at spline extremities for smooth enter/exit
      const edgeFactor = Math.min(1.0, Math.sin(Math.PI * p.t) * 2.5);
      const sScale = p.baseScale * edgeFactor;
      // Slight pulse during fast flow
      const pulse = 1.0 + Math.min(0.3, gate * 0.1);
      dummy.scale.set(sScale * pulse, sScale * pulse * 1.3, sScale * pulse);

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }

  function tick(dt, cycleState) {
    if (!visible) return;
    const weights = computeChannelWeights(cycleState.phase);
    const bpm = cycleState.bpm || 72;

    updateInstances(meshDeoxy, deoxyParticles, weights, dt, bpm, TOTAL_DEOXY_CAPACITY);
    updateInstances(meshOxy, oxyParticles, weights, dt, bpm, TOTAL_OXY_CAPACITY);
  }

  function update(cycleState) {
    // Immediate positioning without time step (e.g. scrubber seek)
    tick(0, cycleState);
  }

  // Initial layout
  tick(0, { phase: 0, bpm: 72 });

  return {
    group,
    tick,
    update,
    setVisible(val) {
      visible = Boolean(val);
      group.visible = visible;
    },
    getVisible() {
      return visible;
    },
    setLowPower(val) {
      lowPower = Boolean(val);
      tick(0, { phase: 0, bpm: 72 });
    },
    getLowPower() {
      return lowPower;
    },
    dispose() {
      geomParticle.dispose();
      matDeoxy.dispose();
      matOxy.dispose();
      meshDeoxy.dispose();
      meshOxy.dispose();
    }
  };
}

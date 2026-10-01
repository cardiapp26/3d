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
import { computeChannelWeights } from './cycle-channels.js';

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
    weight: 0.6,
    particleScale: 0.6
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
    weight: 0.5,
    particleScale: 0.6
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
    weight: 0.6,
    particleScale: 0.6
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
    weight: 0.6,
    particleScale: 0.6
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
    weight: 0.5,
    particleScale: 0.6
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
    weight: 0.5,
    particleScale: 0.6
  }
];

/**
 * @param {{ routes?: Record<string, THREE.Vector3[]>, resolveRoutes?: () => Record<string, THREE.Vector3[]> }} options
 *   routes: measured control points keyed by stream id (see flow-routes.js);
 *   they replace the schematic points of the matching stream.
 *   resolveRoutes: the same, measured lazily the first time flow is shown.
 */
export function createBloodFlow(options = {}) {
  const { routes = {}, resolveRoutes = null } = options;
  let routesPending = typeof resolveRoutes === 'function';
  const group = new THREE.Group();
  group.name = 'Blood Flow Pathways';
  group.userData = { id: 'blood-flow', layer: 'flow', provenance: 'schematic' };

  const makeCurve = points => {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
    return { curve, length: curve.getLength() };
  };

  // Prepare curves
  const streams = FLOW_STREAMS.map(s => {
    const measured = routes[s.id];
    const vPoints = measured ? measured.map(p => p.clone()) : s.points.map(p => new THREE.Vector3(...p));
    return {
      ...s,
      ...makeCurve(vPoints),
      particleScale: s.particleScale ?? 1
    };
  });

  // Faint additive tube per stream: the continuous path the streamlets ride,
  // pulsing with the cardiac-cycle gate. Educational path cue, not flow volume.
  const tubeGroup = new THREE.Group();
  tubeGroup.name = 'Flow stream tubes';
  function buildTube(stream) {
    if (stream.tubeMesh) {
      tubeGroup.remove(stream.tubeMesh);
      stream.tubeMesh.geometry.dispose();
    }
    const material = stream.tubeMat || new THREE.MeshBasicMaterial({
      color: stream.type === 'deoxygenated' ? 0x3f9fe0 : 0xe8604f,
      transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending,
      depthWrite: false, toneMapped: false
    });
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(stream.curve, 60, 0.011, 6, false), material);
    mesh.name = `Flow stream tube: ${stream.id}`;
    mesh.raycast = () => {};
    mesh.renderOrder = 4;
    stream.tubeMat = material;
    stream.tubeMesh = mesh;
    tubeGroup.add(mesh);
  }
  streams.forEach(buildTube);
  group.add(tubeGroup);

  function applyRoutes(measured) {
    for (const stream of streams) {
      const points = measured[stream.id];
      if (points && points.length >= 4) {
        Object.assign(stream, makeCurve(points.map(p => p.clone())));
        buildTube(stream);
      }
    }
  }

  const TOTAL_DEOXY_CAPACITY = 240;
  const TOTAL_OXY_CAPACITY = 240;

  // 4D-flow-MRI-style rendering: velocity-color-coded pathline heads with
  // fading comet trails along their streamline. The jet color scale maps the
  // instantaneous particle speed (blue slow, red fast), like a 4D flow MRI
  // pathline rendering; a relative teaching scale, not measured velocity.
  const VELOCITY_NORM = 1.3;   // speed mapped to the top of the color scale
  const TRAIL = 10;            // samples per comet trail (head + fading tail)

  // Jet colormap, x in 0..1.
  const jet = (x, out) => {
    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    return out.setRGB(clamp01(1.5 - Math.abs(4 * x - 3)), clamp01(1.5 - Math.abs(4 * x - 2)), clamp01(1.5 - Math.abs(4 * x - 1)));
  };

  const headMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, opacity: 0.95 });
  const geomParticle = new THREE.SphereGeometry(0.02, 8, 8);

  const meshDeoxy = new THREE.InstancedMesh(geomParticle, headMaterial, TOTAL_DEOXY_CAPACITY);
  meshDeoxy.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  meshDeoxy.name = 'Deoxygenated Flow Particles';

  const meshOxy = new THREE.InstancedMesh(geomParticle, headMaterial, TOTAL_OXY_CAPACITY);
  meshOxy.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  meshOxy.name = 'Oxygenated Flow Particles';
  // Particles move every frame; a bounding sphere computed once would cull them wrongly.
  meshDeoxy.frustumCulled = false;
  meshOxy.frustumCulled = false;

  group.add(meshDeoxy);
  group.add(meshOxy);

  // Shared comet trails: every particle drags TRAIL-1 shrinking, velocity-
  // colored spheres back along its streamline, so the flow reads as liquid
  // threads from every angle (a pathline look, like 4D flow MRI renderings).
  const TRAIL_CAPACITY = TOTAL_DEOXY_CAPACITY + TOTAL_OXY_CAPACITY;
  const trailMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, toneMapped: false, depthWrite: false });
  const trailMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.016, 6, 6), trailMaterial, TRAIL_CAPACITY * (TRAIL - 1));
  trailMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  trailMesh.name = 'Flow pathline trails';
  trailMesh.frustumCulled = false;
  trailMesh.renderOrder = 5;
  trailMesh.raycast = () => {};
  group.add(trailMesh);

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
  const trailPoint = new THREE.Vector3();
  const headColor = new THREE.Color();

  let visible = true;
  let lowPower = false;
  // Optional point field (overlay-follow.js): particles ride the beating
  // heart. Each curve is sampled once; per frame the samples are displaced
  // and a particle takes the interpolated displacement at its parameter.
  const FIELD_SAMPLES = 48;
  let field = null;
  const fieldOffset = new THREE.Vector3();
  function streamOffset(s, t, out) {
    out.set(0, 0, 0);
    if (!field) return out;
    if (s.fieldCurve !== s.curve) {
      const pts = new Float32Array((FIELD_SAMPLES + 1) * 3);
      const sample = new THREE.Vector3();   // own scratch: `point` may hold the caller's head position
      for (let i = 0; i <= FIELD_SAMPLES; i++) { s.curve.getPointAt(i / FIELD_SAMPLES, sample); pts[i * 3] = sample.x; pts[i * 3 + 1] = sample.y; pts[i * 3 + 2] = sample.z; }
      s.fieldBinding = field.bind(pts);
      s.fieldDisp = new Float32Array(pts.length);
      s.fieldCurve = s.curve;
      s.fieldStamp = null;
    }
    if (!s.fieldBinding) return out;
    const stamp = field.stamp();
    if (s.fieldStamp !== stamp) { field.displace(s.fieldBinding, s.fieldDisp); s.fieldStamp = stamp; }
    const f = t * FIELD_SAMPLES, i = Math.min(FIELD_SAMPLES - 1, Math.floor(f)), u = f - i, d = s.fieldDisp;
    return out.set(d[i * 3] * (1 - u) + d[i * 3 + 3] * u, d[i * 3 + 1] * (1 - u) + d[i * 3 + 4] * u, d[i * 3 + 2] * (1 - u) + d[i * 3 + 5] * u);
  }

  function updateInstances(mesh, particles, weights, dtMs, bpm, countLimit, trailBase) {
    const count = lowPower ? Math.floor(countLimit / 2) : countLimit;
    mesh.count = count;
    const bpmScale = bpm / 72;
    const dtSec = dtMs / 1000;
    const trailSteps = lowPower ? Math.floor(TRAIL / 2) : TRAIL;

    for (let i = 0; i < countLimit; i++) {
      const segBase = (trailBase + i) * (TRAIL - 1);
      if (i >= count) {
        // Hide the unused trail spheres of low-power mode.
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        for (let k = 0; k < TRAIL - 1; k++) trailMesh.setMatrixAt(segBase + k, dummy.matrix);
        continue;
      }
      const p = particles[i];
      const s = p.stream;

      // Speed through the stream's cardiac-cycle gating; mapped to the jet scale.
      const gate = s.gating(weights);
      const effectiveSpeed = s.baseSpeed * gate * bpmScale;
      const norm = Math.max(0, Math.min(1, effectiveSpeed / VELOCITY_NORM));
      jet(norm, headColor);

      // Advance normalized position along curve
      if (dtMs > 0) {
        p.t = (p.t + (effectiveSpeed * dtSec * 1.8) / s.length) % 1.0;
        if (p.t < 0) p.t += 1.0;
      }

      // Head: a small velocity-colored sphere, tapered at the spline ends.
      s.curve.getPointAt(p.t, point);
      point.add(streamOffset(s, p.t, fieldOffset));
      const edgeFactor = Math.min(1.0, Math.sin(Math.PI * p.t) * 2.5);
      const sScale = Math.max(0.001, p.baseScale * edgeFactor * s.particleScale * (0.8 + norm * 0.5));
      dummy.position.copy(point);
      dummy.quaternion.identity();
      dummy.scale.setScalar(sScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, headColor);

      // Comet trail: shrinking spheres back along the curve. Faster particles
      // leave longer trails (the pathline feel of a 4D flow rendering).
      const trailLength = (0.07 + 0.34 * norm) * s.particleScale;
      const stepFraction = trailLength / (TRAIL - 1) / Math.max(0.01, s.length);
      for (let k = 1; k < TRAIL; k++) {
        const instanceIndex = segBase + (k - 1);
        if (k >= trailSteps) {
          dummy.scale.setScalar(0.0001);
          dummy.updateMatrix();
          trailMesh.setMatrixAt(instanceIndex, dummy.matrix);
          continue;
        }
        const tk = Math.max(0, p.t - k * stepFraction);
        s.curve.getPointAt(tk, trailPoint);
        trailPoint.add(streamOffset(s, tk, fieldOffset));
        const fade = Math.pow(1 - k / TRAIL, 1.3);
        dummy.position.copy(trailPoint);
        dummy.scale.setScalar(Math.max(0.001, sScale * (0.5 + norm * 0.6) * fade));
        dummy.updateMatrix();
        trailMesh.setMatrixAt(instanceIndex, dummy.matrix);
        trailMesh.setColorAt(instanceIndex, headColor);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  function tick(dt, cycleState) {
    if (!visible) return;
    const weights = computeChannelWeights(cycleState.phase);
    const bpm = cycleState.bpm || 72;

    updateInstances(meshDeoxy, deoxyParticles, weights, dt, bpm, TOTAL_DEOXY_CAPACITY, 0);
    updateInstances(meshOxy, oxyParticles, weights, dt, bpm, TOTAL_OXY_CAPACITY, TOTAL_DEOXY_CAPACITY);
    trailMesh.instanceMatrix.needsUpdate = true;
    if (trailMesh.instanceColor) trailMesh.instanceColor.needsUpdate = true;
    for (const s of streams) {
      if (!s.tubeMat) continue;
      const gate = s.gating(weights);
      s.tubeMat.opacity = Math.min(0.26, 0.05 + gate * 0.07) * (lowPower ? 0.6 : 1);
    }
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
      if (visible && routesPending) {
        routesPending = false;
        applyRoutes(resolveRoutes());
        tick(0, { phase: 0, bpm: 72 });
      }
    },
    getVisible() {
      return visible;
    },
    /** Attach a point field ({ bind, displace, stamp }) so particles follow the beat. */
    setField(value) {
      field = value || null;
      for (const stream of streams) stream.fieldCurve = null;
    },
    setLowPower(val) {
      lowPower = Boolean(val);
      tick(0, { phase: 0, bpm: 72 });
    },
    getLowPower() {
      return lowPower;
    },
    dispose() {
      for (const s of streams) {
        if (s.tubeMesh) s.tubeMesh.geometry.dispose();
        if (s.tubeMat) s.tubeMat.dispose();
      }
      geomParticle.dispose();
      headMaterial.dispose();
      trailMesh.geometry.dispose();
      trailMaterial.dispose();
      trailMesh.dispose();
      meshDeoxy.dispose();
      meshOxy.dispose();
    }
  };
}

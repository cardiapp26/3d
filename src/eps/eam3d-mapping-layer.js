/*
 * Mapping layer of the 3D EAM map: the roving high-density catheter (PentaRay or HD Grid),
 * the points it acquires beat by beat, and the per-vertex map that fills in around them.
 * Acquisition rules live in eam3d-mapping-model.js; this file adds the geometry.
 */
import * as THREE from 'three';
import {
  MAPPING_CATHETERS,
  MAPPING_SETTINGS,
  MM_PER_UNIT,
  acquireBeat,
  createRng,
  summarizeSession
} from './eam3d-mapping-model.js';

const STOPS_PER_PASS = 46;
const MIN_PASSES = 2;
const MAX_PASSES = 4;
// Wall mapped below this bipolar voltage is revisited for a denser map.
const REVISIT_BELOW_MV = 1.5;
const TARGET_COVERAGE_PCT = 96;
const MIN_BEAT_MS = 280;
// Part of each beat the catheter spends travelling to the next site; it rests for the remainder.
const TRAVEL_FRACTION = 0.55;
const MAX_POINTS = 9000;
const ELECTRODE_RADIUS = 0.017;
// Soft splines do not always lie flat: some float a few millimetres off the wall.
const SPLINE_LIFT_MM = 1.6;
// Share of the gap between the flat catheter and a curved wall that remains after the splines bend.
const CONFORM_RESIDUAL = 0.25;

function nearestVertexIndex(positions, x, y, z) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < positions.count; i++) {
    const dx = positions.getX(i) - x;
    const dy = positions.getY(i) - y;
    const dz = positions.getZ(i) - z;
    const d = dx * dx + dy * dy + dz * dz;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return { index: best, dist: Math.sqrt(bestD) };
}

/**
 * Evenly spread wall sites (farthest-point sampling), ordered as a short tour.
 * `candidates` limits the sites to some vertices (the wall still to do); default is the whole wall.
 */
function planStops(positions, count, rng, candidates = null) {
  const pool = candidates && candidates.length ? candidates : Array.from({ length: positions.count }, (_, i) => i);
  const wanted = Math.min(count, pool.length);
  const chosen = [pool[Math.floor(rng() * pool.length)]];
  const minDist = new Float32Array(pool.length).fill(Infinity);
  for (let k = 1; k < wanted; k++) {
    const last = chosen[chosen.length - 1];
    const lx = positions.getX(last);
    const ly = positions.getY(last);
    const lz = positions.getZ(last);
    let far = pool[0];
    let farD = -1;
    for (let j = 0; j < pool.length; j++) {
      const i = pool[j];
      const dx = positions.getX(i) - lx;
      const dy = positions.getY(i) - ly;
      const dz = positions.getZ(i) - lz;
      const d = dx * dx + dy * dy + dz * dz;
      if (d < minDist[j]) minDist[j] = d;
      if (minDist[j] > farD) {
        farD = minDist[j];
        far = i;
      }
    }
    chosen.push(far);
  }
  const points = chosen.map((i) => new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i)));
  // Greedy nearest-neighbour tour: the operator sweeps the wall instead of jumping across it.
  const tour = [points.shift()];
  while (points.length) {
    const from = tour[tour.length - 1];
    let bestI = 0;
    let bestD = Infinity;
    points.forEach((p, i) => {
      const d = p.distanceToSquared(from);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    });
    tour.push(points.splice(bestI, 1)[0]);
  }
  return tour;
}

/**
 * @param {{ onProgress: (progress: object) => void }} options
 */
export function createMappingLayer({ onProgress = () => {} } = {}) {
  const group = new THREE.Group();
  const catheterGroup = new THREE.Group();
  group.add(catheterGroup);

  const pointGeometry = new THREE.BufferGeometry();
  const pointPositions = new Float32Array(MAX_POINTS * 3);
  pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
  pointGeometry.setDrawRange(0, 0);
  const pointCloud = new THREE.Points(
    pointGeometry,
    new THREE.PointsMaterial({ color: '#f8fafc', size: 0.022, depthTest: false, transparent: true, opacity: 0.9 })
  );
  pointCloud.renderOrder = 11;
  pointCloud.frustumCulled = false;
  group.add(pointCloud);

  let meshes = new Map();
  let catheter = MAPPING_CATHETERS.pentaray;
  let chamberId = 'ra';
  let running = false;
  let electrodeMeshes = [];
  let splineLines = [];
  let session = null;
  let parkedAt = null;

  const disposeGroup = (g) => {
    g.traverse((o) => {
      o.geometry?.dispose();
      for (const m of [o.material].flat().filter(Boolean)) m.dispose();
    });
    g.clear();
  };

  function buildCatheter() {
    disposeGroup(catheterGroup);
    electrodeMeshes = catheter.electrodes.map(() => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(ELECTRODE_RADIUS, 10, 10),
        new THREE.MeshStandardMaterial({ color: '#f8fafc', emissive: catheter.color, emissiveIntensity: 0.7, depthTest: false })
      );
      m.renderOrder = 9;
      catheterGroup.add(m);
      return m;
    });
    // PentaRay splines leave a central hub; the grid's splines run side by side.
    const radial = catheter.id === 'pentaray';
    splineLines = Array.from({ length: catheter.splines }, () => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array((radial ? 5 : 4) * 3), 3));
      const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: catheter.color, depthTest: false }));
      line.renderOrder = 8;
      line.frustumCulled = false;
      catheterGroup.add(line);
      return line;
    });
  }

  /** Electrode positions with the catheter flat on the wall at `site`, turned by `angle`. */
  function layout(site, angle, mesh) {
    const centre = mesh.userData.centre;
    const n = site.clone().sub(centre).normalize();
    const helper = Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const u = new THREE.Vector3().crossVectors(helper, n).normalize();
    const v = new THREE.Vector3().crossVectors(n, u).normalize();
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return catheter.electrodes.map((e) => {
      const x = (e.x * cos - e.y * sin) / MM_PER_UNIT;
      const y = (e.x * sin + e.y * cos) / MM_PER_UNIT;
      return site.clone().addScaledVector(u, x).addScaledVector(v, y);
    });
  }

  function drawCatheter(points, hub) {
    points.forEach((p, i) => electrodeMeshes[i].position.copy(p));
    const radial = catheter.id === 'pentaray';
    splineLines.forEach((line, s) => {
      const attr = line.geometry.attributes.position;
      const own = points.slice(s * 4, s * 4 + 4);
      const path = radial ? [hub, ...own] : own;
      path.forEach((p, i) => attr.setXYZ(i, p.x, p.y, p.z));
      attr.needsUpdate = true;
    });
    catheterGroup.visible = true;
  }

  function newSession() {
    const mesh = meshes.get(chamberId);
    if (!mesh) return null;
    const count = mesh.geometry.attributes.position.count;
    const rng = createRng(chamberId.charCodeAt(0) * 31 + catheter.electrodes.length);
    return {
      mesh,
      rng,
      stops: planStops(mesh.geometry.attributes.position, STOPS_PER_PASS, rng),
      stopIndex: 0,
      pass: 0,
      angle: rng() * Math.PI * 2,
      nextBeatAt: null,
      lastBeatAt: 0,
      startedAt: null,
      beats: 0,
      points: [],
      mappedLat: new Float32Array(count).fill(NaN),
      mappedVolt: new Float32Array(count).fill(NaN),
      bestDist: new Float32Array(count).fill(Infinity),
      mappedVertices: 0,
      latMin: Infinity,
      latMax: -Infinity,
      prevSite: null,
      version: 0,
      done: false
    };
  }

  function paintAround(point) {
    const positions = session.mesh.geometry.attributes.position;
    const r = MAPPING_SETTINGS.fillThresholdMm / MM_PER_UNIT;
    const r2 = r * r;
    for (let i = 0; i < positions.count; i++) {
      const dx = positions.getX(i) - point.pos[0];
      if (dx > r || dx < -r) continue;
      const dy = positions.getY(i) - point.pos[1];
      const dz = positions.getZ(i) - point.pos[2];
      const d = dx * dx + dy * dy + dz * dz;
      if (d > r2 || d >= session.bestDist[i]) continue;
      if (session.bestDist[i] === Infinity) session.mappedVertices++;
      session.bestDist[i] = d;
      session.mappedVolt[i] = point.bipolar;
      // A voltage-only point (scar, unstable cycle) keeps any LAT a neighbour gave this vertex.
      if (point.lat !== null) session.mappedLat[i] = point.lat;
    }
  }

  /**
   * After the first survey the operator goes back to what matters: wall not yet coloured and
   * abnormal voltage, where a denser map is needed to outline scar and its channels.
   */
  function wallStillToDo() {
    const todo = [];
    for (let i = 0; i < session.bestDist.length; i++) {
      if (session.bestDist[i] === Infinity || session.mappedVolt[i] < REVISIT_BELOW_MV) todo.push(i);
    }
    return todo;
  }

  function takeBeat(ctx) {
    const mesh = session.mesh;
    const positions = mesh.geometry.attributes.position;
    const site = session.stops[session.stopIndex];
    const planar = layout(site, session.angle, mesh);
    const lifts = Array.from({ length: catheter.splines }, () => Math.max(0, SPLINE_LIFT_MM * (session.rng() * 4 - 1.4)));
    const electrodes = planar.map((p, i) => {
      const hit = nearestVertexIndex(positions, p.x, p.y, p.z);
      const wall = new THREE.Vector3(positions.getX(hit.index), positions.getY(hit.index), positions.getZ(hit.index));
      // Soft splines bend to the wall, so curvature costs little contact; a floating spline costs a lot.
      const wallMm = hit.dist * MM_PER_UNIT * CONFORM_RESIDUAL + lifts[Math.floor(i / 4)];
      return { pos: [wall.x, wall.y, wall.z], wallMm, shown: wall };
    });
    drawCatheter(electrodes.map((e) => e.shown), site);

    const points = acquireBeat({
      electrodes,
      bipoles: catheter.bipoles,
      truthAt: (pos) => ctx.truthAt(pos, chamberId),
      rhythm: ctx.rhythm,
      rng: session.rng
    });
    for (const point of points) {
      session.points.push(point);
      if (!point.accepted) continue;
      paintAround(point);
      if (point.lat !== null) {
        session.latMin = Math.min(session.latMin, point.lat);
        session.latMax = Math.max(session.latMax, point.lat);
      }
      const n = Math.min(MAX_POINTS - 1, pointGeometry.drawRange.count);
      pointPositions.set(point.pos, n * 3);
      pointGeometry.setDrawRange(0, n + 1);
    }
    pointGeometry.attributes.position.needsUpdate = true;
    session.beats++;
    session.version++;

    // Next site; after a full pass go round again with the catheter turned.
    session.prevSite = site;
    session.stopIndex++;
    if (session.stopIndex >= session.stops.length) {
      session.stopIndex = 0;
      session.pass++;
      session.stops = planStops(positions, STOPS_PER_PASS, session.rng, wallStillToDo());
    }
    session.angle = session.rng() * Math.PI * 2;
    const coverage = (session.mappedVertices / positions.count) * 100;
    // Finish after the full survey plus at least one pass back over gaps and abnormal wall.
    if ((coverage >= TARGET_COVERAGE_PCT && session.pass >= MIN_PASSES) || session.pass >= MAX_PASSES) {
      session.done = true;
      running = false;
    }
  }

  function report(clockMs) {
    if (!session) {
      onProgress({ active: false, running: false, done: false, stats: null, site: null, chamber: chamberId });
      return;
    }
    onProgress({
      active: true,
      running,
      done: session.done,
      chamber: chamberId,
      site: session.stops[session.stopIndex].toArray().map((v) => Number(v.toFixed(3))),
      stats: summarizeSession({
        points: session.points,
        mappedVertices: session.mappedVertices,
        totalVertices: session.mesh.geometry.attributes.position.count,
        beats: session.beats,
        elapsedMs: session.startedAt === null ? 0 : clockMs - session.startedAt
      })
    });
  }

  return {
    group,
    setAnatomy(chamberMeshes) {
      meshes = new Map(chamberMeshes.map((m) => [m.userData.id, m]));
      buildCatheter();
      if (parkedAt) this.park(parkedAt);
    },
    /** Choose the catheter and the chamber to map; a change discards the current map. */
    configure({ catheterId, chamber }) {
      const nextCatheter = MAPPING_CATHETERS[catheterId] || catheter;
      const changed = nextCatheter !== catheter || chamber !== chamberId;
      if (!changed) return;
      catheter = nextCatheter;
      chamberId = chamber;
      buildCatheter();
      this.reset();
      if (parkedAt) this.park(parkedAt);
    },
    setRunning(flag, clockMs = 0) {
      if (flag && (!session || session.done)) {
        this.reset();
        session = newSession();
      }
      running = Boolean(flag) && Boolean(session);
      if (session && running) session.nextBeatAt = null;
      report(clockMs);
    },
    reset() {
      session = null;
      running = false;
      pointGeometry.setDrawRange(0, 0);
      report(0);
    },
    /** Rest the catheter at a wall site while no mapping run moves it. */
    park(site) {
      parkedAt = site;
      const mesh = meshes.get(site.chamber);
      if (!mesh || running || !electrodeMeshes.length) return;
      const at = new THREE.Vector3(...site.pos);
      drawCatheter(layout(at, 0, mesh), at);
    },
    /**
     * Advance the run to `clockMs` (simulation time).
     * @param {{ truthAt: Function, rhythm: { tcl: number, reentrant: boolean, stableCycle: boolean, refLat: number } }} ctx
     * @returns {boolean} true when the map changed
     */
    step(clockMs, ctx) {
      if (!running || !session) return false;
      const beatMs = Math.max(MIN_BEAT_MS, ctx.rhythm.tcl);
      if (session.startedAt === null) session.startedAt = clockMs;
      if (session.nextBeatAt === null) {
        session.nextBeatAt = clockMs + beatMs;
        session.lastBeatAt = clockMs;
      }
      if (clockMs >= session.nextBeatAt) {
        takeBeat(ctx);
        session.lastBeatAt = clockMs;
        session.nextBeatAt = clockMs + beatMs;
        report(clockMs);
        return true;
      }
      // Glide toward the next site, then rest there until the beat is taken.
      const travel = (clockMs - session.lastBeatAt) / (beatMs * TRAVEL_FRACTION);
      if (session.prevSite && travel < 1) {
        const at = session.prevSite.clone().lerp(session.stops[session.stopIndex], travel);
        drawCatheter(layout(at, session.angle, session.mesh), at);
        return true;
      }
      return false;
    },
    /** Acquired map of a chamber for the painter, or null when that chamber has none. */
    mapFor(id) {
      if (!session || id !== chamberId || session.beats === 0) return null;
      return {
        lat: session.mappedLat,
        volt: session.mappedVolt,
        latMin: Number.isFinite(session.latMin) ? session.latMin : 0,
        latMax: Number.isFinite(session.latMax) ? session.latMax : 1,
        version: session.version
      };
    },
    hasMap: () => Boolean(session && session.beats > 0),
    chamber: () => chamberId,
    system: () => catheter.system,
    isRunning: () => running,
    dispose() {
      disposeGroup(catheterGroup);
      pointGeometry.dispose();
      pointCloud.material.dispose();
    }
  };
}

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { fromFrame, toFrame } from './mesh-utils.js';

// The atlas has no anterior mitral or anterior tricuspid leaflet node.
// These leaflets close that gap on the measured annular arc the existing
// leaflets do not occupy. Each one hangs from that arc into the ventricle,
// stops where it meets the measured atlas leaflets (coaptation) and is
// tethered by chordae to the nearest measured papillary tips. They are
// schematic, not registered anatomy.
//
// All lengths below are fractions of the measured annulus radius.
const HINGE_DEPTH = 0.25;   // atlas samples this shallow occupy the annular hinge
const HINGE_REACH = 0.2;    // in-plane distance at which a hinge sample covers a rim point
const BODY_DEPTH = 0.8;     // deeper atlas samples are chordae, not leaflet body
const CONTACT = 0.07;       // in-plane gap that counts as touching an atlas leaflet
const OVERLAP = 0.1;        // the free edge runs this far past first contact (coaptation zone)
const BEYOND_AXIS = 0.6;    // rays may cross the axis this far to reach the opposing leaflet
const AXIS_REACH = 0.45;    // atlas body samples this close to the axis mark coaptation depth
const BELLY = 0.12;         // closed leaflet billows toward the atrium by this fraction of its length
const MARCH_STEPS = 40;
const ARC_POINTS = 32;
const ROWS = 10;
const CHORDS = 5;
const CHORD_RADIUS = 0.018;

const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

/**
 * Longest run of rim points no shallow atlas leaflet sample covers.
 * Returns [] when the gap is implausibly small or large for one leaflet.
 */
export function uncoveredArc(rim, samples, frame) {
  const count = rim.length;
  if (count < 8 || !samples.length) return [];
  const reach = HINGE_REACH * frame.radius;
  const hinge = samples.filter(s => s.d < HINGE_DEPTH * frame.radius);
  const covered = rim.map(point => {
    const p = toFrame(frame, point);
    return hinge.some(s => Math.hypot(s.x - p.x, s.y - p.y) < reach);
  });
  let bestStart = 0;
  let bestLength = 0;
  let run = 0;
  for (let i = 0; i < count * 2; i++) {
    if (covered[i % count]) {
      run = 0;
      continue;
    }
    run += 1;
    if (run <= count && run > bestLength) {
      bestLength = run;
      bestStart = (i - run + 1 + count) % count;
    }
  }
  if (bestLength < count * 0.15 || bestLength > count * 0.7) return [];
  return Array.from({ length: bestLength }, (_, index) => rim[(bestStart + index) % count]);
}

function resample(points, count) {
  if (points.length < 2) return points.map(point => point.clone());
  const curve = new THREE.CatmullRomCurve3(points, false);
  return curve.getSpacedPoints(count - 1);
}

/** Depth at which the atlas leaflets meet near the orifice axis. */
export function coaptationDepth(samples, frame) {
  const near = samples
    .filter(s => s.d > 0 && s.d < BODY_DEPTH * frame.radius && Math.hypot(s.x, s.y) < AXIS_REACH * frame.radius)
    .map(s => s.d);
  return near.length >= 8 ? median(near) : 0.35 * frame.radius;
}

/**
 * Free edge for each hinge point: march parallel to the line from this
 * leaflet's hinge through the orifice axis, stop where an atlas leaflet body
 * is reached, then run a little further into the coaptation zone. Parallel
 * rays keep the sheet from folding over itself at the axis. Without contact
 * the edge closes on the line through the axis, at the coaptation depth.
 */
export function freeEdge(arc, samples, frame) {
  const body = samples.filter(s => s.d < BODY_DEPTH * frame.radius);
  const contact = CONTACT * frame.radius;
  const closeDepth = coaptationDepth(samples, frame);
  const hinges = arc.map(point => toFrame(frame, point));
  const mx = hinges.reduce((sum, h) => sum + h.x, 0) / hinges.length;
  const my = hinges.reduce((sum, h) => sum + h.y, 0) / hinges.length;
  const m = Math.hypot(mx, my);
  if (m < 1e-6) return arc.map(() => fromFrame(frame, 0, 0, closeDepth));
  const dx = -mx / m;
  const dy = -my / m;
  const edge = hinges.map(h => {
    const toAxis = -(h.x * dx + h.y * dy);
    const travel = Math.max(0, toAxis) + BEYOND_AXIS * frame.radius;
    for (let k = 1; k <= MARCH_STEPS; k++) {
      const step = travel * k / MARCH_STEPS;
      const x = h.x + dx * step;
      const y = h.y + dy * step;
      const touching = body.filter(s => Math.hypot(s.x - x, s.y - y) < contact);
      if (touching.length) {
        const d = THREE.MathUtils.clamp(median(touching.map(s => s.d)), 0.3 * closeDepth, 1.5 * closeDepth);
        const past = Math.min(OVERLAP * frame.radius, travel - step);
        return { x: x + dx * past, y: y + dy * past, d };
      }
    }
    const reach = Math.max(0, toAxis);
    return { x: h.x + dx * reach, y: h.y + dy * reach, d: closeDepth };
  });
  // Light smoothing along the edge; commissural ends stay where they are.
  let smooth = edge;
  for (let pass = 0; pass < 2; pass++) {
    smooth = smooth.map((p, i) => {
      if (i === 0 || i === smooth.length - 1) return p;
      const a = smooth[i - 1];
      const b = smooth[i + 1];
      return { x: (a.x + 2 * p.x + b.x) / 4, y: (a.y + 2 * p.y + b.y) / 4, d: (a.d + 2 * p.d + b.d) / 4 };
    });
  }
  return smooth.map(p => fromFrame(frame, p.x, p.y, p.d));
}

/** Leaflet sheet lofted from the annular hinge to the free edge. */
export function leafletGeometry(arc, edge, frame) {
  const positions = [];
  for (let row = 0; row <= ROWS; row++) {
    const t = row / ROWS;
    for (let i = 0; i < arc.length; i++) {
      const point = arc[i].clone().lerp(edge[i], t);
      const belly = BELLY * arc[i].distanceTo(edge[i]) * Math.sin(Math.PI * t);
      point.addScaledVector(frame.normal, -belly);
      positions.push(point.x, point.y, point.z);
    }
  }
  const indices = [];
  const cols = arc.length;
  for (let row = 0; row < ROWS; row++) {
    for (let i = 0; i < cols - 1; i++) {
      const a = row * cols + i;
      const b = a + cols;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Papillary heads: the shallowest quarter of each papillary muscle mesh,
 * with the in-plane centroid of that head in annulus coordinates.
 */
function papillaryHeads(meshes, frame) {
  const heads = [];
  for (const mesh of meshes) {
    const points = worldSamples([mesh], 400);
    if (!points.length) continue;
    const local = points.map(point => toFrame(frame, point));
    const min = Math.min(...local.map(p => p.d));
    const max = Math.max(...local.map(p => p.d));
    const cut = min + 0.25 * (max - min);
    const tips = points.filter((_, i) => local[i].d <= cut);
    const tipLocal = local.filter(p => p.d <= cut);
    heads.push({
      tips,
      x: tipLocal.reduce((sum, p) => sum + p.x, 0) / tipLocal.length,
      y: tipLocal.reduce((sum, p) => sum + p.y, 0) / tipLocal.length
    });
  }
  return heads;
}

/**
 * Marginal chordae from the free edge. Each chord goes to the papillary head
 * lying nearest its hinge point in the annular plane, so each half of the
 * leaflet is tethered by the papillary muscle under its own commissure.
 */
export function chordGeometries(arc, edge, heads, frame) {
  if (!heads.length || edge.length < 3) return [];
  const out = [];
  for (let c = 0; c < CHORDS; c++) {
    const index = Math.round((c + 1) / (CHORDS + 1) * (edge.length - 1));
    const origin = edge[index];
    const hinge = toFrame(frame, arc[index]);
    const head = heads.reduce((best, h) =>
      Math.hypot(h.x - hinge.x, h.y - hinge.y) < Math.hypot(best.x - hinge.x, best.y - hinge.y) ? h : best);
    const tip = head.tips.reduce((best, point) =>
      point.distanceToSquared(origin) < best.distanceToSquared(origin) ? point : best);
    if (tip.distanceTo(origin) > 4 * frame.radius) continue;
    const curve = new THREE.LineCurve3(origin.clone(), tip.clone());
    const tube = new THREE.TubeGeometry(curve, 6, CHORD_RADIUS, 5, false);
    tube.deleteAttribute('uv');
    out.push(tube);
  }
  return out;
}

function worldSamples(meshes, target = 800) {
  const samples = [];
  for (const mesh of meshes) {
    const position = mesh.geometry?.attributes?.position;
    if (!position) continue;
    mesh.updateWorldMatrix(true, false);
    const stride = Math.max(1, Math.floor(position.count / target));
    for (let i = 0; i < position.count; i += stride) {
      samples.push(new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld));
    }
  }
  return samples;
}

function addLeaflet({ ring, leafletMeshes, papillaryMeshes, id, name, sourceName, register, parent }) {
  const { rim, frame } = ring;
  const samples = worldSamples(leafletMeshes).map(point => toFrame(frame, point));
  const gap = uncoveredArc(rim, samples, frame);
  if (gap.length < 4) return null;
  const arc = resample(gap, ARC_POINTS);
  const edge = freeEdge(arc, samples, frame);
  const sheet = leafletGeometry(arc, edge, frame);
  const chords = chordGeometries(arc, edge, papillaryHeads(papillaryMeshes, frame), frame);
  const geometry = chords.length ? mergeGeometries([sheet, ...chords]) : sheet;
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    color: 0xf4efe4,
    roughness: 0.65,
    metalness: 0,
    side: THREE.DoubleSide
  }));
  mesh.name = name;
  mesh.userData = {
    id,
    leaflet: 'anterior',
    layer: 'valves',
    provenance: 'schematic',
    sourceName
  };
  parent.add(mesh);
  register(mesh, id);
  return mesh;
}

export function addSchematicAvLeaflets({ getMeshes, register, parent }) {
  const valves = [
    {
      id: 'mitral',
      annulus: 'mitral-annulus',
      papillary: 'lv-papillary',
      name: 'Anterior mitral leaflet (schematic)',
      sourceName: 'Schematic anterior mitral leaflet on the uncovered measured annular arc, closing against the atlas posterior leaflet. The atlas has no anterior leaflet node.'
    },
    {
      id: 'tricuspid',
      annulus: 'tricuspid-annulus',
      papillary: 'rv-papillary',
      name: 'Anterior tricuspid leaflet (schematic)',
      sourceName: 'Schematic anterior tricuspid leaflet on the uncovered measured annular arc, closing against the atlas septal and inferior leaflets. The atlas has septal and inferior leaflets only.'
    }
  ];
  const created = [];
  for (const valve of valves) {
    const ring = getMeshes(valve.annulus)[0]?.userData;
    if (!ring?.rim || !ring.frame) continue;
    const leafletMeshes = getMeshes(valve.id).filter(mesh => mesh.userData.provenance !== 'schematic');
    if (!leafletMeshes.length) continue;
    const mesh = addLeaflet({
      ring,
      leafletMeshes,
      papillaryMeshes: getMeshes(valve.papillary),
      id: valve.id,
      name: valve.name,
      sourceName: valve.sourceName,
      register,
      parent
    });
    if (mesh) created.push(mesh);
  }
  return created;
}

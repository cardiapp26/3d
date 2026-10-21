import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { tubeComponents } from './coronary-branches.js';

/*
 * Schematic posterior descending artery (PDA). The atlas RCA ends past the
 * crux in its posterolateral branch (rpl) and has no branch in the inferior
 * interventricular groove, so the PDA is drawn here: it leaves the RCA trunk
 * at the crux and runs with the middle cardiac vein toward the apex (right
 * dominant pattern), on the epicardium beside the vein, ending about three
 * quarters of the way to the apex. Two short twigs reach the inferior walls.
 * Teaching geometry, not segmented anatomy (provenance 'schematic'); it is
 * registered as a right-system coronary so it beats, fills and hides with
 * the RCA. Geometry: the atlas's baked frame (heart-local coordinates).
 */
const PDA_REACH = 0.75;        // fraction of the groove (crux to apex) the PDA covers
const PDA_SIDE_OFFSET = 0.07;  // beside the middle cardiac vein, toward the RV
const PDA_RADIUS = [0.021, 0.009];
const TWIG_RADIUS = [0.009, 0.005];
const SAMPLE_STEP = 0.12;
const RADIAL = 12;

const smooth = x => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };

/**
 * Tube along `curve` whose radius follows `radiusAt(u)` (u: 0..1 along the
 * curve). A TubeGeometry with its rings rescaled about the curve, so ring
 * layout and parameters stay those of a three.js tube.
 */
export function taperedTube(curve, segments, radiusAt, radial = RADIAL) {
  const base = 1;
  const geometry = new THREE.TubeGeometry(curve, segments, base, radial, false);
  const pos = geometry.attributes.position, size = radial + 1;
  for (let i = 0; i <= segments; i++) {
    const c = curve.getPointAt(i / segments), r = radiusAt(i / segments) / base;
    for (let k = 0; k < size; k++) {
      const j = i * size + k;
      pos.setXYZ(j, c.x + (pos.getX(j) - c.x) * r, c.y + (pos.getY(j) - c.y) * r, c.z + (pos.getZ(j) - c.z) * r);
    }
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Centreline rings of the longest tube of a mesh. */
function longestRings(mesh) {
  const comps = mesh ? tubeComponents(mesh.geometry) : [];
  return comps.length ? comps.reduce((a, b) => (b.length > a.length ? b : a)).rings : [];
}

/** Epicardial point nearest `p` with its outward normal (vertex positions of the ventricles). */
function surfaceNear(surface, p, centre) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < surface.length; i++) { const d = surface[i].distanceToSquared(p); if (d < bestD) { bestD = d; best = i; } }
  const s = surface[best];
  return { point: s.clone(), normal: s.clone().sub(centre).normalize() };
}

/** Points of `rings` from index `from` onward, resampled every `step`, up to `reach` of the remaining length. */
function resample(rings, from, reach, step) {
  const path = rings.slice(from);
  let total = 0;
  for (let i = 1; i < path.length; i++) total += path[i].distanceTo(path[i - 1]);
  const out = [path[0].clone()];
  let walked = 0, next = step;
  for (let i = 1; i < path.length && walked < total * reach; i++) {
    const seg = path[i].distanceTo(path[i - 1]);
    while (next <= walked + seg && next <= total * reach) { out.push(path[i - 1].clone().lerp(path[i], (next - walked) / seg)); next += step; }
    walked += seg;
  }
  return out;
}

/**
 * Build the schematic PDA from the atlas meshes. Returns the mesh (not yet
 * registered) or null when the RCA or the middle cardiac vein is missing.
 * userData.centerline holds the main trunk centreline (crux to tip) and
 * userData.radius its radius profile [origin, tip].
 */
export function buildSchematicPda(getMeshes) {
  const rcaRings = longestRings(getMeshes('rca')[0]);
  const mcvRings = longestRings(getMeshes('mcv')[0]);
  const ventricles = [...getMeshes('lv'), ...getMeshes('rv')];
  if (rcaRings.length < 4 || mcvRings.length < 4 || !ventricles.length) return null;
  const surface = [];
  for (const m of ventricles) { const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i += 2) surface.push(new THREE.Vector3().fromBufferAttribute(p, i)); }
  const centre = surface.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / surface.length);
  const box = m => { m.geometry.computeBoundingBox(); return m.geometry.boundingBox.getCenter(new THREE.Vector3()); };
  const towardRv = getMeshes('rv')[0] && getMeshes('lv')[0] ? box(getMeshes('rv')[0]).sub(box(getMeshes('lv')[0])).normalize() : new THREE.Vector3(-1, 0, 0);

  // Crux: the RCA trunk ring closest to the vein's groove course.
  let crux = { r: 0, m: 0, d: Infinity };
  rcaRings.forEach((p, r) => mcvRings.forEach((q, m) => { const d = p.distanceTo(q); if (d < crux.d) crux = { r, m, d }; }));
  const cruxPoint = rcaRings[crux.r].clone();
  // The vein from the crux toward the apex (the far end of the groove).
  const groove = crux.m > mcvRings.length / 2 ? mcvRings.slice(0, crux.m + 1).reverse() : mcvRings.slice(crux.m);
  const samples = resample(groove, 0, PDA_REACH, SAMPLE_STEP);

  // Beside the vein on the epicardium, toward the RV side of the groove.
  const course = samples.map((p, i) => {
    const t = samples[Math.min(samples.length - 1, i + 1)].clone().sub(samples[Math.max(0, i - 1)]).normalize();
    const side = towardRv.clone().addScaledVector(t, -towardRv.dot(t)).normalize();
    const { point, normal } = surfaceNear(surface, p.clone().addScaledVector(side, PDA_SIDE_OFFSET), centre);
    return point.addScaledVector(normal, PDA_RADIUS[0] * 0.8);
  });
  // Leave the RCA at the crux centreline, then join the groove course.
  const path = [cruxPoint, cruxPoint.clone().lerp(course[1] || course[0], 0.5), ...course.slice(1)];
  const curve = new THREE.CatmullRomCurve3(path, false, 'centripetal');
  const radiusAt = u => THREE.MathUtils.lerp(PDA_RADIUS[0], PDA_RADIUS[1], smooth(u * 1.05));
  const parts = [taperedTube(curve, Math.max(48, path.length * 10), radiusAt)];

  // Two twigs to the inferior walls (LV side, then RV side).
  [[0.35, -1], [0.62, 1]].forEach(([u, sign]) => {
    const from = curve.getPointAt(u), t = curve.getTangentAt(u);
    const side = towardRv.clone().addScaledVector(t, -towardRv.dot(t)).normalize().multiplyScalar(sign);
    const mid = surfaceNear(surface, from.clone().addScaledVector(side, 0.18).addScaledVector(t, 0.12), centre);
    const tip = surfaceNear(surface, from.clone().addScaledVector(side, 0.36).addScaledVector(t, 0.3), centre);
    const twig = new THREE.CatmullRomCurve3([from, mid.point.addScaledVector(mid.normal, 0.012), tip.point.addScaledVector(tip.normal, 0.008)], false, 'centripetal');
    parts.push(taperedTube(twig, 16, w => THREE.MathUtils.lerp(TWIG_RADIUS[0], TWIG_RADIUS[1], w), 8));
  });

  const geometry = mergeGeometries(parts.map(g => g.toNonIndexed()), false);
  parts.forEach(g => g.dispose());
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xe3a66c, roughness: 0.65, metalness: 0, side: THREE.DoubleSide }));
  mesh.name = 'Posterior descending artery (schematic)';
  mesh.userData = {
    id: 'pda', layer: 'coronaries', system: 'right', provenance: 'schematic', nativeCoronary: true,
    centerline: curve.getSpacedPoints(64), radius: PDA_RADIUS.slice()
  };
  return mesh;
}

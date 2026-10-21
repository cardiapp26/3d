import * as THREE from 'three';

/*
 * Supra-aortic branches of the aortic arch: brachiocephalic trunk (dividing
 * into the right subclavian and right common carotid arteries), left common
 * carotid and left subclavian arteries. The atlas ships the arch without its
 * branches, so these are schematic teaching geometry seated on the measured
 * arch, not segmented anatomy. Order along the superior (convex) surface,
 * from right/anterior to left/posterior: BCT, LCCA, LSCA (Gray's Anatomy,
 * 42nd ed.; normal branching in about 70-80% of people).
 *
 * Frame: atlas coordinates after the shared normalisation of heart.js and
 * davinci-atlas.js (about 3.7 cm per unit; +x patient left, +y superior,
 * +z anterior). Calibres in mm, converted with MM.
 */
const MM = 1 / 37;
const RING = 12;                  // the atlas arch is a tube of 12-vertex rings
const TUBE_SEGMENTS = 40, RADIAL_SEGMENTS = 16;
const OSTIAL_FLARE = 0.3;         // ostia flare into the arch wall
const SEAT_DEPTH = 0.004;         // the base ring sinks just under the arch surface (no hairline gap)
const SEAT_FRACTION = 0.25;       // proximal part of a branch kept outside the arch

/** Branch ids, names and calibres (radius in mm). Origins are fractions of the arch length from the ascending aorta. */
export const ARCH_BRANCHES = Object.freeze([
  { id: 'brachiocephalic', parent: 'aorta', radiusMm: 6, at: 0.3, side: -1, abbr: 'BCT', tr: 'Brakiyosefalik trunkus', en: 'Brachiocephalic trunk' },
  { id: 'lcca', parent: 'aorta', radiusMm: 3.5, at: 0.43, side: 0.25, abbr: 'LCCA', tr: 'Sol ana karotis arter', en: 'Left common carotid artery' },
  { id: 'lsca', parent: 'aorta', radiusMm: 4.5, at: 0.62, side: 1, abbr: 'LSCA', tr: 'Sol subklavyen arter', en: 'Left subclavian artery' },
  { id: 'rcca', parent: 'brachiocephalic', radiusMm: 3.6, abbr: 'RCCA', tr: 'Sağ ana karotis arter', en: 'Right common carotid artery' },
  { id: 'rsca', parent: 'brachiocephalic', radiusMm: 4.5, abbr: 'RSCA', tr: 'Sağ subklavyen arter', en: 'Right subclavian artery' }
]);
const BY_ID = Object.fromEntries(ARCH_BRANCHES.map(b => [b.id, b]));

// Courses as offsets (mm) from the origin. BCT ~45 mm up and to the right, to
// behind the right sternoclavicular joint; the carotids run up to the root of
// the neck; the subclavians arch laterally over the pleural cupula.
const V = (x, y, z) => new THREE.Vector3(x, y, z).multiplyScalar(MM);
const COURSES = {
  brachiocephalic: [V(-4, 14, -2), V(-10, 28, -4), V(-16, 40, -6)],
  lcca: [V(2, 14, 0), V(6, 34, 1), V(10, 62, 2)],
  lsca: [V(4, 12, -2), V(10, 26, -3), V(22, 36, -4), V(38, 36, -4), V(50, 28, -3)],
  rcca: [V(-1, 12, 1), V(-3, 22, 2)],
  rsca: [V(-10, 6, -1), V(-24, 8, -2), V(-36, 2, -3)]
};

const v3 = (pos, i) => new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));

/** Centerline of the atlas arch from its 12-vertex rings, ordered from the ascending aorta (anterior end). */
export function archCenterline(geometry) {
  const pos = geometry.attributes.position, n = Math.floor(pos.count / RING);
  let rings = [];
  for (let r = 0; r < n; r++) {
    const c = new THREE.Vector3();
    for (let k = 0; k < RING; k++) c.add(v3(pos, r * RING + k));
    c.divideScalar(RING);
    let radius = 0;
    for (let k = 0; k < RING; k++) radius += v3(pos, r * RING + k).distanceTo(c);
    rings.push({ c, radius: radius / RING });
  }
  // End caps (narrower rings listed first) are dropped; then keep the longest run of close rings.
  const medianRadius = rings.map(r => r.radius).sort((x, y) => x - y)[Math.floor(rings.length / 2)];
  rings = rings.filter(r => r.radius > 0.8 * medianRadius);
  const gaps = rings.slice(1).map((r, i) => r.c.distanceTo(rings[i].c));
  const step = gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)] || 0;
  let best = [0, 0], start = 0;
  for (let i = 1; i <= rings.length; i++) {
    if (i === rings.length || gaps[i - 1] > 3 * step) {
      if (i - start > best[1] - best[0]) best = [start, i];
      start = i;
    }
  }
  let chain = rings.slice(best[0], best[1]);
  if (chain.length < 4) throw new Error('Aortic arch rings not found');
  if (chain[0].c.z < chain[chain.length - 1].c.z) chain = chain.reverse();
  return chain;
}

/** Point, tangent and radius at fraction `t` of the arch length. */
function archFrame(chain, t) {
  const lengths = [0];
  for (let i = 1; i < chain.length; i++) lengths.push(lengths[i - 1] + chain[i].c.distanceTo(chain[i - 1].c));
  const target = t * lengths[lengths.length - 1];
  let i = 1;
  while (i < chain.length - 1 && lengths[i] < target) i++;
  const f = (target - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
  return {
    centre: chain[i - 1].c.clone().lerp(chain[i].c, f),
    tangent: chain[i].c.clone().sub(chain[i - 1].c).normalize(),
    radius: THREE.MathUtils.lerp(chain[i - 1].radius, chain[i].radius, f)
  };
}

/** First surface point of `mesh` along a ray from `from` in direction `dir`, or null. */
function surfaceHit(raycaster, mesh, from, dir) {
  raycaster.set(from, dir);
  return raycaster.intersectObject(mesh, false)[0]?.point || null;
}

/** Superior (convex) surface point of the arch at fraction `t`, nudged toward `side` (-1 right, +1 left). */
function archOrigin(chain, archMesh, raycaster, t, side) {
  const { centre, tangent, radius } = archFrame(chain, t);
  const up = new THREE.Vector3(0, 1, 0).addScaledVector(tangent, -tangent.y).normalize();
  const lateral = new THREE.Vector3(1, 0, 0).addScaledVector(tangent, -tangent.x).normalize();
  const normal = up.addScaledVector(lateral, 0.18 * side).normalize();
  const hit = surfaceHit(raycaster, archMesh, centre.clone().addScaledVector(normal, radius * 3), normal.clone().negate());
  return { point: hit || centre.clone().addScaledVector(normal, radius), normal };
}

/**
 * Seat the proximal rings on a parent surface: the base ring lies on it (no
 * gap) and no ring of the proximal part dips under it (no penetration into
 * the lumen). Each vertex moves along the branch axis.
 */
function seatOnSurface(geometry, curve, parentMesh, raycaster) {
  const pos = geometry.attributes.position, ring = RADIAL_SEGMENTS + 1;
  const axis = curve.getTangentAt(0).normalize(), back = axis.clone().negate();
  const seated = Math.ceil(TUBE_SEGMENTS * SEAT_FRACTION);
  const reach = curve.getLength();
  for (let s = 0; s <= seated; s++) {
    for (let r = 0; r < ring; r++) {
      const i = s * ring + r, v = v3(pos, i);
      const hit = surfaceHit(raycaster, parentMesh, v.clone().addScaledVector(axis, reach), back);
      if (!hit) continue;
      const height = v.clone().sub(hit).dot(axis);
      if (s === 0 || height < 0) {
        const seat = hit.addScaledVector(axis, s === 0 ? -SEAT_DEPTH : 0.002);
        pos.setXYZ(i, seat.x, seat.y, seat.z);
      }
    }
  }
}

function flare(geometry, curve, radius, flareStart) {
  const pos = geometry.attributes.position, ring = RADIAL_SEGMENTS + 1;
  for (let s = 0; s <= TUBE_SEGMENTS; s++) {
    const t = s / TUBE_SEGMENTS, centre = curve.getPointAt(t);
    const k = (flareStart ? 1 + OSTIAL_FLARE * (1 - t) ** 6 : 1);
    for (let r = 0; r < ring; r++) {
      const i = s * ring + r;
      const v = v3(pos, i).sub(centre).multiplyScalar(k).add(centre);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
  }
}

/** Flat disc closing the distal end (a cut vessel), or a dome over the BCT bifurcation. */
function endCap(curve, radius, dome) {
  const end = curve.getPointAt(1), dir = curve.getTangentAt(1).normalize();
  const geometry = dome
    ? new THREE.SphereGeometry(radius, RADIAL_SEGMENTS, 8, 0, Math.PI * 2, 0, Math.PI / 2)
    : new THREE.CircleGeometry(radius, RADIAL_SEGMENTS).rotateX(-Math.PI / 2);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir));
  geometry.translate(end.x, end.y, end.z);
  return geometry;
}

function mergeGeometries(parts) {
  const positions = [], indices = [];
  let offset = 0;
  for (const g of parts) {
    const geo = g.index ? g : g.toNonIndexed();
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) positions.push(p.getX(i), p.getY(i), p.getZ(i));
    const idx = geo.index ? geo.index.array : Array.from({ length: p.count }, (_, i) => i);
    for (const k of idx) indices.push(k + offset);
    offset += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  out.setIndex(indices);
  out.computeVertexNormals();
  return out;
}

/**
 * Build the five branch geometries on the atlas arch.
 * @param {THREE.BufferGeometry} archGeometry 'Aortic arch' geometry in the shared atlas frame
 * @returns {{ id, abbr, tr, en, parent, radius, origin: THREE.Vector3, end: THREE.Vector3, path: THREE.Vector3[], geometry: THREE.BufferGeometry }[]}
 */
export function buildArchBranches(archGeometry) {
  if (!archGeometry?.attributes?.position) throw new Error('Aortic arch geometry missing');
  const chain = archCenterline(archGeometry);
  const raycaster = new THREE.Raycaster();
  const archMesh = new THREE.Mesh(archGeometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const built = {};
  const make = (spec, origin, normal, parentMesh, bctEnd) => {
    const radius = spec.radiusMm * MM;
    const lead = origin.clone().addScaledVector(normal, Math.max(radius, 4 * MM));
    const points = [origin, lead, ...COURSES[spec.id].map(o => origin.clone().add(o))];
    if (bctEnd) points.splice(1, 1);
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const tube = new THREE.TubeGeometry(curve, TUBE_SEGMENTS, radius, RADIAL_SEGMENTS, false);
    flare(tube, curve, radius, !bctEnd);
    if (parentMesh) seatOnSurface(tube, curve, parentMesh, raycaster);
    const geometry = mergeGeometries([tube, endCap(curve, radius, spec.id === 'brachiocephalic')]);
    return { ...spec, radius, origin: points[0].clone(), end: curve.getPointAt(1), path: curve.getSpacedPoints(24), geometry };
  };
  for (const id of ['brachiocephalic', 'lcca', 'lsca']) {
    const spec = BY_ID[id];
    const { point, normal } = archOrigin(chain, archMesh, raycaster, spec.at, spec.side);
    built[id] = make(spec, point, normal, archMesh);
  }
  // The BCT divides behind the right sternoclavicular joint: both daughters start inside its dome.
  const bct = built.brachiocephalic;
  const bctDir = bct.path[bct.path.length - 1].clone().sub(bct.path[bct.path.length - 2]).normalize();
  const fork = bct.end.clone().addScaledVector(bctDir, -bct.radius * 0.6);
  for (const id of ['rcca', 'rsca']) built[id] = make(BY_ID[id], fork, bctDir, null, true);
  archMesh.material.dispose();
  return ARCH_BRANCHES.map(b => built[b.id]);
}

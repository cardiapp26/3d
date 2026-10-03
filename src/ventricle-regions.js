import * as THREE from 'three';

/*
 * Wall regions of the atlas ventricles, one label per vertex, for the 3D
 * ventricle modes and the echo section.
 * - LV: the ASE/AHA 16-segment model (Lang et al., JASE 2015;28:1-39;
 *   Cerqueira et al., Circulation 2002;105:539). Levels are thirds of the
 *   annulus-to-apex length (basal, mid, apical; the apical cap joins the
 *   apical segments); basal and mid rings have six 60° segments, the apical
 *   ring four 90° segments. The ring is anchored to the planes of the
 *   standard echo views: the aortic valve direction (A3C and PLAX plane) is
 *   the centre of the anteroseptal segments (+30°) and the tricuspid annulus
 *   direction (A4C plane) the centre of the inferoseptal segments (-30°);
 *   angles are stretched piecewise between and beyond the two anchors. So the
 *   views cut the textbook segments (A4C 3/9/14 and 6/12/16, A2C 4/10/15
 *   and 1/7/13, A3C/PLAX 2/8 and 5/11). On this atlas the two valves lie
 *   57° apart and the LAD falls inside the anteroseptal arc rather than on
 *   its border. The LV outflow tract
 *   (the basal LV next to the aortic annulus) is its own region.
 * - RV: inlet (next to the tricuspid annulus), outflow tract / infundibulum
 *   (toward the pulmonary valve), apical trabecular part, and the walls
 *   (septal: next to the LV; inferior: facing the diaphragm; anterior free
 *   wall: the rest).
 * Geometric teaching regions from measured landmarks, not segmented tissue.
 */
export const LV_SEGMENTS = Object.freeze([
  null,
  { tr: 'Bazal anterior', en: 'Basal anterior' },
  { tr: 'Bazal anteroseptal', en: 'Basal anteroseptal' },
  { tr: 'Bazal inferoseptal', en: 'Basal inferoseptal' },
  { tr: 'Bazal inferior', en: 'Basal inferior' },
  { tr: 'Bazal inferolateral', en: 'Basal inferolateral' },
  { tr: 'Bazal anterolateral', en: 'Basal anterolateral' },
  { tr: 'Orta anterior', en: 'Mid anterior' },
  { tr: 'Orta anteroseptal', en: 'Mid anteroseptal' },
  { tr: 'Orta inferoseptal', en: 'Mid inferoseptal' },
  { tr: 'Orta inferior', en: 'Mid inferior' },
  { tr: 'Orta inferolateral', en: 'Mid inferolateral' },
  { tr: 'Orta anterolateral', en: 'Mid anterolateral' },
  { tr: 'Apikal anterior', en: 'Apical anterior' },
  { tr: 'Apikal septal', en: 'Apical septal' },
  { tr: 'Apikal inferior', en: 'Apical inferior' },
  { tr: 'Apikal lateral', en: 'Apical lateral' }
]);
// One hue per wall (anterior, septal, inferior, lateral families), lighter toward the apex.
const WALL_HUE = { anterior: 0.0, anteroseptal: 0.78, inferoseptal: 0.68, septal: 0.73, inferior: 0.58, inferolateral: 0.33, anterolateral: 0.12, lateral: 0.22 };
const WALLS6 = ['anterior', 'anteroseptal', 'inferoseptal', 'inferior', 'inferolateral', 'anterolateral'];
const WALLS4 = ['anterior', 'septal', 'inferior', 'lateral'];
const LVOT_RADIUS = 0.5;        // LV vertices this close to the aortic annulus centre ...
const LVOT_LEVEL = 0.2;         // ... and in the upper fifth of the LV belong to the outflow tract

const colorOf = (hue, level) => `#${new THREE.Color().setHSL(hue, 0.72, 0.36 + level * 0.1).getHexString()}`;

/**
 * Map a raw angle (0 = septal centre, + anterior) so the anterior anchor sits
 * at +target and the inferior anchor at -target, stretching linearly between
 * them and over the rest of the ring.
 */
export function anchoredAngles(anteriorAt, inferiorAt, target) {
  const innerSpan = anteriorAt - inferiorAt;
  const outerSpan = 360 - innerSpan;
  return (theta) => {
    if (theta >= inferiorAt && theta <= anteriorAt) return -target + ((theta - inferiorAt) / innerSpan) * 2 * target;
    const past = ((theta - anteriorAt) % 360 + 360) % 360;
    const phi = target + (past / outerSpan) * (360 - 2 * target);
    return phi > 180 ? phi - 360 : phi;
  };
}

/** Wall and level of an AHA segment (1..16). */
export function segmentWall(n) {
  if (n >= 13) return { level: 2, wall: WALLS4[n - 13] };
  return { level: n > 6 ? 1 : 0, wall: WALLS6[(n - 1) % 6] };
}

/**
 * AHA segment of a point from its long-axis fraction `t` (0 annulus, 1 apex)
 * and its angle `phi` (degrees, 0 = septal centre, positive toward anterior).
 */
export function ahaSegment(t, phi) {
  const a = ((phi % 360) + 540) % 360 - 180;     // -180..180
  if (t >= 2 / 3) {
    if (a >= -45 && a < 45) return 14;
    if (a >= 45 && a < 135) return 13;
    if (a >= -135 && a < -45) return 15;
    return 16;
  }
  const base = t < 1 / 3 ? 0 : 6;
  if (a >= 0 && a < 60) return base + 2;
  if (a >= 60 && a < 120) return base + 1;
  if (a >= 120) return base + 6;
  if (a >= -60 && a < 0) return base + 3;
  if (a >= -120 && a < -60) return base + 4;
  return base + 5;
}

const vertexAt = (pos, i) => new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
const centroidOf = (geometry) => {
  const pos = geometry.attributes.position, c = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) c.add(vertexAt(pos, i));
  return c.divideScalar(Math.max(1, pos.count));
};
const farthest = (geometry, from) => {
  const pos = geometry.attributes.position;
  let best = null, bd = -1;
  for (let i = 0; i < pos.count; i++) { const v = vertexAt(pos, i), d = v.distanceToSquared(from); if (d > bd) { bd = d; best = v; } }
  return best;
};
/** Unit part of `v` perpendicular to unit `axis`. */
const across = (v, axis) => v.clone().addScaledVector(axis, -v.dot(axis)).normalize();

/**
 * LV regions. Inputs in the meshes' shared (baked) frame.
 * @param {{ lvGeometry: THREE.BufferGeometry, mitralCenter: THREE.Vector3, aorticCenter: THREE.Vector3, tricuspidCenter: THREE.Vector3 }} input
 * @returns {{ names: object[], byVertex: Int16Array, frame: object }}
 */
export function lvRegions({ lvGeometry, mitralCenter, aorticCenter, tricuspidCenter }) {
  const apex = farthest(lvGeometry, mitralCenter);
  const length = apex.distanceTo(mitralCenter);
  const axis = apex.clone().sub(mitralCenter).normalize();
  const toAortic = across(aorticCenter.clone().sub(mitralCenter), axis);
  const toTricuspid = across(tricuspidCenter.clone().sub(mitralCenter), axis);
  const septal = toAortic.clone().add(toTricuspid).normalize();
  const anterior = across(toAortic.clone().addScaledVector(septal, -toAortic.dot(septal)), axis);
  const angle = (v) => THREE.MathUtils.radToDeg(Math.atan2(v.dot(anterior), v.dot(septal)));
  const phiOf = anchoredAngles(angle(toAortic), angle(toTricuspid), 30);
  const names = [];
  const index = new Map();
  const nameIndex = (key, make) => { if (!index.has(key)) { index.set(key, names.length); names.push(make()); } return index.get(key); };
  const pos = lvGeometry.attributes.position, byVertex = new Int16Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const v = vertexAt(pos, i).sub(mitralCenter);
    const t = THREE.MathUtils.clamp(v.dot(axis) / length, 0, 1);
    if (t < LVOT_LEVEL && vertexAt(pos, i).distanceTo(aorticCenter) < LVOT_RADIUS) {
      byVertex[i] = nameIndex('lvot', () => ({ tr: 'LVOT (sol ventrikül çıkış yolu)', en: 'LVOT (left ventricular outflow tract)', abbr: 'LVOT', short: { tr: 'LVOT', en: 'LVOT' }, color: '#f1c232', key: 'lvot' }));
      continue;
    }
    const r = across(v, axis);
    const n = ahaSegment(t, phiOf(angle(r)));
    byVertex[i] = nameIndex(n, () => {
      const { level, wall } = segmentWall(n);
      return { tr: `${LV_SEGMENTS[n].tr} (${n})`, en: `${LV_SEGMENTS[n].en} (${n})`, abbr: String(n), short: { tr: String(n), en: String(n) }, segment: n, color: colorOf(WALL_HUE[wall], level), key: `lv-${n}` };
    });
  }
  return { names, byVertex, frame: { apex, axis, septal, anterior, length } };
}

const RV_REGIONS = {
  rvot: { tr: 'RVOT / infundibulum (çıkış yolu)', en: 'RVOT / infundibulum (outflow tract)', abbr: 'RVOT', short: { tr: 'RVOT', en: 'RVOT' }, color: '#f1c232' },
  inlet: { tr: 'RV giriş yolu (inlet)', en: 'RV inlet', abbr: 'Inlet', short: { tr: 'Giriş', en: 'Inlet' }, color: '#6fa8dc' },
  apical: { tr: 'Apikal trabeküler bölge', en: 'Apical trabecular part', abbr: 'Apex', short: { tr: 'Apeks', en: 'Apex' }, color: '#93c47d' },
  septal: { tr: 'Septal duvar', en: 'Septal wall', abbr: 'Septal', short: { tr: 'Septal', en: 'Septal' }, color: '#8e7cc3' },
  inferior: { tr: 'İnferior (diyafragmatik) duvar', en: 'Inferior (diaphragmatic) wall', abbr: 'Inferior', short: { tr: 'İnferior', en: 'Inferior' }, color: '#76a5af' },
  anterior: { tr: 'Anterior serbest duvar', en: 'Anterior free wall', abbr: 'Anterior', short: { tr: 'Anterior', en: 'Anterior' }, color: '#e06666' }
};
const RVOT_FRACTION = 0.5;      // closer to the pulmonary valve than half the TV-PV distance
const INLET_FRACTION = 0.4;     // closer to the tricuspid annulus than this share of the TV-PV distance
const APICAL_LEVEL = 0.62;      // beyond this share of the TV-to-apex length
const SEPTAL_GAP = 0.32;        // RV vertices this close to the LV form the septal wall (about a septal thickness)
const CELL = 0.2;

/** Nearest-distance test against a point set on a coarse grid. */
function nearSet(points, radius) {
  const grid = new Map(), key = (x, y, z) => `${x},${y},${z}`;
  for (const p of points) {
    const k = key(Math.floor(p.x / CELL), Math.floor(p.y / CELL), Math.floor(p.z / CELL));
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(p);
  }
  const r2 = radius * radius, reach = Math.ceil(radius / CELL);
  return (p) => {
    const cx = Math.floor(p.x / CELL), cy = Math.floor(p.y / CELL), cz = Math.floor(p.z / CELL);
    for (let dx = -reach; dx <= reach; dx++) for (let dy = -reach; dy <= reach; dy++) for (let dz = -reach; dz <= reach; dz++) {
      for (const q of grid.get(key(cx + dx, cy + dy, cz + dz)) || []) if (q.distanceToSquared(p) < r2) return true;
    }
    return false;
  };
}

/**
 * RV regions.
 * @param {{ rvGeometry: THREE.BufferGeometry, lvGeometry: THREE.BufferGeometry, tricuspidCenter: THREE.Vector3, pulmonaryCenter: THREE.Vector3 }} input
 */
export function rvRegions({ rvGeometry, lvGeometry, tricuspidCenter, pulmonaryCenter }) {
  const span = tricuspidCenter.distanceTo(pulmonaryCenter);
  const apex = farthest(rvGeometry, tricuspidCenter.clone().lerp(pulmonaryCenter, 0.5));
  const axis = apex.clone().sub(tricuspidCenter);
  const length = axis.length();
  axis.normalize();
  const centre = centroidOf(rvGeometry);
  const lvPos = lvGeometry.attributes.position, lvPoints = [];
  for (let i = 0; i < lvPos.count; i += 2) lvPoints.push(vertexAt(lvPos, i));
  const nearLv = nearSet(lvPoints, SEPTAL_GAP);
  const order = Object.keys(RV_REGIONS);
  const names = order.map((key) => ({ ...RV_REGIONS[key], key: `rv-${key}` }));
  const pos = rvGeometry.attributes.position, byVertex = new Int16Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const p = vertexAt(pos, i);
    const dPv = p.distanceTo(pulmonaryCenter), dTv = p.distanceTo(tricuspidCenter);
    const t = p.clone().sub(tricuspidCenter).dot(axis) / length;
    let region;
    if (dPv < span * RVOT_FRACTION && dPv < dTv) region = 'rvot';
    else if (dTv < span * INLET_FRACTION) region = 'inlet';
    else if (t > APICAL_LEVEL) region = 'apical';
    else if (nearLv(p)) region = 'septal';
    else region = p.y < centre.y - 0.15 ? 'inferior' : 'anterior';
    byVertex[i] = order.indexOf(region);
  }
  return { names, byVertex, frame: { apex, axis, length } };
}

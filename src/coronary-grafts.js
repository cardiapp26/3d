import * as THREE from 'three';
import { branchAt, tubeComponents } from './coronary-branches.js';
import { taperedTube } from './coronary-pda.js';

/**
 * Schematic coronary bypass grafts for the angiography lessons: LIMA to the
 * mid LAD, a saphenous vein graft from the ascending aorta to OM1 and one to
 * the PDA, with sternal wires and surgical clips. The routes are teaching
 * drawings anchored on the atlas; they are not segmented anatomy. Each graft
 * ends in an end-to-side anastomosis on its target's centreline: the hood
 * lies along the artery (heel on the wall, toe inside the lumen, pointing
 * distally) and narrows to the artery's calibre, so the graft and its
 * run-off read as one lumen in 3D and in the fluoroscopy projection. The
 * vein grafts leave the anterior ascending aorta from inside its wall. In
 * the projection the shown graft is the injected vessel and the wires and
 * clips are metal (heart.js projectionMaterial).
 */

export const GRAFTS = Object.freeze({
  lima: { target: 'lad', color: 0xef5da8, radius: 0.034 },
  'svg-om': { target: 'lcx', color: 0xc06cf0, radius: 0.052 },
  'svg-pda': { target: 'pda', color: 0xc06cf0, radius: 0.052 }
});

const WIRE_COUNT = 6;
const CLIPS_ON_LIMA = 6;
const RING = 12;
// Anastomosis: where on the target centreline (fraction of its length from
// the proximal end), how long the hood runs along it, and how far the toe
// reaches past the arteriotomy centre (all heart units).
const SITES = { lima: 0.55, 'svg-om': 0.45, 'svg-pda': 0.4 };
const HOOD = 0.2;
const TOE = 0.09;
const TAPER_LENGTH = 0.32;     // the graft narrows to the target calibre over its last stretch
const TOE_RADIUS = 0.9;        // the toe ends inside the lumen, just under the artery radius
const AORTIC_DEPTH = 0.05;     // the vein graft starts this far inside the aortic wall

const smooth = x => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };

/** Points of a mesh in heart space, with their vertex index. */
function points(meshes, toLocal) {
  const out = [];
  for (const m of meshes) {
    m.updateWorldMatrix(true, false);
    const p = m.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) out.push({ i, mesh: m, v: toLocal(new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld)) });
  }
  return out;
}

const centreOf = list => list.reduce((s, p) => s.add(p.v), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, list.length));

/**
 * Centreline of one tube of an atlas artery in heart space, ordered from the
 * end nearest `origin`, with its mean radius. `pick(component, name)` chooses
 * the tube (name: its branch-table row or null for the trunk).
 */
function arteryLine(mesh, toLocal, origin, pick) {
  if (!mesh) return null;
  mesh.updateWorldMatrix(true, false);
  const pos = mesh.geometry.attributes.position;
  const comps = tubeComponents(mesh.geometry).filter(c => c.rings.length > 3 && pick(c, branchAt(mesh.userData.branches, c.vertices[0])));
  if (!comps.length) return null;
  const c = comps.reduce((a, b) => (b.length > a.length ? b : a));
  const toHeart = v => toLocal(v.clone().applyMatrix4(mesh.matrixWorld));
  let line = c.rings.map(toHeart);
  if (line[0].distanceTo(origin) > line.at(-1).distanceTo(origin)) line = line.reverse();
  let radius = 0;
  for (let r = 0; r < c.rings.length; r++) radius += new THREE.Vector3().fromBufferAttribute(pos, c.vertices[r * RING]).distanceTo(c.rings[r]);
  return { line, radius: radius / c.rings.length };
}

/** Point and unit tangent at arc length `s` along a polyline. */
function along(line, s) {
  let walked = 0;
  for (let i = 1; i < line.length; i++) {
    const seg = line[i].distanceTo(line[i - 1]);
    if (walked + seg >= s || i === line.length - 1) {
      const t = seg > 0 ? Math.min(1, Math.max(0, (s - walked) / seg)) : 0;
      return { point: line[i - 1].clone().lerp(line[i], t), tangent: line[i].clone().sub(line[i - 1]).normalize() };
    }
    walked += seg;
  }
  return { point: line[0].clone(), tangent: new THREE.Vector3(0, -1, 0) };
}
const lengthOf = line => line.reduce((s, p, i) => (i ? s + p.distanceTo(line[i - 1]) : 0), 0);

/**
 * End-to-side anastomosis on a target line at `fraction` of its length.
 * Returns the lead-in and approach points, the hood (heel, centre, toe), the outward
 * normal and the target radius. `heartCentre` sets "outward".
 */
function anastomosis(target, fraction, heartCentre) {
  const total = lengthOf(target.line);
  const s = THREE.MathUtils.clamp(fraction * total, HOOD + 0.05, total - TOE - 0.02);
  const at = d => along(target.line, s + d).point;
  const point = at(0), tangent = at(0.08).sub(at(-0.08)).normalize();
  const out = point.clone().sub(heartCentre);
  const normal = out.addScaledVector(tangent, -out.dot(tangent)).normalize();
  const r = target.radius;
  return {
    point, tangent, normal, radius: r,
    // A shallow approach so the hood lies along the artery, straight back along the arteriotomy's own axis, so a short target (OM1) does not curl the graft.
    lead: point.clone().addScaledVector(tangent, -HOOD * 4.5).addScaledVector(normal, 0.42),
    approach: point.clone().addScaledVector(tangent, -HOOD * 2.4).addScaledVector(normal, 0.18),
    hood: [
      point.clone().addScaledVector(tangent, -HOOD).addScaledVector(normal, r * 2.6),
      point.clone().addScaledVector(tangent, -HOOD * 0.45).addScaledVector(normal, r * 1.1),
      point.clone().addScaledVector(normal, r * 0.25),
      at(TOE * 0.55),
      at(TOE)
    ]
  };
}

/** A spot on the anterior ascending aorta, facing `direction`, at height `y`. */
function aorticSite(aorta, y, direction) {
  const slab = aorta.filter(p => Math.abs(p.v.y - y) < 0.1);
  if (slab.length < 8) return null;
  const centre = centreOf(slab);
  const surface = slab.reduce((a, b) => (b.v.clone().sub(centre).dot(direction) > a.v.clone().sub(centre).dot(direction) ? b : a)).v.clone();
  const normal = surface.clone().sub(centre).setY(0).normalize();
  return { centre, surface, normal, radius: surface.clone().sub(centre).setY(0).length() };
}

/**
 * @param {{ getMeshes: (id: string) => THREE.Mesh[], toLocal: (v: THREE.Vector3) => THREE.Vector3 }} helpers
 */
export function createCoronaryGrafts({ getMeshes, toLocal }) {
  const group = new THREE.Group();
  group.name = 'Coronary bypass grafts (schematic)';
  group.visible = false;
  const tubes = new Map();
  const metal = new THREE.Group();
  metal.name = 'Sternal wires (schematic)';
  metal.userData.fluoroDevice = true;
  metal.userData.fluoroTint = 0x141414;
  group.add(metal);
  let built = false;

  function tube(id, path, site, origin = null) {
    const spec = GRAFTS[id];
    const curve = new THREE.CatmullRomCurve3(path, false, 'centripetal');
    const length = curve.getLength();
    const end = site.radius * TOE_RADIUS;
    const radiusAt = u => {
      const fromEnd = (1 - u) * length;
      return fromEnd >= TAPER_LENGTH ? spec.radius : THREE.MathUtils.lerp(end, spec.radius, smooth(fromEnd / TAPER_LENGTH));
    };
    const mesh = new THREE.Mesh(
      taperedTube(curve, Math.max(120, Math.round(length * 60)), radiusAt),
      new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.45, metalness: 0.05, emissive: spec.color, emissiveIntensity: 0.18 })
    );
    mesh.name = `${id.toUpperCase()} graft (schematic)`;
    mesh.userData = {
      id: `graft-${id}`, graft: id, layer: 'grafts', provenance: 'schematic',
      // Rest geometry of both anastomoses (heart space) for checks and lessons.
      anastomosis: {
        target: spec.target, end: path.at(-1).toArray(), point: site.point.toArray(), targetRadius: site.radius, endRadius: end,
        origin: origin ? { start: path[0].toArray(), centre: origin.centre.toArray(), radius: origin.radius } : null
      }
    };
    // The graft and its clips show together; the clips are metal in fluoroscopy.
    const holder = new THREE.Group();
    holder.name = `${id.toUpperCase()} graft and clips`;
    holder.visible = false;
    const clips = new THREE.Group();
    clips.userData.fluoroDevice = true;
    clips.userData.fluoroTint = 0x141414;
    holder.add(mesh, clips);
    group.add(holder);
    tubes.set(id, { mesh, curve, holder, clips });
  }

  function build() {
    if (built) return true;
    const aorta = points(getMeshes('aorta'), toLocal);
    const ascendingMesh = getMeshes('aorta').filter(m => /ascending/i.test(m.name));
    const ascending = ascendingMesh.length ? points(ascendingMesh, toLocal) : aorta;
    const lmList = points(getMeshes('lm'), toLocal);
    const ventricles = points([...getMeshes('lv'), ...getMeshes('rv')], toLocal);
    if (!aorta.length || !ventricles.length) return false;
    const heartCentre = centreOf(ventricles);
    const lm = lmList.length ? centreOf(lmList) : heartCentre;
    const top = Math.max(...ventricles.map(p => p.v.y));
    const front = Math.max(...ventricles.map(p => p.v.z));

    // Targets on the atlas's own named branches (coronary-branches.js tables) and the schematic PDA.
    const ladLine = arteryLine(getMeshes('lad')[0], toLocal, lm, (c, name) => !name);
    const omLine = arteryLine(getMeshes('lcx')[0], toLocal, lm, (c, name) => name?.abbr === 'OM1')
      || arteryLine(getMeshes('lcx')[0], toLocal, lm, (c, name) => !name);
    const pdaMesh = getMeshes('pda')[0];
    const pdaLine = pdaMesh?.userData.centerline
      ? { line: pdaMesh.userData.centerline.map(v => toLocal(v.clone().applyMatrix4(pdaMesh.matrixWorld))), radius: pdaMesh.userData.radius[0] * 0.75 }
      : null;
    if (!ladLine || !omLine || !pdaLine) return false;
    const lad = anastomosis(ladLine, SITES.lima, heartCentre);
    const om = anastomosis(omLine, SITES['svg-om'], heartCentre);
    const pda = anastomosis(pdaLine, SITES['svg-pda'], heartCentre);

    // Aortic landmarks: the arch top (left subclavian side) and two anterior ascending sites.
    const archTop = aorta.reduce((a, b) => (a.v.y > b.v.y ? a : b)).v.clone();
    const ascTop = Math.max(...ascending.map(p => p.v.y)), ascLow = Math.max(top - 0.2, Math.min(...ascending.map(p => p.v.y)));
    const omSite = aorticSite(ascending, ascLow + (ascTop - ascLow) * 0.55, new THREE.Vector3(0.45, 0, 1).normalize());
    const pdaSite = aorticSite(ascending, ascLow + (ascTop - ascLow) * 0.35, new THREE.Vector3(-0.55, 0, 1).normalize());
    if (!omSite || !pdaSite) return false;
    // A point pushed out from the heart centre (keeps a route off the epicardium).
    const awayFromHeart = (p, amount) => p.clone().addScaledVector(p.clone().sub(heartCentre).normalize(), amount);
    const fromAorta = site => [
      site.surface.clone().addScaledVector(site.normal, -AORTIC_DEPTH),
      site.surface.clone().addScaledVector(site.normal, 0.16).add(new THREE.Vector3(0, 0.04, 0))
    ];

    // LIMA: left subclavian, down behind the left sternal border, onto the mid LAD.
    const subclavian = archTop.clone().add(new THREE.Vector3(0.55, 0.35, 0.05));
    tube('lima', [
      subclavian,
      subclavian.clone().add(new THREE.Vector3(0.2, -0.2, 0.45)),
      new THREE.Vector3(lad.lead.x + 0.15, archTop.y - 0.55, Math.max(front, lad.lead.z) + 0.3),
      lad.lead,
      lad.approach,
      ...lad.hood
    ], lad);
    // SVG to OM1: anterior ascending aorta, over the pulmonary trunk to the lateral wall.
    const [omStart, omOut] = fromAorta(omSite);
    tube('svg-om', [
      omStart,
      omOut,
      omOut.clone().addScaledVector(omSite.normal, 0.2).add(new THREE.Vector3(0.2, 0.06, 0)),
      awayFromHeart(omOut.clone().lerp(om.lead, 0.55), 0.3),
      om.lead,
      om.approach,
      ...om.hood
    ], om, omSite);
    // SVG to PDA: right anterior aorta, around the acute margin to the inferior interventricular groove.
    const [pdaStart, pdaOut] = fromAorta(pdaSite);
    const rightMargin = ventricles.reduce((a, b) => (a.v.x < b.v.x ? a : b)).v.clone();
    const bottom = Math.min(...ventricles.map(p => p.v.y));
    tube('svg-pda', [
      pdaStart,
      pdaOut,
      pdaOut.clone().add(new THREE.Vector3(-0.3, -0.05, 0.12)),
      rightMargin.clone().add(new THREE.Vector3(-0.28, 0.3, 0.2)),
      rightMargin.clone().add(new THREE.Vector3(-0.22, -0.3, 0)),
      new THREE.Vector3(rightMargin.x + 0.15, bottom - 0.12, (rightMargin.z + pda.point.z) / 2),
      pda.lead,
      pda.approach,
      ...pda.hood
    ], pda, pdaSite);

    // Sternal wires: twisted loops around the sternum, in front of the heart.
    const wireMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.3, metalness: 0.85 });
    const sternumX = (archTop.x + heartCentre.x) / 2 - 0.15;
    const loop = new THREE.TorusGeometry(0.16, 0.011, 6, 40);
    const twist = new THREE.CylinderGeometry(0.018, 0.018, 0.16, 6);
    for (let k = 0; k < WIRE_COUNT; k++) {
      const y = archTop.y + 0.2 - k * ((archTop.y + 0.2 - (heartCentre.y - 0.9)) / (WIRE_COUNT - 1));
      const ring = new THREE.Mesh(loop, wireMat);
      ring.scale.set(1.7, 1, 0.55);
      ring.rotation.x = Math.PI / 2 + 0.12;
      ring.position.set(sternumX, y, front + 0.95);
      const knot = new THREE.Mesh(twist, wireMat);
      knot.position.set(sternumX, y - 0.06, front + 1.07);
      metal.add(ring, knot);
    }
    // Surgical clips along the LIMA (ligated side branches); vein grafts carry
    // a clip on a ligated tributary near the aorta (none at the anastomosis).
    const clipGeom = new THREE.BoxGeometry(0.075, 0.016, 0.016);
    const placeClip = (curve, t, side, radius) => {
      const at = curve.getPointAt(t), tangent = curve.getTangentAt(t);
      const across = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 0, 1)).normalize();
      const clip = new THREE.Mesh(clipGeom, wireMat);
      clip.position.copy(at).addScaledVector(across, side * (radius + 0.03));
      clip.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), across);
      return clip;
    };
    const lima = tubes.get('lima');
    for (let k = 0; k < CLIPS_ON_LIMA; k++) lima.clips.add(placeClip(lima.curve, 0.12 + k * 0.11, k % 2 ? 1 : -1, GRAFTS.lima.radius));
    for (const id of ['svg-om', 'svg-pda']) tubes.get(id).clips.add(placeClip(tubes.get(id).curve, 0.22, 1, GRAFTS[id].radius));
    built = true;
    return true;
  }

  return {
    group,
    build,
    /** Show one graft (null hides all). The sternal wires and clips show with any graft. */
    setGraft(id) {
      if (id && !built && !build()) return;
      group.visible = Boolean(id);
      for (const [key, { holder }] of tubes) holder.visible = key === id;
    },
    /** The native artery a graft fills (its run-off is injected with it). */
    targetOf: id => GRAFTS[id]?.target || null
  };
}

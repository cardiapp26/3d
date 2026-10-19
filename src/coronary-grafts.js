import * as THREE from 'three';
import { branchAt } from './coronary-branches.js';

/**
 * Schematic coronary bypass grafts for the angiography lessons: LIMA to the
 * mid LAD, a saphenous vein graft from the ascending aorta to OM1 and one to
 * the distal RCA / PDA, with sternal wires and surgical clips. The routes are
 * teaching drawings anchored on the atlas (aortic arch and root, the named
 * LAD trunk, OM1 and the RCA end); they are not segmented anatomy. In the
 * fluoroscopy projection the shown graft is the injected vessel and the wires
 * and clips are metal (heart.js projectionMaterial).
 */

export const GRAFTS = Object.freeze({
  lima: { target: 'lad', color: 0xef5da8, radius: 0.034 },
  'svg-om': { target: 'lcx', color: 0xc06cf0, radius: 0.052 },
  'svg-pda': { target: 'rca', color: 0xc06cf0, radius: 0.052 }
});

const WIRE_COUNT = 6;
const CLIPS_ON_LIMA = 6;

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

/** The point at `fraction` of the farthest distance from `origin` (nearest match). */
function alongFrom(list, origin, fraction) {
  if (!list.length) return null;
  const far = Math.max(...list.map(p => p.v.distanceTo(origin)));
  const want = far * fraction;
  return list.reduce((best, p) => (Math.abs(p.v.distanceTo(origin) - want) < Math.abs(best.v.distanceTo(origin) - want) ? p : best)).v.clone();
}

const centreOf = list => list.reduce((s, p) => s.add(p.v), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, list.length));

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

  function tube(id, path) {
    const spec = GRAFTS[id];
    const curve = new THREE.CatmullRomCurve3(path, false, 'centripetal');
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 96, spec.radius, 12, false),
      new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.45, metalness: 0.05, emissive: spec.color, emissiveIntensity: 0.18 })
    );
    mesh.name = `${id.toUpperCase()} graft (schematic)`;
    mesh.userData = { id: `graft-${id}`, graft: id, layer: 'grafts', provenance: 'schematic' };
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
    const lad = points(getMeshes('lad'), toLocal);
    const lcx = points(getMeshes('lcx'), toLocal);
    const rca = points(getMeshes('rca'), toLocal);
    const lmList = points(getMeshes('lm'), toLocal);
    const ventricles = points([...getMeshes('lv'), ...getMeshes('rv')], toLocal);
    if (!aorta.length || !lad.length || !lcx.length || !rca.length || !ventricles.length) return false;

    const heartCentre = centreOf(ventricles);
    const lm = lmList.length ? centreOf(lmList) : centreOf(lad.slice(0, 20));
    const rcaOstium = rca.reduce((a, b) => (a.v.y > b.v.y ? a : b)).v.clone();
    const top = Math.max(...ventricles.map(p => p.v.y));
    const front = Math.max(...ventricles.map(p => p.v.z));
    const outward = (target, amount) => target.clone().add(target.clone().sub(heartCentre).setY(0).normalize().multiplyScalar(amount));

    // Targets on the atlas's own named branches (coronary-branches.js tables).
    const ladTrunk = lad.filter(p => !branchAt(p.mesh.userData.branches, p.i));
    const ladTarget = alongFrom(ladTrunk.length ? ladTrunk : lad, lm, 0.55);
    const om1 = lcx.filter(p => branchAt(p.mesh.userData.branches, p.i)?.abbr === 'OM1');
    const omTarget = om1.length ? alongFrom(om1, lm, 0.75) : alongFrom(lcx, lm, 0.6);
    const rcaTrunk = rca.filter(p => !branchAt(p.mesh.userData.branches, p.i));
    const pdaTarget = alongFrom(rcaTrunk.length ? rcaTrunk : rca, rcaOstium, 0.92);

    // Aortic landmarks: the arch top (left subclavian side) and the anterior ascending aorta.
    const archTop = aorta.reduce((a, b) => (a.v.y > b.v.y ? a : b)).v.clone();
    const ascending = aorta.filter(p => p.v.y < archTop.y - 0.55 && p.v.y > top - 0.2);
    const ascFront = ascending.length ? ascending.reduce((a, b) => (a.v.z > b.v.z ? a : b)).v.clone() : archTop.clone().add(new THREE.Vector3(-0.3, -0.8, 0.3));

    // LIMA: left subclavian, down behind the left sternal border, onto the mid LAD.
    const subclavian = archTop.clone().add(new THREE.Vector3(0.55, 0.35, 0.05));
    tube('lima', [
      subclavian,
      subclavian.clone().add(new THREE.Vector3(0.2, -0.2, 0.45)),
      new THREE.Vector3(ladTarget.x + 0.25, archTop.y - 0.55, front + 0.35),
      new THREE.Vector3(ladTarget.x + 0.12, (archTop.y + ladTarget.y) / 2 - 0.45, front + 0.25),
      outward(ladTarget, 0.14).setY(ladTarget.y + 0.18),
      ladTarget
    ]);
    // SVG to OM1: anterior ascending aorta, over the pulmonary trunk to the lateral wall.
    const svgOmOrigin = ascFront.clone().add(new THREE.Vector3(0.08, 0.12, 0.04));
    tube('svg-om', [
      svgOmOrigin,
      svgOmOrigin.clone().add(new THREE.Vector3(0.35, 0.18, 0.3)),
      new THREE.Vector3((svgOmOrigin.x + omTarget.x) / 2 + 0.2, svgOmOrigin.y + 0.05, front + 0.15),
      outward(omTarget, 0.45).setY(omTarget.y + 0.45),
      outward(omTarget, 0.12).setY(omTarget.y + 0.1),
      omTarget
    ]);
    // SVG to PDA: right anterior aorta, around the acute margin to the inferior wall.
    const svgPdaOrigin = ascFront.clone().add(new THREE.Vector3(-0.12, -0.08, 0.02));
    const rightMargin = ventricles.reduce((a, b) => (a.v.x < b.v.x ? a : b)).v.clone();
    tube('svg-pda', [
      svgPdaOrigin,
      svgPdaOrigin.clone().add(new THREE.Vector3(-0.35, 0.05, 0.3)),
      rightMargin.clone().add(new THREE.Vector3(-0.3, 0.35, 0.25)),
      rightMargin.clone().add(new THREE.Vector3(-0.22, -0.25, 0.05)),
      outward(pdaTarget, 0.2).setY(pdaTarget.y - 0.12),
      pdaTarget
    ]);

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
    // Surgical clips along the LIMA (ligated side branches) and at the graft ends.
    const clipGeom = new THREE.BoxGeometry(0.075, 0.016, 0.016);
    const lima = tubes.get('lima').curve;
    for (let k = 0; k < CLIPS_ON_LIMA; k++) {
      const t = 0.12 + k * 0.12;
      const at = lima.getPointAt(t), tangent = lima.getTangentAt(t);
      const clip = new THREE.Mesh(clipGeom, wireMat);
      clip.position.copy(at).add(new THREE.Vector3(0.06 * (k % 2 ? 1 : -1), 0, 0.02));
      clip.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 0, 1)).normalize());
      tubes.get('lima').clips.add(clip);
    }
    for (const id of ['svg-om', 'svg-pda']) {
      const curve = tubes.get(id).curve;
      for (const t of [0.03, 0.97]) {
        const clip = new THREE.Mesh(clipGeom, wireMat);
        clip.position.copy(curve.getPointAt(t)).add(new THREE.Vector3(0, 0.05, 0.04));
        tubes.get(id).clips.add(clip);
      }
    }
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

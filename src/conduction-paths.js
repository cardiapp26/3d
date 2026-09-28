import * as THREE from 'three';

/**
 * Left bundle branch measured on the atlas LV: the trunk leaves the distal
 * His on the septal crest, reaches the LV septal subendocardium and descends
 * toward the apex (about 1-1.5 cm); the anterior and posterior fascicles then
 * fan over the septal surface toward the bases of the anterolateral and
 * posteromedial papillary muscles. Schematic, after Tawara and Tretter et al.
 * (Europace 2022); fascicle geometry varies between hearts.
 *
 * `septum` holds RV/LV septal vertex pairs ({ rvSide, lvSide }), `lvVerts`
 * the LV endocardial vertices. Returns null when a landmark is missing.
 */
export function measureLeftBundle({ hisEnd, hisFrom = null, septum, lvVerts, mitralCenter, lvApex, papillary, trunkLength = 0.38, lift = 0.03 }) {
  if (!hisEnd || !septum?.length || !lvVerts?.length || !mitralCenter || !lvApex) return null;
  const axis = lvApex.clone().sub(mitralCenter);
  const axisLength = axis.length();
  if (axisLength < 1e-3) return null;
  axis.divideScalar(axisLength);
  const onAxis = point => mitralCenter.clone().addScaledVector(axis, THREE.MathUtils.clamp(point.clone().sub(mitralCenter).dot(axis), 0, axisLength));
  // Lift wall points slightly into the cavity (subendocardial, still visible).
  const inward = point => point.clone().add(onAxis(point).sub(point).setLength(lift));
  const septalLv = target => septum.reduce((best, pair) =>
    pair.lvSide.distanceToSquared(target) < best.lvSide.distanceToSquared(target) ? pair : best).lvSide;
  const wallNear = target => {
    let best = lvVerts[0], bestD = Infinity;
    for (let i = 0; i < lvVerts.length; i += 2) {
      const d = lvVerts[i].distanceToSquared(target);
      if (d < bestD) { bestD = d; best = lvVerts[i]; }
    }
    return best;
  };

  // Fascicle targets: the posteromedial papillary base is measured; the
  // anterolateral one mirrors it across the septal-apical plane.
  const crossing = inward(septalLv(hisEnd));
  const septalDir = crossing.clone().sub(onAxis(crossing)).projectOnPlane(axis).normalize();
  const mirrorNormal = new THREE.Vector3().crossVectors(axis, septalDir).normalize();
  const papBase = papillary ? papillary.clone() : onAxis(crossing).addScaledVector(axis, axisLength * .45).addScaledVector(septalDir, -.4);
  const papLevel = onAxis(papBase);
  const papOffset = papBase.clone().sub(papLevel);
  const anteriorPap = papLevel.clone().add(papOffset.clone().sub(mirrorNormal.clone().multiplyScalar(2 * papOffset.dot(mirrorNormal))));

  // Trunk: crest -> LV septal subendocardium -> down the septum toward the
  // middle of the fascicular fan, so the fan continues its direction.
  const fanMid = papBase.clone().lerp(anteriorPap, .5);
  const trunkDir = fanMid.clone().sub(crossing).normalize();
  const trunkMid = inward(septalLv(crossing.clone().addScaledVector(trunkDir, trunkLength * .5)));
  const trunkEnd = inward(septalLv(crossing.clone().addScaledVector(trunkDir, trunkLength)));
  // Start inside the His (hidden in its tube) so the tangent is continuous
  // at the branching; the crossing to the LV side then happens gradually.
  const trunk = hisFrom ? [hisFrom.clone(), hisEnd.clone(), trunkMid, trunkEnd] : [hisEnd.clone(), crossing, trunkMid, trunkEnd];

  // Each fascicle is drawn from inside the trunk so the Catmull-Rom tangent
  // is continuous where it leaves the trunk end (no elbow at the branching).
  const fascicle = target => {
    const out = [trunkMid.clone(), trunkEnd.clone()];
    for (const k of [.35, .7]) out.push(inward(wallNear(trunkEnd.clone().lerp(target, k))));
    out.push(inward(wallNear(target)));
    return out;
  };
  const posterior = fascicle(papBase);
  const anterior = fascicle(anteriorPap);

  // Purkinje fans: from each fascicle end and the trunk end toward the apex.
  const toward = (from, share) => {
    const mid = inward(wallNear(from.clone().lerp(lvApex, share * .5)));
    return [from.clone(), mid, inward(wallNear(from.clone().lerp(lvApex, share)))];
  };
  const purkinje = [toward(anterior[anterior.length - 1], .6), toward(posterior[posterior.length - 1], .6)];
  return { trunk, anterior, posterior, purkinje, anteriorPapillary: anteriorPap };
}

/**
 * Right bundle branch measured on the atlas RV: it continues from the distal
 * His down the RV septal subendocardium (beneath the medial papillary muscle)
 * along the septomarginal trabeculation, then crosses the cavity in the
 * moderator band to the base of the anterior papillary muscle. The RV
 * Purkinje fan leaves the moderator band septal insertion toward the apex.
 */
export function measureRightBundle({ hisEnd, hisFrom = null, septum, rvVerts, rvCenter, rvApex, anteriorPapillary, lift = 0.03 }) {
  if (!hisEnd || !septum?.length || !rvVerts?.length || !rvCenter || !rvApex) return null;
  const inward = point => point.clone().add(rvCenter.clone().sub(point).setLength(lift));
  const septalRv = target => septum.reduce((best, pair) =>
    pair.rvSide.distanceToSquared(target) < best.rvSide.distanceToSquared(target) ? pair : best).rvSide;
  const wallNear = target => {
    let best = rvVerts[0], bestD = Infinity;
    for (let i = 0; i < rvVerts.length; i += 2) {
      const d = rvVerts[i].distanceToSquared(target);
      if (d < bestD) { bestD = d; best = rvVerts[i]; }
    }
    return best;
  };
  // Septal insertion of the moderator band: mid-to-apical septum.
  const band = inward(septalRv(hisEnd.clone().lerp(rvApex, .6)));
  const upper = inward(septalRv(hisEnd.clone().lerp(band, .3)));
  const lower = inward(septalRv(hisEnd.clone().lerp(band, .65)));
  const path = [...(hisFrom ? [hisFrom.clone()] : []), hisEnd.clone(), upper, lower, band];
  if (anteriorPapillary) {
    // The papillary base, not its head: the wall point under it.
    const papBase = inward(wallNear(anteriorPapillary));
    path.push(band.clone().lerp(papBase, .5), papBase);
  }
  const purkinje = [band.clone(), inward(wallNear(band.clone().lerp(rvApex, .5))), inward(wallNear(rvApex))];
  return { path, band, purkinje };
}

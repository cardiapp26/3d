import { boundaryLoops, centroid, inferiorCavalOstium, vesselCenterline, vesselPath } from './mesh-utils.js';

// Blood-flow routes measured from the atlas, keyed by FLOW_STREAMS id, so
// particles stay inside the chambers, great vessels, coronary arteries and
// cardiac veins they are drawn in. Cavity waypoints sit on the measured AV
// annulus axis (atrial side and ventricular side); vessel segments follow the
// vessel meshes themselves. A route that cannot be measured is left out and
// its stream keeps the schematic control points.

const SHELL = 0.12;
const ATRIAL_DEPTH = 1.2;       // atrial waypoint: this many annulus radii on the atrial side
const VENTRICULAR_DEPTH = 2.2;  // ventricular waypoint: this many radii into the ventricle

function smooth(points, passes = 2) {
  let pts = points;
  for (let pass = 0; pass < passes; pass++) {
    pts = pts.map((pt, i) => {
      if (i === 0 || i === pts.length - 1) return pt.clone();
      return pt.clone().multiplyScalar(2).add(pts[i - 1]).add(pts[i + 1]).multiplyScalar(0.25);
    });
  }
  return pts;
}

// End shells are partial caps whose centroids sit on the wall; drop them.
const inner = line => (line.length > 4 ? line.slice(1, -1) : line);

const route = (...parts) => {
  const points = parts.flat().filter(Boolean).map(point => point.clone());
  return points.length >= 4 ? smooth(points) : null;
};

function averageCenter(sourceCenter, ids) {
  const centers = ids.map(id => sourceCenter(id)).filter(Boolean);
  return centers.length ? centroid(centers.map(c => c.clone())) : null;
}

/** Cavity waypoints on each measured AV annulus axis. */
function chamberAnchors(getMeshes) {
  const frameOf = id => getMeshes(id)[0]?.userData?.frame || null;
  const along = (frame, depth) => frame.center.clone().addScaledVector(frame.normal, depth * frame.radius);
  const mitral = frameOf('mitral-annulus');
  const tricuspid = frameOf('tricuspid-annulus');
  return {
    la: mitral && along(mitral, -ATRIAL_DEPTH),
    mitral: mitral && mitral.center.clone(),
    lv: mitral && along(mitral, VENTRICULAR_DEPTH),
    ra: tricuspid && along(tricuspid, -ATRIAL_DEPTH),
    tricuspid: tricuspid && tricuspid.center.clone(),
    rv: tricuspid && along(tricuspid, VENTRICULAR_DEPTH)
  };
}

/** Open end of a vessel mesh farthest from `point` (its upstream end). */
function farEnd(mesh, point) {
  const loops = boundaryLoops(mesh, 4);
  if (!loops.length) return null;
  return loops.reduce((best, loop) =>
    loop.center.distanceTo(point) > best.center.distanceTo(point) ? loop : best).center;
}

function venousInflow({ getMeshes, getVesselTrim }, a) {
  const routes = {};
  if (!a.ra || !a.rv) return routes;
  const rightTail = [a.ra, a.tricuspid, a.rv];
  const svc = getMeshes('svc')[0];
  const svcStart = svc && farEnd(svc, a.ra);
  if (svcStart) routes['svc-ra-rv'] = route(vesselPath(svc, svcStart, a.ra), rightTail);
  // The atlas has no IVC mesh: IVC blood appears at its measured RA ostium
  // instead of running through empty space below the heart.
  const ostium = inferiorCavalOstium(getMeshes('ra')[0]);
  if (ostium) routes['ivc-ra-rv'] = route(ostium, ostium.clone().lerp(a.ra, 0.5), rightTail);
  if (!a.la || !a.lv) return routes;
  const leftTail = [a.la, a.mitral, a.lv];
  const veins = [
    ['lspv-la-lv', 'lspv', 'Left superior pulmonary vein'],
    ['lipv-la-lv', 'lipv', 'Left inferior pulmonary vein'],
    ['rspv-la-lv', 'rspv', 'Right superior pulmonary vein'],
    ['ripv-la-lv', 'ripv', 'Right inferior pulmonary vein']
  ];
  for (const [streamId, id, name] of veins) {
    const mesh = getMeshes(id)[0];
    const start = mesh && farEnd(mesh, a.la);
    if (!start) continue;
    let path = vesselPath(mesh, start, a.la);
    // Keep particles inside the displayed part of a trimmed vein.
    const trim = getVesselTrim(name);
    if (trim) path = path.filter(point => trim.distanceToPoint(point) > 0.05);
    routes[streamId] = route(path, leftTail);
  }
  return routes;
}

function aorticRoute({ sourceCenter, meshVertices }, a) {
  const valve = averageCenter(sourceCenter, ['lcc', 'rcc', 'ncc']);
  if (!valve || !a.lv) return null;
  const asc = inner(vesselCenterline(meshVertices('aorta', /ascending/i), valve, SHELL));
  if (asc.length < 3) return null;
  const arch = inner(vesselCenterline(meshVertices('aorta', /arch/i), asc[asc.length - 1], SHELL));
  if (arch.length < 3) return null;
  return route(a.lv, a.lv.clone().lerp(valve, 0.5), valve, asc, arch);
}

function pulmonaryRoutes({ sourceCenter, meshVertices, getVesselTrim }, a) {
  const valve = sourceCenter('pulmonary-valve');
  const bifurcationVerts = meshVertices('pa', /bifurcation/i);
  if (!valve || !a.rv || !bifurcationVerts.length) return {};
  const bifurcation = centroid(bifurcationVerts.map(v => v.clone()));
  const trunk = inner(vesselCenterline(meshVertices('pa', /^pulmonary trunk$/i), valve, SHELL));
  const branch = (pattern, trimName) => {
    let line = inner(vesselCenterline(meshVertices('pa', pattern), bifurcation, SHELL));
    // Keep particles inside the displayed part of a trimmed branch.
    const trim = getVesselTrim(trimName);
    if (trim) line = line.filter(point => trim.distanceToPoint(point) > 0.08);
    return line.length >= 3 ? route(a.rv, a.rv.clone().lerp(valve, 0.5), valve, trunk, bifurcation, line) : null;
  };
  return {
    'rv-pa-left': branch(/left pulmonary artery/i, 'Left pulmonary artery'),
    'rv-pa-right': branch(/right pulmonary artery/i, 'Right pulmonary artery')
  };
}

/** Aortic root -> coronary artery lumen, along the longest run of each tree. */
function coronaryRoutes({ sourceCenter, getMeshes }) {
  const root = averageCenter(sourceCenter, ['lcc', 'rcc', 'ncc']);
  if (!root) return {};
  const routes = {};
  const lmMesh = getMeshes('lm')[0];
  const lm = lmMesh ? vesselPath(lmMesh, root) : [];
  if (lm.length >= 2) {
    const bifurcation = lm[lm.length - 1];
    for (const [streamId, id] of [['coronary-lad', 'lad'], ['coronary-lcx', 'lcx']]) {
      const mesh = getMeshes(id)[0];
      if (mesh) routes[streamId] = route(lm, vesselPath(mesh, bifurcation));
    }
  }
  const rcaMesh = getMeshes('rca')[0];
  const rightOstium = sourceCenter('rcc');
  if (rcaMesh && rightOstium) routes['coronary-rca'] = route(vesselPath(rcaMesh, rightOstium));
  return routes;
}

/** Cardiac vein lumen -> coronary sinus -> its right atrial ostium. */
function cardiacVeinRoutes({ getMeshes }, a) {
  const csMesh = getMeshes('cs')[0];
  if (!csMesh || !a.ra) return {};
  const loops = boundaryLoops(csMesh, 4);
  if (loops.length < 2) return {};
  const ostium = loops.reduce((best, loop) =>
    loop.center.distanceTo(a.ra) < best.center.distanceTo(a.ra) ? loop : best).center;
  const distal = farEnd(csMesh, ostium);
  const sinus = vesselPath(csMesh, distal, ostium);
  if (sinus.length < 2) return {};
  const drain = veinEnd => {
    const join = sinus.reduce((best, point, i) =>
      point.distanceTo(veinEnd) < sinus[best].distanceTo(veinEnd) ? i : best, 0);
    return [...sinus.slice(join), a.ra];
  };
  const routes = {};
  // Where each vein meets the sinus: GCV at its distal end, MCV at the
  // ostium, the inferior LV vein along its body.
  const junctions = [
    ['coronary-gcv', 'gcv', distal],
    ['coronary-mcv', 'mcv', ostium],
    ['coronary-piv', 'piv', sinus[Math.floor(sinus.length / 2)]]
  ];
  for (const [streamId, id, junction] of junctions) {
    const mesh = getMeshes(id)[0];
    if (!mesh) continue;
    // Walk from the sinus to the vein's farthest tributary, then reverse to follow the blood.
    const vein = vesselPath(mesh, junction).reverse();
    if (vein.length >= 2) routes[streamId] = route(vein, drain(vein[vein.length - 1]));
  }
  return routes;
}

/**
 * Measured control points keyed by FLOW_STREAMS id.
 * @param {{ sourceCenter: Function, meshVertices: Function, getMeshes?: Function, getVesselTrim?: Function }} helpers
 * @returns {Record<string, THREE.Vector3[]>}
 */
export function measuredFlowRoutes(helpers) {
  const full = { getMeshes: () => [], getVesselTrim: () => null, ...helpers };
  const anchors = chamberAnchors(full.getMeshes);
  const routes = {
    ...venousInflow(full, anchors),
    'lv-aorta': aorticRoute(full, anchors),
    ...pulmonaryRoutes(full, anchors),
    ...coronaryRoutes(full),
    ...cardiacVeinRoutes(full, anchors)
  };
  return Object.fromEntries(Object.entries(routes).filter(([, points]) => points && points.length >= 4));
}

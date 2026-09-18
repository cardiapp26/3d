import * as THREE from 'three';
import { centroid, sharedRim, ringNormal } from './mesh-utils.js';

/**
 * Procedural 3D Anatomical Valve Annuli (Mitral & Tricuspid), the aorto-mitral
 * continuity (AMC) and the AV leaflets missing from the atlas GLB.
 * Annulus curves are measured from the atlas leaflet hinge vertices (the
 * per-sector leaflet edge nearest the atrium) instead of parametric ellipses;
 * everything remains schematic and is flagged provenance:'schematic'.
 */
export function createAnnuli(helpers) {
  const { sourceCenter, register = () => {}, meshVertices = () => [], getMeshes = () => [] } = helpers;
  const group = new THREE.Group();
  group.name = 'Valve Annuli';

  const matAnnulus = new THREE.MeshStandardMaterial({
    color: 0xf5f3ea,
    roughness: 0.35,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  const matLeaflet = new THREE.MeshStandardMaterial({
    color: 0xe2d5c4,
    roughness: 0.55,
    metalness: 0.03,
    side: THREE.DoubleSide
  });

  const meshes = [];

  function addMesh(mesh, id, name, sourceName, extra = {}) {
    mesh.name = name;
    mesh.userData = { id, layer: 'valves', sourceName, provenance: 'schematic', ...extra };
    group.add(mesh);
    meshes.push(mesh);
    register(mesh, id);
    return mesh;
  }

  function build() {
    const mitralCenter = sourceCenter('mitral') || new THREE.Vector3(0.48, -0.31, -0.50);
    const tricuspidCenter = sourceCenter('tricuspid') || new THREE.Vector3(-0.45, -0.35, 0.15);
    const la = sourceCenter('la') || new THREE.Vector3(-0.05, 0.27, -0.37);
    const ra = sourceCenter('ra') || new THREE.Vector3(-1.03, 0.13, 0.12);
    const lv = sourceCenter('lv') || new THREE.Vector3(0.65, -0.75, 0.05);
    const rv = sourceCenter('rv') || new THREE.Vector3(-0.4, -0.9, 0.5);
    const lcc = sourceCenter('lcc') || new THREE.Vector3(-0.06, 0.74, -0.08);
    const ncc = sourceCenter('ncc') || new THREE.Vector3(-0.36, 0.65, -0.14);
    const rootMid = lcc.clone().add(ncc).multiplyScalar(0.5);

    // -------------------------------------------------------------
    // 1+2. Annulus rings on the REAL orifice rims: the boundary loops the
    //      atrium and ventricle meshes share at each AV valve.
    // -------------------------------------------------------------
    const mitralRim = sharedRim(getMeshes('la')[0], getMeshes('lv')[0]);
    const tvRim = sharedRim(getMeshes('ra')[0], getMeshes('rv')[0]);

    const fallbackRing = (center, rx, rz) => {
      const pts = [];
      for (let i = 0; i < 32; i++) {
        const t = (i / 32) * Math.PI * 2;
        pts.push(new THREE.Vector3(center.x + Math.sin(t) * rx, center.y + 0.08, center.z + Math.cos(t) * rz));
      }
      return pts;
    };
    const maPoints = mitralRim || fallbackRing(mitralCenter, 0.5, 0.44);
    const taPoints = tvRim || fallbackRing(tricuspidCenter, 0.55, 0.48);

    const maCurve = new THREE.CatmullRomCurve3(maPoints, true);
    addMesh(
      new THREE.Mesh(new THREE.TubeGeometry(maCurve, 96, 0.032, 12, true), matAnnulus.clone()),
      'mitral-annulus', 'Mitral annulus', 'Mitral valve fibrous annulus'
    );
    const taCurve = new THREE.CatmullRomCurve3(taPoints, true);
    addMesh(
      new THREE.Mesh(new THREE.TubeGeometry(taCurve, 96, 0.032, 12, true), matAnnulus.clone()),
      'tricuspid-annulus', 'Tricuspid annulus', 'Tricuspid valve fibrous annulus'
    );

    const maCentroid = centroid(maPoints);
    const taCentroid = centroid(taPoints);
    const mitralAxis = ringNormal(maPoints, lv.clone().sub(la));
    const tvAxis = ringNormal(taPoints, rv.clone().sub(ra));

    // -------------------------------------------------------------
    // 3. Aorto-mitral continuity (AMC): continuation of the anteromedial
    //    mitral annulus (the rim arc nearest the aortic root) to the valve.
    // -------------------------------------------------------------
    const maSamples = [];
    for (let i = 0; i < 64; i++) maSamples.push(maCurve.getPointAt(i / 63));
    let bestStart = 0, bestDist = Infinity;
    maSamples.forEach((pt, i) => {
      const d = pt.distanceTo(rootMid);
      if (d < bestDist) { bestDist = d; bestStart = i; }
    });
    const span = 9;
    const bottomPts = [];
    for (let k = -span; k <= span; k++) bottomPts.push(maSamples[(bestStart + k + 64) % 64].clone());
    const bottomCurve = new THREE.CatmullRomCurve3(bottomPts);

    const topCurve = new THREE.CatmullRomCurve3([
      ncc.clone().add(new THREE.Vector3(0, -0.05, 0)),
      rootMid.clone().add(new THREE.Vector3(0, 0.1, 0)),
      lcc.clone().add(new THREE.Vector3(0, -0.05, 0))
    ]);

    const uSeg = 24, vSeg = 8;
    const positions = [], indices = [];
    for (let vi = 0; vi <= vSeg; vi++) {
      const v = vi / vSeg;
      for (let ui = 0; ui <= uSeg; ui++) {
        const pt = bottomCurve.getPointAt(ui / uSeg).lerp(topCurve.getPointAt(ui / uSeg), v);
        positions.push(pt.x, pt.y + Math.sin(v * Math.PI) * 0.04, pt.z);
      }
    }
    for (let vi = 0; vi < vSeg; vi++) {
      for (let ui = 0; ui < uSeg; ui++) {
        const a = vi * (uSeg + 1) + ui;
        indices.push(a, a + 1, a + uSeg + 1, a + 1, a + uSeg + 2, a + uSeg + 1);
      }
    }
    const amcGeom = new THREE.BufferGeometry();
    amcGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    amcGeom.setIndex(indices);
    amcGeom.computeVertexNormals();
    const amcMat = matAnnulus.clone();
    amcMat.transparent = true;
    amcMat.opacity = 0.82;
    addMesh(new THREE.Mesh(amcGeom, amcMat), 'amc', 'Aorto-mitral continuity', 'Aorto-mitral continuity (fibrous curtain)');

    // -------------------------------------------------------------
    // 4. AV leaflets missing from the atlas: clone the opposite atlas leaflet
    //    (chordae included) and rotate it about the measured rim axis into the
    //    empty sector; rotation keeps the hinge on the annulus ring.
    // -------------------------------------------------------------
    function rotatedLeaflet(sourceMesh, center, axis, targetDir) {
      if (!sourceMesh) return null;
      const geom = sourceMesh.geometry.clone();
      geom.computeBoundingBox();
      const srcCenter = geom.boundingBox.getCenter(new THREE.Vector3());
      const flatten = v => v.clone().sub(center).addScaledVector(axis, -v.clone().sub(center).dot(axis));
      const from = flatten(srcCenter);
      const to = targetDir.clone().addScaledVector(axis, -targetDir.dot(axis));
      if (from.lengthSq() < 1e-6 || to.lengthSq() < 1e-6) return null;
      from.normalize();
      to.normalize();
      let angle = Math.acos(THREE.MathUtils.clamp(from.dot(to), -1, 1));
      if (new THREE.Vector3().crossVectors(from, to).dot(axis) < 0) angle = -angle;
      const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
      const M = new THREE.Matrix4().makeTranslation(center.x, center.y, center.z)
        .multiply(new THREE.Matrix4().makeRotationFromQuaternion(q))
        .multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
      geom.applyMatrix4(M);
      geom.computeVertexNormals();
      return new THREE.Mesh(geom, matLeaflet.clone());
    }

    // Empty rim sector = rim samples farthest from the existing leaflet.
    function gapDirection(ringCurve, ringCentroid, leafletVerts) {
      const samples = [];
      for (let i = 0; i <= 96; i++) samples.push(ringCurve.getPointAt(i / 96));
      const gapScore = samples.map(pt => {
        let best = Infinity;
        for (let i = 0; i < leafletVerts.length; i += 3) {
          const d = leafletVerts[i].distanceTo(pt);
          if (d < best) best = d;
        }
        return best;
      });
      let gapCenter = 0, best = -1;
      for (let i = 0; i <= 96; i++) {
        let acc = 0;
        for (let k = -12; k <= 12; k++) acc += gapScore[(i + k + 97) % 97];
        if (acc > best) { best = acc; gapCenter = i; }
      }
      return samples[gapCenter].clone().sub(ringCentroid);
    }

    const pmlMesh = getMeshes('mitral').find(m => /Posterior leaflet/i.test(m.name));
    const mitralLeafletVerts = meshVertices('mitral', /Posterior leaflet/i);
    if (pmlMesh && mitralLeafletVerts.length) {
      const aml = rotatedLeaflet(pmlMesh, maCentroid, mitralAxis, gapDirection(maCurve, maCentroid, mitralLeafletVerts));
      if (aml) {
        addMesh(aml, 'mitral', 'Anterior mitral leaflet (schematic)', 'Anterior mitral leaflet', { leaflet: 'anterior' });
      }
    }

    // Tricuspid empty sector: rim samples farthest from the existing leaflets.
    const tvVerts = meshVertices('tricuspid', /leaflet of right atrioventricular/i);
    if (tvVerts.length) {
      const tvInferiorMesh = getMeshes('tricuspid').find(m => /Inferior leaflet/i.test(m.name));
      const tvAnterior = rotatedLeaflet(tvInferiorMesh, taCentroid, tvAxis, gapDirection(taCurve, taCentroid, tvVerts));
      if (tvAnterior) {
        addMesh(tvAnterior, 'tricuspid', 'Anterior tricuspid leaflet (schematic)', 'Anterior tricuspid leaflet', { leaflet: 'anterior' });
      }
    }
  }

  return {
    group,
    build,
    meshes
  };
}

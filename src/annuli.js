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
    // 4. AV leaflets missing from the atlas (anterior mitral, anterior
    //    tricuspid): sails lofted directly off the measured rim arc. The base
    //    edge lies exactly on the annulus ring; the free edge bows toward the
    //    orifice center and drops toward the ventricle. Cloning the opposite
    //    leaflet (with its chordae) kept reading as a solid lid.
    // -------------------------------------------------------------
    function gapParam(ringCurve, leafletVerts) {
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
      return gapCenter / 96;
    }

    function sailLeaflet(ringCurve, ringCentroid, axis, tCenter, spanFrac, reach, drop) {
      const uSeg = 26, vSeg = 10;
      const positions = [], indices = [];
      for (let vi = 0; vi <= vSeg; vi++) {
        const v = vi / vSeg;
        for (let ui = 0; ui <= uSeg; ui++) {
          const u = ui / uSeg;
          const t = ((tCenter - spanFrac / 2 + spanFrac * u) % 1 + 1) % 1;
          const base = ringCurve.getPointAt(t);
          // Horizontal pull toward the orifice center, strongest mid-arc.
          const inward = ringCentroid.clone().sub(base);
          inward.addScaledVector(axis, -inward.dot(axis));
          const shape = Math.sin(Math.PI * u);
          const pt = base.clone()
            .addScaledVector(inward, v * reach * shape)
            .addScaledVector(axis, v * drop * (0.35 + 0.65 * shape));
          positions.push(pt.x, pt.y, pt.z);
        }
      }
      for (let vi = 0; vi < vSeg; vi++) {
        for (let ui = 0; ui < uSeg; ui++) {
          const a = vi * (uSeg + 1) + ui;
          indices.push(a, a + 1, a + uSeg + 1, a + 1, a + uSeg + 2, a + uSeg + 1);
        }
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setIndex(indices);
      geom.computeVertexNormals();
      return new THREE.Mesh(geom, matLeaflet.clone());
    }

    const mitralLeafletVerts = meshVertices('mitral', /Posterior leaflet/i);
    if (mitralLeafletVerts.length) {
      const t = gapParam(maCurve, mitralLeafletVerts);
      const aml = sailLeaflet(maCurve, maCentroid, mitralAxis, t, 0.42, 0.85, 0.30);
      addMesh(aml, 'mitral', 'Anterior mitral leaflet (schematic)', 'Anterior mitral leaflet', { leaflet: 'anterior' });
    }

    const tvVerts = meshVertices('tricuspid', /leaflet of right atrioventricular/i);
    if (tvVerts.length) {
      const t = gapParam(taCurve, tvVerts);
      const tvAnterior = sailLeaflet(taCurve, taCentroid, tvAxis, t, 0.36, 0.70, 0.26);
      addMesh(tvAnterior, 'tricuspid', 'Anterior tricuspid leaflet (schematic)', 'Anterior tricuspid leaflet', { leaflet: 'anterior' });
    }
  }

  return {
    group,
    build,
    meshes
  };
}

import * as THREE from 'three';

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

  function centroid(points) {
    return points.reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / points.length);
  }

  /**
   * Measure an AV annulus from leaflet vertices: bin them by angle around the
   * valve axis (atrium -> ventricle) and keep, per sector, the vertex nearest
   * the atrium (the hinge). Sectors without a leaflet stay empty and are
   * bridged smoothly by the closed spline.
   */
  function measureAnnulus(verts, atriumCenter, ventricleCenter, bins = 36) {
    if (verts.length < 60) return null;
    const c = centroid(verts);
    const axis = ventricleCenter.clone().sub(atriumCenter).normalize();
    let u = new THREE.Vector3(0, 1, 0).cross(axis);
    if (u.lengthSq() < 0.01) u = new THREE.Vector3(1, 0, 0).cross(axis);
    u.normalize();
    const w = new THREE.Vector3().crossVectors(axis, u);

    const binBest = new Array(bins).fill(null);
    for (const v of verts) {
      const d = v.clone().sub(c);
      const angle = Math.atan2(d.dot(w), d.dot(u));
      const bi = ((Math.round(((angle + Math.PI) / (2 * Math.PI)) * bins)) % bins + bins) % bins;
      const h = d.dot(axis); // smaller = closer to the atrium = hinge side
      if (!binBest[bi] || h < binBest[bi].h) binBest[bi] = { v: v.clone(), h, bi };
    }
    const kept = binBest.filter(Boolean);
    if (kept.length < 10) return null;
    // Reorder into one contiguous arc: start right after the largest angular
    // gap, otherwise the point sequence jumps across the missing sector and
    // the spline cuts straight through the valve orifice.
    kept.sort((a, b) => a.bi - b.bi);
    let gapAfter = 0, gapSize = -1;
    for (let i = 0; i < kept.length; i++) {
      const next = kept[(i + 1) % kept.length];
      const delta = ((next.bi - kept[i].bi) + bins) % bins || bins;
      if (delta > gapSize) { gapSize = delta; gapAfter = i; }
    }
    return [...kept.slice(gapAfter + 1), ...kept.slice(0, gapAfter + 1)];
  }

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
    // 1. Mitral annulus: posterior arc measured from the posterior leaflet
    //    hinge; the anterior segment is anchored toward the aortic root (AMC).
    // -------------------------------------------------------------
    const mitralVerts = meshVertices('mitral', /Posterior leaflet/i);
    const mitralKept = measureAnnulus(mitralVerts, la, lv);
    let maPoints;
    if (mitralKept) {
      maPoints = mitralKept.map(k => k.v);
      const anteriorAnchor = rootMid.clone().lerp(mitralCenter, 0.35).add(new THREE.Vector3(0, -0.12, 0));
      const first = maPoints[0], last = maPoints[maPoints.length - 1];
      maPoints = [...maPoints,
        last.clone().lerp(anteriorAnchor, 0.5),
        anteriorAnchor,
        first.clone().lerp(anteriorAnchor, 0.5)
      ];
    } else {
      maPoints = [];
      for (let i = 0; i < 32; i++) {
        const theta = (i / 32) * Math.PI * 2;
        let z = Math.cos(theta) * 0.44;
        if (z > 0.12) z = 0.12 + (z - 0.12) * 0.35;
        maPoints.push(new THREE.Vector3(
          mitralCenter.x + Math.sin(theta) * 0.52,
          mitralCenter.y + 0.10 + Math.cos(theta * 2) * 0.08,
          mitralCenter.z + z
        ));
      }
    }
    const maCurve = new THREE.CatmullRomCurve3(maPoints, true);
    addMesh(
      new THREE.Mesh(new THREE.TubeGeometry(maCurve, 64, 0.034, 12, true), matAnnulus.clone()),
      'mitral-annulus', 'Mitral annulus', 'Mitral valve fibrous annulus'
    );

    // -------------------------------------------------------------
    // 2. Tricuspid annulus: measured from the septal + inferior leaflet
    //    hinges; the anterior sector is bridged by the closed spline.
    // -------------------------------------------------------------
    const tvVerts = meshVertices('tricuspid', /leaflet of right atrioventricular/i);
    const tvKept = measureAnnulus(tvVerts, ra, rv);
    let taCurve, tvGapArc = null;
    if (tvKept) {
      taCurve = new THREE.CatmullRomCurve3(tvKept.map(k => k.v), true);
      // Uncovered (anterior) sector: samples of the closed curve farthest from
      // any existing leaflet vertex.
      const samples = [];
      for (let i = 0; i <= 96; i++) samples.push(taCurve.getPointAt(i / 96));
      const gapScore = samples.map(pt => {
        let best = Infinity;
        for (let i = 0; i < tvVerts.length; i += 3) {
          const d = tvVerts[i].distanceTo(pt);
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
      const arcPts = [];
      for (let k = -14; k <= 14; k++) arcPts.push(samples[(gapCenter + k + 97) % 97].clone());
      tvGapArc = new THREE.CatmullRomCurve3(arcPts);
    } else {
      const taPoints = [];
      for (let i = 0; i < 32; i++) {
        const theta = (i / 32) * Math.PI * 2;
        const x = Math.sin(theta) * 0.58, z = Math.cos(theta) * 0.48;
        taPoints.push(new THREE.Vector3(
          tricuspidCenter.x + x * 0.92 - z * 0.25,
          tricuspidCenter.y + 0.08 + Math.sin(theta + 0.4) * 0.12,
          tricuspidCenter.z + x * 0.25 + z * 0.92
        ));
      }
      taCurve = new THREE.CatmullRomCurve3(taPoints, true);
    }
    addMesh(
      new THREE.Mesh(new THREE.TubeGeometry(taCurve, 64, 0.034, 12, true), matAnnulus.clone()),
      'tricuspid-annulus', 'Tricuspid annulus', 'Tricuspid valve fibrous annulus'
    );

    // -------------------------------------------------------------
    // 3. Aorto-mitral continuity (AMC): continuation of the anteromedial
    //    mitral annulus to the aortic valve.
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
    //    tricuspid): clone the opposite atlas leaflet (chordae included) and
    //    mirror it across a vertical plane through the valve centroid, so the
    //    sail occupies the empty sector with matching texture and drape.
    // -------------------------------------------------------------
    function mirroredLeaflet(sourceMesh, valveCenter) {
      if (!sourceMesh) return null;
      const geom = sourceMesh.geometry.clone();
      geom.computeBoundingBox();
      const srcCenter = geom.boundingBox.getCenter(new THREE.Vector3());
      const n = srcCenter.clone().sub(valveCenter);
      n.y = 0;
      if (n.lengthSq() < 1e-6) return null;
      n.normalize();
      const R = new THREE.Matrix4().set(
        1 - 2 * n.x * n.x, -2 * n.x * n.y, -2 * n.x * n.z, 0,
        -2 * n.y * n.x, 1 - 2 * n.y * n.y, -2 * n.y * n.z, 0,
        -2 * n.z * n.x, -2 * n.z * n.y, 1 - 2 * n.z * n.z, 0,
        0, 0, 0, 1
      );
      const M = new THREE.Matrix4().makeTranslation(valveCenter.x, valveCenter.y, valveCenter.z)
        .multiply(R)
        .multiply(new THREE.Matrix4().makeTranslation(-valveCenter.x, -valveCenter.y, -valveCenter.z));
      geom.applyMatrix4(M);
      geom.computeVertexNormals();
      return new THREE.Mesh(geom, matLeaflet.clone());
    }

    const pmlMesh = getMeshes('mitral').find(m => /Posterior leaflet/i.test(m.name));
    const aml = mirroredLeaflet(pmlMesh, mitralCenter);
    if (aml) {
      addMesh(aml, 'mitral', 'Anterior mitral leaflet (schematic)', 'Anterior mitral leaflet', { leaflet: 'anterior' });
    }

    const tvInferiorMesh = getMeshes('tricuspid').find(m => /Inferior leaflet/i.test(m.name));
    const tvAnterior = mirroredLeaflet(tvInferiorMesh, tricuspidCenter);
    if (tvAnterior) {
      addMesh(tvAnterior, 'tricuspid', 'Anterior tricuspid leaflet (schematic)', 'Anterior tricuspid leaflet', { leaflet: 'anterior' });
    }
  }

  return {
    group,
    build,
    meshes
  };
}

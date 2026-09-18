import * as THREE from 'three';

/**
 * Procedural 3D Anatomical Valve Annuli (Mitral & Tricuspid Fibröz Halkaları).
 * Mitral Annulus: D-shaped saddle fibrous ring between LA and LV (anterior fibrous aorto-mitral curtain & posterior muscular saddle).
 * Tricuspid Annulus: Non-planar elliptical fibrous ring between RA and RV.
 */
export function createAnnuli(helpers) {
  const { sourceCenter, register = () => {}, meshVertices = () => [] } = helpers;
  const group = new THREE.Group();
  group.name = 'Valve Annuli';

  const matAnnulus = new THREE.MeshStandardMaterial({
    color: 0xf5f3ea,
    roughness: 0.35,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  const meshes = [];

  function build() {
    const mitralCenter = sourceCenter('mitral') || new THREE.Vector3(0.48, -0.31, -0.50);
    const tricuspidCenter = sourceCenter('tricuspid') || new THREE.Vector3(-0.45, -0.35, 0.15);

    // -------------------------------------------------------------
    // 1. Mitral Annulus (D-shaped saddle ring)
    // -------------------------------------------------------------
    // Saddle shape: high points anteriorly and posteriorly, low points at commissures.
    // D-shape: straight anterior border (aorto-mitral continuity) and curved posterior border.
    const maPoints = [];
    const numPoints = 32;
    const rX = 0.52;
    const rZ = 0.44;

    for (let i = 0; i < numPoints; i++) {
      const theta = (i / numPoints) * Math.PI * 2;
      let x = Math.sin(theta) * rX;
      let z = Math.cos(theta) * rZ;

      // Flatten anterior portion to create the anatomical 'D' shape
      if (z > 0.12) {
        z = 0.12 + (z - 0.12) * 0.35;
      }

      // Saddle height modulation (peaks anterior and posterior, troughs laterally/commissural)
      const saddleY = Math.cos(theta * 2) * 0.08;

      maPoints.push(new THREE.Vector3(
        mitralCenter.x + x,
        mitralCenter.y + 0.10 + saddleY,
        mitralCenter.z + z
      ));
    }

    const maCurve = new THREE.CatmullRomCurve3(maPoints, true);
    const maTubeGeom = new THREE.TubeGeometry(maCurve, 48, 0.038, 12, true);
    const maMesh = new THREE.Mesh(maTubeGeom, matAnnulus.clone());
    maMesh.name = 'Mitral annulus';
    maMesh.userData = {
      id: 'mitral-annulus',
      layer: 'valves',
      sourceName: 'Mitral valve fibrous annulus',
      provenance: 'schematic'
    };
    group.add(maMesh);
    meshes.push(maMesh);
    register(maMesh, 'mitral-annulus');

    // -------------------------------------------------------------
    // 2. Tricuspid Annulus (Non-planar elliptical ring)
    // -------------------------------------------------------------
    const taPoints = [];
    const taNumPoints = 32;
    const taRadiusX = 0.58;
    const taRadiusZ = 0.48;

    for (let i = 0; i < taNumPoints; i++) {
      const theta = (i / taNumPoints) * Math.PI * 2;
      const x = Math.sin(theta) * taRadiusX;
      const z = Math.cos(theta) * taRadiusZ;

      // Anteroseptal and posteroseptal contour
      const taSaddleY = Math.sin(theta + 0.4) * 0.12;

      // Rotate slightly to align with right AV groove tilt
      const tiltedX = x * 0.92 - z * 0.25;
      const tiltedZ = x * 0.25 + z * 0.92;

      taPoints.push(new THREE.Vector3(
        tricuspidCenter.x + tiltedX,
        tricuspidCenter.y + 0.08 + taSaddleY,
        tricuspidCenter.z + tiltedZ
      ));
    }

    const taCurve = new THREE.CatmullRomCurve3(taPoints, true);
    const taTubeGeom = new THREE.TubeGeometry(taCurve, 48, 0.038, 12, true);
    const taMesh = new THREE.Mesh(taTubeGeom, matAnnulus.clone());
    taMesh.name = 'Tricuspid annulus';
    taMesh.userData = {
      id: 'tricuspid-annulus',
      layer: 'valves',
      sourceName: 'Tricuspid valve fibrous annulus',
      provenance: 'schematic'
    };
    group.add(taMesh);
    meshes.push(taMesh);
    register(taMesh, 'tricuspid-annulus');

    // -------------------------------------------------------------
    // 3. Aorto-mitral continuity (AMC): the fibrous curtain continuing the
    //    anteromedial aspect of the mitral annulus up to the aortic valve.
    // -------------------------------------------------------------
    const lcc = sourceCenter('lcc') || new THREE.Vector3(-0.06, 0.74, -0.08);
    const ncc = sourceCenter('ncc') || new THREE.Vector3(-0.36, 0.65, -0.14);

    // Bottom edge: the anteromedial third of the mitral annulus, i.e. the arc
    // of annulus points closest to the aortic root.
    const rootMid = lcc.clone().add(ncc).multiplyScalar(0.5);
    const samples = [];
    for (let i = 0; i < 64; i++) samples.push(maCurve.getPointAt(i / 63));
    let bestStart = 0, bestDist = Infinity;
    for (let i = 0; i < 64; i++) {
      if (samples[i].distanceTo(rootMid) < bestDist) { bestDist = samples[i].distanceTo(rootMid); bestStart = i; }
    }
    const span = 11; // ~1/3 of the annulus circumference on each side combined
    const bottomPts = [];
    for (let k = -span; k <= span; k++) bottomPts.push(samples[(bestStart + k + 64) % 64].clone());
    const bottomCurve = new THREE.CatmullRomCurve3(bottomPts);

    // Top edge: arc across the aortic annulus from the NCC toward the LCC.
    const topRise = rootMid.clone().add(new THREE.Vector3(0, 0.1, 0));
    const topCurve = new THREE.CatmullRomCurve3([
      ncc.clone().add(new THREE.Vector3(0, -0.05, 0)),
      topRise,
      lcc.clone().add(new THREE.Vector3(0, -0.05, 0))
    ]);

    // Loft the two edges into a curtain with a gentle anterior bow.
    const uSeg = 24, vSeg = 8;
    const positions = [];
    const indices = [];
    for (let vi = 0; vi <= vSeg; vi++) {
      const v = vi / vSeg;
      for (let ui = 0; ui <= uSeg; ui++) {
        const u = ui / uSeg;
        const pt = bottomCurve.getPointAt(u).lerp(topCurve.getPointAt(u), v);
        const bow = Math.sin(v * Math.PI) * 0.04;
        positions.push(pt.x, pt.y + bow, pt.z);
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
    const amcMesh = new THREE.Mesh(amcGeom, amcMat);
    amcMesh.name = 'Aorto-mitral continuity';
    amcMesh.userData = {
      id: 'amc',
      layer: 'valves',
      sourceName: 'Aorto-mitral continuity (fibrous curtain)',
      provenance: 'schematic'
    };
    group.add(amcMesh);
    meshes.push(amcMesh);
    register(amcMesh, 'amc');

    // -------------------------------------------------------------
    // 4. Missing AV leaflets (the atlas GLB ships no anterior mitral and no
    //    anterior/superior tricuspid leaflet). Modeled as schematic sails
    //    lofted from the annulus arc to a coaptation point.
    // -------------------------------------------------------------
    const matLeaflet = new THREE.MeshStandardMaterial({
      color: 0xe2d5c4,
      roughness: 0.55,
      metalness: 0.03,
      side: THREE.DoubleSide
    });

    function loftLeaflet(arcCurve, tip, belly) {
      const uSeg = 22, vSeg = 8;
      const positions = [], indices = [];
      for (let vi = 0; vi <= vSeg; vi++) {
        const v = vi / vSeg;
        for (let ui = 0; ui <= uSeg; ui++) {
          const u = ui / uSeg;
          const pt = arcCurve.getPointAt(u).lerp(tip, v);
          const sag = Math.sin(v * Math.PI) * Math.sin(u * Math.PI) * belly;
          positions.push(pt.x, pt.y - sag, pt.z);
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

    // Anterior mitral leaflet: hangs from the same anteromedial annulus arc as
    // the AMC and coapts below the annular plane toward the posterior leaflet.
    const amlTip = mitralCenter.clone().add(new THREE.Vector3(0, -0.22, 0));
    const aml = loftLeaflet(bottomCurve, amlTip, 0.05);
    aml.name = 'Anterior mitral leaflet (schematic)';
    aml.userData = { id: 'mitral', leaflet: 'anterior', layer: 'valves', sourceName: 'Anterior mitral leaflet', provenance: 'schematic' };
    group.add(aml);
    meshes.push(aml);
    register(aml, 'mitral');

    // Anterior (anterosuperior) tricuspid leaflet: fills the annulus sector the
    // atlas leaflets leave uncovered, found by distance to their vertices.
    const tvVerts = meshVertices('tricuspid');
    if (tvVerts.length) {
      const tvSamples = [];
      for (let i = 0; i < 48; i++) tvSamples.push(taCurve.getPointAt(i / 47));
      const gapScore = tvSamples.map(pt => {
        let best = Infinity;
        for (let i = 0; i < tvVerts.length; i += 4) {
          const d = tvVerts[i].distanceTo(pt);
          if (d < best) best = d;
        }
        return best;
      });
      let gapCenter = 0, bestScore = -1;
      for (let i = 0; i < 48; i++) {
        let windowScore = 0;
        for (let k = -7; k <= 7; k++) windowScore += gapScore[(i + k + 48) % 48];
        if (windowScore > bestScore) { bestScore = windowScore; gapCenter = i; }
      }
      const arcPts = [];
      for (let k = -8; k <= 8; k++) arcPts.push(tvSamples[(gapCenter + k + 48) % 48].clone());
      const tvArc = new THREE.CatmullRomCurve3(arcPts);
      const tvTip = tricuspidCenter.clone().add(new THREE.Vector3(0, -0.2, 0));
      const tvAnterior = loftLeaflet(tvArc, tvTip, 0.05);
      tvAnterior.name = 'Anterior tricuspid leaflet (schematic)';
      tvAnterior.userData = { id: 'tricuspid', leaflet: 'anterior', layer: 'valves', sourceName: 'Anterior tricuspid leaflet', provenance: 'schematic' };
      group.add(tvAnterior);
      meshes.push(tvAnterior);
      register(tvAnterior, 'tricuspid');
    }
  }

  return {
    group,
    build,
    meshes
  };
}

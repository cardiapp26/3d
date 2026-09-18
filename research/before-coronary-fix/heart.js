import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Realistic Anatomical Heart Studio
export function createHeart(container, onSelect = () => {}, onHover = () => {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 100);
  camera.position.set(0, 0.4, 7.8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0a1417, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 3.0;
  controls.maxDistance = 14;
  controls.target.set(0, 0, 0);

  // Cinematic Clinical Lighting: Key, Fill, Rim & Ambient
  scene.add(new THREE.HemisphereLight(0xe8f4f8, 0x221314, 1.8));

  const keyLight = new THREE.DirectionalLight(0xfff5ea, 3.8);
  keyLight.position.set(4, 5, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x7ec8e3, 2.2);
  fillLight.position.set(-5, 2, 4);
  scene.add(fillLight);

  const backRimLight = new THREE.DirectionalLight(0xffffff, 2.6);
  backRimLight.position.set(0, 6, -6);
  scene.add(backRimLight);

  const bottomLight = new THREE.DirectionalLight(0x8a3038, 1.2);
  bottomLight.position.set(0, -4, 2);
  scene.add(bottomLight);

  const heart = new THREE.Group();
  scene.add(heart);
  // Anatomical tilt (approx -10 deg Z)
  heart.rotation.z = -0.08;

  const layers = Object.fromEntries(['chambers', 'vessels', 'coronaries', 'conduction', 'valves'].map(name => {
    const group = new THREE.Group();
    heart.add(group);
    return [name, group];
  }));

  const selectable = [];
  const meshMap = new Map(); // id -> array of meshes
  const layerVisibility = {
    chambers: true,
    lv: true,
    rv: true,
    la: true,
    ra: true,
    vessels: true,
    coronaries: true,
    conduction: true,
    valves: true
  };

  function registerMesh(object, id) {
    if (!id) return;
    object.userData.id = id;
    selectable.push(object);
    if (!meshMap.has(id)) meshMap.set(id, []);
    meshMap.get(id).push(object);
  }

  // Realistic Anatomical Color & PBR Presets
  const anatomicalColors = {
    lv: 0x9b3238, // Rich deep myocardium
    rv: 0xa43d42, // Ventricular anterior myocardium
    la: 0xb55157, // Left atrium wall
    ra: 0xaa484e, // Right atrium wall
    septum: 0x8a2c32, // Thick muscular septum
    papillary: 0xb84b4f, // Papillary muscle
    aorta: 0xc83e38, // Oxygenated systemic arterial red
    pa: 0x3d7ea6, // Deoxygenated pulmonary trunk blue
    svc: 0x326c8f, // Systemic venous blue
    ivc: 0x2e6688,
    coronary_art: 0xe68e4a, // Coronary arteries with subtle golden lipid sheen
    coronary_vein: 0x418ca8, // Cardiac veins
    conduction: 0xf5df76, // Golden conduction fibers
    valve: 0xe4dacb, // Fibrous endocardial valves
    cusp_lcc: 0xd9755b, // Left coronary cusp (arterial red-amber tone)
    cusp_rcc: 0xd68b54, // Right coronary cusp (facing RVOT/infundibulum)
    cusp_ncc: 0xd89578  // Non-coronary cusp (posterior-septal fibrous bed)
  };

  // Create shared procedural adventitial texture for lifelike vascular micro-relief
  function getVascularBumpMap() {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(256, 256);
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const u = x / 256;
        const striation = Math.sin(u * Math.PI * 32) * 0.18 + Math.sin(u * Math.PI * 64) * 0.08;
        const grain = (Math.random() - 0.5) * 0.22;
        const val = Math.floor(Math.min(255, Math.max(0, (0.5 + striation + grain) * 255)));
        const idx = (y * 256 + x) * 4;
        img.data[idx] = val;
        img.data[idx + 1] = val;
        img.data[idx + 2] = val;
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 14);
    return tex;
  }
  const vascularBumpMap = getVascularBumpMap();

  const createAnatomicalMaterial = (color, options = {}) => {
    const mat = new THREE.MeshPhysicalMaterial({
      color,
      roughness: options.roughness !== undefined ? options.roughness : 0.32,
      metalness: options.metalness !== undefined ? options.metalness : 0.03,
      clearcoat: options.clearcoat !== undefined ? options.clearcoat : 0.35,
      clearcoatRoughness: options.clearcoatRoughness !== undefined ? options.clearcoatRoughness : 0.22,
      sheen: options.sheen !== undefined ? options.sheen : 0.22,
      sheenColor: new THREE.Color(color),
      emissive: options.emissive ? new THREE.Color(options.emissive) : new THREE.Color(0x000000),
      emissiveIntensity: options.emissiveIntensity !== undefined ? options.emissiveIntensity : 0,
      side: options.side !== undefined ? options.side : THREE.FrontSide,
      ...options
    });
    mat.userData = {
      originalColor: new THREE.Color(color),
      originalEmissive: new THREE.Color(options.emissive || 0x000000),
      originalRoughness: mat.roughness,
      originalOpacity: mat.opacity
    };
    return mat;
  };

  // 1. Load Real Medical 3D Mesh (VH_M_Heart - Visible Human Project / Medical Atlas)
  const gltfLoader = new GLTFLoader();
  const medicalModelGroup = new THREE.Group();
  layers.chambers.add(medicalModelGroup);

  gltfLoader.load(
    '/models/heart.glb',
    (gltf) => {
      const gltfRoot = gltf.scene;

      // Compute bounding box & center model
      const box = new THREE.Box3().setFromObject(gltfRoot);
      const center = box.getCenter(new THREE.Vector3());
      gltfRoot.position.set(-center.x, -center.y, -center.z);

      medicalModelGroup.add(gltfRoot);

      // Target real anatomical height in studio units
      const targetScale = 28.5;
      medicalModelGroup.scale.setScalar(targetScale);
      // Slight anatomical rotation for optimal anterior diagnostic orientation
      medicalModelGroup.position.set(0.05, -0.15, 0.05);
      medicalModelGroup.rotation.y = 0.15;
      medicalModelGroup.rotation.x = 0.05;

      gltfRoot.traverse((child) => {
        if (child.isMesh) {
          const name = child.name || '';
          let structureId = null;
          let color = anatomicalColors.lv;
          let extra = {};

          if (/left_ventricle/i.test(name)) {
            structureId = 'lv';
            color = anatomicalColors.lv;
          } else if (/right_ventricle/i.test(name)) {
            structureId = 'rv';
            color = anatomicalColors.rv;
          } else if (/left_cardiac_atrium/i.test(name)) {
            structureId = 'la';
            color = anatomicalColors.la;
          } else if (/right_cardiac_atrium/i.test(name)) {
            structureId = 'ra';
            color = anatomicalColors.ra;
          } else if (/septum/i.test(name)) {
            structureId = 'lv'; // part of ventricular system
            color = anatomicalColors.septum;
          } else if (/papillary/i.test(name)) {
            structureId = 'lv';
            color = anatomicalColors.papillary;
          } else if (/mitral/i.test(name)) {
            structureId = 'mitral';
            color = anatomicalColors.valve;
            extra = { roughness: 0.28 };
          } else if (/tricuspid/i.test(name)) {
            structureId = 'tricuspid';
            color = anatomicalColors.valve;
            extra = { roughness: 0.28 };
          } else if (/aortic_valve/i.test(name)) {
            // Aortic valve mesh in GLB: register both for aorta and rcc/sinus inspection
            structureId = 'rcc';
            color = anatomicalColors.cusp_rcc;
            extra = { roughness: 0.28 };
            registerMesh(child, 'aorta');
          } else if (/pulmonary_valve/i.test(name)) {
            structureId = 'pa';
            color = anatomicalColors.valve;
            extra = { roughness: 0.28 };
          }

          if (/mitral|tricuspid|aortic_valve|pulmonary_valve|valve/i.test(name)) {
            registerMesh(child, 'valves');
            if (layerVisibility.valves !== undefined) {
              child.visible = layerVisibility.valves;
            }
          }

          const mat = createAnatomicalMaterial(color, extra);
          child.material = mat;

          if (structureId) {
            registerMesh(child, structureId);
            if (layerVisibility[structureId] !== undefined) {
              child.visible = layerVisibility[structureId] && layerVisibility.chambers;
            }
          }
        }
      });

      // Apply initial opacity to medical model
      medicalModelGroup.traverse((obj) => {
        if (obj.isMesh && obj.material) {
          obj.material.transparent = opacity < 0.98;
          obj.material.opacity = opacity;
          obj.material.depthWrite = opacity >= 0.92;
        }
      });

      // Hide temporary sphere chambers if initialized
      if (proceduralChambers) proceduralChambers.visible = false;
      console.log('Real medical heart geometry initialized successfully.');
    },
    undefined,
    (err) => {
      console.warn('GLB load fallback to procedural geometry:', err);
      initProceduralFallback();
    }
  );

  // Interpolates variable caliber along vessel length with smoothstep transitions
  function interpolateRadius(radii, t) {
    if (!Array.isArray(radii)) return radii;
    if (radii.length === 1) return radii[0];
    const scaled = t * (radii.length - 1);
    const idx = Math.min(Math.floor(scaled), radii.length - 2);
    const frac = scaled - idx;
    const s = frac * frac * (3 - 2 * frac); // Smoothstep
    return radii[idx] * (1 - s) + radii[idx + 1] * s;
  }

  // Generates organic anatomical vessel mesh with variable caliber,
  // arterial/venous wall compliance, ostial flaring, and rounded terminal caps
  function createOrganicVesselGeometry(points, radiusOrRadii, options = {}) {
    const {
      tubularSegments = 100,
      radialSegments = 24,
      isVein = false,
      isArtery = false,
      flareStart = 0,
      flareEnd = 0,
      capStart = false,
      capEnd = false
    } = options;

    const vPoints = points.map(p => (p instanceof THREE.Vector3 ? p : new THREE.Vector3(...p)));
    const curve = new THREE.CatmullRomCurve3(vPoints, false, 'centripetal', 0.5);
    const frames = curve.computeFrenetFrames(tubularSegments, false);

    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      const P = curve.getPointAt(t);
      const N = frames.normals[i];
      const B = frames.binormals[i];

      let baseR = interpolateRadius(radiusOrRadii, t);
      if (flareStart > 0) baseR *= (1.0 + flareStart * Math.exp(-t * 12.0));
      if (flareEnd > 0) baseR *= (1.0 + flareEnd * Math.exp(-(1.0 - t) * 12.0));

      for (let j = 0; j <= radialSegments; j++) {
        const u = j / radialSegments;
        const theta = u * Math.PI * 2.0;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        let comp = 1.0;
        if (isVein) {
          // Compliant venous wall: slight elliptical profile & gentle undulating tone
          comp = 1.0 + 0.11 * Math.cos(2.0 * theta + 0.38) + 0.025 * Math.sin(4.0 * theta) + 0.016 * Math.sin(t * 14.0);
        } else if (isArtery) {
          // Muscular arterial wall: taut cylindrical tone with subtle adventitial longitudinal texture
          comp = 1.0 + 0.018 * Math.cos(6.0 * theta) + 0.012 * Math.cos(10.0 * theta + t * 6.0) + 0.012 * Math.sin(t * 8.0);
        } else {
          // Subtle organic deviation
          comp = 1.0 + 0.02 * Math.sin(3.0 * theta + t * 10.0);
        }

        const r = baseR * comp;
        const nx = cosT * N.x + sinT * B.x;
        const ny = cosT * N.y + sinT * B.y;
        const nz = cosT * N.z + sinT * B.z;

        positions.push(P.x + nx * r, P.y + ny * r, P.z + nz * r);
        normals.push(nx, ny, nz);
        uvs.push(u, t);
      }
    }

    // Body quads
    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j;
        const b = (i + 1) * (radialSegments + 1) + j;
        const c = (i + 1) * (radialSegments + 1) + (j + 1);
        const d = i * (radialSegments + 1) + (j + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    // Watertight rounded start cap
    if (capStart) {
      const P0 = curve.getPointAt(0);
      const T0 = curve.getTangentAt(0);
      const r0 = interpolateRadius(radiusOrRadii, 0) * (1.0 + flareStart);
      const apexIdx = positions.length / 3;
      positions.push(P0.x - T0.x * r0 * 0.4, P0.y - T0.y * r0 * 0.4, P0.z - T0.z * r0 * 0.4);
      normals.push(-T0.x, -T0.y, -T0.z);
      uvs.push(0.5, 0);

      for (let j = 0; j < radialSegments; j++) {
        indices.push(apexIdx, j + 1, j);
      }
    }

    // Watertight rounded end cap
    if (capEnd) {
      const P1 = curve.getPointAt(1);
      const T1 = curve.getTangentAt(1);
      const r1 = interpolateRadius(radiusOrRadii, 1) * (1.0 + flareEnd);
      const apexIdx = positions.length / 3;
      positions.push(P1.x + T1.x * r1 * 0.4, P1.y + T1.y * r1 * 0.4, P1.z + T1.z * r1 * 0.4);
      normals.push(T1.x, T1.y, T1.z);
      uvs.push(0.5, 1);

      const baseRingOffset = tubularSegments * (radialSegments + 1);
      for (let j = 0; j < radialSegments; j++) {
        indices.push(apexIdx, baseRingOffset + j, baseRingOffset + j + 1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return { geo, curve };
  }

  // Helper builder for organic vessels with anatomical profiles & materials
  function createVessel(group, points, radiusOrRadii, color, id, extra = {}) {
    const isArtery = extra.isArtery !== undefined ? extra.isArtery : (id === 'aorta' || id === 'pa' || id === 'lad' || id === 'lcx' || id === 'rca');
    const isVein = extra.isVein !== undefined ? extra.isVein : (id === 'svc' || id === 'ivc' || id === 'cs' || id === 'la');
    const flareStart = extra.flareStart || 0;
    const flareEnd = extra.flareEnd || 0;
    const capStart = extra.capStart || false;
    const capEnd = extra.capEnd || false;
    const tubularSegments = extra.tubularSegments || 100;
    const radialSegments = extra.radialSegments || (extra.isCatheter ? 16 : 24);

    const { geo, curve } = createOrganicVesselGeometry(points, radiusOrRadii, {
      tubularSegments,
      radialSegments,
      isVein,
      isArtery,
      flareStart,
      flareEnd,
      capStart,
      capEnd
    });

    const {
      isArtery: _ia,
      isVein: _iv,
      flareStart: _fs,
      flareEnd: _fe,
      capStart: _cs,
      capEnd: _ce,
      tubularSegments: _ts,
      radialSegments: _rs,
      isCatheter: _ic,
      ...matOptions
    } = extra;

    const mat = createAnatomicalMaterial(color, {
      bumpMap: vascularBumpMap,
      bumpScale: isVein ? 0.003 : 0.005,
      clearcoat: isVein ? 0.28 : 0.40,
      clearcoatRoughness: 0.22,
      sheen: 0.22,
      ...matOptions
    });

    const obj = new THREE.Mesh(geo, mat);
    group.add(obj);
    obj.userData.curve = curve;
    if (id) registerMesh(obj, id);
    return obj;
  }

  // 2. Anatomically Accurate Great Vessels (Aorta, Pulmonary Trunk, SVC, IVC)
  // Aorta with aortic root, arch, and 3 arch branches (Brachiocephalic, Carotid, Subclavian)
  const aortaPath = [
    [-0.15, 0.70, 0.00],   // Aortic root base atop valve plane
    [-0.08, 1.10, 0.02],   // Mid ascending aorta (anterior to RPA)
    [0.02, 1.48, -0.06],   // Upper ascending aorta curving into arch
    [0.25, 1.84, -0.28],   // Arch summit (above pulmonary bifurcation)
    [0.75, 1.76, -0.55],   // Transverse arch
    [1.08, 1.25, -0.74],   // Mid descending aorta
    [1.06, 0.45, -0.85],   // Lower descending aorta
    [1.02, -0.80, -0.92]   // Diaphragmatic aorta
  ];
  // Natural anatomical caliber: dilated aortic root / STJ -> arch summit -> descending aorta
  const aortaRadii = [0.28, 0.27, 0.25, 0.24, 0.24, 0.23, 0.23, 0.22];
  createVessel(layers.vessels, aortaPath, aortaRadii, anatomicalColors.aorta, 'aorta', {
    isArtery: true,
    capEnd: true,
    roughness: 0.28
  });

  // 2B. Aortic Root Sinuses of Valsalva (LCC, RCC, NCC) with Distinct Visual Contours
  // Root Base: [-0.15, 0.70, 0.00] directly atop aortic valve plane
  const sinusGroup = new THREE.Group();
  layers.vessels.add(sinusGroup);

  // Helper to create an individual bulbous coronary cusp sinus with ostium rim
  function createCoronarySinusCusp(pos, scale, rotY, color, id) {
    const cuspGroup = new THREE.Group();
    cuspGroup.position.set(...pos);
    cuspGroup.rotation.y = rotY;

    const geo = new THREE.SphereGeometry(1, 32, 24);
    // Sculpt into anatomical pouch (expanded belly, tapered towards sinotubular junction)
    const posAttr = geo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      const bulge = 1.0 + 0.28 * Math.exp(-Math.pow(y + 0.1, 2) * 5.0);
      posAttr.setXYZ(i, x * bulge, y * 1.12, z * bulge * 0.94);
    }
    geo.computeVertexNormals();

    const mat = createAnatomicalMaterial(color, {
      roughness: 0.30,
      bumpMap: vascularBumpMap,
      bumpScale: 0.005
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(...scale);
    cuspGroup.add(mesh);
    registerMesh(mesh, id);
    registerMesh(mesh, 'aorta');

    // Annulus / Sinotubular ridge ring for clear visual demarcation between cusps
    const ridgeGeo = new THREE.TorusGeometry(scale[0] * 0.95, 0.016, 12, 32, Math.PI * 1.08);
    const ridgeMat = createAnatomicalMaterial(anatomicalColors.valve, { roughness: 0.26 });
    const ridgeMesh = new THREE.Mesh(ridgeGeo, ridgeMat);
    ridgeMesh.rotation.x = Math.PI / 2;
    ridgeMesh.position.y = scale[1] * 0.52;
    cuspGroup.add(ridgeMesh);
    registerMesh(ridgeMesh, id);

    sinusGroup.add(cuspGroup);
    return cuspGroup;
  }

  // 1. Right Coronary Cusp & Sinus (RCC):
  // Located anteriorly/rightward
  const rccCusp = createCoronarySinusCusp(
    [-0.08, 0.54, 0.08],
    [0.18, 0.24, 0.18],
    0.35,
    anatomicalColors.cusp_rcc,
    'rcc'
  );

  // 2. Left Coronary Cusp & Sinus (LCC):
  // Located anterior-left, immediately adjacent to the Left Main ostium
  const lccCusp = createCoronarySinusCusp(
    [-0.12, 0.54, -0.15],
    [0.18, 0.24, 0.18],
    -0.85,
    anatomicalColors.cusp_lcc,
    'lcc'
  );

  // 3. Non-Coronary Cusp & Sinus (NCC):
  // Located posterior-medial, abutting interatrial septum and fibrous trigone
  const nccCusp = createCoronarySinusCusp(
    [-0.26, 0.53, -0.05],
    [0.18, 0.24, 0.18],
    2.10,
    anatomicalColors.cusp_ncc,
    'ncc'
  );

  // Ostium marker rings on coronary cusps
  function createOstium(pos, normal, id) {
    const ostiumGeo = new THREE.TorusGeometry(0.040, 0.011, 16, 28);
    const ostiumMat = createAnatomicalMaterial(anatomicalColors.coronary_art, { roughness: 0.25, metalness: 0.2 });
    const ostiumMesh = new THREE.Mesh(ostiumGeo, ostiumMat);
    ostiumMesh.position.set(...pos);
    ostiumMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...normal).normalize());
    layers.vessels.add(ostiumMesh);
    registerMesh(ostiumMesh, id);
    registerMesh(ostiumMesh, 'aorta');
  }

  // RCA Ostium located on Right Coronary Sinus
  createOstium([-0.06, 0.62, 0.12], [0.3, 0.2, 0.9], 'rcc');
  // Left Main Ostium located on Left Coronary Sinus
  createOstium([-0.12, 0.62, -0.22], [0.4, 0.2, -0.88], 'lcc');

  // Three supra-aortic branches with flared ostial bases and natural tapering
  const archBranches = [
    // Brachiocephalic trunk (largest takeoff from anterior arch)
    {
      pts: [[0.12, 1.76, -0.20], [0.10, 2.35, -0.22]],
      radii: [0.115, 0.095, 0.082],
      flareStart: 0.4
    },
    // Left common carotid
    {
      pts: [[0.35, 1.83, -0.32], [0.38, 2.38, -0.34]],
      radii: [0.095, 0.080, 0.072],
      flareStart: 0.35
    },
    // Left subclavian
    {
      pts: [[0.58, 1.80, -0.45], [0.62, 2.35, -0.48]],
      radii: [0.092, 0.078, 0.070],
      flareStart: 0.35
    }
  ];
  archBranches.forEach(b => {
    createVessel(layers.vessels, b.pts, b.radii, anatomicalColors.aorta, 'aorta', {
      isArtery: true,
      flareStart: b.flareStart,
      capEnd: true,
      roughness: 0.28
    });
  });

  // 2C. Pulmonary Trunk (Main PA) & Anatomical Relationship with Ascending Aorta:
  // Starts directly at Pulmonary Valve [0.03, 0.77, 0.52] on the RV outflow tract,
  // ascends anteriorly and curves gracefully to the left side of the Ascending Aorta,
  // reaching the bifurcation crux beneath the aortic arch concavity on the left side of the aorta.
  const paMain = [
    [0.03, 0.77, 0.52],   // Pulmonary valve plane on RVOT
    [0.20, 1.05, 0.48],   // Ascending anterior to aorta
    [0.40, 1.28, 0.28],   // Crossing gracefully to the left side of aorta
    [0.55, 1.40, 0.06],   // Curving leftward and posterior
    [0.60, 1.46, -0.16]   // Crux beneath the aortic arch concavity, to the left of ascending aorta
  ];
  const paRadii = [0.24, 0.22, 0.19, 0.17, 0.15];
  createVessel(layers.vessels, paMain, paRadii, anatomicalColors.pa, 'pa', {
    isArtery: true,
    flareStart: 0.35,
    roughness: 0.30
  });

  // Right Pulmonary Artery (RPA):
  // Runs horizontally to the right, passing strictly BEHIND the Ascending Aorta and BEHIND the SVC,
  // while remaining strictly ANTERIOR to the Left Atrium roof and Pulmonary Veins.
  const rpaPath = [
    [0.60, 1.46, -0.16],  // Bifurcation crux on the left of aorta
    [0.32, 1.40, -0.38],  // Passing directly BEHIND ascending aorta
    [0.00, 1.35, -0.46],  // Behind aorta, anterior to pulmonary veins
    [-0.35, 1.30, -0.46], // Middle mediastinum behind aorta
    [-0.70, 1.26, -0.44], // Passing BEHIND the SVC
    [-1.05, 1.22, -0.42]  // Right hilum, anterior to right pulmonary veins
  ];
  createVessel(layers.vessels, rpaPath, [0.15, 0.14, 0.13, 0.12, 0.11, 0.11], anatomicalColors.pa, 'pa', {
    isArtery: true,
    flareStart: 0.25,
    capEnd: true
  });

  // Left Pulmonary Artery (LPA):
  // Curves posterior-leftward toward the left lung hilum, in front of the descending aorta.
  const lpaPath = [
    [0.60, 1.46, -0.16],  // Bifurcation crux
    [0.82, 1.42, -0.25],  // Left hilum takeoff
    [1.05, 1.36, -0.32],  // Arching over left bronchus
    [1.25, 1.30, -0.38]   // Left lung hilum
  ];
  createVessel(layers.vessels, lpaPath, [0.15, 0.14, 0.12, 0.11], anatomicalColors.pa, 'pa', {
    isArtery: true,
    flareStart: 0.25,
    capEnd: true
  });

  // Vena Cava (Superior & Inferior) - venous wall compliance & smooth ostial flaring into RA
  // Superior Vena Cava (SVC):
  // Originates at the RA roof (sinus venarum cavarum) and ascends into superior mediastinum,
  // flaring smoothly at the atrial connection without protruding into the atrium cavity.
  const svcPath = [
    [-0.98, 1.28, 0.06], // RA roof ostium (sinus venarum cavarum)
    [-0.95, 1.55, 0.02],
    [-0.90, 1.85, -0.05],
    [-0.86, 2.15, -0.12]
  ];
  createVessel(layers.vessels, svcPath, [0.32, 0.28, 0.25, 0.22], anatomicalColors.svc, 'svc', {
    isVein: true,
    flareStart: 0.35,
    capEnd: true,
    roughness: 0.32
  });

  // Inferior Vena Cava (IVC):
  // Connects to the RA floor (inferior caval orifice) and extends inferiorly,
  // flaring at the diaphragmatic entrance rather than forming an internal pipe.
  const ivcPath = [
    [-0.98, -1.22, 0.28], // RA floor ostium (inferior vena caval orifice)
    [-0.96, -1.48, 0.22],
    [-0.94, -1.78, 0.15],
    [-0.92, -2.08, 0.10]
  ];
  createVessel(layers.vessels, ivcPath, [0.34, 0.32, 0.30, 0.28], anatomicalColors.ivc, 'ivc', {
    isVein: true,
    flareStart: 0.35,
    capEnd: true,
    roughness: 0.32
  });

  // 4 Pulmonary Veins entering Left Atrium (posterior) with antra funneling
  const pvPaths = [
    // Left Superior & Inferior
    { pts: [[0.24, 1.04, -0.66], [0.65, 1.06, -0.67], [1.18, 1.08, -0.66]], radii: [0.15, 0.11, 0.085] },
    { pts: [[0.24, 0.64, -0.64], [0.68, 0.62, -0.66], [1.20, 0.60, -0.68]], radii: [0.14, 0.10, 0.080] },
    // Right Superior & Inferior
    { pts: [[-0.24, 1.04, -0.66], [-0.65, 1.06, -0.67], [-1.18, 1.08, -0.66]], radii: [0.15, 0.11, 0.085] },
    { pts: [[-0.24, 0.64, -0.64], [-0.68, 0.62, -0.66], [-1.20, 0.60, -0.68]], radii: [0.14, 0.10, 0.080] }
  ];
  pvPaths.forEach(pv => {
    createVessel(layers.vessels, pv.pts, pv.radii, 0xc46b68, 'la', {
      isVein: true,
      flareStart: 0.4,
      capEnd: true,
      roughness: 0.30
    });
  });

  // 3. Realistic Coronary Arteries (LAD, RCA, LCx) with true epicardial sulcus courses & branching
  // Directly springing from Left and Right Coronary Cusp Ostia
  const coronaryArteries = [
    // -------------------------------------------------------------
    // LAD (Left Anterior Descending / R. interventricularis anterior)
    // Springs from Left Main Ostium at LCC [-0.12, 0.62, -0.22],
    // passes behind pulmonary trunk and emerges into the anterior
    // interventricular sulcus, coursing along the anterior epicardium to the apex.
    // Perfusion Territory: Anterior LV wall, cardiac apex, anterior 2/3 of IVS.
    // -------------------------------------------------------------
    {
      id: 'lad',
      pts: [
        [-0.12, 0.62, -0.22], // Left Main Ostium on LCC
        [0.05, 0.60, 0.05],   // LMCA passing under pulmonary trunk
        [0.22, 0.55, 0.35],   // Emerging into anterior interventricular sulcus
        [0.38, 0.42, 0.80],   // Proximal LAD on anterior groove
        [0.56, 0.18, 0.89],   // Proximal-mid LAD (takeoff of D1 & S1)
        [0.76, -0.18, 1.02],  // Mid LAD
        [0.96, -0.58, 1.15],  // Mid-distal LAD (takeoff of D2)
        [1.14, -0.98, 1.23],  // Distal LAD
        [1.28, -1.35, 1.24],  // Pre-apical segment
        [1.37, -1.58, 1.07]   // True cardiac apex
      ],
      radii: [0.058, 0.054, 0.048, 0.042, 0.036, 0.030, 0.024, 0.019, 0.015, 0.011],
      flareStart: 0.35,
      capEnd: true
    },
    // First Diagonal Branch (D1) - courses across anterolateral LV wall
    {
      id: 'lad',
      pts: [
        [0.56, 0.18, 0.89],
        [0.85, 0.05, 0.85],
        [1.20, -0.15, 0.72],
        [1.48, -0.35, 0.52]
      ],
      radii: [0.030, 0.024, 0.018, 0.012],
      flareStart: 0.3,
      capEnd: true
    },
    // Second Diagonal Branch (D2) - courses over distal anterolateral LV wall
    {
      id: 'lad',
      pts: [
        [0.96, -0.58, 1.15],
        [1.22, -0.72, 1.05],
        [1.45, -0.92, 0.85],
        [1.58, -1.15, 0.62]
      ],
      radii: [0.026, 0.021, 0.016, 0.011],
      flareStart: 0.3,
      capEnd: true
    },
    // Septal Perforator Branch (S1) - penetrates anterior 2/3 of interventricular septum
    {
      id: 'lad',
      pts: [
        [0.56, 0.18, 0.89],
        [0.50, 0.05, 0.72],
        [0.45, -0.12, 0.50]
      ],
      radii: [0.024, 0.018, 0.012],
      flareStart: 0.3,
      capEnd: true
    },

    // -------------------------------------------------------------
    // LCx (Left Circumflex / R. circumflexus)
    // Springs from Left Main bifurcation at [-0.08, 0.63, -0.38],
    // courses in the left atrioventricular sulcus between LA and LV,
    // wrapping around the obtuse margin of the heart.
    // Perfusion Territory: Lateral & posterolateral LV walls, LA myocardium.
    // -------------------------------------------------------------
    {
      id: 'lcx',
      pts: [
        [-0.12, 0.62, -0.22], // Left Main Ostium
        [0.15, 0.60, -0.30],  // Proximal LCx entering left AV groove
        [0.60, 0.52, -0.40],  // Circling left atrioventricular groove
        [0.98, 0.40, -0.18],  // Encircling left atrial appendage base
        [1.28, 0.20, 0.06],   // Mid LCx in AV groove (takeoff of OM1)
        [1.55, -0.05, 0.12],  // Lateral AV groove
        [1.70, -0.35, 0.02],  // Posterolateral groove (takeoff of OM2)
        [1.68, -0.65, -0.18], // Posterolateral branch
        [1.50, -0.90, -0.34]  // Distal terminal segment
      ],
      radii: [0.054, 0.048, 0.042, 0.036, 0.030, 0.025, 0.020, 0.016, 0.012],
      flareStart: 0.35,
      capEnd: true
    },
    // First Obtuse Marginal Branch (OM1) - descends along lateral LV free wall
    {
      id: 'lcx',
      pts: [
        [1.28, 0.20, 0.06],
        [1.58, -0.05, 0.20],
        [1.72, -0.40, 0.18],
        [1.75, -0.75, 0.08]
      ],
      radii: [0.028, 0.022, 0.016, 0.011],
      flareStart: 0.3,
      capEnd: true
    },
    // Second Obtuse Marginal Branch (OM2) - descends along posterolateral LV wall
    {
      id: 'lcx',
      pts: [
        [1.70, -0.35, 0.02],
        [1.76, -0.62, -0.05],
        [1.68, -0.95, -0.15]
      ],
      radii: [0.024, 0.018, 0.012],
      flareStart: 0.3,
      capEnd: true
    },

    // -------------------------------------------------------------
    // RCA (Right Coronary Artery / A. coronaria dextra)
    // Springs from Right Coronary Ostium at RCC [-0.06, 0.62, 0.12],
    // courses through the right atrioventricular sulcus between RA and RV,
    // rounds the acute margin, reaches crux cordis posteriorly,
    // and continues as the Posterior Descending Artery (PDA) in the
    // posterior interventricular sulcus.
    // Perfusion Territory: RV free wall, RA, Inferior/diaphragmatic LV wall,
    // posterior 1/3 of IVS via PDA, SA & AV nodes.
    // -------------------------------------------------------------
    {
      id: 'rca',
      pts: [
        [-0.06, 0.62, 0.12],  // RCC Ostium
        [-0.15, 0.55, 0.22],  // Emerging beneath right atrial appendage
        [-0.42, 0.40, 0.52],  // Proximal RCA in right AV groove
        [-0.60, 0.15, 0.66],  // Mid RCA in right AV groove
        [-0.88, -0.15, 0.88], // Lower right AV groove
        [-1.16, -0.45, 1.05], // Acute margin of RV (takeoff of Acute Marginal)
        [-1.05, -0.80, 0.92], // Circling along inferior AV border
        [-0.94, -1.05, 0.94], // Inferior AV groove
        [-0.65, -1.25, 0.65], // Approaching crux cordis
        [-0.22, -1.35, 0.38], // Crux cordis (AV nodal artery origin)
        [0.15, -1.40, 0.25]   // Crux cordis junction with posterior interventricular groove
      ],
      radii: [0.056, 0.050, 0.045, 0.040, 0.035, 0.030, 0.026, 0.022, 0.018, 0.015, 0.012],
      flareStart: 0.35,
      capEnd: true
    },
    // Acute Marginal Branch (R. marginalis dexter) - along acute border of RV free wall
    {
      id: 'rca',
      pts: [
        [-1.16, -0.45, 1.05],
        [-0.85, -0.75, 1.15],
        [-0.45, -1.05, 1.22],
        [0.05, -1.30, 1.20],
        [0.65, -1.45, 1.12]
      ],
      radii: [0.028, 0.022, 0.017, 0.013, 0.010],
      flareStart: 0.3,
      capEnd: true
    },
    // Posterior Descending Artery (PDA / R. interventricularis posterior)
    // Courses through posterior interventricular groove on the inferior LV wall to the apex
    {
      id: 'rca',
      pts: [
        [0.15, -1.40, 0.25], // Origin at crux cordis
        [0.45, -1.45, 0.42], // Proximal posterior groove
        [0.75, -1.50, 0.62], // Mid posterior interventricular groove
        [1.10, -1.55, 0.85], // Distal posterior groove
        [1.32, -1.58, 1.02]  // Pre-apical anastomosis area near distal LAD
      ],
      radii: [0.034, 0.028, 0.022, 0.016, 0.011],
      flareStart: 0.3,
      capEnd: true
    }
  ];

  coronaryArteries.forEach(c => {
    createVessel(layers.coronaries, c.pts, c.radii, anatomicalColors.coronary_art, c.id, {
      isArtery: true,
      flareStart: c.flareStart || 0,
      capEnd: c.capEnd || false,
      roughness: 0.26,
      metalness: 0.05
    });
  });

  // Coronary Sinus & Cardiac Veins: Great cardiac vein ascending in anterior sulcus,
  // coursing through left AV groove, and dilating into posterior coronary sinus entering RA
  const csPoints = [
    [1.32, -1.50, 1.10], // Near apex alongside distal LAD
    [1.18, -1.05, 1.25], // Distal anterior groove
    [0.98, -0.62, 1.16], // Mid anterior groove
    [0.78, -0.22, 1.04], // Proximal anterior groove
    [0.58, 0.15, 0.91],  // Ascending great cardiac vein
    [0.38, 0.40, 0.82],  // Approaching base of pulmonary trunk
    [0.55, 0.50, -0.25], // Curving into left AV groove alongside LCx
    [1.05, 0.35, -0.15], // Left AV groove
    [1.35, 0.15, 0.05],  // Lateral margin
    [1.58, -0.15, 0.05], // Posterolateral groove
    [1.65, -0.45, -0.12],// Entering coronary sinus
    [1.40, -0.70, -0.32],// Dilated Coronary Sinus ampulla
    [0.90, -0.65, -0.48],// Posterior AV groove
    [0.35, -0.50, -0.55],// Approaching right atrium
    [-0.15, -0.30, -0.48],// Near IVC entrance
    [-0.45, -0.05, -0.32] // Coronary sinus ostium into RA (Koch's triangle landmark)
  ];
  const csRadii = [0.016, 0.020, 0.024, 0.028, 0.032, 0.036, 0.040, 0.044, 0.048, 0.052, 0.058, 0.066, 0.072, 0.076, 0.080, 0.082];
  createVessel(layers.coronaries, csPoints, csRadii, anatomicalColors.coronary_vein, 'cs', {
    isVein: true,
    capStart: true,
    capEnd: true,
    roughness: 0.30
  });

  // 4. Cardiac Conduction System Overlays (SA Node, AV Node, Bundle of His, Purkinje)
  function createMarkerNode(group, pos, scale, id) {
    const geo = new THREE.SphereGeometry(1, 32, 24);
    const mat = createAnatomicalMaterial(anatomicalColors.conduction, {
      emissive: new THREE.Color(0xf6d974),
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.scale.set(...scale);
    group.add(m);
    registerMesh(m, id);
    return m;
  }

  // SA Node at SVC-RA cavoatrial junction
  createMarkerNode(layers.conduction, [-0.96, 1.30, 0.04], [0.12, 0.08, 0.08], 'sa');
  // AV Node at apex of Koch's triangle
  createMarkerNode(layers.conduction, [-0.18, 0.15, 0.12], [0.09, 0.07, 0.07], 'av');

  // Conduction paths: Internodal tracts & His-Purkinje branches
  const hisPoints = [
    [-0.18, 0.15, 0.12],   // AV node
    [-0.04, 0.05, 0.20],   // Penetrating bundle through central fibrous body
    [0.10, -0.15, 0.30],   // Branching bundle atop interventricular septum
    [0.18, -0.52, 0.35]    // Septal bifurcation
  ];
  createVessel(layers.conduction, hisPoints, 0.028, anatomicalColors.conduction, 'his', {
    emissive: new THREE.Color(0xefc443),
    emissiveIntensity: 0.7
  });

  // Right Bundle Branch toward moderator band & anterior papillary muscle
  const rbbPoints = [[0.18, -0.52, 0.35], [-0.02, -0.65, 0.44], [-0.15, -0.85, 0.42]];
  createVessel(layers.conduction, rbbPoints, 0.019, anatomicalColors.conduction, 'his', {
    emissive: new THREE.Color(0xefc443),
    emissiveIntensity: 0.7
  });

  // Left Bundle Branch fanning over left ventricular septum
  const lbbPoints = [[0.18, -0.52, 0.35], [0.35, -0.75, 0.26], [0.42, -1.05, 0.12]];
  createVessel(layers.conduction, lbbPoints, 0.019, anatomicalColors.conduction, 'his', {
    emissive: new THREE.Color(0xefc443),
    emissiveIntensity: 0.7
  });

  // Fallback procedural chambers (only created if medical GLB asset fails to load)
  let proceduralChambers = null;
  function initProceduralFallback() {
    if (proceduralChambers) return;
    proceduralChambers = new THREE.Group();
    layers.chambers.add(proceduralChambers);

    function createOrganicEllipsoid(pos, scale, color, id, rotZ = 0) {
      const geo = new THREE.SphereGeometry(1, 48, 36);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const taper = 0.82 + 0.18 * (y + 1) / 2;
        p.setXYZ(i, x * taper, y, z * taper);
      }
      geo.computeVertexNormals();
      const mat = createAnatomicalMaterial(color, { roughness: 0.45 });
      const obj = new THREE.Mesh(geo, mat);
      obj.position.set(...pos);
      obj.scale.set(...scale);
      obj.rotation.z = rotZ;
      proceduralChambers.add(obj);
      registerMesh(obj, id);
      return obj;
    }

    createOrganicEllipsoid([0.40, -0.54, -0.03], [0.90, 1.36, 0.72], anatomicalColors.lv, 'lv', -0.28);
    createOrganicEllipsoid([-0.38, -0.37, 0.44], [0.89, 1.06, 0.49], anatomicalColors.rv, 'rv', 0.30);
    createOrganicEllipsoid([-0.85, 0.72, 0.03], [0.62, 0.70, 0.58], anatomicalColors.ra, 'ra', -0.13);
    createOrganicEllipsoid([0.46, 0.88, -0.44], [0.70, 0.59, 0.56], anatomicalColors.la, 'la');
  }

  // 5. Microstructure View (Myocytes, Intercalated Discs, Sarcomeres)
  const micro = new THREE.Group();
  scene.add(micro);
  micro.visible = false;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = (col - 1) * 1.45 + (row % 2) * 0.2, y = (row - 1) * 0.69;
      const cellGeo = new THREE.SphereGeometry(1, 48, 36);
      const cellMat = createAnatomicalMaterial(0xbd5a58, { roughness: 0.5 });
      const cell = new THREE.Mesh(cellGeo, cellMat);
      cell.position.set(x, y, 0);
      cell.scale.set(0.91, 0.29, 0.29);
      cell.rotation.z = 0.04;
      micro.add(cell);
      registerMesh(cell, 'micro');

      const nucGeo = new THREE.SphereGeometry(1, 24, 18);
      const nuc = new THREE.Mesh(nucGeo, createAnatomicalMaterial(0x753b75, { roughness: 0.3 }));
      nuc.position.set(x, y, 0.28);
      nuc.scale.set(0.22, 0.11, 0.055);
      micro.add(nuc);
      registerMesh(nuc, 'micro');

      for (let k = -4; k <= 4; k++) {
        const bandGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.035, 16);
        const band = new THREE.Mesh(bandGeo, createAnatomicalMaterial(0x9a363a, { roughness: 0.4 }));
        band.rotation.y = Math.PI / 2;
        band.position.set(x + k * 0.105, y, 0);
        micro.add(band);
        registerMesh(band, 'micro');
      }

      const discGeo = new THREE.BoxGeometry(0.034, 0.48, 0.48);
      const disc = new THREE.Mesh(discGeo, createAnatomicalMaterial(0xe5c87a, { roughness: 0.35 }));
      disc.position.set(x + 0.64, y, 0);
      micro.add(disc);
      registerMesh(disc, 'micro');
    }
  }

  // 6. Guided Interventions (Catheter routes for Angiography & Pacemaker)
  const intervention = new THREE.Group();
  heart.add(intervention);
  const paths = {
    angiography: [
      [1.02, -0.80, -0.92],
      [1.06, 0.45, -0.85],
      [1.08, 1.25, -0.74],
      [0.75, 1.76, -0.55],
      [0.25, 1.84, -0.28],
      [0.02, 1.48, -0.06],
      [-0.08, 1.10, 0.02],
      [-0.15, 0.70, 0.00],
      [-0.12, 0.62, -0.22] // engaged securely in left coronary ostium on LCC
    ],
    pacemaker: [
      [-0.86, 2.10, -0.12], // SVC entry
      [-0.95, 1.55, 0.02],
      [-0.98, 1.28, 0.06],  // Entering RA via SVC orifice at RA roof
      [-0.65, 0.40, 0.22],  // Crossing right atrial cavity toward tricuspid valve
      [-0.22, -0.35, 0.56], // Passing across tricuspid valve plane
      [0.12, -0.85, 0.52]   // Trabeculated RV apex contact
    ]
  };

  let catheter = null, curve = null, progress = 0.5, mode = 'anatomy', opacity = 0.85, beating = false;
  const tipMat = createAnatomicalMaterial(0xc8f8de, { emissive: new THREE.Color(0x52f6b8), emissiveIntensity: 1.5, roughness: 0.2 });
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 24, 18), tipMat);
  intervention.add(tip);
  intervention.visible = false;

  function updateProgress() {
    if (!catheter || !curve) return;
    const segment = Math.floor(progress * 100);
    catheter.geometry.setDrawRange(0, segment * 16 * 6);
    tip.position.copy(curve.getPointAt(segment / 100));
  }

  function setOpacity(value) {
    opacity = THREE.MathUtils.clamp(Number(value), 0.08, 1);
    const applyOpacity = (obj) => {
      if (obj.isMesh && obj.material) {
        obj.material.transparent = opacity < 0.98;
        obj.material.opacity = opacity;
        obj.material.depthWrite = opacity >= 0.92;
      }
    };
    layers.chambers.traverse(applyOpacity);
    medicalModelGroup.traverse(applyOpacity);
  }

  function setMode(name) {
    mode = name;
    micro.visible = name === 'micro';
    heart.visible = name !== 'micro';
    intervention.visible = Boolean(paths[name]);

    if (catheter) {
      intervention.remove(catheter);
      catheter.geometry.dispose();
      catheter.material.dispose();
      catheter = null;
    }

    if (paths[name]) {
      catheter = createVessel(intervention, paths[name], 0.024, 0x82f5cb, null, {
        emissive: new THREE.Color(0x38e5a6),
        emissiveIntensity: 0.4,
        isCatheter: true,
        radialSegments: 16,
        tubularSegments: 100
      });
      curve = catheter.userData.curve;
      updateProgress();
      setOpacity(0.28);
    } else {
      setOpacity(0.85);
    }
  }

  // Camera Presets & Fly-to Interpolation
  const views = {
    anterior: [0, 0.4, 7.8],
    posterior: [0, 0.4, -7.8],
    rao: [-5.2, 0.6, 5.2],
    lao: [5.2, 0.6, 5.2],
    root: [-0.4, 2.8, 4.2] // Optimized diagnostic angle looking right into the aortic root & pulmonary junction
  };

  const targetCameraPos = new THREE.Vector3().copy(camera.position);
  const targetLookAt = new THREE.Vector3(0, 0, 0);
  let isTransitioning = false;

  function setView(name, smooth = true) {
    const dest = views[name] || views.anterior;
    if (smooth) {
      targetCameraPos.set(...dest);
      targetLookAt.set(0, 0.35, 0);
      isTransitioning = true;
    } else {
      camera.position.set(...dest);
      controls.target.set(0, 0.35, 0);
      targetCameraPos.copy(camera.position);
      targetLookAt.copy(controls.target);
      controls.update();
    }
  }

  // Selected Structure Highlight & Fly-To
  let activeSelectedId = null;
  let hoveredId = null;

  function getStructureBoundingCenter(id) {
    const meshes = meshMap.get(id);
    if (!meshes || meshes.length === 0) return null;
    const box = new THREE.Box3();
    meshes.forEach(m => {
      m.updateWorldMatrix(true, false);
      box.expandByObject(m);
    });
    const center = new THREE.Vector3();
    box.getCenter(center);
    return center;
  }

  function highlightStructure(id, flyTo = true) {
    activeSelectedId = id;
    const isMicro = (mode === 'micro');
    const rootGroup = isMicro ? micro : heart;

    // Coronary perfusion territory mapping: highlights supplied myocardium when artery is selected
    const perfusionChambers = {
      lad: { ids: ['lv'], color: 0xff5e57, intensity: 0.22 },
      lcx: { ids: ['lv', 'la'], color: 0xffd32a, intensity: 0.22 },
      rca: { ids: ['rv', 'ra'], color: 0xffa801, intensity: 0.22 }
    };
    const perfusion = perfusionChambers[id];

    rootGroup.traverse(o => {
      if (o.isMesh && o.userData.id) {
        const mat = o.material;
        const isMatch = (o.userData.id === id);
        const isPerfusionTarget = perfusion && perfusion.ids.includes(o.userData.id);

        if (isMatch) {
          mat.emissive.setHex(0x56e3b5);
          mat.emissiveIntensity = 0.75;
          mat.roughness = 0.20;
        } else if (isPerfusionTarget) {
          mat.emissive.setHex(perfusion.color);
          mat.emissiveIntensity = perfusion.intensity;
          mat.roughness = 0.30;
        } else {
          mat.emissive.copy(mat.userData.originalEmissive || new THREE.Color(0x000000));
          mat.emissiveIntensity = 0;
          mat.roughness = mat.userData.originalRoughness || 0.38;
        }
      }
    });

    if (flyTo && id) {
      const center = getStructureBoundingCenter(id);
      if (center) {
        targetLookAt.copy(center);
        const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
        // Smaller structures (cusps/valves) get a closer, clearer camera zoom
        const isSmallStructure = ['lcc', 'rcc', 'ncc', 'mitral', 'tricuspid', 'sa', 'av', 'his'].includes(id);
        const minD = isSmallStructure ? 2.8 : 4.2;
        const maxD = isSmallStructure ? 4.5 : 7.2;
        const dist = THREE.MathUtils.clamp(offset.length(), minD, maxD);
        offset.normalize().multiplyScalar(dist);
        targetCameraPos.copy(center).add(offset);
        isTransitioning = true;
      }
    }
  }

  // Raycasting & Pointer Events
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = null;

  function pointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);

    const isVisible = o => {
      let cur = o;
      while (cur) {
        if (!cur.visible) return false;
        cur = cur.parent;
      }
      return true;
    };

    const hit = raycaster.intersectObjects(selectable, true).find(h => isVisible(h.object));
    const newHoveredId = hit ? hit.object.userData.id : null;

    if (newHoveredId !== hoveredId) {
      if (hoveredId && hoveredId !== activeSelectedId) {
        const prevMeshes = meshMap.get(hoveredId) || [];
        prevMeshes.forEach(m => {
          m.material.emissive.copy(m.material.userData.originalEmissive || new THREE.Color(0x000000));
          m.material.emissiveIntensity = 0;
        });
      }
      hoveredId = newHoveredId;
      if (hoveredId && hoveredId !== activeSelectedId) {
        const nextMeshes = meshMap.get(hoveredId) || [];
        nextMeshes.forEach(m => {
          m.material.emissive.setHex(0x89e0ff);
          m.material.emissiveIntensity = 0.35;
        });
      }
      renderer.domElement.style.cursor = hoveredId ? 'pointer' : 'default';
      onHover(hoveredId, e.clientX, e.clientY);
    }
  }

  function pointerDown(e) {
    down = [e.clientX, e.clientY];
  }

  function pointerUp(e) {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);

    const isVisible = o => {
      let cur = o;
      while (cur) {
        if (!cur.visible) return false;
        cur = cur.parent;
      }
      return true;
    };

    const hit = raycaster.intersectObjects(selectable, true).find(h => isVisible(h.object));
    if (hit) {
      const id = hit.object.userData.id;
      highlightStructure(id, true);
      onSelect(id);
    }
  }

  renderer.domElement.addEventListener('pointermove', pointerMove);
  renderer.domElement.addEventListener('pointerdown', pointerDown);
  renderer.domElement.addEventListener('pointerup', pointerUp);

  function resize() {
    const w = container.clientWidth || 600, h = container.clientHeight || 600;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  setOpacity(0.85);

  let frame;
  const start = performance.now();

  function animate(now) {
    frame = requestAnimationFrame(animate);
    const t = (now - start) / 1000;

    // Smooth fly-to camera lerp
    if (isTransitioning) {
      camera.position.lerp(targetCameraPos, 0.08);
      controls.target.lerp(targetLookAt, 0.08);
      if (camera.position.distanceTo(targetCameraPos) < 0.01 && controls.target.distanceTo(targetLookAt) < 0.01) {
        camera.position.copy(targetCameraPos);
        controls.target.copy(targetLookAt);
        isTransitioning = false;
      }
    }

    // Glow pulse on selected structure
    if (activeSelectedId) {
      const activeMeshes = meshMap.get(activeSelectedId) || [];
      const pulseIntensity = 0.50 + 0.28 * Math.sin(t * 4);
      activeMeshes.forEach(m => {
        if (m.material) {
          m.material.emissiveIntensity = pulseIntensity;
        }
      });
    }

    // Organic heart contraction & twist pulse
    if (beating && mode !== 'micro') {
      const beatCycle = Math.sin(t * 6.5);
      const contraction = beatCycle > 0.3 ? Math.pow(beatCycle, 4) * 0.024 : 0;
      heart.scale.set(1 - contraction * 0.8, 1 + contraction * 0.5, 1 - contraction * 0.8);
      heart.rotation.z = -0.08 + contraction * 0.05; // slight torsion
    } else {
      heart.scale.setScalar(1);
      heart.rotation.z = -0.08;
    }

    controls.update();
    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(animate);

  return {
    setLayer(name, value) {
      const isVisible = Boolean(value);
      layerVisibility[name] = isVisible;

      if (['lv', 'rv', 'la', 'ra'].includes(name)) {
        if (layers.chambers) layers.chambers.visible = true;
        const meshes = meshMap.get(name) || [];
        meshes.forEach(m => {
          m.visible = isVisible;
        });
        return;
      }

      if (name === 'chambers') {
        ['lv', 'rv', 'la', 'ra'].forEach(cId => {
          layerVisibility[cId] = isVisible;
          const meshes = meshMap.get(cId) || [];
          meshes.forEach(m => {
            m.visible = isVisible;
          });
        });
        if (proceduralChambers) {
          proceduralChambers.visible = isVisible;
        }
        return;
      }

      if (name === 'valves') {
        const valveMeshes = (meshMap.get('valves') || [])
          .concat(meshMap.get('mitral') || [], meshMap.get('tricuspid') || []);
        valveMeshes.forEach(m => {
          m.visible = isVisible;
        });
        if (layers.valves) layers.valves.visible = isVisible;
        return;
      }

      if (layers[name]) {
        layers[name].visible = isVisible;
      }
    },
    setView,
    setMode,
    selectStructure(id, flyTo = true) {
      highlightStructure(id, flyTo);
    },
    clearSelection() {
      highlightStructure(null, false);
    },
    setProgress(value) {
      progress = THREE.MathUtils.clamp(Number(value), 0, 1);
      updateProgress();
    },
    setOpacity,
    setBeating(value) {
      beating = value;
    },
    reset() {
      setView('anterior', true);
    },
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}


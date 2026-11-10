import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { ATLAS_URL } from '../../atlas.js';

// Exact source meshes, in their original shared coordinates. No invented branches.
export const REGIONS = {
  aortoiliac: { match: /Abdominal aorta|iliac artery|iliolumbar artery|Median sacral artery|Inferior epigastric artery|Lumbar arteries/, y: [.865, 1.16] },
  femoral: { match: /femoral arter|Femoral artery|External iliac artery|epigastric artery|circumflex iliac artery/, side: '.r', y: [.66, .97] },
  runoff: { match: /Femoral artery|Popliteal artery|tibial arter|fibular arter|Fibular artery|genicular arter|plantar arter|plantar arch|plantar digital arter|plantar metatarsal arter|Dorsalis pedis artery|Arcuate artery/i, side: '.r', y: [.025, .67] },
  visceral: { match: /Abdominal aorta|Coeliac trunk|gastric arter|Splenic artery|hepatic arter|Gastroduodenal artery|mesenteric arter|renal arter|Intrarenal arter|pancreaticoduodenal arter|Jejunal arter|Ileal arter|colic arter/i, y: [.99, 1.29] },
  arm: { match: /Left subclavian artery|Axillary artery|Brachial artery|brachial arter|Radial artery|Ulnar artery|interosseous arter|palmar arch|palmar digital arter|palmar metacarpal arter|carpal branch/i, side: '.l', y: [.70, 1.49] }
};

const IDS = [
  [/^Abdominal aorta/, 'abdominal-aorta'], [/^Common iliac/, 'common-iliac'],
  [/^External iliac/, 'external-iliac'], [/^Internal iliac/, 'internal-iliac'],
  [/^Anterior division of internal iliac/, 'iia-anterior'], [/^Posterior division of internal iliac/, 'iia-posterior'],
  [/^Median sacral/, 'median-sacral'], [/^Inferior epigastric/, 'inferior-epigastric'],
  [/^Deep femoral/, 'profunda'], [/^Lateral circumflex femoral/, 'lateral-circumflex'],
  [/^Medial circumflex femoral/, 'medial-circumflex'], [/^Femoral artery/, 'femoral-sfa'],
  [/^Popliteal/, 'pop-p2'], [/^Anterior tibial/, 'anterior-tibial'], [/^Posterior tibial/, 'posterior-tibial'],
  [/^Fibular artery/, 'peroneal'], [/^Dorsalis pedis/, 'dorsalis-pedis'],
  [/^Lateral plantar/, 'lateral-plantar'], [/^Medial plantar/, 'medial-plantar'], [/^Plantar arch/, 'plantar-arch'],
  [/^Coeliac/, 'celiac'], [/^Splenic/, 'splenic'], [/^Left gastric/, 'left-gastric'],
  [/^Common hepatic/, 'common-hepatic'], [/^Proper hepatic/, 'proper-hepatic'],
  [/^Gastroduodenal/, 'gastroduodenal'], [/^Superior mesenteric/, 'sma'], [/^Inferior mesenteric/, 'ima'],
  [/^(Left|Right) renal/, 'renal'], [/^Left subclavian/, 'subclavian'], [/^Axillary/, 'axillary'],
  [/^Brachial artery/, 'brachial'], [/^Radial artery/, 'radial'], [/^Ulnar artery/, 'ulnar'],
  [/^Common interosseous/, 'interosseous'], [/^Superficial palmar arch/, 'superficial-arch'], [/^Deep palmar arch/, 'deep-arch']
];

export function regionIncludes(name, region, regions = REGIONS) {
  const r = regions[region];
  return Boolean(r && !/vein|venous/i.test(name) && r.match.test(name)
    && (!r.side || !/\.[lr]$/.test(name) || name.endsWith(r.side)));
}

export function createPeripheralAtlas({ onReady = () => {}, regions = REGIONS, identify = name => IDS.find(([re]) => re.test(name))?.[1] || null } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.localClippingEnabled = true;
  renderer.setPixelRatio(1.5);
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  scene.add(group);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x383838, 2));
  const light = new THREE.DirectionalLight(0xffffff, 2.4);
  light.position.set(-1, 2, 3); scene.add(light);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .001, 10);
  const raycaster = new THREE.Raycaster();
  const decoder = new DRACOLoader().setDecoderPath('/draco/');
  const meshes = [], center = new THREE.Vector3();
  let ready = false, disposed = false, failed = false, lastRegion = '', zoom = 1, radius = .3;
  let lastState = null, lastSize = '', renderedKey = '';
  const planes = [new THREE.Plane(new THREE.Vector3(0, 1, 0)), new THREE.Plane(new THREE.Vector3(0, -1, 0))];
  const material = new THREE.MeshStandardMaterial({ color: 0x24272a, roughness: .55, metalness: 0, side: THREE.DoubleSide, clippingPlanes: planes });
  const selectionMaterial = material.clone(); selectionMaterial.color.set(0x528b99);
  selectionMaterial.clippingPlanes = planes;
  const contrastFront = { value: 0 };
  const contrastEnabled = { value: 1 };
  for (const m of [material, selectionMaterial]) {
    m.onBeforeCompile = shader => {
      shader.uniforms.periFront = contrastFront;
      shader.uniforms.periContrast = contrastEnabled;
      shader.vertexShader = 'varying float periY;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nperiY = position.y;');
      shader.fragmentShader = 'varying float periY; uniform float periFront; uniform float periContrast;\n' + shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= mix(1.0, smoothstep(periFront - 0.008, periFront + 0.008, periY), periContrast);');
    };
    m.customProgramCacheKey = () => 'peripheral-atlas-contrast-v1';
  }
  const status = () => failed ? 'error' : ready ? 'ready' : 'loading';
  const load = new GLTFLoader().setDRACOLoader(decoder).loadAsync(ATLAS_URL).then(gltf => {
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(obj => {
      if (!obj.isMesh) return;
      const sourceName = gltf.parser.json.nodes[gltf.parser.associations.get(obj)?.nodes]?.name || obj.name;
      if (!disposed && Object.keys(regions).some(r => regionIncludes(sourceName, r, regions))) {
        const geometry = obj.geometry.clone().applyMatrix4(obj.matrixWorld);
        geometry.computeBoundingBox();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = sourceName;
        mesh.userData.id = identify(sourceName);
        group.add(mesh); meshes.push(mesh);
      }
    });
    gltf.scene.traverse(obj => { if (obj.isMesh) { obj.geometry.dispose(); for (const m of [].concat(obj.material)) m.dispose(); } });
    if (!disposed) { ready = true; onReady(); }
  }).catch(error => {
    if (!disposed) { failed = true; console.warn('Peripheral atlas load failed', error); onReady(); }
  }).finally(() => decoder.dispose());

  function fit(region) {
    const r = regions[region];
    const box = new THREE.Box3();
    meshes.forEach(mesh => {
      const b = mesh.geometry.boundingBox;
      mesh.userData.id = identify(mesh.name, region);
      mesh.visible = regionIncludes(mesh.name, region, regions) && b.max.y >= r.y[0] && b.min.y <= r.y[1];
      if (mesh.visible) box.union(b);
    });
    box.min.y = Math.max(box.min.y, r.y[0]); box.max.y = Math.min(box.max.y, r.y[1]);
    box.getCenter(center);
    radius = Math.max(...box.getSize(new THREE.Vector3()).toArray()) * .59;
    planes[0].constant = -r.y[0]; planes[1].constant = r.y[1];
    zoom = 1;
    lastRegion = region;
  }

  function draw(canvas, state, anatomy = false) {
    lastState = state;
    canvas.dataset.periAtlas = status();
    const width = Number(canvas.dataset.logicalW || 540), height = Number(canvas.dataset.logicalH || 440);
    const ctx = canvas.getContext('2d');
    if (!ready) {
      ctx.fillStyle = '#d8dbdc'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#25303b'; ctx.font = '14px system-ui';
      ctx.fillText(state.lang === 'en' ? (failed ? 'Atlas unavailable. Reload to retry.' : 'Loading vascular atlas…') : (failed ? 'Atlas yüklenemedi. Yeniden yükleyin.' : 'Damar atlası yükleniyor…'), 25, 80);
      return;
    }
    if (state.viewId !== lastRegion) fit(state.viewId);
    const size = `${width}:${height}`;
    if (size !== lastSize) { renderer.setSize(width, height, false); lastSize = size; }
    const aspect = width / height;
    camera.left = -radius * aspect / zoom; camera.right = radius * aspect / zoom;
    camera.top = radius / zoom; camera.bottom = -radius / zoom;
    camera.updateProjectionMatrix();
    const a = THREE.MathUtils.degToRad(state.alpha), b = THREE.MathUtils.degToRad(state.beta);
    camera.position.copy(center).add(new THREE.Vector3(Math.sin(a) * Math.cos(b), Math.sin(b), Math.cos(a) * Math.cos(b)).multiplyScalar(2));
    camera.lookAt(center); camera.updateMatrixWorld();
    const roadmap = state.imagingMode === 'roadmap';
    scene.background = new THREE.Color(anatomy ? 0x111c26 : roadmap ? 0x171b20 : state.imagingMode === 'fluoro' ? 0xc0c4c5 : 0xd9dcdd);
    material.color.set(anatomy ? 0xb94b40 : roadmap ? 0xc4c7c7 : 0x24272a);
    if (material.transparent !== !anatomy) {
      material.needsUpdate = true;
      selectionMaterial.needsUpdate = true;
    }
    material.transparent = !anatomy;
    material.depthWrite = anatomy;
    selectionMaterial.depthWrite = anatomy;
    material.opacity = anatomy ? 1 : Math.max(0, Math.min(1, state.contrastOpacity)) * (state.imagingMode === 'fluoro' ? .58 : 1);
    selectionMaterial.transparent = material.transparent;
    selectionMaterial.opacity = material.opacity;
    const range = regions[state.viewId].y;
    contrastFront.value = range[1] + .016 - Math.min(1, Math.max(0, state.bolusWave) / 1.1) * (range[1] - range[0] + .032);
    contrastEnabled.value = anatomy ? 0 : 1;
    // A cranial-to-distal teaching bolus, not measured flow or transit time.
    meshes.forEach(mesh => { mesh.material = mesh.userData.id && mesh.userData.id === state.selectedId ? selectionMaterial : material; });
    const key = JSON.stringify([state.viewId, state.alpha, state.beta, state.imagingMode, anatomy, state.contrastOpacity, state.bolusWave, state.selectedId, zoom, size]);
    if (key !== renderedKey) { renderer.render(scene, camera); renderedKey = key; }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) { canvas.width = width * dpr; canvas.height = height * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(renderer.domElement, 0, 0, width, height);
    ctx.fillStyle = anatomy || roadmap ? '#d9e1e6' : '#34424b';
    ctx.font = '12px ui-monospace, monospace';
    ctx.fillText(`${Math.abs(state.alpha) < .5 ? 'AP' : `${state.alpha > 0 ? 'LAO' : 'RAO'} ${Math.abs(Math.round(state.alpha))}°`} · ${Math.round(state.beta)}°`, 18, 28);
    ctx.textAlign = 'right'; ctx.fillText(state.lang === 'en' ? 'CARDIA · 3D ATLAS' : 'CARDIA · 3B ATLAS', width - 18, 28); ctx.textAlign = 'left';
    ctx.font = '11px system-ui';
    ctx.fillText(state.lang === 'en' ? 'R' : 'SAĞ', 18, height / 2);
    ctx.textAlign = 'right'; ctx.fillText(state.lang === 'en' ? 'L' : 'SOL', width - 18, height / 2); ctx.textAlign = 'left';
    if (state.showLabels || state.hoveredId) {
      const selected = meshes.find(m => m.visible && m.userData.id && m.userData.id === (state.hoveredId || state.selectedId));
      if (selected) { ctx.fillStyle = anatomy || roadmap ? '#fff' : '#202a30'; ctx.fillText(selected.name, 18, height - 22); }
    }
    canvas.dataset.atlasMeshes = String(meshes.filter(m => m.visible).length);
  }

  return {
    draw, status, ready: load,
    pick(x, y) {
      if (!ready) return null;
      raycaster.setFromCamera(new THREE.Vector2(x * 2 - 1, 1 - y * 2), camera);
      const hits = raycaster.intersectObjects(meshes.filter(m => m.visible), false);
      const hit = hits.find(h => planes.every(p => p.distanceToPoint(h.point) >= 0));
      if (!hit) return null;
      const id = hit.object.userData.id;
      if (id === 'abdominal-aorta' && lastState?.viewId === 'visceral') return 'visceral-aorta';
      if (id === 'femoral-sfa') {
        if (lastState?.viewId === 'runoff') return 'sfa';
        const profunda = meshes.find(m => m.visible && m.name === 'Deep femoral artery.r');
        if (!profunda) return null;
        const originY = profunda.geometry.boundingBox.max.y;
        if (Math.abs(hit.point.y - originY) < .005) return null;
        return hit.point.y > originY ? 'common-femoral' : 'femoral-sfa';
      }
      return id;
    },
    zoom(delta) { zoom = Math.max(.7, Math.min(3.5, zoom * Math.exp(-delta * .001))); },
    dispose() { disposed = true; meshes.forEach(m => m.geometry.dispose()); material.dispose(); selectionMaterial.dispose(); renderer.dispose(); }
  };
}

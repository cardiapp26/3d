import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { ATLAS_URL, atlasParts } from '../../atlas.js';
import { prepareArtery, updateLumen, pointAtMm } from './coronary-physiology-geometry.js';
import { samplePullbackRatio } from './coronary-physiology-sim.js';
import { drawAtlasAnnotations } from './coronary-physiology-atlas-labels.js';

// One geometry, camera and projection for lumen, lesion, wire and sensor.
export function createPhysiologyAtlas({ onReady = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const scene = new THREE.Scene(), vessels = new THREE.Group(), devices = new THREE.Group();
  scene.add(vessels, devices, new THREE.HemisphereLight(0xffffff, 0x302328, 2.6));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(-20, 140, 40); scene.add(light);
  const camera = new THREE.OrthographicCamera(-8, 8, 8, -8, .1, 500);
  const decoder = new DRACOLoader().setDecoderPath('/draco/');
  const arteries = new Map();
  const anatomyMaterial = new THREE.MeshStandardMaterial({ color: 0xa34235, roughness: .63, side: THREE.DoubleSide });
  const uniforms = { front: { value: 1000 }, opacity: { value: 1 }, mapped: { value: 0 } };
  const xrayMaterial = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, side: THREE.FrontSide,
    vertexShader: `attribute float flowMm; attribute vec3 ratioInk;
      varying float travel; varying vec3 normalView; varying vec3 viewPoint; varying vec3 ink;
      void main() { travel = flowMm; ink = ratioInk; normalView = normalize(normalMatrix * normal);
        vec4 p = modelViewMatrix * vec4(position, 1.0); viewPoint = p.xyz;
        gl_Position = projectionMatrix * p; }`,
    fragmentShader: `uniform float front; uniform float opacity; uniform float mapped;
      varying float travel; varying vec3 normalView; varying vec3 viewPoint; varying vec3 ink;
      void main() {
        float thickness = pow(abs(dot(normalize(normalView), normalize(-viewPoint))), .55);
        float filled = 1.0 - smoothstep(front - 8.0, front + 8.0, travel);
        gl_FragColor = vec4(mix(vec3(.055, .065, .07), ink, mapped),
          opacity * filled * (.24 + .7 * thickness));
      }`
  });
  const wireMaterial = new THREE.MeshBasicMaterial({ color: 0x24282b });
  const tipMaterial = new THREE.MeshBasicMaterial({ color: 0x101619 });
  const sensorMaterial = new THREE.MeshBasicMaterial({ color: 0xf8d97a });
  const stentMaterial = new THREE.MeshBasicMaterial({ color: 0x687b84, transparent: true, opacity: .8 });
  let disposed = false, loaded = false, failed = false, zoom = 1, lastVessel = '', lastSize = '';
  let deviceKey = '', lumenKey = '', radius = 7;
  const center = new THREE.Vector3();
  const detector = document.createElement('canvas'); detector.width = detector.height = 192;
  const noiseCtx = detector.getContext('2d'), grain = noiseCtx.createImageData(192, 192);
  let seed = 7319;
  for (let i = 0; i < grain.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = seed & 255; grain.data[i + 3] = 15;
  }
  noiseCtx.putImageData(grain, 0, 0);
  const status = () => failed ? 'error' : loaded ? 'ready' : 'loading';
  const ready = new GLTFLoader().setDRACOLoader(decoder).loadAsync(ATLAS_URL).then(gltf => {
    try {
      gltf.scene.updateMatrixWorld(true);
      let rightOrigin = null;
      gltf.scene.traverse(obj => {
        if (!obj.isMesh || disposed) return;
        const name = gltf.parser.json.nodes[gltf.parser.associations.get(obj)?.nodes]?.name || obj.name;
        const part = atlasParts[name];
        if (part?.id === 'rcc') rightOrigin = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3()).multiplyScalar(100);
        if (part?.layer !== 'coronaries') return;
        const geometry = obj.geometry.clone().applyMatrix4(obj.matrixWorld).scale(100, 100, 100);
        const mesh = new THREE.Mesh(geometry, xrayMaterial);
        mesh.name = name; mesh.userData.system = part.system;
        vessels.add(mesh); arteries.set(part.id, { mesh });
      });
      if (disposed) return;
      const lm = arteries.get('lm')?.mesh;
      if (!lm || !rightOrigin) throw new Error('Coronary origins missing from atlas');
      lm.geometry.computeBoundingBox();
      const leftOrigin = lm.geometry.boundingBox.getCenter(new THREE.Vector3());
      for (const artery of arteries.values()) Object.assign(artery,
        prepareArtery(artery.mesh.geometry, artery.mesh.userData.system === 'right' ? rightOrigin : leftOrigin));
      for (const id of ['lad', 'lcx', 'rca']) if (!(arteries.get(id)?.lengthMm >= 110)) throw new Error(`Atlas path too short: ${id}`);
      loaded = true;
    } finally {
      gltf.scene.traverse(obj => { if (obj.isMesh) { obj.geometry.dispose(); for (const m of [].concat(obj.material)) m.dispose(); } });
    }
    if (!disposed) onReady();
  }).catch(error => {
    if (!disposed) { failed = true; console.warn('Coronary physiology atlas failed', error); onReady(); }
  }).finally(() => decoder.dispose());

  function clearDevices() {
    for (const obj of [...devices.children]) { obj.geometry.dispose(); devices.remove(obj); }
  }
  function tube(points, thickness, material, segments = 120) {
    if (points.length < 2) return;
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, thickness, 8, false), material);
    mesh.renderOrder = 2; devices.add(mesh);
  }
  function buildDevices(artery, state, caseObj) {
    clearDevices();
    const origin = pointAtMm(artery, 0);
    let guide;
    if (artery.mesh.userData.system === 'left') {
      guide = arteries.get('lm').rings.map(r => r.center.clone());
      if (guide[0].distanceTo(origin) < guide.at(-1).distanceTo(origin)) guide.reverse();
      guide.push(origin);
    } else guide = [origin.clone().add(origin.clone().sub(pointAtMm(artery, 3)).normalize().multiplyScalar(.8)), origin];
    // Simulated guide enters from above and engages the source coronary origin.
    const entry = guide[0].clone();
    guide.unshift(entry.clone().add(new THREE.Vector3(-.8, 2.2, -.3)), entry.clone().add(new THREE.Vector3(-.4, .8, -.2)));
    tube(guide, .065, wireMaterial, 80);
    const sensorMm = THREE.MathUtils.clamp(Number(state.sensorMm) || 0, 0, 80);
    const tipMm = Math.min(artery.lengthMm, sensorMm + (state.modality === 'doppler' ? 0 : 30));
    const sample = (start, end) => {
      const points = []; for (let mm = start; mm < end; mm += .5) points.push(pointAtMm(artery, mm));
      points.push(pointAtMm(artery, end)); return points;
    };
    tube(sample(0, tipMm), .018, wireMaterial);
    if (tipMm > sensorMm) tube(sample(sensorMm, tipMm), .026, tipMaterial, 80);
    if (state.device === 'mc' && sensorMm > 4) tube(sample(0, sensorMm - 4), .045, wireMaterial);
    tube(sample(Math.max(0, sensorMm - .8), sensorMm + .8), .045, sensorMaterial, 8);
    for (const lesion of caseObj.lesions || []) {
      if (!(state.stentedIds || []).includes(lesion.id)) continue;
      const half = (lesion.lengthMm || 8) / 2 + 2, helix = [];
      for (let mm = Math.max(0, lesion.posMm - half); mm <= Math.min(artery.lengthMm, lesion.posMm + half); mm += .15) {
        const p = pointAtMm(artery, mm), tangent = pointAtMm(artery, mm + .2).sub(pointAtMm(artery, mm - .2)).normalize();
        const n = new THREE.Vector3(0, 1, 0).cross(tangent).normalize(), b = tangent.clone().cross(n);
        const ring = artery.rings.reduce((best, r) => Math.abs(r.mm - mm) < Math.abs(best.mm - mm) ? r : best);
        const radius = ring.radius * (state.underexpanded ? .78 : 1);
        p.addScaledVector(n, Math.cos(mm * 4) * radius).addScaledVector(b, Math.sin(mm * 4) * radius); helix.push(p);
      }
      tube(helix, .008, stentMaterial, Math.max(32, helix.length * 2));
    }
  }

  function draw(canvas, { state, caseObj, lang, alpha, beta }) {
    canvas.dataset.periAtlas = status();
    const w = Math.max(240, canvas.clientWidth || 540), h = Math.max(250, canvas.clientHeight || 440);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!loaded) {
      ctx.fillStyle = '#c2c8ca'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#263139'; ctx.font = '13px system-ui';
      ctx.fillText(lang === 'en' ? (failed ? 'Atlas unavailable. Reload to retry.' : 'Loading coronary anatomy…') : (failed ? 'Atlas yüklenemedi. Yeniden yükleyin.' : 'Koroner anatomi yükleniyor…'), 20, 60);
      return { path: [], lesions: [], sensor: null };
    }
    const artery = arteries.get(state.vessel.toLowerCase()), anatomy = Boolean(state.atlasAnatomy);
    if (lastVessel !== state.vessel) {
      const box = new THREE.Box3();
      for (const a of arteries.values()) {
        a.mesh.visible = a.mesh.userData.system === artery.mesh.userData.system;
        if (a.mesh.visible) { a.mesh.geometry.computeBoundingBox(); box.union(a.mesh.geometry.boundingBox); }
      }
      box.getCenter(center); radius = Math.max(...box.getSize(new THREE.Vector3()).toArray()) * .60;
      zoom = 1; lastVessel = state.vessel;
    }
    const nextLumen = JSON.stringify([state.vessel, caseObj.id, caseObj.lesions, caseObj.diffuseLoss, state.stentedIds, state.underexpanded]);
    if (nextLumen !== lumenKey) {
      for (const a of arteries.values()) updateLumen(a, a === artery ? caseObj : {}, a === artery ? state : {});
      lumenKey = nextLumen;
    }
    const nextDevice = JSON.stringify([nextLumen, state.sensorMm, state.modality, state.device]);
    if (nextDevice !== deviceKey) { buildDevices(artery, state, caseObj); deviceKey = nextDevice; }
    if (lastSize !== `${w}:${h}`) { renderer.setSize(w, h, false); lastSize = `${w}:${h}`; }
    const aspect = w / h, frame = radius / Math.min(1, aspect) / zoom;
    camera.left = -frame * aspect; camera.right = frame * aspect; camera.top = frame; camera.bottom = -frame;
    camera.updateProjectionMatrix();
    const a = THREE.MathUtils.degToRad(alpha), b = THREE.MathUtils.degToRad(beta);
    camera.position.copy(center).add(new THREE.Vector3(Math.sin(a) * Math.cos(b), Math.sin(b), Math.cos(a) * Math.cos(b)).multiplyScalar(100));
    camera.lookAt(center); camera.updateMatrixWorld();
    scene.background = new THREE.Color(anatomy ? '#101a24' : '#bfc5c7');
    for (const a of arteries.values()) a.mesh.material = anatomy ? anatomyMaterial : xrayMaterial;
    uniforms.mapped.value = state.fluoroView === 'map' ? 1 : 0;
    uniforms.opacity.value = state.fluoroView === 'fluoro' ? .1 : 1;
    const progress = state.contrastProgress ?? 1;
    uniforms.front.value = progress >= 1 ? 1000 : progress * 240 - 12;
    renderer.render(scene, camera);
    ctx.save(); ctx.filter = anatomy ? 'none' : 'blur(0.35px)'; ctx.drawImage(renderer.domElement, 0, 0, w, h); ctx.restore();
    const vignette = ctx.createRadialGradient(w / 2, h / 2, h * .2, w / 2, h / 2, Math.max(w, h) * .7);
    vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(10,18,23,.25)');
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h);
    if (!anatomy) { ctx.fillStyle = ctx.createPattern(detector, 'repeat'); ctx.fillRect(0, 0, w, h); }
    const project = point => { const p = point.clone().project(camera); return { x: (p.x + 1) * w / 2, y: (1 - p.y) * h / 2 }; };
    const at = mm => project(pointAtMm(artery, mm));
    const path = Array.from({ length: 161 }, (_, i) => ({ ...at(i / 2), mm: i / 2 }));
    const mm = THREE.MathUtils.clamp(Number(state.sensorMm) || 0, 0, 80);
    const sensor = { ...at(mm), mm, ratio: samplePullbackRatio(caseObj, mm, { hyperemia: state.hyperemia !== false, stentedIds: state.stentedIds || [], underexpanded: state.underexpanded, microcatheter: state.device === 'mc' }) };
    const lesions = drawAtlasAnnotations(ctx, { w, h, state, caseObj, lang, alpha, beta, sensor, at });
    canvas.dataset.atlasMeshes = String([...arteries.values()].filter(a => a.mesh.visible).length);
    canvas.dataset.pathLengthMm = artery.lengthMm.toFixed(2);
    return { path, lesions, sensor };
  }
  return { draw, status, ready,
    zoom(delta) { zoom = THREE.MathUtils.clamp(zoom * Math.exp(-delta * .001), .7, 2.2); },
    dispose() { disposed = true; clearDevices(); for (const a of arteries.values()) a.mesh.geometry.dispose();
      for (const m of [anatomyMaterial, xrayMaterial, wireMaterial, tipMaterial, sensorMaterial, stentMaterial]) m.dispose(); renderer.dispose(); }
  };
}

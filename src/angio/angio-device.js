import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Device geometry is schematic; the coronary views use the separate atlas engine.
export function createAngioDevice(mount) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b1421');
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 50);
  camera.up.set(0, 0, 1);
  camera.position.set(5, -6, 4);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  mount.append(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 4; controls.maxDistance = 14;
  const render = () => renderer.render(scene, camera);
  controls.addEventListener('change', render);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 3));
  const light = new THREE.DirectionalLight(0xffffff, 4);
  light.position.set(4, -3, 6); scene.add(light);
  const materials = new Map();
  const material = color => {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .5, metalness: .25 }));
    return materials.get(color);
  };
  function box(parent, size, position, color) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color));
    mesh.position.set(...position); parent.add(mesh); return mesh;
  }
  function sphere(size, position, color) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), material(color));
    mesh.scale.set(...size); mesh.position.set(...position); scene.add(mesh);
  }
  box(scene, [3.8, 5, .1], [0, 0, -2.2], '#142337');
  box(scene, [.9, 4, .15], [0, 0, -.32], '#64748b');
  box(scene, [.4, .7, 1.65], [0, -.7, -1.2], '#334155');
  sphere([.3, .28, .23], [0, 1.15, .03], '#a8bac9');
  sphere([.38, .68, .18], [0, .2, -.01], '#8da5b8');
  for (const x of [-.18, .18]) sphere([.14, .75, .13], [x, -.9, -.06], '#8da5b8');
  sphere([.08, .09, .08], [0, 0, .18], '#f87171');
  const gantry = new THREE.Group(); scene.add(gantry);
  const points = Array.from({ length: 65 }, (_, i) => {
    const t = i / 64 * Math.PI;
    return new THREE.Vector3(-1.8 * Math.sin(t), 0, -1.8 * Math.cos(t));
  });
  gantry.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 64, .1, 10, false), material('#cbd5e1')));
  box(gantry, [.65, .52, .35], [0, 0, -1.8], '#f59e0b');
  box(gantry, [.86, .72, .14], [0, 0, 1.8], '#38bdf8');
  const beamMaterial = new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.42, .08, 3.5, 24, 1, true), beamMaterial);
  beam.rotation.x = Math.PI / 2; gantry.add(beam);
  const observer = new ResizeObserver(() => {
    const w = Math.max(1, mount.clientWidth), h = Math.max(1, mount.clientHeight);
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); render();
  });
  observer.observe(mount);
  let alpha = 0, beta = 0;
  return {
    setAngles(a, b) {
      alpha = a; beta = b;
      gantry.rotation.set(-THREE.MathUtils.degToRad(b), THREE.MathUtils.degToRad(a), 0, 'YXZ'); render();
    },
    setBeam(on) { beam.visible = on; render(); },
    getState: () => ({ alpha, beta, beam: beam.visible }),
    dispose() {
      observer.disconnect(); controls.dispose();
      scene.traverse(o => o.geometry?.dispose());
      materials.forEach(m => m.dispose()); beamMaterial.dispose();
      renderer.dispose(); renderer.domElement.remove();
    }
  };
}

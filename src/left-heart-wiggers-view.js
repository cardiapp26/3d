import * as THREE from 'three';
import { leftHeartFrame, pressureColor } from './left-heart-pressures.js';
import { rightHeartFrame } from './right-heart-pressures.js';

// One cutaway per side, each with its own plane; 'both' shows the two together on one clock.
const SIDES = {
  left: {
    mode: 'left-heart-wiggers',
    ids: new Set(['la', 'lv', 'aorta', 'mitral', 'lcc', 'rcc', 'ncc', 'mitral-annulus']),
    pressures: { la: 'la', lv: 'lv', aorta: 'ao' },
    valves: { mitral: { anchor: ['mitral-annulus'], open: 'mitralOpen', shift: .82 }, 'aortic-valve': { anchor: ['lcc', 'rcc', 'ncc'], open: 'aorticOpen', shift: -.82 } }
  },
  right: {
    mode: 'right-heart-wiggers',
    ids: new Set(['ra', 'rv', 'pa', 'tricuspid', 'tricuspid-annulus', 'pulmonary-valve', 'rv-papillary']),
    pressures: { ra: 'ra', rv: 'rv', pa: 'pa' },
    valves: { tricuspid: { anchor: ['tricuspid-annulus'], open: 'tricuspidOpen', shift: -.82 }, 'pulmonary-valve': { anchor: ['pulmonary-valve'], open: 'pulmonaryOpen', shift: .82 } }
  }
};
const MODES = { left: 'left-heart-wiggers', right: 'right-heart-wiggers', both: 'heart-wiggers' };
const PRESSURE_IDS = { ...SIDES.left.pressures, ...SIDES.right.pressures };
const sideOfId = id => (SIDES.left.ids.has(id) || id === 'aortic-valve' ? 'left' : SIDES.right.ids.has(id) ? 'right' : null);
const NAMES = {
  tr: { la: 'SOL ATRİYUM', lv: 'SOL VENTRİKÜL', aorta: 'AORT', mitral: 'MİTRAL KAPAK', 'aortic-valve': 'AORT KAPAĞI', ra: 'SAĞ ATRİYUM', rv: 'SAĞ VENTRİKÜL', pa: 'PULMONER ARTER', tricuspid: 'TRİKÜSPİT KAPAK', 'pulmonary-valve': 'PULMONER KAPAK' },
  en: { la: 'LEFT ATRIUM', lv: 'LEFT VENTRICLE', aorta: 'AORTA', mitral: 'MITRAL VALVE', 'aortic-valve': 'AORTIC VALVE', ra: 'RIGHT ATRIUM', rv: 'RIGHT VENTRICLE', pa: 'PULMONARY ARTERY', tricuspid: 'TRICUSPID VALVE', 'pulmonary-valve': 'PULMONARY VALVE' }
};
/** Pressures and valve states of both sides at one cycle state. */
export const heartFrame = state => ({ ...rightHeartFrame(state), ...leftHeartFrame(state) });

/** Left heart only (the original Live Wiggers view). */
export function createLeftHeartWiggersView(options) { return createHeartWiggersView(options); }

/** Native atlas cutaway. No second renderer, geometry replacement, or clock. */
export function createHeartWiggersView({ heart, getLang = () => 'tr' }) {
  let active = false, destroyed = false, generation = 0, snapshot = null;
  let lang = getLang() === 'en' ? 'en' : 'tr';
  let frame = heartFrame(heart.getCycleState());
  let side = 'left';
  const planes = { left: null, right: null };
  let viewNormal = null;
  const sidesOf = value => (value === 'both' ? ['left', 'right'] : [value]);
  const shownIds = () => new Set(sidesOf(side).flatMap(key => [...SIDES[key].ids]));
  const MODE_NOW = () => MODES[side];
  const records = [], readouts = new Map();
  const group = new THREE.Group();
  group.name = 'Live Wiggers native left-heart pressure readouts';
  group.visible = false;
  heart.addOverlay(group);

  const regionMeshes = id => heart.getMeshes(id).filter(mesh => mesh.geometry?.attributes?.position);
  const centreOf = meshes => {
    const box = new THREE.Box3();
    // Precise bounds read the currently deformed vertices, not cached rest boxes.
    for (const mesh of meshes) box.expandByObject(mesh, true);
    return box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
  };

  function measurePlane(key = 'left') {
    const inflow = key === 'left' ? 'mitral-annulus' : 'tricuspid-annulus', chamber = key === 'left' ? 'lv' : 'rv';
    const outflow = key === 'left' ? ['lcc', 'rcc', 'ncc'] : ['pulmonary-valve'];
    return heart.withRestPose(() => {
      const mv = heart.getMeshes(inflow)[0]?.userData.frame;
      if (!mv || !regionMeshes(chamber).length) return null;
      const lv = centreOf(regionMeshes(chamber));
      const axis = mv.normal.clone();
      if (axis.dot(lv.clone().sub(mv.center)) < 0) axis.negate();
      let apex = lv.clone(), farthest = -Infinity;
      for (const mesh of regionMeshes(chamber)) {
        mesh.updateWorldMatrix(true, false);
        const positions = mesh.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const point = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
          const distance = point.clone().sub(mv.center).dot(axis);
          if (distance > farthest) { farthest = distance; apex.copy(point); }
        }
      }
      const av = centreOf(outflow.flatMap(regionMeshes));
      const normal = new THREE.Vector3().crossVectors(av.clone().sub(mv.center), apex.clone().sub(mv.center)).normalize();
      if (normal.lengthSq() < .5) normal.set(0, 0, -1);
      // Left heart: seen from the patient's left (parasternal long-axis orientation: apex on
      // the left, aorta and LA on the right). Right heart and both sides together: from the front.
      if (key === 'left' && side !== 'both' ? normal.x > 0 : normal.z > 0) normal.negate();
      return { plane: new THREE.Plane().setFromNormalAndCoplanarPoint(normal, mv.center), mv: mv.center.clone(), apex, av };
    });
  }

  function pressureMaterial(original, id) {
    const plane = planes[sideOfId(id)];
    const material = original.clone();
    material.onBeforeCompile = original.onBeforeCompile;
    if (!(id in PRESSURE_IDS)) return { material, uniform: null };
    const uniform = { value: new THREE.Color(pressureColor(frame[PRESSURE_IDS[id]])) };
    const cutUniform = { value: new THREE.Vector4(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant) };
    const originalCompile = original.onBeforeCompile;
    material.onBeforeCompile = function (shader, renderer) {
      originalCompile.call(this, shader, renderer);
      shader.uniforms.leftHeartPressureColor = uniform;
      shader.uniforms.leftHeartCutPlane = cutUniform;
      shader.vertexShader = `varying vec3 leftHeartWorldPosition;\n${shader.vertexShader}`.replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nleftHeartWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );
      shader.fragmentShader = `uniform vec3 leftHeartPressureColor;\nuniform vec4 leftHeartCutPlane;\nvarying vec3 leftHeartWorldPosition;\n${shader.fragmentShader}`.replace(
        '#include <color_fragment>',
        '#include <color_fragment>\nfloat leftHeartCutDepth = dot(vec4(leftHeartWorldPosition, 1.0), leftHeartCutPlane);\nfloat leftHeartSurface = smoothstep(0.012, 0.038, leftHeartCutDepth);\ndiffuseColor.rgb = mix(vec3(0.55, 0.10, 0.10), leftHeartPressureColor, leftHeartSurface);'
      );
    };
    // Atlas sheets have mixed winding: both sides represent the same pressure
    // overlay. The red band is the actual intersection with the cutting plane.
    material.customProgramCacheKey = () => `left-heart-pressure-v2:${original.customProgramCacheKey()}`;
    material.side = THREE.DoubleSide;
    material.vertexColors = false;
    material.clippingPlanes = [plane];
    material.color.set(id === 'aorta' ? '#bd514b' : '#a94b49');
    return { material, uniform, plane };
  }

  function cloneNativeMaterials(structures) {
    const seen = new Set();
    for (const structure of structures) {
      for (const mesh of heart.getMeshes(structure.valveId || structure.id)) {
        if (seen.has(mesh) || Array.isArray(mesh.material)) continue;
        seen.add(mesh);
        const original = mesh.material;
        if (!shownIds().has(mesh.userData.id)) continue;
        const { material, uniform, plane } = pressureMaterial(original, mesh.userData.id);
        const beforeRender = mesh.onBeforeRender;
        records.push({ mesh, original, material, uniform, beforeRender, plane });
        mesh.material = material;
        {
          mesh.onBeforeRender = function (...args) {
            beforeRender?.apply(this, args);
            if (!active) return;
            // Native layer/view setters may refresh these properties while active.
            material.opacity = 1;
            material.transparent = false;
            material.depthWrite = true;
            material.clippingPlanes = uniform && plane ? [plane] : [];
            if (uniform) {
              material.vertexColors = false;
              material.color.set(mesh.userData.id === 'aorta' ? '#bd514b' : '#a94b49');
            }
          };
        }
      }
    }
  }

  function createReadout(id) {
    const canvas = document.createElement('canvas');
    canvas.width = 384; canvas.height = 148;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(.91, .35, 1);
    if (!(id in PRESSURE_IDS)) sprite.scale.set(.82, .24, 1);
    sprite.renderOrder = 12;
    sprite.userData.leftHeartPressure = id;
    group.add(sprite);
    // Valve labels sit beside the valve with a leader line, so they never cover it.
    let leader = null;
    if (!(id in PRESSURE_IDS) || side === 'both') {
      leader = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
        new THREE.LineBasicMaterial({ color: 0x24302c, transparent: true, opacity: .75, depthTest: false, depthWrite: false }));
      leader.renderOrder = 11;
      leader.frustumCulled = false;
      group.add(leader);
    }
    const readout = { canvas, texture, material, sprite, key: '', leader };
    readouts.set(id, readout);
    // The shared clock notifies before native vertex deformation. Place labels
    // during rendering, after the current pose has reached the native mesh.
    sprite.onBeforeRender = () => { if (active) positionReadout(id, readout); };
  }

  function positionReadout(id, readout) {
    let meshes = regionMeshes(id);
    // Leaflet geometry includes chordae extending into the LV; the measured
    // annulus is the valve's anatomical anchor, not the leaflet centroid.
    const key = sideOfId(id), plane = planes[key], valve = SIDES[key].valves[id];
    if (valve) meshes = valve.anchor.flatMap(regionMeshes);
    if (id === 'aorta') {
      const ascending = meshes.filter(mesh => /ascending/i.test(mesh.name));
      if (ascending.length) meshes = ascending;
    }
    if (id === 'pa') {
      const trunk = meshes.filter(mesh => /trunk/i.test(mesh.name));
      if (trunk.length) meshes = trunk;
    }
    const anchor = centreOf(meshes);
    if (id === 'lv' || id === 'rv') anchor.y -= .24;
    if (plane) plane.projectPoint(anchor, anchor).addScaledVector(plane.normal, -.06);
    const valveAt = anchor.clone();
    if (!(id in PRESSURE_IDS) && plane) {
      const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), plane.normal.clone().negate()).normalize();
      anchor.addScaledVector(right, valve.shift);
    } else if (side === 'both' && viewNormal) {
      // Both sides: left-heart labels out to the screen right, right-heart labels to the screen left.
      const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), viewNormal.clone().negate()).normalize();
      anchor.addScaledVector(right, key === 'left' ? 1.25 : -1.25);
    }
    group.updateWorldMatrix(true, false);
    readout.sprite.position.copy(group.worldToLocal(anchor));
    if (readout.leader) {
      // From the label's near edge to the valve anchor.
      const from = group.worldToLocal(anchor.clone().lerp(valveAt, .38)), to = group.worldToLocal(valveAt);
      readout.leader.geometry.setFromPoints([from, to]);
      readout.leader.visible = readout.sprite.visible;
    }
    // Renderer computed scene matrices before invoking this hook.
    readout.sprite.updateMatrixWorld(true);
  }

  function updateReadouts() {
    for (const [id, readout] of readouts) {
      const isPressure = id in PRESSURE_IDS;
      const pressure = isPressure ? frame[PRESSURE_IDS[id]] : null;
      const valve = SIDES[sideOfId(id)].valves[id];
      const open = valve ? frame[valve.open] : false;
      const text = isPressure ? pressure.toFixed(1) : lang === 'en' ? (open ? 'OPEN' : 'CLOSED') : (open ? 'AÇIK' : 'KAPALI');
      const key = `${lang}:${text}`;
      if (key !== readout.key) {
        readout.key = key;
        const ctx = readout.canvas.getContext('2d');
        ctx.clearRect(0, 0, 384, 148);
        ctx.fillStyle = 'rgba(255,255,255,.94)';
        ctx.beginPath(); ctx.roundRect(2, 2, 380, 144, 20); ctx.fill();
        ctx.fillStyle = isPressure ? pressureColor(pressure) : '#887048'; ctx.fillRect(2, 24, 9, 100);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#38454b'; ctx.font = '700 24px system-ui,sans-serif';
        ctx.fillText(NAMES[lang][id], 192, 42);
        ctx.fillStyle = '#172b36'; ctx.font = '700 53px system-ui,sans-serif';
        ctx.fillText(text, isPressure ? 162 : 192, 107);
        if (isPressure) { ctx.font = '500 22px system-ui,sans-serif'; ctx.fillText('mmHg', 287, 104); }
        readout.texture.needsUpdate = true;
      }
    }
  }

  async function enter(nextSide = side) {
    if (destroyed || active) return;
    side = ['left', 'right', 'both'].includes(nextSide) ? nextSide : 'left';
    const token = ++generation;
    await heart.ready;
    if (destroyed || token !== generation || active) return;
    const measured = {};
    for (const key of sidesOf(side)) { measured[key] = measurePlane(key); if (!measured[key]) return; planes[key] = measured[key].plane; }
    snapshot = { state: heart.getState(), opacity: heart.getOpacity(), camera: heart.getZoomInfo() };
    active = true;
    cloneNativeMaterials(snapshot.state.structures);
    heart.setMode(MODE_NOW());
    heart.setFluoroscopy(false);
    heart.setSegmentation(false);
    heart.setRootWindow(false);
    heart.setGraft(null);
    heart.clearSelection();
    heart.setOpacity(1);
    for (const id of ['chambers', 'vessels', 'valves']) heart.setLayer(id, true);
    for (const id of ['coronaries', 'conduction', 'icns', 'thorax', 'flow']) heart.setLayer(id, false);
    const ids = new Set(snapshot.state.structures.map(item => item.valveId || item.id));
    const shown = shownIds();
    for (const id of ids) heart.setLayer(id, shown.has(id));
    // Apply each side's plane after native setters; no separate cuts across chambers.
    for (const record of records) {
      record.material.opacity = 1; record.material.transparent = false; record.material.depthWrite = true;
      record.material.clippingPlanes = record.uniform && record.plane ? [record.plane] : [];
      record.material.needsUpdate = true;
    }
    // One side: look along its cut normal. Both: along the mean of the two normals.
    const normal = sidesOf(side).reduce((sum, key) => sum.add(planes[key].normal), new THREE.Vector3()).normalize();
    viewNormal = normal.clone();
    // Both sides: chamber pressures only; the valve states are listed in the panel.
    for (const key of sidesOf(side)) for (const id of [...Object.keys(SIDES[key].pressures), ...(side === 'both' ? [] : Object.keys(SIDES[key].valves))]) createReadout(id);
    group.visible = true;
    const direction = normal.clone().negate();
    const rao = THREE.MathUtils.radToDeg(Math.atan2(direction.x, direction.z));
    const cranial = THREE.MathUtils.radToDeg(Math.asin(direction.y));
    heart.setAngioProjection(rao, cranial, false, false);
    const centre = centreOf([...shown].filter(id => ['la', 'lv', 'aorta', 'ra', 'rv', 'pa'].includes(id)).flatMap(regionMeshes));
    heart.lookAlong(centre.toArray(), normal.toArray(), [0, 0, 0], side === 'both' ? 5.6 : 4.3);
    tick(heart.getCycleState());
    heart.requestRender();
  }

  function restoreVisibility(state) {
    heart.restoreLayerVisibility(state.visibility);
  }

  function clearReadouts() {
    for (const { texture, material, sprite, leader } of readouts.values()) {
      group.remove(sprite); texture.dispose(); material.dispose();
      if (leader) { group.remove(leader); leader.geometry.dispose(); leader.material.dispose(); }
    }
    readouts.clear();
  }

  function exit({ restoreMode = true } = {}) {
    generation++;
    if (!active) return;
    active = false;
    group.visible = false;
    clearReadouts();
    const previous = snapshot;
    const currentMode = heart.getState().mode;
    const ownsMode = Object.values(MODES).includes(currentMode) || currentMode === 'anatomy';
    if (previous && ownsMode && restoreMode) {
      heart.setMode(previous.state.mode);
      heart.setOpacity(previous.opacity);
      restoreVisibility(previous.state);
      for (const [id, value] of Object.entries(previous.state.wallCuts)) heart.setWallCut(id, value);
      heart.setRootWindow(previous.state.rootWindow);
      heart.setSegmentation(previous.state.segmentation);
      heart.setFluoroscopy(previous.state.fluoroscopy);
      heart.setCoronarySystem(previous.state.system);
      heart.setGraft(previous.state.graft);
      heart.selectStructure(previous.state.selected, false);
      heart.restoreCameraPose(previous.camera);
    }
    // Originals were never modified by native state changes during this view.
    for (const record of records) {
      record.mesh.material = record.original;
      record.mesh.onBeforeRender = record.beforeRender;
      record.material.dispose();
    }
    records.length = 0;
    snapshot = null;
    planes.left = planes.right = null;
    viewNormal = null;
    heart.requestRender();
  }

  function tick(state = heart.getCycleState()) {
    frame = heartFrame(state);
    if (!active) return;
    for (const record of records) if (record.uniform) record.uniform.value.set(pressureColor(frame[PRESSURE_IDS[record.mesh.userData.id]]));
    updateReadouts();
    heart.requestRender();
  }

  return {
    enter, exit, tick,
    /** Switch side ('left' | 'right' | 'both'); re-enters with the same clock when active. */
    async setSide(next) {
      const value = ['left', 'right', 'both'].includes(next) ? next : 'left';
      if (value === side && active) return;
      side = value;
      if (active) { exit(); await enter(value); }
    },
    getSide: () => side,
    setLanguage(value) {
      lang = value === 'en' ? 'en' : 'tr';
      if (active) { updateReadouts(); heart.requestRender(); }
    },
    getState() {
      return {
        active, ready: sidesOf(side).every(key => planes[key]), mode: MODES[side], side, lang,
        visibleIds: [...new Set(records.filter(record => record.mesh.visible).map(record => record.mesh.userData.id))],
        clipPlane: planes.left ? { normal: planes.left.normal.toArray(), constant: planes.left.constant } : null,
        clipPlanes: Object.fromEntries(Object.entries(planes).filter(([, p]) => p).map(([key, p]) => [key, { normal: p.normal.toArray(), constant: p.constant }])),
        pressures: { la: frame.la, lv: frame.lv, ao: frame.ao, ra: frame.ra, rv: frame.rv, pa: frame.pa }, phase: frame.phase,
        readoutCount: readouts.size,
        pressureReadoutCount: [...readouts.keys()].filter(id => id in PRESSURE_IDS).length,
        nativeMeshes: records.length
      };
    },
    destroy() {
      if (destroyed) return;
      exit(); destroyed = true; generation++;
      group.removeFromParent();
    }
  };
}

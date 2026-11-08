/*
 * Three.js 3D Electroanatomical Mapping (EAM) & Whole-Heart Simulation Viewport
 * for the 3D EAM workstation (eam3d-panel.js).
 *
 * Renders:
 * - Translucent four-chamber atlas heart (RA, LA, RV, LV) with vertex-colored
 *   Live Vm wavefronts, Isochronal LAT maps, Bipolar Voltage maps and Phase maps.
 * - Full 3D His-Purkinje network with dense subendocardial Purkinje mesh loops.
 * - Six color-coded 3D intracardiac catheters (DUO, CS, HRA, His, RV, 4x4 HD Grid)
 *   whose electrodes flash in sync with the live polygraph channels.
 * - 3D RF ablation lesion chains and numbered probabilistic circuit ribbons (1..6).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { createRfLayer } from './eam3d-rf-layer.js';
import { ATLAS_URL, normalizedParts, normalizeAtlasName } from '../atlas.js';
import { ATLAS_CONDUCTION as C } from '../ecg/ecg-atlas-conduction.js';
import { ATLAS_CONDUCTION_EXTRAS as X } from './conduction-atlas-extras.js';
import {
  EAM3D_CATHETERS,
  EAM3D_ABLATION_LINES,
  DEFAULT_LEVERS,
  buildHdGridElectrodes,
  evaluateVertex3d,
  vertexWaveState,
  sampleChannelsAt,
  runCircuitSurvey
} from './eam3d-model.js';

const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const DIST = 7.4;
const TARGET = Object.freeze([0, 0.1, 0]);
const CAMERA_VIEWS = Object.freeze({
  ap: [0, 0.35, DIST],
  rao30: [-DIST * Math.sin(Math.PI / 6), 0.35, DIST * Math.cos(Math.PI / 6)],
  lao30: [DIST * Math.sin(Math.PI / 6), 0.35, DIST * Math.cos(Math.PI / 6)],
  pa: [0, 0.35, -DIST],
  xray: [DIST * Math.sin(Math.PI / 6), 0.35, DIST * Math.cos(Math.PI / 6)]
});

const VESSEL_IDS = new Set(['aorta', 'pa', 'svc', 'ivc', 'lspv', 'lipv', 'rspv', 'ripv']);

// Isochronal LAT palette: Red (earliest) -> Orange -> Yellow -> Green -> Cyan -> Blue -> Purple (latest)
const LAT_STOPS = [
  new THREE.Color('#ef4444'),
  new THREE.Color('#f97316'),
  new THREE.Color('#eab308'),
  new THREE.Color('#22c55e'),
  new THREE.Color('#06b6d4'),
  new THREE.Color('#3b82f6'),
  new THREE.Color('#8b5cf6')
];

function samplePalette(stops, t) {
  const u = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(u));
  return stops[i].clone().lerp(stops[i + 1], u - i);
}

export function createEam3dAtlas({ onPointSelect = () => {}, onCircuitSelect = () => {}, onStatus = () => {} } = {}) {
  const element = document.createElement('div');
  element.className = 'eam3d-stage';
  const host = document.createElement('div');
  host.className = 'eam3d-webgl';
  const badges = document.createElement('div');
  badges.className = 'eam3d-badges';
  element.append(host, badges);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    onStatus('failed');
    return {
      element,
      ok: false,
      setState() {},
      setView() {},
      getPointReadout: () => null,
      destroy() { element.remove(); }
    };
  }

  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x060b14, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  host.append(renderer.domElement);
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', '3D electroanatomic map viewport');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(...CAMERA_VIEWS.lao30);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...TARGET);
  controls.enableDamping = true;
  controls.minDistance = 2.8;
  controls.maxDistance = 13;

  scene.add(new THREE.HemisphereLight(0xf8fafc, 0x1e293b, 2.2));
  for (const [pos, intensity] of [[[3, 5, 7], 2.5], [[-4, 2, 3], 1.4], [[1, 3, -6], 1.7]]) {
    const light = new THREE.DirectionalLight(0xfff4e6, intensity);
    light.position.set(...pos);
    scene.add(light);
  }

  const rootGroup = new THREE.Group();
  const chamberGroup = new THREE.Group();
  const vesselGroup = new THREE.Group();
  const conductionGroup = new THREE.Group();
  const catheterGroup = new THREE.Group();
  const lesionGroup = new THREE.Group();
  const circuitGroup = new THREE.Group();
  const tagGroup = new THREE.Group();
  rootGroup.add(vesselGroup, chamberGroup, conductionGroup, catheterGroup, lesionGroup, circuitGroup, tagGroup);
  // RF lesion tags, catheter tip and target guide (eam3d-rf-console.js drives them).
  const rfLayer = createRfLayer();
  rootGroup.add(rfLayer.group);
  scene.add(rootGroup);

  const chambers = [];
  const vessels = [];
  const electrodeMeshes = new Map();
  const conductionLines = [];
  const circuitBadges = [];
  let gridGroup = null;
  let selectionMarker = null;

  let state = {
    scenario: 'avnrt',
    mapMode: 'live',
    view: 'lao30',
    timeMs: 0,
    levers: { ...DEFAULT_LEVERS },
    ablatedLines: new Set(),
    showSurveyRibbons: false,
    selectedCircuit: null,
    surveyPreset: 'biatrial-scar',
    surveyRuns: 100
  };

  let loaded = false;
  let destroyed = false;
  let dirty = true;
  let raf = 0;
  let bakedKey = '';

  const disposeNode = (node) => node.traverse((o) => {
    o.geometry?.dispose();
    for (const m of [o.material].flat().filter(Boolean)) m.dispose();
  });

  // ---- Build 3D Conduction System & Purkinje Lattice ----------------------
  function buildConductionNetwork() {
    const matMain = new THREE.MeshStandardMaterial({
      color: '#f5d08a',
      emissive: '#9a6b16',
      emissiveIntensity: 0.55,
      roughness: 0.35,
      transparent: true,
      opacity: 0.85,
      depthTest: false
    });
    const addCurveTube = (pts, radius = 0.018) => {
      if (!pts || pts.length < 2) return;
      const curve = new THREE.CatmullRomCurve3(pts.map(V));
      const geom = new THREE.TubeGeometry(curve, Math.max(16, pts.length * 6), radius, 6, false);
      const mesh = new THREE.Mesh(geom, matMain.clone());
      mesh.renderOrder = 5;
      conductionGroup.add(mesh);
      conductionLines.push(mesh);
    };

    for (const pt of [C.sa, C.avn]) {
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), matMain.clone());
      node.position.copy(V(pt));
      node.renderOrder = 6;
      conductionGroup.add(node);
      conductionLines.push(node);
    }

    for (const tract of [C.tractAnterior, C.tractMiddle, C.tractPosterior]) addCurveTube(tract, 0.011);
    addCurveTube([C.sa, ...X.bachmann.filter((_, i) => i % 4 === 0)], 0.015);
    addCurveTube(C.his, 0.024);
    addCurveTube(C.rbb, 0.017);
    addCurveTube(C.lbb, 0.022);
    addCurveTube(C.laf, 0.016);
    addCurveTube(C.lpf, 0.018);
    addCurveTube(C.purkinjeRv, 0.012);
    addCurveTube(C.purkinjeLaf, 0.012);
    addCurveTube(C.purkinjeLpf, 0.012);
  }

  // ---- Build 3D Intracardiac Catheters ------------------------------------
  function buildCatheters() {
    disposeNode(catheterGroup);
    catheterGroup.clear();
    electrodeMeshes.clear();

    for (const cat of Object.values(EAM3D_CATHETERS)) {
      const group = new THREE.Group();
      group.name = `catheter-${cat.id}`;

      if (cat.id === 'grid') {
        // 4x4 High-Density Mapping Grid paddle
        const pts = cat.electrodes;
        for (let row = 0; row < 4; row++) {
          const splinePts = [0, 1, 2, 3].map((col) => V(pts[row * 4 + col]));
          const curve = new THREE.CatmullRomCurve3(splinePts);
          const spline = new THREE.Mesh(
            new THREE.TubeGeometry(curve, 16, 0.01, 6, false),
            new THREE.MeshStandardMaterial({ color: cat.color, emissive: cat.color, emissiveIntensity: 0.35 })
          );
          spline.renderOrder = 8;
          group.add(spline);
        }
        pts.forEach((p, idx) => {
          const elMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.019, 10, 10),
            new THREE.MeshStandardMaterial({ color: '#f8fafc', emissive: cat.color, emissiveIntensity: 0.6 })
          );
          elMesh.position.copy(V(p));
          elMesh.renderOrder = 9;
          group.add(elMesh);
          electrodeMeshes.set(`grid-${idx}`, elMesh);
        });
        gridGroup = group;
      } else {
        const curve = new THREE.CatmullRomCurve3(cat.electrodes.map(V));
        const shaft = new THREE.Mesh(
          new THREE.TubeGeometry(curve, Math.max(24, cat.electrodes.length * 4), cat.radius, 8, false),
          new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.45, metalness: 0.2, depthTest: false })
        );
        shaft.renderOrder = 7;
        group.add(shaft);

        cat.electrodes.forEach((p, idx) => {
          const elMesh = new THREE.Mesh(
            new THREE.SphereGeometry(cat.radius * 1.48, 12, 10),
            new THREE.MeshStandardMaterial({
              color: cat.color,
              emissive: cat.color,
              emissiveIntensity: 0.55,
              roughness: 0.25,
              depthTest: false
            })
          );
          elMesh.position.copy(V(p));
          elMesh.renderOrder = 8;
          group.add(elMesh);
          electrodeMeshes.set(`${cat.id}-${idx}`, elMesh);
        });
      }
      catheterGroup.add(group);
    }

    selectionMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.048, 16, 14),
      new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true, depthTest: false })
    );
    selectionMarker.visible = false;
    selectionMarker.renderOrder = 15;
    catheterGroup.add(selectionMarker);
  }

  // ---- Build 3D RF Ablation Lines & Survey Circuit Ribbons ----------------
  function rebuildLesionsAndCircuits() {
    disposeNode(lesionGroup);
    lesionGroup.clear();
    disposeNode(circuitGroup);
    circuitGroup.clear();
    badges.replaceChildren();
    circuitBadges.length = 0;

    // 1. Blocked lines: a thin glowing line under the RF lesion tags (rf layer).
    for (const lineId of state.ablatedLines) {
      const line = EAM3D_ABLATION_LINES[lineId];
      if (!line) continue;
      const curve = new THREE.CatmullRomCurve3(line.points.map(V));
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 28, 0.012, 8, false),
        new THREE.MeshStandardMaterial({
          color: '#dc2626',
          emissive: '#ef4444',
          emissiveIntensity: 0.85,
          roughness: 0.3,
          depthTest: false
        })
      );
      tube.renderOrder = 10;
      lesionGroup.add(tube);
    }

    // 2. Probabilistic Circuit Modeling ribbons (1..6) when Survey mode is active
    if (state.showSurveyRibbons) {
      const survey = runCircuitSurvey({
        mapPreset: state.surveyPreset,
        runs: state.surveyRuns,
        levers: state.levers,
        ablatedLines: state.ablatedLines
      });
      for (const c of survey.circuits) {
        const isSelected = state.selectedCircuit === c.id;
        const opacity = c.interrupted ? 0.18 : isSelected ? 1.0 : 0.82;
        const curve = new THREE.CatmullRomCurve3(c.ribbon3d.map(V), true);
        const ribbon = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 40, isSelected ? 0.032 : 0.022, 8, true),
          new THREE.MeshStandardMaterial({
            color: c.color,
            emissive: c.color,
            emissiveIntensity: isSelected ? 0.9 : 0.55,
            transparent: true,
            opacity,
            depthTest: false
          })
        );
        ribbon.renderOrder = 12;
        circuitGroup.add(ribbon);

        // Directional cone arrow along the circuit ribbon
        const arrowPt = curve.getPointAt(0.35);
        const tangent = curve.getTangentAt(0.35).normalize();
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(0.055, 0.13, 10),
          new THREE.MeshBasicMaterial({ color: c.color, transparent: true, opacity, depthTest: false })
        );
        cone.position.copy(arrowPt);
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
        cone.renderOrder = 13;
        circuitGroup.add(cone);

        // Numbered HTML badge (1..6) projected over the 3D ribbon
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `eam3d-circuit-badge${isSelected ? ' is-selected' : ''}${c.interrupted ? ' is-blocked' : ''}`;
        btn.textContent = String(c.number);
        btn.style.setProperty('--badge-color', c.color);
        btn.dataset.circuitBadge = c.id;
        btn.addEventListener('click', () => onCircuitSelect(c.id));
        badges.append(btn);
        circuitBadges.push({ id: c.id, anchor: V(c.ribbon3d[0]), el: btn });
      }
    }
  }

  // ---- Bake Per-Vertex LAT & Substrate Properties -------------------------
  function ensureVertexMapBaked() {
    const lv = state.levers;
    const key = [
      state.scenario,
      lv.atrialCv,
      lv.ventricularCv,
      lv.afRemodelling,
      lv.vtStudyMesh,
      [...state.ablatedLines].sort().join(',')
    ].join('|');
    if (key === bakedKey || !loaded) return;
    bakedKey = key;

    disposeNode(tagGroup);
    tagGroup.clear();

    for (const mesh of chambers) {
      const chId = mesh.userData.id;
      const pos = mesh.geometry.attributes.position;
      const lats = new Float32Array(pos.count);
      const bipolars = new Float32Array(pos.count);
      const tissues = new Array(pos.count);
      let minLat = Infinity, maxLat = -Infinity;

      for (let i = 0; i < pos.count; i++) {
        const pt = [pos.getX(i), pos.getY(i), pos.getZ(i)];
        const info = evaluateVertex3d(pt, chId, state.scenario, lv, state.ablatedLines);
        lats[i] = info.lat;
        bipolars[i] = info.bipolar;
        tissues[i] = info.tissue;
        if (info.tissue !== 'scar') {
          if (info.lat < minLat) minLat = info.lat;
          if (info.lat > maxLat) maxLat = info.lat;
        }
        // Place sparse 3D LP / LAVA sphere markers on substrate channels
        if (info.tag && i % 42 === 0 && state.mapMode === 'voltage') {
          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.024, 8, 8),
            new THREE.MeshBasicMaterial({ color: info.tag === 'lp' ? '#ffffff' : '#f472b6', depthTest: false })
          );
          dot.position.set(...pt);
          dot.renderOrder = 12;
          tagGroup.add(dot);
        }
      }
      mesh.userData.eam = {
        lats,
        bipolars,
        tissues,
        minLat: Number.isFinite(minLat) ? minLat : 0,
        maxLat: Number.isFinite(maxLat) && maxLat > minLat ? maxLat : 250
      };
    }
  }

  // ---- Paint 3D Chambers & Catheter Electrodes for Current Time -----------
  const tmpColor = new THREE.Color();
  const restAtrialColor = new THREE.Color('#8a6d28');
  const restVentricularColor = new THREE.Color('#7c6526');
  const waveFrontColor = new THREE.Color('#fffbeb');
  const depolarizedColor = new THREE.Color('#ea580c');
  const scarColor = new THREE.Color('#475569');
  const channelColor = new THREE.Color('#dc2626');

  function paintFrame() {
    if (!loaded) return;
    ensureVertexMapBaked();
    const lv = state.levers;
    const xray = state.view === 'xray';
    const sample = sampleChannelsAt(state.timeMs, state.scenario, lv, state.ablatedLines);
    const tcl = sample.tcl;
    const cyclePhase = ((state.timeMs % tcl) + tcl) % tcl;

    const myoOpacity = xray ? 0.16 : Math.max(0.12, Math.min(0.95, lv.myocardiumOpacity / 100));
    const condOpacity = Math.max(0.1, Math.min(1, lv.conductionOpacity / 100));

    conductionGroup.visible = Boolean(lv.showConduction);
    for (const line of conductionLines) {
      if (line.material) line.material.opacity = condOpacity * 0.9;
    }

    for (const mesh of chambers) {
      const chId = mesh.userData.id;
      const isAtrial = chId === 'ra' || chId === 'la';
      if (chId === 'ra') mesh.visible = Boolean(lv.raVisible);
      else if (chId === 'la') mesh.visible = Boolean(lv.laVisible);
      else mesh.visible = Boolean(lv.ventriclesVisible && lv.wallLayer !== 'hide-epi');

      // Wall layer visual scale/representation for ventricles
      if (!isAtrial) {
        const s = lv.wallLayer === 'endo' ? 0.94 : lv.wallLayer === 'mid' ? 0.97 : 1.0;
        mesh.scale.setScalar(s);
      }

      mesh.material.opacity = state.mapMode === 'lat' || state.mapMode === 'voltage'
        ? Math.max(myoOpacity, 0.78)
        : myoOpacity;
      mesh.material.wireframe = Boolean(
        (isAtrial && lv.highDensityAtria) || (!isAtrial && lv.highDensityVentricles)
      );

      const eam = mesh.userData.eam;
      if (!eam) continue;
      const colorAttr = mesh.geometry.attributes.color;
      const restBase = isAtrial ? restAtrialColor : restVentricularColor;

      for (let i = 0; i < colorAttr.count; i++) {
        const lat = eam.lats[i];
        const bipolar = eam.bipolars[i];
        const tissue = eam.tissues[i];

        if (xray) {
          tmpColor.set('#94a3b8');
        } else if (state.mapMode === 'voltage') {
          if (tissue === 'scar') tmpColor.copy(scarColor);
          else if (tissue === 'channel') tmpColor.copy(channelColor);
          else {
            const f = Math.max(0, Math.min(1, (bipolar - 0.3) / 1.5));
            tmpColor.copy(samplePalette(LAT_STOPS, f));
          }
        } else if (state.mapMode === 'lat') {
          if (tissue === 'scar') tmpColor.copy(scarColor);
          else {
            const f = (lat - eam.minLat) / Math.max(1, eam.maxLat - eam.minLat);
            tmpColor.copy(samplePalette(LAT_STOPS, f));
            // Animated wavefront highlight sweeping through the LAT map
            if (Math.abs(lat - cyclePhase) < 14) {
              tmpColor.lerp(waveFrontColor, 0.75);
            }
          }
        } else if (state.mapMode === 'phase') {
          const w = vertexWaveState(lat, tcl, state.timeMs, chId, tissue);
          const hue = ((w.phase + Math.PI) / (2 * Math.PI)) * 0.82;
          tmpColor.setHSL(hue, 0.85, tissue === 'scar' ? 0.22 : 0.52);
        } else {
          // 'live' mode: translucent amber myocardium with bright depolarization wave
          if (tissue === 'scar') {
            tmpColor.copy(scarColor);
          } else if (tissue === 'channel') {
            const w = vertexWaveState(lat, tcl, state.timeMs, chId, tissue);
            tmpColor.copy(channelColor).lerp(waveFrontColor, w.front ? 0.85 : w.u * 0.4);
          } else {
            const w = vertexWaveState(lat, tcl, state.timeMs, chId, tissue);
            if (w.front) tmpColor.copy(waveFrontColor);
            else if (w.u > 0.05) tmpColor.copy(restBase).lerp(depolarizedColor, Math.min(1, w.u * 1.15));
            else tmpColor.copy(restBase);
          }
        }
        colorAttr.setXYZ(i, tmpColor.r, tmpColor.g, tmpColor.b);
      }
      colorAttr.needsUpdate = true;
    }

    // Pulse catheter electrodes when local activation passes
    const anyLit = sample.litChannels.length > 0;
    for (const [key, elMesh] of electrodeMeshes) {
      const catId = key.split('-')[0];
      const active = anyLit && sample.litChannels.some((ch) => ch.startsWith(catId));
      elMesh.scale.setScalar(active ? 1.32 : 1.0);
    }
  }

  function updateBadgePositions() {
    if (!circuitBadges.length || !host.clientWidth) return;
    for (const b of circuitBadges) {
      const p = b.anchor.clone().project(camera);
      b.el.hidden = p.z > 1;
      b.el.style.left = `${((p.x + 1) * host.clientWidth) / 2}px`;
      b.el.style.top = `${((-p.y + 1) * host.clientHeight) / 2}px`;
    }
  }

  // ---- Raycasting: Click 3D Heart to Inspect LAT/Voltage & Move HD Grid ---
  const raycaster = new THREE.Raycaster();
  let pointerStart = null;
  let lastReadout = null;

  renderer.domElement.addEventListener('pointerdown', (e) => {
    pointerStart = [e.clientX, e.clientY];
  });

  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!pointerStart || Math.hypot(e.clientX - pointerStart[0], e.clientY - pointerStart[1]) > 6) return;
    if (!loaded) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(ndc, camera);
    const visibleChambers = chambers.filter((m) => m.visible);
    const hit = raycaster.intersectObjects(visibleChambers, false)[0];
    if (!hit) return;

    const pt = [
      Number(hit.point.x.toFixed(3)),
      Number(hit.point.y.toFixed(3)),
      Number(hit.point.z.toFixed(3))
    ];
    const chId = hit.object.userData.id;
    const info = evaluateVertex3d(pt, chId, state.scenario, state.levers, state.ablatedLines);
    lastReadout = { chamber: chId.toUpperCase(), point: pt, ...info };

    if (selectionMarker) {
      selectionMarker.position.copy(hit.point);
      selectionMarker.visible = true;
    }
    // Move the 4x4 HD Grid paddle to the clicked 3D surface location
    if (gridGroup) {
      const newPts = buildHdGridElectrodes(pt);
      newPts.forEach((p, idx) => {
        const m = electrodeMeshes.get(`grid-${idx}`);
        if (m) m.position.copy(V(p));
      });
    }
    dirty = true;
    onPointSelect(lastReadout);
  });

  function resize() {
    if (destroyed) return;
    const w = host.clientWidth, h = host.clientHeight;
    if (w < 2 || h < 2) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dirty = true;
  }

  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(host);
  controls.addEventListener('change', () => { dirty = true; });

  function tick() {
    if (destroyed) return;
    raf = requestAnimationFrame(tick);
    controls.update();
    if (dirty && element.isConnected && host.clientWidth > 0) {
      renderer.render(scene, camera);
      updateBadgePositions();
      dirty = false;
    }
  }
  raf = requestAnimationFrame(tick);

  // ---- Load 3D Heart Atlas ------------------------------------------------
  buildConductionNetwork();
  buildCatheters();
  onStatus('loading');

  const decoder = new DRACOLoader().setDecoderPath('/draco/');
  const loader = new GLTFLoader().setDRACOLoader(decoder);
  loader.loadAsync(ATLAS_URL).then((gltf) => {
    if (destroyed) { disposeNode(gltf.scene); return; }
    gltf.scene.updateMatrixWorld(true);
    const found = [];
    gltf.scene.traverse((obj) => {
      if (!obj.isMesh) return;
      const assoc = gltf.parser.associations.get(obj);
      const name = gltf.parser.json.nodes[assoc?.nodes]?.name || obj.name;
      const part = normalizedParts.get(normalizeAtlasName(name));
      if (part) found.push({ obj, part });
    });

    const bounds = new THREE.Box3();
    found.filter((x) => x.part.layer === 'chambers').forEach((x) => bounds.expandByObject(x.obj));
    if (bounds.isEmpty()) throw new Error('Atlas chambers missing');
    const centre = bounds.getCenter(new THREE.Vector3());
    const scale = 3.3 / Math.max(...bounds.getSize(new THREE.Vector3()).toArray());

    for (const { obj, part } of found) {
      const keep = part.layer === 'chambers' || VESSEL_IDS.has(part.id);
      if (!keep || part.veinGroup === 'cardiac-veins') continue;
      const geometry = obj.geometry.clone().applyMatrix4(obj.matrixWorld);
      geometry.translate(-centre.x, -centre.y, -centre.z);
      geometry.scale(scale, scale, scale);

      if (part.layer === 'chambers') {
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3));
        const mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.52,
            metalness: 0.04,
            transparent: true,
            opacity: 0.42,
            depthWrite: false,
            side: THREE.DoubleSide
          })
        );
        mesh.userData = { ...part };
        mesh.renderOrder = 2;
        chamberGroup.add(mesh);
        chambers.push(mesh);
      } else {
        const mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshStandardMaterial({
            color: '#334155',
            roughness: 0.6,
            transparent: true,
            opacity: 0.22,
            depthWrite: false,
            side: THREE.DoubleSide
          })
        );
        mesh.userData = part;
        mesh.renderOrder = 1;
        vesselGroup.add(mesh);
        vessels.push(mesh);
      }
    }

    disposeNode(gltf.scene);
    decoder.dispose();
    loaded = true;
    element.dataset.loaded = 'true';
    bakedKey = '';
    rebuildLesionsAndCircuits();
    paintFrame();
    onStatus('ready');
    resize();
    dirty = true;
  }).catch((err) => {
    if (destroyed) return;
    element.dataset.loaded = 'error';
    console.warn('EAM 3D Atlas load error:', err);
    onStatus('failed');
  });

  function setView(viewId) {
    const pos = CAMERA_VIEWS[viewId] || CAMERA_VIEWS.lao30;
    state.view = viewId;
    camera.position.set(...pos);
    camera.up.set(0, 1, 0);
    controls.target.set(...TARGET);
    controls.update();
    element.dataset.view = viewId;
    paintFrame();
    dirty = true;
  }

  function setState(patch) {
    const prevLesions = [...state.ablatedLines].join(',');
    const prevSurvey = `${state.showSurveyRibbons}|${state.selectedCircuit}|${state.surveyPreset}|${state.surveyRuns}`;
    const prevMapMode = state.mapMode;
    state = {
      ...state,
      ...patch,
      levers: patch.levers ? { ...state.levers, ...patch.levers } : state.levers,
      ablatedLines: patch.ablatedLines ? new Set(patch.ablatedLines) : state.ablatedLines
    };
    const nextLesions = [...state.ablatedLines].join(',');
    const nextSurvey = `${state.showSurveyRibbons}|${state.selectedCircuit}|${state.surveyPreset}|${state.surveyRuns}`;
    if (prevMapMode !== state.mapMode) bakedKey = '';
    if (prevLesions !== nextLesions || prevSurvey !== nextSurvey) {
      rebuildLesionsAndCircuits();
    }
    rfLayer.setState(patch);
    paintFrame();
    dirty = true;
  }

  return {
    element,
    ok: true,
    setState,
    setView,
    getPointReadout: () => lastReadout,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      controls.dispose();
      decoder.dispose();
      disposeNode(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      element.remove();
    }
  };
}

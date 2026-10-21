import { createSeptalDefects, DEFECT_IDS } from './septal-defects.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { ATLAS_URL, normalizedParts, normalizeAtlasName } from './atlas.js';
import { createEPLandmarks } from './ep-landmarks.js';
import { createEpZones } from './ep-zones.js';
import { createPacemakerLeads } from './pacemaker-leads.js';
import { createMitralScallops } from './mitral-scallops.js';
import { createAnnuli } from './annuli.js';
import { addSchematicAvLeaflets } from './schematic-leaflets.js';
import { addLaaMarker, smoothLaNormals, laaOrificeOf } from './la-landmarks.js';
import { createAuscultationMarkers } from './auscultation-points.js';
import { createThorax } from './thorax.js';
import { createCoronaryGrafts, GRAFTS } from './coronary-grafts.js';
import { buildSchematicPda } from './coronary-pda.js';
import { createIcns } from './icns.js';
import { createTransseptal } from './transseptal.js';
import { createCathLab } from './cath-lab.js';
import { createBachmannGeometry } from './bachmann.js';
import { createCardiacCycle } from './cardiac-cycle.js';
import { createAnimationChannels } from './animation-channels.js';
import { createBloodFlow } from './blood-flow.js';
import { createXrSupport } from './xr.js';
import { createOverlayFollow } from './overlay-follow.js';
import { createSceneLabels } from './scene-labels.js';
import { chamberMode } from './chamber-modes.js';
import { createEustachianValve, createChiariNetwork } from './ra-valves.js';
import { buildCoronaryBranches, branchAt } from './coronary-branches.js';
import { lvRegions, rvRegions, nearSet } from './ventricle-regions.js';
import { rvotSegments, RVOT_SEGMENT_COLORS, RVOT_SEPTAL_GAP } from './rvot-section.js';
import { createRvotCap, createSectionCaps } from './rvot-cap.js';
import { rvFigure2Regions, FIG2_COLORS, FIG2_NAMES, FIG2_LABELS } from './rv-outflow-structures.js';
import { createRvThorax } from './rv-thorax.js';
import { chestPlaneZ } from './auscultation-points.js';
import { RVOT_SEGMENT_TEXT, RVOT_SEGMENTS } from './eps/rvot-segments.js';
import { createModeratorBand } from './moderator-band.js';
import { buildArchBranches } from './aortic-arch-branches.js';
import { pulmonaryBranchTrims } from './pulmonary-trims.js';
import { seatPulmonaryTrunk } from './pulmonary-root.js';
import { mitralParts, wholeMesh, TRICUSPID_LEAFLETS, AORTIC_CUSPS, pulmonaryCusp } from './valve-parts.js';
import { computeContours, drawContours } from './fluoro-contours.js';
import { separateAtriaFromAorta } from './transverse-sinus.js';
import { createCristaTerminalis } from './crista-terminalis.js';
import { shrinkAppendage, createCoumadinRidge } from './la-appendage.js';
import { measuredFlowRoutes } from './flow-routes.js';
import { vesselTrimPlane, sharedRim, septalPairs, hisBundleEnd, coronarySinusOstium, seatVesselEnd, inferiorCavalOstium, surfaceExit } from './mesh-utils.js';
import { measureLeftBundle, measureRightBundle } from './conduction-paths.js';
import { applyLayerDefaults, LEAFLET_VISIBILITY_IDS, LESSON_TISSUE_OPACITY, VEIN_VISIBILITY_IDS } from './layer-defaults.js';
import { segmentationLabelFor, visibleSegmentationLabels, createSegmentationLegend } from './segmentation-view.js';

// All reference anatomy is loaded from one local atlas and shares one normalization.
export function createHeart(container, onSelect = () => {}, onHover = () => {}, onAngleChange = () => {}, options = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .05, 100);
  camera.position.set(0, .5, 9.3);
  const headlight = new THREE.PointLight(0xfff8ee, 2.2, 16, 1.2);
  camera.add(headlight);
  scene.add(camera);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, options.pixelRatioCap || 2));
  renderer.setClearColor(0xffffff, 0);
  renderer.localClippingEnabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 0.02;
  controls.maxDistance = 16;
  let needsRender = true;
  // A pan (right button, modifier drag or two fingers) keeps its target; a preset view clears it.
  let userPanned = false;
  renderer.domElement.addEventListener('pointerdown', e => { if (e.button === 2 || e.shiftKey || e.ctrlKey || e.metaKey) userPanned = true; });
  renderer.domElement.addEventListener('touchstart', e => { if (e.touches.length >= 2) userPanned = true; }, { passive: true });
  function requestRender() { needsRender = true; }
  controls.addEventListener('change', () => {
    needsRender = true;
    if (!transition) {
      const dist = camera.position.distanceTo(controls.target);
      if (dist < 0.42 && controls.target.distanceTo(fitCenter) < 2.0) {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        const push = 0.42 - dist;
        controls.target.addScaledVector(forward, push);
        camera.position.addScaledVector(forward, push);
        cameraTarget.copy(camera.position);
        lookTarget.copy(controls.target);
      } else if (dist > 1.4 && controls.target.distanceTo(fitCenter) > 0.05 && !userPanned && !chamberMode(mode) && !/wiggers$/.test(mode) && !rvotOn() && !fig3Sliced()) {
        // Whole-heart views drift back to the heart centre until the user pans; single-chamber views never drift.
        controls.target.lerp(fitCenter, 0.05);
        lookTarget.copy(controls.target);
      }
    }
  });
  scene.add(new THREE.HemisphereLight(0xffffff, 0x65524c, 2.1));
  for (const [position, color, intensity] of [[[3,5,6],0xfff3e6,2.6],[[-5,2,1],0xdaeaf4,.9],[[1,4,-4],0xffffff,1.3]]) {
    const light = new THREE.DirectionalLight(color,intensity); light.position.set(...position); scene.add(light);
  }
  const heart = new THREE.Group(); scene.add(heart);
  const layers = Object.fromEntries(['chambers','vessels','coronaries','valves','conduction','flow','icns'].map(id=>{const g=new THREE.Group();heart.add(g);return [id,g];}));
  const valveIds = ['lcc', 'rcc', 'ncc', 'pulmonary-valve', 'mitral', 'tricuspid', 'mitral-annulus', 'tricuspid-annulus', 'rv-papillary', 'lv-papillary'];
  const visibility = applyLayerDefaults({});
  function setValveFamily(boolVal) {
    valveIds.forEach(id => { visibility[id] = boolVal; });
    visibility['aortic-valve'] = boolVal;
    visibility.papillary = boolVal;
    for (const id of LEAFLET_VISIBILITY_IDS) visibility[id] = boolVal;
  }
  const meshes = [], meshMap = new Map();
  let disposed=false, mode='anatomy', opacity=1, beating=false, selected=null, hovered=null, system='all', rootWindow=false;
  const cardiacCycle = createCardiacCycle({ bpm: 72, phase: 0.0, playing: false, rhythm: 'sinus' });
  let channels = null, bloodFlow = null, overlayFollow = null, flowLegend = null, segLegend = null;
  let fluoroscopy=false, segmentation=false, coronaryContrast=1, lastEmittedKey='', ablationStep=0;
  // Ablation lesson steps that frame Koch's triangle (labels, close-up views).
  const KOCH_LABEL_STEPS=[1,4];
  // Koch close-up: C-arm style obliquity (RAO 30 en face to the septum, LAO 45 along it), close distance.
  // The camera sits just outside the heart surface on that line (never inside tissue).
  const KOCH_VIEWS={koch_rao:-30,koch_lao:45}, KOCH_VIEW_DISTANCE=2.1, KOCH_VIEW_CLEARANCE=0.35, KOCH_FOCUS_IDS=['cs','svc','ivc'];
  let kochFocus=false;
  const heartSurfaceExit=(centre,dir)=>surfaceExit(centre,dir,meshes.filter(m=>['chambers','vessels'].includes(m.userData.layer)));
  let center=new THREE.Vector3(), scale=1, frame, down=null, transition=false;
  const cameraTarget=camera.position.clone(), lookTarget=new THREE.Vector3();
  let rootHeight=.7;
  const wallCuts={lv:0,rv:0,la:0,ra:0};
  // RVOT superior section state (RV mode); see buildRvotSection.
  let rvotSection=false,rvotSegment=null,rvotData=null,rvotPainted='',rvotVariant='present',rvotCamera='superior';
  // Posterior camera (Figs. 11-12 A-B): the uncut heart from behind, pulmonary root in place.
  const rvotCut=()=>rvotOn()&&rvotCamera!=='posterior';
  const rvotPaTrim=new THREE.Plane(new THREE.Vector3(0,-1,0),0);   // trunk kept, bifurcation removed in the posterior view
  // Posterior free wall absent (Miyazaki Figs. 10, 12): that segment is referred to as the septal wall.
  const rvotColorOf=id=>RVOT_SEGMENT_COLORS[id==='posterior'&&rvotVariant==='absent'?'septal':id];
  const RVOT_SECTION_IDS=['rv','moderator-band','lv','aorta','lcc','rcc','ncc','lm','lad','septal','rca','gcv'];
  const RVOT_HIDDEN_IDS=['pulmonary-valve','tricuspid','tricuspid-annulus','tricuspid-septal','tricuspid-inferior','tricuspid-anterior','rv-papillary'];
  const rvotOn=()=>rvotSection&&mode==='rv'&&!fluoroscopy;
  // Miyazaki 2026 Figure 2 view (RV mode): inflow/outflow/apical regions, crest, septomarginal trabeculation.
  let rvFig2=false,rvFig2Data=null;
  const fig2On=()=>rvFig2&&mode==='rv'&&!fluoroscopy&&!rvotOn();
  // Aortic root as a faint silhouette behind the opened RV (orientation for the crest and the outflow).
  // Aortic valve level only (cusps): the ascending aorta would cover the RVOT.
  const FIG2_CONTEXT_IDS=['lcc','rcc','ncc'];
  // Miyazaki 2026 Figure 3A-B view (RV mode): right heart blue, left heart red, electrodes and outflow axes.
  let rvFig3=false,rvThorax=null,rvFig3Colors=null;
  // Figure 3C axial levels: pulmonary root, high RVOT, low RVOT (heights from the atlas valves).
  let fig3Level=null,fig3Levels=null,fig3Caps=null,fig3CapKey='';
  const fig3Plane=new THREE.Plane(new THREE.Vector3(0,-1,0),0);
  const fig3Sliced=()=>fig3On()&&Boolean(fig3Level)&&Boolean(fig3Levels);
  function updateFig3Caps(force=false){
    const on=fig3Sliced();
    fig3Caps?.setVisible(on);
    if(!on||!fig3Caps)return;
    const key=`${fig3Level}|${beating}|${document.documentElement.lang}`;
    if(!force&&!beating&&key===fig3CapKey)return;
    fig3CapKey=key;
    const en=document.documentElement.lang==='en';
    // At the root level the atlas RV surface carries the pulmonary sinuses (the leaflets sit inside its ring).
    const names={rv:fig3Level==='root'?(en?'Pulmonary root':'Pulmoner kök'):'RVOT',pa:null,lv:fig3Level==='low'?'LVOT':null,aorta:fig3Level==='root'?(en?'Ascending aorta':'Çıkan aort'):fig3Level==='high'?(en?'Aortic root':'Aort kökü'):null};
    const blue='#3f7fe0',red='#d2382f';
    const items=[['rv',blue],['pa',blue],['lv',red],['aorta',red],['ra',blue],['la',red]].flatMap(([id,color])=>(meshMap.get(id)||[]).map(mesh=>({mesh,color,label:names[id]||null})));
    fig3Caps.update({plane:fig3Plane,centre:fig3Levels.centre,items});
  }
  const fig3On=()=>rvFig3&&mode==='rv'&&!fluoroscopy;
  const FIG3_IDS=['rv','lv','ra','la','laa','aorta','pa','svc','pulmonary-valve','tricuspid','tricuspid-annulus','moderator-band'];
  const FIG3_TINT={ra:'#6f9be0',pa:'#4f86dc',svc:'#6f9be0','pulmonary-valve':'#9fbfee',lv:'#c8443c',la:'#cf5a50',laa:'#cf5a50',aorta:'#d2382f'};
  let rvotCap=null,rvotCapKey='';
  // Cut face: rebuilt when the section opens, a segment changes or (while beating) each frame.
  function updateRvotCap(force=false){
    const on=rvotCut()&&Boolean(rvotData);
    rvotCap?.setVisible(on);
    if(!on||!rvotCap)return;
    const key=`${rvotSegment}|${beating}|${rvotVariant}`;
    if(!force&&!beating&&key===rvotCapKey)return;
    rvotCapKey=key;
    const rv=meshMap.get('rv')?.[0];
    const named=rvotData.parts.names.map(n=>n.key.startsWith('rvot-')?{...n,color:rvotColorOf(n.key.slice(5))}:n);
    const parts={...rvotData.parts,names:rvotSegment?named.map(n=>n.key===`rvot-${rvotSegment}`||!n.key.startsWith('rvot-')?n:{...n,color:`#${new THREE.Color(n.color).lerp(new THREE.Color('#3b3f45'),.78).getHexString()}`}):named};
    rvotCap.update({plane:rvotData.plane,centre:rvotData.frame.cutPoint,rv,parts,outlines:['lv','aorta'].flatMap(id=>meshMap.get(id)||[])});
  }

  const wallPlanes=new Map();
  const ivcPlane=new THREE.Plane(new THREE.Vector3(0,1,0),2);
  // The atlas LPA sweeps far posteroinferiorly; trim the distal tail for a tidy silhouette.
  // Atlas vessels that run far beyond the cardiac silhouette are trimmed on a
  // plane across their measured centerline (see computeVesselTrims).
  const vesselTrims=new Map();
  const rootPlane=new THREE.Plane(new THREE.Vector3(0,-1,0),rootHeight);
  const decoder=new DRACOLoader().setDecoderPath('/draco/');
  const loader=new GLTFLoader().setDRACOLoader(decoder);
  function material(color) {return new THREE.MeshStandardMaterial({color,roughness:.65,metalness:0,side:THREE.DoubleSide});}
  function register(mesh,id){
    mesh.userData.id=id;
    meshes.push(mesh);
    if(!meshMap.has(id))meshMap.set(id,[]);
    meshMap.get(id).push(mesh);
    if(mesh.userData.leaflet){
      const lid=id+'-'+mesh.userData.leaflet;
      if(!meshMap.has(lid))meshMap.set(lid,[]);
      meshMap.get(lid).push(mesh);
    }
    if(mesh.userData.veinGroup){
      const vg = mesh.userData.veinGroup;
      if(!meshMap.has(vg))meshMap.set(vg,[]);
      meshMap.get(vg).push(mesh);
    }
  }
  function sourceCenter(id){const list=meshMap.get(id)||[];const box=new THREE.Box3();list.forEach(m=>box.expandByObject(m));if(id==='ivc')box.min.y=Math.max(box.min.y,-ivcPlane.constant);return box.isEmpty()?null:box.getCenter(new THREE.Vector3());}
  let mitralFocus=false;
  const mitralScallops=createMitralScallops(container,id=>meshMap.get(id)||[]);
  const sceneLabels=createSceneLabels(container);
  // Fluoroscopic anatomy contours: a 2D canvas over the image (fluoro-contours.js).
  const contourCanvas=document.createElement('canvas');
  contourCanvas.className='fluoro-contours';
  contourCanvas.setAttribute('aria-hidden','true');
  contourCanvas.hidden=true;
  container.appendChild(contourCanvas);
  let fluoroContours=true, contourKey='', contourTime=0, lastContours=[];
  const visibleMeshes=id=>(meshMap.get(id)||[]).filter(m=>{for(let o=m;o;o=o.parent)if(!o.visible)return false;return !m.userData.micro;});
  function updateContours(){
    const on=fluoroscopy&&fluoroContours&&mode!=='micro';
    contourCanvas.hidden=!on;
    if(!on)return;
    const w=container.clientWidth,h=container.clientHeight,dpr=Math.min(globalThis.devicePixelRatio||1,2);
    // Recomputed when the C-arm (camera) or size changes, and a few times a second while the heart beats.
    const key=[...camera.matrixWorld.elements,...camera.projectionMatrix.elements,w,h].map(v=>v.toFixed(4)).join(',');
    const now=performance.now();
    if(key===contourKey&&now-contourTime<(cardiacCycle.getCycleState().playing?150:1e9))return;
    contourKey=key;contourTime=now;
    if(contourCanvas.width!==Math.round(w*dpr)||contourCanvas.height!==Math.round(h*dpr)){contourCanvas.width=Math.round(w*dpr);contourCanvas.height=Math.round(h*dpr);}
    const ctx=contourCanvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    lastContours=computeContours(visibleMeshes,camera,w,h);
    drawContours(ctx,lastContours,(globalThis.localStorage?.getItem?.('cardia_lang'))==='en'?'en':'tr');
  }
  let modelReady=false;
  let lastAtrialPhase=null;   // separate atrial clock of the last seek (AV dissociation), or null
  const isReady=()=>modelReady;
  const epLandmarks = createEPLandmarks({ sourceCenter, meshVertices, getMeshes:(id)=>meshMap.get(id)||[], isReady });
  heart.add(epLandmarks.group);
  const epZones = createEpZones({ sourceCenter, meshVertices, getMeshes:(id)=>meshMap.get(id)||[], isReady });
  heart.add(epZones.group);
  // PVI exercise lesion rings; clicks are routed from pointerUp while active.
  let bachmannTarget = null;
  const atlasAdjustments = {};
  const pacemakerLeads = createPacemakerLeads({ sourceCenter, meshVertices, getMeshes:(id)=>meshMap.get(id)||[], getBachmannTarget: () => bachmannTarget, isReady });
  heart.add(pacemakerLeads.group);
  function computeVesselTrims(){
    const verts=name=>{const m=meshes.find(x=>x.name===name);if(!m)return[];m.updateWorldMatrix(true,false);const p=m.geometry.attributes.position;const out=[];for(let i=0;i<p.count;i++)out.push(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld));return out;};
    const bifurcation=sourceCenter('pa')||new THREE.Vector3(0.07,1.5,-0.42);
    const la=sourceCenter('la')||new THREE.Vector3(-0.05,0.27,-0.37);
    // LPA and RPA: hilar length from the bifurcation (pulmonary-trims.js, shared with the ECG atlas).
    for(const [name,plane] of pulmonaryBranchTrims(verts,bifurcation).planes)vesselTrims.set(name,plane);
    // RSPV: keep a stump comparable to the other pulmonary veins.
    const rspv=vesselTrimPlane(verts('Right superior pulmonary vein'),la,0.55);
    if(rspv)vesselTrims.set('Right superior pulmonary vein',rspv);
  }
  // Builders that measure the live geometry (flow routes, auscultation
  // markers) run lazily; measure the rest anatomy even mid-beat, then return
  // to the current pose.
  function withRestPose(fn){
    if(!channels?.isDeformed()) return fn();
    channels.reset();
    try{ return fn(); }
    finally{ channels.applyChannels(cardiacCycle.getCycleState()); }
  }
  function meshVertices(id,nameFilter){
    const out=[];
    for(const m of meshMap.get(id)||[]){
      if(nameFilter&&!nameFilter.test(m.name))continue;
      m.updateWorldMatrix(true,false);
      const p=m.geometry.attributes.position;
      for(let i=0;i<p.count;i++)out.push(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld));
    }
    return out;
  }
  const transseptal = createTransseptal({ sourceCenter, meshVertices, getMeshes: id => meshMap.get(id) || [], isReady });
  heart.add(transseptal.group);
  const septalDefects = createSeptalDefects({ container, sourceCenter, meshVertices, getMeshes: id => meshMap.get(id) || [], onSelect });
  heart.add(septalDefects.group);
  const auscultation = createAuscultationMarkers({ sourceCenter, meshVertices });
  heart.add(auscultation.group);
  // RA endocardial pacing target for the Bachmann lesson: its own marker,
  // never part of the epicardial band (report section 13).
  const bachmannTargetGroup = new THREE.Group();
  bachmannTargetGroup.name = 'Bachmann pacing target';
  bachmannTargetGroup.visible = false;
  heart.add(bachmannTargetGroup);
  const cathLab = createCathLab({ sourceCenter, meshVertices, getMeshes:(id)=>meshMap.get(id)||[], getVesselTrim:(name)=>vesselTrims.get(name)||null, isReady });
  heart.add(cathLab.group);
  const annuli = createAnnuli({ sourceCenter, register, meshVertices, getMeshes:(id)=>meshMap.get(id)||[] });
  const thorax = createThorax({ sourceCenter, register });
  heart.add(thorax.group);
  // Bypass grafts (angiography): one shown at a time; its run-off is the injected native artery.
  const grafts = createCoronaryGrafts({ getMeshes: id => meshMap.get(id) || [], toLocal: v => heart.worldToLocal(v) });
  heart.add(grafts.group);
  let activeGraft = null;
  const icns = createIcns({ sourceCenter, register, isReady });
  layers.icns.add(icns.group);
  layers.valves.add(annuli.group);
  function applyState(){
    paintRvot();
    layers.conduction.visible = visibility.conduction !== false;
    layers.icns.visible = visibility.icns !== false;
    const chamber = chamberMode(mode);
    layers.flow.visible = Boolean(visibility.flow) && mode !== 'micro' && !mitralFocus && !chamber && mode !== 'defects';
    if(bloodFlow) bloodFlow.setVisible(layers.flow.visible);
  if(flowLegend) flowLegend.hidden=!layers.flow.visible;
    for(const m of meshes){
      if(m.userData.micro)continue;
      if(mode==='defects'){
        const ids=septalDefects.getState().family==='asd'
          ? ['la','ra','svc','ivc','cs','mitral-annulus','tricuspid-annulus']
          : ['lv','rv','lcc','rcc','ncc','pulmonary-valve','mitral-annulus','tricuspid-annulus'];
        if(!ids.includes(m.userData.id)){m.visible=false;continue;}
      }
      if(chamber&&!chamber.ids.includes(m.userData.id)&&!(rvotOn()&&(RVOT_SECTION_IDS.includes(m.userData.id)||(rvotCamera==='posterior'&&['pa','pulmonary-valve'].includes(m.userData.id))))&&!(fig3On()&&FIG3_IDS.includes(m.userData.id))&&!(fig2On()&&FIG2_CONTEXT_IDS.includes(m.userData.id))){m.visible=false;continue;}
      if(fig3On()&&!FIG3_IDS.includes(m.userData.id)){m.visible=false;continue;}
      // The band lies inside the RV: only the axial cut shows it, not the closed anterior view.
      if(fig3On()&&m.userData.id==='moderator-band'&&!fig3Sliced()){m.visible=false;continue;}
      if(rvotOn()&&RVOT_HIDDEN_IDS.includes(m.userData.id)&&!(rvotCamera==='posterior'&&m.userData.id==='pulmonary-valve')){m.visible=false;continue;}
      if(mitralFocus&&!['mitral','mitral-annulus','lv-papillary'].includes(m.userData.id)){m.visible=false;continue;}
      // Koch close-up: chambers, conduction and the venous entries of the catheters only.
      if(kochFocus&&!['chambers','conduction'].includes(m.userData.layer)&&!KOCH_FOCUS_IDS.includes(m.userData.id)){m.visible=false;continue;}
      if(kochFocus&&m.userData.layer==='conduction'&&m.userData.id!=='av'&&m.name!=='Bundle of His'){m.visible=false;continue;}
      const {id,layer,system:branch}=m.userData;
      // The Chiari network is a variant (2-3%): hidden unless the RA mode's optional switch is on.
      if(id==='chiari-network'&&!(mode==='ra'&&visibility.chiariNetwork===true)){m.visible=false;continue;}
      if (mode === 'angiography' && m.userData.veinGroup === 'cardiac-veins') {
        m.visible = false;
        continue;
      }
      const isVein = branch === 'veins' || ['svc', 'ivc', 'pv', 'cs', 'gcv', 'mcv', 'piv', 'lspv', 'lipv', 'rspv', 'ripv', 'cardiac-veins'].includes(id);
      if (mode !== 'defects' && !visibility.veins && isVein) {
        m.visible = false;
        continue;
      }
      if (layer === 'conduction') {
        m.visible = visibility.conduction !== false && visibility[id] !== false;
        continue;
      }
      if (layer === 'icns') {
        m.visible = visibility.icns !== false && visibility[id] !== false && (!m.userData.sublayer || visibility[m.userData.sublayer] !== false);
        continue;
      }
      if (layer === 'thorax') {
        // Schematic scenery keeps its own authored transparency.
        m.visible = visibility.thorax !== false && visibility[id] !== false;
        continue;
      }
      const allowed=system==='all'||(branch&&branch!=='veins'&&(system==='both'||system===branch))||id==='aorta'||layer==='valves'||layer==='chambers'||branch==='veins'||layer==='vessels';
      const leafletKey=m.userData.leaflet?`${id}-${m.userData.leaflet}`:null;
      m.visible=(Boolean(chamber)||mode==='defects')||visibility[layer]!==false&&visibility[id]!==false&&(!m.userData.veinGroup||visibility[m.userData.veinGroup]!==false)&&(!leafletKey||visibility[leafletKey]!==false)&&(!m.userData.followsId||visibility[m.userData.followsId]!==false)&&allowed;
      // The crista is a ridge inside the RA: it stays opaque when the walls are faded.
      const tissue=layer==='chambers'&&!['crista-terminalis','coumadin-ridge','eustachian-valve','chiari-network'].includes(id);
      // Catheters run inside these vessels in the transseptal lesson; keep them
      // see-through. The pulmonary trunk and bifurcation sit on the LA roof in
      // front of the fossa in LAO/RAO, so they are faded there too.
      const catheterVessel=(mode==='transseptal'&&['aorta','pa','cs','svc','ivc'].includes(id))||(mode==='cath'&&['aorta','pa','svc','ivc'].includes(id));
      const roofContext=mode==='bachmann'&&(layer==='vessels'||layer==='coronaries');
      const faintPa=visibility['pa-faint']&&id==='pa';
      let alpha=mode==='defects'?(layer==='chambers'?.16:layer==='valves'?.55:.22):mode==='atria'&&selected==='laa'?(id==='la'?Math.min(opacity,.32):1):tissue?opacity:faintPa?.22:roofContext?.14:catheterVessel?.28:(id==='aorta'&&rootWindow?.22:1);
      // RVOT section: the LV and aorta are context, the RV ring is the subject.
      if(rvotOn()&&(id==='lv'||id==='aorta'))alpha=Math.min(alpha,.3);
      if(fig2On()&&FIG2_CONTEXT_IDS.includes(id))alpha=Math.min(alpha,.28);
      // Posterior view (Figs. 11-12 A-B): coronaries and cardiac veins fade so the posterior wall and summit stay readable.
      if(rvotOn()&&rvotCamera==='posterior'&&(layer==='coronaries'||['gcv','cs','mcv','piv','cardiac-veins'].includes(id)))alpha=Math.min(alpha,.22);
      // Figure 3 tint: right heart blue, left heart red (meshes without vertex colours).
      const tint=fig3On()?FIG3_TINT[id]:null;
      if(tint&&!m.material.vertexColors){m.material.color.set(tint);m.userData.fig3Tinted=true;}
      else if(m.userData.fig3Tinted&&!m.material.vertexColors){m.material.color.set(m.userData.color);m.userData.fig3Tinted=false;}
      // Great-vessel walls follow the slider while procedural caps stay effective.
      if(layer==='vessels')alpha=Math.min(alpha,opacity);
      m.material.opacity=alpha;m.material.transparent=alpha<1;m.material.depthWrite=alpha>=.95;
      // Ventricle modes: wall regions in colour (the hover names work everywhere).
      if((id==='lv'||id==='rv')&&m.geometry.attributes.color){
        const regions=(ventricleRegions||(id==='rv'&&(rvotOn()||fig2On()||fig3On())))&&chamber?.chamber===id&&!fluoroscopy;
        if(m.material.vertexColors!==regions){m.material.vertexColors=regions;m.material.color.set(regions?0xffffff:m.userData.color);m.material.needsUpdate=true;}
      }
      m.material.clippingPlanes=rvotOn()&&rvotCamera==='posterior'&&id==='pa'?[rvotPaTrim]:fig3Sliced()&&FIG3_IDS.includes(id)?[fig3Plane]:rvotCut()&&rvotData&&RVOT_SECTION_IDS.includes(id)?[rvotData.plane]:mode==='defects'?[]:vesselTrims.has(m.name)?[vesselTrims.get(m.name)]:id==='aorta'&&rootWindow?[rootPlane]:id==='ivc'?[ivcPlane]:wallCuts[id]>0&&wallPlanes.has(id)?[wallPlanes.get(id).plane]:[];
      if(layer==='coronaries'){
        m.material.roughness=0.65;
        m.material.metalness=0;
      }
    }
    heart.visible=mode!=='micro';micro.visible=mode==='micro';
    updateSegmentationLegend();
    paintSelection();
    requestRender();
  }
  function paintSelection(){
    sceneLabels.setFocus(hovered,selected);
    for(const m of meshes){
      const shown=m.userData.leaflet?m.userData.id+'-'+m.userData.leaflet:m.userData.id;
      const isSelected=shown===selected||m.userData.id===selected,isHovered=shown===hovered;
      if(m.userData.layer==='conduction'||m.userData.layer==='icns'){
        m.material.emissiveIntensity=isSelected?1.3:isHovered?1.05:0.7;
        continue;
      }
      m.material.emissive.setHex(isSelected?0x27634f:isHovered?0x2a5664:0x000000);
      m.material.emissiveIntensity=isSelected?.35:isHovered?.25:0;
    }
    if(catheterPickables)for(const m of catheterPickables){
      if(!m.material.emissive)continue;
      if(m.userData.baseEmissiveIntensity===undefined)m.userData.baseEmissiveIntensity=m.material.emissiveIntensity??0;
      const active=m.userData.pickId===selected?1.4:m.userData.pickId===hovered?1.1:1;
      m.material.emissiveIntensity=m.userData.baseEmissiveIntensity*active;
    }
    requestRender();
  }
  function selectStructure(id,flyTo=true){if(DEFECT_IDS.includes(id)){selected=id;septalDefects.select(id);applyState();if(flyTo)focusDefect(id);return;}if(mitralFocus&&!id?.startsWith('mitral')){mitralFocus=false;applyState();}if(flyTo&&id?.startsWith('mitral')&&mode==='anatomy'){selected=id;setView('mitral');return;}selected=id;paintSelection();if(mode==='atria')applyState();if(flyTo&&mode==='atria'&&['la','laa'].includes(id)){focusLeftAtrium(id);return;}if(flyTo){const p=sourceCenter(id);if(p){const offset=camera.position.clone().sub(controls.target);offset.setLength(chamberMode(mode)?chamberMode(mode).flyDistance:['lm','lcc','rcc','ncc','mitral','tricuspid','mitral-posterior','mitral-anterior','tricuspid-septal','tricuspid-inferior','tricuspid-anterior','sa','av','his','laa'].includes(id)?3.1:6.5);lookTarget.copy(p);cameraTarget.copy(p).add(offset);transition=true;container.dataset.cameraSettled='false';requestRender();}}}

  function focusDefect(id) {
    const site=septalDefects.getSite(id);
    if(!site)return;
    lookTarget.copy(site.point);
    const distance=Math.max(6.2,4/Math.max(camera.aspect,.35));
    cameraTarget.copy(site.point).addScaledVector(site.normal,-distance);
    transition=true;container.dataset.cameraSettled='false';requestRender();
  }

  function focusLeftAtrium(id) {
    const la = meshMap.get('la')?.[0];
    if (!la) return;
    const box = new THREE.Box3().setFromObject(la);
    const marker = meshMap.get('laa')?.[0];
    const data = marker?.userData;
    let direction = camera.position.clone().sub(controls.target).normalize();
    if (direction.lengthSq() < .5) direction.set(0, 0, 1);
    if (id === 'laa' && data) {
      const neck = new THREE.Vector3(...data.orifice), tip = new THREE.Vector3(...data.tip);
      box.setFromPoints([neck, tip]).expandByScalar(data.radius * 1.8);
      // Look obliquely across the appendage axis so body and neck remain legible.
      direction.set(1, .4, 1).normalize();
    }
    box.getCenter(lookTarget);
    const points = [];
    if(id==='la'){
      const p=la.geometry.attributes.position;
      for(let i=0;i<p.count;i++)points.push(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(la.matrixWorld));
    }else{
      for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new THREE.Vector3(x,y,z));
    }
    const vertical = THREE.MathUtils.degToRad(camera.fov / 2);
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
    const right=new THREE.Vector3().crossVectors(camera.up,direction).normalize();
    if(right.lengthSq()<.1)right.set(1,0,0);
    const up=new THREE.Vector3().crossVectors(direction,right).normalize();
    let distance=0;
    for(const point of points){
      const relative=point.clone().sub(lookTarget), depth=relative.dot(direction);
      distance=Math.max(distance,depth+Math.abs(relative.dot(right))/(Math.tan(horizontal)*.82),depth+Math.abs(relative.dot(up))/(Math.tan(vertical)*.82));
    }
    cameraTarget.copy(lookTarget).addScaledVector(direction, Math.min(15, Math.max(1.2, distance)));
    transition=true;container.dataset.cameraSettled='false';requestRender();
  }

  // Conceptual cellular illustration is separate from the source atlas.
  const micro=new THREE.Group();scene.add(micro);micro.visible=false;
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){
    const x=(col-1)*1.4+(row%2)*.15,y=(row-1)*.72;
    for(const [pos,size,color] of [[[x,y,0],[.83,.27,.27],0xba7771],[[x,y,.26],[.20,.10,.045],0x775d81]]){
      const m=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),material(color));m.position.set(...pos);m.scale.set(...size);m.userData.micro=true;m.userData.provenance='schematic';micro.add(m);register(m,'micro');
    }
    const disc=new THREE.Mesh(new THREE.BoxGeometry(.035,.43,.43),material(0xc5b17d));disc.position.set(x+.64,y,0);micro.add(disc);disc.userData.micro=true;disc.userData.provenance='schematic';register(disc,'micro');
  }
  const loading=document.createElement('div');loading.className='model-loading';loading.textContent='Loading registered cardiac anatomy…';container.append(loading);
  const ready=loader.loadAsync(ATLAS_URL).then(gltf=>{
    if(disposed){disposeScene(gltf.scene);return;}
    gltf.scene.updateMatrixWorld(true);
    const found=[];
    gltf.scene.traverse(obj=>{if(!obj.isMesh)return;const association=gltf.parser.associations.get(obj);const sourceName=gltf.parser.json.nodes[association?.nodes]?.name||obj.name;const part=normalizedParts.get(normalizeAtlasName(sourceName));if(part)found.push({obj,part});});
    const chamberBounds=new THREE.Box3();found.filter(({part})=>part.layer==='chambers').forEach(({obj})=>chamberBounds.expandByObject(obj));
    if(chamberBounds.isEmpty())throw new Error('Atlas chamber nodes missing');
    center=chamberBounds.getCenter(new THREE.Vector3());scale=3.3/Math.max(...chamberBounds.getSize(new THREE.Vector3()).toArray());
    for(const {obj,part} of found){
      // Baking matrixWorld before applying the SAME affine transform preserves registration.
      const geometry=obj.geometry.clone().applyMatrix4(obj.matrixWorld);
      geometry.translate(-center.x,-center.y,-center.z);geometry.scale(scale,scale,scale);
      if(part.id==='la')smoothLaNormals(geometry);
      const mesh=new THREE.Mesh(geometry,material(part.color));mesh.name=part.sourceName;mesh.userData={...part, provenance: 'atlas'};layers[part.layer].add(mesh);register(mesh,part.id);
    }
    disposeScene(gltf.scene);decoder.dispose();
    // LAA scaled toward its neck to a mean-like length (owner's request; before any measurement).
    const laMesh = meshMap.get('la')?.[0];
    if (laMesh) atlasAdjustments.laaScale = shrinkAppendage(laMesh);
    // Transverse sinus: atria no longer enter the aortic root (before any measurement).
    // Pulmonary trunk: root sunk into the RV infundibulum, distal end inside the bifurcation (no seams; before any measurement).
    atlasAdjustments.pulmonaryTrunk = seatPulmonaryTrunk(meshes.find(m => m.name === 'Pulmonary trunk'), sourceCenter('rv'));
    atlasAdjustments.transverseSinus = separateAtriaFromAorta([...(meshMap.get('ra')||[]), ...(meshMap.get('la')||[])], meshMap.get('aorta')||[]);
    // Named coronary side branches; LAD and LCX branches and the septal perforators placed proximally (D1 ~1/4 of the LAD, S1 just before it, OM1 ~1/3 of the LCX).
    const coronary = buildCoronaryBranches(Object.fromEntries(['lad','septal','lcx','rca','lm','rcc','lv','rv'].map(id => [id, meshMap.get(id)?.[0]])));
    for (const [id, branchTable] of Object.entries(coronary.tables)) { const m = meshMap.get(id)?.[0]; if (m) m.userData.branches = branchTable; }
    atlasAdjustments.septalReorder = coronary.septalMoves;
    atlasAdjustments.branchMoves = coronary.branchMoves;
    // The atlas has no PDA: a schematic one from the crux along the inferior interventricular groove.
    const pda = buildSchematicPda(id => meshMap.get(id) || []);
    if (pda) { layers.coronaries.add(pda); register(pda, 'pda'); }
    buildSupraAorticBranches();
    const lmCenter=sourceCenter('lm'),rccCenter=sourceCenter('rcc');
    rootHeight=Math.max(lmCenter?.y??.6,rccCenter?.y??.6)+.13;rootPlane.constant=rootHeight;
    ivcPlane.constant=-(chamberBounds.min.y-center.y)*scale+.45;
    initializeWallPlanes();
    seatCoronarySinus();
    buildCristaTerminalis();
    buildRaValves();
    buildConductionSystem();
    annuli.build();
    addSchematicAvLeaflets({ getMeshes: id => meshMap.get(id) || [], register, parent: layers.valves });
    const laaRing = addLaaMarker({ meshVertices, getMeshes: id => meshMap.get(id) || [], register, parent: layers.chambers });
    sceneLabels.add({ mesh: laaRing, index: 0, tone: 'laa', text: { tr: 'LAA ostiyum işareti', en: 'LAA orifice marker' }, when: () => ['atria', 'bachmann'].includes(mode) && !fluoroscopy });
    buildCoumadinRidge();
    mitralScallops.build();
    buildPartTables();
    thorax.build();
    grafts.build();grafts.setGraft(activeGraft);
    computeVesselTrims();
    modelReady=true;
    epLandmarks.init();
    for (const label of epLandmarks.labels) sceneLabels.add({ ...label, when: () => mode === 'ablation' && KOCH_LABEL_STEPS.includes(ablationStep) && !fluoroscopy });
    epZones.init();
    for (const label of epZones.labels) sceneLabels.add({ ...label, when: () => mode === 'ablation' && epZones.isActive(label.zone) && !fluoroscopy });
    pacemakerLeads.init();
    transseptal.init();
    septalDefects.build(transseptal.group.getObjectByName('Fossa ovalis')?.position);
    cathLab.init();
    catheterPickables=null;
    channels = createAnimationChannels({ meshMap, sourceCenter });
    // Surface-follower binding is a one-time cost; do it while idle rather
    // than on the first beat.
    // Then the lesson overlays, in short idle slices.
    const idle = window.requestIdleCallback || (fn => setTimeout(fn, 200));
    idle(() => { channels?.prepare(); const step = () => { if (!disposed && !overlayFollow?.prepare(channels?.fieldContext())) idle(step); }; idle(step); });
    // Lesson overlays, devices and flow ride the beating heart (phase D).
    // Before the first beat (or with the heart at rest) there is no field.
    overlayFollow = createOverlayFollow({ getContext: () => channels?.isDeformed() ? channels.fieldContext() : null, roots: () => [epLandmarks.group, pacemakerLeads.group, transseptal.group, cathLab.group, bachmannTargetGroup, grafts.group] });
    bloodFlow = createBloodFlow({ resolveRoutes: () => withRestPose(() => measuredFlowRoutes({ sourceCenter, meshVertices, getMeshes: id => meshMap.get(id) || [], getVesselTrim: name => vesselTrims.get(name) || null })) });
    bloodFlow.setField(overlayFollow.points);
    layers.flow.add(bloodFlow.group);
    applyState();computeFit();setView('anterior',false);loading.remove();container.dataset.modelReady='true';
    container.dataset.meshCount=String(found.length);
    return {count:found.length,normalization:{center:center.toArray(),scale},source:ATLAS_URL};
  }).catch(error=>{loading.textContent='Anatomical asset could not load. Reload to retry; no substitute geometry is shown.';decoder.dispose();throw error;});

  // Left lateral (Coumadin) ridge between the LAA orifice and the left pulmonary veins.
  function buildCoumadinRidge() {
    const ridge = createCoumadinRidge({ laMesh: meshMap.get('la')?.[0], veins: meshMap.get('pv') || [] });
    if (!ridge) return;
    const mesh = new THREE.Mesh(ridge.geometry, material(0xa84a44));
    mesh.name = 'Left lateral ridge (Coumadin ridge, schematic)';
    mesh.userData = { id: 'coumadin-ridge', layer: 'chambers', provenance: 'schematic', sourceName: mesh.name, path: ridge.path.map(p => p.toArray()), veins: ridge.veins };
    layers.chambers.add(mesh);
    register(mesh, 'coumadin-ridge');
    sceneLabels.add({ mesh, tone: 'ridge', text: { tr: 'Coumadin ridge', en: 'Coumadin ridge' }, when: () => mode === 'atria' && !fluoroscopy });
  }

  // Crista terminalis on the RA endocardium; its sulcus guides Bachmann's inferior right limb.
  let cristaSulcus = null;
  function buildCristaTerminalis() {
    const crista = createCristaTerminalis({ raMeshes: meshMap.get('ra') || [], svcMeshes: meshMap.get('svc') || [], ivcOstium: inferiorCavalOstium(meshMap.get('ra')?.[0]) });
    const mesh = new THREE.Mesh(crista.geometry, material(0xa3443d));
    mesh.name = 'Crista terminalis (schematic ridge on the RA endocardium)';
    mesh.userData = { id: 'crista-terminalis', layer: 'chambers', provenance: 'schematic', sourceName: mesh.name, path: crista.path.map(p => p.toArray()), landmarks: Object.fromEntries(Object.entries(crista.landmarks).map(([k, v]) => [k, v.toArray()])), sulcus: crista.sulcus.toArray() };
    layers.chambers.add(mesh);
    register(mesh, 'crista-terminalis');
    cristaSulcus = crista.sulcus;
    sceneLabels.add({ mesh, tone: 'crista', text: { tr: 'Krista terminalis', en: 'Crista terminalis' }, when: () => mode === 'ra' && !fluoroscopy });
  }

  // Wall regions of the ventricles (LV: AHA 16 segments and LVOT; RV: inlet,
  // outflow, apex, walls) and leaflet identities of the valves, per vertex:
  // hover names, the ventricle-mode colours and the echo section labels.
  let ventricleRegions=true;
  // RVOT superior section (RV mode): six outflow segments, a cut just below
  // the pulmonary valve and the neighbours of Miyazaki 2026 / Aronis 2026.
  function paintRvot(){
    const rv=meshMap.get('rv')?.[0];
    if(!rv||!rvotData)return;
    const key=`${rvotOn()}|${rvotSegment}|${fig2On()}|${fig3On()}|${rvotVariant}`;if(key===rvotPainted)return;rvotPainted=key;
    const colors=rvotOn()?rvotData.sectionColors:fig3On()&&rvFig3Colors?rvFig3Colors:fig2On()&&rvFig2Data?rvFig2Data.colors:rvotData.regionColors;
    if(rvotOn()){
      const c=new THREE.Color();
      rvotData.byVertex.forEach((k,i)=>{const id=rvotData.ids[k];c.set(rvotColorOf(id));if(rvotSegment&&id!==rvotSegment&&id!=='other')c.lerp(new THREE.Color('#3b3f45'),.78);c.toArray(colors,i*3);});
    }
    const attribute=rv.geometry.attributes.color;
    if(attribute){attribute.array.set(colors);attribute.needsUpdate=true;}
    rv.userData.branches=rvotOn()?rvotData.parts:fig2On()&&rvFig2Data?rvFig2Data.parts:rv.userData.parts;
  }
  function buildRvotSection(first,centroidOf){
    const rv=first('rv'),lv=first('lv'),parts=rv?.userData.parts,pulmonary=meshMap.get('pulmonary-valve')||[];
    const lad=meshMap.get('lad')||[],rcc=meshMap.get('rcc')||[];
    if(!rv||!lv||!parts||!pulmonary.length||!lad.length||!rcc.length)return;
    const rvotIndex=parts.names.findIndex(n=>n.key==='rv-rvot');
    const ladPoints=[];for(const m of lad){const p=m.geometry.attributes.position;for(let i=0;i<p.count;i+=3)ladPoints.push(new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)));}
    const lvPos=lv.geometry.attributes.position,lvPoints=[];for(let i=0;i<lvPos.count;i+=2)lvPoints.push(new THREE.Vector3(lvPos.getX(i),lvPos.getY(i),lvPos.getZ(i)));
    const result=rvotSegments({rvGeometry:rv.geometry,rvotMask:i=>parts.byVertex[i]===rvotIndex,pulmonaryCenter:centroidOf(pulmonary),rccCenter:centroidOf(rcc),ladPoints,nearLv:nearSet(lvPoints,RVOT_SEPTAL_GAP)});
    if(!result)return;
    // Hover names: segment names on the outflow, the RV regions elsewhere.
    const segNames=result.ids.slice(0,-1).map(id=>({tr:RVOT_SEGMENT_TEXT.tr.segments[id].name,en:RVOT_SEGMENT_TEXT.en.segments[id].name,abbr:id,short:{tr:RVOT_SEGMENT_TEXT.tr.segments[id].name,en:RVOT_SEGMENT_TEXT.en.segments[id].name},color:RVOT_SEGMENT_COLORS[id],key:`rvot-${id}`}));
    const other=result.ids.length-1,offset=parts.names.length;
    const byVertex=new Int16Array(result.byVertex.length);result.byVertex.forEach((k,i)=>{byVertex[i]=k===other?parts.byVertex[i]:offset+k;});
    rvotData={...result,parts:{names:[...parts.names,...segNames],byVertex},regionColors:Float32Array.from(rv.geometry.attributes.color?.array||[]),sectionColors:new Float32Array(result.byVertex.length*3)};
    // One label per segment at the cut: the member vertex just below the plane nearest the segment's cut centroid.
    const pos=rv.geometry.attributes.position,v=new THREE.Vector3(),segLabelIndex={};
    result.ids.slice(0,-1).forEach((id,k)=>{
      const near=[];for(let i=0;i<pos.count;i++){if(result.byVertex[i]!==k)continue;v.fromBufferAttribute(pos,i);const d=result.plane.distanceToPoint(v);if(d>=0&&d<(id==='septal'?.6:.25))near.push(i);}
      if(!near.length)return;
      const mid=new THREE.Vector3();near.forEach(i=>mid.add(v.fromBufferAttribute(pos,i)));mid.divideScalar(near.length);
      const index=near.reduce((b,i)=>{const d=v.fromBufferAttribute(pos,i).distanceToSquared(mid);return d<b.d?{i,d}:b;},{i:near[0],d:Infinity}).i;
      segLabelIndex[id]=index;
      if(id==='posterior')return;   // labelled with its variant below
      const short=RVOT_SEGMENTS.find(seg=>seg.id===id).short;
      sceneLabels.add({mesh:rv,index,tone:'region',text:{tr:short,en:short},when:rvotOn,always:true});
    });
    // Neighbours named in the figure: aortic sinuses and the LV summit (near the LAD/LCX bifurcation).
    for(const [id,abbr] of [['rcc','RCC'],['lcc','LCC'],['ncc','NCC']])for(const m of (meshMap.get(id)||[]).slice(0,1))sceneLabels.add({mesh:m,tone:'region',text:{tr:abbr,en:abbr},when:rvotOn,always:true});
    const bifurcation=sourceCenter('lm');
    if(bifurcation){let index=0,best=Infinity;for(let i=0;i<lvPos.count;i++){v.fromBufferAttribute(lvPos,i);if(result.plane.distanceToPoint(v)<0)continue;const d=v.distanceToSquared(bifurcation);if(d<best){best=d;index=i;}}sceneLabels.add({mesh:lv,index,tone:'region',text:{tr:'LV summit',en:'LV summit'},when:rvotOn,always:true});
      // Figs. 11-12: elevated infundibulum versus the left adjacent sinus crescent attached to the summit.
      const pv=segLabelIndex.posterior??-1;
      if(pv>=0)sceneLabels.add({mesh:rv,index:pv,tone:'region',text:{tr:'P · yükselmiş infundibulum',en:'P · elevated infundibulum'},when:()=>rvotOn()&&rvotVariant==='present',always:true});
      if(pv>=0)sceneLabels.add({mesh:rv,index:pv,tone:'region',text:{tr:'P yok → septal duvar',en:'No P → septal wall'},when:()=>rvotOn()&&rvotVariant==='absent',always:true});
      sceneLabels.add({mesh:lv,index,tone:'region',text:{tr:'l sinüs hilali → LV summit',en:'l sinus crescent → LV summit'},when:()=>rvotOn()&&rvotVariant==='absent',always:true});}
    paintRvot();
    rvotCap=createRvotCap({parent:heart});
    buildFigure2(rv,lv,parts,lvPoints,centroidOf);
    buildFigure3(rv,lv,parts,rvotIndex,result,centroidOf);
  }
  function buildFigure3(rv,lv,parts,rvotIndex,section,centroidOf){
    const lvParts=lv.userData.parts,cusps=['lcc','rcc','ncc'].flatMap(id=>meshMap.get(id)||[]);
    const chestZ=chestPlaneZ(meshVertices);
    if(!lvParts||!cusps.length||chestZ==null)return;
    const pos=rv.geometry.attributes.position,points=[],c=new THREE.Color(),colors=new Float32Array(pos.count*3);
    for(let i=0;i<pos.count;i++){const inRvot=parts.byVertex[i]===rvotIndex;if(inRvot)points.push(new THREE.Vector3().fromBufferAttribute(pos,i));c.set(inRvot?'#2f6fd6':'#86aee8').toArray(colors,i*3);}
    rvFig3Colors=colors;
    const rvotCentroid=points.reduce((s,p)=>s.add(p),new THREE.Vector3()).divideScalar(Math.max(1,points.length));
    const lvotIndex=lvParts.names.findIndex(n=>n.key==='lvot'),lvPos=lv.geometry.attributes.position,lvotPoints=[];
    for(let i=0;i<lvPos.count;i++)if(lvParts.byVertex[i]===lvotIndex)lvotPoints.push(new THREE.Vector3().fromBufferAttribute(lvPos,i));
    if(!lvotPoints.length)return;
    const lvotCentroid=lvotPoints.reduce((s,p)=>s.add(p),new THREE.Vector3()).divideScalar(lvotPoints.length);
    // Outflow direction of the LV: from the LV cavity centre through the aortic valve (the LVOT region itself is too short for an axis).
    const lvotAxis=centroidOf(cusps).sub(centroidOf([lv])).normalize();
    const pvY=centroidOf(meshMap.get('pulmonary-valve')||[])?.y,aoY=centroidOf(cusps).y;
    if(Number.isFinite(pvY)){
      const centre=rvotCentroid.clone().lerp(lvotCentroid,.5);
      // Pulmonary root above the pulmonary valve, high RVOT just below it, low RVOT through the LVOT below the aortic valve (~3.7 cm per unit).
      fig3Levels={root:pvY+.14,high:pvY-.12,low:aoY-.16,centre};
      fig3Caps=createSectionCaps({parent:heart});
    }
    rvThorax=createRvThorax({parent:heart,chestZ,rvot:{centroid:rvotCentroid,axis:section.frame.axis.clone(),points},lvot:{centroid:lvotCentroid,axis:lvotAxis}});
    const nearest=(mesh,target)=>{const p=mesh.geometry.attributes.position,v=new THREE.Vector3();let index=0,best=Infinity;for(let i=0;i<p.count;i++){const d=v.fromBufferAttribute(p,i).distanceToSquared(target);if(d<best){best=d;index=i;}}return index;};
    sceneLabels.add({mesh:rv,index:nearest(rv,rvotCentroid),tone:'region',text:{tr:'RVOT',en:'RVOT'},when:()=>fig3On()&&!fig3Sliced(),always:true});
    sceneLabels.add({mesh:lv,index:nearest(lv,lvotCentroid),tone:'region',text:{tr:'LVOT',en:'LVOT'},when:()=>fig3On()&&!fig3Sliced(),always:true});
  }
  function buildFigure2(rv,lv,parts,lvPoints,centroidOf){
    const tv=meshMap.get('tricuspid-annulus')?.[0]?.userData.frame?.center,band=meshMap.get('moderator-band')?.[0]?.userData.path;
    const pulmonary=meshMap.get('pulmonary-valve')||[],rcc=meshMap.get('rcc')||[];
    if(!tv||!band||!pulmonary.length||!rcc.length)return;
    const result=rvFigure2Regions({rvGeometry:rv.geometry,regionParts:parts,tvCenter:tv,pvCenter:centroidOf(pulmonary),rccCenter:centroidOf(rcc),mbSeptal:new THREE.Vector3(...band[0]),nearLv:nearSet(lvPoints,RVOT_SEPTAL_GAP)});
    const names=result.ids.map(id=>({tr:FIG2_NAMES[id].tr,en:FIG2_NAMES[id].en,abbr:FIG2_NAMES[id].abbr,short:{tr:FIG2_NAMES[id].tr,en:FIG2_NAMES[id].en},color:FIG2_COLORS[id],key:`fig2-${id}`}));
    const colors=new Float32Array(result.byVertex.length*3),c=new THREE.Color();
    result.byVertex.forEach((k,i)=>c.set(FIG2_COLORS[result.ids[k]]).toArray(colors,i*3));
    rvFig2Data={...result,colors,parts:{names,byVertex:Int16Array.from(result.byVertex)}};
    // Labels: the three regions, crest and septomarginal trabeculation on the RV; paper names on valves and muscles.
    const pos=rv.geometry.attributes.position,v=new THREE.Vector3();
    const nearestTo=(target,filter)=>{let index=-1,best=Infinity;for(let i=0;i<pos.count;i++){if(!filter(i))continue;const d=v.fromBufferAttribute(pos,i).distanceToSquared(target);if(d<best){best=d;index=i;}}return index;};
    const centroidOfId=k=>{const m=new THREE.Vector3();let n=0;for(let i=0;i<pos.count;i++)if(result.byVertex[i]===k){m.add(v.fromBufferAttribute(pos,i));n++;}return n?m.divideScalar(n):null;};
    for(const id of ['inflow','outflow','apical','crest','smt']){
      const k=result.ids.indexOf(id),target=id==='crest'?result.anchors.crest:id==='smt'?result.anchors.smtTop.clone().lerp(result.anchors.mbSeptal,.5):centroidOfId(k);
      const index=target?nearestTo(target,i=>result.byVertex[i]===k):-1;
      // Name shows while the pointer is over this region of the RV surface.
      if(index>=0)sceneLabels.add({mesh:rv,index,tone:'region',text:{tr:FIG2_NAMES[id].tr,en:FIG2_NAMES[id].en},when:fig2On,hover:()=>hoverHit?.mesh===rv&&rvFig2Data?.byVertex[hoverHit.vertex]===k});
    }
    const overMesh=m=>(hoverLabelMeshes.add(m),()=>hoverHit?.mesh===m);
    hoverLabelMeshes.add(rv);
    for(const id of ['rcc','lcc','ncc'])for(const m of meshMap.get(id)||[])sceneLabels.add({mesh:m,tone:'region',text:FIG2_LABELS.aortic[id],when:fig2On,hover:overMesh(m)});
    // Leaflets and sinuses carry the paper names on hover; the figure's key structures stay labelled.
    for(const m of meshMap.get('tricuspid')||[]){const t=FIG2_LABELS.leaflets[m.userData.leaflet];if(t)sceneLabels.add({mesh:m,tone:'region',text:t,when:fig2On,hover:overMesh(m)});}
    for(const m of [...pulmonary,...(meshMap.get('rv-papillary')||[])]){const t=FIG2_LABELS.sinuses[m.name]||FIG2_LABELS.papillary[m.name];if(t)sceneLabels.add({mesh:m,tone:'region',text:t,when:fig2On,hover:overMesh(m)});}
    const mb=meshMap.get('moderator-band')?.[0];if(mb)sceneLabels.add({mesh:mb,tone:'region',text:FIG2_LABELS.band,when:fig2On,hover:overMesh(mb)});
  }
  function buildPartTables(){
    const first=id=>meshMap.get(id)?.[0];
    const centroidOf=list=>{const c=new THREE.Vector3();let n=0;for(const m of list){const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){c.x+=p.getX(i);c.y+=p.getY(i);c.z+=p.getZ(i);n++;}}return n?c.divideScalar(n):null;};
    const lv=first('lv'),rv=first('rv'),mvFrame=first('mitral-annulus')?.userData.frame,tvFrame=first('tricuspid-annulus')?.userData.frame;
    const cusps=['lcc','rcc','ncc'].flatMap(id=>meshMap.get(id)||[]);
    if(lv&&mvFrame&&tvFrame&&cusps.length)lv.userData.parts=lvRegions({lvGeometry:lv.geometry,mitralCenter:mvFrame.center,aorticCenter:centroidOf(cusps),tricuspidCenter:tvFrame.center});
    const pulmonary=meshMap.get('pulmonary-valve')||[];
    if(rv&&lv&&tvFrame&&pulmonary.length)rv.userData.parts=rvRegions({rvGeometry:rv.geometry,lvGeometry:lv.geometry,tricuspidCenter:tvFrame.center,pulmonaryCenter:centroidOf(pulmonary)});
    for(const [id,m] of [['lv',lv],['rv',rv]]){
      const parts=m?.userData.parts;
      if(!parts)continue;
      m.userData.branches=parts;
      const colors=new Float32Array(parts.byVertex.length*3),c=new THREE.Color();
      parts.byVertex.forEach((k,i)=>c.set(parts.names[k].color).toArray(colors,i*3));
      m.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
      // One label per region, at its vertex nearest the region centroid.
      const pos=m.geometry.attributes.position;
      parts.names.forEach((name,k)=>{
        const members=[];for(let i=0;i<pos.count;i++)if(parts.byVertex[i]===k)members.push(i);
        if(!members.length)return;
        const mid=new THREE.Vector3();members.forEach(i=>{mid.x+=pos.getX(i);mid.y+=pos.getY(i);mid.z+=pos.getZ(i);});mid.divideScalar(members.length);
        const index=members.reduce((b,i)=>{const d=(pos.getX(i)-mid.x)**2+(pos.getY(i)-mid.y)**2+(pos.getZ(i)-mid.z)**2;return d<b.d?{i,d}:b;},{i:members[0],d:Infinity}).i;
        sceneLabels.add({mesh:m,index,tone:'region',text:name.short,when:()=>chamberMode(mode)?.chamber===id&&ventricleRegions&&!fluoroscopy&&!(id==='rv'&&(rvotOn()||fig2On()||fig3On()))});
      });
    }
    buildRvotSection(first,centroidOf);
    const ring=first('mitral-annulus')?.userData,posterior=first('mitral-posterior');
    for(const m of meshMap.get('mitral')||[]){const parts=mitralParts(m,ring,posterior);if(parts){m.userData.parts=parts;m.userData.branches=parts;}}
    for(const m of meshMap.get('tricuspid')||[]){const name=TRICUSPID_LEAFLETS[m.userData.leaflet];if(name)m.userData.parts=wholeMesh(m,name);}
    for(const id of ['lcc','rcc','ncc'])for(const m of meshMap.get(id)||[])m.userData.parts=wholeMesh(m,AORTIC_CUSPS[id]);
    for(const m of pulmonary){const name=pulmonaryCusp(m.userData.sourceName||m.name);if(name)m.userData.parts=wholeMesh(m,name);}
  }

  // Supra-aortic branches (schematic, seated on the atlas arch; aortic-arch-branches.js). They follow the aorta's visibility toggle.
  function buildSupraAorticBranches() {
    const arch = meshes.find(m => m.name === 'Aortic arch');
    if (!arch) return;
    for (const b of buildArchBranches(arch.geometry)) {
      const mesh = new THREE.Mesh(b.geometry, material(0xc18068));
      mesh.name = `${b.en} (schematic)`;
      mesh.userData = { id: b.id, layer: 'vessels', color: 0xc18068, provenance: 'schematic', sourceName: mesh.name, followsId: 'aorta', origin: b.origin.toArray(), end: b.end.toArray(), radius: b.radius, parentId: b.parent };
      arch.parent.add(mesh);
      register(mesh, b.id);
    }
  }

  // Moderator band: RV muscle bundle around the RBB, septum to the anterior papillary base.
  function buildModeratorBand(septal, papillary, rvCenter) {
    const band = createModeratorBand({ septal, papillary, rvCenter });
    const mesh = new THREE.Mesh(band.geometry, material(0xa3443d));
    mesh.name = 'Moderator band (schematic, along the measured RBB)';
    mesh.userData = { id: 'moderator-band', layer: 'chambers', provenance: 'schematic', sourceName: mesh.name, path: band.path.map(p => p.toArray()) };
    layers.chambers.add(mesh);
    register(mesh, 'moderator-band');
    sceneLabels.add({ mesh, index: Math.floor(band.geometry.attributes.position.count / 2), tone: 'crista', text: { tr: 'Moderatör bant', en: 'Moderator band' }, when: () => mode === 'rv' && !fluoroscopy });
  }

  // Eustachian valve and Chiari network (schematic, from the IVC and CS ostia and the crista).
  function buildRaValves() {
    const crista = meshMap.get('crista-terminalis')?.[0];
    if (!csMouth || !crista) return;
    const raMeshes = meshMap.get('ra') || [];
    const cristaPath = crista.userData.path.map(p => new THREE.Vector3(...p));
    const valve = createEustachianValve({ raMeshes, ivcOstium: new THREE.Vector3(...crista.userData.landmarks.ivcOstium), csOstium: csMouth.posteriorLip });
    const valveMesh = new THREE.Mesh(valve.geometry, material(0xd9b8a0));
    valveMesh.name = 'Eustachian valve (schematic fold of the IVC orifice)';
    valveMesh.userData = { id: 'eustachian-valve', layer: 'chambers', provenance: 'schematic', sourceName: valveMesh.name, base: valve.base.map(p => p.toArray()), edge: valve.edge.map(p => p.toArray()) };
    layers.chambers.add(valveMesh);
    register(valveMesh, 'eustachian-valve');
    sceneLabels.add({ mesh: valveMesh, tone: 'crista', text: { tr: 'Östaki kapağı', en: 'Eustachian valve' }, when: () => mode === 'ra' && !fluoroscopy });
    const net = createChiariNetwork({ raMeshes, valveEdge: valve.edge, cristaPath });
    const netMesh = new THREE.Mesh(net.geometry, material(0xeadbc8));
    netMesh.name = 'Chiari network (schematic variant strands)';
    netMesh.userData = { id: 'chiari-network', layer: 'chambers', provenance: 'schematic', sourceName: netMesh.name, strands: net.strands.map(st => st.map(p => p.toArray())) };
    layers.chambers.add(netMesh);
    register(netMesh, 'chiari-network');
    sceneLabels.add({ mesh: netMesh, tone: 'crista', text: { tr: 'Chiari ağı (varyant)', en: 'Chiari network (variant)' }, when: () => mode === 'ra' && !fluoroscopy });
  }

  function buildConductionSystem() {
    const conductionGroup = layers.conduction;
    const matNode = new THREE.MeshStandardMaterial({
      color: 0xffdf66,
      emissive: 0xffaa00,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.15,
      toneMapped: false
    });
    const matPath = new THREE.MeshStandardMaterial({
      color: 0xf5d045,
      emissive: 0xe69500,
      emissiveIntensity: 0.65,
      roughness: 0.35,
      metalness: 0.1,
      toneMapped: false
    });

    // 1. Sinoatrial (SA) node at cavoatrial junction, embedded in RA wall
    // (measured closest RA surface point so the node does not float in the SVC lumen)
    const saCenter = new THREE.Vector3(-1.045, 1.39, 0.115);
    const saWallNormal = new THREE.Vector3(0.05, 0.05, 1).normalize();
    const saMesh = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 24), matNode.clone());
    saMesh.position.copy(saCenter);
    saMesh.name = 'Sinoatrial node';
    saMesh.userData = { id: 'sa', layer: 'conduction', sourceName: 'Sinoatrial node', provenance: 'schematic' };
    conductionGroup.add(saMesh);
    register(saMesh, 'sa');

    // Subtle aura ring around SA node
    const saHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.09, 0.13, 24),
      new THREE.MeshBasicMaterial({ color: 0xffdf6d, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
    );
    saHalo.position.copy(saCenter).addScaledVector(saWallNormal, 0.02);
    saHalo.lookAt(saCenter.clone().addScaledVector(saWallNormal, 1));
    saHalo.name = 'SA Node Halo';
    saHalo.userData = { id: 'sa', layer: 'conduction', sourceName: 'Sinoatrial node halo', provenance: 'schematic' };
    conductionGroup.add(saHalo);
    register(saHalo, 'sa');

    // 2. Compact AV node at the apex of Koch's triangle: the superior end of
    // the septal tricuspid hinge, where it meets the membranous septum under
    // the non-coronary cusp. Measured on the RA/RV orifice rim, nudged to the
    // atrial side. The old hand-placed point sat inside the septum.
    const avCenter = (()=>{
      const rim=sharedRim(meshMap.get('ra')?.[0], meshMap.get('rv')?.[0]);
      const ncc=sourceCenter('ncc'), ra=sourceCenter('ra');
      if(!rim||!ncc||!ra)return new THREE.Vector3(-0.72,0.25,-0.02);
      const apex=rim.reduce((best,v)=>v.distanceTo(ncc)<best.distanceTo(ncc)?v:best).clone();
      return apex.lerp(ra,.06);
    })();
    const avMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 24, 24), matNode.clone());
    avMesh.position.copy(avCenter);
    avMesh.name = 'Atrioventricular node';
    avMesh.userData = { id: 'av', layer: 'conduction', sourceName: 'Atrioventricular node', provenance: 'schematic' };
    conductionGroup.add(avMesh);
    register(avMesh, 'av');

    function makeTract(points, radius, id = 'his', name = 'Conduction tract') {
      const curve = new THREE.CatmullRomCurve3(points);
      const geom = new THREE.TubeGeometry(curve, 28, radius, 8, false);
      const mesh = new THREE.Mesh(geom, matPath.clone());
      mesh.name = name;
      mesh.userData = { id, layer: 'conduction', sourceName: name, provenance: 'schematic' };
      conductionGroup.add(mesh);
      register(mesh, id);
      return mesh;
    }

    // 3. Internodal tracts from SA node to AV node & LA
    makeTract([
      saCenter.clone(),
      new THREE.Vector3(-0.85, 0.90, 0.22),
      new THREE.Vector3(-0.52, 0.35, 0.15),
      avCenter.clone()
    ], 0.016, 'sa', 'Anterior internodal tract');

    const bachmann = createBachmannGeometry(id => meshMap.get(id) || [], laaOrificeOf(meshMap.get('la')?.[0], meshVertices('la')), { saNode: saCenter, cristaSulcus });
    bachmannTarget = bachmann.target;
    const targetMarker = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshStandardMaterial({ color: 0xc03bb8, emissive: 0x5a1456, roughness: 0.4 }));
    targetMarker.position.copy(bachmann.target);
    targetMarker.name = 'Bachmann-region pacing target (RA endocardium, schematic)';
    bachmannTargetGroup.add(targetMarker);
    sceneLabels.add({ mesh: targetMarker, tone: 'target', text: { tr: 'Pacing hedefi (RA endokardı)', en: 'Pacing target (RA endocardium)' }, when: () => mode === 'bachmann' && !fluoroscopy });
    const bandMaterial = matPath.clone();
    bandMaterial.color.setHex(0xf6b64b);
    bandMaterial.side = THREE.DoubleSide;
    const band = new THREE.Mesh(bachmann.geometry, bandMaterial);
    band.name = "Bachmann's bundle (schematic atrial roof band)";
    band.userData = {id:'bachmann', layer:'conduction', provenance:'schematic', bandAnchor:bachmann.bandAnchor.toArray(), pacingTarget:bachmann.target.toArray(), landmarks:Object.fromEntries(Object.entries(bachmann.landmarks).filter(([,v])=>v).map(([k,v])=>[k,v.toArray()])), path:bachmann.path.map(p=>p.toArray()), inferiorLimb:bachmann.inferiorLimb.map(p=>p.toArray())};
    conductionGroup.add(band);
    register(band, 'bachmann');
    sceneLabels.add({ mesh: band, tone: 'bachmann', text: { tr: 'Bachmann demeti (epikardiyal)', en: "Bachmann's bundle (epicardial)" }, when: () => mode === 'bachmann' && !fluoroscopy });

    makeTract([
      saCenter.clone(),
      new THREE.Vector3(-0.82, 0.75, -0.05),
      new THREE.Vector3(-0.55, 0.25, -0.06),
      avCenter.clone()
    ], 0.015, 'sa', 'Middle internodal tract (Wenckebach)');

    makeTract([
      saCenter.clone(),
      new THREE.Vector3(-1.00, 0.65, -0.22),
      new THREE.Vector3(-0.75, 0.08, -0.32),
      new THREE.Vector3(-0.45, -0.22, -0.25),
      avCenter.clone()
    ], 0.015, 'sa', 'Posterior internodal tract (Thorel)');

    // 4. Bundle of His: the node penetrates the mitral-tricuspid fibrous
    // continuity (membranous septum level) and, via the infero-septal recess,
    // reaches the crest of the muscular septum (Tretter et al., Europace 2022).
    // Its distal (branching) end is measured on the crest of the muscular
    // septum under the NCC/RCC commissure, 1-2 cm from the AV node; the LBB
    // trunk runs ~1.3 cm on toward the apex and ends in LV subendocardium.
    // The AV node and Koch's triangle above are unchanged.
    const rvVerts = meshVertices('rv');
    const septum = septalPairs(rvVerts, meshVertices('lv'));
    const nccCenter = sourceCenter('ncc'), rccCenter = sourceCenter('rcc');
    const commissure = nccCenter && rccCenter ? nccCenter.clone().lerp(rccCenter, 0.5) : null;
    const hisSeptum = (commissure && hisBundleEnd(septum, avCenter, commissure)) || new THREE.Vector3(-0.10, -0.32, 0.06);
    // Penetrating His: through the fibrous continuity toward the crest of
    // the muscular septum.
    const hisPenetrating = avCenter.clone().lerp(hisSeptum, .45).add(new THREE.Vector3(0, -.04, .02));
    makeTract([
      avCenter.clone(),
      hisPenetrating,
      hisSeptum.clone()
    ], 0.024, 'his', 'Bundle of His');

    // 5. Right bundle branch: measured on the RV septal subendocardium down
    // the septomarginal trabeculation, then the moderator band to the base
    // of the anterior papillary muscle.
    const rvCenter = sourceCenter('rv');
    const tvRimForAxis = sharedRim(meshMap.get('ra')?.[0], meshMap.get('rv')?.[0]);
    const tvCenter = tvRimForAxis ? tvRimForAxis.reduce((sum, v) => sum.add(v), new THREE.Vector3()).multiplyScalar(1 / tvRimForAxis.length) : null;
    const rvApex = tvCenter && rvVerts.length
      ? rvVerts.reduce((b, v) => v.distanceToSquared(tvCenter) > b.distanceToSquared(tvCenter) ? v : b).clone()
      : null;
    const anteriorPapMesh = (meshMap.get('rv-papillary') || []).find(m => /anterior papillary/i.test(m.name));
    const anteriorPap = anteriorPapMesh ? new THREE.Box3().setFromObject(anteriorPapMesh).getCenter(new THREE.Vector3()) : null;
    const rbb = measureRightBundle({ hisEnd: hisSeptum, hisFrom: hisPenetrating, septum, rvVerts, rvCenter, rvApex, anteriorPapillary: anteriorPap });
    if (rbb && anteriorPap) buildModeratorBand(rbb.band, rbb.path[rbb.path.length - 1], rvCenter);
    makeTract(rbb ? rbb.path : [
      hisSeptum.clone(),
      new THREE.Vector3(-0.06, -0.52, 0.22),
      new THREE.Vector3(0.04, -0.78, 0.42),
      new THREE.Vector3(0.14, -1.02, 0.52),
      new THREE.Vector3(0.18, -0.65, 0.72)
    ], 0.018, 'his', 'Right bundle branch');

    // 6. Left bundle branch: measured on the LV septal subendocardium from
    // the distal His, descending toward the apex, then fanning into the
    // anterior and posterior fascicles toward the papillary muscle bases.
    const lvVerts = meshVertices('lv');
    // The annulus meshes are built after this; take the mitral orifice from
    // the LA/LV shared rim directly.
    const mitralRim = sharedRim(meshMap.get('la')?.[0], meshMap.get('lv')?.[0]);
    const mitralCenter = mitralRim ? mitralRim.reduce((sum, v) => sum.add(v), new THREE.Vector3()).multiplyScalar(1 / mitralRim.length) : null;
    const lvApex = mitralCenter && lvVerts.length
      ? lvVerts.reduce((b, v) => v.distanceToSquared(mitralCenter) > b.distanceToSquared(mitralCenter) ? v : b).clone()
      : null;
    const lbb = measureLeftBundle({ hisEnd: hisSeptum, hisFrom: hisPenetrating, septum, lvVerts, mitralCenter, lvApex, papillary: sourceCenter('lv-papillary') });
    const fallbackStart = new THREE.Vector3(0.05, -0.42, 0.05);
    makeTract(lbb ? lbb.trunk : [hisSeptum.clone(), fallbackStart], 0.022, 'his', 'Left bundle branch trunk');
    makeTract(lbb ? lbb.anterior : [fallbackStart, new THREE.Vector3(0.25, -0.60, 0.22), new THREE.Vector3(0.50, -0.85, 0.26), new THREE.Vector3(0.72, -0.72, 0.28)], 0.016, 'his', 'LBB Anterior fascicle');
    makeTract(lbb ? lbb.posterior : [fallbackStart, new THREE.Vector3(0.28, -0.55, -0.10), new THREE.Vector3(0.52, -0.78, -0.12), new THREE.Vector3(0.85, -0.72, 0.05)], 0.017, 'his', 'LBB Posterior fascicle');

    // 7. Purkinje subendocardial arborizations: the RV one from the RBB, the
    // LV ones from the measured fascicle ends toward the apex.
    const purkinjeBranches = [
      rbb ? rbb.purkinje : [new THREE.Vector3(0.14, -1.02, 0.52), new THREE.Vector3(0.08, -1.22, 0.35), new THREE.Vector3(0.18, -1.28, 0.22)],
      ...(lbb ? lbb.purkinje.slice(0, 2) : [
        [new THREE.Vector3(0.50, -0.85, 0.26), new THREE.Vector3(0.42, -1.15, 0.18), new THREE.Vector3(0.32, -1.25, 0.10)],
        [new THREE.Vector3(0.52, -0.78, -0.12), new THREE.Vector3(0.60, -1.05, -0.05), new THREE.Vector3(0.48, -1.22, 0.02)]
      ])
    ];
    purkinjeBranches.forEach((pts, i) => {
      makeTract(pts, 0.011, 'his', `Purkinje network branch ${i+1}`);
    });
  }

  // The atlas coronary sinus ends in the AV groove on the tricuspid hinge.
  // Bend its proximal end onto the measured right atrial ostium (atrial side
  // of the annulus, one septal isthmus above the hinge, facing the cavity) so
  // every consumer (Koch base, CS catheters, CRT lead, venous flow) starts at
  // the real mouth.
  let csMouth=null;
  function seatCoronarySinus(){
    const cs=meshMap.get('cs')?.[0],ra=meshMap.get('ra')?.[0],rv=meshMap.get('rv')?.[0];
    const raCenter=sourceCenter('ra'),ncc=sourceCenter('ncc');
    const tvRim=sharedRim(ra,rv);
    if(!cs||!raCenter||!tvRim)return;
    const avApprox=ncc?tvRim.reduce((b,v)=>v.distanceTo(ncc)<b.distanceTo(ncc)?v:b).clone().lerp(raCenter,.06):null;
    const mouth=coronarySinusOstium({raMesh:ra,laMesh:meshMap.get('la')?.[0],csMesh:cs,tvRim,towardVentricle:sourceCenter('rv'),avNode:avApprox});
    if(!mouth)return;
    csMouth=mouth;
    // Sit the rim just outside the endocardium; the RA wall carries the hole.
    const facing=raCenter.clone().sub(mouth.center).normalize();
    seatVesselEnd(cs,{from:mouth.sinusEnd,target:mouth.center.clone().addScaledVector(facing,-.02),facing});
  }

  function initializeWallPlanes(){
    // Regional section windows, not segmented histological or anatomical wall labels.
    const lv=sourceCenter('lv'),rv=sourceCenter('rv');
    const septalDirection=lv&&rv?lv.clone().sub(rv):new THREE.Vector3(1,0,-1);
    septalDirection.y=0;septalDirection.normalize();
    const normals={rv:septalDirection,lv:new THREE.Vector3(-1,0,0),la:new THREE.Vector3(0,0,1),ra:new THREE.Vector3(1,0,0)};
    for(const [id,normal] of Object.entries(normals)){
      let min=Infinity,max=-Infinity;for(const mesh of meshMap.get(id)||[]){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const value=normal.x*p.getX(i)+normal.y*p.getY(i)+normal.z*p.getZ(i);min=Math.min(min,value);max=Math.max(max,value);}}
      if(Number.isFinite(min))wallPlanes.set(id,{plane:new THREE.Plane(normal,-min),min,max});
    }
    for(const id of Object.keys(wallCuts))updateWallPlane(id);
  }
  function updateWallPlane(id){const record=wallPlanes.get(id);if(record)record.plane.constant=-(record.min+(record.max-record.min)*wallCuts[id]);}
  function setWallCut(id,value){if(!(id in wallCuts))return;wallCuts[id]=THREE.MathUtils.clamp(Number(value),0,.8);updateWallPlane(id);applyState();}
  const angioPresets={
    ap:{laoRao:0,craCau:0},
    lao40:{laoRao:40,craCau:0},
    bachmann_roof:{laoRao:0,craCau:35},
    anterior:{laoRao:0,craCau:0},
    posterior:{laoRao:180,craCau:0},
    rao:{laoRao:-30,craCau:0},
    lao:{laoRao:45,craCau:0},
    spider:{laoRao:45,craCau:-30},
    rao_cranial:{laoRao:-30,craCau:30},
    lao_cranial:{laoRao:45,craCau:30},
    rao_caudal:{laoRao:-30,craCau:-20},
    ap_cranial:{laoRao:0,craCau:35},
    ap_caudal:{laoRao:0,craCau:-30},
    lateral:{laoRao:90,craCau:0}
  };

  function getAngioAngles(){
    const target=lookTarget||new THREE.Vector3(0,.4,0);
    const offset=camera.position.clone().sub(target);
    const R=offset.length();
    if(R<0.001)return {laoRao:0,craCau:0,laoRaoStr:'AP 0°',craCauStr:'0°',label:'AP 0° · 0°'};
    const phi=Math.asin(THREE.MathUtils.clamp(offset.y/R,-1,1))*(180/Math.PI);
    const theta=Math.atan2(offset.x,offset.z)*(180/Math.PI);
    const roundLaoRao=Math.round(theta);
    const roundCraCau=Math.round(phi);
    const laoRaoStr=roundLaoRao>0?`LAO ${roundLaoRao}°`:roundLaoRao<0?`RAO ${Math.abs(roundLaoRao)}°`:'AP 0°';
    const craCauStr=roundCraCau>0?`CRA ${roundCraCau}°`:roundCraCau<0?`CAU ${Math.abs(roundCraCau)}°`:'0°';
    return {
      laoRao:roundLaoRao,
      craCau:roundCraCau,
      laoRaoStr,
      craCauStr,
      label:`${laoRaoStr} · ${craCauStr}`,
      distance:R
    };
  }

  function emitAngleChange(){
    if(typeof onAngleChange!=='function')return;
    const angles=getAngioAngles();
    const key=`${angles.laoRao}_${angles.craCau}`;
    if(key!==lastEmittedKey){
      lastEmittedKey=key;
      onAngleChange(angles);
    }
  }

  // Framing: distance at which the heart (chambers, great vessels, coronaries)
  // fills the canvas for the current aspect ratio. Recomputed on resize.
  const fitCenter=new THREE.Vector3(0,.4,0);
  let fitDistance=9.3;
  function computeFit(){
    const box=new THREE.Box3();
    for(const m of meshes){
      const layer=m.userData.layer;
      if(layer==='chambers'||layer==='vessels'||layer==='coronaries')box.expandByObject(m);
    }
    if(box.isEmpty())return;
    box.getCenter(fitCenter);
    const size=box.getSize(new THREE.Vector3());
    const t=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    const depth=Math.max(size.x,size.z);
    const vertical=(size.y/2)/t;
    const horizontal=(depth/2)/(t*Math.max(camera.aspect,.2));
    fitDistance=THREE.MathUtils.clamp((Math.max(vertical,horizontal)/.94+depth*.5)*.9,3,18);
  }
  function setAngioProjection(laoRaoDeg,craCauDeg,smooth=true,keepDistance=true){
    if(mitralFocus){mitralFocus=false;applyState();}
    const target=fitCenter.clone();
    const offset=camera.position.clone().sub(target);
    const R=keepDistance?Math.max(2.5,Math.min(16.0,offset.length()||fitDistance)):fitDistance;
    const clampedLaoRao=THREE.MathUtils.clamp(Number(laoRaoDeg)||0,-180,180);
    const clampedCraCau=THREE.MathUtils.clamp(Number(craCauDeg)||0,-50,50);
    const theta=(clampedLaoRao*Math.PI)/180;
    const phi=(clampedCraCau*Math.PI)/180;
    const x=R*Math.cos(phi)*Math.sin(theta);
    const y=R*Math.sin(phi);
    const z=R*Math.cos(phi)*Math.cos(theta);

    cameraTarget.copy(target).add(new THREE.Vector3(x,y,z));
    lookTarget.copy(target);

    if(smooth){
      transition=true;
      container.dataset.cameraSettled='false';
    }else{
      transition=false;
      camera.position.copy(cameraTarget);
      controls.target.copy(lookTarget);
      controls.update();
      container.dataset.cameraSettled='true';
    }
    emitAngleChange();
  }

  function setView(name,smooth=true){userPanned=false;
    mitralFocus=name==='mitral'&&mode==='anatomy';
    kochFocus=KOCH_VIEWS[name]!==undefined&&mode==='ablation';
    applyState();
    if(mitralFocus){
      const f=meshMap.get('mitral-annulus')?.[0]?.userData.frame;
      if(!f)return;
      lookTarget.copy(f.center);
      cameraTarget.copy(f.center).addScaledVector(f.normal,-Math.max(2.8,f.radius*5));
      transition=smooth;container.dataset.cameraSettled=String(!smooth);
      if(!smooth){camera.position.copy(cameraTarget);controls.target.copy(lookTarget);controls.update();}
      requestRender();return;
    }
    if(angioPresets[name]){
      setAngioProjection(angioPresets[name].laoRao,angioPresets[name].craCau,smooth,false);
      return;
    }
    const kochCentre=KOCH_VIEWS[name]!==undefined?epLandmarks.kochCentre():null;
    if(kochCentre){
      const theta=THREE.MathUtils.degToRad(KOCH_VIEWS[name]);
      const dir=new THREE.Vector3(Math.sin(theta),0,Math.cos(theta));
      lookTarget.copy(kochCentre);
      cameraTarget.copy(kochCentre).addScaledVector(dir,Math.max(KOCH_VIEW_DISTANCE,heartSurfaceExit(kochCentre,dir)+KOCH_VIEW_CLEARANCE));
      transition=smooth;container.dataset.cameraSettled=String(!smooth);
      if(!smooth){camera.position.copy(cameraTarget);controls.target.copy(lookTarget);controls.update();}
      emitAngleChange();requestRender();return;
    }
    if(name==='rvot'&&rvotData){
      // From above and slightly behind, so the default up vector puts anterior at the top and the patient's right on the right (Aronis Fig. 1).
      const {cutPoint,view:axis,anterior}=rvotData.frame;
      lookTarget.copy(cutPoint);
      cameraTarget.copy(cutPoint).addScaledVector(axis,3.3).addScaledVector(anterior,-.8);
      transition=smooth;container.dataset.cameraSettled=String(!smooth);
      if(!smooth){camera.position.copy(cameraTarget);controls.target.copy(lookTarget);controls.update();}
      emitAngleChange();requestRender();return;
    }
    const root=sourceCenter('lm')||new THREE.Vector3(0,.6,0);
    const target=name==='root'?root:fitCenter.clone();
    const offsets={anterior:[0,.1,9.3],posterior:[0,.1,-9.3],rao:[-6.6,.3,6.6],lao:[6.6,.3,6.6],root:[.2,3.7,1.4]};
    cameraTarget.copy(target).add(new THREE.Vector3(...(offsets[name]||offsets.anterior)));lookTarget.copy(target);
    if(name==='root'){rootWindow=true;applyState();}
    transition=smooth;container.dataset.cameraSettled=String(!smooth);if(!smooth){camera.position.copy(cameraTarget);controls.target.copy(lookTarget);controls.update();}
    emitAngleChange();
  }

  function zoomIn(factor = 0.22) {
    transition = false;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const dist = camera.position.distanceTo(controls.target);

    if (dist > 0.55) {
      // Approach phase: move camera closer to target
      const step = Math.min(dist * factor, dist - 0.4);
      camera.position.addScaledVector(forward, Math.max(step, 0.06));
    } else {
      // Inside/penetration phase: advance both camera and target forward along sightline.
      // This allows the camera to smoothly enter into the heart chambers, valves,
      // aortic root and explore the interior without getting stuck on minDistance.
      const advance = 0.16;
      const nextTarget = controls.target.clone().addScaledVector(forward, advance);
      if (nextTarget.distanceTo(fitCenter) < 2.2) {
        controls.target.copy(nextTarget);
        camera.position.addScaledVector(forward, advance);
      } else {
        const step = Math.min(advance, Math.max(0, dist - 0.04));
        if (step > 0.005) camera.position.addScaledVector(forward, step);
      }
    }
    cameraTarget.copy(camera.position);
    lookTarget.copy(controls.target);
    controls.update();
    emitAngleChange();
    requestRender();
  }

  function zoomOut(factor = 0.22) {
    transition = false;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    // If target drifted away from heart center, gently return it towards fitCenter
    const targetOffset = controls.target.clone().sub(fitCenter);
    const targetDist = targetOffset.length();
    if (targetDist > 0.03) {
      const pull = Math.min(targetDist, 0.14);
      controls.target.addScaledVector(targetOffset.normalize(), -pull);
    }

    const dist = camera.position.distanceTo(controls.target);
    const step = Math.max(0.12, dist * factor);
    const newPos = camera.position.clone().addScaledVector(forward, -step);
    if (newPos.distanceTo(controls.target) <= controls.maxDistance) {
      camera.position.copy(newPos);
    }
    cameraTarget.copy(camera.position);
    lookTarget.copy(controls.target);
    controls.update();
    emitAngleChange();
    requestRender();
  }

  function getZoomInfo() {
    return {
      distance: camera.position.distanceTo(controls.target),
      target: controls.target.toArray(),
      position: camera.position.toArray(),
      insideHeart: controls.target.distanceTo(fitCenter) > 0.2 || camera.position.distanceTo(fitCenter) < 1.2
    };
  }

  function restoreCameraPose(pose) {
    if (![pose?.position, pose?.target].every(v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite))) return;
    transition = false;
    camera.position.fromArray(pose.position);
    controls.target.fromArray(pose.target);
    cameraTarget.copy(camera.position);
    lookTarget.copy(controls.target);
    controls.update();
    // OrbitControls change handlers can recenter the target. Preserve the snapshot.
    controls.target.fromArray(pose.target);
    lookTarget.copy(controls.target);
    camera.lookAt(controls.target);
    container.dataset.cameraSettled = 'true';
    emitAngleChange();
    requestRender();
  }

  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  let catheterPickables=null;
  function pickTargets(){
    if(mode==='defects')return meshes.concat(septalDefects.group.children);
    if(!transseptal.group.visible&&!cathLab.group.visible&&!epLandmarks.group.visible&&!auscultation.group.visible)return meshes;
    if(!catheterPickables||!catheterPickables.length){
      catheterPickables=[];
      for(const g of [transseptal.group,cathLab.group,epLandmarks.group,auscultation.group]){
        if(g.visible)g.traverse(o=>{if(o.isMesh&&o.userData.pickId)catheterPickables.push(o);});
      }
    }
    return catheterPickables.length?meshes.concat(catheterPickables):meshes;
  }
  function shownStructureId(object){
    const data=object.userData||{};
    if(data.pickId)return data.pickId;
    if(data.leaflet&&data.id)return data.id+'-'+data.leaflet;
    return data.id||null;
  }
  // The named side branch under the last pick (coronary tubes), or null.
  let pickedBranch=null;
  const branchOf=h=>h.face?branchAt(h.object.userData.branches,h.face.a):null;
  let hoverHit=null;   // last picked surface hit: mesh and vertex, for region-level hover labels
  const hoverLabelMeshes=new Set();   // meshes with hover labels: the front one wins even when see-through
  function pick(e){pickedBranch=null;hoverHit=null;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(pickTargets()).filter(h=>{for(let p=h.object;p;p=p.parent)if(!p.visible)return false;return !(h.object.material.clippingPlanes||[]).some(p=>p.distanceToPoint(h.point)<0);});
    const labelHit=hits.find(h=>hoverLabelMeshes.has(h.object));
    const done=v=>{if(labelHit)hoverHit={mesh:labelHit.object,vertex:labelHit.face?.a??-1};return v;};
    // See-through tissue (opacity < .5) should not swallow clicks aimed at
    // devices or solid structures behind it.
    for(const h of hits){
      if(h.object.userData.pickId){hoverHit={mesh:h.object,vertex:h.face?.a??-1};return done(h.object.userData.pickId);}
      if((h.object.material.opacity??1)>=0.5){hoverHit={mesh:h.object,vertex:h.face?.a??-1};pickedBranch=branchOf(h);return done(shownStructureId(h.object));}
    }
    if(hits[0]){hoverHit={mesh:hits[0].object,vertex:hits[0].face?.a??-1};pickedBranch=branchOf(hits[0]);}
    return done(hits[0]?shownStructureId(hits[0].object):null);
  }
  function pointerMove(e){hovered=pick(e);sceneLabels.setFocus(hovered,selected);paintSelection();requestRender();renderer.domElement.style.cursor=hovered?'pointer':'grab';onHover(hovered,pickedBranch);}
  function pointerDown(e){transition=false;down=[e.clientX,e.clientY];}
  function pointerUp(e){if(!down)return;const click=Math.hypot(e.clientX-down[0],e.clientY-down[1])<6;down=null;if(click){const id=pick(e);if(id)onSelect(id,pickedBranch);}}
  function pointerLeave(){hovered=null;hoverHit=null;down=null;sceneLabels.setFocus(selected);paintSelection();requestRender();onHover(null);}
  renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointerleave',pointerLeave);
  const resize=()=>{const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();computeFit();if(modelReady&&mode==='atria'&&['la','laa'].includes(selected))focusLeftAtrium(selected);requestRender();};
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  let lastTime = performance.now();
  let lastFrameTime = -Infinity;
  function animate(now){
    frame=requestAnimationFrame(animate);
    if (!renderer.xr.isPresenting && options.maxFps && now - lastFrameTime < 1000 / options.maxFps) return;
    lastFrameTime = now;
    const dt = Math.min(100, Math.max(0, now - lastTime));
    lastTime = now;
    if(transition){
      camera.position.lerp(cameraTarget,.12);
      controls.target.lerp(lookTarget,.12);
      if(camera.position.distanceTo(cameraTarget)<.002&&controls.target.distanceTo(lookTarget)<.002)transition=false;
      needsRender=true;
    }
    const cycleState = cardiacCycle.getCycleState();
    if(cycleState.playing && mode !== 'micro'){
      cardiacCycle.tick(dt);
      const curState = cardiacCycle.getCycleState();
      if(channels) channels.applyChannels(curState);
      if(bloodFlow && visibility.flow) bloodFlow.tick(dt, curState);
      needsRender=true;
    }
    if(!renderer.xr.isPresenting&&controls.update()){
      needsRender=true;
    }
    container.dataset.cameraSettled=String(!transition);
    emitAngleChange();
    // An XR session renders every frame; the headset pose changes continuously.
    if(renderer.xr.isPresenting){renderScene();return;}
    if(needsRender){
      renderScene();
      if(!transition&&(!cycleState.playing||mode==='micro'))needsRender=false;
    }
  }frame=requestAnimationFrame(animate);
  // WebXR (AR / MR / VR): feature-detected buttons on the viewport; the heart
  // group is placed room-scale during a session and restored afterwards.
  // Velocity color legend of the flow layer (jet scale of blood-flow.js): relative speed, not measured velocity.
  flowLegend=document.createElement('div');
  flowLegend.className='flow-speed-legend';
  flowLegend.hidden=!layers.flow.visible;
  const legendLang=(globalThis.localStorage?.getItem?.('cardia_lang'))==='en'?'en':'tr';
  flowLegend.innerHTML=`<span class="flow-speed-bar" aria-hidden="true"></span><span class="flow-speed-text" data-i18n="flowLegend">${legendLang==='en'?'Flow speed (relative): slow to fast':'Akış hızı (göreli): yavaştan hızlıya'}</span>`;
  container.appendChild(flowLegend);
  const xrSupport=createXrSupport({renderer,subject:heart,container,getLang:()=>((globalThis.localStorage?.getItem?.('cardia_lang'))==='en'?'en':'tr'),
    onSessionStart(){cancelAnimationFrame(frame);controls.enabled=false;renderer.setAnimationLoop(animate);},
    onSessionEnd(){renderer.setAnimationLoop(null);controls.enabled=true;lastTime=performance.now();frame=requestAnimationFrame(animate);requestRender();}});
  // Both alternative views swap materials only while a frame is drawn, so selection,
  // lesson updates and resets keep working on the original materials.
  function renderSwapped(replacement){
    const originals=[];
    try{
      heart.traverseVisible(object=>{
        if(!object.isMesh || Array.isArray(object.material))return;
        const swapped=replacement(object);
        if(!swapped)return;
        originals.push([object,object.material]);
        object.material=swapped;
      });
      renderer.render(scene,camera);
    }finally{for(const [object,original] of originals)object.material=original;}
  }
  // Educational projection: layer attenuation, not a simulated diagnostic radiograph.
  const projectionMaterials = new Map();
  function projectionMaterial(object){
    const original=object.material;
    const layer=object.userData.layer;
    const atlas=object.userData.provenance==='atlas';
    // With a graft shown, the graft and the artery it fills carry the contrast; the other natives do not.
    const graftRun=activeGraft?grafts.targetOf(activeGraft):null;
    const contrast=(object.userData.graft&&object.userData.graft===activeGraft)||((atlas||object.userData.nativeCoronary) && layer==='coronaries' && mode==='angiography' && (!activeGraft||object.userData.id===graftRun));
    let device=false;
    let schematicTissue=false;
    let deviceTint=null;
    for(let parent=object.parent;parent;parent=parent.parent){
      if(parent.userData.projectionTissue)schematicTissue=true;
      if(deviceTint===null && parent.userData.fluoroTint!=null)deviceTint=parent.userData.fluoroTint;
      if(parent.userData.fluoroDevice || parent===pacemakerLeads.group || parent===transseptal.group || parent===cathLab.group){device=true;break;}
    }
    device=device && !schematicTissue && !original.isMeshBasicMaterial;
    let projected=projectionMaterials.get(object);
    if(!projected){
      projected=new THREE.MeshBasicMaterial({transparent:true,premultipliedAlpha:true,depthWrite:false,depthTest:false,side:THREE.FrontSide,toneMapped:false,blending:THREE.MultiplyBlending});
      projectionMaterials.set(object,projected);
    }
    projected.color.setHex(device?(deviceTint??0x202020):contrast?0x303030:0x6a6a6a);
    projected.opacity=device?(original.transparent?Math.min(.85,original.opacity+.15):.95):contrast?.8*coronaryContrast:atlas?(layer==='chambers'?.2:layer==='valves'?.12:.11):.16;
    projected.clippingPlanes=original.clippingPlanes;
    return projected;
  }
  // Segmentation-style view: atlas meshes in their label colour (segmentation-view.js).
  // Schematic overlays and devices are not part of the label map and keep their material.
  const labelMaterials = new Map();
  function labelMaterial(object){
    if(object.userData.provenance!=='atlas')return null;
    const label=segmentationLabelFor(object.userData.id);
    if(!label)return null;
    const original=object.material;
    let flat=labelMaterials.get(object);
    if(!flat){
      flat=new THREE.MeshStandardMaterial({color:label.color,roughness:1,metalness:0,side:THREE.DoubleSide});
      labelMaterials.set(object,flat);
    }
    flat.emissive.copy(original.emissive);
    flat.emissiveIntensity=original.emissiveIntensity;
    flat.opacity=original.opacity;
    flat.transparent=original.transparent;
    flat.depthWrite=original.depthWrite;
    flat.clippingPlanes=original.clippingPlanes;
    return flat;
  }
  const segmentationShown=()=>segmentation&&!fluoroscopy&&mode!=='micro';
  const drawn=mesh=>{for(let o=mesh;o;o=o.parent)if(!o.visible)return false;return true;};
  function updateSegmentationLegend(){
    if(!segLegend)return;
    segLegend.update(segmentationShown()?visibleSegmentationLabels(meshes.filter(m=>m.userData.provenance==='atlas'&&drawn(m)).map(m=>m.userData.id)):[]);
  }
  segLegend=createSegmentationLegend(container);
  function renderScene(){
    overlayFollow?.sync();
    septalDefects.updateLabels(camera);
    mitralScallops.update(camera,mitralFocus&&!fluoroscopy&&mode==='anatomy');
    sceneLabels.update(camera);
    updateRvotCap();
    rvThorax?.setVisible(fig3On());
    rvThorax?.setSliced(fig3Sliced());
    updateFig3Caps();
    if(fluoroscopy && mode!=='micro')renderSwapped(projectionMaterial);
    else if(segmentationShown())renderSwapped(labelMaterial);
    else renderer.render(scene,camera);
    updateContours();
  }
  function disposeScene(root){const materials=new Set(),geometries=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
  function setSegmentation(value){
    segmentation=Boolean(value);
    applyState();
  }
  function setFluoroscopy(value){
    fluoroscopy=Boolean(value);
    renderer.setClearColor(fluoroscopy?0xc9c9c9:0xffffff,fluoroscopy?1:0);
    renderer.toneMappingExposure=1.05;
    applyState();
  }
  return {ready,
    scene,
    setLayer(name,value){
      const boolVal = Boolean(value);
      visibility[name] = boolVal;
      if(name==='chambers')['lv','rv','la','ra'].forEach(id=>visibility[id]=boolVal);
      if(['lv','rv','la','ra','laa'].includes(name))visibility.chambers=true;
      if(name==='valves') setValveFamily(boolVal);
      if(name==='aortic-valve'){
        ['lcc','rcc','ncc'].forEach(id=>visibility[id]=boolVal);
        visibility.valves=true;
      }
      if(name==='papillary'){
        ['rv-papillary','lv-papillary'].forEach(id=>visibility[id]=boolVal);
        visibility.valves=true;
      }
      if(name==='veins')visibility.veins=boolVal;
      if(name==='conduction')visibility.conduction=boolVal;
      if(name==='icns'){
        visibility.icns=boolVal;
        ['vrasgp','vlasgp','ldsgp','mdsgp','drasgp','rcsgp','lcsgp','rsgp','pisgp'].forEach(id=>{visibility[id]=boolVal;});
      }
      if(['vrasgp','vlasgp','ldsgp','mdsgp','drasgp','rcsgp','lcsgp','rsgp','pisgp'].includes(name)){
        visibility[name]=boolVal;
        if(boolVal)visibility.icns=true;
      }
      applyState();
    },
    /** Restore the exact flags, including absence of per-structure overrides. */
    restoreLayerVisibility(saved){
      for(const key of Object.keys(visibility))delete visibility[key];
      Object.assign(visibility,saved);
      applyState();
      requestRender();
    },
    setValvesVisible(value){
      const boolVal = Boolean(value);
      visibility.valves = boolVal;
      setValveFamily(boolVal);
      applyState();
    },
    setVeinsVisible(value){
      const boolVal = Boolean(value);
      visibility.veins = boolVal;
      for (const id of VEIN_VISIBILITY_IDS) visibility[id] = boolVal;
      applyState();
    },
    setConductionVisible(value){visibility.conduction=Boolean(value);applyState();},
    setMode(name){
      mitralFocus=false;kochFocus=false;
      mode=name;
      septalDefects.group.visible=name==='defects';
      if(name==='defects'){cardiacCycle.setPlaying(false);beating=false;if(channels)channels.reset();}
      opacity=['angiography','ablation','pacemaker','transseptal','bachmann','cath','echo','tee','ice'].includes(name) ? LESSON_TISSUE_OPACITY : 1;
      epLandmarks.setVisible(name==='ablation');
      epZones.setVisible(name==='ablation');
      if(name!=='ablation')epZones.setZone(null);
      pacemakerLeads.setVisible(name==='pacemaker'||name==='bachmann');
      bachmannTargetGroup.visible=name==='bachmann';
      transseptal.setVisible(name==='transseptal');
      cathLab.setVisible(name==='cath');
      withRestPose(() => auscultation.setVisible(name==='exam'));
      catheterPickables=null;
      if(name==='ablation'){
        ablationStep=0;
        epLandmarks.setStep(0);
      }else if(name==='pacemaker'){
        pacemakerLeads.setStep(0);
        pacemakerLeads.setProgress(1.0);
      }else if(name==='bachmann'){
        pacemakerLeads.setBachmannStep(0);
        pacemakerLeads.setProgress(1);
      }else if(name==='transseptal'){
        transseptal.setStep(0);
        transseptal.setProgress(1.0);
      }else if(name==='cath'){
        cathLab.setStep(0);
        cathLab.setProgress(1.0);
      }
      applyState();
      requestRender();
    },
    setWallCut,
    setView,setAngioProjection,getAngioAngles,setFluoroscopy,
    setCoronaryContrast(value){coronaryContrast=THREE.MathUtils.clamp(Number(value)||0,0,1);requestRender();},
    /** Show a bypass graft ('lima' | 'svg-om' | 'svg-pda') or none (null). */
    setGraft(id){activeGraft=GRAFTS[id]?id:null;if(modelReady)grafts.setGraft(activeGraft);requestRender();},
    zoomIn,zoomOut,getZoomInfo,restoreCameraPose,
    /** Segmentation-style label colours on the atlas meshes; fluoroscopy takes precedence while it is on. */
    setSegmentation,
    getSegmentation(){return {on:segmentation,shown:segmentationShown(),labels:segLegend.keys()};},
    /** Fluoroscopic anatomy contours over the image (on by default while fluoroscopy is on). */
    setFluoroContours(on){fluoroContours=Boolean(on);contourKey='';requestRender();},
    getFluoroContours(){return {on:fluoroContours,visible:!contourCanvas.hidden,contours:lastContours.map(c=>({id:c.id,points:c.points.length,centroid:c.centroid}))};},selectStructure,clearSelection(){selectStructure(null,false);},
    setOpacity(value){opacity=THREE.MathUtils.clamp(Number(value),.08,1);applyState();},
    getOpacity:()=>opacity,
    setBeating(value){
      beating=mode==='defects'?false:Boolean(value);
      if(beating)lastAtrialPhase=null;   // the shared clock drives atria and ventricles together again
      cardiacCycle.setPlaying(beating);
      if(channels && mode!=='defects') channels.applyChannels(cardiacCycle.getCycleState());
      requestRender();
    },
    setBpm(value){cardiacCycle.setBpm(value);requestRender();},
    // Playback speed of the shared clock (slow motion in the venous pulse lesson).
    setCycleSpeed(value){cardiacCycle.setSpeed(value);requestRender();},
    setRhythm(name){cardiacCycle.setRhythm(name);requestRender();},
    // options.atrialPhase: the atria on their own clock (AV dissociation strip);
    // omitted, atria and ventricles share the phase.
    seekCycle(phase,options={}){
      cardiacCycle.seekCycle(phase);
      const state = Number.isFinite(options.atrialPhase) ? { ...cardiacCycle.getCycleState(), atrialPhase: options.atrialPhase } : cardiacCycle.getCycleState();
      lastAtrialPhase = Number.isFinite(options.atrialPhase) ? options.atrialPhase : null;
      if(channels && mode!=='defects') channels.applyChannels(state);
      if(bloodFlow && visibility.flow) bloodFlow.update(state);
      requestRender();
    },
    getCycleState(){return cardiacCycle.getCycleState();},
    /** Channel weights of the last applied pose (atrial and ventricular tension and size), for checks. */
    getBeatWeights(){const w=channels?.computeChannelWeights(cardiacCycle.getCycleState().phase,{rhythm:cardiacCycle.getCycleState().rhythm,atrialPhase:lastAtrialPhase??undefined});return w?{atrialContraction:w.atrialContraction,ventricularContraction:w.ventricularContraction,atrialShape:w.atrialShape,ventricularShape:w.ventricularShape,atrialPhase:lastAtrialPhase}:null;},
    // Echo module: atlas meshes by id, measurements at rest, overlays in heart coordinates.
    getMeshes(id){return meshMap.get(id)||[];},
    withRestPose,
    addOverlay(object){heart.add(object);requestRender();},
    // Camera square to a plane (echo imaging plane): on the side of the current camera, framing depth units.
    lookAlong(origin,normal,beam,depth){
      const n=new THREE.Vector3(...normal),centre=new THREE.Vector3(...origin).addScaledVector(new THREE.Vector3(...beam),depth/2);
      if(camera.position.clone().sub(centre).dot(n)<0)n.negate();
      lookTarget.copy(centre);cameraTarget.copy(centre).addScaledVector(n,Math.max(3,depth*1.9));
      transition=true;container.dataset.cameraSettled='false';emitAngleChange();requestRender();
    },
    requestRender,
    setVentricleRegions(on){ventricleRegions=Boolean(on);applyState();requestRender();},
    /** RVOT superior section in the RV mode (Miyazaki 2026 / Aronis 2026). */
    setRvotSection(on,{view=true}={}){rvotSection=Boolean(on);rvotCamera='superior';if(rvotSection){rvFig2=false;rvFig3=false;}if(!rvotSection)rvotSegment=null;paintRvot();applyState();updateRvotCap(true);if(rvotSection&&view)setView('rvot');requestRender();},
    /** Miyazaki 2026 Figure 2 view in the RV mode: free wall opened, anterior view. */
    setRvFigure2(on,{view=true}={}){rvFig2=Boolean(on);if(rvFig2){rvotSection=false;rvotSegment=null;rvFig3=false;}setWallCut('rv',rvFig2?.45:0);paintRvot();applyState();if(rvFig2&&view){
      // Anterior view of the opened RV, as Figure 2 (superior up, patient left on the right).
      const target=sourceCenter('rv');
      if(target){lookTarget.copy(target);cameraTarget.copy(target).add(new THREE.Vector3(.4,.35,5.3));transition=true;container.dataset.cameraSettled='false';emitAngleChange();}
    }requestRender();},
    getRvFigure2(){const counts={};if(rvFig2Data)rvFig2Data.byVertex.forEach(k=>{const id=rvFig2Data.ids[k];counts[id]=(counts[id]||0)+1;});return {on:fig2On(),ready:Boolean(rvFig2Data),counts,wallCut:wallCuts.rv};},
    /** Miyazaki 2026 Figure 3A-B view in the RV mode: thorax electrodes and outflow axes. */
    setRvFigure3(on,{view=true}={}){rvFig3=Boolean(on);fig3Level=null;if(rvFig3){rvotSection=false;rvotSegment=null;rvFig2=false;setWallCut('rv',0);}paintRvot();applyState();if(rvFig3&&view)setView('anterior');requestRender();},
    getRvFigure3(){return {on:fig3On(),ready:Boolean(rvThorax),measures:rvThorax?.measures||null,level:fig3Level,levels:fig3Levels?{root:fig3Levels.root,high:fig3Levels.high,low:fig3Levels.low}:null,caps:fig3Caps?.getSummary()||null};},
    /** Figure 3C axial level ('root' | 'high' | 'low') seen from above, or null for the anterior view. */
    setRvFigure3Level(level){
      fig3Level=fig3Levels&&['root','high','low'].includes(level)?level:null;
      if(fig3Level)fig3Plane.constant=fig3Levels[fig3Level];
      applyState();updateFig3Caps(true);
      if(fig3Level){
        // From above and slightly behind: anterior at the top, the patient's right on the right (Figure 3C).
        const target=fig3Levels.centre.clone();target.y=fig3Levels[fig3Level];
        lookTarget.copy(target);cameraTarget.copy(target).add(new THREE.Vector3(0,5.4,-1.3));transition=true;container.dataset.cameraSettled='false';emitAngleChange();
      }else setView('anterior');
      requestRender();
    },
    /** Posterior free wall of the RVOT: 'present' (elevated infundibulum) or 'absent' (Miyazaki Figs. 10-12). */
    setRvotVariant(value){rvotVariant=value==='absent'?'absent':'present';paintRvot();updateRvotCap(true);requestRender();},
    /** RVOT section camera: 'superior' (Figs. 4, 11C, 12C) or 'posterior' (Figs. 11-12 A-B). */
    setRvotCamera(view){
      if(!rvotData)return;
      rvotCamera=view==='posterior'?'posterior':'superior';rvotPaTrim.constant=rvotData.frame.centre.y+.35;applyState();updateRvotCap(true);
      if(view!=='posterior'){setView('rvot');return;}
      const {cutPoint}=rvotData.frame;
      lookTarget.copy(cutPoint);cameraTarget.copy(cutPoint).add(new THREE.Vector3(.2,.2,-4.4));transition=true;container.dataset.cameraSettled='false';emitAngleChange();requestRender();
    },
    setRvotSegment(id){rvotSegment=rvotData?.ids.includes(id)&&id!=='other'?id:null;paintRvot();updateRvotCap(true);requestRender();},
    getRvotSection(){const counts={};if(rvotData)rvotData.byVertex.forEach(k=>{const id=rvotData.ids[k];counts[id]=(counts[id]||0)+1;});const f=rvotData?.frame;return {on:rvotOn(),ready:Boolean(rvotData),segment:rvotSegment,variant:rvotVariant,counts,anchors:f?.anchors||null,cap:rvotCap?.getSummary()||null};},
    getVentricleRegions(){return ventricleRegions;},
    // Test hook: client coordinates of a scene point (pick tests).
    screenPoint(point){const v=new THREE.Vector3(...point).project(camera),r=renderer.domElement.getBoundingClientRect();return {x:r.left+(v.x+1)/2*r.width,y:r.top+(1-v.y)/2*r.height,inFront:v.z<1};},
    // Diagnostics for the beat tests: overlays currently bound to the beating heart.
    overlayFollowCount(){return overlayFollow?.recordCount() ?? 0;},
    atlasAdjustments(){return {...atlasAdjustments};},
    subscribeCycle(listener){return cardiacCycle.subscribeCycle(listener);},
    setFlowVisible(value){
      visibility.flow = Boolean(value);
      applyState();
      requestRender();
    },
    getFlowVisible(){
      return Boolean(visibility.flow);
    },
    setFlowLowPower(value){
      if(bloodFlow) bloodFlow.setLowPower(value);
      requestRender();
    },
    setReducedMotion(value){
      const val = Boolean(value);
      cardiacCycle.setReducedMotion(val);
      if(bloodFlow) bloodFlow.setLowPower(val);
      if(channels && mode!=='defects') channels.applyChannels(cardiacCycle.getCycleState());
      requestRender();
    },
    setAblationStep(step){ablationStep=Number(step);epLandmarks.setStep(ablationStep);requestRender();},
    // Koch step layers: 'his' and 'cs' reference catheters, 'lesions' (example RF, off by default).
    setEpOptional(key,value){epLandmarks.setOptional(key,value);catheterPickables=null;requestRender();},
    // Accessory pathway zone of the ablation lesson step (ep-zones.js); null hides it.
    setEpZone(zoneId){epZones.setZone(zoneId||null);requestRender();},
    getEpZone(){return epZones.getZone();},
    getEpOptional(){return epLandmarks.getOptional();},
    // Slow pathway catheter tip on the Koch triangle, site { u, v } (koch-sp-model.js).
    setKochTip(site){epLandmarks.setKochTip(site);catheterPickables=null;requestRender();},
    getKochTip(){return epLandmarks.getKochTip();},
    // Scene identity labels: 'hover' (on demand, default) or 'all'.
    setSceneLabelMode(value){sceneLabels.setMode(value);requestRender();},
    getSceneLabelMode(){return sceneLabels.getMode();},
    setPacemakerStep(step){pacemakerLeads.setStep(Number(step));requestRender();},
    setBachmannStep(step){pacemakerLeads.setBachmannStep(Number(step));requestRender();},
    setTransseptalStep(step){transseptal.setStep(Number(step));requestRender();},
    setCathStep(step){cathLab.setStep(Number(step));requestRender();},
    highlightAuscultation(areaId){auscultation.highlight(areaId||null);requestRender();},
    /** Auscultation markers: highlighted area and world positions (tests, lesson checks). */
    getAuscultation(){return {highlighted:auscultation.getHighlighted(),positions:Object.fromEntries(Object.entries(auscultation.positions()).map(([id,p])=>[id,p.toArray()]))};},
    setCatheterVisible(key,value){transseptal.setCatheterVisible(key,Boolean(value));requestRender();},
    getCatheterVisibility(){return transseptal.getCatheterVisibility();},
    resetCatheterToggles(){transseptal.resetCatheterToggles();requestRender();},
    setProgress(value){if(mode==='cath'){cathLab.setProgress(Number(value));requestRender();return;}if(mode==='transseptal')transseptal.setProgress(Number(value));else pacemakerLeads.setProgress(Number(value));requestRender();},
    setCoronarySystem(value){system=['all','both','left','right'].includes(value)?value:'all';applyState();},
    setRootWindow(value){rootWindow=Boolean(value);applyState();},
    reset(){
      septalDefects.group.visible=false;septalDefects.select(DEFECT_IDS[0]);
      beating=false;
      cardiacCycle.setPlaying(false);
      cardiacCycle.seekCycle(0);
      cardiacCycle.setBpm(72);
      cardiacCycle.setRhythm('sinus');
      if(channels) channels.reset();
      if(bloodFlow){
        bloodFlow.setLowPower(false);
        bloodFlow.setVisible(false);
        bloodFlow.update(cardiacCycle.getCycleState());
      }
      epLandmarks.setVisible(false);
      epZones.setVisible(false);
      epZones.setZone(null);
      pacemakerLeads.setVisible(false);
      bachmannTargetGroup.visible=false;
      transseptal.setVisible(false);
      cathLab.setVisible(false);
      rootWindow=false;
      system='all';
      fluoroscopy=false;
      coronaryContrast=1;
      segmentation=false;
      applyLayerDefaults(visibility);
      for(const id in wallCuts){
        wallCuts[id]=0;
        updateWallPlane(id);
      }
      renderer.setClearColor(0xffffff,0);
      renderer.toneMappingExposure=1.05;
      applyState();
      setView('anterior');
      requestRender();
    },
    getState(){return {defects:septalDefects.getState(),mitralFocus,kochFocus,mode,graft:activeGraft,system,rootWindow,fluoroscopy,segmentation,visibility:{...visibility},valves:visibility.valves,veins:visibility.veins,conduction:visibility.conduction,flow:Boolean(visibility.flow),bloodFlowLowPower:bloodFlow?bloodFlow.getLowPower():false,angio:getAngioAngles(),wallCuts:{...wallCuts},selected,normalization:{center:center.toArray(),scale},structures:meshes.filter(m=>!m.userData.micro).map(m=>({name:m.name,id:m.userData.leaflet?m.userData.id+'-'+m.userData.leaflet:m.userData.id,valveId:m.userData.id,layer:m.userData.layer,provenance:m.userData.provenance||(m.userData.layer==='conduction'?'schematic':'atlas'),visible:m.visible,vertices:m.geometry.attributes.position.count,bounds:{min:new THREE.Box3().setFromObject(m).min.toArray(),max:new THREE.Box3().setFromObject(m).max.toArray()},clipping:m.material.clippingPlanes?m.material.clippingPlanes.length:0,matrix:m.matrixWorld.toArray()}))};},
    dispose(){septalDefects.dispose();mitralScallops.dispose();sceneLabels.dispose();disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();decoder.dispose();for(const [event,handler] of [['pointermove',pointerMove],['pointerdown',pointerDown],['pointerup',pointerUp],['pointerleave',pointerLeave]])renderer.domElement.removeEventListener(event,handler);for(const mat of projectionMaterials.values())mat.dispose();projectionMaterials.clear();for(const mat of labelMaterials.values())mat.dispose();labelMaterials.clear();segLegend.dispose();if(bloodFlow)bloodFlow.dispose();disposeScene(scene);renderer.dispose();renderer.domElement.remove();loading.remove();}
  };
}

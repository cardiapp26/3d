import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { ATLAS_URL, normalizedParts, normalizeAtlasName } from './atlas.js';
import { createEPLandmarks } from './ep-landmarks.js';
import { createPacemakerLeads } from './pacemaker-leads.js';
import { createAnnuli } from './annuli.js';
import { addSchematicAvLeaflets } from './schematic-leaflets.js';
import { addLaaMarker } from './la-landmarks.js';
import { createAuscultationMarkers } from './auscultation-points.js';
import { createThorax } from './thorax.js';
import { createTransseptal } from './transseptal.js';
import { createCathLab } from './cath-lab.js';
import { createBachmannGeometry } from './bachmann.js';
import { createCardiacCycle } from './cardiac-cycle.js';
import { createAnimationChannels } from './animation-channels.js';
import { createBloodFlow } from './blood-flow.js';
import { measuredFlowRoutes } from './flow-routes.js';
import { vesselTrimPlane, sharedRim, septalPairs, septalSiteNear, hisBundleEnd } from './mesh-utils.js';
import { applyLayerDefaults, LEAFLET_VISIBILITY_IDS, LESSON_TISSUE_OPACITY, VEIN_VISIBILITY_IDS } from './layer-defaults.js';

// All reference anatomy is loaded from one local atlas and shares one normalization.
export function createHeart(container, onSelect = () => {}, onHover = () => {}, onAngleChange = () => {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .05, 100);
  camera.position.set(0, .5, 9.3);
  const headlight = new THREE.PointLight(0xfff8ee, 2.2, 16, 1.2);
  camera.add(headlight);
  scene.add(camera);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
  function requestRender() { needsRender = true; }
  controls.addEventListener('change', () => { needsRender = true; });
  scene.add(new THREE.HemisphereLight(0xffffff, 0x65524c, 2.1));
  for (const [position, color, intensity] of [[[3,5,6],0xfff3e6,2.6],[[-5,2,1],0xdaeaf4,.9],[[1,4,-4],0xffffff,1.3]]) {
    const light = new THREE.DirectionalLight(color,intensity); light.position.set(...position); scene.add(light);
  }
  const heart = new THREE.Group(); scene.add(heart);
  const layers = Object.fromEntries(['chambers','vessels','coronaries','valves','conduction','flow'].map(id=>{const g=new THREE.Group();heart.add(g);return [id,g];}));
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
  let channels = null, bloodFlow = null;
  let fluoroscopy=false, lastEmittedKey='';
  let center=new THREE.Vector3(), scale=1, frame, down=null, transition=false;
  const cameraTarget=camera.position.clone(), lookTarget=new THREE.Vector3();
  let rootHeight=.7;
  const wallCuts={lv:0,rv:0,la:0,ra:0};
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
  let modelReady=false;
  const isReady=()=>modelReady;
  const epLandmarks = createEPLandmarks({ sourceCenter, meshVertices, getMeshes:(id)=>meshMap.get(id)||[], isReady });
  heart.add(epLandmarks.group);
  let bachmannTarget = null;
  const pacemakerLeads = createPacemakerLeads({ sourceCenter, meshVertices, getMeshes:(id)=>meshMap.get(id)||[], getBachmannTarget: () => bachmannTarget, isReady });
  heart.add(pacemakerLeads.group);
  function computeVesselTrims(){
    const verts=name=>{const m=meshes.find(x=>x.name===name);if(!m)return[];m.updateWorldMatrix(true,false);const p=m.geometry.attributes.position;const out=[];for(let i=0;i<p.count;i++)out.push(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld));return out;};
    const bifurcation=sourceCenter('pa')||new THREE.Vector3(0.07,1.5,-0.42);
    const bif=verts('Bifurcation of pulmonary trunk');
    const bifCenter=bif.length?bif.reduce((a,v)=>a.add(v),new THREE.Vector3()).multiplyScalar(1/bif.length):bifurcation;
    const la=sourceCenter('la')||new THREE.Vector3(-0.05,0.27,-0.37);
    // LPA: keep the arch over the left bronchus (~4 cm), drop the lower-lobe run.
    const lpa=vesselTrimPlane(verts('Left pulmonary artery'),bifCenter,1.1);
    if(lpa)vesselTrims.set('Left pulmonary artery',lpa);
    // RSPV: keep a stump comparable to the other pulmonary veins.
    const rspv=vesselTrimPlane(verts('Right superior pulmonary vein'),la,0.55);
    if(rspv)vesselTrims.set('Right superior pulmonary vein',rspv);
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
  const auscultation = createAuscultationMarkers({ sourceCenter, meshVertices });
  heart.add(auscultation.group);
  const cathLab = createCathLab({ sourceCenter, meshVertices, getMeshes:(id)=>meshMap.get(id)||[], getVesselTrim:(name)=>vesselTrims.get(name)||null, isReady });
  heart.add(cathLab.group);
  const annuli = createAnnuli({ sourceCenter, register, meshVertices, getMeshes:(id)=>meshMap.get(id)||[] });
  const thorax = createThorax({ sourceCenter, register });
  heart.add(thorax.group);
  layers.valves.add(annuli.group);
  function applyState(){
    layers.conduction.visible = visibility.conduction !== false;
    layers.flow.visible = Boolean(visibility.flow) && mode !== 'micro';
    if(bloodFlow) bloodFlow.setVisible(layers.flow.visible);
    for(const m of meshes){
      if(m.userData.micro)continue;
      const {id,layer,system:branch}=m.userData;
      const isVein = branch === 'veins' || ['svc', 'ivc', 'pv', 'cs', 'gcv', 'mcv', 'piv', 'lspv', 'lipv', 'rspv', 'ripv', 'cardiac-veins'].includes(id);
      if (!visibility.veins && isVein) {
        m.visible = false;
        continue;
      }
      if (layer === 'conduction') {
        m.visible = visibility.conduction !== false && visibility[id] !== false;
        continue;
      }
      if (layer === 'thorax') {
        // Schematic scenery keeps its own authored transparency.
        m.visible = visibility.thorax !== false && visibility[id] !== false;
        continue;
      }
      const allowed=system==='all'||(branch&&branch!=='veins'&&(system==='both'||system===branch))||id==='aorta'||layer==='valves'||layer==='chambers'||branch==='veins'||layer==='vessels';
      const leafletKey=m.userData.leaflet?`${id}-${m.userData.leaflet}`:null;
      m.visible=visibility[layer]!==false&&visibility[id]!==false&&(!m.userData.veinGroup||visibility[m.userData.veinGroup]!==false)&&(!leafletKey||visibility[leafletKey]!==false)&&allowed;
      const tissue=layer==='chambers';
      // Catheters run inside these vessels in the transseptal lesson; keep them
      // see-through. The pulmonary trunk and bifurcation sit on the LA roof in
      // front of the fossa in LAO/RAO, so they are faded there too.
      const catheterVessel=(mode==='transseptal'&&['aorta','pa','cs','svc','ivc'].includes(id))||(['cath','hemodynamics'].includes(mode)&&['aorta','pa','svc','ivc'].includes(id));
      const roofContext=mode==='bachmann'&&(layer==='vessels'||layer==='coronaries');
      const faintPa=visibility['pa-faint']&&id==='pa';
      const alpha=tissue?opacity:faintPa?.22:roofContext?.14:catheterVessel?.28:(id==='aorta'&&rootWindow?.22:1);
      m.material.opacity=alpha;m.material.transparent=alpha<1;m.material.depthWrite=alpha>=.95;
      m.material.clippingPlanes=vesselTrims.has(m.name)?[vesselTrims.get(m.name)]:id==='aorta'&&rootWindow?[rootPlane]:id==='ivc'?[ivcPlane]:wallCuts[id]>0&&wallPlanes.has(id)?[wallPlanes.get(id).plane]:[];
      if(layer==='coronaries'){
        m.material.roughness=0.65;
        m.material.metalness=0;
      }
    }
    heart.visible=mode!=='micro';micro.visible=mode==='micro';
    paintSelection();
    requestRender();
  }
  function paintSelection(){
    for(const m of meshes){
      const shown=m.userData.leaflet?m.userData.id+'-'+m.userData.leaflet:m.userData.id;
      const isSelected=shown===selected||m.userData.id===selected,isHovered=shown===hovered;
      if(m.userData.layer==='conduction'){
        m.material.emissiveIntensity=isSelected?1.2:isHovered?1.0:0.75;
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
  function selectStructure(id,flyTo=true){selected=id;paintSelection();if(flyTo){const p=sourceCenter(id);if(p){const offset=camera.position.clone().sub(controls.target);offset.setLength(['lm','lcc','rcc','ncc','mitral','tricuspid','mitral-posterior','mitral-anterior','tricuspid-septal','tricuspid-inferior','tricuspid-anterior','sa','av','his','laa'].includes(id)?3.1:6.5);lookTarget.copy(p);cameraTarget.copy(p).add(offset);transition=true;container.dataset.cameraSettled='false';requestRender();}}}

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
      const mesh=new THREE.Mesh(geometry,material(part.color));mesh.name=part.sourceName;mesh.userData={...part, provenance: 'atlas'};layers[part.layer].add(mesh);register(mesh,part.id);
    }
    disposeScene(gltf.scene);decoder.dispose();
    const lmCenter=sourceCenter('lm'),rccCenter=sourceCenter('rcc');
    rootHeight=Math.max(lmCenter?.y??.6,rccCenter?.y??.6)+.13;rootPlane.constant=rootHeight;
    ivcPlane.constant=-(chamberBounds.min.y-center.y)*scale+.45;
    initializeWallPlanes();
    buildConductionSystem();
    annuli.build();
    addSchematicAvLeaflets({ getMeshes: id => meshMap.get(id) || [], register, parent: layers.valves });
    addLaaMarker({ meshVertices, register, parent: layers.chambers });
    thorax.build();
    computeVesselTrims();
    modelReady=true;
    epLandmarks.init();
    pacemakerLeads.init();
    transseptal.init();
    cathLab.init();
    catheterPickables=null;
    channels = createAnimationChannels({ meshMap, sourceCenter });
    bloodFlow = createBloodFlow({ resolveRoutes: () => measuredFlowRoutes({ sourceCenter, meshVertices, getMeshes: id => meshMap.get(id) || [], getVesselTrim: name => vesselTrims.get(name) || null }) });
    layers.flow.add(bloodFlow.group);
    applyState();computeFit();setView('anterior',false);loading.remove();container.dataset.modelReady='true';
    container.dataset.meshCount=String(found.length);
    return {count:found.length,normalization:{center:center.toArray(),scale},source:ATLAS_URL};
  }).catch(error=>{loading.textContent='Anatomical asset could not load. Reload to retry; no substitute geometry is shown.';decoder.dispose();throw error;});

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

    const bachmann = createBachmannGeometry(meshVertices);
    bachmannTarget = bachmann.target;
    const bandMaterial = matPath.clone();
    bandMaterial.color.setHex(0xf6b64b);
    bandMaterial.side = THREE.DoubleSide;
    const band = new THREE.Mesh(bachmann.geometry, bandMaterial);
    band.name = "Bachmann's bundle (schematic atrial roof band)";
    band.userData = {id:'bachmann', layer:'conduction', provenance:'schematic', bandAnchor:bachmann.bandAnchor.toArray(), pacingTarget:bachmann.target.toArray()};
    conductionGroup.add(band);
    register(band, 'bachmann');

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

    // 4. Bundle of His penetrating central fibrous body into interventricular septum.
    // Its distal (branching) end is measured on the crest of the muscular
    // septum under the NCC/RCC commissure, 1-2 cm from the AV node; the LBB
    // trunk runs ~1.3 cm on toward the apex and ends in LV subendocardium.
    // The AV node and Koch's triangle above are unchanged.
    const rvVerts = meshVertices('rv');
    const septum = septalPairs(rvVerts, meshVertices('lv'));
    const nccCenter = sourceCenter('ncc'), rccCenter = sourceCenter('rcc');
    const commissure = nccCenter && rccCenter ? nccCenter.clone().lerp(rccCenter, 0.5) : null;
    const hisSeptum = (commissure && hisBundleEnd(septum, avCenter, commissure)) || new THREE.Vector3(-0.10, -0.32, 0.06);
    const rvApex = rvVerts.length ? rvVerts.reduce((b, v) => v.y < b.y ? v : b).clone() : null;
    const lbbSite = rvApex ? septalSiteNear(septum, hisSeptum.clone().add(rvApex.clone().sub(hisSeptum).setLength(0.35))) : null;
    // Penetrating His: through the central fibrous body toward the crest of
    // the muscular septum.
    const hisPenetrating = avCenter.clone().lerp(hisSeptum, .45).add(new THREE.Vector3(0, -.04, .02));
    makeTract([
      avCenter.clone(),
      hisPenetrating,
      hisSeptum.clone()
    ], 0.024, 'his', 'Bundle of His');

    // 5. Right Bundle Branch (RBB)
    makeTract([
      hisSeptum.clone(),
      new THREE.Vector3(-0.06, -0.52, 0.22),
      new THREE.Vector3(0.04, -0.78, 0.42),
      new THREE.Vector3(0.14, -1.02, 0.52),
      new THREE.Vector3(0.18, -0.65, 0.72)
    ], 0.018, 'his', 'Right bundle branch');

    // 6. Left Bundle Branch (LBB) trunk & fascicles
    const lbbStart = lbbSite ? lbbSite.lvSide.clone().lerp(lbbSite.rvSide, 0.1) : new THREE.Vector3(0.05, -0.42, 0.05);
    makeTract([
      hisSeptum.clone(),
      lbbStart.clone()
    ], 0.022, 'his', 'Left bundle branch trunk');

    makeTract([
      lbbStart.clone(),
      new THREE.Vector3(0.25, -0.60, 0.22),
      new THREE.Vector3(0.50, -0.85, 0.26),
      new THREE.Vector3(0.72, -0.72, 0.28)
    ], 0.016, 'his', 'LBB Anterior fascicle');

    makeTract([
      lbbStart.clone(),
      new THREE.Vector3(0.28, -0.55, -0.10),
      new THREE.Vector3(0.52, -0.78, -0.12),
      new THREE.Vector3(0.85, -0.72, 0.05)
    ], 0.017, 'his', 'LBB Posterior fascicle');

    // 7. Purkinje subendocardial arborizations
    const purkinjeBranches = [
      [new THREE.Vector3(0.14, -1.02, 0.52), new THREE.Vector3(0.08, -1.22, 0.35), new THREE.Vector3(0.18, -1.28, 0.22)],
      [new THREE.Vector3(0.50, -0.85, 0.26), new THREE.Vector3(0.42, -1.15, 0.18), new THREE.Vector3(0.32, -1.25, 0.10)],
      [new THREE.Vector3(0.52, -0.78, -0.12), new THREE.Vector3(0.60, -1.05, -0.05), new THREE.Vector3(0.48, -1.22, 0.02)]
    ];
    purkinjeBranches.forEach((pts, i) => {
      makeTract(pts, 0.011, 'his', `Purkinje network branch ${i+1}`);
    });
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

  function setView(name,smooth=true){
    if(angioPresets[name]){
      setAngioProjection(angioPresets[name].laoRao,angioPresets[name].craCau,smooth,false);
      return;
    }
    const root=sourceCenter('lm')||new THREE.Vector3(0,.6,0);
    const target=name==='root'?root:fitCenter.clone();
    const offsets={anterior:[0,.1,9.3],posterior:[0,.1,-9.3],rao:[-6.6,.3,6.6],lao:[6.6,.3,6.6],root:[.2,3.7,1.4]};
    cameraTarget.copy(target).add(new THREE.Vector3(...(offsets[name]||offsets.anterior)));lookTarget.copy(target);
    if(name==='root'){rootWindow=true;applyState();}
    transition=smooth;container.dataset.cameraSettled=String(!smooth);if(!smooth){camera.position.copy(cameraTarget);controls.target.copy(lookTarget);controls.update();}
    emitAngleChange();
  }
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  let catheterPickables=null;
  function pickTargets(){
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
  function pick(e){const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(pickTargets()).filter(h=>{for(let p=h.object;p;p=p.parent)if(!p.visible)return false;return !(h.object.material.clippingPlanes||[]).some(p=>p.distanceToPoint(h.point)<0);});
    // See-through tissue (opacity < .5) should not swallow clicks aimed at
    // devices or solid structures behind it.
    for(const h of hits){
      if(h.object.userData.pickId)return h.object.userData.pickId;
      if((h.object.material.opacity??1)>=0.5)return shownStructureId(h.object);
    }
    return hits[0]?shownStructureId(hits[0].object):null;
  }
  function pointerMove(e){hovered=pick(e);paintSelection();renderer.domElement.style.cursor=hovered?'pointer':'grab';onHover(hovered);}
  function pointerDown(e){transition=false;down=[e.clientX,e.clientY];}
  function pointerUp(e){if(!down)return;const click=Math.hypot(e.clientX-down[0],e.clientY-down[1])<6;down=null;if(click){const id=pick(e);if(id)onSelect(id);}}
  function pointerLeave(){hovered=null;down=null;paintSelection();onHover(null);}
  renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointerleave',pointerLeave);
  const resize=()=>{const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();computeFit();requestRender();};
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  let lastTime = performance.now();
  function animate(now){
    frame=requestAnimationFrame(animate);
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
    if(controls.update()){
      needsRender=true;
    }
    container.dataset.cameraSettled=String(!transition);
    emitAngleChange();
    if(needsRender){
      renderScene();
      if(!transition&&(!cycleState.playing||mode==='micro'))needsRender=false;
    }
  }frame=requestAnimationFrame(animate);
  // Educational projection: layer attenuation, not a simulated diagnostic radiograph.
  // Swap only during rendering so selection, lesson updates and resets retain originals.
  const projectionMaterials = new Map();
  function renderScene(){
    if(!fluoroscopy || mode==='micro'){renderer.render(scene,camera);return;}
    const originals=[];
    heart.traverseVisible(object=>{
      if(!object.isMesh || Array.isArray(object.material))return;
      const original=object.material;
      const layer=object.userData.layer;
      const atlas=object.userData.provenance==='atlas';
      const contrast=atlas && layer==='coronaries' && mode==='angiography';
      let device=false;
      let schematicTissue=false;
      let deviceTint=null;
      for(let parent=object.parent;parent;parent=parent.parent){
        if(parent.userData.projectionTissue)schematicTissue=true;
        if(deviceTint===null && parent.userData.fluoroTint!=null)deviceTint=parent.userData.fluoroTint;
        if(parent===pacemakerLeads.group || parent===transseptal.group || parent===cathLab.group){device=true;break;}
      }
      device=device && !schematicTissue && !original.isMeshBasicMaterial;
      let projected=projectionMaterials.get(object);
      if(!projected){
        projected=new THREE.MeshBasicMaterial({transparent:true,premultipliedAlpha:true,depthWrite:false,depthTest:false,side:THREE.FrontSide,toneMapped:false,blending:THREE.MultiplyBlending});
        projectionMaterials.set(object,projected);
      }
      projected.color.setHex(device?(deviceTint??0x202020):contrast?0x303030:0x6a6a6a);
      projected.opacity=device?(original.transparent?Math.min(.85,original.opacity+.15):.95):contrast?.8:atlas?(layer==='chambers'?.2:layer==='valves'?.12:.11):.16;
      projected.clippingPlanes=original.clippingPlanes;
      originals.push([object,original]);
      object.material=projected;
    });
    try{renderer.render(scene,camera);}finally{for(const [object,original] of originals)object.material=original;}
  }
  function disposeScene(root){const materials=new Set(),geometries=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
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
      if(valveIds.includes(name))visibility.valves=true;
      if(name==='veins')visibility.veins=boolVal;
      if(name==='conduction')visibility.conduction=boolVal;
      applyState();
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
      mode=name;
      opacity=['angiography','ablation','pacemaker','transseptal','bachmann','cath','hemodynamics'].includes(name) ? LESSON_TISSUE_OPACITY : 1;
      epLandmarks.setVisible(name==='ablation');
      pacemakerLeads.setVisible(name==='pacemaker'||name==='bachmann');
      transseptal.setVisible(name==='transseptal');
      cathLab.setVisible(name==='cath'||name==='hemodynamics');
      auscultation.setVisible(name==='exam');
      catheterPickables=null;
      if(name==='ablation'){
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
      }else if(name==='cath'||name==='hemodynamics'){
        cathLab.setStep(0);
        cathLab.setProgress(1.0);
      }
      applyState();
      requestRender();
    },
    setWallCut,
    setView,setAngioProjection,getAngioAngles,setFluoroscopy,selectStructure,clearSelection(){selectStructure(null,false);},
    setOpacity(value){opacity=THREE.MathUtils.clamp(Number(value),.08,1);applyState();},
    setBeating(value){
      beating=Boolean(value);
      cardiacCycle.setPlaying(beating);
      if(channels) channels.applyChannels(cardiacCycle.getCycleState());
      requestRender();
    },
    setBpm(value){cardiacCycle.setBpm(value);requestRender();},
    setRhythm(name){cardiacCycle.setRhythm(name);requestRender();},
    seekCycle(phase){
      cardiacCycle.seekCycle(phase);
      const state = cardiacCycle.getCycleState();
      if(channels) channels.applyChannels(state);
      if(bloodFlow && visibility.flow) bloodFlow.update(state);
      requestRender();
    },
    getCycleState(){return cardiacCycle.getCycleState();},
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
      if(channels) channels.applyChannels(cardiacCycle.getCycleState());
      requestRender();
    },
    setAblationStep(step){epLandmarks.setStep(Number(step));requestRender();},
    setPacemakerStep(step){pacemakerLeads.setStep(Number(step));requestRender();},
    setBachmannStep(step){pacemakerLeads.setBachmannStep(Number(step));requestRender();},
    setTransseptalStep(step){transseptal.setStep(Number(step));requestRender();},
    setCathStep(step){cathLab.setStep(Number(step));requestRender();},
    highlightAuscultation(areaId){auscultation.highlight(areaId||null);requestRender();},
    setCatheterVisible(key,value){transseptal.setCatheterVisible(key,Boolean(value));requestRender();},
    getCatheterVisibility(){return transseptal.getCatheterVisibility();},
    resetCatheterToggles(){transseptal.resetCatheterToggles();requestRender();},
    setProgress(value){if(mode==='cath'||mode==='hemodynamics'){cathLab.setProgress(Number(value));requestRender();return;}if(mode==='transseptal')transseptal.setProgress(Number(value));else pacemakerLeads.setProgress(Number(value));requestRender();},
    setCoronarySystem(value){system=['all','both','left','right'].includes(value)?value:'all';applyState();},
    setRootWindow(value){rootWindow=Boolean(value);applyState();},
    reset(){
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
      pacemakerLeads.setVisible(false);
      transseptal.setVisible(false);
      cathLab.setVisible(false);
      rootWindow=false;
      system='all';
      fluoroscopy=false;
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
    getState(){return {mode,system,rootWindow,fluoroscopy,visibility:{...visibility},valves:visibility.valves,veins:visibility.veins,conduction:visibility.conduction,flow:Boolean(visibility.flow),bloodFlowLowPower:bloodFlow?bloodFlow.getLowPower():false,angio:getAngioAngles(),wallCuts:{...wallCuts},selected,normalization:{center:center.toArray(),scale},structures:meshes.filter(m=>!m.userData.micro).map(m=>({name:m.name,id:m.userData.leaflet?m.userData.id+'-'+m.userData.leaflet:m.userData.id,valveId:m.userData.id,layer:m.userData.layer,provenance:m.userData.provenance||(m.userData.layer==='conduction'?'schematic':'atlas'),visible:m.visible,vertices:m.geometry.attributes.position.count,bounds:{min:new THREE.Box3().setFromObject(m).min.toArray(),max:new THREE.Box3().setFromObject(m).max.toArray()},clipping:m.material.clippingPlanes?m.material.clippingPlanes.length:0,matrix:m.matrixWorld.toArray()}))};},
    dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();decoder.dispose();for(const [event,handler] of [['pointermove',pointerMove],['pointerdown',pointerDown],['pointerup',pointerUp],['pointerleave',pointerLeave]])renderer.domElement.removeEventListener(event,handler);for(const mat of projectionMaterials.values())mat.dispose();projectionMaterials.clear();if(bloodFlow)bloodFlow.dispose();disposeScene(scene);renderer.dispose();renderer.domElement.remove();loading.remove();}
  };
}

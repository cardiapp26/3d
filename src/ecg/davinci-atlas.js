import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { ATLAS_URL, normalizedParts, normalizeAtlasName } from '../atlas.js';
import { CABRERA, CHEST, SITES, PV_SITES } from './davinci-model.js';
import { buildArchBranches } from '../aortic-arch-branches.js';
import { pulmonaryBranchTrims } from '../pulmonary-trims.js';

export function createDavinciAtlas({getLang,onSelect}) {
 const element=document.createElement('div');element.className='da-atlas';
 const host=document.createElement('div');host.className='da-webgl';
 const labels=document.createElement('div');labels.className='da-labels';labels.setAttribute('aria-hidden','true');
 const status=document.createElement('p');status.className='da-load';status.setAttribute('role','status');
 element.append(host,labels,status);
 const tr=(a,b)=>getLang()==='en'?b:a;
 let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{
  status.textContent=tr('3D görünüm açılamadı. Yan taraftaki kaynak bağlantılı şemalar ve kontroller kullanılabilir.','3D view unavailable. Source-linked diagrams and controls remain available.');
  return {element,update(){},view(){},snapshot(){return null;},isReady:()=>false,destroy(){element.remove();}};
 }
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x0a1520,0);
 renderer.localClippingEnabled=true;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;host.append(renderer.domElement);
 renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label',tr('Döndürülebilir 3D kalp ve elektrotlar. Aynı seçimler yan taraftaki düğmelerle yapılabilir.','Rotatable 3D heart and electrodes. Equivalent selections are available through the adjacent buttons.'));
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,50);
 camera.position.set(0,.35,10.8);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=5.5;controls.maxDistance=15;controls.target.set(0,0,0);
 scene.add(new THREE.HemisphereLight(0xf5efff,0x34404d,2.6));
 for(const [pos,intensity] of [[[3,5,7],3.2],[[-4,1,3],1.4],[[1,3,-5],2]]){const light=new THREE.DirectionalLight(0xffece0,intensity);light.position.set(...pos);scene.add(light);}
 const heart=new THREE.Group(),overlay=new THREE.Group();scene.add(heart,overlay);
 const meshes=[],pins=[],electrodes=[],byId=new Map(),trims=[];
 let destroyed=false,frame=0,dirty=true,loaded=false,current={tab:'cabrera',opacity:.8,selectedLead:'II',rvotFocus:.5,bodyShift:0},markers=new THREE.Group();overlay.add(markers);
 const decoder=new DRACOLoader().setDecoderPath('/draco/');const loader=new GLTFLoader().setDRACOLoader(decoder);
 const material=(color,opacity=1)=>new THREE.MeshStandardMaterial({color,roughness:.55,metalness:.05,transparent:opacity<1,opacity,side:THREE.DoubleSide,depthWrite:opacity>=.8});
 const disposeNode=node=>node.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}}});
 function pin(text,position,color,group=overlay){
  const marker=new THREE.Mesh(new THREE.SphereGeometry(.065,16,10),new THREE.MeshBasicMaterial({color,depthTest:false,depthWrite:false,transparent:true}));marker.position.copy(position);marker.renderOrder=20;group.add(marker);
  const node=document.createElement('span');node.className='da-pin';node.textContent=text;node.style.setProperty('--pin-color',color);labels.append(node);pins.push({node,marker});return marker;
 }
 function line(points,color,opacity=.6,group=overlay){const m=new THREE.LineBasicMaterial({color,transparent:true,opacity,depthTest:false});const n=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),m);n.renderOrder=10;group.add(n);return n;}
 const V=(...p)=>new THREE.Vector3(...p);
 // Thorax/electrode guides are original schematics, not the paper's CT/STL.
 for(const y of [.65,.17,-.45]){
  const pts=Array.from({length:65},(_,i)=>{const a=i/64*Math.PI;return V(-2.5*Math.cos(a),y,1.9*Math.sin(a));});line(pts,'#7892a1',.15);
 }
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(5,3.8),new THREE.MeshBasicMaterial({color:'#67d8a4',transparent:true,opacity:.1,side:THREE.DoubleSide,depthWrite:false}));plane.rotation.x=-Math.PI/2;overlay.add(plane);
 const planeEdge=new THREE.LineSegments(new THREE.EdgesGeometry(plane.geometry),new THREE.LineBasicMaterial({color:'#67d8a4',transparent:true,opacity:.5}));plane.add(planeEdge);
 const vector=new THREE.ArrowHelper(V(.2,-.8,0).normalize(),V(0,.5,.8),1.4,0xf4c66e,.23,.11);overlay.add(vector);for(const part of [vector.line,vector.cone]){part.material.depthTest=false;part.material.depthWrite=false;part.material.transparent=true;}vector.line.renderOrder=21;vector.cone.renderOrder=21;
 const focusRing=new THREE.Mesh(new THREE.SphereGeometry(.13,24,16),new THREE.MeshBasicMaterial({color:'#f4c66e',transparent:true,opacity:.85,depthTest:false}));focusRing.renderOrder=30;overlay.add(focusRing);
 const projection=line([V(0,0,0),V(1,-1,0)],'#f4c66e',.5);
 const limbGroup=new THREE.Group();overlay.add(limbGroup);
 for(const lead of [...CABRERA,{id:'aVR',angle:-150,color:'#57d9c5'}]){const a=lead.angle*Math.PI/180;const pos=V(2.55*Math.cos(a),-2.55*Math.sin(a),.2);const group=new THREE.Group();limbGroup.add(group);const marker=pin(lead.id==='-aVR'?'−aVR':lead.id,pos,lead.color,group);marker.userData={lead:lead.id};electrodes.push(marker);line([pos.clone().multiplyScalar(.91),pos.clone().multiplyScalar(.82)],lead.color,.5,group);}
 const chestGroup=new THREE.Group();overlay.add(chestGroup);
 for(const lead of CHEST){const marker=pin(lead.id,V(...lead.position),lead.color,chestGroup);marker.userData={lead:lead.id};electrodes.push(marker);}
 const axes=document.createElement('div');axes.className='da-compass';element.append(axes);
 let pointerDown;
 // Hover names the schematic arch branches (TR/EN); atlas meshes stay unnamed as before.
 renderer.domElement.addEventListener('pointermove',e=>{
  if(!loaded)return;const box=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1),camera);
  const hit=raycaster.intersectObjects(meshes,false).find(h=>!(h.object.material.clippingPlanes||[]).some(p=>p.distanceToPoint(h.point)<0));
  const label=hit?.object.userData.label;const text=label?tr(label.tr,label.en):'';
  if(renderer.domElement.title!==text){renderer.domElement.title=text;element.dataset.hover=hit?.object.userData.id&&label?hit.object.userData.id:'';}
 });
 renderer.domElement.addEventListener('pointerdown',e=>{pointerDown=[e.clientX,e.clientY];});
 const raycaster=new THREE.Raycaster();
 renderer.domElement.addEventListener('pointerup',e=>{
  if(!pointerDown||Math.hypot(e.clientX-pointerDown[0],e.clientY-pointerDown[1])>6)return;
  const box=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1),camera);
  const hit=raycaster.intersectObjects([...markers.children,...electrodes],false).find(h=>{for(let n=h.object;n;n=n.parent)if(!n.visible)return false;return true;});
  if(hit)onSelect(hit.object.userData);
 });
 function resize(){if(destroyed)return;const w=host.clientWidth,h=host.clientHeight;if(w<1||h<1)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true;}
 const observer=new ResizeObserver(resize);observer.observe(host);
 controls.addEventListener('change',()=>{dirty=true;});
 function positionLabels(){for(const p of pins){let visible=p.marker.visible;for(let a=p.marker.parent;a;a=a.parent)visible&&=a.visible;const point=p.marker.getWorldPosition(new THREE.Vector3()).project(camera);p.node.hidden=!visible||point.z>1;p.node.style.left=`${(point.x+1)*host.clientWidth/2}px`;p.node.style.top=`${(-point.y+1)*host.clientHeight/2}px`;}}
 function tick(){if(destroyed)return;frame=requestAnimationFrame(tick);controls.update();if(dirty&&element.isConnected&&host.clientWidth){renderer.render(scene,camera);positionLabels();dirty=false;}}
 frame=requestAnimationFrame(tick);
 function markerPosition(site){
  const d=PV_SITES[site];
  if(d&&byId.has(d.part)&&!['RAA','LAA'].includes(site)){
   const box=new THREE.Box3();byId.get(d.part).forEach(m=>box.expandByObject(m));return box.getCenter(new THREE.Vector3());
  }
  const point=V(...(d||SITES[site]).position);point.y+=current.bodyShift||0;return point;
 }
 function rebuildMarkers(){
  for(let i=pins.length-1;i>=0;i--)if(pins[i].marker.parent===markers){pins[i].node.remove();pins.splice(i,1);}
  disposeNode(markers);markers.clear();
  const sites=current.tab==='atrial'?Object.keys(PV_SITES):current.tab==='heights'?Object.keys(SITES):current.tab==='nomenclature'&&current.nomenclatureTopic==='papillary'?['superolateral','inferomedial']:[];
  for(const id of sites){const selected=id===(current.tab==='atrial'?current.pvSite:current.focusSite);const p=pin(id==='inferoseptal'?'ISP':id==='superolateral'?'SL':id==='inferomedial'?'IM':id==='summit'?'SUM':id,markerPosition(id),selected?'#ffe4a0':'#9cc1d4',markers);p.userData={site:id};p.scale.setScalar(selected?1.7:1);}
 }
 function update(next){
  current={...current,...next};heart.position.y=current.bodyShift||0;heart.updateMatrixWorld(true);
  for(const {plane,local} of trims)plane.copy(local).applyMatrix4(heart.matrixWorld);const atrial=current.tab==='atrial';
  for(const m of meshes){const isChamber=m.userData.layer==='chambers',isAtrial=['la','ra'].includes(m.userData.id);m.visible=true;m.material.opacity=isChamber?(atrial?(isAtrial?current.opacity:.18):current.opacity):.85;m.material.transparent=m.material.opacity<1;m.material.depthWrite=m.material.opacity>=.8;m.material.color.setHex(m.userData.color);if(current.tab==='nomenclature'&&isChamber)m.material.color.set(isAtrial?'#6d85b2':m.userData.id==='rv'?'#dd8c75':'#b56470');}
  const visibleLeads=new Set(current.visibleLeads||CABRERA.map(l=>l.id));
  limbGroup.visible=[...visibleLeads].some(id=>!id.startsWith('V'));
  chestGroup.visible=[...visibleLeads].some(id=>id.startsWith('V'));
  const level=current.heightPlane||'superior';plane.visible=current.tab==='heights';plane.position.y={superior:.65,middle:.17,inferior:-.45}[level];
  for(const e of electrodes){
    e.visible=visibleLeads.has(e.userData.lead);
    if(e.parent!==chestGroup)e.parent.visible=e.visible;
    const active=e.userData.lead===current.selectedLead;e.scale.setScalar(active?1.65:1);
  }
  let p=V(-.35+current.rvotFocus*.55,.9+(current.bodyShift||0),.9),angle=current.angle??90;
  if(current.tab==='heights')p=markerPosition(current.focusSite||'summit');
  if(atrial)p=markerPosition(current.pvSite||'RSPV');
  if(current.tab==='nomenclature'&&current.nomenclatureTopic==='papillary')p=markerPosition(current.focusSite||'superolateral');
  const bundle=current.tab==='nomenclature'&&current.nomenclatureTopic==='bundles';
  if(bundle)p=V(0,.1+(current.bodyShift||0),0);
  focusRing.position.copy(p);focusRing.visible=current.tab!=='nomenclature'||current.nomenclatureTopic==='papillary';
  const direction=bundle?V(0,0,current.bundleSide==='left'?-1:1):V(Math.cos(angle*Math.PI/180),-Math.sin(angle*Math.PI/180),atrial?.35:0).normalize();vector.position.copy(p);vector.setDirection(direction);vector.setLength(1.15,.22,.1);vector.visible=!atrial;
  const selected=CHEST.find(l=>l.id===current.selectedLead)||CABRERA.find(l=>l.id===current.selectedLead)||(current.selectedLead==='aVR'?{angle:-150}:null);
  projection.visible=!!selected;
  if(selected){const end=selected.position?V(...selected.position):V(2.55*Math.cos(selected.angle*Math.PI/180),-2.55*Math.sin(selected.angle*Math.PI/180),.2);projection.geometry.setFromPoints([p,end]);}
  rebuildMarkers();
  axes.textContent=tr('Altın ok: şematik yayılım · Noktalar: şematik konumlar · Sağ/sol hastaya göre','Gold arrow: schematic propagation · Points: schematic locations · Right/left refer to patient');
  if(loaded)status.hidden=true;else status.textContent=tr('Yerel kalp atlası yükleniyor…','Loading local heart atlas…');
  dirty=true;resize();
 }
 loader.loadAsync(ATLAS_URL).then(gltf=>{
  if(destroyed){disposeNode(gltf.scene);return;}
  gltf.scene.updateMatrixWorld(true);const found=[];
  gltf.scene.traverse(obj=>{if(!obj.isMesh)return;const association=gltf.parser.associations.get(obj);const name=gltf.parser.json.nodes[association?.nodes]?.name||obj.name;const part=normalizedParts.get(normalizeAtlasName(name));if(part)found.push({obj,part});});
  const bounds=new THREE.Box3();found.filter(x=>x.part.layer==='chambers').forEach(x=>bounds.expandByObject(x.obj));if(bounds.isEmpty())throw new Error('Atlas chamber nodes missing');
  const centre=bounds.getCenter(new THREE.Vector3()),scale=3.3/Math.max(...bounds.getSize(new THREE.Vector3()).toArray());
  for(const {obj,part} of found){const geometry=obj.geometry.clone().applyMatrix4(obj.matrixWorld);geometry.translate(-centre.x,-centre.y,-centre.z);geometry.scale(scale,scale,scale);const mesh=new THREE.Mesh(geometry,material(part.color));mesh.userData=part;heart.add(mesh);meshes.push(mesh);if(!byId.has(part.id))byId.set(part.id,[]);byId.get(part.id).push(mesh);}
  addArchBranchesAndTrims();
  disposeNode(gltf.scene);decoder.dispose();loaded=true;element.dataset.loaded='true';update(current);element.dispatchEvent(new CustomEvent('da-atlas-ready'));
 }).catch(error=>{if(destroyed)return;status.hidden=false;status.textContent=tr('Atlas yüklenemedi; şematik işaretler kalp anatomisi yerine geçmez.','Atlas failed to load; schematic markers do not replace cardiac anatomy.');element.dataset.loaded='error';console.error('Da Vinci atlas:',error);});
 // Same atlas frame as heart.js: schematic supra-aortic branches on the arch, PA branches trimmed to hilar length.
 function addArchBranchesAndTrims(){
  const arch=meshes.find(m=>m.userData.sourceName==='Aortic arch');
  if(arch)for(const b of buildArchBranches(arch.geometry)){const mesh=new THREE.Mesh(b.geometry,material(arch.userData.color));mesh.name=`${b.en} (schematic)`;mesh.userData={id:b.id,layer:'vessels',color:arch.userData.color,provenance:'schematic',label:{tr:b.tr,en:b.en}};heart.add(mesh);meshes.push(mesh);}
  const verts=name=>{const m=meshes.find(x=>x.userData.sourceName===name);if(!m)return[];const p=m.geometry.attributes.position;return Array.from({length:p.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(p,i));};
  for(const [name,local] of pulmonaryBranchTrims(verts).planes){const plane=local.clone();for(const m of meshes)if(m.userData.sourceName===name)m.material.clippingPlanes=[plane];trims.push({plane,local});}
  element.dataset.archBranches=meshes.filter(m=>m.userData.provenance==='schematic').map(m=>m.userData.id).sort().join(',');
  element.dataset.paTrims=[...new Set(meshes.filter(m=>m.material.clippingPlanes?.length).map(m=>m.userData.sourceName))].join(',');
 }
 function view(name){const positions={anterior:[0,.35,10.8],superior:[0,10.8,.01],left:[10,.8,0],posterior:[0,.35,-10.8]};camera.position.set(...positions[name]);camera.up.set(0,1,0);if(name==='superior')camera.up.set(0,0,-1);controls.target.set(0,0,0);controls.update();dirty=true;element.dataset.view=name;}
 // Still image of a model state for the figure cards. Renders the state at a fixed size off the
 // live view, paints the electrode and site labels onto a 2D canvas, then restores the live view.
 function drawPins(ctx,width,height){
  ctx.font='750 13px Inter, system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  for(const p of pins){
   let visible=p.marker.visible;for(let a=p.marker.parent;a;a=a.parent)visible&&=a.visible;
   const point=p.marker.getWorldPosition(new THREE.Vector3()).project(camera);
   if(!visible||point.z>1)continue;
   const x=(point.x+1)*width/2,y=(-point.y+1)*height/2-16,text=p.node.textContent,color=p.node.style.getPropertyValue('--pin-color')||'#e2e8f0';
   const w=ctx.measureText(text).width+12;
   ctx.fillStyle='rgba(13,25,34,.88)';ctx.strokeStyle=color;ctx.globalAlpha=.9;ctx.beginPath();ctx.roundRect(x-w/2,y-10,w,20,4);ctx.fill();ctx.globalAlpha=.45;ctx.stroke();ctx.globalAlpha=1;
   ctx.fillStyle=color;ctx.fillText(text,x,y+.5);
  }
 }
 function snapshot({state,view:name='anterior',width=640,height=440}){
  if(!loaded||destroyed)return null;
  const saved={current,position:camera.position.clone(),up:camera.up.clone(),target:controls.target.clone(),view:element.dataset.view,ratio:renderer.getPixelRatio()};
  let url=null;
  try{
   update(state);view(name);
   renderer.setPixelRatio(1);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
   renderer.render(scene,camera);
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d');
   const glow=ctx.createRadialGradient(width/2,height*.45,20,width/2,height*.45,Math.max(width,height)*.7);
   glow.addColorStop(0,'#13283a');glow.addColorStop(1,'#08111a');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
   ctx.drawImage(renderer.domElement,0,0,width,height);drawPins(ctx,width,height);
   url=canvas.toDataURL('image/webp',.86);
  }finally{
   current=saved.current;update({});
   camera.position.copy(saved.position);camera.up.copy(saved.up);controls.target.copy(saved.target);controls.update();
   if(saved.view)element.dataset.view=saved.view;
   renderer.setPixelRatio(saved.ratio);resize();positionLabels();dirty=true;
  }
  return url;
 }
 update(current);
 return {element,update,view,snapshot,isReady:()=>loaded&&!destroyed,destroy(){destroyed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();decoder.dispose();disposeNode(scene);renderer.dispose();renderer.forceContextLoss();element.remove();}};
}

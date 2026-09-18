import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
for(const file of ['hra-heart','hra-vessels']){
 const b=fs.readFileSync(`research/${file}.glb`);const gltf=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 console.log(file);gltf.scene.updateMatrixWorld(true);
 gltf.scene.traverse(o=>{if(o.isMesh && (file==='hra-heart'||/aorta|cava|coronary|pulmonary|descending_artery/.test(o.name))){const box=new THREE.Box3().setFromObject(o);console.log(o.name,box.min.toArray().map(v=>v.toFixed(4)),box.max.toArray().map(v=>v.toFixed(4)),o.geometry.attributes.position.count);}});
}

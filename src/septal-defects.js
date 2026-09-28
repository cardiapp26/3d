import * as THREE from 'three';
import { centroid, contactPatch, nearestLoop, inferiorCavalOstium, septalPairs, septalSiteNear } from './mesh-utils.js';

const ASD_IDS = ['asd-secundum', 'asd-primum', 'asd-sinus-superior', 'asd-sinus-inferior', 'asd-coronary-sinus'];
const VSD_IDS = ['vsd-perimembranous', 'vsd-muscular', 'vsd-inlet', 'vsd-outlet'];
export const DEFECT_IDS = [...ASD_IDS, ...VSD_IDS];
const codes = ['II', 'I', 'SV↑', 'SV↓', 'CS', 'PM', 'M', 'IN', 'OUT'];
const nearest = (points, target) => points.length ? points.reduce((a, b) => a.distanceToSquared(target) < b.distanceToSquared(target) ? a : b).clone() : null;

/** Illustrative sites measured from atlas landmarks, never segmented defects. */
export function measureDefectSites({ getMeshes, sourceCenter, meshVertices, fossa }) {
  const la = sourceCenter('la'), ra = sourceCenter('ra'), lv = sourceCenter('lv'), rv = sourceCenter('rv');
  if (!la || !ra || !lv || !rv) return [];
  const patch = contactPatch(getMeshes('ra')[0], getMeshes('la')[0]);
  const tv = sourceCenter('tricuspid-annulus'), mv = sourceCenter('mitral-annulus');
  const svc = nearestLoop(getMeshes('svc')[0], ra)?.center;
  const ivc = inferiorCavalOstium(getMeshes('ra')[0]) || nearestLoop(getMeshes('ivc')[0], ra)?.center;
  const cs = meshVertices('cs');
  const laVertices = meshVertices('la');
  // Coronary-sinus type belongs to the CS roof adjacent to LA, not the oval fossa.
  let csRoof = null, separation = Infinity;
  for (let i = 0; i < cs.length; i += 3) for (let j = 0; j < laVertices.length; j += 5) {
    const d = cs[i].distanceToSquared(laVertices[j]);
    if (d < separation) { separation = d; csRoof = cs[i].clone(); }
  }
  const atrialNormal = la.clone().sub(ra).normalize();
  const ventricularNormal = lv.clone().sub(rv).normalize();
  const sites = [];
  const add = (id, point, normal, anchor) => {
    if (point) sites.push({ id, point: point.clone(), normal: normal.clone(), anchor, family: id.startsWith('asd') ? 'asd' : 'vsd' });
  };
  add('asd-secundum', fossa, atrialNormal, 'oval-fossa');
  add('asd-primum', patch && tv && mv ? nearest(patch.points, tv.clone().lerp(mv, .5)) : null, atrialNormal, 'av-junction');
  add('asd-sinus-superior', svc && fossa ? svc.clone().lerp(fossa, .18) : null, atrialNormal, 'svc-ra-junction');
  add('asd-sinus-inferior', ivc && fossa ? ivc.clone().lerp(fossa, .15) : null, atrialNormal, 'ivc-ra-junction');
  add('asd-coronary-sinus', csRoof, atrialNormal, 'coronary-sinus-roof');

  const pairs = septalPairs(meshVertices('rv'), meshVertices('lv'));
  const mid = pair => pair.rvSide.clone().lerp(pair.lvSide, .5);
  const site = target => target ? septalSiteNear(pairs, target) : null;
  const root = sourceCenter('ncc'), rightCusp = sourceCenter('rcc'), pulmonary = sourceCenter('pulmonary-valve');
  const pm = site(root && rightCusp ? root.clone().lerp(rightCusp, .5).add(new THREE.Vector3(0, -.12, 0)) : null);
  const muscularTarget = pairs.length ? centroid(pairs.map(mid)).add(new THREE.Vector3(0, -.3, 0)) : null;
  const muscle = site(muscularTarget);
  const inlet = site(tv ? tv.clone().add(new THREE.Vector3(0, -.3, -.22)) : null);
  const outlet = site(rightCusp && pulmonary ? rightCusp.clone().lerp(pulmonary, .5).add(new THREE.Vector3(0, -.15, 0)) : null);
  add('vsd-perimembranous', pm && mid(pm), ventricularNormal, 'aortic-tricuspid-region');
  add('vsd-muscular', muscle && mid(muscle), ventricularNormal, 'muscular-septum');
  add('vsd-inlet', inlet && mid(inlet), ventricularNormal, 'av-inlet-septum');
  add('vsd-outlet', outlet && mid(outlet), ventricularNormal, 'ventricular-outlet-septum');
  return sites;
}

export function createSeptalDefects({ container, ...helpers }) {
  const group = new THREE.Group();
  group.name = 'ASD / VSD schematic sites';
  group.visible = false;
  const overlay = document.createElement('div');
  overlay.className = 'defect-overlay';
  overlay.hidden = true;
  container.append(overlay);
  const markers = new Map();
  let selected = DEFECT_IDS[0];
  function build(fossa) {
    if (markers.size) return;
    for (const site of measureDefectSites({ ...helpers, fossa })) {
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(.13, .022, 10, 48), new THREE.MeshStandardMaterial({
        color: site.family === 'asd' ? 0xe7a34f : 0x42c9c1, emissive: site.family === 'asd' ? 0xe7a34f : 0x42c9c1,
        emissiveIntensity: .35, transparent: true, opacity: 1, depthWrite: false, side: THREE.DoubleSide
      }));
      mesh.position.copy(site.point);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), site.normal);
      mesh.userData = { pickId: site.id, provenance: 'schematic', family: site.family, anchor: site.anchor };
      mesh.name = site.id;
      mesh.renderOrder = 20;
      const label = document.createElement('button');
      label.type = 'button'; label.className = 'defect-site-label'; label.textContent = codes[DEFECT_IDS.indexOf(site.id)];
      label.dataset.defectSite = site.id;
      label.setAttribute('aria-label', site.id);
      label.addEventListener('click', () => helpers.onSelect(site.id));
      overlay.append(label);
      group.add(mesh);
      markers.set(site.id, { ...site, mesh, label });
    }
    select(selected);
  }
  function select(id) {
    if (!DEFECT_IDS.includes(id)) return false;
    selected = id;
    const family = id.split('-')[0];
    for (const entry of markers.values()) {
      entry.mesh.visible = entry.family === family;
      entry.mesh.material.opacity = entry.id === id ? 1 : .32;
      entry.mesh.material.emissiveIntensity = entry.id === id ? .8 : .15;
      entry.label.classList.toggle('selected', entry.id === id);
      entry.label.setAttribute('aria-pressed', String(entry.id === id));
    }
    return true;
  }
  function updateLabels(camera) {
    overlay.hidden = !group.visible;
    if (!group.visible) return;
    for (const entry of markers.values()) {
      const v = entry.point.clone().project(camera);
      entry.label.hidden = !entry.mesh.visible || v.z < -1 || v.z > 1 || Math.abs(v.x) > .96 || Math.abs(v.y) > .96;
      entry.label.style.left = `${(v.x + 1) * 50}%`; entry.label.style.top = `${(1 - v.y) * 50}%`;
    }
  }
  return {
    group, build, select, updateLabels,
    getSelected: () => selected,
    getSite: id => markers.get(id) || null,
    getState: () => ({ selected, family: selected.split('-')[0], available: [...markers.keys()], visible: group.visible }),
    dispose() { overlay.remove(); }
  };
}

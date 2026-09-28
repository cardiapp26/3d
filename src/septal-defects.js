import * as THREE from 'three';
import { centroid, contactPatch, nearestLoop, inferiorCavalOstium, septalPairs, septalSiteNear } from './mesh-utils.js';
import { DEFECT_TYPES } from './septal-defects-data.js';

export const DEFECT_IDS = DEFECT_TYPES.map(item => item.id);
const MARKS = Object.fromEntries(DEFECT_TYPES.map(item => [item.id, item.mark]));
const nearest = (points, target) => points.length ? points.reduce((a, b) => a.distanceToSquared(target) < b.distanceToSquared(target) ? a : b).clone() : null;
const meshCenter = mesh => {
  if (!mesh) return null;
  mesh.updateWorldMatrix(true, false);
  return new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3());
};

/**
 * Unroofed coronary sinus: the point of the terminal (near-ostial) sinus
 * segment that lies closest to the LA wall, with the roof normal pointing
 * from the sinus toward the LA. The distal sinus under the LA is excluded
 * because the teaching site is the shunt route beside the orifice.
 */
function coronarySinusRoof(cs, la, ostium, reach = .65) {
  let roof = null, toward = null, separation = Infinity;
  for (let i = 0; i < cs.length; i += 3) {
    if (ostium && cs[i].distanceTo(ostium) > reach) continue;
    for (let j = 0; j < la.length; j += 5) {
      const d = cs[i].distanceToSquared(la[j]);
      if (d < separation) { separation = d; roof = cs[i]; toward = la[j]; }
    }
  }
  if (!roof) return null;
  const normal = toward.clone().sub(roof);
  return { point: roof.clone(), normal: normal.lengthSq() > 1e-8 ? normal.normalize() : null };
}

/** Illustrative sites measured from atlas landmarks, never segmented defects. */
export function measureDefectSites({ getMeshes, sourceCenter, meshVertices, fossa }) {
  const la = sourceCenter('la'), ra = sourceCenter('ra'), lv = sourceCenter('lv'), rv = sourceCenter('rv');
  if (!la || !ra || !lv || !rv) return [];
  const patch = contactPatch(getMeshes('ra')[0], getMeshes('la')[0]);
  const septum = patch ? patch.points : [];
  const tv = sourceCenter('tricuspid-annulus'), mv = sourceCenter('mitral-annulus');
  const svc = nearestLoop(getMeshes('svc')[0], ra)?.center;
  const ivc = inferiorCavalOstium(getMeshes('ra')[0]) || nearestLoop(getMeshes('ivc')[0], ra)?.center;
  const rspv = sourceCenter('rspv');
  const csVertices = meshVertices('cs');
  const csOstium = nearest(csVertices, ra);
  const atrialNormal = la.clone().sub(ra).normalize();
  const sites = [];
  const add = (id, point, normal, anchor) => {
    if (point && normal) sites.push({ id, point: point.clone(), normal: normal.clone(), anchor, family: id.startsWith('asd') ? 'asd' : 'vsd' });
  };

  // Secundum: the oval fossa itself. Primum: the atrioventricular septal
  // region between the anteroinferior fossa margin and the AV valves.
  add('asd-secundum', fossa, atrialNormal, 'oval-fossa');
  const annuli = tv && mv ? tv.clone().lerp(mv, .5) : null;
  add('asd-primum', fossa && annuli ? nearest(septum, fossa.clone().lerp(annuli, .6)) : null, atrialNormal, 'av-junction');
  // Sinus venosus: where the caval mouth overrides the interatrial wall
  // (superior: beside the right upper pulmonary vein), not inside the lumen.
  const superiorTarget = svc && rspv ? svc.clone().lerp(rspv, .5) : svc;
  const inferiorTarget = ivc;
  add('asd-sinus-superior', superiorTarget ? nearest(septum, superiorTarget) || (fossa && svc.clone().lerp(fossa, .18)) : null, atrialNormal, 'svc-ra-junction');
  // The inferior defect straddles the caval mouth: halfway between the
  // lowest septal contact and the inferior caval orifice itself.
  const inferiorSeptal = inferiorTarget ? nearest(septum, inferiorTarget) : null;
  add('asd-sinus-inferior', inferiorSeptal ? inferiorSeptal.lerp(ivc, .45) : (ivc && fossa ? ivc.clone().lerp(fossa, .15) : null), atrialNormal, 'ivc-ra-junction');
  const roof = coronarySinusRoof(csVertices, meshVertices('la'), csOstium);
  add('asd-coronary-sinus', roof?.point, roof?.normal || atrialNormal, 'coronary-sinus-roof');

  const pairs = septalPairs(meshVertices('rv'), meshVertices('lv'));
  const mid = pair => pair.rvSide.clone().lerp(pair.lvSide, .5);
  const across = pair => {
    const n = pair.lvSide.clone().sub(pair.rvSide);
    return n.lengthSq() > 1e-8 ? n.normalize() : lv.clone().sub(rv).normalize();
  };
  const site = target => target ? septalSiteNear(pairs, target) : null;
  const root = sourceCenter('ncc'), rightCusp = sourceCenter('rcc'), pulmonary = sourceCenter('pulmonary-valve');
  const septalLeaflet = meshCenter(getMeshes('tricuspid').find(m => m.userData.leaflet === 'septal'));
  // Perimembranous: beneath the commissure between the right and non-coronary
  // cusps, where the membranous septum meets the septal tricuspid leaflet.
  const pm = site(root && rightCusp ? root.clone().lerp(rightCusp, .5).add(new THREE.Vector3(0, -.12, 0)) : null);
  // Trabecular muscular: a representative mid-to-apical septal site.
  const muscle = site(pairs.length ? centroid(pairs.map(mid)).add(new THREE.Vector3(0, -.3, 0)) : null);
  // Inlet: under the septal tricuspid leaflet, posteroinferior to the membranous septum.
  const inletTarget = septalLeaflet ? septalLeaflet.add(new THREE.Vector3(0, -.3, -.2)) : tv ? tv.clone().add(new THREE.Vector3(.25, -.3, -.15)) : null;
  const inlet = site(inletTarget);
  // Outlet: the infundibular septum beneath the pulmonary valve, between the
  // subpulmonary infundibulum and the subaortic outflow.
  const outlet = site(rightCusp && pulmonary ? rightCusp.clone().lerp(pulmonary, .65).add(new THREE.Vector3(0, -.12, 0)) : null);
  add('vsd-perimembranous', pm && mid(pm), pm && across(pm), 'aortic-tricuspid-region');
  add('vsd-muscular', muscle && mid(muscle), muscle && across(muscle), 'muscular-septum');
  add('vsd-inlet', inlet && mid(inlet), inlet && across(inlet), 'av-inlet-septum');
  add('vsd-outlet', outlet && mid(outlet), outlet && across(outlet), 'ventricular-outlet-septum');
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
      label.type = 'button'; label.className = 'defect-site-label'; label.textContent = MARKS[site.id];
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

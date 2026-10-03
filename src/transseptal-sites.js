import * as THREE from 'three';

/*
 * Site-specific transseptal puncture targets on the fossa ovalis, seen from
 * the right atrium (Deisenhofer et al., Europace 2026;28:euag021, Figure 2).
 * Offsets are in fossa radii: `anterior` toward the tricuspid hinge and aortic
 * root, `superior` toward the SVC. Teaching positions, not measured targets.
 */
export const TS_SITES = Object.freeze({
  pvi: { anterior: 0, superior: -0.2, color: 0x3b82f6 },
  lv: { anterior: 0.55, superior: -0.35, color: 0xf59e0b },
  laac: { anterior: -0.6, superior: -0.6, color: 0x34d399 },
  mitral: { anterior: -0.55, superior: 0.5, color: 0xef4444 },
  pfo: { anterior: 0.8, superior: 0.75, color: 0xfacc15 }
});

/** Fossa-plane anterior direction: world +z (toward the tricuspid hinge) projected onto the septal plane. */
export function septalAnterior(normal, up) {
  const anterior = new THREE.Vector3(0, 0, 1).addScaledVector(normal, -normal.z);
  anterior.addScaledVector(up, -anterior.dot(up));
  return anterior.lengthSq() > 1e-9 ? anterior.normalize() : new THREE.Vector3().crossVectors(up, normal).normalize();
}

/** World position of one site on the septal plane through `fossa`. */
export function siteAt(key, { fossa, up, anterior, radius }) {
  const site = TS_SITES[key];
  if (!site) throw new Error(`Unknown transseptal site: ${key}`);
  return fossa.clone()
    .addScaledVector(anterior, site.anterior * radius)
    .addScaledVector(up, site.superior * radius);
}

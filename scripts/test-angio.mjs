import assert from 'node:assert/strict';
import * as THREE from 'three';

// Verify angular math in isolation
function calculateAngio(x, y, z) {
  const target = new THREE.Vector3(0, 0.4, 0);
  const offset = new THREE.Vector3(x, y, z).sub(target);
  const R = offset.length();
  const phi = Math.asin(THREE.MathUtils.clamp(offset.y / R, -1, 1)) * (180 / Math.PI);
  const theta = Math.atan2(offset.x, offset.z) * (180 / Math.PI);
  return {
    laoRao: Math.round(theta),
    craCau: Math.round(phi)
  };
}

function projectAngio(laoRao, craCau, R = 9.3) {
  const target = new THREE.Vector3(0, 0.4, 0);
  const theta = (laoRao * Math.PI) / 180;
  const phi = (craCau * Math.PI) / 180;
  const x = R * Math.cos(phi) * Math.sin(theta);
  const y = R * Math.sin(phi);
  const z = R * Math.cos(phi) * Math.cos(theta);
  return target.clone().add(new THREE.Vector3(x, y, z));
}

// Test AP 0/0
const pAP = projectAngio(0, 0);
const aAP = calculateAngio(pAP.x, pAP.y, pAP.z);
assert.equal(aAP.laoRao, 0, 'AP LAO/RAO is 0');
assert.equal(aAP.craCau, 0, 'AP CRA/CAU is 0');

// Test Spider View: LAO 45 / CAU -30
const pSpider = projectAngio(45, -30);
const aSpider = calculateAngio(pSpider.x, pSpider.y, pSpider.z);
assert.equal(aSpider.laoRao, 45, 'Spider LAO is 45');
assert.equal(aSpider.craCau, -30, 'Spider CAU is -30');

// Test RAO Cranial: RAO 30 / CRA 30
const pRaoCra = projectAngio(-30, 30);
const aRaoCra = calculateAngio(pRaoCra.x, pRaoCra.y, pRaoCra.z);
assert.equal(aRaoCra.laoRao, -30, 'RAO Cranial RAO is -30');
assert.equal(aRaoCra.craCau, 30, 'RAO Cranial CRA is 30');

// Test LAO Cranial: LAO 45 / CRA 30
const pLaoCra = projectAngio(45, 30);
const aLaoCra = calculateAngio(pLaoCra.x, pLaoCra.y, pLaoCra.z);
assert.equal(aLaoCra.laoRao, 45, 'LAO Cranial LAO is 45');
assert.equal(aLaoCra.craCau, 30, 'LAO Cranial CRA is 30');

// Test RAO Caudal: RAO 30 / CAU -20
const pRaoCau = projectAngio(-30, -20);
const aRaoCau = calculateAngio(pRaoCau.x, pRaoCau.y, pRaoCau.z);
assert.equal(aRaoCau.laoRao, -30, 'RAO Caudal RAO is -30');
assert.equal(aRaoCau.craCau, -20, 'RAO Caudal CAU is -20');

console.log('PASS: All Angiography projection angles and spherical trigonometry roundtrip checks passed.');

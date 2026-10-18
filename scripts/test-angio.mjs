import assert from 'node:assert/strict';
import * as THREE from 'three';

// 1. Verify angular math in isolation
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

// 2. Coronary Angiography Module (Cath-Lab C-Arm Simulator) Integration Tests
import {
  CORONARY_SYSTEMS,
  STANDARD_ANGIO_VIEWS,
  CORONARY_VESSEL_TREES,
  CLINICAL_LESIONS
} from '../src/angio/angio-data.js';

import {
  projectPoint,
  computeVesselForeshortening
} from '../src/angio/fluoroscopy-sim.js';

import { buildCarmSvg } from '../src/angio/carm-model.js';

// Test Coronary Systems
assert.equal(CORONARY_SYSTEMS.length, 5, '5 arterial and bypass systems (LCA, RCA, LIMA, SVG-OM, SVG-PDA)');
assert.ok(CORONARY_SYSTEMS.some(s => s.id === 'left' && s.nameTr.includes('Sol Koroner')));
assert.ok(CORONARY_SYSTEMS.some(s => s.id === 'right' && s.nameTr.includes('Sağ Koroner')));

// Test Standard Angiographic Views
assert.ok(STANDARD_ANGIO_VIEWS.length >= 15, '15+ standard cath lab projections defined');
const spiderView = STANDARD_ANGIO_VIEWS.find(v => v.id === 'lao-caudal');
assert.ok(spiderView, 'LAO Caudal Spider view exists');
assert.equal(spiderView.alpha, 45, 'Spider view is LAO 45');
assert.equal(spiderView.beta, -35, 'Spider view is Caudal -35');
assert.ok(spiderView.optimalFor.includes('LMCA'), 'Spider view is optimal for LMCA');

const raoCraView = STANDARD_ANGIO_VIEWS.find(v => v.id === 'rao-cranial');
assert.equal(raoCraView.alpha, -30, 'RAO Cranial is RAO -30');
assert.equal(raoCraView.beta, 30, 'RAO Cranial is CRA +30');
assert.ok(raoCraView.optimalFor.includes('mLAD'), 'RAO Cranial is optimal for mid LAD');

const rcaLaoView = STANDARD_ANGIO_VIEWS.find(v => v.id === 'rca-lao');
assert.equal(rcaLaoView.alpha, 45, 'RCA LAO view is LAO 45');
assert.equal(rcaLaoView.beta, 0, 'RCA LAO view is straight 0');

// Test 3D Coronary Centerline Trees
const lcaTree = CORONARY_VESSEL_TREES.left;
assert.ok(lcaTree.length >= 10, 'LCA tree defines >= 10 named anatomical segments (LM, LAD, LCx, D1, D2, S1, OM1...)');
const lmca = lcaTree.find(v => v.id === 'LMCA');
assert.equal(lmca.ahaSegment, 5, 'LMCA is AHA segment 5');
assert.ok(lmca.caliberMm >= 4.0, 'LMCA caliber is >= 4.0 mm');

const rcaTree = CORONARY_VESSEL_TREES.right;
assert.ok(rcaTree.length >= 8, 'RCA tree defines >= 8 named anatomical segments');
const pda = rcaTree.find(v => v.id === 'PDA');
assert.equal(pda.ahaSegment, 4, 'PDA is AHA segment 4');

// Test 3D-to-2D Fluoroscopic Projection Math
const testPt = [0.0, 0.0, 1.0]; // Anterior point
const projAP = projectPoint(testPt, 0, 0);
assert.ok(Number.isFinite(projAP.u) && Number.isFinite(projAP.v) && Number.isFinite(projAP.depth));
const projSpider = projectPoint(testPt, 45, -35, 0.3);
assert.ok(Number.isFinite(projSpider.u) && Number.isFinite(projSpider.v));

// Test Real-Time Foreshortening Metrics
const metricsSpider = computeVesselForeshortening('left', 45, -35);
assert.ok(metricsSpider.LMCA, 'LMCA metric calculated in Spider view');
assert.ok(metricsSpider.LMCA.elongation >= 0.70, 'LMCA has excellent elongation index in Spider view');
assert.ok(metricsSpider.pLCx.elongation >= 0.65, 'pLCx has high elongation in Spider view');

const metricsRaoCra = computeVesselForeshortening('left', -30, 30);
assert.ok(metricsRaoCra.mLAD.elongation >= 0.80, 'mLAD has excellent elongation in RAO Cranial view');

// Test Clinical Lesions Catalog
assert.ok(CLINICAL_LESIONS.length >= 6, '6+ clinical lesions in stenosis simulator');
const lmLesion = CLINICAL_LESIONS.find(l => l.id === 'lm_bifurcation');
assert.equal(lmLesion.bestViewId, 'lao-caudal', 'Optimal view for LM bifurcation is LAO Caudal Spider view');
assert.equal(lmLesion.pct, 85, 'LM bifurcation lesion is 85% stenosis');

// Test C-Arm Gantry SVG Generation
const carmSvg = buildCarmSvg(45, -35, true);
assert.ok(carmSvg.includes('<svg') && carmSvg.includes('</svg>'), 'buildCarmSvg returns valid SVG markup');
assert.ok(carmSvg.includes('LAO 45°') && carmSvg.includes('CAU 35°'), 'buildCarmSvg includes exact angle labels');
assert.ok(carmSvg.includes('DETEKTÖR') && carmSvg.includes('TÜP'), 'buildCarmSvg includes detector and tube elements');

console.log('PASS: All Angiography projection angles, spherical trigonometry, 5 coronary systems, 15+ standard views, 3D vessel trees, foreshortening metrics, and C-arm gantry checks passed.');

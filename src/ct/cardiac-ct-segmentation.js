// Cardiac CT 3-Panel Reconstruction (3D VRT · 3D MIP · Coronal/Axial MPR) & 14-Structure Anatomical Segmentation Engine
// Aligns with Cardia's canonical SEGMENTATION_LABELS (src/segmentation-view.js) and renders the 3-panel clinical CT output.

import { SEGMENTATION_LABELS, labelCss } from '../segmentation-view.js';
import { findWindowPreset, huToGrayscale } from './cardiac-ct-sim.js';

const w = (tr, en) => Object.freeze({ tr, en });

export const CT_FOV_MODES = Object.freeze([
  {
    id: 'aorto-cervical',
    label: w('Arkus Aort + Karotis / Vertebral & Serebral BTA (3-Panel)', 'Aortic Arch + Carotid / Vertebral & Cerebral CTA (3-Panel)'),
    short: w('ARKUS · KAROTİS · WİLLİS', 'ARCH · CAROTID · WILLIS')
  },
  {
    id: 'cardiac-coronary',
    label: w('Kardiyak & Koroner BTA (Kalp Odacıkları + LM/LAD/LCx/RCA)', 'Cardiac & Coronary CTA (Chambers + LM/LAD/LCx/RCA)'),
    short: w('KORONER · ODACIK · AORT', 'CORONARY · CHAMBERS · AORTA')
  },
  {
    id: 'full-cardiothoracic',
    label: w('Tam Kardiyotorasik + Supra-Aortik Vasküler Ağaç', 'Full Cardiothoracic + Supra-Aortic Vascular Tree'),
    short: w('TAM TORAKS · BOYUN · KALP', 'FULL THORAX · NECK · HEART')
  }
]);

// 14 Canonical Segmentation Classes mapped to SEGMENTATION_LABELS colors + CT quantitative baselines
export const CT_SEGMENTATION_CLASSES = Object.freeze([
  {
    key: 'aorta',
    colorHex: '#b83dba',
    vrtColor: '#e2a976',
    name: w('Çıkan Aort, Arkus & Supra-Aortik Dallar', 'Ascending Aorta, Arch & Supra-Aortic Branches'),
    category: 'arterial',
    baseHu: 395,
    baseVolMl: 118.4,
    caliberMm: 31.2
  },
  {
    key: 'carotid-willis',
    colorHex: '#ff7043',
    vrtColor: '#deb082',
    name: w('Karotis (CCA/ICA/ECA), Vertebral & Willis Poligonu', 'Carotid (CCA/ICA/ECA), Vertebral & Circle of Willis'),
    category: 'arterial',
    baseHu: 382,
    baseVolMl: 34.6,
    caliberMm: 6.4
  },
  {
    key: 'lad',
    colorHex: '#f0e442',
    vrtColor: '#f0c58e',
    name: w('Sol Ana (LM) & Ön İnen Koroner Arter (LAD / D1 / Septal)', 'Left Main (LM) & Left Anterior Descending (LAD / D1 / Septal)'),
    category: 'coronary',
    baseHu: 378,
    baseVolMl: 4.8,
    caliberMm: 3.6
  },
  {
    key: 'lcx',
    colorHex: '#aeea00',
    vrtColor: '#e5ba84',
    name: w('Sirkumfleks Koroner Arter (LCx / OM1 / OM2)', 'Left Circumflex Coronary Artery (LCx / OM1 / OM2)'),
    category: 'coronary',
    baseHu: 368,
    baseVolMl: 3.6,
    caliberMm: 3.2
  },
  {
    key: 'rca',
    colorHex: '#ff80ab',
    vrtColor: '#e9bd88',
    name: w('Sağ Koroner Arter (RCA / AM / PDA / PLV)', 'Right Coronary Artery (RCA / AM / PDA / PLV)'),
    category: 'coronary',
    baseHu: 374,
    baseVolMl: 4.5,
    caliberMm: 3.5
  },
  {
    key: 'lv',
    colorHex: '#d32f2f',
    vrtColor: '#b96548',
    name: w('Sol Ventrikül (LV Lümen & Miyokard)', 'Left Ventricle (LV Cavity & Myocardium)'),
    category: 'chamber',
    baseHu: 388,
    baseVolMl: 132.0,
    caliberMm: 48.0
  },
  {
    key: 'rv',
    colorHex: '#0072b2',
    vrtColor: '#9e6b55',
    name: w('Sağ Ventrikül (RV Lümen & RVOT)', 'Right Ventricle (RV Cavity & RVOT)'),
    category: 'chamber',
    baseHu: 255,
    baseVolMl: 142.0,
    caliberMm: 41.0
  },
  {
    key: 'la',
    colorHex: '#f29e0b',
    vrtColor: '#c67d5a',
    name: w('Sol Atriyum (LA) & Apendiks (LAA)', 'Left Atrium (LA) & Appendage (LAA)'),
    category: 'chamber',
    baseHu: 375,
    baseVolMl: 68.5,
    caliberMm: 38.0
  },
  {
    key: 'ra',
    colorHex: '#56b4e9',
    vrtColor: '#8d6452',
    name: w('Sağ Atriyum (RA)', 'Right Atrium (RA)'),
    category: 'chamber',
    baseHu: 240,
    baseVolMl: 64.0,
    caliberMm: 37.0
  },
  {
    key: 'pa',
    colorHex: '#009e73',
    vrtColor: '#a87d65',
    name: w('Ana, Sağ ve Sol Pulmoner Arter (MPA / RPA / LPA)', 'Main, Right & Left Pulmonary Artery (MPA / RPA / LPA)'),
    category: 'vascular',
    baseHu: 268,
    baseVolMl: 74.2,
    caliberMm: 26.5
  },
  {
    key: 'pv',
    colorHex: '#795548',
    vrtColor: '#be8564',
    name: w('Pulmoner Venler (LSPV · LIPV · RSPV · RIPV)', 'Pulmonary Veins (LSPV · LIPV · RSPV · RIPV)'),
    category: 'vascular',
    baseHu: 362,
    baseVolMl: 42.0,
    caliberMm: 13.5
  },
  {
    key: 'caval',
    colorHex: '#5e35b1',
    vrtColor: '#7f5e52',
    name: w('Süperior & İnferior Vena Kava (SVC / IVC)', 'Superior & Inferior Vena Cava (SVC / IVC)'),
    category: 'vascular',
    baseHu: 290,
    baseVolMl: 52.0,
    caliberMm: 21.0
  },
  {
    key: 'cardiac-veins',
    colorHex: '#00e5ff',
    vrtColor: '#917464',
    name: w('Koroner Sinüs & Kardiyak Venler (CS / GCV / MCV)', 'Coronary Sinus & Cardiac Veins (CS / GCV / MCV)'),
    category: 'vascular',
    baseHu: 215,
    baseVolMl: 8.4,
    caliberMm: 8.2
  },
  {
    key: 'leaflets',
    colorHex: '#9e9e9e',
    vrtColor: '#d8b798',
    name: w('Aortik, Mitral, Triküspit & Pulmoner Kapak Yaprakçıkları', 'Aortic, Mitral, Tricuspid & Pulmonary Valve Leaflets'),
    category: 'structural',
    baseHu: 145,
    baseVolMl: 6.2,
    caliberMm: 24.5
  }
]);

// Ensure canonical SEGMENTATION_LABELS colors are synchronized where keys match
const canonicalColorMap = new Map(SEGMENTATION_LABELS.map((l) => [l.key, labelCss(l)]));

export function getSegmentationClass(key) {
  return CT_SEGMENTATION_CLASSES.find((c) => c.key === key) || CT_SEGMENTATION_CLASSES[0];
}

/**
 * Single visibility predicate shared by the report and all three canvases (VRT, MIP, MPR):
 * a segment is hidden when unchecked, or when it is a cardiac chamber and chambers are subtracted.
 */
export function isSegmentVisible(segKey, state = {}) {
  if ((state.hiddenSegments || []).includes(segKey)) return false;
  return !(state.chambersSubtracted && getSegmentationClass(segKey).category === 'chamber');
}

/**
 * Computes the quantitative segmentation table & metrics for the active clinical case.
 */
export function computeCtSegmentationReport(ctCase, state = {}, lang = 'tr') {
  const isTr = lang === 'tr';
  const c = ctCase || {};
  const chambersSubtracted = Boolean(state.chambersSubtracted);
  const isPe = c.plaqueType === 'pe';
  // PE: RV dilated, LV underfilled; RV/LV ratio is derived from these two calibers.
  const lvCaliberMm = isPe ? 40.0 : getSegmentationClass('lv').caliberMm;
  const rvCaliberMm = isPe ? 54.0 : getSegmentationClass('rv').caliberMm;
  const rvLvRatio = (rvCaliberMm / lvCaliberMm).toFixed(2);

  const rows = CT_SEGMENTATION_CLASSES.map((seg) => {
    const color = canonicalColorMap.get(seg.key) || seg.colorHex;
    let hu = seg.baseHu;
    let volMl = seg.baseVolMl;
    let caliberMm = seg.caliberMm;
    let finding = isTr ? 'Normal kontrast opasifikasyonu ve kontur' : 'Normal contrast opacification and contour';
    let status = 'ok';

    if (seg.key === 'lad' && c.vessel === 'LAD') {
      hu = c.plaqueHu ?? seg.baseHu;
      caliberMm = Number((seg.caliberMm * (1 - (c.maxStenosisPct || 0) / 100)).toFixed(2));
      if ((c.maxStenosisPct || 0) >= 50) {
        status = 'bad';
        finding = isTr
          ? `%${c.maxStenosisPct} darlık · Plak ${c.plaqueHu} HU · FFR_CT ${c.ffrCtDistal}`
          : `${c.maxStenosisPct}% stenosis · Plaque ${c.plaqueHu} HU · FFR_CT ${c.ffrCtDistal}`;
      }
    } else if (seg.key === 'rca' && c.vessel === 'RCA') {
      if (c.plaqueType === 'anomaly') {
        status = 'bad';
        finding = isTr
          ? 'Sol sinüsten interarteriyel malign çıkış (R-ACAOS)'
          : 'Malignant interarterial origin from left sinus (R-ACAOS)';
      } else if ((c.maxStenosisPct || 0) >= 20) {
        finding = isTr ? `%${c.maxStenosisPct} luminal darlık` : `${c.maxStenosisPct}% luminal narrowing`;
      }
    } else if (seg.key === 'pa' && c.plaqueType === 'pe') {
      hu = 45;
      status = 'bad';
      finding = isTr
        ? 'Sağ PA eyer/lober emboli dolum defekti (45 HU)'
        : 'Right PA saddle/lobar embolism filling defect (45 HU)';
    } else if (seg.key === 'rv' && isPe) {
      volMl = 198.0;
      caliberMm = rvCaliberMm;
      status = 'warn';
      finding = isTr ? `Akut sağ ventrikül dilatasyonu (RV/LV = ${rvLvRatio})` : `Acute RV strain & dilation (RV/LV = ${rvLvRatio})`;
    } else if (seg.key === 'lv' && isPe) {
      caliberMm = lvCaliberMm;
      finding = isTr ? 'Az dolmuş sol ventrikül (septal düzleşme)' : 'Underfilled LV (septal flattening)';
    } else if (seg.key === 'la' && c.plaqueType === 'laa') {
      const delayed = Boolean(state.delayedPhase60s);
      hu = delayed ? 355 : 68;
      status = delayed ? 'ok' : 'warn';
      finding = delayed
        ? (isTr ? '60 sn geç fazda LAA homojen opaklaştı (Staz)' : '60s delayed phase complete LAA opacification (Stasis)')
        : (isTr ? 'Erken faz LAA uç dolum defekti (68 HU)' : 'Early phase LAA tip filling defect (68 HU)');
    } else if (seg.key === 'leaflets' && c.plaqueType === 'tavi') {
      hu = 620;
      status = 'warn';
      finding = isTr
        ? 'Kalsifik aort kapak yaprakçıkları · Anülüs 468 mm²'
        : 'Calcific aortic valve leaflets · Annulus 468 mm²';
    }

    const visible = isSegmentVisible(seg.key, state);

    return {
      key: seg.key,
      name: seg.name[lang] || seg.name.en,
      category: seg.category,
      color,
      vrtColor: seg.vrtColor,
      hu,
      volMl,
      caliberMm,
      finding,
      status,
      visible
    };
  });

  const visibleCount = rows.filter((r) => r.visible).length;
  const totalVolumeMl = Number(
    rows.filter((r) => r.visible).reduce((acc, r) => acc + r.volMl, 0).toFixed(1)
  );

  return {
    chambersSubtracted,
    visibleCount,
    totalCount: rows.length,
    totalVolumeMl,
    rows
  };
}

function setupHiDpiCanvas(canvas, logicalW, logicalH) {
  if (!canvas) return null;
  const dpr = Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 2);
  const tw = Math.round(logicalW * dpr);
  const th = Math.round(logicalH * dpr);
  if (canvas.width !== tw || canvas.height !== th) {
    canvas.width = tw;
    canvas.height = th;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export const TRI_PANEL_CANVAS_SIZE = Object.freeze({ w: 380, h: 390 });

// Skull vertex height in model units (before the FOV yShift); used for fitting and the MPR envelope.
const HEAD_VERTEX_Y = 2.1;

// Model space: +x patient left, +y cranial, -z anterior (toward the viewer in an AP view).
const PERSPECTIVE_GAIN = 0.12;
// Epicardial vessels sit on the chamber surface, so they are drawn after the chamber they lie on.
const EPICARDIAL_DEPTH_BIAS = 0.3;

/**
 * Projects a 3D point [x, y, z] onto 2D [px, py, depth] for LAO/RAO (alphaDeg) and CRA/CAU (betaDeg).
 * Anterior points (smaller z) are nearer: they get a larger perspective factor and are painted last.
 */
function project3dPoint(pt, alphaDeg, betaDeg, view) {
  const a = ((Number(alphaDeg) || 0) * Math.PI) / 180;
  const b = ((Number(betaDeg) || 0) * Math.PI) / 180;

  const [x, y, z] = pt;
  // Yaw around Y (LAO/RAO)
  const x1 = x * Math.cos(a) + z * Math.sin(a);
  const z1 = -x * Math.sin(a) + z * Math.cos(a);
  // Pitch around X (CRA/CAU)
  const y2 = y * Math.cos(b) - z1 * Math.sin(b);
  const z2 = y * Math.sin(b) + z1 * Math.cos(b);

  const perspective = 1 - z2 * PERSPECTIVE_GAIN;
  return {
    x: view.cx + x1 * view.scale * perspective,
    y: view.cy - y2 * view.scale * perspective,
    z: z2
  };
}

/**
 * Fits the whole FOV (vessels, chambers and, for head/neck FOVs, the skull vertex) inside the canvas.
 * The same fit is used by all three panels so they stay registered.
 */
function computeViewportFit(graph, W, H) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const extend = (x, y, r = 0) => {
    minX = Math.min(minX, x - r);
    maxX = Math.max(maxX, x + r);
    minY = Math.min(minY, y - r);
    maxY = Math.max(maxY, y + r);
  };
  graph.tubes.forEach((t) => t.points.forEach(([x, y]) => extend(x, y, t.radius)));
  graph.chambers.forEach((ch) => extend(ch.center[0], ch.center[1], Math.max(ch.rx, ch.ry)));
  if (graph.frame.includeNeckHead) extend(0, HEAD_VERTEX_Y + graph.frame.yShift);

  const marginTop = 34;
  const marginBottom = 30;
  const marginX = 34;
  const availW = W - marginX * 2;
  const availH = H - marginTop - marginBottom;
  // 0.94 leaves room for rotation and perspective growth of near structures
  const scale = Math.min(availW / Math.max(0.5, maxX - minX), availH / Math.max(0.5, maxY - minY), 175) * 0.94;
  return {
    scale,
    cx: marginX + availW / 2 - ((minX + maxX) / 2) * scale,
    cy: marginTop + availH / 2 + ((minY + maxY) / 2) * scale
  };
}


function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function segColorFor(segKey) {
  return canonicalColorMap.get(segKey) || getSegmentationClass(segKey).colorHex;
}

function tracePolyline(ctx, pts2d) {
  ctx.beginPath();
  pts2d.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(p.x, p.y);
    else {
      const prev = pts2d[idx - 1];
      ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + p.x) / 2, (prev.y + p.y) / 2);
    }
  });
  const last = pts2d[pts2d.length - 1];
  ctx.lineTo(last.x, last.y);
}

function pushTubeHits(hitList, tube, pts2d, r, lang) {
  for (const p of pts2d) {
    hitList.push({ x: p.x, y: p.y, r, segKey: tube.segKey, label: tube.label[lang] || tube.label.en, hu: tube.hu });
  }
}

/** Shared scene preparation: graph, viewport fit and the visibility-filtered structures. */
function prepareTriPanelScene(ctCase, state, W, H) {
  const fovMode = state.fovMode || 'aorto-cervical';
  const graph = buildCt3dVolumeGraph(fovMode, ctCase);
  const view = computeViewportFit(graph, W, H);
  return {
    fovMode,
    graph,
    view,
    alphaDeg: Number(state.vrtAlphaDeg ?? 0),
    betaDeg: Number(state.vrtBetaDeg ?? 0),
    selectedSegKey: state.selectedSegKey || null,
    chambers: graph.chambers.filter((ch) => isSegmentVisible(ch.segKey, state)),
    tubes: graph.tubes.filter((t) => isSegmentVisible(t.segKey, state)),
    calcifications: graph.calcifications.filter((ca) => isSegmentVisible(ca.segKey, state))
  };
}

/**
 * Generates dense 3D vascular & chamber centerline tubes and volumetric blobs for the 3-panel VRT / MIP / MPR workstation.
 */
export function buildCt3dVolumeGraph(fovMode = 'aorto-cervical', ctCase = null) {
  const tubes = [];
  const chambers = [];
  const calcifications = [];

  const includeNeckHead = fovMode === 'aorto-cervical' || fovMode === 'full-cardiothoracic';
  const includeHeartCoronary = fovMode === 'cardiac-coronary' || fovMode === 'full-cardiothoracic';

  // 1. Aortic Root, Ascending Aorta, Aortic Arch & Proximal Descending Aorta (always present)
  const yShift = fovMode === 'aorto-cervical' ? -0.58 : fovMode === 'full-cardiothoracic' ? -0.18 : 0.22;

  tubes.push({
    id: 'ascending-arch-aorta',
    segKey: 'aorta',
    label: { tr: 'Arkus Aort ve Çıkan Aort', en: 'Aortic Arch & Ascending Aorta' },
    hu: 405,
    radius: 0.145,
    points: [
      [-0.22, -0.62 + yShift, -0.08],
      [-0.26, -0.32 + yShift, -0.10],
      [-0.22, -0.06 + yShift, -0.06],
      [-0.08, 0.08 + yShift, 0.02],
      [0.12, 0.05 + yShift, 0.10],
      [0.24, -0.18 + yShift, 0.18],
      [0.26, -0.62 + yShift, 0.22]
    ]
  });

  if (includeNeckHead) {
    // Brachiocephalic Trunk (BCT)
    tubes.push({
      id: 'bct',
      segKey: 'aorta',
      label: { tr: 'Brakiyosefalik Trunkus (BCT)', en: 'Brachiocephalic Trunk (BCT)' },
      hu: 395,
      radius: 0.072,
      points: [
        [-0.19, 0.01 + yShift, -0.05],
        [-0.25, 0.19 + yShift, -0.04],
        [-0.28, 0.34 + yShift, -0.02]
      ]
    });

    // Right Subclavian Artery (RSCA) + internal thoracic & branches
    tubes.push({
      id: 'rsca',
      segKey: 'aorta',
      label: { tr: 'Sağ Subklavyen Arter (RSCA)', en: 'Right Subclavian Artery (RSCA)' },
      hu: 385,
      radius: 0.052,
      points: [
        [-0.28, 0.34 + yShift, -0.02],
        [-0.46, 0.38 + yShift, -0.01],
        [-0.68, 0.31 + yShift, 0.02],
        [-0.88, 0.20 + yShift, 0.04]
      ]
    });

    // Left Subclavian Artery (LSCA) extending laterally like the reference image
    tubes.push({
      id: 'lsca',
      segKey: 'aorta',
      label: { tr: 'Sol Subklavyen Arter (LSCA)', en: 'Left Subclavian Artery (LSCA)' },
      hu: 385,
      radius: 0.052,
      points: [
        [0.10, 0.05 + yShift, 0.09],
        [0.14, 0.34 + yShift, 0.06],
        [0.42, 0.39 + yShift, 0.04],
        [0.74, 0.30 + yShift, 0.05],
        [0.98, 0.18 + yShift, 0.06]
      ]
    });

    // Right Common Carotid (RCCA) -> Bulb -> Right ICA (cervical, petrous, cavernous, siphon)
    tubes.push({
      id: 'rcca-rica',
      segKey: 'carotid-willis',
      label: { tr: 'Sağ Ana ve İnternal Karotis Arter (RCCA / RICA)', en: 'Right Common & Internal Carotid Artery (RCCA / RICA)' },
      hu: 392,
      radius: 0.044,
      points: [
        [-0.28, 0.34 + yShift, -0.02],
        [-0.27, 0.58 + yShift, 0.00],
        [-0.26, 0.84 + yShift, 0.02],
        [-0.28, 1.05 + yShift, 0.03],
        [-0.22, 1.24 + yShift, 0.05],
        [-0.24, 1.38 + yShift, 0.00],
        [-0.14, 1.46 + yShift, -0.04],
        [-0.12, 1.56 + yShift, -0.02]
      ]
    });

    // Left Common Carotid (LCCA) -> Bulb -> Left ICA
    tubes.push({
      id: 'lcca-lica',
      segKey: 'carotid-willis',
      label: { tr: 'Sol Ana ve İnternal Karotis Arter (LCCA / LICA)', en: 'Left Common & Internal Carotid Artery (LCCA / LICA)' },
      hu: 392,
      radius: 0.044,
      points: [
        [-0.06, 0.07 + yShift, 0.01],
        [0.10, 0.36 + yShift, 0.01],
        [0.12, 0.62 + yShift, 0.02],
        [0.13, 0.86 + yShift, 0.03],
        [0.15, 1.06 + yShift, 0.04],
        [0.11, 1.24 + yShift, 0.05],
        [0.14, 1.38 + yShift, 0.00],
        [0.06, 1.46 + yShift, -0.04],
        [0.05, 1.56 + yShift, -0.02]
      ]
    });

    // Right & Left Vertebral Arteries (with cervical loops) -> Basilar Artery
    tubes.push({
      id: 'r-vertebral',
      segKey: 'carotid-willis',
      label: { tr: 'Sağ Vertebral Arter (V1-V4)', en: 'Right Vertebral Artery (V1-V4)' },
      hu: 372,
      radius: 0.028,
      points: [
        [-0.38, 0.36 + yShift, 0.02],
        [-0.34, 0.64 + yShift, 0.08],
        [-0.33, 0.94 + yShift, 0.10],
        [-0.42, 1.12 + yShift, 0.12],
        [-0.26, 1.24 + yShift, 0.14],
        [-0.04, 1.36 + yShift, 0.12]
      ]
    });

    tubes.push({
      id: 'l-vertebral-basilar',
      segKey: 'carotid-willis',
      label: { tr: 'Sol Vertebral ve Baziler Arter', en: 'Left Vertebral & Basilar Artery' },
      hu: 376,
      radius: 0.030,
      points: [
        [0.24, 0.36 + yShift, 0.05],
        [0.22, 0.64 + yShift, 0.08],
        [0.21, 0.94 + yShift, 0.10],
        [0.30, 1.12 + yShift, 0.12],
        [0.16, 1.24 + yShift, 0.14],
        [-0.04, 1.36 + yShift, 0.12],
        [-0.04, 1.54 + yShift, 0.08]
      ]
    });

    // External Carotid Branches (ECA) & Circle of Willis (MCA M1/M2/M3 Sylvian arborization & ACA A1/A2)
    for (const side of [-1, 1]) {
      const cxBase = side < 0 ? -0.26 : 0.13;
      tubes.push({
        id: side < 0 ? 'reca' : 'leca',
        segKey: 'carotid-willis',
        label: side < 0
          ? { tr: 'Sağ Eksternal Karotis Dalları (RECA)', en: 'Right External Carotid Branches (RECA)' }
          : { tr: 'Sol Eksternal Karotis Dalları (LECA)', en: 'Left External Carotid Branches (LECA)' },
        hu: 355,
        radius: 0.022,
        points: [
          [cxBase, 0.86 + yShift, 0.02],
          [cxBase + side * 0.14, 1.02 + yShift, -0.04],
          [cxBase + side * 0.22, 1.22 + yShift, -0.05],
          [cxBase + side * 0.26, 1.42 + yShift, -0.02]
        ]
      });

      // MCA M1 -> M2 -> M3 cortical branches
      const icaTopX = side < 0 ? -0.12 : 0.05;
      tubes.push({
        id: side < 0 ? 'rmca' : 'lmca-cerebral',
        segKey: 'carotid-willis',
        label: side < 0
          ? { tr: 'Sağ Orta Serebral Arter (Sağ MCA M1-M3)', en: 'Right Middle Cerebral Artery (Right MCA M1-M3)' }
          : { tr: 'Sol Orta Serebral Arter (Sol MCA M1-M3)', en: 'Left Middle Cerebral Artery (Left MCA M1-M3)' },
        hu: 365,
        radius: 0.024,
        points: [
          [icaTopX, 1.56 + yShift, -0.02],
          [icaTopX + side * 0.18, 1.60 + yShift, -0.01],
          [icaTopX + side * 0.30, 1.72 + yShift, 0.02],
          [icaTopX + side * 0.34, 1.88 + yShift, 0.04]
        ]
      });

      tubes.push({
        id: side < 0 ? 'rmca-sup' : 'lmca-sup',
        segKey: 'carotid-willis',
        label: { tr: 'Serebral Kortikal Dal (MCA M2/M3)', en: 'Cerebral Cortical Branch (MCA M2/M3)' },
        hu: 345,
        radius: 0.016,
        points: [
          [icaTopX + side * 0.18, 1.60 + yShift, -0.01],
          [icaTopX + side * 0.26, 1.80 + yShift, -0.04],
          [icaTopX + side * 0.22, 1.96 + yShift, -0.02]
        ]
      });
    }

    // Anterior Cerebral Arteries (ACA A1/A2 pericallosal)
    tubes.push({
      id: 'aca-a1-a2',
      segKey: 'carotid-willis',
      label: { tr: 'Anterior Serebral Arter (ACA A1/A2 & AComm)', en: 'Anterior Cerebral Artery (ACA A1/A2 & AComm)' },
      hu: 360,
      radius: 0.020,
      points: [
        [-0.12, 1.56 + yShift, -0.02],
        [-0.04, 1.64 + yShift, -0.06],
        [-0.03, 1.86 + yShift, -0.05],
        [-0.04, 2.02 + yShift, -0.02]
      ]
    });

    // Cavernous ICA / Carotid Siphon Calcification spots (seen glowing white in the MIP reference image)
    calcifications.push(
      { pos: [-0.14, 1.46 + yShift, -0.04], r: 0.026, hu: 940, segKey: 'carotid-willis', label: w('Sağ Kavernöz ICA Kalsifikasyonu', 'Right Cavernous ICA Calcification') },
      { pos: [0.06, 1.46 + yShift, -0.04], r: 0.026, hu: 920, segKey: 'carotid-willis', label: w('Sol Kavernöz ICA Kalsifikasyonu', 'Left Cavernous ICA Calcification') }
    );
  }

  const hy = fovMode === 'full-cardiothoracic' ? -0.52 : -0.08;
  if (includeHeartCoronary) {

    // Cardiac Chambers (LV, RV, LA, RA, PA)
    chambers.push(
      {
        id: 'lv-chamber',
        segKey: 'lv',
        label: { tr: 'Sol Ventrikül (LV)', en: 'Left Ventricle (LV)' },
        center: [0.22, -0.34 + hy, -0.08],
        rx: 0.32,
        ry: 0.42,
        angle: -0.35,
        hu: 388
      },
      {
        id: 'rv-chamber',
        segKey: 'rv',
        label: { tr: 'Sağ Ventrikül (RV)', en: 'Right Ventricle (RV)' },
        center: [-0.12, -0.32 + hy, -0.22],
        rx: 0.28,
        ry: 0.36,
        angle: -0.2,
        hu: 255
      },
      {
        id: 'la-chamber',
        segKey: 'la',
        label: { tr: 'Sol Atriyum & LAA', en: 'Left Atrium & LAA' },
        center: [0.18, 0.06 + hy, 0.18],
        rx: 0.26,
        ry: 0.22,
        angle: 0.1,
        hu: 375
      },
      {
        id: 'ra-chamber',
        segKey: 'ra',
        label: { tr: 'Sağ Atriyum (RA)', en: 'Right Atrium (RA)' },
        center: [-0.36, -0.08 + hy, 0.05],
        rx: 0.22,
        ry: 0.26,
        angle: 0.15,
        hu: 240
      },
      {
        id: 'pa-trunk',
        segKey: 'pa',
        label: { tr: 'Ana Pulmoner Arter (MPA)', en: 'Main Pulmonary Artery (MPA)' },
        center: [0.04, 0.16 + hy, -0.16],
        rx: 0.16,
        ry: 0.24,
        angle: -0.25,
        hu: 268
      }
    );

    // LM -> LAD -> D1/D2 Coronary Tree
    tubes.push({
      id: 'lm-lad',
      segKey: 'lad',
      label: { tr: 'Sol Ana (LM) ve Ön İnen Koroner Arter (LAD)', en: 'Left Main (LM) & Left Anterior Descending (LAD)' },
      hu: 385,
      radius: 0.036,
      points: [
        [-0.10, -0.02 + hy, -0.10],
        [0.05, -0.04 + hy, -0.16],
        [0.14, -0.20 + hy, -0.24],
        [0.20, -0.44 + hy, -0.26],
        [0.26, -0.68 + hy, -0.20]
      ]
    });

    tubes.push({
      id: 'lad-d1',
      segKey: 'lad',
      label: { tr: 'Birinci Diyagonal Dal (D1)', en: 'First Diagonal Branch (D1)' },
      hu: 365,
      radius: 0.022,
      points: [
        [0.14, -0.20 + hy, -0.24],
        [0.32, -0.32 + hy, -0.20],
        [0.44, -0.48 + hy, -0.14]
      ]
    });

    // LCx -> OM1
    tubes.push({
      id: 'lcx-om1',
      segKey: 'lcx',
      label: { tr: 'Sirkumfleks Koroner Arter (LCx & OM1)', en: 'Left Circumflex Artery (LCx & OM1)' },
      hu: 372,
      radius: 0.030,
      points: [
        [0.05, -0.04 + hy, -0.16],
        [0.26, -0.10 + hy, -0.04],
        [0.42, -0.28 + hy, 0.04],
        [0.46, -0.50 + hy, 0.06]
      ]
    });

    // RCA -> Acute Marginal -> PDA
    tubes.push({
      id: 'rca-pda',
      segKey: 'rca',
      label: { tr: 'Sağ Koroner Arter (RCA & PDA)', en: 'Right Coronary Artery (RCA & PDA)' },
      hu: 378,
      radius: 0.034,
      points: [
        [-0.22, -0.04 + hy, -0.12],
        [-0.42, -0.18 + hy, -0.14],
        [-0.44, -0.42 + hy, -0.06],
        [-0.24, -0.62 + hy, 0.06],
        [0.04, -0.68 + hy, 0.10]
      ]
    });

    // Coronary Sinus / Great Cardiac Vein
    tubes.push({
      id: 'cs-gcv',
      segKey: 'cardiac-veins',
      label: { tr: 'Koroner Sinüs ve Büyük Kardiyak Ven (CS / GCV)', en: 'Coronary Sinus & Great Cardiac Vein (CS / GCV)' },
      hu: 215,
      radius: 0.026,
      points: [
        [0.18, -0.40 + hy, -0.22],
        [0.36, -0.16 + hy, 0.02],
        [0.12, -0.14 + hy, 0.16],
        [-0.24, -0.16 + hy, 0.12]
      ]
    });

    if (ctCase?.plaqueType === 'calcified' || (ctCase?.cacScore ?? 0) >= 100) {
      calcifications.push(
        { pos: [0.14, -0.20 + hy, -0.24], r: 0.036, hu: 910, segKey: 'lad', label: w('Proksimal LAD Kalsifik Plak', 'Proximal LAD Calcified Plaque') },
        { pos: [-0.42, -0.18 + hy, -0.14], r: 0.030, hu: 860, segKey: 'rca', label: w('Orta RCA Kalsifik Plak', 'Mid RCA Calcified Plaque') }
      );
    }
  }

  return { tubes, chambers, calcifications, frame: { fovMode, yShift, hy, includeNeckHead, includeHeartCoronary } };
}

/**
 * Draws the radiological orientation markers (H, F, R, L), 5mm/div vertical ruler, and 'A' orientation cube
 * matching the uploaded clinical CT workstation output.
 */
function drawClinicalCtViewportChrome(ctx, W, H, opts = {}) {
  const markerColor = opts.markerColor || '#facc15';
  const showRuler = opts.showRuler !== false;
  const showCube = opts.showCube !== false;

  ctx.save();
  ctx.font = '700 15px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = markerColor;
  ctx.textAlign = 'center';
  ctx.fillText('H', W / 2, 20);
  ctx.fillText('F', W / 2, H - 10);
  ctx.fillText('R', 16, H / 2 + 5);
  ctx.fillText('L', W - (showRuler ? 32 : 16), H / 2 + 5);

  if (showRuler) {
    const rx = W - 12;
    const topY = 74;
    const botY = H - 72;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 8.5px ui-monospace, SFMono-Regular, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('5mm/div', rx, topY - 8);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx, topY);
    ctx.lineTo(rx, botY);
    for (let y = topY, i = 0; y <= botY; y += 7, i += 1) {
      const tickLen = i % 5 === 0 ? 7 : 3.5;
      ctx.moveTo(rx - tickLen, y);
      ctx.lineTo(rx, y);
    }
    ctx.stroke();
  }

  if (showCube) {
    const bx = W - 46;
    const by = H - 44;
    const bw = 32;
    const bh = 32;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('A', bx + bw / 2, by + 21);

    ctx.font = '700 6.5px system-ui, -apple-system, sans-serif';
    ctx.fillText('H', bx + bw / 2, by + 7);
    ctx.fillText('F', bx + bw / 2, by + bh - 2);
    ctx.fillText('R', bx + 5, by + bh / 2 + 2);
    ctx.fillText('L', bx + bw - 5, by + bh / 2 + 2);
  }
  ctx.restore();
}

function drawVrtChamber(ctx, ch, p, scene, segColorMode, hitList, lang) {
  const rx = ch.rx * scene.view.scale;
  const ry = ch.ry * scene.view.scale;
  const segCls = getSegmentationClass(ch.segKey);
  const baseCol = segColorMode ? segColorFor(ch.segKey) : segCls.vrtColor;
  const { selectedSegKey } = scene;

  const grad = ctx.createRadialGradient(p.x - rx * 0.28, p.y - ry * 0.28, rx * 0.1, p.x, p.y, Math.max(rx, ry));
  grad.addColorStop(0, '#fae5cf');
  grad.addColorStop(0.45, baseCol);
  grad.addColorStop(1, '#3b1d12');

  ctx.save();
  ctx.globalAlpha = selectedSegKey && selectedSegKey !== ch.segKey ? 0.35 : 0.84;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, rx, ry, ch.angle, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  if (selectedSegKey === ch.segKey) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }
  ctx.restore();

  hitList.push({ x: p.x, y: p.y, r: Math.max(rx, ry) * 0.85, segKey: ch.segKey, label: ch.label[lang] || ch.label.en, hu: ch.hu });
}

function drawVrtTube(ctx, tube, pts2d, scene, segColorMode, hitList, lang) {
  const segCls = getSegmentationClass(tube.segKey);
  const segHex = segColorFor(tube.segKey);
  const { selectedSegKey } = scene;
  const isDimmed = selectedSegKey && selectedSegKey !== tube.segKey;
  const baseW = Math.max(2.2, tube.radius * scene.view.scale * 1.45);

  ctx.save();
  ctx.globalAlpha = isDimmed ? 0.28 : 1.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Pass 1: deep copper/brown edge shadow for the cylindrical volume look
  tracePolyline(ctx, pts2d);
  ctx.strokeStyle = segColorMode ? '#0f172a' : '#4a2514';
  ctx.lineWidth = baseW * 1.18;
  ctx.stroke();

  // Pass 2: main VRT transfer-function body
  tracePolyline(ctx, pts2d);
  ctx.strokeStyle = segColorMode ? segHex : segCls.vrtColor;
  ctx.lineWidth = baseW * 0.86;
  ctx.stroke();

  // Pass 3: specular ridge highlight
  tracePolyline(ctx, pts2d);
  ctx.strokeStyle = segColorMode ? '#ffffff' : '#fff1df';
  ctx.globalAlpha = isDimmed ? 0.15 : (segColorMode ? 0.42 : 0.65);
  ctx.lineWidth = Math.max(1.0, baseW * 0.32);
  ctx.stroke();

  if (selectedSegKey === tube.segKey) {
    tracePolyline(ctx, pts2d);
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = baseW * 1.32;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  pushTubeHits(hitList, tube, pts2d, Math.max(10, baseW * 0.8), lang);
}

/**
 * PANEL 1 (LEFT): 3D VRT (Volume Rendering Technique) or 3D Color Segmentation Map Canvas
 */
export function renderCtTriPanelVrtCanvas(canvas, ctCase, state = {}, lang = 'tr') {
  const { w: W, h: H } = TRI_PANEL_CANVAS_SIZE;
  const ctx = setupHiDpiCanvas(canvas, W, H);
  if (!ctx) return;

  const segColorMode = Boolean(state.segColorMode);
  const scene = prepareTriPanelScene(ctCase, state, W, H);
  const project = (pt) => project3dPoint(pt, scene.alphaDeg, scene.betaDeg, scene.view);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  // One painter's list for chambers and vessels: posterior (larger z) first, anterior last.
  const drawList = [
    ...scene.chambers.map((ch) => {
      const p = project(ch.center);
      return { kind: 'chamber', item: ch, p, depth: p.z };
    }),
    ...scene.tubes.map((tube) => {
      const pts2d = tube.points.map(project);
      const meanZ = pts2d.reduce((acc, p) => acc + p.z, 0) / pts2d.length;
      const category = getSegmentationClass(tube.segKey).category;
      const epicardial = category === 'coronary' || tube.segKey === 'cardiac-veins';
      return { kind: 'tube', item: tube, pts2d, depth: meanZ - (epicardial ? EPICARDIAL_DEPTH_BIAS : 0) };
    })
  ].sort((a, b) => b.depth - a.depth);

  const hitList = [];
  for (const entry of drawList) {
    if (entry.kind === 'chamber') drawVrtChamber(ctx, entry.item, entry.p, scene, segColorMode, hitList, lang);
    else drawVrtTube(ctx, entry.item, entry.pts2d, scene, segColorMode, hitList, lang);
  }

  drawClinicalCtViewportChrome(ctx, W, H, { markerColor: '#facc15', showRuler: true, showCube: true });

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 10.5px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(
    segColorMode
      ? (lang === 'tr' ? '3B OTOMATİK SEGMENTASYON' : '3D AUTO-SEGMENTATION')
      : (lang === 'tr' ? '3B VRT (KEMİKSİZ DAMAR)' : '3D VRT (BONE-SUBTRACTED)'),
    12,
    20
  );

  // Later entries are nearer; reverse so hit-testing prefers what is on top
  canvas.__ctSegHits = hitList.reverse();
}

/**
 * PANEL 2 (CENTER): 3D MIP (Maximum Intensity Projection) Grayscale Angiographic Canvas
 */
export function renderCtTriPanelMipCanvas(canvas, ctCase, state = {}, lang = 'tr') {
  const { w: W, h: H } = TRI_PANEL_CANVAS_SIZE;
  const ctx = setupHiDpiCanvas(canvas, W, H);
  if (!ctx) return;

  const segOverlayOn = Boolean(state.segColorMode);
  const scene = prepareTriPanelScene(ctCase, state, W, H);
  const { view, selectedSegKey, graph } = scene;
  const project = (pt) => project3dPoint(pt, scene.alphaDeg, scene.betaDeg, view);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  // 1. Faint cranial parenchymal silhouette, only in FOVs that include the head
  if (graph.frame.includeNeckHead) {
    const headCenter = project([-0.04, 1.66 + graph.frame.yShift, 0.02]);
    ctx.save();
    ctx.fillStyle = 'rgba(130, 136, 145, 0.34)';
    ctx.beginPath();
    ctx.ellipse(headCenter.x, headCenter.y, 0.59 * view.scale, 0.53 * view.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const hitList = [];

  // 2. Chambers as translucent grayscale MIP projections (order-independent)
  for (const ch of scene.chambers) {
    const p = project(ch.center);
    const rx = ch.rx * view.scale;
    const ry = ch.ry * view.scale;

    ctx.save();
    ctx.fillStyle = 'rgba(148, 156, 168, 0.28)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx, ry, ch.angle, 0, Math.PI * 2);
    ctx.fill();
    if (segOverlayOn || selectedSegKey === ch.segKey) {
      ctx.strokeStyle = segColorFor(ch.segKey);
      ctx.lineWidth = selectedSegKey === ch.segKey ? 2.2 : 1.2;
      ctx.stroke();
    }
    ctx.restore();

    hitList.push({ x: p.x, y: p.y, r: Math.max(rx, ry) * 0.85, segKey: ch.segKey, label: ch.label[lang] || ch.label.en, hu: ch.hu });
  }

  // 3. MIP vascular tree
  for (const tube of scene.tubes) {
    const pts2d = tube.points.map(project);
    const baseW = Math.max(2.0, tube.radius * view.scale * 1.38);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    tracePolyline(ctx, pts2d);
    ctx.strokeStyle = 'rgba(135, 142, 152, 0.55)';
    ctx.lineWidth = baseW * 1.15;
    ctx.stroke();

    tracePolyline(ctx, pts2d);
    ctx.strokeStyle = segOverlayOn ? segColorFor(tube.segKey) : '#d4dae3';
    ctx.lineWidth = baseW * 0.78;
    ctx.stroke();

    if (selectedSegKey === tube.segKey) {
      tracePolyline(ctx, pts2d);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = baseW * 1.28;
      ctx.stroke();
    }
    ctx.restore();

    pushTubeHits(hitList, tube, pts2d, Math.max(10, baseW * 0.8), lang);
  }

  // 4. Super-bright calcifications (>800 HU)
  for (const ca of scene.calcifications) {
    const p = project(ca.pos);
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(3.5, ca.r * view.scale), 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();
  }

  drawClinicalCtViewportChrome(ctx, W, H, { markerColor: '#f8fafc', showRuler: true, showCube: true });

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 10.5px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(lang === 'tr' ? '3B MIP (MAKS. YOĞUNLUK)' : '3D MIP (MAX INTENSITY)', 12, 20);

  canvas.__ctSegHits = hitList;
}

/** Head, neck and upper-thorax coronal envelope (aortic arch and supra-aortic FOVs). */
function paintCervicalEnvelope(ctx, gray, P, frame, H, view) {
  const ys = frame.yShift;
  const pt = (u, v) => P(u, v + ys);
  const bottomY = H - 8;
  const sh = pt(1.29, 0.205);
  const shL = pt(-1.29, 0.205);

  ctx.fillStyle = gray(48);
  ctx.beginPath();
  let q = pt(-0.69, HEAD_VERTEX_Y);
  ctx.moveTo(q.x, q.y);
  q = pt(0.69, HEAD_VERTEX_Y);
  ctx.lineTo(q.x, q.y);
  let c1 = pt(0.72, 1.3);
  let e1 = pt(0.53, 1.03);
  ctx.quadraticCurveTo(c1.x, c1.y, e1.x, e1.y);
  c1 = pt(0.56, 0.44);
  ctx.quadraticCurveTo(c1.x, c1.y, sh.x, sh.y);
  ctx.lineTo(pt(1.39, 0).x, bottomY);
  ctx.lineTo(pt(-1.39, 0).x, bottomY);
  ctx.lineTo(shL.x, shL.y);
  c1 = pt(-0.56, 0.44);
  e1 = pt(-0.53, 1.03);
  ctx.quadraticCurveTo(c1.x, c1.y, e1.x, e1.y);
  c1 = pt(-0.72, 1.3);
  q = pt(-0.69, HEAD_VERTEX_Y);
  ctx.quadraticCurveTo(c1.x, c1.y, q.x, q.y);
  ctx.closePath();
  ctx.fill();

  // Lungs: apices only in the arch/neck FOV, full fields when the heart is included
  ctx.fillStyle = gray(-790);
  ctx.beginPath();
  for (const side of [-1, 1]) {
    const lc = frame.includeHeartCoronary ? P(side * 0.72, frame.hy + 0.07) : pt(side * 0.69, 0.012);
    const lry = frame.includeHeartCoronary ? 0.85 : 0.48;
    ctx.moveTo(lc.x + 0.43 * view.scale, lc.y);
    ctx.ellipse(lc.x, lc.y, 0.43 * view.scale, lry * view.scale, side * -0.12, 0, Math.PI * 2);
  }
  ctx.fill();

  // Trachea and pharyngeal / paranasal air
  ctx.fillStyle = gray(-950);
  const trTop = pt(-0.086, 0.75);
  const trBot = pt(0.086, 0.3);
  roundedRectPath(ctx, trTop.x, trTop.y, trBot.x - trTop.x, trBot.y - trTop.y, 0.07 * view.scale);
  ctx.fill();
  ctx.beginPath();
  for (const [u, v, rx, ry] of [[-0.094, 1.93, 0.117, 0.125], [0.094, 1.93, 0.117, 0.125], [0, 1.635, 0.125, 0.172]]) {
    const c = pt(u, v);
    ctx.moveTo(c.x + rx * view.scale, c.y);
    ctx.ellipse(c.x, c.y, rx * view.scale, ry * view.scale, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  // Skull base petrous ridges
  ctx.fillStyle = gray(780);
  ctx.beginPath();
  for (const side of [-1, 1]) {
    const c = pt(side * 0.4375, 1.43);
    ctx.moveTo(c.x + 0.17 * view.scale, c.y);
    ctx.ellipse(c.x, c.y, 0.17 * view.scale, 0.094 * view.scale, side * -0.3, 0, Math.PI * 2);
  }
  ctx.fill();

  paintRibs(ctx, gray, (u, v) => pt(u, v), frame.includeHeartCoronary ? 7 : 4, view);
}

/** Thoracic coronal envelope for the cardiac/coronary FOV (no head or neck anatomy). */
function paintThoracicEnvelope(ctx, gray, P, frame, W, H, view) {
  ctx.fillStyle = gray(48);
  const top = P(0, 0.62 + frame.yShift);
  roundedRectPath(ctx, 6, Math.max(6, top.y), W - 12, H - Math.max(6, top.y) - 6, 0.3 * view.scale);
  ctx.fill();

  ctx.fillStyle = gray(-790);
  ctx.beginPath();
  for (const side of [-1, 1]) {
    const lc = P(side * 0.74, frame.hy - 0.02);
    ctx.moveTo(lc.x + 0.44 * view.scale, lc.y);
    ctx.ellipse(lc.x, lc.y, 0.44 * view.scale, 0.72 * view.scale, side * -0.1, 0, Math.PI * 2);
  }
  ctx.fill();

  ctx.fillStyle = gray(-950);
  const trTop = P(-0.08, 0.75 + frame.yShift);
  const trBot = P(0.08, 0.3 + frame.yShift);
  roundedRectPath(ctx, trTop.x, trTop.y, trBot.x - trTop.x, trBot.y - trTop.y, 0.06 * view.scale);
  ctx.fill();

  paintRibs(ctx, gray, (u, v) => P(u, v + frame.yShift), 6, view);
}

function paintRibs(ctx, gray, pt, count, view) {
  ctx.fillStyle = gray(780);
  ctx.strokeStyle = gray(880);
  ctx.lineWidth = 2;
  for (let i = 0; i < count; i += 1) {
    const v = 0.103 - 0.219 * i;
    const u = Math.min(1.3, 0.875 + 0.109 * Math.min(i, 3));
    for (const side of [-1, 1]) {
      const c = pt(side * u, v);
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 0.11 * view.scale, 0.047 * view.scale, side * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

/**
 * PANEL 3 (RIGHT): Coronal-Oblique CT MPR Slice + Automated Anatomical Segmentation Overlay Canvas
 */
export function renderCtTriPanelMprCanvas(canvas, ctCase, state = {}, lang = 'tr') {
  const { w: W, h: H } = TRI_PANEL_CANVAS_SIZE;
  const ctx = setupHiDpiCanvas(canvas, W, H);
  if (!ctx) return;

  const preset = findWindowPreset(state.windowPresetId);
  const winW = preset.width;
  const winL = preset.level;
  const segOverlayOn = state.mprSegmentationOverlay !== false;
  const scene = prepareTriPanelScene(ctCase, state, W, H);
  const { view, selectedSegKey, graph } = scene;
  const project = (pt) => project3dPoint(pt, 0, 0, view);
  const P = (u, v) => project([u, v, 0]);

  const gray = (hu) => {
    const g = huToGrayscale(hu, winW, winL);
    return `rgb(${g}, ${g}, ${g})`;
  };

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  if (graph.frame.includeNeckHead) paintCervicalEnvelope(ctx, gray, P, graph.frame, H, view);
  else paintThoracicEnvelope(ctx, gray, P, graph.frame, W, H, view);

  const hitList = [];

  for (const ch of scene.chambers) {
    const p = project(ch.center);
    const rx = ch.rx * view.scale * 0.92;
    const ry = ch.ry * view.scale * 0.92;
    const segColor = segColorFor(ch.segKey);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx, ry, ch.angle, 0, Math.PI * 2);
    ctx.fillStyle = gray(ch.hu);
    ctx.fill();

    if (segOverlayOn) {
      ctx.fillStyle = segColor + '38';
      ctx.fill();
      ctx.strokeStyle = segColor;
      ctx.lineWidth = selectedSegKey === ch.segKey ? 2.8 : 1.5;
      ctx.stroke();
    }
    ctx.restore();

    hitList.push({ x: p.x, y: p.y, r: Math.max(rx, ry) * 0.85, segKey: ch.segKey, label: ch.label[lang] || ch.label.en, hu: ch.hu });
  }

  for (const tube of scene.tubes) {
    const pts2d = tube.points.map(project);
    const baseW = Math.max(2.6, tube.radius * view.scale * 1.35);
    const segColor = segColorFor(tube.segKey);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    tracePolyline(ctx, pts2d);
    ctx.strokeStyle = gray(tube.hu);
    ctx.lineWidth = baseW;
    ctx.stroke();

    if (segOverlayOn) {
      tracePolyline(ctx, pts2d);
      ctx.strokeStyle = segColor;
      ctx.globalAlpha = selectedSegKey === tube.segKey ? 0.95 : 0.72;
      ctx.lineWidth = selectedSegKey === tube.segKey ? baseW + 3 : baseW + 1.2;
      ctx.stroke();

      tracePolyline(ctx, pts2d);
      ctx.strokeStyle = gray(tube.hu);
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = Math.max(1.2, baseW * 0.65);
      ctx.stroke();
    }
    ctx.restore();

    pushTubeHits(hitList, tube, pts2d, Math.max(10, baseW), lang);
  }

  drawClinicalCtViewportChrome(ctx, W, H, { markerColor: '#ffffff', showRuler: false, showCube: false });

  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 10.5px ui-monospace, SFMono-Regular, monospace';
  ctx.fillText(
    segOverlayOn
      ? (lang === 'tr' ? 'KORONAL MPR + SEGMENTASYON' : 'CORONAL MPR + SEGMENTATION')
      : (lang === 'tr' ? 'KORONAL BTA MPR KESİTİ' : 'CORONAL CTA MPR SLICE'),
    12,
    20
  );

  canvas.__ctSegHits = hitList;
}

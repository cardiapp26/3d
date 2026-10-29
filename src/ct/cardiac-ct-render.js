// Cardiac CT Studio · Axial MPR, Curved Planar Reformation (CPR), CT-FFR & TAVI S-Curve Renderers
// Pure Canvas 2D and SVG rendering functions for Cardiac CT simulation.

import { clamp, findWindowPreset, findNearestAnatomicalLevel, huToGrayscale } from './cardiac-ct-sim.js';

export const AXIAL_CANVAS_SIZE = Object.freeze({ w: 440, h: 440 });
export const CPR_CANVAS_SIZE = Object.freeze({ w: 620, h: 225 });
export const TAVI_CANVAS_SIZE = Object.freeze({ w: 620, h: 240 });
export const ARTIFACT_CANVAS_SIZE = Object.freeze({ w: 280, h: 190 });

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, monospace';

function setupCanvas(canvas, logicalW, logicalH) {
  if (!canvas) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetW = Math.round(logicalW * dpr);
  const targetH = Math.round(logicalH * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function grayRgb(hu, winW, winL) {
  const g = huToGrayscale(hu, winW, winL);
  return `rgb(${g}, ${g}, ${g})`;
}

/**
 * Single nearest-level rule shared by the panel title, the scout and the axial renderer.
 * @param {number} zMm
 */
export function levelForZ(zMm) {
  return findNearestAnatomicalLevel(clamp(zMm ?? 48, 10, 115));
}

/**
 * Hounsfield values used to paint the axial slice (and the CPR lumen), so the ROI probe
 * reports exactly what is drawn.
 * Non-contrast: unenhanced blood ~45 HU. +60 s delayed: blood pool equilibrates to ~120–150 HU.
 */
export function axialTissueHu(caseObj, state = {}) {
  const preset = findWindowPreset(state.windowPresetId);
  const nonContrast = preset.id === 'noncontrast-cac';
  const delayed = !nonContrast && Boolean(state.delayedPhase60s);
  const isPe = caseObj?.plaqueType === 'pe';
  let blood = 395;
  let rightHeart = isPe ? 410 : 250;
  let svc = rightHeart + 80;
  let myo = 88;
  if (nonContrast) {
    blood = 45;
    rightHeart = 42;
    svc = 42;
    myo = 40;
  } else if (delayed) {
    blood = 140;
    rightHeart = 130;
    svc = 130;
    myo = 105;
  }
  return Object.freeze({
    nonContrast,
    delayed,
    blood,
    rightHeart,
    svc,
    myo,
    fat: -95,
    lung: -850,
    bone: 760,
    softTissue: 45,
    air: -1000,
    csf: 15,
    thrombus: 45,
    laaDefect: 68,
    pericardium: caseObj?.plaqueType === 'pericardium' ? (caseObj.plaqueHu ?? 920) : 55
  });
}

/** Blood-pool HU for the CPR lumen; same logic as the axial slice. */
export function bloodPoolHu(caseObj, state = {}) {
  return axialTissueHu(caseObj, state).blood;
}

/**
 * Renders the Sagittal Thoracic Scout View SVG with interactive Z-slice line (0..120 mm).
 */
export function renderSagittalScoutSvg(caseObj, state = {}, lang = 'tr') {
  const isTr = lang === 'tr';
  const zMm = clamp(state.zMm ?? 48, 10, 115);
  const yFromZ = z => Math.round(18 + ((clamp(z, 0, 120) / 120) * 144));
  const curY = yFromZ(zMm);

  return `
    <svg viewBox="0 0 260 180" class="ct-scout-svg" role="img" aria-label="${isTr ? 'Sagital Toraks BT Kılavuz Kesiti' : 'Sagittal Thoracic CT Scout View'}">
      <rect x="0" y="0" width="260" height="180" rx="8" fill="#06090f" />

      <!-- Spine posteriorly (right) and Sternum anteriorly (left) -->
      <rect x="34" y="20" width="9" height="135" rx="3" fill="#cbd5e1" opacity="0.65" />
      <g fill="#cbd5e1" opacity="0.65">
        <rect x="206" y="18" width="18" height="16" rx="2" />
        <rect x="206" y="38" width="18" height="16" rx="2" />
        <rect x="206" y="58" width="18" height="16" rx="2" />
        <rect x="206" y="78" width="18" height="16" rx="2" />
        <rect x="206" y="98" width="18" height="16" rx="2" />
        <rect x="206" y="118" width="18" height="16" rx="2" />
        <rect x="206" y="138" width="18" height="16" rx="2" />
      </g>

      <!-- Ascending Aorta & Arch + Cardiac Silhouette -->
      <path d="M 112 72 C 110 34, 158 28, 178 56 L 182 148 L 166 148 L 164 64 C 154 46, 128 48, 128 72 Z" fill="#94a3b8" opacity="0.6" />
      <ellipse cx="116" cy="108" rx="54" ry="38" fill="#cbd5e1" opacity="0.78" />

      <!-- 4 Reference Z-Level Guide Lines -->
      ${[
        { z: 20, label: isTr ? 'z=20 Büyük Damarlar' : 'z=20 Great Vessels' },
        { z: 48, label: isTr ? 'z=48 Aort Kökü / Ostium' : 'z=48 Ao Root / Ostia' },
        { z: 78, label: isTr ? 'z=78 4-Boşluk / Orta' : 'z=78 4-Chamber Mid' },
        { z: 105, label: isTr ? 'z=105 Apeks / PDA' : 'z=105 Apex / PDA' }
      ].map(l => {
        const ly = yFromZ(l.z);
        return `
          <line x1="26" y1="${ly}" x2="232" y2="${ly}" stroke="#334155" stroke-width="1" stroke-dasharray="3 3" />
          <text x="48" y="${ly - 3}" fill="#94a3b8" font-size="8.5">${l.label}</text>
        `;
      }).join('')}

      <!-- Active Scan Plane Line -->
      <line x1="16" y1="${curY}" x2="244" y2="${curY}" stroke="#38bdf8" stroke-width="2.2" />
      <rect x="172" y="${clamp(curY - 9, 6, 158)}" width="72" height="16" rx="4" fill="#0284c7" />
      <text x="208" y="${clamp(curY + 2, 17, 169)}" fill="#ffffff" font-size="9.5" font-weight="700" text-anchor="middle">z = ${Math.round(zMm)} mm</text>
    </svg>
  `;
}

function inEllipse(x, y, ecx, ecy, rx, ry, rot = 0) {
  const c = Math.cos(rot);
  const sn = Math.sin(rot);
  const dx = x - ecx;
  const dy = y - ecy;
  const u = dx * c + dy * sn;
  const v = -dx * sn + dy * c;
  return (u * u) / (rx * rx) + (v * v) / (ry * ry) <= 1;
}

function ellipseNorm(x, y, ecx, ecy, rx, ry, rot = 0) {
  const c = Math.cos(rot);
  const sn = Math.sin(rot);
  const dx = x - ecx;
  const dy = y - ecy;
  const u = dx * c + dy * sn;
  const v = -dx * sn + dy * c;
  return Math.sqrt((u * u) / (rx * rx) + (v * v) / (ry * ry));
}

/**
 * Picks the ROI region key under a point (logical 440x440 coordinates) from the last paint.
 * Discrete structures win by the smallest (distance - radius); otherwise the top-most
 * background tissue (fat, lung, bone, chest wall, air) containing the point is used.
 * @returns {string|null}
 */
export function pickAxialRegion(canvas, x, y) {
  const structures = canvas?.__ctHitRegions || [];
  let best = null;
  let bestScore = Infinity;
  for (const r of structures) {
    const dist = Math.hypot(x - r.x, y - r.y);
    if (dist > r.r + 8) continue;
    const score = dist - r.r;
    if (score < bestScore) {
      best = r;
      bestScore = score;
    }
  }
  if (best) return best.key;
  const background = canvas?.__ctBackgroundRegions || [];
  for (let i = background.length - 1; i >= 0; i -= 1) {
    if (background[i].contains(x, y)) return background[i].key;
  }
  return null;
}

function createAxialPainter(ctx, winW, winL) {
  const gray = hu => grayRgb(hu, winW, winL);
  return {
    gray,
    ellipse(ecx, ecy, rx, ry, rot, hu) {
      ctx.beginPath();
      ctx.ellipse(ecx, ecy, rx, ry, rot, 0, Math.PI * 2);
      ctx.fillStyle = gray(hu);
      ctx.fill();
    },
    circle(ecx, ecy, r, hu) {
      ctx.beginPath();
      ctx.arc(ecx, ecy, r, 0, Math.PI * 2);
      ctx.fillStyle = gray(hu);
      ctx.fill();
    },
    stroke(points, width, hu) {
      const [p0, ctrl, p1] = points;
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.quadraticCurveTo(ctrl[0], ctrl[1], p1[0], p1[1]);
      ctx.strokeStyle = gray(hu);
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  };
}

function paintAxialBackground(ctx, paint, t, cx, cy, heartRx, heartRy, isTr, W, H) {
  const bg = [];
  const add = (key, name, hu, contains) => bg.push({ key, name, hu, contains });

  ctx.fillStyle = paint.gray(t.air);
  ctx.fillRect(0, 0, W, H);
  add('air', isTr ? 'Dış Hava' : 'Outside Air', t.air, () => true);

  paint.ellipse(cx, cy + 6, 194, 154, 0, t.softTissue);
  add('chest-wall', isTr ? 'Göğüs Duvarı Yumuşak Doku' : 'Chest Wall Soft Tissue', t.softTissue,
    (x, y) => inEllipse(x, y, cx, cy + 6, 194, 154));

  // Lung fields (screen left = patient right)
  ctx.beginPath();
  ctx.ellipse(cx - 96, cy - 2, 74, 116, -0.12, 0, Math.PI * 2);
  ctx.ellipse(cx + 98, cy - 2, 72, 116, 0.12, 0, Math.PI * 2);
  ctx.fillStyle = paint.gray(t.lung);
  ctx.fill();
  add('lung-right', isTr ? 'Sağ Akciğer Parankimi' : 'Right Lung Parenchyma', t.lung,
    (x, y) => inEllipse(x, y, cx - 96, cy - 2, 74, 116, -0.12));
  add('lung-left', isTr ? 'Sol Akciğer Parankimi' : 'Left Lung Parenchyma', t.lung,
    (x, y) => inEllipse(x, y, cx + 98, cy - 2, 72, 116, 0.12));

  // Sternum, vertebral body, spinal canal, ribs
  const boneName = isTr ? 'Kortikal Kemik (Kaburga / Sternum / Vertebra)' : 'Cortical Bone (Rib / Sternum / Vertebra)';
  ctx.fillStyle = paint.gray(t.bone);
  ctx.fillRect(cx - 18, cy - 142, 36, 11);
  add('bone-sternum', boneName, t.bone, (x, y) => x >= cx - 18 && x <= cx + 18 && y >= cy - 142 && y <= cy - 131);
  paint.circle(cx, cy + 114, 24, t.bone);
  add('bone-vertebra', boneName, t.bone, (x, y) => Math.hypot(x - cx, y - cy - 114) <= 24);
  paint.circle(cx, cy + 136, 9, t.csf);
  add('spinal-canal', isTr ? 'Spinal Kanal (BOS)' : 'Spinal Canal (CSF)', t.csf, (x, y) => Math.hypot(x - cx, y - cy - 136) <= 9);

  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2 + 0.35;
    const rx = cx + Math.cos(a) * 182;
    const ry = cy + 6 + Math.sin(a) * 142;
    paint.ellipse(rx, ry, 9, 5, a + Math.PI / 2, t.bone);
    add(`bone-rib-${i}`, boneName, t.bone, (x, y) => inEllipse(x, y, rx, ry, 9, 5, a + Math.PI / 2));
  }

  // Pericardial sac & epicardial fat pad
  paint.ellipse(cx + 8, cy - 12, heartRx, heartRy, -0.22, t.fat);
  add('epicardial-fat', isTr ? 'Epikardiyal / Perikardiyal Yağ' : 'Epicardial / Pericardial Fat', t.fat,
    (x, y) => inEllipse(x, y, cx + 8, cy - 12, heartRx, heartRy, -0.22));

  ctx.beginPath();
  ctx.ellipse(cx + 8, cy - 12, heartRx, heartRy, -0.22, 0, Math.PI * 2);
  ctx.strokeStyle = paint.gray(t.pericardium);
  ctx.lineWidth = t.pericardium > 300 ? 6.5 : 1.6;
  ctx.stroke();
  const ringTol = t.pericardium > 300 ? 0.05 : 0.025;
  add('pericardium', t.pericardium > 300
    ? (isTr ? 'Kalsifik Perikard (Yumurta Kabuğu)' : 'Calcified Pericardium (Eggshell)')
    : (isTr ? 'Perikard' : 'Pericardium'), t.pericardium,
  (x, y) => Math.abs(ellipseNorm(x, y, cx + 8, cy - 12, heartRx, heartRy, -0.22) - 1) <= ringTol);

  return bg;
}

function paintGreatVesselLevel(paint, t, caseObj, cx, cy, isTr, push) {
  // Radiological convention: screen left = patient right, top = anterior.
  // Pulmonary trunk and branches are painted first: the RPA runs posterior to the AAo and SVC.
  const paHu = t.rightHeart;
  paint.ellipse(cx + 30, cy - 44, 22, 28, -0.35, paHu);
  paint.stroke([[cx + 32, cy - 36], [cx + 40, cy - 14], [cx + 38, cy + 10]], 24, paHu);
  paint.stroke([[cx + 36, cy + 14], [cx + 4, cy + 34], [cx - 62, cy + 20]], 20, paHu);
  paint.stroke([[cx + 40, cy + 12], [cx + 62, cy + 20], [cx + 72, cy + 44]], 17, paHu);

  push({ key: 'aao', x: cx + 6, y: cy - 10, r: 26, name: isTr ? 'Çıkan Aort (AAo)' : 'Ascending Aorta (AAo)', hu: t.blood });
  push({ key: 'mpa', x: cx + 30, y: cy - 44, r: 24, name: isTr ? 'Ana Pulmoner Arter (MPA)' : 'Main Pulmonary Artery (MPA)', hu: paHu });
  push({ key: 'rpa', x: cx - 46, y: cy + 23, r: 12, name: isTr ? 'Sağ Pulmoner Arter (RPA)' : 'Right Pulmonary Artery (RPA)', hu: paHu });

  if (caseObj?.plaqueType === 'pe') {
    // Right PA thrombus, on the RPA behind the ascending aorta
    paint.ellipse(cx - 14, cy + 27, 18, 7, 0.1, t.thrombus);
    push({ key: 'pe-thrombus', x: cx - 14, y: cy + 27, r: 12, name: isTr ? 'Pulmoner Emboli Trombüsü (RPA)' : 'Pulmonary Embolism Thrombus (RPA)', hu: t.thrombus });
  }

  paint.circle(cx + 6, cy - 10, 26, t.blood);
  paint.circle(cx - 36, cy - 4, 14, t.svc);
  push({ key: 'svc', x: cx - 36, y: cy - 4, r: 14, name: isTr ? 'Superior Vena Kava (SVC)' : 'Superior Vena Cava (SVC)', hu: t.svc });
  push({ key: 'lpa', x: cx + 64, y: cy + 30, r: 11, name: isTr ? 'Sol Pulmoner Arter (LPA)' : 'Left Pulmonary Artery (LPA)', hu: paHu, label: false });
}

function paintAorticRootLevel(ctx, paint, t, caseObj, cx, cy, isTr, preset, push) {
  const rootX = cx + 4;
  const rootY = cy - 8;
  const rootR = 29;
  const isLaaCase = caseObj?.plaqueType === 'laa';

  ctx.beginPath();
  ctx.arc(rootX, rootY, rootR, 0, Math.PI * 2);
  ctx.fillStyle = paint.gray(t.blood);
  ctx.fill();
  ctx.strokeStyle = paint.gray(t.myo + 30);
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 3 commissural cusp lines (RCC anterior, LCC left-posterior, NCC right-posterior)
  for (const ang of [-Math.PI * 0.15, Math.PI * 0.52, -Math.PI * 0.82]) {
    ctx.beginPath();
    ctx.moveTo(rootX, rootY);
    ctx.lineTo(rootX + Math.cos(ang) * rootR, rootY + Math.sin(ang) * rootR);
    ctx.strokeStyle = paint.gray(t.myo + 25);
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  push({ key: 'aortic-root', x: rootX, y: rootY, r: rootR, name: isTr ? 'Aort Kökü (Valsalva Sinüsleri)' : 'Aortic Root (Sinuses of Valsalva)', hu: t.blood });

  paint.ellipse(cx - 12, cy - 54, 34, 18, -0.15, t.rightHeart);
  push({ key: 'rvot', x: cx - 12, y: cy - 54, r: 22, name: 'RVOT / MPA', hu: t.rightHeart });

  const laHu = t.delayed ? t.blood : t.blood - 10;
  paint.ellipse(cx + 18, cy + 36, 44, 24, 0, laHu);
  push({ key: 'la', x: cx + 18, y: cy + 36, r: 28, name: isTr ? 'Sol Atriyum (LA)' : 'Left Atrium (LA)', hu: laHu });

  // LAA: early-phase tip defect in CT-8; fills to blood-pool HU on the +60 s delayed scan
  const showDefect = isLaaCase && !t.delayed && !t.nonContrast;
  const laaHu = showDefect ? t.laaDefect : (t.delayed || t.nonContrast ? t.blood : t.blood - 15);
  paint.ellipse(cx + 68, cy - 6, 22, 11, -0.45, laaHu);
  push({
    key: 'laa',
    x: cx + 68,
    y: cy - 6,
    r: 18,
    name: showDefect
      ? (isTr ? 'LAA Dolum Defekti (Staz vs Trombüs)' : 'LAA Filling Defect (Stasis vs Thrombus)')
      : (isTr ? 'Sol Atriyal Apendiks (LAA)' : 'Left Atrial Appendage (LAA)'),
    hu: laaHu
  });

  // LMCA -> proximal LAD
  paint.stroke([[rootX + 26, rootY - 6], [cx + 52, cy - 34], [cx + 38, cy - 66]], 6.5, t.blood);

  const ladPlaqueX = cx + 44;
  const ladPlaqueY = cy - 42;
  const isCalcifiedCase = caseObj?.plaqueType === 'calcified' || caseObj?.tag === 'CT-3';
  if (caseObj?.plaqueType === 'lipid-hrp') {
    const coreHu = caseObj.plaqueHu ?? 18;
    paint.circle(ladPlaqueX, ladPlaqueY, 8.5, 135);
    paint.circle(ladPlaqueX, ladPlaqueY, 5.5, coreHu);
    push({ key: 'lad-hrp', x: ladPlaqueX, y: ladPlaqueY, r: 11, name: isTr ? 'Proksimal LAD HRP (<30 HU Lipid Çekirdek)' : 'Proximal LAD HRP (<30 HU Lipid Core)', hu: coreHu });
  } else if (isCalcifiedCase) {
    const caHu = caseObj.plaqueHu ?? 890;
    const bloomR = preset.id === 'calcium-sharp' ? 6 : 9.5;
    paint.circle(ladPlaqueX, ladPlaqueY, bloomR, caHu);
    push({ key: 'lad-calcium', x: ladPlaqueX, y: ladPlaqueY, r: 11, name: isTr ? `Kalsifik Plak (${caHu} HU)` : `Calcified Plaque (${caHu} HU)`, hu: caHu });
  } else {
    push({ key: 'lad-lumen', x: ladPlaqueX, y: ladPlaqueY, r: 10, name: isTr ? 'Proksimal LAD Lümeni' : 'Proximal LAD Lumen', hu: t.blood });
  }

  if (caseObj?.plaqueType === 'anomaly') {
    // Arises from the left sinus and squeezes between the aorta and RVOT/PA (interarterial course)
    paint.stroke([[rootX + 18, rootY - 18], [cx - 2, cy - 34], [cx - 42, cy - 28]], 3.2, t.blood);
    push({ key: 'rca-acaos', x: cx - 2, y: cy - 32, r: 12, name: isTr ? 'İnterarteriyel Anormal RCA (R-ACAOS)' : 'Interarterial Anomalous RCA (R-ACAOS)', hu: t.blood });
  } else {
    paint.stroke([[rootX - 18, rootY - 22], [cx - 42, cy - 32], [cx - 56, cy - 12]], 5.5, t.blood);
    push({ key: 'rca', x: cx - 38, y: cy - 26, r: 10, name: isTr ? 'Proksimal Sağ Koroner Arter (RCA)' : 'Proximal Right Coronary Artery (RCA)', hu: t.blood });
  }
}

function paintVentricularLevel(ctx, paint, t, caseObj, cx, cy, isTr, isApex, rrPhase, push, addBackground) {
  const scale = isApex ? 0.72 : 1.0;
  const rvScale = caseObj?.plaqueType === 'pe' ? 1.28 : 1.0;

  paint.ellipse(cx + 12, cy - 10, 82 * scale, 68 * scale, -0.22, t.myo);
  addBackground('myocardium', isTr ? 'Ventrikül Miyokardı' : 'Ventricular Myocardium', t.myo,
    (x, y) => inEllipse(x, y, cx + 12, cy - 10, 82 * scale, 68 * scale, -0.22));

  paint.ellipse(cx + 34, cy - 6, 34 * scale, 26 * scale, -0.22, t.blood);
  push({ key: 'lv', x: cx + 34, y: cy - 6, r: 28 * scale, name: isTr ? 'Sol Ventrikül (LV) Lümeni' : 'Left Ventricle (LV) Cavity', hu: t.blood });

  paint.ellipse(cx - 16, cy - 34, 30 * scale * rvScale, 20 * scale * rvScale, -0.22, t.rightHeart);
  push({ key: 'rv', x: cx - 16, y: cy - 34, r: 24 * scale * rvScale, name: isTr ? 'Sağ Ventrikül (RV) Lümeni' : 'Right Ventricle (RV) Cavity', hu: t.rightHeart });

  push({ key: 'septum', x: cx + 8, y: cy - 20, r: 16 * scale, name: isTr ? 'İnterventriküler Septum Miyokardı' : 'Interventricular Septal Myocardium', hu: t.myo });

  // Mid-LAD in the anterior interventricular groove (intramyocardial in the bridge case)
  const isBridge = caseObj?.plaqueType === 'bridge';
  const bridgeDepthPx = isBridge ? 12 : 0;
  const ladX = cx + 18 - bridgeDepthPx * 0.4;
  const ladY = cy - 58 + bridgeDepthPx;
  const ladRadius = isBridge && rrPhase <= 50 ? 2.4 : 4.5;
  paint.circle(ladX, ladY, ladRadius, t.blood);
  push({
    key: 'mid-lad',
    x: ladX,
    y: ladY,
    r: 10,
    name: isBridge
      ? (isTr ? 'İntramiyokardiyal Orta LAD (Miyokardiyal Köprü)' : 'Intramyocardial Mid-LAD (Myocardial Bridge)')
      : (isTr ? 'Orta LAD (Ön İnterventriküler Oluk)' : 'Mid-LAD (Anterior Interventricular Groove)'),
    hu: t.blood
  });

  if (!isApex) {
    paint.ellipse(cx - 38, cy + 16, 24, 20, 0, t.rightHeart);
    push({ key: 'ra', x: cx - 38, y: cy + 16, r: 20, name: isTr ? 'Sağ Atriyum (RA)' : 'Right Atrium (RA)', hu: t.rightHeart });
    const laHu = t.delayed ? t.blood : t.blood - 10;
    paint.ellipse(cx + 22, cy + 36, 26, 18, 0, laHu);
    push({ key: 'la-mid', x: cx + 22, y: cy + 36, r: 18, name: isTr ? 'Sol Atriyum (LA)' : 'Left Atrium (LA)', hu: laHu });
  }
}

function drawAxialLabels(ctx, regions) {
  ctx.font = '700 10.5px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  const placed = [];
  const overlaps = box => placed.some(p => box.x < p.x + p.w && box.x + box.w > p.x && box.y < p.y + p.h && box.y + box.h > p.y);
  regions.filter(reg => reg.label !== false).slice(0, 5).forEach(reg => {
    const text = `${reg.name.split(' (')[0]} (${reg.hu} HU)`;
    const tw = ctx.measureText(text).width + 10;
    const bx = clamp(reg.x - tw / 2, 4, AXIAL_CANVAS_SIZE.w - tw - 4);
    // Try above the structure first, then step outward until the box is free
    const offsets = [-24, -42, 10, -60, 28, -78, 46];
    const box = offsets
      .map(off => ({ x: bx, y: reg.y + off, w: tw, h: 16 }))
      .find(candidate => !overlaps(candidate));
    // No free slot: skip this hint label (the ROI probe still reports the structure)
    if (!box) return;
    placed.push(box);
    ctx.fillStyle = 'rgba(7, 11, 18, 0.78)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 0.9;
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(text, box.x + box.w / 2, box.y + 12);
  });
  ctx.textAlign = 'left';
}

function formatHu(hu) {
  return `${hu > 0 ? '+' : ''}${hu} HU`;
}

/**
 * Renders the Axial Thoracic/Cardiac CT Slice Viewer Canvas with Hounsfield Unit windowing.
 * The ROI probe is stored as { regionKey, x, y }; its name and HU are resolved here from the
 * same HU table used for painting and exposed as canvas.__ctRoiResolved (null if not present).
 */
export function renderAxialCtSliceCanvas(canvas, caseObj, state = {}, lang = 'tr') {
  const { w: W, h: H } = AXIAL_CANVAS_SIZE;
  const ctx = setupCanvas(canvas, W, H);
  if (!ctx) return;

  const isTr = lang === 'tr';
  const preset = findWindowPreset(state.windowPresetId);
  const winW = preset.width;
  const winL = preset.level;
  const zMm = clamp(state.zMm ?? 48, 10, 115);
  const rrPhase = Number(state.rrPhasePct ?? 75);
  const level = levelForZ(zMm);
  const t = axialTissueHu(caseObj, state);
  const paint = createAxialPainter(ctx, winW, winL);

  const cx = W / 2;
  const cy = H / 2;
  const heartRx = level.id === 'great-vessels' ? 74 : level.id === 'aortic-root-ostia' ? 92 : 104;
  const heartRy = level.id === 'great-vessels' ? 68 : level.id === 'aortic-root-ostia' ? 82 : 90;

  const background = paintAxialBackground(ctx, paint, t, cx, cy, heartRx, heartRy, isTr, W, H);
  const addBackground = (key, name, hu, contains) => background.push({ key, name, hu, contains });
  const hitRegions = [];
  const push = region => hitRegions.push(region);

  // Descending thoracic aorta (posterior, left of the spine)
  const daoHu = t.delayed || t.nonContrast ? t.blood : t.blood - 15;
  paint.circle(cx + 38, cy + 92, 18, daoHu);

  if (level.id === 'great-vessels') {
    paintGreatVesselLevel(paint, t, caseObj, cx, cy, isTr, push);
  } else if (level.id === 'aortic-root-ostia') {
    paintAorticRootLevel(ctx, paint, t, caseObj, cx, cy, isTr, preset, push);
  } else {
    paintVentricularLevel(ctx, paint, t, caseObj, cx, cy, isTr, level.id === 'apical-diaphragm', rrPhase, push, addBackground);
  }
  push({ key: 'dao', x: cx + 38, y: cy + 92, r: 18, name: isTr ? 'İnen Torasik Aort (DAo)' : 'Descending Thoracic Aorta (DAo)', hu: daoHu, label: false });

  canvas.__ctHitRegions = hitRegions;
  canvas.__ctBackgroundRegions = background;

  drawAxialLabels(ctx, hitRegions);

  // Active ROI probe: resolve name and HU from this paint
  const probe = state.roiProbe;
  const resolved = probe
    ? (hitRegions.find(r => r.key === probe.regionKey) || background.find(r => r.key === probe.regionKey) || null)
    : null;
  canvas.__ctRoiResolved = resolved ? { key: resolved.key, name: resolved.name, hu: resolved.hu } : null;
  if (probe && resolved) {
    ctx.beginPath();
    ctx.arc(probe.x, probe.y, 9, 0, Math.PI * 2);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = `700 11.5px ${MONO_FONT}`;
    const text = `ROI: ${resolved.name} · ${formatHu(resolved.hu)}`;
    const tw = Math.min(W - 24, ctx.measureText(text).width + 12);
    ctx.fillStyle = 'rgba(9, 13, 20, 0.9)';
    ctx.fillRect(12, H - 54, tw, 22);
    ctx.fillStyle = '#facc15';
    ctx.fillText(text, 18, H - 39, tw - 12);
  }

  // Scanner HUD corners
  ctx.fillStyle = '#38bdf8';
  ctx.font = `700 11.5px ${MONO_FONT}`;
  ctx.fillText(`AXIAL MPR · z=${Math.round(zMm)} mm · ECG ${rrPhase}% R-R`, 12, 20);
  ctx.fillStyle = '#cbd5e1';
  const delayedTag = t.delayed ? (isTr ? ' · +60 sn GEÇ FAZ' : ' · +60s DELAYED') : '';
  ctx.fillText(`W:${winW} L:${winL} HU${delayedTag}`, 12, H - 12);
}

/**
 * Renders the Curved Planar Reformation (CPR) Stretched Vessel + Non-Invasive CT-FFR Canvas.
 */
export function renderCprAndCtFfrCanvas(canvas, cprProfile, caseObj, state = {}, lang = 'tr') {
  const { w: W, h: H } = CPR_CANVAS_SIZE;
  const ctx = setupCanvas(canvas, W, H);
  if (!ctx || !cprProfile?.points?.length) return;

  const isTr = lang === 'tr';
  const preset = findWindowPreset(state.windowPresetId);
  const winW = preset.width;
  const winL = preset.level;
  const pts = cprProfile.points;
  const padL = 48;
  const padR = 22;
  const plotW = W - padL - padR;
  const isAnomaly = caseObj?.plaqueType === 'anomaly';

  const xForMm = mm => padL + (clamp(mm, 0, 60) / 60) * plotW;

  ctx.fillStyle = '#070a10';
  ctx.fillRect(0, 0, W, H);

  // TOP HALF: Stretched CPR vessel view (y = 22..114)
  const cprMidY = 68;
  const pxPerMmR = 11.5;

  ctx.fillStyle = '#0e1520';
  ctx.fillRect(padL, 22, plotW, 92);

  const traceBand = key => {
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const x = xForMm(p.xMm);
      const y = cprMidY - (p[key] / 2) * pxPerMmR;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    for (let i = pts.length - 1; i >= 0; i -= 1) {
      const p = pts[i];
      ctx.lineTo(xForMm(p.xMm), cprMidY + (p[key] / 2) * pxPerMmR);
    }
    ctx.closePath();
  };

  // Outer vessel wall (EEM / remodeling)
  traceBand('outerDiamMm');
  ctx.fillStyle = caseObj?.plaqueType === 'lipid-hrp' ? '#334155' : '#64748b';
  ctx.fill();

  // Lumen: same blood-pool HU as the axial slice (about 45 HU unenhanced)
  traceBand('lumenDiamMm');
  ctx.fillStyle = grayRgb(bloodPoolHu(caseObj, state), winW, winL);
  ctx.fill();

  const lesX = xForMm(26);
  if (caseObj?.plaqueType === 'lipid-hrp') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(lesX - 24, cprMidY - 26, 48, 12);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(lesX - 24, cprMidY - 26, 48, 12);
  } else if (caseObj?.plaqueType === 'calcified' || (caseObj?.cacScore ?? 0) >= 300) {
    const bloomH = preset.id === 'calcium-sharp' ? 9 : 15;
    ctx.fillStyle = grayRgb(caseObj?.plaqueHu ?? 890, winW, winL);
    ctx.fillRect(lesX - 26, cprMidY - 24, 52, bloomH);
    ctx.fillRect(lesX - 20, cprMidY + 10, 40, bloomH - 2);
  }

  // BOTTOM HALF: CT-FFR curve (y = 132..200)
  const ffrTop = 132;
  const ffrBot = 200;
  const yForFfr = val => ffrTop + ((1.0 - clamp(val, 0.5, 1.0)) / 0.5) * (ffrBot - ffrTop);

  const y080 = yForFfr(0.8);
  const y075 = yForFfr(0.75);
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
  ctx.beginPath();
  ctx.moveTo(padL, y080);
  ctx.lineTo(padL + plotW, y080);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
  ctx.beginPath();
  ctx.moveTo(padL, y075);
  ctx.lineTo(padL + plotW, y075);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.lineWidth = 3;
  for (let i = 1; i < pts.length; i += 1) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    ctx.beginPath();
    ctx.moveTo(xForMm(p0.xMm), yForFfr(p0.ffrCt));
    ctx.lineTo(xForMm(p1.xMm), yForFfr(p1.ffrCt));
    ctx.strokeStyle = p1.ffrCt <= 0.75 ? '#f43f5e' : p1.ffrCt <= 0.80 ? '#facc15' : '#22c55e';
    ctx.stroke();
  }

  // CPR cursor marker on both the vessel view and the FFR curve
  const cursorMm = clamp(state.cprDistalMm ?? 36, 0, 60);
  const cursorPt = pts[Math.min(pts.length - 1, Math.max(0, Math.round(cursorMm)))] || pts[pts.length - 1];
  const cursorX = xForMm(cursorMm);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cursorX, 22);
  ctx.lineTo(cursorX, 114);
  ctx.moveTo(cursorX, ffrTop - 2);
  ctx.lineTo(cursorX, ffrBot + 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cursorX, yForFfr(cursorPt.ffrCt), 4.5, 0, Math.PI * 2);
  ctx.fillStyle = '#38bdf8';
  ctx.fill();
  ctx.font = `700 9.5px ${MONO_FONT}`;
  ctx.textAlign = cursorX > W - 90 ? 'right' : 'left';
  ctx.fillText(`${cursorPt.ffrCt.toFixed(2)}`, cursorX + (ctx.textAlign === 'right' ? -7 : 7), yForFfr(cursorPt.ffrCt) - 6);
  ctx.textAlign = 'left';

  // Labels
  const eff = cprProfile.effectiveMaxStenosisPct;
  const bloom = cprProfile.bloomingBiasPct > 0;
  let header;
  if (isAnomaly) {
    header = isTr
      ? `${cprProfile.vessel} CPR · Ostial yarık daralma, non-aterosklerotik (E): %${eff}`
      : `${cprProfile.vessel} CPR · Ostial narrowing, non-atherosclerotic (E): ${eff}%`;
  } else {
    header = isTr
      ? `${cprProfile.vessel} Düzleştirilmiş CPR · Maks. Darlık: %${eff}${bloom ? ' (+Parlama)' : ''}`
      : `${cprProfile.vessel} Stretched CPR · Max Stenosis: ${eff}%${bloom ? ' (+Blooming)' : ''}`;
  }
  const distal = cprProfile.ffrCtDistal;
  let ffrClass;
  if (distal <= 0.75) ffrClass = isTr ? 'İskemik ≤0.75' : 'Ischemic ≤0.75';
  else if (distal <= 0.80) ffrClass = isTr ? 'Gri Zon' : 'Gray Zone';
  else ffrClass = isTr ? 'Normal aralık >0.80' : 'Normal >0.80';

  ctx.fillStyle = '#e2e8f0';
  ctx.font = `700 11px ${MONO_FONT}`;
  ctx.fillText(header, padL, 16, W - padL - 8);
  ctx.fillText(`CT-FFR (FFR_CT) · Distal: ${distal.toFixed(2)} (${ffrClass})`, padL, 127);

  ctx.fillStyle = '#94a3b8';
  ctx.font = `600 9.5px ${MONO_FONT}`;
  ctx.fillText('1.00', 12, ffrTop + 4);
  ctx.fillText('0.80', 12, y080 + 3);
  ctx.fillText('0.75', 12, y075 + 9);
}

function ellipsePoint(ecx, ecy, rx, ry, rot, tParam) {
  const c = Math.cos(rot);
  const sn = Math.sin(rot);
  const ex = rx * Math.cos(tParam);
  const ey = ry * Math.sin(tParam);
  return { x: ecx + ex * c - ey * sn, y: ecy + ex * sn + ey * c };
}

/**
 * Renders the Structural Heart TAVI Annulus Planimetry + Coplanar Fluoroscopic S-Curve Canvas.
 */
export function renderTaviPlanningCanvas(canvas, taviData, state = {}, lang = 'tr') {
  const { w: W, h: H } = TAVI_CANVAS_SIZE;
  const ctx = setupCanvas(canvas, W, H);
  if (!ctx || !taviData) return;

  const isTr = lang === 'tr';
  ctx.fillStyle = '#070a10';
  ctx.fillRect(0, 0, W, H);

  // LEFT PANEL: systolic virtual basal ring planimetry
  const acx = 130;
  const acy = 128;
  const rx = (taviData.dMaxMm / 2) * 5.4;
  const ry = (taviData.dMinMm / 2) * 5.4;
  const rot = -0.2;

  ctx.beginPath();
  ctx.ellipse(acx, acy, rx + 8, ry + 8, rot, 0, Math.PI * 2);
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(acx, acy, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Dmax and Dmin calipers along the rotated ellipse axes
  const dMaxA = ellipsePoint(acx, acy, rx, ry, rot, 0);
  const dMaxB = ellipsePoint(acx, acy, rx, ry, rot, Math.PI);
  const dMinA = ellipsePoint(acx, acy, rx, ry, rot, -Math.PI / 2);
  const dMinB = ellipsePoint(acx, acy, rx, ry, rot, Math.PI / 2);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.3;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(dMaxA.x, dMaxA.y);
  ctx.lineTo(dMaxB.x, dMaxB.y);
  ctx.moveTo(dMinA.x, dMinA.y);
  ctx.lineTo(dMinB.x, dMinB.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3 cusp hinge points (RCC, LCC, NCC) on the rotated annulus ellipse
  const hinges = [
    { label: 'RCC', a: -Math.PI * 0.5, color: '#facc15' },
    { label: 'LCC', a: Math.PI * 0.18, color: '#f43f5e' },
    { label: 'NCC', a: Math.PI * 0.82, color: '#38bdf8' }
  ];
  ctx.font = `700 10px ${MONO_FONT}`;
  hinges.forEach(h => {
    const hp = ellipsePoint(acx, acy, rx, ry, rot, h.a);
    ctx.beginPath();
    ctx.arc(hp.x, hp.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = h.color;
    ctx.fill();
    ctx.fillText(h.label, hp.x - 10, hp.y - 8);
  });

  ctx.fillStyle = '#f8fafc';
  ctx.font = `700 11px ${MONO_FONT}`;
  ctx.fillText(isTr ? 'Sanal Bazal Halka (%35 Sistol)' : 'Virtual Basal Ring (35% Systole)', 18, 22);
  ctx.fillStyle = '#4ade80';
  ctx.fillText(
    isTr
      ? `Alan: ${taviData.annulusAreaMm2} mm² · Çevre: ${taviData.annulusPerimMm} mm`
      : `Area: ${taviData.annulusAreaMm2} mm² · Perimeter: ${taviData.annulusPerimMm} mm`,
    18,
    H - 14
  );

  // RIGHT PANEL: 3-cusp coplanar S-curve (RAO/LAO vs CRA/CAU)
  const plotL = 305;
  const plotR = 595;
  const plotT = 34;
  const plotB = 205;
  const plotW = plotR - plotL;
  const plotH = plotB - plotT;

  ctx.fillStyle = '#0d1420';
  ctx.fillRect(plotL, plotT, plotW, plotH);
  ctx.strokeStyle = '#1e293b';
  ctx.strokeRect(plotL, plotT, plotW, plotH);

  const xForAlpha = a => plotL + ((a + 60) / 120) * plotW;
  const yForBeta = b => plotT + ((40 - b) / 80) * plotH;

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xForAlpha(0), plotT);
  ctx.lineTo(xForAlpha(0), plotB);
  ctx.moveTo(plotL, yForBeta(0));
  ctx.lineTo(plotR, yForBeta(0));
  ctx.stroke();

  ctx.beginPath();
  taviData.sCurve.forEach((pt, idx) => {
    const px = xForAlpha(pt.laoRaoDeg);
    const py = yForBeta(pt.craCauDeg);
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Both projections are computed from the same perpendicularity curve, so they lie on it
  const activeKey = state.taviProjectionKey === 'cuspOverlapView' ? 'cuspOverlapView' : 'threeCuspView';
  const marks = [
    { key: 'threeCuspView', view: taviData.threeCuspView, color: '#22c55e' },
    { key: 'cuspOverlapView', view: taviData.cuspOverlapView, color: '#facc15' }
  ];
  ctx.font = `700 10px ${MONO_FONT}`;
  marks.forEach(({ key, view, color }) => {
    const mx = xForAlpha(view.laoRaoDeg);
    const my = yForBeta(view.craCauDeg);
    ctx.beginPath();
    ctx.arc(mx, my, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (key === activeKey) {
      ctx.beginPath();
      ctx.arc(mx, my, 9, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    const label = (typeof view.label === 'string' ? view.label : (view.label?.[lang] || view.label?.en || '')).split(' (')[0];
    ctx.fillStyle = color;
    ctx.fillText(label, mx - 28, my - 12);
  });

  ctx.fillStyle = '#f8fafc';
  ctx.font = `700 11px ${MONO_FONT}`;
  ctx.fillText(isTr ? 'TAVI Koplanar S-Eğrisi (RAO/LAO · CRA/CAU)' : 'TAVI Coplanar S-Curve (RAO/LAO · CRA/CAU)', plotL, 22);
  ctx.fillStyle = '#94a3b8';
  ctx.font = `600 9.5px ${MONO_FONT}`;
  ctx.fillText('RAO 60°', plotL + 4, plotB + 14);
  ctx.fillText('LAO 60°', plotR - 44, plotB + 14);
  ctx.textAlign = 'right';
  ctx.fillText('CRA 40°', plotL - 4, plotT + 8);
  ctx.fillText('0°', plotL - 4, yForBeta(0) + 3);
  ctx.fillText('CAU 40°', plotL - 4, plotB);
  ctx.textAlign = 'left';
}

/**
 * Renders a standalone preview canvas for the 5 Cardiac CT Artifacts.
 * @param {string} label short bilingual artifact name shown when the fix is off
 */
export function renderCtArtifactPreviewCanvas(canvas, artifactId, isFixed = false, lang = 'tr', label = '') {
  const { w: W, h: H } = ARTIFACT_CANVAS_SIZE;
  const ctx = setupCanvas(canvas, W, H);
  if (!ctx) return;

  const cx = W / 2;
  const cy = H / 2;
  ctx.fillStyle = '#06090f';
  ctx.fillRect(0, 0, W, H);

  if (artifactId === 'blooming') {
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.fillStyle = '#475569';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();

    const caR = isFixed ? 14 : 28;
    ctx.beginPath();
    ctx.arc(cx, cy - 22, caR, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  } else if (artifactId === 'stair-step') {
    const shift = isFixed ? 0 : 18;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx - 18, 28, 36, 62);
    ctx.fillRect(cx - 18 + shift, 90, 36, 68);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(30, 90);
    ctx.lineTo(W - 30, 90);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (artifactId === 'beam-hardening') {
    ctx.beginPath();
    ctx.arc(cx + 40, cy, 36, 0, Math.PI * 2);
    ctx.fillStyle = '#94a3b8';
    ctx.fill();

    if (!isFixed) {
      ctx.fillStyle = 'rgba(2, 4, 8, 0.88)';
      ctx.fillRect(cx - 48, cy - 10, 130, 20);
    }

    ctx.beginPath();
    ctx.arc(cx - 42, cy, 20, 0, Math.PI * 2);
    ctx.fillStyle = isFixed ? '#cbd5e1' : '#ffffff';
    ctx.fill();
  } else if (artifactId === 'motion-blur') {
    if (!isFixed) {
      for (let i = -3; i <= 3; i += 1) {
        ctx.beginPath();
        ctx.arc(cx + i * 9, cy + Math.abs(i) * 4, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(226, 232, 240, 0.28)';
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#f1f5f9';
      ctx.fill();
    }
  } else {
    // Suboptimal opacification (<250 HU) vs bright 395 HU lumen
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, Math.PI * 2);
    ctx.fillStyle = isFixed ? '#e2e8f0' : '#475569';
    ctx.fill();
  }

  ctx.fillStyle = isFixed ? '#4ade80' : '#fb7185';
  ctx.font = `700 10.5px ${MONO_FONT}`;
  const tag = isFixed ? (lang === 'tr' ? '✓ DÜZELTİLDİ' : '✓ CORRECTED') : (label || artifactId);
  ctx.fillText(tag.toLocaleUpperCase(lang === 'tr' ? 'tr-TR' : 'en-US'), 10, 18, W - 20);
}

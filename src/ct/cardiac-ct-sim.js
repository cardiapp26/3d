// Cardiac CT Studio · Deterministic HU Windowing, Axial MPR, Stretched CPR/CT-FFR & TAVI Simulation Engine
// Pure functions for Hounsfield Unit mapping, CAD-RADS 2.0 encoding, Agatston scoring, and TAVI S-curve.

import { CLINICAL_CT_CASES, WINDOW_PRESETS, ANATOMICAL_LEVELS } from './cardiac-ct-data.js';

export const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || 0));
const round = (v, digits = 2) => {
  const f = 10 ** digits;
  return Math.round((Number(v) || 0) * f) / f;
};

export function findCtCase(caseId) {
  return CLINICAL_CT_CASES.find(c => c.id === caseId) || CLINICAL_CT_CASES[0];
}

export function findWindowPreset(presetId) {
  return WINDOW_PRESETS.find(w => w.id === presetId) || WINDOW_PRESETS[0];
}

export function findNearestAnatomicalLevel(zMm) {
  let best = ANATOMICAL_LEVELS[0];
  let bestDist = Infinity;
  for (const lvl of ANATOMICAL_LEVELS) {
    const d = Math.abs(lvl.zMm - (Number(zMm) || 48));
    if (d < bestDist) {
      bestDist = d;
      best = lvl;
    }
  }
  return best;
}

/**
 * Converts a Hounsfield Unit (HU) value into a display grayscale byte [0..255]
 * given Window Width (W) and Window Level (L).
 */
export function huToGrayscale(hu, windowWidth = 800, windowLevel = 250) {
  const w = Math.max(20, Number(windowWidth) || 800);
  const l = Number(windowLevel) || 250;
  const minHu = l - w / 2;
  const maxHu = l + w / 2;
  const norm = clamp((Number(hu) - minHu) / (maxHu - minHu), 0, 1);
  return Math.round(norm * 255);
}

/**
 * Computes the Curved Planar Reformation (CPR) vessel profile and non-invasive FFR_CT curve (0..60 mm).
 */
export function computeCprAndCtFfrProfile(caseObj, state = {}) {
  const c = caseObj || CLINICAL_CT_CASES[0];
  const windowId = state.windowPresetId || 'cta-angio';
  const rrPhasePct = Number(state.rrPhasePct ?? 75);

  // Calcium blooming increases apparent stenosis by +12% in soft windows unless sharp kernel/window is active
  const isCalcified = c.plaqueType === 'calcified' || c.cacScore >= 300;
  const bloomingBiasPct = isCalcified && windowId !== 'calcium-sharp' ? 12 : 0;

  // Myocardial bridge constricts dynamically at 35-45% end-systole and relaxes at 75% diastasis
  const isBridge = c.plaqueType === 'bridge';
  const bridgeSystolicBoost = isBridge && rrPhasePct <= 50 ? 32 : 0;

  const effectiveMaxStenosisPct = clamp(
    (c.maxStenosisPct || 0) + bloomingBiasPct + bridgeSystolicBoost,
    0,
    96
  );

  const points = [];
  const totalLenMm = 60;
  // Anomalous origin: the slit-like narrowing is ostial (first millimetres), not mid-vessel.
  const lesionCenterMm = c.plaqueType === 'anomaly' ? 4 : 26;
  const lesionHalfWidthMm = isBridge ? 10 : 6.5;

  const targetDistalFfrCt = isBridge && rrPhasePct <= 50
    ? round(Math.max(0.68, (c.ffrCtDistal ?? 0.84) - 0.11), 2)
    : (c.ffrCtDistal ?? 0.95);
  const totalFfrDrop = Math.max(0.02, 1.0 - targetDistalFfrCt);

  for (let x = 0; x <= totalLenMm; x += 1) {
    const t = x / totalLenMm;
    const refOuterMm = round(4.0 - 1.1 * t, 2);
    const gauss = Math.exp(-(((x - lesionCenterMm) / lesionHalfWidthMm) ** 2));

    // Outer vessel remodeling at lesion
    const riFactor = 1 + ((c.remodelingIndex || 1.0) - 1.0) * gauss;
    const outerDiamMm = round(refOuterMm * riFactor, 2);

    const localStenosisPct = round(effectiveMaxStenosisPct * gauss, 1);
    const lumenDiamMm = round(Math.max(0.45, refOuterMm * (1 - localStenosisPct / 100)), 2);

    // Sigmoidal FFR_CT drop across the lesion + mild distal taper
    const stepFrac = 1 / (1 + Math.exp(-(x - lesionCenterMm) / 3.8));
    const ffrCt = round(clamp(1.0 - totalFfrDrop * (0.85 * stepFrac + 0.15 * t), 0.45, 1.0), 2);

    points.push({
      xMm: x,
      refOuterMm,
      outerDiamMm,
      lumenDiamMm,
      localStenosisPct,
      ffrCt
    });
  }

  return {
    vessel: c.vessel || 'LAD',
    effectiveMaxStenosisPct,
    bloomingBiasPct,
    bridgeSystolicBoost,
    ffrCtDistal: points[points.length - 1].ffrCt,
    points
  };
}

// Annulus-plane normal (patient left +x, anterior +y, cranial +z) divided by its cranial component.
// Chosen so the perpendicularity curve passes through LAO 12 CAU 10 and RAO 16 CAU 24.
const TAVI_ANNULUS_NORMAL = Object.freeze({ xOverZ: -0.5666, yOverZ: 0.3007 });

/**
 * Perpendicularity (S-) curve of the aortic annulus: for a C-arm angulation LAO(+)/RAO(-) alpha,
 * returns the CRA(+)/CAU(-) angle beta at which the beam lies in the annular plane.
 * View direction d = (sin a cos b, cos a cos b, sin b); d . n = 0 gives tan b = -(nx sin a + ny cos a) / nz.
 */
export function taviCoplanarCraCauDeg(laoRaoDeg, normal = TAVI_ANNULUS_NORMAL) {
  const a = (Number(laoRaoDeg) || 0) * Math.PI / 180;
  const tanB = -(normal.xOverZ * Math.sin(a) + normal.yOverZ * Math.cos(a));
  return round(Math.atan(tanB) * 180 / Math.PI, 1);
}

function taviProjectionLabel(laoRaoDeg, craCauDeg, nameTr, nameEn) {
  const side = laoRaoDeg >= 0 ? 'LAO' : 'RAO';
  const tilt = craCauDeg >= 0 ? 'CRA' : 'CAU';
  const head = `${side} ${Math.round(Math.abs(laoRaoDeg))}° · ${tilt} ${Math.round(Math.abs(craCauDeg))}°`;
  return Object.freeze({ tr: `${head} (${nameTr})`, en: `${head} (${nameEn})` });
}

/**
 * Computes the TAVI 3-Cusp Coplanar Fluoroscopic Projection S-Curve (LAO/RAO vs CRA/CAU).
 */
export function computeTaviCoplanarCurve(caseObj) {
  const tavi = caseObj?.taviMetrics || {
    annulusAreaMm2: 468,
    annulusPerimMm: 77.6,
    dMinMm: 21.8,
    dMaxMm: 27.1,
    lcaHeightMm: 11.6,
    rcaHeightMm: 14.4,
    sovDiamMm: 31.8,
    lvotCa: 'mild'
  };

  const dAreaMm = round(2 * Math.sqrt(tavi.annulusAreaMm2 / Math.PI), 1);
  const dPerimMm = round(tavi.annulusPerimMm / Math.PI, 1);
  const eccentricity = round(1 - tavi.dMinMm / Math.max(10, tavi.dMaxMm), 2);

  // S-curve points from RAO 60 (-60) to LAO 60 (+60), all on the annular perpendicularity curve
  const sCurve = [];
  for (let alpha = -60; alpha <= 60; alpha += 5) {
    sCurve.push({ laoRaoDeg: alpha, craCauDeg: taviCoplanarCraCauDeg(alpha) });
  }
  const threeCuspLao = 12;
  const cuspOverlapLao = -16;
  const threeCuspCra = taviCoplanarCraCauDeg(threeCuspLao);
  const cuspOverlapCra = taviCoplanarCraCauDeg(cuspOverlapLao);

  return {
    ...tavi,
    dAreaMm,
    dPerimMm,
    eccentricity,
    threeCuspView: {
      laoRaoDeg: threeCuspLao,
      craCauDeg: threeCuspCra,
      label: taviProjectionLabel(threeCuspLao, threeCuspCra, '3-Kasp Koplanar', '3-Cusp Coplanar')
    },
    cuspOverlapView: {
      laoRaoDeg: cuspOverlapLao,
      craCauDeg: cuspOverlapCra,
      label: taviProjectionLabel(cuspOverlapLao, cuspOverlapCra, 'Kasp Örtüşme LCC/RCC', 'Cusp-Overlap LCC/RCC')
    },
    sCurve
  };
}

/**
 * Evaluates a Cardiac CT calculator card and returns formatted clinical output rows.
 */
export function evaluateCtCalculator(cardId, values = {}, lang = 'tr') {
  const isTr = lang === 'tr';
  const v = key => Number(values[key]) || 0;

  switch (cardId) {
    case 'cad-rads-gen': {
      const sten = clamp(v('maxStenosisPct'), 0, 100);
      const lmOr3v = v('lmOr3v') >= 1;
      const cac = Math.max(0, v('cacScore'));
      const hrp = Math.round(clamp(v('hrpCount'), 0, 4));
      const ffrCt = clamp(v('ffrCt'), 0.4, 1.0);

      // LM >=50% / 3-vessel >=70% only upgrades to 4B when the entered stenosis itself is >=50%.
      const is4B = lmOr3v && sten >= 50;
      let cat = '0';
      if (sten >= 100) cat = '5';
      else if (is4B) cat = '4B';
      else if (sten >= 70) cat = '4A';
      else if (sten >= 50) cat = '3';
      else if (sten >= 25) cat = '2';
      else if (sten >= 1 || cac > 0) cat = '1';

      let pTier = 'P0';
      if (cac > 1000) pTier = 'P4';
      else if (cac >= 301) pTier = 'P3';
      else if (cac >= 101) pTier = 'P2';
      else if (cac >= 1 || sten > 0) pTier = 'P1';

      const mods = [];
      if (pTier !== 'P0') mods.push(pTier);
      if (hrp >= 2) mods.push('HRP');
      if (sten >= 40) mods.push(ffrCt <= 0.75 ? 'I+' : ffrCt <= 0.80 ? 'I±' : 'I-');

      const codeStr = `CAD-RADS ${cat}${mods.length ? ' / ' + mods.join(' / ') : ''}`;
      const status = ['4A', '4B', '5'].includes(cat) || ffrCt <= 0.75 ? 'bad' : cat === '3' || hrp >= 2 ? 'warn' : 'ok';

      let actionText = isTr ? 'Güvenle dışlandı; ek tetkik gerekmez' : 'Obstructive CAD excluded; no further testing';
      if (cat === '4B' || cat === '5') {
        actionText = isTr ? 'İKA & Kalp Takımı revaskülarizasyon değerlendirmesi' : 'ICA & Heart Team revascularization evaluation';
      } else if (cat === '4A' || (cat === '3' && ffrCt <= 0.75)) {
        actionText = isTr ? 'İskemi kanıtlı darlık: İKA / optimal anti-anginal ve yoğun statin' : 'Ischemic stenosis: Consider ICA / anti-anginal & high-intensity statin';
      } else if (cat === '3') {
        actionText = isTr ? 'Orta darlık (FFR_CT >0.75): Yoğun medikal tedavi (OMT)' : 'Moderate stenosis (FFR_CT >0.75): Optimal medical therapy (OMT)';
      } else if (cat === '1' || cat === '2') {
        actionText = isTr ? 'Non-obstrüktif ateroskleroz: Koruyucu statin tedavisi' : 'Non-obstructive plaque: Preventive statin therapy';
      }

      return {
        codeStr,
        status,
        rows: [
          { label: isTr ? 'Resmi CAD-RADS 2.0 Kodu' : 'Official CAD-RADS 2.0 Code', value: codeStr, status },
          { label: isTr ? 'Plak Yükü Kategorisi (CAC)' : 'Plaque Burden Tier (CAC)', value: `${pTier} (${cac} AU)`, status: cac > 300 ? 'bad' : cac > 100 ? 'warn' : 'ok' },
          { label: isTr ? 'CT-FFR Yorumu' : 'CT-FFR Interpretation', value: `${ffrCt.toFixed(2)} (${ffrCt <= 0.75 ? 'I+' : ffrCt <= 0.80 ? (isTr ? 'I± gri bölge' : 'I± borderline') : 'I-'})`, status: ffrCt <= 0.75 ? 'bad' : ffrCt <= 0.80 ? 'warn' : 'ok' },
          { label: isTr ? 'Önerilen Klinik Yaklaşım' : 'Recommended Management', value: actionText, status }
        ]
      };
    }

    case 'agatston-cac': {
      const area = Math.max(0, v('areaMm2'));
      const hu = v('peakHu');
      const other = Math.max(0, v('otherVesselsCac'));

      let weight = 0;
      if (hu >= 400) weight = 4;
      else if (hu >= 300) weight = 3;
      else if (hu >= 200) weight = 2;
      else if (hu >= 130) weight = 1;

      // Agatston counts only lesions of at least 1 mm2 (smaller foci are treated as noise).
      const lesionCac = area < 1 ? 0 : Math.round(area * weight);
      const totalCac = lesionCac + Math.round(other);
      const status = totalCac > 300 ? 'bad' : totalCac >= 100 ? 'warn' : 'ok';

      // Risk groups (0, 1-99, >=100) and CAD-RADS 2.0 plaque burden from CAC (P1 1-100 ... P4 >1000).
      const pTier = totalCac === 0 ? 'P0' : totalCac <= 100 ? 'P1' : totalCac <= 300 ? 'P2' : totalCac <= 1000 ? 'P3' : 'P4';
      const pName = {
        P0: isTr ? 'P0 plak yok' : 'P0 no plaque',
        P1: isTr ? 'P1 hafif' : 'P1 mild',
        P2: isTr ? 'P2 orta' : 'P2 moderate',
        P3: isTr ? 'P3 ciddi' : 'P3 severe',
        P4: isTr ? 'P4 yaygın' : 'P4 extensive'
      }[pTier];
      const riskText = totalCac === 0
        ? (isTr ? 'Çok düşük risk' : 'Very low risk')
        : totalCac < 100
          ? (isTr ? 'Hafif kalsifikasyon' : 'Mild calcification')
          : (isTr ? 'CAC ≥100: statin lehine' : 'CAC ≥100: favours statin');
      const tierText = `${riskText} · ${pName}`;

      return {
        status,
        rows: [
          { label: isTr ? 'HU Yoğunluk Katsayısı (1–4)' : 'HU Density Cofactor (1–4)', value: `${weight} (${hu} HU)`, status: weight >= 3 ? 'warn' : 'ok' },
          { label: isTr ? 'Bu Lezyonun Agatston Skoru' : 'Single Lesion Agatston Score', value: `${lesionCac} AU`, status: 'ok' },
          { label: isTr ? 'Toplam Koroner Agatston (CAC)' : 'Total Coronary Agatston (CAC)', value: `${totalCac} AU`, status },
          { label: isTr ? 'SCCT / ACC Risk Grubu' : 'SCCT / ACC Risk Category', value: tierText, status }
        ]
      };
    }

    case 'tavi-sizing': {
      const area = Math.max(200, v('annAreaMm2'));
      const perim = Math.max(50, v('annPerimMm'));
      const lca = v('lcaHeightMm');
      const vtc = v('vtcMm');

      const dArea = round(2 * Math.sqrt(area / Math.PI), 1);
      const dPerim = round(perim / Math.PI, 1);

      // Balloon-expandable THV by annulus area, self-expanding THV by perimeter (manufacturer ranges).
      const BEV = [[20, 273, 345], [23, 338, 430], [26, 430, 546], [29, 540, 683]];
      const SEV = [[23, 56.5, 62.8], [26, 62.8, 72.3], [29, 72.3, 81.7], [34, 81.7, 94.2]];
      const bev = BEV.find(([, lo, hi]) => area >= lo && area <= hi);
      const sev = SEV.find(([, lo, hi]) => perim >= lo && perim <= hi);
      const outOfRange = isTr ? 'Aralık dışı' : 'Out of range';
      const nominalArea = bev ? Math.round(Math.PI * (bev[0] / 2) ** 2) : null;
      const oversizingPct = nominalArea ? round(((nominalArea / area) - 1) * 100, 1) : null;
      const sevOversizingPct = sev ? round(((Math.PI * sev[0]) / perim - 1) * 100, 1) : null;
      const corRisk = lca < 10 || vtc < 4.0;
      const pct = (x) => `${x >= 0 ? '+' : ''}${x.toFixed(1)}%`;

      return {
        rows: [
          { label: isTr ? 'Alan & Çevre Türevli Çap' : 'Area & Perimeter-Derived Diam', value: `${dArea.toFixed(1)} mm / ${dPerim.toFixed(1)} mm`, status: 'ok' },
          {
            label: isTr ? 'Balonla Genişleyen Kapak (alana göre)' : 'Balloon-Expandable THV (by area)',
            value: bev ? `${bev[0]} mm (${bev[1]}–${bev[2]} mm²) · ${isTr ? 'alan' : 'area'} ${pct(oversizingPct)}` : outOfRange,
            status: bev ? 'ok' : 'warn'
          },
          {
            label: isTr ? 'Kendiliğinden Genişleyen Kapak (çevreye göre)' : 'Self-Expanding THV (by perimeter)',
            value: sev ? `${sev[0]} mm (${sev[1]}–${sev[2]} mm) · ${isTr ? 'çevre' : 'perimeter'} ${pct(sevOversizingPct)}` : outOfRange,
            status: sev ? 'ok' : 'warn'
          },
          {
            label: isTr ? 'Koroner Obstrüksiyon Riski (LCA/VTC)' : 'Coronary Obstruction Risk (LCA/VTC)',
            value: corRisk
              ? (isTr ? `YÜKSEK RİSK (LCA ${lca} mm, VTC ${vtc} mm)` : `HIGH RISK (LCA ${lca} mm, VTC ${vtc} mm)`)
              : (isTr ? `DÜŞÜK RİSK (LCA ${lca} mm ≥10, VTC ${vtc} mm ≥4)` : `LOW RISK (LCA ${lca} mm ≥10, VTC ${vtc} mm ≥4)`),
            status: corRisk ? 'bad' : 'ok'
          }
        ]
      };
    }

    case 'hrp-remodeling': {
      const lesA = Math.max(2, v('lesionVesselArea'));
      const refA = Math.max(2, v('refVesselArea'));
      const minHu = v('minPlaqueHu');
      const extra = Math.round(clamp(v('spottyOrNapkin'), 0, 2));

      const ri = round(lesA / refA, 2);
      const hasLap = minHu < 30 ? 1 : 0;
      const hasPosRi = ri >= 1.1 ? 1 : 0;
      const totalHrp = hasLap + hasPosRi + extra;
      const isHrpPositive = totalHrp >= 2;

      return {
        rows: [
          { label: isTr ? 'Remodeling İndeksi (RI ≥1.10)' : 'Remodeling Index (RI ≥1.10)', value: `${ri.toFixed(2)} (${hasPosRi ? (isTr ? 'Pozitif' : 'Positive') : 'Normal'})`, status: hasPosRi ? 'warn' : 'ok' },
          { label: isTr ? 'Düşük Atenüasyonlu Plak (<30 HU)' : 'Low-Attenuation Plaque (<30 HU)', value: `${minHu} HU (${hasLap ? (isTr ? 'Lipid çekirdek +' : 'Lipid core +') : (isTr ? 'Fibröz/kalsifik' : 'Fibrous/calcified')})`, status: hasLap ? 'bad' : 'ok' },
          { label: isTr ? 'Toplam HRP Kriter Sayısı (0–4)' : 'Total HRP Criteria Count (0–4)', value: `${totalHrp} / 4`, status: isHrpPositive ? 'bad' : 'ok' },
          {
            label: isTr ? 'CAD-RADS 2.0 /HRP Kararı' : 'CAD-RADS 2.0 /HRP Verdict',
            value: isHrpPositive
              ? (isTr ? 'POZİTİF (/HRP ekle · artmış koroner olay riski)' : 'POSITIVE (add /HRP · higher coronary event risk)')
              : (isTr ? 'NEGATİF (<2 Kriter)' : 'NEGATIVE (<2 Features)'),
            status: isHrpPositive ? 'bad' : 'ok'
          }
        ]
      };
    }

    case 'radiation-dose': {
      const dlp = Math.max(10, v('dlp'));
      const flow = Math.max(2, v('flowRateMlSec'));
      const dur = Math.max(3, v('injectionSec'));

      const effChest = round(dlp * 0.014, 2);
      const effCardiac = round(dlp * 0.026, 2);
      const contrastMl = Math.round(flow * dur);

      return {
        rows: [
          { label: isTr ? 'Efektif Doz (Standart k=0.014)' : 'Effective Dose (Standard k=0.014)', value: `${effChest.toFixed(2)} mSv`, status: effChest <= 3.5 ? 'ok' : effChest <= 8 ? 'warn' : 'bad' },
          { label: isTr ? 'Efektif Doz (Kardiyak k=0.026)' : 'Effective Dose (Cardiac k=0.026)', value: `${effCardiac.toFixed(2)} mSv`, status: effCardiac <= 6 ? 'ok' : 'warn' },
          { label: isTr ? 'Toplam Kontrast Madde Hacmi' : 'Total Contrast Bolus Volume', value: `${contrastMl} mL (+ 40 mL ${isTr ? 'salin kovalayıcı' : 'saline chaser'})`, status: contrastMl <= 75 ? 'ok' : 'warn' }
        ]
      };
    }

    default:
      return { rows: [] };
  }
}

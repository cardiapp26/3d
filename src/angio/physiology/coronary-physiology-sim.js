// Coronary Physiology Lab · Deterministic Hemodynamic & Waveform Simulation Engine
// Pure functions for pressure wire, bolus/continuous thermodilution, and Doppler calculations.

import { CLINICAL_CASES, CORONARY_TERRITORIES } from './coronary-physiology-data.js';

export const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || 0));
const logistic = z => 1 / (1 + Math.exp(-z));
const round = (v, digits = 2) => {
  const f = 10 ** digits;
  return Math.round((Number(v) || 0) * f) / f;
};

export function findClinicalCase(caseId) {
  return CLINICAL_CASES.find(c => c.id === caseId) || CLINICAL_CASES[0];
}

export function findTerritory(territoryId) {
  return CORONARY_TERRITORIES.find(t => t.id === territoryId) || CORONARY_TERRITORIES[0];
}

/**
 * Computes Pd(x)/Pa along the coronary vessel from ostium (0 mm) to distal (80 mm).
 */
export function samplePullbackRatio(caseObj, xMm, options = {}) {
  const {
    hyperemia = true,
    stentedIds = [],
    underexpanded = false,
    microcatheter = false
  } = options;

  const x = clamp(xMm, 0, 80);
  if (x <= 2) return 1.0;

  const stentedSet = new Set(stentedIds);
  const lesions = caseObj?.lesions || [];
  const untreatedCount = lesions.filter(l => !stentedSet.has(l.id)).length;
  // Serial lesion flow unmasking: when one of two tandem lesions is stented, flow rises and the remaining lesion drop increases by ~18%.
  const serialUnmaskFactor = lesions.length > 1 && untreatedCount === 1 ? 1.18 : 1.0;

  let totalDropAtX = 0;

  // 1. Diffuse background loss between 5 mm and 75 mm
  const diffuseSpan = clamp((x - 5) / 70, 0, 1);
  totalDropAtX += (caseObj?.diffuseLoss || 0.03) * diffuseSpan;

  // 2. Focal lesion step losses
  for (const lesion of lesions) {
    const width = Math.max(1.5, (lesion.lengthMm || 6) * 0.35);
    const stepFrac = clamp((logistic((x - lesion.posMm) / width) - logistic((-lesion.posMm) / width)) /
      (1 - logistic((-lesion.posMm) / width)), 0, 1);
    if (stentedSet.has(lesion.id)) {
      const residualDrop = underexpanded ? 0.06 : 0.008;
      totalDropAtX += residualDrop * stepFrac;
    } else {
      const mcBias = microcatheter ? 0.03 : 0;
      totalDropAtX += (lesion.ffrDrop * serialUnmaskFactor + mcBias) * stepFrac;
    }
  }

  const ffrAtX = clamp(1.0 - totalDropAtX, 0.28, 1.0);
  if (hyperemia) return round(ffrAtX, 3);

  // At rest, autoregulation preserves flow so pressure loss is blunted
  const restLoss = (1.0 - ffrAtX) * 0.36;
  return round(clamp(1.0 - restLoss, 0.45, 1.0), 3);
}

/**
 * Computes resting iFR (diastolic wave-free NHPR) from hyperemic FFR.
 */
export function computeIfrFromFfr(ffr) {
  const f = clamp(ffr, 0.30, 1.0);
  const ifr = 1.0 - (1.0 - f) * 0.47;
  return round(clamp(ifr, 0.40, 1.0), 2);
}

/**
 * Full hyperemic pullback curve (0..80 mm) + Collet PPG index + Virtual PCI TSG.
 */
export function computePullbackAnalysis(caseObj, options = {}) {
  const points = [];
  for (let x = 0; x <= 80; x += 1) {
    const ffr = samplePullbackRatio(caseObj, x, { ...options, hyperemia: true });
    const restRatio = samplePullbackRatio(caseObj, x, { ...options, hyperemia: false });
    points.push({ xMm: x, ffr, restRatio });
  }

  const ffrDistal = round(points[75].ffr, 2);
  const restDistal = round(points[75].restRatio, 2);
  const ifrDistal = computeIfrFromFfr(ffrDistal);
  const totalDelta = round(Math.max(0, 1.0 - ffrDistal), 3);

  let maxDelta20 = 0;
  let maxWindowStart = 0;
  for (let i = 0; i <= 60; i += 1) {
    const drop20 = points[i].ffr - points[i + 20].ffr;
    if (drop20 > maxDelta20) {
      maxDelta20 = drop20;
      maxWindowStart = i;
    }
  }
  maxDelta20 = round(maxDelta20, 3);

  let functionalLengthMm = 0;
  const dropsPerMm = [];
  for (let i = 1; i <= 80; i += 1) {
    const dFfr = Math.max(0, points[i - 1].ffr - points[i].ffr);
    dropsPerMm.push({ xMm: i, dFfr: round(dFfr, 4) });
    if (dFfr >= 0.0015) functionalLengthMm += 1;
  }

  const ppg = totalDelta < 0.05
    ? 0.75
    : round(clamp(((maxDelta20 / Math.max(0.01, totalDelta)) + (1 - functionalLengthMm / 80)) / 2, 0, 1), 2);

  const stentedSet = new Set(options.stentedIds || []);
  const activeLesions = (caseObj?.lesions || []).filter(l => !stentedSet.has(l.id));

  let pattern = 'normal';
  if (ffrDistal <= 0.80) {
    if (activeLesions.length >= 2) pattern = 'serial';
    else if (ppg >= 0.62) pattern = 'focal';
    else pattern = 'diffuse';
  }

  // Trans-stent gradient (TSG) across stented segment(s)
  let tsg = 0;
  for (const lesion of caseObj?.lesions || []) {
    if (stentedSet.has(lesion.id)) {
      const proxX = clamp(Math.round(lesion.posMm - lesion.lengthMm), 0, 80);
      const distX = clamp(Math.round(lesion.posMm + lesion.lengthMm), 0, 80);
      const segDrop = Math.max(0, points[proxX].ffr - points[distX].ffr);
      if (segDrop > tsg) tsg = segDrop;
    }
  }

  return {
    points,
    dropsPerMm,
    ffrDistal,
    restDistal,
    ifrDistal,
    totalDelta: round(totalDelta, 2),
    maxDelta20: round(maxDelta20, 2),
    maxWindowStart,
    functionalLengthMm,
    ppg,
    pattern,
    tsg: round(tsg, 2)
  };
}

/**
 * Synthesizes instantaneous Pa and Pd pressure (mmHg) at cardiac cycle phase [0..1),
 * including realistic dicrotic notch and optional cath-lab waveform artifacts.
 */
export function samplePressureBeat(phase, options = {}) {
  const p = ((Number(phase) || 0) % 1 + 1) % 1;
  const sys = options.sys ?? 134;
  const dia = options.dia ?? 76;
  const trueRatio = clamp(options.trueRatio ?? 0.96, 0.25, 1.05);
  const hyperemia = Boolean(options.hyperemia);
  const artifact = options.artifactFixed ? 'none' : (options.artifact || 'none');

  // Hyperemia slightly lowers systemic aortic pressure by ~6%
  const hypScale = hyperemia ? 0.94 : 1.0;
  const paSys = sys * hypScale;
  const paDia = dia * hypScale;
  const pulse = paSys - paDia;

  // Base physiological aortic pressure contour
  const upstroke = Math.exp(-(((p - 0.16) / 0.095) ** 2));
  const lateSystole = 0.42 * Math.exp(-(((p - 0.27) / 0.075) ** 2));
  const notchDip = -0.11 * Math.exp(-(((p - 0.34) / 0.022) ** 2));
  const dicroticWave = 0.16 * Math.exp(-(((p - 0.39) / 0.055) ** 2));
  const diastoleRunoff = p > 0.35 ? 0.28 * Math.exp(-(p - 0.35) * 2.6) : 0;

  const shape = clamp((upstroke + lateSystole + notchDip + dicroticWave + diastoleRunoff) / 1.16, 0, 1.05);
  let pa = paDia + pulse * shape;

  // Distal pressure contour: slightly more diastolic drop during hyperemia when stenotic
  const stenosisSeverity = 1.0 - trueRatio;
  const diastolicAccent = hyperemia ? 1.0 - stenosisSeverity * 0.14 * (p > 0.35 ? 1 : 0.4) : 1.0;
  let pd = pa * trueRatio * diastolicAccent;

  // Apply cath-lab artifacts if active
  if (artifact === 'drift') {
    // Downward sensor drift of -7 mmHg preserving notch and contour
    pd -= 7.0;
  } else if (artifact === 'vent') {
    // Deep/wedged guide catheter: loses dicrotic notch and dips sharply in diastole
    const ventDip = p > 0.34 ? (hyperemia ? 24 : 15) * (1 - Math.exp(-(p - 0.34) * 5)) : 0;
    const noNotch = paDia + pulse * 0.86 * Math.exp(-(((p - 0.20) / 0.13) ** 2)) - ventDip;
    pa = Math.max(32, noNotch);
  } else if (artifact === 'damp') {
    // Contrast/air damping: rounded low-amplitude sine wave around lowered mean
    const meanPa = paDia + pulse * 0.38 - 8;
    pa = meanPa + pulse * 0.18 * Math.sin(p * Math.PI * 2 - 0.5);
  } else if (artifact === 'whip') {
    // Wire whip: sharp high-frequency systolic spike on Pd
    const whipSpike = 22 * Math.exp(-(((p - 0.14) / 0.014) ** 2)) - 9 * Math.exp(-(((p - 0.17) / 0.015) ** 2));
    pd += whipSpike;
  } else if (artifact === 'leak') {
    // Open hemostatic valve leak: Pa reads ~12 mmHg artificially low
    pa = Math.max(30, pa - 12);
  }

  return {
    pa: round(pa, 1),
    pd: round(pd, 1),
    instantRatio: round(clamp(pd / Math.max(25, pa), 0.2, 1.3), 2)
  };
}

/**
 * Computes mean Pa, mean Pd, Pd/Pa, FFR, and iFR for the current case & wire state.
 */
export function computeConsoleReadout(caseObj, state = {}) {
  const sensorMm = clamp(state.sensorMm ?? 75, 0, 80);
  const hyperemia = Boolean(state.hyperemia);
  const equalized = Boolean(state.equalized);
  const artifact = state.artifactFixed ? 'none' : (caseObj?.artifact || 'none');

  const trueRatio = samplePullbackRatio(caseObj, sensorMm, {
    hyperemia,
    stentedIds: state.stentedIds || [],
    underexpanded: state.underexpanded || false,
    microcatheter: state.device === 'mc'
  });

  // Integrate over 40 samples of a cardiac cycle
  let sumPa = 0;
  let sumPd = 0;
  for (let i = 0; i < 40; i += 1) {
    const s = samplePressureBeat(i / 40, {
      sys: caseObj?.cuff?.[0] ?? 134,
      dia: caseObj?.cuff?.[1] ?? 76,
      trueRatio,
      hyperemia,
      artifact,
      artifactFixed: state.artifactFixed
    });
    sumPa += s.pa;
    sumPd += s.pd;
  }

  const meanPa = Math.round(sumPa / 40);
  const rawMeanPd = sumPd / 40;
  const uncalibratedOffset = equalized ? 0 : 3.5;
  const meanPd = Math.round(rawMeanPd + uncalibratedOffset);
  const ratio = round(clamp(meanPd / Math.max(30, meanPa), 0.25, 1.25), 2);

  const restTrueRatio = samplePullbackRatio(caseObj, sensorMm, {
    hyperemia: false,
    stentedIds: state.stentedIds || [],
    underexpanded: state.underexpanded || false,
    microcatheter: state.device === 'mc'
  });
  const hypTrueRatio = samplePullbackRatio(caseObj, sensorMm, {
    hyperemia: true,
    stentedIds: state.stentedIds || [],
    underexpanded: state.underexpanded || false,
    microcatheter: state.device === 'mc'
  });

  // Artifact bias on displayed FFR
  let artifactFfrBias = 0;
  if (artifact === 'drift') artifactFfrBias = -0.08;
  else if (artifact === 'vent') artifactFfrBias = +0.09;
  else if (artifact === 'damp') artifactFfrBias = +0.07;
  else if (artifact === 'leak') artifactFfrBias = +0.08;

  const ffrVal = round(clamp(hypTrueRatio + artifactFfrBias, 0.25, 1.12), 2);
  const ifrVal = computeIfrFromFfr(clamp(hypTrueRatio + artifactFfrBias * 0.7, 0.30, 1.05));

  return {
    meanPa,
    meanPd,
    pdPa: ratio,
    ffr: ffrVal,
    ifr: ifrVal,
    restPdPa: round(restTrueRatio, 2),
    sensorMm: Math.round(sensorMm),
    heartRate: caseObj?.heartRate ?? 68
  };
}

/**
 * Computes Bolus Thermodilution metrics (Tmn rest/hyp, CFR, IMR, Yong IMR_corr, RRR, MRR).
 */
export function computeBolusThermodilution(caseObj, options = {}) {
  const territory = findTerritory(options.territory || caseObj?.vessel || 'LAD');
  const qRestBase = (caseObj?.micro?.qRestBase ?? 68) * territory.scaleFlow;
  const imrTarget = caseObj?.micro?.imr ?? 15;

  const ffrDistal = samplePullbackRatio(caseObj, 75, {
    hyperemia: true,
    stentedIds: options.stentedIds || [],
    underexpanded: options.underexpanded || false
  });
  const restRatio = samplePullbackRatio(caseObj, 75, {
    hyperemia: false,
    stentedIds: options.stentedIds || [],
    underexpanded: options.underexpanded || false
  });

  const sys = caseObj?.cuff?.[0] ?? 134;
  const dia = caseObj?.cuff?.[1] ?? 76;
  const paRest = Math.round(dia + (sys - dia) * 0.38);
  const paHyp = Math.round(paRest * 0.93);
  const pdRest = Math.round(paRest * restRatio);
  const pdHyp = Math.round(paHyp * ffrDistal);

  // Vascular indicator volume ~ 52 mL·s/min equivalent so Tmn_rest ~ 0.75-0.90 s
  const tmnRestBase = clamp(54 / Math.max(25, qRestBase), 0.22, 1.65);
  // IMR = Pd_hyp * Tmn_hyp => Tmn_hyp = IMR / Pd_hyp
  const tmnHypBase = clamp(imrTarget / Math.max(35, pdHyp), 0.12, 1.35);

  const restTrials = options.restTrials?.length
    ? options.restTrials
    : [round(tmnRestBase * 0.97, 2), round(tmnRestBase * 1.03, 2), round(tmnRestBase * 0.99, 2)];

  const hypTrials = options.hypTrials?.length
    ? options.hypTrials
    : [round(tmnHypBase * 1.02, 2), round(tmnHypBase * 0.96, 2), round(tmnHypBase * 1.01, 2)];

  const mean = arr => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
  const tmnRest = round(mean(restTrials), 2);
  const tmnHyp = round(mean(hypTrials), 2);

  const cfr = round(tmnRest / Math.max(0.08, tmnHyp), 2);
  const imr = round(pdHyp * tmnHyp, 1);
  // Yong collateral-corrected IMR: Pa * Tmn * (1.35 * Pd/Pa - 0.32)
  const imrCorr = round(Math.max(5, paHyp * tmnHyp * (1.35 * ffrDistal - 0.32)), 1);
  const rrr = round((pdRest * tmnRest) / Math.max(1, pdHyp * tmnHyp), 2);
  const mrr = round((cfr / Math.max(0.25, ffrDistal)) * (paRest / Math.max(35, paHyp)), 2);

  let classification = 'normal';
  if (cfr < 2.5 && imr >= 25) classification = 'structural-cmd';
  else if (cfr < 2.5 && imr < 25) classification = 'functional-cmd';
  else if (ffrDistal <= 0.80) classification = 'epicardial-obstructive';

  return {
    paRest,
    pdRest,
    paHyp,
    pdHyp,
    ffr: round(ffrDistal, 2),
    restPdPa: round(restRatio, 2),
    restTrials,
    hypTrials,
    tmnRest,
    tmnHyp,
    cfr,
    imr,
    imrCorr,
    rrr,
    mrr,
    classification
  };
}

/**
 * Generates a normalized bolus thermodilution curve deltaT(t) for t in [0..6] seconds.
 */
export function sampleBolusCurve(tSec, tmnSec, amplitudeDegC = -1.8) {
  const t = Math.max(0, Number(tSec) || 0);
  const onset = 0.35;
  if (t <= onset) return 0;
  const tau = Math.max(0.08, Number(tmnSec) || 0.3) * 0.42;
  const u = (t - onset) / tau;
  // Gamma-variate dilution profile peaking at u = 2
  const normalized = (u ** 2) * Math.exp(2 - u) / 4;
  return round(amplitudeDegC * normalized, 3);
}

/**
 * Computes Continuous Thermodilution absolute flow (Q, mL/min) and microvascular resistance (Rμ, WU).
 * Q = 1.08 * (Ti / T) * Qi
 */
export function computeContinuousThermodilution(caseObj, options = {}) {
  const territory = findTerritory(options.territory || caseObj?.vessel || 'LAD');
  const qiRest = Number(options.qiRest) || territory.defaultInfRest;
  const qiHyp = Number(options.qiHyp) || territory.defaultInfHyp;

  const ffrDistal = samplePullbackRatio(caseObj, 75, {
    hyperemia: true,
    stentedIds: options.stentedIds || [],
    underexpanded: options.underexpanded || false
  });
  const restRatio = samplePullbackRatio(caseObj, 75, {
    hyperemia: false,
    stentedIds: options.stentedIds || [],
    underexpanded: options.underexpanded || false
  });

  const sys = caseObj?.cuff?.[0] ?? 134;
  const dia = caseObj?.cuff?.[1] ?? 76;
  const paRest = Math.round(dia + (sys - dia) * 0.38);
  const paHyp = Math.round(paRest * 0.94);
  const pdRest = Math.round(paRest * restRatio);
  const pdHyp = Math.round(paHyp * ffrDistal);

  const rmuRestTarget = (caseObj?.micro?.rmuRest ?? 1398) / territory.scaleFlow;
  const rmuHypTarget = (caseObj?.micro?.rmuHyp ?? 325) / territory.scaleFlow;

  // Q (L/min) = Pd / Rμ => Q (mL/min) = (Pd / Rμ) * 1000
  const qRestTrue = clamp((pdRest / Math.max(200, rmuRestTarget)) * 1000, 25, 220);
  const qHypTrue = clamp((pdHyp / Math.max(120, rmuHypTarget)) * 1000, 55, 420);

  const tiRest = -3.05;
  const tiHyp = -3.33;

  // Since Q = 1.08 * (Ti / T) * Qi => T = 1.08 * Ti * Qi / Q
  const tRest = round(clamp((1.08 * tiRest * qiRest) / qRestTrue, -2.5, -0.08), 2);
  const tHyp = round(clamp((1.08 * tiHyp * qiHyp) / qHypTrue, -2.5, -0.06), 2);

  const qRest = Math.round(1.08 * (tiRest / tRest) * qiRest);
  const qHyp = Math.round(1.08 * (tiHyp / tHyp) * qiHyp);

  const rmuRest = Math.round((pdRest / Math.max(10, qRest)) * 1000);
  const rmuHyp = Math.round((pdHyp / Math.max(10, qHyp)) * 1000);
  const cfrCont = round(qHyp / Math.max(10, qRest), 2);
  const mrr = round((qHyp / Math.max(10, qRest)) * (paRest / Math.max(25, pdHyp)), 2);

  return {
    territory: territory.id,
    qiRest,
    qiHyp,
    tiRest: round(tiRest, 2),
    tRest,
    tiHyp: round(tiHyp, 2),
    tHyp,
    paRest,
    pdRest,
    paHyp,
    pdHyp,
    ffr: round(ffrDistal, 2),
    qRest,
    qHyp,
    rmuRest,
    rmuHyp,
    cfrCont,
    mrr
  };
}

/**
 * Computes Doppler flow velocity (APV), CFR, HMR, HSR, CBF, and Acetylcholine provocation response.
 */
export function computeDopplerAssessment(caseObj, options = {}) {
  const dop = caseObj?.doppler || {
    apvRest: 22,
    apvHyp: 84,
    diamMm: 2.8,
    achResponse: [
      { dose: 'low', flowDeltaPct: 26, diamDeltaPct: 3, angina: false, ecg: 'normal' },
      { dose: 'mid', flowDeltaPct: 64, diamDeltaPct: 5, angina: false, ecg: 'normal' },
      { dose: 'high', flowDeltaPct: 98, diamDeltaPct: 8, angina: false, ecg: 'normal' }
    ],
    ntgDiamDeltaPct: 22
  };

  const ffrDistal = samplePullbackRatio(caseObj, 75, { hyperemia: true });
  const sys = caseObj?.cuff?.[0] ?? 132;
  const dia = caseObj?.cuff?.[1] ?? 74;
  const paHyp = Math.round((dia + (sys - dia) * 0.38) * 0.94);
  const pdHyp = Math.round(paHyp * ffrDistal);

  const apvRest = dop.apvRest;
  const apvHyp = dop.apvHyp;
  const cfrDop = round(apvHyp / Math.max(5, apvRest), 1);
  const hmr = round(pdHyp / Math.max(5, apvHyp), 2);
  const hsr = round(Math.max(0, paHyp - pdHyp) / Math.max(5, apvHyp), 2);

  // Cross-sectional area A = pi * (D/2)^2 in mm^2 = pi * (D/20)^2 in cm^2
  // CBF (mL/min) = 0.5 * APV (cm/s) * Area (cm^2) * 60 (s/min)
  const calcCbf = (apv, diamMm) => {
    const rCm = (diamMm / 2) / 10;
    const areaCm2 = Math.PI * rCm * rCm;
    return round(0.5 * apv * areaCm2 * 60, 1);
  };

  const diamRest = dop.diamMm;
  const cbfRest = calcCbf(apvRest, diamRest);

  const achSteps = (dop.achResponse || []).map(step => {
    const diamMm = round(Math.max(0.25, diamRest * (1 + step.diamDeltaPct / 100)), 2);
    const targetCbf = Math.max(3, cbfRest * (1 + step.flowDeltaPct / 100));
    const rCm = (diamMm / 2) / 10;
    const areaCm2 = Math.max(0.0005, Math.PI * rCm * rCm);
    const stepApv = Math.round(clamp(targetCbf / (0.5 * areaCm2 * 60), 6, 160));
    return {
      dose: step.dose,
      diamMm,
      diamDeltaPct: step.diamDeltaPct,
      cbfMlMin: round(targetCbf, 1),
      flowDeltaPct: step.flowDeltaPct,
      apv: stepApv,
      angina: step.angina,
      ecg: step.ecg
    };
  });

  const activeAchIndex = clamp((options.achStep ?? 0) - 1, -1, 2);
  const activeAch = activeAchIndex >= 0 ? achSteps[activeAchIndex] : null;
  const highStep = achSteps[2] || achSteps.at(-1);

  let achEndotype = 'normal';
  if (highStep) {
    if (highStep.diamDeltaPct <= -90 && highStep.angina) achEndotype = 'epicardial-spasm';
    else if (highStep.angina && highStep.ecg !== 'normal' && highStep.diamDeltaPct > -90) achEndotype = 'microvascular-spasm';
    else if (highStep.flowDeltaPct < 50 || highStep.diamDeltaPct < -20) achEndotype = 'endothelial-dysfunction';
  }

  return {
    apvRest,
    apvHyp,
    cfrDop,
    hmr,
    hsr,
    paHyp,
    pdHyp,
    ffr: round(ffrDistal, 2),
    diamRest,
    cbfRest,
    achSteps,
    activeAch,
    ntgGiven: Boolean(options.ntgGiven),
    ntgDiamMm: round(diamRest * (1 + (dop.ntgDiamDeltaPct || 20) / 100), 2),
    achEndotype
  };
}

/**
 * Interactive Cause-and-Effect Hemodynamic Simulator (Rest vs Hyperemia + 4 Modalities + Pressure-Flow Curve).
 */
export function simulateHemodynamicCircuit(params = {}) {
  const paRest = clamp(params.mapMmHg ?? 96, 55, 145);
  const heartRate = clamp(params.heartRate ?? 68, 45, 130);
  const stenosisPct = clamp(params.stenosisPct ?? 50, 0, 92);
  const diffusePct = clamp(params.diffusePct ?? 5, 0, 45);
  const rmuHypWu = clamp(params.rmuHypWu ?? 320, 160, 950);
  const lvedp = clamp(params.lvedpMmHg ?? 8, 2, 32);

  // Stenosis resistance: Poiseuille (linear) + Gould separation (quadratic)
  const areaRatio = Math.max(0.06, (1 - stenosisPct / 100) ** 2);
  const rEpiLinear = 2.4 * (1 / areaRatio - 1) + diffusePct * 1.9;
  const kSeparation = 0.55 * ((1 / areaRatio - 1) ** 1.35);

  // Resting flow rises with HR and BP demand
  const qRestTarget = clamp(65 * (0.65 + 0.35 * (heartRate / 68) * (paRest / 96)), 35, 145);

  // Solve ΔP_epi (mmHg) from volumetric flow Q (mL/min)
  const epiPressureLoss = qMlMin => {
    const qL = qMlMin / 1000;
    return rEpiLinear * qL * 4.2 + kSeparation * (qL ** 2) * 85;
  };

  const deltaPRest = clamp(epiPressureLoss(qRestTarget), 0, paRest - lvedp - 15);
  const pdRest = Math.max(lvedp + 12, paRest - deltaPRest);
  const qRest = pdRest > lvedp + 15 ? qRestTarget : qRestTarget * 0.75;
  const rmuRestWu = Math.round(((pdRest - lvedp * 0.4) / Math.max(15, qRest)) * 1000);

  // Hyperemia: Pa drops ~6%, Rμ drops to rmuHypWu; solve quadratic for Q_hyp
  const paHyp = Math.round(paRest * 0.94);
  let qHyp = 180;
  for (let iter = 0; iter < 18; iter += 1) {
    const loss = epiPressureLoss(qHyp);
    const pd = Math.max(lvedp + 8, paHyp - loss);
    const qNext = ((pd - lvedp * 0.5) / rmuHypWu) * 1000;
    qHyp = 0.5 * qHyp + 0.5 * clamp(qNext, 30, 420);
  }
  qHyp = Math.round(qHyp);
  const pdHyp = Math.round(clamp(paHyp - epiPressureLoss(qHyp), lvedp + 8, paHyp));

  const restPdPa = round(pdRest / paRest, 2);
  const ffr = round(pdHyp / paHyp, 2);
  const ifr = computeIfrFromFfr(ffr);
  const cfr = round(qHyp / Math.max(15, qRest), 2);
  const mrr = round((cfr / Math.max(0.25, ffr)) * (paRest / Math.max(35, paHyp)), 2);

  const tmnRest = round(54 / Math.max(20, qRest), 2);
  const tmnHyp = round(54 / Math.max(25, qHyp), 2);
  const imr = round(pdHyp * tmnHyp, 1);

  const apvRest = Math.round(qRest * 0.32);
  const apvHyp = Math.round(qHyp * 0.32);
  const hmr = round(pdHyp / Math.max(5, apvHyp), 2);

  // Endotype classification
  let endotype = 'normal';
  if (ffr <= 0.80 && imr >= 25) endotype = 'mixed-epi-cmd';
  else if (ffr <= 0.80) endotype = 'epicardial-ischemia';
  else if (cfr < 2.2 && (imr >= 25 || rmuHypWu > 470)) endotype = 'structural-cmd';
  else if (cfr < 2.2 && imr < 25) endotype = 'functional-cmd';

  // Pressure-flow curve points for P in [30..140] mmHg
  const pqCurve = [];
  for (let p = 30; p <= 140; p += 10) {
    const qAuto = clamp(qRest * (0.4 + 0.6 * logistic((p - 52) / 10)), 18, 150);
    const qMaxNormal = Math.max(15, ((p - lvedp * 0.5) / 300) * 1000);
    const qMaxCurrent = Math.max(10, ((p - lvedp * 0.5) / rmuHypWu) * 1000);
    pqCurve.push({
      pressure: p,
      qRest: round(qAuto, 1),
      qMaxNormal: round(qMaxNormal, 1),
      qMaxCurrent: round(qMaxCurrent, 1)
    });
  }

  return {
    paRest: Math.round(paRest),
    pdRest: Math.round(pdRest),
    paHyp,
    pdHyp,
    restPdPa,
    ffr,
    ifr,
    qRest: Math.round(qRest),
    qHyp,
    rmuRestWu,
    rmuHypWu: Math.round(rmuHypWu),
    cfr,
    mrr,
    tmnRest,
    tmnHyp,
    imr,
    apvRest,
    apvHyp,
    hmr,
    endotype,
    pqCurve
  };
}

/**
 * Evaluates a user-supplied Calculator Card input map and returns computed outputs + clinical status.
 */
export function evaluateCalculatorCard(cardId, values = {}) {
  const v = key => Number(values[key]) || 0;
  switch (cardId) {
    case 'ffr-nhpr': {
      const restPdPa = round(v('pdRest') / Math.max(20, v('paRest')), 2);
      const ffr = round(v('pdHyp') / Math.max(20, v('paHyp')), 2);
      const ffrFull = round((v('pdHyp') - v('pv')) / Math.max(10, v('paHyp') - v('pv')), 2);
      const status = ffr <= 0.80 ? 'bad' : ffr <= 0.85 ? 'warn' : 'ok';
      return {
        status,
        rows: [
          { label: 'FFR (Pd/Pa hyp)', value: ffr.toFixed(2), status },
          { label: 'FFR (Pv corrected)', value: ffrFull.toFixed(2), status: ffrFull <= 0.80 ? 'bad' : 'ok' },
          { label: 'Resting Pd/Pa', value: restPdPa.toFixed(2), status: restPdPa <= 0.91 ? 'bad' : 'ok' }
        ]
      };
    }
    case 'ppg-collet': {
      const maxD = clamp(v('maxDelta20'), 0, 1);
      const totD = Math.max(0.01, v('totalDelta'));
      const fLen = clamp(v('funcLenMm'), 0, v('totalLenMm') || 80);
      const tLen = Math.max(20, v('totalLenMm'));
      const ppg = round(clamp(((maxD / totD) + (1 - fLen / tLen)) / 2, 0, 1), 2);
      const status = ppg >= 0.62 ? 'ok' : 'warn';
      return {
        status,
        rows: [
          { label: 'PPG Index', value: ppg.toFixed(2), status },
          { label: 'Pattern', value: ppg >= 0.62 ? 'Focal (≥0.62)' : 'Diffuse (<0.62)', status }
        ]
      };
    }
    case 'bolus-thermo': {
      const tRest = Math.max(0.05, v('tmnRest'));
      const tHyp = Math.max(0.05, v('tmnHyp'));
      const paHyp = Math.max(30, v('paHyp'));
      const pdHyp = Math.max(15, v('pdHyp'));
      const pdRest = Math.max(20, v('pdRest'));
      const ffr = pdHyp / paHyp;
      const cfr = round(tRest / tHyp, 2);
      const imr = round(pdHyp * tHyp, 1);
      const imrCorr = round(Math.max(4, paHyp * tHyp * (1.35 * ffr - 0.32)), 1);
      const rrr = round((pdRest * tRest) / (pdHyp * tHyp), 2);
      const status = cfr < 2.5 || imr >= 25 ? 'bad' : 'ok';
      return {
        status,
        rows: [
          { label: 'CFR (bolus)', value: cfr.toFixed(2), status: cfr < 2.0 ? 'bad' : cfr < 2.5 ? 'warn' : 'ok' },
          { label: 'IMR', value: `${imr.toFixed(1)} U`, status: imr >= 25 ? 'bad' : 'ok' },
          { label: 'IMR (Yong corr.)', value: `${imrCorr.toFixed(1)} U`, status: imrCorr >= 25 ? 'bad' : 'ok' },
          { label: 'RRR', value: rrr.toFixed(2), status: rrr < 2.6 ? 'warn' : 'ok' }
        ]
      };
    }
    case 'cont-thermo': {
      const qRest = round(1.08 * (Math.abs(v('tiRest')) / Math.max(0.02, Math.abs(v('tRest')))) * v('qiRest'), 0);
      const qHyp = round(1.08 * (Math.abs(v('tiHyp')) / Math.max(0.02, Math.abs(v('tHyp')))) * v('qiHyp'), 0);
      const pdHyp = Math.max(20, v('pdHyp'));
      const paRest = Math.max(30, v('paRest'));
      const paHyp = Math.max(30, v('paHyp'));
      const ffr = pdHyp / paHyp;
      const rmuHyp = Math.round((pdHyp / Math.max(10, qHyp)) * 1000);
      const cfr = round(qHyp / Math.max(10, qRest), 2);
      const mrr = round((cfr / Math.max(0.2, ffr)) * (paRest / paHyp), 2);
      const status = rmuHyp > 470 || mrr < 2.3 ? 'bad' : mrr < 3.0 ? 'warn' : 'ok';
      return {
        status,
        rows: [
          { label: 'Q rest / Q hyp', value: `${qRest} / ${qHyp} mL/min`, status: qHyp < 175 ? 'warn' : 'ok' },
          { label: 'Rμ (hyperemia)', value: `${rmuHyp} WU`, status: rmuHyp > 470 ? 'bad' : 'ok' },
          { label: 'CFR (continuous)', value: cfr.toFixed(2), status: cfr < 2.0 ? 'bad' : 'ok' },
          { label: 'MRR', value: mrr.toFixed(2), status }
        ]
      };
    }
    case 'doppler-ach': {
      const apvR = Math.max(4, v('apvRest'));
      const apvH = Math.max(6, v('apvHyp'));
      const paH = Math.max(30, v('paHyp'));
      const pdH = Math.max(15, v('pdHyp'));
      const cfr = round(apvH / apvR, 2);
      const hmr = round(pdH / apvH, 2);
      const hsr = round(Math.max(0, paH - pdH) / apvH, 2);
      const areaR = Math.PI * ((v('diamRest') / 20) ** 2);
      const areaA = Math.PI * ((v('diamAch') / 20) ** 2);
      const cbfR = 0.5 * apvR * areaR * 60;
      const cbfA = 0.5 * v('apvAch') * areaA * 60;
      const deltaCbfPct = Math.round(((cbfA / Math.max(1, cbfR)) - 1) * 100);
      const status = cfr < 2.5 || hmr >= 2.5 || deltaCbfPct < 50 ? 'bad' : 'ok';
      return {
        status,
        rows: [
          { label: 'CFR (Doppler)', value: cfr.toFixed(2), status: cfr < 2.5 ? 'bad' : 'ok' },
          { label: 'HMR', value: `${hmr.toFixed(2)} mmHg·s/cm`, status: hmr >= 2.5 ? 'bad' : 'ok' },
          { label: 'HSR', value: `${hsr.toFixed(2)} mmHg·s/cm`, status: hsr > 0.8 ? 'bad' : 'ok' },
          { label: 'ACh ΔCBF', value: `${deltaCbfPct >= 0 ? '+' : ''}${deltaCbfPct}%`, status: deltaCbfPct < 50 ? 'bad' : 'ok' }
        ]
      };
    }
    default:
      return { status: 'ok', rows: [] };
  }
}

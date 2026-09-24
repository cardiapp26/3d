import { CYCLE_SYNC as S, intervalDurations, timeToPhase } from './cardiac-cycle.js';
import { ventricularPressure, aorticPressure } from './wiggers.js';
import { SCENARIOS } from './hemo-scenarios.js';
import {
  GORLIN_AORTIC, GORLIN_MITRAL, cardiacIndex, diastolicPulmonaryGradient, fickOutput, gorlinArea,
  mixedVenousSaturation, oximetryStepUp, pvrDyn, pvrWood, qpQs, strokeVolume, svrDyn, transpulmonaryGradient
} from './hemo-formulas.js';

/**
 * Interactive hemodynamics model. Every station's pressure is synthesized on
 * the shared cardiac clock (physiologic phase u in [0,1), see cardiac-cycle.js)
 * from a scenario's target values, so the tracings, the Wiggers panel, the ECG
 * and the 3D valve motion stay in step. Waveform shapes are teaching
 * caricatures of textbook tracings, not patient recordings.
 */

export const STATIONS = Object.freeze(['ra', 'rv', 'pa', 'pcwp', 'lv', 'ao']);

export const STATION_INFO = Object.freeze({
  ra: { side: 'right', label: { en: 'Right atrium', tr: 'Sağ atriyum' }, short: 'RA', color: '#3f86b6', pickId: 'cath-ra' },
  rv: { side: 'right', label: { en: 'Right ventricle', tr: 'Sağ ventrikül' }, short: 'RV', color: '#2f6fb3', pickId: 'cath-rv' },
  pa: { side: 'right', label: { en: 'Pulmonary artery', tr: 'Pulmoner arter' }, short: 'PA', color: '#1f5f8f', pickId: 'cath-pa' },
  pcwp: { side: 'right', label: { en: 'Pulmonary capillary wedge', tr: 'Pulmoner kapiller kama (PCWP)' }, short: 'PCWP', color: '#c0843a', pickId: 'cath-wedge' },
  lv: { side: 'left', label: { en: 'Left ventricle', tr: 'Sol ventrikül' }, short: 'LV', color: '#d23a4f', pickId: 'cath-lv' },
  ao: { side: 'left', label: { en: 'Aorta', tr: 'Aort' }, short: 'Ao', color: '#8e2f47', pickId: 'cath-ao' }
});

export const PCWP_DELAY = 0.1;    // wedge lags the left atrium by ~80 ms (sources: 40-200 ms)
const RESP_SWING = 2;             // mmHg transmitted intrathoracic swing, normal breathing
const SAMPLES = 240;

const wrap = u => ((u % 1) + 1) % 1;
const gauss = (t, center, width) => {
  const d = Math.min(Math.abs(t - center), 1 - Math.abs(t - center));
  return Math.exp(-(d * d) / (2 * width * width));
};
const smoothstep = (a, b, t) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
function through(anchors, u) {
  if (u <= anchors[0][0]) return anchors[0][1];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [u0, v0] = anchors[i];
    const [u1, v1] = anchors[i + 1];
    if (u <= u1) return v0 + (v1 - v0) * smoothstep(u0, u1, u);
  }
  return anchors[anchors.length - 1][1];
}

// Reference extremes of the normal Wiggers generators, measured once.
const BASE = (() => {
  let lvMin = Infinity, lvMax = -Infinity, aoMin = Infinity, aoMax = -Infinity;
  for (let i = 0; i < 1000; i++) {
    const u = i / 1000;
    const lv = ventricularPressure(u), ao = aorticPressure(u);
    lvMin = Math.min(lvMin, lv); lvMax = Math.max(lvMax, lv);
    aoMin = Math.min(aoMin, ao); aoMax = Math.max(aoMax, ao);
  }
  return { lvMin, lvEdp: ventricularPressure(S.ivcStart), lvMax, aoMin, aoMax };
})();

/** Ventricular pressure shaped from the normal LV curve to {systolic, edp}. */
export function ventricularWave(u, { systolic, edp }, flags) {
  const uu = wrap(u);
  const dipPlateau = flags.has('square_root_sign');
  const minDia = Math.max(1, edp * (dipPlateau ? 0.3 : 0.4));
  if (dipPlateau && uu < S.ivcStart) {
    // Dip-and-plateau: early diastolic dip, rapid rise, flat plateau at the EDP.
    const dip = Math.exp(-(((uu - 0.045) / 0.035) ** 2));
    return edp - (edp - minDia) * dip + 0.06 * edp * gauss(uu, 0.40, 0.03);
  }
  const base = ventricularPressure(uu);
  if (base >= BASE.lvEdp) return edp + (base - BASE.lvEdp) * (systolic - edp) / (BASE.lvMax - BASE.lvEdp);
  return edp - (BASE.lvEdp - base) * (edp - minDia) / (BASE.lvEdp - BASE.lvMin);
}

/** Arterial pressure (aorta or PA) shaped from the normal aortic curve to {systolic, diastolic}. */
export function arterialWave(u, { systolic, diastolic }, flags, station = 'ao') {
  const u0 = wrap(u);
  let uu = u0;
  const inEjection = u0 >= S.ejectionStart && u0 < S.ivrStart;
  const ejection = S.ivrStart - S.ejectionStart;
  // The ejection part of the base curve is sampled on a warped clock: slow
  // and late-peaking in fixed aortic stenosis (parvus et tardus), brisk and
  // early-peaking in dynamic obstruction (the spike of spike-and-dome).
  const warp = station === 'ao' && inEjection
    ? (flags.has('parvus_tardus') ? 1.6 : flags.has('spike_and_dome') ? 0.45 : 1)
    : 1;
  if (warp !== 1) uu = S.ejectionStart + ejection * Math.pow((u0 - S.ejectionStart) / ejection, warp);
  const base = aorticPressure(uu);
  let value = diastolic + (base - BASE.aoMin) * (systolic - diastolic) / (BASE.aoMax - BASE.aoMin);
  if (station === 'ao' && flags.has('spike_and_dome') && inEjection) {
    // Mid-systolic dip as the outflow tract obstructs, then a lower dome.
    value -= (systolic - diastolic) * 0.35 * gauss(u0, 0.67, 0.04);
  }
  return value;
}

/**
 * Atrial (RA or wedge) pressure with a, c and v waves and x, y descents,
 * fitted so its real-time mean equals target.mean.
 */
export function atrialWaveFactory({ a, v, mean }, flags, hr) {
  const yDepth = flags.has('blunted_y_descent') ? 0.2 : flags.has('prominent_y_descent') ? 1.25 : 1;
  const ventricularized = flags.has('ventricularized_ra');
  const build = b => {
    const yTrough = v - yDepth * (v - (b - 1.5));
    const xTrough = ventricularized ? b + 0.5 * (v - b) : a - (a - (b - 1.5));
    const anchors = [
      [0.00, v * 0.97],
      [0.10, yTrough],
      [0.28, b],
      [0.405, a],
      [0.47, b + 0.3 * (a - b)],
      [0.62, xTrough],
      [0.97, v],
      [1.00, v * 0.97]
    ];
    return u => through(anchors, wrap(u));
  };
  let b = mean;
  for (let pass = 0; pass < 4; pass++) {
    const fn = build(b);
    b += mean - realTimeMean(fn, hr);
  }
  return build(b);
}

/** Mean of fn(u) over one RR interval in real time at the given rate. */
export function realTimeMean(fn, hr, from = 0, to = 1) {
  let sum = 0, n = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const u = timeToPhase(i / SAMPLES, hr);
    if (u < from || u >= to) continue;
    sum += fn(u); n++;
  }
  return n ? sum / n : NaN;
}

function respirationAdjust(station, value, targets, flags, insp) {
  if (!insp) return value;
  const positive = Math.max(0, insp);
  let out = value;
  if (flags.has('kussmaul') && (station === 'ra' || station === 'rv')) out += RESP_SWING * insp;
  else out -= RESP_SWING * insp;
  if (flags.has('pulsus_paradoxus') && (station === 'ao' || station === 'lv')) {
    const floor = station === 'ao' ? targets.ao.diastolic : targets.lv.edp;
    out = floor + (out - floor) * (1 - 0.4 * positive);   // systolic falls > 10 mmHg on inspiration
  }
  if (flags.has('ventricular_interdependence')) {
    if (station === 'lv' || station === 'ao') {
      const floor = station === 'ao' ? targets.ao.diastolic : targets.lv.edp;
      out = floor + (out - floor) * (1 - 0.1 * insp);
    }
    if (station === 'rv' || station === 'pa') {
      const floor = station === 'pa' ? targets.pa.diastolic : targets.rv.edp;
      out = floor + (out - floor) * (1 + 0.1 * insp);
    }
  }
  return out;
}

export function createHemodynamics(initialId = 'normal') {
  let scenario = SCENARIOS[initialId] || SCENARIOS.normal;
  let flags = new Set(scenario.flags);
  let curves = {};

  function rebuild() {
    flags = new Set(scenario.flags);
    const t = scenario.stations;
    // Descent flags describe the RA tracing, except in mitral stenosis, where
    // the slowed left atrial emptying blunts the wedge y descent instead.
    const mitralObstruction = flags.has('lv_pcwp_gradient');
    const raFlags = new Set([...flags].filter(f => !(mitralObstruction && f === 'blunted_y_descent')));
    const laFlags = new Set([...flags].filter(f => f !== 'kussmaul' && (mitralObstruction || (f !== 'blunted_y_descent' && f !== 'prominent_y_descent'))));
    if (flags.has('equalized_diastolic') && flags.has('blunted_y_descent')) laFlags.add('blunted_y_descent');
    const ra = atrialWaveFactory(t.ra, raFlags, scenario.hr);
    const la = atrialWaveFactory(t.pcwp, laFlags, scenario.hr);
    curves = {
      ra,
      rv: u => ventricularWave(u, t.rv, flags),
      pa: u => arterialWave(u, t.pa, flags, 'pa'),
      pcwp: u => la(u - PCWP_DELAY),
      la,
      lv: u => ventricularWave(u, t.lv, flags),
      ao: u => arterialWave(u, t.ao, flags, 'ao')
    };
  }
  rebuild();

  function postPvcTargets() {
    // Beat after a premature ventricular contraction: LV pressure rises with the
    // longer filling. In fixed aortic stenosis the aortic pulse pressure rises
    // too; in obstructive HCM it falls (Brockenbrough-Braunwald-Morrow sign).
    const t = scenario.stations;
    const lv = { systolic: t.lv.systolic * 1.15, edp: t.lv.edp };
    const pulse = t.ao.systolic - t.ao.diastolic;
    const factor = flags.has('brockenbrough') ? 0.7 : flags.has('lv_ao_gradient') ? 1.2 : 1.1;
    const ao = { systolic: t.ao.diastolic + pulse * factor, diastolic: t.ao.diastolic };
    return { lv, ao };
  }

  /**
   * Pressure (mmHg) at station for phase u.
   * @param {'ra'|'rv'|'pa'|'pcwp'|'lv'|'ao'} station
   * @param {number} u physiologic phase
   * @param {{ insp?: number, postPvc?: boolean }} [opts] insp in [-1, 1] (inspiration positive)
   */
  function pressure(station, u, opts = {}) {
    let value;
    if (opts.postPvc && (station === 'lv' || station === 'ao')) {
      const t = postPvcTargets();
      value = station === 'lv' ? ventricularWave(u, t.lv, flags) : arterialWave(u, t.ao, flags, 'ao');
    } else {
      value = curves[station](u);
    }
    return respirationAdjust(station, value, scenario.stations, flags, opts.insp || 0);
  }

  /** Suggested plot range [min, max] mmHg for a station in the current scenario. */
  function range(station) {
    const t = scenario.stations;
    const top = station === 'ra' || station === 'pcwp' ? Math.max(t[station].a, t[station].v) + 6
      : station === 'rv' || station === 'pa' ? Math.max(t.rv.systolic, t.pa.systolic) + 10
        : Math.max(t.lv.systolic, t.ao.systolic) + 20;
    const step = top > 60 ? 20 : top > 30 ? 10 : 5;
    return [0, Math.ceil(top / step) * step];
  }

  function metrics() {
    const hr = scenario.hr;
    const t = scenario.stations;
    const means = Object.fromEntries(STATIONS.map(id => [id, realTimeMean(curves[id], hr)]));
    const gradientLvAo = realTimeMean(u => curves.lv(u) - curves.ao(u), hr, S.ejectionStart, S.ivrStart);
    const gradientLvPcwp = realTimeMean(u => curves.la(u) - curves.lv(u), hr, 0, S.ivcStart);
    const durations = Object.fromEntries(intervalDurations(hr).map(iv => [iv.id, iv.sec]));
    const sep = durations['ventricular-ejection'];
    const dfp = durations['rapid-filling'] + durations.diastasis + durations['atrial-systole'];
    const sats = scenario.saturations;
    const mixedVenous = mixedVenousSaturation(sats.svc, sats.ivc);
    const shunt = qpQs({ arterial: sats.ao, mixedVenous, pulmonaryVein: sats.pv, pulmonaryArtery: sats.pa });
    return {
      hr,
      co: scenario.co,
      ci: cardiacIndex(scenario.co, 1.9),
      strokeVolume: strokeVolume(scenario.co, hr),
      means,
      systolic: { rv: t.rv.systolic, pa: t.pa.systolic, lv: t.lv.systolic, ao: t.ao.systolic },
      diastolic: { rv: t.rv.edp, pa: t.pa.diastolic, lv: t.lv.edp, ao: t.ao.diastolic },
      gradients: {
        lvAoMean: gradientLvAo,
        lvAoPeakToPeak: t.lv.systolic - t.ao.systolic,
        lvPcwpMean: gradientLvPcwp
      },
      periods: { sep, dfp },
      // Valve areas only where the scenario has a valvular obstruction; a
      // normal valve's 1-3 mmHg difference, or a dynamic subvalvular (HOCM)
      // gradient, would give a meaningless Gorlin area.
      areas: {
        aortic: flags.has('lv_ao_gradient') && !flags.has('spike_and_dome') && gradientLvAo > 5 ? gorlinArea({ flow: scenario.co, hr, period: sep, meanGradient: gradientLvAo, constant: GORLIN_AORTIC }) : null,
        mitral: flags.has('lv_pcwp_gradient') && gradientLvPcwp > 3 ? gorlinArea({ flow: scenario.co, hr, period: dfp, meanGradient: gradientLvPcwp, constant: GORLIN_MITRAL }) : null
      },
      pvrWood: pvrWood(means.pa, means.pcwp, scenario.co),
      pvrDyn: pvrDyn(means.pa, means.pcwp, scenario.co),
      svrDyn: svrDyn(means.ao, means.ra, scenario.co),
      tpg: transpulmonaryGradient(means.pa, means.pcwp),
      dpg: diastolicPulmonaryGradient(t.pa.diastolic, means.pcwp),
      raPcwpRatio: means.ra / means.pcwp,
      lvedpMinusRvedp: t.lv.edp - t.rv.edp,
      mixedVenous,
      qpQs: shunt,
      stepUp: oximetryStepUp(sats)
    };
  }

  return {
    setScenario(id) {
      if (!SCENARIOS[id]) return false;
      scenario = SCENARIOS[id];
      rebuild();
      return true;
    },
    getScenario: () => scenario,
    listScenarios: () => Object.values(SCENARIOS).map(s => ({ id: s.id, label: s.label })),
    flags: () => new Set(flags),
    pressure,
    range,
    metrics,
    saturations: () => ({ ...scenario.saturations }),
    /** Fick output for arbitrary inputs; defaults to the scenario's saturations. */
    fick({ vo2 = 125 * 1.9, hb = 14, satArterial = scenario.saturations.ao, satVenous = scenario.saturations.pa } = {}) {
      return fickOutput({ vo2, hb, satArterial, satVenous });
    }
  };
}

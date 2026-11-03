// Pericardial Pathophysiology Lab: Cardiac Tamponade vs Constrictive Pericarditis.
// Compliance curves, ventricular interdependence and hemodynamic waveforms, driven by
// the shared cardiac cycle clock plus a slower respiratory cycle derived from it.
// Static layer: re-rendered on preset or language change. Live layer: setAttribute per frame.
import { PERICARDIAL_DISORDERS } from './pathophysiology-data.js';
import { createCycleClock, createMotionBar, cycleShape, tweenValues } from './cycle-clock.js';
import { pvModelLoop, pvParams } from '../hemo-pv-model.js';

// Node tests import this module, so the stylesheet loads only in the browser (Vite).
if (typeof document !== 'undefined') import('./pericardial-motion.css');

// Cycle windows of the reference loop the clock uses (filling starts at u = 0).
const PH = pvModelLoop(pvParams({}, 'normal')).phases;
const FILL_END = PH.ivc[0], EJ_START = PH.ejection[0], EJ_END = PH.ejection[1];
const BREATH_S = 4;            // one breath per 4 s at 1x (15/min)
const INSP_FRAC = 0.4;         // I:E about 1:1.5
const HOLD = { inspiration: 0.39, expiration: 0.92 };
const ART_BEATS = 10, VEN_BEATS = 5, SAMPLES = 300;

const wrap = x => ((x % 1) + 1) % 1;
const lerp = (a, b, k) => a + (b - a) * k;
const bump = (x, c, s) => Math.exp(-(((x - c) / s) ** 2));
const wrapDist = (a, b) => { const d = Math.abs(wrap(a) - wrap(b)); return Math.min(d, 1 - d); };
const cbump = (u, c, s) => Math.exp(-((wrapDist(u, c) / s) ** 2));

// Teaching model per preset. Pressures in mmHg; sizes relative to a normal ventricle.
// fEarly/fFlat/fSqrt blend the diastolic filling profile; jvp* are a/c/x/v/y amplitudes.
const MODEL = Object.freeze({
  normal: { sbpExp: 120, sbpInsp: 114, dbp: 78, jvpExp: 6, jvpInsp: 4, lvEdv: 1, rvEdv: 1, interdep: 0.06, septInsp: 5, bounce: 0, rvCollapse: 0, raCollapse: 0, fEarly: 1, fFlat: 0, fSqrt: 0, ja: 3, jc: 1, jx: 2.5, jv: 2.5, jy: 3, ySig: 0.07, diaStart: 1, diaEnd: 6, kick: 3, dip: 3, plateau: 0, rvSys: 26, rvInsp: 1, ipp: 0, ippBeat: 0, ippInsp: 0, xPerMmHg: 1.2 },
  tamponade_acute: { sbpExp: 100, sbpInsp: 78, dbp: 70, jvpExp: 18, jvpInsp: 17, lvEdv: 0.62, rvEdv: 0.55, interdep: 0.3, septInsp: 40, bounce: 0, rvCollapse: 1, raCollapse: 1, fEarly: 0, fFlat: 1, fSqrt: 0, ja: 2, jc: 0.5, jx: 5, jv: 2, jy: 0.3, ySig: 0.07, diaStart: 16, diaEnd: 18, kick: 1, dip: 16, plateau: 0, rvSys: 30, rvInsp: 4, ipp: 20, ippBeat: 1.5, ippInsp: 3, xPerMmHg: 1.4 },
  tamponade_chronic: { sbpExp: 106, sbpInsp: 88, dbp: 72, jvpExp: 15, jvpInsp: 14, lvEdv: 0.7, rvEdv: 0.62, interdep: 0.25, septInsp: 32, bounce: 0, rvCollapse: 0.7, raCollapse: 0.8, fEarly: 0, fFlat: 1, fSqrt: 0, ja: 2, jc: 0.5, jx: 4.5, jv: 2, jy: 0.5, ySig: 0.07, diaStart: 13, diaEnd: 15, kick: 1, dip: 13, plateau: 0, rvSys: 30, rvInsp: 3, ipp: 16, ippBeat: 1.2, ippInsp: 2.5, xPerMmHg: 2 },
  constriction: { sbpExp: 112, sbpInsp: 106, dbp: 76, jvpExp: 16, jvpInsp: 22, lvEdv: 0.72, rvEdv: 0.66, interdep: 0.16, septInsp: 16, bounce: 18, rvCollapse: 0, raCollapse: 0, fEarly: 0, fFlat: 0, fSqrt: 1, ja: 3, jc: 0.5, jx: 5, jv: 3, jy: 9, ySig: 0.035, diaStart: 3, diaEnd: 19, kick: 0.5, dip: 3, plateau: 19, rvSys: 34, rvInsp: 5, ipp: 18, ippBeat: 0, ippInsp: 0, xPerMmHg: 0 }
});
// Static operating point of each preset on the compliance chart.
const DOT = { normal: [55, 183], tamponade_acute: [168, 95], tamponade_chronic: [288, 115], constriction: [60, 105] };

/** Inspiratory depth 0..1 over the breath (b 0..1): rises in inspiration, falls in expiration. */
export function inspDepth(b) {
  const x = wrap(b);
  return x < INSP_FRAC ? 0.5 - 0.5 * Math.cos(Math.PI * x / INSP_FRAC) : 0.5 + 0.5 * Math.cos(Math.PI * (x - INSP_FRAC) / (1 - INSP_FRAC));
}

/** Fraction of end-diastolic filling reached at diastolic progress d (0..1). */
function fillFraction(m, d) {
  const early = 0.75 * (1 - Math.exp(-d / 0.16)) / (1 - Math.exp(-1 / 0.16)) + 0.25 * Math.min(1, Math.max(0, (d - 0.8) / 0.2));
  const sqrt = Math.min(1, (1 - Math.exp(-d / 0.06)) / (1 - Math.exp(-0.3 / 0.06)));
  return m.fEarly * early + m.fFlat * d + m.fSqrt * sqrt;
}

/** Ventricular volume fraction between ESV (0) and EDV (1) at cycle phase u. */
function volumeFraction(m, u) {
  return u < FILL_END ? fillFraction(m, u / FILL_END) : 1 - cycleShape(u).contraction;
}

/** Arterial pressure at u: upstroke in ejection, notch, then diastolic run-off. */
function arterialAt(u, sbp, dbp) {
  let w;
  if (u >= EJ_START && u < EJ_END) {
    const s = (u - EJ_START) / (EJ_END - EJ_START);
    w = s < 0.35 ? Math.sin((s / 0.35) * Math.PI / 2) : 1 - 0.25 * ((s - 0.35) / 0.65);
  } else {
    const tau = wrap(u - EJ_END) / (1 - (EJ_END - EJ_START));
    w = 0.75 * (Math.exp(-3 * tau) - Math.exp(-3)) / (1 - Math.exp(-3)) - 0.06 * bump(tau, 0.02, 0.015) + 0.04 * bump(tau, 0.06, 0.03);
  }
  return dbp + (sbp - dbp) * w;
}

/** Right atrial / jugular pressure at u: a, c, x, v and y around the mean. */
function jvpAt(m, u, mean) {
  return mean + m.ja * cbump(u, FILL_END - 0.03, 0.035) + m.jc * cbump(u, EJ_START + 0.01, 0.02)
    - m.jx * cbump(u, 0.72, 0.08) + m.jv * cbump(u, EJ_END + 0.06, 0.05) - m.jy * cbump(u, 0.1, m.ySig);
}

/** Diastolic ventricular pressure at progress d: compliant rise, equalized plateau or dip-and-plateau. */
function diastolicP(m, d) {
  const linear = lerp(m.diaStart, m.diaEnd, d);
  const sqrt = m.dip + (m.plateau - m.dip) * (1 - Math.exp(-Math.max(0, d - 0.04) / 0.05));
  return (1 - m.fSqrt) * linear + m.fSqrt * sqrt + m.kick * bump(d, 0.9, 0.05);
}

/** RV pressure at u; inspiration raises RV systolic pressure (discordance). */
function ventricularAt(m, u, insp) {
  if (u < FILL_END) return diastolicP(m, u / FILL_END);
  const p0 = cycleShape(0).pressure, ps = Math.max(0, (cycleShape(u).pressure - p0) / (1 - p0));
  const low = u < EJ_START ? diastolicP(m, 1) : diastolicP(m, 0);
  return low + (m.rvSys + m.rvInsp * insp - low) * ps;
}

/** Everything the live layer needs at cycle phase u and inspiratory depth insp. */
export function pericardialFrame(m, u, insp) {
  const vol = volumeFraction(m, u), d = u < FILL_END ? u / FILL_END : -1;
  const early = d >= 0 ? bump(d, 0.12, 0.08) : 0;
  const lvEdv = m.lvEdv - m.interdep * insp, rvEdv = m.rvEdv + m.interdep * insp;
  const sbp = lerp(m.sbpExp, m.sbpInsp, insp);
  return {
    vol, insp, sbp,
    dbp: m.dbp - 0.3 * (m.sbpExp - m.sbpInsp) * insp,
    jvpMean: lerp(m.jvpExp, m.jvpInsp, insp),
    lvSize: lvEdv * (0.4 + 0.6 * vol),
    rvSize: rvEdv * (0.4 + 0.6 * vol),
    septX: 132 + m.septInsp * insp + (d >= 0 ? m.bounce * bump(d, 0.07, 0.04) : 0) + (u >= EJ_START && u < EJ_END ? 3 : 0),
    rvCollapse: m.rvCollapse * early * (1 - 0.5 * insp),
    raCollapse: m.raCollapse * cbump(u, FILL_END + 0.03, 0.05),
    atria: 0.7 + 0.3 * (1 - vol),
    ipp: m.ipp - m.ippBeat * (1 - vol) - m.ippInsp * insp,
    rvSysPeak: m.rvSys + m.rvInsp * insp,
    lvSysPeak: sbp
  };
}

/** Sweep trace: a ring of samples written by a moving pen, with an erase gap ahead of it. */
function createSweep(windowBeats) {
  const ys = new Array(SAMPLES).fill(null);
  let last = null;
  const idx = t => Math.floor((((t % windowBeats) + windowBeats) % windowBeats) / windowBeats * SAMPLES) % SAMPLES;
  const tAt = (tNow, iNow, k) => tNow - (((iNow - k) + SAMPLES) % SAMPLES) / SAMPLES * windowBeats;
  return {
    advance(tNow, sample) {
      const i = idx(tNow), gap = last == null ? 0 : (i - last + SAMPLES) % SAMPLES;
      if (gap > 0 && gap < SAMPLES / 2) {
        for (let s = 1; s <= gap; s += 1) { const k = (last + s) % SAMPLES; ys[k] = sample(tAt(tNow, i, k)); }
      } else ys[i] = sample(tNow);
      last = i;
      return i;
    },
    fill(tNow, sample) {
      const i = idx(tNow);
      for (let k = 0; k < SAMPLES; k += 1) ys[k] = sample(tAt(tNow, i, k));
      last = i;
    },
    path(x0, x1, yOf, cursor) {
      let d = '', pen = false;
      for (let k = 0; k < SAMPLES; k += 1) {
        const ahead = (k - cursor + SAMPLES) % SAMPLES;
        if (ys[k] == null || (ahead > 0 && ahead <= 6)) { pen = false; continue; }
        d += `${pen ? 'L' : 'M'}${(x0 + (x1 - x0) * k / (SAMPLES - 1)).toFixed(1)},${yOf(ys[k]).toFixed(1)}`;
        pen = true;
      }
      return d;
    },
    yAt: k => ys[k],
    xAt: (x0, x1, k) => x0 + (x1 - x0) * k / (SAMPLES - 1)
  };
}

const Y = {
  art: p => 74 - (p - 50) * 68 / 80,
  jvp: p => 78 - p * 70 / 32,
  ven: p => 80 - p * 72 / 45
};

export function createPericardialLab(opts = {}) {
  const container = opts.mount || opts.container;
  if (!container) throw new Error('createPericardialLab requires a mount container');

  let lang = (typeof opts.getLang === 'function' ? opts.getLang() : opts.lang) === 'en' ? 'en' : 'tr';
  const getLang = () => lang;
  const L = (trText, enText) => (lang === 'en' ? enText : trText);
  const tr = obj => (obj ? obj[lang] || obj.tr || obj.en || '' : '');

  let disorderId = 'tamponade_acute';
  let breathing = true;            // false: respiration held at holdB while the heart keeps beating
  let holdB = HOLD.inspiration;
  let breathOffset = 0;
  let beats = 0, lastPhase = 0, shownResp = null;
  let shown = { ...MODEL[disorderId] };
  let cancelTween = () => {};
  let els = {};
  const sweeps = { art: createSweep(ART_BEATS), resp: createSweep(ART_BEATS), jvp: createSweep(VEN_BEATS), ven: createSweep(VEN_BEATS) };

  const clock = createCycleClock({ bpm: 75, speed: 0.5 });
  const motionBar = createMotionBar(clock, { getLang, label: { tr: 'Kalp ve solunum döngüsü:', en: 'Cardiac and respiratory cycle:' } });
  const root = document.createElement('div');
  root.className = 'pericardial-lab';
  const body = document.createElement('div');
  root.append(motionBar.element, body);

  const getDisorder = () => PERICARDIAL_DISORDERS.find(d => d.id === disorderId) || PERICARDIAL_DISORDERS[0];
  const breathBeats = () => BREATH_S * clock.getState().bpm / 60;
  const breathAt = t => (breathing ? wrap(t / breathBeats() + breathOffset) : holdB);
  const nowT = () => beats + clock.getState().phase;

  function getHemodynamics() {
    const m = MODEL[disorderId];
    const pulsusDelta = m.sbpExp - m.sbpInsp;
    return { sbpExp: m.sbpExp, sbpInsp: m.sbpInsp, pulsusDelta, hasPulsus: pulsusDelta > 10, hasKussmaul: m.jvpInsp > m.jvpExp };
  }

  // Samplers used by the sweeps: pure functions of time t (beats).
  const samplers = {
    art: t => { const f = pericardialFrame(shown, wrap(t), inspDepth(breathAt(t))); return arterialAt(wrap(t), f.sbp, f.dbp); },
    resp: t => inspDepth(breathAt(t)),
    jvp: t => jvpAt(shown, wrap(t), lerp(shown.jvpExp, shown.jvpInsp, inspDepth(breathAt(t)))),
    ven: t => ventricularAt(shown, wrap(t), inspDepth(breathAt(t)))
  };
  const refillSweeps = () => { const t = nowT(); Object.keys(sweeps).forEach(k => sweeps[k].fill(t, samplers[k])); };

  function toolbarHtml() {
    return `
      <div class="pericardial-toolbar">
        <div class="control-cluster">
          <span class="control-label">${L('Perikardiyal Patoloji', 'Pericardial Pathology')}:</span>
          <div class="btn-group">
            ${PERICARDIAL_DISORDERS.map(d => `<button type="button" class="stage-btn ${d.id === disorderId ? 'active' : ''}" data-disorder="${d.id}">${tr(d.name)}</button>`).join('')}
          </div>
        </div>
        <div class="control-cluster">
          <span class="control-label">${L('Solunum Fazı', 'Respiratory Cycle')}:</span>
          <div class="btn-group">
            <button type="button" class="stage-btn" data-phase="expiration">${L('Ekspiryum', 'Expiration')}</button>
            <button type="button" class="stage-btn" data-phase="inspiration">${L('İnspiryum', 'Inspiration')}</button>
            <button type="button" class="action-btn resp-breath-btn" data-breath-toggle></button>
          </div>
          <span class="peri-breath-meter" aria-hidden="true"><i data-breath-fill></i></span>
          <strong class="peri-breath-label" data-breath-label aria-live="off"></strong>
        </div>
      </div>`;
  }

  function compliancePanelHtml(dis) {
    const [cx, cy] = DOT[disorderId] || DOT.normal;
    return `
      <div class="pericardial-card">
        <div class="card-head">
          <h3>${L('1. Perikardiyal Basınç-Hacim Kompliyans Eğrisi', '1. Pericardial Pressure-Volume Curve')}</h3>
          <span class="badge ${disorderId.includes('tamponade') ? 'badge-danger' : disorderId === 'constriction' ? 'badge-warning' : 'badge-ok'}">${L('P-V İlişkisi', 'P-V Relation')}</span>
        </div>
        <div class="curve-svg-box">
          <svg viewBox="0 0 340 220" class="pericardial-pv-svg" role="img" aria-label="${L('Perikard kompliyans eğrisi', 'Pericardial compliance curve')}">
            <line x1="45" y1="185" x2="320" y2="185" stroke="var(--border)" stroke-width="2" stroke-linecap="round"/>
            <line x1="45" y1="185" x2="45" y2="25" stroke="var(--border)" stroke-width="2" stroke-linecap="round"/>
            <text x="315" y="198" font-size="10" font-weight="700" fill="var(--text-sub)" text-anchor="end">${L('Sıvı Hacmi (mL)', 'Fluid Volume (mL)')}</text>
            <text x="40" y="20" font-size="10" font-weight="700" fill="var(--text-sub)">${L('İntraperikardiyal Basınç (mmHg)', 'Intrapericardial Pressure (mmHg)')}</text>
            ${[[140, 10], [95, 20], [50, 30]].map(([y, v]) => `<line x1="45" y1="${y}" x2="320" y2="${y}" stroke="var(--border)" stroke-dasharray="2,2" opacity="0.4"/><text x="38" y="${y + 3}" font-size="9" fill="var(--text-sub)" text-anchor="end">${v}</text>`).join('')}
            <path d="M 45,183 Q 110,182 140,165 Q 165,130 175,40" fill="none" stroke="#dc2626" stroke-width="2.2"/>
            <text x="145" y="65" font-size="9.5" font-weight="700" fill="#dc2626">${L('Akut Sıvı (200 mL)', 'Acute Effusion')}</text>
            <path d="M 45,183 Q 180,182 250,165 Q 285,130 295,45" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="4,2"/>
            <text x="260" y="90" font-size="9.5" font-weight="700" fill="#0284c7">${L('Kronik (1000 mL)', 'Chronic (1000 mL)')}</text>
            <circle data-pv-ring cx="${cx}" cy="${cy}" r="7" fill="none" stroke="#f59e0b" stroke-width="2"/>
            <circle data-pv-dot cx="${cx}" cy="${cy}" r="7" fill="#f59e0b" stroke="#fff" stroke-width="2"/>
            <text data-pv-label x="${cx + 12}" y="${cy + 4}" font-size="10.5" font-weight="800" fill="#f59e0b">${dis.pressure} mmHg</text>
          </svg>
        </div>
        <div class="compliance-note">${L(
          '<strong>Perikardiyal Esneme Sınırı:</strong> Akut hemoperikardiyumda esneyemeyen pariyetal perikard 150-250 mL kanla bile kritik gerilme sınırına ulaşır ve basınç 20 mmHg üzerine fırlar. Kronik efüzyonlarda ise yavaş adaptasyon 1000 mL üzerine izin verir. <em>Canlı nokta: her sistolde kalp hacmi azalınca basınç biraz düşer; tamponadda inspiryum da düşürür, rijit kabukta ise basınç sabit kalır.</em>',
          '<strong>Pericardial Stretch Reserve:</strong> In acute hemopericardium, the noncompliant parietal pericardium reaches its stretch limit with just 150-250 mL, shooting pressures above 20 mmHg. In chronic effusions, slow remodeling allows >1000 mL before decompensation. <em>Live point: each systole shrinks cardiac volume and lowers the pressure slightly; in tamponade inspiration lowers it too, while the rigid shell of constriction keeps it fixed.</em>')}</div>
      </div>`;
  }

  function heartSvgHtml() {
    const tamp = disorderId.includes('tamponade'), con = disorderId === 'constriction';
    const shell = con
      ? '<rect x="36" y="12" width="248" height="142" rx="46" fill="#78716c" fill-opacity="0.25" stroke="#57534e" stroke-width="9"/><rect x="36" y="12" width="248" height="142" rx="46" fill="none" stroke="#e7e5e4" stroke-width="3" stroke-dasharray="3,9"/>'
      : `<rect data-effusion x="18" y="4" width="284" height="158" rx="52" fill="${tamp ? '#ef4444' : 'none'}" fill-opacity="${tamp ? 0.22 : 0}" stroke="${tamp ? '#ef4444' : 'var(--border)'}" stroke-width="3" stroke-dasharray="4,2"/>`;
    return `
      <svg viewBox="0 0 320 166" class="septal-shift-svg peri-heart-svg" role="img" aria-label="${L('Perikard içinde atan kalp', 'Heart beating inside the pericardium')}">
        ${shell}
        <text x="160" y="${con ? 165 : 160}" font-size="9" font-weight="700" fill="${con ? '#57534e' : '#b91c1c'}" text-anchor="middle">${con ? L('Kalınlaşmış kalsifiye perikard', 'Thickened calcified pericardium') : tamp ? L('Perikardiyal sıvı', 'Pericardial fluid') : ''}</text>
        <ellipse data-ra cx="92" cy="34" rx="30" ry="13" fill="#0284c7" fill-opacity="0.25" stroke="#0284c7" stroke-width="1.6"/>
        <ellipse data-la cx="208" cy="34" rx="28" ry="12" fill="#dc2626" fill-opacity="0.22" stroke="#dc2626" stroke-width="1.6"/>
        <text x="92" y="37" font-size="9" font-weight="800" fill="#0284c7" text-anchor="middle">RA</text>
        <text x="208" y="37" font-size="9" font-weight="800" fill="#dc2626" text-anchor="middle">LA</text>
        <path data-rv fill="#0284c7" fill-opacity="0.35" stroke="#0284c7" stroke-width="2"/>
        <path data-lv fill="#dc2626" fill-opacity="0.3" stroke="#dc2626" stroke-width="2"/>
        <path data-septum fill="none" stroke="var(--text-main)" stroke-width="4.5" stroke-linecap="round"/>
        <text data-rv-label y="99" font-size="11" font-weight="800" fill="#0284c7" text-anchor="middle">RV</text>
        <text data-lv-label y="99" font-size="11" font-weight="800" fill="#dc2626" text-anchor="middle">LV</text>
        <text data-septal-note x="160" y="150" font-size="9.5" font-weight="800" fill="#ef4444" text-anchor="middle" opacity="0">${con ? L('Septal sıçrama / septum sola', 'Septal bounce / shift to LV') : L('Septum sola (LV içine) ->', 'Septal Shift ->')}</text>
        <text data-ra-note x="92" y="15" font-size="9" font-weight="800" fill="#b91c1c" text-anchor="middle" opacity="0">${L('RA kollapsı', 'RA collapse')}</text>
        <text data-rv-note x="62" y="146" font-size="9" font-weight="800" fill="#b91c1c" text-anchor="middle" opacity="0">${L('RV diyastolik kollaps', 'RV diastolic collapse')}</text>
      </svg>`;
  }

  function pulsusPanelHtml(hemo) {
    const yExp = Y.art(hemo.sbpExp), yInsp = Y.art(hemo.sbpInsp);
    return `
      <div class="pericardial-card">
        <div class="card-head">
          <h3>${L('2. Ventriküler Etkileşim ve Pulsus Paradoxus', '2. Ventricular Interdependence & Pulsus Paradoxus')}</h3>
          <span class="badge ${hemo.hasPulsus ? 'badge-danger' : 'badge-ok'}">${hemo.hasPulsus ? 'PULSUS PARADOXUS (+)' : 'NORMAL (<10 mmHg)'}</span>
        </div>
        <div class="septal-shift-box">${heartSvgHtml()}</div>
        <div class="bp-waveform-box">
          <span class="waveform-title">${L('Arter Basınç Dalgası (Pulsus Paradoxus), canlı kayıt', 'Arterial Pressure Trace (Radial/Aortic), live recording')}</span>
          <svg viewBox="0 0 320 100" class="bp-svg" role="img" aria-label="${L('Canlı arter basıncı', 'Live arterial pressure')}">
            <line x1="10" x2="310" y1="${yExp}" y2="${yExp}" stroke="#22c55e" stroke-dasharray="3,3" opacity="0.7"/>
            <line x1="10" x2="310" y1="${yInsp}" y2="${yInsp}" stroke="${hemo.hasPulsus ? '#dc2626' : '#22c55e'}" stroke-dasharray="3,3" opacity="0.7"/>
            <text x="12" y="${yExp - 3}" font-size="9" font-weight="700" fill="#16a34a">${L('Ekspiryum', 'Exp')}: ${hemo.sbpExp} mmHg</text>
            <text x="150" y="${yInsp + 10}" font-size="9" font-weight="800" fill="${hemo.hasPulsus ? '#dc2626' : '#16a34a'}">${L('İnspiryum', 'Insp')}: ${hemo.sbpInsp} mmHg</text>
            <text x="308" y="${yExp - 3}" font-size="10" font-weight="800" fill="#ef4444" text-anchor="end">Δ ${hemo.pulsusDelta} mmHg</text>
            <path data-trace="art" fill="none" stroke="#16a34a" stroke-width="2" stroke-linejoin="round"/>
            <path data-trace="resp" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
            <text x="12" y="98" font-size="8" fill="var(--text-sub)">${L('Solunum (inspiryum yukarı)', 'Respiration (inspiration up)')}</text>
            <circle data-pen="art" r="3.2" class="peri-pen" fill="#16a34a"/>
          </svg>
        </div>
        <div class="peri-live-row">
          <span>${L('Anlık SKB', 'Current SBP')} <strong data-live="sbp">--</strong></span>
          <span>${L('RV / LV sistolik', 'RV / LV systolic')} <strong data-live="discord">--</strong></span>
        </div>
        <div class="pulsus-explanation">
          <strong>${L('Pulsus Paradoxus Mekanizması:', 'Mechanism of Pulsus Paradoxus:')}</strong>
          ${L('Normalde inspiryumda intratorasik basınç negatifleşir ve sağ kalbe venöz dönüş artar. Tamponadda gergin sıvı iki ventrikülü sabit bir hacme hapseder. RV genişledikçe interventriküler septum sol ventrikül lümenine bombeleşir; LV doluşu ve atım hacmi çöker, sistolik tansiyon >10 mmHg düşer. RV ve LV sistolik basınçları zıt yönde değişir (diskordans).',
            'Normally, inspiration drops intrathoracic pressure, increasing venous return to RV. In tamponade, the tense fluid encloses both ventricles in a fixed volume. RV expansion bulges the septum into the LV cavity, reducing LV filling and dropping systolic BP > 10 mmHg. RV and LV systolic pressures move in opposite directions (discordance).')}
        </div>
      </div>`;
  }

  function jvpLegendHtml() {
    if (disorderId.includes('tamponade')) {
      return `<text x="312" y="12" font-size="9.5" font-weight="800" fill="#dc2626" text-anchor="end">${L('Belirgin x, silinmiş / kayıp y-inişi', 'Deep x, absent / blunted y-descent')}</text>`;
    }
    if (disorderId === 'constriction') {
      return `<text x="312" y="12" font-size="9.5" font-weight="800" fill="#f59e0b" text-anchor="end">${L('x ve belirgin derin, keskin y-inişi (M/W)', 'x and prominent steep y-descent (M/W)')}</text>`;
    }
    return '<text x="312" y="12" font-size="9" fill="var(--text-sub)" text-anchor="end">a · x · v · y</text>';
  }

  function dipLegendHtml() {
    const m = MODEL[disorderId];
    if (disorderId === 'constriction') {
      return `<line x1="10" x2="310" y1="${Y.ven(m.plateau)}" y2="${Y.ven(m.plateau)}" stroke="#f59e0b" stroke-dasharray="3,3" opacity="0.8"/>
        <text x="312" y="12" font-size="9.5" font-weight="800" fill="#f59e0b" text-anchor="end">${L('Plato (Kalsifiye Sınır)', 'Plateau (rigid limit)')} · √ ${L('(Karekök)', '(Square root)')}</text>
        <text x="312" y="${Y.ven(m.dip) + 2}" font-size="9.5" font-weight="800" fill="#dc2626" text-anchor="end">Dip</text>`;
    }
    const eq = disorderId.includes('tamponade');
    return `<text x="312" y="12" font-size="9.5" fill="var(--text-sub)" text-anchor="end">${eq ? L('Diyastolik basınçlar eşitlenmiş, karekök yok', 'Equalized diastolic pressures, no dip-and-plateau') : L('Diyastolik plato yok', 'No diastolic plateau')}</text>`;
  }

  function jvpPanelHtml(hemo) {
    const m = MODEL[disorderId];
    return `
      <div class="pericardial-card">
        <div class="card-head">
          <h3>${L('3. Juguler Venöz Basınç (JVP) & Karekök Trasesi', '3. Jugular Venous Pulse (JVP) & Square-Root Sign')}</h3>
          <span class="badge ${hemo.hasKussmaul ? 'badge-danger' : 'badge-subtle'}">${hemo.hasKussmaul ? L('KUSSMAUL BELİRTİSİ (+)', 'KUSSMAUL SIGN (+)') : 'Kussmaul (-)'}</span>
        </div>
        <div class="jvp-wave-box">
          <span class="waveform-title">${L('Sağ Atriyum Basıncı / JVP Dalgası (mmHg), canlı', 'Right Atrial Pressure / JVP Waveform (mmHg), live')}</span>
          <svg viewBox="0 0 320 85" class="jvp-svg" role="img" aria-label="${L('Canlı JVP', 'Live JVP')}">
            <line x1="10" x2="310" y1="${Y.jvp(m.jvpExp)}" y2="${Y.jvp(m.jvpExp)}" stroke="var(--text-sub)" stroke-dasharray="2,3" opacity="0.6"/>
            <text x="12" y="${Y.jvp(m.jvpExp) - 3}" font-size="8.5" fill="var(--text-sub)">${L('ekspiryum ortalaması', 'expiratory mean')} ${m.jvpExp}</text>
            ${jvpLegendHtml()}
            <path data-trace="jvp" fill="none" stroke="${disorderId.includes('tamponade') ? '#ef4444' : disorderId === 'constriction' ? '#f59e0b' : '#22c55e'}" stroke-width="2.2" stroke-linejoin="round"/>
            <circle data-pen="jvp" r="3.2" class="peri-pen" fill="#0f172a"/>
          </svg>
        </div>
        <div class="ventricle-dip-box">
          <span class="waveform-title">${L('Ventrikül Basıncı (Karekök / Dip-and-Plateau Trasesi), RV, canlı', 'Ventricular Diastolic Pressure (Square-Root Sign), RV, live')}</span>
          <svg viewBox="0 0 320 85" class="dip-svg" role="img" aria-label="${L('Canlı ventrikül basıncı', 'Live ventricular pressure')}">
            ${dipLegendHtml()}
            <path data-trace="ven" fill="none" stroke="${disorderId === 'constriction' ? '#f59e0b' : 'var(--text-sub)'}" stroke-width="2.2" stroke-linejoin="round"/>
            <circle data-pen="ven" r="3.2" class="peri-pen" fill="#0f172a"/>
          </svg>
        </div>
        <div class="peri-live-row">
          <span>${L('Ortalama JVP', 'Mean JVP')} <strong data-live="jvp">--</strong></span>
        </div>
        <div class="kussmaul-explanation">
          <strong>${L('Kussmaul Belirtisi & y-İnişi Farkı:', 'Kussmaul Sign & y-Descent Rules:')}</strong>
          ${L('<strong>Tamponadda:</strong> Yüksek sıvı basıncı ventrikülü diyastol boyunca sürekli sıkar; erken diyastolde ventrikül hızla genişleyemez -> <em>y-inişi silinir veya kaybolur</em>.<br/><strong>Konstriksiyonda:</strong> Erken diyastolde kılıf henüz engele takılmadığı için kan aniden ventriküle boşalır -> <em>keskin derin y-inişi</em>. Orta diyastolde kalsifiye kabuğa çarpınca dolum aniden durur (karekök trasesi). İnspiryumda gelen fazla kan sert kalbe giremediği için juguler venlerde göllenir ve JVP yükselir (Kussmaul belirtisi).',
            '<strong>Tamponade:</strong> Elevated intrapericardial pressure continuously compresses the RV throughout diastole; early diastolic filling cannot occur rapidly -> <em>y-descent is blunted or absent</em>.<br/><strong>Constriction:</strong> Early filling is unimpeded by the rigid shell -> <em>rapid deep y-descent</em>. However, once the rigid shell limits expansion, filling abruptly halts (square-root sign). Venous return on inspiration cannot enter the encased right heart, paradoxical rising JVP (Kussmaul sign).')}
        </div>
      </div>`;
  }

  function tableHtml() {
    const row = (head, a, b) => `<tr><td><strong>${head}</strong></td><td>${a}</td><td>${b}</td></tr>`;
    return `
      <div class="patho-callout-card">
        <div class="callout-badge"><span class="icon">⚖️</span>
          <strong>${L('Yatak Başı Ayırıcı Tanı Tablosu: Tamponad ve Konstriksiyon', 'Bedside Differential Diagnosis: Tamponade vs Constriction')}</strong>
        </div>
        <div class="table-responsive">
          <table class="pathophys-compare-table">
            <thead><tr><th>${L('Özellik / Klinik Bulgu', 'Feature / Sign')}</th><th>${L('Kardiyak Tamponad', 'Cardiac Tamponade')}</th><th>${L('Konstriktif Perikardit', 'Constrictive Pericarditis')}</th></tr></thead>
            <tbody>
              ${row(L('Klasik Klinik Triad', 'Classic Physical Triad'), L('Beck Triadı: Hipotansiyon, JVD, Boğuk Kalp Sesleri', "Beck's Triad: Hypotension, JVD, Muffled Heart Sounds"), L('Perikardiyal Vuru (Knock), belirgin JVD, asit/ödem', 'Pericardial knock, elevated JVP, peripheral ascites/edema'))}
              ${row(L('Pulsus Paradoxus (>10 mmHg tansiyon düşüşü)', 'Pulsus Paradoxus (>10 mmHg drop)'), `<span class="badge-danger">${L('Tipik Olarak VAR (%98)', 'Typically PRESENT (98%)')}</span>`, `<span class="badge-subtle">${L('Genellikle YOK / Nadir (<%20)', 'Usually ABSENT / Rare (<20%)')}</span>`)}
              ${row(L('Kussmaul Belirtisi (İnspiryumda JVP artışı)', "Kussmaul's Sign (Inspiratory JVP rise)"), `<span class="badge-subtle">${L('YOK (İnspiryumda düşer veya değişmez)', 'ABSENT (falls or unchanged on inspiration)')}</span>`, `<span class="badge-danger">${L('Tipik Olarak VAR (Pozitif)', 'Typically PRESENT (Positive)')}</span>`)}
              ${row(L('JVP y-İnişi', 'JVP y-descent'), `<strong class="text-danger">${L('Silinmiş / Kayıp', 'Absent or Blunted')}</strong>`, `<strong class="text-warning">${L('Belirgin, Derin ve Dik', 'Prominent, Deep & Rapid')}</strong>`)}
              ${row(L('Ventrikül Basınç Trasesi', 'Ventricular Pressure Tracing'), L('Diyastol sonu basınç eşitlenmesi, karekök yok', 'Equilibration of diastolic pressures, no dip-and-plateau'), L('Karekök ("Dip-and-Plateau" √) Trasesi', 'Dip-and-plateau ("Square-Root" √ sign)'))}
              ${row(L('Birincil Acil Tedavi', 'Primary Emergency Treatment'), `<strong>${L('Perikardiyosentez (Acil İğne Aspirasyonu)', 'Pericardiocentesis (Needle aspiration)')}</strong>`, `<strong>${L('Perikardiyektomi (Cerrahi Soyma)', 'Pericardiectomy (Surgical stripping)')}</strong>`)}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function renderStatic() {
    const dis = getDisorder(), hemo = getHemodynamics();
    body.innerHTML = `
      <div class="pericardial-grid">
        ${toolbarHtml()}
        <div class="pericardial-desc-bar"><p><strong>${tr(dis.name)}:</strong> ${tr(dis.desc)}</p></div>
        <div class="pericardial-panels-row">
          ${compliancePanelHtml(dis)}
          ${pulsusPanelHtml(hemo)}
          ${jvpPanelHtml(hemo)}
        </div>
        ${tableHtml()}
      </div>`;
    cacheElements();
    bindEvents();
    shownResp = null;
    clock.refresh();
  }

  function cacheElements() {
    const q = s => body.querySelector(s);
    els = {
      rv: q('[data-rv]'), lv: q('[data-lv]'), septum: q('[data-septum]'), ra: q('[data-ra]'), la: q('[data-la]'),
      rvLabel: q('[data-rv-label]'), lvLabel: q('[data-lv-label]'), septalNote: q('[data-septal-note]'),
      raNote: q('[data-ra-note]'), rvNote: q('[data-rv-note]'), effusion: q('[data-effusion]'),
      pvDot: q('[data-pv-dot]'), pvRing: q('[data-pv-ring]'), pvLabel: q('[data-pv-label]'),
      breathFill: q('[data-breath-fill]'), breathLabel: q('[data-breath-label]'), breathBtn: q('[data-breath-toggle]'),
      phaseBtns: [...body.querySelectorAll('[data-phase]')],
      traces: Object.fromEntries([...body.querySelectorAll('[data-trace]')].map(e => [e.dataset.trace, e])),
      pens: Object.fromEntries([...body.querySelectorAll('[data-pen]')].map(e => [e.dataset.pen, e])),
      live: Object.fromEntries([...body.querySelectorAll('[data-live]')].map(e => [e.dataset.live, e]))
    };
  }

  function selectDisorder(id) {
    if (id === disorderId || !MODEL[id]) return;
    disorderId = id;
    cancelTween();
    cancelTween = tweenValues(shown, MODEL[id], v => { shown = v; clock.refresh(); }, 600);
    renderStatic();
    refillSweeps();
  }

  function holdBreath(phase) {
    breathing = false;
    holdB = HOLD[phase];
    if (!clock.getState().playing) refillSweeps();
    shownResp = null;
    clock.refresh();
  }

  function toggleBreathing() {
    if (breathing) {
      holdB = breathAt(nowT());
      breathing = false;
    } else {
      breathOffset = wrap(holdB - nowT() / breathBeats());
      breathing = true;
      clock.setPlaying(true);
    }
    shownResp = null;
    clock.refresh();
  }

  function bindEvents() {
    body.querySelectorAll('[data-disorder]').forEach(btn => btn.addEventListener('click', () => selectDisorder(btn.dataset.disorder)));
    els.phaseBtns.forEach(btn => btn.addEventListener('click', () => holdBreath(btn.dataset.phase)));
    els.breathBtn?.addEventListener('click', toggleBreathing);
  }

  const setAttrs = (el, attrs) => { if (el) for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v); };

  function drawHeart(f) {
    const sx = f.septX.toFixed(1);
    const xR = (196 + 64 * f.lvSize).toFixed(1);
    const xL = (124 - 64 * f.rvSize + 20 * f.rvCollapse).toFixed(1);
    const sept = `M140,52 Q${sx},96 140,140`;
    setAttrs(els.septum, { d: sept, stroke: f.septX > 150 ? '#ef4444' : 'var(--text-main)' });
    setAttrs(els.lv, { d: `${sept} C170,150 ${xR},134 ${xR},96 C${xR},58 170,42 140,52 Z` });
    const xM = (Number(xL) + 26 * f.rvCollapse).toFixed(1); // free wall indents in diastolic collapse
    setAttrs(els.rv, { d: `${sept} C120,148 ${xL},132 ${xM},96 C${xL},62 116,44 140,52 Z` });
    setAttrs(els.rvLabel, { x: ((Number(xL) + 140) / 2 + 4).toFixed(1) });
    setAttrs(els.lvLabel, { x: ((Number(sx) + Number(xR)) / 2 + 6).toFixed(1) });
    setAttrs(els.ra, { rx: (30 * f.atria).toFixed(1), ry: (13 * f.atria * (1 - 0.6 * f.raCollapse)).toFixed(1) });
    setAttrs(els.la, { rx: (28 * f.atria).toFixed(1), ry: (12 * f.atria).toFixed(1) });
    setAttrs(els.septalNote, { opacity: Math.min(1, Math.max(0, (f.septX - 140) / 18)).toFixed(2) });
    setAttrs(els.raNote, { opacity: f.raCollapse.toFixed(2) });
    setAttrs(els.rvNote, { opacity: Math.min(1, f.rvCollapse * 1.6).toFixed(2) });
    if (els.effusion && disorderId.includes('tamponade')) setAttrs(els.effusion, { 'fill-opacity': (0.18 + 0.08 * (1 - f.vol)).toFixed(3) });
  }

  function drawCompliance(f) {
    const [cx, cy] = DOT[disorderId] || DOT.normal;
    const drop = MODEL[disorderId].ipp - f.ipp;
    const x = cx - drop * shown.xPerMmHg, y = cy + drop * 4.5;
    setAttrs(els.pvDot, { cx: x.toFixed(1), cy: y.toFixed(1) });
    setAttrs(els.pvRing, { cx: x.toFixed(1), cy: y.toFixed(1), r: (7 + 9 * (1 - f.vol)).toFixed(1), opacity: (0.2 + 0.7 * f.vol).toFixed(2) });
    if (els.pvLabel) {
      setAttrs(els.pvLabel, { x: (x + 12).toFixed(1), y: (y + 4).toFixed(1) });
      els.pvLabel.textContent = `${Math.max(0, f.ipp).toFixed(0)} mmHg`;
    }
  }

  function drawSweeps(t) {
    const spec = { art: [Y.art, 'art'], resp: [r => 94 - 12 * r, null], jvp: [Y.jvp, 'jvp'], ven: [Y.ven, 'ven'] };
    for (const [key, [yOf, pen]] of Object.entries(spec)) {
      const sw = sweeps[key], i = sw.advance(t, samplers[key]);
      setAttrs(els.traces[key], { d: sw.path(10, 310, yOf, i) });
      if (pen && els.pens[pen]) setAttrs(els.pens[pen], { cx: sw.xAt(10, 310, i).toFixed(1), cy: yOf(sw.yAt(i)).toFixed(1) });
    }
  }

  function drawReadouts(f, respPhase) {
    const arrow = respPhase === 'inspiration' ? '↑' : '↓';
    if (els.live.sbp) els.live.sbp.textContent = `${f.sbp.toFixed(0)} mmHg`;
    if (els.live.discord) els.live.discord.textContent = `${f.rvSysPeak.toFixed(0)} / ${f.lvSysPeak.toFixed(0)} mmHg`;
    if (els.live.jvp) els.live.jvp.textContent = `${f.jvpMean.toFixed(0)} mmHg ${shown.jvpInsp > shown.jvpExp && respPhase === 'inspiration' ? '↑ Kussmaul' : ''}`;
    if (els.breathFill) els.breathFill.style.transform = `scaleX(${f.insp.toFixed(3)})`;
    if (respPhase !== shownResp) {
      shownResp = respPhase;
      els.phaseBtns.forEach(b => b.classList.toggle('active', b.dataset.phase === respPhase));
      if (els.breathLabel) els.breathLabel.textContent = `${respPhase === 'inspiration' ? L('İnspiryum', 'Inspiration') : L('Ekspiryum', 'Expiration')} ${arrow}${breathing ? '' : L(' (sabit)', ' (held)')}`;
      if (els.breathBtn) {
        els.breathBtn.textContent = breathing ? L('Solunumu Durdur', 'Pause Breathing') : L('Canlı Solunum Döngüsü', 'Auto-Breathe (15/min at 1x)');
        els.breathBtn.classList.toggle('btn-active', breathing);
        els.breathBtn.setAttribute('aria-pressed', String(breathing));
      }
    }
  }

  function onFrame(state) {
    if (state.playing && state.phase < lastPhase - 0.5) beats += 1;
    lastPhase = state.phase;
    const t = beats + state.phase, b = breathAt(t), insp = inspDepth(b);
    const respPhase = wrap(b) < INSP_FRAC ? 'inspiration' : 'expiration';
    const f = pericardialFrame(shown, state.phase, insp);
    drawHeart(f);
    drawCompliance(f);
    drawSweeps(t);
    drawReadouts(f, respPhase);
    motionBar.render(state, cycleShape(state.phase).phase);
  }

  renderStatic();
  refillSweeps();
  container.appendChild(root);
  const unsubscribe = clock.subscribe(onFrame);

  return {
    updateLanguage(next) {
      lang = next === 'en' ? 'en' : 'tr';
      motionBar.setLanguage();
      renderStatic();
    },
    update() { renderStatic(); },
    getState: () => ({ disorderId, breathing, phase: clock.getState().phase, insp: inspDepth(breathAt(nowT())) }),
    destroy() {
      cancelTween();
      unsubscribe();
      clock.destroy();
      root.remove();
    }
  };
}

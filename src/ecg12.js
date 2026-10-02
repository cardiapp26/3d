/*
 * Synthetic 12-lead ECG from a single time-varying dipole (research/EP_FAZ_BCD_KAYNAK_STORYBOARD.md,
 * phase C). The heart vector is a sum of Gaussian lobes in body axes
 * (x: patient left, y: inferior, z: anterior); every lead is a projection of
 * the same vector, so the limb leads obey Einthoven (III = II - I) and the
 * augmented leads sum to zero. Precordial leads are projections at
 * schematic horizontal angles, V1-V3 tilted slightly superior. Teaching schematic: no torso model, no
 * proximity effects, never a patient recording.
 */

export const LEADS = Object.freeze(['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6']);
export const PRECORDIAL = Object.freeze(['V1', 'V2', 'V3', 'V4', 'V5', 'V6']);
/** Horizontal-plane angle of each precordial lead, degrees from patient left toward anterior. */
const PRECORDIAL_ANGLE = Object.freeze({ V1: 115, V2: 95, V3: 75, V4: 60, V5: 30, V6: 0 });
/** Elevation of each precordial lead axis toward superior (degrees): V1-V2 sit at the 4th intercostal space, V4-V6 lower. */
const PRECORDIAL_ELEVATION = Object.freeze({ V1: 15, V2: 15, V3: 10, V4: 5, V5: 0, V6: 0 });
// Standard print layout: four columns of three leads.
const LAYOUT = Object.freeze([['I', 'aVR', 'V1', 'V4'], ['II', 'aVL', 'V2', 'V5'], ['III', 'aVF', 'V3', 'V6']]);

const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((c) => c / l); };

/** Heart vector (mV) at time t from lobes { dir: [x, y, z], t, sigma, amp }. */
export function vectorAt(lobes, t) {
  const out = [0, 0, 0];
  for (const lobe of lobes) {
    const d = norm(lobe.dir);
    const g = lobe.amp * Math.exp(-0.5 * ((t - lobe.t) / lobe.sigma) ** 2);
    for (let i = 0; i < 3; i++) out[i] += d[i] * g;
  }
  return out;
}

/** The twelve lead voltages of one heart vector. */
export function leadsOf([x, y, z]) {
  const I = x;
  const II = 0.5 * x + (Math.sqrt(3) / 2) * y;
  const out = { I, II, III: II - I, aVR: -(I + II) / 2, aVL: I - II / 2, aVF: II - I / 2 };
  for (const lead of PRECORDIAL) {
    const a = (PRECORDIAL_ANGLE[lead] * Math.PI) / 180;
    const e = (PRECORDIAL_ELEVATION[lead] * Math.PI) / 180;
    // Unit lead axis: horizontal direction tilted toward superior (negative y).
    out[lead] = Math.cos(e) * (x * Math.cos(a) + z * Math.sin(a)) - y * Math.sin(e);
  }
  return out;
}

/** Sampled leads over [from, to] ms. */
export function sampleLeads(lobes, { from = 0, to = 250, step = 2 } = {}) {
  const t = [];
  const leads = Object.fromEntries(LEADS.map((l) => [l, []]));
  for (let s = from; s <= to + 1e-9; s += step) {
    t.push(s);
    const v = leadsOf(vectorAt(lobes, s));
    for (const l of LEADS) leads[l].push(v[l]);
  }
  return { t, leads, step };
}

/**
 * Dominant polarity of one lead: '+' or '-' when one deflection clearly
 * dominates, '±' when both are of similar size, '0' when nearly flat.
 */
export function polarity(signal, flat = 0.02) {
  const pos = Math.max(0, ...signal);
  const neg = Math.max(0, ...signal.map((v) => -v));
  if (Math.max(pos, neg) < flat) return '0';
  if (pos > neg * 1.25) return '+';
  if (neg > pos * 1.25) return '-';
  return '±';
}

/** First non-flat precordial lead whose R (largest positive) is at least its S (largest negative), or null. */
export function transitionLead(sampled, flat = 0.02) {
  return PRECORDIAL.find((l) => {
    const r = Math.max(0, ...sampled.leads[l]);
    const s = Math.max(0, ...sampled.leads[l].map((v) => -v));
    return Math.max(r, s) >= flat && r >= s;
  }) || null;
}

/**
 * Draw the 12 leads in the standard four-column layout on a canvas (dark
 * recorder look, DPR aware), with a 100 ms time bar and a
 * permanent synthetic label. Amplitude is relative (scaled to the largest
 * deflection of the twelve leads).
 */
export function drawEcg12(canvas, sampled, { lang = 'tr', title = '', gain = 1 } = {}) {
  const width = canvas?.clientWidth;
  const height = canvas?.clientHeight;
  if (!sampled || !(width >= 2) || !(height >= 2)) return;
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.floor(width * dpr)) canvas.width = Math.floor(width * dpr);
  if (canvas.height !== Math.floor(height * dpr)) canvas.height = Math.floor(height * dpr);
  const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0e1815';
  ctx.fillRect(0, 0, width, height);
  const head = 16, foot = 14;
  const cellW = width / 4;
  const cellH = (height - head - foot) / 3;
  const span = sampled.t[sampled.t.length - 1] - sampled.t[0];
  const peak = Math.max(0.05, ...LEADS.flatMap((l) => sampled.leads[l].map(Math.abs)));
  const scale = (cellH * 0.42) / peak * gain;
  ctx.font = '10px ui-monospace, monospace';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#9fc7b6';
  if (title) ctx.fillText(title, 6, 3);
  LAYOUT.forEach((row, r) => row.forEach((lead, c) => {
    const x0 = c * cellW + 4, y0 = head + r * cellH, mid = y0 + cellH / 2;
    ctx.strokeStyle = 'rgba(120, 170, 150, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, mid);
    ctx.lineTo(x0 + cellW - 8, mid);
    ctx.stroke();
    ctx.strokeStyle = '#8ff0c6';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    sampled.leads[lead].forEach((v, i) => {
      const x = x0 + ((sampled.t[i] - sampled.t[0]) / span) * (cellW - 8);
      const y = mid - v * scale;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = '#d7f5e4';
    ctx.fillText(lead, x0 + 2, y0 + 2);
  }));
  // Time bar: 100 ms, bottom left. Amplitude is scaled to the largest deflection (relative, not in mV).
  const barMs = 100;
  const barX = 6 + (barMs / span) * (cellW - 8);
  ctx.strokeStyle = '#d7f5e4';
  ctx.beginPath();
  ctx.moveTo(6, height - 6);
  ctx.lineTo(barX, height - 6);
  ctx.stroke();
  ctx.fillStyle = '#d7f5e4';
  ctx.fillText('100 ms', barX + 4, height - foot + 2);
}

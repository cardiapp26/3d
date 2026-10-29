// Canvas 2D spectral Doppler renderer (CW/PW) with ECG strip and calipers.
// No DOM access at module scope; the canvas is touched only inside renderSpectralDoppler.

import {
  dopplerComponents, envelopeStats, getLesion, mitralAreaPht, bernoulliGradient, REF_RR_MS,
} from './echo-valve-disease.js';

const FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const HEAD = 20;
const SCALE_W = 46;
const TICK_H = 10;
const BG = [5, 7, 10];
const AF_RR = [0.78, 1.21, 0.9, 1.07, 0.7, 1.28, 0.95];

const TXT = {
  cw: { tr: 'CW · Sürekli dalga Doppler', en: 'CW · Continuous-wave Doppler' },
  'pw-lvot': { tr: 'PW · LVOT', en: 'PW · LVOT' },
  'pw-mitral': { tr: 'PW · Mitral giriş akımı', en: 'PW · Mitral inflow' },
  'pw-pulm-vein': { tr: 'PW · Sağ üst pulmoner ven', en: 'PW · Right upper pulmonary vein' },
  'pw-desc-aorta': { tr: 'PW · İnen aorta (suprasternal)', en: 'PW · Descending aorta (suprasternal)' },
  hr: { tr: 'KH', en: 'HR' },
  bpm: { tr: '/dk', en: 'bpm' },
  mean: { tr: 'OG', en: 'MG' },
  peak: { tr: 'TG', en: 'PG' },
  sRev: { tr: 'S ters akım', en: 'S reversal' },
  edv: { tr: 'DSH', en: 'EDV' },
};
const t = (key, lang) => (TXT[key] ? TXT[key][lang] || TXT[key].en : key);
const fmt = (v, d, lang) => { const s = v.toFixed(d); return lang === 'tr' ? s.replace('.', ',') : s; };

const MAIN_ROLE = { 'pw-lvot': 'lvot', 'pw-mitral': 'inflow', 'pw-pulm-vein': 'pv' };
const DIASTOLIC = new Set(['inflow', 'ar', 'ao-rev']);

function mainRole(lesion, channel) {
  if (channel === 'cw') return lesion.doppler.mainRole;
  if (channel === 'pw-desc-aorta') return lesion.id === 'ar-severe' ? 'ao-rev' : 'ao-fwd';
  return MAIN_ROLE[channel] || 'lvot';
}

// ---------- Timing ----------

function buildBeats(hr, af) {
  const rr0 = 60000 / Math.min(180, Math.max(30, hr || 72));
  const span = (rr0 > 1000 ? 2 : 3) * rr0;
  const beats = [{ t0: -rr0, rr: rr0 }];
  let t0 = 0;
  for (let i = 0; t0 < span; i += 1) {
    const rr = af ? rr0 * AF_RR[i % AF_RR.length] : rr0;
    beats.push({ t0, rr });
    t0 += rr;
  }
  return { beats, tStart: -0.12 * rr0, span };
}

function beatIndex(beats, tMs) {
  for (let i = beats.length - 1; i >= 0; i -= 1) if (tMs >= beats[i].t0) return i;
  return 0;
}
const beatAt = (beats, tMs) => beats[beatIndex(beats, tMs)];

function compsAt(lesionId, channel, beats, tMs, af) {
  const i = beatIndex(beats, tMs);
  const b = beats[i];
  const prevHr = 60000 / beats[Math.max(0, i - 1)].rr;
  return dopplerComponents(lesionId, (tMs - b.t0) / b.rr, channel, { hr: 60000 / b.rr, af, prevHr });
}

// ---------- Scale ----------

function autoScale(lesionId, channel, tl, af, scaleMs) {
  let pos = 0; let neg = 0;
  for (let i = 0; i <= 400; i += 1) {
    const tm = tl.tStart + (i / 400) * tl.span;
    for (const c of compsAt(lesionId, channel, tl.beats, tm, af)) {
      if (c.v > pos) pos = c.v;
      if (-c.v > neg) neg = -c.v;
    }
  }
  const pw = channel !== 'cw';
  const step = pw ? 0.2 : 0.5;
  const minSide = pw ? 0.2 : 0.5;
  let top = Math.max(minSide, Math.ceil((pos * 1.18) / step) * step);
  let bottom = Math.max(minSide, Math.ceil((neg * 1.18) / step) * step);
  if (scaleMs > 0) { const k = scaleMs / Math.max(top, bottom); top *= k; bottom *= k; }
  return { top, bottom, pw };
}

// ---------- Spectrum raster ----------

function hash(x, y, s) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function profile(r, pw) {
  if (pw) return r <= 1 ? 0.04 + 0.96 * Math.exp(-(((1 - r) / 0.17) ** 2)) : 0.85 * Math.exp(-(((r - 1) / 0.04) ** 2));
  if (r <= 1) return 0.26 + 0.6 * r * r + 0.4 * Math.exp(-(((1 - r) / 0.05) ** 2));
  return 0.9 * Math.exp(-(((r - 1) / 0.035) ** 2));
}

function fillColumn(buf, comps, g, frame, clicks) {
  buf.fill(0);
  comps.forEach((c, ci) => {
    const va = Math.abs(c.v);
    if (va < 0.015) return;
    const env = va * (1 + 0.035 * (hash(frame, ci, 7) - 0.5));
    const dir = c.v > 0 ? -1 : 1;
    const maxPx = Math.min(g.sh, Math.ceil(env * 1.12 * g.pxPerMs));
    for (let k = 0; k < maxPx; k += 1) {
      const y = g.baseY + dir * k;
      if (y < 0 || y >= g.sh) break;
      const val = profile(k / g.pxPerMs / env, g.pw) * c.intensity;
      if (val > buf[y]) buf[y] = val;
    }
  });
  for (const amp of clicks) {
    const half = Math.round(amp * g.pxPerMs);
    for (let y = Math.max(0, g.baseY - half); y < Math.min(g.sh, g.baseY + half); y += 1) {
      buf[y] = Math.max(buf[y], 0.75 * (1 - Math.abs(y - g.baseY) / half) + 0.2);
    }
  }
}

function writeColumn(data, buf, x, g, frame) {
  // CW shows a thin low-velocity clutter band; PW wall filter blanks it.
  const clutter = Math.min(8, Math.max(3, Math.round((g.pw ? 0.03 : 0.06) * g.pxPerMs)));
  for (let y = 0; y < g.sh; y += 1) {
    const dy = Math.abs(y - g.baseY);
    let v = buf[y];
    if (dy < clutter) v = g.pw ? v * 0.15 : Math.max(v * 0.6, 0.22 * hash(frame, y, 3));
    const grain = 0.5 + 0.8 * hash(frame, y >> 0, 11);
    const bgSpeck = hash(x, y, 5) > 0.992 ? 0.1 : 0;
    const level = Math.min(1, v * grain + bgSpeck) ** 0.85;
    const i = (y * g.sw + x) * 4;
    data[i] = BG[0] + level * 238;
    data[i + 1] = BG[1] + level * 240;
    data[i + 2] = BG[2] + level * 245;
    data[i + 3] = 255;
  }
}

function drawSpectrum(ctx, lesionId, channel, tl, af, g, sweepFrac) {
  const img = ctx.createImageData(g.sw, g.sh);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) { data[i] = BG[0]; data[i + 1] = BG[1]; data[i + 2] = BG[2]; data[i + 3] = 255; }
  const buf = new Float32Array(g.sh);
  const cols = [];
  for (let x = 0; x < g.sw; x += 1) cols.push(compsAt(lesionId, channel, tl.beats, tl.tStart + ((x + 0.5) / g.sw) * tl.span, af));
  const clicks = valveClicks(cols, g, (80 / tl.span) * g.sw);
  const drawTo = Math.round(g.sw * sweepFrac);
  for (let x = 0; x < drawTo; x += 1) {
    const frame = x >> 1;
    fillColumn(buf, cols[x], g, frame, clicks[x] || []);
    writeColumn(data, buf, x, g, frame);
  }
  ctx.putImageData(img, 0, g.y0dev);
}

/** Valve open/close clicks: only at flow edges bounded by a quiet gap (no clicks at diastasis). */
function valveClicks(cols, g, gapPx) {
  const out = [];
  const amp = g.pw ? Math.max(g.top, g.bottom) * 0.35 : 0.9;
  const mark = (x, a) => { for (let k = 0; k < 3; k += 1) if (cols[x + k]) (out[x + k] = out[x + k] || []).push(a); };
  cols[0].forEach((c0, ci) => {
    if (!c0.click) return;
    let quiet = 0;
    let lastOn = -1;
    for (let x = 0; x < cols.length; x += 1) {
      const on = Math.abs(cols[x][ci].v) > 0.03;
      if (on) {
        if (quiet >= gapPx && lastOn >= 0) mark(lastOn, amp * c0.intensity);
        if (quiet >= gapPx || lastOn < 0) mark(x, amp * c0.intensity);
        quiet = 0;
        lastOn = x;
      } else quiet += 1;
    }
  });
  return out;
}

// ---------- Vector overlays ----------

function ecgAt(tMs, beats, af) {
  const b = beatAt(beats, tMs);
  const tb = tMs - b.t0;
  const gs = (x, mu, sd, a) => a * Math.exp(-((x - mu) ** 2) / (2 * sd * sd));
  const sc = Math.sqrt(b.rr / REF_RR_MS);
  let v = gs(tb, 12, 5, -0.1) + gs(tb, 26, 7, 1) + gs(tb, 41, 6, -0.25) + gs(tb, 265 * sc, 42 * sc, 0.28);
  if (af) v += 0.045 * Math.sin(tMs / 22) + 0.03 * Math.sin(tMs / 15 + 1.3);
  else v += gs(b.rr - tb, 115, 22, 0.13);
  return v;
}

function drawEcg(ctx, tl, af, L, sweepFrac) {
  const mid = L.ecgY + L.ecgH * 0.68;
  const amp = L.ecgH * 0.6;
  ctx.strokeStyle = '#3fe08a';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  const xEnd = L.specW * sweepFrac;
  for (let x = 0; x <= xEnd; x += 1) {
    const y = mid - amp * ecgAt(tl.tStart + (x / L.specW) * tl.span, tl.beats, af);
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawScale(ctx, L, sc, lang) {
  const unit = sc.pw ? 'cm/s' : 'm/s';
  const range = sc.top + sc.bottom;
  const step = sc.pw ? (range > 1.6 ? 0.5 : 0.2) : (range > 3 ? 1 : 0.5);
  ctx.fillStyle = '#9fb3c8';
  ctx.strokeStyle = '#5d6f82';
  ctx.font = `10px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  const x = L.W - 4;
  for (let v = -Math.floor(sc.bottom / step + 1e-6) * step; v <= sc.top + 1e-6; v += step) {
    const y = L.yOf(v);
    ctx.beginPath(); ctx.moveTo(L.specW, y); ctx.lineTo(L.specW + 4, y); ctx.stroke();
    if (y < L.specTop + 18) continue;
    const lab = sc.pw ? String(Math.round(v * 100)) : fmt(v, step < 1 ? 1 : 0, lang);
    ctx.fillText(lab, x, y);
  }
  ctx.fillStyle = '#d7e3ef';
  ctx.fillText(unit, x, L.specTop + 7);
}

function drawTimeTicks(ctx, tl, L) {
  ctx.strokeStyle = '#6f8396';
  ctx.lineWidth = 1;
  const first = Math.ceil(tl.tStart / 100) * 100;
  for (let tm = first; tm <= tl.tStart + tl.span; tm += 100) {
    const x = ((tm - tl.tStart) / tl.span) * L.specW;
    const big = Math.round(tm) % 500 === 0;
    ctx.beginPath(); ctx.moveTo(x, L.tickY); ctx.lineTo(x, L.tickY + (big ? TICK_H - 2 : 4)); ctx.stroke();
  }
}

function tracePath(ctx, L, lesionId, channel, role, beat, af) {
  const [f0, f1] = DIASTOLIC.has(role) ? [0.1, 1 + 70 / beat.rr] : [0, 1];
  ctx.setLineDash([2, 3]);
  ctx.strokeStyle = '#ffd84d';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  let on = false;
  for (let i = 0; i <= 240; i += 1) {
    const f = f0 + ((f1 - f0) * i) / 240;
    const c = dopplerComponents(lesionId, f, channel, { hr: 60000 / beat.rr, af }).find((x) => x.role === role);
    const v = c ? c.v : 0;
    const x = L.xOf(beat.t0 + f * beat.rr);
    if (Math.abs(v) < 0.02) { on = false; continue; }
    if (!on) ctx.moveTo(x, L.yOf(v)); else ctx.lineTo(x, L.yOf(v));
    on = true;
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function cross(ctx, x, y) {
  ctx.strokeStyle = '#ffd84d';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.stroke();
}

function phtLine(ctx, L, beat, stats, phtMs, stopMs) {
  const v0 = stats.peak;
  const slope = ((1 - Math.SQRT1_2) * v0) / phtMs;
  const tp = beat.t0 + stats.peakFrac * beat.rr;
  const dur = Math.min(v0 / slope, stopMs - stats.peakFrac * beat.rr);
  ctx.strokeStyle = '#4fd8ff';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(L.xOf(tp), L.yOf(v0)); ctx.lineTo(L.xOf(tp + dur), L.yOf(v0 - slope * dur)); ctx.stroke();
}

function pvWaves(lesionId, beat, af) {
  const find = (a, b) => {
    let best = { v: 0, f: a };
    for (let f = a; f <= b; f += 0.005) {
      const v = dopplerComponents(lesionId, f, 'pw-pulm-vein', { hr: 60000 / beat.rr, af })[0].v;
      if (Math.abs(v) > Math.abs(best.v)) best = { v, f };
    }
    return best;
  };
  return { S: find(0.04, 0.47), D: find(0.5, 0.84), Ar: find(0.86, 0.99) };
}

function calipers(ctx, L, opts, lesion, beat, af) {
  const { channel, lang } = opts;
  const role = mainRole(lesion, channel);
  const stats = envelopeStats(lesion.id, role, channel, { hr: 60000 / beat.rr, af });
  const vmax = Math.abs(stats.peak);
  const out = { vmaxMs: Math.round(vmax * 100) / 100, meanGradientMmHg: Math.round(stats.meanGradient), vtiCm: stats.vtiCm };
  const lines = [];
  const pw = channel !== 'cw';
  if (role === 'pv') return pvCalipers(ctx, L, lesion, beat, af, lang, out);
  if (role !== 'ao-rev') {
    tracePath(ctx, L, lesion.id, channel, role, beat, af);
    cross(ctx, L.xOf(beat.t0 + stats.peakFrac * beat.rr), L.yOf(stats.peak));
    lines.push(pw ? `V ${Math.round(vmax * 100)} cm/s` : `Vmax ${fmt(vmax, 1, lang)} m/s`);
    if (!pw) lines.push(`${t('peak', lang)} ${Math.round(bernoulliGradient(vmax))} mmHg`);
    if (role !== 'ar' && role !== 'mr') lines.push(`${t('mean', lang)} ${out.meanGradientMmHg} mmHg`);
    lines.push(`VTI ${fmt(stats.vtiCm, 0, lang)} cm`);
  }
  const pht = lesion.doppler.phtMs;
  if (pht && (role === 'ar' || role === 'inflow')) {
    // Mitral slope stops before the A wave; AR runs to end-diastole.
    const stop = role === 'inflow' && !af ? beat.rr - 135 : beat.rr * 1.05;
    phtLine(ctx, L, beat, stats, pht, stop);
    out.phtMs = pht;
    lines.push(`PHT ${pht} ms`);
    if (lesion.kind === 'stenosis') { out.mvaCm2 = mitralAreaPht(pht); lines.push(`MVA ${fmt(out.mvaCm2, 2, lang)} cm²`); }
  }
  if (role === 'ao-rev') {
    const tEnd = beat.t0 + beat.rr + 60;
    const v = dopplerComponents(lesion.id, (tEnd - beat.t0) / beat.rr, channel, { hr: 60000 / beat.rr, af }).find((c) => c.role === role).v;
    cross(ctx, L.xOf(tEnd), L.yOf(v));
    lines.push(`${t('edv', lang)} ${Math.round(v * 100)} cm/s`);
  }
  readout(ctx, L, lines);
  return out;
}

function pvCalipers(ctx, L, lesion, beat, af, lang, out) {
  const w = pvWaves(lesion.id, beat, af);
  ctx.font = `11px ${FONT}`;
  ctx.fillStyle = '#ffd84d';
  ctx.textAlign = 'center';
  for (const [k, p] of Object.entries(w)) {
    if (Math.abs(p.v) < 0.03) continue;
    const x = L.xOf(beat.t0 + p.f * beat.rr);
    const y = L.yOf(p.v);
    cross(ctx, x, y);
    ctx.fillText(k, x, y + (p.v > 0 ? -10 : 14));
  }
  const lines = [`S ${Math.round(w.S.v * 100)} cm/s`, `D ${Math.round(w.D.v * 100)} cm/s`];
  if (w.S.v < 0) lines.push(t('sRev', lang));
  else if (w.D.v > 0) lines.push(`S/D ${fmt(w.S.v / w.D.v, 1, lang)}`);
  readout(ctx, L, lines);
  return { ...out, sCms: Math.round(w.S.v * 100), dCms: Math.round(w.D.v * 100) };
}

function readout(ctx, L, lines) {
  ctx.font = `11px ${FONT}`;
  const w = Math.max(...lines.map((s) => ctx.measureText(s).width)) + 12;
  const h = lines.length * 14 + 6;
  const x = 6; const y = L.specTop + 6;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#ffd84d';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  lines.forEach((s, i) => ctx.fillText(s, x + 6, y + 4 + i * 14));
}

function header(ctx, L, lesion, opts) {
  const { lang, channel, hr, af } = opts;
  ctx.font = `11px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#d7e3ef';
  const win = channel === 'cw' ? ` · ${lesion.doppler.window[lang] || lesion.doppler.window.en}` : '';
  ctx.fillText(`${t(channel, lang)}${win}`, 6, HEAD / 2);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd84d';
  const rate = `${t('hr', lang)} ${Math.round(hr)} ${t('bpm', lang)}${af ? ' · AF' : ''}`;
  ctx.fillText(`${lesion.short[lang] || lesion.short.en} · ${rate}`, L.W - 6, HEAD / 2);
}

function layout(W, H, sc) {
  const ecgH = Math.max(30, Math.round(H * 0.14));
  const specTop = HEAD;
  const specH = H - HEAD - ecgH - TICK_H;
  const pxPerMs = specH / (sc.top + sc.bottom);
  const baseY = specTop + sc.top * pxPerMs;
  return {
    W, H, specW: W - SCALE_W, specTop, specH, tickY: specTop + specH, ecgY: H - ecgH, ecgH, pxPerMs, baseY,
    yOf: (v) => baseY - v * pxPerMs,
  };
}

/**
 * Draw a spectral Doppler display (2–3 beats) with ECG, sweep line and calipers.
 * @param {HTMLCanvasElement} canvas
 * @param {{lesionId?:string, channel?:string, lang?:'tr'|'en', hr?:number, af?:boolean, sweepFrac?:number, scaleMs?:number, calipers?:boolean}} [options]
 * @returns {{vmaxMs:number, meanGradientMmHg:number, vtiCm:number, phtMs?:number, mvaCm2?:number, scale:{top:number,bottom:number}}}
 */
export function renderSpectralDoppler(canvas, options = {}) {
  const opts = { lesionId: 'normal', channel: 'cw', lang: 'tr', hr: 72, af: false, sweepFrac: 1, calipers: true, ...options };
  const lesion = getLesion(opts.lesionId);
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  const W = Math.max(200, canvas.clientWidth || canvas.width / dpr || 720);
  const H = Math.max(140, canvas.clientHeight || canvas.height / dpr || 360);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const ctx = canvas.getContext('2d');
  const sweep = Math.min(1, Math.max(0, opts.sweepFrac));
  const tl = buildBeats(opts.hr, opts.af);
  const sc = autoScale(lesion.id, opts.channel, tl, opts.af, opts.scaleMs);
  const L = layout(W, H, sc);
  L.xOf = (tm) => ((tm - tl.tStart) / tl.span) * L.specW;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = `rgb(${BG.join(',')})`;
  ctx.fillRect(0, 0, W, H);
  const g = {
    sw: Math.round(L.specW * dpr), sh: Math.round(L.specH * dpr), y0dev: Math.round(L.specTop * dpr),
    pxPerMs: L.pxPerMs * dpr, baseY: Math.round(sc.top * L.pxPerMs * dpr), pw: sc.pw, top: sc.top, bottom: sc.bottom,
  };
  drawSpectrum(ctx, lesion.id, opts.channel, tl, opts.af, g, sweep);

  ctx.strokeStyle = 'rgba(140,200,255,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, L.baseY); ctx.lineTo(L.specW, L.baseY); ctx.stroke();
  drawScale(ctx, L, sc, opts.lang);
  drawTimeTicks(ctx, tl, L);
  drawEcg(ctx, tl, opts.af, L, sweep);
  header(ctx, L, lesion, opts);

  const beat = tl.beats[1];
  const role = mainRole(lesion, opts.channel);
  const stats = envelopeStats(lesion.id, role, opts.channel, { hr: 60000 / beat.rr, af: opts.af });
  let result = { vmaxMs: Math.round(Math.abs(stats.peak) * 100) / 100, meanGradientMmHg: Math.round(stats.meanGradient), vtiCm: stats.vtiCm };
  const beatEndX = L.xOf(beat.t0 + beat.rr * (DIASTOLIC.has(role) ? 1.1 : 1));
  if (opts.calipers && sweep * L.specW >= beatEndX) result = calipers(ctx, L, opts, lesion, beat, opts.af);
  if (sweep < 1) {
    ctx.fillStyle = 'rgba(230,240,255,0.85)';
    ctx.fillRect(sweep * L.specW - 1, L.specTop, 2, H - L.specTop);
  }
  return { ...result, scale: { top: Math.round(sc.top * 100) / 100, bottom: Math.round(sc.bottom * 100) / 100 } };
}

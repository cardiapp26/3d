/*
 * Ladder diagram of the live recording: rows A (atrium), AV (AV node, His at
 * its lower part) and V (ventricle). Built from the live model's events,
 * which carry what a ladder needs: the origin of each atrial activation, the
 * junctional A and nodal pathway of each His (aj, path) and the origin of
 * each ventricular activation. buildLadder() is pure (tested); drawLadder()
 * draws it under the strip on the same time axis.
 */

// Near-field atrial activation is read on these channels; one activation
// reaches them within ATRIAL_SPREAD_MS of its earliest site.
const ATRIAL_CHANNELS = ['hra', 'his-p', 'his-d', 'cs-910', 'cs-78', 'cs-56', 'cs-34', 'cs-12'];
const ATRIAL_SPREAD_MS = 90;
const RETRO_NODAL = Object.freeze({ 'avn-fast': 'retro-fast', 'avn-slow': 'retro-slow' });
const AP_ORIGINS = new Set(['ap-left', 'ap-ps']);
// An activation this close to the window end may still be on its way down: not read as blocked.
const PENDING_MS = 450;

const of = (events, ch, type) => (events[ch] || []).filter((e) => e.type === type && !e.far);
const lastBefore = (list, t, within) => list.filter((x) => x.t < t && t - x.t <= within).at(-1) || null;

/** Atrial activations: near-field A clustered across the atrial channels. */
function atrialBeats(events) {
  const all = ATRIAL_CHANNELS.flatMap((ch) => of(events, ch, 'A').map((e) => ({ ...e, ch }))).sort((a, b) => a.t - b.t);
  const beats = [];
  for (const e of all) {
    const beat = beats.at(-1);
    if (beat && e.t - beat.t <= ATRIAL_SPREAD_MS) {
      if (e.ch === 'his-d') beat.hisA = e.t;
      if (!beat.origin && e.origin) beat.origin = e.origin;
      continue;
    }
    beats.push({ t: e.t, origin: e.origin || null, hisA: e.ch === 'his-d' ? e.t : null });
  }
  return beats;
}

/**
 * @param {Record<string, object[]>} events live events (any time origin)
 * @param {{ until?: number }} [options] window end: later activations are not read as blocked yet
 * @returns {{ atria: object[], his: object[], ventricles: object[], links: object[] }}
 *   links: { kind, from: [row, t], to: [row, t] }; rows 'A', 'AV' (His), 'V';
 *   kinds fast, slow, hps, ap, retro-fast, retro-slow, ap-retro, block
 */
export function buildLadder(events, { until = Infinity } = {}) {
  const atria = atrialBeats(events);
  const his = of(events, 'his-d', 'H');
  const ventricles = of(events, 'rv', 'V');
  const links = [];
  const conducted = new Set();
  for (const h of his) {
    // Antegrade over the node: the His names its junctional A.
    const beat = h.aj == null ? null : atria.find((b) => b.hisA != null && Math.abs(b.hisA - h.aj) < 2);
    if (beat) {
      conducted.add(beat);
      links.push({ kind: h.path === 'slow' ? 'slow' : 'fast', from: ['A', beat.t], to: ['AV', h.t] });
    }
    const v = ventricles.find((x) => x.origin === 'his' && x.t >= h.t && x.t - h.t < 120);
    if (v) links.push({ kind: 'hps', from: ['AV', h.t], to: ['V', v.t] });
  }
  // Pre-excited ventricular activation over an accessory pathway.
  for (const v of ventricles.filter((x) => x.origin === 'ap')) {
    const beat = lastBefore(atria, v.t, 250);
    if (beat) { conducted.add(beat); links.push({ kind: 'ap', from: ['A', beat.t], to: ['V', v.t] }); }
  }
  for (const beat of atria) {
    if (RETRO_NODAL[beat.origin]) {
      // Up the node from the His (echo, reentry) or from a ventricular activation.
      const h = lastBefore(his, beat.t, 350);
      const v = lastBefore(ventricles, beat.t, 400);
      const from = h && (!v || h.t >= v.t - 60) ? ['AV', h.t] : v ? ['V', v.t] : null;
      if (from) links.push({ kind: RETRO_NODAL[beat.origin], from, to: ['A', beat.t] });
    } else if (AP_ORIGINS.has(beat.origin)) {
      const v = lastBefore(ventricles, beat.t, 300);
      if (v) links.push({ kind: 'ap-retro', from: ['V', v.t], to: ['A', beat.t] });
    } else if (!conducted.has(beat) && beat.origin !== 'af' && beat.t <= until - PENDING_MS) {
      // An antegrade wavefront that did not reach the His: block in the node.
      links.push({ kind: 'block', from: ['A', beat.t], to: ['AV', beat.t + 60] });
    }
  }
  return { atria, his, ventricles, links };
}

export const LADDER_STYLE = Object.freeze({
  fast: { color: '#4ade80', dash: [] },
  slow: { color: '#fb923c', dash: [] },
  hps: { color: '#c9d6cf', dash: [] },
  ap: { color: '#c084fc', dash: [] },
  'retro-fast': { color: '#4ade80', dash: [4, 3] },
  'retro-slow': { color: '#fb923c', dash: [4, 3] },
  'ap-retro': { color: '#c084fc', dash: [4, 3] },
  block: { color: '#f87171', dash: [] }
});

const LEGEND = {
  tr: [['fast', 'hızlı yol'], ['slow', 'yavaş yol'], ['ap', 'aksesuar yol'], ['retro-fast', 'retrograd'], ['block', 'blok']],
  en: [['fast', 'fast pathway'], ['slow', 'slow pathway'], ['ap', 'accessory pathway'], ['retro-fast', 'retrograde'], ['block', 'block']]
};

/**
 * Draw the ladder on its own canvas, on the strip's time axis.
 * @param {HTMLCanvasElement} canvas
 * @param {ReturnType<typeof buildLadder>} ladder
 * @param {{ from: number, to: number, plotLeft: number, plotW: number }} axis the strip's drawn window (drawEgm)
 */
export function drawLadder(canvas, ladder, axis, { lang = 'tr' } = {}) {
  const width = canvas?.clientWidth, height = canvas?.clientHeight;
  if (!ladder || !axis || !(width >= 2) || !(height >= 2)) return;
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.floor(width * dpr)) canvas.width = Math.floor(width * dpr);
  if (canvas.height !== Math.floor(height * dpr)) canvas.height = Math.floor(height * dpr);
  const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0e1815';
  ctx.fillRect(0, 0, width, height);
  const top = 14, rowA = (height - top) * 0.22, rowAv = (height - top) * 0.56;
  const yA = top + rowA, yV = yA + rowAv;
  const y = { A: yA, AV: yA + rowAv * 0.8, V: yV };
  const x = (t) => axis.plotLeft + ((t - axis.from) / (axis.to - axis.from)) * axis.plotW;
  const inside = (t) => t >= axis.from - 400 && t <= axis.to + 400;
  // Rows and their names.
  ctx.strokeStyle = 'rgba(120, 170, 150, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const yy of [top, yA, yV, height - 1]) { ctx.moveTo(axis.plotLeft, yy + 0.5); ctx.lineTo(axis.plotLeft + axis.plotW, yy + 0.5); }
  ctx.stroke();
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillStyle = '#9fc7b6';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', 6, top + rowA / 2);
  ctx.fillText(lang === 'en' ? 'AV' : 'AV', 6, yA + rowAv / 2);
  ctx.fillText('V', 6, (yV + height) / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.save();
  ctx.beginPath();
  ctx.rect(axis.plotLeft, 0, axis.plotW, height);
  ctx.clip();
  // Activation ticks in the A and V rows.
  ctx.lineWidth = 2;
  for (const a of ladder.atria.filter((b) => inside(b.t))) {
    ctx.strokeStyle = RETRO_NODAL[a.origin] || AP_ORIGINS.has(a.origin) ? '#fcd34d' : '#e8f3ee';
    ctx.beginPath(); ctx.moveTo(x(a.t), top + 3); ctx.lineTo(x(a.t), yA); ctx.stroke();
  }
  for (const v of ladder.ventricles.filter((b) => inside(b.t))) {
    ctx.strokeStyle = '#e8f3ee';
    ctx.beginPath(); ctx.moveTo(x(v.t), yV); ctx.lineTo(x(v.t), height - 3); ctx.stroke();
  }
  // Conduction lines; a block ends with a short bar.
  ctx.lineWidth = 1.6;
  for (const link of ladder.links.filter((l) => inside(l.from[1]) || inside(l.to[1]))) {
    const style = LADDER_STYLE[link.kind];
    ctx.strokeStyle = style.color;
    ctx.setLineDash(style.dash);
    const [x0, y0, x1, y1] = [x(link.from[1]), y[link.from[0]], x(link.to[1]), y[link.to[0]]];
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (link.kind === 'block') { ctx.beginPath(); ctx.moveTo(x1 - 5, y1); ctx.lineTo(x1 + 5, y1); ctx.stroke(); }
  }
  ctx.setLineDash([]);
  ctx.restore();
  // Legend, top right.
  ctx.font = '9px ui-monospace, monospace';
  let lx = width - 6;
  for (const [kind, name] of [...LEGEND[lang === 'en' ? 'en' : 'tr']].reverse()) {
    const w = ctx.measureText(name)?.width || name.length * 5.5;
    lx -= w;
    ctx.fillStyle = '#9fc7b6';
    ctx.fillText(name, lx, 10);
    lx -= 14;
    ctx.strokeStyle = LADDER_STYLE[kind].color;
    ctx.setLineDash(LADDER_STYLE[kind].dash);
    ctx.beginPath(); ctx.moveTo(lx, 7); ctx.lineTo(lx + 11, 7); ctx.stroke();
    ctx.setLineDash([]);
    lx -= 10;
  }
}

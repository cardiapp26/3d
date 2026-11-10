/*
 * Live scrolling polygraph of the 3D EAM workstation: 26 channels (surface II / V1 and the
 * intracardiac bipoles) drawn on a 2D canvas from the rhythm timeline.
 */
import { EAM3D_CHANNELS, createChannelSampler } from './eam3d-model.js';

const LABEL_COL_W = 68;
const BACKGROUND = '#050811';
const GRID_COLOR = 'rgba(30, 41, 59, 0.65)';
const BASELINE_COLOR = 'rgba(30, 41, 59, 0.45)';
const SCALE_TEXT_COLOR = 'rgba(148, 163, 184, 0.85)';
// Window shown at sweep 100; slower sweeps show proportionally more time.
const WINDOW_MS_AT_100 = 1200;
// Sample at least this often so 10 to 15 ms wide deflections keep their shape.
const MAX_SAMPLE_STEP_MS = 4;
const MAX_SAMPLES = 1200;
const CLIP = 2;

/** Visible time span (ms) of the trace at a sweep speed (25, 50, 100, 200). */
export function polygraphWindowMs(sweepSpeed) {
  return (100 / Math.max(25, sweepSpeed)) * WINDOW_MS_AT_100;
}

/**
 * @param {Document} doc
 * @param {{ canvas: HTMLCanvasElement, wrap: HTMLElement }} nodes canvas and the box that sizes it
 */
export function createPolygraph(doc, { canvas, wrap }) {
  // One sampler per timeline segment, kept across frames until a lever or the grid site changes.
  let samplers = new WeakMap();
  let samplerSignature = '';

  function samplerFor(seg, levers, gridSite) {
    let sampler = samplers.get(seg);
    if (!sampler) {
      sampler = createChannelSampler(seg.scenarioId, levers, new Set(seg.ablated), { stim: seg.stim, gridSite });
      samplers.set(seg, sampler);
    }
    return sampler;
  }

  function fitCanvas() {
    const rect = typeof wrap.getBoundingClientRect === 'function' ? wrap.getBoundingClientRect() : { width: 350, height: 520 };
    const dpr = (doc.defaultView && doc.defaultView.devicePixelRatio) || 1;
    const cssW = Math.max(280, Math.round(rect.width || 350));
    const cssH = Math.max(420, Math.round(rect.height || 520));
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    return { dpr, cssW, cssH };
  }

  /**
   * Draw the window that ends at `nowMs`.
   * @param {{ nowMs: number, sweepSpeed: number, levers: object, gridSite: object, segmentAt: (ms: number) => object,
   *   labels?: Record<string, string> }} view `labels` renames channels (the mapping catheter's bipoles)
   */
  function draw({ nowMs, sweepSpeed, levers, gridSite, segmentAt, labels = {} }) {
    const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
    if (!ctx) return;
    const { dpr, cssW, cssH } = fitCanvas();

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, cssW, cssH);

    const plotW = cssW - LABEL_COL_W - 6;
    const rowH = cssH / EAM3D_CHANNELS.length;
    const windowMs = polygraphWindowMs(sweepSpeed);
    const tStart = nowMs - windowMs;

    // Time grid that scrolls with the trace: one line every 200 ms (1 s on slow sweeps).
    const gridMs = windowMs > 3000 ? 1000 : 200;
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    for (let g = Math.ceil(tStart / gridMs) * gridMs; g <= nowMs; g += gridMs) {
      const x = LABEL_COL_W + ((g - tStart) / windowMs) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cssH);
      ctx.stroke();
    }

    const signature = `${JSON.stringify(levers)}|${gridSite.chamber}|${gridSite.pos.join(',')}`;
    if (signature !== samplerSignature) {
      samplerSignature = signature;
      samplers = new WeakMap();
    }
    const samplesCount = Math.round(Math.min(MAX_SAMPLES, Math.max(plotW, windowMs / MAX_SAMPLE_STEP_MS)));
    const timeSeries = [];
    for (let s = 0; s < samplesCount; s++) {
      const tMs = tStart + (s / (samplesCount - 1)) * windowMs;
      const seg = segmentAt(tMs);
      timeSeries.push(samplerFor(seg, levers, gridSite)(tMs - seg.fromMs).values);
    }

    ctx.font = '600 9.5px Inter, -apple-system, sans-serif';
    ctx.textBaseline = 'middle';

    EAM3D_CHANNELS.forEach((ch, idx) => {
      const midY = (idx + 0.5) * rowH;

      ctx.strokeStyle = BASELINE_COLOR;
      ctx.beginPath();
      ctx.moveTo(LABEL_COL_W, midY);
      ctx.lineTo(cssW - 4, midY);
      ctx.stroke();

      ctx.fillStyle = ch.color;
      ctx.fillText(labels[ch.id] || ch.label, 5, midY);

      ctx.strokeStyle = ch.color;
      ctx.lineWidth = ch.kind === 'surface' ? 1.5 : 1.15;
      ctx.beginPath();
      for (let s = 0; s < samplesCount; s++) {
        const px = LABEL_COL_W + (s / (samplesCount - 1)) * plotW;
        const val = Math.max(-CLIP, Math.min(CLIP, timeSeries[s][ch.id] || 0));
        const py = midY - val * (rowH * 0.44);
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    });

    ctx.fillStyle = SCALE_TEXT_COLOR;
    ctx.textAlign = 'right';
    ctx.fillText(`${gridMs} ms`, cssW - 6, cssH - 7);
    ctx.textAlign = 'left';

    ctx.restore();
  }

  return { draw };
}

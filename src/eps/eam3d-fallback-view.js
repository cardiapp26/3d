/*
 * 2D schematic of the 3D EAM workstation, shown when WebGL or the heart atlas is unavailable:
 * four chamber ellipses coloured by activation time, the catheters and the RF lesion tags.
 */
import { EAM3D_CATHETERS, evaluateVertex3d } from './eam3d-model.js';

const CHAMBERS = Object.freeze([
  { id: 'ra', label: 'RA', lever: 'raVisible', x: -0.46, y: 0.36, rx: 0.34, ry: 0.32 },
  { id: 'la', label: 'LA', lever: 'laVisible', x: 0.44, y: 0.42, rx: 0.34, ry: 0.3 },
  { id: 'rv', label: 'RV', lever: 'ventriclesVisible', x: -0.32, y: -0.34, rx: 0.36, ry: 0.48 },
  { id: 'lv', label: 'LV', lever: 'ventriclesVisible', x: 0.36, y: -0.36, rx: 0.38, ry: 0.5 },
]);
const VIEW_SCALE = 0.34;
const SAMPLE_Z = 0.2;
const PICK_Z = 0.22;
const PICK_SPAN = 0.9;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ scenarioId: string, levers: object, ablated: Iterable<string>, lesions: { pos: number[], color: string }[] }} view
 */
export function drawFallbackView(canvas, { scenarioId, levers, ablated, lesions }) {
  const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5;
  const cy = h * 0.5;
  const scale = Math.min(w, h) * VIEW_SCALE;
  const ablatedSet = new Set(ablated);

  for (const ch of CHAMBERS) {
    if (!levers[ch.lever]) continue;
    const sample = evaluateVertex3d([ch.x, ch.y, SAMPLE_Z], ch.id, scenarioId, levers, ablatedSet);
    const hue = Math.round((1 - (sample.lat % sample.tcl) / sample.tcl) * 260);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx + ch.x * scale, cy - ch.y * scale, ch.rx * scale, ch.ry * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 80%, 45%, ${(levers.myocardiumOpacity / 100) * 0.55})`;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = `hsla(${hue}, 85%, 60%, 0.9)`;
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 12px Inter, sans-serif';
    ctx.fillText(ch.label, cx + ch.x * scale - 10, cy - ch.y * scale);
    ctx.restore();
  }

  for (const cat of Object.values(EAM3D_CATHETERS)) {
    const pts = cat.electrodes || [];
    if (!pts.length) continue;
    ctx.save();
    ctx.strokeStyle = cat.color;
    ctx.fillStyle = cat.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const px = cx + p[0] * scale;
      const py = cy - p[1] * scale;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(cx + p[0] * scale, cy - p[1] * scale, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // RF lesion tags, coloured by depth grade like the 3D map.
  for (const { pos, color } of lesions) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + pos[0] * scale, cy - pos[1] * scale, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Tissue readout for a click on the schematic: the quadrant picks the chamber.
 * @returns {{ chamber: string, point: number[], lat: number, bipolar: number, unipolar: number, tissue: string, tag: string | null, tcl: number }}
 */
export function pickFallbackPoint(canvas, ev, { scenarioId, levers, ablated }) {
  const rect =
    typeof canvas.getBoundingClientRect === 'function'
      ? canvas.getBoundingClientRect()
      : { left: 0, top: 0, width: canvas.width, height: canvas.height };
  const nx = rect.width > 0 ? (((ev.clientX ?? rect.left + rect.width / 2) - rect.left) / rect.width) * 2 - 1 : 0;
  const ny = rect.height > 0 ? -((((ev.clientY ?? rect.top + rect.height / 2) - rect.top) / rect.height) * 2 - 1) : 0;
  const point = [Number((nx * PICK_SPAN).toFixed(3)), Number((ny * PICK_SPAN).toFixed(3)), PICK_Z];
  const chamber = ny >= 0 ? (nx < 0 ? 'ra' : 'la') : nx < 0 ? 'rv' : 'lv';
  return {
    chamber: chamber.toUpperCase(),
    point,
    ...evaluateVertex3d(point, chamber, scenarioId, levers, new Set(ablated)),
  };
}

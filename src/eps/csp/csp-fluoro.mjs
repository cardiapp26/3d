/** Schematic fluoroscopy for the CSP implant console (original drawings, not CT or physics-based
 * X-ray). RAO 30: the His-apex line, where the lead tip is dragged to choose the septal level.
 * LAO 40: the septum seen end-on, the sheath angle to it and the lead going into it.
 * Septal section (instructor): the lead depth against the septal thickness and the left bundle.
 */
import { offsetOf, thicknessOf, mmFromHis, ANATOMY } from './csp-procedure.mjs';

// RAO landmarks as fractions of the canvas.
const RAO = Object.freeze({ his: [.36, .3], apex: [.74, .8] });
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Level (0 His .. 1 apex) for a pointer at (x, y) in a w x h RAO canvas. */
export function levelAt(x, y, w, h) {
  const a = [RAO.his[0] * w, RAO.his[1] * h], b = [RAO.apex[0] * w, RAO.apex[1] * h];
  const dx = b[0] - a[0], dy = b[1] - a[1];
  return Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
}

/** Screen position of the lead tip in RAO. */
export function raoTip(proc, w, h) {
  const p = lerp([RAO.his[0] * w, RAO.his[1] * h], [RAO.apex[0] * w, RAO.apex[1] * h], proc.level);
  // Off the septum the tip swings toward the free wall (up in this schematic).
  return [p[0] - offsetOf(proc.sheath) * w * .05, p[1] + offsetOf(proc.sheath) * h * .07];
}

function backdrop(ctx, w, h) {
  const g = ctx.createRadialGradient(w * .5, h * .5, h * .1, w * .5, h * .5, h * .8);
  g.addColorStop(0, '#8f948f'); g.addColorStop(1, '#4b4f4c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

function lead(ctx, points, tip, color = '#151817') {
  ctx.strokeStyle = 'rgba(30, 33, 32, .55)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(...points[0]); ctx.bezierCurveTo(...points[1], ...points[2], ...points[3]); ctx.stroke();   // sheath
  ctx.strokeStyle = color; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(...points[0]); ctx.bezierCurveTo(...points[1], ...points[2], ...tip); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(...tip, 4, 0, Math.PI * 2); ctx.fill();
}

function drawRao(ctx, w, h, proc, opts) {
  backdrop(ctx, w, h);
  // Cardiac silhouette and the tricuspid annulus.
  ctx.fillStyle = 'rgba(40, 44, 42, .35)';
  ctx.beginPath(); ctx.ellipse(w * .54, h * .56, w * .36, h * .33, .45, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(25, 28, 27, .55)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(w * .32, h * .45, w * .06, h * .17, .25, 0, Math.PI * 2); ctx.stroke();
  const his = [RAO.his[0] * w, RAO.his[1] * h], apex = [RAO.apex[0] * w, RAO.apex[1] * h];
  if (opts.guides) {
    ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255, 238, 170, .7)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(...his); ctx.lineTo(...apex); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ffe9a6'; ctx.beginPath(); ctx.arc(...his, 4, 0, Math.PI * 2); ctx.fill();
    ctx.font = '600 10px system-ui, sans-serif'; ctx.fillText('His', his[0] - 26, his[1] - 4);
    ctx.fillText(opts.text.apex, apex[0] + 6, apex[1] + 4);
  }
  if (opts.target) {
    const { lbb } = ANATOMY[proc.caseId] || ANATOMY.baseline;
    const a = lerp(his, apex, lbb - .08), b = lerp(his, apex, lbb + .08);
    ctx.strokeStyle = 'rgba(118, 215, 165, .75)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
  }
  const tip = raoTip(proc, w, h);
  lead(ctx, [[w * .2, 0], [w * .16, h * .32], [w * .3, h * .5], [tip[0] - w * .06, tip[1] - h * .02]], tip);
  ctx.fillStyle = '#f4f1e6'; ctx.font = '600 11px ui-monospace, monospace';
  ctx.fillText(`${mmFromHis(proc)} mm ${opts.text.fromHis}`, 10, h - 12);
  if (proc.depthMm <= .05) { ctx.fillStyle = 'rgba(244, 241, 230, .75)'; ctx.font = '10px system-ui, sans-serif'; ctx.fillText(opts.text.drag, 10, 18); }
}

function drawLao(ctx, w, h, proc, opts) {
  backdrop(ctx, w, h);
  const top = [w * .56, h * .14], bottom = [w * .5, h * .9];
  const sx = bottom[0] - top[0], sy = bottom[1] - top[1], len = Math.hypot(sx, sy);
  const along = [sx / len, sy / len], normal = [-along[1], along[0]];   // normal points toward the LV (screen right)
  const into = normal[0] > 0 ? normal : [-normal[0], -normal[1]];
  const septumPx = w * .13;
  ctx.fillStyle = 'rgba(40, 44, 42, .4)';
  ctx.beginPath(); ctx.ellipse(w * .62, h * .54, w * .3, h * .36, 0, 0, Math.PI * 2); ctx.fill();   // LV
  ctx.fillStyle = 'rgba(55, 59, 57, .3)';
  ctx.beginPath(); ctx.ellipse(w * .33, h * .55, w * .22, h * .32, 0, 0, Math.PI * 2); ctx.fill();   // RV
  ctx.strokeStyle = 'rgba(25, 28, 27, .6)'; ctx.lineWidth = septumPx;
  ctx.beginPath(); ctx.moveTo(top[0] + into[0] * septumPx / 2, top[1] + into[1] * septumPx / 2); ctx.lineTo(bottom[0] + into[0] * septumPx / 2, bottom[1] + into[1] * septumPx / 2); ctx.stroke();
  ctx.fillStyle = '#f4f1e6'; ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText('RV', w * .2, h * .2); ctx.fillText('LV', w * .8, h * .2);
  // Sheath arrives from the RV, rotated from the septal normal by its angle; off the septum the tip sits on the free wall.
  const mid = lerp(top, bottom, .55);
  const offset = offsetOf(proc.sheath);
  const a = (-proc.sheath * Math.PI) / 180;   // CCW button raises the angle: the drawing turns counter-clockwise
  const dir = [into[0] * Math.cos(a) - into[1] * Math.sin(a), into[0] * Math.sin(a) + into[1] * Math.cos(a)];
  const entry = offset === 0 ? mid : [w * .16, h * (offset < 0 ? .72 : .36)];
  const depthPx = (proc.depthMm / thicknessOf(proc)) * septumPx;
  const tip = [entry[0] + dir[0] * depthPx, entry[1] + dir[1] * depthPx];
  const back = [entry[0] - dir[0] * w * .3, entry[1] - dir[1] * w * .3];
  lead(ctx, [[w * .05, h * .1], [w * .08, h * .4], lerp(back, entry, .3), entry], tip);
  if (opts.guides) {
    ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255, 238, 170, .7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mid[0] - into[0] * w * .25, mid[1] - into[1] * w * .25); ctx.lineTo(mid[0] + into[0] * w * .12, mid[1] + into[1] * w * .12); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = '#f4f1e6'; ctx.font = '600 11px ui-monospace, monospace';
  ctx.fillText(`${opts.text.angle}: ${Math.round(proc.sheath)}°`, 10, h - 12);
}

function drawSection(ctx, w, h, proc, opts) {
  ctx.fillStyle = '#0d1813'; ctx.fillRect(0, 0, w, h);
  const left = w * .22, right = w * .78, top = h * .1, bottom = h * .86;
  const thickness = thicknessOf(proc);
  ctx.fillStyle = '#5b3a35'; ctx.fillRect(left, top, right - left, bottom - top);
  // Left bundle fan near the LV side (the conduction access band of the model).
  ctx.fillStyle = 'rgba(118, 215, 165, .55)';
  ctx.fillRect(left + (right - left) * .82, top, (right - left) * .16, bottom - top);
  ctx.fillStyle = '#d9e5dc'; ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText('RV', left - 26, top + 14); ctx.fillText('LV', right + 8, top + 14);
  ctx.fillText(opts.text.lbb, left + (right - left) * .78, bottom + 16);
  for (let mm = 0; mm <= thickness; mm += 2) {
    const x = left + (mm / thickness) * (right - left);
    ctx.fillStyle = '#9fb8a8'; ctx.fillRect(x, top - 6, 1, 5);
    ctx.font = '9px ui-monospace, monospace'; ctx.fillText(String(mm), x - 3, top - 9);
  }
  const y = top + (bottom - top) * .45, tip = left + (proc.depthMm / thickness) * (right - left);
  ctx.strokeStyle = '#e8c06a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(4, y - 10); ctx.lineTo(left, y); ctx.lineTo(tip, y); ctx.stroke();
  // Helix turns behind the tip.
  ctx.lineWidth = 1.5;
  for (let k = 0; k < 4; k++) { const x = tip - 4 - k * 4; ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x - 2, y + 5); ctx.stroke(); }
  ctx.fillStyle = '#f4f1e6'; ctx.font = '600 11px ui-monospace, monospace';
  ctx.fillText(`${proc.depthMm.toFixed(1)} / ${thickness} mm`, 10, h - 8);
}

/** @param {'rao'|'lao'|'septum'} view */
export function drawFluoro(ctx, w, h, view, proc, opts) {
  if (view === 'septum') drawSection(ctx, w, h, proc, opts);
  else if (view === 'lao') drawLao(ctx, w, h, proc, opts);
  else drawRao(ctx, w, h, proc, opts);
}

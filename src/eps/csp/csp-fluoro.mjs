/** Schematic fluoroscopy for the CSP implant console (original drawings, not CT or physics-based
 * X-ray). RAO 30: the His-apex line, where the lead tip is dragged to choose the septal level.
 * LAO 40: the septum seen end-on, the sheath angle to it and the lead going into it.
 * Septal section (instructor): the lead depth against the septal thickness and the left bundle.
 *
 * Screening is pulsed: the image only updates while fluoro is on (button, Space, or auto-fluoro
 * after a movement); otherwise the last image holds. A fluoro timer, grain, cardiac pulsation,
 * a contrast puff and an LAO angle badge against the heart's ideal sheath angle complete it.
 */
import { offsetOf, thicknessOf, mmFromHis, anatomyOf, relAngle, idealAngleOf } from './csp-procedure.mjs';

export const FPS = 7.5;
const AUTO_MS = 1500;         // auto-fluoro screens this long after a movement
const CONTRAST_MS = 2200;
const HELIX_MM_PER_S = 6;     // the drawn tip follows the real depth at this speed
const GRAIN = 260;

// RAO landmarks as fractions of the canvas.
const RAO = Object.freeze({ his: [.36, .3], apex: [.74, .8] });
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const pad = n => String(n).padStart(2, '0');
export const clockOf = seconds => `${Math.floor(seconds / 60)}:${pad(Math.floor(seconds) % 60)}`;

/** Screening state owned by the console. */
export function createFluoroState() {
  return { on: false, auto: true, autoUntil: 0, seconds: 0, contrastUntil: 0, shownDepth: 0, lastDraw: -1, dirty: true, lih: false };
}
/** A movement happened: auto-fluoro screens for a moment. */
export function moved(fx, now) { if (fx.auto) fx.autoUntil = now + AUTO_MS; }
export function puff(fx, now) { fx.contrastUntil = now + CONTRAST_MS; moved(fx, now); }
export const isLive = (fx, now) => fx.on || now < fx.autoUntil;
/**
 * Advance the screening by dt ms. Returns what to draw: 'frame' (a new pulsed image), 'hold'
 * (fluoro just stopped: draw the last image with the hold label) or null.
 */
export function tickFluoro(fx, now, dt, proc) {
  const live = isLive(fx, now);
  if (live) fx.seconds += dt / 1000;
  const step = (dt / 1000) * HELIX_MM_PER_S, target = proc.depthMm;
  fx.shownDepth = Math.abs(fx.shownDepth - target) <= step ? target : fx.shownDepth + Math.sign(target - fx.shownDepth) * step;
  if (live) {
    fx.lih = false;
    if (now - fx.lastDraw >= 1000 / FPS || fx.dirty) { fx.lastDraw = now; fx.dirty = false; return 'frame'; }
    return null;
  }
  if (!fx.lih) { fx.lih = true; fx.dirty = false; return 'hold'; }
  if (fx.dirty) { fx.dirty = false; return 'hold'; }
  return null;
}
export const contrastOf = (fx, now) => Math.max(0, Math.min(1, (fx.contrastUntil - now) / CONTRAST_MS));

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
  const offset = offsetOf(relAngle(proc));
  return [p[0] - offset * w * .05, p[1] + offset * h * .07];
}

function backdrop(ctx, w, h, fx) {
  const g = ctx.createRadialGradient(w * .5, h * .5, h * .1, w * .5, h * .5, h * .8);
  g.addColorStop(0, '#8f948f'); g.addColorStop(1, '#4b4f4c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  if (fx?.live) {   // quantum grain of a pulsed frame
    ctx.fillStyle = 'rgba(255, 255, 255, .12)';
    for (let i = 0; i < GRAIN; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2);
    ctx.fillStyle = 'rgba(0, 0, 0, .14)';
    for (let i = 0; i < GRAIN; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2);
  }
}
const pulse = fx => 1 + (fx?.live ? .015 * Math.sin(fx.seconds * Math.PI * 2 * 1.4) : 0);

function lead(ctx, points, tip, color = '#151817') {
  ctx.strokeStyle = 'rgba(30, 33, 32, .55)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(...points[0]); ctx.bezierCurveTo(...points[1], ...points[2], ...points[3]); ctx.stroke();   // sheath
  ctx.strokeStyle = color; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(...points[0]); ctx.bezierCurveTo(...points[1], ...points[2], ...tip); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(...tip, 4, 0, Math.PI * 2); ctx.fill();
}
/** The helix turning: a radio-opaque mark orbiting the tip (phase in turns), seen obliquely. */
function spinMark(ctx, tip, phase) {
  if (phase == null) return;
  const a = phase * Math.PI * 2;
  ctx.strokeStyle = 'rgba(21, 24, 23, .9)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(tip[0], tip[1], 7, 3, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#151817';
  ctx.beginPath(); ctx.arc(tip[0] + 7 * Math.cos(a), tip[1] + 3 * Math.sin(a), 2.2, 0, Math.PI * 2); ctx.fill();
}

function hud(ctx, w, h, view, fx, text) {
  ctx.fillStyle = '#f4f1e6'; ctx.font = '600 10px ui-monospace, monospace';
  ctx.fillText(`${view}  ${FPS} p/s`, 8, 14);
  ctx.fillText(`${text.hud} ${clockOf(fx?.seconds || 0)}`, 8, 27);
  if (fx && !fx.live) { ctx.fillStyle = 'rgba(244, 241, 230, .7)'; ctx.fillText(text.lih, w - 8 - ctx.measureText(text.lih).width, 14); }
}

function drawRao(ctx, w, h, proc, opts) {
  const { fx, text } = opts;
  backdrop(ctx, w, h, fx);
  const k = pulse(fx);
  // Cardiac silhouette and the tricuspid annulus.
  ctx.fillStyle = 'rgba(40, 44, 42, .35)';
  ctx.beginPath(); ctx.ellipse(w * .54, h * .56, w * .36 * k, h * .33 * k, .45, 0, Math.PI * 2); ctx.fill();
  if (opts.contrast > 0) {   // contrast puff: the RV blood pool and the septal border
    ctx.fillStyle = `rgba(28, 30, 29, ${.45 * opts.contrast})`;
    ctx.beginPath(); ctx.ellipse(w * .42, h * .58, w * .17 * k, h * .26 * k, .5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(25, 28, 27, .55)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(w * .32, h * .45, w * .06, h * .17, .25, 0, Math.PI * 2); ctx.stroke();
  const his = [RAO.his[0] * w, RAO.his[1] * h], apex = [RAO.apex[0] * w, RAO.apex[1] * h];
  if (opts.guides) {
    ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255, 238, 170, .7)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(...his); ctx.lineTo(...apex); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ffe9a6'; ctx.beginPath(); ctx.arc(...his, 4, 0, Math.PI * 2); ctx.fill();
    ctx.font = '600 10px system-ui, sans-serif'; ctx.fillText('His', his[0] - 26, his[1] - 4);
    ctx.fillText(text.apex, apex[0] + 6, apex[1] + 4);
  }
  if (opts.target) {
    const { lbb } = anatomyOf(proc);
    const a = lerp(his, apex, lbb - .08), b = lerp(his, apex, lbb + .08);
    ctx.strokeStyle = 'rgba(90, 169, 230, .7)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
  }
  const tip = raoTip(proc, w, h);
  lead(ctx, [[w * .2, 0], [w * .16, h * .32], [w * .3, h * .5], [tip[0] - w * .06, tip[1] - h * .02]], tip);
  spinMark(ctx, tip, opts.spin);
  ctx.fillStyle = '#f4f1e6'; ctx.font = '600 11px ui-monospace, monospace';
  ctx.fillText(`${mmFromHis(proc)} mm ${text.fromHis}`, 10, h - 12);
  if (proc.depthMm <= .05) { ctx.fillStyle = 'rgba(244, 241, 230, .75)'; ctx.font = '10px system-ui, sans-serif'; ctx.fillText(text.drag, 10, h - 28); }
  hud(ctx, w, h, 'RAO 30°', fx, text);
}

function drawLao(ctx, w, h, proc, opts) {
  const { fx, text } = opts;
  backdrop(ctx, w, h, fx);
  const k = pulse(fx);
  const top = [w * .56, h * .14], bottom = [w * .5, h * .9];
  const sx = bottom[0] - top[0], sy = bottom[1] - top[1], len = Math.hypot(sx, sy);
  const along = [sx / len, sy / len], normal = [-along[1], along[0]];   // normal points toward the LV (screen right)
  const into = normal[0] > 0 ? normal : [-normal[0], -normal[1]];
  const septumPx = w * .13;
  ctx.fillStyle = 'rgba(40, 44, 42, .4)';
  ctx.beginPath(); ctx.ellipse(w * .62, h * .54, w * .3 * k, h * .36 * k, 0, 0, Math.PI * 2); ctx.fill();   // LV
  ctx.fillStyle = `rgba(55, 59, 57, ${.3 + .35 * opts.contrast})`;
  ctx.beginPath(); ctx.ellipse(w * .33, h * .55, w * .22 * k, h * .32 * k, 0, 0, Math.PI * 2); ctx.fill();   // RV (darker with contrast)
  ctx.strokeStyle = `rgba(25, 28, 27, ${.6 + .3 * opts.contrast})`; ctx.lineWidth = septumPx;
  ctx.beginPath(); ctx.moveTo(top[0] + into[0] * septumPx / 2, top[1] + into[1] * septumPx / 2); ctx.lineTo(bottom[0] + into[0] * septumPx / 2, bottom[1] + into[1] * septumPx / 2); ctx.stroke();
  ctx.fillStyle = '#f4f1e6'; ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText('RV', w * .2, h * .2); ctx.fillText('LV', w * .8, h * .2);
  // Sheath arrives from the RV, rotated from the septal normal by its relative angle; off the septum the tip sits on the free wall.
  const mid = lerp(top, bottom, .55);
  const rel = relAngle(proc), offset = offsetOf(rel);
  const a = (-rel * Math.PI) / 180;   // CCW button raises the angle: the drawing turns counter-clockwise
  const dir = [into[0] * Math.cos(a) - into[1] * Math.sin(a), into[0] * Math.sin(a) + into[1] * Math.cos(a)];
  const entry = offset === 0 ? mid : [w * .16, h * (offset < 0 ? .72 : .36)];
  const depthPx = ((fx ? fx.shownDepth : proc.depthMm) / thicknessOf(proc)) * septumPx;
  const tip = [entry[0] + dir[0] * depthPx, entry[1] + dir[1] * depthPx];
  const back = [entry[0] - dir[0] * w * .3, entry[1] - dir[1] * w * .3];
  lead(ctx, [[w * .05, h * .1], [w * .08, h * .4], lerp(back, entry, .3), entry], tip);
  spinMark(ctx, tip, opts.spin);
  if (opts.guides) {
    ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255, 238, 170, .7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mid[0] - into[0] * w * .25, mid[1] - into[1] * w * .25); ctx.lineTo(mid[0] + into[0] * w * .12, mid[1] + into[1] * w * .12); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = '#f4f1e6'; ctx.font = '600 11px ui-monospace, monospace';
  ctx.fillText(`${text.angle}: ${Math.round(proc.sheath)}°`, 10, h - 12);
  if (opts.badge) {   // the sheath against this heart's perpendicular
    const off = Math.abs(rel), tone = off <= 10 ? 'ok' : off <= 20 ? 'warn' : 'bad';
    ctx.fillStyle = { ok: 'rgba(47, 143, 92, .85)', warn: 'rgba(128, 106, 31, .9)', bad: 'rgba(132, 52, 44, .9)' }[tone];
    ctx.fillRect(8, h - 46, w - 16, 20);
    ctx.fillStyle = '#f4f1e6'; ctx.font = '600 10px ui-monospace, monospace';
    ctx.fillText(`${text.ideal} ${idealAngleOf(proc)}°  ·  ${text.badge[tone]}`, 14, h - 32);
  }
  hud(ctx, w, h, 'LAO 40°', fx, text);
}

function drawSection(ctx, w, h, proc, opts) {
  ctx.fillStyle = '#0b0e12'; ctx.fillRect(0, 0, w, h);
  const left = w * .22, right = w * .78, top = h * .1, bottom = h * .86;
  const thickness = thicknessOf(proc);
  ctx.fillStyle = '#5b3a35'; ctx.fillRect(left, top, right - left, bottom - top);
  // Left bundle fan near the LV side (the conduction access band of the model).
  ctx.fillStyle = 'rgba(90, 169, 230, .5)';
  ctx.fillRect(left + (right - left) * .82, top, (right - left) * .16, bottom - top);
  ctx.fillStyle = '#dfe5ec'; ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText('RV', left - 26, top + 14); ctx.fillText('LV', right + 8, top + 14);
  ctx.fillText(opts.text.lbb, left + (right - left) * .78, bottom + 16);
  for (let mm = 0; mm <= thickness; mm += 2) {
    const x = left + (mm / thickness) * (right - left);
    ctx.fillStyle = '#9aa6b4'; ctx.fillRect(x, top - 6, 1, 5);
    ctx.font = '9px ui-monospace, monospace'; ctx.fillText(String(mm), x - 3, top - 9);
  }
  const depth = opts.fx ? opts.fx.shownDepth : proc.depthMm;
  const y = top + (bottom - top) * .45, tip = left + (depth / thickness) * (right - left);
  ctx.strokeStyle = '#e8c06a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(4, y - 10); ctx.lineTo(left, y); ctx.lineTo(tip, y); ctx.stroke();
  // Helix turns behind the tip; while turning they scroll forward with the phase.
  ctx.lineWidth = 1.5;
  const shift = opts.spin == null ? 0 : (opts.spin % 1) * 4;
  for (let k = 0; k < 4; k++) { const x = tip - 4 - k * 4 + shift; ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x - 2, y + 5); ctx.stroke(); }
  ctx.fillStyle = '#f4f1e6'; ctx.font = '600 11px ui-monospace, monospace';
  ctx.fillText(`${proc.depthMm.toFixed(1)} / ${thickness} mm`, 10, h - 8);
}

/**
 * @param {'rao'|'lao'|'septum'} view
 * @param {object} opts { guides, target, badge, contrast (0..1), spin (helix phase in turns, or null), fx: { live, seconds, shownDepth } | null, text }
 */
export function drawFluoro(ctx, w, h, view, proc, opts) {
  const o = { contrast: 0, fx: null, badge: false, spin: null, ...opts };
  if (view === 'septum') drawSection(ctx, w, h, proc, o);
  else if (view === 'lao') drawLao(ctx, w, h, proc, o);
  else drawRao(ctx, w, h, proc, o);
}

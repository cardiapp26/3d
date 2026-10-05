// ECG Canvas Renderers for Guyton & Hall Interactive Physics
// 1. Grid Paper (25mm/s, 10mm/mV, small box = 0.04s, large box = 0.20s)
// 2. Vector Projection on Lead Axes (Einthoven Triangle & Hexaxial)
// 3. Sequential Depolarization Step Vector Engine
// 4. Circus Movement (Re-entry Loop) Physics Simulator

const GRID_COLOR_MAJOR = '#f87171'; // classic pink/salmon red
const GRID_COLOR_MINOR = '#fca5a5';

export function drawEcgGrid(ctx, width, height, opts = {}) {
  const bg = opts.bg || '#fff7ed'; // soft ECG paper tone
  const pxPerMm = opts.pxPerMm || 4; // 1 mm = 4px (small box), 5 mm = 20px (big box)
  
  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Minor grid lines (1mm = 0.04s or 0.1mV)
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.18)';
  ctx.beginPath();
  for (let x = 0; x <= width; x += pxPerMm) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y <= height; y += pxPerMm) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // Major grid lines (5mm = 0.20s or 0.5mV)
  ctx.lineWidth = 1.0;
  ctx.strokeStyle = 'rgba(220, 38, 38, 0.38)';
  ctx.beginPath();
  for (let x = 0; x <= width; x += pxPerMm * 5) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y <= height; y += pxPerMm * 5) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a calibrated ECG wave strip on the paper grid.
 */
export function drawCalibratedWave(ctx, points, width, height, opts = {}) {
  const traceColor = opts.color || '#09090b';
  const baselineY = opts.baselineY || height * 0.5;
  const pxPerMv = opts.pxPerMv || 40; // 1 mV = 10 mm = 40 px

  ctx.save();
  ctx.lineWidth = opts.lineWidth || 2.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = traceColor;

  ctx.beginPath();
  points.forEach((p, idx) => {
    const x = p.x;
    const y = baselineY - p.mv * pxPerMv;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

/**
 * Generates synthetic points for standard Guyton P-Q-R-S-T complexes
 */
export function ecgTiming(opts = {}) {
  const rate = opts.rate ?? 75, pr = opts.pr ?? 0.16, qrs = opts.qrs ?? (opts.bizarreQrs ? 0.16 : 0.08), qt = opts.qt ?? 0.36;
  if (![rate,pr,qrs,qt].every(Number.isFinite) || rate <= 0 || pr < .08 || qrs <= 0 || qt <= qrs) throw new RangeError('Invalid ECG teaching timing');
  const p = .12, q = p + pr, j = q + qrs, tEnd = q + qt;
  return { rate, pr, qrs, qt, rr: 60/rate, p, pEnd:p+.08, q, j, tStart:Math.max(j,tEnd-.14), tEnd };
}
export function ecgSample(t, opts = {}) {
  const timing = ecgTiming(opts), phase = ((t % timing.rr) + timing.rr) % timing.rr;
  const sampleBeat = u => {
  const st = opts.stElev ?? 0;
  if (u >= timing.p && u < timing.pEnd) return .18*Math.sin((u-timing.p)/.08*Math.PI);
  if (u >= timing.q && u < timing.j) {
    const f=(u-timing.q)/timing.qrs;
    const anchors=opts.bizarreQrs ? [[0,0],[.15,.6],[.3,.45],[.6,1.1],[.8,-.5],[1,st]] : [[0,0],[.12,-.12],[.35,1.25],[.65,-.3],[1,st]];
    // Cosine easing between anchors: smooth deflections, anchor values kept exactly.
    for(let i=1;i<anchors.length;i++)if(f<=anchors[i][0]){const [a,v]=anchors[i-1],[b,w]=anchors[i];return v+(w-v)*(1-Math.cos(Math.PI*(f-a)/(b-a)))/2;}
  }
  // ST: flat for 20 ms after J, then a gentle convex slope that merges into the T wave.
  // Elevation: convex ST rising into a taller (hyperacute) T; depression: down-sloping ST.
  const stRise = .3*st, stFlat = timing.j+.02, tAmp = .35+.8*Math.max(0,st);
  if (u >= timing.j && u < stFlat) return st;
  if (u >= stFlat && u < timing.tStart) {const f=(u-stFlat)/Math.max(1e-6,timing.tStart-stFlat);return st+stRise*Math.sin(f*Math.PI/2);}
  if (u >= timing.tStart && u < timing.tEnd) {const f=(u-timing.tStart)/(timing.tEnd-timing.tStart);return (st+stRise)*(1-f)+(opts.invertT?-1:1)*tAmp*Math.sin(f*Math.PI);}
  return 0;
  };
  let value = 0;
  // Retain prior-beat repolarization if the illustrative fixed QT crosses RR.
  for (let offset = 0; phase + offset * timing.rr < timing.tEnd; offset++) value += sampleBeat(phase + offset * timing.rr);
  return value;
}
export function generateEcgPoints(width, opts = {}) {
  const pxPerSec=opts.pxPerSec ?? 100;
  if (!Number.isFinite(width) || width<=0 || !Number.isFinite(pxPerSec) || pxPerSec<=0) throw new RangeError('Invalid ECG geometry');
  return Array.from({length:Math.ceil(width*2)+1},(_,i)=>{const x=Math.min(width,i/2);return {x,mv:ecgSample(x/pxPerSec,opts)};});
}

/**
 * Draws the Einthoven Triangle, Lead Axes, and Electrical Vector Projection
 */
export function drawVectorHexaxial(ctx, width, height, vectorAngleDeg, vectorMagnitude, opts = {}) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.38;

  ctx.save();
  ctx.fillStyle = opts.bg || '#0f172a'; // dark medical lab background
  ctx.fillRect(0, 0, width, height);

  // Draw 360 degree circle
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#334155';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw degree ticks
  for (let deg = 0; deg < 360; deg += 30) {
    const rad = (deg * Math.PI) / 180;
    const x1 = cx + (radius - 6) * Math.cos(rad);
    const y1 = cy + (radius - 6) * Math.sin(rad);
    const x2 = cx + radius * Math.cos(rad);
    const y2 = cy + radius * Math.sin(rad);
    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Limb Leads Definitions: [name, angleDeg, color]
  const leads = [
    { name: 'I (0°)', angle: 0, color: '#38bdf8' },
    { name: 'II (+60°)', angle: 60, color: '#4ade80' },
    { name: 'III (+120°)', angle: 120, color: '#a78bfa' },
    { name: 'aVR (-150°)', angle: -150, color: '#f87171' },
    { name: 'aVL (-30°)', angle: -30, color: '#fb923c' },
    { name: 'aVF (+90°)', angle: 90, color: '#facc15' }
  ];

  // Draw lead axes lines
  leads.forEach(lead => {
    const rad = (lead.angle * Math.PI) / 180;
    const x1 = cx - radius * Math.cos(rad);
    const y1 = cy - radius * Math.sin(rad);
    const x2 = cx + radius * Math.cos(rad);
    const y2 = cy + radius * Math.sin(rad);

    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label at positive pole
    const tx = cx + (radius + 22) * Math.cos(rad);
    const ty = cy + (radius + 22) * Math.sin(rad);
    ctx.fillStyle = lead.color;
    ctx.font = '600 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lead.name, tx, ty);
  });

  // Calculate Projections on Lead I and Lead III to illustrate Einthoven's Law
  const vRad = (vectorAngleDeg * Math.PI) / 180;
  const vecLenPx = vectorMagnitude * radius;
  const vx = cx + vecLenPx * Math.cos(vRad);
  const vy = cy + vecLenPx * Math.sin(vRad);

  // Projections on I, II, III
  const projI = vectorMagnitude * Math.cos(vRad - 0);
  const projII = vectorMagnitude * Math.cos(vRad - (60 * Math.PI) / 180);
  const projIII = vectorMagnitude * Math.cos(vRad - (120 * Math.PI) / 180);

  // Draw projections dotted lines to Lead I and II
  function drawProj(leadAngleDeg, projVal, color) {
    const lRad = (leadAngleDeg * Math.PI) / 180;
    const px = cx + projVal * radius * Math.cos(lRad);
    const py = cy + projVal * radius * Math.sin(lRad);

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw projected point on axis
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();

    // Line from center to projection
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();
  }

  drawProj(0, projI, '#38bdf8'); // Lead I
  drawProj(60, projII, '#4ade80'); // Lead II
  drawProj(120, projIII, '#a78bfa'); // Lead III

  // Draw Resultant Vector Arrow (Bold Golden)
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#f59e0b';
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(vx, vy);
  ctx.stroke();

  // Arrowhead
  const arrowSize = 10;
  const aAngle1 = vRad + Math.PI - 0.4;
  const aAngle2 = vRad + Math.PI + 0.4;
  ctx.beginPath();
  ctx.moveTo(vx, vy);
  ctx.lineTo(vx + arrowSize * Math.cos(aAngle1), vy + arrowSize * Math.sin(aAngle1));
  ctx.lineTo(vx + arrowSize * Math.cos(aAngle2), vy + arrowSize * Math.sin(aAngle2));
  ctx.closePath();
  ctx.fill();

  // Center hub
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  return {
    lead1: projI,
    lead2: projII,
    lead3: projIII,
    einthovenCheck: projI + projIII, // Should equal lead2
    diff: Math.abs(projI + projIII - projII)
  };
}

/**
 * Animated Re-entry (Circus Movement) Simulator
 * Shows normal bidirectional extinction vs circus ring movement
 */
export function drawCircusLoop(ctx, width, height, tSec, opts = {}) {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.36;

  ctx.save();
  ctx.fillStyle = opts.bg || '#090d16';
  ctx.fillRect(0, 0, width, height);

  // Draw Ring Heart Muscle Band
  ctx.lineWidth = 26;
  ctx.strokeStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  const isReentry = opts.reentry !== false;
  const speed = opts.speed || 1.0; // conduction speed factor
  const refractoryMs = opts.refractory || 200; // ms

  if (!isReentry) {
    // Normal: impulse splits into two, collides at 6 o'clock and extinguishes
    const prog = (tSec * speed) % 1.0; // 0 to 1
    const angleLeft = -Math.PI / 2 + prog * Math.PI;
    const angleRight = -Math.PI / 2 - prog * Math.PI;

    // Glowing wave heads
    ctx.lineWidth = 24;
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx, cy, r, angleRight, angleLeft);
    ctx.stroke();

    // Extinction spark when prog ~ 1.0
    if (prog > 0.92) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(cx, cy + r, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Re-entry: Unidirectional block at right side, wavefront circles endlessly
    const prog = (tSec * speed * 0.8) % 1.0;
    const headAngle = prog * Math.PI * 2 - Math.PI / 2;
    const tailAngle = headAngle - (opts.waveLength || 1.4); // length of depolarized head

    // Depolarized active zone
    const grad = ctx.createConicGradient(headAngle + Math.PI / 2, cx, cy);
    grad.addColorStop(0, '#f43f5e'); // Depolarized front
    grad.addColorStop(0.3, '#fb923c');
    grad.addColorStop(0.6, '#334155'); // Refractory tail
    grad.addColorStop(1, '#1e293b'); // Resting excitable gap

    ctx.lineWidth = 24;
    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Excitable gap indicator
    ctx.fillStyle = '#4ade80';
    ctx.font = '600 12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(opts.lang === 'en' ? 'Excitable Gap' : 'Uyarılabilir Boşluk', cx, cy - r - 22);
  }

  ctx.restore();
}

/*
 * Interatrial septum map: the fossa ovalis seen en face from the right atrium
 * (superior up, anterior to the right) divided into the six transseptal
 * sectors S, AS, AI, I, PI, PS, with the caval veins, the right upper
 * pulmonary vein (posterior), the aortic root (anterosuperior) and the
 * tricuspid valve (anterior) around it, and the current imaging plane drawn
 * across. The TEE bicaval view (90-110°) cuts it superior-inferior, the short
 * axis (30-45°) and the ICE septal view anterior-posterior: the two together
 * place the puncture site in its sector.
 */

export const FOSSA_SECTORS = Object.freeze(['S', 'AS', 'AI', 'I', 'PI', 'PS']);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); };

/**
 * Septal frame of the fossa: up (superior), anterior (in the septal plane) and
 * the fossa half-axes along them.
 * @param {{ center: number[], normal: number[], radius?: number, across?: number }} fossa
 */
export function fossaFrame(fossa) {
  const n = norm(fossa.normal);
  const inPlane = v => norm(sub(v, n.map(x => x * dot(v, n))));
  const up = inPlane([0, 1, 0]);
  let anterior = norm(cross(up, n));
  if (anterior[2] < 0) anterior = anterior.map(v => -v);
  const r = fossa.radius || 0.195;
  return { center: fossa.center, normal: n, up, anterior, ry: r, rx: r * (fossa.across || 1) };
}

/** Map coordinates of a world point: x anterior, y superior, both in fossa half-axes. */
export const toFossa = (F, p) => { const d = sub(p, F.center); return [dot(d, F.anterior) / F.rx, dot(d, F.up) / F.ry]; };

/** Sector of a map point (angle from superior toward anterior). */
export function sectorAt(q) {
  const deg = ((Math.atan2(q[0], q[1]) * 180) / Math.PI + 360 + 30) % 360;
  return FOSSA_SECTORS[Math.floor(deg / 60)];
}

/**
 * The imaging plane across the septal plane: the line in map coordinates, the
 * sectors it crosses inside the fossa, whether it passes through the fossa and
 * its angle from the superior-inferior axis (0 = bicaval-like, 90 =
 * anterior-posterior).
 * @param {object} F fossaFrame
 * @param {{ origin: number[], normal: number[] }} frame
 */
export function septalCut(F, frame) {
  const d = cross(frame.normal, F.normal);
  if (Math.hypot(...d) < 1e-3) return { line: null, through: false, sectors: [], angle: null };
  const dir = norm(d);
  const toward = norm(cross(F.normal, dir));
  const t = dot(sub(frame.origin, F.center), frame.normal) / (dot(toward, frame.normal) || 1e-9);
  const p = F.center.map((c, i) => c + toward[i] * t);
  const a = toFossa(F, p);
  const u = [dot(dir, F.anterior) / F.rx, dot(dir, F.up) / F.ry];
  const ul = Math.hypot(...u) || 1;
  const v = [u[0] / ul, u[1] / ul];
  const line = [[a[0] - v[0] * 4, a[1] - v[1] * 4], [a[0] + v[0] * 4, a[1] + v[1] * 4]];
  const sectors = new Set();
  for (let s = -1.2; s <= 1.2; s += 0.02) {
    const q = [a[0] + v[0] * s * 1.0, a[1] + v[1] * s * 1.0];
    const r = Math.hypot(...q);
    if (r <= 1 && r >= 0.2) sectors.add(sectorAt(q));
  }
  // Angle of the line in true (unscaled) septal units, from the superior-inferior axis.
  const angle = (Math.acos(Math.min(1, Math.abs(dot(dir, F.up)))) * 180) / Math.PI;
  const dist = Math.abs(a[0] * v[1] - a[1] * v[0]);
  return { line, through: dist < 1, distance: dist, sectors: FOSSA_SECTORS.filter(k => sectors.has(k)), angle };
}

/**
 * Criterion of a view with `septalCut: { axis: 'si' | 'ap', max }`: the cut
 * passes through the fossa and runs within `max` degrees of the
 * superior-inferior (si) or anterior-posterior (ap) axis.
 */
export function septalCutCheck(F, frame, spec) {
  const cut = septalCut(F, frame);
  const along = cut.angle == null ? null : spec.axis === 'si' ? cut.angle : 90 - cut.angle;
  return { ...cut, axis: spec.axis, ok: Boolean(cut.through && along != null && along <= spec.max), along };
}

const LANDMARK_COLORS = { svc: '#76a5af', ivc: '#76a5af', rupv: '#a4c2f4', ao: '#ea9999', tv: '#d9ead3' };
const TEXT = {
  tr: { title: 'Fossa ovalis (RA\'dan bakış) ve kesit', svc: 'SVC', ivc: 'IVC', rupv: 'RUPV', ao: 'Ao', tv: 'TV', sup: 'üst', ant: 'ön', none: 'Kesit septuma paralel' },
  en: { title: 'Fossa ovalis (view from the RA) and the cut', svc: 'SVC', ivc: 'IVC', rupv: 'RUPV', ao: 'Ao', tv: 'TV', sup: 'sup', ant: 'ant', none: 'Cut parallel to the septum' }
};

/**
 * Draw the septal map.
 * @param {HTMLCanvasElement} canvas
 * @param {object} F fossaFrame
 * @param {Object<string, number[]>} landmarks world points: svc, ivc, rupv, ao, tv
 * @param {object} cut septalCut result
 */
export function drawSeptalMap(canvas, F, landmarks, cut, { lang = 'tr', dpr = 1 } = {}) {
  if (!canvas || !F) return;
  const T = TEXT[lang === 'en' ? 'en' : 'tr'];
  const w = canvas.clientWidth || 200, h = canvas.clientHeight || 150;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#050807';
  ctx.fillRect(0, 0, w, h);
  const s = Math.min(w / 2, (h - 22) / 2) / 3.2;
  const cx = w / 2, cy = 22 + (h - 22) / 2;
  const X = q => cx + q[0] * s * (F.rx / F.ry), Y = q => cy - q[1] * s;
  ctx.font = '600 10px "DM Sans", sans-serif';
  ctx.fillStyle = '#c9d8d0'; ctx.textAlign = 'left';
  ctx.fillText(T.title, 6, 13);
  // Landmarks around the fossa, clamped inside the map.
  ctx.textAlign = 'center';
  for (const [k, p] of Object.entries(landmarks)) {
    if (!p) continue;
    const q = toFossa(F, p), l = Math.hypot(...q);
    const k2 = l > 2.8 ? 2.8 / l : 1;
    const qq = [q[0] * k2, q[1] * k2];
    ctx.fillStyle = LANDMARK_COLORS[k];
    ctx.beginPath(); ctx.arc(X(qq), Y(qq), 3, 0, Math.PI * 2); ctx.fill();
    ctx.font = '600 9px "DM Sans", sans-serif';
    ctx.fillText(T[k], X(qq), Y(qq) - 6);
  }
  // Sectors.
  const crossed = new Set(cut?.sectors || []);
  FOSSA_SECTORS.forEach((k, i) => {
    const a0 = ((i * 60 - 30) * Math.PI) / 180, a1 = ((i * 60 + 30) * Math.PI) / 180;
    ctx.beginPath(); ctx.moveTo(X([0, 0]), Y([0, 0]));
    for (let t = 0; t <= 12; t++) { const a = a0 + ((a1 - a0) * t) / 12; ctx.lineTo(X([Math.sin(a), Math.cos(a)]), Y([Math.sin(a), Math.cos(a)])); }
    ctx.closePath();
    ctx.fillStyle = crossed.has(k) ? 'rgba(255, 217, 102, 0.55)' : 'rgba(244, 227, 180, 0.16)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(244, 227, 180, 0.6)'; ctx.lineWidth = 1; ctx.stroke();
    const am = (i * 60 * Math.PI) / 180, lab = [Math.sin(am) * 0.66, Math.cos(am) * 0.66];
    ctx.font = crossed.has(k) ? '700 10px "DM Sans", sans-serif' : '9px "DM Sans", sans-serif';
    ctx.fillStyle = crossed.has(k) ? '#ffffff' : '#b9c8bf';
    ctx.fillText(k, X(lab), Y(lab) + 3);
  });
  // Orientation.
  ctx.font = '8px "DM Sans", sans-serif'; ctx.fillStyle = '#7f9488'; ctx.textAlign = 'left';
  ctx.fillText(`↑ ${T.sup}  → ${T.ant}`, 6, h - 6);
  // Cut line.
  if (cut?.line) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 18, w, h - 18); ctx.clip();
    ctx.strokeStyle = '#39e8ad'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(X(cut.line[0]), Y(cut.line[0])); ctx.lineTo(X(cut.line[1]), Y(cut.line[1])); ctx.stroke();
    ctx.restore();
  } else {
    ctx.textAlign = 'right'; ctx.fillText(T.none, w - 6, h - 6);
  }
}

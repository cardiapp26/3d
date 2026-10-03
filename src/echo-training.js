import { clipToSector } from './echo-renderer.js';

/*
 * Explainable feedback for "find the view" (report section 4, and
 * research/TTE_TEE_IYILESTIRME_RAPORU.md): not probe angle alone, but which
 * structures are in the sector, which should not be, whether the true apex
 * is in the plane and inside the image (apical views), the bicaval
 * relations (both caval entries and the atrial septum) and, for the
 * mid-oesophageal mitral views, how the plane crosses the mitral annulus.
 * These are the model's starting criteria, teaching values without expert
 * calibration; the wording says so and never claims a clinical view.
 */
export const VISIBLE_LENGTH = 0.25;       // structure counts as shown with this much contour in the sector (about 8 mm)
export const FORESHORTENING_RATIO = 0.9;  // LV length inside the image / measured LV length
export const APEX_OFF_PLANE = 0.15;       // apex farther than this from the plane: the cut misses the apex
export const CAVAL_OFF_PLANE = 0.2;       // IVC ostium farther than this from the plane: not in the bicaval cut
export const SEPTUM_GAP = 0.2;            // LA and RA contours this close in the image: the atrial septum is in the cut
export const MITRAL_CENTRE_OFF = 0.5;     // plane within this share of the annulus radius from its centre
export const OSTIUM_GAP = 0.15;           // a vein contour this close to the LA contour in the image: its ostium is in the cut
export const LANDMARK_OFF_PLANE = 0.2;    // a landmark point (fossa) farther than this from the plane is not in the cut
/** Structure groups: a group counts as shown when any member is. */
export const STRUCTURE_GROUPS = Object.freeze({ pv: ['lspv', 'lipv', 'rspv', 'ripv'] });

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = v => { const n = Math.hypot(...v) || 1; return v.map(x => x / n); };

/** Contour runs of each structure inside the sector. */
export function visibleRuns(section, sectorAngle, depth) {
  const out = {};
  for (const c of section.contours) for (const run of clipToSector(c.points, sectorAngle, depth)) (out[c.id] ||= []).push(run);
  return out;
}

/** Contour length of each structure inside the sector (groups summed from their members). */
export function visibleLengths(section, sectorAngle, depth) {
  const out = {};
  for (const [id, runs] of Object.entries(visibleRuns(section, sectorAngle, depth))) {
    out[id] = runs.reduce((sum, run) => { for (let i = 1; i < run.length; i++) sum += Math.hypot(run[i][0] - run[i - 1][0], run[i][1] - run[i - 1][1]); return sum; }, 0);
  }
  for (const [group, members] of Object.entries(STRUCTURE_GROUPS)) {
    const total = members.reduce((sum, id) => sum + (out[id] || 0), 0);
    if (total) out[group] = total;
  }
  return out;
}

const runsOf = (runs, id) => (STRUCTURE_GROUPS[id] || [id]).flatMap(m => runs[m] || []);

/** Smallest image distance between the visible contours of two structures (Infinity if one is absent). */
export function contourGap(runs, a, b) {
  const pa = runsOf(runs, a).flat(), pb = runsOf(runs, b).flat();
  let best = Infinity;
  for (const p of pa) for (const q of pb) best = Math.min(best, Math.hypot(p[0] - q[0], p[1] - q[1]));
  return best;
}

/** Median image depth (distance from the transducer) of a structure's visible contour. */
export function contourDepth(runs, id) {
  const r = runsOf(runs, id).flat().map(p => Math.hypot(p[0], p[1])).sort((x, y) => x - y);
  return r.length ? r[Math.floor(r.length / 2)] : null;
}

/** A world point in image coordinates, its distance from the plane and whether the image shows it. */
export function imagePoint(point, frame, sectorAngle, depth) {
  const d = sub(point, frame.origin);
  const x = dot(d, frame.lateral), y = dot(d, frame.beam), off = Math.abs(dot(d, frame.normal));
  const r = Math.hypot(x, y), angle = Math.atan2(x, y);
  return { x, y, off, beyondDepth: r > depth, outsideAngle: y <= 0 || Math.abs(angle) > sectorAngle / 2 };
}

/**
 * Apical checks: the true apex in the plane, the apex inside the image (depth,
 * sector) and the LV length inside the image against the measured length.
 * Only the part of the LV that the image shows counts (a clipped apex fails).
 */
export function foreshortening(section, frame, anatomy, sectorAngle = Math.PI, depth = Infinity) {
  const mv = imagePoint(anatomy.mv.center, frame, sectorAngle, depth);
  const apex = imagePoint(anatomy.apex, frame, sectorAngle, depth);
  let reach = 0;
  for (const run of visibleRuns(section, sectorAngle, depth).lv || []) for (const p of run) reach = Math.max(reach, Math.hypot(p[0] - mv.x, p[1] - mv.y));
  const ratio = reach / anatomy.lvLength;
  const inPlane = apex.off <= APEX_OFF_PLANE;
  const inImage = !apex.beyondDepth && !apex.outsideAngle;
  return { ratio, apexOffPlane: apex.off, inPlane, inImage, beyondDepth: apex.beyondDepth, outsideAngle: apex.outsideAngle, ok: inPlane && inImage && ratio >= FORESHORTENING_RATIO };
}

// Closest approach of two sets of polylines (point to segment, both ways).
function pointSegment(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len)) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
function runGap(runsA, runsB) {
  let gap = Infinity;
  const pass = (from, to) => { for (const run of from) for (const p of run) for (const other of to) for (let i = 1; i < other.length; i++) gap = Math.min(gap, pointSegment(p, other[i - 1], other[i])); };
  pass(runsA, runsB); pass(runsB, runsA);
  return gap;
}

/** Bicaval relations: the IVC ostium (estimated landmark) in the cut and image; the atrial septum (LA and RA adjacent). */
export function bicaval(section, frame, anatomy, sectorAngle, depth) {
  const ivc = imagePoint(anatomy.ivc, frame, sectorAngle, depth);
  const runs = visibleRuns(section, sectorAngle, depth);
  const gap = runGap(runs.la || [], runs.ra || []);
  const ivcOk = ivc.off <= CAVAL_OFF_PLANE && !ivc.beyondDepth && !ivc.outsideAngle;
  return { ivcOk, ivcOff: ivc.off, septumOk: gap <= SEPTUM_GAP, septumGap: gap, ok: ivcOk && gap <= SEPTUM_GAP };
}

/**
 * How the plane crosses the mitral annulus: the angle (degrees, 0..90) between
 * the chord of the cut and the commissural axis (perpendicular, in the
 * annulus plane, to the direction of the aortic valve). About 0 in the
 * commissural view, larger in the two-chamber view, near 90 in the long axis.
 */
export function mitralChord(frame, anatomy) {
  const c = anatomy.mv.center, nm = unit(anatomy.mv.normal), r = anatomy.mv.radius;
  const toAorta = sub(anatomy.av.center, c);
  const aortic = unit(sub(toAorta, nm.map(v => v * dot(toAorta, nm))));
  const commissural = unit(cross(nm, aortic));
  const chord = unit(cross(frame.normal, nm));
  const angle = (Math.acos(Math.min(1, Math.abs(dot(chord, commissural)))) * 180) / Math.PI;
  const centred = Math.abs(dot(sub(c, frame.origin), frame.normal)) <= MITRAL_CENTRE_OFF * r;
  return { angle, centred };
}

/**
 * Layout criteria of a view (all optional):
 *   relations: [{ a, b, max }] two contours meeting in the image (a vein ostium on the LA, RA and LA across the septum);
 *   order: [[near, far]] near field before far field (median image depth);
 *   side: { id: 'left' | 'right' } a structure's median position on the image (screen right = +lateral);
 *   landmarks: [id] measured points (fossa ovalis) in the plane and inside the image; unknown when the atlas lacks them.
 */
export function layoutChecks(section, view, ctx) {
  const needsRuns = view.relations || view.order || view.side;
  const runs = needsRuns ? visibleRuns(section, ctx.sectorAngle, ctx.depth) : null;
  const relations = (view.relations || []).map(r => { const gap = contourGap(runs, r.a, r.b); return { ...r, gap, ok: gap <= (r.max ?? OSTIUM_GAP) }; });
  const order = (view.order || []).map(([near, far]) => { const a = contourDepth(runs, near), b = contourDepth(runs, far); return { near, far, ok: a != null && b != null && a < b }; });
  const sides = Object.entries(view.side || {}).map(([id, side]) => {
    const xs = runsOf(runs, id).flat().map(p => p[0]).sort((u, v) => u - v);
    const mid = xs.length ? xs[Math.floor(xs.length / 2)] : null;
    return { id, side, ok: mid != null && (side === 'right' ? mid > 0 : mid < 0) };
  });
  const landmarks = (view.landmarks || []).map(id => {
    const point = ctx.anatomy?.[id]?.center;
    if (!point) return { id, ok: false, unknown: true };
    const p = imagePoint(point, ctx.frame, ctx.sectorAngle, ctx.depth);
    return { id, ok: p.off <= LANDMARK_OFF_PLANE && !p.outsideAngle && !p.beyondDepth, off: p.off };
  });
  return { relations, order, sides, landmarks };
}

/**
 * @param {{ contours: object[] }} section
 * @param {{ required: string[], avoid: (string | { id: string, max: number })[], apical?: boolean, bicaval?: boolean, mitralChord?: [number, number] }} view
 * @param {{ sectorAngle: number, depth: number, frame: object, anatomy: object, label: (id: string) => string, lang: 'tr'|'en' }} ctx
 */
export function evaluateView(section, view, ctx) {
  const lengths = visibleLengths(section, ctx.sectorAngle, ctx.depth);
  // A view may ask a target to be recognisable, not just touched: minLength per structure.
  const shown = id => (lengths[id] || 0) >= (view.minLength?.[id] ?? VISIBLE_LENGTH);
  const missing = view.required.filter(id => !shown(id));
  const { relations, order, sides, landmarks } = layoutChecks(section, view, ctx);
  const optional = (view.optional || []).map(id => ({ id, shown: shown(id) }));
  // An avoided structure may carry its own tolerance: { id, max } (contour length allowed in the sector).
  const wrong = view.avoid.filter(a => typeof a === 'string' ? shown(a) : (lengths[a.id] || 0) > a.max).map(a => a.id || a);
  const fs = view.apical ? foreshortening(section, ctx.frame, ctx.anatomy, ctx.sectorAngle, ctx.depth) : null;
  const caval = view.bicaval ? bicaval(section, ctx.frame, ctx.anatomy, ctx.sectorAngle, ctx.depth) : null;
  const chord = view.mitralChord ? mitralChord(ctx.frame, ctx.anatomy) : null;
  const chordOk = !chord || (chord.centred && chord.angle >= view.mitralChord[0] && chord.angle <= view.mitralChord[1]);
  const achieved = !missing.length && !wrong.length && (!fs || fs.ok) && (!caval || caval.ok) && chordOk
    && relations.every(r => r.ok) && order.every(o => o.ok) && sides.every(x => x.ok) && landmarks.every(l => l.ok);
  const tr = ctx.lang !== 'en';
  const names = ids => ids.map(ctx.label).join(', ');
  const messages = [];
  if (achieved) messages.push(tr ? 'Modelin başlangıç ölçütleri karşılandı (diyastol sonu geometrisi).' : 'The model’s starting criteria are met (end-diastolic geometry).');
  if (missing.length) messages.push(tr ? `Model ölçütüne göre eksik: ${names(missing)}.` : `Missing by the model’s criteria: ${names(missing)}.`);
  if (wrong.length) messages.push(tr
    ? `Model ölçütüne göre kesitte beklenmeyen: ${names(wrong)}.${wrong.includes('aorta') && view.apical ? ' Aort çıkış yolu görünüyorsa kesit öne kaymış olabilir (beş boşluk); tilt ile arkaya alın.' : ''}`
    : `Not expected in the cut by the model’s criteria: ${names(wrong)}.${wrong.includes('aorta') && view.apical ? ' If the outflow tract shows, the plane may be too anterior (five-chamber); tilt it back.' : ''}`);
  if (fs && !fs.inPlane) messages.push(tr
    ? `Kesit gerçek apeksten geçmiyor (apeks düzlemden ${fs.apexOffPlane.toFixed(2)} birim).`
    : `The plane misses the true apex (apex ${fs.apexOffPlane.toFixed(2)} units off the plane).`);
  else if (fs && !fs.inImage) messages.push(tr
    ? (fs.beyondDepth ? 'Apeks düzlemde ama görüntü derinliğinin dışında: derinliği artırın.' : 'Apeks düzlemde ama sektörün dışında: sektörü genişletin veya probu apekse yöneltin.')
    : (fs.beyondDepth ? 'The apex is in the plane but beyond the image depth: increase the depth.' : 'The apex is in the plane but outside the sector: widen the sector or aim at the apex.'));
  else if (fs && !fs.ok) messages.push(tr
    ? `Görüntüdeki LV uzunluğu ölçülen uzunluğun %${Math.round(fs.ratio * 100)}'i: LV kısalmış olabilir.`
    : `The LV length in the image is ${Math.round(fs.ratio * 100)}% of the measured length: the LV may be foreshortened.`);
  if (caval && !caval.ivcOk) messages.push(tr
    ? 'İVK ağzı kesitte veya görüntüde değil (atlasta İVK mesh’i yok; ağız kestirilen bir noktadır). Tam bikaval görünüm sayılmaz.'
    : 'The IVC orifice is not in the cut or the image (the atlas has no IVC mesh; the orifice is an estimated point). Not a full bicaval view.');
  if (caval && !caval.septumOk) messages.push(tr ? 'İnteratriyal septum (LA ile RA komşuluğu) kesitte görünmüyor.' : 'The interatrial septum (LA next to RA) is not in the cut.');
  if (chord && !chordOk) messages.push(tr
    ? `Mitral kesit yönü bu görünüme uymuyor: komissür eksenine açı ${Math.round(chord.angle)}° (model aralığı ${view.mitralChord[0]}–${view.mitralChord[1]}°)${chord.centred ? '' : ', düzlem anulus merkezinden uzak'}.`
    : `The mitral cut does not fit this view: ${Math.round(chord.angle)}° to the commissural axis (model range ${view.mitralChord[0]}–${view.mitralChord[1]}°)${chord.centred ? '' : ', plane away from the annulus centre'}.`);
  for (const r of relations.filter(x => !x.ok)) messages.push(tr
    ? `${names([r.a])} ile ${names([r.b])} görüntüde birleşmiyor${r.note ? ` (${r.note.tr})` : ''}.`
    : `${names([r.a])} and ${names([r.b])} do not meet in the image${r.note ? ` (${r.note.en})` : ''}.`);
  for (const o of order.filter(x => !x.ok)) messages.push(tr
    ? `${names([o.near])} yakın alanda, ${names([o.far])} uzak alanda olmalı: kesit yönü uymuyor.`
    : `${names([o.near])} should be near field and ${names([o.far])} far field: the plane faces the wrong way.`);
  for (const x of sides.filter(y => !y.ok)) messages.push(tr
    ? `${names([x.id])} görüntünün ${x.side === 'right' ? 'sağında' : 'solunda'} olmalı.`
    : `${names([x.id])} should be on the image ${x.side}.`);
  for (const l of landmarks.filter(x => !x.ok)) messages.push(l.unknown
    ? (tr ? `${names([l.id])} atlasta ölçülemedi: bu ölçüt değerlendirilemedi, başarı sayılmaz.` : `${names([l.id])} could not be measured on the atlas: this criterion is not assessed and does not count as met.`)
    : (tr ? `${names([l.id])} kesitte veya görüntüde değil (düzlemden ${l.off.toFixed(2)} birim).` : `${names([l.id])} is not in the cut or the image (${l.off.toFixed(2)} units off the plane).`));
  const extra = optional.filter(o => o.shown).map(o => o.id);
  if (extra.length) messages.push(tr ? `Yardımcı (zorunlu değil) yapılar da görünüyor: ${names(extra)}.` : `Supporting (not required) structures also shown: ${names(extra)}.`);
  return { achieved, missing, wrong, foreshortening: fs, bicaval: caval, mitralChord: chord, relations, order, sides, landmarks, optional, lengths, messages };
}

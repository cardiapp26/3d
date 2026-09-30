import { clipToSector } from './echo-renderer.js';

/*
 * Explainable feedback for "find the view" (report section 4): not probe
 * angle alone, but which structures are in the sector, which should not be,
 * and whether the apex is foreshortened in apical views. Thresholds are
 * teaching values without expert calibration; the feedback says so.
 */
export const VISIBLE_LENGTH = 0.25;       // structure counts as shown with this much contour in the sector (about 8 mm)
export const FORESHORTENING_RATIO = 0.9;  // LV length in the image / measured LV length
export const APEX_OFF_PLANE = 0.15;       // apex farther than this from the plane: off-axis cut

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/** Contour length of each structure inside the sector. */
export function visibleLengths(section, sectorAngle, depth) {
  const out = {};
  for (const c of section.contours) {
    for (const run of clipToSector(c.points, sectorAngle, depth)) {
      let length = 0;
      for (let i = 1; i < run.length; i++) length += Math.hypot(run[i][0] - run[i - 1][0], run[i][1] - run[i - 1][1]);
      out[c.id] = (out[c.id] || 0) + length;
    }
  }
  return out;
}

/**
 * LV foreshortening in an apical image: the longest LV extent from the mitral
 * centre within the image, against the measured apex-to-mitral length.
 */
export function foreshortening(section, frame, anatomy) {
  const mv = sub(anatomy.mv.center, frame.origin);
  const m = [dot(mv, frame.lateral), dot(mv, frame.beam)];
  let reach = 0;
  for (const c of section.contours) if (c.id === 'lv') for (const p of c.points) reach = Math.max(reach, Math.hypot(p[0] - m[0], p[1] - m[1]));
  const apexOffPlane = Math.abs(dot(sub(anatomy.apex, frame.origin), frame.normal));
  const ratio = reach / anatomy.lvLength;
  return { ratio, apexOffPlane, ok: ratio >= FORESHORTENING_RATIO && apexOffPlane <= APEX_OFF_PLANE };
}

/**
 * @param {{ contours: object[] }} section
 * @param {{ required: string[], avoid: (string | { id: string, max: number })[], apical?: boolean }} view
 * @param {{ sectorAngle: number, depth: number, frame: object, anatomy: object, label: (id: string) => string, lang: 'tr'|'en' }} ctx
 */
export function evaluateView(section, view, ctx) {
  const lengths = visibleLengths(section, ctx.sectorAngle, ctx.depth);
  const shown = id => (lengths[id] || 0) >= VISIBLE_LENGTH;
  const missing = view.required.filter(id => !shown(id));
  // An avoided structure may carry its own tolerance: { id, max } (contour length allowed in the sector).
  const wrong = view.avoid.filter(a => typeof a === 'string' ? shown(a) : (lengths[a.id] || 0) > a.max).map(a => a.id || a);
  const fs = view.apical ? foreshortening(section, ctx.frame, ctx.anatomy) : null;
  const achieved = !missing.length && !wrong.length && (!fs || fs.ok);
  const tr = ctx.lang !== 'en';
  const names = ids => ids.map(ctx.label).join(', ');
  const messages = [];
  if (achieved) messages.push(tr ? 'Görünüm elde edildi: gerekli yapılar kesitte, istenmeyen yapı yok.' : 'View obtained: the required structures are in the section, no unwanted structure.');
  if (missing.length) messages.push(tr ? `Eksik: ${names(missing)}.` : `Missing: ${names(missing)}.`);
  if (wrong.length) messages.push(tr ? `Bu görünümde olmamalı: ${names(wrong)}.${wrong.includes('aorta') && view.apical ? ' Aort çıkış yolu görünüyorsa kesit öne kaymıştır (beş boşluk); tilt ile arkaya alın.' : ''}` : `Should not be in this view: ${names(wrong)}.${wrong.includes('aorta') && view.apical ? ' If the outflow tract shows, the plane is too anterior (five-chamber); tilt it back.' : ''}`);
  if (fs && !fs.ok) messages.push(tr
    ? `LV kısalmış olabilir (görünen uzunluk %${Math.round(fs.ratio * 100)}, apeks düzlemden ${fs.apexOffPlane.toFixed(2)} birim): kesit gerçek apeksten geçmiyor.`
    : `The LV may be foreshortened (visible length ${Math.round(fs.ratio * 100)}%, apex ${fs.apexOffPlane.toFixed(2)} units off the plane): the plane misses the true apex.`);
  messages.push(tr ? 'Eşikler uzman kalibrasyonu yapılmamış öğretim değerleridir.' : 'Thresholds are teaching values without expert calibration.');
  return { achieved, missing, wrong, foreshortening: fs, lengths, messages };
}

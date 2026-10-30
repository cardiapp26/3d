// Real cine CMR cases for the cardiac MR studio: five ACDC training cases (Bernard et al.,
// IEEE TMI 2018; CC BY-NC-SA 4.0, non-commercial use) prepared by
// scripts/cmr/prepare-acdc-case.py into public/cmr-data/<case>/. Measurements come from the
// expert ED/ES labels; no DOM here so the node tests can use it.

const w = (tr, en) => Object.freeze({ tr, en });

/** Label ids in labels.mrz (ACDC convention). */
export const CMR_LABEL = Object.freeze({ rv: 1, myo: 2, lv: 3 });

export const CMR_LABEL_STYLE = Object.freeze({
  [CMR_LABEL.rv]: { color: [59, 130, 246], name: w('RV boşluğu', 'RV cavity') },
  [CMR_LABEL.myo]: { color: [245, 158, 11], name: w('LV miyokardı', 'LV myocardium') },
  [CMR_LABEL.lv]: { color: [239, 68, 68], name: w('LV boşluğu', 'LV cavity') }
});

/** The five cases, one per ACDC group, with what to look at. */
export const CMR_CASES = Object.freeze([
  {
    id: 'patient061', group: 'NOR', short: w('Normal', 'Normal'),
    name: w('Normal kalp', 'Normal heart'),
    points: w(
      ['LV ve RV boyutu ve EF normal; kalınlaşma bütün segmentlerde benzer.', 'Sistolde endokard her yönde içe doğru hareket eder, miyokard yaklaşık %40 veya daha fazla kalınlaşır.', 'Bazal kesitlerde LV çıkış yolu ve mitral düzlemi görülebilir; hacim ölçümünde bazal kesit seçimi en büyük hata kaynağıdır.'],
      ['LV and RV size and EF are normal; thickening is similar in every segment.', 'In systole the endocardium moves inward in every direction and the myocardium thickens by about 40% or more.', 'The LV outflow tract and mitral plane can appear on basal slices; the choice of the basal slice is the largest source of volume error.']
    )
  },
  {
    id: 'patient012', group: 'DCM', short: w('DKMP', 'DCM'),
    name: w('Dilate kardiyomiyopati', 'Dilated cardiomyopathy'),
    points: w(
      ['LV belirgin dilate, duvar ince veya normal; kalınlaşma bütün segmentlerde azalmış (global hipokinezi).', 'ACDC ölçütü: LVEDVi > 100 mL/m² ve LVEF < %40.', 'Etiyoloji için sinema yetmez: iskemik ve iskemik olmayan ayrımı LGE paterniyle yapılır (orta duvar mı, subendokardiyal mi).'],
      ['The LV is clearly dilated with a thin or normal wall; thickening is reduced in every segment (global hypokinesis).', 'ACDC criterion: LVEDVi > 100 mL/m² and LVEF < 40%.', 'Cine alone cannot give the cause: ischaemic versus non-ischaemic is decided by the LGE pattern (mid-wall or subendocardial).']
    )
  },
  {
    id: 'patient034', group: 'HCM', short: w('HKMP', 'HCM'),
    name: w('Hipertrofik kardiyomiyopati', 'Hypertrophic cardiomyopathy'),
    points: w(
      ['Diyastol sonunda (ED) duvar kalınlığı birçok segmentte 15 mm üzerinde; LV boşluğu küçük, EF normal veya yüksek.', 'ACDC ölçütü: LV kütlesi > 110 g/m², birden fazla segmentte diyastolik kalınlık > 15 mm ve normal EF.', 'Duvar kalınlığını kısa eksende, diyastol sonu karesinde ve papiller kası ile RV trabekülünü dışarıda bırakarak ölçün.'],
      ['At end-diastole (ED) the wall is thicker than 15 mm in several segments; the LV cavity is small and EF is normal or high.', 'ACDC criterion: LV mass > 110 g/m², diastolic thickness > 15 mm in several segments and normal EF.', 'Measure wall thickness on short-axis, on the end-diastolic frame, excluding papillary muscles and RV trabeculae.']
    )
  },
  {
    id: 'patient060', group: 'MINF', short: w('Eski MI', 'Prior MI'),
    name: w('Geçirilmiş miyokard enfarktüsü', 'Previous myocardial infarction'),
    points: w(
      ['EF düşük ve hareket bozukluğu bölgesel: bazı segmentler kalınlaşmazken diğerleri kalınlaşmaya devam eder.', 'ACDC ölçütü: LVEF < %40 ve birden fazla segmentte anormal kontraksiyon.', 'Enfarkt alanı çoğu zaman incelmiş ve hipokinetik veya akinetiktir; canlılık ve transmürallik için LGE gerekir.'],
      ['EF is low and the wall-motion abnormality is regional: some segments do not thicken while others still do.', 'ACDC criterion: LVEF < 40% and abnormal contraction in several segments.', 'The infarct zone is often thinned and hypokinetic or akinetic; viability and transmurality need LGE.']
    )
  },
  {
    id: 'patient085', group: 'RV', short: w('Anormal RV', 'Abnormal RV'),
    name: w('Anormal sağ ventrikül', 'Abnormal right ventricle'),
    points: w(
      ['RV dilate ve sistolik fonksiyonu azalmış, LV normal. Kısa eksende RV, LV\'den büyük görünür.', 'ACDC ölçütü: RVEDVi > 110 mL/m² veya RVEF < %40. Bu grupta ARVC, pulmoner hipertansiyon ve şant gibi farklı nedenler vardır.', 'RV hacmi kısa eksen yığınında bazal kesitlerde zor ölçülür (triküspit düzlemi); çoğu merkez aksiyel yığın da kullanır.'],
      ['The RV is dilated with reduced systolic function and a normal LV. On short-axis the RV looks larger than the LV.', 'ACDC criterion: RVEDVi > 110 mL/m² or RVEF < 40%. The group mixes causes such as ARVC, pulmonary hypertension and shunts.', 'RV volume is hard to measure on basal short-axis slices (tricuspid plane); many centres also use an axial stack.']
    )
  }
]);

export const CMR_GROUP_NAME = Object.freeze(Object.fromEntries(CMR_CASES.map(c => [c.group, c.name])));

/** Thresholds of this viewer (ACDC group definitions plus the regional thickening cut-offs). */
export const CMR_THRESHOLDS = Object.freeze({
  dcmLvedvi: 100, lowEf: 40, hcmMassi: 110, hcmWallMm: 15, normalEf: 50,
  rvEdvi: 110, rvEf: 40, myoDensity: 1.05,
  thickeningReduced: 30, thickeningAbsent: 10, sectors: 6, rays: 72
});

/** Mosteller body-surface area (m²). */
export function bsaMosteller(heightCm, weightKg) {
  return Math.sqrt((heightCm * weightKg) / 3600);
}

/** Voxel counts per label for one phase volume ([slice][row][col]). */
function countLabels(labels, offset, n) {
  const c = [0, 0, 0, 0];
  for (let i = offset; i < offset + n; i++) c[labels[i]]++;
  return c;
}

/** Centroid (row, col) of one label in one slice, or null. */
function sliceCentroid(labels, base, rows, cols, id) {
  let n = 0, sr = 0, sc = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (labels[base + r * cols + c] === id) { n++; sr += r; sc += c; }
  }
  return n ? { r: sr / n, c: sc / n, n } : null;
}

/**
 * Myocardial thickness along rays from the LV cavity centre of one slice: the first run of
 * myocardium met on each ray. Returns mm per ray, or null when the ring is not closed.
 */
export function rayThickness(labels, base, rows, cols, spacingMm, rays = CMR_THRESHOLDS.rays) {
  const centre = sliceCentroid(labels, base, rows, cols, CMR_LABEL.lv);
  if (!centre || centre.n < 8) return null;
  const out = new Float32Array(rays);
  let hits = 0;
  const step = 0.25;
  for (let k = 0; k < rays; k++) {
    const a = (2 * Math.PI * k) / rays, dr = Math.sin(a), dc = Math.cos(a);
    let enter = -1, exit = -1;
    for (let t = 0; t < Math.max(rows, cols); t += step) {
      const r = Math.round(centre.r + dr * t), c = Math.round(centre.c + dc * t);
      if (r < 0 || c < 0 || r >= rows || c >= cols) break;
      const isMyo = labels[base + r * cols + c] === CMR_LABEL.myo;
      if (isMyo && enter < 0) enter = t;
      if (!isMyo && enter >= 0) { exit = t; break; }
    }
    if (enter >= 0 && exit > enter) { out[k] = (exit - enter) * spacingMm; hits++; } else out[k] = NaN;
  }
  return hits >= rays * 0.9 ? { mm: out, centre } : null;
}

/** Angle (screen radians, atan2 of row, col) from the LV centre towards the RV over the ED volume. */
function septalAngle(labels, dims) {
  const { rows, cols, slices } = dims;
  let n = 0, rv = { r: 0, c: 0 }, lv = { r: 0, c: 0 }, nl = 0;
  for (let i = 0; i < slices * rows * cols; i++) {
    const l = labels[i], r = Math.floor(i / cols) % rows, c = i % cols;
    if (l === CMR_LABEL.rv) { n++; rv.r += r; rv.c += c; }
    if (l === CMR_LABEL.lv) { nl++; lv.r += r; lv.c += c; }
  }
  if (!n || !nl) return Math.PI;
  return Math.atan2(rv.r / n - lv.r / nl, rv.c / n - lv.c / nl);
}

/** Mean of finite values. */
function mean(values) {
  let s = 0, n = 0;
  for (const v of values) if (Number.isFinite(v)) { s += v; n++; }
  return n ? s / n : NaN;
}

/**
 * Per-slice sectors (six, sector 0 centred on the septum, going clockwise on screen) with ED
 * thickness and ED->ES systolic thickening.
 */
export function sliceSectors(labels, dims, spacingMm, slice, septum) {
  const { rows, cols, slices } = dims;
  const n = rows * cols, { sectors, rays } = CMR_THRESHOLDS;
  const ed = rayThickness(labels, slice * n, rows, cols, spacingMm.row, rays);
  const es = rayThickness(labels, (slices + slice) * n, rows, cols, spacingMm.row, rays);
  if (!ed) return null;
  const per = rays / sectors;
  const out = [];
  for (let s = 0; s < sectors; s++) {
    const edVals = [], esVals = [];
    for (let j = 0; j < per; j++) {
      // Ray angle of sector s, offset so that sector 0 is centred on the septum.
      const a = septum + ((s * per + j - per / 2 + 0.5) * 2 * Math.PI) / rays;
      const k = ((Math.round((a * rays) / (2 * Math.PI)) % rays) + rays) % rays;
      edVals.push(ed.mm[k]);
      if (es) esVals.push(es.mm[k]);
    }
    const edMm = mean(edVals), esMm = es ? mean(esVals) : NaN;
    out.push({ sector: s, edMm, esMm, thickeningPct: Number.isFinite(esMm) ? ((esMm - edMm) / edMm) * 100 : NaN });
  }
  return out;
}

/**
 * Volumes, function, mass, wall thickness and regional thickening from the expert labels
 * (labels: [ED, ES][slice][row][col]).
 */
export function cmrMetrics(labels, meta) {
  const { rows, cols, slices } = meta.dims;
  const sp = meta.spacingMm;
  const n = rows * cols * slices;
  const voxelMl = (sp.row * sp.col * sp.slice) / 1000;
  const ed = countLabels(labels, 0, n), es = countLabels(labels, n, n);
  const bsa = bsaMosteller(meta.heightCm, meta.weightKg);
  const lvedv = ed[CMR_LABEL.lv] * voxelMl, lvesv = es[CMR_LABEL.lv] * voxelMl;
  const rvedv = ed[CMR_LABEL.rv] * voxelMl, rvesv = es[CMR_LABEL.rv] * voxelMl;
  const mass = ed[CMR_LABEL.myo] * voxelMl * CMR_THRESHOLDS.myoDensity;
  const septum = septalAngle(labels, meta.dims);
  const bySlice = [];
  for (let z = 0; z < slices; z++) bySlice.push(sliceSectors(labels, meta.dims, sp, z, septum));
  const valid = bySlice.flatMap((s, z) => (s ? s.map(x => ({ ...x, slice: z })) : []));
  const thickSegments = valid.filter(x => x.edMm > CMR_THRESHOLDS.hcmWallMm).length;
  const reduced = valid.filter(x => x.thickeningPct < CMR_THRESHOLDS.thickeningReduced).length;
  const maxWall = valid.reduce((m, x) => Math.max(m, x.edMm), 0);
  return {
    bsa, septum,
    lv: { edv: lvedv, esv: lvesv, sv: lvedv - lvesv, ef: (100 * (lvedv - lvesv)) / lvedv, edvi: lvedv / bsa, esvi: lvesv / bsa, mass, massi: mass / bsa },
    rv: { edv: rvedv, esv: rvesv, sv: rvedv - rvesv, ef: (100 * (rvedv - rvesv)) / rvedv, edvi: rvedv / bsa },
    wall: { maxMm: maxWall, segmentsOver15: thickSegments, segmentsReduced: reduced, segmentsMeasured: valid.length },
    bySlice
  };
}

/**
 * Which ACDC group definitions the measurements meet: true, false, or 'partial' for prior MI,
 * whose regional criterion (several segments with abnormal contraction) is read visually.
 */
export function acdcCriteria(m) {
  const t = CMR_THRESHOLDS;
  return [
    { group: 'DCM', met: m.lv.edvi > t.dcmLvedvi && m.lv.ef < t.lowEf, text: w(`LVEDVi > ${t.dcmLvedvi} mL/m² ve LVEF < %${t.lowEf}`, `LVEDVi > ${t.dcmLvedvi} mL/m² and LVEF < ${t.lowEf}%`) },
    { group: 'HCM', met: m.lv.massi > t.hcmMassi && m.wall.segmentsOver15 >= 2 && m.lv.ef >= t.normalEf, text: w(`LV kütlesi > ${t.hcmMassi} g/m², ≥2 segment > ${t.hcmWallMm} mm, EF ≥ %${t.normalEf}`, `LV mass > ${t.hcmMassi} g/m², ≥2 segments > ${t.hcmWallMm} mm, EF ≥ ${t.normalEf}%`) },
    { group: 'MINF', met: m.lv.ef < t.lowEf ? 'partial' : false, text: w(`LVEF < %${t.lowEf} ve birden fazla segmentte bölgesel hareket bozukluğu (görsel)`, `LVEF < ${t.lowEf}% and regional wall-motion abnormality in several segments (visual)`) },
    { group: 'RV', met: m.rv.edvi > t.rvEdvi || m.rv.ef < t.rvEf, text: w(`RVEDVi > ${t.rvEdvi} mL/m² veya RVEF < %${t.rvEf}`, `RVEDVi > ${t.rvEdvi} mL/m² or RVEF < ${t.rvEf}%`) }
  ];
}

async function gunzip(response) {
  if (!response.ok) throw new Error(`${response.url}: HTTP ${response.status}`);
  if (typeof DecompressionStream === 'undefined') throw new Error('DecompressionStream unsupported');
  const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Unpack the WebP sheet (row = slice, column = frame) into [frame][slice][row][col]. */
export function unpackSheet(rgba, dims) {
  const { rows, cols, slices, frames } = dims;
  const W = frames * cols;
  const out = new Uint8Array(frames * slices * rows * cols);
  for (let z = 0; z < slices; z++) for (let r = 0; r < rows; r++) {
    const src = ((z * rows + r) * W) * 4;
    for (let t = 0; t < frames; t++) {
      const dst = ((t * slices + z) * rows + r) * cols;
      const s0 = src + t * cols * 4;
      for (let c = 0; c < cols; c++) out[dst + c] = rgba[s0 + c * 4];
    }
  }
  return out;
}

async function decodeSheet(blob, dims) {
  const W = dims.frames * dims.cols, H = dims.slices * dims.rows;
  const bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  if (bitmap.width !== W || bitmap.height !== H) throw new Error('CMR cine sheet size mismatch');
  const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(W, H) : Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  return unpackSheet(ctx.getImageData(0, 0, W, H).data, dims);
}

/** Fetch and decode one prepared case. */
export async function loadCmrCase(baseUrl, id) {
  const root = `${baseUrl}${id}/`;
  const metaRes = await fetch(`${root}meta.json`);
  if (!metaRes.ok) throw new Error(`meta.json: HTTP ${metaRes.status}`);
  const meta = await metaRes.json();
  const [cine, labels] = await Promise.all([
    fetch(`${root}${meta.sheet.file}`).then(r => { if (!r.ok) throw new Error(`cine: HTTP ${r.status}`); return r.blob(); }).then(b => decodeSheet(b, meta.dims)),
    fetch(`${root}labels.mrz`).then(gunzip)
  ]);
  const { rows, cols, slices } = meta.dims;
  if (labels.length !== 2 * rows * cols * slices) throw new Error('CMR label size mismatch');
  return { meta, cine, labels, metrics: cmrMetrics(labels, meta) };
}

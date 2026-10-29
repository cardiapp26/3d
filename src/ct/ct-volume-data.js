// Real CT case for the cardiac CT studio: one TotalSegmentator case (CC BY 4.0) prepared by
// scripts/ct/prepare-totalseg-case.py into public/ct-data/<case>/. Loading, HU decoding and
// per-structure statistics; no DOM here so the node tests can use it.

const w = (tr, en) => Object.freeze({ tr, en });

export const CT_CASE_ID = 's0019';

/** Label keys (same order as the prepare script) with display names and overlay colours. */
export const CT_LABELS = Object.freeze({
  lv: { name: w('Sol ventrikül', 'Left ventricle'), color: '#ef4444', group: 'heart' },
  rv: { name: w('Sağ ventrikül', 'Right ventricle'), color: '#3b82f6', group: 'heart' },
  la: { name: w('Sol atriyum', 'Left atrium'), color: '#f472b6', group: 'heart' },
  ra: { name: w('Sağ atriyum', 'Right atrium'), color: '#22d3ee', group: 'heart' },
  myocardium: { name: w('LV miyokardı', 'LV myocardium'), color: '#d97706', group: 'heart' },
  aorta: { name: w('Aort', 'Aorta'), color: '#f43f5e', group: 'vessels' },
  'pulmonary-artery': { name: w('Pulmoner arter', 'Pulmonary artery'), color: '#818cf8', group: 'vessels' },
  ivc: { name: w('İnferior vena kava', 'Inferior vena cava'), color: '#38bdf8', group: 'vessels' },
  'lung-rul': { name: w('Sağ akciğer üst lob', 'Right upper lobe'), color: '#4ade80', group: 'lungs' },
  'lung-rml': { name: w('Sağ akciğer orta lob', 'Right middle lobe'), color: '#a3e635', group: 'lungs' },
  'lung-rll': { name: w('Sağ akciğer alt lob', 'Right lower lobe'), color: '#22c55e', group: 'lungs' },
  'lung-lul': { name: w('Sol akciğer üst lob', 'Left upper lobe'), color: '#2dd4bf', group: 'lungs' },
  'lung-lll': { name: w('Sol akciğer alt lob', 'Left lower lobe'), color: '#14b8a6', group: 'lungs' },
  trachea: { name: w('Trakea ve ana bronşlar', 'Trachea and main bronchi'), color: '#fde047', group: 'airway' },
  esophagus: { name: w('Özofagus', 'Esophagus'), color: '#fb923c', group: 'airway' },
  liver: { name: w('Karaciğer (kubbe)', 'Liver (dome)'), color: '#a16207', group: 'other' },
  ribs: { name: w('Kaburgalar', 'Ribs'), color: '#e7e5e4', group: 'bone' },
  vertebrae: { name: w('Torasik omurlar', 'Thoracic vertebrae'), color: '#f5f5f4', group: 'bone' },
  clavicles: { name: w('Klavikulalar', 'Clavicles'), color: '#d6d3d1', group: 'bone' },
  scapulae: { name: w('Skapulalar', 'Scapulae'), color: '#cbd5e1', group: 'bone' }
});

/**
 * Teaching views of this case (voxel indices measured on its labels): slice, cursor, window and
 * slab. Aortic sinus z 78-84 (ascending aorta ends at z 88), PA trunk z 44-72.
 */
export const CT_CASE_VIEWS = Object.freeze([
  { id: 'pa', name: w('PA bifurkasyonu', 'PA bifurcation'), cursor: { x: 127, y: 110, z: 56 }, windowId: 'cta', slabMm: 0, overlay: true },
  { id: 'root', name: w('Aort kökü ve koroner ostiumlar', 'Aortic root and coronary ostia'), cursor: { x: 122, y: 90, z: 82 }, windowId: 'cta', slabMm: 0, overlay: false },
  { id: 'four', name: w('Dört boşluk düzeyi', 'Four-chamber level'), cursor: { x: 140, y: 100, z: 93 }, windowId: 'cta', slabMm: 0, overlay: true },
  { id: 'coronary', name: w('Koroner MIP (10 mm)', 'Coronary MIP (10 mm)'), cursor: { x: 140, y: 100, z: 101 }, windowId: 'cta', slabMm: 10, overlay: false },
  { id: 'lung', name: w('Akciğer penceresi', 'Lung window'), cursor: { x: 70, y: 110, z: 60 }, windowId: 'lung', slabMm: 0, overlay: true }
]);

export const CT_LABEL_GROUPS = Object.freeze([
  { id: 'heart', name: w('Kalp', 'Heart') },
  { id: 'vessels', name: w('Büyük damarlar', 'Great vessels') },
  { id: 'lungs', name: w('Akciğer lobları', 'Lung lobes') },
  { id: 'airway', name: w('Hava yolu ve özofagus', 'Airway and esophagus') },
  { id: 'bone', name: w('Kemik', 'Bone') },
  { id: 'other', name: w('Diğer', 'Other') }
]);

/** Window presets for the real volume (width, level in HU). */
export const CT_REAL_WINDOWS = Object.freeze([
  { id: 'cta', label: w('BTA (W800 L250)', 'CTA (W800 L250)'), width: 800, level: 250 },
  { id: 'mediastinum', label: w('Mediasten (W400 L40)', 'Mediastinum (W400 L40)'), width: 400, level: 40 },
  { id: 'lung', label: w('Akciğer (W1500 L−600)', 'Lung (W1500 L−600)'), width: 1500, level: -600 },
  { id: 'bone', label: w('Kemik (W1800 L400)', 'Bone (W1800 L400)'), width: 1800, level: 400 },
  { id: 'calcium', label: w('Kalsiyum/stent (W1500 L400)', 'Calcium/stent (W1500 L400)'), width: 1500, level: 400 }
]);

/** 256-entry byte -> HU table from the piecewise-linear knots in meta.json. */
export function huTable(knots) {
  const t = new Float32Array(256);
  for (let b = 0; b < 256; b++) {
    let k = 1;
    while (k < knots.length - 1 && b > knots[k][1]) k++;
    const [h0, b0] = knots[k - 1], [h1, b1] = knots[k];
    t[b] = h0 + ((b - b0) / Math.max(1, b1 - b0)) * (h1 - h0);
  }
  return t;
}

/** Byte -> grey (0..255) lookup for a window. */
export function windowTable(hu, width, level) {
  const t = new Uint8ClampedArray(256);
  const lo = level - width / 2;
  for (let b = 0; b < 256; b++) t[b] = Math.round(((hu[b] - lo) / width) * 255);
  return t;
}

/** Per-label voxel count, volume (mL) and centroid (voxel indices). */
export function labelStats(labels, dims, spacingMm, count) {
  const n = new Float64Array(count + 1), sx = new Float64Array(count + 1), sy = new Float64Array(count + 1), sz = new Float64Array(count + 1);
  const { x: X, y: Y } = dims;
  for (let i = 0; i < labels.length; i++) {
    const l = labels[i];
    if (!l) continue;
    n[l]++;
    sx[l] += i % X;
    sy[l] += Math.floor(i / X) % Y;
    sz[l] += Math.floor(i / (X * Y));
  }
  const voxelMl = (spacingMm.x * spacingMm.y * spacingMm.z) / 1000;
  const out = [];
  for (let l = 1; l <= count; l++) {
    out.push({
      id: l,
      voxels: n[l],
      volumeMl: n[l] * voxelMl,
      centroid: n[l] ? { x: Math.round(sx[l] / n[l]), y: Math.round(sy[l] / n[l]), z: Math.round(sz[l] / n[l]) } : null
    });
  }
  return out;
}

async function gunzip(response) {
  if (!response.ok) throw new Error(`${response.url}: HTTP ${response.status}`);
  if (typeof DecompressionStream === 'undefined') throw new Error('DecompressionStream unsupported');
  const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Fetch and decode the prepared case. */
export async function loadCtCase(baseUrl) {
  const metaRes = await fetch(`${baseUrl}meta.json`);
  if (!metaRes.ok) throw new Error(`meta.json: HTTP ${metaRes.status}`);
  const meta = await metaRes.json();
  const [volume, labels] = await Promise.all([
    fetch(`${baseUrl}volume.ctz`).then(gunzip),
    fetch(`${baseUrl}labels.ctz`).then(gunzip)
  ]);
  const { x, y, z } = meta.dims;
  if (volume.length !== x * y * z || labels.length !== x * y * z) throw new Error('CT case size mismatch');
  const hu = huTable(meta.huKnots);
  const stats = labelStats(labels, meta.dims, meta.spacingMm, meta.labels.length);
  return { meta, volume, labels, hu, stats };
}

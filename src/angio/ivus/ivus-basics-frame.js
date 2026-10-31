/**
 * IVUS basics: an analytic teaching frame. The image is centred on the catheter (the transducer),
 * the vessel sits off centre (wire bias), and every point belongs to a named structure, so a click
 * can say what it is, how it echoes against the adventitia and where it sits on the clock face.
 * Speckle is polar (axial and lateral cells scale with the transducer frequency), attenuation
 * grows with frequency, and blood speckle moves. Distances are millimetres; screen y points down.
 */

export const FOV_MM = 4.6;   // radius of the displayed field

/** Transducer families: frequency, axial resolution, attenuation, blood echogenicity, catheter and ring-down size. */
export const FRAME_SYSTEMS = Object.freeze({
  'rotational-60': { freq: 60, axialUm: 22, alpha: .3, blood: .3, catheterR: .5, ringdown: .1, wire: true },
  'rotational-40': { freq: 40, axialUm: 38, alpha: .2, blood: .2, catheterR: .5, ringdown: .13, wire: true },
  'phased-20': { freq: 20, axialUm: 80, alpha: .11, blood: .11, catheterR: .58, ringdown: .36, wire: false }
});

const VESSEL = Object.freeze({ x: .5, y: -.28, lumen: 1.8, iel: 1.9, eel: 2.1, adventitia: 2.7 });
const WIRE = Object.freeze({ clock: 8, r: .98, size: .09, shadowDeg: 2.6 });

/** Plaques by preset: clock hours (vessel-centred, clockwise from 12) and maximum thickness in mm. */
export const FRAME_PRESETS = Object.freeze({
  normal: [],
  fibrous: [{ type: 'fibrous', from: 2, to: 6, thick: .75 }],
  calcium: [{ type: 'fibrous', from: 7.6, to: 12.4, thick: .5 }, { type: 'calcium', from: 8.6, to: 11.4, thick: .38 }],
  mixed: [{ type: 'mixed', from: 11, to: 16, thick: .85 }, { type: 'calcium', from: 12.6, to: 13.4, thick: .3, deep: true }],
  nodule: [{ type: 'fibrous', from: 8, to: 12.6, thick: .45 }],
  attenuated: [{ type: 'attenuated', from: 12.5, to: 16.5, thick: .8 }],
  thrombus: [{ type: 'fibrous', from: 5, to: 9, thick: .35 }],
  hematoma: [{ type: 'hematoma', from: 6, to: 11, thick: .75 }],
  dissection: [{ type: 'fibrous', from: 6, to: 12, thick: .3 }],
  stent: [],
  sidebranch: [],
  nurd: [{ type: 'fibrous', from: 8, to: 11, thick: .4 }]
});

/** Findings that are not a plaque arc: shapes in the lumen, a dissection flap, stent struts, a side branch, NURD. */
const FRAME_FEATURES = Object.freeze({
  calcium: { reverb: true },
  nodule: { nodule: { hour: 10, rho: 1.38, r: .36 } },
  thrombus: { thrombus: { hour: 2, rho: 1.1, r: .5 } },
  dissection: { dissection: { from: 1, to: 5, flap: 1.28 } },
  stent: { stent: { n: 9, rho: 1.62, malFrom: 1, malTo: 3.4, malRho: 1.32 } },
  sidebranch: { branch: { from: 2, to: 3.6 } },
  nurd: { nurd: { from: 2, to: 5 } }
});
const CASTERS = new Set(['calcium', 'nodule', 'strut', 'malapposedStrut']);
const BLOOD = new Set(['lumen', 'trueLumen', 'falseLumen', 'sideBranch']);
export const isBlood = id => BLOOD.has(id);

/** Echo category of each structure, judged against the adventitia (the brightness reference). */
export const STRUCTURE_ECHO = Object.freeze({
  catheter: 'anechoic', ringdown: 'artifact', wire: 'shadowed', wireShadow: 'shadow', lumen: 'blood',
  intima: 'hyperechoic', media: 'hypoechoic', adventitia: 'reference', periadventitia: 'mixed',
  fibrous: 'hyperechoic', lipid: 'hypoechoic', calcium: 'shadowed', calciumShadow: 'shadow', mixed: 'mixed',
  reverberation: 'artifact', nodule: 'shadowed', attenuated: 'hypoechoic', attenuation: 'shadow', thrombus: 'mixed',
  hematoma: 'hypoechoic', flap: 'hyperechoic', trueLumen: 'blood', falseLumen: 'blood', strut: 'shadowed',
  malapposedStrut: 'shadowed', sideBranch: 'blood', nurd: 'artifact'
});

const TAU = Math.PI * 2;
const clockOf = (x, y) => (((Math.atan2(x, -y) / TAU) * 12) + 12) % 12;          // 0..12, 12 o'clock at the top
const hourDistance = (h, from, to) => { const span = (to - from + 12) % 12 || 12; const u = ((h - from + 12) % 12) / span; return u <= 1 ? u : null; };
function hash(ix, iy, seed) { let h = (ix * 374761393 + iy * 668265263 + seed * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function valueNoise(x, y, seed) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const a = hash(ix, iy, seed), b = hash(ix + 1, iy, seed), c = hash(ix, iy + 1, seed), d = hash(ix + 1, iy + 1, seed);
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** Plaque thickness and type at a vessel-centred clock hour. */
function plaqueAt(preset, hour) {
  let thick = 0, type = null, calcium = null;
  for (const p of FRAME_PRESETS[preset] || []) {
    const u = hourDistance(hour, p.from % 12, p.to % 12);
    if (u == null) continue;
    const t = p.thick * Math.sin(Math.PI * u) ** .6;
    if (p.type === 'calcium') { calcium = { ...p, t }; continue; }
    if (t > thick) { thick = t; type = p.type; }
  }
  return { thick, type, calcium };
}

const shadowCache = new Map();
const hasCasters = preset => (FRAME_PRESETS[preset] || []).some(p => p.type === 'calcium') || ['nodule', 'stent'].some(k => FRAME_FEATURES[preset]?.[k]);
/**
 * Along the beam at a catheter clock hour: where the first sound-blocking structure (calcium, a
 * nodule, a stent strut) starts and where its shadow begins (Infinity if the beam is clear).
 */
function shadowRay(preset, hour) {
  if (!hasCasters(preset)) return { enter: Infinity, start: Infinity };
  let rays = shadowCache.get(preset);
  if (!rays) {
    rays = { enter: new Float32Array(1440), start: new Float32Array(1440) };
    for (let k = 0; k < 1440; k++) {
      const a = (k / 1440) * TAU; let enter = Infinity, start = Infinity;
      for (let r = .3; r <= FOV_MM; r += .005) {
        const cast = CASTERS.has(tissueAt(r * Math.sin(a), -r * Math.cos(a), preset).id);
        if (cast && enter === Infinity) enter = r; else if (!cast && enter !== Infinity) { start = r; break; }
      }
      rays.enter[k] = enter; rays.start[k] = start;
    }
    shadowCache.set(preset, rays);
  }
  const k = Math.floor((hour / 12) * 1440) % 1440;
  return { enter: rays.enter[k], start: rays.start[k] };
}

/** The structure at a point (mm from the catheter centre) of a preset and system. */
export function structureAt(x, y, { preset = 'normal', system = 'rotational-40' } = {}) {
  const sys = FRAME_SYSTEMS[system] || FRAME_SYSTEMS['rotational-40'], r = Math.hypot(x, y);
  const out = (id, extra = {}) => ({ id, echo: STRUCTURE_ECHO[id], clock: clockOf(x, y), depthMm: r, ...extra });
  if (r < sys.catheterR) return out('catheter');
  if (r < sys.catheterR + sys.ringdown) return out('ringdown');
  if (sys.wire) {
    const a = (WIRE.clock / 12) * TAU, wx = WIRE.r * Math.sin(a), wy = -WIRE.r * Math.cos(a);
    if (Math.hypot(x - wx, y - wy) < WIRE.size) return out('wire');
    const off = Math.abs(((clockOf(x, y) - WIRE.clock + 18) % 12) - 6) * 30;
    if (r > WIRE.r && off < WIRE.shadowDeg * (1 + .4 / r)) return out('wireShadow');
  }
  const f = FRAME_FEATURES[preset] || {}, hour = clockOf(x, y);
  // NURD: the drive shaft sticks and then whips, so one sector is stretched and smeared sideways.
  if (f.nurd && sys.wire) {
    const u = hourDistance(hour, f.nurd.from, f.nurd.to);
    if (u != null) {
      const warped = f.nurd.from + (f.nurd.to - f.nurd.from) * (u - .16 * Math.sin(TAU * u)), a = (warped / 12) * TAU;
      const base = tissueAt(r * Math.sin(a), -r * Math.cos(a), preset);
      if (!BLOOD.has(base.id)) return out('nurd', { base: base.id });
    }
  }
  // Sound travels out from the catheter: everything beyond calcium, a nodule or a strut along the same beam is shadow.
  const ray = shadowRay(preset, hour);
  const tissue = tissueAt(x, y, preset);
  if (r > ray.start) {
    // Reverberation: the pulse bounces between transducer and calcium, echoing at equal steps behind it.
    if (f.reverb) for (let k = 1; k <= 2; k++) if (Math.abs(r - (ray.enter + k * (ray.enter - sys.catheterR))) < .035) return out('reverberation');
    return out('calciumShadow');
  }
  return out(tissue.id, tissue.within ? { within: tissue.within } : {});
}

/** Tissue at a point, ignoring acoustic shadows (vessel-centred geometry). */
function tissueAt(x, y, preset) {
  const out = (id, extra = {}) => ({ id, ...extra });
  const dx = x - VESSEL.x, dy = y - VESSEL.y, rho = Math.hypot(dx, dy), hour = clockOf(dx, dy), f = FRAME_FEATURES[preset] || {};
  const at = (h, rr) => { const a = (h / 12) * TAU; return [VESSEL.x + rr * Math.sin(a), VESSEL.y - rr * Math.cos(a)]; };
  if (f.branch) {   // the side branch opens through the wall and narrows as it leaves
    const u = hourDistance(hour, f.branch.from, f.branch.to);
    if (u != null && rho >= 1.6 && Math.abs(u - .5) < .5 - (rho - 1.6) * .1) return out('sideBranch');
  }
  if (f.thrombus) {
    const [tx, ty] = at(f.thrombus.hour, f.thrombus.rho), ang = Math.atan2(y - ty, x - tx);
    if (Math.hypot(x - tx, y - ty) < f.thrombus.r * (1 + .14 * Math.sin(5 * ang) + .06 * Math.sin(11 * ang))) return out('thrombus');
  }
  if (f.nodule) { const [nx, ny] = at(f.nodule.hour, f.nodule.rho), d = Math.hypot(x - nx, y - ny); if (d < f.nodule.r) return out(d > f.nodule.r - .14 ? 'nodule' : 'fibrous'); }   // bright crust; the core lies in its shadow
  if (f.stent) {
    const s = f.stent, mal = hourDistance(hour, s.malFrom, s.malTo) != null, rs = mal ? s.malRho : s.rho;
    const step = 12 / s.n, nearest = Math.round(hour / step) * step, arc = Math.abs(((hour - nearest + 18) % 12) - 6) / 12 * TAU * rho;
    if (arc < .07 && Math.abs(rho - rs) < .04) return out(mal ? 'malapposedStrut' : 'strut');
    if (rho < (mal ? VESSEL.lumen : rs)) return out('lumen');
    if (rho < VESSEL.iel) return out('fibrous');
  }
  if (f.dissection) {
    const d = f.dissection;
    if (hourDistance(hour, d.from, d.to) != null) {
      if (Math.abs(rho - d.flap) < .035) return out('flap');
      if (rho < d.flap) return out('trueLumen');
      if (rho < VESSEL.iel - .02) return out('falseLumen');
    }
  }
  const { thick, type, calcium } = plaqueAt(preset, hour);
  const lumenR = VESSEL.lumen - Math.max(thick, calcium && !calcium.deep ? calcium.t : 0);
  if (rho < lumenR) return out(f.dissection ? 'trueLumen' : 'lumen');
  if (type === 'attenuated' && thick > .02) return out(rho < lumenR + .22 ? 'attenuated' : 'attenuation');
  if (type === 'hematoma' && thick > .02 && rho < VESSEL.eel) return out(rho < lumenR + .07 ? 'intima' : 'hematoma');
  if (calcium && calcium.t > .02) {
    const edge = calcium.deep ? VESSEL.iel - .25 : lumenR;
    if (rho >= edge && rho < edge + .14 * Math.min(1, calcium.t / .15)) return out('calcium');
  }
  if (rho < VESSEL.iel) {
    if (thick > .02) {
      if (type === 'mixed') return valueNoise(dx * 3.2 + 9, dy * 3.2, 7) < .45 && rho > lumenR + .12 ? out('lipid', { within: 'mixed' }) : out('fibrous', { within: 'mixed' });
      return out(type);
    }
    return out('intima');
  }
  if (rho < VESSEL.eel) return out('media');
  if (rho < VESSEL.adventitia) return out('adventitia');
  return out('periadventitia');
}

const BASE = {
  catheter: 0, ringdown: .9, wire: 1, wireShadow: .02, lumen: 0, intima: .8, media: .14, adventitia: .72, periadventitia: .34, fibrous: .8, lipid: .16, calcium: 1, calciumShadow: .02, mixed: .5,
  reverberation: .6, nodule: 1, attenuated: .22, attenuation: .05, thrombus: .42, hematoma: .3, flap: .85, trueLumen: 0, falseLumen: 0, strut: 1, malapposedStrut: 1, sideBranch: 0
};

/**
 * Render the static tissue (no blood) into an RGBA buffer of size × size pixels and list the lumen
 * pixels, so blood speckle can be animated cheaply each frame.
 */
export function buildFrame(size, { preset = 'normal', system = 'rotational-40' } = {}) {
  const sys = FRAME_SYSTEMS[system] || FRAME_SYSTEMS['rotational-40'];
  const data = new Uint8ClampedArray(size * size * 4), ids = new Array(size * size), lumen = [], half = size / 2, mmPerPx = FOV_MM / half;
  const axial = Math.max(.012, sys.axialUm / 1000) * 1.6, lateral = axial * 2.2;
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    const i = py * size + px, x = (px + .5 - half) * mmPerPx, y = (py + .5 - half) * mmPerPx, r = Math.hypot(x, y);
    let v = 0;
    if (r <= FOV_MM) {
      const s = structureAt(x, y, { preset, system }); ids[i] = s.id;
      if (BLOOD.has(s.id)) lumen.push(i);
      const id = s.id === 'nurd' ? s.base : s.id, theta = Math.atan2(y, x);
      const speckle = -Math.log(1 - .98 * valueNoise(r / axial, (theta * r) / (lateral * (s.id === 'nurd' ? 5 : 1)), 3)) * .62;   // Rayleigh-like grain; NURD smears it sideways
      v = BASE[id] ?? 0;
      if (id === 'ringdown') v *= 1 - (r - sys.catheterR) / sys.ringdown * .6;
      if (id === 'periadventitia') v *= Math.max(0, 1 - (r - 2.4) / 2.2);
      if (id === 'hematoma') v *= .75 + .4 * (speckle - .6);   // more homogeneous than plaque
      else if (!['catheter', 'calcium', 'wire', 'nodule', 'strut', 'malapposedStrut', 'flap'].includes(id)) v *= .45 + speckle;
      v *= Math.exp(-sys.alpha * Math.max(0, r - sys.catheterR));
    }
    const g = Math.round(255 * Math.min(1, Math.max(0, v)) ** .85);
    data[i * 4] = g; data[i * 4 + 1] = g; data[i * 4 + 2] = g; data[i * 4 + 3] = 255;
  }
  return { size, data, ids, lumen, mmPerPx, system: sys };
}

/** Write moving blood speckle into the lumen pixels of a frame copy; t in seconds. */
export function paintBlood(frame, target, t) {
  const { lumen, size, mmPerPx, system } = frame, half = size / 2, cell = Math.max(mmPerPx * 1.2, system.axialUm / 1000 * 1.3);
  for (const i of lumen) {
    const px = i % size, py = (i - px) / size, x = (px - half) * mmPerPx, y = (py - half) * mmPerPx;
    const n = .6 * valueNoise(x / cell + t * 2.3, y / cell - t * 1.4, 11) + .4 * valueNoise(x / cell - t * 1.9, y / cell + t * 2.7, 23);
    const g = Math.round(255 * Math.min(1, system.blood * (.35 * n + (n > .62 ? 3.2 * (n - .62) : 0))));
    target[i * 4] = g; target[i * 4 + 1] = g; target[i * 4 + 2] = g;
  }
}

/** Lumen area, EEM area, plaque + media burden, and two EEM diameters (EEL to EEL and mid-media). */
export function frameMeasures(preset = 'normal') {
  let lumen = 0;
  const steps = 720;
  for (let k = 0; k < steps; k++) {
    const { thick, calcium } = plaqueAt(preset, (k / steps) * 12);
    const r = VESSEL.lumen - Math.max(thick, calcium && !calcium.deep ? calcium.t : 0);
    lumen += .5 * r * r * (TAU / steps);
  }
  const eem = Math.PI * VESSEL.eel ** 2;
  return {
    lumenArea: lumen, eemArea: eem, burden: (eem - lumen) / eem,
    eelDiameter: 2 * VESSEL.eel, midMediaDiameter: VESSEL.iel + VESSEL.eel
  };
}

/** Outline radius (mm, vessel centred) of a reading step at clock hour h: lumen, intima, media or EEL. */
export function outlineRadius(kind, preset, hour) {
  const { thick, calcium } = plaqueAt(preset, hour);
  if (kind === 'lumen') return VESSEL.lumen - Math.max(thick, calcium && !calcium.deep ? calcium.t : 0);
  if (kind === 'iel') return VESSEL.iel;
  if (kind === 'eel') return VESSEL.eel;
  if (kind === 'adventitia') return VESSEL.adventitia;
  return VESSEL.lumen;
}
export const VESSEL_CENTRE = Object.freeze({ x: VESSEL.x, y: VESSEL.y });
export const WIRE_POSITION = Object.freeze({ x: WIRE.r * Math.sin((WIRE.clock / 12) * TAU), y: -WIRE.r * Math.cos((WIRE.clock / 12) * TAU) });

/** Echo amplitude along one beam (clock hour from the catheter), for the A-line view. */
export function aLine(hour, { preset = 'normal', system = 'rotational-40' } = {}, samples = 160) {
  const sys = FRAME_SYSTEMS[system] || FRAME_SYSTEMS['rotational-40'], a = (hour / 12) * TAU;
  return Array.from({ length: samples }, (_, i) => {
    const r = (i / (samples - 1)) * FOV_MM, x = r * Math.sin(a), y = -r * Math.cos(a), s = structureAt(x, y, { preset, system });
    const v = (BLOOD.has(s.id) ? sys.blood * .5 : BASE[s.id] ?? 0) * Math.exp(-sys.alpha * Math.max(0, r - sys.catheterR));
    return { r, v, id: s.id };
  });
}

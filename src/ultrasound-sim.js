/*
 * Ultrasound image formation for the IVUS and echo teaching images. Not a wave
 * simulation, but the steps a scanner's image goes through, so the picture
 * looks acquired rather than drawn: along every scan line (ray) the tissue
 * reflectivity drives random-phase scatterers (blurred as a complex field, so
 * the envelope is Rayleigh speckle with grains the size of the PSF), the beam loses energy with
 * depth and behind strong reflectors (acoustic shadow), a strong specular
 * reflector repeats at multiples of its range (reverberation), the line is
 * blurred by an axial and a lateral point-spread function (lateral blur grows
 * with depth, so speckle is smeared along the arcs), and the envelope is
 * log-compressed into the display range. scanConvert() then maps the polar
 * lines to the screen: a full circle for IVUS, a sector for echo.
 */

/** Deterministic PRNG (mulberry32). */
export function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fieldCache = new Map();
/** Pair of unit-variance Gaussian fields (real, imaginary scatterer phases), cached per size and seed. */
export function scattererField(rays, samples, seed = 7) {
  const key = `${rays}x${samples}:${seed}`;
  let f = fieldCache.get(key);
  if (!f) {
    if (fieldCache.size > 8) fieldCache.clear();
    const rand = prng(seed);
    const n = rays * samples;
    const re = new Float32Array(n), im = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const r = Math.sqrt(-2 * Math.log(1 - rand() * 0.999999)), t = 2 * Math.PI * rand();
      re[i] = r * Math.cos(t);
      im[i] = r * Math.sin(t);
    }
    f = { re, im };
    fieldCache.set(key, f);
  }
  return f;
}

/** Separable Gaussian kernel of standard deviation sigma (samples). */
function kernel(sigma) {
  const r = Math.max(1, Math.ceil(sigma * 2.5));
  const k = new Float32Array(2 * r + 1);
  let s = 0;
  for (let i = -r; i <= r; i++) { k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma)); s += k[i + r]; }
  for (let i = 0; i < k.length; i++) k[i] /= s;
  return { k, r };
}

/**
 * Form the polar image.
 * @param {object} o
 * @param {number} o.rays scan lines
 * @param {number} o.samples samples per line (range)
 * @param {(ray: number, sample: number, out: Float32Array) => void} o.tissue writes
 *   out[0] = backscatter reflectivity (0..1, linear), out[1] = attenuation per sample (0..1, fraction
 *   of energy lost), out[2] = specular reflector strength (0..1, adds reverberation and shadow)
 * @param {number} [o.axialSigma=1.0] axial PSF, samples
 * @param {(sample: number) => number} [o.lateralSigma] lateral PSF in rays at a sample (depth)
 * @param {boolean} [o.wrap=false] lines wrap around (IVUS full circle)
 * @param {number} [o.dynamicRangeDb=48] displayed dynamic range
 * @param {number} [o.gainDb=0]
 * @param {(sample: number) => number} [o.tgc] time-gain compensation (linear multiplier)
 * @param {number} [o.seed=7] speckle seed; [o.flicker] 0..1 blend toward a second speckle field (blood motion)
 * @param {(ray: number, sample: number) => number} [o.flickerMask] where the flicker applies (blood = 1)
 * @returns {Float32Array} display values 0..1, rays x samples
 */
export function formPolarImage(o) {
  const { rays, samples, tissue } = o;
  const n = rays * samples;
  const f1 = scattererField(rays, samples, o.seed ?? 7);
  const f2 = o.flicker ? scattererField(rays, samples, (o.seed ?? 7) + 101) : null;
  // Complex echo field: diffuse scatterers (random phase, amplitude from the backscatter)
  // plus coherent specular returns; blurred as a field, the envelope keeps full speckle contrast.
  const re = new Float32Array(n), im = new Float32Array(n);
  const cell = new Float32Array(3);
  const tgc = o.tgc || (() => 1);
  for (let ray = 0; ray < rays; ray++) {
    let energy = 1;
    const echoes = [];   // thick specular reflectors along this line: [sample, amplitude]
    let run = 0, runStart = 0, runAmp = 0;
    const base = ray * samples;
    for (let s = 0; s < samples; s++) {
      cell[0] = 0; cell[1] = 0; cell[2] = 0;
      tissue(ray, s, cell);
      const i = base + s;
      let gr = f1.re[i], gi = f1.im[i];
      if (f2) {
        const m = (o.flickerMask ? o.flickerMask(ray, s) : 1) * o.flicker;
        if (m > 0) { gr = gr * (1 - m) + f2.re[i] * m; gi = gi * (1 - m) + f2.im[i] * m; }
      }
      const g = Math.sqrt(energy) * tgc(s);
      const diffuse = Math.max(0, cell[0]) * g;   // backscatter amplitude (display dB follow 20 log10)
      const spec = cell[2];
      re[i] = diffuse * gr + spec * g * 1.6;
      im[i] = diffuse * gi;
      // Reverberation needs a thick flat reflector (calcium plate), not a thin strut or wire.
      if (spec > 0.25) { if (!run) { runStart = s; runAmp = 0; } run++; runAmp = Math.max(runAmp, spec * g); }
      else { if (run >= 3) echoes.push([runStart, runAmp]); run = 0; }
      energy *= 1 - Math.min(0.95, cell[1] + spec * 0.55);
      if (energy < 1e-5) energy = 1e-5;
    }
    // Reverberation: copies of strong specular echoes at 2x and 3x their range, fainter.
    for (const [s0, a] of echoes) {
      for (let m = 2; m <= 3; m++) {
        const s = s0 * m;
        if (s >= samples) break;
        re[base + s] += a * 0.28 / (m - 1);
      }
    }
  }
  const axial = (src) => {
    const ax = kernel(o.axialSigma ?? 1.0), out = new Float32Array(n);
    for (let ray = 0; ray < rays; ray++) {
      const base = ray * samples;
      for (let s = 0; s < samples; s++) {
        let v = 0;
        for (let j = -ax.r; j <= ax.r; j++) { const q = s + j; if (q >= 0 && q < samples) v += src[base + q] * ax.k[j + ax.r]; }
        out[base + s] = v;
      }
    }
    return out;
  };
  const lat = o.lateralSigma || (() => 1.2);
  const kernels = new Map();
  const lateral = (src) => {
    const out = new Float32Array(n);
    for (let s = 0; s < samples; s++) {
      const sigma = Math.max(0.4, Math.round(lat(s) * 4) / 4);
      let kk = kernels.get(sigma);
      if (!kk) { kk = kernel(sigma); kernels.set(sigma, kk); }
      for (let ray = 0; ray < rays; ray++) {
        let v = 0;
        for (let j = -kk.r; j <= kk.r; j++) {
          let q = ray + j;
          if (o.wrap) q = (q + rays) % rays;
          else if (q < 0 || q >= rays) continue;
          v += src[q * samples + s] * kk.k[j + kk.r];
        }
        out[ray * samples + s] = v;
      }
    }
    return out;
  };
  const br = lateral(axial(re)), bi = lateral(axial(im));
  // Envelope and log compression into the display range.
  const dr = o.dynamicRangeDb ?? 48;
  const gain = o.gainDb ?? 0;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const env = Math.hypot(br[i], bi[i]);
    const db = 20 * Math.log10(env + 1e-6) + gain;
    out[i] = Math.max(0, Math.min(1, (db + dr) / dr));
  }
  return out;
}

/**
 * Scan conversion into an RGBA ImageData (grey levels), bilinear between lines.
 * @param {Float32Array} polar rays x samples
 * @param {object} g geometry: { rays, samples, width, height, map(x, y) -> [rayFloat, sampleFloat] | null }
 * @param {ImageData} image target (width x height)
 * @param {{ gamma?: number, tint?: number[] }} [look] display curve and colour tint (r, g, b multipliers)
 */
export function scanConvert(polar, g, image, look = {}) {
  const { rays, samples, width, height } = g;
  const data = image.data;
  const gamma = look.gamma ?? 1.15;
  const [tr, tg, tb] = look.tint || [1, 1, 1];
  const lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) lut[i] = Math.round(255 * Math.pow(i / 255, gamma));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = 4 * (y * width + x);
      const m = g.map(x, y);
      if (!m) { data[p] = data[p + 1] = data[p + 2] = 0; data[p + 3] = 255; continue; }
      let [rf, sf] = m;
      if (sf < 0 || sf > samples - 1) { data[p] = data[p + 1] = data[p + 2] = 0; data[p + 3] = 255; continue; }
      if (g.wrap) rf = ((rf % rays) + rays) % rays;
      else if (rf < 0 || rf > rays - 1) { data[p] = data[p + 1] = data[p + 2] = 0; data[p + 3] = 255; continue; }
      const r0 = Math.floor(rf), s0 = Math.floor(sf);
      const r1 = g.wrap ? (r0 + 1) % rays : Math.min(rays - 1, r0 + 1), s1 = Math.min(samples - 1, s0 + 1);
      const fr = rf - r0, fs = sf - s0;
      const v = (polar[r0 * samples + s0] * (1 - fs) + polar[r0 * samples + s1] * fs) * (1 - fr)
        + (polar[r1 * samples + s0] * (1 - fs) + polar[r1 * samples + s1] * fs) * fr;
      const c = lut[Math.max(0, Math.min(255, Math.round(v * 255)))];
      data[p] = c * tr; data[p + 1] = c * tg; data[p + 2] = c * tb; data[p + 3] = 255;
    }
  }
  return image;
}

/** Circular (IVUS) geometry: ray = angle (clockwise from 12 o'clock), sample = radius. */
export function circularGeometry({ rays, samples, width, height, cx = width / 2, cy = height / 2, radiusPx }) {
  const perSample = radiusPx / samples;
  return {
    rays, samples, width, height, wrap: true,
    map(x, y) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const r = Math.hypot(dx, dy);
      if (r > radiusPx) return null;
      const a = Math.atan2(dx, -dy);   // 0 at 12 o'clock, clockwise
      return [((a < 0 ? a + Math.PI * 2 : a) / (Math.PI * 2)) * rays, r / perSample];
    }
  };
}

/** Sector (echo) geometry: apex at (ax, ay), half-angle `half`, rays from left to right edge. */
export function sectorGeometry({ rays, samples, width, height, ax, ay, radiusPx, half }) {
  const perSample = radiusPx / samples;
  return {
    rays, samples, width, height, wrap: false,
    map(x, y) {
      const dx = x + 0.5 - ax, dy = y + 0.5 - ay;
      const r = Math.hypot(dx, dy);
      if (r > radiusPx || dy < 0) return null;
      const a = Math.atan2(dx, dy);   // 0 straight down, positive to the screen right
      if (Math.abs(a) > half) return null;
      return [((a + half) / (2 * half)) * (rays - 1), r / perSample];
    }
  };
}

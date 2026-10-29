import { formPolarImage, scanConvert, sectorGeometry as sectorMap } from './ultrasound-sim.js';

/*
 * Echo-like image formation for the studio echo image (echo-bmode.js). The
 * anatomy-derived echogenicity map (walls, valves, blood, tissue; Cartesian,
 * 0..1) is sampled along the sector's scan lines and goes through the same
 * acquisition steps as the IVUS frame (ultrasound-sim.js): random-phase
 * scatterers whose amplitude follows the tissue, attenuation along each line
 * with shadowing behind bright structures, a near-field clutter band, a
 * lateral PSF that widens with depth, log compression, then sector scan
 * conversion. Blood speckle moves slowly between frames.
 */

const RAYS = 240;
const SAMPLES = 420;

/** Echogenicity (display grey of the map) to backscatter amplitude. */
// Steep curve: blood near the noise floor, extracardiac tissue dark grey, myocardium mid grey,
// endocardial lines brighter, valves and pericardium brightest.
const reflectivity = (e) => 0.0008 + e ** 4.2;

/**
 * @param {Float32Array} echo echogenicity map, w x h (0..1)
 * @param {number} w
 * @param {number} h
 * @param {{ apex: number[], radius: number }} geo sector geometry in CSS pixels
 * @param {number} half half sector angle (rad)
 * @param {number} gainDb
 * @param {number} time ms (blood speckle motion)
 * @returns {Uint8ClampedArray} RGBA pixels w x h
 */
export function acquireEchoImage(echo, w, h, geo, half, gainDb = 0, time = 0) {
  const [ax, ay] = geo.apex;
  const R = geo.radius;
  const sample = (x, y) => {
    const xi = Math.max(0, Math.min(w - 1.001, x)), yi = Math.max(0, Math.min(h - 1.001, y));
    const x0 = Math.floor(xi), y0 = Math.floor(yi), fx = xi - x0, fy = yi - y0;
    const i = y0 * w + x0;
    return (echo[i] * (1 - fx) + echo[i + 1] * fx) * (1 - fy) + (echo[i + w] * (1 - fx) + echo[i + w + 1] * fx) * fy;
  };
  // Line geometry: sample positions of every ray, cached per frame size.
  const sin = new Float32Array(RAYS), cos = new Float32Array(RAYS);
  for (let r = 0; r < RAYS; r++) {
    const a = -half + (2 * half * r) / (RAYS - 1);
    sin[r] = Math.sin(a);
    cos[r] = Math.cos(a);
  }
  const values = new Float32Array(RAYS * SAMPLES);
  for (let r = 0; r < RAYS; r++) {
    for (let s = 0; s < SAMPLES; s++) {
      const d = ((s + 0.5) / SAMPLES) * R;
      values[r * SAMPLES + s] = x0OutOfMap(ax + sin[r] * d, ay + cos[r] * d, w, h) ? 0 : sample(ax + sin[r] * d, ay + cos[r] * d);
    }
  }
  const polar = formPolarImage({
    rays: RAYS,
    samples: SAMPLES,
    tissue(ray, s, out) {
      const e = values[ray * SAMPLES + s];
      const depth = s / SAMPLES;
      // Near-field clutter and reverberation under the transducer.
      const near = 0.22 * Math.exp(-depth / 0.03);
      out[0] = reflectivity(e) + near;
      out[1] = 0.0016 + 0.006 * e * e;                 // tissue attenuates, blood hardly
      out[2] = e > 0.9 ? 0.25 : 0;                     // valves and bright interfaces: specular
    },
    axialSigma: 1.0,
    lateralSigma: (s) => 0.9 + 1.3 * (s / SAMPLES),   // beam widens beyond the focus
    dynamicRangeDb: 58,
    gainDb: gainDb + 3,
    tgc: (s) => 1 + 1.2 * (s / SAMPLES),
    seed: 23,
    flicker: 0.5 + 0.5 * Math.sin(time / 260),
    flickerMask: (ray, s) => (values[ray * SAMPLES + s] < 0.08 ? 1 : 0)
  });
  const image = new ImageData(w, h);
  scanConvert(polar, sectorMap({ rays: RAYS, samples: SAMPLES, width: w, height: h, ax, ay, radiusPx: R, half }), image, { gamma: 1.1, tint: [1, 1, 1.02] });
  return image.data;
}

const x0OutOfMap = (x, y, w, h) => x < 0 || y < 0 || x >= w || y >= h;

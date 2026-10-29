// Ultrasound image formation (src/ultrasound-sim.js): fully developed speckle, attenuation and
// shadowing behind a specular reflector, reverberation from thick reflectors only, scan
// conversion geometry for IVUS (circle) and echo (sector).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { formPolarImage, scanConvert, circularGeometry, sectorGeometry, scattererField } from '../src/ultrasound-sim.js';

const rays = 64, samples = 200;
const uniform = (level) => (ray, s, out) => { out[0] = level; out[1] = 0; };
const img = formPolarImage({ rays, samples, tissue: uniform(0.1), wrap: true, dynamicRangeDb: 60, axialSigma: 1, lateralSigma: () => 1 });
const mean = img.reduce((a, b) => a + b, 0) / img.length;
const sd = Math.sqrt(img.reduce((a, b) => a + (b - mean) ** 2, 0) / img.length);
assert.ok(sd * 60 > 3 && sd * 60 < 9, `log-compressed speckle keeps a realistic grain (${(sd * 60).toFixed(1)} dB SD)`);
const field = scattererField(32, 32, 3);
assert.ok(Math.abs(field.re.reduce((a, b) => a + b * b, 0) / field.re.length - 1) < 0.2, 'scatterer field has unit variance');

// A specular reflector at sample 60 on half the rays: bright at 60, shadow behind.
const shadow = formPolarImage({
  rays, samples, wrap: true, dynamicRangeDb: 60,
  tissue: (ray, s, out) => { out[0] = 0.1; out[1] = 0.002; out[2] = ray < rays / 2 && s >= 60 && s < 64 ? 1 : 0; }
});
const avg = (r0, r1, s0, s1) => { let t = 0, n = 0; for (let r = r0; r < r1; r++) for (let s = s0; s < s1; s++) { t += shadow[r * samples + s]; n++; } return t / n; };
assert.ok(avg(4, 28, 58, 66) > avg(36, 60, 58, 66) + 0.1, 'the reflector is brighter than the tissue beside it');
assert.ok(avg(4, 28, 80, 110) < avg(36, 60, 80, 110) - 0.1, 'acoustic shadow behind the reflector');
// Thick reflector (4 samples) reverberates at twice its range, a one-sample strut does not.
const reverb = (thick) => formPolarImage({
  rays: 8, samples, wrap: true, dynamicRangeDb: 60, lateralSigma: () => 0.5,
  tissue: (ray, s, out) => { out[0] = 0.0005; out[2] = s >= 50 && s < 50 + thick ? 1 : 0; }
});
const at = (im, s) => { let t = 0; for (let r = 0; r < 8; r++) t += im[r * samples + s]; return t / 8; };
assert.ok(at(reverb(4), 100) > at(reverb(4), 130) + 0.1, 'thick specular reflector repeats at twice its range');
assert.ok(at(reverb(1), 100) < at(reverb(4), 100) - 0.1, 'a thin strut does not reverberate');

// Scan conversion: IVUS centre is the catheter (sample 0), 12 o'clock is ray 0; sector apex on top.
const circ = circularGeometry({ rays: 360, samples: 100, width: 101, height: 101, radiusPx: 50 });
assert.ok(circ.map(50, 50)[1] < 2, 'image centre maps to the catheter');
assert.ok(Math.abs(circ.map(50, 5)[0]) < 2 || Math.abs(circ.map(50, 5)[0] - 360) < 2, '12 o\'clock is ray 0');
assert.ok(Math.abs(circ.map(95, 50)[0] - 90) < 2, '3 o\'clock is a quarter turn clockwise');
assert.equal(circ.map(0, 0), null, 'outside the circle');
const sec = sectorGeometry({ rays: 101, samples: 100, width: 200, height: 120, ax: 100, ay: 10, radiusPx: 100, half: Math.PI / 4 });
assert.ok(Math.abs(sec.map(100, 60)[0] - 50) < 1, 'beam axis is the middle ray');
assert.equal(sec.map(10, 15), null, 'outside the sector');
const image = { data: new Uint8ClampedArray(101 * 101 * 4) };
scanConvert(new Float32Array(360 * 100).fill(0.5), circ, image);
assert.ok(image.data[(50 * 101 + 70) * 4] > 100 && image.data[3] === 255, 'scan conversion fills the circle');

for (const file of ['ultrasound-sim.js', 'echo-acquire.js', 'angio/ivus/ivus-acquire.js']) {
  assert.ok(!fs.readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8').includes('\u2014'), `${file} has no em dash`);
}
console.log(`PASS ultrasound image formation: speckle ${(sd * 60).toFixed(1)} dB SD, shadow behind a reflector, reverberation from thick reflectors only, IVUS and sector scan conversion`);

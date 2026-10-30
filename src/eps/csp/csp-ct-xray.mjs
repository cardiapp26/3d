/** Live fluoroscopy of a real chest CT for the CSP implant console.
 *
 * The volume is the cardiac CT studio's TotalSegmentator case (public/ct-data/s0019, CC BY 4.0).
 * A C-arm at any angle from RAO 45 to LAO 60 projects it from a point source (cone beam): WebGL2
 * integrates attenuation along each ray (a digitally reconstructed radiograph), the CPU applies the
 * log window and the edge enhancement of a fluoroscopy chain. The iodinated blood pool of the CT
 * angiogram is set to soft tissue, so the heart reads as one shadow as in fluoroscopy; a contrast
 * puff fills the RA and RV again. Sheath and lead are placed in that patient's heart from landmarks
 * measured on the labels (csp-ct-geometry.mjs) and projected through the same camera.
 *
 * Geometry and image processing are pure functions (node tests); createDrr needs a browser.
 */
import { CT_GEOMETRY as G } from './csp-ct-geometry.mjs';
import { loadCtCase } from '../../ct/ct-volume-data.js';

export const SOD_MM = 750;              // source to isocentre
export const FOV_MM = 190;              // field of view at the isocentre
export const CARM_RANGE = Object.freeze([-45, 60]);   // degrees: negative RAO, positive LAO
export const CARM_PRESETS = Object.freeze({ rao: -30, ap: 0, lao: 40 });
export const IMAGE_PX = 448;
const ISO = Object.freeze([G.landmarks.iso[0], G.landmarks.iso[1], G.landmarks.iso[2] - 8]);
const APPROACH_MM = 10;                 // the sheath end sits about 1 cm back in the RV cavity
const RING_BACK_MM = 10;                // ring electrode about 1 cm proximal of the tip
const STEP_MM = 1.6;                    // ray-marching step
const MU_MAX = 3.2;                     // relative attenuation stored as a byte over 0..MU_MAX
const MU_WATER = .02;                   // per mm (about 70 keV)
const EXT_SLICES = 50;                  // soft tissue continued caudally beyond the CT (abdomen)
const WINDOW = Object.freeze([2.2, 6.2]);          // displayed log-attenuation range
const EDGE = Object.freeze({ radius: 6, gain: 1.2 });
const PUFF_MU = .9;                     // extra attenuation per mm of opacified RA/RV blood (x MU_WATER)
const BLOOD = Object.freeze(['lv', 'rv', 'la', 'ra', 'aorta', 'pulmonary-artery', 'ivc']);
const BONE = Object.freeze(['ribs', 'vertebrae', 'clavicles', 'scapulae']);
const PUFFED = Object.freeze(['ra', 'rv']);

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => Math.hypot(a[0], a[1], a[2]);
const unit = a => mul(a, 1 / (len(a) || 1));
const lerp3 = (a, b, t) => add(a, mul(sub(b, a), t));
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const rotate = (v, k, angle) => add(add(mul(v, Math.cos(angle)), mul(cross(k, v), Math.sin(angle))), mul(k, dot(k, v) * (1 - Math.cos(angle))));

export const clampCarm = angle => clamp(Math.round(Number(angle) || 0), CARM_RANGE[0], CARM_RANGE[1]);
/** Projection label, e.g. "RAO 30°", "AP", "LAO 40°". */
export const carmLabel = angle => (angle === 0 ? 'AP' : `${angle < 0 ? 'RAO' : 'LAO'} ${Math.abs(angle)}°`);

/** C-arm frame: `view` from the detector into the patient, screen `right` and `up`, the `source`. */
export function carmBasis(angle) {
  const a = (angle * Math.PI) / 180;
  const view = [-Math.sin(a), Math.cos(a), 0], up = [0, 0, -1], right = cross(up, view);
  return { view, up, right, source: add(ISO, mul(view, SOD_MM)) };
}

/** CT point (mm) -> image fractions [x, y] for a C-arm angle. */
export function project(angle, p) {
  const { view, up, right, source } = carmBasis(angle);
  const rel = sub(p, source), k = SOD_MM / Math.max(1, -dot(rel, view));
  return [.5 + (dot(rel, right) * k) / FOV_MM, .5 - (dot(rel, up) * k) / FOV_MM];
}

/** RV and LV sides of the septum at a level (0 His .. 1 apex). */
export function septalSite(level) {
  const s = G.landmarks.septum, f = clamp(level, 0, 1) * (s.length - 1), i = Math.min(s.length - 2, Math.floor(f)), t = f - i;
  return { rv: lerp3(s[i].rv, s[i + 1].rv, t), lv: lerp3(s[i].lv, s[i + 1].lv, t) };
}

// The sheath is torqued about the LAO 40 viewing axis, so its angle reads as the clock angle in LAO.
const LAO_AXIS = carmBasis(CARM_PRESETS.lao).view;
const TURN_SIGN = (() => {   // a negative (clockwise, anterior) sheath angle looks steeper in LAO
  const site = septalSite(.3), n = unit(sub(site.lv, site.rv));
  const y = d => project(CARM_PRESETS.lao, add(site.rv, mul(d, 10)))[1];
  return y(rotate(n, LAO_AXIS, -.2)) < y(rotate(n, LAO_AXIS, .2)) ? 1 : -1;
})();

/**
 * Sheath and lead in CT millimetres.
 * @param {{ level: number, rel: number, depthRatio: number }} pose rel: sheath angle to the septal normal (deg)
 */
export function leadPose({ level, rel, depthRatio }) {
  const site = septalSite(level), wall = sub(site.lv, site.rv), normal = unit(wall);
  const dir = rotate(normal, LAO_AXIS, (TURN_SIGN * rel * Math.PI) / 180);
  const approach = sub(site.rv, mul(normal, APPROACH_MM));
  const reach = APPROACH_MM / Math.max(.35, Math.cos((rel * Math.PI) / 180));
  const surface = add(approach, mul(dir, reach));
  const depth = Math.max(0, depthRatio) * len(wall);
  const tip = add(surface, mul(dir, depth));
  const ring = add(tip, mul(dir, -Math.min(RING_BACK_MM, reach + depth)));
  const L = G.landmarks;
  return { path: [L.innominate, L.highSvc, L.svc, L.raTop, L.ra, L.tv, approach], approach, tip, ring, entry: surface, normal, dir };
}

/** Level (0..1) of the septal site nearest an image point (fractions) at a C-arm angle. */
export function levelAtImage(angle, x, y) {
  const s = G.landmarks.septum;
  let best = 0, bestD = Infinity;
  for (let i = 0; i < s.length - 1; i++) {
    const a = project(angle, s[i].rv), b = project(angle, s[i + 1].rv);
    const dx = b[0] - a[0], dy = b[1] - a[1], t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    const d = Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y);
    if (d < bestD) { bestD = d; best = (i + t) / (s.length - 1); }
  }
  return best;
}

/** Image points of the overlays at a C-arm angle. */
export function landmarksOn(angle) {
  const L = G.landmarks;
  return { his: project(angle, L.his), apex: project(angle, L.apex), septalLine: L.septum.map(s => project(angle, s.rv)), centre: project(angle, lerp3(L.tv, L.apex, .5)) };
}

/** The geometry interface csp-fluoro.mjs draws with, bound to one C-arm angle. */
export function ctGeometry(angle) {
  return { angle, label: carmLabel(angle), lao: angle > 0, project: p => project(angle, p), landmarks: () => landmarksOn(angle), leadPose, septalSite };
}

/**
 * Attenuation volume for the shader from the CT bytes and labels: RG pairs, R relative attenuation
 * (0..MU_MAX as a byte), G 255 where the RA or RV blood pool can be opacified by a contrast puff.
 * The CT angiogram's contrast is removed (labelled blood pools, and unlabelled 150-900 HU outside
 * bone) and EXT_SLICES of smoothed soft tissue continue the body caudally.
 */
export function attenuationVolume({ meta, volume, labels, hu }) {
  const { x: X, y: Y, z: Z } = meta.dims, plane = X * Y, ids = Object.fromEntries(meta.labels.map(l => [l.key, l.id]));
  const blood = new Uint8Array(256), bone = new Uint8Array(256), puffed = new Uint8Array(256);
  for (const k of BLOOD) blood[ids[k]] = 1;
  for (const k of BONE) bone[ids[k]] = 1;
  for (const k of PUFFED) puffed[ids[k]] = 1;
  const out = new Uint8Array(plane * (Z + EXT_SLICES) * 2);
  for (let i = 0; i < plane * Z; i++) {
    const l = labels[i];
    let h = hu[volume[i]];
    if (blood[l]) h = 40; else if (!bone[l] && h > 150 && h < 900) h = 45;
    let mu = Math.max(0, 1 + h / 1000);
    if (h > 150) mu *= 1 + ((h - 150) / 1000) * 1.2;   // bone: extra photoelectric absorption
    out[i * 2] = Math.min(255, Math.round((mu / MU_MAX) * 255));
    out[i * 2 + 1] = puffed[l] ? 255 : 0;
  }
  const last = boxBlur(Uint8Array.from({ length: plane }, (_, i) => Math.min(out[((Z - 1) * plane + i) * 2], 94)), X, Y, 7);
  for (let s = 0; s < EXT_SLICES; s++) {
    const base = (Z + s) * plane, k = 1 + .004 * s;
    for (let i = 0; i < plane; i++) out[(base + i) * 2] = Math.min(255, Math.round(last[i] * k));
  }
  return { data: out, dims: { x: X, y: Y, z: Z + EXT_SLICES }, spacing: meta.spacingMm };
}

/** Separable box blur of a w x h array (radius r), returns Float32Array. */
export function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h), n = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    let s = 0;
    for (let x = -r; x <= r; x++) s += src[y * w + clamp(x, 0, w - 1)];
    for (let x = 0; x < w; x++) { tmp[y * w + x] = s / n; s += src[y * w + clamp(x + r + 1, 0, w - 1)] - src[y * w + clamp(x - r, 0, w - 1)]; }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += tmp[clamp(y, 0, h - 1) * w + x];
    for (let y = 0; y < h; y++) { out[y * w + x] = s / n; s += tmp[clamp(y + r + 1, 0, h - 1) * w + x] - tmp[clamp(y - r, 0, h - 1) * w + x]; }
  }
  return out;
}

/**
 * Fluoroscopy image from the ray integrals: log window, slight gamma and unsharp-mask edge
 * enhancement. `integrals` holds per pixel [attenuation, opacified blood mm]; contrast 0..1.
 * @returns {Uint8ClampedArray} RGBA pixels
 */
export function fluoroPixels(integrals, size, contrast = 0) {
  const n = size * size, b = new Float32Array(n), [lo, hi] = WINDOW;
  for (let i = 0; i < n; i++) {
    const att = integrals[i * 2] + contrast * PUFF_MU * MU_WATER * integrals[i * 2 + 1];
    b[i] = clamp((hi - att) / (hi - lo), 0, 1) ** .9;
  }
  const blur = boxBlur(b, size, size, EDGE.radius), rgba = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    const v = clamp(b[i] + EDGE.gain * (b[i] - blur[i]), 0, 1) * 255;
    rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = v; rgba[i * 4 + 3] = 255;
  }
  return rgba;
}

const VERT = `#version 300 es
in vec2 pos; void main() { gl_Position = vec4(pos, 0.0, 1.0); }`;
const FRAG = `#version 300 es
precision highp float; precision highp sampler3D;
uniform sampler3D vol;
uniform vec3 src, iso, right, up, boxLo, boxHi, tcScale, tcOffset;
uniform float fov, size;
out vec4 color;
vec2 pack(float v) { v = clamp(v, 0.0, 0.99998); float hi = floor(v * 255.0) / 255.0; return vec2(hi, fract((v - hi) * 255.0) * 255.0 / 255.0); }
void main() {
  vec2 f = gl_FragCoord.xy / size;                // f.y counts from the image top (rows are read top first)
  vec3 p = iso + right * ((f.x - 0.5) * fov) + up * ((0.5 - f.y) * fov);
  vec3 d = normalize(p - src);
  vec3 inv = 1.0 / (d + vec3(1e-6));
  vec3 t0 = (boxLo - src) * inv, t1 = (boxHi - src) * inv;
  vec3 tn = min(t0, t1), tf = max(t0, t1);
  float a = max(max(tn.x, tn.y), tn.z), b = min(min(tf.x, tf.y), tf.z);
  float att = 0.0, blood = 0.0;
  for (int i = 0; i < 480; i++) {
    float t = a + (float(i) + 0.5) * ${STEP_MM.toFixed(2)};
    if (t > b) break;
    vec2 s = texture(vol, (src + d * t) * tcScale + tcOffset).rg;
    att += s.r; blood += s.g;
  }
  att *= ${(STEP_MM * MU_MAX * MU_WATER).toFixed(6)} / 10.0;   // log attenuation / 10
  blood *= ${STEP_MM.toFixed(2)} / 200.0;                     // opacifiable blood path (mm) / 200
  color = vec4(pack(att), pack(blood));
}`;

function shader(gl, type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
  return s;
}

/**
 * WebGL2 renderer of the ray integrals. Browser only; throws when WebGL2 or 3D textures are missing.
 * render(angle) returns a Float32Array [attenuation, blood mm] per pixel, rows from the image top.
 */
export function createDrr(doc, vol, size = IMAGE_PX) {
  const canvas = doc.createElement('canvas'); canvas.width = canvas.height = size;
  const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false });
  if (!gl) throw new Error('WebGL2 unavailable');
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl, gl.VERTEX_SHADER, VERT)); gl.attachShader(program, shader(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'link');
  gl.useProgram(program);
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'pos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_3D, tex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage3D(gl.TEXTURE_3D, 0, gl.RG8, vol.dims.x, vol.dims.y, vol.dims.z, 0, gl.RG, gl.UNSIGNED_BYTE, vol.data);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_3D, k, v);
  const target = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, target); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
  gl.bindTexture(gl.TEXTURE_3D, tex);
  const u = name => gl.getUniformLocation(program, name);
  const { x: X, y: Y, z: Z } = vol.dims, sp = vol.spacing;
  gl.uniform3f(u('boxLo'), -.5 * sp.x, -.5 * sp.y, -.5 * sp.z);
  gl.uniform3f(u('boxHi'), (X - .5) * sp.x, (Y - .5) * sp.y, (Z - .5) * sp.z);
  gl.uniform3f(u('tcScale'), 1 / (X * sp.x), 1 / (Y * sp.y), 1 / (Z * sp.z));
  gl.uniform3f(u('tcOffset'), .5 / X, .5 / Y, .5 / Z);
  gl.uniform3f(u('iso'), ...ISO); gl.uniform1f(u('fov'), FOV_MM); gl.uniform1f(u('size'), size);
  gl.uniform1i(u('vol'), 0);
  const bytes = new Uint8Array(size * size * 4);
  return {
    size,
    render(angle) {
      const { source, right, up } = carmBasis(angle);
      gl.uniform3f(u('src'), ...source); gl.uniform3f(u('right'), ...right); gl.uniform3f(u('up'), ...up);
      gl.viewport(0, 0, size, size); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
      const out = new Float32Array(size * size * 2);
      for (let i = 0; i < size * size; i++) {
        out[i * 2] = ((bytes[i * 4] + bytes[i * 4 + 1] / 255) / 255) * 10;
        out[i * 2 + 1] = ((bytes[i * 4 + 2] + bytes[i * 4 + 3] / 255) / 255) * 200;
      }
      return out;
    },
    destroy() { gl.getExtension('WEBGL_lose_context')?.loseContext(); }
  };
}

const CACHE_ANGLES = 16;
const ctBase = () => `${import.meta.env?.BASE_URL || '/'}ct-data/${G.case}/`;

/**
 * Lazy CT fluoroscopy for the console: start() fetches the CT once; image(angle, contrast) returns
 * a canvas (or null until ready). Ray integrals are cached per angle, the windowed image per angle
 * and contrast step. status: 'idle' | 'loading' | 'ready' | 'failed'. Browser only.
 */
export function createCtFluoro(doc, { onReady = () => {}, baseUrl = null } = {}) {
  let status = 'idle', drr = null, error = null;
  const integrals = new Map(), images = new Map();
  const remember = (map, key, value) => { map.set(key, value); if (map.size > CACHE_ANGLES) map.delete(map.keys().next().value); return value; };
  async function load() {
    try {
      const ct = await loadCtCase(baseUrl || ctBase());
      drr = createDrr(doc, attenuationVolume(ct));
      status = 'ready'; onReady();
    } catch (e) { status = 'failed'; error = e; onReady(); }
  }
  return {
    get status() { return status; },
    get error() { return error; },
    start() { if (status === 'idle') { status = 'loading'; load(); } },
    image(angle, contrast = 0) {
      if (status !== 'ready') return null;
      const a = clampCarm(angle), c = Math.round(clamp(contrast, 0, 1) * 20) / 20, key = `${a}:${c}`;
      if (images.has(key)) return images.get(key);
      const ray = integrals.get(a) || remember(integrals, a, drr.render(a));
      const canvas = doc.createElement('canvas'); canvas.width = canvas.height = drr.size;
      canvas.getContext('2d').putImageData(new ImageData(fluoroPixels(ray, drr.size, c), drr.size, drr.size), 0, 0);
      return remember(images, key, canvas);
    },
    destroy() { drr?.destroy(); integrals.clear(); images.clear(); }
  };
}

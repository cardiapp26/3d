// Renders the basal (valve-plane) view of the app's 3D heart for the VES
// workbook atlas and prints the hotspot table for ves-loc-map.js.
// Usage: npm run dev, then
//   node scripts/eps/render-ves-atlas.cjs            (writes src/eps/assets/ves-basal-3d.webp)
// Needs python3 with Pillow (alpha-bbox crop) and cwebp on PATH.
// The atria, great vessels and the thorax are hidden; the camera looks at the
// ventricular base from above. OrbitControls keeps its own target, so the view
// is oblique rather than a true top-down projection: hotspots are projected
// through the same camera, so they stay registered to the image.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const APP = (process.env.APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
const OUT = path.resolve(__dirname, '../../src/eps/assets/ves-basal-3d.webp');
const WIDTH = 720;
const PAD = 12;
const HIDDEN = ['thorax', 'diaphragm', 'vertebrae', 'phrenic', 'flow', 'la', 'ra', 'laa', 'svc', 'ivc', 'pv', 'lspv', 'lipv', 'rspv', 'ripv', 'sa', 'bachmann', 'crista-terminalis', 'eustachian-valve', 'chiari-network', 'aorta', 'pa'];
// Mesh names whose projected centres anchor the teaching regions (ves-loc-model.js ids).
const ANCHORS = {
  'rvot-septal': ['Right semilunar leaflet of pulmonary valve', 'Right coronary leaflet'],
  'rvot-free': ['Anterior semilunar leaflet of pulmonary valve', 'Right ventricle'],
  'lvot-cusp': ['Left coronary leaflet', 'Right coronary leaflet', 'Non-coronary leaflet'],
  'lv-summit': ['Left coronary artery', 'Anterior interventricular artery'],
  'para-his': ['Bundle of His'],
  tricuspid: ['Inferior leaflet of right atrioventricular valve'],
  mitral: ['Great cardiac vein', 'Anterior mitral leaflet (schematic)'],
  crux: ['Middle cardiac vein', 'Coronary sinus']
};

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 2 });
  const tmpPng = path.join(fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'ves-atlas-')), 'basal.png');
  try {
    await page.goto(`${APP}/?lang=en`);
    await page.waitForFunction(() => window.heart && window.heart.getState, null, { timeout: 60000 });
    await page.evaluate(async () => { await window.heart.ready; });
    const projected = await page.evaluate(async (hidden) => {
      const h = window.heart;
      for (const layer of hidden) h.setLayer(layer, false);
      h.setBeating(false);
      let cam = null; h.scene.traverse(o => { if (o.isCamera && !cam) cam = o; });
      h.setView('anterior', false);
      await new Promise(r => setTimeout(r, 300));
      const fit = cam.position.clone(); fit.y -= .1; fit.z -= 9.3;   // the anterior preset is fitCenter + (0, .1, 9.3)
      cam.up.set(0, 0, 1);
      cam.position.set(fit.x, fit.y + 8.5, fit.z + 0.001);
      cam.lookAt(fit);
      cam.updateMatrixWorld(true);
      h.setOpacity(1);
      await new Promise(r => setTimeout(r, 1500));
      const points = {};
      for (const s of h.getState().structures) {
        if (!s.visible) continue;
        const v = new cam.position.constructor((s.bounds.min[0] + s.bounds.max[0]) / 2, (s.bounds.min[1] + s.bounds.max[1]) / 2, (s.bounds.min[2] + s.bounds.max[2]) / 2);
        v.project(cam);
        points[s.name] = [(v.x + 1) / 2, (1 - v.y) / 2];
      }
      return points;
    }, HIDDEN);
    await page.addStyleTag({ content: '*{background:transparent!important;box-shadow:none!important} body *{visibility:hidden!important} canvas{visibility:visible!important}' });
    await page.waitForTimeout(500);
    const canvas = page.locator('#viewport canvas').first();
    await canvas.screenshot({ path: tmpPng, omitBackground: true });
    // Crop to the alpha bounding box, resize to WIDTH, encode as WebP; print the bbox in canvas fractions.
    const bbox = JSON.parse(execFileSync('python3', ['-c', `
import sys, json
from PIL import Image
im = Image.open(sys.argv[1]); w, h = im.size
l, t, r, b = im.getbbox(); pad = ${PAD}
l, t, r, b = max(0, l - pad), max(0, t - pad), min(w, r + pad), min(h, b + pad)
crop = im.crop((l, t, r, b)); scale = ${WIDTH} / crop.width
crop = crop.resize((${WIDTH}, round(crop.height * scale)), Image.LANCZOS)
crop.save(sys.argv[2])
print(json.dumps({ 'l': l / w, 't': t / h, 'r': r / w, 'b': b / h, 'w': crop.width, 'h': crop.height }))`, tmpPng, tmpPng.replace('.png', '-crop.png')], { encoding: 'utf8' }));
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    execFileSync('cwebp', ['-quiet', '-q', '88', '-alpha_q', '90', tmpPng.replace('.png', '-crop.png'), '-o', OUT]);
    // Hotspots: mean of the anchor projections, expressed in image pixels.
    const toImage = ([x, y]) => [((x - bbox.l) / (bbox.r - bbox.l)) * bbox.w, ((y - bbox.t) / (bbox.b - bbox.t)) * bbox.h];
    const hotspots = Object.fromEntries(Object.entries(ANCHORS).map(([id, names]) => {
      const pts = names.map(n => { if (!projected[n]) throw new Error(`missing mesh ${n}`); return toImage(projected[n]); });
      return [id, pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]).map(v => Math.round(v))];
    }));
    const landmarks = Object.fromEntries(Object.entries(projected).map(([n, p]) => [n, toImage(p).map(v => Math.round(v))]));
    console.log(JSON.stringify({ image: path.relative(process.cwd(), OUT), size: [bbox.w, bbox.h], hotspots, landmarks }, null, 1));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });

// Renders the app's 3D atlas under fluoroscopy at RAO 30 and LAO 40 for the CSP implant console
// and writes the geometry that registers the console's lead to those images.
// Usage: npm run dev, then
//   node scripts/eps/render-csp-fluoro.cjs
// Writes src/eps/assets/csp-fluoro-rao.webp, csp-fluoro-lao.webp and
// src/eps/csp/csp-atlas-geometry.mjs. Needs python3 with Pillow and cwebp on PATH.
//
// The atlas draws fluoroscopy as a material swap (multiply-blended grey densities). Leads,
// contours and contrast-filled coronaries are off: the console draws its own sheath and lead,
// projected through the same camera matrix, so both views stay consistent with the 3D anatomy.
// Landmarks are measured on the atlas meshes with its own helpers (septalPairs, sharedRim).
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const APP = (process.env.APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
const ASSETS = path.resolve(__dirname, '../../src/eps/assets');
const GEOMETRY = path.resolve(__dirname, '../../src/eps/csp/csp-atlas-geometry.mjs');
const SIZE = 640;                       // output image side (px)
const VIEWS = { rao: [-30, 0], lao: [40, 0] };
const LEVELS = 21;                      // septal sites from the His (0) to the apex (1)

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1100 }, deviceScaleFactor: 2 });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'csp-fluoro-'));
  try {
    await page.goto(`${APP}/?lang=en`);
    await page.waitForFunction(() => window.heart && window.heart.getState, null, { timeout: 60000 });
    await page.evaluate(async () => { await window.heart.ready; });
    const anatomy = await page.evaluate(async (levels) => {
      const { septalPairs, septalSiteNear, sharedRim, centroid } = await import('/src/mesh-utils.js');
      const h = window.heart;
      const worldVerts = mesh => {
        const p = mesh.geometry.attributes.position, out = [];
        mesh.updateMatrixWorld(true);
        for (let i = 0; i < p.count; i++) out.push(new mesh.position.constructor().fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld));
        return out;
      };
      const byName = name => { let m = null; h.scene.traverse(o => { if (o.name === name && o.isMesh && !m) m = o; }); return m; };
      const rv = byName('Right ventricle'), lv = byName('Left ventricle'), ra = byName('Right atrium'), his = byName('Bundle of His');
      const rvVerts = worldVerts(rv), lvVerts = worldVerts(lv);
      his.updateMatrixWorld(true);
      const hisEnd = his.geometry.parameters.path.getPointAt(1).clone().applyMatrix4(his.matrixWorld);
      const apex = rvVerts.reduce((b, v) => (v.y < b.y ? v : b)).clone();
      const tv = centroid(sharedRim(ra, rv));
      let lead = null; h.scene.traverse(o => { if (o.name === 'CSP / LBBAP Physiological Lead') lead = o; });
      const tube = lead.children.find(c => c.geometry?.type === 'TubeGeometry');
      tube.updateMatrixWorld(true);
      const along = t => tube.geometry.parameters.path.getPoint(t).clone().applyMatrix4(tube.matrixWorld);
      const pairs = septalPairs(rvVerts, lvVerts);
      const septum = Array.from({ length: levels }, (_, i) => {
        const level = i / (levels - 1), site = septalSiteNear(pairs, hisEnd.clone().lerp(apex, level));
        return { level, rv: site.rvSide.toArray(), lv: site.lvSide.toArray() };
      });
      const r3 = v => v.toArray().map(x => Math.round(x * 1e4) / 1e4);
      return {
        his: r3(hisEnd), apex: r3(apex), tv: r3(tv), svc: r3(along(0)), highSvc: r3(along(.12)), ra: r3(along(.38)),
        septum: septum.map(s => ({ level: s.level, rv: s.rv.map(x => Math.round(x * 1e4) / 1e4), lv: s.lv.map(x => Math.round(x * 1e4) / 1e4) })),
        rvSample: rvVerts.filter((_, i) => i % 7 === 0).map(v => v.toArray())
      };
    }, LEVELS);

    await page.evaluate(() => {
      const h = window.heart;
      h.setBeating(false); h.setFluoroscopy(true); h.setFluoroContours(false);
      h.setCoronaryContrast?.(0); h.setFlowVisible?.(false);
    });
    await page.addStyleTag({ content: 'body *{visibility:hidden!important} #viewport, #viewport canvas{visibility:visible!important}' });
    const views = {};
    for (const [id, [laoRao, craCau]] of Object.entries(VIEWS)) {
      const shot = await page.evaluate(async ({ laoRao, craCau, rvSample, keys }) => {
        const h = window.heart;
        h.setAngioProjection(laoRao, craCau, false);
        await new Promise(r => setTimeout(r, 900));
        let cam = null; h.scene.traverse(o => { if (o.isCamera && !cam) cam = o; });
        cam.updateMatrixWorld(true);
        const canvas = document.querySelector('#viewport canvas'), box = canvas.getBoundingClientRect();
        const m = cam.projectionMatrix.clone().multiply(cam.matrixWorldInverse);
        const V = cam.position.constructor;
        const px = a => { const v = new V(...a).applyMatrix4(m); return [(v.x + 1) / 2 * box.width, (1 - v.y) / 2 * box.height]; };
        // Square crop around the right heart and the septum (the working field), in canvas CSS px.
        const pts = [...keys.map(px), ...rvSample.filter((_, i) => i % 3 === 0).map(px)];
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
        const side = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 1.35;
        return { matrix: Array.from(m.elements).map(x => Math.round(x * 1e6) / 1e6), canvas: { w: box.width, h: box.height }, crop: { l: cx - side / 2, t: cy - side / 2, side } };
      }, { laoRao, craCau, rvSample: anatomy.rvSample, keys: [anatomy.his, anatomy.apex, anatomy.tv, anatomy.highSvc, anatomy.ra] });
      const png = path.join(tmp, `${id}.png`);
      await page.locator('#viewport canvas').first().screenshot({ path: png });
      const out = path.join(tmp, `${id}-crop.png`);
      const { crop, canvas } = shot;
      execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageOps
im = Image.open(sys.argv[1]).convert('RGB'); k = im.width / ${canvas.w}
l, t, s = ${crop.l} * k, ${crop.t} * k, ${crop.side} * k
bg = Image.new('RGB', (round(s), round(s)), im.getpixel((2, 2)))
bg.paste(im, (round(-l), round(-t)))
g = ImageOps.grayscale(bg).resize((${SIZE}, ${SIZE}), Image.LANCZOS)
g.save(sys.argv[2])`, png, out]);
      execFileSync('cwebp', ['-quiet', '-q', '86', out, '-o', path.join(ASSETS, `csp-fluoro-${id}.webp`)]);
      views[id] = { ...shot, laoRao, craCau };
    }
    // RV outline per view (convex hull of the projected RV vertices, in image fractions) for the contrast puff.
    const project = (view, p) => {
      const e = view.matrix, [x, y, z] = p, w = e[3] * x + e[7] * y + e[11] * z + e[15];
      const nx = (e[0] * x + e[4] * y + e[8] * z + e[12]) / w, ny = (e[1] * x + e[5] * y + e[9] * z + e[13]) / w;
      return [((nx + 1) / 2 * view.canvas.w - view.crop.l) / view.crop.side, ((1 - ny) / 2 * view.canvas.h - view.crop.t) / view.crop.side];
    };
    const hull = pts => {
      const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const lower = [], upper = [];
      for (const q of p) { while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), q) <= 0) lower.pop(); lower.push(q); }
      for (const q of p.reverse()) { while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), q) <= 0) upper.pop(); upper.push(q); }
      return [...lower.slice(0, -1), ...upper.slice(0, -1)].map(([x, y]) => [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4]);
    };
    for (const view of Object.values(views)) view.rvHull = hull(anatomy.rvSample.map(p => project(view, p)));
    const { rvSample, ...landmarks } = anatomy;
    const body = `/* Generated by scripts/eps/render-csp-fluoro.cjs from the app's 3D atlas (do not edit by hand).
 * Atlas coordinates (units; the normalized atlas has about 3.7 cm per unit). views: the camera
 * matrix (column-major projection x view) with the canvas size and the square crop of each image,
 * so any atlas point projects onto csp-fluoro-<view>.webp; rvHull: the RV outline in image
 * fractions. septum: RV and LV sides of the septum at levels from the His (0) to the RV apex (1). */
export const ATLAS_MM_PER_UNIT = 37;
export const ATLAS_GEOMETRY = Object.freeze(${JSON.stringify({ landmarks, views }, null, 1)});
`;
    fs.writeFileSync(GEOMETRY, body);
    console.log(`wrote ${Object.keys(views).map(v => `csp-fluoro-${v}.webp`).join(', ')} and ${path.relative(process.cwd(), GEOMETRY)}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

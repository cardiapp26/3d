// Renders the anterior view of the app's 3D heart with a transparent background and prints
// normalized screen positions of target meshes. Usage: npm run dev, then
// node scripts/render-pharmacology-heart.cjs out.png ; crop to the alpha bbox (+12 px) and
// save as src/assets/pharmacology-heart.webp (720 px wide). Hotspots in pharmacology-visual.js.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto((process.env.APP || 'http://localhost:5173') + '/?lang=en');
  await page.waitForFunction(() => window.heart && window.heart.getState, null, { timeout: 60000 });
  await page.evaluate(async () => { await window.heart.ready; });
  await page.evaluate(() => {
    for (const l of ['thorax', 'diaphragm', 'vertebrae', 'phrenic', 'flow']) window.heart.setLayer(l, false);
    window.heart.setView('anterior', false);
  });
  await page.waitForTimeout(2500);
  await page.addStyleTag({ content: '*{background:transparent!important;box-shadow:none!important} body *{visibility:hidden!important} canvas{visibility:visible!important}' });
  await page.waitForTimeout(500);
  const canvas = page.locator('canvas').first();
  await canvas.screenshot({ path: process.argv[2], omitBackground: true });
  const box = await canvas.boundingBox();
  const pts = await page.evaluate(() => {
    const h = window.heart; const keys = Object.keys(h);
    let cam = h.camera; const s = h.scene;
    if (!cam) s.traverse(o => { if (o.isCamera && !cam) cam = o; });
    const want = ['Left ventricle','Right atrium','Left atrium','Anterior interventricular artery','Ascending aorta','Aortic arch','Superior vena cava','Right coronary artery','Sinoatrial node','Atrioventricular node','Pulmonary trunk'];
    const out = { keys, cam: !!cam };
    const all = []; s.traverse(o => { if (o.name) all.push(o.name); });
    out.extra = [];
    if (!cam) return out;
    const V = cam.position.constructor;
    s.traverse(o => {
      if (!o.isMesh || !want.includes(o.name)) return;
      o.geometry.computeBoundingBox(); const c = new V(); o.geometry.boundingBox.getCenter(c); o.localToWorld(c); c.project(cam);
      out[o.name] = [(c.x + 1) / 2, (1 - c.y) / 2];
    });
    return out;
  });
  console.log(JSON.stringify(pts));
  await browser.close();
})();

/**
 * Echo stage 0 audit (research/TTE_TEE_ENTEGRASYON_RAPORU.md, section 10):
 * the atlas file checksum against src/atlas.js, the topology of every
 * sectioned structure (boundary loops: open or closed surface, welded edge
 * use) and, for each starting view at its preset, how many cut contours are
 * closed or open per structure. Writes research/echo/topology-report.json.
 * Usage: APP_URL=... node scripts/echo-audit.cjs
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const path = require('node:path');

const APP = process.env.APP_URL || 'http://127.0.0.1:5173';
const ROOT = path.join(__dirname, '..');

(async () => {
  const glb = readFileSync(path.join(ROOT, 'public/models/cardiovascular.glb'));
  const sha256 = createHash('sha256').update(glb).digest('hex');
  const expected = /ATLAS_SHA256 = '([0-9a-f]{64})'/.exec(readFileSync(path.join(ROOT, 'src/atlas.js'), 'utf8'))[1];
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage();
    await page.goto(`${APP}/`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    const audit = await page.evaluate(async () => {
      const { measureEchoAnatomy, echoItems, surfaceExit, chestSurface, ECHO_STRUCTURES } = await import('/src/echo-anatomy.js');
      const V = await import('/src/echo-views.js');
      const { tteFrame, teeFrame } = await import('/src/echo-probe.js');
      const { sectionMeshes } = await import('/src/echo-section.js');
      const { boundaryLoops } = await import('/src/mesh-utils.js');
      const h = window.heart;
      const gm = id => h.getMeshes(id).filter(m => !m.userData.micro);
      const topology = {};
      for (const s of ECHO_STRUCTURES) for (const id of s.ids) for (const mesh of gm(id)) {
        const g = mesh.geometry;
        topology[mesh.name] = { structure: s.id, vertices: g.attributes.position.count, triangles: g.index ? g.index.count / 3 : g.attributes.position.count / 3, boundaryLoops: boundaryLoops(mesh, 3).length, surface: boundaryLoops(mesh, 3).length ? 'open' : 'closed' };
      }
      return h.withRestPose(() => {
        const A = measureEchoAnatomy({ getMeshes: gm });
        const hull = ['lv', 'rv', 'la', 'ra', 'aorta', 'pa'].flatMap(gm);
        const items = echoItems(gm);
        const path = V.teePath(A);
        const views = {};
        const record = (id, frame) => {
          const s = sectionMeshes(items, frame);
          views[id] = { closed: s.stats.closed, open: s.stats.open, byStructure: Object.fromEntries(Object.entries(s.structures).map(([k, v]) => [k, { closed: v.closed, open: v.open, length: +v.length.toFixed(2) }])) };
        };
        for (const v of V.TTE_VIEWS) record(v.id, tteFrame(V.tteBase(v.id, A, (p, d) => surfaceExit(p, d, hull), chestSurface(hull)), {}));
        for (const v of V.TEE_VIEWS) record(v.id, teeFrame(path, V.teePreset(v.id, A, path)));
        return { topology, views, landmarks: { lvLengthUnits: +A.lvLength.toFixed(3), oesophagusPath: A.oesophagusPath.map(p => p.map(x => +x.toFixed(3))) } };
      });
    });
    const report = {
      generated: new Date().toISOString().slice(0, 10),
      atlas: { file: 'public/models/cardiovascular.glb', sha256, matchesSrcAtlas: sha256 === expected, licence: 'unverified (README.md): no publication or distribution of the echo module until resolved' },
      coordinates: { x: 'patient left', y: 'superior', z: 'anterior', unit: 'atlas unit, about 34 mm (research/LAA_BACHMANN.md section 2); not a validated physical scale' },
      ...audit
    };
    mkdirSync(path.join(ROOT, 'research/echo'), { recursive: true });
    writeFileSync(path.join(ROOT, 'research/echo/topology-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    const open = Object.values(audit.topology).filter(t => t.surface === 'open').length;
    console.log(`atlas sha256 ${sha256.slice(0, 12)} matches src/atlas.js: ${report.atlas.matchesSrcAtlas}; ${Object.keys(audit.topology).length} meshes, ${open} open surfaces; views:`,
      Object.entries(audit.views).map(([id, v]) => `${id} ${v.closed}c/${v.open}o`).join(', '));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });

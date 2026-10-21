/**
 * Supra-aortic branches and pulmonary artery branch length on the real atlas
 * (main 3D page, the angiography 3D page that shares heart.js, and the ECG
 * Da Vinci atlas): branch origins lie on the arch surface, the proximal
 * rings never enter the lumen, the BCT daughters leave its end, the order
 * runs right/anterior to left/posterior, hover and click name each branch,
 * and the trimmed LPA/RPA end within PA_BRANCH_MAX_REACH of the bifurcation.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const APP = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

// Geometry measured in the page (vite serves the modules).
async function measure(page) {
  return page.evaluate(async () => {
    const THREE = await import('/node_modules/three/build/three.module.js');
    const { archCenterline } = await import('/src/aortic-arch-branches.js');
    const { pulmonaryBranchTrims, trimmedReach, PA_BRANCH_MAX_REACH } = await import('/src/pulmonary-trims.js');
    const h = window.heart;
    const verts = (m) => { const p = m.geometry.attributes.position; return Array.from({ length: p.count }, (_, i) => new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i))); };
    const arch = h.getMeshes('aorta').find((m) => m.name === 'Aortic arch');
    const pos = arch.geometry.attributes.position, idx = arch.geometry.index.array;
    const tris = [];
    for (let t = 0; t < idx.length; t += 3) tris.push(new THREE.Triangle(...[0, 1, 2].map((k) => new THREE.Vector3(pos.getX(idx[t + k]), pos.getY(idx[t + k]), pos.getZ(idx[t + k])))));
    const chain = archCenterline(arch.geometry);
    const closest = (v) => { let best = null, d = Infinity; const q = new THREE.Vector3(); for (const tri of tris) { tri.closestPointToPoint(v, q); const e = q.distanceTo(v); if (e < d) { d = e; best = q.clone(); } } return { point: best, distance: d }; };
    const axisPoint = (v) => chain.reduce((a, r) => (r.c.distanceTo(v) < a.distanceTo(v) ? r.c : a), chain[0].c);
    // Signed wall distance: negative when the point is inside the arch lumen.
    const wall = (v) => { const { point, distance } = closest(v); const c = axisPoint(point); return v.distanceTo(c) < point.distanceTo(c) ? -distance : distance; };
    const RING = 17;
    const out = { branches: {} };
    for (const id of ['brachiocephalic', 'lcca', 'lsca', 'rcca', 'rsca']) {
      const m = h.getMeshes(id)[0];
      if (!m) { out.branches[id] = null; continue; }
      const v = verts(m), d = m.userData;
      const base = v.slice(0, RING).map(wall);
      const proximal = v.slice(RING, RING * 11).map(wall);
      out.branches[id] = { origin: d.origin, end: d.end, radius: d.radius, parent: d.parentId, followsId: d.followsId, layer: d.layer, provenance: d.provenance, originWall: wall(new THREE.Vector3(...d.origin)), baseMax: Math.max(...base.map(Math.abs)), proximalMin: Math.min(...proximal), visible: m.visible };
    }
    const pa = h.getMeshes('pa'), named = (n) => pa.find((m) => m.name === n);
    const { bifurcation, planes } = pulmonaryBranchTrims((n) => (named(n) ? verts(named(n)) : []));
    out.pa = {};
    for (const name of ['Left pulmonary artery', 'Right pulmonary artery']) {
      const m = named(name), plane = m.material.clippingPlanes?.[0] || null;
      out.pa[name] = { untrimmed: trimmedReach(verts(m), null, bifurcation), reach: trimmedReach(verts(m), plane, bifurcation), clipped: Boolean(plane), samePlane: plane ? plane.normal.distanceTo(planes.get(name).normal) < 1e-6 && Math.abs(plane.constant - planes.get(name).constant) < 1e-6 : !planes.has(name) };
    }
    out.maxReach = PA_BRANCH_MAX_REACH;
    out.bifurcationIntact = named('Bifurcation of pulmonary trunk')?.material.clippingPlanes?.length === 0 && named('Pulmonary trunk')?.material.clippingPlanes?.length === 0;
    return out;
  });
}

function checkGeometry(g, where) {
  for (const id of ['brachiocephalic', 'lcca', 'lsca']) {
    const b = g.branches[id];
    assert.ok(b, `${where}: ${id} built`);
    assert.equal(b.parent, 'aorta');
    assert.ok(Math.abs(b.originWall) < 0.01, `${where}: ${id} origin on the arch surface (${b.originWall.toFixed(4)})`);
    assert.ok(b.baseMax < 0.012, `${where}: ${id} base ring on the arch wall, no gap (${b.baseMax.toFixed(4)})`);
    assert.ok(b.proximalMin > -0.006, `${where}: ${id} proximal rings outside the lumen (${b.proximalMin.toFixed(4)})`);
  }
  for (const id of ['rcca', 'rsca']) {
    const b = g.branches[id], bct = g.branches.brachiocephalic;
    const gap = Math.hypot(...b.origin.map((v, i) => v - bct.end[i]));
    assert.ok(gap < bct.radius, `${where}: ${id} leaves the BCT end (${gap.toFixed(3)})`);
  }
  const [bct, lcca, lsca] = ['brachiocephalic', 'lcca', 'lsca'].map((id) => g.branches[id].origin);
  assert.ok(bct[2] > lcca[2] && lcca[2] > lsca[2], `${where}: origins run anterior to posterior`);
  assert.ok(bct[0] < lcca[0] && lcca[0] < lsca[0], `${where}: origins run right to left`);
  const r = (id) => g.branches[id].radius;
  assert.ok(r('brachiocephalic') > r('lsca') && r('lsca') > r('lcca') && r('rsca') > r('rcca'), `${where}: calibres`);
  for (const [name, p] of Object.entries(g.pa)) {
    assert.ok(p.samePlane, `${where}: ${name} uses the shared hilar trim`);
    assert.ok(p.reach <= g.maxReach, `${where}: ${name} ends ${p.reach.toFixed(2)} from the bifurcation (max ${g.maxReach}, untrimmed ${p.untrimmed.toFixed(2)})`);
  }
  assert.ok(g.pa['Left pulmonary artery'].clipped, `${where}: LPA trimmed`);
  assert.ok(g.bifurcationIntact, `${where}: trunk and bifurcation intact`);
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${APP}/?lang=tr#/mode/anatomy`);
    await page.waitForSelector('#viewport[data-model-ready=true]', { timeout: 60000 });
    const g = await measure(page);
    checkGeometry(g, 'main');
    for (const id of Object.keys(g.branches)) {
      assert.equal(g.branches[id].followsId, 'aorta');
      assert.equal(g.branches[id].provenance, 'schematic');
      assert.ok(g.branches[id].visible, `${id} visible in the anatomy mode`);
    }
    // Hover and click name each branch (TR).
    await page.waitForFunction(() => document.querySelector('#viewport')?.dataset.cameraSettled !== 'false');
    await page.waitForTimeout(300);
    const expected = { brachiocephalic: /Brakiyosefalik trunkus/, lcca: /Sol ana karotis/, lsca: /Sol subklavyen/, rcca: /Sağ ana karotis/, rsca: /Sağ subklavyen/ };
    for (const [id, name] of Object.entries(expected)) {
      // A click flies the camera to the structure: wait until the projected point stops moving.
      await page.waitForFunction(async () => {
        const a = window.heart.screenPoint([0, 2.5, -0.6]);
        await new Promise((r) => setTimeout(r, 150));
        const b = window.heart.screenPoint([0, 2.5, -0.6]);
        return Math.hypot(a.x - b.x, a.y - b.y) < 0.5;
      }, undefined, { timeout: 10000 });
      const points = await page.evaluate((key) => {
        const m = window.heart.getMeshes(key)[0], p = m.geometry.attributes.position, ring = 17;
        return [0.85, 0.7, 0.55, 0.4].map((f) => { const s = Math.round(40 * f) * ring, c = [0, 0, 0]; for (let j = 0; j < 16; j++) { c[0] += p.getX(s + j) / 16; c[1] += p.getY(s + j) / 16; c[2] += p.getZ(s + j) / 16; } return window.heart.screenPoint(c); });
      }, id);
      let hit = null;
      const seen = [];
      for (const p of points) {
        await page.mouse.move(p.x, p.y);
        await page.waitForTimeout(120);
        const text = await page.locator('#hover-badge').textContent();
        seen.push(text);
        if (name.test(text)) { hit = p; break; }
      }
      assert.ok(hit, `hover names ${id} (saw: ${seen.join(' | ')})`);
      const before = await page.locator('#hover-badge').textContent();
      await page.mouse.click(hit.x, hit.y);
      await page.waitForTimeout(120);
      assert.match(await page.locator('#structure-title').textContent(), name, `click names ${id} (title: ${await page.locator('#structure-title').textContent()}, hover before: ${before}, at ${hit.x},${hit.y})`);
      await page.mouse.move(5, 5);
    }
    // Hiding the aorta hides its branches.
    const hidden = await page.evaluate(() => { window.heart.setLayer('aorta', false); const v = window.heart.getMeshes('lcca')[0].visible; window.heart.setLayer('aorta', true); return v; });
    assert.equal(hidden, false, 'branches follow the aorta toggle');

    // Angiography 3D page: same heart.js, same geometry.
    await page.goto(`${APP}/angio/3d/#/mode/angiography`);
    await page.waitForSelector('#viewport[data-model-ready=true]', { timeout: 60000 });
    checkGeometry(await measure(page), 'angio-3d');

    // ECG Da Vinci atlas: branches added and both PA branches trimmed in the same frame.
    await page.goto(`${APP}/ecg/?lang=tr`);
    await page.locator('[data-davinci-tab]').click();
    await page.locator('.da-atlas[data-loaded=true]').waitFor({ timeout: 30000 });
    const da = await page.locator('.da-atlas').evaluate((e) => ({ branches: e.dataset.archBranches, trims: e.dataset.paTrims }));
    assert.equal(da.branches, 'brachiocephalic,lcca,lsca,rcca,rsca', 'Da Vinci shows the arch branches');
    assert.match(da.trims, /Left pulmonary artery/, 'Da Vinci trims the LPA');
    assert.deepEqual(errors, []);
    console.log(`PASS arch-branches-browser: origins on the arch wall (max ${Math.max(...['brachiocephalic', 'lcca', 'lsca'].map((id) => g.branches[id].baseMax)).toFixed(4)}), order and calibres, hover/click names, LPA ${g.pa['Left pulmonary artery'].reach.toFixed(2)} / RPA ${g.pa['Right pulmonary artery'].reach.toFixed(2)} from the bifurcation (untrimmed LPA ${g.pa['Left pulmonary artery'].untrimmed.toFixed(2)}), main + angio 3D + Da Vinci`);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });

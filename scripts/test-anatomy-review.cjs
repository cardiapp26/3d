/**
 * Anatomy review fixes in the browser: RV and LV modes under Anatomy (one
 * chamber with its valves), the Eustachian valve and Chiari network in the RA
 * mode, "Coumadin ridge" and the posterior tricuspid leaflet naming, named
 * coronary side branches (D1 proximal to S1; hovering or clicking a branch
 * names it) and TTE presets without the pulmonary valve / PA / SVC where the
 * textbook view has none.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const APP = (process.env.APP_URL || 'http://localhost:5173/').replace(/\/$/, '');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const open = async (hash) => {
      await page.goto(`${APP}/${hash}`);
      await page.waitForSelector('#viewport[data-model-ready=true]');
      await page.waitForTimeout(400);
    };
    const allLabels = async () => {
      await page.evaluate(() => { window.heart.setSceneLabelMode('all'); });
      await page.waitForTimeout(200);
      return page.locator('.scene-label:not([hidden])').allTextContents();
    };
    const visibleIds = () => page.evaluate(() => [...new Set(window.heart.getState().structures.filter((s) => s.visible).map((s) => s.valveId))].sort());

    // 1. Anatomy menu order and the two ventricle modes.
    await open('#/mode/anatomy');
    const anatomyMenu = await page.locator('[data-mode-group=modeGroupAnatomy] .mode-group-menu [data-mode]').evaluateAll((els) => els.map((e) => e.dataset.mode));
    assert.deepEqual(anatomyMenu, ['anatomy', 'atria', 'ra', 'rv', 'lv', 'defects'], 'RV and LV sit under Anatomy');
    await open('#/mode/rv');
    assert.match(await page.locator('#scene-context').textContent(), /^04 · Sağ ventrikül/);
    assert.deepEqual(await visibleIds(), ['moderator-band', 'pulmonary-valve', 'rv', 'rv-papillary', 'tricuspid', 'tricuspid-annulus'], 'RV mode shows the RV with its valves and the moderator band');
    // The moderator band runs along the RBB from the septum to the anterior papillary base.
    const band = await page.evaluate(() => {
      const h = window.heart, path = h.getMeshes('moderator-band')[0].userData.path;
      const rbb = h.scene.getObjectByName('Right bundle branch');
      const pts = []; const p = rbb.geometry.attributes.position;
      for (let i = 0; i < p.count; i += 7) pts.push([p.getX(i), p.getY(i), p.getZ(i)]);
      const near = (q) => Math.min(...pts.map((r) => Math.hypot(q[0] - r[0], q[1] - r[1], q[2] - r[2])));
      const len = path.slice(1).reduce((s, q, k) => s + Math.hypot(q[0] - path[k][0], q[1] - path[k][1], q[2] - path[k][2]), 0);
      return { len, ends: [near(path[0]), near(path[path.length - 1])] };
    });
    assert.ok(band.len > 0.3 && band.len < 1, `moderator band length (${band.len.toFixed(2)})`);
    assert.ok(band.ends.every((d) => d < 0.08), `band ends on the RBB (${band.ends.map((d) => d.toFixed(3))})`);
    assert.equal(await page.locator('#rv-tools').isVisible(), true);
    assert.equal(await page.locator('#layers').isVisible(), false);
    await page.locator('[data-chamber-wall=rv]').fill('40');
    assert.ok((await page.evaluate(() => window.heart.getState().wallCuts.rv)) > 0.39, 'the RV wall slider cuts the RV');
    await page.locator('[data-chamber-focus=tricuspid]').click();
    assert.match(await page.locator('#structure-title').textContent(), /Triküspit/);
    await open('#/mode/lv');
    assert.deepEqual(await visibleIds(), ['lcc', 'lv', 'lv-papillary', 'mitral', 'mitral-annulus', 'ncc', 'rcc'], 'LV mode shows the LV, mitral valve and aortic cusps');
    // A structure of another chamber is not selectable in a chamber mode.
    await page.locator('#structure-select').evaluate((s) => { s.value = 'ra'; s.dispatchEvent(new Event('change')); });
    assert.match(await page.locator('#structure-title').textContent(), /Sol ventrikül/);

    // 2. RA: Eustachian valve and Chiari network, labelled, with focus buttons.
    await open('#/mode/ra');
    const ra = await visibleIds();
    for (const id of ['ra', 'crista-terminalis', 'eustachian-valve', 'chiari-network']) assert.ok(ra.includes(id), `${id} shown in RA mode`);
    const labels = await allLabels();
    assert.ok(labels.includes('Östaki kapağı') && labels.includes('Chiari ağı (varyant)'), `RA labels: ${labels}`);
    await page.locator('[data-chamber-focus=chiari-network]').click();
    assert.match(await page.locator('#structure-title').textContent(), /Chiari ağı/);
    const valve = await page.evaluate(() => {
      const v = window.heart.getMeshes('eustachian-valve')[0].userData;
      const len = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]), 0);
      return { base: len(v.base), height: Math.max(...v.base.map((p, i) => Math.hypot(p[0] - v.edge[i][0], p[1] - v.edge[i][1], p[2] - v.edge[i][2]))) };
    });
    assert.ok(valve.base > 0.4 && valve.base < 1.3, `valve along the caval rim (${valve.base.toFixed(2)})`);
    assert.ok(valve.height > 0.1 && valve.height < 0.25, 'crescent height');

    // 3. Naming.
    await open('#/mode/atria');
    assert.ok((await allLabels()).includes('Coumadin ridge'));
    assert.match(await page.locator('#structure-select option[value=coumadin-ridge]').textContent(), /^Coumadin ridge/);
    assert.match(await page.locator('#structure-select option[value=tricuspid-inferior]').textContent(), /^Posterior triküspit/);

    // 4. Coronary branches: D1 proximal to S1, names on hover and click.
    await open('#/mode/anatomy');
    const order = await page.evaluate(async () => {
      const cb = await import('/src/coronary-branches.js');
      const h = window.heart;
      const lm = h.getMeshes('lm')[0];
      lm.geometry.computeBoundingBox();
      const tree = cb.arteryTree(cb.tubeComponents(h.getMeshes('lad')[0].geometry), lm.geometry.boundingBox.getCenter(lm.position.clone()));
      const lv = h.getMeshes('lv')[0].geometry, rv = h.getMeshes('rv')[0].geometry;
      lv.computeBoundingBox(); rv.computeBoundingBox();
      const toward = lv.boundingBox.getCenter(lm.position.clone()).sub(rv.boundingBox.getCenter(lm.position.clone()));
      const d1 = cb.ladBranchKinds(tree, toward).find((b) => b.kind === 'diagonal').node.arc;
      const septals = cb.tubeComponents(h.getMeshes('septal')[0].geometry).map((c) => cb.takeoffOnTrunk(tree, c));
      return { d1, s1: Math.min(...septals), moves: h.atlasAdjustments().septalReorder, names: h.getMeshes('lad')[0].userData.branches.names.map((n) => n.abbr) };
    });
    assert.ok(order.d1 < order.s1, `D1 (${order.d1.toFixed(2)}) proximal to S1 (${order.s1.toFixed(2)})`);
    assert.ok(order.moves.length >= 1, 'septals moved distal to D1 are recorded as an atlas adjustment');
    assert.ok(order.names.includes('D1') && order.names.includes('D2'), `LAD names: ${order.names}`);
    const target = await page.evaluate(() => {
      const m = window.heart.getMeshes('lad')[0], t = m.userData.branches, pos = m.geometry.attributes.position;
      const k = t.names.findIndex((n) => n.tr === '1. diagonal dal (D1)');
      const verts = [...t.byVertex.keys()].filter((i) => t.byVertex[i] === k);
      const mid = verts[Math.floor(verts.length / 2 / 12) * 12];
      const c = [0, 0, 0];
      for (let j = 0; j < 12; j++) { c[0] += pos.getX(mid + j) / 12; c[1] += pos.getY(mid + j) / 12; c[2] += pos.getZ(mid + j) / 12; }
      return window.heart.screenPoint(c);
    });
    await page.mouse.move(target.x, target.y);
    await page.waitForTimeout(150);
    assert.match(await page.locator('#hover-badge').textContent(), /LAD · 1\. diagonal dal \(D1\)/, 'hover names the branch');
    await page.mouse.click(target.x, target.y);
    await page.waitForTimeout(150);
    assert.match(await page.locator('#structure-title').textContent(), /1\. diagonal dal \(D1\)/, 'click names the branch');
    const rcaNames = await page.evaluate(() => window.heart.getMeshes('rca')[0].userData.branches.names.map((n) => n.abbr));
    assert.ok(rcaNames.includes('Konus') && rcaNames.includes('AM'), `RCA names: ${rcaNames}`);
    const lcxNames = await page.evaluate(() => window.heart.getMeshes('lcx')[0].userData.branches.names.map((n) => n.abbr));
    assert.ok(lcxNames.includes('OM1'), `LCX names: ${lcxNames}`);

    // 4b. Ventricle wall regions: coloured in the LV/RV modes, named on hover; the aortic valve opens in ejection.
    await open('#/mode/lv');
    const lvState = await page.evaluate(() => {
      const m = window.heart.getMeshes('lv')[0];
      return { colours: m.material.vertexColors, names: m.userData.branches.names.map((n) => n.abbr) };
    });
    assert.equal(lvState.colours, true, 'LV mode colours the AHA segments');
    for (let n = 1; n <= 16; n++) assert.ok(lvState.names.includes(String(n)), `segment ${n}`);
    assert.ok(lvState.names.includes('LVOT'));
    await page.locator('#lv-tools [data-ventricle-regions]').uncheck();
    assert.equal(await page.evaluate(() => window.heart.getMeshes('lv')[0].material.vertexColors), false, 'the toggle removes the colours');
    await page.locator('#lv-tools [data-ventricle-regions]').check();
    await open('#/mode/rv');
    const rvNames = await page.evaluate(() => window.heart.getMeshes('rv')[0].userData.branches.names.map((n) => n.key));
    assert.deepEqual(rvNames.sort(), ['rv-anterior', 'rv-apical', 'rv-inferior', 'rv-inlet', 'rv-rvot', 'rv-septal']);
    await open('#/mode/anatomy');
    const aortic = await page.evaluate(() => {
      const h = window.heart;
      const read = () => h.getMeshes('ncc').map((m) => Array.from(m.geometry.attributes.position.array));
      h.seekCycle(0); const shut = read();
      h.seekCycle(0.6); const open = read();
      let max = 0;
      shut.forEach((arr, k) => { for (let i = 0; i < arr.length; i += 3) max = Math.max(max, Math.hypot(arr[i] - open[k][i], arr[i + 1] - open[k][i + 1], arr[i + 2] - open[k][i + 2])); });
      return max;
    });
    assert.ok(aortic > 0.15, `the NCC free edge moves toward the sinus wall in ejection (${aortic.toFixed(2)})`);

    // 5. TTE: no pulmonary trunk or SVC in PLAX, no PA in A2C, no pulmonary valve in A3C.
    await open('#/mode/echo');
    const lengths = await page.evaluate(() => Object.fromEntries(['plax', 'a2c', 'a3c'].map((v) => { window.cardiaEcho.selectView(v); return [v, window.cardiaEcho.getResult()]; })));
    for (const [view, absent] of [['plax', ['pa', 'svc']], ['a2c', ['pa', 'pulmonary-valve']], ['a3c', ['pulmonary-valve']]]) {
      for (const id of absent) assert.ok(!(lengths[view].lengths[id] > 0), `${view} without ${id}`);
      assert.deepEqual(lengths[view].missing, [], `${view} keeps its structures`);
    }
    await page.evaluate(() => window.cardiaEcho.selectView('plax'));
    assert.match(await page.locator('.echo-ice-info').first().textContent(), /pulmoner kapak görülmez/);
    // LV segments and leaflets in the cut (ASE 16-segment model).
    for (const [view, segments] of [['a4c', ['3', '9', '6', '12']], ['a2c', ['4', '10', '1', '7']], ['a3c', ['2', '8', '5', '11']], ['psax-mv', ['1', '2', '3', '4', '5', '6']], ['psax-pm', ['7', '8', '9', '10', '11', '12']]]) {
      await page.evaluate((v) => window.cardiaEcho.selectView(v), view);
      const line = await page.locator('.echo-parts').textContent();
      const lv = (line.match(/LV ([^|]*)/) || [])[1]?.split('·').map((x) => x.trim()) || [];
      for (const n of segments) assert.ok(lv.includes(n), `${view} shows LV segment ${n}: ${line}`);
    }
    await page.evaluate(() => window.cardiaEcho.selectView('a3c'));
    // The box sits in the collapsed display settings.
    await page.locator('[data-echo-control=parts]').evaluate((box) => { box.checked = false; box.dispatchEvent(new Event('change')); });
    assert.equal(await page.locator('.echo-parts').isVisible(), false, 'the parts toggle hides the list');

    // Echo review fixes: no angle on the view buttons, no target hint in a task, a start pose independent of the target.
    await open('#/mode/tee');
    const buttons = await page.locator('[data-echo-view]').allTextContents();
    assert.ok(buttons.length === 10 && buttons.every((t) => !t.includes('°')), `TEE buttons without angles: ${buttons}`);
    for (const seed of [3, 11]) {
      const task = await page.evaluate((sd) => {
        window.cardiaEcho.startTask('tee', { seed: sd });
        const st = window.cardiaEcho.getState();
        return { sub: document.querySelector('.echo-sub')?.textContent || '', flexion: st.tee.flexion, lateral: st.tee.lateralFlexion, target: st.task.target };
      }, seed);
      assert.ok(!task.sub.includes('°'), `task subtitle hides the atlas angle (${task.sub})`);
      assert.equal(task.flexion, 0, `TEE task starts with neutral flexion (target ${task.target})`);
      assert.equal(task.lateral, 0);
    }
    await open('#/mode/ice');
    const ice = await page.evaluate(() => { window.cardiaEcho.startTask('ice', { seed: 5 }); return window.cardiaEcho.getState().ice; });
    assert.ok(ice.advance >= 0.52 && ice.advance <= 0.68, `ICE task starts near home (${ice.advance})`);
    assert.ok(Math.abs(ice.anteroposterior) <= 15 && Math.abs(ice.leftRight) <= 15, 'ICE knobs offset from the home pose');

    assert.deepEqual(errors, [], 'no page errors');
    console.log('PASS: RV/LV modes, Eustachian valve and Chiari network, ridge and posterior leaflet names, named coronary branches (D1 before S1), ventricle wall regions, aortic valve opening, TTE presets without PV/PA/SVC and with the textbook LV segments');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });

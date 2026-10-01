/**
 * Ablation lesson, Koch step (research/ABLASYON_IYILESTIRME_RAPORU.md, plan
 * items 1-3): catheter routes stay in the RA cavity, the His catheter crosses
 * into the RV next to the His bundle, the CS catheter enters the estimated
 * mouth, the close-up views frame the triangle in RAO and LAO, labels state
 * their source, optional layers toggle, and the synthetic EGM step shows its
 * strip. Teaching checks on the atlas, not clinical validation.
 * Usage: APP_URL=... node scripts/test-ep-koch.cjs
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
// Layers and tools open as a drawer from the header tabs (tablet and desktop).
const openDrawer = async (page, id) => {
  const tab = page.locator(`[data-drawer=${id}]`);
  if (await tab.getAttribute('aria-expanded') !== 'true') await tab.click();
};

const APP = process.env.APP_URL || 'http://127.0.0.1:5173';
const SHOTS = process.env.SHOT_DIR || null;

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { localStorage.setItem('cardia_lang', 'tr'); localStorage.setItem('cardia_lang_explicit', '1'); });
    await page.goto(`${APP}/#/mode/ablation`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.locator('#steps [data-step="1"]').click();
    await page.waitForSelector('#viewport[data-camera-settled=true]');

    const routes = await page.evaluate(async () => {
      const THREE = await import('/node_modules/three/build/three.module.js');
      const { surface } = await import('/src/atrial-surface.js');
      const h = window.heart;
      const by = id => { const l = []; h.scene.traverse(o => { if (o.isMesh && o.userData.id === id) l.push(o); }); return l; };
      // Inside a chamber cavity: the nearest wall vertex's facing says which side the point is on.
      const cavityTest = meshes => {
        const faces = surface(meshes);
        const all = [...faces.inner.map(v => ({ ...v, inner: true })), ...faces.outer.map(v => ({ ...v, inner: false }))];
        return q => { let best = null, bd = Infinity; for (const v of all) { const d = v.p.distanceToSquared(q); if (d < bd) { bd = d; best = v; } } const side = q.clone().sub(best.p).dot(best.n); return best.inner ? side > 0 : side < 0; };
      };
      const inRa = cavityTest(by('ra')), inRv = cavityTest(by('rv'));
      const centreline = group => {
        const tube = group.children[0]; tube.updateWorldMatrix(true, false);
        const pos = tube.geometry.attributes.position, ring = tube.geometry.parameters.radialSegments + 1, out = [];
        for (let i = 0; i + ring <= pos.count; i += ring) { const c = new THREE.Vector3(); for (let k = 0; k < ring - 1; k++) c.add(new THREE.Vector3().fromBufferAttribute(pos, i + k)); out.push(c.divideScalar(ring - 1).applyMatrix4(tube.matrixWorld)); }
        return out;
      };
      const nearestIndex = (pts, p) => pts.reduce((bi, q, i) => q.distanceTo(p) < pts[bi].distanceTo(p) ? i : bi, 0);
      const report = name => {
        const group = h.scene.getObjectByName(name);
        const pts = centreline(group);
        const [from, to] = group.userData.cavity.map(a => new THREE.Vector3(...a));
        const i0 = nearestIndex(pts, from), i1 = nearestIndex(pts, to);
        const segment = pts.slice(i0, i1 + 1).filter(p => p.distanceTo(to) > 0.03);
        return { name, samples: pts.length, segment: segment.length, outside: segment.filter(p => !inRa(p)).length, userData: group.userData };
      };
      const ablation = report('Slow pathway ablation catheter (schematic)');
      const his = report('His reference catheter (schematic)');
      const cs = report('CS reference catheter (schematic)');
      const hisTip = new THREE.Vector3(...his.userData.tip), hisSite = new THREE.Vector3(...his.userData.hisSite);
      const tip = h.scene.getObjectByName('Slow pathway catheter tip').position;
      const target = h.scene.getObjectByName('Slow pathway / septal isthmus (ablation target)').position;
      const avNode = h.scene.getObjectByName('Compact AV node (Koch apex)').position;
      const ring = h.scene.getObjectByName('Coronary sinus ostium (estimated)');
      const csElectrodes = []; h.scene.getObjectByName('CS reference catheter (schematic)').traverse(o => { if (/^CS \d+ electrode$/.test(o.name)) csElectrodes.push(o); });
      const cs910 = csElectrodes.find(o => o.name === 'CS 10 electrode'), cs12 = csElectrodes.find(o => o.name === 'CS 1 electrode');
      const lesions = []; h.scene.traverse(o => { if (/RF lesion \(example/.test(o.name)) lesions.push(o); });
      return {
        ablation: { segment: ablation.segment, outside: ablation.outside, tipToTarget: tip.distanceTo(target) },
        his: { segment: his.segment, outside: his.outside, tipInRv: inRv(hisTip), tipToHis: hisTip.distanceTo(hisSite), tipToAv: hisTip.distanceTo(avNode), targetToAv: target.distanceTo(avNode) },
        cs: { segment: cs.segment, outside: cs.outside, electrodes: csElectrodes.length, proxToMouth: cs910.getWorldPosition(new THREE.Vector3()).distanceTo(ring.position), distToMouth: cs12.getWorldPosition(new THREE.Vector3()).distanceTo(ring.position) },
        ringName: Boolean(ring), measuredName: Boolean(h.scene.getObjectByName('Coronary sinus ostium (measured)')),
        lesions: lesions.length, lesionsShown: lesions.filter(o => o.visible).length, optional: h.getEpOptional()
      };
    });

    for (const key of ['ablation', 'his', 'cs']) {
      assert.ok(routes[key].segment > 10, `${key}: route has an RA cavity segment`);
      assert.equal(routes[key].outside, 0, `${key}: every sample of the cavity segment lies inside the RA`);
    }
    assert.ok(routes.ablation.tipToTarget < 1e-6, 'ablation tip on the slow-pathway target');
    assert.ok(routes.his.tipInRv, 'His catheter tip just inside the RV');
    assert.ok(routes.his.tipToHis < 0.3, 'His catheter tip next to the His bundle');
    assert.ok(routes.his.tipToAv < routes.his.targetToAv, 'His catheter nearer the apex than the slow-pathway target is');
    assert.equal(routes.cs.electrodes, 10, 'decapolar CS catheter');
    assert.ok(routes.cs.proxToMouth < routes.cs.distToMouth, 'CS 9-10 proximal (at the mouth), CS 1-2 distal');
    assert.ok(routes.ringName && !routes.measuredName, 'CS mouth is named as an estimate');
    assert.equal(routes.lesions, 5); assert.equal(routes.lesionsShown, 0, 'example RF lesions hidden by default');
    assert.deepEqual(routes.optional, { his: true, cs: true, lesions: false });

    // Labels are on demand: none while the pointer is away, the nearest one when the pointer reaches its anchor.
    assert.equal(await page.evaluate(() => window.heart.getSceneLabelMode()), 'hover', 'labels on demand by default');
    await page.mouse.move(2, 2);
    await page.waitForTimeout(150);
    assert.equal(await page.locator('.scene-label:not([hidden])').count(), 0, 'no labels until the pointer comes near');
    await page.evaluate(() => window.heart.setSceneLabelMode('all'));
    await page.waitForTimeout(150);
    const anchor = await page.evaluate(() => {
      const l = [...document.querySelectorAll('.scene-label')].find(x => !x.hidden && x.textContent === 'CS ağzı (kestirim)');
      const r = l.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.bottom + 10 + parseFloat(getComputedStyle(l).getPropertyValue('--lift') || '0') };
    });
    await page.evaluate(() => window.heart.setSceneLabelMode('hover'));
    await page.mouse.move(anchor.x, anchor.y);
    await page.waitForTimeout(200);
    const hoverShown = await page.locator('.scene-label:not([hidden])').allTextContents();
    assert.ok(hoverShown.includes('CS ağzı (kestirim)'), `hovering the anchor shows its label (${hoverShown.join(', ')})`);
    assert.ok(hoverShown.length < 6, 'only nearby labels, not all of them');
    await page.evaluate(() => window.heart.setSceneLabelMode('all'));
    await page.waitForTimeout(150);

    // Labels of the Koch step state their source (all shown for the check).
    const labels = (await page.locator('.scene-label:not([hidden])').allTextContents()).sort();
    for (const text of ['CS ağzı (kestirim)', 'Kompakt AV düğüm (apeks, şematik)', 'Yavaş yol hedefi (şematik)', 'Septal menteşe (atlas halkası)', 'His kateteri (referans)', 'CS kateteri (referans)'])
      assert.ok(labels.includes(text), `label shown: ${text} (${labels.join(', ')})`);

    // Close-up views: RAO 30 and LAO 45 about the triangle, near.
    const view = async id => {
      await openDrawer(page, 'tools');
      await page.locator(`[data-ep-view="${id}"]`).click();
      await page.waitForTimeout(100);
      await page.waitForSelector('#viewport[data-camera-settled=true]');
      if (SHOTS) await page.locator('main').screenshot({ path: `${SHOTS}/koch-${id}.png` });
      return page.evaluate(() => {
        const a = window.heart.getState().angio;
        const labelsOnScreen = [...document.querySelectorAll('.scene-label')].filter(l => !l.hidden).length;
        const st = window.heart.getState();
        const hiddenLayers = ['coronaries', 'valves'].every(layer => st.structures.filter(x => x.layer === layer && x.id !== 'cs').every(x => !x.visible));
        return { laoRao: a.laoRao, craCau: a.craCau, distance: a.distance, labelsOnScreen, kochFocus: st.kochFocus, hiddenLayers };
      });
    };
    const rao = await view('koch_rao'), lao = await view('koch_lao');
    assert.equal(rao.laoRao, -30); assert.equal(lao.laoRao, 45);
    for (const v of [rao, lao]) {
      assert.ok(v.distance < 3.2, `close-up distance ${v.distance}`);
      assert.ok(v.labelsOnScreen >= 4, 'labels in frame');
      assert.ok(v.kochFocus && v.hiddenLayers, 'close-up hides coronaries and valve apparatus in front of the triangle');
    }
    assert.equal(await page.locator('[data-ep-view="koch_lao"]').getAttribute('aria-pressed'), 'true');

    // Optional layers.
    await openDrawer(page, 'tools');
    await page.locator('[data-ep-optional="his"]').uncheck();
    await page.locator('[data-ep-optional="lesions"]').check();
    const toggled = await page.evaluate(() => {
      const h = window.heart; const his = h.scene.getObjectByName('His reference catheter (schematic)');
      const lesions = []; h.scene.traverse(o => { if (/RF lesion \(example/.test(o.name)) lesions.push(o.visible); });
      return { his: his.visible, lesions: lesions.every(Boolean), optional: h.getEpOptional() };
    });
    assert.equal(toggled.his, false); assert.equal(toggled.lesions, true);
    assert.ok(!(await page.locator('.scene-label:not([hidden])').allTextContents()).includes('His kateteri (referans)'), 'label hidden with its catheter');
    await page.locator('[data-ep-optional="his"]').check();
    await page.locator('[data-ep-optional="lesions"]').uncheck();

    // Labels stay off the fluoroscopy image; catheters project as devices.
    await page.locator('#fluoro-toggle-dock').click();
    await page.waitForTimeout(150);
    assert.equal(await page.locator('.scene-label:not([hidden])').count(), 0, 'no labels over fluoroscopy');
    if (SHOTS) await page.locator('main').screenshot({ path: `${SHOTS}/koch-fluoro.png` });
    await page.locator('#fluoro-toggle-dock').click();

    // Other steps: no Koch labels, no EGM strip, full anatomy again.
    await page.locator('#steps [data-step="2"]').click();
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => window.heart.getState().kochFocus), false, 'focus ends with the close-up');
    assert.equal(await page.locator('.scene-label:not([hidden])').count(), 0, 'no Koch labels in the PVI step');
    // Every ablation step now opens its own synthetic recording; the PVI step shows the AF baseline.
    assert.equal(await page.locator('#egm-panel').isHidden(), false, 'the PVI step opens its signal strip');
    assert.equal(await page.evaluate(() => window.cardiaEp.getScenario()), 'af-pvi-baseline', 'PVI step: AF baseline recording');

    // Step 5: synthetic EGM strip under the Koch close-up.
    await page.locator('#steps [data-step="4"]').click();
    await page.waitForSelector('#egm-panel:not([hidden]) .egm-canvas');
    const egm = await page.evaluate(() => {
      const c = document.querySelector('.egm-canvas');
      return { w: c.width, h: c.height, cssH: c.clientHeight, text: document.querySelector('.egm-text').textContent, pressed: document.querySelector('[data-egm-scenario][aria-pressed=true]')?.dataset.egmScenario, kochShown: window.heart.scene.getObjectByName('Triangle of Koch').visible };
    });
    assert.ok(egm.w > 200 && egm.h > 100 && egm.cssH === 240, `EGM canvas sized (${egm.w}x${egm.h}, css ${egm.cssH})`);
    assert.match(egm.text, /[Ss]entetik/);
    assert.equal(egm.pressed, 'sinus'); assert.equal(egm.kochShown, true);
    await page.locator('[data-egm-scenario="junctional-rf"]').click();
    assert.match(await page.locator('.egm-text').textContent(), /tek başına/);
    await page.locator('#beat').click();
    await page.waitForTimeout(400);
    const grown = await page.evaluate(() => document.querySelector('.egm-canvas').clientHeight);
    assert.equal(grown, 240, 'EGM canvas keeps its size while redrawn every frame');
    await page.locator('#beat').click();
    if (SHOTS) await page.locator('article').screenshot({ path: `${SHOTS}/egm-panel.png` });

    // Pathway zones (report section 5): the active case draws its annulus arc
    // and the RV pacing reference; a neutral diagnosis view hides them.
    const zones = () => page.evaluate(() => {
      const list = [];
      window.heart.scene.traverse(o => { if (o.name.startsWith('EP zone:') && o.visible && o.parent.visible) list.push(o.name.slice(9)); });
      return { zone: window.heart.getEpZone(), visible: list, rv: window.heart.scene.getObjectByName('RV pacing reference (schematic)').visible };
    });
    assert.deepEqual(await zones(), { zone: 'koch-slow-pathway', visible: ['koch-slow-pathway'], rv: true }, 'treatment: Koch slow pathway zone');
    await page.locator('[data-ep-section=maneuver]').click();
    await page.locator('[data-ep-case]').selectOption('ap-left-lateral');
    assert.deepEqual((await zones()).visible, ['left-free-wall'], 'left free wall arc on the mitral annulus');
    assert.match(await page.locator('.ep-zone').textContent(), /mitral anulus/);
    await page.locator('[data-ep-section=diagnosis]').click();
    assert.deepEqual(await zones(), { zone: null, visible: [], rv: false }, 'neutral diagnosis hides the zone');
    await page.locator('[data-ep-evidence]').click();
    assert.deepEqual((await zones()).visible, ['left-free-wall'], 'evidence reveals the zone');

    // New catalog clips: AH jump, orthodromic AVRT, preexcited AF.
    await page.locator('[data-ep-section=maneuver]').click();
    await page.locator('[data-ep-case]').selectOption('avnrt-typical');
    await page.locator('[data-egm-scenario="avnrt-dual-echo"]').click();
    assert.match(await page.locator('.ep-measures').textContent(), /AH \(S2-1\) 100 ms.*AH \(S2-2\) 180 ms/, 'AH jump: two S2 couplings, 100 then 180 ms');
    await page.locator('[data-ep-section=diagnosis]').click();
    const csCases = await page.locator('[data-ep-case] option').count();
    assert.equal(csCases, 13, 'thirteen numbered diagnosis cases (phase D cases and the PVI baseline included)');
    await page.locator('[data-ep-case]').selectOption('ap-left-manifest');
    await page.locator('[data-egm-scenario="af-preexcited"]').click();
    assert.match(await page.locator('.ep-measures').textContent(), /SPERRI 220 ms/);
    assert.match(await page.locator('.egm-text').textContent(), /dar QRS taşikardi algoritması bu kayda uygulanmaz/);
    assert.equal((await zones()).zone, null, 'neutral: no zone even in the emergency case');
    // Para-Hisian pair and the enlarge toggle (state preserved).
    await page.locator('[data-ep-section=maneuver]').click();
    await page.locator('[data-ep-case]').selectOption('ap-inf-paraseptal');
    await page.locator('[data-egm-scenario="ap-ips-parahis"]').click();
    assert.match(await page.locator('.ep-measures').textContent(), /S-A \(His\+RV\) 95 ms.*S-A \(RV\) 95 ms/);
    await page.locator('[data-ep-size]').click();
    assert.equal(await page.evaluate(() => document.querySelector('.egm-canvas').clientHeight), 420, 'enlarged canvas');
    assert.equal(await page.evaluate(() => document.querySelector('[data-egm-scenario="ap-ips-parahis"]').getAttribute('aria-pressed')), 'true', 'enlarge keeps the clip');
    await page.locator('[data-ep-size]').click();
    assert.equal(await page.evaluate(() => document.querySelector('.egm-canvas').clientHeight), 240);
    await page.locator('#steps [data-step="1"]').click();
    assert.deepEqual((await zones()).visible, [], 'leaving the panel step clears the zone');

    // English labels.
    await page.locator('#steps [data-step="1"]').click();
    await page.locator('#lang-btn').click();
    await page.waitForTimeout(150);
    assert.ok((await page.locator('.scene-label:not([hidden])').allTextContents()).includes('CS ostium (estimated)'));
    assert.equal(await page.locator('[data-i18n="epToolsHeading"]').textContent(), 'KOCH CLOSE-UP');

    assert.deepEqual(errors, []);
    console.log('PASS ep-koch:', JSON.stringify(routes));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });

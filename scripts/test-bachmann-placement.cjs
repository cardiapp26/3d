/**
 * Bachmann's bundle placement and marker identity (report section 13).
 * The band is placed from measured landmarks; this checks the landmarks
 * against their anatomical definitions, that the band lies on the epicardial
 * surface and stays clear of the ascending aorta at rest and through the
 * beat, that the RA endocardial pacing target is a separate marker, and that
 * the identity labels (LAA ring, band, target) stay on their structures.
 * Usage: APP_URL=... node scripts/test-bachmann-placement.cjs
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

const APP = process.env.APP_URL || 'http://127.0.0.1:5173';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { localStorage.setItem('cardia_lang', 'tr'); localStorage.setItem('cardia_lang_explicit', '1'); });
    await page.goto(`${APP}/#/mode/bachmann?structure=bachmann`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.waitForSelector('#viewport[data-camera-settled=true]');

    const r = await page.evaluate(async () => {
      const THREE = await import('/node_modules/three/build/three.module.js');
      const { aortaClearance } = await import('/src/bachmann.js');
      const h = window.heart;
      const by = id => { const l = []; h.scene.traverse(o => { if (o.isMesh && o.userData.id === id) l.push(o); }); return l; };
      const W = ms => ms.flatMap(m => { m.updateWorldMatrix(true, false); const a = m.geometry.attributes.position, out = []; for (let i = 0; i < a.count; i++) out.push(new THREE.Vector3().fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld)); return out; });
      const nearestD = (list, p) => { let d = Infinity; for (const v of list) d = Math.min(d, v.distanceToSquared(p)); return Math.sqrt(d); };
      const band = by('bachmann')[0], lm = Object.fromEntries(Object.entries(band.userData.landmarks).map(([k, v]) => [k, new THREE.Vector3(...v)]));
      const laa = by('laa')[0].userData;
      const snapshot = () => {
        const ra = W(by('ra')), la = W(by('la')), ao = W(by('aorta'));
        const clear = aortaClearance(ao, ao.slice().sort((a, b) => a.y - b.y).slice(0, 60).reduce((s, v) => s.add(v), new THREE.Vector3()).divideScalar(60));
        const ribbon = W([band]);
        return { minClear: Math.min(...ribbon.map(clear)), maxGap: Math.max(...ribbon.filter((_, i) => i % 3 === 0).map(v => Math.min(nearestD(ra, v), nearestD(la, v)))) };
      };
      // Landmarks, at rest.
      const ra = W(by('ra')), la = W(by('la')), svc = W(by('svc')), aorta = W(by('aorta'));
      const clear = aortaClearance(aorta, lm.aorticRoot);
      const target = new THREE.Vector3(...band.userData.pacingTarget), anchor = new THREE.Vector3(...band.userData.bandAnchor);
      // Transverse sinus: no atrial vertex inside the aorta at rest.
      const { aorticRootOf } = await import('/src/transverse-sinus.js');
      const sinusClear = aortaClearance(aorta, aorticRootOf(aorta));
      const sinus = { adjusted: h.atlasAdjustments().transverseSinus, raInside: ra.filter(v => sinusClear(v) < 0).length, laInside: la.filter(v => sinusClear(v) < 0).length };
      const path = band.userData.path.map(a => new THREE.Vector3(...a));
      // Crista terminalis on the RA endocardium, SVC orifice to IVC orifice along the lateral wall.
      const crista = by('crista-terminalis')[0];
      const cPath = crista.userData.path.map(a => new THREE.Vector3(...a)), cLm = Object.fromEntries(Object.entries(crista.userData.landmarks).map(([k, v]) => [k, new THREE.Vector3(...v)]));
      const { surface } = await import('/src/atrial-surface.js');
      const raFaces = surface(by('ra'));
      const innerGap = q => Math.sqrt(Math.min(...raFaces.inner.map(v => v.p.distanceToSquared(q))));
      const raCentreX = ra.reduce((sum, v) => sum + v.x, 0) / ra.length;
      const sa = h.scene.getObjectByName('Sinoatrial node').position;
      const cristaCheck = { maxInnerGap: Math.max(...cPath.map(innerGap)), topToJunction: cPath[0].distanceTo(cLm.junction), upperToSa: Math.min(...cPath.slice(0, Math.round(cPath.length * 0.3)).map(q => q.distanceTo(sa))), bottomToIvc: cPath.at(-1).distanceTo(cLm.ivcOstium), midLateral: cPath[Math.round(cPath.length * 0.6)].x - raCentreX, sulcusToBachmann: new THREE.Vector3(...crista.userData.sulcus).distanceTo(new THREE.Vector3(...band.userData.inferiorLimb.at(-1))) };
      const rightLimb = { fromSa: lm.saNode ? path[0].distanceTo(lm.saNode) : Infinity, inferior: band.userData.inferiorLimb?.length || 0, inferiorEndToRaaBase: lm.raaBase && band.userData.inferiorLimb?.length ? new THREE.Vector3(...band.userData.inferiorLimb.at(-1)).distanceTo(lm.raaBase) : Infinity };
      const rest = snapshot();
      // Through the beat.
      let beatMinClear = Infinity, beatMaxGap = 0;
      for (let k = 0; k < 24; k++) { h.seekCycle(k / 24); const s = snapshot(); beatMinClear = Math.min(beatMinClear, s.minClear); beatMaxGap = Math.max(beatMaxGap, s.maxGap); }
      // Labels stay on their anchor vertex while beating (projected position vs label).
      h.seekCycle(0.65);
      await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
      const labels = [...document.querySelectorAll('.scene-label')].filter(l => !l.hidden).map(l => l.textContent);
      return {
        groove: { raGap: nearestD(ra, lm.groove), laGap: nearestD(la, lm.groove), aortaClear: clear(lm.groove), behindRoot: lm.groove.z < lm.aorticRoot.z, aboveRoot: lm.groove.y > lm.aorticRoot.y },
        startToJunction: lm.start.distanceTo(lm.junction), startNearSvc: nearestD(svc, lm.start),
        neckToOrifice: Math.abs(lm.neck.distanceTo(new THREE.Vector3(...laa.orifice)) - laa.radius * 1.1),
        rest, beatMinClear, beatMaxGap, sinus, rightLimb, crista: cristaCheck,
        target: { fromBand: target.distanceTo(anchor), raGap: nearestD(ra, target), laGap: nearestD(la, target), markerVisible: h.scene.getObjectByName('Bachmann pacing target').visible },
        labels,
      };
    });
    console.log(JSON.stringify(r, null, 1));

    assert.ok(r.sinus.adjusted?.moved > 0 && r.sinus.raInside === 0 && r.sinus.laInside === 0, 'transverse sinus: atria kept out of the aortic root');
    assert.ok(r.rightLimb.fromSa < 0.2, 'superior right limb reaches the sinus node region');
    // The base point is off the wall; the limb end is placed on it, hence the tolerance.
    assert.ok(r.rightLimb.inferior > 2 && r.rightLimb.inferiorEndToRaaBase < 0.3, 'inferior right limb runs to the base of the right atrial appendage');
    assert.ok(r.crista.maxInnerGap < 0.06, 'crista terminalis lies on the RA endocardium');
    assert.ok(r.crista.topToJunction < 0.5 && r.crista.upperToSa < 0.45, 'crista starts at the superior caval orifice, under the sinus node');
    // Measured to the ostium centre: the ridge ends on the wall at its rim (radius about 0.3 units).
    assert.ok(r.crista.bottomToIvc < 0.5, 'crista ends in front of the inferior caval orifice');
    assert.ok(r.crista.midLateral < -0.3, 'crista descends along the lateral RA wall');
    assert.ok(r.crista.sulcusToBachmann < 0.1, "Bachmann's inferior right limb ends over the crista (sulcus terminalis)");
    assert.ok(r.groove.raGap < 0.12 && r.groove.laGap < 0.12, 'groove point lies where RA and LA meet');
    assert.ok(r.groove.aortaClear > 0 && r.groove.aortaClear < 0.3, 'groove point is outside the aorta, against its wall');
    assert.ok(r.groove.behindRoot && r.groove.aboveRoot, 'groove point is behind (posterior to) and above the aortic root');
    assert.ok(r.startToJunction < 0.5 && r.startNearSvc < 0.5, 'right limb starts at the superior cavoatrial junction');
    assert.ok(r.neckToOrifice < 0.05, 'left end reaches the LAA neck');
    assert.ok(r.rest.minClear > 0 && r.beatMinClear > 0, `band clear of the ascending aorta at rest and through the beat (${r.rest.minClear.toFixed(3)}, ${r.beatMinClear.toFixed(3)})`);
    assert.ok(r.rest.maxGap < 0.12 && r.beatMaxGap < 0.12, `band on the atrial surface (gap ${r.rest.maxGap.toFixed(3)} / ${r.beatMaxGap.toFixed(3)})`);
    assert.ok(r.target.fromBand > 0.05, 'pacing target is a separate point from the epicardial band');
    assert.ok(r.target.raGap < r.target.laGap, 'pacing target is on the right atrial side');
    assert.equal(r.target.markerVisible, true, 'pacing target marker shown in the Bachmann lesson');
    assert.deepEqual(r.labels.sort(), ['Bachmann demeti (epikardiyal)', 'LAA ostiyum işareti', 'Pacing hedefi (RA endokardı)'].sort(), 'three distinct identity labels');

    // Label drift: while beating, each label sits on its projected anchor.
    await page.evaluate(() => window.heart.setBeating(true));
    await page.waitForTimeout(700);
    const drift = await page.evaluate(() => {
      const labels = [...document.querySelectorAll('.scene-label')].filter(l => !l.hidden);
      const box = document.querySelector('#viewport').getBoundingClientRect();
      return labels.map(l => { const r = l.getBoundingClientRect(); return { inside: r.left >= box.left - 200 && r.right <= box.right + 200 }; });
    });
    assert.ok(drift.every(d => d.inside), 'labels stay on screen with their structures while beating');
    await page.evaluate(() => window.heart.setBeating(false));

    // Mode identity: the badge names mode and selection; the target and labels are lesson-only.
    assert.match(await page.locator('#scene-context').textContent(), /^09 · Bachmann demeti & pacing · Seçili: Bachmann/);
    const frames = () => page.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))));
    await page.locator('#fluoroscopy-toggle').click();
    await frames();
    assert.equal(await page.locator('.scene-label:not([hidden])').count(), 0, 'no identity labels over the fluoroscopy image');
    await page.locator('#fluoroscopy-toggle').click();
    await page.locator('[data-mode=atria]').click();
    assert.equal(await page.evaluate(() => window.heart.scene.getObjectByName('Bachmann pacing target').visible), false);
    await page.waitForTimeout(300);
    assert.deepEqual(await page.locator('.scene-label:not([hidden])').allTextContents(), ['LAA ostiyum işareti'], 'atria mode: only the LAA ring label');
    assert.match(await page.locator('#scene-context').textContent(), /^02 · Sol atriyum & LAA/);
    // RA mode: the crista is shown, selectable and labelled.
    await page.locator('[data-mode=ra]').click();
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => { let c; window.heart.scene.traverse(o => { if (o.userData.id === 'crista-terminalis') c = o; }); return c.visible; }), true, 'crista shown in the RA mode');
    await page.locator('#structure-select').selectOption('crista-terminalis');
    await page.waitForTimeout(300);
    assert.match(await page.locator('#structure-title').textContent(), /Krista terminalis/);
    assert.deepEqual(await page.locator('.scene-label:not([hidden])').allTextContents(), ['Krista terminalis']);
    assert.deepEqual(errors, []);
    console.log('PASS: crista terminalis on the RA endocardium (SVC to IVC orifice along the lateral wall) and in the RA mode; Bachmann band from measured landmarks (SVC junction, groove behind the aorta, LAA neck), on the epicardial surface and clear of the aorta through the beat; separate RA endocardial pacing target; identity labels and mode badge');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });

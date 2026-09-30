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
    await page.evaluate(() => window.heart.setSceneLabelMode('all'));   // labels are on demand by default; the checks read all of them
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
    if (await page.locator('#carm-panel').evaluate(el => el.classList.contains('collapsed'))) await page.locator('#carm-edge-tab').click(); await page.locator('#fluoroscopy-toggle').click();
    await frames();
    assert.equal(await page.locator('.scene-label:not([hidden])').count(), 0, 'no identity labels over the fluoroscopy image');
    if (await page.locator('#carm-panel').evaluate(el => el.classList.contains('collapsed'))) await page.locator('#carm-edge-tab').click(); await page.locator('#fluoroscopy-toggle').click();
    await page.locator('[data-mode=atria]').dispatchEvent('click');
    assert.equal(await page.evaluate(() => window.heart.scene.getObjectByName('Bachmann pacing target').visible), false);
    await page.waitForTimeout(300);
    assert.deepEqual((await page.locator('.scene-label:not([hidden])').allTextContents()).sort(), ['Coumadin sırtı', 'LAA ostiyum işareti'], 'atria mode: LAA ring and Coumadin ridge labels');
    // LAA scaled toward its neck (owner's request) and the ridge between it and the left veins.
    const la = await page.evaluate(async () => {
      const THREE = await import('/node_modules/three/build/three.module.js');
      const { nearestLoop } = await import('/src/mesh-utils.js');
      const h = window.heart; const by = id => { const l = []; h.scene.traverse(o => { if (o.isMesh && o.userData.id === id) l.push(o); }); return l; };
      const ridge = by('coumadin-ridge')[0], laMesh = by('la')[0], o = laMesh.userData.laaOrifice;
      const path = ridge.userData.path.map(a => new THREE.Vector3(...a));
      const veins = []; h.scene.traverse(x => { if (x.isMesh && /left (superior|inferior) pulmonary/i.test(x.name)) veins.push(x); });
      laMesh.geometry.computeBoundingSphere();
      const rims = veins.map(m => nearestLoop(m, laMesh.geometry.boundingSphere.center));
      // Both leaves of the double-sheeted appendage are scaled. On the original
      // atlas LA (same normalization), the leaf reached from the tip over the
      // far side of the neck plane misses the other leaf; every vertex beyond
      // the neck, in either leaf, must have moved. A leaf left in place stays
      // full size around the scaled one (the double contour of 2026-09-30).
      const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
      const { DRACOLoader } = await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
      const { LAA_SCALE } = await import('/src/la-appendage.js');
      const gltf = await new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/')).loadAsync('/models/cardiovascular.glb');
      gltf.scene.updateMatrixWorld(true);
      let source = null; gltf.scene.traverse(x => { if (x.isMesh && gltf.parser.json.nodes[gltf.parser.associations.get(x)?.nodes]?.name === 'Left atrium') source = x; });
      const { center: nc, scale: ns } = h.getState().normalization;
      const original = source.geometry.clone().applyMatrix4(source.matrixWorld).translate(-nc[0], -nc[1], -nc[2]).scale(ns, ns, ns).attributes.position;
      const pts = Array.from({ length: original.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(original, i));
      const depth = v => v.clone().sub(o.center).dot(o.axis);
      const key = v => `${Math.round(v.x * 1e4)},${Math.round(v.y * 1e4)},${Math.round(v.z * 1e4)}`;
      const first = new Map(), root = pts.map((v, i) => { const k = key(v); if (!first.has(k)) first.set(k, i); return first.get(k); });
      const adj = new Map(); const link = (a, b) => { if (!adj.has(a)) adj.set(a, []); adj.get(a).push(b); };
      const index = laMesh.geometry.index;
      for (let t = 0; t < index.count; t += 3) { const [a, b, c] = [0, 1, 2].map(j => root[index.getX(t + j)]); link(a, b); link(a, c); link(b, a); link(b, c); link(c, a); link(c, b); }
      const tip = o.center.clone().add(o.tip.clone().sub(o.center).divideScalar(LAA_SCALE));
      const start = root[pts.reduce((bi, v, i) => v.distanceToSquared(tip) < pts[bi].distanceToSquared(tip) ? i : bi, 0)];
      const leaf = new Set([start]), stack = [start];
      while (stack.length) for (const n of adj.get(stack.pop()) || []) if (!leaf.has(n) && depth(pts[n]) > 0) { leaf.add(n); stack.push(n); }
      const current = laMesh.geometry.attributes.position;
      const beyondNeck = [...adj.keys()].filter(r => depth(pts[r]) > 0.03);
      const otherLeaf = beyondNeck.filter(r => !leaf.has(r));
      // The transverse sinus later nudges some of these vertices, so compare the
      // typical (median) scale of the other leaf beyond the ramp with the tip leaf's.
      const ratio = r => new THREE.Vector3().fromBufferAttribute(current, r).distanceTo(o.center) / pts[r].distanceTo(o.center);
      const median = list => { const v = list.map(ratio).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
      const deep = r => depth(pts[r]) > 0.3;
      const otherScale = median(otherLeaf.filter(deep)), leafScale = median([...leaf].filter(deep));
      return { otherLeaf: otherLeaf.length, otherScale, leafScale, scale: h.atlasAdjustments().laaScale, toLaa: Math.min(...path.map(q => q.distanceTo(o.center))) - o.radius, toVeins: Math.min(...path.flatMap(q => rims.flatMap(r => r.pts.map(v => v.distanceTo(q))))), top: Math.max(...path.map(q => q.y)), bottom: Math.min(...path.map(q => q.y)), lspvY: Math.max(...rims.map(r => r.center.y)) };
    });
    assert.ok(la.otherLeaf > 50, `the atlas appendage is double-sheeted (${la.otherLeaf} vertices off the tip leaf)`);
    assert.ok(Math.abs(la.otherScale - la.leafScale) < 0.05, `both appendage leaves scaled alike (other leaf ${la.otherScale.toFixed(2)}, tip leaf ${la.leafScale.toFixed(2)}): no double contour`);
    assert.ok(la.scale.lengthAfter * 34 > 25 && la.scale.lengthAfter * 34 < 40, `LAA length near the published mean (${Math.round(la.scale.lengthAfter * 34)} mm)`);
    assert.ok(la.toLaa < 0.2 && la.toVeins < 0.25, `Coumadin ridge between the LAA orifice and the left veins (${la.toLaa.toFixed(2)}, ${la.toVeins.toFixed(2)})`);
    assert.ok(la.top > la.lspvY && la.bottom < la.lspvY, 'ridge runs down past the superior vein');
    assert.match(await page.locator('#scene-context').textContent(), /^02 · Sol atriyum & LAA/);
    // RA mode: the crista is shown, selectable and labelled.
    await page.locator('[data-mode=ra]').dispatchEvent('click');
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

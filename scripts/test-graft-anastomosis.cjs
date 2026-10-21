// Bypass graft anastomoses: every graft ends on its target artery's centreline,
// within the artery radius, with a hood that narrows to the artery calibre and
// lies inside it; the vein grafts start inside the ascending aorta; the
// schematic PDA leaves the RCA at the crux; the junction holds through a beat.
// Run against the dev server: APP_URL=http://localhost:5173 node scripts/test-graft-anastomosis.cjs
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const HOOD_CHECK = 0.08;   // the last stretch of the graft that must already lie inside the artery
const BEAT_DRIFT = 0.012;  // allowed change of the end-to-artery distance through the cycle

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${process.env.APP_URL || 'http://127.0.0.1:5173'}/angio/3d/?lang=en`);
    await page.waitForFunction(() => window.heart && document.querySelector('[data-model-ready="true"]'), undefined, { timeout: 90000 });
    const report = await page.evaluate(async ({ HOOD_CHECK }) => {
      const h = window.heart;
      const { tubeComponents } = await import('/src/coronary-branches.js');
      const V = h.scene.position.constructor;
      h.setBeating(false);
      h.seekCycle(0);
      // Distance from a point to a polyline (segments, not only its vertices).
      const toLine = (p, line) => {
        let best = Infinity;
        for (let i = 1; i < line.length; i++) {
          const a = line[i - 1], ab = line[i].clone().sub(a), t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / Math.max(1e-12, ab.lengthSq())));
          best = Math.min(best, a.clone().addScaledVector(ab, t).distanceTo(p));
        }
        return best;
      };
      // Rest geometry: the beat writes the live positions; userData.restPosition keeps the rest pose.
      const rest = m => { if (!m.userData.restPosition) return m.geometry; const g = m.geometry.clone(); g.attributes.position.array.set(m.userData.restPosition); return g; };
      // Centrelines of every tube of an artery mesh (heart-local, baked frame, rest pose).
      const arteryLines = id => h.getMeshes(id).flatMap(m => m.userData.centerline ? [m.userData.centerline] : tubeComponents(rest(m)).map(c => c.rings));
      const ringCentre = (pos, ring, size) => { const c = new V(); for (let k = 0; k < size - 1; k++) c.add(new V().fromBufferAttribute(pos, ring * size + k)); return c.multiplyScalar(1 / (size - 1)); };
      const ringRadius = (pos, ring, size, c) => new V().fromBufferAttribute(pos, ring * size).distanceTo(c);
      const out = { pda: null, grafts: {} };

      const pda = h.getMeshes('pda')[0];
      if (pda) {
        const rcaTrunk = tubeComponents(rest(h.getMeshes('rca')[0])).reduce((a, b) => (b.length > a.length ? b : a));
        out.pda = { originToRca: toLine(pda.userData.centerline[0], rcaTrunk.rings), layer: pda.userData.layer, system: pda.userData.system };
      }
      for (const graft of ['lima', 'svg-om', 'svg-pda']) {
        h.setGraft(graft);
        let mesh = null;
        h.scene.traverse(o => { if (o.isMesh && o.userData.graft === graft) mesh = o; });
        const a = mesh.userData.anastomosis, lines = arteryLines(a.target);
        const pos = mesh.geometry.attributes.position, { tubularSegments, radialSegments } = mesh.geometry.parameters, size = radialSegments + 1;
        const last = tubularSegments, path = mesh.geometry.parameters.path;
        // Rest centreline of the graft is its tube path (rings move rigidly with the beat).
        const end = path.getPointAt(1);
        const endDistance = Math.min(...lines.map(l => toLine(end, l)));
        // Hood: the last HOOD_CHECK of the graft lies inside the artery lumen.
        const back = HOOD_CHECK / path.getLength();
        let hoodWorst = 0;
        for (let k = 0; k <= 8; k++) hoodWorst = Math.max(hoodWorst, Math.min(...lines.map(l => toLine(path.getPointAt(1 - back * k / 8), l))));
        const g = { target: a.target, targetRadius: a.targetRadius, endDistance, hoodWorst, endRadius: ringRadius(pos, last, size, ringCentre(pos, last, size)), startRadius: ringRadius(pos, 0, size, ringCentre(pos, 0, size)) };
        if (a.origin) {
          const start = path.getPointAt(0), c = new V(...a.origin.centre);
          g.startFromAxis = Math.hypot(start.x - c.x, start.z - c.z);
          g.aortaRadius = a.origin.radius;
        }
        // Through the cycle: the end stays where it was relative to the (moving) artery wall.
        const nearestWall = p => { let d = Infinity; for (const m of h.getMeshes(a.target)) { const q = m.geometry.attributes.position; for (let i = 0; i < q.count; i++) d = Math.min(d, m.localToWorld(new V().fromBufferAttribute(q, i)).distanceTo(p)); } return d; };
        const endWorld = () => mesh.localToWorld(ringCentre(mesh.geometry.attributes.position, last, size));
        h.setBeating(true);
        const beat = [];
        for (const phase of [0, 0.2, 0.4, 0.6, 0.8]) { h.seekCycle(phase); await new Promise(r => setTimeout(r, 200)); beat.push(nearestWall(endWorld())); }
        h.setBeating(false);
        g.beatDrift = Math.max(...beat) - Math.min(...beat);
        out.grafts[graft] = g;
      }
      h.setGraft(null);
      return out;
    }, { HOOD_CHECK });

    assert.ok(report.pda, 'the schematic PDA is part of the model');
    assert.equal(report.pda.layer, 'coronaries');
    assert.equal(report.pda.system, 'right');
    assert.ok(report.pda.originToRca < 0.02, `the PDA leaves the RCA centreline at the crux (${report.pda.originToRca.toFixed(4)})`);
    const expected = { lima: 'lad', 'svg-om': 'lcx', 'svg-pda': 'pda' };
    for (const [graft, g] of Object.entries(report.grafts)) {
      const line = `${graft} -> ${g.target}: end ${g.endDistance.toFixed(4)} hood ${g.hoodWorst.toFixed(4)} r ${g.targetRadius.toFixed(4)} endR ${g.endRadius.toFixed(4)} beat ${g.beatDrift.toFixed(4)}`
        + (g.startFromAxis != null ? ` aorta ${g.startFromAxis.toFixed(3)}/${g.aortaRadius.toFixed(3)}` : '');
      console.log(line);
      assert.equal(g.target, expected[graft], `${graft} lands on ${expected[graft]}`);
      assert.ok(g.endDistance <= g.targetRadius, `${graft}: end within the artery radius of its centreline`);
      assert.ok(g.hoodWorst <= g.targetRadius, `${graft}: the hood's last stretch lies inside the artery`);
      assert.ok(g.endRadius <= g.targetRadius * 1.001, `${graft}: the graft narrows to the artery calibre at the toe`);
      assert.ok(g.startRadius > g.endRadius * 1.2, `${graft}: the conduit is wider than its toe`);
      assert.ok(g.beatDrift < BEAT_DRIFT, `${graft}: the anastomosis holds through the beat (${g.beatDrift.toFixed(4)})`);
      if (graft !== 'lima') assert.ok(g.startFromAxis < g.aortaRadius, `${graft}: the proximal end starts inside the ascending aorta`);
    }
    assert.deepEqual(errors, []);
    console.log('PASS graft anastomoses: endpoints on target centrelines, hood inside the lumen, SVG origins in the aorta, stable through the beat');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });

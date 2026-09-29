/**
 * Beat attachment measurement (report section 12, phase A/B).
 * For structures that touch a chamber wall at rest, the offset to the nearest
 * chamber vertex should stay constant while the heart beats. This samples 24
 * phases (plus both sides of each phase boundary) and reports the largest
 * change of that offset, as a percentage of heart length (the normalized
 * atlas spans 3.3 units on its longest chamber axis).
 * Usage: APP_URL=... node scripts/measure-beat-attachment.cjs [screenshotPrefix] [--assert]
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const APP = process.env.APP_URL || 'http://127.0.0.1:5173';
const shotPrefix = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const assertMode = process.argv.includes('--assert');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${APP}/#/mode/anatomy`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    const result = await page.evaluate(() => {
      const HEART_LENGTH = 3.3;
      const CONTACT = 0.06; // "touching" at rest
      const groups = {
        coronaries: m => m.userData.layer === 'coronaries',
        cardiacVeins: m => ['cs', 'gcv', 'mcv', 'piv', 'cardiac-veins'].includes(m.userData.id) || m.userData.veinGroup === 'cardiac-veins',
        papillary: m => ['lv-papillary', 'rv-papillary'].includes(m.userData.id),
        annuli: m => ['mitral-annulus', 'tricuspid-annulus'].includes(m.userData.id),
        greatVessels: m => ['aorta', 'pa', 'svc', 'ivc', 'lspv', 'lipv', 'rspv', 'ripv', 'pv'].includes(m.userData.id),
        // The transseptal fossa marker is a lesson overlay (phase D), not conduction tissue.
        conduction: m => m.userData.layer === 'conduction' && m.userData.id !== 'fossa',
      };
      const chambers = ['lv', 'rv', 'la', 'ra'];
      const meshes = [];
      window.heart.scene.traverse(o => { if (o.isMesh && o.userData.id) meshes.push(o); });
      const world = m => { m.updateWorldMatrix(true, false); const p = m.geometry.attributes.position, e = m.matrixWorld.elements, a = new Float32Array(p.count * 3);
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); a[i * 3] = e[0] * x + e[4] * y + e[8] * z + e[12]; a[i * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; a[i * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14]; } return a; };
      window.heart.seekCycle(0.2); // a filling phase: ventricles relaxed
      // Rest reference: phase where every chamber weight is zero.
      const zeroPhase = 0.25;
      window.heart.seekCycle(zeroPhase);
      const chamberMeshes = chambers.map(id => meshes.find(m => m.userData.id === id)).filter(Boolean);
      const chamberRest = chamberMeshes.map(world);
      // Coarse grid over chamber vertices for nearest queries.
      const cell = 0.1, grid = new Map();
      chamberRest.forEach((arr, c) => { for (let i = 0; i < arr.length; i += 3) { const k = `${Math.floor(arr[i] / cell)},${Math.floor(arr[i + 1] / cell)},${Math.floor(arr[i + 2] / cell)}`; (grid.get(k) || grid.set(k, []).get(k)).push(c, i); } });
      const perChamber = (x, y, z) => { const best = chamberRest.map(() => Infinity); const cx = Math.floor(x / cell), cy = Math.floor(y / cell), cz = Math.floor(z / cell);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { const list = grid.get(`${cx + dx},${cy + dy},${cz + dz}`); if (!list) continue;
          for (let j = 0; j < list.length; j += 2) { const a = chamberRest[list[j]], i = list[j + 1]; const d = (a[i] - x) ** 2 + (a[i + 1] - y) ** 2 + (a[i + 2] - z) ** 2; if (d < best[list[j]]) best[list[j]] = d; } }
        return best.map(Math.sqrt).sort((a, b) => a - b); };
      const nearest = (x, y, z) => { let best = Infinity, bc = -1, bi = -1; const cx = Math.floor(x / cell), cy = Math.floor(y / cell), cz = Math.floor(z / cell);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { const list = grid.get(`${cx + dx},${cy + dy},${cz + dz}`); if (!list) continue;
          for (let j = 0; j < list.length; j += 2) { const a = chamberRest[list[j]], i = list[j + 1]; const d = (a[i] - x) ** 2 + (a[i + 1] - y) ** 2 + (a[i + 2] - z) ** 2; if (d < best) { best = d; bc = list[j]; bi = i; } } }
        return { d: Math.sqrt(best), c: bc, i: bi }; };
      const samples = {};
      for (const [name, test] of Object.entries(groups)) {
        const list = [];
        for (const m of meshes.filter(test)) { const rest = world(m); const step = Math.max(1, Math.floor(rest.length / 3 / 400));
          for (let v = 0; v < rest.length / 3; v += step) { const i = v * 3; const n = nearest(rest[i], rest[i + 1], rest[i + 2]); if (n.d <= CONTACT) list.push({ m, i, c: n.c, ci: n.i, seam: (() => { const d = perChamber(rest[i], rest[i + 1], rest[i + 2]); return d[1] - d[0] < 0.05; })(), off: [rest[i] - chamberRest[n.c][n.i], rest[i + 1] - chamberRest[n.c][n.i + 1], rest[i + 2] - chamberRest[n.c][n.i + 2]] }); } }
        samples[name] = list;
      }
      const phases = [];
      for (let k = 0; k < 24; k++) phases.push(k / 24);
      for (const b of [0.08, 0.32, 0.45, 0.53, 0.60, 0.84, 0.88]) phases.push(b - 0.002, b + 0.002);
      const worst = Object.fromEntries(Object.keys(samples).map(k => [k, 0]));
      for (const list of Object.values(samples)) for (const sm of list) sm.max = 0;
      for (const phase of phases) {
        window.heart.seekCycle(phase);
        const cache = new Map();
        const cur = m => cache.get(m) || cache.set(m, world(m)).get(m);
        const chamberNow = chamberMeshes.map(cur);
        for (const [name, list] of Object.entries(samples)) for (const s of list) {
          const p = cur(s.m), q = chamberNow[s.c];
          const dev = Math.hypot(p[s.i] - q[s.ci] - s.off[0], p[s.i + 1] - q[s.ci + 1] - s.off[1], p[s.i + 2] - q[s.ci + 2] - s.off[2]);
          if (dev > worst[name]) worst[name] = dev;
          if (dev > s.max) s.max = dev;
        }
      }
      window.heart.seekCycle(zeroPhase);
      // Distribution, and how close the worst contact is to a second chamber
      // (a groove between two walls that move differently).
      const secondGap = s => { const p = world(s.m); let d1 = Infinity, d2 = Infinity;
        chamberRest.forEach(a => { let b = Infinity; for (let i = 0; i < a.length; i += 3) { const d = (a[i] - p[s.i]) ** 2 + (a[i + 1] - p[s.i + 1]) ** 2 + (a[i + 2] - p[s.i + 2]) ** 2; if (d < b) b = d; } b = Math.sqrt(b); if (b < d1) { d2 = d1; d1 = b; } else if (b < d2) d2 = b; });
        return { d1: +d1.toFixed(3), d2: +d2.toFixed(3) }; };
      return Object.fromEntries(Object.entries(worst).map(([k, v]) => {
        const devs = samples[k].map(sm => sm.max).sort((a, b) => a - b);
        const pct = x => +(x / HEART_LENGTH * 100).toFixed(2);
        const worstSample = samples[k].reduce((b, sm) => (!b || sm.max > b.max ? sm : b), null);
        const clear = samples[k].filter(sm => !sm.seam).map(sm => sm.max);
        return [k, { contacts: devs.length, seamContacts: devs.length - clear.length, maxOffSeamPct: clear.length ? pct(Math.max(...clear)) : 0, maxDeviationPct: pct(v), p99Pct: devs.length ? pct(devs[Math.floor(0.99 * (devs.length - 1))]) : 0, overOnePct: devs.length ? +(devs.filter(d => d >= HEART_LENGTH * 0.01).length / devs.length * 100).toFixed(1) : 0, worstWalls: worstSample ? secondGap(worstSample) : null, worstMesh: worstSample?.m.name || null, worstOffSeamMesh: samples[k].filter(sm => !sm.seam).reduce((b, sm) => (!b || sm.max > b.max ? sm : b), null)?.m.name || null }];
      }));
    });
    // Tearing, drift and reset: edge stretch of follower meshes across the
    // cycle, and exact return to rest after 100 cycles and after reset.
    const integrity = await page.evaluate(() => {
      const followers = [];
      window.heart.scene.traverse(o => { if (o.isMesh && o.userData.id && (o.userData.layer === 'coronaries' || /papillary|annulus/.test(o.userData.id)) && o.geometry.index) followers.push(o); });
      window.heart.seekCycle(0.25);
      const rest = new Map(followers.map(m => [m, Float32Array.from(m.geometry.attributes.position.array)]));
      const edgeLen = (a, i, j) => Math.hypot(a[i * 3] - a[j * 3], a[i * 3 + 1] - a[j * 3 + 1], a[i * 3 + 2] - a[j * 3 + 2]);
      let stretch = 0, stretchAbs = 0, stretchMesh = '';
      const byGroup = {};
      const groupOf = m => m.userData.layer === 'coronaries' ? 'coronaries' : /papillary/.test(m.userData.id) ? 'papillary' : 'annuli';
      for (const phase of [0.38, 0.5, 0.65, 0.8]) {
        window.heart.seekCycle(phase);
        for (const m of followers) {
          const idx = m.geometry.index.array, cur = m.geometry.attributes.position.array, r = rest.get(m);
          for (let t = 0; t < idx.length; t += 9) for (const [a, b] of [[idx[t], idx[t + 1]], [idx[t + 1], idx[t + 2]]]) {
            const l0 = edgeLen(r, a, b), l1 = edgeLen(cur, a, b);
            if (Math.abs(l1 - l0) > stretchAbs) { stretchAbs = Math.abs(l1 - l0); stretchMesh = m.name; }
            const g = groupOf(m); byGroup[g] = Math.max(byGroup[g] || 0, Math.abs(l1 - l0));
            if (l0 >= 0.01) stretch = Math.max(stretch, Math.abs(l1 / l0 - 1));
          }
        }
      }
      for (let c = 0; c < 100; c++) for (const f of [0.1, 0.38, 0.55, 0.65, 0.8, 0.95]) window.heart.seekCycle(c + f);
      window.heart.seekCycle(0.25);
      let drift = 0;
      for (const m of followers) { const cur = m.geometry.attributes.position.array, r = rest.get(m); for (let i = 0; i < r.length; i++) drift = Math.max(drift, Math.abs(cur[i] - r[i])); }
      window.heart.seekCycle(0.65);
      document.querySelector('#reset').click();
      let resetGap = 0;
      for (const m of followers) { const cur = m.geometry.attributes.position.array, r = rest.get(m); for (let i = 0; i < r.length; i++) resetGap = Math.max(resetGap, Math.abs(cur[i] - r[i])); }
      // Relative stretch on edges of at least 0.01 units; absolute change as % of heart length.
      return { maxEdgeStretchPct: +(stretch * 100).toFixed(1), maxEdgeChangePctOfHeart: +(stretchAbs / 3.3 * 100).toFixed(2), worstEdgeMesh: stretchMesh, edgeChangePctOfHeartByGroup: Object.fromEntries(Object.entries(byGroup).map(([k, v]) => [k, +(v / 3.3 * 100).toFixed(2)])), driftAfter100Cycles: drift, resetGap };
    });
    result.integrity = integrity;
    if (shotPrefix) {
      for (const [view, phase] of [['anterior', 0.65], ['posterior', 0.65], ['lao', 0.65], ['rao', 0.65]]) {
        await page.evaluate(([v, p]) => { window.heart.setView(v); window.heart.seekCycle(p); }, [view, phase]);
        await page.waitForTimeout(300);
        await page.waitForSelector('#viewport[data-camera-settled=true]');
        await page.locator('#viewport').screenshot({ path: `${shotPrefix}-${view}.png` });
      }
    }
    console.log(JSON.stringify({ errors, result }, null, 1));
    if (assertMode) {
      const limit = 1; // report target: below 1% of heart length
      // Seams between two chambers inherit the walls' own divergence (phase C).
      const bad = Object.entries(result).filter(([k, r]) => r.contacts && r.maxOffSeamPct >= limit && ['coronaries', 'cardiacVeins', 'papillary', 'annuli', 'greatVessels', 'conduction'].includes(k));
      if (result.integrity.driftAfter100Cycles > 1e-6) bad.push(['drift', result.integrity.driftAfter100Cycles]);
      if (result.integrity.resetGap > 1e-6) bad.push(['reset', result.integrity.resetGap]);
      if (bad.length || errors.length) { console.error('FAIL', bad, errors); process.exit(1); }
      console.log('PASS: away from two-chamber seams, attached structures stay within 1% of heart length of their wall');
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });

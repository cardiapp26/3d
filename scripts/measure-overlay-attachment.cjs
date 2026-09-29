/**
 * Overlay beat attachment (report section 12, phase D).
 * Lesson overlays and devices (EP lines and lesions, pacemaker leads,
 * transseptal and cath catheters) that touch a chamber wall at rest should
 * keep their offset to the nearest wall vertex while the heart beats. For each
 * lesson step this samples 24 phases plus both sides of each phase boundary
 * and reports the largest offset change as a percentage of heart length
 * (3.3 units). It also advances a lead while the heart beats and the camera
 * moves, and checks the result equals a fresh binding (no drift), and that
 * reduced motion returns every overlay to rest.
 * Usage: APP_URL=... node scripts/measure-overlay-attachment.cjs [--assert]
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const APP = process.env.APP_URL || 'http://127.0.0.1:5173';
const assertMode = process.argv.includes('--assert');

const CONFIGS = [
  { mode: 'ablation', setter: 'setAblationStep', steps: [0, 1, 2, 3] },
  { mode: 'pacemaker', setter: 'setPacemakerStep', steps: [0, 1, 2, 3] },
  { mode: 'bachmann', setter: 'setBachmannStep', steps: [1, 2] },
  { mode: 'transseptal', setter: 'setTransseptalStep', steps: [0, 1, 2, 3] },
  { mode: 'cath', setter: 'setCathStep', steps: [0, 1, 2, 3, 4] },
];

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${APP}/#/mode/anatomy`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    const result = await page.evaluate(async configs => {
      const h = window.heart;
      const frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const HEART_LENGTH = 3.3, CONTACT = 0.06;
      const shown = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
      const world = m => { m.updateWorldMatrix(true, false); const p = m.geometry.attributes.position, e = m.matrixWorld.elements, a = new Float32Array(p.count * 3);
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); a[i * 3] = e[0] * x + e[4] * y + e[8] * z + e[12]; a[i * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; a[i * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14]; } return a; };
      const chamberMeshes = ['lv', 'rv', 'la', 'ra'].map(id => { let found = null; h.scene.traverse(o => { if (!found && o.isMesh && o.userData.id === id) found = o; }); return found; }).filter(Boolean);
      // Overlays: visible geometry outside the atlas registry (no structure id).
      const overlays = () => { const list = []; h.scene.traverse(o => { if ((o.isMesh || o.isLine) && !o.isInstancedMesh && o.geometry?.attributes?.position && (!o.userData.id || o.userData.pickId) && shown(o) && !chamberMeshes.includes(o)) list.push(o); }); return list.filter(o => !o.userData.layer || o.userData.pickId); };
      const phases = [];
      for (let k = 0; k < 24; k++) phases.push(k / 24);
      for (const b of [0.08, 0.32, 0.45, 0.53, 0.60, 0.84, 0.88]) phases.push(b - 0.002, b + 0.002);
      const report = {};
      h.setReducedMotion(true); await frames();
      const chamberRest = chamberMeshes.map(world);
      const cell = 0.1, grid = new Map();
      chamberRest.forEach((arr, c) => { for (let i = 0; i < arr.length; i += 3) { const k = `${Math.floor(arr[i] / cell)},${Math.floor(arr[i + 1] / cell)},${Math.floor(arr[i + 2] / cell)}`; (grid.get(k) || grid.set(k, []).get(k)).push(c, i); } });
      const nearest = (x, y, z) => { let best = Infinity, bc = -1, bi = -1; const cx = Math.floor(x / cell), cy = Math.floor(y / cell), cz = Math.floor(z / cell);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { const list = grid.get(`${cx + dx},${cy + dy},${cz + dz}`); if (!list) continue;
          for (let j = 0; j < list.length; j += 2) { const a = chamberRest[list[j]], i = list[j + 1]; const d = (a[i] - x) ** 2 + (a[i + 1] - y) ** 2 + (a[i + 2] - z) ** 2; if (d < best) { best = d; bc = list[j]; bi = i; } } }
        return { d: Math.sqrt(best), c: bc, i: bi }; };
      let restGap = 0;
      for (const { mode, setter, steps } of configs) {
        h.setMode(mode);
        for (const step of steps) {
          h[setter](step); h.setProgress(1);
          h.setReducedMotion(true); await frames();
          const objs = overlays();
          const rest = new Map(objs.map(o => [o, world(o)]));
          const samples = [];
          for (const [o, arr] of rest) { const stride = Math.max(1, Math.floor(arr.length / 3 / 300));
            for (let v = 0; v < arr.length / 3; v += stride) { const i = v * 3, n = nearest(arr[i], arr[i + 1], arr[i + 2]); if (n.d <= CONTACT) samples.push({ o, i, c: n.c, ci: n.i, off: [arr[i] - chamberRest[n.c][n.i], arr[i + 1] - chamberRest[n.c][n.i + 1], arr[i + 2] - chamberRest[n.c][n.i + 2]] }); } }
          h.setReducedMotion(false);
          let worst = 0, worstName = '', maxMove = 0;
          for (const phase of phases) {
            h.seekCycle(phase); await frames();
            const cache = new Map(); const cur = m => cache.get(m) || cache.set(m, world(m)).get(m);
            const chamberNow = chamberMeshes.map(cur);
            for (const s of samples) {
              const p = cur(s.o), q = chamberNow[s.c];
              const dev = Math.hypot(p[s.i] - q[s.ci] - s.off[0], p[s.i + 1] - q[s.ci + 1] - s.off[1], p[s.i + 2] - q[s.ci + 2] - s.off[2]);
              if (dev > worst) { worst = dev; worstName = s.o.name || s.o.parent?.name || s.o.type; }
            }
            for (const [o, arr] of rest) { const p = cur(o); for (let i = 0; i < arr.length; i += 3) maxMove = Math.max(maxMove, Math.hypot(p[i] - arr[i], p[i + 1] - arr[i + 1], p[i + 2] - arr[i + 2])); }
          }
          // Reduced motion: overlays back to rest exactly.
          h.setReducedMotion(true); await frames();
          for (const [o, arr] of rest) { const p = world(o); for (let i = 0; i < arr.length; i++) restGap = Math.max(restGap, Math.abs(p[i] - arr[i])); }
          report[`${mode}:${step}`] = { overlays: objs.length, contacts: samples.length, maxDeviationPct: +(worst / HEART_LENGTH * 100).toFixed(2), worst: worstName, maxMovePct: +(maxMove / HEART_LENGTH * 100).toFixed(2) };
        }
      }
      // Lesson progress + beat + camera at once: advance the leads while the
      // heart beats and the camera moves, then compare with a fresh binding.
      h.setMode('pacemaker'); h.setPacemakerStep(3); h.setReducedMotion(false);
      const views = ['anterior', 'lao', 'rao', 'posterior'];
      h.setBeating(true);
      for (let i = 0; i <= 40; i++) { h.setProgress(0.05 + i * 0.95 / 40); if (i % 10 === 0) h.setView?.(views[(i / 10) % views.length]); await new Promise(r => requestAnimationFrame(r)); }
      h.setBeating(false); h.seekCycle(0.65); await frames();
      const leadsAfter = overlays().map(world);
      h.setMode('anatomy'); await frames(); h.setMode('pacemaker'); h.setPacemakerStep(3); h.setProgress(1); h.seekCycle(0.65); await frames();
      const leadsFresh = overlays().map(world);
      let progressGap = 0;
      leadsAfter.forEach((a, k) => { const b = leadsFresh[k]; if (!b || b.length !== a.length) { progressGap = Infinity; return; } for (let i = 0; i < a.length; i++) progressGap = Math.max(progressGap, Math.abs(a[i] - b[i])); });
      h.setReducedMotion(true); await frames();
      const bound = h.overlayFollowCount();
      h.setReducedMotion(false); h.setMode('anatomy');
      return { steps: report, progressWhileBeatingGap: progressGap, restGapAfterReducedMotion: restGap, boundAtRest: bound };
    }, CONFIGS);
    console.log(JSON.stringify(result, null, 1));
    if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);
    if (assertMode) {
      const bad = Object.entries(result.steps).filter(([, r]) => r.maxDeviationPct >= 1);
      if (bad.length) throw new Error(`overlays leave their wall by >= 1% of heart length: ${bad.map(([k, r]) => `${k} ${r.maxDeviationPct}% (${r.worst})`).join(', ')}`);
      // Largest expected motion: the AV-plane descent (7% of ventricle length,
      // about 5% of heart length) plus the radial squeeze near it.
      if (Object.values(result.steps).some(r => r.maxMovePct > 8)) throw new Error('an overlay moves more than 8% of heart length');
      if (result.progressWhileBeatingGap > 1e-5) throw new Error(`advancing leads while beating differs from a fresh binding by ${result.progressWhileBeatingGap}`);
      if (result.restGapAfterReducedMotion > 1e-6 || result.boundAtRest !== 0) throw new Error('reduced motion does not return overlays to rest');
      console.log('PASS: lesson overlays and devices stay within 1% of heart length of their wall in every step; advancing leads while beating matches a fresh binding; reduced motion restores rest');
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });

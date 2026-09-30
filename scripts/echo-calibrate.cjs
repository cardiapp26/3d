/**
 * Echo view presets on this atlas (research/TTE_TEE_ENTEGRASYON_RAPORU.md,
 * stages 2-3): grid search around each landmark preset for the probe pose
 * whose section shows the view's required structures, none of its avoided
 * ones and (apical views) no foreshortening, at rest and through the beat
 * (the worst of PHASES counts: the AV plane descends in systole). TEE
 * multiplane angles stay in the guideline range of the view. The printed offsets are what
 * src/echo-views.js keeps as calibration; they fit this atlas only and are
 * not an expert review.
 * Usage: APP_URL=... node scripts/echo-calibrate.cjs [viewId ...]
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const APP = process.env.APP_URL || 'http://127.0.0.1:5173';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    await page.goto(`${APP}/`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    const result = await page.evaluate(async only => {
      const { measureEchoAnatomy, echoItems, surfaceExit } = await import('/src/echo-anatomy.js');
      const V = await import('/src/echo-views.js');
      const { tteFrame, teeFrame } = await import('/src/echo-probe.js');
      const { sectionMeshes } = await import('/src/echo-section.js');
      const { evaluateView } = await import('/src/echo-training.js');
      const h = window.heart;
      const getMeshes = id => { const l = []; h.scene.traverse(o => { if (o.isMesh && o.userData.id === id && !o.userData.micro) l.push(o); }); return l; };
      const A = measureEchoAnatomy({ getMeshes });
      const hull = ['lv', 'rv', 'la', 'ra', 'aorta', 'pa'].flatMap(getMeshes);
      const items = echoItems(getMeshes);
      const path = V.teePath(A);
      const angle = V.SECTOR_ANGLE;
      const range = (a, b, step) => { const out = []; for (let v = a; v <= b + 1e-9; v += step) out.push(+v.toFixed(4)); return out; };
      // Rest, then diastole, atrial systole, ejection and relaxation.
      const PHASES = [null, 0.1, 0.4, 0.55, 0.75];
      const atPhase = phase => { if (phase === null) h.withRestPose(() => {}); else h.seekCycle(phase); };
      // Worst score over the phases for one frame and depth set.
      const worst = (frame, view, depths, offset) => {
        const per = depths.map(() => ({ s: -Infinity, e: null }));
        for (const phase of PHASES) {
          if (phase === null) h.seekCycle(0);
          const section = phase === null ? h.withRestPose(() => sectionMeshes(items, frame)) : (h.seekCycle(phase), sectionMeshes(items, frame));
          depths.forEach((depth, k) => {
            const e = evaluateView(section, view, { sectorAngle: angle, depth, frame, anatomy: A, label: x => x, lang: 'en' });
            const s = score(e, offset);
            if (s > per[k].s) per[k] = { s, e };
          });
        }
        return per;
      };
      const score = (e, offset) => {
        const fs = e.foreshortening;
        return e.missing.length * 3 + e.wrong.length * 2 + (fs && !fs.ok ? 2 + Math.max(0, 0.9 - fs.ratio) * 5 + fs.apexOffPlane : 0) + offset * 0.002;
      };
      const out = {};
      for (const view of V.TTE_VIEWS) {
        if (only.length && !only.includes(view.id)) continue;
        const base = V.tteBase(view.id, A, (p, d) => surfaceExit(p, d, hull));
        let best = null;
        const depths = [base.depth, base.depth - 0.6];
        for (const rotation of range(-40, 40, 10)) for (const tilt of range(-25, 25, 5)) for (const rock of range(-30, 30, 10)) {
          const adj = { rotation, tilt, rock };
          const frame = tteFrame(base, adj);
          worst(frame, view, depths, Math.abs(rotation) + Math.abs(tilt) + Math.abs(rock)).forEach(({ s: raw, e }, k) => {
            const s = raw + (k ? 0.01 : 0);
            if (!best || s < best.s) best = { s, adj: { ...adj, depthOffset: +(depths[k] - base.depth).toFixed(2) }, ok: e.achieved && raw < 1, missing: e.missing, wrong: e.wrong, fs: e.foreshortening && +e.foreshortening.ratio.toFixed(2) };
          });
        }
        out[view.id] = best;
      }
      const omegaRange = { me4c: [0, 15], memc: [50, 70], me2c: [80, 100], melax: [120, 140], meavsax: [25, 50], mebicaval: [90, 115], melaa: [60, 95], tgsax: [0, 20] };
      for (const view of V.TEE_VIEWS) {
        if (only.length && !only.includes(view.id)) continue;
        const preset = V.teePreset(view.id, A, path);
        const tg = view.id === 'tgsax';
        let best = null;
        const depths = [4.8, 4.2, 3.6, 3];                  // deepest first: ties keep the clinical depth
        for (const advance of range(preset.advance - (tg ? 0.03 : 0.04), Math.min(1, preset.advance + (tg ? 0.03 : 0.04)), tg ? 0.015 : 0.02))
          for (const rotation of range(preset.rotation - 30, preset.rotation + 30, 15)) for (const flexion of range(preset.flexion - 20, preset.flexion + 20, 10))
            for (const omega of range(...omegaRange[view.id], 5)) {
              const state = { advance, rotation, flexion, lateralFlexion: 0, omega };
              const frame = teeFrame(path, state);
              const offset = Math.abs(rotation - preset.rotation) / 5 + Math.abs(flexion - preset.flexion) / 10 + Math.abs(advance - preset.advance) * 20;
              worst(frame, view, depths, offset).forEach(({ s, e }, k) => {
                if (!best || s < best.s - 1e-9) best = { s, state: { ...state, depth: depths[k] }, ok: e.achieved && s < 1, missing: e.missing, wrong: e.wrong, fs: e.foreshortening && +e.foreshortening.ratio.toFixed(2), lengths: Object.fromEntries(Object.entries(e.lengths).map(([id, x]) => [id, +x.toFixed(2)])) };
              });
            }
        best.state.advanceOffset = +(best.state.advance - preset.advance).toFixed(3);
        out[view.id] = best;
      }
      return out;
    }, process.argv.slice(2));
    for (const [id, r] of Object.entries(result)) console.log(id.padEnd(10), r.ok ? 'OK ' : 'no ', JSON.stringify(r.adj || r.state), JSON.stringify({ missing: r.missing, wrong: r.wrong, fs: r.fs }), process.env.VERBOSE ? JSON.stringify(r.lengths) : '');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });

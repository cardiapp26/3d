/**
 * ICE presets on this atlas (research/ICE_INCELEME_RAPORU.md, section 4.3):
 * grid search over advance, handle rotation, the two deflection knobs and the
 * depth for the catheter pose whose section meets each view's criteria
 * (targets, relations, near/far order, landmarks, avoided structures) at rest
 * and through the beat. The search prefers the source manoeuvre: rotation
 * inside the source range and deflections in the source direction; the
 * printed departures are what src/echo-views.js documents. Atlas fit only,
 * not an expert review.
 * Usage: APP_URL=... node scripts/ice-calibrate.cjs [viewId ...]
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const APP = process.env.APP_URL || 'http://127.0.0.1:5173';
// Source manoeuvre: rotation range (degrees clockwise from home) and the expected deflection signs (0: neutral).
const SOURCE = {
  'ice-home': { rot: [15, 30], ap: 0, lr: 0 }, 'ice-rvot': { rot: [30, 40], ap: 0, lr: 0 }, 'ice-lvot': { rot: [40, 50], ap: 0, lr: 0 },
  'ice-mitral-laa': { rot: [60, 80], ap: 0, lr: 0 }, 'ice-left-pv': { rot: [90, 100], ap: 0, lr: 0 },
  'ice-septal-sax': { rot: [100, 150], ap: -1, lr: -1 }, 'ice-right-pv': { rot: [150, 180], ap: -1, lr: 0 }, 'ice-svc': { rot: [210, 240], ap: 0, lr: 0 }
};

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    await page.goto(`${APP}/#/mode/ice`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.waitForFunction(() => window.cardiaEcho?.getAnatomy());
    const result = await page.evaluate(async ({ only, SOURCE }) => {
      const { echoItems } = await import('/src/echo-anatomy.js');
      const V = await import('/src/echo-views.js');
      const { iceFrame } = await import('/src/echo-probe.js');
      const { sectionMeshes } = await import('/src/echo-section.js');
      const { evaluateView } = await import('/src/echo-training.js');
      const h = window.heart;
      const getMeshes = id => { const l = []; h.scene.traverse(o => { if (o.isMesh && o.userData.id === id && !o.userData.micro) l.push(o); }); return l; };
      const A = window.cardiaEcho.getAnatomy();
      const path = window.cardiaEcho.getIcePath();
      const items = h.withRestPose(() => echoItems(getMeshes));
      const angle = V.SECTOR_ANGLE;
      const range = (a, b, step) => { const out = []; for (let v = a; v <= b + 1e-9; v += step) out.push(+v.toFixed(3)); return out; };
      const PHASES = [0.1, 0.4, 0.55, 0.75];
      const fails = e => e.missing.length * 3 + e.wrong.length * 2 + (e.relations || []).filter(r => !r.ok).length * 2
        + (e.order || []).filter(o => !o.ok).length * 2 + (e.landmarks || []).filter(l => !l.ok).length * 2;
      const evalAt = (frame, view, depth, phase) => {
        const section = phase === null ? h.withRestPose(() => sectionMeshes(items, frame)) : (h.seekCycle(phase), sectionMeshes(items, frame));
        return evaluateView(section, view, { sectorAngle: angle, depth, frame, anatomy: A, label: x => x, lang: 'en' });
      };
      const out = {};
      for (const view of V.ICE_VIEWS) {
        if (only.length && !only.includes(view.id)) continue;
        const src = SOURCE[view.id];
        const departure = st => Math.abs(st.advance - 0.55) + Math.max(0, src.rot[0] - st.rotation, st.rotation - src.rot[1]) / 10
          + (src.ap ? (Math.sign(st.anteroposterior) === src.ap ? 0 : 1 + Math.abs(st.anteroposterior) / 30) : Math.abs(st.anteroposterior) / 30)
          + (src.lr ? (Math.sign(st.leftRight) === src.lr ? 0 : 1 + Math.abs(st.leftRight) / 30) : Math.abs(st.leftRight) / 30);
        const cands = [];
        for (const advance of [0.4, 0.5, 0.55, 0.6, 0.7]) for (const rotation of range(src.rot[0] - 15, src.rot[1] + 15, 5))
          for (const anteroposterior of range(-45, 45, 15)) for (const leftRight of range(-45, 45, 15)) for (const depth of [3.6, 4.2, 4.8]) {
            const st = { advance, rotation, anteroposterior, leftRight };
            const frame = iceFrame(path, st);
            const e = evalAt(frame, view, depth, null);
            cands.push({ st: { ...st, depth }, rest: fails(e), dep: departure(st), e });
          }
        cands.sort((a, b) => a.rest - b.rest || a.dep - b.dep);
        let best = null;
        for (const c of cands.slice(0, 40)) {
          const frame = iceFrame(path, c.st);
          const worst = Math.max(c.rest, ...PHASES.map(ph => fails(evalAt(frame, view, c.st.depth, ph))));
          const s = worst * 10 + c.dep;
          if (!best || s < best.s) best = { s, worst, dep: +c.dep.toFixed(2), preset: c.st, missing: c.e.missing, wrong: c.e.wrong, relations: (c.e.relations || []).map(r => `${r.a}-${r.b}:${r.gap.toFixed(2)}`), landmarks: (c.e.landmarks || []).map(l => `${l.id}:${l.ok}`) };
        }
        h.seekCycle(0);
        out[view.id] = best;
      }
      return out;
    }, { only: process.argv.slice(2), SOURCE });
    console.log(JSON.stringify(result, null, 1));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });

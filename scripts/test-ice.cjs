/**
 * ICE acceptance checks (research/ICE_INCELEME_RAPORU.md, section 5): one
 * pose model for the catheter and the image plane (knob signs as on the
 * catheter; advance and rotation kept apart), vein identities (left versus
 * right), MV/LAA needs the LAA, the septal working view needs the septal
 * relation and the fossa, outflow and SVC targets (failures pinned to their
 * cause), every preset at rest and at four beat phases, the clockwise sweep,
 * the schematic transseptal stages, TR/EN parity and a phone viewport.
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
    await page.goto(`${APP}/#/mode/ice`);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.waitForFunction(() => window.cardiaEcho?.getAnatomy());

    // 1. Pose model: catheter, transducer and plane from one model.
    const pose = await page.evaluate(async () => {
      const { iceFrame } = await import('/src/echo-probe.js');
      const path = window.cardiaEcho.getIcePath();
      const f = (s) => iceFrame(path, { advance: 0.5, ...s });
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const d = (a, b) => a.map((x, i) => x - b[i]);
      const n = f({});
      const ant = f({ anteroposterior: 30 }), post = f({ anteroposterior: -30 }), left = f({ leftRight: 30 });
      const rot = f({ rotation: 90 }), adv = f({ advance: 0.8 });
      const close = (a, b) => Math.hypot(...d(a, b)) < 1e-9;
      return {
        homeFacesAnterior: n.beam[2] > 0.5,                                 // +z anterior: the home beam faces the TV
        tipTowardFace: dot(d(ant.tip, n.tip), n.beam) > 0.05, tipAwayFromFace: dot(d(post.tip, n.tip), n.beam) < -0.05,
        leftAtHome: d(left.tip, n.tip)[0] > 0.05,                          // +x is the patient's left
        distalInPlane: Math.abs(dot(ant.distal, ant.normal)) < 1e-9 && Math.abs(dot(left.distal, left.normal)) < 1e-9,
        distalIsScreenRight: close(ant.distal, ant.lateral),
        originOnTip: Math.hypot(...d(ant.origin, ant.tip)) < 0.05,
        catheterEndsAtTip: close(ant.catheter[ant.catheter.length - 1], ant.tip),
        rotationKeepsTip: close(rot.tip, n.tip),                           // undeflected: rotation turns, does not move
        advanceKeepsPlane: close(adv.beam, n.beam) && close(adv.lateral, n.lateral) && Math.abs(dot(d(adv.tip, n.tip), n.beam)) < 1e-9
      };
    });
    for (const [k, v] of Object.entries(pose)) assert.equal(v, true, `pose: ${k}`);

    // 2. Presets meet the view criteria through the beat; wrong-side or wrong-view poses do not.
    const cross = await page.evaluate(async () => {
      const { iceFrame } = await import('/src/echo-probe.js');
      const V = await import('/src/echo-views.js');
      const { echoItems } = await import('/src/echo-anatomy.js');
      const { sectionMeshes } = await import('/src/echo-section.js');
      const { evaluateView } = await import('/src/echo-training.js');
      const h = window.heart, A = window.cardiaEcho.getAnatomy();
      const pathOf = (id) => window.cardiaEcho.getIcePath(V.icePosition(V.viewById(id)));
      const gm = (id) => h.getMeshes(id).filter((m) => !m.userData.micro);
      const items = h.withRestPose(() => echoItems(gm));
      const judge = (viewId, poseId, phase = null) => {
        const p = V.icePreset(poseId), frame = iceFrame(pathOf(poseId), p);
        const ctx = { sectorAngle: V.SECTOR_ANGLE, depth: p.depth, frame, anatomy: A, label: (x) => x, lang: 'en' };
        if (phase === null) return h.withRestPose(() => evaluateView(sectionMeshes(items, frame), V.viewById(viewId), ctx));
        h.seekCycle(phase);
        return evaluateView(sectionMeshes(items, frame), V.viewById(viewId), ctx);
      };
      // Every preset at rest and at four phases of the beat.
      const out = {};
      for (const v of V.ICE_VIEWS) out[v.id] = [null, 0, 0.1, 0.4, 0.55, 0.75, 0.88].every((ph) => judge(v.id, v.id, ph).achieved);
      h.seekCycle(0);
      const lAtR = judge('ice-left-pv', 'ice-right-pv'), rAtL = judge('ice-right-pv', 'ice-left-pv');
      return {
        presets: out,
        leftAtRight: { achieved: lAtR.achieved, missing: lAtR.missing, wrong: lAtR.wrong },
        rightAtLeft: { achieved: rAtL.achieved, missing: rAtL.missing, wrong: rAtL.wrong },
        laaAtLvot: judge('ice-mitral-laa', 'ice-lvot'),
        septalAtMitral: judge('ice-septal-sax', 'ice-mitral-laa'),
        septalAtLeftPv: judge('ice-septal-sax', 'ice-left-pv'),
        rvotAtHome: judge('ice-rvot', 'ice-home'),
        svcAtRightPv: judge('ice-svc', 'ice-right-pv'),
        // LA tour: left and right veins keep their identity, the LAA view needs the LAA, the posterior wall the oesophagus.
        laLeftAtRight: judge('ice-la-lspv', 'ice-la-rspv').achieved, laRightAtLeft: judge('ice-la-rspv', 'ice-la-lspv').achieved,
        laHomeAtPosterior: judge('ice-la-home', 'ice-la-posterior').achieved, laPosteriorAtHome: judge('ice-la-posterior', 'ice-la-home'),
        laPath: window.cardiaEcho.getIcePath('la'), raPath: window.cardiaEcho.getIcePath('ra'),
        laTip: iceFrame(window.cardiaEcho.getIcePath('la'), V.icePreset('ice-la-home')).tip, laCentre: A.la, fossa: A.fossa.center,
        parity: V.ICE_VIEWS.every((v) => v.motion?.tr && v.motion?.en && v.ase?.tr && v.ase?.en && v.title?.tr && v.title?.en)
          && Object.values(V.ICE_PRESET_NOTES).every((n) => n.tr && n.en),
        septalLandmark: judge('ice-septal-sax', 'ice-septal-sax').landmarks,
        lvotOrder: V.viewById('ice-lvot').order,
        septalRequires: V.viewById('ice-septal-sax'), rvot: V.viewById('ice-rvot').required, laaView: V.viewById('ice-mitral-laa').required
      };
    });
    for (const [id, ok] of Object.entries(cross.presets)) assert.equal(ok, true, `${id}: preset meets its criteria`);
    assert.equal(cross.leftAtRight.achieved, false, 'left PV task not met by the right veins');
    assert.ok(cross.leftAtRight.missing.some((x) => ['lspv', 'lipv'].includes(x)) || cross.leftAtRight.wrong.some((x) => ['rspv', 'ripv'].includes(x)), JSON.stringify(cross.leftAtRight));
    assert.equal(cross.rightAtLeft.achieved, false, 'right PV task not met by the left veins');
    assert.equal(cross.laaAtLvot.achieved, false, 'MV/LAA not met without the LAA');
    assert.ok(cross.laaAtLvot.missing.includes('laa') || cross.laaAtLvot.sides.some((x) => !x.ok), `MV/LAA fails on the LAA: ${JSON.stringify(cross.laaAtLvot.missing)}`);
    assert.ok(cross.rvotAtHome.missing.includes('pulmonary-valve') || cross.rvotAtHome.order.some((o) => !o.ok), 'RVOT fails on the pulmonary valve');
    const septalCause = (e) => e.missing.length || e.relations.some((r) => !r.ok) || e.order.some((o) => !o.ok) || e.landmarks.some((l) => !l.ok);
    assert.ok(septalCause(cross.septalAtMitral) && septalCause(cross.septalAtLeftPv), 'septal view fails on its septal criteria');
    assert.ok(cross.svcAtRightPv.missing.includes('svc') || cross.svcAtRightPv.relations.some((r) => !r.ok) || cross.svcAtRightPv.wrong.length, 'SVC view fails on the SVC');
    assert.equal(cross.parity, true, 'every ICE view and atlas note has TR and EN text');
    assert.ok(cross.laaView.includes('laa') && cross.rvot.includes('pulmonary-valve'));
    assert.deepEqual(cross.lvotOrder, [['aortic-valve', 'lv']], 'LVOT view scores AV near, LV far');
    assert.equal(cross.septalAtMitral.achieved, false, 'septal working view needs the septal relation');
    assert.equal(cross.septalAtLeftPv.achieved, false);
    assert.equal(cross.rvotAtHome.achieved, false, 'RVOT needs the pulmonary valve');
    assert.equal(cross.svcAtRightPv.achieved, false);
    assert.equal(cross.laLeftAtRight, false, 'LA ICE: the LSPV view is not met at the RSPV pose');
    assert.equal(cross.laRightAtLeft, false, 'LA ICE: the RSPV view is not met at the LSPV pose');
    assert.equal(cross.laHomeAtPosterior, false, 'LA home needs the LAA and the mitral valve');
    assert.ok(cross.laPosteriorAtHome.landmarks.some((l) => l.id === 'oesophagus'), 'the posterior wall view checks the oesophagus');
    assert.ok(cross.laPath && cross.laPath.position === 'la' && cross.raPath.position !== 'la', 'two catheter positions');
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    assert.ok(dist(cross.laPath.base, cross.fossa) < 1e-9, 'the LA path starts at the fossa (septal crossing)');
    assert.ok(dist(cross.laTip, cross.laCentre) < dist(cross.fossa, cross.laCentre), 'the LA home tip sits inside the LA, past the fossa');
    assert.equal(cross.septalLandmark[0].id, 'fossa'); assert.equal(cross.septalLandmark[0].ok, true, 'fossa ovalis in the septal preset');
    assert.deepEqual(cross.septalRequires.order, [['ra', 'la']], 'RA near field, LA far field');
    // The septal preset follows the source manoeuvre: posterior and right deflection, clockwise 100-150.
    const septal = await page.evaluate(async () => (await import('/src/echo-views.js')).icePreset('ice-septal-sax'));
    assert.ok(septal.anteroposterior < 0 && septal.leftRight < 0 && septal.rotation >= 100 && septal.rotation <= 150, JSON.stringify(septal));

    // 3. Panel: manoeuvre text, atlas note, target highlight, matching knob labels.
    await page.evaluate(() => window.cardiaEcho.selectView('ice-svc'));
    assert.match(await page.locator('.echo-ice-info').textContent(), /Manevra:.*Atlas notu:.*posterior/);
    const labels = await page.evaluate(async () => {
      const src = await (await fetch('/src/echo-panel.js')).text();
      return { tr: /Ön \(\+\) \/ arka \(−\) büküm: ucu transdüser yüzüne doğru/.test(src), en: /Anterior \(\+\) \/ posterior \(−\) deflection: tip toward \/ away from the transducer face/.test(src) };
    });
    assert.ok(labels.tr && labels.en, 'TR/EN knob labels describe the same motion');

    // 4. Sweep: the catheter moves to the next view of the clockwise sequence.
    await page.evaluate(() => window.cardiaEcho.selectView('ice-home'));
    await page.locator('[data-echo-sweep="1"]').click();
    await page.waitForTimeout(2200);
    const afterSweep = await page.evaluate(() => ({ view: window.cardiaEcho.getState().view, ice: window.cardiaEcho.getState().ice }));
    assert.equal(afterSweep.view, 'ice-rvot');
    const rvot = await page.evaluate(async () => (await import('/src/echo-views.js')).icePreset('ice-rvot'));
    assert.equal(afterSweep.ice.rotation, rvot.rotation, 'sweep ends on the preset');
    // The sweep stays within the catheter position: from the last RA view there is no next view, the LA tour has its own order.
    await page.evaluate(() => window.cardiaEcho.selectView('ice-svc'));
    assert.equal(await page.locator('[data-echo-sweep="1"]').isDisabled(), true, 'the RA sequence ends at the SVC view');
    await page.evaluate(() => window.cardiaEcho.selectView('ice-la-home'));
    assert.equal(await page.locator('[data-echo-sweep="-1"]').isDisabled(), true, 'the LA tour starts at the LA home view');
    await page.locator('[data-echo-sweep="1"]').click();
    await page.waitForTimeout(2200);
    assert.equal(await page.evaluate(() => window.cardiaEcho.getState().view), 'ice-la-lspv', 'LA tour: home, then the left superior vein');
    assert.match(await page.locator('.echo-views').textContent(), /Sol atriyum \(transseptal\)/, 'the LA views have their own group');
    const catheter = await page.evaluate(() => { const g = window.heart.scene.getObjectByName('ICE catheter (schematic)'); return g?.visible; });
    assert.equal(catheter, true, 'the catheter is drawn across the septum');
    assert.match(await page.locator('.echo-sub').textContent(), /Enriquez 2026.*fossa → LA/, 'LA views name their source and path in the header');

    // 5. Transseptal stages: only on the septal view; needle in 3D and paths in 2D.
    await page.evaluate(() => window.cardiaEcho.selectView('ice-septal-sax'));
    assert.equal(await page.locator('[data-echo-transseptal]').isVisible(), true);
    await page.locator('[data-echo-ts-stage=tenting]').click();
    const ts = await page.evaluate(() => {
      const needle = window.heart.scene.getObjectByName('Transseptal needle (schematic)');
      return { visible: needle?.visible, stage: window.cardiaEcho.getState().transseptal };
    });
    assert.deepEqual(ts, { visible: true, stage: 'tenting' });
    assert.match(await page.locator('.echo-transseptal-text').textContent(), /çadır/);
    assert.match(await page.locator('.echo-transseptal-limits').textContent(), /güvenli ponksiyon kanıtı değildir/);
    await page.evaluate(() => window.cardiaEcho.selectView('ice-home'));
    assert.equal(await page.locator('[data-echo-transseptal]').isVisible(), false, 'stages only on the septal view');
    assert.equal(await page.evaluate(() => window.heart.scene.getObjectByName('Transseptal needle (schematic)').visible), false);

    // 6. Lesson: one step per view, the same count in TR and EN.
    const lesson = await page.evaluate(async () => {
      const C = await import('/src/content.js');
      const find = (o, depth = 0) => (o && typeof o === 'object' && depth < 4 ? (o.ice?.tr?.steps ? o.ice : Object.values(o).map((x) => find(x, depth + 1)).find(Boolean)) : null);
      const ice = find(C);
      const views = (lang) => ice[lang].steps.map((s) => s.echo?.view).filter(Boolean);
      return { tr: views('tr'), en: views('en') };
    });
    assert.deepEqual(lesson.tr, lesson.en, 'TR and EN lesson steps open the same views');
    for (const id of ['ice-home', 'ice-rvot', 'ice-mitral-laa', 'ice-left-pv', 'ice-septal-sax', 'ice-right-pv', 'ice-svc', 'ice-la-home', 'ice-la-lspv', 'ice-la-mitral-isthmus', 'ice-la-posterior', 'ice-la-rspv', 'ice-la-aov']) assert.ok(lesson.tr.includes(id), `lesson step for ${id}`);

    // 7. Narrow screen: no horizontal overflow with the ICE panel.
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await phone.goto(`${APP}/#/mode/ice`);
    await phone.waitForSelector('#viewport[data-model-ready=true]');
    await phone.waitForFunction(() => window.cardiaEcho?.getAnatomy());
    await phone.evaluate(() => window.cardiaEcho.selectView('ice-septal-sax'));
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, 'phone: no horizontal overflow');
    await phone.close();

    assert.deepEqual(errors, []);
    console.log('PASS ice: one pose model (knob signs, advance/rotation apart), presets at rest and 4 beat phases, vein sides, LAA, septal relation and fossa, RVOT/SVC targets, source-consistent septal preset, panel notes, sweep, transseptal stages');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });

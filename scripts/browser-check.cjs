const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  let viteServer;
  let url = process.env.APP_URL;
  if (!url) {
    const { createServer } = await import('vite');
    viteServer = await createServer({
      server: { port: 5174, host: '127.0.0.1' },
      logLevel: 'error'
    });
    await viteServer.listen();
    url = 'http://127.0.0.1:5174';
  }

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(url);
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    fs.mkdirSync('research/screenshots', { recursive: true });
    await page.screenshot({ path: 'research/screenshots/coronaries-anterior.png' });

    // 1. Structure selection
    await page.locator('#structure-select').selectOption('pulmonary-valve');
    assert.match(await page.locator('#structure-title').textContent(), /Pulmoner kapak|pulmonary valve/i);
    await page.locator('#structure-select').selectOption('lm');
    assert.match(await page.locator('#structure-title').textContent(), /ana koroner|main/i);

    // 2. Wall controls
    for (const id of ['rv','lv','la','ra']) {
      await page.locator(`[data-wall=${id}]`).fill('50');
      assert.equal(await page.locator(`#wall-value-${id}`).textContent(), '50% kesit');
    }
    await page.locator('#restore-walls').click();
    for (const id of ['rv','lv','la','ra']) assert.equal(await page.locator(`[data-wall=${id}]`).inputValue(), '0');

    await page.locator('[data-wall=rv]').fill('65');
    await page.locator('#structure-select').selectOption('rv');
    await page.waitForSelector('#viewport[data-camera-settled=true]');
    await page.screenshot({ path: 'research/screenshots/rv-window.png' });
    await page.locator('#restore-walls').click();

    // 3. Coronary filtering & root window
    await page.locator('#coronary-system').selectOption('left');
    await page.locator('[data-view=root]').click();
    assert.ok(await page.locator('#root-window').isChecked());
    await page.waitForSelector('#viewport[data-camera-settled=true]');
    await page.screenshot({ path: 'research/screenshots/coronary-root.png' });

    // 4. Conduction system checkbox & SA halo visibility
    const conductionBox = page.locator('input[data-layer="conduction"]');
    assert.ok(await conductionBox.isChecked(), 'conduction checkbox initially checked');
    await conductionBox.uncheck();
    assert.ok(!await conductionBox.isChecked(), 'conduction checkbox unchecked');
    let heartState = await page.evaluate(() => window.heart.getState());
    assert.equal(heartState.visibility.conduction, false, 'heart state visibility.conduction is false');

    // Verify conduction meshes & SA halo are hidden in live 3D scene
    const liveConductionVisible = await page.evaluate(() => {
      let saHaloVisible = false;
      let groupVisible = false;
      window.heart.scene.traverse(obj => {
        if (obj.userData?.id === 'sa' && obj.isMesh && obj.geometry?.type === 'RingGeometry') {
          saHaloVisible = obj.visible;
        }
        if (obj.userData?.layer === 'conduction' && obj.isGroup) {
          groupVisible = obj.visible;
        }
      });
      return { saHaloVisible, groupVisible };
    });
    assert.equal(liveConductionVisible.groupVisible, false, 'conduction group hidden');

    // Re-check conduction checkbox directly
    await conductionBox.check();
    assert.ok(await conductionBox.isChecked(), 'conduction checkbox re-checked');
    heartState = await page.evaluate(() => window.heart.getState());
    assert.equal(heartState.visibility.conduction, true, 'conduction visibility restored to true');

    // 5. Atlas vs Schematic Provenance check
    await page.locator('#structure-select').selectOption('lv');
    assert.equal(await page.locator('.structure-index').getAttribute('data-provenance'), 'atlas');
    assert.match(await page.locator('.structure-index').textContent(), /ATLAS/);

    await page.locator('#structure-select').selectOption('sa');
    assert.equal(await page.locator('.structure-index').getAttribute('data-provenance'), 'schematic');
    assert.match(await page.locator('.structure-index').textContent(), /ŞEMATİK|SCHEMATIC/);

    await page.locator('#structure-select').selectOption('amc');
    assert.equal(await page.locator('.structure-index').getAttribute('data-provenance'), 'reference');
    assert.match(await page.locator('.structure-index').textContent(), /REFERANS|REFERENCE/);
    const schematicLeaflets = await page.evaluate(() => window.heart.getState().structures.filter(item =>
      /Anterior mitral leaflet|Anterior tricuspid leaflet/i.test(item.name)
    ));
    assert.equal(schematicLeaflets.length, 2, 'mitral and tricuspid each gain one schematic anterior leaflet');
    assert.ok(schematicLeaflets.every(item => item.provenance === 'schematic' && item.visible));
    const amcMesh = await page.evaluate(() => window.heart.getState().structures.filter(item => item.id === 'amc'));
    assert.deepEqual(amcMesh, [], 'AMC stays a reference note, not a mesh');

    await page.locator('[data-mode="transseptal"]').click();
    const valveAndSeptumState = await page.evaluate(() => {
      const structures = window.heart.getState().structures;
      const leaflets = structures.filter(item =>
        item.name === 'Posterior leaflet of left atrioventricular valve' ||
        item.name === 'Septal leaflet of right atrioventricular valve' ||
        item.name === 'Inferior leaflet of right atrioventricular valve'
      );
      const ra = structures.find(item => item.id === 'ra');
      const nccItem = structures.find(item => item.id === 'ncc');
      const mid = bounds => bounds.min.map((value, index) => (value + bounds.max[index]) / 2);
      const raCenter = mid(ra.bounds);
      const nccCenter = mid(nccItem.bounds);
      window.heart.scene.updateMatrixWorld(true);
      const worldPoint = (object, index) => {
        const position = object.geometry.attributes.position;
        const x = position.getX(index);
        const y = position.getY(index);
        const z = position.getZ(index);
        const e = object.matrixWorld.elements;
        return {
          x: e[0] * x + e[4] * y + e[8] * z + e[12],
          y: e[1] * x + e[5] * y + e[9] * z + e[13],
          z: e[2] * x + e[6] * y + e[10] * z + e[14]
        };
      };
      let annulus = null;
      let septum = null;
      window.heart.scene.traverse(object => {
        if (object.name === 'Tricuspid annulus') annulus = object;
        if (object.name === 'Interatrial septum (schematic)') septum = object;
      });
      const radial = 13;
      const tubular = 96;
      const center = { x: 0, y: 0, z: 0 };
      const samples = [];
      for (let i = 0; i < tubular; i++) {
        const point = { x: 0, y: 0, z: 0 };
        for (let j = 0; j < 12; j++) {
          const sample = worldPoint(annulus, i * radial + j);
          point.x += sample.x;
          point.y += sample.y;
          point.z += sample.z;
        }
        point.x /= 12;
        point.y /= 12;
        point.z /= 12;
        samples.push(point);
        center.x += point.x;
        center.y += point.y;
        center.z += point.z;
      }
      center.x /= samples.length;
      center.y /= samples.length;
      center.z /= samples.length;
      const normal = { x: 0, y: 0, z: 0 };
      for (let i = 0; i < samples.length; i++) {
        const a = samples[i];
        const b = samples[(i + 1) % samples.length];
        normal.x += (a.y - b.y) * (a.z + b.z);
        normal.y += (a.z - b.z) * (a.x + b.x);
        normal.z += (a.x - b.x) * (a.y + b.y);
      }
      const towardRa = {
        x: raCenter[0] - center.x,
        y: raCenter[1] - center.y,
        z: raCenter[2] - center.z
      };
      if (normal.x * towardRa.x + normal.y * towardRa.y + normal.z * towardRa.z < 0) {
        normal.x *= -1;
        normal.y *= -1;
        normal.z *= -1;
      }
      const length = Math.hypot(normal.x, normal.y, normal.z) || 1;
      normal.x /= length;
      normal.y /= length;
      normal.z /= length;
      let lowest = Infinity;
      let highest = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      const discCount = septum.geometry.attributes.position.count;
      for (let i = 0; i < discCount; i++) {
        const point = worldPoint(septum, i);
        const signed = (point.x - center.x) * normal.x + (point.y - center.y) * normal.y + (point.z - center.z) * normal.z;
        lowest = Math.min(lowest, signed);
        highest = Math.max(highest, signed);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }
      const fossaCenter = worldPoint(septum, 0);
      const ncc = { x: nccCenter[0], y: nccCenter[1], z: nccCenter[2] };
      const annulusToCusp = {
        x: ncc.x - center.x,
        y: ncc.y - center.y,
        z: ncc.z - center.z
      };
      const cuspSpan = Math.hypot(annulusToCusp.x, annulusToCusp.y, annulusToCusp.z) || 1;
      const fossaAlong = ((fossaCenter.x - center.x) * annulusToCusp.x
        + (fossaCenter.y - center.y) * annulusToCusp.y
        + (fossaCenter.z - center.z) * annulusToCusp.z) / (cuspSpan * cuspSpan);
      return {
        ias: {
          y: septum.position.y,
          opacity: septum.material.opacity,
          depthWrite: septum.material.depthWrite,
          lowestAboveAnnulus: lowest,
          highestAboveAnnulus: highest,
          fossaAlong,
          posteriorToCusp: fossaCenter.z < ncc.z,
          minY,
          maxY,
          annulusY: center.y,
          nccY: ncc.y
        },
        leaflets: leaflets.map(item => ({
          name: item.name,
          visible: item.visible,
          provenance: item.provenance,
          vertices: item.vertices
        }))
      };
    });
    assert.equal(valveAndSeptumState.leaflets.length, 3, 'Atlas PML and two tricuspid leaflets loaded');
    assert.ok(valveAndSeptumState.leaflets.every(item => item.visible), 'Atlas AV leaflets visible');
    assert.ok(valveAndSeptumState.leaflets.every(item => item.provenance === 'atlas' && item.vertices > 0),
      'AV leaflets retain atlas provenance and geometry');
    assert.ok(valveAndSeptumState.ias.fossaAlong > 0.25 && valveAndSeptumState.ias.fossaAlong < 0.6,
      'Fossa center lies between the tricuspid annulus and the non-coronary cusp');
    assert.ok(valveAndSeptumState.ias.minY > valveAndSeptumState.ias.annulusY - 0.05,
      'Inferior limbus does not hang through the tricuspid annulus');
    assert.ok(valveAndSeptumState.ias.maxY < valveAndSeptumState.ias.nccY - 0.12,
      'Superior rim stays below the non-coronary cusp');
    assert.ok(valveAndSeptumState.ias.opacity <= 0.25 && valveAndSeptumState.ias.depthWrite === false,
      'IAS display does not occlude atlas AV leaflets');
    const fossaMarker = await page.evaluate(() => {
      let fossa = null;
      let label = null;
      let limbus = null;
      window.heart.scene.traverse(object => {
        if (object.name === 'Fossa ovalis') fossa = object;
        if (object.name === 'Fossa ovalis label') label = object;
        if (object.name === 'Limbus fossae ovalis') limbus = object;
      });
      const parentVisible = object => {
        for (let node = object; node; node = node.parent) if (node.visible === false) return false;
        return true;
      };
      return {
        fossa: Boolean(fossa) && parentVisible(fossa),
        label: Boolean(label),
        limbus: Boolean(limbus) && parentVisible(limbus),
        pickId: fossa && fossa.userData.pickId,
        depthTest: fossa && fossa.material.depthTest,
        renderOrder: fossa && fossa.renderOrder
      };
    });
    assert.equal(fossaMarker.fossa, true, 'Fossa membrane is in the transseptal view');
    assert.equal(fossaMarker.label, false, 'Fossa has no floating caption');
    assert.equal(fossaMarker.limbus, true, 'Limbus ring stays on the septum');
    assert.equal(fossaMarker.pickId, 'fossa');
    assert.equal(fossaMarker.depthTest, true, 'Fossa membrane stays behind structures in front of it');
    assert.ok(fossaMarker.renderOrder > 4);
    await page.evaluate(() => window.heart.setView('anterior', false));
    await page.waitForSelector('#viewport[data-camera-settled=true]');
    await page.screenshot({ path: 'research/screenshots/fossa-ovalis.png' });
    await page.locator('[data-mode="anatomy"]').click();

    // 6. C-Arm panel collapsible ergonomics, quick actions & mobile sheet layout
    assert.ok(await page.locator('#carm-panel').evaluate(el => el.classList.contains('collapsed')), 'C-Arm starts collapsed in anatomy mode');
    assert.equal(await page.locator('#carm-toggle-btn').textContent(), '+');

    await page.locator('[data-mode="angiography"]').click();
    assert.ok(!await page.locator('#carm-panel').evaluate(el => el.classList.contains('collapsed')), 'C-Arm auto-expands in angiography mode');
    assert.equal(await page.locator('#carm-toggle-btn').textContent(), '−');

    // While panel is open, test C-Arm conduction quick-toggle button sync
    await page.locator('#carm-conduction-toggle').click();
    assert.ok(!await conductionBox.isChecked(), 'conduction checkbox unchecked via C-Arm toggle');
    await page.locator('#carm-conduction-toggle').click();
    assert.ok(await conductionBox.isChecked(), 'conduction checkbox re-checked via C-Arm toggle');

    // 7. Fluoroscopy exit restores coronary material roughness & metalness
    await page.locator('#fluoroscopy-toggle').click();
    assert.ok(await page.locator('#fluoroscopy-toggle').evaluate(el => el.classList.contains('active')));
    await page.waitForSelector('#viewport[data-camera-settled=true]');
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    assert.equal(await page.evaluate(() => window.heart.getState().fluoroscopy), true);
    await page.screenshot({ path: 'research/screenshots/fluoroscopy-grayscale.png' });
    const projectionImage = await page.evaluate(() => {
      window.heart.setFluoroscopy(true);
      return new Promise(resolve => requestAnimationFrame(() => resolve(document.querySelector('#viewport canvas').toDataURL())));
    });
    const projectionPixels = await page.evaluate(async data => {
      const canvas = new Image();
      canvas.src = data;
      await canvas.decode();
      const copy = document.createElement('canvas');
      copy.width = canvas.width; copy.height = canvas.height;
      const ctx = copy.getContext('2d'); ctx.drawImage(canvas, 0, 0);
      const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
      let colored = 0, dark = 0, background = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (Math.max(pixels[i], pixels[i+1], pixels[i+2])-Math.min(pixels[i], pixels[i+1], pixels[i+2]) > 2) colored++;
        if (pixels[i+3] && pixels[i] < 120) dark++;
        if (pixels[i+3] && pixels[i] > 180) background++;
      }
      return { colored, dark, background };
    }, projectionImage);
    assert.equal(projectionPixels.colored, 0, 'fluoroscopy uses neutral grayscale');
    assert.ok(projectionPixels.dark > 100, 'contrast vessels remain dark');
    assert.ok(projectionPixels.background > 100, 'detector background remains light');
    await page.locator('#fluoroscopy-toggle').click();
    assert.ok(!await page.locator('#fluoroscopy-toggle').evaluate(el => el.classList.contains('active')));
    const coronaryMats = await page.evaluate(() => {
      const results = [];
      window.heart.scene.traverse(obj => {
        if (obj.isMesh && obj.userData?.layer === 'coronaries') {
          results.push({ roughness: obj.material.roughness, metalness: obj.material.metalness });
        }
      });
      return results;
    });
    assert.ok(coronaryMats.length > 0, 'found coronary meshes');
    assert.ok(coronaryMats.every(m => Math.abs(m.roughness - 0.65) < 0.001 && m.metalness === 0), 'coronary roughness (0.65) and metalness (0) restored');

    await page.locator('[data-mode="anatomy"]').click();
    assert.ok(await page.locator('#carm-panel').evaluate(el => el.classList.contains('collapsed')), 'C-Arm collapses when returning to anatomy mode');

    // 8. Reset equality (Key '0' vs #reset button)
    const alterState = async () => {
      await page.locator('[data-wall="rv"]').fill('55');
      await page.locator('input[data-layer="conduction"]').uncheck();
      await page.locator('input[data-layer="veins"]').uncheck();
      await page.locator('#coronary-system').selectOption('left');
      await page.locator('[data-view="spider"]').click();
    };
    const captureState = async () => page.evaluate(() => ({
      rvWall: document.querySelector('[data-wall="rv"]')?.value,
      conductionChecked: document.querySelector('input[data-layer="conduction"]')?.checked,
      veinsChecked: document.querySelector('input[data-layer="veins"]')?.checked,
      coronarySystem: document.querySelector('#coronary-system')?.value,
      opacity: document.querySelector('#opacity')?.value,
      rootWindow: document.querySelector('#root-window')?.checked,
      viewSelected: document.querySelector('[data-view].selected')?.getAttribute('data-view'),
      visibility: window.heart.getState().visibility
    }));

    await alterState();
    await page.keyboard.press('0');
    const stateAfterKey0 = await captureState();

    await alterState();
    await page.locator('#reset').click();
    const stateAfterButton = await captureState();

    assert.equal(stateAfterKey0.rvWall, '0');
    assert.equal(stateAfterKey0.rvWall, stateAfterButton.rvWall);
    assert.equal(stateAfterKey0.conductionChecked, true);
    assert.equal(stateAfterKey0.conductionChecked, stateAfterButton.conductionChecked);
    assert.equal(stateAfterKey0.veinsChecked, true);
    assert.equal(stateAfterKey0.veinsChecked, stateAfterButton.veinsChecked);
    assert.equal(stateAfterKey0.coronarySystem, 'all');
    assert.equal(stateAfterKey0.coronarySystem, stateAfterButton.coronarySystem);
    assert.equal(stateAfterKey0.opacity, '100');
    assert.equal(stateAfterKey0.opacity, stateAfterButton.opacity);
    assert.equal(stateAfterKey0.rootWindow, false);
    assert.equal(stateAfterKey0.rootWindow, stateAfterButton.rootWindow);
    assert.equal(stateAfterKey0.viewSelected, 'anterior');
    assert.equal(stateAfterKey0.viewSelected, stateAfterButton.viewSelected);
    assert.deepEqual(stateAfterKey0.visibility, stateAfterButton.visibility);

    // 9. Language Switcher (TR / EN)
    assert.equal(await page.locator('#lang-btn').textContent(), 'TR');
    await page.locator('#lang-btn').click();
    assert.equal(await page.locator('#lang-btn').textContent(), 'EN');
    await page.locator('#structure-select').selectOption('lv');
    assert.match(await page.locator('#structure-title').textContent(), /Left ventricle/i);
    assert.equal(await page.locator('.structure-index').textContent(), 'ATLAS / SELECTED STRUCTURE');
    await page.locator('#lang-btn').click();
    assert.equal(await page.locator('#lang-btn').textContent(), 'TR');
    assert.match(await page.locator('#structure-title').textContent(), /Sol ventrikül/i);
    assert.equal(await page.locator('.structure-index').textContent(), 'ANATOMİK ATLAS / SEÇİLİ YAPI');

    // 9b. Cardiac Cycle & BPM / Scrubber Controls (Phases 1-3)
    assert.ok(await page.locator('#cycle-panel').isVisible(), 'Cardiac cycle control panel visible');
    assert.equal(await page.locator('#cycle-bpm-val').textContent(), '72');
    await page.locator('.cycle-preset-btn[data-bpm="150"]').click();
    assert.equal(await page.locator('#cycle-bpm-val').textContent(), '150');
    await page.locator('#beat').click();
    assert.equal(await page.locator('#beat').getAttribute('aria-pressed'), 'true');
    await page.locator('#beat').click();
    assert.equal(await page.locator('#beat').getAttribute('aria-pressed'), 'false');
    await page.locator('#cycle-scrubber').fill('65');
    assert.match(await page.locator('#cycle-interval-name').textContent(), /ejeksiyon|ejection/i);
    assert.equal(await page.locator('#cycle-phase-val').textContent(), '%65');
    await page.locator('#cycle-rhythm').selectOption('bradycardia');
    assert.equal(await page.locator('#cycle-bpm-val').textContent(), '48');

    // 9c. Venous System Branch Selection & Naming
    await page.locator('#structure-select').selectOption('cs');
    assert.match(await page.locator('#structure-title').textContent(), /Koroner sinüs ana gövdesi|Coronary sinus main trunk/i);
    await page.locator('#structure-select').selectOption('gcv');
    assert.match(await page.locator('#structure-title').textContent(), /Büyük kardiyak ven|Great cardiac vein/i);
    await page.locator('#structure-select').selectOption('mcv');
    assert.match(await page.locator('#structure-title').textContent(), /Orta kardiyak ven|Middle cardiac vein/i);
    await page.locator('#structure-select').selectOption('piv');
    assert.match(await page.locator('#structure-title').textContent(), /Sol ventrikül posterior veni|Posterior vein of left ventricle/i);
    await page.locator('#structure-select').selectOption('lspv');
    assert.match(await page.locator('#structure-title').textContent(), /Sol süperior pulmoner ven|Left superior pulmonary vein/i);

    // 9d. Blood Flow Visualization (Phase 4)
    const flowBtn = page.locator('#flow-toggle');
    assert.ok(await flowBtn.isVisible(), 'Flow toggle button visible');
    assert.equal(await flowBtn.getAttribute('aria-pressed'), 'true', 'Flow active by default');
    assert.ok(await page.locator('.flow-legend').isVisible(), 'Flow legend visible');

    // Toggle via button
    await flowBtn.click();
    assert.equal(await flowBtn.getAttribute('aria-pressed'), 'false', 'Flow paused via button');
    let heartFlowState = await page.evaluate(() => window.heart.getState().flow);
    assert.equal(heartFlowState, false, 'heart.getState().flow updated to false');
    assert.equal(await page.locator('input[data-layer="flow"]').isChecked(), false, 'flow checkbox synced to false');

    // Toggle via keyboard shortcut 'f'
    await page.keyboard.press('f');
    assert.equal(await flowBtn.getAttribute('aria-pressed'), 'true', 'Flow re-enabled via key F');
    heartFlowState = await page.evaluate(() => window.heart.getState().flow);
    assert.equal(heartFlowState, true, 'heart.getState().flow updated to true');
    assert.equal(await page.locator('input[data-layer="flow"]').isChecked(), true, 'flow checkbox synced to true');

    // Capture screenshot of blood flow during ejection
    await page.locator('#cycle-scrubber').fill('65');
    await page.evaluate(() => new Promise(r => setTimeout(r, 400)));
    await page.screenshot({ path: 'research/screenshots/blood-flow-ejection.png' });

    // 10. Dialogs and modes
    for (const mode of ['angiography','ablation','pacemaker','transseptal','bachmann','anatomy']) await page.locator(`[data-mode=${mode}]`).click();
    await page.locator('#sources').click(); assert.ok(await page.locator('dialog#references').isVisible());
    await page.locator('#close-dialog').click();

    // 11. Mobile viewport test
    await page.setViewportSize({ width:390,height:844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile overflow');
    await page.locator('#carm-toggle-dock').click();
    const panelBox = await page.locator('#carm-panel').evaluate(el => {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return { width: r.width, left: r.left, right: r.right, pos: style.position, collapsed: el.classList.contains('collapsed') };
    });
    assert.ok(Math.abs(panelBox.width - 390) < 2, `C-Arm bottom drawer spans mobile width (actual: ${panelBox.width})`);
    await page.setViewportSize({ width: 1440, height: 1050 });

    // 12. Educational modes: Angiography (03), Ablation anatomy (04), Pacemaker leads (05)
    // Mode 03 Angiography
    await page.locator('[data-mode="angiography"]').click();
    assert.equal(await page.locator('#carm-panel').evaluate(el => !el.classList.contains('collapsed')), true, 'C-Arm opens in angiography mode');
    await page.locator('#steps button[data-step="1"]').click(); // Spider view step
    await page.evaluate(() => new Promise(r => setTimeout(r, 600)));
    await page.screenshot({ path: 'research/screenshots/mode-03-angiography-spider.png' });
    const angioText = await page.locator('#step-detail').textContent();
    assert.match(angioText, /Spider|bifurkasyon/i, 'Angiography step 2 shows Spider projection clinical guide');

    // Mode 04 Ablation anatomy
    await page.locator('[data-mode="ablation"]').click();
    await page.locator('#steps button[data-step="1"]').click(); // Triangle of Koch
    await page.evaluate(() => new Promise(r => setTimeout(r, 600)));
    await page.screenshot({ path: 'research/screenshots/mode-04-ablation-koch.png' });
    const ablationTitle = await page.locator('#steps button[data-step="0"]').textContent();
    assert.match(ablationTitle, /CTI|Kavotriküspit/i, 'Ablation step 1 features CTI');
    const kochText = await page.locator('#step-detail').textContent();
    assert.match(kochText, /Koch|Yavaş Yol|Slow Pathway/i, 'Ablation step 2 features Triangle of Koch');

    // Mode 05 Pacemaker leads
    await page.locator('[data-mode="pacemaker"]').click();
    const progressHidden = await page.locator('#progress').evaluate(el => el.hidden);
    assert.equal(progressHidden, false, 'Progress slider is visible in pacemaker mode');
    assert.equal(await page.locator('#progress-value').textContent(), '100%');
    await page.locator('#steps button[data-step="2"]').click(); // CSP / LBBAP step
    await page.evaluate(() => new Promise(r => setTimeout(r, 600)));
    await page.screenshot({ path: 'research/screenshots/mode-05-pacemaker-csp.png' });
    await page.locator('#progress').fill('45');
    await page.locator('#progress').dispatchEvent('input');
    assert.equal(await page.locator('#progress-value').textContent(), '45%', 'Progress slider updates lead advancement');
    const cspText = await page.locator('#step-detail').textContent();
    assert.match(cspText, /LBBAP|Purkinje|His/i, 'Pacemaker step 3 features Conduction System Pacing');

    // 13. Independently instantiate the production viewer and compare it to decoded source geometry.
    await page.evaluate(async () => {
      const { createHeart } = await import('/src/heart.js');
      const container = document.createElement('div');container.style.cssText='width:800px;height:700px;position:fixed;inset:0;background:white';document.body.append(container);
      window.testViewer = createHeart(container);await window.testViewer.ready;
    });
    const state = await page.evaluate(() => window.testViewer.getState());
    const report = JSON.parse(fs.readFileSync('research/coronary-geometry-report.json','utf8'));
    const n = state.normalization;
    for (const [id, source] of Object.entries(report.structures)) {
      const actual = state.structures.find(m => m.name === source.name);assert.ok(actual, `rendered ${source.name}`);
      assert.equal(actual.vertices, source.vertexCount, 'source vertex count preserved');
      for (const side of ['min','max']) for(let i=0;i<3;i++) {
        const expected = (source.bounds[side][i]-n.center[i])*n.scale;
        assert.ok(Math.abs(expected-actual.bounds[side][i]) < 0.0001, `${id} ${side} axis ${i}: shared transform`);
      }
    }
    await page.evaluate(() => window.testViewer.setWallCut('rv', .65));
    const cut = await page.evaluate(() => window.testViewer.getState());
    assert.ok(cut.structures.filter(m=>m.id==='rv').every(m=>m.clipping===1), 'RV window applied');
    assert.ok(cut.structures.filter(m=>['lm','lad','lcx','rca','lv','la','ra'].includes(m.id)).every(m=>m.clipping===0), 'other anatomy unaffected');
    await page.evaluate(() => {window.testViewer.setWallCut('rv',0);window.testViewer.setCoronarySystem('left');});
    const left = await page.evaluate(() => window.testViewer.getState());
    assert.ok(left.structures.filter(m=>['lm','lad','lcx'].includes(m.id)).every(m=>m.visible));
    assert.ok(left.structures.filter(m=>m.id==='rca').every(m=>!m.visible));
    await page.evaluate(() => window.testViewer.dispose());
    assert.deepEqual(errors, []);
    console.log('PASS: All 7 priority requirements verified successfully, including conduction toggle & SA halo hiding, atlas/schematic provenance, reset equality, C-Arm ergonomics & mobile drawer, fluoroscopy material restoration, language toggle, and geometry registration.');
  } finally {
    await browser.close();
    if (viteServer) await viteServer.close();
  }
})().catch(error => { console.error(error); process.exitCode=1; });

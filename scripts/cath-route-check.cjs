const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/yh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 5177 }, logLevel: 'error' });
  await server.listen();
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5177');
    await page.waitForSelector('#viewport[data-model-ready=true]');
    await page.locator('[data-mode="cath"]').click();
    await page.evaluate(() => window.heart.setCathStep(2));
    const route = await page.evaluate(() => {
      let catheter;
      const stations = {};
      let trunk;
      window.heart.scene.traverse(object => {
        if (object.name === 'Swan-Ganz catheter route') catheter = object;
        if (object.name === 'RA measurement station' || object.name === 'RV measurement station'
          || object.name === 'PA measurement station' || object.name === 'Distal PA balloon target') {
          stations[object.name] = object.position.toArray();
        }
        if (object.name === 'Pulmonary trunk' && object.userData?.id === 'pa') trunk = object;
      });
      const position = catheter.geometry.attributes.position;
      const ringSize = 9; // TubeGeometry radialSegments=8, including closing vertex.
      const centerline = [];
      for (let i = 0; i < position.count; i += ringSize) {
        const center = [0, 0, 0];
        for (let j = 0; j < 8; j++) {
          center[0] += position.getX(i + j) / 8;
          center[1] += position.getY(i + j) / 8;
          center[2] += position.getZ(i + j) / 8;
        }
        centerline.push(center);
      }
      const nearest = point => centerline.reduce((best, center, index) => {
        const distance = Math.hypot(...center.map((v, axis) => v - point[axis]));
        return distance < best.distance ? { index, distance } : best;
      }, { index: -1, distance: Infinity });
      trunk.geometry.computeBoundingBox();
      const box = trunk.geometry.boundingBox.clone().applyMatrix4(trunk.matrixWorld);
      const tip = () => {
        const vertices = catheter.geometry.attributes.position;
        const first = vertices.count - ringSize;
        const center = [0, 0, 0];
        for (let j = 0; j < 8; j++) {
          center[0] += vertices.getX(first + j) / 8;
          center[1] += vertices.getY(first + j) / 8;
          center[2] += vertices.getZ(first + j) / 8;
        }
        return center;
      };
      window.heart.setCathStep(0);
      const raTip = tip();
      window.heart.setCathStep(1);
      const rvTip = tip();
      return {
        rv: nearest(stations['RV measurement station']),
        pa: nearest(stations['PA measurement station']),
        wedge: nearest(stations['Distal PA balloon target']),
        raTipDistance: Math.hypot(...raTip.map((v, axis) => v - stations['RA measurement station'][axis])),
        rvTipDistance: Math.hypot(...rvTip.map((v, axis) => v - stations['RV measurement station'][axis])),
        paStation: stations['PA measurement station'],
        trunkMin: box.min.toArray(),
        trunkMax: box.max.toArray()
      };
    });
    for (const key of ['rv', 'pa', 'wedge']) {
      assert.ok(route[key].distance < 0.08, `Catheter passes ${key} station`);
    }
    assert.ok(route.rv.index < route.pa.index && route.pa.index < route.wedge.index,
      'Catheter traverses RV, pulmonary trunk, then distal branch');
    assert.ok(route.raTipDistance < 0.15, 'RA step stops catheter in RA');
    assert.ok(route.rvTipDistance < 0.08, 'RV step stops catheter in RV');
    assert.ok(route.paStation.every((v, axis) => v >= route.trunkMin[axis] && v <= route.trunkMax[axis]),
      'PA measurement station lies inside actual pulmonary trunk mesh bounds');
    console.log('PASS: Swan-Ganz route traverses RV, pulmonary trunk, distal branch in order');
  } finally {
    await browser.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

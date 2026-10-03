import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sectorGeometry, clipToSector, drawEchoSector, ECHO_STYLES } from '../src/echo-renderer.js';

const source = readFileSync(new URL('../src/echo-renderer.js', import.meta.url), 'utf8');
assert.ok(!source.includes(String.fromCharCode(0x2014)), 'no em dash in the module source');
assert.ok(source.split('\n').length < 400, 'module stays under 400 lines');
assert.deepEqual([...ECHO_STYLES], ['anatomy', 'gray']);

const ANGLE = 1.4;
const DEPTH = 5;
const HALF = ANGLE / 2;

// sectorGeometry
const geo = sectorGeometry(400, 260, ANGLE, DEPTH);
assert.equal(geo.apex[0], 200, 'apex at horizontal centre');
assert.ok(geo.scale > 0 && geo.radius > 0);
const bottom = geo.toScreen([0, DEPTH]);
assert.ok(Math.abs(Math.hypot(bottom[0] - geo.apex[0], bottom[1] - geo.apex[1]) - geo.radius) < 1e-6, 'bottom point on the arc');
assert.ok(bottom[1] <= 260, 'sector fits the canvas height');
const edge = geo.toScreen([Math.sin(HALF) * DEPTH, Math.cos(HALF) * DEPTH]);
assert.ok(edge[0] <= 400 && edge[0] >= 0, 'sector fits the canvas width');
assert.equal(geo.inside([0, DEPTH / 2]), true);
assert.equal(geo.inside([DEPTH, 0.1]), false, 'outside the angle');
assert.equal(geo.inside([0, DEPTH * 1.1]), false, 'beyond the depth');
assert.doesNotThrow(() => sectorGeometry(0, 0, ANGLE, DEPTH));

// clipToSector
const angleOf = ([x, y]) => Math.atan2(x, y);
const across = clipToSector([[-10, 2.5], [10, 2.5]], ANGLE, DEPTH);
assert.equal(across.length, 1, 'horizontal line gives one run');
const run = across[0];
assert.ok(Math.abs(Math.abs(angleOf(run[0])) - HALF) < 1e-3, 'entry on the left edge');
assert.ok(Math.abs(Math.abs(angleOf(run[run.length - 1])) - HALF) < 1e-3, 'exit on the right edge');
assert.ok(run[0][0] < 0 && run[run.length - 1][0] > 0);
assert.deepEqual(clipToSector([[8, 1], [9, 3], [7, 6]], ANGLE, DEPTH), [], 'outside polyline gives []');
assert.deepEqual(clipToSector([[0, 1], [0, 8]], ANGLE, DEPTH).map((r) => r.length), [2], 'depth clip');
const inOut = clipToSector([[-0.5, 2], [0.5, 2], [6, 2], [0.5, 3], [-0.5, 3]], ANGLE, DEPTH);
assert.equal(inOut.length, 2, 'in, out and in gives two runs');
assert.ok(inOut.every((r) => r.length >= 2 && r.every((p) => geo.inside(p))), 'runs lie inside');
assert.deepEqual(clipToSector([[0, 1]], ANGLE, DEPTH), []);
assert.deepEqual(clipToSector(null, ANGLE, DEPTH), []);

// Recording canvas stub.
function makeCanvas(width = 400, height = 260, withContext = true) {
  const calls = [];
  const target = {
    measureText: (text) => ({ width: String(text).length * 6 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} })
  };
  const ctx = new Proxy(target, {
    get(t, key) {
      if (key in t) {
        const v = t[key];
        return typeof v === 'function' ? (...args) => { calls.push({ name: key, args }); return v(...args); } : v;
      }
      return (...args) => { calls.push({ name: key, args }); };
    },
    set(t, key, value) { t[key] = value; calls.push({ name: `set:${String(key)}`, args: [value] }); return true; }
  });
  const canvas = {
    clientWidth: width,
    clientHeight: height,
    width: 0,
    height: 0,
    getContext: () => (withContext ? ctx : null)
  };
  return { canvas, calls, texts: () => calls.filter((c) => c.name === 'fillText').map((c) => c.args[0]) };
}

const section = {
  contours: [
    { id: 'lv', points: [[-1, 2], [1, 2], [1, 4], [-1, 4]], closed: true, length: 8 },
    { id: 'aorta', points: [[-0.5, 1], [0.3, 1.5], [0.8, 1.2]], closed: false, length: 2 },
    { id: 'mystery', points: [[0.2, 3], [0.6, 3.4]], closed: false, length: 0.6 },
    { id: 'mitral', points: [[-0.4, 2.6], [0.4, 2.6]], closed: false, length: 0.8 }
  ],
  structures: {
    lv: { length: 8, closed: 1, open: 0, centroid: [0, 3] },
    aorta: { length: 2, closed: 0, open: 1, centroid: [0.2, 1.2] },
    mystery: { length: 0.6, closed: 0, open: 1, centroid: [0.4, 3.1] },
    mitral: { length: 0.8, closed: 0, open: 1, centroid: [0, 2.6] }
  }
};
const structureInfo = {
  lv: { color: '#ff6b6b', label: { tr: 'LV', en: 'LV' } },
  aorta: { color: '#ffb86b', label: { tr: 'Aort', en: 'Aorta' } },
  mitral: { color: '#fcd34d', label: { tr: 'Mitral', en: 'Mitral' } }
};
const base = { sectorAngle: ANGLE, depth: DEPTH, structureInfo, info: { tr: 'Parasternal uzun eksen', en: 'Parasternal long axis' } };

const WATERMARK = {
  anatomy: { tr: 'Anatomik kesit · ultrason görüntüsü değil', en: 'Anatomical section · not an ultrasound image' },
  gray: { tr: 'Şematik kesit · gerçek ultrason değil', en: 'Schematic section · not real ultrasound' }
};

for (const style of ECHO_STYLES) {
  for (const lang of ['tr', 'en']) {
    const { canvas, calls, texts } = makeCanvas();
    assert.doesNotThrow(() => drawEchoSector(canvas, section, { ...base, style, lang, highlight: ['lv'] }));
    const t = texts();
    assert.ok(t.includes(WATERMARK[style][lang]), `${style}/${lang} watermark`);
    assert.ok(t.includes('LV'), `${style}/${lang} LV label`);
    assert.ok(t.includes('mystery'), `${style}/${lang} unknown id labelled by id`);
    assert.ok(t.includes(lang === 'en' ? 'Relative depth' : 'Derinlik göreli'), 'relative depth caption');
    assert.ok(t.includes(lang === 'en' ? 'Parasternal long axis' : 'Parasternal uzun eksen'), 'info line');
    assert.ok(['20%', '40%', '60%', '80%', '100%'].every((x) => t.includes(x)), 'relative depth ticks');
    assert.ok(!t.some((x) => /cm\b/.test(x)), 'no centimetre labels');
    assert.ok(!t.includes('Kesitte yapı yok') && !t.includes('No structure in the section'));
    assert.ok(calls.some((c) => c.name === 'clip'), 'contours clipped to the fan');
    assert.ok(calls.some((c) => c.name === 'stroke') && calls.some((c) => c.name === 'fill'));
    assert.equal(canvas.width, 400);
    if (style === 'gray') {
      assert.ok(calls.some((c) => c.name === 'set:strokeStyle' && c.args[0] === '#ffffff'), 'bright valve stroke');
      assert.ok(calls.some((c) => c.name === 'set:fillStyle' && c.args[0] === '#050505'), 'blood-pool fill');
    } else {
      assert.ok(calls.some((c) => c.name === 'set:strokeStyle' && c.args[0] === '#9fb3aa'), 'unknown id colour');
      assert.ok(calls.some((c) => c.name === 'set:lineWidth' && c.args[0] === 3.5), 'highlight width');
    }
  }
}

// Label decluttering: a short sliver gets no label unless it is a target; overlay paths are drawn.
{
  const sliverSection = { contours: [...section.contours, { id: 'aorta2', points: [[0.5, 2.0], [0.55, 2.05]], closed: false, length: 0.07 }] };
  const info = { ...structureInfo, aorta2: { color: '#abc', label: { tr: 'KISA', en: 'SHORT' } } };
  const plain = makeCanvas();
  drawEchoSector(plain.canvas, sliverSection, { ...base, structureInfo: info });
  assert.ok(!plain.texts().includes('KISA'), 'a sliver below the label length has no label');
  const target = makeCanvas();
  drawEchoSector(target.canvas, sliverSection, { ...base, structureInfo: info, highlight: ['aorta2'] });
  assert.ok(target.texts().includes('KISA'), 'a target sliver keeps its label');
  const withPaths = makeCanvas();
  drawEchoSector(withPaths.canvas, section, { ...base, paths: [{ points: [[0, 1], [0.2, 2]], color: '#ffd966', tip: true }, { points: [[0, 1]] }] });
  assert.ok(withPaths.calls.some((c) => c.name === 'set:strokeStyle' && c.args[0] === '#ffd966'), 'overlay path drawn');
  assert.ok(withPaths.calls.filter((c) => c.name === 'arc').length >= 1, 'path tip dot');
  assert.doesNotThrow(() => drawEchoSector(makeCanvas().canvas, section, { ...base, paths: 'nonsense' }));
}

// Quiz mode, empty section, frozen badge.
{
  const { canvas, texts } = makeCanvas();
  drawEchoSector(canvas, section, { ...base, hideLabels: true });
  assert.ok(!texts().includes('LV'), 'hideLabels drops the labels');
  assert.ok(texts().includes(WATERMARK.anatomy.tr));
}
{
  const { canvas, texts } = makeCanvas();
  drawEchoSector(canvas, { contours: [], structures: {} }, base);
  assert.ok(texts().includes('Kesitte yapı yok'), 'empty section message');
}
{
  const { canvas, texts } = makeCanvas();
  drawEchoSector(canvas, { contours: [{ id: 'lv', points: [[20, 1], [21, 1]], closed: false }], structures: {} }, { ...base, lang: 'en' });
  assert.ok(texts().includes('No structure in the section'), 'contours outside the fan count as empty');
}
{
  const { canvas, texts } = makeCanvas();
  drawEchoSector(canvas, section, { ...base, frozen: true });
  assert.ok(texts().includes('DONDURULDU'), 'frozen badge tr');
  const en = makeCanvas();
  drawEchoSector(en.canvas, section, { ...base, frozen: true, lang: 'en' });
  assert.ok(en.texts().includes('FROZEN'), 'frozen badge en');
}

// Overlapping labels are nudged apart.
{
  const { canvas, calls } = makeCanvas();
  const crowd = {
    contours: [{ id: 'lv', points: [[0, 2], [0, 3]] }, { id: 'rv', points: [[0.1, 2], [0.1, 3]] }],
    structures: { lv: { centroid: [0, 2.5] }, rv: { centroid: [0.05, 2.5] } }
  };
  drawEchoSector(canvas, crowd, base);
  const ys = calls.filter((c) => c.name === 'fillText' && ['LV', 'rv'].includes(c.args[0])).map((c) => c.args[2]);
  assert.equal(ys.length, 2);
  assert.ok(Math.abs(ys[0] - ys[1]) >= 12, 'second label moved down');
}

// Robustness: null context, zero size, junk input.
assert.doesNotThrow(() => drawEchoSector(makeCanvas(400, 260, false).canvas, section, base));
{
  const zero = makeCanvas(0, 260);
  assert.doesNotThrow(() => drawEchoSector(zero.canvas, section, base));
  assert.equal(zero.calls.length, 0, 'zero width draws nothing');
}
assert.doesNotThrow(() => drawEchoSector(null, section, base));
assert.doesNotThrow(() => drawEchoSector(makeCanvas().canvas, null, null));
assert.doesNotThrow(() => drawEchoSector(makeCanvas().canvas, { contours: [null, { id: 'x' }, { id: 'y', points: [[0, 1], [NaN, 2]] }] }, {}));

console.log('PASS test-echo-renderer: sector geometry, clipping, both styles, labels, empty, frozen, robustness');

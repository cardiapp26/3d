import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REFERENCES,
  SCALES,
  SHELL,
  UI,
  VIEWS,
  allStructures,
  hitPoint,
  structuresFor
} from '../src/angio/peripheral/peripheral-data.js';
import { LABEL_CHAR, LABEL_FONT, curveSamples, labelFor, vesselRibbon } from '../src/angio/peripheral/peripheral-svg.js';
import {
  PERIPHERAL_3D_TREES,
  PERIPHERAL_LESIONS,
  PERIPHERAL_PRESETS,
  computeAbiTbi,
  computePeripheralTelemetry,
  projectPeripheralPoint
} from '../src/angio/peripheral/peripheral-sim.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const fail = message => problems.push(message);

// Taper remains tied to arc length, independent of centerline point density.
const ribbon = vesselRibbon([[0, 0], [100, 0]], 20, 0.5);
const ribbonCoords = [...ribbon.matchAll(/-?\d+(?:\.\d+)?/g)].map(match => Number(match[0]));
if (!ribbon.endsWith(' Z') || ribbonCoords.some(value => !Number.isFinite(value))) fail('invalid vessel ribbon');
if (!ribbon.startsWith('M 0 10') || !ribbon.includes('A 5 5 0 0 0 100 -5')) fail('vessel ribbon must taper from 20 to 10 units with a rounded distal cap');
if (vesselRibbon([], 20) !== '') fail('empty centerline must not draw a vessel');

const REQUIRED = [
  'abdominal-aorta', 'aortic-bifurcation', 'common-iliac', 'internal-iliac', 'iia-anterior', 'iia-posterior',
  'external-iliac', 'inferior-epigastric', 'deep-circumflex-iliac', 'median-sacral',
  'inguinal-ligament', 'femoral-head', 'common-femoral', 'femoral-bifurcation', 'femoral-sfa', 'profunda',
  'lateral-circumflex', 'medial-circumflex', 'puncture-zone', 'high-stick', 'low-stick',
  'xs-cfa-cfv', 'xs-gsv', 'xs-sfa-dfa', 'xs-fv-dfv', 'xs-popliteal',
  'sfa', 'adductor-canal', 'pop-p1', 'pop-p2', 'pop-p3', 'gen-sl', 'gen-sm', 'gen-il', 'gen-im',
  'anterior-tibial', 'tibioperoneal', 'peroneal', 'posterior-tibial', 'dorsalis-pedis',
  'lateral-plantar', 'medial-plantar', 'plantar-arch', 'angiosome',
  'visceral-aorta', 'celiac', 'left-gastric', 'splenic', 'common-hepatic', 'proper-hepatic',
  'gastroduodenal', 'sma', 'ima', 'renal', 'accessory-renal', 'gonadal',
  'subclavian', 'vertebral', 'internal-thoracic', 'thyrocervical', 'costocervical', 'axillary',
  'brachial', 'radial', 'ulnar', 'interosseous', 'superficial-arch', 'deep-arch', 'distal-radial',
  'radial-loop', 'high-bifurcation'
];

function walk(value, visit) {
  if (typeof value === 'string') visit(value);
  else if (Array.isArray(value)) value.forEach(item => walk(item, visit));
  else if (value && typeof value === 'object') Object.values(value).forEach(item => walk(item, visit));
}

function pointIn(x, y, box, label) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    fail(`${label} is not finite`);
    return;
  }
  if (x < 0 || y < 0 || x > box[0] || y > box[1]) fail(`${label} ${x},${y} outside ${box[0]}x${box[1]}`);
}

function shapeIn(shape, box, label) {
  if (shape.type === 'line' || shape.type === 'poly') {
    shape.pts.forEach((pair, index) => pointIn(pair[0], pair[1], box, `${label} pt ${index}`));
  } else if (shape.type === 'ellipse') {
    pointIn(shape.cx - shape.rx, shape.cy - shape.ry, box, `${label} min`);
    pointIn(shape.cx + shape.rx, shape.cy + shape.ry, box, `${label} max`);
  } else if (shape.type === 'circle') {
    pointIn(shape.cx - shape.r, shape.cy - shape.r, box, `${label} min`);
    pointIn(shape.cx + shape.r, shape.cy + shape.r, box, `${label} max`);
  } else if (shape.type === 'rect') {
    pointIn(shape.x, shape.y, box, `${label} origin`);
    pointIn(shape.x + shape.w, shape.y + shape.h, box, `${label} end`);
  } else if (shape.type === 'text') {
    pointIn(shape.x, shape.y, box, label);
  } else {
    fail(`${label} unknown shape ${shape.type}`);
  }
}

if (VIEWS.length !== 5) fail(`expected 5 views, got ${VIEWS.length}`);
const ids = allStructures().map(item => item.id);
const unique = new Set(ids);
if (unique.size !== ids.length) fail(`duplicate ids: ${ids.filter((id, index) => ids.indexOf(id) !== index).join(', ')}`);
if (unique.size !== 71) fail(`expected 71 structures, got ${unique.size}`);
REQUIRED.forEach(id => {
  if (!unique.has(id)) fail(`missing ${id}`);
});
ids.forEach(id => {
  if (!REQUIRED.includes(id)) fail(`unexpected id ${id}`);
});

const sections = allStructures().filter(item => item.id.startsWith('xs-'));
if (sections.length !== 5) fail(`expected 5 cross-sections, got ${sections.length}`);

for (const view of VIEWS) {
  if (!view.tab?.tr || !view.tab?.en || !view.title?.tr || !view.title?.en) fail(`${view.id} missing labels`);
  if (!view.pearl?.tr || !view.pearl?.en || view.pearl.tr === view.pearl.en) fail(`${view.id} pearl languages`);
  const modeIds = view.modes.map(mode => mode.id);
  if (view.modes.length === 1 && modeIds[0] !== 'map') fail(`${view.id} single mode must be map`);
  for (const item of view.structures) {
    if (item.view !== view.id) fail(`${item.id} view mismatch`);
    if (!item.modes?.length) fail(`${item.id} has no modes`);
    item.modes.forEach(modeId => {
      if (!modeIds.includes(modeId)) fail(`${item.id} mode ${modeId} is not on ${view.id}`);
      const shapes = item.draw?.[modeId];
      if (!Array.isArray(shapes) || shapes.length === 0) fail(`${item.id} empty draw ${modeId}`);
      const box = view.modes.find(mode => mode.id === modeId).viewBox;
      shapes.forEach((shape, index) => shapeIn(shape, box, `${item.id} ${modeId} #${index}`));
      const hit = hitPoint(item, modeId);
      pointIn(hit.x, hit.y, box, `${item.id} hit ${modeId}`);
    });
    Object.keys(item.draw || {}).forEach(modeId => {
      if (!item.modes.includes(modeId)) fail(`${item.id} draw key ${modeId} is not a mode`);
    });
    if (item.hits) {
      Object.entries(item.hits).forEach(([modeId, point]) => {
        if (!item.modes.includes(modeId)) fail(`${item.id} hits.${modeId} is not a mode`);
        const box = view.modes.find(mode => mode.id === modeId)?.viewBox;
        if (!box) fail(`${item.id} hits.${modeId} has no viewBox`);
        else pointIn(point.x, point.y, box, `${item.id} hits ${modeId}`);
      });
    }
    pointIn(item.hit.x, item.hit.y, view.modes.find(mode => mode.id === item.modes[0]).viewBox, `${item.id} default hit`);
    if (item.label) {
      pointIn(item.label.x, item.label.y, view.modes.find(mode => mode.id === item.modes[0]).viewBox, `${item.id} label`);
      if (!item.label.tr || !item.label.en) fail(`${item.id} empty label`);
    }
    for (const field of ['name', 'text', 'pearl']) {
      const bag = item[field];
      if (!bag?.tr || !bag?.en) fail(`${item.id} empty ${field}`);
    }
    if (item.name.tr === item.name.en) fail(`${item.id} name.tr equals name.en`);
    if (item.text.tr === item.text.en) fail(`${item.id} text languages match`);
    if (item.pearl.tr === item.pearl.en) fail(`${item.id} pearl languages match`);
    if (item.text.tr.length < 80 || item.text.en.length < 80) {
      fail(`${item.id} text shorter than 80 (${item.text.tr.length}/${item.text.en.length})`);
    }
  }
}

const loop = allStructures().find(item => item.id === 'radial-loop');
const high = allStructures().find(item => item.id === 'high-bifurcation');
if (!loop || loop.modes.length !== 1 || loop.modes[0] !== 'variant') fail('radial-loop must be variant only');
if (!high || high.modes.length !== 1 || high.modes[0] !== 'variant') fail('high-bifurcation must be variant only');
if (structuresFor('arm', 'typical').some(item => item.id === 'radial-loop' || item.id === 'high-bifurcation')) {
  fail('variant-only structures leaked into typical');
}
if (structuresFor('arm', 'typical').length !== 13) fail('typical arm count');
if (structuresFor('arm', 'variant').length !== 15) fail('variant arm count');
if (structuresFor('aortoiliac', 'map').length !== 10) fail('aortoiliac count');
if (structuresFor('femoral', 'map').length !== 11) fail('femoral map count');
if (structuresFor('femoral', 'xs').length !== 5) fail('femoral section count');
if (structuresFor('runoff', 'map').length !== 18) fail('runoff count');
for (const mode of ['ap', 'lateral', 'oblique']) {
  if (structuresFor('visceral', mode).length !== 12) fail(`visceral ${mode} count`);
}

if (!SHELL.tr.disclaimer.includes('Şematik eğitim çizimidir')) fail('TR disclaimer');
if (!/schematic teaching drawing/i.test(SHELL.en.disclaimer)) fail('EN disclaimer');
if (SHELL.tr.disclaimer.includes('\u2014') || SHELL.en.disclaimer.includes('\u2014')) fail('disclaimer em dash');
if (!UI.tr.pearl || !UI.en.pearl.includes('Angiographic relevance')) fail('card headings');
if (!SCALES.rutherford?.rows?.length || !SCALES.fontaine?.rows?.length || !SCALES.abi?.rows?.length) fail('scales');
if (REFERENCES.length < 12) fail('references');
const refs = REFERENCES.join('\n');
for (const needle of ['Gray', 'TASC II', 'Rutherford', 'Fontaine', 'Madhwal', 'Kiemeneij', 'Attinger', 'Taylor', 'SCAI']) {
  if (!refs.includes(needle)) fail(`reference missing ${needle}`);
}

const owned = [
  'angio/peripheral/index.html',
  'src/angio/peripheral/main.js',
  'src/angio/peripheral/peripheral-data.js',
  'src/angio/peripheral/peripheral-data-lower.js',
  'src/angio/peripheral/peripheral-data-sections.js',
  'src/angio/peripheral/peripheral-data-runoff.js',
  'src/angio/peripheral/peripheral-data-visceral.js',
  'src/angio/peripheral/peripheral-data-arm.js',
  'src/angio/peripheral/peripheral-sim.js',
  'src/angio/peripheral/peripheral-svg.js',
  'src/angio/peripheral/peripheral-panel.js',
  'src/angio/peripheral/peripheral.css',
  'scripts/test-angio-peripheral.mjs',
  'scripts/test-angio-peripheral-browser.cjs'
];
for (const rel of owned) {
  const file = path.join(root, rel);
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes('\u2014')) fail(`${rel} contains an em dash`);
  if (rel.startsWith('src/angio/peripheral/') && rel.endsWith('.js')) {
    if (/\b(Bouthillier|NASCET)\b/.test(text)) fail(`${rel} cites a carotid source`);
  }
}
const css = fs.readFileSync(path.join(root, 'src/angio/peripheral/peripheral.css'), 'utf8');
if (/url\s*\(\s*['"]?(?!#)/i.test(css)) fail('peripheral.css uses an external URL');
if (/cdn|fonts\.google|fonts\.gstatic/i.test(css)) fail('peripheral.css uses a CDN');
if (/overflow-x\s*:\s*hidden/i.test(css)) fail('peripheral.css hides overflow-x');
if (/font-weight\s*:\s*(650|750|800)/.test(css)) fail('peripheral.css uses a heavy font-weight');

walk({ VIEWS, SHELL, UI, SCALES, REFERENCES }, value => {
  if (value.includes('\u2014')) fail(`exported string contains an em dash: ${value.slice(0, 80)}`);
});

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const WIDTH = { trunk: 22, artery: 16, branch: 10, small: 6, variant: 6, landmark: 4, marker: 3 };
const HIT_EXTRA = {
  trunk: 18, artery: 16, branch: 14, small: 14, variant: 16, landmark: 14, marker: 18,
  zone: 16, safe: 16, risk: 16, warn: 16, bone: 16, frame: 14, skin: 14
};
const KIND_ORDER = [
  'zone', 'safe', 'risk', 'warn', 'skin', 'bone', 'frame', 'landmark',
  'trunk', 'artery', 'branch', 'small', 'variant',
  'dot-nerve', 'dot-artery', 'dot-vein', 'marker'
];
const VESSEL = new Set(['trunk', 'artery', 'branch', 'small', 'variant']);
const FILL = new Set(['zone', 'safe', 'risk', 'warn', 'bone', 'skin']);
const ALLOW = { 'visceral/ap': new Set(['renal|sma', 'common-hepatic|visceral-aorta']) };

function hitRadius(shape) {
  const kind = shape.kind || 'artery';
  const base = shape.w || WIDTH[kind] || 8;
  const extra = HIT_EXTRA[kind] ?? 16;
  const hw = shape.type === 'line' ? Math.max(base + extra, 22) : Math.max(extra, 16);
  return hw / 2;
}

function visualRadius(shape) {
  const kind = shape.kind || 'artery';
  return (shape.w || WIDTH[kind] || 8) / 2;
}

function samplesOf(shape) {
  if (shape.type === 'line' || shape.type === 'poly') {
    const pts = shape.pts;
    let longest = 1;
    for (let i = 1; i < pts.length; i += 1) longest = Math.max(longest, dist(pts[i - 1], pts[i]));
    if (shape.type === 'poly' && pts.length > 2) longest = Math.max(longest, dist(pts[0], pts[pts.length - 1]));
    const steps = Math.max(8, Math.ceil(longest / 10));
    return curveSamples(pts, shape.type === 'poly', steps);
  }
  if (shape.type === 'circle' || shape.type === 'ellipse') {
    const rx = shape.rx || shape.r;
    const ry = shape.ry || shape.r;
    const pts = [];
    for (let i = 0; i < 48; i += 1) {
      const angle = (i / 48) * Math.PI * 2;
      pts.push([shape.cx + Math.cos(angle) * rx, shape.cy + Math.sin(angle) * ry]);
    }
    return pts;
  }
  if (shape.type === 'rect') {
    const { x, y, w, h } = shape;
    return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  }
  return [];
}

function controlsOf(shape) {
  if (shape.type === 'line' || shape.type === 'poly') return shape.pts;
  if (shape.type === 'circle' || shape.type === 'ellipse') return [[shape.cx, shape.cy]];
  if (shape.type === 'rect') return [[shape.x, shape.y]];
  return [];
}

function nearAny(p, pts, limit) {
  return pts.some(q => dist(p, q) <= limit);
}

function segHit(a, b, c, d) {
  const rx = b[0] - a[0];
  const ry = b[1] - a[1];
  const sx = d[0] - c[0];
  const sy = d[1] - c[1];
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-9) return null;
  const qpx = c[0] - a[0];
  const qpy = c[1] - a[1];
  const t = (qpx * sy - qpy * sx) / den;
  const u = (qpx * ry - qpy * rx) / den;
  if (t <= 0.03 || t >= 0.97 || u <= 0.03 || u >= 0.97) return null;
  return [a[0] + t * rx, a[1] + t * ry];
}

function crossings(samplesA, samplesB, ctrlsA, ctrlsB) {
  const hits = [];
  for (let i = 0; i < samplesA.length - 1; i += 1) {
    for (let j = 0; j < samplesB.length - 1; j += 1) {
      const hit = segHit(samplesA[i], samplesA[i + 1], samplesB[j], samplesB[j + 1]);
      if (!hit) continue;
      if (nearAny(hit, ctrlsA, 16) || nearAny(hit, ctrlsB, 16)) continue;
      if (hits.some(prev => dist(prev, hit) < 14)) continue;
      hits.push(hit);
    }
  }
  return hits;
}

function selfCrossings(samples, ctrls) {
  const hits = [];
  for (let i = 0; i < samples.length - 1; i += 1) {
    for (let j = i + 2; j < samples.length - 1; j += 1) {
      const hit = segHit(samples[i], samples[i + 1], samples[j], samples[j + 1]);
      if (!hit) continue;
      if (nearAny(hit, ctrls, 16)) continue;
      if (hits.some(prev => dist(prev, hit) < 14)) continue;
      hits.push(hit);
    }
  }
  return hits;
}

function textWidth(text, font) {
  return text.length * font * LABEL_CHAR;
}

function boxOf(label, font = LABEL_FONT) {
  const width = textWidth(label.text, font);
  const anchor = label.anchor || 'start';
  const x0 = anchor === 'end' ? label.x - width : anchor === 'middle' ? label.x - width / 2 : label.x;
  return { x0, y0: label.y - font, x1: x0 + width, y1: label.y + 4, width };
}

function overlap(a, b, gap = 2) {
  return a.x0 < b.x1 + gap && a.x1 > b.x0 - gap && a.y0 < b.y1 + gap && a.y1 > b.y0 - gap;
}

function pointInBox(x, y, box) {
  return x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1;
}

function segNearBox(a, b, box) {
  if (pointInBox(a[0], a[1], box) || pointInBox(b[0], b[1], box)) return true;
  const edges = [
    [[box.x0, box.y0], [box.x1, box.y0]],
    [[box.x1, box.y0], [box.x1, box.y1]],
    [[box.x1, box.y1], [box.x0, box.y1]],
    [[box.x0, box.y1], [box.x0, box.y0]]
  ];
  return edges.some(([c, d]) => segHit(a, b, c, d));
}

function leaderOf(label, text) {
  const width = textWidth(text, LABEL_FONT);
  const anchor = label.anchor || 'start';
  const x0 = anchor === 'end' ? label.x - width : anchor === 'middle' ? label.x - width / 2 : label.x;
  const x1 = x0 + width;
  const x = Math.min(Math.max(label.to[0], x0), x1);
  return [[x, label.y - 3], [label.to[0], label.to[1]]];
}

function inEllipse(x, y, cx, cy, rx, ry) {
  return ((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2) < 1;
}

function pointInPoly(x, y, samples) {
  let inside = false;
  for (let i = 0, j = samples.length - 1; i < samples.length; j = i, i += 1) {
    const [x1, y1] = samples[i];
    const [x2, y2] = samples[j];
    if ((y1 > y) !== (y2 > y) && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) inside = !inside;
  }
  return inside;
}

function insideFill(p, shape) {
  if (shape.type === 'ellipse' || shape.type === 'circle') {
    return inEllipse(p[0], p[1], shape.cx, shape.cy, shape.rx || shape.r, shape.ry || shape.r);
  }
  if (shape.type === 'poly') return pointInPoly(p[0], p[1], samplesOf(shape));
  if (shape.type === 'rect') {
    return p[0] > shape.x && p[0] < shape.x + shape.w && p[1] > shape.y && p[1] < shape.y + shape.h;
  }
  return false;
}

function minDist(p, samples) {
  let best = Infinity;
  for (const q of samples) best = Math.min(best, dist(p, q));
  return best;
}

function capLang(name, tr, en, x, y, anchor = 'start') {
  const trBox = boxOf({ text: tr, x, y, anchor }, 12);
  const enBox = boxOf({ text: en, x, y, anchor }, 12);
  const box = trBox.width >= enBox.width ? trBox : enBox;
  return { name, ...box };
}

const watermark = (w, h) => capLang('watermark', 'Şematik eğitim geometrisi', 'Schematic teaching geometry', w - 16, h - 16, 'end');

const SCENERY = {
  'aortoiliac/map': [
    capLang('right', 'RIGHT', 'SAĞ', 24, 28),
    capLang('left', 'LEFT', 'SOL', 696, 28, 'end'),
    capLang('L4', 'L4', 'L4', 48, 248),
    capLang('ligament', 'Inguinal ligament', 'İnguinal ligaman', 360, 786, 'middle'),
    watermark(720, 800)
  ],
  'femoral/map': [
    capLang('iea', 'IEA marker (not a second target)', 'İEA işareti (ayrı hedef değil)', 430, 78),
    capLang('groin', 'RIGHT GROIN', 'SAĞ KASIK', 28, 32),
    capLang('lat', 'Lateral', 'Lateral', 28, 776),
    capLang('med', 'Medial', 'Medial', 692, 776, 'end'),
    watermark(720, 800)
  ],
  'runoff/map': [
    capLang('leg', 'RIGHT LEG', 'SAĞ BACAK', 28, 28),
    capLang('knee', 'Knee joint', 'Diz eklemi', 148, 548),
    watermark(720, 1280)
  ],
  'visceral/ap': [
    capLang('laterality', 'RIGHT (image left)', 'SAĞ (görüntü solu)', 24, 28),
    capLang('left', 'LEFT', 'SOL', 696, 28, 'end'),
    capLang('liver', 'Karaciğer', 'Liver', 148, 78, 'middle'),
    capLang('spleen', 'Dalak', 'Spleen', 624, 168, 'middle'),
    capLang('rk', 'Sağ böbrek', 'R kidney', 108, 400, 'middle'),
    capLang('lk', 'Sol böbrek', 'L kidney', 608, 292, 'middle'),
    capLang('IVC', 'IVC', 'IVC', 250, 348, 'middle'),
    capLang('behind', 'behind IVC', 'İVC arkası', 196, 312, 'end'),
    watermark(720, 820)
  ],
  'visceral/lateral': [
    capLang('posterior', 'Posterior', 'Arka', 24, 28),
    capLang('anterior', 'Anterior', 'Ön', 696, 28, 'end'),
    watermark(720, 820)
  ],
  'visceral/oblique': [
    capLang('note', 'Shallow schematic, not a measured angle', 'Sığ şema, ölçülmüş açı değildir', 24, 800),
    watermark(720, 820)
  ]
};

const armScenery = [
  capLang('arch', 'Arch', 'Ark', 28, 196),
  capLang('rib', '1st rib', '1. kaburga', 478, 206),
  capLang('arm', 'LEFT ARM', 'SOL KOL', 24, 28),
  capLang('ulnar-side', 'Ulnar / medial', 'Ulnar / medial', 24, 250),
  capLang('radial-side', 'Radial / lateral', 'Radiyal / lateral', 696, 250, 'end'),
  capLang('arch-note', 'Arch types I-III are not drawn', 'Ark tipleri I-III çizilmez', 24, 1136),
  watermark(720, 1160)
];
SCENERY['arm/typical'] = armScenery;
SCENERY['arm/variant'] = armScenery;

function exempt(item) {
  return item.id.startsWith('xs-') || item.kind === 'frame' || item.kind === 'text';
}

function checkView(view, mode) {
  const name = `${view.id}/${mode.id}`;
  const [w, h] = mode.viewBox;
  const items = structuresFor(view.id, mode.id);
  const scenery = SCENERY[name] || [watermark(w, h)];
  const allow = ALLOW[name] || new Set();
  const expectSelf = name === 'arm/variant' ? { radial: 1 } : {};
  const drawn = [];
  items.forEach((item, index) => {
    (item.draw[mode.id] || []).forEach((shape, shapeIndex) => {
      if (shape.type === 'text') return;
      drawn.push({
        id: item.id,
        kind: shape.kind || item.kind,
        shape,
        index,
        shapeIndex,
        rank: KIND_ORDER.indexOf(shape.kind || item.kind)
      });
    });
  });
  drawn.sort((a, b) => a.rank - b.rank || a.index - b.index || a.shapeIndex - b.shapeIndex);

  const leftFrame = new Set();
  for (const entry of drawn) {
    if (exempt(entry)) continue;
    const samples = samplesOf(entry.shape);
    const pad = visualRadius(entry.shape);
    const outside = samples.some(p => p[0] - pad < 0 || p[1] - pad < 0 || p[0] + pad > w || p[1] + pad > h);
    if (outside && !leftFrame.has(entry.id)) {
      leftFrame.add(entry.id);
      fail(`${name} ${entry.id} stroke leaves the frame`);
    }
    if (entry.shape.type === 'line' && VESSEL.has(entry.kind)) {
      const self = selfCrossings(samples, controlsOf(entry.shape));
      const expected = expectSelf[entry.id] || 0;
      if (self.length !== expected) fail(`${name} ${entry.id} self-cross ${self.length} expected ${expected}`);
    }
  }

  const vesselShapes = drawn.filter(entry => entry.shape.type === 'line' && VESSEL.has(entry.kind) && !exempt(entry));
  for (let i = 0; i < vesselShapes.length; i += 1) {
    for (let j = i + 1; j < vesselShapes.length; j += 1) {
      const a = vesselShapes[i];
      const b = vesselShapes[j];
      if (a.id === b.id) continue;
      const hits = crossings(samplesOf(a.shape), samplesOf(b.shape), controlsOf(a.shape), controlsOf(b.shape));
      if (!hits.length) continue;
      const key = [a.id, b.id].sort().join('|');
      const limit = allow.has(key) ? 1 : 0;
      if (hits.length > limit && (view.id === 'aortoiliac' || view.id === 'visceral' || view.id === 'arm')) {
        fail(`${name} cross ${key} (${hits.length})`);
      }
    }
  }

  const fills = drawn.filter(entry => FILL.has(entry.kind));
  for (const lang of ['tr', 'en']) {
    const labelBoxes = [];
    for (const item of items) {
      const label = labelFor(item, mode.id);
      if (!label) {
        if (!exempt(item)) fail(`${name} ${item.id} missing label`);
        continue;
      }
      if (!exempt(item) && !label.to) fail(`${name} ${item.id} missing leader target`);
      const box = boxOf({ ...label, text: label[lang] });
      if (box.x0 < 4 || box.y0 < 4 || box.x1 > w - 4 || box.y1 > h - 4) {
        fail(`${name} ${item.id} ${lang} label outside ${box.x0.toFixed(0)},${box.y0.toFixed(0)}-${box.x1.toFixed(0)},${box.y1.toFixed(0)}`);
      }
      if (exempt(item)) continue;
      const leader = leaderOf(label, label[lang]);
      const target = label.to;
      const ownSamples = (item.draw[mode.id] || []).flatMap(samplesOf);
      const ownShapes = item.draw[mode.id] || [];
      const onMarker = ownShapes.some(shape => (
        (shape.type === 'circle' || shape.type === 'ellipse')
        && dist(target, [shape.cx, shape.cy]) <= (shape.r || Math.max(shape.rx, shape.ry)) + 6
      ));
      const inOwnFill = ownShapes.some(shape => FILL.has(shape.kind || item.kind) && insideFill(target, shape));
      if (lang === 'tr' && minDist(target, ownSamples) > 24 && !onMarker && !inOwnFill) {
        fail(`${name} ${item.id} leader target far ${target}`);
      }
      scenery.forEach(obstacle => {
        if (overlap(box, obstacle, 1)) fail(`${name} ${item.id} ${lang} label hits scenery ${obstacle.name}`);
        if (segNearBox(leader[0], leader[1], obstacle)) fail(`${name} ${item.id} ${lang} leader hits scenery ${obstacle.name}`);
      });
      labelBoxes.forEach(prev => {
        if (overlap(prev.box, box, 2)) fail(`${name} label overlap ${prev.id} x ${item.id} (${lang})`);
      });
      const probes = [
        [(box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2],
        [box.x0, box.y0], [box.x1, box.y0], [box.x0, box.y1], [box.x1, box.y1]
      ];
      fills.forEach(entry => {
        if (entry.id === item.id) return;
        if (probes.some(p => insideFill(p, entry.shape))) fail(`${name} ${item.id} ${lang} label inside ${entry.id}`);
      });
      const covered = drawn.filter(entry => entry.id !== item.id).flatMap(entry => samplesOf(entry.shape))
        .find(p => pointInBox(p[0], p[1], box) && dist(p, target) > 20);
      if (covered) fail(`${name} ${item.id} ${lang} label covers geometry`);
      const steps = Math.max(1, Math.ceil(dist(leader[0], leader[1]) / 6));
      let leaderNear = false;
      let leaderThrough = false;
      for (let s = 0; s <= steps && (!leaderNear || !leaderThrough); s += 1) {
        const p = lerp(leader[0], leader[1], s / steps);
        if (dist(p, target) <= 18 || dist(p, leader[0]) <= 18) continue;
        if (!leaderThrough) {
          const through = labelBoxes.find(prev => pointInBox(p[0], p[1], prev.box));
          if (through) {
            fail(`${name} ${item.id} ${lang} leader through ${through.id}`);
            leaderThrough = true;
          }
        }
        if (!leaderNear) {
          const near = vesselShapes.find(entry => entry.id !== item.id && minDist(p, samplesOf(entry.shape)) < 8);
          if (near) {
            fail(`${name} ${item.id} ${lang} leader near ${near.id}`);
            leaderNear = true;
          }
        }
      }
      labelBoxes.push({ id: item.id, box });
    }
  }

  for (const item of items) {
    if (exempt(item)) continue;
    const hit = item.hits?.[mode.id] || item.hit;
    const shapes = item.draw[mode.id] || [];
    const near = shapes.some(shape => {
      if (shape.type === 'poly' || shape.type === 'rect' || shape.type === 'ellipse') {
        return insideFill([hit.x, hit.y], shape) || minDist([hit.x, hit.y], samplesOf(shape)) <= 18;
      }
      return minDist([hit.x, hit.y], samplesOf(shape)) <= 18;
    });
    if (!near) fail(`${name} ${item.id} hit ${hit.x},${hit.y} is off the shape`);
  }

  for (let i = 0; i < drawn.length; i += 1) {
    const earlier = drawn[i];
    if (!VESSEL.has(earlier.kind) || earlier.shape.type !== 'line') continue;
    const samples = samplesOf(earlier.shape);
    const mid = samples.filter((_, index) => index > samples.length * 0.15 && index < samples.length * 0.85);
    const later = drawn.slice(i + 1).filter(entry => entry.id !== earlier.id);
    const free = mid.filter(p => later.every(entry => {
      if (nearAny(p, controlsOf(entry.shape), 26)) return true;
      if (entry.shape.type === 'circle' || entry.shape.type === 'ellipse') {
        const rx = entry.shape.rx || entry.shape.r;
        const ry = entry.shape.ry || entry.shape.r;
        const nx = (p[0] - entry.shape.cx) / rx;
        const ny = (p[1] - entry.shape.cy) / ry;
        return Math.abs(Math.hypot(nx, ny) - 1) * Math.min(rx, ry) > hitRadius(entry.shape);
      }
      return minDist(p, samplesOf(entry.shape)) > hitRadius(entry.shape);
    }));
    if (!free.length) fail(`${name} ${earlier.id} centerline covered by a later hit stroke`);
  }
}

for (const view of VIEWS) {
  for (const mode of view.modes) checkView(view, mode);
}

function byId(viewId, modeId) {
  return Object.fromEntries(structuresFor(viewId, modeId).map(item => [item.id, item]));
}

const ap = byId('visceral', 'ap');
const liver = { cx: 148, cy: 118, rx: 78, ry: 52 };
const spleen = { cx: 624, cy: 168, rx: 52, ry: 46 };
const rightKidney = { cx: 108, cy: 400, rx: 46, ry: 58 };
const leftKidney = { cx: 608, cy: 300, rx: 44, ry: 52 };
const endPoint = shape => shape.pts[shape.pts.length - 1];
const splenicEnd = endPoint(ap.splenic.draw.ap[0]);
const properEnd = endPoint(ap['proper-hepatic'].draw.ap[0]);
const renalRight = endPoint(ap.renal.draw.ap[0]);
const renalLeft = endPoint(ap.renal.draw.ap[1]);
const accessoryEnd = endPoint(ap['accessory-renal'].draw.ap[0]);
const gdaEnd = endPoint(ap.gastroduodenal.draw.ap[0]);
const gastricEnd = endPoint(ap['left-gastric'].draw.ap[0]);
if (!inEllipse(...splenicEnd, spleen.cx, spleen.cy, spleen.rx, spleen.ry)) fail('splenic artery ends outside the spleen');
if (!inEllipse(...properEnd, liver.cx, liver.cy, liver.rx, liver.ry)) fail('proper hepatic ends outside the liver');
if (!inEllipse(...renalRight, rightKidney.cx, rightKidney.cy, rightKidney.rx, rightKidney.ry)) fail('right renal ends outside the kidney');
if (!inEllipse(...renalLeft, leftKidney.cx, leftKidney.cy, leftKidney.rx, leftKidney.ry)) fail('left renal ends outside the kidney');
if (!inEllipse(...accessoryEnd, rightKidney.cx, rightKidney.cy, rightKidney.rx, rightKidney.ry)) fail('accessory renal ends outside the kidney');
if (inEllipse(...gastricEnd, liver.cx, liver.cy, liver.rx, liver.ry)) fail('left gastric ends in the liver');
if (gdaEnd[1] >= 318) fail('gastroduodenal ends in the IVC band');
const renalSamples = samplesOf(ap.renal.draw.ap[0]);
if (!renalSamples.some(p => p[0] >= 228 && p[0] <= 272 && p[1] >= 318 && p[1] <= 468)) fail('right renal misses the IVC');
for (const shape of ap.gonadal.draw.ap) {
  if (samplesOf(shape).some(p => (
    inEllipse(p[0], p[1], rightKidney.cx, rightKidney.cy, rightKidney.rx, rightKidney.ry)
    || inEllipse(p[0], p[1], leftKidney.cx, leftKidney.cy, leftKidney.rx, leftKidney.ry)
  ))) fail('gonadal artery enters a kidney');
}

const lateral = byId('visceral', 'lateral');
const celiacPts = lateral.celiac.draw.lateral[0].pts;
const smaPts = lateral.sma.draw.lateral[0].pts;
const celiacStart = celiacPts[0];
const celiacTip = celiacPts[celiacPts.length - 1];
const smaStart = smaPts[0];
const smaTip = smaPts[smaPts.length - 1];
if (!(celiacTip[0] - celiacStart[0] > 40 && celiacTip[1] - celiacStart[1] < -10)) fail('lateral celiac ostium has no anterior upward angle');
if (!(smaTip[0] - smaStart[0] > 40 && smaTip[1] - smaStart[1] > 30)) fail('lateral SMA ostium has no anterior downward angle');
if (celiacStart[0] > 230 || smaStart[0] > 230) fail('lateral ostia are not on the anterior aorta');

const arm = byId('arm', 'typical');
const subclavianStart = arm.subclavian.draw.typical[0].pts[0];
if (subclavianStart[0] !== 108 || subclavianStart[1] !== 78) fail('subclavian does not start at the arch');
const rib = curveSamples([[360, 168], [430, 188], [470, 176]], false, 16);
const subclavian = curveSamples(arm.subclavian.draw.typical[0].pts, false, 16);
let ribGap = Infinity;
subclavian.forEach(p => {
  if (p[0] < 360 || p[0] > 470) return;
  const nearest = rib.reduce((best, q) => (Math.abs(q[0] - p[0]) < Math.abs(best[0] - p[0]) ? q : best));
  ribGap = Math.min(ribGap, nearest[1] - p[1]);
});
if (!(ribGap > 4)) fail('subclavian does not clear the first rib');

// Studio simulation & C-arm projection tests
for (const view of VIEWS) {
  const tree = PERIPHERAL_3D_TREES[view.id];
  if (!Array.isArray(tree) || tree.length < 5) fail(`missing 3D tree for ${view.id}`);
  tree.forEach(branch => {
    if (!unique.has(branch.id)) fail(`3D branch ${branch.id} does not match a canonical structure id`);
    if (!Array.isArray(branch.points) || branch.points.length < 2) fail(`3D branch ${branch.id} has <2 points`);
  });
  const presets = PERIPHERAL_PRESETS[view.id];
  if (!Array.isArray(presets) || presets.length < 3) fail(`missing C-arm presets for ${view.id}`);
  presets.forEach(p => {
    if (!p.name?.tr || !p.name?.en || !p.target?.tr || !p.target?.en) fail(`preset ${p.id} missing text`);
    if (p.targetId && !unique.has(p.targetId)) fail(`preset ${p.id} targetId ${p.targetId} invalid`);
  });
}

if (PERIPHERAL_LESIONS.length < 8) fail('expected at least 8 peripheral lesion scenarios');
PERIPHERAL_LESIONS.forEach(les => {
  if (les.id !== 'none' && (!unique.has(les.vesselId) || les.pct <= 0)) {
    fail(`invalid lesion scenario ${les.id}`);
  }
});

// Verify C-arm angulation separates anterior visceral ostia in Lateral vs AP
const viscAp = computePeripheralTelemetry('visceral', 0, 0, 'celiac');
const viscLat = computePeripheralTelemetry('visceral', 85, 0, 'celiac');
if (!(viscLat.target.elongation > viscAp.target.elongation)) {
  fail('lateral projection must elongate anterior celiac ostium relative to AP');
}
if (viscAp.overlapStatus.state !== 'severe' || viscLat.overlapStatus.state !== 'excellent') {
  fail('visceral celiac overlap status must improve from AP to Lateral');
}

// Verify ipsilateral RAO opens right femoral bifurcation relative to AP
const femAp = computePeripheralTelemetry('femoral', 0, 0, 'profunda');
const femRao = computePeripheralTelemetry('femoral', -32, 0, 'profunda');
if (femAp.overlapStatus.state !== 'moderate' || femRao.overlapStatus.state !== 'excellent') {
  fail('femoral overlap status must open in RAO 32');
}

// Verify ABI & TBI hemodynamic calculator
const abiNorm = computeAbiTbi({ ankle: 120, brachial: 120, toe: 90 });
const abiPad = computeAbiTbi({ ankle: 66, brachial: 120, toe: 48 });
const abiCalc = computeAbiTbi({ ankle: 180, brachial: 120, toe: 24 });
if (abiNorm.abi !== 1 || abiNorm.status !== 'normal') fail('normal ABI calculation failed');
if (abiPad.abi !== 0.55 || abiPad.status !== 'moderate') fail('moderate PAD ABI calculation failed');
if (abiCalc.status !== 'noncompressible' || abiCalc.tbi !== 0.2) fail('noncompressible ABI / TBI calculation failed');

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('PASS peripheral data 71 structures + C-arm DSA studio');

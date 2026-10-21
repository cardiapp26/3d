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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const fail = message => problems.push(message);

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
if (/url\s*\(/i.test(css)) fail('peripheral.css uses url(');
if (/cdn|fonts\.google|fonts\.gstatic/i.test(css)) fail('peripheral.css uses a CDN');
if (/overflow-x\s*:\s*hidden/i.test(css)) fail('peripheral.css hides overflow-x');
if (/font-weight\s*:\s*(650|750|800)/.test(css)) fail('peripheral.css uses a heavy font-weight');

walk({ VIEWS, SHELL, UI, SCALES, REFERENCES }, value => {
  if (value.includes('\u2014')) fail(`exported string contains an em dash: ${value.slice(0, 80)}`);
});

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('PASS peripheral data 71 structures');

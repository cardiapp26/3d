// 2D valve-plane schematic (src/ep-schematic.js): every case zone and source
// region has a shape inside the view, overlays follow the options, the
// circuit direction reverses between orthodromic and antidromic, and the
// legend names what is shown in both languages.
import assert from 'node:assert/strict';
import { schematicShapes, schematicLegend, arcPath, VIEW, TA, createSchematic } from '../../src/eps/ep-schematic.js';
import { EP_CASES } from '../../src/eps/ep-cases.js';
import { EP_ZONE_TEXT } from '../../src/eps/ep-case-text.js';
import { REGIONS } from '../../src/eps/ep-origin.js';

const numbers = (d) => (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
const inView = (d) => {
  // Arc commands carry radius / flag numbers too; check only coordinate pairs after M and L.
  const pts = [...d.matchAll(/[ML]\s*(-?[\d.]+)\s+(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  return pts.length > 0 && pts.every(([x, y]) => x >= 0 && x <= VIEW.w && y >= 0 && y <= VIEW.h);
};

const base = schematicShapes();
assert.deepEqual(base.map((s) => s.id), ['ta', 'ma', 'ivc', 'cs', 'pv', 'koch'], 'anatomy only without options');

// Every case zone and every zone text has a shape.
const zones = new Set([...EP_CASES.map((c) => c.pathwayZone).filter(Boolean), ...Object.keys(EP_ZONE_TEXT)]);
for (const zone of zones) {
  const shape = schematicShapes({ zone }).find((s) => s.kind === 'zone');
  assert.ok(shape && shape.id === zone, `${zone}: zone shape`);
  assert.ok(inView(shape.d), `${zone}: inside the view ${shape.d}`);
}
assert.equal(schematicShapes({ zone: 'nowhere' }).length, base.length, 'unknown zone ignored');

// Source regions of the PAC / PVC exercise.
for (const region of [...REGIONS.ventricular, ...REGIONS.atrial]) {
  const shape = schematicShapes({ origin: region }).find((s) => s.kind === 'origin');
  assert.ok(shape && inView(shape.d), `${region}: origin marker`);
}

// Overlays.
const all = schematicShapes({ zone: 'left-free-wall', halo: true, circuit: 'orthodromic', paths: ['avn', 'ap'] });
assert.deepEqual(all.slice(base.length).map((s) => s.kind), ['zone', 'halo', 'circuit', 'path', 'path']);
const ortho = schematicShapes({ circuit: 'orthodromic' }).find((s) => s.kind === 'circuit');
const anti = schematicShapes({ circuit: 'antidromic' }).find((s) => s.kind === 'circuit');
const pairs = (d) => { const n = numbers(d); const out = []; for (let i = 0; i < n.length; i += 2) out.push(`${n[i]},${n[i + 1]}`); return out; };
assert.deepEqual(pairs(anti.d), pairs(ortho.d).reverse(), 'antidromic runs the loop the other way');

// Arc helper: the ends lie on the ring.
const [x0, y0] = numbers(arcPath(TA, 0, 90));
assert.ok(Math.abs(x0 - (TA.cx + TA.r)) < 0.11 && Math.abs(y0 - TA.cy) < 0.11);

// Legend.
assert.equal(schematicLegend({}, 'tr'), '');
assert.match(schematicLegend({ zone: 'cavotricuspid-isthmus', halo: true }, 'tr'), /Halo kateteri/);
assert.match(schematicLegend({ circuit: 'orthodromic', paths: ['ap'] }, 'en'), /Orthodromic circuit · Accessory pathway/);

// DOM: one path per shape plus labels; the legend hides when empty.
function fake(tag) {
  const n = { tag, children: [], attributes: {}, textContent: '', hidden: false, className: '',
    setAttribute(k, v) { n.attributes[k] = String(v); }, append(...k) { n.children.push(...k); }, replaceChildren(...k) { n.children = k; } };
  return n;
}
const doc = { createElement: fake, createElementNS: (ns, tag) => fake(tag) };
const sch = createSchematic(doc);
sch.update({ zone: 'pv-antrum' }, 'en');
const svg = sch.element.children[0];
assert.equal(svg.children.filter((c) => c.tag === 'path').length, base.length + 1);
assert.equal(sch.element.children[1].hidden, false);
assert.match(svg.attributes['aria-label'], /teaching region/);
sch.update({}, 'tr');
assert.equal(sch.element.children[1].hidden, true, 'empty legend hidden');

console.log(`PASS ep-schematic: ${zones.size} zones and ${REGIONS.ventricular.length + REGIONS.atrial.length} source regions inside the view, overlays, circuit direction, legend TR/EN, SVG build`);

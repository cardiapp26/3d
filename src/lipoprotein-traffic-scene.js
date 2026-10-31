// Animated lipoprotein traffic: intestine, liver, plasma, muscle/adipose and the arterial intima.
// Particles follow fixed routes; spawn rates come from trafficRates() so the road fills or empties
// with the lab profile. apoB particles that enter the intima stay there for a while (retention).
// Qualitative teaching animation: no kinetics, sizes not to scale.
import { LIPOPROTEINS } from './lipoprotein-traffic-data.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const WALL_X = [170, 330, 520];
const ROUTES = {
  chylomicron: 'M150 110C180 170 200 200 250 200L610 200C640 200 652 182 660 156C620 120 520 108 476 100',
  vldl: 'M360 112C350 160 330 214 290 214L600 214C640 214 655 196 662 156C660 200 640 228 600 228L230 228',
  ldlLiver: 'M24 242L330 242C372 242 392 190 396 124',
  hdl: 'M452 112C480 170 500 240 520 300C540 318 566 312 576 290C600 240 600 200 560 160C530 130 490 120 462 114',
  ...Object.fromEntries(WALL_X.map((x, i) => [`wall${i}`, `M24 246L${x} 246C${x + 20} 252 ${x + 24} 272 ${x + 18} 300`]))
};
/** Kind → [fill, radius]; class colours from the data, the remnant and loaded HDL as lighter shades. */
const tone = id => LIPOPROTEINS.find(item => item.id === id).color;
const LOOK = {
  chylomicron: [tone('chylomicron'), 11], remnant: ['#e8a800', 6.5], vldl: [tone('vldl'), 9], idl: [tone('idl'), 7], ldl: [tone('ldl'), 5.5],
  lpa: [tone('lpa'), 6], hdl: [tone('hdl'), 3.6], hdlLoaded: ['#6fd34a', 4.4]
};
const APOB_KINDS = new Set(['chylomicron', 'remnant', 'vldl', 'idl', 'ldl', 'lpa']);
const SPEED = 78;
const RETAIN_SECONDS = 18;
const MAX_RETAINED = 90;

export const TRAFFIC_SCENE = `<defs><pattern id="lpt-villi" width="14" height="20" patternUnits="userSpaceOnUse"><path d="M0 20V8Q7 -3 14 8V20" fill="#f0be82" stroke="#c98a45"/></pattern></defs>
  <rect x="20" y="30" width="140" height="122" rx="30" fill="#f7d9b0" stroke="#d9a868" stroke-width="2"/><rect x="112" y="40" width="40" height="104" fill="url(#lpt-villi)"/>
  <text x="34" y="62" data-lpt-label="intestine"/>
  <path d="M290 40Q390 0 500 34Q540 90 470 122Q380 136 300 112Q270 80 290 40Z" fill="#c8665a" stroke="#93392f" stroke-width="2"/>
  <text x="352" y="66" class="lpt-on-dark" data-lpt-label="liver"/>
  <rect x="600" y="30" width="140" height="122" rx="24" fill="#f6d27a" stroke="#cf9f2e" stroke-width="2"/>
  <text x="614" y="62" data-lpt-label="tissue"/>
  <rect x="10" y="182" width="740" height="76" rx="38" fill="#f4b8ae" stroke="#c9584a" stroke-width="2.5"/>
  <text x="694" y="252" class="lpt-small" data-lpt-label="plasma"/>
  <path d="M10 264H750" class="lpt-endothelium"/>
  <rect x="10" y="268" width="740" height="84" rx="10" fill="#f6d6c4" stroke="#e0a98d" stroke-width="1.5"/>
  <text x="22" y="344" class="lpt-small" data-lpt-label="intima"/>
  <g class="lpt-retained"></g><g class="lpt-particles"></g>
  <g class="lpt-tag"><rect x="370" y="108" width="52" height="20" rx="6"/><text x="378" y="122">LDL-R</text></g>
  <g class="lpt-tag"><rect x="438" y="100" width="48" height="20" rx="6"/><text x="446" y="114">SR-BI</text></g>
  <g class="lpt-tag"><rect x="634" y="142" width="44" height="20" rx="6"/><text x="645" y="156">LPL</text></g>`;

const add = (parent, tag) => parent.appendChild(document.createElementNS(SVG_NS, tag));

/**
 * @param {SVGSVGElement} svg element that already holds TRAFFIC_SCENE
 * @param {{ reducedMotion?: boolean, onCount?: (counts: {road:number, wall:number}) => void }} options
 */
export function createTrafficScene(svg, { reducedMotion = false, onCount = () => {} } = {}) {
  const layer = svg.querySelector('.lpt-particles');
  const retainedLayer = svg.querySelector('.lpt-retained');
  const routes = Object.fromEntries(Object.entries(ROUTES).map(([id, d]) => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'lpt-route');
    svg.insertBefore(path, retainedLayer);
    return [id, { path, length: path.getTotalLength() }];
  }));
  let rates = { ldl: 0, vldl: 0, chylomicron: 0, lpa: 0, hdl: 0, wallLdl: 0, wallLpa: 0 };
  let debt = {}, last = 0, running = true, clock = 0, lastCount = '';
  const particles = [], retained = [];

  function spawn(kind) {
    let route = kind === 'ldl' || kind === 'lpa' ? 'ldlLiver' : kind;
    const wallChance = kind === 'ldl' ? rates.wallLdl : kind === 'lpa' ? rates.wallLpa : 0;
    if (Math.random() < wallChance) route = `wall${Math.floor(Math.random() * WALL_X.length)}`;
    const el = add(layer, 'circle');
    particles.push({ el, kind, route, s: 0, look: '' });
  }
  /** What a particle looks like at its fraction of the route (VLDL shrinks into IDL and LDL). */
  function lookOf(p, f) {
    if (p.kind === 'chylomicron') return f < 0.62 ? 'chylomicron' : 'remnant';
    if (p.kind === 'vldl') return f < 0.56 ? 'vldl' : f < 0.8 ? 'idl' : 'ldl';
    if (p.kind === 'hdl') return f < 0.42 ? 'hdl' : 'hdlLoaded';
    return p.kind;
  }
  function retain(p) {
    const end = routes[p.route].path.getPointAtLength(routes[p.route].length);
    const el = add(retainedLayer, 'circle');
    el.setAttribute('cx', (end.x + (Math.random() - 0.5) * 70).toFixed(1));
    el.setAttribute('cy', (296 + Math.random() * 34).toFixed(1));
    el.setAttribute('r', p.kind === 'lpa' ? 4.5 : 3.8);
    el.setAttribute('fill', LOOK[p.kind][0]);
    el.dataset.kind = p.kind;
    retained.push({ el, born: clock });
    while (retained.length > MAX_RETAINED) retained.shift().el.remove();
  }
  const emit = (key, rate, dt) => {
    debt[key] = (debt[key] || 0) + rate * dt;
    while (debt[key] >= 1) { debt[key] -= 1; spawn(key); }
  };
  function step(dt) {
    clock += dt;
    for (const kind of ['ldl', 'vldl', 'chylomicron', 'lpa', 'hdl']) emit(kind, rates[kind], dt);
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i], route = routes[p.route];
      p.s += dt * SPEED;
      if (p.s >= route.length) {
        if (p.route.startsWith('wall')) retain(p);
        p.el.remove(); particles.splice(i, 1); continue;
      }
      const point = route.path.getPointAtLength(p.s), look = lookOf(p, p.s / route.length);
      p.el.setAttribute('cx', point.x.toFixed(1)); p.el.setAttribute('cy', point.y.toFixed(1));
      if (look !== p.look) {
        p.look = look;
        p.el.setAttribute('r', LOOK[look][1]); p.el.setAttribute('fill', LOOK[look][0]);
        p.el.dataset.kind = look === 'remnant' ? 'chylomicron' : look === 'hdlLoaded' ? 'hdl' : look;
        p.el.classList.toggle('is-apob', APOB_KINDS.has(look));
      }
    }
    while (retained.length && clock - retained[0].born > RETAIN_SECONDS) retained.shift().el.remove();
    report();
  }
  function report() {
    const counts = { road: particles.filter(p => APOB_KINDS.has(p.look)).length, wall: retained.length };
    const key = `${counts.road}:${counts.wall}`;
    if (key !== lastCount) { lastCount = key; onCount(counts); }
  }
  function warm() {
    particles.splice(0).forEach(p => p.el.remove());
    retained.splice(0).forEach(r => r.el.remove());
    debt = {}; clock = 0;
    for (let i = 0; i < 160; i += 1) step(0.1);
  }
  function setRates(next) {
    rates = { ...next };
    if (reducedMotion) warm();
  }
  function tick(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (running && !reducedMotion) step(dt);
    requestAnimationFrame(tick);
  }
  new IntersectionObserver(entries => { running = entries[0].isIntersecting; }).observe(svg);
  requestAnimationFrame(tick);
  return { setRates, warm, counts: () => ({ road: particles.filter(p => APOB_KINDS.has(p.look)).length, wall: retained.length }) };
}

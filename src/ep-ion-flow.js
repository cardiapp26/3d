// Animated membrane: ions move through open channels in the direction of the dominant
// current for the current AP phase. Rates are relative and schematic (not measured
// conductances); a blocked channel turns ions back at its gate.
const SVG_NS = 'http://www.w3.org/2000/svg';
const MEMBRANE = { top: 70, bottom: 130 };
// Blockade is partial: most ions at a blocked channel turn back, some still pass.
const BLOCK_SHARE = 0.7;
export const CHANNELS = {
  na: { x: 90, ion: 'Na⁺', color: '#e0a03a', dir: 'in' },
  ca: { x: 210, ion: 'Ca²⁺', color: '#3f8fb0', dir: 'in' },
  k: { x: 330, ion: 'K⁺', color: '#8b5fa8', dir: 'out' },
  hcn: { x: 450, ion: 'If', color: '#d07a52', dir: 'in' },
};
/** Na⁺/K⁺-ATPase: 3 Na⁺ out and 2 K⁺ in per cycle, using ATP. */
export const PUMP = { x: 570, cycleSeconds: 1.6 };
const PUMP_PATHS = { pumpNa: { x: PUMP.x, color: '#e0a03a', dir: 'out' }, pumpK: { x: PUMP.x, color: '#8b5fa8', dir: 'in' } };
const pathFor = id => CHANNELS[id] || PUMP_PATHS[id];
/** Relative flux (0..1) per open channel for each cell/phase. */
export const FLUX = {
  ventricular: { 0: { na: 1 }, 1: { k: 0.5 }, 2: { ca: 0.45, k: 0.45 }, 3: { k: 1 }, 4: {} },
  nodal: { 0: { ca: 1 }, 3: { k: 0.9 }, 4: { hcn: 0.55, ca: 0.25 } },
};
const BACKGROUND = [['na', 'out', 9], ['ca', 'out', 5], ['k', 'in', 10]];

export function createIonFlow(svg, { reducedMotion = false } = {}) {
  const layer = document.createElementNS(SVG_NS, 'g');
  const cloud = document.createElementNS(SVG_NS, 'g');
  svg.append(cloud, layer);
  const particles = [];
  let flux = {}, blocked = new Set(), spawnDebt = {};
  drawCloud();

  function drawCloud() {
    // Concentration hint: Na⁺/Ca²⁺ high outside, K⁺ high inside.
    let seed = 7;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (const [id, side, count] of BACKGROUND) {
      for (let i = 0; i < count; i += 1) {
        const dot = circle(CHANNELS[id].color, 3.2);
        dot.setAttribute('cx', 20 + rand() * 600);
        dot.setAttribute('cy', side === 'out' ? 14 + rand() * 46 : 140 + rand() * 46);
        dot.setAttribute('opacity', '.35');
        cloud.append(dot);
      }
    }
  }
  function circle(color, r) {
    const node = document.createElementNS(SVG_NS, 'circle');
    node.setAttribute('r', r); node.setAttribute('fill', color);
    return node;
  }
  function spawn(id) {
    const channel = pathFor(id), el = circle(channel.color, 5.5);
    layer.append(el);
    particles.push({ el, id, t: 0, spread: (Math.random() - 0.5) * 70, blocked: blocked.has(id) && Math.random() < BLOCK_SHARE });
  }
  function position(p) {
    const { x, dir } = pathFor(p.id);
    // t 0..1 along the path; blocked ions reverse at the gate (t≈0.4).
    let t = p.t;
    if (p.blocked && t > 0.4) t = 0.8 - t;
    const y = dir === 'in' ? 10 + t * 180 : 190 - t * 180;
    const inPore = y > MEMBRANE.top - 6 && y < MEMBRANE.bottom + 6;
    const edge = Math.min(Math.abs(y - MEMBRANE.top), Math.abs(y - MEMBRANE.bottom)) / 60;
    return [inPore ? x : x + p.spread * Math.min(1, edge), y];
  }
  let pumpClock = 0, pumpAngle = 0;
  function stepPump(dt) {
    pumpClock += dt; pumpAngle = (pumpAngle + dt * 140) % 360;
    svg.querySelector('.pharmaep-pump-rotor')?.setAttribute('transform', `rotate(${pumpAngle} ${PUMP.x} 100)`);
    if (pumpClock < PUMP.cycleSeconds) return;
    pumpClock = 0;
    for (let i = 0; i < 3; i += 1) setTimeout(() => spawn('pumpNa'), i * 140);
    for (let i = 0; i < 2; i += 1) setTimeout(() => spawn('pumpK'), 420 + i * 160);
  }
  function step(dt) {
    stepPump(dt);
    for (const [id, rate] of Object.entries(flux)) {
      spawnDebt[id] = (spawnDebt[id] || 0) + rate * dt * 9;
      while (spawnDebt[id] >= 1) { spawn(id); spawnDebt[id] -= 1; }
    }
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.t += dt * 0.55;
      const done = p.blocked ? p.t > 0.8 : p.t > 1;
      if (done) { p.el.remove(); particles.splice(i, 1); continue; }
      const [x, y] = position(p);
      p.el.setAttribute('cx', x); p.el.setAttribute('cy', y);
      p.el.setAttribute('opacity', String(p.blocked ? Math.max(0, 1 - Math.abs(p.t - 0.4) * 2.2) : 1));
    }
  }
  function setState(nextFlux, nextBlocked) {
    flux = { ...nextFlux }; blocked = new Set(nextBlocked);
    if (reducedMotion) staticFrame();
  }
  function staticFrame() {
    // Reduced motion: one ion parked mid-pore per open channel, no movement.
    particles.splice(0).forEach(p => p.el.remove());
    for (const id of Object.keys(flux)) {
      spawn(id);
      const p = particles[particles.length - 1];
      p.t = p.blocked ? 0.33 : 0.5;
      const [x, y] = position(p);
      p.el.setAttribute('cx', x); p.el.setAttribute('cy', y);
    }
  }
  function clear() { particles.splice(0).forEach(p => p.el.remove()); spawnDebt = {}; }
  return { step: reducedMotion ? () => {} : step, setState, clear };
}

// Animated activation along the coagulation map. Pulses leave the initiators (TF + VIIa in vivo,
// XIIa for laboratory contact activation), light each factor in sequence and build the clot.
// Drug targets attenuate flow downstream (anticoagulation is partial, not an on/off switch);
// fibrinolysis builds the clot, then dissolves it. Sequence only; no timing or levels.
const SVG_NS = 'http://www.w3.org/2000/svg';
const STEP = 0.75;
const INITIATORS = ['tf', 'vii', 'xii'];
/** Cofactors and substrates light together with the complex or product they join. */
const JOINS = { viii: 'intrinsic-tenase', v: 'prothrombinase', i: 'fibrin' };
const ATTENUATED = 0.3;

function activationTimes(nodes, edges, blocked) {
  const time = new Map(INITIATORS.map(id => [id, 0])), strength = new Map(INITIATORS.map(id => [id, blocked.has(id) ? ATTENUATED : 1]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const [from, to] of edges) {
      if (!time.has(from) || JOINS[from]) continue;
      const next = time.get(from) + 1, carried = strength.get(from) * (blocked.has(to) ? ATTENUATED : 1);
      if (!time.has(to) || next < time.get(to)) { time.set(to, next); strength.set(to, carried); changed = true; }
    }
  }
  for (const [cofactor, partner] of Object.entries(JOINS)) {
    if (time.has(partner)) { time.set(cofactor, time.get(partner) - 0.4); strength.set(cofactor, 1); }
  }
  return { time, strength, end: Math.max(...time.values()) };
}

export function createCoagFlow({ root, nodes, edges, feedbackIds }) {
  const svg = root.querySelector('.coag-map svg');
  const pulses = document.createElementNS(SVG_NS, 'g');
  pulses.setAttribute('class', 'coag-pulses');
  svg.append(pulses);
  const strands = svg.querySelector('path[stroke="#cea154"]'), cells = svg.querySelector('g[fill="#bb4146"]');
  strands?.classList.add('coag-strands'); cells?.classList.add('coag-cells');
  const block = document.createElementNS(SVG_NS, 'g');
  block.setAttribute('class', 'coag-blocks');
  svg.append(block);
  let state = null, start = 0, frame = 0, options = { drug: 'none', targets: [], feedback: false };

  function edgePath(from, to) { return edges.find(edge => edge.from === from && edge.to === to)?.path; }
  function reset() {
    cancelAnimationFrame(frame);
    pulses.replaceChildren();
    root.classList.remove('is-flowing', 'is-lysing');
    for (const [, button] of nodes) { button.classList.remove('is-lit'); button.style.removeProperty('--lit'); }
    svg.style.setProperty('--fibrin', 0);
  }
  function play(next) {
    reset();
    options = { ...options, ...next };
    const blocked = new Set(options.drug === 'lysis' ? [] : options.targets);
    state = activationTimes([...nodes.keys()], edges.map(edge => [edge.from, edge.to]), blocked);
    block.innerHTML = [...blocked].map(id => {
      const button = nodes.get(id);
      const x = parseFloat(button.style.left) / 100 * 960 + 70, y = parseFloat(button.style.top) / 100 * 920 - 22;
      return `<g><circle cx="${x}" cy="${y}" r="15"/><path d="M${x - 6} ${y - 6}l12 12m0-12l-12 12"/></g>`;
    }).join('');
    root.classList.add('is-flowing');
    start = performance.now();
    frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    const elapsed = (now - start) / 1000 / STEP, { time, strength, end } = state;
    for (const [id, button] of nodes) {
      const lit = time.has(id) && elapsed >= time.get(id);
      button.classList.toggle('is-lit', lit);
      button.style.setProperty('--lit', lit ? strength.get(id) : 0);
    }
    pulses.replaceChildren();
    for (const edge of edges) {
      if (!time.has(edge.from) || !time.has(edge.to) || JOINS[edge.from]) continue;
      const t0 = time.get(edge.from), t1 = time.get(edge.to);
      if (elapsed < t0 || elapsed > t1) continue;
      addPulse(edge.path, (elapsed - t0) / (t1 - t0 || 1), strength.get(edge.to));
    }
    if (options.feedback && time.has('ii')) {
      // Thrombin feedback activates V, VIII and XI (amplification), drawn after thrombin forms.
      const t0 = time.get('ii'), f = elapsed - t0;
      if (f > 0 && f < 1.4) root.querySelectorAll('[data-coag-feedback-edges] path').forEach(path => addPulse(path, f / 1.4, strength.get('ii')));
    }
    const clotAt = time.get('clot') ?? Infinity, fibrin = Math.min(1, Math.max(0, elapsed - clotAt + 1)) * (strength.get('clot') ?? 0);
    const lysing = options.drug === 'lysis' && elapsed > end + 1.2;
    svg.style.setProperty('--fibrin', lysing ? Math.max(0, fibrin - (elapsed - end - 1.2) / 2) : fibrin);
    root.classList.toggle('is-lysing', lysing);
    if (elapsed < end + (options.drug === 'lysis' ? 4.5 : 1.5)) frame = requestAnimationFrame(tick);
  }
  function addPulse(path, fraction, strength) {
    const length = path.getTotalLength(), point = path.getPointAtLength(length * Math.min(1, Math.max(0, fraction)));
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', point.x); dot.setAttribute('cy', point.y); dot.setAttribute('r', 9);
    dot.style.opacity = String(0.35 + 0.65 * strength);
    pulses.append(dot);
  }
  return { play, reset, isFeedback: id => feedbackIds.includes(id) };
}

// Probe panel of the echo console: the probe motions as the hand uses them.
// Paired motions share a 2D pad (TEE flexion wheels, TTE tilt × rock, ICE
// deflections), rotations and the multiplane angle are dials, and every
// motion keeps its range input (keyboard, screen readers, tests) with − / +
// steppers. The pads and dials only drive those inputs, so the console has
// one source of truth. In free mode a faint mark shows the view's preset.

const SVG = 'http://www.w3.org/2000/svg';
const PAD = 132;
const DIAL = 132;

/** Widgets per modality: pads take an x and a y control, dials one control. */
export const PROBE_LAYOUT = Object.freeze({
  tte: [
    { kind: 'dial', key: 'rotation' },
    { kind: 'pad', x: 'rock', y: 'tilt' },
    { kind: 'pad', x: 'slideLateral', y: 'slideElevation' }
  ],
  tee: [
    { kind: 'dial', key: 'rotation' },
    { kind: 'pad', x: 'lateralFlexion', y: 'flexion' },
    { kind: 'dial', key: 'omega', half: true, ticks: [0, 45, 90, 135, 180] }
  ],
  ice: [
    { kind: 'dial', key: 'rotation' },
    { kind: 'pad', x: 'leftRight', y: 'anteroposterior' }
  ]
});

/** Short control names; the long description stays as the tooltip. */
export const SHORT_LABELS = Object.freeze({
  tr: {
    tte: { rotation: 'Rotasyon', tilt: 'Tilt', rock: 'Rock', slideLateral: 'Kaydır ↔', slideElevation: 'Kaydır ↕' },
    tee: { advance: 'İlerlet', rotation: 'Şaft', flexion: 'Ante / retro', lateralFlexion: 'Sol / sağ', omega: 'Multiplan' },
    ice: { advance: 'İlerlet', rotation: 'Rotasyon', anteroposterior: 'Ön / arka', leftRight: 'Sol / sağ' }
  },
  en: {
    tte: { rotation: 'Rotation', tilt: 'Tilt', rock: 'Rock', slideLateral: 'Slide ↔', slideElevation: 'Slide ↕' },
    tee: { advance: 'Advance', rotation: 'Shaft', flexion: 'Ante / retro', lateralFlexion: 'Left / right', omega: 'Multiplane' },
    ice: { advance: 'Advance', rotation: 'Rotation', anteroposterior: 'Ant / post', leftRight: 'Left / right' }
  }
});

const svgEl = (tag, attrs = {}) => {
  const node = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
};
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const range = input => ({ min: Number(input.min), max: Number(input.max), step: Number(input.step) || 1 });
const snap = (input, value) => {
  const { min, max, step } = range(input);
  const snapped = Math.round((clamp(value, min, max) - min) / step) * step + min;
  return Number(snapped.toFixed(4));
};

/** Set a control the way a hand on the slider would (the console listens to 'input'). */
export function setControl(input, value) {
  const next = snap(input, value);
  if (Number(input.value) === next) return;
  input.value = String(next);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Stepper size: 1° for angles, 1% of the path for advance, 0.02 for slides. */
export const stepOf = unit => (unit === '%' ? 0.01 : unit === '°' ? 1 : 0.02);

/** Press and hold repeats the step (like a knob turned slowly). */
export function holdRepeat(button, action) {
  let timer = 0, repeat = 0;
  const stop = () => { clearTimeout(timer); clearInterval(repeat); };
  button.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    action(e.shiftKey);
    timer = setTimeout(() => { repeat = setInterval(() => action(e.shiftKey), 70); }, 320);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(type => button.addEventListener(type, stop));
  button.addEventListener('click', e => { if (e.detail === 0) action(e.shiftKey); });
}

function dragOn(svg, onPoint) {
  svg.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    svg.setPointerCapture(e.pointerId);
    onPoint(e);
    const move = ev => onPoint(ev);
    const up = () => { svg.removeEventListener('pointermove', move); svg.removeEventListener('pointerup', up); svg.removeEventListener('pointercancel', up); };
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
    e.preventDefault();
  });
}

function createPad(x, y) {
  const svg = svgEl('svg', { viewBox: `0 0 ${PAD} ${PAD}`, class: 'echo-pad', 'aria-hidden': 'true' });
  const m = 10, size = PAD - 2 * m, mid = PAD / 2;
  svg.append(
    svgEl('rect', { x: m, y: m, width: size, height: size, rx: 10, class: 'echo-pad-field' }),
    svgEl('line', { x1: mid, y1: m, x2: mid, y2: PAD - m, class: 'echo-pad-axis' }),
    svgEl('line', { x1: m, y1: mid, x2: PAD - m, y2: mid, class: 'echo-pad-axis' })
  );
  const ghost = svgEl('circle', { r: 7, class: 'echo-pad-preset' });
  const dot = svgEl('circle', { r: 8, class: 'echo-pad-dot' });
  svg.append(ghost, dot);
  const toPoint = (vx, vy) => {
    const rx = range(x.input), ry = range(y.input);
    return [m + ((vx - rx.min) / (rx.max - rx.min)) * size, m + (1 - (vy - ry.min) / (ry.max - ry.min)) * size];
  };
  dragOn(svg, e => {
    const box = svg.getBoundingClientRect();
    const px = clamp((e.clientX - box.left) / box.width * PAD, m, PAD - m), py = clamp((e.clientY - box.top) / box.height * PAD, m, PAD - m);
    const rx = range(x.input), ry = range(y.input);
    setControl(x.input, rx.min + ((px - m) / size) * (rx.max - rx.min));
    setControl(y.input, ry.min + (1 - (py - m) / size) * (ry.max - ry.min));
  });
  return {
    element: svg,
    sync(preset) {
      const [cx, cy] = toPoint(Number(x.input.value), Number(y.input.value));
      dot.setAttribute('cx', cx); dot.setAttribute('cy', cy);
      const has = preset && Number.isFinite(preset[x.key]) && Number.isFinite(preset[y.key]);
      ghost.style.display = has ? '' : 'none';
      if (has) { const [gx, gy] = toPoint(preset[x.key], preset[y.key]); ghost.setAttribute('cx', gx); ghost.setAttribute('cy', gy); }
    }
  };
}

function createDial(control, { half = false, ticks = [] } = {}) {
  const svg = svgEl('svg', { viewBox: `0 0 ${DIAL} ${half ? DIAL * 0.62 : DIAL}`, class: `echo-dial${half ? ' is-half' : ''}`, 'aria-hidden': 'true' });
  const c = DIAL / 2, cy = half ? DIAL * 0.55 : c, r = DIAL / 2 - 14;
  // Angles are drawn clockwise from 12 o'clock; the half dial (multiplane) runs 0° at 9 o'clock to 180° at 3 o'clock.
  const origin = half ? -90 : 0;
  const polar = (deg, radius) => {
    const a = ((deg + origin) - 90) * Math.PI / 180;
    return [c + radius * Math.cos(a), cy + radius * Math.sin(a)];
  };
  const { min, max } = range(control.input);
  const [ax, ay] = polar(min, r), [bx, by] = polar(max, r);
  const sweep = max - min;
  svg.append(svgEl('path', { d: `M ${ax} ${ay} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${bx} ${by}`, class: 'echo-dial-track' }));
  for (const t of ticks) {
    const [x1, y1] = polar(t, r - 5), [x2, y2] = polar(t, r + 5), [tx, ty] = polar(t, r - 22);
    svg.append(svgEl('line', { x1, y1, x2, y2, class: 'echo-dial-tick' }));
    const label = svgEl('text', { x: tx, y: ty + 3, class: 'echo-dial-label' }); label.textContent = `${t}°`; svg.append(label);
  }
  const ghost = svgEl('line', { x1: c, y1: cy, class: 'echo-dial-preset' });
  const needle = svgEl('line', { x1: c, y1: cy, class: 'echo-dial-needle' });
  svg.append(ghost, needle, svgEl('circle', { cx: c, cy, r: 5, class: 'echo-dial-hub' }));
  dragOn(svg, e => {
    const box = svg.getBoundingClientRect();
    const px = (e.clientX - box.left) / box.width * DIAL, py = (e.clientY - box.top) / box.height * (half ? DIAL * 0.62 : DIAL);
    let deg = Math.atan2(py - cy, px - c) * 180 / Math.PI + 90 - origin;
    // Pick the turn (±360°) that lies in the range, nearest to the current value.
    const now = Number(control.input.value);
    const options = [deg - 360, deg, deg + 360].filter(v => v >= min - 10 && v <= max + 10);
    deg = options.length ? options.reduce((a, b) => (Math.abs(b - now) < Math.abs(a - now) ? b : a)) : now;
    setControl(control.input, deg);
  });
  const point = (line, deg) => { const [x2, y2] = polar(deg, r - 6); line.setAttribute('x2', x2); line.setAttribute('y2', y2); };
  return {
    element: svg,
    sync(preset) {
      point(needle, Number(control.input.value));
      const has = preset && Number.isFinite(preset[control.key]);
      ghost.style.display = has ? '' : 'none';
      if (has) point(ghost, preset[control.key]);
    }
  };
}

/**
 * Visual widgets for one modality, built on the console's range inputs.
 * @param {string} kind 'tte' | 'tee' | 'ice'
 * @param {Map<string, { input: HTMLInputElement }>} controls
 */
export function createProbeWidgets(kind, controls) {
  const box = document.createElement('div');
  box.className = 'echo-probe-widgets';
  const widgets = [];
  for (const spec of PROBE_LAYOUT[kind] || []) {
    const figure = document.createElement('figure');
    figure.className = 'echo-probe-widget';
    const caption = document.createElement('figcaption');
    let widget;
    if (spec.kind === 'pad') {
      const x = controls.get(spec.x), y = controls.get(spec.y);
      if (!x || !y) continue;
      widget = createPad({ key: spec.x, input: x.input }, { key: spec.y, input: y.input });
      figure.dataset.probePad = `${spec.y}-${spec.x}`;
      widget.labels = [spec.y, spec.x];
    } else {
      const control = controls.get(spec.key);
      if (!control) continue;
      widget = createDial({ key: spec.key, input: control.input }, spec);
      figure.dataset.probeDial = spec.key;
      widget.labels = [spec.key];
    }
    widget.caption = caption;
    figure.append(widget.element, caption);
    box.append(figure);
    widgets.push(widget);
  }
  return {
    element: box,
    /** Redraw from the inputs; preset is the view's pose (null hides the marks). */
    sync(preset) { widgets.forEach(w => w.sync(preset)); },
    label(names) { widgets.forEach(w => { w.caption.textContent = w.labels.map(k => names[k] || k).join(' × '); }); }
  };
}

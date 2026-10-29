// Angiography card of the coronary physiology lab: markup, controls and pointer handling for
// the fluoroscopic view (coronary-physiology-fluoro.js). Dragging or tapping along the measured
// vessel moves the wire sensor; the panel owns the state and redraws the readouts.
import { FLUORO_PROJECTIONS, renderCoronaryFluoro, nearestPathMm } from './coronary-physiology-fluoro.js';

const VIEWS = [
  ['cine', { tr: 'Cine (kontrast)', en: 'Cine (contrast)' }],
  ['fluoro', { tr: 'Skopi (tel)', en: 'Fluoro (wire)' }],
  ['map', { tr: 'Pd/Pa haritası', en: 'Pd/Pa map' }]
];

const angleText = ({ alpha, beta }) => `${alpha === 0 ? 'AP' : `${alpha > 0 ? 'LAO' : 'RAO'} ${Math.abs(alpha)}`}${beta === 0 ? '' : ` ${beta > 0 ? 'CRA' : 'CAU'} ${Math.abs(beta)}`}`;

export function projectionsFor(vessel) {
  return FLUORO_PROJECTIONS[vessel] || FLUORO_PROJECTIONS.LAD;
}

/** Card markup; `state.fluoroView` and `state.fluoroProj` (index into the vessel's projections). */
export function fluoroCardHtml(state, lang) {
  const isTr = lang !== 'en';
  const projections = projectionsFor(state.vessel);
  const current = Math.min(state.fluoroProj || 0, projections.length - 1);
  return `
    <section class="phys-fluoro-card" aria-label="${isTr ? 'Anjiyografik görünüm: basınç teli ve sensör' : 'Angiographic view: pressure wire and sensor'}">
      <div class="phys-fluoro-head">
        <h3>${isTr ? 'Anjiyografik Görünüm' : 'Angiographic View'} · ${state.vessel}</h3>
        <div class="phys-fluoro-views" role="group" aria-label="${isTr ? 'Görüntü türü' : 'Image type'}">
          ${VIEWS.map(([id, label]) => `<button type="button" class="phys-chip ${state.fluoroView === id ? 'active' : ''}" data-phys-fluoro-view="${id}" aria-pressed="${state.fluoroView === id}">${isTr ? label.tr : label.en}</button>`).join('')}
        </div>
      </div>
      <div class="phys-fluoro-stage">
        <canvas class="phys-fluoro-canvas" data-phys-fluoro-canvas tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="80"
          aria-valuenow="${Math.round(state.sensorMm)}" aria-label="${isTr ? 'Sensör konumu (mm). Damar boyunca sürükleyin veya ok tuşlarını kullanın.' : 'Sensor position (mm). Drag along the vessel or use the arrow keys.'}"></canvas>
      </div>
      <div class="phys-fluoro-foot">
        <div class="phys-fluoro-proj" role="group" aria-label="${isTr ? 'C-kol projeksiyonu' : 'C-arm projection'}">
          ${projections.map((p, i) => `<button type="button" class="phys-chip ${i === current ? 'active' : ''}" data-phys-fluoro-proj="${i}" aria-pressed="${i === current}">${angleText(p)}</button>`).join('')}
        </div>
        <span class="phys-fluoro-tip">${isTr ? 'Sensörü damar boyunca sürükleyin; geri çekmede tel ve sensör birlikte gelir.' : 'Drag the sensor along the vessel; on pullback the wire and sensor come back together.'}</span>
      </div>
    </section>`;
}

/** Draws the card for the current state; returns the hit data of the last frame. */
export function drawFluoro(root, state, caseObj, lang) {
  const canvas = root.querySelector('[data-phys-fluoro-canvas]');
  if (!canvas) return null;
  const projections = projectionsFor(state.vessel);
  const proj = projections[Math.min(state.fluoroProj || 0, projections.length - 1)];
  const hit = renderCoronaryFluoro(canvas, { caseObj, state, lang, alpha: proj.alpha, beta: proj.beta, view: state.fluoroView });
  canvas.setAttribute('aria-valuenow', String(Math.round(state.sensorMm)));
  canvas.setAttribute('aria-valuetext', `${Math.round(state.sensorMm)} mm, Pd/Pa ${hit.sensor?.ratio?.toFixed(2) ?? ''}`);
  canvas._physHit = hit;
  return hit;
}

/**
 * Wires the card. `onSensor(mm)` moves the sensor (panel redraws readouts); `onChange()`
 * re-renders the workspace after a view or projection change.
 */
export function bindFluoro(root, state, { onSensor, onChange }) {
  root.querySelectorAll('[data-phys-fluoro-view]').forEach(btn => btn.addEventListener('click', () => {
    state.fluoroView = btn.dataset.physFluoroView;
    onChange();
  }));
  root.querySelectorAll('[data-phys-fluoro-proj]').forEach(btn => btn.addEventListener('click', () => {
    state.fluoroProj = Number(btn.dataset.physFluoroProj) || 0;
    onChange();
  }));
  const canvas = root.querySelector('[data-phys-fluoro-canvas]');
  if (!canvas) return;
  let dragging = false;
  const moveTo = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mm = nearestPathMm(canvas._physHit?.path || [], e.clientX - rect.left, e.clientY - rect.top, dragging ? 60 : 22);
    if (mm !== null && !state.pullingBack) onSensor(mm);
  };
  canvas.addEventListener('pointerdown', e => {
    const rect = canvas.getBoundingClientRect();
    if (nearestPathMm(canvas._physHit?.path || [], e.clientX - rect.left, e.clientY - rect.top) === null) return;
    dragging = true;
    canvas.setPointerCapture?.(e.pointerId);
    moveTo(e);
  });
  canvas.addEventListener('pointermove', e => { if (dragging) moveTo(e); });
  const stop = (e) => { dragging = false; canvas.releasePointerCapture?.(e.pointerId); };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  canvas.addEventListener('keydown', e => {
    const step = { ArrowRight: 2, ArrowUp: 2, ArrowLeft: -2, ArrowDown: -2 }[e.key];
    if (!step || state.pullingBack) return;
    e.preventDefault();
    onSensor(Math.min(80, Math.max(0, Math.round(state.sensorMm) + step)));
  });
}

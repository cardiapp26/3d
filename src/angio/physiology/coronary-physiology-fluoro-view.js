// Angiography card of the coronary physiology lab: markup, controls and pointer handling for
// the fluoroscopic view (coronary-physiology-fluoro.js). Dragging or tapping along the measured
// vessel moves the wire sensor; the panel owns the state and redraws the readouts.
import { FLUORO_PROJECTIONS, nearestPathMm } from './coronary-physiology-fluoro.js';

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
        <h3>${isTr ? 'Koroner atlas · Anjiyografi' : 'Coronary atlas · Angiography'} · ${state.vessel}</h3>

      </div>
      <div class="phys-fluoro-head">
        <div class="phys-fluoro-proj" role="group" aria-label="${isTr ? 'C-kol projeksiyonu' : 'C-arm projection'}">
          ${projections.map((p, i) => `<button type="button" class="phys-chip ${i === current ? 'active' : ''}" data-phys-fluoro-proj="${i}" aria-pressed="${i === current}">${angleText(p)}</button>`).join('')}
        </div>
      </div>
      <div class="phys-fluoro-head">
        <div class="phys-fluoro-views" role="group" aria-label="${isTr ? 'Görüntü türü' : 'Image type'}">
          ${VIEWS.map(([id, label]) => `<button type="button" class="phys-chip ${state.fluoroView === id ? 'active' : ''}" data-phys-fluoro-view="${id}" aria-pressed="${state.fluoroView === id}">${isTr ? label.tr : label.en}</button>`).join('')}
        </div>
      </div>
      <div class="phys-atlas-stage">
        <canvas class="phys-fluoro-canvas" data-phys-atlas-canvas data-phys-fluoro-canvas tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="80"
          aria-valuenow="${Math.round(state.sensorMm)}" aria-label="${isTr ? 'Sensör konumu (mm). Damar boyunca sürükleyin veya ok tuşlarını kullanın.' : 'Sensor position (mm). Drag along the vessel or use the arrow keys.'}"></canvas>
        <div class="phys-atlas-tools">
          <button type="button" class="phys-chip" data-phys-atlas-anatomy aria-pressed="${Boolean(state.atlasAnatomy)}">${isTr ? (state.atlasAnatomy ? 'Floroskopi' : '3B anatomi') : (state.atlasAnatomy ? 'Fluoroscopy' : '3D anatomy')}</button>
          <button type="button" class="phys-chip" data-phys-contrast>${isTr ? 'Kontrast ver' : 'Inject contrast'}</button>
          <span>${isTr ? 'Kaydır: yakınlaştır · Sarı halka: sensör' : 'Scroll to zoom · Yellow ring: sensor'}</span>
        </div>
        <p class="phys-fluoro-tip">${isTr ? 'Anjiyografiyle aynı 3B damar atlası. Darlık, cihazlar, kontrast geçişi ve Pd/Pa eğitim simülasyonudur; hasta kaydı değildir. mm: atlas damar yolu boyunca konum.' : 'Same 3D vascular atlas as angiography. Lesions, devices, contrast transit and Pd/Pa are educational simulations, not a patient recording. mm: position along the atlas vessel path.'}</p>
      </div>
      <div class="phys-fluoro-foot">

        <span class="phys-fluoro-tip">${isTr ? 'Sensörü damar boyunca sürükleyin; geri çekmede tel ve sensör birlikte gelir.' : 'Drag the sensor along the vessel; on pullback the wire and sensor come back together.'}</span>
      </div>
    </section>`;
}

/** Draws the card for the current state; returns the hit data of the last frame. */
export function drawFluoro(root, state, caseObj, lang, atlas = null) {
  const canvas = root.querySelector('[data-phys-fluoro-canvas]');
  if (!canvas) return null;
  const projections = projectionsFor(state.vessel);
  const proj = projections[Math.min(state.fluoroProj || 0, projections.length - 1)];
  let hit = { path: [], lesions: [], sensor: null };
  if (atlas) hit = atlas.draw(canvas, { state, caseObj, lang, alpha: proj.alpha, beta: proj.beta });
  else {
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#d9dcdd'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#25303b'; ctx.font = '14px system-ui';
      ctx.fillText(lang === 'tr' ? 'Atlas açılamadı. WebGL desteğini kontrol edin.' : 'Atlas unavailable. Check WebGL support.', 15, 60);
  }
  canvas.setAttribute('aria-valuenow', String(Math.round(state.sensorMm)));
  canvas.setAttribute('aria-valuetext', `${Math.round(state.sensorMm)} mm, Pd/Pa ${hit.sensor?.ratio?.toFixed(2) ?? ''}`);
  canvas._physHit = hit;
  return hit;
}

/**
 * Wires the card. `onSensor(mm)` moves the sensor (panel redraws readouts); `onChange()`
 * re-renders the workspace after a view or projection change.
 */
export function bindFluoro(root, state, { onSensor, onChange, atlas, onAtlasZoom }) {
  root.querySelector('[data-phys-contrast]')?.addEventListener('click', () => {
    state.contrastProgress = 0; state.fluoroView = 'cine'; state.atlasAnatomy = false; onChange();
  });
  root.querySelector('[data-phys-atlas-anatomy]')?.addEventListener('click', () => {
    state.atlasAnatomy = !state.atlasAnatomy; onChange();
  });
  root.querySelector('[data-phys-atlas-canvas]')?.addEventListener('wheel', event => {
    if (!atlas) return;
    event.preventDefault(); atlas.zoom(event.deltaY); onAtlasZoom?.();
  }, { passive: false });
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

// Shared playback for schematic mechanisms; timings are illustrative, not measured.
export function addHeartFailureMotion(root, lang, kind, strength = 1) {
  const en = lang === 'en';
  const state = root._motionState ||= { paused: matchMedia('(prefers-reduced-motion: reduce)').matches, speed: 1 };
  const bar = document.createElement('div');
  bar.className = 'preset-pill-group';
  bar.innerHTML = `<strong>${en ? 'Live mechanisms · schematic' : 'Canlı mekanizmalar · şematik'}</strong><button type="button" data-motion-toggle class="preset-pill"></button><label>${en ? 'Speed' : 'Hız'} <select data-motion-speed><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label>`;
  root.prepend(bar);
  const animations = [];
  function animate(selector, frames, duration) {
    root.querySelectorAll(selector).forEach(el => {
      el.style.transformBox = 'fill-box'; el.style.transformOrigin = 'center';
      animations.push(el.animate(frames, { duration, iterations: Infinity, easing: 'ease-in-out' }));
    });
  }
  if (kind === 'heart') {
    animate('.geom-svg circle, .geom-svg ellipse', [{ transform: 'scale(1)' }, { transform: `scale(${1 - .12 * strength})` }, { transform: 'scale(1)' }], 1000);
    animate('.cycle-svg path[marker-end]', [{ strokeDashoffset: 30 }, { strokeDashoffset: 0 }], 1500);
    root.querySelectorAll('.cycle-svg path[marker-end]').forEach(e => e.style.strokeDasharray = '5 4');
  } else if (kind === 'pericardium') {
    animate('.septal-shift-svg circle', [{ transform: 'scale(1)' }, { transform: 'scale(.9)' }, { transform: 'scale(1)' }], 1000);
    animate('.bp-svg path, .jvp-svg path, .dip-svg path', [{ opacity: .35 }, { opacity: 1 }, { opacity: .35 }], 1500);
  } else if (kind === 'myocardium') {
    animate('.ckm-svg circle', [{ transform: 'translateY(0)' }, { transform: 'translateY(-8px)' }, { transform: 'translateY(0)' }], 2400);
    animate('.ckm-svg path[stroke-width="12"]', [{ opacity: .4 }, { opacity: .9 }, { opacity: .4 }], 1100);
  } else {
    const box = document.createElement('div');
    box.innerHTML = `<svg viewBox="0 0 540 90" aria-hidden="true" style="width:100%;max-height:110px"><path d="M30 45 H510" stroke="#fee2e2" stroke-width="28" stroke-linecap="round"/>${Array.from({length:8},(_,i)=>`<circle class="hf-flow" cx="${40+i*60}" cy="45" r="7" fill="#dc2626"/>`).join('')}<text x="270" y="83" text-anchor="middle" font-size="13">${en ? 'Schematic systemic flow · CI' : 'Şematik sistemik akım · CI'} ${strength.toFixed(2)} L/min/m²</text></svg>`;
    bar.after(box);
    animate('.hf-flow', [{ transform:'translateX(-22px)' }, { transform:'translateX(22px)' }], 2600 / strength);
  }
  function apply() {
    animations.forEach(a => { a.playbackRate = state.speed; state.paused ? a.pause() : a.play(); });
    bar.querySelector('button').textContent = state.paused ? (en ? 'Play' : 'Oynat') : (en ? 'Pause' : 'Duraklat');
    bar.querySelector('button').setAttribute('aria-pressed', String(!state.paused));
    bar.querySelector('select').value = String(state.speed);
  }
  bar.querySelector('button').onclick = () => { state.paused = !state.paused; apply(); };
  bar.querySelector('select').onchange = e => { state.speed = Number(e.target.value); apply(); };
  apply();
}

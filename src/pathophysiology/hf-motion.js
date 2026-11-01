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
  // Keep the moving mechanism above the fold, at readable size.
  const scene = document.createElement('div');
  scene.className = 'hf-live-scene';
  scene.style.cssText = 'width:100%;padding:12px;border:1px solid #c7ded7;border-radius:16px;background:#f1f8f5;box-sizing:border-box';
  const descriptions = {
    heart: en ? 'Ventricular filling → contraction → forward flow' : 'Ventrikül doluşu → kasılma → ileri akım',
    pericardium: en ? 'Filling within the pericardial envelope' : 'Perikard zarfı içinde ventrikül doluşu',
    myocardium: en ? 'Myocardial contraction and circulating particles' : 'Miyokard kasılması ve dolaşan parçacıklar',
    flow: en ? 'Cardiac index changes the flow speed' : 'Kardiyak indeks akım hızını değiştirir'
  };
  scene.innerHTML = `<svg viewBox="0 0 720 240" role="img" aria-label="${descriptions[kind]}" style="display:block;width:100%;max-height:300px">
    <path d="M285 120 C180 20 30 20 30 120 S180 220 285 120 M435 120 C540 20 690 20 690 120 S540 220 435 120" fill="none" stroke="#d7e7e4" stroke-width="24"/>
    <path d="M285 120 C180 20 30 20 30 120 S180 220 285 120" fill="none" stroke="#60a5fa" stroke-width="3"/>
    <path d="M435 120 C540 20 690 20 690 120 S540 220 435 120" fill="none" stroke="#f87171" stroke-width="3"/>
    ${kind === 'pericardium' ? '<ellipse cx="360" cy="120" rx="85" ry="99" fill="#dbeafe" stroke="#475569" stroke-width="7"/>' : ''}
    <g class="hf-live-ventricle"><path d="M360 65 C290 5 250 95 300 155 L360 205 L420 155 C470 95 430 5 360 65Z" fill="#fee2e2" stroke="#be123c" stroke-width="14"/><path d="M360 82 V173" stroke="#be123c" stroke-width="9"/></g>
    <text x="360" y="125" text-anchor="middle" fill="#881337" font-size="18" font-weight="700">${en ? 'HEART' : 'KALP'}</text>
    <text x="115" y="125" text-anchor="middle" fill="#1e40af" font-size="17">${en ? 'Filling' : 'Doluş'}</text>
    <text x="600" y="125" text-anchor="middle" fill="#991b1b" font-size="17">${en ? 'Forward flow' : 'İleri akım'}</text>
    ${Array.from({length:12}, (_,i) => `<circle class="hf-live-particle" data-flow-index="${i}" r="7" fill="${i<6 ? '#2563eb' : '#dc2626'}"/>`).join('')}
    </svg><p style="margin:4px 0;text-align:center;font-size:13px">${descriptions[kind]} · ${en ? 'Schematic motion' : 'Şematik hareket'}</p>`;
  bar.after(scene);
  animate('.hf-live-ventricle', [{ transform:'scale(1)' }, { transform:`scale(${kind === 'heart' ? 1 - .22 * strength : .82})` }, { transform:'scale(1)' }], 1100);
  scene.querySelectorAll('.hf-live-particle').forEach((particle, i) => {
    const right = i >= 6;
    const path = right ? 'M435 120 C540 20 690 20 690 120 S540 220 435 120' : 'M285 120 C180 20 30 20 30 120 S180 220 285 120';
    particle.style.offsetPath = `path('${path}')`;
    const duration = kind === 'flow' ? 7000 / strength : 4200;
    animations.push(particle.animate([{ offsetDistance:'0%' }, { offsetDistance:'100%' }], {duration, delay:-(i%6)*duration/6, iterations:Infinity}));
  });
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

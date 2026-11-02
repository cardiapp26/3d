// Adult congenital shunts: ASD, VSD, PDA, Qp/Qs and Eisenmenger reversal with live blood flow animation.
// Source: Cepas-Guillen et al. (Nat Rev Cardiol 2025). Didactic model, schematic values.

const DEFECTS = {
  asd: {
    name: { tr: 'Atriyal Septal Defekt (ASD)', en: 'Atrial Septal Defect (ASD)' },
    load: { tr: 'Sağ atriyum + sağ ventrikül hacim yükü', en: 'Right atrial + right ventricular volume load' },
    body: {
      tr: 'Şant diyastolde, iki ventrikülün dolum direnci farkıyla belirlenir: sağ ventrikül daha kompliyan olduğu için kan sol atriyumdan sağa geçer. Sağ boşluklar ve pulmoner arter genişler; S2 sabit geniş çiftleşir. Sekundum ASD, uygun rim ve PVR uygunsa transkateter kapatılır.',
      en: 'Shunting occurs in diastole and depends on the filling resistance of the ventricles: the more compliant RV draws blood from left to right atrium. Right chambers and the pulmonary artery dilate; S2 is widely and fixed split. Secundum ASD with adequate rims and acceptable PVR is closed by catheter.'
    }
  },
  vsd: {
    name: { tr: 'Ventriküler Septal Defekt (VSD)', en: 'Ventricular Septal Defect (VSD)' },
    load: { tr: 'Sol atriyum + sol ventrikül hacim yükü, pulmoner basınç yükü', en: 'LA + LV volume load, pulmonary pressure load' },
    body: {
      tr: 'Şant sistolde sol ventrikülden sağ ventriküle ve doğrudan pulmoner artere gider. Fazla akım akciğerlerden sol atriyuma ve sol ventriküle döner; bu nedenle sol boşluklar genişler. Büyük VSD pulmoner arteri sistemik basınca maruz bırakır ve en hızlı Eisenmenger gelişiminin nedenidir.',
      en: 'Flow crosses in systole from LV to RV and straight into the pulmonary artery. The excess returns through the lungs to the LA and LV, which therefore dilate. A large VSD exposes the pulmonary artery to systemic pressure and is the fastest route to Eisenmenger physiology.'
    }
  },
  pda: {
    name: { tr: 'Patent Duktus Arteriyozus (PDA)', en: 'Patent Ductus Arteriosus (PDA)' },
    load: { tr: 'Sol atriyum + sol ventrikül hacim yükü', en: 'LA + LV volume load' },
    body: {
      tr: 'Aort ile pulmoner arter arasında sistol ve diyastol boyunca akım olur (sürekli makine üfürümü). Diyastolik kaçış geniş nabız basıncı yapar. Eisenmenger gelişince akım tersine döner ve siyanoz yalnız alt ekstremitede görülür (diferansiyel siyanoz).',
      en: 'Flow runs from aorta to pulmonary artery in systole and diastole (continuous machinery murmur). Diastolic run-off widens pulse pressure. After Eisenmenger reversal, cyanosis affects only the lower body (differential cyanosis).'
    }
  }
};

export function createAchdShuntsLab(opts = {}) {
  const mount = opts.mount || opts.container;
  let lang = opts.lang === 'en' ? 'en' : 'tr';
  let defect = 'vsd';
  let size = 60;   // % of maximal defect size
  let pvr = 2.5;   // Wood units

  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let paused = Boolean(reducedMotion);
  let speed = 1;
  let cyclePhase = 0;
  let rafId = null;
  let lastTs = 0;

  const particles = Array.from({ length: 26 }, (_, i) => ({
    id: i,
    route: i < 8 ? 'rightHeart' : i < 16 ? 'leftHeart' : 'shunt',
    progress: (i / 26) % 1,
    lane: ((i * 37) % 100) / 100 - 0.5
  }));

  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-achd-lab';
  mount?.append(root);
  const t = o => (lang === 'en' ? o.en : o.tr);

  function model() {
    const svr = 18;
    const s = size / 100;
    const gradient = Math.max(-1, (svr - pvr) / svr);       // >0 left-to-right
    const maxShunt = defect === 'asd' ? 2.2 : defect === 'vsd' ? 2.6 : 2.0;
    let qpqs = 1 + maxShunt * s * Math.max(0, gradient);
    let rightToLeft = 0;
    if (gradient < 0.15) {
      rightToLeft = Math.min(0.6, (0.15 - gradient) * s * 1.6);
      qpqs = Math.max(0.55, 1 - rightToLeft + Math.max(0, gradient) * s);
    }
    const sat = Math.round(98 - rightToLeft * 45);
    const eisenmenger = rightToLeft > 0.05;
    const closable = pvr < 3 || (pvr < 5 && qpqs >= 1.5);
    return { qpqs, sat, eisenmenger, closable, direction: eisenmenger ? 'R→L' : qpqs > 1.05 ? 'L→R' : '-' };
  }

  function svg(m) {
    const red = '#dc2626', blue = '#2563eb', purple = '#7c3aed';
    const flowColor = m.eisenmenger ? purple : red;
    const w = Math.max(3, Math.min(16, (Math.abs(m.qpqs - 1) + (m.eisenmenger ? 0.4 : 0)) * 8));
    const dir = m.eisenmenger ? -1 : 1;
    const rvScale = defect === 'asd' ? 1 + (m.qpqs - 1) * 0.25 : 1 + (pvr - 2) * 0.03;
    const lvScale = defect !== 'asd' ? 1 + (m.qpqs - 1) * 0.2 : 1;
    const arrow = (x1, y1, x2, y2) => {
      const [a, b, c, d] = dir > 0 ? [x1, y1, x2, y2] : [x2, y2, x1, y1];
      return `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${flowColor}" stroke-width="${w}" stroke-linecap="round" marker-end="url(#achdArrow)"/>`;
    };
    let shunt = '';
    if (defect === 'asd') shunt = `<rect x="312" y="110" width="16" height="40" fill="#fff"/>${arrow(360, 130, 280, 130)}`;
    if (defect === 'vsd') shunt = `<rect x="312" y="230" width="16" height="40" fill="#fff"/>${arrow(360, 250, 280, 250)}`;
    if (defect === 'pda') shunt = `<path d="M 420 44 C 380 12, 270 12, 240 44" fill="none" stroke="#94a3b8" stroke-width="18"/>${arrow(410, 32, 250, 32)}`;

    return `
      <defs><marker id="achdArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${flowColor}"/></marker></defs>
      <text x="20" y="22" font-size="12" font-weight="800" fill="#0f172a">${lang === 'en' ? 'Four-chamber shunt view (patient right on left)' : 'Dört boşluk şant görünümü (hastanın sağı solda)'}</text>

      <!-- Pulmonary Artery (PA) & Aorta (Ao) Great Vessel Trunks -->
      <path d="M 235 72 C 235 32, 200 26, 155 28" fill="none" stroke="#dbeafe" stroke-width="22" stroke-linecap="round"/>
      <path d="M 235 72 C 235 32, 200 26, 155 28" fill="none" stroke="${blue}" stroke-width="3" stroke-linecap="round"/>
      <text x="155" y="48" font-size="10.5" font-weight="800" fill="#1e3a8a">PA</text>

      <path d="M 415 72 C 415 32, 450 26, 495 28" fill="none" stroke="#fee2e2" stroke-width="22" stroke-linecap="round"/>
      <path d="M 415 72 C 415 32, 450 26, 495 28" fill="none" stroke="${m.eisenmenger ? purple : red}" stroke-width="3" stroke-linecap="round"/>
      <text x="488" y="48" font-size="10.5" font-weight="800" fill="#7f1d1d">${lang === 'en' ? 'Aorta' : 'Aort'}</text>

      <g data-achd-chambers>
        <rect data-achd-ra x="120" y="70" width="${190 * Math.min(1.35, rvScale)}" height="110" rx="30" transform="translate(${-190 * (Math.min(1.35, rvScale) - 1)},0)" fill="#dbeafe" stroke="${blue}" stroke-width="5"/>
        <text x="200" y="130" text-anchor="middle" font-size="14" font-weight="800" fill="#1e3a8a">RA</text>
        <rect data-achd-la x="330" y="70" width="190" height="110" rx="30" fill="#fee2e2" stroke="${red}" stroke-width="5"/>
        <text x="425" y="130" text-anchor="middle" font-size="14" font-weight="800" fill="#7f1d1d">LA</text>
        <path data-achd-rv d="M 310 190 L ${310 - 190 * Math.min(1.35, rvScale)} 190 C ${300 - 190 * rvScale} 290, 250 340, 310 340 Z" fill="#dbeafe" stroke="${blue}" stroke-width="${5 + (pvr > 6 ? 5 : 0)}"/>
        <text x="230" y="270" text-anchor="middle" font-size="14" font-weight="800" fill="#1e3a8a">RV</text>
        <path data-achd-lv d="M 330 190 L ${330 + 190 * Math.min(1.35, lvScale)} 190 C ${340 + 190 * lvScale} 290, 390 340, 330 340 Z" fill="#fee2e2" stroke="${m.eisenmenger ? purple : red}" stroke-width="7"/>
        <text x="420" y="270" text-anchor="middle" font-size="14" font-weight="800" fill="#7f1d1d">LV</text>
      </g>

      <rect x="312" y="60" width="16" height="290" fill="#94a3b8"/>
      ${shunt}

      <!-- Live Moving Circulation & Shunt Particles -->
      <g data-achd-particles>
        ${particles.map(p => `
          <circle class="achd-particle hf-live-particle" data-achd-p="${p.id}" cx="320" cy="180" r="${p.route === 'shunt' ? 5.6 : 4.8}"
            fill="${p.route === 'rightHeart' ? blue : (m.eisenmenger ? purple : red)}" stroke="#ffffff" stroke-width="1.3"/>
        `).join('')}
      </g>

      <g transform="translate(540,70)" font-size="11" font-weight="700">
        <text x="0" y="0" fill="#0f172a">Qp/Qs</text>
        <rect x="0" y="10" width="20" height="200" fill="#e2e8f0"/>
        <rect x="0" y="${210 - Math.min(200, m.qpqs * 60)}" width="20" height="${Math.min(200, m.qpqs * 60)}" fill="${m.qpqs >= 1.5 ? red : m.eisenmenger ? purple : '#10b981'}"/>
        <line x1="-4" y1="${210 - 90}" x2="26" y2="${210 - 90}" stroke="#0f172a" stroke-dasharray="3 2"/>
        <text x="30" y="${214 - 90}" font-size="9.5" fill="#0f172a">1.5</text>
        <text x="0" y="232" fill="#0f172a">${m.qpqs.toFixed(2)}</text>
      </g>
      <text x="20" y="360" font-size="11" font-weight="700" fill="${m.eisenmenger ? purple : '#0f172a'}">
        ${m.eisenmenger
          ? (lang === 'en' ? `Eisenmenger: right-to-left shunt, SpO2 ${m.sat}%` : `Eisenmenger: sağdan sola şant, SpO2 %${m.sat}`)
          : (lang === 'en' ? 'Left-to-right shunt: pulmonary overcirculation' : 'Soldan sağa şant: pulmoner aşırı dolaşım')}
      </text>`;
  }

  function updateAnimationFrame(dtSec) {
    if (!root.isConnected) return;
    const m = model();
    const s = size / 100;

    cyclePhase = (cyclePhase + dtSec * 42 * speed) % 100;
    const beat = Math.sin((cyclePhase / 100) * Math.PI * 2);

    // Subtle beating scale on chambers group
    const chambersGroup = root.querySelector('[data-achd-chambers]');
    if (chambersGroup) {
      chambersGroup.style.transformBox = 'fill-box';
      chambersGroup.style.transformOrigin = 'center';
      chambersGroup.setAttribute('transform', `scale(${(1 - 0.025 * beat).toFixed(3)})`);
    }

    const shuntSpeed = (0.45 + Math.abs(m.qpqs - 1) * 0.45 + s * 0.35) * speed;

    particles.forEach(p => {
      const node = root.querySelector(`[data-achd-p="${p.id}"]`);
      if (!node) return;

      if (p.route === 'rightHeart') {
        // RA (200, 110) -> RV (235, 270) -> PA (225, 45) -> Lungs (155, 28)
        p.progress = (p.progress + dtSec * 0.42 * Math.max(0.7, m.qpqs * 0.65) * speed) % 1;
        let x = 200, y = 120;
        if (p.progress < 0.4) {
          const u = p.progress / 0.4;
          x = 195 + u * 35 + p.lane * 18;
          y = 105 + u * 165;
        } else if (p.progress < 0.78) {
          const u = (p.progress - 0.4) / 0.38;
          x = 230 + u * 5 + p.lane * 12;
          y = 270 - u * 215;
        } else {
          const u = (p.progress - 0.78) / 0.22;
          x = 235 - u * 80;
          y = 55 - u * 26 + p.lane * 8;
        }
        node.setAttribute('cx', x.toFixed(1));
        node.setAttribute('cy', y.toFixed(1));
        node.setAttribute('fill', '#2563eb');
      } else if (p.route === 'leftHeart') {
        // LA (430, 110) -> LV (415, 270) -> Aorta (415, 45) -> Arch (495, 28)
        p.progress = (p.progress + dtSec * 0.44 * speed) % 1;
        let x = 425, y = 120;
        if (p.progress < 0.4) {
          const u = p.progress / 0.4;
          x = 430 - u * 15 + p.lane * 18;
          y = 105 + u * 165;
        } else if (p.progress < 0.78) {
          const u = (p.progress - 0.4) / 0.38;
          x = 415 + p.lane * 12;
          y = 270 - u * 215;
        } else {
          const u = (p.progress - 0.78) / 0.22;
          x = 415 + u * 80;
          y = 55 - u * 26 + p.lane * 8;
        }
        node.setAttribute('cx', x.toFixed(1));
        node.setAttribute('cy', y.toFixed(1));
        node.setAttribute('fill', m.eisenmenger ? '#7c3aed' : '#dc2626');
      } else {
        // Active Shunt Jet Stream across ASD, VSD, or PDA
        p.progress = (p.progress + dtSec * shuntSpeed) % 1;
        const u = m.eisenmenger ? (1 - p.progress) : p.progress;
        let x = 320, y = 180;

        if (defect === 'asd') {
          // LA (410, 130) -> ASD (320, 130) -> RA (210, 130) -> RV (230, 245)
          if (u < 0.65) {
            const k = u / 0.65;
            x = 415 - k * 205;
            y = 130 + p.lane * 14 + Math.sin(k * Math.PI * 2) * 4;
          } else {
            const k = (u - 0.65) / 0.35;
            x = 210 + k * 25 + p.lane * 14;
            y = 130 + k * 125;
          }
        } else if (defect === 'vsd') {
          // LV (415, 250) -> VSD (320, 250) -> RV (235, 250) -> PA (235, 65)
          if (u < 0.6) {
            const k = u / 0.6;
            x = 415 - k * 180;
            y = 250 + p.lane * 14 + Math.sin(k * Math.PI * 2) * 5;
          } else {
            const k = (u - 0.6) / 0.4;
            x = 235 + p.lane * 12;
            y = 250 - k * 185;
          }
        } else {
          // PDA: Aorta (418, 36) <-> PA (238, 36) -> Distal PA (165, 28)
          if (u < 0.72) {
            const k = u / 0.72;
            x = 418 - k * 180;
            y = 36 - Math.sin(k * Math.PI) * 14 + p.lane * 6;
          } else {
            const k = (u - 0.72) / 0.28;
            x = 238 - k * 75;
            y = 36 - k * 8 + p.lane * 8;
          }
        }

        node.setAttribute('cx', x.toFixed(1));
        node.setAttribute('cy', y.toFixed(1));
        node.setAttribute('fill', m.eisenmenger ? '#7c3aed' : '#ef4444');
      }
    });
  }

  function startLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    lastTs = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.06, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      if (!paused) {
        updateAnimationFrame(dt);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  function render() {
    const m = model();
    const d = DEFECTS[defect];
    root.innerHTML = `
      <div class="preset-pill-group pathophys-motion-bar" style="margin-bottom:10px">
        <span class="preset-label">${lang === 'en' ? 'Live Shunt & Circulation:' : 'Canlı Şant ve Dolaşım:'}</span>
        <button type="button" class="preset-pill ${!paused ? 'active' : ''}" data-motion-toggle aria-pressed="${!paused}">
          ${paused ? (lang === 'en' ? '▷ Play' : '▷ Oynat') : (lang === 'en' ? 'Ⅱ Pause' : 'Ⅱ Duraklat')}
        </button>
        <label class="motion-speed-label">
          ${lang === 'en' ? 'Speed' : 'Hız'}
          <select data-motion-speed>
            <option value="0.5" ${speed === 0.5 ? 'selected' : ''}>0.5×</option>
            <option value="1" ${speed === 1 ? 'selected' : ''}>1×</option>
            <option value="2" ${speed === 2 ? 'selected' : ''}>2×</option>
          </select>
        </label>
      </div>
      <div class="preset-pill-group" style="margin-bottom:12px">
        ${Object.keys(DEFECTS).map(k => `<button type="button" class="preset-pill ${k === defect ? 'active' : ''}" data-achd-defect="${k}">${t(DEFECTS[k].name)}</button>`).join('')}
        <button type="button" class="preset-pill" data-achd-preset="eisen">${lang === 'en' ? 'Progress to Eisenmenger' : 'Eisenmenger’e ilerlet'}</button>
      </div>
      <div class="pathophys-grid">
        <div class="pathophys-stage"><svg viewBox="0 0 640 370" class="pathophys-svg achd-svg" role="img" aria-label="${t(d.name)}">${svg(m)}</svg></div>
        <div class="pathophys-controls">
          <div class="pathophys-sliders">
            <label class="pathophys-slider-row">
              <span class="slider-label"><strong>${lang === 'en' ? 'Defect size' : 'Defekt boyutu'}</strong></span>
              <input type="range" data-achd-slider="size" min="5" max="100" step="5" value="${size}">
              <span class="slider-val">${size}%</span>
            </label>
            <label class="pathophys-slider-row">
              <span class="slider-label"><strong>${lang === 'en' ? 'Pulmonary vascular resistance' : 'Pulmoner vasküler direnç'}</strong> <small>(WU)</small></span>
              <input type="range" data-achd-slider="pvr" min="1" max="22" step="0.5" value="${pvr}">
              <span class="slider-val">${pvr.toFixed(1)} WU</span>
            </label>
          </div>
          <div class="metrics-card"><div class="metrics-grid">
            <div class="metric-item"><span class="metric-lbl">Qp/Qs</span><span class="metric-num">${m.qpqs.toFixed(2)}</span></div>
            <div class="metric-item"><span class="metric-lbl">${lang === 'en' ? 'Shunt direction' : 'Şant yönü'}</span><span class="metric-num">${m.direction}</span></div>
            <div class="metric-item"><span class="metric-lbl">SpO2</span><span class="metric-num" style="color:${m.sat < 92 ? '#7c3aed' : '#0f172a'}">${m.sat}%</span></div>
            <div class="metric-item"><span class="metric-lbl">${lang === 'en' ? 'Closure' : 'Kapatma'}</span><span class="metric-num" style="font-size:14px;color:${m.closable ? '#16a34a' : '#dc2626'}">${m.closable ? (lang === 'en' ? 'Consider' : 'Düşünülebilir') : (lang === 'en' ? 'Contraindicated' : 'Kontrendike')}</span></div>
          </div></div>
          <div class="clinical-desc-box"><h4>${t(d.name)} · <small>${t(d.load)}</small></h4><p>${t(d.body)}</p></div>
          <div class="clinical-desc-box management-box"><h4>${lang === 'en' ? 'Closure logic (ESC 2020, Cepas-Guillen 2025)' : 'Kapatma mantığı (ESC 2020, Cepas-Guillén 2025)'}</h4>
            <p>${lang === 'en'
              ? 'Closure is reasonable for a significant left-to-right shunt (Qp/Qs ≥ 1.5 or chamber dilation) when PVR < 3 WU; with PVR 3-5 WU only if the net shunt remains left-to-right. PVR ≥ 5 WU with reversed shunt (Eisenmenger) contraindicates closure: the defect then acts as an RV relief valve.'
              : 'Belirgin soldan sağa şantta (Qp/Qs ≥ 1,5 veya boşluk genişlemesi) PVR < 3 WU ise kapatma uygundur; PVR 3-5 WU ise yalnız net şant soldan sağa sürdükçe düşünülür. PVR ≥ 5 WU ve ters şantta (Eisenmenger) kapatma kontrendikedir: defekt sağ ventrikül için emniyet valfi görevi görür.'}</p></div>
        </div>
      </div>`;

    const toggleBtn = root.querySelector('[data-motion-toggle]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        paused = !paused;
        toggleBtn.setAttribute('aria-pressed', String(!paused));
        toggleBtn.classList.toggle('active', !paused);
        toggleBtn.textContent = paused
          ? (lang === 'en' ? '▷ Play' : '▷ Oynat')
          : (lang === 'en' ? 'Ⅱ Pause' : 'Ⅱ Duraklat');
      });
    }

    const speedSel = root.querySelector('[data-motion-speed]');
    if (speedSel) {
      speedSel.addEventListener('change', (e) => {
        speed = Number(e.target.value) || 1;
      });
    }

    root.querySelectorAll('[data-achd-defect]').forEach(b => b.addEventListener('click', () => { defect = b.dataset.achdDefect; render(); }));
    root.querySelector('[data-achd-preset]').addEventListener('click', () => { size = 90; pvr = 19; render(); });
    root.querySelectorAll('[data-achd-slider]').forEach(i => i.addEventListener('input', () => {
      if (i.dataset.achdSlider === 'size') size = Number(i.value); else pvr = Number(i.value);
      render();
    }));

    updateAnimationFrame(0);
  }

  render();
  startLoop();

  return {
    updateLanguage(next) { lang = next === 'en' ? 'en' : 'tr'; render(); },
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      root.remove();
    }
  };
}

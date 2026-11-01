// Adult congenital shunts: ASD, VSD, PDA, Qp/Qs and Eisenmenger reversal.
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
    if (defect === 'pda') shunt = `<path d="M 420 40 C 380 10, 270 10, 240 40" fill="none" stroke="#94a3b8" stroke-width="18"/>${arrow(410, 30, 250, 30)}`;
    return `
      <defs><marker id="achdArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${flowColor}"/></marker></defs>
      <text x="20" y="22" font-size="12" font-weight="800" fill="#0f172a">${lang === 'en' ? 'Four-chamber shunt view (patient right on left)' : 'Dört boşluk şant görünümü (hastanın sağı solda)'}</text>
      <rect x="120" y="70" width="${190 * Math.min(1.35, rvScale)}" height="110" rx="30" transform="translate(${-190 * (Math.min(1.35, rvScale) - 1)},0)" fill="#dbeafe" stroke="${blue}" stroke-width="5"/>
      <text x="200" y="130" text-anchor="middle" font-size="14" font-weight="800" fill="#1e3a8a">RA</text>
      <rect x="330" y="70" width="190" height="110" rx="30" fill="#fee2e2" stroke="${red}" stroke-width="5"/>
      <text x="425" y="130" text-anchor="middle" font-size="14" font-weight="800" fill="#7f1d1d">LA</text>
      <path d="M 310 190 L ${310 - 190 * Math.min(1.35, rvScale)} 190 C ${300 - 190 * rvScale} 290, 250 340, 310 340 Z" fill="#dbeafe" stroke="${blue}" stroke-width="${5 + (pvr > 6 ? 5 : 0)}"/>
      <text x="230" y="270" text-anchor="middle" font-size="14" font-weight="800" fill="#1e3a8a">RV</text>
      <path d="M 330 190 L ${330 + 190 * Math.min(1.35, lvScale)} 190 C ${340 + 190 * lvScale} 290, 390 340, 330 340 Z" fill="#fee2e2" stroke="${red}" stroke-width="7"/>
      <text x="420" y="270" text-anchor="middle" font-size="14" font-weight="800" fill="#7f1d1d">LV</text>
      <rect x="312" y="60" width="16" height="290" fill="#94a3b8"/>
      ${shunt}
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

  function render() {
    const m = model();
    const d = DEFECTS[defect];
    root.innerHTML = `
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
    root.querySelectorAll('[data-achd-defect]').forEach(b => b.addEventListener('click', () => { defect = b.dataset.achdDefect; render(); }));
    root.querySelector('[data-achd-preset]').addEventListener('click', () => { size = 90; pvr = 19; render(); });
    root.querySelectorAll('[data-achd-slider]').forEach(i => i.addEventListener('input', () => {
      if (i.dataset.achdSlider === 'size') size = Number(i.value); else pvr = Number(i.value);
      render();
    }));
  }

  render();
  return {
    updateLanguage(next) { lang = next === 'en' ? 'en' : 'tr'; render(); },
    destroy() { root.remove(); }
  };
}

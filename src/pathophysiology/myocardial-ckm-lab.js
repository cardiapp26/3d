// Takotsubo syndrome, cardio-kidney-metabolic (SGLT2i) protection and cardiac lymphatics.
// Sources: Omerovic & Redfors (Nat Rev Cardiol 2026), Zelniker & Braunwald (Nat Rev Cardiol 2026),
// Brakenhielm (Nat Rev Cardiol 2026). Didactic, schematic values; not patient data.

const MODES = ['takotsubo', 'ckm', 'lymphatic'];

const TEXT = {
  modes: {
    takotsubo: { tr: 'Takotsubo (Katekolamin)', en: 'Takotsubo (Catecholamine)' },
    ckm: { tr: 'CKM ve SGLT2 İnhibitörü', en: 'CKM and SGLT2 Inhibitor' },
    lymphatic: { tr: 'Kardiyak Lenfatikler', en: 'Cardiac Lymphatics' }
  },
  takotsubo: {
    title: { tr: 'Takotsubo: β2-AR Gs → Gi anahtarı ve apikal balonlaşma', en: 'Takotsubo: β2-AR Gs → Gi switch and apical ballooning' },
    body: {
      tr: 'Ani duygusal/fiziksel stres suprafizyolojik epinefrin salgılatır. Apekste β-adrenerjik reseptör yoğunluğu en yüksektir; yüksek epinefrinde β2 reseptör Gs yerine Gi proteinine bağlanır (stimulus trafficking). Bu negatif inotropik ama hücre koruyucu geçiş apikal akinezi yapar; bazal segmentler hiperkinetiktir. Koroner arterler açıktır; mikrovasküler spazm eşlik edebilir. Bazal hiperkontraksiyon dinamik LVOT obstrüksiyonu oluşturabilir. Duvar hareketi günler-haftalar içinde düzelir (Omerovic ve Redfors 2026).',
      en: 'Sudden emotional or physical stress releases supraphysiological epinephrine. The apex has the highest β-adrenoceptor density; at high epinephrine the β2 receptor couples to Gi instead of Gs (stimulus trafficking). This negatively inotropic but cytoprotective switch produces apical akinesia with hyperkinetic basal segments. Coronaries are patent; microvascular spasm may coexist. Basal hypercontraction can cause dynamic LVOT obstruction. Wall motion recovers over days to weeks (Omerovic and Redfors 2026).'
    },
    slider: { tr: 'Katekolamin yükü', en: 'Catecholamine load' }
  },
  ckm: {
    title: { tr: 'SGLT2i: natriürez, enerji ve iyon dengesi', en: 'SGLT2i: natriuresis, energetics and ion balance' },
    body: {
      tr: 'SGLT2 inhibitörleri proksimal tübülde glukoz ve sodyum geri emilimini azaltır: glukozüri ve natriürez interstisyel sıvıyı plazmadan daha çok azaltır (dekonjesyon). Makula densaya ulaşan sodyum tübüloglomerüler geri bildirimi düzeltir, glomerüler hiperfiltrasyonu azaltır. Hafif ketozis miyokarda verimli yakıt sağlar; miyokardiyal NHE-1 ve geç sodyum akımı üzerinden hücre içi Na+/Ca2+ yükünün azaldığı öne sürülür. Etki diyabetten bağımsızdır (Zelniker ve Braunwald 2026).',
      en: 'SGLT2 inhibitors reduce proximal tubular glucose and sodium reabsorption: glycosuria and natriuresis shrink interstitial fluid more than plasma (decongestion). More sodium reaching the macula densa restores tubuloglomerular feedback and lowers glomerular hyperfiltration. Mild ketosis supplies an efficient myocardial fuel; reduced intracellular Na+/Ca2+ load via NHE-1 and late sodium current is proposed. Benefit is independent of diabetes (Zelniker and Braunwald 2026).'
    },
    slider: { tr: 'SGLT2i etkisi', en: 'SGLT2i effect' }
  },
  lymphatic: {
    title: { tr: 'Lenfatik drenaj, miyokard ödemi ve fibrozis', en: 'Lymphatic drainage, myocardial oedema and fibrosis' },
    body: {
      tr: 'Kardiyak lenfatikler epikarddan subendokarda uzanır, interstisyel sıvıyı, proteinleri ve immün hücreleri uzaklaştırır. İnfarktüs, hipertansiyon ve kalp yetersizliğinde lenfatik damarlar yeniden şekillenir ve işlevleri bozulur; ödem difüzyon mesafesini uzatır, inflamasyon çözülmez ve fibrozis artar. Deneysel VEGF-C/VEGFR3 lenfanjiyogenezi drenajı ve sol ventrikül işlevini iyileştirmiştir (Brakenhielm 2026).',
      en: 'Cardiac lymphatics run from epicardium to subendocardium, clearing interstitial fluid, protein and immune cells. After infarction, in hypertension and heart failure they remodel and fail; oedema lengthens diffusion distance, inflammation does not resolve and fibrosis grows. Experimental VEGF-C/VEGFR3 lymphangiogenesis improved drainage and LV function (Brakenhielm 2026).'
    },
    slider: { tr: 'Lenfatik kapasite (VEGF-C)', en: 'Lymphatic capacity (VEGF-C)' }
  }
};

export function createMyocardialCkmLab(opts = {}) {
  const mount = opts.mount || opts.container;
  let lang = opts.lang === 'en' ? 'en' : 'tr';
  let mode = 'takotsubo';
  const level = { takotsubo: 70, ckm: 0, lymphatic: 30 };
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-ckm-lab';
  mount?.append(root);
  const t = o => (lang === 'en' ? o.en : o.tr);

  function metrics() {
    const v = level[mode] / 100;
    if (mode === 'takotsubo') {
      const ef = Math.round(62 - v * 30);
      const lvot = Math.round(Math.max(0, (v - 0.55) * 120));
      return [
        [lang === 'en' ? 'LVEF' : 'LVEF', `${ef}%`],
        [lang === 'en' ? 'Apical wall motion' : 'Apikal duvar hareketi', v > 0.5 ? (lang === 'en' ? 'Akinetic' : 'Akinetik') : v > 0.25 ? (lang === 'en' ? 'Hypokinetic' : 'Hipokinetik') : 'Normal'],
        [lang === 'en' ? 'LVOT gradient' : 'LVOT gradyanı', `${lvot} mmHg`],
        [lang === 'en' ? 'Coronary angiogram' : 'Koroner anjiyografi', lang === 'en' ? 'No culprit' : 'Suçlu lezyon yok']
      ];
    }
    if (mode === 'ckm') {
      return [
        [lang === 'en' ? 'Interstitial volume' : 'İnterstisyel hacim', `${Math.round(100 - v * 14)}%`],
        [lang === 'en' ? 'Glomerular pressure' : 'Glomerüler basınç', `${Math.round(60 - v * 10)} mmHg`],
        [lang === 'en' ? 'Ketone (β-OHB)' : 'Keton (β-OHB)', `${(0.15 + v * 0.45).toFixed(2)} mM`],
        [lang === 'en' ? 'Myocyte Na+ load' : 'Miyosit Na+ yükü', `${Math.round(100 - v * 18)}%`]
      ];
    }
    const oedema = Math.round(Math.max(0, 70 - v * 60));
    return [
      [lang === 'en' ? 'Myocardial oedema' : 'Miyokard ödemi', `${oedema}%`],
      [lang === 'en' ? 'Lymph flow' : 'Lenf akımı', `${Math.round(20 + v * 80)}%`],
      [lang === 'en' ? 'Inflammation' : 'İnflamasyon', oedema > 40 ? (lang === 'en' ? 'Persistent' : 'Süregen') : (lang === 'en' ? 'Resolving' : 'Çözülüyor')],
      [lang === 'en' ? 'Fibrosis risk' : 'Fibrozis riski', oedema > 40 ? (lang === 'en' ? 'High' : 'Yüksek') : (lang === 'en' ? 'Low' : 'Düşük')]
    ];
  }

  function takotsuboSvg(v) {
    const bulge = 20 + v * 46;
    const baseSqueeze = 1 - v * 0.25;
    const apexColor = v > 0.5 ? '#94a3b8' : '#ef4444';
    return `
      <text x="20" y="26" font-size="12" font-weight="800" fill="#0f172a">${lang === 'en' ? 'Apical 4-chamber view, end-systole' : 'Apikal 4 boşluk, sistol sonu'}</text>
      <path d="M ${200 - 70 * baseSqueeze} 60 L ${200 + 70 * baseSqueeze} 60 C ${260 + bulge * 0.6} 150, ${240 + bulge} 260, 200 ${290 + bulge * 0.4} C ${160 - bulge} 260, ${140 - bulge * 0.6} 150, ${200 - 70 * baseSqueeze} 60 Z"
        fill="#fee2e2" stroke="#b91c1c" stroke-width="10" stroke-linejoin="round"/>
      <path d="M ${200 - 40 - bulge * 0.7} 200 C ${200 - 40 - bulge} 260, ${200 + 40 + bulge} 260, ${200 + 40 + bulge * 0.7} 200" fill="none" stroke="${apexColor}" stroke-width="12" opacity="0.8"/>
      <text x="200" y="52" text-anchor="middle" font-size="11" font-weight="700" fill="#b91c1c">${lang === 'en' ? 'Basal: hyperkinetic (β1 Gs)' : 'Bazal: hiperkinetik (β1 Gs)'}</text>
      <text x="200" y="${318 + bulge * 0.4}" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">${lang === 'en' ? 'Apex: ballooning (β2 Gi)' : 'Apeks: balonlaşma (β2 Gi)'}</text>
      <g transform="translate(400,70)" font-size="11" font-weight="700">
        <rect width="210" height="210" rx="10" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="12" y="22" fill="#0f172a">${lang === 'en' ? 'Apical myocyte β2-AR' : 'Apikal miyosit β2-AR'}</text>
        <rect x="20" y="40" width="170" height="14" rx="4" fill="#fde68a"/>
        <text x="105" y="51" text-anchor="middle" font-size="9.5" fill="#78350f">${lang === 'en' ? 'Sarcolemma' : 'Sarkolemma'}</text>
        ${Array.from({ length: Math.round(3 + v * 9) }, (_, i) => `<circle cx="${30 + (i * 37) % 150}" cy="${30 - (i % 2) * 8}" r="4" fill="#dc2626"/>`).join('')}
        <text x="12" y="80" fill="${v > 0.5 ? '#94a3b8' : '#16a34a'}">Gs → cAMP → ${lang === 'en' ? 'inotropy' : 'inotropi'} ${v > 0.5 ? '↓' : '↑'}</text>
        <text x="12" y="100" fill="${v > 0.5 ? '#2563eb' : '#94a3b8'}">Gi → ${lang === 'en' ? 'negative inotropy' : 'negatif inotropi'} ${v > 0.5 ? '↑' : ''}</text>
        <text x="12" y="120" fill="${v > 0.5 ? '#2563eb' : '#94a3b8'}">Gi → PI3K/Akt ${lang === 'en' ? 'anti-apoptosis' : 'anti-apoptoz'}</text>
        <text x="12" y="150" font-size="10" fill="#475569">${lang === 'en' ? 'Red dots: circulating epinephrine' : 'Kırmızı noktalar: dolaşan epinefrin'}</text>
        <text x="12" y="170" font-size="10" fill="#475569">${lang === 'en' ? 'Recovery: days to weeks' : 'Düzelme: günler-haftalar'}</text>
      </g>`;
  }

  function ckmSvg(v) {
    const glucose = Math.round(4 + v * 10);
    return `
      <text x="20" y="26" font-size="12" font-weight="800" fill="#0f172a">${lang === 'en' ? 'Kidney - heart axis' : 'Böbrek - kalp aksı'}</text>
      <g transform="translate(30,50)">
        <rect width="270" height="280" rx="12" fill="#eff6ff" stroke="#93c5fd"/>
        <text x="14" y="22" font-size="11" font-weight="800" fill="#1e3a8a">${lang === 'en' ? 'Proximal tubule' : 'Proksimal tübül'}</text>
        <rect x="20" y="40" width="230" height="44" rx="22" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        ${Array.from({ length: glucose }, (_, i) => `<circle cx="${34 + (i * 17) % 210}" cy="${56 + (i % 2) * 12}" r="4" fill="#f59e0b"/>`).join('')}
        <text x="135" y="104" text-anchor="middle" font-size="10" fill="#1e40af">${lang === 'en' ? 'Glucose + Na+ stay in urine' : 'Glukoz + Na+ idrarda kalır'}</text>
        <rect x="20" y="118" width="230" height="20" rx="4" fill="${v > 0.1 ? '#e2e8f0' : '#bfdbfe'}" stroke="#2563eb"/>
        <text x="135" y="132" text-anchor="middle" font-size="10" font-weight="700" fill="#1e3a8a">SGLT2 ${v > 0.1 ? (lang === 'en' ? 'blocked' : 'bloke') : (lang === 'en' ? 'active' : 'aktif')}</text>
        <circle cx="70" cy="200" r="${34 - v * 6}" fill="#fca5a5" stroke="#b91c1c" stroke-width="2"/>
        <text x="70" y="204" text-anchor="middle" font-size="10" font-weight="700" fill="#7f1d1d">${lang === 'en' ? 'Glomerulus' : 'Glomerül'}</text>
        <text x="160" y="190" font-size="10" fill="#334155">${lang === 'en' ? 'Macula densa Na+ ↑' : 'Makula densa Na+ ↑'}</text>
        <text x="160" y="206" font-size="10" fill="#334155">${lang === 'en' ? 'Afferent tone ↑' : 'Afferent tonus ↑'}</text>
        <text x="160" y="222" font-size="10" fill="#334155">${lang === 'en' ? 'Hyperfiltration ↓' : 'Hiperfiltrasyon ↓'}</text>
      </g>
      <g transform="translate(330,50)">
        <rect width="280" height="280" rx="12" fill="#fff1f2" stroke="#fda4af"/>
        <text x="14" y="22" font-size="11" font-weight="800" fill="#881337">${lang === 'en' ? 'Cardiomyocyte' : 'Kardiyomiyosit'}</text>
        <rect x="30" y="40" width="220" height="150" rx="30" fill="#fecdd3" stroke="#be123c" stroke-width="2"/>
        <text x="50" y="72" font-size="10.5" font-weight="700" fill="#9f1239">NHE-1 / ${lang === 'en' ? 'late INa' : 'geç INa'} ${v > 0.1 ? '↓' : ''}</text>
        <text x="50" y="94" font-size="10.5" font-weight="700" fill="#9f1239">[Na+]i ${v > 0.1 ? '↓' : '↑'} → [Ca2+]i ${v > 0.1 ? '↓' : '↑'}</text>
        <text x="50" y="116" font-size="10.5" font-weight="700" fill="#065f46">${lang === 'en' ? 'Ketones → ATP/O2 ↑' : 'Ketonlar → ATP/O2 ↑'}</text>
        <rect x="50" y="130" width="${180 * (0.4 + v * 0.6)}" height="14" rx="4" fill="#10b981"/>
        <text x="50" y="160" font-size="10" fill="#334155">${lang === 'en' ? 'Energetic efficiency' : 'Enerji verimi'}</text>
        <text x="20" y="220" font-size="10.5" fill="#334155">${lang === 'en' ? 'Interstitial decongestion > plasma' : 'İnterstisyel dekonjesyon > plazma'}</text>
        <text x="20" y="240" font-size="10.5" fill="#334155">${lang === 'en' ? 'Benefit independent of HbA1c' : 'Yarar HbA1c’den bağımsız'}</text>
      </g>`;
  }

  function lymphSvg(v) {
    const oedema = Math.max(0, 0.7 - v * 0.6);
    return `
      <text x="20" y="26" font-size="12" font-weight="800" fill="#0f172a">${lang === 'en' ? 'Myocardial wall: epicardium to endocardium' : 'Miyokard duvarı: epikarddan endokarda'}</text>
      <rect x="30" y="50" width="580" height="60" fill="#fef3c7" stroke="#d97706"/>
      <text x="40" y="70" font-size="10.5" font-weight="700" fill="#92400e">${lang === 'en' ? 'Epicardium: collecting lymphatics' : 'Epikard: toplayıcı lenfatikler'}</text>
      <rect x="30" y="110" width="580" height="180" fill="${`rgba(147,197,253,${0.15 + oedema * 0.6})`}" stroke="#be123c"/>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${50 + i * 62}" y="${130 + (i % 2) * 10}" width="44" height="140" rx="10" fill="#fca5a5" stroke="#b91c1c"/>`).join('')}
      ${Array.from({ length: Math.round(2 + v * 6) }, (_, i) => `<path d="M ${80 + i * 70} 290 C ${90 + i * 70} 220, ${70 + i * 70} 160, ${85 + i * 70} 100" fill="none" stroke="#16a34a" stroke-width="4"/>`).join('')}
      ${Array.from({ length: Math.round(oedema * 20) }, (_, i) => `<circle cx="${60 + (i * 53) % 540}" cy="${150 + (i * 37) % 120}" r="5" fill="#3b82f6" opacity="0.7"/>`).join('')}
      ${Array.from({ length: Math.round(oedema * 8) }, (_, i) => `<circle cx="${100 + (i * 71) % 480}" cy="${180 + (i * 23) % 80}" r="6" fill="#7c3aed"/>`).join('')}
      <text x="40" y="310" font-size="10.5" font-weight="700" fill="#1e3a8a">${lang === 'en' ? 'Blue: interstitial fluid · Purple: immune cells · Green: lymphatic capillaries' : 'Mavi: interstisyel sıvı · Mor: immün hücreler · Yeşil: lenfatik kapillerler'}</text>
      <rect x="30" y="290" width="580" height="8" fill="#fecaca"/>`;
  }

  function render() {
    const v = level[mode] / 100;
    const tx = TEXT[mode];
    const svg = mode === 'takotsubo' ? takotsuboSvg(v) : mode === 'ckm' ? ckmSvg(v) : lymphSvg(v);
    root.innerHTML = `
      <div class="preset-pill-group" style="margin-bottom:12px">
        ${MODES.map(m => `<button type="button" class="preset-pill ${m === mode ? 'active' : ''}" data-ckm-mode="${m}">${t(TEXT.modes[m])}</button>`).join('')}
      </div>
      <div class="pathophys-grid">
        <div class="pathophys-stage"><svg viewBox="0 0 640 370" class="pathophys-svg ckm-svg" role="img" aria-label="${t(tx.title)}">${svg}</svg></div>
        <div class="pathophys-controls">
          <div class="pathophys-sliders">
            <label class="pathophys-slider-row">
              <span class="slider-label"><strong>${t(tx.slider)}</strong></span>
              <input type="range" data-ckm-slider min="0" max="100" step="5" value="${level[mode]}">
              <span class="slider-val">${level[mode]}%</span>
            </label>
          </div>
          <div class="metrics-card"><div class="metrics-grid">
            ${metrics().map(([k, val]) => `<div class="metric-item"><span class="metric-lbl">${k}</span><span class="metric-num" style="font-size:15px">${val}</span></div>`).join('')}
          </div></div>
          <div class="clinical-desc-box"><h4>${t(tx.title)}</h4><p>${t(tx.body)}</p></div>
        </div>
      </div>`;
    root.querySelectorAll('[data-ckm-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.ckmMode; render(); }));
    root.querySelector('[data-ckm-slider]').addEventListener('input', e => { level[mode] = Number(e.target.value); render(); });
  }

  render();
  return {
    updateLanguage(next) { lang = next === 'en' ? 'en' : 'tr'; render(); },
    destroy() { root.remove(); }
  };
}

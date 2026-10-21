import {
  ARCH_TYPES,
  ARCH_VARIANTS,
  REFERENCES,
  SHELL_TEXT,
  STRUCTURES,
  VIEW_DEFS,
  calculateNascet,
  localize,
  nascetCategory,
  tortuosityClass,
  viewStructures
} from './carotid-data.js';
import { renderCarotidSvg } from './carotid-svg.js';

const copy = {
  tr: {
    viewIntro: {
      arch: 'Normal dallanma, ark varyantları ve Myla-Casserly girişimsel ark tipleri.',
      cervical: 'Bifurkasyon, bulbus, dalsız İKA ve sekiz klasik EKA dalı.',
      ica: 'Bouthillier C1–C7 segmentleri ve karotis sifonu.',
      circle: 'Koronal Willis poligonu, ACA, MCA ve posterior dolaşım.',
      stenosis: 'NASCET ölçümü, damar açısı ve stent planlama ilkeleri.'
    },
    normal: 'Normal', lateral: 'Lateral', ap: 'AP', projectionPearl: 'Lateral projeksiyon dalları ayırır; AP simetriyi ve medial-lateral ilişkiyi gösterir.',
    identification: 'İKA genellikle daha geniş, posterolateral ve servikal dalsızdır. EKA daha anteromedialdir ve dalları boyunda erken görülür. Rotasyon bu ilişkiyi ters gösterebilir; dal paterni daha güvenilir işarettir.',
    archPearl: 'En iyi başlangıç projeksiyonu: LAO 30–45°. Tip III arkta dallar tepeye göre daha kaudaldir; ortak BCT-LCCA kökeni keskin seçim açısı oluşturabilir. Her ikisi karotis erişimini zorlaştırabilir.',
    typeRule: 'BCT kökeninin ark dış kavsinin tepesine dikey uzaklığı, CCA çapı cinsinden.',
    mnemonicTitle: 'EKA dalları, sırayla',
    mnemonic: 'Üst Tiroid, Asendan Faringeal, Lingual, Fasiyal, Oksipital, Posterior Auriküler, Maksiller, Süperfisiyal Temporal.',
    mnemonicAid: 'Türkçe ipucu: Tıp Fakültesinde Lütfen Fazla Okuyup Pratikle Meslekte Sivril.',
    icaPearl: 'C2: karotikotimpanik, vidian. C4: meningohipofizyal, inferolateral trunkus. C6: oftalmik, süperior hipofizyal. C7: PComm, anterior koroidal. Terminal dallar ACA ve MCA’dır.',
    circlePearl: 'A1-AComm-A2 ve M1–M4 boyunca doluşu izleyin. Sylvian nokta, distal MCA dönüşünü işaretler. Persistan embriyonik anastomozlar nadirdir.',
    residual: 'Minimal rezidüel lümen (mm)', distal: 'Normal distal İKA (mm)', result: 'NASCET darlığı',
    invalid: 'Rezidüel lümen 0 ile distal referans arasında olmalıdır.',
    near: 'Near-oklüzyon uyarısı: distal İKA kollapsı varsa standart yüzde hesaplamasına güvenmeyin; ayrı kategori olarak raporlayın.',
    ecst: 'ECST, tahmini orijinal bulbus çapını kullanır. NASCET ve ECST yüzdeleri doğrudan eşdeğer değildir.',
    angle: 'İKA eksen açısı', geometry: 'Geometri', device: 'Cihaz planlama notu',
    deviceNote: 'Artan tortiyozite, distal embolik koruma cihazının geçişini ve stabilitesini zorlaştırabilir. Stent ve koruma stratejisi lezyon, damar çapı, kalsifikasyon ve ark desteğiyle birlikte bireyselleştirilir. Bu şema tedavi önerisi değildir.',
    standard: 'Standart anatomi', selected: 'Seçili', structures: 'seçilebilir yapı'
  },
  en: {
    viewIntro: {
      arch: 'Normal branching, arch variants, and Myla-Casserly interventional arch types.',
      cervical: 'Bifurcation, bulb, branchless ICA, and eight classic ECA branches.',
      ica: 'Bouthillier C1–C7 segments and carotid siphon.',
      circle: 'Coronal Circle of Willis, ACA, MCA, and posterior circulation.',
      stenosis: 'NASCET measurement, vessel angulation, and stent planning principles.'
    },
    normal: 'Normal', lateral: 'Lateral', ap: 'AP', projectionPearl: 'Lateral projection separates branches; AP shows symmetry and medial-lateral relationships.',
    identification: 'ICA is usually larger, posterolateral, and branchless in the neck. ECA is more anteromedial and gives early cervical branches. Rotation may reverse apparent position, so branch pattern is more reliable.',
    archPearl: 'Best starting projection: LAO 30–45°. In type III arch, branches arise farther caudal to arch apex; a common BCT-LCCA origin can create a sharp selection angle. Both may make carotid access harder.',
    typeRule: 'Vertical distance from BCT origin to top of outer arch curve, measured in CCA diameters.',
    mnemonicTitle: 'ECA branches, in order',
    mnemonic: 'Superior Thyroid, Ascending Pharyngeal, Lingual, Facial, Occipital, Posterior Auricular, Maxillary, Superficial Temporal.',
    mnemonicAid: 'Mnemonic: Some Anatomists Like Freaking Out Poor Medical Students.',
    icaPearl: 'C2: caroticotympanic, vidian. C4: meningohypophyseal, inferolateral trunk. C6: ophthalmic, superior hypophyseal. C7: PComm, anterior choroidal. Terminal branches are ACA and MCA.',
    circlePearl: 'Follow filling across A1-AComm-A2 and M1–M4. Sylvian point marks distal MCA turn. Persistent embryonic anastomoses are rare.',
    residual: 'Minimal residual lumen (mm)', distal: 'Normal distal ICA (mm)', result: 'NASCET stenosis',
    invalid: 'Residual lumen must be between zero and distal reference.',
    near: 'Near-occlusion caveat: if distal ICA collapse is present, do not rely on standard percentage calculation; report it as a separate category.',
    ecst: 'ECST uses estimated original bulb diameter. NASCET and ECST percentages are not directly equivalent.',
    angle: 'ICA axis angle', geometry: 'Geometry', device: 'Device planning note',
    deviceNote: 'Increasing tortuosity may impair delivery and stability of distal embolic protection. Stent and protection strategy is individualized with lesion, vessel diameter, calcification, and arch support. This schematic is not treatment advice.',
    standard: 'Standard anatomy', selected: 'Selected', structures: 'selectable structures'
  }
};

const buttonGroup = (label, options, active, attr, lang) => `<div class="control-group"><span class="control-label">${label}</span><div class="chip-row" role="group" aria-label="${label}">${options.map(option => {
  const id = typeof option === 'string' ? option : option.id;
  const text = typeof option === 'string' ? option : localize(option.label, lang);
  return `<button type="button" class="carotid-chip ${active === id ? 'active' : ''}" ${attr}="${id}" aria-pressed="${active === id}">${text}</button>`;
}).join('')}</div></div>`;

function viewControls(view, state, lang) {
  const t = copy[lang];
  const shell = SHELL_TEXT[lang];
  if (view === 'arch') {
    const activeType = ARCH_TYPES.find(item => item.id === state.archType);
    const activeVariant = ARCH_VARIANTS.find(item => item.id === state.archVariant);
    return `${buttonGroup(shell.archType, ARCH_TYPES, state.archType, 'data-arch-type', lang)}
      <p class="control-explain">${t.typeRule} <strong>${localize(activeType.rule, lang)}</strong></p>
      ${buttonGroup(shell.variant, ARCH_VARIANTS, state.archVariant, 'data-arch-variant', lang)}
      <p class="control-explain" data-variant-note>${localize(activeVariant.note, lang)}</p>
      <div class="teaching-note"><strong>LAO 30–45°</strong><span>${t.archPearl}</span></div>`;
  }
  if (view === 'cervical') {
    const projections = [{ id: 'ap', label: { tr: 'AP', en: 'AP' } }, { id: 'lateral', label: { tr: 'Lateral', en: 'Lateral' } }];
    return `${buttonGroup(shell.projection, projections, state.projection, 'data-projection', lang)}
      <p class="control-explain">${t.projectionPearl}</p>
      <div class="teaching-note"><strong>ICA / ECA</strong><span>${t.identification}</span></div>
      <div class="teaching-note"><strong>${t.mnemonicTitle}</strong><span>${t.mnemonic}</span><em>${t.mnemonicAid}</em></div>`;
  }
  if (view === 'ica') return `<div class="teaching-note"><strong>C1–C7</strong><span>${t.icaPearl}</span></div>`;
  if (view === 'circle') return `<div class="teaching-note"><strong>ACA · MCA · PCA</strong><span>${t.circlePearl}</span></div>`;
  return stenosisControls(state, lang);
}

function stenosisControls(state, lang) {
  const t = copy[lang];
  const pct = calculateNascet(state.residual, state.distal);
  const result = pct === null ? t.invalid : `${pct.toFixed(1)}% · ${nascetCategory(pct, lang)}`;
  const formula = lang === 'tr' ? '(1 − minimal lümen / distal normal İKA) × 100' : '(1 − minimal lumen / normal distal ICA) × 100';
  return `<div class="calculator" data-nascet-calculator>
    <div class="formula">${formula}</div>
    <div class="input-grid">
      <label>${t.residual}<input type="number" min="0" step="0.1" value="${state.residual}" data-nascet-residual></label>
      <label>${t.distal}<input type="number" min="0.1" step="0.1" value="${state.distal}" data-nascet-distal></label>
    </div>
    <output class="nascet-output ${pct === null ? 'invalid' : ''}" data-nascet-output><span>${t.result}</span><strong>${result}</strong></output>
    <p>${t.near}</p><p>${t.ecst}</p>
  </div>
  <label class="angle-control"><span>${t.angle}: <strong data-angle-value>${state.angle}°</strong></span>
    <input type="range" min="0" max="130" step="5" value="${state.angle}" data-ica-angle>
  </label>
  <div class="geometry-result"><span>${t.geometry}</span><strong data-tortuosity-class>${tortuosityClass(state.angle, lang)}</strong></div>
  <div class="teaching-note warning"><strong>${t.device}</strong><span>${t.deviceNote}</span></div>`;
}

function detailMarkup(item, lang) {
  const shell = SHELL_TEXT[lang];
  const t = copy[lang];
  if (!item) return `<div class="detail-empty"><span class="detail-icon">+</span><p>${shell.selectPrompt}</p></div>`;
  return `<article class="detail-content" data-detail-id="${item.id}">
    <span class="detail-kicker">${t.selected}</span>
    <h2>${localize(item.label, lang)}</h2>
    <div><h3>${shell.anatomy}</h3><p>${localize(item.description, lang)}</p></div>
    <div><h3>${shell.pearl}</h3><p>${localize(item.pearl, lang)}</p></div>
  </article>`;
}

function referencesMarkup(lang) {
  const shell = SHELL_TEXT[lang];
  return `<details class="references"><summary>${shell.references}</summary><ol>${REFERENCES.map(ref => `<li>${ref}</li>`).join('')}</ol></details>`;
}

export function createCarotidPanel({ mount, getLang }) {
  const state = {
    view: 'arch', selected: null, archType: 'I', archVariant: 'normal', projection: 'lateral',
    residual: 1.2, distal: 4, angle: 25
  };

  function render() {
    const lang = getLang();
    const shell = SHELL_TEXT[lang];
    const t = copy[lang];
    const current = VIEW_DEFS.find(view => view.id === state.view);
    const count = viewStructures(state.view).length;
    mount.innerHTML = `<section class="carotid-hero">
      <div><span class="carotid-eyebrow">${shell.eyebrow}</span><h1>${shell.heading}</h1><p>${shell.intro}</p></div>
      <span class="schematic-badge">${shell.schematic}</span>
    </section>
    <nav class="carotid-tabs" aria-label="${shell.tabs}">${VIEW_DEFS.map(view => `<button type="button" class="carotid-tab ${view.id === state.view ? 'active' : ''}" data-view-tab="${view.id}" aria-selected="${view.id === state.view}"><span>${localize(view.short, lang)}</span><small>${localize(view.label, lang)}</small></button>`).join('')}</nav>
    <section class="view-heading"><div><span>0${VIEW_DEFS.indexOf(current) + 1}</span><h2>${localize(current.label, lang)}</h2></div><p>${t.viewIntro[state.view]}</p><small>${count} ${t.structures}</small></section>
    <div class="carotid-grid" data-render-view="${state.view}">
      <section class="visual-card">
        <div class="svg-wrap">${renderCarotidSvg(state.view, state, lang)}<div class="hover-label" data-hover-label role="status" aria-live="polite"></div></div>
        <div class="view-controls">${viewControls(state.view, state, lang)}</div>
      </section>
      <aside class="detail-card" aria-label="${shell.detail}"><div class="detail-head"><span>${shell.detail}</span><span class="detail-count">${count}</span></div><div data-structure-detail>${detailMarkup(STRUCTURES.find(item => item.id === state.selected), lang)}</div></aside>
    </div>
    ${referencesMarkup(lang)}`;
    bindEvents();
  }

  function selectStructure(id) {
    const item = STRUCTURES.find(candidate => candidate.id === id && candidate.view === state.view);
    if (!item) return;
    state.selected = id;
    mount.querySelectorAll('.carotid-structure').forEach(node => node.classList.toggle('selected', node.dataset.structure === id));
    const detail = mount.querySelector('[data-structure-detail]');
    if (detail) detail.innerHTML = detailMarkup(item, getLang());
  }

  function updateNascet() {
    const lang = getLang();
    const t = copy[lang];
    const pct = calculateNascet(state.residual, state.distal);
    const output = mount.querySelector('[data-nascet-output]');
    if (!output) return;
    output.classList.toggle('invalid', pct === null);
    output.innerHTML = `<span>${t.result}</span><strong>${pct === null ? t.invalid : `${pct.toFixed(1)}% · ${nascetCategory(pct, lang)}`}</strong>`;
  }

  function bindEvents() {
    mount.querySelectorAll('[data-view-tab]').forEach(button => button.addEventListener('click', () => {
      state.view = button.dataset.viewTab;
      state.selected = null;
      render();
    }));
    mount.querySelectorAll('[data-arch-type]').forEach(button => button.addEventListener('click', () => { state.archType = button.dataset.archType; render(); }));
    mount.querySelectorAll('[data-arch-variant]').forEach(button => button.addEventListener('click', () => { state.archVariant = button.dataset.archVariant; render(); }));
    mount.querySelectorAll('[data-projection]').forEach(button => button.addEventListener('click', () => { state.projection = button.dataset.projection; render(); }));
    mount.querySelectorAll('.carotid-structure').forEach(node => {
      node.addEventListener('click', () => selectStructure(node.dataset.structure));
      node.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectStructure(node.dataset.structure); }
      });
      node.addEventListener('pointerenter', () => {
        const item = STRUCTURES.find(candidate => candidate.id === node.dataset.structure);
        const tooltip = mount.querySelector('[data-hover-label]');
        if (tooltip && item) { tooltip.textContent = localize(item.label, getLang()); tooltip.classList.add('visible'); }
      });
      node.addEventListener('pointerleave', () => mount.querySelector('[data-hover-label]')?.classList.remove('visible'));
    });
    const residual = mount.querySelector('[data-nascet-residual]');
    const distal = mount.querySelector('[data-nascet-distal]');
    residual?.addEventListener('input', () => { state.residual = residual.value; updateNascet(); });
    distal?.addEventListener('input', () => { state.distal = distal.value; updateNascet(); });
    mount.querySelector('[data-ica-angle]')?.addEventListener('input', event => { state.angle = Number(event.target.value); render(); });
  }

  render();
  return { render, getState: () => ({ ...state }) };
}

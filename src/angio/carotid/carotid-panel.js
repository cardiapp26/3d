import {
  ARCH_TYPES,
  ARCH_VARIANTS,
  REFERENCES,
  SHELL_TEXT,
  STRUCTURES,
  VIEW_DEFS,
  calculateNascet,
  formatNascetPercent,
  localize,
  nascetCategory,
  tortuosityClass,
  viewStructures
} from './carotid-data.js';
import { createAngioDevice } from '../angio-device.js';
import { renderCarotidSvg } from './carotid-svg.js';
import { renderCarotidFluoro, hitTestCarotid } from './carotid-fluoro.js';

const FLUO_W = 540;
const FLUO_H = 440;

const imagingCopy = {
  tr: {
    title: 'Skopi / DSA', anatomy: 'Anatomi şeması', dsa: 'DSA görünümü', fluoro: 'Nativ skopi',
    contrast: 'Kontrast dolumu', alpha: 'RAO / LAO', beta: 'Kaudal / Kraniyal', reset: 'AP sıfırla',
    note: 'Özgün şematik 3B damar projeksiyonu; hasta görüntüsü ve radyografik doku simülasyonu değildir. Kemik, kateter ve gerçek kontrast geçişi modellenmez. Anatomi şemasının projeksiyonu bağımsızdır.',
    label: 'Karotis skopi simülasyonu'
  },
  en: {
    title: 'Fluoroscopy / DSA', anatomy: 'Anatomy schematic', dsa: 'DSA view', fluoro: 'Native fluoroscopy',
    contrast: 'Contrast filling', alpha: 'RAO / LAO', beta: 'Caudal / Cranial', reset: 'Reset AP',
    note: 'Original schematic 3D vessel projection; not patient imaging or a radiographic tissue simulation. Bones, catheters and actual contrast transit are not modeled. The anatomy schematic has an independent projection.',
    label: 'Carotid fluoroscopy simulation'
  }
};

function imagingMarkup(state, lang) {
  const t = imagingCopy[lang];
  return `<section class="carotid-imaging" aria-label="${t.label}">
    <div class="carotid-imaging-head"><h3>${t.title}</h3><div role="group" aria-label="${t.title}">${['dsa', 'fluoro'].map(mode => `<button type="button" class="carotid-chip" data-fluo-mode="${mode}" aria-pressed="${state.imagingMode === mode}">${t[mode]}</button>`).join('')}</div></div>
    <canvas data-carotid-fluo width="540" height="440" role="img" aria-label="${t.label}"></canvas>
    <p class="control-explain" data-fluo-note>${t.note}</p>
  </section>`;
}

function controlsMarkup(state, lang) {
  const t = imagingCopy[lang];
  const tr = lang === 'tr';
  return `<section class="carotid-studio-controls angio-card">
    <div class="angio-carm-box"><h3>${tr ? '3B C-Arm Gantri' : '3D C-Arm Gantry'}</h3>
      <div class="angio-device-viewport" data-carotid-device></div>
      <div class="angio-device-legend"><span>🔵 ${tr ? 'Detektör' : 'Detector'}</span><span>🟠 ${tr ? 'X-ışını tüpü' : 'X-ray tube'}</span><label><input type="checkbox" data-carotid-beam ${state.beam ? 'checked' : ''}> ${tr ? 'Işın geometrisi' : 'Beam geometry'}</label></div>
      <p class="angio-device-note">${tr ? 'Şematik cihaz modeli. Sürükleyerek cihazı inceleyin; projeksiyonu açı kumandası değiştirir.' : 'Schematic device model. Drag to inspect the device; angle controls drive the projection.'}</p>
    </div>
    <div class="angio-pad-box"><h3>${tr ? 'C-Arm Açı Kumandası' : 'C-Arm Angle Pad'}</h3>
      <div class="carotid-angle-pad" data-carotid-pad aria-label="${tr ? 'C-arm açı alanı; klavye için aşağıdaki kaydırıcıları kullanın' : 'C-arm angle pad; use sliders below for keyboard control'}">
        <span class="carotid-pad-top">CRA</span><span class="carotid-pad-bottom">CAU</span><span class="carotid-pad-left">RAO</span><span class="carotid-pad-right">LAO</span><span class="carotid-pad-puck" data-carotid-puck></span>
      </div>
    <div class="carotid-imaging-controls">
      <label>${t.alpha} <output data-fluo-alpha-value></output><input type="range" aria-label="${t.alpha}" min="-90" max="90" step="1" value="${state.alpha}" data-fluo-alpha></label>
      <label>${t.beta} <output data-fluo-beta-value></output><input type="range" aria-label="${t.beta}" min="-40" max="40" step="1" value="${state.beta}" data-fluo-beta></label>
      <label>${t.contrast} <output data-fluo-contrast-value></output><input type="range" aria-label="${t.contrast}" min="0" max="100" step="1" value="${state.contrast * 100}" data-fluo-contrast></label>
      <div class="chip-row"><button type="button" class="carotid-chip" data-fluo-preset="0">${t.reset}</button><button type="button" class="carotid-chip" data-fluo-preset="-30">RAO 30°</button><button type="button" class="carotid-chip" data-fluo-preset="30">LAO 30°</button><button type="button" class="carotid-chip" data-fluo-preset="90">LAO 90°</button></div>
    </div>
    </div>
  </section>`;
}

const copy = {
  tr: {
    viewIntro: {
      arch: 'Normal dallanma, ark varyantları ve Casserly girişimsel ark tipleri.',
      cervical: 'Bifurkasyon, bulbus, dalsız İKA ve değişken kökenli sekiz klasik EKA dalı.',
      ica: 'Bouthillier C1–C7 segmentleri ve karotis sifonu.',
      circle: 'Koronal Willis poligonu, ACA, MCA ve posterior dolaşım.',
      stenosis: 'NASCET ölçümü, damar açısı ve stent planlama ilkeleri.'
    },
    normal: 'Standart yüzde', lateral: 'Lateral', ap: 'AP', projectionPearl: 'Bifurkasyon için lateral ve ipsilateral oblik 30–45° kullanın; AP’de İKA ve EKA çoğunlukla üst üste biner. Darlığı en dar lümeni gösteren projeksiyonda ve en az iki projeksiyonda ölçün. Sağ BCT bifurkasyonu RAO 20–30° ile açılır.',
    identification: 'İKA genellikle daha geniş, posterolateral ve servikal dalsızdır. EKA daha anteromedialdir ve dalları boyunda erken görülür. Rotasyon bu ilişkiyi ters gösterebilir; dal paterni daha güvenilir işarettir.',
    archPearl: 'LAO 30–45° arkı açar. BCT kökeni tip arttıkça en fazla kaudale iner; LCCA daha az, LSCA en az yer değiştirir. Yaş ve hipertansiyonla tip artabilir.',
    typeRule: 'BCT kökeninin ark dış kavisi tepesinden dikey uzaklığı, LCCA çapı cinsinden, LAO 30–45°’de ölçülür.',
    mnemonicTitle: 'EKA dalları, klasik liste',
    mnemonic: 'Süperior tiroid, asendan faringeal, lingual, fasiyal, oksipital, posterior auriküler, maksiller, yüzeyel temporal. Köken sırası değişkendir; asendan faringeal sıklıkla ilk daldır, lingofasiyal trunkus yaklaşık %20 görülür. Maksiller ve yüzeyel temporal terminal dallardır. EKA, oftalmik (fasiyal, maksiller, yüzeyel temporal), petröz İKA ve vertebral (oksipital, asendan faringeal) dolaşımla kollateral yapar; embolizasyonda bunlar tehlikeli anastomozlardır.',
    mnemonicAid: 'Türkçe ipucu: Tıp Fakültesinde Lütfen Fazla Okuyup Pratikle Meslekte Sivril.',
    icaPearl: 'Karotis sifonu C4–C6’dır ve lateral projeksiyonda iyi görülür. C2: karotikotimpanik, vidian. C4: meningohipofizyal ve inferolateral trunkuslar. C6: oftalmik, süperior hipofizyal. C7: PComm, anterior koroidal. Fischer 1938 sınıflaması C1–C5’i kan akımına ters numaralandırır.',
    circlePearl: 'Gibo tanımında M1 limen insula genuya dek sürer; erken postbifurkasyon trunkuslar M1’dir. A1 mediyal lentikülostriatları, A1-A2 bileşkesi Heubner arterini verir. Trigeminal bağlantı en sık, otik en nadir ve tartışmalıdır; proatlantal arter vertebrale katılır.',
    residual: 'Minimal rezidüel lümen (mm)', distal: 'Normal distal İKA (mm)', result: 'NASCET darlığı',
    invalid: 'Rezidüel lümen 0 ile distal referans arasında olmalıdır.',
    near: 'Distal İKA kollapsı varsa yüzdeye güvenmeyin; tama yakın oklüzyonu ayrı kategori seçin.',
    nearOption: 'Tama yakın oklüzyon (distal kollaps)',
    ecst: 'ECST tahmini orijinal bulbus çapını kullanır: NASCET %50 ≈ ECST %75, NASCET %70 ≈ ECST %85; yaklaşık dönüşüm ECST ≈ 0,6 × NASCET + 40.',
    angle: 'Düz eksenden sapma', geometry: 'Weibel-Fields geometrisi', coilOption: 'Koil (halka), 360° seyir', device: 'Cihaz planlama notu',
    deviceNote: 'Distal İKA tortüözitesi veya tip III/bovin arkta proksimal koruma, akım tersine çevirme, TCAR veya KEA düşünülebilir. ESVS 2023: semptomatik NASCET %50–99 darlıkta revaskülarizasyon, tercihen 14 gün içinde; ≥70 yaşta KEA CAS’a tercih edilir, <70 yaşta CAS alternatiftir. Asemptomatik %60–99 darlıkta ortalama cerrahi riskte ve en az bir görüntüleme veya klinik yüksek risk özelliği varsa KEA düşünülür. AHA/ASA 2021: semptomatik %70–99 darlıkta KEA; %50–69’da hasta özelliklerine göre. Bu şema tedavi önerisi değildir.',
    standard: 'Standart anatomi', selected: 'Seçili', structures: 'seçilebilir yapı'
  },
  en: {
    viewIntro: {
      arch: 'Normal branching, arch variants, and Casserly interventional arch types.',
      cervical: 'Bifurcation, bulb, branchless ICA, and eight classic ECA branches with variable origins.',
      ica: 'Bouthillier C1–C7 segments and carotid siphon.',
      circle: 'Coronal Circle of Willis, ACA, MCA, and posterior circulation.',
      stenosis: 'NASCET measurement, vessel angulation, and stent planning principles.'
    },
    normal: 'Standard percentage', lateral: 'Lateral', ap: 'AP', projectionPearl: 'Use lateral and ipsilateral oblique 30–45° for the bifurcation; ICA and ECA usually overlap in AP. Measure stenosis in at least two projections, using the view showing the narrowest lumen. RAO 20–30° opens the right BCT bifurcation.',
    identification: 'ICA is usually larger, posterolateral, and branchless in the neck. ECA is more anteromedial and gives early cervical branches. Rotation may reverse apparent position, so branch pattern is more reliable.',
    archPearl: 'LAO 30–45° opens the arch. As type rises, the BCT origin drops most, LCCA less, and LSCA least. Type may rise with age and hypertension.',
    typeRule: 'Vertical distance from the BCT origin to the apex of the outer arch curve, in LCCA diameters, measured in LAO 30–45°.',
    mnemonicTitle: 'ECA branches, classic listing',
    mnemonic: 'Superior thyroid, ascending pharyngeal, lingual, facial, occipital, posterior auricular, maxillary, superficial temporal. Origin order varies; ascending pharyngeal is often first and a linguofacial trunk occurs in about 20%. Maxillary and superficial temporal are terminal branches. The ECA anastomoses with ophthalmic (facial, maxillary, superficial temporal), petrous ICA, and vertebral (occipital, ascending pharyngeal) circulations; these are dangerous anastomoses during embolisation.',
    mnemonicAid: 'Mnemonic: Some Anatomists Like Freaking Out Poor Medical Students.',
    icaPearl: 'The carotid siphon is C4–C6 and is best seen laterally. C2: caroticotympanic, vidian. C4: meningohypophyseal and inferolateral trunks. C6: ophthalmic, superior hypophyseal. C7: PComm, anterior choroidal. Fischer’s 1938 C1–C5 scheme numbers against blood flow.',
    circlePearl: 'In the Gibo definition, M1 extends to the genu at the limen insulae; early post-bifurcation trunks remain M1. A1 gives medial lenticulostriates and the A1-A2 junction gives the recurrent artery of Heubner. Trigeminal is the commonest primitive connection, otic the rarest and disputed; proatlantal joins the vertebral artery.',
    residual: 'Minimal residual lumen (mm)', distal: 'Normal distal ICA (mm)', result: 'NASCET stenosis',
    invalid: 'Residual lumen must be between zero and distal reference.',
    near: 'If distal ICA collapse is present, do not rely on the percentage; select near-occlusion as a separate category.',
    nearOption: 'Near-occlusion (distal collapse)',
    ecst: 'ECST uses the estimated original bulb: NASCET 50% ≈ ECST 75%, NASCET 70% ≈ ECST 85%; approximate conversion ECST ≈ 0.6 × NASCET + 40.',
    angle: 'Deviation from straight axis', geometry: 'Weibel-Fields geometry', coilOption: 'Coil/loop, 360° course', device: 'Device planning note',
    deviceNote: 'With distal ICA tortuosity or a type III/bovine arch, consider proximal protection, flow reversal, TCAR, or CEA. ESVS 2023: revascularise symptomatic NASCET 50–99% stenosis, preferably within 14 days; CEA is preferred over CAS at age ≥70, and CAS is an alternative below 70. For asymptomatic 60–99% stenosis, consider CEA at average surgical risk when at least one imaging or clinical high-risk feature is present. AHA/ASA 2021: CEA for symptomatic 70–99%, and for 50–69% depending on patient factors. This schematic is not treatment advice.',
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
  const result = pct === null
    ? t.invalid
    : state.nearOcclusion
      ? nascetCategory(pct, lang, true)
      : `${formatNascetPercent(pct)}% · ${nascetCategory(pct, lang)}`;
  const formula = lang === 'tr' ? '(1 − minimal lümen / distal normal İKA) × 100' : '(1 − minimal lumen / normal distal ICA) × 100';
  return `<div class="calculator" data-nascet-calculator>
    <div class="formula">${formula}</div>
    <div class="input-grid">
      <label>${t.residual}<input type="number" min="0" step="0.1" value="${state.residual}" data-nascet-residual></label>
      <label>${t.distal}<input type="number" min="0.1" step="0.1" value="${state.distal}" data-nascet-distal></label>
    </div>
    <output class="nascet-output ${pct === null ? 'invalid' : ''}" data-nascet-output><span>${t.result}</span><strong>${result}</strong></output>
    <label class="option-toggle"><input type="checkbox" data-near-occlusion ${state.nearOcclusion ? 'checked' : ''}><span>${t.nearOption}</span></label>
    <p>${t.near}</p><p>${t.ecst}</p>
  </div>
  <label class="angle-control"><span>${t.angle}: <strong data-angle-value>${state.angle}°</strong></span>
    <input type="range" min="0" max="130" step="5" value="${state.angle}" data-ica-angle>
  </label>
  <label class="option-toggle"><input type="checkbox" data-coil-course ${state.coil ? 'checked' : ''}><span>${t.coilOption}</span></label>
  <div class="geometry-result"><span>${t.geometry}</span><strong data-tortuosity-class>${tortuosityClass(state.angle, lang, state.coil)}</strong></div>
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
    residual: 1.2, distal: 4, nearOcclusion: false, angle: 25, coil: false,
    alpha: 0, beta: 0, contrast: 1, imagingMode: 'dsa', anatomyOpen: false, beam: true
  };
  let hitRegions = [];
  let device = null;

  // Back the 540 x 440 logical detector with device pixels so vessels stay sharp on HiDPI screens.
  function sizeDetector(canvas) {
    const cssWidth = canvas.getBoundingClientRect().width || FLUO_W;
    const ratio = Math.min(4, Math.max(1, (window.devicePixelRatio || 1) * cssWidth / FLUO_W));
    const width = Math.round(FLUO_W * ratio), height = Math.round(FLUO_H * ratio);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    return width / FLUO_W;
  }

  function drawFluoro() {
    const canvas = mount.querySelector('[data-carotid-fluo]');
    if (!canvas) return;
    const result = renderCarotidFluoro(canvas, { ...state, lang: getLang(), pixelRatio: sizeDetector(canvas) });
    hitRegions = result.hitRegions;
    device?.setAngles(state.alpha, state.beta);
    const puck = mount.querySelector('[data-carotid-puck]');
    puck.style.left = `${(state.alpha + 90) / 180 * 100}%`;
    puck.style.top = `${(40 - state.beta) / 80 * 100}%`;
    mount.querySelector('[data-fluo-alpha]').value = state.alpha;
    mount.querySelector('[data-fluo-beta]').value = state.beta;
    mount.querySelector('[data-fluo-alpha-value]').textContent = state.alpha === 0 ? 'AP 0°' : `${state.alpha < 0 ? 'RAO' : 'LAO'} ${Math.abs(state.alpha)}°`;
    mount.querySelector('[data-fluo-beta-value]').textContent = `${state.beta < 0 ? 'CAU' : 'CRA'} ${Math.abs(state.beta)}°`;
    mount.querySelector('[data-fluo-contrast-value]').textContent = `${Math.round(state.contrast * 100)}%`;
    mount.querySelectorAll('[data-fluo-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.fluoMode === state.imagingMode)));
  }

  function render() {
    const retainedDeviceMount = device ? mount.querySelector('[data-carotid-device]') : null;
    retainedDeviceMount?.remove();
    const lang = getLang();
    const shell = SHELL_TEXT[lang];
    const t = copy[lang];
    const current = VIEW_DEFS.find(view => view.id === state.view);
    const bctAbsent = state.view === 'arch' && ['lusoria', 'right-arch'].includes(state.archVariant);
    const count = viewStructures(state.view).length - (bctAbsent ? 1 : 0);
    mount.innerHTML = `<section class="carotid-hero">
      <div><span class="carotid-eyebrow">${shell.eyebrow}</span><h1>${shell.heading}</h1><p>${shell.intro}</p></div>
      <span class="schematic-badge">${shell.schematic}</span>
    </section>
    <nav class="carotid-tabs" aria-label="${shell.tabs}">${VIEW_DEFS.map(view => `<button type="button" class="carotid-tab ${view.id === state.view ? 'active' : ''}" data-view-tab="${view.id}" aria-selected="${view.id === state.view}"><span>${localize(view.short, lang)}</span><small>${localize(view.label, lang)}</small></button>`).join('')}</nav>
    <section class="view-heading"><div><span>0${VIEW_DEFS.indexOf(current) + 1}</span><h2>${localize(current.label, lang)}</h2></div><p>${t.viewIntro[state.view]}</p><small>${count} ${t.structures}</small></section>
    <div class="carotid-grid" data-render-view="${state.view}">
      <div class="carotid-detector-column">
        <section class="visual-card">${imagingMarkup(state, lang)}</section>
        <aside class="detail-card" aria-label="${shell.detail}"><div class="detail-head"><span>${shell.detail}</span><span class="detail-count">${count}</span></div><div data-structure-detail>${detailMarkup(STRUCTURES.find(item => item.id === state.selected), lang)}</div></aside>
        <details class="visual-card carotid-anatomy" data-carotid-anatomy ${state.anatomyOpen ? 'open' : ''}>
          <summary>${imagingCopy[lang].anatomy}</summary>
          <div class="svg-wrap">${renderCarotidSvg(state.view, state, lang)}<div class="hover-label" data-hover-label role="status" aria-live="polite"></div></div>
        </details>
      </div>
      <div class="carotid-control-column">${controlsMarkup(state, lang)}
        <section class="visual-card view-controls">${viewControls(state.view, state, lang)}</section>
      </div>
    </div>
    ${referencesMarkup(lang)}`;
    const deviceMount = mount.querySelector('[data-carotid-device]');
    try {
      if (retainedDeviceMount) deviceMount.replaceWith(retainedDeviceMount);
      else device = createAngioDevice(deviceMount);
      device.setBeam(state.beam);
    } catch (error) {
      deviceMount.textContent = lang === 'tr' ? '3B cihaz görüntüsü kullanılamıyor; açı kumandaları çalışmaya devam eder.' : '3D device view unavailable; angle controls remain available.';
      console.warn('Carotid C-arm device unavailable', error);
    }
    bindEvents();
    drawFluoro();
  }

  function selectStructure(id) {
    const item = STRUCTURES.find(candidate => candidate.id === id && candidate.view === state.view);
    if (!item) return;
    state.selected = id;
    mount.querySelectorAll('.carotid-structure').forEach(node => node.classList.toggle('selected', node.dataset.structure === id));
    const detail = mount.querySelector('[data-structure-detail]');
    if (detail) detail.innerHTML = detailMarkup(item, getLang());
    drawFluoro();
  }

  function updateNascet() {
    const lang = getLang();
    const t = copy[lang];
    const pct = calculateNascet(state.residual, state.distal);
    const output = mount.querySelector('[data-nascet-output]');
    if (!output) return;
    output.classList.toggle('invalid', pct === null);
    const result = pct === null
      ? t.invalid
      : state.nearOcclusion
        ? nascetCategory(pct, lang, true)
        : `${formatNascetPercent(pct)}% · ${nascetCategory(pct, lang)}`;
    output.innerHTML = `<span>${t.result}</span><strong>${result}</strong>`;
    drawFluoro();
  }

  function bindEvents() {
    mount.querySelector('[data-carotid-anatomy]').addEventListener('toggle', event => { state.anatomyOpen = event.currentTarget.open; });
    mount.querySelector('[data-carotid-beam]').addEventListener('change', event => {
      state.beam = event.target.checked;
      device?.setBeam(state.beam);
    });
    const pad = mount.querySelector('[data-carotid-pad]');
    const movePad = event => {
      const rect = pad.getBoundingClientRect();
      state.alpha = Math.round(Math.max(-90, Math.min(90, (event.clientX - rect.left) / rect.width * 180 - 90)));
      state.beta = Math.round(Math.max(-40, Math.min(40, 40 - (event.clientY - rect.top) / rect.height * 80)));
      drawFluoro();
    };
    pad.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      pad.setPointerCapture(event.pointerId);
      movePad(event);
    });
    pad.addEventListener('pointermove', event => { if (pad.hasPointerCapture(event.pointerId)) movePad(event); });
    pad.addEventListener('pointerup', event => { if (pad.hasPointerCapture(event.pointerId)) pad.releasePointerCapture(event.pointerId); });
    for (const key of ['alpha', 'beta', 'contrast']) {
      mount.querySelector(`[data-fluo-${key}]`).addEventListener('input', event => {
        state[key] = Number(event.target.value) / (key === 'contrast' ? 100 : 1);
        drawFluoro();
      });
    }
    mount.querySelectorAll('[data-fluo-mode]').forEach(button => button.addEventListener('click', () => {
      state.imagingMode = button.dataset.fluoMode;
      drawFluoro();
    }));
    mount.querySelectorAll('[data-fluo-preset]').forEach(button => button.addEventListener('click', () => {
      state.alpha = Number(button.dataset.fluoPreset);
      state.beta = 0;
      mount.querySelector('[data-fluo-alpha]').value = state.alpha;
      mount.querySelector('[data-fluo-beta]').value = 0;
      drawFluoro();
    }));
    mount.querySelector('[data-carotid-fluo]').addEventListener('click', event => {
      const rect = event.currentTarget.getBoundingClientRect();
      const id = hitTestCarotid(hitRegions, (event.clientX - rect.left) * 540 / rect.width, (event.clientY - rect.top) * 440 / rect.height);
      if (id) selectStructure(id);
    });
    mount.querySelectorAll('[data-view-tab]').forEach(button => button.addEventListener('click', () => {
      state.view = button.dataset.viewTab;
      state.selected = null;
      render();
    }));
    mount.querySelectorAll('[data-arch-type]').forEach(button => button.addEventListener('click', () => { state.archType = button.dataset.archType; render(); }));
    mount.querySelectorAll('[data-arch-variant]').forEach(button => button.addEventListener('click', () => { state.archVariant = button.dataset.archVariant; state.selected = null; render(); }));
    mount.querySelectorAll('[data-projection]').forEach(button => button.addEventListener('click', () => { state.projection = button.dataset.projection; render(); }));
    bindStructures();
    const residual = mount.querySelector('[data-nascet-residual]');
    const distal = mount.querySelector('[data-nascet-distal]');
    residual?.addEventListener('input', () => { state.residual = residual.value; updateNascet(); });
    distal?.addEventListener('input', () => { state.distal = distal.value; updateNascet(); });
    mount.querySelector('[data-near-occlusion]')?.addEventListener('change', event => { state.nearOcclusion = event.target.checked; updateNascet(); });
    // Update in place: a full render would replace the range input mid-drag and drop the pointer.
    mount.querySelector('[data-ica-angle]')?.addEventListener('input', event => { state.angle = Number(event.target.value); updateGeometry(); });
    mount.querySelector('[data-coil-course]')?.addEventListener('change', event => { state.coil = event.target.checked; updateGeometry(); });
  }

  function updateGeometry() {
    const lang = getLang();
    const angleValue = mount.querySelector('[data-angle-value]');
    if (angleValue) angleValue.textContent = `${state.angle}°`;
    const geometry = mount.querySelector('[data-tortuosity-class]');
    if (geometry) geometry.textContent = tortuosityClass(state.angle, lang, state.coil);
    const wrap = mount.querySelector('.carotid-anatomy .svg-wrap');
    if (wrap) {
      wrap.innerHTML = `${renderCarotidSvg(state.view, state, lang)}<div class="hover-label" data-hover-label role="status" aria-live="polite"></div>`;
      bindStructures();
    }
    drawFluoro();
  }

  function bindStructures() {
    mount.querySelectorAll('.carotid-structure').forEach(node => {
      node.classList.toggle('selected', node.dataset.structure === state.selected);
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
  }

  // Layout or zoom changes alter the detector's CSS size; redraw at the new backing resolution.
  const onResize = () => drawFluoro();
  window.addEventListener('resize', onResize);

  render();
  return {
    render,
    getState: () => ({ ...state }),
    getDeviceState: () => device?.getState() ?? null,
    getHitRegions: () => hitRegions.map(region => ({ id: region.id, points: region.points.map(p => ({ ...p })), width: region.width })),
    dispose: () => {
      window.removeEventListener('resize', onResize);
      device?.dispose();
      device = null;
      mount.replaceChildren();
    }
  };
}

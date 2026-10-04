// Antianginal map: 3D heart render with determinant hotspots, a qualitative O2 supply/demand
// balance and phenotype vessel insets. Educational mechanism map, not a hemodynamic model.
const HEART_IMAGE = new URL('./assets/pharmacology-heart.webp', import.meta.url).href;
const SVG_NS = 'http://www.w3.org/2000/svg';
const text = (tr, en) => ({ tr, en });

/** Hotspots in the 600x400 map; heart image sits at x150 y10, 292x380 (anterior render). */
const SPOTS = {
  rate: { at: [202, 130], label: text('Sinüs düğümü', 'Sinus node') },
  preload: { at: [202, 88], label: text('Venöz dönüş (SVC)', 'Venous return (SVC)') },
  afterload: { at: [271, 30], label: text('Aort / sistemik direnç', 'Aorta / systemic resistance') },
  contractility: { at: [325, 312], label: text('LV miyokardı', 'LV myocardium') },
  diastolic: { at: [292, 250], label: text('Subendokard (iç duvar)', 'Subendocardium (inner wall)'), internal: true },
  coronary: { at: [371, 268], label: text('Epikardiyal koroner (LAD)', 'Epicardial coronary (LAD)') },
  metabolic: { at: [520, 318], label: text('Miyosit metabolizması', 'Myocyte metabolism') },
};
/** One-line physiology for each determinant, shown when a target is focused. */
const WHY = {
  rate: text('Hız düşünce O₂ talebi azalır ve diyastol uzar; koroner perfüzyon zamanı artar.', 'Lower rate reduces O₂ demand and lengthens diastole, the coronary perfusion window.'),
  contractility: text('Kasılma gücü azalınca miyokard O₂ tüketimi düşer.', 'Lower contractile force reduces myocardial O₂ consumption.'),
  afterload: text('Arteriyel direnç düşünce sistolik duvar gerilimi azalır.', 'Lower arterial resistance reduces systolic wall stress.'),
  preload: text('Venodilatasyon ventrikül hacmini ve diyastolik duvar gerilimini azaltır.', 'Venodilation lowers ventricular volume and diastolic wall stress.'),
  coronary: text('Epikardiyal dilatasyon veya spazmın çözülmesi O₂ arzını artırır.', 'Epicardial dilation or relief of spasm increases O₂ supply.'),
  diastolic: text('Diyastolik gerilim azalınca subendokard damarları daha az sıkışır.', 'Lower diastolic tension compresses subendocardial vessels less.'),
  metabolic: text('Yağ asidinden glukoz oksidasyonuna kayış, O₂ başına daha fazla ATP sağlar.', 'A shift from fatty-acid to glucose oxidation yields more ATP per O₂.'),
};
const DEMAND = ['rate', 'contractility', 'afterload', 'preload', 'diastolic', 'metabolic'];

const MAP_SVG = `<svg class="anginaviz-map" viewBox="0 0 600 400" role="img"><title></title>
  <defs><radialGradient id="anginaviz-glow"><stop offset=".55" stop-color="#e9eef5"/><stop offset="1" stop-color="#e9eef5" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="296" cy="205" rx="200" ry="200" fill="url(#anginaviz-glow)"/>
  <ellipse cx="300" cy="388" rx="120" ry="8" fill="#d3dbe6"/>
  <image href="${HEART_IMAGE}" x="150" y="10" width="292" height="380"/>
  <g class="anginaviz-cell"><line x1="340" y1="300" x2="490" y2="318" stroke="#9aa9bb" stroke-dasharray="4 4"/>
    <rect x="470" y="282" width="110" height="72" rx="30" fill="#f2d6cc" stroke="#b9877a" stroke-width="2"/>
    <ellipse cx="500" cy="306" rx="14" ry="7" fill="#e3a892" stroke="#a96b5b"/><ellipse cx="548" cy="330" rx="14" ry="7" fill="#e3a892" stroke="#a96b5b"/><ellipse cx="510" cy="336" rx="11" ry="6" fill="#e3a892" stroke="#a96b5b"/>
    <circle cx="545" cy="302" r="8" fill="#a07a9a"/><text x="525" y="374" text-anchor="middle" data-anginaviz-cell></text></g>
  <g class="anginaviz-spots"></g>
  <g class="anginaviz-tag"><line/><rect rx="9" height="30"/><text/></g>
</svg>`;

const BALANCE_SVG = `<svg class="anginaviz-balance" viewBox="0 0 600 196" role="img"><title></title>
  <path d="M300 150V52M262 156H338" stroke="#6d7f93" stroke-width="6" stroke-linecap="round"/><path d="M286 52L300 34L314 52Z" fill="#6d7f93"/>
  <g class="anginaviz-beam"><path d="M120 46H480" stroke="#4f6479" stroke-width="6" stroke-linecap="round"/>
    <g class="anginaviz-pan" data-pan="supply"><path d="M120 46L82 104M120 46L158 104" stroke="#8b9bb0" stroke-width="2"/><path d="M70 104H170Q160 128 120 128Q80 128 70 104Z" fill="#cfe3ef" stroke="#5f8aa6" stroke-width="2"/><text x="120" y="150" text-anchor="middle" data-balance-label="supply"/></g>
    <g class="anginaviz-pan" data-pan="demand"><path d="M480 46L442 104M480 46L518 104" stroke="#8b9bb0" stroke-width="2"/><path d="M430 104H530Q520 128 480 128Q440 128 430 104Z" fill="#f3d4c8" stroke="#b46e5c" stroke-width="2"/><text x="480" y="150" text-anchor="middle" data-balance-label="demand"/></g>
  </g></svg>`;

const VESSELS = `<svg class="anginaviz-vessel" viewBox="0 0 260 120" role="img"><title></title>
  <g data-angina-vessel="obstructive"><path d="M10 30H250M10 90H250" stroke="#b46e5c" stroke-width="10"/><rect x="10" y="35" width="240" height="50" fill="#f6dcd2"/>
    <path d="M90 35Q130 78 170 35Z" fill="#e8c46a" stroke="#b8902f" stroke-width="2"/><path d="M20 60H86M174 60H244" stroke="#c0453f" stroke-width="4" stroke-dasharray="10 8"/><path d="M96 66H164" stroke="#c0453f" stroke-width="2" stroke-dasharray="6 6"/></g>
  <g data-angina-vessel="vasospastic"><path d="M10 30H80Q130 52 180 30H250M10 90H80Q130 68 180 90H250" fill="none" stroke="#b46e5c" stroke-width="10"/>
    <path d="M20 60H244" stroke="#c0453f" stroke-width="3" stroke-dasharray="8 7"/><path d="M118 18L130 8L142 18M118 102L130 112L142 102" fill="none" stroke="#5f6f84" stroke-width="2.5"/></g>
  <g data-angina-vessel="microvascular"><path d="M10 60H90" stroke="#b46e5c" stroke-width="16" stroke-linecap="round"/>
    <path d="M90 60Q120 30 160 26M90 60Q130 60 170 62M90 60Q120 90 160 96M160 26L230 14M160 26L226 40M170 62L240 56M170 62L234 76M160 96L232 92M160 96L222 112" fill="none" stroke="#c0453f" stroke-width="5" stroke-linecap="round"/>
    <circle cx="200" cy="62" r="9" fill="none" stroke="#5f6f84" stroke-width="2" stroke-dasharray="3 3"/></g>
</svg>`;

export function createAnginaVisual({ mount, getLang, onFocus }) {
  const t = value => value[getLang() === 'en' ? 'en' : 'tr'];
  const root = document.createElement('div');
  root.className = 'anginaviz';
  root.innerHTML = `${MAP_SVG}<div class="anginaviz-why" aria-live="polite"></div><div class="anginaviz-row">${BALANCE_SVG}<figure>${VESSELS}<figcaption></figcaption></figure></div>`;
  mount.append(root);
  const spots = new Map();
  let state = { targets: [], focus: '', phenotype: 'obstructive', phenotypeTitle: '' };
  for (const [id, spot] of Object.entries(SPOTS)) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', spot.at[0]); dot.setAttribute('cy', spot.at[1]);
    dot.dataset.anginaSpot = id;
    if (spot.internal) dot.setAttribute('stroke-dasharray', '4 3');
    dot.addEventListener('click', () => onFocus?.(id));
    dot.addEventListener('pointerenter', () => drawTag(id));
    dot.addEventListener('pointerleave', () => drawTag(state.focus || state.targets[0]));
    root.querySelector('.anginaviz-spots').append(dot);
    spots.set(id, dot);
  }
  function drawTag(id) {
    const tag = root.querySelector('.anginaviz-tag');
    tag.style.display = id ? '' : 'none';
    if (!id) return;
    const [x, y] = SPOTS[id].at, label = t(SPOTS[id].label);
    const width = label.length * 8.4 + 22, left = x < 300;
    const boxX = left ? Math.max(6, x - width - 34) : Math.min(594 - width, x + 34);
    const boxY = Math.min(Math.max(y - 46, 6), 362);
    const line = tag.querySelector('line');
    line.setAttribute('x1', x); line.setAttribute('y1', y);
    line.setAttribute('x2', left ? boxX + width : boxX); line.setAttribute('y2', boxY + 15);
    const rect = tag.querySelector('rect');
    rect.setAttribute('x', boxX); rect.setAttribute('y', boxY); rect.setAttribute('width', width);
    const node = tag.querySelector('text');
    node.setAttribute('x', boxX + 11); node.setAttribute('y', boxY + 20); node.textContent = label;
  }
  function drawBalance() {
    // Untreated ischemia tips toward demand; each demand-side and supply-side effect levels it.
    const demandHits = state.targets.filter(id => DEMAND.includes(id)).length;
    const supplyHits = state.targets.includes('coronary') ? 1 : 0;
    const angle = Math.max(-4, 12 - demandHits * 5 - supplyHits * 6);
    root.querySelector('.anginaviz-beam').style.transform = `rotate(${angle}deg)`;
    root.querySelectorAll('.anginaviz-pan').forEach(pan => { pan.style.transform = `rotate(${-angle}deg)`; });
    root.querySelector('[data-balance-label=supply]').textContent = `${t(text('O₂ arzı', 'O₂ supply'))}${supplyHits ? ' ↑' : ''}`;
    root.querySelector('[data-balance-label=demand]').textContent = `${t(text('O₂ talebi', 'O₂ demand'))}${demandHits ? ' ↓' : ''}`;
    root.querySelector('.anginaviz-balance title').textContent = t(text('Nitel oksijen arz-talep dengesi', 'Qualitative oxygen supply-demand balance'));
  }
  function render() {
    for (const [id, dot] of spots) {
      const on = state.targets.includes(id), focused = state.focus === id;
      dot.setAttribute('r', focused ? 15 : on ? 12 : 8);
      dot.classList.toggle('is-active', on);
      dot.classList.toggle('is-focus', focused);
    }
    root.querySelector('[data-anginaviz-cell]').textContent = t(text('Miyosit', 'Myocyte'));
    root.querySelector('.anginaviz-cell').classList.toggle('is-active', state.targets.includes('metabolic'));
    drawTag(state.focus || state.targets[0]);
    const focus = state.focus || state.targets[0];
    root.querySelector('.anginaviz-why').textContent = focus ? `${t(SPOTS[focus].label)}: ${t(WHY[focus])}` : '';
    drawBalance();
    root.querySelectorAll('[data-angina-vessel]').forEach(node => { node.style.display = node.dataset.anginaVessel === state.phenotype ? '' : 'none'; });
    root.querySelector('figcaption').textContent = state.phenotypeTitle;
    root.querySelector('.anginaviz-vessel title').textContent = state.phenotypeTitle;
  }
  function update(next) { state = { ...state, ...next }; render(); }
  return { update, setTitle: value => { root.querySelector('.anginaviz-map title').textContent = value; } };
}

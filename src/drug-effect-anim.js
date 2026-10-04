// Inline "show the effect" animations for drug cards. Each card maps to a mechanism scene with
// two states (without / with drug); CSS transitions animate the difference. Qualitative only.
import './drug-effect-anim.css';

const text = (tr, en) => ({ tr, en });
/** card id → [scene, mode, base caption, drug caption, base label, drug label] */
const EFFECTS = {
  acei: ['vessel', '', text('Ang II AT1 üzerinden damarı daraltır: direnç ↑.', 'Ang II constricts the vessel via AT1: resistance ↑.'), text('ACEi Ang II oluşumunu azaltır → damar gevşer, direnç ↓.', 'ACEi lowers Ang II formation → vessel relaxes, resistance ↓.')],
  arb: ['vessel', '', text('Ang II AT1 reseptörünü uyarır: vazokonstriksiyon.', 'Ang II stimulates AT1: vasoconstriction.'), text('ARB AT1’i bloke eder → vazodilatasyon, direnç ↓.', 'ARB blocks AT1 → vasodilation, resistance ↓.')],
  dhp: ['vessel', '', text('L tipi Ca²⁺ girişi düz kası kasar: damar dar.', 'L-type Ca²⁺ entry contracts smooth muscle: narrow vessel.'), text('DHP düz kasta Ca²⁺ girişini azaltır → arteriyel dilatasyon.', 'DHP reduces smooth-muscle Ca²⁺ entry → arterial dilation.')],
  nitrates: ['vessel', '', text('Venöz ve koroner tonus: ön yük yüksek.', 'Venous and coronary tone: preload high.'), text('NO-cGMP düz kası gevşetir → venodilatasyon (ön yük ↓), koroner dilatasyon.', 'NO-cGMP relaxes smooth muscle → venodilation (preload ↓), coronary dilation.')],
  arni: ['vessel', '', text('Ang II daraltır; natriüretik peptidler yıkılır.', 'Ang II constricts; natriuretic peptides are degraded.'), text('Valsartan AT1 ⊣, sakubitril neprilizin ⊣ → dilatasyon ve natriürez.', 'Valsartan blocks AT1, sacubitril blocks neprilysin → dilation and natriuresis.')],
  'hf-beta': ['rate', 'slow', text('Sempatik β1 uyarısı: hız ve kasılma yüksek.', 'Sympathetic β1 drive: high rate and contractility.'), text('β1 blokajı → kalp hızı ↓, diyastol uzar.', 'β1 blockade → heart rate ↓, longer diastole.')],
  demand: ['rate', 'slow', text('Yüksek hız miyokard O₂ talebini artırır.', 'High rate raises myocardial O₂ demand.'), text('Hız düşer → O₂ talebi ↓, perfüzyon süresi ↑.', 'Rate falls → O₂ demand ↓, perfusion time ↑.')],
  'class-ii': ['rate', 'av', text('Sempatik uyarı nodal iletimi hızlandırır.', 'Sympathetic drive speeds nodal conduction.'), text('β blokajı → sinüs hızı ↓, AV iletim yavaşlar (PR ↑).', 'β blockade → sinus rate ↓, slower AV conduction (PR ↑).')],
  receptors: ['rate', 'slow', text('Agonist reseptörü uyarır: yanıt artar.', 'Agonist stimulates the receptor: response rises.'), text('Antagonist reseptörü işgal eder → yanıt azalır (ör. β1 → hız ↓).', 'Antagonist occupies the receptor → response falls (e.g. β1 → rate ↓).')],
  'non-dhp': ['rate', 'av', text('Nodal Ca²⁺ akımı AV iletimini taşır.', 'Nodal Ca²⁺ current carries AV conduction.'), text('Verapamil/diltiazem → AV iletim yavaşlar, hız ↓.', 'Verapamil/diltiazem → slower AV conduction, rate ↓.')],
  'class-iv': ['rate', 'av', text('Nodal Ca²⁺ akımı AV iletimini taşır.', 'Nodal Ca²⁺ current carries AV conduction.'), text('Ca²⁺ kanal blokajı → AV iletim yavaşlar (PR ↑).', 'Ca²⁺ channel blockade → slower AV conduction (PR ↑).')],
  digoxin: ['rate', 'av', text('Normal AV iletim.', 'Normal AV conduction.'), text('Vagal etki → AV iletim yavaşlar; kontraktilite ↑ (Na⁺/K⁺-ATPaz ⊣).', 'Vagal effect → slower AV conduction; contractility ↑ (Na⁺/K⁺-ATPase ⊣).')],
  adenosine: ['rate', 'block', text('Her P dalgasını QRS izler.', 'Every P wave is followed by QRS.'), text('Adenozin AV düğümü kısa süre bloke eder → geçici AV blok.', 'Adenosine transiently blocks the AV node → brief AV block.')],
  loop: ['tubule', 'NKCC2', text('NKCC2 Na⁺, K⁺, 2Cl⁻ geri emer.', 'NKCC2 reabsorbs Na⁺, K⁺, 2Cl⁻.'), text('NKCC2 ⊣ → Na⁺ lümende kalır → idrar ↑ (güçlü natriürez).', 'NKCC2 blocked → Na⁺ stays in lumen → urine ↑ (strong natriuresis).')],
  thiazide: ['tubule', 'NCC', text('NCC Na⁺ ve Cl⁻ geri emer.', 'NCC reabsorbs Na⁺ and Cl⁻.'), text('NCC ⊣ → Na⁺ idrara gider (orta natriürez).', 'NCC blocked → Na⁺ goes to urine (moderate natriuresis).')],
  enac: ['tubule', 'ENaC', text('ENaC Na⁺ geri emer, K⁺ atılımını sürer.', 'ENaC reabsorbs Na⁺ and drives K⁺ secretion.'), text('ENaC ⊣ → Na⁺ atılır, K⁺ korunur.', 'ENaC blocked → Na⁺ excreted, K⁺ spared.')],
  mra: ['tubule', 'MR → ENaC', text('Aldosteron MR üzerinden Na⁺ geri emilimini artırır.', 'Aldosterone raises Na⁺ reabsorption via MR.'), text('MR ⊣ → Na⁺ atılır, K⁺ korunur; fibrozis sinyali ↓.', 'MR blocked → Na⁺ excreted, K⁺ spared; fibrosis signaling ↓.')],
  sglt2: ['tubule', 'SGLT2', text('SGLT2 glukoz ve Na⁺ geri emer.', 'SGLT2 reabsorbs glucose and Na⁺.'), text('SGLT2 ⊣ → glukozüri ve natriürez.', 'SGLT2 blocked → glucosuria and natriuresis.')],
  clearance: ['window', 'clearance', text('Normal klirens: düzey pencerede kalır.', 'Normal clearance: level stays in the window.'), text('Klirens ↓ (ör. böbrek işlevi) → birikim, toksik bölgeye taşma.', 'Clearance ↓ (e.g. renal function) → accumulation into the toxic zone.'), text('Normal klirens', 'Normal clearance'), text('Azalmış klirens', 'Reduced clearance')],
  'therapeutic-window': ['window', 'narrow', text('Düzey etkili pencerede.', 'Level within the effective window.'), text('Dar pencere: küçük artış toksik bölgeye taşır.', 'Narrow window: a small rise reaches the toxic zone.'), text('Pencerede', 'In window'), text('Taşma', 'Overshoot')],
  'interaction-model': ['window', 'interaction', text('Tek ilaç: düzey pencerede.', 'Single drug: level within the window.'), text('Metabolizma inhibitörü eklenir → düzey ↑, toksisite riski.', 'Metabolic inhibitor added → level ↑, toxicity risk.'), text('Tek ilaç', 'Single drug'), text('İnhibitör eklendi', 'Inhibitor added')],
  'class-i': ['ap', 'na', text('Hızlı Na⁺ girişi: dik faz 0.', 'Fast Na⁺ entry: steep phase 0.'), text('Na⁺ kanal blokajı → faz 0 eğimi ↓, iletim yavaşlar (QRS ↑).', 'Na⁺ channel blockade → phase 0 slope ↓, slower conduction (QRS ↑).')],
  'class-iii': ['ap', 'k', text('K⁺ akımları repolarize eder.', 'K⁺ currents repolarize.'), text('K⁺ kanal blokajı → AP süresi ↑, refrakterlik ↑ (QT ↑).', 'K⁺ channel blockade → AP duration ↑, refractoriness ↑ (QT ↑).')],
  ranolazine: ['ap', 'late', text('Geç Na⁺ akımı platoyu uzatır, Na⁺/Ca²⁺ yükü ↑.', 'Late Na⁺ current prolongs the plateau, Na⁺/Ca²⁺ load ↑.'), text('Geç Na⁺ ⊣ → Ca²⁺ yükü ve diyastolik gerilim ↓.', 'Late Na⁺ blocked → Ca²⁺ load and diastolic tension ↓.')],
  'action-potential': ['ap', 'na', text('Ventriküler AP: faz 0 Na⁺.', 'Ventricular AP: phase 0 Na⁺.'), text('Na⁺ blokajında faz 0 yavaşlar.', 'Phase 0 slows with Na⁺ blockade.')],
  antiplatelet: ['clot', 'platelet', text('Aktive trombositler kümelenir.', 'Activated platelets aggregate.'), text('P2Y12/COX ⊣ → trombosit kümelenmesi ↓.', 'P2Y12/COX blocked → platelet aggregation ↓.')],
  heparin: ['clot', 'fibrin', text('Trombin fibrinojeni fibrine çevirir: ağ oluşur.', 'Thrombin converts fibrinogen to fibrin: a mesh forms.'), text('Antitrombin aracılı Xa/IIa ⊣ → fibrin ağı oluşmaz.', 'Antithrombin-mediated Xa/IIa inhibition → no fibrin mesh.')],
  'oral-anticoag': ['clot', 'fibrin', text('Pıhtılaşma kaskadı fibrin üretir.', 'The coagulation cascade produces fibrin.'), text('Xa/IIa ⊣ veya vitamin K ⊣ → fibrin oluşumu ↓.', 'Xa/IIa or vitamin K inhibition → fibrin formation ↓.')],
  fibrinolytic: ['clot', 'lyse', text('Oluşmuş fibrin pıhtısı damarı tıkar.', 'An established fibrin clot occludes the vessel.'), text('Plazminojen → plazmin → fibrin çözülür.', 'Plasminogen → plasmin → fibrin dissolves.')],
  statin: ['receptor', '', text('LDL-R az: LDL dolaşımda kalır.', 'Few LDL-R: LDL stays in circulation.'), text('Hepatik kolesterol ↓ → LDL-R ↑ → LDL temizlenir.', 'Hepatic cholesterol ↓ → LDL-R ↑ → LDL cleared.')],
  pcsk9: ['receptor', '', text('PCSK9 LDL-R’yi yıkıma yollar.', 'PCSK9 sends LDL-R to degradation.'), text('PCSK9 ⊣ → LDL-R geri döner, LDL temizlenir.', 'PCSK9 blocked → LDL-R recycles, LDL cleared.')],
  ezetimibe: ['tubule', 'NPC1L1', text('NPC1L1 bağırsakta kolesterol emer.', 'NPC1L1 absorbs intestinal cholesterol.'), text('NPC1L1 ⊣ → kolesterol emilimi ↓, dışkıyla atılır.', 'NPC1L1 blocked → absorption ↓, lost in stool.')],
};

const SCENES = {
  vessel: () => `<svg viewBox="0 0 320 130"><rect width="320" height="130" rx="12" class="fx-bg"/>
    <g class="fx-wall fx-wall-top"><rect x="10" y="14" width="300" height="22" rx="8"/><g class="fx-muscle">${[30, 70, 110, 150, 190, 230, 270].map(x => `<ellipse cx="${x}" cy="25" rx="14" ry="6"/>`).join('')}</g></g>
    <g class="fx-wall fx-wall-bottom"><rect x="10" y="94" width="300" height="22" rx="8"/><g class="fx-muscle">${[30, 70, 110, 150, 190, 230, 270].map(x => `<ellipse cx="${x}" cy="105" rx="14" ry="6"/>`).join('')}</g></g>
    <g class="fx-cells">${[0, 1, 2, 3, 4, 5].map(i => `<ellipse class="fx-cell" style="animation-delay:-${i * 0.5}s" cx="0" cy="${58 + (i % 3) * 8}" rx="9" ry="5"/>`).join('')}</g>
    <text x="160" y="126" class="fx-tag" text-anchor="middle"></text></svg>`,
  rate: mode => {
    const beat = (x, pr) => `M${x} 60h10q6 -8 12 0h${pr}l4 6l6 -40l6 48l4 -14h14q10 -14 20 0`;
    const strip = (gap, pr, drop) => Array.from({ length: 8 }, (_, i) => drop && i % 3 === 2 ? `M${i * gap} 60h10q6 -8 12 0h${gap - 22}` : beat(i * gap, pr)).join(' ');
    const slowGap = mode === 'block' ? 80 : mode === 'av' ? 105 : 100;
    const fast = strip(70, 10, false), slow = mode === 'block' ? strip(80, 10, true) : strip(slowGap, mode === 'slow' ? 10 : 30, false);
    return `<svg viewBox="0 0 320 130"><rect width="320" height="130" rx="12" class="fx-bg"/>
      <path class="fx-heart" d="M50 48c-10-16-34-10-30 10 3 14 30 32 30 32s27-18 30-32c4-20-20-26-30-10z"/>
      <svg x="100" y="20" width="210" height="80" viewBox="0 0 210 80"><g class="fx-strip fx-strip-base" style="--shift:-210px"><path d="${fast}"/></g><g class="fx-strip fx-strip-drug" style="--shift:-${slowGap * 3}px"><path d="${slow}"/></g></svg>
      <text x="205" y="120" class="fx-tag" text-anchor="middle"></text></svg>`;
  },
  tubule: mode => `<svg viewBox="0 0 320 130"><rect width="320" height="130" rx="12" class="fx-bg"/>
    <rect x="10" y="20" width="300" height="44" rx="16" class="fx-lumen"/><rect x="10" y="64" width="300" height="46" class="fx-cellrow"/>
    <g class="fx-transporter"><rect x="140" y="56" width="40" height="18" rx="6"/><text x="160" y="90" text-anchor="middle" class="fx-small">${mode}</text></g>
    <g class="fx-plug"><circle cx="180" cy="56" r="9"/><path d="M175 51l10 10m0-10l-10 10"/></g>
    ${[0, 1, 2, 3, 4].map(i => `<circle class="fx-ion fx-absorb" style="animation-delay:-${i * 0.6}s" r="5"/><circle class="fx-ion fx-urine" style="animation-delay:-${i * 0.6}s" r="5"/>`).join('')}
    <text x="300" y="16" text-anchor="end" class="fx-small fx-urine-label"></text><text x="160" y="124" class="fx-tag" text-anchor="middle"></text></svg>`,
  clot: mode => `<svg viewBox="0 0 320 130"><rect width="320" height="130" rx="12" class="fx-bg"/><rect x="10" y="18" width="300" height="94" rx="20" class="fx-lumen"/>
    ${mode === 'platelet' ? [0, 1, 2, 3, 4, 5, 6, 7].map(i => `<ellipse class="fx-platelet" style="--dx:${(160 - (40 + i * 32)) * 0.75}px;--dy:${(65 - (36 + (i % 3) * 26)) * 0.75}px" cx="${40 + i * 32}" cy="${36 + (i % 3) * 26}" rx="9" ry="5"/>`).join('')
      : `<g class="fx-fibrin">${[0, 1, 2, 3, 4, 5].map(i => `<path pathLength="100" d="M${60 + i * 30} 24 C${90 + i * 20} 60 ${70 + i * 25} 80 ${110 + i * 22} 106"/>`).join('')}<path pathLength="100" d="M40 50C120 80 200 30 280 70"/><path pathLength="100" d="M40 90C120 60 200 100 280 50"/></g>
        ${[0, 1, 2, 3, 4].map(i => `<ellipse class="fx-rbc" cx="${90 + i * 36}" cy="${50 + (i % 2) * 26}" rx="10" ry="6"/>`).join('')}`}
    <text x="160" y="126" class="fx-tag" text-anchor="middle"></text></svg>`,
  window: mode => {
    const base = mode === 'clearance' ? 'M20 100 C40 40 60 50 80 70 C100 45 120 50 140 70 C160 45 180 50 200 70 C220 45 240 50 260 70 C280 45 300 50 310 62'
      : 'M20 100 C50 40 90 50 120 66 C150 52 190 54 220 66 C250 52 290 54 310 64';
    const drug = mode === 'clearance' ? 'M20 100 C40 40 60 44 80 58 C100 30 120 34 140 46 C160 20 180 24 200 34 C220 14 240 18 260 24 C280 10 300 14 310 16'
      : mode === 'narrow' ? 'M20 100 C50 40 90 44 120 52 C150 30 190 32 220 36 C250 26 290 26 310 28'
        : 'M20 100 C50 40 90 50 120 66 C140 50 160 34 190 30 C220 24 260 22 310 20';
    return `<svg viewBox="0 0 320 130"><rect width="320" height="130" rx="12" class="fx-bg"/>
      <rect x="20" y="${mode === 'narrow' ? 52 : 44}" width="290" height="${mode === 'narrow' ? 18 : 34}" class="fx-band"/><rect x="20" y="8" width="290" height="${mode === 'narrow' ? 44 : 36}" class="fx-toxic"/>
      <path d="M20 8V110H310" class="fx-axis"/><path pathLength="100" class="fx-curve fx-curve-base" d="${base}"/><path pathLength="100" class="fx-curve fx-curve-drug" d="${drug}"/>
      <text x="300" y="22" text-anchor="end" class="fx-small fx-toxic-label"></text><text x="300" y="${mode === 'narrow' ? 64 : 64}" text-anchor="end" class="fx-small fx-band-label"></text>
      <text x="160" y="124" class="fx-tag" text-anchor="middle"></text></svg>`;
  },
  ap: mode => {
    const base = 'M20 100H70L76 22L92 36L200 40Q228 46 246 100H310';
    const drug = { na: 'M20 100H70L90 30L104 40L206 44Q232 50 252 100H310', k: 'M20 100H70L76 22L92 36L248 40Q276 46 296 100H310', late: 'M20 100H70L76 22L92 36L184 42Q210 50 230 100H310' }[mode];
    return `<svg viewBox="0 0 320 130"><rect width="320" height="130" rx="12" class="fx-bg"/><path d="M20 8V110H310" class="fx-axis"/>
      <path pathLength="100" class="fx-curve fx-curve-base" d="${base}"/><path pathLength="100" class="fx-curve fx-curve-drug" d="${drug}"/>
      <text x="160" y="124" class="fx-tag" text-anchor="middle"></text></svg>`;
  },
  receptor: () => `<svg viewBox="0 0 320 130"><rect width="320" height="130" rx="12" class="fx-bg"/><rect x="10" y="10" width="300" height="40" rx="10" class="fx-liver"/>
    ${[40, 80, 120, 160, 200, 240, 280].map((x, i) => `<path class="fx-ldlr ${i % 2 ? 'fx-extra' : ''}" d="M${x} 50v10m0 0l-6 8m6 -8l6 8"/>`).join('')}
    <rect x="10" y="74" width="300" height="44" rx="18" class="fx-lumen"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<circle class="fx-ldl ${i % 2 ? 'fx-cleared' : ''}" style="--i:${i}" cx="${30 + i * 36}" cy="${90 + (i % 2) * 12}" r="6"/>`).join('')}
    <text x="160" y="126" class="fx-tag" text-anchor="middle"></text></svg>`,
};

export function hasEffect(cardId) { return Boolean(EFFECTS[cardId]); }

export function effectMarkup(cardId, lang, state = 'drug') {
  const effect = EFFECTS[cardId];
  if (!effect) return '';
  const [scene, mode, baseText, drugText, baseLabel, drugLabel] = effect;
  const t = value => value[lang === 'en' ? 'en' : 'tr'];
  const labels = [baseLabel ? t(baseLabel) : t(text('İlaçsız', 'Without drug')), drugLabel ? t(drugLabel) : t(text('İlaçla', 'With drug'))];
  return `<div class="fxanim fx-${scene} is-${state}" data-fx-card="${cardId}" data-fx-scene="${scene}">
    <div class="fx-toggle" role="group">${['base', 'drug'].map((value, i) => `<button type="button" data-fx-state="${value}" aria-pressed="${state === value}">${labels[i]}</button>`).join('')}</div>
    ${SCENES[scene](mode)}<p class="fx-caption fx-caption-base">${t(baseText)}</p><p class="fx-caption fx-caption-drug">${t(drugText)}</p></div>`;
}

/** Fill per-scene tags and wire the toggle; call after the markup is in the DOM. */
export function activateEffect(node, lang, onState) {
  if (!node) return;
  const t = value => value[lang === 'en' ? 'en' : 'tr'];
  const tags = { vessel: text('kan akışı →', 'blood flow →'), rate: text('şematik ritim', 'schematic rhythm'), tubule: text('tübül lümeni → idrar', 'tubular lumen → urine'), clot: text('damar lümeni', 'vessel lumen'), window: text('plazma düzeyi (zaman →)', 'plasma level (time →)'), ap: text('aksiyon potansiyeli (gri: başlangıç)', 'action potential (grey: baseline)'), receptor: text('karaciğer LDL-R / dolaşımdaki LDL', 'liver LDL-R / circulating LDL') };
  node.querySelector('.fx-tag').textContent = t(tags[node.dataset.fxScene]);
  node.querySelector('.fx-urine-label')?.replaceChildren(t(text('idrar →', 'urine →')));
  node.querySelector('.fx-toxic-label')?.replaceChildren(t(text('toksik', 'toxic')));
  node.querySelector('.fx-band-label')?.replaceChildren(t(text('terapötik', 'therapeutic')));
  node.addEventListener('click', event => {
    const button = event.target.closest('[data-fx-state]');
    if (!button) return;
    event.stopPropagation();
    node.classList.toggle('is-drug', button.dataset.fxState === 'drug');
    node.classList.toggle('is-base', button.dataset.fxState === 'base');
    node.querySelectorAll('[data-fx-state]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    onState?.(node.dataset.fxCard, button.dataset.fxState);
  });
}

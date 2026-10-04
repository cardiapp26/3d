const TARGETS = {
  lv: ['Sol ventrikül', 'Left ventricle', 'İnotropi, ard yük ve ventriküler elektriksel aktivite.', 'Contractility, afterload and ventricular electrical activity.'],
  sa: ['Sinüs düğümü', 'Sinus node', 'Kalp hızı: otonom tonus ve pacemaker akımları.', 'Heart rate: autonomic tone and pacemaker currents.'],
  av: ['AV düğüm', 'AV node', 'Atriyumdan ventriküle iletim; kalsiyuma bağımlı nodal aktivite.', 'Atrial-to-ventricular conduction; calcium-dependent nodal activity.'],
  coronaries: ['Koroner damarlar', 'Coronary vessels', 'Miyokardın oksijen sunumu ve gereksinimi arasındaki denge.', 'Balance between myocardial oxygen supply and demand.'],
  aorta: ['Arteriyel damar yatağı', 'Arterial circulation', 'Damar tonusu ve sistemik direnç, kalbin ard yükünü etkiler.', 'Vascular tone and systemic resistance affect cardiac afterload.'],
  la: ['Atriyum', 'Atrium', 'Atriyal elektriksel aktivite ve ritim kontrolü.', 'Atrial electrical activity and rhythm control.'],
  kidney: ['Böbrek', 'Kidney', 'Sodyum, su ve elektrolit dengesi; renin-anjiyotensin-aldosteron sistemi.', 'Sodium, water and electrolyte balance; renin-angiotensin-aldosterone system.'],
  platelet: ['Trombosit / pıhtı', 'Platelet / clot', 'Trombosit aktivasyonu ve koagülasyon farklı ilaç hedefleridir.', 'Platelet activation and coagulation are distinct drug targets.'],
  liver: ['Karaciğer', 'Liver', 'Lipid metabolizması ve birçok ilacın metabolik dönüşümü.', 'Lipid metabolism and metabolic processing of many drugs.'],
  intestine: ['İnce bağırsak', 'Small intestine', 'Ezetimib, bağırsak fırçamsı kenarındaki NPC1L1 üzerinden kolesterol emilimini azaltır.', 'Ezetimibe reduces cholesterol absorption through NPC1L1 at the intestinal brush border.'],
};

/** Educational, schematic target map; no physiologic or patient simulation. */
export function createPharmacologyVisual({ mount, getLang = () => 'tr', onSelect }) {
  let active = 'lv';
  let focusedCard = '';
  let signal = 'ventricular';
  const root = document.createElement('section');
  root.className = 'pharmaviz';
  root.innerHTML = `<div class="pharmaviz-heading"><span class="pharmaviz-eyebrow"></span><h2></h2></div>
    <svg class="pharmaviz-map" viewBox="0 0 640 470" role="img" aria-labelledby="pharmaviz-title">
      <title id="pharmaviz-title">Drug target map</title>
      <defs><linearGradient id="pharmaviz-heart" x2="1" y2="1"><stop stop-color="#eea090"/><stop offset="1" stop-color="#c45c53"/></linearGradient></defs>
      <rect x="1" y="1" width="638" height="468" rx="32" fill="#f4f5ec"/>
      <circle cx="323" cy="235" r="175" fill="#e2ebda"/>
      <path d="M327 169 C320 123 351 86 397 81 L430 83 M349 114 L350 51 M379 89 L390 45 M410 83 L429 45" stroke="#bb7264" stroke-width="24" fill="none" stroke-linecap="round"/>
      <path d="M285 154 C245 132 208 149 195 184 C171 244 226 318 314 380 C384 342 435 275 419 210 C408 161 366 140 327 169 C307 139 300 141 285 154Z" fill="url(#pharmaviz-heart)" stroke="#a9534c" stroke-width="3"/>
      <path d="M324 190 C291 237 299 293 314 358 M329 207 C363 222 383 250 395 285 M310 247 L261 282 M343 216 L373 187" stroke="#f7dfba" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M246 163 L248 102 M232 111 L272 111" stroke="#789d99" stroke-width="22" stroke-linecap="round"/>
      <path d="M303 193 Q270 196 268 235 Q288 247 315 222" fill="#eab0a2" stroke="#af6459" stroke-width="2"/>
      <path d="M347 253 Q375 285 321 344 Q299 291 321 253Z" fill="#b9544d" opacity=".65"/>
      <path d="M79 279 C49 258 42 291 48 317 C58 348 83 348 88 326 L75 309 C92 299 94 288 79 279Z" fill="#ba8371"/>
      <path d="M548 309 C521 275 482 288 483 315 C510 344 554 338 578 316 L581 287Z" fill="#bd8970"/>
      <path d="M487 374 Q515 358 545 373 Q566 389 540 400 Q503 412 490 393 Q481 380 516 382 Q548 384 535 393" fill="none" stroke="#bf9476" stroke-width="12" stroke-linecap="round"/>
      <g fill="#b9a978" stroke="#8f8455" stroke-width="2"><circle cx="541" cy="174" r="19"/><circle cx="565" cy="185" r="14"/><circle cx="554" cy="151" r="12"/></g>
      <g class="pharmaviz-node-dots"></g>
    </svg>
    <div class="pharmaviz-targets" role="group"></div>
    <div class="pharmaviz-detail" aria-live="polite"><strong></strong><p></p><small></small></div>
    <div class="pharmaviz-signal"><div class="pharmaviz-signal-tabs" role="group"></div>
      <svg viewBox="0 0 600 150" role="img"><title></title><path d="M35 15 V120 H580" fill="none" stroke="#a7b4a0" stroke-width="2"/>
        <path class="pharmaviz-signal-line" fill="none" stroke="#55785d" stroke-width="4" stroke-linejoin="round"/>
        <text x="45" y="145" fill="#65715e" font-size="12" class="pharmaviz-time"></text>
        <text x="55" y="23" fill="#65715e" font-size="12" class="pharmaviz-voltage"></text>
      </svg><p class="pharmaviz-signal-caption"></p>
    </div>`;
  mount.append(root);
  const positions = { lv: [356, 297], sa: [245, 157], av: [287, 218], coronaries: [366, 242], aorta: [369, 91], la: [370, 179], kidney: [70, 308], platelet: [548, 171], liver: [531, 311], intestine: [526, 390] };
  const buttons = new Map();
  const dots = new Map();
  const lang = () => getLang() === 'en' ? 'en' : 'tr';
  const t = (tr, en) => lang() === 'en' ? en : tr;
  for (const [id, position] of Object.entries(positions)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pharmaviz-target';
    button.dataset.target = id;
    button.addEventListener('click', () => { setTarget(id); onSelect?.(id); });
    root.querySelector('.pharmaviz-targets').append(button);
    buttons.set(id, button);
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', position[0]);
    dot.setAttribute('cy', position[1]);
    dot.setAttribute('r', '9');
    dot.setAttribute('stroke', '#fff9e9');
    dot.setAttribute('stroke-width', '3');
    dot.setAttribute('fill', '#496c53');
    dot.style.cursor = 'pointer';
    dot.addEventListener('click', () => { setTarget(id); onSelect?.(id); });
    root.querySelector('.pharmaviz-node-dots').append(dot);
    dots.set(id, dot);
  }
  const signalButtons = {};
  for (const id of ['ventricular', 'nodal']) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pharmaviz-signal-tab';
    button.addEventListener('click', () => { signal = id; refresh(); });
    root.querySelector('.pharmaviz-signal-tabs').append(button);
    signalButtons[id] = button;
  }
  function setTarget(target, cardName = '') {
    if (!TARGETS[target]) return;
    active = target;
    focusedCard = String(cardName || '');
    if (target === 'sa' || target === 'av') signal = 'nodal';
    else if (target === 'lv' || target === 'la') signal = 'ventricular';
    refresh();
  }
  function refresh() {
    root.querySelector('.pharmaviz-eyebrow').textContent = t('İLAÇ HEDEFLERİ', 'DRUG TARGETS');
    root.querySelector('h2').textContent = t('Etki nerede başlar?', 'Where does the effect begin?');
    root.querySelector('.pharmaviz-map title').textContent = t('Kalp, damar ve organ ilaç hedefleri şeması', 'Schematic heart, vessel and organ drug targets');
    for (const [id, button] of buttons) {
      button.textContent = TARGETS[id][lang() === 'en' ? 1 : 0];
      button.setAttribute('aria-pressed', String(active === id));
      button.classList.toggle('is-active', active === id);
      dots.get(id).setAttribute('r', active === id ? '14' : '8');
      dots.get(id).setAttribute('fill', active === id ? '#d6a048' : '#496c53');
    }
    root.querySelector('.pharmaviz-detail strong').textContent = TARGETS[active][lang() === 'en' ? 1 : 0];
    root.querySelector('.pharmaviz-detail p').textContent = TARGETS[active][lang() === 'en' ? 3 : 2];
    root.querySelector('.pharmaviz-detail small').textContent = focusedCard
      ? t(`Seçili ilaç: ${focusedCard}. Konum, etki hedefini gösterir.`, `Selected drug: ${focusedCard}. Location indicates its effect target.`)
      : t('Kavramsal harita; anatomik ölçek veya hasta simülasyonu değildir.', 'Conceptual map; not anatomical scale or a patient simulation.');
    signalButtons.ventricular.textContent = t('Ventriküler hücre', 'Ventricular cell');
    signalButtons.nodal.textContent = t('Nodal hücre', 'Nodal cell');
    for (const [id, button] of Object.entries(signalButtons)) button.setAttribute('aria-pressed', String(signal === id));
    root.querySelector('.pharmaviz-signal-line').setAttribute('d', signal === 'ventricular'
      ? 'M45 110 H125 L133 22 L155 43 L270 49 Q310 53 333 108 H440 L448 22 L470 43 L570 49'
      : 'M45 112 Q100 108 150 80 Q169 24 190 26 Q225 35 250 111 Q305 107 355 79 Q374 23 395 26 Q430 35 455 111 Q510 107 565 80');
    root.querySelector('.pharmaviz-signal svg title').textContent = t('Kavramsal aksiyon potansiyeli', 'Conceptual action potential');
    root.querySelector('.pharmaviz-time').textContent = t('Zaman → (ölçeksiz)', 'Time → (not to scale)');
    root.querySelector('.pharmaviz-voltage').textContent = t('Membran potansiyeli (şematik)', 'Membrane potential (schematic)');
    root.querySelector('.pharmaviz-signal-caption').textContent = signal === 'ventricular'
      ? t('Hızlı yükseliş: Na⁺; plato: Ca²⁺ / K⁺ dengesi; repolarizasyon: K⁺. Eğri eğitim amaçlıdır, ölçüm değildir.', 'Rapid upstroke: Na⁺; plateau: Ca²⁺ / K⁺ balance; repolarization: K⁺. Educational curve, not measured data.')
      : t('Spontan diyastolik depolarizasyon; yükselişte Ca²⁺, repolarizasyonda K⁺. Sinüs ve AV düğüm aynı işlevi görmez. Eğri şematiktir.', 'Spontaneous diastolic depolarization; Ca²⁺ upstroke and K⁺ repolarization. Sinus and AV nodes have different functions. Schematic curve.');
  }
  function setTopic(topicId) {
    const topics = { antiarrhythmics: 'av', heartfailure: 'lv', 'heart-failure': 'lv', antihypertensives: 'aorta', hypertension: 'aorta', antianginals: 'coronaries', ischemia: 'coronaries', antithrombotics: 'platelet', thrombosis: 'platelet', lipids: 'liver', diuretics: 'kidney' };
    if (topics[topicId]) setTarget(topics[topicId]);
  }
  refresh();
  return { setTarget, setTopic, refresh };
}

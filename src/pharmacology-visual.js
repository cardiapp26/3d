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

/** Anterior render of the app's own 3D heart model (scripts/render-pharmacology-heart.cjs). */
const HEART_IMAGE = new URL('./assets/pharmacology-heart.webp', import.meta.url).href;
/** Targets inside the heart (not on the anterior surface) get a dashed ring. */
const INTERNAL_TARGETS = new Set(['av']);

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
      <ellipse cx="316" cy="240" rx="175" ry="205" fill="#e6eedd"/>
      <ellipse cx="322" cy="438" rx="130" ry="10" fill="#cfd8c4" opacity=".7"/>
      <image class="pharmaviz-organ" data-organ="heart" href="${HEART_IMAGE}" x="160" y="30" width="311" height="405"/>
      <path class="pharmaviz-organ" data-organ="kidney" d="M95 280C60 280 50 325 60 355C70 390 115 395 125 365C130 350 112 340 112 325C112 310 130 300 125 290C120 282 108 280 95 280Z" fill="#b97a6a"/>
      <path d="M112 325Q100 325 94 320" stroke="#e7c4b6" stroke-width="3" fill="none"/>
      <path class="pharmaviz-organ" data-organ="liver" transform="translate(24 0)" d="M478 270C500 240 600 238 615 262C620 292 588 322 548 330C512 336 484 312 478 270Z" fill="#9c5a4c"/>
      <path class="pharmaviz-organ" data-organ="intestine" transform="translate(24 0)" d="M488 392Q500 370 528 376Q556 382 552 400Q548 418 520 414Q500 410 508 396Q518 386 534 396M552 400Q572 404 590 390" fill="none" stroke="#d3a07f" stroke-width="13" stroke-linecap="round"/>
      <g class="pharmaviz-organ" data-organ="platelet" transform="translate(24 0)" fill="#d9c58c" stroke="#a39256" stroke-width="2"><ellipse cx="530" cy="122" rx="20" ry="9"/><ellipse cx="572" cy="110" rx="16" ry="8" transform="rotate(-20 572 110)"/><ellipse cx="560" cy="146" rx="18" ry="8" transform="rotate(15 560 146)"/><path d="M515 160Q545 150 585 168" stroke="#b8a46a" fill="none"/></g>
      <g class="pharmaviz-organ-labels" font-size="17" fill="#4d6150" text-anchor="middle"></g>
      <g class="pharmaviz-leader"><line/><rect rx="9" height="32"/><text/></g>
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
  const positions = { lv: [358, 306], sa: [215, 158], av: [243, 259], coronaries: [396, 306], aorta: [289, 52], la: [365, 192], kidney: [92, 332], platelet: [572, 130], liver: [572, 285], intestine: [548, 398] };
  /** Always-visible organ captions (outside the heart); heart targets get a leader tag when active. */
  const ORGAN_LABELS = { kidney: [92, 418], liver: [572, 352], intestine: [564, 445], platelet: [574, 190] };
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
    dot.addEventListener('pointerenter', () => drawLeader(id));
    dot.addEventListener('pointerleave', () => drawLeader(active));
    dot.classList.add('pharmaviz-dot');
    if (INTERNAL_TARGETS.has(id)) dot.setAttribute('stroke-dasharray', '4 3');
    root.querySelector('.pharmaviz-node-dots').append(dot);
    dots.set(id, dot);
  }
  for (const [id, [x, y]] of Object.entries(ORGAN_LABELS)) {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x); label.setAttribute('y', y); label.dataset.organLabel = id;
    root.querySelector('.pharmaviz-organ-labels').append(label);
  }
  root.querySelectorAll('.pharmaviz-organ').forEach(shape => {
    const id = shape.dataset.organ === 'heart' ? 'lv' : shape.dataset.organ;
    shape.addEventListener('click', () => { setTarget(id); onSelect?.(id); });
  });
  function drawLeader(id) {
    const [x, y] = positions[id];
    const text = TARGETS[id][lang() === 'en' ? 1 : 0];
    const width = text.length * 9 + 24;
    const toRight = x < 320;
    const boxX = toRight ? Math.max(12, x - width - 40) : Math.min(628 - width, x + 40);
    const boxY = Math.min(Math.max(y - 58, 10), 424);
    const leader = root.querySelector('.pharmaviz-leader');
    leader.style.display = ORGAN_LABELS[id] ? 'none' : '';
    const line = leader.querySelector('line');
    line.setAttribute('x1', x); line.setAttribute('y1', y);
    line.setAttribute('x2', boxX + (toRight ? width : 0)); line.setAttribute('y2', boxY + 16);
    const rect = leader.querySelector('rect');
    rect.setAttribute('x', boxX); rect.setAttribute('y', boxY); rect.setAttribute('width', width);
    const label = leader.querySelector('text');
    label.setAttribute('x', boxX + 12); label.setAttribute('y', boxY + 22); label.textContent = text;
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
    root.querySelectorAll('[data-organ-label]').forEach(node => {
      node.textContent = TARGETS[node.dataset.organLabel][lang() === 'en' ? 1 : 0];
      node.classList.toggle('is-active', node.dataset.organLabel === active);
    });
    root.querySelectorAll('.pharmaviz-organ').forEach(shape => {
      shape.classList.toggle('is-active', (shape.dataset.organ === 'heart' ? ['lv', 'sa', 'av', 'coronaries', 'la'].includes(active) : shape.dataset.organ === active));
    });
    drawLeader(active);
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

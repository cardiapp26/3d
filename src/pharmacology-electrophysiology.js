const PHASES = {
  ventricular: {
    0: ['Hızlı Na⁺ girişi', 'Rapid Na⁺ influx'],
    1: ['Erken repolarizasyon: geçici dışa K⁺ akımı', 'Early repolarization: transient outward K⁺ current'],
    2: ['Plato: içe Ca²⁺ ve dışa K⁺ akımlarının dengesi', 'Plateau: balance of inward Ca²⁺ and outward K⁺ currents'],
    3: ['Repolarizasyon: dışa K⁺ akımları', 'Repolarization: outward K⁺ currents'],
    4: ['Kararlı dinlenim potansiyeli', 'Stable resting potential'],
  },
  nodal: {
    0: ['Yükseliş: başlıca L tipi Ca²⁺ girişi', 'Upstroke: mainly L-type Ca²⁺ influx'],
    3: ['Repolarizasyon: dışa K⁺ akımları', 'Repolarization: outward K⁺ currents'],
    4: ['Spontan depolarizasyon: If ve Ca²⁺ akımları; otonom düzenleme', 'Spontaneous depolarization: If and Ca²⁺ currents; autonomic regulation'],
  },
};
const CLASSES = {
  I: ['Na⁺ kanal blokajı', 'Na⁺ channel blockade', 'ventricular', 0, 'Na⁺', 'in'],
  II: ['β blokajı: nodal otomatiklik ve iletim', 'β blockade: nodal automaticity and conduction', 'nodal', 4, 'β₁', 'signal'],
  III: ['K⁺ kanal blokajı: repolarizasyon uzaması', 'K⁺ channel blockade: prolonged repolarization', 'ventricular', 3, 'K⁺', 'out'],
  IV: ['Verapamil / diltiazem: nodal Ca²⁺ blokajı', 'Verapamil / diltiazem: nodal Ca²⁺ blockade', 'nodal', 0, 'Ca²⁺', 'in'],
};

export function createPharmacologyElectrophysiology({ mount, getLang = () => 'tr' }) {
  let cell = 'ventricular';
  let phase = 0;
  let selectedClass = 'I';
  const root = document.createElement('section');
  root.className = 'pharmaep';
  root.innerHTML = `<span class="pharmaep-eyebrow"></span><h2></h2><p class="pharmaep-intro"></p>
    <div class="pharmaep-cells" role="group"></div><div class="pharmaep-classes" role="group"></div>
    <svg class="pharmaep-chart" viewBox="0 0 640 250" role="img"><title></title>
      <rect width="640" height="250" rx="24" fill="#f4f5ec"/>
      <path d="M45 30 V205 H605" fill="none" stroke="#9eae95" stroke-width="2"/>
      <path class="pharmaep-curve" fill="none" stroke="#527354" stroke-width="5" stroke-linejoin="round"/>
      <path class="pharmaep-focus" fill="none" stroke="#d3953f" stroke-width="9" stroke-linecap="round"/>
      <text class="pharmaep-axis" x="410" y="235" fill="#62735d" font-size="13"></text>
      <text class="pharmaep-yaxis" x="55" y="25" fill="#62735d" font-size="13"></text>
    </svg><div class="pharmaep-phases" role="group"></div>
    <div class="pharmaep-readout" aria-live="polite"><strong></strong><p></p></div>
    <svg class="pharmaep-channel" viewBox="0 0 640 160" role="img"><title></title>
      <rect x="15" y="50" width="610" height="60" rx="14" fill="#d8e3cc"/>
      <rect x="278" y="40" width="28" height="80" rx="10" fill="#769476"/>
      <rect x="334" y="40" width="28" height="80" rx="10" fill="#769476"/>
      <path class="pharmaep-ion-arrow" fill="none" stroke="#cd963e" stroke-width="5"/>
      <path class="pharmaep-ion-arrow-secondary" fill="none" stroke="#527354" stroke-width="4"/>
      <text class="pharmaep-ion" x="380" y="86" fill="#354d38" font-size="20"></text>
      <text class="pharmaep-outside" x="30" y="28" fill="#65735e" font-size="13"></text>
      <text class="pharmaep-inside" x="30" y="145" fill="#65735e" font-size="13"></text>
    </svg><small class="pharmaep-caveat"></small>`;
  mount.append(root);
  const t = (tr, en) => getLang() === 'en' ? en : tr;
  const cellButtons = {};
  const classButtons = {};
  for (const id of ['ventricular', 'nodal']) {
    const button = document.createElement('button');
    button.type = 'button';
    button.addEventListener('click', () => { cell = id; if (!(phase in PHASES[cell])) phase = 0; refresh(); });
    root.querySelector('.pharmaep-cells').append(button);
    cellButtons[id] = button;
  }
  for (const id of Object.keys(CLASSES)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.addEventListener('click', () => setClass(id));
    root.querySelector('.pharmaep-classes').append(button);
    classButtons[id] = button;
  }
  const curves = {
    ventricular: 'M55 190 H140 L150 42 L177 66 L330 76 Q370 85 405 190 H595',
    nodal: 'M55 190 Q120 183 175 140 Q195 44 225 45 Q272 50 310 190 Q375 183 430 140 Q450 44 480 45 Q527 50 565 190',
  };
  const focus = {
    ventricular: { 0: 'M140 190 L150 42', 1: 'M150 42 L177 66', 2: 'M177 66 L330 76', 3: 'M330 76 Q370 85 405 190', 4: 'M405 190 H595' },
    nodal: { 0: 'M175 140 Q195 44 225 45', 3: 'M225 45 Q272 50 310 190', 4: 'M310 190 Q375 183 430 140' },
  };
  function setClass(id) {
    if (!CLASSES[id]) return;
    selectedClass = id;
    cell = CLASSES[id][2];
    phase = CLASSES[id][3];
    refresh();
  }
  function refresh() {
    const en = getLang() === 'en';
    root.querySelector('.pharmaep-eyebrow').textContent = t('ELEKTRİKSEL HEDEF LABORATUVARI', 'ELECTRICAL TARGET LAB');
    root.querySelector('h2').textContent = t('İyon → faz → ilaç sınıfı', 'Ion → phase → drug class');
    root.querySelector('.pharmaep-intro').textContent = t('Hücre tipi, ilaç sınıfı veya faz seçin. Kanal akımını ve hedef fazı birlikte inceleyin.', 'Choose a cell type, drug class or phase. Explore channel current and its target phase together.');
    cellButtons.ventricular.textContent = t('Ventriküler miyosit', 'Ventricular myocyte');
    cellButtons.nodal.textContent = t('Nodal hücre', 'Nodal cell');
    for (const [id, button] of Object.entries(cellButtons)) button.setAttribute('aria-pressed', String(cell === id));
    for (const [id, button] of Object.entries(classButtons)) {
      button.textContent = `${t('Sınıf', 'Class')} ${id} · ${CLASSES[id][4]}`;
      button.setAttribute('aria-pressed', String(selectedClass === id));
    }
    root.querySelector('.pharmaep-curve').setAttribute('d', curves[cell]);
    root.querySelector('.pharmaep-focus').setAttribute('d', focus[cell][phase]);
    root.querySelector('.pharmaep-chart title').textContent = t('Kavramsal aksiyon potansiyeli ve seçili faz', 'Conceptual action potential and selected phase');
    root.querySelector('.pharmaep-axis').textContent = t('Zaman → (ölçeksiz)', 'Time → (not to scale)');
    root.querySelector('.pharmaep-yaxis').textContent = t('Membran potansiyeli (şematik)', 'Membrane potential (schematic)');
    const phaseMount = root.querySelector('.pharmaep-phases');
    phaseMount.replaceChildren();
    for (const value of Object.keys(PHASES[cell])) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${t('Faz', 'Phase')} ${value}`;
      button.setAttribute('aria-pressed', String(phase === Number(value)));
      button.addEventListener('click', () => {
        phase = Number(value);
        refresh();
        [...phaseMount.querySelectorAll('button')].find(node => node.dataset.phase === value)?.focus();
      });
      button.dataset.phase = value;
      phaseMount.append(button);
    }
    const drug = CLASSES[selectedClass];
    root.querySelector('.pharmaep-readout strong').textContent = `${t('Faz', 'Phase')} ${phase}: ${PHASES[cell][phase][en ? 1 : 0]}`;
    const relevance = drug[2] === cell && drug[3] === phase;
    root.querySelector('.pharmaep-readout p').textContent = `${drug[en ? 1 : 0]}. ${relevance
      ? t('Seçili faz, bu sınıfın temel hedeflerinden biri.', 'Selected phase is a principal target of this class.')
      : t('Seçili faz bu sınıfın burada gösterilen temel hedefi değil.', 'Selected phase is not the principal target illustrated for this class.')}`;
    let ion = phase === 3 || (cell === 'ventricular' && phase === 1) ? 'K⁺' : cell === 'ventricular' && phase === 0 ? 'Na⁺' : 'Ca²⁺';
    let outward = ion === 'K⁺';
    if (phase === 4) ion = cell === 'nodal' ? 'If / Ca²⁺' : 'K⁺ · IK₁';
    if (cell === 'ventricular' && phase === 2) ion = 'Ca²⁺ ↘ / K⁺ ↗';
    root.querySelector('.pharmaep-ion').textContent = ion;
    const resting = cell === 'ventricular' && phase === 4;
    const plateau = cell === 'ventricular' && phase === 2;
    root.querySelector('.pharmaep-ion-arrow').setAttribute('d', resting ? '' : plateau
      ? 'M312 25 V134 M302 119 L312 134 L322 119'
      : outward ? 'M320 134 V25 M310 40 L320 25 L330 40' : 'M320 25 V134 M310 119 L320 134 L330 119');
    root.querySelector('.pharmaep-ion-arrow-secondary').setAttribute('d', plateau ? 'M328 134 V25 M318 40 L328 25 L338 40' : '');
    root.querySelector('.pharmaep-channel title').textContent = t('Seçili faz için baskın iyon akımı şeması', 'Schematic dominant ion current for selected phase');
    root.querySelector('.pharmaep-outside').textContent = t('Hücre dışı', 'Extracellular');
    root.querySelector('.pharmaep-inside').textContent = t('Hücre içi', 'Intracellular');
    root.querySelector('.pharmaep-caveat').textContent = t('Şematik eğitim modeli; eğriler ölçüm, doz yanıtı veya EKG değildir. Sınıf I alt grupları AP süresini farklı etkiler. Sınıf IV burada non-dihidropiridinleri gösterir; ventriküler Ca²⁺ platosu ve kontraktiliteyi de etkileyebilir. Amiodaron gibi ilaçlar birden fazla sınıf etkisi taşır.', 'Schematic education model; curves are not measurements, dose responses or ECGs. Class I subgroups differ in AP duration effects. Class IV here means non-dihydropyridines; ventricular Ca²⁺ plateau and contractility may also be affected. Drugs such as amiodarone have multiple class effects.');
  }
  refresh();
  return { refresh, setClass };
}

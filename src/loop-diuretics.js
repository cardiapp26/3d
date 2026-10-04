const text = (tr, en) => ({ tr, en });
export const LOOP_STEPS = [
  { id: 'nkcc2', label: text('1 · NKCC2 blokajı', '1 · NKCC2 blockade'), flow: text('Lümen Na⁺ + K⁺ + 2Cl⁻ ⊣ hücre → kan', 'Luminal Na⁺ + K⁺ + 2Cl⁻ ⊣ cell → blood'), detail: text('Kalın çıkan kolda apikal NKCC2 inhibisyonu NaCl geri emilimini azaltır. Distale Na⁺ ve su iletimi artar; natriürez ve diürez gelişir.', 'Apical NKCC2 inhibition in the thick ascending limb reduces NaCl reabsorption. Distal sodium and water delivery increases, producing natriuresis and diuresis.') },
  { id: 'divalent', label: text('2 · Ca²⁺ / Mg²⁺', '2 · Ca²⁺ / Mg²⁺'), flow: text('K⁺ geri dönüşü ↓ → lümen pozitifliği ↓ → idrar Ca²⁺ / Mg²⁺ ↑', 'K⁺ recycling ↓ → lumen-positive voltage ↓ → urinary Ca²⁺ / Mg²⁺ ↑'), detail: text('NKCC2 ile bağlantılı K⁺ geri dönüşü ve lümen-pozitif voltaj azalır; paraselüler Ca²⁺/Mg²⁺ geri emilimi düşer. Hipomagnezemi gelişebilir. Artmış idrar kalsiyumu, her hastada serum hipokalsemisi anlamına gelmez; serum Ca²⁺ düşüşü mümkündür.', 'Reduced NKCC2-linked potassium recycling and lumen-positive voltage decrease paracellular calcium and magnesium reabsorption. Hypomagnesemia can occur. Increased urinary calcium does not imply hypocalcemia in every patient; serum calcium can decrease.') },
  { id: 'distal', label: text('3 · Distal K⁺ / H⁺ kaybı', '3 · Distal K⁺ / H⁺ loss'), flow: text('Distal Na⁺ iletimi ↑ + RAAS → K⁺ / H⁺ atılımı ↑', 'Distal Na⁺ delivery ↑ + RAAS → K⁺ / H⁺ secretion ↑'), detail: text('Artmış distal Na⁺ iletimi/akım ve hacim kaybına bağlı aldosteron yanıtı K⁺ ve H⁺ kaybını artırabilir. Hipokalemi ve metabolik alkaloz gelişebilir. Medüller gradyanın azalması idrarı yoğunlaştırma yetisini azaltır.', 'Increased distal sodium delivery/flow and aldosterone response to volume loss can increase potassium and hydrogen loss. Hypokalemia and metabolic alkalosis can occur. Loss of the medullary gradient reduces urinary concentrating ability.') },
  { id: 'urate', label: text('4 · Ürat / hacim / GFR', '4 · Urate / volume / GFR'), flow: text('Proksimal sekresyon rekabeti + hacim kaybı → serum ürat ↑', 'Proximal secretory competition + volume loss → serum urate ↑'), detail: text('Organik anyon sekresyonunda rekabet ve hacim kaybıyla artan proksimal geri emilim hiperürisemiye katkı sağlar. Makula densa NKCC2 blokajı tübüloglomerüler geri bildirimi etkiler; GFR korunacağı veya artacağı garanti değildir. Aşırı diürez renal perfüzyonu ve GFR’yi düşürebilir.', 'Competition in organic anion secretion and increased proximal reabsorption with volume loss contribute to hyperuricemia. Macula densa NKCC2 blockade affects tubuloglomerular feedback; preserved or increased GFR is not guaranteed. Excess diuresis can reduce renal perfusion and GFR.') },
];
export function createLoopDetail({ mount, getLang }) {
  let selected = 'nkcc2';
  mount.className = 'diuretic-loop-detail';
  mount.innerHTML = '<h3></h3><div class="diuretic-loop-steps" role="group"></div><div class="diuretic-loop-flow" aria-live="polite"><strong></strong><p></p></div><details><summary></summary><ul></ul><p></p></details>';
  const t = value => value[getLang() === 'en' ? 'en' : 'tr'];
  const buttons = new Map();
  for (const step of LOOP_STEPS) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.loopStep = step.id;
    button.addEventListener('click', () => { selected = step.id; refresh(); });
    mount.querySelector('.diuretic-loop-steps').append(button); buttons.set(step.id, button);
  }
  const pk = [
    text('Furosemid: sağlıklı aç erkeklerde tablet için ortalama oral biyoyararlanım %64; terminal yarı ömür yaklaşık 2 saat.', 'Furosemide: mean tablet oral bioavailability 64% in fasted healthy men; terminal half-life about 2 hours.'),
    text('Torsemid: oral biyoyararlanım yaklaşık %80; normal bireylerde yarı ömür yaklaşık 3,5 saat; klirensin yaklaşık %80’i hepatik metabolizma, %20’si idrarla atılım.', 'Torsemide: oral bioavailability about 80%; half-life about 3.5 hours in normal subjects; approximately 80% of clearance by hepatic metabolism and 20% urinary excretion.'),
    text('Bumetanid: ürün bilgisinde yarı ömür 1–1,5 saat. Görseldeki 0,8 saat evrensel değer olarak kullanılmadı.', 'Bumetanide: labeled half-life 1–1.5 hours. Image value of 0.8 hours is not treated as universal.'),
    text('Etakrinik asit: sülfonamid değildir; ototoksisite riski vardır. Görseldeki kesin PK yüzdeleri ürün bilgisiyle doğrulanmadığından aktarılmadı.', 'Ethacrynic acid: not a sulfonamide; ototoxicity risk exists. Exact image PK percentages were not reproduced without label verification.'),
  ];
  function refresh() {
    mount.querySelector('h3').textContent = t(text('Loop mekanizması: tübülden klinik sonuca', 'Loop mechanism: from tubule to clinical effect'));
    mount.querySelector('[role=group]').setAttribute('aria-label', t(text('Mekanizma adımları', 'Mechanism steps')));
    for (const step of LOOP_STEPS) { buttons.get(step.id).textContent = t(step.label); buttons.get(step.id).setAttribute('aria-pressed', String(step.id === selected)); }
    const step = LOOP_STEPS.find(item => item.id === selected);
    mount.querySelector('strong').textContent = t(step.flow); mount.querySelector('.diuretic-loop-flow p').textContent = t(step.detail);
    mount.querySelector('summary').textContent = t(text('İlaçlar ve doğrulanmış PK notları', 'Drugs and verified PK notes'));
    mount.querySelector('ul').replaceChildren(...pk.map(value => { const li = document.createElement('li'); li.textContent = t(value); return li; }));
    mount.querySelector('details p').textContent = t(text('Ürün bilgisi bağlamında yaklaşık değerler; böbrek/karaciğer işlevi ve formülasyon sonucu değiştirir. Doz veya hasta yanıtı hesaplanmaz. Kaynaklar aşağıdaki DailyMed bağlantılarında.', 'Approximate values in label context; renal/hepatic function and formulation affect results. No dosing or patient-response calculation. Sources: DailyMed links below.'));
  }
  refresh(); return { refresh };
}

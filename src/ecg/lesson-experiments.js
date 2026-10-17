import './lesson-experiments.css';

// Presets drive the existing labs, so diagrams, measurements and teaching
// models continue to share one source of truth.
const param = (name, value) => [`[data-lab-param="${name}"]`, value];
const click = selector => [selector];
const experiment = (title, hint, changes, target, icon) => ({ title, hint, changes, target, icon });
const LESSONS = {
  ch11_basics: {
    title: ['Bir atımı büyüt, ölç, karşılaştır', 'Zoom into a beat, measure, compare'],
    steps: [
      experiment(['QRS’yi ölç', 'Measure QRS'], ['80 ms’lik QRS’nin kâğıtta kapladığı alanı incele.', 'Inspect the paper distance of an 80 ms QRS.'], [param('rate',75),click('[data-lab-control="speed-25"]'),click('[data-lab-control="gain-10"]'),click('[data-lab-control="interval-QRS"]')], '[data-ecg-lab="ch11_basics"]', 'wave'),
      experiment(['Kâğıdı hızlandır', 'Speed up the paper'], ['50 mm/s seçildi. Aynı QRS artık iki kat kare kaplar; süre değişmez.', '50 mm/s selected. The same QRS spans twice as many boxes; duration stays fixed.'], [click('[data-lab-control="interval-QRS"]'),click('[data-lab-control="speed-50"]')], '[data-ecg-lab="ch11_basics"]', 'paper'),
      experiment(['Voltajı büyüt', 'Increase the gain'], ['20 mm/mV seçildi. Dalga yüksekliği değişir, gerçek voltaj değişmez.', '20 mm/mV selected. Display height changes, actual voltage stays fixed.'], [click('[data-lab-control="gain-20"]')], '[data-ecg-lab="ch11_basics"]', 'wave')
    ],
    question: ['Kâğıt hızı iki katına çıkınca gerçek QRS süresi?', 'When paper speed doubles, actual QRS duration?'],
    answers: [['Değişmez', 'Stays the same'], ['İki katına çıkar', 'Doubles']],
    why: ['Kâğıt hızı yatay ölçeği değiştirir. Süre aynı kalır; kare sayısı iki katına çıkar.', 'Paper speed changes the horizontal scale. Duration stays fixed; box count doubles.']
  },
  ch11_leads: {
    title: ['Aynı vektöre üç farklı pencereden bak', 'View one vector through three windows'],
    steps: [
      experiment(['I’e paralel', 'Parallel to I'], ['Vektör 0°. I, II ve III voltajlarını canlı karşılaştır.', 'Vector at 0°. Compare live I, II and III voltages.'], [['#vec-slider',0]], '#einthoven-canvas', 'axis'),
      experiment(['II’ye paralel', 'Parallel to II'], ['Vektör +60°. II izdüşümü büyür; I + III = II eşitliği korunur.', 'Vector at +60°. Projection onto II grows; I + III = II is preserved.'], [['#vec-slider',60]], '#einthoven-canvas', 'axis'),
      experiment(['Göğüste V1 → V6', 'Across the chest: V1 → V6'], ['V6 seçildi. Elektrot haritasında V1’e tıklayıp şeritleri karşılaştır.', 'V6 selected. Click V1 on the electrode map and compare strips.'], [click('[data-lab-control="lead-V6"]')], '[data-ecg-lab="ch11_leads"]', 'chest')
    ],
    question: ['Vektör I’e dik olduğunda I izdüşümü?', 'When the vector is perpendicular to I, its projection onto I?'],
    answers: [['Sıfıra yaklaşır', 'Approaches zero'], ['En büyük olur', 'Is maximal']],
    why: ['İzdüşüm cos(θ) ile değişir. 90° için cos(90°) = 0.', 'Projection follows cos(θ). At 90°, cos(90°) = 0.']
  },
  ch12_vectors: {
    title: ['Aktivasyonu adım adım izle', 'Follow activation step by step'],
    steps: [
      experiment(['Başlangıç', 'Onset'], ['İlk adım: septum aktivasyonunu ve V1/V6 başlangıcını karşılaştır.', 'First step: compare septal activation and V1/V6 onset.'], [click('[data-step="0"]')], '.vql-main', 'wave'),
      experiment(['Ana kuvvet', 'Main forces'], ['Orta adım: aktive olan miyokardı, vektör yönünü ve altı izi birlikte oku.', 'Middle step: read activated myocardium, vector direction and six traces together.'], [click('[data-step="2"]')], '.vql-main', 'axis'),
      experiment(['Son kuvvetler', 'Terminal forces'], ['Son adım: bazal aktivasyonu izle. Zaman sürgüsüyle geriye git.', 'Final step: inspect basal activation. Scrub backward with the time slider.'], [click('[data-step="4"]')], '.vql-main', 'wave')
    ],
    question: ['Altı derivasyon aynı anda neden farklı görünür?', 'Why do six simultaneous leads look different?'],
    answers: [['Farklı bakış yönleri', 'Different viewing directions'], ['Farklı atımlar', 'Different beats']],
    why: ['Her derivasyon aynı aktivasyonu kendi eksenine göre görür; polarite ve genlik bu izdüşüme bağlıdır.', 'Each lead views the same activation along its own axis; polarity and amplitude depend on that projection.']
  },
  ch12_axis: {
    title: ['Aksı çevir, polaritenin değişimini gör', 'Rotate the axis, watch polarity change'],
    steps: [
      experiment(['+60°', '+60°'], ['I ve aVF pozitif. Çarktaki oku sürükleyerek sınırları keşfet.', 'I and aVF are positive. Drag the wheel arrow to explore boundaries.'], [click('[data-axis-mode="explore"]'),param('angle',60)], '.axl-main', 'axis'),
      experiment(['−60°', '−60°'], ['I pozitif, inferior derivasyonlar negatif. Önceki örnekle karşılaştır.', 'I positive, inferior leads negative. Compare with the previous example.'], [click('[data-axis-mode="explore"]'),param('angle',-60)], '.axl-main', 'axis'),
      experiment(['+120°', '+120°'], ['I negatif, aVF pozitif. Derivasyon kartına tıklayıp izdüşümü gör.', 'I negative, aVF positive. Click a lead card to see its projection.'], [click('[data-axis-mode="explore"]'),param('angle',120)], '.axl-main', 'axis')
    ],
    question: ['+120° aksında I derivasyonunun net QRS’si?', 'At +120°, net QRS in lead I?'],
    answers: [['Negatif', 'Negative'], ['Pozitif', 'Positive']],
    why: ['I ekseni 0°’dir. cos(120°) negatiftir; net izdüşüm negatiftir.', 'Lead I lies at 0°. cos(120°) is negative, so its net projection is negative.']
  },
  ch12_injury: {
    title: ['ST değişimini komşu ve karşı bakışlarla oku', 'Read ST changes from adjacent and opposing views'],
    steps: [
      experiment(['Anterior bakış', 'Anterior view'], ['Anterior örnek ve 0.25 mV ST değişimi. Göğüs derivasyonlarını izle.', 'Anterior example with 0.25 mV ST shift. Inspect the chest leads.'], [click('[data-case="anterior_mi"]'),param('shift',.25),click('[data-lab-control="reference-TP"]')], '[data-ecg-lab="ch12_injury"]', 'wave'),
      experiment(['Posterior bakış', 'Posterior view'], ['Posterior örnek. V1–V3 ve V7–V9’un karşılıklı görünümünü karşılaştır.', 'Posterior example. Compare opposing views in V1–V3 and V7–V9.'], [click('[data-case="posterior_mi"]'),param('shift',.25)], '[data-ecg-lab="ch12_injury"]', 'chest'),
      experiment(['J noktasını bul', 'Locate the J point'], ['J işareti seçildi. ST sürgüsünü değiştirerek referans çizgisini izle.', 'J marker selected. Change the ST slider and inspect the reference line.'], [click('[data-lab-control="reference-J"]')], '[data-ecg-lab="ch12_injury"]', 'paper')
    ],
    question: ['Posterior örnekte ek bakış sağlayan derivasyonlar?', 'Which leads add a view in the posterior example?'],
    answers: [['V7–V9', 'V7–V9'], ['Yalnız I', 'Only I']],
    why: ['V7–V9 posterior bakış sağlar. Model şematiktir; tek başına tanısal eşik oluşturmaz.', 'V7–V9 provide a posterior view. This schematic model does not establish diagnostic thresholds.']
  },
  ch13_arrhythmias: {
    title: ['Devreyi kur, refrakter kuyruğu değiştir', 'Build the circuit, change the refractory tail'],
    steps: [
      experiment(['Boşluk var', 'Gap present'], ['L=12 cm, CV=40 cm/s, ERP=250 ms. λ=10 cm; oynat düğmesiyle izle.', 'L=12 cm, CV=40 cm/s, ERP=250 ms. λ=10 cm; use Play to follow the wave.'], [param('length',12),param('velocity',40),param('erp',250),click('[data-lab-control="block-true"]')], '[data-ecg-lab="ch13_arrhythmias"]', 'ring'),
      experiment(['Kuyruğu uzat', 'Extend the tail'], ['ERP=600 ms; λ=24 cm. Aynı 12 cm halkada sürme koşulu kaybolur.', 'ERP=600 ms; λ=24 cm. The same 12 cm ring loses its sustaining condition.'], [param('length',12),param('velocity',40),param('erp',600),click('[data-lab-control="block-true"]')], '[data-ecg-lab="ch13_arrhythmias"]', 'ring'),
      experiment(['İki dalgayı çarpıştır', 'Collide two waves'], ['Başlangıç bloğu kaldırıldı. Oynat ile iki dalganın çarpışmasını izle.', 'Initiating block removed. Use Play to watch two waves collide.'], [param('length',12),param('velocity',40),param('erp',250),click('[data-lab-control="block-false"]')], '[data-ecg-lab="ch13_arrhythmias"]', 'ring')
    ],
    question: ['Sabit CV’de ERP uzarsa dalga boyu λ?', 'At fixed CV, when ERP increases, wavelength λ?'],
    answers: [['Artar', 'Increases'], ['Azalır', 'Decreases']],
    why: ['λ = CV × ERP. Daha uzun refrakter kuyruk uyarılabilir boşluğu daraltır.', 'λ = CV × ERP. A longer refractory tail narrows the excitable gap.']
  }
};

function pictogram(kind) {
  const shapes = {
    wave: '<path d="M8 48H30Q38 31 46 48H61L70 55L80 12L91 69L101 48H119Q135 22 150 48H174"/>',
    paper: '<path opacity=".25" d="M10 20H170M10 40H170M10 60H170M30 10V74M60 10V74M90 10V74M120 10V74M150 10V74"/><path d="M10 50H52L62 56L74 18L87 66L98 50H170"/>',
    axis: '<circle cx="90" cy="42" r="32" opacity=".3"/><path opacity=".4" d="M46 42H134M90 4V80M62 14L118 70M62 70L118 14"/><path d="M90 42L117 22L107 24M117 22L114 33"/><circle cx="90" cy="42" r="3"/>',
    chest: '<path opacity=".4" d="M65 10L44 20L34 74H146L136 20L115 10M85 14V66"/><path d="M82 33L98 33L109 44L117 54L128 54L138 54"/><g fill="currentColor" stroke="none"><circle cx="82" cy="33" r="4"/><circle cx="98" cy="33" r="4"/><circle cx="109" cy="44" r="4"/><circle cx="117" cy="54" r="4"/><circle cx="128" cy="54" r="4"/><circle cx="138" cy="54" r="4"/></g>',
    ring: '<circle cx="90" cy="42" r="29" opacity=".25" stroke-width="9"/><path d="M90 13A29 29 0 1 1 61 42" stroke-width="7" stroke="#c4a1f5"/><path d="M61 42L57 28L72 32"/><circle cx="90" cy="13" r="5" fill="currentColor"/>'
  };
  return `<svg viewBox="0 0 180 84" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${shapes[kind]}</svg>`;
}

export function createLessonExperiments({ mount, topic, getLang }) {
  const lesson = LESSONS[topic];
  if (!lesson) return;
  const lang = getLang() === 'en' ? 1 : 0;
  const tr = (a,b) => lang ? b : a;
  const root = document.createElement('section');
  root.className = 'lesson-experiments';
  root.setAttribute('aria-label', tr('Görsel deneyler', 'Visual experiments'));
  root.innerHTML = `
    <div class="lesson-experiments-heading"><div><span class="lesson-eyebrow">${tr('DENE → GÖZLEMLE → KARŞILAŞTIR','TRY → OBSERVE → COMPARE')}</span><h3>${lesson.title[lang]}</h3></div>
      <button type="button" class="lesson-focus" aria-pressed="false">${tr('Görsellere odaklan','Focus on visuals')}</button></div>
    <div class="lesson-experiment-grid">${lesson.steps.map((s,i)=>`<button type="button" class="lesson-experiment" data-experiment="${i}" aria-pressed="false"><span class="lesson-step">0${i+1}</span>${pictogram(s.icon)}<strong>${s.title[lang]}</strong><span>${s.hint[lang]}</span><b class="lesson-launch">${tr('Modelde dene ↗','Try in model ↗')}</b></button>`).join('')}</div>
    <p class="lesson-observation" role="status">${tr('Bir deney seç. Aşağıdaki canlı model ve ölçümler birlikte güncellenir.','Choose an experiment. The live model and measurements below update together.')}</p>
    <details class="lesson-question"><summary>${tr('Kendini dene','Check your understanding')} <span>${lesson.question[lang]}</span></summary><div class="lesson-answers">${lesson.answers.map((a,i)=>`<button type="button" data-lesson-answer="${i}">${a[lang]}</button>`).join('')}</div><p class="lesson-feedback" role="status"></p></details>`;
  root.querySelector('.lesson-focus').addEventListener('click', e => {
    const active = mount.classList.toggle('lesson-visual-focus');
    e.currentTarget.setAttribute('aria-pressed', String(active));
  });
  root.querySelectorAll('[data-experiment]').forEach(button => button.addEventListener('click', () => {
    const selected = lesson.steps[Number(button.dataset.experiment)];
    for (const [selector,value] of selected.changes) {
      const control = mount.querySelector(selector);
      if (!control) throw new Error(`Lesson experiment control missing: ${selector}`);
      if (value === undefined) control.click();
      else { control.value = String(value); control.dispatchEvent(new Event('input',{bubbles:true})); }
    }
    root.querySelectorAll('[data-experiment]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    root.querySelector('.lesson-observation').textContent = selected.hint[lang];
    const target = mount.querySelector(selected.target);
    if (target) {
      mount.querySelectorAll('.lesson-target').forEach(n=>n.classList.remove('lesson-target'));
      target.classList.add('lesson-target');
      target.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }
  }));
  root.querySelectorAll('[data-lesson-answer]').forEach(button=>button.addEventListener('click',()=>{
    const correct = button.dataset.lessonAnswer === '0';
    root.querySelector('.lesson-feedback').textContent = `${correct?tr('Doğru.','Correct.'):tr('Tekrar düşün.','Think again.')} ${lesson.why[lang]}`;
    root.querySelectorAll('[data-lesson-answer]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  }));
  mount.prepend(root);
}

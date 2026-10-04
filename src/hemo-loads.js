// Preload/afterload explorer for the hemodynamics panel. Visual first: an
// animated LV section and a muscle-strip analogy (hemo-loads-visual.js);
// the Laplace arithmetic sits in a fold-out below.
import { LOAD_BASE, LOAD_CASES, wallStress } from './hemo-loads-model.js';
import { createLoadScene } from './hemo-loads-visual.js';

export { LOAD_BASE, LOAD_CASES, wallStress };

const TEXT = {
  tr: {
    title: 'Preload & afterload', kicker: 'BASINÇ × GEOMETRİ', intro: 'Ventrikül atarken duvarın ne kadar zorlandığını izleyin. Basıncı, boşluğu veya duvar kalınlığını değiştirin.',
    preload: 'Preload · Ön yük', afterload: 'Afterload · Ard yük',
    phase: ['Diyastol sonu', 'Sistolik ejeksiyon'],
    definition: ['Kasılma başlamadan hemen önce duvarı geren yük.', 'Ejeksiyon sırasında kasılan duvarın karşı koyduğu yük.'],
    phases: { filling: 'Doluş', endDiastole: 'Diyastol sonu · ön yük', isovolumic: 'İzovolümik kasılma', ejection: 'Ejeksiyon', selected: 'Ejeksiyon · ard yük anı', relaxation: 'Gevşeme' },
    sceneTitle: 'Atan sol ventrikül kesiti; duvar rengi anlık duvar stresini gösterir',
    legend: [['pressure', 'Kan basıncı duvarı iter'], ['tension', 'Duvar gerilir (stres)'], ['heat', 'Renk koyulaştıkça stres artar'], ['ghost', 'Başlangıç geometrisi']],
    pressure: 'Basınç · P (mmHg)', radius: 'Boşluk yarıçapı · r (cm)', thickness: 'Duvar kalınlığı · h (cm)',
    stress: 'Duvar stresi', low: 'düşük', high: 'yüksek', reference: 'başlangıcın', baseline: 'Başlangıç', pressureCase: 'Basınç ↑', dilation: 'Dilatasyon', thickening: 'Duvar kalınlaşması', reset: 'Sıfırla',
    muscleTitle: 'Kas şeridi benzetmesi',
    muscle: {
      preload: ['Ön yük: kasılmadan ÖNCE', 'asılan ağırlık kası gerer.', 'Daha fazla gerim, daha uzun', 'sarkomer (Frank-Starling).'],
      afterload: ['Ard yük: kas kasıldıktan', 'SONRA kaldırması gereken', 'ağırlık. Ağırlık arttıkça', 'kas daha az kısalır.']
    },
    muscleState: { stretch: 'Dinlenimde gerilmiş', contract: 'Kasılıyor', rest: 'Ağırlık rafta', tension: 'Gerilim artıyor, ağırlık kalkmadı', lift: 'Ağırlığı kaldırıyor' },
    terms: ['P ↑ → σ ↑', 'r ↑ → σ ↑', 'h ↑ → σ ↓'],
    factorsTitle: 'Bu değişkenleri ne belirler?',
    factors: [
      ['Kan hacmi, dağılımı ve venöz dönüş → doluş basıncı', 'Ventrikül ve perikart kompliyansı → basınç-hacim ilişkisi → yarıçap', 'Büyüme ve yeniden şekillenme → duvar kalınlığı'],
      ['Arter basıncı ve çıkış yolu/kapak direnci → LV ejeksiyon basıncı', 'Doluş ve yeniden şekillenme → sistolik yarıçap', 'Miyokart hipertrofisi → duvar kalınlığı']
    ],
    insight: {
      baseline: 'Bir kaydırıcıyı oynatın: duvar rengi ve gerilim okları hemen değişir. Basınç veya yarıçap iki katına çıkınca stres iki katına çıkar; kalınlık iki katına çıkınca yarıya iner.',
      pressure: 'Yarıçap ve kalınlık sabit: basınç artışı duvar stresini yükseltir. Ard yükte kullanılan basınç ventrikül basıncıdır; aort darlığında aort basıncından yüksek olabilir.',
      dilation: 'Basınç aynı kaldı; boşluk büyüdüğü için duvar stresi arttı. Normal arter basıncı, düşük ard yük garantisi değildir.',
      thickening: 'Aynı basınç ve yarıçapta daha kalın duvar, hesaplanan stresi azaltır. Bu, hipertrofinin bütünüyle yararlı olduğu anlamına gelmez.',
      custom: 'Serbest deneme: kaydırıcılar bağımsızdır. Gerçek kalpte basınç, hacim ve duvar geometrisi birbirine bağlıdır.'
    },
    distinction: ['EDV ve doluş basıncı, ön yükün dolaylı göstergeleridir; tek başlarına tam tanımı değildir.', 'Arter basıncı, SVR ve etkin arteriyel elastans (Ea), ard yükün bazı yönlerini temsil eder; miyokart duvar stresiyle özdeş değildir.'],
    formulaTitle: 'Hesap: Laplace yasası', equation: 'Küresel yaklaşım', result: 'Hesap', unit: 'mmHg eşdeğeri',
    scope: 'Bağımsız öğretim modeli; kateter senaryosunu veya P-V döngüsünü değiştirmez. Değerler tasarlanmış örneklerdir, normal sınır veya hasta ölçümü değildir. Animasyondaki döngü zamanlaması şematiktir; duvar alanı sabit tutulur, bu yüzden boşluk büyüdükçe duvar incelir. Küresel Laplace yaklaşımı, kalın duvarlı ve karmaşık geometrili gerçek LV’de yerel stresi hesaplamaz. σ kuvvet/alan, duvar gerilimi T ise kuvvet/uzunluktur (T = σh). P = boşluk basıncı − dış basınç.',
    source: 'Kaynak ve model sınırları', sourceNote: 'Norton JM · 2001 · s. 54, 58–60; Şekil 1–2. Şemalar yeniden çizildi; örnek sayılar makaleden alınmadı.', controls: 'Karşılaştırma örnekleri'
  },
  en: {
    title: 'Preload & afterload', kicker: 'PRESSURE × GEOMETRY', intro: 'Watch how hard the wall works as the ventricle beats. Change the pressure, the cavity or the wall thickness.',
    preload: 'Preload', afterload: 'Afterload', phase: ['End diastole', 'Systolic ejection'],
    definition: ['The load stretching the wall just before contraction.', 'The load the contracting wall works against during ejection.'],
    phases: { filling: 'Filling', endDiastole: 'End diastole · preload', isovolumic: 'Isovolumic contraction', ejection: 'Ejection', selected: 'Ejection · afterload instant', relaxation: 'Relaxation' },
    sceneTitle: 'Beating left ventricular section; wall colour shows instantaneous wall stress',
    legend: [['pressure', 'Blood pressure pushes the wall'], ['tension', 'The wall is stretched (stress)'], ['heat', 'Darker colour, higher stress'], ['ghost', 'Baseline geometry']],
    pressure: 'Pressure · P (mmHg)', radius: 'Cavity radius · r (cm)', thickness: 'Wall thickness · h (cm)',
    stress: 'Wall stress', low: 'low', high: 'high', reference: 'of baseline', baseline: 'Baseline', pressureCase: 'Pressure ↑', dilation: 'Dilation', thickening: 'Wall thickening', reset: 'Reset',
    muscleTitle: 'Muscle-strip analogy',
    muscle: {
      preload: ['Preload: a weight hung', 'BEFORE contraction stretches', 'the muscle. More stretch,', 'longer sarcomeres (Frank-Starling).'],
      afterload: ['Afterload: the weight the', 'muscle must lift AFTER it', 'contracts. The heavier it is,', 'the less the muscle shortens.']
    },
    muscleState: { stretch: 'Stretched at rest', contract: 'Contracting', rest: 'Weight on the shelf', tension: 'Tension rising, weight not lifted', lift: 'Lifting the weight' },
    terms: ['P ↑ → σ ↑', 'r ↑ → σ ↑', 'h ↑ → σ ↓'],
    factorsTitle: 'What determines these variables?', factors: [
      ['Blood volume, distribution and venous return → filling pressure', 'Ventricular and pericardial compliance → pressure-volume relation → radius', 'Growth and remodeling → wall thickness'],
      ['Arterial pressure and outflow/valve resistance → LV ejection pressure', 'Filling and remodeling → systolic radius', 'Myocardial hypertrophy → wall thickness']
    ],
    insight: {
      baseline: 'Move a slider: the wall colour and tension arrows change at once. Doubling pressure or radius doubles stress; doubling thickness halves it.',
      pressure: 'Radius and thickness stay fixed: raising pressure increases wall stress. Afterload uses ventricular pressure, which can exceed aortic pressure in aortic stenosis.',
      dilation: 'Pressure stayed the same; a larger cavity raised wall stress. Normal arterial pressure does not guarantee low afterload.',
      thickening: 'At the same pressure and radius, a thicker wall reduces calculated stress. This does not imply that hypertrophy is wholly beneficial.',
      custom: 'Free exploration: sliders are independent. In the real heart, pressure, volume and wall geometry are interdependent.'
    },
    distinction: ['EDV and filling pressure are indirect indicators of preload, not its full definition.', 'Arterial pressure, SVR and effective arterial elastance (Ea) represent aspects of afterload; they are not identical to myocardial wall stress.'],
    formulaTitle: 'Calculation: Laplace’s law', equation: 'Spherical approximation', result: 'Calculation', unit: 'mmHg equivalent',
    scope: 'Independent teaching model; does not change the catheter scenario or P-V loop. Values are designed examples, not normal limits or patient measurements. Cycle timing in the animation is schematic; wall area is held constant, so the wall thins as the cavity grows. Spherical Laplace approximation does not compute local stress in the thick-walled, complex LV. Stress σ is force/area; wall tension T is force/length (T = σh). P = cavity pressure − external pressure.',
    source: 'Source and model limits', sourceNote: 'Norton JM · 2001 · pp. 54, 58–60; Figures 1–2. Original redrawn schematics; example numbers are not taken from the paper.', controls: 'Comparison examples'
  }
};
const LIMITS = { preload: { p: [2, 30, 1] }, afterload: { p: [60, 220, 5] }, r: [1.5, 4.5, 0.1], h: [0.5, 2, 0.1] };
const METER_MAX = 2.5;

function node(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
}

function buildMeter() {
  const element = node('div', 'load-meter');
  element.setAttribute('role', 'status'); element.setAttribute('aria-live', 'polite');
  const label = node('span', 'load-meter-label'), stress = node('strong'), relative = node('span', 'load-meter-ratio');
  const track = node('div', 'load-meter-track'), fill = node('div', 'load-meter-fill'), tick = node('div', 'load-meter-tick');
  tick.style.left = `${100 / METER_MAX}%`;
  track.append(fill, tick);
  const scale = node('div', 'load-meter-scale'), low = node('span'), high = node('span');
  scale.append(low, high);
  element.append(label, relative, track, scale, stress);
  return { element, label, stress, relative, fill, low, high };
}

function buildSlider(key, onInput, signal) {
  const label = node('label', 'load-slider'), caption = node('span'), input = node('input'), out = node('output');
  input.type = 'range'; input.dataset.loadParam = key;
  input.addEventListener('input', () => onInput(key, Number(input.value)), { signal });
  label.append(caption, out, input);
  return { label, caption, input, out };
}

export function createLoadExplorer({ lang = 'tr', signal } = {}) {
  let language = lang === 'en' ? 'en' : 'tr', mode = 'preload', selected = 'baseline';
  const values = { preload: { ...LOAD_BASE.preload }, afterload: { ...LOAD_BASE.afterload } };
  const selection = { preload: 'baseline', afterload: 'baseline' };
  const scene = createLoadScene({ signal });
  const element = node('section', 'hemo-loads');
  const kicker = node('p', 'load-kicker'), title = node('h3'), intro = node('p', 'load-intro');
  const modes = node('div', 'load-mode'); modes.setAttribute('role', 'group');
  const buttons = {};
  for (const id of ['preload', 'afterload']) {
    const b = node('button'); b.type = 'button'; b.dataset.loadMode = id;
    b.addEventListener('click', () => { mode = id; selected = selection[mode]; render(); }, { signal });
    modes.append(b); buttons[id] = b;
  }
  const phase = node('p', 'load-phase'), definition = node('p', 'load-definition');
  const stage = node('div', 'load-stage');
  const legend = node('ul', 'load-legend');
  stage.append(scene.heart, legend);
  const meter = buildMeter();
  const presets = node('div', 'load-presets'); presets.setAttribute('role', 'group');
  const presetButtons = {};
  for (const id of Object.keys(LOAD_CASES)) {
    const b = node('button'); b.type = 'button'; b.dataset.loadCase = id;
    b.addEventListener('click', () => { values[mode] = { ...LOAD_CASES[id][mode] }; selected = selection[mode] = id; render(); }, { signal });
    presets.append(b); presetButtons[id] = b;
  }
  const controls = node('div', 'load-controls'), fields = {};
  const onInput = (key, value) => { values[mode] = { ...values[mode], [key]: value }; selected = selection[mode] = 'custom'; render(); };
  for (const key of ['p', 'r', 'h']) { fields[key] = buildSlider(key, onInput, signal); controls.append(fields[key].label); }
  const reset = node('button', 'load-reset'); reset.type = 'button';
  reset.addEventListener('click', () => { values[mode] = { ...LOAD_BASE[mode] }; selected = selection[mode] = 'baseline'; render(); }, { signal });
  const insight = node('p', 'load-insight');
  const analogy = node('div', 'load-analogy'), analogyTitle = node('h4');
  analogy.append(analogyTitle, scene.muscle);
  const distinction = node('p', 'load-distinction');
  const factorsTitle = node('h4'), factors = node('ol', 'load-factors');
  const formula = node('details', 'load-formula'), formulaSummary = node('summary');
  const formulaLabel = node('span'), equation = node('strong', '', 'σ ≈ P × r / (2 × h)'), calculation = node('span');
  formula.append(formulaSummary, formulaLabel, equation, calculation);
  const details = node('details', 'load-sources'), summary = node('summary'), sourceNote = node('p'), scope = node('p');
  const sourceLink = node('a', '', 'Norton · Toward consistent definitions for preload and afterload');
  sourceLink.href = 'https://doi.org/10.1152/advances.2001.25.1.53'; sourceLink.target = '_blank'; sourceLink.rel = 'noopener noreferrer';
  details.append(summary, sourceNote, sourceLink, scope);
  // Stage and controls share a wrapper so a wide panel can set them side by side (hemo-loads.css).
  const wide = node('div', 'load-wide');
  wide.append(stage, meter.element, presets, controls, reset, insight);
  element.append(kicker, title, intro, modes, phase, definition, wide, analogy, distinction, factorsTitle, factors, formula, details);

  function renderMeter(t, v) {
    const s = wallStress(v), ratio = s / wallStress(LOAD_BASE[mode]);
    meter.label.textContent = t.stress;
    meter.stress.textContent = `${s.toFixed(1)} ${t.unit}`;
    meter.stress.dataset.loadStress = String(s);
    meter.relative.textContent = `${ratio.toFixed(2)}× ${t.reference}`;
    // Full-width gradient clipped to the value, so colour matches the wall heat scale.
    meter.fill.style.clipPath = `inset(0 ${100 - Math.min(ratio / METER_MAX, 1) * 100}% 0 0 round 6px)`;
    meter.low.textContent = t.low; meter.high.textContent = t.high;
  }

  function renderControls(t, v) {
    const limits = { p: LIMITS[mode].p, r: LIMITS.r, h: LIMITS.h };
    for (const [j, key] of ['p', 'r', 'h'].entries()) {
      const f = fields[key], [min, max, step] = limits[key], unit = key === 'p' ? 'mmHg' : 'cm';
      f.caption.textContent = t[['pressure', 'radius', 'thickness'][j]];
      Object.assign(f.input, { min: String(min), max: String(max), step: String(step), value: String(v[key]) });
      f.input.setAttribute('aria-label', f.caption.textContent);
      f.input.setAttribute('aria-valuetext', `${v[key]} ${unit}`);
      f.out.textContent = `${v[key].toFixed(key === 'p' ? 0 : 1)} ${unit}`;
    }
  }

  function render() {
    const t = TEXT[language], i = mode === 'preload' ? 0 : 1, v = values[mode];
    element.dataset.loadPhase = mode;
    kicker.textContent = t.kicker; title.textContent = t.title; intro.textContent = t.intro;
    modes.setAttribute('aria-label', t.title);
    for (const [id, b] of Object.entries(buttons)) { b.textContent = t[id]; b.setAttribute('aria-pressed', String(id === mode)); }
    phase.textContent = `0${i + 1} / ${t.phase[i]}`;
    definition.textContent = t.definition[i];
    legend.replaceChildren(...t.legend.map(([kind, text]) => { const li = node('li', '', text); li.dataset.legend = kind; return li; }));
    scene.update({ mode, values: v, base: LOAD_BASE[mode], text: t });
    renderMeter(t, v);
    presets.setAttribute('aria-label', t.controls);
    for (const [id, b] of Object.entries(presetButtons)) { b.textContent = t[id === 'pressure' ? 'pressureCase' : id]; b.setAttribute('aria-pressed', String(id === selected)); }
    renderControls(t, v);
    reset.textContent = t.reset; insight.textContent = t.insight[selected]; distinction.textContent = t.distinction[i];
    analogyTitle.textContent = t.muscleTitle;
    factorsTitle.textContent = t.factorsTitle;
    factors.replaceChildren(...t.factors[i].map((text, j) => { const li = node('li'); li.append(node('b', '', t.terms[j]), node('span', '', text)); return li; }));
    formulaSummary.textContent = t.formulaTitle; formulaLabel.textContent = t.equation;
    calculation.textContent = `${t.result}: ${v.p} × ${v.r.toFixed(1)} / (2 × ${v.h.toFixed(1)}) = ${wallStress(v).toFixed(1)}`;
    summary.textContent = t.source; sourceNote.textContent = t.sourceNote; scope.textContent = t.scope;
  }
  render();
  return { element, setLanguage(next) { language = next === 'en' ? 'en' : 'tr'; render(); } };
}

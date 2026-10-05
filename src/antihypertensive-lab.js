// Antihypertensive lab: blood circulates through the 3D heart, resistance arterioles and back;
// the kidney's RAAS chain feeds volume and arteriolar tone. Each class changes the determinant it
// acts on (MAP ≈ cardiac output × SVR; output = HR × stroke volume). Directions follow the
// mechanism; there are no pressures, doses or effect sizes.
import './antihypertensive-lab.css';

const HEART_IMAGE = new URL('./assets/pharmacology-heart.webp', import.meta.url).href;
const SVG_NS = 'http://www.w3.org/2000/svg';
const text = (tr, en) => ({ tr, en });
const FACTORS = ['hr', 'sv', 'svr', 'volume'];
const FACTOR_NAMES = {
  hr: text('Kalp hızı', 'Heart rate'), sv: text('Atım hacmi / kontraktilite', 'Stroke volume / contractility'),
  svr: text('Sistemik vasküler direnç', 'Systemic vascular resistance'), volume: text('Dolaşan hacim', 'Circulating volume'),
};
/** Class → factor directions (-1 lowers, +1 raises), blocked RAAS nodes and one-line reasons. */
const CLASSES = {
  acei: {
    name: text('ACE inhibitörü', 'ACE inhibitor'), effects: { svr: -1, volume: -1 }, blocks: ['ace'],
    why: { svr: text('Ang II ↓ → arteriol gevşer.', 'Ang II ↓ → arteriole relaxes.'), volume: text('Aldosteron ↓ → Na⁺/su tutulumu ↓.', 'Aldosterone ↓ → Na⁺/water retention ↓.') },
    note: text('Bradikinin yıkımı da azalır: öksürük ve anjiyoödem riski bununla ilişkilidir.', 'Bradykinin breakdown also falls: linked to cough and angioedema.'),
  },
  arb: {
    name: text('ARB', 'ARB'), effects: { svr: -1, volume: -1 }, blocks: ['at1'],
    why: { svr: text('AT1 blokajı → Ang II damarı daraltamaz.', 'AT1 blockade → Ang II cannot constrict.'), volume: text('AT1 aracılı aldosteron uyarısı ↓.', 'AT1-driven aldosterone release ↓.') },
    note: text('Bradikinini doğrudan artırmaz; ACEi ile birlikte kullanılmaz.', 'Does not directly raise bradykinin; not combined with an ACEi.'),
  },
  dhp: {
    name: text('DHP kalsiyum kanal blokeri', 'DHP calcium channel blocker'), effects: { svr: -1, hr: 1 }, blocks: [], arteriole: true,
    why: { svr: text('Arteriyel düz kasta L tipi Ca²⁺ girişi ↓ → dilatasyon.', 'Arterial smooth-muscle L-type Ca²⁺ entry ↓ → dilation.'), hr: text('Basınç düşüşüne baroreseptör yanıtı: refleks taşikardi olabilir.', 'Baroreceptor response to the fall: reflex tachycardia may occur.') },
    note: text('Periferik ödem damar yatağındaki basınç değişimiyle ilişkilidir; diüretikle düzelmez.', 'Peripheral edema relates to capillary pressure changes; not a diuretic-responsive fluid gain.'),
  },
  'non-dhp': {
    name: text('Non-DHP kalsiyum kanal blokeri', 'Non-DHP calcium channel blocker'), effects: { hr: -1, sv: -1, svr: -1 }, blocks: [], heart: true,
    why: { hr: text('Nodal Ca²⁺ akımı ↓ → sinüs hızı ve AV iletim ↓.', 'Nodal Ca²⁺ current ↓ → sinus rate and AV conduction ↓.'), sv: text('Miyokard Ca²⁺ girişi ↓ → kontraktilite ↓.', 'Myocardial Ca²⁺ entry ↓ → contractility ↓.'), svr: text('Ek olarak hafif arteriyel dilatasyon.', 'Additional mild arterial dilation.') },
    note: text('Beta blokerle birlikte bradikardi/AV blok; HFrEF içinde negatif inotropi önemlidir.', 'With beta blockers: bradycardia/AV block; negative inotropy matters in HFrEF.'),
  },
  thiazide: {
    name: text('Tiyazid / tiyazid benzeri', 'Thiazide / thiazide-like'), effects: { volume: -1, svr: -1 }, blocks: ['tubule'],
    why: { volume: text('NCC ⊣ → natriürez, hacim ↓ (erken etki).', 'NCC blocked → natriuresis, volume ↓ (early effect).'), svr: text('Uzun dönemde periferik direnç de azalır.', 'Peripheral resistance also falls over time.') },
    note: text('Hipokalemi, hiponatremi ve ürik asit artışı izlenir.', 'Monitor hypokalemia, hyponatremia and uric acid.'),
  },
  beta: {
    name: text('Beta bloker', 'Beta blocker'), effects: { hr: -1, sv: -1 }, blocks: ['renin'], heart: true,
    why: { hr: text('β1 blokajı → sinüs hızı ↓.', 'β1 blockade → sinus rate ↓.'), sv: text('Kontraktilite ↓ → debi ↓.', 'Contractility ↓ → output ↓.') },
    note: text('Jukstaglomerüler β1 blokajı renin salgısını azaltır. Komplike olmayan hipertansiyonda ilk basamak değil; eşlik eden endikasyonda öne çıkar.', 'Juxtaglomerular β1 blockade lowers renin release. Not first line in uncomplicated hypertension; preferred with compelling indications.'),
  },
};
const RAAS = [['renin', 'Renin'], ['ace', 'ACE → Ang II'], ['at1', 'AT1'], ['aldo', text('Aldosteron', 'Aldosterone')], ['tubule', text('Na⁺/su tutulumu', 'Na⁺/water retention')]];
const LOOP = 'M150 128C150 70 230 58 330 58H560C640 58 668 90 668 150V250C668 320 640 352 560 352H250C170 352 150 320 150 280';

export function createAntihypertensiveLab({ mount, getLang }) {
  let selected = 'acei', treated = false;
  const t = value => (typeof value === 'string' ? value : value[getLang() === 'en' ? 'en' : 'tr']);
  const root = document.createElement('section');
  root.className = 'htnlab';
  root.innerHTML = `<p class="htnlab-eyebrow"></p><h2></h2><p class="htnlab-intro"></p>
    <div class="htnlab-classes" role="group"></div>
    <div class="htnlab-toggle" role="group"><button type="button" data-htn-state="base"></button><button type="button" data-htn-state="drug"></button></div>
    <svg class="htnlab-map" viewBox="0 0 760 430" role="img"><title></title>
      <path class="htnlab-vessel" d="${LOOP}"/><path class="htnlab-lumen" d="${LOOP}"/>
      <g class="htnlab-arteriole"><rect x="640" y="150" width="56" height="100" rx="12" class="htnlab-arteriole-zone"/>
        <path class="htnlab-arteriole-wall htnlab-wall-l" d="M650 150V250"/><path class="htnlab-arteriole-wall htnlab-wall-r" d="M686 150V250"/>
        <text x="630" y="190" text-anchor="end" class="htnlab-small" data-htn-label="arteriole"/><text x="630" y="206" text-anchor="end" class="htnlab-small htnlab-svr-tag">SVR</text></g>
      <g class="htnlab-particles"></g>
      <image class="htnlab-heart" href="${HEART_IMAGE}" x="40" y="120" width="160" height="208"/>
      <text x="120" y="112" text-anchor="middle" class="htnlab-small" data-htn-label="heart"/>
      <text x="420" y="44" text-anchor="middle" class="htnlab-small" data-htn-label="arteries"/><text x="420" y="378" text-anchor="middle" class="htnlab-small" data-htn-label="veins"/>
      <g class="htnlab-kidney"><path d="M372 250C344 250 336 286 344 306C352 330 388 332 396 312C400 300 386 294 386 282C386 270 400 262 396 254C392 250 382 250 372 250Z"/><text x="332" y="296" text-anchor="end" class="htnlab-small" data-htn-label="kidney"/></g>
      <g class="htnlab-raas"></g>
      <path class="htnlab-ang-arrow" d="M562 292C604 286 626 250 644 232"/>
      <g class="htnlab-gauge"><path d="M275 150A55 55 0 0 1 385 150" class="htnlab-gauge-track"/><path d="M275 150A55 55 0 0 1 302 102" class="htnlab-gauge-target"/><path d="M358 102A55 55 0 0 1 385 150" class="htnlab-gauge-high"/>
        <line class="htnlab-needle" x1="330" y1="150" x2="330" y2="106"/><circle cx="330" cy="150" r="6"/><text x="330" y="174" text-anchor="middle" class="htnlab-small" data-htn-label="map"/>
        <text x="270" y="166" class="htnlab-tiny" data-htn-label="target"/><text x="390" y="166" text-anchor="end" class="htnlab-tiny" data-htn-label="high"/></g>
    </svg>
    <p class="htnlab-equation"></p>
    <div class="htnlab-factors"></div><p class="htnlab-note"></p><p class="htnlab-limit"></p>`;
  mount.append(root);
  const $ = selector => root.querySelector(selector);
  for (const id of Object.keys(CLASSES)) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.htnClass = id;
    button.addEventListener('click', () => { selected = id; treated = false; refresh(); setTimeout(() => { treated = true; refresh(); }, 650); });
    $('.htnlab-classes').append(button);
  }
  root.querySelectorAll('[data-htn-state]').forEach(button => button.addEventListener('click', () => { treated = button.dataset.htnState === 'drug'; refresh(); }));
  RAAS.forEach(([id], i) => {
    const g = document.createElementNS(SVG_NS, 'g'), y = 238 + i * 22;
    g.dataset.raas = id;
    g.innerHTML = `<rect x="410" y="${y}" width="150" height="20" rx="6"/><text x="485" y="${y + 14}" text-anchor="middle"/><g class="htnlab-plug"><circle cx="560" cy="${y + 10}" r="8"/><path d="M556 ${y + 6}l8 8m0-8l-8 8"/></g>`;
    $('.htnlab-raas').append(g);
  });
  const loop = document.createElementNS(SVG_NS, 'path');
  loop.setAttribute('d', LOOP);
  const length = (() => { $('.htnlab-map').append(loop); const l = loop.getTotalLength(); loop.remove(); return l; })();
  const dots = Array.from({ length: 18 }, (_, i) => {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('r', 5); $('.htnlab-particles').append(dot);
    return { dot, s: i * length / 18 };
  });
  let last = 0, visible = true;
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }).observe(root);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (visible && !reduced) {
      const speed = 90 * (1 + 0.25 * flowChange());
      for (const item of dots) {
        item.s = (item.s + dt * speed) % length;
        const point = loop.getPointAtLength(item.s);
        item.dot.setAttribute('cx', point.x); item.dot.setAttribute('cy', point.y);
      }
    }
    requestAnimationFrame(tick);
  }
  function effects() { return treated ? CLASSES[selected].effects : {}; }
  function flowChange() { const e = effects(); return -(e.svr || 0) * 0.6 + (e.hr || 0) * 0.3 + (e.sv || 0) * 0.3; }
  if (!reduced) { $('.htnlab-map').append(loop); loop.style.display = 'none'; requestAnimationFrame(tick); }
  else { $('.htnlab-map').append(loop); loop.style.display = 'none'; dots.forEach(item => { const p = loop.getPointAtLength(item.s); item.dot.setAttribute('cx', p.x); item.dot.setAttribute('cy', p.y); }); }

  function refresh() {
    const item = CLASSES[selected], e = effects();
    $('.htnlab-eyebrow').textContent = t(text('ANTİHİPERTANSİF LABORATUVARI', 'ANTIHYPERTENSIVE LAB'));
    $('h2').textContent = t(text('Basıncı ne belirler, ilaç neyi değiştirir?', 'What sets pressure, and what does the drug change?'));
    $('.htnlab-intro').textContent = t(text('Bir sınıf seçin: önce ilaçsız hipertansif durum, ardından ilacın etki ettiği belirleyici animasyonla değişir.', 'Pick a class: the untreated hypertensive state appears first, then the determinant the drug acts on changes.'));
    root.querySelectorAll('[data-htn-class]').forEach(button => { button.textContent = t(CLASSES[button.dataset.htnClass].name); button.setAttribute('aria-pressed', String(button.dataset.htnClass === selected)); });
    root.querySelectorAll('[data-htn-state]').forEach(button => { const drug = button.dataset.htnState === 'drug'; button.textContent = drug ? t(text('İlaçla', 'With drug')) : t(text('İlaçsız', 'Untreated')); button.setAttribute('aria-pressed', String(drug === treated)); });
    const labels = { arteriole: text('Direnç arteriolü', 'Resistance arteriole'), heart: text('Kalp: hız × atım hacmi', 'Heart: rate × stroke volume'), arteries: text('Arterler', 'Arteries'), veins: text('Venler (dönüş)', 'Veins (return)'), kidney: text('Böbrek: RAAS', 'Kidney: RAAS'), map: text('Ortalama arter basıncı', 'Mean arterial pressure'), target: text('hedef', 'target'), high: text('yüksek', 'high') };
    root.querySelectorAll('[data-htn-label]').forEach(node => { node.textContent = t(labels[node.dataset.htnLabel]); });
    root.querySelectorAll('[data-raas]').forEach((g, i) => {
      g.querySelector('text').textContent = t(RAAS[i][1]);
      g.classList.toggle('is-blocked', treated && item.blocks.includes(g.dataset.raas));
    });
    // Arteriole width and heart beat follow the factor directions.
    root.style.setProperty('--wall', e.svr ? '-13px' : '0px');
    root.style.setProperty('--beat', e.hr < 0 ? '1.25s' : e.hr > 0 ? '.62s' : '.82s');
    root.classList.toggle('is-ang-blocked', treated && (item.blocks.includes('ace') || item.blocks.includes('at1')));
    root.classList.toggle('is-volume-low', Boolean(e.volume));
    // Direction only: a net pressure-lowering class moves the needle to the target zone.
    const score = FACTORS.reduce((sum, id) => sum + (e[id] || 0) * (id === 'hr' ? 0.3 : 1), 0);
    const angle = score < 0 ? -42 : score > 0 ? 62 : 48;
    $('.htnlab-needle').style.transform = `rotate(${angle}deg)`;
    $('.htnlab-equation').innerHTML = `<strong>MAP ≈ ${t(text('Debi', 'Output'))} × SVR</strong> · ${t(text('Debi', 'Output'))} = ${t(text('kalp hızı', 'heart rate'))} × ${t(text('atım hacmi', 'stroke volume'))}`;
    $('.htnlab-factors').innerHTML = FACTORS.map(id => {
      const value = e[id] || 0, arrow = value < 0 ? '↓' : value > 0 ? '↑' : '·';
      const why = value && item.why[id] ? t(item.why[id]) : '';
      return `<div class="htnlab-factor ${value < 0 ? 'is-down' : value > 0 ? 'is-up' : ''}"><span class="htnlab-arrow">${arrow}</span><strong>${t(FACTOR_NAMES[id])}</strong><span>${why}</span></div>`;
    }).join('');
    $('.htnlab-note').textContent = treated ? t(item.note) : t(text('İlaçsız: arterioller dar, RAAS aktif; gösterge yüksek bölgede.', 'Untreated: arterioles narrow, RAAS active; gauge in the high zone.'));
    $('.htnlab-limit').textContent = t(text('Şematik öğretim modeli: oklar etki yönünü gösterir, büyüklük veya mmHg değildir. Kılavuzlarda ilk basamak sınıfları ACEi/ARB, kalsiyum kanal blokeri ve tiyazid türevleridir; seçim eşlik eden hastalığa göre değişir.', 'Schematic teaching model: arrows show direction of effect, not size or mmHg. Guidelines list ACEi/ARB, calcium channel blockers and thiazide-type diuretics as first-line classes; choice depends on comorbidity.'));
    $('.htnlab-map title').textContent = `${t(item.name)}: ${FACTORS.filter(id => e[id]).map(id => `${t(FACTOR_NAMES[id])} ${e[id] < 0 ? '↓' : '↑'}`).join(', ')}`;
  }
  refresh();
  setTimeout(() => { treated = true; refresh(); }, 900);
  return { refresh };
}

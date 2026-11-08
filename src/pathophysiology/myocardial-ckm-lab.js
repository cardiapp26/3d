// Takotsubo syndrome, cardio-kidney-metabolic (SGLT2i) protection and cardiac lymphatics.
// Sources: Omerovic & Redfors (Nat Rev Cardiol 2026), Zelniker & Braunwald (Nat Rev Cardiol 2026),
// Brakenhielm (Nat Rev Cardiol 2026). Didactic, schematic values; not patient data.
// Static layer: rebuilt on mode, language or threshold-band change. Live layer: setAttribute
// per frame from the shared cardiac cycle clock; slider changes glide with tweenValues.
import { createCycleClock, createMotionBar, cycleShape, tweenValues } from './cycle-clock.js';

// Node tests import this module, so the stylesheet loads only in the browser (Vite).
if (typeof document !== 'undefined') import('./myocardial-motion.css');

const MODES = ['takotsubo', 'ckm', 'lymphatic'];

const TEXT = {
  modes: {
    takotsubo: { tr: 'Takotsubo (Katekolamin)', en: 'Takotsubo (Catecholamine)' },
    ckm: { tr: 'CKM ve SGLT2 İnhibitörü', en: 'CKM and SGLT2 Inhibitor' },
    lymphatic: { tr: 'Kardiyak Lenfatikler', en: 'Cardiac Lymphatics' }
  },
  takotsubo: {
    title: { tr: 'Takotsubo: β2-AR Gs → Gi anahtarı ve apikal balonlaşma', en: 'Takotsubo: β2-AR Gs → Gi switch and apical ballooning' },
    body: {
      tr: 'Ani duygusal/fiziksel stres suprafizyolojik epinefrin salgılatır. Apekste β-adrenerjik reseptör yoğunluğu en yüksektir; yüksek epinefrinde β2 reseptör Gs yerine Gi proteinine bağlanır (stimulus trafficking). Bu negatif inotropik ama hücre koruyucu geçiş apikal akinezi yapar; bazal segmentler hiperkinetiktir. Koroner arterler açıktır; mikrovasküler spazm eşlik edebilir. Bazal hiperkontraksiyon dinamik LVOT obstrüksiyonu oluşturabilir. Duvar hareketi günler-haftalar içinde düzelir (Omerovic ve Redfors 2026).',
      en: 'Sudden emotional or physical stress releases supraphysiological epinephrine. The apex has the highest β-adrenoceptor density; at high epinephrine the β2 receptor couples to Gi instead of Gs (stimulus trafficking). This negatively inotropic but cytoprotective switch produces apical akinesia with hyperkinetic basal segments. Coronaries are patent; microvascular spasm may coexist. Basal hypercontraction can cause dynamic LVOT obstruction. Wall motion recovers over days to weeks (Omerovic and Redfors 2026).'
    },
    slider: { tr: 'Katekolamin yükü', en: 'Catecholamine load' }
  },
  ckm: {
    title: { tr: 'SGLT2i: natriürez, enerji ve iyon dengesi', en: 'SGLT2i: natriuresis, energetics and ion balance' },
    body: {
      tr: 'SGLT2 inhibitörleri proksimal tübülde glukoz ve sodyum geri emilimini azaltır: glukozüri ve natriürez interstisyel sıvıyı plazmadan daha çok azaltır (dekonjesyon). Makula densaya ulaşan sodyum tübüloglomerüler geri bildirimi düzeltir, glomerüler hiperfiltrasyonu azaltır. Hafif ketozis miyokarda verimli yakıt sağlar; miyokardiyal NHE-1 ve geç sodyum akımı üzerinden hücre içi Na+/Ca2+ yükünün azaldığı öne sürülür. Etki diyabetten bağımsızdır (Zelniker ve Braunwald 2026).',
      en: 'SGLT2 inhibitors reduce proximal tubular glucose and sodium reabsorption: glycosuria and natriuresis shrink interstitial fluid more than plasma (decongestion). More sodium reaching the macula densa restores tubuloglomerular feedback and lowers glomerular hyperfiltration. Mild ketosis supplies an efficient myocardial fuel; reduced intracellular Na+/Ca2+ load via NHE-1 and late sodium current is proposed. Benefit is independent of diabetes (Zelniker and Braunwald 2026).'
    },
    slider: { tr: 'SGLT2i etkisi', en: 'SGLT2i effect' }
  },
  lymphatic: {
    title: { tr: 'Lenfatik drenaj, miyokard ödemi ve fibrozis', en: 'Lymphatic drainage, myocardial oedema and fibrosis' },
    body: {
      tr: 'Kardiyak lenfatikler epikarddan subendokarda uzanır, interstisyel sıvıyı, proteinleri ve immün hücreleri uzaklaştırır. İnfarktüs, hipertansiyon ve kalp yetersizliğinde lenfatik damarlar yeniden şekillenir ve işlevleri bozulur; ödem difüzyon mesafesini uzatır, inflamasyon çözülmez ve fibrozis artar. Deneysel VEGF-C/VEGFR3 lenfanjiyogenezi drenajı ve sol ventrikül işlevini iyileştirmiştir (Brakenhielm 2026).',
      en: 'Cardiac lymphatics run from epicardium to subendocardium, clearing interstitial fluid, protein and immune cells. After infarction, in hypertension and heart failure they remodel and fail; oedema lengthens diffusion distance, inflammation does not resolve and fibrosis grows. Experimental VEGF-C/VEGFR3 lymphangiogenesis improved drainage and LV function (Brakenhielm 2026).'
    },
    slider: { tr: 'Lenfatik kapasite (VEGF-C)', en: 'Lymphatic capacity (VEGF-C)' }
  }
};

const TAU = Math.PI * 2;
const EPI_MAX = 12, GLU_MAX = 14, KET_MAX = 10, NA_MAX = 10, CAP_MAX = 8, LYM_PER = 3, FLUID_MAX = 14, IMM_MAX = 8;
const wrap = x => ((x % 1) + 1) % 1;
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const f1 = n => n.toFixed(1);
const f2 = n => n.toFixed(2);
const fade = p => clamp(Math.min(p * 5, (1 - p) * 5));
const range = n => Array.from({ length: n }, (_, i) => i);
const setAttrs = (el, attrs) => { if (el) for (const [k, val] of Object.entries(attrs)) el.setAttribute(k, val); };
const lvotGradient = v => Math.max(0, (v - 0.55) * 120);
const oedemaOf = v => Math.max(0, 0.7 - v * 0.6);

/** Readout rows [label, value] for a mode at effect level v (0..1). */
export function metricsFor(mode, v, lang) {
  const en = lang === 'en';
  if (mode === 'takotsubo') {
    return [
      ['LVEF', `${Math.round(62 - v * 30)}%`],
      [en ? 'Apical wall motion' : 'Apikal duvar hareketi', v > 0.5 ? (en ? 'Akinetic' : 'Akinetik') : v > 0.25 ? (en ? 'Hypokinetic' : 'Hipokinetik') : 'Normal'],
      [en ? 'LVOT gradient' : 'LVOT gradyanı', `${Math.round(lvotGradient(v))} mmHg`],
      [en ? 'Coronary angiogram' : 'Koroner anjiyografi', en ? 'No culprit' : 'Suçlu lezyon yok']
    ];
  }
  if (mode === 'ckm') {
    return [
      [en ? 'Interstitial volume' : 'İnterstisyel hacim', `${Math.round(100 - v * 14)}%`],
      [en ? 'Glomerular pressure' : 'Glomerüler basınç', `${Math.round(60 - v * 10)} mmHg`],
      [en ? 'Ketone (β-OHB)' : 'Keton (β-OHB)', `${(0.15 + v * 0.45).toFixed(2)} mM`],
      [en ? 'Myocyte Na+ load' : 'Miyosit Na+ yükü', `${Math.round(100 - v * 18)}%`]
    ];
  }
  const oedema = Math.round(oedemaOf(v) * 100);
  return [
    [en ? 'Myocardial oedema' : 'Miyokard ödemi', `${oedema}%`],
    [en ? 'Lymph flow' : 'Lenf akımı', `${Math.round(20 + v * 80)}%`],
    [en ? 'Inflammation' : 'İnflamasyon', oedema > 40 ? (en ? 'Persistent' : 'Süregen') : (en ? 'Resolving' : 'Çözülüyor')],
    [en ? 'Fibrosis risk' : 'Fibrozis riski', oedema > 40 ? (en ? 'High' : 'Yüksek') : (en ? 'Low' : 'Düşük')]
  ];
}

/** Threshold band that changes static labels/colours; a change rebuilds the static layer. */
const bandOf = (mode, v) => (mode === 'takotsubo' ? Number(v > 0.5) : mode === 'ckm' ? Number(v > 0.1) : 0);

/**
 * Takotsubo LV in the apical view at contraction c: basal segments hyperkinetic (grow with
 * catecholamine), the apex moves inward normally at low load and balloons outward in systole
 * (dyskinesia) at high load.
 */
export function takotsuboGeom(v, c) {
  return {
    bulge: 20 + 30 * v + c * lerp(-18, 16, v),
    lift: c * (1 - v) * 22,
    half: 70 * (1 - c * (0.12 + 0.22 * v))
  };
}

function lvPath({ bulge, lift, half }) {
  const l = 200 - half, r = 200 + half, ay = 290 + bulge * 0.4 - lift, cy = 260 - lift * 0.6;
  return `M ${f1(l)} 60 L ${f1(r)} 60 C ${f1(260 + bulge * 0.6)} 150, ${f1(240 + bulge)} ${f1(cy)}, 200 ${f1(ay)} C ${f1(160 - bulge)} ${f1(cy)}, ${f1(140 - bulge * 0.6)} 150, ${f1(l)} 60 Z`;
}

function apexArcPath({ bulge, lift }) {
  const y = 200 - lift * 0.4, cy = 260 - lift * 0.8;
  return `M ${f1(160 - bulge * 0.7)} ${f1(y)} C ${f1(160 - bulge)} ${f1(cy)}, ${f1(240 + bulge)} ${f1(cy)}, ${f1(240 + bulge * 0.7)} ${f1(y)}`;
}

/** Point on the i-th lymphatic capillary (cubic Bezier from endocardium to epicardium) at s. */
function capPoint(i, s) {
  const x0 = 80 + i * 70, u = 1 - s;
  const x = u * u * u * x0 + 3 * u * u * s * (x0 + 10) + 3 * u * s * s * (x0 - 10) + s * s * s * (x0 + 5);
  const y = u * u * u * 290 + 3 * u * u * s * 220 + 3 * u * s * s * 160 + s * s * s * 100;
  return [x, y];
}

function takotsuboSvg(v, L) {
  const hi = v > 0.5;
  const apexColor = hi ? '#94a3b8' : '#ef4444';
  return `
      <text x="20" y="26" font-size="12" font-weight="800" fill="#0f172a">${L('Apikal 4 boşluk, canlı döngü', 'Apical 4-chamber view, live cycle')}</text>
      <path data-k="lv" fill="#fee2e2" stroke="#b91c1c" stroke-width="10" stroke-linejoin="round"/>
      <path data-k="arc" fill="none" stroke="${apexColor}" stroke-width="12" opacity="0.8"/>
      <path data-k="jet" class="ckm-jet" fill="none" stroke="#f97316" stroke-width="6" stroke-linecap="round" stroke-dasharray="10 7" opacity="0"/>
      <text data-k="jetLabel" x="292" y="96" font-size="10.5" font-weight="800" fill="#c2410c" opacity="0"></text>
      <text x="200" y="52" text-anchor="middle" font-size="11" font-weight="700" fill="#b91c1c">${L('Bazal: hiperkinetik (β1 Gs)', 'Basal: hyperkinetic (β1 Gs)')}</text>
      <text data-k="apexLabel" x="200" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">${L('Apeks: balonlaşma (β2 Gi)', 'Apex: ballooning (β2 Gi)')}</text>
      <g transform="translate(400,70)" font-size="11" font-weight="700">
        <rect width="210" height="210" rx="10" fill="#f8fafc" stroke="#cbd5e1"/>
        ${range(EPI_MAX).map(i => `<circle data-epi="${i}" class="hf-live-particle" cx="${30 + (i * 37) % 150}" cy="0" r="4" fill="#dc2626"/>`).join('')}
        <text x="12" y="22" fill="#0f172a" stroke="#f8fafc" stroke-width="4" paint-order="stroke">${L('Apikal miyosit β2-AR', 'Apical myocyte β2-AR')}</text>
        <rect x="20" y="40" width="170" height="14" rx="4" fill="#fde68a"/>
        <text x="105" y="51" text-anchor="middle" font-size="9.5" fill="#78350f">${L('Sarkolemma', 'Sarcolemma')}</text>
        <text data-k="gs" x="12" y="80" fill="${hi ? '#94a3b8' : '#16a34a'}">Gs → cAMP → ${L('inotropi', 'inotropy')} ${hi ? '↓' : '↑'}</text>
        <text data-k="gi" x="12" y="100" fill="${hi ? '#2563eb' : '#94a3b8'}">Gi → ${L('negatif inotropi', 'negative inotropy')} ${hi ? '↑' : ''}</text>
        <text x="12" y="120" fill="${hi ? '#2563eb' : '#94a3b8'}">Gi → PI3K/Akt ${L('anti-apoptoz', 'anti-apoptosis')}</text>
        <text x="12" y="150" font-size="10" fill="#475569">${L('Kırmızı noktalar: dolaşan epinefrin', 'Red dots: circulating epinephrine')}</text>
        <text x="12" y="170" font-size="10" fill="#475569">${L('Düzelme: günler-haftalar', 'Recovery: days to weeks')}</text>
        <text x="12" y="190" font-size="10" fill="#475569">${L('Sistolde apeks dışa, baz içe', 'Systole: apex out, base in')}</text>
      </g>`;
}

function ckmSvg(v, L) {
  const on = v > 0.1;
  return `
      <text x="20" y="26" font-size="12" font-weight="800" fill="#0f172a">${L('Böbrek - kalp aksı', 'Kidney - heart axis')}</text>
      <g transform="translate(30,50)">
        <rect width="270" height="280" rx="12" fill="#eff6ff" stroke="#93c5fd"/>
        <text x="14" y="22" font-size="11" font-weight="800" fill="#1e3a8a">${L('Proksimal tübül', 'Proximal tubule')}</text>
        <rect x="20" y="40" width="230" height="44" rx="22" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="236" y="36" text-anchor="end" font-size="9.5" fill="#1e40af">${L('idrara →', 'to urine →')}</text>
        <rect x="20" y="118" width="230" height="20" rx="4" fill="${on ? '#e2e8f0' : '#bfdbfe'}" stroke="#2563eb"/>
        <text x="135" y="132" text-anchor="middle" font-size="10" font-weight="700" fill="#1e3a8a">SGLT2 ${on ? L('bloke', 'blocked') : L('aktif', 'active')}</text>
        ${range(GLU_MAX).map(i => `<circle data-glu="${i}" class="hf-live-particle" r="4" fill="#f59e0b"/>`).join('')}
        <text x="135" y="104" text-anchor="middle" font-size="10" fill="#1e40af">${L('Glukoz + Na+ idrarda kalır', 'Glucose + Na+ stay in urine')}</text>
        <circle data-k="glom" cx="70" cy="200" r="30" fill="#fca5a5" stroke="#b91c1c" stroke-width="2"/>
        <text x="70" y="204" text-anchor="middle" font-size="10" font-weight="700" fill="#7f1d1d">${L('Glomerül', 'Glomerulus')}</text>
        <text x="160" y="190" font-size="10" fill="#334155">${L('Makula densa Na+ ↑', 'Macula densa Na+ ↑')}</text>
        <text x="160" y="206" font-size="10" fill="#334155">${L('Afferent tonus ↑', 'Afferent tone ↑')}</text>
        <text x="160" y="222" font-size="10" fill="#334155">${L('Hiperfiltrasyon ↓', 'Hyperfiltration ↓')}</text>
      </g>
      <g transform="translate(330,50)">
        <rect width="280" height="280" rx="12" fill="#fff1f2" stroke="#fda4af"/>
        <text x="14" y="22" font-size="11" font-weight="800" fill="#881337">${L('Kardiyomiyosit', 'Cardiomyocyte')}</text>
        <rect data-k="cell" x="30" y="40" width="220" height="150" rx="30" fill="#fecdd3" stroke="#be123c" stroke-width="2"/>
        ${range(NA_MAX).map(i => `<circle data-na="${i}" r="3.2" fill="#7c3aed"/>`).join('')}
        <text x="226" y="186" text-anchor="end" font-size="9" font-weight="700" fill="#6d28d9">Na+</text>
        <text x="50" y="72" font-size="10.5" font-weight="700" fill="#9f1239">NHE-1 / ${L('geç INa', 'late INa')} ${on ? '↓' : ''}</text>
        <text x="50" y="94" font-size="10.5" font-weight="700" fill="#9f1239">[Na+]i ${on ? '↓' : '↑'} → [Ca2+]i ${on ? '↓' : '↑'}</text>
        <text x="50" y="116" font-size="10.5" font-weight="700" fill="#065f46">${L('Ketonlar → ATP/O2 ↑', 'Ketones → ATP/O2 ↑')}</text>
        <rect data-k="energy" x="50" y="130" width="72" height="14" rx="4" fill="#10b981"/>
        <text x="50" y="160" font-size="10" fill="#334155">${L('Enerji verimi', 'Energetic efficiency')}</text>
        <text x="20" y="220" font-size="10.5" fill="#334155">${L('İnterstisyel dekonjesyon > plazma', 'Interstitial decongestion > plasma')}</text>
        <text x="20" y="240" font-size="10.5" fill="#334155">${L('Yarar HbA1c’den bağımsız', 'Benefit independent of HbA1c')}</text>
      </g>
      <path d="M 40 346 H 600" stroke="#d1fae5" stroke-width="10" stroke-linecap="round"/>
      ${range(KET_MAX).map(i => `<circle data-ket="${i}" cy="346" r="4" fill="#059669"/>`).join('')}
      <text x="40" y="366" font-size="10" font-weight="700" fill="#065f46">${L('Karaciğer → β-OHB → miyokard (hafif ketozis)', 'Liver → β-OHB → myocardium (mild ketosis)')}</text>`;
}

function lymphSvg(L) {
  const capD = i => `M ${80 + i * 70} 290 C ${90 + i * 70} 220, ${70 + i * 70} 160, ${85 + i * 70} 100`;
  return `
      <text x="20" y="26" font-size="12" font-weight="800" fill="#0f172a">${L('Miyokard duvarı: epikarddan endokarda', 'Myocardial wall: epicardium to endocardium')}</text>
      <rect x="30" y="50" width="580" height="60" fill="#fef3c7" stroke="#d97706"/>
      <text x="40" y="70" font-size="10.5" font-weight="700" fill="#92400e">${L('Epikard: toplayıcı lenfatikler', 'Epicardium: collecting lymphatics')}</text>
      <rect data-k="bg" x="30" y="110" width="580" height="180" fill="#93c5fd" stroke="#be123c"/>
      ${range(9).map(i => `<rect data-myo="${i}" x="${50 + i * 62}" y="${130 + (i % 2) * 10}" width="44" height="140" rx="10" fill="#fca5a5" stroke="#b91c1c"/>`).join('')}
      ${range(CAP_MAX).map(i => `<path data-cap="${i}" d="${capD(i)}" fill="none" stroke="#16a34a" stroke-width="4"/>`).join('')}
      ${range(CAP_MAX * LYM_PER).map(i => `<circle data-lym="${i}" class="hf-live-particle" r="3.6" fill="#bbf7d0" stroke="#15803d" stroke-width="1.4"/>`).join('')}
      ${range(FLUID_MAX).map(i => `<circle data-fluid="${i}" r="5" fill="#3b82f6" opacity="0.7"/>`).join('')}
      ${range(IMM_MAX).map(i => `<circle data-imm="${i}" r="6" fill="#7c3aed"/>`).join('')}
      <rect x="30" y="290" width="580" height="8" fill="#fecaca"/>
      <text x="40" y="318" font-size="10.5" font-weight="700" fill="#1e3a8a">${L('Mavi: interstisyel sıvı · Mor: immün hücreler · Yeşil: lenfatik kapillerler', 'Blue: interstitial fluid · Purple: immune cells · Green: lymphatic capillaries')}</text>
      <text x="40" y="336" font-size="10" fill="#475569">${L('Lenf akımı her sistolde miyokard sıkışmasıyla ilerler', 'Lymph advances with each systolic myocardial squeeze')}</text>`;
}

function drawTakotsubo(els, v, t, shape, L) {
  const c = shape.contraction;
  const g = takotsuboGeom(v, c);
  setAttrs(els.lv, { d: lvPath(g) });
  setAttrs(els.arc, { d: apexArcPath(g) });
  setAttrs(els.apexLabel, { y: f1(318 + g.bulge * 0.4 - g.lift) });
  const grad = lvotGradient(v);
  const jet = shape.phase === 'ejection' ? clamp(grad / 54) * (0.35 + 0.65 * shape.pressure) : 0;
  const x0 = 200 + g.half - 8;
  setAttrs(els.jet, { d: `M ${f1(x0)} 66 Q 300 ${f1(66 - 18 * shape.pressure)} 345 78`, opacity: f2(jet), 'stroke-dashoffset': f1(-t * 60) });
  setAttrs(els.jetLabel, { opacity: f2(grad > 0 ? Math.max(0.35, jet) : 0) });
  if (els.jetLabel) {
    const txt = `LVOT ${L('jeti', 'jet')} ${Math.round(grad * (0.4 + 0.6 * (shape.phase === 'ejection' ? shape.pressure : 0)))} mmHg`;
    if (els.jetLabel.textContent !== txt) els.jetLabel.textContent = txt;
  }
  const active = v > 0.5 ? els.gi : els.gs;
  setAttrs(active, { opacity: f2(0.55 + 0.45 * c) });
  const n = Math.round(3 + 9 * v);
  els.epi.forEach((el, i) => {
    const p = wrap(t * 0.9 + i * 0.29);
    setAttrs(el, { cy: f1(4 + p * 34), opacity: f2(i < n ? fade(p) : 0) });
  });
}

function drawCkm(els, v, t, shape) {
  const urinary = Math.round(GLU_MAX * 0.5 * v);
  els.glu.forEach((el, i) => {
    const p = wrap(t * 0.35 + i / GLU_MAX), ly = 56 + (i % 2) * 12;
    let x = 34 + p * 212, y = ly, op = fade(p) * 1.5;
    if ((i * 5) % GLU_MAX >= urinary && p > 0.42) {
      const k = clamp((p - 0.42) / 0.2);
      x = 34 + 0.42 * 212 + ((i % 3) - 1) * 16 * k;
      y = lerp(ly, 152, k);
      op = 1 - clamp((p - 0.6) / 0.08);
    }
    setAttrs(el, { cx: f1(x), cy: f1(y), opacity: f2(clamp(op)) });
  });
  const r = (34 - 6 * v) * (1 + 0.06 * shape.pressure * (1 - 0.5 * v));
  setAttrs(els.glom, { r: f1(r) });
  const c = shape.contraction, sx = 1 - 0.06 * c, sy = 1 + 0.03 * c;
  setAttrs(els.cell, { transform: `translate(140 115) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-140 -115)` });
  setAttrs(els.energy, { width: f1(180 * (0.4 + 0.6 * v)) });
  const naN = Math.round(NA_MAX * (1 - 0.18 * v) - 0.2);
  els.na.forEach((el, i) => {
    const w = TAU * (t * 0.6 + i * 0.31);
    setAttrs(el, { cx: f1(192 + (i * 13) % 46 + 3 * Math.sin(w)), cy: f1(58 + (i * 17) % 64 + 3 * Math.cos(w)), opacity: i < naN ? '0.85' : '0' });
  });
  const ketN = Math.round(2 + 8 * v);
  els.ket.forEach((el, i) => {
    const p = wrap(t * 0.22 + i / KET_MAX);
    setAttrs(el, { cx: f1(44 + p * 552), opacity: f2(i < ketN ? fade(p) : 0) });
  });
}

function drawLymph(els, v, t, shape, travel) {
  const c = shape.contraction, oedema = oedemaOf(v);
  setAttrs(els.bg, { 'fill-opacity': f2(0.15 + oedema * 0.6) });
  els.myo.forEach((el, i) => {
    const y0 = 130 + (i % 2) * 10;
    setAttrs(el, { y: f1(y0 + 5.6 * c), height: f1(140 * (1 - 0.08 * c)), x: f1(50 + i * 62 - 1.3 * c), width: f1(44 * (1 + 0.06 * c)) });
  });
  const capCount = 2 + 6 * v;
  els.cap.forEach((el, i) => setAttrs(el, { opacity: f2(clamp(capCount - i)) }));
  els.lym.forEach((el, j) => {
    const i = Math.floor(j / LYM_PER), s = wrap(travel * 0.8 + (j % LYM_PER) / LYM_PER + i * 0.13);
    const [x, y] = capPoint(i, s);
    setAttrs(el, { cx: f1(x), cy: f1(y), opacity: f2(clamp(capCount - i) * fade(s)) });
  });
  const fluidN = oedema * 20;
  els.fluid.forEach((el, i) => {
    const w = TAU * (t * 0.25 + i * 0.17);
    setAttrs(el, { cx: f1(60 + (i * 53) % 540 + 3 * Math.sin(w)), cy: f1(150 + (i * 37) % 120 + 3 * Math.cos(w) - 3 * c), opacity: f2(0.7 * clamp(fluidN - i)) });
  });
  const immN = oedema * 8;
  els.imm.forEach((el, i) => {
    const w = TAU * (t * 0.08 + i * 0.23);
    setAttrs(el, { cx: f1(100 + (i * 71) % 480 + 6 * Math.sin(w)), cy: f1(180 + (i * 23) % 80 + 4 * Math.sin(w * 1.7)), opacity: f2(clamp(immN - i)) });
  });
}

export function createMyocardialCkmLab(opts = {}) {
  const mount = opts.mount || opts.container;
  let lang = opts.lang === 'en' ? 'en' : 'tr';
  let mode = 'takotsubo';
  const level = { takotsubo: 70, ckm: 0, lymphatic: 30 };
  let shown = level[mode] / 100;
  let band = bandOf(mode, shown);
  let beats = 0, lastPhase = 0, travel = 0;
  let cancelTween = () => {};
  let els = {};
  const t = o => (lang === 'en' ? o.en : o.tr);
  const L = (tr, en) => (lang === 'en' ? en : tr);

  const clock = createCycleClock({ bpm: 75, speed: 0.5 });
  const motionBar = createMotionBar(clock, { getLang: () => lang, label: { tr: 'Kalp döngüsü:', en: 'Cardiac cycle:' } });
  const root = document.createElement('div');
  root.className = 'pathophys-lab pathophys-ckm-lab';
  const body = document.createElement('div');
  root.append(motionBar.element, body);

  function stageHtml() {
    if (mode === 'takotsubo') return takotsuboSvg(shown, L);
    if (mode === 'ckm') return ckmSvg(shown, L);
    return lymphSvg(L);
  }

  function cacheStage() {
    const svg = body.querySelector('.ckm-svg');
    const all = key => [...svg.querySelectorAll(`[data-${key}]`)];
    els = {
      ...els,
      svg,
      ...Object.fromEntries([...svg.querySelectorAll('[data-k]')].map(e => [e.dataset.k, e])),
      epi: all('epi'), glu: all('glu'), na: all('na'), ket: all('ket'),
      myo: all('myo'), cap: all('cap'), lym: all('lym'), fluid: all('fluid'), imm: all('imm')
    };
  }

  function renderStage() {
    els.svg.innerHTML = stageHtml();
    cacheStage();
  }

  function renderBody() {
    const tx = TEXT[mode];
    body.innerHTML = `
      <div class="preset-pill-group" style="margin-bottom:12px">
        ${MODES.map(m => `<button type="button" class="preset-pill ${m === mode ? 'active' : ''}" data-ckm-mode="${m}" aria-pressed="${m === mode}">${t(TEXT.modes[m])}</button>`).join('')}
      </div>
      <div class="pathophys-grid">
        <div class="pathophys-stage"><svg viewBox="0 0 640 370" class="pathophys-svg ckm-svg ckm-live-svg" role="img" aria-label="${t(tx.title)}">${stageHtml()}</svg></div>
        <div class="pathophys-controls">
          <div class="pathophys-sliders">
            <label class="pathophys-slider-row">
              <span class="slider-label"><strong>${t(tx.slider)}</strong></span>
              <input type="range" data-ckm-slider min="0" max="100" step="5" value="${level[mode]}">
              <span class="slider-val" data-ckm-slider-val>${level[mode]}%</span>
            </label>
          </div>
          <div class="metrics-card"><div class="metrics-grid">
            ${metricsFor(mode, shown, lang).map(([k, val]) => `<div class="metric-item"><span class="metric-lbl">${k}</span><span class="metric-num ckm-metric-num" data-ckm-metric>${val}</span></div>`).join('')}
          </div></div>
          <div class="clinical-desc-box"><h4>${t(tx.title)}</h4><p>${t(tx.body)}</p></div>
        </div>
      </div>`;
    els = { metrics: [...body.querySelectorAll('[data-ckm-metric]')], sliderVal: body.querySelector('[data-ckm-slider-val]') };
    cacheStage();
    band = bandOf(mode, shown);
    body.querySelectorAll('[data-ckm-mode]').forEach(b => b.addEventListener('click', () => selectMode(b.dataset.ckmMode)));
    body.querySelector('[data-ckm-slider]').addEventListener('input', e => setLevel(Number(e.target.value)));
    clock.refresh();
  }

  function selectMode(next) {
    if (next === mode || !MODES.includes(next)) return;
    cancelTween();
    mode = next;
    shown = level[mode] / 100;
    renderBody();
  }

  function setLevel(value) {
    level[mode] = value;
    if (els.sliderVal) els.sliderVal.textContent = `${value}%`;
    cancelTween();
    cancelTween = tweenValues({ v: shown }, { v: value / 100 }, o => { shown = o.v; clock.refresh(); }, 450);
  }

  function drawMetrics() {
    metricsFor(mode, shown, lang).forEach(([, val], i) => {
      const el = els.metrics[i];
      if (el && el.textContent !== val) el.textContent = val;
    });
  }

  function onFrame(state) {
    const dphase = wrap(state.phase - lastPhase);
    if (state.playing && state.phase < lastPhase - 0.5) beats += 1;
    lastPhase = state.phase;
    const shape = cycleShape(state.phase);
    if (dphase < 0.5) travel += dphase * (0.2 + 0.8 * shown) * (0.4 + 1.6 * shape.contraction);
    const tt = beats + state.phase;
    const b = bandOf(mode, shown);
    if (b !== band) { band = b; renderStage(); }
    if (mode === 'takotsubo') drawTakotsubo(els, shown, tt, shape, L);
    else if (mode === 'ckm') drawCkm(els, shown, tt, shape);
    else drawLymph(els, shown, tt, shape, travel);
    drawMetrics();
    motionBar.render(state, shape.phase);
  }

  renderBody();
  mount?.append(root);
  const unsubscribe = clock.subscribe(onFrame);

  return {
    updateLanguage(next) {
      lang = next === 'en' ? 'en' : 'tr';
      motionBar.setLanguage();
      renderBody();
    },
    destroy() {
      cancelTween();
      unsubscribe();
      clock.destroy();
      root.remove();
    }
  };
}

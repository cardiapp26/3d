const t = (tr, en) => ({ tr, en });

export const METABOLISM_TARGETS = [
  { id: 'npc1l1', label: 'NPC1L1', kind: t('Taşıyıcı', 'Transporter'),
    name: t('Niemann-Pick C1 benzeri protein 1', 'Niemann-Pick C1-like protein 1'),
    site: t('Enterositin fırçamsı kenarı', 'Enterocyte brush border'),
    role: t('Kolesterolün enterosite alınmasına aracılık eder. Ezetimib bu basamağı inhibe eder; yağ asidi alımını doğrudan bloke etmez.', 'Mediates intestinal cholesterol uptake. Ezetimibe inhibits this step without directly blocking fatty acid uptake.') },
  { id: 'abcg58', label: 'ABCG5/G8', kind: t('Taşıyıcı', 'Transporter'),
    name: t('ATP bağlayan kaset taşıyıcıları G5 ve G8', 'ATP-binding cassette transporters G5 and G8'),
    site: t('Enterositin apikal zarı ve hepatositin kanaliküler zarı', 'Apical enterocyte and canalicular hepatocyte membranes'),
    role: t('Enterositte bitkisel sterolleri ve bir miktar kolesterolü lümene geri verir; karaciğerde sterollerin safraya salgılanmasına katkı sağlar.', 'Returns plant sterols and some cholesterol to the gut lumen, and contributes to biliary sterol secretion in the liver.') },
  { id: 'mtp', label: 'MTP', kind: t('Lipid aktarım proteini', 'Lipid transfer protein'),
    name: t('Mikrozomal trigliserid aktarım proteini', 'Microsomal triglyceride transfer protein'),
    site: t('Enterosit ve hepatosit endoplazmik retikulumu', 'Endoplasmic reticulum of enterocytes and hepatocytes'),
    role: t('Enterositte apoB-48’e lipid yükleyerek şilomikron, hepatositte apoB-100’e lipid yükleyerek VLDL oluşmasına yardım eder.', 'Loads lipids onto apoB-48 for chylomicron assembly in enterocytes and onto apoB-100 for VLDL assembly in hepatocytes.') },
  { id: 'cetp', label: 'CETP', kind: t('Lipid aktarım proteini', 'Lipid transfer protein'),
    name: t('Kolesterol esteri aktarım proteini', 'Cholesteryl ester transfer protein'),
    site: t('Plazma', 'Plasma'),
    role: t('HDL’den apoB içeren lipoproteinlere kolesterol esteri aktarabilir; ters yönde trigliserid geçer. HDL ve apoB partikülü ayrı kalır.', 'Can move cholesteryl ester from HDL to apoB-containing lipoproteins, with triglyceride moving in the other direction. The two particles remain distinct.') }
];

export const METABOLISM_JOURNEYS = [
  { id: 'absorption', particles: [], name: t('Bağırsak emilimi ve lenf', 'Intestinal uptake and lymph'), apo: '',
    identity: t('Misel bağırsak lümeninde kalır; şilomikron enterositte ayrı olarak kurulur.', 'The micelle stays in the gut lumen; a separate chylomicron is assembled in the enterocyte.'),
    stages: [
      { scene: 'micelle', label: t('Misel', 'Micelle'), title: t('1. Safra asitleri lipidleri fırçamsı kenara taşır', '1. Bile acids help deliver lipids to the brush border'),
        detail: t('Safra asitleri, serbest kolesterol ve yağ sindirim ürünleriyle karışık miseller oluşturur. Lipidler hücre yüzeyine ulaşır; misel bütünüyle hücreye girmez.', 'Bile acids form mixed micelles with free cholesterol and products of fat digestion. Lipids reach the cell surface; the micelle itself does not enter the cell.') },
      { scene: 'uptake', target: 'npc1l1', label: 'NPC1L1', title: t('2. Kolesterol ve yağ asidi farklı yollardan girer', '2. Cholesterol and fatty acids enter by different routes'),
        detail: t('NPC1L1 kolesterol alımına aracılık eder. Ezetimib kolesterol geçişini azaltır; yağ asidi yolu doğrudan etkilenmez.', 'NPC1L1 mediates cholesterol uptake. Ezetimibe reduces cholesterol uptake without directly affecting the fatty acid route.') },
      { scene: 'efflux', target: 'abcg58', label: 'ABCG5/G8', title: t('3. Enterosit bazı sterolleri geri verir', '3. The enterocyte returns some sterols to the lumen'),
        detail: t('ABCG5/G8 özellikle bitkisel sterolleri, ayrıca bir miktar kolesterolü bağırsak lümenine geri taşır.', 'ABCG5/G8 returns mainly plant sterols, along with some cholesterol, to the gut lumen.') },
      { scene: 'assembly', target: 'mtp', label: t('Paketleme', 'Assembly'), title: t('4. MTP, apoB-48 üzerine lipid yükler', '4. MTP loads lipid onto apoB-48'),
        detail: t('Enterosit yağ asitlerinden yeniden trigliserid yapar. SOAT2 (ACAT2), kolesterolün bir kısmını esterler. MTP, trigliserid ve kolesterol esteri içeren şilomikronun kurulmasına yardım eder.', 'The enterocyte reassembles fatty acids into triglycerides. SOAT2 (ACAT2) esterifies some cholesterol. MTP helps assemble a chylomicron carrying triglycerides and cholesteryl esters.') },
      { scene: 'lymph', label: t('Lenf → kan', 'Lymph → blood'), title: t('5. Şilomikron lenf üzerinden kana girer', '5. Chylomicrons enter blood through lymph'),
        detail: t('ApoB-48 taşıyan şilomikron villustaki lenf kılcalına geçer. Torasik kanal üzerinden venöz dolaşıma ulaşır. Sonraki LPL ve kalıntı alımını Şilomikron → kalıntı yolunda izle.', 'The apoB-48 chylomicron enters a villus lymphatic and reaches venous blood through the thoracic duct. Follow LPL and remnant uptake in the Chylomicron → remnant pathway.') }
    ] },
  { id: 'cetp', particles: [], name: t('HDL: CETP ile dolaylı yol', 'HDL: indirect route via CETP'), apo: '',
    identity: t('SR-BI yolunda HDL, ester yükünü doğrudan verir. CETP yolunda ester önce başka bir partiküle geçer; HDL, LDL’ye dönüşmez.', 'With SR-BI, HDL delivers ester cargo directly. With CETP, the ester first moves to a different particle; HDL does not become LDL.'),
    stages: [
      { scene: 'exchange', target: 'cetp', label: t('Lipid takası', 'Lipid exchange'), title: t('1. CETP iki ayrı partikül arasında lipid aktarır', '1. CETP transfers lipids between separate particles'),
        detail: t('Kolesterol esteri HDL’den apoB içeren bir partiküle geçer; trigliserid ters yönde HDL’ye geçer. Şemada alıcı LDL’dir; VLDL de alıcı olabilir.', 'Cholesteryl ester moves from HDL to an apoB-containing particle; triglyceride moves in the opposite direction into HDL. LDL is shown as an example recipient; VLDL can also receive esters.') },
      { scene: 'indirect', target: 'ldlr', label: t('Karaciğere alım', 'Hepatic uptake'), title: t('2. LDLR, ester yükünü taşıyan LDL’yi alır', '2. LDLR takes up LDL carrying the ester cargo'),
        detail: t('LDLR, apoB-100 üzerinden LDL’nin tamamını karaciğer hücresine alır. HDL dolaşımda kalırken aktardığı ester LDL’nin yüküyle birlikte karaciğere ulaşır.', 'LDLR recognizes apoB-100 and takes up the entire LDL particle into a hepatocyte. HDL stays in circulation while its transferred ester arrives as part of the LDL cargo.') }
    ] }
];

const NS = 'http://www.w3.org/2000/svg';
const colors = { fc: '#795032', fa: '#08786c', plant: '#7553a7', ce: '#df6a0b', tg: '#a07100', particle: '#17667b' };
const box = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${fill}" stroke="#92a99b"/>`;
const label = (x, y, value) => `<text x="${x}" y="${y}" text-anchor="middle">${value}</text>`;
const dot = (x, y, kind, r = 5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${colors[kind]}" stroke="#fff" stroke-width="1.4"/>`;
const particle = (x, y, kind, r) => {
  const hue = { hdl: '#138153', ldl: '#9c3541', cm: '#17667b' }[kind];
  return `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#fff6dc" stroke="${hue}" stroke-width="3"/>
    ${dot(-r * .33, -r * .26, 'ce', r * .18)}${dot(r * .28, -r * .1, 'tg', r * .16)}${dot(0, r * .33, kind === 'cm' ? 'tg' : 'ce', r * .16)}
    <path d="M${-r * .8} ${r * .62}Q0 ${r * 1.35} ${r * .8} ${r * .62}" fill="none" stroke="${hue}" stroke-width="5" stroke-linecap="round"/></g>`;
};
const arrow = (d, kind, reduced = false) => ({ d, kind, reduced });
const lexicon = {
  lumen: t('Lümen', 'Lumen'), cell: t('Enterosit', 'Enterocyte'), liver: t('Hepatosit', 'Hepatocyte'),
  fc: t('Kolesterol', 'Cholesterol'), fa: t('Yağ asidi', 'Fatty acid'), plant: t('Bitkisel sterol', 'Plant sterol'),
  ce: t('Kolesterol esteri', 'Cholesteryl ester'), tg: t('Trigliserid', 'Triglyceride'), micelle: t('Karışık misel', 'Mixed micelle'),
  cm: t('Şilomikron', 'Chylomicron'), lymph: t('Lenf kılcalı', 'Lymphatic'), duct: t('Torasik kanal', 'Thoracic duct'),
  blood: t('Venöz kan', 'Venous blood')
};

// Coordinates are diagram geometry. Particle counts and travel times have no quantitative meaning.
function diagram(scene, tr, ezetimibe) {
  const word = key => lexicon[key][tr ? 'tr' : 'en'];
  const gut = () => box(10, 10, 400, 204, '#fcf6e8') +
    '<path d="M210 10H394Q410 10 410 26V198Q410 214 394 214H210Z" fill="#e5f0e4"/>' +
    '<path d="M210 25V199" stroke="#56846a" stroke-width="4"/>' +
    Array.from({ length: 15 }, (_, i) => `<rect x="197" y="${27 + i * 12}" width="14" height="6" rx="3" fill="#56846a"/>`).join('') +
    label(103, 38, word('lumen')) + label(310, 38, word('cell'));
  const chip = (x, y, value) => box(x - 42, y - 16, 84, 24, '#fff') + label(x, y, value);
  switch (scene) {
    case 'micelle':
      return { art: gut() + '<circle cx="91" cy="116" r="32" fill="#f1e4bf" stroke="#ae8835" stroke-width="3" stroke-dasharray="4 3"/>' +
        dot(81, 109, 'fc') + dot(100, 122, 'fa') + label(91, 169, word('micelle')),
        routes: [arrow('M116 106Q150 91 188 99', 'fc'), arrow('M115 128Q150 145 188 138', 'fa')], keys: ['fc', 'fa'] };
    case 'uptake':
      return { art: gut() + chip(205, 72, 'NPC1L1') + label(320, 82, word('fc')) + label(320, 157, word('fa')) +
        (ezetimibe ? '<path d="M204 91V109M216 91V109" stroke="#9c3541" stroke-width="3" stroke-linecap="round"/>' : ''),
        routes: [arrow('M67 100H352', 'fc', ezetimibe), arrow('M67 177H352', 'fa')], keys: ['fc', 'fa'] };
    case 'efflux':
      return { art: gut() + chip(205, 83, 'ABCG5/G8'),
        routes: [arrow('M340 112H70', 'plant'), arrow('M340 161H70', 'fc')], keys: ['plant', 'fc'] };
    case 'assembly':
      return { art: box(10, 10, 400, 204, '#e5f0e4') + label(210, 38, word('cell')) + chip(210, 67, 'MTP') +
        particle(326, 128, 'cm', 33) + label(326, 179, word('cm')) + label(326, 199, 'apoB-48'),
        routes: [arrow('M74 104Q180 86 296 117', 'tg'), arrow('M74 154Q180 173 296 138', 'ce')], keys: ['tg', 'ce'] };
    case 'lymph':
      return { art: box(10, 12, 123, 199, '#e5f0e4') + box(145, 12, 130, 199, '#dcf2f1') + box(287, 12, 123, 199, '#fae2e1') +
        label(72, 44, word('cell')) + label(210, 44, word('lymph')) + label(348, 44, word('blood')) +
        label(210, 178, word('duct')) + label(210, 199, 'apoB-48'),
        routes: [arrow('M65 111Q137 161 210 113T354 110', 'particle')], keys: [] };
    case 'exchange':
      return { art: box(10, 12, 400, 199, '#eef4ed') + label(74, 56, 'HDL') + label(346, 56, 'LDL') +
        particle(74, 125, 'hdl', 24) + particle(346, 125, 'ldl', 32) + chip(210, 131, 'CETP') +
        label(74, 183, 'apoA-I') + label(346, 183, 'apoB-100'),
        routes: [arrow('M96 115Q208 63 322 105', 'ce'), arrow('M321 146Q208 190 92 141', 'tg')], keys: ['ce', 'tg'] };
    case 'indirect':
      return { art: box(271, 12, 139, 199, '#e5f0e4') + label(340, 45, word('liver')) + chip(270, 84, 'LDLR') +
        particle(55, 59, 'hdl', 18) + label(55, 94, 'HDL') + label(167, 188, 'LDL · apoB-100'),
        routes: [arrow('M103 134H352', 'particle')], keys: [] };
  }
}

export function createMetabolismScene(svg, legend) {
  let tracks = [];
  const make = (tag, attrs) => {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    return element;
  };

  function show(scene, lang, ezetimibe) {
    const { art, routes, keys } = diagram(scene, lang === 'tr', ezetimibe);
    svg.dataset.metabolismScene = scene;
    svg.querySelector('[data-metabolism-art]').innerHTML = art;
    const layer = svg.querySelector('[data-metabolism-paths]');
    layer.replaceChildren();
    tracks = routes.map(({ d, kind, reduced }) => {
      const path = make('path', { d, fill: 'none', stroke: colors[kind], 'stroke-width': 2,
        'stroke-dasharray': '5 4', opacity: reduced ? 0.36 : 1, 'data-metabolism-route': kind });
      layer.append(path);
      const length = path.getTotalLength();
      const end = path.getPointAtLength(length), near = path.getPointAtLength(length - 8);
      layer.append(make('path', { d: 'M-8 -4L0 0L-8 4Z', fill: colors[kind], opacity: reduced ? 0.36 : 1,
        transform: `translate(${end.x} ${end.y}) rotate(${Math.atan2(end.y - near.y, end.x - near.x) * 180 / Math.PI})` }));
      const tokens = Array.from({ length: kind === 'particle' || reduced ? 1 : 3 }, () => {
        const node = make('g', { 'data-metabolism-token': kind });
        if (kind === 'particle') node.innerHTML = particle(0, 0, scene === 'lymph' ? 'cm' : 'ldl', 17);
        else node.innerHTML = dot(0, 0, kind);
        layer.append(node);
        return node;
      });
      return { path, length, tokens };
    });
    legend.replaceChildren(...keys.map(key => {
      const node = document.createElement('span');
      node.textContent = lexicon[key][lang];
      node.style.setProperty('--lpt-dot', colors[key]);
      return node;
    }));
    legend.hidden = keys.length === 0;
  }

  function draw(progress) {
    for (const { path, length, tokens } of tracks) {
      tokens.forEach((node, i) => {
        const start = tokens.length === 1 ? 0.05 : 0.22 - i * 0.08;
        const fraction = start + (1 - i * 0.18 - start) * progress;
        const point = path.getPointAtLength(length * fraction);
        node.setAttribute('transform', `translate(${point.x} ${point.y})`);
      });
    }
  }
  return { show, draw };
}

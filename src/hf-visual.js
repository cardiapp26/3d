// Heart failure neurohormonal network beside the 3D heart render. Selecting a drug marks the
// nodes it blocks (⊣) or stimulates (+); selecting a node lists drugs acting there.
// Teaching map of mechanisms, not a hemodynamic or dose model.
const HEART_IMAGE = new URL('./assets/pharmacology-heart.webp', import.meta.url).href;
const SVG_NS = 'http://www.w3.org/2000/svg';
const text = (tr, en) => ({ tr, en });
const BOX = { w: 180, h: 52 };

/** Node centers in the 760x440 map; column 1 x=380, column 2 x=600. */
export const HF_NODES = {
  sns: { at: [380, 46], title: text('Sempatik sistem', 'Sympathetic system'), sub: 'β1', why: text('Kronik sempatik aktivasyon taşikardi, aritmi ve miyosit kaybını artırır; β1 uyarısı renin salgılatır.', 'Chronic sympathetic activation drives tachycardia, arrhythmia and myocyte loss; β1 stimulation releases renin.') },
  myocyte: { at: [380, 128], title: text('Miyosit', 'Myocyte'), sub: 'Na⁺/K⁺-ATPase · β1 · PDE3', why: text('Kontraktilite hücre içi Ca²⁺ ve cAMP ile belirlenir; inotroplar ve digoksin burada etki eder.', 'Contractility depends on intracellular Ca²⁺ and cAMP; inotropes and digoxin act here.') },
  tubule: { at: [380, 210], title: text('Renal tübül', 'Renal tubule'), sub: 'SGLT2 · NKCC2', why: text('Na⁺ ve su tutulumu konjesyonu artırır; tübül taşıyıcıları natriürez hedefidir.', 'Sodium and water retention drives congestion; tubular transporters are natriuretic targets.') },
  vessels: { at: [380, 292], title: text('Arter ve venler', 'Arteries and veins'), sub: text('ard yük · ön yük', 'afterload · preload'), why: text('Arteriyel tonus ard yükü, venöz tonus ön yükü ve dolum basıncını belirler.', 'Arterial tone sets afterload; venous tone sets preload and filling pressure.') },
  np: { at: [380, 380], title: text('Natriüretik peptidler', 'Natriuretic peptides'), sub: 'BNP · ANP → cGMP', why: text('Gerilen miyokard BNP salgılar: natriürez ve vazodilatasyon, RAAS karşıtı etki.', 'Stretched myocardium releases BNP: natriuresis and vasodilation that oppose RAAS.') },
  renin: { at: [600, 46], title: 'Renin → Ang I', sub: text('jukstaglomerüler hücre', 'juxtaglomerular cells'), why: text('Azalmış renal perfüzyon ve β1 uyarısı renin salınımını artırır.', 'Reduced renal perfusion and β1 stimulation increase renin release.') },
  ang2: { at: [600, 128], title: 'ACE → Ang II', sub: text('anjiyotensin II', 'angiotensin II'), why: text('Ang II vazokonstriksiyon, aldosteron salgısı ve miyokard yeniden şekillenmesini tetikler.', 'Ang II drives vasoconstriction, aldosterone release and myocardial remodeling.') },
  at1: { at: [600, 210], title: text('AT1 reseptörü', 'AT1 receptor'), sub: text('vazokonstriksiyon · fibrozis', 'vasoconstriction · fibrosis'), why: text('AT1 aracılı vazokonstriksiyon ard yükü artırır; fibrozis yeniden şekillenmeyi hızlandırır.', 'AT1-mediated vasoconstriction raises afterload; fibrosis accelerates remodeling.') },
  aldo: { at: [600, 292], title: text('Aldosteron → MR', 'Aldosterone → MR'), sub: text('Na⁺ tutulumu · fibrozis', 'Na⁺ retention · fibrosis'), why: text('Mineralokortikoid reseptörü Na⁺ tutar, K⁺ atar ve miyokard fibrozisine katkı yapar.', 'Mineralocorticoid receptors retain Na⁺, excrete K⁺ and contribute to myocardial fibrosis.') },
  nep: { at: [600, 380], title: text('Neprilizin', 'Neprilysin'), sub: text('peptidleri yıkar', 'degrades peptides'), why: text('Neprilizin natriüretik peptidleri yıkar; inhibisyonu yararlı peptid etkisini uzatır.', 'Neprilysin degrades natriuretic peptides; inhibition prolongs their beneficial effect.') },
};
/** Drug → acted-on nodes; '+' marks stimulation, otherwise blockade. */
export const HF_DRUG_NODES = {
  arni: { at1: '⊣', nep: '⊣' }, 'hf-beta': { sns: '⊣' }, mra: { aldo: '⊣' }, sglt2: { tubule: '⊣' },
  loop: { tubule: '⊣' }, digoxin: { myocyte: '⊣' }, hydralazine: { vessels: '⊣' },
  inotrope: { myocyte: '+' }, 'iv-vasodilator': { vessels: '⊣' }, nesiritide: { np: '+' },
};
/** Arrows: [path, label]. Heart sits left (x20 to 230). */
const EDGES = [
  ['M230 118C262 70 268 46 290 46', ''], ['M470 46H510', ''], ['M600 72V102', ''], ['M600 154V184', ''],
  ['M690 128C734 128 734 292 690 292', ''], ['M510 210C486 210 486 292 470 292', ''], ['M510 292C490 292 490 210 470 210', ''],
  ['M290 292C254 292 246 270 228 258', 'afterload'], ['M290 210H232', 'volume'], ['M290 128H232', ''],
  ['M196 334C232 380 262 380 290 380', ''], ['M510 380H470', 'degrade'],
];

export function createHfVisual({ mount, getLang, onNode }) {
  const t = value => (typeof value === 'string' ? value : value[getLang() === 'en' ? 'en' : 'tr']);
  const root = document.createElement('div');
  root.className = 'hfviz';
  root.innerHTML = `<svg class="hfviz-map" viewBox="0 0 760 440" role="img"><title></title>
    <defs><marker id="hfviz-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#8a97ab"/></marker></defs>
    <ellipse cx="125" cy="214" rx="118" ry="150" fill="#e9eef5"/>
    <image href="${HEART_IMAGE}" x="20" y="74" width="210" height="273"/>
    <text class="hfviz-heart" x="125" y="40" text-anchor="middle"></text>
    <g class="hfviz-edges"></g><g class="hfviz-nodes"></g></svg>
    <p class="hfviz-why" aria-live="polite"></p>`;
  mount.append(root);
  for (const [d, kind] of EDGES) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d); path.setAttribute('marker-end', 'url(#hfviz-arrow)');
    if (kind === 'degrade') path.classList.add('is-inhibit');
    root.querySelector('.hfviz-edges').append(path);
  }
  const nodes = new Map();
  for (const [id, node] of Object.entries(HF_NODES)) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.dataset.hfNode = id; g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
    const [x, y] = node.at;
    g.innerHTML = `<rect x="${x - BOX.w / 2}" y="${y - BOX.h / 2}" width="${BOX.w}" height="${BOX.h}" rx="12"/>
      <text class="hfviz-title" x="${x}" y="${y - 4}" text-anchor="middle"/><text class="hfviz-sub" x="${x}" y="${y + 15}" text-anchor="middle"/>
      <g class="hfviz-badge"><circle cx="${x + BOX.w / 2 - 4}" cy="${y - BOX.h / 2 + 4}" r="14"/><text x="${x + BOX.w / 2 - 4}" y="${y - BOX.h / 2 + 10}" text-anchor="middle"/></g>`;
    g.addEventListener('click', () => onNode?.(id));
    g.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onNode?.(id); } });
    root.querySelector('.hfviz-nodes').append(g);
    nodes.set(id, g);
  }
  function update({ drug, node, drugName }) {
    const acts = HF_DRUG_NODES[drug] || {};
    for (const [id, g] of nodes) {
      g.querySelector('.hfviz-title').textContent = t(HF_NODES[id].title);
      g.querySelector('.hfviz-sub').textContent = t(HF_NODES[id].sub);
      g.classList.toggle('is-target', Boolean(acts[id]));
      g.classList.toggle('is-stim', acts[id] === '+');
      g.classList.toggle('is-focus', node === id);
      g.setAttribute('aria-pressed', String(node === id));
      g.setAttribute('aria-label', t(HF_NODES[id].title));
      g.querySelector('.hfviz-badge text').textContent = acts[id] || '';
    }
    root.querySelector('.hfviz-heart').textContent = t(text('Yetersiz kalp: ↓ debi, ↑ dolum basıncı', 'Failing heart: ↓ output, ↑ filling pressure'));
    const focus = node || Object.keys(acts)[0];
    root.querySelector('.hfviz-why').textContent = focus ? `${t(HF_NODES[focus].title)}: ${t(HF_NODES[focus].why)}` : '';
    root.querySelector('.hfviz-map title').textContent = `${drugName}: ${Object.keys(acts).map(id => t(HF_NODES[id].title)).join(', ')}`;
  }
  return { update };
}

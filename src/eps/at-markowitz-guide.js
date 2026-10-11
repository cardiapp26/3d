import { AT_SOURCE } from './at-markowitz-recordings.js';

export const AT_FOUR_STEPS = {
  tr: {
    heading: 'Atriyal taşikardi analizinin 4 adımı (3D haritalama şeması)',
    intro: 'Sol şema sağ atriyumu (SVC, IVC ve triküspit anülüs), sağ şema PVI sonrası sol atriyumu (sol/sağ pulmoner ven halkaları ve mitral anülüs) 3 halkalı topolojik model olarak gösterir.',
    steps: [
      {
        step: 1,
        title: 'Step 1. Makroreentri değerlendirmesi',
        caption: '3 anatomik halkadaki çarpışmayı (collision) değerlendir. Her 3 halkada da dalga cepheleri çarpışıyorsa klasik anatomik makroreentri dışlanır.'
      },
      {
        step: 2,
        title: 'Step 2. Anatomik olmayan engellerin değerlendirilmesi',
        caption: 'Patchy scar (yama skar) ve hiçbir anatomik yapıya bağlanmayan blok hatlarını ara (OPAL split potential search veya CARTO early-meets-late faydalıdır).'
      },
      {
        step: 3,
        title: 'Step 3. Lokalize reentri değerlendirmesi',
        caption: 'Patchy scar ve boşta duran blok hattı çevresindeki döngüsel aktivasyon (mikroreentri) ve çevreye yayılım paternini incele.'
      },
      {
        step: 4,
        title: 'Step 4. Entrainment pacing',
        caption: 'En erken aktivasyon bölgesinden uzak noktalar da dahil olmak üzere entrainment pacing (PPI - TCL) uygula.',
        note: '※ Fokal AT temel olarak bir dışlama (ekartasyon) tanısıdır.'
      }
    ]
  },
  en: {
    heading: '4 steps of atrial tachycardia analysis (3D mapping schematic)',
    intro: 'The left diagram shows the right atrium (SVC, IVC and tricuspid annulus) and the right diagram shows the post-PVI left atrium (left/right PV rings and mitral annulus) as 3-ring topological models.',
    steps: [
      {
        step: 1,
        title: 'Step 1. Macro-reentry evaluation',
        caption: 'Assess wavefront collision across the 3 anatomical rings. Collision on all 3 rings argues against a classic anatomical macro-reentry.'
      },
      {
        step: 2,
        title: 'Step 2. Non-anatomical obstacle evaluation',
        caption: 'Search for patchy scar and unanchored block lines not connected to any anatomical boundary (OPAL split-potential search or CARTO early-meets-late is useful).'
      },
      {
        step: 3,
        title: 'Step 3. Localized reentry evaluation',
        caption: 'Inspect the rotational activation pattern around the patchy scar or unanchored block line and its centrifugal spread.'
      },
      {
        step: 4,
        title: 'Step 4. Entrainment pacing',
        caption: 'Perform entrainment pacing (PPI - TCL) including sites distant from the earliest activation region.',
        note: '※ Focal AT is fundamentally a diagnosis of exclusion.'
      }
    ]
  }
};

const text = {
  tr: {
    title: 'Atriyal taşikardi: 4 adımlı haritalama ve Markowitz 2019',
    points: [
      'Fokal AT: sınırlı erken bölgeden santrifugal yayılım; tetiklenmiş aktivite veya otomatik kaynak. P dalgasında izoelektrik aralık destekleyebilir fakat fokal mekanizmayı kanıtlamaz. Önceki ablasyon, cerrahi ve atriyal miyopati P morfolojisini değiştirebilir.',
      'Haritalama: erken lokal A, P başlangıcından önce gelir; makalede en az 30 ms erken A ve keskin negatif QS unipolar sinyal anlatılır. Bir polarite veya tek erken nokta yeterli değildir; bütün atriyal aktivasyonla birlikte değerlendirilir.',
      'Adenozin karşılaştırması: tetiklenmiş AT sonlanabilir, otomatik AT geçici baskılanabilir. Reentran AT ise AV blok oluşurken sürebilir. Bu yanıtlar mekanizma için ipucudur; sonlanma AVNRT/AVRT’den tek başına ayırmaz.',
      'Para-Hisian AT: erken His komşuluğu A, kesin ablasyon hedefi değildir. RA septumu, nonkoroner aortik cusp (NCC) ve LA septumu karşılaştırılır. Şekil 3’te NCC biraz daha geç olmasına rağmen başarılı hedef; yer seçimi AV blok riski ve anatomiyle birlikte değerlendirilir.',
      'Makroreentry: haritada tüm TCL’nin açıklanması, erken-geç komşuluğu ve uygun entrainment/fusion aranır. Geçerli entrainment sırasında PPI’nin TCL’ye 30 ms içinde olması devre yakınlığını destekler. Birden çok atriyal bölgeyle doğrulama gerekir; pacing devreyi sonlandırabilir, değiştirebilir veya yavaş iletim nedeniyle yalancı uzun PPI oluşturabilir.',
      'Lokalize reentry: küçük alanda TCL’nin çoğunu kaplayan düşük genlikli, uzun fraksiyone elektrogramlar görülebilir. Bunlar bystander bölgede de bulunabilir; tek sinyal veya renkli harita pseudo-reentry’den ayrım yapmaz.',
      'Ablasyon sonlanımı: fokal kaynağın ortadan kalkması ile lineer reentry lezyonunun iki yönlü iletim bloğu farklıdır. Taşikardinin durması tek başına lineer blok kanıtı değildir. İki taraftan pacing, aktivasyonun dolanması ve diferansiyel pacing birlikte değerlendirilir; mitral istmustaki epikardiyal köprüler pseudo-blok oluşturabilir.',
      'Recorder örnekleri sentetik. Ladder A–AV–V ilişkisini gösterir; santrifugal harita, atriyal devre geometrisi, lezyon seti veya enerji/doz simülasyonu değildir.'
    ]
  },
  en: {
    title: 'Atrial tachycardia: 4-step mapping & Markowitz 2019',
    points: [
      'Focal AT: centrifugal spread from a discrete early region, due to triggered activity or automaticity. An isoelectric P-wave interval may support but does not establish a focal mechanism. Prior ablation, surgery and atrial myopathy can change P-wave morphology.',
      'Mapping: local early A precedes P onset; the review describes A at least 30 ms early and a sharp negative QS unipolar signal. One polarity or early point is insufficient; assess the complete atrial activation pattern.',
      'Adenosine comparison: triggered AT may terminate and automatic AT may be transiently suppressed. Reentrant AT may continue while AV block develops. These are mechanism clues; termination alone does not separate AT from AVNRT/AVRT.',
      'Para-Hisian AT: early His-region A is not a definitive ablation target. Compare RA septum, noncoronary aortic cusp (NCC) and LA septum. In Figure 3, a slightly later NCC site was successful; site choice considers AV block risk and anatomy.',
      'Macroreentry: account for the full TCL on the map, adjacent early/late activation and appropriate entrainment/fusion. During valid entrainment, PPI within 30 ms of TCL supports circuit proximity. Confirm at multiple atrial regions; pacing may terminate/transform the circuit or cause misleadingly long PPI through conduction slowing.',
      'Localized reentry: low-amplitude, prolonged fractionated signals may span most of the TCL in a small area. Such signals can occur at bystanders; one electrogram or color map does not exclude pseudo-reentry.',
      'Ablation endpoints: eliminating a focal source differs from bidirectional conduction block across a reentry line. Tachycardia termination alone does not prove line block. Assess pacing from both sides, activation detour and differential pacing together; epicardial bridges at the mitral isthmus can create pseudoblock.',
      'Recorder examples are synthetic. The ladder shows A–AV–V relationships, not centrifugal mapping, atrial circuit geometry, lesion sets or energy/dose simulation.'
    ]
  }
};

const SVG_NS = 'http://www.w3.org/2000/svg';
const s = (doc, tag, attrs = {}, content = '') => {
  const node = doc.createElementNS ? doc.createElementNS(SVG_NS, tag) : doc.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (content) node.textContent = content;
  return node;
};

function arrow(doc, x, y, deg, fill, size = 4.5) {
  const b = (size * 1.35).toFixed(1), w = (size * 0.78).toFixed(1);
  return s(doc, 'polygon', {
    points: `0,0 -${b},-${w} -${b},${w}`,
    fill,
    transform: `translate(${x} ${y}) rotate(${deg})`
  });
}

function starburst(doc, cx, cy, rOuter = 8.5, rInner = 4.2, n = 10) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i * Math.PI) / n - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return s(doc, 'polygon', { points: pts.join(' '), fill: '#ef4444', stroke: '#fca5a5', 'stroke-width': 0.8 });
}

function drawStepSvg(doc, svg, step, labelText) {
  svg.replaceChildren(s(doc, 'title', {}, labelText));
  svg.setAttribute('aria-label', labelText);
  // Base RA (left) and LA (right) 3-ring topological outlines.
  const base = s(doc, 'g', { 'aria-hidden': 'true' });
  base.append(
    s(doc, 'path', { d: 'M50 10 L50 31 A42 42 0 0 0 50 111 L50 132 L80 132 L80 111 A42 42 0 0 0 80 31 L80 10 Z', fill: '#13221d' }),
    s(doc, 'path', { d: 'M50 10 L50 31 A42 42 0 0 0 50 111 L50 132', fill: 'none', stroke: '#d6e8df', 'stroke-width': 2 }),
    s(doc, 'path', { d: 'M80 10 L80 31 A42 42 0 0 1 80 111 L80 132', fill: 'none', stroke: '#d6e8df', 'stroke-width': 2 }),
    s(doc, 'circle', { cx: 65, cy: 71, r: 15.5, fill: '#0b1411', stroke: '#d6e8df', 'stroke-width': 2 }),
    s(doc, 'path', { d: 'M150 26 Q226 42 302 26 L302 98 C267 98 256 116 226 116 C196 116 185 98 150 98 Z', fill: '#13221d' }),
    s(doc, 'path', { d: 'M150 26 Q226 42 302 26', fill: 'none', stroke: '#d6e8df', 'stroke-width': 2 }),
    s(doc, 'path', { d: 'M150 98 C185 98 196 116 226 116 C256 116 267 98 302 98', fill: 'none', stroke: '#d6e8df', 'stroke-width': 2 }),
    s(doc, 'path', { d: 'M150 50 C169 50 169 76 150 76', fill: 'none', stroke: '#d6e8df', 'stroke-width': 2 }),
    s(doc, 'path', { d: 'M302 50 C283 50 283 76 302 76', fill: 'none', stroke: '#d6e8df', 'stroke-width': 2 }),
    s(doc, 'ellipse', { cx: 226, cy: 76, rx: 22, ry: 15.5, fill: '#0b1411', stroke: '#d6e8df', 'stroke-width': 2 })
  );
  svg.append(base);

  const g = s(doc, 'g', { 'aria-hidden': 'true' });
  if (step === 1) {
    // Step 1: 3-ring collision assessment (Blue, Red, Green rings on RA and LA).
    g.append(
      // RA SVC ring (blue)
      s(doc, 'path', { d: 'M44 22 A21 7.5 0 0 1 86 22', fill: 'none', stroke: '#38bdf8', 'stroke-width': 2, 'stroke-dasharray': '3 2.5' }),
      s(doc, 'path', { d: 'M44 22 A21 7.5 0 0 0 86 22', fill: 'none', stroke: '#38bdf8', 'stroke-width': 2.2 }),
      arrow(doc, 85, 19, 38, '#38bdf8', 4),
      arrow(doc, 85, 25, -38, '#38bdf8', 4),
      // RA TA ring (red)
      s(doc, 'path', { d: 'M61 95 A24.5 24.5 0 0 1 61 47', fill: 'none', stroke: '#f87171', 'stroke-width': 2.2 }),
      s(doc, 'path', { d: 'M69 95 A24.5 24.5 0 0 0 69 47', fill: 'none', stroke: '#f87171', 'stroke-width': 2.2 }),
      arrow(doc, 62, 47, -8, '#f87171', 4.3),
      arrow(doc, 68, 47, -172, '#f87171', 4.3),
      // RA IVC ring (green)
      s(doc, 'path', { d: 'M44 114 A21 7.5 0 0 1 86 114', fill: 'none', stroke: '#4ade80', 'stroke-width': 2, 'stroke-dasharray': '3 2.5' }),
      s(doc, 'path', { d: 'M44 114 A21 7.5 0 0 0 86 114', fill: 'none', stroke: '#4ade80', 'stroke-width': 2.2 }),
      arrow(doc, 85, 111, 38, '#4ade80', 4),
      arrow(doc, 85, 117, -38, '#4ade80', 4),
      // LA left vertical ring (blue)
      s(doc, 'path', { d: 'M180 30 A9 34 0 0 0 180 98', fill: 'none', stroke: '#38bdf8', 'stroke-width': 2.2 }),
      s(doc, 'path', { d: 'M180 30 A9 34 0 0 1 180 98', fill: 'none', stroke: '#38bdf8', 'stroke-width': 2, 'stroke-dasharray': '3 2.5' }),
      arrow(doc, 178, 32, -72, '#38bdf8', 4),
      arrow(doc, 178, 96, 72, '#38bdf8', 4),
      // LA central MA ring (red)
      s(doc, 'path', { d: 'M196 72 A31 23 0 0 1 256 72', fill: 'none', stroke: '#f87171', 'stroke-width': 2.2 }),
      s(doc, 'path', { d: 'M256 80 A31 23 0 0 1 196 80', fill: 'none', stroke: '#f87171', 'stroke-width': 2.2 }),
      arrow(doc, 229, 53, 0, '#f87171', 4.3),
      arrow(doc, 223, 99, 180, '#f87171', 4.3),
      // LA right vertical ring (green)
      s(doc, 'path', { d: 'M272 30 A9 34 0 0 0 272 98', fill: 'none', stroke: '#4ade80', 'stroke-width': 2.2 }),
      s(doc, 'path', { d: 'M272 30 A9 34 0 0 1 272 98', fill: 'none', stroke: '#4ade80', 'stroke-width': 2, 'stroke-dasharray': '3 2.5' }),
      arrow(doc, 270, 32, -72, '#4ade80', 4),
      arrow(doc, 270, 96, 72, '#4ade80', 4)
    );
  } else {
    const step4 = step === 4;
    const nonAnatColor = step4 ? '#090d0b' : '#ef4444';
    const nonAnatStroke = step4 ? '#94a3b8' : '#fca5a5';
    const lineColor = step4 ? '#94a3b8' : '#ef4444';
    // Obstacles present in Steps 2, 3 and 4
    g.append(
      // RA anchored anatomical obstacle (top-left)
      s(doc, 'ellipse', { cx: 53, cy: 34, rx: 6.5, ry: 9.5, fill: '#090d0b', stroke: '#94a3b8', 'stroke-width': 1.5 }),
      // RA unanchored block line (left) & patchy scar (bottom-right)
      s(doc, 'line', { x1: 35, y1: 68, x2: 42, y2: 83, stroke: lineColor, 'stroke-width': 3.8, 'stroke-linecap': 'round' }),
      s(doc, 'circle', { cx: 83, cy: 88, r: 7, fill: nonAnatColor, stroke: nonAnatStroke, 'stroke-width': 1.2 }),
      // LA anchored obstacles (connected to MA)
      s(doc, 'ellipse', { cx: 198, cy: 57, rx: 13, ry: 5.5, transform: 'rotate(38 198 57)', fill: '#090d0b', stroke: '#94a3b8', 'stroke-width': 1.5 }),
      s(doc, 'line', { x1: 245, y1: 84, x2: 266, y2: 95, stroke: '#94a3b8', 'stroke-width': 3.5, 'stroke-linecap': 'round' }),
      // LA unanchored block line (left) & patchy scar (top-right)
      s(doc, 'line', { x1: 178, y1: 70, x2: 186, y2: 88, stroke: lineColor, 'stroke-width': 3.8, 'stroke-linecap': 'round' }),
      s(doc, 'circle', { cx: 256, cy: 54, r: 7, fill: nonAnatColor, stroke: nonAnatStroke, 'stroke-width': 1.2 })
    );

    if (step === 3) {
      // Step 3: Localized reentry around patchy scar (RA) and unanchored block line (LA) + passive spread
      g.append(
        // RA localized reentry around patchy scar (83, 88)
        s(doc, 'path', { d: 'M86 75.5 A12.5 12.5 0 1 1 78 76.5', fill: 'none', stroke: '#38bdf8', 'stroke-width': 2.3 }),
        arrow(doc, 80, 76, -15, '#38bdf8', 4.2),
        // RA passive centrifugal spread (dashed blue)
        s(doc, 'path', { d: 'M92 77 C98 57 86 44 66 44', fill: 'none', stroke: '#60a5fa', 'stroke-width': 1.8, 'stroke-dasharray': '3 2.5' }),
        arrow(doc, 65, 44, 180, '#60a5fa', 3.8),
        s(doc, 'path', { d: 'M71 94 C55 95 47 84 46 62', fill: 'none', stroke: '#60a5fa', 'stroke-width': 1.8, 'stroke-dasharray': '3 2.5' }),
        arrow(doc, 46, 61, -90, '#60a5fa', 3.8),
        s(doc, 'path', { d: 'M58 93 C39 95 29 82 30 62', fill: 'none', stroke: '#60a5fa', 'stroke-width': 1.8, 'stroke-dasharray': '3 2.5' }),
        arrow(doc, 30, 61, -85, '#60a5fa', 3.8),
        // LA localized reentry around unanchored block line (182, 79)
        s(doc, 'path', { d: 'M177 65 A11 15 -22 1 1 171 71', fill: 'none', stroke: '#38bdf8', 'stroke-width': 2.3 }),
        arrow(doc, 173, 68, -45, '#38bdf8', 4.2),
        // LA passive centrifugal spread (dashed blue)
        s(doc, 'path', { d: 'M184 61 C194 38 228 40 268 38', fill: 'none', stroke: '#60a5fa', 'stroke-width': 1.8, 'stroke-dasharray': '3 2.5' }),
        arrow(doc, 269, 38, -5, '#60a5fa', 3.8),
        s(doc, 'path', { d: 'M222 41 C240 50 256 72 276 62', fill: 'none', stroke: '#60a5fa', 'stroke-width': 1.8, 'stroke-dasharray': '3 2.5' }),
        arrow(doc, 277, 61, -25, '#60a5fa', 3.8),
        s(doc, 'path', { d: 'M190 94 C216 108 256 108 276 68', fill: 'none', stroke: '#60a5fa', 'stroke-width': 1.8, 'stroke-dasharray': '3 2.5' }),
        arrow(doc, 276, 67, -65, '#60a5fa', 3.8)
      );
    } else if (step === 4) {
      // Step 4: Entrainment pacing from distant sites + entrained localized loop
      g.append(
        // RA entrained loop around (83, 88)
        s(doc, 'path', { d: 'M83 75.5 A12.5 12.5 0 0 1 83 100.5', fill: 'none', stroke: '#38bdf8', 'stroke-width': 2.2 }),
        arrow(doc, 85, 100, 165, '#38bdf8', 4),
        s(doc, 'path', { d: 'M83 100.5 A12.5 12.5 0 0 1 83 75.5', fill: 'none', stroke: '#f87171', 'stroke-width': 2.2 }),
        arrow(doc, 81, 76, -15, '#f87171', 4),
        // RA distant pacing starburst & wavefront
        starburst(doc, 36, 52),
        s(doc, 'path', { d: 'M37 59 C43 78 55 89 70 89', fill: 'none', stroke: '#f87171', 'stroke-width': 1.9 }),
        arrow(doc, 71, 89, 0, '#f87171', 4),
        // LA entrained loop around (182, 79)
        s(doc, 'path', { d: 'M175 66 A11 15 -22 0 0 189 92', fill: 'none', stroke: '#38bdf8', 'stroke-width': 2.2 }),
        arrow(doc, 174, 68, -60, '#38bdf8', 4),
        s(doc, 'path', { d: 'M175 66 A11 15 -22 0 1 189 92', fill: 'none', stroke: '#f87171', 'stroke-width': 2.2 }),
        arrow(doc, 188, 93, 130, '#f87171', 4),
        // LA distant pacing starburst & wavefront
        starburst(doc, 282, 86),
        s(doc, 'path', { d: 'M276 90 C254 108 216 108 191 92', fill: 'none', stroke: '#f87171', 'stroke-width': 1.9 }),
        arrow(doc, 190, 91, -145, '#f87171', 4)
      );
    }
  }
  svg.append(g);
}

export function createAtFourSteps(doc, getLang) {
  const root = doc.createElement('div');
  root.className = 'at-steps';
  root.setAttribute('data-at-four-steps', '');
  const heading = doc.createElement('h4');
  heading.className = 'at-steps-heading';
  const intro = doc.createElement('p');
  intro.className = 'amap-note';
  const grid = doc.createElement('div');
  grid.className = 'at-steps-grid';
  const cards = [1, 2, 3, 4].map((step) => {
    const fig = doc.createElement('figure');
    fig.className = 'at-step-card';
    fig.setAttribute('data-at-step', String(step));
    const title = doc.createElement('h5');
    title.className = 'at-step-title';
    const svg = s(doc, 'svg', { viewBox: '0 0 320 140', class: 'at-step-svg', role: 'img' });
    const cap = doc.createElement('figcaption');
    cap.className = 'at-step-caption';
    const note = doc.createElement('p');
    note.className = 'at-step-exclusion';
    fig.append(title, svg, cap, note);
    grid.append(fig);
    return { step, title, svg, cap, note };
  });
  root.append(heading, intro, grid);
  function render() {
    const t = AT_FOUR_STEPS[getLang() === 'en' ? 'en' : 'tr'];
    heading.textContent = t.heading;
    intro.textContent = t.intro;
    cards.forEach((c, i) => {
      const st = t.steps[i];
      c.title.textContent = st.title;
      c.cap.textContent = st.caption;
      c.note.textContent = st.note || '';
      c.note.hidden = !st.note;
      drawStepSvg(doc, c.svg, c.step, `${st.title}: ${st.caption}`);
    });
  }
  render();
  return { element: root, render };
}

export function createAtGuide(doc, getLang) {
  const root = doc.createElement('details'); root.className = 'basics-card'; root.setAttribute('data-at-markowitz', '');
  const title = doc.createElement('summary'), list = doc.createElement('ol'), source = doc.createElement('a');
  const fourSteps = createAtFourSteps(doc, getLang);
  list.className = 'basics-lines'; source.href = AT_SOURCE; source.target = '_blank'; source.rel = 'noopener noreferrer';
  source.textContent = 'Markowitz et al., AER 2019;8:131–137'; root.append(title, fourSteps.element, list, source);
  function render() {
    const t = text[getLang() === 'en' ? 'en' : 'tr']; title.textContent = t.title;
    fourSteps.render();
    list.replaceChildren(...t.points.map((p) => { const li = doc.createElement('li'); li.textContent = p; return li; }));
  }
  render(); return { element: root, render };
}


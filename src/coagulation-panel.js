import { COAG_NODES, COAG_EDGES, COAG_FEEDBACK, COAG_DRUGS, COAG_SOURCES, coagHighlights } from './coagulation-data.js';
import './coagulation.css';
import { createCoagFlow } from './coag-flow.js';

const WORDS = {
  tr: { title: 'Koagülasyon kaskadı', eyebrow: 'HEMOSTAZ LABORATUVARI', intro: 'Bir faktör seçin. Test kapsamını ve antikoagülanın etki yerini üst üste inceleyin.', intrinsic: 'İntrinsik yol', extrinsic: 'Ekstrinsik yol', common: 'Ortak yol', contact: 'Temas aktivasyonu (laboratuvar)', tissue: 'Doku faktörü yolu', all: 'Tüm yollar', pt: 'PT / INR', aptt: 'aPTT', feedback: 'Trombin geri beslemesi', drug: 'İlaç hedefi', key: 'Çizgi: aktivasyon · Kesik çizgi: geri besleme · Altın çerçeve: ilaç hedefi', cofactor: 'Komplekslerin kofaktörleri: Ca²⁺ (IV) + fosfolipid yüzey', table: 'Faktör rehberi', name: 'Faktör ve adı', pathway: 'Yol', tests: 'Test kapsamı', none: 'PT/aPTT ile doğrudan değerlendirilmez', reset: 'Sıfırla', sources: 'Kaynak ve doğrulama', limitation: 'Klasik kaskad, PT/aPTT öğretimi için laboratuvar modelidir. İn vivo süreç hücre yüzeylerinde başlar ve örtüşür; bu çizim ilaç yanıtı veya kanama riskini hesaplamaz.', warning: 'XIII eksikliğinde PT ve aPTT normal kalabilir. Faktör XIII aktivitesi ayrı değerlendirilir.', ptInfo: 'PT/INR: VII ve ortak yol faktörleri X, V, II, I. INR, warfarin izlemi için standardize edilir.', apttInfo: 'aPTT: XII, XI, IX, VIII ve ortak yol X, V, II, I. Faktör XIII bu testte değerlendirilmez.', feedbackInfo: 'Trombin V, VIII ve XI üzerinden amplifikasyon sağlar; XIII aktivasyonu fibrin çapraz bağlanmasına katkı verir.', selected: 'Seçili hedef', factorI: 'I · Fibrinojen', stable: 'Stabilize fibrin', note: 'Paylaşılan görselden uyarlanan özgün etkileşimli şema. XIII-test ilişkisi kaynaklarla düzeltildi.', calcium: 'IV · Kalsiyum', calciumInfo: 'Ca²⁺ bir iyon/kofaktördür; enzimatik protein faktörü değildir. Laboratuvar testlerinde örneğe kalsiyum yeniden eklenir.' },
  en: { title: 'Coagulation cascade', eyebrow: 'HEMOSTASIS LAB', intro: 'Select a factor. Overlay test coverage and anticoagulant targets.', intrinsic: 'Intrinsic pathway', extrinsic: 'Extrinsic pathway', common: 'Common pathway', contact: 'Contact activation (laboratory)', tissue: 'Tissue factor pathway', all: 'All pathways', pt: 'PT / INR', aptt: 'aPTT', feedback: 'Thrombin feedback', drug: 'Drug target', key: 'Line: activation · Dashed: feedback · Gold outline: drug target', cofactor: 'Complex cofactors: Ca²⁺ (IV) + phospholipid surface', table: 'Factor guide', name: 'Factor and name', pathway: 'Pathway', tests: 'Test coverage', none: 'Not directly assessed by PT/aPTT', reset: 'Reset', sources: 'Sources and verification', limitation: 'Classical cascade is a laboratory teaching model for PT/aPTT. In vivo coagulation begins on cell surfaces and pathways overlap; this diagram does not calculate drug response or bleeding risk.', warning: 'PT and aPTT may remain normal in factor XIII deficiency. Factor XIII activity requires separate evaluation.', ptInfo: 'PT/INR: VII and common factors X, V, II, I. INR is standardized for warfarin monitoring.', apttInfo: 'aPTT: XII, XI, IX, VIII and common factors X, V, II, I. Factor XIII is not assessed.', feedbackInfo: 'Thrombin amplifies activation of V, VIII and XI; XIII activation helps cross-link fibrin.', selected: 'Selected target', factorI: 'I · Fibrinogen', stable: 'Stabilized fibrin', note: 'Original interactive diagram adapted from the shared image. Factor XIII test relationship corrected against sources.', calcium: 'IV · Calcium', calciumInfo: 'Ca²⁺ is an ion/cofactor, not an enzymatic protein factor. Laboratory assays recalcify the sample.' }
};
const ns = 'http://www.w3.org/2000/svg';
const svgNode = (tag, attrs) => {
  const node = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
};

export function createCoagulationPanel({ mount, getLang = () => 'tr' }) {
  let selected = 'ii', test = 'all', drug = 'none', feedback = false;
  const root = document.createElement('section');
  root.className = 'coag';
  root.innerHTML = `<p class="coag-eyebrow"></p><h2></h2><p class="coag-intro"></p>
    <div class="coag-controls"><div class="coag-tests" role="group"></div><label class="coag-drug-label"><span></span><select data-coag-drug></select></label><label class="coag-feedback-label"><input type="checkbox" data-coag-feedback><span></span></label><button type="button" data-coag-play></button><button type="button" data-coag-reset></button></div>
    <p class="coag-test-info" role="status"></p><p class="coag-drug-info" role="status"></p>
    <div class="coag-layout"><div class="coag-map-scroll" tabindex="0"><div class="coag-map">
      <svg viewBox="0 0 960 920" aria-hidden="true"><defs><marker id="coag-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="context-stroke"/></marker></defs>
        <rect x="25" y="10" width="475" height="440" rx="18" fill="#edf2fc"/><rect x="515" y="10" width="425" height="440" rx="18" fill="#fff1e7"/><rect x="25" y="460" width="915" height="450" rx="18" fill="#edf5e8"/>
        <text data-coag-heading="intrinsic" x="60" y="46"/><text data-coag-heading="extrinsic" x="550" y="46"/><text data-coag-heading="common" x="60" y="490"/>
        <text data-coag-subheading="contact" x="60" y="70"/><text data-coag-subheading="tissue" x="550" y="70"/>
        <g data-coag-edges></g><g data-coag-feedback-edges></g>
        <path d="M564 855H746" class="coag-edge" marker-end="url(#coag-arrow)"/>
        <g><circle cx="802" cy="847" r="52" fill="#fffdf3" stroke="#6c9764" stroke-width="2"/>
          <path d="M768 819L833 875M763 840L836 836M771 873L825 807M785 800L809 893M754 854L848 858M788 891L839 822M774 808L828 882" fill="none" stroke="#cea154" stroke-width="3"/>
          <g fill="#bb4146" stroke="#92383b" stroke-width="2"><circle cx="779" cy="826" r="11"/><circle cx="823" cy="839" r="12"/><circle cx="789" cy="868" r="11"/></g>
          <g fill="#9c79ae"><circle cx="806" cy="817" r="5"/><circle cx="769" cy="858" r="5"/><circle cx="824" cy="870" r="5"/></g>
        </g>
      </svg></div></div><aside class="coag-readout" aria-live="polite"><span class="coag-eyebrow" data-coag-selected-label></span><h3 data-coag-factor-name></h3><p data-coag-factor-role></p><p class="coag-assay" data-coag-factor-tests></p><p class="coag-xiii-note"></p><p class="coag-feedback-note"></p></aside></div>
    <p class="coag-legend"></p><p class="coag-cofactors"></p><p class="coag-limit"></p>
    <details class="coag-factor-guide"><summary></summary><div class="coag-factor-buttons"></div><p class="coag-calcium"></p></details>
    <details class="coag-sources"><summary></summary><p class="coag-source-note"></p><ul></ul></details>`;
  mount.append(root);
  const lang = () => getLang() === 'en' ? 'en' : 'tr';
  const w = () => WORDS[lang()];
  const t = value => value[lang()];
  const nodes = new Map(), testButtons = new Map(), guideButtons = new Map();
  for (const item of COAG_NODES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `coag-node coag-${item.pathway}`;
    button.dataset.coagFactor = item.id;
    button.style.left = `${item.x / 960 * 100}%`;
    button.style.top = `${item.y / 920 * 100}%`;
    button.addEventListener('click', () => { selected = item.id; refresh(); });
    root.querySelector('.coag-map').append(button);
    nodes.set(item.id, button);
    if (item.tests.length || ['tf', 'xiii'].includes(item.id)) {
      const guide = document.createElement('button');
      guide.type = 'button';
      guide.dataset.coagGuide = item.id;
      guide.addEventListener('click', () => {
        selected = item.id;
        refresh();
        nodes.get(item.id).focus({ preventScroll: true });
        nodes.get(item.id).scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
      root.querySelector('.coag-factor-buttons').append(guide);
      guideButtons.set(item.id, guide);
    }
  }
  const edges = COAG_EDGES.map(([from, to]) => {
    const start = COAG_NODES.find(item => item.id === from), end = COAG_NODES.find(item => item.id === to);
    let sx = start.x, sy = start.y, ex = end.x, ey = end.y;
    if (sy === ey) { sx += Math.sign(ex - sx) * 83; ex -= Math.sign(ex - sx) * 83; }
    else { sy += Math.sign(ey - sy) * 25; ey -= Math.sign(ey - sy) * 30; }
    const path = svgNode('path', { d: `M${sx} ${sy}L${ex} ${ey}`, class: 'coag-edge', 'marker-end': 'url(#coag-arrow)' });
    root.querySelector('[data-coag-edges]').append(path);
    return { path, from, to };
  });
  for (const [index, id] of COAG_FEEDBACK.entries()) {
    const target = COAG_NODES.find(item => item.id === id);
    const x = 45 + index * 18;
    const path = svgNode('path', { d: `M397 675H${x}V${target.y}H${target.x - 83}`, class: 'coag-feedback-edge', 'marker-end': 'url(#coag-arrow)' });
    root.querySelector('[data-coag-feedback-edges]').append(path);
  }
  const flow = createCoagFlow({ root, nodes, edges, feedbackIds: COAG_FEEDBACK });
  const playFlow = () => flow.play({ drug, targets: COAG_DRUGS.find(item => item.id === drug).targets, feedback });
  root.querySelector('[data-coag-play]').addEventListener('click', playFlow);
  for (const id of ['all', 'pt', 'aptt']) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.coagTest = id;
    button.addEventListener('click', () => { test = id; refresh(); });
    root.querySelector('.coag-tests').append(button);
    testButtons.set(id, button);
  }
  const select = root.querySelector('[data-coag-drug]');
  for (const item of COAG_DRUGS) {
    const option = document.createElement('option');
    option.value = item.id;
    select.append(option);
  }
  select.addEventListener('change', () => { drug = select.value; refresh(); playFlow(); });
  root.querySelector('[data-coag-feedback]').addEventListener('change', event => { feedback = event.target.checked; refresh(); if (feedback) playFlow(); });
  root.querySelector('[data-coag-reset]').addEventListener('click', () => { selected = 'ii'; test = 'all'; drug = 'none'; feedback = false; flow.reset(); refresh(); });
  COAG_SOURCES.forEach(source => {
    const li = document.createElement('li'), link = document.createElement('a');
    link.href = source.url;
    link.textContent = source.title;
    link.target = '_blank'; link.rel = 'noopener noreferrer';
    li.append(link); root.querySelector('.coag-sources ul').append(li);
  });

  function refresh() {
    const words = w();
    const write = (selector, value) => { root.querySelector(selector).textContent = value; };
    write('h2', words.title); write('.coag-eyebrow', words.eyebrow); write('.coag-intro', words.intro);
    root.querySelector('.coag-map-scroll').setAttribute('aria-label', words.title);
    root.querySelector('.coag-tests').setAttribute('aria-label', words.tests);
    const { tested, targeted } = coagHighlights(test, drug);
    for (const item of COAG_NODES) {
      const button = nodes.get(item.id);
      button.textContent = item.id === 'i' ? words.factorI : item.id === 'clot' ? words.stable : item.label;
      button.setAttribute('aria-label', `${button.textContent}: ${t(item.name)}`);
      button.setAttribute('aria-pressed', String(selected === item.id));
      button.classList.toggle('is-tested', tested.has(item.id));
      button.classList.toggle('is-targeted', targeted.has(item.id));
      button.classList.toggle('is-muted', test !== 'all' && !tested.has(item.id));
      if (guideButtons.has(item.id)) {
        const guide = guideButtons.get(item.id);
        guide.textContent = `${button.textContent} · ${t(item.name)}`;
        guide.setAttribute('aria-pressed', String(selected === item.id));
      }
    }
    for (const [id, button] of testButtons) { button.textContent = words[id]; button.setAttribute('aria-pressed', String(test === id)); }
    root.querySelectorAll('[data-coag-heading]').forEach(item => { item.textContent = words[item.dataset.coagHeading]; });
    root.querySelectorAll('[data-coag-subheading]').forEach(item => { item.textContent = words[item.dataset.coagSubheading]; });
    edges.forEach(({ path, from, to }) => { path.classList.toggle('is-selected', selected === from || selected === to); });
    root.querySelector('[data-coag-feedback-edges]').style.display = feedback ? '' : 'none';
    root.querySelector('[data-coag-feedback]').checked = feedback;
    write('.coag-feedback-label span', words.feedback); write('.coag-drug-label span', words.drug);
    for (const option of select.options) option.textContent = t(COAG_DRUGS.find(item => item.id === option.value).title);
    select.value = drug;
    write('[data-coag-reset]', words.reset);
    write('[data-coag-play]', lang() === 'en' ? '▶ Play the cascade' : '▶ Kaskadı oynat');
    write('.coag-test-info', test === 'pt' ? words.ptInfo : test === 'aptt' ? words.apttInfo : words.cofactor);
    write('.coag-drug-info', t(COAG_DRUGS.find(item => item.id === drug).text));
    const factor = COAG_NODES.find(item => item.id === selected);
    write('[data-coag-selected-label]', words.selected);
    write('[data-coag-factor-name]', t(factor.name));
    write('[data-coag-factor-role]', t(factor.role));
    write('[data-coag-factor-tests]', factor.tests.length ? `${words.tests}: ${factor.tests.map(id => words[id]).join(' + ')}` : words.none);
    write('.coag-xiii-note', words.warning); write('.coag-feedback-note', words.feedbackInfo);
    write('.coag-legend', words.key); write('.coag-cofactors', words.cofactor); write('.coag-limit', words.limitation);
    write('.coag-factor-guide summary', words.table);
    write('.coag-calcium', `${words.calcium}: ${words.calciumInfo}`);
    write('.coag-sources summary', words.sources); write('.coag-source-note', words.note);
  }
  refresh();
  return { refresh, getState: () => ({ selected, test, drug, feedback }) };
}

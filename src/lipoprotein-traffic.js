// "Lipoprotein traffic" lab of the lipid chapter: the truck analogy of a popular infographic, kept
// where it holds and corrected where it does not. Three parts: an animated particle map with a
// particle card, a profile lab (presets, inputs, lifestyle and drug levers → lab values and apoB
// particles), and a claim-by-claim check of the post.
import { LIPOPROTEINS, LIPID_PRESETS, LIPID_LEVERS, POST_CLAIMS, LIPOPROTEIN_SOURCES, LIPID_COMPONENTS, APOLIPOPROTEINS, PARTICLE_ANATOMY } from './lipoprotein-traffic-data.js';
import { particleSection, compositionBar, sizeStrip } from './lipoprotein-particle.js';
import { lipidScenario, trafficRates } from './lipoprotein-traffic-model.js';
import { TRAFFIC_SCENE, createTrafficScene } from './lipoprotein-traffic-scene.js';
import { LPT_WORDS } from './lipoprotein-traffic-text.js';
import './lipoprotein-traffic.css';

const PROFILE_KEYS = ['ldl', 'tg', 'hdl', 'lpa'];
const sourceTitle = id => LIPOPROTEIN_SOURCES.find(item => item.id === id)?.title ?? id;

export function createLipoproteinTraffic({ mount, getLang }) {
  let particle = 'ldl', presetId = 'reference', apobView = false;
  let profile = { ...LIPID_PRESETS[0].profile };
  const levers = new Set();
  const lang = () => (getLang() === 'en' ? 'en' : 'tr');
  const t = value => value[lang()];
  const W = () => LPT_WORDS[lang()];

  const root = document.createElement('section');
  root.className = 'lpt';
  root.innerHTML = `<p class="lpt-eyebrow"></p><h2></h2><p class="lpt-intro"></p>
    <div class="lpt-layout"><div class="lpt-map"><svg viewBox="0 0 760 360" role="img" data-lpt-svg><title></title>${TRAFFIC_SCENE}</svg>
      <div class="lpt-chips" role="group"></div><button type="button" class="lpt-apob" data-lpt-apob aria-pressed="false"></button><p class="lpt-count" aria-live="polite"></p></div>
      <article class="lpt-card" aria-live="polite"><h3></h3><dl></dl><div class="lpt-science"><h4></h4><p></p></div></article></div>
    <section class="lpt-anatomy" data-lpt-anatomy><h3></h3><p class="lpt-anatomy-intro"></p>
      <div class="lpt-anatomy-grid"><div class="lpt-section"></div><div class="lpt-anatomy-side"><h4 data-lpt-head="comp"></h4><div class="lpt-bar"></div><ul class="lpt-comp"></ul><h4 data-lpt-head="apos"></h4><ul class="lpt-apos"></ul></div></div>
      <h4 data-lpt-head="strip"></h4><div class="lpt-strip"></div><p class="lpt-strip-note"></p></section>
    <section class="lpt-lab"><h3></h3><p class="lpt-lab-intro"></p><div class="lpt-presets" role="group"></div><div class="lpt-inputs"></div>
      <div class="lpt-levers"><fieldset data-lever-group="lifestyle"><legend></legend></fieldset><fieldset data-lever-group="drug"><legend></legend></fieldset></div>
      <p class="lpt-error" role="alert" hidden></p>
      <div class="lpt-table-scroll"><table><thead><tr><th></th><th></th><th></th><th></th></tr></thead><tbody></tbody></table></div>
      <ul class="lpt-flags"></ul><ul class="lpt-notes"></ul></section>
    <section class="lpt-claims"><h3></h3><p class="lpt-claims-intro"></p><div class="lpt-claim-list"></div></section>
    <p class="lpt-limit"></p><details class="lpt-sources"><summary></summary><ul></ul></details>`;
  mount.append(root);
  const $ = selector => root.querySelector(selector);

  const svg = $('[data-lpt-svg]');
  const scene = createTrafficScene(svg, {
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    onCount: counts => { $('.lpt-count').textContent = W().count(counts); }
  });

  const chips = new Map(LIPOPROTEINS.map(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.lptParticle = item.id;
    button.style.setProperty('--lpt-dot', item.color);
    button.addEventListener('click', () => { particle = item.id; renderParticle(); });
    $('.lpt-chips').append(button);
    return [item.id, button];
  }));
  $('[data-lpt-apob]').addEventListener('click', () => { apobView = !apobView; renderParticle(); });

  const presetButtons = new Map(LIPID_PRESETS.map(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.lptPreset = item.id;
    button.addEventListener('click', () => { presetId = item.id; profile = { ...item.profile }; syncInputs(); renderLab(); });
    $('.lpt-presets').append(button);
    return [item.id, button];
  }));
  const inputs = new Map(PROFILE_KEYS.map(key => {
    const label = document.createElement('label');
    const span = document.createElement('span');
    const input = document.createElement('input');
    input.type = 'number'; input.min = '0'; input.step = 'any'; input.dataset.lptInput = key;
    input.addEventListener('input', () => {
      profile = { ...profile, [key]: input.value.trim() === '' ? NaN : Number(input.value) };
      presetId = null; renderLab();
    });
    label.append(span, input);
    $('.lpt-inputs').append(label);
    return [key, { label: span, input }];
  }));
  const leverBoxes = new Map(LIPID_LEVERS.map(item => {
    const label = document.createElement('label');
    const box = document.createElement('input');
    box.type = 'checkbox'; box.dataset.lptLever = item.id;
    box.addEventListener('change', () => { if (box.checked) levers.add(item.id); else levers.delete(item.id); renderLab(); });
    const span = document.createElement('span');
    label.append(box, span);
    root.querySelector(`[data-lever-group=${item.group}]`).append(label);
    return [item.id, span];
  }));
  const claimNodes = new Map(POST_CLAIMS.map(item => {
    const details = document.createElement('details');
    details.dataset.lptClaim = item.id;
    details.dataset.verdict = item.verdict;
    details.innerHTML = '<summary><span class="lpt-verdict"></span><span class="lpt-claim-text"></span></summary><p></p><p class="lpt-claim-sources"></p>';
    $('.lpt-claim-list').append(details);
    return [item.id, details];
  }));
  for (const source of LIPOPROTEIN_SOURCES) {
    const li = document.createElement('li'), a = document.createElement('a');
    a.href = source.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = source.title;
    li.append(a); $('.lpt-sources ul').append(li);
  }

  function syncInputs() { for (const [key, { input }] of inputs) input.value = profile[key]; }

  function renderParticle() {
    const item = LIPOPROTEINS.find(value => value.id === particle), w = W();
    for (const [id, button] of chips) {
      const entry = LIPOPROTEINS.find(value => value.id === id);
      button.textContent = `${t(entry.name)}${entry.inPost ? '' : ' *'}`;
      button.setAttribute('aria-pressed', String(id === particle));
    }
    svg.dataset.focus = particle;
    svg.classList.toggle('is-apob', apobView);
    $('[data-lpt-apob]').setAttribute('aria-pressed', String(apobView));
    $('[data-lpt-apob]').textContent = apobView ? w.apobOn : w.apobOff;
    $('.lpt-card h3').textContent = t(item.name);
    const rows = [[w.size, item.size], [w.density, item.density], [w.cargo, t(item.cargo)], [w.apos, typeof item.apos === 'string' ? item.apos : t(item.apos)], [w.apoB, item.apoB ? `${w.apoBYes} (${item.apoB})` : w.apoBNo], [w.route, t(item.route)], [w.atherogenic, t(item.atherogenic)]];
    $('.lpt-card dl').replaceChildren(...rows.flatMap(([term, value]) => {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = term; dd.textContent = value; return [dt, dd];
    }));
    $('.lpt-science h4').textContent = w.science; $('.lpt-science p').textContent = t(item.science);
    renderAnatomy(item);
  }

  /** Particle anatomy of the selected class: cross-section, composition, apolipoproteins, sizes to scale. */
  function renderAnatomy(item) {
    const w = W(), anatomy = PARTICLE_ANATOMY[item.id];
    $('.lpt-anatomy h3').textContent = w.anatomyTitle(t(item.name));
    $('.lpt-anatomy-intro').textContent = w.anatomyIntro;
    $('.lpt-section').innerHTML = particleSection(item.id, { title: w.sectionTitle(t(item.name)) });
    $('[data-lpt-head=comp]').textContent = w.compTitle;
    $('.lpt-bar').innerHTML = compositionBar(item.id);
    $('.lpt-comp').replaceChildren(...LIPID_COMPONENTS.map(part => {
      const li = document.createElement('li');
      li.style.setProperty('--lpt-dot', part.color);
      li.dataset.lptComp = part.id;
      const n = anatomy.composition[part.id];
      li.textContent = `${t(part.name)}: ${lang() === 'en' ? `~${n}%` : `~%${n}`}`;
      return li;
    }));
    $('[data-lpt-head=apos]').textContent = w.aposTitle;
    $('.lpt-apos').replaceChildren(...anatomy.apos.map(([id, n]) => {
      const apo = APOLIPOPROTEINS.find(value => value.id === id);
      const li = document.createElement('li'), strong = document.createElement('strong');
      li.style.setProperty('--lpt-dot', apo.color);
      li.dataset.lptApo = id;
      strong.textContent = `${apo.name} ${w.apoCount(id, n)}: `;
      li.append(strong, t(apo.role));
      return li;
    }));
    $('[data-lpt-head=strip]').textContent = w.stripTitle;
    $('.lpt-strip').innerHTML = sizeStrip(item.id, { title: w.stripAria, name: entry => t(entry.name).split(' ')[0] });
    $('.lpt-strip-note').textContent = w.stripNote(t(item.name), anatomy.range, anatomy.diameter);
  }

  function renderLab() {
    const w = W();
    for (const [id, button] of presetButtons) button.setAttribute('aria-pressed', String(id === presetId));
    const result = lipidScenario(profile, [...levers]);
    const error = $('.lpt-error');
    error.hidden = !result.error;
    if (result.error) { error.textContent = w.invalid(result.error); return; }
    scene.setRates(trafficRates(result.after));
    $('.lpt-table-scroll tbody').replaceChildren(...w.rows.map(([key, label, unit, digits]) => {
      const tr = document.createElement('tr');
      const get = panel => (key.startsWith('p.') ? panel.particles[key.slice(2)] : panel.values[key]);
      const before = get(result.before), after = get(result.after);
      const delta = before ? (after - before) / before : 0;
      const cells = [label, `${before.toFixed(digits)} ${unit}`, `${after.toFixed(digits)} ${unit}`, Math.abs(delta) < 0.005 ? '·' : `${delta > 0 ? '+' : '−'}${Math.abs(delta * 100).toFixed(0)}%`];
      cells.forEach((value, i) => { const cell = document.createElement(i ? 'td' : 'th'); if (!i) cell.scope = 'row'; cell.textContent = value; tr.append(cell); });
      tr.dataset.lptRow = key;
      return tr;
    }));
    $('.lpt-flags').replaceChildren(...result.after.flags.map(flag => { const li = document.createElement('li'); li.dataset.flag = flag; li.textContent = w.flags[flag]; return li; }));
    $('.lpt-notes').replaceChildren(...LIPID_LEVERS.filter(item => levers.has(item.id)).map(item => {
      const li = document.createElement('li'), strong = document.createElement('strong');
      strong.textContent = `${t(item.name)}: `;
      li.append(strong, t(item.note), ` (${item.sources.map(id => sourceTitle(id).split('.')[0]).join('; ')})`);
      return li;
    }));
  }

  function renderStatic() {
    const w = W();
    $('.lpt-eyebrow').textContent = w.eyebrow; $('h2').textContent = w.title; $('.lpt-intro').textContent = w.intro;
    svg.querySelector('title').textContent = w.svgTitle;
    svg.querySelectorAll('[data-lpt-label]').forEach(node => { node.textContent = w.labels[node.dataset.lptLabel]; });
    $('.lpt-chips').setAttribute('aria-label', w.chips);
    $('.lpt-lab h3').textContent = w.labTitle; $('.lpt-lab-intro').textContent = w.labIntro;
    $('.lpt-presets').setAttribute('aria-label', w.presets);
    for (const [id, button] of presetButtons) button.textContent = t(LIPID_PRESETS.find(item => item.id === id).name);
    for (const [key, { label }] of inputs) label.textContent = w.inputs[key];
    root.querySelector('[data-lever-group=lifestyle] legend').textContent = w.lifestyle;
    root.querySelector('[data-lever-group=drug] legend').textContent = w.drugs;
    for (const [id, span] of leverBoxes) span.textContent = t(LIPID_LEVERS.find(item => item.id === id).name);
    root.querySelectorAll('.lpt-table-scroll thead th').forEach((th, i) => { th.textContent = w.head[i]; });
    $('.lpt-claims h3').textContent = w.claimsTitle; $('.lpt-claims-intro').textContent = w.claimsIntro;
    for (const [id, node] of claimNodes) {
      const item = POST_CLAIMS.find(value => value.id === id);
      node.querySelector('.lpt-verdict').textContent = w.verdicts[item.verdict];
      node.querySelector('.lpt-claim-text').textContent = t(item.claim);
      node.querySelector('p').textContent = t(item.check);
      node.querySelector('.lpt-claim-sources').textContent = `${w.sourcesLabel}: ${item.sources.map(sourceTitle).join(' · ')}`;
    }
    $('.lpt-limit').textContent = w.limit;
    $('.lpt-sources summary').textContent = w.sources;
    $('.lpt-count').textContent = w.count(scene.counts());
  }

  function refresh() { renderStatic(); renderParticle(); renderLab(); }
  syncInputs();
  refresh();
  scene.warm();
  return { refresh };
}

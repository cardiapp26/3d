import { EP_CASES, epRecording } from './ep-cases.js';
import { drawEgm, selectableChannels } from './ep-egm.js';
import { buildLadder, inferLadderEvents, drawLadder, LADDER_STYLE } from './ep-ladder.js';
import { stripLinks } from './ep-strip-links.js';
import { EP_CLIP_TEXT } from './ep-case-text.js';
import { AVRT_LOCALIZATIONS, AVRT_LOCALIZATION_SOURCE, avrtLocalizationRecording } from './svt-avrt-localizations.js';
import { STANDARD_EPS_EXAMPLES, STANDARD_EPS_TEXT, standardEpsRecording, standardEpsMeasurements } from './eps-standard-recordings.js';
import { ECTOR_EXAMPLE, ECTOR_SOURCE, ECTOR_TEXT, ectorRecording } from './avnrt-ector-recording.js';
import { AP_ABLATION_EXAMPLES, AP_ABLATION_SOURCE, AP_ABLATION_TEXT, apAblationRecording } from './ap-ablation-recordings.js';
import { AT_EXAMPLES, AT_SOURCE, AT_RECORDING_TEXT, atRecording } from './at-markowitz-recordings.js';
import { CONCEALED_EXAMPLE, CONCEALED_SOURCE, CONCEALED_TEXT, concealedRecording } from './ap-concealed-recording.js';

export const svtExampleRecording = (id) => epRecording(id) || avrtLocalizationRecording(id) || standardEpsRecording(id) || ectorRecording(id) || apAblationRecording(id) || atRecording(id) || concealedRecording(id);

// Examples grouped for the side list; SVT_EXAMPLES is the same order, flat.
export const SVT_EXAMPLE_GROUPS = Object.freeze([
  { tr: 'Normal EPS', en: 'Normal EPS', items: [...STANDARD_EPS_EXAMPLES] },
  { tr: 'Aksesuar yol ablasyonu', en: 'Accessory pathway ablation', items: [...AP_ABLATION_EXAMPLES] },
  { tr: 'AVNRT', en: 'AVNRT', items: [
    ['avnrt-typ-svt', 'Tipik AVNRT', 'Typical AVNRT'],
    ECTOR_EXAMPLE,
    ['avnrt-atyp-svt', 'Atipik AVNRT', 'Atypical AVNRT']
  ] },
  { tr: 'AVRT', en: 'AVRT', items: [
    CONCEALED_EXAMPLE,
    ['ap-ll-svt', 'Ortodromik AVRT: concealed sol lateral yol', 'Orthodromic AVRT: concealed left lateral pathway'],
    ['ap-ips-svt', 'Ortodromik AVRT: concealed inferior paraseptal yol', 'Orthodromic AVRT: concealed inferior paraseptal pathway'],
    ['ph-svt', 'Ortodromik AVRT: concealed para-Hisian yol', 'Orthodromic AVRT: concealed para-Hisian pathway'],
    ...AVRT_LOCALIZATIONS.map((s) => [s.id, `Ortodromik AVRT: ${s.names[0]} yol`, `Orthodromic AVRT: ${s.names[1]} pathway`]),
    ['pjrt-svt', 'PJRT: concealed yavaş retrograd yol', 'PJRT: concealed slow retrograde pathway'],
    ['ap-lm-antidromic', 'Antidromik AVRT: sol lateral manifest yol', 'Antidromic AVRT: manifest left lateral pathway']
  ] },
  { tr: 'Atriyal taşikardi ve flutter', en: 'Atrial tachycardia and flutter', items: [
    ['at-svt', 'Atriyal taşikardi', 'Atrial tachycardia'],
    ...AT_EXAMPLES,
    ['flutter-svt', 'Atriyal flutter', 'Atrial flutter']
  ] },
  { tr: 'Manevralar', en: 'Maneuvers', items: [
    ['avnrt-ah-jump', 'AH jump', 'AH jump'],
    ['avnrt-jump-echo', 'AH jump + eko', 'AH jump + echo'],
    ['avnrt-typ-hispvc', 'AVNRT: His-refrakter PVC', 'AVNRT: His-refractory PVC'],
    ['ap-ll-hispvc', 'AVRT: His-refrakter PVC', 'AVRT: His-refractory PVC'],
    ['at-vop', 'AT: ventriküler overdrive', 'AT: ventricular overdrive']
  ] }
].map((g) => Object.freeze({ ...g, items: Object.freeze(g.items.map(Object.freeze)) })));
export const SVT_EXAMPLES = Object.freeze(SVT_EXAMPLE_GROUPS.flatMap((g) => g.items));

export function createSvtRecordings(doc, getLang) {
  const el = (tag, cls, attr) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (attr) n.setAttribute(attr, '');
    return n;
  };
  const root = el('section', 'basics-card svt-recordings', 'data-svt-recordings');
  const title = el('h4');
  const label = el('label', 'amap-field');
  const labelText = el('span');
  const select = el('select', '', 'data-svt-example');
  const options = SVT_EXAMPLES.map(([id]) => {
    const o = el('option'); o.value = id; select.append(o); return o;
  });
  const controls = el('div', 'amap-toggles');
  const flags = { waves: true, links: true, ladder: true };
  const buttons = Object.keys(flags).map((key) => {
    const b = el('button', 'amap-toggle');
    b.type = 'button'; b.setAttribute('data-svt-display', key);
    b.addEventListener('click', () => { flags[key] = !flags[key]; render(); });
    controls.append(b); return b;
  });
  const scroll = el('div', 'svt-recording-scroll');
  const strip = el('canvas', 'svt-recording-strip', 'data-svt-strip');
  const ladderCanvas = el('canvas', 'egm-ladder', 'data-svt-ladder');
  strip.setAttribute('role', 'img'); ladderCanvas.setAttribute('role', 'img');
  const readout = el('p', 'amap-verdict', 'data-svt-measures');
  const note = el('p', 'amap-note');
  const interpretation = el('p', 'amap-note', 'data-svt-interpretation');
  const legend = el('p', 'amap-note', 'data-svt-signal-legend');
  const stages = el('ol', 'basics-lines', 'data-svt-induction-stages');
  const source = el('a', 'amap-source', 'data-svt-localization-source');
  source.setAttribute('href', AVRT_LOCALIZATION_SOURCE);
  source.setAttribute('target', '_blank');
  source.setAttribute('rel', 'noopener noreferrer');
  // Side list of examples (desktop); the select stays as the compact picker on phones.
  const list = el('nav', 'svt-example-list', 'data-svt-example-list');
  const groupHeads = [];
  const items = new Map();
  for (const group of SVT_EXAMPLE_GROUPS) {
    const head = el('p', 'svt-example-group'); groupHeads.push([head, group]); list.append(head);
    for (const [exampleId] of group.items) {
      const b = el('button', 'svt-example-item');
      b.type = 'button'; b.setAttribute('data-svt-example-item', exampleId);
      b.addEventListener('click', () => choose(exampleId));
      items.set(exampleId, b); list.append(b);
    }
  }
  const main = el('div', 'svt-recording-main');
  const layout = el('div', 'svt-recording-layout');
  label.append(labelText, select); scroll.append(strip, ladderCanvas);
  main.append(label, controls, scroll, readout, interpretation, stages, legend, source, note);
  layout.append(list, main);
  root.append(title, layout);
  let id = SVT_EXAMPLES[0][0], active = false;
  select.value = id;
  function choose(next) {
    if (!SVT_EXAMPLES.some((example) => example[0] === next)) return;
    id = next; select.value = next; render();
  }
  select.addEventListener('change', () => choose(select.value));
  const cache = new Map();
  function data() {
    if (!cache.has(id)) {
      const recording = svtExampleRecording(id);
      const mechanism = recording.mechanism || EP_CASES.find((c) => c.id === recording.caseId)?.mechanism;
      const ladder = buildLadder(inferLadderEvents(recording.events, { mechanism }), { until: recording.windowMs });
      const available = selectableChannels(recording);
      const channels = recording.preserveChannelOrder
        ? [...recording.channels, ...available.filter((ch) => !recording.channels.includes(ch))] : available;
      cache.set(id, { recording, ladder, links: stripLinks(recording.events, ladder), channels });
    }
    return cache.get(id);
  }
  function draw() {
    if (!active) return;
    const { recording, ladder, links, channels } = data();
    strip.style && (strip.style.height = `${Math.max(480, channels.length * 48 + 34)}px`);
    const axis = drawEgm(strip, recording, { lang: getLang(), channels, waves: flags.waves,
      title: options[SVT_EXAMPLES.findIndex((e) => e[0] === id)].textContent,
      links: flags.links ? links : null, linkStyles: LADDER_STYLE });
    ladderCanvas.hidden = !flags.ladder;
    if (flags.ladder && axis) drawLadder(ladderCanvas, ladder, axis, { lang: getLang() });
  }
  function render() {
    const en = getLang() === 'en';
    title.textContent = en ? 'Worked recordings: signals and ladder' : 'Örnek kayıtlar: sinyaller ve ladder';
    labelText.textContent = en ? 'Example' : 'Örnek';
    options.forEach((o, i) => { o.textContent = SVT_EXAMPLES[i][en ? 2 : 1]; });
    list.setAttribute('aria-label', en ? 'Examples' : 'Örnekler');
    for (const [head, group] of groupHeads) head.textContent = group[en ? 'en' : 'tr'];
    SVT_EXAMPLES.forEach(([exampleId, tr, enName]) => {
      const b = items.get(exampleId);
      b.textContent = en ? enName : tr;
      b.setAttribute('aria-pressed', String(exampleId === id));
    });
    buttons.forEach((b, i) => {
      const key = Object.keys(flags)[i];
      b.textContent = (en ? ['Wave names', 'Ladder on channels', 'Ladder diagram'] : ['Dalga adları', 'Kanalda ladder', 'Ladder diyagram'])[i];
      b.setAttribute('aria-pressed', String(flags[key]));
    });
    const { recording, channels } = data();
    root.setAttribute('data-recording', id);
    strip.setAttribute('aria-label', `${options[SVT_EXAMPLES.findIndex((e) => e[0] === id)].textContent}: ${channels.join(', ')}`);
    ladderCanvas.setAttribute('aria-label', en ? 'A, AV and V conduction ladder' : 'A, AV ve V iletim ladder diyagramı');
    readout.textContent = `${en ? 'Channels' : 'Kanallar'}: ${channels.length} · ${Object.entries(standardEpsMeasurements(recording)).map(([label, value]) => `${label} ${value ?? (en ? 'n/a' : 'yok')} ms`).join(' · ')}`;
    const text = EP_CLIP_TEXT[id]?.[en ? 'en' : 'tr'];
    const localization = AVRT_LOCALIZATIONS.find((s) => s.id === id);
    const standard = STANDARD_EPS_TEXT[id];
    const ap = AP_ABLATION_TEXT[id]?.[en ? 'en' : 'tr'];
    const at = AT_RECORDING_TEXT[id]?.[en ? 'en' : 'tr'];
    const ector = id === ECTOR_EXAMPLE[0] ? ECTOR_TEXT[en ? 'en' : 'tr'] : null;
    const concealed = id === CONCEALED_EXAMPLE[0] ? CONCEALED_TEXT[en ? 'en' : 'tr'] : null;
    legend.hidden = stages.hidden = !ector;
    legend.textContent = ector?.legend || '';
    stages.replaceChildren(...(ector?.stages || []).map((text) => { const li = el('li'); li.textContent = text; return li; }));
    interpretation.textContent = concealed || at || ap || ector?.description || standard?.[en ? 'en' : 'tr'] || (localization
      ? `${localization.notes[en ? 1 : 0]} ${en ? 'Illustrative catheter positions and timings; exact localization requires mapping and maneuvers.' : 'Kateter konumları ve süreler örnek amaçlıdır; kesin lokalizasyon haritalama ve manevra gerektirir.'}`
      : text?.evidence || text?.text || text?.neutral || '');
    source.hidden = !localization && !standard && !ector && !ap && !at && !concealed;
    source.setAttribute('href', concealed ? CONCEALED_SOURCE : at ? AT_SOURCE : ap ? AP_ABLATION_SOURCE : ector ? ECTOR_SOURCE : standard?.source || AVRT_LOCALIZATION_SOURCE);
    source.textContent = concealed ? 'Brugada et al. 2019 ESC SVT guidelines, doi:10.1093/eurheartj/ehz467' : at ? 'Markowitz et al. 2019, doi:10.15420/aer.2019.17.2' : ap ? 'Prystowsky & Padanilam 2025, doi:10.1016/j.hrthm.2025.02.023' : ector ? 'Ector et al. 2020, Figure 3, p. 4 (doi:10.1093/ehjcr/ytaa129)' : standard ? (en ? 'Source: EPS measurement' : 'Kaynak: EPS ölçümü') : (en ? 'Source: retrograde atrial activation and pathway localization' : 'Kaynak: retrograd atriyal aktivasyon ve yol lokalizasyonu');
    note.textContent = en
      ? 'Synthetic teaching recordings. Normal EPS examples are measurement controls; SVT findings below apply to tachycardia. SNRT here means sinus node recovery time, not sinus node reentrant tachycardia. Example selection does not set findings. Ladder routes illustrate the known example mechanism.'
      : 'Sentetik öğretim kayıtları. Normal EPS örnekleri ölçüm içindir; aşağıdaki SVT bulguları taşikardiye uygulanır. Burada SNRT, sinüs nodu toparlanma süresidir; sinüs nodu reentran taşikardisi değildir. Örnek seçimi bulguları değiştirmez. Ladder yolları örneğin bilinen mekanizmasını gösterir.';
    draw();
  }
  const Resize = doc.defaultView?.ResizeObserver;
  if (Resize) new Resize(draw).observe(root);
  return { element: root, render, setActive(flag) { active = Boolean(flag); if (active) render(); } };
}

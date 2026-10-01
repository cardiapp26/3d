import { ORIGIN_KINDS, ORIGIN_EXAMPLES, REGIONS, nextExample, originEcg, likelyRegions, gradeOrigin, originRecording } from './ep-origin.js';
import { drawEcg12 } from './ecg12.js';
import { ORIGIN_TEXT } from './ep-origin-text.js';
import { EP_CHANNELS } from './ep-cases.js';

/*
 * PAC / PVC source-region panel (ep-origin.js), in the Diagnosis tab: the
 * synthetic 12-lead ECG of one example, the region choice, then the features
 * read from the ECG, the likely regions with the confidence reason and, for
 * an atrial focus, the catheter activation on the signal strip with its
 * sampling limit. The 3D region marker appears after the answer.
 */

const CHANNEL_LABEL = new Map(EP_CHANNELS.map((c) => [c.id, c.label]));

/**
 * @param {Document} doc
 * @param {{ getLang: () => string, onRecording: (recording: object|null) => void, onAnswer: (recording: object|null) => void }} deps
 *   onRecording(null) when an example opens; onAnswer(catheter recording or null) after the answer
 */
export function createOriginPanel(doc, { getLang, onRecording, onAnswer }) {
  const el = (tag, cls, attrs = {}) => {
    const node = doc.createElement(tag);
    if (cls) node.className = cls;
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };
  let kind = 'ventricular';
  let example = null;
  let answer = null;
  let last = null;

  const root = el('details', 'ep-task ep-origin', { 'data-ep-origin': '' });
  const summary = el('summary', 'ep-task-title');
  const intro = el('p', 'ep-pace-note');
  const controls = el('div', 'ep-pace-actions');
  const kindLabel = el('label', 'ep-pace-field');
  const kindName = el('span');
  const kindSelect = el('select', '', { 'data-ep-origin-kind': '' });
  kindLabel.append(kindName, kindSelect);
  const nextBtn = el('button', 'ep-pace-deliver', { type: 'button', 'data-ep-origin-action': 'next' });
  controls.append(kindLabel, nextBtn);
  const body = el('div', 'ep-task-body');
  const context = el('p', 'ep-pace-note ep-origin-context');
  const canvas = el('canvas', 'ecg12-canvas', { role: 'img' });
  const question = el('p', 'ep-pace-question');
  const answers = el('div', 'ep-pace-answers');
  const grade = el('p', 'ep-pace-grade', { 'aria-live': 'polite' });
  const featuresTitle = el('p', 'ep-pace-subtitle');
  const features = el('ul', 'ep-pace-list');
  const likelyTitle = el('p', 'ep-pace-subtitle');
  const likely = el('ul', 'ep-pace-list');
  const sampling = el('p', 'ep-pace-note');
  const sceneNote = el('p', 'ep-pace-note');
  const limits = el('p', 'ep-pace-note ep-pace-limits');
  body.append(context, canvas, question, answers, grade, featuresTitle, features, likelyTitle, likely, sampling, sceneNote);
  root.append(summary, intro, controls, body, limits);

  // The catheter strip of an atrial focus goes to the signal panel only after the answer:
  // its earliest channel would otherwise give the region away before the ECG is read.
  function open(target) {
    kind = target.kind;
    example = target;
    answer = null;
    last = originRecording(example);
    root.open = true;
    render();
    onRecording(null);
  }
  const next = () => open(nextExample(kind, example?.kind === kind ? example.id : null));
  kindSelect.addEventListener('change', () => { kind = ORIGIN_KINDS.includes(kindSelect.value) ? kindSelect.value : 'ventricular'; next(); });
  nextBtn.addEventListener('click', next);
  root.addEventListener('toggle', () => { if (root.open) draw(); });
  // Redraw when the panel changes width (tab switch, window resize).
  if (typeof globalThis.ResizeObserver === 'function') new globalThis.ResizeObserver(() => draw()).observe(canvas);

  const list = (node, lines) => node.replaceChildren(...lines.map((line) => { const li = el('li'); li.textContent = line; return li; }));

  function draw() {
    if (!example || !root.open) return;
    const t = ORIGIN_TEXT[getLang() === 'en' ? 'en' : 'tr'];
    drawEcg12(canvas, originEcg(example), { lang: getLang(), title: t.kinds[example.kind] });
  }

  function render() {
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const t = ORIGIN_TEXT[lang];
    summary.textContent = t.heading;
    intro.textContent = t.intro;
    kindName.textContent = t.kind;
    const key = ORIGIN_KINDS.map((k) => t.kinds[k]).join('|');
    if (kindSelect.dataset?.key !== key) {
      kindSelect.replaceChildren(...ORIGIN_KINDS.map((k) => { const o = doc.createElement('option'); o.value = k; o.textContent = t.kinds[k]; return o; }));
      if (kindSelect.dataset) kindSelect.dataset.key = key;
    }
    kindSelect.value = kind;
    nextBtn.textContent = t.next;
    limits.textContent = t.limits;
    body.hidden = !example;
    if (!example) return;
    context.textContent = t.contexts[example.context];
    canvas.setAttribute('aria-label', `${t.kinds[example.kind]}: ${t.question}`);
    question.textContent = t.question;
    answers.replaceChildren(...REGIONS[example.kind].map((region) => {
      const b = el('button', '', { type: 'button', 'data-ep-origin-answer': region, 'aria-pressed': String(region === answer) });
      b.textContent = t.regions[region];
      b.addEventListener('click', () => { answer = region; render(); onAnswer(last); });
      return b;
    }));
    const answered = Boolean(answer);
    for (const node of [grade, featuresTitle, features, likelyTitle, likely, sceneNote]) node.hidden = !answered;
    sampling.hidden = !answered || !last;
    if (answered) {
      const state = gradeOrigin(example, answer);
      const result = likelyRegions(example);
      grade.dataset.grade = state;
      grade.textContent = `${t.grades[state]} ${t.source}: ${t.regions[example.region]}.`;
      featuresTitle.textContent = t.featuresTitle;
      list(features, t.featureLines(result.features));
      likelyTitle.textContent = t.likelyTitle;
      list(likely, [result.likely.map((r) => t.regions[r]).join(', '), t.confidence[result.confidence], ...result.reasons.map((r) => t.reasons[r])]);
      if (last) {
        const ms = last.earliestLead;
        sampling.textContent = `${t.sampling(CHANNEL_LABEL.get(last.earliest) || last.earliest, ms)} ${ms < 0 ? t.before : t.after}`;
      }
      sceneNote.textContent = t.scene;
    }
    draw();
  }

  render();
  return {
    element: root,
    render,
    draw,
    owns: (recording) => Boolean(recording) && recording === last,
    stripTitle: (lang) => ORIGIN_TEXT[lang === 'en' ? 'en' : 'tr'].stripTitle,
    /** 3D marker of the source region, released once the learner answered. */
    getScene: () => (example && answer ? { origin: example.region } : null),
    getExample: () => example,
    /** Show an example by id (tests and shared exercises), or the next of the current kind. */
    show(id = null) {
      const target = ORIGIN_EXAMPLES.find((e) => e.id === id);
      if (target) open(target);
      else next();
    }
  };
}

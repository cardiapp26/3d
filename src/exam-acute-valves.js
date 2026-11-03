// "Auscultation in acute valvular emergencies": five schematic
// phonocardiogram strips (normal, acute MR, acute AR, chronic MS, chronic AS)
// from S1 to the next S1, after a teaching figure, redrawn from the findings
// table. A cursor sweeps on the shared cardiac clock and each label lights
// up as the cursor passes its event; each row can play its schematic sound
// through the exam audio engine and opens its finding in the main panel.

import './exam-acute-valves.css';
import { createExamAudio, audioSupported } from './exam-audio.js';
import { FINDINGS } from './exam-findings.js';
import { physiologyOf } from './exam-physiology.js';
import {
  ACUTE_ROWS, ACUTE_TEXT, cursorX, findingLabel, isLit, normLang, rowLabels, rowTitle, sampleAcuteStrip, stackRows
} from './exam-acute-valves-model.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const W = 300, LEFT = 5, PW = W - 10;
const LABEL_ROW_H = 10, LABEL_TOP = 10, BAR_MAX = 30, MURMUR_SCALE = 56;
const COLUMNS = 240;
const CHAR_W = 4.7;                    // approximate width of a 9px label character in viewBox units
const textWidth = text => text.length * CHAR_W;
const xOf = x => LEFT + x * PW;
let uid = 0;

function el(tag, cls, text, props) {
  const node = Object.assign(document.createElement(tag), props);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}
function svgEl(tag, attrs, text) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, String(v));
  if (text != null) node.textContent = text;
  return node;
}

function hatchPattern(id) {
  const pattern = svgEl('pattern', { id, width: 4, height: 4, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
  pattern.append(svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 4, class: 'acute-hatch' }));
  return pattern;
}

/** Closed path of the murmur envelope above the baseline, one subpath per segment. */
function murmurPath(strip, baseline) {
  const n = strip.murmur.length;
  return strip.segments.map(seg => {
    const i0 = Math.round(seg.x0 * (n - 1)), i1 = Math.round(seg.x1 * (n - 1));
    const pts = [];
    for (let i = i0; i <= i1; i++) pts.push(`${xOf(i / (n - 1)).toFixed(1)},${(baseline - strip.murmur[i] * MURMUR_SCALE).toFixed(1)}`);
    return `M${xOf(seg.x0).toFixed(1)},${baseline} L${pts.join(' L')} L${xOf(seg.x1).toFixed(1)},${baseline} Z`;
  }).join(' ');
}

function layoutLabels(labels) {
  const sounds = labels.filter(l => l.type === 'sound');
  const murmurs = labels.filter(l => l.type === 'murmur');
  const place = list => stackRows(list, textWidth, PW).map((p, i) => ({ ...list[i], ...p }));
  return { sounds: place(sounds), murmurs: place(murmurs) };
}

/** SVG strip for one row; returns the svg, its cursor and its lit-able nodes. */
function buildStrip(row, strip, lang) {
  const { sounds, murmurs } = layoutLabels(rowLabels(row, strip, lang));
  const soundRows = Math.max(1, ...sounds.map(s => s.row + 1));
  const murmurRows = murmurs.length ? Math.max(...murmurs.map(m => m.row + 1)) : 0;
  const barTop = LABEL_TOP + soundRows * LABEL_ROW_H;
  const baseline = barTop + BAR_MAX + 4;
  const height = baseline + 6 + murmurRows * LABEL_ROW_H + 2;
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${height}`, class: 'acute-svg', role: 'img', 'aria-label': `${rowTitle(row, lang)}: ${labelsText(sounds, murmurs)}` });
  const id = `acute-hatch-${++uid}`;
  const defs = svgEl('defs');
  defs.append(hatchPattern(id));
  const sys = strip.systole;
  svg.append(defs,
    svgEl('rect', { x: xOf(sys[0]), y: barTop - 2, width: (sys[1] - sys[0]) * PW, height: baseline - barTop + 4, class: 'acute-systole' }),
    svgEl('path', { d: murmurPath(strip, baseline), fill: `url(#${id})`, class: 'acute-murmur' }),
    svgEl('line', { x1: LEFT, x2: W - LEFT, y1: baseline, y2: baseline, class: 'acute-baseline' }));
  const lit = [];
  for (const s of sounds) {
    const sound = strip.sounds.find(x => x.label === s.id);
    const h = Math.max(4, Math.min(1, sound.amp) * BAR_MAX);
    const bar = svgEl('line', { x1: xOf(s.x), x2: xOf(s.x), y1: baseline, y2: baseline - h, class: `acute-bar is-${s.tone}${sound.amp < 0.3 ? ' is-soft' : ''}` });
    const text = svgEl('text', { x: LEFT + s.left, y: LABEL_TOP + s.row * LABEL_ROW_H + 7, class: `acute-label is-${s.tone}` }, s.text);
    svg.append(bar, text);
    lit.push({ label: s, nodes: [bar, text] });
  }
  for (const m of murmurs) {
    const text = svgEl('text', { x: LEFT + m.left, y: baseline + 13 + m.row * LABEL_ROW_H, class: 'acute-label is-murmur' }, m.text);
    svg.append(text);
    lit.push({ label: m, nodes: [text] });
  }
  const cursor = svgEl('line', { x1: LEFT, x2: LEFT, y1: 2, y2: height - 2, class: 'acute-cursor' });
  svg.append(cursor);
  return { svg, cursor, lit };
}

const labelsText = (sounds, murmurs) => [...sounds, ...murmurs].map(l => l.text).join(', ');

function buildRow(row, lang, bpm) {
  const T = ACUTE_TEXT[lang];
  const strip = sampleAcuteStrip(row.findingId, { bpm, columns: COLUMNS });
  const item = el('li', 'acute-row');
  item.dataset.finding = row.findingId;
  const select = el('button', 'acute-select', null, { type: 'button', title: T.select });
  select.dataset.acuteSelect = row.findingId;
  const head = el('span', 'acute-head');
  head.append(el('b', 'acute-key', row.key), el('span', 'acute-title', row.title[lang] || row.title.en));
  const parts = buildStrip(row, strip, lang);
  select.append(head, parts.svg);
  select.setAttribute('aria-label', `${rowTitle(row, lang)}. ${findingLabel(row, lang)}. ${T.select}`);
  const play = el('button', 'acute-play', null, { type: 'button' });
  play.dataset.acutePlay = row.findingId;
  item.append(select, play);
  return { row, item, play, ...parts, litState: [] };
}

function buildLegend(T) {
  const legend = el('p', 'acute-legend');
  for (const [cls, text] of [['is-aortic', T.aortic], ['is-pulmonic', T.pulmonic], ['is-murmur', T.murmur], ['is-systole', T.systole]]) {
    const item = el('span', 'acute-legend-item');
    item.append(el('i', `acute-swatch ${cls}`), document.createTextNode(text));
    legend.append(item);
  }
  return legend;
}

const reducedMotionQuery = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)') || null;

/**
 * @param {HTMLElement} root container for the section
 * @param {{ lang?: 'tr'|'en', getCycleState?: () => ({ phase: number, bpm: number, playing: boolean }),
 *   onSelect?: (findingId: string) => void, onPlay?: (findingId: string) => void }} options
 *   onPlay: a row started its sound (the integrator silences other sound sources).
 */
export function createAcuteValves(root, options = {}) {
  if (!root) throw new Error('createAcuteValves: root is required');
  const { getCycleState = () => ({}), onSelect, onPlay } = options;
  const rows = ACUTE_ROWS.filter(row => FINDINGS[row.findingId]);
  const ac = new AbortController();
  let lang = normLang(options.lang), bpmKey = 0, built = [], playing = null, activeId = null, lastCycle = {};
  const motion = reducedMotionQuery();
  let reduced = Boolean(motion?.matches);
  const element = el('section', 'acute-valves');
  const title = el('h4', 'exam-section-title acute-heading');
  const intro = el('p', 'acute-intro');
  const list = el('ol', 'acute-list');
  const note = el('p', 'acute-note', null, { hidden: true });
  element.append(title, intro, list, note);
  root.append(element);
  const audio = createExamAudio({ getParams: audioParams });
  const canPlay = audioSupported();

  function audioParams() {
    const cs = lastCycle || {};
    const f = FINDINGS[playing];
    return {
      findingId: playing, pitch: f?.pitch, physio: physiologyOf('rest'), bpm: cs.bpm, rhythm: 'sinus', phase: cs.phase,
      active: Boolean(playing) && !root.hidden && !globalThis.document?.hidden && cs.playing !== false
    };
  }

  function render(bpm) {
    const T = ACUTE_TEXT[lang];
    element.lang = lang;
    element.classList.toggle('is-static', reduced);
    title.textContent = T.title;
    intro.textContent = T.intro;
    note.textContent = T.soundNote;
    built = rows.map(row => buildRow(row, lang, bpm));
    list.replaceChildren(buildLegendItem(T), ...built.map(b => b.item));
    renderButtons();
  }
  const buildLegendItem = T => { const li = el('li', 'acute-legend-row'); li.append(buildLegend(T)); return li; };

  function renderButtons() {
    const T = ACUTE_TEXT[lang];
    for (const b of built) {
      const on = playing === b.row.findingId;
      b.play.hidden = !canPlay;
      b.play.textContent = on ? '■' : '▶';
      b.play.setAttribute('aria-label', `${on ? T.stop : T.play}: ${rowTitle(b.row, lang)}`);
      b.play.title = on ? T.stop : T.play;
      b.play.setAttribute('aria-pressed', String(on));
      b.item.classList.toggle('is-active', b.row.findingId === activeId);
      b.item.classList.toggle('is-playing', on);
    }
    note.hidden = !playing;
  }

  function setPlaying(findingId) {
    playing = findingId && playing !== findingId ? findingId : null;
    const onNow = audio.setEnabled(Boolean(playing));
    if (!onNow) playing = null;
    if (playing) onPlay?.(playing);
    renderButtons();
  }

  function updateRow(b, cursor) {
    b.cursor.setAttribute('x1', xOf(cursor).toFixed(1));
    b.cursor.setAttribute('x2', xOf(cursor).toFixed(1));
    b.lit.forEach((entry, i) => {
      const on = reduced || isLit(entry.label, cursor);
      if (b.litState[i] === on) return;
      b.litState[i] = on;
      for (const node of entry.nodes) node.classList.toggle('is-lit', on);
    });
  }

  /** Per tick: move the cursors, light labels; rebuilds only when the rate changes. */
  function draw(cycleState) {
    const cs = cycleState || getCycleState() || {};
    lastCycle = cs;
    if (root.hidden) return;
    const bpm = cs.bpm > 0 ? cs.bpm : 72;
    if (Math.round(bpm) !== bpmKey) { bpmKey = Math.round(bpm); render(bpmKey); }
    const cursor = reduced ? 0 : cursorX(cs.phase, bpmKey);
    for (const b of built) updateRow(b, cursor);
  }

  on(list, 'click', event => {
    const play = event.target.closest('[data-acute-play]');
    if (play) { setPlaying(play.dataset.acutePlay); return; }
    const select = event.target.closest('[data-acute-select]');
    if (select) { activeId = select.dataset.acuteSelect; renderButtons(); onSelect?.(activeId); }
  });
  motion?.addEventListener?.('change', () => { reduced = motion.matches; bpmKey = 0; draw(lastCycle); }, { signal: ac.signal });
  function on(target, type, fn) { target.addEventListener(type, fn, { signal: ac.signal }); }

  draw();
  return {
    element,
    draw,
    setLanguage(next) { lang = normLang(next); bpmKey = 0; draw(lastCycle); },
    /** Mark the row of the panel's current finding. */
    setActive(findingId) {
      if (findingId === activeId) return;
      activeId = findingId;
      renderButtons();
    },
    stopAudio() { if (playing) setPlaying(null); },
    isPlaying: () => playing,
    destroy() { ac.abort(); audio.destroy(); root.removeChild(element); }
  };
}

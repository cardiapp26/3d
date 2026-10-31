/**
 * Image reading quiz workspace: level cards, then one question at a time on a live frame of the
 * teaching model with an arrow on the target, three answers, an explanation after each pick, a
 * score per level, and a link that opens the same frame in the Basics probe.
 */
import { FOV_MM, buildFrame, paintBlood, FRAME_SYSTEMS } from './ivus-basics-frame.js';
import { STRUCTURES, STRUCTURE_NAMES, ECHO_LABEL } from './ivus-basics-data.js';
import { STRUCTURE_ECHO } from './ivus-basics-frame.js';
import { QUIZ_LEVELS, QUIZ_TEXT as T, questionTarget, questionOptions } from './ivus-quiz-data.js';
import { basicsDefaults } from './ivus-basics.js';

const BUFFER = 300;
const pick = (o, lang) => o[lang === 'en' ? 'en' : 'tr'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const frames = new Map();
function frameFor(question) {
  const key = `${question.preset}|${question.system}`;
  if (!frames.has(key)) frames.set(key, buildFrame(BUFFER, { preset: question.preset, system: question.system }));
  return frames.get(key);
}

export function quizDefaults() { return { level: null, q: 0, picked: null, results: {} }; }

export function quizWorkspaceHtml(state, lang) {
  const z = state.quiz ||= quizDefaults(), t = k => esc(pick(T[k], lang));
  const total = QUIZ_LEVELS.reduce((a, l) => a + (z.results[l.id] || []).filter(Boolean).length, 0), max = QUIZ_LEVELS.reduce((a, l) => a + l.questions.length, 0);
  const head = `<header class="ivus-basics-head"><span class="ivus-kicker">${t('title')}</span><p>${t('intro')}</p><strong class="ivus-quiz-total" data-quiz-total>${t('total')}: ${total} / ${max}</strong></header>`;
  if (z.level == null) {
    const cards = QUIZ_LEVELS.map((l, i) => {
      const res = z.results[l.id] || [], done = res.length === l.questions.length;
      return `<article class="ivus-quiz-card" data-quiz-card="${l.id}"><span class="ivus-quiz-num">${i + 1}</span><h3>${esc(pick(l.title, lang))}</h3><p>${esc(pick(l.intro, lang))}</p>
        <span class="ivus-quiz-progress">${done ? `${res.filter(Boolean).length} / ${l.questions.length}` : `${l.questions.length} ${lang === 'en' ? 'questions' : 'soru'}`}</span>
        <button type="button" data-quiz-level="${i}">${done ? t('again') : t('start')}</button></article>`;
    }).join('');
    return `<section class="ivus-basics ivus-quiz" data-ivus-quiz>${head}<div class="ivus-quiz-levels">${cards}</div></section>`;
  }
  const level = QUIZ_LEVELS[z.level], res = z.results[level.id] || [];
  if (z.q >= level.questions.length) {
    const score = res.filter(Boolean).length;
    return `<section class="ivus-basics ivus-quiz" data-ivus-quiz>${head}<div class="ivus-quiz-summary" data-quiz-summary><h3>${t('done')}: ${esc(pick(level.title, lang))}</h3><strong>${score} / ${level.questions.length}</strong>
      <div class="ivus-quiz-actions"><button type="button" data-quiz-level="${z.level}">${t('again')}</button><button type="button" data-quiz-menu>${t('levels')}</button>${z.level + 1 < QUIZ_LEVELS.length ? `<button type="button" data-quiz-level="${z.level + 1}">${esc(pick(QUIZ_LEVELS[z.level + 1].title, lang))} ›</button>` : ''}</div></section>`;
  }
  const question = level.questions[z.q], options = questionOptions(question, z.q + z.level);
  const name = id => esc(pick(STRUCTURE_NAMES[id], lang));
  const feedback = z.picked == null ? '' : `<div class="ivus-quiz-feedback ${z.picked === question.answer ? 'is-right' : 'is-wrong'}" data-quiz-feedback role="status">
      <strong>${z.picked === question.answer ? t('right') : `${t('wrong')} ${name(question.answer)}.`}</strong>
      <em>${esc(pick(ECHO_LABEL[STRUCTURE_ECHO[question.answer]], lang))}</em>
      <p>${esc(pick(STRUCTURES[question.answer], lang))}</p>
      <div class="ivus-quiz-actions"><button type="button" data-quiz-next>${t('next')} ›</button><button type="button" data-quiz-inspect>${t('inspect')}</button></div></div>`;
  return `<section class="ivus-basics ivus-quiz" data-ivus-quiz>${head}
    <div class="ivus-quiz-play">
      <div class="ivus-basics-stage"><p class="ivus-quiz-meta">${z.level + 1} · ${esc(pick(level.title, lang))} · ${t('question')} ${z.q + 1} / ${level.questions.length} · ${t('score')} ${res.filter(Boolean).length} · ${FRAME_SYSTEMS[question.system].freq} MHz</p>
        <canvas class="ivus-basics-frame" data-quiz-frame role="img" aria-label="${t('ask')}"></canvas></div>
      <aside class="ivus-basics-side"><h3>${t('ask')}</h3>
        <div class="ivus-quiz-options">${options.map(id => `<button type="button" data-quiz-option="${id}" ${z.picked != null ? 'disabled' : ''} class="${z.picked == null ? '' : id === question.answer ? 'is-right' : id === z.picked ? 'is-wrong' : ''}">${name(id)}</button>`).join('')}</div>
        ${feedback}
        <button type="button" class="ivus-quiz-back" data-quiz-menu>‹ ${t('levels')}</button>
      </aside>
    </div></section>`;
}

export function mountQuizWorkspace(root, state, { rerender }) {
  const z = state.quiz ||= quizDefaults(), host = root.querySelector('[data-ivus-quiz]');
  if (!host) return { dispose() {} };
  let raf = null, disposed = false;
  host.querySelectorAll('[data-quiz-level]').forEach(b => b.addEventListener('click', () => {
    z.level = Number(b.dataset.quizLevel); z.q = 0; z.picked = null; z.results[QUIZ_LEVELS[z.level].id] = []; rerender();
  }));
  host.querySelectorAll('[data-quiz-menu]').forEach(b => b.addEventListener('click', () => { z.level = null; z.picked = null; rerender(); }));
  const level = z.level == null ? null : QUIZ_LEVELS[z.level], question = level?.questions[z.q];
  host.querySelectorAll('[data-quiz-option]').forEach(b => b.addEventListener('click', () => {
    if (z.picked != null || !question) return;
    z.picked = b.dataset.quizOption;
    (z.results[level.id] ||= [])[z.q] = z.picked === question.answer;
    rerender();
  }));
  host.querySelector('[data-quiz-next]')?.addEventListener('click', () => { z.q += 1; z.picked = null; rerender(); });
  host.querySelector('[data-quiz-inspect]')?.addEventListener('click', () => {
    const target = questionTarget(question);
    state.basics = { ...(state.basics || basicsDefaults()), preset: question.preset, system: question.system, probe: target ? { x: target.x, y: target.y } : null, step: -1, sweep: false };
    state.workspaceMode = 'basics'; rerender();
  });

  const canvas = host.querySelector('[data-quiz-frame]');
  if (canvas && question) {
    const frame = frameFor(question), target = questionTarget(question);
    const buffer = document.createElement('canvas'); buffer.width = buffer.height = BUFFER;
    const bctx = buffer.getContext('2d'), image = bctx.createImageData(BUFFER, BUFFER);
    const tick = ts => {
      raf = null; if (disposed) return;
      const w = canvas.clientWidth; if (w > 2) {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(w * dpr); }
        const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        image.data.set(frame.data); paintBlood(frame, image.data, ts / 1000); bctx.putImageData(image, 0, 0);
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, w);
        ctx.save(); ctx.beginPath(); ctx.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(buffer, 0, 0, w, w); ctx.restore();
        if (target) drawArrow(ctx, w, target);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  return { getState: () => ({ ...z, target: question ? questionTarget(question) : null, answer: question?.answer ?? null }), dispose() { disposed = true; if (raf != null) cancelAnimationFrame(raf); } };
}

/** A cyan arrow pointing at the target from outside it (or from inside when the target sits near the edge). */
function drawArrow(ctx, S, target) {
  const k = S / 2 / FOV_MM, ux = target.x / (target.r || 1), uy = target.y / (target.r || 1);
  const outward = target.r + 1.1 < FOV_MM - .1, len = outward ? 1.0 : -.9, tip = outward ? .1 : -.1;
  const px = mm => S / 2 + mm * k;
  const x0 = px(target.x + ux * len), y0 = px(target.y + uy * len), x1 = px(target.x + ux * tip), y1 = px(target.y + uy * tip);
  const ang = Math.atan2(y1 - y0, x1 - x0);
  ctx.save(); ctx.strokeStyle = '#22d3ee'; ctx.fillStyle = '#22d3ee'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 11 * Math.cos(ang - .45), y1 - 11 * Math.sin(ang - .45)); ctx.lineTo(x1 - 11 * Math.cos(ang + .45), y1 - 11 * Math.sin(ang + .45)); ctx.closePath(); ctx.fill();
  ctx.restore();
}

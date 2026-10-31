// Transseptal guide panel of the transseptal lesson: tabs for the equipment,
// the procedure step by step (schematic fluoroscopy with the SVC pullback),
// LA confirmation, site choice by procedure, difficult cases, complications,
// history and a knowledge check. Content: transseptal-guide-data.js.
import './transseptal-guide.css';
import {
  TS_SOURCES, TS_GUIDE_TABS, TS_GUIDE_WORDS, TS_EQUIPMENT, TS_NEEDLE_POSITIONS, TS_CLOCK_TEXT, clockVerdict,
  TS_PROCEDURE, TS_LA_SIGNS, laVerdict, TS_LA_VERDICT_TEXT, TS_SITE_GUIDE, TS_TROUBLE, TS_COMPLICATIONS, TS_HISTORY, TS_QUIZ
} from './transseptal-guide-data.js';
import { equipmentFigure, needleTipFigure, clockFigure, hourAtPoint, fluoroFigure, pullbackState, fossaMapFigure } from './transseptal-guide-figures.js';

// Pullback fraction and extra drawing of each procedure stage (fluoroscopy schematic).
const STAGE_VIEW = Object.freeze({
  prep: [0, null], svc: [0, null], needle: [0, null], orient: [0.05, null], jump1: [0.42, null],
  fossa: [0.92, null], confirm: [0.92, null], puncture: [0.92, 'needle'], cross: [0.92, 'dilator'], exchange: [0.92, 'wire']
});

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function button(cls, text, data = {}) {
  const b = el('button', cls, text);
  b.type = 'button';
  for (const [k, v] of Object.entries(data)) b.dataset[k] = v;
  return b;
}
const unique = list => [...new Set(list)];

/**
 * @param {{ mount: HTMLElement, getLang?: () => string, onLessonStep?: (index: number) => void, onShowSite?: (key: string) => void }} options
 */
export function createTransseptalGuide({ mount, getLang = () => 'tr', onLessonStep = () => {}, onShowSite = () => {} }) {
  if (!mount) throw new Error('Transseptal guide needs a mount element');
  const state = {
    tab: 'equipment', part: 'needle', needlePos: 'gap', hour: 4.5,
    step: 0, view: 'lao', pull: 0, signs: [], site: 'pvi', quiz: { index: 0, picks: [] }
  };
  let active = false;
  let live = {};
  const root = el('section', 'tsg');
  root.dataset.tsGuide = '';
  mount.append(root);

  const lang = () => (getLang() === 'en' ? 'en' : 'tr');
  const words = () => TS_GUIDE_WORDS[lang()];
  const t = obj => obj[lang()];

  function sourceLine(keys) {
    const p = el('p', 'tsg-cite');
    p.textContent = keys.map(k => TS_SOURCES[k].short).join(' · ');
    return p;
  }

  /* ---------- Tabs ---------- */
  function equipmentTab(body) {
    const W = words();
    const names = Object.fromEntries(TS_EQUIPMENT.map(p => [p.id, t(p.name)]));
    body.append(equipmentFigure(names, state.part));
    const part = TS_EQUIPMENT.find(p => p.id === state.part) || TS_EQUIPMENT[0];
    const card = el('div', 'tsg-card');
    card.append(el('h5', '', t(part.name)), el('p', '', t(part.text)), sourceLine(part.sources));
    body.append(card);

    const tip = el('div', 'tsg-block');
    tip.append(el('h5', '', W.needle));
    const choices = el('div', 'tsg-chips');
    for (const pos of TS_NEEDLE_POSITIONS) {
      const b = button(`tsg-chip${pos.id === state.needlePos ? ' on' : ''}`, t(pos.label), { needlePos: pos.id });
      b.setAttribute('aria-pressed', String(pos.id === state.needlePos));
      choices.append(b);
    }
    const pos = TS_NEEDLE_POSITIONS.find(p => p.id === state.needlePos);
    tip.append(choices, needleTipFigure(pos.mm, pos.id === 'stylet'));
    const note = el('p', `tsg-note ${pos.safe ? 'safe' : 'warn'}`, t(pos.note));
    tip.append(note);
    body.append(tip);

    const clock = el('div', 'tsg-block tsg-clock-block');
    clock.append(el('h5', '', W.clock));
    const slider = el('input', 'tsg-range');
    Object.assign(slider, { type: 'range', min: '0.5', max: '12', step: '0.5', value: String(state.hour) });
    slider.dataset.tsgHour = '';
    slider.setAttribute('aria-label', W.clockHint);
    const figBox = el('div', 'tsg-clock-fig');
    const readout = el('p', 'tsg-note');
    const paint = () => {
      const verdict = clockVerdict(state.hour);
      const fig = clockFigure(state.hour, verdict, W, clockVerdict);
      fig.dataset.tsgClock = '';
      figBox.replaceChildren(fig);
      readout.className = `tsg-note verdict-${verdict}`;
      readout.dataset.clockVerdict = verdict;
      readout.replaceChildren(el('strong', '', `${String(state.hour).replace('.5', ':30')}  `), document.createTextNode(t(TS_CLOCK_TEXT[verdict])));
    };
    paint();
    live.hour = paint;
    const row = el('div', 'tsg-clock-row');
    const side = el('div', 'tsg-clock-side');
    side.append(slider, readout, sourceLine(['earley', 'academy']));
    row.append(figBox, side);
    clock.append(row);
    body.append(clock);
  }

  function stepsTab(body) {
    const W = words();
    const step = TS_PROCEDURE[state.step];
    const nav = el('div', 'tsg-stepnav');
    const prev = button('tsg-btn', `‹ ${W.prev}`, { stepMove: '-1' });
    prev.disabled = state.step === 0;
    const next = button('tsg-btn', `${W.next} ›`, { stepMove: '1' });
    next.disabled = state.step === TS_PROCEDURE.length - 1;
    const counter = el('span', 'tsg-counter', `${W.stepOf} ${state.step + 1}/${TS_PROCEDURE.length}`);
    counter.dataset.stepCounter = '';
    nav.append(prev, counter, next);
    body.append(nav);

    const dots = el('ol', 'tsg-dots');
    TS_PROCEDURE.forEach((s, i) => {
      const li = el('li');
      const b = button(`tsg-dot${i === state.step ? ' on' : ''}`, String(i + 1), { stepGo: String(i) });
      b.title = t(s.title);
      b.setAttribute('aria-label', t(s.title));
      li.append(b);
      dots.append(li);
    });
    body.append(dots);

    const card = el('div', 'tsg-card');
    card.append(el('h5', '', `${state.step + 1}. ${t(step.title)}`), el('p', '', t(step.text)), el('p', 'tsg-pearl', t(step.pearl)), sourceLine(step.sources));
    card.append(button('tsg-btn tsg-btn-3d', W.show3d, { tsgLesson: String(step.lesson) }));
    body.append(card);

    const fluoro = el('div', 'tsg-block');
    const views = el('div', 'tsg-chips');
    for (const v of ['lao', 'rao']) {
      const b = button(`tsg-chip${state.view === v ? ' on' : ''}`, W[v], { tsgView: v });
      b.setAttribute('aria-pressed', String(state.view === v));
      views.append(b);
    }
    const extra = STAGE_VIEW[step.stage][1];
    const slider = el('input', 'tsg-range');
    Object.assign(slider, { type: 'range', min: '0', max: '1', step: '0.01', value: String(state.pull) });
    slider.dataset.tsgPull = '';
    slider.setAttribute('aria-label', W.pullback);
    const figBox = el('div', 'tsg-fluoro-box');
    const badge = el('p', 'tsg-badges');
    const paint = () => {
      const fig = fluoroFigure(state.view, state.pull, extra, W);
      fig.dataset.tsgFluoro = '';
      figBox.replaceChildren(fig);
      const tip = pullbackState(state.view, state.pull);
      badge.dataset.jumps = String(tip.jumps);
      badge.dataset.tent = String(tip.tent);
      badge.replaceChildren();
      for (let j = 1; j <= 2; j++) badge.append(el('span', `tsg-badge${tip.jumps >= j ? ' on' : ''}`, `${W.jump} ${j}`));
      badge.append(el('span', `tsg-badge tent${tip.tent ? ' on' : ''}`, W.tent));
    };
    paint();
    live.pull = paint;
    const label = el('span', 'tsg-label', W.pullback);
    fluoro.append(views, figBox, label, slider, badge, el('p', 'tsg-cite', W.schematic));
    body.append(fluoro);
  }

  function confirmTab(body) {
    const W = words();
    body.append(el('p', 'tsg-lead', W.signsPick));
    const list = el('div', 'tsg-signs');
    for (const sign of TS_LA_SIGNS) {
      const label = el('label', `tsg-sign${sign.trap ? ' trap' : ''}`);
      const box = el('input');
      box.type = 'checkbox';
      box.dataset.tsgSign = sign.id;
      box.checked = state.signs.includes(sign.id);
      label.append(box, el('span', '', t(sign.text)));
      list.append(label);
    }
    body.append(list);
    const verdict = laVerdict(state.signs);
    const out = el('div', `tsg-verdict ${verdict.ok ? 'ok' : (verdict.reason === 'pericardial' || verdict.reason === 'aortic') ? 'alarm' : 'wait'}`);
    out.dataset.laVerdict = verdict.reason;
    out.append(el('strong', '', verdict.ok ? W.advanceOk : W.advanceNo), el('p', '', t(TS_LA_VERDICT_TEXT[verdict.reason])));
    body.append(out, sourceLine(['ehra', 'earley', 'academy']));
  }

  function sitesTab(body) {
    const W = words();
    const names = Object.fromEntries(TS_SITE_GUIDE.map(s => [s.key, t(s.name)]));
    const row = el('div', 'tsg-site-row');
    const fig = fossaMapFigure(state.site, names, W);
    const pick = el('div', 'tsg-chips tsg-chips-col');
    for (const s of TS_SITE_GUIDE) {
      const b = button(`tsg-chip${s.key === state.site ? ' on' : ''}`, t(s.name), { tsgSite: s.key });
      b.setAttribute('aria-pressed', String(s.key === state.site));
      pick.append(b);
    }
    row.append(fig, pick);
    body.append(row);
    const site = TS_SITE_GUIDE.find(s => s.key === state.site);
    const card = el('div', 'tsg-card');
    card.dataset.siteCard = site.key;
    card.append(el('h5', '', `${t(site.name)}: ${t(site.where)}`), el('p', '', t(site.why)), sourceLine(site.sources));
    card.append(button('tsg-btn tsg-btn-3d', W.showSites3d, { siteShow: site.key }));
    body.append(card, el('p', 'tsg-cite', W.schematic));
  }

  function troubleTab(body) {
    const W = words();
    const list = el('div', 'tsg-trouble');
    TS_TROUBLE.forEach((item, i) => {
      const d = el('details', 'tsg-fold');
      if (i === 0) d.open = true;
      d.append(el('summary', '', t(item.problem)));
      const p = el('p', '');
      p.append(el('strong', '', `${W.action}: `), document.createTextNode(t(item.action)));
      d.append(p, sourceLine(item.sources));
      list.append(d);
    });
    body.append(list);
  }

  function complicationsTab(body) {
    const W = words();
    for (const c of TS_COMPLICATIONS) {
      const d = el('details', 'tsg-fold');
      d.dataset.complication = c.id;
      const summary = el('summary', '');
      summary.append(document.createTextNode(t(c.name)), el('span', 'tsg-tag', t(c.incidence)));
      d.append(summary);
      const dl = el('dl', 'tsg-facts');
      for (const key of ['mechanism', 'prevent', 'manage']) dl.append(el('dt', '', W[key]), el('dd', '', t(c[key])));
      d.append(dl, sourceLine(c.sources));
      body.append(d);
    }
  }

  function historyTab(body) {
    const list = el('ol', 'tsg-timeline');
    for (const h of TS_HISTORY) {
      const li = el('li');
      li.append(el('span', 'tsg-year', h.year), el('p', '', t(h.text)), sourceLine(h.sources));
      list.append(li);
    }
    body.append(list);
  }

  function quizTab(body) {
    const W = words();
    const { index, picks } = state.quiz;
    const score = picks.filter((p, i) => p === TS_QUIZ[i].answer).length;
    const head = el('p', 'tsg-counter', `${W.quizScore}: ${score}/${TS_QUIZ.length}`);
    head.dataset.quizScore = String(score);
    body.append(head);
    if (index >= TS_QUIZ.length) {
      body.append(button('tsg-btn', W.quizRetry, { quizRestart: '1' }));
      return;
    }
    const item = TS_QUIZ[index];
    const card = el('div', 'tsg-card');
    card.append(el('h5', '', `${index + 1}/${TS_QUIZ.length}. ${t(item.q)}`));
    const picked = picks[index];
    const opts = el('div', 'tsg-options');
    item.options.forEach((o, i) => {
      let cls = 'tsg-option';
      if (picked != null) cls += i === item.answer ? ' right' : i === picked ? ' wrong' : '';
      const b = button(cls, t(o), { quizPick: String(i) });
      b.disabled = picked != null;
      opts.append(b);
    });
    card.append(opts);
    if (picked != null) {
      const ok = picked === item.answer;
      const fb = el('p', `tsg-note ${ok ? 'safe' : 'warn'}`);
      fb.dataset.quizFeedback = ok ? 'right' : 'wrong';
      fb.append(el('strong', '', `${ok ? W.correct : W.wrong}. `), document.createTextNode(t(item.why)));
      card.append(fb, button('tsg-btn', `${W.next} ›`, { quizNext: '1' }));
    }
    body.append(card);
  }

  const TABS = { equipment: equipmentTab, steps: stepsTab, confirm: confirmTab, sites: sitesTab, trouble: troubleTab, complications: complicationsTab, history: historyTab, quiz: quizTab };
  const TAB_SOURCES = {
    equipment: unique(TS_EQUIPMENT.flatMap(p => p.sources)),
    steps: unique(TS_PROCEDURE.flatMap(p => p.sources)),
    confirm: ['ehra', 'earley', 'academy'],
    sites: unique(TS_SITE_GUIDE.flatMap(p => p.sources)),
    trouble: unique(TS_TROUBLE.flatMap(p => p.sources)),
    complications: unique(TS_COMPLICATIONS.flatMap(p => p.sources)),
    history: unique(TS_HISTORY.flatMap(p => p.sources)),
    quiz: ['ehra', 'pcr', 'earley']
  };

  function render() {
    const W = words();
    const focusKey = document.activeElement && root.contains(document.activeElement) ? focusSignature(document.activeElement) : null;
    live = {};
    root.replaceChildren();
    root.lang = lang();
    const head = el('header', 'tsg-head');
    head.append(el('p', 'tsg-kicker', W.kicker), el('h4', 'tsg-title', W.title), el('p', 'tsg-intro', W.intro));
    const tabs = el('div', 'tsg-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', W.tabs);
    for (const tab of TS_GUIDE_TABS) {
      const b = button(`tsg-tab${tab.id === state.tab ? ' on' : ''}`, t(tab.label), { tsgTab: tab.id });
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(tab.id === state.tab));
      tabs.append(b);
    }
    const body = el('div', 'tsg-body');
    body.setAttribute('role', 'tabpanel');
    body.dataset.tsgPanel = state.tab;
    TABS[state.tab](body);
    const refs = el('details', 'tsg-refs');
    refs.append(el('summary', '', W.sources));
    const ul = el('ul');
    for (const key of TAB_SOURCES[state.tab]) ul.append(el('li', '', TS_SOURCES[key].cite));
    refs.append(ul);
    root.append(head, tabs, body, refs);
    if (focusKey) root.querySelector(focusKey)?.focus();
  }

  function focusSignature(node) {
    for (const key of ['tsgTab', 'needlePos', 'tsgView', 'tsgSite', 'stepGo', 'stepMove', 'tsgSign', 'tsgPart', 'quizPick']) {
      if (node.dataset?.[key] != null) return `[data-${key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}="${node.dataset[key]}"]`;
    }
    if (node.dataset?.tsgHour != null) return '[data-tsg-hour]';
    if (node.dataset?.tsgPull != null) return '[data-tsg-pull]';
    return null;
  }

  function setStep(index) {
    state.step = Math.max(0, Math.min(TS_PROCEDURE.length - 1, index));
    state.pull = STAGE_VIEW[TS_PROCEDURE[state.step].stage][0];
    render();
  }

  root.addEventListener('click', e => {
    const target = e.target.closest('button, [data-tsg-part], [data-tsg-site]');
    if (target) handleAction(target);
    else {
      const clock = e.target.closest('[data-tsg-clock]');
      if (clock) {
        const box = clock.getBoundingClientRect();
        state.hour = hourAtPoint((e.clientX - box.left) / box.width * 160, (e.clientY - box.top) / box.height * 160);
        render();
      }
    }
  });
  root.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-tsg-part], [data-tsg-site]') && !e.target.closest('button')) {
      e.preventDefault();
      handleAction(e.target.closest('[data-tsg-part], [data-tsg-site]'));
    }
  });
  function handleAction(target) {
    const d = target.dataset;
    if (d.tsgTab) { state.tab = d.tsgTab; render(); }
    else if (d.tsgPart) { state.part = d.tsgPart; render(); }
    else if (d.needlePos) { state.needlePos = d.needlePos; render(); }
    else if (d.stepMove) setStep(state.step + Number(d.stepMove));
    else if (d.stepGo) setStep(Number(d.stepGo));
    else if (d.tsgView) { state.view = d.tsgView; render(); }
    else if (d.tsgLesson) onLessonStep(Number(d.tsgLesson));
    else if (d.siteShow) onShowSite(d.siteShow);
    else if (d.tsgSite) { state.site = d.tsgSite; render(); }
    else if (d.quizPick) { state.quiz.picks[state.quiz.index] = Number(d.quizPick); render(); }
    else if (d.quizNext) { state.quiz.index += 1; render(); }
    else if (d.quizRestart) { state.quiz = { index: 0, picks: [] }; render(); }
  }
  root.addEventListener('input', e => {
    if (e.target.dataset.tsgHour != null) { state.hour = Number(e.target.value); live.hour ? live.hour() : render(); }
    else if (e.target.dataset.tsgPull != null) { state.pull = Number(e.target.value); live.pull ? live.pull() : render(); }
  });
  root.addEventListener('change', e => {
    const id = e.target.dataset.tsgSign;
    if (!id) return;
    state.signs = e.target.checked ? unique([...state.signs, id]) : state.signs.filter(s => s !== id);
    render();
  });

  render();
  mount.hidden = true;
  return {
    setActive(on) { active = Boolean(on); mount.hidden = !active; if (active) render(); },
    setLanguage() { if (active) render(); },
    isActive: () => active,
    element: root
  };
}

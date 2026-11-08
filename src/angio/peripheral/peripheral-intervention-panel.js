// Endovascular procedure panel under the lesion picker: severity, QCA and the six steps
// (access and wire, pullback gradient, lesion preparation, balloon, stent, completion
// angiogram) driven by peripheral-intervention.js. The fluoroscopy canvas draws the
// devices from overlay(); onChange asks the host to redraw it.
import {
  PERI_BALLOONS, PERI_IVL_CYCLES, PERI_ORBITAL_CROWNS, PERI_PREP_DEVICES, PERI_SEVERITIES, PERI_STENTS, PERI_WIRES,
  advanceCatheter, advanceWire, balloonDiameter, balloonLumen, chooseAccess, chooseWire, createProcedure, deflate,
  deployStent, diameterOptions, lengthOptions, positionBalloon, procedureOverlay, pullback, qca, runCompletion,
  setBalloon, setPrep, setPressure, setStent, specFor, stentWarnings, treatLesion, uncoveredMm
} from './peripheral-intervention.js';
import { PERI_INTERVENTION_TEXT } from './peripheral-intervention-text.js';
import './peripheral-intervention.css';

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const opts = (list, current, label = (x) => x) => list.map((v) => `<option value="${esc(v)}"${String(v) === String(current) ? ' selected' : ''}>${esc(label(v))}</option>`).join('');
const OFFSET_RANGE = 40;

/** Aortic and distal pressure waveforms for the pullback (mmHg scale 0-160). */
function pressureSvg(gradient, t) {
  const wave = (peak) => Array.from({ length: 61 }, (_, i) => {
    const ph = (i % 30) / 30;
    const p = 75 + (peak - 75) * (ph < 0.35 ? Math.sin((ph / 0.35) * Math.PI / 2) : Math.max(0, 1 - (ph - 0.35) / 0.65) ** 1.4);
    return `${(i * 4).toFixed(0)},${(64 - (p / 160) * 60).toFixed(1)}`;
  }).join(' ');
  return `<svg class="peri-iv-pressure" viewBox="0 0 240 66" role="img" aria-label="${esc(t.aortic)} / ${esc(t.distal)}">
    <polyline points="${wave(130)}" class="peri-iv-wave-ao"/><polyline points="${wave(130 - gradient)}" class="peri-iv-wave-d"/>
    <text x="4" y="10" class="peri-iv-wave-ao-t">${esc(t.aortic)} 130</text><text x="236" y="10" text-anchor="end" class="peri-iv-wave-d-t">${esc(t.distal)} ${130 - gradient}</text></svg>`;
}

/**
 * @param {{ getLang: () => 'tr'|'en', onChange?: () => void, onInject?: () => void }} options
 */
export function createInterventionPanel({ getLang, onChange = () => {}, onInject = () => {} }) {
  const element = document.createElement('section');
  element.className = 'peri-lesion-box peri-iv';
  element.setAttribute('data-peri-iv', '');
  let lesion = null;
  let state = null;
  const t = () => PERI_INTERVENTION_TEXT[getLang() === 'en' ? 'en' : 'tr'];

  const update = (next, { full = true } = {}) => {
    if (!next || next === state) return;
    state = next;
    if (full) render(); else refresh();
    onChange();
  };

  function stepHtml(n, body, { locked, done }) {
    const tx = t();
    return `<li class="peri-iv-step" data-iv-step="${n}" data-state="${locked ? 'locked' : done ? 'done' : 'open'}">
      <h3 class="peri-iv-step-h"><b>${n}</b> ${esc(tx.steps[n - 1])}${done ? ' <span class="peri-iv-check" aria-hidden="true">✓</span>' : ''}</h3>
      <fieldset class="peri-iv-fields"${locked ? ' disabled' : ''}>${body}</fieldset></li>`;
  }

  function accessStep() {
    const tx = t();
    const { spec } = state;
    const rating = spec.access[state.access];
    const note = tx.accessNotes[state.lesionId]?.[state.access] || '';
    return `<label class="peri-iv-field"><span>${esc(tx.access)}</span>
        <select class="peri-select" data-iv="access">${opts(Object.keys(spec.access), state.access, (id) => `${tx.accessNames[id]} · ${tx.rating[spec.access[id]]}`)}</select></label>
      <p class="peri-iv-note" data-rating="${rating}">${esc(tx.rating[rating])}${note ? `: ${esc(note)}` : ''}</p>
      <label class="peri-iv-field"><span>${esc(tx.wire)}</span>
        <select class="peri-select" data-iv="wire">${opts(PERI_WIRES, state.wire, (w) => tx.wireNames[w])}</select></label>
      <button type="button" class="peri-iv-btn peri-iv-btn--go" data-iv-act="wire"${state.crossed ? ' disabled' : ''}>${esc(tx.advanceWire(state.wire))}</button>
      ${state.crossingFailed ? `<p class="peri-iv-alert">${esc(tx.log[state.crossingFailed === 'access' ? 'wireFailAccess' : 'wireFailSize']({ access: state.access, wire: state.wire }))}</p>` : ''}
      ${state.crossed ? `<p class="peri-iv-ok">${esc(tx.wireCrossed)}</p>` : ''}`;
  }

  function gradientStep() {
    const tx = t();
    const g = state.gradient;
    return `<p class="peri-iv-help">${esc(tx.gradientIntro)}</p>
      <div class="peri-iv-btnrow">
        <button type="button" class="peri-iv-btn" data-iv-act="catheter"${state.catheterBeyond ? ' disabled' : ''}>${esc(tx.advanceCatheter)}</button>
        <button type="button" class="peri-iv-btn" data-iv-act="pullback"${state.catheterBeyond ? '' : ' disabled'}>${esc(tx.pullbackBtn)}</button>
      </div>
      <button type="button" class="peri-iv-btn" data-iv-act="ntg"${state.catheterBeyond ? '' : ' disabled'}>${esc(tx.ntgBtn)}</button>
      ${g ? `${pressureSvg(g.gradient, tx)}<p class="peri-iv-readout" data-iv-gradient data-significant="${g.significant}">${esc(tx.gradientReadout(g))}</p>` : ''}
      <p class="peri-iv-help">${esc(tx.gradientRule)}</p>`;
  }

  function prepStep() {
    const tx = t();
    const { prep } = state;
    const param = prep.device === 'ivl'
      ? `<label class="peri-iv-field"><span>${esc(tx.cycles)}</span><select class="peri-select" data-iv="cycles">${opts(PERI_IVL_CYCLES, prep.cycles, tx.cycleOpt)}</select></label>`
      : prep.device === 'orbital'
        ? `<label class="peri-iv-field"><span>${esc(tx.crown)}</span><select class="peri-select" data-iv="crown">${opts(PERI_ORBITAL_CROWNS, prep.crown, (c) => `${c} mm`)}</select></label>`
        : '';
    const filter = ['orbital', 'directional'].includes(prep.device)
      ? `<label class="peri-iv-check-row"><input type="checkbox" data-iv="filter"${prep.filter ? ' checked' : ''}> ${esc(tx.filter)}</label>` : '';
    return `<label class="peri-iv-field"><span>${esc(tx.device)}</span><select class="peri-select" data-iv="device">${opts(PERI_PREP_DEVICES, prep.device, (d) => tx.prepNames[d])}</select></label>
      ${param}${filter}
      <button type="button" class="peri-iv-btn" data-iv-act="treat">${esc(tx.treat)}</button>
      <p class="peri-iv-help">${esc(tx.calciumNow(state.calcium))}</p>`;
  }

  function balloonStatus() {
    const tx = t();
    const b = state.balloon;
    if (!b.positioned) return tx.balloonIdle;
    if (b.pressure <= 0) return tx.balloonReady;
    return tx.balloonInflated(b.pressure, balloonDiameter(b, b.pressure), balloonLumen(state).waist);
  }

  function balloonStep() {
    const tx = t();
    const b = state.balloon;
    const spec = PERI_BALLOONS[b.type];
    const miss = uncoveredMm(state.spec, b.length, b.offset);
    return `<label class="peri-iv-field"><span>${esc(tx.balloon)}</span><select class="peri-select" data-iv="balloonType"${b.pressure > 0 ? ' disabled' : ''}>${opts(Object.keys(PERI_BALLOONS), b.type, (k) => tx.balloonNames[k])}</select></label>
      <p class="peri-iv-help">${esc(tx.balloonSpec(spec))}</p>
      <div class="peri-iv-pair">
        <label class="peri-iv-field"><span>${esc(tx.diameter)}</span><select class="peri-select" data-iv="balloonDiameter"${b.pressure > 0 ? ' disabled' : ''}>${opts(diameterOptions(state.spec), b.diameter)}</select></label>
        <label class="peri-iv-field"><span>${esc(tx.length)}</span><select class="peri-select" data-iv="balloonLength"${b.pressure > 0 ? ' disabled' : ''}>${opts(lengthOptions(state.spec), b.length)}</select></label>
      </div>
      <label class="peri-iv-range"><span>${esc(tx.position)}</span><input type="range" min="${-OFFSET_RANGE}" max="${OFFSET_RANGE}" step="5" value="${b.offset}" data-iv="balloonOffset"${b.pressure > 0 ? ' disabled' : ''}><output data-iv-out="balloonOffset">${b.offset} mm</output></label>
      <p class="peri-iv-alert" data-iv-miss="balloon"${miss > 0 ? '' : ' hidden'}>${esc(tx.miss(miss))}</p>
      <button type="button" class="peri-iv-btn" data-iv-act="positionBalloon"${b.pressure > 0 ? ' disabled' : ''}>${esc(tx.positionBalloon)}</button>
      <label class="peri-iv-range"><span>${esc(tx.pressure)}</span><input type="range" min="0" max="${spec.rbp}" step="1" value="${b.pressure}" data-iv="pressure"${b.positioned ? '' : ' disabled'}><output data-iv-out="pressure">${b.pressure} atm</output></label>
      <p class="peri-iv-status" data-iv-balloon-status>${esc(balloonStatus())}</p>
      <div class="peri-iv-btnrow peri-iv-btnrow--3">
        <button type="button" class="peri-iv-btn" data-iv-act="nominal"${b.positioned ? '' : ' disabled'}>${esc(tx.toNominal)}</button>
        <button type="button" class="peri-iv-btn" data-iv-act="rbp"${b.positioned ? '' : ' disabled'}>${esc(tx.toRbp)}</button>
        <button type="button" class="peri-iv-btn peri-iv-btn--warn" data-iv-act="deflate"${b.maxPressure > 0 ? '' : ' disabled'}>${esc(tx.deflateBtn)}</button>
      </div>`;
  }

  function stentStep() {
    const tx = t();
    const s = state.stent;
    const notes = stentWarnings(state);
    const fits = state.spec.stents.includes(s.type);
    return `<label class="peri-iv-field"><span>${esc(tx.stentType)}</span><select class="peri-select" data-iv="stentType"${s.deployed ? ' disabled' : ''}>${opts(PERI_STENTS, s.type, (k) => tx.stentNames[k])}</select></label>
      <div class="peri-iv-pair">
        <label class="peri-iv-field"><span>${esc(tx.diameter)}</span><select class="peri-select" data-iv="stentDiameter"${s.deployed ? ' disabled' : ''}>${opts(diameterOptions(state.spec), s.diameter)}</select></label>
        <label class="peri-iv-field"><span>${esc(tx.length)}</span><select class="peri-select" data-iv="stentLength"${s.deployed ? ' disabled' : ''}>${opts(lengthOptions(state.spec), s.length)}</select></label>
      </div>
      <label class="peri-iv-range"><span>${esc(tx.position)}</span><input type="range" min="${-OFFSET_RANGE}" max="${OFFSET_RANGE}" step="5" value="${s.offset}" data-iv="stentOffset"${s.deployed ? ' disabled' : ''}><output data-iv-out="stentOffset">${s.offset} mm</output></label>
      <ul class="peri-iv-notes" data-iv-stent-notes>${notes.map((n) => `<li>${esc(tx.notes[n])}</li>`).join('')}</ul>
      <button type="button" class="peri-iv-btn${fits ? '' : ' peri-iv-btn--warn'}" data-iv-act="stent"${s.deployed ? ' disabled' : ''}>${esc(tx.deployStent)}</button>
      ${s.deployed ? `<p class="peri-iv-ok">${esc(tx.stentDeployed)}</p>` : ''}`;
  }

  function completionStep() {
    const tx = t();
    const c = state.completion;
    const result = c
      ? `<div class="peri-iv-result" data-outcome="${c.outcome}" data-iv-outcome><strong>${esc(tx.outcome[c.outcome])}</strong>
          <p>${esc(tx.completionLine({ ...c, flow: tx.flow[c.flow] }))}</p>
          <ul>${c.feedback.map((f) => `<li>${esc(tx.feedback[f])}</li>`).join('')}</ul></div>`
      : '';
    return `<button type="button" class="peri-iv-btn peri-iv-btn--go" data-iv-act="completion">${esc(tx.runCompletion)}</button>${result}`;
  }

  function qcaHtml() {
    const tx = t();
    const q = qca(state);
    const level = q.pct >= 50 ? 'high' : q.pct >= 30 ? 'mid' : 'low';
    const box = (key, label, value) => `<div class="peri-iv-qbox" data-iv-qca="${key}"${key === 'ds' ? ` data-level="${level}"` : ''}><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
    return box('ref', tx.qca.ref, q.refMm.toFixed(1)) + box('mld', tx.qca.mld, q.mldMm.toFixed(1)) + box('ds', tx.qca.ds, `${q.pct}%`) + box('flow', tx.qca.flow, tx.flow[q.flow]);
  }

  function render() {
    const tx = t();
    if (!state) {
      element.innerHTML = `<h2 class="peri-subcard-title">${esc(tx.title)}</h2><p class="peri-iv-help">${esc(tx.pickLesion)}</p>`;
      return;
    }
    const treated = state.log.some((e) => e.code === 'balloonDeflated' || e.code === 'stentDeployed');
    const locked = !state.crossed;
    const sev = state.baselinePct;
    element.innerHTML = `<h2 class="peri-subcard-title">${esc(tx.title)}</h2>
      <p class="peri-iv-help">${esc(tx.intro)}</p>
      <div class="peri-iv-severity">
        <label class="peri-iv-range"><span>${esc(tx.severity)}</span><input type="range" min="30" max="100" step="1" value="${sev}" data-iv="severity"><output data-iv-out="severity">${sev >= 100 ? esc(tx.occluded) : `${sev}%`}</output></label>
        <div class="peri-iv-chips">${PERI_SEVERITIES.map((p) => `<button type="button" class="peri-iv-chip${p === sev ? ' is-on' : ''}" data-iv-sev="${p}">${p >= 100 ? esc(tx.occluded) : `${p}%`}</button>`).join('')}</div>
        <p class="peri-iv-help">${esc(tx.severityHelp)}</p>
      </div>
      <p class="peri-iv-meta">${esc(tx.lesionMeta(state.spec))}</p>
      <div class="peri-iv-qca" data-iv-qca-row>${qcaHtml()}</div>
      <ol class="peri-iv-steps">
        ${stepHtml(1, accessStep(), { locked: false, done: state.crossed })}
        ${stepHtml(2, gradientStep(), { locked, done: Boolean(state.gradient) })}
        ${stepHtml(3, prepStep(), { locked, done: state.prep.done.length > 0 })}
        ${stepHtml(4, balloonStep(), { locked, done: state.balloon.inflations > 0 })}
        ${stepHtml(5, stentStep(), { locked, done: Boolean(state.stent.deployed) })}
        ${stepHtml(6, completionStep(), { locked: locked || !treated, done: Boolean(state.completion) })}
      </ol>
      <div class="peri-iv-log">
        <div class="peri-iv-log-head"><h3>${esc(tx.logTitle)}</h3><button type="button" class="peri-iv-btn" data-iv-act="reset">${esc(tx.reset)}</button></div>
        <ol data-iv-log>${state.log.length ? state.log.map((e) => `<li><b>${e.step}</b> ${esc(tx.log[e.code](e.data))}</li>`).join('') : `<li class="peri-iv-empty">${esc(tx.logEmpty)}</li>`}</ol>
      </div>
      <p class="peri-iv-scope">${esc(tx.scope)}</p>`;
  }

  /** Light update while a slider moves (no rebuild, so the drag continues). */
  function refresh() {
    const tx = t();
    const set = (sel, text) => { const node = element.querySelector(sel); if (node) node.textContent = text; };
    set('[data-iv-out="pressure"]', `${state.balloon.pressure} atm`);
    set('[data-iv-out="balloonOffset"]', `${state.balloon.offset} mm`);
    set('[data-iv-out="stentOffset"]', `${state.stent.offset} mm`);
    set('[data-iv-balloon-status]', balloonStatus());
    const miss = uncoveredMm(state.spec, state.balloon.length, state.balloon.offset);
    const missEl = element.querySelector('[data-iv-miss="balloon"]');
    if (missEl) { missEl.hidden = miss <= 0; missEl.textContent = tx.miss(miss); }
    const notes = element.querySelector('[data-iv-stent-notes]');
    if (notes) notes.innerHTML = stentWarnings(state).map((n) => `<li>${esc(tx.notes[n])}</li>`).join('');
    const deflateBtn = element.querySelector('[data-iv-act="deflate"]');
    if (deflateBtn) deflateBtn.disabled = state.balloon.maxPressure <= 0;
  }

  const ACTIONS = {
    wire: () => advanceWire(state),
    catheter: () => advanceCatheter(state),
    pullback: () => pullback(state),
    ntg: () => pullback(state, { ntg: true }),
    treat: () => treatLesion(state),
    positionBalloon: () => positionBalloon(state),
    nominal: () => setPressure(state, PERI_BALLOONS[state.balloon.type].nominal),
    rbp: () => setPressure(state, PERI_BALLOONS[state.balloon.type].rbp),
    deflate: () => deflate(state),
    stent: () => deployStent(state),
    completion: () => runCompletion(state),
    reset: () => createProcedure(lesion, state.baselinePct)
  };

  element.addEventListener('click', (event) => {
    const sev = event.target.closest('[data-iv-sev]');
    if (sev && state) { update(createProcedure(lesion, Number(sev.dataset.ivSev))); return; }
    const btn = event.target.closest('[data-iv-act]');
    if (!btn || !state || btn.disabled) return;
    const act = btn.dataset.ivAct;
    const next = ACTIONS[act]?.();
    update(next);
    if (act === 'completion' && next?.completion) onInject();
  });

  const SELECTS = {
    access: (v) => chooseAccess(state, v),
    wire: (v) => chooseWire(state, v),
    device: (v) => setPrep(state, { device: v }),
    cycles: (v) => setPrep(state, { cycles: Number(v) }),
    crown: (v) => setPrep(state, { crown: Number(v) }),
    balloonType: (v) => setBalloon(state, { type: v }),
    balloonDiameter: (v) => setBalloon(state, { diameter: Number(v) }),
    balloonLength: (v) => setBalloon(state, { length: Number(v) }),
    stentType: (v) => setStent(state, { type: v, diameter: state.spec.refMm + (v === 'se' ? 1 : 0) }),
    stentDiameter: (v) => setStent(state, { diameter: Number(v) }),
    stentLength: (v) => setStent(state, { length: Number(v) })
  };
  const RANGES = {
    pressure: (v) => setPressure(state, v),
    balloonOffset: (v) => setBalloon(state, { offset: v }),
    stentOffset: (v) => setStent(state, { offset: v })
  };

  element.addEventListener('change', (event) => {
    const key = event.target.dataset?.iv;
    if (!key || !state) return;
    if (key === 'filter') { update(setPrep(state, { filter: event.target.checked })); return; }
    if (key === 'severity') { update(createProcedure(lesion, Number(event.target.value))); return; }
    if (SELECTS[key]) { update(SELECTS[key](event.target.value)); return; }
    if (RANGES[key]) render(); // drag ended: settle buttons and labels
  });

  element.addEventListener('input', (event) => {
    const key = event.target.dataset?.iv;
    if (!key || !state) return;
    if (key === 'severity') {
      const out = element.querySelector('[data-iv-out="severity"]');
      const v = Number(event.target.value);
      if (out) out.textContent = v >= 100 ? t().occluded : `${v}%`;
      return;
    }
    if (RANGES[key]) update(RANGES[key](Number(event.target.value)), { full: false });
  });

  return {
    element,
    /** Start a fresh procedure on a lesion (or clear for the no-lesion option). */
    setLesion(next) {
      lesion = next && specFor(next.id) ? next : null;
      state = lesion ? createProcedure(lesion, lesion.pct) : null;
      render();
    },
    render,
    getState: () => state,
    overlay: () => procedureOverlay(state),
    baselinePct: () => state?.baselinePct ?? null
  };
}

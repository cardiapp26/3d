import { PVI_VEINS, PVI_DOTS, pviRecording, burnedCount, isolated, allIsolated } from './pvi-model.js';

/*
 * Pulmonary vein isolation exercise panel (Treatment tab, case 'af-pvi').
 * The 3D side (pvi-lab.js, reached through getPvi) owns the lesion state;
 * this panel shows per-vein progress, moves the lasso between veins and
 * sends the synthetic strip (pvi-model.js) to the signal panel. Teaching
 * exercise with stated simplifications, not a procedure simulator.
 */

const TEXT = {
  tr: {
    heading: 'Pulmoner ven izolasyonu (etkileşimli)',
    intro: 'AF tetikleyicileri çoğunlukla pulmoner venlerden çıkar (R29). 3B görünümde her ven ağzının çevresindeki aday noktalara tıklayarak halkayı tamamlayın; Lasso kanalında ven potansiyellerinin kaybolması giriş bloğudur (R30, R31).',
    vein: 'Lasso veni', lesions: 'Lezyon', isolatedTag: 'izole', notIsolated: 'ileti var',
    show: 'Kaydı göster', reset: 'Sıfırla',
    strip: (name) => `PVİ: ${name}`,
    sinus: 'Dört halka tamam: bu kayıtta sinüs ritmi ve sessiz PV kanalı gösterilir.',
    limits: 'Sentetik öğretim egzersizi; halkalar şematiktir, lezyon seti veya enerji parametresi modellenmez. İzolasyonla AF\'nin sonlanması bu kurgunun sadeleştirmesidir: klinikte sonlanma garanti değildir ve geç rekonneksiyon nüksün başlıca nedenidir (R30). EP uzman incelemesi yapılmadı.'
  },
  en: {
    heading: 'Pulmonary vein isolation (interactive)',
    intro: 'AF triggers mostly arise from the pulmonary veins (R29). Click the candidate points around each vein ostium in the 3D view to complete the ring; loss of the vein potentials on the Lasso channel is entrance block (R30, R31).',
    vein: 'Lasso vein', lesions: 'Lesions', isolatedTag: 'isolated', notIsolated: 'conducting',
    show: 'Show recording', reset: 'Reset',
    strip: (name) => `PVI: ${name}`,
    sinus: 'All four rings complete: this recording shows sinus rhythm and a silent PV channel.',
    limits: 'Synthetic teaching exercise; the rings are schematic and no lesion set or energy parameter is modeled. AF ending with isolation is a simplification of this exercise: clinically termination is not guaranteed and late reconnection is the main cause of recurrence (R30). No electrophysiologist has reviewed it.'
  }
};

/**
 * @param {Document} doc
 * @param {{ getLang: () => string, onRecording: (recording: object|null) => void,
 *   getPvi: () => object|null }} deps
 */
export function createPviPanel(doc, { getLang, onRecording, getPvi }) {
  const el = (tag, cls, attrs = {}) => {
    const node = doc.createElement(tag);
    if (cls) node.className = cls;
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };
  const root = el('details', 'ep-pace ep-pvi', { 'data-ep-pvi': '' });
  root.open = true;
  const summary = el('summary', 'ep-pace-title');
  const intro = el('p', 'ep-pace-note');
  const table = el('table', 'ep-task-ledger', { 'data-ep-pvi-veins': '' });
  const actions = el('div', 'ep-pace-actions');
  const showBtn = el('button', 'ep-pace-deliver', { type: 'button', 'data-ep-pvi-action': 'show' });
  const resetBtn = el('button', 'ep-pace-retry', { type: 'button', 'data-ep-pvi-action': 'reset' });
  actions.append(showBtn, resetBtn);
  const sinusNote = el('p', 'ep-pace-grade', { 'aria-live': 'polite' });
  const limits = el('p', 'ep-pace-note ep-pace-limits');
  root.append(summary, intro, table, actions, sinusNote, limits);

  let vein = PVI_VEINS[0].id;
  let visible = false;
  let last = null;
  let unsubscribe = null;

  const lab = () => (typeof getPvi === 'function' ? getPvi() : null);
  const stateOf = () => lab()?.getState?.() || null;

  function send() {
    const state = stateOf();
    if (!state) return;
    last = pviRecording(state, vein);
    onRecording(last);
  }

  function subscribe() {
    const pvi = lab();
    if (!pvi || unsubscribe) return;
    unsubscribe = pvi.onChange(() => { render(); if (visible) send(); });
  }

  showBtn.addEventListener('click', () => { send(); render(); });
  resetBtn.addEventListener('click', () => { lab()?.reset?.(); });

  function render() {
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const t = TEXT[lang];
    summary.textContent = t.heading;
    intro.textContent = t.intro;
    showBtn.textContent = t.show;
    resetBtn.textContent = t.reset;
    limits.textContent = t.limits;
    const state = stateOf();
    const head = el('tr');
    for (const label of [t.vein, t.lesions, '']) { const th = el('th'); th.textContent = label; head.append(th); }
    const rows = PVI_VEINS.map((v) => {
      const tr = el('tr');
      const pick = el('td');
      const btn = el('button', 'ep-pace-retry', { type: 'button', 'data-ep-pvi-vein': v.id });
      btn.textContent = v.label[lang];
      btn.setAttribute('aria-pressed', String(v.id === vein));
      btn.addEventListener('click', () => { vein = v.id; send(); render(); });
      pick.append(btn);
      const count = el('td');
      count.textContent = state ? `${burnedCount(state, v.id)} / ${PVI_DOTS}` : `0 / ${PVI_DOTS}`;
      const status = el('td', 'ep-task-cell', { 'data-state': state && isolated(state, v.id) ? 'supports' : 'neutral' });
      status.textContent = state && isolated(state, v.id) ? t.isolatedTag : t.notIsolated;
      tr.append(pick, count, status);
      return tr;
    });
    table.replaceChildren(head, ...rows);
    sinusNote.hidden = !(state && allIsolated(state));
    if (!sinusNote.hidden) sinusNote.textContent = t.sinus;
  }

  render();
  return {
    element: root,
    render,
    supports: (caseId) => caseId === 'af-pvi',
    /** Called by the EP panel: shows the 3D rings while the case is open. */
    setVisible(flag) {
      const next = Boolean(flag);
      if (next === visible) return;
      visible = next;
      const pvi = lab();
      pvi?.setActive?.(visible);
      if (visible) { subscribe(); render(); send(); }
    },
    owns: (recording) => Boolean(recording) && recording === last,
    stripTitle(lang) {
      const t = TEXT[lang === 'en' ? 'en' : 'tr'];
      const name = PVI_VEINS.find((v) => v.id === vein)?.label[lang === 'en' ? 'en' : 'tr'] || '';
      return t.strip(name);
    },
    getVein: () => vein
  };
}

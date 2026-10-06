import { PVI_VEINS, PVI_DOTS, pviRecording, burnedCount, isolated, allIsolated } from './pvi-model.js';
import { createPviMap } from './pvi-map.js';

/*
 * Pulmonary vein isolation exercise panel (Treatment tab, case 'af-pvi').
 * The 2D lesion map (pvi-map.js) owns the lesion state; this panel shows
 * per-vein progress, moves the lasso between veins and sends the synthetic
 * strip (pvi-model.js) to the signal panel. Teaching exercise with stated
 * simplifications, not a procedure simulator.
 */

const TEXT = {
  tr: {
    heading: 'Pulmoner ven izolasyonu (etkileşimli)',
    intro: 'AF tetikleyicileri çoğunlukla pulmoner venlerden çıkar (R29). Şemada her ven ağzının çevresindeki aday noktalara tıklayarak halkayı tamamlayın; Lasso kanalında ven potansiyellerinin kaybolması giriş bloğudur (R30, R31).',
    vein: 'Lasso veni', lesions: 'Lezyon', isolatedTag: 'izole', notIsolated: 'ileti var',
    show: 'Kaydı göster', reset: 'Sıfırla',
    strip: (name) => `PVİ: ${name}`,
    sinus: 'Dört halka tamam: bu kayıtta sinüs ritmi ve sessiz PV kanalı gösterilir.',
    energyTitle: 'Enerji: RF, kriyo ve PFA',
    energy: 'RF ısı, kriyo soğuk ile lezyon oluşturur. PFA (Pulsed Field Ablation; darbeli alan ablasyonu), kısa elektrik darbeleriyle geri dönüşümsüz elektroporasyon oluşturur; esas mekanizma termal değildir. FARAPULSE klinik PVI sistemlerinden biridir. Enerji türünden bağımsız hedef PV elektriksel izolasyonudur; bu şema enerji uygulamasını simüle etmez.',
    pfaSafety: 'PFA doku seçiciliği, özofagus ve frenik sinir çevresindeki hasar riskini azaltabilir; sıfır risk anlamına gelmez. MANIFEST-17K kaydında özofagus komplikasyonu veya kalıcı frenik sinir hasarı bildirilmedi; geçici frenik hasar, koroner spazm ve hemolize bağlı böbrek hasarı bildirildi. Tamponad, vasküler komplikasyon ve inme gibi işlem riskleri devam eder. Kriyoda frenik pacing izlemi önemini korur; PFA izlemi cihaz ve protokole göre yapılır.',
    consensus: '2024 AF ablasyon uzlaşısı', pfaStudy: 'MANIFEST-17K: PFA güvenliği',
    limits: 'Halkalar şematiktir; lezyon seti veya enerji parametresi modellenmez. Giriş bloğu tek başına yetmeyebilir: ven içinden pacing ile çıkış bloğu da doğrulanır (R30, R31); bu egzersiz çıkış bloğunu modellemez. İzolasyonla AF\'nin sonlanması bu kurgunun sadeleştirmesidir: klinikte sonlanma garanti değildir ve geç rekonneksiyon nüksün başlıca nedenidir (R30).'
  },
  en: {
    heading: 'Pulmonary vein isolation (interactive)',
    intro: 'AF triggers mostly arise from the pulmonary veins (R29). Click the candidate points around each vein ostium on the map to complete the ring; loss of the vein potentials on the Lasso channel is entrance block (R30, R31).',
    vein: 'Lasso vein', lesions: 'Lesions', isolatedTag: 'isolated', notIsolated: 'conducting',
    show: 'Show recording', reset: 'Reset',
    strip: (name) => `PVI: ${name}`,
    sinus: 'All four rings complete: this recording shows sinus rhythm and a silent PV channel.',
    energyTitle: 'Energy: RF, cryo and PFA',
    energy: 'RF creates lesions with heat; cryo uses cold. PFA (Pulsed Field Ablation) uses short electrical pulses for irreversible electroporation; its principal mechanism is nonthermal. FARAPULSE is one clinical PVI system. The endpoint is electrical PV isolation regardless of energy; this diagram does not simulate energy delivery.',
    pfaSafety: 'PFA tissue selectivity may reduce collateral injury around the esophagus and phrenic nerve; it does not mean zero risk. MANIFEST-17K reported no esophageal complications or persistent phrenic injury, but transient phrenic injury, coronary spasm and hemolysis-related kidney injury occurred. Procedural risks such as tamponade, vascular complications and stroke remain. Phrenic pacing monitoring remains important during cryo; PFA monitoring follows the device and protocol.',
    consensus: '2024 AF ablation consensus', pfaStudy: 'MANIFEST-17K: PFA safety',
    limits: 'The rings are schematic; no lesion set or energy parameter is modeled. Entrance block alone may not suffice: exit block is also confirmed by pacing inside the vein (R30, R31); this exercise does not model exit block. AF ending with isolation is a simplification of this exercise: clinically termination is not guaranteed and late reconnection is the main cause of recurrence (R30).'
  }
};

/**
 * @param {Document} doc
 * @param {{ getLang: () => string, onRecording: (recording: object|null) => void }} deps
 */
export function createPviPanel(doc, { getLang, onRecording }) {
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
  const energy = el('details', 'ep-pace', { 'data-ep-pvi-energy': '' });
  const energyTitle = el('summary', 'ep-pace-title');
  const energyNote = el('p', 'ep-pace-note');
  const safetyNote = el('p', 'ep-pace-note');
  const sources = el('p', 'ep-pace-note');
  const consensus = el('a', '', { href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11000153/', target: '_blank', rel: 'noopener noreferrer' });
  const pfaStudy = el('a', '', { href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11271404/', target: '_blank', rel: 'noopener noreferrer' });
  const separator = el('span');
  separator.textContent = ' · ';
  sources.append(consensus, separator, pfaStudy);
  energy.append(energyTitle, energyNote, safetyNote, sources);
  const map = createPviMap(doc, { getLang });
  root.append(summary, intro, map.element, table, actions, sinusNote, energy, limits);

  let vein = PVI_VEINS[0].id;
  let visible = false;
  let last = null;

  function send() {
    last = pviRecording(map.getState(), vein);
    onRecording(last);
  }

  map.onChange(() => { render(); if (visible) send(); });
  showBtn.addEventListener('click', () => { send(); render(); });
  resetBtn.addEventListener('click', () => map.reset());

  function render() {
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const t = TEXT[lang];
    summary.textContent = t.heading;
    intro.textContent = t.intro;
    showBtn.textContent = t.show;
    resetBtn.textContent = t.reset;
    limits.textContent = t.limits;
    energyTitle.textContent = t.energyTitle;
    energyNote.textContent = t.energy;
    safetyNote.textContent = t.pfaSafety;
    consensus.textContent = t.consensus;
    pfaStudy.textContent = t.pfaStudy;
    map.render();
    const state = map.getState();
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
      count.textContent = `${burnedCount(state, v.id)} / ${PVI_DOTS}`;
      const status = el('td', 'ep-task-cell', { 'data-state': isolated(state, v.id) ? 'supports' : 'neutral' });
      status.textContent = isolated(state, v.id) ? t.isolatedTag : t.notIsolated;
      tr.append(pick, count, status);
      return tr;
    });
    table.replaceChildren(head, ...rows);
    sinusNote.hidden = !allIsolated(state);
    if (!sinusNote.hidden) sinusNote.textContent = t.sinus;
  }

  render();
  return {
    element: root,
    render,
    supports: (caseId) => caseId === 'af-pvi',
    /** Called by the EP panel: the map takes clicks while the case is open. */
    setVisible(flag) {
      const next = Boolean(flag);
      if (next === visible) return;
      visible = next;
      map.setActive(visible);
      if (visible) { render(); send(); }
    },
    map,
    owns: (recording) => Boolean(recording) && recording === last,
    stripTitle(lang) {
      const t = TEXT[lang === 'en' ? 'en' : 'tr'];
      const name = PVI_VEINS.find((v) => v.id === vein)?.label[lang === 'en' ? 'en' : 'tr'] || '';
      return t.strip(name);
    },
    getVein: () => vein
  };
}

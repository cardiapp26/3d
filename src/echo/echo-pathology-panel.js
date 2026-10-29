// Echo studio card: severe valve lesions (echo-valve-disease.js). Picks the lesion shown on the
// echo image (thickened valve, colour Doppler jet), draws the spectral Doppler in step with the
// beating heart, and lists the quantification with the severe criteria, teaching notes and the
// views to record it in.

import { VALVE_LESIONS, getLesion, evaluateLesion } from '../echo-valve-disease.js';
import { renderSpectralDoppler } from '../echo-doppler.js';
import { rrFraction } from '../echo-pathology-overlay.js';

const T = {
  tr: { color: 'Renkli Doppler', channel: 'Doppler', measure: 'Ölçümler (ciddi örnek)', views: 'Kaydedilecek görünümler', refs: 'Kaynaklar', window: 'Pencere', status: { severe: 'ciddi', moderate: 'orta', mild: 'hafif', normal: 'normal' }, note: 'Şematik öğretim modeli: değerler tipik ciddi bir hastadan alınmış örnektir; ölçümler gerçek kayıtta yapılır.' },
  en: { color: 'Colour Doppler', channel: 'Doppler', measure: 'Measurements (severe example)', views: 'Views to record', refs: 'References', window: 'Window', status: { severe: 'severe', moderate: 'moderate', mild: 'mild', normal: 'normal' }, note: 'Schematic teaching model: values are a typical severe example; measurements are taken on a real recording.' }
};
const CHANNEL_NAME = {
  cw: { tr: 'CW', en: 'CW' },
  'pw-lvot': { tr: 'PW LVOT', en: 'PW LVOT' },
  'pw-mitral': { tr: 'PW mitral giriş', en: 'PW mitral inflow' },
  'pw-pulm-vein': { tr: 'PW pulmoner ven', en: 'PW pulmonary vein' },
  'pw-desc-aorta': { tr: 'PW inen aort', en: 'PW descending aorta' }
};
// Studio views that record each lesion (echo-views.js ids; there is no A5C, A3C shows the LVOT).
const LESION_VIEWS = {
  normal: ['a4c', 'a3c', 'plax'],
  'as-severe': ['plax', 'a3c', 'psax-av'],
  'ar-severe': ['plax', 'a3c', 'psax-av'],
  'ms-severe': ['psax-mv', 'a4c', 'plax'],
  'mr-severe-primary': ['a4c', 'a2c', 'plax'],
  'mr-severe-secondary': ['a4c', 'a2c', 'a3c']
};
const VIEW_NAME = { a4c: 'A4C', a3c: 'A3C', a2c: 'A2C', plax: 'PLAX', 'psax-av': 'PSAX AV', 'psax-mv': 'PSAX MV' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * @param {HTMLElement} mount
 * @param {{ echo: object, heart: object, getLang: () => 'tr'|'en' }} deps
 */
export function createPathologyPanel(mount, { echo, heart, getLang }) {
  let lesionId = 'normal';
  let channel = 'cw';
  let color = false;
  let beat = 0, lastPhase = 0;
  let canvas = null;

  const channelsOf = (lesion) => ['cw', ...(lesion.doppler?.pw || [])];

  function render() {
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const t = T[lang];
    const lesion = getLesion(lesionId);
    if (!channelsOf(lesion).includes(channel)) channel = 'cw';
    const rows = evaluateLesion(lesionId).measurements || [];
    mount.innerHTML = `
      <div class="ep-lesions" role="group" aria-label="${lang === 'en' ? 'Valve lesion' : 'Kapak lezyonu'}">
        ${VALVE_LESIONS.map((l) => `<button type="button" class="ep-chip ${l.id === lesionId ? 'active' : ''}" data-ep-lesion="${l.id}" aria-pressed="${l.id === lesionId}">${esc(l.short[lang])}</button>`).join('')}
      </div>
      <p class="ep-title">${esc(lesion.label[lang])}</p>
      <div class="ep-row">
        <label class="ep-check"><input type="checkbox" data-ep-color ${color ? 'checked' : ''}> ${t.color}</label>
        <div class="ep-channels" role="group" aria-label="${t.channel}">
          ${channelsOf(lesion).map((c) => `<button type="button" class="ep-chip small ${c === channel ? 'active' : ''}" data-ep-channel="${c}" aria-pressed="${c === channel}">${esc(CHANNEL_NAME[c]?.[lang] || c)}</button>`).join('')}
        </div>
      </div>
      <canvas class="ep-doppler" data-ep-doppler role="img" aria-label="${esc(`${CHANNEL_NAME[channel]?.[lang] || channel} Doppler: ${lesion.short[lang]}`)}"></canvas>
      <p class="ep-window">${t.window}: ${esc(lesion.doppler?.window?.[lang] || '')}</p>
      <div class="ep-views">
        <span>${t.views}:</span>
        ${(LESION_VIEWS[lesionId] || []).map((v) => `<button type="button" class="ep-chip small" data-ep-view="${v}">${VIEW_NAME[v] || v}</button>`).join('')}
      </div>
      ${rows.length ? `<h4 class="ep-sub">${t.measure}</h4>
      <table class="ep-table"><tbody>
        ${rows.map((r) => `<tr><td>${esc(r.label[lang])}</td><td class="ep-val ${r.status}">${esc(r.value)} ${esc(r.unit || '')}</td><td class="ep-thr">${esc(r.threshold?.[lang] || '')}</td></tr>`).join('')}
      </tbody></table>` : ''}
      <p class="ep-teach">${esc(lesion.teaching?.[lang] || '')}</p>
      ${lesion.references?.length ? `<details class="ep-refs"><summary>${t.refs}</summary><ol>${lesion.references.map((r) => `<li>${esc(r)}</li>`).join('')}</ol></details>` : ''}
      <p class="ep-note">${t.note}</p>`;
    canvas = mount.querySelector('[data-ep-doppler]');
    mount.querySelectorAll('[data-ep-lesion]').forEach((b) => b.addEventListener('click', () => {
      lesionId = b.dataset.epLesion;
      // A lesion is easier to see with its jet: colour comes on with the first abnormal pick.
      if (lesionId !== 'normal' && !color) color = true;
      echo?.setPathology(lesionId, { color });
      render();
    }));
    mount.querySelector('[data-ep-color]')?.addEventListener('change', (e) => {
      color = e.target.checked;
      echo?.setPathology(lesionId, { color });
    });
    mount.querySelectorAll('[data-ep-channel]').forEach((b) => b.addEventListener('click', () => { channel = b.dataset.epChannel; render(); }));
    mount.querySelectorAll('[data-ep-view]').forEach((b) => b.addEventListener('click', () => echo?.selectView(b.dataset.epView)));
    draw(heart?.getCycleState?.());
  }

  /** Spectral Doppler with the sweep at the heart's current phase. */
  function draw(cycle) {
    if (!canvas || !canvas.isConnected) return;
    const lang = getLang() === 'en' ? 'en' : 'tr';
    const hr = cycle?.bpm || 72;
    const rr = rrFraction(cycle?.phase ?? 0.5);
    if (cycle && cycle.phase < lastPhase - 0.5) beat += 1;
    lastPhase = cycle?.phase ?? lastPhase;
    const beats = 60000 / hr > 1000 ? 2 : 3;
    // Screen starts 0.12 RR before the first QRS (echo-doppler.js timeline).
    const sweepFrac = cycle?.playing ? Math.min(1, ((beat % beats) + rr + 0.12) / beats) : 1;
    renderSpectralDoppler(canvas, { lesionId, channel, lang, hr, sweepFrac, calipers: true });
  }

  render();
  return {
    render,
    tick: (cycle) => draw(cycle),
    getLesion: () => lesionId
  };
}

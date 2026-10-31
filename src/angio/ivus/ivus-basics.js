/**
 * IVUS basics workspace: an interactive frame (ivus-basics-frame.js) read from inside out, a probe
 * that names the structure, its echo against the adventitia and its clock position, the A-line of
 * one beam and an image-formation sweep (rotating crystal or electronically switched elements),
 * then the two catheter systems, the grey-scale vocabulary and the examination workflow.
 */
import { FOV_MM, FRAME_SYSTEMS, buildFrame, paintBlood, structureAt, frameMeasures, outlineRadius, aLine, VESSEL_CENTRE, WIRE_POSITION } from './ivus-basics-frame.js';
import { BASICS_TEXT as T, BASICS_SYSTEMS, BASICS_PRESETS, STRUCTURES, STRUCTURE_NAMES, ECHO_CATEGORIES, ECHO_LABEL, READING_STEPS, SYSTEM_ROWS, WORKFLOW, BASICS_SOURCES } from './ivus-basics-data.js';

const BUFFER = 360;
const STEP_COLOR = '#22d3ee';
const pick = (o, lang) => o[lang === 'en' ? 'en' : 'tr'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hourText = (h, lang) => { const n = Math.round(h) % 12 || 12; return lang === 'en' ? `${n} ${pick(T.clockAt, lang)}` : `${pick(T.clockAt, lang)} ${n}`; };

export function basicsDefaults() {
  return { system: 'rotational-40', preset: 'normal', clock: true, sweep: false, step: -1, probe: null };
}

export function basicsWorkspaceHtml(state, lang) {
  const b = state.basics ||= basicsDefaults(), t = k => esc(pick(T[k], lang));
  const steps = READING_STEPS.map((s, i) => `<button type="button" data-basics-step="${i}" aria-pressed="${b.step === i}" ${s.rotationalOnly && b.system === 'phased-20' ? 'disabled' : ''}>${i + 1} · ${esc(pick(s.label, lang))}</button>`).join('');
  const systemsHead = lang === 'en' ? ['', 'Mechanical rotational', 'Phased array (solid state)'] : ['', 'Mekanik rotasyonel', 'Faz dizili (katı hal)'];
  return `
  <section class="ivus-basics" data-ivus-basics>
    <header class="ivus-basics-head"><span class="ivus-kicker">${t('kicker')}</span><p>${t('intro')}</p></header>
    <div class="ivus-basics-grid">
      <div class="ivus-basics-stage">
        <h3>${t('frameTitle')}</h3>
        <canvas class="ivus-basics-frame" data-basics-frame role="img" aria-label="${t('frameTitle')}"></canvas>
        <p class="ivus-basics-hint">${t('frameHint')}</p>
        <canvas class="ivus-basics-aline" data-basics-aline role="img" aria-label="${t('aline')}"></canvas>
      </div>
      <aside class="ivus-basics-side">
        <div class="ivus-basics-field"><span>${t('system')}</span><div class="ivus-basics-seg" role="group" aria-label="${t('system')}">${BASICS_SYSTEMS.map(s => `<button type="button" data-basics-system="${s.id}" aria-pressed="${b.system === s.id}">${esc(pick(s.label, lang))}</button>`).join('')}</div></div>
        <label class="ivus-basics-field"><span>${t('preset')}</span><select data-basics-preset>${BASICS_PRESETS.map(p => `<option value="${p.id}" ${b.preset === p.id ? 'selected' : ''}>${esc(pick(p.label, lang))}</option>`).join('')}</select></label>
        <div class="ivus-basics-toggles">
          <label><input type="checkbox" data-basics-clock ${b.clock ? 'checked' : ''}> ${t('clock')}</label>
          <label><input type="checkbox" data-basics-sweep ${b.sweep ? 'checked' : ''}> ${t('sweep')}</label>
        </div>
        <div class="ivus-basics-field"><span>${t('steps')}</span><div class="ivus-basics-steps">${steps}</div>
          <div class="ivus-basics-step-nav"><button type="button" data-basics-nav="-1">‹ ${t('prev')}</button><button type="button" data-basics-nav="1">${t('next')} ›</button><button type="button" data-basics-nav="0">${t('reset')}</button></div></div>
        <p class="ivus-basics-step-text" data-basics-step-text aria-live="polite"></p>
        <div class="ivus-basics-probe" data-basics-probe aria-live="polite"></div>
        <div class="ivus-basics-measures" data-basics-measures></div>
      </aside>
    </div>
    <section class="ivus-basics-block"><h3>${t('systemsTitle')}</h3>
      <div class="ivus-basics-catheters">${catheterSvg('rotational', lang)}${catheterSvg('phased', lang)}</div>
      <div class="ivus-basics-table-wrap"><table class="ivus-basics-table"><tr>${systemsHead.map(h => `<th>${h}</th>`).join('')}</tr>${SYSTEM_ROWS.map(r => `<tr>${r.map((c, i) => `<${i ? 'td' : 'th'}>${esc(pick(c, lang))}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</table></div>
    </section>
    <section class="ivus-basics-block"><h3>${t('grayTitle')}</h3><p class="ivus-basics-lead">${t('grayLead')}</p>
      <div class="ivus-basics-echoes">${ECHO_CATEGORIES.map(c => `<article data-basics-echo="${c.id}"><i style="background:${c.swatch}"></i><strong>${esc(pick(c.name, lang))}</strong><p>${esc(pick(c.text, lang))}</p></article>`).join('')}</div>
    </section>
    <section class="ivus-basics-block"><h3>${t('workflowTitle')}</h3>
      <ol class="ivus-basics-workflow">${WORKFLOW.map(w => `<li><strong>${esc(pick(w.title, lang))}</strong><span>${esc(pick(w.text, lang))}</span></li>`).join('')}</ol>
    </section>
    <footer class="ivus-basics-sources"><strong>${t('sources')}</strong><ul>${BASICS_SOURCES.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.text)} ↗</a></li>`).join('')}</ul></footer>
  </section>`;
}

/** Side view of the catheter tip: where the wire leaves relative to the transducer. */
function catheterSvg(kind, lang) {
  const rot = kind === 'rotational', tr = lang !== 'en';
  const title = rot ? (tr ? 'Rotasyonel: kısa monoray, tel transdüserin önünden çıkar' : 'Rotational: short monorail, the wire exits in front of the transducer')
    : (tr ? 'Faz dizili: uzun monoray, tel transdüserin arkasından çıkar' : 'Phased array: long monorail, the wire exits behind the transducer');
  const wireExit = rot ? 270 : 70, transducer = rot ? `<rect x="150" y="30" width="16" height="20" rx="3" class="cat-xdcr"/><path d="M60 40 H150" class="cat-shaft"/>`
    : Array.from({ length: 6 }, (_, i) => `<rect x="${150 + i * 6}" y="30" width="4" height="20" class="cat-xdcr"/>`).join('');
  return `<figure class="ivus-basics-cath" data-basics-catheter="${kind}"><svg viewBox="0 0 330 92" role="img" aria-label="${esc(title)}">
    <rect x="20" y="28" width="${rot ? 230 : 290}" height="24" rx="12" class="cat-body"/>
    ${rot ? '<rect x="250" y="31" width="60" height="18" rx="9" class="cat-tip"/>' : ''}
    ${transducer}
    <path d="M0 ${rot ? 72 : 40} ${rot ? 'C 120 72, 230 70, 270 49' : 'H 70'}" class="cat-wire"/>
    <path d="M${wireExit} ${rot ? 49 : 40} ${rot ? 'L 330 40' : 'H 330'}" class="cat-wire"/>
    <circle cx="${wireExit}" cy="${rot ? 49 : 40}" r="3" class="cat-exit"/>
    <text x="158" y="20" class="cat-label" text-anchor="middle">${tr ? 'transdüser' : 'transducer'}</text>
    <text x="${wireExit}" y="${rot ? 86 : 72}" class="cat-label" text-anchor="middle">${tr ? 'tel çıkışı' : 'wire exit'}</text>
  </svg><figcaption>${esc(title)}</figcaption></figure>`;
}

export function mountBasicsWorkspace(root, state, { getLang, rerender }) {
  const b = state.basics ||= basicsDefaults();
  const host = root.querySelector('[data-ivus-basics]');
  if (!host) return { dispose() {} };
  const lang = () => (getLang() === 'en' ? 'en' : 'tr');
  const frameCanvas = host.querySelector('[data-basics-frame]'), alineCanvas = host.querySelector('[data-basics-aline]');
  const buffer = document.createElement('canvas'); buffer.width = buffer.height = BUFFER;
  const bctx = buffer.getContext('2d');
  let frame = null, image = null, raf = null, disposed = false, beam = 0, sweepPhase = 0, lastTs = null;

  function rebuild() { frame = buildFrame(BUFFER, b); image = bctx.createImageData(BUFFER, BUFFER); image.data.set(frame.data); }
  function steps() { return READING_STEPS; }
  function setStep(i) {
    const list = steps(); let next = i;
    while (next >= 0 && next < list.length && list[next].rotationalOnly && b.system === 'phased-20') next += Math.sign(i - b.step) || 1;
    b.step = next >= 0 && next < list.length ? next : -1;
    host.querySelectorAll('[data-basics-step]').forEach(btn => btn.setAttribute('aria-pressed', String(Number(btn.dataset.basicsStep) === b.step)));
    stepText();
  }
  function stepText() {
    const el = host.querySelector('[data-basics-step-text]'); if (!el) return;
    if (b.step < 0) { el.textContent = ''; el.hidden = true; return; }
    const id = READING_STEPS[b.step].id;
    el.hidden = false; el.textContent = id === 'eel' ? pick(T.eelNote, lang()) : pick(STRUCTURES[id], lang());
  }
  function probeText() {
    const el = host.querySelector('[data-basics-probe]'); if (!el) return;
    const L = lang();
    if (!b.probe) { el.innerHTML = `<span>${esc(pick(T.probe, L))}</span><p>${esc(pick(T.probeEmpty, L))}</p>`; return; }
    const s = structureAt(b.probe.x, b.probe.y, b);
    const within = s.within === 'mixed' ? (L === 'en' ? ' · the plaque as a whole: mixed' : ' · plağın bütünü: karışık') : '';
    el.innerHTML = `<span>${esc(pick(T.probe, L))} · ${esc(hourText(s.clock, L))} · ${s.depthMm.toFixed(1)} mm</span><strong data-basics-probe-id="${s.id}">${esc(pick(STRUCTURE_NAMES[s.id], L))}</strong><em data-basics-probe-echo="${s.echo}">${esc(pick(ECHO_LABEL[s.echo], L))}${within}</em><p>${esc(pick(STRUCTURES[s.id], L))}</p>`;
  }
  function measures() {
    const el = host.querySelector('[data-basics-measures]'); if (!el) return;
    const m = frameMeasures(b.preset), L = lang(), row = (k, v) => `<div><span>${esc(pick(T[k], L))}</span><strong>${v}</strong></div>`;
    el.innerHTML = `<span class="ivus-basics-mtitle">${esc(pick(T.measures, L))}</span>${row('lumenArea', `${m.lumenArea.toFixed(1)} mm²`)}${row('eemArea', `${m.eemArea.toFixed(1)} mm²`)}${row('burden', `%${Math.round(m.burden * 100)}`)}${row('eelDiam', `${m.eelDiameter.toFixed(2)} mm`)}${row('midDiam', `${m.midMediaDiameter.toFixed(2)} mm`)}`;
  }

  /* ----- Drawing ----- */
  function fit(canvas) {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (w < 2 || h < 2) return null;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr)) canvas.width = Math.round(w * dpr);
    if (canvas.height !== Math.round(h * dpr)) canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return { ctx, w, h };
  }
  const toPx = (S, mm) => S / 2 + mm * (S / 2) / FOV_MM;
  function contour(ctx, S, kind) {
    ctx.beginPath();
    for (let k = 0; k <= 120; k++) {
      const h = (k / 120) * 12, a = (h / 12) * Math.PI * 2, r = outlineRadius(kind, b.preset, h);
      const x = toPx(S, VESSEL_CENTRE.x + r * Math.sin(a)), y = toPx(S, VESSEL_CENTRE.y - r * Math.cos(a));
      if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
  function drawStep(ctx, S) {
    if (b.step < 0) return;
    const id = READING_STEPS[b.step].id, sys = FRAME_SYSTEMS[b.system];
    ctx.save(); ctx.strokeStyle = STEP_COLOR; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    if (id === 'catheter') { ctx.beginPath(); ctx.arc(S / 2, S / 2, (sys.catheterR + sys.ringdown) * S / 2 / FOV_MM, 0, Math.PI * 2); ctx.stroke(); }
    else if (id === 'wire') { ctx.beginPath(); ctx.arc(toPx(S, WIRE_POSITION.x), toPx(S, WIRE_POSITION.y), 9, 0, Math.PI * 2); ctx.stroke(); }
    else if (id === 'lumen') { contour(ctx, S, 'lumen'); ctx.stroke(); }
    else if (id === 'intima') { contour(ctx, S, 'lumen'); ctx.stroke(); contour(ctx, S, 'iel'); ctx.stroke(); }
    else if (id === 'media') { contour(ctx, S, 'iel'); ctx.stroke(); contour(ctx, S, 'eel'); ctx.stroke(); }
    else if (id === 'adventitia') { contour(ctx, S, 'eel'); ctx.stroke(); contour(ctx, S, 'adventitia'); ctx.stroke(); }
    else if (id === 'eel') {
      ctx.setLineDash([]); contour(ctx, S, 'eel'); ctx.stroke();
      const r = outlineRadius('eel', b.preset, 3), y = toPx(S, VESSEL_CENTRE.y), x1 = toPx(S, VESSEL_CENTRE.x - r), x2 = toPx(S, VESSEL_CENTRE.x + r);
      ctx.strokeStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
      for (const x of [x1, x2]) { ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke(); }
      ctx.fillStyle = '#fbbf24'; ctx.font = '600 11px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillText(`${(2 * r).toFixed(2)} mm`, (x1 + x2) / 2, y - 8);
    }
    ctx.restore();
  }
  function drawClock(ctx, S) {
    ctx.save(); ctx.strokeStyle = 'rgba(148,163,184,.55)'; ctx.fillStyle = '#cbd5e1'; ctx.font = '600 11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let h = 1; h <= 12; h++) {
      const a = (h / 12) * Math.PI * 2, R = S / 2 - 4, major = h % 3 === 0;
      ctx.lineWidth = major ? 2 : 1; ctx.beginPath(); ctx.moveTo(S / 2 + (R - (major ? 10 : 6)) * Math.sin(a), S / 2 - (R - (major ? 10 : 6)) * Math.cos(a)); ctx.lineTo(S / 2 + R * Math.sin(a), S / 2 - R * Math.cos(a)); ctx.stroke();
      if (major) ctx.fillText(String(h), S / 2 + (R - 20) * Math.sin(a), S / 2 - (R - 20) * Math.cos(a));
    }
    ctx.restore();
  }
  function drawFrame(ts) {
    const f = fit(frameCanvas); if (!f || !frame) return;
    const { ctx, w } = f, S = w;
    image.data.set(frame.data); paintBlood(frame, image.data, ts / 1000); bctx.putImageData(image, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, S, S);
    ctx.save(); ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); ctx.clip(); ctx.imageSmoothingEnabled = true; ctx.drawImage(buffer, 0, 0, S, S); ctx.restore();
    if (b.sweep) {   // only the sector scanned so far in this revolution is shown
      const a0 = -Math.PI / 2, a1 = a0 + (beam / 12) * Math.PI * 2;
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.93)'; ctx.beginPath(); ctx.moveTo(S / 2, S / 2); ctx.arc(S / 2, S / 2, S / 2 + 1, a1, a0 + Math.PI * 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(S / 2, S / 2); ctx.lineTo(S / 2 + S / 2 * Math.cos(a1), S / 2 + S / 2 * Math.sin(a1)); ctx.stroke(); ctx.restore();
    }
    if (b.clock) drawClock(ctx, S);
    drawStep(ctx, S);
    if (b.probe) { const x = toPx(S, b.probe.x), y = toPx(S, b.probe.y); ctx.save(); ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.moveTo(x - 11, y); ctx.lineTo(x - 4, y); ctx.moveTo(x + 4, y); ctx.lineTo(x + 11, y); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = '#94a3b8'; ctx.font = '600 10px ui-monospace, monospace'; ctx.textAlign = 'left'; ctx.fillText(`${FRAME_SYSTEMS[b.system].freq} MHz`, 8, S - 8);
    ctx.textAlign = 'right'; ctx.fillText('1 mm', S - 8, S - 18); ctx.fillRect(S - 8 - S / 2 / FOV_MM, S - 12, S / 2 / FOV_MM, 2);
  }
  function drawAline() {
    const f = fit(alineCanvas); if (!f) return;
    const { ctx, w, h } = f, hour = b.sweep ? beam : b.probe ? structureAt(b.probe.x, b.probe.y, b).clock : 3, L = lang();
    const samples = aLine(hour, b, Math.max(80, Math.round(w - 50))), x0 = 40, x1 = w - 10, y0 = h - 22, y1 = 18;
    ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#94a3b8'; ctx.font = '600 10px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(`${pick(T.aline, L)} · ${hourText(hour, L)}`, x0, 12);
    ctx.strokeStyle = 'rgba(148,163,184,.25)'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
    ctx.textAlign = 'center'; for (let mm = 0; mm <= 4; mm++) ctx.fillText(String(mm), x0 + (mm / FOV_MM) * (x1 - x0), h - 8);
    ctx.textAlign = 'right'; ctx.fillText(pick(T.depth, L), x1, h - 8);
    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1.6; ctx.beginPath();
    samples.forEach((s, i) => { const x = x0 + (s.r / FOV_MM) * (x1 - x0), y = y0 - s.v * (y0 - y1); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.stroke();
    // Name each echo where it starts; labels closer than 56 px to the last one on the same row move to a second row or are skipped.
    let prev = null; const lastX = [-Infinity, -Infinity]; ctx.fillStyle = '#cbd5e1'; ctx.font = '9px system-ui, sans-serif'; ctx.textAlign = 'left';
    for (const s of samples) {
      if (s.id !== prev && ['wire', 'intima', 'fibrous', 'lipid', 'calcium', 'media', 'adventitia'].includes(s.id)) {
        const x = x0 + (s.r / FOV_MM) * (x1 - x0), row = x - lastX[0] >= 56 ? 0 : x - lastX[1] >= 56 ? 1 : -1;
        if (row >= 0) { ctx.fillText(pick(STRUCTURE_NAMES[s.id], L), x + 2, y1 + 10 + row * 11); lastX[row] = x; }
      }
      prev = s.id;
    }
  }
  function tick(ts) {
    raf = null; if (disposed) return;
    if (b.sweep && lastTs != null) {
      const sys = FRAME_SYSTEMS[b.system], element = 12 / 64;
      sweepPhase = (sweepPhase + ((ts - lastTs) / 1000) * 2) % 12;
      // Rotational: one crystal turns smoothly; phased array: 64 elements fire one after another.
      beam = sys.wire ? sweepPhase : Math.floor(sweepPhase / element) * element;
    }
    lastTs = ts;
    drawFrame(ts); drawAline();
    raf = requestAnimationFrame(tick);
  }

  /* ----- Events ----- */
  host.querySelectorAll('[data-basics-system]').forEach(btn => btn.addEventListener('click', () => { b.system = btn.dataset.basicsSystem; if (READING_STEPS[b.step]?.rotationalOnly && b.system === 'phased-20') b.step = -1; rerender(); }));
  host.querySelector('[data-basics-preset]')?.addEventListener('change', e => { b.preset = e.target.value; rebuild(); measures(); probeText(); });
  host.querySelector('[data-basics-clock]')?.addEventListener('change', e => { b.clock = e.target.checked; });
  host.querySelector('[data-basics-sweep]')?.addEventListener('change', e => { b.sweep = e.target.checked; beam = 0; sweepPhase = 0; });
  host.querySelectorAll('[data-basics-step]').forEach(btn => btn.addEventListener('click', () => setStep(Number(btn.dataset.basicsStep) === b.step ? -1 : Number(btn.dataset.basicsStep))));
  host.querySelectorAll('[data-basics-nav]').forEach(btn => btn.addEventListener('click', () => { const d = Number(btn.dataset.basicsNav); if (!d) { b.step = -1; b.probe = null; setStep(-1); probeText(); return; } setStep(Math.min(READING_STEPS.length - 1, Math.max(0, b.step + d))); }));
  frameCanvas.addEventListener('click', e => {
    const r = frameCanvas.getBoundingClientRect(), S = r.width, x = (e.clientX - r.left - S / 2) / (S / 2) * FOV_MM, y = (e.clientY - r.top - S / 2) / (S / 2) * FOV_MM;
    if (Math.hypot(x, y) > FOV_MM) return;
    b.probe = { x, y }; probeText();
  });

  rebuild(); stepText(); probeText(); measures();
  raf = requestAnimationFrame(tick);
  return {
    getState: () => ({ ...b, probeStructure: b.probe ? structureAt(b.probe.x, b.probe.y, b) : null }),
    dispose() { disposed = true; if (raf != null) cancelAnimationFrame(raf); raf = null; }
  };
}

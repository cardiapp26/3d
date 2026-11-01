import './visual-interaction.css';
const NS = 'http://www.w3.org/2000/svg';
export function createVisualInteraction({ container, lang }) {
  let language = lang;
  const controls = new Map(), ac = new AbortController();
  const t = (tr, en) => language === 'en' ? en : tr;
  function enhance(svg) {
    if (svg.matches('[aria-hidden="true"]') || !svg.viewBox.baseVal.width || controls.has(svg)) return;
    if (svg.matches('.laplace-svg')) svg.setAttribute('viewBox', '0 -60 480 380');
    const original = svg.getAttribute('viewBox').split(/\s+/).map(Number);
    let zoom = 1, offset = { x: 0, y: 0 }, drag = null;
    const bar = document.createElement('div'); bar.className = 'visual-tools';
    const hint = document.createElement('span');
    const buttons = ['minus', 'plus', 'reset'].map(key => { const button = document.createElement('button'); button.type = 'button'; button.dataset.visualAction = key; bar.append(button); return button; });
    bar.append(hint); svg.before(bar); svg.classList.add('visual-interactive');
    function view() {
      const [x, y, w, h] = original;
      svg.style.touchAction = zoom > 1 || specs.length ? 'none' : 'pan-y';
      svg.setAttribute('viewBox', `${x + w / 2 - w / zoom / 2 + offset.x} ${y + h / 2 - h / zoom / 2 + offset.y} ${w / zoom} ${h / zoom}`);
    }
    buttons[0].onclick = () => { zoom = Math.max(1, zoom / 1.35); if (zoom === 1) offset = { x: 0, y: 0 }; view(); };
    buttons[1].onclick = () => { zoom = Math.min(4, zoom * 1.35); view(); };
    buttons[2].onclick = () => { zoom = 1; offset = { x: 0, y: 0 }; view(); };
    const range = key => container.querySelector(key);
    const specs = svg.matches('.pathophys-pv-svg') ? [{ key: '[data-pv-slider=edv]', name: 'EDV', position: () => { const node = svg.querySelector('circle:not([data-visual-handle])'); const circles = [...svg.querySelectorAll('circle:not([data-visual-handle])')]; const last = circles.at(-1) || node; return last ? [+last.getAttribute('cx'), +last.getAttribute('cy')] : [250, 320]; }, scale: 280 / 470 }]
      : svg.matches('.starling-svg') ? [{ key: '[data-starling-edv]', name: 'EDV', position: () => [48 + (Number(range('[data-starling-edv]').value) - 50) / 200 * 412, 225 - Number(container.querySelector('[data-starling-sv]').textContent.match(/[\d.]+/)[0]) / 140 * 200], scale: 200 / 412 }]
      : svg.matches('.laplace-svg') ? [
        { key: '[data-laplace-slider=r]', name: 'r', position: () => [240 + Number(range('[data-laplace-slider=r]').value) * 26, 130], scale: 1 / 26 },
        { key: '[data-laplace-slider=h]', name: 'h', position: () => [240 + (Number(range('[data-laplace-slider=r]').value) + Number(range('[data-laplace-slider=h]').value)) * 26, 130], scale: 1 / 26 }
      ] : [];
    function apply(input, value) {
      const step = Number(input.step) || 1, min = Number(input.min);
      input.value = String(Math.max(min, Math.min(Number(input.max), min + Math.round((value - min) / step) * step)));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    function handles() {
      if (!specs.length) return;
      svg.setAttribute('role', 'group');
      specs.forEach((spec, index) => {
        const input = range(spec.key); if (!input) return;
        let circle = svg.querySelector(`[data-visual-handle="${index}"]`);
        if (!circle) {
          circle = document.createElementNS(NS, 'circle'); circle.dataset.visualHandle = index;
          circle.setAttribute('r', '11'); circle.setAttribute('tabindex', '0'); circle.setAttribute('role', 'slider');
          svg.append(circle);
        }
        const [x, y] = spec.position(); circle.setAttribute('cx', x); circle.setAttribute('cy', y);
        circle.setAttribute('aria-label', `${spec.name}: ${t('sürükleyin veya ok tuşlarını kullanın', 'drag or use arrow keys')}`);
        for (const key of ['min', 'max', 'now']) circle.setAttribute(`aria-value${key}`, key === 'now' ? input.value : input[key]);
        circle.setAttribute('aria-valuetext', `${spec.name} ${input.value}`);
      });
    }
    const point = event => { const p = new DOMPoint(event.clientX, event.clientY); return p.matrixTransform(svg.getScreenCTM().inverse()); };
    svg.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      const handle = event.target.closest('[data-visual-handle]');
      if (!handle && zoom === 1) return;
      event.preventDefault(); const p = point(event);
      const spec = handle ? specs[Number(handle.dataset.visualHandle)] : null;
      drag = { spec, start: p, value: spec ? Number(range(spec.key).value) : null, clientX: event.clientX, clientY: event.clientY, offset: { ...offset } };
      svg.setPointerCapture(event.pointerId);
    }, { signal: ac.signal });
    svg.addEventListener('pointermove', event => {
      if (!drag) return;
      if (drag.spec) { const p = point(event); apply(range(drag.spec.key), drag.value + (p.x - drag.start.x) * drag.spec.scale); handles(); }
      else { const rect = svg.getBoundingClientRect(); offset = { x: drag.offset.x - (event.clientX - drag.clientX) * original[2] / zoom / rect.width, y: drag.offset.y - (event.clientY - drag.clientY) * original[3] / zoom / rect.height }; view(); }
    }, { signal: ac.signal });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) svg.addEventListener(type, event => { if (event.type === 'pointerup' && drag?.spec) svg.querySelector(`[data-visual-handle="${specs.indexOf(drag.spec)}"]`)?.focus({ preventScroll: true }); drag = null; }, { signal: ac.signal });
    svg.addEventListener('keydown', event => {
      const target = event.target.closest('[data-visual-handle]'); if (!target) return;
      const input = range(specs[Number(target.dataset.visualHandle)].key);
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = target.dataset.visualHandle;
      apply(input, event.key === 'Home' ? Number(input.min) : event.key === 'End' ? Number(input.max) : Number(input.value) + (['ArrowRight', 'ArrowUp'].includes(event.key) ? 1 : -1) * (Number(input.step) || 1));
      handles(); svg.querySelector(`[data-visual-handle="${index}"]`)?.focus();
    }, { signal: ac.signal });
    function refresh() {
      const names = [t('Küçült', 'Zoom out'), t('Büyüt', 'Zoom in'), t('Görünümü sıfırla', 'Reset view')];
      buttons.forEach((button, i) => { button.textContent = ['−', '+', '↺'][i]; button.setAttribute('aria-label', names[i]); });
      hint.textContent = specs.length ? t('Halkalı noktaları sürükleyin · Ok tuşlarıyla hassas ayar', 'Drag ringed points · Arrow keys for fine adjustment') : t('Büyütün, sonra görseli sürükleyin', 'Zoom in, then drag the figure'); handles();
    }
    controls.set(svg, { refresh, handles }); refresh();
  }
  function scan() { container.querySelectorAll('svg').forEach(enhance); for (const [svg, control] of controls) { if (svg.isConnected) control.handles(); } }
  const observer = new MutationObserver(scan); observer.observe(container, { childList: true, subtree: true }); scan();
  return { updateLanguage(next) { language = next; controls.forEach(control => control.refresh()); }, destroy() { observer.disconnect(); ac.abort(); controls.forEach((_, svg) => svg.previousElementSibling?.classList.contains('visual-tools') && svg.previousElementSibling.remove()); } };
}

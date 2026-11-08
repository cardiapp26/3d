// Teaching diagram. Voltage is interpolated from the station's schematic
// keyframes. Particle counts and channel activity are qualitative.
const FRAMES = [
  { from: 0, to: 60, duration: 1200, phase: 4 },
  { from: 60, to: 65, duration: 1400, phase: 0, gates: ['na'] },
  { from: 65, to: 78, duration: 1050, phase: 1, gates: ['ito'] },
  { from: 78, to: 190, duration: 2200, phase: 2, gates: ['ca', 'k'] },
  { from: 190, to: 315, duration: 2100, phase: 3, gates: ['k'] },
  { from: 315, to: 500, duration: 2050, phase: 4 }
];

export const VENTRICULAR_PLAYBACK_MS = FRAMES.reduce((sum, frame) => sum + frame.duration, 0);

export function ventricularFrameAt(elapsed) {
  const clamped = Math.max(0, Math.min(elapsed, VENTRICULAR_PLAYBACK_MS));
  let offset = 0;
  const frame = FRAMES.find(({ duration }) => {
    if (clamped < offset + duration) return true;
    offset += duration;
    return false;
  }) ?? FRAMES.at(-1);
  const progress = clamped === VENTRICULAR_PLAYBACK_MS ? 1 : (clamped - offset) / frame.duration;
  return { ...frame, progress, time: frame.from + (frame.to - frame.from) * progress };
}

const CHANNELS = [
  { id: 'na', x: 151, label: 'Na⁺ · Iₙₐ', color: '#a13e18', light: '#ffdac0', ion: 'Na⁺', inward: true },
  { id: 'ito', x: 260, label: 'K⁺ · Iₜₒ', color: '#086961', light: '#a2e3d5', ion: 'K⁺' },
  { id: 'ca', x: 369, label: 'Ca²⁺ · I꜀ₐ,ʟ', color: '#633e9c', light: '#ddcef9', ion: 'Ca²⁺', inward: true },
  { id: 'k', x: 478, label: 'K⁺ · Iₖᵣ / Iₖₛ', color: '#086961', light: '#a2e3d5', ion: 'K⁺' }
];

const PHASE_COLORS = ['#a13e18', '#086961', '#633e9c', '#086961', '#415b69'];

const COPY = {
  tr: {
    title: 'Ventrikül miyositinde aksiyon potansiyeli',
    cell: 'VENTRİKÜL MİYOSİTİ', neighbor: 'Komşu hücre', patch: 'Sarkolemma',
    disc: 'Ara disk', nucleus: 'Çekirdek',
    outside: 'Hücre dışı', inside: 'Hücre içi', time: 'Zaman (ms)',
    phases: [
      ['Depolarizasyon', 'Hızlı Na⁺ girişi membran potansiyelini yükseltir.'],
      ['Erken repolarizasyon', 'Na⁺ kanalları inaktive olur. Geçici K⁺ çıkışı çentik oluşturur.'],
      ['Plato', 'L tipi Ca²⁺ girişi ile dışa K⁺ akımı yaklaşık dengededir.'],
      ['Repolarizasyon', 'Ca²⁺ akımı azalır. Dışa K⁺ akımı baskınlaşır.'],
      ['İstirahat', 'Iₖ₁ membran potansiyelini yaklaşık −90 mV’da kararlı tutar.']
    ],
    phase: 'Faz', note: 'Şematik iz · Yavaşlatılmış oynatma · İyon sayıları temsili'
  },
  en: {
    title: 'The ventricular myocyte action potential',
    cell: 'VENTRICULAR MYOCYTE', neighbor: 'Adjacent cell', patch: 'Sarcolemma',
    disc: 'Intercalated disc', nucleus: 'Nucleus',
    outside: 'Outside', inside: 'Inside', time: 'Time (ms)',
    phases: [
      ['Depolarization', 'Rapid Na⁺ influx raises the membrane potential.'],
      ['Early repolarization', 'Na⁺ channels inactivate. Transient K⁺ efflux creates a notch.'],
      ['Plateau', 'L-type Ca²⁺ influx and outward K⁺ current nearly balance.'],
      ['Repolarization', 'Ca²⁺ current falls. Outward K⁺ current predominates.'],
      ['Rest', 'Iₖ₁ stabilizes the membrane potential near −90 mV.']
    ],
    phase: 'Phase', note: 'Schematic trace · Slowed playback · Ion counts illustrative'
  }
};

// Longitudinal view of a branching myocyte joined end-to-end to its neighbors.
// Neighbor and main-cell outlines share the stepped edges of the intercalated discs.
const discs = [
  'M139 98 L136 106 H140 L138 118 H144 L142 130 H147 L146 139',
  'M470 68 L467 76 H472 L469 84 H475 L473 92',
  'M499 118 L497 125 H503 L501 133 H507 L505 143'
];
const neighbors = [
  'M20 91 C56 90 73 82 98 88 C117 92 126 96 139 98 L136 106 H140 L138 118 H144 L142 130 H147 L146 139 C123 133 108 135 84 140 C61 145 37 143 20 137 Z',
  'M470 68 C504 67 532 58 558 62 V85 C533 83 501 93 473 92 L475 84 H469 L472 76 H467 Z',
  'M499 118 C526 119 543 112 558 115 V139 C538 141 524 145 505 143 L507 133 H501 L503 125 H497 Z'
];
const cellPath = `M139 98 C172 87 197 85 228 88 C258 91 278 90 303 86
  C344 82 367 93 399 81 C426 70 449 66 470 68
  L467 76 H472 L469 84 H475 L473 92
  C454 90 434 96 420 103 C415 106 421 110 428 112 C453 119 477 115 499 118
  L497 125 H503 L501 133 H507 L505 143
  C473 146 449 143 429 137 C401 128 390 133 365 138
  C334 144 308 140 287 140 C264 140 251 147 223 147 C194 148 173 144 146 139
  L147 130 H142 L144 118 H138 L140 106 H136 Z`;

// The upper and lower myofibrils diverge into separate branches on the right.
const myofibrils = Array.from({ length: 14 }, (_, i) => {
  const y = 84 + i * 4.9;
  const tip = i < 7 ? 65 + i * 4.3 : 117 + (i - 7) * 4.7;
  return `<path d="M18 ${y + 3} C72 ${y - 5} 109 ${y + 6} 150 ${y + 3}
    C191 ${y - 4} 222 ${y + 2} 249 ${y + 1}
    C275 ${y + 1} 303 ${y - 4} 342 ${y - 2}
    C375 ${y - 1} 393 ${y - 2} 423 ${tip + 7}
    S510 ${tip + 3} 562 ${tip - 2}" opacity="${i % 3 === 0 ? '.48' : '.26'}"/>`;
}).join('');
const xAt = time => 62 + time / 500 * 474;
const yAt = voltage => 458 - (voltage + 100) / 140 * 125;
const ion = channel => `<g data-ion="${channel.id}">
  <circle r="9" fill="#fffefa" stroke="${channel.color}" stroke-width="1.35"/>
  <circle cx="-3.1" cy="-3.8" r="1.35" fill="${channel.light}"/>
  <text y="2.7" text-anchor="middle" font-size="7.8" font-weight="800" fill="${channel.color}">${channel.ion}</text>
</g>`;

let sceneSerial = 0;

export function drawVentricularScene(svg, lang, keyframes) {
  const t = COPY[lang];
  const prefix = `ventricular-scene-${++sceneSerial}`;
  const paint = name => `url(#${prefix}-${name})`;
  const curve = [[0, keyframes[0][1]], ...keyframes, [500, keyframes.at(-1)[1]]];
  const points = values => values.map(([ms, mv]) => `${xAt(ms)},${yAt(mv)}`).join(' ');
  svg.setAttribute('aria-label', t.title);
  svg.innerHTML = `
    <defs>
      <linearGradient id="${prefix}-paper" x2="0" y2="1">
        <stop stop-color="#fefdf9"/><stop offset="1" stop-color="#f1f3ef"/>
      </linearGradient>
      <linearGradient id="${prefix}-cell" x2="0" y2="1">
        <stop stop-color="#ab5360"/><stop offset=".3" stop-color="#de958b"/>
        <stop offset=".56" stop-color="#e7a092"/><stop offset=".79" stop-color="#bc696b"/>
        <stop offset="1" stop-color="#914e60"/>
      </linearGradient>
      <linearGradient id="${prefix}-neighbor" x2="0" y2="1">
        <stop stop-color="#c28e8d"/><stop offset=".45" stop-color="#e8b8ad"/><stop offset="1" stop-color="#ad787c"/>
      </linearGradient>
      <radialGradient id="${prefix}-sarcoplasm" cx=".48" cy=".46" r=".54">
        <stop stop-color="#f5ccae"/><stop offset=".58" stop-color="#efb8a4" stop-opacity=".88"/>
        <stop offset="1" stop-color="#e9a58f" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${prefix}-nucleus" cx=".42" cy=".39" r=".65">
        <stop stop-color="#aa7a93"/><stop offset=".7" stop-color="#82556e"/>
        <stop offset="1" stop-color="#604055"/>
      </radialGradient>
      <linearGradient id="${prefix}-outside" x2="0" y2="1">
        <stop stop-color="#f5fafc"/><stop offset="1" stop-color="#dcecf1"/>
      </linearGradient>
      <linearGradient id="${prefix}-inside" x2="0" y2="1">
        <stop stop-color="#f5e1da"/><stop offset="1" stop-color="#fcf3eb"/>
      </linearGradient>
      <radialGradient id="${prefix}-wave">
        <stop stop-color="#fff1b5"/><stop offset=".34" stop-color="#ffd078" stop-opacity=".9"/>
        <stop offset="1" stop-color="#ee831c" stop-opacity="0"/>
      </radialGradient>
      <pattern id="${prefix}-striations" width="8" height="105" patternUnits="userSpaceOnUse" y="54">
        <path d="M1 0 C.5 33 3.2 61 2.3 105" fill="none" stroke="#6e374b" stroke-width="1.5" opacity=".34"/>
        <path d="M4 0 C3.3 34 6.3 63 5.3 105" fill="none" stroke="#f9d4bb" stroke-width="2.2" opacity=".34"/>
      </pattern>
      <filter id="${prefix}-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency=".18 .38" numOctaves="2" seed="17"/>
        <feColorMatrix type="matrix" values="0 0 0 0 .34  0 0 0 0 .12  0 0 0 0 .21  .63 0 0 0 -.16"/>
      </filter>
      <pattern id="${prefix}-lipids" width="8" height="20" patternUnits="userSpaceOnUse" patternTransform="translate(24 236)">
        <path d="M2.8 4 L2.1 8 M4.7 4 L6 9 M2.8 16 L2.1 12 M4.7 16 L6 11" fill="none" stroke="#587d7a" stroke-width=".9"/>
        <circle cx="3.7" cy="2.8" r="2.1" fill="#edf7ef" stroke="#538079" stroke-width=".75"/>
        <circle cx="3.7" cy="17.2" r="2.1" fill="#edf7ef" stroke="#538079" stroke-width=".75"/>
      </pattern>
      <clipPath id="${prefix}-cells">
        <path d="${cellPath}"/>
        ${neighbors.map(path => `<path d="${path}"/>`).join('')}
      </clipPath>
      ${CHANNELS.map(({ id, light, color }) => `<linearGradient id="${prefix}-gate-${id}" x2=".7" y2="1">
        <stop stop-color="${light}"/><stop offset=".78" stop-color="${color}"/>
      </linearGradient>`).join('')}
    </defs>
    <rect x="1" y="1" width="578" height="551" rx="14" fill="${paint('paper')}" stroke="#d7dfd9"/>
    <g font-family="system-ui,sans-serif" fill="#182e39">
      <rect x="26" y="18" width="14" height="3" rx="1.5" fill="#af5641"/>
      <text x="47" y="23" font-size="10.5" letter-spacing="1.8" font-weight="800" fill="#435e67">${t.cell}</text>
      <text x="26" y="51" font-size="23.5" font-family="Georgia,serif" font-weight="700">${t.title}</text>

      ${neighbors.map(path => `<path d="${path}" fill="${paint('neighbor')}" stroke="#ad7d80" stroke-width=".9"/>`).join('')}
      <path d="${cellPath}" fill="${paint('cell')}" stroke="#985f69" stroke-width="1.05"/>
      <g clip-path="${paint('cells')}">
        <rect x="19" y="54" width="540" height="96" fill="#fff" filter="${paint('grain')}" opacity=".42"/>
        <g fill="none" stroke="#f8c9b1" stroke-width="1.55" stroke-linecap="round">${myofibrils}</g>
        <rect x="19" y="54" width="540" height="96" fill="${paint('striations')}"/>
        <path d="M149 99 C193 86 221 93 252 94 S301 84 342 89 S423 72 463 73
          M152 137 C193 144 221 149 253 142 S300 139 328 139 S391 125 418 134 S471 143 501 141"
          fill="none" stroke="#fce1ca" stroke-width="1.2" opacity=".53"/>
        <ellipse cx="291" cy="114" rx="43" ry="17" fill="${paint('sarcoplasm')}"/>
        <path d="M268 115 C270 109 278 106 290 106 C303 105 314 108 317 113
          C318 119 307 122 293 122 C279 123 268 120 268 115 Z"
          fill="${paint('nucleus')}" stroke="#79546a" stroke-width=".65"/>
        <path d="M275 115 Q281 111 289 111 M294 118 Q306 119 311 114" fill="none" stroke="#c9a2b2" opacity=".65"/>
        <circle cx="293" cy="114" r="1.65" fill="#674359"/>
        <ellipse cx="70" cy="115" rx="30" ry="13" fill="${paint('sarcoplasm')}" opacity=".73"/>
        <ellipse cx="70" cy="115" rx="18" ry="6.3" fill="${paint('nucleus')}" opacity=".74"/>
        <path data-cell-charge d="${cellPath}" fill="#ffba6d" opacity="0"/>
        <ellipse data-cell-pulse cy="114" cx="98" rx="29" ry="46" fill="${paint('wave')}" opacity="0"/>
      </g>
      ${discs.map(path => `<path d="${path}" fill="none" stroke="#754152" stroke-width="2.4" stroke-linejoin="round" opacity=".91"/>`).join('')}
      <path d="M129 77 L137 95 M290 77 L291 103" fill="none" stroke="#806571" stroke-width=".85"/>
      <text x="125" y="73" text-anchor="middle" font-size="10.5" font-weight="650" fill="#725463">${t.disc}</text>
      <text x="290" y="73" text-anchor="middle" font-size="10.5" font-weight="650" fill="#725463">${t.nucleus}</text>
      <path d="M159 148 L53 181 H548 L173 147 Z" fill="#aac0bb" opacity=".12"/>
      <path d="M159 148 L53 181 M173 147 L548 181" fill="none" stroke="#779b98" stroke-dasharray="3 4"/>
      <circle cx="166" cy="143" r="10.5" fill="none" stroke="#fdfcf5" stroke-width="3.7"/>
      <circle cx="166" cy="143" r="10.5" fill="none" stroke="#326a69" stroke-width="1.5"/>
      <text x="27" y="158" font-size="11" font-weight="650" fill="#435e67">${t.neighbor}</text>
      <text x="184" y="161" font-size="11" font-weight="750" fill="#326a69">${t.patch}</text>

      <rect x="22" y="181" width="536" height="119" rx="10" fill="${paint('outside')}"/>
      <path d="M22 246 H558 V290 Q558 300 548 300 H32 Q22 300 22 290 Z" fill="${paint('inside')}"/>
      <rect x="22" y="181" width="536" height="119" rx="10" fill="none" stroke="#c8d9d8"/>
      <rect x="24" y="237" width="532" height="18" fill="#bcd3cc"/>
      <rect x="24" y="236" width="532" height="20" fill="${paint('lipids')}"/>
      <text x="33" y="222" font-size="11" font-weight="750" fill="#435e67">${t.outside}</text>
      <text x="33" y="282" font-size="11" font-weight="750" fill="#694c4d">${t.inside}</text>
      ${CHANNELS.map(channel => {
        const { id, x, label, color, inward } = channel;
        return `
        <text x="${x}" y="202" text-anchor="middle" font-size="13" font-weight="800" fill="${color}">${label}</text>
        <g data-ap-gate="${id}" data-active="false" transform="translate(${x} 246)">
          <rect data-gate-light x="-25" y="-33" width="50" height="66" rx="22" fill="${channel.light}" opacity="0"/>
          <path d="M-6 -10 Q0 -5 6 -10 V10 Q0 5 -6 10 Z" fill="#f9f7ee"/>
          <path d="M-5 -14 C-18 -21 -21 -5 -17 0 C-21 8 -15 19 -7 16 C-2 13 -8 6 -7 0 C-8 -6 -2 -10 -5 -14 Z M5 -14 C18 -21 21 -5 17 0 C21 8 15 19 7 16 C2 13 8 6 7 0 C8 -6 2 -10 5 -14 Z"
                fill="${paint(`gate-${id}`)}" stroke="${color}" stroke-width="1.1"/>
          <path d="M-14 -10 Q-17 -6 -15 -2 M14 -10 Q17 -6 15 -2" fill="none" stroke="#fffdfa" stroke-width="1.15" stroke-linecap="round" opacity=".85"/>
          <path data-closed d="M-6 1 H6" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
          <path data-direction d="M32 ${inward ? -15 : 15} v${inward ? 30 : -30} m-4 ${inward ? -5 : 5} l4 ${inward ? 5 : -5} l4 ${inward ? -5 : 5}"
                fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
        </g>
        ${[0, 1, 2].map(() => ion(channel)).join('')}`;
      }).join('')}

      <rect x="22" y="310" width="536" height="178" rx="10" fill="#fcfdfb" stroke="#d6e0da"/>
      <text x="33" y="327" font-size="11.5" font-weight="800">Vₘ (mV)</text>
      <text x="541" y="327" text-anchor="end" font-size="11" font-weight="650" fill="#435e67">${t.time}</text>
      ${[30, 0, -40, -90].map(mv => `<path d="M62 ${yAt(mv)}H536" stroke="#dbe6e2" ${mv === 0 ? 'stroke-dasharray="3 4"' : ''}/>
        <text x="53" y="${yAt(mv) + 4}" text-anchor="end" font-size="11" fill="#435e67">${mv > 0 ? '+' : ''}${String(mv).replace('-', '−')}</text>`).join('')}
      ${[0, 100, 200, 300, 400, 500].map(ms => `<path d="M${xAt(ms)} 338V462" stroke="#e9efeb"/>
        <text x="${xAt(ms)}" y="475" text-anchor="middle" font-size="11" fill="#435e67">${ms}</text>`).join('')}
      <path d="M62 338 V458 H536" fill="none" stroke="#a9bcb5"/>
      <polyline points="${points(curve)}" fill="none" stroke="#bccdca" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
      <line data-ep-cursor y1="338" y2="458" stroke-dasharray="3 3" stroke-opacity=".63"/>
      <polyline data-ep-ink fill="none" stroke="#184858" stroke-width="3.25" stroke-linejoin="round" stroke-linecap="round"/>
      <circle data-tracer-halo r="9.5" opacity=".17"/>
      <circle data-ep-tracer r="5.25" stroke="#fffdfa" stroke-width="1.6"/>

      <rect x="22" y="495" width="536" height="51" rx="9" fill="#ffffff" stroke="#d6e0da"/>
      <circle data-phase-color cx="34" cy="508" r="3.6"/>
      <text data-ep-live-phase x="44" y="513" font-size="14.5" font-weight="800"></text>
      <rect data-voltage-bg x="470" y="498" width="81" height="20" rx="10" opacity=".11"/>
      <text data-ap-voltage x="510.5" y="512.5" text-anchor="middle" font-size="13" font-weight="800" style="font-variant-numeric:tabular-nums"></text>
      <text data-ap-explanation x="33" y="529" font-size="11.5"></text>
      <text x="33" y="541" font-size="9" fill="#435e67">${t.note}</text>
    </g>`;

  const find = selector => svg.querySelector(selector);
  const pulse = find('[data-cell-pulse]');
  const charge = find('[data-cell-charge]');
  const ink = find('[data-ep-ink]');
  const cursor = find('[data-ep-cursor]');
  const dot = find('[data-ep-tracer]');
  const halo = find('[data-tracer-halo]');
  const label = find('[data-ep-live-phase]');
  const voltage = find('[data-ap-voltage]');
  const explanation = find('[data-ap-explanation]');
  const phaseMarks = [dot, halo, find('[data-phase-color]'), find('[data-voltage-bg]'), voltage];
  const channels = CHANNELS.map(channel => {
    const gate = find(`[data-ap-gate="${channel.id}"]`);
    return {
      ...channel, gate, closed: gate.querySelector('[data-closed]'),
      arrow: gate.querySelector('[data-direction]'),
      light: gate.querySelector('[data-gate-light]'),
      ions: [...svg.querySelectorAll(`[data-ion="${channel.id}"]`)]
    };
  });

  return ({ time, phase, progress, gates = [] }, mv) => {
    const cx = xAt(time);
    const cy = yAt(mv);
    const color = PHASE_COLORS[phase];
    const potential = Math.round(mv);
    svg.dataset.phase = phase;
    voltage.textContent = `${potential > 0 ? '+' : ''}${String(potential).replace('-', '−')} mV`;
    label.textContent = `${t.phase} ${phase} · ${t.phases[phase][0]}`;
    explanation.textContent = t.phases[phase][1];
    ink.setAttribute('points', points([...curve.filter(([ms]) => ms < time), [time, mv]]));
    cursor.setAttribute('x1', cx);
    cursor.setAttribute('x2', cx);
    cursor.setAttribute('stroke', color);
    phaseMarks.forEach(mark => mark.setAttribute('fill', color));
    for (const marker of [dot, halo]) {
      marker.setAttribute('cx', cx);
      marker.setAttribute('cy', cy);
    }
    charge.setAttribute('opacity', Math.max(0, (mv + 90) / 120) * 0.21);

    const arriving = phase === 4 && time < 60 && progress > 0.58;
    pulse.setAttribute('opacity', arriving || phase === 0 ? '1' : '0');
    pulse.setAttribute('cx', phase === 0 ? 140 + 327 * progress : 48 + 92 * (progress - 0.58) / 0.42);

    for (const { id, x, inward, gate, closed, arrow, light, ions } of channels) {
      const active = gates.includes(id);
      gate.dataset.active = String(active);
      gate.setAttribute('opacity', active ? '1' : '.56');
      closed.setAttribute('opacity', active ? '0' : '1');
      arrow.setAttribute('opacity', active ? '1' : '0');
      light.setAttribute('opacity', active ? '.46' : '0');
      ions.forEach((node, i) => {
        const p = (progress * 1.65 + i / ions.length) % 1;
        const dx = active ? 0 : (i - 1) * 20;
        const y = active ? (inward ? 215 + 63 * p : 278 - 63 * p) : (inward ? 221 - i % 2 * 3 : 276 + i % 2 * 4);
        node.setAttribute('transform', `translate(${x + dx} ${y})`);
        node.setAttribute('opacity', active ? Math.min(1, p * 8, (1 - p) * 8) : '.66');
      });
    }
  };
}

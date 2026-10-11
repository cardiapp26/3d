// Lead Viewpoint Camera Studio ("The ECG changes with the viewing angle"):
// Interactive frontal-plane camera orbiting the anatomical heart across the
// six limb leads (I, II, III, aVR, aVL, aVF) and arbitrary viewing angles,
// plus simultaneous opposite-lead comparison (aVR vs II) and auto camera tour.

const NS = 'http://www.w3.org/2000/svg';

export const LIMB_CAMERAS = Object.freeze([
  {
    id: 'II',
    angle: 60,
    color: '#d9385a',
    pill: '#fbe2e7',
    station: [528, 502],
    viewpoint: {
      tr: 'Sol alt (apeks doğrultusu, +60°)',
      en: 'Inferior-left (along apex axis, +60°)'
    },
    summary: {
      tr: 'Kalbin ana depolarizasyon dalgası (+58°) doğrudan Derivasyon II kamerasına doğru ilerler: belirgin pozitif P, en yüksek R dalgası ve pozitif T oluşur.',
      en: 'The heart’s main depolarization wave (+58°) travels straight toward the Lead II camera: producing an upright P, the tallest R wave, and an upright T wave.'
    }
  },
  {
    id: 'aVF',
    angle: 90,
    color: '#cb7331',
    pill: '#faeadc',
    station: [360, 540],
    viewpoint: {
      tr: 'Tam alt / diyafragmatik yüz (+90°)',
      en: 'Direct inferior / diaphragmatic view (+90°)'
    },
    summary: {
      tr: 'İnferior kameradan bakıldığında aşağı yönlü ventrikül aktivasyonu kameraya yaklaşır; pozitif P, yüksek R ve pozitif T izlenir.',
      en: 'Viewing from directly below, inferiorly directed ventricular activation approaches the camera, yielding an upright P, tall R, and upright T.'
    }
  },
  {
    id: 'III',
    angle: 120,
    color: '#9c8228',
    pill: '#f5efd8',
    station: [192, 502],
    viewpoint: {
      tr: 'Sağ alt / inferior-sağ (+120°)',
      en: 'Inferior-right (+120°)'
    },
    summary: {
      tr: '+120° kamerası ana aksla (~+58°) dar-orta açı yapar; izdüşüm Derivasyon II’den daha küçüktür (Einthoven: III = II − I).',
      en: 'The +120° camera forms a wider angle with the ~+58° axis; its projection is smaller than Lead II (Einthoven: III = II − I).'
    }
  },
  {
    id: 'aVR',
    angle: -150,
    color: '#258b68',
    pill: '#dcf2ea',
    station: [132, 290],
    viewpoint: {
      tr: 'Sağ omuz / kalp tabanı (−150°)',
      en: 'Right shoulder / cardiac base (−150°)'
    },
    summary: {
      tr: 'Sağ üstten bakan kamera için atriyal ve ventriküler aktivasyon kameradan uzaklaşır: P, QRS ve T dalgalarının tamamı negatif (ters) yazdırılır.',
      en: 'From the upper-right shoulder, atrial and ventricular waves travel away from the camera: P, QRS, and T are all recorded as negative (inverted).'
    }
  },
  {
    id: 'aVL',
    angle: -30,
    color: '#437cb6',
    pill: '#dfeaf6',
    station: [588, 290],
    viewpoint: {
      tr: 'Sol üst / yüksek lateral (−30°)',
      en: 'Upper-left / high lateral (−30°)'
    },
    summary: {
      tr: '−30° kamerası, normal kalp aksına (~+58°) neredeyse diktir (~88° açı): dalga kameranın önünden yan geçer, bu yüzden QRS düşük genlikli/izoelektrik görünür.',
      en: 'The −30° camera is nearly perpendicular (~88°) to the normal ~+58° cardiac axis: the wave passes sideways across the lens, making the trace nearly flat/equiphasic.'
    }
  },
  {
    id: 'I',
    angle: 0,
    color: '#7856c7',
    pill: '#eae3f9',
    station: [614, 396],
    viewpoint: {
      tr: 'Sol yan / yatay eksen (0°)',
      en: 'Left lateral / horizontal axis (0°)'
    },
    summary: {
      tr: 'Sol yandan (0°) bakan kameraya sola yönelen aktivasyon bileşeni yaklaşır; pozitif P, orta-yüksek R ve pozitif T dalgası kaydedilir.',
      en: 'Viewing from the patient’s left (0°), the leftward component of activation approaches the lens, recording an upright P, moderate R, and upright T.'
    }
  }
]);

// Tour sequence mirroring the pedagogical flow of the Reel:
// II -> aVR -> Compare (aVR vs II) -> II -> aVF -> III -> aVR -> aVL -> I -> Compare (aVR vs II)
const TOUR_STEPS = Object.freeze([
  { mode: 'single', lead: 'II', duration: 1500 },
  { mode: 'single', lead: 'aVR', duration: 1500 },
  { mode: 'compare', lead: 'II', duration: 1900 },
  { mode: 'single', lead: 'II', duration: 1300 },
  { mode: 'single', lead: 'aVF', duration: 1300 },
  { mode: 'single', lead: 'III', duration: 1300 },
  { mode: 'single', lead: 'aVR', duration: 1300 },
  { mode: 'single', lead: 'aVL', duration: 1400 },
  { mode: 'single', lead: 'I', duration: 1400 },
  { mode: 'compare', lead: 'II', duration: 2000 }
]);

// Instantaneous 2D cardiac dipole components [uCenter, uWidth, angleDeg, amplitudeMv].
// Because every lead projects the same 2D dipole vector D(u) onto (cos θ, sin θ),
// Einthoven's law (I + III = II) and Goldberger's sum (aVR + aVL + aVF = 0) hold identically.
const DIPOLE_COMPONENTS = Object.freeze([
  [0.245, 0.040, 58, 0.17],   // P wave (atrial depolarization)
  [0.392, 0.010, 162, 0.22],  // Q / initial septal depolarization
  [0.420, 0.015, 58, 1.44],   // R / main apical & LV depolarization
  [0.448, 0.013, -115, 0.36], // S / terminal basal depolarization
  [0.655, 0.068, 54, 0.36],   // T wave main repolarization
  [0.688, 0.045, 54, 0.12]    // T wave slight asymmetry
]);

export function cameraDipoleAt(u) {
  let dx = 0;
  let dy = 0;
  for (const [c, w, deg, amp] of DIPOLE_COMPONENTS) {
    const g = amp * Math.exp(-(((u - c) / w) ** 2));
    const rad = (deg * Math.PI) / 180;
    dx += g * Math.cos(rad);
    dy += g * Math.sin(rad);
  }
  return { dx, dy };
}

export function cameraWaveSample(u, angleDeg) {
  const { dx, dy } = cameraDipoleAt(u);
  const rad = (angleDeg * Math.PI) / 180;
  return dx * Math.cos(rad) + dy * Math.sin(rad);
}

export function cameraWavePath(angleDeg, x0, baseY, width, scale = 54, samples = 180) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const x = x0 + u * width;
    const y = baseY - cameraWaveSample(u, angleDeg) * scale;
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

export function nearestLimbCamera(angleDeg, toleranceDeg = 12) {
  const norm = ((angleDeg + 540) % 360) - 180;
  let best = null;
  let bestDiff = Infinity;
  for (const cam of LIMB_CAMERAS) {
    const diff = Math.abs(((norm - cam.angle + 540) % 360) - 180);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = cam;
    }
  }
  return bestDiff <= toleranceDeg ? best : null;
}

const svg = (tag, attrs = {}, text) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (text !== undefined) node.textContent = text;
  return node;
};

const fmtDeg = deg => {
  const rounded = Math.round(deg);
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded)}°`;
};

const shortestDelta = (fromDeg, toDeg) => ((toDeg - fromDeg + 540) % 360) - 180;

export function createLeadCameraLab({ mount, getLang = () => 'tr', state = {}, onAngleChange }) {
  if (state.lead === undefined) state.lead = 'II';
  if (state.angle === undefined) state.angle = 60;
  if (state.mode === undefined) state.mode = 'single'; // 'single' | 'compare'
  if (state.showVector === undefined) state.showVector = true;
  if (state.touring === undefined) state.touring = false;

  let displayAngle = state.angle;
  let rafId = null;
  let tourIndex = 0;
  let tourElapsed = 0;
  let lastTs = null;
  let dragging = false;

  const root = document.createElement('section');
  root.className = 'lcam';
  root.dataset.lcam = 'studio';
  mount.append(root);

  const CX = 360;
  const CY = 398;
  const ORBIT_R = 104;

  function lang() {
    return getLang() === 'en' ? 'en' : 'tr';
  }
  function tr(trText, enText) {
    return lang() === 'en' ? enText : trText;
  }

  function activeCameraMeta() {
    const matched = LIMB_CAMERAS.find(c => c.id === state.lead) || nearestLimbCamera(state.angle, 180);
    const exact = nearestLimbCamera(state.angle, 8);
    return {
      matched,
      exact,
      color: exact ? exact.color : '#2b6cb0',
      label: exact ? exact.id : `${tr('Açı', 'Angle')} ${fmtDeg(state.angle)}`
    };
  }

  function drawAnatomicalHeart(parent) {
    const g = svg('g', { class: 'lcam-heart-group', transform: `translate(${CX},${CY})` });
    // Soft anatomical drop shadow
    g.append(svg('ellipse', { cx: 2, cy: 52, rx: 46, ry: 10, fill: 'rgba(25,52,65,0.09)' }));
    // Superior Vena Cava & Right pulmonary branch (blue-slate venous vessels)
    g.append(
      svg('path', {
        d: 'M-26,-56 C-26,-38 -25,-24 -22,-14 L-10,-14 C-11,-26 -11,-40 -10,-56 Z',
        fill: '#89acc8',
        stroke: '#5b7d99',
        'stroke-width': 1.4
      }),
      // Aortic arch with three brachiocephalic/carotid/subclavian stumps
      svg('path', {
        d: 'M-8,-18 C-10,-48 14,-58 26,-34 C20,-34 15,-30 12,-16 Z',
        fill: '#b56e65',
        stroke: '#874c45',
        'stroke-width': 1.5
      }),
      svg('path', {
        d: 'M-2,-52 V-63 M6,-54 V-65 M14,-50 V-61',
        fill: 'none',
        stroke: '#874c45',
        'stroke-width': 4.2,
        'stroke-linecap': 'round'
      }),
      // Pulmonary trunk & left pulmonary artery
      svg('path', {
        d: 'M-6,-14 C-6,-34 12,-38 34,-34 L34,-23 C16,-25 5,-21 4,-10 Z',
        fill: '#8eaec9',
        stroke: '#5b7d99',
        'stroke-width': 1.4
      }),
      // Right Atrium (patient right = viewer left)
      svg('path', {
        d: 'M-22,-18 C-40,-14 -44,8 -30,22 C-20,26 -12,18 -10,2 Z',
        fill: '#d99185',
        stroke: '#9e5c53',
        'stroke-width': 1.4
      }),
      // Left Auricle / Left Atrium peeking on viewer right
      svg('path', {
        d: 'M18,-18 C32,-18 38,-6 32,8 C24,10 16,4 14,-6 Z',
        fill: '#df9589',
        stroke: '#9e5c53',
        'stroke-width': 1.4
      }),
      // Main Ventricular Cone (RV + LV with apex pointing down-right toward +60°)
      svg('path', {
        d: 'M-28,12 C-34,36 -16,58 18,66 C32,69 40,61 38,45 C37,24 32,2 20,-10 C6,-14 -14,-8 -28,12 Z',
        fill: '#efb0a3',
        stroke: '#a8645b',
        'stroke-width': 1.6
      }),
      // Myocardial shading on LV free wall & RV contour
      svg('path', {
        d: 'M4,-8 C12,14 20,38 24,63 C33,62 37,54 36,40 C35,20 29,2 18,-8 Z',
        fill: '#e39688',
        opacity: 0.72
      }),
      // Anterior interventricular sulcus (coronary groove hint)
      svg('path', {
        d: 'M0,-8 C6,14 14,38 20,62',
        fill: 'none',
        stroke: '#c4756a',
        'stroke-width': 1.5,
        'stroke-linecap': 'round',
        opacity: 0.75
      })
    );

    // Optional mean electrical axis vector arrow (+58° from center toward apex)
    const vecGroup = svg('g', { class: 'lcam-heart-vector' });
    const rad = (58 * Math.PI) / 180;
    const vx = Math.cos(rad) * 44;
    const vy = Math.sin(rad) * 44;
    vecGroup.append(
      svg('line', {
        x1: -vx * 0.35,
        y1: -vy * 0.35,
        x2: vx,
        y2: vy,
        stroke: '#b91c1c',
        'stroke-width': 2.8,
        'stroke-linecap': 'round',
        'stroke-dasharray': '4 3'
      }),
      svg('polygon', {
        points: `${vx + 5 * Math.cos(rad)},${vy + 5 * Math.sin(rad)} ${vx - 7 * Math.cos(rad) + 4.5 * Math.sin(rad)},${vy - 7 * Math.sin(rad) - 4.5 * Math.cos(rad)} ${vx - 7 * Math.cos(rad) - 4.5 * Math.sin(rad)},${vy - 7 * Math.sin(rad) + 4.5 * Math.cos(rad)}`,
        fill: '#b91c1c'
      })
    );
    g.append(vecGroup);
    parent.append(g);
    return vecGroup;
  }

  function createCameraNode(parent) {
    const group = svg('g', { class: 'lcam-camera-rig' });
    const beam = svg('polygon', { class: 'lcam-camera-beam' });
    const icon = svg('g', { class: 'lcam-camera-icon' });
    // In local coordinates of `icon`, (0,0) is on the orbit ring and the heart center is toward (-ORBIT_R, 0).
    // Lens barrel pointing inward toward the heart (-X direction):
    const barrel = svg('rect', { x: -18, y: -8, width: 10, height: 16, rx: 2, class: 'lcam-cam-barrel' });
    // Camera body:
    const body = svg('rect', { x: -9, y: -14, width: 28, height: 28, rx: 5, class: 'lcam-cam-body', fill: '#ffffff', 'stroke-width': 2.6 });
    // Camera inner lens circle:
    const lens = svg('circle', { cx: 5, cy: 0, r: 5.5, fill: 'none', class: 'lcam-cam-lens', 'stroke-width': 2.2 });
    const plus = svg('text', { x: 0, y: 0, class: 'lcam-cam-plus', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, '+');
    icon.append(barrel, body, lens);
    group.append(beam, icon, plus);
    parent.append(group);
    return { group, beam, icon, barrel, body, lens, plus };
  }

  function positionCameraNode(camNode, angleDeg, color) {
    const rad = (angleDeg * Math.PI) / 180;
    const camX = CX + ORBIT_R * Math.cos(rad);
    const camY = CY + ORBIT_R * Math.sin(rad);
    // Lens tip is slightly inside the orbit toward the heart
    const lensX = CX + (ORBIT_R - 16) * Math.cos(rad);
    const lensY = CY + (ORBIT_R - 16) * Math.sin(rad);
    // Beam spreads onto the heart around (CX, CY)
    const perpX = -Math.sin(rad);
    const perpY = Math.cos(rad);
    const targetX = CX + 14 * Math.cos(rad);
    const targetY = CY + 14 * Math.sin(rad);
    const spread = 34;
    camNode.beam.setAttribute(
      'points',
      `${lensX.toFixed(1)},${lensY.toFixed(1)} ${(targetX + perpX * spread).toFixed(1)},${(targetY + perpY * spread).toFixed(1)} ${(targetX - perpX * spread).toFixed(1)},${(targetY - perpY * spread).toFixed(1)}`
    );
    camNode.beam.setAttribute('fill', color);
    camNode.icon.setAttribute('transform', `translate(${camX.toFixed(1)},${camY.toFixed(1)}) rotate(${angleDeg.toFixed(1)})`);
    camNode.barrel.setAttribute('fill', color);
    camNode.body.setAttribute('stroke', color);
    camNode.lens.setAttribute('stroke', color);
    // Place the '+' badge just tangential to the camera body so it stays upright and legible
    const plusX = camX + 24 * perpX + 4 * Math.cos(rad);
    const plusY = camY + 24 * perpY + 4 * Math.sin(rad);
    camNode.plus.setAttribute('x', plusX.toFixed(1));
    camNode.plus.setAttribute('y', plusY.toFixed(1));
    camNode.plus.setAttribute('fill', color);
  }

  function buildMarkup() {
    root.innerHTML = `
      <div class="lcam-head">
        <div>
          <span class="lcam-eyebrow" data-lcam-eyebrow></span>
          <h3 class="lcam-title" data-lcam-title></h3>
          <p class="lcam-sub" data-lcam-sub></p>
        </div>
        <div class="lcam-actions">
          <button type="button" class="lcam-btn lcam-btn-tour" data-lcam-action="tour"></button>
          <button type="button" class="lcam-btn lcam-btn-compare" data-lcam-action="compare"></button>
          <button type="button" class="lcam-btn lcam-btn-vector" data-lcam-action="vector"></button>
        </div>
      </div>

      <div class="lcam-controls">
        <div class="lcam-lead-pills" role="group" data-lcam-lead-group>
          ${LIMB_CAMERAS.map(c => `
            <button type="button" class="lcam-lead-pill" data-lcam-lead="${c.id}" style="--cam-color:${c.color};--cam-pill:${c.pill}">
              <span class="lcam-dot"></span>
              <strong>${c.id}</strong>
              <small>${fmtDeg(c.angle)}</small>
            </button>
          `).join('')}
        </div>
        <label class="lcam-slider-wrap">
          <span data-lcam-slider-label></span>
          <output data-lcam-angle-out>${fmtDeg(state.angle)}</output>
          <input type="range" min="-180" max="180" step="1" value="${state.angle}" data-lcam-angle />
        </label>
      </div>

      <div class="lcam-stage-wrap">
        <svg viewBox="0 0 720 580" class="lcam-svg" role="img" data-lcam-svg></svg>
      </div>

      <div class="lcam-readout" role="status" data-lcam-readout></div>
      <p class="lcam-note" data-lcam-note></p>
    `;

    const svgRoot = root.querySelector('[data-lcam-svg]');
    // Poster background matching the clean educational reel aesthetic
    svgRoot.append(
      svg('rect', { x: 0, y: 0, width: 720, height: 580, rx: 18, fill: '#edf6f5' }),
      svg('text', { x: 360, y: 34, 'text-anchor': 'middle', class: 'lcam-poster-heading', 'data-lcam-poster-title': '' }),
      svg('text', { x: 360, y: 54, 'text-anchor': 'middle', class: 'lcam-poster-sub', 'data-lcam-poster-sub': '' })
    );

    // Top Waveform Monitor Area (Single & Dual Compare)
    const singleMonitor = svg('g', { class: 'lcam-monitor-single' });
    singleMonitor.append(
      svg('text', { x: 360, y: 92, 'text-anchor': 'middle', class: 'lcam-wave-title', 'data-lcam-wave-title': '' }),
      svg('text', { x: 360, y: 112, 'text-anchor': 'middle', class: 'lcam-wave-tag', 'data-lcam-wave-tag': '' }),
      svg('line', { x1: 110, y1: 174, x2: 610, y2: 174, class: 'lcam-iso-line' }),
      svg('path', { class: 'lcam-main-wave', 'data-lcam-main-wave': '' }),
      svg('text', { x: 222, y: 196, 'text-anchor': 'middle', class: 'lcam-wave-part' }, 'P'),
      svg('text', { x: 320, y: 196, 'text-anchor': 'middle', class: 'lcam-wave-part' }, 'QRS'),
      svg('text', { x: 440, y: 196, 'text-anchor': 'middle', class: 'lcam-wave-part' }, 'T')
    );

    const compareMonitor = svg('g', { class: 'lcam-monitor-compare' });
    const avrCam = LIMB_CAMERAS.find(c => c.id === 'aVR');
    const iiCam = LIMB_CAMERAS.find(c => c.id === 'II');
    compareMonitor.append(
      svg('text', { x: 205, y: 92, 'text-anchor': 'middle', class: 'lcam-wave-title', fill: avrCam.color }, 'aVR'),
      svg('text', { x: 205, y: 110, 'text-anchor': 'middle', class: 'lcam-wave-tag' }, '−150° · −P / −QRS / −T'),
      svg('line', { x1: 68, y1: 170, x2: 342, y2: 170, class: 'lcam-iso-line' }),
      svg('path', {
        d: cameraWavePath(-150, 68, 170, 274, 48),
        class: 'lcam-main-wave',
        stroke: avrCam.color
      }),
      svg('text', { x: 515, y: 92, 'text-anchor': 'middle', class: 'lcam-wave-title', fill: iiCam.color }, 'II'),
      svg('text', { x: 515, y: 110, 'text-anchor': 'middle', class: 'lcam-wave-tag' }, '+60° · +P / +R / +T'),
      svg('line', { x1: 378, y1: 170, x2: 652, y2: 170, class: 'lcam-iso-line' }),
      svg('path', {
        d: cameraWavePath(60, 378, 170, 274, 48),
        class: 'lcam-main-wave',
        stroke: iiCam.color
      })
    );
    svgRoot.append(singleMonitor, compareMonitor);

    // Orbit ring around the heart
    const orbitRing = svg('circle', {
      cx: CX,
      cy: CY,
      r: ORBIT_R,
      class: 'lcam-orbit-ring'
    });
    svgRoot.append(orbitRing);

    // Anatomical heart + mean vector
    const heartVecNode = drawAnatomicalHeart(svgRoot);

    // Primary & secondary (compare) cameras
    const primaryCamNode = createCameraNode(svgRoot);
    const compareCamNode = createCameraNode(svgRoot);

    // 6 Limb Lead Mini-Stations around the orbit
    const stationNodes = new Map();
    for (const cam of LIMB_CAMERAS) {
      const [sx, sy] = cam.station;
      const g = svg('g', {
        class: 'lcam-station',
        role: 'button',
        tabindex: 0,
        'data-lcam-station': cam.id,
        'aria-label': `${cam.id} (${fmtDeg(cam.angle)})`
      });
      const pill = svg('rect', {
        x: sx - 44,
        y: sy - 34,
        width: 88,
        height: 32,
        rx: 11,
        fill: cam.pill,
        stroke: cam.color,
        'stroke-width': 1.5,
        class: 'lcam-station-pill'
      });
      const label = svg('text', {
        x: sx,
        y: sy - 11,
        'text-anchor': 'middle',
        fill: cam.color,
        class: 'lcam-station-label'
      }, cam.id);
      const baseLine = svg('line', {
        x1: sx - 48,
        y1: sy + 18,
        x2: sx + 48,
        y2: sy + 18,
        class: 'lcam-station-iso'
      });
      const miniWave = svg('path', {
        d: cameraWavePath(cam.angle, sx - 48, sy + 18, 96, 15, 90),
        stroke: cam.color,
        class: 'lcam-station-wave'
      });
      g.append(pill, label, baseLine, miniWave);
      const pick = () => {
        stopTour();
        state.mode = 'single';
        selectLead(cam.id);
      };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pick();
        }
      });
      svgRoot.append(g);
      stationNodes.set(cam.id, { g, pill });
    }

    // Pointer dragging on the orbit / heart area to rotate the camera freely
    const setAngleFromPointer = e => {
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svgRoot.getScreenCTM().inverse());
      const deg = Math.round((Math.atan2(pt.y - CY, pt.x - CX) * 180) / Math.PI);
      stopTour();
      state.mode = 'single';
      state.angle = deg;
      displayAngle = deg;
      const snap = nearestLimbCamera(deg, 8);
      if (snap) state.lead = snap.id;
      onAngleChange?.(state.angle);
      renderState();
    };

    svgRoot.addEventListener('pointerdown', e => {
      if (e.target.closest('[data-lcam-station]')) return;
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svgRoot.getScreenCTM().inverse());
      const dist = Math.hypot(pt.x - CX, pt.y - CY);
      if (dist >= 32 && dist <= 165) {
        dragging = true;
        svgRoot.setPointerCapture?.(e.pointerId);
        setAngleFromPointer(e);
      }
    });
    svgRoot.addEventListener('pointermove', e => {
      if (!dragging) return;
      setAngleFromPointer(e);
    });
    const endDrag = () => { dragging = false; };
    svgRoot.addEventListener('pointerup', endDrag);
    svgRoot.addEventListener('pointercancel', endDrag);

    // Wire top buttons & slider
    root.querySelectorAll('[data-lcam-lead]').forEach(btn => {
      btn.addEventListener('click', () => {
        stopTour();
        state.mode = 'single';
        selectLead(btn.dataset.lcamLead);
      });
    });

    root.querySelector('[data-lcam-angle]').addEventListener('input', e => {
      stopTour();
      state.mode = 'single';
      state.angle = Number(e.target.value);
      displayAngle = state.angle;
      const snap = nearestLimbCamera(state.angle, 8);
      if (snap) state.lead = snap.id;
      onAngleChange?.(state.angle);
      renderState();
    });

    root.querySelector('[data-lcam-action="compare"]').addEventListener('click', () => {
      stopTour();
      state.mode = state.mode === 'compare' ? 'single' : 'compare';
      if (state.mode === 'compare') {
        state.lead = 'II';
        state.angle = 60;
        displayAngle = 60;
      }
      renderState();
    });

    root.querySelector('[data-lcam-action="vector"]').addEventListener('click', () => {
      state.showVector = !state.showVector;
      renderState();
    });

    root.querySelector('[data-lcam-action="tour"]').addEventListener('click', () => {
      if (state.touring) stopTour();
      else startTour();
      renderState();
    });

    return {
      singleMonitor,
      compareMonitor,
      heartVecNode,
      primaryCamNode,
      compareCamNode,
      stationNodes
    };
  }

  const nodes = buildMarkup();

  function selectLead(leadId, animate = true) {
    const cam = LIMB_CAMERAS.find(c => c.id === leadId);
    if (!cam) return;
    state.lead = cam.id;
    state.angle = cam.angle;
    onAngleChange?.(state.angle);
    if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      displayAngle = cam.angle;
    } else {
      ensureAnimationLoop();
    }
    renderState();
  }

  function startTour() {
    state.touring = true;
    tourIndex = 0;
    tourElapsed = 0;
    lastTs = null;
    applyTourStep(TOUR_STEPS[0]);
    ensureAnimationLoop();
  }

  function stopTour() {
    state.touring = false;
    lastTs = null;
  }

  function applyTourStep(step) {
    state.mode = step.mode;
    const cam = LIMB_CAMERAS.find(c => c.id === step.lead);
    if (cam) {
      state.lead = cam.id;
      state.angle = cam.angle;
    }
  }

  function ensureAnimationLoop() {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(stepAnimation);
  }

  function stepAnimation(ts) {
    rafId = null;
    const dt = lastTs !== null ? Math.min(80, ts - lastTs) : 16;
    lastTs = ts;

    if (state.touring) {
      tourElapsed += dt;
      const currentStep = TOUR_STEPS[tourIndex];
      if (tourElapsed >= currentStep.duration) {
        tourElapsed = 0;
        tourIndex = (tourIndex + 1) % TOUR_STEPS.length;
        applyTourStep(TOUR_STEPS[tourIndex]);
      }
    }

    const diff = shortestDelta(displayAngle, state.angle);
    if (Math.abs(diff) > 0.35) {
      displayAngle = ((displayAngle + diff * Math.min(1, dt * 0.014) + 540) % 360) - 180;
    } else {
      displayAngle = state.angle;
    }

    renderVisualsOnly();

    if (state.touring || Math.abs(shortestDelta(displayAngle, state.angle)) > 0.35) {
      rafId = requestAnimationFrame(stepAnimation);
    } else {
      lastTs = null;
    }
  }

  function renderVisualsOnly() {
    const { exact, color, label } = activeCameraMeta();
    const isCompare = state.mode === 'compare';

    nodes.singleMonitor.style.display = isCompare ? 'none' : '';
    nodes.compareMonitor.style.display = isCompare ? '' : 'none';
    nodes.heartVecNode.style.display = state.showVector ? '' : 'none';

    if (!isCompare) {
      const waveTitle = root.querySelector('[data-lcam-wave-title]');
      const waveTag = root.querySelector('[data-lcam-wave-tag]');
      const mainWave = root.querySelector('[data-lcam-main-wave]');
      waveTitle.textContent = label;
      waveTitle.setAttribute('fill', color);
      waveTag.textContent = exact
        ? `${fmtDeg(exact.angle)} · ${exact.viewpoint[lang()]}`
        : `${fmtDeg(state.angle)} · ${tr('Serbest kamera açısı', 'Custom camera angle')}`;
      mainWave.setAttribute('d', cameraWavePath(displayAngle, 110, 174, 500, 52));
      mainWave.setAttribute('stroke', color);

      positionCameraNode(nodes.primaryCamNode, displayAngle, color);
      nodes.compareCamNode.group.style.display = 'none';
    } else {
      const avrCam = LIMB_CAMERAS.find(c => c.id === 'aVR');
      const iiCam = LIMB_CAMERAS.find(c => c.id === 'II');
      positionCameraNode(nodes.primaryCamNode, iiCam.angle, iiCam.color);
      nodes.compareCamNode.group.style.display = '';
      positionCameraNode(nodes.compareCamNode, avrCam.angle, avrCam.color);
    }

    for (const [id, item] of nodes.stationNodes.entries()) {
      const active = isCompare ? (id === 'II' || id === 'aVR') : (exact?.id === id);
      item.g.classList.toggle('is-active', Boolean(active));
      item.g.setAttribute('aria-pressed', String(Boolean(active)));
    }
  }

  function renderState() {
    const { matched, exact, color, label } = activeCameraMeta();
    const isCompare = state.mode === 'compare';

    root.querySelector('[data-lcam-eyebrow]').textContent = tr(
      'DERİVASYON BAKIŞ AÇISI STÜDYOSU · 6 EKSTREMİTE KAMERASI',
      'LEAD VIEWPOINT STUDIO · 6 LIMB CAMERAS'
    );
    root.querySelector('[data-lcam-title]').textContent = tr(
      'Bakış Açısına Göre EKG Değişir: Aynı Kalp, Farklı Kamera',
      'The ECG Changes with the Viewing Angle: Same Heart, Different Camera'
    );
    root.querySelector('[data-lcam-sub]').textContent = tr(
      'Her derivasyon, kalbin aynı elektriksel aktivitesini farklı bir açıdan kaydeden pozitif (+) bir kameradır. Dalga şeklini ezberlemek yerine kameranın kalbe hangi yönden baktığını hayal edin.',
      'Each lead is a positive (+) camera viewpoint recording the same cardiac electrical activity from a different direction. Instead of memorizing shapes, picture where the camera is looking from.'
    );

    root.querySelector('[data-lcam-poster-title]').textContent = tr(
      'Bakış yönü değişince EKG dalgası neden değişir?',
      'The ECG changes with the viewing angle.'
    );
    root.querySelector('[data-lcam-poster-sub]').textContent = tr(
      'Kameraya yaklaşan depolarizasyon pozitif (+), uzaklaşan negatif (−), dik geçen eşfazlı/düz yazdırılır.',
      'Depolarization approaching the camera writes positive (+), receding writes negative (−), perpendicular writes flat/equiphasic.'
    );

    const tourBtn = root.querySelector('[data-lcam-action="tour"]');
    tourBtn.textContent = state.touring
      ? tr('❚❚ Kamera Turunu Durdur', '❚❚ Pause Camera Tour')
      : tr('▶ Kamera Turu (Otomatik)', '▶ Camera Tour (Auto)');
    tourBtn.setAttribute('aria-pressed', String(state.touring));

    const compareBtn = root.querySelector('[data-lcam-action="compare"]');
    compareBtn.textContent = tr('⇄ Karşıt Bakış: aVR vs II', '⇄ Opposite Views: aVR vs II');
    compareBtn.setAttribute('aria-pressed', String(isCompare));

    const vecBtn = root.querySelector('[data-lcam-action="vector"]');
    vecBtn.textContent = tr('Kalp Vektörü (+58°)', 'Heart Vector (+58°)');
    vecBtn.setAttribute('aria-pressed', String(state.showVector));

    root.querySelector('[data-lcam-slider-label]').textContent = tr(
      'Kamera Bakış Açısı (Frontal Düzlem):',
      'Camera Viewing Angle (Frontal Plane):'
    );
    const angleInput = root.querySelector('[data-lcam-angle]');
    angleInput.value = String(state.angle);
    root.querySelector('[data-lcam-angle-out]').textContent = fmtDeg(state.angle);

    root.querySelectorAll('[data-lcam-lead]').forEach(btn => {
      const id = btn.dataset.lcamLead;
      const pressed = isCompare ? (id === 'II' || id === 'aVR') : (exact?.id === id);
      btn.setAttribute('aria-pressed', String(Boolean(pressed)));
    });

    const readout = root.querySelector('[data-lcam-readout]');
    const rPeak = cameraWaveSample(0.42, state.angle);
    if (isCompare) {
      readout.style.borderLeftColor = '#d9385a';
      readout.innerHTML = `
        <strong>${tr('Karşıt Kamera Karşılaştırması: aVR (−150°) ve II (+60°)', 'Opposite Camera Comparison: aVR (−150°) vs II (+60°)')}</strong>
        <p>${tr(
          'Aynı kalp atımı sırasında ana elektriksel dalga sağ omuzdan (aVR, −150°) sol alt apekse (II, +60°) doğru ilerler. Bu yüzden II kamerası yüksek pozitif P-QRS-T görürken, karşı taraftaki aVR kamerası ayna görüntüsü gibi negatif P-QRS-T kaydeder.',
          'During the exact same heartbeat, the main electrical wave travels from the right shoulder (aVR, −150°) toward the lower-left apex (II, +60°). Lead II therefore sees tall upright P-QRS-T waves, whereas the opposite aVR camera records inverted negative P-QRS-T waves.'
        )}</p>
      `;
    } else {
      readout.style.borderLeftColor = color;
      const summaryText = exact
        ? exact.summary[lang()]
        : tr(
            `${fmtDeg(state.angle)} açısından bakıldığında ana ventrikül vektörünün (+58°) kamera eksenindeki izdüşümü ${rPeak >= 0 ? '+' : '−'}${Math.abs(rPeak).toFixed(2)} mV düzeyindedir (${matched.id} derivasyonuna yakın komşuluk).`,
            `Viewed from ${fmtDeg(state.angle)}, the main ventricular vector (+58°) projects ${rPeak >= 0 ? '+' : '−'}${Math.abs(rPeak).toFixed(2)} mV onto the camera axis (nearest limb lead: ${matched.id}).`
          );
      readout.innerHTML = `
        <strong>${label} · ${exact ? exact.viewpoint[lang()] : fmtDeg(state.angle)} · ${tr('Tepe QRS izdüşümü', 'Peak QRS projection')}: ${rPeak >= 0 ? '+' : '−'}${Math.abs(rPeak).toFixed(2)} mV</strong>
        <p>${summaryText}</p>
      `;
    }

    root.querySelector('[data-lcam-note]').textContent = tr(
      'Not: Bu şema ekstremite derivasyonlarının (I, II, III, aVR, aVL, aVF) kalbe hangi açıdan baktığını gösteren kavramsal kamera modelidir. Kamera simgesi derivasyonun pozitif (+) bakış yönünü temsil eder; gerçek elektrotların gövdede yer değiştirdiğini göstermez.',
      'Note: This schematic illustrates how the limb leads (I, II, III, aVR, aVL, aVF) view the heart from different angles. The camera icon represents the positive (+) viewing axis of each lead, not physical movement of electrodes on the body.'
    );

    renderVisualsOnly();
  }

  renderState();

  return {
    selectLead,
    setAngle(deg) {
      stopTour();
      state.mode = 'single';
      state.angle = Math.max(-180, Math.min(180, Math.round(Number(deg) || 0)));
      displayAngle = state.angle;
      const snap = nearestLimbCamera(state.angle, 8);
      if (snap) state.lead = snap.id;
      renderState();
    },
    render: renderState,
    destroy() {
      stopTour();
      if (rafId !== null) cancelAnimationFrame(rafId);
      root.remove();
    }
  };
}

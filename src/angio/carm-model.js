// 3D Isometric C-Arm & Cath Lab Room Simulator
// Visualizes the physical gantry, patient on examination table, X-ray tube, and Flat Panel Detector

/**
 * Generates an interactive SVG showing the physical C-arm gantry and patient position in the cath lab room
 * @param {number} alpha - RAO / LAO angle in degrees (-90 to +90)
 * @param {number} beta - Cranial / Caudal angle in degrees (-45 to +45)
 * @param {boolean} isTr - Language flag
 */
export function buildCarmSvg(alpha, beta, isTr = true) {
  const W = 360;
  const H = 260;
  const cx = W / 2;
  const cy = H / 2 + 10;

  // Convert angles to radians
  const radA = (alpha * Math.PI) / 180;
  const radB = (beta * Math.PI) / 180;

  // C-Arm Arc Dimensions
  const arcRadius = 78;

  // Detector position (Above patient):
  // RAO (alpha < 0) moves detector to screen left (patient's right)
  // LAO (alpha > 0) moves detector to screen right (patient's left)
  // Cranial (beta > 0) moves detector towards top (cranial/head)
  // Caudal (beta < 0) moves detector towards bottom (caudal/feet)
  const detX = cx + Math.sin(radA) * arcRadius * 0.95;
  const detY = cy - Math.cos(radA) * Math.cos(radB) * arcRadius * 0.65 - Math.sin(radB) * 38;

  // X-Ray Tube position (Underneath patient, exactly 180 degrees opposite the detector):
  const tubeX = cx - Math.sin(radA) * arcRadius * 0.95;
  const tubeY = cy + Math.cos(radA) * Math.cos(radB) * arcRadius * 0.65 + Math.sin(radB) * 38;

  // Format angles for labels
  const laoRaoStr = Math.abs(alpha) < 0.5 ? 'AP 0°' : `${alpha > 0 ? 'LAO' : 'RAO'} ${Math.abs(Math.round(alpha))}°`;
  const craCauStr = Math.abs(beta) < 0.5 ? '0°' : `${beta > 0 ? 'CRA' : 'CAU'} ${Math.abs(Math.round(beta))}°`;

  return `
    <svg viewBox="0 0 ${W} ${H}" class="carm-gantry-svg" role="img" aria-label="${isTr ? 'C-Arm Fiziksel Gantry Simülasyonu' : 'C-Arm Physical Gantry Simulation'}">
      <defs>
        <radialGradient id="labFloor" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#1e293b" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#090d16" stop-opacity="0.95"/>
        </radialGradient>
        <linearGradient id="gantrySteel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#94a3b8"/>
          <stop offset="50%" stop-color="#475569"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
        <linearGradient id="beamGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.32"/>
          <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.14"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.38"/>
        </linearGradient>
        <filter id="carmGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>

      <!-- Cath Lab Room Floor & Circular Pedestal Base -->
      <rect x="0" y="0" width="${W}" height="${H}" rx="12" fill="url(#labFloor)"/>
      <ellipse cx="${cx}" cy="${H - 24}" rx="110" ry="18" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(148, 163, 184, 0.25)" stroke-width="1.2"/>

      <!-- Gantry Vertical Pillar & Pivot Stand -->
      <path d="M ${cx - 18} ${H - 26} L ${cx - 14} ${cy + 35} L ${cx + 14} ${cy + 35} L ${cx + 18} ${H - 26} Z" fill="url(#gantrySteel)" stroke="#334155" stroke-width="1.2"/>
      <circle cx="${cx}" cy="${cy + 35}" r="11" fill="#334155" stroke="#64748b" stroke-width="2"/>

      <!-- Patient Catheterization Table (Supine Patient) -->
      <!-- Table Top -->
      <rect x="${cx - 80}" y="${cy - 8}" width="160" height="16" rx="4" fill="rgba(51, 65, 85, 0.9)" stroke="rgba(148, 163, 184, 0.35)" stroke-width="1"/>
      <!-- Patient Body Silhouette -->
      <!-- Head (Cranial) -->
      <circle cx="${cx}" cy="${cy - 22}" r="9" fill="#94a3b8"/>
      <!-- Torso / Chest (Isocenter is at heart) -->
      <path d="M ${cx - 14} ${cy - 12} Q ${cx - 16} ${cy + 8} ${cx - 11} ${cy + 18} L ${cx + 11} ${cy + 18} Q ${cx + 16} ${cy + 8} ${cx + 14} ${cy - 12} Z" fill="#64748b"/>
      <!-- Patient Legs (Caudal) -->
      <rect x="${cx - 9}" y="${cy + 18}" width="7" height="24" rx="2" fill="#475569"/>
      <rect x="${cx + 2}" y="${cy + 18}" width="7" height="24" rx="2" fill="#475569"/>

      <!-- Heart / Isocenter Red Marker -->
      <circle cx="${cx}" cy="${cy}" r="4.5" fill="#ef4444" filter="url(#carmGlow)"/>
      <circle cx="${cx}" cy="${cy}" r="1.8" fill="#ffffff"/>

      <!-- X-Ray Cone Beam (Connecting X-Ray Tube under table to Detector above patient) -->
      <polygon points="${tubeX - 16},${tubeY} ${tubeX + 16},${tubeY} ${detX + 22},${detY} ${detX - 22},${detY}"
               fill="url(#beamGradient)" stroke="rgba(56, 189, 248, 0.45)" stroke-width="1" stroke-dasharray="3,3"/>

      <!-- Curved C-Arm Arc Assembly (Cast Metal Gantry) -->
      <!-- We compute a smooth elliptical arc from Tube through Pivot to Detector -->
      <path d="M ${tubeX} ${tubeY}
               Q ${cx - Math.cos(radA) * arcRadius * 1.3} ${cy + (Math.sin(radA) * 20)} ${detX} ${detY}"
            fill="none" stroke="url(#gantrySteel)" stroke-width="13" stroke-linecap="round"/>
      <path d="M ${tubeX} ${tubeY}
               Q ${cx - Math.cos(radA) * arcRadius * 1.3} ${cy + (Math.sin(radA) * 20)} ${detX} ${detY}"
            fill="none" stroke="#e2e8f0" stroke-width="2.5" stroke-dasharray="5,4" opacity="0.6"/>

      <!-- X-Ray Tube (Under Table) -->
      <g transform="translate(${tubeX}, ${tubeY})">
        <rect x="-18" y="-9" width="36" height="18" rx="4" fill="#1e293b" stroke="#f59e0b" stroke-width="1.8"/>
        <circle cx="0" cy="0" r="4.5" fill="#f59e0b"/>
        <text x="0" y="19" fill="#fde68a" font-size="9" font-weight="800" text-anchor="middle">
          ${isTr ? 'TÜP (X-RAY)' : 'TUBE (X-RAY)'}
        </text>
      </g>

      <!-- Flat Panel Detector / FPD (Over Patient) -->
      <g transform="translate(${detX}, ${detY})">
        <rect x="-24" y="-12" width="48" height="24" rx="5" fill="#0f172a" stroke="#38bdf8" stroke-width="2.2" filter="url(#carmGlow)"/>
        <rect x="-20" y="-8" width="40" height="16" rx="3" fill="#1e293b"/>
        <text x="0" y="4" fill="#38bdf8" font-size="9.5" font-weight="900" text-anchor="middle">DETEKTÖR</text>
        <text x="0" y="-16" fill="#7dd3fc" font-size="9.5" font-weight="800" text-anchor="middle">
          ${isTr ? 'FPD (DEDEKTÖR)' : 'FPD (DETECTOR)'}
        </text>
      </g>

      <!-- Gantry Angle Readout HUD Overlay (Top Right) -->
      <rect x="${W - 134}" y="12" width="122" height="42" rx="6" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(56, 189, 248, 0.4)"/>
      <text x="${W - 73}" y="28" fill="#38bdf8" font-size="11.5" font-weight="800" text-anchor="middle" font-family="monospace">
        ${laoRaoStr} · ${craCauStr}
      </text>
      <text x="${W - 73}" y="44" fill="#94a3b8" font-size="9.5" font-weight="700" text-anchor="middle">
        ${isTr ? 'Gantry Pozisyonu' : 'Gantry Position'}
      </text>

      <!-- Patient Orientation Compass (Bottom Left) -->
      <g transform="translate(36, ${H - 30})">
        <circle cx="0" cy="0" r="16" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(148, 163, 184, 0.3)"/>
        <text x="0" y="-7" fill="#f87171" font-size="8.5" font-weight="900" text-anchor="middle">HEAD</text>
        <text x="0" y="11" fill="#94a3b8" font-size="8" font-weight="800" text-anchor="middle">FEET</text>
        <text x="-9" y="3" fill="#38bdf8" font-size="8" font-weight="800" text-anchor="middle">R</text>
        <text x="9" y="3" fill="#38bdf8" font-size="8" font-weight="800" text-anchor="middle">L</text>
      </g>
    </svg>
  `;
}

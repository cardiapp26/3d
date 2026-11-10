/*
 * Probabilistic circuit modeling of the 3D EAM workstation ("Find the circuit", pure):
 * candidate reentrant circuits on the mapped anatomy, how often each sustains across the
 * survey runs, and the ablation lines ranked by the share of circuits they interrupt.
 */
import { DEFAULT_LEVERS, EAM3D_ABLATION_LINES } from './eam3d-anatomy.js';

/**
 * Probabilistic Circuit Modeling ("Find the circuit" workflow):
 * Surveys potential reentrant circuits across `runs` (10, 100, or 1000) over the 3D substrate,
 * filters out circuits interrupted by `ablatedLines`, and ranks minimal-intervention lines.
 */
export function runCircuitSurvey({ mapPreset = 'biatrial-scar', runs = 100, levers = DEFAULT_LEVERS, ablatedLines = new Set() } = {}) {
  const lv = { ...DEFAULT_LEVERS, ...levers };
  const cvScale = 0.90 / Math.max(0.3, lv.atrialCv);

  // Candidate 3D reentrant circuits on the mapped anatomy (matching the 6 circuits in circuit-finding.jpg)
  const candidates = [
    {
      id: 'circuit-1-mitral',
      // C-arm view that shows this circuit best (annuli en face in LAO, posterior LA in PA).
      view: 'lao30',
      number: 1,
      color: '#ec4899',
      chamber: 'la',
      baseWeight: mapPreset === 'vt-scar' ? 0.04 : 0.34,
      tclMs: Math.round(255 * cvScale),
      isthmusMm: 14,
      blockedBy: ['mitral-isthmus'],
      ribbon3d: [
        [0.18, 0.32, -0.35], [0.36, 0.14, -0.52], [0.28, -0.18, -0.44],
        [0.02, -0.24, -0.32], [-0.14, 0.04, -0.26], [0.18, 0.32, -0.35]
      ]
    },
    {
      id: 'circuit-2-roof',
      view: 'pa',
      number: 2,
      color: '#ef4444',
      chamber: 'la',
      baseWeight: mapPreset === 'vt-scar' ? 0.02 : 0.26,
      tclMs: Math.round(270 * cvScale),
      isthmusMm: 11,
      blockedBy: ['la-anterior-roof'],
      ribbon3d: [
        [-0.36, 0.88, -0.48], [-0.12, 1.08, -0.56], [0.18, 0.92, -0.52],
        [0.14, 0.45, -0.68], [-0.22, 0.42, -0.66], [-0.36, 0.88, -0.48]
      ]
    },
    {
      id: 'circuit-3-posterior-fig8',
      view: 'pa',
      number: 3,
      color: '#10b981',
      chamber: 'la',
      baseWeight: mapPreset === 'vt-scar' ? 0.02 : 0.16,
      tclMs: Math.round(242 * cvScale),
      isthmusMm: 9,
      blockedBy: ['la-anterior-roof', 'posterior-box'],
      ribbon3d: [
        [-0.28, 0.72, -0.74], [-0.04, 0.52, -0.82], [0.22, 0.68, -0.74],
        [0.18, 0.28, -0.76], [-0.24, 0.26, -0.74], [-0.28, 0.72, -0.74]
      ]
    },
    {
      id: 'circuit-4-anterior-scar',
      view: 'ap',
      number: 4,
      color: '#eab308',
      chamber: 'la',
      baseWeight: mapPreset === 'vt-scar' ? 0.01 : 0.11,
      tclMs: Math.round(288 * cvScale),
      isthmusMm: 12,
      blockedBy: ['la-anterior-roof', 'mitral-isthmus'],
      ribbon3d: [
        [-0.24, 0.96, -0.42], [0.08, 0.84, -0.40], [0.28, 0.48, -0.48],
        [-0.06, 0.54, -0.50], [-0.24, 0.96, -0.42]
      ]
    },
    {
      id: 'circuit-5-cti',
      view: 'lao30',
      number: 5,
      color: '#38bdf8',
      chamber: 'ra',
      baseWeight: mapPreset === 'vt-scar' ? 0.03 : 0.09,
      tclMs: Math.round(238 * cvScale),
      isthmusMm: 18,
      blockedBy: ['cti-line'],
      ribbon3d: [
        [-0.78, -0.46, 0.12], [-1.18, -0.10, 0.22], [-1.06, 0.52, 0.18],
        [-0.66, 0.24, 0.06], [-0.78, -0.46, 0.12]
      ]
    },
    {
      id: 'circuit-6-vt-isthmus',
      view: 'pa',
      number: 6,
      color: '#a855f7',
      chamber: 'lv',
      baseWeight: mapPreset === 'vt-scar' ? 0.88 : 0.04,
      tclMs: Math.round(318 * (0.61 / Math.max(0.25, lv.ventricularCv))),
      isthmusMm: 8,
      blockedBy: ['vt-isthmus-dechannel'],
      ribbon3d: [
        [0.62, -0.24, -0.30], [0.76, -0.36, -0.35], [0.90, -0.48, -0.32],
        [0.78, -0.68, -0.12], [0.54, -0.48, -0.14], [0.62, -0.24, -0.30]
      ]
    }
  ];

  const activeCircuits = candidates.map((c) => {
    const interrupted = c.blockedBy.some((lineId) => ablatedLines.has(lineId));
    const weight = interrupted ? 0 : c.baseWeight;
    const count = Math.round(weight * runs);
    return {
      ...c,
      interrupted,
      sustainedCount: count,
      frequencyPct: Number(((count / Math.max(1, runs)) * 100).toFixed(1))
    };
  });

  const totalSustained = activeCircuits.reduce((s, c) => s + c.sustainedCount, 0);

  // Proposed intervention lines compared by length (mm) and share of sustained circuits interrupted
  const proposedLines = Object.values(EAM3D_ABLATION_LINES)
    .filter((line) => ['la-anterior-roof', 'mitral-isthmus', 'cti-line', 'posterior-box', 'vt-isthmus-dechannel'].includes(line.id))
    .map((line) => {
      const blocked = activeCircuits.filter((c) => !c.interrupted && c.blockedBy.includes(line.id));
      const blockedRuns = blocked.reduce((s, c) => s + c.sustainedCount, 0);
      const sharePct = totalSustained > 0 ? Math.round((blockedRuns / totalSustained) * 100) : 0;
      const efficiency = Number((sharePct / Math.max(1, line.lengthMm)).toFixed(2));
      return {
        id: line.id,
        chamber: line.chamber,
        lengthMm: line.lengthMm,
        applied: ablatedLines.has(line.id),
        circuitsBlocked: blocked.map((c) => c.number),
        interruptedSharePct: sharePct,
        efficiency,
        points: line.points
      };
    })
    .sort((a, b) => b.interruptedSharePct - a.interruptedSharePct || a.lengthMm - b.lengthMm);

  return {
    mapPreset,
    runs,
    totalSustained,
    sustainedPct: Math.round((totalSustained / Math.max(1, runs)) * 100),
    circuits: activeCircuits,
    proposedLines
  };
}

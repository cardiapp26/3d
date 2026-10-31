// Conduction snapshot of one sinus beat at a scrubber time (0..860 ms), on the stage timing of
// CONDUCTION_STAGES in clinical-ecg-simulator.js: SA 0-35, atria 35-115, AV node 115-205,
// His 205-225, bundles 225-255, Purkinje and myocardium 255-320, repolarization 320-860.
// The snapshot drives the 3D atlas heart (ecg-ashman-atlas.js, origin 'sa'): progress 0..1 per
// structure (null = not reached yet), the septal arrow, blocks, and recovery during repolarization.

const clamp01 = x => Math.max(0, Math.min(1, x));
/** Progress of a segment that conducts from `start` to `end` ms; null before it starts. */
const span = (ms, start, end) => (ms < start ? null : clamp01((ms - start) / (end - start)));

export const SINUS_TIMING = Object.freeze({
  saFire: [0, 35],
  atria: [10, 115],
  avn: [115, 205],
  his: [205, 225],
  lbb: [225, 247],
  rbb: [228, 254],
  fascicles: [244, 262],
  lv: [252, 318],
  rv: [256, 320],
  septal: [225, 262],
  // Conduction tubes go dark once the ventricles are activated (they are refractory, not conducting).
  tubesOff: 340,
  // Atrial repolarization is hidden inside the QRS; ventricular recovery is the T wave.
  atrialRecovery: [215, 330],
  ventricularRecovery: [540, 790]
});

/**
 * @param {number} ms scrubber time in the beat
 * @param {{ rbbb?: boolean, lbbb?: boolean, atrial?: 'sinus' | 'fibrillation' | 'flutter' | 'none', dropped?: boolean }} [beat]
 * @returns {{ c: object, bundles: object | null, stage: string }}
 */
export function sinusActivation(ms, beat = {}) {
  const T = SINUS_TIMING, t = Number(ms) || 0;
  const sinus = (beat.atrial || 'sinus') === 'sinus';
  const conducted = !beat.dropped;
  const rbbBlock = Boolean(beat.rbbb), lbbBlock = Boolean(beat.lbbb);
  const tubes = t <= T.tubesOff;
  const on = (range) => (conducted && tubes ? span(t, ...range) : null);
  // A blocked bundle conducts only to its block point; that ventricle fills late, across the septum.
  const lateBy = 40;
  const c = {
    sa: sinus && t >= T.saFire[0] && t < T.saFire[1],
    // Recovered atria show as resting muscle again, internodal tracts dark.
    atria: sinus && t < T.atrialRecovery[1] ? span(t, ...T.atria) : null,
    avn: conducted && t < T.his[1] ? span(t, ...T.avn) : null,
    his: on(T.his),
    lbb: lbbBlock ? (on(T.lbb) == null ? null : Math.min(.45, on(T.lbb))) : on(T.lbb),
    rbb: rbbBlock ? (on(T.rbb) == null ? null : Math.min(.12, on(T.rbb))) : on(T.rbb),
    laf: lbbBlock ? null : on(T.fascicles),
    lpf: lbbBlock ? null : on(T.fascicles),
    lv: conducted ? span(t, T.lv[0] + (lbbBlock ? lateBy : 0), T.lv[1] + (lbbBlock ? lateBy + 20 : 0)) : null,
    rv: conducted ? span(t, T.rv[0] + (rbbBlock ? lateBy : 0), T.rv[1] + (rbbBlock ? lateBy + 20 : 0)) : null,
    septal: 0,
    purkinjeLit: tubes,
    septalToRv: !lbbBlock,
    blockedAt: { avn: !conducted && t >= T.his[0], rbb: rbbBlock && t >= T.rbb[0], lbb: lbbBlock && t >= T.lbb[0], laf: false },
    recovery: {
      atria: sinus ? clamp01((t - T.atrialRecovery[0]) / (T.atrialRecovery[1] - T.atrialRecovery[0])) : 0,
      ventricles: conducted ? clamp01((t - T.ventricularRecovery[0]) / (T.ventricularRecovery[1] - T.ventricularRecovery[0])) : 0
    }
  };
  // Septal activation: left to right from the left bundle normally; right to left in LBBB.
  const septalEnd = T.septal[1] + (lbbBlock ? lateBy : 0);
  if (conducted && t >= T.septal[0] && t < septalEnd) c.septal = clamp01((t - T.septal[0]) / (septalEnd - T.septal[0]));
  const bundles = rbbBlock || lbbBlock ? { rbb: { state: rbbBlock ? 'block' : 'ok' }, lbb: { state: lbbBlock ? 'block' : 'ok' } } : null;
  return { c, bundles, stage: stageAt(t) };
}

function stageAt(t) {
  if (t < 35) return 'sa';
  if (t < 115) return 'atria';
  if (t < 205) return 'avn';
  if (t < 225) return 'his';
  if (t < 255) return 'branches';
  if (t < 320) return 'purkinje';
  return 'repol';
}

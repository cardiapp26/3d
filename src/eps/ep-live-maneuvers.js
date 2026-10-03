/*
 * Maneuvers and protocols of the live EP laboratory: stimulus plans and
 * their readouts, all computed from the recorded events (ms). His-refractory
 * PVC, overdrive pacing (entrainment: PPI - TCL, SA - VA, V-A-V versus
 * V-A-A-V), incremental atrial pacing (AV block cycle length), programmed
 * atrial extrastimuli (ERPs, AH jump, echo) and sinus node recovery time.
 * Thresholds are the classic teaching cut-offs, not a diagnostic algorithm.
 */

const RETRO = new Set(['avn-fast', 'avn-slow', 'ap-left', 'ap-ps']);
const PACE_CHANNEL = { hra: 'hra', 'cs-prox': 'cs-910', 'cs-dist': 'cs-12', rv: 'rv' };
export const PPI_CUTOFF = 115;     // PPI - TCL from the RV: > 115 AVNRT, otherwise AVRT
export const SA_VA_CUTOFF = 85;    // SA - VA: > 85 AVNRT, otherwise AVRT
export const CSNRT_LIMIT = 550;    // corrected SNRT upper limit

const of = (events, ch, type) => (events[ch] || []).filter((e) => e.type === type);
const tOf = (events, ch, type) => of(events, ch, type).map((e) => e.t);
const after = (list, t) => list.find((x) => x > t);
const before = (list, t) => [...list].reverse().find((x) => x < t);
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
const cycles = (list) => list.slice(1).map((x, i) => x - list[i]);

/** Tachycardia cycle length before t: median V-V of the last four beats (RV channel). */
export function tclBefore(events, t) {
  const vs = tOf(events, 'rv', 'V').filter((x) => x < t).slice(-5);
  return vs.length >= 3 ? Math.round(median(cycles(vs))) : null;
}

/** RV stimulus time for a His-refractory PVC: the V lands just after the next expected His. */
export function hisPvcTime(events, now) {
  const hs = tOf(events, 'his-d', 'H').filter((x) => x <= now).slice(-3);
  if (hs.length < 2) return null;
  const cl = hs[hs.length - 1] - hs[hs.length - 2];
  let h = hs[hs.length - 1] + cl;
  while (h - 15 < now + 80) h += cl;
  return Math.round(h - 15);   // V at stimulus + 10, i.e. 5 ms before the expected His: His already refractory
}

/**
 * His-refractory PVC readout: the next atrial activation advanced, delayed,
 * unchanged, or the tachycardia ended without an atrial activation.
 */
export function analyzeHisPvc(events, stim) {
  const as = tOf(events, 'hra', 'A');
  const tcl = tclBefore(events, stim);
  const aBefore = before(as, stim + 10);
  if (tcl == null || aBefore == null) return null;
  const expected = aBefore + tcl;
  const next = as.find((a) => a > stim + 10);
  const vAfter = tOf(events, 'rv', 'V').filter((v) => v > stim + 20);
  const terminated = !vAfter.length || vAfter[0] - stim > tcl + 250;
  if (next == null || next > expected + 150) return { tcl, result: terminated ? 'terminated-no-a' : 'unchanged', delta: null };
  const delta = Math.round(next - expected);
  return { tcl, delta, result: delta <= -10 ? 'advanced' : delta >= 10 ? 'delayed' : 'unchanged', terminated };
}

/**
 * Start of an overdrive train: the first stimulus coupled at the pacing cycle
 * to a tachycardia activation on the pacing channel (a train started at a
 * random phase would fall into the refractory period and drift earlier).
 */
export function overdriveStart(events, now, site, tcl, offset = 30) {
  const ch = PACE_CHANNEL[site];
  const own = tOf(events, ch, site === 'rv' ? 'V' : 'A').filter((x) => x <= now);
  const lastX = own[own.length - 1];
  const cl = Math.max(200, Math.round(tcl - offset));
  if (lastX == null || tcl == null) return null;
  let t = lastX + cl;
  while (t < now + 100) t += tcl;
  return Math.round(t);
}

/**
 * During ventricular overdrive: the atrium follows the pacing cycle (the last
 * three HRA cycles equal it). The train then continues for two more beats.
 */
export function atriumEntrained(events, stims, now) {
  const delivered = stims.filter((s) => s.t <= now);
  if (delivered.length < 4) return false;
  const cl = stims[1].t - stims[0].t;
  const as = tOf(events, 'hra', 'A').filter((a) => a > delivered[0].t && a <= now).slice(-4);
  return as.length >= 4 && cycles(as).every((c) => Math.abs(c - cl) <= 15);
}

/** Overdrive train at TCL - offset from a site; returns the stimuli. */
export function planOverdrive({ site, start, tcl, offset = 30, n = 10 }) {
  const cl = Math.max(200, Math.round(tcl - offset));
  return Array.from({ length: n }, (_, i) => ({ t: start + i * cl, site }));
}

/**
 * Overdrive readout after the last stimulus: PPI (stimulus to the return
 * activation on the pacing channel), PPI - TCL, atrial entrainment, the
 * V-A-V / V-A-A-V response (ventricular pacing), SA - VA and termination.
 */
export function analyzeOverdrive(events, stims) {
  if (!stims.length) return null;
  const site = stims[0].site, ch = PACE_CHANNEL[site];
  const first = stims[0].t, lastStim = stims[stims.length - 1].t;
  const pacedCl = stims.length > 1 ? stims[1].t - stims[0].t : null;
  const ventricular = site === 'rv';
  const tcl = ventricular ? tclBefore(events, first) : (() => { const a = tOf(events, ch, 'A').filter((x) => x < first).slice(-5); return a.length >= 3 ? Math.round(median(cycles(a))) : null; })();
  // Return activation on the pacing channel: the first one of the tachycardia's own origin.
  const ownEvents = of(events, ch, ventricular ? 'V' : 'A');
  const tachOrigin = [...ownEvents].reverse().find((e) => e.t < first)?.origin;
  const ret = ownEvents.find((e) => e.t > lastStim + 60 && e.origin !== site && (tachOrigin == null || e.origin === tachOrigin))?.t;
  const ppi = ret != null ? Math.round(ret - lastStim) : null;
  // Atrial activations of the last paced cycles follow the pacing cycle: atrium entrained.
  const hraA = tOf(events, 'hra', 'A');
  const during = hraA.filter((a) => a > lastStim - 3.2 * (pacedCl || 0) && a <= lastStim + (pacedCl || 0) * 0.9);
  const entrained = during.length >= 3 && cycles(during).every((c) => Math.abs(c - pacedCl) <= 15);
  // Every one of the last three stimuli captured its own chamber.
  const capt = of(events, ch, ventricular ? 'V' : 'A');
  const captured = stims.slice(-3).every((s) => capt.some((e) => e.t >= s.t && e.t <= s.t + 40));
  const vs = tOf(events, 'rv', 'V');
  const vAfter = vs.filter((v) => v > lastStim + 30);
  // The tachycardia resumed when the beats after the first return beat run at about its cycle.
  // (judged on the pacing chamber: atrial cycles for an atrial site).
  const track = ventricular ? vAfter : tOf(events, ch, 'A').filter((x) => x > lastStim + 30);
  const resumed = tcl != null && cycles(track.slice(0, 5)).slice(1).filter((c) => Math.abs(c - tcl) <= 40).length >= 2;
  const terminated = tcl != null && !resumed;
  const out = { site, tcl, pacedCl, ppi, ppiTcl: ppi != null && tcl != null ? ppi - tcl : null, captured, entrained, terminated, response: null, saVa: null };
  if (ventricular && entrained && !terminated) {
    // Last entrained A: the last one still at the pacing cycle (with a VA longer than
    // the pacing cycle it falls after the next stimulus time; pseudo-V-A-A-V otherwise).
    let lastA = null;
    for (let i = 1; i < hraA.length; i++) {
      if (hraA[i] > lastStim - pacedCl && Math.abs(hraA[i] - hraA[i - 1] - pacedCl) <= 15) lastA = hraA[i];
    }
    if (lastA != null) {
      const nextA = after(hraA, lastA), nextV = vAfter.find((v) => v > lastA);
      out.response = nextA != null && (nextV == null || nextA < nextV - 20) ? 'VAAV' : 'VAV';
    }
    // SA during pacing (his-d A after the last stimulus) versus VA in tachycardia.
    const hisA = tOf(events, 'his-d', 'A'), hisV = tOf(events, 'his-d', 'V');
    const hisLast = lastA != null ? hisA.find((a) => Math.abs(a - lastA) < 120 && a < lastA + 80) : null;
    const sa = hisLast != null ? hisLast - lastStim : NaN;
    const vBefore = hisV.filter((v) => v < first).slice(-2)[0];
    const va = vBefore != null ? (after(hisA, vBefore) ?? NaN) - vBefore : NaN;
    if (Number.isFinite(sa) && Number.isFinite(va)) out.saVa = Math.round(sa - va);
  }
  return out;
}

/** Overdrive interpretation: the teaching rules (AT by V-A-A-V; AVNRT versus AVRT by PPI - TCL and SA - VA). */
export function interpretOverdrive(r) {
  if (!r || r.terminated || !r.entrained) return null;
  if (r.response === 'VAAV') return 'at';
  if (r.response === 'VAV') {
    const long = (r.ppiTcl ?? 0) > PPI_CUTOFF, saLong = (r.saVa ?? 0) > SA_VA_CUTOFF;
    return long && saLong ? 'avnrt' : !long && !saLong ? 'avrt' : 'indeterminate';
  }
  return null;
}

/** Entrainment mapping rule: PPI - TCL at most 30 ms puts the pacing site in the circuit. */
export const interpretSite = (r) => (r && r.ppiTcl != null ? (r.ppiTcl <= 30 ? 'inCircuit' : 'outside') : null);

/** Atrial cycle length on a site's channel before t (median of the last four A-A). */
export function atrialCycle(events, site, t) {
  const a = tOf(events, PACE_CHANNEL[site], 'A').filter((x) => x <= t).slice(-5);
  return a.length >= 3 ? Math.round(median(cycles(a))) : null;
}

/** Protocol plans: every step's stimuli and the time its readout window ends. */
export function planProtocol(kind, { start, site = 'hra' }) {
  const steps = [];
  let t = start;
  if (kind === 'avbcl') {
    for (let cl = 600; cl >= 280; cl -= 20) {
      const stims = Array.from({ length: 8 }, (_, i) => ({ t: t + i * cl, site }));
      steps.push({ cl, stims, end: stims[7].t + 1400 });
      t = stims[7].t + 1500;
    }
  } else if (kind === 'erp') {
    for (let s2 = 400; s2 >= 200; s2 -= 10) {
      const stims = Array.from({ length: 8 }, (_, i) => ({ t: t + i * 600, site }));
      stims.push({ t: stims[7].t + s2, site });
      steps.push({ s2, stims, end: stims[8].t + 1700 });
      t = stims[8].t + 1800;
    }
  } else if (kind === 'snrt') {
    const stims = Array.from({ length: 30 }, (_, i) => ({ t: t + i * 600, site }));
    steps.push({ cl: 600, stims, end: stims[29].t + 3500 });
  }
  return steps;
}

/** One protocol step's readout. */
export function analyzeStep(kind, events, step) {
  const ch = PACE_CHANNEL[step.stims[0].site];
  const aOn = of(events, ch, 'A'), hisA = of(events, 'his-d', 'A'), hisH = tOf(events, 'his-d', 'H');
  const capture = (s) => aOn.find((a) => a.t >= s.t && a.t <= s.t + 40);
  const junctionA = (s) => hisA.find((a) => a.t >= s.t && a.t <= s.t + 120 && !RETRO.has(a.origin));
  const conducted = (s) => { const a = junctionA(s); if (!a) return null; const h = after(hisH, a.t); return h != null && h - a.t < 450 ? Math.round(h - a.t) : null; };
  if (kind === 'avbcl') {
    const paced = step.stims.filter((s) => capture(s));
    const ahs = paced.map(conducted);
    return { cl: step.cl, captured: paced.length, block: ahs.some((x) => x == null), maxAh: Math.max(0, ...ahs.filter((x) => x != null)) };
  }
  if (kind === 'erp') {
    const s2 = step.stims[step.stims.length - 1], s1 = step.stims[step.stims.length - 2];
    const cap = Boolean(capture(s2));
    const ah = cap ? conducted(s2) : null;
    const h = ah != null ? after(hisH, s2.t) : null;
    const echo = h != null && hisA.some((a) => RETRO.has(a.origin) && a.t > h && a.t < h + 300);
    const vs = tOf(events, 'rv', 'V').filter((v) => v > s2.t && v < step.end);
    const sustained = vs.length >= 4 && cycles(vs).slice(-3).every((c) => c < 500);
    return { s2: step.s2, capture: cap, ah, ahS1: conducted(s1), echo, sustained };
  }
  if (kind === 'snrt') {
    const last = step.stims[step.stims.length - 1].t;
    const sinusA = of(events, 'hra', 'A').find((a) => a.t > last + 30 && a.origin === 'sinus');
    return { lastStim: last, snrt: sinusA ? Math.round(sinusA.t - last) : null };
  }
  return null;
}

/** Protocol summary from the step readouts. */
export function summarizeProtocol(kind, rows, { sinusCl = 800 } = {}) {
  if (kind === 'avbcl') return { avbcl: rows.find((r) => r.block)?.cl ?? null };
  if (kind === 'erp') {
    // Steps after an induced tachycardia are not baseline measurements.
    const stop = rows.findIndex((r) => r.sustained);
    if (stop >= 0) rows = rows.slice(0, stop + 1);
    const aerp = rows.find((r) => !r.capture)?.s2 ?? null;
    const avnErp = rows.find((r) => r.capture && r.ah == null)?.s2 ?? null;
    let jump = null;
    for (let i = 1; i < rows.length; i++) if (rows[i].ah != null && rows[i - 1].ah != null && rows[i].ah - rows[i - 1].ah >= 50) { jump = rows[i].s2; break; }
    return { aerp, avnErp, jump, echo: rows.find((r) => r.echo)?.s2 ?? null, induced: rows.find((r) => r.sustained)?.s2 ?? null };
  }
  if (kind === 'snrt') {
    const snrt = rows[0]?.snrt ?? null;
    return { snrt, csnrt: snrt != null ? snrt - sinusCl : null, abnormal: snrt != null && snrt - sinusCl > CSNRT_LIMIT };
  }
  return {};
}

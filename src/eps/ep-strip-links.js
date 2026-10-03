/*
 * Ladder on the channels: which deflection on HRA, His, CS and RV belongs to
 * one activation. Near-field A of the intracardiac channels are grouped into
 * atrial activations and near-field V (with the surface QRS) into
 * ventricular ones, the His potentials are kept, and the ladder's
 * conduction lines (ep-ladder.js buildLadder) are tied to the deflections
 * they join: A on the His catheter to its H (fast / slow pathway, block),
 * H to the RV V, A to V over an accessory pathway, and back up. Pure;
 * drawEgm draws the result on the strip.
 */
import { EP_CHANNELS } from './ep-cases.js';

// An activation: each deflection within GAP_MS of the previous one, all within SPAN_MS.
const GAP_MS = 60;
const SPAN_MS = { A: 180, V: 140 };
const SURFACE = new Set(EP_CHANNELS.filter((ch) => ch.surface).map((ch) => ch.id));
// Nodal lines meet the atrium on the His catheter.
const HIS_A = ['his-d', 'his-p'];
const NODAL = new Set(['fast', 'slow', 'retro-fast', 'retro-slow', 'block']);

const near = (e) => !e.far;

/** Near-field deflections of one type grouped into activations (each group ordered in time). */
function groups(events, type) {
  const all = Object.entries(events)
    .flatMap(([ch, list]) => list.filter((e) => e.type === type && near(e) && (type === 'V' || !SURFACE.has(ch))).map((e) => ({ ch, t: e.t })))
    .sort((a, b) => a.t - b.t);
  const out = [];
  for (const p of all) {
    const g = out.at(-1);
    // One deflection per channel and activation.
    if (g && p.t - g.points.at(-1).t <= GAP_MS && p.t - g.t <= SPAN_MS[type] && !g.points.some((q) => q.ch === p.ch)) g.points.push(p);
    else out.push({ kind: type, t: p.t, points: [p] });
  }
  return out;
}

const closest = (list, t, within) => {
  let best = null;
  for (const x of list) if (Math.abs(x.t - t) <= within && (!best || Math.abs(x.t - t) < Math.abs(best.t - t))) best = x;
  return best;
};

// The point of an activation where a conduction line meets it.
function anchor(group, row, kind) {
  if (!group) return null;
  if (row === 'A' && NODAL.has(kind)) return group.points.find((p) => p.ch === HIS_A[0]) || group.points.find((p) => p.ch === HIS_A[1]) || group.points[0];
  if (row === 'V') return group.points.find((p) => p.ch === 'rv') || group.points.find((p) => p.ch === HIS_A[0]) || group.points.find((p) => !SURFACE.has(p.ch)) || group.points[0];
  return group.points[0];
}

/**
 * @param {Record<string, object[]>} events the strip's events
 * @param {{ links: object[] }} ladder buildLadder() on the same events (same time axis)
 * @returns {{ groups: object[], his: object[], conduction: object[] }}
 *   groups: { kind: 'A'|'V', t, points: [{ ch, t }] }; his: [{ ch, t }];
 *   conduction: { kind, from: { ch, t }, to: { ch, t }, block? }
 */
export function stripLinks(events, ladder) {
  const atria = groups(events, 'A'), ventricles = groups(events, 'V');
  const his = Object.entries(events).filter(([ch]) => HIS_A.includes(ch))
    .flatMap(([ch, list]) => list.filter((e) => e.type === 'H' && near(e)).map((e) => ({ ch, t: e.t })));
  const hisD = his.filter((h) => h.ch === 'his-d');
  const end = (row, t, kind) => {
    if (row === 'AV') return closest(hisD, t, 2) || { ch: 'his-d', t };
    return anchor(closest(row === 'A' ? atria : ventricles, t, SPAN_MS[row]), row, kind);
  };
  const conduction = [];
  for (const link of ladder?.links || []) {
    const from = end(link.from[0], link.from[1], link.kind);
    // A block ends on the His catheter where the H would have been.
    const to = link.kind === 'block' ? { ch: 'his-d', t: link.to[1] } : end(link.to[0], link.to[1], link.kind);
    if (from && to) conduction.push({ kind: link.kind, from, to, block: link.kind === 'block' });
  }
  return { groups: [...atria, ...ventricles], his, conduction };
}

/** The same links on a time axis shifted by dt (ms). */
export function shiftLinks(links, dt) {
  const p = (x) => ({ ...x, t: x.t + dt });
  return {
    groups: links.groups.map((g) => ({ ...g, t: g.t + dt, points: g.points.map(p) })),
    his: links.his.map(p),
    conduction: links.conduction.map((c) => ({ ...c, from: p(c.from), to: p(c.to) }))
  };
}

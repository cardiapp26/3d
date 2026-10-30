/*
 * Impulse timeline of a recording: where the electrical impulse is at each moment, read from the
 * same ladder the strip shows (ep-ladder.js) and from the recording's own events. The result is a
 * list of timed items on a schematic frontal four-chamber heart (coordinates in the 360 x 300 view
 * box of ep-impulse-view.js):
 *   - atrium / ventricle: a wavefront spreading from a site over the chamber;
 *   - path: conduction along a named route (fast or slow AV nodal pathway, His-Purkinje,
 *     accessory pathway), forward or reverse;
 *   - block: the wavefront stops in the AV node;
 *   - flutter: a wavefront circling the tricuspid annulus; fibrillation: scattered wavelets.
 * impulseAt() gives the state at a time, impulseSteps() a "follow the impulse" walk through one
 * cycle. Pure functions; the drawing lives in ep-impulse-view.js. Teaching schematic.
 */

export const IMPULSE_VIEW = Object.freeze({ w: 360, h: 300 });

/** Conduction routes as point lists (drawn as polylines; reversed for retrograde conduction). */
export const ROUTES = Object.freeze({
  fast: [[160, 94], [165, 108], [168, 124], [170, 138]],
  slow: [[124, 141], [138, 147], [155, 146], [170, 138]],
  his: [[170, 138], [176, 152], [182, 168]],
  lbb: [[182, 168], [204, 180], [226, 204], [242, 234], [250, 262]],
  rbb: [[182, 168], [178, 196], [166, 226], [146, 258]],
  'ap-left-free-wall': [[314, 126], [319, 150], [315, 174]],
  'ap-right-free-wall': [[54, 126], [49, 150], [55, 174]],
  'ap-inferior-paraseptal': [[130, 126], [136, 150], [142, 174]],
  'ap-superior-paraseptal': [[152, 118], [156, 150], [160, 174]]
});

// Where an atrial activation starts, by the earliest channel (or the origin the ladder names).
const CHANNEL_SITES = Object.freeze({
  hra: [82, 62], 'his-p': [164, 118], 'his-d': [166, 124], 'his-2': [164, 118], 'his-3': [166, 124],
  'cs-910': [126, 140], 'cs-78': [150, 147], 'cs-56': [222, 150], 'cs-34': [272, 148], 'cs-12': [310, 140],
  pv: [312, 58], 'abl-d': [150, 132], 'abl-p': [150, 132],
  'halo-910': [70, 52], 'halo-78': [42, 80], 'halo-56': [36, 108], 'halo-34': [46, 136], 'halo-12': [92, 146]
});
export const SITES = Object.freeze({
  sa: [78, 46], kochApex: [164, 108], csOs: [124, 141], crista: [50, 72],
  septum: [186, 200], rvApex: [116, 262], lvFree: [292, 222], lvInferoseptal: [222, 252]
});
const ATRIAL_ORIGIN_SITES = Object.freeze({ 'avn-fast': SITES.kochApex, 'avn-slow': SITES.csOs });
const AP_ZONES = Object.freeze(['left-free-wall', 'right-free-wall', 'inferior-paraseptal', 'superior-paraseptal']);
export const FLUTTER_RING = Object.freeze({ cx: 110, cy: 102, rx: 50, ry: 34 });

const ATRIAL_GAP_MS = 60;   // atrial electrograms closer than this to the previous one belong to one activation
const ATRIAL_MIN_MS = 70;
const BLOCK_SHOW_MS = 260;
export const RECOVERY_MS = 160;   // an activated chamber fades back over this time
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** Length of a polyline. */
export function routeLength(points) {
  let len = 0;
  for (let i = 1; i < points.length; i++) len += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  return len;
}
/** The point a fraction p along a polyline. */
export function pointAlong(points, p) {
  let left = clamp01(p) * routeLength(points);
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1], [x1, y1] = points[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (left <= seg || i === points.length - 1) { const f = seg ? Math.min(1, left / seg) : 0; return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]; }
    left -= seg;
  }
  return points[0];
}

/** Accessory pathway zone of a recording: case zone, else the retrograde atrial origin. */
function apZoneOf({ pathwayZone, ladder, id = '' }) {
  if (AP_ZONES.includes(pathwayZone)) return pathwayZone;
  if (/right-(lateral|posterolateral)/.test(id)) return 'right-free-wall';
  if (/(^|-)ph-|para-?his|superior/.test(id)) return 'superior-paraseptal';
  if (/(^|-)ips|midseptal|posterior-?septal|pjrt|paraseptal/.test(id)) return 'inferior-paraseptal';
  if (ladder.atria.some((a) => a.origin === 'ap-ps')) return 'inferior-paraseptal';
  return 'left-free-wall';
}

/** Near-field atrial clusters (earliest channel and span). */
function atrialClusters(events) {
  const acts = Object.entries(events).filter(([ch]) => CHANNEL_SITES[ch])
    .flatMap(([ch, list]) => list.filter((e) => e.type === 'A' && !e.far).map((e) => ({ t: e.t, ch }))).sort((a, b) => a.t - b.t);
  const out = [];
  for (const a of acts) {
    const c = out.at(-1);
    if (c && a.t - c.end <= ATRIAL_GAP_MS) c.end = a.t; else out.push({ t: a.t, end: a.t, ch: a.ch });
  }
  return out;
}

function atrialSite(cluster, origin, mechanism, apZone) {
  if (origin === 'sinus' && cluster.ch === 'hra') return mechanism === 'focal-at' ? SITES.crista : SITES.sa;
  // Retrograde over a pathway: the atrium starts at the pathway's atrial end.
  if (origin === 'ap-left' || origin === 'ap-ps') return ROUTES[`ap-${apZone}`][0];
  return ATRIAL_ORIGIN_SITES[origin] || CHANNEL_SITES[cluster.ch] || SITES.sa;
}

function ventricleItem(v, events, apZone, mechanism) {
  const qrs = (events['ecg-ii'] || []).find((e) => e.type === 'V' && Math.abs(e.t - v.t) <= 70);
  const width = 80 * Math.max(0.6, (qrs?.sigma || 8) / 8);
  const centre = qrs ? qrs.t : v.t - 15;
  const seeds = v.origin === 'ap' ? [ROUTES[`ap-${apZone}`].at(-1)]
    : v.origin === 'rv' ? [SITES.rvApex]
      : v.origin === 'vt' ? [mechanism === 'fascicular-reentry' ? SITES.lvInferoseptal : SITES.lvFree]
        : [SITES.septum, ROUTES.lbb.at(-1), ROUTES.rbb.at(-1)];
  // Over the His-Purkinje system the myocardium starts once the bundle branches arrive (the
  // ventricular electrogram marks that), never before the His.
  const t0 = (v.origin || 'his') === 'his' ? Math.max(centre - width * 0.45, v.t - 18) : centre - width * 0.45;
  return { kind: 'ventricle', origin: v.origin || 'his', t: v.t, t0, t1: Math.max(t0 + 50, centre + width * 0.55), seeds, wide: width >= 110 };
}

function linkItem(link, apZone) {
  const [fromRow, t0] = link.from, [toRow, t1] = link.to;
  if (link.kind === 'block') return { kind: 'block', t0, t1: t0 + BLOCK_SHOW_MS, at: [170, 138] };
  const route = { fast: 'fast', slow: 'slow', 'retro-fast': 'fast', 'retro-slow': 'slow', hps: 'hps', ap: `ap-${apZone}`, 'ap-retro': `ap-${apZone}` }[link.kind];
  if (!route) return null;
  const reverse = link.kind.startsWith('retro') || link.kind === 'ap-retro';
  // Retrograde over the node from the ventricle: the impulse climbs the His first.
  const viaHis = reverse && fromRow === 'V' && (link.kind === 'retro-fast' || link.kind === 'retro-slow');
  return { kind: 'path', link: link.kind, route, reverse, viaHis, t0: Math.min(t0, t1), t1: Math.max(t0, t1), from: fromRow, to: toRow, tFrom: t0, tTo: t1 };
}

/** Flutter: cycle length and the time of each F wave trough (surface II or the halo). */
function flutterOf(events, mechanism) {
  const fs = (events['ecg-ii'] || []).filter((e) => e.type === 'F').map((e) => e.t).sort((a, b) => a - b);
  if (fs.length < 2 && mechanism !== 'flutter-ccw') return null;
  if (fs.length < 2) return null;
  return { cl: (fs.at(-1) - fs[0]) / (fs.length - 1), anchors: fs };
}

/**
 * The impulse timeline of a recording.
 * @param {{ events: Record<string, object[]>, windowMs: number, id?: string }} recording
 * @param {{ atria: object[], his: object[], ventricles: object[], links: object[] }} ladder from buildLadder
 * @param {{ mechanism?: string|null, pathwayZone?: string|null }} [context]
 */
export function impulseTimeline(recording, ladder, { mechanism = null, pathwayZone = null } = {}) {
  const events = recording.events;
  const apZone = apZoneOf({ pathwayZone, ladder, id: recording.id || '' });
  const items = [];
  const flutter = flutterOf(events, mechanism);
  const fib = Object.entries(events).filter(([ch]) => CHANNEL_SITES[ch]).flatMap(([ch, list]) => list.filter((e) => e.type === 'f').map((e) => ({ t: e.t, ch })));
  if (flutter) items.push({ kind: 'flutter', t0: 0, t1: recording.windowMs, ...flutter });
  else if (fib.length) for (const f of fib) items.push({ kind: 'wavelet', t0: f.t - 10, t1: f.t + 50, site: CHANNEL_SITES[f.ch], seed: Math.round(f.t) });
  else {
    for (const c of atrialClusters(events)) {
      const match = ladder.atria.find((a) => Math.abs(a.t - c.t) <= 20);
      const origin = match?.origin || 'sinus';
      const span = Math.max(ATRIAL_MIN_MS, c.end - c.t + 40);
      items.push({ kind: 'atrium', origin, ch: c.ch, t: c.t, t0: c.t - 15, t1: c.t - 15 + span, seeds: [atrialSite(c, origin, mechanism, apZone)] });
    }
  }
  for (const v of ladder.ventricles) items.push(ventricleItem(v, events, apZone, mechanism));
  for (const link of ladder.links) { const it = linkItem(link, apZone); if (it) items.push(it); }
  items.sort((a, b) => a.t0 - b.t0);
  return { items, apZone, windowMs: recording.windowMs, mechanism };
}

/** Flutter wavefront angle (radians) on the ring: counter-clockwise, up the septum at the F trough. */
export function flutterAngle(item, t) {
  const last = item.anchors.filter((a) => a <= t).at(-1) ?? item.anchors[0];
  const phase = 0.75 + (t - last) / item.cl;
  return (-90 - 360 * phase) * (Math.PI / 180);
}

/**
 * State at time t: each live item with its progress (0 to 1 while active) and recovery (1 just
 * after it ends, fading to 0 over RECOVERY_MS).
 */
export function impulseAt(timeline, t) {
  const out = [];
  for (const it of timeline.items) {
    if (t < it.t0 || t > it.t1 + RECOVERY_MS) continue;
    const progress = clamp01((t - it.t0) / Math.max(1, it.t1 - it.t0));
    const recovery = t <= it.t1 ? 1 : 1 - (t - it.t1) / RECOVERY_MS;
    out.push({ ...it, progress, recovery, active: t <= it.t1 });
  }
  return out;
}

const STEP_TEXT = {
  tr: {
    atrium: { sinus: 'Sinüs düğümü atriyumları aktive eder', paced: 'Pacing uyarısı atriyumu aktive eder', 'avn-fast': 'Atriyum septumdan, Koch üçgeninin tepesinden aktive olur', 'avn-slow': 'Atriyum CS ağzı çevresinden aktive olur', 'ap-left': 'Atriyum sol lateral yol ucundan (eksantrik) aktive olur', 'ap-ps': 'Atriyum paraseptal yol ucundan aktive olur', focal: 'Atriyal odak atriyumu aktive eder' },
    path: { fast: 'AV düğüm: hızlı yoldan aşağı', slow: 'AV düğüm: yavaş yoldan aşağı', hps: 'His-Purkinje: His ve dallar boyunca', ap: 'Aksesuar yoldan aşağı (preeksitasyon)', 'retro-fast': 'Hızlı yoldan yukarı (retrograd)', 'retro-slow': 'Yavaş yoldan yukarı (retrograd)', 'ap-retro': 'Aksesuar yoldan yukarı (retrograd)' },
    block: 'AV düğümde blok: uyarı ventriküle geçmez',
    ventricle: { his: 'Ventriküller dallar üzerinden aktive olur (dar QRS)', ap: 'Ventrikül yol ucundan aktive olur (geniş QRS, delta)', rv: 'RV pacing: ventrikül apeksten aktive olur (geniş QRS)', vt: 'Ventrikül VT çıkışından aktive olur (geniş QRS)' },
    flutter: 'Flutter dalgası triküspit halka çevresinde döner (septumda yukarı, lateral duvarda aşağı, istmustan geçer)',
    wavelet: 'AF: atriyumda dağınık, düzensiz dalgacıklar'
  },
  en: {
    atrium: { sinus: 'The sinus node activates the atria', paced: 'The pacing stimulus activates the atrium', 'avn-fast': 'The atrium activates from the septum, at the apex of Koch\'s triangle', 'avn-slow': 'The atrium activates around the CS ostium', 'ap-left': 'The atrium activates from the left lateral pathway end (eccentric)', 'ap-ps': 'The atrium activates from the paraseptal pathway end', focal: 'An atrial focus activates the atrium' },
    path: { fast: 'AV node: down the fast pathway', slow: 'AV node: down the slow pathway', hps: 'His-Purkinje: along the His and the bundle branches', ap: 'Down the accessory pathway (pre-excitation)', 'retro-fast': 'Up the fast pathway (retrograde)', 'retro-slow': 'Up the slow pathway (retrograde)', 'ap-retro': 'Up the accessory pathway (retrograde)' },
    block: 'Block in the AV node: the impulse does not reach the ventricles',
    ventricle: { his: 'The ventricles activate over the bundle branches (narrow QRS)', ap: 'The ventricle activates from the pathway end (wide QRS, delta)', rv: 'RV pacing: the ventricle activates from the apex (wide QRS)', vt: 'The ventricle activates from the VT exit (wide QRS)' },
    flutter: 'The flutter wave circles the tricuspid annulus (up the septum, down the lateral wall, through the isthmus)',
    wavelet: 'AF: scattered, irregular wavelets in the atria'
  }
};

/** Text of one item. */
export function stepText(item, lang = 'tr', mechanism = null) {
  const T = STEP_TEXT[lang === 'en' ? 'en' : 'tr'];
  if (item.kind === 'atrium') return T.atrium[item.origin === 'sinus' && mechanism === 'focal-at' ? 'focal' : item.origin] || T.atrium.sinus;
  if (item.kind === 'path') return T.path[item.link] || '';
  if (item.kind === 'block') return T.block;
  if (item.kind === 'ventricle') return T.ventricle[item.origin] || T.ventricle.his;
  return T[item.kind] || '';
}

/** The items of one beat, in causal order: atrium, AV conduction, His-Purkinje, ventricle, retrograde, atrium. */
function beatChain(items, v) {
  const paths = items.filter((it) => it.kind === 'path');
  const near = (a, b, ms = 3) => Math.abs(a - b) <= ms;
  const chain = [v];
  const down = paths.find((p) => p.to === 'V' && near(p.tTo, v.t));   // hps or ap
  if (down) {
    chain.unshift(down);
    const nodal = down.link === 'hps' ? paths.find((p) => p.to === 'AV' && p.from === 'A' && near(p.tTo, down.tFrom)) : null;
    if (nodal) chain.unshift(nodal);
    const start = nodal || down;
    const atrium = items.find((it) => it.kind === 'atrium' && near(it.t, start.tFrom, 25));
    if (atrium) chain.unshift(atrium);
  }
  // Retrograde to the atrium: from this beat's His (echo, reentry) or from its ventricle.
  const startUp = down?.link === 'hps' ? down.tFrom - 3 : v.t - 60;
  const up = paths.find((p) => p.to === 'A' && p.from !== 'A' && p.tFrom >= startUp && p.tFrom <= v.t + 150);
  if (up) {
    chain.push(up);
    const atrium = items.find((it) => it.kind === 'atrium' && near(it.t, up.tTo, 25));
    if (atrium) chain.push(atrium);
  }
  return chain;
}

/**
 * "Follow the impulse": the items of one representative beat (the second ventricular activation,
 * traced back to its atrial activation and on to its retrograde one), with blocked or dissociated
 * atrial activity of that cycle, in time order with the time to show each. Flutter and AF start
 * with their atrial step.
 */
export function impulseSteps(timeline, lang = 'tr') {
  const { items, mechanism } = timeline;
  const text = (it) => stepText(it, lang, mechanism);
  const at = (it) => Math.round(it.t0 + Math.min(40, (it.t1 - it.t0) * 0.45));
  const special = items.find((it) => it.kind === 'flutter') || items.find((it) => it.kind === 'wavelet');
  const vs = items.filter((it) => it.kind === 'ventricle');
  const anchor = vs[1] || vs[0];
  const steps = [];
  if (special) steps.push({ kind: special.kind, t: special.kind === 'flutter' ? special.anchors[0] : special.t0 + 25, text: text(special) });
  if (!anchor) return steps;
  const chain = beatChain(items, anchor);
  const prev = vs[vs.indexOf(anchor) - 1];
  const from = prev ? prev.t0 : anchor.t0 - 900;
  const extra = special ? [] : items.filter((it) => !chain.includes(it) && (it.kind === 'block' || it.kind === 'atrium') && it.t0 > from && it.t0 < anchor.t1);
  const blocks = special ? items.filter((it) => it.kind === 'block' && it.t0 > from && it.t0 < anchor.t1) : [];
  for (const it of [...chain, ...extra, ...blocks.slice(0, 1)]) steps.push({ kind: it.kind, t: at(it), text: text(it) });
  return steps.sort((a, b) => a.t - b.t);
}

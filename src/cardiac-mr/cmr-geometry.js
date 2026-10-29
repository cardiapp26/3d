// Pure geometry for the cardiac MR teaching schematics (no DOM).
// Every planning line is derived from landmark coordinates of the source
// schematic; no plane angle is hard-coded.

export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a, k) => ({ x: a.x * k, y: a.y * k });
export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const length = a => Math.hypot(a.x, a.y);
export const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
export const unit = a => { const l = length(a) || 1; return { x: a.x / l, y: a.y / l }; };
/** Rotate +90 degrees in screen coordinates. */
export const normal = a => ({ x: -a.y, y: a.x });

/** Acute-or-obtuse angle between two line directions, 0..180 degrees. */
export function angleBetweenDeg(u, v) {
  const c = dot(unit(u), unit(v));
  return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI;
}

/** Perpendicular distance of point p from the infinite line through a and b. */
export function distanceToLine(p, a, b) {
  const d = unit(sub(b, a));
  const r = sub(p, a);
  return Math.abs(r.x * d.y - r.y * d.x);
}

/** Segment through p and q, extended by `overshoot` px beyond each end. */
export function lineThrough(p, q, overshoot = 0) {
  const d = unit(sub(q, p));
  return { a: add(p, scale(d, -overshoot)), b: add(q, scale(d, overshoot)) };
}

/**
 * Local frame along a long axis: s = 0 at `base`, s = 1 at `apex`,
 * w = signed px offset along the +90 degree normal.
 */
export function frameOf(base, apex) {
  const axis = sub(apex, base);
  const L = length(axis);
  const u = unit(axis);
  const n = normal(u);
  return {
    base, apex, L, u, n,
    at: (s, w = 0) => add(base, add(scale(u, s * L), scale(n, w))),
    local: p => { const r = sub(p, base); return { s: dot(r, u) / L, w: dot(r, n) }; }
  };
}

/** Point on a short-axis ring; theta in degrees clockwise from image-up. */
export function polar(c, thetaDeg, r) {
  const t = thetaDeg * Math.PI / 180;
  return { x: c.x + r * Math.sin(t), y: c.y - r * Math.cos(t) };
}

/** Ellipse sampled in a local frame, returned as image points. */
export function ellipseInFrame(frame, s, w, rAlong, rAcross, steps = 28) {
  const centre = frame.at(s, w);
  return Array.from({ length: steps }, (_, i) => {
    const t = (i / steps) * Math.PI * 2;
    return add(centre, add(scale(frame.u, Math.cos(t) * rAlong), scale(frame.n, Math.sin(t) * rAcross)));
  });
}

// ---------------------------------------------------------------------------
// Landmarks of each source schematic (viewBox 0 0 360 300).

export const AXIAL = {
  apex: { x: 274, y: 104 },
  mitralA: { x: 178, y: 168 },
  mitralB: { x: 206, y: 194 }
};

export const TWO_CH = {
  apex: { x: 88, y: 238 },
  mitralA: { x: 214, y: 106 }, // anterior hinge
  mitralB: { x: 258, y: 146 } // inferior hinge
};

export const FOUR_CH = {
  apex: { x: 228, y: 268 },
  mitralA: { x: 184, y: 110 }, // septal hinge
  mitralB: { x: 236, y: 102 }, // lateral hinge
  tricuspidA: { x: 160, y: 124 }, // septal hinge
  tricuspidB: { x: 96, y: 118 } // free-wall hinge
};

export const THREE_CH = {
  apex: { x: 86, y: 240 },
  mitralA: { x: 222, y: 116 }, // anterior hinge (aorto-mitral continuity)
  mitralB: { x: 262, y: 160 }, // posterior hinge
  aorticA: { x: 214, y: 103 }, // posterior aortic hinge
  aorticB: { x: 176, y: 80 } // anterior aortic hinge (septal crest)
};

/** Short-axis model; viewed from the apex, RV on image left, anterior up. */
export const SAX = {
  centre: { x: 206, y: 150 },
  levels: {
    basal: { endo: 50, epi: 66, rv: [200, 345], rvDepth: 46 },
    mid: { endo: 44, epi: 62, rv: [210, 330], rvDepth: 50 },
    apical: { endo: 30, epi: 46, rv: [220, 320], rvDepth: 30 }
  },
  aorticValve: { theta: 305, r: 84, radius: 21 },
  papillary: { anterolateral: { theta: 72, r: 31 }, posteromedial: { theta: 196, r: 31 } },
  rvInsertion: { anterior: 330, inferior: 210 }
};

/** AHA 17-segment basal ring centres, degrees clockwise from anterior, apex view. */
export const AHA_SEGMENTS = {
  anterior: 0, anterolateral: 60, inferolateral: 120,
  inferior: 180, inferoseptal: 240, anteroseptal: 300
};

export const mitralCentre = view => mid(view.mitralA, view.mitralB);
export const tricuspidCentre = view => mid(view.tricuspidA, view.tricuspidB);
export const aorticCentre = view => mid(view.aorticA, view.aorticB);
export const saxAorticValveCentre = () => polar(SAX.centre, SAX.aorticValve.theta, SAX.aorticValve.r);

/** Step 1: on the axial localizer the 2CH line runs through apex and mitral centre. */
export function planTwoChamberOnAxial(view = AXIAL) {
  const m = mitralCentre(view);
  return { plane: '2ch', through: [view.apex, m], ...lineThrough(m, view.apex, 70) };
}

/**
 * Step 2: the 4CH plane is perpendicular to the 2CH image and contains the
 * long axis, so on the 2CH image it projects onto the apex-mitral line.
 */
export function planFourChamberOnTwoChamber(view = TWO_CH) {
  const m = mitralCentre(view);
  return { plane: '4ch', through: [view.apex, m], ...lineThrough(m, view.apex, 70) };
}

/** Step 3: SAX stack perpendicular to the apex-mitral axis, base to apex, equal spacing. */
export function planSaxStack(view, { count = 10, from = 0.04, to = 0.9, half = 92 } = {}) {
  const f = frameOf(mitralCentre(view), view.apex);
  const step = (to - from) / (count - 1);
  const lines = Array.from({ length: count }, (_, i) => {
    const s = from + i * step;
    const centre = f.at(s, 0);
    return { index: i, s, centre, a: f.at(s, -half), b: f.at(s, half), direction: f.n };
  });
  return { axis: { a: f.at(-0.25), b: f.at(1.12), direction: f.u }, lines, spacingPx: step * f.L, frame: f };
}

/** Step 4: on a basal SAX the 3CH line runs through LV centre and LVOT/aortic valve centre. */
export function planThreeChamberOnBasalSax() {
  const c = SAX.centre;
  const av = saxAorticValveCentre();
  return { plane: "3ch", through: [c, av], ...extendBoth(av, c, 40, 120) };
}

function extendBoth(p, q, beyondP, beyondQ) {
  const d = unit(sub(q, p));
  return { a: add(p, scale(d, -beyondP)), b: add(q, scale(d, beyondQ)) };
}

/** Long-axis planes around the LV on a mid SAX, from AHA segment positions. */
export function longAxisDial(radius = 96) {
  const c = SAX.centre;
  const pair = (from, to) => ({ a: polar(c, AHA_SEGMENTS[from], radius), b: polar(c, AHA_SEGMENTS[to], radius), from, to });
  return [
    { plane: '2ch', ...pair('anterior', 'inferior') },
    { plane: '4ch', ...pair('inferoseptal', 'anterolateral') },
    { plane: '3ch', ...pair('anteroseptal', 'inferolateral') }
  ];
}

// ---------------------------------------------------------------------------
// Illustrative quantities computed from the schematics.

/** LV endocardial half-width profile in the long-axis schematics (s, px). */
export const LV_ENDO_PROFILE = [[0, 30], [0.12, 40], [0.35, 42], [0.6, 36], [0.8, 24], [0.93, 9], [0.955, 0]];

export function profileAt(profile, s) {
  if (s <= profile[0][0]) return profile[0][1];
  for (let i = 1; i < profile.length; i += 1) {
    const [s1, w1] = profile[i];
    const [s0, w0] = profile[i - 1];
    if (s <= s1) return w0 + (w1 - w0) * (s - s0) / (s1 - s0);
  }
  return 0;
}

/**
 * Simpson (disc summation) volumes from the schematic 2CH SAX stack.
 * mmPerPx scales the drawing; ES shrinks radius and shortens the stack.
 */
export function simpsonStack({ count = 10, mmPerPx = 0.55, esRadius = 0.7, esLength = 0.9 } = {}) {
  const stack = planSaxStack(TWO_CH, { count });
  const thicknessMm = stack.spacingPx * mmPerPx;
  const slices = stack.lines.map(line => {
    const edR = profileAt(LV_ENDO_PROFILE, line.s) * mmPerPx;
    const esR = profileAt(LV_ENDO_PROFILE, Math.min(0.955, line.s / esLength)) * mmPerPx * esRadius;
    return { index: line.index, s: line.s, edRadiusMm: edR, esRadiusMm: esR, edAreaMm2: Math.PI * edR * edR, esAreaMm2: Math.PI * esR * esR };
  });
  const edv = slices.reduce((sum, sl) => sum + sl.edAreaMm2 * thicknessMm, 0) / 1000;
  const esv = slices.reduce((sum, sl) => sum + sl.esAreaMm2 * thicknessMm, 0) / 1000;
  return { slices, thicknessMm, edv, esv, sv: edv - esv, ef: (edv - esv) / edv };
}

/** ECV = (1 - Hct) x (dR1 myocardium / dR1 blood), T1 values in ms. */
export function extracellularVolume({ hct, myoPre, myoPost, bloodPre, bloodPost }) {
  const dR1Myo = 1 / myoPost - 1 / myoPre;
  const dR1Blood = 1 / bloodPost - 1 / bloodPre;
  return { dR1Myo, dR1Blood, lambda: dR1Myo / dR1Blood, ecv: (1 - hct) * dR1Myo / dR1Blood };
}
export const ECV_EXAMPLE = { hct: 0.42, myoPre: 1000, myoPost: 450, bloodPre: 1600, bloodPost: 280 };

/** Illustrative aortic flow curve (ml/s) over one RR interval with diastolic backflow. */
export function aorticFlowCurve({ rr = 900, samples = 90, peak = 420, backflow = 45 } = {}) {
  const dt = rr / samples;
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = i * dt;
    let q = 0;
    if (t <= 330) q = peak * Math.sin(Math.PI * t / 330) ** 1.6;
    else if (t >= 360 && t <= 860) q = -backflow * Math.sin(Math.PI * (t - 360) / 500) ** 0.8;
    return { t, q };
  });
}

/** Trapezoid integration of a flow curve: forward, backward, net (ml) and RF. */
export function integrateFlow(curve) {
  let forward = 0;
  let backward = 0;
  for (let i = 1; i < curve.length; i += 1) {
    const dt = (curve[i].t - curve[i - 1].t) / 1000;
    const q = (curve[i].q + curve[i - 1].q) / 2;
    if (q >= 0) forward += q * dt; else backward -= q * dt;
  }
  return { forward, backward, net: forward - backward, rf: backward / forward };
}

/**
 * Chamber deformation field (report section 12, phases C and D): per-chamber
 * law, the measured valve-to-apex frame, one field kernel shared by the
 * chamber walls, the papillary muscles, the leaflets and the overlays, and
 * the seam blend between neighbouring chambers. Rest poses are kept on the mesh.
 */
export const clamp01s = t => Math.max(0, Math.min(1, t));
const smooth01 = t => { const u = clamp01s(t); return u * u * (3 - 2 * u); };

export const BOUNDS_MARGIN = 0.2;

export function rememberRest(mesh) {
  const attr = mesh.geometry?.attributes?.position;
  if (!attr) return null;
  if (!mesh.userData.restPosition) {
    mesh.userData.restPosition = new Float32Array(attr.array);
    mesh.geometry.computeBoundingBox();
    // The sphere is used for culling and picking and is not recomputed while
    // the heart beats: pad it by the largest beat displacement.
    mesh.geometry.computeBoundingSphere();
    mesh.geometry.boundingSphere.radius += BOUNDS_MARGIN;
    const box = mesh.geometry.boundingBox;
    mesh.userData.motion = {
      minY: box.min.y,
      maxY: box.max.y,
      cx: (box.min.x + box.max.x) / 2,
      cz: (box.min.z + box.max.z) / 2
    };
  }
  return attr;
}

/**
 * Deformation law per chamber, as fractions of the long axis. Ventricles:
 * radial squeeze toward the axis growing to `radial` at the apex, and the AV
 * plane descending toward a still apex by `axial` of the ventricle length
 * (longitudinal shortening). Atria: radial squeeze and shortening toward the
 * valve plane with their own size, and their base carried by the AV-plane
 * descent, fading to still at the roof.
 */
export const CHAMBER_LAW = {
  lv: { radial: 0.11, axial: 0.07, torsion: 0.10, shape: 'ventricularShape', ventricle: true },
  rv: { radial: 0.11, axial: 0.07, torsion: 0, shape: 'ventricularShape', ventricle: true },
  la: { radial: 0.08, axial: 0.05, torsion: 0, shape: 'atrialShape', ventricle: false },
  ra: { radial: 0.08, axial: 0.05, torsion: 0, shape: 'atrialShape', ventricle: false },
};

/** AV-plane descent of a ventricle at size `shape`: along its axis, toward the apex. */
export function baseDescent(frame, law, shape) {
  const m = law.axial * frame.length * clamp01s(shape);
  return [frame.axis[0] * m, frame.axis[1] * m, frame.axis[2] * m];
}

/**
 * Per-frame scalars of one chamber field. `descent` is the AV-plane descent
 * this chamber carries at its base (a ventricle's own, an atrium's from its
 * ventricle); by default a ventricle computes its own and an atrium has none.
 */
export function fieldCoefficients(frame, law, shape, descent = law.ventricle ? baseDescent(frame, law, shape) : null) {
  const d = descent || [0, 0, 0];
  return { s: clamp01s(shape), radial: law.radial, axial: law.ventricle ? 0 : law.axial, torsion: law.torsion, ax: frame.axis[0], ay: frame.axis[1], az: frame.axis[2], dx: d[0], dy: d[1], dz: d[2] };
}

/**
 * The AV plane shared by the four chambers: through the midpoint of the two
 * AV orifices, normal along the mean ventricular axis. `below` reaches the
 * apex, `above` the atrial roofs.
 */
export function measureAvPlane(ventricles, atria) {
  const mean = list => [0, 1, 2].map(i => list.reduce((s, v) => s + v[i], 0) / list.length);
  const base = mean(ventricles.map(f => f.base));
  let axis = mean(ventricles.map(f => f.axis));
  const l = Math.hypot(...axis) || 1; axis = axis.map(a => a / l);
  const reach = (f, sign) => Math.max(1e-4, sign * [0, 1, 2].reduce((s, i) => s + (f.base[i] + f.axis[i] * f.length - base[i]) * axis[i], 0));
  const below = ventricles.reduce((s, f) => s + reach(f, 1), 0) / ventricles.length;
  const above = atria.length ? atria.reduce((s, f) => s + reach(f, -1), 0) / atria.length : below;
  return { base, axis, below, above };
}

/** Share of the AV-plane descent at a point: 1 on the plane, 0 at the apex and at the atrial roofs. */
export function descentWeight(plane, x, y, z) {
  const p = (x - plane.base[0]) * plane.axis[0] + (y - plane.base[1]) * plane.axis[1] + (z - plane.base[2]) * plane.axis[2];
  return p >= 0 ? clamp01s(1 - p / plane.below) : clamp01s(1 + p / plane.above);
}

/**
 * Rest terms of a point in a chamber frame, packed FIELD_TERMS per point:
 * radial vector, axial fraction t, clamped axial distance, and the share of
 * the AV-plane descent (from the shared plane when given, else 1 - t).
 */
export const FIELD_TERMS = 6;
export function fieldTerms(x, y, z, frame, out, o = 0, plane = null) {
  const [bx, by, bz] = frame.base, [ax, ay, az] = frame.axis;
  const dx = x - bx, dy = y - by, dz = z - bz;
  const proj = dx * ax + dy * ay + dz * az;
  const t = clamp01s(proj / frame.length);
  out[o] = dx - proj * ax; out[o + 1] = dy - proj * ay; out[o + 2] = dz - proj * az;
  out[o + 3] = t;
  out[o + 4] = Math.max(0, Math.min(frame.length, proj));
  out[o + 5] = plane ? descentWeight(plane, x, y, z) : 1 - t;
  return out;
}

/**
 * The field kernel: displacement of the point with terms at `terms[o..o+4]`
 * for coefficients `co`. Radial and torsion grow with t^2 from the valve
 * plane; the AV-plane descent takes its per-point share (full on the plane,
 * none at the apex or the atrial roof). Torsion rotates the already squeezed radial vector
 * (small-angle expansion; angle <= 0.1 rad, error below 1e-4).
 */
export function fieldAt(terms, o, co, out) {
  const rx = terms[o], ry = terms[o + 1], rz = terms[o + 2], t = terms[o + 3], tc = terms[o + 4], f = terms[o + 5];
  const k = co.s * t * t, q = co.radial * k, a = tc * co.axial * k;
  let x = -rx * q - co.ax * a + co.dx * f, y = -ry * q - co.ay * a + co.dy * f, z = -rz * q - co.az * a + co.dz * f;
  if (co.torsion) {
    const th = co.torsion * k, qq = 1 - q, c = -0.5 * th * th * qq, sn = th * (1 - th * th / 6) * qq;
    x += c * rx + sn * (co.ay * rz - co.az * ry);
    y += c * ry + sn * (co.az * rx - co.ax * rz);
    z += c * rz + sn * (co.ax * ry - co.ay * rx);
  }
  out[0] = x; out[1] = y; out[2] = z;
  return out;
}

/** Fallback frame from bounding bounds (world Y): the pre-phase-C law. */
export function frameFromMotion(motion, ventricle) {
  return { base: [motion.cx, ventricle ? motion.maxY : motion.minY, motion.cz], axis: [0, ventricle ? -1 : 1, 0], length: Math.max(1e-4, motion.maxY - motion.minY) };
}

/**
 * Measured chamber frame: from the valve orifice centre along the long axis,
 * to the apex (ventricles: farthest vertex) or into the chamber body (atria:
 * toward the centroid, as far as the chamber reaches).
 */
export function measureChamberFrame(rest, base, ventricle) {
  let ax = 0, ay = 0, az = 0;
  if (ventricle) {
    let best = -1;
    for (let i = 0; i < rest.length; i += 3) {
      const d = (rest[i] - base[0]) ** 2 + (rest[i + 1] - base[1]) ** 2 + (rest[i + 2] - base[2]) ** 2;
      if (d > best) { best = d; ax = rest[i] - base[0]; ay = rest[i + 1] - base[1]; az = rest[i + 2] - base[2]; }
    }
  } else {
    const n = rest.length / 3;
    for (let i = 0; i < rest.length; i += 3) { ax += rest[i] / n; ay += rest[i + 1] / n; az += rest[i + 2] / n; }
    ax -= base[0]; ay -= base[1]; az -= base[2];
  }
  const len = Math.hypot(ax, ay, az) || 1;
  const axis = [ax / len, ay / len, az / len];
  let length = 1e-4;
  for (let i = 0; i < rest.length; i += 3) length = Math.max(length, (rest[i] - base[0]) * axis[0] + (rest[i + 1] - base[1]) * axis[1] + (rest[i + 2] - base[2]) * axis[2]);
  return { base: [...base], axis, length };
}

// fieldAt is the per-vertex hot path: every caller passes Float32Array terms
// and a Float64Array result so the call stays monomorphic (and inlined).
const scratchTerms = new Float32Array(FIELD_TERMS);
const scratchOut = new Float64Array(3);

/**
 * Displacement of a point by a chamber of the given frame, size `shape` and
 * law (see fieldAt). `descent` as in fieldCoefficients. Writes into `out`.
 */
export function frameDisplacement(x, y, z, frame, shape, law, out = [0, 0, 0], descent) {
  fieldAt(fieldTerms(x, y, z, frame, scratchTerms), 0, fieldCoefficients(frame, law, shape, descent), scratchOut);
  out[0] = scratchOut[0]; out[1] = scratchOut[1]; out[2] = scratchOut[2];
  return out;
}

/** Write a mesh displaced by one chamber field (the LAA marker rides the LA field). */
export function writeWithFrame(mesh, frame, co, plane = null) {
  const attr = rememberRest(mesh);
  if (!attr) return;
  const rest = mesh.userData.restPosition, out = attr.array, d = scratchOut;
  for (let i = 0; i < rest.length; i += 3) {
    fieldAt(fieldTerms(rest[i], rest[i + 1], rest[i + 2], frame, scratchTerms, 0, plane), 0, co, d);
    out[i] = rest[i] + d[0]; out[i + 1] = rest[i + 1] + d[1]; out[i + 2] = rest[i + 2] + d[2];
  }
  attr.needsUpdate = true;
}

export const SEAM_BAND = 0.25;
/** Share of the neighbouring chamber's field at distance d from it (half at contact). */
export function seamWeight(d) {
  return d >= SEAM_BAND ? 0 : 0.5 * (1 - smooth01(d / SEAM_BAND));
}
